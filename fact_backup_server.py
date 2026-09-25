#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Serveur de sauvegarde local — Substances Architectes / Application de facturation
=================================================================================

Permet à l'application (Facturation.html) d'écrire de vraies sauvegardes .json
dans un dossier du Mac : export vers le dossier de base, export vers un dossier
spécifique, import du dernier export, et sauvegarde automatique à chaque
création / modification de contrat ou de facture.

LANCEMENT :
    python3 fact_backup_server.py

Le serveur écoute sur http://localhost:7788 et n'accepte que les connexions
locales (127.0.0.1). Laissez cette fenêtre ouverte pendant que vous utilisez l'app.

DOSSIER DE BASE :
    Par défaut : le sous-dossier « Sauvegarde Facturation » à côté de ce fichier.
    Pour le changer, modifiez BASE_DIR ci-dessous, ou lancez :
        FACT_BACKUP_DIR="/chemin/vers/mon/dossier" python3 fact_backup_server.py
"""

import http.server
import socketserver
import json
import os
import time
import glob
import urllib.parse
import subprocess

# ─────────────────────────── CONFIG ───────────────────────────
PORT = 7788
_HERE = os.path.dirname(os.path.abspath(__file__))
# Dossier de base des sauvegardes (modifiable). Priorité à la variable d'environnement.
BASE_DIR = os.environ.get("FACT_BACKUP_DIR", os.path.join(_HERE, "Sauvegarde Facturation"))
PREFIX = "facturation_data_"          # préfixe des fichiers de sauvegarde
# ───────────────────────────────────────────────────────────────

os.makedirs(BASE_DIR, exist_ok=True)


def _ts():
    return time.strftime("%Y%m%d_%H%M%S")


def _backups(folder):
    """Liste des sauvegardes d'un dossier, de la plus récente à la plus ancienne."""
    files = glob.glob(os.path.join(folder, PREFIX + "*.json"))
    files.sort(key=os.path.getmtime, reverse=True)
    return files


class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass  # silence

    # -- CORS commun à toutes les réponses --
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

    def _json(self, code, obj, extra=None):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        if extra:
            for k, v in extra.items():
                self.send_header(k, v)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        u = urllib.parse.urlparse(self.path)

        if u.path == "/ping":
            self._json(200, {"ok": True, "base": BASE_DIR, "port": PORT})
            return

        if u.path == "/list":
            files = _backups(BASE_DIR)
            items = [{
                "name": os.path.basename(p),
                "size": os.path.getsize(p),
                "mtime": int(os.path.getmtime(p)),
            } for p in files]
            self._json(200, {"ok": True, "base": BASE_DIR, "files": items})
            return

        if u.path == "/latest":
            files = _backups(BASE_DIR)
            if not files:
                self._json(404, {"ok": False, "error": "Aucune sauvegarde dans le dossier de base."})
                return
            try:
                with open(files[0], "rb") as fh:
                    data = fh.read()
            except Exception as e:
                self._json(500, {"ok": False, "error": str(e)})
                return
            self.send_response(200)
            self._cors()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("X-Backup-Name", os.path.basename(files[0]))
            self.send_header("Access-Control-Expose-Headers", "X-Backup-Name")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        if u.path == "/pickdir":
            # Ouvre le sélecteur de dossier NATIF du Finder (macOS) et renvoie le chemin choisi.
            # Le serveur tourne sur le Mac, il peut donc afficher un vrai dialogue « Choisir un dossier ».
            try:
                # On présente le dialogue via « System Events » avec activate → il passe au PREMIER PLAN
                # (sinon, lancé depuis un process non-GUI comme ce serveur, il peut apparaître derrière).
                script = (
                    'tell application "System Events"\n'
                    '  activate\n'
                    '  try\n'
                    '    set d to choose folder with prompt "Choisir le dossier de destination des sauvegardes"\n'
                    '    return POSIX path of d\n'
                    '  on error number -128\n'
                    '    return "__CANCELLED__"\n'
                    '  end try\n'
                    'end tell'
                )
                # -e par ligne pour un script multi-lignes fiable
                args = ["osascript"]
                for line in script.split("\n"):
                    args += ["-e", line]
                r = subprocess.run(args, capture_output=True, text=True, timeout=300)
                out = (r.stdout or "").strip()
                if r.returncode != 0 or out == "" or out == "__CANCELLED__":
                    self._json(200, {"ok": True, "cancelled": True})
                    return
                self._json(200, {"ok": True, "dir": out})
            except Exception as e:
                self._json(500, {"ok": False, "error": str(e)})
            return

        if u.path == "/revealpdf":
            # Révèle dans le Finder un PDF de « PDF Devis » (pour le partager de là).
            q = urllib.parse.parse_qs(u.query)
            name = os.path.basename((q.get("name", [""])[0]).strip())
            full = os.path.join(BASE_DIR, "PDF Devis", name)
            if not name or not os.path.isfile(full):
                self._json(404, {"ok": False, "error": "Fichier introuvable : %s" % name})
                return
            try:
                subprocess.Popen(["open", "-R", full])
                self._json(200, {"ok": True, "path": full})
            except Exception as e:
                self._json(500, {"ok": False, "error": str(e)})
            return

        if u.path == "/openpdf":
            # Ouvre dans Aperçu un PDF déjà enregistré dans « PDF Devis ».
            q = urllib.parse.parse_qs(u.query)
            name = os.path.basename((q.get("name", [""])[0]).strip())
            full = os.path.join(BASE_DIR, "PDF Devis", name)
            if not name or not os.path.isfile(full):
                self._json(404, {"ok": False, "error": "Fichier introuvable : %s" % name})
                return
            try:
                subprocess.Popen(["open", "-a", "Preview", full])
                self._json(200, {"ok": True, "path": full})
            except Exception as e:
                self._json(500, {"ok": False, "error": str(e)})
            return

        if u.path == "/getpdf":
            # Renvoie les octets d'un PDF de « PDF Devis » (pour la fusion côté app).
            q = urllib.parse.parse_qs(u.query)
            name = os.path.basename((q.get("name", [""])[0]).strip())
            full = os.path.join(BASE_DIR, "PDF Devis", name)
            if not name or not os.path.isfile(full):
                self._json(404, {"ok": False, "error": "Fichier introuvable : %s" % name})
                return
            try:
                with open(full, "rb") as fh:
                    data = fh.read()
                self.send_response(200)
                self._cors()
                self.send_header("Content-Type", "application/pdf")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
            except Exception as e:
                self._json(500, {"ok": False, "error": str(e)})
            return

        if u.path == "/copypdf":
            # Exporte (copie) un PDF de « PDF Devis » vers un dossier choisi.
            # &reveal=1 → révèle ensuite la copie dans le Finder.
            q = urllib.parse.parse_qs(u.query)
            name = os.path.basename((q.get("name", [""])[0]).strip())
            dest = os.path.expanduser((q.get("dest", [""])[0]).strip())
            full = os.path.join(BASE_DIR, "PDF Devis", name)
            if not name or not os.path.isfile(full):
                self._json(404, {"ok": False, "error": "Fichier introuvable : %s" % name})
                return
            if not dest or not os.path.isdir(dest):
                self._json(400, {"ok": False, "error": "Dossier de destination introuvable : %s" % dest})
                return
            try:
                import shutil
                out = os.path.join(dest, name)
                shutil.copy2(full, out)
                if (q.get("reveal", ["0"])[0]) == "1":
                    subprocess.Popen(["open", "-R", out])
                self._json(200, {"ok": True, "path": out})
            except Exception as e:
                self._json(500, {"ok": False, "error": str(e)})
            return

        if u.path == "/mailpdf":
            # Crée dans Apple Mail un brouillon (visible) avec le ou les PDF en pièces jointes
            # (plusieurs paramètres name= possibles).
            q = urllib.parse.parse_qs(u.query)
            names = [os.path.basename(n.strip()) for n in q.get("name", []) if n.strip()]
            to = (q.get("to", [""])[0]).strip()
            subject = (q.get("subject", [""])[0]).strip()
            body = (q.get("body", [""])[0])
            fulls = [os.path.join(BASE_DIR, "PDF Devis", n) for n in names]
            missing = [names[i] for i, f in enumerate(fulls) if not os.path.isfile(f)]
            if not names or missing:
                self._json(404, {"ok": False, "error": "Fichier introuvable : %s" % (", ".join(missing) or "(aucun)")})
                return
            try:
                esc = lambda s: s.replace("\\", "\\\\").replace('"', '\\"')
                lines = [
                    'tell application "Mail"',
                    '  activate',
                    # échapper d'abord, puis convertir les retours à la ligne en « " & return & " »
                    # (dans l'autre ordre, les guillemets insérés sont échappés et apparaissent en clair dans le mail)
                    '  set m to make new outgoing message with properties {subject:"%s", content:"%s" & return & return, visible:true}' % (esc(subject), esc(body.replace("\r", "")).replace("\n", '" & return & "')),
                ]
                if to:
                    lines.append('  tell m to make new to recipient at end of to recipients with properties {address:"%s"}' % esc(to))
                for full in fulls:
                    lines.append('  tell content of m to make new attachment with properties {file name:POSIX file "%s"} at after last paragraph' % esc(full))
                lines.append('end tell')
                args = ["osascript"]
                for line in lines:
                    args += ["-e", line]
                r = subprocess.run(args, capture_output=True, text=True, timeout=60)
                if r.returncode != 0:
                    self._json(500, {"ok": False, "error": (r.stderr or "osascript a échoué").strip()})
                    return
                self._json(200, {"ok": True})
            except Exception as e:
                self._json(500, {"ok": False, "error": str(e)})
            return

        self._json(404, {"ok": False, "error": "Ressource inconnue."})

    def do_POST(self):
        u = urllib.parse.urlparse(self.path)

        if u.path == "/saveas":
            # Fenêtre Finder « Enregistrer sous » (macOS) puis écriture du corps reçu
            # à l'emplacement choisi.  ?name=<nom proposé>&prompt=<titre du dialogue>
            q = urllib.parse.parse_qs(u.query)
            name = os.path.basename((q.get("name", ["export.txt"])[0]).strip() or "export.txt")
            prompt = (q.get("prompt", ["Enregistrer sous"])[0]).strip() or "Enregistrer sous"
            length = int(self.headers.get("Content-Length", 0))
            data = self.rfile.read(length)
            esc = lambda s: s.replace("\\", "\\\\").replace('"', '\\"')
            script = (
                'tell application "System Events"\n'
                '  activate\n'
                '  try\n'
                '    set f to choose file name with prompt "%s" default name "%s"\n'
                '    return POSIX path of f\n'
                '  on error number -128\n'
                '    return "__CANCELLED__"\n'
                '  end try\n'
                'end tell'
            ) % (esc(prompt), esc(name))
            try:
                args = ["osascript"]
                for line in script.split("\n"):
                    args += ["-e", line]
                r = subprocess.run(args, capture_output=True, text=True, timeout=600)
                out = (r.stdout or "").strip()
                if r.returncode != 0 or out == "" or out == "__CANCELLED__":
                    self._json(200, {"ok": True, "cancelled": True})
                    return
                # conserver l'extension proposée si l'utilisateur l'a retirée
                ext = os.path.splitext(name)[1]
                if ext and not out.lower().endswith(ext.lower()):
                    out += ext
                with open(out, "wb") as fh:
                    fh.write(data)
                self._json(200, {"ok": True, "path": out})
            except Exception as e:
                self._json(500, {"ok": False, "error": str(e)})
            return

        if u.path == "/pdf":
            # Reçoit un PDF (corps binaire) et l'ouvre dans Aperçu (macOS).
            #   ?name=<fichier.pdf>       nom du fichier
            #   &mode=open                fichier temporaire, juste ouvert dans Aperçu
            #   &mode=save                enregistré dans BASE_DIR/"PDF Devis"/ puis ouvert
            q = urllib.parse.parse_qs(u.query)
            name = os.path.basename((q.get("name", ["document.pdf"])[0]).strip() or "document.pdf")
            if not name.lower().endswith(".pdf"):
                name += ".pdf"
            mode = (q.get("mode", ["open"])[0]).strip()
            do_open = (q.get("open", ["1"])[0]).strip() != "0"
            length = int(self.headers.get("Content-Length", 0))
            data = self.rfile.read(length)
            try:
                if mode == "save":
                    target = os.path.join(BASE_DIR, "PDF Devis")
                else:
                    target = os.path.join("/tmp", "fact_pdf")
                os.makedirs(target, exist_ok=True)
                full = os.path.join(target, name)
                with open(full, "wb") as fh:
                    fh.write(data)
                opened = False
                if do_open:
                    opened = True
                    try:
                        subprocess.Popen(["open", "-a", "Preview", full])
                    except Exception:
                        try:
                            subprocess.Popen(["open", full])
                        except Exception:
                            opened = False
                self._json(200, {"ok": True, "name": name, "path": full,
                                 "saved": mode == "save", "opened": opened})
            except Exception as e:
                self._json(500, {"ok": False, "error": str(e)})
            return

        if u.path != "/save":
            self._json(404, {"ok": False, "error": "Ressource inconnue."})
            return

        q = urllib.parse.parse_qs(u.query)
        target = (q.get("dir", [None])[0] or BASE_DIR).strip()
        target = os.path.expanduser(target)

        length = int(self.headers.get("Content-Length", 0))
        data = self.rfile.read(length)

        try:
            os.makedirs(target, exist_ok=True)
            name = PREFIX + _ts() + ".json"
            full = os.path.join(target, name)
            with open(full, "wb") as fh:
                fh.write(data)
            self._json(200, {"ok": True, "name": name, "path": full})
        except Exception as e:
            self._json(500, {"ok": False, "error": str(e)})


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    print("─" * 64)
    print(" Serveur de sauvegarde — Substances Architectes / Facturation")
    print(" URL       : http://localhost:%d" % PORT)
    print(" Dossier   : %s" % BASE_DIR)
    print(" (laissez cette fenêtre ouverte ; Ctrl+C pour arrêter)")
    print("─" * 64)
    with Server(("127.0.0.1", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nArrêt du serveur.")

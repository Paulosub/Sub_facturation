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

# ── SUBGestion (06.10.2026) : sauvegardes de la base de gestion, fichiers du dépôt, PDF ──
GESTION_DIR = os.environ.get("GESTION_BACKUP_DIR", os.path.join(_HERE, "Sauvegarde Gestion"))
FICHIERS_DIR = os.path.join(GESTION_DIR, "fichiers")                     # contenus des fichiers joints, rangés par empreinte
ANCIEN_DEPOT = os.path.join(_HERE, "Sauvegarde DeltaSub", "fichiers", "objets")   # dépôt de l'ancien serveur DeltaSub (lecture)
GESTION_PREFIX = "deltasub_base_"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
import hashlib, re, shutil, tempfile


def _ts():
    return time.strftime("%Y%m%d_%H%M%S")


def _backups(folder):
    """Liste des sauvegardes d'un dossier, de la plus récente à la plus ancienne."""
    files = glob.glob(os.path.join(folder, PREFIX + "*.json"))
    files.sort(key=os.path.getmtime, reverse=True)
    return files


def _origine_ok(h):
    """Routes SUBGestion : seulement les pages locales (fichier ouvert par double-clic → Origin « null », ou localhost)."""
    o = h.headers.get("Origin")
    return o in (None, "null", "file://") or bool(re.match(r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$", o or ""))


def _rotation(dossier):
    """Garde toutes les sauvegardes des 48 dernières heures, une par jour pendant 60 jours, une par mois au-delà."""
    fs = sorted(glob.glob(os.path.join(dossier, GESTION_PREFIX + "*.json.gz")), key=os.path.getmtime, reverse=True)
    now, vus, garder = time.time(), set(), set()
    for f in fs:
        age = now - os.path.getmtime(f)
        t = time.localtime(os.path.getmtime(f))
        if age < 48 * 3600:
            garder.add(f); continue
        cle = time.strftime("%Y%m%d", t) if age < 60 * 86400 else time.strftime("%Y%m", t)
        if cle not in vus:
            vus.add(cle); garder.add(f)
    for f in fs:
        if f not in garder:
            try: os.remove(f)
            except OSError: pass


def _objet(sha):
    """Chemin du contenu d'empreinte sha (dépôt SUBGestion, sinon ancien dépôt DeltaSub), ou None."""
    if not re.fullmatch(r"[0-9a-f]{64}", sha or ""):
        return None
    for base in (FICHIERS_DIR, ANCIEN_DEPOT):
        f = os.path.join(base, sha[:2], sha)
        if os.path.isfile(f):
            return f
    return None


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
            self._json(200, {"ok": True, "base": BASE_DIR, "port": PORT, "gestion": GESTION_DIR,
                             "pdf": os.path.exists(CHROME)})
            return

        if u.path.startswith("/gestion/") or u.path.startswith("/fichiers/"):
            if not _origine_ok(self):
                self._json(403, {"ok": False, "error": "Origine refusée."}); return
            if u.path == "/gestion/liste":
                os.makedirs(GESTION_DIR, exist_ok=True)
                fs = sorted(glob.glob(os.path.join(GESTION_DIR, GESTION_PREFIX + "*.json.gz")), key=os.path.getmtime, reverse=True)
                self._json(200, {"ok": True, "dossier": GESTION_DIR, "fichiers": [
                    {"nom": os.path.basename(f), "taille": os.path.getsize(f), "mtime": int(os.path.getmtime(f))} for f in fs]})
                return
            if u.path == "/gestion/lire":   # une sauvegarde de la liste (restauration depuis SUBGestion)
                nom = os.path.basename(urllib.parse.parse_qs(u.query).get("nom", [""])[0])
                f = os.path.join(GESTION_DIR, nom)
                if not re.fullmatch(GESTION_PREFIX + r"\d{8}_\d{4,6}\.json\.gz", nom) or not os.path.isfile(f):
                    self._json(404, {"ok": False, "error": "Sauvegarde introuvable."}); return
                with open(f, "rb") as fh:
                    data = fh.read()
                self.send_response(200); self._cors()
                self.send_header("Content-Type", "application/gzip")
                self.send_header("Content-Length", str(len(data))); self.end_headers(); self.wfile.write(data)
                return
            if u.path == "/fichiers/lire":
                f = _objet((urllib.parse.parse_qs(u.query).get("sha", [""])[0]).lower())
                if not f:
                    self._json(404, {"ok": False, "error": "Fichier absent du dépôt."}); return
                with open(f, "rb") as fh:
                    data = fh.read()
                self.send_response(200); self._cors()
                self.send_header("Content-Type", "application/octet-stream")
                self.send_header("Content-Length", str(len(data))); self.end_headers(); self.wfile.write(data)
                return
            self._json(404, {"ok": False, "error": "Ressource inconnue."}); return

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

        if u.path == "/pickfile":
            # Sélecteur de FICHIER natif (annexes de contrat) → chemin POSIX.
            try:
                script = (
                    'tell application "System Events"\n'
                    '  activate\n'
                    '  try\n'
                    '    set f to choose file with prompt "Choisir le fichier de l\'annexe"\n'
                    '    return POSIX path of f\n'
                    '  on error number -128\n'
                    '    return "__CANCELLED__"\n'
                    '  end try\n'
                    'end tell'
                )
                args = ["osascript"]
                for line in script.split("\n"):
                    args += ["-e", line]
                r = subprocess.run(args, capture_output=True, text=True, timeout=300)
                out = (r.stdout or "").strip()
                if r.returncode != 0 or out == "" or out == "__CANCELLED__":
                    self._json(200, {"ok": True, "cancelled": True})
                    return
                self._json(200, {"ok": True, "path": out})
            except Exception as e:
                self._json(500, {"ok": False, "error": str(e)})
            return

        if u.path == "/rawpath":
            # Sert le contenu d'un fichier d'annexe (affichage dans la fenêtre « Montrer »).
            q = urllib.parse.parse_qs(u.query)
            path = os.path.expanduser((q.get("path", [""])[0]).strip())
            if not path or not os.path.isfile(path):
                self._json(404, {"ok": False, "error": "Fichier introuvable : %s" % path})
                return
            import mimetypes
            ctype = mimetypes.guess_type(path)[0] or "application/octet-stream"
            try:
                with open(path, "rb") as fh:
                    data = fh.read()
                self.send_response(200)
                self._cors()
                self.send_header("Content-Type", ctype)
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
            except Exception as e:
                self._json(500, {"ok": False, "error": str(e)})
            return

        if u.path == "/copypath":
            # Exporte (copie) un fichier d'annexe vers un dossier choisi.
            q = urllib.parse.parse_qs(u.query)
            path = os.path.expanduser((q.get("path", [""])[0]).strip())
            dest = os.path.expanduser((q.get("dest", [""])[0]).strip())
            if not path or not os.path.isfile(path) or not dest or not os.path.isdir(dest):
                self._json(404, {"ok": False, "error": "Fichier ou dossier introuvable."})
                return
            try:
                import shutil
                out = os.path.join(dest, os.path.basename(path))
                shutil.copy2(path, out)
                subprocess.Popen(["open", "-R", out])
                self._json(200, {"ok": True, "path": out})
            except Exception as e:
                self._json(500, {"ok": False, "error": str(e)})
            return

        if u.path == "/calc":
            # Ouvre la Calculette du Mac (icône calculatrice de la fenêtre de paiement).
            try:
                subprocess.Popen(["open", "-a", "Calculator"])
                self._json(200, {"ok": True})
            except Exception as e:
                self._json(500, {"ok": False, "error": str(e)})
            return

        if u.path in ("/openpath", "/revealpath"):
            # Ouvre (ou révèle dans le Finder) un fichier d'annexe existant.
            q = urllib.parse.parse_qs(u.query)
            path = os.path.expanduser((q.get("path", [""])[0]).strip())
            if not path or not os.path.exists(path):
                self._json(404, {"ok": False, "error": "Fichier introuvable : %s" % path})
                return
            try:
                subprocess.Popen(["open", "-R", path] if u.path == "/revealpath" else ["open", path])
                self._json(200, {"ok": True})
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
            dossier = "PDF PV" if (q.get("dossier", [""])[0]).strip() == "pv" else "PDF Devis"   # PV de chantier : dossier propre
            fulls = [os.path.join(BASE_DIR, dossier, n) for n in names]
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
                for adr in [a.strip() for a in re.split(r"[,;]", to) if a.strip()]:   # plusieurs destinataires (PV : tous les « D »)
                    lines.append('  tell m to make new to recipient at end of to recipients with properties {address:"%s"}' % esc(adr))
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
                elif mode == "pv":   # PV de chantier envoyé (pièce jointe de l'e-mail)
                    target = os.path.join(BASE_DIR, "PDF PV")
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

        if u.path.startswith("/gestion/") or u.path.startswith("/fichiers/") or u.path == "/html2pdf":
            if not _origine_ok(self):
                self._json(403, {"ok": False, "error": "Origine refusée."}); return
            q = urllib.parse.parse_qs(u.query)
            length = int(self.headers.get("Content-Length", 0))
            data = self.rfile.read(length)
            try:
                if u.path == "/gestion/sauver":   # base de gestion (.json.gz produit par SUBGestion)
                    if data[:2] != b"\x1f\x8b":
                        self._json(400, {"ok": False, "error": "Contenu non compressé (gzip attendu)."}); return
                    os.makedirs(GESTION_DIR, exist_ok=True)
                    nom = GESTION_PREFIX + time.strftime("%Y%m%d_%H%M%S") + ".json.gz"
                    tmp = os.path.join(GESTION_DIR, "." + nom + ".tmp")
                    with open(tmp, "wb") as fh:
                        fh.write(data)
                    os.replace(tmp, os.path.join(GESTION_DIR, nom))   # écriture atomique
                    _rotation(GESTION_DIR)
                    self._json(200, {"ok": True, "nom": nom, "dossier": GESTION_DIR, "taille": len(data)}); return
                if u.path == "/fichiers/ranger":   # copie disque d'un fichier joint (dédupliquée par empreinte)
                    sha = hashlib.sha256(data).hexdigest()
                    if (q.get("sha", [sha])[0]).lower() != sha:
                        self._json(400, {"ok": False, "error": "Empreinte incorrecte."}); return
                    d = os.path.join(FICHIERS_DIR, sha[:2]); os.makedirs(d, exist_ok=True)
                    f = os.path.join(d, sha)
                    if not os.path.exists(f):
                        with open(f + ".tmp", "wb") as fh:
                            fh.write(data)
                        os.replace(f + ".tmp", f)
                    self._json(200, {"ok": True, "sha": sha, "taille": len(data)}); return
                if u.path == "/html2pdf":   # HTML complet → PDF (Chrome sans fenêtre, polices Akkurat du Mac)
                    if not os.path.exists(CHROME):
                        self._json(501, {"ok": False, "error": "Google Chrome est introuvable sur ce Mac."}); return
                    html = json.loads(data.decode("utf-8")).get("html", "")
                    tmpd = tempfile.mkdtemp(prefix="sg_pdf_")
                    try:
                        src, out = os.path.join(tmpd, "doc.html"), os.path.join(tmpd, "doc.pdf")
                        with open(src, "w", encoding="utf-8") as fh:
                            fh.write(html)
                        # Chrome écrit le PDF tout de suite mais ne se termine pas toujours : on attend un PDF complet (%%EOF) puis on l'arrête
                        pr = subprocess.Popen([CHROME, "--headless=new", "--disable-gpu", "--no-first-run", "--no-pdf-header-footer",
                                               "--user-data-dir=" + os.path.join(tmpd, "profil"), "--print-to-pdf=" + out, "file://" + src],
                                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
                        fin = time.time() + 90
                        try:
                            while time.time() < fin and pr.poll() is None:
                                time.sleep(0.25)
                                if os.path.exists(out) and os.path.getsize(out) > 0:
                                    with open(out, "rb") as fh:
                                        fh.seek(max(0, os.path.getsize(out) - 64))
                                        if b"%%EOF" in fh.read():
                                            break
                        finally:
                            import signal   # tout le groupe : Chrome et ses processus auxiliaires
                            try: os.killpg(pr.pid, signal.SIGTERM)
                            except OSError: pass
                            try: pr.wait(5)
                            except subprocess.TimeoutExpired:
                                try: os.killpg(pr.pid, signal.SIGKILL)
                                except OSError: pass
                        if not os.path.exists(out):
                            self._json(500, {"ok": False, "error": "La création du PDF a échoué."}); return
                        with open(out, "rb") as fh:
                            pdf = fh.read()
                    finally:
                        shutil.rmtree(tmpd, ignore_errors=True)
                    self.send_response(200); self._cors()
                    self.send_header("Content-Type", "application/pdf")
                    self.send_header("Content-Length", str(len(pdf))); self.end_headers(); self.wfile.write(pdf)
                    return
            except Exception as e:
                self._json(500, {"ok": False, "error": str(e)}); return
            self._json(404, {"ok": False, "error": "Ressource inconnue."}); return

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
    print(" Gestion   : %s" % GESTION_DIR)
    print(" (laissez cette fenêtre ouverte ; Ctrl+C pour arrêter)")
    print("─" * 64)
    with Server(("127.0.0.1", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nArrêt du serveur.")

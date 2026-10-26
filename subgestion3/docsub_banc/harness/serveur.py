#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Banc d'essai « Documents Substances » — petit serveur local (127.0.0.1 seulement).

Sert les fichiers de l'atelier (dossier docsub : res/, harness/…), le fichier du projet subgestion3/<nom>.js
(lu à chaque requête, jamais modifié), et reçoit de la page de banc :
  POST /enregistrer?nom=<fichier>  → écrit les octets reçus dans le dossier de sortie (PDF, TXT, JSON)
  POST /journal                    → une ligne JSON ajoutée à <sortie>/journal.jsonl (et affichée)
  POST /fin                        → bilan écrit dans <sortie>/fin.json, puis arrêt du serveur
Arrêt automatique après --delai secondes (bilan « délai dépassé »).
"""
import argparse, json, os, re, sys, threading, time, urllib.parse
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

ap = argparse.ArgumentParser()
ap.add_argument('--racine', required=True)            # dossier docsub de l'atelier
ap.add_argument('--projet', required=True)            # dossier du projet (dépôt git)
ap.add_argument('--sortie', required=True)
ap.add_argument('--fichier-port', required=True)
ap.add_argument('--delai', type=int, default=900)
A = ap.parse_args()
os.makedirs(A.sortie, exist_ok=True)
JOURNAL = os.path.join(A.sortie, 'journal.jsonl')
open(JOURNAL, 'w').close()
FIN = {'fait': False}

def nom_sur(n):
    n = os.path.basename(n or '')
    n = re.sub(r'[^A-Za-z0-9._\-À-ÿ]+', '_', n)
    return n or 'sans_nom.bin'

class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=A.racine, **k)
    def log_message(self, *a):
        pass
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def do_GET(self):
        u = urllib.parse.urlparse(self.path)
        if u.path.startswith('/projet/'):
            rel = urllib.parse.unquote(u.path[len('/projet/'):])
            if not re.fullmatch(r'subgestion3/[A-Za-z0-9_\-]+\.js', rel):
                self.send_error(403, 'fichier du projet non autorisé'); return
            p = os.path.join(A.projet, rel)
            if not os.path.isfile(p):
                self.send_error(404, 'introuvable : ' + rel); return
            b = open(p, 'rb').read()
            self.send_response(200)
            self.send_header('Content-Type', 'text/javascript; charset=utf-8')
            self.send_header('Content-Length', str(len(b)))
            self.end_headers(); self.wfile.write(b); return
        return super().do_GET()
    def lire_corps(self):
        n = int(self.headers.get('Content-Length') or 0)
        return self.rfile.read(n) if n else b''
    def ok(self, txt='ok'):
        b = txt.encode('utf-8')
        self.send_response(200); self.send_header('Content-Type', 'text/plain; charset=utf-8')
        self.send_header('Content-Length', str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_POST(self):
        u = urllib.parse.urlparse(self.path); q = urllib.parse.parse_qs(u.query)
        corps = self.lire_corps()
        if u.path == '/enregistrer':
            nom = nom_sur((q.get('nom') or [''])[0])
            with open(os.path.join(A.sortie, nom), 'wb') as f: f.write(corps)
            return self.ok(nom)
        if u.path == '/journal':
            try: e = json.loads(corps.decode('utf-8'))
            except Exception: e = {'niveau': 'brut', 'msg': corps.decode('utf-8', 'replace')}
            with open(JOURNAL, 'a', encoding='utf-8') as f: f.write(json.dumps(e, ensure_ascii=False) + '\n')
            if e.get('niveau') in ('erreur', 'alerte', 'info'):
                print('[%s] %s' % (e.get('niveau'), e.get('msg')), flush=True)
            return self.ok()
        if u.path == '/fin':
            with open(os.path.join(A.sortie, 'fin.json'), 'wb') as f: f.write(corps)
            self.ok(); FIN['fait'] = True
            threading.Thread(target=lambda: (time.sleep(0.3), srv.shutdown()), daemon=True).start()
            return
        self.send_error(404)

srv = ThreadingHTTPServer(('127.0.0.1', 0), H)
with open(A.fichier_port, 'w') as f: f.write(str(srv.server_address[1]))

def garde():
    time.sleep(A.delai)
    if not FIN['fait']:
        with open(os.path.join(A.sortie, 'fin.json'), 'w', encoding='utf-8') as f:
            json.dump({'etat': 'délai dépassé', 'delai': A.delai}, f, ensure_ascii=False)
        srv.shutdown()
threading.Thread(target=garde, daemon=True).start()
srv.serve_forever()

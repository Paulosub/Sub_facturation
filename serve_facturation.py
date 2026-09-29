#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Serveur d'aperçu local pour Facturation.html — http://localhost:7654.

AUTO-RÉPARATION : /tmp est effacé au redémarrage du Mac, ce qui supprimait le serveur
et la copie d'aperçu. Ce script vit désormais dans le dossier de l'application (persistant)
et, à chaque démarrage, (re)copie Facturation.html depuis la source vers /tmp/fact_preview.
Ainsi, relancer l'aperçu suffit — plus besoin de tout recréer à la main.
"""
import http.server
import socketserver
import os
import shutil

PORT = 7654
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "Facturation.html")   # fichier source (persistant)
ROOT = "/tmp/fact_preview"                       # dossier d'aperçu (volatil)

os.makedirs(ROOT, exist_ok=True)
# Auto-réparation : recopie la dernière version de l'app dans le dossier d'aperçu au démarrage.
try:
    if os.path.exists(SRC):
        shutil.copy2(SRC, os.path.join(ROOT, "Facturation.html"))
        print("Aperçu synchronisé depuis la source : %s" % SRC)
    else:
        print("ATTENTION : source introuvable : %s" % SRC)
except Exception as e:
    print("Avertissement (copie source -> aperçu) :", e)

os.chdir(ROOT)


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Pas de cache : chaque rechargement récupère la dernière version.
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self):
        if self.path == "/" or self.path.split("?")[0] == "/":
            self.path = "/Facturation.html"
        return super().do_GET()

    def log_message(self, *args):
        pass  # silence


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    with Server(("127.0.0.1", PORT), Handler) as httpd:
        print("Aperçu Facturation servi sur http://localhost:%d (dossier %s)" % (PORT, ROOT))
        httpd.serve_forever()

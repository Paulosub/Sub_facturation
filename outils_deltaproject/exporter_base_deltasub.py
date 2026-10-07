#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Convertit une base DeltaSub (.sqlite, ex. une copie de « Sauvegarde DeltaSub ») en fichier .json.gz à importer
dans DeltaSub.html ouvert SANS serveur (Fichier ▸ Importer une base…, ou l'écran d'accueil d'une base vide).

    python3 outils_deltaproject/exporter_base_deltasub.py                       (dernière copie de « Sauvegarde DeltaSub »)
    python3 outils_deltaproject/exporter_base_deltasub.py <base.sqlite> [<sortie.json.gz>]

Lecture seule de la base. Format = celui de DeltaSub : {"format":"deltasub-base","version":1,"seq":n,"ids":{t:prochain id},
"tables":{t:{id:{"s":seq,"v":{…}}}}} ; les enregistrements supprimés ne sont pas repris. Les mots de passe, sessions et
verrous (tables auth_*, lock) ne sont jamais exportés. Bibliothèque standard de Python uniquement ; aucun serveur.
"""
import datetime, glob, gzip, json, os, sqlite3, sys
from urllib.parse import quote

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else None
    if not src:
        L = sorted(glob.glob(os.path.join(HERE, "Sauvegarde DeltaSub", "deltasub_*.sqlite")))
        if not L:
            sys.exit("Aucune copie dans « Sauvegarde DeltaSub » : indiquez le fichier .sqlite.")
        src = L[-1]
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(
        os.path.dirname(os.path.abspath(src)),
        "deltasub_base_%s.json.gz" % datetime.datetime.now().strftime("%Y%m%d_%H%M"))
    c = sqlite3.connect("file:%s?mode=ro&immutable=1" % quote(os.path.abspath(src)), uri=True)
    seq = int((c.execute("SELECT value FROM meta WHERE name='seq'").fetchone() or [0])[0])
    ids = {}
    for name, value in c.execute("SELECT name, value FROM meta WHERE name LIKE 'next_id:%'"):
        ids[name[8:]] = int(value)
    n = 0
    with gzip.open(out, "wt", encoding="utf-8", compresslevel=6) as f:
        f.write('{"format":"deltasub-base","version":1,"source":%s,"exported":%s,"seq":%d,"ids":%s,"tables":{'
                % (json.dumps(os.path.basename(src)), json.dumps(datetime.datetime.now().isoformat(timespec="seconds")),
                   seq, json.dumps(ids)))
        cur_t = None
        for t, i, val, s in c.execute("SELECT t, id, val, seq FROM rec WHERE val IS NOT NULL ORDER BY t"):
            if t != cur_t:
                f.write(("}," if cur_t is not None else "") + json.dumps(t) + ":{")
                cur_t, first = t, True
            f.write(("" if first else ",") + json.dumps(i) + ':{"s":%d,"v":%s}' % (s, val))
            first = False; n += 1
        f.write(("}" if cur_t is not None else "") + "}}")
    print("%d enregistrements exportés de %s\n→ %s (%.1f Mo)" % (n, src, out, os.path.getsize(out) / 1e6))


if __name__ == "__main__":
    main()

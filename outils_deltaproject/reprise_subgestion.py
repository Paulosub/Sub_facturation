#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Reprend TOUTES les données de Deltaproject dans SUBGestion (base locale du navigateur), sans perdre les saisies
faites dans SUBGestion / DeltaSub.

    1. SUBGestion ▸ Réglages ▸ Données & sauvegarde ▸ Exporter   → deltasub_base_AAAAMMJJ_HHMM.json.gz (Téléchargements)
    2. python3 outils_deltaproject/reprise_subgestion.py          (au bureau : volume « SUBSTANCES » monté)
    3. SUBGestion ▸ Réglages ▸ Données & sauvegarde ▸ Importer    → deltasub/subgestion_reprise_AAAAMMJJ_HHMM.json.gz

Options :
    --base FICHIER        export de SUBGestion (défaut : le plus récent deltasub_base_*.json.gz de Téléchargements ou de deltasub/)
    --sauvegarde DOSSIER  sauvegarde nocturne Deltaproject (défaut : la plus récente de /Volumes/SUBSTANCES/Deltaproject/Backup/)
    --extraction DOSSIER  extraction déjà faite par extraire.sh (au lieu de --sauvegarde)
    --sortie FICHIER      fichier produit (défaut : deltasub/subgestion_reprise_AAAAMMJJ_HHMM.json.gz)
    --seq-import A-B      plage des versions de la reprise précédente (détectée automatiquement)

Principe : la base exportée est chargée dans une base DeltaSub temporaire ; chaque enregistrement est marqué « import
Deltaproject » s'il provient de la reprise précédente (version dans la plage de cette reprise), sinon « saisi dans
SUBGestion ». La reprise de serveur_deltasub.py (--importer-deltaproject --force) remplace alors les données Deltaproject
et CONSERVE : les collections saisies dans DeltaSub (honoraires, contrats, factures, encaissements, QR, tâches, planification,
soumissions, documents, dépôt de fichiers…) et tout enregistrement d'adresse, de participation, d'utilisateur, de réglage,
de document Bâtiment ou de modèle modifié dans SUBGestion. La plage de la nouvelle reprise est notée dans la base
(collection « sg_meta », enregistrement « import ») pour la reprise suivante.
Lecture seule côté Deltaproject (extraire.sh ne travaille que sur une copie de la sauvegarde) ; bibliothèque standard de Python.
"""
import argparse, datetime, glob, gzip, importlib.util, json, os, sqlite3, subprocess, sys, tempfile
from urllib.parse import quote

OUTILS = os.path.dirname(os.path.abspath(__file__))
APP = os.path.dirname(OUTILS)
BACKUPS = "/Volumes/SUBSTANCES/Deltaproject/Backup"
IMPORT_WHO = "import Deltaproject"
TABLES_CLES = [("project", "affaires"), ("contactowner", "entités"), ("contact", "adresses"), ("staff", "collaborateurs"),
               ("timelog", "saisies d’heures"), ("projectcost", "frais"), ("costestimate", "devis"), ("costcontrol", "contrôles des coûts"),
               ("costplanning", "estimations"), ("projectcontract", "contrats"), ("projectinvoice", "factures"), ("modele", "modèles")]


def plus_recent(motifs):
    L = [p for m in motifs for p in glob.glob(os.path.expanduser(m))]
    return max(L, key=os.path.getmtime) if L else None


def plage_precedente(base, force):
    """(début, fin) des versions de la reprise Deltaproject dont provient la base exportée."""
    if force:
        a, b = force.split("-"); return int(a), int(b), "--seq-import"
    m = base["tables"].get("sg_meta", {}).get("import")
    if m and m.get("v"):
        return int(m["v"]["SEQ_DEBUT"]), int(m["v"]["SEQ_FIN"]), "marque sg_meta de la base"
    for p in sorted(glob.glob(os.path.join(APP, "Sauvegarde DeltaSub", "deltasub_*.sqlite")), reverse=True):
        c = sqlite3.connect("file:%s?mode=ro&immutable=1" % quote(p), uri=True)
        a, b = c.execute("SELECT MIN(seq), MAX(seq) FROM rec WHERE who=? AND val IS NOT NULL", (IMPORT_WHO,)).fetchone()
        c.close()
        if a is not None:
            return a, b, "copie %s" % os.path.basename(p)
    sys.exit("Plage de la reprise précédente introuvable : indiquez --seq-import A-B.")


def charger_serveur(db_path):
    os.environ["DELTASUB_DB"] = db_path   # lu à l'import du module : base temporaire, jamais la base du bureau
    spec = importlib.util.spec_from_file_location("serveur_deltasub", os.path.join(APP, "serveur_deltasub.py"))
    sd = importlib.util.module_from_spec(spec); spec.loader.exec_module(sd)
    assert sd.DB_PATH == db_path
    return sd


def compter(c, t):
    return c.execute("SELECT COUNT(*) FROM rec WHERE t=? AND val IS NOT NULL", (t,)).fetchone()[0]


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--base"); ap.add_argument("--sauvegarde"); ap.add_argument("--extraction"); ap.add_argument("--sortie")
    ap.add_argument("--seq-import")
    a = ap.parse_args()
    quand = datetime.datetime.now().strftime("%Y%m%d_%H%M")

    base_f = a.base or plus_recent(["~/Downloads/deltasub_base_*.json.gz", os.path.join(APP, "deltasub", "deltasub_base_*.json.gz")])
    if not base_f:
        sys.exit("Aucun export de SUBGestion : Réglages ▸ Données & sauvegarde ▸ Exporter, puis relancez (ou --base FICHIER).")
    print("Base SUBGestion : %s" % base_f)
    base = json.load(gzip.open(base_f, "rt", encoding="utf-8"))
    if base.get("format") != "deltasub-base":
        sys.exit("Ce fichier n’est pas un export de base SUBGestion / DeltaSub.")

    extraction = a.extraction
    if not extraction:
        sauv = a.sauvegarde or (sorted(glob.glob(os.path.join(BACKUPS, "*/")))[-1:] or [None])[0]
        if not sauv:
            sys.exit("Sauvegarde Deltaproject introuvable (%s) : montez le volume « SUBSTANCES » (Finder ▸ Aller ▸ Se connecter au serveur)"
                     " ou indiquez --sauvegarde / --extraction." % BACKUPS)
        sauv = sauv.rstrip("/")
        extraction = os.path.join(APP, "extraction_deltaproject_" + quand)
        print("Sauvegarde Deltaproject : %s\nExtraction → %s" % (sauv, extraction))
        subprocess.run(["/bin/zsh", os.path.join(OUTILS, "extraire.sh"), sauv, extraction], check=True)
    if not os.path.isfile(os.path.join(extraction, "schema.txt")):
        sys.exit("Extraction incomplète (schema.txt absent) : %s" % extraction)
    print("Extraction Deltaproject : %s" % extraction)

    d0, d1, origine = plage_precedente(base, a.seq_import)
    print("Reprise précédente : versions %d à %d (%s)" % (d0, d1, origine))

    tmp = tempfile.mkdtemp(prefix="reprise_subgestion_")
    sd = charger_serveur(os.path.join(tmp, "deltasub.sqlite"))
    c = sd.init_db()
    n_imp = n_loc = 0; avant = {}
    for t, rows in base["tables"].items():
        for i, r in rows.items():
            if r.get("v") is None:
                continue
            s = int(r.get("s") or 0); imp = d0 <= s <= d1
            n_imp += imp; n_loc += not imp
            c.execute("INSERT INTO rec VALUES(?,?,?,?,?,?)", (t, str(i), json.dumps(r["v"], ensure_ascii=False), s, IMPORT_WHO if imp else "SUBGestion", None))
    seq = max(int(base.get("seq") or 0), c.execute("SELECT COALESCE(MAX(seq),0) FROM rec").fetchone()[0])
    c.execute("UPDATE meta SET value=? WHERE name='seq'", (str(seq),))
    for t, n in (base.get("ids") or {}).items():
        c.execute("INSERT OR REPLACE INTO meta VALUES(?,?)", ("next_id:" + t, str(n)))
    c.commit()
    for t, _ in TABLES_CLES:
        avant[t] = compter(c, t)
    print("Base chargée : %d enregistrements de la reprise précédente, %d saisis dans SUBGestion." % (n_imp, n_loc))

    locaux = {(t, i): v for t, i, v in c.execute("SELECT t, id, val FROM rec WHERE val IS NOT NULL AND who='SUBGestion' AND t NOT IN ('documentlock','lock')")}   # verrous : jamais repris
    sd.import_deltaproject(c, extraction, force=True)
    fin = sd.cur_seq(c)
    sd.commit(c, [{"t": "sg_meta", "id": "import", "val": {"ID": "import", "SEQ_DEBUT": seq + 1, "SEQ_FIN": fin + 1,
                   "LE": datetime.datetime.now().isoformat(timespec="seconds"), "SOURCE": os.path.basename(extraction.rstrip("/"))}}],
              IMPORT_WHO, check=False)
    # filet de sécurité : saisie locale effacée par la reprise (collection non protégée) et absente de Deltaproject → rétablie ;
    # saisie locale remplacée par une autre version Deltaproject (même identifiant) → notée dans le rapport (version locale gardée)
    retablis, remplaces = [], {}
    for (t, i), v in locaux.items():
        row = c.execute("SELECT val, who FROM rec WHERE t=? AND id=?", (t, i)).fetchone()
        if not row or row[0] is None:
            retablis.append({"t": t, "id": i, "val": json.loads(v)})
        elif row[1] == IMPORT_WHO and json.loads(row[0]) != json.loads(v):
            remplaces.setdefault(t, {})[i] = {"SUBGestion": json.loads(v), "Deltaproject": json.loads(row[0])}
    if retablis:
        sd.commit(c, retablis, "SUBGestion", check=False)
    gardes = c.execute("SELECT COUNT(*) FROM rec WHERE val IS NOT NULL AND COALESCE(who,'')<>?", (IMPORT_WHO,)).fetchone()[0]

    out = a.sortie or os.path.join(APP, "deltasub", "subgestion_reprise_%s.json.gz" % quand)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    seq = sd.cur_seq(c); ids = {n[8:]: int(v) for n, v in c.execute("SELECT name, value FROM meta WHERE name LIKE 'next_id:%'")}
    n = 0
    with gzip.open(out, "wt", encoding="utf-8", compresslevel=6) as f:
        f.write('{"format":"deltasub-base","version":1,"source":%s,"exported":%s,"seq":%d,"ids":%s,"tables":{'
                % (json.dumps("reprise Deltaproject " + os.path.basename(extraction.rstrip("/"))), json.dumps(datetime.datetime.now().isoformat(timespec="seconds")), seq, json.dumps(ids)))
        cur_t = None
        for t, i, val, s in c.execute("SELECT t, id, val, seq FROM rec WHERE val IS NOT NULL ORDER BY t"):
            if t != cur_t:
                f.write(("}," if cur_t is not None else "") + json.dumps(t) + ":{"); cur_t, first = t, True
            f.write(("" if first else ",") + json.dumps(i) + ':{"s":%d,"v":%s}' % (s, val)); first = False; n += 1
        f.write(("}" if cur_t is not None else "") + "}}")
    print("\nAvant → après la reprise :")
    for t, lib in TABLES_CLES:
        print("  %-20s %7d → %7d" % (lib, avant[t], compter(c, t)))
    print("Saisies de SUBGestion conservées : %d enregistrements (dont %d rétablis après la reprise)." % (gardes, len(retablis)))
    if remplaces:
        rap = out.replace(".json.gz", "") + "_remplaces.json"
        json.dump(remplaces, open(rap, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print("⚠ %d saisie(s) de SUBGestion remplacée(s) par la version Deltaproject (même identifiant) : %s\n  détail et versions SUBGestion : %s"
              % (sum(len(x) for x in remplaces.values()), ", ".join("%s ×%d" % (t, len(x)) for t, x in sorted(remplaces.items())), rap))
    print("\n✓ %d enregistrements → %s (%.1f Mo)" % (n, out, os.path.getsize(out) / 1e6))
    print("Dernière étape : SUBGestion ▸ Réglages ▸ Données & sauvegarde ▸ Importer, choisir ce fichier.\n"
          "⚠ N’ajoutez rien dans SUBGestion entre l’export (étape 1) et cet import : ce serait remplacé.")
    c.close()


if __name__ == "__main__":
    main()

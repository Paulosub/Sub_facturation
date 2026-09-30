#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
convertir_docs_devis.py — documents .dpdoc des devis DELTAproject  ->  collection DeltaSub « costestimatedpdoc »
================================================================================================================

Python 3.9, bibliothèque standard uniquement. LECTURE SEULE sur les sources.
Cahier : spec_15 (CH-02) § 3.1, § 3.5 et § 10 (lot 3).

1. OÙ SONT LES DOCUMENTS
------------------------
    DELTAprojectFiles/Construction/Costestimate/<PROJECT_ID>/<DOCUMENT_ID>/documents/
        estimate.dpdoc   -> document « Devis général »     (modèle costEstimateEstimate)
        honorar.dpdoc    -> document « Honoraires »         (modèle costEstimateHonorar)
        desc.dpdoc       -> document « Devis descriptif »   (modèle costEstimateDesc)
    Un .dpdoc est un zip : report.json (mise en page, SANS données), data.json (vide au bureau), images/ (copies
    des logos du modèle, non reprises : les images viennent de la bibliothèque « image » de DeltaSub).
    Les PDF (estimate.pdf …, archive/) relèvent de CH-03 ; les petits fichiers d'options (displayPriceBase.json …)
    valent tous la valeur par défaut au bureau : rien à reprendre.

2. SORTIE
---------
    {"costestimatedpdoc": {"<DOCUMENT_ID>/<genre>": {
        "ID": "<DOCUMENT_ID>/<genre>", "DOCUMENT_ID": <int>, "PROJECT_ID": <int>, "genre": "estimate|honorar|desc",
        "doc": {"nom": <libellé de la ligne du panneau>, "type": <reportType>, "jeu": null, "fichier": null,
                "templateDesc": "", "report": <report.json>, "creeLe": "AAAA-MM-JJ", "creePar": null},
        "source": {"fichier": "Costestimate/<P>/<D>/documents/<genre>.dpdoc", "date": "AAAA-MM-JJTHH:MM:SS"}}}}
    jeu null : au rendu, DeltaSub prend le jeu de modèles de l'affaire (svJeu). creeLe = date du fichier.
    Seuls les devis présents dans l'en-tête (--entetes APP.COSTESTIMATEDOCUMENT.csv) sont repris (tous, sans l'option).
    Le serveur (--importer-deltaproject) importe tout documents/*.json ; la collection est PROTECTED_IF_EDITED : un
    document modifié, créé ou effacé dans DeltaSub est conservé à la reprise suivante.

3. USAGE
--------
    python3 convertir_docs_devis.py <racine Construction> <sortie.json> [--entetes APP.COSTESTIMATEDOCUMENT.csv]
    (<racine Construction> = …/DELTAprojectFiles/Construction ; extraire.sh passe "$FILES")
"""

import csv
import datetime
import glob
import json
import os
import re
import sys
import zipfile

GENRES = {  # genre -> (type attendu, libellé de la ligne du panneau Documents : KvDialog|kvDocument, honDocument, descDocument)
    "estimate": ("costEstimateEstimate", "Devis général"),
    "honorar": ("costEstimateHonorar", "Honoraires"),
    "desc": ("costEstimateDesc", "Devis descriptif"),
}


def lire_entetes(chemin):
    rows = {}
    if chemin and os.path.exists(chemin):
        with open(chemin, encoding="utf-8", errors="replace", newline="") as f:
            for r in csv.DictReader(f, delimiter=";"):
                if r.get("ID"):
                    rows[str(r["ID"])] = r
    return rows


def entier(v):
    try:
        return int(str(v).strip())
    except (TypeError, ValueError):
        return None


def convertir(racine, entetes=None, journal=print):
    """-> (dict des enregistrements, statistiques). racine = …/Construction (ou directement …/Costestimate)."""
    base = os.path.join(racine, "Costestimate") if os.path.isdir(os.path.join(racine, "Costestimate")) else racine
    out, st = {}, {"lus": 0, "ignores_entete": 0, "erreurs": 0, "data_non_vide": 0, "type_inattendu": 0,
                   "par_genre": {g: 0 for g in GENRES}}
    motif = re.compile(r"^(\d+)$")
    for chemin in sorted(glob.glob(os.path.join(base, "*", "*", "documents", "*.dpdoc"))):
        genre = os.path.basename(chemin)[:-6]
        if genre not in GENRES:
            continue
        doc_dir = os.path.dirname(os.path.dirname(chemin))
        d_id, p_id = os.path.basename(doc_dir), os.path.basename(os.path.dirname(doc_dir))
        if not (motif.match(d_id) and motif.match(p_id)):
            continue
        st["lus"] += 1
        head = None
        if entetes is not None:
            head = entetes.get(d_id)
            if head is None:  # devis absent de l'en-tête (dossier orphelin) : ignoré
                st["ignores_entete"] += 1
                journal("  ignoré (absent de l'en-tête) : Costestimate/%s/%s/documents/%s.dpdoc" % (p_id, d_id, genre))
                continue
        try:
            with zipfile.ZipFile(chemin) as z:
                rep = json.loads(z.read("report.json").decode("utf-8"))
                data = {}
                if "data.json" in z.namelist():
                    try:
                        data = json.loads(z.read("data.json").decode("utf-8") or "{}")
                    except ValueError:
                        data = {}
        except Exception as e:  # noqa : fichier illisible, signalé, non bloquant
            st["erreurs"] += 1
            journal("  ! %s : %s" % (chemin, e))
            continue
        if data:
            st["data_non_vide"] += 1  # data.json n'est pas repris (les données viennent du devis)
        attendu, nom = GENRES[genre]
        typ = rep.get("reportType") or attendu
        if typ != attendu:
            st["type_inattendu"] += 1
            journal("  ! type %r au lieu de %r : %s" % (typ, attendu, chemin))
        mtime = datetime.datetime.fromtimestamp(os.path.getmtime(chemin))
        pid = entier((head or {}).get("PROJECT_ID")) or entier(p_id)
        rid = "%s/%s" % (d_id, genre)
        out[rid] = {
            "ID": rid, "DOCUMENT_ID": entier(d_id), "PROJECT_ID": pid, "genre": genre,
            "doc": {"nom": nom, "type": typ, "jeu": None, "fichier": None, "templateDesc": "", "report": rep,
                    "creeLe": mtime.strftime("%Y-%m-%d"), "creePar": None},
            "source": {"fichier": "Costestimate/%s/%s/documents/%s.dpdoc" % (p_id, d_id, genre),
                       "date": mtime.isoformat(timespec="seconds")},
        }
        st["par_genre"][genre] += 1
    return out, st


def main(argv):
    args = list(argv[1:])
    ent = None
    if "--entetes" in args:
        i = args.index("--entetes")
        if i + 1 >= len(args):
            print("--entetes : fichier manquant")
            return 2
        ent = args[i + 1]
        del args[i:i + 2]
    if len(args) != 2:
        print(__doc__)
        return 2
    racine, sortie = args
    if not os.path.isdir(racine):
        print("racine introuvable : %s" % racine)
        return 2
    entetes = lire_entetes(ent) if ent else None
    if ent and not entetes:
        print("en-têtes vides ou illisibles : %s" % ent)
        return 2
    res, st = convertir(racine, entetes)
    os.makedirs(os.path.dirname(os.path.abspath(sortie)), exist_ok=True)
    with open(sortie, "w", encoding="utf-8") as f:
        json.dump({"costestimatedpdoc": res}, f, ensure_ascii=False)
    print("Documents des devis : %d repris (%s) ; %d lus, %d ignorés (absents de l'en-tête), %d illisibles%s%s."
          % (len(res), ", ".join("%s %d" % (g, n) for g, n in st["par_genre"].items()), st["lus"], st["ignores_entete"],
             st["erreurs"], (", %d data.json non vides (non repris)" % st["data_non_vide"]) if st["data_non_vide"] else "",
             (", %d types inattendus" % st["type_inattendu"]) if st["type_inattendu"] else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))

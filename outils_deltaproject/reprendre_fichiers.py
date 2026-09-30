#!/usr/bin/env python3
"""Reprise des fichiers de Deltaproject dans le dépôt de fichiers de DeltaSub (CH-03 lot 4, décision D12).

D12 : pas de reprise en masse dans cette vague. Cet outil est écrit et testé sur une BASE D'ESSAI ; il n'est jamais lancé sur la base
du bureau sans décision de Paulo (option --base-du-bureau, spec_17 § 13 décision n° 4).

    DELTASUB_DB=<dossier d'essai>/deltasub.sqlite python3 outils_deltaproject/reprendre_fichiers.py [--source <…/DELTAProjectFiles>]
        [--essai] [--avec-dpdoc] [--base-du-bureau] [--serveur <serveur_deltasub.py>]

  --source          dossier DELTAProjectFiles lu (lecture seule) ; défaut : dernière sauvegarde nocturne
                    /Volumes/SUBSTANCES/Deltaproject/Backup/<date>/DELTAProjectFiles
  --essai           compte rendu seul : rien n'est écrit (ni base, ni dépôt)
  --avec-dpdoc      reprend aussi les documents .dpdoc (conservés tels quels, pour un futur convertisseur)
  --base-du-bureau  autorise l'écriture dans la base du bureau (sans DELTASUB_DB) : refusé par défaut (D12)
  --serveur         serveur_deltasub.py à importer (défaut : celui du dossier parent de outils_deltaproject/, c'est-à-dire du dépôt)

Sélection = état courant seulement (arborescence de spec_17 § 4.3) :
  Construction/Costcontrol/<P>/<D>/coco/…      (dossiers « coco_<date> » exclus : anciens états)
  Construction/Costestimate/<P>/<D>/documents/…
  Construction/Costplanning/<P>/<D>/documents/… et …/docs/…
  Construction/Devis/devis18/<P>/<D>/…
  ProjectDocuments/Documents/<P>/{Documents,Meetings,Invoices,FeeCalculations,Contracts}/<id>/…
  fichiers .pdf (et .dpdoc avec --avec-dpdoc), sans tenir compte de la casse ; archives .zip, fichiers et dossiers masqués, autres
  extensions exclus ; nom refusé par le dépôt (ch03_nom : 128 caractères, « / », « \\ », « . » en tête…) : compté « refusé ».
Pour chaque fichier : empreinte sha256, contenu rangé dans <dossier de la base>/fichiers/objets/<2>/<sha> s'il manque (copie atomique,
jamais d'écrasement : les contenus sont immuables), enregistrement « depotfichier » ajouté SEULEMENT s'il n'existe pas déjà un
enregistrement du même nom dans le même dossier (casse ignorée, forme NFC), même supprimé dans DeltaSub : rien n'est jamais écrasé ni
ressuscité. Commits par paquets de 200 (who = IMPORT_WHO), MODIFIED = date du fichier source, ORIGINE = 'reprise', USERID = null,
PROJECT_ID = segment <P>. Compte rendu par module : fichiers, ajoutés, ignorés, contenus distincts, octets des contenus, octets rangés.
Bibliothèque standard de Python uniquement.
"""
import argparse, collections, datetime, glob, hashlib, importlib.util, os, re, secrets, shutil, sys, unicodedata

BACKUP_GLOB = "/Volumes/SUBSTANCES/Deltaproject/Backup/*/DELTAProjectFiles"
PAQUET = 200
MSG_D12 = "Base du bureau : reprise non autorisée dans cette vague (D12). Définissez DELTASUB_DB pour une base d'essai."
T = "depotfichier"
# (expression sur le chemin relatif NFC, module, groupe de l'affaire) ; le dossier retenu est celui du fichier
MOTIFS = [
    (re.compile(r"^Construction/Costcontrol/([^/]+)/[^/]+/coco/(.+)$"), "Contrôle des coûts"),
    (re.compile(r"^Construction/Costestimate/([^/]+)/[^/]+/documents/(.+)$"), "Devis général"),
    (re.compile(r"^Construction/Costplanning/([^/]+)/[^/]+/(?:documents|docs)/(.+)$"), "eCCC"),
    (re.compile(r"^Construction/Devis/devis18/([^/]+)/[^/]+/(.+)$"), "Soumission"),
    (re.compile(r"^ProjectDocuments/Documents/([^/]+)/(?:Documents|Meetings|Invoices|FeeCalculations|Contracts)/[^/]+/(.+)$"), "Documents d'affaire"),
]


def nfc(s):
    return unicodedata.normalize("NFC", s)


def source_defaut():
    L = sorted(p for p in glob.glob(BACKUP_GLOB) if os.path.isdir(p))
    return L[-1] if L else None


def charger_serveur(chemin):
    spec = importlib.util.spec_from_file_location("serveur_deltasub", chemin)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    for n in ("db", "commit", "IMPORT_WHO", "DB_PATH", "CH03_FICHIERS", "Conflict"):
        if not hasattr(m, n):
            raise SystemExit("ÉCHEC : %s ne définit pas %s (lot 1 de CH-03 intégré ?)" % (chemin, n))
    return m


def selection(source, avec_dpdoc):
    """[(module, sous-catégorie, dossier NFC, nom NFC, chemin absolu, projet)] triés ; lecture seule du dossier source."""
    exts = {"pdf", "dpdoc"} if avec_dpdoc else {"pdf"}
    out = []
    for dp, dn, fn in os.walk(source):
        dn[:] = sorted(d for d in dn if not d.startswith("."))
        for f in sorted(fn):
            if f.startswith("."):
                continue
            ext = f.rsplit(".", 1)[1].lower() if "." in f else ""
            if ext not in exts:
                continue
            rel = nfc(os.path.relpath(os.path.join(dp, f), source).replace(os.sep, "/"))
            for rx, module in MOTIFS:
                m = rx.match(rel)
                if m:
                    sous = m.group(2).split("/")
                    cat = sous[0] if module == "Contrôle des coûts" and len(sous) > 1 else ""
                    p = m.group(1)
                    out.append((module, cat, rel.rsplit("/", 1)[0], rel.rsplit("/", 1)[1], os.path.join(dp, f),
                                int(p) if p.isdigit() else p, ext))
                    break
    return out


def empreinte(p):
    h, n = hashlib.sha256(), 0
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
            n += len(b)
    return h.hexdigest(), n


def ranger(S, src, sha):
    """Copie atomique du contenu dans objets/<2>/<sha> s'il manque → octets écrits (0 si déjà présent)."""
    objets, tmp = os.path.join(S.CH03_FICHIERS, "objets"), os.path.join(S.CH03_FICHIERS, "tmp")
    dst = os.path.join(objets, sha[:2], sha)
    if os.path.isfile(dst):
        return 0
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    os.makedirs(tmp, exist_ok=True)
    t = os.path.join(tmp, "reprise-" + secrets.token_hex(8))
    shutil.copyfile(src, t)
    if empreinte(t)[0] != sha:            # le fichier a changé pendant la copie : on ne range rien
        os.remove(t)
        raise OSError("contenu modifié pendant la copie : " + src)
    os.replace(t, dst)
    return os.path.getsize(dst)


def pages(S, chemins):
    """{chemin: nombre de pages | None} par paquets de 40 (PDFKit, ch03_outil du lot 1) ; outils absents → None."""
    r = {}
    f = getattr(S, "ch03_outil", None)
    for i in range(0, len(chemins), 40):
        lot = chemins[i:i + 40]
        try:
            L = f("pages", None, lot).split("\n") if f else []
        except Exception:
            L = []
        for k, p in enumerate(lot):
            v = L[k].strip() if k < len(L) else ""
            r[p] = int(v) if v.isdigit() else None
    return r


def main():
    ap = argparse.ArgumentParser(description="Reprise des fichiers de Deltaproject dans le dépôt de DeltaSub (D12 : base d'essai).")
    ap.add_argument("--source")
    ap.add_argument("--essai", action="store_true")
    ap.add_argument("--avec-dpdoc", action="store_true")
    ap.add_argument("--base-du-bureau", action="store_true")
    ap.add_argument("--serveur")
    a = ap.parse_args()

    if not os.environ.get("DELTASUB_DB") and not a.base_du_bureau:
        print(MSG_D12, file=sys.stderr)
        return 2
    source = os.path.abspath(a.source) if a.source else source_defaut()
    if not source or not os.path.isdir(source):
        print("ÉCHEC : dossier source introuvable (%s)." % (a.source or BACKUP_GLOB), file=sys.stderr)
        return 1
    srv = os.path.abspath(a.serveur) if a.serveur else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "serveur_deltasub.py")
    if not os.path.isfile(srv):
        print("ÉCHEC : serveur introuvable : " + srv, file=sys.stderr)
        return 1
    S = charger_serveur(srv)
    fich = os.path.realpath(S.CH03_FICHIERS)
    if os.path.commonpath([fich, os.path.realpath(source)]) in (fich, os.path.realpath(source)):
        print("ÉCHEC : la source et le dépôt se recouvrent.", file=sys.stderr)
        return 1
    if not os.path.isfile(S.DB_PATH):
        print("ÉCHEC : base introuvable : " + S.DB_PATH, file=sys.stderr)
        return 1

    print("Source  : %s (lecture seule)" % source)
    print("Base    : %s%s" % (S.DB_PATH, "" if os.environ.get("DELTASUB_DB") else "  ← BASE DU BUREAU (--base-du-bureau)"))
    print("Dépôt   : %s" % S.CH03_FICHIERS)
    print("Mode    : %s%s" % ("essai (rien n'est écrit)" if a.essai else "reprise", " ; .pdf et .dpdoc" if a.avec_dpdoc else " ; .pdf seulement"))

    c = S.db()
    try:
        # enregistrements existants (supprimés compris), clé = dossier + nom, casse ignorée, NFC
        exist = {}
        for i, sup in c.execute("SELECT id, val IS NULL FROM rec WHERE t=?", (T,)):
            exist[nfc(str(i)).lower()] = bool(sup)
        fichiers = selection(source, a.avec_dpdoc)
        nomok = getattr(S, "ch03_nom", None)
        stat = collections.OrderedDict()
        def st(k):
            if k not in stat:
                stat[k] = {"fichiers": 0, "ajoutes": 0, "presents": 0, "supprimes": 0, "refuses": 0, "shas": {}, "ranges": 0}
            return stat[k]
        a_ajouter, vus = [], set()
        for module, cat, dossier, nom, chemin, projet, ext in fichiers:
            cles = [(module, ""), (module, cat)] if cat else [(module, "")]
            cles.append(("Total", ext))
            try:
                if nomok:
                    nomok(nom)
            except Exception:
                for k in cles: st(k)["refuses"] += 1; st(k)["fichiers"] += 1
                continue
            sha, taille = empreinte(chemin)
            ident = dossier + "/" + nom
            k0 = ident.lower()
            for k in cles:
                s = st(k); s["fichiers"] += 1; s["shas"][sha] = taille
            if k0 in exist or k0 in vus:
                for k in cles: st(k)["supprimes" if exist.get(k0) else "presents"] += 1
                continue
            vus.add(k0)
            a_ajouter.append((cles, dossier, nom, chemin, projet, ext, sha, taille))

        if not a.essai:
            npages = pages(S, [x[3] for x in a_ajouter if x[5] == "pdf"])
            ranges_sha = set()
            for i in range(0, len(a_ajouter), PAQUET):
                lot, ops = a_ajouter[i:i + PAQUET], []
                for cles, dossier, nom, chemin, projet, ext, sha, taille in lot:
                    n = ranger(S, chemin, sha)
                    if n and sha not in ranges_sha:
                        ranges_sha.add(sha)
                        for k in cles: st(k)["ranges"] += n
                    mod = datetime.datetime.fromtimestamp(os.stat(chemin).st_mtime).strftime("%Y-%m-%dT%H:%M:%S")
                    ops.append({"t": T, "id": dossier + "/" + nom, "bseq": 0, "val": {
                        "ID": dossier + "/" + nom, "DOSSIER": dossier, "NOM": nom, "EXT": ext, "SHA256": sha, "TAILLE": taille,
                        "PAGES": npages.get(chemin) if ext == "pdf" else None, "MODIFIED": mod, "USERID": None,
                        "ORIGINE": "reprise", "PROJECT_ID": projet}})
                faits = {o["id"] for o in ops}
                while ops:
                    try:
                        # verrou d'écriture pris AVANT la lecture des séquences : un serveur en marche (autre processus) ne peut pas
                        # écrire entre le contrôle, la lecture de meta.seq et l'écriture (sinon deux paquets auraient le même seq et
                        # /api/changes pourrait en manquer un)
                        c.execute("BEGIN IMMEDIATE")
                        S.commit(c, ops, S.IMPORT_WHO, check=True)
                        break
                    except S.Conflict as e:          # créé entre-temps par un poste : jamais écrasé
                        c.rollback()
                        pris = {x["id"] for x in e.items}
                        ops = [o for o in ops if o["id"] not in pris]
                        faits -= pris
                for cles, dossier, nom, *_ in lot:
                    for k in cles: st(k)["ajoutes" if dossier + "/" + nom in faits else "presents"] += 1
        else:
            for cles, *_ in a_ajouter:
                for k in cles: st(k)["ajoutes"] += 1
    finally:
        c.close()

    print()
    verbe = "à ajouter" if a.essai else "ajoutés"
    print("%-34s %8s %10s %9s %10s %9s %12s %12s" % ("Module", "fichiers", verbe, "présents", "supprimés", "contenus", "octets", "rangés"))
    ordre = [m for _, m in MOTIFS] + ["Total"]
    cle = lambda kv: (ordre.index(kv[0][0]), kv[0][1] != "" and kv[0][0] != "Total", -kv[1]["fichiers"] if kv[0][0] != "Total" else 0, kv[0][1])
    for (module, cat), s in sorted(stat.items(), key=cle):
        lib = ("  " + cat) if cat and module != "Total" else (module if module != "Total" else "Total ." + cat)
        print("%-34s %8d %10d %9d %10d %9d %12d %12d%s" % (lib, s["fichiers"], s["ajoutes"], s["presents"], s["supprimes"], len(s["shas"]),
                                                     sum(s["shas"].values()), s["ranges"], ("  (refusés : %d)" % s["refuses"]) if s["refuses"] else ""))
    tot = [s for (m, _), s in stat.items() if m == "Total"]
    shas = {}
    for s in tot: shas.update(s["shas"])
    print("Ensemble : %d fichiers, %d %s, %d contenus distincts, %d octets%s." % (
        sum(s["fichiers"] for s in tot), sum(s["ajoutes"] for s in tot), verbe, len(shas), sum(shas.values()),
        "" if a.essai else ", %d octets rangés" % sum(s["ranges"] for s in tot)))
    return 0


if __name__ == "__main__":
    sys.exit(main())

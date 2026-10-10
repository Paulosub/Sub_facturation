#!/usr/bin/env python3
"""Version SERVIE par le NAS : nettoie une copie de SUBGestion3.html (les sources ne sont jamais modifiées).

    python3 nas/nettoyer.py <SUBGestion3.html source> <page nettoyée>

1. Facturation embarquée : retire les données de départ (contrats, factures, heures, adresses… « cuites » dans la page) —
   en mode base du bureau, les données viennent du serveur, après connexion.
2. Retire les commentaires (JavaScript, CSS, HTML) : notes de maintenance, noms de classes et de spécifications d'origine.
3. Renomme les libellés visibles qui citent le logiciel d'origine ou les catalogues sous licence (CAN, CRB) ; le métier SIA
   et les numéros CFC sont gardés (décision du 07.10.2026).
4. Contrôle final : plus aucune donnée client connue, plus de mention interdite ; sinon arrêt avec la liste des restes.
Bibliothèque standard de Python uniquement."""
import base64, gzip, re, sys

KEYWORDS_RE = {"return", "typeof", "case", "do", "else", "in", "of", "new", "delete", "void", "throw", "yield", "await",
               "instanceof"}


def strip_js(src):
    """Retire les commentaires d'un code JavaScript en respectant chaînes, gabarits (`${…}` imbriqués) et expressions régulières."""
    out, i, n = [], 0, len(src)
    prev = ""            # dernier jeton significatif : décide si « / » ouvre une expression régulière
    stack = []           # gabarits ouverts : profondeur d'accolades de chaque ${ … }
    def regex_ok():
        if prev == "" or prev in KEYWORDS_RE:
            return True
        return prev[-1] in "(,=:[!&|?{};+-*%<>~^}" and prev not in (")", "]")
    while i < n:
        c = src[i]
        if stack and c == "}" and stack[-1] == 0:   # fin d'une substitution ${ … } : retour dans le gabarit
            stack.pop(); out.append(c); i += 1
            i = template(src, i, out, stack); prev = "`"; continue
        if c == "/" and i + 1 < n and src[i + 1] == "/":
            j = src.find("\n", i)
            i = n if j < 0 else j
            continue
        if c == "/" and i + 1 < n and src[i + 1] == "*":
            j = src.find("*/", i + 2)
            if j < 0:
                raise ValueError("commentaire non fermé")
            seg = src[i:j + 2]
            out.append("\n" if "\n" in seg else " ")   # garde la séparation des lignes (insertion automatique des « ; »)
            i = j + 2
            continue
        if c in "'\"":
            j = i + 1
            while j < n and src[j] != c:
                if src[j] == "\\":
                    j += 1
                elif src[j] == "\n":
                    raise ValueError("chaîne non fermée ligne %d" % src.count("\n", 0, i))
                j += 1
            out.append(src[i:j + 1]); i = j + 1; prev = c; continue
        if c == "`":
            out.append(c); i += 1
            i = template(src, i, out, stack); prev = "`"; continue
        if c == "/" and regex_ok():
            j, cls = i + 1, False
            while j < n:
                d = src[j]
                if d == "\\":
                    j += 2; continue
                if d == "[":
                    cls = True
                elif d == "]":
                    cls = False
                elif d == "/" and not cls:
                    break
                elif d == "\n":
                    raise ValueError("expression régulière non fermée ligne %d" % src.count("\n", 0, i))
                j += 1
            j += 1
            while j < n and (src[j].isalnum() or src[j] == "_"):
                j += 1
            out.append(src[i:j]); i = j; prev = "re"; continue
        if c.isspace():
            out.append(c); i += 1; continue
        if c.isalnum() or c in "_$":
            j = i
            while j < n and (src[j].isalnum() or src[j] in "_$"):
                j += 1
            prev = src[i:j]; out.append(prev); i = j; continue
        if stack and c == "{":
            stack[-1] += 1
        elif stack and c == "}":
            stack[-1] -= 1
        out.append(c); prev = c; i += 1
    return "".join(out)


def template(src, i, out, stack):
    """Copie le texte d'un gabarit jusqu'à la fin (`) ou jusqu'à une substitution ${ (empile, rend la main au code)."""
    n = len(src)
    while i < n:
        d = src[i]
        if d == "\\":
            out.append(src[i:i + 2]); i += 2; continue
        if d == "`":
            out.append(d); return i + 1
        if d == "$" and i + 1 < n and src[i + 1] == "{":
            out.append("${"); stack.append(0); return i + 2
        out.append(d); i += 1
    raise ValueError("gabarit non fermé")


def strip_css(css):
    return re.sub(r"/\*.*?\*/", "", css, flags=re.S)


def clean_html(html, label):
    """Commentaires retirés dans chaque <script> (code), <style> et dans le HTML ; contenu des autres scripts gardé."""
    parts, pos = [], 0
    for m in re.finditer(r"(<script\b([^>]*)>)(.*?)(</script>)|(<style\b[^>]*>)(.*?)(</style>)|<!--.*?-->", html, re.S | re.I):
        parts.append(html[pos:m.start()])
        if m.group(1):
            attrs = m.group(2) or ""
            code = m.group(3)
            if re.search(r"type\s*=\s*\"(?!text/javascript|module)", attrs):   # données (base64, JSON) : intactes
                parts.append(m.group(0))
            else:
                try:
                    parts.append(m.group(1) + strip_js(code) + m.group(4))
                except ValueError as e:
                    raise SystemExit("✗ %s : %s" % (label, e))
        elif m.group(5):
            parts.append(m.group(5) + strip_css(m.group(6)) + m.group(7))
        else:
            parts.append("")   # commentaire HTML
        pos = m.end()
    parts.append(html[pos:])
    return "".join(parts)


# libellés visibles : (expression, remplacement), dans cet ordre — appliqués après le retrait des commentaires, hors base64
LIBELLES = [
    # messages entiers
    (r"Reproduction fonctionnelle de DELTAproject [\d.]+, pour l’usage interne du bureau\.", "Application de gestion du bureau, usage interne."),
    (r"Le manuel de DELTAproject \(manual_fr\.pdf\) n’est pas accessible depuis le serveur DeltaSub\. Il s’ouvre depuis DELTAproject : Aide ▸ Aide\.",
     "Le manuel n’est pas disponible dans cette version."),
    (r"L’import des modèles depuis une archive \.zip de Deltaproject demande l’ancien serveur DeltaSub \(conversion des modèles\) : il n’est pas disponible dans la version sans serveur\. Les modèles déjà repris de Deltaproject restent utilisables\.",
     "L’import des modèles depuis une archive .zip n’est pas disponible dans cette version. Les modèles déjà repris restent utilisables."),
    (r"Import impossible : le serveur DeltaSub ne connaît pas encore l’import des modèles \(serveur_deltasub\.py à mettre à jour\)\.",
     "Import impossible : le serveur ne connaît pas encore l’import des modèles."),
    (r"reprise forcée : DELTASUB_REPRENDRE=costplanning:'\+String\(id\)\+'\)", "reprise forcée)"),
    (r"Code des coûts de construction Bâtiment eCCC-Bât \(SN 506 511\) : Copyright © CRB Zürich\.(\\n)*", ""),
    (r"Choix à valider : Deltaproject marque ce catalogue « licence requise » \(CRB\)\.", "Choix à valider : ce catalogue est sous licence."),
    (r"Domaine non utilisé au bureau dans Deltaproject \(aucune donnée\)\. Il sera reproduit sur demande\.", "Domaine non utilisé au bureau (aucune donnée)."),
    (r"h\('code',\{\},'python3 outils_deltaproject/exporter_base_deltasub\.py'\)", "h('code',{},'l’outil de reprise')"),
    (r"Dernière reprise Deltaproject : ", "Dernière reprise des données : "),
    (r"Substances Architectes — Deltaproject", "Substances Architectes — Gestion"),
    (r"pas dans Deltaproject", "pas dans ce module"),
    (r"Import de DELTAdevis", "Import depuis un devis"),
    (r"Module DELTAplanning:", "Module Planification :"), (r"Données DELTAplanning", "Données de planification"),
    # eCCC (structure CRB) → « éléments »
    (r"eCCC-gate du CRB", "externe"), (r"composants eCCC-gate", "composants"), (r"Importer le eCCC", "Importer le catalogue"),
    (r"selon eCCC-Bât", "par éléments"), (r"structure eCCC-Bât", "structure des éléments"),
    (r"eCCC-GC", "Éléments GC"), (r"eCCC-Bât", "Éléments Bât"),
    (r"Groupes principaux eCCC", "Groupes principaux"), (r"Groupe principal eCCC", "Groupe principal"),
    (r"Paramètre de coût selon eCCC", "Paramètre de coût par éléments"), (r"Coûts selon eCCC", "Coûts par éléments"),
    (r"Code eCCC", "Code élément"), (r"Désignation eCCC", "Désignation de l’élément"), (r"(É|E)lément eCCC", r"\1lément"), (r"élément eCCC", "élément"),
    (r"Mes estimations eCCC", "Mes estimations des coûts"), (r"(E|e)stimations eCCC", r"\1stimations des coûts"), (r"(E|e)stimation eCCC", r"\1stimation des coûts"),
    (r"_eCCC\b", "_couts"), (r"\beCCC\b", "éléments"), (r"eCCC", "elements"),
    # CRB
    (r"Sélection des standards CRB", "Sélection des standards"), (r"Standard CRB", "Standard"),
    (r"Référence articles valides CRB", "Références d’articles valides"), (r"(R|r)éférence article CRB", r"\1éférence d’article"),
    (r"Les données du CRB ne sont pas reprises", "Les données externes ne sont pas reprises"), (r"\(catalogue CRB\)", "(catalogue externe)"),
    (r"contenu CRB", "contenu externe"), (r"du CRB\b", "externes"), (r"\bCRB\b", "externe"),
    # CAN (le code pays du Canada reste : protégé par hors_libelles)
    (r"Catalogue CAN", "Catalogue des articles"), (r"Calcul selon CAN", "Calcul selon les articles"),
    (r"Titres de chapitres CAN plutôt que CFC", "Titres de chapitres du catalogue plutôt que CFC"), (r"value:'CAN'", "value:'Catalogue des articles'"),
    (r"aucun texte CAN", "aucun texte de catalogue"), (r"Nº CAN", "Nº article"), (r"chapitre CAN", "chapitre"), (r"Article CAN", "Article"),
    (r"(?<![\"'])\bCAN\b(?![\"'])", "catalogue"),
    # Deltaproject / DeltaSub
    (r"export CSV Deltaproject", "export CSV"), (r"Import Deltaproject", "Import des heures"), (r"Réel \(Deltaproject\)", "Réel"),
    (r"Affaires \(Deltaproject\)", "Affaires (base reprise)"), (r", façon Deltaproject", ""), (r"comme Deltaproject", "méthode d’origine"),
    (r"(depuis|dans|de) (Deltaproject|DELTAproject)", r"\1 l’ancienne base"), (r"Deltaproject|DELTAproject|DeltaProject", "l’ancienne base"),
    (r"deltasub-base", "subgestion-base"), (r"deltasub_base_", "sgbase_"), (r"indexedDB\.open\('DeltaSub'", "indexedDB.open('sgmoteur'"),
    (r"serveur_deltasub\.py", "serveur"), (r"DeltaSub", "SUBGestion"), (r"DELTASUB", "SUBGESTION"),
    (r"(?i)deltaproject", "gestion"), (r"(?i)deltasub", "subgestion"),
    (r"DELTA[a-z]\w*", "module"),
]
# restes tolérés : code pays ISO du Canada
TOLERES = re.compile(r'"Canada","CAN"')
INTERDITS = r"(?i:delta ?project|deltasub)|DELTA[a-z]\w*|eCCC|\bCRB\b|\bCAN\b|javap|bytecode"


B64 = re.compile(r'<script type="text/plain" data-vendor="[^"]*"[^>]*>.*?</script>'
                 r"|data:[\w/+.-]+;base64,[A-Za-z0-9+/=]+|[A-Za-z0-9+/=]{160,}", re.S)   # bibliothèques tierces intégrées et données binaires : jamais touchées

# ── Traces de l'ancien logiciel et des catalogues sous licence, échanges externes (10.10.2026) ──
# 1. fonctions et libellés retirés de la version servie (texte exact → remplacement ; chacun doit être trouvé)
RETRAITS = [
    (",'-',ext('ec4ImportSia451','Import SIA451…')", ""),             # import au format d'échange des catalogues sous licence
    ("'-',ext('ec4ExportSia451','Export SIA451…'),", ""),             # export au même format
    ("(format *.deltakv)", "(fichier d’échange)"),
    ("Import externe (*.deltakv)", "Import externe"),
    ("(« Estimation des coûts », modèle .dpdoc)", "(« Estimation des coûts »)"),
    ("/aide/manual_fr.pdf", "/aide/manuel.pdf"),
    ("const FR_CAT_SANS_FR='traduire';", "const FR_CAT_SANS_FR='supprimer';"),   # catalogue étranger sans équivalent français : supprimé
    # entrées de menu désactivées, colonne et textes d'information citant le format d'échange des catalogues sous licence
    ("'-',{t:'Export SIA451',dis:true},", ""),
    ("'-',{t:'Supprimer le fichier SIA451',dis:true}", ""),
    ("{t:'Exporter le fichier SIA451',dis:true},", ""),
    ("{k:'s',t:'Document SIA451',w:110,cls:'c',f:()=>''},", ""),
    ("(impression par le navigateur). SIA451 et PDF enregistrés : lot 4.", "(impression par le navigateur). PDF enregistrés : lot 4."),
    ("(document .dpdoc « devisDocument », cahier, PDF enregistrés et SIA451 : lot 4)", "(cahier et PDF enregistrés : lot 4)"),
]
RETRAITS_RE = [(r"const FR_CAT_NOM=\{[^}]*\};", "const FR_CAT_NOM={};"),            # aucune liste de libellés de catalogue sous licence
               (r"const FR_CAT_DE=\{.*?\};", "const FR_CAT_DE={};")]
# 2. noms internes du code (fonctions, variables) : renommés partout, de façon cohérente ; aucun n'est une clé de données
RENOMMAGES = [("ecaIsCrb", "ecaRefExterne"), ("ECA_CRB", "ECA_REF_EXT"), ("svCondNpk", "svCondCat"), ("svDpDocHTML", "svDocHTML"),
              ("ecaEbkpElements", "ecaEltListe"), ("ecaEbkpBrowser", "ecaEltNavigateur"), ("ecaEbkpDialog", "ecaEltDialogue"),
              ("ecaEbkpCode", "ecaEltCode"), ("ecaEbkp", "ecaElt"), ("feBkpImport", "feCfcImport"), ("feBkpSuggest", "feCfcSuggestion"),
              ("feBkp", "feCfc"), ("ec4ImportSia451", "ec4ImportEchange"), ("ec4ExportSia451", "ec4ExportEchange"), ("idDelta", "idOrigine"),
              ("deltaImport", "ihImport"), ("deltaParseCSV", "ihLireCSV"), ("deltaDecode", "ihDecoder"), ("deltaFileChosen", "ihFichierChoisi"),
              ("deltaAffaireFromName", "ihAffaireDuNom"), ("deltaMatchCollab", "ihCollabCorrespondant"), ("deltaNormalize", "ihNormaliser"),
              ("deltaRenderPreview", "ihApercu"), ("deltaDate", "ihDate"), ("_deltaFile", "_ihFichier"), ("_deltaParsed", "_ihLu"),
              ("_deltaBatch", "_ihLot"), ("mapDeltaPhase", "ihPhase"), ("ccListDeltakv", "ccListEchange"), ("dvImpDeltakv", "dvImpEchange"),
              ("dvListDeltakv", "dvListEchange"), ("deltakv", "echange")]
# 3. contrôle final : plus aucune trace, sauf les noms liés aux données de la base (schéma d'origine, clés des modèles d'impression :
#    invisibles, aucun échange) et, en nombre limité, les valeurs servant à ÉCARTER ou RENOMMER ces traces dans la base
TRACES = re.compile(r"[A-Za-z0-9_$-]*(?:(?i:crb|npk|sia ?451|ebkp|dpdoc|deltakv|delta ?project|deltasub|manual_fr|javap|tablemodel)"   # BKP = CFC : gardé
                    r"|\bDELTA\b)[A-Za-z0-9_$-]*")
TRACES_ADMISES = {"BKP", "EBKPELEMENT_ID", "ebkpelement", "ebkptobkp", "ebkp", "costestimatedpdoc", "dpdoc", "devisNpkPositionTable",
                  "projectFeeBkpCalculation"}
TRACES_LIMITEES = {"crb": 1,     # filtre /crb/i : écarte des listes les valeurs de référence sous licence
                   "DELTA": 6}   # anciens libellés de la base à renommer (« … Originaux », « … Files », préfixe « DELTA … »)
# 4. adresses : aucune ressource ni échange avec un site externe (seuls l'espace de noms SVG, l'ordinateur lui-même et le lien
#    « carte des environs », ouvert seulement sur un clic, sont admis)
URL = re.compile(r"""https?://([^/\s'"`<>\\):]+)""")
HOTES_ADMIS = {"www.w3.org", "127.0.0.1", "localhost", "map.search.ch"}


def retirer(textes):
    """Applique RETRAITS, RETRAITS_RE et RENOMMAGES (hors bibliothèques tierces et données binaires) ; arrêt si un retrait est introuvable."""
    vus = {a: 0 for a, _ in RETRAITS}
    for _, nv in RENOMMAGES:
        if any(re.search(r"\b" + re.escape(nv) + r"\b", t) for t in textes):
            raise SystemExit("✗ nom de remplacement déjà utilisé : " + nv)
    def f(x):
        for a, b in RETRAITS:
            vus[a] += x.count(a); x = x.replace(a, b)
        for a, b in RETRAITS_RE:
            x = re.sub(a, b, x, flags=re.S)
        for a, b in RENOMMAGES:
            x = re.sub(r"\b" + re.escape(a) + r"\b", b, x)
        return x
    sortie = [hors_b64(t, f) for t in textes]
    absents = [a for a, n in vus.items() if not n]
    if absents:
        raise SystemExit("✗ retraits introuvables (source modifiée ?) : %s" % absents)
    return sortie


def controle_traces(t):
    """→ liste des traces non admises et des sites externes (hors bibliothèques tierces et données binaires)."""
    vus, hotes = {}, set()
    def f(x):
        for m in TRACES.finditer(x):
            vus[m.group(0)] = vus.get(m.group(0), 0) + 1
        hotes.update(h.lower() for h in URL.findall(x))
        return x
    hors_b64(t, f)
    mauvais = [k for k in vus if k not in TRACES_ADMISES and k not in TRACES_LIMITEES]
    mauvais += ["%s ×%d (max %d)" % (k, vus[k], TRACES_LIMITEES[k]) for k in TRACES_LIMITEES if vus.get(k, 0) > TRACES_LIMITEES[k]]
    return sorted(mauvais), sorted(hotes - HOTES_ADMIS)


def hors_b64(t, fn):
    """Applique fn au texte hors des blocs base64 (polices, modèles PDF, images)."""
    out, pos = [], 0
    for m in B64.finditer(t):
        out.append(fn(t[pos:m.start()])); out.append(m.group(0)); pos = m.end()
    out.append(fn(t[pos:]))
    return "".join(out)


def libelles(t):
    def f(x):
        x = TOLERES.sub("\x01CANADA\x01", x)
        for a, b in LIBELLES:
            x = re.sub(a, b, x)
        return x.replace("\x01CANADA\x01", '"Canada","CAN"')
    return hors_b64(t, f)


def contextes(t, label):
    """NETTOYER_LISTE=1 : mentions restantes (hors base64), avec leur contexte."""
    hors_b64(t, lambda x: [print(label, "…" + x[max(0, m.start() - 70):m.end() + 50].replace("\n", " ") + "…") for m in re.finditer(INTERDITS, x)] and x)


def main():
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    src = open(sys.argv[1], encoding="utf-8").read()
    m = re.search(r'(<script[^>]*id="fx-src"[^>]*>)(.*?)(</script>)', src, re.S)
    if not m:
        raise SystemExit("✗ Facturation embarquée introuvable (#fx-src)")
    fx = gzip.decompress(base64.b64decode(re.sub(r"\s+", "", m.group(2)))).decode("utf-8")
    # 1. données de départ de Facturation
    seed = re.search(r"\n[ \t]*// Seed données si insuffisantes\n\(function\(\)\{\n.*?\n\}\)\(\);\n", fx, re.S)
    if not seed or "localStorage.setItem('sa_contrats'" not in seed.group(0):
        raise SystemExit("✗ bloc des données de départ de Facturation introuvable : nettoyage arrêté")
    fx = fx[:seed.start()] + "\n" + fx[seed.end():]
    clients = re.findall(r'"nom": "([^"]{4,60})"', seed.group(0))[:400]
    # exemples du cockpit (maîtres d'ouvrage réels et montants) et contrat de démonstration : anonymisés
    top = re.search(r"topMO:\[(.*?)\],\s*\n\s*monthly", fx, re.S)
    if top:
        k = iter(range(1, 100))
        fx = fx[:top.start(1)] + re.sub(r"\{l:(['\"]).*?\1,v:\d+\}", lambda m: "{l:'Client %d',v:%d}" % (next(k), 100000), top.group(1)) + fx[top.end(1):]
    fx = fx.replace("Roger Scheueurmann", "Prénom Nom").replace("Route de Lausanne 5", "Rue de l’Exemple 1")
    # 2. commentaires, 3. libellés
    import os
    fx = clean_html(fx, "Facturation")
    page = clean_html(src[:m.start()] + "\x00FX\x00" + src[m.end():], "SUBGestion")
    if os.environ.get("NETTOYER_LISTE"):
        contextes(page, "[page]"); contextes(fx, "[fx]"); return
    fx, page = libelles(fx), libelles(page)
    fx, page = retirer([fx, page])
    # 4. contrôles
    traces, externes = controle_traces(page + "\n" + fx)
    if traces or externes:
        raise SystemExit("✗ traces : %s ; sites externes : %s" % (traces[:30], externes))
    restes = []
    hors_b64(page + "\n" + fx, lambda x: restes.extend(re.findall(INTERDITS, TOLERES.sub("", x))) or x)
    restes = sorted(set(restes))
    bureau = {"Paulo Meireles", "M. Meireles", "Meireles", "Monsieur", "Madame", "Substances", "Substances Architectes"}
    bureau = {x.lower() for x in bureau} | {"substances architectes sàrl"}
    fuites = sorted(set(c for c in clients if " " in c.strip() and c.lower() not in bureau and (c in fx or c in page)))   # noms complets
    if restes or fuites:
        raise SystemExit("✗ restes : %s ; données clients : %s" % (restes[:30], fuites[:10]))
    b64 = base64.b64encode(gzip.compress(fx.encode("utf-8"), 9)).decode("ascii")
    b64 = "\n".join(b64[i:i + 120] for i in range(0, len(b64), 120))
    page = page.replace("\x00FX\x00", m.group(1) + b64 + m.group(3))
    open(sys.argv[2], "w", encoding="utf-8").write(page)
    print("✓ Version servie nettoyée : %s (%.1f Mo ; données de départ retirées, %d noms de clients vérifiés absents)"
          % (sys.argv[2], len(page.encode("utf-8")) / 1e6, len(clients)))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
convertir_modeles.py — Modèles DELTAproject (module MODELES)  ->  collections DeltaSub
=====================================================================================
Python 3.9, bibliothèque standard uniquement. LECTURE SEULE sur les sources.

Sources (DELTAprojectFiles/) :
  Templates/<catégorie>/<groupe>/<type>/<nom>/<langue>/{cover,page1,pageN,…}.xml
      catégorie = projectTemplates | addressTemplates | labelTemplates | staffTemplates |
                  timeTemplates | expensesTemplates | managementTemplates   (= FORMTEMPLATEGROUP.CATEGORY)
      groupe    = FORMTEMPLATEGROUP.NAME  (« Default » = « DELTA Originaux », « Standard », « Substances »…)
      type      = FORMTEMPLATE.TYPE       (ex. projectCostcontrolRemittanceOrder)
      nom       = FORMTEMPLATE.NAME       (ex. project1)  — libellé FR = FORMTEMPLATE.NAMEFR
  Backgrounds/<nom>.xml                    arrière-plans (même format de page)
  Graphics/*.png|jpg, UserLogo/*.png       images (logos) — converties en data-URL

Format des pages : XML de java.beans.XMLDecoder (aq.form.model.Page + composants aq.form.*).
Un petit interpréteur ci-dessous reconstruit les objets (object / void property / void method=add /
getField-set des Rectangle / Color / Enum / tableaux / idref) puis on normalise en JSON simple.

Unités : points typographiques (A4 portrait = 595 × 842).

Sortie : {"modele": {id: Modele}, "arriereplan": {id: Page}, "image": {id: Image}}
  Modele = { categorie, groupe, type, nom, libelle {fr,de,it,en}, langues: { "french": {pages: {cover|page1|pageN…: Page}} } }
  Page   = { largeur, hauteur, orientation, zone {x,y,l,h}, arrierePlan (nom), elements: [ Element ] }
  Element (commun) = { t: "texte"|"champ"|"tableau"|"trait"|"rectangle"|"image"|"imageChamp"|"repere",
                       x, y, l, h, police, taille, couleur, fond, trait (épaisseur), alignement }
     texte   : + texte (texte brut extrait du RTF), gras, italique, souligne, rtf (source)
     champ   : + champ (Field$Type, ex. projectNumber), format [3 textes], style, texte (libellé d'aperçu)
     tableau : + champ, lignes (hauteur de ligne), rayures, couleurRayure, traitsH, traitsV, colonnes…
     trait   : + x2, y2
     image   : + fichier
Usage : python3 convertir_modeles.py <DELTAprojectFiles> <sortie.json> [--tables <dossier d'extraction>]
"""
import base64
import csv
import glob
import json
import os
import re
import sys
import xml.etree.ElementTree as ET

LANGUES = {"french": "fr", "german": "de", "italian": "it", "english": "en", "englisch": "en", "englsh": "en"}


# ───────────────────────────── Interpréteur XMLDecoder ─────────────────────────────
class Obj(dict):
    """Objet Java reconstruit : dict des propriétés + '$c' (classe) + 'items' (méthode add)."""


def _val(node, ids):
    tag = node.tag
    if tag in ("int", "long", "short", "byte"):
        return int(node.text or 0)
    if tag in ("float", "double"):
        return float(node.text or 0)
    if tag == "boolean":
        return (node.text or "").strip() == "true"
    if tag == "string":
        return node.text or ""
    if tag == "char":
        return node.text or ""
    if tag == "null":
        return None
    if tag == "class":
        return node.text
    if tag == "array":
        n = int(node.get("length") or 0)
        arr = [None] * n
        for v in node:
            if v.tag == "void" and v.get("index") is not None:
                kids = [k for k in v]
                arr[int(v.get("index"))] = _val(kids[0], ids) if kids else None
        if node.get("id"):
            ids[node.get("id")] = arr
        return arr
    if tag == "object":
        if node.get("idref"):
            return ids.get(node.get("idref"))
        cls = node.get("class") or ""
        kids = [k for k in node]
        if node.get("method") == "valueOf" and cls == "java.lang.Enum":      # Enum.valueOf(Classe, "NOM")
            return kids[1].text if len(kids) > 1 else None
        if node.get("method") == "valueOf" and len(kids) == 1 and kids[0].tag == "string":   # Classe$Type.valueOf("NOM") (ancien format)
            return kids[0].text
        if node.get("field"):                                                  # constante statique
            return node.get("field")
        o = Obj()
        o["$c"] = cls
        if node.get("id"):
            ids[node.get("id")] = o
        args = []
        for k in kids:
            if k.tag == "void":
                _void(o, k, ids)
            else:
                args.append(_val(k, ids))
        if args:
            o["$args"] = args
        if cls.endswith("Color") or cls.endswith("ColorUIResource"):
            a = args + [255] * (4 - len(args))
            o["rgba"] = a[:4]
        return o
    if tag == "void":           # void seul (valeur retournée par une méthode) : ignoré
        return None
    return node.text


def _void(o, v, ids):
    kids = [k for k in v]
    prop, meth = v.get("property"), v.get("method")
    if prop:
        vals = [_val(k, ids) for k in kids if k.tag != "void"]
        if vals:
            o[prop] = vals[0]
        subs = [k for k in kids if k.tag == "void"]
        if subs:                  # objet obtenu par le getter puis modifié (ex. componentData.add(…) × n)
            sub = o.get(prop) if isinstance(o.get(prop), dict) else Obj()
            for k in subs:
                _void(sub, k, ids)
            o[prop] = sub
        return
    if meth == "add":
        vals = [_val(k, ids) for k in kids if k.tag != "void"]
        if vals:
            o.setdefault("items", []).append(vals[0] if len(vals) == 1 else vals)
        return
    if meth == "getField" and v.get("class") == "java.awt.Rectangle":   # Rectangle.x = …
        name = kids[0].text if kids else None
        for k in kids[1:]:
            if k.tag == "void" and k.get("method") == "set":
                vv = [_val(x, ids) for x in k if not (x.tag == "object" and x.get("idref"))]
                if name and vv:
                    o[name] = vv[0]
        return
    if meth == "put":
        vals = [_val(k, ids) for k in kids if k.tag != "void"]
        if len(vals) == 2:
            o.setdefault("map", {})[str(vals[0])] = vals[1]
        return
    if v.get("id") and kids:      # void id=… method=get… : valeur réutilisée par idref
        val = _val(kids[0], ids) if kids[0].tag != "void" else None
        ids[v.get("id")] = val
        return
    for k in kids:                # appels chaînés : on descend quand même
        if k.tag == "void":
            _void(o, k, ids)


def decode(path):
    root = ET.parse(path).getroot()          # <java …>
    ids = {}
    for k in root:
        return _val(k, ids)
    return None


# ───────────────────────────── Normalisation ─────────────────────────────
def rtf_texte(rtf):
    """Texte brut d'un RTF simple (celui des TextField / Text DELTA) + style dominant."""
    if not rtf or not rtf.startswith("{\\rtf"):
        return rtf or "", {}
    st = {"gras": "\\b " in rtf or "\\b\\" in rtf and "\\b0" not in rtf, "italique": bool(re.search(r"\\i(?!0)\b", rtf)),
          "souligne": bool(re.search(r"\\ul(?!0|none)\b", rtf))}
    m = re.search(r"\\fs(\d+)", rtf)
    if m:
        st["taille"] = int(m.group(1)) / 2
    al = re.search(r"\\q([lcrj])", rtf)
    if al:
        st["alignement"] = {"l": "gauche", "c": "centre", "r": "droite", "j": "justifie"}[al.group(1)]
    s = re.sub(r"\{\\fonttbl[^{}]*\}", "", rtf)
    s = re.sub(r"\{\\colortbl[^{}]*\}", "", s)
    s = s.replace("\\par", "\n").replace("\\line", "\n").replace("\\tab", "\t")
    s = re.sub(r"\\'([0-9a-fA-F]{2})", lambda m: bytes([int(m.group(1), 16)]).decode("cp1252"), s)
    s = re.sub(r"\\u(-?\d+)\??", lambda m: chr(int(m.group(1)) % 65536), s)
    # séquences Mac « \'ee » écrites par DELTA avec &apos; : ma\'eetre → maître (Mac Roman)
    s = re.sub(r"\\'([0-9a-fA-F]{2})", "", s)
    s = re.sub(r"\\[a-zA-Z]+-?\d* ?", "", s)
    s = s.replace("\\{", "{").replace("\\}", "}").replace("{", "").replace("}", "")
    lignes = [l.rstrip() for l in s.split("\n")]
    while lignes and not lignes[-1]:
        lignes.pop()
    return "\n".join(l.lstrip() if i == 0 else l for i, l in enumerate(lignes)).strip("\n"), st


def couleur(c):
    if isinstance(c, dict) and c.get("rgba"):
        r, g, b, a = c["rgba"]
        return "#%02x%02x%02x" % (r, g, b) if a >= 255 else "rgba(%d,%d,%d,%.2f)" % (r, g, b, a / 255)
    return None


def element(o):
    cls = (o.get("$c") or "").split(".")[-1]
    b = o.get("bounds") or {}
    e = {"x": b.get("x", 0), "y": b.get("y", 0), "l": b.get("width", 0), "h": b.get("height", 0)}
    for k_src, k in (("fontName", "police"), ("fontSize", "taille"), ("strokeThickness", "trait"), ("tabStops", "tabulations")):
        if o.get(k_src) not in (None, ""):
            e[k] = o[k_src]
    if couleur(o.get("foregroundColor")):
        e["couleur"] = couleur(o["foregroundColor"])
    fond = couleur(o.get("backgroundColor"))
    if fond and fond != "#ffffff":
        e["fond"] = fond
    if o.get("textAlignment") is not None:
        e["alignement"] = {0: "gauche", 2: "gauche", 1: "centre", 4: "droite", 3: "droite"}.get(o["textAlignment"], o["textAlignment"])
    if isinstance(o.get("border"), dict) and "LineBorder" in (o["border"].get("$c") or ""):
        e["cadre"] = True
    txt, st = rtf_texte(o.get("text"))
    if cls in ("Text", "TextField", "Label"):
        f = o.get("field")
        if isinstance(f, dict) and f.get("type"):
            e.update(t="champ", champ=f["type"], format=f.get("format") or [], style=(f.get("style") or {}).get("$c", "").split(".")[-1])
        else:
            e["t"] = "texte"
        e["texte"] = txt
        if e["t"] == "texte" and st.get("taille"):     # texte fixe : la mise en forme RTF fait foi (taille réelle)
            e["taille"] = st["taille"]
        e.update({k: v for k, v in st.items() if k not in e})
    elif cls == "TableField":
        f = o.get("field") or {}
        e.update(t="tableau", champ=f.get("type"), texte=txt, nom=o.get("name"))
        for src in (f, o):        # propriétés d'affichage portées par le champ (aq.form.fields.TableField) ou le composant
            for k_src, k in (("rowHeight", "hauteurLigne"), ("displayStripes", "rayures"), ("horizontalLine", "traitsH"),
                             ("verticalLine", "traitsV"), ("columnWidths", "largeursColonnes"), ("headerHeight", "hauteurEntete"),
                             ("lineColor", "couleurTrait")):
                if src.get(k_src) is not None:
                    e[k] = couleur(src[k_src]) if k == "couleurTrait" else src[k_src]
            if couleur(src.get("stripeColor")):
                e["couleurRayure"] = couleur(src["stripeColor"])
    elif cls == "Line":
        e["t"] = "trait"
        e["x2"], e["y2"] = o.get("x2", e["x"] + e["l"]), o.get("y2", e["y"] + e["h"])
        if o.get("orientation") is not None:
            e["sens"] = o["orientation"]
    elif cls == "Rectangle":
        e["t"] = "rectangle"
    elif cls == "Image":
        e.update(t="image", fichier=o.get("filename"))
    elif cls == "ImageField":
        f = o.get("field") or {}
        e.update(t="imageChamp", champ=f.get("type") if isinstance(f, dict) else None, fichier=o.get("filename"))
    elif cls == "Marker":
        e["t"] = "repere"
    else:
        e["t"] = cls
    return e


def page(path):
    """Page normalisée en points. Les coordonnées sont enregistrées au zoom de l'éditeur DELTA
    (zoomFactor 100/125/150/200 %) : on les ramène à 100 %. Les tailles de police restent en points.
    orientation : 1 = portrait ; absente (défaut du bean) = paysage → largeur = paperHeight."""
    p = decode(path)
    if not isinstance(p, dict):
        return None
    z = (p.get("zoomFactor") or 100) / 100.0
    portrait = p.get("orientation") == 1
    pw, ph = p.get("paperWidth") or 595, p.get("paperHeight") or 842
    els = []
    for o in (p.get("componentData") or {}).get("items", []):
        if not isinstance(o, dict):
            continue
        e = element(o)
        for k in ("x", "y", "l", "h", "x2", "y2"):
            if isinstance(e.get(k), (int, float)):
                e[k] = round(e[k] / z, 2)
        els.append(e)
    return {"largeur": round(pw if portrait else ph, 2), "hauteur": round(ph if portrait else pw, 2),
            "orientation": "portrait" if portrait else "paysage",
            "zone": {"x": p.get("imageableX"), "y": p.get("imageableY"), "l": p.get("imageableWidth"), "h": p.get("imageableHeight")},
            "arrierePlan": p.get("backgroundFilename") or None, "elements": els}


def lire_csv(dossier, table):
    f = os.path.join(dossier, "tables", "APP.%s.csv" % table)
    if not dossier or not os.path.exists(f):
        return []
    return list(csv.DictReader(open(f, encoding="utf-8", newline=""), delimiter=";"))


def main(argv):
    args = argv[1:]
    tables = None
    if "--tables" in args:
        i = args.index("--tables"); tables = args[i + 1]; del args[i:i + 2]
    if len(args) != 2:
        print(__doc__); return 2
    racine, sortie = args
    groupes = {(g["CATEGORY"], g["NAME"]): g for g in lire_csv(tables, "FORMTEMPLATEGROUP")}
    ftpl = {}
    gid = {g["ID"]: g for g in groupes.values()}
    for t in lire_csv(tables, "FORMTEMPLATE"):
        g = gid.get(t["FORMTEMPLATEGROUP_ID"])
        if g:
            ftpl[(g["CATEGORY"], g["NAME"], t["TYPE"], t["NAME"])] = t
    out = {"modele": {}, "modelegroupe": {}, "arriereplan": {}, "image": {}}
    n_pages = err = 0
    for cat_dir in sorted(glob.glob(os.path.join(racine, "Templates", "*Templates"))):
        cat = os.path.basename(cat_dir)
        for g_dir in sorted(glob.glob(os.path.join(cat_dir, "*"))):
            grp = os.path.basename(g_dir)
            gr = groupes.get((cat, grp), {})
            out["modelegroupe"]["%s/%s" % (cat, grp)] = {"categorie": cat, "groupe": grp, "libelle": gr.get("NAMEFR") or ("DELTA Originaux" if grp == "Default" else grp),
                                                         "ordre": int(gr.get("SORTORDER") or 9), "verrouille": grp == "Default"}
            for t_dir in sorted(glob.glob(os.path.join(g_dir, "*"))):
                typ = os.path.basename(t_dir)
                if not os.path.isdir(t_dir):
                    continue
                # dossiers de langue à n'importe quelle profondeur : le chemin intermédiaire = nom du modèle
                for l_dir, _, _ in sorted(os.walk(t_dir)):
                    lg = os.path.basename(l_dir)
                    if lg not in LANGUES:
                        continue
                    nom = os.path.relpath(os.path.dirname(l_dir), t_dir)
                    nom = "" if nom == "." else nom
                    key = "%s/%s/%s/%s" % (cat, grp, typ, nom)
                    ft = ftpl.get((cat, grp, typ, nom.split("/")[-1]), {})
                    m = out["modele"].get(key) or {"categorie": cat, "groupe": grp, "type": typ, "nom": nom,
                         "libelle": {"fr": ft.get("NAMEFR") or "", "de": ft.get("NAMEGE") or "", "it": ft.get("NAMEIT") or "", "en": ft.get("NAMEEN") or ""},
                         "langues": {}}
                    pages = {}
                    for f in sorted(glob.glob(os.path.join(l_dir, "*.xml"))):
                        try:
                            pg = page(f)
                            if pg:
                                pages[os.path.basename(f)[:-4]] = pg; n_pages += 1
                        except Exception as e:           # page illisible : signalée, pas bloquante
                            err += 1; print("  ! %s : %s" % (f, e), file=sys.stderr)
                    if pages:
                        m["langues"].setdefault(LANGUES[lg], {"pages": {}})["pages"].update(pages)
                        out["modele"][key] = m
    for f in sorted(glob.glob(os.path.join(racine, "Backgrounds", "*.xml"))):
        try:
            pg = page(f)
            if pg:
                out["arriereplan"][os.path.basename(f)[:-4]] = pg
        except Exception as e:
            err += 1; print("  ! %s : %s" % (f, e), file=sys.stderr)
    # Modèles de documents (nouveau format DELTA : ProjectDocuments/Templates/TemplateSet-<n>/<type>-<langue>.dpdoc
    # = zip contenant report.json) ; TemplateSet-<TEMPLATEFOLDERID> (0 = général, 1 = affaires).
    import zipfile
    dt = {(d["TEMPLATEFOLDERID"], d["FILENAME"]): d for d in lire_csv(tables, "DOCTEMPLATE")}
    out["modeledocument"] = {}
    for f in sorted(glob.glob(os.path.join(racine, "ProjectDocuments", "Templates", "TemplateSet-*", "*.dpdoc"))):
        jeu = os.path.basename(os.path.dirname(f)).split("-")[-1]
        nom = os.path.basename(f)
        meta = dt.get((jeu, nom))
        if meta is None and jeu not in ("0", "1"):
            continue                              # jeux non référencés par DOCTEMPLATE (copies)
        try:
            rep = json.loads(zipfile.ZipFile(f).read("report.json"))
        except Exception as e:
            err += 1; print("  ! %s : %s" % (f, e), file=sys.stderr); continue
        m = re.match(r"(.+)-(de|fr|it|en)\.dpdoc$", nom)
        out["modeledocument"]["%s/%s" % (jeu, nom)] = {
            "jeu": jeu, "fichier": nom, "type": (meta or {}).get("DOCUMENTTYPEKEY") or (m.group(1) if m else nom),
            "langue": (meta or {}).get("LANGUAGEKEY") or (m.group(2) if m else ""), "description": (meta or {}).get("DESCRIPTION") or rep.get("reportTitle") or "",
            "masque": (meta or {}).get("ISHIDDEN") == "1", "verrouille": (meta or {}).get("ISLOCKED") == "1", "report": rep}
    for d in ("Graphics", "UserLogo"):
        for f in sorted(glob.glob(os.path.join(racine, d, "*"))):
            ext = f.rsplit(".", 1)[-1].lower()
            if ext in ("png", "jpg", "jpeg", "gif"):
                mime = "image/png" if ext == "png" else "image/gif" if ext == "gif" else "image/jpeg"
                out["image"][os.path.basename(f)] = {"nom": os.path.basename(f), "dossier": d,
                                                     "data": "data:%s;base64,%s" % (mime, base64.b64encode(open(f, "rb").read()).decode())}
    with open(sortie, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False)
    print("Modèles : %d modèles, %d pages, %d arrière-plans, %d images, %d modèles de documents, %d page(s) illisible(s)."
          % (len(out["modele"]), n_pages, len(out["arriereplan"]), len(out["image"]), len(out["modeledocument"]), err))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))

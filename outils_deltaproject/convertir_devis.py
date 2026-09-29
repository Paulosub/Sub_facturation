#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
convertir_devis.py — Devis généraux DELTAproject  ->  collection DeltaSub « costestimate »
==========================================================================================

Python 3.9, bibliothèque standard uniquement.  Lecture seule sur les sources.
Schéma cible : voir spec_4_devis_soumissions.md, section « Schéma final DeltaSub ».

1. OÙ SONT LES DEVIS (vérifié le 29.09.2026 sur APP.COSTESTIMATEDOCUMENT.csv : 221/221)
------------------------------------------------------------------------------------------
    DELTAprojectFiles/Construction/Costestimate/<PROJECT_ID>/<ID>/costestimate
        1er niveau  = COSTESTIMATEDOCUMENT.PROJECT_ID  (= PROJECT.ID de l'affaire)
        2e  niveau  = COSTESTIMATEDOCUMENT.ID          (= clé de la collection « costestimate »)
    Dans ce dossier :
        costestimate                      -> VERSION COURANTE (objet Java sérialisé
                                             deltaproject.costestimate.data.Estimate)
        costestimateDESC                  -> descriptifs de la version courante (flux Java
                                             « écrit à la main », lu ici par lire_desc())
        costestimate_JJ.MM.AAAA HH.MM     -> copies de sauvegarde horodatées (historique,
        costestimate_… DESC                  à ignorer)
        costestimatetemp                  -> sauvegarde automatique temporaire (peut être plus
                                             récente que « costestimate » si DELTA a été fermé
                                             sans enregistrer : NE PAS l'utiliser)
        documents/                        -> PDF joints au document
    Un seul document (ID 1203, marqué supprimé) n'a pas de fichier. Les 130 documents non
    supprimés (ISMARKEDASDELETED = 0) ont tous un fichier « costestimate ».

2. CHAÎNE DE CONVERSION
------------------------
    a) Ser2Json.java (JVM de DELTAproject, via ./jrun) :  costestimate -> <ID>.json
       (plusieurs paires source/sortie par appel).  Copier aussi costestimateDESC -> <ID>.DESC
       dans le même dossier (facultatif, sinon « descriptif » = null).
    b) python3 convertir_devis.py <dossier_raw> <sortie.json> [--entetes APP.COSTESTIMATEDOCUMENT.csv]
                                  [--desc <dossier contenant <ID>.DESC ou racine Costestimate>]
       -> écrit {"costestimate": {"<ID>": {...}}}  et  <sortie>.rapport.json (contrôles).
    Fichiers d'entrée reconnus : « <ID>.json » ou « costestimate_<ID>.json » dont la racine est
    un deltaproject.costestimate.data.Estimate (les autres JSON du dossier sont ignorés).

3. CONTRÔLE
-----------
    Chaque devis est recalculé avec les règles DeltaSub (calculer()) et comparé aux totaux
    stockés par DELTA (kvTotal / kvExVat / optionValue de chaque position, tolérance 0.05 CHF).
    Les écarts sont listés dans la sortie console et dans <sortie>.rapport.json.
    ATTENTION : DELTA enregistre les totaux de la vue courante. Si un filtre d'ouvrages était
    actif à la sauvegarde, les totaux stockés ne couvrent que ces ouvrages ; le contrôle
    retrouve alors le filtre (ligne « OK* », champ source.filtreActifALaSauvegarde). Les
    données converties, elles, contiennent toujours TOUS les ouvrages.
    Résultat au 29.09.2026 sur les 130 devis non supprimés : 126 OK, 4 OK* (filtre), 0 écart,
    130 fichiers DESC lus.
"""

import csv
import datetime
import json
import os
import re
import struct
import sys

SCHEMA_VERSION = 1
TOL = 0.05

BASES = {1: "offre", 2: "prevision", 3: "calcul", 4: "estimation", 5: "supposition"}


# ════════════════════════════════════════════════════════════════════════════════════════
#  Lecteur minimal du protocole de sérialisation Java (pour costestimateDESC)
# ════════════════════════════════════════════════════════════════════════════════════════
class _JavaObj(dict):
    """Objet Java désérialisé : dict des champs + attribut classe."""
    cls = ""


class JavaStream:
    """Sous-ensemble suffisant de java.io.ObjectInputStream (readInt/readBoolean/readObject)."""

    def __init__(self, data):
        if data[:4] != b"\xac\xed\x00\x05":
            raise ValueError("pas un flux de sérialisation Java")
        self.b = data
        self.p = 4
        self.handles = []
        self.block = b""
        self.bp = 0

    # -- octets bruts ----------------------------------------------------------------------
    def _raw(self, n):
        if self.p + n > len(self.b):
            raise EOFError("fin de flux")
        v = self.b[self.p:self.p + n]
        self.p += n
        return v

    def _u1(self):
        return self._raw(1)[0]

    def _u2(self):
        return struct.unpack(">H", self._raw(2))[0]

    def _i4(self):
        return struct.unpack(">i", self._raw(4))[0]

    def _utf(self, n):
        raw = self._raw(n).replace(b"\xc0\x80", b"\x00")  # UTF-8 modifié
        s = raw.decode("utf-8", "surrogatepass")
        try:
            return s.encode("utf-16", "surrogatepass").decode("utf-16")
        except UnicodeError:
            return s

    # -- données primitives de niveau « bloc » ------------------------------------------------
    def _need(self, n):
        while len(self.block) - self.bp < n:
            if len(self.block) - self.bp > 0:
                raise ValueError("donnée primitive à cheval sur deux blocs")
            tc = self._u1()
            if tc == 0x77:
                ln = self._u1()
            elif tc == 0x7A:
                ln = self._i4()
            else:
                raise ValueError("OptionalData : bloc attendu, trouvé 0x%02x" % tc)
            self.block = self._raw(ln)
            self.bp = 0
        v = self.block[self.bp:self.bp + n]
        self.bp += n
        return v

    def readInt(self):
        return struct.unpack(">i", self._need(4))[0]

    def readBoolean(self):
        return self._need(1)[0] != 0

    def readObject(self):
        if len(self.block) - self.bp > 0:
            raise ValueError("OptionalData : données primitives non lues")
        return self._content(self._u1())

    # -- contenu ---------------------------------------------------------------------------
    def _new_handle(self, obj):
        self.handles.append(obj)
        return len(self.handles) - 1

    def _content(self, tc):
        if tc == 0x70:  # TC_NULL
            return None
        if tc == 0x71:  # TC_REFERENCE
            return self.handles[self._i4() - 0x7E0000]
        if tc == 0x74:  # TC_STRING
            s = self._utf(self._u2())
            self._new_handle(s)
            return s
        if tc == 0x7C:  # TC_LONGSTRING
            s = self._utf(struct.unpack(">q", self._raw(8))[0])
            self._new_handle(s)
            return s
        if tc in (0x72, 0x7D):  # descripteur de classe isolé
            return self._classdesc(tc)
        if tc == 0x73:  # TC_OBJECT
            return self._object()
        if tc == 0x75:  # TC_ARRAY
            return self._array()
        if tc == 0x7E:  # TC_ENUM
            desc = self._classdesc(self._u1())
            h = self._new_handle(None)
            name = self._content(self._u1())
            self.handles[h] = name
            return name
        if tc == 0x76:  # TC_CLASS
            desc = self._classdesc(self._u1())
            self._new_handle(desc)
            return desc
        if tc == 0x79:  # TC_RESET
            self.handles = []
            return self._content(self._u1())
        raise ValueError("code de type inattendu 0x%02x à %d" % (tc, self.p - 1))

    def _classdesc(self, tc):
        if tc == 0x70:
            return None
        if tc == 0x71:
            return self.handles[self._i4() - 0x7E0000]
        if tc == 0x7D:  # proxy
            h = self._new_handle(None)
            for _ in range(self._i4()):
                self._utf(self._u2())
            self._skip_annotation()
            d = {"name": "$Proxy", "flags": 0x02, "fields": [], "super": self._classdesc(self._u1())}
            self.handles[h] = d
            return d
        if tc != 0x72:
            raise ValueError("descripteur de classe attendu, trouvé 0x%02x" % tc)
        name = self._utf(self._u2())
        self._raw(8)  # serialVersionUID
        d = {"name": name, "flags": 0, "fields": [], "super": None}
        self._new_handle(d)
        d["flags"] = self._u1()
        for _ in range(self._u2()):
            t = chr(self._u1())
            fname = self._utf(self._u2())
            if t in "[L":
                self._content(self._u1())  # nom de classe du champ
            d["fields"].append((t, fname))
        self._skip_annotation()
        d["super"] = self._classdesc(self._u1())
        return d

    def _skip_annotation(self):
        while True:
            tc = self._u1()
            if tc == 0x78:  # TC_ENDBLOCKDATA
                return
            if tc == 0x77:
                self._raw(self._u1())
            elif tc == 0x7A:
                self._raw(self._i4())
            else:
                self._content(tc)

    def _prim(self, t):
        if t == "I":
            return self._i4()
        if t == "Z":
            return self._u1() != 0
        if t == "B":
            return struct.unpack(">b", self._raw(1))[0]
        if t == "C":
            return chr(self._u2())
        if t == "S":
            return struct.unpack(">h", self._raw(2))[0]
        if t == "J":
            return struct.unpack(">q", self._raw(8))[0]
        if t == "F":
            return struct.unpack(">f", self._raw(4))[0]
        if t == "D":
            return struct.unpack(">d", self._raw(8))[0]
        raise ValueError("type primitif inconnu " + t)

    def _object(self):
        desc = self._classdesc(self._u1())
        obj = _JavaObj()
        obj.cls = desc["name"] if desc else ""
        self._new_handle(obj)
        chain = []
        d = desc
        while d:
            chain.insert(0, d)
            d = d["super"]
        for d in chain:
            flags = d["flags"]
            if flags & 0x04:  # SC_EXTERNALIZABLE
                if flags & 0x08:
                    self._skip_annotation()
                else:
                    raise ValueError("Externalizable sans BLOCK_DATA non géré")
                continue
            for t, fname in d["fields"]:
                obj[fname] = self._prim(t) if t not in "[L" else self._content(self._u1())
            if flags & 0x01:  # SC_WRITE_METHOD
                self._skip_annotation()
        return obj

    def _array(self):
        desc = self._classdesc(self._u1())
        arr = []
        self._new_handle(arr)
        n = self._i4()
        comp = desc["name"][1] if desc else "L"
        for _ in range(n):
            arr.append(self._prim(comp) if comp not in "[L" else self._content(self._u1()))
        return arr


def _lire_texte_riche(js):
    """Suite de segments « while readBoolean(): texte, police, taille, gras, ital., soul., couleur »."""
    runs = []
    while js.readBoolean():
        txt = js.readObject()
        font = js.readObject()
        size = js.readInt()
        bold = js.readBoolean()
        ital = js.readBoolean()
        und = js.readBoolean()
        color = js.readObject()
        rgb = None
        if isinstance(color, dict) and "value" in color:
            v = color["value"] & 0xFFFFFF
            rgb = "#%06x" % v
        runs.append({"t": "" if txt is None else str(txt), "police": font or "", "taille": size,
                     "b": bold, "i": ital, "u": und, "couleur": rgb})
    return runs


def _runs_vers_desc(runs):
    """-> (texte brut, runs ou None si aucune mise en forme particulière)."""
    if not runs:
        return None, None
    texte = "".join(r["t"] for r in runs)
    if texte.endswith("\n"):  # DELTA retire le dernier saut de ligne
        texte = texte[:-1]
    if texte == "":
        return None, None
    style = any(r["b"] or r["i"] or r["u"] or (r["couleur"] not in (None, "#000000")) for r in runs)
    return texte, (runs if style else None)


def lire_desc(chemin_ou_octets):
    """
    Lit un fichier costestimateDESC.  Format (Estimate.internalizeDesc, version 4) :
        int version, int nbPositions,
        par position : Object numéroCFC, int nbOuvrages, boolean aDescriptif, [texte riche],
                       par ouvrage : Object codeOuvrage, Object codeLocalisation,
                                     boolean aDescriptif, [texte riche]
    Retour : {cfc: {"texte","runs","parts": {(ouv, lg): {"texte","runs"}}}}
    """
    data = chemin_ou_octets
    if isinstance(chemin_ou_octets, str):
        with open(chemin_ou_octets, "rb") as f:
            data = f.read()
    js = JavaStream(data)
    js.readInt()  # version
    n = js.readInt()
    out = {}
    for _ in range(n):
        cfc = str(js.readObject())
        nsp = js.readInt()
        t, r = (None, None)
        if js.readBoolean():
            t, r = _runs_vers_desc(_lire_texte_riche(js))
        parts = {}
        for _ in range(nsp):
            to = js.readObject()
            lg = js.readObject()
            pt, pr = (None, None)
            if js.readBoolean():
                pt, pr = _runs_vers_desc(_lire_texte_riche(js))
            parts[(str(to or ""), str(lg or ""))] = {"texte": pt, "runs": pr}
        out[cfc] = {"texte": t, "runs": r, "parts": parts}
    return out


# ════════════════════════════════════════════════════════════════════════════════════════
#  Conversion
# ════════════════════════════════════════════════════════════════════════════════════════
def _index_ids(o, idx):
    if isinstance(o, dict):
        if "$id" in o:
            idx[o["$id"]] = o
        for v in o.values():
            _index_ids(v, idx)
    elif isinstance(o, list):
        for v in o:
            _index_ids(v, idx)


def _deref(o, idx):
    if isinstance(o, dict) and "$ref" in o and len(o) == 1:
        return idx.get(o["$ref"], {})
    return o


def _lst(o, idx):
    o = _deref(o, idx)
    return [_deref(x, idx) for x in o] if isinstance(o, list) else []


def _num(x, nd=6):
    if x is None:
        return 0
    try:
        x = float(x)
    except (TypeError, ValueError):
        return 0
    r = round(x, nd)
    return int(r) if r == int(r) and abs(r) < 1e15 else r


def _sans_meta(d):
    return {k: v for k, v in d.items() if not k.startswith("$")} if isinstance(d, dict) else {}


def cfc_parent(cfc, existants):
    """Parent hiérarchique le plus proche présent dans « existants » (211.6 → 211 → 21 → 2)."""
    s = cfc
    while True:
        if "." in s:
            s = s.rsplit(".", 1)[0]
        elif len(s) > 1:
            s = s[:-1]
        else:
            return None
        if s in existants:
            return s


def _ligne(c):
    base = c.get("priceBaseState", -1)
    return {
        "commentaire": c.get("comment", "") or "",
        "base": BASES.get(base),
        "formule": c.get("equation", "") or "",
        "qte": _num(c.get("quantity")),
        "unite": c.get("measUnit", "") or "",
        "prixHT": _num(c.get("price")),
        "tva": _num(c.get("vatFac"), 4),
        "var": bool(c.get("option", False)),
        "ttc": _num(c.get("total"), 4),
    }


def _partie(src, idx, ouv, sp_id, lg, mode_defaut, desc_part):
    ps = src.get("priceState", 0)
    mode = "exclure" if (ps == 2 or mode_defaut == "exclure") else "inclure"
    fixe = None
    if src.get("fixedValue"):
        fixe = {"ttc": _num(src.get("fixedValue"), 4), "tva": _num(src.get("fixedVatFactor"), 4)}
    p = {
        "ouv": ouv,
        "SUBPROJECT_ID": sp_id,
        "lg": lg,
        "mode": mode,
        "honorPct": _num(src.get("honorarFactor"), 4),
        "commentaire": src.get("comment", "") or "",
        "definitif": bool(src.get("isDefinitif", False)),
        "fixe": fixe,
        "descriptif": None,
        "descriptifFormat": None,
        "lignes": [_ligne(c) for c in _lst(src.get("calcList"), idx) if isinstance(c, dict) and c],
    }
    if desc_part:
        p["descriptif"] = desc_part.get("texte")
        p["descriptifFormat"] = desc_part.get("runs")
    return p


def convert(raw, header_row=None, desc=None):
    """
    raw        : JSON produit par Ser2Json pour un fichier « costestimate » (racine Estimate).
    header_row : ligne de COSTESTIMATEDOCUMENT (dict ; ID, PROJECT_ID…) ou None.
    desc       : résultat de lire_desc() pour le costestimateDESC correspondant, ou None.
    Retour     : dict au format « Schéma final DeltaSub » (collection costestimate).
    """
    if raw.get("$c") != "deltaproject.costestimate.data.Estimate":
        raise ValueError("racine inattendue : %r" % raw.get("$c"))
    idx = {}
    _index_ids(raw, idx)
    fichier = raw.get("fileName", "") or ""
    m = re.search(r"Costestimate/(\d+)/(\d+)/", fichier)
    doc_id = int(header_row["ID"]) if header_row and header_row.get("ID") else (int(m.group(2)) if m else None)
    prj_id = int(header_row["PROJECT_ID"]) if header_row and header_row.get("PROJECT_ID") else (int(m.group(1)) if m else None)
    desc = desc or {}

    bkps = [b for b in _lst(raw.get("bkpList"), idx) if isinstance(b, dict) and b.get("number") is not None]
    numeros = [str(b["number"]) for b in bkps]
    ensemble = set(numeros)
    a_enfants = set()
    for n in numeros:
        par = cfc_parent(n, ensemble)
        if par:
            a_enfants.add(par)

    # ouvrages (ordre de première apparition)
    ouvrages, vus = [], set()
    for b in bkps:
        for sp in _lst(b.get("kvSubProjectList"), idx):
            to = sp.get("to")
            if to is None:
                continue
            if to not in vus:
                vus.add(to)
                ouvrages.append({"code": to, "SUBPROJECT_ID": sp.get("dbId"), "lg": sp.get("lg", "") or ""})

    positions, alertes = [], []
    for b in bkps:
        cfc = str(b["number"])
        d = desc.get(cfc) or {}
        mode_b = "exclure" if b.get("priceState") == 2 else "inclure"
        pos = {
            "cfc": cfc,
            "texte": (b.get("text1") or b.get("text") or "").strip(),
            "texte2": (b.get("text2") or "").strip(),
            "genere": bool(b.get("isGenerated", False)),
            "descriptif": d.get("texte"),
            "descriptifFormat": d.get("runs"),
            "parts": [],
        }
        sps = [s for s in _lst(b.get("kvSubProjectList"), idx) if isinstance(s, dict) and "to" in s]
        lignes_b = _lst(b.get("calcList"), idx)
        if cfc in a_enfants:
            # totalisateur : pas de saisie (les SubProjectItem éventuels ne sont que des caches)
            if lignes_b or any(_lst(s.get("calcList"), idx) for s in sps):
                alertes.append("%s : totalisateur avec lignes de calcul (conservées)" % cfc)
            else:
                positions.append(pos)
                continue
        if sps:
            for s in sps:
                dp = (d.get("parts") or {}).get((str(s.get("to") or ""), str(s.get("lg") or "")))
                pos["parts"].append(_partie(s, idx, s.get("to"), s.get("dbId"), s.get("lg", "") or "", mode_b, dp))
            if lignes_b:
                alertes.append("%s : lignes au niveau position ET ouvrages" % cfc)
                pos["parts"].append(_partie(b, idx, None, None, "", mode_b, None))
        else:
            pos["parts"].append(_partie(b, idx, None, None, "", mode_b, None))
        positions.append(pos)

    # remarques préliminaires
    remarques = []
    for it in _lst(raw.get("introDescList"), idx):
        nom, txt = (it.get("name") or ""), (it.get("desc") or "")
        if nom.strip() or txt.strip():
            remarques.append({"nom": nom.strip(), "texte": txt})

    # présentations
    niveaux = (("allDigitBreak", "tous"), ("twoDigitBreak", "2"), ("oneDigitBreak", "1"))
    presentations = []
    for p in _lst(raw.get("prefsList"), idx):
        sauts = []
        for pb in _lst(p.get("pageBreakList"), idx):
            niv = next((v for k, v in niveaux if pb.get(k)), "tous")
            sauts.append({"cfc": str(pb.get("number", "")), "niveau": niv})
        presentations.append({"nom": p.get("name", ""), "favori": bool(p.get("isFavorite", False)),
                              "options": _sans_meta(_deref(p.get("display"), idx)),
                              "sautsDePage": sauts})

    # filtres favoris
    filtres = []
    for f in _lst(raw.get("filterFavoritesList"), idx):
        filtres.append({
            "nom": f.get("name", ""), "favori": bool(f.get("isFavorite", False)),
            "ouvrages": [{"ouv": s.get("to"), "actif": bool(s.get("apply", True)), "facteur": _num(s.get("scale", 1), 6)}
                         for s in _lst(f.get("supProjects"), idx) if isinstance(s, dict)],
            "cfcDe": f.get("bkpFrom", "") or "", "cfcA": f.get("bkpTo", "") or "",
        })

    cles_affichage = ("displaySubprojects", "onlyThreeDigits", "displayComment", "displayDescription",
                      "displayPosOptions", "displayDeviation", "standard", "zebra", "grayDetails",
                      "displayPriceBase", "displayDetailOptions", "displayQuanPriceValue",
                      "displayDetailValues", "displayDetailComment", "includeKvCover",
                      "includeKvOneDigit", "includeKvTwoDigit", "includeDocument", "includeDescCover",
                      "includeDescDoc", "titlePosBold", "detailItalic", "titleFontSize", "posFontSize",
                      "detailFontSize", "underlineOneDigit", "underlineTwoDigit", "displayMode")
    out = {
        "schema": SCHEMA_VERSION,
        "DOCUMENT_ID": doc_id,
        "PROJECT_ID": prj_id,
        "source": {"fichier": fichier, "versionJava": raw.get("version"), "date": raw.get("date"),
                   "desc": bool(desc), "converti": datetime.datetime.now().isoformat(timespec="seconds")},
        "reglages": {
            "arrondi5ct": bool(raw.get("round", False)),
            "pourcentageSur": "groupe" if raw.get("referProcToTot", True) else "total",
            "marge": raw.get("precision", "") or "",
            "indice": raw.get("index", "") or "",
            "etatProjet": raw.get("projectState", "") or "",
            "etatPlanification": raw.get("plannigState", "") or "",
            "textesLibres": [raw.get("freeText%d" % i, "") or "" for i in range(1, 6)],
            "titres": {"garde": raw.get("kvCoverTitle", ""), "document": raw.get("kvDocTitle", ""),
                       "unChiffre": raw.get("kvOneDigitTitle", ""), "deuxChiffres": raw.get("kvTwoDigitTitle", ""),
                       "descriptif": raw.get("kvDescTitle", "")},
            "affichage": {k: raw[k] for k in cles_affichage if k in raw},
            "impressionDescriptif": _sans_meta(_deref(raw.get("descSettings"), idx)),
            "impressionHonoraires": _sans_meta(_deref(raw.get("honorarSettings"), idx)),
        },
        "ouvrages": ouvrages,
        "positions": positions,
        "remarques": remarques,
        "presentations": presentations,
        "filtres": filtres,
        "cache": None,
    }
    tot = calculer(out)
    racine = tot["__total__"]
    out["cache"] = {"totalHT": round(racine["ht"], 2), "totalTVA": round(racine["tva"], 2),
                    "totalTTC": round(racine["ttc"], 2), "totalExcluTTC": round(racine["optTTC"], 2),
                    "honoraires": round(racine["soumis"], 2), "nbPositions": len(positions),
                    "calculeLe": out["source"]["converti"]}
    if alertes:
        out["source"]["alertes"] = alertes
    return out


# ════════════════════════════════════════════════════════════════════════════════════════
#  Calcul (mêmes règles que l'interface DeltaSub)
# ════════════════════════════════════════════════════════════════════════════════════════
def arrondi05(x):
    return round(round(x * 20.0) / 20.0, 2)


def ligne_ht(l):
    """HT = qte × prixHT ; ligne forfaitaire (pas de formule et qte = 0) : HT = prixHT."""
    if l.get("formule") or l.get("qte"):
        return (l.get("qte") or 0) * (l.get("prixHT") or 0)
    return l.get("prixHT") or 0


def ligne_ttc(l, arrondi):
    """TTC stocké (peut avoir été saisi en TTC) ; sinon HT × (1 + TVA), arrondi 0.05 si demandé."""
    if l.get("ttc") is not None:
        return l["ttc"]
    v = ligne_ht(l) * (1 + (l.get("tva") or 0) / 100.0)
    return arrondi05(v) if arrondi else round(v, 2)


def _zero():
    return {"ht": 0.0, "tva": 0.0, "ttc": 0.0, "optHT": 0.0, "optTTC": 0.0, "soumis": 0.0}


def calculer_partie(p, arrondi):
    r = _zero()
    for l in p.get("lignes", []):
        if l.get("var"):
            continue
        ht = ligne_ht(l)
        r["ht"] += ht
        r["tva"] += ht * (l.get("tva") or 0) / 100.0
        r["ttc"] += ligne_ttc(l, arrondi)
    if p.get("fixe"):
        t = p["fixe"].get("tva") or 0
        r["ttc"] = p["fixe"].get("ttc") or 0
        r["ht"] = r["ttc"] / (1 + t / 100.0)
        r["tva"] = r["ttc"] - r["ht"]
    if p.get("mode") == "exclure":
        return {"ht": 0.0, "tva": 0.0, "ttc": 0.0, "optHT": r["ht"], "optTTC": r["ttc"], "soumis": 0.0}
    r["soumis"] = r["ht"] * (p.get("honorPct") or 0) / 100.0
    return r


def calculer(devis, filtre=None):
    """
    Totaux par CFC (+ clé « __total__ »).  filtre = {code ouvrage: facteur} (ouvrages absents
    = exclus) ou None.  Totalisateur = somme des enfants directs.
    """
    arrondi = devis.get("reglages", {}).get("arrondi5ct", False)
    pos = devis.get("positions", [])
    ensemble = {p["cfc"] for p in pos}
    res = {}
    for p in pos:
        r = _zero()
        for part in p.get("parts", []):
            fac = 1.0
            if filtre is not None and part.get("ouv") is not None:
                if part["ouv"] not in filtre:
                    continue
                fac = filtre[part["ouv"]]
            rp = calculer_partie(part, arrondi)
            for k in r:
                r[k] += rp[k] * fac
        res[p["cfc"]] = r
    # remontée : du plus profond au moins profond
    def profondeur(c):
        n, s = 0, c
        while True:
            s = cfc_parent(s, ensemble)
            if s is None:
                return n
            n += 1
    total = _zero()
    for c in sorted(ensemble, key=profondeur, reverse=True):
        par = cfc_parent(c, ensemble)
        cible = res[par] if par else total
        for k in cible:
            cible[k] += res[c][k]
    res["__total__"] = total
    for c, r in res.items():
        r["pct"] = None
    # pourcentages (groupe à 1 chiffre ou total)
    sur_total = devis.get("reglages", {}).get("pourcentageSur") == "total"
    for c in ensemble:
        base = total["ttc"]
        if not sur_total:
            s = c
            while cfc_parent(s, ensemble):
                s = cfc_parent(s, ensemble)
            base = res[s]["ttc"]
        res[c]["pct"] = (100.0 * res[c]["ttc"] / base) if base else 0.0
    return res


def controler(raw, devis):
    """
    Compare les totaux recalculés aux totaux stockés par DELTA.
    -> (écarts, total TTC stocké, total TTC recalculé, filtre détecté ou None)
    DELTA enregistre les totaux de la VUE COURANTE : si un filtre d'ouvrages était actif lors
    de la sauvegarde, les totaux stockés ne portent que sur ces ouvrages (constaté sur 4 devis).
    On recherche alors le plus petit sous-ensemble d'ouvrages qui explique tous les totaux.
    """
    ecarts, ts, tc = _controler(raw, devis, None)
    if ecarts and devis.get("ouvrages") and len(devis["ouvrages"]) <= 10:
        import itertools
        codes = [o["code"] for o in devis["ouvrages"]]
        for n in range(1, len(codes)):
            for sub in itertools.combinations(codes, n):
                e2, ts2, tc2 = _controler(raw, devis, {c: 1.0 for c in sub})
                if not e2:
                    return [], ts2, tc2, list(sub)
    return ecarts, ts, tc, None


def _controler(raw, devis, filtre):
    idx = {}
    _index_ids(raw, idx)
    stock = {str(b["number"]): b for b in _lst(raw.get("bkpList"), idx) if isinstance(b, dict) and "number" in b}
    calc = calculer(devis, filtre)
    ecarts = []
    for cfc, b in stock.items():
        r = calc.get(cfc)
        if r is None:
            ecarts.append({"cfc": cfc, "champ": "absent"})
            continue
        for champ, cle in (("kvTotal", "ttc"), ("kvExVat", "ht"), ("optionValue", "optTTC")):
            v = float(b.get(champ) or 0)
            if abs(v - r[cle]) > TOL:
                ecarts.append({"cfc": cfc, "champ": champ, "stocke": round(v, 2), "calcule": round(r[cle], 2),
                               "ecart": round(r[cle] - v, 2)})
        if b.get("honorarFactor"):
            v = float(b.get("honorar") or 0)
            if abs(v - r["soumis"]) > TOL:
                ecarts.append({"cfc": cfc, "champ": "honorar", "stocke": round(v, 2), "calcule": round(r["soumis"], 2)})
    racines = [c for c in stock if cfc_parent(c, set(stock)) is None]
    tot_stocke = sum(float(stock[c].get("kvTotal") or 0) for c in racines)
    return ecarts, round(tot_stocke, 2), round(calc["__total__"]["ttc"], 2)


# ════════════════════════════════════════════════════════════════════════════════════════
#  Programme principal
# ════════════════════════════════════════════════════════════════════════════════════════
def _lire_entetes(chemin):
    rows = {}
    if chemin and os.path.exists(chemin):
        with open(chemin, encoding="utf-8", errors="replace") as f:
            for r in csv.DictReader(f, delimiter=";"):
                rows[str(r.get("ID"))] = r
    return rows


def _trouver_desc(doc_id, prj_id, dossier_raw, desc_opt):
    cands = [os.path.join(dossier_raw, "%s.DESC" % doc_id), os.path.join(dossier_raw, "costestimate_%s.DESC" % doc_id)]
    if desc_opt:
        cands += [os.path.join(desc_opt, "%s.DESC" % doc_id),
                  os.path.join(desc_opt, str(prj_id), str(doc_id), "costestimateDESC")]
    for c in cands:
        if os.path.isfile(c):
            return c
    return None


def main(argv):
    args = [a for a in argv[1:]]
    opts = {}
    for o in ("--entetes", "--desc"):
        if o in args:
            i = args.index(o)
            opts[o] = args[i + 1]
            del args[i:i + 2]
    if len(args) != 2:
        print(__doc__)
        print("usage : python3 convertir_devis.py <dossier_raw> <sortie.json> "
              "[--entetes APP.COSTESTIMATEDOCUMENT.csv] [--desc <dossier>]")
        return 2
    dossier, sortie = args
    entetes = _lire_entetes(opts.get("--entetes"))
    motif = re.compile(r"^(?:costestimate_)?(\d+)\.json$")
    resultat, rapport = {}, {"documents": {}, "resume": {}}
    n_ok = n_ecart = n_err = n_desc = 0
    for nom in sorted(os.listdir(dossier), key=lambda s: (len(s), s)):
        m = motif.match(nom)
        if not m:
            continue
        chemin = os.path.join(dossier, nom)
        try:
            with open(chemin, encoding="utf-8") as f:
                raw = json.load(f)
        except Exception as e:  # noqa
            print("ERREUR lecture %s : %s" % (nom, e))
            n_err += 1
            continue
        if not isinstance(raw, dict) or raw.get("$c") != "deltaproject.costestimate.data.Estimate":
            continue
        doc_id = m.group(1)
        head = entetes.get(doc_id)
        fm = re.search(r"Costestimate/(\d+)/(\d+)/", raw.get("fileName", "") or "")
        prj = head["PROJECT_ID"] if head else (fm.group(1) if fm else "")
        desc, err_desc = None, None
        cd = _trouver_desc(doc_id, prj, dossier, opts.get("--desc"))
        if cd:
            try:
                desc = lire_desc(cd)
                n_desc += 1
            except Exception as e:  # noqa
                err_desc = "%s: %s" % (type(e).__name__, e)
        try:
            devis = convert(raw, head or {"ID": doc_id, "PROJECT_ID": prj or None}, desc)
        except Exception as e:  # noqa
            print("ERREUR conversion %s : %s" % (nom, e))
            n_err += 1
            continue
        ecarts, tot_s, tot_c, filtre = controler(raw, devis)
        if filtre:
            devis["source"]["filtreActifALaSauvegarde"] = filtre
        resultat[doc_id] = devis
        nb_desc = sum(1 for p in devis["positions"] if p["descriptif"]) + \
            sum(1 for p in devis["positions"] for q in p["parts"] if q["descriptif"])
        rapport["documents"][doc_id] = {"PROJECT_ID": devis["PROJECT_ID"], "positions": len(devis["positions"]),
                                        "ouvrages": len(devis["ouvrages"]), "totalTTC_stocke": tot_s,
                                        "totalTTC_calcule": tot_c, "descriptifs": nb_desc,
                                        "erreurDesc": err_desc, "ecarts": ecarts,
                                        "filtreActifALaSauvegarde": filtre,
                                        "alertes": devis["source"].get("alertes", [])}
        etat = ("OK " if not filtre else "OK*") if not ecarts else "ÉCART"
        if ecarts:
            n_ecart += 1
        else:
            n_ok += 1
        print("%s devis %-6s affaire %-6s pos %4d ouv %2d  TTC stocké %14s  recalculé %14s  desc %3d%s%s" % (
            etat, doc_id, devis["PROJECT_ID"], len(devis["positions"]), len(devis["ouvrages"]),
            "{:,.2f}".format(tot_s).replace(",", "'"), "{:,.2f}".format(tot_c).replace(",", "'"), nb_desc,
            ("  (%d écarts)" % len(ecarts)) if ecarts else "", ("  DESC illisible: " + err_desc) if err_desc else "")
            + (("  [totaux DELTA enregistrés avec filtre ouvrages %s]" % "+".join(filtre)) if filtre else ""))
        for e in ecarts[:8]:
            print("      ", e)
    rapport["resume"] = {"convertis": len(resultat), "sansEcart": n_ok, "avecEcart": n_ecart,
                         "erreurs": n_err, "descLus": n_desc}
    with open(sortie, "w", encoding="utf-8") as f:
        json.dump({"costestimate": resultat}, f, ensure_ascii=False, separators=(",", ":"))
    base = sortie[:-5] if sortie.endswith(".json") else sortie
    with open(base + ".rapport.json", "w", encoding="utf-8") as f:
        json.dump(rapport, f, ensure_ascii=False, indent=1)
    print("\n%d devis convertis : %d sans écart, %d avec écarts, %d erreurs ; %d fichiers DESC lus."
          % (len(resultat), n_ok, n_ecart, n_err, n_desc))
    print("Sortie : %s\nRapport : %s.rapport.json" % (sortie, base))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))

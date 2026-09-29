#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Convertisseur Deltaproject → DeltaSub : CONTRÔLES DES COÛTS et PLANIFICATIONS DES COÛTS.
Python 3.9, bibliothèque standard uniquement. LECTURE SEULE : n'écrit que le fichier de sortie.

USAGE
    python3 convertir_couts.py <dossier_raw> <sortie.json> [--tables <dossier_extraction>]
                               [--racine <Construction>] [--rapport <rapport.txt>]

    <dossier_raw>   JSON bruts produits par Ser2Json.java :
                        costcontrol_<COSTCONTROLDOCUMENT.ID>.json
                        costplanning_<COSTPLANNINGDOCUMENT.ID>.json
                    (facultatif, pour la vérification : deltacalc_<ID>.json produits par
                     DeltaCalc.java = résultats calculés par le moteur de Deltaproject lui-même)
    <sortie.json>   {"costcontrol": {ID: contenu}, "costplanning": {ID: contenu}}
    --tables        dossier de outils_deltaproject/extraire.sh (tables/APP.*.csv) : fournit les en-têtes
                    COSTCONTROLDOCUMENT / COSTPLANNINGDOCUMENT (VERSION, STATECODE, PROJECT_ID…).
                    Défaut : <dossier_raw>/.., puis ../extraction_deltaproject.
    --racine        dossier « DELTAprojectFiles/Construction » (pour lister les annexes PDF / .dpdoc).
                    Défaut : /Volumes/SUBSTANCES/Deltaproject/DELTAprojectFiles/Construction
                    (ignoré s'il n'est pas monté — les annexes sont alors vides).

    Fonctions importables : convert_costcontrol(raw, header), convert_costplanning(raw, header),
    calculer_controle(cc)  (moteur de calcul de référence, cf. spec_5 § 22), verifier_controle(raw, cc, ref).

CORRESPONDANCE DOSSIERS → IDENTIFIANTS  (vérifié : 84/84 dossiers conformes à APP.COSTCONTROLDOCUMENT.csv)
    Construction/Costcontrol/<PROJECT_ID>/<COSTCONTROLDOCUMENT.ID>/coco/costcontrol
        ex. Costcontrol/915/3601/coco/costcontrol  →  PROJECT_ID 915, COSTCONTROLDOCUMENT.ID 3601
    Construction/Costplanning/<PROJECT_ID>/<COSTPLANNINGDOCUMENT.ID>/costplanning
        ex. Costplanning/2951/252/costplanning     →  PROJECT_ID 2951, COSTPLANNINGDOCUMENT.ID 252
    31 lignes COSTCONTROLDOCUMENT n'ont pas de dossier (documents supprimés : ISMARKEDASDELETED=1 pour la
    plupart) ; 50 lignes ont ISMARKEDASDELETED=1 → converties quand le fichier existe, marquées « supprime ».

VERSION COURANTE
    coco/costcontrol          = version courante (seule convertie).
    coco/costcontroltemp      = fichier temporaire d'écriture de Deltaproject (ignoré).
    coco/costcontrol_JJ.MM.AAAA HH.MM.zip = sauvegardes automatiques (zip contenant « costcontrol ») : listées
                                seulement (source.sauvegardes).
    Costcontrol/<P>/<ID>/coco_JJ.MM.AAAA HH.MM/ = anciennes copies complètes (ignorées).
    Costplanning/<P>/<ID>/costplanning = version courante (dossier « gate » voisin ignoré).

ANNEXES (à LIER seulement, jamais copiées ; chemins relatifs à coco/) — rangées dans annexes[]
    award/contractSheet_<contactId>_<n° contrat>/        Contrat <…>.dpdoc / .pdf
    award/addendumSheet_<contactId>_<n° contrat>_<n° avenant>/   avenant
    payments/                                            Rapport des paiements.dpdoc/.pdf
    entrepreneurInvoices/<n° paiement>/*.pdf             facture d'entreprise jointe au bon de paiement
    paymentorder/<AdviceOfPayment.refId>/                Ordre de paiement.dpdoc / <refNum pmt>_<contactId>_payment.dpdoc
    paymentorder/<refId>/<n° paiement>/                  bon de paiement (dpdoc/pdf)
    finalpayment/<Deduction.refNum>_<contactId>/         Arrêté de compte.dpdoc / .pdf ; finalpayment/Liste des garanties.dpdoc
    overview/  mutation/<n>/  entrepreneur/<contactId>/  documents imprimés (Contrôle des coûts, mutations, comptes)
    Les .dpdoc sont des zip (report.json = mise en page du document, sans montants).
    Contract/Pay.attachmentList.reference = chemin absolu choisi par l'utilisateur (souvent dans 01-AFFAIRES) → conservé tel quel.

DONNÉES CLIENTS : la sortie contient des données clients — ne jamais la committer (cf. .gitignore).
"""
import csv
import glob
import json
import os
import re
import sys
from collections import OrderedDict, defaultdict

RACINE_DEFAUT = "/Volumes/SUBSTANCES/Deltaproject/DELTAprojectFiles/Construction"

# ───────────────────────────── Codes Deltaproject (lus dans les enums du logiciel) ─────────────────────────────
STATUT_DOCUMENT = {0: "cree", 1: "provisoire", 2: "enCours", 3: "etatIntermediaire", 4: "terminee"}  # STATECODE (0-based) [déduit]
STATUT_CONTRAT = {1: "brouillon", 2: "enTraitement", 3: "surDemande", 4: "pourSignature", 5: "definitif"}
STATUT_MUTATION = {1: "brouillon", 2: "provisoire", 3: "demandeTransmise", 4: "acceptee", 5: "rejetee"}
STATUT_PAIEMENT = {1: "receptionne", 2: "libere", 3: "transmis", 4: "debite"}
STATUT_ORDRE = {0: "enTraitement", 1: "controle", 2: "transmis", 3: "debite"}
STATUT_ARRETE = {1: "etabli", 2: "pourSignature", 3: "definitif"}
GENRE_GARANTIE = {1: "banque", 2: "assurance", 3: "comptant", 4: "sansGarantie"}
GENRE_MUTATION = {1: "transfert", 2: "rencherissement", 3: "variation"}
GENRE_PAIEMENT = {1: "surContrat", 2: "rencherissement", 3: "horsContrat", 4: "surContratFinal",
                  5: "rencherissementFinal", 6: "horsContratFinal", 7: "regie"}
CENTRE_ECRITURE = {9: "coutProbablePerso", 10: "provision", 11: "libre1", 12: "libre2", 13: "libre3",
                   6: "montantPlafonne", 7: "metre", 3: "icc"}
# kind → (clé, nature) ; nature : pct = % de la base, forfait = montant réparti, cumul = « Paiements à ce jour »
CONDITION = {
    1: ("rabais", "pct"), 2: ("deduction", "forfait"), 3: ("escompte", "pct"), 4: ("retenueGarantie", "pct"),
    5: ("retenueGarantieForfait", "forfait"), 6: ("tva", "pct"), 7: ("arrondi", "forfait"),
    8: ("taxesRecyclage", "pct"), 9: ("taxesRecyclageForfait", "forfait"), 10: ("prorata", "pct"),
    11: ("prorataForfait", "forfait"), 12: ("panneau", "pct"), 13: ("panneauForfait", "forfait"),
    14: ("assurance", "pct"), 15: ("assuranceForfait", "forfait"), 16: ("energie", "pct"),
    17: ("energieForfait", "forfait"), 18: ("eau", "pct"), 19: ("eauForfait", "forfait"),
    20: ("paiementsAnterieurs", "cumul"), 21: ("autres", "pct"), 22: ("autresForfait", "forfait"),
}
TVA = 6
GARANTIES = (4, 5)
MOIS = {m: i + 1 for i, m in enumerate("Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split())}


# ───────────────────────────── Utilitaires ─────────────────────────────
def date_iso(s):
    """'Mon Jan 22 00:00:00 CET 2024' → '2024-01-22' (heure locale, sans conversion UTC)."""
    if not s or not isinstance(s, str):
        return None
    m = re.match(r"\w{3} (\w{3}) (\d{1,2}) [\d:]+ \S+ (\d{4})", s)
    if not m:
        m2 = re.match(r"(\d{4})-(\d{2})-(\d{2})", s)
        return s[:10] if m2 else None
    return "%s-%02d-%02d" % (m.group(3), MOIS.get(m.group(1), 1), int(m.group(2)))


def r2(x):
    return round((x or 0.0) + 0.0, 2)


def classe(o):
    return (o.get("$c") or "").rsplit(".", 1)[-1] if isinstance(o, dict) else ""


def txt(o, k):
    v = o.get(k)
    return v if isinstance(v, str) else ""


def index_refs(raw):
    idx = {}

    def w(o):
        if isinstance(o, dict):
            if "$id" in o:
                idx[o["$id"]] = o
            for v in o.values():
                w(v)
        elif isinstance(o, list):
            for v in o:
                w(v)
    w(raw)
    return idx


def deref(o, idx):
    if isinstance(o, dict) and "$ref" in o:
        return idx.get(o["$ref"], {})
    return o


def contact(n):
    """companyNumber / uRefNumber Deltaproject → ID CONTACT (None = « Aucune entreprise »)."""
    return n if isinstance(n, int) and n > 0 else None


def ancetres_cfc(cfc):
    """Titres CFC implicites d'un numéro : « 211.51 » → 2, 21, 211, 211.5."""
    base, _, dec = cfc.partition(".")
    out = [base[:n] for n in (1, 2, 3) if n < len(base)]
    if dec:
        out.append(base)
        out += [base + "." + dec[:k] for k in range(1, len(dec))]
    return [x for x in out if x]


def parent_cfc(cfc, existants):
    """Parent hiérarchique : plus long préfixe strict existant (211.5 → 211 → 21 → 2)."""
    c = cfc
    while len(c) > 1:
        c = c[:-1].rstrip(".")
        if c in existants:
            return c
    return None


# ───────────────────────────── Moteur de conditions (spec_5 § 6.3) ─────────────────────────────
def calculer_conditions(lignes, conditions):
    """lignes : [{'brut', 'refCond', 'forfaits': {niveau: montant}?}] ; conditions : liste DeltaSub triée.
    Retour : (lignes enrichies {'net','tva','montants':{niveau:x}}, totaux {'brut','net','tva','ht'}, montants par condition).
    Règle : R(0)=brut ; pour chaque condition n appliquée à la ligne : base=R(ref) ; montant = base×taux/100 (pct)
    ou part du forfait (répartie au prorata des bases) ; « paiementsAnterieurs » = −valeur (répartie idem) ; R(n)=base+montant."""
    conds = sorted(conditions, key=lambda c: c["niveau"])
    res = [dict(l, R={0: l["brut"]}, montants={}) for l in lignes]
    # plusieurs conditions au même niveau (ex. TVA et arrondi tous deux en NIV 2, REF 1) : calculées en parallèle
    # sur la même base, R(niveau) = base + Σ montants du niveau.

    def applique(c, l):
        return c.get("appliquee", True) and (not c.get("refCond") or c["refCond"] == (l.get("refCond") or ""))

    par_cond = {}
    for c in conds:
        n, ref = c["niveau"], c.get("reference", 0)
        bases = []
        for l in res:
            k = max([x for x in l["R"] if x <= ref] or [0])
            bases.append((l, l["R"][k]))
        concern = [(l, b) for l, b in bases if applique(c, l)]
        ids = set(id(l) for l, _ in concern)
        nature = CONDITION.get(c["kind"], ("autre", "pct"))[1]
        total_forfait = c["valeur"] if nature == "forfait" else (-c["valeur"] if nature == "cumul" else 0.0)
        sb = sum(b for _, b in concern)
        tot = 0.0
        for l, b in bases:
            if id(l) in ids:
                if nature == "pct":
                    m = b * c["valeur"] / 100.0
                elif l.get("forfaits") and n in l["forfaits"]:
                    m = l["forfaits"][n]
                else:
                    m = total_forfait * (b / sb if sb else (1.0 / len(concern)))
            else:
                m = 0.0
            if n in l["montants"]:          # même niveau déjà calculé : on cumule
                l["R"][n] += m
                l["montants"][n] += m
            else:
                l["R"][n] = b + m
                l["montants"][n] = m
            l.setdefault("parKind", {}).setdefault(c["kind"], 0.0)
            l["parKind"][c["kind"]] += m
            tot += m
        par_cond[n] = par_cond.get(n, 0.0) + tot
    out, T = [], {"brut": 0.0, "net": 0.0, "tva": 0.0}
    for l in res:
        net = l["R"][max(l["R"])] if l["R"] else l["brut"]
        tva = (l.get("parKind") or {}).get(TVA, 0.0)
        o = {k: v for k, v in l.items() if k not in ("R", "forfaits", "parKind")}
        o.update(net=net, tva=tva)
        out.append(o)
        T["brut"] += l["brut"]; T["net"] += net; T["tva"] += tva
    T["ht"] = T["net"] - T["tva"]
    return out, T, par_cond


def _kind(conds, n):
    for c in conds:
        if c["niveau"] == n:
            return c["kind"]
    return None


# ───────────────────────────── Conversion d'un contrôle des coûts ─────────────────────────────
def _condition(c, idx):
    c = deref(c, idx)
    k = c.get("kind", 0)
    return OrderedDict([
        ("niveau", c.get("step", 0)), ("reference", c.get("refStep", 0)), ("kind", k),
        ("genre", CONDITION.get(k, ("autre",))[0]), ("libelle", txt(c, "frenchText") or txt(c, "germanText")),
        ("refCond", txt(c, "number")), ("valeur", c.get("condValue", 0.0)), ("montant", r2(c.get("total"))),
        ("appliquee", bool(c.get("applay", True))),
    ])


def _ligne(d, idx, ligne_type="contrat"):
    d = deref(d, idx)
    o = OrderedDict([
        ("cfc", txt(d, "kag")), ("ouvrage", txt(d, "to")), ("localisation", txt(d, "lg")),
        ("refCond", txt(d, "number")), ("brut", r2(d.get("bruttoTotal"))), ("net", r2(d.get("nettoTotal"))),
        ("tva", r2(d.get("vatTotal"))),
    ])
    if ligne_type == "arrete":
        o["adjudicationBrut"] = r2(d.get("vergabeBruttoTotal"))
        o["adjudicationNet"] = r2(d.get("vergabeNettoTotal"))
    # parts de forfaits / paiements antérieurs propres à la ligne (nécessaires pour recalculer à l'identique)
    parts, base = {}, None
    for c in sorted((deref(c, idx) for c in d.get("condList") or []), key=lambda c: c.get("step", 0)):
        if base is None and c.get("refStep", 0) == 0 and c.get("refStepValue"):
            base = c["refStepValue"]
        if CONDITION.get(c.get("kind"), ("", "pct"))[1] != "pct":
            parts[str(c.get("step"))] = r2(c.get("total"))
    if base is not None and abs(base - (d.get("bruttoTotal") or 0)) > 0.005:
        o["brutCalcul"] = r2(base)      # brut de CE paiement (situation : brut cumulé − brut des acomptes précédents)
    if parts:
        o["partsForfaits"] = parts      # part de la ligne des conditions forfaitaires / « paiements antérieurs »
    return o


def _annexes_contrat(c):
    return [OrderedDict([("nom", txt(a, "name")), ("chemin", txt(a, "reference")),
                         ("relatifDossierAffaire", bool(a.get("reltativeToProjectFolder")))])
            for a in c.get("attachmentList") or []]


def _banque_paiement(p):
    return OrderedDict([("nom", txt(p, "name")), ("rue", txt(p, "street")), ("npa", txt(p, "postalcode")),
                        ("lieu", txt(p, "location")), ("compte", txt(p, "account1")), ("texteCompte", txt(p, "account2")),
                        ("swift", txt(p, "swift")), ("clearing", txt(p, "clearingNr")), ("iban", txt(p, "iban")),
                        ("compteMO", txt(p, "buildingOwnerAccount2"))])


def _paiement(p, idx, contrat_id, contrat_contact):
    p = deref(p, idx)
    code = p.get("payCode", 0)
    return OrderedDict([
        ("id", "p%d" % p.get("refNum", 0)), ("refNum", p.get("refNum")), ("contratId", contrat_id),
        ("genre", GENRE_PAIEMENT.get(code, "inconnu")), ("genreCode", code), ("genreTexte", txt(p, "payKind")),
        ("dernier", bool(p.get("isLastPay"))), ("numero", txt(p, "payNumber")), ("numeroFacture", txt(p, "billNumber")),
        ("dateFacture", date_iso(p.get("billDate"))), ("datePaiement", date_iso(p.get("payDate"))),
        ("statut", STATUT_PAIEMENT.get(p.get("payState"), "inconnu")), ("statutCode", p.get("payState")),
        ("commentaire", txt(p, "remark")), ("description", txt(p, "description")),
        ("contactId", contact(p.get("companyNumber")) or contrat_contact),
        ("lot", OrderedDict([("numero", txt(p, "vergabeNr")), ("texte", txt(p, "vergabeText"))])),
        ("numeroOrdre", txt(p, "vergNumber")),
        ("saisie", "brut" if p.get("calcCondForward") else "net"),
        ("lignes", [_ligne(d, idx) for d in p.get("detailList") or []]),
        ("conditions", [_condition(c, idx) for c in p.get("condList") or []]),
        ("banque", _banque_paiement(p)), ("annexes", _annexes_contrat(p)),
        ("totauxDelta", OrderedDict([("brut", r2(p.get("brutto"))), ("net", r2(p.get("netto"))), ("tva", r2(p.get("vat")))])),
    ])


def _contrat(c, idx, parent=None):
    c = deref(c, idx)
    est_contrat = bool(c.get("isContract", True)) and parent is None
    cid = ("c%d" if est_contrat else "a%d") % c.get("refNum", 0)
    o = OrderedDict([
        ("id", cid), ("refNum", c.get("refNum")), ("type", "contrat" if est_contrat else "avenant"),
        ("contratParentId", parent), ("lieAuContrat", bool(c.get("isContractBound", True))),
        ("numero", txt(c, "contractNumber")), ("designation", txt(c, "remark")), ("date", date_iso(c.get("bookDate"))),
        ("statut", STATUT_CONTRAT.get(c.get("contractState"), "inconnu")), ("statutCode", c.get("contractState")),
        ("contactId", contact(c.get("companyNumber"))),
        ("lot", OrderedDict([("numero", txt(c, "vergabeNr")), ("texte", txt(c, "vergabeText"))])),
        ("prioritaireSurDevis", bool(c.get("contractHasPriotity"))),
        ("saisie", "brut" if c.get("calcCondForward") else "net"),
        ("paiementsAvecDetails", bool(c.get("detailPaymenst", True))),
        ("niveauPrestations", c.get("workProgress", 0)), ("delaiGarantie", txt(c, "setGarantyDuration")),
        ("description", txt(c, "description")), ("annexes", _annexes_contrat(c)),
        ("lignes", [_ligne(d, idx) for d in c.get("detailList") or []]),
        ("conditions", [_condition(x, idx) for x in c.get("condList") or []]),
        ("totauxDelta", OrderedDict([("brut", r2(c.get("brutto"))), ("net", r2(c.get("netto"))), ("tva", r2(c.get("vat")))])),
    ])
    return o


def _arrete(x, idx, contrat_id, contact_id):
    x = deref(x, idx)
    return OrderedDict([
        ("id", "d%d" % x.get("refNum", 0)), ("refNum", x.get("refNum")), ("contratId", contrat_id),
        ("contactId", contact(x.get("companyNumber")) or contact_id), ("numero", txt(x, "number")),
        ("date", date_iso(x.get("bookDate"))), ("statut", STATUT_ARRETE.get(x.get("deductionState"), "nonDefini")),
        ("statutCode", x.get("deductionState")), ("saisie", "brut" if x.get("calcForward") else "net"),
        ("commentaire", txt(x, "remark")), ("description", txt(x, "description")),
        ("garantie", OrderedDict([("genre", GENRE_GARANTIE.get(x.get("garantyKind"), "nonDefini")),
                                  ("genreCode", x.get("garantyKind")), ("montant", r2(x.get("value"))),
                                  ("debut", date_iso(x.get("garantyBegin"))), ("fin", date_iso(x.get("garantyEnd")))])),
        ("lignes", [_ligne(d, idx, "arrete") for d in x.get("detailList") or []]),
        ("conditions", [_condition(c, idx) for c in x.get("condList") or []]),
        ("annexes", _annexes_contrat(x)),
        ("totauxDelta", OrderedDict([("ht", r2(x.get("deductionExVat"))), ("tva", r2(x.get("deductionVat"))),
                                     ("net", r2(x.get("deductionTotal")))])),
    ])


def _presentations(raw, idx):
    sections = OrderedDict([
        ("controle", "overViewDisplayList"), ("devis", "kvViewDisplayList"), ("mutations", "mutDisplayList"),
        ("mutations2", "mut1DisplayList"), ("adjudications", "awardingDisplayList"), ("paiements", "paymentDisplayList"),
        ("ordresPaiement", "adviceOfPaymentDisplayList"), ("comptesEntreprise", "entrepreneurDisplayList"),
        ("arretes", "finalPaymentDisplayList"), ("honoraires", "honorarSumDisplayList"), ("descriptif", "descDisplayList"),
    ])
    out = OrderedDict()
    for sec, key in sections.items():
        lst = []
        for cs in raw.get(key) or []:
            cs = deref(cs, idx)
            if classe(cs) != "ColumnSetting":
                continue
            noms = {}
            for k, v in cs.items():
                m = re.match(r"id([A-Z]\w*)$", k)
                if m and isinstance(v, int):
                    noms[str(v)] = m.group(1)
            cols = []
            for oid in cs.get("order") or []:
                n = noms.get(str(oid))
                if not n or n == "InternRef" or not cs.get("display" + n):
                    continue
                cols.append(OrderedDict([("id", n[0].lower() + n[1:]), ("idDelta", int(oid)),
                                         ("largeur", cs.get("width" + n) or cs.get("widht" + n)),
                                         ("details", bool(cs.get("detail" + n)))]))
            opts = OrderedDict()
            pref = deref(cs.get("overviewPreferences"), idx) if sec == "controle" else None
            if isinstance(pref, dict):
                for k, v in pref.items():
                    if isinstance(v, (bool, str, int, float)) and not k.startswith("$") and k != "version":
                        opts[k] = v
            lst.append(OrderedDict([("nom", txt(cs, "name")), ("favori", bool(cs.get("isFavorite"))),
                                    ("colonnes", cols), ("options", opts)]))
        if lst:
            out[sec] = lst
    return out


def _titres_colonnes(raw, idx):
    cn = deref(raw.get("frenchColumnNames"), idx) or {}
    out = OrderedDict()
    for k, v in cn.items():
        m = re.match(r"(.+)_([12])$", k)
        if m and isinstance(v, str):
            out.setdefault(m.group(1), ["", ""])[int(m.group(2)) - 1] = v
    return out


def _annexes_dossier(racine, projet, doc):
    base = os.path.join(racine or "", "Costcontrol", str(projet), str(doc), "coco")
    out, sauv = [], []
    if not racine or not os.path.isdir(base):
        return out, sauv
    for f in sorted(os.listdir(base)):
        if re.match(r"costcontrol_.*\.zip$", f):
            sauv.append(f)
    for dp, _, fs in os.walk(base):
        for f in sorted(fs):
            if f.lower().endswith((".pdf", ".dpdoc")):
                rel = os.path.relpath(os.path.join(dp, f), base)
                out.append(OrderedDict([("chemin", rel), ("categorie", rel.split(os.sep)[0]),
                                        ("type", f.rsplit(".", 1)[-1].lower())]))
    return out, sauv


def convert_costcontrol(raw, header, racine=None):
    """raw = JSON brut Ser2Json d'un fichier coco/costcontrol ; header = ligne COSTCONTROLDOCUMENT (dict, champs MAJUSCULES).
    Retour : contenu DeltaSub (dict) pour la collection « costcontrol » (clé = header['ID'])."""
    header = header or {}
    idx = index_refs(raw)
    doc_id = header.get("ID")
    projet = header.get("PROJECT_ID")
    if projet is None and isinstance(raw.get("fileName"), str):
        m = re.search(r"Costcontrol/(\d+)/(\d+)/", raw["fileName"])
        if m:
            projet, doc_id = int(m.group(1)), doc_id or int(m.group(2))

    # — Positions (devis général) —
    positions, existants = [], set()
    for b in raw.get("kvList") or []:
        cfc = txt(b, "number")
        existants.add(cfc)
        propre = not b.get("isGenerated")
        taux = None
        lignes_calc = []
        for ci in b.get("calcList") or []:
            taux = taux if taux is not None else ci.get("vatFac")
            lignes_calc.append(OrderedDict([("texte", txt(ci, "comment")), ("formule", txt(ci, "equation")),
                                            ("quantite", ci.get("quantity", 0.0)), ("unite", txt(ci, "measUnit")),
                                            ("prixHT", r2(ci.get("price"))), ("tauxTVA", ci.get("vatFac")),
                                            ("ht", r2(ci.get("exclVatValue"))), ("tva", r2(ci.get("vatValue"))),
                                            ("ttc", r2(ci.get("total"))), ("option", bool(ci.get("option")))]))
        par_ouvrage = []
        for s in b.get("kvSubProjectList") or []:
            s = deref(s, idx)
            if s.get("to") or s.get("lg"):
                par_ouvrage.append(OrderedDict([("ouvrage", txt(s, "to")), ("localisation", txt(s, "lg")),
                                                ("ouvrageId", s.get("dbId")), ("dgHT", r2(s.get("kvExVat"))),
                                                ("dgTVA", r2(s.get("kvVat"))), ("dgTTC", r2(s.get("kvTotal"))),
                                                ("actif", bool(s.get("apply", True)))]))
        positions.append(OrderedDict([
            ("cfc", cfc), ("libelle", txt(b, "text1") or txt(b, "text")), ("libelle2", txt(b, "text2")),
            ("genere", bool(b.get("isGenerated"))), ("positionCout", bool(b.get("isCostPosition"))),
            ("dgHT", r2(b.get("kvExVat")) if propre else 0.0), ("dgTVA", r2(b.get("kvVat")) if propre else 0.0),
            ("dgTTC", r2(b.get("kvTotal")) if propre else 0.0),
            ("tauxTVA", taux if taux is not None else (round(100.0 * b["kvVat"] / b["kvExVat"], 2) if propre and b.get("kvExVat") else None)),
            ("commentaire", txt(b, "comment")), ("lignesCalcul", lignes_calc), ("parOuvrage", par_ouvrage),
        ]))

    # — Entreprises (carnet local du document) —
    entreprises = OrderedDict()
    for e in raw.get("setAddrList") or []:
        e = deref(e, idx)
        if contact(e.get("companyNumber")):
            entreprises[e["companyNumber"]] = OrderedDict([("contactId", e["companyNumber"]), ("nomCourt", txt(e, "shortName"))])
    for b in raw.get("kvList") or []:
        for e in b.get("entrepreneurList") or []:
            e = deref(e, idx)
            if contact(e.get("companyNumber")) and e["companyNumber"] not in entreprises:
                entreprises[e["companyNumber"]] = OrderedDict([("contactId", e["companyNumber"]), ("nomCourt", txt(e, "shortName"))])

    # — Mutations (écritures Book des subdivisions, paires de transfert fusionnées) —
    books = []
    for b in raw.get("kvList") or []:
        for e in b.get("entrepreneurList") or []:
            e = deref(e, idx)
            for s in e.get("subprojectList") or []:
                s = deref(s, idx)
                for centre, key in ((1, "mut1List"), (2, "mut2List"), (3, "indexList")):
                    for bk in s.get(key) or []:
                        bk = deref(bk, idx)
                        books.append((centre, txt(b, "number"), contact(e.get("companyNumber")), s, bk))
    par_ref = {bk.get("refNum"): (c, cfc, ent, s, bk) for c, cfc, ent, s, bk in books}
    mutations, vus = [], set()
    ecritures = []
    for centre, cfc, ent, s, bk in books:
        ref = bk.get("refNum")
        if ref in vus:
            continue
        vus.add(ref)
        pos = OrderedDict([("cfc", txt(bk, "bkpNumber") or cfc), ("contactId", ent), ("ouvrage", txt(bk, "og") or txt(s, "to")),
                           ("localisation", txt(bk, "lg") or txt(s, "lg"))])
        if centre == 3:
            ecritures.append(OrderedDict([("id", "e%d" % ref), ("type", "icc"), ("indice", bk.get("kvIndex")),
                                          ("date", date_iso(bk.get("bookDate"))), ("remarque", txt(bk, "remark"))] + list(pos.items())
                                         + [("ht", r2(bk.get("value"))), ("tauxTVA", bk.get("vatFac")),
                                            ("tva", r2(bk.get("vat"))), ("ttc", r2(bk.get("total")))]))
            continue
        genre = GENRE_MUTATION.get(bk.get("mutKind"), "variation")
        origine, dest, montant = None, pos, bk
        partner = par_ref.get(bk.get("partnerMutRefNum")) if (bk.get("partnerMutRefNum") or -1) >= 0 else None
        if partner:
            vus.add(partner[4].get("refNum"))
            pb, ps = partner[4], partner[3]
            ppos = OrderedDict([("cfc", txt(pb, "bkpNumber") or partner[1]), ("contactId", partner[2]),
                                ("ouvrage", txt(pb, "og") or txt(ps, "to")), ("localisation", txt(pb, "lg") or txt(ps, "lg"))])
            # destination = écriture NON marquée « origine » (isOrigMutationPos) ; montant signé de la destination.
            if bool(bk.get("isOrigMutationPos")) != bool(pb.get("isOrigMutationPos")):
                bk_dest = pb if bk.get("isOrigMutationPos") else bk
            else:
                bk_dest = bk if (bk.get("total") or 0) >= 0 else pb
            if bk_dest is pb:
                origine, dest, montant = pos, ppos, pb
            else:
                origine, dest, montant = ppos, pos, bk
        elif genre == "transfert":   # transfert sans contrepartie (rare) : montant signé sur la position
            genre = "transfertSansContrepartie"
        mutations.append(OrderedDict([
            ("id", "m%d" % ref), ("centre", centre), ("numero", bk.get("mutNum")), ("code", txt(bk, "setMutationsSign")),
            ("genre", genre), ("genreTexte", txt(bk, "setMutationsText")), ("date", date_iso(bk.get("bookDate"))),
            ("statut", STATUT_MUTATION.get(bk.get("mutDocState"), "inconnu")), ("statutCode", bk.get("mutDocState")),
            ("remarque", txt(bk, "remark")), ("commentaire", txt(bk, "description")),
            ("origine", origine), ("destination", dest),
            ("ht", r2(montant.get("value"))), ("tauxTVA", montant.get("vatFac")),
            ("tva", r2(montant.get("vat"))), ("ttc", r2(montant.get("total"))),
        ]))

    # — Écritures simples (BaseBook) : coût probable perso, provisions, libres, plafonné, métré —
    for key in ("prognoseList", "additionalCostList", "freeAccount1List", "freeAccount2List", "freeAccount3List",
                "awardList", "measurementList"):
        for bb in raw.get(key) or []:
            bb = deref(bb, idx)
            ecritures.append(OrderedDict([
                ("id", "e%d" % bb.get("refNum", 0)), ("type", CENTRE_ECRITURE.get(bb.get("costId"), key)),
                ("cfc", txt(bb, "bkpNumber")), ("contactId", contact(bb.get("uRefNumber"))), ("ouvrage", txt(bb, "og")),
                ("localisation", txt(bb, "lg")), ("date", date_iso(bb.get("bookDate"))), ("remarque", txt(bb, "remark")),
                ("ht", r2(bb.get("value"))), ("tauxTVA", bb.get("vatFac")), ("tva", r2(bb.get("vat"))),
                ("ttc", r2(bb.get("total"))), ("coutProbableZero", bool(bb.get("zeroCost"))),
            ]))

    # — Contrats, avenants, paiements sur contrat, arrêtés —
    contrats, paiements, arretes = [], [], []
    for c in raw.get("contractList") or []:
        c = deref(c, idx)
        co = _contrat(c, idx)
        contrats.append(co)
        for p in c.get("payList") or []:
            paiements.append(_paiement(p, idx, co["id"], co["contactId"]))
        for x in c.get("deductionList") or []:
            arretes.append(_arrete(x, idx, co["id"], co["contactId"]))
        for a in c.get("addendumList") or []:
            a = deref(a, idx)
            ao = _contrat(a, idx, parent=co["id"])
            if not ao["contactId"]:
                ao["contactId"] = co["contactId"]
            contrats.append(ao)
            for p in a.get("payList") or []:
                paiements.append(_paiement(p, idx, ao["id"], ao["contactId"]))
            for x in a.get("deductionList") or []:
                arretes.append(_arrete(x, idx, ao["id"], ao["contactId"]))
    for p in raw.get("payList") or []:       # paiements hors contrat
        paiements.append(_paiement(p, idx, None, None))

    # — Ordres de paiement —
    ref2pay = {p["refNum"]: p["id"] for p in paiements}
    ordres = []
    for a in raw.get("adviceOfPaymentList") or []:
        a = deref(a, idx)
        pids = []
        for bk in a.get("bookList") or []:
            bk = deref(bk, idx)
            if bk.get("payRefNum") in ref2pay:
                pids.append(ref2pay[bk["payRefNum"]])
        oid = "o%d" % a.get("refId", 0)
        for p in paiements:
            if p["id"] in pids:
                p["ordreId"] = oid
        ordres.append(OrderedDict([
            ("id", oid), ("refId", a.get("refId")), ("numero", txt(a, "number")), ("date", date_iso(a.get("date"))),
            ("dateValeur", date_iso(a.get("valutaDate"))), ("maitreOuvrageContactId", contact(a.get("buildingOwnerRefNum"))),
            ("statut", STATUT_ORDRE.get(a.get("docState"), "inconnu")), ("statutCode", a.get("docState")),
            ("banque", OrderedDict([("nom", txt(a, "bankName")), ("rue", txt(a, "bankStreet")), ("npa", txt(a, "bankPostalcode")),
                                    ("lieu", txt(a, "bankLocation")), ("compte", txt(a, "bankAccount1")),
                                    ("texteCompte", txt(a, "bankAccount2")), ("swift", txt(a, "bankSwift")),
                                    ("clearing", txt(a, "bankClearingNr")), ("iban", txt(a, "bankIban")),
                                    ("contact", txt(a, "bankContact"))])),
            ("paiementIds", pids),
        ]))

    # — Comptes du maître d'ouvrage —
    comptes_mo = []
    for sa in raw.get("builOwnerAccountList") or []:
        sa = deref(sa, idx)
        for ac in sa.get("accountList") or []:
            ac = deref(ac, idx)
            comptes_mo.append(OrderedDict([("ouvrage", txt(sa, "to")), ("localisation", txt(sa, "lg")),
                                           ("banque", txt(ac, "bankName")), ("rue", txt(ac, "bankStreet")),
                                           ("npa", txt(ac, "bankPostalcode")), ("lieu", txt(ac, "bankLocation")),
                                           ("compte", txt(ac, "bankAccount1")), ("compte2", txt(ac, "bankAccount2")),
                                           ("swift", txt(ac, "bankSwift")), ("clearing", txt(ac, "bankClearingNr")),
                                           ("iban", txt(ac, "bankIban")), ("contact", txt(ac, "bankContact"))]))

    annexes, sauvegardes = _annexes_dossier(racine, projet, doc_id)
    stc = header.get("STATECODE")
    cc = OrderedDict([
        ("id", doc_id), ("projetId", projet),
        ("entete", OrderedDict([("version", header.get("VERSION")), ("numeroVersion", header.get("VERSIONNUMBER")),
                                ("statut", STATUT_DOCUMENT.get(stc, "inconnu") if stc is not None else None),
                                ("statutCode", stc), ("note", header.get("NOTE")), ("utilisateur", header.get("USERID")),
                                ("dateModification", header.get("CHANGEDDATE")),
                                ("supprime", bool(header.get("ISMARKEDASDELETED")))])),
        ("source", OrderedDict([("fichier", "Costcontrol/%s/%s/coco/costcontrol" % (projet, doc_id)),
                                ("formatDelta", raw.get("version")), ("sauvegardes", sauvegardes)])),
        ("parametres", OrderedDict([
            ("centres", OrderedDict([("dgRevise2", bool(raw.get("useKv2CostAccount"))),
                                     ("rencherissementIcc", bool(raw.get("useIndexCostAccount"))),
                                     ("montantPlafonne", bool(raw.get("useAwardCostAccount"))),
                                     ("metre", bool(raw.get("useMeasureCostAccount"))),
                                     ("libre1", bool(raw.get("useFreeCostAccount1"))),
                                     ("libre2", bool(raw.get("useFreeCostAccount2"))),
                                     ("libre3", bool(raw.get("useFreeCostAccount3")))])),
            ("arrondir", bool(raw.get("doRound"))), ("facteurDG", raw.get("kvFactor", 1.0)),
            ("equations", [txt(raw, "equation%d" % i) for i in range(1, 7)]),
            ("tvaVisibleNouvellesEcritures", bool(raw.get("separateVat"))),
            ("joursPaiementApresFacture", raw.get("payAfterBillDays")),
            ("statutPaiementDefaut", STATUT_PAIEMENT.get(raw.get("payStateProposal"))),
            ("statutMutationDefaut", STATUT_MUTATION.get(raw.get("mutStateProposal"))),
            ("saisieBrutDefaut", bool(raw.get("bruttoInputPref"))),
            ("contratPrioritaireDefaut", bool(raw.get("contractPriorityPref"))),
            ("paiementsAvecDetailsDefaut", bool(raw.get("payWidthDetailsPref"))),
            ("texteCompteAuto", bool(raw.get("accountPreferences"))), ("texteCompte", txt(raw, "lookPaymentOrder")),
            ("bonParOuvrage", bool(raw.get("payToEachSubproject"))),
            ("numerotationOrdresParMO", bool(raw.get("adviceOfPayNumberPerEachBuildOwnder"))),
            ("avenantsNonLiesAutorises", bool(raw.get("useFreeAddendum"))),
            ("lotEgalCFC", bool(raw.get("awardingEqualToBKP"))),
        ])),
        ("genresMutation", [OrderedDict([("code", txt(m, "sign")), ("texte", txt(m, "frenchText")),
                                         ("genre", GENRE_MUTATION.get(m.get("kind"))), ("actif", bool(m.get("isSelected", True)))])
                            for m in (deref(x, idx) for x in raw.get("mutationsList") or [])]),
        ("genresPaiement", [OrderedDict([("code", txt(p, "sign")), ("texte", txt(p, "frenchPayText")),
                                         ("texteFacture", txt(p, "frenchBillText")), ("genre", GENRE_PAIEMENT.get(p.get("kind")))])
                            for p in (deref(x, idx) for x in raw.get("paymentList") or [])]),
        ("catalogueConditions", [OrderedDict([("kind", c.get("kind")), ("code", txt(c, "sign")),
                                              ("genre", CONDITION.get(c.get("kind"), ("autre",))[0]),
                                              ("nature", CONDITION.get(c.get("kind"), ("", "pct"))[1]),
                                              ("texte", txt(c, "frenchText"))])
                                 for c in (deref(x, idx) for x in raw.get("conditionList") or [])]),
        ("titresColonnes", _titres_colonnes(raw, idx)),
        ("comptesMO", comptes_mo), ("entreprises", list(entreprises.values())),
        ("positions", positions), ("mutations", mutations), ("ecritures", ecritures),
        ("contrats", contrats), ("paiements", paiements), ("ordresPaiement", ordres), ("arretes", arretes),
        ("presentations", _presentations(raw, idx)), ("annexes", annexes),
        ("ouvragesProjet", list(header["_ouvrages"]) if header.get("_ouvrages") is not None else None),
    ])
    cc["controle"] = resume_controle(calculer_controle(cc))
    return cc


# ───────────────────────────── Moteur de calcul (référence pour l'interface, spec_5 § 22) ─────────────────────────────
CHAMPS = ("dg", "mutations", "transferts", "variations", "rencherissement", "dgRevise", "contrats", "avenants",
          "contratsAvenants", "paiementsContrat", "paiementsHorsContrat", "paiements", "retenues", "provisions",
          "coutProbablePerso", "coutProbable", "etatCout")


def _vide():
    return {k: 0.0 for k in CHAMPS}


def calculer_controle(cc, fidele_delta=True):
    """Calcule, pour chaque position CFC (valeurs propres puis cumulées dans les titres), les colonnes TTC du
    tableau « Contrôle du coût ». Reproduit le moteur Deltaproject (CalcCost + Prognosis) — cf. spec_5 § 22."""
    pos = {p["cfc"]: p for p in cc["positions"]}
    cles = list(pos)
    ouv_projet = None if cc.get("ouvragesProjet") is None else set(cc["ouvragesProjet"])

    def norm(cfc):
        """« 292.0 » absent du plan comptable → comptabilisé sur « 292 » (comme Deltaproject)."""
        if cfc in pos or not cfc.endswith(".0"):
            return cfc
        return cfc[:-2] if cfc[:-2] in pos else cfc

    def ignore(ouvrage):
        """Deltaproject ignore les montants saisis sur un ouvrage qui n'existe pas (plus) dans l'affaire."""
        return bool(fidele_delta and ouvrage and ouv_projet is not None and ouvrage not in ouv_projet)
    # structure : (cfc, ouvrage) → valeurs, et par entreprise (contactId) les contrats / paiements
    S = defaultdict(lambda: {"v": _vide(), "ent": defaultdict(lambda: {"c": 0.0, "a": 0.0, "pay": 0.0, "ret": 0.0,
                                                                       "dernier": False, "prio": False, "gen": 0.0,
                                                                       "genDernier": False}),
                             "perso": None, "zero": False})
    for p in cc["positions"]:
        if p["parOuvrage"]:
            for o in p["parOuvrage"]:
                if not ignore(o["ouvrage"]):
                    S[(p["cfc"], o["ouvrage"])]["v"]["dg"] += o["dgTTC"]
            reste = p["dgTTC"] - sum(o["dgTTC"] for o in p["parOuvrage"])
            if abs(reste) > 0.005:
                S[(p["cfc"], "")]["v"]["dg"] += reste
        elif p["dgTTC"]:
            S[(p["cfc"], "")]["v"]["dg"] += p["dgTTC"]
    for m in cc["mutations"]:
        champ = {"transfert": "transferts", "transfertSansContrepartie": "transferts",
                 "variation": "variations", "rencherissement": "rencherissement"}[m["genre"]]
        if m["centre"] != 1:
            continue          # mutations 2 : DG révisé 2 (non utilisé au bureau)
        if m["origine"] and not ignore(m["origine"]["ouvrage"]):
            S[(m["origine"]["cfc"], m["origine"]["ouvrage"])]["v"][champ] -= m["ttc"]
        if not ignore(m["destination"]["ouvrage"]):
            S[(m["destination"]["cfc"], m["destination"]["ouvrage"])]["v"][champ] += m["ttc"]
    for e in cc["ecritures"]:
        if ignore(e["ouvrage"]):
            continue
        k = (e["cfc"], e["ouvrage"])
        if e["type"] == "provision":
            S[k]["v"]["provisions"] += e["ttc"]
        elif e["type"] == "coutProbablePerso":
            S[k]["perso"] = (S[k]["perso"] or 0.0) + e["ttc"]
            S[k]["zero"] = S[k]["zero"] or e["coutProbableZero"]
    contrats = {c["id"]: c for c in cc["contrats"]}
    racine = {}
    for c in cc["contrats"]:
        racine[c["id"]] = c["contratParentId"] if c["type"] == "avenant" and c["lieAuContrat"] else c["id"]
    dernier_contrat = defaultdict(bool)
    for p in cc["paiements"]:
        if p["contratId"] and p["dernier"]:
            dernier_contrat[racine.get(p["contratId"], p["contratId"])] = True
    structure = {c["id"]: set((norm(l["cfc"]), l["ouvrage"]) for l in c["lignes"]) for c in cc["contrats"]}
    for c in cc["contrats"]:
        r = racine[c["id"]]
        for l in c["lignes"]:
            l = dict(l, cfc=norm(l["cfc"]))
            if ignore(l["ouvrage"]):
                continue
            if fidele_delta and r != c["id"] and (l["cfc"], l["ouvrage"]) not in structure.get(r, ()):
                continue     # ligne d'avenant lié hors de la structure du contrat : ignorée par Deltaproject
            s = S[(l["cfc"], l["ouvrage"])]
            e = s["ent"][c["contactId"]]
            if c["type"] == "contrat":
                s["v"]["contrats"] += l["net"]; e["c"] += l["net"]
            else:
                s["v"]["avenants"] += l["net"]; e["a"] += l["net"]
            e["prio"] = e["prio"] or contrats[r]["prioritaireSurDevis"]
            e.setdefault("contrats", set()).add(r)
    for p in cc["paiements"]:
        for l in p["lignes"]:
            l = dict(l, cfc=norm(l["cfc"]))
            if ignore(l["ouvrage"]):
                continue
            s = S[(l["cfc"], l["ouvrage"])]
            if p["contratId"]:
                c = contrats.get(p["contratId"], {})
                e = s["ent"][c.get("contactId")]
                s["v"]["paiementsContrat"] += l["net"]; e["pay"] += l["net"]
            else:
                e = s["ent"][p["contactId"]]
                s["v"]["paiementsHorsContrat"] += l["net"]; e["gen"] += l["net"]
                e["genDernier"] = e["genDernier"] or p["dernier"]
            if p["dernier"] and (l["brut"] or l["net"]):     # une ligne nulle n'est pas comptabilisée
                if p["contratId"]:
                    e.setdefault("contratsSoldes", set()).add(racine.get(p["contratId"], p["contratId"]))
                else:
                    e["genSolde"] = True
    # retenues de garantie : pour chaque paiement portant une retenue en % (kind 4, taux g),
    # montant retenu estimé = net payé de la ligne × g / (100 − g)  (Prognosis.calcGuarantie)
    for p in cc["paiements"]:
        if not p["contratId"]:
            continue
        g = sum(-c["valeur"] for c in p["conditions"] if c["kind"] == 4 and c["appliquee"])
        for l in p["lignes"]:
            if ignore(l["ouvrage"]) or not (l["brut"] or l["net"]):
                continue
            s = S[(norm(l["cfc"]), l["ouvrage"])]
            e = s["ent"][contrats.get(p["contratId"], {}).get("contactId")]
            if 0 < g < 100:
                e["ret"] += l["net"] * g / (100.0 - g)
            e["gDernier"] = g            # retenue du dernier paiement (ordre de saisie) de l'entreprise sur ce CFC
    res = {}
    for (cfc, ouv), s in S.items():
        v = s["v"]
        v["mutations"] = v["transferts"] + v["variations"] + v["rencherissement"]
        v["dgRevise"] = v["dg"] + v["mutations"]
        v["contratsAvenants"] = v["contrats"] + v["avenants"]
        v["paiements"] = v["paiementsContrat"] + v["paiementsHorsContrat"]
        v["coutProbable"] = cout_probable(v, s)
        v["etatCout"] = v["coutProbable"] - v["dgRevise"]
        r = res.setdefault(cfc, _vide())
        for k in CHAMPS:
            r[k] += v[k]
    # cumul dans les titres (valeurs propres + descendants)
    tous = set(cles) | set(res)
    for c in list(tous):          # positions générées (Booking.generatePosition) : 292.0 → 292 → 29 → 2 ; 000 → 00 → 0
        tous.update(ancetres_cfc(c))
    ordre = sorted(tous, key=lambda c: (-len(c), c))
    tot = {c: dict(res.get(c) or _vide()) for c in ordre}
    existants = set(ordre)
    for c in ordre:
        par = parent_cfc(c, existants)
        if par:
            for k in CHAMPS:
                tot[par][k] += tot[c][k]
    general = _vide()
    for c in ordre:
        if parent_cfc(c, existants) is None:
            for k in CHAMPS:
                general[k] += tot[c][k]
    return {"positions": tot, "propres": res, "general": general}


def cout_probable(v, s):
    """Coût probable d'une structure (CFC × ouvrage) — règles vérifiées sur 75 contrôles réels (spec_5 § 22) :
    1. « coût probable à zéro » → 0 ; écriture « coût probable perso » → prioritaire ;
    2. sans contrat : paiements hors contrat tous soldés (dernier paiement de chaque entreprise) → Σ paiements ;
       sinon max(DG révisé, Σ paiements hors contrat) (= DG révisé, même négatif, s'il n'y a aucun paiement) + provisions ;
    3. avec contrat(s), par entreprise E (contrats + avenants liés, paiements sur contrat ET hors contrat de E) :
       dernier paiement de E portant sur ce CFC → Σ paiements de E (sur contrat + hors contrat) ;
       sinon max(contrats+avenants de E, paiements sur contrat de E + retenues de garantie) + paiements hors contrat de E ;
       entreprises sans contrat : + leurs paiements hors contrat ;
       si Σ < DG révisé et aucun contrat « prioritaire sur le devis » (et pas tout soldé) → DG révisé ;
    4. provisions ajoutées seulement si une seule entreprise intervient sur le CFC (constat Deltaproject)."""
    if s["zero"]:
        return 0.0
    if s["perso"] is not None:
        return s["perso"]
    actives = {k: e for k, e in s["ent"].items() if e["c"] or e["a"] or e["pay"] or e["gen"]}
    for e in actives.values():
        # soldée : paiement final hors contrat de l'entreprise, ou TOUS ses contrats sur ce CFC ont un paiement final
        e["dernierPmt"] = bool(e.get("genSolde")) or (
            bool(e.get("contrats")) and e.get("contrats") <= e.get("contratsSoldes", set()))
    avec_contrat = {k: e for k, e in actives.items() if e["c"] or e["a"]}
    provisions = v["provisions"] if len([k for k in actives if k is not None]) <= 1 else 0.0
    if not avec_contrat:
        gen_ents = [e for e in actives.values() if e["gen"]]
        gen = sum(e["gen"] for e in gen_ents)
        if gen_ents and all(e.get("dernierPmt") for e in gen_ents):
            return gen
        return (max(v["dgRevise"], gen) if gen_ents else v["dgRevise"]) + provisions
    cp, prio, tous_finis = 0.0, False, True
    for e in actives.values():
        payes = e["pay"] + e["gen"]
        if not (e["c"] or e["a"]):
            cp += e["gen"]
            continue
        if e.get("dernierPmt"):          # le dernier paiement (sur contrat ou hors contrat) porte sur ce CFC
            cp += payes
        else:
            tous_finis = False
            ret = e["ret"] if e.get("gDernier", 0) > 0 else 0.0     # retenue libérée si le dernier paiement n'en a plus
            cp += max(e["c"] + e["a"], e["pay"] + ret) + e["gen"]
        prio = prio or e["prio"]
    if not tous_finis and not prio and cp < v["dgRevise"]:
        cp = v["dgRevise"]
    return cp + provisions


def resume_controle(calc):
    g = calc["general"]
    return OrderedDict([(k + "TTC", r2(g[k])) for k in ("dg", "mutations", "dgRevise", "contratsAvenants", "paiements",
                                                         "provisions", "coutProbable", "etatCout")])


# ───────────────────────────── Vérifications ─────────────────────────────
def verifier_controle(cc, ref=None, tol=0.05):
    """Compare les totaux recalculés aux valeurs stockées par Deltaproject.
    - contrats/avenants/paiements/arrêtés : brut/net/TVA recalculés par le moteur de conditions vs totaux stockés ;
    - « Paiements à ce jour » stocké vs Σ HT des paiements antérieurs du même contrat ;
    - si ref (deltacalc_<ID>.json : résultats du moteur Deltaproject) : colonnes par CFC et total général."""
    ecarts, remarques = [], []

    def ecart(quoi, attendu, obtenu, liste=None):
        if abs((attendu or 0) - (obtenu or 0)) > tol:
            (ecarts if liste is None else liste).append(
                "%s : Deltaproject %.2f / recalcul %.2f (écart %.2f)" % (quoi, attendu or 0, obtenu or 0,
                                                                        (obtenu or 0) - (attendu or 0)))

    def recalc(obj):
        """Recalcul ligne par ligne : base = brutCalcul (brut de ce paiement) ou brut ; forfaits et
        « paiements antérieurs » = parts stockées de la ligne ; taux = conditions du document."""
        if not obj["lignes"] or not obj["conditions"]:
            return None
        explicites = any(l.get("partsForfaits") for l in obj["lignes"])
        non_pct = [c["niveau"] for c in obj["conditions"] if CONDITION.get(c["kind"], ("", "pct"))[1] != "pct"]
        lignes = []
        for l in obj["lignes"]:
            f = {int(k): v for k, v in (l.get("partsForfaits") or {}).items()}
            if explicites:        # parts stockées par Deltaproject : une part absente vaut 0 pour cette ligne
                for n in non_pct:
                    f.setdefault(n, 0.0)
            lignes.append({"brut": l.get("brutCalcul", l["brut"]), "refCond": l["refCond"], "forfaits": f})
        return calculer_conditions(lignes, obj["conditions"])

    n = 0
    for c in cc["contrats"]:
        r = recalc(c)
        if r:
            n += 1
            ecart("%s %s net" % (c["type"], c["numero"]), c["totauxDelta"]["net"], r[1]["net"])
            ecart("%s %s TVA" % (c["type"], c["numero"]), c["totauxDelta"]["tva"], r[1]["tva"])
            ecart("%s %s Σ lignes nettes" % (c["type"], c["numero"]), c["totauxDelta"]["net"], sum(l["net"] for l in c["lignes"]))
    for p in cc["paiements"]:
        r = recalc(p)
        if r:
            n += 1
            ecart("paiement %s net" % p["numero"], p["totauxDelta"]["net"], r[1]["net"])
            ecart("paiement %s TVA" % p["numero"], p["totauxDelta"]["tva"], r[1]["tva"])
    # paiements antérieurs (situations cumulées)
    par_contrat = defaultdict(list)
    for p in cc["paiements"]:
        if p["contratId"]:
            par_contrat[p["contratId"]].append(p)
    for cid, ps in par_contrat.items():
        cumul = 0.0
        for p in ps:          # ordre de saisie Deltaproject = ordre chronologique des paiements
            for c in p["conditions"]:
                if c["kind"] == 20 and c["valeur"]:     # valeur figée à la saisie : remarque seulement
                    ecart("paiement %s « Paiements à ce jour » (valeur figée à la saisie)" % p["numero"],
                          c["valeur"], cumul, remarques)
            cumul += p["totauxDelta"]["net"] - p["totauxDelta"]["tva"]
    for d in cc["arretes"]:
        r = recalc(d)
        if r:
            n += 1
            ecart("arrêté %s net" % d["numero"], d["totauxDelta"]["net"], r[1]["net"])
    calc = calculer_controle(cc)
    avec_ouvrages = any(p["parOuvrage"] for p in cc["positions"])
    cible = remarques if avec_ouvrages else None     # moteur Deltaproject hors application : non fiable avec ouvrages
    if ref:
        noms = {"dg": "KvTot", "mutations": "MutationTot1", "dgRevise": "Kv1Tot", "contrats": "ContractTot",
                "avenants": "AddendumToContractTot", "contratsAvenants": "ContractAndAddendumTot",
                "paiements": "PaymentTot", "paiementsHorsContrat": "GeneralPaymentTot",
                "provisions": "AdditionalCostsTot", "coutProbable": "ForcastCalculatedTot", "etatCout": "BalanceOfCostsTot"}
        refpos = {p["cfc"]: p["res"] for p in ref.get("positions", [])}
        tot = calc["positions"]
        for cfc, rv in refpos.items():
            mine = tot.get(cfc, _vide())
            for k, rk in noms.items():
                if rk in rv and rv[rk] is not None:
                    ecart("CFC %s %s" % (cfc, k), rv[rk], mine[k], cible)
        g = _vide()
        for cfc, rv in refpos.items():
            if len(cfc) == 1:
                for k, rk in noms.items():
                    g[k] += rv.get(rk) or 0.0
        for k in noms:
            ecart("TOTAL %s" % k, g[k], calc["general"][k], cible)
    return n, ecarts, remarques


# ───────────────────────────── Planification des coûts (eBKP / eCCC) ─────────────────────────────
def convert_costplanning(raw, header):
    header = header or {}
    idx = index_refs(raw)

    def ouvrages(lst, champs):
        out = []
        for s in lst or []:
            s = deref(s, idx)
            if any(s.get(k) for k in ("quantity", "value", "price")) or s.get("calcList") or s.get("subElementList"):
                o = OrderedDict([("ouvrage", txt(s, "og")), ("localisation", txt(s, "lg")), ("ouvrageId", s.get("id"))])
                for k_src, k_dst in champs:
                    o[k_dst] = s.get(k_src)
                out.append(o)
        return out

    elements = []
    for e in raw.get("elemList") or []:
        e = deref(e, idx)
        par_ouv = []
        for s in e.get("divList") or []:
            s = deref(s, idx)
            if not (s.get("quantity") or s.get("value") or s.get("price") or s.get("subElementList")):
                continue
            par_ouv.append(OrderedDict([
                ("ouvrage", txt(s, "og")), ("localisation", txt(s, "lg")), ("ouvrageId", s.get("id")),
                ("grandeurRef", txt(s, "refCode")), ("unite", txt(s, "measUnit")), ("quantite", s.get("quantity")),
                ("prix", s.get("price")), ("prixEnPourcent", bool(s.get("priceIsPourcent"))),
                ("prixEnPourcentQuantite", bool(s.get("priceIsQuantityPourcent"))), ("cout", r2(s.get("value"))),
                ("coutFixe", r2(s.get("fixedValue"))), ("eventuelle", bool(s.get("isEventualPosition"))),
                ("definitif", bool(s.get("calculationIsDefinitiv"))), ("origineprix", txt(s, "priceOrigin")),
                ("remarque", txt(s, "remark")), ("noteInterne", txt(s, "internalNote")),
                ("sousElements", [OrderedDict([("numero", txt(x, "number")), ("libelle", txt(x, "text1") or txt(x, "text")),
                                               ("unite", txt(x, "measUnit")), ("grandeurRef", txt(x, "refCode")),
                                               ("quantite", x.get("quantity")), ("prix", x.get("price")),
                                               ("cout", r2(x.get("value"))), ("remarque", txt(x, "remark"))])
                                  for x in (deref(y, idx) for y in s.get("subElementList") or [])]),
            ]))
        elements.append(OrderedDict([
            ("code", txt(e, "number")), ("libelle", txt(e, "text1") or txt(e, "text")),
            ("niveau", 1 if len(txt(e, "number")) == 1 else (2 if len(txt(e, "number")) <= 3 else 3)),
            ("unite", txt(e, "measUnit")), ("grandeurRef", txt(e, "refCode")), ("uniteUNECE", txt(e, "uneCode")),
            ("quantite", e.get("quantity")), ("prix", e.get("price")), ("cout", r2(e.get("value"))),
            ("prixEnPourcent", bool(e.get("priceIsPourcent"))), ("genere", bool(e.get("isGenerated"))),
            ("standard", bool(e.get("isStandardPosition"))), ("eventuelle", bool(e.get("isEventualPosition"))),
            ("remarque", txt(e, "remark")), ("noteInterne", txt(e, "internalNote")), ("description", txt(e, "description")),
            ("energieGrise", e.get("greyEnergy")), ("coefficientU", e.get("uValue")), ("effetSerre", e.get("greenHouseEffect")),
            ("parOuvrage", par_ouv),
        ]))
    quantites = []
    for b in raw.get("baseQuantityList") or []:
        b = deref(b, idx)
        po = []
        for s in b.get("subProjectList") or []:
            s = deref(s, idx)
            if s.get("quantity") or s.get("calcList"):
                po.append(OrderedDict([("ouvrage", txt(s, "og")), ("localisation", txt(s, "lg")), ("ouvrageId", s.get("id")),
                                       ("quantite", s.get("quantity")), ("definitif", bool(s.get("calcIsDefinitiv"))),
                                       ("noteInterne", txt(s, "internalRemark")),
                                       ("calcul", [OrderedDict([("formule", txt(x, "formula")), ("commentaire", txt(x, "comment")),
                                                                ("quantite", x.get("quantity")), ("sousTotal", bool(x.get("betweenTotal")))])
                                                   for x in (deref(y, idx) for y in s.get("calcList") or [])])]))
        quantites.append(OrderedDict([("code", txt(b, "refCode")), ("libelle", txt(b, "text")), ("unite", txt(b, "measUnit")),
                                      ("uniteUNECE", txt(b, "uneCode")), ("quantite", b.get("quantity")),
                                      ("standard", bool(b.get("isStandardPosition"))), ("parOuvrage", po)]))
    doc_id = header.get("ID")
    projet = header.get("PROJECT_ID")
    if projet is None and isinstance(raw.get("fileName"), str):
        m = re.search(r"Costplanning/(\d+)/(\d+)/", raw["fileName"])
        if m:
            projet, doc_id = int(m.group(1)), doc_id or int(m.group(2))
    ogs = []
    for e in raw.get("elemList") or []:
        for s in e.get("divList") or []:
            s = deref(s, idx)
            if txt(s, "og") and txt(s, "og") not in ogs:
                ogs.append(txt(s, "og"))
    return OrderedDict([
        ("id", doc_id), ("projetId", projet),
        ("entete", OrderedDict([("version", header.get("VERSION")), ("numeroVersion", header.get("VERSIONNUMBER")),
                                ("statutCode", header.get("STATECODE")), ("note", header.get("NOTE")),
                                ("utilisateur", header.get("USERID")), ("dateModification", header.get("CHANGEDDATE")),
                                ("supprime", bool(header.get("ISMARKEDASDELETED")))])),
        ("source", OrderedDict([("fichier", "Costplanning/%s/%s/costplanning" % (projet, doc_id))])),
        ("titre", txt(raw, "docTitle")), ("date", date_iso(raw.get("docDate"))), ("indice", raw.get("index")),
        ("arrondir", bool(raw.get("round"))),
        ("pourcentage", "totalGeneral" if raw.get("devirationTotal") else "groupePrincipal"),
        ("coutRealisation", OrderedDict([("de", txt(raw, "erstellungsCostFrom")), ("a", txt(raw, "erstellungsCostTo"))])),
        ("coutOuvrage", OrderedDict([("de", txt(raw, "bauwerksCostFrom")), ("a", txt(raw, "bauwerksCostTo"))])),
        ("precision", txt(raw, "estimatePrecision")), ("etatProjet", txt(raw, "projectState")),
        ("etatPlanification", txt(raw, "planningState")),
        ("textesLibres", [txt(raw, "freeText%d" % i) for i in range(1, 6)]),
        ("ouvrages", ogs),
        ("unitesFonctionnelles", [OrderedDict([("nom", txt(f, "name")), ("equation", txt(f, "equation")),
                                               ("unite", txt(f, "measUnit")), ("genre", f.get("keyFigureKind")),
                                               ("afficher", bool(f.get("display")))])
                                  for f in (deref(x, idx) for x in raw.get("functionalUnit") or [])]),
        ("elements", elements), ("quantitesReferentielles", quantites),
        ("totaux", totaux_planification(elements, raw)),
    ])


def totaux_planification(elements, raw):
    g = {e["code"]: e["cout"] for e in elements if e["niveau"] == 1}

    def plage(a, b):
        return r2(sum(v for k, v in g.items() if a and b and a <= k <= b))
    return OrderedDict([("coutInvestissement", r2(sum(g.values()))),
                        ("coutRealisation", plage(raw.get("erstellungsCostFrom"), raw.get("erstellungsCostTo"))),
                        ("coutOuvrage", plage(raw.get("bauwerksCostFrom"), raw.get("bauwerksCostTo")))])


def verifier_planification(cp, tol=0.05):
    """Σ des éléments feuilles = valeur des groupes ; valeur = quantité × prix (ou %) par ouvrage."""
    ecarts = []
    codes = [e["code"] for e in cp["elements"]]
    val = {e["code"]: e["cout"] for e in cp["elements"]}
    for e in cp["elements"]:
        enfants = [c for c in codes if c != e["code"] and c.startswith(e["code"]) and
                   parent_cfc(c, set(codes)) == e["code"]]
        if enfants:
            s = sum(val[c] for c in enfants)
            if abs(s - e["cout"]) > tol:
                ecarts.append("élément %s : %.2f ≠ Σ enfants %.2f" % (e["code"], e["cout"], s))
        for o in e["parOuvrage"]:
            if not o["prixEnPourcent"] and not o["prixEnPourcentQuantite"] and o["quantite"] and o["prix"] and not o["sousElements"]:
                if abs(o["quantite"] * o["prix"] - o["cout"]) > max(tol, 0.01 * abs(o["cout"])) and not o["coutFixe"]:
                    ecarts.append("élément %s/%s : q×p %.2f ≠ %.2f" % (e["code"], o["ouvrage"], o["quantite"] * o["prix"], o["cout"]))
    return ecarts


# ───────────────────────────── Programme principal ─────────────────────────────
def lire_entetes(dossier_tables):
    out = {"COSTCONTROLDOCUMENT": {}, "COSTPLANNINGDOCUMENT": {}, "SUBPROJECT": {}}
    if not dossier_tables:
        return out
    for t in out:
        f = os.path.join(dossier_tables, "tables", "APP.%s.csv" % t)
        if not os.path.exists(f):
            f = os.path.join(dossier_tables, "APP.%s.csv" % t)
        if not os.path.exists(f):
            continue
        with open(f, encoding="utf-8", newline="") as fh:
            for row in csv.DictReader(fh, delimiter=";"):
                rec = {}
                for k, v in row.items():
                    if v in ("", None):
                        rec[k] = None
                    elif re.fullmatch(r"-?\d+", v) and k not in ("VERSION", "NOTE", "USERID"):
                        rec[k] = int(v)
                    else:
                        rec[k] = v
                out[t][str(rec.get("ID"))] = rec
    return out


def main(argv):
    args = [a for a in argv[1:]]
    opts = {}
    for o in ("--tables", "--racine", "--rapport"):
        if o in args:
            i = args.index(o)
            opts[o] = args[i + 1]
            del args[i:i + 2]
    if len(args) != 2:
        print(__doc__.split("CORRESPONDANCE")[0])
        return 2
    raw_dir, sortie = args
    tables = opts.get("--tables")
    if not tables:
        for cand in (os.path.join(raw_dir, ".."), os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "extraction_deltaproject")):
            if os.path.exists(os.path.join(cand, "tables", "APP.COSTCONTROLDOCUMENT.csv")):
                tables = cand
                break
    racine = opts.get("--racine", RACINE_DEFAUT)
    if not os.path.isdir(racine):
        racine = None
    ent = lire_entetes(tables)
    out = OrderedDict([("costcontrol", OrderedDict()), ("costplanning", OrderedDict())])
    rapport = []
    fichiers = sorted(glob.glob(os.path.join(raw_dir, "costcontrol_*.json")),
                      key=lambda f: int(re.sub(r"\D", "", os.path.basename(f)) or 0))
    tot_ok = tot_ec = 0
    for f in fichiers:
        doc = re.search(r"costcontrol_(\d+)\.json$", f).group(1)
        raw = json.load(open(f, encoding="utf-8"))
        header = dict(ent["COSTCONTROLDOCUMENT"].get(doc) or {"ID": int(doc)})
        header["_ouvrages"] = sorted(set(str(s.get("CODE")) for s in ent["SUBPROJECT"].values()
                                         if s.get("PROJECT_ID") == header.get("PROJECT_ID") and s.get("CODE")))
        cc = convert_costcontrol(raw, header, racine)
        out["costcontrol"][str(doc)] = cc
        ref_f = os.path.join(raw_dir, "deltacalc_%s.json" % doc)
        ref = json.load(open(ref_f, encoding="utf-8")) if os.path.exists(ref_f) else None
        n, ecarts, remarques = verifier_controle(cc, ref)
        tot_ok += 1 if not ecarts else 0
        tot_ec += len(ecarts)
        g = cc["controle"]
        rapport.append("CC %s (projet %s) : %d positions, %d contrats/avenants, %d paiements, %d mutations ; "
                       "DG %.2f, DG rév. %.2f, contrats+av. %.2f, paiements %.2f, coût probable %.2f — %s%s%s"
                       % (doc, cc["projetId"], len(cc["positions"]), len(cc["contrats"]), len(cc["paiements"]),
                          len(cc["mutations"]), g["dgTTC"], g["dgReviseTTC"], g["contratsAvenantsTTC"], g["paiementsTTC"],
                          g["coutProbableTTC"], "OK" if not ecarts else "%d écart(s)" % len(ecarts),
                          ", %d remarque(s)" % len(remarques) if remarques else "",
                          "" if ref else " [sans référence moteur Deltaproject]"))
        rapport += ["    " + e for e in ecarts[:40]] + (["    …"] if len(ecarts) > 40 else [])
        rapport += ["    (remarque) " + e for e in remarques[:10]] + (["    (remarques …)"] if len(remarques) > 10 else [])
    for f in sorted(glob.glob(os.path.join(raw_dir, "costplanning_*.json"))):
        doc = re.search(r"costplanning_(\d+)\.json$", f).group(1)
        raw = json.load(open(f, encoding="utf-8"))
        header = ent["COSTPLANNINGDOCUMENT"].get(doc) or {"ID": int(doc)}
        cp = convert_costplanning(raw, header)
        out["costplanning"][str(doc)] = cp
        e = verifier_planification(cp)
        rapport.append("CP %s (projet %s) : %d éléments, coût d'investissement %.2f — %s"
                       % (doc, cp["projetId"], len(cp["elements"]), cp["totaux"]["coutInvestissement"],
                          "OK" if not e else "%d écart(s)" % len(e)))
        rapport += ["    " + x for x in e[:20]]
    with open(sortie, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, separators=(",", ":"))
    rapport.insert(0, "Contrôles des coûts : %d convertis, %d sans écart, %d écart(s) au total. Planifications : %d."
                   % (len(out["costcontrol"]), tot_ok, tot_ec, len(out["costplanning"])))
    texte = "\n".join(rapport)
    if opts.get("--rapport"):
        open(opts["--rapport"], "w", encoding="utf-8").write(texte + "\n")
    print(texte if len(texte) < 20000 else texte[:20000] + "\n… (rapport complet : --rapport)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Serveur de DeltaSub — l'app de bureau de Substances Architectes (reproduction de Deltaproject).

Base de données PARTAGÉE par tout le bureau, sur le Mac Studio de l'atelier. Chaque poste ouvre :

    http://<nom-du-Mac-Studio>.local:7790/

Modèle de données = celui de Deltaproject : une COLLECTION par table (project, contact, staff,
timelog…), un enregistrement par ligne, mêmes noms de colonnes (en MAJUSCULES, ex. PROJECT.TITLE).
Les données réelles se reprennent de Deltaproject avec :

    python3 serveur_deltasub.py --importer-deltaproject <dossier d'extraction>   (voir outils_deltaproject/)

Concurrence : chaque enregistrement porte un numéro de séquence ; un poste qui modifie un
enregistrement indique la séquence qu'il avait lue (bseq). Si quelqu'un l'a modifié entre-temps,
l'écriture est refusée (409) et le poste reçoit la version à jour — personne n'écrase le travail
d'un autre sans le savoir. Les postes suivent les modifications via /api/changes (toutes les 4 s).

Base : SQLite sur le disque LOCAL du Mac Studio (jamais sur le NAS). Sauvegarde horaire (si
modifiée) dans « Sauvegarde DeltaSub » (dossier de l'app, sur le NAS), 48 copies conservées.
Bibliothèque standard de Python uniquement.

Ouverture de session (CH-08) : désactivée par défaut ; un administrateur l'active dans Réglages ▸ Paramètres système ▸
Ouverture de session. Commandes locales (sur le Mac Studio, base DELTASUB_DB ou base du bureau) :

    python3 serveur_deltasub.py --desactiver-authentification     (secours : retour au mode « Qui utilise ce poste ? »)
    python3 serveur_deltasub.py --mot-de-passe <USERID>             (mot de passe demandé deux fois ; sessions du compte fermées)
"""
import argparse, csv, datetime, glob, gzip, ipaddress, json, os, re, sqlite3, sys, threading, time
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

PORT = 7790
HERE = os.path.dirname(os.path.abspath(__file__))
DB_DIR = os.path.expanduser("~/Library/Application Support/DeltaSub")
DB_PATH = os.environ.get("DELTASUB_DB") or os.path.join(DB_DIR, "deltasub.sqlite")   # DELTASUB_DB = base de test
BACKUP_DIR = os.path.join(HERE, "Sauvegarde DeltaSub")
STATIC = {"/": "DeltaSub.html", "/DeltaSub.html": "DeltaSub.html"}
VERSION = 1

# Tables Deltaproject NON reprises : licences, compteurs internes, propriétés système.
SKIP_TABLES = {"APPLICENCE", "APPACTIVATEDLICENCE", "DATALICENCE", "DATAACTIVATEDLICENCE",
               "KEY_GENERATOR", "SYSTEMPROPERTY", "DOCUMENTLOCK"}
SKIP_COLUMNS = {"APPUSER": {"PASSWORD", "LOGINLOCALUSER", "LOGINLOCALHOST", "LOGINTIMESTAMP"}}
# Collections saisies dans DeltaSub (honoraires, facturation, tâches, avancement) : un ré-import Deltaproject
# (--force) ne les efface PAS ; il n'ajoute que les enregistrements Deltaproject absents de DeltaSub.
PROTECTED = {"projectfee", "projectfeecalculation", "projectfeecalculationamount", "projectfeetimeitem",
             "projectfeecostitem", "projectfeeadditionalitem", "projectcontract", "projectscheduledpayment",
             "projectpayment", "projectinvoice", "projectinvoicepos", "qrbill", "qrbillaccount",
             "projectimplementation", "projecttask", "projecttasknote",
             "planningsubproject", "planningrole", "planningroletemplate", "planningcostfactor", "planningmonth",
             "planningtime", "planningassignment", "planningstaff", "planningstafftime",
             "projecttenderer", "devisdocument", "soumission", "soumissiondoc", "soumissionhist"}
PROTECTED |= {"hfdoc"}   # CH-11 : documents d'honoraires et de facturation (offre, contrat, facture) créés dans DeltaSub
PROTECTED |= {"depotfichier"}   # CH-03 : métadonnées du dépôt de fichiers (jamais vidées au ré-import)
PROTECTED |= {"costestimatehist"}   # CH-02 lot 4 : historique des devis

# ── eCCC lot 0 (spec_12 § 2.12.3) ── Documents Bâtiment : un document MODIFIÉ ou CRÉÉ dans DeltaSub (dernier auteur ≠
# IMPORT_WHO) est conservé au ré-import (--force) ; un document encore tel qu'importé est remplacé par sa nouvelle
# conversion (ex. planifications v1 → v2). S'applique à l'en-tête (…document) et au contenu, chacun pour son compte.
# Reprise forcée (facultatif) : DELTASUB_REPRENDRE="costplanning:202 costcontrol:3601" remplace ces documents (en-tête
# et contenu) par la version Deltaproject même s'ils ont été modifiés dans DeltaSub (ex. planification restée en v1).
IMPORT_WHO = "import Deltaproject"
PROTECTED_IF_EDITED = {"costplanningdocument", "costplanning", "costestimatedocument", "costestimate",
                       "costcontroldocument", "costcontrol"}
# ── eCCC lot 3 (spec_12 § 6.5, § 12 n° 5) ── Valeurs référentielles du bureau (aussi saisies dans DeltaSub : Mes estimations
# eCCC ▸ Valeurs référentielles ▾) et propositions CFC apprises (« ebkptobkp », collection créée par DeltaSub) : un
# enregistrement modifié ou créé dans DeltaSub est conservé au ré-import (--force), les autres sont remplacés par Deltaproject.
PROTECTED_IF_EDITED |= {"statisticalvalue", "constructionpart", "constructioncomponent", "ebkpelement", "ebkptobkp"}
# ── CH-08 lot 1 (spec_18 § 3.6, § 4.6) ── Utilisateurs, fonctions, jeux de privilèges et réglages : un enregistrement touché dans
# DeltaSub (dernier auteur ≠ IMPORT_WHO), vivant OU supprimé, est conservé tel quel au ré-import (--force) ; les autres sont
# rafraîchis depuis Deltaproject. Les mots de passe de Deltaproject ne sont jamais repris (SKIP_COLUMNS inchangé).
CH08_PIT = {"appuser", "appuser_staff", "appuser_appcompanyrole", "appcompanyrole", "appcompanyrole_approle", "approle", "setting"}
PROTECTED |= {"appusersignature"}   # CH-08 : signatures PNG des comptes (collection propre à DeltaSub, lot 3)
CH08_CLE = {"appuser": "USERID", "setting": "SETTINGNAME"}   # même ID des deux côtés, mais autre compte / autre réglage
MANUEL_FR = os.environ.get("DELTASUB_MANUEL") or "/Applications/DELTAproject.app/Contents/app/rsrc/help/manual_fr.pdf"   # Aide ▸ Aide


def _ch08_touched(c):
    """{(t, id)} des collections CH08_PIT dont le dernier auteur n'est pas l'import, suppressions comprises (val NULL)."""
    pit, out, dels = sorted(CH08_PIT), set(), 0
    for t, i, v in c.execute("SELECT t, id, val FROM rec WHERE t IN (%s) AND COALESCE(who,'')<>?" % ",".join("?" * len(pit)), (*pit, IMPORT_WHO)):
        out.add((t, i)); dels += v is None
    if out:
        print("Utilisateurs, droits et réglages modifiés dans DeltaSub, conservés tels quels : %d enregistrement(s), dont %d suppression(s)."
              % (len(out), dels))
    return out


def _ch08_warn(t, rid, rec, c):
    """Enregistrement conservé dont l'identifiant désigne, dans Deltaproject, un AUTRE compte (USERID) ou réglage (SETTINGNAME)."""
    k = CH08_CLE.get(t)
    if not k:
        return
    row = c.execute("SELECT val FROM rec WHERE t=? AND id=?", (t, rid)).fetchone()
    if not row or row[0] is None:
        return
    try:
        v = json.loads(row[0])
    except ValueError:
        return
    if str(v.get(k)) != str(rec.get(k)):
        print("⚠ %s %s NON repris : l'identifiant est déjà pris dans DeltaSub (%s DeltaSub %s, Deltaproject %s)." % (t, rid, k, v.get(k), rec.get(k)))


def _ch08_manual(h):
    """GET /aide/manual_fr.pdf : fichier fixe (aucun chemin tiré de la requête), lecture seule, sans gzip, envoyé par blocs (32 Mo)."""
    import shutil
    try:
        fh = open(MANUEL_FR, "rb")
    except OSError:
        return h._send(404, '{"error":"manuel introuvable"}')
    with fh:
        h.send_response(200)
        h.send_header("Content-Type", "application/pdf")
        h.send_header("Content-Disposition", 'inline; filename="manual_fr.pdf"')
        h.send_header("Content-Length", str(os.fstat(fh.fileno()).st_size))
        h.send_header("Cache-Control", "private, max-age=3600")
        h.end_headers()
        try:
            shutil.copyfileobj(fh, h.wfile, 1 << 20)
        except (BrokenPipeError, ConnectionResetError):
            pass
# ── fin CH-08 lot 1 ──
CH08_PIT |= {"contactowner", "contact", "bankaccount", "contact_property", "contactnote", "contactgroup",
             "contactgroup_contact", "contactquery", "projectmember", "projectactivity_staff"}   # CH-04 lot 1 : adresses et participations touchées dans DeltaSub
CH08_CLE.update({"contactowner": "CREATED", "contact": "CONTACTOWNER_ID", "bankaccount": "CONTACTOWNER_ID",
                 "contactnote": "CONTACT_ID", "contactgroup": "NAME", "contactquery": "NAME", "projectmember": "PROJECT_ID"})   # CH-04 : collisions d'identifiant
PROTECTED_IF_EDITED |= {"modele", "modelegroupe", "formtemplate", "formtemplategroup"}   # CH-10 lot 2 : anciens modèles modifiés ou importés dans DeltaSub
PROTECTED_IF_EDITED |= {"costestimatedpdoc"}   # CH-02 lot 3 : documents .dpdoc des devis
PROTECTED_IF_EDITED |= {"cocodoc"}   # CH-01 : documents du contrôle des coûts créés ou modifiés dans DeltaSub (conservés au ré-import)
REF_CLE = {"statisticalvalue": "EBKPELEMENT_ID", "constructionpart": "EBKPELEMENT_ID",
           "constructioncomponent": "CONSTRUCTIONPART_ID", "ebkpelement": "CODE"}


def _autre_ref(t, v, rec):
    """Valeur référentielle conservée (modifiée ou créée dans DeltaSub) dont l'identifiant désigne, dans Deltaproject, un
    enregistrement d'un AUTRE élément eCCC / sous-élément / code (identifiant attribué des deux côtés) → texte d'avertissement."""
    k = REF_CLE.get(t)
    if not k:
        return None
    try:
        v = json.loads(v) if isinstance(v, str) else (v or {})
    except ValueError:
        return None
    return None if str(v.get(k)) == str(rec.get(k)) else "%s DeltaSub %s, Deltaproject %s" % (k, v.get(k), rec.get(k))
# ── fin eCCC lot 3 ──


def _reprendre():
    out = set()
    for tok in re.split(r"[\s,;]+", os.environ.get("DELTASUB_REPRENDRE", "")):
        m = re.fullmatch(r"(costplanning|costestimate|costcontrol)(?:document)?:(\d+)", tok.strip().lower())
        if m:
            out |= {(m.group(1), m.group(2)), (m.group(1) + "document", m.group(2))}
    return out


def _batiment_edites(c):
    """{(t, id): val JSON} des documents Bâtiment vivants dont le dernier auteur n'est pas l'import (hors reprise forcée)."""
    pie, rep = sorted(PROTECTED_IF_EDITED), _reprendre()
    return {(t, i): v for t, i, w, v in c.execute("SELECT t, id, who, val FROM rec WHERE val IS NOT NULL AND t IN (%s)"
                                                  % ",".join("?" * len(pie)), tuple(pie))
            if (w or "") != IMPORT_WHO and (t, i) not in rep}


def _projet(v):
    try:
        v = json.loads(v) if isinstance(v, str) else (v or {})
        return v.get("PROJECT_ID", v.get("projetId"))
    except (ValueError, AttributeError):
        return None
# ── fin eCCC lot 0 ──

_wlock = threading.Lock()


# ── CH-08 lot 4 (spec_18 § 3.5, § 4.15-4.20) ── Ouverture de session et mots de passe. Tables auth_pw, auth_session et
# auth_fail HORS de rec : jamais servies aux postes (/api/snapshot et /api/changes ne lisent que rec). Empreinte
# PBKDF2-HMAC-SHA256, 600 000 itérations, sel de 16 octets (hashlib.scrypt absent du Python 3.9 du Mac Studio ; ~0,18 s) ; jeton
# secrets.token_urlsafe dont seul le SHA-256 est stocké, remis dans le cookie ds_session (HttpOnly, SameSite=Strict). Désactivée par
# défaut (meta auth_enabled) ; activée par POST /api/auth (compte userAdmin dont le mot de passe est vérifié). Aucun mot de passe ni
# empreinte de Deltaproject n'est lu : SKIP_COLUMNS inchangé.
import base64, getpass, hashlib, hmac, secrets
from http.cookies import SimpleCookie

CH08_ITER = 600000
CH08_TTL, CH08_TTL_LONG = 12 * 3600, 30 * 86400          # sans activité ; avec « Mémoriser les informations »
CH08_FAIL_N, CH08_FAIL_WIN, CH08_FAIL_BLOCK = 5, 600, 60  # 5 échecs en 10 min → refus pendant 60 s
CH08_MINLEN = 8                                          # décision n° 3
CH08_COOKIE = "ds_session"
CH08_GET = {"/api/session", "/api/auth", "/api/sessions"}
CH08_POST = {"/api/login", "/api/logout", "/api/password", "/api/password/first", "/api/password/reset", "/api/auth",
             "/api/sessions/reject"}
CH08_ADMIN_T = {"appuser", "appuser_appcompanyrole", "appuser_staff", "appcompanyrole", "appcompanyrole_approle", "approle"}
CH08_SELF = {"INITIALS", "PHONE", "EMAIL", "JOBTITLE", "JOBFUNCTION"}   # Préférences ▸ Utilisateur du compte lui-même
CH08_SET_GEN = {"genCountryPos", "mainCurrency", "genVatRatePos", "areBauadDocsLocked", "isModuleFormVisible",
                "isProjectMenuFilesVisible"}                           # + standardFont*, standardTableFont* : admin et adminGeneral
CH08_SET_ADR = {"displayNameFormat", "countryCodeSeparator", "areaCodeSeparator"}   # + displayPhone* : admin et adminAddresses
CH08_CODES = {"superadmin": (0, 0), "admin": (1, 0), "adminGeneral": (1, 1), "adminAddresses": (1, 2), "userAdmin": (2, 0)}
CH08_INTERNAL = ("admin", "mayday")                                     # userAdmin d'office (Security.hasRight@0-57)
CH08_MSG = {"old": "Mot de passe erroné.", "new": "Le nouveau mot de passe n'est pas valable.",
            "login": "Echec d'ouverture de session", "droits": "Vous n'avez pas les droits nécessaires.",
            "reset": "Ce compte a déjà un mot de passe : il se réinitialise quand l'ouverture de session est active.",
            "mode": "Mode sans mot de passe.", "session": "Session requise."}
_ch08_rc = {"seq": None, "d": None}


def ch08_hash(pw, salt=None, it=CH08_ITER):
    """Empreinte « pbkdf2_sha256$<itérations>$<sel base64>$<empreinte base64> » (itérations lues à la vérification)."""
    salt = salt if salt is not None else secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", pw.encode("utf-8"), salt, it, 32)
    return "pbkdf2_sha256$%d$%s$%s" % (it, base64.b64encode(salt).decode("ascii"), base64.b64encode(dk).decode("ascii"))


def ch08_verify(pw, stored):
    try:
        alg, it, s, d = stored.split("$")
        if alg != "pbkdf2_sha256":
            return False
        want = base64.b64decode(d)
        got = hashlib.pbkdf2_hmac("sha256", pw.encode("utf-8"), base64.b64decode(s), int(it), len(want))
    except (ValueError, AttributeError, TypeError):
        return False
    return hmac.compare_digest(got, want)


def ch08_meta(c, name, default):
    r = c.execute("SELECT value FROM meta WHERE name=?", (name,)).fetchone()
    return r[0] if r else default


def ch08_set_meta(c, name, value):
    with _wlock:
        c.execute("INSERT INTO meta VALUES(?,?) ON CONFLICT(name) DO UPDATE SET value=excluded.value", (name, value))
        c.commit()


def ch08_auth_on(c):
    return ch08_meta(c, "auth_enabled", "0") == "1"


def ch08_first_free(c):
    return ch08_meta(c, "auth_first_free", "1") == "1"


def ch08_rec(c, t, i):
    r = c.execute("SELECT val FROM rec WHERE t=? AND id=? AND val IS NOT NULL", (t, str(i))).fetchone()
    try:
        v = json.loads(r[0]) if r else None
    except ValueError:
        return None
    return v if isinstance(v, dict) else None


def ch08_user(c, uid):
    """Compte dont l'USERID est exactement uid (sensible à la casse), ou None ; « ID » = identifiant de l'enregistrement."""
    if not uid:
        return None
    for i, v in c.execute("SELECT id, val FROM rec WHERE t='appuser' AND val IS NOT NULL"):
        try:
            x = json.loads(v)
        except ValueError:
            continue
        if isinstance(x, dict) and x.get("USERID") == uid:
            return dict(x, ID=x.get("ID", i))
    return None


def ch08_pw(c, appuser_id):
    r = c.execute("SELECT hash FROM auth_pw WHERE appuser_id=?", (str(appuser_id),)).fetchone()
    return r[0] if r else None


def ch08_set_pw(c, appuser_id, pw):
    hv = ch08_hash(pw)
    with _wlock:
        c.execute("INSERT INTO auth_pw VALUES(?,?,?) ON CONFLICT(appuser_id) DO UPDATE SET hash=excluded.hash, changed=excluded.changed",
                  (str(appuser_id), hv, datetime.datetime.now().isoformat(timespec="seconds")))
        c.commit()


def ch08_parse(s):
    """APPROLE.RIGHTS « m,i;m,i; » → {(m, i)} ; lecture tolérante, même règle que ch08aRightsParse de la page."""
    out = set()
    for p in str(s if s is not None else "").split(";"):
        q = p.split(",")
        if len(q) >= 2 and re.fullmatch(r"[+-]?\d+", q[0].strip()) and re.fullmatch(r"[+-]?\d+", q[1].strip()):
            out.add((int(q[0].strip()), int(q[1].strip())))
    return out


def ch08_rights_data(c):
    """(jeux {id: codes}, fonction → [jeux], compte → [fonctions]) sur rec, recalculés quand la séquence change."""
    s = cur_seq(c)
    if _ch08_rc["seq"] != s:
        def live(t):
            for i, v in c.execute("SELECT id, val FROM rec WHERE t=? AND val IS NOT NULL", (t,)):
                try:
                    x = json.loads(v)
                except ValueError:
                    continue
                if isinstance(x, dict):
                    yield i, x
        roles = {i: ch08_parse(x.get("RIGHTS")) for i, x in live("approle")}
        c2r, u2c = {}, {}
        for _, x in live("appcompanyrole_approle"):
            c2r.setdefault(str(x.get("APPCOMPANYROLE_ID")), []).append(str(x.get("APPROLES_ID")))
        for _, x in live("appuser_appcompanyrole"):
            u2c.setdefault(str(x.get("APPUSER_ID")), []).append(str(x.get("APPCOMPANYROLES_ID")))
        _ch08_rc.update(seq=s, d=(roles, c2r, u2c))
    return _ch08_rc["d"]


def ch08_can(c, u, key):
    """Même règle que ch08aCan : aucun jeu → tout permis (amorçage) ; pas de compte → non ; userAdmin d'office pour admin et
    mayday ; aucune fonction → non ; sinon union des jeux de toutes les fonctions, superadmin (0,0) donne tout."""
    roles, c2r, u2c = ch08_rights_data(c)
    if not roles:
        return True
    if not u:
        return False
    if key == "userAdmin" and u.get("USERID") in CH08_INTERNAL:
        return True
    fs = u2c.get(str(u.get("ID")))
    if not fs:
        return False
    have = set()
    for f in fs:
        for r in c2r.get(f, []):
            have |= roles.get(r, set())
    return CH08_CODES[key] in have or (0, 0) in have


def ch08_set_right(n):
    """Droit exigé (en plus de « admin ») pour écrire le réglage n, ou None (réglage libre)."""
    if n in CH08_SET_GEN or n.startswith(("standardFont", "standardTableFont")):
        return "adminGeneral"
    if n in CH08_SET_ADR or n.startswith("displayPhone"):
        return "adminAddresses"
    return None


def ch08_refuse(c, ops, u):
    """Règles d'écriture du § 4.20.3 (les deux modes) : collection du premier refus, ou None."""
    for op in ops:
        t, i, v = op.get("t"), str(op.get("id")), op.get("val")
        if t in CH08_ADMIN_T:
            if t == "appuser" and u and i == str(u.get("ID")) and isinstance(v, dict):
                old = ch08_rec(c, "appuser", i)
                if old is not None and all(old.get(k) == v.get(k) for k in set(old) | set(v) if k not in CH08_SELF):
                    continue   # Préférences ▸ Utilisateur : le compte lui-même, 5 champs seulement
            if not ch08_can(c, u, "userAdmin"):
                return t
        elif t == "appusersignature":
            if not (u and i == str(u.get("ID"))) and not ch08_can(c, u, "userAdmin"):
                return t
        elif t == "setting":
            old = ch08_rec(c, "setting", i) or {}
            for n in {str(old.get("SETTINGNAME") or ""), str((v if isinstance(v, dict) else {}).get("SETTINGNAME") or "")}:
                k = ch08_set_right(n)
                if k and not (ch08_can(c, u, "admin") and ch08_can(c, u, k)):
                    return t
    return None


def ch08_send(h, code, obj, cookie=None):
    b = js(obj).encode("utf-8")
    h.send_response(code)
    h.send_header("Content-Type", "application/json; charset=utf-8")
    h.send_header("Content-Length", str(len(b)))
    h.send_header("Cache-Control", "no-store")
    if cookie:
        h.send_header("Set-Cookie", cookie)
    h.end_headers()
    h.wfile.write(b)
    return False


def ch08_err(h, code, e):
    return ch08_send(h, code, {"ok": False, "error": e, "msg": CH08_MSG.get(e, e)})


def ch08_cookie(tok, remember):
    return "%s=%s; Path=/; HttpOnly; SameSite=Strict%s" % (CH08_COOKIE, tok, "; Max-Age=%d" % CH08_TTL_LONG if remember else "")


def ch08_token(h):
    ck = SimpleCookie()
    try:
        ck.load(h.headers.get("Cookie") or "")
    except Exception:
        return None
    m = ck.get(CH08_COOKIE)
    return m.value if m is not None and m.value else None


def ch08_th(tok):
    return hashlib.sha256(tok.encode("utf-8")).hexdigest()


def ch08_valid(s, now):
    return not s[8] and now - (s[6] or 0) <= (CH08_TTL_LONG if s[7] else CH08_TTL)


CH08_COLS = "token_hash, appuser_id, userid, ip, ua, created, last, remember, revoked"


def ch08_session(h, c, touch=True):
    """Session valide du poste (cookie ds_session) → dict (avec « user » = APPUSER), sinon None et h.ch08_reason =
    aucune | expire | reprise | rejet | mdp | session (compte supprimé, désactivé ou mayday)."""
    h.ch08_reason = "aucune"
    tok = ch08_token(h)
    if not tok:
        return None
    r = c.execute("SELECT %s FROM auth_session WHERE token_hash=?" % CH08_COLS, (ch08_th(tok),)).fetchone()
    now = time.time()
    if not r:
        h.ch08_reason = "expire"
        return None
    if r[8]:
        h.ch08_reason = r[8]
        return None
    if not ch08_valid(r, now):
        h.ch08_reason = "expire"
        return None
    u = ch08_rec(c, "appuser", r[1])
    if not u or not u.get("ISENABLED") or u.get("USERID") == "mayday":
        h.ch08_reason = "session"
        return None
    if touch and now - (r[6] or 0) > 60:   # « last » mis à jour une fois par minute au plus
        with _wlock:
            c.execute("UPDATE auth_session SET last=? WHERE token_hash=?", (now, r[0]))
            c.commit()
    s = dict(zip(CH08_COLS.split(", "), r))
    s["user"] = dict(u, ID=u.get("ID", r[1]))
    return s


def ch08_sessions_of(c, appuser_id, now):
    return [r for r in c.execute("SELECT %s FROM auth_session WHERE appuser_id=? AND revoked IS NULL" % CH08_COLS, (str(appuser_id),))
            if ch08_valid(r, now)]


def ch08_revoke(c, appuser_id, why, keep=None):
    """Révoque les sessions valides d'un compte (motif gardé 24 h) ; keep = jeton (haché) à épargner. → nombre."""
    now = time.time()
    n = 0
    with _wlock:
        for r in ch08_sessions_of(c, appuser_id, now):
            if r[0] != keep:
                c.execute("UPDATE auth_session SET revoked=?, last=? WHERE token_hash=?", (why, now, r[0]))
                n += 1
        c.commit()
    return n


def ch08_purge(c):
    now = time.time()
    with _wlock:
        c.execute("DELETE FROM auth_session WHERE (revoked IS NOT NULL AND last<?) OR (revoked IS NULL AND COALESCE(remember,0)=0 AND last<?)"
                  " OR (revoked IS NULL AND remember=1 AND last<?)", (now - 86400, now - CH08_TTL, now - CH08_TTL_LONG))
        c.execute("DELETE FROM auth_fail WHERE ts<?", (now - CH08_FAIL_WIN,))
        c.commit()


def ch08_blocked(c, uid):
    now = time.time()
    ts = [t for (t,) in c.execute("SELECT ts FROM auth_fail WHERE userid=? AND ts>?", (uid, now - CH08_FAIL_WIN))]
    return len(ts) >= CH08_FAIL_N and now - max(ts) < CH08_FAIL_BLOCK


def ch08_fail(c, uid):
    with _wlock:
        c.execute("INSERT INTO auth_fail VALUES(?,?)", (uid, time.time()))
        c.commit()


def ch08_ua_desc(ua):
    """« Chrome · macOS » : navigateur et système du poste (champ « Utilisateur » de « Document verrouillé », E15)."""
    ua = ua or ""
    b = next((n for k, n in (("Edg/", "Edge"), ("OPR/", "Opera"), ("Firefox/", "Firefox"), ("Chrome/", "Chrome"), ("Safari/", "Safari"))
              if k in ua), "Navigateur")
    s = next((n for k, n in (("iPhone", "iOS"), ("iPad", "iPadOS"), ("Android", "Android"), ("Mac OS X", "macOS"), ("Windows", "Windows"),
                             ("Linux", "Linux")) if k in ua), "")
    return b + (" · " + s if s else "")


def ch08_iso(ts):
    return datetime.datetime.fromtimestamp(ts or 0).isoformat(timespec="seconds")


def ch08_open(h, c, u, remember):
    """Nouvelle session du compte u → valeur de l'en-tête Set-Cookie. L'ancienne session de ce navigateur (autre compte) est effacée."""
    tok, now = secrets.token_urlsafe(32), time.time()
    old = ch08_token(h)
    with _wlock:
        if old:
            c.execute("DELETE FROM auth_session WHERE token_hash=?", (ch08_th(old),))
        c.execute("INSERT INTO auth_session VALUES(?,?,?,?,?,?,?,?,NULL)",
                  (ch08_th(tok), str(u["ID"]), u.get("USERID"), h.client_address[0], (h.headers.get("User-Agent") or "")[:300],
                   now, now, 1 if remember else 0))
        c.execute("DELETE FROM auth_fail WHERE userid=?", (u.get("USERID"),))
        c.commit()
    return ch08_cookie(tok, remember)


def ch08_body(h):
    n = int(h.headers.get("Content-Length") or 0)
    if n > 65536:
        raise ValueError("requête trop grande")
    b = json.loads(h.rfile.read(n).decode("utf-8") or "{}") if n else {}
    return b if isinstance(b, dict) else {}


def ch08_new_ok(new, conf):
    return new == conf and len(new) >= CH08_MINLEN


def ch08_login(h, c, b):
    """§ 4.20.2 : blocage, compte (exact, actif, ≠ mayday), première connexion, empreinte, autre session (409 / reprise)."""
    if not ch08_auth_on(c):
        return ch08_err(h, 400, "mode")
    ch08_purge(c)
    uid, pw = str(b.get("userid") or ""), str(b.get("password") or "")
    if ch08_blocked(c, uid):
        return ch08_err(h, 401, "login")
    u = ch08_user(c, uid)
    if not u or not u.get("ISENABLED") or uid == "mayday":
        ch08_hash(pw)   # même durée qu'un mot de passe faux : la réponse ne distingue pas un compte inconnu
        ch08_fail(c, uid)
        return ch08_err(h, 401, "login")
    hp = ch08_pw(c, u["ID"])
    if hp is None:
        if ch08_first_free(c):
            return ch08_send(h, 200, {"ok": True, "first": True})
        ch08_hash(pw)
        ch08_fail(c, uid)
        return ch08_err(h, 401, "login")
    if not ch08_verify(pw, hp):
        ch08_fail(c, uid)
        return ch08_err(h, 401, "login")
    now, ip, ua = time.time(), h.client_address[0], (h.headers.get("User-Agent") or "")[:300]
    others = ch08_sessions_of(c, u["ID"], now)
    same = [r for r in others if r[3] == ip and r[4] == ua]            # même poste : reprise silencieuse
    other = [r for r in others if r not in same]
    if other and not b.get("override"):
        r = max(other, key=lambda x: x[5] or 0)
        return ch08_send(h, 409, {"ok": False, "locked": {"user": ch08_ua_desc(r[4]), "host": r[3], "since": ch08_iso(r[5])}})
    with _wlock:
        for r in same:
            c.execute("DELETE FROM auth_session WHERE token_hash=?", (r[0],))
        for r in other:
            c.execute("UPDATE auth_session SET revoked='reprise', last=? WHERE token_hash=?", (now, r[0]))
        c.commit()
    ck = ch08_open(h, c, u, bool(b.get("remember")))
    return ch08_send(h, 200, {"ok": True, "user": {"ID": u["ID"], "USERID": uid}}, ck)


def ch08_actor(h, c, b):
    """Compte qui agit : celui de la session (mode avec mot de passe) ou celui dont l'USERID est « who » (identité déclarée)."""
    if ch08_auth_on(c):
        s = ch08_session(h, c)
        return (s["user"] if s else None), s
    return ch08_user(c, str(b.get("who") or "")), None


def ch08_password(h, c, b):
    """Modifier (ancien mot de passe = preuve) ou définir (compte sans mot de passe). Ordre de ChangePasswordDialog :
    1. compte et ancien mot de passe ; 2. nouveau = confirmation et 8 caractères au moins ; 3. écriture."""
    uid, old = str(b.get("userid") or ""), str(b.get("old") or "")
    new, conf = str(b.get("new") or ""), str(b.get("confirm") or "")
    u = ch08_user(c, uid)
    if not u or uid == "mayday":
        ch08_hash(old)
        return ch08_err(h, 403, "old")
    hp = ch08_pw(c, u["ID"])
    if hp is not None:
        if ch08_blocked(c, uid):
            return ch08_err(h, 403, "old")
        if not ch08_verify(old, hp):
            ch08_fail(c, uid)
            return ch08_err(h, 403, "old")
    else:
        if old:
            return ch08_err(h, 403, "old")
        if ch08_auth_on(c):   # définir sans ancien : compte de la session, ou session userAdmin
            s = ch08_session(h, c)
            if not s:
                return ch08_send(h, 401, {"ok": False, "error": "session", "reason": h.ch08_reason})
            if str(s["appuser_id"]) != str(u["ID"]) and not ch08_can(c, s["user"], "userAdmin"):
                return ch08_err(h, 403, "droits")
    if not ch08_new_ok(new, conf):
        return ch08_err(h, 403, "new")
    ch08_set_pw(c, u["ID"], new)
    return ch08_send(h, 200, {"ok": True})


def ch08_first(h, c, b):
    """Premier mot de passe d'un compte qui n'en a pas ; mode avec mot de passe : si auth_first_free = 1, puis session ouverte."""
    uid, new, conf = str(b.get("userid") or ""), str(b.get("new") or ""), str(b.get("confirm") or "")
    on = ch08_auth_on(c)
    u = ch08_user(c, uid)
    if (on and not ch08_first_free(c)) or not u or not u.get("ISENABLED") or uid == "mayday" or ch08_pw(c, u["ID"]) is not None:
        return ch08_err(h, 403, "login")
    if not ch08_new_ok(new, conf):
        return ch08_err(h, 403, "new")
    ch08_set_pw(c, u["ID"], new)
    if not on:
        return ch08_send(h, 200, {"ok": True})
    ck = ch08_open(h, c, u, bool(b.get("remember")))
    return ch08_send(h, 200, {"ok": True, "user": {"ID": u["ID"], "USERID": uid}}, ck)


def ch08_reset(h, c, b):
    """Réinitialiser (userAdmin). Sans mot de passe : seulement définir celui d'un compte qui n'en a pas (arbitrage 29) ;
    avec : définir ou remplacer, puis sessions du compte révoquées (« mdp »), sauf celle de l'administrateur."""
    actor, s = ch08_actor(h, c, b)
    on = ch08_auth_on(c)
    if on and not s:
        return ch08_send(h, 401, {"ok": False, "error": "session", "reason": h.ch08_reason})
    if not ch08_can(c, actor, "userAdmin"):
        return ch08_err(h, 403, "droits")
    aid = str(b.get("appuser_id") or "")
    u = ch08_rec(c, "appuser", aid)
    if not u or u.get("USERID") == "mayday":
        return ch08_err(h, 403, "droits")
    if not on and ch08_pw(c, aid) is not None:
        return ch08_err(h, 403, "reset")
    if not ch08_new_ok(str(b.get("new") or ""), str(b.get("confirm") or "")):
        return ch08_err(h, 403, "new")
    ch08_set_pw(c, aid, str(b.get("new")))
    n = ch08_revoke(c, aid, "mdp", keep=s["token_hash"] if s else None) if on else 0
    return ch08_send(h, 200, {"ok": True, "closed": n})


def ch08_auth_get(h, c):
    on = ch08_auth_on(c)
    if on:
        s = ch08_session(h, c)
        if not s:
            return ch08_send(h, 401, {"ok": False, "error": "session", "reason": h.ch08_reason})
        if not ch08_can(c, s["user"], "userAdmin"):
            return ch08_err(h, 403, "droits")
    now = time.time()
    n = sum(1 for r in c.execute("SELECT %s FROM auth_session WHERE revoked IS NULL" % CH08_COLS) if ch08_valid(r, now)) if on else 0
    return ch08_send(h, 200, {"ok": True, "auth": on, "firstFree": ch08_first_free(c), "sessions": n,
                              "withPassword": [i for (i,) in c.execute("SELECT appuser_id FROM auth_pw ORDER BY appuser_id")]})


def ch08_auth_post(h, c, b):
    """Activer (compte déclaré userAdmin + mot de passe vérifié → session ouverte), désactiver ou changer « première connexion »
    (session userAdmin)."""
    en, ff = bool(b.get("enable")), b.get("first_free")
    if ch08_auth_on(c):
        s = ch08_session(h, c)
        if not s:
            return ch08_send(h, 401, {"ok": False, "error": "session", "reason": h.ch08_reason})
        if not ch08_can(c, s["user"], "userAdmin"):
            return ch08_err(h, 403, "droits")
        if not en:
            ch08_set_meta(c, "auth_enabled", "0")
            with _wlock:
                c.execute("DELETE FROM auth_session")
                c.commit()
            return ch08_send(h, 200, {"ok": True, "auth": False}, "%s=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0" % CH08_COOKIE)
        if ff is not None:
            ch08_set_meta(c, "auth_first_free", "1" if ff else "0")
        return ch08_send(h, 200, {"ok": True, "auth": True})
    if not en:
        return ch08_send(h, 200, {"ok": True, "auth": False})
    uid = str(b.get("userid") or "")
    u = ch08_user(c, uid)
    if not u or not u.get("ISENABLED") or uid == "mayday" or not ch08_can(c, u, "userAdmin"):
        return ch08_err(h, 403, "droits")
    hp = ch08_pw(c, u["ID"])
    if ch08_blocked(c, uid) or hp is None or not ch08_verify(str(b.get("password") or ""), hp):
        if hp is not None and not ch08_blocked(c, uid):
            ch08_fail(c, uid)
        return ch08_err(h, 403, "old")
    ch08_set_meta(c, "auth_first_free", "0" if ff is False else "1")
    ch08_set_meta(c, "auth_enabled", "1")
    ck = ch08_open(h, c, u, bool(b.get("remember")))
    return ch08_send(h, 200, {"ok": True, "auth": True, "user": {"ID": u["ID"], "USERID": uid}}, ck)


def ch08_sessions(h, c, reject=None):
    """« Utilisateurs actifs » (login.AppUsersDialog) et « Rejeter un utilisateur » (motif « rejet ») : session userAdmin."""
    if not ch08_auth_on(c):
        return ch08_err(h, 400, "mode")
    s = ch08_session(h, c)
    if not s:
        return ch08_send(h, 401, {"ok": False, "error": "session", "reason": h.ch08_reason})
    if not ch08_can(c, s["user"], "userAdmin"):
        return ch08_err(h, 403, "droits")
    if reject is not None:
        return ch08_send(h, 200, {"ok": True, "closed": ch08_revoke(c, str(reject.get("appuser_id") or ""), "rejet")})
    now, out = time.time(), []
    for r in c.execute("SELECT %s FROM auth_session WHERE revoked IS NULL ORDER BY created" % CH08_COLS).fetchall():
        if ch08_valid(r, now):
            u = ch08_rec(c, "appuser", r[1]) or {}
            out.append({"appuser_id": r[1], "userid": r[2], "name": u.get("NAME") or r[2], "user": ch08_ua_desc(r[4]), "host": r[3],
                        "since": ch08_iso(r[5]), "current": r[0] == s["token_hash"]})
    return ch08_send(h, 200, {"ok": True, "sessions": out})


def ch08_route(h, c, method, path):
    if method == "GET":
        if path == "/api/session":
            if not ch08_auth_on(c):
                return ch08_send(h, 200, {"ok": True, "auth": False})
            s = ch08_session(h, c)
            if not s:
                return ch08_send(h, 401, {"ok": False, "error": "session", "reason": h.ch08_reason})
            ck = ch08_cookie(ch08_token(h), True) if s["remember"] else None   # 30 jours glissants
            return ch08_send(h, 200, {"ok": True, "auth": True, "user": {"ID": s["user"]["ID"], "USERID": s["user"].get("USERID")}}, ck)
        if path == "/api/auth":
            return ch08_auth_get(h, c)
        if path == "/api/sessions":
            return ch08_sessions(h, c)
        return ch08_send(h, 405, {"ok": False, "error": "méthode"})
    if path not in CH08_POST:
        return ch08_send(h, 405, {"ok": False, "error": "méthode"})
    b = ch08_body(h)
    if path == "/api/login":
        return ch08_login(h, c, b)
    if path == "/api/logout":
        tok = ch08_token(h)
        if tok:
            with _wlock:
                c.execute("DELETE FROM auth_session WHERE token_hash=?", (ch08_th(tok),))
                c.commit()
        return ch08_send(h, 200, {"ok": True}, "%s=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0" % CH08_COOKIE)
    if path == "/api/password":
        return ch08_password(h, c, b)
    if path == "/api/password/first":
        return ch08_first(h, c, b)
    if path == "/api/password/reset":
        return ch08_reset(h, c, b)
    if path == "/api/auth":
        return ch08_auth_post(h, c, b)
    return ch08_sessions(h, c, reject=b)


def ch08_gate(h, method):
    """Première instruction de do_GET et do_POST (§ 4.20.1). True = la requête suit son cours ; False = réponse déjà envoyée.
    1. hors du réseau local : le code existant répond 403 ; 2. routes de CH-08 traitées ici ; 3. mode sans mot de passe : rien ne
    change ; 4. mode avec mot de passe : session valide exigée, sauf la page (/, /DeltaSub.html) et /api/ping réduit à {ok, auth}."""
    h.ch08_user, h.ch08_reason = None, "aucune"
    if not lan_ok(h.client_address[0]):
        return True
    path = urlparse(h.path).path
    c = db()
    try:
        if path in CH08_GET or path in CH08_POST:
            try:
                ch08_route(h, c, method, path)
            except Exception as e:
                ch08_send(h, 400, {"ok": False, "error": str(e)[:200]})
            return False
        if not ch08_auth_on(c):
            return True
        s = ch08_session(h, c)
        if s:
            h.ch08_user = s
            return True
        if method == "GET" and path in ("/", "/DeltaSub.html"):
            return True
        if method == "GET" and path == "/api/ping":
            return ch08_send(h, 200, {"ok": True, "auth": True})
        return ch08_send(h, 401, {"ok": False, "error": "session", "reason": h.ch08_reason})
    finally:
        c.close()


def ch08_who(h, c, body):
    """/api/commit : auteur (USERID de la session, ou « who » déclaré par le poste) après les règles d'écriture ; None = 403 envoyé."""
    ops = body.get("ops") or []
    if ch08_auth_on(c):
        s = getattr(h, "ch08_user", None)
        if not s:
            ch08_send(h, 401, {"ok": False, "error": "session", "reason": getattr(h, "ch08_reason", "aucune")})
            return None
        u, who = s["user"], str(s["user"].get("USERID") or s["userid"])
    else:
        who = str(body.get("who") or h.client_address[0])
        u = ch08_user(c, str(body.get("who") or ""))
    t = ch08_refuse(c, ops, u)
    if t:
        ch08_send(h, 403, {"ok": False, "error": "droits", "t": t})
        return None
    return who[:80]


def ch08_after_commit(c, ops):
    """Compte supprimé : empreinte et sessions effacées."""
    gone = [str(op.get("id")) for op in ops if op.get("t") == "appuser" and op.get("val") is None]
    if gone:
        with _wlock:
            for i in gone:
                c.execute("DELETE FROM auth_pw WHERE appuser_id=?", (i,))
                c.execute("DELETE FROM auth_session WHERE appuser_id=?", (i,))
            c.commit()


def ch08_cli(c, a):
    """--desactiver-authentification ; --mot-de-passe USERID (entrée au clavier par getpass, ou deux lignes sur l'entrée standard)."""
    try:
        if a.desactiver_authentification:
            ch08_set_meta(c, "auth_enabled", "0")
            with _wlock:
                c.execute("DELETE FROM auth_session")
                c.commit()
            print("Ouverture de session par mot de passe DÉSACTIVÉE (base : %s) : les postes reviennent à « Qui utilise ce poste ? »." % DB_PATH)
        if a.mot_de_passe:
            u = ch08_user(c, a.mot_de_passe)
            if not u or a.mot_de_passe == "mayday":
                sys.exit("Compte introuvable (le nom d'utilisateur distingue majuscules et minuscules).")
            lire = getpass.getpass if sys.stdin.isatty() else (lambda p: (sys.stdin.readline() or "").rstrip("\r\n"))
            p1, p2 = lire("Nouveau mot de passe : "), lire("Confirmation : ")
            if not ch08_new_ok(p1, p2):
                sys.exit("Le nouveau mot de passe n'est pas valable (8 caractères au moins, saisis deux fois à l'identique).")
            ch08_set_pw(c, u["ID"], p1)
            n = ch08_revoke(c, u["ID"], "mdp")
            print("Mot de passe enregistré pour le compte %s ; %d session(s) fermée(s)." % (u["ID"], n))
    finally:
        c.close()
# ── fin CH-08 lot 4 ──


def js(v):
    return json.dumps(v, ensure_ascii=False, separators=(",", ":"))


def db():
    c = sqlite3.connect(DB_PATH, timeout=30)
    c.execute("PRAGMA journal_mode=WAL")
    c.execute("PRAGMA synchronous=NORMAL")
    return c


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    c = db()
    c.executescript("""
    CREATE TABLE IF NOT EXISTS rec(t TEXT NOT NULL, id TEXT NOT NULL, val TEXT, seq INTEGER NOT NULL,
                                   who TEXT, ts TEXT, PRIMARY KEY(t, id));
    CREATE INDEX IF NOT EXISTS rec_seq ON rec(seq);
    CREATE TABLE IF NOT EXISTS meta(name TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE IF NOT EXISTS lock(t TEXT, id TEXT, who TEXT, ts REAL, PRIMARY KEY(t, id));
    CREATE TABLE IF NOT EXISTS auth_pw(appuser_id TEXT PRIMARY KEY, hash TEXT NOT NULL, changed TEXT);
    CREATE TABLE IF NOT EXISTS auth_session(token_hash TEXT PRIMARY KEY, appuser_id TEXT NOT NULL, userid TEXT,
        ip TEXT, ua TEXT, created REAL, last REAL, remember INTEGER, revoked TEXT);
    CREATE TABLE IF NOT EXISTS auth_fail(userid TEXT, ts REAL);
    """)
    c.execute("INSERT OR IGNORE INTO meta VALUES('seq','0')")
    c.commit()
    return c


def cur_seq(c):
    return int(c.execute("SELECT value FROM meta WHERE name='seq'").fetchone()[0])


class Conflict(Exception):
    def __init__(self, items):
        self.items = items


def commit(c, ops, who, check=True):
    """ops = [{t, id, val (objet ou null=supprimé), bseq (séquence lue par le poste, 0 = création)}]."""
    now = datetime.datetime.now().isoformat(timespec="seconds")
    with _wlock:
        if check:
            conflicts = []
            for op in ops:
                if "bseq" not in op:
                    continue
                row = c.execute("SELECT val, seq FROM rec WHERE t=? AND id=?", (op["t"], str(op["id"]))).fetchone()
                cur = row[1] if row else 0
                if cur > int(op["bseq"] or 0):
                    conflicts.append({"t": op["t"], "id": str(op["id"]), "seq": cur,
                                      "val": json.loads(row[0]) if row and row[0] else None})
            if conflicts:
                raise Conflict(conflicts)
        seq = cur_seq(c) + 1
        for op in ops:
            t, i = op["t"], str(op["id"])
            if not re.fullmatch(r"[a-z0-9_]+", t or ""):
                continue
            val = None if op.get("val") is None else js(op["val"])
            c.execute("INSERT INTO rec VALUES(?,?,?,?,?,?) ON CONFLICT(t,id) DO UPDATE SET "
                      "val=excluded.val, seq=excluded.seq, who=excluded.who, ts=excluded.ts",
                      (t, i, val, seq, who, now))
        c.execute("UPDATE meta SET value=? WHERE name='seq'", (str(seq),))
        c.commit()
        return seq


def dump_json(c, since=None, tables=None, exclude=None):
    """{"seq":n,"tables":{t:{id:{"s":seq,"v":{…}|null}}}} — valeurs insérées telles quelles (déjà du JSON).
    tables = seulement celles-ci ; exclude = toutes sauf celles-ci (catalogues lourds chargés à la demande)."""
    seq = cur_seq(c)
    q, args = "SELECT t, id, val, seq FROM rec WHERE ", []
    if since is None:
        q += "val IS NOT NULL"
    else:
        q += "seq>?"; args.append(since)
    if tables:
        q += " AND t IN (%s)" % ",".join("?" * len(tables)); args += tables
    if exclude:
        q += " AND t NOT IN (%s)" % ",".join("?" * len(exclude)); args += exclude
    q += " ORDER BY t"
    out, cur, first = [], None, True
    for t, i, val, s in c.execute(q, args):
        if t != cur:
            out.append(("}," if cur is not None else "") + js(t) + ":{")
            cur, first = t, True
        out.append(("" if first else ",") + js(i) + ":" + ('{"s":%d,"v":%s}' % (s, val) if val is not None else '{"s":%d,"v":null}' % s))
        first = False
    if cur is not None:
        out.append("}")
    return '{"seq":%d,"tables":{%s}}' % (seq, "".join(out))


def new_ids(c, t, n):
    """Identifiants entiers uniques (comme Deltaproject), réservés côté serveur pour tous les postes."""
    with _wlock:
        name = "next_id:" + t
        row = c.execute("SELECT value FROM meta WHERE name=?", (name,)).fetchone()
        if row:
            nxt = int(row[0])
        else:
            mx = 0
            for (i,) in c.execute("SELECT id FROM rec WHERE t=?", (t,)):
                if i.isdigit():
                    mx = max(mx, int(i))
            nxt = mx + 1
        c.execute("INSERT INTO meta VALUES(?,?) ON CONFLICT(name) DO UPDATE SET value=excluded.value", (name, str(nxt + n)))
        c.commit()
        return list(range(nxt, nxt + n))


# ─────────── Reprise des données Deltaproject (sortie de outils_deltaproject/extraire.sh) ───────────
def parse_schema(path):
    types, cur = {}, None
    for line in open(path, encoding="utf-8"):
        m = re.match(r"== APP\.(\w+) ", line)
        if m:
            cur = m.group(1); types[cur] = {}; continue
        m = re.match(r"   (\w+) (\w+)\(", line)
        if m and cur:
            types[cur][m.group(1)] = m.group(2)
    return types


def conv(v, ty):
    if v == "" or v is None:
        return None
    if ty in ("INTEGER", "SMALLINT", "BIGINT"):
        return int(v)
    if ty in ("DOUBLE", "DECIMAL", "REAL", "FLOAT", "NUMERIC"):
        return float(v)
    if v.startswith("<blob "):
        return None
    return v


def import_deltaproject(c, folder, force=False):
    schema = parse_schema(os.path.join(folder, "schema.txt"))
    have = c.execute("SELECT COUNT(*) FROM rec").fetchone()[0]
    if have and not force:
        sys.exit("La base DeltaSub contient déjà des données — ajoutez --force pour les REMPLACER par cette extraction.")
    with _wlock:   # anciennes lignes → « supprimées » (et non effacées) : les postes ouverts le voient via /api/changes
        seq = cur_seq(c) + 1
        prot = sorted(PROTECTED)
        # eCCC lot 0 : kept2 calculé AVANT l'UPDATE, qui remplace « who » par IMPORT_WHO (spec_12 § 2.12.3)
        pie = sorted(PROTECTED_IF_EDITED | CH08_PIT)   # CH-08 : utilisateurs, droits, réglages touchés dans DeltaSub
        kept2 = _batiment_edites(c)
        c.execute("UPDATE rec SET val=NULL, seq=?, who='import Deltaproject' WHERE val IS NOT NULL AND t NOT IN (%s)"
                  " AND NOT (t IN (%s) AND COALESCE(who,'')<>?)" % (",".join("?" * len(prot)), ",".join("?" * len(pie))),
                  (seq, *prot, *pie, IMPORT_WHO))
        c.execute("UPDATE meta SET value=? WHERE name='seq'", (str(seq),))
        c.execute("DELETE FROM meta WHERE name LIKE 'next_id:%%' AND name NOT IN (%s)" % ",".join("?" * len(prot)),
                  tuple("next_id:" + t for t in prot)); c.commit()
    kept = {(t, i) for t, i in c.execute("SELECT t, id FROM rec WHERE val IS NOT NULL AND t IN (%s)"
                                         % ",".join("?" * len(PROTECTED)), tuple(sorted(PROTECTED)))}
    kept |= set(kept2)   # eCCC lot 0 : documents Bâtiment modifiés dans DeltaSub, ni l'en-tête CSV ni le contenu converti ne les remplacent
    kept |= _ch08_touched(c)   # CH-08 : vivants ou supprimés, dernier auteur ≠ import
    conflits = []        # eCCC lot 0 : (t, id, affaire DeltaSub, affaire Deltaproject) — même identifiant, autre document
    total, ntab = 0, 0
    for path in sorted(glob.glob(os.path.join(folder, "tables", "APP.*.csv"))):
        table = os.path.basename(path)[4:-4]
        if table in SKIP_TABLES:
            continue
        if table.lower() in PROTECTED_IF_EDITED:   # eCCC lot 0 : enregistrements pendant la reprise (postes ouverts)
            kept2.update(_batiment_edites(c)); kept |= set(kept2)
        types, skip = schema.get(table, {}), SKIP_COLUMNS.get(table, set())
        ops = []
        with open(path, encoding="utf-8", newline="") as f:
            for row in csv.DictReader(f, delimiter=";"):
                rec = {k: conv(v, types.get(k, "VARCHAR")) for k, v in row.items() if k not in skip}
                rid = rec.get("ID")
                if rid is None:   # tables de liaison sans ID : clé composée
                    rid = "-".join(str(rec[k]) for k in sorted(rec) if k.endswith("_ID"))
                if (table.lower(), str(rid)) in kept:   # déjà saisi / modifié dans DeltaSub : conservé
                    _ch08_warn(table.lower(), str(rid), rec, c)   # CH-08 : collision d'identifiant
                    if (table.lower(), str(rid)) in kept2 and _projet(kept2[(table.lower(), str(rid))]) not in (None, rec.get("PROJECT_ID")):
                        conflits.append((table.lower(), str(rid), _projet(kept2[(table.lower(), str(rid))]), rec.get("PROJECT_ID")))
                    m3 = (table.lower(), str(rid)) in kept2 and _autre_ref(table.lower(), kept2[(table.lower(), str(rid))], rec)   # eCCC lot 3
                    if m3:
                        print("⚠ %s %s NON repris : l'identifiant est déjà pris dans DeltaSub par une autre valeur référentielle (%s)." % (table.lower(), rid, m3))
                    continue
                ops.append({"t": table.lower(), "id": str(rid), "val": rec})
        commit(c, ops, "import Deltaproject", check=False)
        total += len(ops); ntab += 1
    # Documents Bâtiment convertis (devis, contrôles des coûts, planifications) :
    # <dossier>/documents/*.json = {"<collection>": {"<id>": {...}}} (outils_deltaproject/convertir_*.py)
    for path in sorted(glob.glob(os.path.join(folder, "documents", "*.json"))):
        if path.endswith(".rapport.json"):
            continue
        data = json.load(open(path, encoding="utf-8"))
        for coll, items in data.items():
            if not re.fullmatch(r"[a-z0-9_]+", coll) or not isinstance(items, dict):
                continue
            if coll in PROTECTED_IF_EDITED:   # eCCC lot 0 : enregistrements pendant la reprise (postes ouverts)
                kept2.update(_batiment_edites(c)); kept |= set(kept2)
                conflits += [(coll, str(k), _projet(kept2[(coll, str(k))]), _projet(v)) for k, v in items.items()
                             if (coll, str(k)) in kept2 and _projet(kept2[(coll, str(k))]) not in (None, _projet(v))]
            ops = [{"t": coll, "id": str(k), "val": v} for k, v in items.items() if (coll, str(k)) not in kept]
            commit(c, ops, "import Deltaproject", check=False)
            total += len(ops); ntab += 1
    with _wlock:
        c.execute("INSERT INTO meta VALUES('import_deltaproject',?) ON CONFLICT(name) DO UPDATE SET value=excluded.value",
                  (js({"dossier": folder, "le": datetime.datetime.now().isoformat(timespec="seconds"), "tables": ntab, "lignes": total,
                       "conserves": len(kept2), "conservesListe": sorted("%s %s" % x for x in kept2),
                       "conflits": ["%s %s" % x[:2] for x in conflits]}),))
        c.commit()
    print("Reprise Deltaproject : %d tables, %d enregistrements." % (ntab, total))
    if kept2:   # eCCC lot 0
        print("Documents Bâtiment modifiés ou créés dans DeltaSub, conservés tels quels (%d en-têtes ou contenus) : %s%s"
              % (len(kept2), ", ".join("%s %s" % x for x in sorted(kept2)[:20]), "…" if len(kept2) > 20 else ""))
        print("  (pour reprendre un document depuis Deltaproject malgré tout : DELTASUB_REPRENDRE=\"costplanning:<ID> …\")")
    for t, i, a, b in conflits:
        print("⚠ %s %s NON repris : l'identifiant est déjà pris dans DeltaSub par un document de l'affaire %s "
              "(Deltaproject : affaire %s)." % (t, i, a, b))


# ─────────── Sauvegardes ───────────
def backup_loop():
    last = -1
    while True:
        try:
            c = db(); seq = cur_seq(c)
            if seq != last:
                os.makedirs(BACKUP_DIR, exist_ok=True)
                dst = sqlite3.connect(os.path.join(BACKUP_DIR, "deltasub_%s.sqlite" % datetime.datetime.now().strftime("%Y%m%d_%H%M")))
                c.backup(dst); dst.close()
                olds = sorted(x for x in os.listdir(BACKUP_DIR) if x.startswith("deltasub_") and x.endswith(".sqlite"))
                for x in olds[:-48]:
                    os.remove(os.path.join(BACKUP_DIR, x))
                ch03_sauvegarde()   # CH-03 : copie incrémentale des fichiers du dépôt (n'échoue jamais)
                last = seq
            c.close()
        except Exception as e:
            print("Sauvegarde impossible :", e, file=sys.stderr)
        time.sleep(3600)


# ── CH-10 lot 2 (spec_19 § 3.3, § 4.7) ── Fichier ▸ Importer les modèles … (TemplateImport) : POST /api/modeles/zip.
# Corps = octets d'une archive .zip d'anciens modèles DESIGN (<catégorie>/<groupe>/<type>/<nom…>/<langue>/<page>.xml) ; chaque page est lue
# par outils_deltaproject/convertir_modeles.page (même normalisation que la reprise). AUCUNE écriture en base : la page fusionne (jamais
# d'écrasement) et enregistre en un seul DS.commit. Réponse {"pages":[{categorie,groupe,type,nom,ft,langue,page,val}],"ignores":n,"erreurs":n}
# (ft = 4e segment du chemin : NAME du FormTemplate créé par TemplateImport).
CH10_CATEGORIES = {"addressTemplates", "expensesTemplates", "labelTemplates", "managementTemplates",
                   "projectTemplates", "staffTemplates", "timeTemplates"}
CH10_ZIP_MAX = 50 * 1024 * 1024


def ch10_modeles_zip(h):
    import io, zipfile
    n = int(h.headers.get("Content-Length") or 0)
    if n > CH10_ZIP_MAX:
        reste = min(n, 64 * 1024 * 1024)      # corps lu et jeté avant la réponse : sinon le navigateur reçoit une coupure, pas le 413
        while reste > 0:
            b = h.rfile.read(min(reste, 1 << 20))
            if not b:
                break
            reste -= len(b)
        return h._send(413, js({"ok": False, "error": "archive trop volumineuse (50 Mo au plus)"}))
    data = h.rfile.read(n)
    outils = os.path.join(HERE, "outils_deltaproject")
    if outils not in sys.path:
        sys.path.insert(0, outils)
    try:
        import convertir_modeles as cm
    except ImportError:
        return h._send(500, js({"ok": False, "error": "outils_deltaproject/convertir_modeles.py introuvable"}))
    try:
        z = zipfile.ZipFile(io.BytesIO(data))
    except (zipfile.BadZipFile, ValueError):
        return h._send(400, js({"ok": False, "error": "archive .zip illisible"}))
    pages, ign, err = [], 0, 0
    for zi in z.infolist():
        if zi.is_dir():
            continue
        nom = zi.filename
        if not zi.flag_bits & 0x800:          # noms UTF-8 sans l'indicateur (Finder, ditto, zip) : lus en UTF-8 comme ZipInputStream de Java
            try:
                nom = nom.encode("cp437").decode("utf-8")
            except (UnicodeEncodeError, UnicodeDecodeError):
                pass
        p = nom.split("/")
        # catégorie des 7 familles, dossier de langue connu, page .xml ; nom = segments entre le type et la langue (règle du convertisseur)
        if len(p) < 5 or p[0] not in CH10_CATEGORIES or p[-2] not in cm.LANGUES or not p[-1].endswith(".xml") or not all(p[1:3]) or len(p[-1]) <= 4:
            ign += 1          # arrière-plans, images, .DS_Store, __MACOSX, dossier racine « Templates/ » : rien ne les lirait (E10)
            continue
        try:
            with z.open(zi) as f:
                pg = cm.page(f)
        except Exception as e:           # page illisible : comptée, pas bloquante (TemplateImport : erreurs en console)
            pg = None
            print("  ! modèle illisible %s : %s" % (nom, e), file=sys.stderr)
        if not pg:
            err += 1
            continue
        pages.append({"categorie": p[0], "groupe": p[1], "type": p[2], "nom": "/".join(p[3:-2]), "ft": p[3],
                      "langue": cm.LANGUES[p[-2]], "page": p[-1][:-4], "val": pg})
    return h._send(200, js({"ok": True, "pages": pages, "ignores": ign, "erreurs": err}))
# ── fin CH-10 lot 2 ──


# ── CH-03 ── Dépôt de fichiers, génération et outils PDF (spec_17 § 3.1, § 4, § 5) ─────────────────────────────────────────
# Contenus rangés par empreinte dans dirname(DB_PATH)/fichiers/objets/<2>/<sha256> (écriture atomique, déduplication) ; tmp/ =
# fichiers de travail et aperçus, purgé après 24 h. L'arborescence visible est la collection « depotfichier », écrite par les
# postes (DS.commit) et protégée au ré-import. PDF : Chrome déjà installé, sans fenêtre ; fusion et superposition : PDFKit et
# Quartz de macOS (osascript -l JavaScript). Réseau local seulement (lan_ok) ; session : contrôle de CH-08 lot 4 placé en tête
# de do_GET et de do_POST (spec_18 arbitrage 26, S8, S9), donc avant ces routes ; ce bloc ne l'appelle pas lui-même.
import hashlib, pathlib, plistlib, secrets, shutil, signal, subprocess, unicodedata
import html as _ch03_html
from urllib.parse import quote as _ch03_quote

CH03_FICHIERS = os.path.join(os.path.dirname(DB_PATH), "fichiers")
CH03_OBJETS = os.path.join(CH03_FICHIERS, "objets")
CH03_TMP = os.path.join(CH03_FICHIERS, "tmp")
# copie incrémentale des contenus : au bureau à côté des copies horaires de la base ; base d'essai (DELTASUB_DB) : à côté
# de la base, jamais dans la sauvegarde du bureau (BACKUP_DIR dérive du dossier du script, pas de la base)
CH03_SAUV = (os.path.join(os.path.dirname(DB_PATH), "Sauvegarde DeltaSub", "fichiers") if os.environ.get("DELTASUB_DB")
             else os.path.join(BACKUP_DIR, "fichiers"))
CH03_MAX = 25 << 20          # 25 Mo par fichier
CH03_HTML_MAX = 16 << 20     # 16 Mo de HTML pour /api/pdf
CH03_LIBRE = 2 << 30         # 2 Go libres au minimum sur le disque du dépôt
CH03_VIDANGE = 64 << 20      # corps refusé : lu et jeté jusqu'à 64 Mo, pour que le poste reçoive la réponse
CH03_ATTENTE = 60            # secondes : attente de Chrome (un seul à la fois) puis 503, et délai de génération puis 504
CH03_POST = {"/api/file", "/api/pdf", "/api/file/fusion", "/api/file/superposer"}
_CH03_PK = lambda b: b.startswith(b"PK\x03\x04")
# extension → (type MIME, affiché dans le navigateur, contrôle de la signature ou None) ; EC-2 lot 4 pourra allonger la liste
CH03_TYPES = {
    "pdf": ("application/pdf", True, lambda b: b"%PDF-" in b[:1024]),
    "png": ("image/png", True, lambda b: b.startswith(b"\x89PNG")),
    "jpg": ("image/jpeg", True, lambda b: b.startswith(b"\xff\xd8\xff")),
    "jpeg": ("image/jpeg", True, lambda b: b.startswith(b"\xff\xd8\xff")),
    "gif": ("image/gif", True, lambda b: b.startswith(b"GIF8")),
    "dpdoc": ("application/zip", False, _CH03_PK),
    "zip": ("application/zip", False, _CH03_PK),
    "docx": ("application/vnd.openxmlformats-officedocument.wordprocessingml.document", False, _CH03_PK),
    "xlsx": ("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", False, _CH03_PK),
    "csv": ("text/csv", False, None),
    "txt": ("text/plain", False, None),
    "doc": ("application/msword", False, None),
    "xls": ("application/vnd.ms-excel", False, None),
}
CH03_MSG = {   # messages exacts (spec_17 § 3.1)
    "sha": "Empreinte invalide.", "absent": "Fichier introuvable dans le dépôt.", "apercu": "Aperçu expiré.",
    "nom": "Nom de fichier invalide.", "gros": "Fichier trop volumineux (25 Mo au plus).", "type": "Type de fichier refusé.",
    "disque": "Espace disque insuffisant sur le Mac Studio.", "vide": "Document vide.",
    "html": "Document trop volumineux (16 Mo au plus).",
    "chrome": "Génération des PDF indisponible : Chrome introuvable sur le Mac Studio.",
    "occupe": "Serveur occupé, réessayez.", "delai": "La génération du PDF a échoué (délai dépassé).",
    "fusion": "Fusion impossible : un des fichiers est illisible ou protégé.", "outils": "Outils PDF de macOS indisponibles.",
    "annexes": "Annexes externes non autorisées sur ce serveur (réglage DELTASUB_ANNEXES).",
    "ref": "Le fichier {0} n'existe pas.",   # rsrc Strings|msgFileNotFound (^0 = chemin)
}
# navigateurs de type Chrome, dans l'ordre (DELTASUB_CHROME d'abord) ; relus à chaque démarrage (Chrome se met à jour seul)
CH03_CHROMES = ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                os.path.expanduser("~/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
                "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
                "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
                "/Applications/Chromium.app/Contents/MacOS/Chromium"]
CH03_OSASCRIPT = "/usr/bin/osascript"
# politique de sécurité du HTML envoyé à Chrome : scripts, réseau, cadres et fichiers locaux coupés ; polices local() permises
CH03_CSP = ('<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; '
            'img-src data:; style-src \'unsafe-inline\'; font-src data:">')
_CH03_DOCTYPE = re.compile(r"(?i)^\ufeff?(?:[\t\n\f\r ]|<!--(?!-?>)[^>]*?-->)*<!doctype[^>]*>")
_CH03_REFRESH = re.compile(r"""(?is)<meta\b[^>]*http-equiv\s*=\s*["']?\s*refresh[^>]*>""")
_CH03_META = re.compile(r"""(?is)<meta\b(?:[^>"']|"[^"]*"|'[^']*')*>""")
_CH03_REFRESH2 = re.compile(r"""(?is)http-equiv\s*=\s*["']?\s*refresh""")
# toute autre balise <meta> du document devient un <link> inerte : le début d'une balise se reconnaît sans ambiguïté (« <meta »
# suivi d'un blanc, « / » ou « > »), alors que sa fin dépend des guillemets (<meta a=b" http-equiv=&#114;efresh …> échappait
# aux deux expressions ci-dessus et Chrome suivait le refresh : 504 au lieu d'un PDF)
_CH03_METATAG = re.compile(r"(?i)<meta(?=[\t\n\f\r />])")
_ch03_pdflock = threading.Lock()   # un seul Chrome à la fois
_ch03_moteur = {}                   # cache de ch03_chrome()

# Outils PDF de macOS : pages <f…> ; fusion <sortie> <f1> <f2>… ; superposer <sortie> <base> <calque> (page 1 du calque sur la
# dernière page de la base). Superposition : seule la dernière page est redessinée par Quartz (base + calque, même MediaBox), puis
# remise par PDFKit à sa place avec la rotation, la CropBox et les annotations d'origine ; les autres pages restent intactes
# (comme PDFBox en mode APPEND dans l'original ; redessiner toutes les pages perdait /Rotate, liens et annotations).
# Pièges mesurés (spec_17 § 5.5) : CGPDFDocumentGetNumberOfPages rend une chaîne ; la boîte se passe en données (4 doubles
# little-endian en base64) sous la clé « MediaBox ».
CH03_JXA = r"""ObjC.import('Quartz'); ObjC.import('CoreGraphics');
function doc(p){ const d=$.PDFDocument.alloc.initWithURL($.NSURL.fileURLWithPath(p)); if(!d||d.isNil()) throw new Error('illisible'); if(d.isLocked) throw new Error('protégé'); return d; }
function boite(r){ const b=new ArrayBuffer(32), v=new DataView(b); [r.origin.x,r.origin.y,r.size.width,r.size.height].forEach((x,i)=>v.setFloat64(i*8,+x,true));
  const u=new Uint8Array(b), A='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'; let s='';
  for(let i=0;i<u.length;i+=3){ const n=(u[i]<<16)|((u[i+1]||0)<<8)|(u[i+2]||0); s+=A[n>>18&63]+A[n>>12&63]+(i+1<u.length?A[n>>6&63]:'=')+(i+2<u.length?A[n&63]:'='); }
  return $.NSData.alloc.initWithBase64EncodedStringOptions($(s),0); }
function run(argv){ const op=argv[0];
  if(op==='pages') return argv.slice(1).map(p=>{ try{ return String(doc(p).pageCount); }catch(e){ return ''; } }).join('\n');
  if(op==='fusion'){ const out=argv[1], ins=argv.slice(2), R=doc(ins[0]);
    for(let i=1;i<ins.length;i++){ const d=doc(ins[i]); for(let k=0;k<d.pageCount;k++) R.insertPageAtIndex(d.pageAtIndex(k), R.pageCount); }
    if(!R.writeToFile(out)) throw new Error('écriture impossible'); return String(R.pageCount); }
  if(op==='superposer'){ const out=argv[1], base=argv[2], cal=argv[3], R=doc(base); doc(cal);
    const B=$.CGPDFDocumentCreateWithURL($.NSURL.fileURLWithPath(base)), O=$.CGPDFDocumentCreateWithURL($.NSURL.fileURLWithPath(cal));
    const n=+$.CGPDFDocumentGetNumberOfPages(B); if(!(n>0)||+R.pageCount!==n||!(+$.CGPDFDocumentGetNumberOfPages(O)>0)) throw new Error('illisible');
    const der=out+'.der.pdf', pg=$.CGPDFDocumentGetPage(B,n), r=$.CGPDFPageGetBoxRect(pg,$.kCGPDFMediaBox);
    const ctx=$.CGPDFContextCreateWithURL($.NSURL.fileURLWithPath(der), null, null);
    $.CGPDFContextBeginPage(ctx, $.NSDictionary.dictionaryWithObjectForKey(boite(r), $('MediaBox')));
    $.CGContextDrawPDFPage(ctx,pg); $.CGContextDrawPDFPage(ctx,$.CGPDFDocumentGetPage(O,1));
    $.CGPDFContextEndPage(ctx); $.CGPDFContextClose(ctx);
    const L=doc(der), np=L.pageAtIndex(0), vp=R.pageAtIndex(n-1), an=vp.annotations;
    np.rotation=vp.rotation; np.setBoundsForBox(vp.boundsForBox($.kPDFDisplayBoxCropBox), $.kPDFDisplayBoxCropBox);
    for(let i=+an.count-1;i>=0;i--){ const a=an.objectAtIndex(i); vp.removeAnnotation(a); np.addAnnotation(a); }
    R.insertPageAtIndex(np, n); R.removePageAtIndex(n-1);
    const ok=R.writeToFile(out); $.NSFileManager.defaultManager.removeItemAtPathError($(der), null);
    if(!ok) throw new Error('écriture impossible'); return String(R.pageCount); }
  throw new Error('opération inconnue'); }"""


class CH03_Erreur(Exception):
    """Refus d'une route de fichiers : code HTTP et message exact (spec_17 § 3.1)."""
    def __init__(self, code, msg):
        Exception.__init__(self, msg)
        self.code = code


def _ch03_dossiers():
    os.makedirs(CH03_OBJETS, exist_ok=True)
    os.makedirs(CH03_TMP, exist_ok=True)


def _ch03_objet(sha):
    return os.path.join(CH03_OBJETS, sha[:2], sha)


def _ch03_sha(sha):
    sha = (sha or "").lower()
    if not re.fullmatch(r"[0-9a-f]{64}", sha):
        raise CH03_Erreur(400, CH03_MSG["sha"])
    return sha


def _ch03_existant(sha):
    p = _ch03_objet(_ch03_sha(sha))
    if not os.path.isfile(p):
        raise CH03_Erreur(404, CH03_MSG["absent"])
    return p


def _ch03_libre():
    _ch03_dossiers()
    if shutil.disk_usage(CH03_FICHIERS).free < CH03_LIBRE:
        raise CH03_Erreur(507, CH03_MSG["disque"])


def ch03_nom(nom):
    """Nom de fichier accepté par le serveur (§ 4.4, § 4.5) → (nom NFC, extension) ; 400 ou 415 sinon."""
    nom = unicodedata.normalize("NFC", nom or "")
    if (not nom or len(nom) > 128 or "/" in nom or "\\" in nom or nom.startswith(".")
            or any(unicodedata.category(ch) == "Cc" for ch in nom)):
        raise CH03_Erreur(400, CH03_MSG["nom"])
    ext = nom.rsplit(".", 1)[1].lower() if "." in nom else ""
    if ext not in CH03_TYPES:
        raise CH03_Erreur(415, CH03_MSG["type"])
    return nom, ext


def _ch03_purger():
    """tmp/ : fichiers et profils de plus de 24 h (aperçus expirés, restes d'un arrêt brutal)."""
    lim = time.time() - 86400
    try:
        noms = os.listdir(CH03_TMP)
    except OSError:
        return
    for n in noms:
        p = os.path.join(CH03_TMP, n)
        try:
            if os.lstat(p).st_mtime < lim:
                if os.path.isdir(p) and not os.path.islink(p):
                    shutil.rmtree(p, ignore_errors=True)
                else:
                    os.remove(p)
        except OSError:
            pass


def _ch03_empreinte(p):
    h, n = hashlib.sha256(), 0
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b); n += len(b)
    return h.hexdigest(), n


def _ch03_ranger(tmp, sha):
    """Fichier de travail → objets/<2>/<sha> : renommage atomique ; contenu déjà présent : rien n'est réécrit."""
    dst = _ch03_objet(sha)
    if os.path.isfile(dst):
        os.remove(tmp)
        return dst
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    os.replace(tmp, dst)
    return dst


def _ch03_resultat(tmp, pages):
    sha, taille = _ch03_empreinte(tmp)
    _ch03_ranger(tmp, sha)
    return {"sha": sha, "taille": taille, "pages": pages}


def ch03_outils_ok():
    return sys.platform == "darwin" and os.path.isfile(CH03_OSASCRIPT)


def ch03_outil(op, sortie, entrees):
    """CH03_JXA par osascript → texte rendu ; 503 sans osascript, 422 si un fichier est illisible ou protégé."""
    if not ch03_outils_ok():
        raise CH03_Erreur(503, CH03_MSG["outils"])
    args = [CH03_OSASCRIPT, "-l", "JavaScript", "-e", CH03_JXA, op] + ([sortie] if sortie else []) + list(entrees)
    try:
        r = subprocess.run(args, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
    except (OSError, subprocess.TimeoutExpired):
        raise CH03_Erreur(422, CH03_MSG["fusion"])
    if r.returncode != 0:
        raise CH03_Erreur(422, CH03_MSG["fusion"])
    return r.stdout.decode("utf-8", "replace").strip()


def ch03_pages(p):
    """Nombre de pages d'un PDF (PDFKit), None s'il est illisible ou si les outils manquent."""
    try:
        n = ch03_outil("pages", None, [p])
    except CH03_Erreur:
        return None
    return int(n) if n.isdigit() else None


def _ch03_version(chemin):
    try:   # Info.plist de l'application : rien n'est lancé
        with open(os.path.join(os.path.dirname(os.path.dirname(chemin)), "Info.plist"), "rb") as f:
            v = plistlib.load(f).get("CFBundleShortVersionString")
        if v:
            return str(v)
    except Exception:
        pass
    try:
        r = subprocess.run([chemin, "--version"], stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                           stderr=subprocess.DEVNULL, timeout=20)
        m = re.search(r"\d+(?:\.\d+)+", r.stdout.decode("utf-8", "replace"))
        return m.group(0) if m else "?"
    except Exception:
        return "?"


def ch03_chrome():
    """(chemin, version) du navigateur de type Chrome de ce Mac, cherché une fois ; (None, None) s'il manque."""
    if "chrome" not in _ch03_moteur:
        chemin = next((p for p in [os.environ.get("DELTASUB_CHROME")] + CH03_CHROMES
                       if p and os.path.isfile(p) and os.access(p, os.X_OK)), None)
        _ch03_moteur.update(chrome=chemin, version=_ch03_version(chemin) if chemin else None)
    return _ch03_moteur["chrome"], _ch03_moteur["version"]


def ch03_info():
    """Ligne d'information au démarrage du serveur."""
    chemin, version = ch03_chrome()
    try:
        _ch03_dossiers()
    except OSError as e:
        return "Fichiers : %s — dossier impossible à créer (%s)" % (CH03_FICHIERS, e)
    return "Fichiers : %s — PDF : %s" % (CH03_FICHIERS, "Chrome " + version if chemin else "impression du navigateur")


def ch03_nettoyer_html(html):
    """Balises <meta http-equiv=refresh> retirées, toute autre <meta> rendue inerte ; politique CSP juste après le doctype de tête
    (après BOM, blancs et commentaires), sinon tout au début — jamais après <head> : un iframe placé avant <head> y échappait
    (spec_17 § 1 n° 22)."""
    html = _CH03_REFRESH.sub("", html)
    html = _CH03_META.sub(lambda m: "" if _CH03_REFRESH2.search(_ch03_html.unescape(m.group(0))) else m.group(0), html)
    html = _CH03_METATAG.sub("<link", html)   # balises <meta> restantes (charset, viewport…) : inertes ; la politique reste la seule <meta>
    m = _CH03_DOCTYPE.match(html)
    k = m.end() if m else (1 if html.startswith("\ufeff") else 0)
    return html[:k] + CH03_CSP + html[k:]


def _ch03_complet(pdf):
    try:
        with open(pdf, "rb") as f:
            f.seek(0, 2); n = f.tell()
            if n < 16:
                return False
            f.seek(max(0, n - 1024))
            return f.read().rstrip().endswith(b"%%EOF")
    except OSError:
        return False


def _ch03_arreter(p):
    """Chrome ne s'arrête pas seul après l'écriture : SIGTERM à tout son groupe de processus, SIGKILL à ce qui vit encore
    après 3 s ; rend quand le groupe a disparu (au plus 5 s), pour que le profil jetable puisse être effacé."""
    fin = time.time() + 3
    for sig in (signal.SIGTERM, signal.SIGKILL):
        try:
            os.killpg(p.pid, sig)
        except OSError:
            pass
        while time.time() < fin:
            p.poll()
            try:
                os.killpg(p.pid, 0)   # reste-t-il un processus du groupe ?
            except OSError:
                return
            time.sleep(0.05)
        fin = time.time() + 2
    try:
        p.wait(1)
    except subprocess.TimeoutExpired:
        pass


def _ch03_imprimer(html, jeton, chrome, delai=None):
    """HTML (déjà nettoyé) → tmp/<jeton>.pdf par Chrome sans fenêtre, profil jetable ; 504 si rien n'est écrit à temps."""
    src, pdf = os.path.join(CH03_TMP, jeton + ".html"), os.path.join(CH03_TMP, jeton + ".pdf")
    prof, p, ok = os.path.join(CH03_TMP, "chrome-" + jeton), None, False
    with open(src, "w", encoding="utf-8") as f:
        f.write(html)
    try:
        p = subprocess.Popen([chrome, "--headless", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
                              "--disable-extensions", "--disable-background-networking", "--disable-sync",
                              "--disable-component-update", "--use-mock-keychain", "--password-store=basic",
                              "--no-pdf-header-footer", "--user-data-dir=" + prof, "--print-to-pdf=" + pdf,
                              pathlib.Path(src).as_uri()],
                             stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                             start_new_session=True)
        fin = time.time() + (delai or CH03_ATTENTE)
        while time.time() < fin:
            if _ch03_complet(pdf):
                ok = True; break
            if p.poll() is not None:
                ok = _ch03_complet(pdf); break
            time.sleep(0.05)
    except OSError:
        ok = False
    finally:
        if p is not None:
            _ch03_arreter(p)
        for _ in range(10):   # profil jetable : un sous-processus peut encore y écrire en se terminant
            shutil.rmtree(prof, ignore_errors=True)
            if not os.path.exists(prof):
                break
            time.sleep(0.1)
        for x in ((src,) if ok else (src, pdf)):
            try:
                os.remove(x)
            except OSError:
                pass
    if not ok:
        raise CH03_Erreur(504, CH03_MSG["delai"])
    return pdf


def ch03_pdf(html, apercu=False):
    """HTML complet → PDF (spec_17 § 5.3) : {sha, taille, pages} rangé dans objets/, ou {apercu, taille, pages} laissé dans tmp/."""
    if not isinstance(html, str) or not html.strip():
        raise CH03_Erreur(400, CH03_MSG["vide"])
    b = html.encode("utf-8", "replace")   # demi-paire UTF-16 isolée (texte coupé par slice au milieu d'un émoji) : « ? », pas un 500
    if len(b) > CH03_HTML_MAX:
        raise CH03_Erreur(413, CH03_MSG["html"])
    html = b.decode("utf-8")
    chrome, _ = ch03_chrome()
    if not chrome:
        raise CH03_Erreur(503, CH03_MSG["chrome"])
    _ch03_libre(); _ch03_purger()
    if not _ch03_pdflock.acquire(timeout=CH03_ATTENTE):
        raise CH03_Erreur(503, CH03_MSG["occupe"])
    try:
        jeton = secrets.token_hex(16)
        pdf = _ch03_imprimer(ch03_nettoyer_html(html), jeton, chrome)
    finally:
        _ch03_pdflock.release()
    pages = ch03_pages(pdf)
    if apercu:
        return {"apercu": jeton, "taille": os.path.getsize(pdf), "pages": pages}
    return _ch03_resultat(pdf, pages)


def _ch03_assembler(op, chemins):
    """Fusion ou superposition par CH03_JXA → {sha, taille, pages} ; 422 si le résultat manque."""
    _ch03_libre()
    sortie = os.path.join(CH03_TMP, secrets.token_hex(16) + ".pdf")
    try:
        n = ch03_outil(op, sortie, chemins)
        if not _ch03_complet(sortie):
            raise CH03_Erreur(422, CH03_MSG["fusion"])
        return _ch03_resultat(sortie, int(n) if n.isdigit() else ch03_pages(sortie))
    finally:
        for x in (sortie, sortie + ".der.pdf"):   # .der.pdf : dernière page redessinée (superposition), normalement déjà effacée
            if os.path.exists(x):
                os.remove(x)


def ch03_fusion(shas):
    """Pages des PDF dans l'ordre donné (au moins deux empreintes)."""
    if not isinstance(shas, list) or len(shas) < 2 or not all(isinstance(s, str) for s in shas):
        raise CH03_Erreur(400, CH03_MSG["sha"])
    return _ch03_assembler("fusion", [_ch03_existant(s) for s in shas])


def ch03_superposer(base, calque):
    """Page 1 du calque dessinée par-dessus la dernière page de la base (fond du calque transparent : rien n'est masqué)."""
    if not isinstance(base, str) or not isinstance(calque, str):
        raise CH03_Erreur(400, CH03_MSG["sha"])
    return _ch03_assembler("superposer", [_ch03_existant(base), _ch03_existant(calque)])


def ch03_sauvegarde():
    """Copie des contenus absents de CH03_SAUV/objets (contenus immuables) et purge de tmp/ ; n'échoue jamais."""
    try:
        _ch03_purger()
        if not os.path.isdir(CH03_OBJETS):
            return 0
        n = 0
        for d in sorted(os.listdir(CH03_OBJETS)):
            sd = os.path.join(CH03_OBJETS, d)
            if len(d) != 2 or not os.path.isdir(sd):
                continue
            for s in os.listdir(sd):
                dst = os.path.join(CH03_SAUV, "objets", d, s)
                if not re.fullmatch(r"[0-9a-f]{64}", s) or os.path.exists(dst):
                    continue
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.copyfile(os.path.join(sd, s), dst + ".part")
                os.replace(dst + ".part", dst)
                n += 1
        return n
    except Exception as e:
        print("Sauvegarde des fichiers impossible :", e, file=sys.stderr)
        return -1


def _ch03_envoyer(h, chemin, nom, dl, cache):
    """Octets d'un fichier, lus par blocs, jamais compressés ; inline (pdf, images) ou attachment ; nom en filename*=UTF-8''."""
    ext = nom.rsplit(".", 1)[1].lower() if "." in nom else ""
    ctype, inline, _ = CH03_TYPES.get(ext, ("application/octet-stream", False, None))
    try:
        f = open(chemin, "rb")
    except OSError:
        raise CH03_Erreur(404, CH03_MSG["absent"])
    with f:
        h.send_response(200)
        h.send_header("Content-Type", ctype)
        h.send_header("Content-Length", str(os.fstat(f.fileno()).st_size))
        h.send_header("Content-Disposition", "%s; filename*=UTF-8''%s"
                      % ("inline" if inline and not dl else "attachment", _ch03_quote(nom, safe="")))
        h.send_header("Cache-Control", cache)
        h.send_header("X-Content-Type-Options", "nosniff")
        h.end_headers()
        try:
            for b in iter(lambda: f.read(1 << 18), b""):
                h.wfile.write(b)
        except (BrokenPipeError, ConnectionResetError):
            pass


def _ch03_ref(h, ref, dl):
    """R8 : annexe externe en lecture seule, seulement sous la racine DELTASUB_ANNEXES (chemin réel, sans « .. »)."""
    racine = os.environ.get("DELTASUB_ANNEXES")
    if not racine:
        raise CH03_Erreur(403, CH03_MSG["annexes"])
    if (not ref or "\x00" in ref or not os.path.isabs(ref)
            or ".." in ref.replace("\\", "/").split("/")):
        raise CH03_Erreur(403, CH03_MSG["annexes"])
    rr, p = os.path.realpath(racine), os.path.realpath(ref)
    if os.path.commonpath([rr, p]) != rr:
        raise CH03_Erreur(403, CH03_MSG["annexes"])
    if not os.path.isfile(p):
        raise CH03_Erreur(404, CH03_MSG["ref"].format(ref))
    return _ch03_envoyer(h, p, os.path.basename(p), dl, "no-store")


def ch03_seq(i):
    """R9 : {seq, supprime} de l'enregistrement « depotfichier » d'identifiant i, supprimé compris (seq 0 : jamais écrit).
    Le snapshot du démarrage omet les enregistrements supprimés (val IS NOT NULL) : un poste chargé après la suppression d'un
    fichier ne connaît pas sa séquence et recréerait le même nom (ID = <DOSSIER>/<NOM>) avec bseq 0, d'où un 409 parasite."""
    c = db()
    try:
        r = c.execute("SELECT val IS NULL, seq FROM rec WHERE t='depotfichier' AND id=?", (str(i),)).fetchone()
    finally:
        c.close()
    return {"seq": int(r[1]) if r else 0, "supprime": bool(r[0]) if r else False}


def ch03_get(h, u, q):
    """R1 (sha), R2 (apercu), R8 (ref), R9 (version) : GET /api/file ; R4 : GET /api/pdf (moteurs, cache du démarrage)."""
    v = lambda k: (q.get(k) or [None])[0]
    try:
        if u.path == "/api/pdf":
            chrome, version = ch03_chrome()
            return h._send(200, js({"ok": True, "chrome": version if chrome else None, "outils": ch03_outils_ok()}))
        if v("version") is not None:
            return h._send(200, js(dict(ok=True, **ch03_seq(v("version")))))
        dl = v("dl") == "1"
        if v("ref") is not None:
            return _ch03_ref(h, v("ref"), dl)
        if v("apercu") is not None:
            jeton = v("apercu") or ""
            p = os.path.join(CH03_TMP, jeton + ".pdf")
            if not re.fullmatch(r"[0-9a-f]{32}", jeton) or not os.path.isfile(p):
                raise CH03_Erreur(404, CH03_MSG["apercu"])
            return _ch03_envoyer(h, p, ch03_nom(v("nom"))[0], dl, "no-store")
        sha = _ch03_sha(v("sha"))
        nom = ch03_nom(v("nom"))[0]
        return _ch03_envoyer(h, _ch03_existant(sha), nom, dl, "private, max-age=31536000, immutable")
    except CH03_Erreur as e:
        return h._send(e.code, js({"ok": False, "error": str(e)}))


def _ch03_longueur(h):
    try:
        return max(0, int(h.headers.get("Content-Length") or 0))
    except ValueError:
        return 0


def _ch03_lire(h, n):
    b = h.rfile.read(n)
    h._ch03_lu += len(b)
    return b


def _ch03_json(h, maxi, code, msg):
    n = _ch03_longueur(h)
    if n > maxi:
        raise CH03_Erreur(code, msg)
    try:
        d = json.loads(_ch03_lire(h, n).decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        d = None
    return d if isinstance(d, dict) else {}


def _ch03_recevoir(h, q):
    """R3 : octets bruts → objets/ (contrôle du nom, de la taille annoncée, de l'espace libre et de la signature)."""
    nom, ext = ch03_nom((q.get("nom") or [None])[0])
    n = _ch03_longueur(h)
    if n > CH03_MAX:
        raise CH03_Erreur(413, CH03_MSG["gros"])   # Content-Length lu avant le corps : rien n'est gardé
    _ch03_libre()
    tmp = os.path.join(CH03_TMP, secrets.token_hex(16) + ".part")
    sha, tete, reste = hashlib.sha256(), b"", n
    try:
        with open(tmp, "wb") as f:
            while reste > 0:
                b = _ch03_lire(h, min(1 << 18, reste))
                if not b:
                    raise CH03_Erreur(400, CH03_MSG["vide"])
                if len(tete) < 1024:
                    tete += b[:1024 - len(tete)]
                sha.update(b); f.write(b); reste -= len(b)
            f.flush(); os.fsync(f.fileno())
        controle = CH03_TYPES[ext][2]
        if controle and not controle(tete):
            raise CH03_Erreur(415, CH03_MSG["type"])
        pages = ch03_pages(tmp) if ext == "pdf" else None
        s = sha.hexdigest()
        _ch03_ranger(tmp, s)
        return {"sha": s, "taille": n, "pages": pages}
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)


def _ch03_vider(h):
    """Corps refusé avant lecture : jeté par blocs (64 Mo au plus) après la réponse, pour que le poste la reçoive."""
    reste = _ch03_longueur(h) - getattr(h, "_ch03_lu", 0)
    if 0 < reste <= CH03_VIDANGE:
        try:
            h.connection.settimeout(10)
            while reste > 0:
                b = h.rfile.read(min(1 << 18, reste))
                if not b:
                    break
                reste -= len(b)
        except OSError:
            pass
    h.close_connection = True


def ch03_post(h, chemin):
    """R3, R5, R6, R7. Le contrôle de session de CH-08 lot 4 (ch08_gate(self, "POST"), première instruction de do_POST,
    spec_18 arbitrage 26) a déjà eu lieu quand il est intégré : il n'est pas rappelé ici (l'appel ch08_gate(h, c, u) de la
    première rédaction de spec_18 lèverait TypeError, donc 500 sur toutes ces routes)."""
    h._ch03_lu = 0
    try:
        if chemin == "/api/file":
            r = _ch03_recevoir(h, parse_qs(urlparse(h.path).query))
        elif chemin == "/api/pdf":
            d = _ch03_json(h, 2 * CH03_HTML_MAX + (1 << 16), 413, CH03_MSG["html"])
            r = ch03_pdf(d.get("html"), bool(d.get("apercu")))
        elif chemin == "/api/file/fusion":
            r = ch03_fusion(_ch03_json(h, 1 << 20, 400, CH03_MSG["sha"]).get("shas"))
        else:
            d = _ch03_json(h, 1 << 20, 400, CH03_MSG["sha"])
            r = ch03_superposer(d.get("base"), d.get("calque"))
        h._send(200, js(dict(ok=True, **r)))
    except CH03_Erreur as e:
        h._send(e.code, js({"ok": False, "error": str(e)}))
    except Exception as e:
        h._send(500, js({"ok": False, "error": "Erreur du serveur : %s" % e}))
    finally:
        _ch03_vider(h)
# ── fin CH-03 ──


# ─────────── HTTP ───────────
def lan_ok(ip):
    try:
        a = ipaddress.ip_address(ip)
        return a.is_private or a.is_loopback or a.is_link_local
    except ValueError:
        return False


class H(BaseHTTPRequestHandler):
    server_version = "DeltaSub/%d" % VERSION

    def log_message(self, fmt, *args):
        if "/api/changes" not in (self.path or ""):
            sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))

    def _send(self, code, body, ctype="application/json; charset=utf-8"):
        b = body.encode("utf-8") if isinstance(body, str) else body
        gz = len(b) > 2048 and "gzip" in (self.headers.get("Accept-Encoding") or "")
        if gz:   # JSON compressé ~10× : chargement rapide des postes en Wi-Fi
            b = gzip.compress(b, 5)
        self.send_response(code)
        if gz:
            self.send_header("Content-Encoding", "gzip")
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(b)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        if not ch08_gate(self, "GET"):
            return   # CH-08 lot 4 : session exigée quand l'ouverture de session est active (première instruction, § 4.20.1)
        if not lan_ok(self.client_address[0]):
            return self._send(403, '{"error":"réseau du bureau uniquement"}')
        u = urlparse(self.path); q = parse_qs(u.query)
        c = db()
        try:
            if u.path == "/api/ping":
                imp = c.execute("SELECT value FROM meta WHERE name='import_deltaproject'").fetchone()
                return self._send(200, js({"ok": True, "seq": cur_seq(c), "version": VERSION,
                                           "import": json.loads(imp[0]) if imp else None, "aide": os.path.isfile(MANUEL_FR), "auth": ch08_auth_on(c)}))
            if u.path == "/api/snapshot":
                tabs = [x for x in (q.get("t") or [""])[0].split(",") if x]
                excl = [x for x in (q.get("x") or [""])[0].split(",") if x]
                return self._send(200, dump_json(c, None, tabs or None, excl or None))
            if u.path == "/api/changes":
                return self._send(200, dump_json(c, int((q.get("since") or ["0"])[0])))
            if u.path == "/api/ids":
                return self._send(200, js(new_ids(c, (q.get("t") or [""])[0], int((q.get("n") or ["1"])[0]))))
            if u.path == "/aide/manual_fr.pdf":
                return _ch08_manual(self)   # CH-08
            if u.path in ("/api/file", "/api/pdf"):   # CH-03 : fichiers du dépôt, moteurs PDF
                return ch03_get(self, u, q)
            f = STATIC.get(u.path)
            if f and os.path.exists(os.path.join(HERE, f)):
                with open(os.path.join(HERE, f), "rb") as fh:
                    return self._send(200, fh.read(), "text/html; charset=utf-8")
            self._send(404, '{"error":"introuvable"}')
        finally:
            c.close()

    def do_POST(self):
        if not ch08_gate(self, "POST"):
            return   # CH-08 lot 4 : session exigée quand l'ouverture de session est active (première instruction, § 4.20.1)
        if not lan_ok(self.client_address[0]):
            return self._send(403, '{"error":"réseau du bureau uniquement"}')
        if urlparse(self.path).path == "/api/modeles/zip":
            return ch10_modeles_zip(self)   # CH-10 lot 2
        if urlparse(self.path).path in CH03_POST:   # CH-03 : dépôt, génération, fusion, superposition
            return ch03_post(self, urlparse(self.path).path)
        if urlparse(self.path).path != "/api/commit":
            return self._send(404, '{"error":"introuvable"}')
        c = db()
        try:
            body = json.loads(self.rfile.read(int(self.headers.get("Content-Length") or 0)).decode("utf-8"))
            who = ch08_who(self, c, body)   # CH-08 : session ou identité déclarée ; règles du § 4.20.3 ; None = 403 déjà envoyé
            if who is None:
                return
            seq = commit(c, body.get("ops") or [], who)
            ch08_after_commit(c, body.get("ops") or [])
            self._send(200, js({"ok": True, "seq": seq}))
        except Conflict as e:
            self._send(409, js({"ok": False, "conflicts": e.items}))
        except Exception as e:
            self._send(400, js({"ok": False, "error": str(e)}))
        finally:
            c.close()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--importer-deltaproject", metavar="DOSSIER_EXTRACTION")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--port", type=int, default=PORT)
    ap.add_argument("--desactiver-authentification", action="store_true",
                    help="CH-08 : revenir au mode sans mot de passe (« Qui utilise ce poste ? ») ; secours")
    ap.add_argument("--mot-de-passe", metavar="USERID",
                    help="CH-08 : définir le mot de passe d'un compte (demandé deux fois) ; ses sessions sont fermées")
    a = ap.parse_args()
    c = init_db()
    if a.desactiver_authentification or a.mot_de_passe:
        return ch08_cli(c, a)   # CH-08 lot 4 : commandes locales du Mac Studio (§ 4.20.4)
    if a.importer_deltaproject:
        return import_deltaproject(c, a.importer_deltaproject, a.force)
    c.close()
    threading.Thread(target=backup_loop, daemon=True).start()
    srv = ThreadingHTTPServer(("0.0.0.0", a.port), H)
    print("DeltaSub — http://%s.local:%d/   (base : %s)" % (os.uname().nodename.split(".")[0], a.port, DB_PATH))
    print(ch03_info())   # CH-03
    srv.serve_forever()


if __name__ == "__main__":
    main()

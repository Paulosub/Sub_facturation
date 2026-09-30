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

# ── eCCC lot 0 (spec_12 § 2.12.3) ── Documents Bâtiment : un document MODIFIÉ ou CRÉÉ dans DeltaSub (dernier auteur ≠
# IMPORT_WHO) est conservé au ré-import (--force) ; un document encore tel qu'importé est remplacé par sa nouvelle
# conversion (ex. planifications v1 → v2). S'applique à l'en-tête (…document) et au contenu, chacun pour son compte.
# Reprise forcée (facultatif) : DELTASUB_REPRENDRE="costplanning:202 costcontrol:3601" remplace ces documents (en-tête
# et contenu) par la version Deltaproject même s'ils ont été modifiés dans DeltaSub (ex. planification restée en v1).
IMPORT_WHO = "import Deltaproject"
PROTECTED_IF_EDITED = {"costplanningdocument", "costplanning", "costestimatedocument", "costestimate",
                       "costcontroldocument", "costcontrol"}


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
        pie = sorted(PROTECTED_IF_EDITED)
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
                    if (table.lower(), str(rid)) in kept2 and _projet(kept2[(table.lower(), str(rid))]) not in (None, rec.get("PROJECT_ID")):
                        conflits.append((table.lower(), str(rid), _projet(kept2[(table.lower(), str(rid))]), rec.get("PROJECT_ID")))
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
                last = seq
            c.close()
        except Exception as e:
            print("Sauvegarde impossible :", e, file=sys.stderr)
        time.sleep(3600)


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
        if not lan_ok(self.client_address[0]):
            return self._send(403, '{"error":"réseau du bureau uniquement"}')
        u = urlparse(self.path); q = parse_qs(u.query)
        c = db()
        try:
            if u.path == "/api/ping":
                imp = c.execute("SELECT value FROM meta WHERE name='import_deltaproject'").fetchone()
                return self._send(200, js({"ok": True, "seq": cur_seq(c), "version": VERSION,
                                           "import": json.loads(imp[0]) if imp else None}))
            if u.path == "/api/snapshot":
                tabs = [x for x in (q.get("t") or [""])[0].split(",") if x]
                excl = [x for x in (q.get("x") or [""])[0].split(",") if x]
                return self._send(200, dump_json(c, None, tabs or None, excl or None))
            if u.path == "/api/changes":
                return self._send(200, dump_json(c, int((q.get("since") or ["0"])[0])))
            if u.path == "/api/ids":
                return self._send(200, js(new_ids(c, (q.get("t") or [""])[0], int((q.get("n") or ["1"])[0]))))
            f = STATIC.get(u.path)
            if f and os.path.exists(os.path.join(HERE, f)):
                with open(os.path.join(HERE, f), "rb") as fh:
                    return self._send(200, fh.read(), "text/html; charset=utf-8")
            self._send(404, '{"error":"introuvable"}')
        finally:
            c.close()

    def do_POST(self):
        if not lan_ok(self.client_address[0]):
            return self._send(403, '{"error":"réseau du bureau uniquement"}')
        if urlparse(self.path).path != "/api/commit":
            return self._send(404, '{"error":"introuvable"}')
        c = db()
        try:
            body = json.loads(self.rfile.read(int(self.headers.get("Content-Length") or 0)).decode("utf-8"))
            seq = commit(c, body.get("ops") or [], str(body.get("who") or self.client_address[0])[:80])
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
    a = ap.parse_args()
    c = init_db()
    if a.importer_deltaproject:
        return import_deltaproject(c, a.importer_deltaproject, a.force)
    c.close()
    threading.Thread(target=backup_loop, daemon=True).start()
    srv = ThreadingHTTPServer(("0.0.0.0", a.port), H)
    print("DeltaSub — http://%s.local:%d/   (base : %s)" % (os.uname().nodename.split(".")[0], a.port, DB_PATH))
    srv.serve_forever()


if __name__ == "__main__":
    main()

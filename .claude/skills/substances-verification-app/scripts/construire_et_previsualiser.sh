#!/bin/zsh
# Construit une version de SUBGestion et la copie dans le dossier d'aperçu (isolé : base de test, jamais le Chrome de Paulo).
#   construire_et_previsualiser.sh [3|2|1]        (défaut : 3)
# Copie aussi la base de test la plus récente (deltasub/*.json.gz) sous le nom base_test.json.gz.
set -e
V=${1:-3}
APP=${0:A:h:h:h:h:h}                       # racine du projet (…/.claude/skills/<skill>/scripts → racine)
APERCU=/tmp/subgestion_apercu
case $V in
  1) SRC=subgestion;  OUT=SUBGestion.html ;;
  *) SRC=subgestion$V; OUT=SUBGestion$V.html ;;
esac
cd "$APP"
python3 "$SRC/construire.py"
mkdir -p $APERCU
cp "$OUT" $APERCU/
# Page d'accueil du dossier : le volet d'aperçu de l'app ouvre la racine (http://localhost:7797), pas l'app → renvoi vers l'app.
print -r -- "<!doctype html><html lang=\"fr\"><head><meta charset=\"utf-8\"><title>SUBGestion — aperçu</title><meta http-equiv=\"refresh\" content=\"0; url=$OUT\"></head><body><p><a href=\"$OUT\">Ouvrir $OUT</a></p></body></html>" > $APERCU/index.html
BASE=$(ls -t deltasub/*.json.gz 2>/dev/null | head -1)
[ -n "$BASE" ] && cp "$BASE" $APERCU/base_test.json.gz && echo "Base de test : $BASE"
[ -f subgestion3/affaire_travail/assembler.py ] && python3 -I subgestion3/affaire_travail/assembler.py "$APERCU/affaire_travail.js"   # générateur de l'affaire 99TST : aperçu seulement
echo "Aperçu prêt : $APERCU/$OUT"
# Les deux entrées de .claude/launch.json (fichier propre à chaque poste, hors git) doivent servir ce dossier sur le port 7797 :
# « subgestion-apercu » (celle des skills) et « subgestion » (celle que le volet d'aperçu de l'app a démarrée quand Paulo l'a ouvert,
# le 14.11.2026 : elle pointait sur un dossier supprimé → « File not found »). Même port = même base ; une seule tourne à la fois.
python3 -I - <<'PY'
import json
try: L=json.load(open('.claude/launch.json'))['configurations']
except Exception: L=[]
bon=lambda n: any(x.get('name')==n and x.get('port')==7797 and "directory='/tmp/subgestion_apercu'" in ' '.join(x.get('runtimeArgs',[])) for x in L)
manque=[n for n in ('subgestion-apercu','subgestion') if not bon(n)]
if manque:
    print('⚠ .claude/launch.json : entrée(s) à ajouter ou à corriger (même commande, port 7797) : '+', '.join(manque))
    print("""  {"name":"<nom>","runtimeExecutable":"python3","runtimeArgs":["-I","-c","import http.server,functools;http.server.ThreadingHTTPServer(('127.0.0.1',7797),functools.partial(http.server.SimpleHTTPRequestHandler,directory='/tmp/subgestion_apercu')).serve_forever()"],"port":7797}""")
    print('  puis preview_start {name:"subgestion-apercu"} (si « Port … already in use » : l’autre entrée tourne déjà, utiliser son onglet).')
PY

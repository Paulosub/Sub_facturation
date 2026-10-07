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
BASE=$(ls -t deltasub/*.json.gz 2>/dev/null | head -1)
[ -n "$BASE" ] && cp "$BASE" $APERCU/base_test.json.gz && echo "Base de test : $BASE"
echo "Aperçu prêt : $APERCU/$OUT"
grep -q '"subgestion-apercu"' .claude/launch.json 2>/dev/null || cat <<'MSG'
⚠ Ajouter à .claude/launch.json la configuration (puis preview_start {name:"subgestion-apercu"}) :
  {"name":"subgestion-apercu","runtimeExecutable":"python3","runtimeArgs":["-I","-c","import http.server,functools;http.server.ThreadingHTTPServer(('127.0.0.1',7797),functools.partial(http.server.SimpleHTTPRequestHandler,directory='/tmp/subgestion_apercu')).serve_forever()"],"port":7797}
MSG

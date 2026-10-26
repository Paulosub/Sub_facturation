#!/bin/bash
# Banc d'essai « Documents Substances » : rend des documents par sgDsPdf (subgestion3/sg3_docsub.js du projet) dans Google Chrome
# sans fenêtre (profil temporaire), enregistre les PDF, puis les PNG (PDFKit du Mac, pdf2png.js de l'atelier).
#
#   rendre.sh <sélection> [dossier de sortie] [options]
#     sélection : epreuve | reference | tous | 12 | 3-9 | <id> (0/bankList-fr…) | <type> | <fichier> ; liste séparée par des virgules
#     sortie    : défaut <atelier>/sorties/banc_<date>
#   options :
#     --sans-png         ne pas produire les PNG
#     --echelle N        échelle des PNG (défaut 1.2, comme les références res/*.png)
#     --pages L          pages à rendre en PNG (ex. 1,2) ; défaut toutes
#     --texte            texte extrait de chaque PDF par pdf.js → <nom>.txt
#     --zones            zone utile tracée sur chaque page
#     --meme-page        exécuter sgDsPdf dans la page (défaut : cadre séparé, comme dans l'app)
#     --chaines          polices et gabarits passés en chaînes data:…;base64 (comme dans l'app ; défaut : Uint8Array)
#     --date AAAA-MM-JJ  date des documents (défaut 2026-10-25)
#     --delai S          délai maximal en secondes (défaut 900)
#     --paralleles N     rendus PNG en parallèle (défaut 4)
# Code de sortie : 0 si aucun document en erreur, 1 sinon. Journal : <sortie>/journal.jsonl ; bilan : <sortie>/fin.json.
set -u
ICI="$(cd "$(dirname "$0")" && pwd)"
D="$(dirname "$ICI")"
PROJET="${SGDS_PROJET:-/Users/paulomeireles/Documents/Substances/00-ADMIN/01-FACTURATION/99_applucation facturation in progress}"
CHROME="${SGDS_CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"

SEL="${1:-epreuve}"; [ $# -gt 0 ] && shift
SORTIE=""
if [ $# -gt 0 ] && [ "${1#--}" = "$1" ]; then SORTIE="$1"; shift; fi
[ -z "$SORTIE" ] && SORTIE="$D/sorties/banc_$(date +%Y%m%d_%H%M%S)"
PNG=1; ECHELLE=1.2; PAGES=""; TEXTE=0; ZONES=0; CADRE=1; CHAINES=0; DATE="2026-10-25"; DELAI=900; PAR=4
while [ $# -gt 0 ]; do
  case "$1" in
    --sans-png) PNG=0;;
    --echelle) ECHELLE="$2"; shift;;
    --pages) PAGES="$2"; shift;;
    --texte) TEXTE=1;;
    --zones) ZONES=1;;
    --meme-page) CADRE=0;;
    --chaines) CHAINES=1;;
    --date) DATE="$2"; shift;;
    --delai) DELAI="$2"; shift;;
    --paralleles) PAR="$2"; shift;;
    *) echo "Option inconnue : $1" >&2; exit 2;;
  esac; shift
done
mkdir -p "$SORTIE"
SORTIE="$(cd "$SORTIE" && pwd)"
rm -f "$SORTIE"/journal.jsonl "$SORTIE"/fin.json

PORTF="$(mktemp -t sgds_port)"; rm -f "$PORTF"
PROFIL="$(mktemp -d -t sgds_chrome)"
python3 "$ICI/serveur.py" --racine "$D" --projet "$PROJET" --sortie "$SORTIE" --fichier-port "$PORTF" --delai "$DELAI" &
SPID=$!
for i in $(seq 1 100); do [ -s "$PORTF" ] && break; sleep 0.1; done
if [ ! -s "$PORTF" ]; then echo "Serveur du banc injoignable" >&2; kill $SPID 2>/dev/null; exit 1; fi
PORT="$(cat "$PORTF")"; rm -f "$PORTF"
QSEL="$(python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1],safe=""))' "$SEL")"
URL="http://127.0.0.1:$PORT/harness/banc.html?sel=$QSEL&date=$DATE&texte=$TEXTE&zones=$ZONES&cadre=$CADRE&chaines=$CHAINES"
echo "Banc : $SEL → $SORTIE"
"$CHROME" --headless=new --user-data-dir="$PROFIL" --no-first-run --no-default-browser-check --disable-gpu \
  --disable-extensions --disable-sync --use-mock-keychain --password-store=basic --mute-audio \
  "$URL" >"$SORTIE/chrome.log" 2>&1 &
CPID=$!
wait $SPID
kill $CPID 2>/dev/null; wait $CPID 2>/dev/null
rm -rf "$PROFIL"

if [ "$PNG" = "1" ]; then
  export SGDS_P2P="$D/pdf2png.js" SGDS_ECH="$ECHELLE" SGDS_PAGES="$PAGES"
  find "$SORTIE" -maxdepth 1 -name '*.pdf' -print0 | \
    xargs -0 -n 1 -P "$PAR" sh -c 'osascript -l JavaScript "$SGDS_P2P" "$1" "${1%.pdf}" "$SGDS_ECH" $SGDS_PAGES >/dev/null || echo "PNG impossible : $1" >&2' _
fi

python3 - "$SORTIE" <<'EOF'
import json, os, sys
s = sys.argv[1]
try: fin = json.load(open(os.path.join(s, 'fin.json'), encoding='utf-8'))
except Exception as e: fin = {'etat': 'pas de bilan (%s)' % e}
err = []
for l in open(os.path.join(s, 'journal.jsonl'), encoding='utf-8'):
    try: e = json.loads(l)
    except Exception: continue
    if e.get('niveau') == 'erreur': err.append(e)
alertes = sum(len(f.get('alertes') or []) for f in fin.get('fichiers', []))
print('Bilan : %s — %s document(s), %s rendu(s), %s erreur(s), %s page(s), %s alerte(s), %s ms' % (
    fin.get('etat'), fin.get('docs'), fin.get('ok'), fin.get('erreurs'), fin.get('pages'), alertes, fin.get('ms')))
for e in err[:30]:
    print('  ERREUR', e.get('msg'))
    if e.get('extra'): print('    ', str(e['extra']).replace('\n', '\n     ')[:1200])
sys.exit(1 if (err or fin.get('etat') != 'fini') else 0)
EOF

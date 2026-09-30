#!/bin/zsh
# Extraction LECTURE SEULE des données Deltaproject (à partir d'une SAUVEGARDE, jamais de la base en service).
# Usage : ./extraire.sh "/Volumes/SUBSTANCES/Deltaproject/Backup/2026-09-28 23-00-00" <dossier_sortie>
# Produit :  <sortie>/schema.txt + tables/APP.*.csv          (base Derby)
#            <sortie>/documents/costestimate.json             (devis, via convertir_devis.py)
#            <sortie>/documents/costcontrol.json              (contrôles des coûts + planifications, via convertir_couts.py)
#            <sortie>/documents/modeles.json                  (modèles, arrière-plans, logos, via convertir_modeles.py)
# Utilise le Java embarqué dans /Applications/DELTAproject.app (aucune installation requise).
# ⚠ La sortie contient des données clients : la placer hors du dépôt git (ou dans extraction_deltaproject/, ignoré).
set -e
HERE=${0:A:h}; SRC=$1; OUT=${2:-$HERE/../extraction_deltaproject}
APP=/Applications/DELTAproject.app/Contents/app
FILES="$SRC/DELTAProjectFiles/Construction"
[ -d "$FILES" ] || FILES=/Volumes/SUBSTANCES/Deltaproject/DELTAprojectFiles/Construction
TMP=$(mktemp -d)
clang -o $TMP/jrun $HERE/jrun.c
cp -R "$SRC/DeltaProject" $TMP/db                      # copie : la sauvegarde d'origine n'est jamais ouverte
mkdir -p $OUT/documents $TMP/raw_devis $TMP/raw_cc
cd $TMP
echo "1/3  Base Derby → CSV…"
./jrun -cp "$APP/lib/derby.jar:$APP/lib/derbyshared.jar:$APP/lib/derbytools.jar" $HERE/Dump.java $TMP/db $OUT

echo "2/3  Documents sérialisés → JSON…"
typeset -a PAIRS
for f in "$FILES"/Costestimate/*/*/costestimate(N); do
  id=${${f:h}:t}; PAIRS+=("$f" "$TMP/raw_devis/$id.json")
  [ -f "${f}DESC" ] && cp "${f}DESC" "$TMP/raw_devis/$id.DESC"
done
for f in "$FILES"/Costcontrol/*/*/coco/costcontrol(N); do
  id=${${${f:h}:h}:t}; PAIRS+=("$f" "$TMP/raw_cc/costcontrol_$id.json")
done
for f in "$FILES"/Costplanning/*/*/costplanning(N); do
  id=${${f:h}:t}; PAIRS+=("$f" "$TMP/raw_cc/costplanning_$id.json")
done
./jrun --add-opens java.base/java.util=ALL-UNNAMED --add-opens java.base/java.lang=ALL-UNNAMED --enable-preview \
  -cp "$APP/DELTAproject.jar:$APP/lib/*" $HERE/Ser2Json.java "${PAIRS[@]}" | grep -c '^OK' | xargs echo "   fichiers convertis :"

echo "3/3  Conversion au format DeltaSub…"
python3 $HERE/convertir_devis.py $TMP/raw_devis $OUT/documents/costestimate.json --entetes $OUT/tables/APP.COSTESTIMATEDOCUMENT.csv
[ -f $HERE/convertir_docs_devis.py ] && python3 $HERE/convertir_docs_devis.py "$FILES" $OUT/documents/costestimatedpdoc.json --entetes $OUT/tables/APP.COSTESTIMATEDOCUMENT.csv   # CH-02 lot 3
if [ -f $HERE/convertir_couts.py ]; then
  python3 $HERE/convertir_couts.py $TMP/raw_cc $OUT/documents/costcontrol.json --tables $OUT --racine "$FILES"
fi
python3 $HERE/convertir_modeles.py "${FILES:h}" $OUT/documents/modeles.json --tables $OUT
rm -rf $TMP
echo "Extraction terminée : $OUT"

#!/bin/zsh
# Extraction LECTURE SEULE des données Deltaproject (à partir d'une SAUVEGARDE, jamais de la base en service).
# Usage : ./extraire.sh "/Volumes/SUBSTANCES/Deltaproject/Backup/2026-09-28 23-00-00" <dossier_sortie>
# Utilise le Java embarqué dans /Applications/DELTAproject.app (aucune installation requise).
# ⚠ La sortie contient des données clients : la placer hors du dépôt git (ou dans extraction_deltaproject/, ignoré).
set -e
HERE=${0:A:h}; SRC=$1; OUT=${2:-$HERE/../extraction_deltaproject}
APP=/Applications/DELTAproject.app/Contents/app
TMP=$(mktemp -d)
clang -o $TMP/jrun $HERE/jrun.c
cp -R "$SRC/DeltaProject" $TMP/db                      # copie : la sauvegarde d'origine n'est jamais ouverte
mkdir -p $OUT
cd $TMP && ./jrun -cp "$APP/lib/derby.jar:$APP/lib/derbyshared.jar:$APP/lib/derbytools.jar" $HERE/Dump.java $TMP/db $OUT
echo "Tables et schéma : $OUT"

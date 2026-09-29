#!/bin/zsh
# Reprend dans DeltaSub les données de la DERNIÈRE sauvegarde nocturne de Deltaproject.
# ⚠ REMPLACE toutes les données de DeltaSub par celles de Deltaproject (à utiliser pendant la
#   transition, tant que Deltaproject reste l'outil de référence).
# Lecture seule côté Deltaproject : seule une copie de la sauvegarde est ouverte.
set -e
HERE=${0:A:h}; APP=${HERE:h}
BK=$(ls -d /Volumes/SUBSTANCES/Deltaproject/Backup/*/ | sort | tail -1)
OUT=$APP/extraction_deltaproject
echo "Sauvegarde Deltaproject utilisée : $BK"
$HERE/extraire.sh "${BK%/}" "$OUT"
python3 "$APP/serveur_deltasub.py" --importer-deltaproject "$OUT" --force
echo "Terminé. Rechargez DeltaSub sur les postes ouverts."

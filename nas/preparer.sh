#!/bin/bash
# Prépare (ou met à jour) l'app sur le NAS : reconstruit SUBGestion 3 puis copie la page, le serveur et docker-compose.yml.
#   nas/preparer.sh                   → copie dans /Volumes/subgestion/app si le partage est monté, sinon dans nas/a_copier/app
#   nas/preparer.sh <dossier>         → copie dans ce dossier
# Après une mise à jour de serveur_deltasub.py : Container Manager ▸ Projet ▸ subgestion ▸ Action ▸ Redémarrer.
# (une nouvelle page SUBGestion3.html est servie tout de suite : recharger la page sur chaque poste suffit)
set -e
ICI="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:-}"
if [ -z "$DEST" ]; then
  if [ -d /Volumes/subgestion ]; then DEST=/Volumes/subgestion/app; else DEST="$ICI/nas/a_copier/app"; fi
fi
python3 "$ICI/subgestion3/construire.py"
mkdir -p "$DEST"
cp "$ICI/SUBGestion3.html" "$ICI/DeltaSub.html" "$ICI/serveur_deltasub.py" "$ICI/nas/docker-compose.yml" "$DEST/"
mkdir -p "$DEST/../donnees" "$DEST/../sauvegardes" 2>/dev/null || true
echo "✓ App copiée dans : $DEST"
ls -la "$DEST"

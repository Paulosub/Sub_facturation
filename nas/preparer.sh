#!/bin/bash
# Prépare (ou met à jour) l'app sur le NAS : reconstruit SUBGestion 3, la nettoie (nas/nettoyer.py), puis copie la page,
# le serveur et docker-compose.yml.
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
# version servie : nettoyée (données de départ, commentaires, mentions du logiciel d'origine et des catalogues sous licence)
python3 "$ICI/nas/nettoyer.py" "$ICI/SUBGestion3.html" "$DEST/SUBGestion3.html"
cp "$ICI/serveur_deltasub.py" "$ICI/nas/docker-compose.yml" "$DEST/"
rm -f "$DEST/DeltaSub.html"   # jamais servie depuis le NAS (non nettoyée)
mkdir -p "$DEST/../donnees" "$DEST/../sauvegardes" "$DEST/../certificats" 2>/dev/null || true
# jeton Infomaniak (HTTPS) : modèle créé une seule fois, jamais écrasé ; à compléter sur le NAS (voir nas/LISEZMOI.md)
if [ ! -e "$DEST/../certificats/infomaniak.env" ]; then
  printf '%s\n' "# Jeton API Infomaniak (droits sur les domaines) pour le certificat HTTPS de gestion.substances.ch." \
    "# Remplacer la ligne ci-dessous par : INFOMANIAK_API_TOKEN=le_jeton   (sans espace ni guillemets)" \
    "INFOMANIAK_API_TOKEN=" > "$DEST/../certificats/infomaniak.env"
fi
echo "✓ App copiée dans : $DEST"
ls -la "$DEST"

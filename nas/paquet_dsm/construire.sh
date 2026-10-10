#!/bin/zsh
# Paquet DSM « SUBGestion » : icône dans le menu principal de DSM qui ouvre l'app servie par le NAS (aucun service, aucun droit).
#   nas/paquet_dsm/construire.sh   → nas/a_copier/SUBGestion.spk
# Installation : DSM ▸ Centre de paquets ▸ Installation manuelle ▸ ce fichier (paquet tiers non signé : confirmer).
# Icône = celle de l'onglet de l'app : carré bleu nuit, « S » crypté du logo officiel en blanc, carré jaune (Chrome sans fenêtre + sips).
set -e
ICI=${0:A:h}; RACINE=${ICI:h:h}; OUT=$RACINE/nas/a_copier; T=$(mktemp -d)
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "✗ Google Chrome introuvable (rendu des icônes)"; exit 1; }
mkdir -p "$OUT" "$T/package/ui/images" "$T/scripts" "$T/conf"

# 1. icône : sigle « S » extrait du logo (même tracé et mêmes proportions que l'icône d'onglet de SUBGestion 3)
python3 - "$RACINE/subgestion3/logo_substances.svg" "$T/icone.html" <<'PY'
import re, sys
logo = open(sys.argv[1], encoding='utf-8').read()
m = re.search(r'<path class="L" d="(M946\.19,1931\.6[^"]*)"', logo)
if not m:
    sys.exit('✗ sigle « S » introuvable dans logo_substances.svg')
sc = 48 / 454
svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="256" height="256">'
       '<rect width="64" height="64" fill="#003346"/>'
       f'<path fill="#fff" transform="translate({10 - 646 * sc:.2f} {8 - 1708 * sc:.2f}) scale({sc:.5f})" d="{m.group(1)}"/>'
       '<rect x="48" y="49" width="7" height="7" fill="#fff266"/></svg>')
open(sys.argv[2], 'w', encoding='utf-8').write('<!doctype html><html><body style="margin:0;background:#003346">' + svg + '</body></html>')
PY
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=256,256 \
  --screenshot="$T/icone_256.png" "file://$T/icone.html" >/dev/null 2>&1
[ -s "$T/icone_256.png" ] || { echo "✗ rendu de l'icône impossible"; exit 1; }
for s in 16 24 32 48 64 72 256; do sips -z $s $s "$T/icone_256.png" --out "$T/package/ui/images/subgestion_$s.png" >/dev/null; done
sips -z 64 64 "$T/icone_256.png" --out "$T/PACKAGE_ICON.PNG" >/dev/null
cp "$T/icone_256.png" "$T/PACKAGE_ICON_256.PNG"

# 2. contenu du paquet : interface (config + page d'ouverture + icônes)
cp "$ICI/ui/config" "$ICI/ui/index.html" "$T/package/ui/"
cp "$ICI/INFO" "$T/INFO"; cp "$ICI/conf/privilege" "$T/conf/"; cp "$ICI/scripts/"* "$T/scripts/"; chmod 755 "$T/scripts/"*
( cd "$T/package" && COPYFILE_DISABLE=1 tar --no-mac-metadata --uid 0 --gid 0 -czf "$T/package.tgz" ui )

# 3. .spk = archive tar (non compressée) : INFO, package.tgz, scripts, conf, icônes
rm -f "$OUT/SUBGestion.spk"
( cd "$T" && COPYFILE_DISABLE=1 tar --no-mac-metadata --uid 0 --gid 0 -cf "$OUT/SUBGestion.spk" INFO package.tgz scripts conf PACKAGE_ICON.PNG PACKAGE_ICON_256.PNG )
cp "$T/icone_256.png" "$OUT/SUBGestion_icone.png"
rm -rf "$T"
echo "✓ Paquet DSM : $OUT/SUBGestion.spk ($(stat -f%z "$OUT/SUBGestion.spk") octets) — DSM ▸ Centre de paquets ▸ Installation manuelle"

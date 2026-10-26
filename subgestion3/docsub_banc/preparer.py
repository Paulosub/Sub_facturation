#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Banc d'essai des « Documents Substances » (bloc 30, subgestion3/sg3_docsub.js) — préparation de l'atelier.

    python3 -I subgestion3/docsub_banc/preparer.py <atelier> <export_base.json.gz>

Crée HORS du dépôt un atelier prêt à l'emploi :
  <atelier>/harness/     copie des scripts du banc (rendre.sh, banc.html, banc.js, serveur.py, comparaisons…)
  <atelier>/pdf2png.js   rendu PDF → PNG par PDFKit du Mac
  <atelier>/res/         polices Akkurat (AKKU_*) et gabarits PDF (OFFRE_TMPL, FA_TMPL) extraits de Facturation.html,
                         bibliothèques de subgestion3/vendor/, documents types (collection modeledocument, langue fr ou vide),
                         textstyleset, rowstyleset et image de l'export de la base, rendus PNG de référence des gabarits.
Rien n'est écrit dans le dépôt : polices, gabarits et modèles ne doivent pas y être recopiés.
Puis : <atelier>/harness/rendre.sh tous <atelier>/sorties/x --texte  (mode d'emploi : harness/LISEZMOI.md).
L'export de la base = Configuration ▸ Données & sauvegarde ▸ Exporter (ou base de test de l'aperçu, base_test.json.gz).
"""
import base64, gzip, json, os, re, shutil, subprocess, sys

ICI = os.path.dirname(os.path.abspath(__file__))
PROJET = os.path.dirname(os.path.dirname(ICI))
if len(sys.argv) < 3:
    sys.exit(__doc__)
AT = os.path.abspath(sys.argv[1]); BASE = os.path.abspath(sys.argv[2])
if AT == PROJET or AT.startswith(PROJET + os.sep):
    sys.exit("L'atelier doit être hors du dépôt (polices et modèles ne doivent pas y être recopiés).")
RES = os.path.join(AT, 'res')
os.makedirs(RES, exist_ok=True)

# scripts du banc ; chemin du projet inscrit dans rendre.sh (variable SGDS_PROJET toujours prioritaire)
shutil.copytree(os.path.join(ICI, 'harness'), os.path.join(AT, 'harness'), dirs_exist_ok=True)
shutil.copy(os.path.join(ICI, 'pdf2png.js'), AT)
r = os.path.join(AT, 'harness', 'rendre.sh'); s = open(r, encoding='utf-8').read()
s2 = re.sub(r'PROJET="\$\{SGDS_PROJET:-[^}]*\}"', lambda m: 'PROJET="${SGDS_PROJET:-' + PROJET + '}"', s, count=1)
assert s2 != s or PROJET in s, 'ligne PROJET introuvable dans rendre.sh'
open(r, 'w', encoding='utf-8').write(s2); os.chmod(r, 0o755)

# polices et gabarits de Facturation.html
src = open(os.path.join(PROJET, 'Facturation.html'), encoding='utf-8').read()
for nom, ext in [('OFFRE_TMPL', 'pdf'), ('FA_TMPL', 'pdf'), ('AKKU_LIGHT', 'ttf'), ('AKKU_REGULAR', 'ttf'),
                 ('AKKU_BOLD', 'ttf'), ('AKKU_LIGHTITALIC', 'ttf')]:
    m = re.search(r"const " + nom + r" *= *'data:[a-z/+-]+;base64,([A-Za-z0-9+/=]+)'", src)
    assert m, nom + ' introuvable dans Facturation.html'
    open(os.path.join(RES, nom + '.' + ext), 'wb').write(base64.b64decode(m.group(1)))

# bibliothèques PDF (copies de référence vérifiées par construire.py)
for f in ['pdf-lib.min.js', 'fontkit.umd.min.js', 'pdf.min.js', 'pdf.worker.min.js']:
    shutil.copy(os.path.join(PROJET, 'subgestion3', 'vendor', f), RES)

# documents types et styles de l'export de la base
T = json.load(gzip.open(BASE))['tables']
md = T.get('modeledocument') or {}
rows = [dict(v['v'], id=k) for k, v in md.items() if (v['v'].get('langue') or '') in ('fr', '')]
json.dump(rows, open(os.path.join(RES, 'documents_types.json'), 'w', encoding='utf-8'), ensure_ascii=False)
for t in ('textstyleset', 'rowstyleset', 'image'):
    json.dump({k: v['v'] for k, v in (T.get(t) or {}).items()}, open(os.path.join(RES, t + '.json'), 'w', encoding='utf-8'),
              ensure_ascii=False)

# rendus PNG de référence (échelle 1,2) pour comparer_base.py
for nom, pre in [('OFFRE_TMPL', 'OFFRE'), ('FA_TMPL', 'FA')]:
    subprocess.run(['osascript', '-l', 'JavaScript', os.path.join(AT, 'pdf2png.js'), os.path.join(RES, nom + '.pdf'),
                    os.path.join(RES, pre), '1.2'], check=True, capture_output=True)
print('Atelier prêt :', AT, '—', len(rows), 'documents types')

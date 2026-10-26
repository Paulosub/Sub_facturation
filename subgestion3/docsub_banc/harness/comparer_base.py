#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Comparaison du PAPIER (en-tête, pied, numérotation, logo) avec les références — agent 1, réutilisable par l'agent 3.

  python3 comparer_base.py <dossier des épreuves> [échelle fine, défaut 5]

Le dossier doit contenir les épreuves du banc (rendre.sh epreuve,reference <dossier>) : epreuve_portrait.pdf,
epreuve_paysage.pdf, epreuve_sous_titre.pdf, epreuve_mixte.pdf, reference_contrat.pdf (+ PNG à 1,2).
Produit <dossier>/comparaisons/ : planches PNG côte à côte (référence | ma page | superposition) et mesures.json / mesures.md.
1) À l'échelle 1,2 contre les rendus fournis res/OFFRE-1, OFFRE-3, OFFRE-10, FA-1, FA-2 (gabarits bruts).
2) À l'échelle fine (1 px = 0,2 pt) contre :
   - la RÉFÉRENCE CONTRAT (reference_contrat.pdf : gabarit de l'offre + instructions d'offrePDFBytes, mêmes textes) → écart attendu nul ;
   - les gabarits bruts (OFFRE_TMPL p. 1, 3, 10 ; FA_TMPL p. 1, 2) → écarts = retouches propres à offrePDFBytes.
"""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comparaison import Page, ecarts, planche

ICI = os.path.dirname(os.path.abspath(__file__)); D = os.path.dirname(ICI); RES = os.path.join(D, 'res')
DOS = os.path.abspath(sys.argv[1]); FIN = float(sys.argv[2]) if len(sys.argv) > 2 else 5.0
CMP = os.path.join(DOS, 'comparaisons'); FINS = os.path.join(CMP, 'fin'); os.makedirs(FINS, exist_ok=True)

def rendre(pdf, prefixe, echelle, pages=None):
    a = ['osascript', '-l', 'JavaScript', os.path.join(D, 'pdf2png.js'), pdf, prefixe, str(echelle)] + ([pages] if pages else [])
    subprocess.run(a, check=True, capture_output=True)

# ── rendus fins
rendre(os.path.join(DOS, 'epreuve_portrait.pdf'), os.path.join(FINS, 'portrait'), FIN)
rendre(os.path.join(DOS, 'epreuve_paysage.pdf'), os.path.join(FINS, 'paysage'), FIN)
rendre(os.path.join(DOS, 'epreuve_sous_titre.pdf'), os.path.join(FINS, 'sous_titre'), FIN)
rendre(os.path.join(DOS, 'epreuve_mixte.pdf'), os.path.join(FINS, 'mixte'), FIN)
rendre(os.path.join(DOS, 'reference_contrat.pdf'), os.path.join(FINS, 'refcontrat'), FIN)
rendre(os.path.join(RES, 'OFFRE_TMPL.pdf'), os.path.join(FINS, 'OFFRE'), FIN, '1,3,10')
rendre(os.path.join(RES, 'FA_TMPL.pdf'), os.path.join(FINS, 'FA'), FIN)

def zones(ori):
    """zones des éléments du papier, en points (x0, y0, x1, y1), origine en bas à gauche"""
    pw, ph = (595.276, 841.89) if ori == 'portrait' else (841.89, 595.276)
    if ori == 'portrait':
        z = {'titre': (20, 803.4, 330, 815), 'trait1': (26, 800.6, 40, 803.3), 'ligne2': (20, 789.4, 330, 801.3),
             'trait2': (26, 786.5, 40, 789.2), 'ligne3': (20, 776, 330, 786.3), 'logo': (535, 78, 575, 240)}
    else:
        z = {'titre': (20, 556.8, 330, 568.4), 'trait1': (26, 554.0, 40, 556.7), 'ligne2': (20, 543.6, 330, 554.7),
             'trait2': (26, 540.8, 40, 543.5), 'ligne3': (20, 529.5, 330, 540.6), 'logo': (785, 78, 825, 240)}
    z.update({'pied_l1': (20, 39.5, 320, 50), 'pied_traits': (20, 36.6, 240, 39.3), 'pied_l2': (20, 22, 320, 36.4),
              'numero': (pw - 100, 22, pw - 70, 38)})
    return z

GRANDES = {  # zones des planches
    'portrait': {'en-tête': (0, 770, 330, 841.89), 'pied': (0, 15, 330, 55), 'numérotation': (595.276 - 110, 15, 595.276 - 60, 45), 'logo': (525, 75, 585, 245)},
    'paysage': {'en-tête': (0, 523.4, 330, 595.276), 'pied': (0, 15, 330, 55), 'numérotation': (841.89 - 110, 15, 841.89 - 60, 45), 'logo': (775, 75, 835, 245)},
}

def p(n): return os.path.join(DOS, n)
def f(n): return os.path.join(FINS, n)
def r(n): return os.path.join(RES, n)

# (nom, image référence, image mienne, orientation, éléments, note)
TOUS = ['titre', 'trait1', 'ligne2', 'pied_l1', 'pied_traits', 'pied_l2', 'numero', 'logo']
PAIRES_FINES = [
    ('A_contrat_courante_vs_portrait_p3', f('refcontrat-2.png'), f('portrait-3.png'), 'portrait', TOUS,
     'Référence contrat (page courante, 2 lignes, « 3 | 3 ») ↔ épreuve portrait p. 3 — mêmes textes : écart attendu nul'),
    ('B_contrat_3lignes_vs_sous_titre', f('refcontrat-3.png'), f('sous_titre-1.png'), 'portrait',
     ['titre', 'trait1', 'ligne2', 'trait2', 'ligne3', 'pied_l1', 'pied_traits', 'pied_l2', 'numero'],
     'Référence contrat (en-tête à 3 lignes, « 1 | 1 ») ↔ épreuve avec sous-titre (logo noir/gris non comparé)'),
    ('C_contrat_couverture_vs_portrait_p1', f('refcontrat-1.png'), f('portrait-1.png'), 'portrait', ['pied_l1', 'pied_traits', 'pied_l2', 'numero', 'logo'],
     'Couverture du contrat (logo noir, « 1 | 3 ») ↔ épreuve portrait p. 1 (en-tête de couverture différent par principe)'),
    ('D_contrat_paysage_vs_paysage_p2', f('refcontrat-4.png'), f('paysage-2.png'), 'paysage', TOUS + ['trait2'],
     'Page paysage du contrat (annexe, « 2 | 2 ») ↔ épreuve paysage p. 2 — en-tête : textes différents (comparer bas et gauche)'),
    ('E_gabarit_offre_p3_vs_portrait_p3', f('OFFRE-3.png'), f('portrait-3.png'), 'portrait', TOUS,
     'Gabarit brut de l’offre p. 3 ↔ épreuve portrait p. 3 — écarts = retouches d’offrePDFBytes (en-tête, numéros, traits, logo)'),
    ('F1_gabarit_facture_p1_vs_portrait_p1', f('FA-1.png'), f('portrait-1.png'), 'portrait', ['logo'], 'Logo NOIR : gabarit facture p. 1 ↔ épreuve p. 1'),
    ('F2_gabarit_facture_p2_vs_portrait_p2', f('FA-2.png'), f('portrait-2.png'), 'portrait', ['logo'], 'Logo GRIS : gabarit facture p. 2 ↔ épreuve p. 2'),
    ('F3_gabarit_facture_p1_vs_mixte_p1_paysage', f('FA-1.png'), f('mixte-1.png'), None, ['logo'], 'Logo NOIR en paysage (1re page paysage) : forme comparée au logo de la facture'),
    ('G_gabarit_offre_p10_vs_paysage_p2', f('OFFRE-10.png'), f('paysage-2.png'), 'paysage', TOUS + ['trait2'],
     'Gabarit brut de l’offre p. 10 (paysage) ↔ épreuve paysage p. 2'),
    ('H_gabarit_offre_p1_vs_portrait_p1', f('OFFRE-1.png'), f('portrait-1.png'), 'portrait', ['pied_l1', 'pied_traits', 'pied_l2', 'numero', 'logo'],
     'Gabarit brut de l’offre p. 1 ↔ épreuve portrait p. 1'),
]
PAIRES_12 = [  # demandées : mêmes échelles 1,2 que les rendus fournis
    ('offre1_vs_portrait1', r('OFFRE-1.png'), p('epreuve_portrait-1.png'), 'portrait'),
    ('offre3_vs_portrait3', r('OFFRE-3.png'), p('epreuve_portrait-3.png'), 'portrait'),
    ('offre10_vs_paysage2', r('OFFRE-10.png'), p('epreuve_paysage-2.png'), 'paysage'),
    ('fa1_vs_portrait1', r('FA-1.png'), p('epreuve_portrait-1.png'), 'portrait'),
    ('fa2_vs_portrait2', r('FA-2.png'), p('epreuve_portrait-2.png'), 'portrait'),
    ('contrat_courante_vs_portrait3', p('reference_contrat-2.png'), p('epreuve_portrait-3.png'), 'portrait'),
    ('contrat_paysage_vs_paysage2', p('reference_contrat-4.png'), p('epreuve_paysage-2.png'), 'paysage'),
]

res = {'echelle_fine': FIN, 'fines': {}, 'echelle_12': {}}
md = ['# Mesures du papier (en points ; Δ = ma page − référence ; g / b / d / h = bords gauche / bas / droite / haut de l’encre)', '',
      'Échelle fine %.1f (1 px = %.2f pt). « px≠ » = pixels dont l’écart de gris dépasse 32 / 255 dans la zone.' % (FIN, 1 / FIN), '']
for nom, ra, rb, ori, elts, note in PAIRES_FINES:
    A = Page(ra, ori); B = Page(rb, ori)
    if ori is None:  # logo noir posé en paysage : mêmes coordonnées relatives au coin bas-droit
        za = zones('portrait')['logo']; zb = zones('paysage')['logo']
        ea, eb = A.encre(za), B.encre(zb)
        dx = (841.89 - 595.276)
        r_ = {'ref': ea, 'mien': eb}
        res['fines'][nom] = {'note': note, 'logo': r_}
        md += ['## ' + nom, note, '', '| élément | réf. (g, b, d, h) | ma page (g, b, d, h) |', '|---|---|---|', '| logo | %s | %s |' % (ea, eb), '']
        continue
    Z = zones(A.orientation)
    lig = ['## ' + nom, note, '', '| élément | Δg | Δb | Δd | Δh | max | px≠ / px encre |', '|---|---:|---:|---:|---:|---:|---:|']
    out = {'note': note}
    for e in elts:
        x = ecarts(A, B, Z[e]); out[e] = x
        if 'max' in x:
            lig.append('| %s | %+.2f | %+.2f | %+.2f | %+.2f | %.2f | %d / %d |' % (e, x['dg'], x['db'], x['dd'], x['dh'], x['max'], x['pixels_diff'], x['pixels_encre']))
        else:
            lig.append('| %s | réf. %s | mien %s | | | | %d / %d |' % (e, x['ref'], x['mien'], x['pixels_diff'], x['pixels_encre']))
    res['fines'][nom] = out
    md += lig + ['']
    # planche fine des quatre zones
    G = GRANDES[A.orientation]
    planche([(k, A.decoupe(z), B.decoupe(z)) for k, z in G.items()], os.path.join(CMP, 'fin_' + nom + '.png'), note)

md += ['# Échelle 1,2 (rendus fournis res/*.png) — 1 px = 0,83 pt', '']
for nom, ra, rb, ori in PAIRES_12:
    A = Page(ra, ori); B = Page(rb, ori); Z = zones(ori); out = {}
    lig = ['## ' + nom, '', '| élément | Δg | Δb | Δd | Δh | px≠ / px encre |', '|---|---:|---:|---:|---:|---:|']
    for e in ['titre', 'trait1', 'ligne2', 'pied_l1', 'pied_traits', 'pied_l2', 'numero', 'logo']:
        x = ecarts(A, B, Z[e]); out[e] = x
        if 'max' in x: lig.append('| %s | %+.2f | %+.2f | %+.2f | %+.2f | %d / %d |' % (e, x['dg'], x['db'], x['dd'], x['dh'], x['pixels_diff'], x['pixels_encre']))
    res['echelle_12'][nom] = out; md += lig + ['']
    G = GRANDES[ori]
    planche([(k, A.decoupe(z), B.decoupe(z)) for k, z in G.items()], os.path.join(CMP, 'x12_' + nom + '.png'),
            os.path.basename(ra) + ' | ' + os.path.basename(rb) + ' (échelle 1,2 agrandie ×4)', agrandir=4)

json.dump(res, open(os.path.join(CMP, 'mesures.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(os.path.join(CMP, 'mesures.md'), 'w', encoding='utf-8').write('\n'.join(md) + '\n')
print('\n'.join(md))

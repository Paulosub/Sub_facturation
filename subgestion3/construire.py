#!/usr/bin/env python3
"""Construit SUBGestion3.html : app unique aux couleurs de la charte Substances (moteur DeltaSub + app Facturation).

    python3 subgestion3/construire.py            # écrit SUBGestion3.html à la racine du projet

Principe :
  - DeltaSub.html fournit le moteur de gestion (base locale IndexedDB « DeltaSub », 45 écrans, fenêtres, impressions) ;
    sa feuille de style est REMPLACÉE par subgestion3/sg3.css (charte Substances : Akkurat, bleu nuit, jaune, filets) et son
    cadre par la coquille ci-dessous + subgestion3/sg3.js (menu à gauche par domaines et modules, en-tête, vues
    d'ensemble, fiches, palette ⌘K, barres d'outils avec libellés) ;
  - Facturation.html (contrats, factures, cockpit, PV, registres) est embarqué compressé (#fx-src) et affiché dans le
    cadre #fx-frame, sans son en-tête ; ses données restent dans le localStorage (sa_*) ;
  - logo officiel : subgestion3/logo_substances.svg (Substances_LOGO_NOIR, lettres « cryptées ») ;
  - Akkurat : polices installées sur le poste (local()), non embarquées (licence bureau Lineto).
Après toute modification de DeltaSub.html, Facturation.html ou de ce dossier : relancer ce script.
Ne pas modifier SUBGestion3.html à la main. SUBGestion.html (v1) et SUBGestion2.html (v2) restent indépendantes.
"""
import argparse, base64, datetime, gzip, os, re, sys

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.dirname(ICI)
lire = lambda p: open(p, encoding='utf-8').read()


def remplacer(s, old, new, n=1, quoi=''):
    c = s.count(old)
    if c != n:
        sys.exit(f'✗ {quoi or old[:60]!r} : {c} occurrence(s), {n} attendue(s) — source modifiée ? Adapter construire.py.')
    return s.replace(old, new)


COQUILLE = '''<div id="boot"><div id="boot-logo"></div><span id="boot-msg">Ouverture…</span></div>
<div id="app">
  <aside id="nx-side">
    <div class="sg-brand" id="sg-logo" title="Accueil"></div>
    <button class="sg-qbtn" id="nx-qbtn" title="Rechercher partout (⌘K)"><span>Rechercher</span><span class="nx-kbd">⌘K</span></button>
    <nav id="nx-nav" aria-label="Menu"></nav>
    <div class="nx-foot"><div id="nx-who" style="display:contents"></div><button class="nx-ico-btn" id="nx-minibtn" title="Réduire le menu (⌘\\)"></button></div>
  </aside>
  <section id="nx-shell">
    <header id="nx-head">
      <div class="nx-hist"><button class="nx-hb" id="nx-back" title="Écran précédent (⌥←)"></button><button class="nx-hb" id="nx-fwd" title="Écran suivant (⌥→)"></button></div>
      <div class="nx-ttl"><div id="nx-crumbs"></div><h1 id="nx-title"></h1></div>
      <span style="flex:1"></span>
      <button class="nx-new" id="nx-new" title="Créer"></button>
      <button class="sg-ico" id="nx-more" title="Plus"></button>
    </header>
    <div id="nx-sub"><div id="bar"><div class="tools" id="tools"></div><div id="sg-ctx"></div><input id="search" placeholder="" autocomplete="off"></div></div>
    <div id="body"><nav id="side"></nav><main id="main"></main><div id="fx-layer"></div></div>
  </section>
</div>
<div id="top" aria-hidden="true"><img id="logo" alt=""><div id="brand"></div></div>
<div id="toast"></div>
<div id="net"></div>
<div id="nx-pal" role="dialog" aria-label="Rechercher"><div class="nx-pbox">
  <div class="nx-pin2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
    <input id="nx-pq" placeholder="Projet, contact, contrat, facture, écran, commande…" autocomplete="off" spellcheck="false"></div>
  <div class="nx-pres" id="nx-pres"></div>
  <div class="nx-pfoot"><span><b>↑↓</b> naviguer</span><span><b>↵</b> ouvrir</span><span><b>Échap</b> fermer</span></div>
</div></div>
'''

# Facturation dans le cadre : sans en-tête, sans reprise de session propre, navigation signalée à la coquille
FX_HEAD = '''<script>window.SG_EMBED=1;</script>
<style id="sg-fx">#hdr{display:none!important}body{background:#fff}</style>
'''
FX_PONT = '''<script id="sg-fx-pont">
/* SUBGestion 3 : changements d'onglet signalés à la coquille ; accueil et hubs de Facturation → vues d'ensemble ; ⌘K */
(function(){ const P=(window.parent&&window.parent!==window)?window.parent:null; if(!P) return; const g0=window.goTab;
  window.goTab=function(name){ if((name==='home'||/^hub-/.test(String(name)))&&P.sgFxHome){ P.sgFxHome(name); return; }
    const r=g0.apply(this,arguments); try{ if(P.sgFxOnTab) P.sgFxOnTab(name); }catch(e){ console.error(e); } return r; };
  document.addEventListener('keydown',e=>{ if((e.metaKey||e.ctrlKey)&&!e.altKey&&(e.key==='k'||e.key==='K')&&P.nxPal){ e.preventDefault(); P.nxPal(); return; }
    /* « / » : filtrer la liste de l'écran (comme dans le reste de l'app) */
    if(e.key==='/'&&!e.metaKey&&!e.ctrlKey&&!(e.target.closest&&e.target.closest('input,textarea,select,[contenteditable]'))){
      const p=document.querySelector('.panel.on'), i=p&&[...p.querySelectorAll('input[type=search],input[placeholder*="echercher" i],input[placeholder*="filtr" i]')].find(x=>x.offsetParent);
      if(i){ e.preventDefault(); i.focus(); i.select(); } } },true);
  /* messages et confirmations : ceux de l'app (même aspect, même place, même clavier partout) */
  if(P.toast) window.toast=function(msg,isError){ P.toast(String(msg).replace(/^✓ */,''),!!isError); };
  if(P.sgConfirm) window.chConfirm=function(message,onYes,opts){ P.sgConfirm(message,onYes,opts||{}); };
  if(P.sgAlert) window.alert=function(m){ P.sgAlert(m); };
})();
</script>
'''


def facturation_embarquee(fa):
    i = fa.find('</head>')
    if not (0 < i < fa.find('<body')):
        sys.exit('✗ Facturation.html : structure <head>/<body> inattendue')
    fa = fa[:i] + FX_HEAD + fa[i:]
    fa = remplacer(fa, "'sa_ui_state', UI_DRAFT_KEY", "'sa_ui_state_sg3', UI_DRAFT_KEY", quoi='UI_STATE_KEY')
    fa = remplacer(fa, "if(!st || !st.tab || st.tab==='home') return;", "if(window.SG_EMBED || !st || !st.tab || st.tab==='home') return;", quoi='reprise de session Facturation')
    # graphiques du cockpit et du rapport : séries aux couleurs de la charte (nuit, turquoise, orange, vert, bleu, rouge, gris)
    fa = remplacer(fa, "const PAL=['#f2a33c','#e8542d','#4a90d9','#7cb342','#9b59b6','#e6c229','#45b8ac','#d9534f','#8d6e63','#5c6bc0'];",
                   "const PAL=['#003346','#4cbab5','#d7860d','#98c21f','#3f4193','#bd1e42','#636e7e','#9d9d9c','#1d1d1b','#c9c9c7'];", quoi='palette PAL')
    fa = remplacer(fa, "const YEAR_COLORS=['#0a6e84','#1a1a1a','#b7a06a','#2E9E5B','#c0392b','#8a6d1a','#6c7a89','#3b7dd8'];",
                   "const YEAR_COLORS=['#003346','#4cbab5','#d7860d','#98c21f','#3f4193','#bd1e42','#636e7e','#9d9d9c'];", quoi='palette YEAR_COLORS')
    fa = remplacer(fa, 'location.reload();', "(window.parent!==window&&window.parent.sgFxReload?window.parent.sgFxReload():location.reload());", quoi='rechargement Facturation')
    if not fa.rstrip().endswith('</html>'):
        sys.exit('✗ Facturation.html ne se termine pas par </html>')
    k = fa.rfind('</body>')
    theme = '<style id="sg-fx-theme">\n' + lire(os.path.join(ICI, 'fx_theme.css')) + '</style>\n'   # graphisme commun, après toutes les feuilles de Facturation
    return fa[:k] + theme + FX_PONT + fa[k:]


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('-o', '--sortie', default=os.path.join(RACINE, 'SUBGestion3.html'))
    ap.add_argument('--deltasub', default=os.path.join(RACINE, 'DeltaSub.html'))
    ap.add_argument('--facturation', default=os.path.join(RACINE, 'Facturation.html'))
    a = ap.parse_args()
    s, fa = lire(a.deltasub), lire(a.facturation)

    # logo officiel et sigle (le « S » du logo, pour l'icône d'onglet)
    logo = lire(os.path.join(ICI, 'logo_substances.svg')).strip()
    m = re.search(r'<path class="L" d="(M946\.19,1931\.6[^"]*)"', logo)
    if not m:
        sys.exit('✗ sigle « S » introuvable dans logo_substances.svg')
    sc = 48 / 454
    sigle = f'<path fill="#fff" transform="translate({10 - 646 * sc:.2f} {8 - 1708 * sc:.2f}) scale({sc:.5f})" d="{m.group(1)}"/>'
    js = lire(os.path.join(ICI, 'sg3.js')) + '\n' + lire(os.path.join(ICI, 'sg3_plus.js'))   # coquille + améliorations (1 à 10)
    js = remplacer(js, '`__LOGO__`', '`' + logo + '`', quoi='logo')
    js = remplacer(js, '`__SIGLE__`', '`' + sigle + '`', quoi='sigle')

    # en-tête du document, nouvelle feuille de style (remplace celle de DeltaSub)
    s = remplacer(s, '<title>DeltaSub — Substances Architectes</title>', '<title>SUBGestion — Substances Architectes</title>', quoi='<title>')
    i = s.find('<!--'); j = s.find('-->', i)
    if not (0 < i < j < s.find('<style>')):
        sys.exit('✗ commentaire d’en-tête de DeltaSub.html introuvable')
    s = s[:i] + ('<!-- SUBGestion 3 — générée le ' + datetime.datetime.now().strftime('%d.%m.%Y %H:%M') +
                 ' par subgestion3/construire.py : moteur DeltaSub.html + app Facturation.html (cadre)\n'
                 '     + subgestion3/sg3.css et sg3.js (charte Substances). NE PAS MODIFIER À LA MAIN : modifier les sources puis reconstruire. -->') + s[j + 3:]
    i = s.find('<style>'); j = s.find('</style>', i)
    if not (0 < i < j < s.find('</head>')):
        sys.exit('✗ feuille de style principale de DeltaSub.html introuvable')
    s = s[:i] + '<style id="sg3-css">\n' + lire(os.path.join(ICI, 'sg3.css')) + '</style>' + s[j + len('</style>'):]

    # cadre : la coquille remplace l'en-tête, la barre d'outils et l'arbre de DeltaSub (mêmes identifiants conservés)
    i = s.find('<div id="boot">'); j = s.find("<script>\n'use strict';", i)
    if not (0 < i < j):
        sys.exit('✗ cadre de DeltaSub.html (#boot … <script>) introuvable')
    s = s[:i] + COQUILLE + s[j:]

    # session propre à SUBGestion 3, écran de départ « Accueil », libellés visibles
    s = remplacer(s, "'ds_view'", "'sg3_view'", n=3, quoi="clé 'ds_view'")
    s = remplacer(s, "let last='aff-gestion';", "let last='nx-home';", quoi='vue de départ')
    s = remplacer(s, "b.append(h('b',{},'DeltaSub'),", "b.append(h('b',{},'SUBGestion'),", quoi='écran « base vide »')
    s = remplacer(s, "'La base locale est vide. Importez une base DeltaSub (.json.gz), créée à partir d’une sauvegarde par '",
                  "'La base de ce navigateur est vide. Importez une sauvegarde (.json.gz), créée depuis Réglages ▸ Données & sauvegarde ou par '", quoi='texte base vide')
    s = remplacer(s, "' ou par Fichier ▸ Exporter la base locale.'", "'.'", quoi='texte base vide (fin)')
    s = remplacer(s, 'fermez les autres onglets DeltaSub', 'fermez les autres onglets SUBGestion ou DeltaSub', quoi='message base bloquée')
    s = remplacer(s, "'Ce module de Deltaproject est en cours de reproduction dans DeltaSub.'", "'Cet écran n’est pas encore disponible.'", quoi='écran provisoire')
    for a_, b_ in (("background:k==='Vacances'?'#e8a54a':'#3875d7'", "background:k==='Vacances'?'#d7860d':'#003346'"),
                   ("height:'10px',background:'#3875d7'", "height:'10px',background:'#003346'"),
                   ("tr.svd-on td{background:#dce7fb!important", "tr.svd-on td{background:#fef6b0!important")):
        s = remplacer(s, a_, b_, quoi='couleur d’interface du moteur')
    s = s.replace('color:#1f5fbf', 'color:#003346')
    s = s.replace('<title>DeltaSub</title>', '<title>SUBGestion</title>').replace('reprises dans DeltaSub.', 'reprises dans SUBGestion.').replace('disponible dans DeltaSub.', 'disponible dans SUBGestion.')

    # Facturation embarquée + coquille
    fx = base64.b64encode(gzip.compress(facturation_embarquee(fa).encode('utf-8'), 9, mtime=0)).decode('ascii')
    if not s.rstrip().endswith('</html>'):
        sys.exit('✗ DeltaSub.html ne se termine pas par </html>')
    k = s.rfind('</body>')
    s = s[:k] + ('<!-- App Facturation (Facturation.html sans en-tête, gzip + base64) : chargée dans #fx-frame par sg3.js -->\n'
                 '<script type="application/x-gzip-base64" id="fx-src">' + fx + '</script>\n'
                 '<script id="sg3-js">\n' + js + '</script>\n') + s[k:]

    with open(a.sortie, 'w', encoding='utf-8') as f:
        f.write(s)
    print(f'✓ {os.path.relpath(a.sortie, RACINE)} : {len(s.encode("utf-8"))/1e6:.1f} Mo (dont Facturation {len(fx)/1e6:.1f} Mo compressés)')


if __name__ == '__main__':
    main()

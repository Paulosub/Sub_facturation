#!/usr/bin/env python3
"""Construit SUBGestion2.html : nouvelle app (interface entièrement redessinée) sur le moteur et les données de DeltaSub.

    python3 subgestion2/construire.py            # écrit SUBGestion2.html à la racine du projet

Principe :
  - DeltaSub.html fournit le moteur (base locale IndexedDB « DeltaSub », 45 écrans, fenêtres, impressions) ;
  - sa feuille de style est REMPLACÉE par subgestion2/nx.css (nouveau système de design) ;
  - son cadre (en-tête, barre d'outils, arbre des modules) est REMPLACÉ par la coquille ci-dessous + subgestion2/nx.js
    (panneau latéral par flux de travail, en-tête, palette ⌘K, écrans Aujourd'hui / fiches projet, contact, membre) ;
  - données inchangées : même base que DeltaSub.html et SUBGestion.html (v1) ; session propre (nx_view).
Après toute modification de DeltaSub.html ou de ce dossier : relancer ce script. Ne pas modifier SUBGestion2.html à la main.
"""
import argparse, datetime, os, re, sys

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.dirname(ICI)
lire = lambda p: open(p, encoding='utf-8').read()


def remplacer(s, old, new, n=1, quoi=''):
    c = s.count(old)
    if c != n:
        sys.exit(f'✗ {quoi or old[:60]!r} : {c} occurrence(s), {n} attendue(s) — DeltaSub.html a changé ? Adapter construire.py.')
    return s.replace(old, new)


COQUILLE = '''<div id="boot"><div id="boot-logo"></div><b>SUBGestion</b><span id="boot-msg">Ouverture…</span></div>
<div id="app">
  <aside id="nx-side">
    <div class="nx-brand" title="Aujourd’hui"><span class="w">SUBGestion</span><span class="v">2</span></div>
    <button id="nx-qbtn" title="Rechercher partout (⌘K)"><span>Rechercher…</span><span class="nx-kbd">⌘K</span></button>
    <nav id="nx-nav"></nav>
    <div class="nx-foot"><div id="nx-who" style="display:contents"></div><button class="nx-ico-btn" id="nx-minibtn" title="Réduire le panneau (⌘\\)"></button></div>
  </aside>
  <section id="nx-shell">
    <header id="nx-head">
      <div class="nx-hist"><button class="nx-hb" id="nx-back" title="Écran précédent (⌥←)"></button><button class="nx-hb" id="nx-fwd" title="Écran suivant (⌥→)"></button></div>
      <div class="nx-ttl"><div id="nx-crumbs"></div><h1 id="nx-title"></h1></div>
      <span style="flex:1"></span>
      <button class="nx-new" id="nx-new" title="Créer"></button>
      <button class="nx-more" id="nx-more" title="Plus"></button>
    </header>
    <div id="nx-sub"><div id="bar"><div class="tools" id="tools"></div><input id="search" placeholder="" autocomplete="off"></div></div>
    <div id="body"><nav id="side"></nav><main id="main"></main></div>
  </section>
</div>
<div id="top" aria-hidden="true"><img id="logo" alt=""><div id="brand"></div></div>
<div id="toast"></div>
<div id="net"></div>
<div id="nx-pal" role="dialog" aria-label="Rechercher"><div class="nx-pbox">
  <div class="nx-pin2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
    <input id="nx-pq" placeholder="Rechercher un projet, un contact, un écran, une commande…" autocomplete="off" spellcheck="false"></div>
  <div class="nx-pres" id="nx-pres"></div>
  <div class="nx-pfoot"><span><b>↑↓</b> naviguer</span><span><b>↵</b> ouvrir</span><span><b>Échap</b> fermer</span></div>
</div></div>
'''


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('-o', '--sortie', default=os.path.join(RACINE, 'SUBGestion2.html'))
    ap.add_argument('--deltasub', default=os.path.join(RACINE, 'DeltaSub.html'))
    a = ap.parse_args()
    s = lire(a.deltasub)

    # en-tête du document : titre, commentaire, police, nouvelle feuille de style (remplace celle de DeltaSub)
    s = remplacer(s, '<title>DeltaSub — Substances Architectes</title>', '<title>SUBGestion</title>', quoi='<title>')
    i = s.find('<!--'); j = s.find('-->', i)
    if not (0 < i < j < s.find('<style>')):
        sys.exit('✗ commentaire d’en-tête de DeltaSub.html introuvable')
    s = s[:i] + ('<!-- SUBGestion 2 — générée le ' + datetime.datetime.now().strftime('%d.%m.%Y %H:%M') +
                 ' par subgestion2/construire.py à partir de DeltaSub.html (moteur et données)\n'
                 '     + subgestion2/nx.css et nx.js (interface). NE PAS MODIFIER À LA MAIN : modifier les sources puis reconstruire. -->') + s[j + 3:]
    i = s.find('<style>'); j = s.find('</style>', i)
    if not (0 < i < j < s.find('</head>')):
        sys.exit('✗ feuille de style principale de DeltaSub.html introuvable')
    s = s[:i] + ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
                 '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">\n'
                 '<style id="nx-css">\n' + lire(os.path.join(ICI, 'nx.css')) + '</style>') + s[j + len('</style>'):]
    s = s.replace('<link rel="icon"', '<link rel="x-old-icon"')
    s = s.replace('</head>', '<link rel="icon" href="data:image/svg+xml,' + re.sub(r'\s+', ' ', '''%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='11' fill='%236c47ff'/%3E%3Cpath d='M11 25.5h10a4.5 4.5 0 0 0 0-9h-2a4.5 4.5 0 0 1 0-9h10' fill='none' stroke='white' stroke-width='3.2' stroke-linecap='round'/%3E%3Ccircle cx='29' cy='25.5' r='3.2' fill='%23d9ff5c'/%3E%3C/svg%3E''') + '">\n</head>', 1)

    # cadre : la coquille NX remplace l'en-tête, la barre d'outils et l'arbre de DeltaSub (mêmes identifiants conservés)
    i = s.find('<div id="boot">'); j = s.find("<script>\n'use strict';", i)
    if not (0 < i < j):
        sys.exit('✗ cadre de DeltaSub.html (#boot … <script>) introuvable')
    s = s[:i] + COQUILLE + s[j:]

    # session propre à SUBGestion 2 et écran de départ « Aujourd'hui »
    s = remplacer(s, "'ds_view'", "'nx_view'", n=3, quoi="clé 'ds_view'")
    s = remplacer(s, "let last='aff-gestion';", "let last='nx-home';", quoi='vue de départ')
    s = remplacer(s, "b.append(h('b',{},'DeltaSub'),", "b.append(h('b',{},'SUBGestion'),", quoi='écran « base vide »')
    # libellés visibles
    s = remplacer(s, 'fermez les autres onglets DeltaSub', 'fermez les autres onglets SUBGestion ou DeltaSub', quoi='message base bloquée')
    s = remplacer(s, "'Ce module de Deltaproject est en cours de reproduction dans DeltaSub.'", "'Cet écran n’est pas encore disponible.'", quoi='écran provisoire')
    s = remplacer(s, "'La base locale est vide. Importez une base DeltaSub (.json.gz), créée à partir d’une sauvegarde par '",
                  "'La base de ce navigateur est vide. Importez une sauvegarde (.json.gz), créée depuis Réglages ▸ Données & sauvegarde ou par '", quoi='texte base vide')
    s = remplacer(s, "' ou par Fichier ▸ Exporter la base locale.'", "'.'", quoi='texte base vide (fin)')
    s = s.replace('<title>DeltaSub</title>', '<title>SUBGestion</title>').replace('reprises dans DeltaSub.', 'reprises dans SUBGestion.').replace('disponible dans DeltaSub.', 'disponible dans SUBGestion.')

    if not s.rstrip().endswith('</html>'):
        sys.exit('✗ DeltaSub.html ne se termine pas par </html>')
    k = s.rfind('</body>')
    s = s[:k] + '<script id="nx-js">\n' + lire(os.path.join(ICI, 'nx.js')) + '</script>\n' + s[k:]

    with open(a.sortie, 'w', encoding='utf-8') as f:
        f.write(s)
    print(f'✓ {os.path.relpath(a.sortie, RACINE)} : {len(s.encode("utf-8"))/1e6:.1f} Mo')


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Construit SUBGestion.html : une seule app = Facturation.html + tous les modules de DeltaSub.html.

    python3 subgestion/construire.py            # écrit SUBGestion.html à la racine du projet
    python3 subgestion/construire.py -o X.html  # autre fichier de sortie

Principe (les deux apps sources restent intactes et se modifient comme avant) :
  - la base est Facturation.html (design, en-tête, accueil, tous ses modules) ;
  - subgestion/shell.css + shell.js réorganisent l'accueil par domaines, ajoutent les hubs, les onglets
    d'en-tête et le cadre des modules DeltaSub ;
  - DeltaSub.html est habillé (subgestion/ds_theme.css), relié à la coquille (subgestion/ds_embed.js), puis
    embarqué compressé (gzip + base64) et chargé dans un cadre du même document : ses fonctions et ses styles
    restent isolés de ceux de Facturation (aucun conflit de noms) ;
  - données inchangées : localStorage sa_* (Facturation) et IndexedDB « DeltaSub », partagés avec les deux
    apps d'origine lorsqu'elles sont ouvertes dans le même navigateur.
Après toute modification de Facturation.html, DeltaSub.html ou de ce dossier : relancer ce script.
"""
import argparse, base64, datetime, gzip, os, sys

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.dirname(ICI)


def lire(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


def remplacer(s, old, new, n=1, quoi=''):
    c = s.count(old)
    if c != n:
        sys.exit(f'✗ {quoi or old[:60]!r} : {c} occurrence(s) trouvée(s), {n} attendue(s) — source modifiée ? Adapter construire.py.')
    return s.replace(old, new)


def inserer_avant(s, marque, bloc, derniere=False, quoi=''):
    i = s.rfind(marque) if derniere else s.find(marque)
    if i < 0:
        sys.exit(f'✗ marque {marque!r} introuvable ({quoi})')
    return s[:i] + bloc + s[i:]


def deltasub_embarque(ds):
    """DeltaSub.html → document habillé et relié à la coquille."""
    head_end, body = ds.find('</head>'), ds.find('<body')
    if not (0 < head_end < body):
        sys.exit('✗ DeltaSub.html : structure <head>/<body> inattendue')
    ds = ds[:head_end] + '<style id="sg-ds-theme">\n' + lire(os.path.join(ICI, 'ds_theme.css')) + '</style>\n' + ds[head_end:]
    ds = remplacer(ds, '<b>DeltaSub</b><span id="boot-msg">Connexion à la base du bureau…</span>',
                   '<b>SUBGestion</b><span id="boot-msg">Chargement des modules…</span>', quoi='écran de démarrage DeltaSub')
    ds = remplacer(ds, "b.append(h('b',{},'DeltaSub'),", "b.append(h('b',{},'SUBGestion'),", quoi='écran « base vide » DeltaSub')
    # rechargement : c'est la coquille qui recrée le cadre (un location.reload rechargerait SUBGestion dans le cadre)
    n = ds.count('location.reload()')
    ds = ds.replace('location.reload()', '(window.parent!==window&&window.parent.sgDsReload?window.parent.sgDsReload():location.reload())')
    if not ds.rstrip().endswith('</html>'):
        sys.exit('✗ DeltaSub.html ne se termine pas par </html>')
    ds = inserer_avant(ds, '</body>', '<script id="sg-ds-embed">\n' + lire(os.path.join(ICI, 'ds_embed.js')) + '</script>\n', derniere=True)
    return ds, n


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('-o', '--sortie', default=os.path.join(RACINE, 'SUBGestion.html'))
    ap.add_argument('--facturation', default=os.path.join(RACINE, 'Facturation.html'))
    ap.add_argument('--deltasub', default=os.path.join(RACINE, 'DeltaSub.html'))
    a = ap.parse_args()

    fa, ds = lire(a.facturation), lire(a.deltasub)
    ds, n_reload = deltasub_embarque(ds)
    charge = base64.b64encode(gzip.compress(ds.encode('utf-8'), 9, mtime=0)).decode('ascii')

    quand = datetime.datetime.now().strftime('%d.%m.%Y %H:%M')
    s = remplacer(fa, '<head>\n', '<head>\n<!-- SUBGestion — app unique Facturation + DeltaSub, générée le ' + quand +
                  ' par subgestion/construire.py\n     à partir de Facturation.html et DeltaSub.html. NE PAS MODIFIER À LA MAIN : modifier les sources puis reconstruire. -->\n',
                  quoi='<head>')
    i, j = s.find('<title>'), s.find('</title>')
    if not (0 < i < j):
        sys.exit('✗ Facturation.html : <title> introuvable')
    s = s[:i] + '<title>SUBGestion — Substances Architectes</title>' + s[j + len('</title>'):]
    # reprise de session propre à SUBGestion (sinon Facturation.html rouvrirait un panneau qu'elle n'a pas)
    s = remplacer(s, "'sa_ui_state', UI_DRAFT_KEY", "'sa_ui_state_sg', UI_DRAFT_KEY", quoi='UI_STATE_KEY')
    if s.find('</head>') > s.find('<body'):
        sys.exit('✗ Facturation.html : structure <head>/<body> inattendue')
    s = inserer_avant(s, '</head>', '<style id="sg-shell">\n' + lire(os.path.join(ICI, 'shell.css')) + '</style>\n', quoi='CSS coquille')
    if not s.rstrip().endswith('</html>'):
        sys.exit('✗ Facturation.html ne se termine pas par </html>')
    bloc = ('<!-- Modules DeltaSub (DeltaSub.html habillé, gzip + base64) : chargés dans #sg-ds-frame par shell.js -->\n'
            '<script type="application/x-gzip-base64" id="sg-ds-src">' + charge + '</script>\n'
            '<script id="sg-shell-js">\n' + lire(os.path.join(ICI, 'shell.js')) + '</script>\n')
    s = inserer_avant(s, '</body>', bloc, derniere=True)

    with open(a.sortie, 'w', encoding='utf-8') as f:
        f.write(s)
    print(f'✓ {os.path.relpath(a.sortie, RACINE)} : {len(s.encode("utf-8"))/1e6:.1f} Mo '
          f'(Facturation {len(fa.encode("utf-8"))/1e6:.1f} Mo + DeltaSub {len(ds.encode("utf-8"))/1e6:.1f} Mo → {len(charge)/1e6:.1f} Mo compressés ; '
          f'{n_reload} rechargement(s) DeltaSub redirigé(s))')


if __name__ == '__main__':
    main()

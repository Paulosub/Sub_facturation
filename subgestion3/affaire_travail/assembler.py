#!/usr/bin/env python3
"""Assemble l'affaire de travail en un seul fichier JS (ref.js, socle.js, m*.js dans l'ordre du nom) pour l'aperçu."""
import glob,os,sys
ICI=os.path.dirname(os.path.abspath(__file__))
sortie=sys.argv[1] if len(sys.argv)>1 else '/tmp/subgestion_apercu/affaire_travail.js'
filtre=[x for x in (sys.argv[2].split(',') if len(sys.argv)>2 else []) if x]   # préfixes de fichiers : m10,m20,m30 (banc : tester sans les modules en cours d'écriture par d'autres)
mods=sorted(glob.glob(os.path.join(ICI,'m*.js')))
if filtre: mods=[m for m in mods if any(os.path.basename(m).startswith(x) for x in filtre)]
parts=[os.path.join(ICI,'ref.js'),os.path.join(ICI,'socle.js')]+mods
with open(sortie,'w',encoding='utf-8') as f:
    for p in parts:
        f.write('/* ── '+os.path.basename(p)+' ── */\n'); f.write(open(p,encoding='utf-8').read()); f.write('\n')
print('assemblé :',sortie,len(parts),'fichiers')

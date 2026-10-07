#!/bin/zsh
# Ouvre une app en file:// dans un VRAI Chrome sans fenêtre (profil neuf, temporaire) et rapporte son état :
# erreurs JS, titre, écran de démarrage, police Akkurat, cadre Facturation. Vérifie le mode d'ouverture réel (double-clic).
#   sonde_chrome.sh <fichier.html> [secondes=14]
# Profil neuf = base vide : l'écran « La base de ce navigateur est vide… » est attendu, sans erreur.
set -e
F=${1:?fichier .html}; S=${2:-14}
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "Google Chrome introuvable"; exit 1; }
T=$(mktemp -d); P=$T/sonde.html
python3 - "$F" "$P" <<'PY'
import sys
s=open(sys.argv[1],encoding='utf-8').read()
sonde="""<script>addEventListener('error',e=>{window.__e=(window.__e||[]).concat(e.message)});
setTimeout(async()=>{ const r={titre:document.title,erreurs:window.__e||[]};
 try{ const b=document.getElementById('boot'); r.demarrage=b?b.innerText.replace(/\\s+/g,' ').slice(0,90):'(terminé)'; }catch(_){}
 try{ r.vue=(typeof VIEW!=='undefined'&&VIEW)?VIEW.id:null; }catch(_){}
 try{ r.akkurat=document.fonts.check('13px "SUB Akkurat"')||document.fonts.check('13px Akkurat'); }catch(_){}
 try{ if(typeof fxEnsure==='function'){ const w=await fxEnsure(); w.goTab('contrats'); await new Promise(z=>setTimeout(z,600)); r.facturation={onglet:w.eval('currentView'),contrats:w.eval('contrats.length'),factures:w.eval('factures.length')}; } }catch(e){ r.facturation='ERREUR '+e.message; }
 console.log('SONDE '+JSON.stringify(r)); }, 6000);</script>"""
i=s.find('<script'); open(sys.argv[2],'w',encoding='utf-8').write(s[:i]+sonde+s[i:])   # sonde lue 6 s après l'ouverture
PY
"$CHROME" --headless=new --disable-gpu --no-first-run --user-data-dir=$T/profil --enable-logging=stderr --v=0 "file://$P" >/dev/null 2>$T/log & PID=$!
sleep $S; kill $PID 2>/dev/null; sleep 1
grep -o 'SONDE .*' $T/log | sed 's/", source:.*//' || echo "Aucun résultat (augmenter la durée ?)"
grep -i 'Uncaught' $T/log | head -5 | cut -c1-240
rm -rf $T

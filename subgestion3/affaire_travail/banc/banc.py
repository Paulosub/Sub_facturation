#!/usr/bin/env python3
"""Banc d'essai de l'affaire de travail : Chrome sans fenêtre, profil neuf, copie de l'app et de la base de test, jamais le Chrome de Paulo.
   python3 -I banc.py --fichiers m10,m20 --port 7841 [--jusqua 20] [--apres fichier.js] [--ecrans] [--limite 900]
   --fichiers : préfixes des modules à charger (sans : tous)
   --jusqua n   : dernier module exécuté (numéro) ; --apres : script JS exécuté après la génération, sa dernière expression (async) est rendue dans 'apres'
   --ecrans     : ouvre ensuite les écrans de l'app et relève les erreurs
   Sortie : JSON sur la sortie standard (ok, err, duree, journal, apres, ecrans, erreursPage)."""
import argparse,functools,http.server,json,os,shutil,subprocess,sys,tempfile,threading,time,glob
ICI=os.path.dirname(os.path.abspath(__file__)); AT=os.path.dirname(ICI); RACINE=os.path.dirname(os.path.dirname(AT))
a=argparse.ArgumentParser(); a.add_argument('--jusqua',type=int); a.add_argument('--port',type=int,default=7841); a.add_argument('--apres'); a.add_argument('--ecrans',action='store_true'); a.add_argument('--limite',type=int,default=900); a.add_argument('--garder'); a.add_argument('--fichiers',default=''); a=a.parse_args()
www=a.garder or tempfile.mkdtemp(prefix='at_banc_'); os.makedirs(www,exist_ok=True); prof=tempfile.mkdtemp(prefix='at_prof_')
page=open(os.path.join(RACINE,'SUBGestion3.html'),encoding='utf-8').read()
i=page.rfind('</body>'); page=page[:i]+'<script src="affaire_travail.js"></script><script src="at_banc.js"></script>'+page[i:]
open(os.path.join(www,'index.html'),'w',encoding='utf-8').write(page)
bases=sorted(glob.glob(os.path.join(RACINE,'deltasub','*.json.gz')),key=os.path.getmtime); shutil.copy(bases[-1] if bases else '/tmp/subgestion_apercu/base_test.json.gz',os.path.join(www,'base_test.json.gz'))
subprocess.run([sys.executable,'-I',os.path.join(AT,'assembler.py'),os.path.join(www,'affaire_travail.js'),a.fichiers],check=True,stdout=subprocess.DEVNULL)
ap=open(a.apres,encoding='utf-8').read() if a.apres else ''
sonde=open(os.path.join(ICI,'sonde.js'),encoding='utf-8').read().replace('/*JUSQUA*/null',json.dumps(a.jusqua)).replace('/*ECRANS*/false','true' if a.ecrans else 'false').replace("'/*APRES*/'",json.dumps(ap))
open(os.path.join(www,'at_banc.js'),'w',encoding='utf-8').write(sonde)
res=os.path.join(www,'resultat.json')
if os.path.exists(res): os.remove(res)
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*x): pass
    def do_POST(self):
        n=int(self.headers.get('Content-Length',0)); b=self.rfile.read(n); open(res,'wb').write(b); self.send_response(200); self.end_headers(); self.wfile.write(b'ok')
srv=http.server.ThreadingHTTPServer(('127.0.0.1',a.port),functools.partial(H,directory=www)); threading.Thread(target=srv.serve_forever,daemon=True).start()
log=open(os.path.join(www,'chrome.log'),'wb')
ch=subprocess.Popen(['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','--headless=new','--disable-gpu','--no-first-run','--window-size=1500,950','--user-data-dir='+prof,'--enable-logging=stderr','--v=0','--autoplay-policy=no-user-gesture-required','http://127.0.0.1:%d/index.html'%a.port],stdout=subprocess.DEVNULL,stderr=log)
t=time.time()
while time.time()-t<a.limite and not os.path.exists(res): time.sleep(1)
ch.terminate(); time.sleep(1); ch.kill() if ch.poll() is None else None; srv.shutdown()
sortie={'fin':'resultat' if os.path.exists(res) else 'limite de temps atteinte'}
if os.path.exists(res): sortie.update(json.load(open(res,encoding='utf-8')))
try:
    L=open(os.path.join(www,'chrome.log'),errors='replace').read().splitlines(); sortie['chrome']=[x[:300] for x in L if 'Uncaught' in x][:12]
except Exception: pass
print(json.dumps(sortie,ensure_ascii=False,indent=1))
shutil.rmtree(prof,ignore_errors=True)
if not a.garder: shutil.rmtree(www,ignore_errors=True)

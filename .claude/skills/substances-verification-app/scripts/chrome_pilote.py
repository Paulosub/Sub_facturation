# -*- coding: utf-8 -*-
"""Essais et captures dans un Chrome SANS FENÊTRE, hors du volet d'aperçu de Paulo (il ferme les onglets d'essai, et il
travaille dans le sien) : pilote minimal du protocole de débogage de Chrome, sans bibliothèque.

  1. Préparer un dossier servi (hors du dépôt), par exemple <atelier>/www :
       cp SUBGestion3.html <atelier>/www/essai.html ; cp /tmp/subgestion_apercu/base_test.json.gz <atelier>/www/
       (cd <atelier>/www && python3 -m http.server 7811 --bind 127.0.0.1 &)
  2. Écrire un scénario <atelier>/cas.js : des étapes séparées par une ligne « //ETAPE <nom> ». Chaque étape est le corps
     d'une fonction asynchrone (« att(ms) » attend ; « return x » affiche x). Si <nom> finit par « .png », une capture de
     l'écran est prise AVANT l'étape (état laissé par l'étape précédente) dans <atelier>/vues/<nom>.
  3. python3 -I chrome_pilote.py http://127.0.0.1:7811/essai.html <atelier>/cas.js
     Profil de Chrome : <atelier>/profil (base importée au premier lancement depuis /base_test.json.gz, gardée ensuite).

Exemple d'étape : « ccOpen(3601); await att(1500); return document.title; ». Balayage de tous les écrans : charger
verifier_ecrans.js (copié dans www) par fetch + eval, puis attendre window.__sgFin.
Origine 127.0.0.1:7811 = base séparée de celles des aperçus. Ne jamais y mettre de données réelles ailleurs que dans
l'atelier (hors du dépôt)."""
import sys, os, json, socket, struct, base64, subprocess, time, urllib.request

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

class WS:
    def __init__(self, url):
        assert url.startswith('ws://'); rest = url[5:]; hp, path = rest.split('/', 1); host, port = hp.split(':')
        self.s = socket.create_connection((host, int(port))); key = base64.b64encode(os.urandom(16)).decode()
        self.s.sendall(('GET /%s HTTP/1.1\r\nHost: %s\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: %s\r\nSec-WebSocket-Version: 13\r\n\r\n' % (path, hp, key)).encode())
        buf = b''
        while b'\r\n\r\n' not in buf: buf += self.s.recv(4096)
        self.buf = buf.split(b'\r\n\r\n', 1)[1]; self.n = 0
    def _lire(self, n):
        while len(self.buf) < n:
            d = self.s.recv(65536)
            if not d: raise EOFError
            self.buf += d
        r, self.buf = self.buf[:n], self.buf[n:]; return r
    def envoyer(self, texte):
        d = texte.encode(); m = os.urandom(4); n = len(d)
        h = b'\x81' + (bytes([0x80 | n]) if n < 126 else b'\xfe' + struct.pack('>H', n) if n < 65536 else b'\xff' + struct.pack('>Q', n))
        self.s.sendall(h + m + bytes(b ^ m[i % 4] for i, b in enumerate(d)))
    def recevoir(self):
        msg = b''
        while True:
            a, b = self._lire(2); fin = a & 0x80; op = a & 0x0f; n = b & 0x7f
            if n == 126: n = struct.unpack('>H', self._lire(2))[0]
            elif n == 127: n = struct.unpack('>Q', self._lire(8))[0]
            d = self._lire(n)
            if op == 8: raise EOFError
            if op in (9, 10): continue
            msg += d
            if fin: return msg.decode('utf-8', 'replace')
    def cmd(self, methode, **params):
        self.n += 1; i = self.n; self.envoyer(json.dumps({'id': i, 'method': methode, 'params': params}))
        while True:
            r = json.loads(self.recevoir())
            if r.get('id') == i:
                if 'error' in r: raise RuntimeError(r['error'])
                return r.get('result', {})

def lancer(profil, port=9333, taille='1500,1050'):
    p = subprocess.Popen([CHROME, '--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars', '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding', '--window-size=' + taille, '--user-data-dir=' + profil,
        '--remote-debugging-port=%d' % port, 'about:blank'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(60):
        try:
            L = json.loads(urllib.request.urlopen('http://127.0.0.1:%d/json' % port, timeout=1).read())
            pg = [x for x in L if x.get('type') == 'page']
            if pg: return p, WS(pg[0]['webSocketDebuggerUrl'])
        except Exception: time.sleep(0.25)
    p.kill(); raise RuntimeError('Chrome injoignable')

def evaluer(ws, expr, attente=120):
    r = ws.cmd('Runtime.evaluate', expression=expr, awaitPromise=True, returnByValue=True, timeout=attente * 1000)
    if 'exceptionDetails' in r: return {'__erreur': json.dumps(r['exceptionDetails'])[:600]}
    return r.get('result', {}).get('value')

def capturer(ws, fichier):
    r = ws.cmd('Page.captureScreenshot', format='png'); open(fichier, 'wb').write(base64.b64decode(r['data'])); return os.path.getsize(fichier)

if __name__ == '__main__':
    url, script = sys.argv[1], os.path.abspath(sys.argv[2]); atelier = os.path.dirname(script)
    os.makedirs(os.path.join(atelier, 'vues'), exist_ok=True)
    p, ws = lancer(os.path.join(atelier, 'profil'))
    pret = "(async()=>{ for(let i=0;i<200;i++){ await new Promise(r=>setTimeout(r,300)); if(typeof lbImport==='function'&&document.body.innerText.match(/base de ce navigateur est vide/i)) return 'vide'; if(typeof DS!=='undefined'&&document.querySelector('#main')&&document.querySelector('#main').children.length) return 'pret'; } return 'rien'; })()"
    try:
        ws.cmd('Page.enable'); ws.cmd('Runtime.enable'); ws.cmd('Page.navigate', url=url); etat = evaluer(ws, pret)
        if etat == 'vide':   # premier lancement : base de test importée, puis rechargement
            evaluer(ws, "(async()=>{ const b=await (await fetch('/base_test.json.gz')).blob(); await lbImport(new File([b],'base_test.json.gz')); return true; })()")
            ws.cmd('Page.navigate', url=url); etat = evaluer(ws, pret)
        print('état :', etat)
        etapes = open(script, encoding='utf-8').read().split('\n//ETAPE ')
        for k, e in enumerate(etapes):
            nom, _, corps = e.partition('\n') if k else ('', '', e)
            if nom.strip().endswith('.png'): print('capture', nom.strip(), capturer(ws, os.path.join(atelier, 'vues', nom.strip())))
            if not corps.strip(): continue
            r = evaluer(ws, '(async()=>{ const att=ms=>new Promise(r=>setTimeout(r,ms)); ' + corps + ' })()')
            if r is not None: print(json.dumps(r, ensure_ascii=False)[:8000])
    finally:
        try: ws.s.close()
        except Exception: pass
        p.terminate()
        try: p.wait(5)
        except Exception: p.kill()

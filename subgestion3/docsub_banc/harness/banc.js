/* Banc d'essai « Documents Substances » — logique de la page banc.html (lancée par rendre.sh).
   - Charge les ressources de l'atelier (polices, gabarits, styles, documents types).
   - Comme dans l'app : sgDsPdf est RECRÉÉE par toString() dans un cadre séparé qui a son propre pdf-lib et fontkit
     (w.Function('return ('+sgDsPdf.toString()+')')()) : une variable extérieure ou un tableau d'un autre domaine se voient ici.
   - Envoie chaque PDF au serveur (/enregistrer), le journal (/journal) et le bilan (/fin). Toute erreur JS est journalisée. */

const SGB_Q = new URLSearchParams(location.search);
function sgBancJournal(niveau, msg, extra){
  try{ const e = document.getElementById('etat'); if(e) e.textContent += '\n[' + niveau + '] ' + msg; }catch(_){ }
  return fetch('/journal', { method:'POST', body:JSON.stringify({ niveau, msg:String(msg), extra:extra == null ? null : extra, t:new Date().toISOString() }) }).catch(() => {});
}
window.addEventListener('error', ev => sgBancJournal('erreur', 'Erreur JS : ' + ev.message + ' (' + (ev.filename || '') + ':' + (ev.lineno || '') + ':' + (ev.colno || '') + ')', ev.error && ev.error.stack || null));
window.addEventListener('unhandledrejection', ev => sgBancJournal('erreur', 'Promesse rejetée : ' + (ev.reason && ev.reason.message || ev.reason), ev.reason && ev.reason.stack || null));

/* Épreuves du papier (agent 1) — documents sans contenu, pages aux orientations données */
const SGB_EPREUVES = [
  { nom:'epreuve_portrait',   o:{ titre:'Épreuve du papier Substances', epreuve:['portrait','portrait','portrait'] } },
  { nom:'epreuve_paysage',    o:{ titre:'Épreuve du papier Substances', epreuve:['paysage','paysage'] } },
  { nom:'epreuve_sous_titre', o:{ titre:'Épreuve du papier Substances', sousTitre:'Sous-titre facultatif - deuxième ligne', epreuve:['portrait'] } },
  { nom:'epreuve_mixte',      o:{ titre:'Épreuve du papier Substances', epreuve:['paysage','portrait','paysage'] } }
];

const sgbBin = async (u) => { const r = await fetch(u); if(!r.ok) throw new Error(u + ' : HTTP ' + r.status); return new Uint8Array(await r.arrayBuffer()); };
const sgbJson = async (u) => { const r = await fetch(u); if(!r.ok) throw new Error(u + ' : HTTP ' + r.status); return r.json(); };
const sgbEnvoyer = async (nom, corps) => { const r = await fetch('/enregistrer?nom=' + encodeURIComponent(nom), { method:'POST', body:corps }); if(!r.ok) throw new Error('enregistrement ' + nom + ' : HTTP ' + r.status); };

function sgbCadre(){
  return new Promise((ok, ko) => {
    const f = document.createElement('iframe');
    f.style.display = 'none';
    f.srcdoc = '<!doctype html><meta charset="utf-8"><script src="/res/pdf-lib.min.js"><\/script><script src="/res/fontkit.umd.min.js"><\/script>';
    f.onload = () => { const w = f.contentWindow; (w.PDFLib && w.fontkit) ? ok(w) : ko(new Error('cadre : pdf-lib ou fontkit absent')); };
    document.body.appendChild(f);
  });
}

function sgbNom(i, d){
  return String(i).padStart(3, '0') + '_' + String(d.fichier || d.type || 'document').replace(/\.[A-Za-z]+$/, '').replace(/[^A-Za-z0-9_\-]+/g, '_') + '_j' + (d.jeu == null ? '' : d.jeu) + '.pdf';
}

function sgbChoisir(sel, types){
  const out = [], vus = new Set();
  const ajouter = (x) => { const k = x.e ? 'e:' + x.e.nom : (x.ref ? 'ref' : 'd:' + x.i); if(!vus.has(k)){ vus.add(k); out.push(x); } };
  String(sel || 'epreuve').split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
    if(s === 'tous') types.forEach((d, i) => ajouter({ i, d }));
    else if(s === 'epreuve') SGB_EPREUVES.forEach(e => ajouter({ e }));
    else if(s === 'reference') ajouter({ ref:true });
    else if(/^\d+$/.test(s)){ const i = +s; if(types[i]) ajouter({ i, d:types[i] }); else sgBancJournal('erreur', 'Index hors liste : ' + s); }
    else if(/^\d+-\d+$/.test(s)){ const [a, b] = s.split('-').map(Number); for(let i = a; i <= b && i < types.length; i++) ajouter({ i, d:types[i] }); }
    else {
      const sansExt = (f) => String(f || '').replace(/\.[A-Za-z]+$/, '');
      const m = types.map((d, i) => ({ i, d })).filter(x => x.d.id === s || x.d.fichier === s || x.d.type === s || sansExt(x.d.fichier) === s);
      if(!m.length) sgBancJournal('erreur', 'Sélection inconnue : ' + s);
      m.forEach(ajouter);
    }
  });
  return out;
}

async function sgbTexte(octets){
  /* texte de chaque page par pdf.js (copie : pdf.js détache le tampon) */
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/res/pdf.worker.min.js';
  const pdf = await pdfjsLib.getDocument({ data:new Uint8Array(octets), isEvalSupported:false }).promise;
  const pages = [];
  for(let n = 1; n <= pdf.numPages; n++){
    const pg = await pdf.getPage(n); const tc = await pg.getTextContent();
    let t = '', y = null;
    tc.items.forEach(it => { const yy = it.transform ? Math.round(it.transform[5] * 10) / 10 : y; if(y !== null && yy !== y) t += '\n'; else if(t && !t.endsWith(' ')) t += ' '; t += it.str; y = yy; });
    pages.push('=== page ' + n + ' ===\n' + t + '\n');
  }
  await pdf.destroy();
  return pages.join('\n');
}

async function sgBancLancer(){
  const t0 = performance.now();
  const bilan = { etat:'fini', sel:SGB_Q.get('sel') || 'epreuve', docs:0, ok:0, erreurs:0, pages:0, fichiers:[] };
  try{
    if(typeof sgDsPdf !== 'function') throw new Error('sgDsPdf absente : subgestion3/sg3_docsub.js non chargé ou en erreur');
    const [light, regular, bold, lightItalic, offre, facture, tss, rss, types] = await Promise.all([
      sgbBin('/res/AKKU_LIGHT.ttf'), sgbBin('/res/AKKU_REGULAR.ttf'), sgbBin('/res/AKKU_BOLD.ttf'), sgbBin('/res/AKKU_LIGHTITALIC.ttf'),
      sgbBin('/res/OFFRE_TMPL.pdf'), sgbBin('/res/FA_TMPL.pdf'), sgbJson('/res/textstyleset.json'), sgbJson('/res/rowstyleset.json'),
      sgbJson('/res/documents_types.json') ]);
    const cadre = SGB_Q.get('cadre') !== '0';
    const W = cadre ? await sgbCadre() : window;
    /* chaines=1 : polices et gabarits passés en chaînes « data:…;base64,… », comme dans l'app (w.eval('AKKU_LIGHT'), w.eval('OFFRE_TMPL')) */
    const enData = (u8, type) => { let b = ''; for(let i = 0; i < u8.length; i += 0x8000) b += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return 'data:' + type + ';base64,' + btoa(b); };
    const ch = SGB_Q.get('chaines') === '1';
    const pol = (u8) => ch ? enData(u8, 'font/ttf') : u8, gab = (u8) => ch ? enData(u8, 'application/pdf') : u8;
    const R = { PDFLib:W.PDFLib, fontkit:W.fontkit, polices:{ light:pol(light), regular:pol(regular), bold:pol(bold), lightItalic:pol(lightItalic) },
                gabarits:{ offre:gab(offre), facture:gab(facture) }, styles:{ textstyleset:tss, rowstyleset:rss } };
    const fn = W.Function('return (' + sgDsPdf.toString() + ')')();
    const dp = (SGB_Q.get('date') || '2026-10-25').split('-').map(Number);
    const date = new W.Date(dp[0], dp[1] - 1, dp[2]);
    const texte = SGB_Q.get('texte') === '1', zones = SGB_Q.get('zones') === '1';
    const liste = sgbChoisir(bilan.sel, types);
    bilan.docs = liste.length;
    sgBancJournal('info', liste.length + ' document(s) à rendre' + (cadre ? ' (cadre séparé)' : ' (même page)'));
    for(const x of liste){
      let nom = x.e ? x.e.nom + '.pdf' : (x.ref ? 'reference_contrat.pdf' : sgbNom(x.i, x.d));
      const t1 = performance.now(), alertes = [];
      try{
        let octets;
        if(x.ref){
          /* référence « contrat » : instructions d'offrePDFBytes recopiées (reference_contrat.js), dans la page */
          octets = await sgBancReference({ PDFLib, fontkit, polices:{ light, bold }, gabarits:{ offre, facture } },
            { titre:'ÉPREUVE DU PAPIER SUBSTANCES', sousTitre:'SOUS-TITRE FACULTATIF - DEUXIÈME LIGNE', date:'CULLY - 25 OCTOBRE 2026' });
        } else if(x.e){
          octets = await fn(R, null, Object.assign({ date, journal:alertes, zones }, x.e.o));
        } else {
          const d = x.d;
          octets = await fn(R, d.report, { titre:d.report && d.report.reportTitle, date, jeu:d.jeu, type:d.type, description:d.description, journal:alertes, zones });
        }
        const copie = new Uint8Array(octets);
        await sgbEnvoyer(nom, copie);
        const pdf = await PDFLib.PDFDocument.load(copie);
        const ori = pdf.getPages().map(p => p.getWidth() > p.getHeight() ? 'paysage' : 'portrait');
        if(texte) await sgbEnvoyer(nom.replace(/\.pdf$/, '.txt'), await sgbTexte(copie));
        bilan.ok++; bilan.pages += ori.length;
        const ent = { nom, index:x.i == null ? null : x.i, id:x.d ? x.d.id : null, pages:ori.length, orientations:ori, octets:copie.length,
                      ms:Math.round(performance.now() - t1), alertes };
        bilan.fichiers.push(ent);
        sgBancJournal('ok', nom, ent);
      }catch(e){
        bilan.erreurs++;
        bilan.fichiers.push({ nom, index:x.i == null ? null : x.i, id:x.d ? x.d.id : null, erreur:String(e && e.message || e) });
        sgBancJournal('erreur', nom + ' : ' + (e && e.message || e), e && e.stack || null);
      }
    }
  }catch(e){
    bilan.etat = 'échec'; bilan.erreurs++; bilan.message = String(e && e.message || e);
    await sgBancJournal('erreur', 'Banc : ' + bilan.message, e && e.stack || null);
  }
  bilan.ms = Math.round(performance.now() - t0);
  await fetch('/fin', { method:'POST', body:JSON.stringify(bilan) }).catch(() => {});
  try{ document.getElementById('etat').textContent += '\nFini.'; }catch(_){ }
}

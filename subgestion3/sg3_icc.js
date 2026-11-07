/* ═══ Bloc 47 · Indice des prix de la construction du devis (07.11.2026) ═══
   Paulo : « je souhaite que ce soit un indice que tu mets à jour toi automatiquement, c'est un indice que je ne souhaite pas modifier manuellement ; je souhaite que cet indice se
   mette à jour lors de la création du devis et que tu indiques sur la base de quel indice avec l'année ».
   Source : Office fédéral de la statistique (OFS), Indice suisse des prix de la construction, tableau cc-t-05.05.01 « Évolution des prix de la construction (multibases) —
   valeurs de l'indice par grande région et par type d'objet », série Région lémanique (VD, VS, GE) · Bâtiment (codes <REG_02>, <OBJ_03> du tableau). Publication deux fois par
   an : valeurs d'avril en juin, valeurs d'octobre en décembre ; une feuille par base (octobre 1998, 2010, 2015, 2020, 2025 = 100).
   Lecture : dam-api.bfs.admin.ch (accès ouvert depuis une page web), au démarrage puis tous les 3 jours ; le fichier n'est téléchargé que si l'OFS en a publié un nouveau ;
   valeurs gardées dans le navigateur (localStorage sg3_icc) ; valeurs intégrées ICC_INT (tableau publié le 18.06.2026, jusqu'à avril 2026) si l'OFS est injoignable.
   Devis :
   - à la création (ch02dNewContent, ch02dCopy : nouveau devis, Dupliquer, Dupliquer et modifier, import) : dernière valeur publiée, base la plus récente, enregistrée dans le
     devis — reglages.indiceIcc {v, p (période AAAA-MM), base, le (jour de la création)} et reglages.indice (la valeur, lue par les anciens modèles d'impression) ;
   - devis créé avant : indice calculé d'après la date du devis (dernière publication de l'OFS à cette date, base en vigueur à cette date) ; rien n'est écrit pour autant ;
   - jamais saisi à la main : Paramètres ▸ Indice en lecture seule, avec la série, la période et la base ; anciens modèles (constructionIndex) : la même valeur.
   Débogage : window.SGICC. */
(()=>{
const ICC_SERIE='Indice suisse des prix de la construction (OFS), région lémanique (VD, VS, GE), bâtiment';
const ICC_CLE='sg3_icc', ICC_API='https://dam-api.bfs.admin.ch/hub/api/dam/assets', ICC_TAB='cc-t-05.05.01', ICC_REG='<REG_02>', ICC_OBJ='<OBJ_03>';
/* valeurs intégrées : par base, période de départ et valeurs semestrielles (avril, octobre) */
const ICC_FMT=1;   /* version de la lecture du tableau : une copie lue par une autre version est relue */
const ICC_INT={publie:'2026-06-18',maj:'2026-07-27T05:38:00Z',damId:36655414,fmt:ICC_FMT,bases:{"1998":{"d":"1998-10","v":[100.0,101.1,104.0,106.5,108.8,111.5,111.4,113.1,112.5,112.5,111.9,113.0,115.0,117.0,118.6,121.2,123.7,125.9,128.6,130.9,132.7,130.7,130.7,130.6,131.3,133.6,134.4,133.4,133.7,134.1,135.0,134.7,134.1,133.2,134.5,132.9,132.1,132.3,132.4,132.8,132.9,133.1,133.6,133.6,133.3,134.7,138.2,144.6,148.5,151.2,151.5,151.4,152.1,153.2,154.3,154.7]},"2010":{"d":"1998-10","v":[76.1,77.0,79.2,81.1,82.9,84.9,84.9,86.1,85.6,85.7,85.2,86.0,87.6,89.1,90.3,92.3,94.2,95.9,97.9,99.7,101.1,99.5,99.6,99.4,100.0,101.8,102.3,101.6,101.8,102.1,102.8,102.6,102.1,101.4,102.4,101.2,100.6,100.7,100.8,101.1,101.2,101.3,101.7,101.8,101.5,102.5,105.2,110.1,113.1,115.1,115.4,115.3,115.8,116.7,117.5,117.8]},"2015":{"d":"1998-10","v":[74.3,75.2,77.3,79.2,80.9,82.9,82.8,84.1,83.6,83.6,83.2,84.0,85.5,87.0,88.2,90.1,92.0,93.6,95.6,97.3,98.7,97.2,97.2,97.1,97.6,99.3,99.9,99.2,99.4,99.7,100.3,100.1,99.7,99.0,100.0,98.8,98.2,98.3,98.4,98.7,98.8,98.9,99.3,99.3,99.1,100.1,102.7,107.5,110.4,112.4,112.6,112.5,113.0,113.9,114.7,115.0]},"2020":{"d":"1998-10","v":[75.0,75.9,78.1,79.9,81.7,83.7,83.6,84.9,84.4,84.4,83.9,84.7,86.3,87.8,89.0,91.0,92.8,94.5,96.5,98.2,99.6,98.1,98.1,98.0,98.5,100.3,100.8,100.1,100.3,100.6,101.3,101.1,100.6,99.9,100.9,99.7,99.1,99.3,99.4,99.6,99.7,99.8,100.2,100.3,100.0,101.0,103.7,108.5,111.4,113.4,113.7,113.6,114.1,114.9,115.7,116.1]},"2025":{"d":"1998-10","v":[64.8,65.6,67.4,69.1,70.5,72.3,72.2,73.3,72.9,72.9,72.5,73.2,74.5,75.8,76.9,78.6,80.2,81.6,83.3,84.9,86.0,84.7,84.7,84.6,85.1,86.6,87.1,86.5,86.7,86.9,87.5,87.3,86.9,86.3,87.2,86.2,85.6,85.8,85.8,86.1,86.1,86.3,86.6,86.6,86.4,87.3,89.6,93.7,96.2,98.0,98.2,98.1,98.6,99.3,100.0,100.3]}}};
const MOIS={'04':'avril','10':'octobre'}, RX_P=/^\d{4}-(04|10)$/;
const suiv=p=>{ const y=+p.slice(0,4); return p.slice(5)==='04'?y+'-10':(y+1)+'-04'; };
const pub=p=>p.slice(0,4)+(p.slice(5)==='04'?'-06-20':'-12-20');   /* publication de l'OFS (vers le 20 juin et le 20 décembre) */
const jour=()=>{ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
const dfr=d=>{ const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(d||'')); return m?m[3]+'.'+m[2]+'.'+m[1]:String(d||''); };
/* série d'une base : [{p, v}] sans les valeurs manquantes */
function serie(D,b){ const s=D&&D.bases&&D.bases[b]; if(!s||!RX_P.test(String(s.d))||!Array.isArray(s.v)) return []; const L=[]; let p=s.d;
  s.v.forEach(v=>{ if(v!=null&&isFinite(+v)) L.push({p,v:Math.round(+v*10)/10}); p=suiv(p); }); return L; }
const basesDe=D=>Object.keys((D&&D.bases)||{}).filter(b=>/^\d{4}$/.test(b)&&serie(D,b).length).map(Number).sort((a,b)=>a-b);
const finDe=D=>{ const B=basesDe(D); if(!B.length) return ''; const s=serie(D,B[B.length-1]); return B[B.length-1]+':'+s[s.length-1].p; };
/* données : celles lues sur le site de l'OFS si elles vont plus loin que les valeurs intégrées, ou aussi loin dans une version du fichier au moins aussi récente (l'OFS remplace
   parfois un fichier publié sans changer son numéro : lastUpdatedVersion) */
const cache=()=>{ let c=null; try{ c=JSON.parse(localStorage.getItem(ICC_CLE)||'null'); }catch(_){ } return c&&c.bases&&c.fmt===ICC_FMT?c:null; };
function donnees(){ const c=cache(); if(!c) return ICC_INT; const a=finDe(c), b=finDe(ICC_INT); return a>b||(a===b&&String(c.maj||'')>=String(ICC_INT.maj))?c:ICC_INT; }
/* une nouvelle publication est attendue (date de publication de la période suivante passée) : relecture plus fréquente */
function attendu(){ const D=donnees(), B=basesDe(D); if(!B.length) return true; const s=serie(D,B[B.length-1]); return pub(suiv(s[s.length-1].p))<=jour(); }
/* dernière valeur publiée, base la plus récente (création d'un devis) */
function actuel(){ const D=donnees(), B=basesDe(D); if(!B.length) return null; const b=B[B.length-1], s=serie(D,b), x=s[s.length-1]; return {v:x.v,p:x.p,base:b}; }
/* valeur en vigueur à une date : base introduite avec les valeurs d'avril de l'année suivante, dernière période publiée à cette date */
function a(date){ const d=String(date||'').slice(0,10); if(!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null; const D=donnees(), B=basesDe(D); if(!B.length) return null;
  const enV=B.filter(b=>pub((b+1)+'-04')<=d), b=enV.length?enV[enV.length-1]:B[0], s=serie(D,b).filter(x=>pub(x.p)<=d), x=s[s.length-1];
  return x?{v:x.v,p:x.p,base:b}:null; }
/* indice d'un devis : celui enregistré à la création, sinon celui de la date du devis */
function devis(E,doc){ const R=((E||{}).reglages)||{}, k=R.indiceIcc;
  if(k&&isFinite(+k.v)&&RX_P.test(String(k.p||''))&&/^\d{4}$/.test(String(k.base||''))) return {v:+k.v,p:k.p,base:+k.base,le:k.le||'',src:k.src||'',auto:true};
  let d=''; try{ d=ch02aDate(E,doc); }catch(_){ } d=String(d||'').slice(0,10)||jour(); const x=a(d); return x?Object.assign(x,{date:d,calc:true}):null; }
const val=x=>(+x.v).toFixed(1);
const periode=x=>MOIS[x.p.slice(5)]+' '+x.p.slice(0,4);
const base=x=>'base octobre '+x.base+' = 100';
/* « 100.3 — avril 2026, base octobre 2025 = 100 » */
const texte=x=>x?val(x)+' — '+periode(x)+', '+base(x):'';
const origine=x=>!x?'':x.auto?'Repris de l’OFS à la création du devis'+(x.le?' (le '+dfr(x.le)+')':'')+'.':'Devis créé avant la reprise automatique : dernière publication de l’OFS au '+dfr(x.date)+', date du devis.';
/* ── à la création d'un devis : dernière valeur publiée ── */
const poser=C=>{ try{ const x=actuel(); if(!x||!C||typeof C!=='object') return C; const R=C.reglages||(C.reglages={});
  R.indiceIcc={v:x.v,p:x.p,base:x.base,le:jour(),src:String(donnees().publie||''),serie:'OFS '+ICC_TAB+' '+ICC_REG+' '+ICC_OBJ}; R.indice=val(x); }catch(e){ console.error(e); } return C; };
{ const n0=ch02dNewContent; ch02dNewContent=function(){ return poser(n0.apply(this,arguments)); }; }
{ const c0=ch02dCopy; ch02dCopy=function(){ return poser(c0.apply(this,arguments)); }; }
/* ── Paramètres (fenêtre du moteur, gardée) : indice affiché, jamais repris de la saisie ── */
{ const i0=ch02aPrefInit; ch02aPrefInit=function(E,doc){ const v=i0.apply(this,arguments); try{ const x=devis(E,doc); v.indice=x?val(x):''; }catch(e){ console.error(e); } return v; }; }
{ const a0=ch02aPrefApply; ch02aPrefApply=function(E,v){ const r=a0.apply(this,arguments); try{ const R=E&&E.reglages; const x=R?devis(E,null):null; if(R&&x) R.indice=val(x); }catch(e){ console.error(e); } return r; }; }
{ const s0=ch02aSettings; ch02aSettings=function(X){ const D=s0.apply(this,arguments);
    try{ const bd=D&&D.bd, lab=bd&&[...bd.querySelectorAll('.form>label')].find(l=>l.textContent.trim()===CH02A_PREF.index), inp=lab&&lab.nextElementSibling;
      if(inp&&inp.tagName==='INPUT'){ const x=devis(X.E,ch02aHdr(X)); inp.readOnly=true; inp.tabIndex=-1; inp.style.background='var(--s-gris3,#f2f2f2)'; inp.title=ICC_SERIE+' — mis à jour automatiquement';
        const n=document.createElement('div'); n.style.cssText='font-size:12px;color:var(--s-gris,#706f6f);line-height:1.35;margin-top:4px;max-width:420px';
        n.textContent=x?ICC_SERIE+' : '+texte(x)+'. '+origine(x):'Indice indisponible.'; const w=document.createElement('div'); inp.replaceWith(w); w.append(inp,n); } }catch(e){ console.error(e); }
    return D; }; }
/* ── anciens modèles d'impression (constructionIndex) : la valeur du devis, le temps du calcul des champs ── */
const avec=(E,doc,f)=>{ const G=E&&E.reglages; let x=null; try{ x=G?devis(E,doc):null; }catch(_){ } if(!x) return f(); const old=G.indice; G.indice=val(x); try{ return f(); } finally{ G.indice=old; } };
{ const f0=ch02bFields; ch02bFields=function(R,pg){ const t=this, A=arguments; return avec(R&&R.E,R&&R.doc,()=>f0.apply(t,A)); }; }
{ const f0=ch02cFields; ch02cFields=function(c,K,rep){ const t=this, A=arguments; return avec(c&&c.E,c&&c.doc,()=>f0.apply(t,A)); }; }

/* ── lecture du tableau de l'OFS ── */
/* fichiers d'un .zip (xlsx) : répertoire central, puis données « stored » ou « deflate » (DecompressionStream) */
async function dezip(buf,garder){ const dv=new DataView(buf), u8=new Uint8Array(buf), td=new TextDecoder(); let e=buf.byteLength-22;
  while(e>=0&&dv.getUint32(e,true)!==0x06054b50) e--; if(e<0) throw new Error('fichier zip illisible');
  const n=dv.getUint16(e+10,true); let p=dv.getUint32(e+16,true); const out={};
  for(let i=0;i<n;i++){ if(dv.getUint32(p,true)!==0x02014b50) throw new Error('répertoire zip illisible');
    const meth=dv.getUint16(p+10,true), cs=dv.getUint32(p+20,true), nl=dv.getUint16(p+28,true), xl=dv.getUint16(p+30,true), cl=dv.getUint16(p+32,true), lo=dv.getUint32(p+42,true), nom=td.decode(u8.subarray(p+46,p+46+nl));
    p+=46+nl+xl+cl; if(!garder(nom)) continue;
    const d0=lo+30+dv.getUint16(lo+26,true)+dv.getUint16(lo+28,true), d=u8.slice(d0,d0+cs);
    if(meth===0) out[nom]=td.decode(d); else if(meth===8) out[nom]=await new Response(new Blob([d]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text(); }
  return out; }
const xml=t=>new DOMParser().parseFromString(t,'application/xml');
const colDe=ref=>String(ref||'').replace(/\d+/g,'');
/* séries de la région lémanique, bâtiment, pour chaque feuille de base (« 1998 », « 2010 »… « 2025 ») */
async function lireXlsx(buf){ const F=await dezip(buf,n=>/^xl\/(workbook\.xml|_rels\/workbook\.xml\.rels|sharedStrings\.xml|worksheets\/sheet\d+\.xml)$/.test(n));
  if(!F['xl/workbook.xml']||!F['xl/_rels/workbook.xml.rels']) throw new Error('classeur incomplet');
  const ss=F['xl/sharedStrings.xml']?[...xml(F['xl/sharedStrings.xml']).getElementsByTagName('si')].map(si=>[...si.getElementsByTagName('t')].map(t=>t.textContent).join('')):[];
  const rel={}; [...xml(F['xl/_rels/workbook.xml.rels']).getElementsByTagName('Relationship')].forEach(r=>{ rel[r.getAttribute('Id')]=r.getAttribute('Target'); });
  const bases={};
  [...xml(F['xl/workbook.xml']).getElementsByTagName('sheet')].forEach(sh=>{ const nom=String(sh.getAttribute('name')||'').trim(); if(!/^\d{4}$/.test(nom)) return;
    const tg=String(rel[sh.getAttribute('r:id')]||'').replace(/^\/?xl\//,''), src=F['xl/'+tg]; if(!src) return;
    const rows=[...xml(src).getElementsByTagName('row')].map(r=>{ const o={}; [...r.getElementsByTagName('c')].forEach(c=>{ const t=c.getAttribute('t'), v=c.getElementsByTagName('v')[0];
      let x=v?v.textContent:''; if(t==='s'&&x!=='') x=ss[+x]||''; else if(t==='inlineStr') x=[...c.getElementsByTagName('t')].map(q=>q.textContent).join(''); o[colDe(c.getAttribute('r'))]=x; }); return o; });
    const iM=rows.findIndex(o=>Object.values(o).filter(v=>/^(okt|oct|apr|avr)/i.test(String(v).trim())).length>=10); if(iM<0||!rows[iM+1]) return;
    const mois=rows[iM], ann=rows[iM+1]; let reg=null, lig=null;
    rows.forEach(o=>{ const A=String(o.A||'').trim(); if(/^<REG_/.test(A)) reg=A; if(reg===ICC_REG&&A===ICC_OBJ&&!lig) lig=o; }); if(!lig) return;
    const L=[]; Object.keys(mois).forEach(c=>{ const m=String(mois[c]).trim(), y=String(ann[c]||'').trim(), mm=/^(okt|oct)/i.test(m)?'10':/^(apr|avr)/i.test(m)?'04':''; if(!mm||!/^\d{4}$/.test(y)) return;
      const v=parseFloat(String(lig[c]==null?'':lig[c]).replace(',','.')); L.push({p:y+'-'+mm,v:isFinite(v)?Math.round(v*10)/10:null}); });
    L.sort((x,y)=>x.p<y.p?-1:x.p>y.p?1:0); if(L.length<20) return;
    for(let i=1;i<L.length;i++) if(L[i].p!==suiv(L[i-1].p)) return;   /* périodes à la suite, sinon la feuille est ignorée */
    bases[nom]={d:L[0].p,v:L.map(x=>x.v)}; });
  if(!Object.keys(bases).length) throw new Error('série région lémanique, bâtiment introuvable');
  return bases; }
let ICC_COURS=null;
/* nouvelle lecture si la dernière vérification a plus de 3 jours, ou plus de 6 heures quand une publication est attendue (force : tout de suite) ; fichier téléchargé
   seulement si l'OFS en a publié un autre ou l'a remplacé (lastUpdatedVersion), ou si la copie vient d'une autre version de la lecture */
function rafraichir(force){ if(ICC_COURS) return ICC_COURS;
  ICC_COURS=(async()=>{ const c=cache();
    if(!force&&c&&c.verif&&Date.now()-Date.parse(c.verif)<(attendu()?6*3600e3:3*864e5)) return c;
    const r=await fetch(ICC_API+'?orderNr='+encodeURIComponent(ICC_TAB)+'&limit=10',{cache:'no-store'}); if(!r.ok) throw new Error('OFS : réponse '+r.status);
    const j=await r.json(), A=((j&&j.data)||[]).filter(x=>x&&x.ids&&x.bfs&&x.bfs.lifecycleGroup==='CURRENT').sort((x,y)=>String(y.bfs.embargo||'').localeCompare(String(x.bfs.embargo||'')))[0];
    if(!A) throw new Error('OFS : tableau '+ICC_TAB+' introuvable');
    const id=A.ids.damId, publie=String(A.bfs.embargo||'').slice(0,10), maj=String(A.bfs.lastUpdatedVersion||A.bfs.embargo||''), maintenant=new Date().toISOString();
    if(c&&c.damId===id&&String(c.maj||'')===maj){ c.verif=maintenant; try{ localStorage.setItem(ICC_CLE,JSON.stringify(c)); }catch(_){ } return c; }
    const f=await fetch(ICC_API+'/'+id+'/master',{cache:'no-store'}); if(!f.ok) throw new Error('OFS : fichier, réponse '+f.status);
    const n={damId:id,publie,maj,fmt:ICC_FMT,verif:maintenant,lu:maintenant,bases:await lireXlsx(await f.arrayBuffer())};
    if(finDe(n)<finDe(ICC_INT)) throw new Error('OFS : tableau plus ancien que les valeurs intégrées');
    try{ localStorage.setItem(ICC_CLE,JSON.stringify(n)); }catch(_){ } return n; })().finally(()=>{ ICC_COURS=null; });
  return ICC_COURS; }
const relire=()=>{ rafraichir(false).catch(e=>console.info('Indice des prix de la construction :',e&&e.message||e)); };
setTimeout(relire,15000); setInterval(relire,6*3600e3);   /* app restée ouverte plusieurs jours : relecture toutes les 6 heures (sans téléchargement si rien n'a changé) */
/* juste avant la création d'un devis : la fenêtre d'en-tête (nom de la version…) lance une relecture, attendue au plus 4 s après OK, pour que le devis reçoive la dernière
   publication même si l'app est ouverte depuis longtemps */
{ const h0=ch02dHeadDialog; ch02dHeadDialog=async function(){ let P=null; try{ P=Promise.resolve(rafraichir(false)).catch(()=>{}); }catch(_){ }
    const v=await h0.apply(this,arguments); if(v&&P) await Promise.race([P,new Promise(r=>setTimeout(r,4000))]); return v; }; }
/* source affichée (Paramètres) : publication d'où vient l'indice enregistré dans le devis, sinon celle des données actuelles */
const source=x=>{ const d=x&&x.auto?x.src:donnees().publie; return 'OFS, tableau '+ICC_TAB+(d?' publié le '+dfr(d):''); };
window.SGICC={actuel,a,devis,texte,origine,source,serie:ICC_SERIE,rafraichir,lireXlsx,donnees,attendu,val,periode,base};
})();

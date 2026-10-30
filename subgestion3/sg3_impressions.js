/* ═══ 31. Impressions au papier des contrats (sg3_impressions.js, 30.10.2026) ═══
   Demande de Paulo (suite des Documents Substances) : « lors de l'impression du document conserver les couleurs des contrats, etc., de
   l'ensemble des écritures » ; choix : « Papier des contrats partout » — tout document imprimé depuis l'app sort avec les données réelles,
   au graphisme des contrats (en-tête, pied, logo noir puis gris, noir des contrats, gris de l'en-tête, rouge pour les montants) ; les
   anciens fonds de page et images des modèles ne sont plus imprimés. Fait par étapes, avec épreuves.

   ÉTAPE 1 — documents faits d'un modèle (.dpdoc, collection modeledocument : contrôle des coûts, devis, appels d'offres, lettres…).
   Ils passent tous par svDpHTML(rep, jobs, o) du moteur. Ici :
   - svDpHTML est enveloppé : le résultat garde son HTML (aperçu d'origine, inchangé) et reçoit un repère « sgimp:<id> » dans sa feuille
     de style ; (rep, jobs, o) sont gardés en mémoire (SGIMP.memo, 40 derniers) ;
   - le PDF est fait par sgDsPdf (bloc 30) avec les données : sgImpPreparer() met en forme dans l'app toutes les valeurs (svFmtVal, cellules
     comme svDpCell, colonnes svDpCols) et ne passe à sgDsPdf que du texte ; rien n'est écrit dans la base ;
   - la visionneuse du moteur (ch03bView) montre ce PDF à la place du HTML (mêmes boutons : Imprimer, PDF, Partager, Modifier les textes…) ;
   - « PDF » (aperçu, Sauvegarder et ouvrir, Enregistrer sous forme de fichier PDF, Partager, Joindre) : ch03aApi('/api/pdf') reconnaît le
     repère et rend ce PDF au lieu de faire imprimer le HTML par le Chrome du serveur de sauvegarde ;
   - svDpPrint / svbDpPrint (impressions directes : lettres et listes des appels d'offres…) ouvrent la même visionneuse au lieu d'une
     fenêtre d'impression du navigateur.
   DeltaSub.html seul garde ses impressions d'origine. */
if(typeof SG_DOM!=='undefined'&&typeof svDpHTML==='function'&&typeof sgDsPdf==='function'){
  const SGIMP={ memo:new Map(), n:0 };
  window.SGIMP=SGIMP;
  const sgImpTxt=v=>v==null?'':String(v);
  const sgImpIdDe=html=>{ const m=/\/\*sgimp:([a-z0-9]+)\*\//.exec(String(html||'')); return m?m[1]:null; };

  /* ── repère dans le résultat de svDpHTML (le HTML et l'aperçu d'origine ne changent pas) ── */
  const svDpHTML0=svDpHTML;
  svDpHTML=function(rep,jobs,o){ const R=svDpHTML0(rep,jobs,o), id=(++SGIMP.n).toString(36)+'x'+Date.now().toString(36);
    SGIMP.memo.set(id,{rep,jobs,o:o||{},titre:R.title}); while(SGIMP.memo.size>40) SGIMP.memo.delete(SGIMP.memo.keys().next().value);
    R.css=(R.css||'')+'\n/*sgimp:'+id+'*/'; return R; };

  /* ── cellule d'un tableau en texte : mêmes règles que svDpCell du moteur (vrai / faux, nombres, dates), sans HTML ── */
  const sgImpCellule=(c,r,set)=>{ const v=c.flexIndex!=null?((r.f||[])[c.flexIndex]):(r.c||[])[c.id];
    if(typeof v==='boolean'||(c.type==='booleanColumn'&&(v===1||v===0))) return sgImpTxt(v?(set.tText??'x'):(set.fText??''));
    if(c.type==='doubleColumn'||c.type==='flexColumn') return typeof v==='number'?num(rJ(v)):sgImpTxt(v);
    if(c.type==='dateColumn') return /^\d{4}-\d{2}-\d{2}/.test(v||'')?dfr(v):sgImpTxt(v);
    return sgImpTxt(v); };
  const sgImpProjet=F=>{ const p=F&&F.project&&F.project.t==='project'?F.project.p:null; return p?[p.NUMBER,p.TITLE].filter(x=>x!=null&&String(x).trim()).join(' - '):''; };
  const sgImpDate=F=>{ for(const k of ['docDate','reportDate','date']){ const v=F&&F[k]; if(v&&v.t==='date'&&/^\d{4}-\d{2}-\d{2}/.test(v.v||'')) return v.v.slice(0,10); } return today(); };

  /* ── préparation : copie du modèle (tableaux repérés par _sgk), valeurs des champs et des tableaux de chaque exemplaire ── */
  const sgImpPreparer=E=>{ const rep=JSON.parse(JSON.stringify(E.rep||{})), o=E.o||{};
    const secs=(rep.sections||[]).filter(s=>s&&s.isVisible!==false), tabs=[], champs=new Map(), images=new Set();
    secs.forEach(s=>(s.bands||[]).forEach(b=>{ if(!b||b.isH) return;
      if(b.class==='TableBand'){ b._sgk='t'+tabs.length; tabs.push(b); }
      if(b.class==='TextBand'&&b.c&&b.c.class==='Image'&&!b.c.n) images.add(String(b.c.f||'').split('|').pop()); }));
    const voir=x=>{ if(Array.isArray(x)){ x.forEach(voir); return; } if(!x||typeof x!=='object') return;
      if(x.class==='TextField') champs.set(String(x.f||'')+'\u0001'+(x.s||'standard'),x); for(const k in x) voir(x[k]); };
    secs.forEach(s=>voir(s.bands));
    const RS=svRowStyles(rep), gras=st=>/regular|medium|bold|black|heavy/i.test(String(((RS[st]||RS.tr)||{}).font||''));
    const titreDef=rep.reportTitle||o.title||'';
    const jobs=(E.jobs&&E.jobs.length?E.jobs:[{F:{}}]).map(job=>{ const F=job.F||{}, tb=job.tables||{}, V={}, T={}, I={};
      champs.forEach((x,k)=>{ const n=String(x.f||'').split('|').pop(); if(/^(reportTitle|pageNumber|nofPages|sectionTitle)$/.test(n)) return;
        try{ V[k]=sgImpTxt(svFmtVal(svField(F,x.f),x.s)); }catch(_){ V[k]=''; } });
      tabs.forEach(b=>{ const nom=String(b.f||'').split('|').pop(), data=tb[nom]||tb.table||{rows:[]};
        const set=(b.tableSettings||[]).find(s=>data.setting&&s.name===data.setting)||(b.tableSettings||[])[0]; if(!set) return;
        const cols=svDpCols(set,data);
        T[b._sgk]={tete:set.isHV!==false,
          cols:cols.map(c=>({id:c.id,titre:sgImpTxt(c.isHC&&c.customH!=null&&c.customH!==''?c.customH:c.name),pw:+c.pw||0,isAE:!!c.isAE,
            ha:c.ha||(c.type==='doubleColumn'||c.type==='flexColumn'?'right':'left'),   /* nombres sans alignement donné : à droite, comme les montants des contrats */
            num:c.type==='doubleColumn'||c.type==='flexColumn'||c.ha==='right'})),   /* colonne de nombres (le moteur écrit souvent les montants en texte, alignés à droite) */
          rows:(data.rows||[]).map(r=>{ const st=r.st||'tr';
            return {st,gras:gras(st),fuse:!!r.fuse,c:r.fuse?[sgImpTxt((r.c||[])[cols[0]&&cols[0].id])]:cols.map(c=>sgImpCellule(c,r,set))}; })}; });
      images.forEach(n=>{ let im=(job.images||{})[n]; if(!im&&typeof ch08cSigFor==='function') try{ im=ch08cSigFor(n,F); }catch(_){ im=null; }
        if(im&&/^data:image\/(png|jpe?g)/i.test(String(im.data||''))) I[n]=im.data; });
      return {titre:job.title||o.title||E.titre||titreDef,titreChamp:job.title||titreDef,sousTitre:sgImpProjet(F),date:sgImpDate(F),V,T,I}; });
    return {rep,jobs}; };

  /* ── PDF d'un document repéré (gardé avec lui : même document, même PDF) ── */
  const sgImpPdf=async id=>{ const E=SGIMP.memo.get(id);
    if(!E) throw new Error('Document trop ancien : fermez-le puis rouvrez-le.');
    if(E.pdf) return E.pdf;
    const P=E.prep||sgImpPreparer(E), {w,R,fn}=await SGDS.ressources(), journal=new w.Array();
    const opt=w.JSON.parse(JSON.stringify({titre:P.jobs[0].titre,date:P.jobs[0].date,jobs:P.jobs,type:E.o.type||'',jeu:E.o.jeu||''}));
    opt.journal=journal;
    const oct=await fn(R,w.JSON.parse(JSON.stringify(P.rep)),opt);
    if(journal.length) console.info('Impression « '+P.jobs[0].titre+' » :',Array.from(journal));
    E.pdf=new Blob([oct],{type:'application/pdf'}); return E.pdf; };
  SGIMP.pdf=sgImpPdf; SGIMP.preparer=id=>sgImpPreparer(SGIMP.memo.get(id));

  /* ── « PDF » des visionneuses du moteur : document repéré → ce PDF (sans le Chrome du serveur de sauvegarde) ── */
  const ch03aApi1=ch03aApi;
  ch03aApi=async function(url,o){ o=o||{}; const meth=String(o.method||'GET').toUpperCase();
    /* moteur PDF toujours présent : les documents repérés n'ont plus besoin du Chrome du serveur de sauvegarde (les autres HTML, si le
       serveur manque, reçoivent le message habituel « lancez le serveur de sauvegarde ») */
    if(/^\/api\/pdf(\?|$)/.test(String(url))&&meth==='GET'){ const r=await ch03aApi1(url,o); return Object.assign({},r,{chrome:r&&r.chrome||'SUBGestion (papier des contrats)'}); }
    if(/^\/api\/pdf(\?|$)/.test(String(url))&&meth==='POST'){ let c={}; try{ c=JSON.parse(String(o.body||'{}')); }catch(_){ c={}; }
      const id=sgImpIdDe(c.html);
      if(id){ const pdf=await sgImpPdf(id), buf=await pdf.arrayBuffer();
        if(c.apercu){ const a='ap'+Date.now().toString(36); SG_APERCUS[a]=pdf; return {ok:true,apercu:a,taille:pdf.size,pages:await sgCompterPages(buf)}; }
        return Object.assign({ok:true},await sgFichierRanger(pdf,'document.pdf')); } }
    return ch03aApi1(url,o); };

  /* ── visionneuse du moteur : le cadre montre le PDF du document repéré (le zoom, propre au HTML, est masqué) ── */
  const SRCDOC=Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,'srcdoc');
  const sgImpMontrer=(ifr,html)=>{ const id=sgImpIdDe(html); if(!id||ifr._sgimp===id) return; ifr._sgimp=id;
    SRCDOC.set.call(ifr,'<!doctype html><meta charset="utf-8"><body style="font:13px Akkurat,Helvetica,Arial,sans-serif;color:#555;padding:20px">Préparation du document…</body>');
    sgImpPdf(id).then(pdf=>{ if(ifr._sgimp!==id) return; if(ifr._sgurl) URL.revokeObjectURL(ifr._sgurl);
      ifr._sgurl=URL.createObjectURL(pdf); ifr.removeAttribute('sandbox'); ifr.removeAttribute('srcdoc'); ifr.src=ifr._sgurl; },
    e=>{ console.error(e); if(ifr._sgimp!==id) return; ifr._sgimp=null;
      SRCDOC.set.call(ifr,'<!doctype html><meta charset="utf-8"><body style="font:13px Akkurat,Helvetica,Arial,sans-serif;color:#b00;padding:20px">'+esc('PDF impossible : '+(e&&e.message||e))+'</body>'); }); };
  const ch03bView0=ch03bView;
  ch03bView=function(titre,src,o){ const html=typeof src==='string'?src:(src&&src.css!=null?String(src.css):'');
    if(!sgImpIdDe(html)) return ch03bView0(titre,src,o);
    let ifr=null;
    Object.defineProperty(HTMLIFrameElement.prototype,'srcdoc',{configurable:true,enumerable:SRCDOC.enumerable,get:SRCDOC.get,
      set(v){ if(!ifr&&sgImpIdDe(v)){ ifr=this;
        Object.defineProperty(this,'srcdoc',{configurable:true,get:()=>'',set:x=>{ if(sgImpIdDe(x)) sgImpMontrer(this,x); else SRCDOC.set.call(this,x); }});
        sgImpMontrer(this,v); return; }
        SRCDOC.set.call(this,v); }});
    let V; try{ V=ch03bView0(titre,src,o); } finally { Object.defineProperty(HTMLIFrameElement.prototype,'srcdoc',SRCDOC); }
    try{ const z=V&&V.bd&&V.bd.parentNode&&V.bd.parentNode.querySelector('select[title="Zoom"]'); if(z) z.style.display='none'; }catch(_){}
    if(ifr){ const fermer=V.close; V.close=function(){ if(ifr._sgurl) URL.revokeObjectURL(ifr._sgurl); return fermer.apply(this,arguments); }; }
    return V; };

  /* ── rapports Management et Planification RH (mgPrint : moteur .dpdoc à part, 1re section du modèle, jeu 0) : mêmes valeurs que
     mgPrint (champs par nom, date du jour en toutes lettres, utilisateur ; nombres num(rJ) sauf rangée « txt » ; colonne FlexColumn = une
     colonne par titre de tables._flex), rangées mgSt → styles du papier, PDF dans la visionneuse ── */
  const SGIMP_MG={space:'space',tableLevel1:'l1',tableLevel2:'l2',tableLevel1Total:'tt',tableLevel2Total:'l2t',tableHeader:'th',tableRow:'tr'};
  const sgImpMg=(title,fields,tables,rep0)=>{ const rep=JSON.parse(JSON.stringify(rep0)), so=(a,b)=>(+a.sortOrder||0)-(+b.sortOrder||0);
    rep.sections=(rep.sections||[]).slice(0,1).map(x=>Object.assign(x,{isVisible:true}));
    const user=ch08cUserStr(ME.u,'userName')||(ME.staff?staffName(ME.staff):ME.id), titre=rep.reportTitle||title||'', V={}, T={}, F=fields||{}, TB=tables||{};
    const voir=x=>{ if(Array.isArray(x)){ x.forEach(voir); return; } if(!x||typeof x!=='object') return;
      if(x.class==='TextField'){ const n=String(x.f||'').split('|')[1]; V[String(x.f||'')+'\u0001'+(x.s||'standard')]=n==='date'?dLong(today()):n==='appUser'?sgImpTxt(user):sgImpTxt(F[n]); }
      for(const k in x) voir(x[k]); };
    (rep.sections||[]).forEach(x=>voir(x.bands));
    let k=0; (rep.sections||[]).forEach(x=>(x.bands||[]).forEach(b=>{ if(!b||b.isH||b.class!=='TableBand'||!b.tableSettings||!b.tableSettings[0]) return;
      const set=b.tableSettings[0], rows=TB[String(b.f||'').split('|')[1]]||TB.table||[];
      let cols=(set.columns||[]).filter(c=>!c.isH).sort(so); const fx=cols.find(c=>c.name==='FlexColumn');
      if(fx) cols=cols.flatMap(c=>c===fx?(TB._flex||[]).map((f,i)=>({...c,name:f,isHC:false,id:c.id+i,ha:'right'})):[c]);
      const nombre=c=>c.type==='doubleColumn'||c.type==='flexColumn'||c.ha==='right'||rows.some(r=>r&&r.c&&typeof r.c[c.id]==='number');
      b._sgk='t'+(k++);
      T[b._sgk]={tete:set.isHV!==false,
        cols:cols.map(c=>({id:c.id,titre:sgImpTxt(c.isHC&&c.customH!=null?c.customH:c.name),pw:+c.pw||0,isAE:!!c.isAE,ha:c.ha||(nombre(c)?'right':'left'),num:nombre(c)})),
        rows:rows.map(r=>{ const st=mgSt(r), q=SGIMP_MG[st]||'tt';
          if(st==='tableLevel1'&&r.fuse) return {st:'l1',gras:true,fuse:true,c:[sgImpTxt(r.c&&r.c[0])]};
          return {st:q,gras:/^(l1|tt|l2t|th)$/.test(q),fuse:false,c:cols.map(c=>{ let v=r.c&&r.c[c.id]; if(typeof v==='number'&&!r.txt) v=num(rJ(v)); return sgImpTxt(v); })}; })}; }));
    const id=(++SGIMP.n).toString(36)+'m'+Date.now().toString(36);
    SGIMP.memo.set(id,{prep:{rep,jobs:[{titre,titreChamp:titre,sousTitre:'',date:today(),V,T,I:{}}]},o:{},titre});
    while(SGIMP.memo.size>40) SGIMP.memo.delete(SGIMP.memo.keys().next().value);
    return {id,titre}; };
  if(typeof mgPrint==='function') mgPrint=function(type,title,fields,tables,M){ const fb=()=>mgPrintHTML(title,fields,M);
    tplOr(()=>{ const x=plModelDoc(type), rep=x&&x.report; if(!rep||!rep.sections||!rep.pageTemplates) return fb();
      const r=sgImpMg(title,fields,tables,rep); ch03bView(r.titre,{title:r.titre,css:'/*sgimp:'+r.id+'*/',html:''},{}); },fb); };

  /* ── impressions directes par modèle : visionneuse (PDF) au lieu d'une fenêtre d'impression du navigateur ── */
  const sgImpModeles=run=>{ if(['modeledocument','image'].every(t=>DS.loaded.has(t))) run(); else DS.need(['modeledocument','image']).then(run,()=>toast('Modèles indisponibles : serveur injoignable.',true)); };
  svDpPrint=function(type,o){ o=o||{};
    sgImpModeles(()=>{ const x=svDpFind(type,o.project);
      if(!x){ if(o.fallback){ o.fallback(); return; } toast('Aucun modèle « '+type+' » disponible (Modèles ▸ Modèles de documents).',true); return; }
      const R=svDpHTML(x.rep,o.jobs,{jeu:x.jeu,title:o.title,type}); ch03bView(o.title||R.title,R,{}); }); };
  svbDpPrint=function(type,o){ o=o||{};
    sgImpModeles(()=>{ const x=svDpFind(type,o.project); if(!x){ toast('Aucun modèle « '+type+' » disponible (Modèles ▸ Modèles de documents).',true); return; }
      const rep=o.transform?o.transform(JSON.parse(JSON.stringify(x.rep))):x.rep, jobs=o.jobs(rep);
      const R=svDpHTML(rep,jobs,{jeu:x.jeu,title:o.title,type}); if(o.css) R.css+='\n'+o.css(rep); ch03bView(o.title||R.title,R,{}); }); };
}

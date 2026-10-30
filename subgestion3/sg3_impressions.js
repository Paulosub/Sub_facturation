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
  const SGIMP_HEURES=/dur[ée]e|heures?|^h$|\(h\)|temps|quantit|qt[ée]/i;   /* colonnes d'heures ou de quantités : jamais en rouge */
  const SGIMP_DOC_HEURES=/temps disponible|heures disponibles|rapport des vacances|heures dues/i;   /* documents HTML d'heures (les rapports de temps des formulaires : par leur catégorie) */
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
            num:(c.type==='doubleColumn'||c.type==='flexColumn'||c.ha==='right')&&!SGIMP_HEURES.test(sgImpTxt(c.isHC&&c.customH!=null&&c.customH!==''?c.customH:c.name))})),   /* colonne de nombres (le moteur écrit souvent les montants en texte, alignés à droite) */
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
      const id=sgImpIdDe(c.html)||SGIMP.parHtml.get(String(c.html||''))||null;
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

  /* ═══ ÉTAPE 2 — impressions HTML écrites à la main (famille B : séances, rapports d'heures et de frais d'affaire, disponibilités,
     descriptifs d'appel d'offres, listes de secours…) ═══
     Elles arrivent toutes dans la visionneuse du moteur (fausse fenêtre ch03bWin → ch03bView). Le HTML y est affiché comme avant, puis LU
     tel que le navigateur l'a mis en page (styles calculés : gras, alignements, filets, colonnes, sauts de page, orientation @page) et
     redessiné par sgDsPdf au papier des contrats : titres → titres de chapitre, tableaux sans rangée de titres (≤ 3 colonnes) → grilles
     libellé / valeur, tableaux → tableaux de données (rangée en gras + filet en haut, ou classe « tot » → total encadré), rangées
     « flex » → grille, paragraphes. Texte identique (innerText du document affiché) ; images et fonds jamais ; montants en rouge.
     Pas de conversion : pages DESIGN (« tplpage », étape 3), documents avec SVG ou canevas (QR-facture, graphiques), document sans titre ni
     tableau (messages). Le HTML d'origine reste la source du « PDF » (SGIMP.parHtml : HTML → document converti). */
  SGIMP.parHtml=new Map();
  const sgImpConvertible=s=>{ s=String(s||''); return !/tplpage|qrpage|<svg[\s>]|<canvas[\s>]/i.test(s)&&/<(table|h1|h2)[\s>]/i.test(s); };
  const sgImpTableau=(t,B,L)=>{ const {cs,gras,ha,txt,cache}=L, rows=[...t.rows].filter(r=>!cache(r)); if(!rows.length) return;
    const span=c=>Math.max(1,c.colSpan||1), ncol=rows.reduce((m,r)=>Math.max(m,[...r.cells].reduce((a,c)=>a+span(c),0)),0); if(!ncol) return;
    const grille=r=>{ const g=new Array(ncol).fill(null); let j=0; for(const c of r.cells){ if(j>=ncol) break; const s=Math.min(span(c),ncol-j); g[j]={c,s}; j+=s; } return g; };
    const toutTH=r=>r.cells.length>0&&[...r.cells].every(c=>c.tagName==='TH');
    let i0=0; while(i0<rows.length&&toutTH(rows[i0])) i0++;
    const tete=i0?rows[i0-1]:null, corps=rows.slice(i0), G=corps.map(grille);
    const alig=j=>{ let d=0,n=0; G.forEach(g=>{ const x=g[j]; if(x&&x.s===1&&txt(x.c)){ n++; if(ha(cs(x.c))==='right') d++; } }); return n&&d*2>=n?'right':'left'; };
    const ref=[tete,...corps].find(r=>r&&r.cells.length===ncol), larg=j=>{ const c=ref&&ref.cells[j]; return c?Math.max(1,c.getBoundingClientRect().width):1; };
    const vals=g=>{ const v=new Array(ncol).fill(''); g.forEach((x,j)=>{ if(!x) return; const t=txt(x.c); if(!t) return; v[x.s>1&&ha(cs(x.c))==='right'?j+x.s-1:j]=t; }); return v; };
    const saut=r=>/^(page|always|left|right)$/.test(cs(r).breakBefore)||(r.parentNode&&r.parentNode.tagName==='TBODY'&&r===r.parentNode.rows[0]&&/^(page|always|left|right)$/.test(cs(r.parentNode).breakBefore));
    if(!tete&&ncol<=3){   /* grille libellé / valeur */
      const lab=Math.min(60,Math.max(30,larg(0)*25.4/96));
      B.push({k:'grille',cols:Array.from({length:ncol},(_,j)=>j===0&&ncol>1?{pw:lab,isAE:false,ha:'left'}:{pw:larg(j),isAE:true,ha:alig(j)}),rows:G.map(vals).filter(v=>v.some(x=>x))});
      return; }
    /* largeurs d'après le contenu (comme une mise en page automatique) : plus long mot du titre, plus longue ligne des cellules (40 signes au
       plus) ; les montants en rouge seulement dans les colonnes de nombres qui ne sont pas des heures */
    const poids=j=>{ let m=4; const mot=t=>String(t||'').split(/\s+/).reduce((a,x)=>Math.max(a,x.length),0);
      if(tete){ const x=grille(tete)[j]; if(x&&x.s===1) m=Math.max(m,mot(txt(x.c))); }
      G.forEach(g=>{ const x=g[j]; if(x&&x.s===1) txt(x.c).split('\n').forEach(l=>{ m=Math.max(m,Math.min(40,l.length),mot(l)); }); }); return m+1; };
    const cols=Array.from({length:ncol},(_,j)=>{ const x=tete?grille(tete)[j]:null, a=alig(j), t=x?txt(x.c):'';
      return {id:j,titre:t,ha:a,pw:poids(j),isAE:true,num:a==='right'&&!SGIMP_HEURES.test(t)}; });
    let cur={k:'tableau',tete:!!tete,cols,rows:[]}; B.push(cur);
    corps.forEach((r,i)=>{ const g=G[i], v=vals(g), cells=g.filter(Boolean).map(x=>x.c), ne=cells.filter(c=>txt(c));
      if(saut(r)&&cur.rows.length){ B.push({k:'saut'}); cur={k:'tableau',tete:!!tete,cols,rows:[]}; B.push(cur); }
      const cl=String(r.className||'')+' '+String((r.parentNode&&r.parentNode.className)||''), st0=cells[0]?cs(cells[0]):null;
      const fort=ne.length>0&&ne.filter(c=>gras(cs(c))).length*2>ne.length, filet=!!st0&&st0.borderTopStyle!=='none'&&parseFloat(st0.borderTopWidth)>=0.9;
      const st=!ne.length?'space':(/\b(tot|kt|tt|total)\b/i.test(cl)||(fort&&filet))?'tt':fort?'l1':'tr';
      const fuse=ncol>1&&g[0]&&g[0].s===ncol;
      cur.rows.push({st,gras:st==='tt'||st==='l1',fuse,c:fuse?[v.find(x=>x)||'']:v}); }); };
  const sgImpLire=doc=>{ const W=doc&&doc.defaultView, body=doc&&doc.body; if(!W||!body) return null;
    const cs=el=>W.getComputedStyle(el), gras=st=>(parseInt(st.fontWeight,10)||400)>=600, cache=el=>{ const st=cs(el); return st.display==='none'||st.visibility==='hidden'; };
    const ha=st=>/right|end/.test(st.textAlign)?'right':/center/.test(st.textAlign)?'center':'left';
    const txt=el=>String(el.innerText||'').replace(/ /g,' ').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
    let paysage=false;
    try{ for(const sh of doc.styleSheets){ let R=[]; try{ R=[...sh.cssRules]; }catch(_){ }
      R.forEach(r=>{ const c=String(r.cssText||''); if(!/^@page\s*\{/i.test(c)) return; const z=String(r.style&&r.style.getPropertyValue('size')||'');
        if(/landscape/i.test(z)) paysage=true; else { const m=/([\d.]+)mm\s+([\d.]+)mm/.exec(z); if(m&&+m[1]>+m[2]) paysage=true; } }); } }catch(_){ }
    const B=[], L={cs,gras,ha,txt,cache};
    const visiter=el=>{ for(const n of el.childNodes){
        if(n.nodeType===3){ const t=String(n.textContent||'').replace(/\s+/g,' ').trim(); if(t) B.push({k:'texte',t,gras:gras(cs(el)),ha:ha(cs(el))}); continue; }
        if(n.nodeType!==1) continue; const tg=String(n.tagName).toUpperCase();
        if(/^(SCRIPT|STYLE|TITLE|META|LINK|IMG|SVG|CANVAS|IFRAME|OBJECT|BR)$/.test(tg)||cache(n)) continue;
        const st=cs(n); if(/^(page|always|left|right)$/.test(st.breakBefore)) B.push({k:'saut'});
        if(/^H[1-6]$/.test(tg)){ const t=txt(n); if(t) B.push({k:'titre',t,niv:tg==='H1'?1:2}); continue; }
        if(tg==='TABLE'){ sgImpTableau(n,B,L); continue; }
        if(tg==='HR'){ B.push({k:'filet'}); continue; }
        const simples=ch=>!ch.some(c=>c.querySelector('table,h1,h2,h3,h4,p,div,ul,ol'));
        /* grille CSS (display:grid, n colonnes) : enfants rangés n par n → grille libellé / valeur */
        if(/grid/.test(st.display)){ const k=String(st.gridTemplateColumns||'').trim().split(/\s+/).filter(Boolean).length, ch=[...n.children].filter(c=>!cache(c));
          if(k>=2&&ch.length>=k&&simples(ch)){ const rows=[]; for(let i=0;i<ch.length;i+=k) rows.push(ch.slice(i,i+k).map(c=>txt(c)));
            /* cases à filet en haut (signatures des documents RH) : filet au-dessus de chaque case, place réservée avant */
            if(ch.every(c=>{ const z=cs(c); return z.borderTopStyle!=='none'&&parseFloat(z.borderTopWidth)>0; })){ B.push({k:'grille',sig:true,cols:Array.from({length:k},()=>({pw:1,isAE:true,ha:'left'})),rows}); continue; }
            const lab=Math.min(60,Math.max(30,ch[0].getBoundingClientRect().width*25.4/96));
            B.push({k:'grille',cols:Array.from({length:k},(_,j)=>j===0?{pw:lab,isAE:false,ha:'left'}:{pw:1,isAE:true,ha:ha(cs(ch[j]))}),rows}); continue; } }
        if(/flex/.test(st.display)&&n.children.length>=2&&simples([...n.children])){ const ch=[...n.children].filter(c=>!cache(c));
          /* rangée en grand corps (≥ 11 pt, titre d'un rapport) → titre de chapitre ; sinon rangée de grille */
          if((parseFloat(st.fontSize)||0)>=14.5){ const t=ch.map(c=>txt(c)).filter(Boolean).join(' — '); if(t) B.push({k:'titre',t,niv:1}); continue; }
          B.push({k:'rangee',c:ch.map(c=>({t:txt(c),ha:ha(cs(c))})),gras:gras(st)}); continue; }
        if(n.querySelector('table,h1,h2,h3,h4,h5,h6,p,div,ul,ol,li,hr,section,article')){ visiter(n); continue; }
        const t=txt(n); if(!t) continue;
        /* paragraphe qui commence par un libellé en gras suivi d'un retour à la ligne (« <b>Adresse</b><br>… ») : libellé gras, suite collée */
        const f0=n.firstElementChild, tf=f0&&/^(B|STRONG)$/.test(f0.tagName)&&f0.nextSibling&&f0.nextSibling.nodeName==='BR'?txt(f0):'';
        if(tf&&t.startsWith(tf)){ B.push({k:'texte',t:tf,gras:true,ha:ha(st)}); const r=t.slice(tf.length).replace(/^\n/,''); if(r) B.push({k:'texte',t:r,gras:gras(st),ha:ha(st),colle:true}); continue; }
        B.push({k:'texte',t:tg==='LI'?'– '+t:t,gras:gras(st),ha:ha(st)}); } };
    visiter(body);
    const h1=B.find(b=>b.k==='titre'), titre=String(doc.title||'').trim()||(h1?h1.t:'')||'Document';
    let sous=''; B.some(b=>b.k==='grille'&&b.rows.some(r=>/^affaire$/i.test(r[0]||'')&&(sous=r[1]||'')));
    return {titre,sous,paysage,B}; };
  /* modèle lu → modèle .dpdoc synthétique + exemplaire (valeurs en champs : montants en rouge comme les champs des modèles) */
  const sgImpSynthese=M=>{ const V={}, T={}, bands=[], NOIR=-16777216; let nv=0, nt=0, so=0;
    /* document d'heures (rapports de temps, disponibilités, vacances) : aucun montant, donc aucun rouge */
    const sansRouge=!!M.sansRouge||(!M.fixe&&SGIMP_DOC_HEURES.test(M.titre||''));
    const str=t=>({class:'TextString',text:t}), champ=t=>{ if(sansRouge) return str(t); const f='sgimp|v'+(nv++); V[f+'\u0001standard']=t; return {class:'TextField',f,s:'standard'}; };
    const B=[]; M.B.forEach(b=>{ const p=B[B.length-1];   /* rangées « flex » consécutives → une grille */
      if(b.k==='rangee'){ if(p&&p.k==='grille'&&p.rangees&&p.cols.length===b.c.length) p.rows.push(b.c.map(x=>x.t));
        else B.push({k:'grille',rangees:true,cols:b.c.map(x=>({pw:1,isAE:true,ha:x.ha})),rows:[b.c.map(x=>x.t)]}); return; }
      /* lignes d'un formulaire (étape 3) consécutives et de même forme → une grille */
      if(b.k==='grille'&&b.fusion&&p&&p.k==='grille'&&p.fusion&&p.cols.length===b.cols.length&&!!p.rangees===!!b.rangees){ b.rows.forEach(r=>p.rows.push(r)); return; }
      B.push(b.k==='grille'&&b.fusion?Object.assign({},b,{rows:b.rows.slice()}):b); });
    B.forEach((b,i)=>{ const z={sortOrder:so++,name:'b'+i};
      if(b.k==='titre') bands.push(Object.assign(z,{class:'TextBand',c:{class:'Text',ts:[str(b.t)]},col:{textFont:b.niv===1?'title':'subTitle'},rs:{b:'b',bc:NOIR},mt:i?5:0}));
      else if(b.k==='texte') bands.push(Object.assign(z,{class:'WrappingTextBand',text:{ts:[champ(b.t)]},col:{textFont:b.gras?'textBold':'text',ha:b.ha},mt:b.colle?0:2,rowSpace:1}));
      else if(b.k==='filet') bands.push(Object.assign(z,{class:'LineBand',mt:2}));
      else if(b.k==='saut') bands.push(Object.assign(z,{class:'PageBreakBand'}));
      else if(b.k==='grille'&&b.sig){ const ent=a=>a.flatMap((x,j)=>j?[null,x]:[x]);   /* une colonne vide de 12 mm entre deux signatures */
        bands.push(Object.assign(z,{class:'GridBand',mt:14,cols:ent(b.cols).map(c=>c?Object.assign({},c,{textFont:'text'}):{pw:12,isAE:false,textFont:'text'}),
          rows:b.rows.map((r,k)=>({sortOrder:k,data:ent(r).map(t=>t==null?{class:'Text',ts:[]}:{class:'Text',rS:{b:'t',bc:NOIR},ts:t?[str(t)]:[]})}))})); }
      else if(b.k==='grille'&&b.rows.length) bands.push(Object.assign(z,{class:'GridBand',mt:3,cols:b.cols.map((c,j)=>Object.assign({},c,{textFont:j===0&&!b.rangees&&b.cols.length>1?'textBold':'text'})),
        rows:b.rows.map((r,k)=>({sortOrder:k,data:r.map((t,j)=>({class:'Text',ts:t?[j===0&&!b.rangees?str(t):champ(t)]:[]}))}))}));
      else if(b.k==='tableau'&&(b.rows.length||b.tete)){ const k='t'+(nt++); T[k]={tete:b.tete,cols:sansRouge?b.cols.map(c=>Object.assign({},c,{num:false})):b.cols,rows:b.rows};
        bands.push(Object.assign(z,{class:'TableBand',f:'sgimp|'+k,_sgk:k,mt:3,tableSettings:[{columns:[]}]})); } });
    /* paysage : demandé par le document (@page), ou tableau trop large pour une page portrait (9 colonnes ou plus, ou plus de 110 signes) */
    const large=!M.fixe&&B.some(b=>b.k==='tableau'&&(b.cols.length>=9||b.cols.reduce((a,c)=>a+c.pw,0)>110));
    const page=M.paysage||large?{w:297,h:210,t:20,r:15,b:20,l:15}:{w:210,h:297,t:25,r:15,b:20,l:25};
    return {rep:{reportTitle:M.titre,pageTemplates:[{id:'SG',page}],sections:[{isVisible:true,pageTemplateId:'SG',bands}]},
      jobs:[{titre:M.titre,titreChamp:M.titre,sousTitre:M.sous,date:M.date||today(),V,T,I:{}}]}; };
  /* visionneuse d'un HTML non repéré : affiché d'abord (comme avant), lu au chargement, puis remplacé par son PDF */
  const sgImpVueHtml=(titre,src,o)=>{ const V=ch03bView0(titre,src,o), ifr=V&&V.iframe; if(!ifr||typeof src!=='string') return V;
    let tour=0;
    const essayer=()=>{ const n=++tour; let cle='';
      try{ cle=V.html(); }catch(_){ return; } if(!sgImpConvertible(cle)) return;
      ifr.addEventListener('load',()=>{ if(n!==tour) return; let P=null, M=null;
        try{ M=sgImpLire(ifr.contentDocument); if(M&&M.B.some(b=>b.k==='tableau'||b.k==='grille'||b.k==='titre')) P=sgImpSynthese(M); }catch(e){ console.error(e); }
        if(!P) return;
        const id=(++SGIMP.n).toString(36)+'h'+Date.now().toString(36);
        SGIMP.memo.set(id,{prep:P,o:{},titre:M.titre}); while(SGIMP.memo.size>40) SGIMP.memo.delete(SGIMP.memo.keys().next().value);
        SGIMP.parHtml.set(cle,id); while(SGIMP.parHtml.size>20) SGIMP.parHtml.delete(SGIMP.parHtml.keys().next().value);
        try{ const z=V.bd.parentNode.querySelector('select[title="Zoom"]'); if(z) z.style.display='none'; }catch(_){}
        Object.defineProperty(ifr,'srcdoc',{configurable:true,get:()=>'',set:x=>{ ifr._sgimp=null; ifr.removeAttribute('src');
          ifr.setAttribute('sandbox','allow-same-origin allow-modals'); SRCDOC.set.call(ifr,x); essayer(); }});
        sgImpMontrer(ifr,'/*sgimp:'+id+'*/'); },{once:true}); };
    essayer();
    const fermer=V.close; V.close=function(){ if(ifr._sgurl) URL.revokeObjectURL(ifr._sgurl); return fermer.apply(this,arguments); };
    return V; };

  ch03bView=function(titre,src,o){ const html=typeof src==='string'?src:(src&&src.css!=null?String(src.css):'');
    if(!sgImpIdDe(html)) return sgImpVueHtml(titre,src,o);
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
        cols:cols.map(c=>({id:c.id,titre:sgImpTxt(c.isHC&&c.customH!=null?c.customH:c.name),pw:+c.pw||0,isAE:!!c.isAE,ha:c.ha||(nombre(c)?'right':'left'),num:nombre(c)&&!SGIMP_HEURES.test(sgImpTxt(c.isHC&&c.customH!=null?c.customH:c.name))})),
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

  /* ═══ ÉTAPE 3 — formulaires de la Bibliothèque (tplPrint : collection « modele », rapports de temps, notes de frais, listes d'adresses,
     intervenants, tâches, anciens documents…) ═══
     Les pages DESIGN (éléments placés au point sur un fond de page « arriereplan ») ne sont plus imprimées : le document est refait à partir
     de ce que tplPrint reçoit et du formulaire choisi (tplFind, inchangé). Titre (documentTitle) → en-tête et titre de chapitre ; date du
     document → en-tête ; textes fixes et champs (tplFieldValue, mêmes valeurs) dans l'ordre de lecture du formulaire, ceux d'une même ligne
     en grille ; tableau principal (o.cols / o.rows, sans découpe : le papier passe lui-même à la ligne) et tableaux secondaires (o.tables)
     à leur place ; texte coulant (o.flow, lignes « £ » en gras) ; page de garde (o.cover) en tête puis saut de page. Rangée _bold → gras,
     _bold + _line → total encadré ; numéro de page, titre et date du formulaire laissés au papier ; traits, rectangles, images et fonds
     jamais. Orientation : celle de la 1re page du formulaire. Garde l'ancien rendu : page QR jointe (o.extra), formulaire introuvable. */
  const SGIMP_TPL_NON=/^(pageNumber|documentTitle|date|printDate)$/;
  const sgImpTplBlocs=(pg,o,ctx,B,avecTables)=>{ const L=[], P=(pg&&pg.elements)||[];
    const princ=P.filter(e=>e.t==='tableau'&&!/TableHeader$/.test(e.champ||'')).sort((a,b)=>b.h-a.h)[0];
    /* texte visible d'une case : les lignes qui tiennent dans sa hauteur (interligne 1,2 ; la case du formulaire coupe le reste) ; ordre de
       lecture selon le bord d'alignement (une valeur alignée à droite se lit à sa droite) */
    const vis=(t,e)=>{ t=String(t==null?'':t); if(!(+e.h>0)) return t.trim(); const n=Math.max(1,Math.floor((+e.h+0.5)/((+e.taille||9)*1.2))); return t.split('\n').slice(0,n).join('\n').trim(); };
    P.forEach(e=>{ const y=+e.y||0, x=e.alignement==='droite'?(+e.x||0)+(+e.l||0):e.alignement==='centre'?(+e.x||0)+(+e.l||0)/2:(+e.x||0);
      if(e.t==='texte'){ const t=vis(e.texte,e); if(t) L.push({y,x,l:+e.l||0,t,gras:!!e.gras,lab:true}); }
      else if(e.t==='champ'){ const f=e.champ||''; if(SGIMP_TPL_NON.test(f)) return;
        if(o.flow&&f===o.flow.champ){ L.push({y,x,flow:true}); return; }
        let v=null; try{ v=tplFieldValue(e,ctx,1,1); }catch(_){ v=null; } const t=vis(v&&typeof v==='object'?(v.html!=null?v.html:''):v,e);
        if(t) L.push({y,x,l:+e.l||0,t,gras:!!e.gras}); }
      else if(e.t==='tableau'&&avecTables&&!/TableHeader$/.test(e.champ||'')) L.push({y,x,tab:e,princ:e===princ}); });
    L.sort((a,b)=>a.y-b.y||a.x-b.x);
    for(let i=0;i<L.length;){ const y0=L[i].y, ln=[]; while(i<L.length&&L[i].y-y0<=4) ln.push(L[i++]);
      const tx=ln.filter(z=>z.t);
      if(tx.length===1) B.push({k:'texte',t:tx[0].t,gras:tx[0].gras,ha:'left'});
      /* ligne de plusieurs cases : largeurs des cases du formulaire (la dernière prend le reste) */
      else if(tx.length>1) B.push({k:'grille',fusion:true,rangees:!tx[0].lab,cols:tx.map((z,j)=>j<tx.length-1?{pw:Math.min(80,Math.max(20,z.l*25.4/72||45)),isAE:false,ha:'left'}:{pw:1,isAE:true,ha:'left'}),rows:[tx.map(z=>z.t)]});
      ln.filter(z=>z.flow).forEach(()=>String(o.flow.text||'').split('\n').forEach(l=>{ const g=l[0]==='£', t=(g?l.slice(1):l).trim(); if(t) B.push({k:'texte',t,gras:g,ha:'left'}); }));
      ln.filter(z=>z.tab).forEach(z=>{ const T=z.princ?{cols:o.cols||[],rows:o.rows||[]}:(o.tables||{})[z.tab.champ]; if(!T||!(T.cols||[]).length) return;
        const cols=T.cols.map((c,j)=>{ const t=sgImpTxt(c.t); return {id:j,titre:t,ha:c.r?'right':c.c?'center':'left',pw:+c.w||1,isAE:true,num:!!c.r&&!SGIMP_HEURES.test(t)}; });
        B.push({k:'tableau',tete:!(z.princ&&o.noHeader),cols,rows:(T.rows||[]).map(r=>{ const st=r._bold&&r._line?'tt':r._bold?'l1':'tr';
          return {st,gras:!!r._bold,fuse:false,c:cols.map((c,j)=>sgImpTxt(r[j]))}; })}); }); } };
  if(typeof tplPrint==='function'){ const tplPrint0=tplPrint;
    tplPrint=function(o){ o=o||{}; if(o.extra) return tplPrint0(o);
      const md=o.md||tplFind(o.cat||'projectTemplates',o.type,o.project); if(!md) return tplPrint0(o);
      let prep=null, titre='';
      try{ const P=md.langues.fr.pages, p1=P.page1||P.pageN||Object.values(P)[0], ctx={...(o.ctx||{}),project:o.project,title:o.title}, B=[];
        titre=String(o.title||tplLabel(md)||'Document');
        if(o.cover&&P.cover){ sgImpTplBlocs(P.cover,o,ctx,B,false); if(B.length) B.push({k:'saut'}); }
        B.push({k:'titre',t:titre,niv:1}); sgImpTplBlocs(p1,o,ctx,B,true);
        const pr=o.project, d=ctx.date&&/^\d{4}-\d{2}-\d{2}/.test(ctx.date)?String(ctx.date).slice(0,10):today();
        prep=sgImpSynthese({titre,sous:pr?[pr.NUMBER,pr.TITLE].filter(x=>x!=null&&String(x).trim()).join(' - '):'',paysage:p1.orientation==='paysage',fixe:true,date:d,B,
          sansRouge:(o.cat||md.categorie)==='timeTemplates'}); }   /* rapports de temps : que des heures, jamais de rouge */
      catch(e){ console.error(e); return tplPrint0(o); }
      const id=(++SGIMP.n).toString(36)+'f'+Date.now().toString(36);
      SGIMP.memo.set(id,{prep,o:{},titre}); while(SGIMP.memo.size>40) SGIMP.memo.delete(SGIMP.memo.keys().next().value);
      const w=o.win||open('','_blank'); if(!w) return;
      w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>'+esc(titre)+'</title><style>/*sgimp:'+id+'*/</style></head><body><p>'+esc(titre)+'</p></body></html>');
      w.document.close(); }; }

  /* ═══ ÉTAPE 4 — documents de SUBGestion 3 (sgImprimer : heures du projet, situation des heures, rapport d'un collaborateur ;
     sgDocOuvrir : contrat de travail, avenant, fin des rapports de travail, décompte de sortie, fiche contact) ═══
     Le HTML est mis en page dans un cadre caché (largeur A4), lu comme à l'étape 2 (sgImpLire), puis redessiné par sgDsPdf ; le PDF s'ouvre
     dans la visionneuse de l'app (Télécharger, Imprimer). Le pied de page « maison » des documents SG3 (sgPiedDoc) n'est plus mis : c'est
     celui du papier. Grille à filet en haut (signatures) → filet au-dessus de chaque case. En cas d'échec, l'ancien rendu. Pas encore
     converties : documents avec images ou plans (fiche de faisabilité). */
  const sgImpCadre=html=>new Promise((ok,ko)=>{ const f=h('iframe',{sandbox:'allow-same-origin',title:'sgimp',style:{position:'fixed',left:'-10000px',top:'0',width:'794px',height:'1123px',border:'0'}});
    const fin=()=>{ try{ f.remove(); }catch(_){} };
    f.addEventListener('load',()=>{ try{ const M=sgImpLire(f.contentDocument); fin(); if(!M||!M.B.some(b=>b.k!=='saut')) return ko(new Error('document vide')); ok(M); }catch(e){ fin(); ko(e); } },{once:true});
    SRCDOC.set.call(f,html); document.body.append(f); setTimeout(()=>{ if(f.isConnected){ fin(); ko(new Error('délai dépassé')); } },15000); });
  const sgImpOuvrirHtml=async(html,nom,titre)=>{ const M=await sgImpCadre(html); if(titre) M.titre=titre;
    const id=(++SGIMP.n).toString(36)+'d'+Date.now().toString(36);
    SGIMP.memo.set(id,{prep:sgImpSynthese(M),o:{},titre:M.titre}); while(SGIMP.memo.size>40) SGIMP.memo.delete(SGIMP.memo.keys().next().value);
    const pdf=await sgImpPdf(id); sgVisionneuse(pdf,String(nom||M.titre||'Document').replace(/\.html?$/i,'')+'.pdf'); return id; };
  if(typeof sgImprimer==='function'){ const sgImprimer0=sgImprimer, css=(/<style>([\s\S]*?)<\/style>/.exec(sgImprimer0.toString())||[])[1]||'';
    sgImprimer=function(titre,html){ const doc='<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>'+nxE(titre)+'</title><style>'+css.replace(/margin:14mm/,'margin:0')+'</style></head><body><h1>'+nxE(titre)+'</h1>'+html+'</body></html>';
      sgImpOuvrirHtml(doc,titre,titre).catch(e=>{ console.error(e); sgImprimer0(titre,html); }); }; }
  if(typeof sgDocOuvrir==='function'){ const sgDocOuvrir0=sgDocOuvrir;
    sgDocOuvrir=function(titre,corps,nom){ if(/<(img|svg|canvas)[\s>]/i.test(String(corps||''))) return sgDocOuvrir0(titre,corps,nom);
      const doc='<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>'+nxE(titre)+'</title><style>'+sgPolicesDoc()+SG_DOC_CSS.replace(/@page\{[^}]*\}/,'')+'</style></head><body>'+corps+'</body></html>';
      sgImpOuvrirHtml(doc,nom||titre,titre).catch(e=>{ console.error(e); sgDocOuvrir0(titre,corps,nom); }); }; }

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

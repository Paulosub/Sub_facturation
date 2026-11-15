/* ═══ DOCUMENTS DES ESTIMATIONS AU PAPIER DES CONTRATS (05.11.2026, bloc 38 ; demande de Paulo : « dans Détermination des coûts - Estimation avant-projet (2)
   il n'est pas possible de créer un fichier pdf du document ») ═══
   Les impressions des estimations n'avaient jamais été construites : le moteur (DeltaSub.html) appelle par leur nom des fonctions globales qui n'existaient pas
   (ecExt). Elles sont définies ici ; DeltaSub.html seul garde son message « livrées au lot 4 ».
   ec4SectionDocuments(ctx) = ELEMENTS ▸ Documents : ligne « Estimation des coûts » (état, Ouvrir ou Créer le document, Créer le PDF, Ouvrir le PDF, Réglages, Supprimer),
   puis les fichiers PDF de la zone du moteur (dossier « archive » de l'estimation). ec4PrintOld(ctx) ouvre ce même document, ec4PrintRefQuantities(ctx) sa seule section
   Grandeurs référentielles, tous deux sans rien écrire. Modèle de référence : le devis général (ch02c…).
   Rendu : copie du modèle costPlanningDocument (collection sgestimdoc, un enregistrement par estimation, ID « <document>/element », doc:null = effacé), préparée par
   ch02cPrep, remplie ici, puis svDpHTML : le papier des contrats vient du bloc 31 (sg3_impressions.js), PDF compris, sans serveur de sauvegarde. Rien n'est écrit dans la
   base en consultant : seuls « Créer le document », « Créer le PDF » et les réglages enregistrent. Réglages = P.impressionDoc, par estimation, comme le veut le cahier des charges.
   Sections : la page de garde et les sept tableaux. Une section sans donnée n'est pas imprimée (écologie sans valeurs, Descriptif sans description ni réalisation, volumes
   à 0) ; un tableau vide laisse sinon une page avec son seul en-tête. Le document porte sur la liste filtrée de l'éditeur (ouvrage, groupe, zoom : ecElState) ; le filtre
   est indiqué sur le document et sous la ligne.
   Valeurs : celles de l'écran. Quantités, prix et coûts passent par les mêmes fonctions du moteur que ses tableaux (ecaOverview, ecqQrRows, ecqCostPerQ, ecqVolumeRows,
   ecqKfRows, ecGv, ecDeviation, ecPctFmt). Seule la liste CFC détaillée n'existait pas (le moteur s'arrête au 1er chiffre) : ec4Kag la recompose, son total égale res.cfc.total
   (sous filtre : la somme de la liste filtrée). Arrondi 1 / 100 / 1000 : Vue d'ensemble et Eléments seulement (D.rd), tout le reste sur le calcul exact.
   Rouge : le bloc 31 met en rouge les montants des colonnes alignées à droite ; pourcentages, volumes, chiffres-clés et valeurs écologiques en sont retirés ici (sansRouge).
   Styles <style id="sgec-css">, classes sgec-*. Débogage : window.SGEC. */
(function(){
if(typeof ecEngine!=='function'||typeof svDpHTML!=='function'||typeof ch02cPrep!=='function'||typeof ch03cPdfZone!=='function'||typeof ch03bProduire!=='function'||!window.SGIMP) return;
const T='sgestimdoc', TYPE='costPlanningDocument', NOM='Estimation des coûts', NOM_PDF='Planificateur de coût', NOM_QR='Grandeurs référentielles';
if(Array.isArray(HEAVY)&&!HEAVY.includes(T)) HEAVY.push(T);   /* chaque enregistrement porte une copie du modèle : chargés à la demande */
const MSG_ARRONDI='Attention, vous utilisez une fonction d’arrondi pour un aperçu approximatif. Uniquement possible pour les montants d’éléments.', MSG_CFC='L’attribution CFC n’est pas terminée.';
const OPTS=[['subdivisions','Afficher les subdivisions'],['sousElements','Afficher les sous-éléments'],['composants','Afficher les composants'],['deuxiemeStructure','Afficher la deuxième structure'],['eventuelles','Afficher les positions éventuelles']];
const CSS=`
.sgec{flex:1 1 auto;min-height:0;overflow:auto;padding:0 24px 16px;background:#fff}
.sgec-dl{margin:14px 0 8px;border-top:2px solid var(--s-noir)}
.sgec-dc{display:grid;grid-template-columns:minmax(180px,1fr) auto;gap:6px 18px;align-items:center;padding:10px 0;border-bottom:1px solid var(--s-filet)}
.sgec-t b{display:block;font-size:13.5px}
.sgec-t span{display:block;font-size:12px;color:var(--s-gris);margin-top:1px}
.sgec-a{display:flex;flex-wrap:wrap;gap:2px;align-items:center;justify-content:flex-end}
.sgec-a .ib{border:0;background:transparent;height:30px;padding:0 9px;font-size:12.5px;font-weight:700;color:var(--s-noir)}
.sgec-a .ib:hover{background:var(--s-jaune3)}
.sgec-a .ib:disabled{color:#b9b9b6;opacity:1}
.sgec-n{font-size:12px;line-height:1.4;color:var(--s-gris);padding:4px 0 0}
.sgec-n.err{color:var(--s-rouge,#BD1E42);font-weight:700}
.sgec-ft{display:flex;align-items:center;gap:8px;margin-top:18px;padding:8px 0;border-top:2px solid var(--s-noir)}
.sgec-ft>b{font-size:14px}
.sgec-ft>i{flex:1 1 auto}
.sgec-ft .ib{border:0;background:transparent;height:30px;font-weight:700}
.sgec-ft .ib:hover{background:var(--s-jaune3)}
.sgec-fz{display:flex;min-height:120px}
.sgec-vide{padding:18px 0;font-size:13px;color:var(--s-gris)}
@media (max-width:980px){.sgec-dc{grid-template-columns:1fr}.sgec-a{justify-content:flex-start}}
`;
const css=()=>{ if(!document.getElementById('sgec-css')){ const s=document.createElement('style'); s.id='sgec-css'; s.textContent=CSS; document.head.appendChild(s); } };
const el=(t,c,x)=>{ const e=document.createElement(t); if(c) e.className=c; if(x!=null) e.innerHTML=x; return e; };
const n=v=>num(+v||0), vide=k=>Array(k).fill('');
const prop=(m,k,d)=>{ const x=((m&&m.props)||[]).find(y=>+y.k===k); return !x||x.v==null?d:(x.v===true||String(x.v)==='true'); };
const optDe=P=>Object.assign({},ecDefaults().impressionDoc,P&&P.impressionDoc);
const cle=ctx=>String(ctx.id)+'/element';
const lire=ctx=>{ const r=DS.get(T,cle(ctx)); return r&&r.doc?r:null; };
const dos=(ctx,sous)=>ch03aDossier('eccc',ctx.p.ID,ctx.id,sous);
const ecrit=ctx=>{ try{ return !!ctx.canEdit()&&sgDroit('chantier','ecriture'); }catch(_){ return !!ctx.canEdit(); } };
const peutPdf=ctx=>{ try{ return !!ctx.canEdit()&&sgDroit('documents','depot'); }catch(_){ return !!ctx.canEdit(); } };
/* PDF de l'estimation : le PDF officiel s'il existe (documents/element.pdf), sinon le plus récent de la liste des fichiers ; une seule règle pour l'état, Ouvrir et Effacer */
function pdfDe(ctx){ try{ return ch03aTrouve(dos(ctx),'element.pdf')||ch03aFichiers(dos(ctx,'archive')).sort((a,b)=>cmp(b.MODIFIED,a.MODIFIED))[0]||null; }catch(_){ return null; } }
const concerne=ctx=>{ const p=ctx.p||{}, d=ctx.doc||{}; return [[p.NUMBER,p.TITLE].filter(Boolean).join(' '),d.VERSION||NOM].filter(Boolean).join(' · '); };
const filtreTxt=ctx=>{ const st=ecElState(), v=[...st.fv].join(', '); return [st.fk==='ouv'&&st.fv.size&&ctx.hasOuv()?'Ouvrage : '+v:'',st.fk==='mg'&&st.fv.size?'Elément : '+v:'',st.zoom?'Elément '+st.zoom:''].filter(Boolean).join(' · '); };

/* ── données du document : liste filtrée de l'éditeur (mêmes règles que ecSectionElements : filtre d'ouvrage recalculé, filtre de groupe et zoom sans recalcul, totaux du document entier) ── */
/* arrondi 1 / 100 / 1000 de l'impression : recalcul sur une copie, le moteur n'est pas touché : coûts saisis (ni générés, ni sous un niveau fixé, ni déjà fixés) posés en coût fixé,
   arrondis vers le haut. La formule d'origine rendrait 0 pour -1500 à 1000 : une déduction reste une déduction. Seuls Vue d'ensemble et Eléments lisent ce calcul (D.rd = {P, res, E}) ;
   page de garde, quantités, CFC, chiffres-clés et écologie restent sur le calcul exact (D.P, D.res, D.E), comme ElementsReportData.getTableContent. */
const ceilN=(v,N)=>{ const i=Math.trunc(+v||0), r=i%N; return r===0?i:(i<0?i-r:i+N-r); };
function arrondir(P0,N){ const Q=ecClone(P0), C=[]; ecEngine(Q,{copie:false});
  Q.elements.forEach(e=>{ if((e.genere&&!e.niveauFixe)||ecBlockedBy(Q.elements,e)) return; const L=ecL(e,'parOuvrage'); (L.length?L:[e]).forEach(x=>{ if(!+x.coutFixe) C.push(x); }); });
  for(let i=0;i<8;i++){ const r=ecEngine(Q,{copie:false}); let ch=false; C.forEach(x=>{ const v=ceilN(x.cout,N); if(v!==(+x.coutFixe||0)){ x.coutFixe=v; ch=true; } }); if(!ch) return r; }
  return ecEngine(Q,{copie:false}); }
function donnees(ctx){ const st=ecElState(), o=optDe(ctx.P), ouv=ctx.hasOuv(), fOuv=st.fk==='ouv'&&st.fv.size>0&&ouv, fEl=!!st.zoom||(st.fk==='mg'&&st.fv.size>0);
  let P=ctx.P, res=ctx.res; if(fOuv){ res=ctx.engineFor(ecFilterOuv(ctx.P,st.fv)); P=res.P; }
  const liste=Q=>{ let L=Q.elements||[]; if(st.zoom) L=L.filter(e=>String(e.code).startsWith(st.zoom)); if(st.fk==='mg'&&st.fv.size) L=L.filter(e=>st.fv.has(String(e.code).slice(0,1))); return L; };
  const N=[1,100,1000].includes(+o.arrondi)?+o.arrondi:0, E=liste(P), ra=N?arrondir(P,N):null, rd=ra?{P:ra.P,res:ra,E:liste(ra.P)}:{P,res,E};
  const cat=new Map(ecCfcCatalog(ctx).map(x=>[String(x.CODE),x]));
  return {ctx,P,res,E,rd,o,N,ouv,fEl,arr:!!P.arrondir,cur:(ctx.p&&ctx.p.CURRENCY)||'CHF',ouvs:fOuv?[...st.fv]:null,filtre:filtreTxt(ctx),cfcTxt:c=>{ const x=cat.get(String(c)); return x?ch02cKag({texte:x.TEXT1,texte2:x.TEXT2}):''; }}; }

/* ── tableaux : {rows:[{c:[valeur par id de colonne du modèle], st}]} ; toutes les colonnes sont en texte, les valeurs arrivent formatées. Le papier ne garde des styles de rangée que
   le gras (ch, ct, cta), le cadre de total (tt) et « garder avec la suivante » (ch) : c'est ce qui porte la hiérarchie ── */
function tQuantites(D){ const {P,res,o,arr}=D, rows=[], couts=(c,C)=>{ c[9]=C?n(C.real):''; c[10]=C?n(C.ouv):''; c[11]=C?n(C.inv):''; return c; };
  ecqQrRows(P,D.ouv&&!!o.subdivisions,{pres:o.calculQR?1:0,filt:'avec',q:''}).forEach(r=>{
    if(r.t==='C'){ const z=r.c, c=vide(12); c[1]=(z.commentaire?z.commentaire+', ':'')+'Calcul : '+(z.formule||''); c[3]=c[8]=n(z.quantite); rows.push({c,st:'cda'}); return; }
    const b=r.b, q=r.o, c=[b.code,b.libelle||'',r.t==='O'?ecOgCode(r.x):'',n(q.quantite),b.unite||'',!!q.definitif,q.remarque||'',q.noteInterne||'','','','',''];
    rows.push({c:couts(c,ecqCostPerQ(r.t==='O'?ecqOuvT(res,r.x):res.T,q.quantite,arr)),st:r.t==='O'?'c3a':'c3'}); });
  return {rows:rows.length?[{st:'space'},...rows]:rows}; }
/* liste filtrée : lignes du document entier (Coût réalisation % et Coût de l'ouvrage % sur tout le document, comme OverviewTable.fillTable) réduites à la liste ; plages sur la liste seule */
function tApercu(D,m){ const {P,res,E}=D.rd, ctx=D.ctx, k=i=>prop(m,i,i<3), rows=[], opt={cfcText:x=>ecCfcText(ctx,x),ogCode:ecOgCode}, M=ecaOverview(P,res,opt), Mf=D.fEl?ecaOverview(Object.assign({},P,{elements:E}),res,opt):M, dans=new Set(E.map(e=>String(e.code)));
  const cf=D.N?v=>num(v,0):v=>num(v), pc2=x=>x===''||x==null?'':(x&&Math.abs(x)<.01?'<0.01 %':ecaPctS(x)+' %'), p3=x=>x===''||x==null?'':(x&&Math.abs(x)<.01?'<0.01':ecaPctS(x));
  const L=(r,st)=>{ const c=vide(13); c[0]=r.code||''; c[1]=r.txt||''; c[2]=r.ouv||''; c[3]=r.abr||''; c[4]=num(r.q); c[5]=r.un||''; c[6]=num(r.prix); c[7]=r.pu||''; c[8]=cf(r.cout); c[9]=pc2(r.p0); c[10]=pc2(r.p1); c[11]=pc2(r.p2); c[12]=p3(r.p3); rows.push({c,st}); };
  const T1=t=>{ const c=vide(13); c[1]=t; rows.push({st:'space'}); rows.push({c,st:'ch'}); }; let garde=false;
  const G=M.rows.filter(r=>{ if(r.t==='G') garde=dans.has(r.code); return garde&&(r.t==='G'||r.t==='D'); });
  if(!G.length&&!M.t09) return {rows:[]};
  if(k(0)&&G.length){ T1('Coût total selon eCCC'); G.forEach(r=>{ if(r.t==='G') L(r,'c3'); else if(k(3)&&r.cout) L(r,'c3a'); }); }
  if(k(2)){ let pris=false; Mf.rows.forEach(r=>{ if(r.t!=='S'&&r.t!=='SO') return; if(D.fEl&&!r.cout) return; if(r.t==='SO'&&!k(3)) return; if(!pris){ rows.push({st:'space'}); pris=true; }
      const c=vide(13); c[7]='CHF'; c[8]=cf(r.cout); c[12]=p3(r.p3); if(r.t==='S'){ c[1]=r.txt+' ('+r.code+')'; rows.push({c,st:r.code==='A - Z'?'ct':'c3'}); } else { c[2]=r.ouv||''; rows.push({c,st:'c3a'}); } }); }
  if(k(1)&&M.t19){ T1('Coût de l’ouvrage selon CFC'); M.rows.forEach(r=>{ const c=vide(13); if(r.t==='C'){ c[0]=r.code; c[1]=r.txt||''; c[7]='CHF'; c[8]=cf(r.cout); c[9]=pc2(r.p0); rows.push({c,st:'c3'}); }
      else if(r.t==='CT'){ const tot=/0-9/.test(r.txt); c[1]=r.txt; c[7]='CHF'; c[8]=cf(r.cout); c[9]=tot?'100.00 %':num(r.p0,1)+' %'; rows.push({c,st:tot?'tt':'c3'}); } }); }
  return {rows}; }
function tElements(D,m){ const {P,res,E}=D.rd, o=D.o, A=P.affichage||{}, k0=prop(m,0,false), k1=prop(m,1,false), k2=prop(m,2,false), rows=[]; let prev='', aTexte=false;
  const blanc=()=>rows.push({st:'space'});
  const qp=x=>{ const q=+x.quantite||0, p=+x.prix||0; return q===0&&p===0?['','']:p===0?[n(q),'']:[n(q),n(p)]; };
  const dev=(e,v)=>ecPctFmt(ecDeviation(P,res,e.code,v));
  const ligne=(x,e,st,plus)=>{ const [q,pr]=qp(x), g=ecGv(x), C=ecL(x,'cfc'), c=vide(19); Object.assign(c,{3:ecaTxt(x),5:x.grandeurRef||'',6:x.unite||'',7:q,8:pr,9:ecPct(x)?'%':'CHF',10:n(g),11:dev(e,g),12:x.remarque||'',13:x.noteInterne||'',
      14:C.map(z=>z.numero).join(' | '),15:C.length?n(C.reduce((s,z)=>s+(+z.montant||0),0)):'',16:C.length?n(ecBkpDiff(x)):'',17:!!x.eventuelle,18:!!x.definitif},plus||{}); rows.push({c,st}); };
  const titre=(t,v)=>{ const a=vide(19), b=vide(19); a[3]=t; b[3]=v; rows.push({c:a,st:'cd'}); rows.push({c:b,st:'cda'}); };
  const kag=(no,m,g)=>{ const c=vide(19); c[3]=('CFC : '+no+' '+D.cfcTxt(no)).trim(); c[9]='CHF'; c[10]=n(m); c[11]=g?ecPctFmt(100*(+m||0)/g):''; rows.push({c,st:'cda'}); };
  const pieces=Dc=>{ if(!Dc.length) return; const c=vide(19); c[3]='Documents complémentaires'; rows.push({c,st:'cd'}); Dc.forEach(z=>{ const l=vide(19); l[0]='DOC'; l[3]=z.fichier||z.nom||''; rows.push({c:l,st:'c3'}); }); blanc(); };
  /* lignes filles : CFC (ligne vide après elles s'il n'y a pas de documents), descriptif, réalisation, documents ; d'un composant : CFC, descriptif, documents (ElementTable.fillTable @6465-6641) */
  const filles=x=>{ const C=ecL(x,'cfc'), g=ecGv(x), Dc=ecL(x,'documents');
    if(o.deuxiemeStructure&&C.length){ C.forEach(z=>kag(z.numero,z.montant,g)); if(!Dc.length) blanc(); }
    if(k2&&x.description){ aTexte=true; titre('Descriptif',x.description); } if(k1&&x.execution){ aTexte=true; titre('Réalisation',x.execution); }
    pieces(Dc); };
  const fillesComp=(c,s)=>{ if(o.deuxiemeStructure&&c.cfcNumero) kag(c.cfcNumero,c.cout,ecGv(s)); if(k2&&c.description){ aTexte=true; titre('Descriptif',c.description); } pieces(ecL(c,'documents')); };
  const ses=(e,par)=>{ if(!o.sousElements) return; ecL(par,'sousElements').forEach(s=>{ if(s.eventuelle&&!o.eventuelles) return; ligne(s,e,'c3',{1:s.numero,9:s.prixEnPourcent?'%':'CHF'}); filles(s);
      if(o.composants) ecL(s,'composants').forEach(c=>{ if(c.eventuelle) return; const l=vide(19); Object.assign(l,{2:c.numero,3:ecaTxt(c),6:c.unite||'',7:c.montantSeul?'':n(c.quantite),8:c.montantSeul?'':n(c.prix),9:c.prixEnPourcent?'%':'CHF',10:n(c.cout),11:dev(e,+c.cout||0),12:c.remarque||'',13:c.noteInterne||'',14:c.cfcNumero||'',15:c.cfcNumero?n(c.cout):'',17:!!c.eventuelle}); rows.push({c:l,st:'c3'}); fillesComp(c,s); }); }); };
  /* position éventuelle : l'élément, une ligne d'ouvrage, ou un sous-élément de l'un d'eux (le moteur ne compte pas ces positions : l'élément peut valoir 0) */
  const seEv=x=>ecL(x,'sousElements').some(s=>s.eventuelle), ev=c=>E.some(x=>String(x.code).startsWith(c)&&(x.eventuelle||seEv(x)||ecL(x,'parOuvrage').some(d=>d.eventuelle||seEv(d))));
  E.forEach(e=>{ const c=String(e.code); if((k0&&c.length>3)||(e.eventuelle&&!o.eventuelles)) return;
    if(!(ecGv(e)!==0||+e.coutFixe!==0||ecL(e,'documents').length||ecL(e,'images').length||(o.eventuelles&&ev(c)))) return;
    if(A.seulementUtilises&&!ecIsActivePosition(P.elements,e)) return;
    if(!k0&&prev&&((c.length===1&&prev[0]!==c[0])||(prev.length>1&&c.length===3&&prev[0]===c[0]))) blanc();
    prev=c; ligne(e,e,c.length===1?'ch':(c.length===3&&!(k0&&e.genere))?'ct':'c3',{0:c}); filles(e);
    ecL(e,'parOuvrage').forEach(d=>{ if((ecGv(d)===0&&!(o.eventuelles&&seEv(d)))||(d.eventuelle&&!o.eventuelles)) return; const sp=d.ouvrageId!=null?DS.get('subproject',d.ouvrageId):null;
      ligne(d,e,'c3a',{3:sp?sp.DESCRIPTION||'':'',4:ecOgCode(d),5:d.grandeurRef||e.grandeurRef||'',6:d.unite||e.unite||'',9:ecPct(d)||ecPct(e)?'%':'CHF'}); filles(d); ses(e,d); });
    ses(e,e); });
  return {rows,sansTexte:(k1||k2)&&!aTexte}; }
/* liste CFC détaillée, TTC : le moteur (ecBooked) ne totalise que par 1er chiffre ; mêmes positions dans les mêmes cas (ses passes 1 et 2), ici par numéro complet, pour que le total reste celui du moteur :
   TVA sauf éléments A et Z ; positions éventuelles exclues ; sous-élément en % : sans ouvrage, ses CFC seulement si aucun composant n'en a (@2545), à ouvrage toujours (@3532) ; élément en % de quantité :
   sous-élément à prix unitaire passé par les deux passes, compté deux fois comme dans le moteur, à ouvrage d'abord sur son prix unitaire (brut) ; élément à 0 : seulement ses positions non nulles ;
   parents par préfixes 1, 2 et 3 caractères */
function ec4Kag(E,res){ const vat=+res.T.taux||0, EX=!!res.exclue, arr=!!res.arrondir, L=new Map();
  const aj=(k,v,d)=>{ k=String(k||''); if(!k) return; const x=L.get(k)||{n:k,v:0,gen:false,ouv:new Map()}; x.v+=v; if(d){ const y=(d.ouvrage||'')+'\u0002'+(d.localisation||''), w=x.ouv.get(y)||{d,v:0}; w.v+=v; x.ouv.set(y,w); } L.set(k,x); };
  E.forEach(e=>{ if((e.genere&&!e.niveauFixe)||(EX&&e.eventuelle)) return; const F=/^[AZ]/.test(e.code)?1:1+vat*.01, pq=!!e.prixEnPourcentQuantite, nz=ecGv(e)!==0, Lo=ecL(e,'parOuvrage');
    const pose=(k,m,d)=>{ if(m||nz) aj(k,F*(+m||0),d); }, cfc=(x,d)=>ecL(x,'cfc').forEach(k=>pose(k.numero,k.montant,d)), comps=C=>C.forEach(c=>{ if(c.cfcNumero&&!c.eventuelle) pose(c.cfcNumero,c.cout,null); });
    const brut=(s,d)=>{ const g=+s.coutFixe||ecR((+s.quantite||0)*(+s.prix||0),arr); ecL(s,'cfc').forEach(k=>pose(k.numero,ecR((+k.pourcent||0)*.01*g,arr),d)); };
    if(!Lo.length){ const Ls=ecL(e,'sousElements'); if(!Ls.length){ cfc(e,null); return; }
      Ls.forEach(s=>{ if(s.eventuelle) return; const C=ecL(s,'composants'); if(!s.prixEnPourcent){ if(!pq) cfc(s,null); comps(C); }
        if(s.prixEnPourcent||pq){ if(C.some(c=>c.cfcNumero&&!c.eventuelle)) comps(C); else cfc(s,null); } }); return; }
    Lo.forEach(d=>{ if(EX&&d.eventuelle) return; const Ls=ecL(d,'sousElements'); if(!Ls.length){ cfc(d,d); return; }
      Ls.forEach(s=>{ if(s.eventuelle) return; const C=ecL(s,'composants'); if(!s.prixEnPourcent){ if(pq) brut(s,d); else cfc(s,d); comps(C); } if(s.prixEnPourcent||pq){ comps(C); cfc(s,d); } }); }); });
  [...L.values()].forEach(x=>[x.n.slice(0,1),x.n.length>1?x.n.slice(0,2):'',x.n.length>3?x.n.slice(0,3):''].forEach(k=>{ if(k&&!L.has(k)) L.set(k,{n:k,v:0,gen:true,ouv:new Map()}); }));
  const pos=[...L.values()].filter(x=>!x.gen), tot=pos.reduce((s,x)=>s+x.v,0);
  L.forEach(g=>{ if(g.gen) pos.forEach(x=>{ if(x.n.length>g.n.length&&x.n.startsWith(g.n)) g.v+=x.v; }); });
  return {rows:[...L.values()].sort((a,b)=>cfcCmp(a.n,b.n)),tot}; }
function tCfc(D,m){ const K=ec4Kag(D.E,D.res), rows=[], cur=D.cur, a=v=>num(ecR(v,D.arr)), pc1=x=>x&&Math.abs(x)<.01?'<0.01':num(x,1), mode=String(((m.props||[]).find(y=>+y.k===0)||{}).v||'oneDigit'), k1=prop(m,1,true);
  const voit=x=>{ const l=x.n.length; return mode==='allDigit'||(mode==='threeDigit'&&l<=3)||(mode==='twoDigit'&&l<=2)||(mode==='oneDigit'&&l===1); };
  const st=x=>{ const l=x.n.length; return l===1?(mode==='oneDigit'?'c3':'ch'):l===2?(mode==='twoDigit'?'c3':'ct'):(l===3&&k1&&x.gen)?'ct':'c3'; };
  K.rows.forEach(x=>{ if(!voit(x)) return; rows.push({c:[x.n,D.cfcTxt(x.n),'',cur,a(x.v),pc1(100*x.v/K.tot)],st:st(x)});
    x.ouv.forEach(w=>rows.push({c:['',ecOgCode(w.d),'',cur,a(w.v),pc1(100*w.v/K.tot)],st:'cst1'})); });
  if(rows.length) rows.push({c:['','Total','',cur,a(K.tot),'100.0'],st:'tt'});
  return {rows:rows.length?[{st:'space'},...rows]:rows}; }
function tVolumes(D){ const V=D.P.volumes||{}, rows=[]; let tete=false; if(!Object.values(V).some(x=>+x)) return {rows};
  ecqVolumeRows(V).forEach(r=>{ if(r.t==='b'){ rows.push({st:'space'}); tete=true; return; } rows.push({c:[r.lib,r.k,n(r.v),r.u],st:r.t==='%'&&tete?'ct':'c3'}); if(r.t==='%') tete=false; });
  return {rows}; }
function tSurfaces(D){ const R=ecqKfRows(D.P,D.res), rows=[]; if(!R.some(r=>r.t==='u'&&r.v)) return {rows};
  R.forEach(r=>{ if(r.t==='h') rows.push({c:[r.lib,'','',''],st:'ch'}); else if(r.t==='u') rows.push({c:[r.u.nom||'',r.u.equation||'',r.u.unite||'',r.v==null?'':n(r.v)],st:'c3'}); });
  return {rows}; }
function tEnergie(D){ const {P,E,o}=D, A=P.affichage||{}, rows=[]; let prev='';
  const a=x=>!!(+x.energieGrise||+x.coefficientU||+x.effetSerre), aSE=x=>ecL(x,'sousElements').some(a);
  const retenu=e=>(ecGv(e)!==0&&+e.effetSerre!==0)||+e.energieGrise!==0||+e.coefficientU!==0||aSE(e)||ecL(e,'parOuvrage').some(d=>a(d)||aSE(d));
  /* une valeur commentée n'est pas sur la ligne : elle a sa propre ligne, avec son commentaire */
  const v=(x,k)=>+x[k]&&!(x.commentaires||{})[k]?n(x[k]):'', vs=x=>[v(x,'energieGrise'),v(x,'coefficientU'),v(x,'effetSerre')];
  const comm=x=>[['energieGrise',4],['coefficientU',5],['effetSerre',6]].forEach(([k,i])=>{ const t=(x.commentaires||{})[k]; if(+x[k]&&t){ const c=['','',t,'','','','']; c[i]=n(x[k]); rows.push({c,st:'cd'}); } });
  const ses=(x,par)=>ecL(x,'sousElements').forEach(s=>{ if((s.eventuelle&&!o.eventuelles)||!a(s)) return; rows.push({c:[par?s.numero:'',par?'':s.numero,ecaTxt(s),'',...vs(s)],st:'c3'}); comm(s); });
  E.forEach(e=>{ if(!retenu(e)||(A.seulementUtilises&&!ecIsActivePosition(P.elements,e))) return; const c=String(e.code); if(prev.length>c.length) rows.push({st:'space'}); prev=c;
    rows.push({c:[c,'',ecaTxt(e),'',...vs(e)],st:'c3'}); comm(e);
    ecL(e,'parOuvrage').forEach(d=>{ if(ecGv(d)===0) return; if(a(d)){ rows.push({c:['','','',ecOgCode(d),...vs(d)],st:'cd'}); comm(d); } ses(d,true); });
    ses(e,false); });
  return {rows:rows.length?[{st:'space'},...rows]:rows}; }
const TAB={baseQuantityTable:tQuantites,overviewTable:tApercu,elementTable:tElements,kagListTable:tCfc,volumeTable:tVolumes,surfaceTable:tSurfaces,energyTable:tEnergie};
const COL_OUV={baseQuantityTable:2,overviewTable:2,elementTable:4,energyTable:3}, COL_VIDES={elementTable:[1,2]};   /* colonnes retirées : Ouv. sans subdivisions, SE et Comp. sans sous-élément ni composant imprimé */
const NON_MONTANTS=new Set(['volumeTable','surfaceTable','energyTable']), PAS_MONTANT=/%/;

/* ── champs de la page de garde et des en-têtes ── */
function champs(D,rep){ const {ctx,P,res,arr}=D, p=ctx.p, doc=ctx.doc||{}, T0=res.T, a=v=>num(ecR(v,arr)), m=svMember(p,21), cat=p?ecCatalog(p.ID):null, s=String(P.systeme||'511'), gc=s==='512'||s==='513', ref=s==='511'||s==='512';
  const F=ch01aCtx({p,doc},{ouvrages:D.ouvs||undefined}), ind=v=>ch01aJd(Math.floor((+v||0)*10+.5)/10);
  return Object.assign(F,{docDate:P.date?{t:'date',v:P.date}:F.docDate,docTitle:String(rep.reportTitle||''),reportFilter:D.filtre,
    amountTotal:a(T0.inv),amountVat:a(T0.tva),amountTotalExcludedVat:a(T0.inv-T0.tva),constructionPriceIndex:ind(P.indice),projectBaseIndex:ind(p&&p.BASISINDEX),
    constructionPlanningStatus:String(P.etatPlanification||''),constructionCostEstimateProjectState:String(P.etatProjet||''),constructionCostEstimateAccuracy:String(P.precision||''),
    costPlanReferenzSysem:(gc?'eCCC-GC':'eCCC-Bât')+(cat&&cat.VERSION?' ('+cat.VERSION+')':'')+'/'+(ref?'Grandeur référence A':'eCCC-GC : Grandeurs référentielles B'),
    projectMemberCostPlannerContact:m?svC(m.CONTACT_ID):null,projectMemberCostPlannerResponsible:m?svC(m.RESPCONTACT_ID):null}); }

/* ── rendu : copie préparée, tableaux, sections sans donnée retirées (sur la copie, avant svDpHTML qui la garde en mémoire pour le PDF) ── */
const plein=t=>!!t&&!t.sansTexte&&(t.rows||[]).some(r=>r.st!=='space');
const bandes=s=>(s.bands||[]).filter(Boolean).slice().sort((a,b)=>(+a.sortOrder||0)-(+b.sortOrder||0));
const cleB=b=>String(b.f).split('|').pop();
function reduire(rep,tables,seule){ (rep.sections||[]).forEach(s=>{ const B=bandes(s), L=B.filter(b=>b.ch02c);
    if(seule){ if(!L.some(b=>b.ch02c.name===seule)) s.isVisible=false; return; }
    if(!L.length) return; const V=L.filter(b=>!plein(tables[cleB(b)])); if(V.length===L.length){ s.isVisible=false; return; }
    V.forEach(b=>{ b.isH=true; const t=B[B.indexOf(b)-1]; if(t&&t.class==='GridBand') t.isH=true; }); }); }   /* un tableau vide d'une section qui en a d'autres : avec son sous-titre */
function sansRouge(R){ const m=/\/\*sgimp:([a-z0-9]+)\*\//.exec(R.css||''); if(!m) return; const id=m[1], E=SGIMP.memo.get(id); if(!E) return; const Q=SGIMP.preparer(id), J=Q.jobs[0];
  (Q.rep.sections||[]).forEach(s=>(s.bands||[]).forEach(b=>{ const t=b&&b._sgk&&J.T[b._sgk]; if(!t) return; const nom=b.ch02c&&b.ch02c.name; t.cols.forEach(c=>{ if(NON_MONTANTS.has(nom)||PAS_MONTANT.test(c.titre)) c.num=false; }); }));
  E.prep=Q; }
function rendre(ctx,rec,o){ o=o||{}; const D=donnees(ctx), rep=ch02cPrep(rec.doc.report), tables={}, L=[];
  (rep.sections||[]).forEach(s=>bandes(s).forEach(b=>{ if(b.ch02c) L.push(b); }));
  const cacher=(b,i)=>(b.tableSettings||[]).forEach(t=>(t.columns||[]).forEach(c=>{ if(+c.id===i) c.isH=true; }));
  L.forEach(b=>{ const nom=b.ch02c.name, fn=TAB[nom], t=fn?fn(D,b.ch02c):{rows:[]}; tables[cleB(b)]=t; if(!D.ouv&&COL_OUV[nom]!=null) cacher(b,COL_OUV[nom]);
    (COL_VIDES[nom]||[]).forEach(i=>{ if(!t.rows.some(r=>r.c&&r.c[i])) cacher(b,i); }); });
  reduire(rep,tables,o.seule);
  const R=svDpHTML(rep,[{F:champs(D,rep),tables}],{jeu:rec.doc.jeu||svJeu(ctx.p),type:rec.doc.type||TYPE,title:o.titre||rec.doc.nom});
  sansRouge(R); R.sgec={tables,rep,D,vide:!!o.seule&&!L.some(b=>b.ch02c.name===o.seule&&plein(tables[cleB(b)]))}; return R; }

/* ── document : modèle copié à la création seulement ; ecrire=false : le modèle est lu, rien n'est enregistré ── */
async function charger(){ await DS.need([T,CH03A_T,'doctemplate','modeledocument','image','projectcatalogpos']); await ch03aPret(); }
async function enregistrer(ctx,doc){ const id=cle(ctx), brut=DS.get(T,id), bseq=ctBseq(T,id);
  try{ await DS.commit([{t:T,id,val:Object.assign({},brut||{},{ID:id,DOCUMENT_ID:ctx.id,PROJECT_ID:ctx.p.ID,genre:'element',doc}),bseq}]); }catch(_){ return null; }
  return lire(ctx); }
async function assurer(ctx,ecrire){ try{ await charger(); }catch(_){ toast('Modèles indisponibles : serveur injoignable.',true); return null; }
  const r0=lire(ctx); if(r0) return r0;
  const t=await ch01aTplPick(TYPE,ctx.p||{}); if(t==null) return null; if(t==='aucun'){ toast(CH02C_MSG.none.replace('^0','Calcul des coûts'),true); return null; }
  const doc={nom:NOM,type:TYPE,jeu:t.jeu,fichier:t.fichier,templateDesc:t.desc||'',report:JSON.parse(JSON.stringify(t.rep)),creeLe:today(),creePar:ME.id};
  return ecrire?enregistrer(ctx,doc):{ID:null,doc}; }
async function avertir(ctx){ if(+optDe(ctx.P).arrondi) await ch02aInfo('Information',MSG_ARRONDI); if(ecCfcIncomplete(ctx.res)) await ch02aInfo('Information',MSG_CFC); }
const U={occ:false};
const unSeul=fn=>async(...a)=>{ if(U.occ) return; U.occ=true; try{ return await fn(...a); }catch(e){ console.error(e); toast('Document impossible à préparer : '+((e&&e.message)||e),true); } finally{ U.occ=false; } };
const contacts=ctx=>ch03cContactsAffaire(ctx.p,[8]);
function montrer(ctx,rec,R,o){ const ed=!o.seule&&rec.ID&&ecrit(ctx)&&typeof ch01aTexts==='function', id=rec.ID;
  return ch01aView(o.titre||rec.doc.nom,R,{pdf:peutPdf(ctx)?{dossier:dos(ctx,'archive'),nom:o.nomPdf||NOM_PDF,projet:ctx.p.ID,concerne:concerne(ctx),contacts:contacts(ctx)}:undefined,
    edit:ed?upd=>{ const cur=DS.get(T,id); if(!cur||!cur.doc) return; const bseq=ctBseq(T,id);
      ch01aTexts(cur,x=>{ try{ upd(rendre(ctx,x,o)); }catch(e){ console.error(e); } },async rep=>{ const c2=DS.get(T,id)||cur;
        await DS.commit([{t:T,id,val:Object.assign({},c2,{doc:Object.assign({},c2.doc,{report:rep,modifieLe:today(),modifiePar:ME.id})}),bseq}]); }); }:undefined}); }
const ouvrir=unSeul(async(ctx,o)=>{ o=o||{}; const rec=await assurer(ctx,!!o.creer&&ecrit(ctx)); if(!rec) return; await avertir(ctx); const R=rendre(ctx,rec,o);
  if(R.sgec.vide){ toast('Aucune grandeur référentielle à imprimer.'); return; }
  return montrer(ctx,rec,R,o); });
/* le document n'est créé qu'une fois le nom du PDF confirmé : annuler ne laisse rien */
const creerPdf=unSeul(async ctx=>{ const rec0=await assurer(ctx,false); if(!rec0) return; const d=dos(ctx,'archive'), o={}; await avertir(ctx);
  const nom=await ch03bNouveauPdfDlg(NOM_PDF,d,o); if(nom==null) return; if(!rec0.ID&&ecrit(ctx)) await enregistrer(ctx,rec0.doc);
  return ch03bProduire(d,nom,()=>svDpDocHTML(rendre(ctx,lire(ctx)||rec0)),{projet:ctx.p.ID,origine:'pdf',bseq:o.bseq}); });
async function effacerDoc(ctx){ const r=lire(ctx); if(!r) return; if(pdfDe(ctx)){ await ch02aInfo('Erreur',CH02C_MSG.pdfExists); return; } const bseq=ctBseq(T,r.ID);
  if((await ivAsk('Avertissement',CH02C_MSG.delFile))!==true) return; try{ await DS.commit([{t:T,id:r.ID,val:Object.assign({},r,{doc:null}),bseq}]); }catch(_){ } }

/* ── ELEMENTS ▸ Documents ── */
const reglages=ctx=>{ const o=optDe(ctx.P), ro=!ecrit(ctx), pose=async x=>{ ctx.P.impressionDoc=Object.assign({},o,x); await ctx.touch(); };
  return [...OPTS.map(([k,t])=>({t,chk:!!o[k],dis:ro,fn:()=>pose({[k]:!o[k]})})),'-',...[1,100,1000].map(N=>({t:'Arrondir à '+N,chk:+o.arrondi===N,dis:ro,fn:()=>pose({arrondi:+o.arrondi===N?0:N})})),'-',
    {t:'Afficher le calcul de quantité référentielle',chk:!!o.calculQR,dis:ro,fn:()=>pose({calculQR:!o.calculQR})}]; };
const supprimer=ctx=>{ const f=pdfDe(ctx); return [{t:CH02C_L.delDoc,dis:!lire(ctx)||!ecrit(ctx),fn:()=>effacerDoc(ctx)},{t:CH02C_L.delPdf,dis:!f||!peutPdf(ctx),fn:()=>ch03cSupprimerDlg([f])}]; };
function ligne(ctx,zl){ const r=lire(ctx), d=!!r, f=pdfDe(ctx), o=optDe(ctx.P), ft=filtreTxt(ctx), L=el('div','sgec-dl'), etat=[d?'Document créé':'Pas encore créé',f?'PDF créé : '+f.NOM:'sans PDF'].join(' · ');
  const c=el('div','sgec-dc','<div class="sgec-t"><b>'+esc(NOM)+'</b><span>'+esc(etat)+'</span></div><div class="sgec-a"></div>'), a=c.querySelector('.sgec-a');
  a.append(ibtn({label:d||!ecrit(ctx)?'Ouvrir':'Créer le document',fn:()=>ouvrir(ctx,{creer:true})}),ibtn({label:'Créer le PDF',dis:!peutPdf(ctx),fn:()=>creerPdf(ctx)}),ibtn({label:'Ouvrir le PDF',dis:!f,fn:()=>{ const x=pdfDe(ctx); if(x) ch03aOuvrir(x); }}),
    ibtn({label:CH02C_L.prefs,menu:()=>reglages(ctx)}),ibtn({label:CH02C_L.suppr,dis:!d&&!f,menu:()=>supprimer(ctx)}));
  L.append(c); if(ecCfcIncomplete(ctx.res)) L.append(el('div','sgec-n err',esc(MSG_CFC))); if(+o.arrondi) L.append(el('div','sgec-n',esc(MSG_ARRONDI))); if(ft) L.append(el('div','sgec-n',esc('Le document porte sur la liste filtrée ('+ft+').')));
  zl.replaceChildren(L); }
let COUR=null, ECOUTE=false;
window.ec4SectionDocuments=function(ctx){ css(); if(ctx.tools) ctx.tools.remove(); const box=el('div','sgec'); ctx.pane.append(box);
  if(!DS.loaded.has(T)||!DS.loaded.has(CH03A_T)){ box.append(el('div','sgec-vide','Chargement des documents…')); DS.need([T,CH03A_T]).then(()=>{ if(box.isConnected) ctx.draw(); },()=>{ box.replaceChildren(el('div','sgec-vide','Documents indisponibles : serveur injoignable.')); }); return; }
  const zl=el('div'), maj=()=>ligne(ctx,zl), z=ch03cPdfZone({dossier:dos(ctx,'archive'),projet:ctx.p.ID,fusionNom:'',hauteur:120,lectureSeule:()=>!peutPdf(ctx),concerne:()=>concerne(ctx),contacts:()=>contacts(ctx)});
  const ft=el('div','sgec-ft','<b>'+esc(CH02C_L.files)+'</b><i></i>'), fz=el('div','sgec-fz'), lb=z.bouton.querySelector('.lb'); if(lb) lb.textContent='Fonctions'; else z.bouton.insertAdjacentHTML('beforeend','<span class="lb">Fonctions</span>');
  ft.append(z.bouton); fz.append(z.el); box.append(zl,ft,fz); maj(); z.redraw(); COUR={box,maj};
  if(!ECOUTE){ ECOUTE=true; DS.on(ts=>{ const c=COUR; if(!c||!c.box.isConnected) return; ts=ts||[]; if(ts.includes(T)||ts.includes(CH03A_T)) c.maj(); }); } };
window.ec4PrintOld=function(ctx){ return ouvrir(ctx,{}); };
window.ec4PrintRefQuantities=function(ctx){ return ouvrir(ctx,{seule:'baseQuantityTable',titre:NOM_QR,nomPdf:NOM_QR}); };
window.SGEC={T,TAB,ec4Kag,donnees,rendre,arrondir,assurer,ouvrir,creerPdf,lire,pdfDe,dos,U};
})();

/* ═══ ESTIMATIONS AU GRAPHISME DES DEVIS (15.11.2026, refonte d'ensemble, lot 3 — même bloc 38 ; Paulo : « refonte complète de l'app … identique aux éléments définis
   dans l'app notamment dans devis ») ═══
   Liste : page du projet ▸ Calcul des coûts (ecDomain) et liste de tous les projets (VIEWS.coplan sans estimation ouverte) = page des listes de l'app (SGSV.outils.monter,
   comme les devis et les contrôles des coûts) — bandeau jaune, chiffres (estimations, validées, coût d'investissement et coût de l'ouvrage de l'estimation de référence :
   la dernière validée, sinon la plus récente ; dernière modification), filtres (Toutes · Mes estimations pour tous les projets, statuts, recherche), tableau (Version, N°,
   Statut, Note, Coût d'investissement, Modifié, Par). Un clic ouvre l'estimation ; clic droit : ouvrir, modifier l'en-tête, dupliquer, supprimer (rétablir ou supprimer
   définitivement une estimation supprimée) ; ⋯ : estimations supprimées, importer un calcul d'un autre projet, valeurs référentielles, copie, CSV.
   Estimation ouverte : ecEditor du moteur enveloppé (habiller) — ses éléments sont déplacés tels quels (calcul, fenêtres et enregistrement inchangés). Bandeau jaune au
   numéro du projet (statut, version, désignation, maître de l'ouvrage, modification ; « ‹ Estimations du projet » = page du projet ▸ Calcul des coûts), chiffres (précision,
   coût d'investissement, coût de réalisation, coût de l'ouvrage, TVA, attribution CFC), onglets = les sections du moteur (menu de gauche masqué, ses éléments servent
   toujours) puis Documents ; à droite Paramètres (configuration, document, présentations) et le plein écran (Échap). Barres des sections en texte ; leur bouton
   « Documents » ou « Liste » devient « Imprimer » (sans les entrées pas encore livrées), « Affichage… » passe dans Paramètres. Mêmes fonctions et mêmes données ;
   DeltaSub.html seul garde ses écrans. Styles <style id="sgee-css">, classes sgee-*. Débogage : window.SGEE. */
(function(){
if(typeof ecList!=='function'||typeof ecEditor!=='function'||typeof ecOpen!=='function'||typeof ecEngine!=='function'||typeof ecDocDialog!=='function'||typeof EC_V==='undefined'
  ||!window.SGSV||!window.SGSV.outils||typeof VIEWS==='undefined'||!VIEWS.coplan) return;
const {monter,tete,kpi,btn,menuSous,E,pl,trouve,moT,css}=SGSV.outils;
const DOM='Calcul des coûts', T_D='costplanningdocument', T_C='costplanning', BESOIN=[T_C,T_D,'project'];
const CSS=`
.sgee-lt td.note{max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgee-lt tr.supp td{opacity:.5}
.sgee-tag{display:inline-block;margin-left:8px;font-size:11px;font-weight:400;color:var(--s-gris);white-space:nowrap}
.sgee{flex:1 1 auto;display:flex;flex-direction:column;min-height:0;height:100%;overflow:hidden;background:#fff}
.sgee.sgee-plein{position:fixed;inset:0;z-index:800;height:auto;padding-top:8px}
.sgee.sgee-plein>.sgee-tete{display:none}
.sgee.sgee-plein .sgee-kp .nx-kpi{padding:4px 12px 6px 0}
.sgee.sgee-plein .sgee-kp .nx-kpi .v{font-size:clamp(11px,calc(2.1cqi - 2px),17px);margin-top:2px}
.sgee.sgee-plein .sgee-kp .nx-kpi .s{display:none}
.sgee>.sgee-x{display:none!important}
.sgee-tete{flex:none;padding:8px 24px 0}
.sgee-tete .sgfh-tete{margin:0;padding:10px 18px}
.sgee-tete .sgfh-ini{font-size:28px;white-space:nowrap}
.sgee-tete .sgfh-nm{min-width:0}
.sgee-tete .sgfh-nm h2{font-size:20px}
.sgee-ro{align-self:center;font-size:12px;font-weight:700;color:var(--s-gris);white-space:nowrap}
.sgee-kp{flex:none;margin:0 24px;grid-template-columns:104px;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);border-top:0;container-type:inline-size}
.sgee-kp .nx-kpi{padding:10px 12px 10px 0;margin-right:12px;min-width:0}
.sgee-kp .nx-kpi .v{font-size:clamp(11px,calc(2.1cqi - 2px),22px);margin-top:5px;white-space:nowrap;font-variant-numeric:tabular-nums}
.sgee-kp .nx-kpi .l,.sgee-kp .nx-kpi .s{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgee-kp .nx-kpi .s{margin-top:3px}
.sgee-kp .nx-kpi .v.pos{color:var(--s-rouge)}
.sgee-kp .nx-kpi .v.ok{color:#4E6B0F}
.sgee-ong{flex:none;display:flex;align-items:flex-end;gap:14px;margin:0 24px;border-bottom:1px solid var(--s-filet)}
.sgee-ong .sg-onglets{flex:1 1 auto;min-width:0;margin:0;border:0;gap:0 20px;flex-wrap:wrap;overflow:visible}
.sgee-ong .sg-onglets button{font-size:13.5px}
.sgee-osep{flex:none;align-self:center;width:1px;height:16px;background:var(--s-filet)}
.sgee-od{flex:none;display:flex;align-items:center;gap:2px;padding-bottom:2px}
.sgee-od .ib,.sgee-corps .ph2 .ib{border:0!important;background:transparent!important;box-shadow:none!important;border-radius:0!important;height:32px;padding:0 9px;font-size:12.5px;font-weight:700;color:var(--s-noir)}
.sgee-od .ib:hover,.sgee-corps .ph2 .ib:hover{background:var(--s-jaune3)!important}
.sgee-od .ib.on,.sgee-corps .ph2 .ib.on{box-shadow:inset 0 -2px 0 var(--s-nuit)!important}
.sgee-od .ib:disabled,.sgee-corps .ph2 .ib:disabled{color:#b9b9b6}
.sgee-od .ib .lb,.sgee-corps .ph2 .ib .lb{display:inline!important}
.sgee-od .sgee-pl .lb{display:none!important}
.sgee-corps{flex:1 1 auto;min-height:0;margin:0 24px;padding:0!important;gap:0!important}
.sgee-corps>.ec-side{display:none!important}
.sgee-corps .col{border:0!important;background:#fff!important;box-shadow:none!important}
.sgee-corps .ph2{flex:none;flex-wrap:wrap;height:auto!important;min-height:40px;gap:2px!important;padding:4px 0!important;border:0!important;border-bottom:1px solid var(--s-filet)!important;background:transparent!important;align-items:center}
.sgee-corps .ph2 .ib:first-child{padding-left:0}
.sgee-corps .ph2>span,.sgee-corps .ph2>label{font-size:12px;color:var(--s-gris)!important}
.sgee-corps .ph2>b{font-size:12.5px}
.sgee-corps .pane{border:0!important;background:#fff!important;box-shadow:none!important}
.sgee-corps .col.fill>.col.fill>div[style*="padding: 6px"]{padding:6px 0 0!important;gap:20px!important}
.sgee-corps table.g thead th{background:#fff!important;border:0!important;border-bottom:2px solid var(--s-noir)!important;font-size:11px;line-height:15px;font-weight:700;color:var(--s-gris)!important;padding:8px 6px!important;height:auto!important}
.sgee-corps table.g tbody td{border:0!important;border-bottom:1px solid var(--s-filet)!important;font-size:12.5px;font-variant-numeric:tabular-nums}
.sgee-corps table.g.ec-t td{height:26px}
.sgee-corps table.g tbody tr:hover td{background:var(--s-jaune3)!important}
.sgee-corps table.g.ec-t tr.mg td{background:var(--s-nuit3)!important}
.sgee-corps table.g.ec-t td.ed{background:rgba(0,51,70,.07)!important;box-shadow:inset 0 0 0 1px rgba(0,51,70,.35)}
.sgee-corps table.g tbody tr.on td{background:var(--s-jaune2)!important;color:var(--s-noir)!important}
.sgee-corps table.g.ec-t tr.blank td{height:8px;border-bottom:0!important;background:#fff!important}
.sgee-corps .ec-det,.sgee-corps .eca-det{border:0!important;border-top:2px solid var(--s-noir)!important;background:#fff!important;padding:10px 0 12px!important}
.sgee-corps .ec-det b,.sgee-corps .eca-det b{color:var(--s-gris)!important}
.sgee-corps .ec-catl,.sgee-corps .eca-cats{border:0!important;background:#fff!important}
.sgee-corps .ec-catl .hd,.sgee-corps .eca-cats .hd{font-size:11px;line-height:15px;font-weight:700;color:var(--s-gris);padding:8px 6px!important;border-bottom:2px solid var(--s-noir)!important;background:transparent!important}
.sgee-corps .ec-catl div,.sgee-corps .eca-cats div{border-bottom:1px solid var(--s-filet)}
.sgee-corps .ecq-kf{gap:20px!important;padding:0!important}
.sgee-corps .sgec{padding:0 0 16px}
.sgee-corps .ec-catl div.on,.sgee-corps .eca-cats div.on{background:var(--s-jaune2)!important;color:var(--s-noir)!important;font-weight:700}
.sgee-corps .ph{color:var(--s-gris)}
@media (max-height:860px){.sgee-tete .sgfh-meta{display:none}.sgee-tete .sgfh-tete{padding:6px 14px}.sgee-tete .sgfh-ini{font-size:22px}.sgee-tete .sgfh-nm h2{font-size:17px}.sgee-kp .nx-kpi{padding:6px 12px 6px 0}.sgee-kp .nx-kpi .v{font-size:clamp(11px,calc(2.1cqi - 2px),18px);margin-top:3px}.sgee-kp .nx-kpi .s{display:none}}
`;
const cssE=()=>{ css(); if(!document.getElementById('sgee-css')){ const s=document.createElement('style'); s.id='sgee-css'; s.textContent=CSS; document.head.appendChild(s); } };
const el=(t,c,x)=>{ const e=document.createElement(t); if(c) e.className=c; if(x!=null) e.innerHTML=x; return e; };
const ecrit=()=>{ try{ return !!sgDroit('chantier','ecriture'); }catch(_){ return true; } };
const prj=d=>DS.get('project',d.PROJECT_ID)||{};
const etat=c=>{ const t=(typeof EC_ST!=='undefined'&&EC_ST[+c||0])||''; try{ return typeof sgLib==='function'?sgLib(t):t; }catch(_){ return t; } };
const nomDe=d=>'« '+(d.VERSION||'(sans titre)')+' »';
const z=v=>Math.abs(+v)<0.005?0:+v, mt=v=>v==null||!isFinite(+v)?'—':num(z(v));
/* totaux d'une estimation : calcul du moteur (comme sa liste), gardés tant que son contenu ne change pas */
const CACHE=new WeakMap();
const totaux=d=>{ const P=DS.get(T_C,d.ID); if(!P) return null; if(CACHE.has(P)) return CACHE.get(P); let T=null;
  try{ const r=ecEngine(ecNormalize(ecClone(P),d)), a=!!r.P.arrondir; T={inv:ecR(r.T.inv,a),real:ecR(r.T.real,a),ouv:ecR(r.T.ouv,a)}; }catch(e){ console.error(e); }
  CACHE.set(P,T); return T; };
/* retour à la page du projet ▸ Calcul des coûts (le moteur passait un argument que la page du projet ne lit pas) */
const pdomOk=pid=>{ try{ return pid!=null&&typeof NX_VIEW!=='undefined'&&!!NX_VIEW['nx-pdom']&&(typeof sgProjetPermis!=='function'||sgProjetPermis(pid)); }catch(_){ return false; } };
{ const o0=ecOpen; ecOpen=function(id,back){ try{ if(back&&back.id==='nx-pdom'&&typeof back.arg!=='string'){ const d=DS.get(T_D,id); if(d) back={id:'nx-pdom',arg:d.PROJECT_ID+'|'+DOM}; } }catch(_){ }
    return o0.call(this,id,back); }; }
const ouvrir=d=>ecOpen(d.ID,typeof VIEW!=='undefined'&&VIEW&&VIEW.id!=='coplan'?{id:VIEW.id,arg:VIEW.arg}:null);
const seq=(t,id)=>((DS.S[t]||{})[String(id)])||0;
const supprimer=async d=>{ if(!d) return; if(!ecCanEdit(d)){ toast(EC_MSG_DROITS,true); return; } const hs=seq(T_D,d.ID), cs=seq(T_C,d.ID);
  try{ if(!+d.ISMARKEDASDELETED){ if(await confirmDlg('Supprimer l’estimation '+nomDe(d)+' ?\nElle reste récupérable : ⋯ ▸ Afficher les estimations supprimées.','Supprimer')) await DS.commit([{t:T_D,id:d.ID,val:{...d,ISMARKEDASDELETED:1},bseq:hs}]); }
    else if(await confirmDlg('Supprimer définitivement l’estimation '+nomDe(d)+' ?\nCette suppression est irréversible.','Supprimer définitivement')) await DS.commit([{t:T_D,id:d.ID,val:null,bseq:hs},{t:T_C,id:d.ID,val:null,bseq:cs}]); }catch(e){ console.error(e); } };
const retablir=async d=>{ if(!d) return; if(!ecCanEdit(d)){ toast(EC_MSG_DROITS,true); return; }
  try{ await DS.commit([{t:T_D,id:d.ID,val:{...d,ISMARKEDASDELETED:0},bseq:seq(T_D,d.ID)}]); toast('Estimation '+nomDe(d)+' rétablie.'); }catch(e){ console.error(e); } };
const fnG=n=>typeof globalThis[n]==='function'?globalThis[n]:null;
const colsListe=G=>[...(G?[{k:'pn',t:'N° d’affaire',f:d=>E(prj(d).NUMBER||'')}]:[]),{k:'VERSION',t:'Version'},{k:'VERSIONNUMBER',t:'N° de version'},{k:'st',t:'Statut',f:d=>E(etat(d.STATECODE))},{k:'NOTE',t:'Note'},
  {k:'inv',t:'Coût d’investissement',f:d=>{ const t=totaux(d); return t?E(num(z(t.inv))):''; }},{k:'dt',t:'Modifié',f:d=>E(dfr(d.CHANGEDDATE))},{k:'USERID',t:'Par'}];
const ESTIM={
  rendre(I){ cssE(); const p=I.p, u=I.u, G=!!p.GLOBAL, ec=ecrit();
    const tous=(G?DS.all(T_D):DS.by(T_D,'PROJECT_ID',p.ID)).filter(d=>!G||!u.mine||d.USERID===ME.id), vivant=tous.filter(d=>!+d.ISMARKEDASDELETED), base=u.supp?tous:vivant, parSt=[...new Set(base.map(d=>+d.STATECODE||0))].sort();
    if(u.statut!=null&&!parSt.includes(u.statut)) u.statut=null;
    const st=u.statut??null, recent=(a,b)=>cmp(b.CHANGEDDATE,a.CHANGEDDATE)||(+b.VERSIONNUMBER||0)-(+a.VERSIONNUMBER||0)||(+b.ID-+a.ID);
    const R=base.filter(d=>(st==null||(+d.STATECODE||0)===st)&&trouve(u.q,d.VERSION,d.NOTE,d.USERID,d.VERSIONNUMBER,etat(d.STATECODE),G?prj(d).NUMBER:'',G?prj(d).TITLE:'')).sort(recent); I.R=R;
    const nV=vivant.filter(d=>+d.STATECODE===2).length, dern=vivant.slice().sort(recent)[0]||null, ref=vivant.filter(d=>+d.STATECODE===2).sort(recent)[0]||dern, tR=!G&&ref?totaux(ref):null, mo=moT(p);
    const acts=(ec?btn('new','Nouvelle estimation','plus',1):'')+'<button class="nx-btn" data-a="menu" title="Autres actions" aria-label="Autres actions">⋯</button>';
    const teteP=G?tete('ES','Estimations des coûts','Estimations',pl(vivant.length,'estimation')+' · tous les projets',acts)
      :tete(p.NUMBER||'','Estimations des coûts',p.TITLE||'',[mo?'Maître de l’ouvrage : '+mo:'',pl(vivant.length,'estimation')].filter(Boolean).join(' · '),acts);
    if(!vivant.length&&!u.supp&&!(G&&u.mine)) return '<div class="sgsv">'+teteP+'<div class="sgsv-vide"><b>'+(G?'Aucune estimation.':'Aucune estimation pour ce projet.')+'</b><br>Une estimation chiffre l’ouvrage par éléments, avant le devis général : grandeurs référentielles, valeurs référentielles, coût de chaque élément.'+(ec?'<div class="acts">'+btn('new','Nouvelle estimation','plus',1)+'</div>':'')+'</div></div>';
    const refT=ref?(+ref.STATECODE===2?'Estimation validée la plus récente':'Estimation la plus récente'):'';
    return '<div class="sgsv">'+teteP
      +'<div class="nx-kpis sgsv-kp">'+kpi('Estimations',String(vivant.length),G?'tous les projets':'versions du projet')+kpi('Validées',String(nV),'')
      +(G?kpi('Projets',String(new Set(vivant.map(d=>d.PROJECT_ID)).size),'avec une estimation')
        :kpi('Coût d’investissement',tR?mt(tR.inv)+'<small>CHF</small>':'—',ref?E(ref.VERSION||'(sans titre)'):'','',refT)+kpi('Coût de l’ouvrage',tR?mt(tR.ouv)+'<small>CHF</small>':'—',tR&&z(tR.real)?'réalisation '+E(mt(tR.real)):'','',refT))
      +kpi('Dernière modification',dern&&dern.CHANGEDDATE?dfr(dern.CHANGEDDATE):'—',dern&&dern.USERID?'par '+E(dern.USERID):'')+'</div>'
      +'<div class="sgsv-fil">'+(G?[['0','Toutes'],['1','Mes estimations']].map(([v,t])=>'<button data-a="mine" data-v="'+v+'" class="'+((+v===1)===!!u.mine?'on':'')+'">'+t+'</button>').join('')+'<span style="width:10px"></span>':'')
      +(parSt.length>1?[['','Tous les statuts'],...parSt.map(c=>[c,etat(c)||String(c)])].map(([c,t])=>{ const v=c===''?null:+c; return '<button data-a="statut" data-c="'+c+'" class="'+(v===st?'on':'')+'" aria-pressed="'+(v===st)+'">'+E(t)+'</button>'; }).join(''):'')
      +'<span class="dr"><input class="inp" data-q type="search" style="width:240px" placeholder="Rechercher une estimation" aria-label="Rechercher une estimation" value="'+E(u.q||'')+'"></span></div>'
      +(R.length?'<table class="nx-tbl sgsv-tb sgee-lt"><thead><tr>'+(G?'<th>Projet</th>':'')+'<th>Version</th><th class="r">N°</th><th>Statut</th><th>Note</th><th class="r">Coût d’investissement</th><th>Modifié</th><th>Par</th></tr></thead><tbody>'
        +R.map(d=>{ const t=totaux(d), nt=d.NOTE||''; return '<tr data-a="open" data-d="'+E(d.ID)+'"'+(+d.ISMARKEDASDELETED?' class="supp"':'')+'>'+(G?'<td class="nw" title="'+E(prj(d).TITLE||'')+'">'+E(prj(d).NUMBER||'')+'</td>':'')
          +'<td><b>'+E(d.VERSION||'(sans titre)')+'</b>'+(+d.ISAPPLYSUBPROJECTS?'<span class="sgee-tag">subdivisions</span>':'')+(+d.ISMARKEDASDELETED?'<span class="sgee-tag">supprimée</span>':'')+'</td><td class="r">'+E(d.VERSIONNUMBER??'')+'</td><td class="nw">'+E(etat(d.STATECODE))+'</td><td class="note" title="'+E(nt)+'">'+E(nt)+'</td>'
          +'<td class="r nw">'+(t?E(mt(t.inv)):'—')+'</td><td class="nw">'+E(dfr(d.CHANGEDDATE))+'</td><td class="nw">'+E(d.USERID||'')+'</td></tr>'; }).join('')+'</tbody></table>'
        :'<p class="sgsv-rien">Aucune estimation trouvée.</p>')+'</div>'; },
  action(I,a,t,e){ const p=I.p, u=I.u, d=t.dataset.d?DS.get(T_D,t.dataset.d):null;
    if(a==='new'){ if(!ecrit()) return; ecNeed().then(()=>{ if(p.GLOBAL) pickProject('Choisir le projet',q=>ecDocDialog(q,null,'new')); else ecDocDialog(p,null,'new'); }).catch(e=>console.error(e)); }
    else if(a==='open'){ if(d&&!(e&&e.detail>1)) ouvrir(d); }
    else if(a==='mine'){ u.mine=t.dataset.v==='1'; u.statut=null; I.dessiner(); }
    else if(a==='statut'){ u.statut=t.dataset.c===''?null:+t.dataset.c; I.dessiner(); }
    else if(a==='menu'){ const g=()=>({cols:colsListe(!!p.GLOBAL),view:I.R||[]}), ec=ecrit(), imp=fnG('ecqImportFromProject');
      const vr=[['Valeurs référentielles des éléments…','ecaStatisticalValues'],['Valeurs référentielles des sous-éléments…','ecaConstructionParts'],['Structure des éléments pour les valeurs référentielles…','ecaEbkpElements']].filter(x=>fnG(x[1]));
      menuSous(t,[{t:'Afficher les estimations supprimées',chk:!!u.supp,fn:()=>{ u.supp=!u.supp; I.dessiner(); }},
        ...(ec&&imp&&!p.GLOBAL?['-',{t:'Importer un calcul des coûts d’un autre projet…',fn:()=>ecNeed().then(()=>imp(p))}]:[]),
        ...(vr.length?['-',...vr.map(([tt,n])=>({t:tt,fn:()=>fnG(n)()}))]:[]),
        '-',{t:'Copier le tableau',fn:()=>copyTable(g())},{t:'Exporter le tableau dans un fichier CSV …',fn:()=>csvTable(g(),'Estimations')}]); } },
  ctx(I,t,e){ if(t.dataset.a!=='open') return false; const d=DS.get(T_D,t.dataset.d); if(!d) return false; const ec=ecrit(), def=!!+d.ISMARKEDASDELETED;
    sgMenuAt(e.clientX,e.clientY,[{t:'Ouvrir l’estimation',fn:()=>ouvrir(d)},
      ...(ec?(def?[{t:'Rétablir l’estimation',fn:()=>retablir(d)},'-',{t:'Supprimer définitivement…',danger:true,fn:()=>supprimer(d)}]
        :[{t:'Modifier l’en-tête…',fn:()=>ecNeed().then(()=>ecDocDialog(prj(d),d,'edit'))},{t:'Dupliquer…',fn:()=>ecDuplicate(d)},'-',{t:'Supprimer…',danger:true,fn:()=>supprimer(d)}]):[])]); return true; } };
ecDomain=function(C,top,pane,p){ monter(C,p,'estim',BESOIN,ESTIM); };
{ const V=VIEWS.coplan, r0=V.render;
  V.render=function(m,arg){ if(EC_V.open||!DS.loaded.has(T_C)) return r0.call(this,m,arg);
    this.ed=null; this.list=null; const pa=arg&&arg.project?DS.get('project',arg.project):null;
    monter(m,pa||{ID:'tous',GLOBAL:1,NUMBER:'',TITLE:''},pa?'estim':'estimg',BESOIN,ESTIM); }; }

/* ── estimation ouverte : éléments du moteur déplacés tels quels, ses gestionnaires restent ── */
const ED={plein:false,box:null};
const SECL={'QUANTITES REFERENTIELLES':'Grandeurs référentielles','ELEMENTS':'Éléments','APERCU':'Aperçu','CHIFFRES CLEFS':'Chiffres-clés','CALCUL DES RESULTATS':'Calcul des résultats'};
const livre=x=>!(x&&x.dis&&/\(lot \d\)\s*$/.test(String(x.t||'')));   /* entrées du moteur pas encore livrées : pas affichées */
const propre=L=>{ const o=(L||[]).filter(x=>x==='-'||(x&&livre(x))); return o.filter((x,i)=>x!=='-'||(i>0&&i<o.length-1&&o[i-1]!=='-')); };
addEventListener('keydown',e=>{ const B=ED.box; if(e.key!=='Escape'||!ED.plein||!B||!B.isConnected||e.defaultPrevented||document.querySelector('.ov,.sg-visu,.menu')) return; const a=document.activeElement;
  if(a&&(a.isContentEditable||/INPUT|TEXTAREA|SELECT/.test(a.tagName))) return; e.preventDefault(); B._plein(false); },true);   /* capture : une fenêtre ouverte se ferme d'abord, sans quitter le plein écran */
function habiller(m,id,R){ cssE(); const ctx=R&&R.ctx; if(!ctx) return;
  const kids=[...m.children], bar=kids.find(x=>x.classList&&x.classList.contains('ph2')), body=kids.find(x=>x.classList&&x.classList.contains('cols')); if(!bar||!body) return;
  const side=body.querySelector(':scope>.ec-side'), main=body.querySelector(':scope>.col.fill'); if(!side||!main) return;
  const bEd=[...bar.querySelectorAll(':scope>button.ib')].find(b=>b._sgB&&b._sgB.label==='Editer');
  const TABS=[]; EC_SECS.forEach(([sec,subs,fns])=>{ if(subs.includes('Editer')&&(sec==='ELEMENTS'||fnG(fns.Editer))) TABS.push([sec,'Editer',SECL[sec]||sec]); });
  { const x=EC_SECS.find(y=>y[0]==='ELEMENTS'); if(x&&x[1].includes('Documents')&&fnG(x[2].Documents)) TABS.push(['ELEMENTS','Documents','Documents']); }
  if(!TABS.length) return;
  const box=el('div','sgee'), hd=el('div','sgee-tete'), kp=el('div','nx-kpis sgee-kp'), ong=el('div','sgee-ong'), ongL=el('div','sg-onglets'), od=el('div','sgee-od');
  const peut=()=>{ try{ return !!ctx.canEdit()&&ecrit(); }catch(_){ return false; } };
  const item=(sec,sub)=>{ let cur=null; for(const x of side.children){ if(x.classList.contains('ec-s')) cur=String(x.firstChild&&x.firstChild.nodeType===3?x.firstChild.textContent:x.textContent).trim(); else if(x.classList.contains('item')&&cur===sec&&x.textContent.trim()===sub) return x; } return null; };
  const majOng=()=>{ ongL.innerHTML=TABS.map(([s,b,t],i)=>(b==='Documents'?'<span class="sgee-osep"></span>':'')+'<button data-i="'+i+'" class="'+(ctx.sec===s&&ctx.sub===b?'on':'')+'">'+E(t)+'</button>').join(''); };
  ongL.onclick=e=>{ const b=e.target.closest('[data-i]'); if(!b) return; const x=TABS[+b.dataset.i], it=x&&item(x[0],x[1]); if(it){ it.click(); majOng(); } };
  const fermer=()=>{ const pid=(ctx.doc||{}).PROJECT_ID; if(ED.plein) box._plein(false); if(pdomOk(pid)) EC_V.back={id:'nx-pdom',arg:pid+'|'+DOM}; ctx.close(); };
  hd.onclick=e=>{ if(e.target.closest('[data-a="liste"]')) fermer(); };
  const bPar=ibtn({i:'gear',t:'Paramètres',menu:()=>{ const L=propre(bEd&&bEd._sgB&&typeof bEd._sgB.menu==='function'?bEd._sgB.menu():[]);
    if(typeof ecPrefDialog==='function') L.splice(Math.min(1,L.length),0,{t:'Document : titre, date, précision, textes…',fn:()=>{ if(!peut()){ toast(EC_MSG_DROITS,true); return; } ecPrefDialog(ctx); }});
    return L; }});
  const bPlein=ibtn({i:'plein',t:'Plein écran',fn:()=>box._plein(!ED.plein)}); bPlein.classList.add('sgee-pl');
  box._plein=v=>{ ED.plein=!!v; ED.box=box; box.classList.toggle('sgee-plein',ED.plein); bPlein.classList.toggle('on',ED.plein); const s=bPlein.querySelector('svg'); if(s&&typeof nxSvg==='function') s.outerHTML=nxSvg(ED.plein?'pleinq':'plein');
    bPlein.title=ED.plein?'Quitter le plein écran (Échap)':'Plein écran'; bPlein.setAttribute('aria-label',bPlein.title); };
  const prec=t=>{ t=String(t||'').trim(); return !t||/^\[\.\.\.\]/.test(t)?'':t; };
  const entete=()=>{ const d=ctx.doc; if(!d) return; const p=ctx.p||{}, mo=moT(p), P=ctx.P||{}, res=ctx.res||{}, T=res.T||{}, a=!!P.arrondir, et=etat(d.STATECODE), cr=P.coutRealisation||{}, co=P.coutOuvrage||{};
    hd.innerHTML=tete(p.NUMBER||'','Estimation des coûts'+(et?' · '+et:''),d.VERSION||'(sans titre)',[p.TITLE,mo?'Maître de l’ouvrage : '+mo:'',d.VERSIONNUMBER!=null&&d.VERSIONNUMBER!==''?'version '+d.VERSIONNUMBER:'',d.CHANGEDDATE?'modifié le '+dfr(d.CHANGEDDATE)+(d.USERID?' par '+d.USERID:''):''].filter(Boolean).join(' · '),
      (ctx.canEdit()?'':'<span class="sgee-ro" title="'+E(EC_MSG_DROITS)+'">Lecture seule</span>')+'<button class="nx-btn" data-a="liste" title="Retour aux estimations du projet">‹ Estimations du projet</button>');
    const inv=+T.inv||0, cfc=res.cfc?+res.cfc.total||0:0, inc=typeof ecCfcIncomplete==='function'&&ecCfcIncomplete(res), pr=prec(P.precision);
    kp.innerHTML=kpi('Précision',pr?E(pr):'—','','','Marge d’approximation de l’estimation (Paramètres ▸ Document)')
      +kpi('Coût d’investissement',mt(ecR(inv,a)),'tous les groupes principaux','','Somme des groupes principaux de l’estimation')
      +kpi('Coût de réalisation',mt(ecR(T.real,a)),'groupes '+E(cr.de||'B')+' à '+E(cr.a||'W'),'','Paramètres ▸ Configuration ▸ Définitions des coûts')
      +kpi('Coût de l’ouvrage',mt(ecR(T.ouv,a)),'groupes '+E(co.de||'C')+' à '+E(co.a||'G'),'','Paramètres ▸ Configuration ▸ Définitions des coûts')
      +kpi('TVA',mt(ecR(T.tva,a)),'groupe Z','','Taxe sur la valeur ajoutée comprise dans le coût d’investissement')
      +kpi('Attribution CFC',cfc&&inv?num(Math.round(1000*cfc/inv)/10,1)+'<small>%</small>':'—',!cfc?'aucun montant attribué':inc?'reste '+E(mt(inv-cfc)):'terminée',cfc?(inc?'pos':'ok'):'','Part du coût d’investissement attribuée aux CFC (Éléments ▸ Affichage du tableau ▸ Afficher les CFC)');
    if(typeof VIEW==='object'&&VIEW) VIEW.nxTitle=[p.NUMBER,d.VERSION].filter(Boolean).join(' · '); };
  /* barre de la section, après chaque dessin du moteur : « Documents » / « Liste » → « Imprimer », « Affichage… » dans Paramètres */
  const deco=()=>{ try{ entete(); majOng(); const tools=ctx.tools; if(!tools||!tools.isConnected) return;
      [...tools.querySelectorAll('button.ib')].forEach(b=>{ const o=b._sgB; if(!o||b._sgee) return;
        if(o.t==='Affichage…'){ b.remove(); return; }
        if(o.t==='Affichage du tableau'){ const l=b.querySelector('.lb'); if(l) l.textContent='Affichage'; b._sgee=1; return; }
        if((o.t==='Documents'||o.t==='Liste')&&typeof o.menu==='function'){ const nb=ibtn({i:'print',t:'Imprimer',menu:()=>propre(o.menu()).map(x=>x==='-'?x:Object.assign({},x,{t:String(x.t||'').replace(/…?\s*\[Ancien document\]\s*$/,' (PDF)')}))}); nb._sgee=1; b.replaceWith(nb); } });
    }catch(e){ console.error(e); } };
  new MutationObserver(()=>{ if(box.isConnected) deco(); }).observe(main,{childList:true});
  body.classList.add('sgee-corps'); bar.classList.add('sgee-x'); od.append(bPar,bPlein); ong.append(ongL,od);
  box.append(hd,kp,ong,...kids.filter(x=>x!==bar&&x!==body),body,bar); m.append(box);
  if(ED.plein) box._plein(true); else ED.box=box;
  deco(); }
{ const e0=ecEditor; ecEditor=function(m,id){ const R=e0.apply(this,arguments); try{ habiller(m,id,R); }catch(e){ console.error(e); } return R; }; }
window.SGEE={ESTIM,ED,totaux,habiller};
})();

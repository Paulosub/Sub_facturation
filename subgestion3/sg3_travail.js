/* ═══ COMPARATIF DES OFFRES FIGÉ, COMPARATIF CHOIX DES ARTICLES, TABLEAU COMPARATIF (07.11.2026, bloc 42 ; demandes de Paulo : « créer également un comparatif choix des
   articles, en ajoutant la possibilité de sélectionner les articles à réaliser ou à supprimer, par exemple les variantes ; ce comparatif est un comparatif de travail et doit
   être autre que le comparatif de base, mais celui-ci sera en principe utilisé pour la création du contrat ; si je n'interviens pas dans ce comparatif, il est utilisé tel quel,
   en revanche si je le modifie, celui-ci définira clairement le contrat », « et devient également celui qui servira de négociation », « il me faut le comparatif des offres
   entrées basé sur l'appel d'offres, non modifiable hormis pour y intégrer les montants des entreprises par unité ; puis un comparatif sur lequel je peux modifier les articles
   attribués et supprimer des articles qui ne seraient pas réalisés finalement ; les supprimer, cela ne veut pas dire les enlever de la soumission, mais les griser et surtout ne
   pas les additionner », « dans les documents de comparatif ajoute le tableau comparatif où il affiche tous les articles et montants pour l'ensemble des entreprises ») ═══
   COMPARATIF DES OFFRES (base) : svdDesc reçoit o.ro : articles, quantités, chapitres, subdivisions en lecture ; prix et conditions des entreprises restent saisissables (sg3_comparatif.js
   teste ecriture(X), pas ctx.ro) ; la fenêtre « Prix » n'y change plus la quantité (sgQteFixe, lu par svcPriceInput de DeltaSub.html).
   COMPARATIF CHOIX DES ARTICLES : étape « travail » de SV_TREE (nœuds travailEdit, travailNego, travailDocs), juste après le comparatif ; Négociation y est déplacée.
   Données : S.travail = {unite (copie de S.unites.C1), detail {contactId: copie de e.detail}, base (signature du comparatif des offres au moment de la copie : chapitres, quantités,
   prix, conditions d'offre et négociées, entreprises), emp (empreinte de la copie : chapitres et detail, sans les réglages d'affichage), modifie, le, par}.
   Tant que la copie est intacte (empreinte = emp, aucune saisie en attente), elle est refaite quand le comparatif des offres change et elle n'est pas enregistrée (svSoumVal) : le comparatif
   des offres est utilisé tel quel. À la première différence d'empreinte (à l'enregistrement), modifie passe à vrai : la copie est enregistrée et définit le contrat (svcTransferDoc et
   svcTransfer enveloppés : confirmation si le comparatif des offres a changé depuis, refus si l'entreprise proposée n'y a aucun prix), le transfert vers le contrôle des coûts (svcCostSource)
   et les montants du module Contrats d'entreprise et de la liste. « Mettre à jour depuis le comparatif des offres » (actualiser) reprend prix et quantités en gardant lignes grisées et
   conditions négociées ; « Repartir du comparatif des offres » (repartir) efface tout.
   Écran : les fonctions du moteur et de sg3_comparatif.js travaillent telles quelles, sur une VUE de S (vue) : X.S (getter redéfini, instr) rend, sur les nœuds de l'étape, un Proxy de S
   où unites.C1 = T.unite et chaque entreprise est un Proxy dont detail = T.detail[cid] ; la liste des entreprises est un Proxy du vrai tableau (lectures enveloppées, écritures déballées),
   tout le reste lit et écrit le vrai S (proposée, notes, documents). X.commit enregistre toujours le vrai S ; svSoumOp passe par svSoumVal, qui déballe une vue (svClose lit X.S).
   svbSyncAbbr et svRemap (« Actualiser l'adresse ») agissent sur le vrai S et suivent dans la copie. Un nouveau svEditor sur le même document reprend prev.S : _tr=false juste avant.
   Journal des saisies : j.tr dit sur quel comparatif reposer la saisie (sg3_comparatif.js : ecrire, saisir).
   Griser : q.sgNon sur la ligne de quantité de T.unite (svdCounted enveloppé : ni brut, ni net, ni rang, ni totaux de chapitre) ; la ligne reste à l'écran, grisée. Variante non principale :
   grisée d'office ; cochée seule (une ligne de quantité) → q.sgOui (comptée) et les autres variantes du groupe sont grisées ; une case qui couvre plusieurs lignes (titre, chapitre,
   « Tout réaliser ») ne fait que griser ou lever le grisage, sans changer de variante. Contrat (retenus) : les lignes grisées n'y sont pas reprises, ni les titres vidés par le grisage.
   Le menu « − » et le clic droit de cette étape grisent au lieu de supprimer. TABLEAU COMPARATIF : première ligne de COMPARATIF ▸ Documents et de son étape de travail (SVC_DOCS,
   svcOpenDoc enveloppé), PDF paysage au papier des contrats (sgDsPdf, option o.comparatif ; données : donnees). Styles #sgct-css, débogage window.SGCT. */
(function(){
const NOEUDS=new Set(['travailEdit','travailNego','travailDocs']), TYPE='sgTableauComparatif', E=s=>esc(String(s==null?'':s)), clone=x=>JSON.parse(JSON.stringify(x));
const hache=t=>{ let h=5381; for(let i=0;i<t.length;i++) h=((h*33)^t.charCodeAt(i))>>>0; return h.toString(36)+'.'+t.length; };
const reel=S=>(S&&S.__reel)||S;
/* empreinte de la copie : ce qui fait le contrat (chapitres, articles, quantités, prix, grisage) et les conditions ; pas le filtre, le tri, l'ordre des colonnes, le titre ni la date */
const empreinte=T=>hache(JSON.stringify({c:(T.unite||{}).chapitres||[],v:(T.unite||{}).variantes||[],d:T.detail||{}}));
const conds=d=>['offre','negociee'].map(k=>(((d||{})[k]||{}).conditions||[]).map(c=>[c.niv,c.genre,+c.valeur||0,c.texte||'',c.m!==false,c.ref||0]));
const sigBase=S=>{ const U=S.unites.C1; return hache(JSON.stringify([(U.chapitres||[]).map(ch=>[ch.numero,(ch.articles||[]).map(a=>[a.m,a.u||'',(a.quantites||[]).map(q=>[+q.quantite||0,q.gq||'',q.var||'',(q.prixEntreprises||[]).map(p=>[p.contactId,p.gp||'',+p.prix||0])])])]),
  (S.entreprises||[]).filter(e=>+e.contactId>0).map(e=>[e.contactId,!!e.prisEnCompte,conds(e.detail)])])); };
const actifX=X=>!!X&&(X._tr!=null?!!X._tr:NOEUDS.has(X.node)), enTravail=ctx=>ctx.et==='C1'&&!!ctx.X&&actifX(ctx.X);
window.sgQteFixe=X=>!!X&&!actifX(X);   /* fenêtre « Prix » au comparatif des offres : quantité en lecture (svcPriceInput) */
/* ── vue du contenu : Proxy de S, mêmes objets, comparatif de travail à la place du comparatif ── */
const MEMO=new WeakMap();
function vue(S){ const T=S.travail; let m=MEMO.get(S); if(m&&m.T===T) return m.v; m={T}; const pxs=new WeakMap(), arrs=new WeakMap();
  const pe=e=>{ if(!e||typeof e!=='object'||e.__e) return e; let p=pxs.get(e); if(!p){ p=new Proxy(e,{get(t,k){ return k==='__e'?t:k==='detail'?T.detail[t.contactId]:t[k]; },set(t,k,v){ if(k==='detail') T.detail[t.contactId]=v; else t[k]=v; return true; }}); pxs.set(e,p); } return p; };
  const arr=L=>{ let p=arrs.get(L); if(!p){ p=new Proxy(L,{get(t,k){ const v=t[k]; return typeof k==='string'&&/^\d+$/.test(k)?pe(v):v; },set(t,k,v){ t[k]=(v&&v.__e)||v; return true; }}); arrs.set(L,p); } return p; };
  const un=new Proxy(S.unites,{get(t,k){ return k==='C1'?T.unite:t[k]; },set(t,k,v){ if(k==='C1') T.unite=v; else t[k]=v; return true; }});
  m.v=new Proxy(S,{get(t,k){ if(k==='__reel') return t; if(k==='unites') return un; if(k==='entreprises') return Array.isArray(t.entreprises)?arr(t.entreprises):t.entreprises; return t[k]; },
    set(t,k,v){ if(k==='entreprises') t[k]=Array.isArray(v)?Array.from(v,x=>(x&&x.__e)||x):v; else if(k!=='unites') t[k]=v; return true; }});
  MEMO.set(S,m); return m.v; }
function copieBase(S){ const T={unite:clone(S.unites.C1),detail:{},modifie:false,base:sigBase(S),v:2}; svcEnts(S).forEach(e=>{ T.detail[e.contactId]=clone(svcDetail(e)); }); return T; }
function assurer(S){ if(S.travail&&S.travail.unite) return S.travail; S.travail=copieBase(S); const v=vue(S); svcSync(v); svcRecalcAll(v); S.travail.emp=empreinte(S.travail); return S.travail; }
const aBase=S=>!!(S&&S.unites&&S.unites.C1&&(S.unites.C1.chapitres||[]).length);
const intacte=T=>!!T&&!T.modifie&&!!T.emp&&empreinte(T)===T.emp&&!SGCP.VOL.jour.some(j=>j.tr)&&!SGCP.VOL.cours;
function instr(X){ if(X._S0) return; const g=Object.getOwnPropertyDescriptor(X,'S').get; X._S0=()=>g.call(X);
  Object.defineProperty(X,'S',{configurable:true,enumerable:true,get(){ const S=g.call(X); if(!actifX(X)||!aBase(S)) return S; assurer(S); return vue(S); }}); }
/* entrée sur un nœud de l'étape : la copie intacte suit le comparatif des offres ; une copie touchée (même pas encore enregistrée) est gardée */
function entrer(X){ instr(X); const S=X._S0(); if(!aBase(S)) return false; const T=S.travail; if(T&&T.unite&&T.v!==2){ T.base=sigBase(S); T.v=2; }   /* copie faite par la première version du 07.11.2026 (autre signature) : recalée, sans fausse alerte */ if(T&&(!T.unite||(intacte(T)&&T.base!==sigBase(S)))) S.travail=null; assurer(S); return true; }
/* enregistrement : jamais une vue ; la copie intacte ne part pas ; première modification constatée ici */
window.svSoumVal=function(S){ const R=reel(S), T=R&&R.travail; if(!T) return R; if(!T.modifie&&T.emp&&empreinte(T)!==T.emp){ T.modifie=true; T.le=today(); T.par=(typeof ME!=='undefined'&&ME&&ME.id)||''; setTimeout(majBandes,0); } return T.modifie?R:Object.assign({},R,{travail:undefined}); };
const ev0=svEditor; svEditor=function(m,id){ const P=SV_UI.ed&&SV_UI.ed.X; if(P) P._tr=false; return ev0(m,id); };
const ab0=svbSyncAbbr; svbSyncAbbr=function(S){ return ab0(reel(S)); };
const rm0=svRemap; svRemap=function(S,oldId,newId){ const r=rm0.apply(this,arguments), T=reel(S)&&reel(S).travail; if(T&&T.unite){
    (T.unite.chapitres||[]).forEach(ch=>(ch.articles||[]).forEach(a=>{ (a.quantites||[]).forEach(q=>(q.prixEntreprises||[]).forEach(x=>{ if(x.contactId===oldId) x.contactId=newId; }));
      if(a.textesEntreprise&&a.textesEntreprise[oldId]){ a.textesEntreprise[newId]=a.textesEntreprise[oldId]; delete a.textesEntreprise[oldId]; } }));
    if(T.detail&&T.detail[oldId]){ T.detail[newId]=T.detail[oldId]; delete T.detail[oldId]; } }
  return r; };
/* ── griser ── */
const actif=(U,q)=>!q.sgNon&&!q.sgVarNon&&(!q.var||!!q.sgOui||svdVarPrimary(U,q.gv,q.var));
const sc0=svdCounted; svdCounted=function(U,ch,q,gp){ if(q.sgNon||q.sgVarNon) return false; return q.sgOui&&q.var?sc0(U,ch,Object.assign({},q,{var:''}),gp):sc0(U,ch,q,gp); };
/* lignes de quantité d'une clé de ligne (quantité, article ou titre avec ses sous-articles, chapitre) */
const lignes=(U,k)=>{ const s=svdLook(U,k); if(s.q) return [{ch:s.ch,a:s.a,q:s.q}]; if(!s.ch) return []; const L=s.a?svdSubtree(s.ch,s.a):s.ch.articles; return L.flatMap(a=>(a.quantites||[]).map(q=>({ch:s.ch,a,q}))); };
/* une seule ligne (precis) : choix complet, variante comprise ; plusieurs : griser ou lever le grisage seulement. sgNon = grisé par choix ; sgVarNon = écarté parce qu'une autre
   variante du groupe a été choisie (une case de titre ou de chapitre ne le lève pas : la variante choisie reste) ; sgOui = variante non principale choisie */
const regler=(U,q,oui,precis)=>{ const av=actif(U,q); if(oui){ delete q.sgNon; if(precis){ delete q.sgVarNon; if(q.var&&!svdVarPrimary(U,q.gv,q.var)) q.sgOui=true; } } else { q.sgNon=true; if(precis) delete q.sgOui; } return av!==actif(U,q); };
const ecarter=(U,z)=>{ const av=actif(U,z); z.sgVarNon=true; delete z.sgOui; return av!==actif(U,z); };
function poser(X,k,oui){ const S=X.S, U=svdUnit(S,'C1'), L=k==='*'?(U.chapitres||[]).flatMap(c=>lignes(U,'c|'+c.numero)):lignes(U,k), precis=k!=='*'&&L.length===1; let ch=false;
  L.forEach(({q})=>{ if(regler(U,q,oui,precis)) ch=true; });
  if(precis&&oui&&L[0].q.var){ const q=L[0].q; U.chapitres.forEach(c=>c.articles.forEach(a=>a.quantites.forEach(z=>{ if(z!==q&&z.gv===q.gv&&z.var&&z.var!==q.var&&ecarter(U,z)) ch=true; }))); }
  if(ch) svcRecalcAll(S); return ch; }
const basculer=(X,k,oui)=>{ if(!X.can()){ X.redraw(); return; } if(SGCP.saisir(X,{k,c:'choix',t:oui?'1':'',et:'C1',choix:true})) SGCP.enregistrer(X); X.redraw(); };
/* une case seulement sur un article qui porte des quantités (07.11.2026, Paulo : « je souhaite uniquement sélectionner les articles qui contiennent une quantité ») ; chapitre, titre et
   total de chapitre deviennent gris quand toutes leurs lignes le sont (« si les articles supprimés appartiennent à un chapitre, le chapitre devient gris ») */
const cleArticle=(U,k)=>{ const s=svdLook(U,k); return !!(s.q||(s.a&&svdIsQtyArticle(s.ch,s.a)&&(s.a.quantites||[]).length)); };
const br1=svdBuildRows; svdBuildRows=function(ctx){ const R=br1(ctx); if(!enTravail(ctx)) return R; const U=ctx.U, peut=!ctx.X.ro&&svCanEdit(ctx.X.doc);
  R.forEach(r=>{ let k=String(r.k||''); if(/^t\|/.test(k)) k='c|'+k.split('|')[1]; if(!/^[acq]\|/.test(k)) return; const L=lignes(U,k); if(!L.length) return; const n=L.filter(x=>actif(U,x.q)).length; if(!n) r.cls=(r.cls||'')+' sgct-gris'; if(r._c||/svc-e/.test(r.cls||'')||k!==String(r.k)||!cleArticle(U,k)) return;
    r.cells.chx='<input type="checkbox" class="sgct-c" data-k="'+E(k)+'"'+(n?' checked':'')+(n&&n<L.length?' data-mix="1"':'')+(peut?'':' disabled')+' title="Coché : à réaliser. Décoché : grisé et non additionné." aria-label="À réaliser">'; });
  return R; };
const co1=svdColumns; svdColumns=function(ctx){ const L=co1(ctx); return enTravail(ctx)&&!L.some(c=>c.k==='chx')?[{k:'chx',t:'Réal.',w:40},...L]:L; };
/* « − » et clic droit : griser, jamais enlever de la soumission */
const griser=X=>{ const k0=SVD_UI.sel.C1, U=svdUnit(X.S,'C1'), k=k0&&cleArticle(U,k0)?k0:null, L=k?lignes(U,k):[], n=L.filter(x=>actif(U,x.q)).length;
  return [{t:'Griser (ne pas réaliser)',dis:!!X.ro||!n,fn:()=>basculer(X,k,false)},{t:'Réaliser',dis:!!X.ro||!L.length||n===L.length,fn:()=>basculer(X,k,true)}]; };
const me1=svcDescMenus; svcDescMenus=function(X,et,name,items){ const L=me1(X,et,name,items); if(et!=='C1'||!actifX(X)) return L;
  if(name==='minus') return [...griser(X),'-',{t:'Tout réaliser',dis:!!X.ro,fn:()=>basculer(X,'*',true)}];
  if(name==='context') return [...griser(X),'-',...(L||[]).filter(it=>!(it&&/^Supprimer/.test(it.t||'')))]; return L; };
/* ── bandeaux ── */
function texteBande(X,tr){ if(!tr) return '<b>Comparatif des offres</b><span>Articles et quantités de l’appel d’offres, non modifiables : on y saisit seulement les prix et les conditions des entreprises.</span>';
  const S=X._S0?X._S0():X.S, T=S.travail||{}, U=T.unite||{}, gr=(U.chapitres||[]).reduce((n,c)=>n+c.articles.reduce((m,a)=>m+(a.quantites||[]).filter(q=>!actif(U,q)).length,0),0), chg=T.modifie&&aBase(S)&&T.base!==sigBase(S);
  return '<b>Comparatif choix des articles</b>'+(T.modifie?'<span>Modifié le '+E(dfr(T.le))+(T.par?' par '+E(T.par):'')+' : ce comparatif définit le contrat et sert à la négociation.'+(gr?' '+gr+(gr>1?' lignes grisées, non additionnées.':' ligne grisée, non additionnée.'):'')+(chg?' <i>Le comparatif des offres a changé depuis (prix, quantités, conditions ou entreprises).</i>':'')+'</span>'
    +(chg?'<button type="button" class="sgct-maj">Mettre à jour depuis le comparatif des offres</button>':'')+'<button type="button" class="sgct-rep">Repartir du comparatif des offres</button>':'<span>Non modifié : le contrat reprendra le comparatif des offres tel quel. Décochez une ligne pour la griser ; elle n’est plus additionnée.</span>'); }
function majBandes(){ const X=SV_UI.ed&&SV_UI.ed.X, b=X&&X.el&&X.el.querySelector('.sgct-b'); if(b) b.innerHTML=texteBande(X,actifX(X)); }
async function repartir(X){ if(!X.can()) return; if(!await confirmDlg('Repartir du comparatif des offres ? Les lignes grisées, les modifications et les conditions négociées de ce comparatif de travail seront perdues.','Repartir')) return;
  const S=X._S0(); SGCP.VOL.jour=SGCP.VOL.jour.filter(j=>!j.tr); S.travail=null; assurer(S); try{ await X.commit(); }catch(_){ } X.redraw(); }
/* mise à jour : prix, quantités et conditions d'offre du comparatif des offres ; lignes grisées, variantes choisies et conditions négociées du comparatif de travail gardées */
async function actualiser(X){ if(!X.can()) return; if(!await confirmDlg('Reprendre les prix, les quantités et les conditions d’offre du comparatif des offres ? Les lignes grisées, les variantes choisies et les conditions négociées sont gardées ; les autres modifications de ce comparatif de travail sont remplacées.','Mettre à jour')) return;
  const S=X._S0(), A=S.travail||{}, cle=(ch,a,i)=>ch.numero+'|'+a.m+'|'+(a.u||'')+'|'+i, F=new Map(); ((A.unite||{}).chapitres||[]).forEach(ch=>ch.articles.forEach(a=>(a.quantites||[]).forEach((q,i)=>{ if(q.sgNon||q.sgOui||q.sgVarNon) F.set(cle(ch,a,i),{n:!!q.sgNon,o:!!q.sgOui,v:!!q.sgVarNon}); })));
  SGCP.VOL.jour=SGCP.VOL.jour.filter(j=>!j.tr); S.travail=null; const T=assurer(S);
  T.unite.chapitres.forEach(ch=>ch.articles.forEach(a=>(a.quantites||[]).forEach((q,i)=>{ const f=F.get(cle(ch,a,i)); if(f){ if(f.n) q.sgNon=true; if(f.o) q.sgOui=true; if(f.v) q.sgVarNon=true; } })));
  Object.keys(T.detail).forEach(cid=>{ const n=((A.detail||{})[cid]||{}).negociee; if(n&&(n.conditions||[]).length) T.detail[cid].negociee=clone(n); });
  svcRecalcAll(vue(S)); try{ await X.commit(); }catch(_){ } X.redraw(); }
function bandeau(X,tr){ css(); const b=document.createElement('div'); b.className='sgct-b'+(tr?' tr':''); b.innerHTML=texteBande(X,tr); b.onclick=e=>{ if(e.target.closest('.sgct-rep')) repartir(X); else if(e.target.closest('.sgct-maj')) actualiser(X); }; X.el.prepend(b); }
const de1=svdDesc; svdDesc=function(X,et,o){ if(et!=='C1') return de1(X,et,o); const tr=actifX(X), r=de1(X,et,tr?o:Object.assign({},o,{ro:true}));
  try{ bandeau(X,tr); const t=X.el.querySelector('table.sgcp-tb'); if(tr&&t){ t.querySelectorAll('input.sgct-c[data-mix]').forEach(i=>{ i.indeterminate=true; }); t.addEventListener('change',e=>{ if(e.target.classList&&e.target.classList.contains('sgct-c')) basculer(X,e.target.dataset.k,e.target.checked); }); t.addEventListener('dblclick',e=>{ if(e.target.classList&&e.target.classList.contains('sgct-c')) e.stopPropagation(); },true); } }catch(e){ console.error(e); } return r; };
/* ── étape de l'arbre ── */
const vide=X=>{ css(); const d=document.createElement('div'); d.className='sgct-vide'; d.innerHTML='<b>Pas encore de comparatif des offres.</b>Créez-le depuis l’appel d’offres (Transférer ▸ Créer le comparatif) : ce comparatif de travail en sera la copie.'; X.el.append(d); };
Object.assign(SVC_NODE,{travailEdit:X=>{ if(entrer(X)) svcEdit(X); else vide(X); },travailNego:X=>{ if(entrer(X)){ svcLetters(X,'bidding'); bandeau(X,true); } else vide(X); },travailDocs:X=>{ if(entrer(X)){ svcDocs(X); bandeau(X,true); } else vide(X); }});
const iC=SV_TREE.findIndex(s=>s.k==='priceComparison'); if(iC>=0){ const pc=SV_TREE[iC]; pc.subs=pc.subs.filter(x=>x[0]!=='priceComparisonDocumentsBidding'); SV_TREE.splice(iC+1,0,{k:'travail',t:'Comparatif choix des articles',etape:'C1',noeud:'CT',desc:0,subs:[['travailEdit','Éditer',3],['travailNego','Négociation',3],['travailDocs','Documents',3]]}); }
SV_NODE_OF.CT='travailEdit';
/* ── contrat : le comparatif de travail, s'il a été modifié ; lignes grisées et variantes non retenues écartées ── */
function retenus(U0){ const U=clone(U0);
  U.chapitres=(U.chapitres||[]).filter(ch=>{ const av=ch.articles.slice(), ote=new Set();
    av.forEach(a=>{ const q0=(a.quantites||[]).length; a.quantites=(a.quantites||[]).filter(q=>actif(U,q)); if(q0&&!a.quantites.length) ote.add(a); });
    if(!ote.size) return finir(ch);
    /* titres : retirés seulement s'ils ont perdu des descendants par le grisage et qu'il ne leur en reste aucun */
    for(let enc=true;enc;){ enc=false; av.forEach(a=>{ if(ote.has(a)||(a.quantites||[]).length) return; const D=svdSubtree({articles:av},a).filter(b=>b!==a); if(D.length&&D.some(b=>ote.has(b))&&D.every(b=>ote.has(b))){ ote.add(a); enc=true; } }); }
    ch.articles=av.filter(a=>!ote.has(a)); return ch.articles.some(a=>(a.quantites||[]).length)||!av.some(a=>ote.has(a)&&a.m!=='000')?finir(ch):false; });
  return U;
  function finir(ch){ ch.articles.forEach(a=>(a.quantites||[]).forEach(q=>{ if(q.sgOui){ q.var=''; q.gv=''; } delete q.sgOui; delete q.sgNon; delete q.sgVarNon; })); return true; } }
const td0=svcTransferDoc; svcTransferDoc=function(S,src,cible){ const R=reel(S), T=R&&R.travail; if(src!=='C1') return td0(S,src,cible); if(!T||!T.modifie) return td0(R,src,cible);
  const U=retenus(T.unite); if(!(U.chapitres||[]).length) return {err:'Tous les articles sont grisés dans le comparatif choix des articles.'};
  const p=svcProp(R); if(p&&!(T.unite.chapitres||[]).some(ch=>ch.articles.some(a=>(a.quantites||[]).some(q=>(q.prixEntreprises||[]).some(x=>x.contactId===p.contactId)))))
    return {err:'L’entreprise proposée n’a aucun prix dans le comparatif choix des articles : ouvrez-le (Éditer) pour le mettre à jour, ou repartez du comparatif des offres.'};
  const S3=clone(R); delete S3.travail; S3.unites.C1=U; (S3.entreprises||[]).forEach(e=>{ const d=T.detail[e.contactId]; if(d) e.detail=clone(d); });
  const r=td0(S3,src,cible); if(r.ok) R.unites[cible]=S3.unites[cible]; return r; };
/* comparatif des offres changé depuis la copie modifiée : le contrat reprendrait des prix anciens ; on le dit avant */
const tr0=svcTransfer; svcTransfer=async function(X,src,cible){ const S=X&&X.S&&reel(X.S), T=S&&S.travail;
  if(src==='C1'&&T&&T.modifie&&aBase(S)&&T.base!==sigBase(S)&&X.can()&&!await confirmDlg('Le comparatif des offres a changé depuis la création du comparatif choix des articles (prix, quantités, conditions ou entreprises). Le document sera créé à partir du comparatif choix des articles, sans ces changements. Continuer ?','Continuer')) return;
  return tr0.apply(this,arguments); };
/* contrôle des coûts : même source que le contrat */
const cs0=svcCostSource; svcCostSource=function(S,et){ const R=reel(S), T=R&&R.travail; return et==='C1'&&T&&T.modifie&&!(S&&S.__reel)&&aBase(R)?cs0(vue(R),et):cs0(S,et); };
/* ── tableau comparatif ── */
SVC_DOCS.unshift({type:TYPE,t:'Tableau comparatif',note:'tableauComparatif'});
const SIG={'≥':'>=','≤':'<=','∅':'Ø','≈':'env.','≠':'différent de','√':'racine de','→':'-','←':'-','‑':'-'}, RX_SIG=new RegExp('['+Object.keys(SIG).join('')+']','g'), sig=t=>String(t==null?'':t).replace(RX_SIG,c=>SIG[c]);
function donnees(X){ const S=X.S, U=svdNormUnit(svdUnit(S,'C1'),'C1'), a5=svcA5(S), tr=actifX(X), ents=SGCP.enOrdre(S).filter(e=>e.afficher!==false), V=svcView(S), R=svbRank(V), m=svdFmtAmt, L=[], st={}, chap=[], filtre=!!(U.filtre&&U.filtre.actif);
  ents.forEach(e=>{ st[e.contactId]={bas:0,vide:0}; });
  (U.chapitres||[]).forEach(ch=>{ const tot={}, tete={k:'ch',n:ch.numero,x:sig([ch.texte1,ch.texte2].filter(Boolean).join(' '))}, att=[]; let vu=false;
    const pousser=l=>{ if(!vu){ L.push(tete); vu=true; } L.push(...att.splice(0),l); }, grisT=k=>{ const G=lignes(U,k).filter(x=>svdInFilter(U,x.ch,x.q)); return G.length&&G.every(x=>!actif(U,x.q))?1:0; };
    ch.articles.forEach(a=>{ const qs=a.quantites||[], kw=sig(svdKeyword(a)||svdFirstLine(a.texte)||''); if(!qs.length){ if(a.m!=='000'&&kw) att.push({k:'ti',n:svdNum('',a.m,a.u),x:kw,g:grisT(svdKa(ch,a))}); return; }
      qs.forEach(q=>{ if(!svdInFilter(U,ch,q)) return; const g=!actif(U,q), sub=SVD_DIMS.filter(x=>q[x.k]).map(x=>q[x.k]).join(' '), compte=SVD_GQ_COUNT.includes(q.gq||'A');
        const C=ents.map(e=>{ const z=(q.prixEntreprises||[]).find(x=>String(x.contactId)===String(e.contactId)); if(!z){ if(compte&&!g) st[e.contactId].vide++; return {p:'',m:'',v:0}; }
          if(z.gp==='I') return {p:'Inclus',m:'',v:0}; if(z.gp==='N') return {p:'Non offert',m:'',v:0}; const ind=svdIndic({gq:q.gq,gp:z.gp,quantite:q.quantite,prix:z.prix},a5), n=+z.prix||0;
          if(q.gq==='W') return {p:n?m(n):'',m:'',v:n}; if(ind!=null) return {p:n?m(n):'',m:ind?'('+m(ind)+')':'',v:n,i:1};
          if(svdCounted(U,ch,q,z.gp)) tot[e.contactId]=(tot[e.contactId]||0)+(+z.montant||0); if(!n&&!g) st[e.contactId].vide++; return {p:n?m(n):'',m:n&&+z.montant?m(z.montant):'',v:n}; });
        const W=C.filter(c=>c.v>0).map(c=>c.v), lo=W.length>1?Math.min(...W):0, hi=W.length?Math.max(...W):0; if(lo&&lo<hi&&!g) C.forEach((c,i)=>{ if(c.v===lo){ c.b=1; st[ents[i].contactId].bas++; } });
        pousser({k:'ar',n:svdNum('',a.m,a.u),x:kw+(sub?' · '+sub:''),q:q.gq==='W'?'par':svdFmtQty(q.quantite),u:a.unite||'',c:C.map(c=>({p:c.p,m:c.m,b:c.b||0,i:c.i||0})),g:g?1:0}); }); });
    if(!vu&&filtre) return; if(!vu){ L.push(tete,...att); }
    tete.g=grisT('c|'+ch.numero); const T=ents.map(e=>m(svdRnd(tot[e.contactId]||0,a5))); chap.push({n:ch.numero,x:tete.x,c:T,g:tete.g}); L.push({k:'to',x:'Total chapitre '+ch.numero,c:T.map(t=>({p:'',m:t})),g:tete.g}); });
  /* conditions : une ligne par niveau, taux de chaque entreprise dans sa colonne « Prix unit. » */
  const lib=c=>sig(c.texte||(SVD_KIND[c.genre]&&SVD_KIND[c.genre][1])||'Condition'), niv=[...new Set(ents.flatMap(e=>svcDetail(e).offre.conditions.filter(c=>c.m!==false).map(c=>+c.niv||0)))].sort((a,b)=>a-b);
  const neg=ents.some(e=>svcDetail(e).negociee.conditions.length), ligneC=(x,f,fn)=>({x,f:f?1:0,c:ents.map(fn)});
  const P=[ligneC('Brut',0,e=>({p:'',m:m(svcDetail(e).offre.brut)})),...niv.map(n=>{ const C=ents.map(e=>svcDetail(e).offre.conditions.find(c=>c.m!==false&&(+c.niv||0)===n)||null), libs=[...new Set(C.filter(Boolean).map(lib))];
      return {x:libs.join(' / '),f:0,c:C.map(c=>c?{p:SVD_FORF.has(+c.genre)?'':num(c.valeur,2)+' %',m:m(c.montant)}:{p:'',m:''})}; }),
    ligneC('Net de l’offre',1,e=>({p:'',m:m(svcDetail(e).offre.net)})),...(neg?[ligneC('Net négocié',1,e=>{ const d=svcDetail(e); return {p:'',m:d.negociee.conditions.length?m(d.negociee.net):''}; })]:[])];
  const Rf=svbRefEnt(V), d=X.doc||{}, p=X.p||{}, gr=L.filter(l=>l.g).length;
  return {sous:[[p.NUMBER,p.TITLE].filter(Boolean).join(' '),['CFC '+(d.BKP||''),d.AWARDINGTEXT].filter(Boolean).join(' ')].filter(Boolean).join(' · '),nature:(tr?'Comparatif choix des articles':'Comparatif des offres')+(filtre?' · document filtré (filtre actif)':''),
    ents:ents.map(e=>{ const ev=V.entreprises.find(x=>x.contactId===e.contactId), dt=svcDetail(e); return {nom:sig(svcName(e)),prop:e.proposee?1:0,rang:R[e.contactId]||'',net:m(dt.offre.net),neg:dt.negociee.conditions.length?m(dt.negociee.net):'',brut:m(dt.offre.brut),ecart:ev?svbGapBid(V,ev):'',bas:st[e.contactId].bas,vide:st[e.contactId].vide}; }),
    neg:neg?1:0,chap,lignes:L,pied:P,
    legende:'Fond jaune : prix le plus bas de la ligne. Entre parenthèses : montant indicatif, non additionné. (+) : entreprise proposée.'+(Rf?' Écart : net (négocié s’il existe) en % du net de la référence, '+sig(svcName(Rf))+'.':'')+(gr?' Gris : variante non retenue ou ligne non réalisée, non additionnée.':'')}; }
async function ouvrirTableau(X){ try{ const S=X.S; svcRecalcAll(S); const c=donnees(X); if(!c.ents.length){ ctMsg('Information','Aucune entreprise prise en compte.'); return; } const {w,R,fn}=await SGDS.ressources(), j=new w.Array(), d=X.doc||{}, titre='Tableau comparatif '+[d.BKP,d.AWARDINGTEXT].filter(Boolean).join(' ');
    const o=w.JSON.parse(JSON.stringify({titre:sig(titre),date:today(),type:'Tableau comparatif',description:c.nature,sousTitre:sig(((X.p||{}).NUMBER||'')+((X.p||{}).TITLE?' - '+X.p.TITLE:'')),comparatif:c})); o.journal=j; const oct=await fn(R,null,o); if(j.length) console.info('Tableau comparatif :',Array.from(j)); sgVisionneuse(new Blob([oct],{type:'application/pdf'}),titre+'.pdf'); }catch(e){ console.error(e); toast('Le PDF n’a pas pu être créé : '+(e&&e.message||e),true); } }
const od0=svcOpenDoc; svcOpenDoc=function(X,d){ if(!d||d.type!==TYPE) return od0(X,d); svcFiltreWarn(X.S,'C1'); ouvrirTableau(X); const op=svcDocEnsure(X,'C1',TYPE,null); if(op) DS.commit([op]).catch(()=>{}); };
const CSS=`
.sgct-b{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;padding:7px 12px;background:#fff;border-bottom:1px solid var(--s-filet);font-size:12.5px;line-height:1.35}
.sgct-b.tr{background:var(--s-jaune2)}
.sgct-b b{font-weight:700;white-space:nowrap}
.sgct-b i{font-style:normal;color:var(--s-rouge)}
.sgct-maj,.sgct-rep{border:0;background:none;padding:0;font:inherit;color:var(--s-nuit);text-decoration:underline;cursor:pointer;white-space:nowrap}
.sgct-maj{margin-left:auto;font-weight:700}
.sgct-b span+.sgct-rep{margin-left:auto}
html body .svd-tb tr.sgct-gris td,html body .svd-tb tr.sgct-gris td *{color:#a8a8a8!important}
html body .svd-tb tr.sgct-gris td{background:#f4f4f4!important}
html .svd-tb tr.sgct-gris .svd-tx{text-decoration:line-through}
html .svd-tb tr.sgct-gris input.sgcp-px{background:transparent}
.sgct-c{width:15px;height:15px;margin:0;accent-color:var(--s-nuit);cursor:pointer}
.sgct-vide{margin:24px;padding:18px;border:1px solid var(--s-filet);font-size:13px;line-height:1.5}
.sgct-vide b{display:block}
`;
const css=()=>{ if(!document.getElementById('sgct-css')){ const s=document.createElement('style'); s.id='sgct-css'; s.textContent=CSS; document.head.appendChild(s); } };
window.SGCT={poser,actif,lignes,retenus,donnees,ouvrirTableau,actifX,vue,assurer,entrer,sigBase,empreinte,intacte,actualiser,repartir,ecrire:(X,j)=>poser(X,j.k,!!j.t)};
})();

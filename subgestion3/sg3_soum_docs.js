/* ═══ SOUMISSION ▸ DOCUMENTS À LA MISE EN FORME DES DOCUMENTS DU DEVIS (15.11.2026, bloc 53 ; Paulo, après la soumission ouverte au graphisme du devis général :
   « Oui, les Documents ») ═══
   Tous les écrans de documents d'une soumission — Documents de chaque étape, Lettres d'accompagnement, Négociation, Courriers de refus, Descriptif par entreprise —
   ont la mise en forme de l'onglet Documents du devis : un titre de section sur filet noir, puis une ligne par document (titre, état, actions en texte) et la liste
   « Fichiers PDF » avec son registre daté (Créé le, Validé le, Par, Commentaire, Valider ▾, Archivés, Effacés).
   Le moteur garde tout : son écran (barre Éditer / Effacer / Fonctions / Partager, tableau, note) est dessiné comme avant puis masqué (.sgsd-x) ; chaque action d'une
   ligne appelle la sienne — double-clic de la ligne du tableau (ouvrir ou créer le document), entrée de ses menus pour la ligne choisie (note d'expédition,
   informations de l'entreprise, utiliser pour tous, effacer le document). Aucune règle n'est réécrite : droits, messages et enregistrements sont ceux du moteur.
   Trois formes de tableau reconnues à leurs titres de colonnes (lire) : F « Désignation | Document disponible | Indications » (Documents d'une étape : descriptif,
   commande, début de la préparation ; conditions générales et cahier complet de l'appel d'offres), T « Type de document » (Soumissionnaires, comparatifs), E « Entité »
   ou « Contact » (une ligne par entreprise). Écran non reconnu ou étape sans contenu : celui du moteur reste.
   NOUVEAU — PDF enregistrés (le moteur les annonçait « au lot 4 ») : « Créer le PDF » demande le nom (et un commentaire), fait le document sans l'afficher (capturer :
   la visionneuse du moteur s'ouvre masquée, ou la visionneuse commune est interceptée) et dépose le PDF dans le dépôt de fichiers, dossier de la soumission
   Construction/Devis/devis18/<projet>/<soumission>/<clé de l'élément> (ch03aDossier('soumission', …) du moteur ; clé = tenderDocuments, tenderingLetters…), avec
   son document d'origine (depotfichier.GENRE_DOC = « soum:<ligne> »). « Ouvrir le PDF » : le PDF validé de la ligne, sinon le plus récent en cours. Registre daté et
   archive définitive (ni remplacé, ni supprimé : rangé dans Effacés) : ceux du devis, étendus à ces dossiers dans sg3_devis.js (PDF_SOUM). Droit : documents : dépôt.
   Styles <style id="sgsd-css">, classes sgsd-*. Débogage : window.SGSD. DeltaSub.html seul garde ses écrans. */
(function(){
if(typeof svNodeFn!=='function'||typeof svStepOf!=='function'||typeof SV_TREE==='undefined'||typeof grid!=='function'||typeof ibtn!=='function'||!window.SGSV||!window.SGSV.outils) return;
const {E}=SGSV.outils;
const GENRE='soum:';
const CSS=`
.sgsd{flex:1 1 auto;min-height:0;overflow:auto;padding:0 0 16px}
.sgsd-x{display:none!important}
.sgsd-dh{display:flex;align-items:center;gap:8px;box-sizing:border-box;min-height:38px;border-top:2px solid var(--s-noir);padding:8px 0;margin:14px 0 0;font-size:14px;font-weight:700;color:var(--s-noir)}
.sgsd>.sgsd-dh:first-child{margin-top:8px}
.sgsd-dh .dr{margin-left:auto;display:flex;align-items:center;gap:2px}
.sgsd-dh .ib{border:0!important;background:transparent!important;box-shadow:none!important;border-radius:0!important;height:22px;padding:0 9px;font-size:12.5px;font-weight:700;color:var(--s-noir)}
.sgsd-dh .ib:hover{background:var(--s-jaune3)!important}
.sgsd-dh .ib .lb{display:inline!important}
.sgsd-dl{margin:0 0 22px}
.sgsd-dc{display:grid;grid-template-columns:minmax(240px,1fr) auto;gap:6px 18px;align-items:center;padding:10px 0;border-bottom:1px solid var(--s-filet)}
.sgsd-dc .t{min-width:0}
.sgsd-dc .t b{display:block;font-size:13.5px}
.sgsd-dc .t b i{font-style:normal;font-weight:400;font-size:12px;color:var(--s-gris);margin-left:10px}
.sgsd-dc .t span{display:block;font-size:12px;color:var(--s-gris);margin-top:1px}
.sgsd-dc .a{display:flex;flex-wrap:wrap;gap:2px;align-items:center;justify-content:flex-end}
.sgsd-dc .a .ib{border:0!important;background:transparent!important;box-shadow:none!important;border-radius:0!important;height:30px;padding:0 9px;font-size:12.5px;font-weight:700;color:var(--s-noir);cursor:pointer}
.sgsd-dc .a .ib:hover{background:var(--s-jaune3)!important}
.sgsd-dc .a .ib:disabled{color:#b9b9b6;cursor:default;background:transparent!important;opacity:1}
.sgsd-dc .a .sgsd-vd{visibility:hidden;height:30px;padding:0 9px;font-size:12.5px;font-weight:700;white-space:nowrap}
.sgsd-vide{padding:14px 0;font-size:12.5px;color:var(--s-gris);border-bottom:1px solid var(--s-filet)}
.sgsd-fz>.sgpdf:not(.sgpdf-stock){border:0!important;height:auto!important;min-height:64px;max-height:none!important}
.sgsd-note{font-size:12px;color:var(--s-gris);margin:16px 0 0}
.ov.sgsd-cap{opacity:0!important;pointer-events:none!important}
@container (max-width:900px){.sgsd-dc{grid-template-columns:1fr}.sgsd-dc .a{justify-content:flex-start;margin-left:-9px}.sgsd-dc .a .sgsd-vd{display:none}}
@media (max-width:1100px){.sgsd-dc{grid-template-columns:1fr}.sgsd-dc .a{justify-content:flex-start;margin-left:-9px}.sgsd-dc .a .sgsd-vd{display:none}}
`;
const css=()=>{ if(!document.getElementById('sgsd-css')){ const s=document.createElement('style'); s.id='sgsd-css'; s.textContent=CSS; document.head.appendChild(s); } };
const el=(t,c,x)=>{ const e=document.createElement(t); if(c) e.className=c; if(x!=null) e.innerHTML=x; return e; };
const txt=c=>c?String(c.textContent||'').replace(/\s+/g,' ').trim():'';
/* libellé d'un élément de l'arbre : « Appel d’offres › Documents » (titres de la fiche projet ▸ Documents) */
const LIB={}; SV_TREE.forEach(s=>s.subs.forEach(x=>{ LIB[x[0]]=s.t+' › '+x[1]; })); LIB.tenderDocuments=LIB.tenderDocuments||'Appel d’offres › Documents';
const libNoeud=k=>LIB[k]||k;
const estDoc=k=>!/Edit$/.test(k)&&k!=='tenderConditions'&&!!svStepOf(k);
const peutCreer=X=>{ try{ return !X.ro&&svCanEdit(X.doc); }catch(_){ return false; } };
const peutPdf=X=>{ try{ return !X.ro&&(typeof sgDroit!=='function'||!!sgDroit('documents','depot')); }catch(_){ return false; } };
const dosDe=(X,k)=>{ try{ return typeof ch03aDossier==='function'&&X.p?ch03aDossier('soumission',X.p.ID,X.id,k):null; }catch(_){ return null; } };
const etatPdf=r=>{ const e=r&&r.ETAT_PDF; return e==='valide'||e==='archive'||e==='supprime'?e:'cree'; };
/* PDF d'une ligne : le validé le plus récent, sinon le plus récent en cours (ni archivé, ni effacé) */
const pdfDe=(dos,cle)=>{ if(!dos||typeof ch03aFichiers!=='function') return null; let L=[]; try{ L=ch03aFichiers(dos); }catch(_){ return null; }
  L=L.filter(r=>r.GENRE_DOC===GENRE+cle&&etatPdf(r)!=='archive'&&etatPdf(r)!=='supprime').sort((a,b)=>String(b.MODIFIED||'').localeCompare(String(a.MODIFIED||'')));
  return L.find(r=>etatPdf(r)==='valide')||L[0]||null; };

/* ── lecture de l'écran du moteur ── */
function lire(X){ const root=X&&X.el; if(!root) return null; const bar=root.querySelector(':scope>.ph2'), pane=root.querySelector(':scope>.pane'), tb=pane&&pane.querySelector(':scope>table.g');
  if(!bar||!tb||!tb.tHead||!tb.tHead.rows[0]||!tb.tBodies[0]) return null;
  const H=[...tb.tHead.rows[0].cells].map(txt), ci=re=>H.findIndex(h=>re.test(h));
  const i={T:ci(/^Type de document$/),D:ci(/^Désignation$/),E:ci(/^(Entité|Contact)$/),A:ci(/^Document disponible$/),I:ci(/^Indications sur le document$/),N:ci(/^Note d.expédition$/),R:ci(/^Remarque$/),Resp:ci(/^Responsable$/),Sit:ci(/^Situation de l.offre$/)};
  const forme=i.D>=0&&i.I>=0?'F':i.T>=0?'T':i.E>=0?'E':null; if(!forme||i.A<0) return null;
  const B=[...bar.querySelectorAll('button.ib')], bt=t=>B.find(b=>b._sgB&&b._sgB.t===t)||null, vide=pane.querySelector(':scope>.empty');
  const note=[...root.children].find(c=>c!==bar&&c!==pane&&c.tagName==='DIV'&&!c.className&&/border-top/.test(c.getAttribute('style')||''))||null;
  return {root,bar,pane,tb,forme,i,trs:[...tb.tBodies[0].rows].filter(tr=>tr.dataset&&tr.dataset.k!=null),bEd:bt('Editer'),bEff:bt('Effacer'),bFon:bt('Fonctions'),note,vide:vide?txt(vide):''}; }
/* entrées d'un menu du moteur pour la ligne choisie (droits de l'ancien logiciel appliqués comme dans le menu) */
const items=b=>{ try{ const L=b&&b._sgB&&typeof b._sgB.menu==='function'?b._sgB.menu():[]; return ((typeof ch08bGuardItems==='function'?ch08bGuardItems(L,b):L)||[]).filter(x=>x&&x!=='-'&&typeof x.t==='string'); }catch(e){ console.error(e); return []; } };
const item=(b,re,n)=>items(b).filter(x=>re.test(x.t))[n||0]||null;
const RE={note:/^Note d.expédition/,info:/^Informations de l.entreprise/,tous:/^Utiliser ce document pour tous/,eff:/^Effacer le document$/,toutSup:/^Supprimer tous/};
const choisir=tr=>{ if(tr&&!tr.classList.contains('on')) tr.click(); };
const dbl=tr=>{ if(tr&&typeof tr.ondblclick==='function') tr.ondblclick(); };
const faire=(tr,b,re,n)=>{ if(tr) choisir(tr); const it=item(b,re,n); if(it&&!it.dis&&typeof it.fn==='function') it.fn(); };
const TITRE_F={order:'Commande',work:'Début de la préparation'};
const NOM_E={tenderingLetters:'Lettre d\'accompagnement',offerOverviewDocumentsBidding:'Négociation',priceComparisonDocumentsBidding:'Négociation',travailNego:'Négociation',offerOverviewRefuseLetters:'Courrier de refus',priceComparisonRefuseLetters:'Courrier de refus',priceComparisonDocumentsDesc:'Descriptif'};
/* lignes : {cle, titre, sous, nom (du PDF), etat, libOuvrir, exp, rem, ouvrir(), actions [{t, dis, fn}]} */
function lignes(X,k,P){ const cel=(tr,j)=>tr&&j>=0?txt(tr.cells[j]):'', dispo=tr=>cel(tr,P.i.A)==='✔', lib=ok=>ok||!peutCreer(X)?'Ouvrir':'Créer le document', sel0=P.trs.find(t=>t.classList.contains('on'))||null; let L=[];
  if(P.forme==='F'){ const G=[]; P.trs.forEach(tr=>{ const [g,kind]=String(tr.dataset.k).split('|'); if(!g||!kind) return; let o=G.find(x=>x.g===g); if(!o){ o={g,r:{}}; G.push(o); } o.r[kind]=tr; });
    const hors=g=>g==='cg'||g==='cahier', ordre=G.filter(o=>o.r.doc&&!hors(o.g)).map(o=>o.g);   /* « Effacer le document » : une entrée par groupe, dans cet ordre */
    L=G.filter(o=>o.r.doc).map(o=>{ const sp=hors(o.g), ok=dispo(o.r.doc), n=ordre.indexOf(o.g), ef=sp?null:item(P.bEff,RE.eff,n), t=TITRE_F[o.g]||cel(o.r.doc,P.i.D), A=[];
      if(o.r.exp&&!X.ro) A.push({t:'Note d’expédition…',fn:()=>dbl(o.r.exp)});
      if(ef) A.push({t:'Supprimer le document',eff:true,dis:!!ef.dis,fn:()=>faire(null,P.bEff,RE.eff,n)});
      return {cle:o.g,titre:t,nom:t.replace(/\s*\([^)]*\)\s*$/,''),etat:sp?(o.g==='cg'?(ok?'Conditions enregistrées':'Modèle du bureau'):(ok?'Disponible':'Conditions : modèle du bureau')):(ok?'Document créé':'Pas encore créé')   /* conditions générales : celles du projet ou du CFC enregistrées, sinon le modèle du bureau (sgCgDoc) */,libOuvrir:sp?'Ouvrir':lib(ok),exp:cel(o.r.exp,P.i.I),rem:cel(o.r.rem,P.i.I),ouvrir:()=>dbl(o.r.doc),actions:A}; }); }
  else L=P.trs.map(tr=>{ choisir(tr); const E_=P.forme==='E', ok=dispo(tr), nt=item(P.bEd,RE.note), inf=E_?item(P.bEd,RE.info):null, tous=E_?item(P.bFon,RE.tous):null, ef=item(P.bEff,RE.eff), t=cel(tr,E_?P.i.E:P.i.T), A=[];
      if(nt) A.push({t:'Note d’expédition…',dis:!!nt.dis,fn:()=>faire(tr,P.bEd,RE.note)});
      if(inf) A.push({t:'Informations de l’entreprise…',dis:!!inf.dis,fn:()=>faire(tr,P.bEd,RE.info)});
      if(tous) A.push({t:'Utiliser pour tous',dis:!!tous.dis,fn:()=>faire(tr,P.bFon,RE.tous)});
      if(ef) A.push({t:'Supprimer le document',eff:true,dis:!!ef.dis,fn:()=>faire(tr,P.bEff,RE.eff)});
      const sit=E_?cel(tr,P.i.Sit):'';
      return {cle:(E_?'ent:':'')+String(tr.dataset.k),titre:t,court:E_,sous:E_?cel(tr,P.i.Resp):'',nom:E_?(NOM_E[k]||'Document')+' - '+t.replace(/\s*\(\+\)\s*$/,''):t.replace(/\s*\([^)]*\)\s*$/,''),
        etat:(ok?'Document créé':'Pas encore créé'),sit,libOuvrir:lib(ok),exp:cel(tr,P.i.N),rem:cel(tr,P.i.R),ouvrir:()=>{ choisir(tr); dbl(tr); },actions:A}; });
  if(P.forme!=='F'&&sel0) choisir(sel0);
  return L; }

/* ── PDF : le document est fait sans être affiché ── */
const estPdf=by=>{ try{ return new TextDecoder('latin1').decode(new Uint8Array(by).slice(0,5))==='%PDF-'; }catch(_){ return false; } };
/* ouvrir() lance l'ouverture du moteur. Deux arrivées : la visionneuse du moteur (ch03bView, bloc 31 : cadre dont la source est le PDF), ouverte masquée puis refermée ;
   la visionneuse commune (sgVisionneuse : cahier complet, conditions générales, tableau comparatif, descriptif d'une soumission écrite), interceptée. Un message du
   moteur (« Vous devez préalablement définir une entreprise. ») reste affiché et arrête la création. */
async function capturer(ouvrir){ let ov=null, pris=null, autre=false;
  const mo=new MutationObserver(M=>{ for(const m of M) for(const n of m.addedNodes){ if(n.nodeType!==1||!n.classList||!n.classList.contains('ov')) continue;
    if(n.querySelector('iframe')){ if(!ov){ ov=n; n.classList.add('sgsd-cap'); } } else autre=true; } });
  mo.observe(document.body,{childList:true});
  const v0=sgVisionneuse; sgVisionneuse=function(b,nom){ pris={b,nom}; return {fermer(){},imprimer(){},telecharger(){},lecteur:null}; };
  try{ ouvrir();
    for(let n=0;n<240;n++){ await new Promise(z=>setTimeout(z,250));
      if(pris){ const b=pris.b, by=b&&typeof b.arrayBuffer==='function'?await b.arrayBuffer():b; return by&&estPdf(by)?new Uint8Array(by):null; }
      if(ov&&ov.classList.contains('sgdp-cap')){ ov.classList.remove('sgsd-cap'); ov=null; }   /* fenêtre d'une capture intérieure (cahier complet : descriptif du moteur) */
      const f=ov&&ov.querySelector('iframe');
      if(f&&f._sgimp&&String(f.src||'').startsWith('blob:')){ const by=await (await fetch(f.src)).arrayBuffer(); return estPdf(by)?new Uint8Array(by):null; }
      if(ov&&!ov.isConnected) return null;
      if(autre&&!ov) return null; }
    return null; }
  finally{ sgVisionneuse=v0; mo.disconnect(); if(ov&&ov.isConnected){ const b=ov.querySelector('.ft .btn.pri'); if(b) b.click(); else ov.remove(); } } }
const propre=t=>String(t||'').replace(/["*\/:;<>?|\\]+/g,'-').replace(/\s+/g,' ').trim();
const nomPdf=(X,L)=>{ const d=X.doc||{}; return propre([d.BKP,L.nom||L.titre].filter(Boolean).join(' ')).slice(0,90)+'.pdf'; };
const U={occ:false};
async function creerPdf(X,C,L){ if(U.occ){ toast('Un PDF est déjà en cours de création…'); return; } if(!C.dos||!peutPdf(X)) return; U.occ=true;
  try{ if(typeof ch03aPret==='function') await ch03aPret();
    const o={}, G=window.SGDE&&SGDE.pdf&&SGDE.pdf.SGPDF; if(G) G.genre=GENRE+L.cle;   /* document d'origine, lu par la fenêtre du nom (sg3_devis.js) */
    let pr; try{ pr=ch03bNouveauPdfDlg(nomPdf(X,L),C.dos,o); } finally{ if(G) G.genre=null; }
    const nom=await pr; if(nom==null) return;
    toast('Création du PDF…'); const oct=await capturer(L.ouvrir);
    if(!oct){ if(!document.querySelector('.ov')) toast('Le PDF n’a pas pu être créé : ouvrez le document pour voir ce qui manque.',true); return; }
    const rec=await ch03aDeposer(C.dos,nom,new Blob([oct],{type:'application/pdf'}),{projet:X.p.ID,origine:'pdf',bseq:o.bseq,remplacer:true});
    if(rec&&!rec.GENRE_DOC){ const cur=DS.get(CH03A_T,rec.ID)||rec; await DS.commit([{t:CH03A_T,id:cur.ID,val:Object.assign({},cur,{GENRE_DOC:GENRE+L.cle}),bseq:ctBseq(CH03A_T,cur.ID)}]).catch(()=>{}); }   /* repli : sans la fenêtre du devis, le document d'origine est posé ici */
    toast('PDF enregistré : '+((DS.get(CH03A_T,rec.ID)||rec).NOM)); }
  catch(e){ if(!(e&&(e.conflict||e.sgFige))){ console.error(e); toast('PDF non enregistré : '+((e&&e.message)||e),true); } }
  finally{ U.occ=false; if(COUR&&COUR.box.isConnected) COUR.maj(); } }

/* ── écran ── */
const MEM={};   /* défilement par soumission et élément */
let COUR=null, ECOUTE=false;
const noteTxt=P=>{ const t=txt(P.note).replace(/\s*\((impression|imprimer)[^)]*\)/gi,''); if(!t) return '';
  return t.split(/(?<=[.!?])\s+/).filter(s=>!/lot 4|navigateur|Double-clic/i.test(s))   /* phrases du moteur dépassées : PDF « au lot 4 », impression par le navigateur, double-clic sur le tableau */.join(' ').trim(); };
/* « Supprimer le document » : comme dans le devis — refusé si le document a un PDF enregistré en cours (archive définitive), question en clair sinon (celle du moteur,
   « Voulez-vous supprimer ce fichier définitivement ? », est remplacée le temps de l'appel ; sa suppression et ses contrôles restent) */
const MSG_FIGE='Ce document a un PDF enregistré, qui est une archive définitive : le document ne peut plus être supprimé.';
function effacer(X,C,L,fn){ if(pdfDe(C.dos,L.cle)){ if(typeof ch02aInfo==='function') ch02aInfo('Erreur',MSG_FIGE); else toast(MSG_FIGE,true); return; }
  const c0=confirmDlg; confirmDlg=function(m,b){ return c0.call(this,'Supprimer le document « '+L.titre+' » ?\nLa ligne repassera sur « Créer le document » : il pourra être recréé à tout moment. Les fichiers PDF déjà créés sont gardés.',b); };
  try{ fn(); } finally{ confirmDlg=c0; } }
function ligneEl(X,C,L){ const f=pdfDe(C.dos,L.cle), etat=[L.etat,C.dos?(f?(L.court?'PDF créé':'PDF créé : '+f.NOM):'sans PDF'):'',L.sit,L.exp?'expédition : '+L.exp:'',L.rem].filter(Boolean).join(' · ');   /* ligne d'une entreprise : nom du PDF dans la liste seulement (il répète le nom de l'entreprise) */
  const c=el('div','sgsd-dc','<div class="t"><b>'+E(L.titre)+(L.sous?'<i>'+E(L.sous)+'</i>':'')+'</b><span>'+E(etat)+'</span></div><div class="a"></div>'), a=c.querySelector('.a');
  a.append(ibtn({label:L.libOuvrir,fn:()=>L.ouvrir()}));
  if(C.dos) a.append(ibtn({label:'Créer le PDF',dis:!peutPdf(X),fn:()=>creerPdf(X,C,L)}),ibtn({label:'Ouvrir le PDF',dis:!f,fn:()=>{ const x=pdfDe(C.dos,L.cle); if(x) ch03aOuvrir(x); }}));
  (C.cols||(L.actions||[]).map(A=>A.t)).forEach(t=>{ const A=(L.actions||[]).find(x=>x.t===t);   /* mêmes colonnes d'actions sur toutes les lignes : place gardée pour une action absente */
    a.append(A?ibtn({label:A.t,dis:!!A.dis,fn:()=>A.eff?effacer(X,C,L,A.fn):A.fn()}):el('span','sgsd-vd',E(t))); });
  return c; }
function habDocs(X,k){ const P=lire(X); if(!P) return; css();
  const st=svStepOf(k), sub=st&&st.subs.find(x=>x[0]===k), titre=(sub&&sub[1])||'Documents', C={dos:dosDe(X,k)}, cleM=X.id+'|'+k, Ls=lignes(X,k,P);
  const box=el('div','sgsd'), dh=el('div','sgsd-dh','<b>'+E(titre)+'</b><span class="dr"></span>'), dl=el('div','sgsd-dl'), dr=dh.querySelector('.dr');
  C.cols=[]; Ls.forEach(L=>(L.actions||[]).forEach(A=>{ if(!C.cols.includes(A.t)) C.cols.push(A.t); }));
  /* fonctions de tout l'écran : celles du moteur qui ne portent pas sur une ligne (copier, CSV, supprimer tous les documents) */
  const globales=()=>[...items(P.bFon).filter(x=>!RE.tous.test(x.t)),...items(P.bEff).filter(x=>RE.toutSup.test(x.t)).map(x=>Object.assign({},x,{t:x.t.replace(/ et fichiers PDF$/,'')}))];   /* les PDF enregistrés sont une archive : ils ne sont pas supprimés */
  if(globales().length) dr.append(ibtn({i:'gear',t:'Fonctions',menu:globales}));
  box.append(dh,dl);
  let z=null; if(C.dos&&typeof ch03cPdfZone==='function'){ try{ z=ch03cPdfZone({dossier:C.dos,projet:X.p.ID,fusionNom:'',hauteur:120,lectureSeule:()=>!peutPdf(X)}); }catch(e){ console.error(e); z=null; } }
  if(z&&z.el){ const fz=el('div','sgsd-fz'); fz.append(z.el); box.append(el('div','sgsd-dh','<b>Fichiers PDF</b>'),fz); }
  const nt=noteTxt(P); if(nt) box.append(el('p','sgsd-note',E(nt)));
  const maj=()=>{ if(Ls.length) dl.replaceChildren(...Ls.map(L=>ligneEl(X,C,L))); else dl.replaceChildren(el('div','sgsd-vide',E(P.vide||'Aucun document.'))); if(z&&z.redraw) try{ z.redraw(); }catch(e){ console.error(e); } };
  P.bar.classList.add('sgsd-x'); P.pane.classList.add('sgsd-x'); if(P.note) P.note.classList.add('sgsd-x');
  P.root.insertBefore(box,P.bar); maj();
  box.scrollTop=MEM[cleM]||0; box.addEventListener('scroll',()=>{ MEM[cleM]=box.scrollTop; });
  COUR={box,maj,X,k};
  if(!ECOUTE&&typeof DS.on==='function'&&typeof CH03A_T!=='undefined'){ ECOUTE=true; DS.on(ts=>{ const c=COUR; if(c&&c.box.isConnected&&(ts||[]).includes(CH03A_T)) try{ c.maj(); }catch(e){ console.error(e); } }); } }
const n0=svNodeFn; svNodeFn=function(k){ const f=n0(k); if(typeof f!=='function'||!estDoc(k)) return f;
  return function(X){ const r=f.apply(this,arguments); try{ habDocs(X,k); }catch(e){ console.error(e); } return r; }; };
window.SGSD={lire,lignes,habDocs,capturer,pdfDe,dosDe,libNoeud,GENRE,U};
})();

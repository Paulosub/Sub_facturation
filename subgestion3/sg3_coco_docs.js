/* ═══ CONTRÔLE DES COÛTS ▸ DOCUMENTS AU GRAPHISME DU DEVIS (10.11.2026, bloc 52 ; Paulo, en regardant le document « Contrôle des coûts » : « créer le même visuel
   que pour devis, fenêtre identique et document également, adapte les options du volet à droite ») ═══
   Choix de Paulo (10.11.2026) : colonnes « Standard » comme l'écran (les présentations du document restent au choix), paysage par défaut, état du coût en rouge
   (dépassement) / vert (économie), graphisme du devis aussi pour les listes ; les lettres (contrat, avenant, mutation, bons, ordre, arrêté de compte) gardent leur rendu
   au papier des contrats (bloc 31).
   - FENÊTRE : tous les documents ouverts depuis Contrôle des coûts ▸ Documents (ch01aOpen enveloppé) ont la fenêtre des documents du devis (SGDE.vue = vueDocG de
     sg3_devis.js) : bandeau jaune (numéro, « Contrôle des coûts · Documents », nom du document, désignation · pages · format), chiffres Pages et État (statut du contrôle
     des coûts), Imprimer, PDF ▾, Partager ▾, lecteur de l'app (page gardée à chaque réglage), volet Réglages à droite ; « Modifier les textes… » dans l'en-tête pour les
     lettres (textes de leur modèle). Lecture seule : profil sans « chantier : écriture » ou contrôle des coûts verrouillé (ch03dLecture).
   - DOCUMENTS REDESSINÉS (ch01aRender enveloppé : même PDF dans la fenêtre, « Créer le PDF », « Sauvegarder et ouvrir », « Partager » — page repérée /*sgimp:id*\/ dont
     le PDF est déjà fait, comme le devis général) : « Contrôle des coûts » (costControlOverview), « Devis général » (costControlEstimate), listes des contrats et avenants,
     des mutations, des paiements, compte d'entreprise, liste des garanties. Données = jobs du moteur (ch01aOverviewJob, ch01aKvJob, …) sur une copie de travail
     (présentation et propriétés réglées par le volet ; rien n'est écrit dans le contrôle des coûts), dessin = livret « Bleu nuit » du devis général (sgDsPdf,
     o.livretDG) : page de garde éditoriale (gardeEdito : état, numéro, titre, rubriques ouvrage / maître de l'ouvrage / architecte / direction des travaux), bande bleu
     nuit des titres de colonnes, CFC à 1 chiffre en bleu nuit, à 2 chiffres en gras, détails en gris, total sur bande bleu nuit, textes jamais coupés.
   - Récapitulatif CFC à 1 chiffre toujours imprimé, celui à 2 chiffres sur demande (règle de Paulo pour le devis général, 10.11.2026).
   - RÉGLAGES : enregistrés dans le document (cocodoc.options.sgPdf, un seul DS.commit, jamais dans le contrôle des coûts) ; ceux qui existaient déjà restent à leur
     place (arrondis des lettres : cocodoc.options de leur section ; tri et récapitulatif TVA des paiements, tri et adresses des garanties : présentation du contrôle
     des coûts, comme l'en-tête de la section). Rien n'est écrit tant qu'on ne choisit rien.
   Débogage : window.SGCD. */
(function(){
if(typeof ch01aOpen!=='function'||typeof ch01aRender!=='function'||typeof ch01aRec!=='function'||!window.SGDE||!SGDE.vue||!SGDE.livret) return;
const {DG_RH,DG_CFC,DG_HP,DG_HT,DG_TXT,deGardeRub,deNomAdr}=SGDE.livret;
/* tableaux élargis (Paulo, 10.11.2026 : « élargir le tableau, aligner le CFC à gauche sur la marge pour élargir les colonnes du tableau ») : le CFC part de la marge de la
   page (x 28.35, comme l'en-tête) au lieu de la colonne du pied (x 85.04, devis) ; même bord droit (barre du numéro de page) : 56,69 pt de plus pour les colonnes */
const MARGE_G=28.35, DG_X0T=MARGE_G, DG_WL=SGDE.livret.DG_WL+(SGDE.livret.DG_X0T-MARGE_G), DG_WP=SGDE.livret.DG_WP+(SGDE.livret.DG_X0T-MARGE_G);
const ecrit=()=>{ try{ return !!sgDroit('chantier','ecriture'); }catch(_){ return true; } };
const ETATS=typeof CC_STATE!=='undefined'?CC_STATE:{0:'Provisoire',1:'En cours',2:'Etat intermédiaire',3:'Terminé'};
const ETAT_GARDE={0:'PROVISOIRE',1:'EN COURS',2:'ÉTAT INTERMÉDIAIRE',3:''};   /* mot rouge de la page de garde ; rien pour un contrôle terminé (comme un devis validé) */
const sv=x=>String(x==null?'':x);
const LISTES=new Set(['costControlAwardList','costControlMutationsList','costControlPaymentList','costControlEntrepreneurSummary','costControlGuaranteeList']);
const genre=o=>{ const t=sv(o&&o.type); return t==='costControlOverview'?'overview':t==='costControlEstimate'?'estimate':LISTES.has(t)?'liste':''; };
const LIMB={paysage:595.276-85.9,portrait:841.89-89.245};   /* bas de l'encre du logo (comme le devis général) */

/* ── réglages du document : cocodoc.options.sgPdf. Réglages en attente d'envoi gardés en mémoire (PP : seulement les clés changées), envois à la suite, chacun
   sur la version la plus récente du document (relecture du 10.11.2026 : après un refus, l'envoi suivant ne renvoie plus une copie périmée) ── */
const PP=new Map(), PA=new Map(), FILE=new Map(), CARTES=new Map();   /* CARTES : document → positions par page du dernier PDF (sauts de page au clic droit) */
const msgRefus=e=>{ const m=sv(e&&e.message); toast('Réglage non enregistré'+(m&&!/^session$/i.test(m)?' : '+m:' (droits ou projet non modifiable)'),true); };
const optsBase=id=>{ const r=DS.get('cocodoc',id); return Object.assign({},(((r&&r.options)||{}).sgPdf)||{}); };
const optsDe=o=>{ const id=ch01aId(o.E,o.dossier); return Object.assign(optsBase(id),PP.get(id)||{}); };
const envoi=(id,M,patch,go,fin)=>{ M.set(id,Object.assign({},M.get(id)||{},patch));
  const net=()=>{ const q=M.get(id); if(!q) return; Object.keys(patch).forEach(k=>{ if(q[k]===patch[k]) delete q[k]; }); if(!Object.keys(q).length) M.delete(id); };
  const p=(FILE.get(id)||Promise.resolve()).catch(()=>{}).then(go); FILE.set(id,p);
  p.then(()=>{ net(); if(fin) fin(true); },e=>{ net(); console.error(e); msgRefus(e); if(fin) fin(false); }); };
const optsSet=(o,patch,fin)=>{ const id=ch01aId(o.E,o.dossier);
  envoi(id,PP,patch,()=>{ const r=DS.get('cocodoc',id); return ch01aSave(o.E,o.dossier,{options:Object.assign({},(r&&r.options)||{},{sgPdf:Object.assign(optsBase(id),patch)})}); },fin); };
/* options existantes de la section (arrondis des lettres) : cocodoc.options de la section, comme la roue dentée du moteur (ch01aGear) ; seulement pour les documents
   qui les lisent (relecture du 10.11.2026 : l'ordre de paiement ne les lit pas) */
const ARR_TYPES=new Set(['costControlContractSummary','costControlAddendumSummary','costControlContractPaymentSummary','costControlGeneralPaymentSummary','costControlGuaranteeSummary']);
const baseArr=d=>{ const x=sv(d); return /^award/.test(x)?'award':/^finalpayment/.test(x)?'finalpayment':/^paymentorder/.test(x)?'paymentorder':''; };
const arrDe=o=>{ const b=baseArr(o.dossier), a=ch01aArr(o.E,b), q=PA.get(ch01aId(o.E,b))||{}; return {cond:q.roundContractSummary!=null?q.roundContractSummary:a.cond,tot:q.addRoundedTotalKey!=null?q.addRoundedTotalKey:a.tot}; };
const arrSet=(o,k,v,fin)=>{ const b=baseArr(o.dossier), id=ch01aId(o.E,b);
  envoi(id,PA,{[k]:v},()=>{ const r=DS.get('cocodoc',id); return ch01aSave(o.E,b,{options:Object.assign({},(r&&r.options)||{},{[k]:v})}); },fin); };
/* réglages du moteur rangés dans le contrôle des coûts (tri et récapitulatif TVA des paiements, tri et adresses des garanties) : même garde que le moteur
   (ch01dPayDraw) — version lue à l'ouverture de la fenêtre ; modifié ailleurs entre-temps ou enregistrement non retrouvé : fenêtre fermée, rien d'écrit en silence */
const moteurSet=(o,poser,lire)=>()=>{ const E=o.E||{}, C=E.C, id=E.id, D=o._sgD, fermer=m=>{ toast(m,true); if(D) try{ D.close(); }catch(_){} setTimeout(()=>{ const v=VIEWS['coco']; if(v&&v.editorRefresh) v.editorRefresh(); },0); };
  if(!C||!E.touch) return;
  if(typeof ctBseq==='function'&&ctBseq('costcontrol',id)!==o._ccSeq){ fermer('⚠ Contrôle des coûts modifié entre-temps sur un autre poste : la fenêtre est fermée, rouvrez le document pour reprendre la version à jour.'); return; }
  poser(C); const voulu=JSON.stringify(lire(C)), t=E.touch();
  if(t&&typeof t.then==='function') t.then(()=>{ const r=DS.get('costcontrol',id); if(r&&JSON.stringify(lire(r))===voulu){ if(typeof ctBseq==='function') o._ccSeq=ctBseq('costcontrol',id); return; }
    fermer('Réglage non enregistré : la fenêtre est fermée, rouvrez le document pour reprendre la version à jour.'); },e=>{ console.error(e); fermer('Réglage non enregistré.'); }); };

/* ── mesure du texte aux vraies polices (une seule fois) et coupure aux mots (comme hoOctets du devis) ── */
let MES=null;
const mesure=()=>MES||(MES=(async()=>{ const {w,R}=await SGDS.ressources(); const pd=await w.PDFLib.PDFDocument.create(); pd.registerFontkit(w.fontkit);
  const fL=await pd.embedFont(R.polices.light), fB=await pd.embedFont(R.polices.bold);
  const larg=(t,b)=>{ try{ return (b?fB:fL).widthOfTextAtSize(String(t),DG_TXT); }catch(_){ return String(t).length*DG_TXT*0.5; } };
  const couper=(t,b,wd)=>{ const s0=String(t); if(wd<=8||larg(s0,b)<=wd) return [s0]; const L=[]; let cur='';
    s0.split(' ').forEach(m=>{ const e=cur?cur+' '+m:m; if(larg(e,b)<=wd){ cur=e; return; } if(cur.trim()) L.push(cur); if(larg(m,b)<=wd){ cur=m; return; }
      let x=''; for(const ch of m){ if(x&&larg(x+ch,b)>wd){ L.push(x); x=ch; } else x+=ch; } cur=x; }); if(cur.trim()) L.push(cur); return L.length?L:[s0]; };
  return {larg,couper}; })().catch(e=>{ MES=null; throw e; }));
/* texte jamais coupé : une cellule de texte trop large déborde sur les colonnes de texte vides à sa droite, sinon passe à la ligne (rangées de suite k:1) */
const etaler=(rows,cols,M)=>{ const out=[]; rows.forEach(r=>{ const c=r.c||[], b=r.s==='O'||r.s==='W'||r.s==='T';
    const place=j=>{ let wd=(+cols[j].w||0)-4; for(let k=j+1;k<cols.length&&cols[k]&&(!cols[k].r||r.debR)&&+cols[k].w&&!sv(c[k]).trim();k++) wd+=+cols[k].w; return wd-1.5; };   /* r.debR : aussi sur les colonnes de montants vides */
    const L=c.map((x,j)=>{ const col=cols[j]; if(!col||col.r||!(+col.w)||!sv(x).trim()) return [x]; return sv(x).split('\n').flatMap(pp=>pp.trim()?M.couper(pp,b,place(j)-(r.cal&&j===1?7:0)):['']); });   /* lignes voulues (adresses « 2 lignes », « Complète ») gardées */
    const n=Math.max(1,...L.map(x=>x.length));
    for(let i=0;i<n;i++){ const ci=L.map(x=>x[i]==null?'':x[i]); out.push(i===0?Object.assign({},r,{c:ci}):Object.assign({c:ci,s:r.s,k:1},r.cal?{cal:1}:{},r.ital?{ital:1}:{},r.filet?{filet:1}:{},r.cc?{cc:r.cc}:{},r.debR?{debR:1}:{})); } });
  return out; };
/* pages : cap rangées par page, coupure de préférence avant une position (rangée de tête), pages complétées (rangées E) ; récapitulatif aligné en bas sur le logo */
const paginer=(rows,cols,cap,titre,digit,o2)=>{ const P=[]; let i=0; o2=o2||{}; const SB=o2.sauts||null, cle=r=>sv((r.c||[])[0]).trim();
  while(i<rows.length){ let k=Math.min(rows.length,i+cap), force=false;
    if(SB&&SB.size) for(let j=i+1;j<k;j++){ const r=rows[j]; if(!r.k&&SB.has(cle(r))){ k=j; force=true; break; } }   /* saut de page avant la position (réglage du document) */
    if(!force&&k<rows.length) for(let j=k;j>k-8&&j>i;j--){ const r=rows[j]; if(cle(r)&&!r.k){ k=j; break; } }
    const rr=rows.slice(i,k); const pg={type:2,titre,digit,lpp:cap,cols,rows:rr}; if(o2.recap) pg.recapTitre=o2.recap; if(o2.carte) pg.carte=true; P.push(pg); i=k; }
  P.forEach(pg=>{ const R=pg.rows; let last=-1; R.forEach((r,j)=>{ if((r.c||[]).some(x=>sv(x).trim())) last=j; });
    if(o2.recap&&last>=0) pg.dy=Math.max(0,Math.round((o2.limb-(122+(last+1)*DG_RH))*100)/100);
    while(R.length<cap) R.push({c:[],s:'E'}); });
  return P; };
const ABREV={'Contrats + avenants':'Contrats + av.','Coût probable':'Coût prob.','Renchérissement':'Renchériss.','Etat du coût':'État du coût','DG rév.':'DG rév.','Devis général':'DG',
  'Contrats moins paiements':'Contr. − paiem.','DG rév. moins paiements':'DG rév. − paiem.','Bénéfice d’adjudication':'Bénéf. adjud.','Provision':'Provisions'};
const ABREV2={'Contrats + av.':'Contr. + av.','État du coût':'État coût','Coût prob.':'Coût prob.','Paiements':'Paiem.','Variations':'Variat.','Transferts':'Transf.'};   /* colonnes étroites (colonne Entreprise) */
const titresAjustes=(T,wd,M)=>{ const ttc=T.length>0&&T.every(t=>/\sTTC$/.test(sv(t).trim())), out=T.map(t=>{ let x=sv(t).trim(); if(ttc) x=x.replace(/\s+TTC$/,'');
    if(M.larg(x,true)>wd&&ABREV[x]) x=ABREV[x]; if(M.larg(x,true)>wd&&ABREV2[x]) x=ABREV2[x]; return x; }); return {T:out,ttc}; };
const recol=t=>sv(t).replace(/(\p{Ll})- (?!(?:et|ou|à)\s)(\p{Ll})/gu,'$1$2');   /* sauf « pré- et post-… » */   /* mots coupés en fin de ligne dans les données de l'ancien logiciel */
const num=t=>{ const x=sv(t).replace(/[’'\s ()+]/g,'').replace('−','-'); return x&&isFinite(+x)?+x:null; };
const couleur=t=>{ const v=num(t); return v==null?null:v>0.005?'rouge':v<-0.005?'vert':null; };
const setProp=(band,k,v)=>{ if(!band) return; const L=band.tableProperties||(band.tableProperties=[]), x=L.find(y=>+y.k===k); if(x) x.v=v; else L.push({k,v}); };
/* compte d'entreprise : l'entreprise (dossier « entrepreneur/<contact> ») ; rapport des paiements filtré : texte du filtre et maître de l'ouvrage des ouvrages filtrés
   (relecture du 10.11.2026 : le nouveau dessin ne gardait que les tableaux) */
const entDe=o=>{ if(sv(o.type)!=='costControlEntrepreneurSummary') return null; const m=/^entrepreneur\/(.+)$/.exec(sv(o.dossier)); if(!m) return null;
  const c=DS.get('contact',isNaN(+m[1])?m[1]:+m[1])||DS.get('contact',m[1]); return c?deNomAdr(c):null; };
const filtreDe=o=>{ if(sv(o.type)!=='costControlPaymentList') return null; const C=o.E.C||{}, f=C.filtrePaiements, p=o.E.p; if(!f||!f.applique||typeof ch01dFilterText!=='function') return null;
  const nb=p?DS.by('subproject','PROJECT_ID',p.ID).length:0, m=typeof ch01aMoOuv==='function'?ch01aMoOuv(p,(f.ouvrages||[]).map(x=>x[0])):null, cid=m&&(m.id!=null?m.id:m.ID);
  return {txt:sv(ch01dFilterText(f,nb,false)).replace(/\s*\n\s*/g,' · ').trim(),mo:cid!=null?DS.get('contact',cid):null}; };
/* signatures du « Contrôle des coûts » (Paulo, 10.11.2026 : « supprimer la signature lorsque le document s'appelle contrôle des coûts, ajouter lorsqu'il s'agit du
   décompte final ») : d'office seulement si le nom du document contient « décompte final » ; case « Signatures » du volet pour un autre choix */
const estDecompte=rec=>/d[ée]compte\s+final/i.test(sv(rec&&rec.doc&&rec.doc.nom).normalize('NFC'));
const sautsDe=o=>{ const x=optsDe(o).sauts||{}; return {cfc:Array.isArray(x.cfc)?x.cfc.map(String):[],sans:x.sans===true}; };
const sautsActifs=o=>{ const x=sautsDe(o); return new Set(x.sans?[]:x.cfc); };
const sigDe=(o,rec)=>{ const v=optsDe(o).sig; return v!=null?!!v:estDecompte(rec); };
const titreDe=(o,rec)=>{ const t=sv(rec.doc&&rec.doc.nom||o.label||'Document'), e=entDe(o); return e&&e.nom?t+' · '+e.nom:t; };
const garde=(o,rec,sig)=>{ const E=o.E, p=E.p||{}, doc=DS.get('costcontroldocument',E.id)||{}, rub=deGardeRub(p,{filter:null}), e=entDe(o), F=filtreDe(o);
  if(F&&F.mo){ const k=rub.findIndex(x=>/ma[iî]tre/i.test(sv(x.lib))); if(k>=0) rub[k]=Object.assign({},rub[k],deNomAdr(F.mo)); }
  if(e&&e.nom) rub.unshift({lib:'Entreprise',nom:e.nom,adr:e.adr});
  return {edito:true,statut:ETAT_GARDE[+doc.STATECODE]!=null?ETAT_GARDE[+doc.STATECODE]:'PROVISOIRE',num:sv(p.NUMBER).trim(),titre:sv(rec.doc&&rec.doc.nom||o.label||'Document').toLocaleUpperCase('fr'),
    sous:'',info:'',marge:'',filtre:F?(F.txt?'Filtre : '+F.txt:'Paiements filtrés'):'',rub,sig:sig||[]}; };
const sortie=async(o,rec,pages,ori,type)=>{ const {w,R,fn}=await SGDS.ressources(), p=o.E.p||{}, T0=titreDe(o,rec), F=filtreDe(o);
  const sT={b:true,z:DG_TXT}, st={T:sT,O:sT,W:sT,F:sT,S:{b:false,z:DG_TXT},D:{b:false,z:DG_TXT},X:{b:false,z:DG_TXT},E:{b:false,z:DG_TXT}};
  const op=optsDe(o), signe=type==='estimate'||(type==='overview'&&sigDe(o,rec)), couverture=op.garde===false?null:garde(o,rec,signe?['Le maître de l’ouvrage :','L’architecte :']:[]);
  if(couverture) pages.unshift({type:0,titre:T0,rows:[]}); else if(pages[0]) pages[0].type=1;
  pages.forEach(pg=>{ if(pg.type!==0) pg.titre=T0; });   /* en-tête de chaque page : nom du document (et de l'entreprise) */
  { const W0=ori==='portrait'?DG_WP:DG_WL, car={ori,pages:[]}; let cur=null;
    pages.forEach(pg=>{ if(!pg.carte){ car.pages.push({}); cur=null; return; } const its=[];
      (pg.rows||[]).forEach((r,j)=>{ const c=r.c||[], c0=sv(c[0]).trim(), pl=c.some(x=>sv(x).trim()), y=122+(+pg.dy||0)+j*DG_RH;
        if(c0&&!r.k&&r.s!=='T'&&r.s!=='E'){ cur={cle:c0,n:c0,t:sv(c[1]).trim()}; its.push(Object.assign({},cur,{y,h:DG_RH})); }
        else if(pl&&r.s!=='T'&&cur){ const L0=its[its.length-1]; if(L0&&L0.cle===cur.cle) L0.h=y+DG_RH-L0.y; else its.push(Object.assign({},cur,{suite:true,y,h:DG_RH})); } });
      car.pages.push({items:its,x:DG_X0T-2,w:W0+4}); });
    CARTES.set(ch01aId(o.E,o.dossier),car); }
  const opt=w.JSON.parse(JSON.stringify({titre:T0,sousTitre:[p.NUMBER,p.TITLE].filter(Boolean).join(' - ')+(F?' · Filtré':''),date:today(),type:'Contrôle des coûts',description:T0+' '+[p.NUMBER,p.TITLE].filter(Boolean).join(' ')+(F?' (filtre)':''),
    livretDG:{couverture:couverture||{},pages,st,zebra:false,style:'nuit',deborde:true,rh:DG_RH,orientation:ori,x0:28.35,x0Tab:DG_X0T,aligne:true,corpsTitres:DG_TXT,calRetrait:7}})), j=new w.Array(); opt.journal=j;
  const oct=await fn(R,null,opt); if(j.length) console.info(T0+' :',Array.from(j)); return oct; };
const largeurs=(ori,nv,wv0)=>{ const W=ori==='portrait'?DG_WP:DG_WL, cap=Math.max(1,Math.floor((ori==='portrait'?DG_HP:DG_HT)/DG_RH)); let tw=W-DG_CFC-nv*wv0, wv=wv0;
  if(tw<170&&nv){ wv=Math.max(44,(W-DG_CFC-170)/nv); tw=W-DG_CFC-nv*wv; }
  if(tw<120&&nv){ wv=Math.max(24,(W-DG_CFC-120)/nv); tw=W-DG_CFC-nv*wv; }   /* présentation de 15 colonnes et plus (relecture du 10.11.2026) : montants en corps réduit plutôt qu'une désignation négative */
  return {W,tw,wv,cap}; };

/* ═══ « Contrôle des coûts » (costControlOverview) ═══ */
/* présentation choisie : enregistrée par son nom et son rang (relecture : une reprise qui réordonne les présentations ne change pas le document en silence) */
const PDF_STD=()=>{ const L=CC_PRES_DEF.Standard.slice(); if(!L.includes('additionalCostsTot')&&CC_COL.additionalCostsTot){ const i=L.indexOf('contractAndAddendumTot'); L.splice(i>=0?i+1:L.length,0,'additionalCostsTot'); } return L; };
const presDe=(C,op)=>{ const L=((C.presentations||{}).controle)||[], v=op.pres; if(v==null) return null;
  if(typeof v==='object'){ const x=L[+v.i]; if(x&&sv(x.nom)===sv(v.nom)) return x; return L.find(y=>sv(y.nom)===sv(v.nom))||null; } return L[+v]||null; };
const estStandard=P=>{ const a=(P&&P.colonnes||[]).map(c=>c.id).join('|'); return a===CC_PRES_DEF.Standard.join('|'); };
const favDe=C=>{ const L=((C.presentations||{}).controle)||[]; return L.find(x=>x.favori)||L[0]||null; };
const DETK=['mut','ctr','pay','prov'];
/* couleurs des écritures de l'écran (légende du contrôle des coûts, sg3_coco.js) : mutations, contrats, paiements, provisions et coût probable */
const COUL_ECR={mut:'#993300',ctr:'#FF6633',pay:'#003366',prov:'#555555',cpp:'#555555'};
const detDefaut=(Pr,k)=>{ if(!Pr) return true; return (Pr.colonnes||[]).some(c=>c.details&&CC_COL[c.id]&&(CC_COL[c.id].det===k||(k==='prov'&&CC_COL[c.id].det==='cpp'))); };
const bandeDe=(rec,nom)=>{ try{ return ch01aBands((rec&&rec.doc&&rec.doc.report)||{},nom)[0]||null; }catch(_){ return null; } };
/* valeurs par défaut : celles de la présentation choisie (sinon la favorite) et des propriétés du modèle (relecture du 10.11.2026) */
const ovEtat=(o,rec)=>{ const C=o.E.C||{}, op=optsDe(o), P=presDe(C,op), F=favDe(C), Pr=P||F, fo=(Pr&&Pr.options)||{};
  return {op,C,P,niv:op.niv||(fo.displayOnlyThreeDigitPos?'3':'tout'),ent:op.ent!==false,ouv:op.ouv!=null?!!op.ouv:ch01aProp(bandeDe(rec,'costcontrolOverviewSummaryTable'),1,false),
    centres:false,recap2:op.recap2===true,   /* page « Centres de coût » retirée (Paulo, 10.11.2026 : « supprimer ») ; code gardé dans ovOctets */docu:op.doc!==false,det:op.det!==false,dk:k=>op['det_'+k]!=null?!!op['det_'+k]:detDefaut(Pr,k),
    mutDate:op.mutDate!=null?!!op.mutDate:ch01aProp(bandeDe(rec,'costcontrolOverviewTable'),0,true),dateFacture:op.dateFacture!=null?!!op.dateFacture:!!fo.invoiceNumberInsteadOfPayNumber,
    dernier:op.dernier!=null?!!op.dernier:!!fo.markFinalPays,marque:fo.finalPayment!=null&&sv(fo.finalPayment).trim()?sv(fo.finalPayment).trim():'+',format:op.format==='portrait'?'portrait':'paysage'}; };
async function ovOctets(o,rec){ await DS.need(['subproject','contact','projectmember','contactowner','setting']).catch(()=>{});
  const M=await mesure(), S=ovEtat(o,rec), C=S.C, F=favDe(C)||{}, fo=F.options||{};
  /* copie de travail : présentation choisie (Standard par défaut, comme l'écran) avec les détails des écritures choisis ; options du document */
  /* colonnes du PDF « Standard » = celles de l'écran + « Provision TTC » après « Contrats + avenants » (Paulo, 10.11.2026, exemple 23COL du 04.06.2025 : « ajoute les
     colonnes dans le pdf contrôle du coûts ») */
  const std=PDF_STD().map(id=>({id,idDelta:CH01A_IDD[id],details:!!(CC_COL[id]&&CC_COL[id].det)}));
  const colonnes=(S.P?S.P.colonnes||[]:std).map(c=>{ const x=Object.assign({},c), k=CC_COL[c.id]&&CC_COL[c.id].det; if(k){ const kk=k==='cpp'?'prov':k; x.details=S.det&&S.dk(kk); } return x; });
  const options=Object.assign({},fo,S.P?S.P.options||{}:{},{markFinalPays:S.dernier,invoiceNumberInsteadOfPayNumber:S.dateFacture,displayOnlyThreeDigitPos:false});
  const C2=Object.assign({},C,{presentations:Object.assign({},C.presentations||{},{controle:[{nom:S.P?S.P.nom:'Standard',favori:true,colonnes,options}]}),titresColonnes:S.P?C.titresColonnes||{}:{}});
  const rep=ch01aPrep(rec.doc.report); ch01aBands(rep,'costcontrolOverviewSummaryTable').forEach(b=>{ setProp(b,0,'displayTwoDigitPositions'); setProp(b,1,S.ouv); });
  ch01aBands(rep,'costcontrolOverviewTable').forEach(b=>setProp(b,0,S.mutDate));
  const E2=Object.assign({},o.E,{C:C2}), J=ch01aOverviewJob(E2,rep), flex=ch01aFlex(C2,'controle'), T=J.tables||{};
  const titres=(T.costcontrolOverviewTable&&T.costcontrolOverviewTable.flex)||flex.map(x=>x.t), nv=flex.length;
  const ori=S.format==='portrait'&&nv<=5?'portrait':'paysage', G=largeurs(ori,nv,nv>8?52:62);
  /* colonne Entreprise (exemple 23COL) : en paysage, si la place le permet (désignation ≥ 104 pt, entreprise ≥ 90 pt) ; sinon l'entreprise passe dans la désignation */
  let aEnt=S.ent&&ori==='paysage', wv=G.wv, dw=G.tw, ew=0;
  if(aEnt){ const base=G.W-DG_CFC; wv=Math.max(40,Math.min(62,(base-230)/nv)); const reste=base-nv*wv; if(reste<190) aEnt=false; else { ew=Math.max(84,reste*0.43); dw=reste-ew; } }   /* colonne Entreprise réduite au profit de la désignation (Paulo, 10.11.2026 : « réduire la largeur de la colonne entreprise ») */   /* entreprise et écritures sur une ligne le plus souvent (montants en corps à peine réduit si besoin) */
  const TA=titresAjustes(flex.map((x,i)=>titres[i]||x.t),wv-4,M);   /* « Transferts TTC » → « Transferts » quand tous les montants sont TTC (dit dans le titre de la désignation) */
  const vcols=flex.map((x,i)=>({t:TA.T[i],w:wv,r:true,pct:!!(CC_COL[x.id]&&CC_COL[x.id].pct)}));
  const tD=!TA.ttc?'Désignation':M.larg('Désignation · montants TTC',true)<=dw-6?'Désignation · montants TTC':'Désignation · TTC';   /* colonne étroite : titre court */
  const cols=[{t:'CFC',w:DG_CFC,r:false},{t:tD,w:dw,r:false}].concat(aEnt?[{t:'Entreprise',w:ew,r:false}]:[],vcols);
  const colsR=[{t:'CFC',w:DG_CFC,r:false},{t:'Désignation',w:dw+ew,r:false}].concat(vcols);   /* récapitulatifs : sans colonne Entreprise */
  const iEtat=flex.map((x,i)=>CC_COL[x.id]&&CC_COL[x.id].f==='etatCout'?i:-1).filter(i=>i>=0);
  const kindDe=f=>{ const i=(f||[]).findIndex(v=>sv(v).trim()); const cc=i>=0&&flex[i]?CC_COL[flex[i].id]:null; return cc&&cc.det?cc.det:''; };
  const lg=c=>{ const s=sv(c).trim(); return !s?0:(typeof cfcLevel==='function'?cfcLevel(s):s.length); };
  const fabrique=avecEnt=>(c0,txt,f,s,ent)=>{ const j0=avecEnt?3:2, n=[c0,txt].concat(avecEnt?[sv(ent)]:[],(f||[]).map(sv)), r={c:n,s};
    if(s==='W'){ r.cf={}; n.forEach((x,j)=>{ if(j>=j0&&sv(x).trim()) r.cf[j]='r'; }); }
    if(s!=='T'&&s!=='D'&&iEtat.length){ const cc={}; iEtat.forEach(i=>{ const k=couleur(n[i+j0]); if(k) cc[i+j0]=k; }); if(Object.keys(cc).length) r.cc=cc; } return r; };
  const ligneR=fabrique(false), ligneD=fabrique(aEnt), j0D=aEnt?3:2;
  /* récapitulatif (1 et 2 chiffres, ouvrages, total) */
  const sum=((T.costcontrolOverviewSummaryTable||{}).rows||[]).map(r=>{ const c=r.c||[]; if(r.st==='ct') return Object.assign(ligneR('','Total',r.f,'T'),{lv:0});
    const c0=sv(c[0]).trim(); if(c0){ const n=lg(c0); return Object.assign(ligneR(c0,recol(c[1]),r.f,n===1?'O':n===2?'W':'S'),{lv:n}); }
    return Object.assign(ligneR('',sv(c[2]),r.f,'S'),{lv:-1}); });   /* ouvrage : nom dans la désignation */
  const recap=max=>{ const out=[]; let garde=false; sum.forEach(r=>{ if(r.s==='T'){ out.push(r); return; } if(r.lv>0){ garde=r.lv<=max; if(garde) out.push(r); return; } if(garde) out.push(r); }); return out; };
  /* document principal, ordre de l'exemple 23COL : position (avec son entreprise si elle n'en a qu'une), mutations / provisions sous la désignation, puis chaque entreprise
     et ses contrats et paiements (colonne Entreprise) ; écritures aux couleurs de l'écran par type (Paulo, 10.11.2026 : « conserver les couleurs du contrôle des coûts
     par type »), en italique, sans trait vertical, ligne claire dessous, sans le signe « > » de l'ancien logiciel ; total */
  const max=S.niv==='tout'?99:+S.niv, ov=[]; let blk=null;
  const ecriture=(r,k)=>{ const enEnt=aEnt&&(k==='ctr'||k==='pay'), txt=sv((r.c||[])[2]).replace(/^\s*[^\p{L}\p{N}(«"'’]+\s*/u,'');
    const x=enEnt?ligneD('','',r.f,'D',txt):ligneD('',txt,r.f,'D',''), col=(typeof ccCouleurs==='function'?ccCouleurs(C):COUL_ECR)[k==='pay'&&r.pk==='payh'?'payh':k]||null, jt=enEnt?2:1; x.ital=1; x.filet=1; x.debR=1;   /* écriture : déborde sur les montants vides à sa droite plutôt que de passer à la ligne (colonne Entreprise étroite) */
    if(col){ x.cc={}; x.c.forEach((v,j)=>{ if(j===jt||(j>=j0D&&sv(v).trim())) x.cc[j]=col; }); } return x; };
  const vider=()=>{ if(!blk) return; const G2=blk.groupes;
    if(aEnt&&G2.length===1&&G2[0].row){ blk.pos.c[2]=G2[0].row.c[2]; G2[0].row=null; }   /* une seule entreprise : sur la ligne de la position (exemple 23COL) */
    ov.push(blk.pos,...blk.libres); G2.forEach(g=>{ if(g.row) ov.push(g.row); ov.push(...g.det); }); blk=null; };
  ((T.costcontrolOverviewTable||{}).rows||[]).forEach(r=>{ const c=r.c||[];
    if(r.st==='ct'){ vider(); ov.push(ligneD('','Total',r.f,'T','')); return; }
    const c0=sv(c[0]).trim();
    if(c0){ vider(); const n=lg(c0); if(n<=max) blk={pos:ligneD(c0,recol(c[1]),r.f,n===1?'O':n===2?'W':'S',''),groupes:[],libres:[]}; return; }
    if(!blk) return;
    if(r.st==='cd'){ if(!S.det) return; const k=kindDe(r.f), x=ecriture(r,k); if(k==='ctr'||k==='pay'){ const g=blk.groupes[blk.groupes.length-1]; if(g){ g.det.push(x); return; } } blk.libres.push(x); return; }
    /* entreprise */
    const nom=aEnt?sv(c[2]).replace(/,\s*[^,]+$/,''):sv(c[2]);   /* colonne Entreprise : le nom sans la localité (exemple 23COL) */
    const er=S.ent?(aEnt?ligneD('','',r.f,'S',nom):ligneD('',nom,r.f,'S','')):null; if(er) er.debR=1;
    blk.groupes.push({row:er,det:[]}); });
  vider();
  const pages=[];
  if(S.centres){ const cen=((T.costcontrolTotalTable||{}).rows||[]), Wc=G.W-DG_CFC, wc=Math.min(96,(Wc-170)/3);
    const colsC=[{t:'',w:DG_CFC,r:false},{t:'Centres de coût',w:Wc-3*wc,r:false},{t:'Montant HT',w:wc,r:true},{t:'TVA',w:wc,r:true},{t:'Montant TTC',w:wc,r:true}];
    const rc=cen.map(r=>{ const c=(r.c||[]).map(sv), x={c:['',c[0],c[1],c[2],c[3]],s:'S'}; if(/^etat du co[uû]t/i.test(c[0])){ const k=couleur(c[3]); if(k) x.cc={2:k,3:k,4:k}; } return x; });
    if(rc.length) pages.push(...paginer(etaler(rc,colsC,M),colsC,G.cap,'Centres de coût',0,{})); }
  const RT=TA.ttc?'Récapitulatif · montants TTC':'Récapitulatif';   /* titres sans « TTC » : la mention reste sur les récapitulatifs */
  pages.push(...paginer(etaler(recap(1),colsR,M),colsR,G.cap,'Récapitulatif',0,{recap:RT,limb:LIMB[ori]}));
  if(S.recap2) pages.push(...paginer(etaler(recap(2),colsR,M),colsR,G.cap,'Récapitulatif',1,{recap:RT,limb:LIMB[ori]}));
  if(S.docu) pages.push(...paginer(etaler(ov,cols,M),cols,G.cap,sv(rec.doc.nom||'Contrôle des coûts'),2,{sauts:sautsActifs(o),carte:true}));
  return sortie(o,rec,pages,ori,'overview'); }

/* ═══ « Devis général » du contrôle des coûts (costControlEstimate) ═══ */
const kvEtat=(o,rec)=>{ const C=o.E.C||{}, op=optsDe(o), L=((C.presentations||{}).devis)||[], P=L.find(x=>x.favori)||L[0]||{}, po=P.options||{}, pp=C.parametres||{}, fac=pp.facteurDG!=null?+pp.facteurDG:1;
  const subs=(C.positions||[]).some(x=>(x.parOuvrage||[]).some(y=>y.actif!==false&&y.ouvrage));
  const KP=typeof ch01aKvPref==='function'?ch01aKvPref(C):{tot:po.referProcToTotal!==false,sansDec:po.displayAfterCommaValues!==false};   /* défauts du moteur (relecture : vrais si non réglés) */
  return {op,C,P,subs,fac,format:op.format==='paysage'?'paysage':'portrait',niv:op.niv||'tout',ouv:subs&&(op.ouv!=null?!!op.ouv:ch01aProp(bandeDe(rec,'costcontrolEstimateTable'),0,true)),recap2:op.recap2===true,docu:op.doc!==false,
    pctTot:op.pctTot!=null?!!op.pctTot:!!KP.tot,sansDec:op.sansDec!=null?!!op.sansDec:!!KP.sansDec,indexe:fac!==1&&op.indexe===true}; };
async function kvOctets(o,rec){ await DS.need(['subproject','contact','projectmember','contactowner','setting']).catch(()=>{});
  const M=await mesure(), S=kvEtat(o,rec), C=S.C, P=S.P;
  const C2=Object.assign({},C,{presentations:Object.assign({},C.presentations||{},{devis:[{nom:P.nom||'Standard',favori:true,colonnes:P.colonnes||[],options:Object.assign({},P.options||{},{referProcToTotal:S.pctTot,displayAfterCommaValues:S.sansDec})}]})});
  const rep=ch01aPrep(rec.doc.report); ch01aBands(rep,'costcontrolEstimateTable').forEach(b=>setProp(b,0,S.ouv)); ch01aBands(rep,'costcontrolSummaryEstimateTable').forEach(b=>{ setProp(b,0,false); if(!S.subs) setProp(b,1,false); });   /* subdivisions du récapitulatif : celles du modèle */
  const J=ch01aKvJob(Object.assign({},o.E,{C:C2}),rep), T=J.tables||{}, ori=S.format;
  const aSum=((T.costcontrolSummaryEstimateTable||{}).rows||[]).some(r=>!sv((r.c||[])[0]).trim()&&sv((r.c||[])[2]).trim()), aO=S.ouv||aSum, W=ori==='portrait'?DG_WP:DG_WL, cap=Math.max(1,Math.floor((ori==='portrait'?DG_HP:DG_HT)/DG_RH));
  let wv=62, wo=30; const wp=30, nM=3+(S.indexe?1:0), reste=()=>W-(DG_CFC+(aO?2*wo:0)+nM*wv+wp);
  if(reste()<150) wv=Math.max(50,wv-(150-reste())/nM); if(aO&&reste()<150) wo=Math.max(24,wo-(150-reste())/2);   /* désignation d'au moins 150 pt si possible (relecture du 10.11.2026) */
  const fixe=W-reste();
  const cols=[{t:'CFC',w:DG_CFC,r:false},{t:'Désignation',w:W-fixe,r:false}].concat(aO?[{t:'OUV',w:wo,r:false},{t:'Loc.',w:wo,r:false}]:[],
    [{t:'Montant HT',w:wv,r:true},{t:'TVA',w:wv,r:true},{t:'Montant TTC',w:wv,r:true}],S.indexe?[{t:'DG indexé',w:wv,r:true}]:[],[{t:'%',w:wp,r:true,pct:true}]);
  const lg=c=>{ const s=sv(c).trim(); return !s?0:(typeof cfcLevel==='function'?cfcLevel(s):s.length); };
  const conv=r=>{ const c=(r.c||[]).map(sv), vals=[c[4],c[5],c[6]].concat(S.indexe?[c[7]]:[],[c[8]]), mid=aO?[c[2],c[3]]:[];
    if(r.st==='ct') return {c:['','Total'].concat(mid,vals),s:'T',lv:0};
    const c0=c[0].trim(); if(c0){ const n=lg(c0), s=r.st==='c1'||n===1?'O':(r.st==='c2'||n===2)?'W':'S', x={c:[c0,recol(c[1])].concat(mid,vals),s,lv:n};
      if(s==='W'){ x.cf={}; x.c.forEach((v,j)=>{ if(j>=2+mid.length&&sv(v).trim()) x.cf[j]='r'; }); } return x; }
    return {c:['',''].concat(mid,vals),s:'S',lv:-1}; };   /* subdivision : ouvrage et localisation dans leurs colonnes */
  const garderNiv=(rows,max)=>{ const out=[]; let vis=true; rows.forEach(r=>{ if(r.s==='T'){ out.push(r); return; } if(r.lv>0){ vis=r.lv<=max; if(vis) out.push(r); return; } if(vis) out.push(r); }); return out; };
  const est=((T.costcontrolEstimateTable||{}).rows||[]).map(conv), sum=((T.costcontrolSummaryEstimateTable||{}).rows||[]).map(conv);
  const pages=[];
  pages.push(...paginer(etaler(garderNiv(sum,1),cols,M),cols,cap,'Récapitulatif',0,{recap:'Récapitulatif',limb:LIMB[ori]}));
  if(S.recap2) pages.push(...paginer(etaler(garderNiv(sum,2),cols,M),cols,cap,'Récapitulatif',1,{recap:'Récapitulatif',limb:LIMB[ori]}));
  if(S.docu) pages.push(...paginer(etaler(garderNiv(est,S.niv==='tout'?99:+S.niv),cols,M),cols,cap,sv(rec.doc.nom||'Devis général'),2,{sauts:sautsActifs(o),carte:true}));
  return sortie(o,rec,pages,ori,'estimate'); }

/* ═══ Listes (contrats et avenants, mutations, paiements, compte d'entreprise, garanties) : tableaux du modèle, valeurs mises en texte comme le bloc 31
   (SGIMP.preparer), dessinés au graphisme du devis ═══ */
async function listeOctets(o,rec,R0){ const id=/\/\*sgimp:([a-z0-9]+)\*\//.exec(sv(R0&&R0.css)); if(!id||!window.SGIMP||!SGIMP.preparer) throw new Error('document non repéré');
  const M=await mesure(), P=SGIMP.preparer(id[1]), job=(P.jobs||[])[0]||{T:{}}, op=optsDe(o), ori=op.format==='portrait'?'portrait':'paysage';
  const W=ori==='portrait'?DG_WP:DG_WL, cap=Math.max(1,Math.floor((ori==='portrait'?DG_HP:DG_HT)/DG_RH)), pages=[];
  (P.rep.sections||[]).filter(s=>s&&s.isVisible!==false).forEach(sec=>(sec.bands||[]).forEach(b=>{ if(!b||b.isH||b.class!=='TableBand'||!b._sgk) return; const T=job.T[b._sgk]; if(!T||!(T.rows||[]).length) return;
    const rows=T.rows.map(r=>{ const c=r.fuse?[sv(r.c[0])]:r.c.map(sv), s=r.st==='tt'||r.st==='ct'?'T':(r.st==='c2'||r.gras)?'W':'S'; return {c,s}; });
    /* largeurs d'après le contenu (les largeurs du modèle de l'ancien logiciel coupaient les titres) : nombres et dates à leur largeur, textes jusqu'à 220 pt (à la
       ligne au-delà) ; place restante aux textes ; manque de place : textes réduits jusqu'à 50 pt, puis toutes les colonnes */
    const rC=T.cols.map(c=>c.ha==='right'||!!c.num), besoin=T.cols.map((c,j)=>Math.max(M.larg(c.titre||'',true),...rows.map(r=>r.c.length===1&&j>0?0:M.larg(sv(r.c[j]),r.s!=='S')))+6);
    let wv=besoin.map((b,j)=>rC[j]?b:Math.min(b,220)), tot=wv.reduce((a,b)=>a+b,0); const tx=wv.map((_,j)=>!rC[j]);
    if(tot<W){ const st=wv.reduce((a,b,j)=>a+(tx[j]?b:0),0), xs=W-tot; wv=wv.map((b,j)=>st?(tx[j]?b+xs*b/st:b):b+xs/wv.length); }
    else if(tot>W){ let tr=wv.reduce((a,b,j)=>a+(tx[j]?b:0),0), surplus=tot-W; const red=Math.min(surplus,Math.max(0,tr-50*tx.filter(Boolean).length));
      if(red>0) wv=wv.map((b,j)=>tx[j]?Math.max(50,b-red*b/tr):b); tot=wv.reduce((a,b)=>a+b,0); if(tot>W) wv=wv.map(b=>b*W/tot); }
    const cols=T.cols.map((c,j)=>({t:c.titre||'',w:wv[j],r:rC[j]}));
    pages.push(...paginer(etaler(rows,cols,M),cols,cap,sv(rec.doc.nom||o.label||'Liste'),2,{})); }));
  if(!pages.length) throw new Error('aucun tableau');
  return sortie(o,rec,pages,ori,'liste'); }

/* ── rendu repéré : le PDF est fait ici, la fenêtre, « Créer le PDF » et « Partager » le reprennent (sgImpPdf du bloc 31) ── */
const r0=ch01aRender;
ch01aRender=function(o,rec){ const g=genre(o); if(!g||!window.SGIMP||typeof SGDS==='undefined'||!rec||!rec.doc||!rec.doc.report) return r0.apply(this,arguments);
  const S=window.SGIMP; let R0=null; if(g==='liste') R0=r0.apply(this,arguments);   /* listes : rendu du moteur d'abord (repère et valeurs du bloc 31) */
  const id=(++S.n).toString(36)+'c'+Date.now().toString(36);
  const pdf=(g==='overview'?ovOctets(o,rec):g==='estimate'?kvOctets(o,rec):listeOctets(o,rec,R0)).then(oct=>new Blob([oct],{type:'application/pdf'}));
  const titre=titreDe(o,rec);
  if(g==='liste'){ /* liste : en cas d'échec du nouveau dessin, le PDF du bloc 31 */ const id0=(/\/\*sgimp:([a-z0-9]+)\*\//.exec(sv(R0.css))||[])[1];
    const sur=pdf.catch(e=>{ console.error(e); return id0&&S.pdf?S.pdf(id0):Promise.reject(e); }); S.memo.set(id,{pdf:sur,titre,o:{}}); }
  else { const self=this, args=arguments;   /* échec du nouveau dessin : rendu du bloc 31 (modèle du moteur), comme les listes (relecture du 10.11.2026) */
    const sur=pdf.catch(e=>{ console.error(e); try{ const R1=r0.apply(self,args), i1=(/\/\*sgimp:([a-z0-9]+)\*\//.exec(sv(R1&&R1.css))||[])[1]; return i1&&S.pdf?S.pdf(i1):Promise.reject(e); }catch(e2){ return Promise.reject(e2); } });
    S.memo.set(id,{pdf:sur,titre,o:{}}); }
  while(S.memo.size>40) S.memo.delete(S.memo.keys().next().value);
  return {title:titre,css:'/*sgimp:'+id+'*/',html:''}; };

/* ═══ sauts de page (Paulo, 10.11.2026 : « ajouter l'option saut de page ») : comme les documents Honoraires et Devis descriptif — liste du document
   (cocodoc.options.sgPdf.sauts = { cfc:[CFC], sans }) ; nouvelle page AVANT la position, dans le document détaillé (« Contrôle du coût détaillé », « Devis général ») ;
   clic droit sur une position du PDF = même menu que le devis (SGDE.saut.ouvrir) ; repères rouges à l'écran seulement ; Réglages ▸ Sauts de page : interrupteur
   « Sans sauts de page » (ignore la liste sans l'effacer) et remise à zéro. Carte des positions par page (CARTES) posée à chaque PDF. ═══ */
const NOM_SAUT=o=>sv(o.type)==='costControlEstimate'?'Devis général détaillé':'Contrôle du coût détaillé';
const sautSet=(o,cle,ajout,apres)=>{ const x=sautsDe(o); let msg='', sans=x.sans; const cfc=x.cfc.filter(c=>c!==cle).concat(ajout?[cle]:[]);
  if(ajout&&sans){ sans=false; msg='« Sans sauts de page » désactivé.'; } optsSet(o,{sauts:{cfc,sans}},ok=>{ if(!ok&&apres) apres(); }); if(msg) toast(msg); if(apres) apres(); };
function ccSautMenu(e,o,apres,peut){ if(e.altKey) return; const pe=e.target&&e.target.closest?e.target.closest('.sglp-p'):null; if(!pe) return; e.preventDefault(); e.stopPropagation();
  const car=CARTES.get(ch01aId(o.E,o.dossier)); if(!car){ toast('Document en préparation…'); return; }
  const k=[...pe.parentNode.querySelectorAll('.sglp-p')].indexOf(pe), cp=car.pages[k];
  if(!cp||!cp.items||!cp.items.length){ toast('Les sauts de page se posent sur les positions du document détaillé.'); return; }
  if(!peut()){ toast('Lecture seule : sauts de page non modifiables.'); return; }
  const H=car.ori==='portrait'?841.89:595.28, rc=pe.getBoundingClientRect(), y=(e.clientY-rc.top)/rc.height*H, it=cp.items.filter(x=>x.y<=y+0.01).pop()||cp.items[0];
  const S=sautsActifs(o), a=c=>S.has(c), lib=x=>({cfc:x.n||'',t:x.t||''});
  const M=[{ajout:!a(it.cle),b:lib(it),fn:()=>sautSet(o,it.cle,!a(it.cle),apres)}];
  const p0=cp.items[0]; if(p0&&p0.cle!==it.cle&&!p0.suite&&a(p0.cle)) M.push({ajout:false,b:lib(p0),haut:true,fn:()=>sautSet(o,p0.cle,false,apres)});
  SGDE.saut.ouvrir(e,pe,{ori:car.ori},cp,-1,!M[0].ajout,'',M,{x:cp.x,w:cp.w,y:it.y,h:it.h,lib:NOM_SAUT(o)}); }
function ccSautMarquer(cont,o){ if(!cont) return; cont.querySelectorAll('.sgsp-mq').forEach(x=>x.remove());
  const car=CARTES.get(ch01aId(o.E,o.dossier)), S=sautsActifs(o); if(!car||!S.size) return; SGDE.saut.css();
  const W=car.ori==='portrait'?595.28:841.89, H=car.ori==='portrait'?841.89:595.28, P=[...cont.querySelectorAll('.sglp-p')];
  car.pages.forEach((cp,k)=>{ const it=cp&&cp.items&&cp.items[0]; if(!it||it.suite||!P[k]||!S.has(it.cle)) return;
    const d=document.createElement('div'); d.className='sgsp-cut on sgsp-mq'; Object.assign(d.style,{left:cp.x/W*100+'%',width:cp.w/W*100+'%',top:it.y/H*100+'%'});
    d.title='Saut de page avant '+[it.n,it.t].filter(Boolean).join(' ')+' — repère à l’écran seulement, pas imprimé'; d.innerHTML='<i></i><span>Saut de page</span>'; P[k].append(d); }); }
const sautItems=o=>{ const sx=sautsDe(o), n=sx.cfc.length;
  return [it('Sans sauts de page',sx.sans,fin=>{ optsSet(o,{sauts:{cfc:sx.cfc,sans:!sx.sans}},ok=>{ if(!ok) fin(false); }); },{grp:'Sauts de page',bascule:true}),
    {t:'Remettre à zéro les sauts de page',grp:'Sauts de page',raz:true,dis:!n,ti:(n?n+' saut'+(n>1?'s':'')+' de page dans le document':'Aucun saut de page')+' — clic droit sur une position du document pour en poser un',
      fn:apres=>{ if(!n){ toast('Aucun saut de page à retirer.'); return; }
        sgConfirm('Retirer '+(n>1?'les '+n+' sauts':'le saut')+' de page du document ?\nLe document se répartira de nouveau sur les pages sans coupure imposée.',
          ()=>{ optsSet(o,{sauts:{cfc:[],sans:sx.sans}}); toast(n+' saut'+(n>1?'s':'')+' de page retiré'+(n>1?'s':'')+'.'); if(apres) apres(); },{yesText:'Remettre à zéro'}); }}]; };

/* ═══ volet Réglages : par document ═══ */
const ICO_TXT='<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13 7 4 4"/>';
const it=(t,chk,fn,x)=>Object.assign({t,chk:!!chk,fn,asy:true},x||{});
const opt=(o,k,v)=>fin=>{ optsSet(o,{[k]:v},ok=>{ if(!ok) fin(false); }); };   /* dessin tout de suite (réglage gardé en mémoire) ; nouveau dessin seulement si l'enregistrement est refusé */
function items(o){ const g=genre(o), E=o.E||{}, C=E.C||{}, L=[], rec=ch01aRec(E,o.dossier)||{};
  const format=(def)=>{ const f=optsDe(o).format||def; L.push(it('Format : Paysage',f==='paysage',opt(o,'format','paysage'),{grp:'Format'}),it('Format : Portrait',f==='portrait',opt(o,'format','portrait'),{grp:'Format'})); };
  const gardeIt=()=>L.push(it('Page de garde',optsDe(o).garde!==false,opt(o,'garde',optsDe(o).garde===false),{grp:'Parties'}));
  const niv=(cur)=>['tout','3','2','1'].forEach(v=>L.push(it('CFC : '+(v==='tout'?'Tout':v+(v==='1'?' chiffre':' chiffres')),cur===v,opt(o,'niv',v),{grp:'Positions',seg:'CFC',l:v==='tout'?'Tout':v,ti:v==='tout'?'Tous les niveaux de CFC':'CFC jusqu’à '+v+(v==='1'?' chiffre':' chiffres')})));
  if(g==='overview'){ const S=ovEtat(o,rec), nv=ch01aFlex(Object.assign({},C,{presentations:Object.assign({},C.presentations||{},{controle:[{favori:true,colonnes:(S.P?S.P.colonnes:PDF_STD().map(id=>({id,idDelta:CH01A_IDD[id]})))||[]}]})}),'controle').length;
    L.push(it('Format : Paysage',S.format==='paysage'||nv>5,opt(o,'format','paysage'),{grp:'Format'}),it('Format : Portrait',S.format==='portrait'&&nv<=5,opt(o,'format','portrait'),{grp:'Format',dis:nv>5,ti:nv>5?'Portrait : 5 colonnes de montants au plus ('+nv+' dans cette présentation)':'Document en portrait'}));
    const PL=((C.presentations||{}).controle)||[];
    L.push(it('Standard',!S.P,opt(o,'pres',null),{grp:'Colonnes',seg:'Colonnes',segLib:false,l:'Standard',ti:'Colonnes de l’écran et la provision : DG, transferts, variations, DG révisé, contrats et avenants, provision, paiements, coût probable, état du coût'}));
    PL.forEach((x,i)=>{ if(estStandard(x)&&S.P!==x) return;   /* présentation identique à Standard : pas en double (comme le menu de l'écran) */
      L.push(it(sv(x.nom||'Présentation '+(i+1))+(sv(x.nom)==='Standard'?' (du document)':''),S.P===x,opt(o,'pres',{i,nom:sv(x.nom)}),{grp:'Colonnes',seg:'Colonnes',segLib:false})); });
    gardeIt();
    L.push(it('Signatures',sigDe(o,rec),opt(o,'sig',!sigDe(o,rec)),{grp:'Parties',dis:optsDe(o).garde===false,ti:'Maître de l’ouvrage et architecte, sur la page de garde ; d’office pour un décompte final (nom du document)'}));
    L.push(it('Récapitulatif CFC à 2 chiffres',S.recap2,opt(o,'recap2',!S.recap2),{grp:'Parties'}),it('Contrôle du coût détaillé',S.docu,opt(o,'doc',!S.docu),{grp:'Parties'}));
    niv(S.niv); L.push(it('Afficher les entreprises',S.ent,opt(o,'ent',!S.ent),{grp:'Positions'}));
    if(typeof ch01aOuvs==='function'&&ch01aOuvs(C).length) L.push(it('Subdivisions par ouvrage (récapitulatif)',S.ouv,opt(o,'ouv',!S.ouv),{grp:'Positions'}));
    L.push(it('Afficher les écritures',S.det,opt(o,'det',!S.det),{grp:'Écritures'}));
    [['mut','Mutations'],['ctr','Contrats et avenants'],['pay','Paiements'],['prov','Provisions et coût probable']].forEach(([k,t])=>L.push(it(t,S.det&&S.dk(k),opt(o,'det_'+k,!S.dk(k)),{grp:'Écritures',ind:true,dis:!S.det})));
    L.push(it('Date et n° des mutations',S.mutDate,opt(o,'mutDate',!S.mutDate),{grp:'Écritures',ind:true,dis:!S.det||!S.dk('mut')}),
      it('Date de facture au lieu de la date de paiement',S.dateFacture,opt(o,'dateFacture',!S.dateFacture),{grp:'Écritures',ind:true,dis:!S.det||!S.dk('pay')}),
      it('Marquer le dernier paiement ('+S.marque+')',S.dernier,opt(o,'dernier',!S.dernier),{grp:'Écritures',ind:true,dis:!S.det||!S.dk('pay')}));
    L.push(...sautItems(o)); }
  else if(g==='estimate'){ const S=kvEtat(o,rec);
    L.push(it('Format : Paysage',S.format==='paysage',opt(o,'format','paysage'),{grp:'Format'}),it('Format : Portrait',S.format==='portrait',opt(o,'format','portrait'),{grp:'Format'}));
    gardeIt(); L.push(it('Récapitulatif CFC à 2 chiffres',S.recap2,opt(o,'recap2',!S.recap2),{grp:'Parties'}),it('Devis général détaillé',S.docu,opt(o,'doc',!S.docu),{grp:'Parties'}));
    niv(S.niv); if(S.subs) L.push(it('Subdivisions par ouvrage',S.ouv,opt(o,'ouv',!S.ouv),{grp:'Positions'}));
    L.push(it('Masquer les décimales',S.sansDec,opt(o,'sansDec',!S.sansDec),{grp:'Montants'}),it('Pourcentages sur le total général',S.pctTot,opt(o,'pctTot',!S.pctTot),{grp:'Montants'}));
    if(S.fac!==1) L.push(it('Colonne « DG indexé »',S.indexe,opt(o,'indexe',!S.indexe),{grp:'Montants'}));
    L.push(...sautItems(o)); }
  else if(g==='liste'){ format('paysage'); gardeIt(); }
  /* réglages existants du moteur, à leur place d'origine */
  const T=sv(o.type);
  if(T==='costControlPaymentList'&&typeof ch01dOpt==='function'){ const po=ch01dOpt(C);
    (typeof CH01D_TRI!=='undefined'?CH01D_TRI:[]).forEach(([k,lib])=>L.push({t:'Tri : '+lib,chk:po.tri===k,grp:'Tri',seg:'Trier',segLib:false,l:lib.replace(/^par /,''),fn:moteurSet(o,c=>ch01dSetOpt(c,'tri',k),c=>ch01dOpt(c).tri)}));
    L.push({t:'Récapitulatif de la TVA',chk:po.recapTVA,grp:'Montants',fn:moteurSet(o,c=>ch01dSetOpt(c,'recapTVA',!po.recapTVA),c=>ch01dOpt(c).recapTVA)}); }
  if(T==='costControlGuaranteeList'&&typeof ch01cPref==='function'){ const po=ch01cPref(C);
    [['date','date'],['adjudication','adjudication'],['adresse','adresse'],['numero','numéro']].forEach(([k,l])=>L.push({t:'Tri : '+l,chk:po.tri===k,grp:'Tri',seg:'Trier',segLib:false,l,fn:moteurSet(o,c=>ch01cSetPref(c,'triGaranties',k,()=>{}),c=>ch01cPref(c).tri)}));
    [['1','1 ligne'],['2','2 lignes'],['n','Complète']].forEach(([k,l])=>L.push({t:'Adresses : '+l,chk:po.adr===k,grp:'Adresses',seg:'Adresses',segLib:false,l,fn:moteurSet(o,c=>ch01cSetPref(c,'adresses',k,()=>{}),c=>ch01cPref(c).adr)})); }
  if(baseArr(o.dossier)&&ARR_TYPES.has(T)&&typeof ch01aArr==='function'){ const a=arrDe(o);
    L.push(it('Arrondir les conditions',a.cond,fin=>{ arrSet(o,'roundContractSummary',!a.cond,fin); return false; },{grp:'Montants',ti:'Vaut pour tous les documents de la section'}),
      it('Afficher le total arrondi',a.tot,fin=>{ arrSet(o,'addRoundedTotalKey',!a.tot,fin); return false; },{grp:'Montants',ti:'Vaut pour tous les documents de la section'})); }
  return L; }
const GROUPES=['Format','Colonnes','Parties','Positions','Écritures','Montants','Tri','Adresses','Sauts de page','Autres'];

/* ═══ fenêtre ═══ */
function vueCoco(D,o){ const E=o.E||{}, p=E.p||{}, rec=ch01aRec(E,o.dossier)||{}, doc=DS.get('costcontroldocument',E.id)||{}, g=genre(o);
  o._sgD=D; o._ccSeq=typeof ctBseq==='function'?ctBseq('costcontrol',E.id):null;   /* version du contrôle des coûts à l'ouverture (réglages du moteur) */
  const peut=()=>{ try{ return ecrit()&&!(typeof ch03dLecture==='function'&&ch03dLecture(E)); }catch(_){ return true; } };
  const rendre=()=>ch01aRender(o,ch01aRec(E,o.dossier));
  const actions=[]; if(!g&&rec.doc&&typeof ch01aTexts==='function') actions.push({t:'Modifier les textes…',ico:ICO_TXT,ti:'Textes du modèle de ce document',fn:()=>{
    if(!peut()){ toast('Lecture seule : textes non modifiables.',true); return; } const cur=ch01aRec(E,o.dossier); if(cur&&cur.doc) ch01aTexts(cur,r2=>{ try{ D.maj(ch01aRender(o,r2)); }catch(e){ console.error(e); } }); }});
  SGDE.vue(D,{p,lb:'Contrôle des coûts · Documents',titre:titreDe(o,rec),etat:ETATS[doc.STATECODE]||'',peut,items:()=>items(o),rendre,
    pied:'Enregistrés dans le document',groupes:GROUPES,groupe:(x,G)=>x.grp&&G[x.grp]?x.grp:'Autres',rang:()=>0,retrait:x=>!!x.ind,actions,
    installer:({R,maj,reset,peut})=>{ if(g!=='overview'&&g!=='estimate') return;   /* sauts de page : repères à l'écran, menu au clic droit */
      const cont=R.querySelector('.sglp-pages'); let att=0;   /* repères reposés après chaque mise en page et chaque page rendue (les mutations des repères eux-mêmes sont ignorées) */
      const propre=m=>[...m.addedNodes,...m.removedNodes].every(n=>n.nodeType===1&&n.classList&&n.classList.contains('sgsp-mq'));
      if(cont) new MutationObserver(ms=>{ if(ms.every(propre)) return; clearTimeout(att); att=setTimeout(()=>ccSautMarquer(cont,o),30); }).observe(cont,{childList:true,subtree:true});
      R.querySelector('.sgdv-doc').addEventListener('contextmenu',e=>ccSautMenu(e,o,()=>{ reset(); maj(); },peut),true); }}); }
const o0=ch01aOpen;
ch01aOpen=function(o){ const D=o0.apply(this,arguments); if(D&&D.bd&&o&&o.E) try{ vueCoco(D,o); }catch(e){ console.error(e); } return D; };

window.SGCD={ovOctets,kvOctets,listeOctets,items,optsDe,genre,garde,titreDe,filtreDe,entDe,PP,PA,CARTES,sautsDe};
})();

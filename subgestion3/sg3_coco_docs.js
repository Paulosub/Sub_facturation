/* ═══ CONTRÔLE DES COÛTS ▸ DOCUMENTS AU GRAPHISME DU DEVIS (10.11.2026, bloc 52 ; Paulo, en regardant le document « Contrôle des coûts » : « créer le même visuel
   que pour devis, fenêtre identique et document également, adapte les options du volet à droite ») ═══
   Choix de Paulo (10.11.2026) : colonnes « Standard » comme l'écran (les présentations du document restent au choix), paysage par défaut, état du coût en rouge
   (dépassement) / vert (économie), graphisme du devis aussi pour les listes ; les lettres (contrat, avenant, mutation, bons, ordre, arrêté de compte) gardent leur rendu
   au papier des contrats (bloc 31). Depuis le 14.11.2026 : le bon de paiement et l'arrêté de compte sont dessinés en « Grand chiffre » (variante 2, voir plus bas :
   DEC_TYPES, bonDonnees, arrDonnees, decOctets) ; fin du fichier : Archives ▸ Maquettes ▸ « Bon de paiement et arrêté · Deux colonnes » (variante 4, mq-bon-arrete-4).
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
const LISTES_DG=new Set(['costControlAwardList','costControlMutationsList','costControlPaymentList']);
/* n° de CFC toujours imprimé dans les listes des mutations et des adjudications (11.11.2026), même si la présentation favorite n'a pas la colonne CFC (n° 0),
   comme la colonne CFC toujours première du tableau du contrôle du coût */
if(typeof ch01bIds==='function'){ const i0=ch01bIds; ch01bIds=function(C,cle){ const L=i0.apply(this,arguments); return Array.isArray(L)&&(cle==='mutations'||cle==='adjudications')&&!L.includes(0)?[0,...L]:L; }; }
const LISTES=new Set(['costControlFinalPaymentTable','costControlPaymentOrderTable','costControlEntrepreneurList','costControlAwardList','costControlMutationsList','costControlPaymentList','costControlEntrepreneurSummary','costControlGuaranteeList']);
const genre=o=>{ const t=sv(o&&o.type); return t==='costControlOverview'?'overview':t==='costControlEstimate'?'estimate':LISTES.has(t)?'liste':DEC_TYPES[t]||''; };   /* 'bon', 'arrete', 'ordre' : dessin « Grand chiffre » (14.11.2026) */
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
const ABREV2={'Contrats + av.':'Contr. + av.','État du coût':'État coût','Coût prob.':'Coût prob.','Paiements':'Paiem.','Variations':'Variat.','Modifications':'Modif.','Transferts':'Transf.','Mutations':'Mutat.'};   /* colonnes étroites (colonne Entreprise) */
const ABREV3={'Contr. + av.':'Ctr.+av.','État coût':'État','Coût prob.':'C. prob.','Provisions':'Prov.','Provision':'Prov.','Paiem.':'Paiem.','DG rév.':'DG rév.','Renchériss.':'Rench.'};   /* portrait à 6 colonnes et plus (14.11.2026) */
const titresAjustes=(T,wd,M)=>{ const ttc=T.length>0&&T.every(t=>/\sTTC$/.test(sv(t).trim())), out=T.map(t=>{ let x=sv(t).trim(); if(ttc) x=x.replace(/\s+TTC$/,'');
    if(M.larg(x,true)>wd&&ABREV[x]) x=ABREV[x]; if(M.larg(x,true)>wd&&ABREV2[x]) x=ABREV2[x]; if(M.larg(x,true)>wd&&ABREV3[x]) x=ABREV3[x]; return x; }); return {T:out,ttc}; };
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
const titreDe=(o,rec)=>{ const dn=decNom(o); if(dn) return dn;   /* « Bon de paiement n° 135 », « Arrêté de compte n° 24 » (le nom du document du moteur est technique : « 135_10511_payment ») */
  const t0=sv(rec.doc&&rec.doc.nom||o.label||'Document'), t=t0==='Rapport des paiements'?'Liste des paiements':t0, e=entDe(o); return e&&e.nom?t+' · '+e.nom:t; };   /* « Liste des paiements » : ex-« Rapport des paiements » (15.11.2026), aussi pour un document créé sous l'ancien nom */
const garde=(o,rec,sig)=>{ const E=o.E, p=E.p||{}, doc=DS.get('costcontroldocument',E.id)||{}, rub=deGardeRub(p,{filter:null}), e=entDe(o), F=filtreDe(o);
  if(F&&F.mo){ const k=rub.findIndex(x=>/ma[iî]tre/i.test(sv(x.lib))); if(k>=0) rub[k]=Object.assign({},rub[k],deNomAdr(F.mo)); }
  if(e&&e.nom) rub.unshift({lib:'Entreprise',nom:e.nom,adr:e.adr});
  return {edito:true,statut:ETAT_GARDE[+doc.STATECODE]!=null?ETAT_GARDE[+doc.STATECODE]:'PROVISOIRE',num:sv(p.NUMBER).trim(),titre:sv(rec.doc&&rec.doc.nom||o.label||'Document').toLocaleUpperCase('fr'),
    sous:'',info:'',marge:'',filtre:F?(F.txt?'Filtre : '+F.txt:'Paiements filtrés'):'',rub,sig:sig||[]}; };
const sortie=async(o,rec,pages,ori,type,geo)=>{ const X0T=geo?geo.x0:DG_X0T, {w,R,fn}=await SGDS.ressources(), p=o.E.p||{}, T0=titreDe(o,rec), F=filtreDe(o);
  const sT={b:true,z:DG_TXT}, st={T:sT,O:sT,W:sT,F:sT,S:{b:false,z:DG_TXT},D:{b:false,z:DG_TXT},X:{b:false,z:DG_TXT},E:{b:false,z:DG_TXT}};
  const op=optsDe(o), signe=type==='estimate'||(type==='overview'&&sigDe(o,rec)), couverture=op.garde===false?null:garde(o,rec,signe?['Le maître de l’ouvrage :','L’architecte :']:[]);
  if(couverture) pages.unshift({type:0,titre:T0,rows:[]}); else if(pages[0]) pages[0].type=1;
  pages.forEach(pg=>{ if(pg.type!==0) pg.titre=T0; });   /* en-tête de chaque page : nom du document (et de l'entreprise) */
  { const W0=geo?geo.W:ori==='portrait'?DG_WP:DG_WL, car={ori,pages:[]}; let cur=null;
    pages.forEach(pg=>{ if(!pg.carte){ car.pages.push({}); cur=null; return; } const its=[];
      (pg.rows||[]).forEach((r,j)=>{ const c=r.c||[], c0=sv(c[0]).trim(), pl=c.some(x=>sv(x).trim()), y=122+(+pg.dy||0)+j*DG_RH;
        if(c0&&!r.k&&r.s!=='T'&&r.s!=='E'){ cur={cle:c0,n:c0,t:sv(c[1]).trim()}; its.push(Object.assign({},cur,{y,h:DG_RH})); }
        else if(pl&&r.s!=='T'&&cur){ const L0=its[its.length-1]; if(L0&&L0.cle===cur.cle) L0.h=y+DG_RH-L0.y; else its.push(Object.assign({},cur,{suite:true,y,h:DG_RH})); } });
      car.pages.push({items:its,x:X0T-2,w:W0+4}); });
    CARTES.set(ch01aId(o.E,o.dossier),car); }
  const opt=w.JSON.parse(JSON.stringify({titre:T0,sousTitre:[p.NUMBER,p.TITLE].filter(Boolean).join(' - ')+(F?' · Filtré':''),date:today(),type:'Contrôle des coûts',description:T0+' '+[p.NUMBER,p.TITLE].filter(Boolean).join(' ')+(F?' (filtre)':''),
    livretDG:{couverture:couverture||{},pages,st,zebra:false,style:'nuit',deborde:true,rh:DG_RH,orientation:ori,x0:28.35,x0Tab:X0T,aligne:true,corpsTitres:DG_TXT,calRetrait:7}})), j=new w.Array(); opt.journal=j;
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
    centres:false,recap2:op.recap2===true,   /* page « Centres de coût » retirée (Paulo, 10.11.2026 : « supprimer ») ; code gardé dans ovOctets */docu:op.doc!==false,det:op.det!==false,dk:k=>op['det_'+k]!=null?!!op['det_'+k]:detDefaut(P,k),   /* sans présentation choisie (Standard) : toutes les écritures, comme le Standard de l'écran (14.11.2026) */
    vides:op.vides===true,desc:op.desc===true,sansDec:op.sansDec===true,arr:[10,100,1000].includes(+op.arr)?+op.arr:0,chif:op.chif===true,   /* réglages du devis général repris (Paulo, 14.11.2026 : « avec les mêmes options ») */
    mutDate:op.mutDate!=null?!!op.mutDate:ch01aProp(bandeDe(rec,'costcontrolOverviewTable'),0,true),dateFacture:op.dateFacture!=null?!!op.dateFacture:!!fo.invoiceNumberInsteadOfPayNumber,
    dernier:op.dernier!=null?!!op.dernier:!!fo.markFinalPays,marque:fo.finalPayment!=null&&sv(fo.finalPayment).trim()?sv(fo.finalPayment).trim():'+',format:op.format==='portrait'?'portrait':'paysage'}; };
async function ovOctets(o,rec){ await DS.need(['subproject','contact','projectmember','contactowner','setting']).catch(()=>{});
  const M=await mesure(), S=ovEtat(o,rec), C=S.C, F=favDe(C)||{}, fo=F.options||{};
  /* copie de travail : présentation choisie (Standard par défaut, comme l'écran) avec les détails des écritures choisis ; options du document */
  /* colonnes du PDF « Standard » = celles de l'écran + « Provision TTC » après « Contrats + avenants » (Paulo, 10.11.2026, exemple 23COL du 04.06.2025 : « ajoute les
     colonnes dans le pdf contrôle du coûts ») */
  const std=PDF_STD().map(id=>({id,idDelta:CH01A_IDD[id],details:!!(CC_COL[id]&&CC_COL[id].det)}));
  /* colonnes de texte du catalogue (n° du contrat, descriptif, statut…) et colonnes sans données : pas imprimées (le descriptif a son réglage, sous la position) */
  const colonnes=(S.P?S.P.colonnes||[]:std).filter(c=>!(CC_COL[c.id]&&(CC_COL[c.id].info||CC_COL[c.id].nd))).map(c=>{ const x=Object.assign({},c), k=CC_COL[c.id]&&CC_COL[c.id].det; if(k){ const kk=k==='cpp'?'prov':k; x.details=S.det&&S.dk(kk); } return x; });
  const options=Object.assign({},fo,S.P?S.P.options||{}:{},{markFinalPays:S.dernier,invoiceNumberInsteadOfPayNumber:S.dateFacture,displayOnlyThreeDigitPos:false,sgPosVides:S.vides});
  const C2=Object.assign({},C,{presentations:Object.assign({},C.presentations||{},{controle:[{nom:S.P?S.P.nom:'Standard',favori:true,colonnes,options}]}),titresColonnes:S.P?C.titresColonnes||{}:{}});
  const rep=ch01aPrep(rec.doc.report); ch01aBands(rep,'costcontrolOverviewSummaryTable').forEach(b=>{ setProp(b,0,'displayTwoDigitPositions'); setProp(b,1,S.ouv); });
  ch01aBands(rep,'costcontrolOverviewTable').forEach(b=>setProp(b,0,S.mutDate));
  const E2=Object.assign({},o.E,{C:C2}), J=ch01aOverviewJob(E2,rep), flex=ch01aFlex(C2,'controle'), T=J.tables||{};
  const titres=(T.costcontrolOverviewTable&&T.costcontrolOverviewTable.flex)||flex.map(x=>x.t), nv=flex.length;
  const ori=S.format==='portrait'?'portrait':'paysage', G=largeurs(ori,nv,nv>8?52:62);   /* portrait toujours possible (14.11.2026) : au-delà de 5 colonnes, montants en corps réduit */
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
  /* « Masquer les décimales » et « Arrondir à » (réglages du devis général) : chaque montant imprimé est arrondi pour lui-même (au franc, à 10, 100 ou 1000) ; marque du
     dernier paiement gardée devant le montant ; pourcentages inchangés */
  const pas=S.arr||1, rond=S.sansDec||S.arr>0, estPct=flex.map(x=>!!(CC_COL[x.id]&&CC_COL[x.id].pct));
  const mt=(t,i)=>{ const x=sv(t); if(!rond||estPct[i]||!x.trim()) return x; const m=/^([^\d\-−(]*)(\(?[\-−]?\s*[\d’'\u00a0 ]*\d(?:\.\d+)?\)?)$/.exec(x.trim()); if(!m) return x;
    const v=num(m[2]); if(v==null) return x; const r=Math.round(v/pas)*pas; return m[1]+window.num(r===0?0:r,0); };
  const fabrique=avecEnt=>(c0,txt,f,s,ent)=>{ const j0=avecEnt?3:2, n=[c0,txt].concat(avecEnt?[sv(ent)]:[],(f||[]).map(mt)), r={c:n,s};
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
  /* « Descriptif » (réglage du devis général) : descriptif de la position sous sa ligne, en italique gris (style X), dans les colonnes de texte */
  const descDe=c0=>{ if(!S.desc||typeof ccPosDesc!=='function') return []; let t=''; try{ t=sv(ccPosDesc(C,c0,true)); }catch(_){} return t.trim()?[ligneD('',recol(t),[],'X','')]:[]; };
  const vider=()=>{ if(!blk) return; const G2=blk.groupes;
    if(aEnt&&G2.length===1&&G2[0].row){ blk.pos.c[2]=G2[0].row.c[2]; G2[0].row=null; }   /* une seule entreprise : sur la ligne de la position (exemple 23COL) */
    ov.push(blk.pos,...descDe(sv(blk.pos.c[0]).trim()),...blk.libres); G2.forEach(g=>{ if(g.row) ov.push(g.row); ov.push(...g.det); }); blk=null; };
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
  /* « Volume SIA 416 et prix au m³ » (réglage du devis général) : chiffres clés au-dessus du récapitulatif à 1 chiffre — volume bâti du module Surfaces et volumes,
     coût probable TTC au m³ des CFC 2 et des CFC 1 à 9 (calcul du contrôle des coûts, pas les montants arrondis) ; la place est gardée au-dessus de la bande */
  const CHIF=(()=>{ if(!S.chif) return null; const vb=typeof sgVolumeSIA416==='function'?+sgVolumeSIA416(o.E.p)||0:0; if(!(vb>0)) return null; const R0=ccCalc(C), cp=c=>+((R0.tot.get(c)||{}).coutProbable)||0;
    const mil=(n,d)=>window.num(n,d), s19=['1','2','3','4','5','6','7','8','9'].reduce((a,c)=>a+cp(c),0), Lc=[['VB','Volume SIA 416',mil(vb,vb%1?1:0),'m³']];
    if(cp('2')) Lc.push(['2','Coût probable au m³ SIA 416',mil(cp('2')/vb,2),'CHF/m³']); if(s19) Lc.push(['1–9','Coût probable au m³ SIA 416',mil(s19/vb,2),'CHF/m³']); return Lc; })();
  { const P1=paginer(etaler(recap(1),colsR,M),colsR,CHIF?Math.max(4,G.cap-4):G.cap,'Récapitulatif',0,{recap:RT,limb:LIMB[ori]}); if(CHIF&&P1[0]&&(+P1[0].dy||0)>=52) P1[0].chiffres=CHIF; pages.push(...P1); }
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
  /* listes des mutations, des adjudications et des paiements (Paulo, 11.11.2026 : « aligner CFC à info et ramener le n° de CFC comme pour les devis général ») : n° de CFC
     dans la marge (x 85.04, largeur du devis général), textes dès la 2e colonne du pied (x 125.72, « info@… ») ; tableau sans n° de CFC (totaux) : 1re colonne vide */
  const dg=LISTES_DG.has(sv(o.type)), L0=SGDE.livret, geo=dg?{x0:L0.DG_X0T,W:ori==='portrait'?L0.DG_WP:L0.DG_WL}:null;
  const W=geo?geo.W:ori==='portrait'?DG_WP:DG_WL, cap=Math.max(1,Math.floor((ori==='portrait'?DG_HP:DG_HT)/DG_RH)), pages=[];
  const TVA=(()=>{ const C=o.E.C; if(sv(o.type)!=='costControlPaymentList'||typeof ch01dOpt!=='function'||typeof ch01dVat!=='function'||!C||!ch01dOpt(C).recapTVA) return null;
    const cfg=!!(C.parametres||{}).arrondir, cur=(o.E.p&&o.E.p.CURRENCY)||'CHF', V=x=>typeof ch01aV==='function'?ch01aV(x,cfg):num(x), J=t=>typeof ch01aJd==='function'?ch01aJd(t):String(t);
    return ch01dVat(ch01dList(C),cfg).slice().sort((a,b)=>a.taux-b.taux).map(m=>({t:J(m.taux),cur,ht:V(m.ht),tva:V(m.tva),ttc:V(m.ttc)})); })();
  (P.rep.sections||[]).filter(s=>s&&s.isVisible!==false).forEach(sec=>(sec.bands||[]).forEach(b=>{ if(!b||b.isH||b.class!=='TableBand'||!b._sgk) return; const T=job.T[b._sgk]; if(!T||!(T.rows||[]).length) return;
    let rows=T.rows.map(r=>{ const c=r.fuse?[sv(r.c[0])]:r.c.map(sv), s=r.st==='tt'||r.st==='ct'?'T':(r.st==='c2'||r.gras)?'W':'S'; return {c,s}; }), TC=T.cols;
    if(TVA){ /* récapitulatif de la TVA (Paulo, 11.11.2026 : « l'activation de ce bouton ne fait rien ») : le moteur l'ajoute après le « Total » du tableau des paiements,
         en dernière page ; il est placé sur la page du récapitulatif, sous « Total paiements », avec son titre */
      const iT=rows.map(r=>r.s).lastIndexOf('T');
      if(TVA.fait!=null&&iT>=0&&rows.slice(iT+1).some(r=>/^Total TVA /.test(r.c.join('').trim()))) rows=rows.filter((r,i)=>!(i>iT&&/^Total TVA /.test(r.c.join('').trim())));
      else if(iT>=0&&/^Total paiements$/.test(sv(rows[iT].c[0]).trim())&&rows[iT].c.length===5){ const n=TVA.length;
        rows.push({c:['Récapitulatif de la TVA','','','',''],s:'W'},...TVA.map(m=>({c:['TVA '+m.t+' %',m.cur,m.ht,m.tva,m.ttc],s:'S'}))); TVA.fait=n; } }
    if(dg){ const n0=rows.filter(r=>r.c.length>1&&r.s!=='T').map(r=>r.c[0].trim()).filter(Boolean);
      if(!(n0.length&&n0.every(x=>/^\d[\d.]*[a-z]?$/i.test(x)))){ TC=[{titre:''},...T.cols]; rows=rows.map(r=>r.c.length>1?Object.assign({},r,{c:['',...r.c]}):r); } }
    /* largeurs d'après le contenu (les largeurs du modèle de l'ancien logiciel coupaient les titres) : nombres et dates à leur largeur, textes jusqu'à 220 pt (à la
       ligne au-delà) ; place restante aux textes ; manque de place : textes réduits jusqu'à 50 pt, puis toutes les colonnes */
    const rC=TC.map((c,j)=>!(dg&&!j)&&(c.ha==='right'||!!c.num)), besoin=TC.map((c,j)=>Math.max(M.larg(c.titre||'',true),...rows.map(r=>r.c.length===1&&j>0?0:M.larg(sv(r.c[j]),r.s!=='S')))+6);
    let wv=besoin.map((b,j)=>dg&&!j?DG_CFC:rC[j]?b:Math.min(b,220)), tot=wv.reduce((a,b)=>a+b,0); const tx=wv.map((_,j)=>!(dg&&!j)&&!rC[j]);
    if(tot<W){ const st=wv.reduce((a,b,j)=>a+(tx[j]?b:0),0), xs=W-tot; wv=wv.map((b,j)=>st?(tx[j]?b+xs*b/st:b):b+xs/wv.length); }
    else if(tot>W){ let tr=wv.reduce((a,b,j)=>a+(tx[j]?b:0),0), surplus=tot-W; const red=Math.min(surplus,Math.max(0,tr-50*tx.filter(Boolean).length));
      if(red>0) wv=wv.map((b,j)=>tx[j]?Math.max(50,b-red*b/tr):b); tot=wv.reduce((a,b)=>a+b,0);
      if(tot>W){ const f=dg?DG_CFC:0; wv=wv.map((b,j)=>dg&&!j?b:b*(W-f)/(tot-f)); } }
    const cols=TC.map((c,j)=>({t:c.titre||'',w:wv[j],r:rC[j]}));
    pages.push(...paginer(etaler(rows,cols,M),cols,cap,sv(rec.doc.nom||o.label||'Liste'),2,{})); }));
  if(!pages.length) throw new Error('aucun tableau');
  return sortie(o,rec,pages,ori,'liste',geo); }

/* ═══ Bon de paiement et arrêté de compte : dessin « Grand chiffre » (14.11.2026, Paulo : « j'aime bien la version 4 que je souhaite garder dans archives et
   appliquer la version 2 pour le moment », puis, exemples 17QUE.BOP.135 et 17QUE.AC.222 à l'appui : « voici les bons de paiement avec les données qui doivent
   apparaître sur le bon et l'arrêté de compte, ajoute et adapte la version actuelle », « il est possible d'avoir les documents sur deux pages si nécessaire ») ═══
   Variante 2 des maquettes du 14.11.2026 (subgestion3/_backup_20261114_maquette_bon_arrete/) : numéro et titre en grand, état en rouge, montant à régler en très
   grand, le reste en rubriques (libellé à gauche, contenu à droite), signatures en deux colonnes ; dessin = contenuDecompte de sgDsPdf (sg3_docsub.js, o.decompte).
   Données = celles des documents du bureau, prises dans les tableaux du moteur (mêmes valeurs, mêmes arrondis — « Arrondir les conditions », « Afficher le total
   arrondi » — et mêmes libellés du modèle que le document d'avant) :
   - BON DE PAIEMENT (ch01dBonJob) : entreprise ; banque et IBAN de l'entreprise ; affaire ; banque / compte du maître de l'ouvrage ; « L'architecte confirme que le
     versement suivant peut être effectué » + lot, dates de facture et de paiement ; tableau CFC (adjudication brute / nette, paiement brut / net, total) ; décompte
     (conditions, total HT, TVA, total TTC, arrondi) ; « Ordre de paiement n° … » à droite du titre ; signatures de l'architecte et du maître de l'ouvrage.
   - ARRÊTÉ DE COMPTE (ch01cGuaranteeJob) : adjudication (contrat et avenants), récapitulatif par CFC, facture finale (décompte brut, conditions, total HT, TVA,
     total net TTC), paiements (à ce jour, total, solde à verser, autres paiements, montant total), déclaration, certificat de garantie ; « N° … » à droite du titre ;
     signatures de l'architecte et de l'entreprise. Colonne « Date pmt » = celle du document du bureau (colonne 4 du tableau du moteur, décision F1).
   Numéros : <affaire>.BOP.<n° du paiement> ; <affaire>.AC.<n° CFC du lot> (sans lot : n° de l'arrêté). En-tête du papier : titre, « n° - affaire », date de l'ordre
   de paiement (bon) ou de l'arrêté. Échec du nouveau dessin : rendu d'avant (bloc 31). L'ordre de paiement : même dessin depuis le même jour (ordDonnees, plus bas). */
const DEC_TYPES={costControlContractPaymentSummary:'bon',costControlGeneralPaymentSummary:'bon',costControlGuaranteeSummary:'arrete',costControlPaymentOrder:'ordre'};
const MOIS_L=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const isoDe=v=>(/^(\d{4}-\d{2}-\d{2})/.exec(sv(v&&typeof v==='object'?v.v:v))||[])[1]||'';
const dateL=v=>{ const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDe(v)); return m?(+m[3]===1?'1er':String(+m[3]))+' '+MOIS_L[+m[2]-1]+' '+m[1]:''; };
const dateC=v=>{ const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDe(v)); return m?m[3]+'.'+m[2]+'.'+m[1]:''; };
const maj1=t=>{ t=sv(t).trim(); return t?t.charAt(0).toLocaleUpperCase('fr')+t.slice(1):t; };
const naDe=id=>{ const c=id!=null?DS.get('contact',id):null; return c?deNomAdr(c):{nom:'',adr:''}; };
const adrL=t=>sv(t).split(', ').map(x=>x.trim()).filter(Boolean).join('\n');   /* adresse des signatures : une ligne par partie (rue, localité) */
const decArr=o=>{ const C=(o&&o.E&&o.E.C)||{}; return typeof ch01cDir==='function'?(C.arretes||[]).find(a=>ch01cDir(a)===sv(o.dossier))||null:null; };
const decNom=o=>{ const g=DEC_TYPES[sv(o&&o.type)]; if(!g) return '';
  if(g==='ordre'){ const q=ordDe(o); return 'Ordre de paiement'+(q&&sv(q.numero).trim()?' n° '+q.numero:''); }
  if(g==='bon'){ const n=(/^paymentorder\/[^/]+\/(.+)$/.exec(sv(o.dossier))||[])[1]; return 'Bon de paiement'+(n?' n° '+n:''); }
  const a=decArr(o); return 'Arrêté de compte'+(a&&sv(a.numero).trim()?' n° '+a.numero:''); };
const ST_DEC={tr:'',tt:'t',l1t:'p',l4:'i'};
const repDec=rec=>typeof ch01aPrep==='function'?ch01aPrep(rec.doc.report):rec.doc.report;   /* modèle préparé comme le fait le moteur avant de calculer les tableaux */
const decParties=p=>{ let R=[]; try{ R=deGardeRub(p,{filter:null})||[]; }catch(_){ } const de=re=>{ const x=R.find(r=>re.test(sv(r.lib))); return x?{nom:sv(x.nom),adr:sv(x.adr)}:{nom:'',adr:''}; };
  return {archi:de(/^architecte/i),mo:de(/ma[iî]tre/i),dt:de(/^direction/i)}; };
const ARR_DECL='Cet arrêté de compte est reconnu comme complet et définitif par l’entreprise, laquelle renonce à toute action juridique ayant trait à ce contrat ou à ses travaux supplémentaires. '
  +'L’entreprise déclare avoir remis toutes les factures relatives aux travaux précités. Le solde ci-dessus sera versé à l’entreprise, sur présentation du certificat de garantie d’assurance '
  +'et du présent arrêté de compte daté et signé au sens de l’art. 156 de la norme SIA 118.';
/* désignation d'une position : « n° CFC texte », puis l'ouvrage (et la localisation) s'il y en a, puis entre parenthèses le n° qui renvoie aux conditions (colonne « N° » du
   document d'avant : deux lignes du même CFC à deux taux de TVA) ; iR = rang de ce n° dans la rangée du moteur */
const posDec=(c,iR)=>{ const ouv=c.slice(2,iR).map(v=>sv(v).trim()).filter(Boolean).join(' | '), ref=sv(c[iR]).trim();
  return recol([c[0],c[1]].map(v=>sv(v).trim()).filter(Boolean).join(' ')+(ouv?' · '+ouv:'')+(ref?' ('+ref+')':'')); };
const condDec=r=>{ const c=r.c||[], ref=sv(c[2]).trim(); return {c:[sv(c[0])+(ref?' ('+ref+')':''),c[1],c[4]],s:ST_DEC[r.st]||''}; };   /* condition : libellé (n° de renvoi), taux, montant */
function bonDonnees(o,rec){ const E=o.E, C=E.C||{}, p=E.p||{}, J=o.job(repDec(rec)), x=J&&J.ref; if(!x) throw new Error('paiement introuvable');
  const T=J.tables||{}, F=J.F||{}, cur=(p&&p.CURRENCY)||'CHF', ref=(/^paymentorder\/([^/]+)\//.exec(sv(o.dossier))||[])[1];
  const ord=(C.ordresPaiement||[]).find(q=>typeof ch01dRef==='function'&&ch01dRef(q)===ref)||null, PT=decParties(p);
  const lot=x.lot||{}, lotT=[lot.numero,lot.texte].filter(v=>v!=null&&sv(v).trim()!=='').join(' '), ent=naDe(x.contactId), b=x.banque||{};
  const ob=typeof ch01dBankMO==='function'?(ch01dBankMO(C,ord)||{}):{}, des=maj1(x.commentaire||x.genreTexte||'');
  const mo=(()=>{ const m=ord&&ord.maitreOuvrageContactId!=null?naDe(ord.maitreOuvrageContactId):null; return m&&m.nom?m:PT.mo; })();
  const cond=((T.conditionTable||{}).rows||[]), tot=cond.filter(r=>r.st==='tt').pop(), sur=!!T.awardTable, A=((T.awardTable||T.positionsTable||{}).rows||[]);
  const banque=bb=>[bb.nom,[bb.npa,bb.lieu].map(v=>sv(v).trim()).filter(Boolean).join(' ')].map(v=>sv(v).trim()).filter(Boolean).join(', ');
  const compte=bb=>[bb.iban,bb.compte,bb.texteCompte].map(v=>sv(v).trim()).filter(Boolean)[0]||'';
  const blocs=[
    {t:'rub',lib:'Entreprise',lignes:[{x:ent.nom,f:'r',z:9},{x:ent.adr,z:9}].filter(l=>sv(l.x).trim())},
    {t:'rub',lib:'Banque entreprise',wp:34,lignes:[{p:'Banque',x:banque(b)},{p:'IBAN',x:compte(b)}]},
    {t:'rub',lib:'Affaire',lignes:[{x:sv(p.DESCRIPTION||p.TITLE).replace(/\s*\n\s*/g,', ').trim()}]},
    {t:'rub',lib:'Banque / compte du maître de l’ouvrage',wp:34,lignes:[{p:'Banque',x:banque(ob)},{p:'Compte',x:compte(ob)}]},
    {t:'rub',lib:'Versement',wp:66,lignes:[{x:'L’architecte confirme que le versement suivant peut être effectué :'},{x:lotT,f:'r',z:9},
      {p:'Date de facture',x:dateL(x.dateFacture),p2:'Date de paiement',x2:dateL(x.datePaiement)}].filter(l=>l.p||sv(l.x).trim())},
    {t:'tab',lib:'CFC',large:true,cols:sur?[{t:'',flex:true},{t:'Adjudication\nbrute',r:true},{t:'Adjudication\nnette',r:true},{t:'Paiement\nbrut',r:true},{t:'Paiement\nnet',r:true}]
        :[{t:'',flex:true},{t:'Paiement\nbrut',r:true},{t:'Paiement\nnet',r:true}],
      rows:A.map(r=>{ const c=r.c||[]; return {c:[posDec(c,3),...c.slice(5)],s:ST_DEC[r.st]||''}; })},
    /* décompte : sans la première ligne « Total brut » (c'est le total « Paiement brut » du tableau au-dessus, comme sur le document du bureau) */
    {t:'tab',lib:'Décompte',fin:true,cols:[{t:'',flex:true},{t:'',r:true,g:true},{t:'',r:true}],rows:cond.slice(A.length?1:0).map(condDec)}];
  return {titre:'Bon de paiement',date:isoDe(ord&&ord.date)||isoDe(x.datePaiement)||'',dec:{etat:des,num:[p.NUMBER,'BOP',x.numero].map(v=>sv(v).trim()).filter(Boolean).join('.'),titre:'Bon de paiement',
    no:ord&&sv(ord.numero).trim()?'Ordre de paiement n° '+ord.numero:'',
    chiffre:{lib:'Présent paiement à régler',sous:[des?des+(isoDe(x.dateFacture)?' du '+dateC(x.dateFacture):''):'',lotT?'CFC '+lotT:''].filter(Boolean),monnaie:cur,montant:sv(tot?(tot.c||[])[4]:F.amountTotal)},
    blocs,sig:[{lib:'L’architecte',nom:PT.archi.nom,adr:adrL(PT.archi.adr)},{lib:'Le maître de l’ouvrage',nom:mo.nom,adr:adrL(mo.adr)}]}}; }
function arrDonnees(o,rec){ const E=o.E, C=E.C||{}, p=E.p||{}, a=decArr(o); if(!a) throw new Error('arrêté de compte introuvable');
  const J=o.job(repDec(rec)), T=J.tables||{}, F=J.F||{}, cur=(p&&p.CURRENCY)||'CHF', PT=decParties(p), K=typeof ch01cCtr==='function'?(ch01cCtr(C,a)||{}):{}, ctr=K.ctr||null;
  const lot=(ctr&&ctr.lot)||{}, lotT=[lot.numero,lot.texte].filter(v=>v!=null&&sv(v).trim()!=='').join(' '), ent=naDe(ctr&&ctr.contactId!=null?ctr.contactId:a.contactId);
  const R=k=>((T[k]||{}).rows||[]), prev=R('previousPaymentsTable'), solde=prev.find(r=>r.st==='tt')||null, gm=+((a.garantie||{}).montant)||0;
  const blocs=[
    {t:'tab',lib:'Adjudication',large:true,cols:[{t:'Contrat',flex:true},{t:'N° du\ncontrat'},{t:'Date du\ncontrat'},{t:'Adjudication\nbrute HT',r:true},{t:'Adjudication\nnette TTC',r:true}],
      rows:R('summaryTable').map(r=>{ const c=r.c||[]; return {c:[c[0],c[1],c[2],c[4],c[5]],s:ST_DEC[r.st]||''}; })},
    {t:'tab',lib:'Récapitulatif',large:true,cols:[{t:'CFC',flex:true},{t:'Adjudication\nbrute',r:true},{t:'Adjudication\nnette',r:true},{t:'Décompte\nbrut',r:true},{t:'Décompte\nnet',r:true}],
      rows:R('orderTable').map(r=>{ const c=r.c||[]; return {c:[posDec(c,4),c[6],c[7],c[8],c[9]],s:ST_DEC[r.st]||''}; })},
    {t:'tab',lib:'Facture finale',cols:[{t:'',flex:true},{t:'',r:true,g:true},{t:'',r:true}],rows:R('guaranteeConditionTable').map(condDec)},
    /* paiements : désignation, n° de paiement, date (colonne 4 du moteur = « Date pmt » du document du bureau), HT, taux, TVA, TTC ; lignes vides = espace ;
       « Paiements à ce jour », « Autres paiements » = intertitres */
    {t:'tab',lib:'Paiements',large:true,cols:[{t:'Désignation',flex:true},{t:'N° pmt'},{t:'Date pmt'},{t:'Montant HT',r:true},{t:'Taux',r:true,g:true},{t:'TVA',r:true},{t:'Montant TTC',r:true}],
      rows:prev.map(r=>{ const c=r.c||[]; if(!c.some(v=>sv(v).trim())) return {c:[],s:'v'};
        return {c:[c[0],c[3],c[4],c[6],c[7],c[8],c[9]],s:r.st==='l1t'&&!c.slice(1).some(v=>sv(v).trim())?'h':ST_DEC[r.st]||''}; })},
    {t:'par',lib:'Déclaration',x:ARR_DECL,fin:true},
    {t:'rub',lib:'Garantie',fin:true,lignes:[{x:'Certificat de garantie d’assurance',d:gm?cur+' '+sv(F.constructionGuarantyValue||window.num(gm)):''}]}];
  return {titre:'Arrêté de compte',date:isoDe(a.date)||'',dec:{etat:'Facture finale',num:[p.NUMBER,'AC',sv(lot.numero).trim()||sv(a.numero).trim()].map(v=>sv(v).trim()).filter(Boolean).join('.'),titre:'Arrêté de compte',
    no:sv(a.numero).trim()?'N° '+a.numero:'',
    chiffre:{lib:'Solde à verser',sous:['Facture finale',lotT?'CFC '+lotT:'',ent.nom].filter(Boolean),monnaie:cur,montant:sv(solde?(solde.c||[])[9]:F.totalToPay)},
    blocs,sig:[{lib:'L’architecte',nom:PT.archi.nom,adr:adrL(PT.archi.adr)},{lib:'L’entreprise',nom:ent.nom,adr:adrL(ent.adr)}]}}; }
/* ORDRE DE PAIEMENT (Paulo, 14.11.2026 : « Oui, l'ordre aussi ») : mêmes informations que le document d'avant (modèle du bureau : fiche de l'ordre puis lettre à la
   banque), prises dans ch01dOrderJob — affaire ; maître de l'ouvrage (adresse, téléphone, courriel) et sa banque (banque, IBAN, contact) ; architecte et direction des
   travaux (une seule rubrique s'ils sont les mêmes) ; « Nous vous prions d'effectuer les paiements suivants… », date et date valeur ; totaux avant paiement, des
   paiements, après paiement ; tableau des paiements (CFC, bénéficiaire — nom, adresse, banque en gris, IBAN —, n° de paiement, colonnes de la présentation des ordres,
   total) ; « L'ordre de paiements est validé par : » et les signatures (architecte, direction des travaux, maître de l'ouvrage). Numéro <affaire>.OP.<n°> ; à
   droite du filet de tête, la date valeur ; chiffre = total des paiements ; date de l'en-tête = date de l'ordre. */
const ordDe=o=>{ const C=(o&&o.E&&o.E.C)||{}, ref=(/^paymentorder\/([^/]+)$/.exec(sv(o&&o.dossier))||[])[1]; return ref&&typeof ch01dRef==='function'?(C.ordresPaiement||[]).find(q=>ch01dRef(q)===ref)||null:null; };
const titre2=t=>{ const m=sv(t).trim().split(/\s+/); if(m.length<2||sv(t).length<13) return sv(t).trim(); let k=1, best=1e9; for(let i=1;i<m.length;i++){ const d=Math.abs(m.slice(0,i).join(' ').length-m.slice(i).join(' ').length); if(d<best){ best=d; k=i; } } return m.slice(0,k).join(' ')+'\n'+m.slice(k).join(' '); };   /* titre de colonne sur deux lignes équilibrées */
/* bénéficiaire d'un paiement : le texte du moteur (ch01dBenef) redécoupé — nom en Regular, adresse sur une ligne, lignes de la banque en gris, IBAN en noir */
const benefLignes=(x,txt,op)=>{ const b=(x&&x.banque)||{}; let bank='';
  if(b.nom){ let t=[b.nom,b.npa||'',b.lieu||''].join(' ').trim(); if(b.texteCompte) t=t+'\n'+b.texteCompte; bank+='\n'+t.trim(); }
  if(b.iban) bank+='\n'+b.iban; else if(!b.nom&&b.texteCompte) bank+='\n'+b.texteCompte;
  if(op.displayPayDate===true&&x&&x.datePaiement&&typeof dfr==='function') bank+='\nDate pmt: '+dfr(x.datePaiement);
  const full=sv(txt), ok=!!bank&&full.endsWith(bank), L=[], lig=t=>sv(t).split('\n').map(v=>v.trim()).filter(Boolean), ent=lig(ok?full.slice(0,-bank.length):full);
  if(op.displayBkpText===true&&ent.length>1) L.push({t:ent.shift(),g:true});   /* texte du lot en tête (option de la présentation des ordres) */
  if(ent.length) L.push({t:ent[0],f:'r'}); if(ent.length>1) L.push({t:ent.slice(1).join(', ')});
  (ok?lig(bank):[]).forEach(t=>L.push({t,g:sv(b.iban).trim()!==t})); return L; };
function ordDonnees(o,rec){ const E=o.E, C=E.C||{}, p=E.p||{}, J=o.job(repDec(rec)), ord=J&&J.ref; if(!ord) throw new Error('ordre de paiement introuvable');
  const F=J.F||{}, T=(J.tables||{}).adviceOfPaymentTable||{rows:[]}, cur=(p&&p.CURRENCY)||'CHF', PT=decParties(p), P=typeof ch01dPaysOf==='function'?ch01dPaysOf(C,ord).slice():[];
  const op=((typeof ch01dPres==='function'?ch01dPres(C,'ordresPaiement'):null)||{}).options||{}, flex=Array.from(T.flex||[]);
  const cDe=v=>{ const id=v&&typeof v==='object'?v.id:v; return id!=null?DS.get('contact',id)||null:null; };
  const tm=c=>c?[typeof phone==='function'?phone(c,1):'',c.EMAIL1].map(v=>sv(v).trim()).filter(Boolean).join(' · '):'';
  const part=(na,c)=>[{x:na.nom,f:'r',z:9},{x:na.adr,z:9},{x:tm(c),z:9}].filter(l=>sv(l.x).trim());
  const moC=cDe(ord.maitreOuvrageContactId)||cDe(F.projectmanagementBuilderBySuproject), mo=(()=>{ const m=cDe(ord.maitreOuvrageContactId)?deNomAdr(cDe(ord.maitreOuvrageContactId)):null; return m&&m.nom?m:PT.mo; })();
  const arC=cDe(F.projectMemberArchitectContact), dtC=cDe(F.projectMemberConstructionManagerContact), ar=PT.archi, dt=PT.dt&&PT.dt.nom?PT.dt:PT.archi, meme=ar.nom===dt.nom&&ar.adr===dt.adr;
  const b=typeof ch01dBankMO==='function'?(ch01dBankMO(C,ord)||{}):{};
  const banque=[b.nom,b.rue,[b.npa,b.lieu].map(v=>sv(v).trim()).filter(Boolean).join(' ')].map(v=>sv(v).trim()).filter(Boolean).join(', '), compte=[b.iban,b.compte,b.texteCompte].map(v=>sv(v).trim()).filter(Boolean)[0]||'';
  const rows=[]; let k=0;
  (T.rows||[]).forEach(r=>{ const c=r.c||[], f=Array.from(r.f||[]);
    if(r.st==='tt'){ rows.push({c:['',c[1],'',...f],s:'t'}); return; }
    if(!c.some(v=>sv(v).trim())&&!f.some(v=>sv(v).trim())){ rows.push({c:[],s:'v'}); return; }
    if(!sv(c[2]).trim()){ rows.push({c:['',c[1],'',...f],s:'q'}); return; }   /* « Paiements avant / après exécution de l'ordre » (option de la présentation) */
    let x=P[k]; if(!x||sv(x.numero)!==sv(c[2])) x=P.find(y=>sv(y.numero)===sv(c[2]))||null; else k++;
    if(rows.length&&rows[rows.length-1].s==='') rows.push({c:[],s:'v'});   /* un peu d'air entre deux paiements */
    rows.push({c:[c[0],benefLignes(x,c[1],op),c[2],...f],s:''}); });
  const n=P.length, blocs=[
    {t:'rub',lib:'Affaire',lignes:[{x:[p.NUMBER,p.TITLE].map(v=>sv(v).trim()).filter(Boolean).join(' '),f:'r',z:9}]},
    {t:'rub',lib:'Maître de l’ouvrage',lignes:part(mo,moC)},
    {t:'rub',lib:'Banque du maître de l’ouvrage',wp:40,lignes:[{p:'Banque',x:banque},{p:'IBAN',x:compte}].concat(sv(b.contact).trim()?[{p:'Contact',x:sv(b.contact).trim()}]:[])}]
    .concat(meme?[{t:'rub',lib:'Architecte et direction des travaux',lignes:part(ar,arC||dtC)}]:[{t:'rub',lib:'Architecte',lignes:part(ar,arC)},{t:'rub',lib:'Direction des travaux',lignes:part(dt,dtC)}])
    .concat([
    {t:'rub',lib:'Ordre',wp:30,lignes:[{x:'Nous vous prions d’effectuer les paiements suivants à partir du compte du maître d’ouvrage et d’en retourner un exemplaire à l’architecte.'},
      {p:'Date',x:dateL(ord.date),p2:'Date valeur',x2:dateL(ord.dateValeur)}]},
    {t:'tab',lib:'Totaux',cols:[{t:'',flex:true},{t:'',r:true}],rows:[{c:['Total avant paiement',F.constructionTotalBeforeRemittance],s:''},{c:['Total des paiements',F.constructionRemittanceSummary],s:'p'},{c:['Total après paiement',F.constructionTotalAfterRemittance],s:'t'}]},
    {t:'tab',lib:'Paiements',large:true,lib1:true,cols:[{t:'CFC'},{t:'Bénéficiaire',flex:true},{t:'N° pmt'}].concat(flex.map(t=>({t:titre2(t),r:true}))),rows},
    {t:'rub',lib:'Validation',fin:true,lignes:[{x:'L’ordre de paiements est validé par :'}]}]);
  const sig=meme?[{lib:'Architecte et direction des travaux',nom:ar.nom,adr:adrL(ar.adr)},{lib:'Le maître de l’ouvrage',nom:mo.nom,adr:adrL(mo.adr)}]
    :[{lib:'L’architecte',nom:ar.nom,adr:adrL(ar.adr)},{lib:'La direction des travaux',nom:dt.nom,adr:adrL(dt.adr)},{lib:'Le maître de l’ouvrage',nom:mo.nom,adr:adrL(mo.adr)}];
  return {titre:'Ordre de paiement',date:isoDe(ord.date)||'',dec:{etat:isoDe(ord.dateValeur)?'Date valeur '+dateC(ord.dateValeur):'',num:[p.NUMBER,'OP',ord.numero].map(v=>sv(v).trim()).filter(Boolean).join('.'),titre:'Ordre de paiement',no:'',
    chiffre:{lib:'Total des paiements',sous:[n+' paiement'+(n>1?'s':''),isoDe(ord.date)?'Ordre du '+dateL(ord.date):''].filter(Boolean),monnaie:cur,montant:sv(F.constructionRemittanceSummary)},blocs,sig}}; }
async function decOctets(o,rec){ await DS.need(['subproject','contact','projectmember','contactowner','setting']).catch(()=>{});
  const {w,R,fn}=await SGDS.ressources(), p=o.E.p||{}, X=({bon:bonDonnees,arrete:arrDonnees,ordre:ordDonnees})[DEC_TYPES[sv(o.type)]](o,rec), aff=[p.NUMBER,p.TITLE].filter(Boolean).join(' - ');   /* cadre Facturation chargé : adresses de l'affaire (deGardeRub) */
  const opt=w.JSON.parse(JSON.stringify({titre:X.titre,sousTitre:aff,date:X.date||today(),type:'Contrôle des coûts',description:decNom(o)+' '+[p.NUMBER,p.TITLE].filter(Boolean).join(' '),decompte:X.dec})), j=new w.Array(); opt.journal=j;
  const oct=await fn(R,null,opt); if(j.length) console.info(decNom(o)+' :',Array.from(j)); return oct; }

/* ordre de paiement et bons de paiement dans un seul document à imprimer (Paulo, 15.11.2026 : « activer l'impression des bons de paiement de l'ensemble des bons de paiement de
   l'ordre de paiement », « regrouper les deux dans un seul document à imprimer », « ajoute une option ordre et une option bon ») — fenêtre ouverte par Imprimer ▸ « Ordre de
   paiement n° … et bons de paiement (PDF) » (descripteur o.sgLot) : l'ordre de paiement, puis le bon de chaque paiement de l'ordre dans l'ordre des numéros de paiement,
   chacun avec sa propre numérotation de pages (documents signés séparément) ; même dessin que l'ordre et le bon ouverts seuls (decOctets), assemblés par pdf-lib. Réglages
   ▸ Affichage : « Ordre de paiement », « Bons de paiement » (cochés d'office, au moins l'un des deux ; enregistrés dans le document de l'ordre : sgPdf.lotOrdre, lotBons).
   Rien d'autre n'est écrit : un bon dont le document n'est pas encore créé est dessiné avec le modèle qu'« Ouvrir » prendrait (ch01aTplPick, sans question), à défaut
   sans modèle (libellés par défaut du moteur). L'ordre ouvert par l'onglet Documents reste l'ordre seul. */
const MODELES=new Map();
async function modeleBon(E,x){ const ty=ch01dBonType(x), k=ty+'|'+sv((E.p||{}).DOCTEMPLATEGROUPNAME); if(!MODELES.has(k)){ let t=null; try{ t=await ch01aTplPick(ty,E.p||{}); }catch(e){ console.error(e); } MODELES.set(k,(t&&t!=='aucun'&&t.rep)||{sections:[]}); } return MODELES.get(k); }
/* bon de paiement d'un paiement : celui de son ordre (o donné, sinon l'ordre qui le contient) ; paiement hors de tout ordre : bon sans ordre (signataire : maître de l'ouvrage de l'affaire) */
async function bonOctets(E,x,o){ const C=(E&&E.C)||{}; if(o===undefined) o=(C.ordresPaiement||[]).find(q=>(q.paiementIds||[]).includes(x.id))||null;
  const d=o?ch01dBonO(E,o,x):{E,dossier:'paymentorder/-/'+(x.numero!=null?x.numero:''),type:ch01dBonType(x),nomDefaut:ch01dBonNom(x),label:'Bon de paiement',job:rep=>ch01dBonJob(E,null,x,rep)};
  let rec=o?ch01dBonRec(E,o,x):null; if(!rec||!rec.doc||!rec.doc.report) rec={doc:{report:await modeleBon(E,x)}}; return decOctets(d,rec); }
async function assembler(L,titre){ if(L.length===1) return L[0]; const {w}=await SGDS.ressources(), PL=w.PDFLib, doc=await PL.PDFDocument.create();
  for(const by of L){ const src=await PL.PDFDocument.load(new w.Uint8Array(by)); (await doc.copyPages(src,src.getPageIndices())).forEach(pg=>doc.addPage(pg)); }
  doc.setTitle(sv(titre)); doc.setAuthor('Substances Architectes'); doc.setProducer('SUBGestion'); return await doc.save(); }
async function bonsOctets(E,o){ const P=o&&typeof ch01dPaysOf==='function'?ch01dPaysOf((E&&E.C)||{},o):[], L=[]; if(!P.length) return L;
  await DS.need(typeof CH01A_T!=='undefined'?CH01A_T:['cocodoc']).catch(()=>{}); for(const x of P) L.push(await bonOctets(E,x,o)); return L; }
/* bons de paiement d'une suite de paiements en un seul PDF (Documents ▸ Paiements : aperçu et « Créer le PDF », sg3_coco.js) */
async function bonsPdf(E,L){ await DS.need(typeof CH01A_T!=='undefined'?CH01A_T:['cocodoc']).catch(()=>{}); const P=[], p=(E&&E.p)||{}; for(const x of L) P.push(await bonOctets(E,x));
  if(!P.length) throw new Error('aucun paiement choisi'); return assembler(P,('Bons de paiement '+[p.NUMBER,p.TITLE].filter(Boolean).join(' ')).trim()); }
const lotDe=o=>{ const op=optsDe(o), q=ordDe(o), n=q&&typeof ch01dPaysOf==='function'?ch01dPaysOf((o.E&&o.E.C)||{},q).length:0, bons=op.lotBons!==false&&n>0; return {q,n,bons,ordre:op.lotOrdre!==false||!bons}; };
async function lotOctets(o,rec){ const S=lotDe(o), L=[], p=(o.E&&o.E.p)||{}; if(S.ordre) L.push(await decOctets(o,rec)); if(S.bons) (await bonsOctets(o.E,S.q)).forEach(b=>L.push(b));
  return assembler(L,(decNom(o)+(S.bons?' et bons de paiement':'')+' '+[p.NUMBER,p.TITLE].filter(Boolean).join(' ')).trim()); }

/* choix du modèle à la création : sans objet pour le bon de paiement et l'arrêté de compte (même dessin quel que soit le modèle ; seuls quelques libellés — « Total
   net HT », « Totaux » — en viennent) : le premier modèle de la liste, celui que la fenêtre « Choisir le modèle » proposait d'office, est pris sans question */
if(typeof ch01aTplPick==='function'&&typeof ch01aTplList==='function'){ const t0=ch01aTplPick;
  ch01aTplPick=async function(type,p){ if(DEC_TYPES[type]) try{ await DS.need(['doctemplate','modeledocument','image']); const L=ch01aTplList(type,p);
      if(L&&L.list.length>1){ const t=L.list[0], m=(DS.T.modeledocument||{})[L.jeu+'/'+t.FILENAME]; if(m&&m.report) return {jeu:L.jeu,fichier:t.FILENAME,desc:t.DESCRIPTION||'',rep:m.report,id:t.ID}; } }catch(e){ console.error(e); }
    return t0.apply(this,arguments); }; }
/* ── rendu repéré : le PDF est fait ici, la fenêtre, « Créer le PDF » et « Partager » le reprennent (sgImpPdf du bloc 31) ── */
const r0=ch01aRender;
ch01aRender=function(o,rec){ const g=genre(o); if(!g||!window.SGIMP||typeof SGDS==='undefined'||!rec||!rec.doc||!rec.doc.report) return r0.apply(this,arguments);
  const S=window.SGIMP; let R0=null; if(g==='liste') R0=r0.apply(this,arguments);   /* listes : rendu du moteur d'abord (repère et valeurs du bloc 31) */
  const id=(++S.n).toString(36)+'c'+Date.now().toString(36);
  const pdf=(g==='overview'?ovOctets(o,rec):g==='estimate'?kvOctets(o,rec):g==='ordre'&&o.sgLot?lotOctets(o,rec):g==='bon'||g==='arrete'||g==='ordre'?decOctets(o,rec):listeOctets(o,rec,R0)).then(oct=>new Blob([oct],{type:'application/pdf'}));
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
  const gardeIt=()=>L.push(it('Page de garde',optsDe(o).garde!==false,opt(o,'garde',optsDe(o).garde===false),{grp:'Affichage'}));
  const niv=(cur)=>['tout','3','2','1'].forEach(v=>L.push(it('CFC : '+(v==='tout'?'Tout':v+(v==='1'?' chiffre':' chiffres')),cur===v,opt(o,'niv',v),{grp:'Positions',seg:'CFC',l:v==='tout'?'Tout':v,ti:v==='tout'?'Tous les niveaux de CFC':'CFC jusqu’à '+v+(v==='1'?' chiffre':' chiffres')})));
  if(g==='overview'){ const S=ovEtat(o,rec), nv=ch01aFlex(Object.assign({},C,{presentations:Object.assign({},C.presentations||{},{controle:[{favori:true,colonnes:(S.P?S.P.colonnes:PDF_STD().map(id=>({id,idDelta:CH01A_IDD[id]})))||[]}]})}),'controle').length;
    L.push(it('Format : Paysage',S.format==='paysage',opt(o,'format','paysage'),{grp:'Format'}),it('Format : Portrait',S.format==='portrait',opt(o,'format','portrait'),{grp:'Format',ti:nv>5?'Document en portrait : '+nv+' colonnes de montants, en petits caractères':'Document en portrait'}));
    const PL=((C.presentations||{}).controle)||[];
    L.push(it('Standard',!S.P,opt(o,'pres',null),{grp:'Colonnes',seg:'Colonnes',segLib:false,l:'Standard',ti:'Colonnes de l’écran et la provision : DG, mutations, modifications, DG révisé, contrats et avenants, provision, paiements, coût probable, état du coût'}));
    PL.forEach((x,i)=>{ if(estStandard(x)&&S.P!==x) return;   /* présentation identique à Standard : pas en double (comme le menu de l'écran) */
      L.push(it(sv(x.nom||'Présentation '+(i+1))+(sv(x.nom)==='Standard'?' (du document)':''),S.P===x,opt(o,'pres',{i,nom:sv(x.nom)}),{grp:'Colonnes',seg:'Colonnes',segLib:false})); });
    /* mêmes rubriques et mêmes cases que la fenêtre du devis général (Paulo, 14.11.2026 : « semblable à celle du devis général, avec les mêmes options ») : Positions
       (sans montant, 1 à 3 chiffres, descriptif), Écritures (le « calcul » du contrôle des coûts), Montants (décimales, arrondi), Affichage (volume et prix au m³,
       récapitulatif à 2 chiffres, parties du document), Sauts de page ; « Colonnes » est propre au contrôle des coûts */
    L.push(it('Afficher les positions sans montant',S.vides,opt(o,'vides',!S.vides),{grp:'Positions',ti:'Imprime aussi les positions qui n’ont aucun montant dans les colonnes choisies'}),
      it('Seulement positions de 1 à 3 chiffres',S.niv!=='tout',opt(o,'niv',S.niv==='tout'?'3':'tout'),{grp:'Positions',ti:S.niv==='2'||S.niv==='1'?'Document limité aux CFC à '+S.niv+(S.niv==='1'?' chiffre':' chiffres')+' (réglage d’avant) : décocher pour tout imprimer':'Contrôle du coût détaillé sans les positions à 4 chiffres et plus'}),
      it('Descriptif',S.desc,opt(o,'desc',!S.desc),{grp:'Positions',ti:'Descriptif de chaque position sous sa ligne (texte du devis général)'}),
      it('Afficher les entreprises',S.ent,opt(o,'ent',!S.ent),{grp:'Positions'}));
    if(typeof ch01aOuvs==='function'&&ch01aOuvs(C).length) L.push(it('Subdivisions par ouvrage (récapitulatif)',S.ouv,opt(o,'ouv',!S.ouv),{grp:'Positions'}));
    L.push(it('Masquer les décimales',S.sansDec||S.arr>0,opt(o,'sansDec',!S.sansDec),{grp:'Montants',dis:S.arr>0,ti:S.arr>0?'Montants arrondis à '+S.arr+' : sans décimales':'Montants arrondis au franc'}));
    [10,100,1000].forEach(v=>L.push(it('Arrondir à '+v,S.arr===v,opt(o,'arr',S.arr===v?0:v),{grp:'Montants',ti:'Chaque montant imprimé est arrondi à '+v+' francs'})));
    { const vb=typeof sgVolumeSIA416==='function'?+sgVolumeSIA416(E.p)||0:0;
      L.push(it('Volume SIA 416 et prix au m³',S.chif&&vb>0,opt(o,'chif',!S.chif),{grp:'Affichage',dis:!(vb>0),ti:vb>0?'Volume bâti et coût probable au m³ (CFC 2, CFC 1 à 9), au-dessus du récapitulatif':'Volume à saisir dans Projet ▸ Surfaces et volumes'})); }
    L.push(it('Récapitulatif CFC à 2 chiffres',S.recap2,opt(o,'recap2',!S.recap2),{grp:'Affichage'}),it('Contrôle du coût détaillé',S.docu,opt(o,'doc',!S.docu),{grp:'Affichage'}));
    gardeIt();
    L.push(it('Signatures',sigDe(o,rec),opt(o,'sig',!sigDe(o,rec)),{grp:'Affichage',dis:optsDe(o).garde===false,ti:'Maître de l’ouvrage et architecte, sur la page de garde ; d’office pour un décompte final (nom du document)'}));
    L.push(it('Afficher les écritures',S.det,opt(o,'det',!S.det),{grp:'Écritures'}));
    [['mut','Mutations'],['ctr','Contrats et avenants'],['pay','Paiements'],['prov','Provisions et coût probable']].forEach(([k,t])=>L.push(it(t,S.det&&S.dk(k),opt(o,'det_'+k,!S.dk(k)),{grp:'Écritures',ind:true,dis:!S.det})));
    L.push(it('Date et n° des mutations',S.mutDate,opt(o,'mutDate',!S.mutDate),{grp:'Écritures',ind:true,dis:!S.det||!S.dk('mut')}),
      it('Date de facture au lieu de la date de paiement',S.dateFacture,opt(o,'dateFacture',!S.dateFacture),{grp:'Écritures',ind:true,dis:!S.det||!S.dk('pay')}),
      it('Marquer le dernier paiement ('+S.marque+')',S.dernier,opt(o,'dernier',!S.dernier),{grp:'Écritures',ind:true,dis:!S.det||!S.dk('pay')}));
    L.push(...sautItems(o)); }
  else if(g==='estimate'){ const S=kvEtat(o,rec);
    L.push(it('Format : Paysage',S.format==='paysage',opt(o,'format','paysage'),{grp:'Format'}),it('Format : Portrait',S.format==='portrait',opt(o,'format','portrait'),{grp:'Format'}));
    L.push(it('Récapitulatif CFC à 2 chiffres',S.recap2,opt(o,'recap2',!S.recap2),{grp:'Affichage'}),it('Devis général détaillé',S.docu,opt(o,'doc',!S.docu),{grp:'Affichage'})); gardeIt();
    niv(S.niv); if(S.subs) L.push(it('Subdivisions par ouvrage',S.ouv,opt(o,'ouv',!S.ouv),{grp:'Positions'}));
    L.push(it('Masquer les décimales',S.sansDec,opt(o,'sansDec',!S.sansDec),{grp:'Montants'}),it('Pourcentages sur le total général',S.pctTot,opt(o,'pctTot',!S.pctTot),{grp:'Montants'}));
    if(S.fac!==1) L.push(it('Colonne « DG indexé »',S.indexe,opt(o,'indexe',!S.indexe),{grp:'Montants'}));
    L.push(...sautItems(o)); }
  else if(g==='liste'){ format('paysage'); gardeIt(); }
  /* réglages existants du moteur, à leur place d'origine */
  const T=sv(o.type);
  if(T==='costControlPaymentList'&&typeof ch01dOpt==='function'){ const po=ch01dOpt(C);
    /* plus de choix du tri : toujours par numéro de paiement (Paulo, 11.11.2026 ; ch01dOpt enveloppé dans sg3_coco.js) */
    L.push({t:'Récapitulatif de la TVA',chk:po.recapTVA,grp:'Montants',fn:moteurSet(o,c=>ch01dSetOpt(c,'recapTVA',!po.recapTVA),c=>ch01dOpt(c).recapTVA)}); }
  if(T==='costControlGuaranteeList'&&typeof ch01cPref==='function'){ const po=ch01cPref(C);
    [['date','date'],['adjudication','adjudication'],['adresse','adresse'],['numero','numéro']].forEach(([k,l])=>L.push({t:'Tri : '+l,chk:po.tri===k,grp:'Tri',seg:'Trier',segLib:false,l,fn:moteurSet(o,c=>ch01cSetPref(c,'triGaranties',k,()=>{}),c=>ch01cPref(c).tri)}));
    [['1','1 ligne'],['2','2 lignes'],['n','Complète']].forEach(([k,l])=>L.push({t:'Adresses : '+l,chk:po.adr===k,grp:'Adresses',seg:'Adresses',segLib:false,l,fn:moteurSet(o,c=>ch01cSetPref(c,'adresses',k,()=>{}),c=>ch01cPref(c).adr)})); }
  if(baseArr(o.dossier)&&ARR_TYPES.has(T)&&typeof ch01aArr==='function'){ const a=arrDe(o);
    L.push(it('Arrondir les conditions',a.cond,fin=>{ arrSet(o,'roundContractSummary',!a.cond,fin); return false; },{grp:'Montants',ti:'Vaut pour tous les documents de la section'}),
      it('Afficher le total arrondi',a.tot,fin=>{ arrSet(o,'addRoundedTotalKey',!a.tot,fin); return false; },{grp:'Montants',ti:'Vaut pour tous les documents de la section'})); }
  /* ordre de paiement ouvert par « Imprimer » : l'ordre et les bons de paiement de ses paiements dans un seul document (lotOctets) — une option pour chacun */
  if(g==='ordre'&&o.sgLot){ const S=lotDe(o), garde=()=>{ toast('Le document garde au moins l’ordre de paiement ou les bons de paiement.'); return false; };
    L.push(it('Ordre de paiement',S.ordre,fin=>S.ordre&&!S.bons?garde():opt(o,'lotOrdre',!S.ordre)(fin),{grp:'Affichage',ti:'L’ordre de paiement, en tête du document'}),
      it('Bons de paiement',S.bons,fin=>S.bons&&!S.ordre?garde():opt(o,'lotBons',!S.bons)(fin),{grp:'Affichage',dis:!S.n,ti:S.n?'Le bon de paiement de chacun des '+S.n+' paiements de l’ordre, à la suite de l’ordre':'Cet ordre n’a aucun paiement'})); }
  /* arrêté de compte : paiement final compté ou non dans les paiements à ce jour (la question que le moteur pose à l'ouverture ; vaut pour cette ouverture) */
  if(g==='arrete'){ const a=decArr(o); if(a&&typeof ch01cHasFinal==='function'&&ch01cHasFinal(C,a)) L.push({t:'Inclure le paiement final',chk:o.final!==false,grp:'Montants',
    ti:'Compte le paiement final dans les paiements à ce jour : le solde à verser est alors ce qui reste après lui',fn:()=>{ o.final=!(o.final!==false); }}); }
  return L; }
const GROUPES=['Format','Colonnes','Positions','Écritures','Montants','Affichage','Tri','Adresses','Sauts de page','Autres'];   /* ordre de la fenêtre du devis général : Format, Positions, Calcul (ici Écritures), Montants, Affichage, Sauts de page */

/* ═══ fenêtre ═══ */
function vueCoco(D,o){ const E=o.E||{}, p=E.p||{}, rec=ch01aRec(E,o.dossier)||{}, doc=DS.get('costcontroldocument',E.id)||{}, g=genre(o);
  o._sgD=D; o._ccSeq=typeof ctBseq==='function'?ctBseq('costcontrol',E.id):null;   /* version du contrôle des coûts à l'ouverture (réglages du moteur) */
  const peut=()=>{ try{ return ecrit()&&!(typeof ch03dLecture==='function'&&ch03dLecture(E)); }catch(_){ return true; } };
  const rendre=()=>ch01aRender(o,ch01aRec(E,o.dossier));
  const actions=[]; if(false&&!g&&rec.doc&&typeof ch01aTexts==='function') actions.push({   /* « Modifier les textes… » retiré (Paulo, 11.11.2026 : « supprimer »), comme dans le devis */t:'Modifier les textes…',ico:ICO_TXT,ti:'Textes du modèle de ce document',fn:()=>{
    if(!peut()){ toast('Lecture seule : textes non modifiables.',true); return; } const cur=ch01aRec(E,o.dossier); if(cur&&cur.doc) ch01aTexts(cur,r2=>{ try{ D.maj(ch01aRender(o,r2)); }catch(e){ console.error(e); } }); }});
  SGDE.vue(D,{barre:o.sgBarre||E.sgBarre||null,   /* ouvert par « Imprimer » : barre « Document PDF » du devis général (15.11.2026) ; ouvert depuis Documents : barre des documents */
    p,lb:'Contrôle des coûts · Documents',titre:titreDe(o,rec),etat:ETATS[doc.STATECODE]||'',peut,items:()=>items(o),rendre,
    pied:'Enregistrés dans le document',groupes:GROUPES,groupe:(x,G)=>x.grp&&G[x.grp]?x.grp:'Autres',rang:()=>0,retrait:x=>!!x.ind,actions,
    installer:({R,maj,reset,peut})=>{ if(g!=='overview'&&g!=='estimate') return;   /* sauts de page : repères à l'écran, menu au clic droit */
      const cont=R.querySelector('.sglp-pages'); let att=0;   /* repères reposés après chaque mise en page et chaque page rendue (les mutations des repères eux-mêmes sont ignorées) */
      const propre=m=>[...m.addedNodes,...m.removedNodes].every(n=>n.nodeType===1&&n.classList&&n.classList.contains('sgsp-mq'));
      if(cont) new MutationObserver(ms=>{ if(ms.every(propre)) return; clearTimeout(att); att=setTimeout(()=>ccSautMarquer(cont,o),30); }).observe(cont,{childList:true,subtree:true});
      R.querySelector('.sgdv-doc').addEventListener('contextmenu',e=>ccSautMenu(e,o,()=>{ reset(); maj(); },peut),true); }}); }
const o0=ch01aOpen;
ch01aOpen=function(o){ const D=o0.apply(this,arguments); if(D&&D.bd&&o&&o.E) try{ vueCoco(D,o); }catch(e){ console.error(e); } return D; };

/* Comptes d'entreprise ▸ Imprimer (11.11.2026, Paulo : « impression de la liste des comptes des entreprises, même design que pour les autres documents comme
   adjudications ») : le moteur n'a pas de document « liste des comptes d'entreprise » ; PDF fait ici au graphisme des listes (page de garde, tableau bleu nuit,
   texte dès la colonne « info@ » du pied, paysage), mêmes colonnes et mêmes montants que le tableau de l'écran, total en pied */
const COMPTES_O=E=>({E,type:'costControlEntrepreneurList',dossier:'entrepreneur-liste',label:'Comptes d’entreprise',nomDefaut:'Comptes d’entreprise'});   /* réglages : cocodoc <id>/entrepreneur-liste (options.sgPdf), sans document du moteur */
async function comptesOctets(E){ const o=COMPTES_O(E), C=E.C, M=await mesure(), L0=SGDE.livret, ori=optsDe(o).format==='portrait'?'portrait':'paysage', geo={x0:L0.DG_X0T+DG_CFC,W:(ori==='portrait'?L0.DG_WP:L0.DG_WL)-DG_CFC}, W=geo.W,   /* pas de colonne CFC : le tableau commence à la colonne « info@ » (x 125.72), rien ne dépasse à gauche (Paulo, 11.11.2026) */
    cap=Math.max(1,Math.floor((ori==='portrait'?DG_HP:DG_HT)/DG_RH));
  const ents=[...new Set([...(C.contrats||[]).map(c=>c.contactId),...(C.paiements||[]).map(x=>x.contactId)])].filter(x=>x!=null).sort((a,b)=>sv(ccEntName(C,a)).localeCompare(sv(ccEntName(C,b)),'fr'));
  const ctrN=(e,t)=>(C.contrats||[]).filter(c=>c.contactId===e&&c.type===t).reduce((a,c)=>a+docNet(c),0), payN=(e,surC)=>(C.paiements||[]).filter(x=>x.contactId===e&&(!surC||x.contratId)).reduce((a,x)=>a+docNet(x),0);
  const F=x=>window.num(Math.round(x*100)/100);   /* num du moteur (le num de ce bloc lit un nombre) */
  const V=e=>{ const c=ctrN(e,'contrat'), a=ctrN(e,'avenant'); return [c,a,c+a,payN(e),c+a-payN(e,true)]; }, T=[0,0,0,0,0];
  const rows=ents.map(e=>{ const v=V(e); v.forEach((x,i)=>{ T[i]+=x; }); return {c:[sv(ccEntName(C,e)),...v.map(F)],s:'S'}; });
  rows.push({c:['Total',...T.map(F)],s:'T'});
  const tit=['Entreprise','Contrats TTC','Avenants TTC','Contrats + avenants TTC','Paiements TTC','Contrat − paiements sur contrat TTC'];
  const wn=tit.map((t,j)=>j<1?0:Math.max(M.larg(t,true),...rows.map(r=>M.larg(sv(r.c[j]),r.s!=='S')))+10), sn=wn.reduce((a,b)=>a+b,0);
  const cols=tit.map((t,j)=>({t,w:j===0?Math.max(120,W-sn):wn[j],r:j>=1}));
  const tot=cols.reduce((a,c)=>a+c.w,0); if(tot>W){ const f=(W-cols[0].w)/(tot-cols[0].w); cols.forEach((c,j)=>{ if(j>=1) c.w*=f; }); }
  const rec={doc:{nom:'Comptes d’entreprise'}};
  const pages=paginer(etaler(rows,cols,M),cols,cap,'Comptes d’entreprise',2,{}); return sortie(o,rec,pages,ori,'liste',geo); }
/* fenêtre des documents (SGDE.vue) pour la liste des comptes d'entreprise (Paulo, 11.11.2026 : « ajouter la fenêtre d'option à droite ») : lecteur, Imprimer, PDF
   (téléchargement), volet Réglages (Format, Page de garde) enregistrés dans le contrôle des coûts (cocodoc <id>/entrepreneur-liste) */
function comptesVue(E){ const o=COMPTES_O(E), doc=DS.get('costcontroldocument',E.id)||{}, p=E.p||{}; let dernier=null;
  const dg=dialog({title:'Comptes d’entreprise',body:h('div'),buttons:[]}), ifr={};
  const D={bd:dg.bd,iframe:ifr,close:dg.close,maj:r=>{ try{ if(ifr._sgVuePrep) ifr._sgVuePrep(); }catch(_){}
    return Promise.resolve(r).then(oct=>{ dernier=oct; if(ifr._sgVue) ifr._sgVue(new Blob([oct],{type:'application/pdf'})); },e=>{ console.error(e); if(ifr._sgVueErr) ifr._sgVueErr(e); }); }};
  const nomF=()=>[p.NUMBER,'Comptes d’entreprise'].filter(Boolean).join(' ')+'.pdf';
  const tel=()=>{ if(!dernier) return; const u=URL.createObjectURL(new Blob([dernier],{type:'application/pdf'})), a=document.createElement('a'); a.href=u; a.download=nomF(); document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),4000); };
  const peut=()=>{ try{ return ecrit(); }catch(_){ return true; } };
  SGDE.vue(D,{barre:'pdf',p,lb:'Contrôle des coûts · Documents',titre:'Comptes d’entreprise',etat:ETATS[doc.STATECODE]||'',peut,items:()=>items(o),rendre:()=>comptesOctets(E),
    pied:'Enregistrés dans le contrôle des coûts',groupes:GROUPES,groupe:(x,G)=>x.grp&&G[x.grp]?x.grp:'Autres',rang:()=>0,retrait:x=>!!x.ind});   /* Télécharger : dans la barre « Document PDF » (15.11.2026) */
  D.maj(comptesOctets(E)); }
/* ═══ Arrêtés de compte et Ordres de paiement ▸ Imprimer (Paulo, 14.11.2026 : « produis la même fenêtre dans arrêtés de compte et ordres de paiement ») : le moteur n'a pas
   de document pour la liste de ces onglets ; PDF fait ici au graphisme des listes (page de garde, tableau bleu nuit, texte dès la colonne « info@ »), mêmes lignes et mêmes
   montants que l'écran, dans la fenêtre des documents avec le volet Réglages (Format, Page de garde) — réglages : cocodoc <id>/<dossier> (options.sgPdf), sans document du
   moteur. Arrêtés de compte : une ligne par arrêté (liste et ordre de l'écran, ch01cGarList), total des garanties et des factures finales. Ordres de paiement : chaque
   ordre (n°, date, maître de l'ouvrage, nombre de paiements, statut, total) suivi de ses paiements (lot, bénéficiaire, n° de paiement, statut, montant), total général. ═══ */
const TABLES={
  arretes:{type:'costControlFinalPaymentTable',dossier:'finalpayment-liste',titre:'Arrêtés de compte',flex:1,donnees:E=>{ const C=E.C||{}, F=x=>window.num(Math.round((+x||0)*100)/100), g=a=>a.garantie||{};
      let L=[]; try{ const P=typeof ch01cPref==='function'?ch01cPref(C):{}; L=typeof ch01cGarList==='function'?ch01cGarList(C,P.tri,true).map(x=>({a:x.a,ent:(typeof ch01cAdr==='function'&&ch01cAdr(x.cid,P.adr))||ccEntName(C,x.cid)})):[]; }catch(_){ L=[]; }
      if(!L.length) L=(C.arretes||[]).map(a=>({a,ent:ccEntName(C,a.contactId)}));
      let tg=0, tn=0; const rows=L.map(x=>{ const a=x.a, G=g(a), m=+G.montant||0, n=docNet(a); tg+=m; tn+=n;
        return {c:[sv(a.numero),sv(x.ent).split('\n')[0],dfr(a.date),sv(ARR_ST[a.statut]||''),sv(GAR_T[G.genre]||''),dfr(G.debut),dfr(G.fin),m?F(m):'',F(n)],s:'S'}; });
      if(rows.length) rows.push({c:['','Total','','','','','',F(tg),F(tn)],s:'T'});
      return {tit:['N°','Entreprise','Date','Statut','Garantie','Début garantie','Échéance garantie','Montant garantie','Facture finale nette'],r:[0,0,0,0,0,0,0,1,1],rows}; }},   /* montants en dernières colonnes */
  ordres:{type:'costControlPaymentOrderTable',dossier:'paymentorder-liste',titre:'Ordres de paiement',flex:3,donnees:E=>{ const C=E.C||{}, F=x=>window.num(Math.round((+x||0)*100)/100), rows=[]; let T=0;
      const OP=(C.ordresPaiement||[]).slice().sort((a,b)=>(+b.numero||0)-(+a.numero||0)||sv(b.numero).localeCompare(sv(a.numero),'fr'));   /* ordre de l'écran : du plus récent au plus ancien */
      OP.forEach(o=>{ const ps=(C.paiements||[]).filter(x=>(o.paiementIds||[]).includes(x.id)), t=ps.reduce((a,x)=>a+docNet(x),0); T+=t; let mo=''; try{ mo=contactName(DS.get('contact',o.maitreOuvrageContactId))||''; }catch(_){}
        rows.push({c:[sv(o.numero),dfr(o.date),'',sv(mo),ps.length+(ps.length>1?' paiements':' paiement'),sv(ORD_ST[o.statut]||o.statut||''),F(t)],s:'W'});
        ps.forEach(x=>rows.push({c:['','',sv((x.lot||{}).numero),sv(ccEntName(C,x.contactId)),sv(x.numero),sv(PAY_ST[x.statut]||x.statut||''),F(docNet(x))],s:'S'})); });
      if(rows.length) rows.push({c:['','','','Total','','',F(T)],s:'T'});
      return {tit:['N°','Date','CFC','Maître de l’ouvrage · bénéficiaire','N° de paiement','Statut','Montant TTC'],r:[0,0,0,0,0,0,1],rows}; }}};
const TABLE_O=(E,k)=>({E,type:TABLES[k].type,dossier:TABLES[k].dossier,label:TABLES[k].titre,nomDefaut:TABLES[k].titre});
async function tableOctets(E,k){ const T=TABLES[k], o=TABLE_O(E,k), M=await mesure(), L0=SGDE.livret, ori=optsDe(o).format==='portrait'?'portrait':'paysage', geo={x0:L0.DG_X0T+DG_CFC,W:(ori==='portrait'?L0.DG_WP:L0.DG_WL)-DG_CFC}, W=geo.W,
    cap=Math.max(1,Math.floor((ori==='portrait'?DG_HP:DG_HT)/DG_RH)), D=T.donnees(E), fx=T.flex||0;
  if(!D.rows.length) D.rows.push({c:D.tit.map((_,j)=>j===fx?'Aucune ligne.':''),s:'S'});
  /* largeurs : chaque colonne à la mesure de son titre et de son contenu, la colonne de texte principale prend le reste (110 pt au moins) ; trop large : les autres réduites */
  const nat=D.tit.map((t,j)=>Math.max(M.larg(t,true),...D.rows.map(r=>M.larg(sv(r.c[j]),r.s!=='S')))+10), fixe=nat.reduce((a,b,j)=>a+(j===fx?0:b),0);
  const cols=D.tit.map((t,j)=>({t,w:j===fx?Math.max(110,W-fixe):nat[j],r:!!D.r[j]})), tot=cols.reduce((a,c)=>a+c.w,0);
  if(tot>W){ const f=(W-cols[fx].w)/(tot-cols[fx].w); cols.forEach((c,j)=>{ if(j!==fx) c.w*=f; }); }
  return sortie(o,{doc:{nom:T.titre}},paginer(etaler(D.rows,cols,M),cols,cap,T.titre,2,{}),ori,'liste',geo); }
function tableVue(E,k){ const T=TABLES[k], o=TABLE_O(E,k), doc=DS.get('costcontroldocument',E.id)||{}, p=E.p||{}; let dernier=null;
  const dg=dialog({title:T.titre,body:h('div'),buttons:[]}), ifr={};
  const D={bd:dg.bd,iframe:ifr,close:dg.close,maj:r=>{ try{ if(ifr._sgVuePrep) ifr._sgVuePrep(); }catch(_){}
    return Promise.resolve(r).then(oct=>{ dernier=oct; if(ifr._sgVue) ifr._sgVue(new Blob([oct],{type:'application/pdf'})); },e=>{ console.error(e); if(ifr._sgVueErr) ifr._sgVueErr(e); }); }};
  const tel=()=>{ if(!dernier) return; const u=URL.createObjectURL(new Blob([dernier],{type:'application/pdf'})), a=document.createElement('a'); a.href=u; a.download=[p.NUMBER,T.titre].filter(Boolean).join(' ')+'.pdf'; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),4000); };
  const peut=()=>{ try{ return ecrit(); }catch(_){ return true; } };
  SGDE.vue(D,{barre:'pdf',p,lb:'Contrôle des coûts · Documents',titre:T.titre,etat:ETATS[doc.STATECODE]||'',peut,items:()=>items(o),rendre:()=>tableOctets(E,k),
    pied:'Enregistrés dans le contrôle des coûts',groupes:GROUPES,groupe:(x,G)=>x.grp&&G[x.grp]?x.grp:'Autres',rang:()=>0,retrait:x=>!!x.ind});
  D.maj(tableOctets(E,k)); }
window.SGCD={outils:{mesure,etaler,paginer},lotOctets,bonsOctets,bonsPdf,bonOctets,lotDe,decOctets,bonDonnees,arrDonnees,ordDonnees,decNom,tableVue,tableOctets,comptesVue,comptesOctets,ovOctets,kvOctets,listeOctets,items,optsDe,optsSet,presDe,genre,garde,titreDe,filtreDe,entDe,PP,PA,CARTES,sautsDe};
})();

/* ═══ Archives ▸ Maquettes ▸ Bon de paiement et arrêté de compte · Deux colonnes (14.11.2026, Paulo : « j'aime bien la version 4 que je souhaite garder dans
   archives et appliquer la version 2 pour le moment ») ═══
   Variante 4 des maquettes du 14.11.2026 (subgestion3/_backup_20261114_maquette_bon_arrete/maquette.py, fonctions v4_bon / v4_arrete) : la page partagée en deux —
   à gauche, sur les colonnes du pied de page, qui et quoi (document, CFC, entreprise, banque, parties) ; à droite le décompte sur bande bleu nuit et les
   signatures. Maquette seulement : données d'exemple de 99TST (affaire fictive), aucune action, rien n'est lu ni écrit. Dessinée dans une racine fantôme
   (shadow DOM) : ses classes ne touchent pas l'app. Un clic sur une page l'agrandit. Pages et feuille de style produites par le script de la maquette. */
(function(){ if(typeof VIEWS==='undefined'||typeof nxPage!=='function'||typeof sgIntro!=='function') return;
const CSS="/* ── papier (unités : points du PDF) ── */\n.pg{position:relative;width:595.28pt;height:841.89pt;background:#fff;color:#1d1d1b;font:300 8pt/15pt var(--s-font);overflow:hidden;text-align:left;flex:none}\n.pg *{box-sizing:border-box;margin:0;padding:0;font-style:normal}\n.pg b,.pg .b{font-weight:700}\n.pg .rg{font-weight:400}\n.pg .nm{font-weight:400}\n.tb,.tt{position:absolute;left:28.35pt;font-size:7.5pt;text-transform:uppercase;white-space:nowrap}\n.tb{top:15.6pt;line-height:13.9pt}\n.tb span{display:block;position:relative;height:13.9pt}\n.tb span+span::before,.tt>*+*::before,.pd div span+span::before{content:\"\";position:absolute;left:0;top:-.3pt;width:7.8pt;border-top:.4pt solid #1d1d1b}\n.tt{top:26.8pt;line-height:14pt}\n.tt>*{display:block;position:relative;height:14pt}\n.tt>*+*::before{top:-.9pt}\n.tt .g{color:#666}\n.pd{font-size:7.5pt;line-height:14pt;text-transform:uppercase;white-space:nowrap}\n.pd div{position:absolute;top:790.4pt}\n.pd div span{display:block;position:relative;height:14pt}\n.pd div span+span::before{top:-.9pt}\n.pd .p1{left:28.35pt}.pd .p2{left:125.72pt}.pd .p3{left:222.98pt}\n.pd i{position:absolute;top:804.4pt}\n.pd .pn1{right:87.6pt}.pd .pn2{left:513.08pt}\n.pd .pnt{left:510.68pt;top:807.4pt;height:8pt;border-left:.4pt solid #1d1d1b}\n.lg{position:absolute;left:542.2pt;top:606pt;width:25.2pt;height:146.6pt;overflow:visible}\n#sub-logo .L{fill:#1d1d1b}#sub-logo .g{fill:#9d9d9c}#sub-logo .G{opacity:.5}\n/* signatures communes aux variantes : « Lieu, date | Signature, tampon » sur un même filet */\n.sig{display:grid;grid-template-columns:1fr 1fr;column-gap:16pt;line-height:11.5pt}\n.sig>div>span{display:block}\n.sig .lb{font-size:7.5pt;font-weight:400;text-transform:uppercase;margin-bottom:2.5pt}\n.sig .ec{height:42pt;border-bottom:.5pt solid #1d1d1b}\n.sig .lg2{display:grid;grid-template-columns:40% 1fr;font-size:7pt;color:#706F6F;line-height:11pt}\n/* ── variante 4 : deux colonnes ── */\n.v4 .cg{position:absolute;left:28.35pt;width:176.65pt;top:100.5pt;border-top:1pt solid #1d1d1b}\n.v4 .cd{position:absolute;left:222.98pt;width:287.7pt;top:100.5pt}\n.v4 .rb{padding:6pt 0 6pt;line-height:11.5pt}\n.v4 .rb+.rb{border-top:.5pt solid #d8d8d4}\n.v4 .r.i{color:#706F6F}\n.v4 .rb span{display:block}\n.v4 .rb .lb{font-size:7.5pt;font-weight:400;text-transform:uppercase;margin-bottom:2pt}\n.v4 .rb .gd{font-weight:300;font-size:15pt;line-height:19pt;letter-spacing:-.01em}\n.v4 .rb .et{font-size:7.5pt;font-weight:400;color:#BD1E42;text-transform:uppercase;margin-top:2pt}\n.v4 .rb .et::before{content:\"\";display:inline-block;width:5pt;height:5pt;background:#BD1E42;margin-right:4pt;vertical-align:.2pt}\n.v4 .rb .mm{text-align:right;padding-right:2pt}\n.v4 .rb .par{line-height:10.5pt;text-align:justify;hyphens:auto;-webkit-hyphens:auto}\n.v4 .r,.v4 .bd{display:grid;grid-template-columns:minmax(0,1fr) auto 76pt;padding:0 2pt;white-space:nowrap;margin:0 -2pt}\n.v4 .r{height:15pt;line-height:14.5pt;border-bottom:.5pt solid #d8d8d4}\n.v4 .x,.v4 .m{text-align:right}\n.v4 .r .x{color:#706F6F}\n.v4 .r.p{font-weight:700;border-bottom:.75pt solid #003346}\n.v4 .r.q{font-weight:400;border-bottom:.75pt solid #003346}\n.v4 .r.p .x,.v4 .r.q .x{color:inherit}\n.v4 .r.w{font-weight:400}\n.v4 .rt{padding-left:7pt}\n.v4 .bd{height:16pt;line-height:16pt;background:#003346;color:#fff;font-weight:400}\n.v4 .bd.t{font-weight:700}\n.v4 .bas{position:absolute;left:222.98pt;width:287.7pt;top:675pt}\n.v4 .sig.nu .ec{height:52pt}\n.v4 .sig.nu .nm{display:none}";
const PAGES=[['Bon de paiement',"<div class=\"pg v4\"><div class=\"tt\"><b>Bon de paiement</b><span>99TST - Immeuble Les Exemples</span><span class=\"g\">Cully - 16 septembre 2026</span></div><div class=\"cg\"><div class=\"rb\"><span class=\"lb\">Bon de paiement</span><span class=\"gd\">99TST.BOP.037</span><span class=\"et\">Facture finale</span></div><div class=\"rb\"><span class=\"lb\">CFC</span><span class=\"nm\">224 Couverture</span></div><div class=\"rb\"><span class=\"lb\">Entreprise</span><span class=\"nm\">Toiture Exemple SA</span><span>Rue de l’Essai 4</span><span>1000 Exempleville</span></div><div class=\"rb\"><span class=\"lb\">Banque, clearing</span><span class=\"nm\">Banque Exemple SA</span></div><div class=\"rb\"><span class=\"lb\">Compte, ccp</span><span class=\"nm\">CH00 0000 0000 0000 0000 0</span></div><div class=\"rb\"><span class=\"lb\">Maître de l’ouvrage</span><span class=\"nm\">Fondation Exemple</span><span>Rue de l’Essai 1</span><span>1000 Exempleville</span></div><div class=\"rb\"><span class=\"lb\">Architecte</span><span class=\"nm\">Substances Architectes Sàrl</span><span>Rue de la Gare 12</span><span>1096 Cully</span></div></div><div class=\"cd\"><div class=\"bd\"><span>Désignation</span><span class=\"x\">Date</span><span class=\"m\">Montant CHF</span></div><div class=\"r \"><span>Montant TTC selon contrat ou devis</span><span class=\"x\"></span><span class=\"m\">178'200.00</span></div><div class=\"r \"><span>Travaux supplémentaires</span><span class=\"x\"></span><span class=\"m\">6'551.55</span></div><div class=\"r \"><span>Avenants</span><span class=\"x\"></span><span class=\"m\">0.00</span></div><div class=\"r p\"><span>Total Brut</span><span class=\"x\"></span><span class=\"m\">184'751.55</span></div><div class=\"r w\"><span>Récapitulatif des paiements</span><span class=\"x\"></span><span class=\"m\"></span></div><div class=\"r \"><span><span class=\"rt\">acompte 1</span></span><span class=\"x\">12.03.2026</span><span class=\"m\">-38'000.00</span></div><div class=\"r \"><span><span class=\"rt\">acompte 2</span></span><span class=\"x\">16.04.2026</span><span class=\"m\">-46'500.00</span></div><div class=\"r \"><span><span class=\"rt\">acompte 3</span></span><span class=\"x\">21.05.2026</span><span class=\"m\">-42'000.00</span></div><div class=\"r \"><span><span class=\"rt\">acompte 4</span></span><span class=\"x\">25.06.2026</span><span class=\"m\">-38'500.00</span></div><div class=\"r \"><span><span class=\"rt\">acompte 5</span></span><span class=\"x\"></span><span class=\"m\">0.00</span></div><div class=\"bd t\"><span>Présent paiement à régler</span><span class=\"x\">Facture finale · 14.09.2026</span><span class=\"m\">19'751.55</span></div><div class=\"r \"><span>Prévision solde TTC à valoir</span><span class=\"x\"></span><span class=\"m\">0.00</span></div></div><div class=\"bas\"><div class=\"sig nu\"><div><span class=\"lb\">L’architecte</span><span class=\"nm\"></span><div class=\"ec\"></div><div class=\"lg2\"><span>Lieu, date</span><span>Signature, tampon</span></div></div><div><span class=\"lb\">Le maître de l’ouvrage</span><span class=\"nm\"></span><div class=\"ec\"></div><div class=\"lg2\"><span>Lieu, date</span><span>Signature, tampon</span></div></div></div></div><svg class=\"lg\" viewBox=\"0 0 1210 7050\" role=\"img\" aria-label=\"Substances Architectes\"><g transform=\"translate(0,7050) rotate(-90) translate(-600,-1690)\"><use href=\"#sub-logo\"/></g></svg><div class=\"pd\"><div class=\"p1\"><span>Rue de la Gare 12</span><span>CH – 1096 Cully</span></div><div class=\"p2\"><span>+41 21 711 50 50</span><span>info@substances.ch</span></div><div class=\"p3\"><span>CHE-403.117.623</span><span>CH-550.1.175.460-8</span></div><i class=\"pn1\">1</i><i class=\"pnt\"></i><i class=\"pn2\">1</i></div></div>"],['Arrêté de compte',"<div class=\"pg v4\"><div class=\"tt\"><b>Arrêté de compte</b><span>99TST - Immeuble Les Exemples</span><span class=\"g\">Cully - 7 septembre 2026</span></div><div class=\"cg\"><div class=\"rb\"><span class=\"lb\">Arrêté de compte</span><span class=\"gd\">99TST.ARC.004</span><span class=\"et\">Facture finale</span></div><div class=\"rb\"><span class=\"lb\">CFC</span><span class=\"nm\">224 Couverture</span></div><div class=\"rb\"><span class=\"lb\">Entreprise</span><span class=\"nm\">Toiture Exemple SA</span><span>Rue de l’Essai 4</span><span>1000 Exempleville</span></div><div class=\"rb\"><span class=\"lb\">Architecte</span><span class=\"nm\">Substances Architectes Sàrl</span><span>Rue de la Gare 12</span><span>1096 Cully</span></div><div class=\"rb\"><span class=\"lb\">Certificat de garantie d’assurance</span><span class=\"mm\">184'751.55</span><span class=\"mm\">18'475.15</span></div><div class=\"rb\"><span class=\"lb\">Déclaration</span><p class=\"par\">Cet arrêté de compte est reconnu comme complet et définitif par l’entreprise; laquelle renonce à toute action juridique ayant trait à ce contrat ou à ses travaux supplémentaires. L’entreprise déclare avoir remis toutes les factures relatives aux travaux précités. Le solde ci-dessus sera versé à l’entreprise; sur présentation du certificat de garantie d’assurance et du présent arrêté de compte daté et signé.</p></div></div><div class=\"cd\"><div class=\"bd\"><span>Désignation</span><span class=\"x\">Taux</span><span class=\"m\">Montant CHF</span></div><div class=\"r i\"><span>Montant TTC selon contrat ou devis</span><span class=\"x\"></span><span class=\"m\">178'200.00</span></div><div class=\"r \"><span>Montant adjugé</span><span class=\"x\"></span><span class=\"m\">172'500.00</span></div><div class=\"r \"><span>Devis</span><span class=\"x\"></span><span class=\"m\">0.00</span></div><div class=\"r \"><span>Travaux supplémentaires</span><span class=\"x\"></span><span class=\"m\">6'350.00</span></div><div class=\"r p\"><span>Total Brut</span><span class=\"x\"></span><span class=\"m\">178'850.00</span></div><div class=\"r \"><span>Rabais</span><span class=\"x\">2.0 %</span><span class=\"m\">-3'577.00</span></div><div class=\"r \"><span>Escompte</span><span class=\"x\">2.0 %</span><span class=\"m\">-3'505.46</span></div><div class=\"r p\"><span>Montant total des travaux HT</span><span class=\"x\"></span><span class=\"m\">171'767.54</span></div><div class=\"r \"><span>Participation au prorata</span><span class=\"x\">0.5 %</span><span class=\"m\">-858.84</span></div><div class=\"r \"><span>Divers pour arrondi</span><span class=\"x\"></span><span class=\"m\">-0.70</span></div><div class=\"r p\"><span>Montant net HT</span><span class=\"x\"></span><span class=\"m\">170'908.00</span></div><div class=\"r \"><span>TVA</span><span class=\"x\">8.1 %</span><span class=\"m\">13'843.55</span></div><div class=\"r q\"><span>Montant net TTC</span><span class=\"x\"></span><span class=\"m\">184'751.55</span></div><div class=\"r \"><span>Acomptes payés à ce jour</span><span class=\"x\"></span><span class=\"m\">-165'000.00</span></div><div class=\"r \"><span>Acomptes en attente</span><span class=\"x\"></span><span class=\"m\">0.00</span></div><div class=\"bd t\"><span>Solde TTC à valoir</span><span class=\"x\">Facture finale</span><span class=\"m\">19'751.55</span></div></div><div class=\"bas\"><div class=\"sig nu\"><div><span class=\"lb\">L’architecte</span><span class=\"nm\"></span><div class=\"ec\"></div><div class=\"lg2\"><span>Lieu, date</span><span>Signature, tampon</span></div></div><div><span class=\"lb\">L’entreprise</span><span class=\"nm\"></span><div class=\"ec\"></div><div class=\"lg2\"><span>Lieu, date</span><span>Signature, tampon</span></div></div></div></div><svg class=\"lg\" viewBox=\"0 0 1210 7050\" role=\"img\" aria-label=\"Substances Architectes\"><g transform=\"translate(0,7050) rotate(-90) translate(-600,-1690)\"><use href=\"#sub-logo\"/></g></svg><div class=\"pd\"><div class=\"p1\"><span>Rue de la Gare 12</span><span>CH – 1096 Cully</span></div><div class=\"p2\"><span>+41 21 711 50 50</span><span>info@substances.ch</span></div><div class=\"p3\"><span>CHE-403.117.623</span><span>CH-550.1.175.460-8</span></div><i class=\"pn1\">1</i><i class=\"pnt\"></i><i class=\"pn2\">1</i></div></div>"]];
VIEWS['mq-bon-arrete-4']={ render(m){
  nxPage(m,'<div class="sg-split">'+sgIntro('Archives · Maquettes','Bon de paiement et arrêté de compte · Deux colonnes','Variante 4 des maquettes du 14.11.2026, gardée pour plus tard : à gauche qui et quoi (document, CFC, entreprise, banque, parties), à droite le décompte sur bande bleu nuit et les signatures. Maquette avec des données d’exemple : rien n’est lu ni enregistré. Le dessin en place est la variante 2, « Grand chiffre ». Un clic sur une page l’agrandit.')+'<div id="sgmq4-h"></div></div>');
  const host=m.querySelector('#sgmq4-h'); if(!host||!host.attachShadow) return; const sh=host.attachShadow({mode:'open'});
  const logo=(typeof SG_LOGO==='string'?(/<svg[^>]*>([\s\S]*)<\/svg>/.exec(SG_LOGO)||[])[1]:'')||'';
  sh.innerHTML='<style>:host{display:block}.mq4{display:flex;flex-wrap:wrap;gap:26px;justify-content:center;align-items:flex-start;background:#eeeeeb;padding:26px 22px;margin-top:14px}'
    +'.mq4 figure{margin:0;cursor:zoom-in}.mq4 figure.grand{cursor:zoom-out}.mq4 figcaption{font:400 12px/1.4 var(--s-font);letter-spacing:.08em;text-transform:uppercase;color:#706F6F;margin-bottom:8px}'
    +'.mq4 .pg{zoom:.62;box-shadow:0 0 0 1px #cfcfc9,0 6px 22px rgba(0,0,0,.10)}.mq4 figure.grand .pg{zoom:1.25}'+CSS+'</style>'
    +'<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><g id="sub-logo">'+logo+'</g></defs></svg>'
    +'<div class="mq4">'+PAGES.map(([t,h])=>'<figure><figcaption>'+t+'</figcaption>'+h+'</figure>').join('')+'</div>';
  sh.addEventListener('click',e=>{ const f=e.target&&e.target.closest?e.target.closest('figure'):null; if(!f) return; f.classList.toggle('grand'); if(f.classList.contains('grand')) f.scrollIntoView({block:'start'}); }); } };
})();

/* ═══ AFFAIRE DE TRAVAIL 99TST — MODULES 30, 50, 70 : CONTRATS, AVENANT, FACTURES (04.11.2026) ═══
   Tout passe par le vrai formulaire du cadre Facturation (rapport 3 § 7) : montants, versions et detail sont ceux de l'app. Rien dans DS : sa_contrats et
   sa_factures5 du localStorage, retirés par le purgeur de ce fichier (les contrats au code REF.code et leurs factures).
   30 : faisabilité signée, variante annulée, mandat v1 signé, expertise envoyée non signée. hht et httc du mandat contrôlés contre REF (boucle § 1.3 si l'écart vient de CFC 291).
   50 : avenant n° 1 au mandat, signé. À jouer après les devis (ordre du rapport 9 § 6).
   70 : factures de REF.factures dans l'ordre, chacune avec son paiement ou son statut ; notes de frais en JSON ; faisabilité terminée ; _validation.

   Notes de frais : posées À LEUR PLACE dans la suite, pas à la fin. calcF déduit des frais de la facture suivante tout _fttc antérieur (totalFacc) : une note ajoutée après coup
   donnerait un montant enregistré ≠ montant du PDF. Elle reprend les % de la facture précédente, comme les notes du seed : avec phases:{} son PDF, déjà sans modèle, sortirait à -400 000.
   Conséquence à montrer à Paulo : AC07 et AC12 ont un _fttc négatif (les notes de frais avancent sur les 3 % de frais du contrat) ; frais facturés = frais contractuels, à 98.5 %.

   Validation, en local (sans serveur) : nx-valider montre les chiffres « 1 à valider, 1 refusé » et un message, jamais la liste (sg3_plus.js, !bureau). Ce qui se voit :
   Cockpit ▸ À traiter : « Contrats et factures à valider » (AC12) et « Refusés par l'administrateur » avec le motif (expertise : par = compte courant, seul cas affiché) ;
   étiquettes « À valider » et « Refusé » dans les listes de Facturation. État valide : champ seulement, aucun écran ne l'affiche.

   Ajoute à ctx :
   ctx.contrats   {faisa, mandat, variante, expertise} = identifiants Facturation
   ctx.factures   {'<numéro de facture>': identifiant Facturation} */
(function(){
const A=window.AT;

/* ── mise en forme des textes ── */
const MOIS=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const dLong=iso=>{ const [y,m,d]=iso.split('-').map(Number); return (d===1?'1er':d)+' '+MOIS[m-1]+' '+y; };
const dMois=iso=>MOIS[+iso.slice(5,7)-1]+' '+iso.slice(0,4);
const dFr=iso=>iso.split('-').reverse().join('.');
const periode=(du,au)=>du.slice(0,4)===au.slice(0,4)?MOIS[+du.slice(5,7)-1]+' à '+dMois(au):dMois(du)+' à '+dMois(au);
const mille=n=>String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
const html=(...p)=>p.map(t=>'<div>'+t.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</div>').join('<div><br></div>');
const rc=d=>{ const x=A.REF.recit.find(r=>r.d===d); if(!x) throw new Error('récit : '+d+' absent'); return x.t; };
const quand=re=>{ const x=A.REF.recit.find(r=>re.test(r.t)); if(!x) throw new Error('récit : '+re+' absent'); return x.d; };
const minus=t=>t.charAt(0).toLowerCase()+t.slice(1);
/* planning graphique : mois 1…n depuis m0 ; une barre qui dépasse est coupée à n */
const moisDe=(iso,m0)=>{ const [y,m]=iso.split('-').map(Number), [y0,m1]=m0.split('-').map(Number); return (y-y0)*12+m-m1+1; };
const barre=(g,lbl,du,au,red)=>({t:'bar',lbl,a:Math.max(1,moisDe(du,g.m0)),b:Math.min(g.n,moisDe(au,g.m0)),red:!!red});

/* ── fonctions évaluées DANS le cadre Facturation (par A.appel : texte de la fonction, aucune variable d'ici) ── */
const FX_PURGE=function(S){ const ids=new Set(contrats.filter(c=>c.affaire===S.code).map(c=>c.id)), n0=contrats.length+factures.length;
  contrats=contrats.filter(c=>c.affaire!==S.code);
  factures=factures.filter(f=>!ids.has(f.contrat_id)&&f.cl_affaire!==S.code&&!String(f.num||'').includes('_'+S.code+'.'));
  persist(); return n0-contrats.length-factures.length; };

const FX_CONTRAT=async function(S){
  const att=ms=>new Promise(r=>setTimeout(r,ms)), coche=(i,v)=>{ const e=document.getElementById(i); if(e) e.checked=!!v; };
  const apercu=window.refreshOffrePreview; window.refreshOffrePreview=async()=>{};   /* l'aperçu relit le formulaire en parallèle : coupé pendant la saisie */
  try{
    resetCalcHono(true); newContratCalc(); await att(150);
    ['ch_chk_ord','ch_chk_no','ch_chk_expertise','ch_chk_faisa'].forEach(i=>coche(i,false));
    ['ch_hide_estim','ch_hide_planning','ch_show_planning','ch_hide_rabais','ch_hide_arrondi','ch_chno_detail','ch_chno_totalonly'].forEach(i=>coche(i,false)); coche('ch_modecalc_on',true);
    const co=document.getElementById('ch_conditions'), mo=document.getElementById('ch_modecalc'); delete co.dataset.edited; delete mo.dataset.edited;
    CH_NO=(S.nonord||[]).map(l=>Object.assign({lbl:'',heures:0,hUnit:'h',prix:0,pUnit:'Frs/h',amt:0,com:'',option:false,hideDetail:false,sousTitre:false,titreIdx:null,prixManual:true},l));
    CH_NO_TITRES=[]; buildChno();
    coche('ch_chk_ord',S.types.includes('ord')); coche('ch_chk_no',S.types.includes('no')); coche('ch_chk_faisa',S.types.includes('faisa')); coche('ch_chk_expertise',S.types.includes('expertise'));
    Object.entries(S.champs).forEach(([k,v])=>sv(k,v));
    chOnExpertiseToggle(); updChSections(); chModecalcType();
    rtSetValue('ch_modecalc',chModecalcDefault());                /* expertise : chModecalcType laisse le texte du contrat précédent */
    rtSetValue('ch_conditions',CH_COND_DEFAULT_HTML);
    chFraisTextSync();                                            /* le % de frais du contrat dans le texte type */
    if(S.clause||S.sansFrais){   /* texte redessiné en Light par le PDF : « … » y manque, il sortirait en blanc */
      let t=rtGetHTML('ch_conditions').replace(/…/g,'...');
      if(S.sansFrais) t=t.replace(/<div>Les frais accessoires ne font[^<]*<\/div>/,'<div>'+S.sansFrais+'</div>').replace(/<div>- Les frais accessoires[^<]*<\/div>/,'');
      if(S.clause) t+='<div><br></div>'+S.clause;
      rtSetValue('ch_conditions',t); co.dataset.edited='1'; }
    PARCELLES=S.parcelles.slice(); ECAS=S.ecas.slice(); chRenderParcEca();
    rtSetValue('ch_note_situation',S.situation||''); rtSetValue('ch_note_objectif',S.objectif||''); rtSetValue('ch_note_approche',S.approche||'');
    if(S.situation) document.getElementById('ch_note_situation').dataset.manual='1';
    SIA.forEach(ph=>ph.s.forEach(sub=>sv('ch_cc_'+sub.k,(S.phases&&S.phases[sub.k])||0)));
    planSetData(S.delais,S.reserves); if(S.gantt) planSetGantt(S.modePlan||'gantt',S.gantt);
    sv('ch_version_comment',S.commentaire||'');
    updEstimCout();
    /* rapport 9 § 1.3 : ch_cfc2 contient le CFC 291, c'est-à-dire les honoraires eux-mêmes : on boucle si le calcul s'en écarte */
    let r=updCalcHono(), h291=S.hht, tours=0;
    while(S.hht!=null&&Math.abs(r.htFinal-h291)>.005&&tours++<6){ sv('ch_cfc2',(gn('ch_cfc2')+(r.htFinal-h291)*(1+r.tva/100)).toFixed(2)); h291=r.htFinal; r=updCalcHono(); }
    await att(50); applyCalcHono(); await att(150);
    const c=contrats[contrats.length-1]; return {id:c.id,hht:c.hht,httc:c.httc,B:r.B,tours};
  } finally { window.refreshOffrePreview=apercu; } };

const FX_AVENANT=async function(S){
  const att=ms=>new Promise(r=>setTimeout(r,ms)), apercu=window.refreshOffrePreview; window.refreshOffrePreview=async()=>{};
  try{
    editContratCalc(S.id); await att(300);
    Object.entries(S.champs).forEach(([k,v])=>sv(k,v));
    if(S.situation){ rtSetValue('ch_note_situation',S.situation); document.getElementById('ch_note_situation').dataset.manual='1'; }
    sv('ch_version_comment',S.commentaire||''); updEstimCout();
    let r=updCalcHono(), h291=S.hht, tours=0;
    while(Math.abs(r.htFinal-h291)>.005&&tours++<6){ sv('ch_cfc2',(gn('ch_cfc2')+(r.htFinal-h291)*(1+r.tva/100)).toFixed(2)); h291=r.htFinal; r=updCalcHono(); }
    applyCalcHono(true); await att(150);
    const c=contrats.find(x=>x.id===S.id); c.versions[c.versions.length-1].date=S.date; persist();
    return {hht:c.hht,httc:c.httc,B:r.B,tours,versions:c.versions.length};
  } finally { window.refreshOffrePreview=apercu; } };

/* états : toujours par chSetContratFlag, qui applique les règles ; la date de signature posée est celle du jour, corrigée ici */
const FX_ETAT=function(S){
  if(S.envoye) chSetContratFlag(S.id,'envoye',true);
  if(S.signe){ chSetContratFlag(S.id,'signe',true); const c=contrats.find(x=>x.id===S.id); c.versions[c.versions.length-1].signeLe=S.signe; persist(); }
  if(S.annule) chSetContratFlag(S.id,'annule',true);
  if(S.termine) chSetContratFlag(S.id,'termine',true); };

const FX_FACTURE=async function(S){
  const att=ms=>new Promise(r=>setTimeout(r,ms)), coche=(i,v)=>{ const e=document.getElementById(i); if(e) e.checked=!!v; };
  goTab('saisie'); saisieMode=S.sansContrat?'nonordinaire':'ordinaire'; saisieSousType=''; applySaisieModeUI(); newFacture();
  sv('f_date',S.date); coche('f_num_manuel',true); toggleNumManuel();
  if(S.sansContrat){ Object.entries(S.client).forEach(([k,v])=>sv(k,v)); HL=S.hl||[]; buildHL(); onOptChange(); }
  else { sv('f_contrat',S.cid); onSelectContrat();
    SIA.forEach(ph=>ph.s.forEach(sub=>sv('ff_'+sub.k,(+((S.phases||{})[sub.k])||0).toFixed(2))));
    if(S.hl==='contrat') faFillHLFromContrat(true); }
  sv('f_num',S.num); sv('f_type',S.type); sv('f_ech_j',String(S.ech_j));
  upd_f(); const id=curFid; saveFacture();
  coche('f_num_manuel',false); toggleNumManuel();
  if(S.date_paiement) updateDatePaiement(id,S.date_paiement); else if(S.statut) updateStatut(id,S.statut);
  await att(20);
  return id; };

/* note de frais : le formulaire ne connaît pas ce type (rapport 3 § 9.2) ; montant en frais, jamais en honoraires */
const FX_NOTE=function(S){ const v={id:UID(),contrat_id:S.cid,sansContrat:false,sousType:'',cl_affaire:'',cl_projet:'',cl_nom:'',cl_adr:'',cl_loc:'',cl_resp:'',opt:{rabais:false,arrondi:false,frais:false},
    num:S.num,type:S.type,date:S.date,statut:S.statut,date_paiement:S.date_paiement,forfait:false,hl_p2:false,phases:S.phases,hl:[],ech_j:S.ech_j,ech:S.ech,
    frais:S.frais,rabais:0,tva:S.tva,ttc:0,fttc:S.montant,arr:0,acc:0,_ttc:0,_fttc:S.montant,_brut_ttc:0,_brut_fttc:S.montant};
  factures.push(v); persist(); return v.id; };

/* _validation n'a pas de fonction dans l'app : le serveur la pose, ici écrite telle qu'il l'écrit */
const FX_VALIDATION=function(S){ Object.entries(S.c).forEach(([id,v])=>{ const o=contrats.find(x=>x.id===id); if(o) o._validation=v; });
  Object.entries(S.f).forEach(([id,v])=>{ const o=factures.find(x=>x.id===id); if(o) o._validation=v; }); persist(); };

/* formulaires rendus vides : rien du dernier document ne reste à l'écran */
/* Le nom de l'affaire dans Facturation (PV de chantier et son PDF, listes, sujets de courriel) est le « projet » du PREMIER contrat de la liste (affairesAll, pvAffName).
   Le mandat passe donc devant la faisabilité : sinon tous les PV de l'immeuble s'intitulent « Étude de faisabilité ». */
const FX_ORDRE=function(S){ const i=contrats.findIndex(c=>c.id===S.id), j=contrats.findIndex(c=>c.affaire===S.code); if(i>j&&j>=0){ const [c]=contrats.splice(i,1); contrats.splice(j,0,c); persist(); } return pvAffName(S.code); };
const FX_FIN=function(){ resetCalcHono(true); saisieMode='ordinaire'; saisieSousType=''; applySaisieModeUI(); newFacture(); persist(); };

A.purgeurs.push(async()=>{ const n=await A.appel(FX_PURGE,{code:A.REF.code}); if(n) A.log('purge : Facturation',n,'contrats et factures'); });

/* ── textes des contrats, d'après REF : l'offre parle au futur, à sa date ── */
const SIA_PHASES=(R,...cles)=>Object.fromEntries(cles.map(k=>[k,R.sia[k]]));
/* m2 et m3 : ² et ³ manquent à la police Light du PDF */
const PARCELLE=R=>`la parcelle n° ${R.parcelle} de la commune d’${R.lieu} (${mille(R.surfaceParcelle)} m2, ${minus(R.zone)}), ${R.adresse.rue}`;
const SANS_FRAIS='Aucun frais accessoire n’est facturé pour la présente offre : ils sont compris dans les honoraires.';

function texteFaisa(R){ const G={m0:R.faisabilite.du.slice(0,7),n:moisDe(R.faisabilite.au,R.faisabilite.du.slice(0,7))}, Cf=R.calendrier.faisa, va=quand(/^Trois variantes/), pres=quand(/variante B retenue/);
  return {
    situation:html(`La ${R.mo.societe} est propriétaire de ${PARCELLE(R)}. Elle envisage la ${minus(R.titreLong)}.`,
      `Programme exprimé lors de la première rencontre du ${dLong(R.calendrier.debutAffaire)} : ${rc(R.calendrier.debutAffaire).split(' : ')[1]}`),
    objectif:html('Établir ce que le règlement communal et les restrictions de droit public autorisent sur la parcelle, vérifier que le programme y trouve sa place, et donner au conseil de fondation les éléments pour choisir une variante avant d’engager un mandat d’architecte.'),
    approche:html('Analyse du site, du règlement communal et de l’extrait RDPPF. Trois variantes volumétriques comparées sur l’implantation, la hauteur à la corniche, les surfaces de plancher, le nombre de logements et l’ordre de grandeur du coût.',
      'Présentation au conseil de fondation, puis remise d’une fiche de faisabilité qui résume les contraintes et la variante retenue.'),
    delais:[['Analyse du site et du règlement',periode(R.faisabilite.du,va)],['Variantes volumétriques',periode(va,pres)],['Présentation au conseil de fondation',dMois(pres)],['Remise de la fiche de faisabilité',dLong(Cf.factureFinale)]],
    gantt:Object.assign(G,{rows:[{t:'sec',lbl:'Étude de faisabilité'},barre(G,'Analyse du site et du règlement',R.faisabilite.du,va),barre(G,'Variantes volumétriques',va,pres),barre(G,'Présentation au conseil de fondation',pres,pres,true),barre(G,'Fiche de faisabilité',pres,Cf.factureFinale)]})}; }

function texteMandat(R,ctx){ const Cal=R.calendrier, P=Object.fromEntries(R.phases.map(x=>[x.n,x])), G={m0:P[31].du.slice(0,7),n:24}, cdp=ctx.staff.cdp, dt=ctx.staff.dt;
  return {
    situation:html(`Le présent mandat fait suite à l’étude de faisabilité remise le ${dLong(Cal.faisa.factureFinale)}. Le conseil de fondation a retenu la variante B, un plot avec attique, lors de la présentation du ${dLong(quand(/variante B retenue/))}, et a confirmé l’attique le ${dLong(Cal.variante.annulee)}.`,
      `L’immeuble s’implante sur ${PARCELLE(R)}. Le volume est estimé à ${mille(R.volume)} m3 pour ${mille(R.surface)} m2 de surface de plancher.`),
    objectif:html(`Réaliser la ${minus(R.titreLong)} à loyers modérés, dans le budget fixé par le conseil de fondation, avec des matériaux durables et un entretien simple pour le gérant.`,
      'Le mandat couvre l’ensemble des prestations ordinaires de l’architecte selon la norme SIA 102, de l’avant-projet à la mise en service.'),
    approche:html(`${cdp.nom} conduit le projet comme cheffe de projet ; ${dt.nom} assure la direction des travaux dès l’appel d’offres. Une séance avec le maître de l’ouvrage clôt chaque phase partielle : l’avancement, le coût et les délais y sont validés avant de poursuivre.`,
      'Les mandataires spécialisés (ingénieur civil, ingénieurs CVSE, géomètre, physicien du bâtiment, géologue) sont mandatés directement par le maître de l’ouvrage et coordonnés par l’architecte.'),
    clause:html('Les honoraires de l’étude de faisabilité, facturés séparément, ne sont pas déduits du présent mandat.'),
    modePlan:'liste',   /* au-delà de 9 mois, l'axe du graphique est illisible dans le PDF (étiquettes superposées) : la liste y est imprimée, le graphique reste pour Planning ▸ Créer */
    delais:[...[31,32].map(n=>[P[n].lib,periode(P[n].du,P[n].au)]),['Dépôt de la demande de permis',dMois(Cal.permis.depot)],['Mise à l’enquête publique',dMois(Cal.permis.enqD)],
      ['Permis de construire',dMois(Cal.permis.decision)],['Début des travaux',dMois(Cal.debutTravaux)],['Réception de l’ouvrage',dMois(Cal.reception)]],
    gantt:Object.assign(G,{rows:[{t:'sec',lbl:'Études'},barre(G,'Avant-projet',P[31].du,P[31].au),barre(G,'Projet de l’ouvrage',P[32].du,P[32].au),barre(G,'Demande d’autorisation',P[33].du,Cal.permis.decision,true),
      {t:'sec',lbl:'Préparation de l’exécution'},barre(G,'Appels d’offres',P[41].du,P[41].au),barre(G,'Projet d’exécution',P[51].du,P[51].au),
      {t:'sec',lbl:'Chantier'},barre(G,`Travaux, réception en ${dMois(Cal.reception)}`,Cal.debutTravaux,Cal.reception)]})}; }

function texteVariante(R){ return {
    situation:html(`À la demande du trésorier de la fondation, la présente offre chiffre une variante de l’immeuble sans attique, limitée aux études jusqu’à la demande d’autorisation, sur ${PARCELLE(R)}.`),
    objectif:html('Mesurer l’économie obtenue en renonçant au dernier niveau, avant la décision du conseil de fondation sur le mandat complet.'),
    approche:html('Reprise de la variante B sans son attique : plans, façades et estimation adaptés, sans nouvelle étude d’implantation. Le rabais et le montant forfaitaire ne valent que pour cette variante.'),
    delais:[['Validation par le conseil de fondation',dMois(R.calendrier.mandat.signe)],['Dépôt de la demande de permis',dMois(R.calendrier.permis.depot)]]}; }

function texteExpertise(R){ const P52=R.phases.find(x=>x.n===52); return {
    situation:html(`Le chantier de l’${minus(R.titre)} a débuté le ${dLong(R.calendrier.debutTravaux)}. Le rocher rencontré dans la fouille nord a imposé le brise-roche, le minage étant interdit. À la demande de la ${R.mo.societe}, un constat de l’état des façades de l’immeuble voisin est proposé.`),
    objectif:html('Établir un constat daté des façades (fissures, joints, enduits, tablettes) pour distinguer l’état existant d’éventuels dégâts de chantier.'),
    approche:html(`Visite sur place avec le propriétaire, relevé photographique, puis rapport illustré remis au maître de l’ouvrage, avant la fin de l’exécution de l’ouvrage (${dMois(P52.au)}).`),
    delais:[['Visite sur place','dans les 3 semaines dès la signature'],['Remise du rapport illustré','3 semaines après la visite']]}; }

/* ── 30 : contrats ── */
A.mod(30,'contrats','Contrats d’honoraires',async ctx=>{
  const R=A.REF, K=R.contrats, Cal=R.calendrier, cdp=ctx.staff.cdp;
  const commun={ch_affaire:R.code,ch_lieu:R.lieu,ch_resp:cdp.nom,ch_formule:'Mesdames, Messieurs,',ch_nom:ctx.mo.nom,ch_adr:R.mo.rue,ch_loc:R.mo.npa+' '+R.mo.loc,
    ch_padr:R.adresse.rue,ch_ploc:R.adresse.npa+' '+R.adresse.loc,ch_h:String(R.tarifHoraire),ch_tarif_moyen:String(R.tarifHoraire)};
  const bien={parcelles:[R.parcelle],ecas:[R.eca]};
  ctx.contrats={}; ctx.factures={};

  /* faisabilité : prestations au temps, sans prestations ordinaires ; terminée au module 70, après sa facture */
  const tF=texteFaisa(R);
  let r=await A.appel(FX_CONTRAT,{...bien,...tF,sansFrais:SANS_FRAIS,types:['faisa'],nonord:K.faisa.lignes,commentaire:'Offre d’étude de faisabilité',
    champs:{...commun,ch_projet:K.faisa.projet,ch_date:Cal.faisa.offre,ch_statut_contrat:K.faisa.statut,ch_rabais:'0',ch_tva:String(K.faisa.tva),ch_forfait_frais_pct:String(K.faisa.frais),ch_modecalc_type:K.faisa.mode}});
  ctx.contrats.faisa=r.id; const attendu=K.faisa.lignes.reduce((s,l)=>s+l.amt,0);
  if(Math.abs(r.hht-attendu)>.005) throw new Error('faisabilité : hht '+r.hht+' ≠ '+attendu);
  await A.appel(FX_ETAT,{id:r.id,envoye:true,signe:Cal.faisa.signe});

  /* variante : forfait et rabais, annulée sans avoir été signée ; sans l'attique, le bâtiment coûte 10 % de moins que la variante retenue */
  const V=K.variante, v1=K.mandat.v1, tV=texteVariante(R);
  r=await A.appel(FX_CONTRAT,{...bien,...tV,types:['ord'],phases:SIA_PHASES(R,'431a','431b','432a','432b','432c','433'),commentaire:`Variante non retenue : le conseil de fondation confirme l’attique le ${dFr(Cal.variante.annulee)}`,
    champs:{...commun,ch_projet:V.projet,ch_date:Cal.variante.offre,ch_statut_contrat:V.statut,ch_cfc1:String(v1.ch_cfc1),ch_cfc2:(v1.ch_cfc2*.9).toFixed(2),ch_cfc4:String(v1.ch_cfc4),ch_cfc5:String(v1.ch_cfc5),
      ch_rabais:String(V.rabais),ch_tva:String(V.tva),ch_forfait_frais_pct:String(V.frais),ch_modecalc_type:V.mode,ch_forfait_mnt:String(V.forfait)}});
  ctx.contrats.variante=r.id;
  await A.appel(FX_ETAT,{id:r.id,envoye:true,annule:true});

  /* mandat, version 1 : montants du rapport 9 § 1.3, attendus à l'identique */
  const M=K.mandat, tM=texteMandat(R,ctx);
  r=await A.appel(FX_CONTRAT,{...bien,...tM,types:['ord'],phases:R.sia,hht:M.v1.hht,commentaire:'Offre initiale : mandat complet, variante B',
    champs:{...commun,ch_projet:M.projet,ch_projet_court:M.court,ch_date:Cal.mandat.offre,ch_statut_contrat:M.statut,ch_cfc1:String(M.v1.ch_cfc1),ch_cfc2:M.v1.ch_cfc2.toFixed(2),ch_cfc4:String(M.v1.ch_cfc4),ch_cfc5:String(M.v1.ch_cfc5),
      ch_cat:'IV',ch_ing_pct:'2.8',ch_cvse_pct:'1.05',ch_geom_pct:'0.35',ch_rabais:'0',ch_tva:String(M.tva),ch_forfait_frais_pct:String(M.frais),ch_modecalc_type:M.mode}});
  ctx.contrats.mandat=r.id;
  if(r.tours) A.log('mandat v1 : boucle CFC 291,',r.tours,'tours');
  if(Math.abs(r.hht-M.v1.hht)>.005||Math.abs(r.httc-M.v1.httc)>.005) throw new Error('mandat v1 : calcul '+[r.hht,r.httc]+' ≠ REF '+[M.v1.hht,M.v1.httc]+' : ref.js à mettre à jour');
  if(r.B!==M.v1.B) A.log('mandat v1 : B = '+r.B+' dans l’app, '+M.v1.B+' dans REF ; honoraires identiques');
  await A.appel(FX_ETAT,{id:r.id,envoye:true,signe:Cal.mandat.signe});

  /* expertise : envoyée, jamais signée ; hors de « Contrats honoraires », dans À traiter après 30 jours */
  const E=K.expertise, tE=texteExpertise(R);
  r=await A.appel(FX_CONTRAT,{...bien,...tE,sansFrais:SANS_FRAIS,types:['expertise'],nonord:E.lignes,commentaire:'Offre d’expertise envoyée au maître de l’ouvrage',
    champs:{...commun,ch_projet:E.projet,ch_date:Cal.expertise.offre,ch_statut_contrat:E.statut,ch_rabais:'0',ch_tva:String(E.tva),ch_forfait_frais_pct:String(E.frais),ch_h:String(E.h),ch_tarif_moyen:String(E.h),ch_modecalc_type:E.mode}});
  ctx.contrats.expertise=r.id;
  await A.appel(FX_ETAT,{id:r.id,envoye:true});
  A.log('contrats : faisabilité signée, variante annulée, mandat '+M.v1.hht+' HT signé, expertise envoyée'); });

/* ── 50 : avenant n° 1, signé ── */
A.mod(50,'avenant','Avenant n° 1 au mandat',async ctx=>{
  const R=A.REF, M=R.contrats.mandat, Cal=R.calendrier.mandat, t=texteMandat(R,ctx);
  const r=await A.appel(FX_AVENANT,{id:ctx.contrats.mandat,date:Cal.avenant,hht:M.v2.hht,commentaire:`Avenant n° 1 : coût de l’ouvrage adapté au devis général validé le ${dFr(R.calendrier.devisValide)}`,
    situation:html(`Avenant n° 1 du ${dLong(Cal.avenant)} : ${minus(rc(R.calendrier.devisValide))} Les honoraires passent de ${mille(M.v1.hht)} à ${mille(M.v2.hht)} CHF HT.`)+'<div><br></div>'+t.situation,
    champs:{ch_cfc1:String(M.v2.ch_cfc1),ch_cfc2:M.v2.ch_cfc2.toFixed(2),ch_cfc4:String(M.v2.ch_cfc4),ch_cfc5:String(M.v2.ch_cfc5)}});
  if(r.tours) A.log('avenant : boucle CFC 291,',r.tours,'tours');
  if(Math.abs(r.hht-M.v2.hht)>.005||Math.abs(r.httc-M.v2.httc)>.005) throw new Error('avenant : calcul '+[r.hht,r.httc]+' ≠ REF '+[M.v2.hht,M.v2.httc]+' : ref.js à mettre à jour');
  if(r.B!==M.v2.B) A.log('avenant : B = '+r.B+' dans l’app, '+M.v2.B+' dans REF ; honoraires identiques');
  await A.appel(FX_ETAT,{id:ctx.contrats.mandat,envoye:true,signe:Cal.avenantSigne});
  A.log('avenant : mandat porté à '+r.hht+' HT, '+r.versions+' versions'); });

/* ── 70 : factures ── */
A.mod(70,'factures','Factures, paiements, validation',async ctx=>{
  const R=A.REF, K=R.contrats, C=ctx.contrats, cdp=ctx.staff.cdp;
  const client={f2_affaire:R.code,f2_projet:R.titre,f2_nom:ctx.mo.nom,f2_adr:R.mo.rue,f2_loc:R.mo.npa+' '+R.mo.loc,f2_resp:cdp.nom,f2_tva:String(R.tva)};
  let phasesCumul={};
  for(const f of R.factures){ const ech_j=f.ech_j||20; let id;
    if(f.noteFrais){ const k=K[f.contrat];
      id=await A.appel(FX_NOTE,{cid:C[f.contrat],num:f.num,type:f.type,date:f.date,statut:f.paye?'Payée':f.statut,date_paiement:f.paye||'',montant:f.montant,ech_j,ech:A.plus(f.date,ech_j),frais:k.frais,tva:k.tva,phases:phasesCumul}); }
    else { const S={num:f.num,type:f.type,date:f.date,ech_j,date_paiement:f.paye||null,statut:f.statut||null};
      if(f.sansContrat) Object.assign(S,{sansContrat:true,client,hl:f.lignes});
      else Object.assign(S,{cid:C[f.contrat],phases:f.phases,hl:f.phases?null:'contrat'});
      id=await A.appel(FX_FACTURE,S); if(f.phases) phasesCumul=f.phases; }
    ctx.factures[f.num]=id; }
  await A.appel(FX_ETAT,{id:C.faisa,termine:true});

  /* validation : circuit tel que le serveur l'écrit (par et decision_par = USERID) ; heures de bureau inventées, dates tirées de REF */
  const T=(iso,h)=>iso+'T'+h+':00', me=ctx.me.user, ac=R.factures.filter(f=>f.contrat==='mandat'&&!f.noteFrais), attente=ac.find(f=>f.validation==='a_valider');
  const valide=(par,le,dec)=>({etat:'valide',par,le,nouveau:false,decision_par:me,decision_le:dec,motif:''});
  const Vc={[C.mandat]:valide(cdp.user,T(R.calendrier.mandat.avenant,'16:40'),T(R.calendrier.mandat.avenant,'18:05'))};
  /* par = compte courant : seul moyen de faire paraître le refus et son motif dans À traiter en local (sgValidationsATraiter) */
  const refus=A.plus(R.calendrier.expertise.offre,35);
  Vc[C.expertise]={etat:'refuse',par:me,le:T(refus,'09:20'),nouveau:false,decision_par:cdp.user,decision_le:T(A.plus(refus,1),'08:45'),
    motif:'Offre à reprendre avant toute relance : ajouter la visite de contrôle à la fin du chantier et prévoir le rapport en deux exemplaires, un pour le voisin.'};
  const Vf={[ctx.factures[attente.num]]:{etat:'a_valider',par:cdp.user,le:T(attente.date,'15:30'),nouveau:true}};
  ac.slice(ac.indexOf(attente)-3,ac.indexOf(attente)).forEach(f=>{ Vf[ctx.factures[f.num]]=valide(cdp.user,T(f.date,'11:10'),T(f.date,'14:25')); });
  await A.appel(FX_VALIDATION,{c:Vc,f:Vf});
  await A.appel(FX_ORDRE,{id:C.mandat,code:R.code});
  await A.appel(FX_FIN);
  A.log('factures : '+R.factures.length+' écrites, faisabilité terminée, validations posées'); });
})();

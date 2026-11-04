/* ═══ AFFAIRE DE TRAVAIL 99TST — MODULE 40 : CATALOGUES, ESTIMATIONS, DEVIS (04.11.2026) ═══
   Crée, d'après AT.REF :
   - le plan comptable CFC de l'affaire (copie du catalogue standard) et le catalogue d'éléments (copie du premier catalogue d'éléments de la base : données de référence) ;
   - deux calculs des coûts (costplanningdocument + costplanning) : estimation de faisabilité 2023 (TVA 7.7, cible du récit : 3,2 mio HT, sans phase) et estimation
     d'avant-projet 2024 (TVA 8.1, total TTC = CFC 1 + 2 + 4 + 5 du mandat v1, phase 31) ;
   - le devis estimatif provisoire (phase 32, mêmes totaux par groupe que le mandat v1, avant le rocher et le parking) ;
   - le devis général validé le REF.calendrier.devisValide (phase 33) : toutes les positions de REF.lots et REF.autresPositions, totaux par groupe = mandat v2.
   Contrôles : arrêt si un total s'écarte de REF. La purge des tables lourdes (non chargées au démarrage) est faite ici pour m40, m45 et m47.

   Ajoute à ctx :
   ctx.couts = { cat:{cfc, elements} (projectcatalog.ID),
                 estimations:{faisa, ap} (costplanningdocument.ID), devis:{estimatif, general} (costestimatedocument.ID),
                 E (contenu du devis général, pour l'attribution au contrôle des coûts), usager (USERID de la cheffe de projet) } */
(function(){
const A=window.AT;
const CLE_REG='affaire_travail', LOURDES=['costplanning','costestimate','costcontrol','projectcatalogpos','soumission'];

/* purge des tables lourdes : socle.js ne voit que les enregistrements chargés (DS.get) ; à une nouvelle session, elles ne le sont pas */
A.purgeurs.push(async()=>{ const m=DS.get('sg_meta',CLE_REG), T=m&&m.TABLES||{}, L=LOURDES.filter(t=>(T[t]||[]).length); if(!L.length) return;
  await DS.need(L); for(const t of L){ const ops=T[t].map(id=>/^\d+$/.test(id)?+id:id).filter(id=>DS.get(t,id)).map(id=>({t,id,val:null})); if(ops.length){ A.log('purge',t,ops.length); await A.commit(ops); } } });

const fr=iso=>iso.split('-').reverse().join('.');

/* ── lignes de calcul du devis : [commentaire, base, quantité (0 = forfait), unité, prix HT, drapeau]
   q × prix tombe sur un multiple de 50 : le TTC arrondi à 5 ct reste exact et les totaux égalent ceux du contrat.
   Le solde (ligne ajoutée d'office) ramène chaque position au montant de REF. drapeau 'a' : ajouté après le devis estimatif (rocher des sondages de mars 2024, parking du 10.06.2024). */
const LIGNES={
  '112':[['Déconstruction du hangar et des dépendances','calcul',1500,'m3',18],['Tri et évacuation des matériaux','calcul',120,'t',65]],
  '201.1':[['Fouille en pleine masse','calcul',3800,'m3',12],['Remblayage contre ouvrage','calcul',900,'m3',14],['Plus-value fouille en rocher, secteur nord','calcul',500,'m3',92,'a']],
  '211.5':[['Radier et fondations','calcul',380,'m3',390],['Murs et piliers','calcul',260,'m3',420],['Dalles et escaliers','calcul',360,'m3',370],
    ['Extension du parking de 22 à 24 places','calcul',180,'m3',400,'a'],['Radier sur rocher, secteur nord','calcul',195,'m3',400,'a']],
  '211.6':[['Murs en brique de ciment','calcul',1100,'m2',85],['Murs en brique de terre cuite','calcul',700,'m2',70],['Murs du parking agrandi','calcul',100,'m2',100,'a']],
  '221.1':[['Fenêtres bois-métal, triple vitrage','offre',420,'m2',460]],
  '224.1':[['Toiture plate et terrasses d’attique','calcul',620,'m2',95],['Dalle du parking agrandi, partie extérieure','calcul',140,'m2',100,'a']],
  '226.2':[['Isolation crépie 20 cm','calcul',1050,'m2',130],['Embrasures et tablettes','calcul',420,'m',35]],
  '228.2':[['Stores à lamelles orientables','calcul',420,'m2',115]],
  '232':[['Installation par logement','estimation',18,'p',7000],['Éclairage et prises du parking agrandi','estimation',0,'gl',6000,'a']],
  '242':[['Pompe à chaleur air-eau','offre',0,'gl',68000],['Accumulateur et régulation','estimation',0,'gl',18000]],
  '243':[['Distribution et chauffage de sol','calcul',2700,'m2',22]],
  '244':[['Ventilation double flux des logements','estimation',18,'p',2500],['Ventilation mécanique du parking agrandi','estimation',0,'gl',10000,'a']],
  '251':[['Appareils sanitaires et robinetterie','calcul',18,'p',4500],['Conduites d’eau et d’écoulement','calcul',18,'p',4000]],
  '258':[['Cuisine agencée complète','offre',18,'p',6500]],
  '261':[['Ascenseur 630 kg, 6 arrêts','offre',0,'gl',64000]],
  '271.1':[['Cloisons en plaques de plâtre','calcul',1100,'m2',65],['Enduits et lissage des plafonds','calcul',2400,'m2',20]],
  '273.0':[['Portes palières EI30','calcul',18,'p',1400],['Portes de communication','calcul',90,'p',480]],
  '281.6':[['Carrelages des salles d’eau et des communs','calcul',540,'m2',130]],
  '281.7':[['Parquet collé','calcul',1200,'m2',70]],
  '285.1':[['Peinture des murs et plafonds','calcul',5400,'m2',10]],
  '421':[['Couche végétale et semis','calcul',700,'m2',25],['Plantations et haies','estimation',0,'gl',16000]],
  '511':[['Permis de construire et enquête publique','offre',0,'gl',12000]],
  '512':[['Raccordement aux eaux et aux égouts','offre',0,'gl',14000]]};
const LIB_SOLDE={'112':'Protections et mesures particulières','201.1':'Pistes, talutage, installations de terrassement','211.5':'Installation de chantier et prestations diverses','211.6':'Linteaux, sommiers et adaptations',
  '221.1':'Portes-fenêtres d’accès aux balcons','224.1':'Relevés, ferblanterie, écoulements','226.2':'Socles et finitions','228.2':'Motorisation des séjours','232':'Tableaux, colonnes montantes, communs','242':'Mise en service et réglages',
  '243':'Collecteurs et isolation des conduites','244':'Monobloc et mise en service','251':'Batteries de distribution, buanderie, arrosage','258':'Appareils en attente de choix','261':'Mise en service et contrat d’entretien de l’année 1',
  '271.1':'Habillages et gaines techniques','273.0':'Ferme-portes et quincaillerie','281.6':'Plinthes et joints','281.7':'Plinthes','285.1':'Traitement des sous-sols','421':'Terrain de jeux, mobilier extérieur',
  '511':'Permis d’habiter, gabarits','512':'Raccordement électrique et téléréseau'};
/* descriptifs courts du devis (« Devis descriptif ») */
const DESC={
  '102':'Sondages à la pelle mécanique et forages, essais de laboratoire, rapport géotechnique.',
  '112':'Déconstruction du hangar existant et des dépendances, tri sur place, évacuation en filières autorisées avec bordereaux de suivi.',
  '201.1':'Fouille en pleine masse pour le sous-sol et le parking, rocher au nord de la parcelle dès 3.20 m, remblayage contre ouvrage, sans minage (interdit à proximité des bâtiments voisins).',
  '211.5':'Radier, murs du sous-sol, dalles, escaliers et noyau de l’ascenseur en béton armé, béton étanche pour le sous-sol.',
  '211.6':'Murs intérieurs porteurs en brique, murs de séparation des logements doublés.',
  '221.1':'Fenêtres et portes-fenêtres bois-métal, triple vitrage, valeur Uw 0,90 W/m²K, teinte selon échantillon.',
  '224.1':'Étanchéité bicouche sur isolation PUR, végétalisation extensive de la toiture et dallage sur plots des terrasses d’attique.',
  '226.2':'Isolation périphérique en laine de pierre 20 cm, crépi minéral taloché, teinte selon essai sur façade.',
  '228.2':'Stores à lamelles orientables en aluminium thermolaqué, manœuvre électrique dans les séjours.',
  '232':'Installations à courant fort et faible des 18 logements, des communs et du parking, préparation pour bornes de recharge.',
  '242':'Pompe à chaleur air-eau avec accumulateur, régulation sur sonde extérieure.',
  '243':'Chauffage de sol basse température, collecteurs par logement avec comptage individuel.',
  '244':'Ventilation double flux par logement, ventilation mécanique du parking, charges ECA.',
  '251':'Appareils sanitaires standard du maître de l’ouvrage, conduites en inox et PE, buanderie commune.',
  '258':'Cuisines agencées, façades stratifiées, plans de travail en granit, appareils de classe énergétique A.',
  '261':'Ascenseur électrique sans local des machines, accessible aux personnes à mobilité réduite, 6 arrêts.',
  '271.1':'Cloisons légères en plaques de plâtre, enduits et lissage des plafonds, gaines techniques EI30.',
  '273.0':'Portes palières EI30 avec seuil abaissé, portes de communication à recouvrement, finition laquée.',
  '281.6':'Carrelages des salles d’eau et des parties communes, grès cérame rectifié.',
  '281.7':'Parquet collé dans les séjours et les chambres.',
  '285.1':'Peinture minérale sur murs et plafonds, dispersion lavable en cuisine et dans les communs.',
  '287':'Nettoyage de fin de chantier, avant remise des logements.',
  '291':'Honoraires d’architecte selon le mandat SIA 102, prestations ordinaires complètes.',
  '292':'Honoraires d’ingénieur civil selon SIA 103.',
  '294':'Honoraires d’ingénieur CVSE selon SIA 108.',
  '296.0':'Géomètre : plan de situation, implantation, mise à jour du cadastre.',
  '421':'Modelage du terrain, couche végétale, semis, haies indigènes, place de jeux.',
  '511':'Émoluments communaux et cantonaux, permis de construire, permis d’habiter.',
  '512':'Taxes de raccordement eau, égouts, électricité.',
  '531':'Assurance travaux de construction et responsabilité civile du maître de l’ouvrage.',
  '583':'Réserve pour imprévus, environ 4 % des travaux.'};
const REMARQUES=R=>{ const d=re=>fr(R.recit.find(x=>re.test(x.t)).d), m=/à (\d+) places/.exec(R.recit.find(x=>/places de parc/.test(x.t)).t);
  return [{nom:'Bases du devis',texte:'Plans du projet de l’ouvrage. Prix de '+new Date(R.calendrier.devisValide).toLocaleDateString('fr-CH',{month:'long',year:'numeric'})+', TVA '+R.tva+' %. Rocher au nord de la parcelle selon les sondages du '+d(/Sondages géotechniques/)+'. Parking de '+m[1]+' places selon la demande du maître de l’ouvrage du '+d(/places de parc/)+'.'},
    {nom:'Non compris',texte:'Terrain, frais financiers, mobilier, fonds de rénovation.'}]; };

/* éléments de l'estimation : [code, grandeur, quantité, prix (CHF ou %), CFC]. Le prix en % s'applique à la grandeur ACC…, à SSBT ou SSBW. */
const ELEMENTS=R=>[
  ['B01.01','SA',R.surfaceParcelle,5.6,'102'],['B02.07','FA',R.surface,9,'211.5'],['B05.02','DBV',1500,25,'112'],['B06.01','NCSV',4300,17.5,'201.1'],['B06.05','BFV',900,14,'201.1'],['B08.01','FSA',1600,22,'226.2'],
  ['C01.02','FOA',130,160,'211.5'],['C01.03','BSA',920,140,'211.5'],['C02.01','EWA',1150,105,'211.5'],['C02.02','IWA',900,95,'211.6'],['C03.02','ICL',96,240,'211.5'],['C04.01','CA',2650,50,'211.5'],['C04.02','ISRA',64,420,'211.5'],
  ['D01.04','FA',R.surface,48,'232'],['D01.05','FA',R.surface,5,'232'],['D05.02','HRA',2700,33,'242'],['D05.04','HRA',2700,26,'243'],['D07.04','VRA',900,56,'244'],['D08.05','WCP',72,1650,'251'],['D09.01','WWCP',72,1000,'251'],['D12.01','PLN',1,66000,'261'],
  ['E01.01','WWPA',480,42,'224.1'],['E02.02','EIA',1050,115,'226.2'],['E03.01','EWIA',420,480,'221.1'],['E03.04','SUSA',420,132,'228.2'],
  ['F01.02','FRA',620,140,'224.1'],
  ['G01.01','FPA',1100,75,'271.1'],['G01.05','IDA',150,470,'273.0'],['G02.02','FCA',2300,68,'281.7'],['G03.02','WICA',4800,12,'285.1'],['G04.02','CCA',2400,20,'271.1'],['G05.02','FKN',18,6550,'258'],['G06.03','FA',R.surface,2.2,'287'],
  ['I01.01','ESA',1100,20,'421'],['I03.03','PAA',700,32,'421'],
  ['W01.01','FA',R.surface,5.625,'511'],['W01.02','FA',R.surface,6.875,'512'],['W02.01','FA',R.surface,2.8125,'531']];

A.mod(40,'couts','Catalogues, estimations, devis',async ctx=>{
  const R=A.REF, pid=ctx.pid, p=DS.get('project',pid), usager=ctx.staff.cdp.user, K=R.calendrier, M=R.contrats.mandat;
  await DS.need(['catalog','projectcatalog','projectcatalogpos','catalogpos','costplanning','costestimate','sgdocphase']);

  /* ── 1. catalogues de l'affaire : aucune fonction de l'app ne crée le catalogue CFC ── */
  const std=DS.all('catalog').find(c=>c.NAME==='CFC'&&+c.ISSTANDARDCATALOG&&+c.LANGUAGECODE===2); if(!std) throw new Error('catalogue CFC standard introuvable');
  const src=DS.by('catalogpos','CATALOG_ID',std.ID), [cidC]=A.ids('projectcatalog'), idsC=A.ids('projectcatalogpos',src.length);
  await A.commit([{t:'projectcatalog',id:cidC,val:{ID:cidC,CATALOGTYPECODE:0,ISLICENCEREQUIRED:0,LANGUAGECODE:2,NAME:'CFC',TITLE:'CFC standard',VERSION:0,PROJECT_ID:pid}},
    ...src.map((x,i)=>({t:'projectcatalogpos',id:idsC[i],val:{ID:idsC[i],TEXT1:x.TEXT1,HINT:null,UNIT:null,TEXT2:x.TEXT2,CODE:x.CODE,PROJECTCATALOG_ID:cidC}}))]);
  const c0=DS.all('projectcatalog').find(c=>c.CATALOGTYPECODE===10&&c.PROJECT_ID!==pid); if(!c0) throw new Error('catalogue d’éléments introuvable');
  const pos=ecCatalogPositions(c0), [cidE]=A.ids('projectcatalog'), idsE=A.ids('projectcatalogpos',pos.length);
  await A.commit([{t:'projectcatalog',id:cidE,val:{ID:cidE,CATALOGTYPECODE:10,ISLICENCEREQUIRED:c0.ISLICENCEREQUIRED,LANGUAGECODE:c0.LANGUAGECODE,NAME:c0.NAME,TITLE:c0.TITLE,VERSION:c0.VERSION,PROJECT_ID:pid}},
    ...pos.map((x,i)=>({t:'projectcatalogpos',id:idsE[i],val:{ID:idsE[i],TEXT1:x.TEXT1,HINT:null,UNIT:x.UNIT,TEXT2:x.TEXT2,CODE:x.CODE,PROJECTCATALOG_ID:cidE}}))]);
  const catPos=DS.by('projectcatalogpos','PROJECTCATALOG_ID',cidC), cat=ecCatalog(pid);

  /* ── 2. calculs des coûts ── */
  const honV1=M.v1.hht, auto=c=>R.autresPositions.find(x=>x.cfc===c);
  const estimation=(o)=>{ const [id]=A.ids('costplanningdocument');
    const head={ID:id,PROJECT_ID:pid,VERSION:o.version,VERSIONNUMBER:o.no,STATECODE:2,CHANGEDDATE:o.date,USERID:usager,NOTE:'',ISMARKEDASDELETED:0,ISAPPLYSUBPROJECTS:0,ISREFERENCEBASEA:1,DOCUMENTLOCK_ID:null};
    const P=ecInitContent(p,head,cat), Q=c=>{ const x=P.quantitesReferentielles.find(q=>q.code===c); if(!x) throw new Error('grandeur '+c); return x; }, El=c=>{ const x=P.elements.find(e=>e.code===c); if(!x) throw new Error('élément '+c); return x; };
    const parG={}; ELEMENTS(R).forEach(([c,g,q,pu,cfc])=>{ if(parG[g]!=null&&parG[g]!==q) throw new Error('grandeur '+g+' : deux quantités'); parG[g]=q; Q(g).quantite=q; const e=El(c); e.prix=A.arr(pu*o.k,2); e.origineprix=o.origine; e.cfc=[{numero:cfc,pourcent:100,montant:0}]; });
    /* honoraires : part de coûts déterminante saisie (ACC…), coût fixé au montant de la référence */
    const hon=(code,acc,base,cout,cfc)=>{ Q(acc).quantite=base; const e=El(code); e.prix=A.arr(cout/base*100,3); e.coutFixe=cout; e.origineprix='Calcul'; e.cfc=[{numero:cfc,pourcent:100,montant:0}]; };
    const Bt=o.base; hon('V01.01','ACC11',Bt,o.hon,'291'); hon('V01.03','ACC13',Math.round(Bt*.3),auto('292').ht*o.kh,'292'); hon('V01.04','ACC14',Math.round(Bt*.27),auto('294').ht*o.kh,'294');
    const sp=El('V01.05'); sp.prix=.4; sp.coutFixe=auto('296.0').ht*o.kh; sp.origineprix='Calcul'; sp.cfc=[{numero:'296.0',pourcent:100,montant:0}];
    const y=El('Y01.01'); y.prix=3.5; y.origineprix='Supposition'; y.cfc=[{numero:'583',pourcent:100,montant:0}]; El('Z01.01').prix=o.tva;
    Object.assign(P,{arrondir:o.arrondir!==false,titre:o.titre,date:o.date,indice:+p.BASISINDEX||100,precision:o.precision,etatProjet:o.etat,etatPlanification:o.planif,textesLibres:[o.texte,'','','',''],
      volumes:{VB:R.volume,VN:10300,VC:1700,VU:0,VUP:0,VUS:0,VD:0,VI:0},surfacesSIA416:{SP:R.surface,SN:2720,SU:2300,SUP:2050,SUS:250,SD:300,SI:120,SC:480}});
    Object.assign(P.donneesAffaire,{designation:R.titreLong,lieu:{npa:R.adresse.npa,localite:R.adresse.loc,lignes:R.adresse.rue},genre:{numero:'',texte:'Immeuble d’habitation collectif'},affectation:'18 logements à loyers modérés, parking souterrain',
      descriptionAffaire:o.resume,descriptionConstruction:'Structure en béton armé et maçonnerie, isolation périphérique crépie, fenêtres bois-métal, toiture plate végétalisée, pompe à chaleur air-eau.'});
    /* calage : coût fixé des imprévus (Y01.01), pour tomber sur la cible */
    const pas=P.arrondir?.055:.005; let res=ecEngine(P); for(let i=0;i<10;i++){ const ec=o.cible-(o.surHT?res.T.inv-res.T.tva:res.T.inv); if(Math.abs(ec)<pas) break;
      y.coutFixe=ecR((+y.coutFixe||ecGv(res.P.elements.find(e=>e.code==='Y01.01')))+(o.surHT?ec:ec/(1+o.tva/100)),P.arrondir); res=ecEngine(P); }
    if(ecCfcIncomplete(res)) A.log('⚠ attribution CFC incomplète :',o.version,res.cfc.total,res.T.inv);
    P.elements=res.P.elements; P.quantitesReferentielles=res.P.quantitesReferentielles;
    P.totaux={coutInvestissement:ecR(res.T.inv,false),coutRealisation:ecR(res.T.real,false),coutOuvrage:ecR(res.T.ouv,false)};
    return {id,head,P,T:res.T}; };

  const dgSomme=(v)=>v.ch_cfc1+v.ch_cfc2+v.ch_cfc4+v.ch_cfc5;
  const dRecit=re=>R.recit.find(x=>re.test(x.t)).d, cible23=Math.round(+/budget cible ([\d,]+) mio/.exec(R.recit[0].t)[1].replace(',','.')*1e6);
  const eF=estimation({version:'Estimation de faisabilité',no:1,date:'2023-06-12',k:.965,tva:R.tvaAvant2024,base:2360000,hon:471000,kh:.97,cible:cible23,surHT:true,origine:'Estimation',
      titre:'Estimation des coûts, étude de faisabilité',precision:'±25 %',etat:'Étude de faisabilité',planif:'Variante B, plot avec attique',
      texte:'Ratios de constructions comparables, variante B retenue par le conseil de fondation le '+fr(dRecit(/variante B retenue/))+'.',resume:'Étude de faisabilité : 18 logements à loyers modérés sur la parcelle '+R.parcelle+', budget cible de la fondation : '+num(cible23,0)+' HT.'}),
    eA=estimation({version:'Estimation avant-projet',no:2,date:dRecit(/Avant-projet validé/),arrondir:false,k:1,tva:R.tva,base:2445000,hon:honV1,kh:1,cible:dgSomme(M.v1),origine:'Estimation',
      titre:'Estimation des coûts, avant-projet',precision:'±15 %',etat:'Avant-projet',planif:'Avant-projet validé par le maître de l’ouvrage',
      texte:'Sans la plus-value pour rocher et sans les places de parc supplémentaires.',resume:'Avant-projet validé par le maître de l’ouvrage. Coût de l’ouvrage de la version 1 du contrat d’honoraires.'});
  await A.commit([{t:'costplanningdocument',id:eF.id,val:eF.head},{t:'costplanning',id:eF.id,val:eF.P},{t:'costplanningdocument',id:eA.id,val:eA.head},{t:'costplanning',id:eA.id,val:eA.P},
    {t:'sgdocphase',id:'costplanningdocument:'+eA.id,val:{ID:'costplanningdocument:'+eA.id,PROJECT_ID:pid,PHASE:'31'}}]);

  /* ── 3. devis général et devis estimatif ── */
  const lgn=(com,q,u,pu,base,tva)=>{ const l={commentaire:com,base:base||null,formule:q?String(q):'',qte:q||0,unite:u,prixHT:pu,tva,var:false,ttc:null}; l.ttc=ch02aLineTTC(l,true); return l; };
  const tvaDe=x=>x.tva!=null?x.tva:R.tva;
  const positionsDG=[...R.lots.flatMap(l=>l.dg.map(d=>({...d,hon:100}))),...R.autresPositions.map(x=>({...x,hon:/^(102|112)$/.test(x.cfc)?100:0}))];
  /* lignes d'une position ; complet = faux : sans les lignes 'a' (devis estimatif) */
  const lignesDe=(d,complet)=>{ const t=tvaDe(d), L=(LIGNES[d.cfc]||[]), ens=L.filter(l=>complet||l[5]!=='a'), som=L.reduce((a,l)=>a+(l[2]?l[2]*l[4]:l[4]),0), lg=ens.map(l=>lgn(l[0],l[2],l[3],l[4],l[1],t)), reste=d.ht-som;
    if(L.length&&reste<0) throw new Error('devis : position '+d.cfc+' au-delà de REF');
    if(L.length) lg.push(lgn(LIB_SOLDE[d.cfc]||'Divers',0,'gl',reste,'estimation',t)); else lg.push(lgn(d.lib,0,'gl',d.ht,d.cfc==='583'?'supposition':'calcul',t));
    return lg; };
  const remplir=(E,complet,hon)=>{ const tx=c=>{ const x=catPos.find(y=>String(y.CODE)===c); return x?[x.TEXT1||'',x.TEXT2||'']:null; }, has=c=>E.positions.some(x=>String(x.cfc)===c);
    const ens=c=>{ if(!c||has(c)) return; ens(cfcParent(c)); const t=tx(c)||['','']; E.positions.push({cfc:c,texte:t[0],texte2:t[1],genere:true,descriptif:null,descriptifFormat:null,parts:[]}); };
    positionsDG.forEach(d=>{ ens(cfcParent(d.cfc)); const lg=d.cfc==='291'?[lgn(complet?'Honoraires selon contrat et avenant n° 1':'Honoraires selon contrat',0,'gl',hon,'offre',R.tva)]:lignesDe(d,complet);
      E.positions.push({cfc:d.cfc,texte:d.lib,texte2:'',genere:false,descriptif:DESC[d.cfc]||null,descriptifFormat:null,parts:[Object.assign(ch02dNewPart(null),{honorPct:d.hon,lignes:lg})]}); });
    E.positions.sort((a,b)=>cfcCmp(a.cfc,b.cfc)); E.remarques=REMARQUES(R); return E; };
  const verif=(E,v,lib)=>{ const {T,M:N}=dvCompute(E), g=c=>(N.get(c)||{ttc:0}).ttc, ok=(a,b,t)=>{ if(Math.abs(a-b)>.005) throw new Error(lib+' : '+t+' '+a+' ≠ '+b); };
    ok(g('1'),v.ch_cfc1,'groupe 1'); ok(g('2'),v.ch_cfc2,'groupe 2'); ok(g('4'),v.ch_cfc4,'groupe 4'); ok(g('5'),v.ch_cfc5,'groupe 5'); ok(T.ttc,dgSomme(v),'total TTC'); return T; };

  const [idE,idD]=A.ids('costestimatedocument',2);
  const dest=ch02dNewContent(idE,pid,[],'2024-05-31'); Object.assign(dest.reglages,{marge:'±15%',indice:String(p.BASISINDEX||''),etatProjet:'Projet de l’ouvrage en cours',etatPlanification:'Avant-projet validé le '+fr(dRecit(/Avant-projet validé/)),date:'2024-05-31'});
  dest.reglages.titres.garde='Devis estimatif'; dest.reglages.titres.document='Devis estimatif';
  remplir(dest,false,honV1); const tE=verif(dest,M.v1,'devis estimatif');
  const hE=ch02dHead({VERSION:'Devis estimatif',VERSIONNUMBER:1,STATECODE:1,CHANGEDDATE:'2024-05-31',USERID:usager,ISVATSEPARETED:1,NOTE:'',ISAPPLYSUBPROJECTS:0},idE,pid);

  const J=K.devisValide, dg=ch02dNewContent(idD,pid,[],J); Object.assign(dg.reglages,{marge:'±10%',indice:String(p.BASISINDEX||''),etatProjet:'Enquête publique terminée, permis attendu',etatPlanification:'Projet de l’ouvrage, appels d’offres en préparation',date:J,
    textesLibres:['Devis général validé par le maître de l’ouvrage le '+fr(J)+'.','','','','']});
  dg.reglages.titres.garde='Devis général'; dg.reglages.titres.document='Devis général';
  remplir(dg,true,M.v2.hht); const tD=verif(dg,M.v2,'devis général');
  const hD=ch02dHead({VERSION:'Devis général',VERSIONNUMBER:2,STATECODE:2,CHANGEDDATE:J,USERID:usager,ISVATSEPARETED:1,NOTE:'',ISAPPLYSUBPROJECTS:0},idD,pid);

  const phase=(id,ph)=>({t:'sgdocphase',id:'costestimatedocument:'+id,val:{ID:'costestimatedocument:'+id,PROJECT_ID:pid,PHASE:ph}});
  await A.commit([{t:'costestimatedocument',id:idE,val:hE},{t:'costestimate',id:idE,val:dest},{t:'costestimatedocument',id:idD,val:hD},{t:'costestimate',id:idD,val:dg},phase(idE,'32'),phase(idD,'33')]);

  ctx.couts={cat:{cfc:cidC,elements:cidE},estimations:{faisa:eF.id,ap:eA.id},devis:{estimatif:idE,general:idD},E:dg,usager};
  A.log('coûts : catalogue',src.length,'+',pos.length,'positions ; estimations',A.arr(eF.T.inv-eF.T.tva),'HT (2023) et',eA.T.inv,'TTC ; devis estimatif',A.arr(tE.ttc),'TTC ; devis général',A.arr(tD.ht),'HT,',A.arr(tD.ttc),'TTC');
});
})();

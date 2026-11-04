/* ═══ AFFAIRE DE TRAVAIL 99TST — MODULE 20 : L'AFFAIRE (04.11.2026) ═══
   Crée le dossier complet de l'affaire, sur le dossier standard du bureau, d'après AT.REF :
   - project (état 2, tous les champs utiles), genres d'affaire, adresse d'affaire (seconde adresse du maître de l'ouvrage, CONTACT1_ID), affectations ;
   - phases et phases partielles du standard, budgets de REF.phases aux DEUX niveaux (heures, honoraires, frais) + phase 2 Faisabilité ; 31 et 32 verrouillées ;
   - 5 niveaux de tarif, 7 groupes d'activités et leurs 32 activités avec budgets (§ 3.3 T3 de la checklist : Σ groupes = Σ phases), projectactivity_staff ;
   - genres de frais du standard avec prévisions ;
   - intervenants : équipe rôle 12 (dont le compte courant), MO rôle 8 et représentante 51, architecte 1, responsable 6, DT 2, ingénieur civil 3,
     spécialistes 10, adjudicataires rôle 19 avec CFC, autorité 14.

   Ajoute à ctx :
   ctx.pid         ID de l'affaire ; ctx.adrAffaire = contact.ID de l'adresse d'affaire
   ctx.phases[n]   projectphase.ID, n = 0…8 (usage : 2, 3, 4, 5) ; ctx.sub[n] projectsubphase.ID, n = 11…62 (usage : 31…53) ; ctx.phaseDeSub[n] = phase de la sous-phase n
   ctx.act['<Groupe>/<Activité>']  {id, gid, groupe, nom}  (projectactivity.ID, projectactivitygroup.ID) ; libellés standard corrigés de leurs fautes,
                   les graphies d'origine et l'apostrophe ’ marchent aussi comme clés ; ctx.activites = la liste sans doublon
   ctx.actPhase[n] activités d'usage pour la phase 2 ou 31…53 : [{cle, id, gid, poids}] (Σ poids = 1), à suivre pour répartir les heures
   ctx.actOk(cleStaff, cleActivité)  vrai si l'activité est proposée à ce collaborateur (règle de la feuille d'heures, projectactivity_staff)
   ctx.tarif       {taux:REF.tarifHoraire, defaut:<groupe Architecte>, groupes:{'<niveau>':{id, rate}}}
   ctx.frais['<Groupe>/<Genre>']   {id, gid, unit, prix}  (projectcostcategory.ID, projectcostcategorygroup.ID)
   ctx.intervenants[role]  tableau des projectmember.ID, role = TEAMROLECODE */
(function(){
const A=window.AT;

/* répartition en entiers, au plus fort reste : la somme tombe juste */
const repartir=(tot,poids)=>{ const s=poids.reduce((a,b)=>a+b,0)||1, ex=poids.map(p=>tot*p/s), L=ex.map(Math.floor); let r=Math.round(tot-L.reduce((a,b)=>a+b,0));
  ex.map((v,i)=>[v-L[i],i]).sort((a,b)=>b[0]-a[0]).slice(0,r).forEach(([,i])=>L[i]++); return L; };
const fr=iso=>iso?iso.split('-').reverse().join('.'):null;

/* fautes du dossier standard, corrigées dans l'affaire seulement */
const CORR={'avec les madataires spécialisés':'avec les mandataires spécialisés',"avec le mâitre de l'ouvrage":"avec le maître de l'ouvrage",'avec les autoritéss':'avec les autorités'};
const MO="avec le maître de l'ouvrage", MAND='avec les mandataires spécialisés', AUT='avec les autorités', ENT="avec l'entreprise";
/* part du budget total par groupe (checklist § 3.3) et poids des activités dans le groupe */
const GROUPES={
  'Projet':{pct:25,a:{'Direction générale':30,'Demande de permis de construire':15,'Traitement des oppositions':10,'Planification des délais':15,'Documentation':30}},
  'Planification':{pct:15,a:{'Projet':45,"Préparation de l'exécution":40,'Travail de création':15}},
  'Exécution':{pct:45,a:{"Dossier d'appel d'offres":18,"Envoi d'appels d'offres":3,'Comparaison des offres':8,"Négociation d'adjudication":4,"Contrat d'entreprise":5,'Saisie des métrés':12,'Contrôle du coût':30,'Comptabilisation des paiements':10,'Planification des délais':10}},
  'Séance':{pct:8,a:{[MO]:30,[AUT]:5,[MAND]:25,[ENT]:40}},
  'Entretien':{pct:2,a:{[MO]:40,[AUT]:15,[MAND]:20,[ENT]:25}},
  'Secrétariat':{pct:3,a:{'Travaux de secrétariat':70,'Envoi':20,'Achats':10}},
  'Affaire':{pct:2,a:{'Projet':60,'Secrétariat':20,'Image de synthèse':10,'Maquette':10}}};
/* activités d'usage par phase (rapport 2 § 12) */
const ACT_PHASE={
  2:[['Planification/Travail de création',.5],['Affaire/Projet',.3],['Séance/'+MO,.2]],
  31:[['Planification/Projet',.45],['Planification/Travail de création',.25],['Affaire/Projet',.15],['Séance/'+MO,.1],['Entretien/'+MAND,.05]],
  32:[['Planification/Projet',.45],['Projet/Direction générale',.15],['Affaire/Projet',.15],['Séance/'+MAND,.15],['Séance/'+MO,.1]],
  33:[['Projet/Demande de permis de construire',.65],['Projet/Traitement des oppositions',.25],['Entretien/'+AUT,.1]],
  41:[["Exécution/Dossier d'appel d'offres",.45],["Exécution/Envoi d'appels d'offres",.05],['Exécution/Comparaison des offres',.25],["Exécution/Négociation d'adjudication",.1],["Exécution/Contrat d'entreprise",.15]],
  51:[["Planification/Préparation de l'exécution",.65],['Exécution/Planification des délais',.1],['Exécution/Saisie des métrés',.1],['Séance/'+MAND,.15]],
  52:[['Séance/'+ENT,.25],['Exécution/Contrôle du coût',.25],['Exécution/Comptabilisation des paiements',.15],['Projet/Direction générale',.15],['Exécution/Saisie des métrés',.1],['Exécution/Planification des délais',.1]],
  53:[['Projet/Documentation',.4],['Exécution/Comptabilisation des paiements',.35],['Exécution/Contrôle du coût',.15],['Séance/'+MO,.1]]};
/* activités attribuées (coché dans un groupe = ne voit que celles-là dans ce groupe) : l'apprenti et la dessinatrice n'ont ni négociation ni paiements */
const ATTRIB={
  appr:['Planification/Projet',"Planification/Préparation de l'exécution",'Exécution/Saisie des métrés'],
  dess:['Planification/Projet',"Planification/Préparation de l'exécution",'Planification/Travail de création',"Exécution/Dossier d'appel d'offres",'Exécution/Saisie des métrés','Projet/Demande de permis de construire','Projet/Documentation']};
const TARIFS=['Architecte dirigeant','Architecte','Directeur des travaux','Dessinateur','Secrétariat'];   /* niveaux utilisés par le bureau, montants du dossier standard ; « Architecte » = REF.tarifHoraire */
/* prévision de frais du mandat, répartie par groupe puis sur les genres courants */
const FRAIS={'Frais de déplacement':{pct:25,g:{'Kilomètres voiture privé':70,'Tickets de parking':30}},'Frais de copie':{pct:60,g:{'Plotter noir /blanc':50,'A3 noir/blanc':25,'A4 noir/blanc':25}},'Frais du bureau':{pct:15,g:{'Fourniture':100}},'Frais admin':{pct:0,g:{}}};
const ZONES=[['LOG','Logements'],['PAR','Parking souterrain'],['CAV','Caves et locaux techniques'],['CIR','Circulations communes']];

/* filet : affaire encore présente après la purge du registre (génération interrompue avant la sauvegarde du registre) */
A.purgeurs.push(async()=>{ const p=DS.all('project').find(x=>x.NUMBER===A.REF.code); if(!p) return; const pid=p.ID, sup=[], del=(t,r)=>sup.push({t,id:r.ID,val:null});
  DS.by('projectphase','PROJECT_ID',pid).forEach(f=>{ DS.by('projectsubphase','PROJECTPHASE_ID',f.ID).forEach(s=>del('projectsubphase',s)); del('projectphase',f); });
  DS.by('projectactivitygroup','PROJECT_ID',pid).forEach(g=>{ DS.by('projectactivity','PROJECTACTIVITYGROUP_ID',g.ID).forEach(a=>{ DS.by('projectactivity_staff','PROJECTACTIVITY_ID',a.ID).forEach(l=>sup.push({t:'projectactivity_staff',id:a.ID+'-'+l.STAFFS_ID,val:null})); del('projectactivity',a); }); del('projectactivitygroup',g); });
  DS.by('projectrategroup','PROJECT_ID',pid).forEach(g=>{ DS.by('projectrate','PROJECTRATEGROUP_ID',g.ID).forEach(r=>del('projectrate',r)); del('projectrategroup',g); });
  DS.by('projectcostcategorygroup','PROJECT_ID',pid).forEach(g=>{ DS.by('projectcostcategory','PROJECTCOSTCATEGORYGROUP_ID',g.ID).forEach(c=>del('projectcostcategory',c)); del('projectcostcategorygroup',g); });
  ['timelog','projectcost','projectmember','subproject','projectusezone'].forEach(t=>DS.by(t,'PROJECT_ID',pid).forEach(r=>del(t,r)));
  DS.by('project_projectkind','PROJECT_ID',pid).forEach(r=>sup.push({t:'project_projectkind',id:r.PROJECTKINDS_ID+'-'+pid,val:null}));
  sup.push({t:'project',id:pid,val:null}); A.log('purge : affaire '+p.NUMBER+' hors registre retirée,',sup.length,'enregistrements'); await DS.commit(sup); });

A.mod(20,'affaire','Affaire 99TST',async ctx=>{
  const R=A.REF, C=R.calendrier, cleOk=(t,m)=>{ if(t==null) throw new Error(m); return t; };
  await DS.need(['phase','subphase','activitygroup','activity','rate','costcategorygroup','costcategory','projectkind','projectgroup','property']);
  if(DS.all('project').some(x=>x.NUMBER===R.code)) throw new Error('affaire '+R.code+' déjà présente après la purge');
  ctx.pid=A.ids('project')[0]; const pid=ctx.pid; let ops=[];

  /* adresse d'affaire : le chantier, seconde adresse du maître de l'ouvrage */
  ctx.adrAffaire=A.ids('contact')[0];
  ops.push({t:'contact',id:ctx.adrAffaire,val:A.contactRec({ID:ctx.adrAffaire,CONTACTOWNER_ID:ctx.mo.owner,ADDRESSTYPECODE:4,CREATED:C.debutAffaire,NAME1:R.titre,STREET:R.adresse.rue,POSTALCODE:R.adresse.npa,LOCATION:R.adresse.loc,ADDRESSDESC:'Adresse de l’affaire'})});

  /* phases et phases partielles : le dossier standard, budgets de la référence aux deux niveaux */
  const stdPh=DS.all('phase').slice().sort((a,b)=>cmp(a.NUMBER,b.NUMBER)), stdSub=DS.all('subphase').slice().sort((a,b)=>cmp(a.NUMBER,b.NUMBER)), bud=new Map(R.phases.map(x=>[x.n,x])), tx=R.contrats.mandat.frais/100;
  ctx.phases={}; ctx.sub={}; ctx.phaseDeSub={};
  for(const f of stdPh){ const [id]=A.ids('projectphase'), L=[]; ctx.phases[f.NUMBER]=id;
    for(const s of stdSub.filter(x=>x.PHASE_ID===f.ID)){ const [sid]=A.ids('projectsubphase'), b=bud.get(s.NUMBER); ctx.sub[s.NUMBER]=sid; ctx.phaseDeSub[s.NUMBER]=id;
      L.push({ID:sid,PROJECTPHASE_ID:id,NUMBER:s.NUMBER,NAMEFR:b?b.lib:s.NAMEFR,TIMEBUDGET:b?b.h:0,TIMEAMOUNTBUDGET:b?b.ht:0,COSTBUDGET:b?Math.round(b.ht*tx):0,ISTERMINATED:s.NUMBER===31||s.NUMBER===32?1:0}); }
    const som=k=>L.reduce((a,x)=>a+(+x[k]||0),0), fa=f.NUMBER===R.faisabilite.groupe?R.faisabilite:null;
    ops.push({t:'projectphase',id,val:{ID:id,PROJECT_ID:pid,NUMBER:f.NUMBER,NAMEFR:fa?fa.lib:f.NAMEFR,TIMEBUDGET:fa?fa.h:som('TIMEBUDGET'),TIMEAMOUNTBUDGET:fa?fa.ht:som('TIMEAMOUNTBUDGET'),COSTBUDGET:fa?Math.round(fa.ht*R.contrats.faisa.frais/100):som('COSTBUDGET')}},...L.map(v=>({t:'projectsubphase',id:v.ID,val:v}))); }
  [2,3,4,5,31,32,33,41,51,52,53].forEach(n=>cleOk(ctx.phases[n]??ctx.sub[n],'dossier standard : phase '+n+' absente'));
  const pv=ops.filter(o=>o.t==='projectphase').map(o=>o.val), hT=pv.reduce((a,x)=>a+x.TIMEBUDGET,0), mT=pv.reduce((a,x)=>a+x.TIMEAMOUNTBUDGET,0);

  /* tarifs : montants du dossier standard, valables dès le début de l'affaire */
  ctx.tarif={taux:R.tarifHoraire,defaut:null,groupes:{}};
  const stdR=DS.all('rate');
  TARIFS.forEach((nom,i)=>{ const r=cleOk(stdR.find(x=>x.NAMEFR===nom),'dossier standard : tarif '+nom), [g]=A.ids('projectrategroup'), [t]=A.ids('projectrate'), m=nom==='Architecte'?R.tarifHoraire:r.RATE; ctx.tarif.groupes[nom]={id:g,rate:m}; if(nom==='Architecte') ctx.tarif.defaut=g;
    ops.push({t:'projectrategroup',id:g,val:{ID:g,PROJECT_ID:pid,NAMEFR:nom,SORTORDER:i+1}},{t:'projectrate',id:t,val:{ID:t,PROJECTRATEGROUP_ID:g,RATE:m,VALIDFROM:C.debutAffaire}}); });

  /* activités : 7 groupes du standard ; budgets d'après la référence, pour que Clients, Temps de l'équipe et Controlling aient une prévision */
  ctx.act={}; ctx.activites=[]; ctx.actPhase={};
  const stdG=DS.all('activitygroup').slice().sort((a,b)=>cmp(a.SORTORDER,b.SORTORDER)), nomsG=stdG.map(g=>g.NAMEFR), pctG=nomsG.map(n=>(GROUPES[n]||{pct:0}).pct), hG=repartir(hT,pctG), mG=repartir(mT,pctG), alias=(k,v)=>{ if(!(k in ctx.act)) Object.defineProperty(ctx.act,k,{value:v,enumerable:false}); };
  stdG.forEach((g,i)=>{ const [gid]=A.ids('projectactivitygroup'), Ls=DS.all('activity').filter(a=>a.ACTIVITYGROUP_ID===g.ID).sort((a,b)=>cmp(a.SORTORDER,b.SORTORDER)), def=GROUPES[g.NAMEFR]||{a:{}};
    ops.push({t:'projectactivitygroup',id:gid,val:{ID:gid,PROJECT_ID:pid,NAMEFR:g.NAMEFR,SORTORDER:+g.SORTORDER||i+1,TIMEBUDGET:hG[i],TIMEAMOUNTBUDGET:mG[i]}});
    const noms=Ls.map(a=>{ const n=String(a.NAMEFR).replace(/’/g,"'"); return CORR[n]||n; }), pa=noms.map(n=>def.a[n]||0), hA=repartir(hG[i],pa), mA=repartir(mG[i],pa);
    Ls.forEach((a,k)=>{ const [id]=A.ids('projectactivity'), nom=noms[k], tar=(g.NAMEFR==='Secrétariat'||nom==='Secrétariat')?ctx.tarif.groupes['Secrétariat'].id:ctx.tarif.defaut, x={id,gid,groupe:g.NAMEFR,nom}, cle=g.NAMEFR+'/'+nom;
      ops.push({t:'projectactivity',id,val:{ID:id,PROJECTACTIVITYGROUP_ID:gid,NAMEFR:nom,TYPECODE:a.TYPECODE||0,SORTORDER:+a.SORTORDER||k+1,PROJECTRATEGROUP_ID:tar,TIMEBUDGET:hA[k],TIMEAMOUNTBUDGET:mA[k]}});
      ctx.act[cle]=x; ctx.activites.push(x); alias(g.NAMEFR+'/'+a.NAMEFR,x); alias(cle.replace(/'/g,'’'),x); alias((g.NAMEFR+'/'+a.NAMEFR).replace(/'/g,'’'),x); }); });
  for(const [n,L] of Object.entries(ACT_PHASE)) ctx.actPhase[n]=L.map(([cle,poids])=>{ const a=cleOk(ctx.act[cle],'activité inconnue : '+cle); return {cle,id:a.id,gid:a.gid,poids}; });
  ctx.actOk=(cleS,cleA)=>{ const a=ctx.act[cleA], S=ctx.staff[cleS]; if(!a||!S) return false; const coches=ctx.activites.filter(x=>x.gid===a.gid&&DS.get('projectactivity_staff',x.id+'-'+S.id)); return !coches.length||coches.some(x=>x.id===a.id); };
  for(const [cle,L] of Object.entries(ATTRIB)){ const sid=ctx.staff[cle].id; L.forEach(k=>{ const a=cleOk(ctx.act[k],'activité inconnue : '+k), id=a.id+'-'+sid; ops.push({t:'projectactivity_staff',id,val:{PROJECTACTIVITY_ID:a.id,STAFFS_ID:sid}}); }); }

  /* genres de frais : import du standard par la fonction de l'app, prévisions d'après le taux de frais du mandat */
  const gs=DS.all('costcategorygroup'), cats=DS.all('costcategory'), nc=cats.filter(c=>gs.some(g=>g.ID===c.COSTCATEGORYGROUP_ID)).length, fr0=ch17aStdOps(pid,gs,cats,A.ids('projectcostcategorygroup',gs.length),A.ids('projectcostcategory',nc));
  ctx.frais={}; const totF=Math.round(R.contrats.mandat.v2.hht*R.fraisPct/100), gv=fr0.filter(o=>o.t==='projectcostcategorygroup'), bg=repartir(totF,gv.map(o=>(FRAIS[o.val.NAMEFR]||{pct:0}).pct));
  gv.forEach((o,i)=>{ o.val.BUDGET=bg[i]; const L=fr0.filter(x=>x.t==='projectcostcategory'&&x.val.PROJECTCOSTCATEGORYGROUP_ID===o.id), d=(FRAIS[o.val.NAMEFR]||{g:{}}).g, b=repartir(bg[i],L.map(x=>d[x.val.NAMEFR]||0));
    L.forEach((x,k)=>{ x.val.BUDGET=b[k]; ctx.frais[o.val.NAMEFR+'/'+x.val.NAMEFR]={id:x.id,gid:o.id,unit:x.val.UNIT,prix:x.val.UNITPRICE}; }); });
  ops.push(...fr0);

  /* intervenants */
  let so=0; ctx.intervenants={};
  const mem=(role,contact,resp,x)=>{ const [id]=A.ids('projectmember'); (ctx.intervenants[role]=ctx.intervenants[role]||[]).push(id);
    ops.push({t:'projectmember',id,val:Object.assign({ID:id,PROJECT_ID:pid,TEAMROLECODE:role,CONTACT_ID:contact,RESPCONTACT_ID:resp,PROJECTROLE:null,PROJECTDIVISION:null,BKP:null,NOTE:null,ISHIDDEN:0,SORTORDER:++so},x)}); };
  const titre=(L,c)=>(L.find(p=>p.cle===c)||{}).titre||null, b=ctx.bureau.contact, E=ctx.staff, ROLE_EQ={cdp:'Cheffe de projet',arch:'Architecte',dess:'Dessinatrice',dt:'Directrice des travaux',tech:'Technicien, projet d’exécution',appr:'Apprenti'};
  mem(8,ctx.mo.contact,ctx.mo.pers.pres.contact,{PROJECTROLE:titre(R.mo.personnes,'pres')});
  mem(51,ctx.mo.contact,ctx.mo.pers.dir.contact,{PROJECTROLE:titre(R.mo.personnes,'dir')});
  if(ctx.me.person!=null) mem(1,b,ctx.me.person,{PROJECTROLE:'Architecte associé'});
  mem(2,b,E.dt.person,{PROJECTROLE:ROLE_EQ.dt});
  mem(6,b,E.cdp.person,{PROJECTROLE:ROLE_EQ.cdp});
  R.equipe.forEach(e=>mem(12,b,E[e.cle].person,{PROJECTROLE:e.sortie?e.fonction+', jusqu’au '+fr(e.sortie):ROLE_EQ[e.cle]||e.fonction}));
  if(ctx.me.person!=null) mem(12,b,ctx.me.person,{PROJECTROLE:'Architecte associé'});
  R.mandataires.forEach(m=>{ const x=ctx.mand[m.cle]; mem(m.cle==='ing'?3:10,x.contact,x.pers.contact,{PROJECTROLE:m.metier,PROJECTDIVISION:m.metier,BKP:m.cfc||null}); });
  R.lots.forEach(l=>{ const x=ctx.ent[l.k][0]; mem(19,x.contact,x.pers.contact,{PROJECTROLE:l.lib,PROJECTDIVISION:l.lib,BKP:l.bkp,NOTE:l.adj?'Contrat du '+fr(l.adj):'Hors contrat, sur offre'}); });
  mem(14,ctx.commune.contact,ctx.commune.pers.chef.contact,{PROJECTROLE:titre(R.commune.personnes,'chef')});

  /* l'affaire : les dates de calendrier sont du texte libre, imprimé tel quel */
  const kinds=(()=>{ const g=cleOk(DS.all('projectgroup').find(x=>x.NAMEFR==='Habitat collectif'),'groupe d’affaires Habitat collectif absent'); return ['Nouvelle construction','Démolition'].map(n=>cleOk(DS.all('projectkind').find(k=>k.PROJECTGROUP_ID===g.ID&&k.NAMEFR===n),'genre d’affaire '+n)); })();
  const dernier=R.phases[R.phases.length-1].au, execution=R.phases.find(x=>x.n===51);
  ops.push({t:'project',id:pid,val:{ID:pid,NUMBER:R.code,TITLE:R.titre,DESCRIPTION:R.titreLong,PROJECTSTATECODE:2,CURRENCY:'CHF',ISINTERNAL:0,SORTLABEL:null,
    ISTIMEPHASEMANDATORY:1,ISTIMEDESCMANDATORY:1,ISTIMESUBPROJECTMANDATORY:0,ISEXPENSESDESCMANDATORY:1,ISEXPENSESPHASEMANDATORY:0,NEXTUNIQUEPLANID:1,ISUNIQUEPLANIDLOCKED:0,ISPATHTOPROJECTDOCUMENTSRELATIVE:1,PATHTOPROJECTDOCUMENTS:null,
    PROJECTSTARTDATE:C.debutAffaire,PROJECTENDDATE:dernier,STARTOFPLANNING:fr(R.phases[0].du),ENDOFPLANNING:fr(execution.au),STARTOFCONSTRUCTION:fr(C.debutTravaux),ENDOFCONSTRUCTION:fr(C.reception),MOVEINDEADLINE:fr(C.permis.habiter),
    BASISINDEX:116.8,VOLUME:R.volume,AREA:R.surface,CONTACT1_ID:ctx.adrAffaire,CONTACT2_ID:ctx.mo.contact,CONTACT3_ID:ctx.adrAffaire,CONTACT4_ID:b,CURRENTPROJECTPHASE_ID:ctx.phases[5],
    EXTERNALNUMBER:'ECA '+R.eca,PLOT:R.zone,LANDREGISTERNR:R.parcelle,LOCATION:R.lieu,ACCOUNTINGAREA:'Mandats d’architecture',PROJECTFOLDER:'Affaires/'+R.code,MAILBOXURL:null,ROLELISTSORTCODE:null,TEMPLATEGROUPNAME:null,DOCTEMPLATEGROUPNAME:null}});
  kinds.forEach(k=>ops.push({t:'project_projectkind',id:k.ID+'-'+pid,val:{PROJECT_ID:pid,PROJECTKINDS_ID:k.ID}}));
  ZONES.forEach(([code,nom],i)=>{ const [id]=A.ids('projectusezone'); ops.push({t:'projectusezone',id,val:{ID:id,PROJECT_ID:pid,CODE:code,NAME:nom,SORTORDER:i+1}}); });

  await A.commit(ops); await A.sauverRegistre();
  A.log('affaire :',R.code,'id '+pid+', '+hT+' h et '+mT+' CHF au budget, '+ctx.activites.length+' activités, '+so+' intervenants');
});
})();

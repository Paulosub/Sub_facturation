/* ═══ AFFAIRE DE TRAVAIL 99TST — MODULE 10 : ANNUAIRE ET COLLABORATEURS (04.11.2026) ═══
   Crée, tout FICTIF, d'après AT.REF :
   - maître de l'ouvrage, commune, mandataires, TOUTES les entreprises de REF.lots avec leur responsable (contact.BKP = lot.bkp, catégories,
     statut, coordonnées bancaires des adjudicataires et des mandataires), notes de contact, liste de diffusion des adjudicataires ;
   - collaborateurs de REF.equipe : entité, adresse professionnelle, adresse privée, staff, staffrate, stafftargettime de l'année d'entrée à 2027,
     compte appuser (Standard, lié aussi au compte courant : Disponibilités, Tâches), sgcontrattravail (contrat, avenants, fin de Nora Brouillon),
     sgcoutrevient (param + staff:<ID>), sgacces (couleurs, profils). COMMISSION et paliers au contrat de l'apporteuse.
   Convention : REF.equipe[].salaire = salaire ANNUEL À 100 % (le taux interne ne dépend pas du taux d'activité) ; le contrat porte le salaire MENSUEL réel
   (salaire × taux ÷ mois). staff.HOLIDAYBALANCEYEAR = année passée : soldes et bouclement lisibles dès 2025.

   Ajoute à ctx :
   ctx.me      {user:USERID (texte), appuser:appuser.ID, staff:staff.ID, person:contact.ID, owner, nom, ini}
   ctx.bureau  {owner, contact, nom}
   ctx.staff[cle]  {id, owner, person, home, nom, ini, user:USERID, appuser:appuser.ID, fonction} ; ctx.staff.me existe aussi, NON énumérable (Object.keys ne donne que les fictifs)
   ctx.mo      {owner, contact, nom, pers:{pres,dir}}    ctx.commune {owner, contact, nom, pers:{chef}}    une personne = {owner, contact, nom}
   ctx.mand[cle]  {owner, contact, nom, pers, metier, cfc}
   ctx.ent[lotK]  tableau dans l'ordre de REF.lots[].ent : {owner, contact, nom, pers, iban?}
   AT.contactRec(o) : enregistrement `contact` complet (tous les champs, null par défaut), pour les modules qui ont besoin d'une adresse de plus. */
(function(){
const A=window.AT;
const CH_CONTACT=['CREATED','UPDATED','EXTERNALREFERENCE','FAXCOUNTRY1','FAXAREA1','FAXNUMBER1','NAME1','NAME2','NAME3','STREET','POBOX','POSTALCODE','LOCATION','EMAIL1','SKYPE','INTERNET','PHONECOUNTRY1','PHONEAREA1','PHONENUMBER1','PHONECOUNTRY2','PHONEAREA2','PHONENUMBER2',
  'REMARK','SHORTLABEL','CODELABEL','SALUTATION1','BKP','COMPANYROLE','PROFESSION','ADDRESSDESC','CONTACTSTATE_ID','CONTACTRELATION_ID'];
A.contactRec=o=>Object.assign(Object.fromEntries(CH_CONTACT.map(k=>[k,null])),{ADDRESSTYPECODE:0,LANGUAGECODE:2,COUNTRYCODE:'CH',ISHIDDEN:0,PHONECOUNTRY1:'+41',PHONECOUNTRY2:'+41',FAXCOUNTRY1:'+41'},o);

/* prénoms féminins : la référence ne donne pas la civilité des responsables d'entreprise */
const FEM=new Set(['Anne','Julie','Sophie','Nora','Hélène','Laure','Sarah','Rita','Émilie','Agnès','Nadia','Sandra','Lucie','Inès','Elsa','Clara','Maude','Aline','Mira','Laura','Eva','Rosa','Anna','Fatima','Iris']);
const civ=prenom=>FEM.has(prenom)?'Madame':'Monsieur';
const sans=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'');
const slug=s=>sans(s).toLowerCase().replace(/[’']/g,'-').replace(/\b(sa|sarl)\b/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const usr=(p,n)=>slug(p)+'.'+slug(n);
const abrev=s=>sans(s).replace(/\b(SA|Sàrl|Sarl)\b/g,'').trim().split(/\s+/).map(m=>m[0]).join('').toUpperCase().slice(0,4);
/* « +41 21 000 10 10 » → fixe ou mobile, comme les champs de contact */
const champsTel=t=>{ const m=/^\+41\s*(\d{2})\s*(.+)$/.exec(String(t||'')); if(!m) return {}; const ind='0'+m[1], no=m[2].trim(); return ind[1]==='7'?{PHONEAREA2:ind,PHONENUMBER2:no}:{PHONEAREA1:ind,PHONENUMBER1:no}; };
const nomProp=s=>String(s||'').replace(/’/g,"'");
const prop=n=>{ const r=DS.all('property').find(x=>nomProp(x.NAMEFR)===nomProp(n)); return r?r.ID:null; };
const lieProp=(cid,...noms)=>noms.map(prop).filter(v=>v!=null).map(p=>({t:'contact_property',id:cid+'-'+p,val:{CONTACT_ID:cid,PROPERTIES_ID:p}}));
const etat=n=>{ const r=DS.all('contactstate').find(x=>x.NAMEFR===n); return r?r.ID:null; };
const iban=n=>{ const bban='00777'+String(n).padStart(12,'0'); let m=0; for(const ch of bban+'121700') m=(m*10+ +ch)%97; return ('CH'+String(98-m).padStart(2,'0')+bban).replace(/(.{4})/g,'$1 ').trim(); };
const entite=(id,o)=>Object.assign({ID:id,TYPECODE:0,NAME1:null,NAME2:null,FORMOFADDRESS:null,ISHIDDEN:0,REMARK:null,UID:null,SOCIALSECURITYNUMBER:null,BIRTHDAY:null,CREATED:null,UPDATED:null},o);
const moisAvant=iso=>{ const [y,m]=iso.split('-').map(Number); return new Date(Date.UTC(y,m-1,0)).toISOString().slice(0,10); };   /* dernier jour du mois précédent */
const pas=(v,p)=>Math.round(v/p)*p;

/* comptes fictifs : aussi lus par la purge de la couleur (sgacces.couleurs quand l'enregistrement existait déjà) */
const comptesFictifs=()=>A.REF.equipe.map(e=>usr(e.prenom,e.nom));
A.purgeurs.push(async()=>{ await DS.need(['sgacces']); const c=DS.get('sgacces','couleurs'); if(!c||!c.C) return; const C={...c.C}; let ch=false; comptesFictifs().forEach(u=>{ if(u in C){ delete C[u]; ch=true; } });
  if(ch) await DS.commit([{t:'sgacces',id:'couleurs',val:{...c,C}}]); });

/* conditions propres à chaque collaborateur (ni partagées ni réutilisées ailleurs) : grille CCT, part facturable, vacances, situation privée */
const COND={
  cdp :{cat:'master',niv:'regA3',prod:78,vac:5,dir:1800,etat:'Mariée',orig:'Exempleville VD',rue:'Chemin des Vignes 7',prof:'Architecte EPF',profil:'cdp',ind2026:.95},
  arch:{cat:'master',niv:'regA',prod:80,vac:5,dir:1200,etat:'Célibataire',orig:'Essaiville VD',rue:'Rue du Levant 14',prof:'Architecte HES',profil:'collab',occ0:100,sal0:.94},
  dess:{cat:'dessinateur',niv:'7',prod:85,vac:5,dir:600,etat:'Mariée',orig:'Modèleville VD',rue:'Avenue des Tilleuls 3',prof:'Dessinatrice CFC',profil:'collab',ind2026:.97},
  dt  :{cat:'technicien',niv:'7',prod:82,vac:6,dir:2400,etat:'Divorcée',orig:'Essaiville VD',rue:'Route du Stand 22',prof:'Technicienne ES en conduite de travaux',profil:'cdp',ind2026:.95},
  tech:{cat:'technicien',niv:'7',prod:85,vac:5,dir:900,etat:'Marié',orig:'Exempleville VD',rue:'Chemin de la Forge 9',prof:'Technicien ES',profil:'collab'},
  appr:{cat:'apprenti',niv:'2',prod:60,vac:5,dir:0,etat:'Célibataire',orig:'Modèleville VD',rue:'Rue de l’École 6',prof:'Apprenti dessinateur CFC',profil:'collab',mois:12,fin:'2027-07-31'},
  anc :{cat:'master',niv:'2-3',prod:80,vac:5,dir:0,etat:'Célibataire',orig:'Essaiville VD',rue:'Rue des Remparts 11',prof:'Architecte EPF',profil:'collab'}};
const FRAIS_GENERAUX=[72000,24000,9000,4800,6000,6000,9600,7200,26400];   /* postes de SG_CR_FG, dans l'ordre : 165'000 CHF, soit ≈ 17 CHF/h, ce qui ramène les taux calculés près de REF.equipe[].interne */

A.mod(10,'annuaire','Annuaire et collaborateurs',async ctx=>{
  const R=A.REF, auj=R.aujourdhui, an=+auj.slice(0,4), rng=A.alea(1010), C0=R.calendrier.debutAffaire;
  await DS.need(['publicholiday','stafftargettime','sgcontrattravail','sgcoutrevient','sgacces','contact_property','contactnote','bankaccount','contactstate','property']);
  const u=ME.u; if(!u) throw new Error('compte courant absent : localStorage.ds_user');
  const ms=ME.staff, cb=(ms&&DS.get('contact',ms.COMPANYCONTACT_ID))||DS.all('staff').map(x=>DS.get('contact',x.COMPANYCONTACT_ID)).find(Boolean);
  if(!cb) throw new Error('adresse du bureau introuvable');
  ctx.bureau={owner:cb.CONTACTOWNER_ID,contact:cb.ID,nom:contactName(cb)};
  const moContact=ms?DS.get('contact',ms.PERSON_ID):null;
  ctx.me={user:u.USERID,appuser:u.ID,staff:ms?ms.ID:null,person:ms?ms.PERSON_ID:null,owner:moContact?moContact.CONTACTOWNER_ID:null,nom:ms?staffName(ms):(u.NAME||u.USERID),ini:ms?ms.INITIALS:null};

  /* ── annuaire ── */
  let ops=[], cptTel=0, cptIde=200, cptBan=1000;
  const lieux=[...new Map(R.mandataires.map(m=>[m.npa,{npa:m.npa,loc:m.loc}])).values()];
  const RUES=['Route de l’Industrie','Chemin des Artisans','Rue du Chantier','Avenue de la Gare','Zone artisanale du Moulin','Route du Gravier','Rue des Métiers','Chemin de la Scierie','Impasse du Four','Route de la Carrière','Chemin du Dépôt','Rue de l’Atelier'];
  const BANQUES=[{n:'Banque Exemple SA',rue:'Place de la Banque 1'},{n:'Caisse d’Épargne de Modèleville',rue:'Rue du Crédit 4'},{n:'Banque Test du Lac SA',rue:'Quai de l’Essai 9'}];
  const societe=(o)=>{ const [oid]=A.ids('contactowner'), [cid]=A.ids('contact');
    ops.push({t:'contactowner',id:oid,val:entite(oid,{NAME1:o.nom,FORMOFADDRESS:o.forme||'Société',UID:o.ide||null,CREATED:o.date})},
      {t:'contact',id:cid,val:A.contactRec({ID:cid,CONTACTOWNER_ID:oid,CREATED:o.date,NAME1:o.nom,STREET:o.rue,POSTALCODE:o.npa,LOCATION:o.loc,...champsTel(o.tel),EMAIL1:o.mail,INTERNET:o.web||null,BKP:o.bkp||null,
        SHORTLABEL:abrev(o.nom),SALUTATION1:'Madame, Monsieur,',COMPANYROLE:null,PROFESSION:o.metier||null,CONTACTSTATE_ID:o.etat||null})},...lieProp(cid,...(o.cats||[])));
    return {owner:oid,contact:cid,nom:o.nom}; };
  const personne=(soc,o,p)=>{ const [oid]=A.ids('contactowner'), [cid]=A.ids('contact'), c=civ(p.prenom), nom=p.prenom+' '+p.nom;
    ops.push({t:'contactowner',id:oid,val:entite(oid,{TYPECODE:1,NAME1:p.nom,NAME2:p.prenom,FORMOFADDRESS:c,CREATED:o.date})},
      {t:'contact',id:cid,val:A.contactRec({ID:cid,CONTACTOWNER_ID:oid,CONTACTRELATION_ID:soc.owner,CREATED:o.date,NAME1:soc.nom,NAME2:nom,STREET:o.rue,POSTALCODE:o.npa,LOCATION:o.loc,...champsTel(p.tel),EMAIL1:p.mail,
        SALUTATION1:c+' '+p.nom+',',COMPANYROLE:p.titre||null})});
    return {owner:oid,contact:cid,nom}; };
  const banque=(owner)=>{ const b=BANQUES[cptBan%BANQUES.length], l=lieux[cptBan%lieux.length], no=iban(++cptBan), [id]=A.ids('bankaccount');
    ops.push({t:'bankaccount',id,val:{ID:id,CONTACTOWNER_ID:owner,NAME:b.n,STREET:b.rue,POSTALCODE:l.npa,LOCATION:l.loc,CLEARINGNR:'777',SWIFT:null,IBAN:no,ACCOUNT1:null,ACCOUNT2:null}}); return no; };

  /* maître de l'ouvrage et commune */
  { const m=R.mo, o={nom:m.societe,forme:'Société',rue:m.rue,npa:m.npa,loc:m.loc,tel:m.tel,mail:m.mail,web:'www.'+m.mail.split('@')[1],ide:m.ide,date:C0,cats:['Maître d\'ouvrage'],etat:etat('Bonnes relations')};
    const s=societe(o); ctx.mo={...s,pers:{}}; m.personnes.forEach(p=>{ ctx.mo.pers[p.cle]=personne(s,o,p); }); banque(s.owner); }
  { const m=R.commune, o={nom:m.societe,forme:'Commune',rue:m.rue,npa:m.npa,loc:m.loc,tel:m.tel,mail:m.mail,web:'www.'+m.mail.split('@')[1],date:C0,cats:['Commune']};
    const s=societe(o); ctx.commune={...s,pers:{}}; m.personnes.forEach(p=>{ ctx.commune.pers[p.cle]=personne(s,o,p); }); }
  /* mandataires */
  const CAT_MAND={ing:'Ingénieur civil',cvse:'Ingénieur CVCE',geom:'Géomètre',phys:'Ingénieur en physique du bâtiment',geol:'Mandataire spécialisé'};
  ctx.mand={};
  R.mandataires.forEach(m=>{ const o={nom:m.societe,rue:m.rue,npa:m.npa,loc:m.loc,tel:m.tel,mail:m.mail,web:'www.'+m.mail.split('@')[1],bkp:m.cfc||null,metier:m.metier,date:R.calendrier.mandat.offre,ide:'CHE-000.000.'+(++cptIde),cats:[CAT_MAND[m.cle]],etat:etat('Bonnes relations')};
    const s=societe(o), p=personne(s,o,m.personne); banque(s.owner); ctx.mand[m.cle]={...s,pers:p,metier:m.metier,cfc:m.cfc}; });
  /* entreprises de chaque lot : [0] adjudicataire, suivantes concurrentes ; une raison sociale présente dans deux lots ne crée qu'une entité */
  const parNom=new Map(); ctx.ent={};
  R.lots.forEach(lot=>{ ctx.ent[lot.k]=lot.ent.map((e,i)=>{ let x=parNom.get(e.n);
      if(!x){ const [prenom,...nom]=e.resp.split(' '), n=++cptTel, sl=slug(e.n), l=lieux[Math.floor(rng()*lieux.length)], rue=RUES[Math.floor(rng()*RUES.length)]+' '+(2+Math.floor(rng()*38)), bout=' '+String(40+Math.floor(n/100))+' '+String(n%100).padStart(2,'0');
        const o={nom:e.n,rue,npa:l.npa,loc:l.loc,tel:'+41 21 000'+bout,mail:'info@'+sl+'.test',web:'www.'+sl+'.test',bkp:lot.bkp,metier:lot.lib,date:(lot.ao&&lot.ao.envoi)||lot.trav[0],ide:'CHE-000.000.'+(++cptIde),cats:['Entreprise'],etat:i?null:etat('Recommandé')};
        const s=societe(o), p=personne(s,o,{prenom,nom:nom.join(' '),titre:i?(FEM.has(prenom)?'Responsable commerciale':'Responsable commercial'):(FEM.has(prenom)?'Cheffe de projet':'Chef de projet'),tel:'+41 79 000'+bout,mail:slug(prenom)+'.'+slug(nom.join(' '))+'@'+sl+'.test'});
        x={...s,pers:p}; parNom.set(e.n,x); }
      if(i===0&&!x.iban) x.iban=banque(x.owner);
      return x; }); });
  await A.commit(ops); await A.sauverRegistre(); ops=[];

  /* notes de contact : les faits du récit, aux mêmes dates */
  const recit=d=>{ const r=R.recit.find(x=>x.d===d); if(!r) throw new Error('récit : pas de fait au '+d); return r.t; };
  const lot=k=>ctx.ent[k][0];
  const NOTES=[
    [ctx.mo,'2023-02-06','Première rencontre',recit('2023-02-06')+' Interlocutrice au quotidien : la directrice ; le conseil de fondation décide.'],
    [ctx.mo,'2023-05-22','Présentation au conseil de fondation',recit('2023-05-22')],
    [ctx.mo,'2024-06-10','Demande de places de parc supplémentaires',recit('2024-06-10')],
    [ctx.mo,'2026-02-12','Choix du parquet',recit('2026-02-12')],
    [ctx.commune,'2024-08-12','Dépôt du dossier',recit('2024-08-12')+' Le service technique demande deux jeux de plans de plus pour le pilier public.'],
    [ctx.commune,'2024-10-28','Synthèse CAMAC',recit('2024-10-28')],
    [ctx.mand.geol,'2024-03-18','Sondages',recit('2024-03-18')],
    [lot('201'),'2025-04-02','Rocher dans la fouille nord',recit('2025-04-02')],
    [lot('211'),'2025-10-31','Fin du gros œuvre',recit('2025-10-31')],
    [lot('211'),'2026-05-11','Infiltration en sous-sol',recit('2026-05-11')],
    [lot('221'),'2025-11-20','Retard de livraison',recit('2025-11-20')+' À rappeler avant toute nouvelle consultation : planning de livraison à faire confirmer par écrit.'],
    [lot('281'),'2026-02-12','Mutation du parquet',recit('2026-02-12')]];
  for(const [c,d,sujet,texte] of NOTES){ const [id]=A.ids('contactnote'); ops.push({t:'contactnote',id,val:{ID:id,CONTACT_ID:c.contact,OWNER:u.USERID,ISPUBLIC:1,SUBJECT:sujet,CONTENT:texte,CHANGEDDATE:d}}); }
  /* liste de diffusion statique des adjudicataires */
  { const [g]=A.ids('contactgroup'); ops.push({t:'contactgroup',id:g,val:{ID:g,NAME:'Entreprises '+R.titre,ISSMART:0,OWNER:u.USERID,SORTDATE:R.calendrier.debutTravaux,DESCRIPTION:'Adjudicataires du chantier, pour les envois groupés',CONTACTQUERY_ID:null}});
    [...new Set(R.lots.map(l=>ctx.ent[l.k][0].contact))].forEach(c=>ops.push({t:'contactgroup_contact',id:g+'-'+c,val:{CONTACTGROUPS_ID:g,CONTACTS_ID:c}})); }
  await A.commit(ops); await A.sauverRegistre(); ops=[];

  /* ── collaborateurs ── */
  const cStd=ch08cRoles().std, n0=DS.all('staff').length; if(!cStd) throw new Error('fonction Standard introuvable');
  ctx.staff={}; const fiches={};
  R.equipe.forEach((e,i)=>{ const C=COND[e.cle], [oid]=A.ids('contactowner'), [pro,home]=A.ids('contact',2), [sid]=A.ids('staff'), [rid]=A.ids('staffrate'), [uid]=A.ids('appuser'), c=civ(e.prenom), nom=e.prenom+' '+e.nom, uIdent=usr(e.prenom,e.nom);
    const mail=uIdent+'@bureau-exemple.test', mobile='000 '+(80+i)+' '+String(10+i).padStart(2,'0'), l=lieux[i%lieux.length], parti=!!e.sortie;
    ops.push({t:'contactowner',id:oid,val:entite(oid,{TYPECODE:1,NAME1:e.nom,NAME2:e.prenom,FORMOFADDRESS:c,BIRTHDAY:e.naissance,CREATED:e.entree})},
      {t:'contact',id:pro,val:A.contactRec({ID:pro,CONTACTOWNER_ID:oid,CONTACTRELATION_ID:ctx.bureau.owner,CREATED:e.entree,NAME1:cb.NAME1,NAME2:nom,STREET:cb.STREET,POSTALCODE:cb.POSTALCODE,LOCATION:cb.LOCATION,PHONEAREA1:cb.PHONEAREA1,PHONENUMBER1:cb.PHONENUMBER1,
        PHONEAREA2:'079',PHONENUMBER2:mobile,EMAIL1:mail,SALUTATION1:c+' '+e.nom+',',COMPANYROLE:e.fonction,PROFESSION:C.prof})},
      {t:'contact',id:home,val:A.contactRec({ID:home,CONTACTOWNER_ID:oid,CREATED:e.entree,NAME1:e.nom,NAME2:e.prenom,STREET:C.rue,POSTALCODE:l.npa,LOCATION:l.loc,PHONEAREA2:'079',PHONENUMBER2:mobile,ADDRESSDESC:'Adresse privée'})},
      {t:'staff',id:sid,val:{ID:sid,PERSON_ID:pro,COMPANYCONTACT_ID:ctx.bureau.contact,HOMECONTACT_ID:home,INITIALS:e.ini,JOININGDATE:e.entree,QUITTINGDATE:e.sortie||null,ISACTIVE:parti?0:1,ISINTERNAL:1,ISTIMELOGFROZEN:0,TIMELOGFREEZINGDATE:null,TIMELOGCOMPLETEDDATE:null,
        HOLIDAYS:0,HOLIDAYBALANCE:0,HOLIDAYBALANCEYEAR:an-1,HOLIDAYBALANCECHANGEDDATE:(an-1)+'-01-01',SORTORDER:n0+i,REMARK:null}},
      {t:'staffrate',id:rid,val:{ID:rid,STAFF_ID:sid,VALIDFROM:e.entree,RATE:e.interne}},
      {t:'appuser',id:uid,val:{ID:uid,USERID:uIdent,NAME:nom,ISENABLED:parti?0:1,INITIALS:e.ini,PHONE:null,EMAIL:mail,JOBTITLE:e.fonction,JOBFUNCTION:null,LANGUAGECODE:2}},
      {t:'appuser_staff',id:uid+'-'+sid,val:{APPUSER_ID:uid,STAFFS_ID:sid}},{t:'appuser_staff',id:u.ID+'-'+sid,val:{APPUSER_ID:u.ID,STAFFS_ID:sid}},   /* Disponibilités et Tâches lisent les collaborateurs liés au compte du poste */
      {t:'appuser_appcompanyrole',id:cStd.ID+'-'+uid,val:{APPUSER_ID:uid,APPCOMPANYROLES_ID:cStd.ID}},
      {t:'sgacces',id:'user:'+uid,val:{ID:'user:'+uid,APPUSER_ID:uid,PROFIL:C.profil}});
    ctx.staff[e.cle]={id:sid,owner:oid,person:pro,home,nom,ini:e.ini,user:uIdent,appuser:uid,fonction:e.fonction}; fiches[e.cle]=e; });
  if(ms) Object.defineProperty(ctx.staff,'me',{value:{id:ms.ID,owner:ctx.me.owner,person:ms.PERSON_ID,nom:ctx.me.nom,ini:ms.INITIALS,user:u.USERID,appuser:u.ID,fonction:null},enumerable:false});
  await A.commit(ops); await A.sauverRegistre(); ops=[];

  /* contrats de travail : à écrire AVANT sgCctAnnee, qui les lit */
  const article=f=>{ const t=f.charAt(0).toLowerCase()+f.slice(1); return (/^[aeiouéèh]/i.test(sans(t))?'d’':'de ')+t; };
  const mens=(e,fact,occ)=>Math.round(e.salaire*fact*occ/100/(COND[e.cle].mois||13));
  const CTX=new Map();
  R.equipe.forEach(e=>{ const C=COND[e.cle], S=ctx.staff[e.cle], occ0=C.occ0||e.taux, fact0=C.sal0||C.ind2026||1, id='contrat:'+S.id+':a', jc=A.plus(e.entree,-30), l=DS.get('contact',S.home);
    const paliers=e.apporteuse?{COMMISSION:1,...SG_COMM_DEF}:{COMMISSION:0};
    ops.push({t:'sgcontrattravail',id,val:{ID:id,TYPE:'contrat',STAFF_ID:S.id,DATE:jc,DEBUT:e.entree,DUREE:e.apprenti?'determinee':'indeterminee',FIN_PREVUE:e.apprenti?C.fin:null,FONCTION:article(e.fonction),POSTE:article(e.fonction.split(',')[0]),
      CATEGORIE:C.cat,NIVEAU:C.niv,OCC:occ0,SALAIRE:mens(e,fact0,occ0),MOIS:C.mois||13,ESSAI:e.apprenti?1:3,LAA:'Caisse Accidents Exemple',IJM:'Mutuelle Exemple',LPP:'Prévoyance Exemple',KM:'0.70',VOITURE:0,...paliers,CLAUSES:null,
      EMPLOYE:{civ:civ(e.prenom),prenom:e.prenom,nom:e.nom,rue:l.STREET,npa:l.POSTALCODE,localite:l.LOCATION,naissance:e.naissance,etatcivil:C.etat,origine:C.orig,tel:'079 '+l.PHONENUMBER2}}});
    CTX.set(e.cle,{occ0,fact0}); });
  /* avenant de TAUX : Marc Essai passe de 100 à 90 % en février 2026 (année visible dans Occupation et effectif) ; avenants salariaux de janvier 2026 ; les autres restent « Avenant 2026 à établir », alerte voulue */
  { const e=fiches.arch, S=ctx.staff.arch, id='avenant:'+S.id+':taux';
    ops.push({t:'sgcontrattravail',id,val:{ID:id,TYPE:'avenant',STAFF_ID:S.id,DATE:'2025-12-15',EFFET:'2026-02-01',OBJET:'Réduction du taux d’activité à '+e.taux+' % dès le 1er février 2026',SALAIRE:mens(e,1,e.taux),MOIS:13,OCC:e.taux,FONCTION:article(e.fonction),CATEGORIE:COND.arch.cat,NIVEAU:COND.arch.niv,
      TEXTE:'Comme convenu lors de notre entretien du 9 décembre, votre taux d’activité est réduit à votre demande, afin de vous permettre d’enseigner un jour par quinzaine. Vos conditions au 1er février 2026 sont les suivantes :'}}); }
  R.equipe.filter(e=>COND[e.cle].ind2026).forEach(e=>{ const S=ctx.staff[e.cle], id='avenant:'+S.id+':2026', C=COND[e.cle];
    ops.push({t:'sgcontrattravail',id,val:{ID:id,TYPE:'avenant',STAFF_ID:S.id,DATE:'2025-11-21',EFFET:'2026-01-01',OBJET:'Vos nouvelles conditions salariales au 1er janvier 2026',SALAIRE:mens(e,1,e.taux),MOIS:C.mois||13,OCC:e.taux,FONCTION:article(e.fonction),CATEGORIE:C.cat,NIVEAU:C.niv,TEXTE:null}}); });
  /* fin de contrat : Nora Brouillon, congé donné par elle, dernier jour de présence le vendredi avant la fin légale */
  { const e=R.equipe.find(x=>x.sortie), S=ctx.staff[e.cle], recu='2025-04-22', pr=sgPreavis(e.entree,recu), id='fin:'+S.id+':a', repr=R.equipe.find(x=>x.cle==='cdp');
    if(diso(pr.fin)!==e.sortie) throw new Error('fin de contrat de '+e.nom+' : préavis '+diso(pr.fin)+' ≠ '+e.sortie);
    ops.push({t:'sgcontrattravail',id,val:{ID:id,TYPE:'fin',STAFF_ID:S.id,PAR:'collaborateur',RECU:recu,FIN:e.sortie,DEPART:'2025-06-27',MOTIF_ECO:0,DATE:'2025-04-25',DELAI:pr.delai,REMARQUE:'Reprise de ses dossiers par '+repr.prenom+' '+repr.nom+'.'}}); }
  await A.commit(ops); await A.sauverRegistre(); ops=[];

  /* heures dues : de l'année d'entrée à l'an prochain (Disponibilités et Suivi RH n'ont pas de repli sur la série standard) ; droit aux vacances d'après la CCT */
  const heures=(s,y,c)=>{ const [id]=A.ids('stafftargettime'), v={ID:id,STAFF_ID:s.ID,TARGETTIMEYEAR:y,TARGETTIMEREDUCTION:0,REMARK:null};
    for(let m=0;m<12;m++){ v['TARGETHOURS'+m]=c.mois[m]; v['OVERTIME'+m]=0; } return {t:'stafftargettime',id,val:v}; };
  const complet=moisAvant(auj), fige=moisAvant(an+'-10-01');
  for(const e of R.equipe){ const S=ctx.staff[e.cle], s=DS.get('staff',S.id), y0=+e.entree.slice(0,4), yF=e.sortie?+e.sortie.slice(0,4):an+1;
    for(let y=y0;y<=yF;y++) ops.push(heures(s,y,sgCctAnnee(s,y)));
    const droit=sgCctAnnee(s,e.sortie?an-1:an).vacHeures, passe=sgCctAnnee(s,an-1).vacHeures, report=pas(rng()*40,4.25);
    ops.push({t:'staff',id:s.ID,val:{...s,HOLIDAYS:droit,HOLIDAYBALANCE:A.arr(passe+report),
      TIMELOGCOMPLETEDDATE:e.sortie?e.sortie:(e.cle==='arch'?A.plus(complet,-21):complet),ISTIMELOGFROZEN:e.sortie?0:1,TIMELOGFREEZINGDATE:e.sortie?null:fige}}); }
  await A.commit(ops); await A.sauverRegistre(); ops=[];

  /* coût de revient : les critères du bureau restent ceux de la base s'ils existent */
  if(!DS.get('sgcoutrevient','param')) ops.push({t:'sgcoutrevient',id:'param',val:{ID:'param',CHARGES:Object.fromEntries(SG_CR_CHARGES.map(([k,,v])=>[k,v])),FG:SG_CR_FG.map((l,i)=>({l,m:FRAIS_GENERAUX[i]||0})),SEMAINES:52,HSEM:42.5,FERIES:9,MARGE:15}});
  R.equipe.forEach(e=>{ const S=ctx.staff[e.cle], C=COND[e.cle], id='staff:'+S.id; ops.push({t:'sgcoutrevient',id,val:{ID:id,STAFF_ID:S.id,SALAIRE:mens(e,1,e.taux),MOIS:C.mois||13,OCC:e.taux,VAC:C.vac,ABS:5,PROD:C.prod,DIRECTS:C.dir}}); });
  /* couleurs des auteurs dans les PV : si l'enregistrement existe, on l'enrichit sans l'inscrire au registre (la purge ne doit pas l'effacer) */
  { const mes=Object.fromEntries(R.equipe.map((e,i)=>[ctx.staff[e.cle].user,SG_PALETTE[i%SG_PALETTE.length]])), ex=DS.get('sgacces','couleurs');
    if(ex) await DS.commit([{t:'sgacces',id:'couleurs',val:{...ex,C:{...(ex.C||{}),...mes}}}]); else ops.push({t:'sgacces',id:'couleurs',val:{ID:'couleurs',C:mes}}); }
  await A.commit(ops); await A.sauverRegistre();
  const nEnt=R.lots.reduce((a,l)=>a+l.ent.length,0);
  A.log('annuaire :',nEnt+' entreprises, '+R.mandataires.length+' mandataires, '+NOTES.length+' notes ; équipe : '+R.equipe.length+' collaborateurs'+(ms?'':' ; ⚠ compte courant sans collaborateur'));
});
})();

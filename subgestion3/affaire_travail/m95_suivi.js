/* ═══ AFFAIRE DE TRAVAIL 99TST — MODULE 95 : SÉANCES, PV MO, NOTES, TÂCHES, PV DE CHANTIER (04.11.2026) ═══
   Crée, tout FICTIF, d'après AT.REF et son récit :
   - projectmeetingtype : les genres du dossier standard, recopiés dans l'affaire ;
   - 4 séries de séances : 1 Coordination d'études (2024, close), 2 Autorités et conciliation (close), 3 Comité de construction, 4 Séances de chantier ;
   - PV MO, une série par phase (31, 32, 33, 41, 51, 52 closes, 53 ouverte), numérotation continue, questions ouvertes reprises d'un PV au suivant,
     décisions jamais recopiées, présences, une prochaine séance « Prévue » ;
   - projectnote (notes de l'affaire), projecttask + projecttasknote (tous les états, urgentes, réglées, en retard, tâches du compte courant) ;
   - sa_pv_data['99TST'] (localStorage du cadre Facturation, purge dans AT.purgeurs) : un PV de chantier toutes les 2 semaines de REF.calendrier.debutTravaux
     à REF.calendrier.reception, CFC et entreprises de ctx.ent, sections par CFC, présences, images schématiques ; tous définitifs sauf le dernier (annotation, marques d'auteur).
   Tâche annulée : DONEDATE reste null, comme l'écrit ptEditFull (la tuile compte donc les annulées parmi les ouvertes : écart n° 7 de la checklist, voulu visible).
   Les chiffres du récit (rocher, places, plus-values…) sont lus dans REF.recit (F ci-dessous) : si le récit change, le module s'arrête au lieu de diverger.

   Ajoute à ctx :
   ctx.suivi  {genres:{coord, autorites, comite, chantier, mo} (projectmeetingtype.ID), series:{coord, autorites, comite, chantier} (meetingsequence.ID),
               seriesMO:{31…53} (meetingsequence.ID), seances:n, pvMO:n, notes:n, taches:n, pvChantier:n} */
(function(){
const A=window.AT;

/* ── purges ── */
/* filet, avant celui de m20 qui retire l'affaire : séances, notes et tâches encore rattachées à l'affaire (génération interrompue avant la sauvegarde du registre) */
A.purgeurs.unshift(async()=>{ const p=DS.all('project').find(x=>x.NUMBER===A.REF.code); if(!p) return; const sup=[], del=(t,r)=>sup.push({t,id:r.ID,val:null});
  DS.by('meetingsequence','PROJECT_ID',p.ID).forEach(s=>{ DS.by('meeting','MEETINGSEQUENCE_ID',s.ID).forEach(m=>{ ['meetingparticipant','meetingitem'].forEach(t=>DS.by(t,'MEETING_ID',m.ID).forEach(x=>del(t,x))); del('meeting',m); }); del('meetingsequence',s); });
  DS.by('projecttask','PROJECT_ID',p.ID).forEach(t=>{ DS.by('projecttasknote','PROJECTTASK_ID',t.ID).forEach(x=>del('projecttasknote',x)); del('projecttask',t); });
  ['projectnote','projectmeetingtype'].forEach(t=>DS.by(t,'PROJECT_ID',p.ID).forEach(r=>del(t,r)));
  if(sup.length){ A.log('purge : suivi hors registre retiré,',sup.length,'enregistrements'); await DS.commit(sup); } });
/* PV de chantier : en mémoire d'abord (pvData), sinon le prochain pvPersist du cadre rétablirait l'affaire */
A.purgeurs.push(async()=>{ await A.appel(S=>{ if(!(S.code in pvData)) return 0; delete pvData[S.code]; pvPersist(); return 1; },{code:A.REF.code}); });

/* ── dates et textes ── */
const fr=iso=>iso?iso.split('-').reverse().join('.'):'';
const jm=iso=>fr(iso).slice(0,5);
const jma=iso=>{ const p=String(iso).split('-'); return p[2]+'.'+p[1]+'.'+p[0].slice(2); };
const JOURS=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'], MOIS=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const longue=iso=>{ const p=iso.split('-'); return JOURS[A.semaine(iso)]+' '+(+p[2])+' '+MOIS[+p[1]-1]+' '+p[0]; };
const semIso=iso=>{ const t=new Date(iso+'T00:00:00Z'); t.setUTCDate(t.getUTCDate()-((t.getUTCDay()+6)%7)+3); const a=new Date(Date.UTC(t.getUTCFullYear(),0,4)); return 1+Math.round((t-a)/6048e5-(3-((a.getUTCDay()+6)%7))/7); };
const inis=n=>String(n||'').split(/[\s-]+/).filter(Boolean).map(m=>m[0]).join('').toUpperCase().slice(0,3);
const borne=(v,n,q)=>{ if(v!=null&&String(v).length>n) throw new Error(q+' : plus de '+n+' signes : '+String(v).slice(0,60)); return v; };

/* ── socle commun aux parties : référence, extraits du récit, participants ── */
function socle(ctx){ const R=A.REF, C=R.calendrier, St=ctx.staff;
  const fait=d=>{ const r=R.recit.find(x=>x.d===d); if(!r) throw new Error('récit : pas de fait au '+d); return r.t; };
  const frR=d=>{ fait(d); return fr(d); };
  const ext=(d,re)=>{ const m=re.exec(fait(d)); if(!m) throw new Error('récit du '+d+' : '+re); return m[1]; };
  const F={budget:ext('2023-02-06',/budget cible (.+? HT)/),corniche:ext('2023-03-15',/corniche à ([\d.]+ m)/),rocher:ext('2024-03-18',/rocher à ([\d.]+ m)/),prec15:ext('2024-04-22',/(±\d+ %)/),
    placesAv:ext('2024-06-10',/passe de (\d+) à/),places:ext('2024-06-10',/à (\d+) places/),opp1:ext('2024-09-27',/\((.+?), hauteur/),opp2:ext('2024-09-27',/; (.+?), arbres/),
    devis:ext('2024-11-08',/validé à (.+? HT)/),prec10:ext('2024-11-08',/\((±\d+ %)\)/),hausse:ext('2024-11-08',/: (\+.+? HT)/),t7:ext('2025-04-02',/\((T\d+)\)/),retard:ext('2025-10-31',/avec (.+?) de retard/),
    t8:ext('2025-11-20',/\((T\d+)\)/),t8m:ext('2025-11-20',/plus-value de (.+? HT)/),m4:ext('2026-02-12',/mutation (M\d+)/),res:ext('2026-08-31',/avec (\d+) réserves/),locataires:ext('2026-09-14',/locataires le ([\d.]+)/),solde:ext('2026-10-30',/(\d+) entreprises/)};
  const L=k=>{ const l=R.lots.find(x=>x.k===k); if(!l) throw new Error('lot inconnu : '+k); return l; };
  const ent=k=>ctx.ent[k][0].nom, deb=k=>L(k).trav[0], fin=k=>L(k).trav[1];
  const P={}, pers=(cle,contact,ini,role,div,bkp)=>{ P[cle]={contact,ini,role,div:div||null,bkp:bkp||null}; };
  R.equipe.forEach(e=>pers(e.cle,St[e.cle].person,St[e.cle].ini,e.fonction));
  if(ctx.me.person!=null) pers('me',ctx.me.person,ctx.me.ini||inis(ctx.me.nom),'Architecte associé');
  const tit=(Ls,c)=>(Ls.find(p=>p.cle===c)||{}).titre||null;
  pers('pres',ctx.mo.pers.pres.contact,inis(ctx.mo.pers.pres.nom),tit(R.mo.personnes,'pres'));
  pers('dir',ctx.mo.pers.dir.contact,inis(ctx.mo.pers.dir.nom),tit(R.mo.personnes,'dir'));
  pers('chef',ctx.commune.pers.chef.contact,inis(ctx.commune.pers.chef.nom),tit(R.commune.personnes,'chef'));
  R.mandataires.forEach(m=>pers(m.cle,ctx.mand[m.cle].pers.contact,inis(ctx.mand[m.cle].pers.nom),m.metier,m.metier,m.cfc||null));
  R.lots.forEach(l=>{ const e=ctx.ent[l.k][0]; pers('e'+l.k,e.pers.contact,inis(e.pers.nom),l.lib,l.lib,l.bkp); });
  const ii=k=>(P[k]||P.cdp).ini;   /* initiales du responsable d'un point ; compte courant sans collaborateur : la cheffe de projet */
  return {R,C,St,F,fait,frR,L,ent,deb,fin,P,ii,mo:ctx.mo.nom,dir:ctx.mo.pers.dir.nom,pres:ctx.mo.pers.pres.nom,auj:R.aujourdhui}; }

/* ── genres, séries, procès-verbaux ── */
function constructeur(ctx,B){ const ops=[], pid=ctx.pid, nb={seances:0};
  const dossier=DS.all('meetingtype').slice().sort((a,b)=>(+a.SORTORDER||0)-(+b.SORTORDER||0));
  if(!dossier.length) throw new Error('dossier standard des séances vide');
  const genres=dossier.map(g=>{ const [id]=A.ids('projectmeetingtype'), v={ID:id,PROJECT_ID:pid,SORTORDER:g.SORTORDER,NAMEFR:g.NAMEFR}; ops.push({t:'projectmeetingtype',id,val:v}); return v; });
  const genre=re=>{ const g=genres.find(x=>re.test(x.NAMEFR)); if(!g) throw new Error('genre de séance absent : '+re); return g.ID; };
  const serie=(num,sujet,gid,clos,note)=>{ const [id]=A.ids('meetingsequence'); ops.push({t:'meetingsequence',id,val:{ID:id,PROJECT_ID:pid,NUMBER:String(num),SUBJECT:borne(sujet,255,'série'),ISCLOSED:clos?1:0,NOTE:borne(note||null,255,'série'),PROJECTMEETINGTYPE_ID:gid,SUBPROJECT_ID:null,TEMPLATEPROPERTIES:null,DOCUMENTLOCK_ID:null}}); return id; };
  /* participant : 'cdp', 'cdp:a' animation, 'dess:r' rédaction, 'phys:e' excusé, 'ing:v' en vacances, 'geol:n' non excusé */
  const NOTE={e:'Excusé',v:'En vacances',n:'Non excusé'}, MT_OK=/^\d{4}-\d{2}-\d{2}$/;
  const presents=(m,L)=>{ L.forEach((code,i)=>{ const [k,f]=code.split(':'), x=B.P[k]; if(!x){ if(k==='me') return; throw new Error('participant inconnu : '+k); } const [id]=A.ids('meetingparticipant'), ab=NOTE[f]||null;
    ops.push({t:'meetingparticipant',id,val:{ID:id,MEETING_ID:m,CONTACT_ID:x.contact,SORTORDER:i,ISPRESENT:ab?0:1,ISRECIPIENT:1,ISLEADER:f==='a'?1:0,ISRECORDINGSECRETARY:f==='r'?1:0,INITIALS:x.ini,ATTENDANCENOTE:ab,PROJECTDIVISION:x.div,PROJECTROLE:x.role,BKP:x.bkp}}); }); };
  /* points : numérotation de mtRenumber ; le titre sert de clé de suivi, le moteur le limite à 128 signes */
  const points=(m,L)=>{ const c=[0,0,0]; L.forEach((x,i)=>{ const lv=x.l, [id]=A.ids('meetingitem'); let n=null; if(lv<3){ c[lv]++; for(let j=lv+1;j<3;j++) c[j]=0; n=c.slice(0,lv+1).join('.'); }
    if(x.d&&!MT_OK.test(x.d)) throw new Error('délai invalide : '+x.d);
    ops.push({t:'meetingitem',id,val:{ID:id,MEETING_ID:m,STRUCTURINGLEVEL:lv,TITLE:borne(x.t||null,128,'titre de point'),TEXT:borne(x.x||null,4096,'texte de point'),ITEMCATEGORYCODE:x.c||0,ITEMID:null,USERNAME:x.r||null,DEADLINE:x.d||null,ISDONE:x.ok?1:0,ISPAGEBREAKBEFORE:0,PAGEBREAKBEFORECODES:null,NUMBER:n,SORTORDER:i,PROJECTTASK_ID:null}}); }); };
  const seance=(s,o)=>{ if(!A.ouvre(o.d)) throw new Error('séance un jour non ouvré : '+o.d); const [id]=A.ids('meeting');
    ops.push({t:'meeting',id,val:{ID:id,MEETINGSEQUENCE_ID:s,MEETINGNUMBER:String(o.n),SUBJECT:borne(o.titre,128,'séance'),GOAL:o.but||null,MEETINGDATE:o.d,TIMEFROM:(o.de||'14:00')+':00',TIMETO:(o.a||'16:00')+':00',LOCATION:o.lieu,MINUTESDATE:o.brouillon?null:A.prochainOuvre(A.plus(o.d,2)),ISDRAFT:o.brouillon?1:0,NOTE:borne(o.note||null,255,'note de séance'),ATTACHEMENTFOLDER:null}});
    presents(id,o.parts); points(id,o.pts); nb.seances++; return id; };
  return {ops,nb,genre,serie,seance}; }

/* points d'un procès-verbal de séance */
const Sec=t=>({l:0,t}), Inf=(t,x,r)=>({l:1,c:1,t,x,r}), Dec=(t,x,r)=>({l:1,c:2,t,x,r}), Tac=(t,x,r,d,ok)=>({l:1,c:3,t,x,r,d,ok}), Ouv=(t,x,r,d,ok)=>({l:1,c:4,t,x,r,d,ok}), Txt=x=>({l:3,x});
/* points d'un PV MO : pas de section, niveau 0 */
const Q=(t,x,r,d,ok)=>({l:0,c:4,t,x,r,d,ok}), Dm=(t,x,r)=>({l:0,c:2,t,x,r}), Im=(t,x,r)=>({l:0,c:1,t,x,r});

/* ── séries de séances ── */
function seances(ctx,B,K){ const {R,C,St,F,fait,frR,L,ent,deb,fin,ii,mo}=B;
  const BUR='Salle de conférence du bureau', SIEGE='Siège de la fondation, '+R.mo.rue, BARAQUE='Baraque de chantier, '+R.adresse.rue;
  const T={liste:'Liste des intervenants à diffuser',rel:'Relevé de la parcelle et plan de base',sond:'Campagne de sondages géotechniques',chal:'Choix de la production de chaleur',trame:'Trame porteuse du parking',
    roc:'Incidence du rocher sur le niveau du parking',est:'Estimation des coûts de l’avant-projet',ac:'Bruit de la pompe à chaleur en toiture',plans:'Plans du projet de l’ouvrage, indice A',eca:'Concept de protection incendie',
    pk:'Géométrie du parking à '+F.places+' places',pk2:'Reprise du calcul de la dalle sur parking',en:'Justificatif énergétique',form:'Formulaires CAMAC et questionnaires',amex:'Plan des aménagements extérieurs',col:'Raccordement aux collecteurs communaux'};
  const s1=K.serie(1,'Coordination d’études',K.genre(/coordination/i),1,'Coordination des mandataires, de l’avant-projet au dépôt de la demande de permis.');
  let n=0, coord=o=>K.seance(s1,{n:++n,lieu:BUR,...o});
  coord({d:'2024-02-06',titre:'Lancement des études',but:'Organiser les études d’avant-projet et répartir les prestations entre mandataires.',parts:['cdp:a','arch','dess:r','ing','cvse','geom','phys:e'],pts:[
    Sec('Organisation du mandat'),
    Inf('Mandat signé',`Le mandat complet a été signé le ${fr(C.mandat.signe)} avec ${mo}. ${St.cdp.nom} conduit le projet, ${St.arch.nom} suit les études et ${St.dess.nom} les plans.`,ii('cdp')),
    Dec('Rythme des séances','Une séance de coordination par mois environ, le mardi à 14 h. Les plans de base sont diffusés le vendredi qui précède, en DWG et en PDF.',ii('cdp')),
    Tac(T.liste,'Diffuser à tous les mandataires la liste des intervenants avec leurs coordonnées.',ii('cdp'),'2024-02-09'),
    Sec('Relevés et données de base'),
    Tac(T.rel,`Relevé de la parcelle ${R.parcelle} et des bâtiments voisins, raccordé au plan cadastral. Plan de base à remettre en DWG.`,ii('geom'),'2024-02-23'),
    Tac(T.sond,'Trois sondages à la pelle mécanique, au nord et au centre de la parcelle. Rapport géotechnique attendu avant le bouclement de l’avant-projet.',ii('geol'),'2024-03-15'),
    Sec('Programme et technique'),
    Inf('Programme',`${R.titreLong}. Budget cible de ${F.budget}. Base de travail : variante B de la faisabilité, plot avec attique.`,ii('cdp')),
    Ouv(T.chal,'Comparer la pompe à chaleur air-eau et le raccordement au chauffage à distance : coût, calendrier, exigences énergétiques.',ii('cvse'),'2024-03-19'),
    Ouv(T.trame,'Proposer une trame qui réponde à la fois aux places de parc et à la descente de charges des logements.',ii('ing'),'2024-03-19'),
    Txt('Les plans de base seront diffusés dès réception du relevé.')]});
  coord({d:'2024-03-19',titre:'Résultat des sondages',but:'Prendre connaissance des sondages et arrêter la structure du sous-sol.',parts:['cdp:a','arch','dess:r','ing','cvse','geol','geom:e'],pts:[
    Sec('Suivi des points précédents'),
    Tac(T.liste,'Liste diffusée le 08.02.2024.',ii('cdp'),'2024-02-09',1),
    Tac(T.rel,'Relevé livré le 21.02.2024, plan de base diffusé à tous.',ii('geom'),'2024-02-23',1),
    Sec('Géotechnique'),
    Tac(T.sond,'Sondages exécutés, premiers résultats présentés en séance. Rapport écrit à suivre.',ii('geol'),'2024-03-15',1),
    Inf('Rocher',B.fait('2024-03-18'),ii('geol')),
    Ouv(T.roc,'Comparer deux options : remonter le radier d’un demi-niveau, ou garder le niveau et attaquer le rocher au brise-roche sur la zone nord. Chiffrage sommaire à remettre.',ii('ing'),'2024-04-09'),
    Sec('Structure et technique'),
    Ouv(T.trame,'Trame de 7.50 m retenue : trois places entre porteurs, compatible avec les refends des logements.',ii('ing'),'2024-03-19',1),
    Ouv(T.chal,'Le chauffage à distance n’atteindra pas le quartier avant 2030. La pompe à chaleur air-eau reste seule en lice ; emplacement à arrêter.',ii('cvse'),'2024-04-09')]});
  coord({d:'2024-04-09',titre:'Bouclement de l’avant-projet',but:'Arrêter les options de structure et de technique avant la présentation au maître de l’ouvrage.',parts:['cdp:a','arch:r','dess','ing','cvse','phys'],pts:[
    Sec('Suivi des points précédents'),
    Ouv(T.roc,`Niveau du parking maintenu : remonter le radier ferait perdre la hauteur libre de la rampe. Le rocher est attendu à ${F.rocher} au nord ; le surcoût du brise-roche est inscrit à l’estimation.`,ii('ing'),'2024-04-09',1),
    Ouv(T.chal,'Pompe à chaleur air-eau retenue, installée en toiture de l’attique.',ii('cvse'),'2024-04-09',1),
    Sec('Bouclement'),
    Tac(T.est,`Estimation à ${F.prec15} à remettre pour la séance avec le maître de l’ouvrage.`,ii('arch'),'2024-04-16'),
    Inf('Validation',`Présentation de l’avant-projet au maître de l’ouvrage le ${frR('2024-04-22')}.`,ii('cdp')),
    Ouv(T.ac,'Contrôler l’émergence sonore par rapport aux fenêtres des voisins et proposer un capotage si nécessaire.',ii('phys'),'2024-05-14')]});
  coord({d:'2024-05-14',titre:'Lancement du projet de l’ouvrage',but:'Organiser la phase 32 et répartir les plans.',parts:['cdp:a','arch','dess','anc:r','ing','cvse:v','phys'],pts:[
    Sec('Suite de l’avant-projet'),
    Inf('Avant-projet validé',fait('2024-04-22'),ii('cdp')),
    Tac(T.est,'Estimation remise et présentée le 22.04.2024.',ii('arch'),'2024-04-16',1),
    Ouv(T.ac,'Les premiers calculs donnent un dépassement de nuit côté voisin : capotage acoustique à prévoir, puissance acoustique maximale à inscrire à l’appel d’offres.',ii('phys'),'2024-06-18'),
    Sec('Projet de l’ouvrage'),
    Tac(T.plans,'Plans, coupes et façades au 1:100, indice A, pour le contrôle des surfaces.',ii('dess'),'2024-06-07'),
    Tac(T.eca,'Voies d’évacuation, compartiments coupe-feu du parking, exutoire de la cage d’escalier.',ii('anc'),'2024-07-02'),
    Inf('Surfaces et volume',`Objectif maintenu : ${R.surface} m² de surface de plancher et ${R.volume} m³ SIA 416.`,ii('arch'))]});
  coord({d:'2024-06-18',titre:'Incidence des places de parc supplémentaires',but:'Mesurer les conséquences de la demande du maître de l’ouvrage sur le projet.',parts:['cdp:a','arch','dess','anc:r','ing','cvse','phys'],note:'Séance déplacée d’une semaine à la demande de l’ingénieur civil.',pts:[
    Sec('Demande du maître de l’ouvrage'),
    Inf('Places de parc supplémentaires',fait('2024-06-10'),ii('cdp')),
    Tac(T.pk,'Reprendre la géométrie : une travée de plus, rampe inchangée, ventilation du parking à recalculer.',ii('arch'),'2024-07-05'),
    Ouv(T.pk2,'Vérifier la dalle sur parking et le mur de soutènement nord avec la travée ajoutée.',ii('ing'),'2024-07-02'),
    Dec('Heures supplémentaires de la phase 32','Le bureau absorbe le dépassement d’heures lié à la reprise du parking ; le surcoût de l’ouvrage sera traité au devis général.',ii('cdp')),
    Sec('Suivi des points précédents'),
    Tac(T.plans,'Plans indice A diffusés le 07.06.2024 ; indice B après reprise du parking.',ii('dess'),'2024-06-07',1),
    Ouv(T.ac,'Capotage acoustique confirmé, puissance acoustique à garantir par le fournisseur. Valeurs de planification respectées de jour comme de nuit.',ii('phys'),'2024-06-18',1)]});
  coord({d:'2024-07-09',titre:'Coordination avant le dépôt',but:'Rassembler les pièces de la demande de permis.',parts:['cdp:a','arch','dess','anc:r','ing','cvse','geom'],pts:[
    Sec('Suivi des points précédents'),
    Tac(T.pk,`Plans du parking à ${F.places} places diffusés le 03.07.2024.`,ii('arch'),'2024-07-05',1),
    Ouv(T.pk2,'Contrôle fait : épaisseur de dalle inchangée, armature complémentaire au droit de la nouvelle travée.',ii('ing'),'2024-07-02',1),
    Tac(T.eca,'Concept remis le 28.06.2024 et transmis au service technique.',ii('anc'),'2024-07-02',1),
    Sec('Préparation du dépôt'),
    Inf('Séance préalable avec le service technique',`Retour de la séance du 02.07.2024 : hauteur à la corniche conforme aux ${F.corniche} ; plan des aménagements extérieurs à compléter avec les arbres maintenus.`,ii('cdp')),
    Tac(T.en,'Justificatif énergétique et formulaires à joindre au dossier.',ii('cvse'),'2024-07-31'),
    Tac(T.form,'Formulaires CAMAC, questionnaire général et questionnaires particuliers ; plan de situation signé par le géomètre.',ii('dess'),'2024-08-02')]});
  coord({d:'2024-08-06',titre:'Bouclement du dossier de demande de permis',but:'Contrôler le dossier et fixer le dépôt.',parts:['cdp:a','dess:r','anc','arch:v','ing','cvse','geom'],pts:[
    Sec('Suivi des points précédents'),
    Tac(T.en,'Justificatif remis le 30.07.2024.',ii('cvse'),'2024-07-31',1),
    Tac(T.form,'Formulaires complétés, plan de situation signé le 31.07.2024.',ii('dess'),'2024-08-02',1),
    Sec('Dépôt'),
    Dec('Date de dépôt',`Dépôt de la demande de permis de construire le ${fr(C.permis.depot)}, dossier CAMAC complet.`,ii('cdp')),
    Inf('Suite des études','Le devis général s’établit pendant l’enquête publique. Chaque mandataire remet ses chiffrages à la cheffe de projet d’ici fin septembre.',ii('cdp')),
    Txt('Cette série s’arrête ici : la coordination se poursuit dans le comité de construction et les séances de chantier.')]});

  const s2=K.serie(2,'Autorités et conciliation',K.genre(/autorit/i),1,'Séance préalable au dépôt et séance de conciliation.');
  K.seance(s2,{n:1,d:'2024-07-02',de:'10:00',a:'11:30',lieu:ctx.commune.nom,titre:'Séance préalable au dépôt',but:'Présenter le projet au service technique avant le dépôt.',parts:['chef','cdp:a','anc:r'],pts:[
    Sec('Gabarit et stationnement'),
    Inf('Hauteur à la corniche',`La zone limite la hauteur à la corniche à ${F.corniche}. Les coupes présentées respectent cette limite, attique en retrait compris.`,ii('chef')),
    Inf('Places de parc',`Le projet passe à ${F.places} places : le service technique confirme que le besoin réglementaire est couvert.`,ii('chef')),
    Sec('Dossier de demande de permis'),
    Tac(T.amex,'Indiquer les arbres maintenus et les arbres à abattre : le service technique attend une pesée des intérêts.',ii('cdp'),'2024-08-02'),
    Ouv(T.col,'Point de raccordement des eaux claires et des eaux usées à confirmer par le service technique.',ii('chef'),'2024-08-09')]});
  K.seance(s2,{n:2,d:'2024-11-13',de:'17:00',a:'18:30',lieu:ctx.commune.nom,titre:'Séance de conciliation',but:'Entendre les opposants avant la décision de la Municipalité.',parts:['chef:a','dir','cdp','anc:r'],pts:[
    Sec('Oppositions et observation'),
    Inf('Oppositions reçues',fait('2024-09-27'),ii('chef')),
    Dec(`Opposition de la ${F.opp1}`,`Les coupes de gabarit montrent que la hauteur à la corniche reste sous les ${F.corniche}. L’opposante en prend acte, l’opposition est levée.`,ii('chef')),
    Dec(`Opposition de l’${F.opp2}`,'Le maître de l’ouvrage s’engage à remplacer les arbres abattus par des essences indigènes en pleine terre, le long du chemin. L’opposition est levée.',ii('chef')),
    Inf('Observation','L’observation reçue pendant l’enquête porte sur le bruit du chantier. Le service technique y répondra dans sa décision.',ii('chef')),
    Sec('Suivi'),
    Tac(T.amex,'Plan déposé avec le dossier, arbres de remplacement ajoutés à la suite de la séance.',ii('cdp'),'2024-08-02',1),
    Ouv(T.col,'Confirmé par la synthèse CAMAC.',ii('chef'),'2024-08-09',1),
    Txt(`Décision de la Municipalité attendue pour le ${fr(C.permis.decision)}.`)]});

  /* comité de construction : le genre « Séance de projet » reste dans Séances (seul un nom contenant « maître d… » ou « MO » bascule dans PV MO) */
  const E={cc:'Contrôle des coûts et tableau des mutations',gar:'Seuil des garanties bancaires d’exécution',ret:'Rattrapage du retard de gros œuvre',ech:'Échantillons de crépi sur la façade sud',pen:'Retenue sur la facture de l’entreprise de fenêtres',
    inf:'Reprise de l’étanchéité du saut-de-loup',hab:'Dossier de demande de permis d’habiter',rec:'Convocation de la réception',res:`Levée des ${F.res} réserves de la réception`,sol:`Solde des ${F.solde} dernières entreprises`,ac:'Paiement de l’acompte n° 11 de l’architecte',dos:'Remise du dossier de l’ouvrage'};
  const ac11=R.factures.find(f=>/\.AC11$/.test(f.num)), res583=R.autresPositions.find(p=>/^Réserves/.test(p.lib));
  const s3=K.serie(3,'Comité de construction',K.genre(/projet/i),0,'Pilotage des coûts et des délais avec le maître de l’ouvrage pendant le chantier.');
  let nc=0; const comite=o=>K.seance(s3,{n:++nc,lieu:SIEGE,de:'17:00',a:'18:30',...o}), CO=['pres','dir','me','cdp:a','dt:r'];
  comite({d:'2025-01-27',titre:'Mise en place du comité',but:'Fixer les règles de suivi des coûts avant l’ouverture du chantier.',parts:CO,pts:[
    Sec('Coûts'),
    Inf('Devis général validé',fait('2024-11-08'),ii('cdp')),
    Dec('Référence du contrôle des coûts','Le devis général validé sert de référence. Toute mutation passe par le comité ; les réserves pour imprévus ne s’engagent qu’avec son accord.',ii('dir')),
    Tac(E.cc,'Mettre en place le contrôle des coûts par CFC et le tableau des mutations.',ii('dt'),'2025-02-28'),
    Sec('Adjudications'),
    Inf('Appels d’offres','Les offres du gros œuvre et des installations techniques sont rentrées. Les démolitions et les terrassements seront adjugés en février.',ii('cdp')),
    Ouv(E.gar,'Fixer le montant de contrat à partir duquel une garantie bancaire d’exécution est exigée de l’entreprise.',ii('me'),'2025-02-24'),
    Sec('Calendrier'),
    Inf('Jalons',`Début des travaux le ${fr(C.debutTravaux)}, réception visée le ${fr(C.reception)}.`,ii('dt'))]});
  comite({d:'2025-04-07',titre:'Rocher de la fouille nord',but:'Décider de la suite à donner au rocher rencontré dans la fouille.',parts:['pres','dir','me','cdp:a','dt:r','ing'],pts:[
    Sec('Chantier'),
    Inf('Ouverture du chantier',`Travaux commencés le ${fr(C.debutTravaux)}. Démolitions terminées, terrassements en cours.`,ii('dt')),
    Inf('Rocher dans la fouille nord',fait('2025-04-02'),ii('ing')),
    Dec(`Plus-value ${F.t7}`,`Acceptée par le comité et prise sur les réserves pour imprévus (CFC ${res583.cfc}). Décompte au métré contradictoire.`,ii('dir')),
    Sec('Suivi'),
    Tac(E.cc,'Tableau en service depuis le 28.02.2025, première édition remise au comité.',ii('dt'),'2025-02-28',1),
    Ouv(E.gar,'Garantie bancaire exigée dès 100 000 HT de contrat.',ii('me'),'2025-02-24',1)]});
  comite({d:'2025-06-23',titre:'Organisation et intempéries',but:'Point de situation à la fin du premier trimestre de chantier.',parts:['pres:e','dir','me','cdp:a','dt:r'],pts:[
    Sec('Bureau'),
    Inf('Organisation du bureau',fait('2025-06-16'),ii('me')),
    Sec('Chantier'),
    Inf('Intempéries de juin','Trois semaines de pluies fortes : le bétonnage des murs du sous-sol a été interrompu à plusieurs reprises.',ii('dt')),
    Ouv(E.ret,'Demander à l’entreprise de gros œuvre un renfort d’équipe pour la reprise d’août.',ii('dt'),'2025-07-14'),
    Sec('Coûts'),
    Inf('Situation',`Les adjudications restent conformes au devis général. Seule la plus-value ${F.t7} touche les réserves.`,ii('dt'))]});
  comite({d:'2025-09-29',titre:'Point de situation avant le second œuvre',but:'Contrôler le calendrier de fin de gros œuvre.',parts:CO,pts:[
    Sec('Chantier'),
    Ouv(E.ret,`Renfort en place depuis la reprise d’août : le retard est contenu à ${F.retard}.`,ii('dt'),'2025-07-14',1),
    Inf('Gros œuvre',`Fin attendue le ${fr(fin('211'))}. Pose des fenêtres dès le ${fr(deb('221'))}.`,ii('dt')),
    Tac(E.ech,'Poser les échantillons de crépi sur un panneau de la façade sud, à soumettre au service technique.',ii('cdp'),'2025-11-14'),
    Sec('Coûts'),
    Inf('Second œuvre','Tous les lots sont adjugés. Les prévisions de décompte restent dans l’enveloppe, réserves comprises.',ii('dt'))]});
  comite({d:'2025-12-08',titre:'Retard des fenêtres',but:'Mesurer les effets du retard de livraison.',parts:['pres','dir','me:e','cdp:a','dt:r'],pts:[
    Sec('Fenêtres'),
    Inf('Retard des fenêtres',fait('2025-11-20'),ii('dt')),
    Dec(`Plus-value ${F.t8}`,`Le comité prend acte de la validation par la direction des travaux. Montant de ${F.t8m} imputé aux réserves.`,ii('dir')),
    Ouv(E.pen,'Examiner si le retard de livraison justifie une retenue sur la facture de l’entreprise.',ii('me'),'2026-01-30'),
    Sec('Façades'),
    Tac(E.ech,'Panneau posé, teinte acceptée par le service technique le 14.11.2025.',ii('cdp'),'2025-11-14',1)]});
  comite({d:'2026-05-18',titre:'Mutations et infiltration',but:'Passer en revue les mutations et l’infiltration du sous-sol.',parts:CO,pts:[
    Sec('Mutations'),
    Inf('Parquet en chêne',fait('2026-02-12'),ii('dt')),
    Ouv(E.pen,'Pas de retenue : la réception n’est pas touchée et l’entreprise a tenu son nouveau planning.',ii('me'),'2026-01-30',1),
    Sec('Infiltration'),
    Inf('Infiltration en sous-sol',fait('2026-05-11'),ii('dt')),
    Ouv(E.inf,'Obtenir la reprise avant la pose des revêtements du sous-sol.',ii('dt'),'2026-06-05'),
    Sec('Fin de chantier'),
    Tac(E.hab,'Préparer le dossier de demande de permis d’habiter.',ii('cdp'),'2026-08-21')]});
  comite({d:'2026-08-24',titre:'Préparation de la réception',but:'Organiser la réception et la mise en location.',parts:['pres','dir','me','cdp:a','dt:r'],pts:[
    Sec('Suivi'),
    Ouv(E.inf,'Reprise exécutée et contrôlée à la mise en eau : plus d’infiltration.',ii('dt'),'2026-06-05',1),
    Tac(E.hab,'Demande déposée le 20.08.2026.',ii('cdp'),'2026-08-21',1),
    Sec('Réception'),
    Tac(E.rec,`Convoquer la réception du ${fr(C.reception)} : entreprises, mandataires, maître de l’ouvrage.`,ii('dt'),'2026-08-26'),
    Inf('Mise en location',`Premiers locataires prévus le ${F.locataires}.`,ii('dir'))]});
  const finComite=[Ouv(E.res,'Dernier relevé des réserves à présenter au comité.',ii('dt'),'2026-10-30'),Ouv(E.sol,'Solder dès réception des factures finales corrigées.',ii('dt'),'2026-11-20'),
    Ouv(E.ac,`Facture ${ac11.num} du ${fr(ac11.date)} non réglée à ce jour.`,ii('dir'),'2026-11-02'),Tac(E.dos,'Plans conformes à l’exécution, notices d’entretien, garanties.',ii('cdp'),'2026-11-30')];
  comite({d:'2026-10-30',titre:'Décompte final',but:'Faire le point sur le décompte et les réserves.',parts:['pres','dir','me','cdp:a','dt:r'],pts:[
    Sec('Décompte'),
    Inf('Décompte final',fait('2026-10-30'),ii('dt')),
    Tac(E.rec,`Réception tenue le ${fr(C.reception)}, ${F.res} réserves mineures.`,ii('dt'),'2026-08-26',1),
    Sec('Points à régler'),...finComite]});
  comite({d:'2026-11-23',titre:'Clôture du comité',but:'Bilan des coûts et du calendrier, dernier rapport au conseil de fondation.',parts:['pres','dir','me','cdp:a','dt:r'],brouillon:1,pts:[
    Sec('Ordre du jour'),...finComite,
    Inf('Bilan','Coût final comparé au devis général, réserves utilisées, délais tenus.',ii('cdp'))]});

  const O={pi:'Plan d’installation de chantier',ce:'Constat d’état des lieux des voisins',cd:'Plans des services enterrés',rv:'Plans de réservations des dalles',gt:'Encombrement des gaines techniques palières',lt:'Libération du local technique',ec:'Échantillons de carrelage et de faïence',mes:'Calendrier des mises en service',ves:'Vanne d’arrosage des aménagements extérieurs',lr:'Levée des réserves'};
  const s4=K.serie(4,'Séances de chantier',K.genre(/^séance de chantier$/i),0,'Séances de coordination technique ; les procès-verbaux de chantier suivent leur propre numérotation.');
  let nh=0; const chan=o=>K.seance(s4,{n:++nh,lieu:BARAQUE,de:'10:30',a:'12:00',...o});
  chan({d:C.debutTravaux,titre:'Ouverture du chantier',but:'Installation, accès et sécurité du chantier.',parts:['dt:a','tech:r','cdp','ing','e112','e201','chef:e'],pts:[
    Sec('Installation de chantier'),
    Inf('Accès',`Accès unique depuis le ${R.adresse.rue}, portail fermé chaque soir. Aucun stationnement sur la chaussée.`,ii('dt')),
    Tac(O.pi,'Afficher le plan dans la baraque et le transmettre à toutes les entreprises.',ii('dt'),'2025-03-07'),
    Tac(O.ce,'Compléter le constat avec les murs de clôture de la parcelle voisine.',ii('tech'),'2025-03-14'),
    Sec('Sécurité'),
    Inf('Coordination de la sécurité','Chaque entreprise annonce son responsable sécurité. Équipement de protection individuelle obligatoire dès le portail.',ii('dt')),
    Ouv(O.cd,'Vérifier les conduites enterrées avant les démolitions.',ii('e112'),'2025-03-07'),
    Sec('Calendrier'),
    Inf('Démolitions et terrassements',`Démolitions du ${jm(deb('112'))} au ${fr(fin('112'))}, terrassements dès le ${fr(deb('201'))}.`,ii('dt'))]});
  chan({d:'2025-05-19',titre:'Réservations dans le gros œuvre',but:'Coordonner les réservations techniques avec l’entreprise de gros œuvre.',parts:['dt:a','tech:r','arch','ing','cvse','e211'],pts:[
    Sec('Suivi des points précédents'),
    Tac(O.pi,'Plan affiché le 05.03.2025.',ii('dt'),'2025-03-07',1),
    Tac(O.ce,'Constat complété le 12.03.2025, signé par les propriétaires voisins.',ii('tech'),'2025-03-14',1),
    Ouv(O.cd,'Plans obtenus, aucune conduite dans l’emprise des démolitions.',ii('e112'),'2025-03-07',1),
    Sec('Réservations'),
    Ouv(O.rv,'Plans à livrer dix jours avant chaque bétonnage.',ii('cvse'),'2025-06-02'),
    Inf('Armature et bétonnage','L’entreprise annonce chaque bétonnage 48 heures à l’avance ; l’ingénieur civil réceptionne les armatures.',ii('ing'))]});
  chan({d:'2025-10-06',titre:'Coordination des installations techniques',but:'Préparer l’entrée des entreprises techniques.',parts:['dt:a','tech:r','cvse','e211','e232','e242','e244:e','e251'],pts:[
    Sec('Suivi des points précédents'),
    Ouv(O.rv,'Réservations livrées pour toutes les dalles, percements complémentaires limités.',ii('cvse'),'2025-06-02',1),
    Sec('Installations techniques'),
    Inf('Démarrage',`Courant fort dès le ${fr(deb('232'))}, chauffage et sanitaires dès le ${fr(deb('242'))}, ventilation dès le ${fr(deb('244'))}.`,ii('dt')),
    Ouv(O.gt,'Conflit possible entre ventilation et chauffage au 2e étage : contrôle en 3D à faire.',ii('cvse'),'2025-10-31'),
    Tac(O.lt,'Libérer le local technique du sous-sol pour la livraison de la production de chaleur.',ii('e211'),'2025-10-24')]});
  chan({d:'2026-01-19',titre:'Second œuvre et échantillons',but:'Coordonner plâtrerie, façades et techniques.',parts:['dt:a','tech:r','cdp','e226','e232','e251','e271'],pts:[
    Sec('Suivi des points précédents'),
    Ouv(O.gt,'Contrôle fait : la gaine de ventilation passe au-dessus du chauffage, cote d’implantation modifiée.',ii('cvse'),'2025-10-31',1),
    Tac(O.lt,'Local libéré le 22.10.2025.',ii('e211'),'2025-10-24',1),
    Sec('Échantillons'),
    Ouv(O.ec,'Présenter les échantillons de carrelage et de faïence au maître de l’ouvrage.',ii('e281'),'2026-02-27'),
    Sec('Coordination'),
    Inf('Plâtrerie et techniques','Les colonnes doivent être contrôlées avant la fermeture des gaines : contrôle par étage avec la direction des travaux.',ii('dt'))]});
  chan({d:'2026-04-13',titre:'Préparation des mises en service',but:'Fixer le calendrier des mises en service et des contrôles.',parts:['dt:a','tech:r','cvse','e232','e242','e244','e251','e261'],pts:[
    Sec('Suivi des points précédents'),
    Ouv(O.ec,'Échantillons validés le 24.02.2026.',ii('e281'),'2026-02-27',1),
    Sec('Mises en service'),
    Tac(O.mes,'Établir le calendrier : ascenseur, ventilation, production de chaleur, tableaux électriques.',ii('cvse'),'2026-05-08'),
    Inf('Ascenseur',`Montage jusqu’au ${fr(fin('261'))}, contrôle par l’organisme d’inspection à la suite.`,ii('e261'))]});
  chan({d:'2026-08-10',titre:'Pré-réception',but:'Relever les points à terminer avant la réception.',parts:['dt:a','tech:r','cdp','cvse','e285','e287','e421'],pts:[
    Sec('Suivi des points précédents'),
    Tac(O.mes,'Calendrier tenu, procès-verbaux de mise en service reçus.',ii('cvse'),'2026-05-08',1),
    Sec('Pré-réception'),
    Inf('Tournée','Tournée des logements faite étage par étage. Les points relevés sont repris dans le PV de chantier.',ii('dt')),
    Ouv(O.ves,'Vanne d’arrosage à poser avant les plantations.',ii('e421'),'2026-08-14')]});
  chan({d:'2026-09-28',titre:'Levée des réserves',but:'Contrôler les réserves de la réception avec les entreprises concernées.',brouillon:1,parts:['dt:a','tech:r','e221','e251','e281','e285','e421:e'],note:'Procès-verbal en cours de rédaction, pas encore diffusé.',pts:[
    Sec('Suivi des points précédents'),
    Ouv(O.ves,'Vanne posée le 12.08.2026.',ii('e421'),'2026-08-14',1),
    Sec('Réserves'),
    Ouv(O.lr,`Contrôle commun des ${F.res} réserves : relevé par logement à terminer.`,ii('dt'),'2026-10-30')]});
  return {coord:s1,autorites:s2,comite:s3,chantier:s4}; }

/* ── PV MO : les questions restées ouvertes passent d'office au PV suivant (comme pmNouveau) ; une décision n'est jamais recopiée (registre sans déduplication) ── */
function pvMo(ctx,B,K){ const {R,C,F,fait,frR,L,ent,deb,fin,ii,mo}=B, SIEGE='Siège de la fondation, '+R.mo.rue, BUR='Salle de conférence du bureau';
  const genre=K.genre(/ma[iî]tre/i), ser={}, sp=n=>ser[n]||(ser[n]=K.serie(n,(SG_PH_FICH.find(x=>x[0]===n)||[])[1]||R.phases.find(x=>x.n===n).lib,genre,n!==53));
  let num=0; const ouvertes=new Map(), S=o=>{ const nouv=o.pts.filter(x=>x.c===4), reprises=[...ouvertes.values()].filter(q=>!nouv.some(x=>x.t===q.t));
    nouv.forEach(q=>{ if(q.ok) ouvertes.delete(q.t); else ouvertes.set(q.t,q); });
    return K.seance(sp(o.ph),{n:++num,de:'17:30',a:'19:00',lieu:SIEGE,titre:'Séance avec le maître de l’ouvrage',...o,pts:[...reprises,...o.pts]}); };
  const QT={adapt:'Le programme doit-il comprendre des logements adaptés ?',typo:'Quelle répartition des typologies le conseil de fondation souhaite-t-il ?',velo:'Un local à vélos fermé est-il attendu ?',roc:'Le rocher renchérit-il l’estimation ?',coutP:'Quel est le coût des places de parc supplémentaires ?',
    cuis:'Quel standard de cuisine pour les logements ?',opp:'Les oppositions retardent-elles le calendrier ?',teinte:'La teinte de façade doit-elle être validée par la commune ?',loc:'À quelle date les logements pourront-ils être mis en location ?',res:'Qui suit les réserves après l’emménagement des locataires ?',dos:'Quand le dossier de l’ouvrage sera-t-il remis ?'};
  S({ph:31,d:'2024-02-12',titre:'Séance de lancement',but:'Préciser le programme avec le maître de l’ouvrage.',parts:['dir','pres','me','cdp:a','arch:r'],pts:[
    Q(QT.adapt,null,ii('dir'),'2024-03-28'),Q(QT.typo,null,ii('dir'),'2024-03-28'),Q(QT.velo,null,ii('dir'),'2024-04-22'),
    Dm('Interlocutrice du maître de l’ouvrage',`${B.dir} représente ${mo} au quotidien ; le conseil de fondation valide chaque fin de phase.`),
    Dm('Attique confirmé',`Le conseil confirme l’attique. L’offre « ${R.contrats.variante.projet} », annulée le ${fr(C.variante.annulee)}, n’est pas reprise.`),
    Im('Calendrier du conseil de fondation','Le conseil se réunit tous les deux mois. Les documents lui parviennent dix jours avant chaque séance.')]});
  S({ph:31,d:'2024-04-22',titre:'Validation de l’avant-projet',but:'Valider l’avant-projet et l’estimation.',parts:['dir','pres','me:e','cdp:a','arch:r','ing'],pts:[
    Q(QT.adapt,'Non : tous les logements restent adaptables selon la norme SIA 500, sans logement adapté dédié.',ii('dir'),'2024-03-28',1),
    Q(QT.typo,'6 logements de 2.5 pièces, 8 de 3.5 pièces et 4 de 4.5 pièces, dont ceux de l’attique.',ii('dir'),'2024-03-28',1),
    Q(QT.velo,'Oui : local fermé au rez-de-chaussée, accès de plain-pied depuis le chemin.',ii('dir'),'2024-04-22',1),
    Q(QT.roc,'À ce stade, le brise-roche de la zone nord est inscrit à l’estimation. Le montant se précisera au devis général.',ii('cdp'),'2024-11-08'),
    Dm('Avant-projet validé',fait('2024-04-22')),
    Im('Sondages géotechniques',fait('2024-03-18'))]});
  S({ph:32,d:'2024-06-10',titre:'Demande de places de parc supplémentaires',but:'Examiner la demande de la fondation.',lieu:BUR,parts:['dir','cdp:a','anc:r','pres:e'],pts:[
    Dm(`Parking à ${F.places} places`,fait('2024-06-10')),
    Q('Deux places de plus sont-elles possibles sans toucher à la rampe ?','Oui : le parking s’allonge d’une travée, la rampe ne change pas.',ii('cdp'),'2024-06-18',1),
    Q(QT.coutP,'À chiffrer avec le devis général.',ii('cdp'),'2024-11-08'),
    Q('Les heures supplémentaires du projet seront-elles facturées ?','Non : le bureau assume le dépassement en phase 32.',ii('cdp'),'2024-06-18',1)]});
  S({ph:32,d:'2024-07-15',titre:'Choix des matériaux',but:'Arrêter le principe des façades et des fenêtres.',parts:['dir','pres','cdp:a','arch:r'],pts:[
    Q('Crépi ou bardage pour les façades ?','Isolation extérieure crépie, plus simple à entretenir pour la fondation.',ii('cdp'),'2024-07-15',1),
    Q(QT.cuis,'Une cuisine type par typologie sera présentée en phase d’exécution.',ii('cdp'),'2025-04-28'),
    Dm('Façades et fenêtres',`Façades en ${L('226').dg[0].lib.toLowerCase()}, ${L('221').dg[0].lib.toLowerCase()}.`),
    Im('Échantillons','Les échantillons de crépi et de fenêtres seront présentés avant l’appel d’offres.')]});
  S({ph:32,d:'2024-08-05',titre:'Validation du projet de l’ouvrage',but:'Autoriser le dépôt de la demande de permis.',parts:['dir','pres','me','cdp:a','dess:r'],pts:[
    Dm('Projet de l’ouvrage validé',`Dossier de demande de permis approuvé, dépôt autorisé pour le ${fr(C.permis.depot)}.`),
    Q('Faut-il informer les voisins avant l’enquête ?','Oui : lettre de la fondation aux riverains et présentation de la maquette la semaine avant la mise à l’enquête.',ii('dir'),'2024-08-30',1),
    Im('Calendrier de l’enquête',`Mise à l’enquête prévue du ${fr(C.permis.enqD)} au ${fr(C.permis.enqF)}.`)]});
  S({ph:33,d:'2024-09-30',titre:'Point sur l’enquête publique',but:'Informer le maître de l’ouvrage des réactions à l’enquête.',parts:['dir','cdp:a','anc:r'],pts:[
    Im('Enquête publique',`Mise à l’enquête du ${fr(C.permis.enqD)} au ${fr(C.permis.enqF)}.`),
    Im('Oppositions',fait('2024-09-27')),
    Dm('Réponse aux opposants','Le bureau rédige les déterminations du maître de l’ouvrage ; la fondation accepte de participer à une séance de conciliation.'),
    Q(QT.opp,'Pas si elles sont levées avant la décision municipale. Une séance de conciliation sera proposée.',ii('cdp'),'2024-11-25')]});
  S({ph:33,d:C.devisValide,titre:'Validation du devis général',but:'Valider le devis général et l’avenant aux honoraires.',parts:['dir','pres','me','cdp:a','anc:r','ing'],pts:[
    Dm('Devis général validé',fait('2024-11-08')),
    Dm('Avenant n° 1 aux honoraires',`Le maître de l’ouvrage accepte le principe d’un avenant sur le nouveau coût de l’ouvrage. Offre à remettre le ${fr(C.mandat.avenant)}.`),
    Q(QT.roc,`Oui : avec le parking, il explique la hausse de ${F.hausse} sur l’estimation.`,ii('cdp'),'2024-11-08',1),
    Q(QT.coutP,`Compris dans la hausse de ${F.hausse} ; le détail figure au devis général.`,ii('cdp'),'2024-11-08',1),
    Im('Synthèse CAMAC',fait('2024-10-28'))]});
  S({ph:41,d:'2025-02-03',titre:'Premières adjudications',but:'Valider les premières propositions d’adjudication.',parts:['dir','me','cdp:a','dt:r','anc'],pts:[
    Q(QT.opp,`Non : permis délivré le ${fr(C.permis.decision)}, notifié le ${fr(C.permis.notif)} ; délai de recours échu le ${fr(C.permis.recours)}, sans recours.`,ii('cdp'),'2024-11-25',1),
    Dm('Adjudication des démolitions et des terrassements',`Adjudication à ${ent('112')} et à ${ent('201')}.`),
    Q('Les offres de gros œuvre tiennent-elles le devis général ?','Oui : l’offre la mieux placée reste sous le montant du devis.',ii('cdp'),'2025-02-24',1),
    Im('Appels d’offres',`Offres de gros œuvre reçues le ${fr(L('211').ao.retour)}, offres des installations techniques le ${fr(L('232').ao.retour)}.`)]});
  S({ph:41,d:'2025-02-24',titre:'Adjudication du gros œuvre',but:'Valider la proposition d’adjudication du gros œuvre.',parts:['dir','pres','me','cdp:a','dt:r','ing'],pts:[
    Dm('Adjudication du gros œuvre',`Proposition d’adjudication à ${ent('211')} acceptée, contrat à signer pour le ${fr(L('211').adj)}.`),
    Q('Le chantier peut-il commencer avant la fin des adjudications du second œuvre ?','Oui : le second œuvre sera adjugé d’ici fin mai, sans incidence sur le début des travaux.',ii('dt'),'2025-02-24',1),
    Im('Offres reçues',`${L('211').ent.length} offres de gros œuvre comparées, tableau remis en séance.`)]});
  S({ph:51,d:'2025-04-28',titre:'Cuisines et teintes',but:'Choisir les cuisines et les teintes intérieures.',lieu:BUR,parts:['dir','cdp:a','arch:r','tech'],pts:[
    Q(QT.cuis,`Cuisines présentées ce jour : offre de ${ent('258')}, façades stratifiées, plan de travail en granit. Contrat à signer pour le ${fr(L('258').adj)}.`,ii('cdp'),'2025-04-28',1),
    Q(QT.teinte,'Oui : un échantillon sera posé sur place et soumis au service technique.',ii('cdp'),'2025-11-14'),
    Dm('Teintes intérieures','Murs et plafonds blancs, portes laquées blanc cassé, cages d’escalier en gris clair.'),
    Im('Rocher de la fouille nord',`Plus-value ${F.t7} acceptée au comité de construction, fouille terminée le ${fr(fin('201'))}.`)]});
  S({ph:52,d:'2025-11-20',titre:'Retard de livraison des fenêtres',but:'Informer le maître de l’ouvrage du retard.',lieu:'Baraque de chantier, '+R.adresse.rue,parts:['dir','cdp:a','dt:r','e221'],pts:[
    Im('Retard des fenêtres',fait('2025-11-20')),
    Q(QT.teinte,'Échantillon accepté par le service technique le 14.11.2025.',ii('cdp'),'2025-11-14',1),
    Q('Le retard des fenêtres repousse-t-il la réception ?',`Non : la date du ${fr(C.reception)} est tenue, la plâtrerie commence comme prévu le ${fr(deb('271'))}.`,ii('dt'),'2025-12-08',1)]});
  S({ph:52,d:'2026-02-12',titre:'Choix du parquet',but:'Choisir le parquet des logements.',lieu:BUR,parts:['dir','pres','cdp:a','dt:r','e281'],pts:[
    Dm('Parquet en chêne',fait('2026-02-12')),
    Q('La mutation est-elle couverte par le budget ?',`Oui : ${F.m4} est prise sur les réserves pour imprévus, le devis général reste tenu.`,ii('dt'),'2026-02-27',1)]});
  S({ph:52,d:'2026-05-13',titre:'Infiltration en sous-sol',but:'Constater l’infiltration et fixer la reprise.',lieu:'Baraque de chantier, '+R.adresse.rue,parts:['dir','cdp:a','dt:r','e211'],pts:[
    Im('Infiltration',fait('2026-05-11')),
    Q('Qui prend en charge la reprise ?',`${ent('211')}, à ses frais.`,ii('dt'),'2026-05-13',1),
    Q(QT.loc,'À confirmer avec la gérance dès la date de réception tenue.',ii('dir'),'2026-09-07')]});
  S({ph:53,d:'2026-09-07',titre:'Réception et mise en location',but:'Tirer le bilan de la réception et organiser la mise en location.',parts:['dir','pres','me','cdp:a','dt:r'],pts:[
    Im('Réception',fait('2026-08-31')),
    Q(QT.loc,`Permis d’habiter attendu le ${fr(C.permis.habiter)}, premiers locataires le ${F.locataires}.`,ii('dir'),'2026-09-07',1),
    Q(QT.res,'La direction des travaux jusqu’à la levée complète ; la gérance prend le relais ensuite. À confirmer par la fondation.',ii('dir'),'2026-11-13'),
    Q(QT.dos,null,ii('cdp'),'2026-10-16'),
    Dm('Remise des clés','Les clés sont remises à la gérance après le permis d’habiter, contre signature du protocole.')]});
  S({ph:53,d:'2026-11-17',titre:'Séance de clôture',but:'Clore le mandat avec le maître de l’ouvrage.',brouillon:1,parts:['dir','pres','me','cdp:a','dt:r'],pts:[
    Im('Clôture du mandat',`Décompte final, réserves, garanties reçues, remise du dossier de l’ouvrage.`)]});
  return {ser,n:num}; }

/* ── notes de l'affaire : mémoire interne du bureau ── */
function notes(ctx,B){ const {R,C,St,F,fait,frR,L,ent,mo}=B, u=k=>k==='me'?ctx.me.user:St[k].user, ops=[];
  const N=(k,d,sujet,texte)=>{ const [id]=A.ids('projectnote'); ops.push({t:'projectnote',id,val:{ID:id,PROJECT_ID:ctx.pid,OWNER:u(k),CHANGEDDATE:d,SUBJECT:borne(sujet,255,'note'),SUBPROJECT_ID:null,CONTENT:borne(texte,4096,'note')}}); };
  N('me','2023-02-06','Première rencontre',`${fait('2023-02-06')}\n${B.dir} sera notre interlocutrice au quotidien ; le conseil de fondation décide.\nÀ faire : offre d’étude de faisabilité pour le ${fr(C.faisa.offre)}.`);
  N('cdp','2023-03-15','Variantes volumétriques',`${fait('2023-03-15')}\nLa variante B donne les meilleurs logements mais l’attique pèse sur le coût. À présenter au conseil de fondation avec un chiffrage sommaire.`);
  N('cdp','2023-05-22','Conseil de fondation',`${fait('2023-05-22')}\nLe trésorier reste réservé sur l’attique. La fiche de faisabilité devra chiffrer les deux cas.`);
  N('cdp','2023-06-30','Fin de l’étude de faisabilité',`${fait('2023-06-30')}\nPaiement attendu en juillet. Rien de prévu avant la décision du conseil sur le financement.`);
  N('me','2024-01-12','Variante sans attique',`${fait('2024-01-08')}\nOn repart donc sur le mandat complet, offre à envoyer le ${fr(C.mandat.offre)}.`);
  N('arch','2024-03-18','Appel du géologue',`${fait('2024-03-18')}\n${ctx.mand.geol.pers.nom} confirme que le brise-roche suffira ; pas de minage possible si près des voisins. À reprendre en coordination demain.`);
  N('cdp','2024-06-10','Entretien avec la directrice',`${fait('2024-06-10')}\nPrévenue que la reprise du parking coûtera des heures sur la phase 32 : nous l’absorbons, c’est notre choix commercial.`);
  N('cdp','2024-09-27','Oppositions',`${fait('2024-09-27')}\nDéterminations à rédiger avant fin octobre. Proposer une séance de conciliation à la commune.`);
  N('cdp','2024-10-28','Synthèse CAMAC',`${fait('2024-10-28')}\nCharges à reporter dans le permis de construire et à suivre pendant le chantier.`);
  N('me','2024-11-25','Permis de construire',`${fait('2024-11-25')}\nDélai de recours jusqu’au ${fr(C.permis.recours)} : ne pas signer de contrat d’entreprise avant.`);
  N('dt','2025-04-02','Visite de la fouille nord',`${fait('2025-04-02')}\nConstat fait avec l’entreprise et l’ingénieur civil. Métré contradictoire à tenir chaque soir.`);
  N('me','2025-06-16','Passation des dossiers',`${fait('2025-06-16')}\nDossiers repris : soumissions de second œuvre, suivi des plans d’exécution.`);
  N('dt','2025-10-31','Fin du gros œuvre',`${fait('2025-10-31')}\nÀ noter pour l’entreprise : bon suivi malgré la météo, équipe renforcée dès la reprise d’août.`);
  N('dt','2026-02-12','Choix du parquet',`${fait('2026-02-12')}\nDemander l’offre de plus-value à ${ent('281')} et revoir les cuisines concernées.`);
  N('dt','2026-05-11','Infiltration',`${fait('2026-05-11')}\nPhotos prises. Courrier à l’entreprise de gros œuvre à partir aujourd’hui.`);
  N('cdp','2026-09-14','Permis d’habiter',`${fait('2026-09-14')}\nCopie transmise à la gérance.`);
  N('dt','2026-10-30','Décompte final',`${fait('2026-10-30')}\nReste à obtenir les factures finales corrigées et à clore les réserves.`);
  return {ops,n:ops.length}; }

/* ── tâches : tous les états ; une tâche annulée garde DONEDATE à null, comme ptEditFull ── */
function taches(ctx,B){ const {R,C,St,F,L,ent}=B, pid=ctx.pid, ops=[], E=k=>ctx.ent[k][0].contact, nom=k=>k==='me'?ctx.me.nom:St[k].nom, sta=k=>k==='me'?ctx.me.staff:k?St[k].id:null, usr=k=>k==='me'?ctx.me.user:St[k].user;
  let n=0, nt=0; const ac11=R.factures.find(f=>/\.AC11$/.test(f.num));
  const T=(o,...tn)=>{ const [id]=A.ids('projecttask'); n++;
    ops.push({t:'projecttask',id,val:{ID:id,PROJECT_ID:pid,SUBJECT:borne(o.s,255,'tâche'),DESCRIPTION:borne(o.x||null,4096,'tâche'),USERNAME:nom(o.par||'cdp'),STARTDATE:o.deb,DEADLINE:o.del||null,DONEDATE:o.fait||null,ISURGENT:o.urg?1:0,ISUNTOUCHED:o.neuf?1:0,PROJECTTASKSTATECODE:o.et,PROJECTTASKPRIORITYCODE:o.pr??2,STAFF_ID:sta(o.pour),CONTACT_ID:o.c||null,SUBPROJECT_ID:null}});
    tn.forEach(([d,sujet,texte,k])=>{ const [nid]=A.ids('projecttasknote'); nt++; ops.push({t:'projecttasknote',id:nid,val:{ID:nid,PROJECTTASK_ID:id,SUBJECT:borne(sujet,64,'note de tâche'),CONTENT:borne(texte||null,1024,'note de tâche'),CHANGEDDATE:d,OWNER:usr(k||o.pour||'cdp')}}); }); };
  const mand=k=>ctx.mand[k].contact, com=ctx.commune.contact, moC=ctx.mo.contact;
  /* réglées */
  T({s:'Commander les sondages géotechniques',x:'Trois sondages à la pelle mécanique au nord et au centre de la parcelle.',et:3,deb:'2024-02-06',del:'2024-02-20',fait:'2024-02-16',pour:'arch',c:mand('geol')},['2024-02-16','Commande passée','Offre acceptée, sondages prévus la semaine du 11 mars.']);
  T({s:'Déposer le dossier CAMAC',x:'Formulaires, plans, questionnaires, justificatif énergétique, concept de protection incendie.',et:3,pr:3,deb:'2024-07-09',del:C.permis.depot,fait:C.permis.depot,pour:'cdp',c:com},['2024-08-12','Dépôt fait','Dossier déposé ; deux jeux de plans de plus pour le pilier public.']);
  T({s:'Rédiger les déterminations aux oppositions',x:`Oppositions de la ${F.opp1} et de l’${F.opp2}, plus une observation.`,et:3,pr:3,deb:'2024-09-30',del:'2024-10-25',fait:'2024-10-24',pour:'cdp',c:com});
  T({s:'Établir le devis général',x:`Chiffrages des mandataires à intégrer, précision ${F.prec10}.`,et:3,pr:3,deb:C.permis.depot,del:'2024-11-01',fait:'2024-11-05',pour:'arch',c:moC},['2024-10-30','Chiffrages en retard','Ingénieurs relancés, le devis ne sera pas prêt le 1er novembre.']);
  T({s:'Préparer l’avenant n° 1 aux honoraires',x:'Nouveau coût de l’ouvrage après validation du devis général.',et:3,par:'me',deb:C.devisValide,del:C.mandat.avenant,fait:C.mandat.avenant,pour:'me',c:moC});
  T({s:'Lancer les appels d’offres du gros œuvre',x:'Dossiers des lots démolitions, terrassements, béton armé et maçonnerie.',et:3,deb:'2024-10-14',del:L('211').ao.envoi,fait:L('211').ao.envoi,pour:'anc'});
  T({s:'Faire signer le contrat d’entreprise du gros œuvre',et:3,urg:1,pr:3,deb:'2025-02-24',del:L('211').adj,fait:L('211').adj,pour:'dt',c:E('211')});
  T({s:'Commander le constat d’état des lieux des voisins',x:'Avant le début des travaux, avec les propriétaires concernés.',et:3,deb:'2025-01-27',del:'2025-02-21',fait:'2025-02-20',pour:'dt'});
  T({s:`Reprendre les dossiers de ${St.anc.nom}`,x:'Soumissions de second œuvre, suivi des plans d’exécution.',et:3,par:'me',deb:'2025-06-16',del:'2025-06-30',fait:'2025-06-27',pour:'cdp'},['2025-06-27','Passation terminée','Tout est classé dans le dossier de l’affaire.']);
  T({s:'Faire confirmer le planning de livraison des fenêtres',x:'Confirmation écrite, étage par étage.',et:3,urg:1,pr:3,deb:'2025-11-20',del:'2025-11-28',fait:'2025-11-27',pour:'dt',c:E('221')},['2025-11-27','Planning reçu',`Reçu de ${ent('221')}, transmis à la plâtrerie.`]);
  T({s:'Chiffrer la mutation du parquet en chêne',x:`Mutation ${F.m4}, sols et cuisines concernées.`,et:3,deb:'2026-02-12',del:'2026-02-27',fait:'2026-02-26',pour:'tech',c:E('281')});
  T({s:'Faire reprendre l’étanchéité du saut-de-loup',x:'À la charge de l’entreprise de gros œuvre, après l’infiltration en sous-sol.',et:3,urg:1,pr:3,deb:'2026-05-11',del:'2026-06-05',fait:'2026-06-04',pour:'dt',c:E('211')},['2026-05-12','Courrier envoyé','Mise en demeure de reprendre avant la pose des sols du sous-sol.'],['2026-06-04','Reprise contrôlée','Contrôle à la mise en eau concluant.']);
  T({s:'Déposer la demande de permis d’habiter',et:3,pr:3,deb:'2026-08-03',del:'2026-08-21',fait:'2026-08-20',pour:'cdp',c:com});
  /* en traitement : urgentes, en retard, à venir */
  T({s:'Relancer le paiement de l’acompte n° 11',x:`Facture ${ac11.num} du ${fr(ac11.date)}, échue, sans paiement à ce jour.`,et:1,urg:1,pr:3,par:'me',deb:'2026-10-30',del:'2026-11-02',pour:'me',c:moC},['2026-10-30','Signalé au comité','La directrice vérifie auprès du trésorier.','me']);
  T({s:`Contrôler la levée des ${F.res} réserves`,x:'Relevé par logement, contrôle commun avec chaque entreprise.',et:1,urg:1,pr:3,deb:'2026-09-01',del:'2026-10-30',pour:'dt'},['2026-09-28','Premier contrôle',`${+F.res-5} réserves levées, 5 restent ouvertes.`],['2026-10-26','Relance','Deux entreprises relancées par écrit.']);
  T({s:`Solder les ${F.solde} dernières entreprises`,x:'Dès réception des factures finales corrigées.',et:1,urg:1,pr:3,par:'dt',deb:'2026-10-30',del:'2026-11-20',pour:'dt'});
  T({s:'Établir le décompte final',x:'Contrôle des coûts à jour, tableau comparé au devis général.',et:1,deb:'2026-09-15',del:'2026-11-27',pour:'cdp',c:moC},['2026-10-30','Avancement','Décompte en cours, garanties bancaires reçues.']);
  T({s:'Remettre le dossier de l’ouvrage',x:'Plans conformes à l’exécution, notices d’entretien, garanties, procès-verbaux de mise en service.',et:1,deb:'2026-09-07',del:'2026-11-30',pour:'cdp',c:moC});
  T({s:'Compléter les plans conformes à l’exécution',x:'Logements et sous-sol, d’après les relevés de fin de chantier.',et:1,neuf:1,pr:1,par:'cdp',deb:'2026-09-07',del:'2026-10-23',pour:'tech'});
  T({s:'Préparer la séance de clôture avec le maître de l’ouvrage',x:'Questions ouvertes, bilan des coûts, remise du dossier.',et:1,neuf:1,par:'cdp',deb:'2026-10-30',del:'2026-11-17',pour:'me',c:moC});
  /* brouillons */
  T({s:'Organiser la visite de garantie de deux ans',et:0,pr:0,deb:'2026-09-07',del:'2028-08-31',pour:'dt'});
  T({s:'Présenter le retour d’expérience en séance de bureau',et:0,pr:0,par:'cdp',deb:'2026-10-30'});
  /* annulées */
  T({s:'Chiffrer la variante sans attique',x:'Tâche sans objet : le conseil de fondation confirme l’attique.',et:2,par:'me',deb:C.variante.offre,del:'2024-01-19',pour:'cdp'});
  T({s:'Étudier le raccordement au chauffage à distance',x:'Tâche sans objet : le réseau n’arrivera pas à temps, pompe à chaleur air-eau retenue.',et:2,deb:'2024-02-06',del:'2024-03-19',pour:'arch',c:mand('cvse')},['2024-04-09','Annulée','Décision prise en séance de coordination.','cdp']);
  return {ops,n,nt}; }

/* ── PV de chantier ── */
/* étapes par code CFC : [libellé, début, fin, option] ; début et fin = date ISO ou fraction de lot.trav */
const ETAPES={
  '112':[['Démolition du garage et des murets existants',0,.65],['Tri et évacuation des matériaux, bordereaux de décharge à remettre',.6,1]],
  '201':[['Décapage de la terre végétale, mise en dépôt sur la parcelle',0,.2],['Fouille en pleine masse, zone sud',.15,.5],['Fouille nord au brise-roche',.4,.92,{u:1}],['Réglage du fond de fouille, réception par l’ingénieur civil',.9,1]],
  '211.6':[['Installation de la grue et du chantier de gros œuvre','2025-04-14','2025-04-18'],['Canalisations sous radier et mise à terre','2025-04-22','2025-05-09'],['Radier du sous-sol','2025-05-05','2025-05-23'],['Murs du sous-sol','2025-05-26','2025-06-30',{u:1}],['Dalle sur sous-sol','2025-07-01','2025-07-11'],
    ['Murs et dalle sur rez-de-chaussée','2025-08-11','2025-08-29'],['Murs et dalle sur 1er étage','2025-09-01','2025-09-12'],['Murs et dalle sur 2e étage','2025-09-15','2025-09-26'],['Murs et dalle sur 3e étage','2025-09-29','2025-10-10'],['Attique et dalle de toiture','2025-10-13','2025-10-24'],['Repli de la grue et nettoyage de fin de gros œuvre','2025-10-27','2025-10-31'],
    ['Reprise de l’étanchéité du saut-de-loup, à la charge de l’entreprise','2026-05-12','2026-06-05',{u:2}]],
  '221':[['Relevé des baies et plans d’atelier',-.8,0],['Pose des fenêtres, rez-de-chaussée et 1er étage',0,.45],['Pose des fenêtres, 2e et 3e étages',.4,.9,{u:1}],['Pose des fenêtres d’attique et réglages',.85,1]],
  '224':[['Pare-vapeur et isolation de toiture',0,.5],['Étanchéité, relevés et sorties de toiture',.4,.9],['Essai d’étanchéité de la toiture',.9,1]],
  '226':[['Échafaudages et isolation périphérique',0,.55],['Crépi de fond',.5,.8],['Crépi de finition, teinte selon échantillon validé',.75,1]],
  '228':[['Pose des caissons et des coulisses',0,.6],['Pose des stores et essais',.5,1]],
  '232':[['Tirage des câbles dans les gaines et les dalles',0,.35],['Tableaux d’étage et colonnes montantes',.3,.6],['Appareillage des logements',.6,.9],['Contrôle OIBT et mise en service',.9,1]],
  '242':[['Pompe à chaleur en toiture, capotage acoustique',0,.3],['Distribution de chaleur et collecteurs d’étage',.2,.7],['Mise en service et réglage',.8,1]],
  '244':[['Monoblocs et gaines principales',0,.45],['Gaines des logements',.4,.8],['Mesure des débits et réglage',.8,1]],
  '251':[['Colonnes de chute et d’alimentation',0,.4],['Conduites d’étage, essais de pression',.35,.7],['Pose des appareils sanitaires',.7,1]],
  '258':[['Pose des meubles de cuisine',0,.7],['Plans de travail, appareils et raccordements',.6,1]],
  '261':[['Montage des guides et de la machinerie',0,.5],['Cabine, portes palières et réglages',.45,1]],
  '271':[['Plâtrerie des logements, rez à 2e étage',0,.55],['Plâtrerie du 3e étage et de l’attique',.5,.85],['Cages d’escalier et retouches',.8,1]],
  '273':[['Pose des huisseries',0,.45],['Pose des portes et de la quincaillerie',.4,1]],
  '281.6':[['Carrelages et faïences des salles de bains',0,.6],['Carrelages des cuisines et des halls',.5,1]],
  '281.7':[['Parquet en chêne des séjours et des chambres',.2,.9,{u:1}],['Plinthes et finitions',.85,1]],
  '285':[['Peinture des plafonds et des murs',0,.7],['Cages d’escalier et retouches',.6,1]],
  '287':[['Nettoyage de chantier des logements',0,.6],['Nettoyage de fin de chantier et vitres',.5,1]],
  '421':[['Terre végétale et modelage du terrain',0,.4],['Plantations, arbres de remplacement et gazon',.3,.9],['Cheminements et mobilier extérieur',.7,1]]};
/* images : vue schématique dessinée (aucune photographie), juste assez pour exercer la section et le PDF */
function vueSchematique(etages,o={}){ const c=document.createElement('canvas'); c.width=640; c.height=420; const x=c.getContext('2d'), g=x.createLinearGradient(0,0,0,420); g.addColorStop(0,'#c9d6df'); g.addColorStop(1,'#eef1f3'); x.fillStyle=g; x.fillRect(0,0,640,420);
  x.fillStyle='#8b7d6b'; x.fillRect(0,340,640,80); const h=44, lg=340, bx=150; for(let i=0;i<5;i++){ const y=340-(i+1)*h, plein=i<etages; x.fillStyle=plein?(o.fini?'#e7e0d2':'#9a9a96'):'rgba(255,255,255,.15)'; x.fillRect(bx,y,lg,h-3); if(plein&&(o.fini||i<etages-1)){ x.fillStyle=o.fini?'#3f4a52':'#555'; for(let k=0;k<6;k++) x.fillRect(bx+18+k*54,y+10,32,22); } }
  if(o.grue){ x.strokeStyle='#d7860d'; x.lineWidth=5; x.beginPath(); x.moveTo(90,340); x.lineTo(90,40); x.moveTo(40,60); x.lineTo(560,60); x.stroke(); }
  if(o.saut){ x.fillStyle='#6f6f6a'; x.fillRect(250,300,140,60); x.fillStyle='#3f6f8f'; x.fillRect(262,336,116,16); } return c.toDataURL('image/jpeg',.7); }

async function chantier(ctx,B){ const {R,C,St,F,fait,frR,L,ent,deb,fin}=B, w=await A.cadre(), rng=A.alea(9595);
  const TXT05=w.eval('PV_TXT05'), TXT06=w.eval('PV_TXT06'), COURT=new Set(w.eval('PV_CFC_COURT').map(x=>x[0])), gen=w.eval('PV_GEN_DEFAUT()');
  const pvId=()=>'x'+Array.from({length:7},()=>'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(rng()*36)]).join('');
  const contact=id=>DS.get('contact',id)||{}, tel=id=>{ const c=contact(id); return [c.PHONEAREA2||c.PHONEAREA1,c.PHONENUMBER2||c.PHONENUMBER1].filter(Boolean).join(' '); }, mail=id=>contact(id).EMAIL1||'';
  const bc=contact(ctx.bureau.contact), fact=ctx.mo.nom+', p.a. '+ctx.bureau.nom+', '+[bc.STREET,[bc.POSTALCODE,bc.LOCATION].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  gen.forEach(g=>{ g.x=g.x.split('(à compléter)').join(fact); });

  /* lots du chantier : une clé PV par lot, plus 281.7 Parquet, seconde position du lot des sols */
  const CFC=[]; R.lots.forEach(l=>{ [l.pv,...l.dg.map(x=>x.cfc).filter(c=>c!==l.pv&&COURT.has(c))].forEach(c=>CFC.push({c,l,e:ctx.ent[l.k][0]})); });
  const ordre=(a,b)=>String(a).localeCompare(String(b),undefined,{numeric:true}); CFC.sort((a,b)=>ordre(a.c,b.c));
  const cfg={lieu:`${R.adresse.rue}, ${R.adresse.npa} ${R.adresse.loc} (ECA ${R.eca})`,heure:'08:30',numDeb:0,cfc:CFC.map(x=>x.c),ent:{},interv:[],gen};
  CFC.forEach(({c,l,e})=>{ cfg.ent[c]={soc:e.nom,resp:e.pers.nom,tel:tel(e.pers.contact),email:mail(e.pers.contact),adj:l.contrat!=null}; });
  const iv=(grp,role,soc,p,d)=>{ const it={id:pvId(),grp,role,soc,nom:p.nom,tel:tel(p.contact),email:mail(p.contact),d}; cfg.interv.push(it); return it; };
  const I={pres:iv('mo',"Maître de l'ouvrage",ctx.mo.nom,ctx.mo.pers.pres,true),dir:iv('mo','Représentante du maître de l’ouvrage',ctx.mo.nom,ctx.mo.pers.dir,true),
    arch:iv('mand','Architectes',ctx.bureau.nom,{nom:St.cdp.nom,contact:St.cdp.person},true),dt:iv('mand','Direction des travaux',ctx.bureau.nom,{nom:St.dt.nom,contact:St.dt.person},true),
    ing:iv('mand',ctx.mand.ing.metier,ctx.mand.ing.nom,ctx.mand.ing.pers,true),cvse:iv('mand',ctx.mand.cvse.metier,ctx.mand.cvse.nom,ctx.mand.cvse.pers,true),geom:iv('mand',ctx.mand.geom.metier,ctx.mand.geom.nom,ctx.mand.geom.pers,false),phys:iv('mand',ctx.mand.phys.metier,ctx.mand.phys.nom,ctx.mand.phys.pers,false),
    chef:iv('ext','Service technique communal',ctx.commune.nom,ctx.commune.pers.chef,true)};

  /* chronique : un PV par entrée ; d = date de la séance (Pentecôte : le mardi). Les pauses de la construction sautent une échéance */
  const f=k=>jm(fin(k)), dd=k=>jm(deb(k));
  const CH=[
   {d:'2025-03-03',m:'Couvert, 7°',av:'Ouverture du chantier ce jour. Installation en cours : clôture, baraque, raccordements provisoires. Démolition du garage commencée.',pl:`Planning général remis à toutes les entreprises. Réception visée le ${fr(C.reception)}.`},
   {d:'2025-03-17',m:'Ensoleillé, 11°',av:'Démolitions avancées, tri des matériaux en cours. Terrassements : décapage de la terre végétale commencé ce jour.'},
   {d:'2025-03-31',m:'Averses, 9°',av:`Démolitions terminées le ${f('112')}. Fouille en pleine masse en cours dans la zone sud, évacuation des déblais par camions.`},
   {d:'2025-04-14',m:'Ensoleillé, 16°',av:'Fouille sud terminée, fouille nord ralentie par le rocher. Grue en cours de montage, gros œuvre commencé ce jour.',hs:`Constat du ${frR('2025-04-02')} avec l’ingénieur civil et l’entreprise. ${fait('2025-04-02')}`,sec:'Périmètre du brise-roche balisé, protection auditive obligatoire dans la zone nord.'},
   {d:'2025-04-28',m:'Nuageux, 14°',av:`Terrassements terminés le ${f('201')}, fond de fouille réceptionné par l’ingénieur civil. Canalisations sous radier en cours.`,ap:`Hors séance : ${ctx.mand.geol.pers.nom} était aussi présent au constat du rocher.`},
   {d:'2025-05-12',m:'Ensoleillé, 19°',av:'Canalisations sous radier terminées et contrôlées. Béton de propreté coulé, armature du radier en cours.'},
   {d:'2025-05-26',m:'Nuageux, 17°',av:'Radier coulé en deux étapes. Coffrage des murs du sous-sol commencé.'},
   {d:'2025-06-10',m:'Pluie, 13°',av:'Pluies persistantes : bétonnage des murs du sous-sol reporté deux fois. Fouille pompée en continu.',sec:'Talus de fouille contrôlés après les pluies, accès nord fermé jusqu’à nouvel avis.'},
   {d:'2025-06-23',m:'Orages, 21°',av:'Murs du sous-sol terminés à 80 %. Le retard sur le planning de gros œuvre se confirme.',pl:'Retard dû aux intempéries de juin. L’entreprise de gros œuvre renforcera son équipe à la reprise d’août.',hs:`${St.anc.nom} quitte le bureau le ${fr(R.equipe.find(x=>x.sortie).sortie)} ; ${St.cdp.nom} reprend ses dossiers.`},
   {d:'2025-07-07',m:'Ensoleillé, 28°',av:'Murs du sous-sol terminés. Dalle sur sous-sol coffrée et armée, bétonnage cette semaine.',vac:'Vacances de la construction : chantier fermé du 21.07 au 08.08.2025, reprise le 11.08.2025.'},
   {d:'2025-08-18',m:'Ensoleillé, 27°',av:'Reprise après les vacances de la construction, équipe de gros œuvre renforcée. Dalle sur sous-sol décoffrée, murs du rez-de-chaussée en cours.',img:{e:1,grue:1,c:'Gros œuvre, état au 18.08.2025 (vue schématique)'}},
   {d:'2025-09-01',m:'Nuageux, 22°',av:'Dalle sur rez-de-chaussée coulée. Murs du 1er étage en cours.'},
   {d:'2025-09-15',m:'Pluie, 17°',av:'Dalle sur 1er étage coulée. Murs du 2e étage en cours.',sec:'Garde-corps provisoires à contrôler à chaque étage avant décoffrage.'},
   {d:'2025-09-29',m:'Ensoleillé, 18°',av:'Dalle sur 2e étage coulée. Murs du 3e étage en cours.',pl:`Fin du gros œuvre attendue le ${fr(fin('211'))}.`},
   {d:'2025-10-13',m:'Brouillard, 11°',av:'Dalle sur 3e étage coulée, murs de l’attique commencés. Pose des fenêtres commencée ce jour au rez-de-chaussée.',ap:'Réservation de la colonne de ventilation du 2e étage à reporter sur le plan, indice C.'},
   {d:'2025-10-27',m:'Couvert, 9°',av:`Dalle de toiture coulée le ${jm('2025-10-24')}. Repli de la grue cette semaine. Installations électriques commencées ce jour.`},
   {d:'2025-11-10',m:'Pluie, 8°',av:`${fait('2025-10-31')} Étanchéité de toiture, chauffage et sanitaires commencés le ${dd('224')}, ventilation ce jour.`},
   {d:'2025-11-24',m:'Neige fondante, 2°',av:'Fenêtres : rez-de-chaussée et 1er étage posés, livraison des deux étages suivants décalée. Colonnes techniques en cours.',pl:'Le retard des fenêtres ne touche pas le début de la plâtrerie. Réception inchangée.',hs:fait('2025-11-20')},
   {d:'2025-12-08',m:'Couvert, 4°',av:`Étanchéité de toiture terminée le ${f('224')}. Étages décalés livrés, pose en cours. Colonnes sanitaires et de chauffage en cours.`,vac:'Fermeture de fin d’année du 22.12.2025 au 02.01.2026.',sec:'Salage des accès à la charge de l’entreprise de gros œuvre jusqu’à la fermeture.'},
   {d:'2026-01-05',m:'Neige, -2°',av:`Reprise du chantier. Fenêtres posées (fin le ${f('221')}), bâtiment hors d’eau et hors d’air. Plâtrerie commencée ce jour.`},
   {d:'2026-01-19',m:'Ensoleillé, 1°',av:`Isolation périphérique commencée le ${dd('226')} sur les façades sud et est. Plâtrerie en cours au rez-de-chaussée et au 1er étage.`},
   {d:'2026-02-02',m:'Couvert, 3°',av:'Isolation périphérique sur les façades nord et ouest. Plâtrerie au 2e étage, colonnes contrôlées avant fermeture des gaines.'},
   {d:'2026-02-16',m:'Neige, 0°',av:'Crépi de fond commencé. Plâtrerie du 3e étage en cours.',hs:fait('2026-02-12'),pl:`Mutation ${F.m4} sans effet sur la date de réception.`},
   {d:'2026-03-02',m:'Ensoleillé, 8°',av:'Crépi de fond en cours. Plâtrerie de l’attique. Ascenseur : montage des guides commencé ce jour.'},
   {d:'2026-03-16',m:'Giboulées, 7°',av:'Crépi de finition en cours. Stores : pose commencée ce jour.'},
   {d:'2026-03-30',m:'Ensoleillé, 13°',av:`Plâtrerie et crépissage terminés le ${f('271')}, échafaudages démontés. Revêtements de sols commencés ce jour.`,ap:'Teinte du crépi de la façade ouest : retouche demandée par le maître de l’ouvrage.'},
   {d:'2026-04-13',m:'Nuageux, 12°',av:`Stores terminés le ${f('228')}. Carrelages des salles de bains en cours. Parquet : livraison du chêne confirmée.`},
   {d:'2026-04-27',m:'Ensoleillé, 17°',av:`Ascenseur terminé le ${f('261')}, contrôle par l’organisme d’inspection à venir. Portes intérieures commencées le ${dd('273')}.`},
   {d:'2026-05-11',m:'Orages, 18°',av:'Infiltration constatée ce jour au sous-sol. Parquet et carrelages en cours dans les étages.',hs:fait('2026-05-11'),img:{e:5,fini:1,saut:1,c:'Saut-de-loup du sous-sol, état au 11.05.2026 (vue schématique)'},sec:'Sous-sol : câbles provisoires relevés du sol pendant l’assèchement.'},
   {d:'2026-05-26',m:'Ensoleillé, 22°',av:`Ventilation terminée le ${f('244')}. Sols, portes et chauffage en fin de travaux.`},
   {d:'2026-06-08',m:'Nuageux, 21°',av:`Sols, portes et chauffage terminés le ${f('281')}. Cuisines en cours depuis le ${dd('258')}. Peinture commencée ce jour. Reprise du saut-de-loup terminée.`},
   {d:'2026-06-22',m:'Ensoleillé, 29°',av:`Sanitaires terminés le ${f('251')}. Mises en service de la ventilation et de la production de chaleur faites.`},
   {d:'2026-07-06',m:'Ensoleillé, 31°',av:`Courant fort et cuisines terminés le ${f('232')}. Peinture en fin de travaux.`,vac:'Vacances de la construction : chantier fermé du 20.07 au 31.07.2026.'},
   {d:'2026-08-03',m:'Ensoleillé, 26°',av:'Reprise du chantier. Aménagements extérieurs commencés ce jour. Dernières retouches de peinture.'},
   {d:'2026-08-17',m:'Couvert, 24°',av:'Nettoyage du bâtiment commencé ce jour. Plantations en cours, arbres de remplacement posés.',pl:`Réception de l’ouvrage le ${fr(C.reception)}, toutes les entreprises convoquées.`},
   {d:C.reception,m:'Ensoleillé, 23°',av:`${fait('2026-08-31')} Les réserves sont reprises par entreprise ci-dessous.`,pl:`Permis d’habiter attendu le ${fr(C.permis.habiter)}. Premiers locataires le ${F.locataires}.`,img:{e:5,fini:1,c:'Façade sud à la réception (vue schématique)'}}];
  const D=CH.map(x=>x.d); D.forEach((d,i)=>{ if(!A.ouvre(d)) throw new Error('PV de chantier un jour non ouvré : '+d); if(i&&d<=D[i-1]) throw new Error('PV de chantier non chronologique : '+d); });
  if(D[0]!==C.debutTravaux) throw new Error('premier PV de chantier ≠ début des travaux');

  /* documents : à transmettre (section 03) dès du, transmis (section 02) à la date au */
  const DOC=[['2025-03-03','2025-03-14','Ingénieur civil','plans de fouille et de soutènement'],['2025-03-17','2025-04-11','Ingénieur civil','plans de coffrage et d’armature du radier'],['2025-04-28','2025-05-16','Ingénieurs CVSE','plans de réservations des dalles du sous-sol'],
    ['2025-05-12','2025-06-06','ARCH','plans d’exécution du sous-sol et du rez-de-chaussée'],['2025-06-23','2025-08-15','Ingénieur civil','plans d’armature des dalles d’étage'],['2025-08-18','2025-09-12',ent('221'),'plans d’atelier des fenêtres, pour approbation'],
    ['2025-09-15','2025-10-03','ARCH','détails d’étanchéité de la toiture et des acrotères'],['2025-10-13','2025-10-24',ent('232'),'schémas des tableaux électriques'],['2025-11-10','2025-11-28',ent('221'),'planning de livraison des fenêtres, confirmé par écrit'],
    ['2025-12-08','2026-01-16','ARCH','plans de façades avec calepinage de l’isolation et des stores'],['2026-01-19','2026-02-13',ent('261'),'plans de montage de l’ascenseur'],['2026-02-16','2026-03-06','ARCH',`plans de pose du parquet en chêne, mutation ${F.m4}`],
    ['2026-03-16','2026-04-10',ent('258'),'plans d’agencement des cuisines par type de logement'],['2026-04-13','2026-05-08','Ingénieurs CVSE','procès-verbaux de réglage de la ventilation'],['2026-06-08','2026-07-03','Toutes les entreprises','dossiers de révision et notices d’entretien'],
    ['2026-07-06','2026-08-14','Géomètre','plan de mise à jour de la mensuration'],['2026-08-03',null,'Toutes les entreprises','attestations de conformité pour le permis d’habiter']];
  const LIV=[['2025-04-15','Grue à tour : transport annoncé à la commune, accès fermé le matin'],['2025-05-08','Aciers d’armature du radier, semi-remorque à 7 h'],['2025-10-20','Fenêtres du rez-de-chaussée et du 1er étage'],['2025-11-17','Pompe à chaleur, levage en toiture par grue mobile'],
    ['2026-03-03','Cabine et guides de l’ascenseur'],['2026-04-01','Parquet en chêne, à stocker au sec au sous-sol'],['2026-06-02','Cuisines, livraison par logement'],['2026-08-04','Arbres et terre végétale']];
  const RQ=[['2025-06-10','Plans d’armature du radier : l’indice B remplace l’indice A.'],['2025-09-15','Plans d’atelier des fenêtres : renvoyés avec remarques sur les seuils de l’attique.'],['2026-03-16','Calepinage de l’isolation : approuvé sans remarque.'],['2026-06-22','Réglage de la ventilation : mesure à refaire au logement 3.2.']];
  /* remarques de section : affichées de du à au ; elles font paraître la section si le lot n'est pas encore en cours */
  const REM=[['201','2025-04-14','2025-04-28',`Rocher plus dur que prévu dans la fouille nord : minage interdit, plus-value ${F.t7} au métré contradictoire.`],['211.6','2025-06-10','2025-08-18','Bétonnage interrompu par les pluies de juin, renfort d’équipe à la reprise.'],
    ['221','2025-11-24','2025-12-19',`Livraison de deux étages décalée, plus-value ${F.t8} validée par la direction des travaux.`],['281.7','2026-02-16','2026-04-13',`Mutation ${F.m4} : parquet en chêne à la place du parquet prévu.`],['258','2026-02-16','2026-04-13',`Mutation ${F.m4} : cuisines concernées à chiffrer avec les sols.`],
    ['211.6','2026-05-11','2026-06-08','Infiltration en sous-sol après l’orage : étanchéité du saut-de-loup à reprendre.']];
  /* réserves de la réception : reprises par entreprise au dernier PV */
  const RES=[['211.6','Fissure du mur de la rampe à reboucher'],['221','Réglage de la fenêtre du séjour, logement 2.3'],['221','Joint de seuil à reprendre, logement 1.4'],['226','Retouche du crépi de la façade ouest'],['232','Prise de la cave n° 7 à contrôler'],['244','Grille de ventilation à fixer, logement 3.2'],['251','Siphon de la salle de bains à resserrer, logement 2.1'],
    ['258','Porte de meuble à régler, logement 1.2'],['261','Bruit de la porte palière du 2e étage'],['271','Reprise d’enduit dans la cage d’escalier'],['273','Porte palière à régler, logement 3.1'],['281.7','Plinthe à reposer, logement 2.4'],['285','Retouche de peinture du hall d’entrée'],['421','Regarnir le gazon le long du chemin']];
  if(String(RES.length)!==F.res) throw new Error('réserves : '+RES.length+' ≠ récit '+F.res);

  const Et=new Map(CFC.map(({c,l})=>{ const [t0,t1]=l.trav, n=A.jour(t1)-A.jour(t0), dat=v=>typeof v==='string'?v:A.plus(t0,Math.round(v*n));
    return [c,(ETAPES[c]||[]).map(([v,a,b,o])=>({v,deb:dat(a),fin:dat(b),...(o||{})}))]; }));
  CFC.forEach(({c})=>{ if(!(Et.get(c)||[]).length) throw new Error('étapes absentes pour le CFC '+c); });
  const iFin=e=>{ const i=D.findIndex(d=>d>=e.fin); return i<0?D.length:i; };
  const lignes=(c,i)=>{ const d=D[i], Ls=[];
    Et.get(c).forEach(e=>{ const i0=iFin(e); if(i>i0) return; if(i===i0){ Ls.push({k:'fini',v:e.v,d:''}); return; } if(A.jour(e.deb)>A.jour(d)+21) return;
      const x={k:'exec',v:e.v,d:(e.deb>d?'D sem. ':'F sem. ')+semIso(e.deb>d?e.deb:e.fin)}; if(e.u&&e.deb<=d) x.u=e.u; Ls.push(x); });
    REM.filter(r=>r[0]===c&&r[1]<=d&&d<=r[2]).forEach(r=>Ls.push({k:'rem',v:r[3],d:''}));
    return Ls; };
  const actif=(c,d)=>{ const E=Et.get(c), n=A.jour(d); return E.some(e=>A.jour(e.deb)-10<=n&&n<=A.jour(e.fin)+7); };
  const ras=()=>[{k:'t',v:'Ràs.'}], tx=v=>({k:'t',v}), liste=L=>L.length?L:ras();
  const HEURES=['8:30','9:00','9:30','10:00','10:30'];

  const pvs=CH.map((x,i)=>{ const d=x.d, dp=i?D[i-1]:'0000-00-00', dn=D[i+1]||A.prochainOuvre(A.plus(d,14)), num=i;
    const fait02=DOC.filter(z=>z[1]&&dp<z[1]&&z[1]<=d).map(z=>tx(`${z[2]} : ${z[3]}, transmis le ${jm(z[1])}.`));
    const af03=DOC.filter(z=>z[0]<=d&&(!z[1]||d<z[1])).map(z=>tx(`${z[2]} : ${z[3]}${z[1]?`, délai ${jm(z[1])}.`:'.'}`));
    const rq=RQ.filter(z=>dp<z[0]&&z[0]<=d).map(z=>tx(z[1])), liv=LIV.filter(z=>d<=z[0]&&z[0]<=dn).map(z=>tx(`${jm(z[0])} : ${z[1]}`));
    const sCfc=CFC.map(({c})=>({cfc:c,lines:lignes(c,i)})).filter(s=>s.lines.length);
    if(i===D.length-1) RES.forEach(([c,v],k)=>{ let s=sCfc.find(y=>y.cfc===c); if(!s){ s={cfc:c,lines:[]}; sCfc.push(s); } s.lines.push({k:'exec',v:'Réserve n° '+(k+1)+' : '+v,d:'F sem. '+semIso(A.plus(d,28))}); });
    sCfc.sort((a,b)=>ordre(a.cfc,b.cfc));
    const secs=[{t:'01. AVANCEMENT DES TRAVAUX',lines:[tx(x.av)]},{t:'02. DOCUMENTS TRANSMIS',lines:liste(fait02)},{t:'03. DOCUMENTS À TRANSMETTRE',lines:liste(af03)},{t:'04. REMARQUES SUR DOCUMENTS TRANSMIS',lines:liste(rq)},
      {t:'05. À TOUS LES INTERVENANTS',lines:[tx(TXT05)]},{t:'06. SÉCURITÉ',lines:[tx(x.sec?TXT06.replace(/Ràs\.$/,x.sec):TXT06)]},{t:'07. VACANCES',lines:x.vac?[tx(x.vac)]:ras()},{t:'08. LIVRAISON SUR LE CHANTIER',lines:liste(liv)},{t:'09. TRAVAUX À EFFECTUER',lines:[]},
      ...sCfc,{t:'10. PLANNING',lines:[tx(x.pl||'Planning général sans changement.')]},{t:'11. HORS SÉANCE',lines:x.hs?[tx(x.hs)]:ras()},
      {t:'12. IMAGES DU CHANTIER',img2:true,lines:x.img?[{k:'img',v:vueSchematique(x.img.e,x.img),c:x.img.c}]:[]}];
    /* présences : entreprises du moment présentes (quelques excusées ou absentes), les autres en distribution ; convoquées si elles travaillent à la prochaine séance */
    const pres={}, presH={}; let h=0;
    pres['i'+I.pres.id]='D'; pres['i'+I.dir.id]=i%4===0?'DP':'D'; pres['i'+I.arch.id]=i%3===1?'DE':'DP'; pres['i'+I.dt.id]='DP';
    pres['i'+I.ing.id]=d<=fin('211')?(i%2?'DP':'DE'):'D'; pres['i'+I.cvse.id]=d>='2025-10-13'&&d<=fin('232')?'DP':'D'; pres['i'+I.geom.id]=''; pres['i'+I.phys.id]=''; pres['i'+I.chef.id]='D';
    CFC.forEach(({c})=>{ const k='c'+c; let v='D'; if(actif(c,d)){ const t=rng(); v+=t<.08?'E':t<.11?'A':'P'; } if(actif(c,dn)&&i<D.length-1){ v+='C'; presH[k]=HEURES[Math.min(Math.floor(h++/3),HEURES.length-1)]; } pres[k]=v; });
    const pv={id:pvId(),num,date:d,redac:i<D.length-1?A.prochainOuvre(A.plus(d,1)):d,heure:cfg.heure,meteo:x.m,statut:i<D.length-1?'definitif':'annotation',prochaine:longue(i<D.length-1?dn:C.permis.habiter),
      approb:i?`Le procès-verbal PVCH${String(num-1).padStart(3,'0')} de la séance du ${jma(dp)} est approuvé:`:'',approbMode:x.ap?'avec':'sans',approbRem:x.ap||'',presH,pres,secs};
    return pv; });

  /* dernier PV : marques d'auteur à valider, deux collaborateurs (profil collaborateur : ils ne peuvent pas valider eux-mêmes) */
  const der=pvs[pvs.length-1], m=(k,h)=>({u:St[k].user,n:St[k].nom,le:der.date+'T'+h}), sec=c=>der.secs.find(s=>s.cfc===c), sect=t=>der.secs.find(s=>s.t&&s.t.startsWith(t));
  der._a=1; der._ent=m('tech','09:40');
  sec('287').lines.push({k:'exec',v:'Vitres du rez-de-chaussée à refaire après les plantations',d:'F sem. '+semIso(A.plus(der.date,7)),_a:m('tech','10:05')});
  sec('421').lines.push({k:'rem',v:'Portail du jardin à repeindre',d:'',_sup:m('arch','10:12')});
  sec('221').lines.push({k:'exec',v:'Contrôle de toutes les poignées de fenêtres avant la remise des clés',d:'Sat',_a:m('arch','10:18')});
  sect('11.').lines=[{k:'t',v:'Visite du service technique annoncée avant le permis d’habiter.',_a:m('tech','10:30')}]; sect('11.')._a=m('tech','10:30');

  const ok=await A.appel(S=>{ pvData[S.code]=S.A; return pvPersist(); },{code:R.code,A:{cfg,pvs}});
  if(!ok) throw new Error('PV de chantier : stockage plein');
  return {n:pvs.length,taille:JSON.stringify({cfg,pvs}).length}; }

A.mod(95,'suivi','Séances, PV MO, notes, tâches, PV de chantier',async ctx=>{
  await DS.need(['meetingtype','projectmeetingtype','meetingsequence','meeting','meetingparticipant','meetingitem','projectnote','projecttask','projecttasknote']).catch(()=>null);
  if(ctx.pid==null) throw new Error('affaire absente : le module 20 doit passer avant');
  const B=socle(ctx), K=constructeur(ctx,B), series=seances(ctx,B,K), nSe=K.nb.seances, mo=pvMo(ctx,B,K);
  await A.commit(K.ops); await A.sauverRegistre();
  const N=notes(ctx,B); await A.commit(N.ops); await A.sauverRegistre();
  const T=taches(ctx,B); await A.commit(T.ops); await A.sauverRegistre();
  const P=await chantier(ctx,B);
  ctx.suivi={genres:{coord:K.genre(/coordination/i),autorites:K.genre(/autorit/i),comite:K.genre(/projet/i),chantier:K.genre(/^séance de chantier$/i),mo:K.genre(/ma[iî]tre/i)},series,seriesMO:mo.ser,seances:nSe,pvMO:mo.n,notes:N.n,taches:T.n,pvChantier:P.n};
  A.log('suivi :',nSe+' séances, '+mo.n+' PV MO, '+N.n+' notes, '+T.n+' tâches ('+T.nt+' notes de tâche), '+P.n+' PV de chantier ('+Math.round(P.taille/1024)+' Ko)');
});
})();

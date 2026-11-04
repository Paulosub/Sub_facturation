/* ═══ AFFAIRE DE TRAVAIL 99TST — MODULE 60 : FEUILLE D'HEURES ET FRAIS (04.11.2026) ═══
   Crée, d'après AT.REF (phases, faisabilité, répartition, calendrier, lots, récit, factures) :
   - timelog de l'affaire, 1 100 à 1 300 lignes : heures de chaque phase = heures au contrat × part saisie, réparties entre collaborateurs selon REF.repartition,
     dans le calendrier de la phase, jours ouvrés hors fériés, 08:00–12:00 et 13:00–17:30, sans aucun chevauchement, entrée et départ respectés (le compte courant
     a déjà des heures presque chaque jour dans la base : ses lignes sont de petits blocs posés dans ses trous). Chaque ligne a l'activité et le commentaire de ce jour-là : faits du récit à leur date (lignes « épinglées »),
     séance de chantier du lundi, descriptifs, offres, contrats et contrôles lot par lot aux dates de REF.lots ;
   - timelog de vacances (ISHOLIDAY, une ligne par jour comme le moteur) des collaborateurs fictifs, y compris la fermeture de fin d'année du bureau ;
   - états : approuvées sauf les 30 derniers jours (à contrôler), quelques refusées et corrigées ; quelques heures non facturables ; ISCHARGED / CHARGEDDATE d'après les
     pourcentages cumulés des factures de REF.factures (heures hors contrat : la facture hors contrat) ;
   - projectcost, une cinquantaine de lignes : déplacements, copies, maquette, taxes, facturés ou non, à rembourser ou non. Les frais facturés d'une note de frais
     totalisent exactement son montant TTC de REF.factures.
   Option A de la checklist (§ 4.3) : pas d'heures hors affaire pour les collaborateurs fictifs, donc tirets rouges au Contrôle des heures et bouclement négatif.

   Ajoute à ctx :
   ctx.heures    {lignes, heures, parPhase:{n:heures}, vacances:<lignes de vacances>}
   ctx.depenses  {lignes, ht, facture:{'<date de la note>':TTC}} */
(function(){
const A=window.AT;
const MATIN=[480,720], APREM=[780,1050];   /* 08:00–12:00, 13:00–17:30 */
const DUREES=[[240,30],[270,22],[180,10],[120,12],[150,8],[210,6],[90,6],[60,4],[45,2]];   /* minutes, poids : moyenne ≈ 3,3 h par ligne */
const DUREES_ME=[[120,3],[90,4],[60,4],[45,2]];   /* le compte courant a déjà ses journées dans la base : petits blocs, dans ses trous */
const OFF={dess:2,appr:3};   /* jour sans heures : mercredi à 80 %, jeudi aux cours professionnels */
const ETAPES={'211':['radier et murs du sous-sol','dalle sur sous-sol','rez-de-chaussée','étages','attique et acrotères']};   /* avancement du gros œuvre, clé = REF.lots[].k */
const LIBS_VAC=['Vacances d’été','Vacances de février','Vacances de printemps','Vacances d’automne','Fermeture du bureau'];
const libVac=j=>{ const m=+j.slice(5,7); return m===12?LIBS_VAC[4]:m===7||m===8?LIBS_VAC[0]:m<=2?LIBS_VAC[1]:m<=6?LIBS_VAC[2]:LIBS_VAC[3]; };
/* vacances par collaborateur : du, au (une date seule = après-midi) ; 2025 ≈ droit annuel ; 2026 : une semaine reste pour la fin de l'année */
const VACANCES={
  cdp:[['2023-07-17','2023-08-04'],['2024-07-22','2024-08-02'],['2025-02-17','2025-02-21'],['2025-04-17'],['2025-07-21','2025-08-08'],['2026-02-16','2026-02-20'],['2026-07-20','2026-08-07']],
  arch:[['2023-07-31','2023-08-18'],['2024-08-12','2024-08-30'],['2025-04-14','2025-04-18'],['2025-07-28','2025-08-15'],['2026-02-09','2026-02-13'],['2026-08-03','2026-08-21']],
  dess:[['2023-07-10','2023-07-28'],['2024-07-15','2024-07-26'],['2025-02-10','2025-02-14'],['2025-07-14','2025-08-01'],['2026-04-07','2026-04-10'],['2026-07-13','2026-07-31']],
  dt:[['2023-07-17','2023-08-04'],['2024-07-15','2024-08-02'],['2025-02-17','2025-02-21'],['2025-07-21','2025-08-08'],['2026-02-23','2026-02-27'],['2026-04-20','2026-04-24'],['2026-07-20','2026-07-31'],['2026-10-12','2026-10-16']],
  tech:[['2023-07-24','2023-08-11'],['2024-07-29','2024-08-16'],['2025-03-31','2025-04-04'],['2025-08-04','2025-08-22'],['2026-02-16','2026-02-20'],['2026-07-20','2026-08-07']],
  appr:[['2024-07-15','2024-08-02'],['2025-04-07','2025-04-11'],['2025-07-14','2025-08-08'],['2026-04-07','2026-04-10'],['2026-07-13','2026-08-07']],
  anc:[['2023-08-07','2023-08-25'],['2024-07-22','2024-08-02'],['2025-02-24','2025-02-28']]};

const tirer=(rng,L)=>{ let r=rng()*L.reduce((a,x)=>a+x[1],0); for(const x of L){ r-=x[1]; if(r<0) return x[0]; } return L[L.length-1][0]; };
/* découpe un total en blocs, en quarts d'heure */
const decouper=(tot,rng,D=DUREES)=>{ const L=[], mx=Math.max(...D.map(x=>x[0])); let r=tot; while(r>0){ let d=Math.min(tirer(rng,D),r); if(r-d<45) d=r<=mx?r:r-45; L.push(d); r-=d; } return L; };   /* pas de reste de moins de 45 min */
/* répartition en entiers, au plus fort reste */
const repartir=(tot,poids)=>{ const s=poids.reduce((a,b)=>a+b,0)||1, ex=poids.map(p=>tot*p/s), L=ex.map(Math.floor); let r=Math.round(tot-L.reduce((a,b)=>a+b,0));
  ex.map((v,i)=>[v-L[i],i]).sort((a,b)=>b[0]-a[0]).slice(0,r).forEach(([,i])=>L[i]++); return L; };
const dd=n=>String(n).padStart(2,'0');
const isoDe=r=>r.TIMEYEAR+'-'+dd(r.TIMEMONTH+1)+'-'+dd(r.TIMEDAY);
const low=s=>s.charAt(0).toLowerCase()+s.slice(1);
const dans=(d,a,b)=>(!a||d>=a)&&(!b||d<=b);
const ini=p=>p.prenom.charAt(0)+'. '+p.nom;
const trous=(L,[x,y])=>{ const G=[]; let c=x; L.filter(i=>i[1]>x&&i[0]<y).sort((p,q)=>p[0]-q[0]).forEach(([a,b])=>{ if(a>c) G.push([c,a]); c=Math.max(c,b); }); if(c<y) G.push([c,y]); return G; };

/* vigilance sur la purge : les vacances n'ont pas de PROJECT_ID ; si une génération s'arrête avant la sauvegarde du registre, elles restent sans collaborateur */
A.purgeurs.push(async()=>{ const L=DS.all('timelog').filter(r=>r.ISHOLIDAY&&LIBS_VAC.includes(r.DESCRIPTION)&&!DS.get('staff',r.STAFF_ID)); if(L.length) await DS.commit(L.map(r=>({t:'timelog',id:r.ID,val:null}))); });

/* ── textes : activité → entrées ; g = textes fixes, f = textes calculés à la date ──
   qui = clés de REF.equipe + me, séparées par des espaces (sans qui : tous sauf me et appr) ; du, au = période où le texte a un sens ; nf = heures non facturables */
const g=(qui,du,au,L,nf)=>L.map(t=>({t,du,au,qui:qui?qui.split(' '):null,nf:!!nf}));
const f=(qui,fn)=>[{fn,qui:qui?qui.split(' '):null}];
const MO="avec le maître de l'ouvrage", MAND='avec les mandataires spécialisés', AUT='avec les autorités', ENT="avec l'entreprise";

/* points de contrôle propres à chaque lot (clé = REF.lots[].k), pour le suivi de chantier */
const DET={
  '112':['Constat d’état des lieux avant démolition','Contrôle du tri des matériaux de démolition'],
  '201':['Réception du fond de fouille','Contrôle des niveaux de terrassement','Contrôle de l’évacuation des matériaux'],
  '211':['Contrôle des armatures avant bétonnage','Réception du radier','Contrôle de l’implantation des murs du sous-sol','Contrôle des réservations dans les dalles','Bétonnage de la dalle sur rez : présence sur place','Contrôle de la maçonnerie des étages'],
  '221':['Contrôle de la pose des fenêtres','Réception de la fenêtre type sur place','Contrôle des seuils et des raccords d’étanchéité'],
  '224':['Contrôle de l’étanchéité de toiture : essai de mise en eau','Contrôle des relevés et de l’acrotère'],
  '226':['Échantillons de crépi : choix de la teinte sur place','Contrôle de la pose de l’isolation de façade'],
  '228':['Contrôle de la pose des stores et des coulisses'],
  '232':['Contrôle des tubes électriques avant fermeture','Implantation des prises dans l’appartement témoin'],
  '242':['Contrôle de la distribution de chaleur en dalle','Mise en service de la production de chaleur'],
  '244':['Contrôle du tracé des gaines de ventilation'],
  '251':['Contrôle des essais de pression sanitaires','Contrôle des colonnes de chute'],
  '258':['Contrôle de la pose des cuisines','Implantation des cuisines : relevé sur place'],
  '261':['Montage de l’ascenseur : contrôle de la gaine'],
  '271':['Contrôle des gypsages et des cloisons','Réception des plafonds avant peinture'],
  '273':['Contrôle de la pose des portes palières'],
  '281':['Contrôle des chapes avant pose des revêtements','Échantillons de carrelage dans l’appartement témoin','Contrôle de la pose des parquets'],
  '285':['Contrôle des teintes dans les communs'],
  '287':['Contrôle du nettoyage de fin de chantier'],
  '421':['Contrôle des plantations et des cheminements']};

function textes(ctx){
  const R=A.REF, C=R.calendrier, P=C.permis, dR=re=>{ const x=R.recit.find(e=>re.test(e.t)); if(!x) throw new Error('récit : '+re); return x.d; };
  const moP=c=>R.mo.personnes.find(x=>x.cle===c), mandP=c=>R.mandataires.find(x=>x.cle===c).personne;
  const sortante=R.equipe.find(e=>e.sortie), dir=ini(moP('dir')), chef=ini(R.commune.personnes[0]), ing=ini(mandP('ing')), cvse=ini(mandP('cvse')), geom=ini(mandP('geom')), phys=ini(mandP('phys')), geol=ini(mandP('geol'));
  const J={variantes:dR(/Trois variantes/),conseil:dR(/conseil de fondation/),sondages:dR(/Sondages géotechniques/),apValide:dR(/Avant-projet validé/),parking:dR(/places de parc/),oppos:dR(/oppositions/),rocher:dR(/Rocher plus dur/),depart:dR(/^Départ de/),finGO:dR(/Fin du gros œuvre/),
    fenetres:dR(/Retard des fenêtres/),parquet:dR(/parquet chêne/),infiltration:dR(/Infiltration/),adj1:dR(/Premières adjudications/),devis:C.devisValide};
  const ph=n=>R.phases.find(x=>x.n===n), ap=(d,n)=>A.plus(d,n), adj=R.lots.filter(l=>l.ao);
  /* lots en cours un jour donné, du plus récent au plus ancien : les travaux qui commencent sont ceux dont on parle */
  const actifs=d=>R.lots.filter(l=>dans(d,ap(l.trav[0],-10),ap(l.trav[1],10))).sort((a,b)=>b.trav[0].localeCompare(a.trav[0]));
  const parLot=fn=>d=>actifs(d).slice(0,5).flatMap(fn);
  const POOLS={
  2:{ 'Planification/Travail de création':[
      ...g('cdp arch',null,J.variantes,['Analyse du site : orientation, accès, vues et dégagements','Variante A : barre en bordure de parcelle, plans de principe','Variante B : plot avec attique, coupes de principe','Variante C : deux plots, étude des prospects','Implantation des variantes sur le plan cadastral','Esquisses de volumétrie et maquette de travail']),
      ...g('cdp arch',J.variantes,J.conseil,['Variante B : distribution des logements par étage','Variante B : étude de l’attique et de ses retraits','Variante B : accès au parking et position de la rampe','Ombres portées de la variante B aux équinoxes et solstices','Planches de présentation pour le conseil de fondation']),
      ...g('cdp arch',J.conseil,null,['Variante B : mise au net des plans après le conseil de fondation'])],
    'Affaire/Projet':[
      ...g('cdp arch',null,J.variantes,['Lecture du règlement communal et de l’extrait RDPPF','Contrôle des distances aux limites et de la hauteur à la corniche','Calcul des indices et des surfaces de plancher des variantes']),
      ...g('cdp arch',J.variantes,J.conseil,['Estimation sommaire du coût au m³ des trois variantes','Tableau comparatif des surfaces habitables par variante','Mise en page du dossier de présentation']),
      ...g('cdp arch',J.conseil,null,['Rédaction de la fiche de faisabilité','Coût de l’attique : estimation demandée par le conseil de fondation','Mise au net des plans et des tableaux de surfaces','Relecture et correction de la fiche de faisabilité']),
      ...g('me',null,null,['Relecture des variantes avec l’équipe','Relecture de la fiche de faisabilité'])],
    ['Séance/'+MO]:[
      ...g('cdp arch me',null,J.variantes,['Point d’avancement avec '+dir+' : premières esquisses']),
      ...g('cdp arch me',J.variantes,J.conseil,['Séance MO : approfondissement de la variante B','Préparation de la présentation au conseil de fondation','Point d’avancement avec '+dir+' : coût et calendrier']),
      ...g('cdp me',J.conseil,null,['Séance MO : suites de la présentation au conseil de fondation','Point avec '+dir+' sur la fiche de faisabilité'])]},

  31:{ 'Planification/Projet':[
      ...g('cdp arch dess',null,J.sondages,['Report du plan du géomètre et des niveaux du terrain','Plans d’avant-projet 1:200 : rez-de-chaussée et étages types','Trame porteuse et noyaux de circulation','Implantation du parking souterrain : rampe et trame','Plan de situation et aménagements extérieurs 1:500','Modèle 3D de l’avant-projet : mise en place']),
      ...g('cdp arch dess',ap(J.sondages,-7),null,['Plans d’avant-projet : coupes et façades','Attique : plan et retraits','Plans des étages : répartition des logements','Tableaux des surfaces SIA 416 par logement','Calcul du volume bâti SIA 416','Modèle 3D de l’avant-projet : mise à jour']),
      ...g('cdp arch dess',J.sondages,null,['Reprise du niveau du radier après les sondages','Sous-sol : adaptation au rocher relevé au nord de la parcelle']),
      ...g('arch dess',ap(J.apValide,-16),null,['Mise en page du dossier d’avant-projet','Impression et assemblage du dossier d’avant-projet']),
      ...g('cdp arch dess',null,null,['Reprise du modèle 3D après une erreur de niveaux'],1)],
    'Planification/Travail de création':[
      ...g('cdp arch',null,null,['Recherche de typologies pour les logements traversants','Expression des façades : rythme des ouvertures','Étude des matériaux de façade','Esquisses des loggias et des balcons','Hall d’entrée et cage d’escalier : principes','Lumière naturelle dans les séjours','Insertion dans le site : vues depuis le chemin','Aménagements extérieurs : arbres, cheminements, place de jeux']),
      ...g('dess',null,null,['Vues d’ambiance de la façade sud','Élévations de principe des loggias'])],
    'Affaire/Projet':[
      ...g('cdp arch',null,null,['Programme des locaux : mise au point avec le cahier de la fondation','Calendrier général de l’étude','Mandats des spécialistes : demandes d’offres','Contrôle incendie AEAI : distances de fuite','Accessibilité : contrôle selon la norme SIA 500','Compte rendu de séance et liste des décisions']),
      ...g('cdp',ap(J.apValide,-30),null,['Estimation de l’avant-projet : quantités par CFC','Estimation de l’avant-projet : relecture et notice explicative']),
      ...g('me',null,null,['Relecture de l’avant-projet avec la cheffe de projet','Contrôle de l’estimation avant envoi'])],
    ['Séance/'+MO]:[
      ...g('cdp arch me',null,ap(J.sondages,-1),['Séance MO : programme et typologies','Séance MO : expression des façades','Préparation de la séance avec le maître de l’ouvrage']),
      ...g('cdp arch me',J.sondages,null,['Séance MO : résultats des sondages','Séance MO : estimation de l’avant-projet','Préparation de la séance avec le maître de l’ouvrage'])],
    ['Entretien/'+MAND]:[
      ...g('cdp arch',null,J.sondages,['Coordination avec '+ing+' : trame porteuse','Entretien avec '+geol+' : programme des sondages','Commande du plan de base à '+geom]),
      ...g('cdp arch',J.sondages,null,['Entretien avec '+geol+' : résultats, rocher au nord','Entretien avec '+phys+' : exigences acoustiques','Point avec '+cvse+' : gaines et local technique','Coordination avec '+ing+' : radier et murs du sous-sol'])]},

  32:{ 'Planification/Projet':[
      ...g('cdp arch dess anc',null,ap(ph(32).au,-10),['Plans 1:100 : sous-sol et parking','Plans 1:100 : rez-de-chaussée','Plans 1:100 : étages types','Plans 1:100 : attique et toiture','Coupes 1:100 sur les cages d’escalier','Coupe longitudinale sur la rampe du parking','Façades 1:100 : nord et est','Façades 1:100 : sud et ouest','Caves et locaux techniques : distribution du sous-sol','Local vélos et poussettes','Ascenseur : gaine, cuvette et machinerie','Cuisines types : implantation et gaines','Salles de bains types : plans et élévations','Mise à jour du modèle 3D','Tableau des surfaces locatives','Coordination des plans avec les gaines CVSE','Intégration des plans de l’ingénieur civil','Plan des aménagements extérieurs 1:200']),
      ...g('arch anc',null,null,['Détails de façade 1:20 : principe de l’isolation crépie','Détail de l’acrotère et de la toiture plate','Détails 1:20 des loggias','Principe du saut-de-loup et des drainages']),
      ...g('cdp arch dess anc',J.parking,null,['Parking : étude des places supplémentaires demandées par le maître de l’ouvrage','Parking : reprise de la trame et de la rampe','Sous-sol : mise à jour des plans après ajout de places','Mise à jour des surfaces SIA 416 après modifications'],1),
      ...g('dess anc',ap(ph(32).au,-25),null,['Dossier d’enquête : plan de situation','Dossier d’enquête : plans, coupes et façades au 1:100','Profils du terrain pour le dossier d’enquête','Impression des plans de contrôle'])],
    'Projet/Direction générale':[
      ...g('cdp me',null,null,['Coordination interne : répartition des plans','Contrôle des plans avant diffusion','Point avec l’équipe : liste des modifications','Suivi des honoraires et des heures de la phase']),
      ...g('cdp',null,J.parking,['Planning général : étapes jusqu’au dépôt de la demande']),
      ...g('cdp me',J.parking,null,['Analyse de l’effet des places supplémentaires sur le planning','Note au maître de l’ouvrage : conséquences des places supplémentaires','Planning de la mise à l’enquête : mise à jour']),
      ...g('arch anc',null,null,['Contrôle croisé des plans d’étages','Liste des points ouverts avec les mandataires','Répertoire des plans : mise à jour','Relecture des coupes avec les façades','Contrôle des cotes de niveaux entre les étages','Suivi des remarques de la cheffe de projet sur les plans','Comparaison des plans avec le programme des locaux'])],
    'Affaire/Projet':[
      ...g('cdp arch anc',null,null,['Descriptif sommaire de l’ouvrage','Concept incendie : voies de fuite et compartiments','Justificatif thermique : données pour le calcul','Concept d’évacuation des eaux','Places de jeux et espaces verts : contrôle du règlement','Calcul du stationnement selon le règlement communal','Mise à jour de l’estimation des coûts','Liste des matériaux pour le maître de l’ouvrage','Contrôle de l’accessibilité des logements']),
      ...g('cdp arch',ap(ph(32).au,-25),null,['Questionnaire général de la demande de permis','Questionnaires particuliers : énergie, protection incendie, eaux'])],
    ['Séance/'+MAND]:[
      ...g('cdp arch anc me',null,null,['Séance de coordination des mandataires','Préparation de la séance de coordination','Procès-verbal de la séance de coordination']),
      ...g('cdp arch anc',null,null,['Séance avec '+ing+' : radier et murs du sous-sol','Séance avec '+ing+' : porte-à-faux des loggias','Séance avec '+cvse+' : production de chaleur et distribution','Séance avec '+cvse+' : ventilation et gaines techniques','Séance avec '+phys+' : séparatifs entre logements','Séance avec '+geom+' : implantation et servitudes'])],
    ['Séance/'+MO]:[
      ...g('cdp arch me',null,J.parking,['Séance MO : plans d’étages et cuisines','Séance MO : façades et matériaux','Préparation du dossier de séance MO']),
      ...g('cdp arch me',J.parking,null,['Séance MO : mise à jour de l’estimation','Séance MO : plans du sous-sol avec les places supplémentaires','Séance MO : matériaux et teintes de façade','Séance MO : aménagements extérieurs et place de jeux','Séance MO : validation du projet de l’ouvrage avant dépôt','Compte rendu de la séance MO','Préparation du dossier de séance MO'])]},

  33:{ 'Projet/Demande de permis de construire':[
      ...g('cdp dess',null,P.enqD,['Contrôle des pièces du dossier CAMAC','Compléments demandés par le service technique','Profilement : pose des gabarits avec le géomètre','Avis d’enquête : publication et affichage']),
      ...g('cdp dess',P.enqD,P.synthese,['Suivi de la circulation du dossier CAMAC','Questionnaires particuliers : compléments','Plans complémentaires pour le service de l’énergie']),
      ...g('cdp dess',P.synthese,P.decision,['Plans modifiés pour les charges de l’ECA','Réponse aux charges de la DGE','Mise à jour du dossier après la synthèse CAMAC']),
      ...g('cdp dess',P.decision,null,['Report des conditions du permis dans les plans','Copie du dossier autorisé pour les archives','Liste des charges à reporter dans les appels d’offres']),
      ...g('me',null,null,['Relecture du dossier de demande de permis'])],
    'Projet/Traitement des oppositions':[
      ...g('cdp',J.oppos,P.decision,['Opposition sur la hauteur : note de réponse','Opposition sur les arbres : plan des plantations compensatoires','Détermination à l’attention de la Municipalité','Préparation de la séance de conciliation','Réponse à l’observation reçue pendant l’enquête'])],
    ['Entretien/'+AUT]:[
      ...g('cdp me',null,J.oppos,['Entretien avec '+chef+' : gabarits et hauteurs','Téléphone à la CAMAC : état du dossier']),
      ...g('cdp me',J.oppos,null,['Point avec '+chef+' sur les oppositions','Entretien avec le service technique : suites de l’enquête','Entretien avec '+chef+' : conditions du permis'])]},

  41:{ "Exécution/Dossier d'appel d'offres":[
      ...g('cdp tech dt anc',null,ap(adj[0].ao.envoi,-1),['Découpage des lots et calendrier des appels d’offres','Liste des entreprises à consulter avec la direction des travaux','Conditions générales des appels d’offres']),
      ...g('cdp tech dt anc',P.decision,null,['Report des charges du permis dans les descriptifs','Contrôle du devis général par lot']),
      ...f('cdp tech dt anc',d=>adj.filter(l=>dans(d,ap(l.ao.envoi,-42),ap(l.ao.envoi,-1))).flatMap(l=>['Descriptif '+low(l.lib)+' : rédaction des articles','Descriptif '+low(l.lib)+' : métrés et quantités','Relecture du dossier d’appel d’offres '+low(l.lib),'Plans joints à l’appel d’offres '+low(l.lib),'Conditions particulières du lot '+l.lot+' '+low(l.lib)]))],
    "Exécution/Envoi d'appels d'offres":[
      ...f('cdp tech dt anc',d=>adj.filter(l=>dans(d,ap(l.ao.envoi,-2),ap(l.ao.envoi,1))).map(l=>'Envoi de l’appel d’offres '+low(l.lib)+' à '+l.ent.length+' entreprises')),
      ...f('cdp tech dt anc',d=>adj.filter(l=>dans(d,ap(l.ao.envoi,4),ap(l.ao.retour,-1))).map(l=>'Questions des entreprises : '+low(l.lib)))],
    'Exécution/Comparaison des offres':[
      ...f('cdp tech dt anc',d=>adj.filter(l=>dans(d,l.ao.retour,ap(l.ao.retour,28))).flatMap(l=>['Ouverture et contrôle arithmétique des offres '+low(l.lib),'Comparatif des offres '+low(l.lib)+' : '+l.ent.length+' entreprises','Rapport d’adjudication '+low(l.lib)])),
      ...g('me',null,null,['Relecture des rapports d’adjudication','Contrôle des comparatifs avec la cheffe de projet','Avis sur les propositions d’adjudication'])],
    "Exécution/Négociation d'adjudication":[
      ...f('cdp dt me',d=>adj.filter(l=>dans(d,ap(l.ao.retour,7),l.adj)).flatMap(l=>['Négociation avec '+l.ent[0].n+' : '+low(l.lib),'Rabais et délais : discussion avec '+l.ent[0].resp]))],
    "Exécution/Contrat d'entreprise":[
      ...g('cdp dt tech',null,null,['Modèle de contrat d’entreprise : conditions SIA 118','Garanties et sûretés à demander aux entreprises']),
      ...f('cdp dt tech',d=>adj.filter(l=>dans(d,ap(l.ao.retour,7),l.adj)).flatMap(l=>['Contrat d’entreprise '+low(l.lib)+' : annexes et programme','Contrat d’entreprise avec '+l.ent[0].n]))]},

  51:{ "Planification/Préparation de l'exécution":[
      ...g('tech arch dess',null,ap(ph(51).du,60),['Plans d’exécution 1:50 : sous-sol','Plans d’exécution 1:50 : rez-de-chaussée','Plans de maçonnerie : murs et réservations du sous-sol','Contrôle des plans de coffrage de l’ingénieur','Contrôle des plans d’armature du radier','Détail du saut-de-loup et des drainages','Implantation des gaines et des colonnes de chute','Réservations CVSE : report sur les plans']),
      ...g('tech arch dess',ap(ph(51).du,40),null,['Plans d’exécution 1:50 : étages types','Plans d’exécution 1:50 : attique','Coupes d’exécution 1:50','Mise en plan des coupes de façade 1:20','Détails 1:5 : seuils et fenêtres','Détails 1:5 : acrotère et étanchéité','Détails 1:5 : loggias et garde-corps','Plans de pose des cuisines','Plans de carrelage des salles de bains','Plan de plafonds et éclairage des communs','Liste des portes : types et ferrements','Liste des fenêtres : dimensions et vitrages','Plans des serrureries : garde-corps et mains courantes','Synthèse CVSE des étages types','Mise à jour du modèle après les adjudications','Appartement témoin : plans de pose']),
      ...g('tech arch dess',null,null,['Correction interne des cotes du sous-sol'],1),
      ...g('appr',null,ap(ph(51).du,70),['Report des réservations sur les plans du sous-sol','Mise au net des plans de maçonnerie','Dessin des détails de seuils sous contrôle']),
      ...g('appr',ap(ph(51).du,50),null,['Mise au net des plans d’étages','Liste des portes : saisie','Dessin des plans de carrelage sous contrôle','Mise à jour du répertoire des plans']),
      ...g('appr',null,null,['Lecture des plans d’armature avec le technicien'],1),
      ...g('me',null,null,['Relecture des plans d’exécution','Contrôle des détails de façade','Relecture des plans de pose des cuisines','Contrôle des plans du rez-de-chaussée','Avis sur le détail de l’acrotère','Revue des plans de carrelage'])],
    'Exécution/Planification des délais':[
      ...g('tech arch',null,null,['Planning des plans d’exécution','Planning général des travaux : mise à jour','Liste des plans à livrer par étape','Planning d’intervention des entreprises de gros œuvre'])],
    'Exécution/Saisie des métrés':[
      ...g('tech arch dess appr',null,null,['Métrés de la maçonnerie','Métrés des fenêtres','Métrés des crépis de façade','Quantités de carrelage par logement','Métrés des cloisons en plâtre','Surfaces de parquet par logement','Quantités de peinture'])],
    ['Séance/'+MAND]:[
      ...g('tech arch',null,null,['Séance de coordination technique avant chantier','Séance de coordination : passages techniques des étages','Procès-verbal de la séance de coordination technique','Séance avec '+ing+' : plans de coffrage','Séance avec '+cvse+' : synthèse des gaines','Séance avec '+phys+' : détails des séparatifs','Séance avec '+geom+' : implantation du bâtiment']),
      ...g('me',null,null,['Point de coordination avec l’équipe du projet d’exécution','Revue des détails de façade avec le technicien','Revue de la liste des plans à livrer'])]},

  52:{ ['Séance/'+ENT]:[
      ...f('cdp tech dt',parLot(l=>['Rendez-vous sur place avec '+l.ent[0].resp+' : '+low(l.lib),'Séance de coordination entre entreprises : '+low(l.lib)])),
      ...f('cdp tech dt',d=>actifs(d).filter(l=>dans(d,ap(l.trav[0],-10),ap(l.trav[0],7))).map(l=>'Mise en route du lot '+low(l.lib)+' avec '+l.ent[0].resp)),
      ...g('appr',null,null,['Participation à la séance de chantier avec la directrice des travaux','Visite de chantier avec le technicien : lecture des plans sur place','Suivi de la formation : relevé d’un logement sur le chantier'],1),
      ...g('dt',J.rocher,ap(J.rocher,24),['Rocher : séance avec l’entreprise de terrassement et l’ingénieur civil']),
      ...g('dt',J.fenetres,ap(J.fenetres,28),['Retard des fenêtres : point de livraison avec le fournisseur']),
      ...g('dt cdp',J.infiltration,ap(J.infiltration,21),['Saut-de-loup : séance sur place avec l’entreprise de gros œuvre'])],
    'Exécution/Contrôle du coût':[
      ...g('dt cdp',null,null,['Contrôle des coûts : mise à jour mensuelle','Prévision du coût final pour le maître de l’ouvrage','Réserves pour imprévus : état et prévisions','Rapport financier au maître de l’ouvrage','Suivi des mutations et des plus-values']),
      ...f('dt cdp tech',parLot(l=>['Contrôle des coûts : situation du lot '+low(l.lib),'Bons de régie '+low(l.lib)+' : contrôle et saisie','Offre complémentaire '+low(l.lib)+' : analyse'])),
      ...g('dt cdp',J.rocher,ap(J.rocher,35),['Plus-value de terrassement : analyse et prise sur les réserves','Brise-roche : contrôle des quantités journalières']),
      ...g('dt cdp',J.fenetres,ap(J.fenetres,40),['Plus-value des fenêtres : contrôle et validation']),
      ...g('dt cdp',J.parquet,ap(J.parquet,35),['Mutation parquet chêne : offre complémentaire et incidence sur les cuisines','Parquet : décompte de la plus-value pour le maître de l’ouvrage'])],
    'Exécution/Comptabilisation des paiements':[
      ...g('dt cdp tech',null,null,['Récapitulatif des paiements pour la fondation','Échéancier des paiements : mise à jour','Retenues de garantie : état par entreprise','Paiements du mois : liste pour la fondation']),
      ...f('dt tech',parLot(l=>['Demande d’acompte '+l.ent[0].n+' : contrôle et visa','Bon de paiement '+l.ent[0].n,'Situation de travaux '+low(l.lib)+' : contrôle']))],
    'Projet/Direction générale':[
      ...g('dt',null,null,['Journal de chantier','Contrôle de la sécurité du chantier','Rapport photographique pour le maître de l’ouvrage']),
      ...f('dt cdp tech',d=>actifs(d).slice(0,5).flatMap(l=>(DET[l.k]||[]).concat('Visite de chantier : '+low(l.lib)))),
      ...g('dt',J.rocher,ap(J.rocher,24),['Rocher dans la fouille nord : suivi du brise-roche','Fouille nord : contrôle des parois avec l’ingénieur civil']),
      ...g('dt',ap(J.finGO,-125),J.finGO,['Gros œuvre : rattrapage du retard dû aux intempéries']),
      ...g('cdp',J.depart,ap(J.depart,28),['Reprise des dossiers de '+ini(sortante),'Dossiers repris : relecture des points ouverts avec l’équipe'],1),
      ...g('dt cdp',J.fenetres,ap(J.fenetres,28),['Retard des fenêtres : protection provisoire des baies']),
      ...g('dt',J.infiltration,ap(J.infiltration,35),['Infiltration en sous-sol : suivi de la reprise d’étanchéité','Courrier à l’entreprise de gros œuvre : prise en charge de la reprise','Saut-de-loup : contrôle après remise en état']),
      ...g('dt',ap(ph(52).au,-30),null,['Préparation de la réception : liste des travaux à terminer']),
      ...g('me',null,null,['Visite de chantier de l’architecte associé','Point de situation avec la directrice des travaux','Relecture du rapport financier avant envoi','Contrôle des mutations avec la cheffe de projet','Point sur les heures de la phase d’exécution','Relecture du courrier au maître de l’ouvrage','Visite de contrôle des finitions de l’appartement témoin'])],
    'Exécution/Saisie des métrés':[
      ...f('dt tech appr',parLot(l=>['Métré contradictoire '+low(l.lib),'Contrôle des métrés de l’entreprise : '+low(l.lib)]))],
    'Exécution/Planification des délais':[
      ...g('dt tech cdp',null,null,['Planning des travaux : mise à jour','Planning d’intervention des entreprises du mois']),
      ...f('dt tech',parLot(l=>['Planning d’intervention : '+low(l.lib)])),
      ...g('dt cdp',ap(J.finGO,-125),J.finGO,['Planning du gros œuvre : incidence des intempéries']),
      ...g('dt',J.fenetres,ap(J.fenetres,28),['Nouveau planning de livraison des fenêtres'])]},

  53:{ 'Projet/Documentation':[
      ...g('dt cdp',C.reception,P.habiter,['Attestations de conformité pour le permis d’habiter','Suivi de la liste des réserves de réception']),
      ...g('dt cdp',null,null,['Dossier de l’ouvrage : plans conformes à l’exécution','Dossier de l’ouvrage : schémas CVSE et sanitaires','Dossier de révision : notices d’entretien des installations','Classement des garanties et des attestations des entreprises','Liste des entreprises et des garanties pour la gérance','Mise à jour du dossier pour l’ECA','Contrôle de la levée des réserves : relevé sur place','Rapport final de l’ouvrage pour la fondation'])],
    'Exécution/Comptabilisation des paiements':[
      ...f('dt cdp',()=>R.lots.filter(l=>l.contrat).flatMap(l=>['Facture finale '+l.ent[0].n+' : contrôle','Décompte final '+low(l.lib)+' : contrôle des métrés'])),
      ...g('dt cdp',C.reception,null,['Garanties bancaires : réception et classement'])],
    'Exécution/Contrôle du coût':[
      ...g('dt cdp',null,null,['Décompte final : comparaison du devis et du coût effectif','Décompte final : ventilation par CFC','Clôture des positions du contrôle des coûts','Rapport de décompte final pour le maître de l’ouvrage'])],
    ['Séance/'+MO]:[
      ...g('dt cdp me',C.reception,null,['Visite de levée des réserves avec '+dir,'Séance MO : état des réserves et remise des clés','Remise du dossier de l’ouvrage à la fondation','Séance MO : décompte final en cours']),
      ...g('me',null,null,['Relecture du décompte final avec la cheffe de projet'])]}};
  return {POOLS,J,actifs,DET};
}

A.mod(60,'heures','Heures et frais',async ctx=>{
  const R=A.REF, C=R.calendrier, P=C.permis, auj=R.aujourdhui, pid=ctx.pid, rng=A.alea(6060), ap=A.plus;
  await DS.need(['timelog','projectcost','publicholiday']);
  if(pid==null||!ctx.actPhase) throw new Error('module 20 requis');
  const S=ctx.staff, moi=ctx.me&&ctx.me.staff!=null&&!!S.me, recS=cle=>DS.get('staff',S[cle].id);
  const present=(cle,j)=>{ const s=recS(cle), e=String(s.JOININGDATE||'').slice(0,10), q=String(s.QUITTINGDATE||'').slice(0,10); return (!e||e<=j)&&(!q||j<=q); };
  const seuil=ap(auj,-30);   /* les 30 derniers jours restent à contrôler */

  /* ── occupation : chaque plage prise, toutes affaires confondues ── */
  const occ=new Map(), oc=(s,j)=>{ const k=s+'|'+j; if(!occ.has(k)) occ.set(k,[]); return occ.get(k); };
  for(const cle of [...Object.keys(S),...(moi?['me']:[])]) DS.by('timelog','STAFF_ID',S[cle].id).forEach(r=>oc(S[cle].id,isoDe(r)).push([r.TIMEHOUR1*60+r.TIMEMINUTE1,r.TIMEHOUR2*60+r.TIMEMINUTE2]));
  const poser=(sid,j,d,pref)=>{ const L=oc(sid,j); for(const f of pref==='pm'?[APREM,MATIN]:[MATIN,APREM]) for(const [a,b] of trous(L,f)) if(b-a>=d){ const jeu=b-a-d, deb=jeu>=15&&rng()<.3?a+Math.floor(rng()*(jeu/15+1))*15:a; L.push([deb,deb+d]); return deb; } return null; };

  /* ── vacances : d'abord, elles retirent les jours des collaborateurs ── */
  const vac=new Map(), ops=[], lignesVac=[];
  const vacance=(cle,j,demi)=>{ const k=cle+'|'+j, sid=S[cle].id; if(vac.has(k)) return; vac.set(k,1); const a=demi?APREM[0]:MATIN[0], b=demi?APREM[1]:510+MATIN[0]; oc(sid,j).push(demi?APREM:[MATIN[0],APREM[1]]);
    lignesVac.push({sid,j,a,b}); };
  for(const [cle,L] of Object.entries(VACANCES)){ for(const [du,au] of L){ if(!au){ vacance(cle,du,true); continue; } A.joursOuvres(du,au).filter(j=>present(cle,j)&&A.semaine(j)!==OFF[cle]).forEach(j=>vacance(cle,j)); }
    for(let y=+C.debutAffaire.slice(0,4);y<+auj.slice(0,4);y++) A.joursOuvres(y+'-12-24',y+'-12-31').filter(j=>present(cle,j)&&A.semaine(j)!==OFF[cle]).forEach(j=>vacance(cle,j)); }
  const peut=(cle,j)=>A.ouvre(j)&&present(cle,j)&&A.semaine(j)!==OFF[cle]&&!vac.has(cle+'|'+j);

  /* ── objectifs par phase et par collaborateur, en quarts d'heure ── */
  const FA=R.faisabilite, phases=[{n:FA.groupe,h:FA.h,saisi:FA.saisi,du:FA.du,au:FA.au},...R.phases], parN=Object.fromEntries(phases.map(p=>[p.n,p])), reste={};
  for(const p of phases){ const E=Object.entries(R.repartition[p.n]).reduce((m,[k,v])=>{ const c=k==='me'&&!moi?'cdp':k; m[c]=(m[c]||0)+v; return m; },{}), cles=Object.keys(E), q=Math.round(p.h*p.saisi*4), L=repartir(q,cles.map(k=>E[k]));
    reste[p.n]=Object.fromEntries(cles.map((k,i)=>[k,L[i]*15])); }

  const {POOLS,J,actifs}=textes(ctx), lignes=[], decales=[];
  const fen=n=>parN[n];
  /* ligne fixée d'avance : fait du récit, séance. Si le collaborateur est absent ce jour-là, le jour ouvré le plus proche dans la phase. */
  const ep=(cle,n,j0,d,act,t,o={})=>{ if(cle==='me'&&!moi) return false; const sid=S[cle].id, F=fen(n), cands=[0]; for(let k=1;k<=(o.loin||12);k++) cands.push(k,-k);
    for(const k of cands){ const j=ap(j0,k); if(!dans(j,F.du,F.au)||!peut(cle,j)) continue; const a=poser(sid,j,d,o.pm?'pm':'am'); if(a==null) continue;
      if(k) decales.push((o.ref||t).slice(0,40)+' '+j0+'→'+j); if(!ctx.act[act]) throw new Error('activité inconnue : '+act); lignes.push({cle,sid,n,j,a,b:a+d,act,t,nf:!!o.nf,cd:o.cd||null,fixe:1}); reste[n][cle]=(reste[n][cle]||0)-d; return true; }
    decales.push('non placé : '+t.slice(0,40)+' '+j0); return false; };
  const SM='Séance/'+MO, SE='Séance/'+ENT, CP='Projet/Demande de permis de construire', OPP='Projet/Traitement des oppositions', CTR="Exécution/Contrat d'entreprise", PE="Planification/Préparation de l'exécution", DG='Projet/Direction générale', CC='Exécution/Contrôle du coût', DOC='Projet/Documentation';
  const moP=c=>R.mo.personnes.find(x=>x.cle===c), dir=ini(moP('dir')), geol=ini(R.mandataires.find(x=>x.cle==='geol').personne), lotK=k=>R.lots.find(l=>l.k===k);

  /* faisabilité */
  ep('cdp',2,FA.du,180,SM,'Séance de lancement avec '+dir+' : programme, budget cible et calendrier');
  ep('arch',2,FA.du,240,'Planification/Travail de création','Relevé du site et rassemblement des documents de base',{pm:1});
  ep('arch',2,J.variantes,240,'Planification/Travail de création','Comparatif des trois variantes : surfaces, hauteurs et ombres portées');
  ep('cdp',2,J.variantes,150,SM,'Séance MO : présentation des variantes A, B et C',{pm:1});
  ep('cdp',2,J.conseil,210,SM,'Présentation au conseil de fondation : variante B retenue, coût de l’attique à préciser',{pm:1});
  ep('me',2,J.conseil,120,SM,'Présentation au conseil de fondation',{pm:1,loin:3});
  ep('cdp',2,C.faisa.factureFinale,120,'Affaire/Projet','Remise de la fiche de faisabilité à la fondation');
  /* mandat, avant-projet */
  const p31=parN[31], p32=parN[32], p41=parN[41], p51=parN[51], p52=parN[52], p53=parN[53];
  ep('cdp',31,C.mandat.signe,180,SM,'Séance de démarrage du mandat : organisation, calendrier, interlocuteurs');
  ep('cdp',31,J.sondages,210,'Entretien/'+MAND,'Sondages géotechniques : présence sur place avec '+geol);
  ep('cdp',31,J.apValide,180,SM,'Séance MO : validation de l’avant-projet et de l’estimation');
  ep('dess',31,p31.au,240,'Secrétariat/Envoi','Envoi du dossier d’avant-projet aux mandataires');
  ep('arch',31,ap(J.apValide,-20),240,'Affaire/Maquette','Maquette d’étude 1:200 : assemblage');
  /* projet de l'ouvrage */
  ep('cdp',32,ap(p32.du,7),120,'Projet/Planification des délais','Planning directeur de l’opération jusqu’à l’emménagement');
  ep('cdp',32,ap(J.parking,-14),90,'Entretien/'+MO,'Entretien téléphonique avec '+dir+' : choix des matériaux');
  ep('arch',32,ap(p32.au,-14),240,'Affaire/Image de synthèse','Image de synthèse de la façade sud pour le dossier d’enquête');
  ep('cdp',32,p32.du,180,'Séance/'+MAND,'Séance de lancement du projet de l’ouvrage avec les mandataires');
  ep('cdp',32,J.parking,150,SM,'Séance MO : demande de places de parc supplémentaires');
  ep('arch',32,J.parking,240,'Planification/Projet','Parking : premières variantes avec les places supplémentaires',{pm:1,nf:1});
  ep('cdp',32,p32.au,210,'Affaire/Projet','Contrôle final du dossier d’enquête avant impression');
  ep('dess',32,p32.au,270,'Secrétariat/Envoi','Impression et assemblage du dossier d’enquête',{pm:1});
  /* procédure d'autorisation */
  ep('dess',33,ap(P.depot,3),120,'Secrétariat/Travaux de secrétariat','Classement du dossier d’enquête et copies pour les archives');
  ep('cdp',33,ap(P.enqD,-11),120,'Séance/'+AUT,'Séance avec la Municipalité : présentation du projet avant l’enquête',{pm:1});
  ep('cdp',33,P.depot,180,CP,'Dépôt de la demande de permis de construire sur la CAMAC');
  ep('cdp',33,P.enqD,120,CP,'Ouverture de l’enquête publique : contrôle de l’affichage au pilier public');
  ep('cdp',33,J.oppos,180,OPP,'Réception et analyse des oppositions et de l’observation');
  ep('cdp',33,P.synthese,180,CP,'Analyse de la synthèse CAMAC : charges de l’ECA et de la DGE');
  ep('cdp',33,A.prochainOuvre(ap(P.decision,-12)),180,OPP,'Séance de conciliation avec les opposants');
  ep('cdp',33,P.decision,150,CP,'Permis de construire délivré : contrôle des conditions',{pm:1});
  ep('cdp',33,P.recours,90,CP,'Fin du délai de recours : attestation de la commune');
  /* appels d'offres */
  ep('cdp',41,C.devisValide,180,"Exécution/Dossier d'appel d'offres",'Devis général validé : découpage définitif des lots avec le maître de l’ouvrage');
  ep('cdp',41,C.mandat.avenant,120,'Affaire/Secrétariat','Avenant n° 1 aux honoraires : préparation sur le nouveau coût de l’ouvrage',{nf:1});
  ep('cdp',41,C.mandat.avenantSigne,60,'Affaire/Secrétariat','Avenant n° 1 aux honoraires : signature et classement',{nf:1,pm:1});
  [...R.lots].filter(l=>l.adj&&l.adj<=p41.au).sort((a,b)=>a.adj.localeCompare(b.adj)).forEach(l=>ep('dt',41,l.adj,150,CTR,'Adjudication '+low(l.lib)+' : signature du contrat avec '+l.ent[0].n));
  /* projet d'exécution, relevé hors contrat */
  ep('tech',51,p51.du,240,PE,'Démarrage du projet d’exécution : organisation des plans');
  { const F=R.factures.find(x=>x.sansContrat), L=F.lignes[0], blocs=[]; let r=L.heures*60; while(r>0){ const d=Math.min(240,r); blocs.push(d); r-=d; }
    blocs.forEach((d,i)=>ep(i%2?'dess':'tech',51,A.prochainOuvre(ap(F.date,-22+i)),d,PE,L.lbl,{cd:F.date})); }
  /* réalisation : séance de chantier du lundi, sauf fermeture du chantier ; la cheffe de projet remplace la directrice des travaux en son absence */
  let nSeances=0;
  for(let d=ap(C.debutTravaux,7);d<=p52.au;d=ap(d,7)){ const j=A.prochainOuvre(d), m=+j.slice(5,7), absente=vac.has('dt|'+j); if(absente&&(m===7||m===8||m===12||m===1)) continue; const noms=actifs(j).slice(0,3).map(l=>{ const E=ETAPES[l.k]; if(!E) return low(l.lib); const k=Math.floor((A.jour(j)-A.jour(l.trav[0]))/(A.jour(l.trav[1])-A.jour(l.trav[0])+1)*E.length); return low(l.lib)+' ('+E[Math.max(0,Math.min(E.length-1,k))]+')'; }).join(', ');
    if(ep(absente?'cdp':'dt',52,j,tirer(rng,[[120,5],[135,2],[150,3]]),SE,'Séance de chantier : '+noms+(absente?' (remplacement de la direction des travaux)':''),{loin:1})) nSeances++; }
  ep('dt',52,C.debutTravaux,240,SE,'Ouverture du chantier : installation, état des lieux, séance de démarrage avec les entreprises');
  ep('dt',52,ap(C.debutTravaux,3),60,'Secrétariat/Achats','Commande du matériel de sécurité pour les visites de chantier',{pm:1});
  ep('dt',52,ap(J.rocher,9),45,'Entretien/'+ENT,'Téléphone à '+lotK('201').ent[0].resp+' : cadence du brise-roche',{pm:1});
  ep('dt',52,ap(J.infiltration,8),45,'Entretien/'+ENT,'Téléphone à '+lotK('211').ent[0].resp+' : reprise du saut-de-loup',{pm:1});
  ep('dt',52,J.rocher,180,DG,'Rocher dans la fouille nord : constat contradictoire, minage interdit');
  ep('cdp',52,J.depart,120,DG,'Passation des dossiers avec '+ini(R.equipe.find(e=>e.sortie)),{nf:1});
  ep('dt',52,J.finGO,180,DG,'Fin du gros œuvre : visite de réception avec l’entreprise',{pm:1});
  ep('dt',52,J.fenetres,180,SE,'Retard des fenêtres : séance avec le fournisseur, nouveau planning');
  ep('cdp',52,J.parquet,150,DG,'Choix du parquet avec le maître de l’ouvrage',{pm:1});
  ep('dt',52,J.infiltration,210,DG,'Infiltration en sous-sol après l’orage : constat et mesures d’urgence');
  ep('dt',52,p52.au,240,DG,'Préparation de la réception : visite de contrôle de tous les logements');
  /* mise en service */
  ep('dt',53,C.reception,270,SM,'Réception de l’ouvrage avec le maître de l’ouvrage et les entreprises',{pm:1});
  ep('cdp',53,C.reception,240,SM,'Réception de l’ouvrage : relevé des réserves');
  ep('me',53,C.reception,165,SM,'Réception de l’ouvrage',{pm:1,loin:3});
  ep('dt',53,P.habiter,120,DOC,'Visite de la commune en vue du permis d’habiter');
  ep('dt',53,ap(P.habiter,17),150,SM,'Remise des clés aux premiers locataires : présence sur place');
  ep('cdp',53,C.decompteFinal,240,CC,'Décompte final : état des entreprises à solder et des garanties reçues');
  ep('dt',53,p53.au,240,CC,'Décompte final : relance des entreprises pour leurs factures finales');
  ep('cdp',53,ap(p53.au,-1),180,DOC,'Dossier de l’ouvrage : relecture avant remise à la fondation',{pm:1});
  ep('me',53,ap(p53.au,-1),90,SM,'Relecture du décompte final avec la cheffe de projet',{loin:2});
  ep('dt',53,ap(p53.au,-1),210,DOC,'Contrôle de la levée des réserves : relevé sur place');

  /* ── le reste, en blocs : tirage stratifié dans le calendrier de la phase, avec des semaines plus ou moins chargées ── */
  const courbe=(n,j)=>n===32?(j>=J.parking?1.35:.8):n===33?(j<=P.decision?1:.3):n===52?(j<=J.finGO?1.15:1):1;
  for(const p of phases) for(const [cle,m] of Object.entries(reste[p.n])){ if(m<=0){ if(m<0) A.log('heures : '+cle+' phase '+p.n+' au-delà de sa part de '+(-m)+' min'); continue; }
    const sid=S[cle].id; let jours=A.joursOuvres(p.du,p.au).filter(j=>peut(cle,j)); if(!jours.length) throw new Error('aucun jour libre : '+cle+' phase '+p.n);
    const bruit=new Map(), w=j=>{ const s=Math.floor(A.jour(j)/7); if(!bruit.has(s)) bruit.set(s,.35+1.3*rng()); return bruit.get(s)*courbe(p.n,j); }, cum=[]; let tot=0; jours.forEach(j=>{ tot+=w(j); cum.push(tot); });
    const blocs=decouper(m,rng,cle==='me'?DUREES_ME:DUREES);
    blocs.forEach((d,i)=>{ const u=(i+rng())/blocs.length*tot; let idx=cum.findIndex(c=>c>=u); if(idx<0) idx=jours.length-1;
      for(let k=0;k<2*jours.length;k++){ const x=idx+(k%2?(k+1)/2:-k/2); if(x<0||x>=jours.length) continue; const a=poser(sid,jours[x],d,d>240||rng()<.45?'pm':'am'); if(a!=null){ lignes.push({cle,sid,n:p.n,j:jours[x],a,b:a+d}); return; } }
      throw new Error('bloc de '+d+' min non placé : '+cle+' phase '+p.n); }); }

  /* ── activité et commentaire, dans l'ordre chronologique : les activités suivent les poids de ctx.actPhase, le texte le moins employé est repris ── */
  const usage=new Map();
  const qualifie=(e,cle)=>e.qui?e.qui.includes(cle):cle!=='me'&&cle!=='appr';
  const eligibles=(n,cle,act,j)=>{ const L=[]; for(const e of POOLS[n][act]||[]){ if(!qualifie(e,cle)) continue; if(e.fn){ e.fn(j).forEach(t=>L.push({t,nf:false,etroit:true})); continue; } if(dans(j,e.du,e.au)) L.push({t:e.t,nf:e.nf,etroit:!!(e.du&&e.au)}); } return L; };
  for(const p of phases){ const Ln=lignes.filter(x=>x.n===p.n).sort((x,y)=>x.j.localeCompare(y.j)||x.a-y.a), tot=Ln.reduce((s,x)=>s+x.b-x.a,0), AC=ctx.actPhase[p.n], fait={};
    AC.forEach(a=>{ fait[a.cle]=0; if(!POOLS[p.n][a.cle]) throw new Error('textes manquants : '+p.n+' '+a.cle); });
    Ln.filter(x=>x.act).forEach(x=>{ if(x.act in fait) fait[x.act]+=x.b-x.a; usage.set(x.t,(usage.get(x.t)||0)+1); });
    for(const x of Ln){ if(x.act) continue;
      const C2=AC.filter(a=>ctx.actOk(x.cle,a.cle)).map(a=>({a,L:eligibles(p.n,x.cle,a.cle,x.j)})).filter(c=>c.L.length).sort((u,v)=>(v.a.poids*tot-fait[v.a.cle])-(u.a.poids*tot-fait[u.a.cle]));
      if(!C2.length){ throw new Error('aucun texte : '+x.cle+' phase '+p.n+' le '+x.j); }
      const c=C2[0], note=e=>(usage.get(e.t)||0)*2-(e.etroit?1:0)+rng(), e=c.L.slice().sort((u,v)=>note(u)-note(v))[0];
      x.act=c.a.cle; x.t=e.t; x.nf=!!e.nf; fait[x.act]+=x.b-x.a; usage.set(e.t,(usage.get(e.t)||0)+1); } }

  /* ── facturé : dans l'ordre des dates, chaque facture couvre la part de la phase qu'elle cumule (factures en attente de validation : pas encore) ── */
  const parDate=(a,b)=>a.date.localeCompare(b.date), clesSia=n=>Object.keys(R.sia).filter(k=>k.slice(1,3)===String(n));
  const fm=R.factures.filter(x=>x.contrat==='mandat'&&x.phases&&!x.validation).sort(parDate);
  for(const p of R.phases){ const K=clesSia(p.n), totC=K.reduce((s,k)=>s+R.sia[k],0), L=lignes.filter(x=>x.n===p.n&&!x.nf&&!x.cd).sort((x,y)=>x.j.localeCompare(y.j)||x.a-y.a), H=L.reduce((s,x)=>s+x.b-x.a,0); let fait=0;
    for(const fa of fm){ const cible=K.reduce((s,k)=>s+(+fa.phases[k]||0),0)/totC*H; for(const x of L){ if(x.cd) continue; if(fait>=cible-.01||x.j>fa.date) break; x.cd=fa.date; fait+=x.b-x.a; } } }
  { const fa=R.factures.find(x=>x.contrat==='faisa'); lignes.filter(x=>x.n===FA.groupe&&!x.nf&&x.j<=fa.date).forEach(x=>x.cd=fa.date); }

  /* ── états ── */
  lignes.forEach(x=>{ x.etat=x.j<seuil?3:0; });
  { const rec=lignes.filter(x=>x.etat===0&&x.cle!=='me'&&!x.fixe).sort((x,y)=>x.j.localeCompare(y.j)||x.a-y.a), VAGUES=['Divers chantier','Administration du dossier'];   /* refusées faute d'un commentaire assez précis */
    [[Math.floor(rec.length*.3),1,VAGUES[0]],[Math.floor(rec.length*.72),1,VAGUES[1]],[Math.floor(rec.length*.15),2],[Math.floor(rec.length*.55),2],[Math.floor(rec.length*.85),2]].forEach(([i,e,t])=>{ const x=rec[i]; if(!x) return; x.etat=e; if(t) x.t=t; }); }

  /* ── écriture des heures ── */
  lignes.sort((x,y)=>x.j.localeCompare(y.j)||x.sid-y.sid||x.a-y.a);
  const ids=A.ids('timelog',lignes.length+lignesVac.length); let ii=0;
  const base=(sid,j,a,b)=>({STAFF_ID:sid,TIMEYEAR:+j.slice(0,4),TIMEMONTH:+j.slice(5,7)-1,TIMEDAY:+j.slice(8,10),TIMEHOUR1:Math.floor(a/60),TIMEMINUTE1:a%60,TIMEHOUR2:Math.floor(b/60),TIMEMINUTE2:b%60,TIMEPERIOD:(b-a)/60,SUBPROJECT_ID:null});
  lignes.forEach(x=>{ const id=ids[ii++], ac=ctx.act[x.act], sub=x.n===FA.groupe?null:ctx.sub[x.n];
    ops.push({t:'timelog',id,val:{ID:id,...base(x.sid,x.j,x.a,x.b),PROJECT_ID:pid,ACTIVITYGROUP_ID:ac.gid,ACTIVITY_ID:ac.id,PHASE_ID:sub==null?ctx.phases[x.n]:ctx.phaseDeSub[x.n],SUBPHASE_ID:sub,DESCRIPTION:x.t,ISCHARGEABLE:x.nf?0:1,ISCHARGED:x.cd?1:0,ISHOLIDAY:0,TIMELOGSTATECODE:x.etat,CHARGEDDATE:x.cd||null}}); });
  lignesVac.sort((x,y)=>x.j.localeCompare(y.j)).forEach(x=>{ const id=ids[ii++];
    ops.push({t:'timelog',id,val:{ID:id,...base(x.sid,x.j,x.a,x.b),PROJECT_ID:null,ACTIVITYGROUP_ID:null,ACTIVITY_ID:null,PHASE_ID:null,SUBPHASE_ID:null,DESCRIPTION:libVac(x.j),ISCHARGEABLE:1,ISCHARGED:0,ISHOLIDAY:1,TIMELOGSTATECODE:x.j<seuil?3:0,CHARGEDDATE:null}}); });
  await A.commit(ops); await A.sauverRegistre();

  /* ── frais : qui a payé (rembourser) ou qui a fait les copies (au bureau) ; externe = facture reçue par le bureau ; n = phase ── */
  const G={km:'Frais de déplacement/Kilomètres voiture privé',park:'Frais de déplacement/Tickets de parking',billet:'Frais de déplacement/Billet',pn:'Frais de copie/Plotter noir /blanc',pc:'Frais de copie/Plotter couleur',a4:'Frais de copie/A4 noir/blanc',a4c:'Frais de copie/A4 couleur',a3:'Frais de copie/A3 noir/blanc',a3c:'Frais de copie/A3 couleur',poste:'Frais de copie/Poste',dossier:'Frais de copie/Dossier',fourn:'Frais du bureau/Fourniture',repr:'Frais du bureau/Représentation',adm:'Frais admin/Frais web, literature, poste',fonc:'Frais admin/Facture de fonctionnement'};
  const FR=[], noteF=R.factures.filter(x=>x.noteFrais).sort(parDate); let pieceN=0;
  const fl=(j,qui,g0,q,prix,desc,n,o={})=>FR.push({j:A.prochainOuvre(j),qui,genre:G[g0],q,prix,desc,n,...o});
  const nC=R.lots.filter(l=>l.adj).sort((a,b)=>a.adj.localeCompare(b.adj));
  /* faisabilité : contrat sans frais, rien de facturable */
  fl('2023-03-02','arch','km',18,null,'Visite du site et relevé photographique',2,{nf:1});
  fl(ap(J.conseil,-5),'arch','pc',6,null,'Planches pour le conseil de fondation',2,{nf:1,bureau:1});
  fl(J.conseil,'cdp','a3c',60,null,'Dossier de présentation au conseil de fondation',2,{nf:1,bureau:1});
  fl(ap(C.faisa.factureFinale,-1),'cdp','a4c',48,null,'Fiche de faisabilité, quatre exemplaires',2,{nf:1,bureau:1});
  /* avant-projet, projet */
  fl(ap(C.mandat.signe,10),null,'adm',1,45,'Extrait du registre foncier, parcelle '+R.parcelle,31,{tva:0});
  fl(ap(C.mandat.signe,23),'cdp','km',24,null,'Visite du site avec le géomètre',31);
  fl(J.sondages,'cdp','park',1,12,'Stationnement pendant les sondages géotechniques',31);
  fl(J.sondages,'arch','km',16,null,'Sondages géotechniques',31);
  fl(ap(J.apValide,-25),'arch','fourn',1,186.5,'Maquette d’étude 1:200 : carton et bois',31);
  fl(ap(J.apValide,-5),'dess','pn',12,null,'Plans d’avant-projet',31,{bureau:1});
  fl(ap(J.apValide,-3),'dess','a3c',60,null,'Dossier d’avant-projet pour le maître de l’ouvrage',31,{bureau:1});
  fl(ap(J.apValide,-3),'dess','dossier',4,14,'Reliures du dossier d’avant-projet',31,{bureau:1});
  fl(ap(J.parking,-20),'cdp','billet',1,38.6,'Visite d’un immeuble de référence avec le maître de l’ouvrage',32);
  fl(ap(J.parking,3),'dess','pn',14,null,'Plans du sous-sol après ajout de places',32,{bureau:1});
  fl(ap(J.parking,24),null,'fourn',1,960,'Maquette du projet 1:100 : découpe et socle',32,{nf:1});
  fl(ap(P.depot,-4),'dess','pc',18,null,'Dossier d’enquête, plans en couleur',32,{bureau:1});
  fl(ap(P.depot,-3),'dess','a4',260,null,'Questionnaires et annexes du dossier d’enquête',32,{bureau:1});
  fl(P.depot,'cdp','poste',1,28.4,'Envoi recommandé du dossier à la commune',33,{bureau:1});
  fl(ap(P.enqD,-5),null,'fonc',1,380,'Profilement : pose et dépose des gabarits',33);
  fl(P.enqD,null,'adm',1,245,'Publication de l’avis d’enquête',33,{tva:0});
  fl(P.enqD,'cdp','km',12,null,'Contrôle de l’affichage et des gabarits',33);
  fl(ap(P.decision,-12),'cdp','park',1,8,'Stationnement, séance de conciliation',33);
  fl(ap(P.decision,8),null,'adm',1,120,'Émolument du registre foncier : servitudes',33,{tva:0});
  /* appels d'offres, exécution */
  fl(nC[0].ao.envoi,'tech','a4',640,null,'Dossiers d’appel d’offres, premier envoi',41,{bureau:1});
  fl(nC[0].ao.envoi,'tech','poste',1,46.2,'Envoi des premiers appels d’offres',41,{bureau:1});
  fl(lotK('221').ao.envoi,'tech','a3',160,null,'Plans pour les appels d’offres du second œuvre',41,{bureau:1});
  fl(lotK('258').ao.envoi,'tech','poste',1,62.8,'Envoi des appels d’offres '+low(lotK('258').lib)+' et '+low(lotK('273').lib),41,{bureau:1});
  fl(ap(p51.du,45),'dess','km',22,null,'Relevé du bâtiment voisin',51);
  fl(ap(p51.du,80),'tech','pn',16,null,'Plans d’exécution, première diffusion',51,{bureau:1});
  fl(ap(p51.du,128),'tech','pn',14,null,'Plans d’exécution, diffusion aux entreprises du second œuvre',51,{bureau:1});
  /* chantier */
  fl(C.debutTravaux,'dt','km',26,null,'Ouverture du chantier',52);
  fl(ap(C.debutTravaux,2),null,'fourn',1,1350,'Panneau de chantier',52,{nf:1});
  fl(ap(J.rocher,1),'dt','park',1,9.5,'Stationnement, constat du rocher',52);
  fl(ap(J.rocher,5),'dt','pn',8,null,'Plans de chantier, fouille nord',52,{bureau:1});
  fl(ap(J.finGO,-140),'dt','a3c',40,null,'Rapport photographique pour le maître de l’ouvrage',52,{bureau:1});
  fl(J.finGO,'dt','repr',1,386,'Apéritif de fin du gros œuvre avec les entreprises',52,{nf:1});
  fl(ap(J.fenetres,1),'dt','km',96,null,'Visite de l’usine du fournisseur de fenêtres',52);
  fl(ap(J.fenetres,14),'dt','a4c',30,null,'Note sur le retard des fenêtres, avec photos',52,{bureau:1});
  fl(ap(noteF[0].date,-7),null,'fonc',1,null,'Héliographie externe : jeux de plans de chantier',52,{solde:0});
  fl(ap(J.parquet,-20),'tech','pn',10,null,'Plans de second œuvre, mise à jour',52,{bureau:1});
  fl(ap(J.parquet,1),'cdp','km',64,null,'Visite du fournisseur de parquet avec le maître de l’ouvrage',52);
  fl(ap(J.parquet,28),'dt','park',1,11,'Stationnement, contrôle des façades',52);
  fl(ap(J.infiltration,1),'dt','a4c',36,null,'Rapport sur l’infiltration en sous-sol, avec photos',52,{bureau:1});
  fl(ap(J.infiltration,2),'dt','km',22,null,'Constat d’infiltration avec l’entreprise de gros œuvre',52);
  fl(ap(p52.au,-70),'dt','dossier',8,16,'Classeurs du dossier de l’ouvrage',52,{bureau:1});
  fl(C.reception,'dt','km',26,null,'Réception de l’ouvrage',53);
  fl(C.reception,'dt','repr',1,540,'Repas de fin de chantier avec le maître de l’ouvrage',53,{nf:1});
  fl(ap(C.reception,8),'dt','pn',12,null,'Plans conformes à l’exécution',53,{bureau:1});
  fl(ap(C.reception,10),null,'fonc',1,780,'Photographies de l’ouvrage achevé',53);
  fl(ap(P.habiter,3),null,'fonc',1,420,'Plaquette de l’immeuble pour les locataires',53);
  fl(ap(noteF[1].date,-7),null,'fonc',1,null,'Héliographie externe : dossiers de l’ouvrage',53,{solde:1});
  /* après la dernière note : pas encore facturé */
  fl(ap(auj,-15),'dt','km',26,null,'Visite de levée des réserves',53);
  fl(ap(auj,-13),'dt','a3',90,null,'Plans conformes pour la gérance',53,{bureau:1});
  fl(ap(auj,-9),'dt','park',1,14,'Stationnement, sans justificatif',53,{etat:1});
  fl(ap(auj,-6),'dt','poste',1,18.6,'Envoi des garanties au maître de l’ouvrage',53,{bureau:1,etat:2});
  fl(ap(auj,-2),moi?'me':'cdp','km',26,null,'Visite finale de l’immeuble',53);

  const tvaDe=x=>x.tva!=null?x.tva:x.j<'2024-01-01'?R.tvaAvant2024:R.tva, ttc=x=>x.q*x.prix*(1+(x.genre===G.km?0:tvaDe(x))/100);
  FR.forEach(x=>{ const f0=ctx.frais[x.genre]; if(!f0) throw new Error('genre de frais inconnu : '+x.genre); if(x.prix==null&&x.solde==null) x.prix=f0.prix; x.f=f0; if(x.qui&&!present(x.qui,x.j)) throw new Error('frais hors présence : '+x.desc+' '+x.j); });
  /* facturé : toute note de frais couvre les frais facturables depuis la précédente ; sa ligne de solde lui fait atteindre son montant TTC exact */
  const facture={}; let dep='';
  noteF.forEach((nf,i)=>{ const L=FR.filter(x=>!x.nf&&x.j>dep&&x.j<=nf.date), so=L.find(x=>x.solde===i); if(!so) throw new Error('ligne de solde absente : '+nf.num);
    const reste0=nf.montant-L.filter(x=>x!==so).reduce((s,x)=>s+ttc(x),0), ht=A.arr(reste0/(1+R.tva/100)); if(ht<=0) throw new Error('note '+nf.num+' dépassée de '+A.arr(-reste0)); so.prix=ht; L.forEach(x=>{ x.cd=nf.date; }); facture[nf.date]=A.arr(L.reduce((s,x)=>s+ttc(x),0)); dep=nf.date; });

  FR.sort((x,y)=>x.j.localeCompare(y.j)); const idsF=A.ids('projectcost',FR.length), opsF=[];
  FR.forEach((x,i)=>{ const id=idsF[i], sub=x.n===FA.groupe?null:ctx.sub[x.n], rembourse=!!x.qui&&!x.bureau, ext=!x.qui, y=x.j.slice(0,4);
    opsF.push({t:'projectcost',id,val:{ID:id,PROJECT_ID:pid,STAFF_ID:x.qui?S[x.qui].id:null,DATEYEAR:+y,DATEMONTH:+x.j.slice(5,7)-1,DATEDAY:+x.j.slice(8,10),COSTCATEGORYGROUP_ID:x.f.gid,COSTCATEGORY_ID:x.f.id,QUANTITY:x.q,UNITPRICE:x.prix,UNIT:x.f.unit||null,
      FOREIGNCURRENCYCODE:null,FOREIGNCURRENCYRATE:1,EXTERNALRATE:1,VATRATE:x.genre===G.km?null:tvaDe(x),DOCUMENTNUMBER:ext?y.slice(2)+'-'+String(++pieceN).padStart(3,'0'):null,DESCRIPTION:x.desc,SUBPROJECT_ID:null,PHASE_ID:sub==null?ctx.phases[x.n]:ctx.phaseDeSub[x.n],SUBPHASE_ID:sub,
      PROJECTCOSTSTATECODE:x.etat!=null?x.etat:x.j<seuil?3:0,ISCHARGEABLE:x.nf?0:1,ISCHARGED:x.cd?1:0,CHARGEDDATE:x.cd||null,ISREFUNDABLE:rembourse?1:0,ISREFUNDED:rembourse&&x.j<seuil?1:0}}); });
  await A.commit(opsF); await A.sauverRegistre();

  /* ── pour les modules suivants, et journal ── */
  const parPhase={}; lignes.forEach(x=>{ parPhase[x.n]=(parPhase[x.n]||0)+(x.b-x.a)/60; });
  ctx.heures={lignes:lignes.length,heures:A.arr(lignes.reduce((s,x)=>s+x.b-x.a,0)/60),parPhase,vacances:lignesVac.length};
  ctx.depenses={lignes:FR.length,ht:A.arr(FR.reduce((s,x)=>s+x.q*x.prix,0)),facture};
  if(decales.length) A.log('heures : lignes déplacées ou non placées :',decales.slice(0,20));
  A.log('heures :',lignes.length+' lignes, '+ctx.heures.heures+' h, '+nSeances+' séances de chantier, '+lignesVac.length+' jours de vacances ; frais : '+FR.length+' lignes, '+ctx.depenses.ht+' CHF HT, notes '+JSON.stringify(facture));
});
})();

/* ═══ AFFAIRE DE TRAVAIL 99TST — MODULE 90 : MODULES PROPRES À SUBGESTION 3 (04.11.2026) ═══
   Crée, d'après AT.REF (calendrier, phases, lots, équipe, récit, factures) et les heures du module 60 :
   - sgfaisa + sgfaisatexte : parcelle fictive complète avec sa forme (GEOM, surface = REF.surfaceParcelle, sur le Léman : E 2'533'500 / N 1'146'200, aucun propriétaire,
     les vignettes montrent de l'eau), sources (geo.admin.ch, extrait RDPPF, règlement communal fictif, lien, notes), règlement d'Exempleville en texte avec ses articles,
     contraintes et réponses par thème, volumétrie calculée par l'app, conclusion. Les valeurs de la zone sont dans REGLE ci-dessous, seul endroit où elles sont fixées.
     Ne pas cliquer « Appliquer à la parcelle », « Tout rechercher », « geo.admin.ch » ni « Extrait RDPPF » sur cette affaire : ils remplacent les données fictives ;
   - sgplanning (projet, chantier) ; sgplanningarch : 4 indices émis pour chaque planning (mêmes id de ligne, l'écran compare) et des copies automatiques de moins de 92 jours ;
   - sgpermis : permis complet (2 oppositions, 1 observation, conditions de la synthèse, aucun recours, dates de REF.calendrier.permis),
     puis la demande complémentaire du parking, en dispense d'enquête ;
   - sgavancement + projectimplementation : un état par trimestre, de mars 2024 à octobre 2026, jamais sous le facturé de REF.factures ;
   - sgapport : apport de REF.equipe[apporteuse] et un acompte ; sgbouclement 2025 : validé pour 5 collaborateurs, aucun transfert (ils n'ont que les heures de l'affaire).
   sgdocphase : déjà écrit par le module 40. Toutes les écritures sont dans un seul A.commit, à la fin : si un calcul échoue, rien n'est écrit.

   Ajoute à ctx :
   ctx.faisa   {source : ID de la source du règlement dans sgfaisa, titre, texte, pages, articles, lierFichier(fid) : met depotfichier.ID dans sgfaisa.SOURCES[].FICHIER}
               Le module 97 peut déposer le PDF du règlement à partir de ctx.faisa.texte et le relier par ctx.faisa.lierFichier(id).
   ctx.permis  {demandes:[ID, ID]} */
(function(){
const A=window.AT;
const AJD='sgfaisatexte';   /* collection à la demande : A.purger ne la voit pas tant qu'elle n'est pas chargée */
A.purgeurs.push(async()=>{ const m=DS.get('sg_meta','affaire_travail'), L=(m&&m.TABLES&&m.TABLES[AJD])||[]; if(!L.length) return; await DS.need([AJD]).catch(()=>null);
  const ops=L.filter(id=>DS.get(AJD,id)).map(id=>({t:AJD,id,val:null})); if(ops.length){ A.log('purge',AJD,ops.length); await DS.commit(ops); } });

/* ── mise en forme ── */
const dd=n=>String(n).padStart(2,'0');
const fr=iso=>String(iso).split('-').reverse().join('.');
const isoFr=s=>String(s).split('.').reverse().join('-');
const mille=n=>String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
const m1=v=>Number(v).toFixed(2);
const maj=s=>s.charAt(0).toUpperCase()+s.slice(1);
const nomE=R=>k=>{ const e=R.equipe.find(x=>x.cle===k); if(!e) throw new Error('équipe : '+k); return e.prenom+' '+e.nom; };
/* faits du récit : une valeur extraite, jamais recopiée */
const recit=R=>{ const f=re=>{ const r=R.recit.find(x=>re.test(x.t)); if(!r) throw new Error('récit : '+re); return r; };
  return {d:re=>f(re).d, t:re=>f(re).t, x:re=>{ const r=f(re); return re.exec(r.t)[1]; }}; };

/* ── règlement communal fictif : valeurs de la zone ── */
const ZONE={dist:5,distBat:10,cos:'1/3',ius:1.2,faite:'16.50',niv:4,verts:20,attiquePct:60,attiqueRetrait:'2.50',facade:32};
const FORME=[[-30,-18],[24,-22],[29,6],[25,21],[-27,25]];   /* contour relatif, en mètres ; mis à la surface de REF.surfaceParcelle */
const CENTRE={E:2533500,N:1146200};   /* Léman, domaine public */
/* variante B retenue en 2023 : seules ces mesures ne sont pas dans REF (elles n'existent que dans la faisabilité) */
const VB={long:30,larg:18,attique:320,corniche:13.35,faite:16.20,distN:6.2,distS:7.1,verts:690,arbres:8,hangar:1500};

function articlesReglement(R,corniche){ const Z=ZONE; return [
  {chap:'CHAPITRE I — DISPOSITIONS GÉNÉRALES'},
  {k:'but',t:'But',x:['Le présent règlement fixe les règles applicables à l’aménagement du territoire et aux constructions sur le territoire de la commune d’'+R.lieu+'.','Il complète la loi sur l’aménagement du territoire et les constructions (LATC) et son règlement d’application (RLATC).']},
  {k:'plans',t:'Plans et documents',x:['Le plan d’affectation communal au 1:5000 et le plan des limites des constructions font partie intégrante du présent règlement.','En cas de divergence, le plan fait foi pour la limite des zones et le texte pour les mesures.']},
  {k:'muni',t:'Municipalité',x:['La Municipalité veille à l’application du présent règlement.','Elle peut demander, aux frais du requérant, l’avis d’un spécialiste lorsqu’un projet pose une question particulière de sécurité, d’environnement ou d’intégration.']},
  {k:'comm',t:'Commission d’urbanisme',x:['La Municipalité peut consulter une commission d’urbanisme de cinq membres au plus, dont deux architectes indépendants de l’administration.','La commission donne un préavis sur l’intégration des projets de plus de 1 000 m² de surface de plancher.']},
  {k:'zones',t:'Découpage du territoire',x:['Le territoire communal est réparti entre les zones et les aires représentées sur le plan d’affectation communal, dont les limites sont reportées à l’échelle du plan.','Il comprend la zone centrale, la zone de moyenne densité, la zone de faible densité, la zone de verdure et la zone d’utilité publique.']},
  {chap:'CHAPITRE II — ZONE CENTRALE'},
  {k:'cent1',t:'Zone centrale : destination',x:['La zone centrale est destinée à l’habitation, aux commerces, aux services et aux activités compatibles avec l’habitat.','Les rez-de-chaussée donnant sur la place de la Maison de Commune sont réservés aux activités ouvertes au public.']},
  {k:'cent2',t:'Zone centrale : ordre et gabarit',x:['L’ordre contigu est obligatoire le long des rues.','Les constructions nouvelles reprennent le gabarit et l’alignement des bâtiments voisins.']},
  {page:1},
  {chap:'CHAPITRE III — ZONE DE MOYENNE DENSITÉ'},
  {k:'dest',t:'Zone de moyenne densité : destination',x:['La zone de moyenne densité est destinée à l’habitation collective.','Les activités non gênantes compatibles avec l’habitation, telles que bureaux, cabinets et petits commerces de proximité, y sont admises jusqu’à 30 % de la surface de plancher déterminante.','Le degré de sensibilité au bruit II est attribué à cette zone.']},
  {k:'ordre',t:'Ordre des constructions',x:['L’ordre non contigu est obligatoire.','La longueur d’une façade ne peut excéder '+Z.facade+' m, balcons non compris.']},
  {k:'dist',t:'Distance aux limites',x:['La distance entre un bâtiment et la limite de propriété est de '+Z.dist+' m au minimum.','Elle est mesurée perpendiculairement à la limite, depuis le nu de la façade.','Les balcons, les avant-toits et les sauts-de-loup peuvent empiéter de 1.50 m au plus sur cet espace.']},
  {k:'bat',t:'Distance entre bâtiments',x:['La distance entre deux bâtiments situés sur une même propriété est de '+Z.distBat+' m au minimum.','Les constructions souterraines recouvertes de 60 cm de terre au moins ne sont pas prises en compte.']},
  {k:'cos',t:'Coefficient d’occupation du sol',x:['Le coefficient d’occupation du sol (COS) est fixé à '+Z.cos+'.','La surface bâtie est mesurée en projection horizontale, sans les balcons ni les constructions souterraines.']},
  {k:'ius',t:'Indice d’utilisation du sol',x:['L’indice d’utilisation du sol (IUS) est limité à '+Z.ius+'.','Il se calcule selon la norme SIA 421, sur la surface de plancher déterminante (SPd) rapportée à la surface de la parcelle.','Les parkings, les caves et les locaux techniques en sous-sol ne comptent pas dans la SPd.']},
  {k:'haut',t:'Hauteurs',x:['La hauteur à la corniche est limitée à '+corniche+' m.','La hauteur au faîte ou à l’acrotère de l’attique est limitée à '+Z.faite+' m.','Les hauteurs sont mesurées depuis le terrain naturel, au milieu de la façade la plus basse.']},
  {k:'niv',t:'Nombre de niveaux',x:['Le nombre est limité à '+Z.niv+' niveaux sous la corniche, rez-de-chaussée compris.','Les combles ne sont pas habitables au-dessus d’un attique.']},
  {k:'att',t:'Attique',x:['Un attique est admis au-dessus du dernier niveau.','Sa surface ne dépasse pas '+Z.attiquePct+' % de celle du niveau inférieur.','Ses façades sont en retrait de '+Z.attiqueRetrait+' m au moins sur tout le pourtour.']},
  {k:'toit',t:'Toitures',x:['Les toitures plates sont admises ; elles sont végétalisées de manière extensive lorsqu’elles ne servent pas de terrasse.','Les superstructures techniques sont regroupées et ne dépassent pas l’acrotère de plus de 1.50 m.']},
  {chap:'CHAPITRE IV — ZONE DE FAIBLE DENSITÉ'},
  {k:'fai1',t:'Zone de faible densité : destination',x:['La zone de faible densité est destinée aux maisons individuelles et aux habitations de deux logements.','Les activités professionnelles exercées par les habitants y sont admises si elles ne gênent pas le voisinage.']},
  {k:'fai2',t:'Zone de faible densité : mesures',x:['L’indice d’utilisation du sol est limité à 0.4 et la hauteur à la corniche à 7.50 m.','La distance à la limite de propriété est de 6 m au minimum.']},
  {chap:'CHAPITRE V — ZONES DE VERDURE ET D’UTILITÉ PUBLIQUE'},
  {k:'verd',t:'Zone de verdure',x:['La zone de verdure est inconstructible et destinée à sauvegarder les sites, à créer des îlots de verdure et à aménager des places de jeux.','Seuls de petits aménagements liés à sa destination y sont admis.']},
  {k:'up',t:'Zone d’utilité publique',x:['La zone d’utilité publique est destinée aux bâtiments et aux installations des collectivités publiques.','Les distances et les hauteurs sont fixées de cas en cas par la Municipalité, en tenant compte du voisinage.']},
  {page:1},
  {chap:'CHAPITRE VI — RÈGLES APPLICABLES À TOUTES LES ZONES'},
  {k:'park',t:'Stationnement des véhicules',x:['Le nombre de places de parc est fixé à une place par logement, plus une place pour visiteurs par tranche de cinq logements entamée.','Pour les immeubles de plus de six logements, les places sont aménagées en sous-sol.','Les normes VSS sur le stationnement s’appliquent à la géométrie des places et des voies de circulation.']},
  {k:'velo',t:'Stationnement des vélos',x:['Il est prévu deux places pour vélos par logement, couvertes et accessibles de plain-pied ou par une rampe.','Une place sur quatre peut être remplacée par une place pour vélo-cargo ou remorque, à raison de deux pour une.']},
  {k:'acces',t:'Accès',x:['Les accès aux parcelles et aux garages ne doivent pas compromettre la sécurité du trafic.','La pente d’une rampe d’accès à un parking ne dépasse pas 15 % et sa largeur est de 5.50 m au moins sur les cinq premiers mètres depuis le domaine public.']},
  {k:'terr',t:'Mouvements de terre',x:['Les remblais et les déblais ne modifient pas le terrain naturel de plus de 1.50 m.','Ils s’arrêtent à 2 m au moins de la limite de propriété, sauf accord écrit du voisin.']},
  {k:'verts',t:'Espaces verts',x:[Z.verts+' % de la surface de la parcelle sont aménagés en espaces verts.','Les dalles de parking recouvertes de 60 cm de terre au moins comptent pour moitié.','Un plan des aménagements extérieurs accompagne toute demande de permis de construire.']},
  {k:'arbres',t:'Arbres',x:['Il est planté au moins un arbre d’essence indigène par 300 m² de surface de parcelle.','Tout arbre abattu est remplacé par un arbre d’essence indigène, en pleine terre, sur la parcelle.','L’abattage fait l’objet d’une autorisation de la Municipalité, publiée avec l’enquête.']},
  {k:'eaux',t:'Évacuation des eaux',x:['Le système séparatif est obligatoire.','Les eaux claires sont infiltrées si le sol le permet ; à défaut, elles sont retenues sur la parcelle et restituées au collecteur communal à raison de 20 litres par seconde et par hectare au plus.']},
  {k:'ener',t:'Énergie',x:['Les nouveaux bâtiments respectent la législation vaudoise sur l’énergie.','Une part de 30 % au moins des besoins de chaleur pour l’eau chaude sanitaire est couverte par une énergie renouvelable.','Le raccordement à un réseau de chauffage à distance est examiné lorsque ce réseau dessert le quartier.']},
  {k:'bruit',t:'Protection contre le bruit',x:['Les installations techniques extérieures, notamment les pompes à chaleur, respectent les valeurs de planification de l’ordonnance sur la protection contre le bruit (OPB).','Un justificatif acoustique accompagne la demande de permis.']},
  {k:'dang',t:'Dangers naturels',x:['Dans les secteurs figurant sur la carte des dangers naturels, toute demande de permis comprend une évaluation locale du risque et les mesures de protection prévues.']},
  {k:'foret',t:'Lisière de forêt',x:['Aucune construction n’est admise à moins de 10 m de la lisière forestière, conformément à la législation forestière cantonale.']},
  {k:'patr',t:'Recensement architectural',x:['Les bâtiments portant une note 1 à 3 au recensement architectural sont conservés.','Les bâtiments en note 4 gardent leur volume et leur caractère ; les autres peuvent être remplacés.']},
  {k:'adap',t:'Logements adaptables',x:['Les immeubles de plus de huit logements sont conformes à la norme SIA 500 pour les parties communes.','Tous les logements sont adaptables.']},
  {k:'dech',t:'Déchets',x:['Tout immeuble de plus de six logements dispose d’un emplacement pour les conteneurs, accessible au service de ramassage depuis le domaine public.','Son emplacement figure sur le plan des aménagements extérieurs.']},
  {page:1},
  {chap:'CHAPITRE VII — POLICE DES CONSTRUCTIONS'},
  {k:'doss',t:'Dossier de demande de permis',x:['La demande est déposée sur la plateforme cantonale CAMAC, avec les plans, les questionnaires et les justificatifs requis.','Un plan de situation signé par un ingénieur géomètre breveté accompagne le dossier.']},
  {k:'gab',t:'Gabarits',x:['La Municipalité peut exiger la pose de gabarits pendant l’enquête publique.','Ils sont posés par le requérant et contrôlés par le géomètre.']},
  {k:'ctrl',t:'Contrôles',x:['Le début des travaux est annoncé au service technique sept jours à l’avance.','L’implantation du bâtiment est contrôlée par le géomètre avant le début du gros œuvre.']},
  {k:'hab',t:'Permis d’habiter',x:['Aucun bâtiment neuf ne peut être occupé avant la délivrance du permis d’habiter.','Celui-ci est délivré après le contrôle de la conformité de l’ouvrage et des charges du permis de construire.']},
  {chap:'CHAPITRE VIII — DISPOSITIONS FINALES'},
  {k:'der',t:'Dérogations',x:['La Municipalité peut accorder des dérogations dans les limites de l’article 85 LATC.','Elles sont mises à l’enquête publique avec le projet.']},
  {k:'vig',t:'Entrée en vigueur',x:['Le présent règlement entre en vigueur à la date fixée par le Département compétent.','Il abroge le règlement communal du 12 avril 1994.']}]; }

function reglement(R,corniche){ const N={}, P=[[`COMMUNE D’${R.lieu.toUpperCase()}`,'','RÈGLEMENT COMMUNAL SUR LE PLAN D’AFFECTATION ET LA POLICE DES CONSTRUCTIONS (RPACom)','',
    'Adopté par la Municipalité le 14 janvier 2019, soumis à l’enquête publique du 8 février au 9 mars 2019, adopté par le Conseil communal le 13 mai 2019, approuvé par le Département compétent le 27 août 2019 et entré en vigueur le 4 octobre 2019.','']];
  let n=0; for(const b of articlesReglement(R,corniche)){ if(b.page){ P.push([]); continue; } if(b.chap){ P[P.length-1].push(b.chap,''); continue; }
    n++; N[b.k]={art:'Art. '+n,titre:b.t,x:b.x}; P[P.length-1].push('Art. '+n+' '+b.t,b.x.join(' '),''); }
  return {texte:P.map(l=>l.join('\n').trim()).join('\n\f\n'),N,pages:P.length,articles:n}; }

/* ── faisabilité ── */
async function faisabilite(ctx,p){ const R=A.REF, pid=ctx.pid, rt=recit(R), Fa=R.faisabilite, S=R.surfaceParcelle;
  const corniche=rt.x(/corniche à ([\d.]+) m/), nLog=+/(\d+) logements/.exec(R.titreLong)[1], places=+rt.x(/passe de (\d+) à/), budget=rt.x(/budget cible (.+? HT)/), rocher=rt.x(/rocher à ([\d.]+ m)/);
  if(nLog+Math.ceil(nLog/5)!==places) throw new Error('règlement : '+nLog+' logements ne donnent pas '+places+' places');
  const cos=1/3, spdMax=ZONE.ius*S, empMax=cos*S, velos=2*nLog, arbresMin=Math.ceil(S/300), vertsMin=ZONE.verts/100*S, surfB=VB.long*VB.larg, spdB=ZONE.niv*surfB+VB.attique, dSource=A.plus(Fa.du,10), dVisite=A.plus(dSource,8);
  /* forme de la parcelle : surface exacte de la référence */
  const aire=FORME.reduce((a,q,i)=>{ const r=FORME[(i+1)%FORME.length]; return a+q[0]*r[1]-r[0]*q[1]; },0)/2, k=Math.sqrt(S/Math.abs(aire)), g=FORME.map(([x,y])=>[A.arr(CENTRE.E+x*k),A.arr(CENTRE.N+y*k)]);
  const EGRID='CH000000012340', IDENT='VD0000012340', chef=R.commune.personnes[0], nomChef=chef.prenom+' '+chef.nom, hebergeur='https://www.'+R.lieu.toLowerCase()+'.test';
  const adresse=R.adresse.rue+', '+R.adresse.npa+' '+R.adresse.loc, reg=reglement(R,corniche), N=reg.N;
  const TR='Règlement communal d’'+R.lieu+' (RPACom, 2019)', URLR=hebergeur+'/reglements/rpacom-2019.pdf', SRV='https://rdppf.'+R.lieu.toLowerCase()+'.test';
  const rec={ID:String(pid),PROJECT_ID:pid,PARCELLE:{ADRESSE:adresse,COMMUNE:R.lieu,BFS:'9999',NUMERO:R.parcelle,EGRID,IDENTDN:IDENT,SURFACE:S,E:CENTRE.E,N:CENTRE.N,ZONE:R.zone,ZONE_FED:'Zones d’habitation',CANTON:R.canton,RDPPF_ETAT:'En vigueur',RDPPF_SERVICE:SRV,GEOM:[...g,g[0]]},SOURCES:[],CONTRAINTES:[],REGLES:{},CONCLUSION:''};
  /* source geo.admin.ch : textes produits par les fonctions de l'app (SG_FZ_COUCHES) */
  const hit=(id,pr)=>{ const c=SG_FZ_COUCHES.find(x=>x[0]===id); if(!c) throw new Error('couche absente : '+id); return {couche:c[0],lib:c[1],theme:c[2],props:sgFzProps(pr),f:c[4](pr)}; };
  const hits=[hit('ch.are.bauzonen',{ch_bez_f:'Zones d’habitation',name:R.lieu,ch_code_hn:'11'}),hit('ch.bag.radonkarte',{probability_prozent:'3'}),hit('ch.bafu.gefahren-baugrundklassen',{bgk:'C',referenz:'SIA 261'}),
    hit('ch.swisstopo.geologie-hydrogeologische_karte-grundwasservorkommen',{type_fr:'Roches meubles peu perméables'})];
  const bats=[{egid:'9901234',adresse:R.adresse.rue,annee:1964,periode:8014,categorie:1060,classe:1251,surface:310,volume:VB.hangar,niveaux:1,logements:0,statut:1004,parcelle:R.parcelle,egrid:EGRID}];
  rec.SOURCES.push({ID:'srcgeo',TYPE:'geoadmin',TITRE:'geo.admin.ch — couches fédérales au point de la parcelle',URL:'https://map.geo.admin.ch/?lang=fr&center='+CENTRE.E+','+CENTRE.N+'&z=11&layers=ch.kantone.cadastralwebmap-farbe',DATE:dSource,
    RESUME:hits.map(x=>x.lib).join(' · ')+' · 1 bâtiment (RegBL)',DONNEES:{hits,bats,couches:SG_FZ_COUCHES.length}});
  /* source RDPPF */
  const doc=(titre,type,abr,url,art,num)=>({titre,url:url||'',type,abr:abr||'',art:art||'',num:num||''}), OFF='Commune d’'+R.lieu+', service technique', DJ='Disposition juridique', BL='Base légale';
  const dReg=doc(TR,DJ,'RPACom',URLR), dPlan=doc('Plan d’affectation communal d’'+R.lieu+', approuvé le 27 août 2019',DJ,'PACom',hebergeur+'/reglements/pacom-2019.pdf'), dLatc=doc('Loi sur l’aménagement du territoire et les constructions',BL,'LATC','','','700.11');
  const dLim=doc('Plan des limites des constructions du '+R.adresse.rue.replace(/ \d+$/,''),DJ,'PLC',hebergeur+'/reglements/plc-chemin-projet.pdf'), dOpb=doc('Ordonnance sur la protection contre le bruit',BL,'OPB','','art. 43','814.41');
  const restr=(theme,code,legende,part,surface,docs,o)=>Object.assign({theme,code,sous:'',legende,type:'',statut:'En vigueur',surface:String(surface),part:String(part),longueur:'',points:'',office:OFF,docs},o);
  const limS=Math.round(S*.06), themes=['Plans d’affectation cantonaux et communaux','Degrés de sensibilité au bruit','Limites de construction'];
  const restrictions=[restr(themes[0],'ch.Nutzungsplanung',R.zone,100,S,[dReg,dPlan,dLatc]),restr(themes[1],'ch.Laermempfindlichkeitsstufen','Degré de sensibilité II',100,S,[dReg,dOpb]),restr(themes[2],'ch.Baulinien','Limite des constructions, '+R.adresse.rue.replace(/ \d+$/,''),6,limS,[dLim,dLatc])];
  const nonC=['Sites pollués','Zones de protection des eaux souterraines','Périmètres de protection des eaux souterraines','Espace réservé aux eaux','Limites forestières statiques','Distances par rapport à la forêt','Zones réservées'];
  rec.SOURCES.push({ID:'srcrdppf',TYPE:'rdppf',TITRE:'Extrait du cadastre RDPPF — parcelle '+R.parcelle+' ('+EGRID+')',URL:SRV+'/extract/pdf/?EGRID='+EGRID,DATE:dSource,
    RESUME:restrictions.length+' restrictions · '+themes.join(', ')+' · '+nonC.length+' thèmes non concernés',DONNEES:{egrid:EGRID,service:SRV,restrictions,nonConcernes:nonC,sansDonnees:[],themes,date:dSource+'T09:40:00'}});
  /* contraintes reprises des deux sources par la fonction de l'app : mêmes titres qu'un pré-remplissage, rien en double si Paulo clique */
  await sgFzPreRemplir(rec,p);
  const auto=rec.CONTRAINTES.splice(0), rep={
    'Zone à bâtir':['Zones d’habitation : le plan d’affectation communal précise la zone, voir l’article de la zone.','conforme'],
    'Radon':['Radier en béton étanche et ventilation du sous-sol : mesures courantes, mesure de contrôle à prévoir après l’occupation.','a_verifier'],
    'Sol de fondation':['Classe à confirmer par la campagne de sondages de l’avant-projet ; dimensionnement parasismique par l’ingénieur civil.','a_verifier'],
    'Réservoir aquifère':['Aucune zone de protection des eaux à cet endroit ; venues d’eau à vérifier avec les sondages.','conforme']};
  const repRd={[R.zone]:['Projet d’habitation collective : conforme à l’affectation.','conforme'],'Degré de sensibilité II':['Immeuble d’habitation sur un chemin de desserte : valeurs de planification respectées, justificatif acoustique à joindre au permis.','a_verifier'],
    ['Limite des constructions, '+R.adresse.rue.replace(/ \d+$/,'')]:['Bande de '+mille(limS)+' m² le long du chemin : aucune partie de la variante B au-delà de la limite. Compatible avec le recul de '+m1(VB.distS)+' m.','conforme']};
  auto.forEach(c=>{ const r=repRd[c.TITRE]||Object.entries(rep).find(([k])=>c.TITRE.startsWith(k))?.[1]; if(!r) throw new Error('contrainte sans réponse : '+c.TITRE); c.REPONSE=r[0]; c.STATUT=r[1]; });
  /* règlement : source, texte */
  rec.SOURCES.push({ID:'srcreg',TYPE:'reglement',TITRE:TR,URL:URLR,DATE:dSource,RESUME:'Règlement en vigueur depuis le 4 octobre 2019. Zone de moyenne densité : '+N.dest.art+' à '+N.toit.art+' ; règles communes : '+N.park.art+' à '+N.dech.art+'.',PAGES:reg.pages,ARTICLES:reg.articles,TEXTE:true,ABR:'RPACom'});
  rec.SOURCES.push({ID:'srcplan',TYPE:'lien',TITRE:'Plan d’affectation communal d’'+R.lieu+' au 1:5000',URL:dPlan.url,DATE:dSource,RESUME:'Plan général en vigueur : la parcelle '+R.parcelle+' est entièrement en '+R.zone.charAt(0).toLowerCase()+R.zone.slice(1)+'.'});
  rec.SOURCES.push({ID:'srcrf',TYPE:'manuel',TITRE:'Extrait du registre foncier, parcelle '+R.parcelle,URL:'',DATE:dSource,RESUME:'Propriété de la '+R.mo.societe+'. Une servitude de passage à pied et pour tous véhicules en faveur de la parcelle voisine, le long de la limite est ; aucune charge foncière.'});
  rec.SOURCES.push({ID:'srcchef',TYPE:'manuel',TITRE:'Entretien avec '+nomChef+', '+chef.titre.charAt(0).toLowerCase()+chef.titre.slice(1),URL:'',DATE:dVisite,RESUME:'Lecture de la mesure des hauteurs et du retrait de l’attique, gabarits exigés pendant l’enquête, chauffage à distance prévu dans le quartier sans date arrêtée.'});
  /* contraintes du règlement : le texte de la règle est celui de l'article */
  const C=[], cr=(th,k,ix,val,rp,st,o)=>{ const a=N[k]; C.push(Object.assign({THEME:th,TITRE:a.titre+' — '+a.art,REGLE:ix.map(i=>a.x[i]).join(' '),SOURCE:TR,ARTICLE:a.art,VALEUR:val,REPONSE:rp,STATUT:st,NOTE:''},o)); };
  cr('zone','dest',[0,1],'Habitation collective',nLog+' logements à loyers modérés : affectation entièrement conforme à la destination de la zone.','conforme');
  cr('indice','ius',[0,1],String(ZONE.ius),'Variante B : SPd de '+mille(spdB)+' m² pour '+mille(spdMax)+' m² admis (parking et caves en sous-sol, non comptés). Réserve de '+mille(spdMax-spdB)+' m².','conforme');
  cr('emprise','cos',[0],ZONE.cos,'Variante B : plot de '+VB.long+' × '+VB.larg+' m, soit '+mille(surfB)+' m² bâtis pour '+mille(empMax)+' m² admis.','conforme');
  cr('emprise','ordre',[1],ZONE.facade+' m','Variante A (barre de 46 m) écartée pour ce motif. Variante B : façade la plus longue de '+VB.long+' m.','conforme',{NOTE:'À l’origine du choix du plot.'});
  cr('hauteur','haut',[0],corniche+' m','Variante B : corniche à '+m1(VB.corniche)+' m au milieu de la façade la plus basse. Marge de 15 cm : altitude du terrain naturel à confirmer par le géomètre.','a_verifier');
  cr('hauteur','haut',[1],ZONE.faite+' m','Variante B : acrotère de l’attique à '+m1(VB.faite)+' m.','conforme',{TITRE:'Hauteur au faîte — '+N.haut.art});
  cr('hauteur','niv',[0],ZONE.niv+' niveaux','Rez-de-chaussée et trois étages, plus un attique.','conforme');
  cr('hauteur','att',[1,2],ZONE.attiquePct+' % · '+ZONE.attiqueRetrait+' m','Surface : '+mille(VB.attique)+' m² pour '+mille(surfB)+' m², soit '+Math.round(VB.attique/surfB*100)+' %. Retrait de '+ZONE.attiqueRetrait+' m sur trois côtés, mais 1.80 m au nord à cause de la cage d’ascenseur : à reprendre à l’avant-projet.','non_conforme',{NOTE:'Déplacer la cage d’ascenseur vers le centre du plan.'});
  cr('distances','dist',[0,1],ZONE.dist+' m','Variante B : '+m1(VB.distN)+' m à la limite nord, '+m1(VB.distS)+' m au '+R.adresse.rue.replace(/ \d+$/,'')+', plus de '+ZONE.dist+' m à l’est et à l’ouest. Balcons dans la tolérance de 1.50 m.','conforme');
  cr('distances','bat',[0],ZONE.distBat+' m','Le hangar existant est démoli : un seul bâtiment sur la parcelle. Parking enterré non compté.','conforme');
  cr('toiture','toit',[0],'Toiture plate','Toiture plate végétalisée, terrasses privatives sur le pourtour de l’attique.','conforme');
  cr('stationnement','park',[0,1],places+' places',nLog+' logements demandent '+nLog+' + '+(places-nLog)+' = '+places+' places, toutes en sous-sol. Rampe unique depuis le chemin.','conforme');
  cr('stationnement','velo',[0],velos+' places',velos+' places dans un local au rez-de-chaussée, accès de plain-pied depuis le chemin.','conforme');
  cr('verts','verts',[0,1],ZONE.verts+' %',mille(vertsMin)+' m² demandés. Variante B : '+mille(VB.verts)+' m², dont une large part hors de la dalle du parking.','conforme');
  cr('verts','arbres',[0,1],arbresMin+' arbres','Minimum de '+arbresMin+' arbres pour '+mille(S)+' m². Variante B : '+VB.arbres+' arbres plantés ; les arbres du chemin touchés par la rampe sont à relever et à remplacer.','a_verifier',{NOTE:'Sujet sensible pour le quartier : relevé à faire avant l’avant-projet.'});
  cr('dangers','dang',[0],'Hors secteur','Parcelle hors des secteurs de la carte des dangers naturels : pas d’évaluation locale à fournir.','conforme');
  cr('bruit','bruit',[0],'DS II','Emplacement de la production de chaleur à arrêter ; si pompe à chaleur en toiture, justificatif acoustique par '+ctx.mand.phys.nom+'.','a_verifier');
  C.push({THEME:'pollues',TITRE:'Diagnostic de polluants du hangar',REGLE:'Tout bâtiment construit avant 1991 fait l’objet d’un diagnostic de polluants avant sa démolition. Le rapport accompagne la demande de permis.',SOURCE:'Questionnaire général CAMAC',ARTICLE:'',VALEUR:'Diagnostic à faire',REPONSE:'Pas d’inscription au cadastre des sites pollués. Le hangar de 1964 demande un diagnostic (amiante, PCB, plomb) avant démolition.',STATUT:'a_traiter',NOTE:''});
  cr('patrimoine','patr',[0,1],'Note 6','Le hangar porte une note 6 au recensement architectural : il peut être remplacé.','conforme');
  cr('foret','foret',[0],'10 m','Aucune lisière à moins de 80 m de la parcelle.','conforme');
  cr('eaux','eaux',[0,1],'20 l/s/ha','Infiltration à vérifier avec les sondages. À défaut, bassin de rétention sous le rez-de-chaussée, raccordement aux collecteurs à confirmer par le service technique.','a_verifier');
  cr('energie','ener',[1,2],'30 %','Réseau de chauffage à distance sans date d’arrivée connue. Solution de base : pompe à chaleur, à comparer à l’avant-projet avec '+ctx.mand.cvse.nom+'.','a_verifier');
  cr('acces','acces',[1],'15 % · 5.50 m','Variante B : rampe droite à 14 %, largeur de 5.50 m. Niveau du parking à recaler selon le rocher.','conforme');
  cr('autres','adap',[0,1],'SIA 500','Ascenseur desservant tous les niveaux, sous-sol compris ; logements adaptables.','conforme');
  cr('autres','dech',[0],'','Emplacement pour conteneurs le long du chemin, à côté de l’accès au parking.','conforme');
  C.push({THEME:'autres',TITRE:'Servitude de passage',REGLE:'Servitude de passage à pied et pour tous véhicules en faveur de la parcelle voisine, le long de la limite est.',SOURCE:'Extrait du registre foncier, parcelle '+R.parcelle,ARTICLE:'',VALEUR:'',REPONSE:'',STATUT:'a_traiter',NOTE:'Assiette à vérifier sur le plan du géomètre.'});
  rec.CONTRAINTES=[...C,...auto].map((c,i)=>Object.assign({},c,{ID:'ct'+dd(i+1)}));
  /* volumétrie : calculée par l'app */
  const V=sgFzVolumetrie(rec); if(!V) throw new Error('faisabilité : volumétrie impossible');
  const {R:Rg}=sgFzRegles(rec); rec.VOLUMETRIE={DATE:Fa.au,S:Math.round(V.S),AIRE:Math.round(V.I.aire),EMPRISE:Math.round(V.emp),SPD:V.spd?Math.round(V.spd):null,VOLUME:V.vol?Math.round(V.vol):null,VERTS:V.verts?Math.round(V.verts):null,REGLES:Object.fromEntries(Object.entries(Rg).map(([k,r])=>[k,r.v]))};
  const conseil=rt.d(/conseil de fondation/), nS=R.mandataires.find(m=>m.cle==='geol');
  rec.CONCLUSION=[`La parcelle n° ${R.parcelle} d’${R.lieu} (${mille(S)} m², ${R.zone.charAt(0).toLowerCase()+R.zone.slice(1)}) permet de construire ${nLog} logements à loyers modérés avec un parking souterrain de ${places} places, dans le respect du règlement communal. Les règles appliquées à la parcelle donnent une aire d’implantation de ${mille(V.I.aire)} m², une emprise maximale de ${mille(V.emp)} m² et une SPd maximale de ${mille(V.spd)} m².`,
    `Trois variantes ont été comparées. La variante A (barre) dépasse la longueur de façade admise. La variante C (deux plots) consomme les espaces verts et impose deux cages d’escalier. La variante B (plot de quatre niveaux avec attique) atteint ${mille(spdB)} m² de SPd pour ${mille(surfB)} m² bâtis, corniche à ${m1(VB.corniche)} m pour ${corniche} m admis.`,
    `Le conseil de fondation a retenu la variante B le ${fr(conseil)}, sous réserve du coût de l’attique, pour un budget cible de ${budget}.`,
    `Points à vérifier à l’avant-projet : sondages géotechniques (${nS.societe}), niveau du terrain naturel, retrait de l’attique au nord, relevé des arbres, diagnostic de polluants du hangar, raccordement aux collecteurs communaux, production de chaleur.`,
    `Suite proposée : offre d’honoraires pour le mandat complet.`].join('\n\n');
  rec.MODIFIE=A.plus(Fa.au,-2)+'T16:10:00'; rec.PAR=nomE(R)('cdp');
  const tx={ID:rec.ID+':srcreg',PROJECT_ID:pid,SOURCE_ID:'srcreg',TEXTE:reg.texte};
  return {ops:[{t:'sgfaisa',id:rec.ID,val:rec},{t:AJD,id:tx.ID,val:tx}],rec,reg,TR}; }

/* ── plannings ── */
const T=(id,lib,d,f,o)=>Object.assign({id,t:'tache',lib,d,f},o), Jl=(id,lib,d,o)=>Object.assign({id,t:'jalon',lib,d},o), Ti=(id,lib)=>({id,t:'titre',lib});
const version=(L,chg,sans)=>L.filter(x=>!(sans||[]).includes(x.id)).map(x=>Object.assign({},x,(chg||{})[x.id]));
const GROUPES=[['Gros œuvre',['112','201','211']],['Enveloppe',['221','224','226','228']],['Installations techniques',['232','242','244','251','261']],['Aménagements intérieurs',['271','273','281','285','258','287']],['Aménagements extérieurs',['421']]];
function plannings(ctx){ const R=A.REF, pid=ctx.pid, Cal=R.calendrier, P=Cal.permis, Fa=R.faisabilite, rt=recit(R), ph=n=>{ const x=R.phases.find(y=>y.n===n); if(!x) throw new Error('phase '+n); return x; }, cdp=ctx.staff.cdp.user, dt=ctx.staff.dt.user;
  const conc=A.prochainOuvre(A.plus(P.decision,-12)), dSond=rt.d(/Sondages géotechniques/), tp=(id,n,o)=>T(id,ph(n).lib,ph(n).du,ph(n).au,Object.assign({pp:n},o));
  const Lp=[Ti('t-fais','Faisabilité'),T('fais','Étude de faisabilité',Fa.du,Fa.au,{pp:21}),Jl('j-cons','Présentation au conseil de fondation',rt.d(/conseil de fondation/)),Jl('j-fiche','Remise de la fiche de faisabilité',rt.d(/Fiche de faisabilité/)),
    Ti('t-etu','Études'),Jl('j-mand','Signature du mandat complet',Cal.mandat.signe,{rouge:true}),tp('p31',31),T('sond','Sondages géotechniques',A.plus(dSond,-14),dSond,{ent:ctx.mand.geol.nom}),Jl('j-ap','Validation de l’avant-projet',rt.d(/Avant-projet validé/)),tp('p32',32),
    Ti('t-aut','Autorisation'),tp('p33',33),Jl('j-dep','Dépôt de la demande de permis de construire',P.depot,{rouge:true}),T('enq','Enquête publique',P.enqD,P.enqF),Jl('j-syn','Synthèse CAMAC',P.synthese),Jl('j-dev','Validation du devis général',Cal.devisValide),
    Jl('j-conc','Séance de conciliation',conc),Jl('j-av','Signature de l’avenant n° 1',Cal.mandat.avenantSigne),Jl('j-per','Permis de construire',P.decision,{rouge:true,rem:rt.t(/Permis de construire délivré/)}),Jl('j-rec','Fin du délai de recours',P.recours),Jl('j-deb','Début des travaux',Cal.debutTravaux,{rouge:true})];
  const sansRem={rem:''};
  const v1=version(Lp,{p32:{f:'2024-07-26'},p33:{d:'2024-07-29',f:'2024-12-20'},'j-dep':{d:'2024-07-29'},enq:{d:'2024-08-20',f:'2024-09-18'},'j-syn':{d:'2024-10-11'},'j-dev':{d:'2024-10-25'},'j-per':{d:'2024-11-04',...sansRem},'j-rec':{d:'2024-12-16'},'j-deb':{d:'2025-02-03'}},['j-conc','j-av']);
  const v2=version(Lp,{'j-per':{d:'2024-11-18',...sansRem},'j-rec':{d:'2025-01-06'},'j-deb':{d:'2025-02-17'}},['j-conc','j-av']);
  const v3=version(Lp,{'j-per':sansRem,'j-conc':{d:'2024-11-06'}},['j-av']);
  const v4=version(Lp,{'j-per':sansRem},['j-av']), vA=version(Lp,{},['j-av']);   /* vA : état d'avant la dernière modification, gardé en copie automatique */
  const lots=new Map(R.lots.map(l=>[l.k,l])), nGr=GROUPES.reduce((s,g)=>s+g[1].length,0); if(nGr!==R.lots.length) throw new Error('planning : '+nGr+' lots rangés pour '+R.lots.length);
  const lig=k=>{ const l=lots.get(k); if(!l) throw new Error('planning : lot '+k); return T('lot'+k,l.lib,l.trav[0],l.trav[1],{ent:ctx.ent[k][0].nom}); };
  const finGo=rt.d(/Fin du gros œuvre/), locataires=isoFr(rt.x(/locataires le (\d{2}\.\d{2}\.\d{4})/)), levee='2026-10-16';
  const Lc=[Ti('t-prep','Préparation'),tp('p41',41),tp('p51',51),Jl('j-adj','Premières adjudications',rt.d(/Premières adjudications/)),
    Ti('t-dir','Direction des travaux'),Jl('j-deb','Début des travaux',Cal.debutTravaux,{rouge:true}),tp('p52',52),
    ...GROUPES.flatMap(([g,L],i)=>[Ti('t-g'+i,g),...L.map(lig),...(i===0?[Jl('j-go','Fin du gros œuvre',finGo,{rem:rt.t(/Fin du gros œuvre/)})]:[])]),
    Ti('t-fin','Achèvement'),Jl('j-recp','Réception de l’ouvrage',Cal.reception,{rouge:true,rem:rt.t(/Réception de l’ouvrage/)}),T('levee','Levée des réserves',A.plus(Cal.reception,1),levee,{ent:ctx.staff.dt.nom}),Jl('j-hab','Permis d’habiter',P.habiter,{rouge:true}),
    Jl('j-loc','Arrivée des premiers locataires',locataires),tp('p53',53),Jl('j-dec','Décompte final',Cal.decompteFinal)];
  Lc.find(x=>x.id==='lot201').rem=rt.t(/Rocher plus dur/); Lc.find(x=>x.id==='lot221').rem=rt.t(/Retard des fenêtres/);
  const t1={lot201:{f:'2025-04-18',rem:''},lot211:{d:'2025-04-07',f:'2025-10-17'},lot221:{d:'2025-10-06',f:'2025-12-05',rem:''},lot224:{d:'2025-10-20',f:'2025-11-21'},'j-go':{d:'2025-10-17',rem:''}};
  const sans1=['levee','j-loc','j-dec'];
  const c1=version(Lc,{...t1,'j-recp':{rem:''}},sans1);
  const c2=version(Lc,{...t1,lot201:{rem:rt.t(/Rocher plus dur/)},lot211:{f:'2025-10-17'},'j-recp':{rem:''}},sans1);
  const c3=version(Lc,{lot285:{d:'2026-06-01',f:'2026-07-03'},lot287:{d:'2026-08-10',f:'2026-08-21'},'j-recp':{rem:''}},sans1);
  const c4=version(Lc,{'j-recp':{rem:''}},['levee','j-dec']);
  const a1=version(Lc,{levee:{f:'2026-09-30'}},['j-dec']), a2=version(Lc,{levee:{f:'2026-10-09'}});
  const ctl=L=>{ L.forEach(x=>{ const d=A.jour(x.d), f=A.jour(x.f); if(x.t!=='titre'&&(d==null||(x.t==='tache'&&(f==null||f<d)))) throw new Error('planning : dates de « '+x.lib+' »'); }); return L; };
  const ops=[], plan=(type,L,modifie,par)=>{ const id=pid+':'+type; ctl(L); ops.push({t:'sgplanning',id,val:{ID:id,PROJECT_ID:pid,TYPE:type,MODIFIE:modifie,PAR:par,LIGNES:L}}); };
  const indice=(type,n,date,motif,dest,L,par,rem)=>{ const id=pid+':'+type+':i'+n; ctl(L); ops.push({t:'sgplanningarch',id,val:{ID:id,PROJECT_ID:pid,TYPE:type,SORTE:'indice',INDICE:n,DATE:date,MOTIF:motif,DEST:dest,REM:rem||'',LIGNES:L,EMIS:date+'T09:30:00.000Z',PAR:par}}); };
  const copie=(type,modifie,cree,L,par)=>{ const id=pid+':'+type+':a'+modifie.replace(/\D/g,'').slice(0,14); ctl(L); ops.push({t:'sgplanningarch',id,val:{ID:id,PROJECT_ID:pid,TYPE:type,SORTE:'auto',DATE:modifie.slice(0,10),MODIFIE:modifie,PAR:par,LIGNES:L,CREE:cree}}); };
  const MO='Maître de l’ouvrage', MAND=MO+', mandataires', ENT=MO+', entreprises';
  indice('projet',1,'2024-02-05','Planning initial',MO,v1,cdp); indice('projet',2,rt.d(/places de parc/),'Parking porté de '+rt.x(/passe de (\d+) à/)+' à '+rt.x(/à (\d+) places/)+' places : projet de l’ouvrage prolongé de deux semaines',MAND,v2,cdp);
  indice('projet',3,'2024-10-07','Oppositions reçues : décision de la Municipalité attendue le '+fr(P.decision),MAND,v3,cdp,'Séance de conciliation à fixer avec le service technique.'); indice('projet',4,P.notif,'Permis délivré',MAND,v4,cdp);
  copie('projet','2026-09-16T08:45:00.000Z','2026-10-02T08:30:00.000Z',vA,cdp); plan('projet',Lp,'2026-10-02T08:30:00.000Z',cdp);
  indice('chantier',1,'2025-02-17','Planning général des travaux',ENT,c1,dt); indice('chantier',2,'2025-04-14','Rocher de la fouille nord : terrassements prolongés d’une semaine',ENT,c2,dt);
  indice('chantier',3,'2025-11-24','Fin du gros œuvre le '+fr(finGo)+' et livraison décalée des fenêtres',ENT,c3,dt); indice('chantier',4,'2026-06-15','Réception confirmée au '+fr(Cal.reception)+', finitions recalées',ENT,c4,dt);
  copie('chantier','2026-09-02T15:42:10.000Z','2026-10-05T10:05:30.000Z',a1,dt); copie('chantier','2026-10-05T10:05:30.000Z','2026-10-20T14:12:00.000Z',a2,dt); plan('chantier',Lc,'2026-10-20T14:12:00.000Z',dt);
  return ops; }

/* ── permis de construire ── */
function permis(ctx,p){ const R=A.REF, pid=ctx.pid, P=R.calendrier.permis, rt=recit(R), N=nomE(R), cdp=N('cdp'), dt=N('dt'), L=c=>ctx.ent[c][0].nom, Mod=(iso,h)=>iso+'T'+h+':00.000Z', Mu='Municipalité', Sy='Synthèse CAMAC', ECA='ECA (incendie)', DGE='DGE (environnement)', Ea='Service des eaux', Vo='Voirie';
  const conc=A.prochainOuvre(A.plus(P.decision,-12)), corniche=rt.x(/corniche à ([\d.]+ m)/), opp1=rt.x(/\((.+?), hauteur/), opp2=rt.x(/; (.+?), arbres/), jOpp=rt.d(/Deux oppositions/), cheminR=R.adresse.rue.replace(/ \d+$/,''), reserves=rt.x(/avec (\d+) réserves/);
  const cond=(n,source,texte,quand,resp,etat,le,rem)=>({id:'cnd'+dd(n),num:String(n),source,texte,quand,resp,etat,le:le||'',rem:rem||''});
  const OBJ='Démolition du hangar existant (ECA n° '+R.eca+') et '+R.titreLong.charAt(0).toLowerCase()+R.titreLong.slice(1);
  const d1={ID:pid+':demande00001',PROJECT_ID:pid,N:1,LIB:'Permis de construire',PROC:'enquete',AUTORITE:'Municipalité d’'+R.lieu,NUM_COMMUNE:'2024-031',NUM_CANTON:'224815',PARCELLES:'Parcelle n° '+R.parcelle,FAO:'FAO n° 71 du '+fr(P.enqD),OBJET:OBJ,
    REM:'Dossier déposé sur la CAMAC. Gabarits posés par le géomètre pendant l’enquête.',DATES:{depot:P.depot,enq_d:P.enqD,enq_f:P.enqF,synthese:P.synthese,decision:P.decision,notif:P.notif,recours:P.recours,debut:P.debut,habiter:P.habiter},DECISION:'delivre',RECOURS:{etat:''},VALIDITE:2,PROLONG:0,
    OPPOSITIONS:[{id:'opp01',date:A.plus(jOpp,-4),sorte:'opposition',auteur:maj(opp1)+', '+cheminR+' 4',motifs:'Hauteur de l’immeuble et ombre portée sur le jardin.',suite:'levee',rem:'Levée à la séance de conciliation du '+fr(conc)+' : les coupes de gabarit montrent que la hauteur à la corniche reste sous les '+corniche+'.'},
      {id:'opp02',date:A.plus(jOpp,-1),sorte:'opposition',auteur:opp2,motifs:'Abattage des arbres le long du chemin pour la rampe du parking.',suite:'levee',rem:'Levée à la séance de conciliation du '+fr(conc)+' : le maître de l’ouvrage remplace les arbres abattus par des essences indigènes en pleine terre, le long du chemin.'},
      {id:'opp03',date:jOpp,sorte:'observation',auteur:'Mme Gisèle Remarque, '+cheminR+' 7',motifs:'Bruit du chantier et horaires de travail.',suite:'reponse',rem:'Réponse du service technique dans la décision du '+fr(P.decision)+'.'}],
    CONDITIONS:[cond(1,Mu,'Annoncer le début des travaux au service technique sept jours à l’avance.','avant',dt,'reglee','2025-02-21'),
      cond(2,Mu,'Faire contrôler l’implantation du bâtiment par le géomètre avant le début du gros œuvre.','pendant',ctx.mand.geom.nom,'reglee','2025-04-11'),
      cond(3,DGE,'Remettre le diagnostic de polluants du hangar et le plan de gestion des déchets de chantier avant la démolition.','avant',cdp,'reglee','2025-02-14'),
      cond(4,Ea,'Soumettre les plans de raccordement aux collecteurs communaux, en système séparatif ; contrôle de la fouille ouverte par le service.','avant',ctx.mand.ing.nom,'reglee','2025-02-28'),
      cond(5,ECA,'Mettre à jour le concept de protection incendie avant l’exécution : clapets coupe-feu sur les gaines de ventilation et désenfumage de la cage d’escalier.','avant',ctx.mand.cvse.nom,'reglee','2025-01-31'),
      cond(6,DGE,'Appliquer la directive sur le bruit des chantiers ; travaux bruyants de 8 h à 12 h et de 13 h à 17 h, jours ouvrables seulement.','pendant',dt,'reglee','2026-08-28'),
      cond(7,DGE,'Traiter les eaux de chantier selon la recommandation SIA 431 avant tout rejet.','pendant',L('201'),'reglee','2025-10-31'),
      cond(8,Sy,'Respecter le volume de rétention des eaux claires et le débit de restitution de 20 l/s/ha.','pendant',ctx.mand.ing.nom,'reglee','2026-06-12'),
      cond(9,ECA,'Poser des portes EI30 entre le parking et la cage d’escalier, et faire réceptionner les clapets coupe-feu.','pendant',L('244'),'reglee','2026-05-22'),
      cond(10,Mu,'Remplacer les arbres abattus par des essences indigènes en pleine terre, le long du chemin.','habiter',L('421'),'reglee','2026-08-28','Engagement pris à la séance de conciliation du '+fr(conc)+'.'),
      cond(11,ECA,'Faire contrôler les installations de protection incendie par l’ECA avant l’occupation.','habiter',dt,'reglee','2026-09-08'),
      cond(12,Sy,'Remettre le justificatif énergétique final et l’attestation des installations techniques.','habiter',ctx.mand.cvse.nom,'reglee','2026-09-04'),
      cond(13,DGE,'Mesurer le bruit de la pompe à chaleur en toiture après la mise en service et transmettre le rapport.','autre',ctx.mand.phys.nom,'cours','','Mesure prévue en période de chauffage, à la mise en régime de l’installation.'),
      cond(14,Mu,'Remettre au service technique les plans conformes à l’exécution dans les trois mois suivant la réception.','autre',cdp,'regler','','Attendre la levée des '+reserves+' réserves.'),
      cond(15,Vo,'Remettre en état le '+cheminR+' au droit du chantier et le faire contrôler par le service de la voirie.','autre',L('201'),'regler','')],
    MODIFIE:Mod('2026-10-22','09:40'),PAR:ctx.staff.cdp.user};
  const proposees=SGPC.proposees(d1); if(proposees.peremption) d1.DATES.peremption=A.iso(proposees.peremption.n);
  const dDep='2025-05-12', dDec='2025-06-02', dNot='2025-06-04', dDeb='2025-07-07';
  const d2={ID:pid+':demande00002',PROJECT_ID:pid,N:2,LIB:'Demande complémentaire 1',PROC:'dispense',AUTORITE:d1.AUTORITE,NUM_COMMUNE:d1.NUM_COMMUNE+'/1',NUM_CANTON:'',PARCELLES:d1.PARCELLES,FAO:'',
    OBJET:'Parking souterrain : adaptation de la rampe d’accès et déplacement de la grille de ventilation, à la suite du rocher rencontré dans la fouille nord.',REM:'Dispense d’enquête publique accordée par la Municipalité : travaux de minime importance, sans atteinte aux intérêts des voisins (art. 111 LATC).',
    DATES:{depot:dDep,decision:dDec,notif:dNot,recours:A.iso(SGPC.finDelai(A.jour(dNot),30)),debut:dDeb,habiter:P.habiter},DECISION:'delivre',RECOURS:{etat:''},VALIDITE:2,PROLONG:0,OPPOSITIONS:[],
    CONDITIONS:[cond(1,Mu,'Garder une pente de 15 % au plus et une largeur de 5.50 m sur les cinq premiers mètres de la rampe.','pendant',dt,'reglee','2025-10-24'),cond(2,ECA,'Placer la grille de ventilation à 3 m au moins des fenêtres du rez-de-chaussée.','pendant',ctx.mand.cvse.nom,'reglee','2026-05-22')],
    MODIFIE:Mod('2026-05-26','16:05'),PAR:ctx.staff.cdp.user};
  return {ops:[{t:'sgpermis',id:d1.ID,val:d1},{t:'sgpermis',id:d2.ID,val:d2}],ids:[d1.ID,d2.ID]}; }

/* ── avancement : un état par trimestre ── */
function avancement(ctx,p){ const R=A.REF, pid=ctx.pid, Cal=R.calendrier, P=Cal.permis, rt=recit(R), N=nomE(R), PH=R.phases, D=SGAV.donnees(p), par=ctx.staff.cdp.user;
  if(D.mode!=='contrat'||Math.abs(D.totalSia-100)>.01) throw new Error('avancement : contrats mal lus ('+D.mode+', '+D.totalSia+' %)');
  const COURT={31:'Avant-projet',32:'Projet de l’ouvrage',33:'Procédure d’autorisation',41:'Appels d’offres',51:'Projet d’exécution',52:'Exécution',53:'Mise en service'};
  const num={}; Object.entries(ctx.sub).forEach(([n,id])=>{ num[id]=+n; });
  const H={}; DS.by('timelog','PROJECT_ID',pid).forEach(r=>{ const n=num[r.SUBPHASE_ID]; if(n==null) return; const m=r.TIMEYEAR+'-'+dd(r.TIMEMONTH+1); (H[n]=H[n]||{})[m]=(H[n][m]||0)+(+r.TIMEPERIOD||0); });
  const hA=(n,d)=>Object.entries(H[n]||{}).reduce((s,[m,h])=>m<=d.slice(0,7)?s+h:s,0), cran=v=>Math.round(v/5)*5, ceil5=v=>Math.ceil(v/5-1e-9)*5;
  const fact=d=>{ const L=R.factures.filter(f=>f.contrat==='mandat'&&f.phases&&f.date<=d), f=L[L.length-1], o={}; PH.forEach(x=>{ const cles=FE_DET[x.n].map(y=>y[0]), tot=cles.reduce((s,k)=>s+(R.sia[k]||0),0); o[x.n]=f?cles.reduce((s,k)=>s+(f.phases[k]||0),0)/tot*100:0; }); return o; };
  const prevu=(x,d)=>{ const a=A.jour(x.du), b=A.jour(x.au), j=A.jour(d); return Math.max(0,Math.min(100,cran((j-a+1)/(b-a+1)*100))); };
  const q=rt.d(/Premières adjudications/), finGo=rt.d(/Fin du gros œuvre/);
  const ETATS=[['2024-03-28',`Sondages géotechniques faits : rocher à ${rt.x(/rocher à ([\d.]+ m)/)} au nord de la parcelle. Validation de l’avant-projet attendue en avril.`],
    ['2024-06-28',`Avant-projet validé le ${fr(rt.d(/Avant-projet validé/))}. Parking porté de ${rt.x(/passe de (\d+) à/)} à ${rt.x(/à (\d+) places/)} places : heures supplémentaires sur le projet de l’ouvrage.`],
    ['2024-09-30',`Demande de permis déposée le ${fr(P.depot)}, enquête publique jusqu’au ${fr(P.enqF)} : deux oppositions et une observation.`],
    ['2024-12-20',`Permis délivré le ${fr(P.decision)}, devis général validé le ${fr(Cal.devisValide)}, avenant n° 1 signé le ${fr(Cal.mandat.avenantSigne)}. Délai de recours jusqu’au ${fr(P.recours)}.`],
    ['2025-03-31',`Travaux commencés le ${fr(Cal.debutTravaux)}, premières adjudications dès le ${fr(q)}. Appels d’offres terminés.`],
    ['2025-06-30',`Projet d’exécution terminé. Rocher de la fouille nord traité au brise-roche. ${N('anc')} quitte le bureau, ${N('cdp')} reprend ses dossiers.`],
    ['2025-09-30',`Gros œuvre aux étages, deux semaines de retard après les intempéries de juin.`],
    ['2025-12-19',`Gros œuvre terminé le ${fr(finGo)}. Livraison de deux étages de fenêtres décalée, toiture étanche.`],
    ['2026-03-31',`Façades crépies et plâtrerie terminées, stores et ascenseur en cours. Choix du parquet arrêté avec le maître de l’ouvrage.`],
    ['2026-06-30',`Second œuvre presque terminé. Infiltration du saut-de-loup reprise par l’entreprise de gros œuvre.`],
    ['2026-09-30',`Réception le ${fr(Cal.reception)} avec ${rt.x(/avec (\d+) réserves/)} réserves mineures, permis d’habiter le ${fr(P.habiter)}.`],
    [Cal.decompteFinal,`Décompte final en cours : ${rt.x(/(\d+) entreprises/)} entreprises restent à solder, garanties bancaires reçues.`]];
  const ops=[], aIds=A.ids('sgavancement',ETATS.length), iIds=A.ids('projectimplementation',ETATS.length), lignes=[];
  ETATS.forEach(([date,rem],i)=>{ const F=fact(date), EFF={}, PREV={}, PROP={};
    PH.forEach(x=>{ const b=+x.h, h=hA(x.n,date), conso=b>0?h/b*100:0, fini=date>=x.au, av=date<x.du&&!h;
      EFF[x.n]=av?0:Math.min(100,Math.max(fini?100:Math.min(95,cran(conso)),ceil5(F[x.n])));
      PREV[x.n]=prevu(x,date); if(b>0&&conso<100) PROP[x.n]=Math.min(95,cran(conso)); });
    const gE=Math.round(SGAV.global(D,EFF)*10)/10, gP=Math.round(SGAV.global(D,PREV)*10)/10, enC=PH.filter(x=>x.du<=date&&date<=x.au), nom=(enC.length?enC.map(x=>x.n+' '+COURT[x.n]).join(', ')+' en cours':'Mandat en cours').slice(0,64), mod=date+'T16:30:00.000Z';
    ops.push({t:'sgavancement',id:aIds[i],val:{ID:aIds[i],PROJECT_ID:pid,DATE:date,NOM:nom,REMARQUE:rem,EFF,PREV,PROP,GLOBAL_EFF:gE,GLOBAL_PREV:gP,IMPL_ID:iIds[i],PAR:par,MODIFIE:mod}},
      {t:'projectimplementation',id:iIds[i],val:{ID:iIds[i],PROJECT_ID:pid,IMPLEMENTATIONDATE:date,NAME:nom,SCHEDULEDVALUE:Math.round(gP),SCHEDULEDUSERID:par,SCHEDULEDREMARK:null,CURRENTVALUE:Math.round(gE),CURRENTUSERID:par,CURRENTREMARK:rem}});
    lignes.push(date+' '+gE+' %'); });
  return {ops,lignes}; }

/* ── apports et bouclement ── */
function apports(ctx){ const R=A.REF, Cal=R.calendrier, e=R.equipe.find(x=>x.apporteuse), S=ctx.staff[e.cle], [a,v]=A.ids('sgapport',2), pid=ctx.pid;
  return [{t:'sgapport',id:a,val:{ID:a,TYPE:'apport',STAFF_ID:S.id,PROJECT_ID:pid,DATE:Cal.debutAffaire,TRAVAUX:null,TAUX:null,FINAL:Cal.decompteFinal,REMARQUE:`Mise en relation de la ${R.mo.societe} avec le bureau par ${e.prenom} ${e.nom} ; première rencontre le ${fr(Cal.debutAffaire)}.`}},
    {t:'sgapport',id:v,val:{ID:v,TYPE:'versement',STAFF_ID:S.id,PROJECT_ID:pid,DATE:'2026-03-31',MONTANT:8000,REMARQUE:'Acompte sur la commission, versé avec le salaire de mars.'}}]; }
function bouclement(ctx){ const an=+A.REF.aujourdhui.slice(0,4)-1, qui=ctx.me.user, ops=[], noms=[], LE=an+1+'-01-15T09:00';
  ['cdp','arch','dess','dt','tech'].forEach(k=>{ const s=DS.get('staff',ctx.staff[k].id), b=sgBoucler(s,an), id=an+':'+s.ID, ecart=k==='tech'?2.5:0;   /* technicien : heures corrigées après la validation, étiquette « modifié » */
    ops.push({t:'sgbouclement',id,val:{ID:id,ANNEE:an,STAFF_ID:s.ID,VALIDE:1,PAR:qui,LE,HS:A.arr(b.hs+ecart),VAC:b.vacSolde,TRANSFERE:0,TRANSFERE_LE:null}}); noms.push(k+' '+b.hs); });
  return {ops,noms}; }

A.mod(90,'modules','Faisabilité, plannings, permis, avancement, apports, bouclement, volume SIA 416',async ctx=>{
  const p=DS.get('project',ctx.pid); if(!p) throw new Error('module 90 : affaire absente');
  await DS.need(['sgfaisa',AJD,'sgplanning','sgplanningarch','sgpermis','sgavancement','projectimplementation','sgapport','sgbouclement','sgcontrattravail','timelog','projectphase','projectsubphase','stafftargettime','publicholiday','sgsurfaces']);
  await A.cadre();
  const F=await faisabilite(ctx,p), Pl=plannings(ctx), Pc=permis(ctx,p), Av=avancement(ctx,p), Ap=apports(ctx), Bo=bouclement(ctx);
  /* surfaces et volumes (10.11.2026) : volume bâti SIA 416 de la référence, saisi dans le module du projet */
  const Sv=[{t:'sgsurfaces',id:String(ctx.pid),val:{ID:String(ctx.pid),PROJECT_ID:ctx.pid,VB:A.REF.volume,MODIFIE:'2024-04-18T16:00:00.000Z',PAR:ctx.me.user}}];
  await A.commit([...F.ops,...Pl,...Pc.ops,...Av.ops,...Ap,...Bo.ops,...Sv]);
  ctx.permis={demandes:Pc.ids};
  ctx.faisa={source:'srcreg',titre:F.TR,texte:F.reg.texte,pages:F.reg.pages,articles:F.reg.articles,
    lierFichier:async fid=>{ const r=JSON.parse(JSON.stringify(DS.get('sgfaisa',String(ctx.pid)))), s=r.SOURCES.find(x=>x.ID==='srcreg'); s.FICHIER=fid; await A.commit([{t:'sgfaisa',id:r.ID,val:r}]); }};
  A.log('faisabilité :',F.rec.CONTRAINTES.length+' contraintes, '+F.rec.SOURCES.length+' sources, '+F.reg.articles+' articles ; plannings et indices :',Pl.length,'enregistrements ; avancement :',Av.lignes.join(' · '),'; bouclement :',Bo.noms.join(', '));
});
})();

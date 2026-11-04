/* ═══ AFFAIRE DE TRAVAIL 99TST — RÉFÉRENCE UNIQUE (04.11.2026 ; Paulo : « une affaire de toutes pièces […] cette affaire devient une affaire de travail
   pour développer l'app ») ═══
   Tout est FICTIF : noms, entreprises, adresses, montants. Aucune donnée de client. Chaque module lit ses valeurs ICI : ne jamais recopier une
   valeur en dur dans un module. Ce fichier ne va ni dans SUBGestion3.html ni sur le NAS : il est injecté dans la page de l'aperçu seulement. */
window.AT=window.AT||{};
AT.REF={
  aujourdhui:'2026-11-04',
  code:'99TST', titre:'Immeuble Les Exemples', titreLong:'Construction d’un immeuble de 18 logements avec parking souterrain',   /* ni « faisabilité » ni « expert » dans le titre : sgCatProjet */
  lieu:'Exempleville', canton:'VD', adresse:{rue:'Chemin du Projet 2',npa:'1000',loc:'Exempleville'},
  parcelle:'1234', eca:'567', volume:12000, surface:3200, surfaceParcelle:2150, zone:'Zone de moyenne densité',

  mo:{societe:'Fondation Exemple',rue:'Rue de l’Essai 1',npa:'1000',loc:'Exempleville',tel:'+41 21 000 10 10',mail:'info@fondation-exemple.test',ide:'CHE-000.000.101',
      personnes:[{cle:'pres',prenom:'Henri',nom:'Référence',titre:'Président',tel:'+41 79 000 10 11',mail:'h.reference@fondation-exemple.test'},
                 {cle:'dir',prenom:'Hélène',nom:'Témoignage',titre:'Directrice, représentante du maître de l’ouvrage',tel:'+41 79 000 10 12',mail:'h.temoignage@fondation-exemple.test'}]},
  commune:{societe:'Commune d’Exempleville, Service technique',rue:'Place de la Maison de Commune 1',npa:'1000',loc:'Exempleville',tel:'+41 21 000 20 20',mail:'technique@exempleville.test',
      personnes:[{cle:'chef',prenom:'Paul',nom:'Règlement',titre:'Chef du service technique',tel:'+41 21 000 20 21',mail:'p.reglement@exempleville.test'}]},
  /* mandataires : role = TEAMROLECODE à vérifier dans R2 ; cfc = position du devis général */
  mandataires:[
    {cle:'ing',societe:'Bureau Calcul Exemple SA',metier:'Ingénieur civil',cfc:'292',rue:'Avenue du Calcul 12',npa:'1001',loc:'Exempleville',tel:'+41 21 000 30 30',mail:'info@calcul-exemple.test',
     personne:{prenom:'Pierre',nom:'Calcul',titre:'Ingénieur civil EPFL',tel:'+41 79 000 30 31',mail:'p.calcul@calcul-exemple.test'}},
    {cle:'cvse',societe:'Thermo Essai Sàrl',metier:'Ingénieurs CVSE',cfc:'294',rue:'Route de la Chaleur 8',npa:'1002',loc:'Essaiville',tel:'+41 21 000 31 30',mail:'info@thermo-essai.test',
     personne:{prenom:'Yves',nom:'Fluide',titre:'Ingénieur CVS',tel:'+41 79 000 31 31',mail:'y.fluide@thermo-essai.test'}},
    {cle:'geom',societe:'Géomètres Mesure Exemple SA',metier:'Géomètre',cfc:'296.0',rue:'Rue de la Borne 3',npa:'1000',loc:'Exempleville',tel:'+41 21 000 32 30',mail:'info@mesure-exemple.test',
     personne:{prenom:'Laure',nom:'Borne',titre:'Ingénieure géomètre',tel:'+41 79 000 32 31',mail:'l.borne@mesure-exemple.test'}},
    {cle:'phys',societe:'Acoustique Modèle Sàrl',metier:'Physique du bâtiment',cfc:'',rue:'Chemin du Son 5',npa:'1002',loc:'Essaiville',tel:'+41 21 000 33 30',mail:'info@acoustique-modele.test',
     personne:{prenom:'Sarah',nom:'Décibel',titre:'Physicienne du bâtiment',tel:'+41 79 000 33 31',mail:'s.decibel@acoustique-modele.test'}},
    {cle:'geol',societe:'Géotechnique Sondage SA',metier:'Géologue',cfc:'102',rue:'Route des Carottes 21',npa:'1003',loc:'Modèleville',tel:'+41 21 000 34 30',mail:'info@sondage-exemple.test',
     personne:{prenom:'Marc',nom:'Sondage',titre:'Géologue',tel:'+41 79 000 34 31',mail:'m.sondage@sondage-exemple.test'}}],

  /* équipe du bureau : FICTIVE, sauf le compte courant de l'app (ME), ajouté à l'équipe au rôle 12 pour que Cockpit et Mes projets montrent l'affaire.
     heures = part des heures de chaque phase (somme ≈ 1 par phase) ; interne = taux interne CHF/h (staffrate) ; pas de Substances Architectes dans les noms (sgBureauAdresse). */
  equipe:[
    {cle:'cdp', prenom:'Anne',  nom:'Modèle',    ini:'AMO',fonction:'Architecte, cheffe de projet',naissance:'1984-05-12',entree:'2021-03-01',taux:100,salaire:104000,interne:82,contratNo:'2021-01'},
    {cle:'arch',prenom:'Marc',  nom:'Essai',     ini:'MES',fonction:'Architecte',naissance:'1990-11-03',entree:'2022-09-01',taux:90,salaire:88000,interne:74,contratNo:'2022-03'},
    {cle:'dess',prenom:'Julie', nom:'Témoin',    ini:'JTE',fonction:'Dessinatrice en bâtiment',naissance:'1993-02-21',entree:'2020-01-15',taux:80,salaire:76000,interne:66,contratNo:'2020-01'},
    {cle:'dt',  prenom:'Sophie',nom:'Épreuve',   ini:'SEP',fonction:'Directrice des travaux',naissance:'1976-07-30',entree:'2019-06-01',taux:100,salaire:112000,interne:88,contratNo:'2019-02',apporteuse:true},
    {cle:'tech',prenom:'Luc',   nom:'Maquette',  ini:'LMA',fonction:'Technicien, projet d’exécution',naissance:'1988-09-09',entree:'2023-03-01',taux:100,salaire:92000,interne:76,contratNo:'2023-01'},
    {cle:'appr',prenom:'Théo',  nom:'Spécimen',  ini:'TSP',fonction:'Apprenti dessinateur',naissance:'2006-04-18',entree:'2023-08-14',taux:100,salaire:14400,interne:32,contratNo:'2023-04',apprenti:true},
    {cle:'anc', prenom:'Nora',  nom:'Brouillon', ini:'NBR',fonction:'Architecte',naissance:'1991-12-02',entree:'2021-09-01',sortie:'2025-06-30',taux:100,salaire:86000,interne:72,contratNo:'2021-04'}],

  tarifHoraire:135, tva:8.1, tvaAvant2024:7.7, fraisPct:3,
  /* prestations SIA 102 du mandat (clés de Facturation) et phases partielles */
  sia:{'431a':3,'431b':6,'432a':13,'432b':4,'432c':4,'433':2.5,'441a':10,'441b':8,'451a':15,'451b':1,'452a':6,'452b':23,'453a':1,'453b':1,'453c':1.5,'453d':1},
  /* phases et budgets (contrat FINAL, après l'avenant) : part %, honoraires HT, heures au contrat, part des heures saisies (exerce les alertes) */
  phases:[
    {n:31,g:3,lib:'Avant-projet',part:9,  ht:47286, h:350, saisi:.95, du:'2024-01-29',au:'2024-04-26'},
    {n:32,g:3,lib:'Projet de l’ouvrage',part:21, ht:110334,h:817, saisi:1.12,du:'2024-04-29',au:'2024-08-09'},
    {n:33,g:3,lib:'Procédure de demande d’autorisation',part:2.5,ht:13135, h:97,  saisi:1.0, du:'2024-08-12',au:'2025-01-17'},
    {n:41,g:4,lib:'Appels d’offres, comparaison des offres et propositions d’adjudication',part:18,ht:94572,h:701,saisi:.90,du:'2024-10-01',au:'2025-02-28'},
    {n:51,g:5,lib:'Projet d’exécution',part:16, ht:84064, h:623, saisi:1.05,du:'2025-01-06',au:'2025-05-30'},
    {n:52,g:5,lib:'Exécution de l’ouvrage',part:29, ht:152366,h:1129,saisi:.98, du:'2025-03-03',au:'2026-08-28'},
    {n:53,g:5,lib:'Mise en service, achèvement',part:4.5,ht:23643, h:175, saisi:.60, du:'2026-08-31',au:'2026-11-03'}],
  faisabilite:{groupe:2,lib:'Faisabilité',h:100,saisi:.96,ht:13500,du:'2023-02-20',au:'2023-06-30'},
  /* qui travaille sur quelle phase (parts des heures de la phase) ; me = compte courant (associé) */
  repartition:{2:{cdp:.55,arch:.40,me:.05},31:{cdp:.40,arch:.35,dess:.21,me:.04},32:{cdp:.28,arch:.30,dess:.22,anc:.17,me:.03},33:{cdp:.60,dess:.36,me:.04},
    41:{cdp:.30,tech:.30,dt:.27,anc:.10,me:.03},51:{tech:.40,arch:.25,dess:.22,appr:.10,me:.03},52:{dt:.62,cdp:.12,tech:.18,appr:.05,me:.03},53:{dt:.72,cdp:.24,me:.04}},

  calendrier:{debutAffaire:'2023-02-06',
    faisa:{offre:'2023-02-10',signe:'2023-02-20',factureFinale:'2023-06-30',payee:'2023-07-18'},
    variante:{offre:'2024-01-08',annulee:'2024-01-12'},
    mandat:{offre:'2024-01-15',signe:'2024-01-29',avenant:'2024-11-11',avenantSigne:'2024-11-25'},
    expertise:{offre:'2025-05-12'},
    permis:{depot:'2024-08-12',enqD:'2024-09-03',enqF:'2024-10-02',synthese:'2024-10-28',decision:'2024-11-25',notif:'2024-11-28',recours:'2025-01-13',debut:'2025-03-03',habiter:'2026-09-14'},
    devisValide:'2024-11-08', debutTravaux:'2025-03-03', reception:'2026-08-31', decompteFinal:'2026-10-30'},

  /* contrats Facturation */
  contrats:{
    faisa:{projet:'Étude de faisabilité',statut:'Faisabilité',tva:7.7,frais:0,mode:'unitaire',
      lignes:[{lbl:'Analyse du site et du règlement',heures:40,prix:135,amt:5400,com:'Relevé du contexte, RDPPF, règlement communal'},{lbl:'Variantes volumétriques',heures:60,prix:135,amt:8100,com:'Trois variantes comparées'}]},
    mandat:{projet:'Construction d’un immeuble de 18 logements avec parking souterrain',court:'Immeuble Les Exemples',statut:'Mandat complet',tva:8.1,frais:3,mode:'relatif',
      /* catégorie IV, coefficients 1, ch_h 135, rabais 0, mandataires ch_ing_pct 2.8, ch_cvse_pct 1.05, ch_geom_pct 0.35 */
      v1:{ch_cfc1:54050,ch_cfc2:3233595.30,ch_cfc4:48645,ch_cfc5:179449,B:2624300,hht:491300,httc:531095.30},
      v2:{ch_cfc1:54050,ch_cfc2:3525573.40,ch_cfc4:48645,ch_cfc5:179449,B:2848900,hht:525400,httc:567957.40}},
    variante:{projet:'Variante sans attique',statut:'Projet',tva:8.1,frais:3,mode:'forfait',forfait:150000,rabais:10},
    expertise:{projet:'Expertise de l’état des façades de l’immeuble voisin',statut:'Expertise',tva:8.1,frais:0,mode:'relatif',h:150,
      lignes:[{lbl:'Visite et constat',heures:24,prix:150,amt:3600,com:'Rapport illustré'}]}},

  /* factures : phases = % cumulés FACTURÉS à ce jour (mêmes clés que sia) ; statut : Payée (avec paye), Envoyée, Impayée */
  factures:[
    {num:'FA23.91_99TST.FF',contrat:'faisa',date:'2023-06-30',type:'Facture finale',paye:'2023-07-18'},
    {num:'FA24.91_99TST.AC01',contrat:'mandat',date:'2024-04-30',type:'Demande d’acompte n° 1',phases:{'431a':3,'431b':6},paye:'2024-05-21'},
    {num:'FA24.92_99TST.AC02',contrat:'mandat',date:'2024-08-30',type:'Demande d’acompte n° 2',phases:{'431a':3,'431b':6,'432a':13,'432b':4,'432c':4},paye:'2024-09-24'},
    {num:'FA24.93_99TST.AC03',contrat:'mandat',date:'2024-11-29',type:'Demande d’acompte n° 3',phases:{'431a':3,'431b':6,'432a':13,'432b':4,'432c':4,'433':2.5},paye:'2024-12-20'},
    {num:'FA25.91_99TST.AC04',contrat:'mandat',date:'2025-02-28',type:'Demande d’acompte n° 4',phases:{'431a':3,'431b':6,'432a':13,'432b':4,'432c':4,'433':2.5,'441a':10,'441b':8},paye:'2025-03-25'},
    {num:'FA25.92_99TST.F',sansContrat:true,date:'2025-03-10',type:'Facture',paye:'2025-04-01',lignes:[{lbl:'Relevé complémentaire du bâtiment voisin',heures:12,hUnit:'h',prix:135,pUnit:'Frs/h',amt:1620,com:''}]},
    {num:'FA25.93_99TST.AC05',contrat:'mandat',date:'2025-06-30',type:'Demande d’acompte n° 5',phases:{'431a':3,'431b':6,'432a':13,'432b':4,'432c':4,'433':2.5,'441a':10,'441b':8,'451a':15,'451b':1},paye:'2025-07-22'},
    {num:'FA25.94_99TST.AC06',contrat:'mandat',date:'2025-09-30',type:'Demande d’acompte n° 6',phases:{'431a':3,'431b':6,'432a':13,'432b':4,'432c':4,'433':2.5,'441a':10,'441b':8,'451a':15,'451b':1,'452a':2,'452b':6},paye:'2025-10-21'},
    {num:'FA25.95_99TST.NF01',noteFrais:true,contrat:'mandat',date:'2025-12-19',type:'Note de frais n° 1',montant:4210.40,paye:'2026-01-15'},
    {num:'FA25.96_99TST.AC07',contrat:'mandat',date:'2025-12-19',type:'Demande d’acompte n° 7',phases:{'431a':3,'431b':6,'432a':13,'432b':4,'432c':4,'433':2.5,'441a':10,'441b':8,'451a':15,'451b':1,'452a':3,'452b':11},paye:'2026-01-20'},
    {num:'FA26.91_99TST.AC08',contrat:'mandat',date:'2026-03-31',type:'Demande d’acompte n° 8',phases:{'431a':3,'431b':6,'432a':13,'432b':4,'432c':4,'433':2.5,'441a':10,'441b':8,'451a':15,'451b':1,'452a':4,'452b':16},paye:'2026-04-23'},
    {num:'FA26.92_99TST.AC09',contrat:'mandat',date:'2026-06-30',type:'Demande d’acompte n° 9',phases:{'431a':3,'431b':6,'432a':13,'432b':4,'432c':4,'433':2.5,'441a':10,'441b':8,'451a':15,'451b':1,'452a':5,'452b':20},paye:'2026-07-21'},
    {num:'FA26.93_99TST.AC10',contrat:'mandat',date:'2026-08-31',type:'Demande d’acompte n° 10',phases:{'431a':3,'431b':6,'432a':13,'432b':4,'432c':4,'433':2.5,'441a':10,'441b':8,'451a':15,'451b':1,'452a':6,'452b':23},paye:'2026-09-22'},
    {num:'FA26.94_99TST.AC11',contrat:'mandat',date:'2026-09-30',type:'Demande d’acompte n° 11',phases:{'431a':3,'431b':6,'432a':13,'432b':4,'432c':4,'433':2.5,'441a':10,'441b':8,'451a':15,'451b':1,'452a':6,'452b':23,'453a':1,'453b':.5},statut:'Impayée'},   /* échue : exerce Échu et À traiter */
    {num:'FA26.95_99TST.NF02',noteFrais:true,contrat:'mandat',date:'2026-10-15',type:'Note de frais n° 2',montant:3120.80,paye:'2026-10-30'},
    {num:'FA26.96_99TST.AC12',contrat:'mandat',date:'2026-10-30',type:'Demande d’acompte n° 12',phases:{'431a':3,'431b':6,'432a':13,'432b':4,'432c':4,'433':2.5,'441a':10,'441b':8,'451a':15,'451b':1,'452a':6,'452b':23,'453a':1,'453b':1,'453c':1},statut:'Envoyée',ech_j:30,validation:'a_valider'}],

  /* LOTS — un lot, six champs (règles du rapport 9 § 1.4). HT en CHF. dg = positions du devis général ; contrat = brut HT adjudiqué (null = hors contrat) ;
     R, E = rabais, escompte % ; ent = entreprises : [0] adjudicataire, suivantes concurrentes ; soum = offre nette de chaque entreprise, dans le même ordre ; ao = {envoi, retour} ; adj = date du contrat ; trav = [début, fin] */
  lots:[
    {k:'112',lib:'Démolitions',dg:[{cfc:'112',lib:'Démolitions',ht:38000}],lot:'112',bkp:'112',pv:'112',chap:'112',contrat:35000,R:2,E:2,ao:{envoi:'2024-11-04',retour:'2024-12-06'},adj:'2025-02-10',trav:['2025-03-03','2025-03-21'],
     ent:[{n:'Démolition Exemple SA',resp:'Bruno Masse'},{n:'Déconstruction Modèle Sàrl',resp:'Ali Gravat'}]},
    {k:'201',lib:'Terrassements',dg:[{cfc:'201.1',lib:'Fouilles en pleine masse',ht:120000}],lot:'201.1',bkp:'201.1',pv:'201',chap:'211',contrat:112000,R:3,E:2,ao:{envoi:'2024-11-04',retour:'2024-12-06'},adj:'2025-02-14',trav:['2025-03-17','2025-04-25'],
     ent:[{n:'Terrassements Essai SA',resp:'Gérard Pelle'},{n:'Excavation Témoin SA',resp:'Rita Godet'},{n:'Travaux Spéciaux Modèle SA',resp:'Karim Fouille'}]},
    {k:'211',lib:'Béton armé et maçonnerie',dg:[{cfc:'211.5',lib:'Béton et béton armé',ht:560000},{cfc:'211.6',lib:'Maçonnerie',ht:170000}],lot:'211.6',bkp:'211.6',pv:'211.6',chap:'211',contrat:702000,R:3,E:2,prorata:.5,ao:{envoi:'2024-11-11',retour:'2024-12-20'},adj:'2025-02-28',trav:['2025-04-14','2025-10-31'],
     ent:[{n:'Construction Béton Exemple SA',resp:'Olivier Coffrage'},{n:'Maçonnerie Spécimen SA',resp:'Paolo Truelle'},{n:'Génie Civil Test SA',resp:'Émilie Dalle'}]},
    {k:'221',lib:'Fenêtres',dg:[{cfc:'221.1',lib:'Fenêtres en bois-métal',ht:210000}],lot:'221.1',bkp:'221',pv:'221',chap:'221',contrat:218000,R:2,E:2,ao:{envoi:'2024-12-02',retour:'2025-01-17'},adj:'2025-03-31',trav:['2025-10-13','2025-12-19'],
     ent:[{n:'Fenêtres Modèle SA',resp:'Vincent Vitrage'},{n:'Menuiserie Exemple Sàrl',resp:'Agnès Châssis'},{n:'Alu Fenêtres Test SA',resp:'Tom Profil'}]},
    {k:'224',lib:'Étanchéité de toiture',dg:[{cfc:'224.1',lib:'Étanchéité souple',ht:95000}],lot:'224.1',bkp:'224',pv:'224',chap:'224',contrat:91000,R:0,E:2,ao:{envoi:'2024-12-02',retour:'2025-01-17'},adj:'2025-04-11',trav:['2025-11-03','2025-12-05'],
     ent:[{n:'Étanchéité Essai SA',resp:'Nadia Bitume'},{n:'Toitures Exemple Sàrl',resp:'Hugo Lé'}]},
    {k:'226',lib:'Crépissage de façades',dg:[{cfc:'226.2',lib:'Isolation extérieure crépie',ht:165000}],lot:'226.2',bkp:'226',pv:'226',chap:'226',contrat:158000,R:3,E:2,ao:{envoi:'2024-12-09',retour:'2025-01-24'},adj:'2025-04-30',trav:['2026-01-12','2026-03-27'],
     ent:[{n:'Façades Témoin SA',resp:'Sandra Crépi'},{n:'Isolation Modèle SA',resp:'Denis Laine'}]},
    {k:'228',lib:'Stores',dg:[{cfc:'228.2',lib:'Stores à lamelles',ht:58000}],lot:'228.2',bkp:'228',pv:'228',chap:'228',contrat:55000,R:0,E:2,ao:{envoi:'2024-12-09',retour:'2025-01-24'},adj:'2025-04-30',trav:['2026-03-16','2026-04-03'],
     ent:[{n:'Stores Exemple SA',resp:'Lucie Lamelle'},{n:'Protection Solaire Test Sàrl',resp:'Max Toile'}]},
    {k:'232',lib:'Installations à courant fort',dg:[{cfc:'232',lib:'Installations à courant fort',ht:175000}],lot:'232',bkp:'232',pv:'232',chap:'232',contrat:172000,R:5,E:2,ao:{envoi:'2024-11-18',retour:'2025-01-10'},adj:'2025-03-14',trav:['2025-10-27','2026-06-26'],
     ent:[{n:'Électricité Essai SA',resp:'Fabien Ampère'},{n:'Elec Modèle Sàrl',resp:'Inès Volt'},{n:'Courant Exemple SA',resp:'Jonas Ohm'}]},
    {k:'242',lib:'Chauffage',dg:[{cfc:'242',lib:'Production de chaleur',ht:95000},{cfc:'243',lib:'Distribution de chaleur',ht:70000}],lot:'242',bkp:'242, 243',pv:'242',chap:'242',contrat:159000,R:3,E:2,ao:{envoi:'2024-11-18',retour:'2025-01-10'},adj:'2025-03-14',trav:['2025-11-03','2026-05-29'],
     ent:[{n:'Chauffage Exemple SA',resp:'Martin Calorie'},{n:'Thermo Installation Sàrl',resp:'Elsa Radiateur'}]},
    {k:'244',lib:'Ventilation',dg:[{cfc:'244',lib:'Installations de ventilation',ht:60000}],lot:'244',bkp:'244',pv:'244',chap:'244',contrat:62000,R:0,E:2,ao:{envoi:'2024-11-18',retour:'2025-01-10'},adj:'2025-03-21',trav:['2025-11-10','2026-05-22'],
     ent:[{n:'Ventilation Test SA',resp:'Noé Gaine'},{n:'Air Modèle Sàrl',resp:'Clara Flux'}]},
    {k:'251',lib:'Installations sanitaires',dg:[{cfc:'251',lib:'Appareils et conduites sanitaires',ht:185000}],lot:'251',bkp:'251',pv:'251',chap:'251',contrat:178000,R:3,E:2,ao:{envoi:'2024-11-18',retour:'2025-01-10'},adj:'2025-03-21',trav:['2025-11-03','2026-06-12'],
     ent:[{n:'Sanitaire Exemple SA',resp:'Léon Robinet'},{n:'Eau Essai Sàrl',resp:'Maude Siphon'},{n:'Plomberie Témoin SA',resp:'Rémy Tuyau'}]},
    {k:'258',lib:'Agencements de cuisines',dg:[{cfc:'258',lib:'Cuisines',ht:120000}],lot:'258',bkp:'258',pv:'258',chap:'258',contrat:124000,R:2,E:0,ao:{envoi:'2025-01-13',retour:'2025-02-21'},adj:'2025-05-09',trav:['2026-06-01','2026-06-26'],
     ent:[{n:'Cuisines Modèle SA',resp:'Aline Plan'},{n:'Agencement Exemple Sàrl',resp:'Yann Meuble'}]},
    {k:'261',lib:'Ascenseur',dg:[{cfc:'261',lib:'Ascenseur',ht:68000}],lot:'261',bkp:'261',pv:'261',chap:'261',contrat:66000,R:0,E:2,ao:{envoi:'2024-12-16',retour:'2025-01-31'},adj:'2025-04-04',trav:['2026-03-02','2026-04-24'],
     ent:[{n:'Ascenseurs Exemple SA',resp:'Thomas Cabine'},{n:'Lift Test SA',resp:'Mira Treuil'}]},
    {k:'271',lib:'Plâtrerie',dg:[{cfc:'271.1',lib:'Plâtrerie',ht:130000}],lot:'271.1',bkp:'271',pv:'271',chap:'271',contrat:125000,R:3,E:2,ao:{envoi:'2024-12-16',retour:'2025-01-31'},adj:'2025-04-18',trav:['2026-01-05','2026-03-27'],
     ent:[{n:'Plâtrerie Essai SA',resp:'Serge Enduit'},{n:'Gypserie Témoin Sàrl',resp:'Laura Staff'},{n:'Peinture et Plâtre Modèle SA',resp:'Dario Lissage'}]},
    {k:'273',lib:'Portes intérieures',dg:[{cfc:'273.0',lib:'Portes intérieures',ht:72000}],lot:'273.0',bkp:'273',pv:'273',chap:'273',contrat:70000,R:0,E:2,ao:{envoi:'2025-01-13',retour:'2025-02-21'},adj:'2025-05-09',trav:['2026-04-20','2026-05-29'],
     ent:[{n:'Portes Exemple SA',resp:'Gilles Huisserie'},{n:'Menuiserie Modèle Sàrl',resp:'Eva Chêne'}]},
    {k:'281',lib:'Revêtements de sols',dg:[{cfc:'281.6',lib:'Carrelages',ht:74000},{cfc:'281.7',lib:'Parquets',ht:90000}],lot:'281.6',bkp:'281.6',pv:'281.6',chap:'281',contrat:160000,R:2,E:2,ao:{envoi:'2025-01-20',retour:'2025-02-28'},adj:'2025-05-16',trav:['2026-03-30','2026-05-29'],
     ent:[{n:'Sols Exemple SA',resp:'Paul Parquet'},{n:'Carrelages Test Sàrl',resp:'Rosa Joint'}]},
    {k:'285',lib:'Peinture intérieure',dg:[{cfc:'285.1',lib:'Peinture intérieure',ht:64000}],lot:'285.1',bkp:'285',pv:'285',chap:'285',contrat:60000,R:3,E:2,ao:{envoi:'2025-01-20',retour:'2025-02-28'},adj:'2025-05-23',trav:['2026-06-08','2026-07-10'],
     ent:[{n:'Peinture Exemple Sàrl',resp:'Joël Pinceau'},{n:'Couleurs Modèle SA',resp:'Anna Teinte'}]},
    {k:'287',lib:'Nettoyage',dg:[{cfc:'287',lib:'Nettoyage du bâtiment',ht:7060}],lot:'287',bkp:'287',pv:'287',chap:'287',contrat:null,trav:['2026-08-17','2026-08-28'],
     ent:[{n:'Nettoyage Test Sàrl',resp:'Fatima Balai'}]},
    {k:'421',lib:'Jardinage',dg:[{cfc:'421',lib:'Aménagements extérieurs',ht:45000}],lot:'421',bkp:'421',pv:'421',chap:'421',contrat:44000,R:0,E:2,ao:{envoi:'2025-02-03',retour:'2025-03-07'},adj:'2025-05-30',trav:['2026-08-03','2026-08-28'],
     ent:[{n:'Paysage Exemple SA',resp:'Iris Gazon'},{n:'Jardins Modèle Sàrl',resp:'Basile Haie'}]}],
  /* positions du devis général sans lot d'entreprise (groupe 2 hors 291 = 2 736 000 HT ; total du devis 3 525 400 HT, 3 807 717.40 TTC) */
  autresPositions:[{cfc:'102',lib:'Études géotechniques',ht:12000},{cfc:'291',lib:'Architecte',ht:525400},{cfc:'292',lib:'Ingénieur civil',ht:98627},{cfc:'294',lib:'Ingénieur CVSE',ht:36985},{cfc:'296.0',lib:'Géomètre',ht:12328},
    {cfc:'511',lib:'Autorisations, taxes',ht:18000,tva:0},{cfc:'512',lib:'Taxes de raccordement',ht:22000,tva:0},{cfc:'531',lib:'Assurances',ht:9000},{cfc:'583',lib:'Réserves pour imprévus',ht:120000}],

  /* RÉCIT : le fil de l'affaire. Séances, PV, notes, tâches, mutations, courriers et documents racontent CES faits, aux mêmes dates. */
  recit:[
    {d:'2023-02-06',t:'Première rencontre avec la Fondation Exemple : 18 logements à loyers modérés sur la parcelle 1234, budget cible 3,2 mio HT.'},
    {d:'2023-03-15',t:'Trois variantes volumétriques : A barre, B plot avec attique, C deux plots. La zone limite la hauteur à la corniche à 13.50 m.'},
    {d:'2023-05-22',t:'Présentation au conseil de fondation : variante B retenue, sous réserve du coût de l’attique.'},
    {d:'2023-06-30',t:'Fiche de faisabilité remise, facture finale de l’étude.'},
    {d:'2024-01-08',t:'Offre « Variante sans attique » envoyée à la demande du trésorier, annulée le 12.01 : le conseil confirme l’attique.'},
    {d:'2024-01-29',t:'Signature du mandat complet.'},
    {d:'2024-03-18',t:'Sondages géotechniques : rocher à 3.20 m au nord de la parcelle, moins profond que prévu.'},
    {d:'2024-04-22',t:'Avant-projet validé par le maître de l’ouvrage, estimation à ±15 %.'},
    {d:'2024-06-10',t:'Le maître de l’ouvrage demande 2 places de parc supplémentaires : le parking passe de 22 à 24 places, heures supplémentaires en phase 32 (dépassement assumé).'},
    {d:'2024-08-12',t:'Dépôt de la demande de permis de construire (dossier CAMAC).'},
    {d:'2024-09-03',t:'Mise à l’enquête publique jusqu’au 02.10.2024.'},
    {d:'2024-09-27',t:'Deux oppositions (famille Voisin, hauteur ; Association du Quartier, arbres) et une observation.'},
    {d:'2024-10-28',t:'Synthèse CAMAC reçue : charges de l’ECA et de la DGE.'},
    {d:'2024-11-08',t:'Devis général validé à 3,53 mio HT (±10 %) : +236 000 HT sur l’estimation à cause du rocher et du parking.'},
    {d:'2024-11-11',t:'Avenant n° 1 aux honoraires, signé le 25.11.2024, sur le nouveau coût de l’ouvrage.'},
    {d:'2024-11-25',t:'Permis de construire délivré, oppositions levées après séance de conciliation.'},
    {d:'2025-02-10',t:'Premières adjudications : démolitions, terrassements, puis gros œuvre le 28.02.'},
    {d:'2025-03-03',t:'Début des travaux, ouverture du chantier.'},
    {d:'2025-04-02',t:'Rocher plus dur que prévu dans la fouille nord : minage interdit, brise-roche, plus-value de terrassement (T7) prise sur les réserves.'},
    {d:'2025-06-16',t:'Départ de Nora Brouillon le 30.06, reprise de ses dossiers par Anne Modèle.'},
    {d:'2025-10-31',t:'Fin du gros œuvre avec deux semaines de retard (intempéries de juin).'},
    {d:'2025-11-20',t:'Retard des fenêtres : livraison de deux étages décalée, plus-value de 8 000 HT (T8) validée par la direction des travaux.'},
    {d:'2026-02-12',t:'Le maître de l’ouvrage choisit un parquet chêne plus cher : mutation M4 sur les cuisines et les sols.'},
    {d:'2026-05-11',t:'Infiltration en sous-sol après un orage : reprise de l’étanchéité du saut-de-loup, à la charge de l’entreprise de gros œuvre.'},
    {d:'2026-08-31',t:'Réception de l’ouvrage avec 14 réserves mineures.'},
    {d:'2026-09-14',t:'Permis d’habiter délivré, premiers locataires le 01.10.2026.'},
    {d:'2026-10-30',t:'Décompte final en cours : 2 entreprises restent à solder, garanties bancaires reçues.'}],
};

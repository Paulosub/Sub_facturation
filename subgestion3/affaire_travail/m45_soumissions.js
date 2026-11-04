/* ═══ AFFAIRE DE TRAVAIL 99TST — MODULE 45 : SOUMISSIONS (04.11.2026) ═══
   Crée UNE soumission par lot sous contrat de REF.lots (devisdocument, soumission, soumissiondoc, projecttenderer), avec les entreprises de ctx.ent :
   descriptif écrit pour l'affaire (appel d'offres B), soumissionnaires, comparatif détaillé C1 et comparatif bref, grille de notation sur 5 lots,
   négociation (rabais de REF.R atteint après négociation), offre C, contrat D au brut de REF.contrat, métré I sur 5 lots, descriptif type et estimatif sur 2 lots.
   L'adjudicataire est toujours ent[0] ; sur 4 lots une autre entreprise est moins chère (rang 2 de l'adjudicataire), la grille et le commentaire disent pourquoi.
   Un lot à plusieurs positions du devis (211, 242, 281) = un chapitre par CFC : le contrat passe au contrôle des coûts par « Répartir par nature des coûts ».
   Les entreprises et leur rôle 19 viennent de m10 et m20 : les opérations projectmember de svCloseOps sont écartées (BKP gardé tel que dans REF.lots).

   Ajoute à ctx :
   ctx.soum[lotK] = { doc (devisdocument), S (contenu), numero (n° de contrat, texte), kag (vrai si plusieurs CFC), metre ({cfc: brut métré} ou null) } */
(function(){
const A=window.AT;
const fr=iso=>iso?iso.split('-').reverse().join('.'):'';

/* ── descriptifs : un chapitre = {cfc, ch (numéro sans 0 ni 9), titre, prelim, arts:[[m, unité, mot-clé, texte, quantité, prix de référence]]} ; m contenant 0 = titre, sans quantité.
   Le dernier article « gl » de quantité 1 de chaque chapitre porte le solde : la somme tombe juste sur REF.contrat. Prix de référence : rapport entre articles seulement. */
const DESCRIPTIFS={
'112':[{cfc:'112',ch:'112',titre:'Démolitions',prelim:'Le hangar et ses dépendances sont vides. Les matériaux sont triés sur place et évacués vers des filières autorisées, bordereaux de suivi à remettre à la direction des travaux. Bruit et poussière selon la directive sur les chantiers.',arts:[
  ['100','','Installations de chantier','Installations propres à l’entreprise.'],['110','','Installation','Amenée et repli.'],
  ['111','gl','Installation de chantier','Amenée, mise en place et repli du matériel, baraque et WC de chantier.',1,3200],
  ['112','m','Clôture de chantier','Clôture mobile hauteur 2.00 m, location comprise pendant la durée des travaux.',140,18],
  ['200','','Déconstruction','Déconstruction des bâtiments existants.'],['210','','Bâtiments','Volumes mesurés selon SIA 416.'],
  ['211','m3','Déconstruction du hangar','Déconstruction de la charpente métallique, des murs en maçonnerie et des dalles, chargement compris.',1500,8.5],
  ['212','m2','Démolition de dallage','Démolition du dallage béton de 15 cm et du radier de l’atelier.',420,14],
  ['220','','Évacuation','Évacuation et taxes de décharge.'],
  ['221','t','Évacuation des gravats','Gravats de béton et de brique, valorisés en centre de tri, taxes comprises.',180,28],
  ['222','t','Déchets de chantier mélangés','Bois, isolants et déchets mélangés, tri et taxes compris.',35,190]]}],
'201':[{cfc:'201.1',ch:'211',titre:'Terrassements',prelim:'Le rapport géotechnique fait partie de la soumission. Rocher à 3.20 m au nord de la parcelle. Le minage est interdit. L’entreprise se rend sur place avant de remettre son offre et dépose un programme de travail.',arts:[
  ['100','','Installations','Installations et travaux préliminaires.'],['110','','Installation','Installation et accès.'],
  ['111','gl','Installation de chantier','Amenée et repli des engins, piste d’accès en grave, nettoyage de la route.',1,6500],
  ['112','m2','Décapage de la terre végétale','Décapage sur 30 cm et mise en dépôt sur la parcelle.',1600,3.5],
  ['200','','Fouilles','Fouilles en pleine masse.'],['210','','Fouille','Volumes en place, mesurés sur profils.'],
  ['211','m3','Fouille en pleine masse','Fouille en terrain meuble, chargement sur camion compris.',3800,11.5],
  ['212','m3','Fouille en rocher','Fouille en rocher fracturé au brise-roche, sans minage, secteur nord.',300,78],
  ['213','m3','Évacuation en décharge','Transport et taxes de décharge pour matériaux non pollués.',3200,7.5],
  ['220','','Remblayage','Remblayage contre ouvrage.'],
  ['221','m3','Remblayage contre ouvrage','Remblayage par couches de 30 cm, compactage selon prescriptions de l’ingénieur civil.',900,12.5]]}],
'211':[{cfc:'211.5',ch:'211',titre:'Béton et béton armé',prelim:'Plans de l’ingénieur civil, indice de la soumission. Béton étanche pour le sous-sol, classe C30/37, exposition XC4. Coffrage type 2 dans les sous-sols, type 3 dans les parties apparentes. Prorata de chantier 0,5 %.',arts:[
  ['100','','Installations de chantier','Installations générales.'],['110','','Installation','Installation et grue.'],
  ['111','gl','Installation de chantier','Amenée et repli, baraques, clôture, raccordements provisoires, entretien pendant toute la durée du gros œuvre.',1,36000],
  ['112','ms','Grue à tour','Location et conduite de la grue à tour, charge 1,5 t en bout de flèche.',6,5200],
  ['200','','Coffrages','Surfaces de contact mesurées selon SIA 262.'],['210','','Coffrages','Coffrages par ouvrage.'],
  ['211','m2','Coffrage du radier','Coffrage de rive du radier et des surprofondeurs.',120,42],
  ['212','m2','Coffrage des murs','Coffrage des murs, type 2, écarteurs étanches.',1500,46],
  ['213','m2','Coffrage des dalles','Coffrage des dalles sur étai, bords compris.',2200,38],
  ['300','','Béton et armature','Béton mis en place, vibré, cure comprise.'],['310','','Béton','Béton par ouvrage.'],
  ['311','m3','Béton du radier','Béton C30/37 étanche, épaisseur 35 cm.',350,195],
  ['312','m3','Béton des murs','Béton C30/37 étanche pour les murs contre terre.',220,205],
  ['313','m3','Béton des dalles','Béton C25/30 pour dalles et escaliers.',580,170],
  ['320','','Armature','Armature selon listes de l’ingénieur.'],
  ['321','t','Acier d’armature','Acier B500B fourni, façonné et posé.',70,1650]]},
 {cfc:'211.6',ch:'212',titre:'Maçonnerie',prelim:'Maçonnerie apparente dans le sous-sol, à enduire aux étages. Tolérances selon SIA 266.',arts:[
  ['100','','Maçonnerie','Murs et cloisons maçonnés.'],['110','','Murs','Surfaces mesurées vides déduits au-delà de 0,50 m².'],
  ['111','m2','Murs en brique de ciment','Murs porteurs 15 cm en brique de ciment.',1100,80],
  ['112','m2','Murs en brique de terre cuite','Murs de séparation 15 cm en terre cuite.',700,72],
  ['113','p','Linteaux préfabriqués','Linteaux en béton préfabriqué, portée jusqu’à 2.00 m.',64,110],
  ['114','gl','Adaptations et sommiers','Sommiers, raccords aux dalles, percements au plan des installateurs.',1,14000]]}],
'221':[{cfc:'221.1',ch:'221',titre:'Fenêtres',prelim:'Fenêtres bois-métal, triple vitrage, valeur Uw maximale 0,90 W/m²K. Échantillon de chaque type à soumettre avant fabrication. Prises de cotes sur place par l’entreprise. Garantie étanchéité selon SIA 331.',arts:[
  ['100','','Fenêtres','Fourniture et pose.'],['110','','Éléments','Dimensions selon liste des fenêtres.'],
  ['111','m2','Fenêtres à deux vantaux','Fenêtres bois-métal oscillo-battantes, verre feuilleté en allège.',260,420],
  ['112','m2','Portes-fenêtres des séjours','Portes-fenêtres bois-métal à seuil abaissé, accès aux balcons.',160,480],
  ['113','p','Portes d’entrée d’immeuble','Portes bois-métal vitrées, ferme-porte et gâche électrique.',2,6800],
  ['120','','Accessoires','Étanchéité et finitions.'],
  ['121','m','Bandes d’étanchéité','Bandes d’étanchéité à l’air et au vent, périphérie des cadres.',900,12],
  ['122','gl','Plans et mise au point','Plans d’atelier, échantillons, réglage après emménagement.',1,6500]]}],
'224':[{cfc:'224.1',ch:'224',titre:'Étanchéité de toiture',prelim:'Toiture plate végétalisée et terrasses d’attique, complexe chaud. Pente 1,5 %. Essai d’étanchéité avant la pose de la protection.',arts:[
  ['100','','Toiture plate','Complexe d’étanchéité.'],['110','','Complexe','Mesurage à plat.'],
  ['111','m2','Pare-vapeur','Lé bitumineux soudé sur dalle béton.',620,12],
  ['112','m2','Isolation PUR 200 mm','Panneaux de polyuréthane, valeur lambda 0,023.',620,48],
  ['113','m2','Étanchéité bicouche','Étanchéité bitume-polymère en deux couches.',620,34],
  ['114','m2','Végétalisation extensive','Substrat 10 cm et semis extensif sur toiture.',480,26],
  ['115','m2','Dallettes sur plots','Terrasses d’attique, dallettes en grès 2 cm sur plots réglables.',140,85],
  ['120','','Relevés et écoulements','Raccords.'],
  ['121','m','Relevés et bandes de rive','Relevés 20 cm minimum, bandes de rive en aluminium.',210,38],
  ['122','p','Écoulements de toiture','Naissances et trop-pleins.',8,210],
  ['123','gl','Essai d’étanchéité','Essai à l’eau, rapport, garantie de 5 ans.',1,2500]]}],
'226':[{cfc:'226.2',ch:'226',titre:'Crépissage de façades',prelim:'Isolation périphérique en laine de pierre, système complet d’un seul fournisseur. Crépi minéral taloché, teinte selon essai sur façade à faire valider par le maître de l’ouvrage et le service technique.',arts:[
  ['100','','Isolation et crépis','Système d’isolation extérieure.'],['110','','Système','Surfaces mesurées vides déduits au-delà de 2,50 m².'],
  ['111','m2','Isolation laine de pierre','Panneaux 200 mm, collés et chevillés.',1050,62],
  ['112','m2','Crépi de fond armé','Couche d’armature avec treillis.',1050,28],
  ['113','m2','Crépi de finition','Crépi minéral taloché, teinté dans la masse.',1050,22],
  ['120','','Finitions','Profils et raccords.'],
  ['121','m','Embrasures et tablettes','Retours d’embrasures et tablettes en aluminium.',640,24],
  ['122','m','Profils de socle','Profils de départ, partie enterrée en XPS.',190,18],
  ['130','','Échafaudages','Échafaudages de façade.'],
  ['131','m2','Échafaudage de façade','Échafaudage de service, location 12 semaines.',1600,13],
  ['132','gl','Essais de teinte','Essais de teinte sur façade, protections, nettoyage.',1,4800]]}],
'228':[{cfc:'228.2',ch:'228',titre:'Stores',prelim:'Stores à lamelles orientables en aluminium thermolaqué, coulisses intégrées dans l’isolation. Manœuvre à manivelle, électrique dans les séjours.',arts:[
  ['100','','Stores','Fourniture et pose.'],['110','','Stores','Dimensions selon liste des stores.'],
  ['111','m2','Stores à lamelles','Lamelles 80 mm, manœuvre à manivelle.',260,118],
  ['112','m2','Stores motorisés des séjours','Lamelles 80 mm, moteur et commande murale.',160,148],
  ['120','','Accessoires','Commandes.'],
  ['121','p','Commande centrale par logement','Commande groupée des stores motorisés.',18,85],
  ['122','gl','Réglages et remise','Réglage, mise en service et instruction des locataires.',1,1500]]}],
'232':[{cfc:'232',ch:'232',titre:'Installations à courant fort',prelim:'Installations selon NIBT et prescriptions du distributeur. Rapport de sécurité OIBT à remettre à la fin des travaux. Préparation des bornes de recharge du parking.',arts:[
  ['100','','Distribution','Distribution principale.'],['110','','Tableaux','Tableaux et colonnes.'],
  ['111','p','Tableau d’appartement','Coffret encastré, disjoncteurs et différentiel.',18,980],
  ['112','p','Tableau principal','Tableau général d’immeuble avec comptages.',1,14500],
  ['113','m','Colonnes montantes','Câbles et chemins de câbles dans les gaines.',240,48],
  ['120','','Logements','Installation complète par logement.'],
  ['121','p','Logement 2,5 pièces','Prises, interrupteurs, éclairage de base.',6,5200],
  ['122','p','Logement 3,5 pièces','Prises, interrupteurs, éclairage de base.',8,6100],
  ['123','p','Logement 4,5 pièces','Prises, interrupteurs, éclairage de base.',4,7300],
  ['130','','Communs et parking','Parties communes.'],
  ['131','p','Luminaires des communs','Luminaires LED avec détecteurs de présence.',64,165],
  ['132','p','Luminaires du parking','Réglettes LED étanches.',38,120],
  ['133','m','Chemin de câbles du parking','Préparation pour bornes de recharge.',180,26],
  ['140','','Contrôles','Réception.'],
  ['141','gl','Contrôle final et dossier','Contrôle final OIBT et dossier de révision.',1,6000]]}],
'242':[{cfc:'242',ch:'242',titre:'Production de chaleur',prelim:'Pompe à chaleur air-eau placée en toiture, accumulateur au sous-sol. Puissance et réglages selon les plans de l’ingénieur CVSE.',arts:[
  ['100','','Production','Production de chaleur.'],['110','','Équipements','Fourniture, pose et mise en service.'],
  ['111','p','Pompe à chaleur 45 kW','Pompe à chaleur air-eau silencieuse, socle antivibratile.',1,52000],
  ['112','p','Accumulateur 1500 l','Accumulateur technique isolé.',1,9800],
  ['113','gl','Régulation et mise en service','Régulation sur sonde extérieure, équilibrage, instruction.',1,22000]]},
 {cfc:'243',ch:'243',titre:'Distribution de chaleur',prelim:'Chauffage de sol basse température, comptage individuel par logement.',arts:[
  ['100','','Distribution','Distribution de chaleur.'],['110','','Réseaux','Réseaux et émission.'],
  ['111','m2','Chauffage de sol','Tubes PE-RT, panneaux à plots.',2300,21],
  ['112','p','Collecteurs avec comptage','Collecteur par logement, compteur de chaleur.',18,620],
  ['113','m','Conduites principales','Conduites isolées en sous-sol et gaines.',260,34],
  ['114','gl','Essais et isolation','Essais de pression, rinçage, isolation des raccords.',1,6500]]}],
'244':[{cfc:'244',ch:'244',titre:'Ventilation',prelim:'Ventilation double flux par logement, ventilation mécanique du parking selon les directives de l’ECA.',arts:[
  ['100','','Ventilation','Installations de ventilation.'],['110','','Logements','Double flux.'],
  ['111','p','Monobloc double flux','Monobloc compact avec récupération de chaleur.',18,2100],
  ['112','m','Gaines de ventilation','Gaines plates et rondes, grilles comprises.',640,18],
  ['120','','Parking','Ventilation du parking.'],
  ['121','p','Ventilateur du parking','Ventilateur à deux vitesses, détection de CO.',2,3800],
  ['122','gl','Mise en service et mesures','Réglage des débits et rapport de mesures.',1,4000]]}],
'251':[{cfc:'251',ch:'251',titre:'Installations sanitaires',prelim:'Appareils de la gamme standard du maître de l’ouvrage. Conduites en inox, écoulements en PE soudé. Isolation acoustique selon SIA 181, exigences accrues.',arts:[
  ['100','','Appareils','Appareils sanitaires.'],['110','','Appareils','Fourniture et pose.'],
  ['111','p','WC suspendu','WC suspendu avec bâti-support.',28,640],
  ['112','p','Lavabo','Lavabo 60 cm avec mélangeur.',30,460],
  ['113','p','Baignoire','Baignoire acrylique 170 cm.',12,950],
  ['114','p','Douche de plain-pied','Receveur extra-plat, paroi vitrée.',14,1150],
  ['120','','Conduites','Conduites et écoulements.'],
  ['121','m','Conduites en inox','Conduites d’eau froide et chaude isolées.',1600,34],
  ['122','m','Écoulements PE','Écoulements en PE soudé, isolation phonique.',980,38],
  ['130','','Buanderie','Buanderie commune.'],
  ['131','p','Colonne de lavage','Lave-linge et séchoir collectifs.',3,3200],
  ['132','gl','Batteries et essais','Batteries de distribution, essais de pression, rinçage.',1,12000]]}],
'258':[{cfc:'258',ch:'258',titre:'Agencements de cuisines',prelim:'Façades stratifiées, plans de travail en granit, appareils de classe A. Choix des teintes par le maître de l’ouvrage sur échantillons. Pose après carrelages.',arts:[
  ['100','','Cuisines','Cuisines agencées.'],['110','','Cuisines','Y compris appareils.'],
  ['111','p','Cuisine 2,5 pièces','Cuisine en ligne, 2.80 m.',6,6100],
  ['112','p','Cuisine 3,5 pièces','Cuisine en L, 3.60 m.',8,6900],
  ['113','p','Cuisine 4,5 pièces','Cuisine en L avec îlot, 4.40 m.',4,7800],
  ['120','','Pose','Prises de cotes.'],
  ['121','gl','Prises de cotes et ajustages','Prises de cotes, pose, joints, mise en service des appareils.',1,5200]]}],
'261':[{cfc:'261',ch:'261',titre:'Ascenseur',prelim:'Ascenseur électrique sans local des machines, accessible aux personnes à mobilité réduite (SIA 500), 6 arrêts, 630 kg.',arts:[
  ['100','','Ascenseur','Fourniture et montage.'],['110','','Installation','Installation complète.'],
  ['111','p','Ascenseur 630 kg','Cabine 1.10 × 1.40 m, portes automatiques.',1,58000],
  ['112','p','Téléalarme','Téléalarme GSM et raccordement.',1,1800],
  ['113','gl','Mise en service','Contrôle de l’organe de contrôle, entretien de la 1re année.',1,3000]]}],
'271':[{cfc:'271.1',ch:'271',titre:'Plâtrerie',prelim:'Cloisons légères en plaques de plâtre, enduits sur maçonnerie et lissage des plafonds, qualité Q3. Gaines techniques EI30 avec certificats.',arts:[
  ['100','','Cloisons','Cloisons légères.'],['110','','Cloisons','Surfaces mesurées vides déduits au-delà de 2,50 m².'],
  ['111','m2','Cloison 100 mm','Ossature métallique, deux plaques de plâtre, laine minérale.',820,54],
  ['112','m2','Cloison de gaine EI30','Gaine technique EI30, certificat à remettre.',280,72],
  ['120','','Enduits','Enduits et lissage.'],
  ['121','m2','Enduit de plâtre sur murs','Enduit à la machine, finition Q3.',1700,12],
  ['122','m2','Lissage des plafonds','Lissage des dalles béton, qualité Q3.',2400,15],
  ['130','','Divers','Prestations diverses.'],
  ['131','gl','Protections et nettoyage','Protection des fenêtres et nettoyage de fin de travaux.',1,3500]]}],
'273':[{cfc:'273.0',ch:'273',titre:'Portes intérieures',prelim:'Portes de communication à recouvrement, laquées usine. Portes palières EI30 avec seuil abaissé et serrure de sécurité. Système de clés selon plan de fermeture.',arts:[
  ['100','','Portes','Fourniture et pose.'],['110','','Portes','Y compris cadres et ferrements.'],
  ['111','p','Porte palière EI30','Porte palière, classe acoustique 40 dB.',18,1280],
  ['112','p','Porte de communication','Porte à recouvrement laquée.',90,400],
  ['113','p','Porte de local technique EI30','Porte métallique EI30, sous-sol.',12,760],
  ['120','','Accessoires','Accessoires.'],
  ['121','gl','Ferme-portes et cylindres','Ferme-portes, cylindres et plan de fermeture.',1,2500]]}],
'281':[{cfc:'281.6',ch:'281',titre:'Carrelages',prelim:'Grès cérame rectifié 60 × 60 cm dans les salles d’eau et les communs, étanchéité sous carrelage selon SIA 271.',arts:[
  ['100','','Carrelages','Sols et parois.'],['110','','Revêtements','Fourniture et pose.'],
  ['111','m2','Grès cérame 60 × 60','Sols des salles d’eau et des communs.',380,118],
  ['112','m2','Faïence des salles d’eau','Revêtement des parois, hauteur 2.10 m.',160,96],
  ['113','m','Plinthes en grès','Plinthes des parties communes.',420,14],
  ['114','gl','Joints et étanchéité','Étanchéité liquide sous carrelage, joints souples.',1,3000]]},
 {cfc:'281.7',ch:'282',titre:'Parquets',prelim:'Parquet collé dans les séjours et les chambres, valeur de base du maître de l’ouvrage. Contrôle d’humidité de la chape avant la pose.',arts:[
  ['100','','Parquets','Sols en bois.'],['110','','Parquets','Fourniture et pose.'],
  ['111','m2','Parquet collé 10 mm','Parquet en bois de feuillus, vitrifié usine.',1200,64],
  ['112','m','Plinthes en bois','Plinthes assorties.',1450,11],
  ['113','gl','Contrôle et finitions','Contrôle d’humidité, ragréage ponctuel, nettoyage.',1,2500]]}],
'285':[{cfc:'285.1',ch:'285',titre:'Peinture intérieure',prelim:'Peinture minérale sur murs et plafonds, dispersion lavable en cuisine et dans les communs. Teintes selon nuancier du maître de l’ouvrage.',arts:[
  ['100','','Peinture','Peinture des logements et des communs.'],['110','','Logements','Murs et plafonds.'],
  ['111','m2','Peinture des murs','Deux couches de peinture minérale.',3000,9.5],
  ['112','m2','Peinture des plafonds','Deux couches sur lissage.',2400,8.5],
  ['120','','Sous-sols','Locaux du sous-sol.'],
  ['121','m2','Dispersion des sous-sols','Une couche de fond, une couche de finition.',900,7],
  ['122','gl','Protections et retouches','Protection des sols et retouches après emménagement.',1,2000]]}],
'421':[{cfc:'421',ch:'421',titre:'Jardinage',prelim:'Aménagements selon plan des abords. Plantes indigènes uniquement. Garantie de reprise d’un an. Les arbres existants au sud de la parcelle sont protégés pendant les travaux.',arts:[
  ['100','','Modelage','Mise en forme du terrain.'],['110','','Terrain','Préparation.'],
  ['111','m2','Mise en forme du terrain','Réglage fin et griffage.',1100,7.5],
  ['112','m2','Couche végétale','Mise en place de la terre végétale stockée.',700,12],
  ['113','m2','Semis de prairie fleurie','Semis et premier arrosage.',700,4.5],
  ['120','','Plantations','Haies et arbres.'],
  ['121','m','Haie indigène','Haie mélangée, 3 plants par mètre.',90,62],
  ['122','p','Arbre tige','Arbre indigène, force 16-18, tuteurage.',6,780],
  ['130','','Place de jeux','Équipement extérieur.'],
  ['131','gl','Place de jeux et mobilier','Sol amortissant, jeu combiné, deux bancs, conforme à la norme EN 1176.',1,13500]]}]};

/* offres : écart du net HT par rapport à l'adjudicataire, dans l'ordre de ent[1…] ; null = pas d'offre ; négatif = moins cher que l'adjudicataire */
const OFFRES={'112':[.064],'201':[.038,null],'211':[-.016,.049],'221':[-.023,.051],'224':[.072],'226':[.045],'228':[.031],'232':[.027,.062],'242':[.05],'244':[-.012],'251':[.034,.09],'258':[-.03],'261':[.022],'271':[.046,.077],'273':[.039],'281':[.018],'285':[.06],'421':[.08]};
/* grilles : [critère, coefficient %, notes dans l'ordre de ent] (points = note × coefficient) */
const GRILLES={
  '211':[['Prix de l’offre',50,[4.8,5,4.4]],['Références et organisation',25,[5,4,4.5]],['Programme et délais',15,[5,4,4]],['Qualité de l’offre',10,[4.5,4,4]]],
  '221':[['Prix de l’offre',40,[4.7,5,4.3]],['Performances thermiques et acoustiques',30,[5,4,4.5]],['Délais de livraison',15,[4.5,4.5,4]],['Références',15,[5,4,4]]],
  '232':[['Prix de l’offre',60,[5,4.8,4.5]],['Références',20,[4.5,4.5,4]],['Organisation du chantier',20,[5,4,4]]],
  '244':[['Prix de l’offre',50,[4.9,5]],['Références de bâtiments équivalents',30,[5,3.5]],['Service après-vente',20,[5,4]]],
  '258':[['Prix de l’offre',40,[4.6,5]],['Qualité des matériaux',30,[5,4]],['Service après-vente',15,[5,4]],['Délais',15,[4.5,4.5]]]};
/* commentaire d'adjudication : a = adjudicataire, b = concurrent */
const COMMENTAIRES={
  '211':(a,b)=>`${b} est 1,6 % moins chère, mais ${a} présente de meilleures références de logements collectifs, un programme de gros œuvre plus court de trois semaines et un conducteur de travaux dédié. Le maître de l’ouvrage suit la proposition de la direction des travaux.`,
  '221':(a,b)=>`${b} est moins chère, mais ses profils ne tiennent pas la valeur Uw 0,90 demandée sans plus-value. ${a} offre la meilleure performance acoustique côté route et confirme les délais.`,
  '232':(a)=>`${a} est la mieux notée sur le prix et l’organisation.`,
  '244':(a,b)=>`Écart de 1,2 % en faveur de ${b}, sans référence de bâtiment équivalent ni service d’entretien dans la région. ${a} est retenue.`,
  '258':(a,b)=>`${b} est 3 % moins chère avec des façades de qualité inférieure et un service après-vente limité à deux ans. ${a} est retenue sur la qualité, choix validé par le maître de l’ouvrage.`,
  '_':(a)=>`Offre la plus avantageuse après contrôle arithmétique et négociation : adjudication à ${a}.`};
/* métré : chapitre → article → [commentaire, formule] */
const METRES={
  '201':{'211':{'211':[['Fouille nord','34*16*3.8'],['Fouille sud','24*18*3.5'],['Rampe d’accès','18*6*2.4']],'212':[['Rocher, secteur nord','22*9*1.5']],'221':[['Contre les murs est et ouest','64*3.2*2.2'],['Contre le mur sud','38*2.6*2.8']]}},
  '211':{'211':{'311':[['Radier','31*22*0.45'],['Surprofondeurs','62*0.8*0.6'],['Fosse de l’ascenseur','2.8*3.2*1.4']],'313':[['Dalle sur sous-sol','640*0.26'],['Dalles d’étages','1720*0.22'],['Escaliers','12.5*1.9']]}},
  '226':{'226':{'111':[['Façades nord et sud','2*(26.4*12.6)'],['Façades est et ouest','2*(16*12.6)']],'121':[['Fenêtres','118*2.4'],['Portes-fenêtres','64*2.6'],['Entrées','2*5.2']]}},
  '281':{'282':{'111':[['Logements 2,5 pièces','6*42.5'],['Logements 3,5 pièces','8*62'],['Logements 4,5 pièces','4*84'],['Attique','1*118']]}},
  '421':{'421':{'111':[['Prairie et talus','62*14'],['Bande sud','46*5.2']],'121':[['Limite est','52'],['Limite nord','40']]}}};

A.mod(45,'soumissions','Soumissions',async ctx=>{
  const R=A.REF, pid=ctx.pid, p=DS.get('project',pid), usager=ctx.staff.cdp.user, tva=R.tva, a5=true;
  await DS.need([...SV_NEED,'costcontrol','costcontroldocument']);
  ctx.soum={};
  const LOTS=R.lots.filter(l=>l.contrat!=null), rnd=x=>svdRnd(x,a5), r05=x=>Math.round(x*20)/20;
  /* n° de contrat : le mandat et les 3 mandataires d'abord (m47), puis les lots par date de contrat */
  const parDate=LOTS.slice().sort((a,b)=>a.adj<b.adj?-1:a.adj>b.adj?1:LOTS.indexOf(a)-LOTS.indexOf(b)), noContrat=new Map(parDate.map((l,i)=>[l.k,String(i+5)]));
  const cond=(niv,ref,genre,texte,valeur)=>Object.assign(svdCond0(niv),{ref,genre,texte,valeur});
  const condsLot=(Rb,E,pr)=>{ const L=[]; let n=0; if(Rb){ n++; L.push(cond(n,n-1,1,'Rabais',-Rb)); } if(E){ n++; L.push(cond(n,n-1,3,'Escompte (%)',-E)); } if(pr){ n++; L.push(cond(n,n-1,7,'Prorata',-pr)); } n++; L.push(cond(n,n-1,2,'TVA',tva)); return L; };
  const facteur=(Rb,E,pr)=>(1-Rb/100)*(1-E/100)*(1-(pr||0)/100);

  /* prix d'un chapitre : proportionnels aux prix de référence, à 5 ct, le solde sur l'article « gl » pour tomber sur la cible ; bruit = écart aléatoire entre articles */
  const prixChap=(c,cible,bruit)=>{ const Q=c.arts.filter(a=>a[4]!=null), iS=Q.map((a,i)=>a[1]==='gl'&&a[4]===1?i:-1).filter(i=>i>=0).pop(); if(iS==null) throw new Error('chapitre '+c.ch+' sans article de solde');
    const som=Q.reduce((s,a)=>s+a[4]*a[5],0), f=cible/som, part=Q[iS][5]*f, br=Q.map((a,i)=>i===iS?0:a[5]*(bruit?1+bruit()*.08-.04:1)), sb=Q.reduce((s,a,i)=>s+(i===iS?0:a[4]*br[i]),0), g=(cible-part)/sb;
    const P=new Map(); let s=0; Q.forEach((a,i)=>{ if(i===iS) return; const x=r05(br[i]*g); P.set(a[0],x); s+=rnd(a[4]*x); }); const solde=r05(cible-s); if(solde<=0) throw new Error('chapitre '+c.ch+' : solde négatif'); P.set(Q[iS][0],solde); return P; };
  const repartir=(lot,D)=>{ if(D.length===1) return [lot.contrat]; const t=lot.dg.reduce((a,x)=>a+x.ht,0), L=D.map(c=>Math.round(lot.contrat*lot.dg.find(x=>x.cfc===c.cfc).ht/t/500)*500); L[L.length-1]=lot.contrat-L.slice(0,-1).reduce((a,b)=>a+b,0); return L; };

  let nDocs=0, nArt=0;
  for(const [iL,lot] of LOTS.entries()){
    const k=lot.k, D=DESCRIPTIFS[k]; if(!D) throw new Error('lot '+k+' sans descriptif');
    const ents=ctx.ent[k], ec=[0,...(OFFRES[k]||[])], alea=A.alea(4500+iL*17), ao=lot.ao, tr=lot.trav, retenue=ec.map(x=>x!=null);
    if(ec.length!==ents.length) throw new Error('lot '+k+' : offres ≠ entreprises');
    const dNeg=A.prochainOuvre(A.plus(ao.retour,14)), dOuv=A.prochainOuvre(A.plus(ao.retour,3)), [did]=A.ids('devisdocument');
    const doc={...svNewHeader(p),ID:did,BKP:lot.lot,AWARDINGTEXT:lot.lib,VERSION:'',VERSIONNUMBER:1,STATECODE:2,DOCUMENTSTATECODE:6,CHANGEDDATE:lot.adj,USERID:usager,NOTE:''};
    const S=svNewSoum(did,pid), dg=lot.dg.reduce((a,x)=>a+x.ht,0), dgTtc=rnd(dg*(1+tva/100));
    Object.assign(S.appelOffres,{procedure:ents.length===2&&lot.contrat<60000?3:2,dateDepot:ao.retour,heureDepot:'11:00',dateOuverture:dOuv,debutPreparation:fr(A.prochainOuvre(A.plus(tr[0],-28))),debutTravaux:fr(tr[0]),finTravaux:fr(tr[1]),montantDG:num(dgTtc),
      mandataire:{contactId:ctx.bureau.contact,personId:ctx.staff.cdp.person},lieuDepot:{contactId:ctx.bureau.contact,personId:null}});

    /* 1. appel d'offres */
    const U=S.unites.B; U.date=ao.envoi;
    D.forEach(c=>{ const ch=svdNewChapter(c.ch,c.titre,'',ao.envoi.slice(0,4)); ch.cfc={numero:c.cfc,texte1:c.titre,texte2:''}; const z=ch.articles[0]; z.motCle='Remarques préliminaires'; z.texte=svdWrap(c.prelim);
      c.arts.forEach(([m,un,mc,tx,qt])=>{ const a=svdNewArticle(m,'',un); a.motCle=mc; a.texte=svdWrap(tx); if(qt!=null){ const q=svdNewQP(); q.quantite=qt; a.quantites.push(q); nArt++; } ch.articles.push(a); });
      svdSortChapter(ch); U.chapitres.push(ch); });
    U.conditions=[cond(1,0,1,'Rabais',0),...(lot.E?[cond(2,1,3,'Escompte (%)',-lot.E)]:[]),...(lot.prorata?[cond(lot.E?3:2,lot.E?2:1,7,'Prorata',-lot.prorata)]:[])]; { const n=U.conditions.length+1; U.conditions.push(cond(n,n-1,2,'TVA',tva)); }
    svdRecalc(S,'B'); const ctl=svdControls(svdNormUnit(S.unites.B,'B')); if(ctl) throw new Error('lot '+k+' : '+ctl.msg);

    /* 2. soumissionnaires */
    const ra=svAddEnts(S,ents.map(e=>({contactId:e.contact,responsableId:e.pers?e.pers.contact:null}))); if(ra.errors.length) throw new Error(ra.errors.join(' '));
    const rOff=lot.R>=3?lot.R-1:(lot.R||0), nego=lot.R>=3;   /* adjudicataire : un point de rabais obtenu en négociation dès 3 % */
    const fiche=ents.map((x,i)=>{ const e=S.entreprises.find(y=>y.contactId===x.contact); e.prisEnCompte=retenue[i]; const jr=A.prochainOuvre(A.plus(ao.retour,-1-Math.floor(alea()*6))), dO=jr<=ao.retour?jr:ao.retour;
      e.situationOffre=retenue[i]?'Offre reçue, '+fr(dO):'Pas offert'; e.remarque=retenue[i]?'':'A renoncé, carnet de commandes complet';
      Object.assign(e.indications,{dateOffre:retenue[i]?dO:null,numeroOffre:retenue[i]?'OF-'+ao.retour.slice(2,4)+'-'+String(100+Math.floor(alea()*800)):'',genreOffre:'Offre sur prix unitaires',genreRemuneration:'Prix unitaires',commentaire:i===0?'Visite des lieux effectuée.':''});
      e.notes.lettre.exp=fr(ao.envoi); return e; });

    /* 3. comparatif : prix, conditions, négociation */
    const pro=fiche[0]; pro.proposee=true;
    if(GRILLES[k]) S.criteres=GRILLES[k].map(([nom,coefficient,N])=>({nom,coefficient,notes:N.map((note,i)=>note==null?null:({contactId:ents[i].contact,note,remarque:''})).filter(Boolean),sousCriteres:[]}));
    const t=svcTransferDoc(S,'B','C1'); if(t.err) throw new Error('lot '+k+' : '+t.err);
    const cibles=repartir(lot,D), netAdj=lot.contrat*facteur(lot.R||0,lot.E||0,lot.prorata);
    const tarif=ents.map((x,i)=>{ if(!retenue[i]) return null; const rc=i===0?rOff:[0,1,2,3][Math.floor(alea()*4)], br=i===0?lot.contrat:r05(netAdj*(1+ec[i])/facteur(rc,lot.E||0,lot.prorata));
      const parts=D.map((c,j)=>i===0?cibles[j]:(j===D.length-1?null:r05(br*cibles[j]/lot.contrat))); if(i>0) parts[D.length-1]=r05(br-parts.slice(0,-1).reduce((a,b)=>a+b,0));
      return {rc,br,parts,P:D.map((c,j)=>prixChap(c,parts[j],i===0?null:alea))}; });
    S.unites.C1.chapitres.forEach((ch,j)=>ch.articles.forEach(a=>a.quantites.forEach(q=>(q.prixEntreprises||[]).forEach(x=>{ const i=ents.findIndex(e=>e.contact===x.contactId); if(i>=0&&tarif[i]){ x.prix=tarif[i].P[j].get(a.m); x.gp='A'; } }))));
    ents.forEach((x,i)=>{ if(!retenue[i]) return; const e=fiche[i], d=e.detail; d.offre.conditions=condsLot(tarif[i].rc,lot.E||0,lot.prorata).map(svcCondN);
      if(i===0&&nego){ d.negociee.conditions=condsLot(lot.R,lot.E||0,lot.prorata).map(svcCondN); e.indications.dateOffreNegociee=dNeg; } });
    svcRecalcAll(S); const G=svbRank(svcView(S)); S.entreprises.forEach(e=>{ e.rang=G[e.contactId]||0; e.indications.totalOffreBrut=e.prisEnCompte?num(e.detail.offre.brut):''; });
    const concurrent=ents[ec.findIndex((x,i)=>i>0&&x!=null&&x<0)]||ents[1];
    S.commentaireComparatif=(COMMENTAIRES[k]||COMMENTAIRES._)(ents[0].nom,concurrent&&concurrent.nom);
    Object.assign(S.informationsComparatif,{totalDG:num(dgTtc),montantAdjudication:num(svbAdjAmount(svcView(S))),adjudication:ents[0].nom,garantie:'10 %',niveauPrix:'Novembre 2024',dateDocument:dOuv,dateOffreNegociee:nego?dNeg:null});
    /* comparatif bref : mêmes offres, une ligne par CFC */
    svbNormBref(S); const sc=c=>({niv:c.niv,ref:c.ref,genre:c.genre,texte:c.texte,valeur:c.valeur,ouv:'',lg:'',m:true,montant:0});
    D.forEach(c=>svbAddCfc(S,p,c.cfc,c.titre));
    S.entreprises.filter(e=>e.prisEnCompte).forEach(e=>{ const i=ents.findIndex(x=>x.contact===e.contactId), n=e.detail.negociee.conditions.length>0;
      S.bref.structure.forEach((s,j)=>{ const b=tarif[i].parts[j]; s.lignes[e.contactId]={'':{offre:{brut:b},negociee:n?{brut:b}:{}}}; });
      e.bref.offre.conditions=e.detail.offre.conditions.map(sc); e.bref.negociee.conditions=e.detail.negociee.conditions.map(sc); });
    svbRecalcAll(S);

    /* 4. offre et contrat */
    for(const et of ['C','D']){ const r=svcTransferDoc(S,'C1',et); if(r.err) throw new Error('lot '+k+' : '+r.err); }
    const Ud=S.unites.D; S.unites.C.date=dOuv; Ud.date=lot.adj; Ud.contrat={numero:noContrat.get(k),avenant:'',genre:'Contrat sur prix unitaires'};
    pro.notes.adjudication.exp=fr(lot.adj); pro.notes.commande.exp=fr(lot.adj); S.etape='D'; S.dernierNoeud='D';
    if(Math.abs(Ud.brut-lot.contrat)>.005) throw new Error('lot '+k+' : brut du contrat '+Ud.brut+' ≠ '+lot.contrat);

    /* 5. métré : quantités remplacées par le calcul de chaque ligne */
    let metre=null;
    if(METRES[k]){ const r=svcTransferDoc(S,'D','I'); if(r.err) throw new Error('lot '+k+' : '+r.err); const I=S.unites.I, dM=A.prochainOuvre(A.plus(tr[1],5)); I.date=dM;
      Object.entries(METRES[k]).forEach(([c,arts])=>{ const ch=I.chapitres.find(x=>x.numero===c); Object.entries(arts).forEach(([m,L])=>{ const a=ch.articles.find(x=>x.m===m), q=a.quantites[0];
        const lignes=L.map(([commentaire,formule],i)=>({genre:'0',no:String(i+1).padStart(2,'0'),date:dM,commentaire,formule,quantite:0,st:false})), M=svdMetreCalc(lignes); lignes.forEach((l,i)=>{ l.quantite=M.q[i]||0; }); q.metre=lignes; }); });
      svdRecalc(S,'I'); S.etape='I'; S.dernierNoeud='I'; metre={};
      I.chapitres.forEach(ch=>{ const cfc=(ch.cfc||{}).numero; metre[cfc]=ch.articles.reduce((s,a)=>s+a.quantites.reduce((u,q)=>u+(+q.montant||0),0),0); }); }

    /* 6. descriptif type et estimatif, sur deux lots */
    if(k==='226'||k==='271'){ for(const et of ['A','K']){ const r=svcTransferDoc(S,'B',et); if(r.err) throw new Error('lot '+k+' : '+r.err); }
      S.unites.A.date=ao.envoi; S.unites.K.date=A.prochainOuvre(A.plus(ao.envoi,-14));
      S.unites.K.chapitres.forEach((ch,j)=>ch.articles.forEach(a=>a.quantites.forEach(q=>{ q.prix=r05((tarif[0].P[j].get(a.m)||0)*1.04); q.gp='A'; }))); svdRecalc(S,'K'); }

    /* 7. marques « document disponible » */
    const docs=[], mk=(type,noeud,contactId,etabliLe)=>docs.push({type,noeud,contactId,etabliLe}), cp=pro.contactId;
    mk('devisTendererList',undefined,null,ao.envoi); ents.forEach(e=>mk('devisTendererLetter',undefined,e.contact,ao.envoi));
    ['devisPriceComparison','devisAwardRequest','devisPriceComparisonDesc'].forEach(x=>mk(x,'C1',null,dOuv));
    S.entreprises.filter(e=>e.prisEnCompte).forEach(e=>{ mk('devisBidding','C1',e.contactId,dOuv); if(e.contactId!==cp) mk('devisRejectionLetter','C1',e.contactId,lot.adj); });
    mk('devisAcceptanceLetter','C1',cp,lot.adj); mk('devisConfirmationOfOrder','C1',cp,lot.adj); mk('devisDocument','D',null,lot.adj); mk('devisConfirmationOfOrder','D',null,lot.adj); mk('devisWorkPreparationLetter','D',null,lot.adj);
    const idsD=A.ids('soumissiondoc',docs.length), jeu=+svJeu(p)||1;
    const ops=[{t:'devisdocument',id:did,val:doc},{t:'soumission',id:did,val:JSON.parse(JSON.stringify(S))},
      ...docs.map((x,i)=>({t:'soumissiondoc',id:idsD[i],val:{ID:idsD[i],DOCUMENT_ID:did,...(x.noeud?{noeud:x.noeud}:{}),type:x.type,contactId:x.contactId??null,etabliLe:x.etabliLe,USERID:usager,jeu,textes:{},pdf:null}})),
      ...svCloseOps(doc,S).filter(o=>o.t!=='projectmember')];
    await A.commit(ops); nDocs+=docs.length;
    ctx.soum[k]={doc,S,numero:noContrat.get(k),kag:D.length>1,metre};
  }
  A.log('soumissions :',LOTS.length,'lots,',nArt,'quantités,',nDocs,'marques de documents,',DS.by('projecttenderer','PROJECT_ID',pid).length,'soumissionnaires');
});
})();

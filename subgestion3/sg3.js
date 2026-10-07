/* ══ SUBGestion 3 — coquille « charte Substances » ═════════════════════════════════════════════════
   Ajouté après le script de DeltaSub par subgestion3/construire.py (même document : DS, go, VIEWS…).
   Navigation : barre principale (logo + domaines, style du site substances.ch) → barre bleu nuit des modules du domaine
   → barre contextuelle (outils, filtre). Chaque domaine a une vue d'ensemble (dom-<k>). Fiches projet / contact / membre,
   Accueil, Données. Les modules de l'app Facturation (fx-<onglet>) s'affichent dans le cadre #fx-frame (document
   Facturation.html embarqué, compressé dans #fx-src), piloté par goTab ; données inchangées (localStorage sa_*, IndexedDB). */
'use strict';
const NXI={
  home:'<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2Z"/>',
  folder:'<path d="M3 6.5V19a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8.5a1 1 0 0 0-1-1h-8l-2-3H4a1 1 0 0 0-1 1Z"/>',
  crane:'<path d="M2 21h20M5 21V8l7-5 7 5v13"/><path d="M9 21v-6h6v6M9 11h6"/>',
  contacts:'<rect x="4" y="3" width="16" height="18"/><circle cx="12" cy="10" r="3"/><path d="M7.5 17.5c.7-2 2.4-3 4.5-3s3.8 1 4.5 3"/>',
  clock:'<circle cx="12" cy="12" r="9.5"/><path d="M12 6.5V12l3.5 2"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.7.8 2.8 2.5 3 5.2"/>',
  wallet:'<rect x="3" y="6" width="18" height="14"/><path d="M3 10h18M16 15h2"/><path d="M6 6V4h12v2"/>',
  library:'<path d="M5 3v18M10 3v18M15 4l4.5 16.5"/>',
  settings:'<path d="M20 7h-9M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', side:'<rect x="3" y="3" width="18" height="18"/><path d="M9 3v18"/>',
  back:'<path d="m15 18-6-6 6-6"/>', fwd:'<path d="m9 18 6-6-6-6"/>', arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', more:'<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  pin:'<path d="M12 17v5M9 10.8a2 2 0 0 1-1.1 1.8l-1.8.9A2 2 0 0 0 5 15.2V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.8a2 2 0 0 0-1.1-1.8l-1.8-.9A2 2 0 0 1 15 10.8V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>',
  edit:'<path d="M14.5 4.5l5 5L8 21H3v-5Z"/><path d="M12 7l5 5"/>', minus:'<path d="M5 12h14"/>',
  dup:'<rect x="8" y="8" width="13" height="13"/><path d="M16 8V3H3v13h5"/>',
  doc:'<path d="M14 2H5v20h14V7Z"/><path d="M14 2v5h5M8 13h8M8 17h8M8 9h3"/>',
  print:'<path d="M6 9V2h12v7"/><path d="M6 18H2V9h20v9h-4"/><path d="M6 14h12v8H6z"/>',
  filter:'<path d="M3 4h18l-7 8.5V19l-4 2v-8.5Z"/>',
  wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
  person:'<circle cx="12" cy="7.5" r="4"/><path d="M4.5 21c.7-4.2 3.6-6.5 7.5-6.5s6.8 2.3 7.5 6.5"/>',
  tree:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><path d="M6.5 10v6H14"/>',
  gear:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1"/>',
  info:'<circle cx="12" cy="12" r="9.5"/><path d="M12 16.5v-5M12 7.5v.5"/>',
  analyse:'<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/>',
  import:'<path d="M21 15v6H3v-6"/><path d="m7 10 5 5 5-5M12 15V3"/>', export:'<path d="M21 15v6H3v-6"/><path d="m17 8-5-5-5 5M12 3v12"/>',
  save:'<path d="M3 5v15h18V8h-9l-2-3Z"/>',
  share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  pdf:'<path d="M14 2H5v20h14V7Z"/><path d="M14 2v5h5M8 13h8M8 17h5"/>', moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  prev:'<path d="m15 18-6-6 6-6"/>', next:'<path d="m9 18 6-6-6-6"/>', first:'<path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/>', last:'<path d="m13 17 5-5-5-5M6 17l5-5-5-5"/>',
  today:'<rect x="8" y="8" width="8" height="8" fill="currentColor"/>',
  timer:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2h5"/>',
  receipt:'<path d="M5 2v20l2.3-1.5L9.7 22l2.3-1.5 2.3 1.5 2.4-1.5L19 22V2l-2.3 1.5L14.3 2 12 3.5 9.7 2 7.3 3.5Z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  building:'<path d="M4 22V2h12v20M16 8h4v14M2 22h20"/><path d="M8 6h4M8 10h4M8 14h4M10 18v4"/>',
  phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  mail:'<rect x="2" y="4" width="20" height="16"/><path d="m2 5 10 8 10-8"/>', map:'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  cal:'<rect x="3" y="4" width="18" height="18"/><path d="M16 2v4M8 2v4M3 10h18"/>', check:'<path d="M20 6 9 17l-5-5"/>',
  task:'<rect x="3" y="5" width="6" height="6"/><path d="m3 17 2 2 4-4M13 6h8M13 12h8M13 18h8"/>',
  trend:'<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>', cmd:'<path d="M5 12h14M12 5l7 7-7 7"/>',
  coins:'<circle cx="9" cy="9" r="6"/><path d="M15.1 9.6A6 6 0 1 1 9.6 15.1"/>', ruler:'<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
  pv:'<rect x="5" y="4" width="14" height="18"/><path d="M9 2h6v4H9zM8.5 11h7M8.5 15h7M8.5 19h4"/>', contrat:'<path d="M14 2H5v20h14V7Z"/><path d="M14 2v5h5"/><path d="M8 17c1.5-2 2.5-.5 3.5 0s2-.5 4.5-1.5"/>',
  calc:'<rect x="4" y="2" width="16" height="20"/><path d="M8 6h8v4H8zM8 14h.5M12 14h.5M16 14h.5M8 18h.5M12 18h.5M16 18h.5"/>',
  gauge:'<path d="M4 18a8 8 0 1 1 16 0"/><path d="m12 18 4-5"/>', urgent:'<path d="M12 3 2 21h20Z"/><path d="M12 10v5M12 18v.5"/>',
  db:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
  image:'<rect x="3" y="4" width="18" height="16"/><circle cx="9" cy="10" r="2"/><path d="m3 18 6-5 4 3 3-2 5 4"/>', tag:'<path d="M3 3h9l9 9-9 9-9-9Z"/><circle cx="8" cy="8" r="1.5"/>',
  star:'<path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4l-5.5 2.9 1-6.2L3 9.7l6.2-.9z"/>', group:'<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2 20c.5-3 2.8-5 6-5s5.5 2 6 5M14 15.2c.6-.1 1.3-.2 2-.2 3.2 0 5.5 2 6 5"/>'
};
const nxSvg=(n,cls)=>'<svg'+(cls?' class="'+cls+'"':'')+' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="square" stroke-linejoin="miter">'+(NXI[n]||NXI.list)+'</svg>';
icon=function(n){ return NXI[n]?nxSvg(n):`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${ICO[n]||''}</svg>`; };
/* barres d'outils : icône + libellé (masqué dans les colonnes étroites) */
const SG_LBL={plus:'Nouveau',edit:'Modifier',minus:'Supprimer',dup:'Dupliquer',doc:'Documents',print:'Imprimer',filter:'Filtre',wrench:'Configuration',person:'Intervenants',tree:'Subdivisions',
  gear:'Fonctions',list:'Liste',info:'Infos',analyse:'Analyse',import:'Importer',export:'Exporter',save:'Modèles',share:'Partager',pdf:'PDF',moon:'Veille'};
const sgIbtn0=ibtn;
ibtn=function(b){ const el=sgIbtn0(b);
  try{ if(b&&b.i&&!b.label&&el.tagName==='BUTTON'&&!/^(prev|next|first|last|today)$/.test(b.i)){ const t=String(b.t||'').replace(/\s*…$/,'').trim(), lb=t&&t.length<=16?t:SG_LBL[b.i];
    if(lb){ const s=document.createElement('span'); s.className='lb'; s.textContent=lb; el.insertBefore(s,el.querySelector('.dd')); } } }catch(_){}
  return el; };

/* ── Domaines et modules (ordre de la barre principale) ── */
const SG_DOM=[
  {k:'accueil',t:'Accueil',ico:'home',items:[{v:'nx-home',t:'Aujourd’hui'}]},
  {k:'projets',t:'Projets',ico:'folder',d:'Les projets du bureau : intervenants, documents, séances, notes, tâches et contrats.',items:[
    {v:'aff-mes',t:'Mes projets',ico:'person',hero:1,d:'Vos projets et tous leurs domaines : intervenants, documents, séances, notes, tâches, contrats…'},
    {v:'aff-toutes',t:'Tous les projets',ico:'folder',d:'Tous les projets du bureau, avec les mêmes domaines.'},
    {v:'aff-controlling',t:'Suivi & écarts',ico:'trend',d:'Contrôle des heures et des frais, critères d’analyse et rapports.'},
    {v:'aff-gestion',t:'Registre',ico:'list',d:'Créer, modifier et configurer les projets : phases, activités, tarifs.'},
    {v:'taches-urgent',t:'Tâches urgentes',ico:'urgent',d:'Les tâches à traiter en priorité.'},
    {v:'taches-encours',t:'Tâches en cours',ico:'task',d:'Les tâches en traitement.'},
    {v:'taches-regle',t:'Tâches réglées',ico:'check',d:'Les tâches terminées.'}]},
  {k:'chantier',t:'Chantier',ico:'crane',d:'Du coût estimé au décompte final : estimations, devis, appels d’offres, contrôle des coûts et PV.',items:[
    {v:'coplan',t:'Estimations',ico:'ruler',d:'Estimations du coût selon eCCC-Bât.'},
    {v:'devis',t:'Descriptifs & devis',ico:'doc',hero:1,d:'Devis descriptifs par CFC : positions, quantités et prix.'},
    {v:'soum',t:'Appels d’offres',ico:'mail',d:'Soumissions aux entreprises, offres et comparatifs.'},
    {v:'coco',t:'Contrôle des coûts',ico:'coins',d:'Budget, adjudications, avenants, factures et coût final prévisible.'},
    {v:'fx-pv-chantier',t:'PV de chantier',ico:'pv',d:'Procès-verbaux des séances de chantier : annotation, envoi, PDF.'}]},
  {k:'contacts',t:'Contacts',ico:'contacts',d:'Entreprises, mandataires, maîtres d’ouvrage et personnes : coordonnées, catégories et listes.',items:[
    {v:'adr-entites',t:'Annuaire',ico:'contacts',hero:1,d:'Sociétés, personnes, familles… et leurs adresses.'},
    {v:'adr-liste',t:'Toutes les adresses',ico:'list',d:'Toutes les adresses, triables et filtrables.'},
    {v:'adr-favoris',t:'Favoris',ico:'star',d:'Vos adresses favorites.'},
    {v:'adr-groupes',t:'Listes de diffusion',ico:'group',d:'Groupes d’adresses pour les envois et les étiquettes.'},
    {v:'adr-chercher',t:'Recherche avancée',ico:'search',d:'Recherche multicritère (CFC, propriétés, localité…).'},
    {v:'adr-props',t:'Catégories',ico:'tag',d:'Propriétés et catégories attribuées aux adresses.'}]},
  {k:'temps',t:'Temps',ico:'clock',d:'Saisie et suivi du temps de travail et des dépenses.',items:[
    {v:'h-saisie',t:'Feuille d’heures',ico:'timer',hero:1,d:'Saisie des heures par projet, jour après jour.'},
    {v:'h-rapport',t:'Rapports de temps',ico:'analyse',d:'Rapports hebdomadaires, mensuels, annuels et vacances.'},
    {v:'h-dispo',t:'Disponibilités',ico:'cal',d:'Disponibilité des membres de l’équipe.'},
    {v:'nx-situation',t:'Situation des heures',ico:'analyse',d:'Heures par projet, par collaborateur, par phase ou par mois ; export.'},
    {v:'frais',t:'Notes de frais',ico:'receipt',d:'Notes de frais par membre et par projet.'},
    {v:'frais-rapport',t:'Rapport des notes de frais',ico:'analyse',d:'Rapport des notes de frais.'}]},
  {k:'equipe',t:'Équipe',ico:'users',d:'Les membres du bureau, la planification et le suivi des ressources.',items:[
    {v:'collab-actuels',t:'Membres',ico:'users',hero:1,d:'L’équipe actuelle du bureau.'},
    {v:'collab-tous',t:'Tous les membres',ico:'group',d:'Membres actuels et anciens.'},
    {v:'collab-anciens',t:'Anciens membres',ico:'list',d:'Membres ayant quitté le bureau.'},
    {v:'mg-planning',t:'Planification',ico:'cal',d:'Planification des ressources humaines.'},
    {v:'mg-heures',t:'Temps de l’équipe',ico:'clock',d:'Heures de tous les membres par projet.'},
    {v:'mg-collab',t:'Suivi RH',ico:'person',d:'Durées prévues, heures à effectuer, soldes.'}]},
  {k:'facturation',t:'Facturation',ico:'receipt',d:'Contrats d’honoraires SIA, factures et acomptes, documents PDF du bureau et cockpit.',items:[
    {v:'fx-contrats',t:'Contrats d’honoraires',ico:'contrat',hero:1,d:'Liste des contrats : versions, envoi, signature, offre PDF.'},
    {v:'fx-calchono',t:'Calcul d’honoraires',ico:'calc',d:'Calcul selon SIA 102, contrat et offre d’honoraires.'},
    {v:'fx-factures',t:'Factures',ico:'receipt',d:'Factures, acomptes, échéances et paiements.'},
    {v:'fx-saisie',t:'Saisie de facture',ico:'edit',d:'Établir une facture ou un acompte à partir d’un contrat.'},
    {v:'nx-valider',t:'À valider',ico:'check',d:'Contrats et factures préparés par les chefs de projet : validation par l’administrateur.'},
    {v:'fx-cockpit',t:'Cockpit',ico:'gauge',d:'Tableau de bord des honoraires et de la facturation.'},
    {v:'fx-cockpit2',t:'Cockpit analytique',ico:'trend',d:'Analyses et tendances de la facturation.'}]},
  {k:'finances',t:'Finances',ico:'wallet',d:'Contrats et facturation des projets, rentabilité, clients et indicateurs du bureau.',items:[
    {v:'nx-renta',t:'Rentabilité des projets',ico:'coins',hero:1,d:'Honoraires, coût du temps, facturé, encaissé et marge de chaque projet, avec alertes.'},
    {v:'mg-controlling',t:'Controlling',ico:'trend',d:'Controlling : membres, projets, marges.'},
    {v:'mg-contrats',t:'Contrats des projets',ico:'contrat',d:'Contrats, sous-traitants, échéancier et encaissements.'},
    {v:'mg-factures',t:'Facturation des projets',ico:'receipt',d:'Factures d’honoraires, encaissements et QR.'},
    {v:'fact-controle',t:'Suivi des factures',ico:'check',d:'Factures planifiées, envoyées, rappels, payées.'},
    {v:'mg-mo',t:'Clients',ico:'building',d:'Suivi par maître d’ouvrage.'},
    {v:'mg-reporting',t:'Indicateurs',ico:'analyse',d:'Chiffres-clés, heures supplémentaires, comparaisons.'},
    {v:'mg-genres',t:'Types de projets',ico:'tag',d:'Genres de projets et leur paramétrage.'}]},
  {k:'biblio',t:'Bibliothèque',ico:'library',d:'Modèles de documents, de projets, d’adresses et ressources graphiques.',items:[
    {v:'tpl-documents',t:'Documents types',ico:'doc',hero:1,d:'Modèles de lettres, factures et documents.'},
    {v:'tpl-projectTemplates',t:'Projets types',ico:'folder',d:'Modèles pour créer des projets.'},
    {v:'tpl-staffTemplates',t:'Profils d’équipe',ico:'person',d:'Modèles de membres.'},
    {v:'tpl-timeTemplates',t:'Horaires types',ico:'clock',d:'Horaires et temps de travail.'},
    {v:'tpl-expensesTemplates',t:'Notes de frais types',ico:'receipt',d:'Types de frais.'},
    {v:'tpl-managementTemplates',t:'Gestion types',ico:'gear',d:'Modèles de management.'},
    {v:'tpl-addressTemplates',t:'Formats d’adresse',ico:'contacts',d:'Mise en forme des adresses.'},
    {v:'tpl-labelTemplates',t:'Étiquettes',ico:'tag',d:'Planches d’étiquettes.'},
    {v:'tpl-images',t:'Images',ico:'image',d:'Images utilisées dans les documents.'},
    {v:'tpl-backgrounds',t:'Fonds de page',ico:'image',d:'Arrière-plans des documents imprimés.'}]},
  {k:'reglages',t:'Réglages',ico:'settings',nav:0,d:'Données, sauvegardes, administration et registres de l’app Facturation.',items:[
    {v:'nx-data',t:'Données & sauvegarde',ico:'db',hero:1,d:'Export et import de la base de gestion.'},
    {v:'fx-backup',t:'Sauvegarde Facturation',ico:'save',d:'Contrats, factures et registres Facturation : export, import, sauvegarde automatique.'},
    {v:'config',t:'Administration',ico:'settings',d:'Paramètres, propriétés, droits et listes.'},
    {v:'nx-reunir',t:'Réunir les registres',ico:'group',d:'Un seul registre par donnée : adresses, heures, liens contrats ↔ projets.'},
    {v:'nx-profils',t:'Profils et accès',ico:'users',d:'Droits des chefs de projet et des collaborateurs ; profil de chaque compte.'},
    {v:'nx-acces',t:'Accès protégé',ico:'pin',d:'Code d’accès pour Facturation, Finances et Réglages.'},
    {v:'fx-carnet',t:'Archives · Carnet des PV',ico:'pv',reg:1,d:'Ancien carnet d’adresses de Facturation (remplacé par l’Annuaire).'},
    {v:'fx-feuille-heures',t:'Archives · Feuille d’heures',ico:'timer',reg:1,d:'Ancienne saisie d’heures de Facturation (remplacée par la Feuille d’heures).'},
    {v:'fx-rapport',t:'Archives · Rapport d’heures',ico:'analyse',reg:1,d:'Anciens rapports d’heures de Facturation.'},
    {v:'fx-devis',t:'Archives · Devis',ico:'doc',reg:1,d:'Anciens devis de Facturation (remplacés par Descriptifs & devis).'},
    {v:'fx-controle-cout',t:'Archives · Contrôle du coût',ico:'coins',reg:1,d:'Ancien contrôle du coût de Facturation (remplacé par Contrôle des coûts).'},
    {v:'fx-affaires',t:'Projets · Facturation',ico:'folder',reg:1,d:'Registre des projets de l’app Facturation.'},
    {v:'fx-collaborateurs',t:'Collaborateurs · Facturation',ico:'users',reg:1,d:'Registre des collaborateurs (taux, objectifs).'},
    {v:'fx-heures',t:'Heures · Facturation',ico:'clock',reg:1,d:'Registre des heures importées.'},
    {v:'fx-import-delta',t:'Import Deltaproject',ico:'import',reg:1,d:'Import des exports CSV de Deltaproject.'},
    {v:'fx-analyse-globale',t:'Analyse globale',ico:'analyse',reg:1,d:'Analyse globale des projets et des heures.'},
    {v:'fx-affaire-detail',t:'Analyse de projet',hide:1},{v:'fx-collab-detail',t:'Fiche collaborateur · Facturation',hide:1}]}
];
const SG_D={}, NX_VIEW={};
SG_DOM.forEach(d=>{ SG_D[d.k]=d; if(d.k!=='accueil') NX_VIEW['dom-'+d.k]={d,t:'Vue d’ensemble'}; d.items.forEach(it=>{ if(!NX_VIEW[it.v]) NX_VIEW[it.v]={d,t:it.t,it}; }); });
NX_VIEW['nx-projet']={d:SG_D.projets,t:'Fiche projet',fiche:1}; NX_VIEW['nx-contact']={d:SG_D.contacts,t:'Fiche contact',fiche:1}; NX_VIEW['nx-collab']={d:SG_D.equipe,t:'Fiche membre',fiche:1};
const NX_KW={'aff-mes':'affaires','aff-toutes':'affaires','aff-controlling':'controlling','aff-gestion':'affaires gestion','coplan':'eccc','devis':'cfc','soum':'soumissions','coco':'budget',
  'adr-entites':'adresses entités','h-saisie':'heures','h-rapport':'heures','frais':'notes de frais','collab-actuels':'collaborateurs','mg-heures':'heures','mg-collab':'collaborateurs','mg-contrats':'honoraires',
  'mg-factures':'encaissements qr','mg-mo':'maître d’ouvrage','mg-reporting':'reporting','tpl-documents':'modèles','nx-data':'export import base','config':'administrateur paramètres',
  'fx-contrats':'contrats honoraires sia offre','fx-calchono':'nouveau contrat honoraires sia','fx-factures':'factures acomptes','fx-saisie':'nouvelle facture acompte','fx-backup':'export import facturation'};

const NX={hist:[],pos:-1,nav:false,booted:false,fromHist:false};
const nxLS={ get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(_){ return d; } }, set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(_){} } };
const nxE=s=>esc(s);
const nxNorm=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const nxH=v=>{ v=Math.round((+v||0)*10)/10; return num(v,v%1?1:0); };
const nxCHF=v=>num(Math.round(+v||0),0);
const nxIni=s=>{ const w=String(s||'').replace(/[^\p{L}\s-]/gu,' ').trim().split(/[\s-]+/).filter(Boolean); return ((w[0]||'?')[0]+(w.length>1?w[w.length-1][0]:(w[0]||'')[1]||'')).toUpperCase(); };
const nxDay=d=>d.toLocaleDateString('fr-CH',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
const nxCap=s=>String(s).replace(/^./,x=>x.toUpperCase());
function dayStart(d){ return new Date(d.getFullYear(),d.getMonth(),d.getDate()); }
const nxRel=d=>{ const n=Math.round((dayStart(new Date())-dayStart(d))/864e5); return n<=0?'aujourd’hui':n===1?'hier':n<7?'il y a '+n+' j':n<60?'il y a '+Math.round(n/7)+' sem.':dfr(diso(d)); };
const nxStateTag=p=>p?'<span class="nx-tag s'+p.PROJECTSTATECODE+'">'+nxE(projState(p))+'</span>':'';
const nxMe=()=>ME.staff;
function nxFirstName(){ const s=nxMe(), c=s&&DS.get('contact',s.PERSON_ID), o=c&&DS.get('contactowner',c.CONTACTOWNER_ID); return (o&&o.TYPECODE===1&&o.NAME2)||(ME.u&&ME.u.NAME)||''; }
function nxWorkdays(y,m){ let n=0; const d=new Date(y,m,1); while(d.getMonth()===m){ const w=d.getDay(); if(w&&w<6) n++; d.setDate(d.getDate()+1); } return n; }
function nxTarget(staffId,y,m){ const t=DS.by('stafftargettime','STAFF_ID',staffId).find(x=>+x.TARGETTIMEYEAR===y); const v=t?+t['TARGETHOURS'+m]:NaN; return isFinite(v)&&v>0?v:nxWorkdays(y,m)*8.5; }
function nxRate(staffId,d){ const rs=DS.by('staffrate','STAFF_ID',staffId).filter(r=>r.VALIDFROM).sort((a,b)=>cmp(a.VALIDFROM,b.VALIDFROM)); const k=diso(d); let r=0; for(const x of rs){ if(x.VALIDFROM<=k) r=+x.RATE||0; } return r||(rs[0]?+rs[0].RATE||0:0); }
const nxCan=v=>(typeof sgVueOk!=='function'||sgVueOk(v))&&(/^(fx-|nx-|dom-)/.test(v)||typeof ch08bViewOk!=='function'||ch08bViewOk(v));   // sgVueOk : profil d'accès (sg3_plus.js)

/* ═══ Logo officiel (charte : lettres « cryptées », parties grisées à 50 %) ═══ */
const SG_LOGO=`__LOGO__`;
const SG_SIGLE_PATH=`__SIGLE__`;

/* ═══ Navigation : menu à gauche (domaines → vue d'ensemble + modules, favoris) et en-tête ═══ */
function sgCur(){ const id=VIEW&&VIEW.id, m=NX_VIEW[id]; return {id,m,d:m?m.d:(id==='nx-home'?SG_D.accueil:null)}; }
function sgSide(){ const nav=document.getElementById('nx-nav'); if(!nav) return; const c=sgCur(), open=nxLS.get('nx_open3',{});
  let s='';
  SG_DOM.forEach(d=>{
    if(d.k==='accueil'){ s+='<div class="nx-g'+(c.d===d?' cur':'')+'"><div class="nx-gt'+(c.id==='nx-home'?' on':'')+'" data-go="nx-home" title="Accueil">'+nxSvg(d.ico)+'<span class="lb">Accueil</span></div></div>'; return; }
    const its=d.items.filter(it=>!it.hide&&nxCan(it.v)), isOpen=open[d.k]!=null?open[d.k]:c.d===d;
    if(!its.length) return;   // domaine sans module permis pour ce profil
    s+='<div class="nx-g'+(isOpen?' open':'')+(c.d===d?' cur':'')+'"><div class="nx-gt" data-tg="'+d.k+'" title="'+nxE(d.t)+'">'+nxSvg(d.ico)+'<span class="lb">'+nxE(d.t)+'</span>'+nxSvg('fwd','ch')+'</div><div class="nx-gi">'
      +'<div class="nx-it vo'+(c.id==='dom-'+d.k?' on':'')+'" data-go="dom-'+d.k+'">Vue d’ensemble</div>'
      +its.map(it=>'<div class="nx-it'+(c.id===it.v?' on':'')+(it.reg?' reg':'')+'" data-go="'+it.v+'" title="'+nxE(it.t)+'">'+nxE(it.reg?it.t.replace(/\s*·\s*Facturation$/,''):it.t)+(it.reg?'<i>F</i>':'')+'</div>').join('')
      +((c.m&&c.m.d===d&&(c.m.fiche||(c.m.it&&c.m.it.hide)))?'<div class="nx-it on fiche">'+nxE(VIEW.nxTitle||c.m.t)+'</div>':'')+'</div></div>'; });
  const pins=nxLS.get('nx_pins3',[]).map(nxRef).filter(Boolean);
  if(pins.length) s+='<div class="nx-pins"><div class="nx-sep">Favoris</div>'+pins.map(r=>'<div class="nx-pin" data-ref="'+r.k+':'+r.id+'" title="'+nxE(r.t)+'">'+(r.tag?'<i>'+nxE(r.tag)+'</i>':nxSvg(r.ico))+'<span>'+nxE(r.t)+'</span></div>').join('')+'</div>';
  nav.innerHTML=s; const on=nav.querySelector('.nx-it.on'); if(on) on.scrollIntoView({block:'nearest'}); }
function sgSideClick(e){ const g=e.target.closest('[data-go]'), tg=e.target.closest('[data-tg]'), pin=e.target.closest('[data-ref]');
  if(g){ go(g.dataset.go); return; }
  if(pin){ nxOpenRef(pin.dataset.ref); return; }
  if(tg){ const k=tg.dataset.tg; if(document.getElementById('app').classList.contains('nx-mini')){ go('dom-'+k); return; }
    const el=tg.parentNode, o=nxLS.get('nx_open3',{}); el.classList.toggle('open'); o[k]=el.classList.contains('open'); nxLS.set('nx_open3',o); } }
function nxMini(on){ const a=document.getElementById('app'); a.classList.toggle('nx-mini',on==null?!a.classList.contains('nx-mini'):on); nxLS.set('nx_mini3',a.classList.contains('nx-mini')); }
function sgNav(){ const c=sgCur(), d=c.d||SG_D.accueil; sgSide();
  let title=c.m?c.m.t:'', crumbs=d.t;
  if(c.id==='nx-home'){ title='Aujourd’hui'; crumbs=nxCap(nxDay(new Date())); }
  else if(c.id==='dom-'+d.k){ title=d.t; crumbs='Vue d’ensemble'; }
  else if(VIEW&&VIEW.nxTitle){ title=VIEW.nxTitle; crumbs=d.t+' · '+c.m.t; }
  else if(c.m&&c.m.it&&c.m.it.reg){ crumbs=d.t+' · registre Facturation'; title=c.m.t.replace(/\s*·\s*Facturation$/,''); }
  else if(!c.m&&c.id){ title=c.id; crumbs=''; }
  const t=document.getElementById('nx-title'), cr=document.getElementById('nx-crumbs'); if(t) t.textContent=title; if(cr) cr.textContent=crumbs;
  const b=document.getElementById('nx-back'), f=document.getElementById('nx-fwd'); if(b) b.disabled=NX.pos<=0; if(f) f.disabled=NX.pos>=NX.hist.length-1;
  document.title=(title||'SUBGestion')+' — SUBGestion';
  const se=document.getElementById('search'); if(se&&!se.disabled) se.placeholder='Filtrer cette liste   /';
  nxSubSync(); }
function nxSubSync(){ const tl=document.getElementById('tools'), se=document.getElementById('search'), sub=document.getElementById('nx-sub'), cx=document.getElementById('sg-ctx');
  if(sub) sub.classList.toggle('empty',!(tl&&tl.querySelector('button,input,select,.seg'))&&!(se&&!se.disabled)&&!(cx&&cx.firstChild)); }
function sgDomGo(k){ const d=SG_D[k]; if(!d) return; go(k==='accueil'?'nx-home':'dom-'+k); }
function nxRef(r){ if(!r) return null;
  if(r.k==='p'){ const p=DS.get('project',r.id); return p&&{k:'p',id:r.id,t:p.TITLE||p.NUMBER,tag:p.NUMBER,ico:'folder',sub:projState(p)}; }
  if(r.k==='c'){ const o=DS.get('contactowner',r.id); return o&&{k:'c',id:r.id,t:ownerName(o),ico:o.TYPECODE===1?'person':'building',sub:OWNER_T[o.TYPECODE]||''}; }
  if(r.k==='s'){ const s=DS.get('staff',r.id); return s&&{k:'s',id:r.id,t:staffName(s),tag:s.INITIALS,ico:'users',sub:'Membre de l’équipe'}; }
  return null; }
function nxOpenRef(ref){ const [k,id]=String(ref).split(':'); go(k==='p'?'nx-projet':k==='c'?'nx-contact':'nx-collab',id); }
function nxRecent(k,id){ const a=nxLS.get('nx_recent3',[]).filter(x=>!(x.k===k&&String(x.id)===String(id))); a.unshift({k,id:String(id)}); nxLS.set('nx_recent3',a.slice(0,10)); }
function nxPinned(k,id){ return nxLS.get('nx_pins3',[]).some(x=>x.k===k&&String(x.id)===String(id)); }
function nxTogglePin(k,id){ let a=nxLS.get('nx_pins3',[]); const on=a.some(x=>x.k===k&&String(x.id)===String(id));
  a=on?a.filter(x=>!(x.k===k&&String(x.id)===String(id))):[...a,{k,id:String(id)}]; nxLS.set('nx_pins3',a); sgSide(); toast(on?'Retiré des favoris.':'Ajouté aux favoris (menu et accueil).'); return !on; }
function nxFoot(){ const f=document.getElementById('nx-who'); if(!f) return; const s=nxMe(), n=(s&&staffName(s))||(ME.u&&ME.u.NAME)||'Utilisateur';
  f.innerHTML='<div class="nx-av" title="'+nxE(n)+' — base locale de ce navigateur">'+nxE(nxIni(n))+'</div><div class="who"><b>'+nxE(n)+'</b><span>Base locale</span></div>'; }
function nxNewMenu(el){ popMenu(el,[
  {t:'Projet',fn:()=>editProject()},{t:'Contact — société',fn:()=>editOwner(null,0)},{t:'Contact — personne',fn:()=>editOwner(null,1)},'-',
  {t:'Contrat d’honoraires',fn:()=>go('fx-calchono','new')},{t:'Facture ou acompte',fn:()=>go('fx-saisie','new')},'-',
  {t:'Saisie de temps',fn:()=>go('h-saisie')},{t:'Note de frais',fn:()=>go('frais')}]); }
function nxMenuCmds(){ try{ return ch10aModel(ch10aCtx(false)).filter(m=>m.k!=='Edit'&&m.k!=='menuView')
    .map(m=>({t:m.titre,items:m.items.filter(it=>it!=='-'&&!it.dis).map(it=>({t:String(it.t).replace(/\s*…$/,''),fn:()=>ch10aRun(it.act,it.arg)}))})).filter(m=>m.items.length); }
  catch(e){ console.error(e); return []; } }
function nxMoreMenu(el){ const its=[{t:'Réglages',fn:()=>go('dom-reglages')},{t:'Données & sauvegarde',fn:()=>go('nx-data')},{t:'Sauvegarde Facturation',fn:()=>go('fx-backup')},'-',
    {t:'Exporter la base de gestion',fn:()=>lbExport()},{t:'Importer une base de gestion',fn:()=>lbImportDlg(false)}];
  nxMenuCmds().forEach(m=>{ its.push('-'); m.items.forEach(x=>its.push({t:x.t,fn:x.fn})); });
  its.push('-',{t:'Raccourcis clavier',fn:nxKeysHelp}); popMenu(el,its); }
function nxKeysHelp(){ dialog({title:'Raccourcis clavier',body:h('div',{html:'<dl class="nx-dl" style="font-size:13px;min-width:380px">'
  +[['⌘ K','Rechercher partout : projets, contacts, contrats, factures, écrans, commandes'],['⌘ \\','Réduire le menu'],['/','Filtrer la liste de l’écran'],['⌥ ← / ⌥ →','Écran précédent / suivant'],['Échap','Fermer une fenêtre']]
  .map(([k,t])=>'<dt><span class="nx-tag">'+k+'</span></dt><dd>'+t+'</dd>').join('')+'</dl>'})}); }

/* ═══ Historique et synchronisation ═══ */
const nxGo0=go;
go=function(id,arg){
  const fromHist=NX.nav; NX.nav=false; NX.fromHist=fromHist;
  if(arg==null&&/^nx-(projet|contact|collab)$/.test(id)){ const a=nxLS.get('nx_arg3',{}); arg=a[id]; }
  nxGo0(id,arg); NX.fromHist=false;
  if(!VIEW||VIEW.id!==id) return;
  if(/^nx-(projet|contact|collab)$/.test(id)&&arg!=null){ const a=nxLS.get('nx_arg3',{}); a[id]=String(arg); nxLS.set('nx_arg3',a); }
  if(!fromHist){ const top=NX.hist[NX.pos]; if(!top||top.id!==id||(arg!=='sync'&&String(top.arg)!==String(arg))){ NX.hist=NX.hist.slice(0,NX.pos+1); NX.hist.push({id,arg:arg==='sync'?undefined:arg}); if(NX.hist.length>60) NX.hist.shift(); NX.pos=NX.hist.length-1; } }
  NX.booted=true; sgNav(); nxFoot(); sgCtxSync();
};
function nxHist(d){ const p=NX.pos+d; if(p<0||p>=NX.hist.length) return; NX.pos=p; NX.nav=true; const x=NX.hist[p]; go(x.id,x.arg); }

/* ═══ Modules Facturation (cadre #fx-frame) ═══ */
const FX={p:null,w:null,ready:false};
function fxEnsure(){
  if(FX.p) return FX.p;
  FX.p=(async()=>{ const src=document.getElementById('fx-src'); if(!src) throw new Error('modules Facturation absents de ce fichier');
    const b=atob(src.textContent.replace(/\s+/g,'')), u=new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i);
    const html=await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    const L=document.getElementById('fx-layer'); let f=document.getElementById('fx-frame'); if(f) f.remove();
    f=document.createElement('iframe'); f.id='fx-frame'; f.title='Facturation'; L.append(f);
    const d=f.contentDocument; d.open(); d.write(html); d.close();
    const w=f.contentWindow; for(let i=0;i<200&&!(typeof w.goTab==='function'&&d.readyState!=='loading');i++) await new Promise(r=>setTimeout(r,30));
    await new Promise(r=>setTimeout(r,250)); FX.w=w; FX.ready=true; return w; })();
  FX.p.catch(e=>{ console.error(e); FX.p=null; });
  return FX.p; }
function sgFxReload(){ FX.p=null; FX.ready=false; const id=VIEW&&VIEW.id; fxEnsure().then(()=>{ if(id&&/^fx-/.test(id)) go(id); }).catch(()=>{}); }
function fxData(){ try{ const w=FX.ready&&FX.w; if(!w) return null; return {c:w.eval('typeof contrats!=="undefined"?contrats:[]')||[],f:w.eval('typeof factures!=="undefined"?factures:[]')||[]}; }catch(_){ return null; } }
const fxClient=(D,f)=>{ const c=D.c.find(x=>x.id===f.contrat_id); return f.cl_nom||(c&&(c.nom||c.affaire))||''; };
const fxUnpaid=f=>f.statut!=='Payée'&&!f.date_paiement&&!/annul/i.test(f.statut||'');
/* appelé par le cadre quand Facturation change d'onglet (ouverture d'un contrat depuis la liste, etc.) */
function sgFxOnTab(tab){ const v='fx-'+tab; if(!VIEW||!/^fx-/.test(VIEW.id)||VIEW.id===v||!NX_VIEW[v]) return; go(v,'sync'); }
function sgFxHome(name){ if(!VIEW||!/^fx-/.test(VIEW.id)) return; const m={'hub-affaires':'dom-chantier','hub-collabs':'dom-temps','hub-heures':'dom-temps','hub-admin':'dom-reglages'}; go(m[name]||'dom-facturation'); }
SG_DOM.forEach(d=>d.items.filter(it=>/^fx-/.test(it.v)).forEach(it=>{ const tab=it.v.slice(3);
  VIEWS[it.v]={ render(m,arg){ document.getElementById('fx-layer').classList.add('on');
      const sync=arg==='sync'&&!NX.fromHist;
      fxEnsure().then(w=>{ if(!VIEW||VIEW.id!==it.v||sync) return;
        const a=String(arg||'');
        if(a==='new'&&tab==='calchono') w.newContratCalc();
        else if(a==='new'&&tab==='saisie'){ w.goTab('saisie'); w.newFacture(); }
        else if(a.startsWith('c:')) w.editContratCalc(a.slice(2));
        else if(a.startsWith('f:')) w.editFactureSaisie(a.slice(2));
        else w.goTab(tab); }).catch(e=>toast('✗ Facturation : '+(e&&e.message||e),true)); },
    leave(){ document.getElementById('fx-layer').classList.remove('on'); } }; }));

/* ═══ Fonctionnement commun : confirmations, messages, accès aux fiches depuis les listes ═══ */
/* confirmation unique pour toute l'app (Facturation : chConfirm(message, onYes, {title, yesText, noText, yesColor})) */
function sgConfirm(message,onYes,opts){ opts=opts||{}; const destructif=/supprim|effac|retir|détruire|vider/i.test(String(message||''))||/b04a4a|c0392b|b23b2b|bd1e42/i.test(opts.yesColor||'');
  const bt=[]; if(opts.noText!==null) bt.push({t:opts.noText||'Annuler'});
  bt.push({t:opts.yesText||(destructif?'Supprimer':'Confirmer'),pri:true,fn:()=>{ try{ onYes&&onYes(); }catch(e){ console.error(e); toast('✗ '+(e.message||e),true); } }});
  if(!onYes&&opts.noText==null&&!opts.yesText) bt.splice(0,bt.length,{t:'OK',pri:true});
  const D=dialog({title:opts.title||'Confirmation',body:h('div',{style:{whiteSpace:'pre-line',maxWidth:'520px',lineHeight:'1.5'}},String(message||'')),buttons:bt});
  if(destructif){ const b=D.bd.parentNode.querySelector('.ft .btn.pri'); if(b) b.classList.add('danger'); }
  setTimeout(()=>{ const b=D.bd.parentNode.querySelector('.ft .btn'); if(b) b.focus(); },30); return D; }
function sgAlert(m){ return dialog({title:'Information',body:h('div',{style:{whiteSpace:'pre-line',maxWidth:'520px',lineHeight:'1.5'}},String(m==null?'':m)),buttons:[{t:'OK',pri:true}]}); }
/* « Fiche » : un projet, un contact ou un membre sélectionné dans une liste du moteur → accès direct à sa fiche */
function sgLigneRef(tr){ if(!tr||!tr.dataset.k) return null; const k=tr.dataset.k, txt=nxNorm(tr.textContent);
  const p=DS.get('project',k); if(p&&p.NUMBER&&txt.includes(nxNorm(p.NUMBER))) return {ref:'p:'+p.ID,t:'Fiche projet '+p.NUMBER};
  const o=DS.get('contactowner',k); if(o&&o.NAME1&&txt.includes(nxNorm(o.NAME1))) return {ref:'c:'+o.ID,t:'Fiche contact'};
  const st=DS.get('staff',k); if(st&&((st.INITIALS&&txt.includes(nxNorm(st.INITIALS)))||txt.includes(nxNorm(staffName(st)).split(' ')[0]))) return {ref:'s:'+st.ID,t:'Fiche membre'};
  return null; }
function sgCtxSync(){ const box=document.getElementById('sg-ctx'); if(!box) return;
  const main=document.getElementById('main'), trs=main?[...main.querySelectorAll('table.g tr.on[data-k]')]:[];
  let r=null; for(const tr of trs){ r=sgLigneRef(tr); if(r) break; }
  box.innerHTML=r?'<button class="ib sg-fiche" data-ref="'+nxE(r.ref)+'" title="Ouvrir la fiche (vue d’ensemble, chiffres, liens)">'+nxSvg('arrow')+'<span class="lb">'+nxE(r.t)+'</span></button>':'';
  nxSubSync(); }

/* ═══ Petits graphiques (SVG) ═══ */
function nxBars(data,o){ o=o||{}; const W=o.w||640, H=o.h||170, pl=34, pb=22, pt=10, n=data.length||1, bw=(W-pl-8)/n;
  const max=Math.max(o.min||1,...data.map(d=>(d.a||0)+(d.b||0)),...(data.map(d=>d.t||0)));
  const st0=max/4, p10=Math.pow(10,Math.floor(Math.log10(st0))), step=[1,2,2.5,5,10].map(x=>x*p10).find(x=>x>=st0)||p10*10, nice=step*4, y=v=>pt+(H-pt-pb)*(1-v/nice);
  let s='<svg class="nx-chart" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" style="height:'+H+'px">';
  for(let i=0;i<=4;i++){ const v=nice*i/4, yy=y(v); s+='<line x1="'+pl+'" x2="'+(W-4)+'" y1="'+yy+'" y2="'+yy+'" stroke="'+(i?'#ececea':'#1d1d1b')+'" stroke-width="'+(i?1:1.5)+'"/><text x="'+(pl-6)+'" y="'+(yy+3.5)+'" text-anchor="end">'+Math.round(v)+'</text>'; }
  data.forEach((d,i)=>{ const x=pl+i*bw+bw*.2, w=bw*.6, a=d.a||0, b=d.b||0;
    if(a) s+='<rect x="'+x+'" y="'+y(a)+'" width="'+w+'" height="'+(y(0)-y(a))+'" fill="#003346"><title>'+nxE(d.l+' — '+(o.la||'')+' '+nxH(a)+' h')+'</title></rect>';
    if(b) s+='<rect x="'+x+'" y="'+y(a+b)+'" width="'+w+'" height="'+(y(a)-y(a+b))+'" fill="#b9c0c9"><title>'+nxE(d.l+' — '+(o.lb||'')+' '+nxH(b)+' h')+'</title></rect>';
    if(d.t) s+='<line x1="'+(x-2)+'" x2="'+(x+w+2)+'" y1="'+y(d.t)+'" y2="'+y(d.t)+'" stroke="#1d1d1b" stroke-width="1.5" stroke-dasharray="3 2"/>';
    if(!o.every||i%o.every===0) s+='<text x="'+(x+w/2)+'" y="'+(H-6)+'" text-anchor="middle">'+nxE(d.s||d.l)+'</text>'; });
  return s+'</svg>'; }
const nxLegend=(t)=>'<div class="nx-legend"><span><i style="background:#003346"></i>Facturable</span><span><i style="background:#b9c0c9"></i>Non facturable</span>'+(t?'<span><i style="background:#1d1d1b;height:2px;vertical-align:3px"></i>Objectif</span>':'')+'</div>';
const nxMiniBar=(v,max)=>'<span class="nx-mini-bar"><i style="width:'+Math.max(2,Math.min(100,max?v/max*100:0))+'%"></i></span>';
const nxCard=(cls,title,body,extra)=>'<div class="nx-card '+cls+'"><h4>'+title+(extra||'')+'</h4>'+body+'</div>';
const nxKpi=(ico,l,v,s,bar,go_,hero)=>'<div class="nx-kpi'+(go_?' lnk':'')+(hero?' hero':'')+'"'+(go_?' data-go="'+go_+'"':'')+'><div class="l">'+nxSvg(ico)+nxE(l)+'</div><div class="v">'+v+'</div>'+(s?'<div class="s">'+s+'</div>':'')+(bar!=null?'<div class="nx-bar"><i style="width:'+Math.max(0,Math.min(100,bar))+'%"></i></div>':'')+'</div>';
function nxPage(m,html){ const p=h('div',{class:'nx-page'}); p.innerHTML='<div class="nx-wrap">'+html+'</div>'; m.append(p);
  p.addEventListener('click',e=>{ const t=e.target.closest('[data-go],[data-ref],[data-fn]'); if(!t||!p.contains(t)) return;
    if(t.dataset.ref) nxOpenRef(t.dataset.ref); else if(t.dataset.go) go(t.dataset.go,t.dataset.arg); else if(t.dataset.fn&&p._fn&&p._fn[t.dataset.fn]) p._fn[t.dataset.fn](t); });
  p._fn={}; return p; }
const sgIntro=(lbl,title,txt,extra)=>'<aside class="sg-intro"><div class="sg-lbl">'+nxE(lbl)+'</div><h2>'+title+'</h2>'+(txt?'<p>'+txt+'</p>':'')+(extra||'')+'<div class="foot">substances.ch</div></aside>';

/* ═══ Accueil ═══ */
VIEWS['nx-home']={
  /* accueil personnel (07.10.2026) : selon la personne et son profil d'accès (sg3_plus.js : sgDroit, sgMesProjets…) — ses projets en
     cours, ses tâches à exécuter, son temps ; l'équipe, les factures et les montants seulement si son profil les permet */
  render(m){ const me=nxMe(), now=new Date(), y=now.getFullYear(), mo=now.getMonth(), mon=mondayOf(now), k0=dayKey(mon), kSun=dayKey(new Date(mon.getFullYear(),mon.getMonth(),mon.getDate()+6));
    const D_=(k,n)=>typeof sgDroit!=='function'||sgDroit(k,n), adm=typeof sgAdmin!=='function'||sgAdmin(), equipe=D_('heures','projets');
    const logs=DS.all('timelog'), mine=me?logs.filter(r=>String(r.STAFF_ID)===String(me.ID)):[];
    const sum=(a,f)=>a.reduce((s,r)=>s+(f(r)?+r.TIMEPERIOD||0:0),0);
    const wk=sum(mine,r=>tlKey(r)>=k0&&tlKey(r)<=kSun), mth=sum(mine,r=>+r.TIMEYEAR===y&&+r.TIMEMONTH===mo);
    const tMonth=me?nxTarget(me.ID,y,mo):0, tWeek=tMonth?tMonth/nxWorkdays(y,mo)*5:42.5;
    const teamM=logs.filter(r=>+r.TIMEYEAR===y&&+r.TIMEMONTH===mo), teamH=sum(teamM,()=>1), teamC=sum(teamM,r=>+r.ISCHARGEABLE);
    const lim30=dayKey(new Date(y,mo,now.getDate()-30)), per={};
    mine.forEach(r=>{ const k=tlKey(r), x=per[r.PROJECT_ID]||(per[r.PROJECT_ID]={h30:0,last:0}); if(k>=lim30) x.h30+=+r.TIMEPERIOD||0; if(k>x.last){ x.last=k; x.d=tlDate(r); } });
    const mesP=typeof sgMesProjets==='function'?sgMesProjets():new Set(Object.keys(per));
    let enCours=[...mesP].map(id=>DS.get('project',id)).filter(p=>p&&+p.PROJECTSTATECODE===2&&!(typeof sgInterne==='function'&&sgInterne(p)));
    const titreP=enCours.length||!adm?'Mes projets en cours':'Projets en cours du bureau';
    if(!enCours.length&&adm) enCours=DS.all('project').filter(p=>+p.PROJECTSTATECODE===2&&!(typeof sgInterne==='function'&&sgInterne(p)));
    const myP=enCours.map(p=>({p,...(per[p.ID]||{h30:0,last:0})})).sort((a,b)=>b.h30-a.h30||b.last-a.last||cmp(a.p.NUMBER,b.p.NUMBER)), maxP=Math.max(1,...myP.map(x=>x.h30));
    const mesStaffs=new Set(me?[String(me.ID)]:[]), tachesAll=DS.all('projecttask').filter(t=>!t.DONEDATE);
    const taches=tachesAll.filter(t=>mesStaffs.has(String(t.STAFF_ID))).sort((a,b)=>(+b.ISURGENT-+a.ISURGENT)||cmp(a.DEADLINE||'9999',b.DEADLINE||'9999'));
    const weeks=[]; for(let i=11;i>=0;i--){ const d=new Date(mon); d.setDate(d.getDate()-7*i); weeks.push({d,k:dayKey(d),ke:dayKey(new Date(d.getFullYear(),d.getMonth(),d.getDate()+6)),a:0,b:0}); }
    const wk0=weeks[0].k; (equipe?logs:mine).forEach(r=>{ const k=tlKey(r); if(k<wk0) return; const w=weeks.find(x=>k>=x.k&&k<=x.ke); if(!w) return; if(+r.ISCHARGEABLE) w.a+=+r.TIMEPERIOD||0; else w.b+=+r.TIMEPERIOD||0; });
    weeks.forEach(w=>{ w.l='Semaine '+isoWeek(w.d)[1]; w.s=String(isoWeek(w.d)[1]); });
    const team=equipe?staffList().map(s=>({s,h:sum(logs.filter(r=>String(r.STAFF_ID)===String(s.ID)),r=>tlKey(r)>=k0&&tlKey(r)<=kSun)})).filter(x=>adm||x.h>0).sort((a,b)=>b.h-a.h):[];
    const pins=nxLS.get('nx_pins3',[]).map(nxRef).filter(Boolean), argent=!(typeof sgFinVerrou==='function'&&sgFinVerrou());
    const greet=now.getHours()<12?'Bonjour':now.getHours()<18?'Bon après-midi':'Bonsoir', fn=nxFirstName();
    const acts='<div class="acts"><button class="nx-btn pri" data-go="h-saisie">'+nxSvg('timer')+'Saisir mon temps</button><button class="nx-btn" data-go="h-saisie">'+nxSvg('cal')+'Ma feuille d’heures</button>'
      +(D_('projets_modifier','tous')?'<button class="nx-btn" data-fn="np">'+nxSvg('folder')+'Nouveau projet</button>':'')
      +(D_('contrats','validation')?'<button class="nx-btn" data-go="fx-calchono" data-arg="new">'+nxSvg('contrat')+'Nouveau contrat</button>':'')
      +(D_('factures','validation')?'<button class="nx-btn" data-go="fx-saisie" data-arg="new">'+nxSvg('receipt')+'Nouvelle facture</button>':'')
      +'<button class="nx-btn" data-go="frais">'+nxSvg('coins')+'Note de frais</button><button class="nx-btn" data-fn="pal">'+nxSvg('search')+'Rechercher <span class="nx-kbd" style="margin-left:auto">⌘K</span></button></div>';
    const tache=t=>{ const p=DS.get('project',t.PROJECT_ID), late=t.DEADLINE&&t.DEADLINE<today();
      return '<div class="nx-row" '+(p?'data-ref="p:'+p.ID+'"':'data-go="taches-encours"')+'>'+nxSvg('task')+'<div class="t"><b>'+nxE(t.SUBJECT||'(sans objet)')+'</b><span>'+nxE(p?projLabel(p):'')+'</span></div>'
        +(+t.ISURGENT?'<span class="nx-tag urg">Urgent</span>':'')+'<span class="m"'+(late?' style="color:var(--s-rouge)"':'')+'>'+(t.DEADLINE?dfr(t.DEADLINE):'')+'</span></div>'; };
    const right='<div class="nx-kpis">'
      +nxKpi('timer','Mon temps cette semaine',nxH(wk)+'<small>/ '+nxH(tWeek)+' h</small>',me?Math.round(wk/tWeek*100)+' % de l’objectif':'',tWeek?wk/tWeek*100:0,'h-saisie',1)
      +nxKpi('cal','Mon temps ce mois',nxH(mth)+'<small>/ '+nxH(tMonth)+' h</small>',MOISL[mo]+' '+y,tMonth?mth/tMonth*100:0,'h-rapport')
      +nxKpi('folder',titreP,String(enCours.length),'en cours',null,'aff-mes')
      +(equipe?nxKpi('users',adm?'Temps de l’équipe ce mois':'Temps sur mes projets ce mois',nxH(teamH)+'<small>h</small>',(teamH?Math.round(teamC/teamH*100):0)+' % facturable',teamH?teamC/teamH*100:0,'mg-heures')
              :nxKpi('task','Mes tâches à exécuter',String(taches.length),taches.filter(t=>t.DEADLINE&&t.DEADLINE<today()).length+' en retard',null,'taches-encours'))
      +'</div><div class="nx-grid">'
      +nxCard('c7',titreP,myP.length?'<div class="b flush">'+myP.slice(0,8).map(x=>'<div class="nx-row" data-ref="p:'+x.p.ID+'"><span class="nx-tag num">'+nxE(x.p.NUMBER)+'</span><div class="t"><b>'+nxE(x.p.TITLE)+'</b><span>'+(x.d?'Ma dernière saisie '+nxRel(x.d):'Pas encore de saisie')+'</span></div>'
        +nxMiniBar(x.h30,maxP)+'<span class="m">'+nxH(x.h30)+' h</span></div>').join('')+(myP.length>8?'<div class="nx-row" data-go="aff-mes"><div class="t"><span>… et '+(myP.length-8)+' autre(s)</span></div></div>':'')+'</div>'
        :'<div class="nx-empty">Aucun projet en cours dans votre équipe.</div>','<span class="n">mes heures, 30 jours</span><span class="a" data-go="aff-mes">Mes projets</span>')
      +nxCard('c5','Mes tâches à exécuter',taches.length?'<div class="b flush">'+taches.slice(0,8).map(tache).join('')+'</div>':'<div class="nx-empty">Aucune tâche qui vous est attribuée.</div>','<span class="a" data-go="taches-encours">Tâches</span>')
      +(argent&&D_('factures','lecture')?nxCard('c5','Factures à suivre','<div class="b flush" id="sg-home-fx"><div class="nx-empty">Chargement de la facturation…</div></div>','<span class="a" data-go="fx-factures">Factures</span>'):'')
      +nxCard('c7',equipe?(adm?'Temps de l’équipe — 12 semaines':'Temps sur mes projets — 12 semaines'):'Mon temps — 12 semaines','<div class="b">'+nxBars(weeks,{la:'facturable',lb:'non facturable'})+nxLegend()+'</div>','<span class="a" data-go="h-rapport">Rapports</span>')
      +(equipe?nxCard('c5',adm?'Équipe cette semaine':'Sur mes projets cette semaine','<div class="b flush">'+(team.length?team.map(x=>'<div class="nx-person" data-ref="s:'+x.s.ID+'"><div class="nx-av">'+nxE(nxIni(staffName(x.s)))+'</div><div class="t"><b>'+nxE(staffName(x.s))+'</b><span>'+nxE(x.s.INITIALS||'')+'</span></div>'+nxMiniBar(x.h,tWeek)+'<span class="m" style="min-width:48px;text-align:right">'+nxH(x.h)+' h</span></div>').join(''):'<div class="nx-empty">Aucune saisie cette semaine.</div>')+'</div>'):'')
      +nxCard('c5','Favoris',pins.length?'<div class="b flush">'+pins.map(r=>'<div class="nx-row" data-ref="'+r.k+':'+r.id+'">'+nxSvg(r.ico)+'<div class="t"><b>'+nxE(r.t)+'</b><span>'+nxE(r.tag||r.sub||'')+'</span></div></div>').join('')+'</div>':'<div class="nx-empty">Épinglez un projet, un contact ou un membre depuis sa fiche pour le retrouver ici.</div>')
      +'</div>';
    const pg=nxPage(m,'<div class="sg-split">'+sgIntro('Substances Architectes — Gestion',nxE(greet)+(fn?' <br>'+nxE(fn):''),nxE(nxCap(nxDay(now)))+' · semaine '+isoWeek(now)[1],acts)+'<div>'+right+'</div></div>');
    pg._fn.np=()=>editProject(); pg._fn.pal=()=>nxPal();
    pg.querySelectorAll('.nx-kpi.lnk').forEach(k=>k.onclick=()=>go(k.dataset.go));
    if(document.getElementById('sg-home-fx')) fxEnsure().then(()=>{ const box=document.getElementById('sg-home-fx'); if(!box) return; const D=fxData(); if(!D){ box.innerHTML='<div class="nx-empty">Facturation indisponible.</div>'; return; }
      const td=today(), lst=D.f.filter(fxUnpaid).sort((a,b)=>cmp(a.ech,b.ech)).slice(0,6);
      box.innerHTML=lst.length?lst.map(f=>{ const late=f.ech&&f.ech<td; return '<div class="nx-row" data-go="fx-saisie" data-arg="f:'+nxE(f.id)+'">'+nxSvg('receipt')+'<div class="t"><b>'+nxE(f.num||'(sans numéro)')+'</b><span>'+nxE(fxClient(D,f))+'</span></div><span class="m">'+nxCHF((+f._ttc||0)+(+f._fttc||0))+' CHF</span>'
        +'<span class="nx-tag '+(late?'urg':'s3')+'">'+(late?'Échue':'Échéance')+' '+(f.ech?dfr(f.ech):'')+'</span></div>'; }).join(''):'<div class="nx-empty">Aucune facture ouverte.</div>'; }).catch(()=>{}); },
  refresh(ts){ if(hit(ts,'timelog','project','projecttask','staff')) go('nx-home'); }
};

/* ═══ Vues d'ensemble des domaines ═══ */
async function sgFigs(k){ const n=t=>DS.all(t).length, f=(v,t)=>({v,t});
  if(k==='projets'){ const ps=DS.all('project'), c=s=>ps.filter(p=>+p.PROJECTSTATECODE===s).length; return [f(c(2),'en cours'),f(c(3),'en attente'),f(c(4),'terminés'),f(DS.all('projecttask').filter(t=>!t.DONEDATE).length,'tâches ouvertes')]; }
  if(k==='chantier'){ await DS.need(['costplanning','costestimate','costcontrol']); return [f(n('costplanning'),'estimations'),f(n('costestimate'),'devis'),f(n('devisdocument'),'appels d’offres'),f(n('costcontrol'),'contrôles des coûts')]; }
  if(k==='contacts') return [f(DS.all('contactowner').filter(o=>!+o.ISHIDDEN).length,'entités'),f(n('contact'),'adresses'),f(n('contactgroup'),'listes'),f(n('property'),'catégories')];
  if(k==='temps'){ const me=nxMe(), now=new Date(), mon=mondayOf(now), k0=dayKey(mon), mine=me?DS.by('timelog','STAFF_ID',me.ID):[];
    const wk=mine.filter(r=>tlKey(r)>=k0).reduce((s,r)=>s+(+r.TIMEPERIOD||0),0), mo=mine.filter(r=>+r.TIMEYEAR===now.getFullYear()&&+r.TIMEMONTH===now.getMonth()).reduce((s,r)=>s+(+r.TIMEPERIOD||0),0);
    const ex=me?DS.by('projectcost','STAFF_ID',me.ID).filter(r=>+r.ISREFUNDABLE&&!+r.ISREFUNDED):[];
    return [f(nxH(wk)+' h','ma semaine'),f(nxH(mo)+' h','mon mois'),f(ex.length,'dépenses à rembourser'),f(nxCHF(ex.reduce((s,r)=>s+pcAmount(r),0)),'CHF à rembourser')]; }
  if(k==='equipe'){ const st=DS.all('staff'); return [f(st.filter(s=>+s.ISACTIVE).length,'membres actifs'),f(st.filter(s=>!+s.ISACTIVE).length,'anciens membres')]; }
  if(k==='facturation'){ await fxEnsure(); const D=fxData(); if(!D) return []; const y=String(new Date().getFullYear()), op=D.f.filter(fxUnpaid);
    return [f(D.c.filter(c=>!c.annule).length,'contrats'),f(D.c.filter(c=>c.signe).length,'signés'),f(D.f.filter(x=>String(x.date||'').startsWith(y)).length,'factures '+y),f(op.length,'factures ouvertes'),
      f(nxCHF(op.reduce((s,x)=>s+(+x._ttc||0)+(+x._fttc||0),0)),'CHF ouverts')]; }
  if(k==='finances'){ const pc=DS.all('projectcontract').filter(c=>!+c.ISSUBCONTRACT); return [f(pc.length,'contrats des projets'),f(nxCHF(pc.reduce((s,c)=>s+(+c.CONTRACTAMOUNT||0),0)),'CHF sous contrat')]; }
  if(k==='biblio'){ await DS.need(['modele','modeledocument','image','arriereplan']); return [f(n('modele'),'modèles'),f(n('modeledocument'),'documents types'),f(n('image'),'images'),f(n('arriereplan'),'fonds de page')]; }
  if(k==='reglages') return [f(num(DS.all('timelog').length,0),'saisies de temps'),f(n('project'),'projets'),f(n('contactowner'),'contacts'),f(DS.seq,'version de la base')];
  return []; }
SG_DOM.filter(d=>d.k!=='accueil').forEach(d=>{ VIEWS['dom-'+d.k]={ render(m){
    const its=d.items.filter(it=>!it.hide&&nxCan(it.v)), main=its.filter(it=>!it.reg), reg=its.filter(it=>it.reg);
    const tile=it=>'<div class="sg-tile'+(it.hero?' hero':'')+'" data-go="'+it.v+'"><div class="ti">'+nxSvg(it.ico)+'<h3>'+nxE(it.t)+'</h3></div><p>'+nxE(it.d||'')+'</p><div class="ft">'+(it.reg?'<span class="nx-tag fx">Registre Facturation</span>':'')+nxSvg('arrow','go')+'</div></div>';
    const html='<div class="sg-split">'+sgIntro(d.t,nxE(d.t),nxE(d.d||''),'<div class="sg-figs" id="sg-figs"></div>')
      +'<div class="sg-tiles">'+main.map(tile).join('')+(reg.length?'<div class="sg-gt">Registres et archives de l’app Facturation</div>'+reg.map(tile).join(''):'')+'</div></div>';
    nxPage(m,html);
    sgFigs(d.k).then(fs=>{ const b=document.getElementById('sg-figs'); if(b&&VIEW&&VIEW.id==='dom-'+d.k) b.innerHTML=fs.map(x=>'<div class="sg-fig"><div class="n">'+nxE(x.v)+'</div><div class="t">'+nxE(x.t)+'</div></div>').join(''); }).catch(e=>console.error(e)); } }; });

/* ═══ Fiche projet ═══ */
VIEWS['nx-projet']={
  render(m,arg){ const p=DS.get('project',arg); if(!p){ nxPage(m,'<div class="nx-empty">Projet introuvable. Choisissez un projet avec ⌘K.</div>'); return; }
    VIEW.nxTitle=(p.NUMBER?p.NUMBER+' · ':'')+(p.TITLE||''); nxRecent('p',p.ID);
    const logs=DS.by('timelog','PROJECT_ID',p.ID), now=new Date(), lim30=dayKey(new Date(now.getFullYear(),now.getMonth(),now.getDate()-30));
    let tot=0, h30=0, chg=0, cost=0; const bySt={}, byPh={}, byM={};
    logs.forEach(r=>{ const v=+r.TIMEPERIOD||0, d=tlDate(r); tot+=v; if(tlKey(r)>=lim30) h30+=v; if(+r.ISCHARGEABLE) chg+=v; cost+=v*nxRate(r.STAFF_ID,d);
      bySt[r.STAFF_ID]=(bySt[r.STAFF_ID]||0)+v; if(r.PHASE_ID!=null) byPh[r.PHASE_ID]=(byPh[r.PHASE_ID]||0)+v; const mk=d.getFullYear()*12+d.getMonth(); byM[mk]=(byM[mk]||0)+v; });
    const costs=DS.by('projectcost','PROJECT_ID',p.ID).reduce((s,r)=>s+pcAmount(r),0);
    const contr=DS.by('projectcontract','PROJECT_ID',p.ID).filter(c=>!+c.ISSUBCONTRACT).reduce((s,c)=>s+(+c.CONTRACTAMOUNT||0),0);
    const mks=Object.keys(byM).map(Number), mEnd=now.getFullYear()*12+now.getMonth(), mStart=Math.max(mks.length?Math.min(...mks):mEnd-11,mEnd-23), months=[];
    for(let k=Math.min(mStart,mEnd-11);k<=mEnd;k++) months.push({l:MOISL[k%12]+' '+Math.floor(k/12),s:MOIS[k%12].replace('.',''),a:byM[k]||0});
    const team=Object.entries(bySt).map(([id,v])=>({s:DS.get('staff',id),v})).filter(x=>x.s).sort((a,b)=>b.v-a.v);
    const mem=DS.by('projectmember','PROJECT_ID',p.ID).filter(x=>!+x.ISHIDDEN&&+x.TEAMROLECODE!==12&&+x.TEAMROLECODE!==90).sort((a,b)=>(ROLE_ORD[a.TEAMROLECODE]??99)-(ROLE_ORD[b.TEAMROLECODE]??99)||cmp(a.SORTORDER,b.SORTORDER));
    const phases=DS.by('projectphase','PROJECT_ID',p.ID).sort((a,b)=>cmp(a.NUMBER,b.NUMBER));
    const notes=DS.by('projectnote','PROJECT_ID',p.ID).sort((a,b)=>cmp(b.CHANGEDDATE,a.CHANGEDDATE)), tasks=DS.by('projecttask','PROJECT_ID',p.ID).sort((a,b)=>cmp(a.DEADLINE,b.DEADLINE));
    const last=logs.slice().sort((a,b)=>tlKey(b)-tlKey(a)||cmp(b.TIMEHOUR1,a.TIMEHOUR1)).slice(0,8), mo=projMO(p), pin=nxPinned('p',p.ID);
    const html='<div class="nx-hero"><div class="ic">'+nxE(String(p.NUMBER||'').slice(0,5)||nxIni(p.TITLE))+'</div><div class="tx"><h2>'+nxE(p.TITLE||p.NUMBER)+'</h2><div class="meta"><span class="nx-tag num">'+nxE(p.NUMBER||'')+'</span>'+nxStateTag(p)
      +(mo?'<span>'+nxSvg('person')+nxE(mo)+'</span>':'')+(p.LOCATION?'<span>'+nxSvg('map')+nxE(p.LOCATION)+'</span>':'')+(p.PROJECTSTARTDATE?'<span>'+nxSvg('cal')+dfr(p.PROJECTSTARTDATE)+(p.PROJECTENDDATE?' → '+dfr(p.PROJECTENDDATE):'')+'</span>':'')
      +(+p.ISINTERNAL?'<span class="nx-tag">Interne</span>':'')+'</div></div><div class="nx-acts"><button class="nx-btn'+(pin?' on':'')+'" data-fn="pin">'+nxSvg('pin')+(pin?'Favori':'Favori')+'</button>'
      +'<button class="nx-btn" data-fn="mem">'+nxSvg('users')+'Intervenants</button><button class="nx-btn" data-fn="ph">'+nxSvg('list')+'Phases</button><button class="nx-btn" data-fn="more">'+nxSvg('more')+'</button><button class="nx-btn pri" data-fn="edit">'+nxSvg('edit')+'Modifier</button></div></div>'
      +'<div class="nx-kpis">'+nxKpi('clock','Temps total',nxH(tot)+'<small>h</small>',nxH(h30)+' h ces 30 derniers jours',null,null,1)+nxKpi('trend','Part facturable',(tot?Math.round(chg/tot*100):0)+'<small>%</small>',nxH(chg)+' h facturables',tot?chg/tot*100:0)
      +nxKpi('coins','Coût du temps',nxCHF(cost)+'<small>CHF</small>','au taux de chaque membre')+nxKpi('receipt','Notes de frais',nxCHF(costs)+'<small>CHF</small>','frais saisis sur le projet')
      +nxKpi('wallet','Contrats',nxCHF(contr)+'<small>CHF</small>',contr&&cost?'temps consommé : '+Math.round(cost/contr*100)+' % du contrat':'montant des contrats',contr?cost/contr*100:null)+'</div>'
      +'<div class="nx-grid">'+nxCard('c8','Temps par mois','<div class="b">'+nxBars(months,{every:months.length>14?2:1})+'</div>')
      +nxCard('c4','Équipe','<div class="b flush">'+(team.length?team.slice(0,9).map(x=>'<div class="nx-person" data-ref="s:'+x.s.ID+'"><div class="nx-av">'+nxE(nxIni(staffName(x.s)))+'</div><div class="t"><b>'+nxE(staffName(x.s))+'</b><span>'+Math.round(x.v/tot*100)+' % du temps</span></div><span class="m">'+nxH(x.v)+' h</span></div>').join(''):'<div class="nx-empty">Aucune saisie de temps.</div>')+'</div>')
      +nxCard('c6','Intervenants','<div class="b flush">'+(mem.length?mem.map(x=>{ const c=DS.get('contact',x.CONTACT_ID), o=c&&DS.get('contactowner',c.CONTACTOWNER_ID);
          return '<div class="nx-person"'+(o?' data-ref="c:'+o.ID+'"':'')+'><div class="nx-av ext">'+nxE(nxIni(contactName(c)))+'</div><div class="t"><b>'+nxE(contactName(c)||'—')+'</b><span>'+nxE(teamRole(x.TEAMROLECODE))+(x.BKP?' · CFC '+nxE(x.BKP):'')+'</span></div>'+(c&&c.PHONENUMBER1?'<span class="m">'+nxE([c.PHONEAREA1,c.PHONENUMBER1].filter(Boolean).join(' '))+'</span>':'')+'</div>'; }).join(''):'<div class="nx-empty">Aucun intervenant.</div>')+'</div>','<span class="n">'+mem.length+'</span><span class="a" data-fn="mem">Gérer</span>')
      +nxCard('c6','Phases',phases.length?'<div class="b flush"><table class="nx-tbl"><tr><th>Phase</th><th class="r">Temps</th><th class="r">Budget</th><th></th></tr>'+phases.map(f=>{ const v=byPh[f.ID]||0, b=+f.TIMEBUDGET||0;
          return '<tr><td>'+nxE((f.NUMBER!=null?f.NUMBER+' · ':'')+nm(f))+'</td><td class="r">'+nxH(v)+' h</td><td class="r">'+(b?nxH(b)+' h':'—')+'</td><td style="width:100px">'+(b?nxMiniBar(v,b):'')+'</td></tr>'; }).join('')+'</table></div>':'<div class="nx-empty">Aucune phase configurée.</div>','<span class="a" data-fn="ph">Configurer</span>')
      +nxCard('c7','Dernières saisies',last.length?'<div class="b flush"><table class="nx-tbl"><tr><th>Date</th><th>Membre</th><th>Activité</th><th class="r">Durée</th></tr>'+last.map(r=>{ const s=DS.get('staff',r.STAFF_ID), a=DS.get('projectactivity',r.ACTIVITY_ID)||DS.get('activity',r.ACTIVITY_ID);
          return '<tr><td>'+dfr(diso(tlDate(r)))+'</td><td>'+nxE(s?s.INITIALS||staffName(s):'')+'</td><td style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+nxE([nm(a),r.DESCRIPTION].filter(Boolean).join(' — '))+'</td><td class="r">'+nxH(r.TIMEPERIOD)+' h</td></tr>'; }).join('')+'</table></div>':'<div class="nx-empty">Aucune saisie.</div>','<span class="a" data-go="aff-controlling">Suivi & écarts</span>')
      +nxCard('c5','Notes & tâches','<div class="b flush">'+(notes.length||tasks.length?tasks.map(t=>'<div class="nx-row">'+nxSvg('task')+'<div class="t"><b>'+nxE(t.SUBJECT||'')+'</b><span>'+(t.DONEDATE?'Réglée le '+dfr(t.DONEDATE):t.DEADLINE?'Échéance '+dfr(t.DEADLINE):'')+'</span></div>'+(+t.ISURGENT&&!t.DONEDATE?'<span class="nx-tag urg">Urgent</span>':'')+'</div>').join('')
          +notes.map(n=>'<div class="nx-row" style="cursor:default">'+nxSvg('doc')+'<div class="t"><b>'+nxE(n.SUBJECT||'Note')+'</b><span>'+nxE([n.OWNER,dfr(n.CHANGEDDATE),n.CONTENT].filter(Boolean).join(' · '))+'</span></div></div>').join(''):'<div class="nx-empty">Aucune note ni tâche.</div>')+'</div>')
      +nxCard('c12','Contrats et factures du bureau','<div class="b flush" id="sg-p-fx"><div class="nx-empty">Recherche dans la facturation…</div></div>','<span class="a" data-go="fx-contrats">Contrats d’honoraires</span>')
      +'</div>';
    const pg=nxPage(m,html);
    Object.assign(pg._fn,{edit:()=>editProject(p),mem:()=>cfgMembers(p),ph:()=>cfgPhases(p),pin:b=>{ const on=nxTogglePin('p',p.ID); b.classList.toggle('on',on); },
      more:b=>popMenu(b,[{t:'Activités',fn:()=>cfgActivities(p)},{t:'Tarifs de facturation',fn:()=>cfgRates(p)},{t:'Subdivisions',fn:()=>cfgSubprojects(p)},'-',
        {t:'Mes projets',fn:()=>go('aff-mes')},{t:'Suivi & écarts',fn:()=>go('aff-controlling')},{t:'Contrôle des coûts',fn:()=>go('coco')},{t:'Contrats des projets',fn:()=>go('mg-contrats')}])});
    /* contrats et factures de l'app Facturation : code d'affaire = numéro du projet */
    fxEnsure().then(()=>{ const box=document.getElementById('sg-p-fx'); if(!box) return; const D=fxData(); if(!D) return;
      const key=nxNorm(p.NUMBER), cs=D.c.filter(c=>nxNorm(c.affaire)===key||nxNorm(c.affaire).startsWith(key)), ids=new Set(cs.map(c=>c.id)), fs=D.f.filter(f=>ids.has(f.contrat_id)).sort((a,b)=>cmp(b.date,a.date));
      box.innerHTML=(cs.length||fs.length)?'<table class="nx-tbl"><tr><th>Document</th><th>Client</th><th>Date</th><th class="r">Montant TTC</th><th>État</th></tr>'
        +cs.map(c=>'<tr class="nx-row" data-go="fx-calchono" data-arg="c:'+nxE(c.id)+'" style="display:table-row"><td><b>Contrat '+nxE(c.affaire||'')+'</b></td><td>'+nxE(c.nom||'')+'</td><td>'+nxE(c.date?dfr(c.date):'')+'</td><td class="r">'+(c.httc?nxCHF(c.httc):'')+'</td><td>'+(c.annule?'<span class="nx-tag s5">Annulé</span>':c.signe?'<span class="nx-tag s2">Signé</span>':c.envoye?'<span class="nx-tag s3">Envoyé</span>':'<span class="nx-tag">Brouillon</span>')+'</td></tr>').join('')
        +fs.map(f=>'<tr class="nx-row" data-go="fx-saisie" data-arg="f:'+nxE(f.id)+'" style="display:table-row"><td>'+nxE(f.num||'')+' <span style="color:var(--s-gris)">'+nxE(f.type||'')+'</span></td><td>'+nxE(fxClient(D,f))+'</td><td>'+nxE(f.date?dfr(f.date):'')+'</td><td class="r">'+nxCHF((+f._ttc||0)+(+f._fttc||0))+'</td><td>'+(fxUnpaid(f)?'<span class="nx-tag s3">'+nxE(f.statut||'Ouverte')+'</span>':'<span class="nx-tag s2">Payée</span>')+'</td></tr>').join('')+'</table>'
        :'<div class="nx-empty">Aucun contrat ni facture de l’app Facturation pour le projet '+nxE(p.NUMBER)+'.</div>'; }).catch(()=>{}); },
  refresh(ts){ if(hit(ts,'project','projectmember','projectphase','timelog','projectcost','projectcontract','projectnote','projecttask')) go('nx-projet',VIEW.arg); }
};

/* ═══ Fiche contact (entité) ═══ */
function nxPhone(c,i){ const n=c['PHONENUMBER'+i]; return n?[c['PHONEAREA'+i],n].filter(Boolean).join(' '):''; }
VIEWS['nx-contact']={
  render(m,arg){ const o=DS.get('contactowner',arg); if(!o){ nxPage(m,'<div class="nx-empty">Contact introuvable.</div>'); return; }
    const name=ownerName(o); VIEW.nxTitle=name; nxRecent('c',o.ID);
    const cs=DS.by('contact','CONTACTOWNER_ID',o.ID), ids=new Set(cs.map(c=>String(c.ID)));
    const mem=DS.all('projectmember').filter(x=>ids.has(String(x.CONTACT_ID))), prj={};
    mem.forEach(x=>{ const p=DS.get('project',x.PROJECT_ID); if(!p) return; const e=prj[p.ID]||(prj[p.ID]={p,r:new Set()}); e.r.add(teamRole(x.TEAMROLECODE)); });
    const plist=Object.values(prj).sort((a,b)=>cmp(b.p.PROJECTSTARTDATE,a.p.PROJECTSTARTDATE));
    const props=[...new Set(cs.flatMap(c=>DS.by('contact_property','CONTACT_ID',c.ID).map(x=>nm(DS.get('property',x.PROPERTIES_ID)))).filter(Boolean))];
    const notes=cs.flatMap(c=>DS.by('contactnote','CONTACT_ID',c.ID)).sort((a,b)=>cmp(b.CHANGEDDATE,a.CHANGEDDATE));
    const st=DS.all('staff').find(s=>ids.has(String(s.PERSON_ID))), pin=nxPinned('c',o.ID);
    const adr=cs.map(c=>{ const tel=nxPhone(c,1), mob=nxPhone(c,2), lines=[c.NAME1,c.NAME2,c.NAME3].filter(Boolean).filter(x=>x!==name);
      return '<div class="nx-addr"><div class="h"><b>'+nxE(ADR_T[c.ADDRESSTYPECODE]||'Adresse')+'</b>'+(c.BKP?'<span class="nx-tag num">CFC '+nxE(c.BKP)+'</span>':'')+(c.COMPANYROLE||c.PROFESSION?'<span class="nx-tag">'+nxE(c.COMPANYROLE||c.PROFESSION)+'</span>':'')+'</div><dl class="nx-dl">'
        +((lines.length||c.STREET||c.LOCATION)?'<dt>Adresse</dt><dd>'+[...lines,c.STREET,c.POBOX,[c.POSTALCODE,c.LOCATION].filter(Boolean).join(' ')].filter(Boolean).map(nxE).join('<br>')+'</dd>':'')
        +(tel?'<dt>Téléphone</dt><dd><a href="tel:'+nxE((c.PHONECOUNTRY1||'')+tel.replace(/^0/,'').replace(/\s/g,''))+'">'+nxE(tel)+'</a></dd>':'')
        +(mob?'<dt>Mobile</dt><dd><a href="tel:'+nxE((c.PHONECOUNTRY2||'')+mob.replace(/^0/,'').replace(/\s/g,''))+'">'+nxE(mob)+'</a></dd>':'')
        +(c.EMAIL1?'<dt>Courriel</dt><dd><a href="mailto:'+nxE(c.EMAIL1)+'">'+nxE(c.EMAIL1)+'</a></dd>':'')
        +(c.INTERNET?'<dt>Site</dt><dd><a href="'+nxE(/^https?:/i.test(c.INTERNET)?c.INTERNET:'https://'+c.INTERNET)+'" target="_blank" rel="noopener">'+nxE(c.INTERNET)+'</a></dd>':'')
        +(c.REMARK?'<dt>Remarque</dt><dd>'+nxE(c.REMARK)+'</dd>':'')+'</dl></div>'; }).join('');
    const html='<div class="nx-hero"><div class="ic">'+(o.TYPECODE===1?nxE(nxIni(name)):nxSvg('building'))+'</div><div class="tx"><h2>'+nxE(name)+'</h2><div class="meta"><span class="nx-tag">'+nxE(OWNER_T[o.TYPECODE]||'')+'</span>'
      +(o.UID?'<span>IDE '+nxE(o.UID)+'</span>':'')+(o.CREATED?'<span>'+nxSvg('cal')+'Créé le '+dfr(o.CREATED)+'</span>':'')+(st?'<span class="nx-tag num" data-ref="s:'+st.ID+'" style="cursor:pointer">Membre de l’équipe</span>':'')+'</div></div>'
      +'<div class="nx-acts"><button class="nx-btn'+(pin?' on':'')+'" data-fn="pin">'+nxSvg('pin')+'Favori</button><button class="nx-btn" data-fn="adr">'+nxSvg('plus')+'Adresse</button><button class="nx-btn" data-go="adr-entites">'+nxSvg('contacts')+'Annuaire</button><button class="nx-btn pri" data-fn="edit">'+nxSvg('edit')+'Modifier</button></div></div>'
      +'<div class="nx-grid">'+nxCard('c5','Coordonnées','<div class="b flush">'+(adr||'<div class="nx-empty">Aucune adresse.</div>')+'</div>','<span class="n">'+cs.length+'</span>')
      +nxCard('c7','Projets',plist.length?'<div class="b flush">'+plist.map(x=>'<div class="nx-row" data-ref="p:'+x.p.ID+'"><span class="nx-tag num">'+nxE(x.p.NUMBER)+'</span><div class="t"><b>'+nxE(x.p.TITLE)+'</b><span>'+nxE([...x.r].join(', '))+'</span></div>'+nxStateTag(x.p)+'</div>').join('')+'</div>':'<div class="nx-empty">Intervenant d’aucun projet.</div>','<span class="n">'+plist.length+'</span>')
      +(props.length?nxCard('c5','Catégories','<div class="b" style="display:flex;flex-wrap:wrap;gap:6px">'+props.map(x=>'<span class="nx-tag">'+nxE(x)+'</span>').join('')+'</div>'):'')
      +((notes.length||o.REMARK)?nxCard('c7','Notes','<div class="b flush">'+(o.REMARK?'<div class="nx-row" style="cursor:default">'+nxSvg('info')+'<div class="t"><b>Remarque</b><span style="white-space:normal">'+nxE(o.REMARK)+'</span></div></div>':'')
        +notes.map(n=>'<div class="nx-row" style="cursor:default">'+nxSvg('doc')+'<div class="t"><b>'+nxE(n.SUBJECT||'Note')+'</b><span>'+nxE([n.OWNER,dfr(n.CHANGEDDATE),n.CONTENT].filter(Boolean).join(' · '))+'</span></div></div>').join('')+'</div>'):'')
      +'</div>';
    const pg=nxPage(m,html);
    Object.assign(pg._fn,{edit:()=>editOwner(o,o.TYPECODE),adr:()=>editContact(null,o),pin:b=>{ const on=nxTogglePin('c',o.ID); b.classList.toggle('on',on); }}); },
  refresh(ts){ if(hit(ts,'contactowner','contact','projectmember','contact_property','contactnote')) go('nx-contact',VIEW.arg); }
};

/* ═══ Fiche membre ═══ */
VIEWS['nx-collab']={
  render(m,arg){ const s=DS.get('staff',arg); if(!s){ nxPage(m,'<div class="nx-empty">Membre introuvable.</div>'); return; }
    const name=staffName(s); VIEW.nxTitle=name; nxRecent('s',s.ID);
    const now=new Date(), y=now.getFullYear(), mo=now.getMonth(), logs=DS.by('timelog','STAFF_ID',s.ID);
    const months=MOIS.map((l,i)=>({l:MOISL[i]+' '+y,s:l.replace('.',''),a:0,b:0,t:nxTarget(s.ID,y,i)})), prj={};
    let yr=0, yrC=0; logs.forEach(r=>{ if(+r.TIMEYEAR!==y) return; const v=+r.TIMEPERIOD||0; yr+=v; if(+r.ISCHARGEABLE){ yrC+=v; months[+r.TIMEMONTH].a+=v; } else months[+r.TIMEMONTH].b+=v; prj[r.PROJECT_ID]=(prj[r.PROJECT_ID]||0)+v; });
    const mth=months[mo].a+months[mo].b, tM=months[mo].t, tY=months.slice(0,mo+1).reduce((a,x)=>a+x.t,0);
    const pl=Object.entries(prj).map(([id,v])=>({p:DS.get('project',id),v})).filter(x=>x.p).sort((a,b)=>b.v-a.v).slice(0,10);
    const c=DS.get('contact',s.PERSON_ID), o=c&&DS.get('contactowner',c.CONTACTOWNER_ID), rate=nxRate(s.ID,now), pin=nxPinned('s',s.ID);
    const html='<div class="nx-hero"><div class="ic">'+nxE(nxIni(name))+'</div><div class="tx"><h2>'+nxE(name)+'</h2><div class="meta">'+(s.INITIALS?'<span class="nx-tag num">'+nxE(s.INITIALS)+'</span>':'')
      +'<span class="nx-tag '+(+s.ISACTIVE?'s2':'s5')+'">'+(+s.ISACTIVE?'Actif':'Ancien membre')+'</span>'+(s.JOININGDATE?'<span>'+nxSvg('cal')+'Depuis le '+dfr(s.JOININGDATE)+(s.QUITTINGDATE?' · jusqu’au '+dfr(s.QUITTINGDATE):'')+'</span>':'')
      +(c&&c.EMAIL1?'<span>'+nxSvg('mail')+'<a href="mailto:'+nxE(c.EMAIL1)+'" style="color:inherit">'+nxE(c.EMAIL1)+'</a></span>':'')+'</div></div>'
      +'<div class="nx-acts"><button class="nx-btn'+(pin?' on':'')+'" data-fn="pin">'+nxSvg('pin')+'Favori</button>'+(o?'<button class="nx-btn" data-ref="c:'+o.ID+'">'+nxSvg('contacts')+'Coordonnées</button>':'')
      +'<button class="nx-btn" data-go="h-rapport">'+nxSvg('analyse')+'Rapports</button><button class="nx-btn pri" data-go="h-saisie">'+nxSvg('timer')+'Feuille d’heures</button></div></div>'
      +'<div class="nx-kpis">'+nxKpi('clock','Temps ce mois',nxH(mth)+'<small>/ '+nxH(tM)+' h</small>',MOISL[mo],tM?mth/tM*100:0,null,1)+nxKpi('cal','Temps '+y,nxH(yr)+'<small>/ '+nxH(tY)+' h</small>','objectif à fin '+MOISL[mo].toLowerCase(),tY?yr/tY*100:0)
      +nxKpi('trend','Part facturable '+y,(yr?Math.round(yrC/yr*100):0)+'<small>%</small>',nxH(yrC)+' h facturables',yr?yrC/yr*100:0)
      +nxKpi('cal','Solde de vacances',nxH(s.HOLIDAYBALANCE)+'<small>h</small>',s.HOLIDAYBALANCECHANGEDDATE?'au '+dfr(s.HOLIDAYBALANCECHANGEDDATE):'')
      +(rate?nxKpi('coins','Taux horaire',num(rate,0)+'<small>CHF/h</small>','taux interne en vigueur'):'')+'</div>'
      +'<div class="nx-grid">'+nxCard('c8','Temps par mois '+y,'<div class="b">'+nxBars(months,{la:'facturable',lb:'non facturable'})+nxLegend(1)+'</div>')
      +nxCard('c4','Projets '+y,pl.length?'<div class="b flush">'+pl.map(x=>'<div class="nx-row" data-ref="p:'+x.p.ID+'"><span class="nx-tag num">'+nxE(x.p.NUMBER)+'</span><div class="t"><b>'+nxE(x.p.TITLE)+'</b></div><span class="m">'+nxH(x.v)+' h</span></div>').join('')+'</div>':'<div class="nx-empty">Aucune saisie cette année.</div>')
      +'</div>';
    const pg=nxPage(m,html); pg._fn.pin=b=>{ const on=nxTogglePin('s',s.ID); b.classList.toggle('on',on); }; },
  refresh(ts){ if(hit(ts,'staff','timelog','stafftargettime')) go('nx-collab',VIEW.arg); }
};

/* ═══ Données & sauvegarde ═══ */
VIEWS['nx-data']={
  render(m){ const li=DS.linfo||{}, n=t=>DS.all(t).length, cmds=nxMenuCmds();
    const html='<div class="sg-split">'+sgIntro('Réglages','Données &amp; sauvegarde','Toutes les données sont dans ce navigateur (sans serveur). Exportez-les régulièrement : base de gestion ci-contre, facturation dans « Sauvegarde Facturation ».')
      +'<div><div class="nx-kpis">'+nxKpi('folder','Projets',String(n('project')),null,null,null,1)+nxKpi('contacts','Contacts',String(n('contactowner')),n('contact')+' adresses')+nxKpi('clock','Saisies de temps',num(n('timelog'),0))+nxKpi('users','Membres',String(n('staff')))+'</div>'
      +'<div class="nx-grid">'+nxCard('c6','Base de gestion','<div class="b"><p style="margin:0 0 14px;font-weight:300">L’export télécharge toute la base (projets, contacts, temps, chantier, finances, bibliothèque) dans un fichier <b>.json.gz</b>. L’import <b>remplace</b> la base de ce navigateur.</p>'
        +'<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="nx-btn pri" data-fn="exp">'+nxSvg('export')+'Exporter</button><button class="nx-btn" data-fn="imp">'+nxSvg('import')+'Importer</button></div></div>')
      +nxCard('c6','Facturation','<div class="b"><p style="margin:0 0 14px;font-weight:300">Contrats, factures et registres de l’app Facturation : export, import et sauvegarde automatique sur le disque.</p><button class="nx-btn" data-go="fx-backup">'+nxSvg('save')+'Sauvegarde Facturation</button></div>')
      +nxCard('c6','Origine de la base','<div class="b"><dl class="nx-dl"><dt>Source</dt><dd>'+nxE(li.source||'—')+'</dd><dt>Importée le</dt><dd>'+nxE(li.imported?dfr(li.imported.slice(0,10))+' '+li.imported.slice(11,16):'—')+'</dd><dt>Version</dt><dd>'+nxE(String(DS.seq))+'</dd></dl></div>')
      +(cmds.length?nxCard('c6','Outils','<div class="b" style="display:flex;flex-wrap:wrap;gap:8px">'+cmds.flatMap((g,gi)=>g.items.map((x,i)=>'<button class="nx-btn" data-fn="c'+gi+'_'+i+'">'+nxE(x.t)+'</button>')).join('')+'</div>'):'')+'</div></div></div>';
    const pg=nxPage(m,html); pg._fn.exp=()=>lbExport(); pg._fn.imp=()=>lbImportDlg(false);
    cmds.forEach((g,gi)=>g.items.forEach((x,i)=>{ pg._fn['c'+gi+'_'+i]=x.fn; })); }
};

/* ═══ Palette de recherche (⌘K) ═══ */
const PAL={on:false,items:[],sel:0,all:[]};
function nxPalIndex(){ const it=[];
  SG_DOM.forEach(d=>{ if(d.k!=='accueil') it.push({g:'Écrans',t:d.t,s:'Vue d’ensemble',ico:d.ico,run:()=>go('dom-'+d.k),q:d.t+' '+(d.d||'')});
    d.items.filter(x=>!x.hide&&nxCan(x.v)).forEach(x=>it.push({g:'Écrans',t:x.t,s:d.t,ico:x.ico||d.ico,run:()=>go(x.v),q:x.t+' '+d.t+' '+(NX_KW[x.v]||'')})); });
  [['Nouveau projet','plus',()=>editProject()],['Nouveau contact — société','plus',()=>editOwner(null,0)],['Nouveau contact — personne','plus',()=>editOwner(null,1)],
   ['Nouveau contrat d’honoraires','contrat',()=>go('fx-calchono','new')],['Nouvelle facture ou acompte','receipt',()=>go('fx-saisie','new')],['Saisir mon temps','timer',()=>go('h-saisie')],
   ['Nouvelle dépense','coins',()=>go('frais')],['Exporter la base de gestion','export',()=>lbExport()],['Importer une base de gestion','import',()=>lbImportDlg(false)],['Réduire / déployer le menu','side',()=>nxMini()],['Raccourcis clavier','cmd',nxKeysHelp]]
    .forEach(([t,ico,run])=>it.push({g:'Commandes',t,ico,run,q:t}));
  nxMenuCmds().forEach(m=>m.items.forEach(x=>it.push({g:'Commandes',t:x.t,s:m.t,ico:'cmd',run:x.fn,q:x.t+' '+m.t})));
  DS.all('project').forEach(p=>it.push({g:'Projets',t:p.TITLE||p.NUMBER,s:p.NUMBER,tag:projState(p),ico:'folder',run:()=>go('nx-projet',p.ID),q:(p.NUMBER||'')+' '+(p.TITLE||'')+' '+(p.LOCATION||''),w:+p.PROJECTSTATECODE===2?2:+p.PROJECTSTATECODE===5?0:1}));
  DS.all('staff').forEach(s=>it.push({g:'Équipe',t:staffName(s),s:s.INITIALS,ico:'users',run:()=>go('nx-collab',s.ID),q:staffName(s)+' '+(s.INITIALS||''),w:+s.ISACTIVE?2:0}));
  const loc={}; DS.all('contact').forEach(c=>{ if(!loc[c.CONTACTOWNER_ID]) loc[c.CONTACTOWNER_ID]=[c.LOCATION,c.EMAIL1].filter(Boolean).join(' '); });
  DS.all('contactowner').filter(o=>!+o.ISHIDDEN).forEach(o=>{ const n=ownerName(o); it.push({g:'Contacts',t:n,s:(loc[o.ID]||'').split(' ')[0],ico:o.TYPECODE===1?'person':'building',run:()=>go('nx-contact',o.ID),q:n+' '+(loc[o.ID]||''),w:1}); });
  const D=fxData(); if(D){ D.c.forEach(c=>it.push({g:'Facturation',t:'Contrat '+(c.affaire||'')+(c.nom?' — '+c.nom:''),s:c.projet||'',tag:c.annule?'annulé':c.signe?'signé':c.envoye?'envoyé':'',ico:'contrat',run:()=>go('fx-calchono','c:'+c.id),q:'contrat '+(c.affaire||'')+' '+(c.nom||'')+' '+(c.projet||''),w:c.annule?0:1}));
    D.f.forEach(f=>it.push({g:'Facturation',t:'Facture '+(f.num||''),s:fxClient(D,f),tag:f.statut||'',ico:'receipt',run:()=>go('fx-saisie','f:'+f.id),q:'facture '+(f.num||'')+' '+fxClient(D,f)+' '+(f.type||''),w:fxUnpaid(f)?2:0})); }
  it.forEach(x=>x.n=nxNorm(x.q)); return it; }
function nxPalSearch(q){ const qs=nxNorm(q).split(/\s+/).filter(Boolean);
  if(!qs.length){ const rec=nxLS.get('nx_recent3',[]).map(nxRef).filter(Boolean).map(r=>({g:'Récents',t:r.t,s:r.tag||r.sub,ico:r.ico,run:()=>nxOpenRef(r.k+':'+r.id)}));
    return [...rec,...PAL.all.filter(x=>x.g==='Commandes').slice(0,7),...PAL.all.filter(x=>x.g==='Écrans'&&x.s==='Vue d’ensemble')]; }
  const out=[]; for(const x of PAL.all){ if(!qs.every(w=>x.n.includes(w))) continue; const t=nxNorm(x.t+' '+(x.s||''));
    const sc=(t.startsWith(qs[0])?40:0)+(nxNorm(x.s||'').startsWith(qs[0])?30:0)+(x.n.split(/\s+/).some(w=>w.startsWith(qs[0]))?15:0)+(x.w||0)*5+({Écrans:12,Commandes:8,Projets:6,Facturation:5,Équipe:6,Contacts:0}[x.g]||0)-t.length/40;
    out.push([sc,x]); }
  out.sort((a,b)=>b[0]-a[0]); const per={}, res=[];
  out.forEach(([,x])=>{ per[x.g]=(per[x.g]||0)+1; if(per[x.g]<=(x.g==='Écrans'||x.g==='Commandes'||x.g==='Équipe'?6:8)) res.push(x); });
  const ord=['Récents','Écrans','Projets','Facturation','Contacts','Équipe','Commandes']; return res.sort((a,b)=>ord.indexOf(a.g)-ord.indexOf(b.g)); }
function nxPalDraw(){ const box=document.getElementById('nx-pres'); let g='', s='';
  PAL.items.forEach((x,i)=>{ if(x.g!==g){ g=x.g; s+='<div class="nx-pg">'+nxE(g)+'</div>'; }
    s+='<div class="nx-po'+(i===PAL.sel?' on':'')+'" data-i="'+i+'"><span class="ic">'+nxSvg(x.ico)+'</span><span class="t">'+nxE(x.t)+(x.s?'<span>'+nxE(x.s)+'</span>':'')+'</span>'+(x.tag?'<span class="k">'+nxE(x.tag)+'</span>':'')+'</div>'; });
  box.innerHTML=s||'<div class="nx-empty" style="padding:22px 18px">Aucun résultat.</div>'; const on=box.querySelector('.nx-po.on'); if(on) on.scrollIntoView({block:'nearest'}); }
function nxPal(){ const P=document.getElementById('nx-pal'); if(!NX.booted) return; closeMenus();
  PAL.all=nxPalIndex(); P.classList.add('on'); PAL.on=true; const i=document.getElementById('nx-pq'); i.value=''; PAL.items=nxPalSearch(''); PAL.sel=0; nxPalDraw(); setTimeout(()=>i.focus(),0);
  if(!FX.ready) fxEnsure().then(()=>{ if(PAL.on){ PAL.all=nxPalIndex(); PAL.items=nxPalSearch(i.value); nxPalDraw(); } }).catch(()=>{}); }
function nxPalClose(){ document.getElementById('nx-pal').classList.remove('on'); PAL.on=false; }
function nxPalRun(i){ const x=PAL.items[i]; if(!x) return; nxPalClose(); try{ x.run(); }catch(e){ console.error(e); toast('✗ '+(e.message||e),true); } }

/* ═══ Démarrage de la coquille ═══ */
(function(){
  document.getElementById('sg-logo').innerHTML=SG_LOGO+'<svg class="sig" viewBox="0 0 64 64">'+SG_SIGLE_PATH+'<rect x="48" y="49" width="7" height="7" fill="#fff266"/></svg>'; document.getElementById('sg-logo').onclick=()=>go('nx-home');
  const bl=document.getElementById('boot-logo'); if(bl) bl.innerHTML=SG_LOGO;
  document.getElementById('nx-qbtn').insertAdjacentHTML('afterbegin',nxSvg('search')); document.getElementById('nx-qbtn').onclick=()=>nxPal();
  document.getElementById('nx-nav').addEventListener('click',sgSideClick);
  const mb=document.getElementById('nx-minibtn'); mb.innerHTML=nxSvg('side'); mb.onclick=()=>nxMini();
  if(nxLS.get('nx_mini3',false)) document.getElementById('app').classList.add('nx-mini');
  const mq=matchMedia('(max-width: 1000px)'); const auto=()=>{ if(mq.matches) document.getElementById('app').classList.add('nx-mini'); else if(!nxLS.get('nx_mini3',false)) document.getElementById('app').classList.remove('nx-mini'); };
  mq.addEventListener('change',auto); auto();
  document.getElementById('nx-back').innerHTML=nxSvg('back'); document.getElementById('nx-fwd').innerHTML=nxSvg('fwd');
  document.getElementById('nx-back').onclick=()=>nxHist(-1); document.getElementById('nx-fwd').onclick=()=>nxHist(1);
  const nb=document.getElementById('nx-new'); nb.innerHTML=nxSvg('plus')+'Créer'; nb.onclick=()=>nxNewMenu(nb);
  const mo=document.getElementById('nx-more'); mo.innerHTML=nxSvg('more'); mo.onclick=()=>nxMoreMenu(mo);
  const ico=document.createElement('link'); ico.rel='icon'; ico.href='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#003346"/>'+SG_SIGLE_PATH+'<rect x="48" y="49" width="7" height="7" fill="#fff266"/></svg>'); document.head.append(ico);
  const pq=document.getElementById('nx-pq'), P=document.getElementById('nx-pal');
  pq.addEventListener('input',()=>{ PAL.items=nxPalSearch(pq.value); PAL.sel=0; nxPalDraw(); });
  pq.addEventListener('keydown',e=>{ if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); const n=PAL.items.length; if(n){ PAL.sel=(PAL.sel+(e.key==='ArrowDown'?1:-1)+n)%n; nxPalDraw(); } }
    else if(e.key==='Enter'){ e.preventDefault(); nxPalRun(PAL.sel); } else if(e.key==='Escape'){ e.preventDefault(); nxPalClose(); } });
  P.addEventListener('mousedown',e=>{ if(e.target===P) nxPalClose(); });
  document.getElementById('nx-pres').addEventListener('click',e=>{ const o=e.target.closest('.nx-po'); if(o) nxPalRun(+o.dataset.i); });
  document.getElementById('nx-pres').addEventListener('mousemove',e=>{ const o=e.target.closest('.nx-po'); if(o&&+o.dataset.i!==PAL.sel){ PAL.sel=+o.dataset.i; document.querySelectorAll('#nx-pres .nx-po').forEach((x,i)=>x.classList.toggle('on',i===PAL.sel)); } });
  document.addEventListener('keydown',e=>{ const mod=e.metaKey||e.ctrlKey, inField=e.target.closest&&e.target.closest('input,textarea,select,[contenteditable]');
    if(mod&&!e.altKey&&(e.key==='k'||e.key==='K')){ e.preventDefault(); e.stopPropagation(); PAL.on?nxPalClose():nxPal(); return; }
    if(PAL.on) return;
    if(mod&&e.key==='\\'){ e.preventDefault(); nxMini(); return; }
    if(e.altKey&&!mod&&(e.key==='ArrowLeft'||e.key==='ArrowRight')&&!inField&&!document.querySelector('.ov')){ e.preventDefault(); nxHist(e.key==='ArrowLeft'?-1:1); return; }
    if(e.key==='/'&&!mod&&!inField&&!document.querySelector('.ov')){ const se=document.getElementById('search'); e.preventDefault(); if(se&&!se.disabled) se.focus(); else nxPal(); } },true);
  new MutationObserver(nxSubSync).observe(document.getElementById('tools'),{childList:true,subtree:true});
  document.getElementById('main').addEventListener('click',e=>{ if(e.target.closest('table.g')) setTimeout(sgCtxSync,0); });
  document.getElementById('main').addEventListener('keyup',e=>{ if(/^Arrow/.test(e.key)) setTimeout(sgCtxSync,0); });
  document.getElementById('sg-ctx').addEventListener('click',e=>{ const b=e.target.closest('[data-ref]'); if(b) nxOpenRef(b.dataset.ref); });
  const ok0=NET.ok; NET.ok=function(){ try{ ok0.apply(this,arguments); }catch(_){} nxFoot(); };
  /* facturation préparée en arrière-plan après l'ouverture */
  window.addEventListener('load',()=>setTimeout(()=>{ if(!FX.p) fxEnsure().catch(()=>{}); },2500));
})();

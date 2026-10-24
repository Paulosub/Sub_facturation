
/* ═══ 22. Visuel de l'app (21.10.2026, demande de Paulo) ════════════════════════════════════════════════════════════════════════
   Six visuels, choisis poste par poste : « Charte Substances » (le visuel actuel, par défaut, inchangé) et les cinq propositions de
   refonte À L'ESSAI — « Papier et encre » (3), « Brume » (1), « Signalétique » (2), « Studio nocturne » (4), « Mac » (5, inspirée de macOS,
   23.10.2026) ; Paulo choisira ensuite le visuel définitif. Choix gardé dans localStorage `sg3_visuel` ; attribut data-visuel="<visuel>" sur <html> de la coquille ET du cadre
   Facturation (posé avant le premier affichage par VISUEL_SCRIPT de construire.py, puis tenu à jour ici) ; feuilles visuels_jetons.css,
   visuels.css, visuels_variantes.css (coquille, moteur) et fx_visuels.css (Facturation), dont toutes les règles sont limitées à cet
   attribut ; data-vdom = domaine de l'écran ouvert (carte pastel de Studio nocturne, couleur du domaine du visuel Mac). Icônes de chaque proposition (mêmes noms que NXI)
   à la place de celles de la charte. Réglages ▸ Visuel de l'app (nx-visuel), bouton du pied du menu (liste des visuels), ⌘K « Visuel ».
   Concaténé après sg3_plus.js par construire.py. */
NXI.visuel='<path d="M3 3H21V21H3Z"/><path d="M12 3V21"/><path d="M12 3H21V21H12Z" fill="currentColor" stroke="none"/>';
const SG_VISUELS=[['charte','Charte Substances','Le visuel actuel : menu bleu nuit, accents jaunes, Akkurat, filets noirs de 2 px.'],
  ['papier','Papier et encre','Proposition 3 : noir et blanc, filets fins, libellés en chasse fixe, une carte noire pour le chiffre clé, boutons en pilule, icônes au trait.'],
  ['brume','Brume','Proposition 1 : fond gris-bleu en dégradé, cartes de verre blanc arrondies, menu graphite, une seule couleur de données (vert d’eau), boutons en pilule.'],
  ['signaletique','Signalétique','Proposition 2 : crème, bandeaux noir et orange, gris béton, grands chiffres, angles vifs, données en chasse fixe ; aucun rouge, vert, jaune ni bleu.'],
  ['nocturne','Studio nocturne','Proposition 4 : thème sombre graphite, texte clair, une carte pastel pour le chiffre clé (rose, menthe, lavande selon le domaine), angles arrondis.'],
  ['mac','Mac','Proposition 5 : inspirée de macOS — police du Mac (San Francisco), menu flottant clair aux icônes de couleur comme les Réglages Système, bleu système, cartes blanches arrondies, contrôles segmentés, logo en icône d’app.']];
const SG_NXI_CHARTE=Object.assign({},NXI);
/* icônes de la proposition 3 : grille de 24, cercle de construction de 20, trait de 1,5, angles droits ou à 45° (planche « Système ») ;
   aussi celles de Signalétique, dessinées en bouts carrés et trait de 1,25 par visuels_variantes.css */
const SG_NXI_PAPIER=(()=>{ const ic={
    accueil:'<path d="M4 13L12 5L20 13"/><path d="M6 11V20"/><path d="M18 11V20"/>',
    projets:'<path d="M4 20V5H10L13 8H20"/><path d="M20 11V20H8"/>',
    heures:'<circle cx="12" cy="12" r="10"/><path d="M12 6V12H17"/>',
    minuteur:'<circle cx="12" cy="13" r="8"/><path d="M10 2H14"/><path d="M12 2V5"/><path d="M12 13L16 9"/>',
    contacts:'<circle cx="12" cy="8" r="4"/><path d="M3 21L8 16H16L21 21"/>',
    equipe:'<circle cx="7" cy="9" r="4"/><circle cx="17" cy="9" r="4"/><path d="M3 20H21"/>',
    chantier:'<path d="M7 21V5"/><path d="M3 6H21"/><path d="M7 12L13 6"/><path d="M18 6V11"/><path d="M3 21H11"/>',
    factures:'<path d="M5 3H19V21H5Z"/><path d="M9 8H15"/><path d="M9 12H15"/><path d="M9 16H13"/>',
    finances:'<path d="M5 19L19 5"/><path d="M9 5H19V15"/>',
    rh:'<path d="M4 4H20V20H4Z"/><circle cx="12" cy="10" r="3"/><path d="M8 17H16"/>',
    reglages:'<path d="M12 3V21"/><path d="M3 12H21"/><path d="M6 6L18 18"/><path d="M18 6L6 18"/>',
    rechercher:'<circle cx="10" cy="10" r="6"/><path d="M14 14L20 20"/>',
    creer:'<path d="M12 4V20"/><path d="M4 12H20"/>',
    pv:'<path d="M3 4H21V16H11L7 20V16H3Z"/>',
    documents:'<path d="M12 3L18 9L12 15L6 9Z"/><path d="M6 12L12 18L18 12"/><path d="M6 15L12 21L18 15"/>',
    coche:'<path d="M4 13L9 18L20 7"/>',
    gauche:'<path d="M15 5L8 12L15 19"/>', droite:'<path d="M9 5L16 12L9 19"/>',
    plus3:'<circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
    fleche:'<path d="M4 12H20"/><path d="M13 5L20 12L13 19"/>',
    page:'<path d="M6 3H15L19 7V21H6Z"/><path d="M15 3V7H19"/>',
    courriel:'<path d="M3 5H21V19H3Z"/><path d="M3 5L12 14L21 5"/>',
    envoyer:'<path d="M12 16V4"/><path d="M6 10L12 4L18 10"/><path d="M4 20H20"/>',
    recevoir:'<path d="M12 4V16"/><path d="M6 10L12 16L18 10"/><path d="M4 20H20"/>',
    filtre:'<path d="M3 6H21"/><path d="M6 12H18"/><path d="M9 18H15"/>',
    calendrier:'<path d="M3 5H21V21H3Z"/><path d="M3 9H21"/><path d="M8 3V7"/><path d="M16 3V7"/>',
    corbeille:'<path d="M4 7H20"/><path d="M6 7V21H18V7"/><path d="M9 3H15V7"/>',
    modifier:'<path d="M4 20H20"/><path d="M6 16L16 6L18 8L8 18Z"/>',
    favori:'<path d="M6 3H18V21L12 15L6 21Z"/>',
    imprimer:'<path d="M6 8V3H18V8"/><path d="M3 8H21V17H3Z"/><path d="M6 13H18V21H6Z"/>',
    telephone:'<path d="M5 3H10L12 9L9 12L12 15L15 12L21 14V19H16L5 8Z"/>',
    liste:'<path d="M4 6H20"/><path d="M4 12H20"/><path d="M4 18H20"/>',
    mallette:'<path d="M3 7H21V20H3Z"/><path d="M8 7V4H16V7"/><path d="M3 12H21"/>' };
  return { home:ic.accueil, folder:ic.projets, clock:ic.heures, timer:ic.minuteur, contacts:ic.contacts, person:ic.contacts, users:ic.equipe,
    group:ic.equipe, crane:ic.chantier, receipt:ic.factures, wallet:ic.finances, trend:ic.finances, rh:ic.rh, settings:ic.reglages, gear:ic.reglages,
    search:ic.rechercher, plus:ic.creer, pv:ic.pv, library:ic.documents, task:ic.coche, check:ic.coche, back:ic.gauche, prev:ic.gauche,
    fwd:ic.droite, next:ic.droite, more:ic.plus3, arrow:ic.fleche, pdf:ic.page, doc:ic.page, mail:ic.courriel, export:ic.envoyer,
    import:ic.recevoir, filter:ic.filtre, cal:ic.calendrier, trash:ic.corbeille, edit:ic.modifier, star:ic.favori, pin:ic.favori,
    print:ic.imprimer, phone:ic.telephone, list:ic.liste, briefcase:ic.mallette }; })();
/* icônes de la proposition 1 (Brume) : grille de 24, marge 2, trait de 1,5, bouts ronds, formes clés (planche « Système ») */
const SG_NXI_BRUME=(()=>{ const ic={
    accueil:'<path d="M4.5 11.5 12 4l7.5 7.5M6.5 10v10h11V10M10.25 20v-4.75h3.5V20"/>',
    projets:'<path d="M3 7.25A1.75 1.75 0 0 1 4.75 5.5h4.5L11.5 7.75h7.75A1.75 1.75 0 0 1 21 9.5v8a1.75 1.75 0 0 1-1.75 1.75H4.75A1.75 1.75 0 0 1 3 17.5Z"/>',
    heures:'<circle cx="12" cy="12" r="10"/><path d="M12 7v5l3.5 2"/>',
    contacts:'<rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="9" r="3"/><path d="M7.5 18.5c0-3 2-4.5 4.5-4.5s4.5 1.5 4.5 4.5"/>',
    chantier:'<path d="M5.5 14.5v-2a6.5 6.5 0 0 1 13 0v2M3 16h18M12 5.5v4"/>',
    equipe:'<circle cx="12" cy="8.5" r="3"/><path d="M6.5 19c0-3.5 2.5-5 5.5-5s5.5 1.5 5.5 5"/><path d="M17.5 5.5a2.5 2.5 0 0 1 0 5M19 13.5c1.8.6 3 2 3 4.5M6.5 5.5a2.5 2.5 0 0 0 0 5M5 13.5c-1.8.6-3 2-3 4.5"/>',
    honoraires:'<path d="M6.75 2.75h7.75L19 7.25v12.25a1.75 1.75 0 0 1-1.75 1.75h-10.5A1.75 1.75 0 0 1 5 19.5v-15a1.75 1.75 0 0 1 1.75-1.75Z"/><path d="M14.5 2.75v4.5H19M8.5 11.5h7M8.5 14.5h7M8.5 17.5h4"/>',
    finances:'<path d="M3 17.5l5.5-6 5 3L20 6.5"/><circle cx="20" cy="6.5" r="1.75" fill="currentColor" stroke="none"/>',
    rh:'<rect x="5.5" y="6" width="13" height="15.5" rx="2"/><circle cx="12" cy="3.75" r="1.75"/><circle cx="12" cy="11.5" r="2.25"/><path d="M8.5 17.5h7"/>',
    reglages:'<path d="M3 7h18M3 12h18M3 17h18"/><circle cx="15" cy="7" r="2.25" fill="currentColor" stroke="none"/><circle cx="8" cy="12" r="2.25" fill="currentColor" stroke="none"/><circle cx="17" cy="17" r="2.25" fill="currentColor" stroke="none"/>',
    rechercher:'<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/>',
    plus:'<path d="M12 6v12M6 12h12"/>',
    minuteur:'<circle cx="12" cy="13.5" r="8"/><path d="M10 2.75h4M12 2.75v2.75M12 13.5V9M18.5 7.5l1.5-1.5"/>',
    pv:'<rect x="5" y="4.5" width="14" height="17" rx="2"/><path d="M9 4.5v-1A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5v1Z"/><path d="M8.5 11h7M8.5 14.5h7M8.5 18h4"/>',
    documents:'<path d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h6l4 4v8.5a1.5 1.5 0 0 1-1.5 1.5H16"/><path d="M4.5 8.5A1.5 1.5 0 0 1 6 7h5.5l4 4v8.5A1.5 1.5 0 0 1 14 21H6a1.5 1.5 0 0 1-1.5-1.5Z"/><path d="M11.5 7v4h4"/>',
    taches:'<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M7.5 12.5l3 3 6-6.5"/>',
    gauche:'<path d="M14.5 6l-6 6 6 6"/>', droite:'<path d="M9.5 6l6 6-6 6"/>',
    plus3:'<circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
    coche:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    fleche:'<path d="M4 12h16M14 6l6 6-6 6"/>',
    cal:'<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M3 9.5h18M8 3v3M16 3v3"/>',
    signet:'<path d="M6.5 3.5h11v17l-5.5-4-5.5 4Z"/>',
    courriel:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 8l8.5 6 8.5-6"/>',
    telephone:'<path d="M5 3.5h4l1.5 4.5-2 1.5a11 11 0 0 0 6 6l1.5-2 4.5 1.5v4A1.5 1.5 0 0 1 19 20.5 16 16 0 0 1 3.5 5 1.5 1.5 0 0 1 5 3.5Z"/>',
    filtre:'<path d="M4 6h16M7 12h10M10 18h4"/>',
    liste:'<path d="M8 6.5h12M8 12h12M8 17.5h12"/><circle cx="4.25" cy="6.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="4.25" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="4.25" cy="17.5" r="1.1" fill="currentColor" stroke="none"/>',
    epingle:'<path d="M12 21v-5M8 16h8l-1-5.5 2-2.5V5H7v3l2 2.5L8 16Z"/>',
    corbeille:'<path d="M4 6.5h16M9.5 6.5V4h5v2.5M6.5 6.5l1 13h9l1-13M10 10.5v6M14 10.5v6"/>',
    modifier:'<path d="M4 20h4l11-11-4-4L4 16Z M13 7l4 4"/>',
    haut:'<path d="M12 19V5M6 11l6-6 6 6"/>', bas:'<path d="M12 5v14M6 13l6 6 6-6"/>',
    imprimer:'<path d="M7 9V4.5h10V9"/><rect x="3.5" y="9" width="17" height="8" rx="2"/><path d="M7 14h10v6H7z"/>',
    mallette:'<rect x="3.5" y="7" width="17" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3.5 12.5h17"/>' };
  return { home:ic.accueil, folder:ic.projets, clock:ic.heures, timer:ic.minuteur, contacts:ic.contacts, person:ic.contacts, users:ic.equipe,
    group:ic.equipe, crane:ic.chantier, receipt:ic.honoraires, wallet:ic.finances, trend:ic.finances, rh:ic.rh, settings:ic.reglages, gear:ic.reglages,
    search:ic.rechercher, plus:ic.plus, pv:ic.pv, library:ic.documents, task:ic.taches, check:ic.coche, back:ic.gauche, prev:ic.gauche,
    fwd:ic.droite, next:ic.droite, more:ic.plus3, arrow:ic.fleche, pdf:ic.honoraires, doc:ic.honoraires, mail:ic.courriel, export:ic.haut,
    import:ic.bas, filter:ic.filtre, cal:ic.cal, trash:ic.corbeille, edit:ic.modifier, star:ic.signet, pin:ic.epingle,
    print:ic.imprimer, phone:ic.telephone, list:ic.liste, briefcase:ic.mallette }; })();
/* icônes de la proposition 4 (Studio nocturne) : grille de 24, marge 2, trait de 1,5, bouts et joints ronds */
const SG_NXI_NOCTURNE=(()=>{ const ic={
    maison:'<path d="M4 12.5C4 8 7.6 4.5 12 4.5s8 3.5 8 8V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M10 20v-4.5a2 2 0 0 1 4 0V20"/>',
    dossier:'<path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h4.5l2 2H19a1.5 1.5 0 0 1 1.5 1.5V18a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18z"/>',
    horloge:'<circle cx="12" cy="12" r="9.25"/><path d="M12 7.5V12l3 2"/>',
    fiche:'<rect x="5" y="2.75" width="14" height="18.5" rx="2"/><circle cx="12" cy="9.5" r="2.5"/><path d="M8 17.5c0-2.5 1.8-4 4-4s4 1.5 4 4"/>',
    casque:'<path d="M5 15.5a7 7 0 0 1 14 0"/><path d="M3 15.5h18"/><path d="M10.5 9V6.5h3V9"/>',
    equipe:'<circle cx="12" cy="8" r="2.75"/><path d="M6.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><circle cx="5" cy="9.5" r="2"/><circle cx="19" cy="9.5" r="2"/><path d="M2.5 17c0-2 1.2-3.3 3-3.5M21.5 17c0-2-1.2-3.3-3-3.5"/>',
    facture:'<path d="M6 3.5h8l5 5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1z"/><path d="M14 3.5v5h5"/><path d="M8.5 13h7M8.5 16.5h7"/>',
    finances:'<path d="M3.5 18c2.5 0 3.5-8 6.5-8s3.5 5 6 4 3.5-7 4-7"/><circle cx="20" cy="7" r="1.75" fill="currentColor" stroke="none"/>',
    badge:'<rect x="5" y="7" width="14" height="14" rx="2"/><path d="M9.5 7V5a2.5 2.5 0 0 1 5 0v2"/><circle cx="12" cy="12.5" r="2"/><path d="M8.5 17.5h7"/>',
    curseurs:'<path d="M4 7h3M11 7h9M4 12h9M17 12h3M4 17h1M9 17h11"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="7" cy="17" r="2"/>',
    loupe:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 20.5 20.5"/>',
    plus:'<circle cx="12" cy="12" r="9.25"/><path d="M12 8v8M8 12h8"/>',
    minuteur:'<circle cx="12" cy="13.5" r="7.5"/><path d="M12 10v3.5l2.5 1.5M10 3.5h4M12 3.5V6M18.5 7.5l1.5-1.5"/>',
    pv:'<path d="M9 4.5H7a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6.5a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="3.5" rx="1"/><path d="M9 12h6M9 15.5h6"/>',
    documents:'<path d="M8.5 7V4.5a1 1 0 0 1 1-1H15l4.5 4.5V16a1 1 0 0 1-1 1h-1"/><path d="M5.5 7.5H12l3.5 3.5v9a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-11.5a1 1 0 0 1 1-1z"/><path d="M12 7.5V11h3.5"/>',
    tache:'<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M8 12.5l3 3 5.5-6"/>',
    gauche:'<path d="M14.5 6l-6 6 6 6"/>', droite:'<path d="M9.5 6l6 6-6 6"/>', fleche:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    courriel:'<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7.5l8 5.5 8-5.5"/>',
    plus3:'<circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
    cal:'<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    coche:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    recevoir:'<path d="M12 4v10M8 10l4 4 4-4M5 19h14"/>', envoyer:'<path d="M12 15V5M8 9l4-4 4 4M5 19h14"/>',
    modifier:'<path d="M4 20h4l10.5-10.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16z"/><path d="M13 7l4 4"/>',
    epingle:'<path d="M12 21s-6-5.5-6-10.5a6 6 0 0 1 12 0C18 15.5 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.25"/>',
    telephone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    imprimer:'<path d="M7 9V4.5h10V9"/><rect x="3.5" y="9" width="17" height="8" rx="2"/><path d="M7 14h10v6H7z"/>',
    corbeille:'<path d="M4.5 7h15M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>',
    liste:'<path d="M4 7h16M4 12h16M4 17h16"/>',
    filtre:'<path d="M4 6h16M7 12h10M10 18h4"/>',
    signet:'<path d="M6.5 3.5h11v17l-5.5-4-5.5 4Z"/>',
    mallette:'<rect x="3.5" y="7" width="17" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3.5 12.5h17"/>' };
  return { home:ic.maison, folder:ic.dossier, clock:ic.horloge, timer:ic.minuteur, contacts:ic.fiche, person:ic.fiche, users:ic.equipe,
    group:ic.equipe, crane:ic.casque, receipt:ic.facture, wallet:ic.finances, trend:ic.finances, rh:ic.badge, settings:ic.curseurs, gear:ic.curseurs,
    search:ic.loupe, plus:ic.plus, pv:ic.pv, library:ic.documents, task:ic.tache, check:ic.coche, back:ic.gauche, prev:ic.gauche,
    fwd:ic.droite, next:ic.droite, more:ic.plus3, arrow:ic.fleche, pdf:ic.facture, doc:ic.facture, mail:ic.courriel, export:ic.envoyer,
    import:ic.recevoir, filter:ic.filtre, cal:ic.cal, trash:ic.corbeille, edit:ic.modifier, star:ic.signet, pin:ic.epingle,
    print:ic.imprimer, phone:ic.telephone, list:ic.liste, briefcase:ic.mallette }; })();
/* icônes du visuel Mac (23.10.2026) : formes des symboles du Mac (maison, dossier, horloge, roue dentée des Réglages, carré à flèche du
   partage…), grille de 24, bouts et joints ronds ; dans le menu, en blanc sur le carré arrondi de couleur du domaine */
const SG_NXI_MAC=(()=>{ const ic={
    maison:'<path d="M3.5 11 12 3.8l8.5 7.2"/><path d="M5.5 9.6V19a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V9.6"/><path d="M10 20.5V15h4v5.5"/>',
    dossier:'<path d="M3 7.5a2 2 0 0 1 2-2h4.2a1.5 1.5 0 0 1 1.1.5l1.4 1.5H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M3 10.5h18"/>',
    horloge:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
    minuteur:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M10 2.5h4M12 2.5V5"/>',
    contact:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.3 18.3c1.2-1.9 3.3-3 5.7-3s4.5 1.1 5.7 3"/>',
    equipe:'<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19.5c0-3.2 2.4-5.4 5.5-5.4s5.5 2.2 5.5 5.4"/><path d="M15.8 5.6a3 3 0 0 1 0 5.8M17.2 14.2c2.2.5 3.6 2.4 3.6 5.3"/>',
    immeuble:'<path d="M4 20.5V7.5l6.5-3.5v16.5"/><path d="M10.5 9.5H18a2 2 0 0 1 2 2v9"/><path d="M2.5 20.5h19"/><path d="M6.8 10h1M6.8 13.5h1M6.8 17h1M14 13h1M17 13h1M14 16.5h1M17 16.5h1"/>',
    document:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/><path d="M8.5 12.5h7M8.5 16h7"/>',
    courbe:'<path d="M3.5 3.5v15a2 2 0 0 0 2 2h15"/><path d="M7.5 15l4-4.5 3 3L20 7.5"/>',
    fiche:'<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><circle cx="8.5" cy="11" r="2.2"/><path d="M5.3 16.2c.6-1.4 1.8-2.2 3.2-2.2s2.6.8 3.2 2.2M14.5 10h4M14.5 13.5h3"/>',
    roue:'<path d="M9.99 4.98 10.58 2.51 13.42 2.51 14.01 4.98 15.54 5.62 17.71 4.28 19.72 6.29 18.38 8.46 19.02 9.99 21.49 10.58 21.49 13.42 19.02 14.01 18.38 15.54 19.72 17.71 17.71 19.72 15.54 18.38 14.01 19.02 13.42 21.49 10.58 21.49 9.99 19.02 8.46 18.38 6.29 19.72 4.28 17.71 5.62 15.54 4.98 14.01 2.51 13.42 2.51 10.58 4.98 9.99 5.62 8.46 4.28 6.29 6.29 4.28 8.46 5.62Z"/><circle cx="12" cy="12" r="3.2"/>',
    loupe:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.3 15.3 5.2 5.2"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    presse:'<path d="M8.5 4.5H7a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6.5a2 2 0 0 0-2-2h-1.5"/><rect x="8.5" y="3" width="7" height="3.5" rx="1.2"/><path d="M9 11.5h6M9 15h6"/>',
    documents:'<path d="M8 7V5a2 2 0 0 1 2-2h5l4 4v9a2 2 0 0 1-2 2h-2"/><path d="M4.5 9a2 2 0 0 1 2-2h5l3.5 3.5V19a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2Z"/>',
    tache:'<circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.8 2.8L16 9.5"/>',
    coche:'<path d="M5 12.5 9.5 17 19 7"/>',
    gauche:'<path d="M14.5 5.5 8 12l6.5 6.5"/>', droite:'<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
    plus3:'<circle cx="12" cy="12" r="9"/><circle cx="8" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="1.1" fill="currentColor" stroke="none"/>',
    fleche:'<path d="M4.5 12h15M13.5 6l6 6-6 6"/>',
    page:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/>',
    enveloppe:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6.5L20.5 7"/>',
    partager:'<path d="M8.5 9H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1.5"/><path d="M12 14.5V3M8.5 6.5 12 3l3.5 3.5"/>',
    recevoir:'<path d="M8.5 9H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1.5"/><path d="M12 3v11.5M8.5 11l3.5 3.5 3.5-3.5"/>',
    filtre:'<path d="M4 7h16M7 12h10M10 17h4"/>',
    calendrier:'<rect x="3.5" y="4.5" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M8 3v3M16 3v3"/>',
    corbeille:'<path d="M4 6.5h16M9.5 6.5v-2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2M6 6.5l.9 12.6A2 2 0 0 0 8.9 21h6.2a2 2 0 0 0 2-1.9L18 6.5M10 10.5V17M14 10.5V17"/>',
    crayon:'<path d="M15.5 4.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/><path d="m13.5 6.5 3 3"/>',
    etoile:'<path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8Z"/>',
    punaise:'<path d="M9 3.5h6l-1 5 3 3.5H7l3-3.5Z"/><path d="M12 12v8.5"/>',
    imprimante:'<path d="M7 9V4.5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1V9"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14.5h10V20a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1Z"/>',
    telephone:'<path d="M6.6 3.5h2.6l1.6 4.2-2 1.4a11 11 0 0 0 6.1 6.1l1.4-2 4.2 1.6v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z"/>',
    liste:'<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="4.5" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="4.5" cy="17.5" r="1.2" fill="currentColor" stroke="none"/>',
    mallette:'<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8.5 7V5.5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2V7M3 12.5h18"/>' };
  return { home:ic.maison, folder:ic.dossier, clock:ic.horloge, timer:ic.minuteur, contacts:ic.contact, person:ic.contact, users:ic.equipe,
    group:ic.equipe, crane:ic.immeuble, receipt:ic.document, wallet:ic.courbe, trend:ic.courbe, rh:ic.fiche, settings:ic.roue, gear:ic.roue,
    search:ic.loupe, plus:ic.plus, pv:ic.presse, library:ic.documents, task:ic.tache, check:ic.coche, back:ic.gauche, prev:ic.gauche,
    fwd:ic.droite, next:ic.droite, more:ic.plus3, arrow:ic.fleche, pdf:ic.page, doc:ic.page, mail:ic.enveloppe, export:ic.partager,
    import:ic.recevoir, filter:ic.filtre, cal:ic.calendrier, trash:ic.corbeille, edit:ic.crayon, star:ic.etoile, pin:ic.punaise,
    print:ic.imprimante, phone:ic.telephone, list:ic.liste, briefcase:ic.mallette }; })();
const SG_NXI_JEUX={papier:SG_NXI_PAPIER, signaletique:SG_NXI_PAPIER, brume:SG_NXI_BRUME, nocturne:SG_NXI_NOCTURNE, mac:SG_NXI_MAC};
function sgVisuel(){ const v=nxLS.get('sg3_visuel','charte'); return SG_VISUELS.some(x=>x[0]===v)?v:'charte'; }
function sgVisuelNom(v){ const x=SG_VISUELS.find(y=>y[0]===v); return x?x[1]:v; }
/* attribut data-visuel d'un document (coquille ou cadre Facturation) : absent pour la charte */
function sgVisuelAttr(e,v){ if(!e) return; if(v&&v!=='charte') e.setAttribute('data-visuel',v); else e.removeAttribute('data-visuel'); }
/* cadre Facturation (document à part, écrit par fxEnsure) */
function sgVisuelCadre(){ const f=document.getElementById('fx-frame'); try{ sgVisuelAttr(f&&f.contentDocument&&f.contentDocument.documentElement,sgVisuel()); }catch(_){} }
/* jeu d'icônes du visuel + boutons de la coquille dessinés une seule fois au démarrage */
function sgVisuelIcones(){ const j=SG_NXI_JEUX[sgVisuel()]||{};
  Object.keys(SG_NXI_PAPIER).forEach(k=>{ NXI[k]=j[k]||SG_NXI_CHARTE[k]; });
  const set=(id,ico,txt)=>{ const b=document.getElementById(id); if(b) b.innerHTML=nxSvg(ico)+(txt||''); };
  set('nx-back','back'); set('nx-fwd','fwd'); set('nx-new','plus','Créer'); set('nx-more','more'); set('nx-minibtn','side'); set('sg-visuel','visuel');
  const q=document.querySelector('#nx-qbtn>svg'); if(q) q.outerHTML=nxSvg('search');
  try{ if(typeof sgVerrouAff==='function') sgVerrouAff(); }catch(_){} }
function sgVisuelBouton(){ const b=document.getElementById('sg-visuel'); if(!b) return;
  b.title='Visuel de l’app : '+sgVisuelNom(sgVisuel())+' — changer'; b.setAttribute('aria-label',b.title); }
/* domaine de l'écran ouvert (data-vdom) : la carte pastel de Studio nocturne et la couleur du domaine du visuel Mac en dépendent */
function sgVisuelDomaine(v){ try{ document.documentElement.setAttribute('data-vdom',nxDomVue(v)); }catch(_){} }
function sgVisuelAppliquer(v,redessiner){ if(!SG_VISUELS.some(x=>x[0]===v)) v='charte'; nxLS.set('sg3_visuel',v);
  sgVisuelAttr(document.documentElement,v); sgVisuelCadre(); sgVisuelIcones(); sgVisuelBouton();
  if(redessiner){ try{ sgSide(); }catch(_){} if(VIEW&&!/^fx-/.test(VIEW.id)) go(VIEW.id,VIEW.arg); } }
/* bouton du pied du menu : liste des visuels, celui du poste coché */
function sgVisuelMenu(b){ const a=sgVisuel();
  popMenu(b||document.getElementById('sg-visuel'),SG_VISUELS.map(([k,n])=>({t:n+(k==='charte'?'':' (à l’essai)'),chk:k===a,fn:()=>{ sgVisuelAppliquer(k,true); toast('Visuel : '+n+'.'); }}))
    .concat(['-',{t:'Comparer les visuels…',fn:()=>go('nx-visuel')}])); }
/* aperçus des visuels (Réglages) : couleurs et polices propres à chacun, quel que soit le visuel en cours (variable --s-font locale ;
   classe sg-vis-apercu : Studio nocturne n'inverse pas ces aperçus). « background: » écrit avec une espace : les règles qui reprennent
   les couleurs écrites dans le code (visuels.css) ne les touchent pas. */
function sgVisuelApercu(k){
  const mono=f=>'--s-font:'+f+';';
  if(k==='charte') return '<div class="sg-vis-apercu" aria-hidden="true" style="--s-font:\'SUB Akkurat\',Akkurat,Arial,sans-serif;display:flex;height:150px;border:1px solid #e3e3e0;background: #ffffff;overflow:hidden">'
    +'<div style="width:78px;background: #003346;padding:12px 9px;display:flex;flex-direction:column;gap:8px"><i style="display:block;height:7px;width:46px;background: #ffffff"></i><i style="display:block;height:5px;width:40px;background: rgba(255,255,255,.4);margin-top:6px"></i><i style="display:block;height:5px;width:50px;background: rgba(255,255,255,.4)"></i><i style="display:block;height:5px;width:36px;background: #fff266"></i><i style="display:block;height:5px;width:44px;background: rgba(255,255,255,.4)"></i></div>'
    +'<div style="flex:1;min-width:0;padding:11px 14px"><div style="font-size:9px;font-weight:700;color: #706f6f">Projets · Fiche projet</div><div style="font-size:14px;font-weight:700;color: #1d1d1b;margin:2px 0 8px">24ABC · Grange</div>'
    +'<div style="height:30px;background: #fef6b0;border-top:2px solid #1d1d1b;display:flex;align-items:center;padding:0 8px;gap:8px"><b style="font-size:13px;color: #003346">24ABC</b><i style="display:block;width:2px;height:16px;background: #1d1d1b"></i><span style="font-size:10px;font-weight:700;color: #1d1d1b">Transformation d’une grange</span></div>'
    +'<div style="display:flex;gap:12px;border-top:2px solid #1d1d1b;margin-top:10px;padding-top:6px"><div><div style="font-size:8.5px;font-weight:700;color: #1d1d1b">Heures saisies</div><div style="font-size:17px;font-weight:700;color: #1d1d1b">1\'842 h</div></div><div><div style="font-size:8.5px;font-weight:700;color: #1d1d1b">Phase actuelle</div><div style="font-size:13px;font-weight:700;color: #1d1d1b;margin-top:3px">Réalisation</div></div></div></div></div>';
  if(k==='brume'){ const f='Inter,-apple-system,\'Helvetica Neue\',Arial,sans-serif';
    return '<div class="sg-vis-apercu" aria-hidden="true" style="--s-font:'+f+';display:flex;height:150px;border:1px solid #c3cdd6;background: linear-gradient(160deg,#d6dee5,#c3cdd6);overflow:hidden;border-radius:14px">'
    +'<div style="width:78px;background: #15181d;border-radius:0 12px 12px 0;padding:12px 9px;display:flex;flex-direction:column;gap:8px"><i style="display:block;height:7px;width:40px;background: #ffffff;border-radius:3px"></i><i style="display:block;height:5px;width:40px;background: rgba(255,255,255,.35);margin-top:6px;border-radius:3px"></i><i style="display:block;height:12px;width:58px;background: rgba(255,255,255,.16);border-radius:6px"></i><i style="display:block;height:5px;width:44px;background: rgba(255,255,255,.35);border-radius:3px"></i></div>'
    +'<div style="flex:1;min-width:0;padding:11px 14px"><div style="font-size:9px;color: #46525f">Projets · Fiche projet</div><div style="font-size:14px;font-weight:600;color: #141a22;margin:2px 0 8px">24ABC · Grange</div>'
    +'<div style="display:inline-flex;gap:2px;padding:2px;border-radius:999px;background: rgba(255,255,255,.5);font-size:8px"><span style="background: #15181d;color: #ffffff;border-radius:999px;padding:2px 7px">Vue d’ensemble</span><span style="padding:2px 7px;color: #141a22">Contrat</span><span style="padding:2px 7px;color: #141a22">Heures</span></div>'
    +'<div style="display:flex;gap:8px;margin-top:8px"><div style="flex:1;background: rgba(255,255,255,.86);border-radius:12px;padding:6px 9px"><div style="font-size:7px;letter-spacing:.04em;color: #5b6775">HEURES SAISIES</div><div style="font-size:19px;font-weight:500;color: #141a22">1’842 h</div></div><div style="flex:1;background: rgba(255,255,255,.86);border-radius:12px;padding:6px 9px"><div style="font-size:7px;letter-spacing:.04em;color: #5b6775">PHASE ACTUELLE</div><div style="font-size:12px;font-weight:600;color: #17755e;margin-top:3px">Réalisation</div></div></div></div></div>'; }
  if(k==='signaletique'){ const jb=mono('\'JetBrains Mono\',Menlo,monospace');
    return '<div class="sg-vis-apercu" aria-hidden="true" style="--s-font:Archivo,\'Helvetica Neue\',Arial,sans-serif;display:flex;height:150px;border:1px solid #bfc4c4;background: #f3f1ea;overflow:hidden">'
    +'<div style="width:78px;background: #111111;padding:12px 9px;display:flex;flex-direction:column;gap:8px"><i style="display:block;height:7px;width:46px;background: #f3f1ea"></i><i style="display:block;height:5px;width:40px;background: #4a4a4a;margin-top:6px"></i><i style="display:block;height:12px;width:60px;background: #ff4d00"></i><i style="display:block;height:5px;width:44px;background: #4a4a4a"></i></div>'
    +'<div style="flex:1;min-width:0"><div style="background: #ff4d00;padding:8px 12px"><div style="'+jb+'font-size:7px;letter-spacing:.12em;color: #111111">PROJETS · FICHE PROJET</div><div style="font-size:15px;font-weight:700;letter-spacing:-.03em;color: #111111">24ABC · Grange</div></div>'
    +'<div style="background: #d5d9d9;padding:5px 12px;display:flex;align-items:baseline;gap:8px"><b style="font-size:24px;font-weight:400;letter-spacing:-.03em;color: #111111">24ABC</b><span style="'+jb+'font-size:7px;letter-spacing:.1em;color: #111111">RÉALISATION</span></div>'
    +'<div style="display:flex;gap:2px;margin:6px 12px 0"><div style="flex:1;background: #111111;padding:5px 8px"><div style="'+jb+'font-size:6.5px;letter-spacing:.12em;color: #bfc4c4">HEURES SAISIES</div><div style="font-size:15px;font-weight:700;color: #f3f1ea">1’842 h</div></div><div style="flex:1;background: #d5d9d9;padding:5px 8px"><div style="'+jb+'font-size:6.5px;letter-spacing:.12em;color: #4a4a4a">PHASE ACTUELLE</div><div style="font-size:11px;font-weight:700;color: #111111;margin-top:2px">Réalisation</div></div></div></div></div>'; }
  if(k==='nocturne'){ const f='Inter,-apple-system,\'Helvetica Neue\',Arial,sans-serif';
    return '<div class="sg-vis-apercu" aria-hidden="true" style="--s-font:'+f+';display:flex;height:150px;border:1px solid #303030;background: #141414;overflow:hidden;border-radius:12px">'
    +'<div style="width:78px;background: #1c1c1c;border-right:1px solid #303030;padding:12px 9px;display:flex;flex-direction:column;gap:8px"><i style="display:block;height:7px;width:40px;background: #ececec;border-radius:3px"></i><i style="display:block;height:5px;width:40px;background: #3a3a3a;margin-top:6px;border-radius:3px"></i><i style="display:block;height:12px;width:58px;background: #ececec;border-radius:6px"></i><i style="display:block;height:5px;width:44px;background: #3a3a3a;border-radius:3px"></i></div>'
    +'<div style="flex:1;min-width:0;padding:11px 14px"><div style="font-size:9px;color: #9a9a9a">Projets · Fiche projet</div><div style="font-size:14px;font-weight:600;color: #ececec;margin:2px 0 8px">24ABC · Grange</div>'
    +'<div style="display:flex;gap:4px;font-size:8px"><span style="background: #ececec;color: #111111;border-radius:999px;padding:2px 7px;font-weight:600">Vue d’ensemble</span><span style="background: #2c2c2c;color: #ececec;border-radius:999px;padding:2px 7px">Contrat</span><span style="background: #2c2c2c;color: #ececec;border-radius:999px;padding:2px 7px">Heures</span></div>'
    +'<div style="display:flex;gap:8px;margin-top:8px"><div style="flex:1;background: #f4c9d6;border-radius:12px;padding:6px 9px"><div style="font-size:7.5px;color: #3f3f3f">Heures saisies</div><div style="font-size:18px;font-weight:600;color: #111111">1’842 h</div></div><div style="flex:1;background: #242424;border-radius:12px;padding:6px 9px"><div style="font-size:7.5px;color: #9a9a9a">Phase actuelle</div><div style="font-size:12px;font-weight:600;color: #ececec;margin-top:3px">Réalisation</div></div></div></div></div>'; }
  if(k==='mac'){ const f='-apple-system,BlinkMacSystemFont,\'Helvetica Neue\',Arial,sans-serif', ico=c=>'<i style="display:block;width:10px;height:10px;border-radius:3px;background: '+c+';flex:none"></i>';
    const ln=(c,w,on)=>'<div style="display:flex;align-items:center;gap:5px;padding:3px 4px;border-radius:4px'+(on?';background: #007aff':'')+'">'+ico(c)+'<i style="display:block;height:4px;width:'+w+'px;border-radius:2px;background: '+(on?'rgba(255,255,255,.85)':'#c7c7cc')+'"></i></div>';
    return '<div class="sg-vis-apercu" aria-hidden="true" style="--s-font:'+f+';display:flex;gap:8px;height:150px;padding:6px;border:1px solid #e5e5ea;background: #f5f5f7;overflow:hidden;border-radius:12px">'
    +'<div style="width:76px;background: rgba(255,255,255,.85);border-radius:9px;box-shadow:0 0 0 .5px rgba(0,0,0,.1),0 2px 6px rgba(0,0,0,.06);padding:8px 5px;display:flex;flex-direction:column;gap:3px">'
    +'<div style="display:flex;align-items:center;gap:5px;margin:0 0 6px 2px"><i style="display:block;width:13px;height:13px;border-radius:4px;background: linear-gradient(170deg,#4a4a4e,#1c1c1e)"></i><i style="display:block;height:5px;width:34px;border-radius:2px;background: #1d1d1f"></i></div>'
    +ln('#007aff',30)+ln('#ff9500',26,true)+ln('#32ade6',34)+ln('#34c759',28)+ln('#af52de',24)+'</div>'
    +'<div style="flex:1;min-width:0;padding:5px 4px"><div style="font-size:9px;font-weight:500;color: #6e6e73">Projets · Fiche projet</div><div style="font-size:14px;font-weight:700;letter-spacing:-.02em;color: #1d1d1f;margin:1px 0 7px">24ABC · Grange</div>'
    +'<div style="display:inline-flex;padding:2px;border-radius:7px;background: rgba(118,118,128,.12);font-size:8px;font-weight:500;color: #1d1d1f"><span style="background: #ffffff;border-radius:5px;padding:2px 7px;box-shadow:0 1px 2px rgba(0,0,0,.14)">Vue d’ensemble</span><span style="padding:2px 7px">Contrat</span><span style="padding:2px 7px">Heures</span></div>'
    +'<div style="display:flex;gap:7px;margin-top:8px"><div style="flex:1;background: #ffffff;border-radius:9px;box-shadow:0 0 0 .5px rgba(0,0,0,.07),0 1px 3px rgba(0,0,0,.06);padding:6px 8px"><div style="font-size:7.5px;font-weight:600;color: #6e6e73">Heures saisies</div><div style="font-size:17px;font-weight:700;letter-spacing:-.02em;color: #1d1d1f">1’842 h</div><i style="display:block;height:3px;border-radius:2px;margin-top:3px;background: linear-gradient(90deg,#007aff 62%,#e5e5ea 62%)"></i></div>'
    +'<div style="flex:1;background: #ffffff;border-radius:9px;box-shadow:0 0 0 .5px rgba(0,0,0,.07),0 1px 3px rgba(0,0,0,.06);padding:6px 8px"><div style="font-size:7.5px;font-weight:600;color: #6e6e73">Phase actuelle</div><div style="font-size:12px;font-weight:600;color: #1d1d1f;margin-top:3px">Réalisation</div></div></div></div></div>'; }
  const gm=mono('\'Geist Mono\',Menlo,monospace');
  return '<div class="sg-vis-apercu" aria-hidden="true" style="--s-font:Geist,\'Helvetica Neue\',Arial,sans-serif;display:flex;height:150px;border:1px solid #D9D7D0;background: #ffffff;overflow:hidden">'
    +'<div style="width:78px;border-right:1px solid #D9D7D0;padding:12px 9px;display:flex;flex-direction:column;gap:8px"><i style="display:block;height:7px;width:46px;background: #0B0B0B"></i><i style="display:block;height:5px;width:40px;background: #D9D7D0;margin-top:6px"></i><i style="display:block;height:5px;width:50px;background: #D9D7D0"></i><i style="display:block;height:12px;width:60px;background: #0B0B0B"></i><i style="display:block;height:5px;width:44px;background: #D9D7D0"></i></div>'
    +'<div style="flex:1;min-width:0;padding:11px 14px"><div style="'+gm+'font-size:8px;letter-spacing:.1em;color: #6E6C66">PROJETS · FICHE PROJET</div><div style="font-size:14px;font-weight:600;letter-spacing:-.02em;color: #0B0B0B;margin:2px 0 8px"><span style="'+gm+'font-weight:500">24ABC</span> · Grange</div>'
    +'<div style="height:20px;background: #0B0B0B;display:flex;align-items:center;gap:12px;padding:0 8px;'+gm+'font-size:7.5px;letter-spacing:.1em;color: #BDBBB4"><span style="color: #ffffff;border-bottom:1px solid #ffffff">VUE D’ENSEMBLE</span><span>CONTRAT</span><span>HEURES</span></div>'
    +'<div style="display:flex;gap:8px;margin-top:10px"><div style="flex:1;background: #0B0B0B;padding:6px 8px"><div style="'+gm+'font-size:7px;letter-spacing:.1em;color: #BDBBB4">HEURES SAISIES</div><div style="font-size:16px;font-weight:600;color: #ffffff">1’842 h</div></div><div style="flex:1;border:1px solid #D9D7D0;padding:6px 8px"><div style="'+gm+'font-size:7px;letter-spacing:.1em;color: #6E6C66">PHASE ACTUELLE</div><div style="font-size:12px;font-weight:600;color: #0B0B0B;margin-top:2px">Réalisation</div></div></div></div></div>'; }
/* Réglages ▸ Visuel de l'app : ouvert à tous les profils (c'est un réglage de ce poste) */
{ const R=SG_D.reglages; if(R&&!R.items.some(x=>x.v==='nx-visuel')){ const it={v:'nx-visuel',t:'Visuel de l’app',ico:'visuel',d:'Apparence de l’app sur ce poste : charte Substances ou l’une des cinq propositions de refonte (à l’essai).'};
    R.items.splice(1,0,it); NX_VIEW['nx-visuel']={d:R,t:it.t,it}; }
  SG_VUE_DROIT['nx-visuel']=()=>true; }
VIEWS['nx-visuel']={ render(m){ const v=sgVisuel();
  const carte=([k,n,d])=>nxCard('c4',nxE(n)+(k===v?' <span class="nx-tag s2" style="margin-left:8px">sur ce poste</span>':''),'<div class="b">'+sgVisuelApercu(k)
    +'<p style="margin:14px 0 16px;line-height:1.5">'+nxE(d)+'</p>'+(k===v?'<button class="nx-btn" disabled>Visuel utilisé</button>':'<button class="nx-btn pri" data-vis="'+k+'">'+nxSvg('visuel')+'Utiliser ce visuel</button>')+'</div>');
  nxPage(m,'<div class="sg-split">'+sgIntro('Réglages','Visuel de l’app','Choisissez l’apparence de SUBGestion sur ce poste. Seul l’affichage change : données, documents PDF et impressions restent les mêmes. Le choix vaut pour ce navigateur ; chaque poste choisit le sien.')
    +'<div><div class="nx-grid">'+SG_VISUELS.map(carte).join('')+'</div><p class="nx-empty" style="padding-top:20px">Les cinq propositions de refonte sont à l’essai. Pour passer d’un visuel à l’autre : bouton '
    +'<span style="display:inline-flex;vertical-align:-3px;width:16px;height:16px">'+nxSvg('visuel')+'</span> du pied du menu, ou ⌘K « Visuel ».</p></div></div>');
  m.querySelectorAll('[data-vis]').forEach(b=>b.onclick=()=>{ sgVisuelAppliquer(b.dataset.vis,true); toast('Visuel : '+sgVisuelNom(b.dataset.vis)+'.'); }); } };
/* bouton du pied du menu, ⌘K, cadre Facturation, domaine de l'écran, application au démarrage */
{ const mb=document.getElementById('nx-minibtn'); if(mb&&!document.getElementById('sg-visuel')){ const b=h('button',{class:'nx-ico-btn',id:'sg-visuel',onclick:e=>sgVisuelMenu(e.currentTarget)}); mb.before(b); }
  const fx0=fxEnsure; fxEnsure=function(){ const p=fx0.apply(this,arguments); p.then(()=>sgVisuelCadre()).catch(()=>{}); return p; };
  const go0=go; go=function(v){ const r=go0.apply(this,arguments); sgVisuelDomaine(v); return r; };
  const pi0=nxPalIndex; nxPalIndex=function(){ const it=pi0.apply(this,arguments);
    SG_VISUELS.forEach(([k,n,d])=>{ const x={g:'Commandes',t:'Visuel : '+n+(k===sgVisuel()?' (actuel)':''),s:'Visuel de l’app',ico:'visuel',run:()=>{ sgVisuelAppliquer(k,true); toast('Visuel : '+n+'.'); },q:'visuel apparence theme graphisme '+n}; x.n=nxNorm(x.q); it.push(x); });
    return it; };
  sgVisuelAppliquer(sgVisuel(),false); if(typeof VIEW!=='undefined'&&VIEW) sgVisuelDomaine(VIEW.id); }

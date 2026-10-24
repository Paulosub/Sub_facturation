# Architecture détaillée

Sommaire : 1. Données et stockage · 2. Moteur DeltaSub · 3. Facturation · 4. SUBGestion 3 (référence) · 5. Constructeurs

## 1. Données et stockage

- Tout vit dans le navigateur. En `file://`, Chrome partage `localStorage` **et** IndexedDB entre tous les fichiers
  (vérifié) : `Facturation.html`, `DeltaSub.html` et les `SUBGestion*.html` d'un même Chrome voient les mêmes données.
- **Facturation** : `localStorage` `sa_*` (`sa_contrats`, `sa_factures5`, `sa_affaires`, `sa_heures`, `sa_collaborateurs`,
  `sa_adr`, `sa_pv_data`…) ; données de départ « cuites » dans le HTML (seed). Sauvegardes disque via
  `fact_backup_server.py` (port 7788, 127.0.0.1) ; export/import JSON `facturation_data_*.json`.
- **Moteur (DeltaSub)** : IndexedDB « DeltaSub », magasin `rec` clé `[t,id]` → `{t,id,s,v}` (index `t`), magasin `meta`
  (`info` {seq, source, imported}, `ids`, `tables`). Modèle = celui de Deltaproject : une collection par table Derby
  en minuscules (`project`, `contactowner`, `contact`, `staff`, `timelog`, `projectmember`, `projectphase`,
  `projectcost`, `projectcontract`, `costestimate`, `costcontrol`, `costplanning`, `modele`…), champs en MAJUSCULES.
  `CONTACTOWNER` = entité (personne : NAME1 nom, NAME2 prénom), `CONTACT` = adresse. ⚠ `TIMEMONTH`, `DATEMONTH`,
  `TARGETHOURS0..11` : mois **0 à 11**. `PROJECTSTATECODE` 1 Configuration · 2 En cours · 3 En attente · 4 Terminée · 5 Archivée.
- Clés de session : Facturation `sa_ui_state` ; v1 `sa_ui_state_sg` + `ds_view` ; v2 `nx_view`, `nx_pins`, `nx_recent`,
  `nx_open`, `nx_mini`, `nx_arg` ; v3 `sg3_view`, `nx_pins3`, `nx_recent3`, `nx_open3`, `nx_mini3`, `nx_arg3`, et
  Facturation embarquée `sa_ui_state_sg3`.

## 2. Moteur DeltaSub (`DeltaSub.html`, script unique `'use strict'`)

- Données : `DS.all(t)`, `DS.get(t,id)`, `DS.by(t,champ,valeur)` (index mis en cache), `DS.save(t,rec)`, `DS.del(t,id)`,
  `DS.commit(ops)`, `await DS.need([tables])` pour les collections lourdes (`HEAVY` : costestimate, costcontrol,
  costplanning, modele, modeledocument, image, arriereplan…), `DS.on(fn(tables))` pour réagir aux changements,
  `DS.seq`, `DS.linfo`. Import/export : `lbImport(file)`, `lbImportDlg(first)`, `lbExport()`.
- Navigation : `go(id, arg)` ; `VIEWS[id] = {render(main, arg, id), refresh(tables), leave(), tools(), search(q)}` ;
  `VIEW = {id, v, arg}` (vue courante) ; `NAV` (arbre d'origine, masqué dans SUBGestion).
- Composants : `h(tag, attrs, ...enfants)`, `esc`, `num(v, déc)` (1'234.50), `dfr` (JJ.MM.AAAA), `diso`, `today()`,
  `toast(msg, err)`, `dialog({title, body, buttons:[{t, pri, fn}]})`, `confirmDlg(msg)`, `popMenu(ancre, items)`,
  `closeMenus()`, `phead(boutons, {count, search})`, `grid(el, {cols, rows, sel, onSel, onDbl, sort})`, `ibtn({i,t,fn,menu})`,
  `icon(nom)` (jeu `ICO`, viewBox 16), `seg(libellés, actif, fn)`.
- Référentiels : `ME.u` / `ME.staff`, `staffName`, `staffList(tous)`, `ownerName`, `contactName`, `projLabel`, `projState`,
  `projMO`, `PSTATE`, `ROLES`/`teamRole`, `OWNER_T`, `ADR_T`, `tlDate`, `tlKey`, `dayKey`, `mondayOf`, `isoWeek`, `MOIS`,
  `MOISL`, `pcAmount` (frais).
- Fenêtres métier : `editProject(p?)`, `cfgMembers(p)`, `cfgPhases(p)`, `cfgActivities(p)`, `cfgRates(p)`,
  `cfgSubprojects(p)`, `editOwner(o?, type)`, `editContact(c?, owner)`, `editCost(r?, pre)`.
- Barre de menus d'origine (Fichier, Réglages, Aide) : `ch10aModel(ch10aCtx(false))` → éléments, `ch10aRun(action, arg)`.
- **Base du bureau (NAS, 07.10.2026)** : si la page est servie par `serveur_deltasub.py` (`/api/ping` → `bureau:true`),
  `dsBureau()` remplace les méthodes de `DS` par `DSB` (serveur partagé, conflits 409, `DS.poll` toutes les 4 s, comptes CH-08) ;
  tester avec `dsEstBureau()`. SUBGestion 3 : `SGKV` (fin de `sg3_plus.js`) synchronise les données Facturation (`/api/kv`).
  Installation et exploitation : `nas/LISEZMOI.md`. Test local : config `nas-test` (port 7796, base dans /tmp/nas_test).
- Restes « serveur » : verrous `POST /api/commit` (CH-10c), dépôt de fichiers `/api/file`, PDF `/api/pdf`, modèles
  `/api/modeles/zip` — inactifs en mode local (erreurs 501 en aperçu http : préexistantes).

## 3. Facturation (`Facturation.html`, script classique non strict)

- Panneaux `#panel-<onglet>`, `goTab(onglet)`, `goBack()`, `currentView`, `VIEW_PARENT`, `VIEW_TITLE`, en-tête `#hdr`.
- Onglets : `contrats`, `calchono` (calcul d'honoraires / contrat), `factures`, `saisie`, `cockpit`, `cockpit2`, `backup`,
  `pv-chantier`, `carnet`, `controle-cout`, `devis`, `feuille-heures`, `rapport`, `affaires`, `collaborateurs`, `heures`,
  `import-delta`, `analyse-globale`, `affaire-detail`, `collab-detail`, hubs `hub-*`, `home`.
- Globales : `contrats`, `factures` (`let`), `editContratCalc(id)`, `newContratCalc()`, `newFacture()`,
  `editFactureSaisie(id)`, `chConfirm`, `toast`, `uiSaveState`. Facture : `num`, `type`, `date`, `ech`, `statut`
  (`Payée`/`Impayée`…), `date_paiement`, `contrat_id`, `cl_nom`, `_ttc`, `_fttc`. Contrat : `id`, `affaire` (code = numéro
  d'affaire), `nom`, `projet`, `httc`, `envoye`, `signe`, `annule`, `termine`.
- Numéro de facture (21.10.2026) : `updateInvNum` ne numérote que les NOUVELLES factures ; facture déjà enregistrée
  (`faFactureEnregistree()`) : numéro et description gardés, un type choisi dans la liste ne change que le code final.
  Confirmations de suppression : `chMsgSupprContrat(c)` (contrats), `deleteFacture` (une seule facture retirée).
- Cockpits (21.10.2026) : plus de données écrites dans le code ; `ckCompute(Y)` (Cockpit) et `ck2Compute(Y)` (Cockpit analytique) partagent
  `ckBase()` {F factures comptées, parC facturé par contrat}, `ckFactOk`, `ckTTC`, `ckPayee`, `ckContratTTC`, `ckEnCours`, `ckEngage`,
  `ckReste`, `ckYM` — toute nouvelle carte doit passer par eux (mêmes chiffres partout). Couleurs d'années : `ckYC(y)`.

## 4. SUBGestion 3 (`subgestion3/`)

- `construire.py` : DeltaSub.html → feuille de style remplacée par `sg3.css`, cadre remplacé par la coquille (menu
  `#nx-side`, en-tête `#nx-head`, barre contextuelle `#nx-sub` contenant `#bar/#tools/#search`, `#body` avec `#main` et
  `#fx-layer`), `#top` et `#side` conservés mais masqués (le moteur y écrit). Facturation embarquée gzip + base64
  (`#fx-src`) avec `SG_EMBED`, sans `#hdr`, pont `goTab → parent.sgFxOnTab`. Logo : `logo_substances.svg` (`__LOGO__`).
- `sg3.js` :
  - `SG_DOM` = domaines `{k, t, ico, d, items:[{v, t, ico, d, hero?, reg?, hide?}]}` → menu (`sgSide`), en-tête
    (`sgNav`), vues d'ensemble `dom-<k>` (tuiles + chiffres `sgFigs(k)`), palette ⌘K (`nxPalIndex`). `NX_VIEW[v]` = {d, t, it}.
  - `go` enveloppé : historique (`NX.hist`, `nxHist(±1)`), arguments des fiches mémorisés (`nx_arg3`), `sgNav()`.
  - Écrans propres : `nx-home`, `dom-<k>`, `nx-projet` (arg = ID projet), `nx-contact` (ID entité), `nx-collab` (ID
    membre), `nx-data`. Aides : `nxPage(main, html)` (+ `data-go`, `data-ref="p:ID"`, `data-fn` → `page._fn`), `nxCard`,
    `nxKpi`, `nxBars`, `nxMiniBar`, `sgIntro`, `nxSvg(icône)` (jeu `NXI`, viewBox 24).
  - Facturation : vues `fx-<onglet>` créées pour chaque élément `v:'fx-…'` de `SG_DOM` ; arguments `new`, `c:<id>`,
    `f:<id>`, `sync` ; `fxEnsure()` (charge le cadre), `fxData()` → {c: contrats, f: factures}, `sgFxReload()`.
  - Barres d'outils : `ibtn` enveloppé (libellé `SG_LBL` sous l'icône ; masqué si la barre < 560 px via `@container`).
  - Favoris `nxTogglePin(k,id)`, récents `nxRecent`, menu réduit `nxMini()`.
  - Fonctionnement commun : `sgConfirm(message, onYes, opts)` et `sgAlert(m)` (fenêtres du moteur) ; dans le cadre,
    `toast`/`chConfirm`/`alert` de Facturation y sont redirigés (pont `FX_PONT` de `construire.py`) ; bouton « Fiche »
    `#sg-ctx` (`sgCtxSync`, `sgLigneRef` : ligne `tr[data-k]` reconnue comme projet / entité / membre).
  - Graphisme commun de Facturation : `subgestion3/fx_theme.css` (préfixe `html body`, `!important` contre les styles en
    ligne ; jamais `.offre-page` ni les aperçus PDF).
- `sg3_plus.js` (concaténé après `sg3.js`) : améliorations 1–10, chacune dans un bloc `/* ═══ N. … */`. Elles s'ajoutent
  en **enveloppant** les fonctions existantes (`go`, `grid`, `ibtn`, `popMenu`, `dialog`, `fxEnsure`, `nxFoot`, `sgSide`,
  `nxPalIndex`, `nxNewMenu`, `VIEWS[…].render`) : garder ce principe, une enveloppe = un `{ const x0=x; x=function(){…} }`.
  - Données propres : IndexedDB « SUBGestion » (`SGDB.get/put/cles`, magasins `reglages`, `fichiers`) ; serveur de
    sauvegarde `SG_SRV` (`sgSrv()` → `SAUV.srv`), routes `/gestion/sauver|liste|lire`, `/fichiers/ranger|lire`, `/html2pdf`.
  - Sauvegarde : `sgSauver(manuel)` (destination vérifiée d'abord), `sgSauvAJour()`, `sgSauvEchec()` (échec + modifications en attente →
    étiquette rouge du pied du menu, point « Sauvegarde en échec » de `sgATraiter`, carte d'accueil `#sg-at`), `sgSauvAff()`.
- `sg3_visuel.js` (bloc 22, après `sg3_plus.js`) : visuels de l'app à l'essai (`SG_VISUELS`, `sgVisuelAppliquer`, jeux d'icônes) ; feuilles
  `visuels_jetons.css`, `visuels.css`, `visuels_variantes.css`, `fx_visuels.css` (règles limitées à `html[data-visuel]`).
- `sg3_annuaire.js` (bloc 23) : Contacts ▸ Annuaire (`adr-entites`) ET Fiche contact (`nx-contact`) = même écran — fiche
  pleine page + liste escamotable (`SGA`, `sgaRendre`, `sgaFiche`, `sgaTiroir`, `sgaMenu`, `sgaSections`) ; styles `.sga-*` en fin de
  `sg3.css`. Les fonctions du moteur (editOwner, editContact, delOwner…) restent celles de DeltaSub.html.
- `sg3_affaire.js` (bloc 24) : `sgEpOrga(p,{numero,equipe})` — phases, activités et tarifs d'une affaire en tableaux modifiables
  sur place, sur brouillon (`brancher`, `valider`, `ops`, `majEquipe`, `majNumero`) ; styles `.sg-epo-*`. **Non branché** depuis le
  23.10.2026 (retiré de « Éditer l'affaire » à la demande) : gardé et testé pour d'autres chapitres, mode d'emploi en tête du fichier.
- `sg3_temps.js` (bloc 25) : chapitre Temps, visuel « épuré » — colonne des collaborateurs refaite (`sgtDecorer`, `sgtStats`,
  `sgtIni`, MutationObserver sur `#main`), lignes de total `.sgt-tot` ; styles `html[data-vdom="temps"]` et `.sgt-*` en fin de `sg3.css`.
- `sg3_controle.js` (bloc 26, en dernier) : Temps ▸ Contrôle des heures (`VIEWS['nx-controle']`, entrée de menu ajoutée après la Feuille
  d'heures, `SG_VUE_DROIT['nx-controle']`) — semaine | mois, par collaborateur | par projet (`sgcPeriode`, `sgcJours`, `sgcEngage`,
  `sgcCompte`, `sgcCellule`, `sgcEtatHtml`, `SGC_ETAT` : 0 Saisi et 2 Corrigé = à contrôler, 1 Refusé, 3 Approuvé), prévues `hrMaps`,
  approbation en bloc (`DS.commit` TIMELOGSTATECODE 3 après `sgConfirm`), redessin `dessiner()` / `refresh(ts)` ; fenêtre du moteur
  `ctlTimeCheck(p,o)` (DeltaSub.html) : sans affaire avec `o.staffs`, `o.peut(r)`, `o.staff`, `o.date`, `o.titre`, `o.boutons` ; sans
  options = fenêtre d'origine du Controlling. Réglages `sg3_controle` {mode, d, vue} ; styles `.sgc-*` en fin de `sg3.css`.
  - Clés : `sg3_sauvegarde`, `sg3_liens`, `sg3_heures_reprises`, `sg3_reunion`, `sg3_renta_tous`, `sg3_fiche_onglet`,
    `sg3_fiche_per`, `sg3_minuteur`, `sg3_acces` (+ `sessionStorage` `sg3_ouvert`).
  - Utiles : `sgRenta(p, fxData(), sgTaux())`, `sgContratsDuProjet(p, D)`, `sgProjetDuContrat(c)`, `sgInterne(p)`,
    `sgSaisieRapide({projet, staff, debut, fin})`, `sgAjouterFichiers(p)`, `sgVisionneuse(blob, nom)`, `sgDeverrouiller()`,
    `sgFinVerrou()` (montants à masquer), `sgLib(texte)` (Affaire → Projet), `sgDomDe(vue)` (clé du domaine :
    `NX_VIEW[v].d` est l'OBJET domaine).
  - pdf-lib vit dans le cadre Facturation (`FX.w.PDFLib`) : lui passer des tableaux du cadre (`w.Array.of(…)`,
    `new w.Uint8Array(…)`), sinon « must be of type Array ».

## 5. Constructeurs

Chaque `construire.py` fait des remplacements exacts (`remplacer(s, old, new, n)`), s'arrête avec un message si un point
d'ancrage a disparu (la source a changé), puis écrit le fichier généré à la racine. Après une modification de
`DeltaSub.html`, lancer les trois ; après `Facturation.html`, v1 et v3.

## 6. Profils d'accès, validation, CCT, contrats, RH, français seulement (07.10.2026)

- `sg3_plus.js` bloc 11 : `SG_DROITS` / `SG_DEFAUTS` (⚠ identiques à `serveur_deltasub.py`), `SG_ACC` (profil de la session,
  `/api/session` → `acces`), `sgDroit(k, niveau)`, `sgAdmin()`, `sgVueOk(v)` (menu, palette, et remplace `ch08bViewOk`
  quand les profils sont actifs), `sgMesProjets()`, `SG_COUTS` (`/api/couts`), validation (`sgEnAttente`, `sgDecider`,
  `nx-valider`, `sgFxValidation` dans le cadre), `nx-situation`, `nx-profils`, `sgCouleur`, `sgPvAuteur`.
  Bloc 12 : coût de revient (`sgCrParam`, `sgCrStaff`, `sgCrTout`, `nx-coutrevient`). Bloc 13 : CCT vaudoise (`SG_CCT`,
  `SG_FERIES_VD`, `sgFeriesVd`, `sgCctAnnee`, `sgCctAuto`, `nx-cct`, `sgBoucler`, `nx-bouclement`).
- Serveur NAS (`serveur_deltasub.py`, section « Profils d'accès SUBGestion ») : `sg_contexte(h, c)` (None = admin ou
  sans ouverture de session), `SG_IDX` (enregistrement → projet / collaborateur, tenu à jour dans `commit()`),
  `sg_garder` (filtre de `dump_json(…, garder=)`), `sg_refus_ecriture`, `sg_kv_lire` / `sg_kv_ecrire` (fusion hors
  périmètre, `_validation`), `sg_valider`, `sg_couts`. Collections réservées : `SG_T_TAUX`, `SG_T_SALAIRES`.
- Bloc 14 : contrats de travail (`sgCtrAll`, `sgCtrEnVigueur`, `sgOccAu`, `sgPreavis`, `sgDecompteSortie`, documents).
  Bloc 15 : domaine « Ressources humaines » (`SG_DOM` « rh », protégé par le code : « rh » dans `SG_ACC_DEF`, `rhVu`) —
  `sgEngagement`, `sgEngageAu`, `sgOccMois`, `sgRhEcheances`, `sgRhChiffres` (vue d'ensemble), `nx-occupation`.
  Bloc 16 : français seulement — `sgFrSeul(mode)` (« auto » au démarrage, « manuel » depuis Réglages ▸ Données),
  `sgFrReste()`, `sgSauverAvant(motif)` (NAS : `POST /api/sauvegarder` ; local : `sgSauver(true)`), `SG_FR_ADM_T` (comptes et
  fonctions sautés sans le droit « gestion des utilisateurs »), marque `sg_meta/francais`.
  Bloc 17 : apports de projets — `SG_COMM_DEF` / `sgCommDe` (paliers du contrat de travail, aussi `sgDocPc` / `sgDocMt` pour son
  texte), `sgCommCond(sid, date)`, `sgCommTaux`, `sgTravauxTTC(contrats)`, `sgApportCalc(a, D, taux)` (sur `sgRenta`),
  `sgApportsParStaff`, `sgApportSerie` + `sgCourbeCHF` (évolution), `nx-apports`, `sgApportDlg`, `sgVersementDlg` ;
  `sgATraiter` enveloppé (« Commissions d'apport à verser ») ; collection `sgapport` dans `SG_T_SALAIRES` du serveur.
- Contrôle des coûts (moteur) : éditeur `ccEditor` (sections `CC_SECS`, `draw()` par chapitre, état `CCV` ; `CCV.docs` = volet « Documents »
  d'une section, ouvert depuis le menu léger sous DOCUMENTS : `ch01aDocNode(s, side, redraw, CC_SEC_LIB[s])`, 13.10.2026), chapitre DOCUMENTS =
  `ccDocsDraw(pane,E,G)` + `CC_DOC_SOUS` (dépôt CH-03 : `ch03aDossier/ch03dCocoDossier`, `ch03aFichiers`, `ch03aDeposer`, `ch03aOuvrir`,
  `ch03aTelecharger`, `ch03cSupprimerDlg`, `ch03cSuivre`, lecture seule `ch03dLecture`) ; `G` = grille du menu Fonctions, tri/sélection
  dans `CCV.docsSt` / `CCV.docsSel` ; sans dépôt possible (`ch10cLocal()` sans `window.SG3_FICHIERS`) : lecture seule.
- Navigation SG3 (18.10.2026) : chapitre Affaires (`affd-*` = copies `Object.create` des écrans du moteur), Projets ▸ Mes projets =
  `nx-mesprojets` (liste) → `nx-pdom` (domaines en tuiles, puis domaine en pleine page via `domainView`) ; `sgCatProjet` (titre) pour
  les chiffres de la vue d'ensemble Projets (`VIEWS['dom-projets']` du bloc 20 : tuiles `SG_CATS`, ligne des tâches à carrés de couleur
  `.sg-pv-tch .k` / `.sg-patch` — vert ouvertes, rouge urgentes —, modules sans le groupe « Tâches »).
- Controlling des affaires (moteur, 18.10.2026) : `VIEWS['aff-controlling']` (liste | tuiles `CTL_TILES`, barre `tools()`), fenêtres
  `ctlTimeCheck` (agenda semaine en revue, `CTL_W`), `ctlCostCheck` (mois en revue, `CTL_F`), `ctlAnalyse(p,t)` (six listes, filtres, pied à
  trois menus) ; rapports `ctlSummary` / `ctlGroupRows` / `ctlSumCols`, `ctlReport` → `ctlJournal` / `ctlCostReport`, `ctlStaffReport`,
  `ctlDocHTML` ; statuts `ctlFlag`, commentaire `ctlComment(o,t)`, document d'analyse `ctlPrint` (modèle) ; `CT.live` + `DS.on` pour
  redessiner la fenêtre ouverte. Préfixe `ctl` (le préfixe `ct` appartient aux contrats).
- Appels d'offres (moteur, lot 3a `svd*`) : chapitres / articles libres (`svdChapterRuleLibre`, `svdResPos(ctx,{libre:true})`) et
  bibliothèque d'articles `svbiblio` (`SVB_T`, `svbUnit` = pseudo-unité, `svbMerge` / `svbSave` / `svbSaveSafe`, `svbFill`, `svbRemove`,
  `svbImportDlg` / `svbInsert`) ; catalogue « Perso » sur la bibliothèque par défaut. Menu « + » : Nouveau chapitre, Nouvel article,
  puis la réserve. Pas de numéro d'ordre ni de choix du standard (18.10.2026).
- Visionneuse SG3 `sgVisionneuse(blob, nom, {interne})` : liste blanche (PDF, images `<img>`, texte en cadre `sandbox`) ; HTML seulement
  `interne` (documents de l'app, `sgDocOuvrir`) en cadre `sandbox="allow-same-origin allow-modals"`. Ne jamais afficher un fichier
  déposé dans un cadre de même origine sans `sandbox` (il lirait la base et la session). `sgDossierLib(dossier)` = titre lisible.
- Sécurité de la version servie (10.10.2026) : bibliothèques PDF intégrées dans `Facturation.html` (blocs `data-vendor`, copies de
  référence dans `subgestion3/vendor/`, empreintes SHA-256 `VENDOR_SHA256` vérifiées par les deux `construire.py` ; pdf.js :
  `isEvalSupported:false` + worker partagé + `pdf.destroy()` après chaque aperçu), `nas/nettoyer.py` (`RETRAITS`, `RENOMMAGES`, `controle_traces`, `HOTES_ADMIS`), serveur `ip_client` / `acces_ok` /
  `relais_https`. Vérifier la page NETTOYÉE (et pas seulement la source) : sonde file:// + aperçu + balayage sur
  `/tmp/subgestion_apercu/SUBGestion3_nas.html`.
- Bloc 18 (13.10.2026, provisoire) : chapitres « Honoraires (ancien) » (`ancien`) et « Facturation (ancien) » (`ancienf`) — `SG_ANC`,
  `SG_ANC_CH`, `SG_ANC_THEMES` (champ `ch` : h / f), `SG_ANC_EQ`, `sgAncBandeau`, `sgAncChDe(vue)`, `sgAncProjet(domaine)` (liste des projets +
  `domainView`), vues `anc-*` (alias des vues du moteur par `Object.create`), `sgAncComparer(ch)` → `anc-comparer` / `ancf-comparer`
  (notes `sganalyse`). Bloc 19 : clic droit — `sgMenuAt(x, y, items, ligne)`, `sgMenuPanneau(items)` (items `{t, fn, dis, chk, danger,
  sub}`), `sgCtxMenuDe(cible)`, `sgCtxBarre`, `sgCtxBoutons`, `sgCtxActionsLigne`, `sgCtxRef`, `sgCtxCopie`, `sgCtxCadre(w)` ; `ibtn`
  enveloppé (`el._sgB` = définition du bouton) ; `closeMenus` enveloppé (retire le contour de la ligne).
- 19.10.2026 (`sg3_plus.js`) : vue d'ensemble Projets — menu déroulant « Tâches » (`.sg-pv-tk`, tuiles comme les modules, pastilles
  `sg-pt` verte / rouge, listes En cours / Urgent / Réglé) ; collaborateur : `sgCollabSeul()`, `SG_ETATS_COLLAB` (projets en cours seulement),
  `SG_ONGLETS_COLLAB` (onglets du tableau de bord) ; `sgPhaseActuelle(p)` / `sgPhaseLib` (phase d'après la feuille d'heures) ;
  `sgPhasesGraph(p)` (Vue d'ensemble : heures prévues / effectuées, échelle `sgEchelle`, libellés `sgPhNom`) ; `sgMoisGraph(months)` (heures par mois en HTML, moyenne) ; `sgHr` (heures entières) ; `sgContratParPhase(p)` (contrat HT / TTC par phase SIA, `sgSiaGroupe`) ;
  onglet « Phases contrat » (`dessiner(C)` dans `sgOnglet`, marge, honoraires / h, coût de revient / h, comparaison `.sg-db`) ;
  `sgMargeVisible`, `sgMargePct` ; « Français seulement » sans confirmation (`sgFrSeul`) ; `sg3.js` : dernier écran rouvert avec son
  paramètre (`sg3_vue_arg`).
- Bloc 21 (20.10.2026) : page du projet ▸ modules **Projet** et **Faisabilité** (`SG_PMOD`, `SG_PMOD_G`, `sgPdomModules`, `sgPdomModuleCompte`,
  `sgPdomModulePage` → `sgOnglet(p,'projet'|'faisa')`, arg `<id>|Projet|<rubrique>`) ; **Parcelle & règlements** `nx-faisa` (arg = ID projet) :
  collections `sgfaisa` (ID = ID projet) et `sgfaisatexte` (`<projet>:<source>`, dans `HEAVY`), `sgFzRec` / `sgFzSave`, relais `sgFzRelais` /
  `sgFzFetch` (direct pour *.geo.admin.ch), `sgFzChercherAdresse`, `sgFzIdentify`, `sgFzParcelle`, `sgFzGeoAdmin` (`SG_FZ_COUCHES`), `sgFzRdppf`
  (XML OeREB 2.0 : `sgFzXe/Xc/Xt/Lt`), `sgFzDocsRdppf`, `sgFzTelecharger(Dlg)`, `sgFzTraiterPdf` (dépôt `Faisabilité/Règlements` + `sgFzPdfTexte`
  par pdf.js du cadre), `sgFzArticles`, `sgFzScanner` / `sgFzPreRemplir` (`SG_FZ_MOTS`, `SG_FZ_RDPPF_TH`), `sgFzRechercher`, `sgFzContrainteDlg`,
  `sgFzDessiner`, `sgFaisaFiche` (document `SG_FZ_DOC_CSS` → `sgDocOuvrir`). Serveurs : `proxy_lire` + `/proxy` (fact_backup_server.py) et
  `/api/proxy` (serveur_deltasub.py), jumeaux ; `sg_refus_ecriture` : `sgfaisa` / `sgfaisatexte` = règle de `depotfichier`.
- Moteur : `nmFr`, `trFr`, `TRAD_FR` (français seulement) ; `frSeulOps()` → {ops, n} et `frSeul(ops)` (lots de 400) :
  nettoyage de la base (libellés, modèles, documents types, gabarits, catalogues ; `FR_CAT_DE` / `FR_CAT_NOM` pour eBKP-T) ;
  `holidayDate` TYPECODE 3 = Lundi du Jeûne fédéral ;
  `pubHolidays(y)`, `hrMaps`, `hrHoliday`, `targetFor` (soldes d'heures et de vacances, sémantique Deltaproject :
  `TARGETTIMEREDUCTION` = report d'heures sup., `HOLIDAYBALANCE` = droit de `HOLIDAYBALANCEYEAR`).

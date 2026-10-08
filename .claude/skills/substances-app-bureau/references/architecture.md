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
- Moteur : `nmFr`, `trFr`, `TRAD_FR` (français seulement) ; `frSeulOps()` → {ops, n} et `frSeul(ops)` (lots de 400) :
  nettoyage de la base (libellés, modèles, documents types, gabarits, catalogues ; `FR_CAT_DE` / `FR_CAT_NOM` pour eBKP-T) ;
  `holidayDate` TYPECODE 3 = Lundi du Jeûne fédéral ;
  `pubHolidays(y)`, `hrMaps`, `hrHoliday`, `targetFor` (soldes d'heures et de vacances, sémantique Deltaproject :
  `TARGETTIMEREDUCTION` = report d'heures sup., `HOLIDAYBALANCE` = droit de `HOLIDAYBALANCEYEAR`).

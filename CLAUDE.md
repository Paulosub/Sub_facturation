# Application de facturation — Substances Architectes

Application de facturation et de gestion d'honoraires pour le bureau
Substances Architectes (Paulo, paulo@substances.ch). Interface en français,
montants en CHF, TVA suisse.

## Architecture

- **`Facturation.html`** — TOUTE l'application : une seule page HTML autonome
  (~4 Mo) contenant le CSS, le JavaScript (~400 fonctions) et les gabarits.
  Elle s'ouvre directement dans le navigateur, sans build ni dépendance.
- **Les données ne sont PAS dans le fichier HTML** : elles vivent dans le
  `localStorage` du navigateur, sous des clés préfixées `sa_`
  (`sa_contrats`, `sa_factures5`, `sa_affaires`, `sa_heures`,
  `sa_collaborateurs`, `sa_phases_pct_migrated`, etc.).
- **`fact_backup_server.py`** — petit serveur local (port 7788, 127.0.0.1
  uniquement) qui permet à l'app d'écrire de vraies sauvegardes `.json` sur le
  disque (export/import + sauvegarde automatique), dossier de base :
  « Sauvegarde Facturation » dans ce dossier. Sur le Mac Studio de l'atelier,
  il démarre automatiquement à l'ouverture de session via
  `~/Applications/Serveur Sauvegarde Facturation.app` (élément d'ouverture) ;
  sinon : `python3 fact_backup_server.py` ou `Lancer_serveur_sauvegarde.command`.
  NB : ce dossier est un partage réseau (NAS) — macOS refuse l'accès aux
  processus d'arrière-plan (LaunchAgent impossible, l'app de démarrage doit
  rester en mode visible) et l'aperçu intégré de Claude ne peut pas écrire
  directement dans les dossiers (le bouton 📁 de l'app ne marche que dans un
  vrai Chrome/Edge/Arc/Brave).
- **`serve.py` / `serve_facturation.py`** — petits serveurs HTTP pour servir
  la page localement si besoin.

## DeltaSub — app séparée, reproduction de Deltaproject

**Totalement indépendante de `Facturation.html`** (ne jamais fusionner les deux fichiers sources : l'assemblage
se fait uniquement en construisant `SUBGestion.html`, voir plus haut).

- **`DeltaSub.html`** — l'app (fichier autonome). Modules : Adresses, Affaires (Gestion,
  Controlling, Mes affaires, Toutes les affaires), Collaborateurs, Notes de frais, Heures,
  Bâtiment (Devis, Contrôle des coûts, Planification), Management, Administrateur.
- **Sans serveur, pour Paulo seul (décision du 06.10.2026)** : `DeltaSub.html` s'ouvre directement dans Chrome
  (double-clic, `file://`) ; les données vivent dans le navigateur (IndexedDB « DeltaSub », couche `LDB` + `DS`).
  Base vide → écran « Importer une base … » ; sauvegarde : Fichier ▸ Exporter la base locale (`.json.gz`) ;
  restauration : Fichier ▸ Importer une base (REMPLACE la base locale).
  Reprise depuis l'ancienne base : `python3 outils_deltaproject/exporter_base_deltasub.py [<base.sqlite>]` → `.json.gz`.
  **Verrous d'ouverture (07.10.2026)** : en base locale, les verrous des descriptifs, contrôles des coûts et planifications
  (CH-10c, `documentlock`) sont tenus en mémoire de l'onglet (`ch10cLocal()`, plus aucun `POST /api/commit` : la page HTML
  renvoyée à la place du JSON donnait « Ouverture impossible : Unexpected token '<' ») ; verrous hérités d'un autre poste
  (`documentlock`, `devisdocument.LOCKUSERID`) ignorés. Annexes (« Ouvrir / Afficher l'annexe ») → serveur de sauvegarde
  7788 (`/openpath`, `/revealpath`) ; import des modèles .zip → message clair (demande l'ancien serveur).
  Encore à rendre autonomes dans DeltaSub.html seul (déjà faits dans SUBGestion 3) : dépôt de fichiers et PDF (`/api/file`,
  `/api/pdf`) ; et partout : import des modèles (.zip), mots de passe / sessions (CH-08), manuel PDF. Aucun « lien CRB ».
- **`serveur_deltasub.py`** — base partagée (SQLite, port 7790) : reprise Deltaproject (`--importer-deltaproject`) et
  **base du bureau sur le NAS (07.10.2026)**. Base de test : `DELTASUB_DB` ; NAS : `DELTASUB_PAGE` (page servie à « / »,
  `SUBGestion3.html`), `DELTASUB_APP` (dossier des pages), `DELTASUB_SAUVEGARDES`. Ajouts : `/api/ping` → `bureau:true`,
  `/api/kv` (données Facturation partagées, version par clé, 409 si dépassée), `/api/import` (base vide, ou `?remplacer=1`),
  `/api/export` (.json.gz + `kv`), `/fichiers/ranger|lire` (dépôt CH-03 par empreinte).
- **Deux modes, choisis au démarrage** (`dsBureau()`, `dsEstBureau()`) : page servie par ce serveur → méthodes `DSB`
  (snapshot, commit avec conflits 409, `DS.poll` 4 s, comptes CH-08) ; double-clic ou serveur statique → base locale `LDB`.
  SUBGestion 3 (`sg3_plus.js`, fin) : `SGKV` synchronise les clés `sa_*` (+ `sg3_liens`, `sg3_heures_reprises`) — envoi sur
  l'événement `storage` du cadre Facturation, relevé 5 s, fusion à trois par élément (`id`/`num`/`code`), bandeau
  « Actualiser » ; fichiers joints sur le serveur ; sauvegardes = celles du serveur. Installation : `nas/LISEZMOI.md`,
  `nas/preparer.sh`, `nas/docker-compose.yml` (Container Manager, réseau host, python:3.12-slim).
  **Version servie nettoyée + accès protégé (07.10.2026)** : `nas/preparer.sh` passe la page par `nas/nettoyer.py` (données de
  départ de Facturation retirées, cockpit anonymisé, commentaires retirés, mentions Deltaproject / DeltaSub / DELTA… / eCCC /
  CRB / CAN renommées — SIA et CFC gardés ; arrêt si un reste ou un nom de client subsiste) ; ne jamais copier les sources
  telles quelles sur le NAS. **Traces et échanges (10.10.2026)** : `nettoyer.py` retire aussi de la version servie les entrées
  SIA451 / `.deltakv` / `.dpdoc` / `manual_fr` (`RETRAITS`), renomme les noms internes du code (`RENOMMAGES` : ecaIsCrb, svCondNpk,
  delta*, …), force `FR_CAT_SANS_FR='supprimer'` (catalogue étranger sans équivalent français supprimé par « Français
  seulement »), puis contrôle (`controle_traces`) qu'il ne reste aucune trace hors `TRACES_ADMISES` (noms du schéma) et aucun
  site externe hors `HOTES_ADMIS` (w3.org, 127.0.0.1, localhost, map.search.ch) ; les blocs `data-vendor` sont intacts.
  Serveur (`DELTASUB_PAGE` ≠ DeltaSub.html) : sans session et mode mot de passe actif → page de
  connexion `LOGIN_PAGE` à la place de l'app ; `/api/export` et `/api/import` réservés à `userAdmin` (`nas_admin`) ; ping sans
  chemin ; en-tête `Server: SUBGestion`. SUBGestion 3 en http:// : `sgSha` / `sgHacher` ont un repli JavaScript (pas de
  crypto.subtle hors contexte sécurisé).
  **HTTPS (07.10.2026)** : `https://gestion.substances.ch:7443` — certificat Let's Encrypt RSA (DNS-01 Infomaniak, conteneur
  `subgestion-certificat` = acme.sh, jeton dans `subgestion/certificats/infomaniak.env`, jamais dans git) ; serveur :
  `DELTASUB_TLS_CERT|KEY|PORT`, `DELTASUB_URL` → HTTPS servi par `ServeurTLS` (négociation dans le fil de la requête,
  certificat rechargé toutes les 6 h), HTTP → 308 vers l'adresse https, cookie Secure, HSTS ; `lan_ok` accepte aussi
  100.64.0.0/10 (Tailscale). ⚠ Le Python du Mac (LibreSSL 2.8) ne gère pas les certificats EC : garder RSA.
  **Relais local (10.10.2026)** : requête reçue de 127.0.0.1 (`relais_local`) = Tailscale serve ou proxy DSM → adresse réelle =
  DERNIÈRE de `X-Forwarded-For` (`ip_client`), refus de l'internet public et de Tailscale Funnel (`acces_ok`), cookie « Secure »
  si le relais est en HTTPS (`relais_https`), pas de renvoi vers gestion.substances.ch (`_vers_https`).
  **Hors du bureau (10.10.2026)** : Tailscale (réseau « paulosub.github », `tail7f12b9.ts.net`, HTTPS activé) — NAS =
  machine `nas-substances` ; app **https://nas-substances.tail7f12b9.ts.net** (relais `tailscale serve --bg 7790`, tâche DSM
  « Tailscale serve SUBGestion » au démarrage) ; partage `smb://nas-substances.tail7f12b9.ts.net/subgestion` (déploiement
  `nas/preparer.sh` depuis le MacBook) ; détails dans `nas/LISEZMOI.md`. Icône SUBGestion dans DSM : paquet `nas/paquet_dsm/`
  (`construire.sh` → `nas/a_copier/SUBGestion.spk`, installation manuelle ; la page `ui/index.html` choisit l'adresse de l'app).
- **Modèle de données = celui de Deltaproject** : une collection par table Derby, en
  minuscules (`project`, `contact`, `contactowner`, `staff`, `timelog`…), champs en
  MAJUSCULES comme les colonnes. Côté page : `DS.all(t)`, `DS.get(t,id)`, `DS.by(t,champ,v)`,
  `DS.save(t,rec)`, `DS.commit(ops)` (base locale : un seul poste, plus de conflits).
  ⚠ `TIMELOG.TIMEMONTH`, `DATEMONTH`, `TARGETHOURS0..11` : mois **0 à 11**.
  `CONTACTOWNER` = entité (personne : NAME1 = nom, NAME2 = prénom), `CONTACT` = adresse.
- **Reprise des données Deltaproject** (lecture seule, depuis la dernière sauvegarde
  nocturne de `/Volumes/SUBSTANCES/Deltaproject/Backup/`) :
  `outils_deltaproject/importer_dans_deltasub.sh` (REMPLACE les données DeltaSub, **sauf** les
  collections `PROTECTED` de `serveur_deltasub.py` — honoraires, contrats, factures, encaissements,
  QR, avancement, tâches — saisies dans DeltaSub : elles sont gardées, seuls les enregistrements
  manquants sont ajoutés).
  **Collections propres à SUBGestion (18.10.2026)** : `import_deltaproject` (`--importer-deltaproject … --force`, ce script,
  `reprise_subgestion.py`) ne remplace QUE les collections qu'alimente l'extraction (`collections_extraction` : tables de
  `schema.txt` en minuscules — vides et `SKIP_TABLES` comprises —, CSV, collections de `documents/*.json`). Toute autre
  collection (`sgapport`, `sgcontrattravail`, `sgcoutrevient`, `sgbouclement`, `sgacces`, `sganalyse`, `sgfaisa`, `sgfaisatexte`, `sg_meta`, et toute
  nouvelle collection de l'app) est gardée telle quelle, compteur `next_id:` compris, et listée en fin de reprise (meta
  `import_deltaproject` ▸ `propres`). Tables du schéma : inchangé (une table vide dans Deltaproject vide la collection).
  Documents convertis : `image` et `arriereplan` sont `PROTECTED_IF_EDITED` (logos ajoutés, arrière-plans dupliqués ou
  modifiés dans l'app gardés) ; `modeledocument` reste remplacé (seul « Français seulement » le retouche).
  ⚠ Une collection écrite par l'app sous le nom d'une table Deltaproject reste remplacée : l'ajouter à `PROTECTED` ou
  `PROTECTED_IF_EDITED`. Test : base temporaire `DELTASUB_DB` + mini-extraction (schema.txt, tables/APP.*.csv, documents/).
  Les outils utilisent le Java embarqué dans `/Applications/DELTAproject.app`.
- **Reprise de TOUTES les données Deltaproject dans SUBGestion (base locale du navigateur), sans perdre les saisies** :
  `python3 outils_deltaproject/reprise_subgestion.py` (06.10.2026). 1) SUBGestion ▸ Réglages ▸ Données & sauvegarde ▸
  Exporter ; 2) le script (au bureau, volume SUBSTANCES monté : dernière sauvegarde de /Volumes/SUBSTANCES/Deltaproject/Backup,
  ou `--extraction`/`--sauvegarde`) ; 3) Importer `deltasub/subgestion_reprise_*.json.gz`. Provenance déduite de la version `s`
  (plage de la reprise précédente : marque `sg_meta/import` {SEQ_DEBUT, SEQ_FIN}, sinon copie « Sauvegarde DeltaSub »), puis
  `import_deltaproject(force)` sur une base SQLite temporaire ; saisies locales effacées et absentes de Deltaproject → rétablies,
  saisies remplacées → `…_remplaces.json`. Les verrous (`documentlock`) ne sont jamais repris. `deltasub/` est ignoré par git.
- Cahier des charges : `ANALYSE_DELTAPROJECT.md` + manuel `rsrc/help/manual_fr.pdf` de l'app.

## SUBGestion — app unique (Facturation + tous les modules DeltaSub)

**`SUBGestion.html` est GÉNÉRÉ** (décision du 06.10.2026) : `python3 subgestion/construire.py`.
Ne jamais le modifier à la main — modifier `Facturation.html`, `DeltaSub.html` ou `subgestion/*`, puis reconstruire.
Les deux apps d'origine restent séparées et utilisables telles quelles.

- Base = `Facturation.html` (design, en-tête noir, accueil, tous ses modules). `subgestion/shell.css` + `shell.js` :
  accueil par domaines (Projets, Équipe, Finances, Système), un hub par domaine (`panel-sg-<k>`, config `SG_HUBS`),
  onglets du domaine dans l'en-tête (`#sg-tabs`), `goTab`/`goBack` enveloppés, reprise de session `sa_ui_state_sg`.
- DeltaSub est habillé (`subgestion/ds_theme.css`), relié (`ds_embed.js` : `go` signalé à `parent.sgDsOnGo`, menus
  Fichier/Edition… dans la barre d'outils, arbre des modules masqué), puis embarqué compressé (gzip+base64,
  `#sg-ds-src`) et écrit dans le cadre `#sg-ds-frame` (`document.write`, même origine) : aucun conflit de noms
  ni de CSS entre les deux codes. `location.reload()` de DeltaSub → `parent.sgDsReload()` (recrée le cadre).
- Données inchangées et partagées dans le même navigateur : localStorage `sa_*` et IndexedDB « DeltaSub ».
  Import / Export : sauvegarde Facturation + export / import de la base DeltaSub (`sgDsExport`, `sgDsImport`).
- Modules en double gardés et marqués « Registre Facturation » (données distinctes) : Carnet des PV, Contrôle du
  coût, Devis, Feuille d'heures, Rapport d'heures. L'Admin de Facturation reste un hub à part (`hub-admin`).

## SUBGestion 2 — nouvelle app, interface entièrement redessinée (moteur DeltaSub)

**`SUBGestion2.html` est GÉNÉRÉ** (06.10.2026) : `python3 subgestion2/construire.py`. Ne pas le modifier à la main.
Base = DeltaSub.html seul (pas Facturation) : même moteur, mêmes 45 écrans, mêmes données (IndexedDB « DeltaSub »).
SUBGestion v1 (`SUBGestion.html`) reste en place, inchangée.

- `subgestion2/nx.css` REMPLACE la feuille de style de DeltaSub (système de design « NX » : Inter, panneau
  graphite, accent violet #6c47ff, cartes arrondies). Ne ressembler ni à SUB (noir/jaune, Akkurat) ni à DeltaSub.
- Le cadre DeltaSub (#top, #bar, arbre #side) est remplacé par la coquille de `construire.py` (mêmes identifiants
  conservés, #top/#side masqués) + `subgestion2/nx.js` : navigation par flux (`NX_NAV` : Projets, Chantier & coûts,
  Contacts, Temps & dépenses, Équipe, Finances, Bibliothèque, Réglages), libellés renommés, historique ⌥←/→,
  palette ⌘K (`nxPal`), barre contextuelle `#nx-sub` (outils + filtre de l'écran), épinglés/récents (`nx_pins`, `nx_recent`).
- Écrans nouveaux (dans `VIEWS`) : `nx-home` (Aujourd'hui), `nx-projet`, `nx-contact`, `nx-collab` (fiches 360°),
  `nx-data` (sauvegarde). `go` et `icon` sont enveloppés/remplacés ; session propre `nx_view` (au lieu de `ds_view`).

## SUBGestion 3 — charte Substances + Facturation (version de référence au 06.10.2026)

**`SUBGestion3.html` est GÉNÉRÉ** : `python3 subgestion3/construire.py` (v1 et v2 restent en place, inchangées).
- Moteur DeltaSub (même document) + app Facturation embarquée (gzip+base64 `#fx-src`, cadre `#fx-frame` dans `#fx-layer`,
  sans en-tête, `SG_EMBED`, reprise de session désactivée, clé `sa_ui_state_sg3`, `location.reload` → `parent.sgFxReload`).
- Charte « sub-ide_Charte graphique_OFFICIELLE » (01-IDENTITY/00-CHARTE) : Akkurat partout (`local()` — polices installées
  sur le poste, NON embarquées : licence desktop Lineto), nuancier principal noir #1d1d1b / gris #706F6F / jaune #FFF266
  #FEF6B0 / bleu nuit #003346 #636E7E, secondaire (rouge #BD1E42, orange #D7860D, vert #98C21F, turquoise #4CBAB5, bleu
  #3F4193) réservé aux états ; filets noirs 2 px, angles droits. Logo officiel : `subgestion3/logo_substances.svg`.
- Navigation (`SG_DOM` dans `sg3.js`, décision du 06.10 soir : MENU À GAUCHE, organisation de la v2 ; ordre des domaines depuis le
  18.10.2026 : Accueil, Affaires, Temps, Projets, Contacts, Chantier, Équipe, Ressources humaines, Facturation, Finances… ;
  **Chantier retiré du menu de gauche (20.10.2026)** : domaine gardé dans `SG_DOM` avec `menu:0` (ignoré par `sgSide`) — ses modules
  (Estimations, Descriptifs & devis, Appels d'offres, Contrôle des coûts, PV de chantier) s'ouvrent par la page du projet, le tableau de bord
  du projet ▸ Chantier, la vue d'ensemble `dom-chantier` et ⌘K ; droits et code d'accès inchangés ;
  Projets = Mes projets, Suivi & écarts, Registre, sous-menu dépliable « Tâches » (Urgent, En cours, Réglé — termes de l'ancien logiciel depuis le 19.10.2026, « En traitement » affiché « En cours » : items `grp` / `st`,
  `sgSideItems`, état `nx_sub3`) avec pastilles `sgPastille` (rouge = urgentes, verte = en cours, `sgTachesCompte` = ptModuleRows de
  l'utilisateur) — « Tous les projets » retiré, `sgOuvrirDomaine` → `nx-pdom` ; catégorie « architecture » affichée « Projets ») : menu bleu nuit
  (logo blanc, Rechercher ⌘K, domaines dépliables → modules — depuis le 18.10.2026 le NOM du chapitre ouvre sa vue d'ensemble et le
  déplie, la flèche seule déplie / replie, plus d'entrée « Vue d'ensemble » —, module actif en jaune, fiche ouverte (projet, contact…) juste sous le
  titre de son chapitre (19.10.2026), Favoris, pied
  utilisateur, réduction ⌘\ / auto < 1000 px) + en-tête blanc (historique, rubrique, titre ; boutons « Créer » et « ⋯ » masqués à la demande le 23.10.2026 — `#nx-new` / `#nx-more` gardés pour le
  minuteur et le mode chantier, leurs commandes restent dans ⌘K et Réglages ▸ Données & sauvegarde) + barre contextuelle
  `#nx-sub`. Variante « barres en haut » sauvegardée : `SUBGestion3_backup_20261006_2227_barre_haute.html` et
  `subgestion3/_backup_20261006_2227_barre_haute/`. ⚠ Ne jamais utiliser la classe `ov` (= voile des fenêtres DeltaSub,
  cherché par `$$('.ov')`). Vue d'ensemble par domaine (`dom-<k>`), modules Facturation
  = vues `fx-<onglet>` (arg `new`, `c:<id>`, `f:<id>`, `sync`), le cadre signale ses onglets via `parent.sgFxOnTab`.
  **Bibliothèques PDF intégrées (10.10.2026)** : pdf-lib 1.17.1, fontkit 1.1.1 et pdf.js 3.11.174 (copies du registre npm, empreinte
  sha512 vérifiée au téléchargement, gardées dans `subgestion3/vendor/`) sont intégrées DANS `Facturation.html` même : blocs
  `<script type="text/plain" data-vendor="…" id="vend-…">` (pdf-lib et fontkit dans `<head>`, exécutés par un petit script chargeur ;
  pdf.js et son worker avant `</body>`, exécutés à la demande par `offreLoadPdfJs`, worker fourni par `GlobalWorkerOptions.workerPort`
  à partir d'un blob : marche aussi en file://). Plus aucun appel à unpkg / cdnjs, hors connexion possible, dans Facturation seule comme
  dans SUBGestion v1 et v3. Les deux constructeurs (`subgestion/construire.py`, `subgestion3/construire.py`) vérifient l'empreinte
  SHA-256 de chaque bloc (`VENDOR_SHA256`, identique dans les deux) et qu'aucun site externe ne subsiste (arrêt sinon) ;
  `nas/nettoyer.py` laisse ces blocs intacts (regex `B64`). Mise à jour d'une bibliothèque : télécharger depuis npm (vérifier
  l'empreinte), remplacer dans `vendor/` ET dans les blocs de Facturation.html, puis mettre à jour `VENDOR_SHA256` (deux fichiers).
  **pdf.js (11.10.2026)** : `offreLoadPdfJs` remplace `window.pdfjsLib` par un objet qui hérite du module et dont `getDocument` ajoute
  `isEvalSupported:false` (faille CVE-2024-4367) et un worker unique `PDFWorker.fromPort` ; chaque aperçu appelle `pdf.destroy()`
  après le rendu (mémoire libérée, worker gardé : il n'appartient à aucun document). `pvLogoPng` charge pdf.js lui-même.
  `ibtn` enveloppé : icône + libellé (masqué si colonne < 560 px). Session `sg3_view`, favoris `nx_pins3`.
- **Uniformisation (06.10.2026)** : `subgestion3/fx_theme.css` (injecté en fin de Facturation embarquée) donne aux modules
  Facturation le graphisme commun — cartes à filet noir, boutons réduits à 3 sortes (bleu nuit / contour noir / rouge,
  par classe ou couleur en ligne), tableaux à en-tête blanc, champs, cockpits en version claire, titres en double masqués ;
  les aperçus et documents PDF ne sont pas touchés. Comportement commun : `toast`, `chConfirm`, `alert` de Facturation →
  `parent.toast` / `sgConfirm` / `sgAlert` (fenêtres du moteur), « / » filtre aussi dans Facturation, bouton « Fiche »
  (`#sg-ctx`, `sgCtxSync`) quand un projet, un contact ou un membre est sélectionné dans une liste du moteur.
- **Améliorations 1 à 10 (06–07.10.2026)** : tout dans `subgestion3/sg3_plus.js` (concaténé après `sg3.js` par le
  constructeur ; sauvegarde d'avant : `SUBGestion3_backup_20261006_2333_avant_ameliorations.html` + `subgestion3/_backup_…`).
  1. Sauvegarde automatique de la base de gestion (2 min après une modification, + au démarrage si > 12 h) : serveur 7788
     `POST /gestion/sauver` → dossier « Sauvegarde Gestion » (rotation 48 h / 60 jours / mensuelle ; `GESTION_BACKUP_DIR`),
     sinon dossier choisi dans Chrome (File System Access, 40 fichiers). État `sg3_sauvegarde`, pied du menu, Réglages ▸
     Données (restaurer `/gestion/lire`). IndexedDB « SUBGestion » (`reglages`, `fichiers`).
  2. Un seul registre : Réglages ▸ « Réunir les registres » (`nx-reunir`) — carnet d'adresses Facturation → Annuaire
     (le carnet du PV lit l'Annuaire ∪ reste du carnet), saisies d'heures « fh » → `timelog` (`sg3_heures_reprises`),
     contrats ↔ projets (code d'affaire exact puis préfixe ; liens manuels `sg3_liens`). Doublons Facturation (carnet,
     feuille/rapport d'heures, devis, contrôle du coût) déplacés en « Archives » de Réglages.
  3. Fiche projet = centre de pilotage : onglets Vue d'ensemble, Temps, Phases & budget, Intervenants, Contrats & factures,
     Chantier, Documents, Notes & tâches (`sg3_fiche_onglet`) ; actions Saisir du temps, Facturer (`fx-saisie` arg
     `nf:<contrat>` / `fx-calchono` `newaff:<n°>`), PV (`fx-pv-chantier` arg `pv:<n°>`).
  4. Finances ▸ « Rentabilité des projets » (`nx-renta`, `sgRenta`) : honoraires HT, coût du temps (taux internes
     `staffrate`), facturé, encaissé, marge, alertes (rouge/orange) ; affaires internes exclues (`sgInterne`) ; CSV.
  5. Accueil « À traiter aujourd'hui » (`sgATraiter`) : factures échues, contrats envoyés non signés > 30 j, jours sans
     saisie, tâches en retard, alertes de rentabilité, registres à réunir, sauvegarde ancienne ; pastille sur « Accueil ».
  6. Fichiers joints et PDF sans serveur DeltaSub : `ch03aApi/ch03aUrl/ch03aOnglet/ch03aLien` remplacés — contenus en
     IndexedDB (SHA-256) + copie serveur `/fichiers/ranger` ; ancien dépôt lu via `/fichiers/lire` (« Rapatrier ») ;
     PDF HTML → Chrome du serveur `/html2pdf` ; fusion/superposition par pdf-lib du cadre (⚠ tableaux créés avec
     `w.Array.of(…)` : pdf-lib vérifie `instanceof Array` de SON domaine) ; visionneuse intégrée `.sg-visu` (`sgVisionneuse(b,nom,o)`,
     11.10.2026 : n'affiche que des types sans script — PDF (lecteur de Chrome), images par `<img>`, texte brut dans un cadre
     `sandbox` ; HTML seulement pour les documents faits par l'app, `o.interne`, cadre `sandbox="allow-same-origin allow-modals"`
     sans scripts — un fichier déposé HTML / XML ne s'exécute jamais) ; `window.SG3_FICHIERS` = dépôt assuré par SG3 ; version d'un
     nom supprimé (R9, `/api/file?version=`) demandée au serveur du NAS en mode bureau (sinon 409 en recréant le même nom).
  7. Saisie de temps rapide (`sgSaisieRapide`, mêmes règles que la Feuille de temps) + minuteur (`sg3_minuteur`, pastille
     d'en-tête) ; Créer ▸ Saisie de temps, ⌘K.
  8. Libellés « Affaire » → « Projet » à l'affichage (enveloppes de `grid`, `ibtn`, `popMenu`, `dialog` ; les impressions et
     modèles gardent « Affaire ») et dans les textes de la coquille ; émojis de Facturation → icônes au trait (observateur
     dans le cadre, jamais `.offre-page`) ; palettes `PAL` / `YEAR_COLORS` du cockpit → couleurs de la charte (constructeur).
  9. Accès protégé (Réglages ▸ `nx-acces`) : code par poste, empreinte PBKDF2-SHA-256 salée dans `localStorage`
     `sg3_acces` {sel, hash, doms, delai}, déverrouillage par onglet (`sessionStorage` `sg3_ouvert`), reverrouillage après
     inactivité, cadenas au pied du menu ; montants masqués à l'accueil et dans les fiches quand verrouillé. Protection de
     l'interface, pas de chiffrement. **Code oublié** : dans Chrome, sur la page SUBGestion, ⌥⌘J (console) puis
     `localStorage.removeItem('sg3_acces')` et recharger — aucune donnée perdue.
  10. PV de chantier sur tablette : bouton « Mode chantier » (menu masqué, plein écran, formulaire pleine largeur, champs
      16 px, cibles ≥ 40 px, aperçu PDF derrière un bouton) ; présentation tactile d'office sur écran tactile
      (`pointer:coarse`). Limite : sur iPad, il faudra héberger l'app (NAS) et synchroniser les données (chaque navigateur a
      sa propre base).
  `fact_backup_server.py` doit être relancé sur le Mac Studio pour offrir les nouvelles routes (`/gestion/*`, `/fichiers/*`,
  `/html2pdf`).
- **Profils d'accès (07.10.2026)** — Administrateur (tout), Chef de projet, Collaborateur ; droits des deux derniers réglables
  dans Réglages ▸ Profils et accès (`nx-profils`, collection `sgacces` : `role:cdp|collab` {DROITS}, `user:<APPUSER.ID>`
  {PROFIL}, `couleurs` {C:{USERID:#hex}} pour les PV). 14 droits (projets visibles / modifiables, heures, notes de frais,
  chantier, PV, documents, contacts, équipe/taux, contrats, factures, finances, bibliothèque, réglages) — listes `SG_DROITS` /
  `SG_DEFAUTS` identiques dans `serveur_deltasub.py` et `sg3_plus.js` (bloc 11). « Ses projets » = équipe du projet
  (projectmember RESPCONTACT/CONTACT = PERSON_ID du collaborateur) + projets où il a saisi des heures. Compte sans profil :
  administrateur s'il a superadmin/userAdmin, sinon collaborateur. **Appliqués par le serveur du NAS seulement si
  l'ouverture de session par mot de passe est active** : `/api/snapshot` et `/api/changes` filtrés (index `SG_IDX` :
  enregistrement → projet / collaborateur), `/api/kv` filtré (contrats, factures, PV réduits au périmètre ; données RH de
  Facturation cachées), écritures refusées (403 « droits »), `/api/couts` = coût du temps agrégé (les taux restent sur le
  serveur). Côté app : menu (`sgVueOk`, qui remplace aussi les droits d'origine Deltaproject), accueil personnel, fiches,
  feuille d'heures (son nom seulement ; admin : tous les collaborateurs actuels), poste changé de main → données
  Facturation de l'utilisateur précédent effacées (`sg3_kv_user`). Fichier ouvert par double-clic : seul, administrateur.
- **Validation des contrats et factures** : modifiés par un profil au niveau « validation » → `_validation` {etat a_valider |
  valide | refuse, par, le, motif} posé par le SERVEUR (jamais par le poste) ; décision `/api/valider` (admin ou niveau
  « édition ») ; Facturation ▸ À valider (`nx-valider`) ; PDF définitif, « envoyé », « signé » bloqués tant que non validé.
- **PV de chantier** (`Facturation.html`) : ajouts / modifications / suppressions d'un collaborateur (droit PV « saisie »)
  marqués à son nom et sa couleur (`ln._a`, `ln._sup`, `sec._a`, `pv._ent` ; `parent.sgPvAuteur()`, `parent.sgCouleur()`) ;
  le validateur (« validation » : chef de projet, admin) valide ; « À envoyer » réservé au validateur, marques retirées
  avant l'envoi (le PDF n'en garde rien). Envoi : `pvEnvoiMail` → serveur de sauvegarde du Mac (`/pdf?mode=pv` dans
  « PDF PV », `/mailpdf?dossier=pv&to=a,b` : brouillon Apple Mail avec le PDF et tous les destinataires « D ») ; sinon
  feuille de partage (iPad) ; sinon PDF téléchargé + mailto.
- **Français seulement** — affichage (DeltaSub.html) : `nmFr` / `trFr` / `TRAD_FR` ; saisie : NAMEFR seulement (nouveaux
  enregistrements, formulaires, fonctions ; import de modèles : pages « fr » seulement ; `LANG_T` / `TPL_LANG` = français).
  **Base (07.10.2026)** : `frSeulOps()` / `frSeul(ops)` (moteur) retirent NAMEGE / NAMEIT / NAMEEN (français manquant complété
  par `trFr`), ne gardent que « fr » des modèles, suppriment documents types, gabarits et catalogues étrangers qui ont une
  version française (catalogue : ≥ 80 % des codes), traduisent provisoirement les autres (eBKP-T → « eCCC-GC (traduction
  provisoire) » : correspondances BKP→CFC / eBKP-H→eCCC-Bât de la base, puis `FR_CAT_DE`), mettent la langue des comptes,
  adresses et documents à 2 et corrigent les Œ / œ mal décodés. SUBGestion 3 (bloc 16 de `sg3_plus.js`) : **fait d'office,
  sans fenêtre de confirmation (19.10.2026, demande de Paulo)**, pour l'administrateur au démarrage dès qu'une autre langue reste ou revient
  (p. ex. après une reprise Deltaproject), et par le bouton de Réglages ▸ Données & sauvegarde ; bilan en message et dans Réglages ; sauvegarde juste avant (NAS : `POST /api/sauvegarder` →
  `avant_francais_<date>.sqlite` dans les sauvegardes, hors rotation ; local : sauvegarde habituelle) ; marque
  `sg_meta/francais` {DATE, N cumulé}. Sur le NAS, comptes et fonctions (`CH08_ADMIN_T`) exigent le droit Deltaproject
  « gestion des utilisateurs » : sans lui, ils sont laissés tels quels (signalé). Facturation : langue du carnet = Français.
  Traces de l'ancien logiciel dans la base (10.10.2026) : `FR_TRACES` + préfixe « DELTA … » (groupes de modèles `modelegroupe.libelle`,
  `formtemplategroup.NAMEFR`, `defaultpath.NAMEFR` → « Substances Originaux » (choix de Paulo, 18.10.2026 ; les 14 groupes de la base du
  NAS renommés le même jour), « Fichiers », …), catalogues « eCCC-… » → « Éléments … »
  (`FR_TRACE_CAT`, test `/^e[C]CC-/` qui survit au nettoyage) ; compteur `traces` ; `sgFrReste()` les détecte. `FR_CAT_SANS_FR` :
  « traduire » (fichier local) / « supprimer » (NAS).
  **Modèles venus de l'ancien logiciel en allemand (19.10.2026)** : `frSeulOps` traduit aussi les textes allemands restés dans la version
  « fr » des modèles d'impression (texte des éléments et des champs, préfixes du `format` « Seite », « Tel », « Dir »…, noms de bandes ;
  `FR_MODELE_TXT`, termes des modèles français de la base, apostrophe droite) et du document type sans version française (« Jahresbericht »,
  `FR_DOC_TXT`) via `frTradContenu` ; donne un libellé français aux modèles qui n'en ont pas (`FR_MODELE_NOM` d'après le nom de fichier,
  sinon `FR_MODELE_TYPE`) ; arrière-plans aux noms allemands ou italiens (`FR_FONDS`, `frFondEtranger`) : remplacés par l'arrière-plan
  français identique ou copiés sous un nom français (« … (vierge) »), références des modèles (« nom.xml ») mises à jour, supprimés si aucun
  modèle ne s'en sert. Compteurs `textesModeles`, `nomsModeles`, `fonds`. Base du NAS (essai à blanc du 19.10) : 1'443 textes, 55 noms,
  28 arrière-plans. ⚠ L'opération exige la route `/api/sauvegarder` du serveur (sinon : arrêt, rien n'est modifié).
- **Coût de revient** (Ressources humaines, `nx-coutrevient`, collection `sgcoutrevient`) : charges sociales, frais généraux par poste,
  temps de travail, marge ; par collaborateur salaire, mois, occupation, vacances, absences, part facturable, frais directs ;
  taux interne = coût annuel ÷ heures de présence → « Appliquer » écrit `staffrate`.
- **CCT vaudoise** (CCT des bureaux d'architectes et ingénieurs vaudois du 1.1.2023 : 42,5 h/sem., 9 fériés VD, 5 semaines de
  vacances, 6 dès 50 ans et avant 20 ans) : fériés vaudois appliqués automatiquement (`publicholiday`, « Lundi du Jeûne » =
  TYPECODE 3 calculé dans `holidayDate`) ; Ressources humaines ▸ Heures dues et vacances (`nx-cct`) : heures dues par mois
  (`stafftargettime`) et droit aux vacances (`staff.HOLIDAYS`, en heures) selon le taux d'occupation (celui du coût de
  revient), l'âge (naissance = contactowner de la personne) et la période d'engagement — créés d'office pour l'année en
  cours et la suivante ; Ressources humaines ▸ Bouclement annuel (`nx-bouclement`, collection `sgbouclement`) : heures sup. et soldes de
  vacances, validation par collaborateur, transfert → `TARGETTIMEREDUCTION` (report) et `HOLIDAYBALANCE` de l'année suivante.
- **Contrats de travail** (Ressources humaines, `nx-contrats-travail`, bloc 14 de `sg3_plus.js`, collection `sgcontrattravail`, réservée
  à l'administrateur sur le NAS) : « contrat » (engagement ; « Nouvel engagement » crée aussi la personne, ses adresses et le
  collaborateur), « avenant » (nouvelles conditions dès une date d'effet), « fin » (résiliation : reçue le, fin légale CCT
  art. 10 — essai 3 mois / 7 jours, puis 1 / 2 / 3 mois pour la fin d'un mois —, dernier jour de travail). Conditions en
  vigueur (`sgCtrEnVigueur`) → coût de revient (salaire, mois, taux : lecture seule là-bas) et heures dues (taux par jour).
  Décompte de sortie (`sgDecompteSortie`) : vacances au prorata, heures sup., jours ouvrés restants, dernier jour conseillé,
  solde à payer (salaire horaire CCT art. 25 = annuel ÷ (h/sem. × 52,14)). Documents au texte du modèle du bureau
  (« 19_Contrat employé », contrat 4 pages ; avenant ; confirmation de fin + décompte) ouverts dans la visionneuse (Imprimer →
  PDF). Grille des salaires minimaux CCT 2026 (`SG_GRILLE`, avenant du 26.11.2025) : contrôle du salaire (annuel, au prorata
  du taux). Contrat du bureau plus favorable que la CCT : 6 semaines de vacances dès le 1er janvier de l'année des 50 ans
  (appliqué au calcul) ; heures sup. positives au 31.12 compensées en vacances (option du bouclement, par défaut).
  Clause de commission sur les mandats apportés : case « Commission » + paliers `COMM_*` (voir Apports de projets).
- **Ressources humaines (07.10.2026)** — domaine `rh` de `SG_DOM` (après Équipe), réservé à l'administrateur (droits
  « équipe : taux » + « réglages ») et protégé par le code d'accès (« rh » dans `SG_ACC_DEF`, ajouté aussi aux réglages
  existants jusqu'au premier choix : `rhVu`). Occupation et effectif (`nx-occupation`, bloc 15) : taux d'occupation mois par
  mois (contrat + avenants en vigueur au 15 du mois ; avant le premier contrat enregistré, son taux ; sinon coût de revient),
  effectif et ETP, arrivées / départs, charge du mois (heures dues CCT, saisies, disponibles / attribuées de la planification),
  échéances RH (fin du temps d'essai, fin d'un CDD, fin des rapports de travail et départ, année des 50 ans, sans contrat,
  avenant de l'année, salaire sous le minimum CCT), export CSV ; puis Contrats de travail, Heures dues et vacances, Bouclement
  annuel, Coût de revient, Planification RH (`mg-planning` : disponibilité, occupation, attribution), Suivi RH (`mg-collab`).
  Équipe garde Membres, Tous les membres, Anciens membres, Temps de l'équipe.
- **Apports de projets (08.10.2026)** — Finances ▸ Apports de projets (`nx-apports`, bloc 17 de `sg3_plus.js`, collection
  `sgapport`, réservée à l'administrateur sur le NAS : lecture et écriture, comme `SG_T_SALAIRES`). Clause du contrat de
  travail (conditions particulières) : commission de x % des honoraires facturés HT (hors frais, acomptes déduits), versée au
  décompte final une fois tous les honoraires encaissés, due aussi après le départ ; x selon le montant des travaux TTC —
  paliers du contrat `COMM_T1` % sous `COMM_S1`, `COMM_T2` % jusqu'à `COMM_S2`, `COMM_T3` % au-delà (modèle 3 / 4 / 5 %, 2 et
  8 mio ; saisis dans le dialogue du contrat, repris dans son texte ; sans contrat : le modèle). « apport » {STAFF_ID,
  PROJECT_ID, DATE, TRAVAUX (vide = CFC 1, 2, 4, 5, 9 du calcul d'honoraires des contrats reliés), TAUX (vide = paliers),
  FINAL, REMARQUE} ; « versement » {STAFF_ID, PROJECT_ID (vide = acompte sur l'ensemble), DATE, MONTANT, REMARQUE}.
  Honoraires / facturé / encaissé = `sgRenta` (contrats Facturation reliés au projet). Acquise = facturé HT × taux ; exigible
  si décompte final saisi, ou tout facturé (ou affaire terminée) et tout encaissé ; solde = acquise − versé. Écran : par
  collaborateur (clic = détail), conditions, projets apportés, évolution (cumuls mois par mois, tableau annuel), versements,
  CSV ; Accueil ▸ À traiter « Commissions d'apport à verser » quand une commission devient exigible.
- **Contrôle des coûts ▸ chapitre DOCUMENTS (10.10.2026, moteur `DeltaSub.html`)** — dernier chapitre de l'éditeur d'un contrôle des
  coûts (`CC_SECS`, sans sous-nœud « Documents » de CH-01) : `ccDocsDraw` liste tous les `depotfichier` du dossier du document
  (`Construction/Costcontrol/<P>/<D>/coco` et sous-dossiers, libellés `CC_DOC_SOUS`), dépôt de tout type de fichier (bouton ou
  glisser-déposer) dans `…/coco/documents` via `ch03aDeposer` (PROJECT_ID de l'affaire → visible aussi dans la fiche projet ▸ Documents),
  Ouvrir (`ch03aOuvrir` → visionneuse SG3 ; le premier fichier choisi ; Entrée), Télécharger, Supprimer (`ch03cSupprimerDlg` ; touche
  Suppr), grille multi-sélection, redessin `ch03cSuivre`. `ccDocsDraw(pane,E,G)` remplit la grille `G` de l'éditeur (menu Fonctions :
  copier, CSV, imprimer) ; tri et sélection gardés dans `CCV.docsSt` / `CCV.docsSel` (clés disparues purgées). Avant l'envoi : nom
  (`ch03aNomValide`) et taille (`CH03A_MAX`) contrôlés, dossiers glissés ignorés (`webkitGetAsEntry`). Filet au-dessus de DOCUMENTS
  dans le menu. **Menu léger de DOCUMENTS (13.10.2026)** : les nœuds « Documents » des sections (documents imprimés et PDF de chaque
  section, `ch01aDocsDraw`) ne sont plus sous chaque section mais regroupés sous DOCUMENTS, un par section, avec son nom (`CC_SEC_LIB` :
  Contrôle du coût, Devis général, Mutations, Adjudications…) ; `ch01aDocNode(s, side, redraw, lib)`, intertitre « Documents · <section> ». Lecture seule si `ch03dLecture(E)` ou profil sans droit « documents : dépôt ».
  DeltaSub seul sans serveur (`ch10cLocal()` et pas `window.SG3_FICHIERS`) : chapitre en lecture seule avec message (pas de dépôt).
  Fiche projet ▸ Documents : titres de groupe lisibles (`sgDossierLib` : « Contrôle des coûts › <document> › Adjudications »…).
- **Chapitres PROVISOIRES « Honoraires (ancien) » et « Facturation (ancien) » (13.10.2026)** — domaines `ancien` et `ancienf` de
  `SG_DOM` (`prov:1` → étiquette « prov. » dans le menu), bloc 18 de `sg3_plus.js` : les deux modules de l'ancien logiciel tels que le
  moteur les reproduit, pour les comparer avec le chapitre Facturation. Honoraires : `anc-offres|contrats|avancement` (`sgAncProjet(domaine)` :
  liste des projets | `domainView`), `anc-mg-contrats`. Facturation : `anc-factures`, `anc-controle` (fact-controle), `anc-heures`
  (aff-controlling : heures et frais facturés, transfert en facture), `anc-mg-factures`, `anc-reglages` (`admPane` : tarifs, gabarits,
  comptes QR). Vues du moteur reprises par `Object.create` ; bandeau jaune en tête (`sgAncBandeau` : équivalent actuel, « Noter une
  remarque » → page du bon chapitre). « Comparer et noter » par chapitre (`sgAncComparer('h'|'f')` → `anc-comparer`, `ancf-comparer`) :
  thèmes `SG_ANC_THEMES` (6 honoraires, 10 facturation ; constat relevé dans le code le 13.10.2026), notes dans la collection `sganalyse`
  {ID = thème | `synthese` | `synthese-fact`, TEXTE, MODIFIE, PAR} (base partagée du NAS ; « Copier toutes les notes »).
  Droits : finances + contrats + factures ; protégés par le code d'accès comme Facturation / Finances (`SG_ACC_DEF`, `ancVu`).
  Ne jamais écrire « Deltaproject » dans ces textes (la version servie le remplacerait) : « ancien logiciel ». Pour les retirer :
  supprimer les domaines `ancien` et `ancienf` de `SG_DOM` et le bloc 18 (les notes restent dans la base).
- **Clic droit dans les tableaux (13.10.2026)** — bloc 19 de `sg3_plus.js` : menu contextuel (`sgMenuAt`, `sgMenuPanneau`, sous-menus,
  classe `menu sg-cmenu`, mêmes filtres de droits `ch08bGuardItems` et libellés `sgLib` que `popMenu`). Grille du moteur : la ligne est
  sélectionnée, puis Ouvrir (double-clic), fiche (`sgLigneRef`), boutons de la barre du panneau (`sgCtxBarre` : `.ph2` le plus proche,
  sinon `#tools` ; `ibtn` garde sa définition dans `el._sgB` → bouton à liste = sous-menu), copie de la ligne / des lignes / du tableau
  (TSV) ; zone vide d'une liste : actions de sa barre. Écrans de la coquille : lignes `data-ref` (`sgCtxRef` : fiche, modifier, saisir du
  temps) et `tr` / `.nx-row` (leurs boutons). Cadre Facturation (`sgCtxCadre`, branché par `fxEnsure`) : boutons et états de la ligne
  (libellé = infobulle, `sgCtxLib`), destructifs en rouge à la fin. Priorité aux menus propres d'un écran (`event.defaultPrevented`) ;
  menu du navigateur : ⌥ + clic droit, champs de saisie, texte sélectionné.
- **Tri des tableaux (20.10.2026, fin de `sg3_plus.js`)** : clic sur le titre d'une colonne de tout tableau `.nx-tbl` de la coquille → tri ;
  2e clic → ordre inverse (flèche bleu nuit, `aria-sort`). Premier clic : texte A→Z, nombres et dates du plus grand / plus récent ; dates
  jj.mm.aaaa et « Septembre 2026 » reconnues ; nombres avec ', h, %, CHF, CHF/h, signe − ; cellules vides, « — » et « (sans …) » toujours en bas ;
  lignes « Total » (`tr.tot` ou « Total… ») gardées en tête / en pied ; sous-lignes `tr.sub` triées avec leur ligne parente ; clé de tri
  propre à une cellule : attribut `data-tri` (texte, ex. ordre SIA). Tri retenu pour la session par écran et jeu de colonnes (`SG_TRI`),
  réappliqué quand le tableau est redessiné (MutationObserver). Pas de tri : plusieurs lignes de titres, `colspan`, titre vide (`.sg-notri`)
  ou contenant un contrôle. Les listes du moteur (`grid`) ont leur propre tri.
  **Pas de tri dans le tableau de bord d'un projet** (tableaux de `#sg-onglet` : onglets Heures, Contrat, Factures, Intervenants…), retiré à la
  demande le 20.10.2026 : les tableaux y gardent leur ordre (détail des heures du plus récent au plus ancien, « Par phase » dans l'ordre SIA 102,
  factures de la plus récente…) ; les clés `data-tri` / `sgSiaCle` y restent sans effet. Les autres écrans (Mes projets, Rentabilité, RH…) gardent le tri.
- **Appels d'offres (18.10.2026, moteur)** : « Nouveau document » ouvre directement le formulaire (plus de fenêtre de choix du
  standard : `svNew` → `svEditDoc`) ; formulaire sans « Numéro de l'ordre », « Standard » ni « Catalogue » (ISIFA2018 /
  NORMPOSITIONCATALOGCODE toujours enregistrés d'office par `svNewHeader`) ; numéro d'ordre retiré aussi de la liste (et avec lui les
  vues Adjudication / Commande / Standard de la roue), de la recherche, du titre (sans lot CFC : n° d'affaire + version), de
  l'import des conditions générales et du transfert vers le contrôle des coûts. `ORDERNUMBER` reste dans les données (non affiché).
  **Articles libres et bibliothèque d'articles (18.10.2026, moteur, bloc « Bibliothèque d'articles » après `svdPosBrowser`)** : « + » ▸
  « Nouveau chapitre… » (`svdChapterDlg(ctx,null,{libre:true})`, règles `svdChapterRuleLibre` : 3 chiffres sans 9, pas de x00) et
  « Nouvel article… » (`svdResPos(ctx,{libre:true})` : numéros sans 9 en 2e/3e position, saisie directe 112 / 112.110 / 112.110.01,
  colonne « Bibliothèque », unité et texte repris de la bibliothèque, mot-clé = 1re ligne, « Editer l'article » ouvert si l'article est
  vide) ; les chapitres et articles de réserve restent. « Editer l'article » : case « Enregistrer dans la bibliothèque d'articles »
  (cochée hors réserve) → `svbSaveSafe` : collection `svbiblio` (`SVB_T`), un enregistrement par chapitre {ID = numéro, texte1/2,
  version, articles [{m, u, unite, motCle, motCleAuto, texte, variables, modifie, par}]} — ni quantité, ni prix, ni document ; titres
  parents ajoutés s'ils manquent ; conflit 409 → second essai. Import : Importer ▸ « Bibliothèque d'articles… » (`svbImportDlg`, cases
  par chapitre / article, `svbInsert` : chapitre, titres, QP auto, un seul enregistrement) ; catalogue « Perso » = bibliothèque par
  défaut (`P.doc` null / 'biblio', « Retirer de la bibliothèque… » `svbRemove`). Serveur : `svbiblio` dans `PROTECTED` (ré-import) ;
  écriture si « chantier : écriture » ou « bibliothèque : écriture » (`sg_refus_ecriture`). Aucun texte d'origine livré avec l'app.
- **Affaires ▸ Controlling = Deltaproject 16 (18.10.2026, moteur `DeltaSub.html`, bloc « AFFAIRES · Controlling »)** — reproduction de
  `ProjectControllingFrame` (classes et libellés relevés dans `DELTAproject.jar` / `Strings.db`, en lecture seule) : barre « Analyse des heures ▾ »
  (Contrôle des heures, Critères d'analyse, Récapitulatif, Récapitulatif des collaborateurs), « Analyse des frais ▾ », roue, filtre des états
  (`CTL_ETATS`, « En cours » d'office, `ds_ct_etat`) ; liste des affaires | 4 tuiles (`CTL_TILES`, droits `projectTime` / `projectCosts`).
  Chaque tuile ouvre SA fenêtre modale : Contrôle (`ctlTimeCheck` = TimeLogControllingDialog : collaborateurs de l'affaire `ctlStaffs` |
  agenda de la semaine en revue, seules les heures de l'affaire — les autres en gris sur option —, clic droit Approuver / Refuser /
  Réinitialiser / Tout sélectionner, réglages `ds_ctw_opts`) ; Contrôle des frais (`ctlCostCheck` = ProjectCostControllingDialog : mois en
  revue) ; Critères d'analyse des heures / des frais (`ctlAnalyse(p,t)` : six listes avec prévisions et « ✕ Annuler la sélection », filtre
  par date mois ou période, Facturable / Facturé, tableau aux colonnes de l'original, pied roue ▾ / documents ▾ / rapports ▾, « Total … »,
  « N positions de M », Fermer). Rapports : Grouper (`ctlSummary`, regroupements `CTL_GROUPES`), Composer le rapport (`ctlReport` →
  `ctlJournal` « Journal des heures », `ctlCostReport` « Rapport des frais »), document d'analyse des collaborateurs (`ctlStaffReport`),
  impression `ctlDocHTML`. Fenêtre ouverte tenue à jour par `DS.on` (`CT.live`). Même écran pour Projets ▸ Suivi & écarts et
  Facturation (ancien) ▸ heures. Sauvegarde d'avant : `DeltaSub_backup_20261018_2328_avant_controlling.html`.
- **Affaires · Mes projets · page du projet (18.10.2026, bloc 20 de `sg3_plus.js`)** — Chapitre « Affaires » sous Accueil (`SG_DOM`
  `affaires`, icône `briefcase`) : le module Affaires de l'ancien logiciel tel quel (**Liste des affaires**, ex-« Gestion »,
  renommée le 23.10.2026 ; « Mes affaires » et « Toutes les affaires » retirés du menu le 23.10.2026, à la demande — écrans `affd-mes` / `affd-toutes`
  gardés, hors menu ; **« Controlling » déplacé le même jour dans Réglages ▸ Archives** (« Archives · Controlling », `affd-controlling`, gardé pour un
  usage ultérieur)), écrans du moteur repris par `Object.create` sous `affd-*` (droits : `SG_VUE_DROIT` recopiés, regex du moteur `CH08B_AFF`
  et `CH08B_VIEWS` élargies à `affd?-`). Projets ▸ Mes projets = `nx-mesprojets` : liste seule (« ses projets » = `sgMesProjets`, en
  cours / tous, recherche, étiquette Expertise / Faisabilité, mes heures 30 j) ; un clic → `nx-pdom` (arg `ID` ou `ID|Domaine`) : page
  du projet (intro, actions, heures) et domaines d'affaire en groupes REPLIABLES (tout replié à l'arrivée ; clic sur le titre du groupe =
  ses tuiles avec compteurs ; au retour d'un domaine, arg `ID|#n`, son groupe reste ouvert ; `SG_PDOM_G`, `SG_PDOM_GI`, `SG_PDOM`, `sgPdomCompte`,
  domaines permis `sgPdomListe` = `ch08bDomains` + domaines utilisés + profil) ; une tuile = le domaine en pleine page (`domainView`)
  avec la barre des domaines ; « Documents » → fiche projet, onglet Documents. Vue d'ensemble Projets (`sgFigs('projets')`) : total,
  architecture, expertises, faisabilités (avec le nombre en cours), puis les états — catégorie `sgCatProjet` d'après le TITRE (la base
  n'a pas de genre expertise / faisabilité), projets internes (`sgInterne`) hors catégories.
  **Accès (18.10.2026)** : « Mes projets » = projets ATTRIBUÉS (`sgProjetsAssignes` : la personne de l'utilisateur est dans l'équipe
  du projet, sans les projets où il a seulement saisi des heures) ; collaborateur (profil collab, droit « ses projets ») : page du
  projet, fiche projet et ⌘K limités aux projets attribués (`sgProjetPermis`, message `SG_NON_ATTRIBUE`) ; chapitre Affaires réservé à
  l'administrateur et au chef de projet (`SG_VUE_DROIT['affd-*']`). Le serveur du NAS (ouverture de session active) filtre toujours
  sur « équipe + heures » (`sg_contexte`). Vue d'ensemble Projets REFAITE (`VIEWS['dom-projets']`) : total en grand, tuiles par
  catégorie (`SG_CATS` : architecture, expertises, faisabilités, autres — projets internes, « Internes » renommé « Autres » le 19.10.2026 ; jauge « en cours »), tâches ouvertes, modules (sans
  « Tous les projets » ; les données par état ont été retirées à la demande, `SG_ETATS` sert aux filtres de la liste) ; chaque élément ouvre `nx-listeprojets`
  (arg `tous`, `cat:…`, `etat:…` ; filtres, recherche ; projets visibles = `sgProjetsVisibles`).
  **Page du projet (19.10.2026)** : marge bénéficiaire retirée des données à la demande (elle reste au tableau de bord) ; bouton « Modifier le projet » retiré (le tableau de bord du projet reste ouvert à tous, restriction
  aux administrateurs et chefs de projet essayée puis annulée à la demande le même jour).
  **Tableau de bord du projet (19.10.2026)** : « Saisir du temps » (en-tête et onglet Temps) et « Feuille d'heures » retirés ; onglet Temps :
  colonne « Collaborateur » ; onglet « Phases & budget » renommé « Phases contrat » (colonnes Heures contrat = TIMEBUDGET, Heures saisies,
  Écart ; Coût de revient = Σ heures × taux interne `staffrate` à la date, et **Contrat TTC** — remplace « Budget CHF » le 19.10.2026 —
  = montant TTC des contrats Facturation reliés réparti selon les % des prestations SIA du contrat, par phase et sous-phase (`sgContratParPhase`,
  `sgSiaGroupe` : phase reconnue par son nom SIA, sinon par son numéro 3, 4, 5), masqués au collaborateur).
  (Une colonne « Facturé HT » servant de base à la marge et aux honoraires / h a été essayée puis retirée à la demande le 19.10.2026 ;
  copie : `subgestion3/_backup_20261019_1627_avant_phases_marge/sg3_plus_avec_facture.js`.)
  **Marge et taux horaires par phase (19.10.2026, même onglet, administrateur et chef de projet)** : tout en HT (la TVA n'est pas un revenu, le
  coût de revient n'en contient pas ; TTC en infobulle) — Contrat HT, Coût de revient, Marge bénéficiaire (contrat HT − coût, vert / rouge),
  Honoraires / h (contrat HT ÷ heures saisies), Coût de revient / h (coût ÷ heures saisies) — noms choisis par Paulo le 19.10.2026 — et
  Comparaison (`.sg-db` : point plein = honoraires / h, rond = coût de revient / h, trait vert = gain / rouge = perte par heure, repère = coût de
  revient moyen des collaborateurs du projet ; échelle plafonnée à 2,5 × le plus haut coût horaire, flèche au-delà ; une version « Gain / perte par
  heure » en barre divergente a été essayée puis retirée à la demande le 19.10.2026, copie dans `subgestion3/_backup_20261019_1627_avant_phases_marge/`), par phase, sous-phase (heures contrat = TIMEBUDGET de la sous-phase) et ligne « Projet » ;
  lignes entièrement vides masquées ; phase en cours surlignée (marge provisoire). Collaborateur : heures seulement.
  Légende (`.sg-db-leg`) tout en bas de la page, sous le tableau, sans le « coût de revient moyen » (retiré le 19.10.2026 : il reste dans
  l'infobulle de chaque comparaison, « trait gris ») ; note « Contrat : … CHF HT … réparti selon les % … Montants hors taxe … »
  retirée à la demande (19.10.2026) — seul l'avertissement « Aucun contrat d'honoraires relié » reste (`.sg-ctr-note`, sans contrat).
  **Chiffres clés sous le titre « Phases contrat » (19.10.2026, `.sg-phks` / `.sg-phk`)**, des heures vers l'argent : Écart des heures (saisies −
  contrat, % consommé), Phases hors budget (même règle que l'en-tête `sgRenta` : phases avec heures au contrat dépassées ; « n sur m »,
  heures au-delà et noms), puis pour l'administrateur et le chef de projet : Marge bénéficiaire (% du contrat HT, « provisoire » si une
  phase est en cours), Coût de revient moyen (CHF/h), Gain / Perte par heure (honoraires / h − coût de revient / h, valeurs arrondies) ;
  collaborateur : les deux chiffres d'heures. Lien « Configurer » de l'en-tête de la carte retiré à la demande (le lien de la carte vide reste).
  Texte gris sous les chiffres retiré à la demande (19.10.2026) : le détail (heures saisies / contrat, phases dépassées, % du contrat…) est en infobulle.
  **Part facturable de la vue d'ensemble (19.10.2026)** : contrat(s) Facturation du projet au forfait ou au forfait relatif (`sgRemuType` =
  `detail.inputs.ch_modecalc_type`, comme `chContratModeCalc`) → les heures facturables (ISCHARGEABLE) d'une phase sont plafonnées à ses heures
  au contrat (TIMEBUDGET) : le dépassement d'une phase (toutes les phases, phase en cours comprise) n'est pas facturable et fait baisser la part
  (« x h facturables · y h au-delà du contrat (forfait) ») ; contrat unitaire, phase sans heures au contrat, heures sans phase : inchangé.
  Contrat sans mode de rémunération enregistré (ancien formulaire : 113 des 140 contrats du NAS au 20.10.2026, dont 22SEG) = forfait relatif,
  le mode par défaut de Facturation (`sgRemuType(c)||'relatif'`) : la règle s'applique aussi (20.10.2026 ; 22SEG : 100 % → 40 %). Projet sans contrat relié : inchangé.
  **Tuile « Part facturable » déplacée dans l'onglet Contrats & factures (20.10.2026)**, à droite de « Solde à facturer (TTC) » : calcul dans
  `sgPartFacturable(p,D)` {tot, chg, fact, dep, ty, pct} ; texte « x h sur y h saisies », détail du dépassement en infobulle. La vue d'ensemble
  garde Heures prévues, Heures saisies et Phase actuelle.
  **« Phases contrat » regroupé dans « Contrats & factures » (20.10.2026)** : `SG_ONGLETS` sans « phases » (onglet à la 3e place ; choix
  mémorisé `phases` → `factu`) ; ordre : tuiles financières, indications, Contrats d'honoraires (remontés au-dessus des phases le
  20.10.2026), carte « Phases contrat » (`#sg-oc-ph`, dessinée par `sgOnglet(p,'phases',pg,cible)` — paramètre `cible` = partie d'un onglet
  regroupé). Sans droit de
  lecture des contrats ni des factures (`sgFactuOk`, collaborateur par défaut) : les phases seules (heures). Finances verrouillées : message
  « Déverrouiller » puis les phases en heures seulement. `SG_ONGLETS_COLLAB` = factu, interv, chantier, docs, notes.
  **Le même jour, ensuite** : onglet `factu` renommé **« Contrats »** ; **onglet « Factures »** (`fact`, juste après) = carte Factures (factures des
  contrats reliés ; lien « Toutes les factures » retiré le 20.10.2026 ; colonne **« Contrat »** après le numéro, seulement si les factures relèvent
  de plusieurs contrats — libellé `sgContratPhLib(c)` d'après les phases SIA du contrat, « Étude du projet · 31–33 », « Appel d’offres, Réalisation ·
  41, 51–53 » ; même libellé pour deux contrats → année ajoutée ; code, date et description en infobulle ; ex. 17QUE), indication « Facturation en retard (x % facturé / y % consommé) » tout en bas, sous le tableau (`.sg-fact-ret`) ;
  tuiles au-dessus du tableau (`sgFactKpis(x,ah)`, `.sg-fkpis` deux lignes de quatre, choix de Paulo — cinq colonnes depuis l'ajout, le 20.10.2026,
  de **« À facturer selon les heures »** après Solde à facturer : `sgAFacturerHeures(p,D,x)` = heures facturables (cochées « Facturable », plafonnées
  par phase aux heures du contrat pour un forfait, comme la Part facturable) × tarif horaire du contrat (« Tarif horaire moyen » `ch_h` de Facturation
  − rabais du contrat), TTC, − facturé TTC ; plusieurs contrats : chaque heure au contrat qui couvre sa phase partielle (sinon sa phase), à défaut
  au dernier contrat qui a un tarif ; négatif = facturé d'avance (vert `.sg-pos`) ; contrats de l'ancien formulaire sans tarif (113 sur 140) → « — » ;
  détail en infobulle) : Facturé (TTC), Encaissé (TTC), Solde à
  facturer (TTC) — déplacées depuis l'onglet Contrats, qui garde Honoraires (TTC) et Part facturable —, Facturé / consommé (chiffres de « Facturation
  en retard » : facturé HT ÷ honoraires HT, coût de revient ÷ honoraires HT ; jauge, repère rouge si retard), Ouvert (non payées), Échu (échéance
  passée, rouge), Dernière facture (date, n°, type), Délai moyen de paiement (date de facture → `date_paiement`) ; TTC sans frais comme `sgRenta` ; **Factures par année (20.10.2026)** : choix « Toutes · 2025 · 2024 … » dans le titre de la carte Factures (même présentation
  que les années de l'onglet Heures, `.sg-an`, `data-fan`, mémorisé `sg3_fact_an` ; absent si toutes les factures sont de la même année) ;
  une année choisie → tableau « Factures · 2025 » et tuiles des factures de l'année, année dans le libellé (Facturé, Encaissé, Ouvert, Échu,
  Dernière facture, Délai moyen : `sgFactKpis(x,ah,an)`) ; Solde à facturer, À facturer selon les heures et Facturé / consommé restent sur
  tout le projet ; tuiles alignées d'une tuile à l'autre (`subgrid`, libellé sur deux lignes possible) ; jamais pour le
  collaborateur (absent de `SG_ONGLETS_COLLAB`), droit « factures : lecture », code d'accès comme les finances. Cartes repliables essayées puis
  retirées (« Phases contrat » ne se replie pas, à la demande ; Factures a son onglet).
  **« Ouvrir » un contrat d'honoraires depuis le projet (20.10.2026)** : le contrat en PDF fidèle, lecture seule (`openContratPdf` du cadre),
  DERNIÈRE version seulement — le contrat signé ou, après la signature, le dernier avenant (nouvelle version ; Facturation n'a pas d'avenant
  séparé) — sans le choix des versions ; état à la place du commentaire (Contrat signé / Avenant … non signé, la version n est signée / Envoyé,
  non signé / Non signé / annulé) ; « Fermer » ramène à l'écran d'où l'on venait (`nxHist(-1)`). Vue `fx-contrats`, arg `cv:<id>`
  (`sgVoirContrat(w,id)`, contrats lus par `fxData()` : `contrats` est un `let` du cadre, pas une propriété de window). L'édition reste dans
  Facturation ▸ Contrats (✏️) ; ⌘K garde `fx-calchono` `c:<id>`. NAS au 20.10.2026 : aucun contrat marqué signé, 1 seul avec 2 versions.
  **Tableau des contrats d'honoraires (onglet Contrats, 20.10.2026)** — état final du 20.10.2026 : **Document** (ex-« Nature », placé avant le
  commentaire), **Commentaire** (commentaire de la dernière version, « Commentaire de version » de Facturation, `sgContratInfo(c).com` ; remplace
  la colonne Contrat = code + description), **Type** (rémunération : Forfait relatif / Forfait / Unitaire ; nommée « Rémunération » puis de nouveau
  « Type » le même jour, à la demande), Date du contrat, HT, TTC, État. Première version du même jour : colonnes Contrat, **Nature** (Contrat / Avenant), **Type** (rémunération ;
  Forfait relatif / Forfait / Unitaire, chapitre « Mode de calcul » ; non enregistré = forfait relatif, le défaut de Facturation, signalé en
  infobulle), **Date du contrat** (c.date, sinon date de la dernière version), HT, TTC, **État** (Brouillon / Envoyé / Signé le … / Terminé /
  Annulé, les états de Facturation) ; **Tarif horaire brut** (`ch_tarif_moyen` des données du calcul d'honoraires, tarif avec rabais en infobulle ; « — »
  pour les contrats de l'ancien formulaire, 113 sur 140 au NAS) et **Rabais** (`c.rabais`, %) après « Type » (21.10.2026) ; « Date du contrat » juste à droite de « Document » (21.10.2026) ; colonne Client retirée. « Ouvrir » et « Facturer » de chaque ligne = tuiles à icône comme l'onglet Heures
  (icône `pdf` / `receipt` au-dessus du libellé, `.sg-htls.sg-cacts`, 20.10.2026) ; lien « Tous les contrats » retiré du titre de la carte (20.10.2026). Contrat terminé (`c.termine`, état « Terminé ») : plus de « Facturer », case vide
  (`.sg-cvide`) pour garder « Ouvrir » aligné (20.10.2026). Fiche commune `sgContratInfo(c)` (aussi dans l'aperçu PDF « Ouvrir »). **Facturation.html** (même jour) :
  « signé » coché → `signeLe` (date du jour) sur la dernière version (`chEnsureVersions`), retiré si on décoche ; nouvelle version créée après
  une signature (contrat signé ou avenant déjà en cours, `signedV`) → version marquée `avenant:true`. Avenant = dernière version marquée, sinon
  `signedV.v` < dernière version (avenants antérieurs au 20.10.2026 non signés).
  Phases contrat : montants, Marge bénéficiaire, Coût de revient moyen et Gain / Perte par heure réservés à l'administrateur et au chef de
  projet (`fin = sgAdmin() || profil cdp`, et finances non verrouillées), règle écrite explicitement le 20.10.2026 ; autres profils : heures.
  **Collaborateur (20.10.2026)** : jamais de factures — ni onglet Factures, ni tuiles Facturé / Encaissé / Solde à facturer dans Contrats,
  ni indications, ni bouton « Facturer » ; restent Honoraires (TTC), Part facturable, Contrats d'honoraires (« Ouvrir ») et Phases
  contrat (s'il a le droit de lire les contrats ; sinon les phases seules).
  Indications de coût (« Coût au-delà des honoraires », « Coût à n % des honoraires ») retirées de l'onglet Contrats (20.10.2026) ; sous ses
  tuiles ne reste que « Pas de contrat relié » ; « Facturation en retard » est dans l'onglet Factures. Toutes restent dans Rentabilité des
  projets et l'accueil (À traiter).
  **Vue d'ensemble du tableau de bord (19.10.2026)** : tuiles Temps total, **Temps contractuel prévu** (Σ des heures au contrat des phases,
  heures restantes ou au-delà, % du prévu), Part facturable ; Coût de revient, Facturé (HT) et Marge bénéficiaire retirés à la demande (plus de
  tuile « Finances verrouillées » dans cet onglet) — la marge reste dans « Phases contrat », le facturé dans « Contrats & factures ».
  Puis, le même soir : tuiles renommées « Heures saisies » et « Heures prévues » (ordre final : Heures prévues, Heures saisies), tuile « Phase actuelle »
  (numéro en grand, nom en petit, sous-phase en infobulle) à droite de « Part facturable » ; aucun texte gris sous les tuiles (détail en
  infobulle, `kpiT`) ; disposition en deux colonnes (`.sg-pcol` : à gauche « Phases : heures prévues et effectuées » puis « Temps par mois »,
  à droite « Équipe » ; côte à côte jusqu'à 760 px) ; graphique des phases : légende sous le tableau, ligne « Total : … effectuées sur …
  prévues · phase actuelle … » retirée. En-tête du tableau de bord : boutons Facturer, PV de chantier, épingle, « … » et Modifier retirés.
  Phase actuelle affichée SANS son numéro (`sgPhaseLib` : nom — sous-phase ; tuile du tableau de bord et chiffre de la page du projet en
  toutes lettres, classe `.txt`) ; la numérotation reste dans les listes de phases. Filet léger (`--s-filet`) au-dessus des légendes sous les
  tableaux (`.sg-pg-leg`, `.sg-db-leg`).
  **Graphisme de la vue d'ensemble revu (20.10.2026)** : en-tête du tableau de bord réduit au titre + « Maître de l'ouvrage : <nom> » (intervenants
  au rôle 8, `.sg-mo` ; lieu et « Interne » gardés s'il y en a) — numéro, état, date, phase actuelle et indications « Coût au-delà des
  honoraires », « Facturation en retard », « n phases hors budget » retirés de l'en-tête à la demande (`#sg-p-al` supprimé ; ces alertes restent
  dans Rentabilité des projets, l'accueil et l'onglet Contrats & factures). Tuiles (`.sg-pkpis`) toutes au même style (plus de tuile foncée),
  heures entières (`sgHr` ; moins d'une heure au dixième) ; « Heures saisies » porte la jauge saisies / prévues (`.sg-kg` : bleu nuit jusqu'à la
  limite, rouge au-delà, repère) et la pastille du % des heures prévues (`.sg-kq`, rouge au-delà de 100 %) ; plus de barre sous « Heures prévues ».
  Graphique des phases : colonnes n° | phase (`sgPhNom` : soulignés retirés, MAJUSCULES → minuscules) | barre | heures | pastille %, échelle
  graduée commune (`sgEchelle`) avec lignes de repère et axe en heures, colonnes proportionnelles (lisible dès ~1000 px). « Temps par mois » :
  `sgMoisGraph` en HTML (l'ancien SVG `nxBars` étiré déformait les textes), échelle graduée, ligne « moyenne n h » des mois saisis, mois en cours
  hachuré, année sous janvier et sous le premier mois. Équipe : part du temps en barre sous le nom, heures et % à droite (`.sg-eq`). Classes
  préfixées (`sg-mg-*`, `sg-mc`, `sg-gl`, `sg-pg-n|q`) : `.cols`, `.c`… existent déjà dans le moteur. Copie d'avant :
  `subgestion3/_backup_20261020_avant_vue_ensemble/`.
  Onglet « Contrats & factures » : tuile « Coût de revient » retirée à la demande (19.10.2026) ; tuiles en TTC : Honoraires (TTC) (`sgRenta` ▸
  `contratTTC` = httc des contrats, sinon hht × (1 + TVA) ; contrats du moteur : HT × 1,081), Facturé (TTC) (`factTTC`, % des honoraires TTC),
  Encaissé (TTC) (montant seul, sans la marge), **Solde à facturer (TTC)** = honoraires TTC − facturé TTC (% des honoraires). Sous les tuiles, l'indication « n phases hors budget » n'est plus affichée (retirée aussi de l'en-tête le 20.10.2026) ; tableau des
  factures : colonne « Numéro de facture » (au lieu de « Facture »).
  **Projets : « Temps » → « Heures », « Contrats » → « Contrat » (20.10.2026)** : onglets du tableau de bord (`SG_ONGLETS`, clés `temps` / `factu`
  inchangées), carte « Heures par mois », « Aucune heure saisie. », infobulle « % des heures du projet », bouton « Saisir des heures » de la page du
  projet et du clic droit sur un projet (la saisie elle-même garde son titre « Saisie de temps »).
  **Onglet « Heures » au graphisme de la vue d'ensemble (20.10.2026)** : choix « Période » et « Affichage » selon la **variante C6** choisie par
  Paulo parmi 12 (après un essai en texte souligné puis un en menus déroulants, le même jour) — Période sur une règle graduée (`.sg-hreg` :
  1 mois · 3 mois · 12 mois · Tout, repère carré par période, trait bleu nuit jusqu'au choix, repère plein et libellé gras pour le choix),
  Affichage en tuiles à icône (`.sg-htls` : Détail, Collaborateur, Phase, Mois, Activité, Collab. × phase ; icônes `list`, `users`, `escalier`,
  `cal`, `tag`, `grille` — `escalier` et `grille` ajoutées à `NXI` — ; choix souligné en bleu nuit, nom complet en infobulle), deux lignes
  `.sg-hrow` dans `.sg-hbar` (plus de boutons encadrés `.seg`) ; tuiles sans texte gris (Heures saisies, Saisies, Collaborateurs, Dernière saisie ; Coût de revient
  si `sgTauxVisibles()`), carte titrée selon l'affichage avec CSV et Imprimer dans son titre (`.sg-ha`), en-tête du tableau fixe (`.sg-hscroll`) ;
  détail : 400 lignes à l'écran, signalé (`.sg-hplus`), l'export CSV contient toutes les saisies de la période ; colonnes du détail
  (20.10.2026) : Date, Collaborateur (nom complet `staffName`, plus les initiales), Phase, Phase partielle (sous-phase, d'abord nommée « Précision », `projectsubphase`
  `SUBPHASE_ID`), Commentaire (`DESCRIPTION` seul, sans l'activité), Durée — colonnes Facturable et Statut retirées à la demande. Colonnes ajustées
  au contenu (largeurs fixes essayées puis abandonnées le même jour : elles ne s'adaptaient pas) : Date, Collaborateur et Durée à leur largeur, Phase
  (min. 110 px), Phase partielle (min. 150 px) et Commentaire (min. 220 px) se partagent le reste au prorata de leur texte, texte à la ligne si nécessaire ; jusqu'à 5'000 saisies affichées. Tri par Phase / Phase partielle dans l'ordre SIA 102 (clé `data-tri` =
  `sgSiaCle`) ajouté puis retiré le même jour avec le tri des tableaux du projet.
  Affichages regroupés de l'onglet (20.10.2026) : sans la colonne « dont facturables » (`sgSituationHtml(L,g,{hier:1,fact:false})` ; Situation
  des heures du chapitre Temps, appelée sans option, inchangée) ; « Par phase » en arbre (`sgPhasesHier`, `.sg-sit-h`) : phases dans l'ordre
  SIA 102 (numéro de la phase, sinon `sgSiaGroupe`), phases partielles sur les lignes en dessous (`tr.sub`, numéro 31, 32…), « (sans phase
  partielle) » et « (sans phase) » à la fin ; pas de ligne en double quand l'unique phase partielle porte le nom de sa phase. Lignes des phases sur
  une trame bleu nuit pâle (`--s-nuit3`), phases partielles sur fond blanc (20.10.2026). « Par collaborateur » : du plus d'heures au moins d'heures
  (`sgGrouper`, tri par heures décroissantes, déjà en place) ; colonnes Collaborateur, Heures, Part seulement (Collaborateurs et Saisies retirées le
  20.10.2026, `cs` dans `sgSituationHtml`). « Mois » : choix de l'année dans le titre de la carte (`.sg-an`, variante B choisie parmi 5 le
  20.10.2026 : « Période · 2026 · 2025 … » en texte souligné, l'année choisie en gras soulignée bleu nuit ; années où des heures ont été saisies,
  `sg3_fiche_an`) — une année choisie : tout l'onglet la suit (tuiles comprises, titre « Heures par mois · 2025 »), la règle « Période » n'a
  plus de repère actif ; un clic sur la règle revient à la période (année effacée) ; dans les autres affichages, la période s'applique. « Détail » :
  même présentation pour les collaborateurs (« Tous · Paulo Meireles · … », collaborateurs ayant des heures sur la période, du plus d'heures au
  moins d'heures, `sg3_fiche_col`) — un collaborateur choisi : détail, tuiles et titre (« Saisies · <nom> ») ne montrent que ses saisies. La tuile
  « Collaborateurs » est alors retirée (sans intérêt pour un seul collaborateur, 20.10.2026). Tuile « Saisies » (nombre de saisies) retirée de l'onglet
  (20.10.2026) : Heures saisies, Collaborateurs, Dernière saisie, Coût de revient. Tuiles d'affichage dans l'ordre Collaborateur, Détail, Phase, Mois,
  Activité, Collab. × phase (Collaborateur placé avant Détail, 20.10.2026). Clic sur un collaborateur (affichage Collaborateur ou ligne d'un
  collaborateur dans Collab. × phase, `tr[data-colgo]`) → Détail avec ce collaborateur choisi.
  **Taille des données dans toute l'app (20.10.2026)** : valeurs des tuiles `.nx-kpi .v` et chiffres `.sg-fig .n` à 28 px **en gras** (avant 34 et
  30 px légers ; gras demandé le même jour, aucune valeur ne déborde sur les 11 écrans contrôlés) ; **plus de tuile foncée** (`.nx-kpi.hero` sans
  effet depuis le 20.10.2026 : toutes les données sur fond blanc — Facturé, Honoraires, Mon temps, Temps total… ; les tuiles de navigation
  `.sg-tile.hero` des vues d'ensemble ne changent pas), textes
  `.txt` à 22 px, unités `small` à 12 px ; dates en tuile (`.v.dt` : Dernière saisie, Dernière facture) à la même taille que les chiffres — pour
  qu'une date tienne dans sa tuile. Gardés plus grands à dessein : total de la vue d'ensemble Projets (`.sg-pv-k .v` 48 px), numéro du projet
  dans le titre (`.sg-pnum` 34 px). « Collab. × phase » en arbre (20.10.2026, `sgSituationHtml(…,'croise',{hier})`) :
  chaque collaborateur (trame), du plus d'heures au moins d'heures, puis ses phases en lignes dessous dans l'ordre SIA 102 (`sgSiaCle`), « (sans
  phase) » à la fin ; colonnes Heures, Part (des heures de la période), Saisies. Situation des heures (chapitre Temps) garde le tableau croisé. Barres « Part » des tableaux
  regroupés visibles (`.nx-tbl td .nx-mini-bar`, aussi dans Situation des heures).
  **Numéro du projet : grand numéro et filet (20.10.2026, variante C choisie parmi 4 propositions ; la variante D « cartouche », appliquée
  d'abord, a été remplacée le même jour)** : en-tête du tableau de bord, à la place du pavé bleu nuit (numéro tronqué à 5 caractères) — numéro
  complet en grand (34 px, bleu nuit), filet noir vertical de 2 px, puis le titre (`.nx-hero .sg-pnum` ; empilés sous 560 px) ; les autres
  fiches (contact, collaborateur) gardent leur pavé `.ic`. Numéro en gras (20.10.2026, à la demande).
  **En-tête du projet sur fond jaune pâle (20.10.2026, variante F choisie par Paulo parmi 6 pour mieux séparer le titre des onglets)** :
  numéro, titre, maître de l'ouvrage et frise sur `--s-jaune2` (#FEF6B0), filet noir de 2 px gardé en tête, marges intérieures 16 / 22 px ;
  onglets sur fond blanc 8 px dessous (`.nx-hero:has(>.sg-pnum)`, `+ .sg-onglets`) ; autres fiches inchangées. Copie d'avant :
  `subgestion3/_backup_20261020_2141_avant_entete_jaune/`.
  **Frise du mandat (20.10.2026, proposition F choisie parmi 6)** : ligne sous le maître de l'ouvrage (`.sg-mandat`) — mois de la première heure
  introduite dans l'app (timelog du projet), petite frise bleu nuit (`.sg-frise`), mois de la dernière heure ; durée comptée du premier au dernier
  mois (« 1 an 11 mois », « 5 ans 2 mois ») centrée sous la frise (`.sg-frise em`) ; libellé « Mandat » retiré à la demande (20.10.2026) ; dates exactes et nombre de mois en infobulle ; un seul mois : sans frise ; rien
  sans heure. Remplace « Heures saisies : 04.2024 à 12.2026 », placé d'abord à droite du maître de l'ouvrage le même jour.
  **Tableau de bord = analyse seulement (20.10.2026, Paulo : « le tableau de bord sert à analyser le projet uniquement et pas à travailler »)** :
  `SG_ONGLETS` = Vue d'ensemble, Contrat, Heures, Factures, pour tous les projets. Onglets Projet, Chantier, Faisabilité, Intervenants, Notes &
  tâches et Documents retirés le même jour (leur code reste dans `sgOnglet`, clés projet / chantier / faisa / interv / notes : pour les rétablir,
  les remettre dans `SG_ONGLETS` ; `okP` n'affiche jamais un onglet absent de `SG_ONGLETS`, même mémorisé). Ne plus mettre de module de travail
  (dépôt de fichiers, saisie) dans le tableau de bord : le travail se fait dans la page du projet (`nx-pdom`) et ses domaines. Documents du projet :
  page du projet ▸ Documents = `sgDocsModule(C,p)` (le moteur n'a pas de domaine Documents : « Domaine non utilisé… ») — tous les fichiers par
  dossier, « Ajouter des fichiers » (dossier Général). Description ci-dessous des onglets retirés, gardée pour mémoire :
  **Onglets Projet et Faisabilité, nouvel ordre (20.10.2026)** : `SG_ONGLETS` = Vue d'ensemble, Contrat, Faisabilité, Projet, Chantier, Heures,
  Factures, Intervenants, Notes & tâches (**onglet Documents retiré** : module Documents à la fin de Projet ; onglet mémorisé « docs » → Projet).
  **Projet** : un groupe dépliable par phase partielle SIA des études (`SG_PROJ_PH` 31 Avant-projet, 32 Projet de l'ouvrage, 33 Procédure de demande
  d'autorisation ; libellé de la phase partielle du projet s'il existe) ; dans chacun : PV MO, Présentation client (fichiers), Estimations (calcul des
  coûts du moteur) et Descriptifs & devis (devis du moteur ; pas en 31 Avant-projet : `sans`) classés par phase — collection **`sgdocphase`** {ID
  « <table>:<id> », PROJECT_ID, PHASE} (choix « Phase » sur chaque document, droit « chantier : écriture » ; sans phase → groupe « Estimations et devis
  à classer ») — et, pour 33, le **dossier d'enquête** (`SG_ENQUETE`, comme le dossier « Att_CO » des affaires : formulaire Att_CO, questionnaires
  général et particulier, plan de situation, plans, annexes) ; puis le **module Documents** (tous les fichiers du projet par dossier, `sgDossierLib`,
  tuiles « Ajouter des fichiers » → dossier Général, « Domaine Documents » ; la tuile Documents de la page du projet ouvre Projet, groupe déplié).
  **Chantier** (même code que Projet) : phase **41 Appel d'offres** (déplacée de Projet, mêmes rubriques, fichiers toujours sous le dossier
  « Projet »), Contrôles des coûts, PV de chantier (boutons en tuiles à icône). **Faisabilité** (`sgFaisaOk(p)` : projet classé faisabilité, ou
  depuis le 21.10.2026 UNIQUEMENT un projet relié à un contrat de faisabilité, ou
  documents déjà déposés) : documents de base, études, variantes, présentation au
  client (`SG_FAISA_RUB`). **Projet uniquement de faisabilité** (`sgCatProjet` = faisabilité, d'après le titre) : ni Projet ni Chantier ; le module
  Documents est à la fin de Faisabilité. Fichiers : dépôt du moteur (`ch03aDeposer`, droit « documents : dépôt ») sous
  `ProjectDocuments/Documents/<projet>/Documents/Projet/<n° phase>/<rubrique>` ou `…/Faisabilité/<rubrique>`. Onglets permis au collaborateur ;
  droit d'affichage : documents ou chantier en lecture. Module d'étude de faisabilité (PDF complet) : à concevoir avec Paulo (proposition du
  20.10.2026 : fiche parcelle, contraintes, règlement, potentiel et variantes, existant et polluants, conclusion, PDF A3 paysage).
  Onglet « Intervenants » (20.10.2026) : « Entreprises » (rôle 19) et « Directeur des travaux » (rôle 2) échangent leur place dans cet onglet
  (`ordR`, l'ordre `ROLE_ORD` du moteur reste inchangé ailleurs) ; « Gérer les intervenants » et « Liste d'adresses » en tuiles à icône
  (`.sg-htls.sg-iacts`, comme Heures et Contrat) au lieu de boutons encadrés.
  Onglet « Chantier » (20.10.2026) : rubriques Descriptifs & devis, Contrôles des coûts, Estimations, PV de chantier = titres dépliables
  (`.sg-pgrp` comme les groupes de la page du projet, corps `.sg-cgrp-b`, nombre d'éléments à droite, bouton « Ouvrir » / « PV de chantier »
  dans le corps), toutes repliées à l'arrivée ; celles qu'on ouvre restent ouvertes au retour sur l'onglet (`SG_CGRP`, par projet, jusqu'au rechargement).
  **Phase actuelle, marge bénéficiaire, graphique des phases (19.10.2026)** : `sgPhaseActuelle(p)` = phase (groupe 0 à 8 de la base : 1 Relevé,
  2 Faisabilité, 3 Étude du projet, 4 Appel d'offres, 5 Réalisation…) qui totalise le plus d'heures dans les 30 jours avant la dernière saisie du
  projet, + sous-phase la plus saisie ; affichée dans la tuile du tableau de bord (plus dans son en-tête depuis le 20.10.2026), les données de la page du projet (`nx-pdom`) et une colonne
  de Mes projets. Marge bénéficiaire = facturé HT − coût de revient (`sgRenta`), % du facturé (`sgMargePct`) : données de la page du projet et
  indicateur du tableau de bord (`sgMargeVisible` : pas pour le collaborateur ni finances verrouillées). Tableau de bord ▸ Vue d'ensemble :
  carte « Phases : heures prévues et effectuées » (`sgPhasesGraph`, graphique en barres de type « bullet » : prévu = TIMEBUDGET en fond, effectué
  en bleu nuit, repère de la limite, dépassement en rouge, phase actuelle surlignée, total). Essai du 20.10.2026 retiré le même jour à la demande de
  Paulo (retour au graphique d'origine, phases seules) : phases partielles sous chaque phase (copie dans
  `subgestion3/_backup_20261020_1642_avant_essai_phases_partielles/` = avant l'essai). Démarrage : le dernier écran est rouvert avec
  son paramètre (`sg3_vue_arg`, enveloppe de `go` dans `sg3.js` ; pas pour fx-* ni new / nf: / newaff:).
  **Projet terminé ou archivé (23.10.2026)** : « Terminé » à la place de la phase actuelle (`sgTermine(p)` = états 4 et 5) — tuile du tableau de bord,
  page du projet, Mes projets, Affaires ▸ Gestion (colonne et fiche) — et plus de phase « en cours » surlignée (graphique des phases, Phases contrat).
  « Coût du temps » renommé « Coût de revient » partout dans l'app (fiche projet, Rentabilité des projets, CSV, textes), 19.10.2026.
  **Tableau de bord du projet, collaborateur (19.10.2026)** : onglets `SG_ONGLETS_COLLAB` = Phases contrat, Intervenants, Contrats &
  factures, Chantier, Documents, Notes & tâches (ni Vue d'ensemble ni Temps ; premier onglet permis ouvert d'office) ; les droits s'appliquent
  en plus dans `sgOngletOk` (Contrats & factures : lecture des contrats ou factures — « aucun » par défaut pour le profil collaborateur).
  **Collaborateur : projets « en cours » seulement (19.10.2026)** : `sgCollabSeul()` (profil collab sans droit « projets : tous ») → Mes
  projets sans le choix « Tous mes projets » ni le lien vers la liste complète, toujours filtré sur `SG_ETATS_COLLAB` (configuration, en cours,
  en attente = filtre « En cours ») ; `sgProjetsVisibles` limité aux mêmes états (vue d'ensemble, `nx-listeprojets` sans les filtres Terminés /
  Archivés). Mes projets : numéros sans cadre jaune (`.nx-tbl.sg-mesp .nx-tag.num`).
  **Mes projets, administrateur (21.10.2026)** : tous les projets (« En cours » par défaut, bouton « Tous les projets »), pas seulement ceux de
  son équipe ; chef de projet et collaborateur : projets attribués, comme avant.
  Collaborateur (18.10.2026) : Projets = Mes projets + Tâches seulement (Registre et Suivi & écarts masqués même si ses droits le
  permettent : `SG_VUE_DROIT['aff-gestion'|'aff-controlling']`) ; sa vue d'ensemble = ses projets attribués (« mes projets ») et SES
  tâches (« tâches à faire »). Vue d'ensemble : modules sans le groupe « Tâches » (il reste au menu) ; **menu déroulant « Tâches » (19.10.2026)** à la place de la
  ligne des tâches (`.sg-pv-tk`, fermé à l'arrivée) : fermé = intertitre « Tâches » au style de « Modules » + pastilles verte (En cours)
  et rouge (Urgent) — contour seul à zéro (`.sg-pt.zero`) ; ouvert = les trois listes de l'ancien logiciel en tuiles `.sg-tile`, en colonnes
  comme les modules (pastille à droite du titre), mêmes termes et mêmes états que `ptModuleRows` : En cours
  (« En traitement » de l'ancien logiciel, état 1), Urgent (état 1, marquée urgente), Réglé (état 3), chacune avec son nombre ; tâches des projets visibles en cours (collaborateur :
  les siennes) ; un clic ouvre `taches-encours`, `taches-urgent`, `taches-regle`.
- **Modules Projet et Faisabilité de la page du projet, analyse réglementaire de la parcelle (20.10.2026, bloc 21 de `sg3_plus.js`)** —
  demande de Paulo : « dans le projet, ajouter un module Projet, et Faisabilité lorsqu'il y a une phase de faisabilité ; créer un module qui
  permet d'analyser les règlements applicables à la parcelle, avec une automatisation de recherche sur internet ; pour chaque faisabilité, les
  contraintes et les réponses à donner ». Page du projet (`nx-pdom`) : deux groupes de TRAVAIL en tête — **Projet** (PV MO, Présentation client,
  Estimations, Descriptifs & devis, Dossier d'enquête, Documents) et **Faisabilité** (seulement si `sgFaisaOk(p)` — **depuis le 21.10.2026 :
  UNIQUEMENT un projet relié à un contrat d'honoraires de faisabilité** (`sgContratFaisa` : type « Faisabilité » coché, prestations 4.21
  Faisabilité `c.fais`, ou contrat intitulé « … faisabilité … » ; contrats lus dans le cadre Facturation, page redessinée quand il est chargé,
  `sgFaisaPlusTard`), garde-fou : documents déjà déposés dans Faisabilité ; avant : phase de faisabilité, documents déposés, ou analyse de parcelle existante ; projet uniquement de faisabilité : sans le groupe Projet) avec Parcelle &
  règlements, Documents de base, Études, Variantes, Présentation au client, Fiche de faisabilité (`SG_PMOD`, `SG_PMOD_G`, compteurs
  **Ordre des groupes de la page du projet (21.10.2026)** : Honoraires et facturation, Suivi du projet, Faisabilité, Projet, Chantier, puis
  Équipe et adresses (`SG_PMOD_G` : Faisabilité avant Projet ; les groupes du moteur placés dans le rendu de `nx-pdom`). Groupe « Planification »
  (Planification RH, Analyse de planification RH) retiré de la page du projet le 21.10.2026 (`SG_PDOM_G`) : la planification RH reste dans
  Ressources humaines.
  **Frais du projet (21.10.2026)** : page du projet ▸ Suivi du projet ▸ Frais = `sgFraisModule(C,p)` (au lieu du domaine du moteur, qui n'affichait
  qu'un mois) : tous les frais, choix de l'année « Toutes · 2026 · 2025… » dans la barre (`.sg-fr-an`, comme Factures et Heures ; `sg3_frais_an`),
  mêmes colonnes et actions (editCost / delCost), tri par date décroissante, nombre et total. Le chapitre Affaires garde le domaine d'origine.
  Titres des groupes de la page du projet sans le nombre « n domaines / n modules » (21.10.2026).
  Accueil : mention « Substances Architectes — Gestion » retirée au-dessus de « Bonjour … » (22.10.2026 ; libellé vide de `sgIntro` : la ligne épaisse reste, `.sg-lbl.vide`).
  **« Accueil » renommé « Cockpit » (22.10.2026)** : entrée du menu (`SG_DOM` k « accueil », vue `nx-home`), infobulle du logo, lien « Cockpit ▸ À traiter ».
  ⚠ Facturation a aussi un module « Cockpit » (`fx-cockpit`, tableau de bord des honoraires) : deux entrées du même nom.
  **Affaires ▸ vue d'ensemble (22.10.2026)** = `VIEWS['dom-affaires']`, même présentation que la vue d'ensemble Projets (`.sg-pv`) : en-tête et total en
  grand ; « Par état » (en cours, en attente, terminées, archivées — jauge = part du total, affaires actives ces 30 jours ; clic → liste filtrée) ;
  « Activité » (affaires actives, heures du mois, de l'année, part facturable de l'année — tout le bureau) ; « Modules » en dessous. Le 23.10.2026 :
  libellé « Affaires » (et son filet) au-dessus du titre retiré à la demande ; la tuile « Affaires actives » ouvre la Liste des affaires (Controlling archivé).
  **Affaires ▸ Gestion amélioré (22.10.2026, choix de Paulo)** = `VIEWS['affd-gestion']` (menu « Liste des affaires » depuis le 23.10.2026) : barre d'outils de l'ancien écran reprise telle quelle — réduite le 23.10.2026 à
  la demande à Nouveau projet, Éditer, Supprimer, Filtre et recherche (Intervenants, Configuration, Subdivisions, Modèles, Documents, Fonctions retirés ; fenêtres du moteur gardées) —,
  colonnes Catégorie, Phase actuelle (feuille d'heures), Dernière saisie, Heures 30 j, point d'activité (au lieu de « Actif ») ; fiche de l'affaire
  sélectionnée à droite (état, MO, dates, phase, heures, équipe, contrats reliés ; Éditer, Intervenants, Page du projet, Tableau de bord).
  Sous le résumé : fiche complète de l'affaire en lecture (`sgFicheAffaire` : Affaire, Genres d'affaire, Délais, Adresses, Références, Paramètres de
  saisie — rubriques de « Éditer l'affaire », champs vides omis ; 22.10.2026). Fiche projet = fenêtre à droite (en-tête bleu nuit, × pour fermer), ouverte en
  choisissant une affaire ou par le bouton « Fiche projet » de l'en-tête, qui dans cet écran ne quitte plus la liste (`SG_AG.ouvrir`).
  **Fiche refaite le 23.10.2026 (« améliorer la fiche affaire »)** : barre bleu nuit (sans numérotation « 84 / 87 », retirée à la demande le même jour) = Éditer,
  Page du projet, Tableau de bord (icônes), × — flèches ‹ › (affaire précédente / suivante) et bouton « Attribuer les intervenants » retirés de la barre à la demande
  le même jour (les intervenants restent dans la barre de la liste ▸ Intervenants ; ⌥↑ ⌥↓ change toujours d'affaire, `SG_AG.aller`, ordre affiché de la liste `AF.g.view`) ;
  en-tête jaune pâle comme le tableau de bord du projet (grand numéro et filet, titre — un clic sur le numéro ou le titre ouvre le projet comme Mes
  projets, page du projet `nx-pdom`, même jour —, statut, catégorie, maître de l'ouvrage, frise des heures —
  `sgFriseHeures(T)`, fonction commune avec le tableau de bord) ; puis, dans l'ordre demandé par Paulo : **fiche de l'affaire juste sous le
  titre** (`sgFicheAffaire` : sans numéro, désignation, statut ni type d'affaire, sans la rubrique Délais — retirés à la demande le même jour —, rubriques vides omises, « identique à l'adresse d'affaire », paramètres de saisie en
  petit tableau), **Contrats d'honoraires** (`sgAgContrats` : par contrat — **étendue à la place de « Contrat »** (`sgContratEtendue`, `SG_ETENDUE`, même jour — d'abord « Enquête · Contrat », puis le mot « Contrat »
  retiré à la demande ; « · Avenant » gardé pour un avenant ; sans étendue : « Contrat » / « Avenant » — : d'abord le **« Statut du contrat »
  de Facturation** (`c.statutContrat` : Faisabilité, Expertise, Avant-projet, Projet, Enquête, Appels d'offre, Exécution, DA = direction
  architecturale, Mandat complet), sinon **« Mandat complet » si les prestations SIA font 100 %** (somme des % ≥ 99,5 ; demande du même jour), sinon dernière
  phase partielle du contrat — 31 Avant-projet, 32 Projet, 33 Enquête, 41 Appel d'offres, 51–53 Exécution ; sans phase : Faisabilité si contrat de
  faisabilité, sinon mots de l'intitulé ou du code — `SG_ETENDUE_MOTS` : expertise, demande d'autorisation / enquête, appel d'offres, concours,
  avant-projet, direction des travaux / « .DT » —, signalé en infobulle ; liste des phases en infobulle, ligne « Phases » retirée), Contrat / Avenant, état Brouillon / Envoyé / Signé le … / Terminé /
  Annulé, date du contrat, « Signé le », type de rémunération, phases SIA, honoraires HT / TTC, tarif horaire brut, rabais, honoraires facturés TTC et % (`_ttc`) et frais facturés TTC (`_fttc`, sinon `fttc`) séparés — demande du même jour —, nombre de factures,
  versions, « Ouvrir » le PDF ; montants masqués si finances verrouillées ; contrats dans l'ordre chronologique — premier contrat, puis le 2e… (date du contrat,
  annulés compris, sans date à la fin ; demande du même jour) ; **chaque contrat se réduit** d'un clic sur son
  en-tête — une ligne de résumé type · TTC, sans la date (retirée à la demande) —, « Tout réduire / Tout déplier » dans le titre dès deux contrats, contrats réduits mémorisés
  `sg3_ag_ctr_red`, même jour), Heures (tuiles : heures saisies avec jauge et % des
  heures prévues, ces 30 jours, phase actuelle, dernière saisie), **Équipe** (`sgEquipeAffaire` : TOUS les collaborateurs attribués à l'affaire —
  intervenants dont la personne est un collaborateur, comme Mes projets —, même sans heure, + « hors équipe » pour ceux qui ont saisi des heures
  sans être attribués ; fonction de l'intervenant ; « a quitté le bureau »); **clic sur une personne = « Rapport des heures »** de ce collaborateur sur l'affaire, en fenêtre (`sgRapportHeuresCollab(p,sid)`,
  même jour) : tuiles heures saisies, dont facturables, ces 30 jours, première et dernière saisie ; affichage Par phase (SIA 102, phases partielles
  dessous) · Par mois · Détail (`sg3_rap_vue`), années « Toutes · 2026… », CSV, Imprimer, bouton « Fiche du collaborateur »). Copie d'avant : `subgestion3/_backup_20261023_avant_fiche_affaire/`.   **Éditer l'affaire refait pour SUBGestion 3 (23.10.2026, « optimiser pour clarifier »)** : `sgEditAffaire(p)` remplace `editProject` du moteur
  (`editProject=sgEditAffaire`, fin du bloc 20 ; DeltaSub.html seul garde l'original) — mêmes valeurs par défaut, contrôles (numéro
  obligatoire et unique, signalé dans le champ) et enregistrement (project + project_projectkind, vérifié : enregistrer sans rien changer ne modifie
  rien) ; un seul formulaire avec sommaire à gauche (rubrique visible surlignée) au lieu de 6 onglets, en-tête jaune pâle (numéro et désignation
  en direct), libellés au-dessus des champs : Identification, Statut (statut seul : type Externe / Interne et « Phase en cours » retirés à la demande le même jour — ISINTERNAL
  et CURRENTPROJECTPHASE_ID inchangés ; la phase actuelle est dans la fiche projet), **Collaborateurs** (même jour, demande de Paulo « attribuer
  les collaborateurs à l'affaire » ; « les autres intervenants du projet seront intégrés plus tard dans le projet » : collaborateurs du bureau
  seulement) — collaborateurs à cocher (initiales, nom, heures déjà saisies sur l'affaire) : **affaire existante = tous les collaborateurs, actuels et
  anciens, en une seule liste par nom** (ancien : « A quitté le bureau » en infobulle) ; **nouvelle affaire = collaborateurs actuels seulement** (demande de
  Paulo, même jour) ; coché = intervenant « Collaborateurs » (rôle 12 : RESPCONTACT_ID = `staff.PERSON_ID`, CONTACT_ID = `staff.COMPANYCONTACT_ID` =
  Substances Architectes), le lien que lisent Mes projets, l'équipe de la fiche affaire, le Controlling (`ctlStaffs`) et le serveur du NAS ;
  décoché = ses enregistrements rôle 12 de l'affaire supprimés ; lié par un autre rôle : coché et grisé (à modifier dans les intervenants) ;
  styles `.sg-ep-col*`), Adresses (**même jour, demande de Paulo** : `sgAdressesAffaire(p,D,o)` — adresse d'affaire et **maître de l'ouvrage** (nouvelle carte)
  repris du contrat ou de l'offre Facturation le plus récent qui les donne (`padr`/`ploc`, client `nom`/`adr`/`loc`), sinon à choisir (adresse d'affaire
  = CONTACT1_ID ; MO = intervenant « Maître d'ouvrage » rôle 8, créé ou mis à jour à l'enregistrement) ; **adresse de facturation automatique** =
  nom du MO + « p.a. Substances Architectes Sàrl » + adresse du bureau (`sgBureauAdresse`, annuaire) ; **adresse de livraison retirée** (= adresse
  d'affaire, CONTACT3_ID inchangé) ; **adresse retour des offres (ex-« lieu de dépôt des offres », renommée à la demande) = Substances Architectes, identique à l'adresse de facturation** (automatique,
  sans MO : adresse du bureau ; CONTACT4_ID plus utilisé ; même jour) ; cartes d'Éditer l'affaire sans étiquette de provenance (retirée
  à la demande ; la note sous l'adresse l'indique) ; mêmes règles dans la fiche de l'affaire, `sgFicheAdresses` ; les modèles
  d'impression gardent les adresses enregistrées `projectContact1..4` ; cartes Choisir… / Retirer ; « Choisir… » = fenêtre `sgChoisirAdresse` du même jour au
  lieu du navigateur d'adresses du moteur : recherche immédiate nom / société / rue / localité, filtre Tous / Sociétés / Personnes, suggestions sans
  recherche — adresses déjà utilisées dans l'affaire, intervenants avec leur rôle —, adresse complète sur chaque ligne, aperçu à droite, ↑ ↓ /
  Entrée / double-clic ; styles `.sg-ca-*`), Genres d'affaire (en deux temps comme dans l'ancien logiciel, même jour : 1. groupe d'affaire — nombre de genres
  cochés ; liste complète des groupes, sans barre de défilement depuis le 23.10.2026 au soir —, 2. genre du groupe à cocher ; étiquettes « groupe · genre » au-dessus, × pour retirer ; la recherche a été retirée), Saisie des heures et
  des frais (petit tableau des champs obligatoires ; champ « Monnaie » retiré à la demande le 23.10.2026 — CURRENCY gardé, nouvelle affaire en CHF,
  `SG_EP_RETIRES`). Styles `.sg-ep-*` (sg3.css). Copie d'avant :
  `subgestion3/_backup_20261023_avant_editer_affaire/`.
  **Rubriques Délais, Caractéristiques, Références et Autres réglages retirées (23.10.2026, demande de Paulo : « pas nécessaire à la création de
  l'affaire », éléments peut-être traités plus tard dans l'affaire ; Délais : on affichera plus tard à la place les éléments du planning du projet,
  avec un planning intentionnel par phase)** : champs gardés dans la base (affaire existante : valeurs inchangées, `readK` ne lit que les champs
  affichés ; nouvelle affaire : vides comme avant), liste `SG_EP_RETIRES` (clé, libellé) gardée pour les réutiliser ailleurs dans l'app. Encore
  affichés sans être modifiables : District (`LOCATION` = lieu de l'affaire : Mes projets, page du projet, en-tête du tableau de bord), début / fin
  du projet, Tri, Caractéristiques et Références de la fiche de l'affaire. Copie d'avant : `subgestion3/_backup_20261023_2101_avant_editer_affaire_collaborateurs/`.
  **Phases, activités et tarifs de l'affaire — module gardé, NON branché (23.10.2026, bloc 24, `subgestion3/sg3_affaire.js`)** : demande de Paulo
  « intègre l'organisation des activités dans la fenêtre d'édition de l'affaire, également les tarifs et la configuration des phases » ; proposition A
  (« tableaux sur place ») choisie sur maquette parmi 3 (A tableaux, B frise SIA + matrice activités × collaborateurs + échelle des tarifs, C modèle du
  bureau), réalisée et testée, puis retirée de « Éditer l'affaire » le même jour à la demande (« ces éléments seront traités dans d'autres chapitres ;
  conserve-les pour pouvoir les réutiliser plus tard »). `sgEpOrga(p,{numero,equipe})` → {brancher(corps,D), valider(), ops(idProjet), majEquipe(),
  majNumero()} : brouillon des tables du moteur (projectphase / projectsubphase, projectactivitygroup / projectactivity / projectactivity_staff,
  projectrategroup / projectrate), rien n'est écrit avant l'enregistrement de la fenêtre qui l'accueille et rien si rien n'a changé ; budget d'une phase
  = somme de ses phases partielles dès qu'on en modifie une ; « Reprendre les budgets du contrat » (honoraires HT répartis selon les % SIA, heures =
  honoraires ÷ tarif net modifiable) ; activités du dossier standard ; autorisations selon la règle de la feuille d'heures (coché sur au moins une
  activité d'un groupe = ne voit que celles-là, sur aucune = les voit toutes) ; taux datés ; suppressions refusées comme le moteur ; nouvelle affaire
  pré-remplie du dossier standard (sans phase ni activité, aucune heure ne peut être saisie). Styles `.sg-epo-*` dans sg3.css. Mode d'emploi en tête du
  fichier. Concaténé par `construire.py` après `sg3_annuaire.js`. Copie d'avant : `subgestion3/_backup_20261023_2131_avant_phases_activites_tarifs/`.
  **Fenêtres du moteur dans le menu de gauche (23.10.2026, demandes de Paulo)** : Équipe ▸ **Gestion des utilisateurs** (`nx-utilisateurs` :
  comptes activés / désactivés, tableau Nom, Identifiant, Collaborateur, Profil SUBGestion, État ; bouton « Gérer les comptes… » = `ch08bUserAdmin`,
  droit « gestion des utilisateurs » `userAdmin`), Réglages ▸ **Paramètres système** (`nx-parametres` → `ch08aSysPrefs`, droit `admin`) et Réglages ▸
  **Préférences** (`nx-preferences` → `ch08cPreferences`, tous). Fabrique commune `sgVueFenetre(o)` (sg3_plus.js, avant Profils et accès) : écran qui
  dit à quoi sert la fenêtre et l'ouvre — d'office quand on vient du menu, pas à la reprise de session au démarrage (`sgFenPret`, 4 s) ; droits du
  menu par `SG_VUE_DROIT`. Liste des affaires : bouton « Fiche projet … » de l'en-tête retiré (enveloppe de `sgCtxSync` pour `affd-gestion` ; un clic
  sur l'affaire déjà choisie rouvre la fiche fermée). Chapitre « Administration » demandé puis remplacé par ces ajouts (Paulo, même soir) ; créé finalement le 24.10.2026 (« Admin », voir plus bas).
  **Chapitre Temps : visuel « épuré » (23.10.2026, bloc 25, `subgestion3/sg3_temps.js` + fin de `sg3.css`)** — demande de Paulo « dans le menu Temps
  revoir le visuel de toutes les pages » ; proposition A choisie sur maquette parmi 3 (A épuré, B fiche du collaborateur, C pleine largeur), « mais
  améliore la colonne collaborateur ». Styles limités à `html[data-vdom="temps"]` (Feuille d'heures, Rapports de temps, Disponibilités, Notes de frais,
  Rapport des notes de frais ; Situation des heures garde son écran) : barre d'outils en texte (choix `.ib.on` souligné en bleu nuit, `.ph2` qui passe à
  la ligne — plus de chevauchement dans Notes de frais), tableaux `table.g` à filet noir, trimestres / semestres / totaux sur trame bleu nuit pâle
  (`.sgt-tot`), résumé du rapport (`.kv`) en tuiles, totaux des frais en pied. Colonne des collaborateurs (300 px) : initiales en pastille (`sgtIni` :
  INITIALS, sinon 1re lettre du prénom + 2 premières du nom), nom, 2e ligne = heures de l'année arrondies et dernière saisie (pages de frais : notes et
  montant de l'année ; `sgtStats`, cache 5 s) ; ancien collaborateur grisé « a quitté le bureau le … ». Contenu des cellules refait après chaque dessin
  du moteur (MutationObserver sur `#main`, `td[data-sgt]`) ; sélection, tri et données inchangés ; l'agenda de la Feuille d'heures n'est pas retouché.
  Vérifié dans la charte, Papier et encre et Studio nocturne. Copie d'avant : `subgestion3/_backup_20261023_2225_avant_temps_epure/`.
  **Temps ▸ Contrôle des heures (24.10.2026, bloc 26, `subgestion3/sg3_controle.js` + styles `.sgc-*` en fin de `sg3.css`)** — demande de Paulo
  « dans temps, ajoute le contrôle des heures » (l'ancien logiciel contrôlait les heures affaire par affaire, dans le Controlling archivé le 23.10.2026).
  Écran `nx-controle`, menu Temps juste après la Feuille d'heures ; droits du Controlling (profil autre que collaborateur et heures « de ses projets » au
  moins, `SG_VUE_DROIT['nx-controle']`). Période Semaine | Mois (‹ ›, Cette semaine / Ce mois), affichage Par collaborateur | Par projet, réglages
  `sg3_controle` {mode, d, vue}. **Par collaborateur** : heures par jour (mois : par semaine ISO, jours du mois seulement) ; cellule rouge = inscription(s)
  refusée(s), verte avec coche = tout approuvé, « vac. » = vacances seules ; jour ouvré passé sans saisie = tiret rouge (entre JOININGDATE et
  QUITTINGDATE, `sgcEngage` ; seulement avec le droit « toutes les heures ») ; mois : semaine soulignée de rouge s'il y manque un jour ; week-ends et fériés
  sur fond gris, aujourd'hui en jaune pâle ; Total, Prévues (jusqu'à hier, `hrMaps` comme les Rapports de temps), Écart (saisies jusqu'à hier − prévues),
  État (n à contrôler = Saisi + Corrigé, n refusée(s), Approuvé) ; sous le nom : « complètes jusqu'au » (TIMELOGCOMPLETEDDATE) et « bloquées jusqu'au »
  (TIMELOGFREEZINGDATE) quand la date touche la période ; boutons **Contrôler** (fenêtre de l'ancien logiciel sur la semaine du collaborateur, toutes
  affaires : clic, Cmd-clic, Maj-clic, puis Approuver / Refuser / Réinitialiser / Tout sélectionner, double-clic = modifier) et **Approuver** (ses
  inscriptions à contrôler de la période, après `sgConfirm`) ; « Tout approuver » dans le titre de la carte ; un clic sur un jour ouvre sa semaine.
  **Par projet** : projets ayant des heures dans la période (collaborateurs, heures, état, dernière saisie) ; « Contrôler » = la fenêtre d'origine, par
  affaire. CSV sans la colonne des boutons, noms en toutes lettres. Zone de travail < 1100 px : boutons réduits à leur icône. Moteur (`DeltaSub.html`,
  reconstruire aussi v1 et v2) : `ctlTimeCheck(p,o)` — sans affaire (`p` null) avec `o.staffs`, `o.peut(r)` (inscriptions contrôlables, les autres en gris),
  `o.staff`, `o.date`, `o.titre`, `o.boutons` (Approuver / Refuser / Réinitialiser / Tout sélectionner dans la barre) ; sans options : fenêtre d'origine
  inchangée (Réglages ▸ Archives · Controlling). États TIMELOGSTATECODE : 0 Saisi, 1 Refusé, 2 Corrigé, 3 Approuvé (le collaborateur ne peut plus la
  modifier). Base de test : 190 inscriptions approuvées sur 37'622 (la validation était peu utilisée). Visuel Mac : filet fin du total, états en capsules
  (`visuels_variantes.css`). Copies d'avant : `subgestion3/_backup_20261024_0949_avant_controle_heures/`,
  `DeltaSub_backup_20261024_0949_avant_controle_heures.html`, `SUBGestion3_backup_20261024_0949_avant_controle_heures.html`.
  **Graphisme de la Feuille d'heures (même jour, demande de Paulo « corriger contrôle des heures pour correspondre à la feuille d'heures
  graphiquement »)** : plus d'introduction ni de cartes ; bandeau jaune (`sgfh-tete` : semaine « S43 » ou mois « Oct » en grand, « Contrôle des heures »,
  « Tout le bureau » / « Heures de mes projets », nombre de collaborateurs et d'inscriptions à contrôler ; à droite la période et Par collaborateur |
  Par projet), chiffres `sgfh-kp` (heures saisies + jauge sur les prévues, heures prévues, écart à ce jour, à contrôler, refusées), barre d'outils du
  moteur sous les chiffres (`VIEWS['nx-controle'].tools()` : Semaine | Mois, Aujourd'hui, ‹ période ›, **Fonctions** à droite = Tout approuver…,
  Exporter en CSV ; `#tools` déplacé comme dans la Feuille d'heures, rendu par `sgfhOutilsRendre`), tableau sous un filet noir (`.sgc-tab`, défile dans
  `.sgc-corps`), jours en tête comme l'agenda (nom, date en grand), pastilles ✓ / ! / ↺ dans les cellules et l'état, légende `sgfh-leg`. Copie d'avant :
  `subgestion3/_backup_20261024_avant_controle_graphisme/`.
  **Fenêtre « Contrôler » au graphisme et à l'organisation de la feuille d'heures (même jour, Paulo : « reproduire le graphisme et l'organisation de
  la feuille d'heures, améliorer si nécessaire »)** : `sgcFenetre(p,o)` (sg3_controle.js) remplace la fenêtre du moteur pour « Contrôler » (par
  collaborateur et par projet ; `ctlTimeCheck` reste tel quel pour Archives · Controlling, ses options SG3 du matin — staffs, peut, staff, date,
  titre, boutons — ne servent plus). À gauche les collaborateurs (initiales, heures de la semaine, à contrôler, refusées ; ⌥↑ ⌥↓) ; à droite en-tête
  jaune (collaborateur, semaine, heures saisies / prévues, à contrôler), barre en texte (Aujourd'hui, « ‹ Semaine › », ‹ année › ; nombre choisi,
  Approuver, Refuser, Réinitialiser, Tout sélectionner ; Réglages), semaine construite comme `hsWeek` puis habillée par `sgfhHabiller` (couleurs par
  projet, pastilles, affaire en entier, heures, phase, remarques) ; légende et gestes dans le pied. Gestes d'origine : clic, Cmd / Maj-clic, clic
  droit (Approuver, Refuser, Réinitialiser, Tout sélectionner, Modifier), double-clic = `hsEdit`, Cmd-A ; pas de glisser. Inscriptions non
  contrôlables en gris (option). Réglages = `CTL_W.o` (`ds_ctw_opts`). Par projet : sans heures prévues ni jours « aucune » (`sgfhDonnees(o)` :
  staff, a, b, filtre, O, prevues). Tenue à jour par `DS.on` (`SGC_F`). Classes `.sgc-f*`, `.dlg.sgc-dlg` (titre de fenêtre masqué, voile à 3vh).
  Mots longs des saisies coupés avec trait d'union (`hyphens:auto`, page `lang="fr"`) au lieu de `overflow-wrap:anywhere` (« Créatio-n »).
  Copie d'avant : `subgestion3/_backup_20261024_1826_avant_fenetre_controle/`.
  **Temps ▸ Feuille d'heures, nouvelle présentation (24.10.2026, bloc 27, `subgestion3/sg3_feuille.js` + styles `.sgfh-*` en fin de `sg3.css`)** —
  demande de Paulo « améliore la feuille d'heures, plus graphique ; la colonne collaborateur n'est pas nécessaire ; le nom du collaborateur en haut puis
  la feuille d'heures ; avant de modifier, fais une copie dans Réglages » ; cinq variantes maquettées, charte seulement (A Agenda, B Grille projets × jours,
  C Frise horaire, D Calendrier du mois, E Journal ; maquette `subgestion3/_backup_20261024_maquette_feuille_heures/proposition_fh.js`, page
  `proposition_fh.html` de l'aperçu) ; choix : **A**, « pouvoir glisser les heures, qu'elles ne se superposent surtout pas, les mêmes fonctions que la
  version actuelle (option-clic pour copier…), pas de nouvelle fonctionnalité », et **garder le Journal** « pour information au collaborateur ».
  **Barre d'outils (même jour, demandes de Paulo)** : placée **sous les chiffres** (l'élément `#tools` est déplacé dans la page, `.sgfh-outils` ; la barre
  du haut `#nx-sub` est masquée par `html.sgfh-on` ; `sgfhOutilsRendre()` remet `#tools` dans `#bar` avant tout changement d'écran, dans l'enveloppe de
  `go`) et **réduite** à Semaine | Mois, Aujourd'hui, semaines, année et **Fonctions tout à droite** (`V.tools` filtre les groupes Nouvelle saisie /
  Modifier / Supprimer et Approuver / Refuser / Réinitialiser — restent glisser, double-clic, clic droit, Suppr ; l'archive garde la barre complète).
  `VIEWS['h-saisie']` garde son `refresh` et toutes les fonctions du moteur : la semaine est dessinée par **`hsWeek` du moteur**
  puis seulement habillée (`sgfhHabiller`, `sgfhBloc`) — glisser sur une plage libre = nouvelle saisie, ⌥ + glisser = copie de la saisie choisie,
  glisser une saisie = la déplacer, bord inférieur (`.tlrs`) = sa fin, Cmd / Maj = sélection, double-clic, clic droit, Suppr, Cmd-A, Échap,
  chevauchements refusés (`hsOverlap`), réglages personnels (titre affaire / durée, activités, phases, commentaires, week-end, agrandir…) ; Mois = `hsMonth`.
  Nouveau rendu (`render` / `draw`) : en-tête jaune pâle au nom du collaborateur (initiales en grand, **trait vertical sur toute la hauteur, de
  « Feuille d'heures » à la ligne d'informations**, demande du même jour ; ▾ = changer de collaborateur, liste `ch08bMyStaffs`, à la place de la colonne ;
  au bureau depuis, heures complètes jusqu'au, saisie bloquée jusqu'au), période, boutons Agenda | Journal (semaine ; `sg3_fh_vue`) ; chiffres de la période
  (heures saisies + jauge, prévues `hrMaps`, écart à ce jour, vacances restantes `hrHoliday`, projets) ; jours (nom, date, total / prévues, jauge, férié,
  coche si tagué) ; saisies colorées par projet (`SGFH_PAL`, couleur gardée d'une semaine à l'autre, projet interne en gris, vacances hachurées), état en
  pastille (✓ approuvée, ! refusée, ↺ corrigée) **à gauche du nom de l'affaire**, **nom de l'affaire toujours en entier** (numéro + désignation, à la
  ligne si besoin — `.nom .nt` ; seules les saisies de moins d'un quart d'heure gardent une ligne coupée ; même jour, demande de Paulo ; idem dans le
  Journal et la répartition), **contenu d'une saisie dans un ordre fixe** (même jour, Paulo : « le nom de l'affaire doit être indiqué tout en haut et
  ensuite les heures, puis la phase et ensuite les remarques » ; `sgfhLignes`, commune avec la fenêtre « Contrôler ») : affaire, heures (de – à, durée
  à droite, à la ligne si la colonne est étroite), phase · phase partielle, remarques ; ce qui dépasse est coupé, l'infobulle donne tout (avec l'activité
  et l'état) ; réglages « Afficher les activités / phases / commentaires » et « Titre : … » retirés du menu Fonctions (`sgfhMenuSans`, l'archive les
  garde) ; `sgfhPhase` passe l'enregistrement à `sgPhNom` (avec un simple nom, la phase s'affichait « Phase », Journal compris). Copie d'avant :
  `subgestion3/_backup_20261024_1652_avant_ordre_saisies/`. Saisie verrouillée atténuée ; saisies qui se chevauchent (anciennes données) côte à côte
  (`sgfhCouloirs`, quart d'heure minimal compris), jamais l'une sur l'autre ; ligne de l'heure actuelle ; répartition par projet à droite + rappel des
  gestes. **Journal** (semaine) : une carte par jour (anneau saisies / prévues, saisies lisibles, + = nouvelle saisie ce jour, clic = `hsEdit`), résumé à
  droite.
  **Journal dans le menu de gauche, icônes retirées (24.10.2026 au soir, Paulo : « déplace le journal dans le menu de gauche et supprime les logos de
  la feuille d'heures »)** : Heures = Feuille d'heures + **Journal** (`h-journal` = `Object.create(VIEWS['h-saisie'])`, `journal:true` : même rendu,
  rafraîchissement et clic droit ; en-tête « Journal » ; barre sans Semaine | Mois, `HS.mode` mis à « sem ») ; le choix Agenda | Journal de l'en-tête
  et `sg3_fh_vue` supprimés (la feuille = agenda ou mois) ; les boutons de la barre et les menus du moteur qui rouvrent `go('h-saisie')` restent dans
  le Journal (clic capturé dans `#tools` / `.menu`, drapeau `SGFH.j`, enveloppe de `go`) ; icônes des cinq chiffres (`sgfhKpis`) retirées.
  Copie d'avant : `subgestion3/_backup_20261024_2059_avant_journal_menu/`. Puis (même soir) : entrée et en-tête renommés **« Journal des heures »**.
  **Chapitre « Archives » (24.10.2026, Paulo : « créer un menu archive, laisse-le vide pour le moment »)** : domaine `archives` en bas du menu (après
  Configuration), icône `archive` (ajoutée à `NXI`), `vide:1` = affiché à l'administrateur même sans module (`sgSide`) ; vue d'ensemble « Aucun module
  pour le moment » ; masqué aux autres profils (aucun écran permis). Pas encore dans les domaines protégés par code (à décider quand il aura des
  modules). Visuel Mac #8E8E93, Studio nocturne : carte sable. Les « Archives · … » restent pour l'instant dans Configuration.
  Même soir : **Projets ▸ Suivi & écarts (`aff-controlling`) déplacé dans Archives** (demande de Paulo) ; Projets = Mes projets, Registre, Tâches ;
  droits inchangés (`SG_VUE_DROIT['aff-controlling']` : chef de projet oui, collaborateur non — le chef de projet voit donc le chapitre Archives) ;
  le menu d'actions du projet qui l'ouvre (`go('aff-controlling')`) marche toujours.
  Puis **Projets ▸ Registre (`aff-gestion`) déplacé dans Archives « pour le moment »** (demande de Paulo) : Projets = Mes projets + Tâches ; Archives
  = Suivi & écarts, Registre. Le Registre reste le seul écran du menu qui donne la configuration d'une affaire (phases, activités, tarifs,
  séances, frais), les intervenants, les subdivisions et les modèles (barre complète dans la page) ; droits inchangés (`SG_VUE_DROIT['aff-gestion']`).
  **Contacts ▸ « Toutes les adresses » renommé « Liste des adresses »** (même soir, demande de Paulo ; `adr-liste`, menu, lien du menu de la liste de
  l'Annuaire et son infobulle) ; les autres « toutes les adresses » (CFC / propriétés d'un contact, choix des participants, navigateur du moteur) gardés.
  **Les quatre tuiles du Controlling recopiées dans Administration (même soir, Paulo : « déplacer dans Administration : Contrôle des heures
  d'affaires, Critères d'analyse des heures, Contrôle des frais, Critères d'analyse des frais — copier ces éléments comme éléments cliquables dans le
  menu de gauche »)** : entrées `adm-ctl-heures`, `adm-ana-heures`, `adm-ctl-frais`, `adm-ana-frais` (ordre : Contrôle des heures, Contrôle des heures
  d'affaires, Critères d'analyse des heures, Situation des heures, Contrôle des frais, Critères d'analyse des frais) ; fin de sg3_controle.js
  (`SG_ADM_CTL`) : chaque écran = liste des affaires (état, En cours d'office, recherche ; heures ou frais, à contrôler, refusées, dernière saisie ;
  de la plus récente activité à la plus ancienne ; réglages `sg3_adm_ctl`) ; clic sur une affaire → `sgcFenetre(p,{date: semaine de sa dernière
  saisie} et son auteur — staff)`, `ctlAnalyse(p,'timelog'|'projectcost')`, `ctlCostCheck(p)` (après `CTL_F.y/m/staff` = mois et auteur de la dernière
  note de frais). Relecture du code par 2 relecteurs + vérification adverse (workflow) : 4 défauts corrigés (collaborateur et mois d'ouverture,
  focus de la recherche gardé au redessin, colonne « Refusées » triée comme nombre — « ! » par CSS `.sg-admctl-ref`). Redessin sur place (`redessiner`, sans `go` : ni historique ni retour en
  haut quand une saisie arrive du bureau). Les tuiles d'origine restent dans Archives ▸ Suivi & écarts. Administrateur seulement (chapitre).
  **« Fonctions » retiré de la barre et passé au clic droit (24.10.2026 au soir, Paulo : « supprimer les Fonctions et les ajouter au clic droit »)** :
  barre = Semaine | Mois, Aujourd'hui, semaines, année ; `sgfhFonctions()` = menu ⚙ du moteur filtré (`sgfhMenuSans`) — clic droit sur une saisie
  de l'agenda : menu du moteur (son `popMenu` remplacé le temps de l'appel par `sgMenuAt`) + sous-menu « Fonctions » ; ligne du Mois : Approuver,
  Refuser, Réinitialiser, Editer, Supprimer, « Fonctions », copie ; carte du Journal : Editer + « Fonctions » ; ailleurs dans la feuille : les
  fonctions elles-mêmes. Le Contrôle des heures garde son bouton Fonctions à droite (règle CSS limitée à `.sgfh.sgc`).
  **L'ancienne feuille d'heures** (Réglages ▸ Archives · Ancienne feuille d'heures, `h-saisie-archive`, rendu d'origine du moteur) :
  **supprimée définitivement le 24.10.2026 au soir (demande de Paulo)** — vue, entrée du menu, drapeau `SGFH.redir`, enveloppe de `hsMark` et
  clavier retirés ; l'enveloppe de `go` de sg3_feuille.js ramène encore `h-saisie-archive` (session, récents) vers `h-saisie`. Aucune donnée
  propre (mêmes heures). « Archives · Feuille d'heures » marqué F (ancien registre de Facturation) est autre chose et reste. Copie du code d'avant :
  `subgestion3/_backup_20261024_1910_avant_suppression_ancienne_feuille/`.
  **Temps ▸ fenêtre « Éditer l'inscription » / « Nouvelle saisie » redessinée (24.10.2026, bloc 28, `subgestion3/sg3_inscription.js` + styles
  `.sgie-*` en fin de `sg3.css`)** — demande de Paulo « revoir le graphisme de Éditer inscription, améliorer et rendre plus intuitif ». Toujours la
  fenêtre du moteur `hsEdit` (enveloppée : `sgieHabiller(dlg)` après son ouverture) : mêmes champs, mêmes six listes, mêmes règles (affaire, groupe et
  activité obligatoires ; phase / ouvrage / commentaire selon l'affaire ; chevauchements ; période verrouillée ; phase partielle terminée ; dernière
  affaire reprise), mêmes boutons (Supprimer — à gauche, en rouge —, Annuler, OK ; « OK & continuer » et « OK & jour suivant » retirés le même jour
  à la demande). Les éléments du moteur sont
  déplacés tels quels (gestionnaires gardés) dans l'ordre de la saisie : en-tête jaune pâle (initiales, trait vertical, collaborateur, **résumé tenu à
  jour** : jour · heures · durée, puis projet › groupe › activité › phase ; « Temps de travail | Vacances » en boutons qui cochent les boutons radio
  d'origine), **1 Quand** (jour ‹ › et date, De – à, Durée), **2 Projet et activité**, **3 Phase** (phase, phase partielle, ouvrage, « Effacer »),
  **4 Détails** (commentaire — indication « obligatoire pour ce projet » —, statut) ; **« Facturable » retiré le même jour** (Paulo : « le
  collaborateur ne doit pas indiquer lui-même si elle est facturable ») : case du moteur cachée — saisie existante inchangée, nouvelle saisie facturable
  (défaut du moteur) ; à changer par le contrôle (Critères d'analyse des heures ▸ « Modifier le statut Facturable ») ; idem dans la Saisie de temps
  rapide (`sgSaisieRapide`, facturable d'office) ; au-dessus de chaque liste, le choix en cours ou
  « à choisir » en rouge et « obligatoire » selon l'affaire choisie ; en-têtes des listes masqués ; Vacances : sections 2 et 3 grisées ; inscription
  verrouillée : lecture seule. ⚠ Ne pas employer les classes du moteur (`.ph`, `.pa`…) : sections `.sgie-qd|pa|ph|dt`. DeltaSub.html seul garde la
  fenêtre d'origine.
  **Menu Temps réduit (24.10.2026, demande de Paulo « déplacer dans le menu Réglages »)** : Temps = Feuille d'heures et Contrôle des heures ;
  Rapports de temps, Disponibilités, Situation des heures, Notes de frais et Rapport des notes de frais rangés dans Réglages, sous-menu dépliable
  « Temps » (avant les Archives ; items `grp:'Temps'`, `dom:'temps'`). `nxDomVue(v)` (sg3.js) = domaine d'origine d'un écran rangé ailleurs dans le
  menu (`it.dom`) : il sert aux droits (`sgVueOk` — sinon Réglages exigerait le droit « réglages » et les collaborateurs perdraient leurs notes de
  frais), au code d'accès (`sgDomDe`) et au visuel (`data-vdom` : visuel épuré du chapitre Temps gardé) ; le fil d'Ariane et le menu suivent
  Réglages. Copie d'avant : `subgestion3/_backup_20261024_1835_avant_menu_temps/`.
  **Chapitre « Temps » renommé « Heures » (24.10.2026, demande de Paulo)** : libellé du menu, de la vue d'ensemble, du fil d'Ariane, du sous-menu
  de Réglages et de l'en-tête de Situation des heures ; clé `temps` inchangée (`SG_DOM`, `data-vdom="temps"`, styles, droits, code d'accès).
  Libellés « Temps de l'équipe », « Temps ce mois », « Temps par mois »… (Équipe, Cockpit, fiches) gardés.
  **Chapitre « Admin » (24.10.2026, demande de Paulo « créer un nouveau chapitre admin dans le menu de gauche » ; contenu choisi : administration de
  l'app)** : domaine `admin` de `SG_DOM` juste avant Réglages (icône `wrench`) = Gestion des utilisateurs (ex-Équipe), Profils et accès, Accès
  protégé, Administration (`config`), Paramètres système, Préférences (ex-Réglages). Droits : ceux de Réglages (`sgVueOk` : `dk==='admin'` → droit
  « réglages », en plus des `SG_VUE_DROIT` propres — userAdmin, admin, sgAdmin). Code d'accès : `admin` dans `SG_ACC_DEF.doms` ; réglages déjà
  enregistrés : Admin protégé si Réglages l'est, jusqu'au premier choix (`adminVu`, comme `rhVu`). Vue d'ensemble : comptes activés,
  administrateurs, code d'accès sur ce poste (`sgFigs('admin')`). Libellés des écrans « Admin » (`lbl`, `sgIntro`) ; visuel Mac : gris foncé
  #48484A ; Studio nocturne : carte sable. Réglages garde Données & sauvegarde, Visuel de l'app, Sauvegarde Facturation, Réunir les registres, le
  sous-menu Heures, les archives et les registres Facturation. Copie d'avant : `subgestion3/_backup_20261024_1927_avant_chapitre_admin/`.
  **Chapitre « Réglages » renommé « Configuration » (24.10.2026, demande de Paulo)** : menu, vue d'ensemble, fil d'Ariane, en-têtes des écrans
  (Données & sauvegarde, Visuel de l'app, Réunir les registres), menu « ⋯ », messages « Configuration ▸ … » (sauvegarde, À traiter, contrats non
  reliés, écran « base vide » de `construire.py`), libellé du droit `reglages` dans Profils et accès (« Configuration » : chapitres Configuration et
  Admin ; la liste du serveur n'a que les clés). Clé `reglages` inchangée (`SG_DOM`, `dom-reglages`, `data-vdom`, droits, code d'accès). Gardés :
  « Réglages de facturation » (Facturation (ancien)), bouton « Réglages » de la fenêtre Contrôler, mentions du menu « Réglages » du moteur
  DeltaSub. Dans ce fichier, « Réglages ▸ … » écrit avant cette date désigne désormais « Configuration ▸ … » (sauf les écrans passés dans Admin).
  **Puis (même soir, demande de Paulo) : « Admin » renommé « Réglages »** (clé `admin` inchangée ; libellés des écrans, Profils et accès, Accès
  protégé) — donc aujourd'hui : **Réglages** = Gestion des utilisateurs, Profils et accès, Accès protégé, Administration, Paramètres système,
  Préférences ; **Configuration** = données, sauvegardes, visuel, sous-menu Heures (Rapports de temps, Disponibilités, Notes de frais, Rapport des
  notes de frais), archives, registres F. **Nouveau chapitre « Administration »** (clé `administration`, icône `gauge`, avant Réglages ; Paulo :
  « un menu administration pour l'admin qui contient l'analyse des heures, le contrôle des heures ; les collaborateurs n'auront pas accès à ces
  informations » ; choix : Contrôle des heures + Situation des heures, administrateur seulement) = Contrôle des heures (`nx-controle`, retiré du
  chapitre Heures — qui ne garde que la Feuille d'heures —, ajouté en tête par sg3_controle.js) et Situation des heures (`nx-situation`, retirée
  de Configuration ▸ Heures). Droits : `sgVueOk` refuse tout écran du domaine `administration` à qui n'est pas administrateur (avant les
  `SG_VUE_DROIT` ; `SG_VUE_DROIT['nx-controle']=sgAdmin`) — vérifié pour les profils Chef de projet et Collaborateur. Code d'accès :
  `administration` dans `SG_ACC_DEF.doms` et ajouté aux réglages déjà enregistrés jusqu'au premier choix (`administrationVu`). Barre en texte
  des écrans Heures étendue au domaine (`html:is([data-vdom="temps"],[data-vdom="administration"]) #tools …`). Vue d'ensemble : heures du
  bureau, inscriptions à contrôler et refusées du mois. Visuel Mac #7D7AFF, Studio nocturne : carte menthe. Copie d'avant :
  `subgestion3/_backup_20261024_2031_avant_menu_administration/`.
  Projets ▸ Registre (aff-gestion) inchangé.
  **Documents et Présentation dans Faisabilité, Projet et Chantier (21.10.2026)** : tuiles « Documents » et « Présentation » dans chacun des trois
  groupes. Faisabilité : « Documents de la faisabilité » (tout le dossier Faisabilité, dépôt à sa racine) ; Chantier : « Présentation du chantier »
  (dossier Chantier ▸ Présentation) et « Documents du chantier » (dossiers Construction/… — contrôles des coûts, devis, calculs des coûts,
  soumissions —, dossier Chantier, phases 41 à 53 du dossier Projet ; dépôt dans Chantier) ; Projet garde « Documents » (tous les fichiers).
  « Présentation au client » (Faisabilité) et « Présentation client » (Projet) affichés « Présentation » (mêmes dossiers). Pages pleines :
  `SG_DOCS_PAGES` → `sgDocsModule(C,p,o)` (o : fil, dos, vide, ajout), compteurs `sgDocsCompte`, noms des tuiles `SG_TUILE_LIB`.
  **Faisabilité ▸ Parcelle & règlements ▸ « Rechercher la parcelle » = fenêtre « Recherche de parcelle » (21.10.2026, `sgFzCarteDlg`)** : choix de
  Paulo « carte intégrée » (un site externe comme geo.vd.ch ne peut pas renvoyer la parcelle cliquée à l'app) — recherche rue / adresse / n° de
  parcelle (geo.admin.ch SearchServer), carte WMS swisstopo (plan cadastral `ch.kantone.cadastralwebmap-farbe` ou orthophoto), glisser / molette /
  + −, clic → `sgFzParcelle` + géométrie (`sgFzParcelleGeom`, identify returnGeometry) surlignée, données à droite ; « Valider » (désactivé sans
  parcelle) copie n°, EGRID, commune, canton, BFS, zone fédérale, service RDPPF, coordonnées du clic, adresse et surface calculée (`sgFzAire`, si
  vide). « Voir sur geo.vd.ch » : `https://www.geo.vd.ch/?center=E,N&scale=…&wkid=2056` (hôte ajouté à `HOTES_ADMIS` de nas/nettoyer.py).
  **Faisabilité ▸ « Application des règles à la parcelle » (21.10.2026, bloc avant `VIEWS['nx-faisa']`)** : carte entre Contraintes et Conclusion
  (`sgFzVolCarte`, `sgFzVolBrancher`). Règles lues dans le texte des contraintes (`SG_FZ_RE` : distance aux limites, entre bâtiments, hauteur à la
  corniche / au faîte, niveaux, COS — fraction, décimal ou % —, IUS/CUS, IM, espaces verts %) ou saisies (`rec.REGLES`, prioritaires) ; forme de la
  parcelle `rec.PARCELLE.GEOM` (anneau extérieur LV95, identify returnGeometry ; reprise aussi depuis la fenêtre « Recherche de parcelle »).
  Calcul `sgFzVolumetrie` : aire d'implantation = cases d'une grille (≈ 260 sur le grand côté) à ≥ distance des limites, contour tracé, simplifié
  (Douglas-Peucker 1,5 case) et lissé (`sgFzInset`, `sgFzLisser`) ; surface de la fiche si elle correspond au plan (± 10 %), sinon celle du plan
  avec avertissement ; emprise max = min(COS × S, aire) ; SPd max = IUS × S ; volume enveloppe = aire × corniche (+ demi-tranche jusqu'au faîte) ;
  espaces verts min. Dessins SVG : plan des contraintes (`sgFzPlanSvg` : bande non constructible hachurée, aire d'implantation, distances, côtés,
  nord, échelle, légende), modèle 3D axonométrique orientable (`sgFzModeleSvg`, curseurs orientation / élévation, faîte en pointillé), coupe
  longitudinale / transversale par le centre (`sgFzAxeCoupe`, axe principal ; terrain : profile.json geo.admin.ch swissALTI3D, `sgFzProfil` ;
  hauteurs depuis le terrain naturel ; distances arrondies à la valeur réglementaire si l'écart vient de la grille). « Appliquer à la parcelle » :
  lit la forme, calcule, remplit la réponse des contraintes d'origine encore vides (statut « à vérifier »), garde `rec.VOLUMETRIE`. Fiche de
  faisabilité, section 5 : tableau des règles et des résultats, plan, 3D et coupe. Indicatif, à vérifier sur le règlement.
  Erreurs de reconnaissance des PDF numérisés corrigées avant la détection (`sgFzOcr` : « 6 rn », « 8 ni », « 800 ni2 » → m / m²), constatées sur le
  règlement de Grandvaux du 19.06.1985 (Bourg-en-Lavaux, RDPPF 5613_66282_R01.pdf) le 21.10.2026.
  **Phase des fichiers du projet (21.10.2026)** : fenêtre « Ajouter des fichiers » commune (`sgDeposerDlg`) — fichiers choisis ou glissés, **phase**
  SIA (`SG_PH_FICH` : 31, 32, 33, 41, 51, 52, 53, noms des sous-phases du projet ; « sans phase » selon la page) et **rubrique** (PV MO, Présentation
  client, Documents ; en phase 33 aussi les pièces du dossier d'enquête) → dossier « Projet/<n° nom>/<rubrique> ». Utilisée par le module Projet
  (« Ajouter » d'une rubrique : phase et rubrique pré-choisies, modifiables ; chaque phase a maintenant aussi une rubrique « Documents »), par la
  page Documents du projet (sans phase = Général), par Chantier ▸ Documents (41 à 53, sans phase = Chantier) et Chantier ▸ Présentation (41 à
  53, rubrique Présentation client ; la page liste aussi les présentations des phases 41 à 53). Faisabilité : inchangé (pas de phases).
  Phase d'un fichier déjà déposé modifiable dans le module Projet (menu de la ligne, `sgFichierPhase` : nouvel enregistrement dans le dossier de
  la phase, ancien retiré, aucun octet copié).
  **Types de documents (21.10.2026)** : `SG_TYPES_FICH` = Plans, PV (dossier « PV MO »), Présentation (« Présentation client »), Offres, Ingénieur
  civil, Ingénieurs CVSE, Géomètre, Physique du bâtiment, Autorisations, Correspondance, Photos, Autres documents (« Documents ») — sous-dossier
  de la phase. Module Projet : dans chaque phase, Plans, PV MO et Présentation client toujours affichés, les autres types dès qu'ils ont des
  fichiers ; bouton « Ajouter des fichiers » de la phase (type au choix) ; chaque fichier : menus Phase et Type (reclassement). Fenêtre
  d'ajout : champ « Type de document » (même liste ; phase 33 : + dossier d'enquête), aussi dans les pages Documents et Chantier ▸ Documents.
  **Reconnaissance du type et de la phase (21.10.2026)** : la fenêtre d'ajout (`sgDeposerDlg`) a une ligne par fichier (phase et type modifiables) ;
  `sgAnalyserFichier` propose type et phase d'après le nom (poids 3), l'extension (images → Photos sauf « plan »/échelle dans le nom ; pptx/key →
  Présentation ; dwg/dxf/ifc → Plans) et le texte des 3 premières pages d'un PDF (`sgPdfDebut`, pdf.js du cadre) : `SG_TYPE_MOTS` (PV, plans —
  échelle, façades, coupes —, offres, ingénieur civil, CVSE, géomètre, physique du bâtiment, autorisations, correspondance, photos, présentation),
  phase = numéro écrit (« phase 32 », « 4.33 »), sinon `SG_PHASE_MOTS` (enquête → 33, appel d'offres → 41, exécution → 51, séance de chantier → 52,
  réception → 53…), sinon date du document (`sgDateDans`) comparée à la feuille d'heures (`sgPhaseALaDate` : sous-phase la plus saisie dans les 45
  jours). Raison affichée sous chaque fichier ; phase hors de la page signalée. Sans phase : le type reste un sous-dossier (Général ▸ Plans,
  Chantier ▸ Photos…) quand plusieurs types sont proposés.
  **Chantier ▸ Documents (21.10.2026)** = module chantier (`sgPdomModulePage` k « chantier ») : phases 41, 51, 52, 53 avec types (comme Projet, menus
  Phase / Type), Contrôles des coûts, PV de chantier, « Autres fichiers du chantier » (dossier Chantier et fichiers Construction/…, par dossier).
  `sgPdomModuleCompte`). Une tuile ouvre le module en pleine page (arg `<id>|Projet|<rubrique>` ou `<id>|Faisabilité|<rubrique>`,
  `sgPdomModulePage` → le code dormant `sgOnglet(p,'projet'|'faisa')`, rubrique visée dépliée et surlignée `.sg-foc`) ; chips « Projet » /
  « Faisabilité » dans la barre des domaines. Le tableau de bord (`nx-projet`) reste un écran d'analyse (rien n'y est remis) ; `chantier` reste dormant.
  **Parcelle & règlements** (`nx-faisa`, arg = ID du projet, lecture `sgProjetPermis`, écriture droit « documents : dépôt ») : collection
  **`sgfaisa`** (un enregistrement par projet, ID = ID du projet : PARCELLE {ADRESSE, COMMUNE, BFS, NUMERO, EGRID, IDENTDN, SURFACE, E, N (LV95),
  ZONE, ZONE_FED, CANTON, RDPPF_ETAT, RDPPF_SERVICE}, SOURCES [{ID, TYPE geoadmin | rdppf | reglement | lien | manuel, TITRE, URL, DATE, RESUME,
  FICHIER (ID `depotfichier`), PAGES, ARTICLES, TEXTE (booléen), DONNEES}], CONTRAINTES [{ID, THEME, TITRE, REGLE, SOURCE, ARTICLE, VALEUR, REPONSE,
  STATUT a_traiter | a_verifier | conforme | non_conforme, NOTE, AUTO}], CONCLUSION, MODIFIE, PAR) + **`sgfaisatexte`** (texte extrait d'un
  règlement, ID `<projet>:<source>`, 1,5 M caractères au plus, ajoutée à `HEAVY` : chargée à la demande) — collections propres à l'app, gardées par
  les reprises. Écran : Parcelle (adresse → `SearchServer` de geo.admin.ch, puis identify `ch.kantone.cadastralwebmap-farbe` (n°, EGRID),
  `swissboundaries3d` (commune, n° OFS), `ch.swisstopo-vd.stand-oerebkataster` (état du cadastre RDPPF et **adresse du service web cantonal**),
  `ch.are.bauzonen` ; saisie manuelle de tout ; vignettes WMS `wms.geo.admin.ch` plan cadastral + orthophoto, repère rouge au centre ; lien
  « Carte fédérale »), Recherche automatique (« Tout rechercher » = geo.admin.ch → extrait RDPPF → règlements → pré-remplissage ;
  **geo.admin.ch** : identify au point sur `SG_FZ_COUCHES` — zones à bâtir, radon, classes de sols SIA 261, réservoirs aquifères, ISOS, IFP, UNESCO,
  PBC, IVS, inventaires nature, sites pollués fédéraux (OFT, OFAC, DDPS), installations électriques > 36 kV, cours d'eau, RegBL (bâtiments de la
  parcelle) — les couches raster (bruit, dangers, forêt) ne répondent pas à identify ; **extrait RDPPF** : service web OeREB 2.0 du canton
  (`getegrid/xml/?EN=`, `extract/xml/?EGRID=` ; Vaud `https://www.rdppf.vd.ch/ws/RdppfSVC.svc`, autres cantons par l'adresse lue dans la couche
  fédérale) → restrictions (thème, légende, statut, part, office, dispositions juridiques et bases légales avec liens), thèmes non concernés, zone
  d'affectation ; **Télécharger les règlements** : dialogue à cases (règlements cochés d'office) → PDF téléchargés par le relais, déposés dans
  `Faisabilité/Règlements` (dépôt du moteur), texte lu par pdf.js du cadre Facturation (`sgFzPdfTexte`, pas d'OCR), articles repérés
  (`sgFzArticles` : « Art. 12 », table des matières écartée) ; pages web (lois) gardées comme liens ; « Règlement (fichier PDF) » et « Source (lien) »
  à la main), Règlements (recherche d'un mot dans les textes → extraits par article, « + Contrainte »), Contraintes et réponses (tableau par thème
  `SG_FZ_THEMES` — zone, indice, emprise, hauteur, distances, toiture, stationnement, espaces verts, dangers, bruit, sites pollués, patrimoine,
  forêt, eaux, énergie, accès, autres — réponse et statut saisis en ligne, modification / suppression, filtre par statut ; **pré-remplissage**
  `sgFzPreRemplir` : couches fédérales, restrictions RDPPF (`SG_FZ_RDPPF_TH`), repérage par mots-clés `SG_FZ_MOTS` dans les règlements —
  `sgFzScanner` : chapitre de la zone de la parcelle d'abord (titre d'article contenant ses mots), score = titre 3 + phrases, 6 articles par thème
  dans le chapitre, 2 ailleurs (titre seulement) ; sans IA ; rien en double), Conclusion + **Fiche de faisabilité** (`sgFaisaFiche` → `sgDocOuvrir`,
  visionneuse, Imprimer → PDF : fiche de la parcelle et cartes, sources, règlements et restrictions avec extraits cités, contraintes / réponses par
  thème, potentiel et variantes (fichiers déposés), état existant (RegBL) et polluants, conclusion). **Relais internet (CORS)** : `GET /proxy?url=`
  dans `fact_backup_server.py` (origine locale) et `GET /api/proxy?url=` dans `serveur_deltasub.py` (session et réseau du bureau), code jumeau
  `proxy_lire` : https seulement, aucune adresse locale / privée (127/8, 10/8, 172.16/12, 192.168/16, 100.64/10, .local), redirections https
  seulement (6), 30 s, 30 Mo, Content-Type transmis ; l'app appelle geo.admin.ch en direct (CORS) et tout le reste par le relais
  (`sgFzRelais` : `/api/proxy` si `dsEstBureau()`, sinon `http://127.0.0.1:7788/proxy`) ; relais injoignable → message et saisie manuelle.
  `nas/nettoyer.py` : `api3.geo.admin.ch`, `wms.geo.admin.ch`, `map.geo.admin.ch`, `www.rdppf.vd.ch` admis. Serveur du NAS : écriture de
  `sgfaisa` / `sgfaisatexte` = règle du dépôt de documents (`sg_refus_ecriture`). ⚠ `fact_backup_server.py` à relancer sur le Mac Studio
  (route `/proxy`) ; conteneur du NAS à redémarrer un jour pour `/api/proxy` (sur demande). Limites : communes dont le règlement n'est pas lié
  dans l'extrait RDPPF ou pas en ligne (ajouter le PDF à la main), PDF numérisés sans texte, hôtes sans https, pas d'IA (repérage par mots-clés).
- **Page de connexion du NAS** (`LOGIN_PAGE` de `serveur_deltasub.py`) : logo Substances blanc sur noir (comme le
  démarrage de l'app), deux champs groupés « Nom d'utilisateur » / « Mot de passe » et flèche, à la manière d'Apple.
- **Déploiement NAS — sur demande seulement (20.10.2026, remplace la règle du 10.10.2026)** : Paulo : « ne pas changer dans le NAS,
  tant que je ne te demande pas de le faire, pour gagner du temps et économiser de l'énergie » — les modifications sont committées et
  poussées sur GitHub et vérifiées dans l'aperçu local ; le dépôt sur le NAS (`nas/preparer.sh` ou `nas/nettoyer.py SUBGestion3.html
  /Volumes/subgestion/app/SUBGestion3.html`, partage `subgestion` monté — au bureau ou par Tailscale) se fait quand il le demande. Si
  `serveur_deltasub.py` a changé, Paulo redémarre le conteneur (DSM ▸ Container Manager ▸ Projet ▸ subgestion ▸ Action ▸ Redémarrer).
  Avant de copier : `git fetch` (l'autre poste pousse aussi), vérifier que la version du NAS n'est pas plus récente (dépôt depuis un autre
  poste), et que `nettoyer.py` passe (traces, sites externes).
- **Refonte visuelle « atelier » essayée puis RETIRÉE le 20.10.2026 (Paulo : « revenir au visuel de base »)** : thèmes de couleur (Graphite,
  Ardoise, Encre, Sombre dans `theme.css`), fond papier, menu graphite, capitales espacées, panneaux, boutons noirs, heures par mois en points —
  faite d'après 10 références transmises par Paulo (commit 2a7c210, annulé par le commit suivant). Copie des sources de la refonte :
  `subgestion3/_backup_20261020_2234_refonte_visuelle_retiree/` ; maquettes : canevas https://claude.ai/artifact/LHj8a8Kvd35QvzTG7VqpMD.
  Le graphisme en vigueur reste celui de la charte (bleu nuit, jaune, fond blanc, filets noirs) : ne pas réappliquer la refonte sans demande.
- **Visuel de l'app : la charte ou l'une des cinq propositions de refonte, au choix (21.10.2026, À L'ESSAI ; « Mac » ajouté le 23.10.2026)** — Paulo : « ajouter le visuel
  papier et encre (la version 3), conserver la version actuelle et pouvoir passer de l'une à l'autre ; dès que j'aurai testé, je demanderai de
  passer définitivement sur la version choisie », puis le même soir « ajoute les autres versions que tu as produites ». Les quatre directions du
  canevas https://claude.ai/artifact/DsFX5SWBRTNqVZBUqefc4u : **Papier et encre** (3 : noir #0B0B0B et blanc, filets d'un pixel, libellés en
  chasse fixe et capitales, carte noire pour le chiffre clé, boutons en pilule, onglets du projet en barre noire, rouge #C8321E seul signal),
  **Brume** (1 : fond en dégradé #D6DEE5 → #C3CDD6, cartes de verre blanc à 86 % arrondies à 20 px, en-tête en verre flouté, menu graphite #15181D
  arrondi, une couleur de données — vert d'eau #17755E —, brique #B8432F, ambre #8A5A00, onglets en puces, chiffre clé en grand sur verre),
  **Signalétique** (2 : crème #F3F1EA, menu noir aux domaines en capitales, module ouvert en orange #FF4D00, en-tête = bandeau orange au titre en
  grand, tuiles béton #D5D9D9, en-tête du projet en bande béton au numéro géant, onglets en barre crème, sélection saumon #FFD9C7, angles de 2 px,
  icônes à bouts carrés et trait de 1,25 ; jamais de rouge, vert, jaune ni bleu : le signal est l'orange, texte #B83700), **Studio nocturne** (4 :
  graphite #141414 / #1C1C1C / #242424, texte #EBEBEB, carte pastel à encre noire pour le chiffre clé — rose projets, menthe temps / équipe / RH,
  lavande facturation / finances, sable autres —, onglets en puces, angles de 16 / 10 px), et depuis le 23.10.2026 **Mac** (5, Paulo : « propose-moi
  une interface inspirée du design Mac, texte, logo, typo… ajoute le visuel aux autres visuels » : police du système San Francisco (`-apple-system`,
  rien d'embarqué), fenêtre gris clair #F5F5F7, menu FLOTTANT en verre clair (marge 8 px, angles de 14 px) aux domaines à icône blanche sur carré
  arrondi de couleur comme les Réglages Système — Cockpit bleu, Affaires brun, Temps orange, Projets cyan, Contacts gris, Équipe indigo, RH sarcelle,
  Facturation vert, Finances violet, Bibliothèque rose, Réglages gris (`--v-dk` par `data-tg`, `--v-dom` par `data-vdom` pour les tuiles et les
  chiffres) —, module ouvert en bleu système #007AFF, logo = sigle en icône d'app (carré arrondi graphite, carré jaune) + nom, historique dans une
  capsule, titres en gras, cartes blanches arrondies à 12 px à ombre fine, onglets du projet et `.seg` en contrôle segmenté, listes du moteur à
  lignes alternées et sélection bleue, menus en verre à survol bleu, palette ⌘K façon Spotlight, boutons du Mac (blanc à ombre fine / bleu /
  texte rouge), champs à anneau bleu, étiquettes en capsules teintées (vert en cours, orange en attente, gris terminé, rouge urgent), couleurs du
  système pour les états (`--s-vert`, `--s-orange` retrouvent leur sens), heures par mois en barres arrondies, initiales en pastilles grises comme
  Contacts ; icônes `SG_NXI_MAC` d'après les symboles du Mac — roue dentée des Réglages, carré à flèche du partage…). Polices (non installées, aucune embarquée) : Geist /
  Geist Mono, Inter, Archivo / JetBrains Mono, Inter / IBM Plex Mono si elles sont sur le poste, sinon Helvetica Neue, la police du système et
  Menlo. **Le visuel de la charte reste le défaut et n'a pas changé** (styles calculés comparés avec la copie d'avant : identiques).
  Choix par poste (navigateur) : `localStorage` `sg3_visuel` = `charte` (défaut) | `papier` | `brume` | `signaletique` | `nocturne` | `mac` — Réglages ▸
  **Visuel de l'app** (`nx-visuel`, ouvert à tous les profils, aperçu de chaque visuel), bouton du pied de menu (`#sg-visuel` → liste des visuels,
  `sgVisuelMenu`), ⌘K « Visuel : … ». Mécanisme : attribut `data-visuel="<visuel>"` sur `<html>` de la coquille ET du cadre Facturation, posé avant
  le premier affichage par `VISUEL_SCRIPT` (`subgestion3/construire.py`, liste `VISUELS`) ; `data-vdom` = domaine de l'écran (`NX_VIEW[v].d.k`,
  enveloppe de `go`). Feuilles, toutes limitées à l'attribut : `subgestion3/visuels_jetons.css` (jetons `--p-*` de chaque visuel : encre, gris,
  signal, voile, ombres, `--p-page`, `--p-pill`, `--p-tt` casse des libellés, `--p-lsk` facteur d'espacement des capitales, `--p-font` / `--p-mono` /
  `--p-lblf` polices du texte, des codes et des libellés, `--p-okt` ; `--v-*` couleurs propres ; injectée dans la coquille ET le cadre),
  `subgestion3/visuels.css` (base commune de la coquille et du moteur, ex-visuel_papier.css), `subgestion3/visuels_variantes.css` (traits de
  Brume, Signalétique, Studio nocturne, Mac), `subgestion3/fx_visuels.css` (cadre Facturation : base + traits propres). Les variables de la charte
  (`--s-noir`, `--s-nuit`, `--s-jaune`…) y pointent sur les jetons ; chasse fixe par `--s-font` (sg3.css impose `--s-font` à tous les éléments avec
  !important) ; couleurs écrites dans le code (#003346, #FFF266, #98C21F, #27AE60…) reprises par sélecteurs d'attribut `style`. **Studio nocturne
  = page inversée** : `filter:invert(.92) hue-rotate(180deg)` sur `<html>` de la coquille (cadre Facturation compris) — blanc → #141414, noir →
  #EBEBEB — ; ses jetons sont donc écrits AVANT inversion ; images, `canvas`, cadres de lecture, aperçus « PDF fidèle » (`.offre-page`), aperçus de
  Réglages (`.sg-vis-apercu`), étiquettes « échu / payé » et carte pastel soustraits à l'inversion (`--v-contre` = `hue-rotate(180deg) invert(1)
  contrast(1.1905)`, à peine plus sombre que l'original). PDF et impressions jamais touchés. `subgestion3/sg3_visuel.js` (bloc 22, concaténé après
  sg3_plus.js) : `SG_VISUELS`, `sgVisuel`, `sgVisuelAppliquer(v,redessiner)`, `sgVisuelMenu`, `sgVisuelCadre` (enveloppe de `fxEnsure`),
  `sgVisuelDomaine`, icônes `SG_NXI_PAPIER` (aussi pour Signalétique), `SG_NXI_BRUME`, `SG_NXI_NOCTURNE`, `SG_NXI_MAC` ↔ `SG_NXI_CHARTE` (copie de `NXI`),
  commandes de la palette (enveloppe de `nxPalIndex`), aperçus `sgVisuelApercu(k)`. Contrôles faits : balayage des 109 écrans dans chaque visuel
  (sans erreur), contraste texte / fond mesuré sur 16 écrans. Copies d'avant : `subgestion3/_backup_20261021_1856_avant_visuel_papier/`,
  `subgestion3/_backup_20261021_2000_avant_quatre_visuels/`, `subgestion3/_backup_20261023_2300_avant_visuel_mac/` (+ `SUBGestion3_backup_…` des mêmes heures). **Passer définitivement** (sur demande de
  Paulo seulement) : garder la charte = supprimer les quatre feuilles, `sg3_visuel.js`, `VISUEL_SCRIPT` et les deux `<style>` de `construire.py` ;
  garder une proposition = la mettre par défaut (`sgVisuel`, `VISUEL_SCRIPT`), puis retirer les autres blocs et le choix (ou fondre ses règles dans
  sg3.css / fx_theme.css).
- **Annuaire = fiche pleine page + liste escamotable (proposition D, choisie par Paulo le 21.10.2026 ; `subgestion3/sg3_annuaire.js`, bloc 23,
  styles `.sga-*` en fin de `sg3.css`)** — Paulo : « fais-moi d'autres propositions d'organisation pour que l'utilisation soit simple et efficace »,
  six options maquettées (A liste + fiche, B tableau → fiche, C tableau qui se replie, D fiche + liste escamotable, E recherche d'abord, F tableau +
  aperçu ; maquette `proposition_annuaire.js` dans le scratchpad de la session), puis « applique la proposition D ». Contacts ▸ Annuaire
  (`adr-entites`) ET Fiche contact (`nx-contact`, ⌘K, intervenants…) affichent le même écran (`sgaRendre`) : barre du haut (« Contacts » = liste,
  touche /, ‹ › et ⌥↑ ⌥↓ = contact précédent / suivant de la liste filtrée, « n sur N · filtre », « Nouveau contact ▾ ») ; fiche au graphisme du
  tableau de bord du projet — en-tête jaune pâle, grand monogramme (`sgaMono`), type, localité, société de rattachement, IDE, « dans l'annuaire
  depuis », rôles d'intervenant, CFC, dernier projet ; actions en tuiles à icône (Appeler `tel:`, Courriel, Carte map.search.ch, Favori = épingle du
  menu, Modifier, Plus) ; onglets Vue d'ensemble (tuiles, Coordonnées, Personnes, Notes, Projets), Adresses (une carte par adresse et ses actions),
  Personnes (rattachées : CONTACTRELATION_ID = l'entité), Projets (intervenant par ses adresses ou par ses personnes, « par … »), Catégories (retirer,
  ajouter), Notes (nouvelle, modifier, supprimer), Soumissions (`projecttenderer`) ; onglet mémorisé `sg3_annu_onglet`, onglets vides masqués.
  Liste par-dessus la fiche (`sgaTiroir`, voile, Échap) : recherche (nom, localité, CFC, courriel, fonction, personnes rattachées), tuiles Tous /
  Sociétés / Personnes / Autres avec nombres, rôle (Maître d'ouvrage, Entreprise, Architecte, Direction des travaux), regroupement par lettre, index
  A–Z, ↑ ↓ Entrée ; clic droit = menu de l'entité. Menus `sgaMenu` (sections, icônes, rouge pour supprimer) : « Nouveau contact » (Société, Personne,
  Famille, Communauté, Association), « Plus » (Coordonnées : nouvelle adresse, rattacher, coordonnées bancaires, copier l'adresse ; Classer : Mes
  favoris, liste de diffusion, catégories ; Afficher : CFC, propriétés, projets — fenêtres `ownerInfo` ; Imprimer la fiche → visionneuse ; Masquer /
  réafficher ; Supprimer), menu de la liste (entités masquées, export CSV `sgaCsv`, toutes les adresses, recherche avancée). Mêmes fonctions et
  mêmes droits que l'écran d'origine (`ch08aCan` contactNew / contactEdit / contactDelete / contactExport + profil « contacts : écriture »).
  Clavier sur `window` en capture (avant les raccourcis de document : « / » n'ouvre pas la palette ici). État `SGA` : contact `sg3_annu_id`, filtres
  `sg3_annu_type` / `sg3_annu_role`. L'écran d'origine reste dans DeltaSub.html (seul) ; l'ancien `VIEWS['nx-contact']` de sg3.js est remplacé.
  Copie d'avant : `subgestion3/_backup_20261021_2133_avant_annuaire_D/`, `SUBGestion3_backup_20261021_2133_avant_annuaire_D.html`.
- **Urgences de l'audit du 20.10.2026 (corrigées le 21.10.2026, graphisme inchangé)** — copies d'avant : `Facturation_backup_20261021_0724.html`,
  `subgestion3/_backup_20261021_0724_avant_urgences/`.
  1. **Le numéro d'une facture enregistrée n'est plus jamais recalculé** (`Facturation.html`, `faFactureEnregistree()` en tête de `updateInvNum`).
     Bug présent depuis le premier commit : ouvrir une facture (Modifier, « Ouvrir » le PDF, dernière facture chargée au démarrage) passait par
     `fillFacture` → `onSelectContrat` → `updateInvNum`, qui réécrivait « FA<année en cours>.<n° suivant>_<affaire du contrat>.<type> » (vidait le
     numéro sans code d'affaire ; codes absents de la liste — NF01, NFF… — : numéro tronqué et description vidée) ; « Mettre à jour » l'enregistrait
     et le PDF l'imprimait. Désormais : numéro ET description gardés ; seule la liste des types est refaite (`buildTypeDropdown` garde tout code
     existant ; numéro sans code : aucun type affiché) ; choisir un autre type dans la liste (action explicite) ne remplace que le code final
     (…AC03 → …FF, si ce code est AC.., F ou FF) et la description ; changer de contrat garde le numéro ; autre numéro : case « Manuel » (décochée,
     le numéro affiché reste). Numérotation automatique (année en cours, n° suivant) pour une NOUVELLE facture seulement. Brouillon de reprise
     (`uiApplyFactDraft`) : sans « Manuel », un numéro d'une autre année / d'un autre n° d'ordre est remplacé par le numéro enregistré.
     Données de départ (363 factures, seed du 28.09.2026) : aucune renumérotée (identifiant = numéro d'origine partout) ; année du numéro ≠ année
     de la date : FA24.45_24ORM.FF (03.02.2025) seulement ; sans date : FA20.06_20DRE.MCA.FF ; deux paires de factures DIFFÉRENTES ont le même
     identifiant (FA24.14_22GUS.FF, FA18.11_18BHA.FF : la 2e de chaque paire ne peut pas être ouverte) et le n° FA20.14 sert deux fois.
  2. `sgVoirContrat` (`sg3_plus.js`) : le test « Contrat introuvable » était avalé par le commentaire `//` de sa ligne (erreur technique avec un
     contrat supprimé) ; plus aucun code après un `//` dans `sg3.js` / `sg3_plus.js` (contrôle par analyse des commentaires, 21.10.2026).
  3. Suppressions : `chMsgSupprContrat(c)` — code d'affaire, projet, factures reliées (elles restent, mais sans client ni projet dans leur PDF),
     IRRÉVERSIBLE — pour la corbeille de la liste des contrats (`chDeleteContratRow`), le bouton du calcul d'honoraires (`chDeleteContrat`) et
     l'ancien formulaire masqué (`deleteContrat`, plus de `confirm()` natif). Facture (`deleteFacture`) : numéro, description, affaire, date ; UNE
     seule facture retirée (`splice`), même si deux partagent l'identifiant ; facture pas encore enregistrée : « Abandonner la saisie ».
  4. **Sauvegarde en échec** (bloc 1 de `sg3_plus.js`) : `sgSauvEchec()` = dernière tentative ratée (aucune destination, refus, erreur) +
     modifications en attente, jamais pour la base du bureau → étiquette rouge « Sauvegarde en échec » au pied du menu (`.who span.echec`, clic →
     Réglages ▸ Données ; menu réduit : filet rouge autour des initiales, `#nx-who.sg-echec`), point « Sauvegarde en échec » dans À traiter (carte
     de l'accueil `#sg-at` et pastille rafraîchies dès que l'état change) ; Réglages ▸ Données : état selon la destination RÉELLE (serveur
     joignable, ou dossier choisi et autorisé) — plus de « prochaine automatiquement » sans destination ; `sgSauver` vérifie la destination avant
     de préparer la copie ; nouvel essai toutes les 5 min pendant l'échec et dès que Chrome rend l'accès au dossier.
  5. **Cockpit calculé** (décision de Paulo le 21.10.2026 : « calculer le cockpit ») — `const cockpitData` (exemple recopié du tableau Excel,
     graphique mensuel synthétique `ckSampleMonthly`) supprimé ; `ckCompute(Y)` calcule tout depuis les contrats et factures ; copie d'avant :
     `Facturation_backup_20261021_0843_avant_cockpit.html`. **Définitions communes** aux deux cockpits (`ck2Compute` réécrit sur les mêmes
     fonctions : `ckBase`, `ckFactOk`, `ckTTC`, `ckPayee`, `ckContratTTC`, `ckEngage`, `ckReste`, `ckYM`) et à `sgRenta` : facture comptée = non
     annulée ; montant = honoraires TTC sans les frais (`_ttc`) ; année / mois = date de la facture ; encaissée = « Payée » ou date de paiement
     (reçue à la date de paiement, sinon à celle de la facture) ; ouverte = non encaissée ; « à envoyer » = statut « En attente » ; contrat compté
     = non annulé, montant TTC = httc sinon hht × (1 + TVA). **Honoraires engagés** (ex-« signé ») = chaque contrat non annulé au plus élevé de son
     montant et de son facturé (70 anciens contrats sans maître de l'ouvrage, 90 sans montant dans les données de départ) + factures sans contrat,
     « dont signés » à part (marquage depuis le 20.10.2026). **Reste à facturer** = contrats en cours (ni annulés, ni terminés, ni archivés),
     montant − facturé si positif (aussi le « Carnet de commandes » du Cockpit analytique, avant : tous les contrats). Section « Factures ouvertes et
     honoraires restant à facturer » : reste à facturer + factures ouvertes du mois / du mois suivant et plus tard / à envoyer / des mois précédents
     (légende sous la barre). Exercice (sélecteur, défaut = année en cours) : croissance « à date » pour l'année en cours (1er janvier → même jour),
     année entière sinon ; CA annuel, S1, S1 / meilleur S1 ; croissance annuelle moyenne (taux composé) depuis la première année complète, sur 5 et
     3 ans, jusqu'à la dernière année complète (remplace « Après COVID », « Depuis l'arrivée des nouveaux collaborateurs », textes sans source) ;
     comparaison mensuelle = facturé moyen par mois (Y, Y−1, Y−2 ; année en cours : mois écoulés) ; anneaux Y / Y−1 / Y−2 à l'échelle du meilleur
     mois, % = Y comparé à Y−1 ; reçu / facturé par mois sur 7 ans. Top 10 maîtres de l'ouvrage = facturé depuis la création ; contrats sans nom
     (vide ou « - ») et factures orphelines « non attribués », hors classement (idem « Top clients » du Cockpit analytique). Échelles calculées
     (`ckEchelle`), infobulles de définition sur les cartes et les barres, couleurs d'années complétées (`ckYC`, `CK_YC_PLUS`). **Charges &
     dépenses** : aucune source dans l'app (seul le coût de revient RH de SUBGestion 3 a des salaires et frais généraux, estimés) → section sans
     chiffres, en attente de la décision de Paulo (masquer, ou saisir les charges annuelles dans un petit tableau).
- **Dossier de l'aperçu `/tmp/subgestion_apercu` (port 7797) nettoyé le 24.10.2026 (demande de Paulo)** : seulement `SUBGestion3.html` et
  `base_test.json.gz` ; les maquettes (`proposition_*.html`, copies complètes de l'app) et l'ancienne copie NAS supprimées, leurs scripts gardés dans
  `subgestion3/_backup_20261024_maquettes_apercu/` (ignoré par git) — pour remontrer une maquette, recopier SUBGestion3.html sous un autre nom et y
  injecter le script. Le stockage du navigateur intégré peut être vidé (fermeture de l'app) : recharger la base de test (skill de vérification).
- Essais des profils : `.claude/launch.json` « profils-test » (port 7798, base de test et comptes de test dans le scratchpad
  de la session) ; le serveur tourne depuis une copie (le partage NAS est refusé à l'aperçu).

## Skills du projet (`.claude/skills/`, versionnés — exception dans `.gitignore`)

- `substances-app-bureau` — règles, carte des fichiers, architecture (`references/architecture.md`), recettes
  (`references/recettes.md`) pour modifier Facturation / DeltaSub / SUBGestion.
- `substances-charte` — charte officielle (Akkurat, nuanciers, logo) ; `assets/charte_substances.css`, `assets/logo_substances.svg`.
- `substances-verification-app` — vérification : `scripts/construire_et_previsualiser.sh` (aperçu isolé
  `/tmp/subgestion_apercu`, config `subgestion-apercu` port 7797), `scripts/verifier_ecrans.js` (balayage de tous les
  écrans), `scripts/sonde_chrome.sh` (test `file://` dans Chrome sans fenêtre).
- `substances-donnees` — stockage, export / import, reprise Deltaproject (`reprise_subgestion.py`), données clients.
Les tenir à jour quand l'architecture ou les décisions changent.

## Fonctionnalités principales

Onglets : contrats d'honoraires, factures (acomptes, factures finales),
affaires/projets, heures des collaborateurs, récapitulatifs par phases SIA,
export PDF fidèle aux documents papier du bureau (police Akkurat).

## Règles pour travailler sur ce projet

1. **Un seul fichier à modifier** : `Facturation.html` (et `DeltaSub.html` pour DeltaSub). Avant toute
   modification importante, l'utilisateur (ou un script) crée des copies
   `Facturation_backup_AAAAMMJJ_HHMM.html` — elles sont ignorées par git.
2. **Ne jamais committer de données clients** : les `facturation_data_*.json`,
   les PDF de factures réelles et les fichiers d'affaires (`FA26.*`, `24PRC_*`,
   etc.) sont exclus par `.gitignore` et doivent le rester.
3. **Synchronisation entre machines** : git ne transporte que le code.
   Les données se transfèrent via *Exporter* dans l'app (fichier
   `facturation_data_*.json`) puis *Importer* sur l'autre machine.
4. La mise en page des PDF reproduit exactement les documents du bureau —
   ne pas « améliorer » la typographie ou l'espacement sans demande explicite.
5. Répondre et documenter en français.

## Dépôt GitHub

`git@github.com:Paulosub/Sub_facturation.git` — dépôt privé, branche `main`.

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
  **Page du projet et pages des domaines (08.11.2026, demandes de Paulo)** : libellé « Projet <n°> » retiré au-dessus du titre (`sgIntro('',…)`, la ligne
  épaisse reste) et numéro de l'affaire au-dessus du nom, même taille, en bleu nuit (`.sg-pdnum`) ; dates du projet retirées sous le nom (maître de l'ouvrage et lieu gardés) ; filet fin et espace entre le numéro et le nom ; frise des heures (`sgFriseHeures`, première et dernière heure, durée) sous le nom, comme la fiche projet ; dans la page d'un domaine (Devis général, Soumission…),
  la ligne des domaines (Faisabilité, Projet, Enquête…) est retirée et « ‹ Domaines » remplacé par la variante 3 « carré bleu nuit » choisie parmi 5
  (`.sg-pretour` : carré bleu nuit à flèche blanche, « Retour au projet » en petit, n° · nom de l'affaire ; maquettes `subgestion3/_backup_20261108_maquette_retour/`).
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
  **Configuration allégée, tout le reste dans Archives (même soir, demandes de Paulo « déplacer dans archives »)** : Configuration = Données &
  sauvegarde, Visuel de l'app, Sauvegarde Facturation, Réunir les registres. Archives = Suivi & écarts, Registre, Controlling (ex-« Archives ·
  Controlling »), sous-menu Heures (Rapports de temps, Disponibilités, Notes de frais, Rapport des notes de frais — `dom:'temps'` : collaborateurs
  toujours servis, le chapitre Archives leur est donc visible), puis les registres F de Facturation (Carnet des PV, Feuille d'heures, Rapport
  d'heures, Devis, Contrôle du coût, Projets, Collaborateurs, Heures, Import Deltaproject, Analyse globale ; `dom:'reglages'` : droit
  « Configuration » et code d'accès inchangés ; préfixe « Archives · » retiré des libellés). Copies d'avant :
  `subgestion3/_backup_20261024_2220_avant_archives_registres/`.
  **Chapitres provisoires « Honoraires (ancien) » et « Facturation (ancien) » rangés dans Archives (même soir, demande de Paulo)** : sous-menus
  dépliables d'Archives (items `grp:'Honoraires (ancien)'|'Facturation (ancien)'`, `dom:'ancien'|'ancienf'`, sans `hero`) ; les domaines `ancien` et
  `ancienf` restent dans `SG_DOM` avec `menu:0` et `items:[]` (vues d'ensemble, `sgFigs`, `SG_ANC_CH` gardés) ; droits (`SG_VUE_DROIT`), code d'accès,
  bandeau `sgAncBandeau` et « Comparer et noter » (`sgAncChDe` = `sgDomDe`) inchangés. Pour les retirer définitivement : supprimer les deux
  sous-menus d'Archives, les deux domaines et le bloc 18. Copie d'avant : `subgestion3/_backup_20261024_2230_avant_anciens_archives/`.
  **Contacts ▸ Favoris (`adr-favoris`) déplacé dans Archives (25.10.2026, demande de Paulo)**, `dom:'contacts'` (droits et visuel de Contacts) ;
  Contacts = Annuaire, Liste des adresses, Listes de diffusion, Catégories ; **Recherche avancée (`adr-chercher`) aussi dans Archives** (même jour,
  `dom:'contacts'`) — le lien « Recherche avancée… » du menu de la liste de l'Annuaire l'ouvre toujours.
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
  **Équipe, Ressources humaines, Facturation et Finances glissés dans Administration (25.10.2026, demandes de Paulo « glisser équipe / ressources
  humaines / facturation dans admin », « également pour finances »)** : quatre sous-menus dépliables (`grp`) après le contrôle des heures ; chaque
  écran garde `dom:'equipe'|'rh'|'facturation'|'finances'` (droits `sgVueOk`, code d'accès `sgDomDe`, couleurs du visuel `data-vdom`) ; les quatre
  chapitres restent dans `SG_DOM` hors menu (`menu:0`, `items:[]`) pour leurs chiffres (`sgFigs`) et le code d'accès. Les droits d'origine sont
  gardés : le chef de projet voit dans Administration Équipe (Membres, Temps de l'équipe), Facturation et Finances selon ses droits, le collaborateur
  Équipe ▸ Membres ; les écrans propres au chapitre (contrôle et analyse des heures, Situation des heures) et ses chiffres restent réservés à
  l'administrateur (`sgVueOk` : `dom-…` jugé sur ses écrans avant la règle `administration`). Vue d'ensemble générique (`VIEWS['dom-'+k]`) :
  tuiles rangées par sous-menu sous un intertitre (vaut aussi pour Archives). Retour à l'accueil de Facturation (`sgFxHome`) → `dom-administration` ;
  palette ⌘K sans les chapitres hors menu et vides. Copie d'avant : `subgestion3/_backup_20261025_1504_avant_admin_regroupe/`.
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
- **Contacts ▸ Listes de diffusion et Catégories au graphisme de l'app (25.10.2026, bloc 29, `subgestion3/sg3_contacts.js` + styles `.sgd-*` en
  fin de `sg3.css`)** — demandes de Paulo « améliorer la liste de diffusion pour avoir le même graphisme que le reste de l'app », « modifier catégorie
  pour avoir le même graphisme que le reste de l'app ». `VIEWS['adr-groupes']` et `VIEWS['adr-props']` remplacés (page commune `sgdPage`) :
  colonne épurée de 300 px comme les pages Heures (pastille d'initiales, nom, nombre d'adresses ; listes rangées « Toutes les adresses », « Listes
  intelligentes », « Listes statiques » — « Mes favoris » a son écran, Archives ▸ Favoris — ; catégories rangées par groupe de propriétés), bandeau
  jaune pâle de la Feuille d'heures (`sgfh-tete` : monogramme, filet, type ou groupe, nom en grand ; critères d'une liste intelligente en clair,
  `sgdCriteres` ; boutons Nouvelle liste ▾, Modifier la liste, Supprimer la liste), chiffres sans icônes (Adresses, Sociétés, Personnes, Avec
  courriel + jauge, Sans courriel), puis la liste d'adresses du moteur `adrList` inchangée (Modifier, Prévisualisation, Fonctions, recherche,
  sélection multiple, détail de l'adresse) habillée : barre en texte, tableau à filet noir, onglets du détail soulignés. Barre `#nx-sub` masquée
  sur ces pages (`html:has(#main .sgd)`). Choix gardé : `sg3_dif_sel`, `sg3_cat_sel`. Fonctions et données inchangées (création, modification,
  suppression d'une liste comme le moteur ; les adresses ne sont jamais supprimées) ; le bouton « Retirer la propriété des adresses sélectionnées »
  des Catégories du moteur, qui ne faisait rien, n'est pas repris (retrait : détail de l'adresse ▸ Propriétés). DeltaSub.html seul garde les
  écrans d'origine. Copie d'avant : `subgestion3/_backup_20261025_1504_avant_admin_regroupe/` (sg3.css, construire.py).
  **Droits des boutons des listes (même soir, relecture)** : Nouvelle / Modifier la liste = `contactGroupNew`, Supprimer la liste = `contactGroupDelete`
  (gardes CH08B du moteur, via `sgaPeut` : + profil « contacts : écriture ») ; sans « Modifier l'adresse » (`contactEdit`), le double-clic de la liste du
  moteur (et « Ouvrir » du clic droit) est bloqué et les boutons d'écriture du détail masqués (`.sgd-lecture`).
- **Contacts ▸ Liste des adresses = présentation de Projets ▸ Mes projets (25.10.2026, Paulo : « modifier la liste des adresses pour correspondre au
  graphisme de Mes projets » ; fin de `sg3_contacts.js`, styles `.sgl-*`)** : `VIEWS['adr-liste']` remplacé — barre de Mes projets (`.sg-mesp-bar` :
  Toutes · Sociétés · Personnes · Autres, recherche nom / adresse / localité / courriel / téléphone / CFC / catégories, nombre ; `sg3_adrl_type`,
  `sg3_adrl_q`), tableau `.nx-tbl.sg-mesp.sgl-t` (Nom + catégories en étiquettes, Type, Appartient à, Adresse + type d'adresse, Localité, Téléphone,
  Courriel, CFC ; tri commun des tableaux ; adresses masquées exclues) ; un clic = fiche du contact (`nx-contact`, après 250 ms et pas si du texte est
  sélectionné : on peut sélectionner un courriel ou un numéro ; adresse sans contact : Modifier l'adresse) ; retour depuis la fiche à la même position,
  dernière adresse ouverte surlignée (`SGL`). Fonctions de l'écran d'origine : Imprimer ▾ (liste, par CFC), Courriel …, Exporter CSV (colonnes de la
  présentation « Tous » du moteur + type et catégories) — sur les adresses affichées, dans l'ordre affiché — ; clic droit sur une adresse : fiche,
  Modifier l'adresse, favoris, liste de diffusion, catégories, courriel, copier l'adresse / le courriel / le téléphone, copie de la ligne et du tableau.
  Mêmes droits (`contactEdit` ; « Fonctions » = `contactNew` ou `contactExport` ; écritures = profil « contacts : écriture » ; sans « Fonctions » : ni
  courriel, ni CSV, ni copie du tableau). Redessin (autre poste) : défilement, focus et curseur de la recherche gardés. Tri des tableaux : un tableau
  `.sg-sanstot` ne reconnaît les totaux que par `tr.tot` (une adresse « Total … » restait en fin de liste). La liste du moteur (sélection multiple,
  présentations, détail) reste dans Listes de diffusion ▸ Toutes les adresses. **Serveur du NAS** (`serveur_deltasub.py`) : `contactgroup_contact`
  ajouté à `SG_T_CONTACTS` (un chef de projet ne pouvait pas ajouter une adresse aux favoris ou à une liste : 403) — à redéployer sur demande
  (redémarrer le conteneur). Relecture par 2 relecteurs + vérification adverse (workflow) : 8 défauts confirmés, tous corrigés. Copie d'avant :
  `subgestion3/_backup_20261025_1724_avant_liste_adresses/`.
- **Bibliothèque ▸ Documents Substances (25.10.2026, bloc 30, `subgestion3/sg3_docsub.js`, concaténé en dernier par `construire.py` ; banc
  d'essai `subgestion3/docsub_banc/`)** — demande de Paulo : « tous les documents de la bibliothèque, reproduire tous les documents types avec la
  mise en forme de contrat et facture que j'ai créée moi-même avec l'entête, le pied de page etc. […] avec le texte identique pour le moment »,
  « dans un seul endroit qu'il faut nommer Documents Substances ». Fait par une chaîne de 6 agents (mise en page de base, graphiste, relecture et
  application précise, contrôle complet, déploiement, vérification que rien n'a changé), épreuves validées par Paulo à chaque étape.
  **Moteur** `async sgDsPdf(R, rep, o)` → octets d'un vrai PDF (pdf-lib, comme `offrePDFBytes` / `generateInvoicePDF`) : fonction PURE, aucune
  variable extérieure (recréée par `toString()` dans le domaine du cadre Facturation, sinon pdf-lib refuse les tableaux d'un autre domaine) ;
  `R` = {PDFLib, fontkit, polices {light, regular, bold, lightItalic}, gabarits {offre, facture}, styles}, `rep` = `report` d'un document type
  (`modeledocument`), `o` = {titre, date, jeu, type, description}. **Partie A, papier** (identique au pixel à une page courante de contrat) :
  en-tête TITRE (Bold 7,5 pt capitales, x 28.4, base 805.6), trait 0,25 (y 802.1), « CULLY - 25 OCTOBRE 2026 » (Light 7,5 gris 0.4, base 791.6) ;
  pied du contrat (3 colonnes, bases 42.0 / 28.0) ; « n | total » (pw − 87.6 / pw − 82.2, trait vertical pw − 84.6) ; logo vertical de `FA_TMPL`
  (`LOGO_BB` 541 / 83.5 → 568.5 / 236) NOIR en 1re page, GRIS ensuite ; paysage calé sur la page 10 du contrat (annexe 2). Gabarits nettoyés en
  mémoire avant `embedPage` (seules les formes du logo et du pied) : aucun texte caché d'un autre document. Signes absents des polices Light / Bold
  (« | _ @ " ² º · ») pris en Akkurat Regular (décision de Paulo, 25.10.2026), espace insécable → espace. **Partie B, contenu** (système graphique
  du graphiste : module vertical de 5 mm, titres « n° | TITRE » des contrats, tableaux 7,5 pt en portrait / 7 pt en paysage avec 3 lignes vides et
  cadres de total, bloc destinataire de la facture à x 368.6, pagination sans débordement ni titre orphelin, en-tête de colonnes répété) : toutes
  les bandes (GridBand, TableBand, WrappingTextBand, TextBand, LineBand, PageBreakBand), sections dans leur format. Champs = repères
  « ‹ libellé › » en italique gris (dictionnaire `SG_DS_CHAMPS`, 350 couples nom / format) ; remplis : titre, date du jour, numéros de page.
  **Texte identique** = exactement les textes fixes que l'impression actuelle du moteur (`svDpHTML`) montrerait : titre de colonne personnalisé vide →
  nom de la colonne (« Monnaie ») ; cellules en surnombre des grilles selon la place que le moteur leur laisse ; repère trop long → libellé abrégé
  (« ‹ Mon. › »), jamais un texte qui ressemble à une donnée ; sections masquées non imprimées ; textes non français des modèles gardés tels quels
  (« Gewinnspanne », « Dispendio fatturabile », « inkl. MWST », « Text »…). Écarts voulus (décisions du 25.10.2026) : rangées « Total… » gardées
  (le moteur ne les imprime pas à vide) ; devis général du jeu 2 (gabarit « A4 Landscape 2 » absent du modèle) en paysage comme au jeu 1.
  **Écran** `nx-docsub` « Documents Substances » : première entrée et tuile principale (« hero ») de Bibliothèque (choix confirmé par Paulo ;
  « Documents types » reste, inchangé), ⌘K, droits = ceux de `tpl-documents` (`nxCan`) ; documents types (`modeledocument`, langue fr ou vide,
  comme `tpl-documents`) par famille (`SGDS_REGLES`, début du type : 15 familles), recherche, jeux 0 Général / 1 Affaires / 2 SUBSTANCES, bandeau,
  chiffres (pages, format, champs, tableaux, taille), aperçu des pages, Ouvrir (`sgVisionneuse`), Télécharger, Imprimer ; ↑ ↓ Entrée / ; réglages
  `sg3_docsub_sel` / `sg3_docsub_jeu` ; styles `<style id="sg-docsub-css">`, classes `sgds-*`. Ressources du cadre (`fxEnsure` : `w.PDFLib`,
  `w.fontkit`, `AKKU_*`, `OFFRE_TMPL`, `FA_TMPL`), cache mémoire par jour. Aperçu par pdf.js du cadre : `getDocument({…, ownerDocument:document})`
  (sinon polices chargées dans le cadre → carrés) et `render({…, intent:'print'})` (sinon `requestAnimationFrame` du cadre masqué → ~10 s par page),
  puis `pdf.destroy()`. Aucune écriture de données. **Vérifié le 25.10.2026** : 163 documents types de la base de test (164 dans l'app : un modèle
  allemand converti par « Français seulement »), 282 pages, 0 erreur ; texte identique au moteur 163/163 ; papier juste sur toutes les pages ;
  aucun chevauchement ni texte hors zone ; tous les filets à 0,25 pt ; seules les polices Akkurat ; aucun texte caché ni métadonnée indiscrète ;
  PDF de l'app identiques à l'octet à ceux du banc (horloge figée), aussi après `nas/nettoyer.py` ; ancienne et nouvelle version comparées : seuls
  ajouts `sgDsPdf`, `SGDS`, la vue `nx-docsub` et la tuile de Bibliothèque ; PDF des contrats et factures identiques à l'octet ; aucun enregistrement
  de la base modifié. **Banc** : `python3 -I subgestion3/docsub_banc/preparer.py <atelier hors du dépôt> <export_base.json.gz>` puis
  `<atelier>/harness/rendre.sh tous <sortie> --texte` (Chrome sans fenêtre, ~50 s pour tout ; mode d'emploi `harness/LISEZMOI.md`). ⚠ Si
  `OFFRE_TMPL` ou `FA_TMPL` changent dans Facturation.html, revérifier le papier (logo et pied repris des gabarits). Non traités (question posée
  à Paulo) : les ~350 formulaires d'impression des autres rubriques de Bibliothèque (collection `modele`). Copie d'avant :
  `subgestion3/_backup_20261025_1745_avant_documents_substances/`, `SUBGestion3_backup_20261025_1745_avant_documents_substances.html`.
- **Impressions au papier des contrats (30.10.2026, bloc 31, `subgestion3/sg3_impressions.js`, concaténé après `sg3_docsub.js`)** — demande de
  Paulo : « lors de l'impression du document conserver les couleurs des contrats, etc., de l'ensemble des écritures » ; choix « Papier des contrats
  partout » : tout document imprimé depuis l'app sort avec les données réelles, au graphisme des contrats (en-tête, pied, logo noir puis gris, noir des
  contrats, gris de l'en-tête, rouge pour les montants), sans les anciens fonds de page ni images des modèles ; fait par étapes, avec épreuves.
  **Étape 1 (faite, épreuves 17QUE validées par Paulo le 30.10.2026, « Tous les montants » en rouge)** : documents faits d'un modèle .dpdoc.
  `svDpHTML` enveloppé (repère `/*sgimp:<id>*/` dans la feuille de style ; rep, jobs, o gardés dans `SGIMP.memo`, 40 derniers) ; `sgImpPreparer`
  met en forme dans l'app toutes les valeurs (svFmtVal, cellules comme svDpCell, colonnes svDpCols, styles de rangée du modèle) et `sgDsPdf`
  (bloc 30, option `o.jobs`) dessine le PDF : champs remplis (vides = rien), tableaux de données au pas 5 mm / 4 mm (filet sous chaque ligne,
  « tt » encadré, Regular selon le style de rangée, nombres sans alignement donné à droite, un mot jamais coupé à la lettre : corps réduit à 6,5 pt
  puis gouttières), montants non nuls (deux décimales, colonnes de nombres ou alignées à droite, valeurs des champs) en rouge #E2001A Regular ;
  en-tête TITRE / « <n°> - <affaire> » / « CULLY - date » ; un exemplaire par job (lettres) : logo noir sur sa 1re page, numérotation propre ;
  signature enregistrée dessinée, images fixes des modèles jamais. `ch03bView` montre ce PDF (cadre sans `sandbox`, zoom masqué ; Imprimer,
  PDF, Partager, « Modifier les textes… » inchangés) ; `ch03aApi('/api/pdf')` rend ce PDF pour tout HTML repéré (Sauvegarder et ouvrir,
  Enregistrer sous forme de fichier PDF, aperçu, Partager, Joindre) et annonce toujours un moteur PDF (les autres HTML demandent encore le
  serveur de sauvegarde) ; `svDpPrint` / `svbDpPrint` ouvrent la visionneuse ; `mgPrint` (rapports Management et Planification RH, 1re section,
  jeu 0) remplacé : mêmes valeurs, rangées mgSt → styles du papier. Couvre contrôle des coûts (14 types), devis général, appels d'offres, honoraires
  et facturation du moteur, rapports Management. Vérifié : 164 documents types identiques à l'octet (Documents Substances inchangés). Inventaire
  de toutes les impressions (familles A à E, ~150 documents) : atelier de la session, `inventaire_impressions.md`.
  **Étape 2 (faite, épreuves 22GUS validées le 30.10.2026)** : impressions HTML écrites à la main (famille B : séances, rapports d'heures et de
  frais d'affaire du Controlling, disponibilités, descriptifs d'appel d'offres, listes de secours…), qui arrivent toutes dans `ch03bView` par la
  fausse fenêtre `ch03bWin`. `sgImpVueHtml` affiche le HTML comme avant, le LIT au chargement tel que le navigateur l'a mis en page (styles
  calculés : `sgImpLire`) puis le redessine par `sgDsPdf` (`sgImpSynthese` : modèle .dpdoc synthétique + exemplaire) : h1/h2 → titres de
  chapitre, tableau sans rangée de titres (≤ 3 colonnes) et `display:grid` → grille libellé / valeur, tableaux → tableaux de données (rangée en
  gras + filet haut, ou classe « tot » → total encadré ; largeurs d'après le contenu ; 9 colonnes ou plus de 110 signes → paysage), rangées
  `flex` → grille (≥ 11 pt : titre), paragraphes ; valeurs en champs (montants en rouge). `SGIMP.parHtml` : le HTML d'origine reste la source
  du bouton PDF. Pas convertis : `tplpage` (étape 3), SVG / canevas (QR-facture, graphiques), documents sans titre ni tableau. Heures jamais en
  rouge (`SGIMP_HEURES` : colonnes Durée, Heures, Temps, Quantité ; nombre suivi de « h »). `sgDsPdf` (exemplaires) : chaque colonne reçoit au
  moins la largeur de son plus long mot, prise sur les colonnes qui ont de la place.
  **Étape 3 (faite, épreuves validées le 30.10.2026)** : formulaires de la Bibliothèque (`tplPrint`, collection `modele` : rapports de temps,
  notes de frais, listes d'adresses, intervenants, tâches, anciens documents…). `tplPrint` remplacé : document refait à partir de ses données
  et du formulaire choisi (`tplFind` inchangé) — titre → en-tête et titre de chapitre, date du document → en-tête, textes fixes et champs
  (`tplFieldValue`) dans l'ordre de lecture, seulement les lignes qui tiennent dans la hauteur de leur case (« Solde\n\n\nd » → « Solde »),
  ceux d'une même ligne en grille aux largeurs des cases ; tableau principal `o.cols` / `o.rows` (_bold → gras, _bold + _line → total
  encadré) et tableaux secondaires à leur place ; texte coulant (`o.flow`) ; page de garde (`o.cover`) en tête puis saut de page ; numéro
  de page, titre et date du formulaire laissés au papier ; fonds, traits, images jamais ; orientation de la 1re page du formulaire. Les
  rapports de temps (catégorie `timeTemplates`) n'ont aucun rouge. Ancien rendu gardé : page QR jointe (`o.extra`), formulaire introuvable.
  Sortie : petit HTML repéré écrit dans la fenêtre (`o.win` ou fausse fenêtre) → visionneuse avec le PDF.
  **Étape 4, 1re partie (faite, validée le 30.10.2026)** : documents de la coquille. `sgImprimer` (heures du projet, situation des heures, rapport
  d'un collaborateur) et `sgDocOuvrir` (contrat de travail, avenant, fin des rapports de travail, décompte de sortie, fiche contact) remplacés :
  HTML mis en page dans un cadre caché (`sgImpCadre`, largeur A4, contenu posé AVANT l'insertion du cadre), lu par `sgImpLire`, PDF ouvert dans
  `sgVisionneuse` ; pied « maison » `sgPiedDoc` plus mis ; grille à filet en haut → signatures (filet au-dessus de chaque case, 12 mm entre
  elles, 14 mm avant) ; paragraphe « <b>Libellé</b><br>… » → libellé gras + suite collée ; montants « 6'500.- » aussi en rouge. Repli : ancien
  rendu.
  **Étape 4, 2e partie (faite le 30.10.2026)** : fiche de faisabilité — images (`sgImpImages` : PNG / JPEG tels quels, sinon relus par fetch
  CORS — cartes WMS de geo.admin.ch — ou rastérisés au double de leur taille affichée ; dessins SVG sérialisés avec la police du document)
  reprises dans le PDF à leur taille affichée (bande Image, hauteur `b.h` mm, 180 mm au plus ; `sgDsPdf` exemplaires : hauteur de la bande) ;
  image illisible laissée de côté. Ancien livret du devis général (choix de Paulo « Oui, à la fin ») : l'aperçu interactif (`ch02bPreview` :
  sauts de page, pinceau) reste ; `ch02bPrint` (« Imprimer ») remplacé — page de garde, champs de la 1re page, un seul tableau sur toutes les
  pages du livret (rangées « T » encadrées, « O » / « W » / « G » en gras, lignes vides sans filet), sommaire à part ; PDF dans `sgVisionneuse`.
  **Pas convertis** (ancien rendu) : QR-facture et facture DeltaSub avec page QR (norme suisse), `ctPrintOverview` (récapitulatif de contrat,
  ancien document), impressions de Facturation.html (contrats, factures, PV : ce sont les références du papier).
  Copie d'avant : `subgestion3/_backup_20261030_2026_avant_impressions/`, `SUBGestion3_backup_20261030_2026_avant_impressions.html`.
- **Bibliothèque sans « Images » ni « Fonds de page » (30.10.2026, demande de Paulo « supprimer fonds de pages et images »)** : entrées
  `tpl-images` et `tpl-backgrounds` retirées du menu (et leurs chiffres de la vue d'ensemble) ; `go` les ramène à `dom-biblio` (reprise de session,
  récents, favoris). Écrans du moteur gardés dans DeltaSub.html ; données gardées (collections `image` et `arriereplan` : les modèles d'impression
  du moteur et « Français seulement » s'en servent). Copie d'avant : `subgestion3/_backup_20261030_1957_avant_biblio_sans_images/`.
- **Nouveau contrat : prestations de l'architecte seulement (30.10.2026, demande de Paulo « dans nouveau contrat supprimer les types de
  prestations qui ne sont pas celles de l'architecte, comme ingénieurs, etc. »)** — fin du bloc 18 de `sg3_plus.js` : « Type de prestations »
  de « Nouveau contrat » (`ctEdit`) et de « Nouveau contrat d'honoraires » (`feEditFee`) = « Prestations de l'architecte » seulement
  (`HF_SERVICES` réduit ; « garantie des coûts » retirée avec les ingénieurs, le géologue et le paysagiste) ; valeurs Z1 / Z2 du calcul =
  SIA 102 seulement (`FE_Z1`, `FE_Z2`) ; « Contrat selon » de « Choix du mode de calcul des honoraires » (`feNewFee`, enveloppé) sans SIA 1003,
  1004, 1005, 1006, 1008 (`FE_BASEDON` filtré le temps de construire la liste : `feBasedOn` affiche toujours le contrat d'origine des calculs
  existants). Le « Nouveau contrat » de Facturation n'avait que des prestations d'architecte. DeltaSub.html seul : listes d'origine.
- **Contrat d'honoraires du moteur : mode de calcul (30.10.2026, demande de Paulo « impossible lors de la création de contrat basé sur delta
  d'inscrire les prestations qui sont comprises comme les pourcentages des phases »)** — `DeltaSub.html` : seuls les modes 3 « Coût de l'ouvrage »
  et 4 « Temps employé effectif » ont le bouton « Calculer » de la variante (`calcMode`, puis `feTimeParts` → `feSIA` → « Prestations SIA 102 »
  `feSiaSel` : phases et pourcentages) ; le mode était « Global » par défaut et figé à la création (le contrat de test 17QUE était bloqué).
  Désormais : « Choix du mode de calcul » (`feNewFee`) = « Coût de l'ouvrage » par défaut, avec une phrase d'aide par mode (`feModeChoix`,
  `FE_MODE_AIDE`) ; « Editer le calcul des honoraires » (`feEditFee`) : mode modifiable, confirmation (`feAsk`, OK bloqué pendant la question)
  si des calculs existent (montants gardés) — SAUF en-tête qui a des calculs en mode 3 ou 4 (« Mode figé ») : relecture du 30.10.2026, leurs
  phases, facteurs et lignes resteraient imprimés (`ch11cFeeJob`, `fePrint`) et importables en facture (`fePosFrom`, `ivFeeCalc`) dans un autre
  mode ; les modes 1, 2, 5 n'en ont pas. Calcul en mode 1, 2 ou 5 (`feEditCalc`) : indication « pas de phases, choisir Coût de l'ouvrage ».
  « Nouveau contrat » sans calcul relié (`ctEdit`, `aideCalc`) : où inscrire les phases (Offres d'honoraires ▸ calcul, puis « Nouveau contrat
  basé sur un calcul … »). `feAsk` donne le focus à la question (Échap n'atteint plus la fenêtre de derrière). Copie d'avant :
  `DeltaSub_backup_20261030_2031_avant_mode_calcul.html`.
- **Avancement des prestations = proposition D « Proposé par les heures » (30.10.2026, bloc 31, `subgestion3/sg3_avancement.js`, concaténé
  en dernier ; demande de Paulo « modifier la manière de sélectionner l'avancement des prestations, modifier la représentation », puis
  « applique la proposition D » parmi 4 maquettes — `subgestion3/_backup_20261030_maquette_avancement/`)** : `imDomain` du moteur enveloppé
  (page du projet ▸ Avancement des prestations, Archives ▸ Registre…) ; Archives ▸ Honoraires (ancien) ▸ Avancement (`anc-avancement`) garde
  l'écran d'origine. Bandeau jaune (projet, contrats, parts SIA comprises, honoraires HT si `sgAdmin()` ou chef de projet et finances non
  verrouillées), date de l'état ; chiffres (effectif, prévu, écart, proposé par les heures, heures saisies / contrat) ; tableau des phases
  partielles 31–53 : heures consommées (rouge au-delà du contrat), avancement PROPOSÉ = heures saisies ÷ heures du contrat par crans de 5 %, au
  plus 95 % (heures épuisées → « à juger »), avancement RETENU au curseur (glisser, clic, flèches, − / +, P / « Reprendre », « Reprendre toutes les
  propositions »), prévu par − / + ; alertes (risque de dépassement, heures dépassées) ; courbe heures / effectif / prévu ; journal des états
  (consultation, « Rouvrir pour modifier », « Supprimer l'état »). Enregistrement en UN `DS.commit` : collection propre **`sgavancement`** {ID,
  PROJECT_ID, DATE, NOM, REMARQUE, EFF, PREV, PROP (par phase partielle), GLOBAL_EFF, GLOBAL_PREV (pondérés par les parts SIA, 1 décimale), IMPL_ID,
  PAR, MODIFIE} + la ligne **`projectimplementation`** de la même date (SCHEDULEDVALUE / CURRENTVALUE = % globaux entiers, lus par le Management) ;
  une seule ligne par (projet, date) : même date → « Remplacer l'état du … ? » (doublons et autres lignes de la date supprimés) ; un seul
  enregistrement à la fois (`u.enCours`). Parts SIA des contrats reliés, sinon parts SIA 102 standard (sans contrat, ou contrats sans parts 31–53 :
  expertises, anciens contrats — l'en-tête le dit) ; contrats pas encore lus → « Enregistrer » désactivé jusqu'au redessin. Droits : modifier =
  administrateur, « projets modifiables : tous », ou « ses projets » pour un projet attribué ; sinon lecture seule (ni curseurs ni boutons).
  Redessin sur place quand la base change (défilement, saisie et focus gardés ; attend la fin d'un glisser). Serveur du NAS : rien à changer
  (`sgavancement` rattachée au projet par PROJECT_ID, collection propre gardée par les reprises ; `projectimplementation` protégée). Relu et vérifié
  par workflow (8 défauts confirmés, corrigés) ; essayé dans l'aperçu sur 17QUE (enregistrer, remplacer, supprimer, lecture seule, écran d'origine).
  Débogage : `window.SGAV`. Styles `#sgav-css`, classes `sgav-*`.
- **Offres d'honoraires, Contrats honoraires et Factures de l'affaire = calcul d'honoraires et factures du bureau (01.11.2026, bloc 32,
  `subgestion3/sg3_offres.js`, concaténé en dernier ; demandes de Paulo : « dans projets, offre d'honoraires : créer une liste des offres de
  l'affaire, designer selon le reste de l'app ; mettre la version actuelle dans archives, ne pas effacer ; lorsque je crée un contrat, la version
  que j'avais développée et pas la version de Delta », « toutes les offres dans Offres (retenues, annulées…) ; dans Contrats honoraires uniquement
  les contrats signés ; les versions signées restent aussi dans Offres ; sous le titre, le nombre d'offres et d'offres annulées ou refusées »,
  « dans Factures, le module de l'ancienne version que j'avais développée, la version Delta dans archives ; uniquement les factures de l'affaire ;
  en haut des stats : factures ouvertes, contrat, hors contrat, reste à facturer, situation par rapport aux heures — définir les pourcentages en
  analysant les heures depuis la dernière facturation, pour déterminer les honoraires de la prochaine facture »)** : `feDomain`, `ctDomain` et
  `ivDomain` du moteur enveloppés (page du projet, Archives ▸ Registre…) ; Archives ▸ Honoraires (ancien) ▸ Offres d'honoraires / Contrats
  honoraires et Facturation (ancien) ▸ Factures (`anc-offres`, `anc-contrats`, `anc-factures`) gardent les écrans d'origine — rien n'est effacé
  (`projectfee`, `projectcontract`, `projectinvoice` restent dans la base) ; lien « Ancienne version » en pied de chaque page.
  Données = Facturation reliée à l'affaire (`sgContratsDuProjet` : code d'affaire, sinon `sg3_liens`). Même présentation que l'Avancement :
  bandeau jaune (numéro, désignation, maître de l'ouvrage, nombres), chiffres sans icônes (un clic = filtre), tableau `nx-tbl`.
  **Offres d'honoraires** : toutes les offres, dans l'ordre chronologique — en cours (brouillon, envoyée), retenues (signées ou terminées),
  annulées ou refusées (Facturation n'a que « annulé » pour une offre non retenue) ; colonnes étendue (`sgContratEtendue`) + Avenant, date,
  commentaire de la dernière version, type, version, HT, TTC, état ; Ouvrir (PDF, `fx-contrats cv:`), Modifier (`fx-calchono c:`) ;
  « Nouvelle offre d'honoraires » = calcul d'honoraires de Facturation pour l'affaire (`fx-calchono newaff:<n°>`) ; « Relier une offre… »
  (offre sans affaire). **Contrats honoraires** : contrats SIGNÉS seulement (signé ou terminé, jamais annulé ; au NAS le 20.10.2026 aucun contrat
  n'était marqué signé : la page sera vide tant que les offres ne sont pas marquées « signé » dans Facturation ▸ Contrats) ; Ouvrir, Modifier
  (contrat signé = verrouillé : nouvelle version / avenant), Facturer (`fx-saisie nf:`) ; « Nouveau contrat d'honoraires » = calcul de Facturation.
  Tuiles de la page du projet : « n offres · x annulées ou refusées », « n contrats signés », « n factures · x ouvertes » (`sgPdomCompte`
  enveloppé, Facturation lue à la demande).
  **Factures** : factures de Facturation de l'affaire seulement (contrats reliés + factures sans contrat au code de l'affaire, `cl_affaire` ou
  « _<code>. » du numéro) ; chiffres (deux rangées de trois) : Factures ouvertes (TTC, échues en rouge), **Total reçu (TTC)** (factures payées,
  honoraires et frais, nombre et % du facturé ; ajouté le 01.11.2026 à la demande), Contrat (TTC, facturé et %), Hors contrat (factures sans
  contrat), Reste à facturer (contrat − facturé sur contrat ; négatif = facturé au-delà), **Heures à facturer** (total de la situation, honoraires
  TTC correspondants ; une phase partielle comptée une fois, au contrat le plus actuel qui la couvre) ; **Situation par rapport aux heures** — sous le
  tableau des factures (01.11.2026) — par contrat (ni annulé ni terminé, avec prestations SIA et montant ; plusieurs contrats : choix, celui de la
  dernière facture d'office). **Lecture seule depuis le 02.11.2026** (Paulo : « ne doit pas être modifiable, mais uniquement une vue des heures
  actuelles en rapport aux heures facturées et facturables ; supprimer avancement à facturer, etc. ») : par phase partielle 31–53, part du contrat,
  heures au contrat (TIMEBUDGET des phases partielles du projet), heures saisies (jauge sur les heures du contrat, rouge au-delà ; trait noir =
  facturé à ce jour), heures **facturables** (cochées « Facturable », plafonnées aux heures du contrat de la phase pour un forfait — non
  facturables et dépassement signalés), heures **facturées** (part facturée de la phase — pourcentages cumulés de la dernière facture
  d'honoraires du contrat — × heures du contrat), **à facturer** (facturables − facturées ; négatif = « facturé d'avance », en vert), facturé à ce
  jour (% de la phase, % du mandat) ; ligne Total ; légende, avec les honoraires TTC correspondant aux heures à facturer (honoraires de chaque
  phase ÷ ses heures au contrat). Ancienne facture sans pourcentages : facturées / à facturer « inconnu ». Retirés : avancement proposé et à
  facturer (− / +, saisie), « Reprendre les propositions », décompte de la prochaine facture, « Préparer la facture » (`preparer`, `remplirNfp`,
  route `fx-saisie nfp:`) ; « Nouvelle facture » (en-tête) et « Modifier » restent. Copie d'avant : `subgestion3/_backup_20261102_avant_situation_heures/`.
  (Version du 01.11.2026, retirée : avancement proposé par les heures, crans de 5 %, au plus 95 %, avancement à facturer modifiable, pied
  honoraires cumulés / déjà facturé / à facturer / frais, « Préparer la facture » qui reportait les pourcentages dans la saisie de Facturation.)
  ⚠ **La saisie de facture de Facturation (`calcF`) applique encore le rabais du contrat (`f_rabais` = `c.rabais`) à `c.hht`, qui le comprend
  déjà** (`applyCalcHono` : `hht = htFinal`, après rabais et arrondi) — relevé avec « Préparer la facture », la saisie) sans rien corriger — question posée à Paulo le 01.11.2026. Tableau des factures (années, contrat ou « Hors contrat », honoraires,
  frais, total, échéance, état ; Ouvrir = PDF de la facture, `fx-factures fv:<id>`, retour à la page en fermant ; Modifier = `fx-saisie f:<id>`).
  Droits : tuiles selon `sgPdomListe` (contrats / factures : lecture) ; créer, modifier, relier = `SG_VUE_DROIT['fx-calchono']` ; Facturer,
  Préparer = `fx-saisie`, jamais pour le profil collaborateur ; montants masqués si `sgFinVerrou()` (« Déverrouiller » si code d'accès).
  **Honoraires et frais séparés partout (01.11.2026, demande de Paulo « séparer les honoraires contractuels des frais, idem pour les factures ;
  voir le montant des honoraires TTC sans les frais »)** : montants en grand = honoraires TTC SANS les frais, frais sur la ligne du dessous
  (`frl`) — Factures : « Factures ouvertes · honoraires TTC », « Total reçu · honoraires TTC », « Contrat · honoraires TTC » (frais contractuels
  et %), « Hors contrat », « Reste à facturer » (frais restants = frais contractuels − frais facturés), « Heures à facturer » ; tableau des
  factures : Honoraires TTC (gras), Frais TTC, Total TTC. Offres et Contrats : colonnes Honoraires HT, Honoraires TTC, **Frais TTC** (% de frais
  du contrat `c.frais` × honoraires TTC, comme Facturation ; « facturés … » dessous), Honoraires facturés TTC ; chiffres avec frais contractuels,
  frais facturés, frais restants. **Notes de frais** (type « Note de frais… », numéro …NF01 / …NFF : montant enregistré dans `_ttc`) comptées en
  FRAIS (`estNF`, `ttcF` / `fraisF`), aussi dans le « déjà facturé » de la situation (honoraires seuls ; dernière facture d'honoraires = la
  dernière qui n'est pas une note de frais ; factures annulées exclues). Vérifié sur 17DAV : 150'000 d'honoraires facturés = contrat, note de
  frais finale 4'500 = frais contractuels (3 %).
  Débogage : `window.SGOF`. Styles `#sgof-css`, classes `sgof-*`. Copie d'avant : `subgestion3/_backup_20261101_1801_avant_offres_honoraires/`,
  `SUBGestion3_backup_20261101_1801_avant_offres_honoraires.html`.
  **Facturation DANS la page du projet (01.11.2026 au soir, Paulo : « ce n'est pas la bonne version pour la création des offres ; charge la méthode
  de calcul d'honoraires de l'app actuelle, puis crée la liste des contrats de l'affaire comme Contrats d'honoraires de l'app ; charge tout ça dans
  projet » — choix : liste des offres gardée + calcul dans le projet ; Contrats = liste de l'app, contrats signés ; Archives inchangées)** : avant,
  « Nouvelle offre », « Modifier », « Ouvrir », « Facturer » ouvraient les écrans fx-* (menu basculé sur Administration ▸ Facturation). Désormais le
  cadre Facturation (`#fx-layer`, classe `sgof-dans`, position recalculée par ResizeObserver) est posé SUR la page du projet, sous la barre des
  domaines et une barre jaune pâle (`.sgof-emb-bar` : numéro, rubrique, « Fermer » / « Retour à la liste » / « Offres d'honoraires ») ; menu, en-tête
  et barre des domaines restent sur le projet (`allerFx`, `dans`, `poser`, `fermer`, état `EMB`). **Offres** : nouvelle offre (`newContratCalc`
  enveloppé dans le cadre : code d'affaire repris), Modifier (`editContratCalc`), Ouvrir (`sgVoirContrat`) ; retour à la liste des offres, redessinée,
  par « Fermer », à l'enregistrement ou la suppression du contrat (Facturation passe à sa liste des contrats) et à la fermeture du PDF. **État d'une
  offre** changé depuis la liste (bouton de la colonne État → `chSetContratFlag` de Facturation : envoyée, signée — elle devient un contrat —,
  annulée ou refusée, terminée ; mêmes confirmations, verrou et validation qu'ailleurs ; liste redessinée par l'enveloppe de `renderContratsTable`).
  **Contrats honoraires** = la liste « Contrats d'honoraires » de Facturation elle-même (colonnes, cases, Ouvrir, Modifier, Archiver, Supprimer),
  limitée aux contrats SIGNÉS de l'affaire (terminés compris) : `renderContratsTable` de **Facturation.html** respecte un filtre facultatif
  `window.SG_CONTRATS_FILTRE` {f, vide} qui remplace celui des archivés (sans effet ailleurs : Facturation seule, SUBGestion v1) ; « Afficher
  archivés » et « Nouveau contrat » masqués (`html.sgof-liste` du cadre) ; Modifier → calcul dans le projet, « Retour à la liste ». Sans droit
  `fx-contrats` ou finances verrouillées : la liste en lecture d'avant (`dessiner`). **Factures** : Ouvrir (PDF), Modifier, Nouvelle facture,
  dans le projet ; retour aux factures de l'affaire par « Fermer », à
  l'enregistrement ou la suppression (Facturation passe à sa liste des factures) et à la fermeture du PDF. Domaine protégé par code : déverrouillage
  demandé comme par `go` ; `sgVerrouiller` retire le cadre. Toute navigation (`go` enveloppé) retire le cadre ; un écran fx-* le rouvre en plein,
  sans filtre. Onglet de Facturation inattendu ou accueil (`sgFxOnTab`, `sgFxHome` enveloppés) → retour à la page de l'affaire. Vérifié : aucune
  donnée modifiée par l'ouverture / la fermeture (contrat 22SEG, 363 factures). Copies d'avant : `Facturation_backup_20261101_2114_avant_contrats_dans_projet.html`,
  `subgestion3/_backup_20261101_2114_avant_facturation_dans_projet/`, `SUBGestion3_backup_20261101_2114_avant_facturation_dans_projet.html`.
  **Offres d'honoraires = la liste de l'app aussi (même soir, précision de Paulo : « une liste identique à Contrats d'honoraires, uniquement les
  offres en lien avec l'affaire, la même mise en page avec les icônes »)** : la page Offres d'honoraires pose elle aussi la liste « Contrats
  d'honoraires » de Facturation, limitée à TOUTES les offres de l'affaire (archivées comprises — annulées et terminées le sont d'office —, grisées
  comme dans l'app) ; « + Nouveau contrat » (et l'assistant) = nouvelle offre pour l'affaire ; Modifier → calcul dans le projet, « Retour à la
  liste » ; barre : « n offres · x annulées ou refusées », « Relier une offre… ». Classes du cadre : `sgof-liste` (« Afficher archivés » masqué) et
  `sgof-signes` (Contrats honoraires : « Nouveau contrat » masqué). L'ancienne liste de la coquille (`dessiner`, bouton d'état → `chSetContratFlag`)
  ne sert plus que sans droit `fx-contrats` ou finances verrouillées. Copie d'avant : `subgestion3/_backup_20261101_2128_avant_offres_liste_app/`.
  **Liste des offres sans recherche ni filtres (même soir, Paulo : « pas nécessaire dans la liste des offres »)** : Rechercher, Type, Rémunération
  et « À définir uniquement » masqués (`html.sgof-offres` du cadre) ; leurs valeurs (celles de Administration ▸ Facturation ▸ Contrats d'honoraires)
  sont vidées le temps de la page (`EMB.filtres`) et rétablies en la quittant (`fermer`). Contrats honoraires garde la recherche et les filtres.
  Copie d'avant : `subgestion3/_backup_20261101_2134_avant_offres_sans_filtres/`.
- **Planning du projet et du chantier (02.11.2026, bloc 33, `subgestion3/sg3_planning.js`, concaténé en dernier ; demandes de Paulo « dans mes
  projets, projet ajoute planning », « dans chantier aussi »)** : page du projet ▸ Projet ▸ **Planning** (« Planning du projet ») et Chantier ▸
  **Planning** (« Planning du chantier », en tête du groupe) ; `SG_PLAN_PAGES` (sg3_plus.js) → `sgPlanningModule(C,p,'projet'|'chantier')`, compteur
  `sgPlanningCompte` (« n étapes · fin mm.aaaa », « à créer »). Le moteur n'avait que la planification RH ; les contrats de Facturation n'ont qu'un
  planning d'intention (chapitre 4 : `detail.planDelais` en texte, `detail.planGantt` en mois). Collection propre **`sgplanning`** (gardée par les
  reprises ; serveur du NAS : règle « projet modifiable » par PROJECT_ID, rien à changer) : {ID `<projet>:projet|chantier`, PROJECT_ID, TYPE,
  LIGNES [{id, t tache | jalon | titre, lib, d, f (ISO ; jalon : d), pp (phase partielle SIA liée), ent (entreprise / intervenant), rouge, rem}],
  MODIFIE, PAR}. Écran : bandeau jaune, chiffres (Début, Fin prévue, Durée, En cours, Prochaine échéance), barre (Échelle **Tout** — ajustée à la
  largeur, d'office — · Semaines · Mois · Trimestres, Aujourd'hui, Heures réelles ; Tâche, Jalon, Titre, Créer ▾), diagramme (étapes à gauche,
  barres bleu nuit, jalons en losange, échéance importante en rouge, titre = accolade sur ses étapes, ligne pointillée d'aujourd'hui, barre fine
  grise = heures saisies sur la phase partielle liée — période principale, de 5 % à 95 % des heures, pour écarter les heures isolées). Glisser une
  barre = la déplacer, ses bords = début / fin (par semaines à petite échelle) ; clic = « Modifier l'étape » (sorte, libellé, phase partielle,
  début / durée en semaines / fin, entreprise avec la liste des intervenants, échéance importante, remarque ; Supprimer) ; clic droit = Modifier,
  Insérer tâche / jalon / titre, Monter, Descendre, Dupliquer, Supprimer. **Créer** : phases SIA (celles des contrats reliés, sinon 31–33 /
  41–53) — phases déjà travaillées aux dates de la feuille d'heures (période principale ; fin réelle si la phase est finie, sinon au moins la durée
  type), les autres à la suite (durées types `DUREE`), jalons « Dépôt de la demande de permis de construire » (début de 33), « Permis de construire »
  (rouge), « Début des travaux », « Réception de l'ouvrage » (rouge) ; chantier sans étape : à la suite du planning du projet ; planning d'intention
  graphique du contrat (`planGantt` → titres et tâches datées) ; entreprises du projet (intervenants rôle 19, sous un titre « Travaux par
  entreprise », aux dates de l'exécution) ; Effacer tout. Délais du contrat (`planDelais`) rappelés en bas (droit « contrats : lecture »).
  **Imprimer** : tableau des étapes + diagramme SVG → `sgImprimer` (papier des contrats, visionneuse). Droits : lecture = qui voit le projet ;
  écriture = projet modifiable (`sgAdmin`, « projets modifiables : tous », ou « ses projets » attribués). Débogage `window.SGPL`, styles `#sgpl-css`.
  **Page du projet, même jour** : groupe **Enquête** entre Projet et Chantier (Paulo : « entre chantier et projet ajouter enquête » ; `SG_PMOD_G`,
  icône `tampon`) = Dossier d'enquête (retiré du groupe Projet ; ouvre toujours le module Projet sur sa rubrique, « Domaines » revient au groupe
  Enquête ; chip « Enquête » → même rubrique) ; groupe Projet = PV MO, Présentation, Planning, Documents, puis **à la ligne** Estimations et
  Descriptifs & devis (Paulo : « estimations, descriptif & devis mettre à la ligne » ; `SG_TUILE_BR` → classe `.sg-tile.br`, `grid-column-start:1`).
  Copie d'avant : `subgestion3/_backup_20261102_avant_planning/`.
  **Indices et archives du planning (02.11.2026, même bloc ; Paulo : « la mise à jour des plannings fait partie de notre travail, mais il est
  important de conserver une archive des plannings précédents » ; choix : indices en NOMBRES, copies automatiques gardées 3 mois, un indice émis
  ne peut être supprimé par PERSONNE, liste limitée au planning du projet et de la phase ouverts — pas de liste des plannings du bureau)** :
  collection propre **`sgplanningarch`** — indice émis {ID `<projet>:<sorte>:i<n>`, SORTE `indice`, INDICE, DATE, MOTIF (obligatoire),
  DEST, REM, LIGNES, EMIS, PAR} ; copie automatique {ID `<projet>:<sorte>:a<MODIFIE en chiffres>`, SORTE `auto`, DATE = jour de l'état, MODIFIE,
  LIGNES, CREE}. Copie automatique dans le même `DS.commit` que la modification : à la première modification d'une journée (état de la veille ou
  plus ancien), et toujours avant « Effacer tout » et « Repartir de cette version » ; pas de copie si l'état est déjà le dernier indice ou la
  dernière copie ; copies de plus de 92 jours (`AUTO_JOURS`) retirées au prochain enregistrement. Bandeau : liste déroulante des versions
  (`menuVersions` : « Indice n · en cours », Indices émis, Copies automatiques, « Émettre l'indice n… »), bouton « Émettre l'indice n » (date,
  motif — « Planning initial » proposé pour l'indice 1 —, destinataire, remarque ; `enregistrerIndice`, création seule `bseq:0`). Archive ouverte
  = lecture seule, bandeau « Archive · Indice n du … » (motif, destinataire, émis le), « Revenir à la version en cours », « Repartir de cette
  version… » (`repartir`). Barre : « Comparer avec » (version en cours depuis une archive, indices, copies ; d'office le dernier indice s'il diffère
  de la version en cours) → barres de l'autre version en pointillé (`.sgpl-gh`), glissement à droite du nom de chaque étape (fin, sinon
  « début … » ; rouge = repoussée, vert = avancée, « nouvelle »), Fin prévue comparée, étapes retirées sous le diagramme (`apparier` : même
  identifiant, sinon même sorte, libellé et phase). Imprimer : version dans le PDF (« Indice 2 du … · motif », « État du … (copie automatique) »,
  « Version de travail du … (indice n non émis) ») ; version en cours non émise → « Imprimer sans émettre » ou « Émettre l'indice n… » puis
  imprimer. Tuile : « … · indice n ». **Serveur du NAS** : `sg_refus_fige` (`serveur_deltasub.py`, appelé avec `sg_refus_ecriture`, avec ou sans
  ouverture de session) refuse toute modification ou suppression d'un enregistrement `sgplanningarch` de SORTE `indice` (403) ; actif après
  redémarrage du conteneur. En fichier local (sans serveur), seule l'app protège les indices (aucune action de suppression). Copie d'avant :
  `subgestion3/_backup_20261102_avant_indices_planning/`.
- **Permis de construire (02.11.2026, bloc 34, `subgestion3/sg3_permis.js`, concaténé en dernier ; demande de Paulo « dans enquête ajouter un module
  permis de construire »)** : page du projet ▸ groupe Enquête ▸ tuile « Permis de construire » après « Dossier d'enquête » (`SG_PMOD` 'dom', `SG_PMOD_G`,
  compteur `sgPermisCompte` dans `sgPdomModuleCompte`, page `sgPermisModule` dans `drawC` de `nx-pdom`, icône `NXI.permis`). Collection propre
  **`sgpermis`** (gardée par les reprises ; serveur du NAS : règle « projet modifiable » par PROJECT_ID, rien à changer), une DEMANDE par
  enregistrement {ID `<projet>:<identifiant aléatoire>` (jamais réutilisé : la base du NAS garde la trace d'un identifiant supprimé et
  refuserait sa recréation par un 409), PROJECT_ID, N (numéro d'ordre), LIB, PROC `enquete` | `dispense` | `autre`, AUTORITE (d'office « Municipalité de <commune> » :
  commune de Parcelle & règlements, sinon lieu de l'affaire), NUM_COMMUNE, NUM_CANTON (n° CAMAC), PARCELLES, FAO, OBJET, REM, DATES {depot, enq_d,
  enq_f, synthese, decision, notif, recours, debut, habiter, peremption}, DECISION `delivre` | `refuse`, RECOURS {etat depose | retire | rejete |
  admis, date, fin, rem}, VALIDITE (ans, 2), PROLONG (mois), OPPOSITIONS [{id, date, sorte opposition | observation, auteur, motifs, suite suspens |
  reponse | levee | retiree | maintenue, rem}], CONDITIONS [{id, num, source, texte, quand avant | pendant | habiter | autre, resp, etat regler | cours
  | reglee, le, rem}], MODIFIE, PAR}. Écran : bandeau jaune, choix de la demande (+ Nouvelle demande : demande complémentaire, reprend autorité,
  numéros, parcelle), chiffres (État, Enquête publique, Oppositions, Conditions à régler, Validité du permis — rouge à moins de 90 jours), frise
  de la procédure (dépôt → enquête → synthèse CAMAC → décision → notification → fin du délai de recours → début des travaux → permis d'habiter ;
  carré plein = fait, jaune = en cours ; un clic = « Dates et décision »), fiche de la demande, oppositions et observations, conditions et charges
  (filtre À régler / Toutes ; « Coller une liste… » avec aperçu : une condition par élément numéroté — 1. / 1.1 / a) / tiret, sous-éléments 1a,
  1b…, titres « … : » ou « 1. Généralités » placés devant leurs sous-éléments, introduction « … : » retirée — sinon par paragraphe ; numéros
  jamais en double), documents du permis = dossier
  « Projet/33 …/Autorisations » du dépôt (`sgDocsModule` + `sgDeposerDlg` phase 33, type Autorisations : les mêmes fichiers que le module Projet).
  Dates PROPOSÉES si non saisies (gris italique, « reprendre » dans la fenêtre, recalculées pendant la saisie) : fin de l'enquête = début + 29 j
  (30 jours) ; fin du délai de recours = 30 jours dès la notification (sinon la décision), aussi après un refus, féries non comptées (Pâques
  ± 7 j, 15.07–15.08, 18.12–02.01, LPA-VD) et report au premier jour ouvrable (samedi, dimanche, fériés vaudois : table `publicholiday` du
  bureau, sinon liste vaudoise ; `finDelai`) ; péremption = décision (après un recours rejeté / retiré : décision sur recours) + validité +
  prolongation − 1 j, aucune pendant un recours ni après un recours admis — indicatives, à vérifier sur l'avis d'enquête et le permis. Une fin
  de délai de recours seulement proposée et passée → « Délai de recours échu ? (à vérifier) » : la saisir (« reprendre ») pour « Permis en
  force ». Changer de procédure ne supprime aucune date (fusion des seules dates de la fenêtre) ; dates PRÉVUES = jalons du planning du projet / du chantier (dépôt, permis, début des travaux,
  permis d'habiter). État (`etat`) : En préparation, Demande déposée, Enquête annoncée / en cours, En attente de la décision, Délai de recours,
  Délai de recours échu ?, Recours en cours, Permis en force, Permis périmé ?, Travaux commencés (début des travaux passé, pas prévu),
  Permis d'habiter délivré, Permis refusé (· délai de recours), Recours contre le refus en cours, Refus annulé par le recours, Recours admis :
  permis annulé, Permis en force ? (date de la décision sur recours à saisir). Un recours ne vise que la décision antérieure à sa décision sur
  recours (sinon à son dépôt) : une nouvelle décision après un recours admis est suivie normalement (`recEff`), le recours reste dans la fiche
  (« contre la décision précédente »). Frise : étape passée sans date saisie = carré gris. Les fenêtres renvoient la promesse de
  l'enregistrement : elles restent ouvertes s'il échoue (saisie gardée), et n'écrivent que les champs changés depuis leur ouverture (`modifs`)
  sur la version la plus récente : la saisie d'un autre poste n'est pas écrasée, même après un 409 ; une opposition ou une condition supprimée
  ailleurs n'est pas recréée. « Coller une liste » : un numéro n'est reconnu que s'il suit la numérotation (« 2.5 m », « 15.07 » en début de
  ligne repliée restent dans le texte). Défilement gardé au redessin (rétabli après la liste des documents). Tuile : état de
  la dernière demande (nommée s'il y en a plusieurs), conditions à régler. Imprimer : `sgImprimer` (papier des contrats). Droits : lecture = qui
  voit le projet ; écriture = projet modifiable (comme le planning) ; documents = droit du dépôt. Débogage `window.SGPC`, styles `#sgpc-css`,
  classes `sgpc-*`. Copie d'avant : `subgestion3/_backup_20261102_2159_avant_permis/`, `SUBGestion3_backup_20261102_2159_avant_permis.html`.
- **Suivi du projet : Séances, Notes, Tâches, Frais au graphisme de l'app (04.11.2026, bloc 35, `subgestion3/sg3_suivi.js`, concaténé après `sg3_permis.js` ; Paulo :
  « proposer une autre mise en page des modules séances, plus proche du design du reste de l'app », « applique la version B », « adapte notes également à l'app »,
  « idem pour tâches », « idem pour note frais »)** — maquette des variantes A Liste puis page, B Colonne + procès-verbal, C Fil de la série :
  `subgestion3/_backup_20261104_maquette_seances/`. Mêmes données et mêmes fenêtres du moteur ; DeltaSub.html seul garde les écrans d'origine. Instance commune `monter(C,p,cle,besoin,M)`
  (état `ETAT` par projet, défilement et focus de la recherche rétablis : la page du projet redessine à chaque changement de la base). **Séances** (`mtDomain` remplacé) :
  colonne des séries et procès-verbaux (classes `.sgd-*` de Listes de diffusion ; sélection dans `MT.seq` / `MT.mtg`, ses fenêtres y posent ce qu'elles créent ; ↑ ↓ ; clic droit), à droite le
  procès-verbal : bandeau jaune, chiffres (participants, points, décisions, ouverts, en retard), vues Procès-verbal · Points ouverts de la série · Présences (8 dernières séances).
  État affiché : Diffusé (pas brouillon), Prévue (brouillon à venir), Brouillon. Point ouvert : non réglé, et Tâche, Point ouvert ou délai ; dans la série, la dernière occurrence d'un
  point fait foi (points copiés sans lien : reconnus par titre, sinon texte). Carré = réglé (`ISDONE`, direct). **Notes** (branche « Notes » de `domainView` enveloppée) : colonne par
  année + recherche, note à droite ; fenêtre `noteEd`. **Tâches** (`ptDomain` remplacé) : colonne par état (En traitement, Brouillons, Réglées, Annulées) + recherche, chiffres, fiche, description, notes de
  la tâche ; fenêtres du moteur (`ptPickCatalog`, `ptEditFull`, `ptDelete`, `ptPrintTask`, `ptPrintList`, `ptExport`). **Frais** (`sgFraisModule`, défini ici ; sg3_plus.js n'a plus que sa déclaration) :
  bandeau, chiffres (total, facturables, à facturer, facturés, à rembourser), années (`sg3_frais_an`), recherche, tableau `.nx-tbl` trié par le tri commun (pas de `colspan` dans le total : il désactiverait le
  tri), clic = `editCost`, clic droit = supprimer. Droits : modifier = projet modifiable, comme le Planning ; Frais : règles de `editCost` / `delCost`. Styles `#sgsv-css`, classes `sgsv-*`, débogage `window.SGSV`.
  La base de test n'a aucune séance et presque ni notes ni tâches : données d'essai dans la base de l'aperçu seulement (24BRC). Copie d'avant : `subgestion3/_backup_20261104_avant_suivi_projet/`,
  `SUBGestion3_backup_20261104_avant_suivi_projet.html`.
- **Projet ▸ PV MO = Séances pour les questions du maître de l'ouvrage et les décisions (04.11.2026, `sg3_suivi.js`, Paulo : « reproduit séance dans pv MO, la structure de présentation mais pour des question de MO et
  décision »)** : même page que Séances (`sgPvMoModule`, `SG_PMOD['PV MO']` 'dom'), mêmes tables du moteur. Séries du genre « PV MO » (`RX_MO` : aussi « Maître de l'ouvrage » ; `projectmeetingtype` créé à la première séance),
  une série par phase SIA (`NUMBER` = 31, 32…, `SG_PH_FICH`), numérotation continue des séances ; ces séries n'apparaissent plus dans Séances (`seriesDe(p,mo)`). Point (`meetingitem`) : Question = catégorie 4 (`TITLE` = question,
  `TEXT` = réponse, `ISDONE` = répondu, réglé), Décision = catégorie 2, le reste = Information ; numéros d'affichage Q1, D1, I1 ; fenêtre `pmPoint`. « Nouveau PV MO » (`pmNouveau`) : phase, date, lieu, reprise des
  participants et des questions ouvertes du dernier procès-verbal. Vues Procès-verbal · Questions ouvertes (`questionsMO` : toutes phases, la dernière occurrence fait foi) · Décisions (registre du projet, imprimable) · Fichiers
  (dossiers « PV MO » des phases déjà déposés : `sgDocsModule`, `docsMO`). Impression `pmImprimer` : papier des contrats (`sgImprimer`), pas `mtPrint`. Tuile : « n PV · x questions ouvertes ».
- **Chantier ▸ PV de chantier (04.11.2026, Paulo : « dans chantier il manque pv de chantier basé sur l'app de pv actuel »)** : l'app de PV de Facturation posée dans la page du projet, limitée à l'affaire (fin de
  `sg3_offres.js`, `sgPvChantierModule`, mode `pv` du cadre posé `EMB` ; « ← Affaires » et « ✚ » masqués par `html.sgof-pv`), mêmes données (`sa_pv_data`, clé retrouvée par `sgCle`), mêmes fonctions, droit « PV : lecture ». Sans PV :
  page d'accueil, l'affaire n'est créée dans `sa_pv_data` qu'à la demande. `sgPvVue` compte aussi ce cadre posé (présentation tactile). L'écran `fx-pv-chantier` reste.
- **Soumission au graphisme de l'app + exemple (04.11.2026, bloc 36, `subgestion3/sg3_soumission.js`, concaténé après `sg3_suivi.js` dont il reprend `SGSV.outils` ; Paulo : « adapte le module soumission au reste de l'app et
  créer une version de soumission comme exemple pour un cfc pour que je puisse comprendre le fonctionnement […] qu'on puisse travailler ensemble comment corriger et adapter à nos besoins »)** : moteur inchangé (`DeltaSub.html`, 9 étapes).
  Page du projet ▸ Chantier ▸ Soumission (`svDomain` remplacé) : bandeau, chiffres, stades, recherche, tableau (`resume` : entreprises, proposée, offre nette de `detail.offre`) ; clic = `ouvrirDoc` (« ‹ Liste » revient à la page du projet : `SV_UI.back`),
  clic droit = en-tête, dupliquer, supprimer. Fenêtre (`svEditor` et `svNodeFn` enveloppés, `habiller`) : bandeau jaune + parcours Appel d'offres → Soumissionnaires → Comparatif → Contrat → Métré (`parcours`, clic = étape) + habillage CSS de la barre et de l'arbre ;
  **Visuel des appels d'offres (même jour, Paulo : « adapte le visuel des appels d'offre pour correspondre au reste de l'app »)** : mêmes menus, gestes et données. Descriptif de toutes les étapes (`svdBuildRows`, `svdColumns` enveloppés) :
  une ligne de quantité sans subdivision est fondue dans son article, n° de chapitre dans la colonne Art., colonnes sans donnée masquées (Genre Q. et Genre P. aussi s'ils ne valent que A), prix et montants nuls masqués (lignes d'article au comparatif), totaux nuls retirés hors
  comparatif, titres de colonnes en clair (`TITRES_COL`, `LARG_COL`), description à la largeur de la colonne (les retours à 30 signes restent dans « Editer l'article » et les impressions), niveaux `svd-n1` (X00) et `svd-n2` (XY0). CSS : `html .svd-tb…`
  (après le CSS du moteur), `.sgsm-ed` pour les 24 écrans (barres en texte, `table.g`, panneaux), `.sgsm-tot` pour les totaux ; arbre en minuscules (`SV_LIB`, patch de `SV_TREE`). Les fenêtres (Éditer l'article, Prix, Conditions…) gardent leur rendu.
  ⚠ `#main` sert à tous les écrans : `go()` vide son contenu, jamais ses classes. Ne rien y poser : l'habillage de la fenêtre est dans une enveloppe `.sgsm-ed` (bug du 04.11.2026 : la classe sur `#main` écrasait la première colonne de toutes les pages à 220 px). `svOpenDoc` enveloppé : toute ouverture depuis la page du projet y revient (aussi « Nouvelle soumission »). En-tête compacté si la fenêtre fait moins de 860 px de haut.
  Appels d'offres (`VIEWS.soum` sans document ouvert) : même page que la liste du projet, tous les projets (`p.GLOBAL` : colonne Projet, Toutes · Mes soumissions, « Nouvelle soumission » choisit l'affaire ; remplace la colonne des affaires). Copie d'avant : `subgestion3/_backup_20261104_avant_visuel_appels_offres/`.
  **Exemple** (`sgSoumExemple(p)`, liste ▸ ⋯ ou page vide ; un seul par projet, version « EXEMPLE ») : CFC 271 Plâtrerie, chapitre libre, 9 articles de quantité, conditions rabais / escompte / TVA, critères et notes,
  trois entreprises fictives (`contactowner` masqués, `ISHIDDEN`, jamais de faux prix sur de vraies entreprises), prix, comparatif créé par le transfert du moteur (`svcTransferDoc`), entreprise proposée. Textes écrits pour l'exemple, aucun texte de catalogue.
- **Descriptifs & devis au graphisme de l'app (05.11.2026, bloc 37, `subgestion3/sg3_devis.js`, concaténé en dernier ; Paulo : « reproduire graphiquement ce chapitre comme tout le reste de l'app, améliore pour rendre plus lisible et simple à utiliser »)** :
  moteur inchangé, DeltaSub.html seul garde ses écrans. Liste (`VIEWS.devis` sans document ouvert, tous les projets, et `ch02dDomain`, page du projet) : page `monter` comme la Soumission — bandeau, chiffres, Tous · Mes devis (tous les projets), statuts, recherche, tableau
  où le total TTC est visible ; clic = ouvrir (`ch02dOpen`, retour à l'écran d'origine ; le 2e clic d'un double-clic d'habitude est ignoré, 450 ms), clic droit = en-tête, dupliquer, dupliquer et modifier la subdivision, supprimer ; ⋯ = documents supprimés, importer, copie, CSV ; un devis créé s'ouvre aussitôt. Devis ouvert (`dvEditor` enveloppé,
  `habiller` : éléments du moteur déplacés tels quels dans `.sgde`, enveloppe ; #main ne porte aucune classe) : bandeau jaune (projet, statut, version, retour), chiffres (Total TTC, HT, TVA, Soumis aux honoraires, Positions chiffrées), onglets **Devis · Documents** (« Positions » renommé « Devis » le 07.11.2026, à la demande). Devis : tableau sur toute la largeur (`deco` après chaque dessin, MutationObserver sur `X.rp` : largeurs `LARG_POS`, niveaux `sgde-n1..4`, % ; N° et Désignation restent visibles au défilement horizontal), **CFC** Tout · 3 · 2 · 1 chiffres (libellé « Détail » renommé « CFC » le 07.11.2026, à la demande) (`sg3_devis_niv`, remplace « Seulement positions de 1 à 3
  chiffres » ; lignes masquées par classe, Copier et CSV ne prennent que les lignes affichées ; une position masquée perd la sélection, sauf si elle vient d'être choisie dans le plan CFC : le détail repasse alors sur Tout, sans changer le réglage mémorisé), barre réduite : **Liste CFC** (ex-« Ajouter une position », renommé le 07.11.2026 ; ouvre le plan CFC, fermé d'office sauf devis vide, coche sur les CFC déjà présents), Présentation, Imprimer (ex-Documents ▾, sans « [Ancien
  document] »), Paramètres, Fonctions (jamais grisé, seul Exporter l'est sur un devis vide ; sous-menus Modifier les montants, **Filtre des ouvrages** (seulement si le devis a des ouvrages : menu du moteur `ch02aFilterMenu`, sinon `ch02aFilterDialog`), Exporter ; `fonctions()` reprend les menus du moteur par `_sgB`) ; boutons Modifier, Supprimer et Filtre retirés de la barre le 07.11.2026 (« supprimer », annotations de Paulo ; `X.bFil` reste hors de la page, tenu à jour par le moteur) : double-clic = calcul, **clic droit sur une position** = Ouvrir le calcul, Supprimer la position… (confirmation du moteur), Liste CFC ; ↑ ↓ et Entrée dans le tableau. Documents (`docsLignes` après `ch02cDocPane`) : une ligne par document avec ses actions, puis Fichiers PDF. **« Supprimer le document » direct (10.11.2026, Paulo : « lorsque le document est créé, je souhaiterais
  pouvoir le supprimer pour que tu affiches créer document à nouveau », choix « bouton direct »)** : lignes Devis descriptif et Honoraires — bouton dans la ligne (grisé tant
  que le document n'est pas créé) au lieu de Supprimer ▾ ▸ « Effacer le document … » ; `supDoc` = ch02cErase avec un message clair (« La ligne repassera sur « Créer le
  document » … Les fichiers PDF déjà créés sont gardés »), refusé s'il reste le PDF du document ; « Supprimer le PDF » à côté seulement si ce PDF existe. **Puis « appliquer à
  Devis général » (même jour)** : même cycle sur la ligne Devis général — état gardé dans le devis (`reglages.dgDoc` : true créé, false supprimé ; sans choix, un
  document de l'ancien logiciel enregistré pour la ligne 0 compte comme créé : `dgCree`) ; « Pas encore créé » → « Créer le document » (`dgCreerDoc` : enregistre
  l'état puis ouvre le document ; « Créer le PDF » grisé avant) → « Document créé », « Ouvrir » ; « Supprimer le document » (`supDG`, même message) → de nouveau
  « Créer le document ». Rien d'autre n'est écrit (le document reste dessiné par l'app) ; Imprimer ▸ « Devis général (PDF) » de l'onglet Devis n'en dépend pas ; un
  profil en lecture seule ne peut plus ouvrir un devis général « pas encore créé » depuis cette ligne (comme les deux autres lignes). Fenêtre « Calcul pour <CFC> »
  (`ch02aCalc` enveloppé, `habCalc`, classes `sgdc-*`) — **proposition 2 « Tableur » (07.11.2026, Paulo : « modifier le design de la fenêtre, 5 versions », puis « applique proposition 2 » ; maquettes : `subgestion3/_backup_20261107_maquette_calcul/`)** : bandeau jaune avec le total TTC en grand (HT, TVA au taux des lignes, coût fixé dessous ; totaux lus dans la boîte du moteur, cachée), réglages de la position dans une bande grise sous le bandeau (sous les onglets d'ouvrages : ils sont propres à l'ouvrage), barre Insérer · Effacer | Haut · Monter · Descendre · Bas | Fonctions · Fixer le coût (`OUT_CALC`, icônes au trait) et à droite la cellule active (`.sgdc-ref` : L<n> · colonne · contenu), grille de tableur (numéros de ligne par compteur CSS dans la 1re cellule, en-têtes groupés Quantité formule → résultat · unité / Prix HT · TTC · TVA, `TH_CALC` : Formule, Résultat, HT, TTC, TVA %, Montant TTC ; champs pleine cellule sans cadre, cellule active encadrée de bleu nuit, résultat et montant calculés sur fond gris, ligne choisie sur jaune pâle et numéro en bleu nuit, variante en gris et montant barré), pied du tableau Total HT / TVA / Total TTC (+ coût fixé) avec « n lignes · variantes », descriptif, aide au clavier dans le pied de la fenêtre ; bouton ◂ des honoraires = chevron (pourcentages usuels 100 / 90 / 50 / 0 %). Aucun changement de fonctionnement (mêmes éléments du moteur, mêmes gestionnaires). Relecture contradictoire du 07.11.2026 (9 défauts confirmés, corrigés) : réglages déplacés dans le DOM avant la barre (`host.insertBefore(opts,out)`, ordre de Tab = ordre affiché), cellule active ignorant le champ détaché et rafraîchie après chaque redessin, coût fixé en grand (« Coût fixé TTC », lignes dessous) et ouvrage nommé (« Total TTC · RE »), tableau en `border-collapse:separate` (filets de l'en-tête figé gardés au défilement ; 2e rangée de titres figée sous la 1re, hauteur mesurée), barre sans retour à la ligne (cellule active qui rétrécit), flèche de la liste des unités au survol, titres sans capitales ni chasse fixe dans tous les visuels, couleurs par jetons. Avant : bandeau jaune avec les totaux, tableau qui tient dans la fenêtre, Fonctions et Fixer le coût avec les outils, options groupées ; **le curseur reste dans le tableau** (le moteur redessine tout à chaque modification : Tab, Entrée, clic gardent le champ suivant, `rep` ; la quantité calculée n'a pas de champ, on passe à la cellule suivante), une ligne insérée reçoit le focus, la ligne choisie suit le curseur (« Effacer la ligne » agit sur la ligne où l'on est), les outils valident d'abord la saisie en cours sans perdre le clic, le clavier et Échap restent dans la fenêtre ; position vide : focus sur « Insérer une ligne ».
  Filtre, Paramètres, Remarques préliminaires, fiche du devis, Navigateur : fenêtres du moteur inchangées. Styles `#sgde-css`. Débogage `window.SGDE`. Copies d'avant : `subgestion3/_backup_20261105_avant_devis/`, `SUBGestion3_backup_20261105_avant_devis.html`.
  **Lignes de calcul (07.11.2026, Paulo : « le calcul des prix ne s'affiche pas »)** : Présentation ▸ « Toutes les colonnes avec le calcul de prix » (mode 3) — le moteur écrit
  chaque ligne de calcul dans les colonnes Commentaire et Descriptif, hors de l'écran depuis la nouvelle mise en page ; `deco` (`calc`) la montre sous sa position : texte de la ligne
  (et ouvrage s'il y en a plusieurs) dans la désignation, en retrait, puis « quantité unité × prix unitaire HT » dessous, alignés à gauche, en gris italique (demande de Paulo),
  montants HT / TVA / TTC dans leurs colonnes (`dvLine`, arrondi du devis) ; Commentaire et Descriptif vides sur ces lignes. Copie, CSV et impressions inchangés (données du moteur).
  **Plein écran (07.11.2026, « un bouton comme dans soumission »)** : icône au bout de la barre (`.sgde-pl`, après Fonctions) ; le devis couvre la fenêtre (`.sgde.sgde-plein`,
  fixe, z-index 800 comme la soumission — fenêtres et menus du moteur au-dessus), bandeau masqué, chiffres réduits ; gardé pendant la séance (`PLEIN`) ; Échap (écouté en capture :
  une fenêtre ouverte se ferme d'abord, sans quitter le plein écran) ou le même bouton pour revenir.
  **Icône du plein écran dans toute l'app (07.11.2026, Paulo : « modifie le logo plein écran dans toute l'app, fais 5 propositions » ; choix : 1 « Coins de cadrage »)** :
  `NXI.plein` (coins ouverts = entrer) et `NXI.pleinq` (coins repliés = bouton actif, quitter), sg3.js, au lieu du petit carré plein `today` (qui reste pour « Aujourd'hui »).
  Boutons : Devis général (`.sgde-pl`, sg3_devis.js), Soumission (bouton du moteur `{i:'today',t:'Plein écran'}` remplacé dans l'enveloppe d'`ibtn` selon `b.on`),
  bascule « ⤢ » de la fenêtre du carnet d'adresses de Facturation (`sgEmoInstaller`, `.sg-plbtn`, état `#adr_pick_w[data-max="1"]` dans fx_theme.css). Icône seule, sans libellé.
  Propositions (12 dessinées par 3 agents, 5 retenues) : `subgestion3/_backup_20261107_maquette_plein_ecran/`. DeltaSub.html seul garde le carré.
  **Colonnes (07.11.2026)** : « Toutes les colonnes » et « Toutes les colonnes avec le calcul de prix » sans les colonnes Descriptif ni Commentaire (Paulo, deux demandes ;
  « Toutes les colonnes » montre donc les mêmes colonnes qu'« Avec colonnes honoraires » ; plus aucun défilement horizontal ; `ch02aDraw` enveloppé, `grid` filtré le temps
  du dessin ; copie et CSV suivent) ; plus de colonne Descriptif : dans « Toutes les colonnes », « … avec le calcul de prix » et « Avec le descriptif », le descriptif de chaque
  position est une ligne juste sous elle, avant ses lignes de calcul (Paulo : « sous le CFC concerné, et pas dans une colonne », puis « ajoute le descriptif sous le CFC » ; lignes
  `dsc` ajoutées aux rangées, texte dans la désignation en gris italique, retours à la ligne gardés, « Desc. » dans la colonne N° à droite, à la hauteur de la première ligne
  (demande du même jour), copie et CSV le gardent ; pas de tri par colonne dans ces trois présentations) ;
  **« Avec le descriptif et le calcul de prix »** (Paulo, 07.11.2026), entre « Toutes les colonnes avec le calcul de prix » et « Avec le descriptif » dans Présentation
  (`presMenu`) : colonnes de « Avec le descriptif », sous chaque position son descriptif puis ses lignes de calcul (rangées ajoutées par l'enveloppe de `ch02aDraw`, mêmes
  colonnes et montants que le mode 3) ; enregistré displayMode 4 + `reglages.affichage.sgCalc` (DeltaSub.html seul : « Avec le descriptif » ; enveloppe de `ch02aSetMode`
  : `sgCalc` retiré quand on choisit une autre présentation).
  Standard et « Avec colonnes honoraires » : sans descriptif ; tous les textes de la désignation (positions de tous niveaux, descriptifs, lignes de calcul) au même bord gauche,
  celui du titre de la colonne « Désignation » (Paulo, 07.11.2026 : plus de retrait par niveau ; la hiérarchie se lit au gras et à la trame des chapitres) ; colonnes fixes N° et Désignation opaques sur toutes les lignes (la règle des lignes alternées de
  sg3.css les rendait transparentes : les montants se voyaient au travers au défilement horizontal), lignes de niveau 1 sur trame bleu nuit pâle sur toute la ligne.
  **Montant saisi encadré (07.11.2026, Paulo : d'abord « une couleur différente pour les chiffres qui peuvent être modifiés », puis, écran de l'ancien logiciel à l'appui, « un
  rectangle pour le montant HT uniquement, adapté au design de l'app »)** : montant HT (sans colonne HT : TTC) des positions qui ont un calcul (`n.leaf`) dans un cadre au filet
  bleu nuit 35 % sur fond bleu nuit 7 % (`td.sgde-saisi::before`), infobulle « double-cliquez » ; autres chiffres en noir ; seulement avec le droit d'écrire (`ecrit()` et
  `ch02aCanEdit`) ; légende « Montant saisi, modifiable (double-clic) » ajoutée puis retirée le même jour à la demande (l'infobulle du cadre le dit).
  **Lignes de calcul dans les colonnes (relecture du 07.11.2026)** : `ligneCalc(X,r)` donne texte, formule et montants (facteur du filtre d'ouvrage comme `dvCompute` ; variante
  et partie « Exclure » entre parenthèses, en italique, mention ; coût fixé signalé) aux colonnes elles-mêmes (enveloppe de `ch02aDraw`) : copie et CSV les contiennent.
  **Plan CFC en groupes de CFC à 1 chiffre (07.11.2026, Paulo : « créer des groupes de CFC à 1 chiffre, permettre de réduire ou agrandir »)** : ordre du plan (0, 00, 000, 01…, 1, 10…),
  flèche sur chaque CFC à 1 chiffre (nombre de CFC du groupe à côté), groupes réduits d'office, ouverts gardés (`sg3_devis_cfc_ouv`), « Tout agrandir · Tout réduire » dans le titre ;
  recherche = tous les CFC trouvés ; double-clic inchangé ; enveloppe permanente de `grid` pour le seul panneau marqué `pane._sgdeX` (`planGroupes`, une seule fois par dessin,
  pas de tri par colonne, CFC choisi puis masqué oublié). Échap en plein écran : vide la recherche du plan, puis quitte le plein écran. **Double-clic dans la liste CFC = ajouter ou retirer, sans fenêtre (07.11.2026, Paulo : « si je clique deux fois dans la liste des CFC je ne veux pas que
  cette fenêtre s'affiche, il faut uniquement copier dans le devis ou supprimer du devis » ; remplace la version du même jour qui ouvrait la fenêtre de calcul)** : CFC absent → ajouté
  (parents manquants compris, `X.dvAdd` du moteur, fenêtre de calcul neutralisée par `SANS_CALC` dans l'enveloppe de `ch02aCalc`), message « Position … ajoutée au devis » ; CFC présent →
  retiré (`ch02aDelPosCalc`, mêmes règles que « Supprimer la position ») : tout de suite si rien ne serait perdu, sinon confirmation « Retirer « … » du devis ? Montant retiré : … CHF TTC »
  (lignes de calcul, coût fixé, descriptif, commentaire ou sous-positions). « + » du plan : ajoute ou choisit, sans fenêtre. Double-clic reconnu par l'app (deux clics sur le même CFC
  en moins de 500 ms, `brancherGroupes`), double-clic natif neutralisé. La fenêtre de calcul s'ouvre par un double-clic sur la position dans le devis ou clic droit ▸ Ouvrir le calcul.
  **Soumis aux honoraires, règle du bureau (07.11.2026, Paulo : « définir tous les postes à 100 % pour les honoraires hormis le CFC 5 et les honoraires ; doit être compris dans le
  montant le CFC 583 »)** : `honRegle(cfc)` = 100 % partout, 0 % pour le CFC 5 et les honoraires (CFC 09, 19, 29, 39, 49, 99 — second chiffre 9 ; 59 est dans le 5), 583 (réserves pour
  imprévus) à 100 %. D'office pour les positions ajoutées depuis la liste CFC (`dvNewParts` enveloppé, `CODE_NEUF`) ; sur demande pour tout le devis : Fonctions ▸ Modifier les montants ▸
  « Soumis aux honoraires selon la règle du bureau … » (entrée retirée le même soir, « supprimer »), ou lien « appliquer la règle » sous le chiffre « Soumis aux honoraires » quand des positions s'en écartent (`horsRegle`) —
  confirmation avec le nombre de positions et le montant soumis avant → après. Les pourcentages restent modifiables position par position (fenêtre de calcul).
  **Honoraires d'architecte repris du contrat signé (07.11.2026, Paulo : « reprends le principe que l'on avait travaillé sur le devis classé dans archives », choix « tout le
  principe »)** : même règle que le devis de Facturation (Archives ▸ Devis : `dvHonContrat`, `dvHonSync`, `dvHonReinit`) — contrats de l'affaire non annulés (`sgContratsDuProjet`),
  version courante si signée, sinon dernière version signée ; contrat partiel (somme des % des phases entre 0 et 100) → extrapolé à 100 % et arrondi au franc. Position CFC 291 tenue à
  jour à l'ouverture du devis (`honSync`) par UNE ligne de calcul marquée `l.sgHon = {v}` (« Contrat d’honoraires signé », TTC du contrat, HT = TTC ÷ (1 + TVA du devis)) : créée si la
  position manque (`honCreer`, `p.sgHon`) ou n'a aucune ligne, mise à jour si la ligne n'a pas été changée (tolérance 0.06 pour l'arrondi du moteur). Jamais : devis validé ou annulé
  (STATECODE 2 / 3 : « figé »), montant modifié à la main (ligne changée, autres lignes ou coût fixé), devis à ouvrages, 291 à sous-positions, profil sans droit d'écriture. Plus de contrat
  signé : ligne reprise retirée si inchangée (et la position créée par l'app si vide). Chiffre **« Honoraires HT »** (après « Soumis aux honoraires ») = montant HT pour 100 % des
  prestations des contrats de l'affaire (comme Facturation : signés ou non), sinon total des chapitres d'honoraires du devis ; sous-titre contrat signé / non signé, % → 100 %, « figé (devis
  validé) », lien « reprendre le contrat » (`honReprendre`, confirmation si des lignes saisies à la main sont remplacées), aussi au clic droit sur la position 291. Essai 99TST (base de test) :
  contrats signés 567'957.40 + 14'539.50 = 582'496.90 TTC ; Devis général validé → figé ; Devis estimatif (ligne saisie à la main) → lien ; brouillon → position 291 créée.
  **Relecture contradictoire du même jour (21 défauts confirmés sur 27, corrigés)** : extrapolation (`honExtra`) — contrats aux phases SIA toutes distinctes = un seul mandat, somme ÷ somme des
  % (17QUE : 431–433 + 441–453 → 626'741 HT au lieu du double), une phase commune = mandats distincts, chacun ramené à 100 % (20MMA) ; Facturation (`dvHonSync`) garde l'ancien calcul.
  Contrats lisibles seulement (`honOk` : administrateur ou « contrats : lecture », finances non verrouillées) ; `honContrat` = null si les données manquent (jamais lu comme « aucun
  contrat ») ; ligne reprise retirée seulement si un contrat visible n'est plus signé. Aucune écriture sans projet modifiable (`honPeut`, règle du planning). Pas de reprise si la 291 a
  des sous-positions, plusieurs parties, ou si un CFC parent (29) est chiffré (`honAnc`) ; ni si d'autres lignes, un coût fixé ou « Var » sont dans la 291. Ligne ou position retirée à
  la main : pas recréée (`pt.sgHonPose`, `E.sgHon.pose`), lien « reprendre le contrat ». `l.sgHon.k` = montant du contrat (comparaison sans boucle d'écriture). Devis annulé : « figé (devis
  annulé) ». Liens des chiffres visibles en plein écran et sur petit écran (`.s:has(.sgde-hreg)`). Chiffre sans contrat : montant propre de chaque position d'honoraires (sans ses
  enfants). Liste CFC : retrait avec sous-positions toujours confirmé ; clic droit = « Ajouter au devis » / « Retirer du devis ». Débogage : `SGDE.honContrat`, `SGDE.honEtat`.
  **Taux de TVA du document (07.11.2026, Paulo : « affiche la TVA du document »)** : chiffre « TVA 8.1 % » — taux des lignes chiffrées et des coûts fixés (variantes et parties
  « Exclure » non comptées), plusieurs taux listés (« TVA 7.7 · 8.1 % ») ; lignes à 0 % (taxes, émoluments, CFC 51…) hors du libellé, signalées dans l'infobulle ; devis vide : taux par défaut (`ch02aVat`).
  Montant soumis aux honoraires = hors taxe (% × montant HT, `dvCompute`) : chiffre « Montant soumis HT » (d'abord « Soumis aux honoraires HT »), colonne « Montant soumis HT » (07.11.2026, Paulo : « indiquer si HT ou TTC »).
  **Précision du devis (07.11.2026, Paulo : « ajoute le degré de précision du devis devant le total TTC »)** : premier chiffre, étroit (colonne de 86 px), « Précision ±10 % » = « Marge
  d'approximation du DG » des Paramètres (`E.reglages.marge`, textes « [...] » ignorés), sans sous-ligne (« du devis » retiré à la demande) ; vide → « — » et lien « définir »
  (Paramètres, `ch02aSettings`). Texte d'aide sous la recherche du
  plan CFC retiré (« supprimer », même jour). « figé » sous Honoraires HT, la raison en infobulle. Chiffre « Positions » : sous le nombre de positions chiffrées, « sur <total> » en gris toujours visible (« chiffrées » retiré le même soir, « supprimer »), aussi sur écran bas et en plein écran (Paulo, 07.11.2026 : « pour identifier si j'ai des positions vides » ; nombre sans montant en infobulle ; les autres sous-lignes restent masquées sur écran bas). Plus de « CHF » sous les chiffres du devis (« supprimer le CHF dans le devis général », même jour) : seules restent les
  indications utiles (montants exclus, filtre, contrat signé, liens). Chiffre « Soumis aux honoraires HT » renommé « Montant soumis HT » (une seule ligne, comme la colonne) ; « figé » retiré sous
  Honoraires HT (« supprimer », même jour), devis validé ou annulé signalé dans l'infobulle du chiffre.
  **Chiffres toujours sur une seule ligne (même jour, « toujours sur une ligne, pas de renvoi à la ligne »)** : rangée en colonnes fixes (`grid-auto-flow:column`, 1re colonne
  86 px), libellés et sous-lignes sans retour (points de suspension au besoin), montants à taille qui suit la largeur (`container-type:inline-size`, `clamp(11px, 2.4cqi − 5.6px, 22px)` ;
  17 px en plein écran, 18 px sur écran bas) : 13 signes tiennent dans une colonne ; lien « reprendre le contrat » seul sur sa ligne. Vérifié à 800, 1000 et 1440 px.
  **Retour à la page des devis du projet (même jour, « retour à la page des devis du projet »)** : bouton « ‹ Devis du projet » du bandeau et toute fermeture du devis (`ch02aClose`
  enveloppé) → page du projet ▸ Devis général (`nx-pdom` « ID|Devis général »), d'où que le devis ait été ouvert (liste de tous les devis, reprise de session) ; projet non permis
  au profil (`sgProjetPermis`) ou sans projet : retour du moteur (`DV.back`, sinon liste des devis).
  **Réglages dans la fenêtre du document (même jour, « ajouter ce menu pour configurer le devis dans la fenêtre d'affichage PDF »)** : DeltaSub.html — `ch03bView` accepte
  `o.outils(maj)` (boutons ajoutés après « Partager », reçoivent `maj(src)` pour redessiner), `ch01aView` le transmet, `ch02cView` y met « Réglages ▾ » (`ch02cPrefItems`, cases cochées
  « ✓ », enregistrées par `ch02cSetOpt`) puis recalcule le document (`ch02cRender`) : le PDF se redessine aussitôt, « PDF » enregistre la version à jour. Devis général, Honoraires,
  Devis descriptif ; v1 et v2 reconstruites. Onglet Documents : titre de section « Devis » au-dessus des trois documents, comme « Fichiers PDF » (`.sgde-dh`).
  **Documents du devis : ordre, commentaire et groupes des PDF (08.11.2026, Paulo : « modifier l'ordre, et même ordre dans la liste des fichiers PDF »,
  « lorsque je crée le PDF, ajouter une cellule commentaire ; ajouter commentaire dans la liste des PDF », « créer des groupes de type de fichier : Devis,
  honoraires, descriptif », « supprimer [Fonctions] et ajouter la fonction au bouton de droite »)** : documents dans l'ordre Devis général, Devis descriptif,
  Honoraires (`ORDRE_DOCS`, indices du moteur gardés) ; fenêtre « Nom du fichier » de « Créer le PDF » (`ch03bNouveauPdfDlg` enveloppé : toutes les listes de
  PDF de l'app) avec un champ « Commentaire », prérempli par celui du fichier du même nom ; enregistré dans le fichier (`depotfichier.COMMENTAIRE`) avec le
  document d'origine (`GENRE_DOC` devis | descriptif | honoraires, posé par « Créer le PDF » des documents du devis, enveloppe de `ch02cGenPdf` posée en
  dernier) dans le même `DS.commit` (enveloppe de `ch03aEnregistrer`) ; un PDF remplacé autrement garde son commentaire et son document. Listes « Fichiers
  PDF » (`ch03cPdfZone` enveloppé, `grid` pour les zones `el._sgPdf`) : colonne « Commentaire » (double-clic dessus ou clic droit ▸ « Modifier le
  commentaire… », `pdfCommentaire`, droit « documents : dépôt ») ; devis : groupes Devis · Descriptif · Honoraires (« Aucun PDF » si vide) + Autres (PDF
  importés, fusionnés ; anciens PDF reconnus au nom par défaut du moteur), bouton « Fonctions » de la liste retiré (même menu au clic droit, `popMenu`
  enveloppé pour y ajouter « Modifier le commentaire… »). Classes `.sgpdf*`. Visuel (même jour, « améliore le visuel pour correspondre au visuel de l'app ») : icône PDF au trait devant le nom, colonne du nom à 300 px et Commentaire juste à côté, « Dernière modification » (ex-« Date de dernière modification ») à 170 px à droite ; groupes en intertitres bleu nuit sur filet noir avec « n fichier(s) » (groupe vide : titre seul, « aucun PDF » retiré le même jour).
  **Fenêtre d'aperçu des documents du devis = proposition 2 « Réglages en panneau », état comme la proposition 1 (08.11.2026, Paulo : « lorsque je
  clique sur une option ne pas redémarrer l'aperçu et laisser sur la page sur laquelle je me situe », « revoir le graphisme de la fenêtre, 5 visuels »,
  « je vais choisir la variante 2 mais je souhaite la représentation de l'état de la version 1 » ; maquettes `subgestion3/_backup_20261108_maquette_apercu/`)** :
  `vueDoc` (sg3_devis.js, enveloppe de `ch02cView` pour les devis SUBGestion) rhabille la fenêtre du moteur (`ch03bView`, gardée dessous) — bandeau jaune
  (n° du projet, « Descriptifs & devis · Documents », titre, désignation · n pages · format), chiffres « Pages » et « État ■ <statut du devis> » (`DV_STATE`),
  Imprimer (`vueImprimer` : le PDF dans un cadre caché puis impression du navigateur), PDF ▾ et Partager ▾ = boutons du moteur déplacés ; lecteur de
  l'app (pdf.js du cadre Facturation, `ownerDocument:document`, rendu `intent:'print'`, calque de texte pour sélectionner et chercher) : pages l'une
  sous l'autre rendues à la demande (file, jetons `V.tok` / `V.rt`, pages lointaines libérées), barre ‹ Page n / N ›, zoom −/+ (25 à 300 %), « Ajuster à la
  largeur » (d'office), « Mise à jour… » ; un réglage coché refait le document (`D.maj` → `sgImpMontrer` → crochet `ifr._sgVue(blob)` de
  sg3_impressions.js, le PDF n'est plus chargé dans le cadre du moteur) et la page affichée est gardée (`position` / `poser` : pages visibles rendues
  d'abord, puis échange — même page, même position, aussi au zoom et au redimensionnement) ; panneau « Réglages · appliqués aussitôt » à droite (300 px) :
  cases de `ch02cPrefItems` rangées en Positions, Calcul, Montants, Affichage, Sauts de page (`vueGroupe`, `VUE_ORDRE`, retraits `VUE_RETRAIT`),
  « Arrondir à » et « Sauts de page » en boutons segmentés, dernière case changée surlignée (d'abord avec le mot « appliqué », retiré le 10.11.2026 à la demande : « supprimer le texte »), pied « Enregistrés dans le devis » + Fermer. « Bases de prix » retiré des réglages (panneau et menu de la ligne ; gardé seulement s'il est coché, pour le décocher ; « supprimer », même jour). « Afficher le calcul » coche ou décoche aussi « Quantités et prix » et « Commentaire du calcul » (`dgBasculer`, même jour ; toujours cliquable ; décoché, ses deux cases sont grisées et non cliquables — `dis` de dgPrefItems, 08.11.2026 ; « Quantités et prix » s'imprime aussi sans « Afficher les montants » (ligne « Quantité … Prix … » sans montant ; enveloppe de ch02bDetail pendant DG_ACTIF, 08.11.2026) ; « Afficher le calcul » (et ses deux cases) actif seulement si le devis a des lignes de calcul, « Variantes » seulement s'il a des variantes (plus lié à « Afficher
  les montants ») — sinon grisés, décochés, non cliquables ; « Descriptif » en tête du groupe Positions (`vueGroupe`, `VUE_ORDRE`) ; **descriptif sous le CFC** (Paulo, 08.11.2026, « déplacer le descriptif sous le cfc ») : dans le PDF, le descriptif d'une position suit
  directement sa rangée, avant son commentaire et ses lignes de calcul (le moteur l'écrit après) ; plusieurs ouvrages sans « Assembler les descriptifs » : sous la rangée de
  l'ouvrage ; « Assembler les descriptifs » : sous la position (`dgDescEnTete`, enveloppe de `ch02bDocRows` pendant `DG_ACTIF` ; mêmes rangées, mêmes pages, seul l'ordre change ; les lignes vides du début et de la fin d'un descriptif restent à leur place, après les calculs — relecture du 08.11.2026) ;
  **« Tous les montants détaillés » fusionné dans « Afficher les montants »** (Paulo, 08.11.2026), placé dans le groupe Calcul sous « Commentaire du calcul », en retrait (ordre du groupe depuis le 10.11.2026, « déplacer » : Afficher le calcul, Commentaire du calcul,
  Quantités et prix, Afficher les montants — `VUE_ORDRE` et `DG_MENU`) :
  montants des lignes de calcul, mêmes règles que les deux autres cases (absente sans ligne de calcul, grisée et décochée sans « Afficher le calcul » — `dgOptions` le force à faux —,
  cochée avec le calcul comme les deux autres — Paulo, 08.11.2026 : « en activant Afficher le calcul, activer toutes les options ») ; **depuis le 10.11.2026 (Paulo : « afficher les montants devant le
  commentaire du calcul, afficher les montants même lorsque les calculs ne sont pas affichés »)** : « Afficher les montants » entre « Commentaire du calcul » et « Quantités et prix », en retrait (essayée
  d'abord en tête du groupe, sans retrait) ; indépendante quelques heures, puis de nouveau grisée et sans effet sans « Afficher le calcul », qui coche ou décoche ses
  trois options (« griser toutes les sélections si Afficher le calcul n'est pas activé », même jour) ; « Afficher les montants » exige aussi « Commentaire du calcul » (même jour, Paulo : « afficher les montants uniquement si commentaire est actif sans quoi grisé et pas possible de cliquer ») : sans commentaire, grisée, décochée, non cliquable et sans effet sur le PDF (`dgOptions`, `dgPrefItems`) ; le choix reste enregistré dans le devis et revient quand le commentaire est recoché ; le montant de chaque ligne de calcul est TOUJOURS sur la
  rangée de son commentaire (« montant toujours en face du commentaire de calcul », même jour : avec « Quantités et prix », la rangée « Quantité … Prix … » reste dessous
  sans montant ; sans commentaire, le montant reste sur la rangée des quantités) ; sans « Quantités et prix » (enveloppe de `ch02bDetail` : règle « same » du moteur), sans commentaire sur une rangée à lui ; colonne = celle
  de la rangée « Quantité … Prix … » (« à 3 chiffres » pour une position à 3 chiffres), donc visible aussi avec « Seulement positions de 1 à 3 chiffres » (avant : rangée
  à part dans la colonne « à 4 chiffres », masquée dans ce mode) ; case placée par `grp` / `ind` (vueDoc) ; « Pourcentages sur le total général » dans le groupe Positions, après « Afficher les positions sans montant » (Paulo, 08.11.2026 ; panneau
  et menu de la ligne) ; décocher « Quantités et prix » ne décoche plus « Afficher le calcul » (règle de l'ancien logiciel retirée le 08.11.2026 : rien ne se grise tant que le calcul est affiché)).
  Autres visionneuses inchangées. Classes `.sgdv-*`.
  **Icône « Ajuster à la largeur » du lecteur PDF (08.11.2026, proposition 3 « Cadrage horizontal » choisie par Paulo parmi 5 ; maquettes
  `subgestion3/_backup_20261108_maquette_icone_largeur/`)** : deux crochets, de la famille du bouton plein écran (`NXI.plein`), et une flèche double entre eux (`SGLP_I.larg`). Icône seule, sans libellé (Paulo, 08.11.2026 : « supprimer le texte » ; nom en infobulle) ; « appliqués aussitôt » retiré du titre du panneau Réglages. Sauts de page (même jour, Paulo : « supprimer [Standard], activer ou désactiver Sans sauts de page, blanc si pas sélectionné et bleu si
  sélectionné ») : « Sans sauts de page » est un interrupteur (`bascule`, `.sgdv-tgl`, `role=switch`) ; désactivé, la présentation choisie avant revient (sinon celle par défaut) ;
  boutons des présentations seulement si le devis en a plusieurs (panneau et menu de la ligne). Sous l'interrupteur, « Remettre à zéro les sauts de page » (Paulo, 08.11.2026) : retire tous
  les sauts de la présentation choisie après confirmation (`dgSautsRaz`, `sgConfirm`), grisé s'il n'y en a aucun, nombre en infobulle ; « Sans sauts de page » n'est pas touché. « Arrondir à » : boutons aucun / 10 / 100 / 1000 sur la ligne sous le libellé
  (`seg(…, pile)`, « déplacer », même jour).
  **Lecteur commun et fenêtre PDF (08.11.2026, bloc 48, `subgestion3/sg3_lecteur.js`, concaténé en dernier ; Paulo : « améliore la fenêtre PDF lorsque je
  clique sur PDF, adapte le design au reste de l'app »)** : `sgLecteurPdf(o)` = le lecteur de cette fenêtre, rendu commun (barre ‹ Page n / N ›, zoom,
  Ajuster à la largeur, pages rendues à la demande, texte sélectionnable ; `charger(blob)`, `attendre()`, `echec(e)`, `imprimer()`, `fini()` ; o.surInfo,
  o.surEchec ; classes `.sglp-*`) ; `vueDoc` s'en sert. `sgVisionneuse(b,nom,o)` (déplacée de sg3_plus.js) = même graphisme : bandeau jaune (n° de l'affaire
  trouvé dans le titre ou le nom, sinon type du fichier en grand ; « Aperçu du … à … » pour les aperçus du moteur, titre = titre du document — `pdf._sgTitre`
  posé par le POST `/api/pdf` aperçu de sg3_impressions.js, sinon titre du PDF —, pages · format · taille), chiffre Pages, Imprimer, Télécharger (aperçu :
  « <titre>.pdf »), Fermer ; PDF dans le lecteur, images, texte brut et HTML de l'app comme avant (mêmes règles de sécurité) ; renvoie {fermer, imprimer,
  telecharger, lecteur} (Documents Substances ▸ Imprimer s'en sert). Corrections de la relecture du 08.11.2026 (6 défauts confirmés sur 7) : échec d'une
  mise à jour signalé (message, ancienne version gardée, plus de « appliqué »), indicateur et Imprimer qui attendent la dernière version, canevas plafonnés
  à 16 Mpx, focus gardé (réglage, Page + Entrée, impression ; Échap ferme la fenêtre même si le focus en est sorti), panneau inactif en lecture seule
  (« Lecture seule : réglages non modifiables »), barre réduite à ses icônes sous 600 px.
  Seconde relecture (même jour, 7 défauts confirmés sur 7, corrigés) : une image s'imprime dans un cadre SANS scripts qui ne contient qu'un `<img>`
  (`sglpImprimerImage` ; un SVG déposé n'est jamais chargé comme document) ; pendant une mise en page en cours, la position demandée fait foi (`V.cible` :
  deux zooms rapides ne sautent plus de page) ; erreurs de pdf.js en français (`sglpErreur`), PDF protégé par mot de passe : message « utilisez Télécharger »,
  pas d'impression invisible ; Bleu nuit : un bloc = tête + détails (D, X), suites (k) et ouvrages (rangée S à CFC vide), rangées D / X vides comprises, un
  seul filet en fin de bloc, bleu nuit si la tête est un CFC à 1 chiffre ; frise de la page du projet et de la fiche de l'affaire à 120 px aussi dans les
  visuels à l'essai (`html body …`). Vérifié sur 24PRC (75 pages) : page 10 gardée après Variantes, « Seulement positions de 1 à 3
  chiffres » (75 → 34 pages), zoom.
  Bouton « Modifier les textes… » retiré de cette fenêtre (« supprimer », même jour ; `ch02cView` / `ch01aView` enveloppés dans sg3_devis.js, sans l'option `edit`) ; les autres
  visionneuses le gardent, DeltaSub.html seul aussi.
  **Devis général en PDF (bloc 46, 07.11.2026, Paulo : « voici à quoi devrait ressembler le DG pdf », 23JOG-DG_TRAVAIL_20260417.pdf de l'ancien logiciel)** : Imprimer ▸ « Devis
  général (PDF) » (première entrée ; les présentations de l'ancien livret restent dessous). `dgPdf` / `dgCreer` (sg3_devis.js) : livret du moteur `ch02bBook` avec des gabarits de
  pages synthétiques (tableau 728 × 388 pt, Information 402 pt, rangées 15 pt) et la présentation de la référence `DG_PRESET` (page de garde, Information si remarques
  préliminaires, récapitulatif à 2 chiffres, document principal ; colonnes CFC, Texte, Commentaire, à 4 / 3 / 2 / 1 chiffres TTC, [%] ; lignes « Quantité … Prix … » + commentaire
  + montant ; descriptif ; une rangée sur deux grisée ; 1 et 2 chiffres en gras 10 pt, positions 9 pt, détails 8 pt) ; sauts de page et filtre de la présentation favorite repris ;
  texte mesuré aux vraies polices (Akkurat Light / Bold intégrées). Page de garde : « titre de garde - état du projet » (placeholder « [...] » ignoré), marge d'approximation
  (« ±20% »), Ouvrage (description du projet), Maître de l'ouvrage (contrat Facturation, sinon intervenant), Architecte (bureau), Direction des travaux (intervenant rôle 2, sinon
  bureau), signatures. Dessin `contenuLivret` (sg3_docsub.js, `o.livretDG`) au papier des contrats A4 paysage, positions relevées sur la référence (en-tête du tableau 8 pt entre
  deux filets à 100,5 / 116,5 pt du haut, rangées dès 122 pt, filet noir 0,75 au-dessus des CFC à 1 chiffre et du total, textes trop longs coupés par « … ») ; montants en noir
  comme la référence ; page de garde sans numéro mais comptée (`nonum` ; Paulo, 08.11.2026 : « commencer la numérotation par le 2 à la page 2 » — pages « 2 | n » à « n | n », n = toutes les pages). « Quantité 1500 = 1500.0 » (formule réduite à un nombre) montrée une fois.
  Corrections après relecture (07.11.2026) : ouvrages affichés dès que le devis en a (`displaySubprojects:ch02bHasSub(E)`, sinon les lignes des parties manquaient) ; devis vide sans
  document principal (un seul total) ; pages vides retirées (sauts posés pour une autre mise en page) ; textes modèles « [...] … » de l'ancien logiciel ignorés (titres, état, marge) ;
  ligne de calcul trop longue : formule retirée (quantité et prix gardés ; débordement sur la colonne voisine vide retiré avec le modèle 24PRC, voir plus bas) ; filtre d'ouvrages actif signalé (« Filtre : … » sur la
  page de garde, dans l'en-tête et le nom du fichier) ; titre de garde coupé au besoin, marge limitée à 150 pt ; accents décomposés recomposés (`prep` : `normalize('NFC')`, tous les
  PDF de sgDsPdf). Limite connue : les montants des lignes de calcul suivent l'ancien logiciel (sans facteur du filtre ni parenthèses d'une partie exclue ; le total de la position,
  lui, en tient compte). Vérifié sur 99TST, 24PRC (7101), 24BRC (7251, 4751), ROZ-R4 (1101), 23RUS (2951) : toutes les lignes de calcul imprimées, aucune page vide.
  **Documents ▸ Devis général = ce modèle (07.11.2026, Paulo : « modifier cette page par ce modèle », 24PRC-DG_TRAVAIL_20260216.pdf de l'ancien logiciel)** : la ligne
  « Devis général » de l'onglet Documents (Ouvrir, fenêtre du document — Imprimer, PDF, Partager, Réglages —, Créer le PDF) montre et enregistre le livret paysage du bloc 46 au
  lieu du document portrait du modèle .dpdoc (`ch02cRender`, `ch02cPrefItems`, `ch02cOpen`, `ch02cGenPdf`, `ch02cNewItems` enveloppés pour la ligne 0 d'un devis SUBGestion ;
  `dgRendu` : page repérée `/*sgimp:id*/` dont le PDF est déjà fait, servie par `sgImpPdf` du bloc 31 ; `dgOuvrir` / `dgGenPdf` : mêmes étapes que le moteur — PDF officiel
  existant, mode filtre, message d'arrondi selon les réglages du modèle — mais AUCUNE écriture dans la base, pas d'enregistrement `costestimatedpdoc` : consultation possible avec un
  profil en lecture seule, pas de faux conflit au double-clic, DeltaSub.html / v1 / v2 gardent leur propre choix de modèle). Honoraires et Devis descriptif inchangés. **Réglages** de la fenêtre et du menu de la ligne (`DG_MENU`, mêmes libellés que le moteur) = options du
  livret de l'ancien logiciel, choix enregistrés dans le devis (`E.reglages.dgPdf`), valeurs de la référence tant que rien n'est choisi, mêmes dépendances que sa fenêtre
  « Paramètres » ; « Pourcentages sur le total général » (`E.reglages.pourcentageSur`, réglage du devis) ; « Sauts de page : <présentation> » / « Sans sauts de page »
  (`dgPresSel` : rang et nom de la présentation, une présentation sans nom comprise ; « Sans sauts de page » = `sansSauts`, garde les options de base de la présentation par
  défaut). Comme le modèle : ventilation par ouvrage des positions totalisatrices à 2 chiffres et plus (`dgAgreger`, pendant la création seulement : somme des ouvrages des
  sous-positions ; pourcentages sur la même base que le moteur ; en « Assembler les descriptifs » le descriptif propre de la totalisatrice est gardé), noms des ouvrages, page
  Information refaite depuis les remarques et les ouvrages (`ch02bIntro`, titre souligné, rangées alternées, ligne vide avant chaque remarque nommée et avant les ouvrages, lignes
  vides d'une remarque en paragraphes gardées, 23 lignes par page, textes coupés à 229 pt : 298 pt moins 15 % moins les 25 pt de `ch02bWrap`), page Information aussi sans
  remarque quand le devis a des ouvrages (`dgOuvInfo`), textes des positions recollés (`dgTexte` / `ch01bDbl` : « con- duites » → « conduites »), « Quantité 1500 = 1500.0 » tel
  quel, texte trop long coupé au bord de sa colonne par « ... » (plus de débordement sur la colonne voisine ; formule d'une ligne de calcul retirée si elle ne tient pas dans la
  colonne Texte). Jamais plus de 25 rangées par page de tableau (avec un filtre d'ouvrages, le moteur ne garde pas une position et ses ouvrages ensemble : la suite part sur une
  page insérée, coupée avant une position si possible). En-tête : papier des contrats (le modèle a l'en-tête de l'ancien logiciel). Écarts qui restent : l'ancien logiciel ne ventile pas certains totalisateurs (CFC 2, 51),
  sauts de page de sa propre mise en page, « ... » au lieu de « … » (glyphe absent d'Akkurat).
  **Retouches du 08.11.2026 (Paulo)** : page Information sans rangées grises alternées, libellés en gras ; contenu décalé (« déplacer le tout ») : libellés
  à l'aplomb de la 2e colonne du pied (x 125.72) et texte de la 3e (x 222.98) — `livretDG.infoDx` 97.37, `colsI` 97.26 + reste, sans retrait de 2 pt ; titre
  « Information » et son filet à la marge ; en-tête de la page de garde = nom du document seul
  (`tt('document')`, comme les autres pages ; le grand titre de la garde garde la phase).
  **Page de garde = celle du devis descriptif (08.11.2026, Paulo : « applique à l'ensemble de l'app la mise en page du descriptif », puis « première page uniquement pour
  le devis et le descriptif », « page de garde seulement »)** : `gardeEdito(cx, G, ori)` de sg3_docsub.js, commune au devis descriptif et au devis général
  (`livretDG.couverture.edito`) ; le document Honoraires aussi depuis le 10.11.2026 (Paulo : « reprendre le graphisme de devis », « les mises en page sont identiques à
  devis ; pour les deux derniers uniquement document portrait » : titre du document, rubriques `deGardeRub`, signatures ; avant : ancienne page de garde `garde`) ; le devis
  descriptif sans la désignation sous le titre (même jour, comme le devis général). Devis général : état « ■ PROVISOIRE » / « ANNULÉ » (rien s'il est
  validé), numéro de l'affaire, titre de garde (« DEVIS GÉNÉRAL », `reglages.titres.garde`), désignation, ligne d'information en bleu nuit « <phase> – PRÉCISION ±10 % »
  (état / phase du devis et marge d'approximation, « Précision » ajouté seulement s'il manque, textes modèles « [...] » écartés), filtre, rubriques (`deGardeRub`, communes avec le descriptif), signatures. Portrait :
  comme le descriptif. Paysage : même grille, contenu de x 124.4 à 732.1 (barre du numéro de page − 25 pt), rubriques à gauche (jusqu'à x 464.4), signatures à droite
  (485.5–600.8 et 616.8–732.1) à la hauteur du premier filet des rubriques. Page de garde toujours non numérotée mais comptée. Copie d'avant :
  `subgestion3/_backup_20261108_avant_garde_devis/`.
  **Retouche du 10.11.2026 (Paulo : « texte en noir, ligne aussi », « même espace pour les deux, copie l'espace en bas en haut »)** : numéro, titre, ligne d'information
  et filet sous le bloc du titre en noir (`C.N`, noir des contrats ; plus de bleu nuit sur la page de garde, l'état « PROVISOIRE » / « ANNULÉ » reste rouge) ; numéro
  remonté : du filet de tête (bas à y 101) au haut du numéro = du pied du titre au haut de la désignation = 20,77 pt (`HC` 0,723 = hauteur des capitales et chiffres
  d'Akkurat mesurée, `ECART` = 28 − 10 × HC ; numéro à la ligne de base 143,46 au lieu de 160 en corps 30). Puis (« déplacer le bloc en laissant un espace x comme avant ») :
  rubriques remontées, premier filet gris à `ECART` sous le filet noir du titre (`yR0 = yN + 0,75 + ECART`, au lieu de y 350 au plus tôt, paysage 300 ; 99TST :
  267 pt) ; signatures inchangées en portrait (y 610, plus bas si besoin), en paysage toujours à la hauteur du premier filet des rubriques. Puis (« supprimer ») :
  plus de filet gris au-dessus de la première rubrique ni sous la dernière, filets seulement entre les rubriques ; puis (« espace x ») : du bas du filet du titre
  au haut du texte de la première rubrique = `ECART` (`yR0 = yN + 0,75 + ECART + HC × 9 − 16`, 1re ligne de base à 273,5 pt sur 99TST) — trois espaces égaux de
  20,77 pt : filet de tête → numéro, titre → désignation, filet du titre → rubriques. Puis (« déplacer ±10% devant devis général en alignant à droite ») :
  devis général — précision (`couverture.marge`, marge d'approximation sans le mot « Précision ») sur la dernière ligne du titre, alignée à droite sur le bord des
  filets (x 485.5 en portrait) — puis la ligne d'information (phase du devis) retirée de la page de garde (« supprimer », 10.11.2026 : `info` vide ; la
  désignation est directement suivie du filet noir), puis la désignation aussi (« supprimer » : `sous` vide, elle est dans la rubrique Ouvrage ; titre
  directement suivi du filet noir, à `ECART` sous sa ligne de base ; propositions de justification montrées avant, sans suite) —, même typo que le titre (Akkurat Bold, même corps ; « même typo que devis général », essayée d'abord en Light) ; essai sur le
  Devis estimatif de 99TST : « DEVIS ESTIMATIF » et « ±15% » sur une ligne, 38 pt d'écart ;
  paysage (« glisser le bloc en dessous », puis « ne pas passer sous le logo ») : signatures SOUS les rubriques, filet à `ECART` sous leur dernière ligne,
  deux rangées sur la largeur du bloc (x 124.4–485.5) : maître de l'ouvrage, puis l'architecte DESSOUS (« déplacer dessous, ligne inférieure alignée sur la
  ligne y alignée au logo » ; avant, le même jour : architecte à droite, x 510.68–732.1) — filets « Lieu, date » / « Signature » de la rangée du bas alignés
  sur le bas du logo (bas du filet à 509.4, « aligner les lignes de date et signature au logo » ; légendes dessous, à 517.9),
  ECART entre les rangées, filet d'écriture à +56 sous le libellé ou moins (30 au plus bas) pour que la rangée du haut reste à ECART sous les rubriques (99TST : +43) ; « largeur
  identique à la mise en page portrait » : titre et rubriques de la page de garde paysage à la largeur du portrait, x 124.4 → 485.5, au lieu de 732.1 ; « Lieu, date » (40 % de la colonne) et « Signature » côte à côte sur un même filet à +56
  (moins si la place manque) ; rien sous le bas du logo (`LIM` = hauteur − 85.9 en paysage, − 83.5 en portrait, alerte sinon) ; 99TST : textes à 497 pt, logo à 509 ;
  portrait inchangé (+56, +126) ; le titre se coupe avant elle (12 pt d'écart) ; la ligne d'information ne garde que la phase ; sans
  titre, la précision reste dans la ligne d'information. Vaut pour le devis
  général et le devis descriptif (même fonction).
  **Base de toutes les mises en page du devis général = celle de 99TST (09.11.2026, Paulo : « cette mise en page devient la base de toutes les mises en page de
  devis »)** : `DG_BASE` (sg3_devis.js) — format **portrait par défaut** (`dgPortrait` : paysage seulement si choisi ; avant, paysage par défaut), descriptif, calcul
  complet (quantités et prix, commentaire du calcul, montants), positions sans montant ; le reste comme `DG_PRESET` (ni variantes, ni « 1 à 3 chiffres », ni commentaire en
  colonne, ni décimales masquées, ni arrondi). Vaut pour tout devis dont les cases du PDF n'ont jamais été réglées (`dgPdf.modeSync` absent : `dgModeOuBase`, dans
  `dgOptions` et `dgBasculer`) ; un devis réglé garde ses cases (format compris s'il l'a choisi) ; une présentation choisie ensuite dans le devis fait suivre le PDF comme
  avant (`dgSuivreMode`). « Pourcentages sur le total général » reste un réglage du devis (écran et PDF), déjà la base des nouveaux devis depuis le 08.11.2026. Copie
  d'avant : `subgestion3/_backup_20261109_avant_base_devis/`.
  **Graphisme « Bleu nuit » du tableau (08.11.2026, variante 4 choisie par Paulo parmi 5 ; maquettes `subgestion3/_backup_20261108_maquette_dg/`)** :
  `livretDG.style:'nuit'` (au lieu de `zebra`) dans `contenuLivret` ▸ `tableau` (sg3_docsub.js) : titres des colonnes en blanc (Regular 8) sur une bande bleu
  nuit #003346 ; CFC à 1 chiffre (styles O, F) en bleu nuit, CFC à 2 chiffres (W) en noir, pourcentage compris (d'abord en bleu nuit ; « texte en noir », même jour), filet bleu nuit sous les CFC à 1 chiffre (0,75 pt ; d'abord 0,5) ; filet gris (#d8d8d4, 0,5 pt ; d'abord 0,25, « épaissir légèrement les lignes ») — pas de filet gris sous la dernière position d'une page (Paulo, 08.11.2026 : « supprimer la ligne lorsqu'il n'y a plus de texte en dessous » ; le trait bleu nuit sous un CFC à 1 chiffre reste)
  sous chaque position, après ses lignes de calcul (D) et son descriptif (X), rien entre une position et ses détails ; lignes de calcul et descriptif en gris
  #706F6F ; pourcentages en bleu nuit ; total (T) sur une bande bleu nuit, texte blanc ; plus de rangées grises ni de filet noir. Montants en noir. Sans
  `style`, l'ancien rendu (zébrage, filets noirs) reste. Page Information : ni grisé ni filets.
  **Document « Honoraires » au dessin du devis général (08.11.2026, Paulo : « corriger le design pour correspondre au design du devis »)** : ligne 1 de Documents
  (`hoOctets`, `hoRendu`, enveloppe de `ch02cRender` pour i = 1) — mêmes données et réglages que le modèle du moteur (`ch02cJob` → honorarTable), dessinés comme le devis
  général (sgDsPdf, `livretDG`, style Bleu nuit, portrait) : page de garde au titre du document (« Soumis à honoraires ») avec ouvrage, maître de l'ouvrage (celui de l'ouvrage
  filtré s'il en a un), architecte, direction des travaux ; tableau CFC | Texte | [OUV | Loc. | Commentaire] | Montant HT | % soumis (bleu nuit) | Honoraires, CFC dans la
  marge, CFC à 1 chiffre en bleu nuit, à 2 chiffres en gras (montants Regular), totalisatrices à 3 chiffres en Light (montants Regular), total sur bande bleu nuit, montants en
  noir, textes passés à la ligne ; colonne Commentaire seulement avec « Base et commentaire de la position » + « … dans colonne séparée ». Relecture du 08.11.2026 (8 défauts, 5
  corrections) ; le filtre est signalé d'après son effet réel (`dgFiltreTexte`, aussi pour le devis général : filtre rapide d'un seul ouvrage compris). Lecteur PDF : plus de
  trait sous l'icône « Ajuster à la largeur » (même jour).
  **État des PDF du devis = registre daté (10.11.2026, variante D choisie par Paulo parmi 10 — deux séries de 5 maquettes,
  `subgestion3/_backup_20261110_maquette_statut_pdf/` ; Paulo : « définir le statut du fichier : archiver, validé, supprimer »)** : champs du fichier (`depotfichier`)
  `ETAT_PDF` valide | archive | supprime (absent = créé), `VALIDE_LE`, `ARCHIVE_LE`, `SUPPRIME_LE`, `ETAT_PAR` (initiales), `ETAT_LE` ; liste « Fichiers PDF » du devis :
  colonnes Nom du fichier, Créé le (date du fichier), Validé le, Archivé le, Supprimé le — date de l'état actuel en couleur et en gras (bleu nuit, vert #4E6B0F, gris,
  rouge) —, Par, Commentaire, action à droite (« Valider ▾ » : `pdfActions`) et mêmes actions au clic droit. Créé → Valider, Archiver, Supprimer ; Validé → Archiver,
  Annuler la validation ; Archivé → Rétablir, Supprimer ; Supprimé → Rétablir (état précédent = date restante la plus récente, sinon Créé) ; `pdfChanger` (« Supprimer »
  confirmé). « Supprimé » ne retire jamais le fichier (ligne barrée ; « Supprimer » du menu du moteur retiré de cette liste). « Ouvrir le PDF » d'une ligne Documents :
  le PDF validé du document, sinon le plus récent en cours (`pdfLigne`). Plusieurs versions validées possibles (question posée à Paulo). Droit : documents : dépôt.
  **Puis, même jour (Paulo : « lorsque je valide supprimer, supprimer le fichier ; ajoute un menu archivé et un menu effacé, pour stocker les devis, descriptif et
  honoraires », puis « déplacer archivé et effacé » sous la liste)** : « Fichiers PDF » = PDF en cours seulement (créés, validés ; colonnes Archivé le / Supprimé le
  retirées : `o._sgAll` filtré) ; sous la liste, deux rubriques repliables **Archivés** et **Effacés** avec leur nombre (`pdfStock`, ouvertes gardées pendant la séance
  `SGPDF.ouv`), rangées par Devis · Descriptif · Honoraires, mêmes colonnes que le registre (+ Archivé le, Supprimé le), Rétablir / Supprimer, double-clic = ouvrir, clic
  droit = actions ; un PDF supprimé quitte la liste (confirmation « va dans Effacés ») ; « Supprimer » aussi pour un PDF validé ; messages « rangé dans Archivés /
  Effacés », « remis dans Fichiers PDF ». (Essai du même jour, retiré : choix Fichiers PDF · Archivés · Effacés en onglets dans l'en-tête de la liste.)
  **Variante C « Vignettes » gardée (Paulo : « conserve-la, elle peut m'intéresser visuellement, sauvegarde-la dans Archives »)** : Archives ▸ Maquettes ▸ Vignettes des
  PDF (`mq-vignettes-pdf`, `dom:'reglages'`, fin de sg3_devis.js) — maquette avec données d'exemple, rien n'est lu ni écrit.
  **Bouton « Réglages ▾ » retiré des lignes Documents (10.11.2026, Paulo : « supprimer »)** : les réglages des trois documents sont dans le panneau de leur fenêtre
  (Ouvrir) ; lignes = Ouvrir / Créer le document, Créer le PDF, Ouvrir le PDF, Supprimer le document.
  **PDF enregistrés du devis = archive définitive (10.11.2026, Paulo : « une fois les documents sauvés, le fichier ne peut plus être modifié », choix « PDF figé, ni
  remplacé ni supprimé »)** : tout `.pdf` des dossiers d'un devis (`Construction/Costestimate/<P>/<D>/documents` et sous-dossiers ; `PDF_FIGE`) — un nom déjà pris
  n'écrase jamais l'existant : nouveau fichier « <nom> (2).pdf » (enveloppe de `ch03aEnregistrer`, message ; le commentaire saisi suit le nouveau nom) ; fenêtre « Nom
  du fichier » préremplie avec un nom libre (`pdfLibre`) et question « remplacer ? » réécrite (`CH03A_MSG.existe` le temps de la fenêtre) ; suppression refusée
  (`ch03aSupprimer`, `ch03cSupprimerDlg` : message ; menu « Supprimer (archive : impossible) » grisé, `ch03cMenuPdf`) ; boutons « Supprimer le PDF » retirés des lignes
  Documents ; un document qui a son PDF officiel ne peut plus être supprimé (message). Commentaire toujours modifiable. Règle de l'app seulement (le serveur du NAS
  ne bloque pas) ; fichiers `.dpdoc` non concernés.
  **Sauts de page des documents Honoraires et Devis descriptif (10.11.2026, Paulo : « ajouter les sauts de page », sur le modèle du devis général)** :
  `reglages.sautsDoc` = { honoraires | descriptif : { cfc:[clés], sans } } (clé = n° CFC de la position ; titre sans numéro, p. ex. « Remarques » : « · » + texte) — nouvelle
  page AVANT la position ; Réglages ▸ Sauts de page : interrupteur « Sans sauts de page » (ignore la liste sans l'effacer) et « Remettre à zéro les sauts de page »
  (`sdItems`, enveloppe de `ch02cPrefItems` pour les lignes 1 et 2) ; clic droit sur une position du PDF = menu du devis général (`sdMenu` → `dgSpOuvrir` avec `geo` :
  rangée surlignée donnée en pt) ; repères rouges à l'écran seulement (`sdMarquer`, MutationObserver). Carte des positions par page (`SD_CARTE`, `sdCarte`) : Honoraires
  posée par `hoOctets` (rangées de 15 pt dès y 122 ; coupure forcée dans la répartition des rangées), Devis descriptif renvoyée par `contenuDescDG` de sg3_docsub.js
  (`D.sauts`, tableau `D.carte` fourni par `deOctets` : { p, cle, n, t, y, h, suite }, fiche coupée = deux parties). Un saut posé alors que « Sans sauts de page » est
  allumé l'éteint (message). Vérifié sur 99TST (224 Couverture des Honoraires, 2 Bâtiment du descriptif, interrupteur, remise à zéro).
  **Document « Devis descriptif » au dessin du descriptif du bureau (08.11.2026, Paulo : « voici à quoi doit ressembler le descriptif, reproduis celui-ci ici », modèle
  17QUE_DESCRIPTIF_230619.pdf — client, jamais dans le dépôt)** : ligne 2 de Documents (`deOctets`, `deRendu`, enveloppe de `ch02cRender` pour i = 2 ; dessin `contenuDescDG`
  de sg3_docsub.js, `o.descDG`) — mêmes données et réglages que le modèle du moteur (`ch02cJob` → descTable). **Page de garde = variante 3 « Grand titre éditorial »**
  (choisie par Paulo parmi 5 le 08.11.2026, « la version 3 » ; maquettes et mesures `subgestion3/_backup_20261108_maquette_garde/`, entrée vC de `variantes.json`) : filet noir
  1 pt à y 100 ; à droite, état en rouge #BD1E42 précédé d'un carré de 5 pt (« PROVISOIRE » devis non validé, « ANNULÉ » annulé, rien s'il est validé ; la date, d'abord
  à gauche, retirée le même soir à la demande — elle est dans l'en-tête) ; numéro de l'affaire Light 30 bleu nuit puis « DESCRIPTIF GÉNÉRAL DE LA CONSTRUCTION » Bold 30 bleu nuit (coupé à 340 pt, 24 pt au-delà de 4 lignes) ; désignation
  de l'affaire en capitales Regular 10, lignes équilibrées (300 pt) ; filtre d'ouvrage éventuel en Light 8 gris ; filet bleu nuit 0,75 ; rubriques Ouvrage, Maître de
  l'ouvrage (celui de l'ouvrage filtré s'il a le sien : `deMoFiltre`, règle du moteur `ch02cMoOuv`, appliquée aussi au devis général), Architecte, Direction des travaux
  en tableau à filets gris (libellé Regular 7,5 en capitales à la marge, nom Regular 9 en lignes équilibrées puis adresse Light 9 à x 222.98, nom et adresse séparés par
  `deNomAdr` / `sgNomAdresse` — `SG_SALUT` reconnaît aussi « Monsieur, », « Madame, Monsieur, » — ; adresse de l'ouvrage pas répétée quand la désignation la contient,
  rue saisie dans le nom de l'adresse gardée ; maître de l'ouvrage de l'ouvrage filtré : lignes cochées du filtre seulement ; rubrique vide omise ; rien n'est coupé ;
  désignation et noms en lignes équilibrées « en pyramide », jamais un mot coupé ; seconde relecture du même soir : localité gardée quand seule la rue est dans la
  désignation, nom de contrat sans lettre — « - » des anciens contrats — ignoré par `sgAdressesAffaire` au profit de l'intervenant « Maître d'ouvrage ») ; signatures sur deux colonnes à place fixe (x 124.4–296 et 312–485.5, y 610, plus bas seulement si les rubriques
  l'exigent, signalé au journal). Marges = celles de la page de garde du devis général et des honoraires, x 124.4 → 485.5 (Paulo, même soir : « alignement », « marges »,
  choix « Comme le devis général ») ; le corps garde les siennes (CFC x 85.04, texte x 125.72, barre x 510.68). Corps (remplacé le même jour par la **variante 5 « Sommaire et fiches »**, choisie par Paulo parmi 5 pour correspondre aux autres documents ; maquettes
  `subgestion3/_backup_20261108_maquette_descriptif/`) : bande bleu nuit « CFC · Désignation » (« Montant » avec la case) répétée sur chaque page ; CFC à 1 chiffre Bold
  bleu nuit + filet bleu nuit 0,75 ; CFC à 2 chiffres Bold noir ; chaque position à 3 chiffres et plus = fiche entre deux filets gris (un seul entre deux fiches) : numéro
  Regular bleu nuit à x 85, titre Regular noir à x 125.7, descriptif Light 7,5 interligne 9,5 jusqu'à x 460 ; descriptif d'un CFC à 1 ou 2 chiffres = fiche sans titre ;
  remarques du devis à la fin (« Remarques », une fiche par remarque, telles qu'imprimées partout : `remImpr`, nom de l'affaire automatique compris, regroupées comme dans
  les Paramètres — `remGroupes` —, sans la ligne de tirets, jamais en sous-titres) ; sous-titres (lignes en capitales soulignées) = lignes courtes faites de mots seulement (pas de puce, parenthèse, montant, sigles seuls ni
  phrase) ; titres de CFC gardés avec les titres qui les suivent et le début (ou toute) la fiche suivante (`besoinTitre`, `hGarde`) ; fiche coupée seulement au-delà de 4
  lignes de texte, devant une ligne de texte, 2 au moins de chaque côté (lignes vides non comptées : `nTx`), jamais juste après un sous-titre ou une ligne d'ouvrage
  suivis de leur texte, ni entre deux têtes qui se suivent (« REZ-DE-CHAUSSÉE » puis « CUISINE », 3 au plus) (`tete`, `points`) ; suite de titres plus haute qu'une page : chaque titre gardé seulement avec ce qui le suit (`libre`) ; position sans désignation : numéro et montant gardés ;
  devis sans position ni remarque : page de garde seule (`deFiches`, `contenuDescDG` ; relecture du 08.11.2026). Réglages ▸ Montants ▸
  **« Afficher les montants »** (Paulo, même jour ; `reglages.descMontants`, décoché par défaut) : montant à droite de chaque CFC et ouvrage ; descriptifs assemblés sans
  montants : lignes d'ouvrage masquées. Case placée par `rang` (tri du panneau).
  **Le PDF suit la présentation du devis (08.11.2026, Paulo : « dans PDF, afficher les options selon affichage sélectionné dans devis »)** : choisir une présentation
  (Présentation ▾ du devis) règle aussi le PDF — Standard et Avec colonnes honoraires : sans descriptif ni calcul ; Toutes les colonnes et Avec le descriptif : descriptif ;
  Toutes les colonnes avec le calcul de prix et Avec le descriptif et le calcul de prix : descriptif et calcul (ses trois cases) — enveloppes de `ch02aSetMode` et de `presMenu`,
  `dgSuivreMode`, `dgModeOpts` ; présentation suivie gardée dans `dgPdf.modeSync` ; toujours, y compris pour un devis dont la présentation n'a jamais été
  choisie (Paulo : « c'est plutôt le PDF qui suit les réglages du devis ») ; les cases restent modifiables dans les Réglages du PDF pour la présentation en cours (`dgOptions`, `dgBasculer`).
  **Saut de page au clic droit dans la fenêtre du document (08.11.2026, Paulo : « en cliquant avec le bouton droit sur le pdf et sur la ligne que je sélectionne, je souhaite
  pouvoir mettre un saut de page »)** : clic droit sur une ligne du tableau → « Saut de page avant « <CFC> <texte> » » (la position de la ligne : le moteur ne coupe qu'avant une
  position) ou « Retirer le saut de page avant … » (et, ailleurs sur une page qui commence par un saut, « Retirer le saut de page de cette page ») ; niveau selon la série de la
  page (document principal « tous », récapitulatifs « 2 » / « 1 », règle de `ch02bUb`) ; enregistré dans la présentation choisie (`sautsDePage`), « Sans sauts de page » choisi :
  la présentation par défaut est choisie et reçoit le saut (message) ; aucune présentation : « Standard » créée (`ch02dStdPres`). Ligne repérée par la carte du dernier PDF
  (`DG_CARTE`, posée par `dgOctets` : série et position de chaque rangée), PDF refait aussitôt, page gardée ; lecture seule : message ; ⌥ + clic droit = menu du navigateur
  (`dgSautMenu`, `dgSaut`). **Menu « version 1 — Menu net et explicite »** (choisie par Paulo parmi 5, même jour ; maquettes conçues par 5 designers :
  `subgestion3/_backup_20261108_maquette_menu_saut/`) : en-tête « Saut de page · Document principal / Récapitulatif … », action avec icône au trait, CFC en gras bleu nuit et
  nom de la position, effet écrit en clair ; sur la page, rangée de la position surlignée en jaune très pâle et coupure tracée au-dessus (pointillé « Nouvelle page » / trait
  plein « Saut de page », étiquette dans la marge droite) ; Échap, clic ailleurs, défilement : fermé ; ↑ ↓ Entrée (`dgSpOuvrir`, `dgSpFermer`, classes `sgsp-*`).
  **Sauts de page visibles à l'écran, jamais imprimés** (même jour, Paulo : « indique visuellement sur le pdf, mais ne sera pas imprimé, les sauts de page ») : chaque page
  qui commence par un saut de la présentation porte le trait plein, le repère de marge et « Saut de page », en rouge #BD1E42 (« afficher en rouge », même jour ; la proposition « Nouvelle page » du menu reste en pointillé bleu nuit) — éléments posés sur la page du lecteur, absents du PDF
  (Imprimer, PDF, Partager) ; reposés à chaque mise en page (`dgSautsMarquer`, MutationObserver sur `.sglp-pages`) ; aucun avec « Sans sauts de page ».
  **Hiérarchie « Filet de calcul » (08.11.2026, variante E choisie par Paulo parmi 5 ; Paulo : « tout est au même niveau d'information … passer en italique comme dans le devis » ;
  maquettes `subgestion3/_backup_20261108_maquette_hierarchie/`)** : descriptif en Akkurat Light Italic gris ; lignes de calcul (rangées repérées `cal` par l'enveloppe de
  `ch02bDetail` pendant `DG_ACTIF`) en retrait de 7 pt (`DG_CALR`, `livretDG.calRetrait`) derrière un filet vertical bleu nuit de 0,75 pt à l'aplomb du texte (3 pt en retrait
  en haut et en bas, coupé en fin de page) ; libellé du calcul en gris droit (en italique depuis le 10.11.2026, Paulo : « italic » ; mesuré en italique pour la coupure), rangée « Quantité … Prix … » (`q`, `dgQte`) et montants du calcul en italique gris. Descriptif
  recoupé à la largeur réelle de la colonne (portrait et paysage) : pendant `DG_ACTIF`, `ch02bWrap` ne coupe qu'aux retours à la ligne voulus, `etaler` coupe en mesurant en
  italique. Vérifié : mêmes caractères qu'avant sur 3 devis × portrait / paysage × avec / sans montants.
  Relecture du 08.11.2026 (8 défauts confirmés, 5 corrections) : descriptif limité à la colonne Texte (plus de débordement sur OUV / Localisation / Commentaire) ; rangée
  « Quantité … Prix … » repérée par sa place (dernière rangée du moteur), jamais par son texte (« Prix bloc selon offre … » reste un libellé droit) ; italique de cette rangée
  limité à la colonne Texte (libellé de la colonne Commentaire droit) ; filet le long des seules rangées de calcul écrites dans la colonne Texte ; pages qui commencent par un
  saut de la présentation (`pg.saut`) : le surplus de la page précédente n'y est jamais collé devant (une page est insérée).
  **Textes jamais coupés (08.11.2026, Paulo : « toujours écrire complet, ne pas couper les textes »)** : `etaler` (dgOctets, sg3_devis.js) — un texte plus large que
  sa colonne déborde sur les colonnes de texte vides à sa droite (`livretDG.deborde`, dessin compris), sinon passe à la ligne sur des rangées de suite (`k:1`, même
  style, pas de filet entre une rangée et sa suite ; mot trop long coupé à la lettre), avant la répartition sur les pages ; Information : la suite d'un libellé va sur
  les rangées suivantes de la même remarque. Ligne de calcul complète (formule gardée, `court` retiré). Écart de mesure de quelques points au dessin : corps à peine
  réduit plutôt que « … ». **Corps du texte (même jour)** : `DG_TXT` 8 pt pour TOUT le texte du tableau — titres des colonnes (`livretDG.corpsTitres`),
  CFC à 1 et 2 chiffres et total (gras), positions, lignes de calcul, descriptif, page Information et son titre (d'abord 7,5 pt, puis « taille des textes 8 pt, mais
  ne pas changer les en-têtes et les pieds de page ») ; en-tête et pied du papier à 7,5 pt ; page de garde inchangée.
  **Format Paysage | Portrait (08.11.2026, Paulo : « conserver la possibilité de créer une version verticale ou horizontale du devis » ; maquette
  `subgestion3/_backup_20261108_maquette_dg/proposition_portrait.js`)** : Réglages ▸ Format (boutons en tête du panneau, aussi dans le menu Réglages de la
  ligne), `E.reglages.dgPdf.format` ('portrait' ; paysage par défaut). Portrait : même papier des contrats (en-tête, pied et logo identiques au paysage),
  pages du moteur à la hauteur `DG_HP` 630 pt, tableau de x 28.35 sur `DG_WP` 490 pt ; les quatre colonnes de montants deviennent **Montant** (positions à 3 et
  4 chiffres, lignes de calcul) et **Total** (CFC à 1 et 2 chiffres) ; colonne vide dans sa série retirée (récapitulatif : Total et % seulement) ; lignes d'un
  descriptif réunies en un paragraphe puis repassées à la ligne ; `livretDG.orientation` / `x0` dans contenuLivret.
  **Portrait : « Montant HT » et « Montant TTC » (10.11.2026 au soir, Paulo : « pour la version portrait, afficher que la version 1 chiffre TTC et HT et supprimer
  3 chiffres et 2 chiffres TTC », choix « deux colonnes HT et TTC » ; remplace l'essai DG_P4 du même jour et la présentation Montant / Total du 08.11.2026)** : deux
  colonnes de 62 pt (`DG_WM`), chacune avec le montant de chaque rangée (CFC à 1, 2, 3, 4 chiffres, ouvrages, lignes de calcul, total), le niveau se lisant à la
  graisse (CFC à 1 chiffre et total gras, 2 et 3 chiffres Regular, 4 chiffres et détails Light) ; récapitulatifs et document principal. HT = seconde passe du livret
  (`DG_PASSE_HT` : `dgEnHT` remplace dans l'arbre de ch02bCalc chaque TTC par son HT, ch02bDetail prend le HT de chaque ligne de calcul), rapprochée rangée par
  rangée avec la passe TTC (page, style, CFC, texte hors calcul) ; au moindre écart, « Montant TTC » seule (avertissement dans la console). **Option « Montants de
  1 à 4 chiffres »** (Réglages ▸ Affichage, après « Récapitulatif CFC à 2 chiffres », clé `sgNiveaux` de `dgPdf`, non cochée par défaut ; Paulo : « ajouter une
  option qui permet d'afficher de 1 à 4 chiffres, mais uniquement lorsque l'option est activée ») : en portrait, une colonne TTC par niveau comme le paysage
  (« 4 chiffres TTC », « 3 chiffres TTC », « 2 chiffres TTC », « 1 chiffre TTC », 56 pt ; colonne vide dans sa série retirée ; la colonne Texte vise 120 pt :
  Commentaire réduite jusqu'à 60 pt, montants 46 pt — titres alors « 4 ch. TTC » —, OUV / Localisation 24 pt, [%] 22 pt) ; en paysage, toujours de 1 à 4
  chiffres (case cochée et grisée). Relecture contradictoire du 10.11.2026 (workflow, 5 défauts confirmés, corrigés ou expliqués) : devis « TVA non séparée »
  (`ch02aSep` faux : prix saisis TTC, TVA 0) → pas de passe HT, « Montant TTC » seule ; rapprochement des deux passes par clé (série, style, position, ouvrage,
  CFC, texte, rang d'apparition ; lignes de total sans position) au lieu de l'index : une position « sans montant » d'un seul côté (TTC nul et HT non nul,
  devis 1601) ne fait plus perdre toute la colonne HT ; un montant trop large pour sa colonne est imprimé en corps réduit (jusqu'à 5,5 pt), jamais coupé par
  « … » (`contenuLivret`, sg3_docsub.js). Limite connue : avec « Arrondir à 10 / 100 / 1000 », le moteur arrondit le HT et le TTC chacun vers le haut (règle de
  l'ancien logiciel en TVA séparée) : petites positions à HT = TTC possibles. Essais : 186 devis × portrait HT / TTC, 1 à 4 chiffres, paysage ; 173 devis à
  calculs × 4 variantes (calcul et descriptif, arrondi 1000 + positions vides masquées + 1 à 3 chiffres, commentaire en colonne, récapitulatif à 2 chiffres et
  filtre d'ouvrages) ; aucune erreur, aucun chevauchement.
  **Option « Récapitulatif CFC à 1 chiffre » (10.11.2026, Paulo : « dans Positions ajoute une option CFC 1 chiffre »)** : case du groupe Positions (sous « Seulement
  positions de 1 à 3 chiffres ») et du menu Réglages de la ligne = `includeKvOneDigit` du livret (`DG_MENU`, `VUE_ORDRE` ; `vueGroupe` reconnaît « chiffre » au
  singulier et « récapitulatif ») : ajoute le récapitulatif des CFC à 1 chiffre avant celui à 2 chiffres ; non coché par défaut (`DG_PRESET`), enregistré dans le devis.
  Puis (même jour, « dans Positions ajouter récapitulatif CFC à 2 chiffres ») : case « Récapitulatif CFC à 2 chiffres » juste dessous = `includeKvTwoDigit` (cochée
  par défaut, `DG_PRESET`) ; les deux décochées : pas de récapitulatif, le document principal suit l'Information. Essai sur 99TST : 1 + 2 → 18 pages, 1 seul → 17,
  aucun → 16, 2 seul → 17.
  **Puis (même jour, Paulo : « le récapitulatif à CFC 1 chiffre sera toujours visible sur les documents ; le récapitulatif à 2 chiffres uniquement en activant la
  visualisation ; VB, etc. uniquement visible dans le récapitulatif CFC 1 chiffre »)** : case « Récapitulatif CFC à 1 chiffre » retirée, récapitulatif à 1 chiffre
  toujours imprimé (`dgOptions` : `includeKvOneDigit` toujours vrai) ; « Récapitulatif CFC à 2 chiffres » décochée par défaut (`DG_PRESET` ; un devis où elle a été
  cochée la garde) ; volume et prix au m³ sur le seul récapitulatif à 1 chiffre.
  Ordre des Réglages (même jour, annotations de Paulo) : Positions = Afficher les positions sans montant (en tête ; essayée un moment en tête d'Affichage), Seulement
  positions de 1 à 3 chiffres, Descriptif (`VUE_ORDRE`) ; Affichage = Pourcentages sur le total général (en tête, `rang:-1`, déplacé de Positions), Volume SIA 416
  et prix au m³ (`rang:-0.5`), Récapitulatif CFC à 2 chiffres (`grp:'Affichage'`), Commentaire dans colonne séparée ; même ordre dans le menu Réglages de la ligne (`DG_MENU`, « Pourcentages… » inséré avant « Volume SIA 416 et prix au m³ »).
  **Récapitulatifs (10.11.2026, Paulo : « ajouter un titre récapitulatif », « afficher uniquement CFC 1 et CFC 2 chiffres »)** : titre « RÉCAPITULATIF » en
  Akkurat Bold blanc DANS la bande bleu nuit des titres des colonnes, à la place de « Texte » (variante 2 choisie par Paulo parmi 5 — maquettes
  `subgestion3/_backup_20261110_maquette_recap/` : 1 comme « Information », 2 dans la bande, 3 double bande, 4 onglet, 5 grand titre ; essais d'avant le même jour :
  titre au-dessus de la bande, puis à la hauteur de « INFORMATION » avec le tableau descendu de 14 pt) ; tableau à sa hauteur habituelle, sur toutes les pages du
  récapitulatif (`pg.recapTitre`, posé dans `dgOctets` après la répartition ; `rT` dans `contenuLivret` ▸ `tableau`) ; toujours « Récapitulatif », en minuscules comme
  les autres titres de colonnes, sans préciser 1 ou 2 chiffres (« ne pas préciser, indiquer uniquement Récapitulatif », « en minuscule », même jour). En paysage aussi, colonnes de montant vides dans la série d'un récapitulatif retirées (2 chiffres : « à 2 chiffres » et
  « à 1 chiffre » seulement), largeur rendue à la colonne Texte.
  **Tableau d'un récapitulatif aligné en bas sur le logo (10.11.2026, « le bas du tableau aligné avec le bas du logo »)** : bas de la bande du total = bas de
  l'encre du logo (paysage 595.28 − 85.9 = 509.38, portrait 841.89 − 89.25 = 752.64, mesurés au rendu) ; `pg.dy` calculé dans `dgOctets` (jamais négatif : un
  tableau plein reste en haut), suivi par `contenuLivret` (`dyR`) et la carte des clics (`y0`). Page de garde : `LIM` portrait corrigé à 752.64 (avant 758.39).
  **Alignement sur le papier (même jour, portrait et paysage ; Paulo : « les CFC doivent être alignés à la colonne info@substances », « la dernière colonne doit
  être alignée à la barre verticale entre la page et le nombre de pages », « déplacer le texte », « déplacer les numéros de CFC »)** : numéros CFC dans la marge à x 85.04 (comme les numéros de chapitre des contrats ; `livretDG.x0Tab`,
  colonne CFC `DG_CFC` 40.68 pt), désignations, lignes de calcul et descriptif à x 125.72 (2e colonne du pied) ;
  la dernière colonne ([%]) finit sur la barre du numéro de page (largeur − 84.6 : 757.29 paysage, 510.68 portrait) — largeurs `DG_WL` 674.25, `DG_WP` 427.64 ;
  textes à gauche sans retrait (`livretDG.aligne`, bandes et filets 2 pt de part et d'autre) ; paysage : place reprise sur les montants (66 pt), [%] (32), Commentaire (90), puis Texte ; portrait : CFC 40.68, Commentaire 84,
  OUV / Localisation 30, Montant 56, Total 60, % 26. Page Information refaite (même jour, « ajouter une ligne et le texte en dessous ») comme les rubriques de la page de garde — titre « INFORMATION » en Regular 8
  capitales souligné d'un filet noir (`livretDG.infoGarde`), à x 125.72 comme les libellés — : libellé en Light, tel que saisi (d'abord en gras), à x 125.72 souligné
  d'un filet jusqu'à x 485.5, texte en dessous à x 125.72 (repassé à la ligne à cette largeur, paragraphes gardés) ; ouvrages sous un libellé « Ouvrages », une ligne
  « code – description » chacun ; jamais de libellé seul en bas de page. Relecture du portrait
  (3 défauts confirmés sur 5, corrigés) : colonnes repérées par leur POSITION (ordre de ch02bCols, `K`), pas par leur titre ; colonne Localisation gardée ;
  lignes du descriptif plus réunies (retours à la ligne voulus gardés ; etaler recoupe seulement ce qui dépasse) ; niveau d'un montant lisible à la graisse
  (`r.cf`) : Montant — 4 chiffres Light, sous-total à 3 chiffres Regular ; Total — 2 chiffres Regular, 1 chiffre gras ; calculs Light. **« Base et commentaire de la position »
  retiré des Réglages (même jour)** : `displayComment` toujours vrai, « Commentaire dans colonne séparée » (libellé raccourci le même jour) seul choisit leur place ; « Afficher les positions saisies et les
  totalisateurs » regroupé dans « Seulement positions de 1 à 3 chiffres » (même jour : `displayNoTitlePositions` toujours vrai) (colonne ou sous la
  position).
  (Bloc 46, 07.11.2026, suite) Relecture contradictoire du 07.11 : 14 défauts confirmés sur 18, corrigés ;
  seconde relecture des corrections : le surplus d'une page trop pleine passe en tête de la page suivante de la même série (récapitulatif, document principal, page du total),
  pages complétées jusqu'en bas (zébrage) ; en « Assembler les descriptifs », une totalisatrice qui a son propre descriptif n'est pas ventilée.
  **Onglet « Paramètres » (07.11.2026, Paulo : « glisser Paramètres après Documents, sous forme de page comme Documents, pas une fenêtre ; l'ensemble des éléments par catégorie, le
  titre, dessous les éléments »)** : onglets Devis · Documents · Paramètres ; bouton « Paramètres » retiré de la barre ; lien « définir » de la Précision = onglet Paramètres,
  curseur dans la marge. `parPage` / `parChange` / `parIndice` (sg3_devis.js) : catégories de la fenêtre du moteur l'une sous l'autre (« Générale », ex-Information, renommée à la demande — date en tête, « Phase du
  devis » à la place de l'état du projet : liste des phases SIA 102 11 à 53 (`PH_SIA`), code dans `reglages.phaseSia`, nom écrit dans `etatProjet` → page de garde « Devis
  général - <phase> » et anciens modèles ; un état saisi avant qui n'est pas une phase n'est plus proposé dans la liste (« supprimer », même jour) : « — à définir — » jusqu'au choix d'une phase, l'ancien état reste dans le devis et sur sa page de garde tant qu'aucune phase n'est choisie —, marge d'approximation, indice, **date des plans** (même jour,
  « ajoute une cellule date des plans » : `reglages.datePlans` ; choisie → écrite en toutes lettres — « 26 février 2026 », « 1er mars » — dans le texte Information à la place de
  « [date à compléter] » ou de l'ancienne date des plans, `datePlansChange` ; effacée → « [date à compléter] » ; absente du texte → message ; reprise avec le texte par un nouveau
  devis du projet) ; « Etat de planification » retiré à la demande, valeur gardée dans le devis ; phrase d'aide de l'arrondi retirée ; Affichage — pourcentage (**« Pourcentage sur le total général » = réglage de base de tout nouveau devis**, 08.11.2026, Paulo : « définir en standard pour tous les devis », « comme base de tout devis, comme discuté plus haut » — enveloppe de `ch02dNewContent` ; modifiable par devis ; une copie garde le réglage de l'original ; devis existants inchangés), arrondi ; dernière section « Information » (Paulo : « voici ce que je souhaiterais écrire dans Information », page Information de son DG 24PRC) = les remarques préliminaires
  du devis (`E.remarques` {nom, texte}, mêmes données que Fonctions ▸ Remarques préliminaires, qui ouvrait cette section — entrée « Informations pour le devis » retirée du menu Fonctions le même soir, « supprimer ») : une ligne par remarque, libellé à gauche,
  texte à droite (hauteur selon le contenu ; une cellule par libellé : le libellé et les entrées sans libellé qui le suivent regroupés en un texte de plusieurs lignes,
  `remGroupes`, enregistrés ainsi à la première modification — le PDF imprime chaque ligne sur sa rangée, même page qu'avec une entrée par ligne), au graphisme des autres sections (libellé en gris comme leurs libellés, cadre au survol et en saisie ; texte dans un champ encadré ; filets entre les lignes ;
  pas les rangées grises du PDF, à la demande), ↑ ↓ × au survol (suppression confirmée si la ligne a du texte), « + Ajouter une ligne » ; lignes vides
  retirées à l'enregistrement (comme la fenêtre du moteur) ; ouvrages du devis en gris à la fin (ajoutés d'office par le PDF) ; **texte type** (Paulo, même jour, choix
  « texte type des nouveaux devis », texte de son DG 24PRC : `REM_TYPE`, `remType`) — Devis général / {ouvrage} (description du projet, sinon titre), réserves (prix des
  matières, inflation, autorités / MO, imprévus, expérience Substances), « plans datés du [date à compléter] », « (TVA {taux par défaut}%) », Réserve CFC 583, Subventions,
  trois cellules ; **nom de l'affaire automatique** (Paulo, même jour : « ce texte est automatique car il s'agit du nom de l'affaire ») : « Devis général | <désignation de
  l'affaire, `project.TITLE`> » n'est plus saisi — `reglages.infoAffaire` (posé à la création, par le texte type d'un devis vide ou à la première modification d'un devis reconnu),
  ajouté à l'impression (`remImpr` : PDF du devis général, ancien livret par l'enveloppe de `ch02bBook`, documents Honoraires / Devis descriptif par celle de `ch02cRender`),
  première ligne fixe de la cellule « Devis général » (même texte que les cellules : 13 px, noir, aligné sur leur texte ; d'abord en gras bleu nuit, changé à la demande),
  texte modifiable dessous ; **trait sous le titre** (même jour, « ajouter un trait sous le titre du
  projet ») automatique aussi : filet noir sous le nom dans la page, ligne de tirets du modèle 24PRC (`TRAIT`) imprimée sous le nom ; une ligne de tirets saisie juste après le
  nom est retirée du texte modifiable et du texte type (`sansTrait`) ; devis plus ancien dont la 1re remarque est « Devis général » suivie de la
  désignation ou de la description de l'affaire : reconnu (`remAuto`), imprimé et affiché de même, converti à la première modification —
  posé à la création d'un devis sans remarques (enveloppe de `ch02dCommit` ; une copie garde les remarques de l'original), **repris du projet** (Paulo, même jour :
  « conserver ce texte type pour tous les projets, celui-ci peut être modifié par projet », choix « repris du projet ») : un nouveau devis reprend le texte du dernier devis du
  même projet qui en a un (`remProjet` : date de modification puis numéro, corbeille exclue, nom de l'affaire automatique compris), le texte type du bureau seulement pour le
  premier devis d'un projet ; **texte de base** (Paulo, même soir : « voici le texte que le devis doit avoir à la création de devis ; ce texte peut être adapté pour chaque
  devis et projet, mais c'est le texte de base » ; `REM_TYPE` = ce texte) : seul un texte tenu dans l'app est repris (`remSg` : `reglages.infoSg` — posé à la création et
  quand le TEXTE change dans les Paramètres (`remCanon` : texte tel qu'affiché, une cellule par libellé ; pas pour une ligne vide ajoutée puis retirée, ni pour la seule date
  des plans), texte type inséré, date écrite dans le texte —, ou devis créé dans l'app avant ce drapeau : `infoAffaire` + `indiceIcc`) ; le plus récemment adapté d'abord
  (`reglages.infoSgLe`, sinon date du devis) ; texte vidé non repris ; lignes modèles « [...] … » écartées (`remModele`) ; les textes des devis venus de l'ancien logiciel ne sont jamais repris (variantes, phrases propres à un ancien devis, « [...] Information sur niveau de
  précision ») : un nouveau devis de ces projets reçoit le texte de base. Un « Devis provisoire » vide de 99TST (base de l'aperçu de Paulo, supprimé) avait été créé avec une
  version plus ancienne de la page (ni titres, ni indice, ni texte) ; création réelle vérifiée le 07.11.2026 (22MFO, 19BBS, 24PRC, 99TST, ROZ-R1E : texte de base ; texte
  adapté dans l'app repris par le devis suivant du même projet ; relecture contradictoire : 6 défauts confirmés, corrigés). « Phase du devis » : ancien état comparé sans
  tenir compte des apostrophes ni des espaces (`phDe` + `normTxt` : « Projet de l'ouvrage » des anciens devis = 32) ; chaque devis reste modifiable pour lui seul, un devis existant n'est jamais modifié ; bouton « Insérer le texte type » pour un devis
  existant (à la suite, confirmation s'il y a déjà des lignes) — retiré le même soir (« supprimer » ; code `remAction` 'type' gardé, plus appelé), ainsi que le texte d'aide gris sous « + Ajouter une ligne » ; textes libres 1 à 5 et « Commentaire » retirés
  de la page, valeurs gardées dans le devis ; « Titres » retiré à la
  demande : les titres des documents — page de garde, 1 chiffre, 2 chiffres, document principal — prennent le nom de la version du devis à sa création, enveloppe de
  `ch02dCommit` : en-tête et contenu créés ensemble, nouveau devis, Dupliquer, Dupliquer et modifier, import ; devis existants : titres inchangés ; un champ modifié dans
  l'onglet ne réécrit plus les titres par défaut), un titre et une phrase d'aide par champ ; même enregistrement que la fenêtre (`ch02aPrefInit`,
  `ch02aPrefApply`, `X.touch`) à chaque champ modifié (change, Entrée), arrondi changé → lignes recalculées (message) ; sans droit (`ecrit()` et `ch02aCanEdit`) : champs grisés ;
  page redessinée quand les valeurs enregistrées diffèrent de celles affichées (signature `parSig`, posée avant chaque enregistrement fait dans l'onglet : le curseur et le clic
  suivant ne sont jamais perdus ; un conflit 409 ou un autre poste redessine la page, le champ qui avait le curseur le garde) ; « Arrondi » demande confirmation (recalcule le TTC de
  toutes les lignes de calcul) ; en plein écran, les onglets Documents et Paramètres gardent le bouton de sortie. La fenêtre du moteur (`ch02aSettings`) reste, plus appelée par SUBGestion 3.
  **Indice des prix de la construction automatique (07.11.2026, bloc 47, `subgestion3/sg3_icc.js`, concaténé en dernier ; Paulo : « un indice que tu mets à jour toi
  automatiquement, que je ne souhaite pas modifier manuellement ; qu'il se mette à jour lors de la création du devis et que tu indiques sur la base de quel indice avec l'année »)** :
  Indice suisse des prix de la construction de l'OFS, région lémanique (VD, VS, GE), bâtiment — tableau `cc-t-05.05.01` (« Évolution des prix de la construction (multibases),
  valeurs par grande région et par type d'objet », codes `<REG_02>` / `<OBJ_03>`, une feuille par base : 1998, 2010, 2015, 2020, 2025 = 100), publié en juin (valeurs d'avril) et
  en décembre (valeurs d'octobre). Lu sur `https://dam-api.bfs.admin.ch/hub/api/dam/assets?orderNr=cc-t-05.05.01` puis `/assets/<id>/master` (accès ouvert depuis une page
  web, aussi en file:// ; xlsx décompressé par `dezip` + `DecompressionStream`, lu par `lireXlsx`), 15 s après le démarrage puis tous les 3 jours, fichier téléchargé seulement si
  l'OFS en a publié un nouveau ; copie dans le navigateur (`localStorage` `sg3_icc`) ; valeurs intégrées `ICC_INT` (tableau du 18.06.2026, jusqu'à avril 2026 : 100.3 en base
  octobre 2025, 116.1 en base octobre 2020) si l'OFS est injoignable. Création d'un devis (`ch02dNewContent`, `ch02dCopy` : nouveau, Dupliquer, Dupliquer et modifier, import) :
  dernière valeur publiée dans la base la plus récente → `reglages.indiceIcc` {v, p (AAAA-04|10), base, le, serie} et `reglages.indice` (valeur lue par les anciens modèles,
  `constructionIndex`). Devis créé avant : indice d'après la date du devis (`ch02aDate`), base en vigueur à cette date (base B dès juin B+1) et dernière publication à cette date
  (avril → 20 juin, octobre → 20 décembre), rien n'est écrit. Jamais saisi : Paramètres ▸ Indice en lecture seule (valeur, « avril 2026, base octobre 2025 = 100 », série,
  origine, source) ; fenêtre du moteur : champ en lecture seule ; `ch02aPrefApply` remet toujours l'indice calculé. `nas/nettoyer.py` : `dam-api.bfs.admin.ch` admis.
  Relecture du même jour : relecture aussi toutes les 6 heures (app restée ouverte), toutes les 6 heures au lieu de 3 jours quand une publication est attendue
  (`attendu()`), et juste avant la création d'un devis (enveloppe de `ch02dHeadDialog`, attendue au plus 4 s après OK) ; fichier relu aussi si l'OFS l'a remplacé sous le même
  numéro (`bfs.lastUpdatedVersion`, `maj`) ou si la lecture a changé (`ICC_FMT`) ; la source affichée est la publication d'où vient l'indice enregistré (`indiceIcc.src`).
  DeltaSub.html seul : champ manuel d'origine. Débogage `window.SGICC` (`actuel()`, `a(date)`, `devis(E,doc)`, `rafraichir(true)`).
- **Documents des estimations (05.11.2026, bloc 38, `subgestion3/sg3_estimation.js`, concaténé en dernier ; Paulo : « dans Détermination des coûts - Estimation avant-projet (2) il n'est pas possible de créer un fichier pdf du document »)** :
  le lot 4 n'avait jamais été construit (`ec4SectionDocuments`, `ec4PrintOld`, `ec4PrintRefQuantities` n'existaient pas ; le moteur les appelle par leur nom, `ecExt`). Ils sont définis ici, DeltaSub.html inchangé. Calcul des coûts ▸ ELEMENTS ▸ Documents : ligne « Estimation des coûts »
  (état, Ouvrir / Créer le document, Créer le PDF, Ouvrir le PDF, Réglages ▾ — options du cahier des charges dans `P.impressionDoc`, par estimation —, Supprimer ▾), puis Fichiers PDF (zone du moteur, dossier `Construction/Costplanning/<P>/<D>/documents/archive`). Document = copie du modèle
  `costPlanningDocument`, collection propre **`sgestimdoc`** (ID `<document>/element`, `doc:null` = effacé, dans `HEAVY`), préparée par `ch02cPrep`, remplie ici, puis `svDpHTML` : papier des contrats et PDF sans serveur par le bloc 31. Consulter n'écrit rien ; « Créer le PDF » ne crée le document qu'après
  confirmation du nom. Page de garde + 7 tableaux (Grandeurs référentielles, Vue d'ensemble, Eléments, Descriptif, CFC, Chiffres-clés, Ecologie), avec les fonctions de l'écran (`ecaOverview`, `ecqQrRows`, `ecqCostPerQ`, `ecqVolumeRows`, `ecqKfRows`, `ecGv`) ; seule la liste CFC détaillée est recomposée
  (`ec4Kag`, mêmes règles que `ecBooked`, total = `res.cfc.total`). Porte sur la liste filtrée de l'éditeur (filtre signalé sur le document et sous la ligne). Arrondi 1 / 100 / 1000 : Vue d'ensemble et Eléments seulement (`D.rd`), reste sur le calcul exact. Montants en rouge (bloc 31) ; pourcentages, volumes,
  chiffres-clés et valeurs écologiques en noir (`sansRouge`). Section sans donnée non imprimée. Écarts voulus à l'original : sections Ecologie et Descriptif masquées sans données, champ Filtre rempli, colonnes Ouv. / SE / Comp. retirées si vides, libellé « Total » de la liste CFC, élément éventuel retiré si l'option est décochée,
  arrondi corrigé pour les montants négatifs. Reste à faire (hors périmètre, messages du moteur inchangés) : `ec4CreateEstimate`, `ec4ExportSia451`, `ec4ExportFiles`, `ec4ImportSia451`, `ec4ObjectData`. Limites : k4 et k5 de la vue d'ensemble, images et lignes CAN non traités ; duplication et suppression d'une estimation ne suivent pas `sgestimdoc`
  (orphelin sans effet) ; `sgestimdoc` absent de `SG_T_CHANTIER` (côté NAS, l'écriture suit « projet modifiable », le droit chantier n'est contrôlé que dans l'app). Styles `#sgec-css`, débogage `window.SGEC`. Copie d'avant : `subgestion3/_backup_20261105_avant_documents_estimation/`, `SUBGestion3_backup_20261105_avant_documents_estimation.html`.
  **Essai du 06.11.2026 sur un NAS local (page nettoyée, `serveur_deltasub.py`, mot de passe et profils)** : mode bureau, fichiers sur le serveur, `sgestimdoc` filtré par périmètre (document d'un projet hors périmètre non servi). Chef de projet : document et PDF sur ses projets. Collaborateur (« chantier : lecture », « documents : dépôt ») : consulte le document, peut créer le PDF (dépôt, accepté par le serveur), ne crée pas le document et n'a pas les réglages (grisés depuis ce jour, le serveur les refusait en 403).
  **Descriptifs & devis, même jour** : ligne d'un document (`docsLignes`, sg3_devis.js) : état et « Ouvrir le PDF » tiennent compte du PDF créé par « Créer le PDF » (dossier `archive`, nom proposé, `pdfLigne`) ; le moteur ne connaît que le PDF officiel `documents/<genre>.pdf`, la ligne restait « sans PDF » juste après la création. Règles du moteur (`ch02cPdfHas`) inchangées.
- **Contrôle des coûts au graphisme des devis (bloc 50, `subgestion3/sg3_coco.js`, concaténé en dernier par `construire.py`)** — **Liste** (écrite le
  09.11.2026, Paulo : « corriger le design de la liste, reprend le principe de devis » ; restée hors de l'app jusqu'au 10.11.2026 : `window.VIEWS` / `window.VIEW` sont
  des `const` / `let` du moteur, pas des propriétés de window — le bloc s'arrêtait d'office ; tests remplacés par `typeof VIEWS` / `typeof VIEW`) : page du projet ▸
  Contrôle des coûts (`ccDomain`) et liste de tous les projets (`VIEWS.coco` sans document ouvert) = page `SGSV.outils.monter` comme les devis (bandeau, chiffres,
  statuts, recherche, tableau Variante / N° / Statut / Remarque / Coût probable TTC / État du coût TTC / Modifié / Par ; clic = ouvrir, clic droit = en-tête,
  dupliquer, supprimer). **Éditeur ouvert (10.11.2026, Paulo : « modifier la présentation comme pour le devis, ajouter les documents dans la barre du haut, etc. »)** :
  `ccEditor` enveloppé (`habillerEd`), éléments du moteur déplacés tels quels — bandeau jaune (numéro, statut, variante, désignation, maître de l'ouvrage, version,
  modification ; « ‹ Contrôles du projet » = page du projet ▸ Contrôle des coûts), chiffres (Devis général, Mutations, DG révisé, Contrats + avenants, Paiements,
  Coût probable, État du coût — TTC, une rangée ; état du coût rouge si dépassement, vert si économie), **onglets = sections du moteur** (menu de gauche masqué, ses
  éléments servent toujours : un onglet clique l'élément) **puis Documents** : choix sous les onglets « Fichiers déposés » (`ccDocsDraw`) et les documents de chaque
  section (`ch01aDocNode`) ; chaque document (panneau `ch01aPanel`) en ligne comme l'onglet Documents du devis — titre, état (Pas encore créé / Document créé),
  actions Ouvrir ou Créer le document, Créer le PDF, Renommer…, Supprimer le document (celles du menu « Document » du moteur), puis ses fichiers PDF (`decoDocs`,
  refait quand un panneau se redessine). Barre : Nouvelle écriture, Présentation (sans « 1 à 3 chiffres »), **CFC Tout · 3 · 2 · 1** (Contrôle du coût et Devis
  général ; `sg3_coco_niv` ; copie, CSV et impression du tableau = lignes affichées, `tableText` filtré le temps de l'appel), Imprimer ▾ (tableau A4 paysage,
  documents de la section, fichiers déposés), légende des couleurs des écritures (avec « Afficher les détails »), Paramètres, Fonctions ▾ (éditer, supprimer,
  copier, exporter, enregistrer), plein écran (Échap). Tableau au graphisme du devis : CFC à 1 chiffre sur trame bleu nuit pâle, 1re et 2e colonnes fixes au
  défilement horizontal, total général encadré ; clic droit sur une ligne = Éditer / Supprimer l'écriture (lignes de détail ; toutes les lignes des autres
  sections), Nouvelle écriture ▸ ; ↑ ↓ Entrée. Classes `sgce-*` (liste : `sgcc-*`), `window.SGCC` (`SGCC.ed` = état de l'éditeur). DeltaSub.html seul garde ses écrans.
  **Colonnes du contrôle du coût = celles de Deltaproject (10.11.2026, Paulo : « dans le contrôle du coût reprends les colonnes identiques à Deltaproject », choix
  « Standard de l'ancien logiciel »)** — moteur `DeltaSub.html` (v1, v2, v3 reconstruites) : **colonne CFC fixe et toujours la première** (Deltaproject ne la met
  pas dans ses présentations : les présentations reprises ne l'avaient pas) ; **présentation par défaut de tous les contrôles des coûts = « Standard » de
  Deltaproject** (manuel ▸ Contrôle des coûts ▸ Disposition des colonnes ; titres de `rsrc/deltaproject/costcontrol/data/strings/CostColumns.rtf`) : CFC,
  Désignation, Entreprise, DG TTC, Transferts TTC, Variations TTC, DG rév. TTC, Contrats + avenants TTC, Paiements TTC, Coût probable TTC, Etat du coût TTC
  (`CC_PRES_DEF.Standard`, titres standards `CC_COL` — les titres propres du document, `titresColonnes`, ne valent que pour ses présentations) ; les présentations
  du document restent dans « Présentation » (« Standard (du document) » si le nom est le même ; celle d'un document créé dans l'app, identique, n'est pas répétée) ;
  `CCV.pres` = rang de la présentation du document choisie, null = Standard. L'impression du document « Contrôle du coût » (`ch01aFlex`) suit toujours la
  présentation favorite du document. Colonnes inconnues du moteur encore écartées : OUV (`og`), équations (`equ1`…), DG indexé (`kvTotInclFac`), montants par m² /
  m³, contrat/DG rév. − paiements (`contractKvMinusAccordPayment`). Copie d'avant : `DeltaSub_backup_20261110_1810_avant_colonne_cfc.html`. Liste : « -0.00 » évité,
  rendu même sans contrôle des coûts dans la base (relecture du 10.11.2026).
  **Ordre fixe, plus de tri par les titres de colonnes (10.11.2026, Paulo : « pas possible de changer la liste, celle-ci ne doit pas être modifiable, supprimer
  l'organisation des colonnes » ; puis pour le devis : « supprimer la possibilité de modifier l'organisation du devis, les CFC doivent rester dans l'ordre »)** :
  option `noSort` de `grid` (DeltaSub.html : clic sur un titre sans effet, curseur normal, tri mémorisé ignoré), posée sur le tableau CFC du contrôle du coût
  (sections Contrôle du coût et Devis général) et sur le tableau des positions du devis (`ch02aDraw`, toutes les présentations ; avant, seulement « avec le calcul de
  prix »). Les listes (mutations, adjudications, paiements…) gardent leur tri. Copie d'avant : `DeltaSub_backup_20261110_1840_avant_tri_fixe.html`.
  **Fenêtres des écritures = proposition B « Tableur » (10.11.2026, bloc 51, `subgestion3/sg3_ecritures.js`, concaténé après `sg3_coco.js` ; Paulo : « proposer un
  autre graphisme pour correspondre à la section devis, fais 5 propositions » — paiement, situation sur contrat, mutation —, puis « version B » ; maquettes A étapes,
  B tableur, C décompte, D rubriques, E chiffres et onglets : `subgestion3/_backup_20261110_maquette_ecritures/`)** : `ccPayment` (situation, paiement hors contrat),
  `ccContract` (contrat, avenant), `ccMut` (transfert, variation, renchérissement) et `ccEntry` (provision, coût probable perso) enveloppés ; mêmes champs, contrôles et
  enregistrement (le moteur garde tout ; éléments déplacés tels quels ; `linesGrid` / `condTable` remplacés le temps de la construction pour repérer le document et ses
  tableaux). Même mise en page que la fenêtre « Calcul pour <CFC> » du devis : bandeau jaune (numéro en grand, filet, « Paiement n° 19 · Situation · débité », entreprise,
  lot · contrat · facture ; total net TTC en grand à droite, « dont TVA »), réglages dans une bande grise (libellés au-dessus des champs : entreprise, lot, n°, genre,
  statut, facture, dates, dernier paiement ; contrat : désignation, date, délai de garantie, contrat prioritaire), une seule barre (Position, Condition, TVA, Arrondi,
  Paiements à ce jour, Effacer la ligne, Saisie du brut | du net) avec la cellule active à droite (L<n> · colonne · contenu), tableaux de tableur (lignes numérotées à la
  suite d'un tableau à l'autre, cellule active encadrée de bleu nuit, ligne active en jaune, cases calculées sur fond gris, total en pied ; bouton « − » des lignes
  retiré, gardé pour « Effacer la ligne » ; conditions : titres en clair — Niv., Réf., Taux, Appl. —, lettre de l'ancien logiciel retirée, colonne **Sous-total** = brut
  des positions + conditions jusqu'à ce niveau), pied (commentaire, description, annexes ; brut des positions, conditions hors TVA, net HT, TVA, net TTC, « montant
  enregistré » s'il diffère). Mutation et provision : grille Sens | CFC | Entreprise | Montant HT | TVA | Montant TVA | Montant TTC — transfert : origine (−, calculée) et
  destination (+, saisie), « Effet sur le devis général révisé » au pied (0.00 ; variation : + le montant) ; barre « Choisir l’entreprise », « Aucune entreprise » (ligne du
  curseur). Clavier : le moteur redessine ses tableaux à chaque modification — Tab, Entrée (ligne suivante), ↑ ↓ et le clic gardent la cellule visée ; Échap rétablit la
  saisie en cours, sinon ferme la fenêtre comme avant. Vérifié sur 99TST (situation n° 19, contrat, avenant, paiement hors contrat, mutations, provision, coût probable,
  créations ; Annuler ne modifie rien, OK enregistre). DeltaSub.html seul garde ses fenêtres. Classes `sgew-*`, `<style id="sgew-css">`, débogage `window.SGEW`.
- **Documents du contrôle des coûts au graphisme du devis (10.11.2026, bloc 52, `subgestion3/sg3_coco_docs.js`, concaténé en dernier ; Paulo, document « Contrôle
  des coûts » ouvert : « créer le même visuel que pour devis, fenêtre identique et document également, adapte les options du volet à droite » ; choix : colonnes
  Standard comme l'écran, paysage par défaut, état du coût rouge / vert, listes aussi redessinées)** :
  **Fenêtre** : `vueDoc` du devis devenue `vueDocG(D,cfg)` (sg3_devis.js, exportée `SGDE.vue`, avec `SGDE.cssD` et `SGDE.livret` = constantes DG_*, `deGardeRub`) ;
  `vueDoc` (devis) n'en est qu'un adaptateur — fenêtre identique, vérifiée sur les trois documents du devis. `cfg` = {p, lb, titre, etat, peut(), items(), rendre(), pied,
  groupes, groupe, rang, retrait, actions [{t, ico, fn}], installer} ; réglage `asy` (enregistre lui-même ; fn rend false = pas de dessin tout de suite) ; réglages au
  même `seg` = bouton segmenté ; option `dis` d'un bouton segmenté grisée. `ch01aOpen` enveloppé : TOUS les documents ouverts depuis Contrôle des coûts ▸ Documents
  (bouton principal, Ouvrir, après création, bons de paiement, arrêtés de compte) ont cette fenêtre (bandeau « Contrôle des coûts · Documents », état = statut du
  contrôle des coûts `CC_STATE`, Imprimer, PDF ▾, Partager ▾, lecteur de l'app, volet Réglages, pied « Enregistrés dans le document ») ; « Modifier les textes… » en
  bouton d'en-tête pour les lettres. Lecture seule : sans « chantier : écriture » ou contrôle verrouillé (`ch03dLecture`).
  **Documents redessinés** (`ch01aRender` enveloppé → page repérée dont le PDF est fait ici, comme le devis général : même PDF pour la fenêtre, « Créer le PDF »,
  « Sauvegarder et ouvrir », « Partager » — vérifié à l'octet) : « Contrôle des coûts » (`ovOctets` : page de garde éditoriale avec signatures, page « Centres de coût »
  HT / TVA / TTC, récapitulatif CFC à 1 chiffre toujours, à 2 chiffres sur demande, contrôle du coût détaillé — positions, entreprises (nom dans la désignation),
  écritures en italique gris derrière un filet comme les lignes de calcul du devis, sans le signe « > » —, colonnes de la présentation Standard par défaut, titres
  sans « TTC » quand tous le sont (« Désignation · montants TTC ») et abrégés s'ils ne tiennent pas, colonne « État du coût » en rouge #BD1E42 si dépassement / vert
  #4E6B0F si économie, `r.cc` de `contenuLivret`), « Devis général » du contrôle (`kvOctets`, portrait par défaut, récapitulatif, devis, Montant HT / TVA / TTC / %,
  OUV et Loc. avec les subdivisions, DG indexé sur demande si facteur ≠ 1), listes des contrats et avenants, des mutations, des paiements, compte d'entreprise, liste
  des garanties (`listeOctets` : tableaux du modèle mis en texte par le bloc 31 — `SGIMP.preparer` —, largeurs d'après le contenu, total sur bande bleu nuit, page de
  garde sans signatures ; échec → PDF du bloc 31). Données = jobs du moteur sur une copie de travail (présentation choisie, propriétés des tableaux réglées par le
  volet) : rien n'est écrit dans le contrôle des coûts. Mots coupés de l'ancien logiciel recollés (« inté- rieures »). Lettres (contrat, avenant, mutation, bons,
  ordre, arrêté) : rendu du bloc 31 inchangé.
  **Réglages** : `cocodoc.options.sgPdf` du document (`optsDe` / `optsSet` : gardés en mémoire pendant l'envoi, envois à la suite, refus → message et retour) ;
  Contrôle des coûts : Format (portrait grisé au-delà de 5 colonnes de montants), Colonnes (Standard · présentations du document), Parties (page de garde, centres de
  coût, récapitulatif à 2 chiffres, contrôle détaillé), Positions (CFC Tout · 3 · 2 · 1, entreprises, subdivisions par ouvrage), Écritures (case principale, puis
  mutations, contrats et avenants, paiements, provisions et coût probable — défaut : détails de la présentation favorite —, date et n° des mutations, date de facture,
  dernier paiement « + ») ; Devis général : Format, Parties, Positions, Montants (sans décimales, pourcentages sur le total, DG indexé) ; listes : Format, page de
  garde ; réglages existants à leur place d'origine : tri et récapitulatif TVA des paiements (`ch01dSetOpt` + `E.touch`), tri et adresses des garanties
  (`ch01cSetPref`), arrondis des lettres (`cocodoc.options` de la section, comme la roue `ch01aGear`). Débogage `window.SGCD`. Essais (99TST, base de travail) :
  6 documents créés et ouverts, réglages, aucune écriture à l'ouverture, « Créer le PDF » identique, lecture seule, balayage 119 écrans. Relecture contradictoire
  (workflow, 5 défauts confirmés et une quinzaine signalés, corrigés) : compte d'entreprise — entreprise en rubrique de la page de garde et dans l'en-tête
  (« Entreprise · <nom> », `entDe`) ; rapport des paiements filtré — « Filtre : … » sur la page de garde, « Filtré » dans l'en-tête, maître de l'ouvrage des ouvrages
  filtrés (`filtreDe`) ; réglages du moteur (tri, TVA, garanties) par `moteurSet` — version du contrôle lue à l'ouverture, modifié ailleurs ou enregistrement non
  retrouvé → fenêtre fermée et message ; réglages du document en attente par clés (`PP`, `envoi` : envois à la suite sur la version la plus récente, refus → retour de
  la seule clé) ; arrondis seulement pour les documents qui les lisent (`ARR_TYPES` : contrat, avenant, bons, arrêté — pas l'ordre de paiement), état en attente
  affiché aussitôt (`PA`) ; Devis général : défauts du moteur (`ch01aKvPref` : pourcentages sur le total, sans décimales), désignation d'au moins 150 pt, subdivisions
  du récapitulatif = modèle ; défauts tirés de la présentation choisie et des propriétés du modèle ; présentation enregistrée par nom et rang, « Standard » du document
  identique non répétée ; colonnes nombreuses (15+) : désignation ≥ 120 pt ; « Récapitulatif · montants TTC » ; marque du dernier paiement selon la présentation
  (« FF ») et montant ainsi marqué réduit plutôt que coupé ; adresses des garanties sur leurs lignes ; « pré- et post-… » non recollé ; échec du nouveau dessin →
  PDF du bloc 31 ; rappel d'un réglage sans effet après la fermeture de la fenêtre. Copies d'avant :
  `subgestion3/_backup_20261110_2144_avant_documents_coco/`, `SUBGestion3_backup_20261110_2144_avant_documents_coco.html`.
- **Surfaces et volumes (10.11.2026, bloc 49, `subgestion3/sg3_surfaces.js`, concaténé en dernier ; Paulo : « le volume doit être entré quelque part dans
  le logiciel dans un module de calcul de surface et volume, ajoute ce module dans Projet et ajoute uniquement le volume pour l'affaire 99TST ; on regardera
  ensemble comment créer le module de calcul de surface et volume, pour réaliser des métrés »)** : page du projet ▸ Projet ▸ tuile « Surfaces et volumes »
  (icône `NXI.volume`, première de la 2e ligne avant Estimations : `SG_TUILE_BR`), compteur « VB 12'000 m³ » / « Volume à saisir ». Première étape : volume bâti
  (VB) SIA 416 seulement — surfaces SIA 416, calcul des volumes et métrés à concevoir avec Paulo. Collection propre **`sgsurfaces`** {ID = ID du projet,
  PROJECT_ID, VB (m³), MODIFIE, PAR} (gardée par les reprises ; NAS : règle « projet modifiable » par PROJECT_ID) ; sans valeur saisie, le volume des
  caractéristiques de l'affaire (`project.VOLUME`, ancien logiciel, remplacé à chaque reprise) est repris et signalé. `window.sgVolumeSIA416(p)` pour le devis
  général. Droits : écriture = projet modifiable. 99TST : VB 12'000 m³ (volume de sa référence, `REF.volume`, aussi dans le générateur : module 90). Prix au m³ des
  récapitulatifs du devis général (même jour, **variante 1 « Liste »** choisie par Paulo parmi 4 — maquette `subgestion3/_backup_20261110_maquette_recap/proposition_chiffres.js`
  — puis « déplacer » juste au-dessus du tableau ; « ne pas intégrer dans le tableau ») : sur la PREMIÈRE page du récapitulatif CFC à 1 chiffre (d'abord aussi sur celui à 2 chiffres ;
  jamais le document principal), trois lignes au-dessus de la bande bleu nuit — Volume SIA 416 (m³), Prix au m³ SIA 416, CFC 2, Prix au m³ SIA 416, CFC 1
  à 9 (CHF/m³ TTC ou HT selon le titre de la colonne « à 1 chiffre ») ; prix = totaux des CFC à 1 chiffre du devis ÷ volume (`CHIF` dans `dgOctets`, sg3_devis.js,
  lus avant le retrait des colonnes vides ; le CFC 0 n'entre pas dans « 1 à 9 ») ; sans volume (`sgVolumeSIA416` = 0) : rien. Dessin (`pg.chiffres` = [[repère, libellé, valeur, unité]], `tableau`
  de sg3_docsub.js) = **variante 5 « Dans la grille du tableau »**, choisie par Paulo parmi 5 propositions inspirées de la page de garde (« améliore l'intégration »
  puis « propose-moi 5 variantes, inspire-toi aussi de la page de garde » ; maquette `subgestion3/_backup_20261110_maquette_recap/proposition_chiffres2.js` : 1 rubriques
  de la garde, 2 grands chiffres, 3 titre gras et filet noir, 4 ligne d'état à carrés, 5 grille) : rangées de 15 pt dans les colonnes du tableau — repères VB, 2, 1–9
  en bleu nuit Regular 8 dans la colonne CFC, libellés Light 8 « Volume SIA 416 », « Prix au m³ SIA 416 » à la colonne Texte, valeur Regular 8 sur la colonne « à 1
  chiffre » (paysage x 712.3, portrait 484.7), unité Light 7,5 grise dans la colonne [%], les unités alignées à gauche les unes sous les autres, la plus longue finissant au bord droit de la colonne
  (« ajuster m³ à gauche de CHF », même jour) (« m³ », « CHF/m³ » ; en portrait « CHF/m³ » n'y tient pas :
  « CHF », le libellé dit « au m³ » ; TTC ou HT = titre de la colonne « à 1 chiffre ») ; filet bleu nuit 0,75 au-dessus du bloc, filet gris 0,5 sous chaque rangée,
  sur toute la largeur du tableau ; dernière ligne de base à `ECART` (20,77 pt) du haut de la bande. Versions d'avant du même jour : libellés en capitales 7,5 et
  valeur 9 suivie de l'unité (« M³ » en capitales), puis rangées sans repère avec l'unité après le libellé ; **case « Volume SIA 416 et prix au m³ »** (Paulo, même jour : « ajouter une option dans Affichage pour afficher VB et prix / m³ ») dans Réglages ▸ Affichage du PDF
  et le menu Réglages de la ligne (`DG_MENU` `sgChiffres`, `DG_PRESET` : cochée ; enregistrée dans `dgPdf`) : décochée, aucun chiffre clé ; grisée et décochée sans
  volume dans Surfaces et volumes ; le bloc suit le tableau descendu sur le logo (`pg.dy`) ; à la répartition, la première page d'un récapitulatif garde la place du bloc (`capChif` : bande jamais au-dessus
  de 101 + 20,77 + 2 × 15 pt). 99TST : 12'000 m³, 293.80 et 317.31 CHF/m³ TTC.
- **Veille retirée de SUBGestion 3 (05.11.2026, Paulo : « supprimer de toute l'app, icône pas nécessaire »)** : plus de bouton lune dans les documents ouverts (devis, contrôle des coûts, estimations, soumission), `ch10dIsDoc` neutralisée dans `sg3.js`, `ch10dStart` sans effet ; la barre vide au-dessus du document disparaît. DeltaSub.html, v1 et v2 inchangés.
- **Fenêtre « Editer l'article » au graphisme de l'app (04.11.2026, `sg3_soumission.js`, `habArticle`, Paulo : « améliorer la fenêtre, pour adapter le design au reste de l'app »)** : `svdEditArticle`
  enveloppé, DeltaSub.html inchangé ; éléments du moteur déplacés tels quels (gestionnaires, contrôles et enregistrement inchangés). Bandeau jaune `sgfh-tete` (numéro de l'article, étape, chapitre, mot-clé tenu à jour),
  champs Mot-clé et Unité à libellé au-dessus, options, onglets soulignés (`.sgsa-tabs`), barre en texte, tableau des quantités à filet noir aux titres en clair (`TH_QP` : Code calc., Rem. prix, Genre Q., Genre P., N° courant,
  Prix unitaire ; `MutationObserver` sur le contenu : le moteur redessine le tableau) ; colonnes Code calc., Rem. prix et N° courant masquées si vides, elles reviennent dès qu'une ligne a une valeur (menu Fonctions). Styles `.sgsa-*`.
  Les autres fenêtres de la soumission (Prix, Conditions, Quantités, métré) gardent le graphisme du moteur. Copie d'avant : `subgestion3/_backup_20261104_avant_fenetre_article/`.
- **Comparatif ▸ Éditer : entreprises en colonnes ou en lignes, prix saisis dans le tableau (06.11.2026, bloc 39, `subgestion3/sg3_comparatif.js`, concaténé en dernier ; Paulo : « dans comparatif éditer je souhaite que les
  entreprises soient indiquées par colonne et par ligne », « les montants des articles je souhaite pouvoir le faire directement dans le fichier affiché sans avoir besoin d'entrer les données dans une fenêtre qui s'ouvre »)** : moteur inchangé,
  DeltaSub.html seul garde son écran (`svdBuildRows`, `svdColumns`, `svdTableHtml`, `svcRows`, `svcEdit`, `svcDescMenus`, `svEdRefresh` enveloppés). Choix « Affichage : En colonnes · En lignes » dans la barre (par poste, `sg3_cmp_ent`, colonnes d'office).
  En colonnes : un article par ligne, Prix unitaire + Montant par entreprise, en-tête à deux étages (nom en vert et (+) = proposée, clic = entreprise courante), Art. et Description fixes au défilement horizontal, 3 entreprises sans défilement à 1440 px ;
  copie et CSV suivent la vue (colonnes « entreprise · Prix unitaire »). Les deux vues : total de chaque chapitre par entreprise (le moteur affichait 0.00). Prix unitaire = un champ dans chaque case : Tab = entreprise suivante, Entrée / ↓ = article suivant,
  ↑ = précédent, Échap = valeur d'avant, I = compris dans l'offre, N = non compris (aussi au clic droit), vide = pas de prix ; le montant se calcule (pas de saisie du montant). Mêmes règles que la fenêtre « Prix » (qui reste, seule à changer une quantité) :
  pas de champ en lecture seule, sans droit de modifier, ni pour un prix fixé par le concepteur (`svcSync` le réécrirait) ; « Prix identique » ; 999'999'999 au plus. Plusieurs cellules collées d'un tableur : refusées (`RX_PRIX`). Enregistrement sans redessiner : mémoire, cases et pied mis à jour sur place (`maj`, `pied`), `X.commit` de tout le
  contenu, un seul envoi à la fois, ce qui arrive pendant un envoi part juste après (`enregistrer`, `envoyer`, `VOL`) ; `X.commit`, `svClose`, `svSaveAll` attendent la fin de l'envoi (sinon faux conflit 409) ; `svEdRefresh` aussi (un relevé du serveur rechargerait le contenu pendant la
  saisie). Journal des saisies non confirmées `VOL.jour` : conflit → le moteur relit, les saisies sont reposées dessus puis renvoyées (3 essais) ; 401 → elles restent à l'écran et partent après la reconnexion (`apresReconnexion`, `CH08D.exp`) ; 403 → retirées ; réseau coupé → gardées en mémoire, repartent à la
  saisie suivante. Un redessin venu d'ailleurs garde le texte et le curseur de la case sans rien enregistrer (`surRedraw`, `ETAT.garde`) : jamais un nombre à moitié tapé. Rang (Paulo : « toujours déplacer le 1 en premier et suivi du 2, 3 et 4 ») : tableau du pied, colonnes, lignes et totaux dans l'ordre des documents (`svbSorted` : tri automatique sur le net, ou ordre manuel de « Affichage et tri »), `enOrdre` ; le pied se réordonne aussitôt, les colonnes et les lignes au dessin suivant (`ETAT.rendu`, `ETAT.fige`). En lignes, colonnes Prix unitaire et Montant toujours présentes. Largeur des colonnes d'après le contenu (à la prochaine mise en page).
  ⚠ Classes `sgcp-*` : `sgc-` est pris par le Contrôle des heures et `col` par le moteur (`.col` = display:flex, le tableau perdait ses colonnes). Styles `#sgcp-css`, débogage `window.SGCP`. Essayé en mode bureau sur un serveur
  local (réseau ralenti, conflit). Copie d'avant : `subgestion3/_backup_20261106_1939_avant_comparatif_colonnes/`, `SUBGestion3_backup_20261106_1939_avant_comparatif_colonnes.html`.
- **Quantités dans le tableau (06.11.2026, même bloc 39 ; Paulo : « appels d'offres, permettre de modifier les quantités dans le tableau directement sans devoir ouvrir une fenêtre »)** : champ dans la colonne Quantité aux étapes d'avant le contrat (`QTE_ET` : Appel d'offres, Comparatif,
  Offre, Descriptif type, Estimatif ; Contrat et Métré gardent la fenêtre « Quantités »). Mêmes règles que `svdQtyInput` : pas de champ si un métré calcule la quantité ni pour une quantité « par » (`gq` W), 3 décimales, 9'999'999'999 au plus ; article de quantité sans ligne de quantité : la saisie la crée (`svdNewQP`).
  Montants, totaux de chapitre et pied mis à jour sur place (`maj`, `piedDesc`), même enregistrement et même journal que les prix. `svdDesc` enveloppé : toutes les étapes y passent (`brancher(X,et)`). Au comparatif, Tab saute les quantités (tabindex -1) : le passage d'une entreprise à l'autre reste direct.
- **Nouvel article, nouveau chapitre (06.11.2026, même bloc 39 ; Paulo : « impossible d'ajouter de nouvel article… idem pour nouveau chapitre »)** : rien n'était cassé, mais la fenêtre du moteur exigeait une ligne déjà choisie (entrée grisée), un double-clic dans une liste de 729 numéros, une unité dans un menu caché, OK gris sans explication.
  `svdResPos` (libre) → `nouvelArticle` : Chapitre, Numéro proposé (modifiable : 112 ou 112.110, `proposer`), Description, Unité (bibliothèque ou dernière choisie), Quantité, message clair, Entrée = Ajouter, « Ajouter et continuer », puis curseur dans la quantité ; mêmes règles et primitives (`svdEnsureArticle` — titres parents créés —, `svbFill`, `svdAutoDivs`) ;
  « Liste des numéros… » = fenêtre d'origine (groupes, variables, bibliothèque). « Article de réserve » inchangé. Nouveau chapitre (`svdChapterDlg` enveloppé) : numéro proposé (`prochainCh`), curseur sur le titre, ce qui manque est écrit. Sans ligne choisie, le premier chapitre l'est d'office (enveloppe de `svdDesc`). Toutes les étapes.
- **Soumission sous forme de descriptif (06.11.2026, bloc 40, `subgestion3/sg3_descriptif.js`, concaténé après `sg3_comparatif.js` ; Paulo : « créer la possibilité de créer une soumission sur la base d'articles de soumission et la possibilité de créer une soumission sous forme de descriptif ; voici un descriptif possible que je souhaiterais éditer ici pour le sanitaire », PDF 23JOG 250 sanitaire)** : « Nouvelle soumission » (`svNew` enveloppé) propose Par articles (le moteur, inchangé) ou Sous forme de descriptif. Données dans le contenu de la soumission : `S.mode='descriptif'`, `S.descriptif` = {entete:{g1,g2,d1,d2}, lettre, titre, blocs:[{id,t,x,b}]} ; t = sec (titre du lot), sou (rubrique soulignée), gr (groupe), pu (tiret), txt, pjt, pj (petits titre et tiret) ; b = emphase (Regular au PDF, comme l'original).
  Éditeur = la feuille elle-même, sans fenêtre (`rendre`, `svNodeFn('tenderEdit')` enveloppé) : lignes `contenteditable="plaintext-only"`, Entrée = ligne suivante (tiret vide + Entrée = rubrique), Retour arrière en début de ligne = fusion, ↑ ↓ entre lignes, Cmd-B emphase, Cmd-↑ ↓ déplace, collage de plusieurs lignes (`classer` : tiret, MAJUSCULES = groupe, ligne courte = rubrique, sinon texte), clic droit ; barre : styles, Gras, Monter, Descendre, Supprimer, Importer ▾ (PDF : `lirePdf`, pdf.js du cadre, position, corps et police de chaque ligne ; autre descriptif de la base), Ouvrir en PDF. Nouveau descriptif : préambule type du bureau (`modele`). Enregistrement 600 ms après la dernière frappe (`planifier` → `SGCP.enregistrer`).
  PDF : `sgDsPdf` options `o.enteteLibre` (en-tête à quatre champs) et `o.descriptif` (`contenuDescriptif`, mesures relevées sur le PDF de Paulo : corps 9,12 Light, tirets x 67,2, texte x 85, bande noire 18 pt) ; sans ces options, sortie inchangée. Appel d'offres ▸ Documents ▸ Descriptif / Descriptif en PDF → ce PDF (`svdPrint` enveloppé). Étapes réduites à Descriptif, Soumissionnaires, Comparatif bref (`SV_TREE` réduit par `svEditor` ; offre globale ; ligne du CFC créée d'office). Liste : étiquette « Descriptif ». Espacement rendu uniforme (12,4 pt), le préambule d'origine était un peu plus aéré (15,8 pt).
- **« Descriptif en PDF » (06.11.2026, DeltaSub.html, `svcStepDocs`)** : la ligne affichait « prévu au lot 4 » ; elle ouvre désormais le même document que « Descriptif » (au papier des contrats dans SUBGestion 3), de même que les lignes PDF de la Commande et du Début de préparation (étape Contrat).
- **Contrats d'entreprise (06.11.2026, bloc 41, `subgestion3/sg3_contrats_ent.js`, concaténé après `sg3_descriptif.js` ; Paulo : « dans chantier ajouter un module contrat d'entreprise »)** : page du projet ▸ Chantier, tuile après Soumission (`SG_PDOM_G`, `SG_PDOM`, `sgPdomCompte`, `sgPdomListe`, `drawC` ; droit « chantier : lecture »). Collection propre `sgcontratent` {ID <projet>:<aléatoire>, PROJECT_ID, N, DOC_ID, CFC, LOT, CONTACT_ID, ETAT brouillon|envoye|signe|resilie, DATE, SIGNE_LE, GENRE, HT, TVA, DEBUT, FIN, RETENUE, REMARQUE, AVENANTS:[{id,n,date,objet,ht,signe}], TEXTE:[blocs]} (gardée par les reprises ; NAS : « projet modifiable » par PROJECT_ID, le droit « chantier : écriture » n'est contrôlé que dans l'app, `sgcontratent` n'étant pas dans `SG_T_CHANTIER`).
  Liste : chiffres, lots adjugés sans contrat (`lots` : entreprise proposée d'une soumission, articles ou descriptif, offre négociée si elle existe, `offre`) avec « Établir le contrat », tableau. Fiche sur place, sans fenêtre : état, données, avenants, clauses (feuille commune `SGDP.feuille`). Signé ou résilié : données et clauses verrouillées, avenants ouverts ; rouvrir demande confirmation. Enregistrement 500 ms après la dernière modification (`planif`, `envoi`). PDF : papier des contrats, `blocsAuto` (parties, montants, délais, toujours à jour), clauses, signatures (`sgDsPdf`, types `kv`, `signatures`). ⚠ Clauses de départ (`CLAUSES`) = ébauche : à remplacer par le modèle du bureau.
- **Appel d'offres : « Soumission » ou « Descriptif », Conditions générales (07.11.2026, `sg3_descriptif.js`, demande de Paulo)** : dans l'arbre, « Éditer » de l'étape Appel d'offres s'appelle **Soumission** (par articles) ou **Descriptif** (`S.mode='descriptif'`) ; nouvelle entrée **Conditions générales** (`tenderConditions`), en tête de l'étape (avant la Soumission, et en tête de ses Documents ; `svdCheck` enveloppé : un contrôle qui échoue renvoie à la Soumission), dans les deux modes : cahier qui accompagne le cahier de soumission, même feuille que le descriptif (`rendre(X,CG)`, `S.conditionsGenerales`, plan vide `modeleCG`, ⌘Z, Importer ▾ depuis un PDF ou une autre soumission, enregistrement `planifier(X,cle)`, journal `noterDesc(X,cle)`), PDF au papier des contrats avec « Lu et approuvé, l'entreprise » ; lignes dans Appel d'offres ▸ Documents (`svcStepRows` enveloppé, `sgCgPdf` ; « Document disponible » = `sgCgDoc`, texte écrit). Tant que rien n'est saisi, la feuille est un brouillon hors du contenu (`BR`, `attacher`) : consulter ou ouvrir le PDF n'écrit rien. Copie de secours `sg3_desc_sec:<id>:<clé>` = {v (version du document), t, d}, écrite aussi pour les frappes non confirmées par le serveur, reprise à l'ouverture du document (`reprendreSecours` : sans question si la version n'a pas changé, sinon demande), jamais effacée en lecture seule. Texte des conditions à donner par Paulo.
- **Cahier de soumission : conditions puis cahier des charges, en un seul PDF (07.11.2026, bloc 44 : `sg3_descriptif.js` + `contenuCahier` de `sg3_docsub.js` ; Paulo : « voici à quoi ressemble le cahier complet avec les conditions au départ et en dernier le cahier des charges », choix « cahier rempli d'office » et « modèle pour toutes les soumissions »)** — modèle = cahier 23JOG 250 Sanitaire du 06.11.2026. Conditions générales (module du projet, voir ci-dessous ; partie avant du cahier) : `MODELE_CG` (modèle livré, texte du bureau ; ce qui était propre à 23JOG — description du projet, valeurs du site — est à compléter ou rempli d'office ; l'article 9 a perdu son renvoi « voir aussi art. 2.6, page 7 », propre à l'ancienne mise en page), remplacé par le **modèle du bureau** de la collection `sgcgmodele` (ID `bureau` ; Importer ▸ « Enregistrer comme modèle du bureau… » / « Reprendre le modèle du bureau… » ; `PROTECTED` et règle d'écriture « chantier » ou « bibliothèque : écriture » dans `serveur_deltasub.py`, à redéployer sur demande). Éléments de la feuille : Section (`ban`, « C 2 Informations… » : bande noire, nouvelle page ; une section sans contenu imprimable n'est pas imprimée), Rubrique, Titre, Texte (« 1. » en tête = liste numérotée à retrait), Tiret, Libellé : valeur (`kv`, « Commune : {commune} »), et dans « Plus » : À remplir / à signer, Ligne à remplir (`fl`), Encadré (`cad`), Insérer : page de garde, coordonnées de l'entreprise, résumé de l'offre, organisation du projet (`auto`, remplis d'office), signature, saut de page, plan joint (`annexe` : PDF — première page — ou image, rangé par `sgFichierRanger`) ; bouton Retrait (`r`). Lignes non éditables (`OBJ`) : Entrée = ligne dessous, Retour arrière / Suppr = la retirer, ⌘↑/↓ = la déplacer. Rempli d'office : page de garde (`calcGarde` : ouvrage = titre + adresse d'affaire, maître de l'ouvrage, architecte = bureau, direction des travaux = intervenant rôle 2 sinon bureau, CFC et titre du lot, début des travaux et date de dépôt des « Informations d'appel d'offres », adresse de retour = lieu de dépôt sinon bureau, collaborateur = responsable de l'affaire (rôle 6) sinon collaborateurs ; « Modifier… » = textes propres à la soumission, `v`), résumé de l'offre (`calcResume` : conditions de l'appel d'offres, taux vide = à remplir, TVA en dernier ; défaut rabais, escompte, prorata, TVA 8.1 %), organisation (`calcOrga` : projet, adjudicateur, mandataires = bureau + intervenants hors MO, entreprises et rôles du bureau), jetons `{commune}` (localité de l'adresse d'affaire, commune de Parcelle & règlements entre parenthèses), `{rue}`, `{parcelle}` (Parcelle & règlements), `{bureau}`, `{dt}`, `{mo}`, `{ouvrage}`, `{projet}`, `{cfc}`, `{lot}`. PDF (`ouvrirCahier`) : papier des contrats, mesures relevées sur le cahier 23JOG (corps 8.4, interligne 10.1, colonne 127.7, retrait 142, bandes 29 → 518), page de garde sans en-tête (`sansEntete`), en-tête à quatre champs ensuite ; mode descriptif : conditions et descriptif dans un seul document, numérotation continue ; soumission par articles : conditions + impression « Descriptif » du moteur (bloc 31) récupérée sans l'afficher (`pdfArticles`, classe `sgdp-capture`) et assemblée par pdf-lib (`fusionner` : chaque partie garde sa numérotation). Boutons « Conditions en PDF » et « Cahier complet » de la feuille ; Appel d'offres ▸ Documents : « Cahier complet (conditions et cahier des charges) » en tête (`sgCgPdf(X,g)`, `sgCgDoc(X,g)`, hook g = cg | cahier de `svcStepDocs`). Le plan vide de la première version (titres « Généralités »… et tirets vides) est remplacé par le modèle (`ancienPlan`).
- **Conditions générales du projet, modifiables par CFC (07.11.2026, bloc 45 de `sg3_descriptif.js` ; Paulo : « ajouter le module conditions générales des soumissions pour créer le cahier de base à mettre dans toutes les soumissions ; déplace les conditions générales éditables dans le module, dans Chantier ; dans la soumission affiche uniquement les conditions générales ; modifier par CFC, mais uniquement dans le CFC où la modification a eu lieu, et reproduire dans tous les CFC les conditions éditées dans le module »)** — Page du projet ▸ Chantier ▸ **Conditions générales** (`sgCgModule`, tuile `sgCgCompte`, `domPropre`) : la base de toutes les soumissions du projet, collection propre `sgcgprojet` {ID = projet, PROJECT_ID, entete, blocs, MODIFIE, PAR} (règle « projet modifiable » du NAS par PROJECT_ID) ; tant qu'elle n'est pas enregistrée, brouillon du modèle du bureau (`BRP`) ; liste des soumissions et de leurs modifications propres ; Importer ▸ PDF, modèle du bureau, enregistrer comme modèle du bureau ; « Aperçu en PDF » sans les données d'un CFC. Appel d'offres ▸ Conditions générales (`rendreCG`) : la base en lecture ; « Modifier pour ce CFC » enregistre la base si besoin (identifiants stables), puis l'écart dans `S.conditionsGenerales` = {v:2, modifs {id: ligne}, suppr [id], ajouts {id d'ancrage ('' = en tête): [lignes]}} (`diffCG` ; ligne du projet déplacée = copie « id~m ») ; affichage `resoudreCG` : base, sauf lignes modifiées, retirées ou déplacées dans le CFC ; lignes propres surlignées en jaune (`data-loc`) ; « Rétablir la ligne du projet », « Revenir aux conditions du projet ». Ancien format (feuille complète de la première version du 07.11.2026) : gardé comme copie propre au CFC. Le cahier complet prend les conditions résolues du CFC (`cgSoumission`). Vérifié sur 99TST : modification du module reprise dans 221.1 et 211.6, ligne propre de 211.6 gardée.
- **Cahier de soumission, corrections après relecture (07.11.2026, `contenuCahier` de `sg3_docsub.js`, `sg3_descriptif.js`)** : mise en page — un titre (section à
  remplir, rubrique, titre) part à la page suivante avec ce qui le suit (titres suivants + deux lignes, ou la place d'une pièce, d'un plan, d'une signature) ; encadré
  gardé avec la signature qui le suit ; bloc plus haut qu'une page coupé page après page (encadré fermé et rouvert) ; « Saut de page » ouvre la page au prochain élément
  imprimé (`aOuvrir` : jamais de page blanche avant une section, après deux sauts ni en fin de cahier) ; ligne numérotée avec retrait : numéro à base − 5,7, texte à
  base + 14,3 ; petits tirets / petits titres importés d'un PDF imprimés (tiret, souligné) ; résumé de l'offre : place réservée exacte, signe « + » pour un supplément,
  ligne de TVA toujours présente (taux `svdVatDefault`) ; organisation : libellé, adresse et téléphone / courriel coupés dans leur colonne, titre sans valeur gardé avec
  la ligne suivante. Plans joints : moins de 70 % de leur taille pleine page faute de place → page suivante (jamais d'échelle nulle ou négative) ; PDF pris à sa zone
  visible (CropBox) et dans son sens d'affichage (/Rotate) ; PDF chiffré ou abîmé → première page rendue en image par pdf.js (`annexePrete`) ; fichier illisible :
  message et section non imprimée. Données — une seule règle pour les responsables (rôle 6, sinon collaborateurs rôle 12, personnes parties du bureau écartées :
  `responsables`), mandataires = liste blanche des rôles (`ROLES_MANDAT` : ingénieurs, spécialistes, experts, planificateurs, économiste, garant, paysagiste, BIM) ;
  rue et localité ({rue}, {commune}, en-tête) d'après l'adresse d'affaire du contrat, sinon CONTACT1_ID (`adrAffaire`) ; lieu de dépôt avec responsable seul reconnu ;
  page de garde du module du projet : adresse de retour et collaborateur seulement (titre du lot, début des travaux, date de retour = propres au CFC) ; titre du lot
  modifié repris dans le résumé, {lot} et le nom du PDF ; cadre Facturation chargé avant les adresses. Par articles : impression « Descriptif » du moteur à la suite des
  conditions avec le même en-tête, logo gris et pages numérotées à la suite (`window.SGIMP_PLUS` lu par `sgImpPdf` du bloc 31 ; options `logoGris`, `numDebut`,
  `numTotal`, `numTotalPlus` de `sgDsPdf`) ; filtre de la soumission ignoré pour le cahier (message) ; une seule création à la fois (« Le PDF est en cours de
  création… ») ; seule la fenêtre ouverte par la capture est masquée et fermée (`.ov.sgdp-cap`). Éditeur — styles, suite et classement propres aux conditions
  (`OPT_CG` : Entrée après un titre numéroté = texte en retrait, « libellé : valeur » reconnu au collage) ; retrait reporté sur les lignes créées ; collage sur une
  pièce : lignes ajoutées dessous ; Retour arrière maintenu : la pièce n'est pas retirée (confirmation si plan choisi ou page de garde modifiée) ; plage Maj + clic
  copiée / coupée recollée telle quelle (`PRESSE`) ; Maj + clic dans la même ligne = sélection de texte ; frappes notées au journal à chaque modification (un
  rechargement ne les perd plus) ; copie de secours au format v:2 relue ; modèle du bureau enregistré → brouillons des autres projets refaits ; « Reprendre le modèle »
  et import PDF du module : lignes identiques gardent leur identifiant, modifications des CFC perdues annoncées, titre du PDF gardé en tête. Débogage : `SGDP.annexePrete`,
  `SGDP.ouvrirCahier`, `SGDP.calcGarde|calcResume|calcOrga|jetons|adrAffaire`.
- **Soumissionnaires ▸ Éditer : suivi des offres (07.11.2026, fin de `sg3_soumission.js` ; Paulo : « ajoute : si rendu, relancer le, renonce, etc. »)** : colonnes Invitée le, Rendue (case + date), Relancer le (rouge quand la date est passée sans offre ni renoncement), Renonce (case), saisies dans le tableau du moteur (`svTenderingEdit` enveloppé, `grid` intercepté le temps de l'appel) ; `e.suivi` {invite, rendu, renduLe, relance, renonce, auto} ; sans suivi enregistré, état déduit de la situation de l'offre (« Offre reçue, 23.01.2025 » = rendue, « Pas offert » / « Refusé » / « Annulée » = renonce) et de la note d'expédition (date d'invitation), rien n'est écrit avant un changement ; situation de l'offre remplie d'office si vide ; résumé au-dessus du tableau (rendues, renoncent, en attente, à relancer, dépôt des offres) ; copie et CSV avec les dates. Styles `#sgts-css`.
- **Ordre des modules du groupe Chantier (07.11.2026, deux annotations de Paulo)** : une ligne par étape — Devis général, Contrôle des coûts ; Conditions générales, Soumission, Contrats d'entreprise ; Planning, PV de chantier, Présentation ; Documents (`SG_PDOM_G` ; passages à la ligne par `SG_TUILE_BR` : Conditions générales, Planning du chantier, Documents du chantier).
- **Tableau des articles du CFC à gauche (07.11.2026, bloc 43, `subgestion3/sg3_articles_cfc.js` ; Paulo : « ajoute un tableau à gauche avec les articles qui concernent le CFC, pour les sélectionner comme pour devis ; on le remplira plus tard », « numérotation basée sur le principe de numérotation des articles »)** : à la place du catalogue « Perso » (`svdPersoPanel`), étape B en mode articles. Source = bibliothèque `svbiblio` (chapitre, article, sous-article : même numérotation que le descriptif). Un chapitre concerne le CFC par son champ `CFC` facultatif (code ou liste, pour l'import à venir), sinon par son numéro. Vide pour l'instant (« Aucun article pour ce CFC pour le moment »). Recherche, clic, double-clic ou Entrée = ajouter (`svbInsert` ; un titre ou un chapitre avec ses articles, confirmation au-delà de 30), ✓ = déjà présent, × ferme, bouton « Articles du CFC » rouvre (`sg3_soum_art`). Après toute insertion depuis la bibliothèque (aussi Importer ▸ Bibliothèque d'articles), avant l'enregistrement (`svdTouch` enveloppé) : mots-clés donnés à l'article 000 et aux titres créés (sinon Documents et transferts bloqués), quantités d'un article devenu titre reportées sur son nouveau sous-article. Redessin quand `svbiblio` change (`DS.on`), recherche par document, focus gardé. Visuel (07.11.2026, Paulo : « améliore le visuel, l'intégration du tableau à gauche ») : panneau de 300 px séparé du tableau par un filet gris, en-tête de la hauteur des titres de colonnes (34 px, filet noir de 2 px aligné), recherche au trait noir, lignes de 30 px, chapitres sur `--s-nuit3`, coche dessinée dans la cellule (`.sgar-d td.c::after`, comme le plan CFC des devis). Importer ▸ Catalogue « Perso » garde l'original. **À faire quand Paulo donnera les articles : les importer dans `svbiblio`.**
- **Comparatif des offres figé, comparatif choix des articles, tableau comparatif (07.11.2026, bloc 42, `subgestion3/sg3_travail.js` + `contenuComparatif` dans `sg3_docsub.js` ; demandes de Paulo)** — **Comparatif des offres** (ex-Comparatif) : basé sur l'appel d'offres, articles et quantités non modifiables (`o.ro` passé à `svdDesc`), on y saisit seulement les prix et les conditions des entreprises. **Comparatif choix des articles** (étape `travail` de `SV_TREE`, nœuds `travailEdit`, `travailNego`, `travailDocs` ; Négociation déplacée ici) : comparatif de travail ; `S.travail` = {unite (copie de C1), detail {cid: copie de e.detail}, base (signature), emp (empreinte), modifie, le, par}. Non modifié : copie refaite à chaque entrée, jamais enregistrée (`svSoumVal`, branché dans `svSoumOp` de DeltaSub.html) : le comparatif des offres est utilisé tel quel. Modifié (constaté à l'enregistrement par l'empreinte) : il est enregistré et **définit le contrat** (`svcTransferDoc` enveloppé, `retenus`) et les montants du module Contrats d'entreprise et de la liste. Écran : le moteur et `sg3_comparatif.js` travaillent tels quels sur une vue : `X.S` (getter redéfini, `instr`) rend sur ces nœuds un Proxy de S (`vue` : unites.C1 = T.unite, e.detail = T.detail[cid], tout le reste = le vrai S) ; `X.commit` enregistre toujours le vrai S ; journal : `j.tr`. **Griser** (Paulo : « ne pas les enlever de la soumission, mais les griser et surtout ne pas les additionner ») : colonne « Réal. » (case seulement sur les articles qui portent des quantités ; chapitre, titre et total de chapitre gris quand toutes leurs lignes le sont, à l'écran et dans le tableau comparatif — demande du 07.11.2026), `q.sgNon` (grisé par choix) sur T.unite, `svdCounted` enveloppé (ni brut, ni net, ni rang) ; variante non principale grisée d'office ; cochée seule → `q.sgOui` (comptée) et les autres variantes du groupe `q.sgVarNon` ; une case de titre, de chapitre ou « Tout réaliser » ne change jamais de variante ; menu « − » et clic droit = griser, jamais supprimer. Au contrat, les lignes grisées et les titres vidés par le grisage ne sont pas repris (`retenus`). Bandeau : état, « Mettre à jour depuis le comparatif des offres » (prix, quantités, conditions d'offre repris ; grisage, variantes et conditions négociées gardés), « Repartir du comparatif des offres ». Garde-fous (relecture contradictoire du 07.11.2026, 30 défauts corrigés) : la copie n'est refaite que si elle est intacte (`intacte` : empreinte inchangée, aucune saisie en attente) ; l'empreinte ignore filtre, tri, titre et date ; contrat ou offre créés depuis une copie modifiée alors que le comparatif des offres a changé (signature `sigBase` : prix, quantités, conditions, entreprises) → confirmation (`svcTransfer` enveloppé), refus si la proposée n'a aucun prix dans la copie ; « Transférer vers le contrôle des coûts » prend la même source (`svcCostSource`) ; `svbSyncAbbr` et `svRemap` (« Actualiser l'adresse ») suivent dans la copie ; la liste des entreprises de la vue est un Proxy du vrai tableau ; journal des saisies : `j.tr` comparé ; fenêtre « Prix » du comparatif des offres : quantité en lecture (`sgQteFixe`, lu par `svcPriceInput` de DeltaSub.html). **Tableau comparatif** : 1re ligne de Documents du comparatif des offres et du comparatif de travail (`SVC_DOCS`, `svcOpenDoc` enveloppé, `donnees`) : PDF paysage au papier des contrats, synthèse (rang, brut, net, négocié, écart, prix les plus bas, sans prix), récapitulatif par chapitre, tous les articles avec prix unitaire et montant par entreprise dans l'ordre du rang (5 entreprises par bande), prix le plus bas sur fond jaune pâle, montants en rouge, lignes grisées en gris. Tableau : conditions d'offre une ligne par niveau (taux dans la colonne « Prix unit. »), écart = `svbGapBid` (référence de l'écran), entreprises masquées (« Affichage et tri ») exclues, filtre actif signalé et chapitres vides omis, titres gardés avec l'article suivant, noms et titres coupés par « ... », signes absents des polices remplacés (≥ → >=…). Styles `#sgct-css`, débogage `window.SGCT`.
- **Calcul des coûts déplacé de Chantier dans Projet et Faisabilité (04.11.2026, demande de Paulo)** : tuile du module (`SG_PMOD` 'dom', `SG_PMOD_G`), mêmes droits qu'avant (`sgCalcOk`), page = domaine du moteur.
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
- **Affaire de travail 99TST (05.11.2026, `subgestion3/affaire_travail/`)** — Paulo : « une affaire de toutes pièces […] cette affaire devient une affaire de travail pour développer l'app ».
  Affaire ENTIÈREMENT fictive, **générée par script dans l'aperçu seulement** : le générateur n'est pas dans `SUBGestion3.html`, `construire.py` ne le lit pas, il ne va pas sur le NAS. **99TST · Immeuble Les Exemples**, Fondation
  Exemple, Exempleville, 18 logements et parking, 3,5 mio HT, de la faisabilité (02.2023) au décompte final (11.2026). `ref.js` = référence unique (identité, calendrier, montants, lots, équipe, récit) ; `socle.js` = `AT.mod`, `AT.commit`,
  dates, purge, `AT.generer()` ; `m10…m99` = un module par domaine (annuaire et 7 collaborateurs, affaire, contrats, estimations, 18 soumissions, contrôle des coûts, avenant, 3 937 h et 56 frais, 16 factures, tables Finances et RH, faisabilité,
  plannings à 4 indices, permis, avancement, apports, 40 séances dont 15 PV MO, notes, tâches, 36 PV de chantier, 203 fichiers dont 46 courriers, contrôle `ctx.verif`) ; 5'847 enregistrements dans 77 tables. Facturation est remplie en
  pilotant ses propres formulaires dans le cadre (`hht`, `httc` calculés par l'app). Rejouable : registre `sg_meta/affaire_travail` (`AT.purger`). `banc/banc.py` = essai dans Chrome sans fenêtre, sur une copie. Pendant la génération, `setTimeout(0)` passe
  par une file de messages (`A.sansFrein`) : sinon, panneau masqué, pdf-lib attend à chaque enregistrement (296 s → 56 s). `construire_et_previsualiser.sh` réassemble le générateur dans l'aperçu ; régénération : skill de vérification, § 3 ter.
  `ECARTS_APP.md` = 27 écarts de l'app relevés avec l'affaire, **non corrigés**, à présenter à Paulo.
- Aperçu de travail `/tmp/subgestion_dev` (port 7802, config `subgestion-dev`, 05.11.2026) : base et origine distinctes de l'aperçu de Paulo, pour tester sans déranger son onglet.
- **Dossier de l'aperçu `/tmp/subgestion_apercu` (port 7797) nettoyé le 24.10.2026 (demande de Paulo)** : seulement `SUBGestion3.html`, `affaire_travail.js` (05.11.2026, générateur de 99TST) et
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

**Texte caché des gabarits retiré des PDF (25.10.2026)** — contrats (`offrePDFBytes`) et factures (`generateInvoicePDF`) sont dessinés
sur des PDF réels : `OFFRE_TMPL` = contrat 24PRC, `FA_TMPL` = facture FA26.08_22SEG.AC09, `PG1_TMPL` = facture
FA26.09_24SLC.AC03 ; les zones variables sont blanchies puis réécrites et le logo des contrats est une page de `FA_TMPL` découpée
(`embedPage`). Jusqu'ici le texte d'origine (client, adresse, projet, montants de ces affaires) restait extractible (copier-coller,
pdf.js : 1'810 fragments dans un contrat, la facture 22SEG entière dans le logo de chaque page, les annexes retirées par `removePage`
restaient aussi dans le fichier). Désormais les deux
fonctions enregistrent par `pdfPropre(doc[, 'fr-FR'])` (Facturation.html, avant `generateInvoicePDF`) : `pdfSansTexteCache` lit les flux
(opérateurs, état graphique, formes imbriquées), retire du flux chaque glyphe dont l'encre (boîte du glyphe dans la police intégrée,
fontkit, contrôlée par la chasse du PDF) est sous un aplat opaque dessiné ensuite (tolérance `BORD` 0.5 pt) ou hors de la zone de
découpe du logo (marge `MARGE` 0.75 pt) ; les glyphes visibles d'un même TJ gardent leur position (chasse → nombre) ; ActualText vidés ;
puis les pages sont copiées dans un document neuf (plus d'objets inaccessibles, /PieceInfo d'InDesign retiré). ⚠ pdf-lib ne met pas à
jour `getPages()` après `removePage` : `pdfPages(doc)` invalide son cache. PV de chantier (logo en image) et devis : non concernés.
**Décision de Paulo (25.10.2026) : tout retirer.** Des glyphes du gabarit touchaient ou dépassaient les aplats (liserés visibles) ; leur
retrait change quelques pixels de bord d'aplat, rien d'autre (typographie, espacements identiques), mesuré à l'échelle 1.6 sur
62 documents (35 contrats, 27 factures) : 3 px par page de contrat (≤ 15 niveaux sur 255) ; page « Prestations ordinaires » ≈ 285 px
(liseré rose du haut des pourcentages rouges de 24PRC, ≤ 98) ; annexe 2 ≈ 294 px (≤ 14) ; annexe 3 ≈ 9 px ; factures 7 px (≤ 17) ;
non ordinaire 14 px (le « 1 » de l'ancienne facture collé au numéro de page, ≤ 135). Plus aucune donnée du gabarit extractible
(reste une « ) » isolée de l'annexe 2, qui dépasse de plus de 0.5 pt). Copie d'avant : `Facturation_backup_20261025_2012_avant_texte_cache.html`.
**Comparer des PDF au pixel avec pdf.js dans Chrome** : (1) panneau masqué → `requestAnimationFrame` suspendu, pdf.js n'achève pas le
rendu (le remplacer par `setTimeout`) ; (2) avec les polices du navigateur, le 1er rendu diffère des suivants ; (3) le canevas de
Chrome regroupe ses opérations : une opération peinte de plus ou de moins (même recouverte) change le lissage de filets ailleurs →
rendu fiable = `disableFontFace:true` + `getImageData(0,0,1,1)` après chaque opération peinte ; (4) générer deux fois le même contrat
dans le même onglet ne donne pas toujours le même PDF (24SLC, 26TEC, 24ECS, 17QUE.2 : état de l'app, préexistant, non corrigé) →
comparer des séquences identiques dans des onglets neufs.

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

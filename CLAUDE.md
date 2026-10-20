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
  collection (`sgapport`, `sgcontrattravail`, `sgcoutrevient`, `sgbouclement`, `sgacces`, `sganalyse`, `sg_meta`, et toute
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
  utilisateur, réduction ⌘\ / auto < 1000 px) + en-tête blanc (historique, rubrique, titre, Créer, ⋯) + barre contextuelle
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
  `affaires`, icône `briefcase`) : le module Affaires de l'ancien logiciel tel quel (Gestion, Controlling, Mes affaires, Toutes les
  affaires), écrans du moteur repris par `Object.create` sous `affd-*` (droits : `SG_VUE_DROIT` recopiés, regex du moteur `CH08B_AFF`
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
  contrats reliés ; lien « Toutes les factures » retiré le 20.10.2026), indication « Facturation en retard (x % facturé / y % consommé) » tout en bas, sous le tableau (`.sg-fact-ret`) ;
  tuiles au-dessus du tableau (`sgFactKpis(x)`, `.sg-fkpis` deux lignes de quatre, choix de Paulo) : Facturé (TTC), Encaissé (TTC), Solde à
  facturer (TTC) — déplacées depuis l'onglet Contrats, qui garde Honoraires (TTC) et Part facturable —, Facturé / consommé (chiffres de « Facturation
  en retard » : facturé HT ÷ honoraires HT, coût de revient ÷ honoraires HT ; jauge, repère rouge si retard), Ouvert (non payées), Échu (échéance
  passée, rouge), Dernière facture (date, n°, type), Délai moyen de paiement (date de facture → `date_paiement`) ; TTC sans frais comme `sgRenta` ; jamais pour le
  collaborateur (absent de `SG_ONGLETS_COLLAB`), droit « factures : lecture », code d'accès comme les finances. Cartes repliables essayées puis
  retirées (« Phases contrat » ne se replie pas, à la demande ; Factures a son onglet).
  **« Ouvrir » un contrat d'honoraires depuis le projet (20.10.2026)** : le contrat en PDF fidèle, lecture seule (`openContratPdf` du cadre),
  DERNIÈRE version seulement — le contrat signé ou, après la signature, le dernier avenant (nouvelle version ; Facturation n'a pas d'avenant
  séparé) — sans le choix des versions ; état à la place du commentaire (Contrat signé / Avenant … non signé, la version n est signée / Envoyé,
  non signé / Non signé / annulé) ; « Fermer » ramène à l'écran d'où l'on venait (`nxHist(-1)`). Vue `fx-contrats`, arg `cv:<id>`
  (`sgVoirContrat(w,id)`, contrats lus par `fxData()` : `contrats` est un `let` du cadre, pas une propriété de window). L'édition reste dans
  Facturation ▸ Contrats (✏️) ; ⌘K garde `fx-calchono` `c:<id>`. NAS au 20.10.2026 : aucun contrat marqué signé, 1 seul avec 2 versions.
  **Tableau des contrats d'honoraires (onglet Contrats, 20.10.2026)** — état final du 20.10.2026 : **Commentaire** (commentaire de la dernière
  version, « Commentaire de version » de Facturation, `sgContratInfo(c).com` ; remplace la colonne Contrat = code + description), **Document**
  (ex-« Nature »), **Rémunération** (ex-« Type »), Date du contrat, HT, TTC, État. Première version du même jour : colonnes Contrat, **Nature** (Contrat / Avenant), **Type** (rémunération ;
  Forfait relatif / Forfait / Unitaire, chapitre « Mode de calcul » ; non enregistré = forfait relatif, le défaut de Facturation, signalé en
  infobulle), **Date du contrat** (c.date, sinon date de la dernière version), HT, TTC, **État** (Brouillon / Envoyé / Signé le … / Terminé /
  Annulé, les états de Facturation) ; colonne Client retirée. « Ouvrir » et « Facturer » de chaque ligne = tuiles à icône comme l'onglet Heures
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
  `sgSiaCle` : numéro de la phase, puis de la phase partielle) — regroupe les saisies par phase.
  Affichages regroupés de l'onglet (20.10.2026) : sans la colonne « dont facturables » (`sgSituationHtml(L,g,{hier:1,fact:false})` ; Situation
  des heures du chapitre Temps, appelée sans option, inchangée) ; « Par phase » en arbre (`sgPhasesHier`, `.sg-sit-h`) : phases dans l'ordre
  SIA 102 (numéro de la phase, sinon `sgSiaGroupe`), phases partielles sur les lignes en dessous (`tr.sub`, numéro 31, 32…), « (sans phase
  partielle) » et « (sans phase) » à la fin ; pas de ligne en double quand l'unique phase partielle porte le nom de sa phase. Barres « Part » des tableaux
  regroupés visibles (`.nx-tbl td .nx-mini-bar`, aussi dans Situation des heures).
  **Numéro du projet : grand numéro et filet (20.10.2026, variante C choisie parmi 4 propositions ; la variante D « cartouche », appliquée
  d'abord, a été remplacée le même jour)** : en-tête du tableau de bord, à la place du pavé bleu nuit (numéro tronqué à 5 caractères) — numéro
  complet en grand (34 px, bleu nuit), filet noir vertical de 2 px, puis le titre (`.nx-hero .sg-pnum` ; empilés sous 560 px) ; les autres
  fiches (contact, collaborateur) gardent leur pavé `.ic`.
  Sous le titre, à droite du maître de l'ouvrage (20.10.2026) : « Heures saisies : 04.2024 à 12.2026 » = mois de la première et de la dernière
  heure introduites dans l'app (timelog du projet ; un seul mois si elles tombent le même mois ; dates exactes en infobulle ; rien sans heure).
  Onglet « Chantier » (20.10.2026) : rubriques Descriptifs & devis, Contrôles des coûts, Estimations, PV de chantier = titres dépliables
  (`.sg-pgrp` comme les groupes de la page du projet, corps `.sg-cgrp-b`, nombre d'éléments à droite, bouton « Ouvrir » / « PV de chantier »
  dans le corps), toutes repliées à l'arrivée ; celles qu'on ouvre restent ouvertes au retour sur l'onglet (`SG_CGRP`, par projet, jusqu'au rechargement).
  **Phase actuelle, marge bénéficiaire, graphique des phases (19.10.2026)** : `sgPhaseActuelle(p)` = phase (groupe 0 à 8 de la base : 1 Relevé,
  2 Faisabilité, 3 Étude du projet, 4 Appel d'offres, 5 Réalisation…) qui totalise le plus d'heures dans les 30 jours avant la dernière saisie du
  projet, + sous-phase la plus saisie ; affichée dans la tuile du tableau de bord (plus dans son en-tête depuis le 20.10.2026), les données de la page du projet (`nx-pdom`) et une colonne
  de Mes projets. Marge bénéficiaire = facturé HT − coût de revient (`sgRenta`), % du facturé (`sgMargePct`) : données de la page du projet et
  indicateur du tableau de bord (`sgMargeVisible` : pas pour le collaborateur ni finances verrouillées). Tableau de bord ▸ Vue d'ensemble :
  carte « Phases : heures prévues et effectuées » (`sgPhasesGraph`, graphique en barres de type « bullet » : prévu = TIMEBUDGET en fond, effectué
  en bleu nuit, repère de la limite, dépassement en rouge, phase actuelle surlignée, total). **ESSAI du 20.10.2026, à confirmer par Paulo** :
  phases partielles sous chaque phase dans ce graphique (`SG_PG_PARTIELLES = true` dans `sg3_plus.js` ; prévu = TIMEBUDGET de la phase
  partielle, effectué = heures saisies sur elle, « Sans phase partielle » pour le reste ; barres plus fines `.sg-pg-r.sub`, phase partielle
  en cours surlignée ; une seule phase partielle du nom de la phase : pas de ligne). Pour revenir au graphique d'avant : `false` (ou copie
  `subgestion3/_backup_20261020_1642_avant_essai_phases_partielles/`). Démarrage : le dernier écran est rouvert avec
  son paramètre (`sg3_vue_arg`, enveloppe de `go` dans `sg3.js` ; pas pour fx-* ni new / nf: / newaff:).
  « Coût du temps » renommé « Coût de revient » partout dans l'app (fiche projet, Rentabilité des projets, CSV, textes), 19.10.2026.
  **Tableau de bord du projet, collaborateur (19.10.2026)** : onglets `SG_ONGLETS_COLLAB` = Phases contrat, Intervenants, Contrats &
  factures, Chantier, Documents, Notes & tâches (ni Vue d'ensemble ni Temps ; premier onglet permis ouvert d'office) ; les droits s'appliquent
  en plus dans `sgOngletOk` (Contrats & factures : lecture des contrats ou factures — « aucun » par défaut pour le profil collaborateur).
  **Collaborateur : projets « en cours » seulement (19.10.2026)** : `sgCollabSeul()` (profil collab sans droit « projets : tous ») → Mes
  projets sans le choix « Tous mes projets » ni le lien vers la liste complète, toujours filtré sur `SG_ETATS_COLLAB` (configuration, en cours,
  en attente = filtre « En cours ») ; `sgProjetsVisibles` limité aux mêmes états (vue d'ensemble, `nx-listeprojets` sans les filtres Terminés /
  Archivés). Mes projets : numéros sans cadre jaune (`.nx-tbl.sg-mesp .nx-tag.num`).
  Collaborateur (18.10.2026) : Projets = Mes projets + Tâches seulement (Registre et Suivi & écarts masqués même si ses droits le
  permettent : `SG_VUE_DROIT['aff-gestion'|'aff-controlling']`) ; sa vue d'ensemble = ses projets attribués (« mes projets ») et SES
  tâches (« tâches à faire »). Vue d'ensemble : modules sans le groupe « Tâches » (il reste au menu) ; **menu déroulant « Tâches » (19.10.2026)** à la place de la
  ligne des tâches (`.sg-pv-tk`, fermé à l'arrivée) : fermé = intertitre « Tâches » au style de « Modules » + pastilles verte (En cours)
  et rouge (Urgent) — contour seul à zéro (`.sg-pt.zero`) ; ouvert = les trois listes de l'ancien logiciel en tuiles `.sg-tile`, en colonnes
  comme les modules (pastille à droite du titre), mêmes termes et mêmes états que `ptModuleRows` : En cours
  (« En traitement » de l'ancien logiciel, état 1), Urgent (état 1, marquée urgente), Réglé (état 3), chacune avec son nombre ; tâches des projets visibles en cours (collaborateur :
  les siennes) ; un clic ouvre `taches-encours`, `taches-urgent`, `taches-regle`.
- **Page de connexion du NAS** (`LOGIN_PAGE` de `serveur_deltasub.py`) : logo Substances blanc sur noir (comme le
  démarrage de l'app), deux champs groupés « Nom d'utilisateur » / « Mot de passe » et flèche, à la manière d'Apple.
- **Déploiement NAS — sur demande seulement (20.10.2026, remplace la règle du 10.10.2026)** : Paulo : « ne pas changer dans le NAS,
  tant que je ne te demande pas de le faire, pour gagner du temps et économiser de l'énergie » — les modifications sont committées et
  poussées sur GitHub et vérifiées dans l'aperçu local ; le dépôt sur le NAS (`nas/preparer.sh` ou `nas/nettoyer.py SUBGestion3.html
  /Volumes/subgestion/app/SUBGestion3.html`, partage `subgestion` monté — au bureau ou par Tailscale) se fait quand il le demande. Si
  `serveur_deltasub.py` a changé, Paulo redémarre le conteneur (DSM ▸ Container Manager ▸ Projet ▸ subgestion ▸ Action ▸ Redémarrer).
  Avant de copier : `git fetch` (l'autre poste pousse aussi), vérifier que la version du NAS n'est pas plus récente (dépôt depuis un autre
  poste), et que `nettoyer.py` passe (traces, sites externes).
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

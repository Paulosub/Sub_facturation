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
  Encore à rendre autonomes (lots suivants) : dépôt de fichiers et PDF (`/api/file`, `/api/pdf`), import des modèles
  (.zip), mots de passe / sessions (CH-08), manuel PDF. Aucun « lien CRB » à reprendre (SIA 451, CAN, CRBonline).
- **`serveur_deltasub.py`** — ancienne base partagée (SQLite, port 7790) : n'est plus nécessaire pour l'app ;
  ne sert plus qu'à la reprise Deltaproject (`--importer-deltaproject`, puis export ci-dessus). Base de test : `DELTASUB_DB`.
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
- Navigation (`SG_DOM` dans `sg3.js`, décision du 06.10 soir : MENU À GAUCHE, organisation de la v2) : menu bleu nuit
  (logo blanc, Rechercher ⌘K, domaines dépliables → « Vue d'ensemble » + modules, module actif en jaune, Favoris, pied
  utilisateur, réduction ⌘\ / auto < 1000 px) + en-tête blanc (historique, rubrique, titre, Créer, ⋯) + barre contextuelle
  `#nx-sub`. Variante « barres en haut » sauvegardée : `SUBGestion3_backup_20261006_2227_barre_haute.html` et
  `subgestion3/_backup_20261006_2227_barre_haute/`. ⚠ Ne jamais utiliser la classe `ov` (= voile des fenêtres DeltaSub,
  cherché par `$$('.ov')`). Vue d'ensemble par domaine (`dom-<k>`), modules Facturation
  = vues `fx-<onglet>` (arg `new`, `c:<id>`, `f:<id>`, `sync`), le cadre signale ses onglets via `parent.sgFxOnTab`.
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
     `w.Array.of(…)` : pdf-lib vérifie `instanceof Array` de SON domaine) ; visionneuse intégrée `.sg-visu`.
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

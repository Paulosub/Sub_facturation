# Cahier des charges — CH-08 « Réglages, session, utilisateurs et droits » dans DeltaSub

Version du rédacteur critique, 30.09.2026, **révisée à 13 h 30** après lecture de `spec_19_menus_exports.md` (CH-10, écrit en parallèle) : la barre de menus appartient à **CH-10 lot 1** et CH-08 s'y branche par les noms `rg*` que spec_19 attend (§ 1, arbitrage 2 ; § 4.1) ; le contrôle de session du serveur passe en tête de `do_GET` / `do_POST` pour couvrir aussi les routes de CH-03 et CH-10 (arbitrage 26). Ce cahier décrit comment reproduire dans `DeltaSub.html` (et `serveur_deltasub.py`) les entrées de CH-08 de la barre de menus de la fenêtre principale de Deltaproject 16.05, les Paramètres système (et leur variante [Ancien document]), les Préférences, la Gestion des utilisateurs (utilisateurs, fonctions, jeux de privilèges, navigateur des droits), l'application des 66 droits, l'ouverture de session avec mot de passe, la reprise d'une session ouverte, l'assistant « Configurer un collaborateur » et l'Aide. Il répond à la demande de Paulo du 30.09.2026 : « une barre de menus (Fichier, Édition, Aide…) ; les préférences et paramètres système ; la gestion des utilisateurs, des mots de passe et des droits ; les exports ». Il confronte les deux recherches du chantier (`ch/CH-08/rech_orig.md` sur l'original, `ch/CH-08/rech_exist.md` sur DeltaSub), la fiche CH-08, les matrices F et G et le § 16 de l'inventaire, ainsi que les recherches parallèles de CH-10 (`ch/CH-10/rech_orig.md`, `rech_exist.md`) là où elles se recoupent. Chaque point contesté a été revérifié à la source pour ce cahier.

**Conventions**
- **[P] PROUVÉ** : bytecode `Classe.méthode@offset` (désassemblages dans `scratchpad/ch/CH-08/jp/`), libellé `Strings.db (classe|id)` (colonne `fr`), données de la base de test `dstest/deltasub.sqlite` (copie de la base du bureau) ou mesure faite pour ce cahier.
- **[D] DÉDUIT** : interprétation cohérente, non démontrée ligne à ligne.
- **[C] CHOIX** : décision de conception pour DeltaSub. Les choix par défaut arrêtés par Paulo le 30.09.2026 (D6, § 2.2) sont marqués **[C arrêté]** ; les autres sont signalés à Paulo (§ 7 et § 11).
- Dans les tableaux, `\|` à l'intérieur d'un texte de code se lit `|` (échappement Markdown) ; les ancres s'écrivent sans la barre oblique dans les fichiers d'intégration.

**Références DeltaSub.** `DeltaSub.html` du dépôt au 30.09.2026 13:30 : 14 522 lignes, md5 `b5db79206029ddfe413a4ec83bcd3858` (commit `9c9a3f9`, CH-17 intégré ; la première rédaction portait sur `a0165c9`, 14 324 lignes). `serveur_deltasub.py` : 431 lignes, md5 `20c0933d385f03f71d47e51202d03c3c` (inchangé). Les deux fichiers changent pendant le travail des chantiers parallèles : **seules les ancres textuelles du § 9 font foi**, les numéros de ligne sont indicatifs (ceux de ce cahier valent pour `a0165c9` ; dans `9c9a3f9` ils sont décalés d'une ligne, sauf le démarrage, repoussé de 199 lignes par le bloc CH-17 : `DÉMARRAGE` l. 14 503).

**Préalable externe** : CH-10 lot 1 (`spec_19` § 10 : barre de menus, crochets `ch10aBeforeGo` / `ch10aAfterGo` de `go`, correction de `copyTable`) doit être intégré **avant** CH-08 lot 1. Le `build.py` de chaque lot de CH-08 le vérifie (ancres de présence P1, P2 du § 9.1) et échoue proprement sinon.

**Aucune donnée personnelle** : identifiants numériques (`APPUSER.ID`, `STAFF.ID`, `CONTACT.ID`), compteurs, libellés d'interface, noms génériques des fonctions et des jeux de privilèges. Aucun nom d'utilisateur hors des deux comptes internes du produit (`admin`, `mayday`, constantes du bytecode), aucun mot de passe, aucune empreinte réelle. **Aucun contenu CRB.**

**Fichiers de vérification (créés pour ce cahier, `ch/CH-08/crit/`)** : `ancres.py` (unicité des ancres de `DeltaSub.html` ; rejoué sur la version `9c9a3f9` : toutes à 1), `libelles.py` (les 160 libellés cités existent dans `Strings.db` : 0 absent), `droits_ctl.py` (droits effectifs, sections, domaines et catégories par compte ; vecteurs PBKDF2), `phone_ctl.py` (formats de téléphone masqués sur des adresses réelles), `prefixes.py` (collisions des noms réservés : 0 dans `DeltaSub.html`, le serveur et `ch/*/` hors CH-08). Désassemblages ajoutés dans `jp/` : `db.ContactOwnerTableModel`, `db.Project`, `db.StaffTableModel`, `app.form.Resources`, `deltaproject.addresses.CountryPopup$5`, `CountryBrowserDialog`, `time.RecordFrame`, `time.AnalyzeFrame`, `expenses.RecordFrame`, `expenses.AnalyzeFrame`.

---

## 0. Synthèse

1. **Barre de menus** : quatre menus dans l'original, **Fichier, Affichage, Réglages, Aide** ; **aucun menu « Édition »** dans la fenêtre principale [P `AppForm.initMenu@0-1488`]. La barre (et le menu Édition en extension, décision D-10.1) est construite par **CH-10 lot 1** (`spec_19` § 4.1), avec les conditions exactes de l'original.
2. **Propriétaire de la barre** : les deux recherches la revendiquaient ; `spec_19`, écrit avant la révision de ce cahier, la détaille entièrement et appelle CH-08 par des noms résolus par `typeof`. Ce cahier s'y range [C] (§ 1, arbitrage 2) : CH-08 fournit **`rgCan`** (droits), **`rgSystemPreferences`**, **`rgSystemLegacyPreferences`**, **`rgHelp`**, **`rgAbout`** (lot 1), **`rgUserAdmin`**, **`rgBeforeGo`** (lot 2), **`rgPreferences`**, **`rgEmployees`** (lot 3) ; les commandes de session propres à DeltaSub passent par l'indicateur réseau `#net` (§ 4.2). **CH-10 lot 1 est un préalable** de CH-08 lot 1.
3. **Paramètres système** (droit `admin` pour le menu ; boutons selon `adminGeneral` / `adminAddresses`) : Général (Pays, Monnaie standard, **Taux de TVA**, retiré de l'Administrateur), Adresses (ordre des noms, format des téléphones), Bâtiment (protection) ; 6 sous-dialogues fidèles ; [Ancien document] (module DESIGN, 4 polices, domaine Fichiers). Le dossier des logos n'existe qu'en version de développement : rien à reproduire [P] (§ 4.3, § 4.4).
4. **Les réglages s'appliquent partout** : `phone()` et l'ordre des noms de `ownerName()` suivent les Paramètres système (bureau : « 012 345 67 89 » et « Prénom Nom ») ; une nouvelle adresse prend le pays et l'indicatif par défaut [P `Contact.<init>@41-65`] (§ 4.5).
5. **Droits** : un moteur unique `ch08aCan(clé)` (union des jeux de toutes les fonctions, `superadmin` donne tout, `userAdmin` d'office pour `admin` et `mayday`) [P `Security.hasRight@0-57`], avec une règle d'amorçage DeltaSub (aucun jeu en base → tout permis) (§ 3.4). `rgCan(clé ou code « m,i »)` l'expose à la barre de CH-10 dès le lot 1 : les entrées de menu suivent alors les droits.
6. **Application des droits** (lot 2) : barre des modules, refus de vue par `rgBeforeGo` (crochet de `go` posé par CH-10), domaines d'affaire, catégories de l'Administrateur, et une **table déclarative de gardes** (vue, libellé → droit, masquer ou griser) branchée une seule fois dans `ibtn` et `popMenu`. Au bureau, 5 personnes actives n'ont que le jeu Standard : elles perdront **COLLABORATEURS, FACTURES, MANAGEMENT**, l'Administrateur et 4 domaines d'affaire, comme dans Deltaproject aujourd'hui (§ 4.10, décision n° 1).
7. **Saisie pour autrui** : Heures ▸ Saisie et Rapport, Notes de frais ▸ Saisie et Rapport listent dans l'original les collaborateurs **liés au compte** (`APPUSER_STAFF`), anciens compris [P `time.RecordFrame.setStaffTable@0-11` et 3 homologues]. DeltaSub liste aujourd'hui tous les collaborateurs actifs : corrigé au lot 2 (§ 4.10.5).
8. **Gestion des utilisateurs** (droit `userAdmin`) : onglets Utilisateurs | Fonctions | Jeux de privilèges, 6 dialogues et 4 navigateurs, messages exacts ; fonctions et jeux affichés sur 4 colonnes (une par langue), triés sur le nom allemand [P] (§ 4.7 à 4.9).
9. **Préférences** (lot 3) : 5 catégories utiles sur les 8 visibles au bureau (Langue des documents, **Utilisateur**, Saisie de texte, Tableau, vCard export) ; seule Utilisateur écrit en base (5 champs de `APPUSER`) ; signature PNG dans une collection protégée `appusersignature` [C] (§ 4.12).
10. **Champs « utilisateur » des impressions** : l'original imprime toujours `APPUSER` (nom, initiales, téléphone, courriel, titre, fonction) et la signature, jamais la fiche du collaborateur [P `FieldStyles.getUserString@9-113`] ; DeltaSub est aligné (lot 3), avec un repli sur la fiche du collaborateur tant que les champs de `APPUSER` sont vides (décision n° 2) (§ 4.13).
11. **Mots de passe [C arrêté]** : jamais en clair ni diffusés aux postes ; empreinte **PBKDF2-HMAC-SHA256, 600 000 itérations, sel de 16 octets par compte**, dans une table serveur hors de `rec` (scrypt est absent du Python du Mac Studio, § 1 arbitrage 11) ; les mots de passe et empreintes de Deltaproject ne sont **jamais** repris (§ 3.5).
12. **Ouverture de session [C arrêté]** : désactivée par défaut (mode actuel « Qui utilise ce poste ? », corrigé : Échap ne laisse plus le poste sans utilisateur) ; un administrateur ayant un mot de passe l'active dans Paramètres système ▸ Ouverture de session ; alors **toutes les routes `/api`** exigent une session (jeton aléatoire, cookie `HttpOnly; SameSite=Strict`, expiration), sauf `ping` (réduit à `{ok, auth}`) et les 5 routes qui servent à ouvrir, vérifier ou fermer une session et à définir ou changer un mot de passe (`login`, `session`, `logout`, `password`, `password/first`) (§ 4.20.1) ; le contrôle est placé en tête de `do_GET` et `do_POST`, donc avant les routes de CH-03 et CH-10 ; `who` vient de la session. Le serveur refuse les écritures d'administration sans le droit **dans les deux modes** (en mode sans mot de passe, sur l'identité déclarée par le poste) (§ 4.15 à 4.20).
13. **Reprise d'une session ouverte** : fenêtre « Document verrouillé » fidèle ; à la différence de l'original, le poste évincé est déconnecté (D6-c) (§ 4.16).
14. **Reprise Deltaproject** : les 7 collections d'utilisateurs, de droits et de réglages sont aujourd'hui **écrasées** par un ré-import (défaut existant : la TVA modifiée revient, `ds.tplGroup.*` disparaît). Nouvelle règle serveur : un enregistrement touché dans DeltaSub (vivant ou supprimé) est conservé, les autres sont rafraîchis (§ 3.6).
15. **Exports** : la fenêtre « Export des données » et son entrée de menu appartiennent à CH-10 ; CH-08 fournit le droit `adminDataExport` par `rgCan` ; le droit `contactExport` y est **sans effet** dans l'original [P], constat partagé par CH-10 (§ 2.4).
16. **Aide** : Aide ▸ Aide ouvre le manuel FR installé (`/Applications/DELTAproject.app/…/manual_fr.pdf`, 32 Mo), servi en lecture seule par le serveur, sinon un texte ; « A propos de DeltaSub » avec les mentions propres à DeltaSub (§ 4.6).
17. **Aucun document imprimé** propre au chantier (§ 5).
18. **Protection Bâtiment** : passer « Protection » à « auteur uniquement » rendrait **41 documents** (25 devis, 16 contrôles des coûts) non modifiables par personne, leur auteur n'existant plus parmi les comptes ; le sous-dialogue l'annonce et demande confirmation [C] (§ 4.3.5, signalé par `spec_19` § 8 n° 6).
19. **Plan : 4 lots** (la fiche en prévoyait 6) : `ch08a` socle des droits, Paramètres système, formats, Aide, reprise protégée ; `ch08b` utilisateurs et application des droits ; `ch08c` Préférences, champs utilisateur des impressions, assistant ; `ch08d` session et mots de passe (serveur et page). Préalable externe : CH-10 lot 1 (§ 10).

---

## 1. Arbitrages entre les sources (tranchés à la source)

| # | Sujet | Affirmations en présence | Verdict | Preuve |
|---|---|---|---|---|
| 1 | Menu « Édition » demandé par Paulo | fiche : barre « Fichier, Édition, Aide… » | **Absent** de la fenêtre principale ; « Edition » n'existe que dans les fenêtres de document Bâtiment. Ajout en extension par **CH-10** (`spec_19` § 4.2, décision D-10.1) ; CH-08 n'en livre rien | [P] `AppForm.initMenu@1427-1488` : `menuFile`, `menuView`, `menuExtras`, `menuHelp` seulement |
| 2 | Qui construit la barre de menus | `CH-08/rech_exist` § 0 et la première rédaction de ce cahier : CH-08 lot 1 (contrat `dsMenu_*`) ; `CH-10/rech_exist` § 9, `CH-10/rech_orig` § 14 et **`spec_19` § 4.1, § 10 lot 1** : CH-10 | **CH-10 lot 1** [C, révision] : `spec_19` (12 h 29) spécifie entièrement la barre, son modèle pur testé (`ch10aModel`), l'Édition, l'Affichage, les crochets de `go` et appelle déjà les noms `rgCan`, `rgEmployees`, `rgUserAdmin`, `rgSystemPreferences`, `rgSystemLegacyPreferences`, `rgPreferences`, `rgHelp`, `rgAbout`, `rgBeforeGo` par `typeof` ; deux barres seraient une collision. CH-08 **fournit exactement ces noms** (§ 4.1) plutôt que de demander la modification de la constante `CH10A_MENU` d'un autre chantier. Le contrat `dsMenu_*` de la première rédaction est **abandonné** | `spec_19` § 4.1.2, § 9 (« Noms attendus des autres chantiers ») |
| 3 | Effet du droit `contactExport` dans « Export des données » | `CH-08/rech_orig` § 12.1 : Exporter inactif sans le droit, même pour les heures ; `CH-10/rech_orig` § 0 n° 3 : sans effet | **Sans effet** : `<init>@229-243` désactive le bouton, mais `checkGuards@58-81`, appelé à l'ouverture (`@315`) et à chaque bouton radio, le réactive dès qu'un export est choisi | [P] `DataExportDialog.<init>@229-243`, `checkGuards@58-81` |
| 4 | Nombre de fonctions | inventaire : 3 | **4** (1 Administrateur, 201 Standard, 301 Direction, 251 sans nom) ; seules 1 et 201 sont attribuées | [P] base de test, `droits_ctl.py` |
| 5 | Droits testés | inventaire : 62 | **61** ; jamais testés : `contactDeleteAll`, `contactGroupView`, `projectEdit`, `projectInvoices`, `managementProject` | [P] `rech_orig` § 4.3 (recherche binaire des 6 jars) |
| 6 | Condition de « Configurer un collaborateur » | inventaire : droit `admin` | compte dont l'USERID est **« admin »** (ou version de développement), pas le droit | [P] `AppForm.initMenu@433-483`, `AppUser.isAdminUserID` |
| 7 | Dossier des logos (Paramètres système) | fiche : à reproduire | **Version de développement seulement** : rien à reproduire | [P] `SystemPreferencesDialog.<init>@297-341` |
| 8 | Préférences | fiche : 9 catégories | 9 définies, **8 visibles au bureau** (DELTAbaucost seulement si `isModuleFormVisible` = [NO]) | [P] `pref.MenuTableModel$MenuItem.isVisible@0-42` ; réglage 801 = [YES] |
| 9 | Verrou `lockExportAllAddresses` (= [YES] au bureau) | inventaire § 8 : verrou actif | **Lu nulle part** en 16.05 : sans effet | [P] seule référence dans `Setting.removeOldSettings`, jamais appelée |
| 10 | Mots de passe Deltaproject | `rech_orig` D6-a : les reprendre (empreinte MD5 hors `rec`, puis PBKDF2) | **Jamais repris** [C arrêté D6(1)] : `SKIP_COLUMNS` reste tel quel ; comptes repris sans mot de passe ; premier mot de passe défini par l'utilisateur ou fixé par l'administrateur | décision de Paulo du 30.09.2026 |
| 11 | Algorithme d'empreinte | D6(1) : `pbkdf2_hmac` **ou** `scrypt` | **PBKDF2-HMAC-SHA256, 600 000 itérations** : `hashlib.scrypt` n'existe pas dans le Python du Mac Studio (`/usr/bin/python3` 3.9.6, LibreSSL 2.8.3) ; 600 000 itérations = **0,174 s** mesurées sur ce poste | [P] mesure du 30.09.2026 (`hasattr(hashlib,'scrypt')` = False) |
| 12 | Où tenir les sessions | `rech_exist` § 6 : table `lock` inutilisée ou `meta` | **Tables serveur nouvelles** `auth_pw`, `auth_session`, `auth_fail` [C] ; la table `lock` reste libre (CH-10 lot 3 en a l'usage prévu) | § 3.5 |
| 13 | spec_1 § 5 : « pas de vrai mot de passe dans une app HTML locale » | spec_1 | **Dépassé** : DeltaSub est une base partagée par le bureau et Paulo demande les mots de passe | demande du 30.09.2026 |
| 14 | Codes des droits de spec_1 § 2.1 | « déduits » | Codes exacts : `generalUnlockDocuments` = 100,0 ; `userAdmin` = 2,0 ; `adminDataExport` = 1,7 ; libellés **inversés** dans l'original pour 1,5 (`adminRates`, « Paramètres heures prévues ») et 1,6 (`adminTargetTime`, « Paramètres tarifs de facturation »), reproduits tels quels | [P] `Rights$Right.<clinit>`, `Strings.db (Rights\|adminRates)`, `(Rights\|adminTargetTime)` ; `AdminDialog$Menu.<clinit>` : catégorie « Tarifs de facturation » ← `adminRates`, « Heures prévues » ← `adminTargetTime` |
| 15 | Colonne « Entité » de DeltaSub en « Nom Prénom » alors que le bureau est réglé « Prénom Nom » | `rech_exist` § 1.1 | **Conforme** : la liste des entités de l'original montre NAME1 et NAME2 dans deux colonnes ; seul `getName()` suit `displayNameFormat`. Les appels `ownerName(o,true)` restent « Nom Prénom », seul l'ordre par défaut suit le réglage | [P] `db.ContactOwnerTableModel.getValueAt@65-75` (NAME1, NAME2) ; `ContactOwner.getName` |
| 16 | Saisie pour autrui | `rech_orig` § 4.3 : « DeltaSub le fait déjà (`ME.staff`, `dpStaffs`, `ptStaffs`) » ; `rech_exist` § 2 : Heures ▸ Saisie prend `staffList()` | **Partiel** : Disponibilité et Tâches suivent `APPUSER_STAFF`, mais Heures ▸ Saisie (l. 9254), Heures ▸ Rapport (l. 1809), Notes de frais ▸ Saisie (l. 6785) et Rapport (l. 6848) listent tous les collaborateurs actifs. L'original liste les collaborateurs liés au compte, **anciens compris** | [P] `time.RecordFrame.setStaffTable@0-11`, `time.AnalyzeFrame@2021`, `expenses.RecordFrame@353`, `expenses.AnalyzeFrame@1760` : `Security.getAppUser().getStaffs()` sans filtre |
| 17 | Pays par défaut d'une nouvelle adresse | DeltaSub : `'CH'` et `'+41'` en dur | **Réglage** : `countryCode = standardCountryCode`, `phoneCountry1`, `phoneCountry2`, `faxCountry1 = standardPhoneCountry`, `languageCode` = langue des documents par défaut | [P] `db.Contact.<init>@31-65` |
| 18 | Monnaie d'une nouvelle affaire | `rech_exist` : `mainCurrency` à écrire | L'original laisse `CURRENCY` vide et **lit** `mainCurrency` à l'affichage ; DeltaSub écrit `'CHF'` et `hfCur` lit déjà `mainCurrency` en repli : écart négligeable, non traité | [P] `db.Project.getCurrency@0-8` |
| 19 | Liste « Autres … » des pays | `rech_orig` : « Autres … » ; libellés `countryAustria` … `countrySuisse` dans `Strings.db` | Menu **Suisse, France, Italie, Allemagne**, séparateur, « Autres … » (`Strings$Label.more` + « … ») → « Navigateur de pays » (recherche, tableau Code \| Nom). Les 5 libellés `SetCountryDialog\|country*` sont morts ; les noms viennent de `rsrc/app/lists/countries.csv` (246 pays, colonne FR) | [P] `CountryPopup.getPopupMenu@9-279`, `CountryPopup$5@8-46`, `Strings.db (CountryBrowserDialog\|countryBrowser)` |
| 20 | Polices proposées par « Définir la police standard » | non établi | **Toutes les polices installées** sur le poste (`GraphicsEnvironment.getAllFonts`) ; le navigateur ne peut pas les énumérer : DeltaSub propose les polices présentes dans les anciens modèles plus les valeurs actuelles [C] | [P] `app.form.Resources.<clinit>@74-77` |
| 21 | Messages de refus de suppression d'une fonction ou d'un jeu | `rech_orig` : avertissement | Titre **« Avertissement »** (`Strings$Label.warning`), `msg2` de chaque dialogue ; confirmation préalable `msgDeleteEntry` (Oui/Non), pas `msg1` (mort) | [P] `AppCompanyRoleDialog.deleteAppCompanyRole@1-114`, `AppRoleDialog.deleteAppRole@1-114` |
| 22 | Ordre des contrôles de « Modifier le mot de passe » | — | 1. compte et ancien mot de passe (« Mot de passe erroné. ») ; 2. nouveau = confirmation (« Le nouveau mot de passe n'est pas valable. ») ; 3. écriture puis « Le mot de passe a été modifié avec succès. » (titre « Information ») | [P] `ChangePasswordDialog.jOkButtonActionPerformed@0-179` |
| 23 | `copyTable` de DeltaSub | — | `navigator.clipboard.writeText` n'existe pas dans un contexte non sécurisé : les 22 entrées « Copier le contenu du tableau dans le presse-papier » **échouent** sur tout poste qui ouvre `http://<Mac-Studio>.local:7790/`. Corrigé par **CH-10 lot 1** (ancre C1 de `spec_19`, repli `ch10aCopyText`) ; CH-08 ne touche plus `copyTable` | [D] règle `[SecureContext]` de l'API Presse-papiers ; constat identique dans `spec_19` § 8 n° 1 |
| 24 | Double espace de `phone()` | `rech_exist` V6 (contact 7853) | Disparaît avec l'algorithme de l'original (§ 4.5) | [P] `Contact.phoneToString@0-164` ; `crit/phone_ctl.py` |
| 25 | `plCan` et `svRight` en double | `rech_exist` § 1.3 : les unifier | **Conservés** [C] : leurs résultats sont identiques à `ch08aCan` sur les données du bureau (V1 de `rech_exist`, `droits_ctl.py`) ; leur remplacement est laissé à une passe de nettoyage (non livré, § 10) | § 6.1, J4 |
| 26 | Où placer le contrôle de session du serveur | première rédaction : avant `if u.path == "/api/ping":` (GET) et avant `if urlparse(self.path).path != "/api/commit":` (POST) | **En première instruction de `do_GET` et `do_POST`** (ancres `    def do_GET(self):`, `    def do_POST(self):`, uniques) : CH-03 (`spec_17` S3, S4) et CH-10 (`spec_19` S2) insèrent leurs routes **devant les mêmes lignes** que l'ancien choix ; selon l'ordre d'intégration, `/api/file` ou `/api/modeles/zip` auraient échappé à la session, contre D6(2) | [P] `serveur_deltasub.py` l. 370 et 396 ; `spec_17` § 11 ; `spec_19` § 9 |
| 27 | Règles d'écriture du serveur en mode sans mot de passe | première rédaction : seulement avec mot de passe | **Dans les deux modes** [C, D6(3)] : l'authentification étant désactivée par défaut, des règles réservées au mode avec mot de passe ne s'appliqueraient jamais ; sans mot de passe elles portent sur le compte déclaré (`who`), sans prétention de sécurité, mais empêchent une écriture d'administration depuis un poste qui n'a pas le droit. Les seules écritures actuelles concernées (`admVat`, `genVatRatePos`) exigent déjà `admin` dans l'interface | § 4.20.3 ; écritures de `setting` relevées dans `rech_exist` § 1.4 |
| 28 | `ping` sans session, mode avec mot de passe | première rédaction : `{ok, version, auth}` | `{ok:true, auth:true}` seulement : D6(2) veut une session pour toute route `/api` ; les exceptions se limitent à ce qu'il faut pour ouvrir une session (§ 4.20.1) | D6(2) |
| 29 | Réinitialisation d'un mot de passe en mode sans mot de passe | première rédaction : permise si le compte déclaré a `userAdmin` | **Seulement pour définir le premier mot de passe** d'un compte qui n'en a pas (« l'administrateur le fixe », D6(1)) ; remplacer un mot de passe existant exige une session `userAdmin` ou la commande locale du Mac Studio. Sinon, n'importe quel poste se déclarant administrateur pourrait changer le mot de passe d'un autre avant l'activation | § 4.17, § 4.20.1 |
| 30 | Masque des valeurs de contrôle des téléphones (J2) | première rédaction : tous les chiffres → 9 | **Chiffres 1 à 9 → 9, les 0 gardés** (`crit/phone_ctl.py`) : l'autre masque effaçait la différence entre « 0 », « (0) » et rien, qui est justement ce qu'il faut contrôler ; aucun numéro réel n'est reconstituable | § 6.1 J2 |
| 31 | Documents Bâtiment à auteur inconnu | `spec_19` § 8 n° 6 : « 41 documents… à traiter dans les Paramètres système (CH-08) » | **Mesuré** : 25 `costestimatedocument` + 16 `costcontroldocument` dont `USERID` n'est plus un compte ; 0 eCCC, 0 `devisdocument`. Avertissement dans « Paramètres de protection des documents » [C] (§ 4.3.5) | [P] base de test, collections chargées au démarrage (hors `HEAVY`) |

---

## 2. Périmètre

### 2.1 Reproduit (fidèle)

- Entrées de CH-08 dans la barre de menus de CH-10 (Configurer un collaborateur, Gestion des utilisateurs, Paramètres système, [Ancien document], Préférences, Aide, A propos de), avec les conditions de droit de l'original, par les fonctions `rg*` (§ 4.1).
- Paramètres système : 3 rubriques, 6 lignes, 6 sous-dialogues, règles d'activation des boutons OK, enregistrement immédiat par sous-dialogue.
- Paramètres système [Ancien document] : module DESIGN, 4 polices standard, domaine Fichiers ; message de redémarrage.
- Application des formats (ordre des noms, téléphones) et des valeurs par défaut (pays, indicatif, langue) des nouvelles adresses.
- Moteur de droits (union, superadmin, comptes internes) et application : barre des modules, « Toutes les affaires », domaines d'affaire, catégories de l'Administrateur, entrées de menu, boutons des tableaux (table de gardes), liste des collaborateurs de la saisie pour autrui.
- Gestion des utilisateurs : 3 onglets, filtre, `AppUserDialog`, `AppCompanyRoleDialog`, `AppRoleDialog`, `RightBrowserDialog`, `AppCompanyRoleBrowserDialog`, `AppRoleBrowserDialog`, `StaffBrowserDialog` ; messages et contrôles exacts ; comptes internes non modifiables.
- Préférences : Langue des documents, Utilisateur (5 champs + signature PNG), Saisie de texte, Tableau, vCard export.
- Champs `appUser`, `user` et images `appUserSignature`, `userSignature` des moteurs d'impression existants.
- Assistant « Configurer un collaborateur ».
- Ouverture de session (champs, règles, message d'échec), reprise d'une session ouverte (« Document verrouillé »), « Modifier le mot de passe », « Réinitialiser le mot de passe », « Utilisateurs actifs » et « Rejeter un utilisateur ».
- Aide ▸ Aide (manuel FR installé) et « A propos de ».

### 2.2 Choix arrêtés par Paulo (D6, 30.09.2026) et extensions DeltaSub

| Réf. | Contenu | Où |
|---|---|---|
| D6(1) | Mots de passe jamais en clair ; empreinte salée côté serveur ; session par jeton aléatoire (cookie `HttpOnly`, `SameSite=Strict`), expiration ; « Modifier le mot de passe » ; « Reprendre une session ouverte » ; aucun mot de passe ni aucune empreinte de Deltaproject lus ou repris | § 3.5, § 4.15-4.20 |
| D6(2) | Authentification **désactivée par défaut** ; activée dans Paramètres système par un administrateur ayant un mot de passe ; alors toutes les routes `/api` exigent une session | § 4.18, § 4.20 |
| D6(3) | 66 droits, jeux, fonctions, navigateur des droits ; contrôles de l'interface identiques à l'original ; côté serveur, au moins l'administration des utilisateurs et des droits | § 3.4, § 4.7-4.10, § 4.20.3 |
| D6(4) | Préférences et Paramètres système : ce qui a un sens dans DeltaSub ; le reste « sans objet » (§ 2.3) | § 4.3, § 4.4, § 4.12 |
| D6(5) | Aide : manuel FR installé s'il est accessible, sinon un texte ; À propos propre à DeltaSub | § 4.6 |
| E-a | *(Menu Édition : extension portée par CH-10, `spec_19` § 4.2)* | — |
| E-b | Commandes de session dans l'indicateur réseau `#net` (double-clic) : « Qui utilise ce poste ? » sans mot de passe (comme aujourd'hui) ; « Modifier le mot de passe … » et « Fermer la session » avec mot de passe. L'original n'a que « Quitter » (hors macOS), que la barre de CH-10 omet | § 4.2 |
| E-c | Paramètres système ▸ rubrique **« Ouverture de session »** (mode, première connexion, utilisateurs actifs) | § 4.18 |
| E-d | Poste évincé déconnecté (D6-c de la recherche) ; blocage temporaire après 5 échecs | § 4.16, § 4.20 |
| E-e | Repli des champs d'impression sur la fiche du collaborateur quand `APPUSER` est vide (décision n° 2) | § 4.13 |
| E-f | Longueur minimale du mot de passe : 8 caractères (décision n° 3) | § 4.17 |
| E-g | Avertissement avant de protéger les documents Bâtiment quand des auteurs n'existent plus (41 au bureau) | § 4.3.5 |
| E-h | Règles d'écriture d'administration appliquées par le serveur aussi en mode sans mot de passe (identité déclarée) | § 4.20.3 |

### 2.3 Sans objet (non reproduit)

| Élément de l'original | Raison |
|---|---|
| Réglages ▸ Mettre à jour les licences CRB ; Aide ▸ Gestion des licences DELTAproject / CRB ; messages et contrôles de licences (`msgLicenceExceed`, `msgHasActivatedLicence`…) | pas de licences dans DeltaSub (D6-k) : aucune limite de comptes actifs |
| Réglages ▸ Emplacement du dossier DELTAprojectFiles | les fichiers sont servis par le serveur |
| Réglages ▸ Export iOS | D9 |
| Réglages ▸ [Dev] × 4 ; bouton « Projekt-Liste [Bering] » ; dossier des logos | version de développement |
| Aide ▸ Support, Rechercher les mises à jour | service du distributeur |
| Fenêtre d'ouverture de session : « Editer le mode d'utilisation … », « Licence … », langues de dialogue, « Maintenance de la base de données … » | serveur SQLite unique, interface en français |
| Préférences ▸ Correcteur orthographique | celui du navigateur |
| Préférences ▸ Apparence (variantes, fonds d'écran) | propre à l'interface Swing |
| Préférences ▸ DELTAbaucost | masquée au bureau ; module absent |
| Préférences ▸ Bâtiment (catalogues CAN, dialogue des licences, enregistrement automatique) | CRB, licences ; l'eCCC enregistre déjà à chaque modification et la Soumission a « Enregistrer » : aucun module ne lirait ce réglage |
| Préférences ▸ Langue des documents ▸ « Langue de l'aide » | italien seulement |
| `APPUSER.LANGUAGECODE` | lu seulement par les licences CRB [P `rech_orig` § 3.3] |
| `SYSTEMPROPERTY` | données de licence et de maintenance, non reprises |
| Compte `mayday` | compte de dépannage du distributeur : caché partout et refusé à l'ouverture de session [C] |

### 2.4 Hors périmètre (autres chantiers)

- **Barre de menus** (4 menus de l'original, menu Édition en extension, séparateurs, grisage des entrées non livrées, raccourcis), Affichage ▸ Masquer / Afficher la barre des modules, Ouvrir / Fermer les modules, retrait de l'Administrateur de la barre des modules, correction de `copyTable`, crochets `ch10aBeforeGo` / `ch10aAfterGo` de `go` : **CH-10 lot 1** (préalable de CH-08).
- **Export des données** (`DataExportDialog`, 3 exports CSV UTF-16) : **CH-10** lot 2. CH-08 fournit `rgCan` pour le droit `adminDataExport` de l'entrée ; CH-10 a déjà relevé que le droit `contactExport` y est sans effet (arbitrage 3) et que l'export des adresses contient le N° AVS et la date d'anniversaire (D-10.7).
- Fichier ▸ Importer les modèles ; protection des documents Bâtiment dans le Devis, le contrôle des coûts et l'eCCC (`ecCanEdit`) ; verrou d'ouverture : **CH-10** (lots 2 et 3).
- Fichier ▸ Importer des vCards, Importer des adresses ; export vCard : **CH-04** (qui lira `ch08cVcardCharset()`).
- Réglages ▸ Emplacements des modèles et des documents externes (masqué au bureau) : **CH-13**.
- Catégories de l'Administrateur elles-mêmes (Plans comptables, Genres d'affaires…) : **CH-06**. CH-08 ne fait que filtrer la liste des catégories selon les droits et en retirer « Taux de TVA ».
- Choix du modèle selon la langue des documents (`SelectTemplateDialog`) : **CH-09**, qui lira `ch08cDocLang()`.
- TVA 8.1 codée en dur dans le Devis et le contrôle des coûts : **CH-02**, **CH-07** / **CH-01** (§ 8).

### 2.5 Place et accès

- **Original** [P] : barre de menus native (sur macOS en haut de l'écran), fenêtre d'ouverture de session avant la fenêtre principale.
- **DeltaSub** [C] : barre de menus de CH-10 dans l'en-tête `#top` (`<nav id="ch10a-mb">`, `spec_19` § 4.1.1) ; ses entrées Réglages et Aide appellent CH-08 ; commandes de session par double-clic sur l'indicateur `#net` ; fenêtre d'ouverture de session par-dessus l'écran de démarrage `#boot` quand l'authentification est active.

---

## 3. Modèle de données

### 3.1 Collections existantes (reprises de Deltaproject)

| Collection | Champs lus / écrits par CH-08 | Identifiant | Lecture |
|---|---|---|---|
| `appuser` | `ID`, `USERID`, `NAME`, `ISENABLED`, `INITIALS`, `PHONE`, `EMAIL`, `JOBTITLE`, `JOBFUNCTION` (`LANGUAGECODE` conservé tel quel ; ni `PASSWORD` ni `LOGIN*` : `SKIP_COLUMNS`) | `DS.newIds('appuser')` | `DS.all`, `DS.get` |
| `appuser_appcompanyrole` | `APPUSER_ID`, `APPCOMPANYROLES_ID` | **clé composée** `<APPCOMPANYROLES_ID>-<APPUSER_ID>` (ex. « 201-2753 ») | `DS.by(…,'APPUSER_ID',id)` |
| `appuser_staff` | `APPUSER_ID`, `STAFFS_ID` | `<APPUSER_ID>-<STAFFS_ID>` (ex. « 2752-2751 ») | `DS.by(…,'APPUSER_ID',id)` |
| `appcompanyrole` (fonctions) | `ID`, `NAMEGE`, `NAMEFR`, `NAMEIT`, `NAMEEN` | `DS.newIds('appcompanyrole')` | `DS.all` |
| `appcompanyrole_approle` | `APPCOMPANYROLE_ID`, `APPROLES_ID` | `<APPCOMPANYROLE_ID>-<APPROLES_ID>` (ex. « 201-301 ») | `DS.by(…,'APPCOMPANYROLE_ID',id)` |
| `approle` (jeux de privilèges) | `ID`, `NAMEGE/FR/IT/EN`, `RIGHTS` (« m,i;m,i;… ») | `DS.newIds('approle')` | `DS.all` |
| `setting` | `ID`, `SETTINGTYPE` (0 standard, 1 général, 2 adresses), `SETTINGNAME`, `SETTINGVALUE` (texte ; booléens « [YES] » / « [NO] ») | `DS.newIds('setting')` à la création d'un réglage manquant | `hfSet(name)` (existant) |

[P] La clé composée des tables de liaison est celle de `import_deltaproject` : valeurs des champs `*_ID` jointes par « - » dans l'ordre alphabétique des noms de champs (`serveur_deltasub.py`, « tables de liaison sans ID ») ; vérifiée sur les 5 + 10 + 19 liaisons de la base de test. DeltaSub **doit** créer ses liaisons avec la même clé, sinon un ré-import les dédoublonnerait mal.

**Au bureau** [P base de test] : 11 comptes (8 actifs, dont les internes 1 `admin` et 2 `mayday`), 4 fonctions, 5 liaisons fonction-jeu, 20 jeux, 10 liaisons utilisateur-fonction, 19 liaisons utilisateur-collaborateur, 28 réglages. `INITIALS`, `PHONE`, `EMAIL`, `JOBTITLE`, `JOBFUNCTION` vides pour les 11 comptes ; `NAME` rempli, **d'un seul mot** pour les 11 (`droits_ctl.py`, nombre de mots seulement). Premiers identifiants sur une copie fraîche (aucun compteur `next_id:`) : `appuser` **3352**, `approle` **352**, `appcompanyrole` **302**, `setting` **852**, `staff` **3102**, `contact` **12852**, `contactowner` **9702**.

### 3.2 Collection nouvelle `appusersignature` (lot 3)

| Champ | Contenu |
|---|---|
| `ID` | `APPUSER.ID` (un enregistrement par compte) |
| `USERID` | copie de `APPUSER.USERID` (lisibilité) |
| `DATA` | `data:image/png;base64,…` |
| `SIZE` | taille du fichier en octets (≤ 200 000) |
| `UPDATED` | « AAAA-MM-JJ » |

[C] L'original copie le PNG dans `DELTAprojectFiles/ProjectDocuments/Images/Signatures/signature_<USERID>.png` [P `app.doc.Settings.getSignaturePathAndFilename@5-41`] ; DeltaSub n'a pas de dépôt de fichiers partagé indépendant de CH-03 : une collection suffit (quelques dizaines de Ko par compte, 0 signature au bureau). Elle est **protégée** au ré-import (§ 3.6) et n'est pas « lourde » (chargée au démarrage).

### 3.3 Réglages (`setting`) utilisés par CH-08

| Nom | Type | Défaut si absent [P `Settings.initSettings@0-490`] | Bureau [P] | Effet dans DeltaSub (après CH-08) |
|---|---|---|---|---|
| `genCountryPos` | 1 | CH | CH | pays et indicatif des nouvelles adresses ; « Pays » des Paramètres système |
| `mainCurrency` | 1 | CHF | CHF | `hfCur` (existant) |
| `genVatRatePos` | 1 | — (non créé) | 8.1 | `vatDefault`, Soumission (existants) ; Devis et CoCo : § 8 |
| `displayNameFormat` | 2 | [YES] | [NO] | ordre par défaut de `ownerName` : [YES] « NAME1 NAME2 », [NO] « NAME2 NAME1 » |
| `displayPhoneNumberFormat` | 2 | [YES] | [NO] | `phone()` : indicatif du pays affiché |
| `displayPhoneAreaPrefix` | 2 | [YES] | [YES] | `phone()` : « (0) » |
| `countryCodeSeparator` | 2 | « ␣ » | « / » | `phone()` : séparateur 1 |
| `areaCodeSeparator` | 2 | « ␣ » | « ␣ » | `phone()` : séparateur 2 |
| `areBauadDocsLocked` | 1 | [NO] | [NO] | `svCanEdit` (existant) ; CoCo, Devis, eCCC : CH-10 |
| `isModuleFormVisible` | 1 | [YES] s'il existe des documents | [YES] | `ctForms`, `ivFormVisible`, `fcForms`, `feForms` (existants) ; domaine « Messages brefs » (§ 4.10.3) |
| `isProjectMenuFilesVisible` | 1 | [YES] s'il existe des fichiers d'affaire | [NO] | domaine « Fichiers » (CH-13), entrée « Emplacements … » (CH-13) |
| `standardFontName` / `standardFontSize` | 1 | « » / 12 | AkkuratLL-Light / 8 | enregistrés ; aucun lecteur dans DeltaSub (anciens modèles : CH-12 / CH-14) |
| `standardTableFontName/Size`, `…BoldName/Size`, `…SmallName/Size` | 1 | valeurs de la police standard | Akkurat-Light 8 ; AkkuratLL-Bold 8 ; AkkuratLL-Regular 8 | idem |

Règles de lecture [C] : `ch08aBool(nom, défaut)` = `/YES/i.test(v)` si la valeur existe, sinon le défaut de l'original ; `ch08aSep(nom)` = la valeur, ou « ␣ » si elle est vide ou absente (l'original enregistre « ␣ » pour un séparateur interurbain vide [P `SetPhoneNumberFormatDialog`]). Écriture : `ch08aSettingOps([[type,nom,valeur],…], bseqs)` → opérations (réglage existant : `{...s,SETTINGVALUE}` avec le `bseq` lu à l'ouverture du sous-dialogue ; réglage manquant : nouvel `ID`, `SETTINGTYPE` du tableau ci-dessus) ; **un seul `DS.commit` par sous-dialogue**.

Réglages obsolètes présents au bureau (`genCurrencyPos`, `chCurrencyPos`, `euroCurrencyPos`, `lockAdrImport`, `lockAdrMatch`, `lockRemoveAllAdrs`, `lockExportAllAddresses`, `AddressImportSettings`) : ni lus ni écrits par CH-08.

### 3.4 Droits

**Table `CH08A_RIGHTS`** (lot 1) : les 66 valeurs de `Rights$Right` **dans l'ordre de l'énumération**, `[clé, 'module,id', libellé FR]`, tirées de `ch/CH-08/rights_enum.tsv` (identique à `exist/rights66.tsv`) :

| n° | Clé | Code | Libellé (`Strings.db (Rights\|clé)`) | Std | Application dans DeltaSub (lot, effet) |
|---:|---|---|---|:-:|---|
| 0 | superadmin | 0,0 | Superadministrateur | | donne tout ; ouverture auto de l'assistant (3) |
| 1 | generalUnlockDocuments | 100,0 | Paramètres : Déverrouiller les documents des autres utilisateurs | ✔ | Soumission (`svRight`, existant) ; CH-10 |
| 2 | admin | 1,0 | Menu Réglages-> Administrateur : lecture-écriture | | Réglages ▸ Administrateur, Paramètres système, [Ancien document] (1) ; vue `config` (2) |
| 3 | adminGeneral | 1,1 | Menu Paramètres système: lecture-écriture | ✔ | boutons Pays, Monnaie, TVA, Protection et tous ceux de [Ancien document] (1) ; serveur (4) |
| 4 | adminAddresses | 1,2 | Paramètres d'adresses: lecture-écriture | | boutons Personne, Téléphone (1) ; catégories Adresses - Propriétés, Adresses - Statuts (1) ; serveur (4) |
| 5 | adminBkp | 1,3 | Paramètres plans comptables: lecture-écriture | | catégorie Plans comptables (CH-06 ; filtre du lot 1 prêt) |
| 6 | adminProjects | 1,4 | Paramètres d'affaires: lecture-écriture | | catégories Phases, Activités, Frais standard, Gabarits de facturation, Comparaison des offres, Tâches (1) |
| 7 | adminRates | 1,5 | Paramètres heures prévues: lecture-écriture *(sic)* | ✔ | catégorie **Tarifs de facturation** (1) |
| 8 | adminTargetTime | 1,6 | Paramètres tarifs de facturation: lecture-écriture *(sic)* | ✔ | catégorie **Heures prévues** (1) |
| 9 | adminPublicHolidays | 1,8 | Paramètres jours fériés: lecture-écriture | ✔ | catégorie Jours fériés (1) |
| 10 | adminQRBillAccounts | 1,9 | Paramètres Comptes pour QR-facture | | catégorie Comptes pour QR-facture (1) |
| 11 | adminDataExport | 1,7 | Menu Exporter les données: lecture-écriture | ✔ | Réglages ▸ Export des données (1, via CH-10) |
| 12 | contact | 3,0 | Module Adresses: afficher le module (barre latérale) | ✔ | vues `adr-*` (2) |
| 13 | contactNew | 3,1 | Module Adresses: créer | ✔ | gardes « Nouveau », « Nouvelle adresse » (2) |
| 14 | contactEdit | 3,2 | Module Adresses: modifier | ✔ | gardes « Modifier », « Modifier l'adresse », « Modifier l'entité » (2) ; fiche en lecture seule : non livré |
| 15 | contactDelete | 3,3 | Module Adresses: effacer | ✔ | gardes « Supprimer l'entité », « Supprimer l'adresse » (2) |
| 16 | contactExport | 3,4 | Module Adresses: exporter | ✔ | export vCard (CH-04) ; sans effet dans Export des données [P] |
| 17 | contactPropertyNew | 3,5 | Module Adresses: attribuer les propriétés | ✔ | garde « Ajouter des propriétés … » (2) |
| 18 | contactPropertyDelete | 3,6 | Module Adresses: supprimer les propriétés | ✔ | garde « Retirer la propriété des adresses sélectionnées » (2) |
| 19 | contactDeleteAll | 3,7 | Module Adresses: effacer tous les contacts | ✔ | jamais testé [P] |
| 20 | contactImport | 3,8 | Module Adresses: importer | ✔ | Fichier ▸ Importer des vCards, Importer des adresses (1, via CH-04) |
| 21 | contactGroupView | 3,9 | Module Adresses: groupes d'adresses : lecture seulement | ✔ | jamais testé [P] |
| 22 | contactGroupNew | 3,10 | Module Adresses: groupes d'adresses : lecture-écriture | ✔ | gardes « Nouveau », « Modifier le groupe » de `adr-groupes` (2) |
| 23 | contactGroupDelete | 3,11 | Module Adresses: supprimer les groupes d'adresses | ✔ | garde « Supprimer le groupe » (2) |
| 24 | project | 4,0 | Module Affaires: afficher le module (barre latérale) | ✔ | vues `aff-*` (2) |
| 25 | projectDefinition | 4,1 | Module Affaires: gestion fenêtre édition : lecture-écriture | ✔ | gardes « Nouvelle affaire », « Editer l'affaire », « Supprimer l'affaire » (grisés) (2) |
| 26 | projectEdit | 4,2 | Module Affaires: subdivisions par ouvrages : lecture-écriture | ✔ | jamais testé [P] |
| 27 | projectEditAll | 4,20 | Module Affaires: afficher toutes les affaires | ✔ | vue `aff-toutes` (2) |
| 28 | projectSubProjects | 4,18 | Module Affaires: subdivisions: lecture-écriture | ✔ | garde « Configurer la subdivision par ouvrages et localisations » (2) |
| 29 | projectTeam | 4,3 | Module Affaires: intervenants : lecture-écriture | ✔ | gardes bouton « Intervenants » (grisé) et « Attribuer les intervenants » (2) |
| 30 | projectBkp | 4,4 | Module Affaires: plan comptable : lecture-écriture | ✔ | Devis, CoCo : non livré (CH-02, CH-07) |
| 31 | projectUseZones | 4,22 | Module Affaires: subdivisions par affectations : lecture-écriture | ✔ | entrée absente de DeltaSub (CH-05) |
| 32 | projectRooms | 4,23 | Module Affaires: subdivisions par locaux : lecture-écriture | ✔ | entrée absente de DeltaSub (CH-05) |
| 33 | projectPhases | 4,5 | Module Affaires: phases : lecture-écriture | ✔ | garde « Configurer les phases » (2) |
| 34 | projectActivities | 4,6 | Module Affaires: activités : lecture-écriture | ✔ | gardes « Configurer les activités », « Attribuer les activités aux collaborateurs » (2) |
| 35 | projectRates | 4,7 | Module Affaires: tarifs facturation : lecture-écriture | ✔ | garde « Configurer les tarifs de facturation » (2) |
| 36 | projectTime | 4,8 | Module Affaires: analyse heures par affaire : lecture-écriture | ✔ | tuile Heures du Controlling : non livré (sans effet au bureau) |
| 37 | projectFiles | 4,21 | Module Affaires: documents externes : lecture-écriture | ✔ | domaine « Fichiers » (2, si CH-13 l'ajoute) |
| 38 | projectMemoranda | 4,9 | Module Affaires: Message bref : lecture-écriture | ✔ | domaines Documents, Messages brefs (2) |
| 39 | projectContacts | 4,10 | Module Affaires: Liste d'adresses par affaire : lecture-écriture | ✔ | domaines « Liste d'adresses » [D], « Entrepreneurs » (CH-05) (2) |
| 40 | projectTenderers | 4,11 | Module Affaires: listes de soumissionnaires : lecture-écriture | ✔ | domaine Soumissionnaires (2) |
| 41 | projectCosts | 4,13 | Module affaires: frais par affaire : lecture-écriture | ✔ | domaine Frais ; garde « Configurer les frais … » (CH-17) (2) ; tuile Frais : non livré |
| 42 | projectMeetings | 4,14 | Module Affaires: séances : lecture-écriture | ✔ | domaine Séances (2) |
| 43 | projectPlans | 4,19 | Module Affaires: liste des plans et distribution : lecture-écriture | ✔ | domaines Liste des plans, Liste de distribution (2) |
| 44 | projectInvoices | 4,15 | Module Affaires: factures par affaire : lecture-écriture | ✔ | jamais testé [P] : le domaine Factures reste toujours visible |
| 45 | projectTasks | 4,16 | Domaine Affaires: tâches par affaire: lecture-écriture | ✔ | domaine Tâches (2) |
| 46 | projectContracts | 4,17 | Module Affaires: contrats dhonoraires : lecture-écriture *(sic)* | ✔ | domaine Contrats honoraires (2) |
| 47 | projectPlanning | 4,24 | Module DELTAplanning: afficher la planification RH | | domaine Planification RH (2) ; `plCan` (existant) |
| 48 | projectPlanningAnalyze | 4,25 | Module DELTAplanning: afficher l'analyse d'affaire | | domaine Analyse de planification RH (2) ; `plCan` |
| 49 | staff | 6,0 | Module Collaborateurs: afficher le module (barre latérale) | | vues `collab-*` et `mg-collab` (2) |
| 50 | staffNew | 6,1 | Module Collaborateurs: créer | | garde « Ajouter un collaborateur » (grisé) (2) |
| 51 | staffEdit | 6,2 | Module Collaborateurs: modifier | | garde « Editer le collaborateur » (grisé) (2) |
| 52 | staffDelete | 6,3 | Module Collaborateurs: effacer | | garde « Supprimer le collaborateur » (grisé) (2) |
| 53 | expenses | 11,0 | Module Frais: afficher le module (barre latérale) | ✔ | vues `frais*` (2) |
| 54 | time | 7,0 | Module Heures: lecture-écriture | ✔ | vues `h-*` (2) |
| 55 | tasks | 13,0 | Module Tâches: lecture-écriture | ✔ | vues `taches*` (2) |
| 56 | honorarFeeCalculation | 14,0 | Module Honoraires: calcul des honoraires : lecture-écriture | | domaine Calcul des honoraires / Offres d'honoraires (2) |
| 57 | honorarImplementation | 14,1 | Module Honoraires: Avancement des prestations: lecture-écriture | | domaine Avancement des prestations (2) |
| 58 | invoices | 12,0 | Module Factures: afficher le module (barre latérale) | | vues `fact-*` (2) |
| 59 | management | 8,0 | Module Management: afficher le module (barre latérale) | | vues `mg*` (2) |
| 60 | managementProject | 8,1 | Module management: Analyser les affaires | | jamais testé [P] |
| 61 | managementStaff | 8,2 | Module management: Analyser les collaborateurs | | catégories de Management ▸ Collaborateurs : non livré (sans effet au bureau) |
| 62 | managementPlanning | 8,3 | Module DELTAplanning: Planification RH dans Management | | `plCan` (existant) |
| 63 | design | 9,0 | Module Modèles: afficher le module (barre latérale) | ✔ | vues `tpl-*` (2) ; Importer les modèles (1, via CH-10) |
| 64 | userAdmin | 2,0 | Menu Gestion des utilisateurs: lecture-écriture | (internes) | Réglages ▸ Gestion des utilisateurs (1) ; serveur (4) |
| 65 | construction | 10,0 | Module Affaires: Bâtiment lecture-écriture | ✔ | vues `coplan`, `devis*`, `soum*`, `coco*` et 4 domaines Bâtiment (2) |

« Std » : présent dans le jeu 301 Standard du bureau (46 droits). Libellés « *(sic)* » : coquilles ou inversions de l'original, reproduites.

**Fonctions du moteur** (lot 1, pures sauf mention) :
- `ch08aRightsParse(s)` → `Set` de codes normalisés « m,i » : découpe sur « ; », puis sur « , », `trim`, `parseInt` ; élément à moins de 2 parties ignoré ; code inconnu **conservé** dans l'ensemble mais sans effet ; nombre invalide **ignoré** [C] (l'original lève une `NumberFormatException` sur « 3,x » [P `rech_orig` § 17] : DeltaSub est tolérant).
- `ch08aRightsStr(set)` → codes **connus** dans l'ordre de l'énumération, chacun suivi de « ; » [P `Rights.toString@0-74`] ; les codes inconnus sont perdus à la réécriture, comme dans l'original.
- `ch08aRights(u)` → union des `RIGHTS` des jeux de toutes les fonctions de `u` ; `null` si `u` n'a aucune fonction [P `Security.setAppUser@0-112`]. Mémorisé par (`u.ID`, `DS.seq`).
- `ch08aCan(clé, u = ME.u)` : 1. aucun enregistrement `approle` → `true` (**amorçage DeltaSub** [C] : une base vide ne verrouille personne) ; 2. pas d'utilisateur → `false` ; 3. `clé === 'userAdmin'` et `USERID` ∈ {`admin`, `mayday`} → `true` ; 4. `ch08aRights(u)` nul → `false` ; 5. sinon `code ∈ union` ou `'0,0' ∈ union` [P `Security.hasRight@0-57`]. Clé inconnue → `false`.
- **`rgCan(x, u = ME.u)`** (contrat de `spec_19` § 4.1.3, appelé par `ch10aCan`) : `x` est une clé (« admin ») **ou** un code (« 1,0 », espaces tolérés) ; un code est ramené à sa clé par `CH08A_RIGHTS` ; code inconnu → `false` ; puis `ch08aCan`. `spec_19` l'attribuait à « CH-08 lot 5 » : c'est le lot 1 de ce cahier (numérotation révisée), sans effet sur CH-10 qui le résout par `typeof`.
- Moment [P] : l'original calcule les droits à l'ouverture de session et construit menus et barre des modules une fois. DeltaSub [C] : la barre de CH-10 évalue ses entrées à chaque ouverture (`ch10aModel`), la barre des modules est reconstruite au changement d'utilisateur et au rechargement (§ 7, E3).

**Effet au bureau** [P `droits_ctl.py`] :

| Compte | Droits effectifs | `userAdmin` | `admin` | `staff` | Sections de la barre des modules | Domaines d'affaire | Catégories de l'Administrateur |
|---|---|:-:|:-:|:-:|---:|---:|---:|
| 1 (`admin`), 2 (`mayday`) | aucune fonction | oui | non | non | 0 | 3 (Intervenants, Notes, Factures) | 0 |
| 2752 (superadmin) | 48 codes | oui | oui | oui | 10 | 21 | 12 |
| 2753, 2754, 2755, 3001, 3201, 3251, 3301, 3351 (Standard) | 46 codes | non | non | non | 7 | 17 | 3 |

### 3.5 Tables du serveur (lot 4, hors de `rec`)

Jamais servies par `/api/snapshot` ni `/api/changes` (qui ne lisent que `rec`).

```sql
CREATE TABLE IF NOT EXISTS auth_pw(appuser_id TEXT PRIMARY KEY, hash TEXT NOT NULL, changed TEXT);
CREATE TABLE IF NOT EXISTS auth_session(token_hash TEXT PRIMARY KEY, appuser_id TEXT NOT NULL, userid TEXT,
    ip TEXT, ua TEXT, created REAL, last REAL, remember INTEGER, revoked TEXT);
CREATE TABLE IF NOT EXISTS auth_fail(userid TEXT, ts REAL);
```

- **Empreinte** : `pbkdf2_sha256$600000$<sel base64>$<empreinte base64>` ; sel `secrets.token_bytes(16)`, `hashlib.pbkdf2_hmac('sha256', mdp.encode('utf-8'), sel, 600000, 32)` ; comparaison `hmac.compare_digest`. Le nombre d'itérations est lu dans l'empreinte (relèvement futur possible sans migration).
- **Jeton** : `secrets.token_urlsafe(32)` remis au navigateur dans le cookie ; seul son SHA-256 (hexadécimal) est stocké (`token_hash`).
- **`revoked`** : `null` (session valide) ou le motif de fin : `reprise` (reprise sur un autre poste), `rejet` (Rejeter un utilisateur), `mdp` (mot de passe réinitialisé par l'administrateur). Une session révoquée est gardée 24 h pour renvoyer son motif, puis purgée.
- **`meta`** : `auth_enabled` (« 0 » par défaut, absent = « 0 »), `auth_first_free` (« 1 » par défaut : première connexion libre, décision n° 4).
- **Aucune donnée de Deltaproject** n'entre dans ces tables : `SKIP_COLUMNS` (`PASSWORD`, `LOGINLOCALUSER`, `LOGINLOCALHOST`, `LOGINTIMESTAMP`) n'est pas modifié.

### 3.6 Reprise Deltaproject (`--force`) : collections protégées (lot 1, serveur)

Constat [P `serveur_deltasub.py` l. 42, 56-61, 253-255] : les 7 collections du § 3.1 ne sont ni dans `PROTECTED` ni dans `PROTECTED_IF_EDITED` ; l'`UPDATE … SET val=NULL` les efface, puis les CSV les recréent. Tout compte, fonction, jeu ou réglage saisi dans DeltaSub est perdu (défaut **déjà présent** pour `genVatRatePos` et `ds.tplGroup.*`).

Règle CH-08 [C] :
- `CH08_PIT = {"appuser","appuser_staff","appuser_appcompanyrole","appcompanyrole","appcompanyrole_approle","approle","setting"}` (« protégées si touchées ») : un enregistrement dont le dernier auteur n'est pas l'import (`who ≠ "import Deltaproject"`), **vivant ou supprimé**, est conservé tel quel ; la ligne CSV de même identifiant est ignorée. Les enregistrements jamais touchés dans DeltaSub sont rafraîchis depuis Deltaproject (qui reste en service).
- Mise en œuvre minimale : l'`UPDATE` exclut déjà `PROTECTED_IF_EDITED` touchés (`NOT (t IN pie AND who <> IMPORT_WHO)`) : `pie` devient `sorted(PROTECTED_IF_EDITED | CH08_PIT)` (ancre S2) ; puis `kept |= _ch08_touched(c)` (ancre S3), où `_ch08_touched` rend les `(t, id)` de `CH08_PIT` avec `who ≠ IMPORT_WHO`, y compris les enregistrements supprimés (`val IS NULL`). Ainsi une liaison utilisateur-fonction retirée dans DeltaSub **ne revient pas** au ré-import.
- `PROTECTED |= {"appusersignature"}` (collection propre à DeltaSub, sans CSV).
- **Collision d'identifiant** (Deltaproject attribue aussi des `ID`) : si un enregistrement conservé de `appuser` (resp. `setting`) a un `USERID` (resp. `SETTINGNAME`) différent de la ligne CSV de même `ID`, afficher « ⚠ <collection> <id> NON repris : l'identifiant est déjà pris dans DeltaSub (<champ> DeltaSub <a>, Deltaproject <b>). » (ancre S4, sur le modèle de `_autre_ref`). Les tables de liaison ont des clés composées issues du contenu : pas de collision possible.
- Les compteurs `next_id:` de ces collections restent effacés à la reprise, comme aujourd'hui : `new_ids` les recalcule sur tous les identifiants de `rec` (supprimés compris).

### 3.7 Clés locales (`localStorage`, par poste, lecture et écriture sous `try`)

| Clé | Lot | Contenu |
|---|---|---|
| `ds_user` (existante) | — | `APPUSER.ID` du poste ; en mode avec mot de passe, écrite par `ch08dLogin` depuis la session |
| `ds_ch08b_filter` | 2 | « 1 » = Afficher uniquement les utilisateurs activés, « 0 » = tout (défaut) [P `userAdminDialog.Preferences`] |
| `ds_ch08c_prefs` | 3 | JSON des préférences locales : `{lang:{all,def,vis}, text:{font,size}, table:{font,style,size,vlines,hlines,zebra,row}, vcard}` |
| `ds_ch08d_login` | 4 | `{userid, remember}` ; **jamais** le mot de passe ni une empreinte |

### 3.8 Écritures groupées et concurrence

- Un seul `DS.commit` par action : un sous-dialogue des Paramètres système (1 à 4 réglages) ; un OK de `AppUserDialog` (compte + liaisons ajoutées et supprimées) ; un OK de fonction ou de jeu ; une suppression (enregistrement + ses liaisons + signature) ; un OK des Préférences (le seul enregistrement `appuser`) ; l'assistant entier.
- `bseq` lu à l'ouverture du dialogue (`(DS.S[t]||{})[String(id)]||0`) et passé sur l'opération de l'enregistrement édité ; conflit 409 : toast de `DS.commit`, dialogue laissé ouvert.
- Relecture au moment de l'OK : unicité de l'USERID, fonction ou jeu encore utilisé, compte connecté.

---

## 4. Écrans et dialogues

### 4.1 Entrées de CH-08 dans la barre de menus de CH-10 (contrat `rg*`)

La barre est construite par CH-10 lot 1 (`spec_19` § 4.1) : libellés `Strings.db (deltaproject|AppForm)`, ordre, séparateurs, conditions ; une entrée dont la condition est vraie mais dont la fonction manque est **grisée avec la mention « CH-08 »**. CH-08 ne modifie **aucune** ligne de CH-10 : il déclare, en fonctions de haut niveau, les noms que `CH10A_MENU` résout par `typeof window[nom]==='function'`.

| Menu ▸ entrée (CH-10) | Condition (CH-10, [P] `AppForm.initMenu`) | Nom attendu | Déclaré par | Corps |
|---|---|---|---|---|
| *(toutes les conditions de droit)* | `ch10aCan(code)` = `rgCan(code)` si elle existe, sinon vrai | `rgCan(x)` | lot 1 | § 3.4 |
| Réglages ▸ Configurer un collaborateur … | `ME.u.USERID === 'admin'` | `rgEmployees()` | lot 3 | `ch08cEmployees()` (§ 4.14) |
| Réglages ▸ Administrateur … | droit `admin` (1,0) | — (`go('config')`, CH-10) | — | vue `config` ; catégories filtrées par le lot 1 (§ 4.5.4) |
| Réglages ▸ Gestion des utilisateurs … | droit `userAdmin` (2,0) | `rgUserAdmin()` | lot 2 | `ch08bUserAdmin()` (§ 4.7) |
| Réglages ▸ Paramètres système … | droit `admin` | `rgSystemPreferences()` | lot 1 | `ch08aSysPrefs()` (§ 4.3) |
| Réglages ▸ Paramètres système … [Ancien document] | droit `admin` | `rgSystemLegacyPreferences()` | lot 1 | `ch08aLegacyPrefs()` (§ 4.4) |
| Réglages ▸ Préférences … | toujours | `rgPreferences()` | lot 3 | `ch08cPreferences()` (§ 4.12) |
| Aide ▸ Aide | toujours | `rgHelp()` | lot 1 | `ch08aHelp()` (§ 4.6) |
| Aide ▸ A propos de … | toujours | `rgAbout()` | lot 1 | `ch08aAbout()` (§ 4.6) |
| *(crochet de `go`)* | `ch10aBeforeGo(id,arg)` appelle `rgBeforeGo(id,arg)` s'il existe ; `false` annule la navigation | `rgBeforeGo(id,arg)` | lot 2 | § 4.10.1 |

- Chaque `rg*` est une **enveloppe d'une ligne** (`function rgUserAdmin(){ return ch08bUserAdmin(); }`) : le préfixe `rg` est réservé au contrat avec CH-10 (0 déclaration dans `DeltaSub.html` et `ch/*/`, `crit/prefixes.py`), les fonctions de travail gardent le préfixe du lot.
- Effet au bureau quand le lot 1 est intégré [P `droits_ctl.py`] : 2752 voit Administrateur, Paramètres système et [Ancien document] ; les 8 comptes Standard ne voient dans Réglages qu'Export des données (CH-10) et Préférences ; le compte `admin` (ID 1) voit Configurer un collaborateur, Gestion des utilisateurs et Préférences (entrées grisées « CH-08 » jusqu'aux lots 2 et 3).
- Les entrées « Emplacements des modèles … » (CH-13), « Importer … » (CH-04) et « Export des données … » (CH-10 lot 2) ne dépendent de CH-08 que par `rgCan`.

### 4.2 Commandes de session : indicateur réseau `#net` (lots 2 et 4, extension)

La barre de CH-10 ne prévoit pas d'entrée de session (l'original n'a que « Quitter », omis). L'indicateur `#net` (« ● Base du bureau — <nom> ») porte déjà « Double-clic : changer d'utilisateur » (`$('#net').ondblclick=()=>chooseUser(true);`) : CH-08 garde ce geste.

| Mode | Double-clic sur `#net` | Lot |
|---|---|---|
| sans mot de passe (défaut) | « Qui utilise ce poste ? » (§ 4.11) ; Échap ou « Annuler » gardent l'utilisateur courant | 2 |
| avec mot de passe | menu (`popMenu` ancré sur `#net`) : « Modifier le mot de passe … » (`ch08dPasswordDlg('change')`, absent pour `mayday`) ; « Fermer la session » (`ch08dLogout()`) | 4 |

L'infobulle de `#net` (fixée par `NET.ok`, hors chantier) n'est pas modifiée : en mode avec mot de passe elle reste « Double-clic : changer d'utilisateur », ce qui reste exact (fermer la session puis se reconnecter).

### 4.3 Paramètres système (lot 1, `ch08aSysPrefs`)

#### 4.3.1 Fenêtre

`dialog({title:'Paramètres système', width:'580px', buttons:[{t:'Fermer'}]})`. Trois rubriques (titre en gras), chaque ligne : étiquette à droite | texte en lecture seule | bouton « … » (`ibtn({label:'…'})`). Après l'OK d'un sous-dialogue, la ligne est relue (`setInfo`). Le lot 4 ajoute une quatrième rubrique par `ch08dSysRubric()` (§ 4.18).

| Rubrique | Ligne | Texte affiché | Bouton actif si | Sous-dialogue |
|---|---|---|---|---|
| Général | Pays | nom FR du pays de `genCountryPos` (`CH08A_COUNTRIES`) — bureau : « Suisse » | `adminGeneral` | 4.3.2 |
| | Monnaie standard | `mainCurrency` — « CHF » | `adminGeneral` | 4.3.3 |
| | Taux de TVA | `genVatRatePos` + « ␣% » — « 8.1 % » | `adminGeneral` | 4.3.4 |
| Adresses | Personne | « Nom et prénom » si `displayNameFormat` = [YES], sinon « Prénom et nom » — « Prénom et nom » | `adminAddresses` | 4.3.5 (type 1) |
| | Téléphone | `ch08aPhoneStr('+41','012','345 67 89', …réglages)` — « 012 345 67 89 » | `adminAddresses` | 4.3.6 |
| Bâtiment | Protection | « Seulement des documents personnels sont éditables. » si `areBauadDocsLocked` = [YES], sinon « Les documents sont éditables par tous les utilisateurs. » | `adminGeneral` | 4.3.5 (type 2) |

[P] `SystemPreferencesDialog.<init>@57-294`, `@453-516`. Le menu exige `admin` ; sans `adminGeneral` ou `adminAddresses`, la fenêtre s'ouvre mais les boutons concernés sont inactifs.

**`CH08A_COUNTRIES`** [C] : `[[code2, indicatif, nom FR], …]` pour les 246 pays de `/Applications/DELTAproject.app/Contents/app/rsrc/app/lists/countries.csv` (colonnes 2, 3 et 5 ; données publiques ISO et UIT), écrit une fois dans le fichier du lot par un script du chantier (`build_pays.py`, lecture seule de l'application). `ch08aCountry()` = `genCountryPos` ou « CH » ; `ch08aDial(code)` = indicatif du pays (« +41 » pour CH) ; `ch08aCountryName(code)`.

#### 4.3.2 « Préférences » (`SetCountryDialog`, titre *sic*)

- « Pays » : texte en lecture seule + bouton ▾ (`DialogIcon.suggestion`) : Suisse, France, Italie, Allemagne, séparateur, « Autres … » [P `CountryPopup.getPopupMenu`].
- « Autres … » → « Navigateur de pays » : champ de recherche (filtre sur le code et le nom), tableau « Code » | « Nom » (code à 2 lettres [D] ; `CountryTableModel` a deux colonnes « Code »), OK actif avec une sélection, double-clic = OK.
- OK actif si un code est choisi ; enregistre `genCountryPos` (type 1) = code à 2 lettres.

#### 4.3.3 « Monnaie standard » (`SetMainCurrencyDialog`)

- « Monnaie standard » : champ de 3 caractères + ▾ : CHF, EUR, USD [P `Currency.getCurrencies`].
- OK actif si le texte (`trim`) n'est pas vide ; enregistre `mainCurrency` = texte `trim`.

#### 4.3.4 « Définir le taux de TVA » (`SetVatDialog`)

- « Taux de TVA » + « % » (disposition de `admVat`).
- OK actif si la valeur est numérique (`hfNum`) et comprise entre 0 et 100 exclu (règle de `admVat` [C] ; l'original n'a aucune plage, E8) ; enregistre `genVatRatePos` = nombre normalisé (`String(x)`, ex. « 8.1 »).
- `admVat` n'est plus atteignable (catégorie retirée de l'Administrateur, § 4.5.4) ; il reste dans le fichier.

#### 4.3.5 Réglages oui / non (`SetBooleanSettingDialog`)

Deux boutons radio, OK **toujours actif** [P].

| Type | Titre | Oui | Non | Réglage | Après OK |
|---|---|---|---|---|---|
| 1 | Paramètres | Nom et prénom | Prénom et nom | `displayNameFormat` (2) | — |
| 2 | Paramètres de protection des documents | Lecture et écriture: auteur uniquement. | Lecture et écriture: tous les utilisateurs. | `areBauadDocsLocked` (1) | — |
| 3 | DESIGN formulaires et documents | Affiché | Masqué | `isModuleFormVisible` (1) | si la valeur change : Information « DeltaSub doit être redémarré. » |
| 4 | Domaine d'affaire Fichiers | Affiché | Masqué | `isProjectMenuFilesVisible` (1) | idem |

[P] `Strings.db (SetBooleanSettingDialog|dialogTitle1…4, yes1…4, no1…4)` ; message `Strings$Message.msgRestartAppNeeded` « DELTAproject doit être redémarré. », nom du produit remplacé par « DeltaSub » [C] (E9).

**Type 2, avertissement avant protection** [C, arbitrage 31, E-g] : si l'on passe de [NO] à [YES], `ch08aOrphanDocs()` compte les en-têtes Bâtiment (`costestimatedocument`, `costcontroldocument`, `costplanningdocument`, `devisdocument` : collections chargées au démarrage) dont `USERID` n'est pas vide et n'est l'`USERID` d'aucun `appuser`. S'il y en a, Avertissement Oui / Non avant l'enregistrement : « <n> documents Bâtiment ont pour auteur un nom d'utilisateur qui n'existe plus (<n1> devis, <n2> contrôles des coûts, <n3> estimations eCCC, <n4> soumissions) : avec cette protection, plus personne ne pourra les modifier. Enregistrer quand même ? » (les parties à 0 sont omises). Non → le dialogue reste ouvert. Au bureau : **41** (25 devis, 16 contrôles des coûts). L'original ne prévient pas [P `SetBooleanSettingDialog`].

#### 4.3.6 « Préférences des numéros de téléphone » (`SetPhoneNumberFormatDialog`)

| Élément | Libellé | Règle |
|---|---|---|
| case | Afficher l'indicatif du pays | `displayPhoneNumberFormat` |
| case | Afficher l'indicatif (0) régional | `displayPhoneAreaPrefix` ; **active seulement si la première est cochée** |
| champ (1 car.) | Séparateur indicatif du pays | `countryCodeSeparator` |
| champ (1 car.) | Séparateur indicatif interurbain | `areaCodeSeparator` |
| Exemple | 3 champs modifiables « +41 », « 012 », « 345 67 89 » et le résultat en direct | `ch08aPhoneStr` |
| OK | | actif si le séparateur interurbain n'est pas vide **et** (case pays décochée **ou** séparateur pays non vide) |

Enregistrement des 4 réglages (type 2) en un seul `DS.commit` ; un séparateur interurbain vide est enregistré « ␣ » [P].

### 4.4 Paramètres système [Ancien document] (lot 1, `ch08aLegacyPrefs`)

Titre « Paramètres système [Ancien document] » (`dialogTitle` + `Strings$Label.legacyMenu` « ␣[Ancien document] »), bouton « Fermer » ; mêmes lignes « texte + … » ; **tous les boutons inactifs sans `adminGeneral`** [P `SystemLegacyPreferencesDialog.<init>@434-488`].

| Rubrique | Ligne | Texte (bureau) | Bouton |
|---|---|---|---|
| DESIGN formulaires et documents | Module DESIGN | « Affiché » | 4.3.5 type 3 |
| Police standard pour modèles | Police pour modèles | « AkkuratLL-Light, 8 » (gabarit « police, taille ») | `SetFontDialog` (`standardFontName`, `standardFontSize`) ; ligne inactive si le module DESIGN est masqué |
| Police standard des tableaux dans les documents | Standard | « Akkurat-Light, 8 » | idem (`standardTableFontName/Size`) |
| | Gras | « AkkuratLL-Bold, 8 » | idem (`…BoldName/Size`) |
| | Détails | « AkkuratLL-Regular, 8 » | idem (`…SmallName/Size`) |
| Domaine d'affaire Fichiers | Module Affaires: documents externes : lecture-écriture *(sic : libellé `projectFiles` de l'original)* | « Masqué » | 4.3.5 type 4 |

**« Définir la police standard »** (`SetFontDialog`) : « Style de police » (liste : polices distinctes des champs `police` des anciens modèles `modele` — `DS.need(['modele'])` —, plus les 5 valeurs actuelles, triées [C], arbitrage 20) ; « Taille » : 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 36 [P] ; OK écrit les deux réglages (type 1) en un `DS.commit`. Aucun module DeltaSub ne lit encore ces polices (§ 3.3).

### 4.5 Formats appliqués partout (lot 1)

#### 4.5.1 Téléphone : `ch08aPhoneStr(pays, ind, num, showC, showP, s1, s2)` (pure)

[P `Contact.phoneToString@0-164`, valeurs exécutées sur le code original, `rech_orig` § 17] ; les trois valeurs sont d'abord `trim` [C] :
1. numéro vide → « » ;
2. `showC` et pays non vide → pays ;
3. indicatif non vide : si déjà du texte → `s1` ; si `showC`, pays non vide, pays ∉ {« +39 », « 0039 »} et indicatif commençant par « 0 » → « (0) » si `showP`, puis l'indicatif sans son 0 ; sinon l'indicatif tel quel ;
4. si déjà du texte → `s2` ; puis le numéro.

`ch08aPhone(c,n)` choisit les champs (1 : `PHONECOUNTRY1/PHONEAREA1/PHONENUMBER1` ; 2 : `…2` ; 3 : `FAXCOUNTRY1/FAXAREA1/FAXNUMBER1`, comme `phone()`), lit les 4 réglages (§ 3.3) et appelle `ch08aPhoneStr`. **`phone(c,n)` délègue à `ch08aPhone`** (ancre A2) : toutes les listes, fiches et impressions qui l'utilisent (26 appels) suivent le réglage. Au bureau, les téléphones s'affichent « 021 … » au lieu de « +41 21 … » (décision n° 7). Les exports et liens d'appel de l'original imposent le format international (`phoneToExportString`) : CH-04 / CH-10.

#### 4.5.2 Ordre des noms de personne

`ch08aName1First()` = `ch08aBool('displayNameFormat', true)`. Dans `ownerName(o,nomPrenom)`, la condition `nomPrenom` devient `(nomPrenom || ch08aName1First())` (ancre A3) : [YES] « NAME1 NAME2 » (nom prénom) partout ; [NO] (bureau) « NAME2 NAME1 » par défaut, et « NAME1 NAME2 » là où l'appelant le demande (colonne Entité, titres ; arbitrage 15). **Aucun changement visible au bureau.** L'original n'affiche que NAME1 pour une entité non personne : écart laissé à CH-04 (§ 8).

#### 4.5.3 Nouvelle adresse

Dans `editContact`, les valeurs par défaut d'une nouvelle adresse (ancres A4, A5) [P `Contact.<init>@31-65`] :
- `LANGUAGECODE` : `ch08aDocLangCode()` = langue des documents par défaut des Préférences (lot 3 : `ch08cDocLangCode()`), sinon 2 (français, valeur actuelle) ;
- `COUNTRYCODE` : `ch08aCountry()` ;
- `PHONECOUNTRY1` (sans adresse de base), `PHONECOUNTRY2` et `FAXCOUNTRY1` : `ch08aDial(ch08aCountry())`.

#### 4.5.4 Catégories de l'Administrateur

`rows:cats` devient `rows:ch08aAdmCats(cats)` (ancre A6) : retire « Taux de TVA » (déplacé dans les Paramètres système) et les catégories sans droit (`CH08A_ADM`, tableau du § 3.4 : Adresses - Propriétés et Adresses - Statuts `adminAddresses` ; Heures prévues `adminTargetTime` ; Tarifs de facturation `adminRates` ; Jours fériés `adminPublicHolidays` ; Comptes pour QR-facture `adminQRBillAccounts` ; Phases standard, Activités standard, Frais standard, Gabarits de facturation, Comparaison des offres, Tâches `adminProjects` ; Plans comptables `adminBkp` si CH-06 l'ajoute) [P `AdminDialog$Menu.<clinit>`]. Une catégorie inconnue (ajoutée par CH-06) est gardée. Si `ADM.cat` n'est plus dans la liste, elle devient la première de la liste (effet de bord documenté, avant `draw()`).

### 4.6 Aide et « A propos de » (lot 1)

- **Aide ▸ Aide** (`ch08aHelp`, appelée par `rgHelp`) : si `DS.info.aide` (ping du serveur, § 4.20) → `open('','_blank')` puis `location = '/aide/manual_fr.pdf'` (fenêtre ouverte pendant le clic, comme `svDpPrint`) ; sinon dialogue « Aide » : « Le manuel de DELTAproject (manual_fr.pdf) n'est pas accessible depuis le serveur DeltaSub. Il s'ouvre depuis DELTAproject : Aide ▸ Aide. » [C]. L'original n'affiche rien quand le fichier manque [P `AppForm$25@0-25`].
- Route serveur `GET /aide/manual_fr.pdf` (lot 1, S5) : fichier **fixe** `/Applications/DELTAproject.app/Contents/app/rsrc/help/manual_fr.pdf` (variable `DELTASUB_MANUEL` pour les essais), `Content-Type: application/pdf`, `Content-Disposition: inline`, **sans gzip**, envoyé par blocs (`shutil.copyfileobj`) : le fichier fait 32 330 593 octets et `_send` le compresserait entièrement en mémoire. 404 si absent. Aucun chemin tiré de la requête. Le manuel n'est pas copié dans le dépôt (non redistribué).
- **A propos de DeltaSub** (`ch08aAbout`, appelée par `rgAbout`) [C, D6(5)] : dialogue « A propos de DeltaSub » : « DeltaSub » ; « Application de bureau de Substances Architectes » ; « Reproduction fonctionnelle de DELTAproject 16.05, pour l'usage interne du bureau. » ; « Serveur DeltaSub : version <VERSION> — <seq> modifications enregistrées » ; « Dernière reprise Deltaproject : <JJ.MM.AAAA HH:MM> » (`DS.info.import.le`, si présent). Aucun copyright DELTA, aucune donnée du détenteur de licence.

### 4.7 Gestion des utilisateurs (lot 2, `ch08bUserAdmin`)

[P `UserAdminDialog`, `rech_orig` § 5.1] — `dialog({title:'Gestion des utilisateurs', width:'640px'})`, zone de 627 × 400 au moins, bouton « Fermer » (défaut, Échap).

- Onglets `seg(['Utilisateurs','Fonctions','Jeux de privilèges'])`.
- Chaque onglet : `phead` avec `+` (« Nouveau »), `E` (« Editer »), `−` (« Supprimer ») ; Editer et Supprimer actifs avec une ligne sélectionnée, `+` toujours ; double-clic = Editer.
- **Utilisateurs** : bouton filtre ▾ (« Afficher tout » / « Afficher uniquement les utilisateurs activés. », coches exclusives) et étiquette « Filtré » quand le filtre est actif (`ds_ch08b_filter`). Tableau « Nom » | « Nom d'utilisateur » | « Actif » (✔, non éditable) ; tous les comptes **sauf `mayday`**, tri par `NAME` [P `AppUser.findAll`].
- **Fonctions** : 4 colonnes « Geschäftsrolle » | « Fonction » | « Funzione » | « Roles » (`NAMEGE`, `NAMEFR`, `NAMEIT`, `NAMEEN`), tri par **`NAMEGE`** (vides en fin, `cmp`) [P `AppCompanyRole.findAll … ORDER BY a.nameGe`].
- **Jeux de privilèges** : « Rolle » | « Jeux de privilèges » | « Ruolo » | « Roles », tri par `NAMEGE`.
- **Supprimer un utilisateur** : refus pour `admin`, `mayday` et le compte connecté : Avertissement « Impossible d'effacer l'utilisateur ^0. » (^0 = `NAME`) ; sinon Avertissement Oui / Non « Voulez-vous vraiment supprimer cette inscription ? » ; Oui → un `DS.commit` : `appuser`, ses liaisons `appuser_appcompanyrole` et `appuser_staff`, son `appusersignature` ; le serveur (lot 4) efface son empreinte et ses sessions. Aucun contrôle d'intégrité (documents, heures) [P] : conseil du manuel DE p. 13, préférer la désactivation.
- **Supprimer une fonction** : si un compte l'a → Avertissement « Cette fonction ne peut pas être effacée, car elle est déjà utilisée. » ; sinon confirmation `msgDeleteEntry`, puis suppression de la fonction **et de ses liaisons** `appcompanyrole_approle` (cascade JPA de l'original).
- **Supprimer un jeu** : si une fonction l'utilise → Avertissement « Ce jeu de privilèges est utilisé et ne peut pas être effacé. » ; sinon confirmation, suppression.

### 4.8 « Saisir un utilisateur » / « Modifier l'utilisateur » (lot 2, `ch08bUserDlg`)

| Élément | Libellé | Règle |
|---|---|---|
| Nom d'utilisateur | « Nom d'utilisateur » | 32 car. ; **saisissable seulement à la création** |
| Nom | « Nom » | 32 car. |
| Mot de passe | « Mot de passe » | création : champ saisissable si le lot 4 est présent (sinon masqué) ; vide = compte sans mot de passe ; non vide et < 8 car. → Erreur « Le nouveau mot de passe n'est pas valable. » (décision n° 3). Modification : « •••••••• » si le compte a un mot de passe (`GET /api/auth`), sinon vide ; lecture seule |
| Bouton à droite du mot de passe (▾) | menu « Réinitialiser le mot de passe … » (toujours actif) ; « Modifier le mot de passe … » (actif si USERID non vide et ≠ `mayday`) | bouton visible si le lot 4 est présent ; actif si modifiable et pas à la création |
| Actif | case « Actif » | active si modifiable |
| Fonctions | tableau 1 colonne « Fonction », `+` / `−` | `+` → « Choisir les fonctions » (fonctions non attribuées, choix simple) ; `−` actif avec sélection, retrait sans confirmation |
| Collaborateurs | tableau 1 colonne « Collaborateur » (`staffName`), `+` / `−` | `+` → « Choix du collaborateur » (collaborateurs actuels non liés, recherche, choix simple) |
| OK / Annuler | | OK actif si le nom d'utilisateur n'est pas vide |

« Modifiable » = USERID non vide, différent de `admin` et de `mayday` [P `AppUserDialog.checkGuards@28-53`]. OK, dans l'ordre [P `jOkButtonActionPerformed@1-311`] :
1. création et USERID déjà pris (comparaison **sensible à la casse**) → Erreur « Le nom d'utilisateur ^0 est déjà utilisé. » ;
2. (licences : sans objet) ;
3. aucune fonction → Avertissement « Vous devez définir une fonction. », dialogue ouvert ;
4. un `DS.commit` : `appuser` (`USERID`, `NAME`, `ISENABLED` ; à la création `INITIALS`… `null`, `LANGUAGECODE` 1) + liaisons ajoutées et supprimées (clés composées du § 3.1) ; puis, à la création avec un mot de passe, `ch08dSetPassword(ID, mdp)` (lot 4).

`ch08bUserOps(avant, après, liaisons)` est pure (testée en jsc).

### 4.9 Fonctions, jeux, navigateurs (lot 2)

- **« Nouvelle fonction » / « Editer la fonction »** : 4 champs étiquetés dans leur langue « Geschäftsrolle », « Nom de la fonction », « Nome della funzione », « Role name » (`trim`) ; tableau « Jeux de privilèges » + `+` (« Choisir le jeu de privilèges », jeux non présents) / `−` ; **OK toujours actif** (même 4 noms vides : la fonction 251 du bureau en est la trace) [P].
- **« Nouveau jeu de privilèges » / « Modifier le jeu de privilèges »** : « Rollenname », « Nom du jeu », « Nome del ruolo », « Role name » ; tableau « Privilèges » (droits du jeu dans l'ordre de l'énumération, libellé FR) ; `+` → « Droits d'utilisateur » sur le **complément** ; `−` retrait sans confirmation ; OK : `RIGHTS = ch08aRightsStr(ensemble)`.
- **« Droits d'utilisateur »** (`ch08bPickRight`) : 320 × 400, champ de recherche (filtre à chaque frappe), tableau des droits restants (66 moins ceux du jeu, `superadmin` compris, sans filtre de licence), choix simple, OK actif avec une sélection, double-clic = OK [P `RightBrowserDialog`].
- Navigateurs de fonction, de jeu et de collaborateur : même forme (recherche, tableau, OK actif avec sélection, double-clic).

### 4.10 Application des droits (lot 2)

#### 4.10.1 Vues et barre des modules

`ch08bViewOk(id, u=ME.u)` : droits requis par identifiant de vue (première règle qui s'applique), **indépendants des libellés de section** (CH-10 et CH-12 renomment ou scindent des sections) :

| Vue | Droits requis |
|---|---|
| `config` | `admin` |
| `aff-toutes` | `project`, `projectEditAll` |
| `mg-collab` | `management`, `staff` [P `Modules$Menu.getModules@41-55`] |
| `adr-*` | `contact` |
| `aff-*` | `project` |
| `collab-*` | `staff` |
| `frais*` | `expenses` |
| `h-*` | `time` |
| `taches*` | `tasks` |
| `fact-*` | `invoices` |
| `coplan`, `devis*`, `soum*`, `coco*` | `construction` |
| `mg*` | `management` |
| `tpl-*` | `design` |
| toute autre vue | aucun (permise) |

- `buildNav` n'affiche une section que si elle garde au moins une entrée permise (ancres B1, B2) [P `MenuTree@54-75`].
- **Refus de vue** : `rgBeforeGo(id,arg)`, appelé par le crochet `ch10aBeforeGo` que CH-10 lot 1 place en tête de `go` (`spec_19` ancre G1 : `if(typeof ch10aBeforeGo==='function'&&ch10aBeforeGo(id,arg)===false) return;`) ; CH-08 n'ancre donc plus `go` (l'ancre B3 de la première rédaction est retirée). Vue permise → `true`. Sinon `ch08bFirstView()` = première vue permise de `NAV`, ou `CH08B_NONE_ID` (« ch08b-aucun ») ; si c'est celle-ci, `VIEWS[CH08B_NONE_ID]` est créé à la première demande (`CH08B_NONE` : titre « Aucun module », texte « Aucun module de DeltaSub n'est attribué à cet utilisateur. ») ; la redirection `go(f)` est **différée** (`setTimeout(…,0)`) pour ne pas réentrer dans la chaîne de crochets de CH-10 ; retour `false` [C]. Couvre aussi la vue mémorisée `ds_view` du démarrage.
- Au bureau (après CH-10 lot 1, qui retire « Administrateur » de `NAV` : 43 entrées) : 10 sections pour 2752 ; 7 pour les comptes Standard (sans Collaborateurs, Factures, Management) ; 0 pour `admin` (qui n'a que Réglages ▸ Gestion des utilisateurs, Configurer un collaborateur et Préférences).

#### 4.10.2 Domaines d'affaire

`rows:DOMAINS` devient `rows:ch08bDomains(DOMAINS)` (ancre B4) [P `ProjectFrame.setMenuTable`] :

| Domaine (libellé DeltaSub) | Condition |
|---|---|
| Intervenants, Notes, Factures | toujours (Factures : `projectInvoices` jamais testé) |
| Soumissionnaires | `projectTenderers` |
| Liste d'adresses | `projectContacts` [D : domaine propre à DeltaSub, mort dans l'original ; même droit que Entrepreneurs] |
| Entrepreneurs (si CH-05 l'ajoute) | `projectContacts` |
| Documents | `projectMemoranda` |
| Messages brefs | `projectMemoranda` et `isModuleFormVisible` = [YES] |
| Fichiers (si CH-13 l'ajoute) | `projectFiles` et `isProjectMenuFilesVisible` = [YES] |
| Séances | `projectMeetings` |
| Tâches | `projectTasks` |
| Frais | `projectCosts` |
| Calcul des honoraires / Offres d'honoraires | `honorarFeeCalculation` |
| Contrats honoraires | `projectContracts` |
| Planification RH | `projectPlanning` |
| Analyse de planification RH | `projectPlanningAnalyze` |
| Avancement des prestations | `honorarImplementation` |
| Liste des plans, Liste de distribution | `projectPlans` |
| Calcul des coûts, Devis général, Soumission, Contrôle des coûts | `construction` |
| autre libellé | toujours |

Les libellés sont comparés après normalisation de l'apostrophe (’ → ') : `DOMAINS` écrit « Liste d’adresses » et, après CH-10 lot 1 (`spec_19` H1), « Offres d’honoraires » au lieu de « Calcul des honoraires » ; la table contient les deux libellés. Si `AM.dom` n'est pas permis, il devient « Intervenants » (effet de bord évalué avant `sel:AM.dom`). Les conditions de licence de l'original (DELTAhonorar, DELTAplanning, DELTAfaktura) ne sont pas reproduites (DeltaSub n'a pas de licences) : ces domaines restent visibles pour 2752. Au bureau : 17 domaines pour les comptes Standard, 21 pour 2752.

#### 4.10.3 Table de gardes (boutons et entrées de menu)

`CH08B_GUARDS = [[vue (expression régulière), libellé exact, droit, effet], …]` ; `ch08bGuard(b)` (au début de `ibtn`, ancre B5) : si `VIEW.id` et `b.t` correspondent à une ligne et que le droit manque → `null` (bouton non rendu, `h('span',{style:{display:'none'}})`) pour l'effet « masquer », ou `{...b, dis:true}` pour « griser » ; `ch08bGuardItems(items, anchor)` (au début de `popMenu`, ancre B6) : même règle sur les entrées `{t}` (absente ou `dis`). Deux exclusions [C] : un menu ouvert **depuis la barre de CH-10** (`anchor.closest('#ch10a-mb')`) n'est jamais filtré (ses conditions sont celles de `ch10aModel`) ; une entrée dont `t` n'est pas une chaîne (nœud DOM, comme les entrées d'Édition de CH-10) est laissée telle quelle. Contenu initial, relevé dans `DeltaSub.html` du 30.09.2026 :

| Vue | Libellé | Droit | Effet (original) |
|---|---|---|---|
| `^adr-(entites\|liste\|favoris\|chercher)$` | Nouveau · Nouvelle adresse | `contactNew` | masquer [P `ContactListFrame.setUserRights@0-65`] |
| idem | Modifier · Modifier l'adresse · Modifier l'entité | `contactEdit` | masquer |
| idem | Supprimer l'entité · Supprimer l'adresse | `contactDelete` | masquer |
| idem | Ajouter des propriétés … | `contactPropertyNew` | masquer |
| `^adr-props$` | Retirer la propriété des adresses sélectionnées | `contactPropertyDelete` | masquer |
| `^adr-groupes$` | Nouveau · Modifier le groupe | `contactGroupNew` | masquer [P `GroupFrame.setUserRights@0-22`] |
| `^adr-groupes$` | Supprimer le groupe | `contactGroupDelete` | masquer |
| `^collab-` | Ajouter un collaborateur | `staffNew` | griser [P `EmployeeFrame.checkGuards@34-41`] |
| `^collab-` | Editer le collaborateur | `staffEdit` | griser |
| `^collab-` | Supprimer le collaborateur | `staffDelete` | griser |
| `^aff-gestion$` | Nouvelle affaire · Editer l'affaire · Supprimer l'affaire | `projectDefinition` | griser [P `ProjectDefinitionFrame.checkGuards@1-70`] |
| `^aff-gestion$` | Intervenants (bouton) · Attribuer les intervenants | `projectTeam` | griser |
| `^aff-gestion$` | Configurer les activités · Attribuer les activités aux collaborateurs | `projectActivities` | masquer |
| `^aff-gestion$` | Configurer les tarifs de facturation | `projectRates` | masquer |
| `^aff-gestion$` | Configurer les phases | `projectPhases` | masquer |
| `^aff-gestion$` | Configurer les frais … (CH-17) | `projectCosts` | masquer |
| `^aff-gestion$` | Configurer la subdivision par ouvrages et localisations | `projectSubProjects` | masquer |
| `^aff-gestion$` | Configuration (bouton roue) | l'un de `projectSubProjects`, `projectBkp`, `projectPhases`, `projectRates`, `projectActivities`, `projectCosts`, `projectMeetings`, `projectPlans` | griser [P `hasRightProjectSettings`] |

- Les libellés sont comparés après normalisation de l'apostrophe (’ → ') et des espaces. Le `build.py` du lot **signale** (sans échouer) toute ligne dont le libellé n'apparaît plus dans le `DeltaSub.html` source : la garde est alors inopérante, jamais bloquante.
- Au bureau, **aucune de ces gardes ne se déclenche** (tous les comptes ayant une fonction ont ces droits, sauf `staff*` que les comptes Standard n'atteignent pas) : elles servent aux jeux que Paulo créera.

#### 4.10.4 Heures, Notes de frais : collaborateurs du compte

`ch08bMyStaffs()` [P arbitrage 16] : collaborateurs de `APPUSER_STAFF` du compte courant, **anciens compris**, triés comme `staffList` (`SORTORDER` puis nom) ; amorçage [C] : aucun `approle` en base ou aucun utilisateur → `staffList()`. Remplace `staffList()` dans Heures ▸ Saisie, Heures ▸ Rapport, Notes de frais ▸ Saisie et Rapport (ancres B8 à B11). Au bureau : 11 collaborateurs pour 2752, 1 pour chacun des autres comptes personnels, aucun pour `admin` (liste vide, comme l'original).

#### 4.10.5 Ce qui n'est pas couvert

Voir § 10 « Non livré » : fiche d'adresse en lecture seule (`contactEdit`), tuiles du Controlling (`projectTime`, `projectCosts`), catégories de Management ▸ Collaborateurs (`managementStaff`), plan comptable du Devis et du CoCo (`projectBkp`), « Importer des heures » (`admin`, entrée absente de DeltaSub), subdivisions par affectations et par locaux. Au bureau, aucun de ces droits ne manque à un compte qui atteint l'écran concerné.

### 4.11 « Qui utilise ce poste ? » corrigé (lot 2, `ch08bChoose`)

Branché au début de `chooseUser` (ancre B7 : `if(ch08bChoose(force)) return;`) :
- mode avec mot de passe (`typeof ch08dAuthOn==='function' && ch08dAuthOn()`, lot 4) : le choix est interdit ; `force` (double-clic sur `#net`) ouvre `ch08dSessionMenu()` (§ 4.2) ; rend `true` ;
- sinon : même dialogue « Qui utilise ce poste ? » (« Choisissez votre nom (mémorisé sur ce poste). »), tableau « Nom » (`NAME`) | « Nom d'utilisateur », comptes actifs **sauf `mayday`** ; **Échap ne ferme pas** le dialogue au premier choix (écouteur `keydown` en capture sur le `.ov`, `stopImmediatePropagation`) ; avec `force`, Échap et « Annuler » gardent l'utilisateur courant ; OK → `ds_user`, `buildNav()`, `NET.ok()`, `go(VIEW ? VIEW.id : 'aff-gestion')` ; rend `true`.

[C] Défauts corrigés (`rech_exist` § 1.10 n° 4) ; le nom affiché est celui du compte (comme les tableaux de l'original), plus le nom du premier collaborateur lié.

### 4.12 Préférences (lot 3, `ch08cPreferences`)

`ecCatDialog` (après `ecCss()`) : titre « Préférences », en-tête de liste « Catégorie », boutons Annuler / OK. **OK enregistre tout**, Annuler abandonne, **sauf la signature, enregistrée dès son choix** [P `PreferencesDialog.jOkButtonActionPerformed@0-677`, `importSignatureImage@0-157`].

| Catégorie (ordre de l'original) | Contenu | Stockage | Effet |
|---|---|---|---|
| Langue des documents | « Choix des modèles documents pour des nouveaux documents » : radios « La langue définie par défaut » / « Toutes les langues » ; « Par défaut » : Deutsch, Français, Italiano, English ; « Toutes les langues » : 4 cases (langues visibles) | `ds_ch08c_prefs.lang` (défaut : langue par défaut, Français, 4 langues) | `ch08cDocLang()` → « de », « fr », « it », « en » ; `ch08cDocLangCode()` → 1 à 4 (`LANG_T`) pour les nouvelles adresses ; les moteurs d'impression restent en français jusqu'à CH-09 |
| Utilisateur | titre « Paramètres personnels » + espace + `NAME` ; « Initiales » (8), « Téléphone » (64), « Adresse courriel » (64), « Titre » (64), « Fonction » (64) ; « Signature » : bouton de choix + aperçu | **base** : `appuser` du compte courant seulement (`trim`, `null` si vide), `bseq` lu à l'ouverture ; signature : `appusersignature` | champs d'impression (§ 4.13) |
| Saisie de texte | « Police » (Système, Helvetica Neue, Arial, Lucida Grande, Verdana [C]) ; « Taille de police » 10 à 14 | `ds_ch08c_prefs.text` (défaut : Système, 13) | CSS `.inp, textarea.inp` |
| Tableau | « Police », « Style » (Normal, Gras, Italique), « Taille » 9 à 18 ; « Lignes » : « Afficher les traits verticaux », « Afficher les traits horizontaux », « Afficher le fond alterné », « Interligne » 15 à 24 ; tableau d'exemple « Colonne » \| « Texte » | `ds_ch08c_prefs.table` (défaut : Système, Normal, 13, sans traits, fond alterné, 24) | CSS `table.g` |
| vCard export | « Encodage des caractères pour l'export vCard » : UTF-8 / ISO-8859-1 | `ds_ch08c_prefs.vcard` (défaut UTF-8) | `ch08cVcardCharset()` pour CH-04 |

- **Défauts = apparence actuelle de DeltaSub** (13 px, lignes de 24 px, fond alterné `--zebra`, sans traits) : aucune différence visible tant que personne ne change ses préférences. `ch08cApply()` injecte `<style id="ch08c-css">` au démarrage (appelé par `ch08cStart`, ancre A1) et après OK.
- **Signature** [P] : sélecteur de fichier ; le fichier n'est pris que si son nom se termine par « .PNG » (sans tenir compte de la casse), **sinon rien ne se passe, sans message** ; copie immédiate (`DS.commit` de `appusersignature`), aperçu mis à jour ; pas de commande de suppression. [C] Plus de 200 000 octets → Information « L'image est trop grande (200 Ko au plus). ».
- Aucun droit requis ; l'utilisateur ne modifie que son propre compte ; `NAME` ne change que dans la Gestion des utilisateurs [P].

### 4.13 Champs « utilisateur » et signature des impressions (lot 3)

[P `Report.getReportString@62-66`, `FieldStyles.getUserString@9-113`, `ProjectDocument.getImagePathAndFilename@29-32`] Deux utilisateurs : l'**utilisateur connecté** (`Report$ReportStringField|appUser`, image `appUserSignature`) et l'**utilisateur du document** (`ProjectDocument$StringField|user`, image `userSignature`, par `USERID` du document). Styles : `userName` « Nom » (`NAME`, défaut), `userLoginName` « Nom de session » (`USERID`), `userInitials`, `userPhoneNumber`, `userEmail`, `userJobTitle`, `userJobFunction` : **toujours les champs de `APPUSER`**.

Fonctions (lot 3) :
- `ch08cUserStr(u, style)` → la valeur du style ; **repli [C, décision n° 2]** : si la valeur de `APPUSER` est vide et que le compte a un collaborateur (logique de `ME.staff` / `svStaffOfUser`), initiales `STAFF.INITIALS`, téléphone `phone(adresse,1)||phone(adresse,2)`, courriel `EMAIL1`, titre `COMPANYROLE` de l'adresse du collaborateur (valeurs d'aujourd'hui) ; `userJobFunction` et `userName` sans repli (`NAME` toujours rempli).
- `ch08cSigFor(nom, F)` → `{data}` ou `null` : `appUserSignature` → signature de `ME.u` ; `userSignature` → signature du compte lié au collaborateur `F.staff` (`appuser_staff`).

Branchements :

| Moteur | Aujourd'hui | Après CH-08 | Ancre |
|---|---|---|---|
| `mgPrint` (Management, Heures, `.dpdoc` jeu 0) | `appUser` = `staffName(ME.staff)` | `ch08cUserStr(ME.u,'userName')`, repli `staffName(ME.staff)` puis `ME.id` | C1 |
| `tplPrint` (anciens modèles) | `user` = `staffName(ME.staff)` sinon `NAME` | `APPUSER.NAME` (`Security.getUserName`), repli `staffName(ME.staff)` | C2 |
| `svReportCtx` / `svText` (Soumission) | `appUser` = `{t:'staff'}` : champs de l'adresse du collaborateur | `appUser` = `{t:'appuser',id}` ; `svText` résout `t:'appuser'` par `ch08cUserStr(u, style)` | C3, C4 |
| `svDpBands` (images) | signature : vide | `ch08cSigFor(n, env.F)` | C5 |

Au bureau aujourd'hui : `NAME` d'un seul mot, 5 champs vides, aucune signature : le nom imprimé devient celui du compte (fidèle) ; avec le repli, courriel, téléphone et titre des lettres de soumission restent ceux de la fiche du collaborateur tant que chacun n'a pas rempli ses Préférences.

### 4.14 Assistant « Configurer un collaborateur » (lot 3, `ch08cEmployees`)

[P `intro.EmployeesDialog`, `EmployeeDialog`, `rech_orig` § 10] Réglages ▸ Configurer un collaborateur … (compte `admin` seulement) ; ouverture automatique au démarrage si le compte est `admin` ou superadministrateur **et** qu'il n'existe aucun collaborateur (`ch08cAutoEmployees`, appelé par `ch08cStart` au démarrage, ancre A1 ; jamais au bureau).

| Élément | Libellé | Règle |
|---|---|---|
| Titre | Configurer un collaborateur | |
| Société | « Société des collaborateurs » : « Nom », « Rue et n° », « NPA/Localité » (NPA et localité) ; bouton ▾ « Choisir … » (navigateur d'entités, sociétés) / « Annuler » (actif si une société est choisie), visible s'il existe des adresses | champs éditables tant qu'aucune société existante n'est choisie |
| Gestion des utilisateurs | « Fonction » : lecture seule + ▾ « Choisir … » (« Choisir les fonctions », lot 2) ; préremplie avec la fonction dont `NAMEGE` = « Standard » | la fonction de `NAMEGE` « Administrator » sert aux administrateurs |
| Collaborateurs | tableau « Nom » \| « Prénom » \| « Abréviation » \| « Nom d'utilisateur » \| « Administrateur », `+ E −`, roue (copier, CSV) | |
| OK | | OK et `+` actifs si Nom **et** Localité remplis **et** fonction choisie ; E et − demandent une sélection |

« Nouveau collaborateur » / « Editer collaborateur » : « Nom », « Prénom », « Abréviation », « Nom d'utilisateur », « Mot de passe » (lot 4 présent, sinon masqué), case « Administrateur » ; OK actif si Nom, Prénom et Nom d'utilisateur remplis ; refus « Le nom d'utilisateur ^0 est déjà utilisé. » si l'USERID est dans la liste ou en base.

OK : **un `DS.commit`** (`ch08cEmployeeOps`, pure) : société nouvelle → `contactowner` (TYPECODE 0, NAME1) + `contact` (NAME1, STREET, POSTALCODE, LOCATION, pays par défaut) ; par ligne : `contactowner` personne (TYPECODE 1, NAME1 nom, NAME2 prénom), `contact` professionnel (NAME1 = nom de la société, NAME2 = « nom prénom », `CONTACTRELATION_ID` = société), `staff` (`PERSON_ID`, adresse de la société, `INITIALS`, `JOININGDATE` = aujourd'hui, `ISACTIVE` 1), `appuser` (`NAME` = nom de l'entité selon `ownerName`, `INITIALS`, `USERID`, actif), `appuser_staff`, `appuser_appcompanyrole` (Administrator ou la fonction choisie) ; puis mots de passe par `ch08dSetPassword` ; Information « Les utilisateurs suivants ont été configurés avec succès: » ⏎ la liste « Nom (USERID) » ⏎ « Ces utilisateurs peuvent maintenant utiliser DeltaSub. » (nom du produit adapté, E9).

### 4.15 Ouverture de session (lot 4, `ch08dLogin`, mode avec mot de passe)

Démarrage (ancre D1 : `await ch08dLogin(); await DS.boot();`) : `GET /api/ping` → `auth` faux : retour immédiat (mode sans mot de passe, `chooseUser` comme aujourd'hui) ; vrai : `GET /api/session` → session valide : `ds_user` = `ID` de la session, retour ; sinon dialogue « Ouverture de session » au-dessus de `#boot` (le `.ov` du dialogue reçoit `z-index:3100`, `#boot` étant à 3000).

| Élément | Libellé | Règle |
|---|---|---|
| En-tête | « DeltaSub », « Substances Architectes » | |
| Serveur | « Serveur » | lecture seule : `location.host` ; pastille verte (0,153,0) si `/api/ping` répond, rouge (204,50,51) sinon [P `LoginDialog.checkStatus@1-89`] |
| Nom d'utilisateur | « Nom d'utilisateur » | prérempli depuis `ds_ch08d_login` si mémorisé |
| Mot de passe | « Mot de passe » | champ masqué, jamais prérempli |
| Mémoriser les informations | case | cochée si mémorisé ; inactive pour `mayday` |
| Roue ▾ | « Modifier le mot de passe … » | actif si le serveur répond et l'USERID n'est pas vide ni `mayday` |
| OK / Annuler | | OK actif si le serveur répond et l'USERID n'est pas vide [P `checkGuards@64-97`] ; Annuler : `#boot` affiche « Session non ouverte. » et un bouton « Ouvrir une session … » |

OK → `POST /api/login {userid, password, override:false, remember}` :
- échec (compte inconnu, inactif, `mayday`, mot de passe faux, blocage après échecs) → Erreur **« Echec d'ouverture de session »**, dialogue ouvert [P `@169-202`] (« L'utilisateur ^0 est désactivé. » est inatteignable dans l'original : non reproduit) ;
- compte sans mot de passe et première connexion libre → « Modifier le mot de passe » en mode définition (§ 4.17) puis session ouverte ;
- session ouverte sur un autre poste → « Document verrouillé » (§ 4.16) ;
- succès → cookie posé par le serveur, `ds_ch08d_login` = `{userid, remember}` si Mémoriser (sinon effacé), `ds_user` = `ID`, suite du démarrage.

### 4.16 Reprise d'une session ouverte : « Document verrouillé » (lot 4)

[P `AppUserOverrideLoginDialog`] Titre « Document verrouillé », message « Ce document est actuellement utilisé. » ; champs en lecture seule « Utilisateur » (navigateur et système du poste, ex. « Chrome · macOS » [C] ; l'original montre le compte système), « Host » (adresse IP du poste), « Utilisé le » (ouverture de la session, « JJ.MM.AAAA HH:MM ») ; case « Déverrouiller ce document » ; **OK actif seulement si la case est cochée** ; OK → Avertissement Oui / Non « Voulez-vous vraiment déverrouiller ce document ? Attention, veuillez vous assurer que l'utilisateur mentionné » ⏎ « ne travaille pas dans le document afin d'éviter la perte de données. » ; Oui → `POST /api/login` avec `override:true` ; Non ou Annuler → retour à l'ouverture de session.

- **Même poste** (même adresse IP et même `User-Agent`) : reprise silencieuse [P pour le principe, `LoginDialog@137-143` ; C pour le critère].
- **Poste évincé** (D6-c, [C]) : sa session est révoquée (`reprise`) ; au prochain appel (≤ 4 s, `/api/changes`), la page affiche l'ouverture de session avec la ligne « Votre session a été reprise sur un autre poste. ». L'original ne prévient jamais (`Security.isLoginOverridden` n'est appelé nulle part [P]).

### 4.17 « Modifier le mot de passe » / « Réinitialiser le mot de passe » (lot 4, `ch08dPasswordDlg`)

| Mode | Titre | Champs | Accès |
|---|---|---|---|
| modifier | Modifier le mot de passe | « Ancien mot de passe », « Nouveau mot de passe », « Confirmation » | menu de `#net` (§ 4.2), roue de l'ouverture de session, menu du mot de passe de `AppUserDialog` |
| réinitialiser | Réinitialiser le mot de passe | « Nouveau mot de passe », « Confirmation » | menu du mot de passe de `AppUserDialog` (droit `userAdmin`) |
| définir *(DeltaSub)* | Modifier le mot de passe | « Nouveau mot de passe », « Confirmation » | première connexion d'un compte sans mot de passe ; menu de `#net` quand le compte n'en a pas ; rubrique « Ouverture de session » pour l'administrateur (§ 4.18) |

OK toujours actif ; le serveur applique l'ordre de l'original [P arbitrage 22] et renvoie la première erreur : 1. ancien mot de passe faux → Erreur « Mot de passe erroné. » ; 2. nouveau ≠ confirmation, **ou moins de 8 caractères** [C, décision n° 3] → Erreur « Le nouveau mot de passe n'est pas valable. » ; 3. écriture, fermeture, Information « Le mot de passe a été modifié avec succès. ». Une réinitialisation révoque les sessions du compte (`mdp`). Pour que l'ordre soit celui de l'original, la confirmation est envoyée au serveur.

### 4.18 Paramètres système ▸ « Ouverture de session » et « Utilisateurs actifs » (lot 4, extension)

Rubrique ajoutée par `ch08dSysRubric()` à la fin des Paramètres système :

| Ligne | Texte | Bouton « … » actif si |
|---|---|---|
| Mode | « Qui utilise ce poste ? (sans mot de passe) » ou « Nom d'utilisateur et mot de passe » | `userAdmin` |
| Utilisateurs actifs | « n session(s) ouverte(s) » (mode avec mot de passe) ; « — » sinon | `userAdmin` et mode avec mot de passe |

**« Paramètres d'ouverture de session »** : radios « Sans mot de passe (choix de l'utilisateur sur chaque poste) » / « Avec nom d'utilisateur et mot de passe » ; case « Première connexion : chaque utilisateur définit son mot de passe » (active avec la seconde radio, cochée par défaut) ; ligne d'information « Comptes actifs sans mot de passe : n » ; pour activer : champ « Votre mot de passe » si le compte en a un, sinon « Nouveau mot de passe » et « Confirmation » (le mot de passe de l'administrateur est alors défini par `POST /api/password` avant l'activation, mêmes règles qu'au § 4.17). OK actif si quelque chose change et (désactivation, ou champ(s) de mot de passe remplis).
- Activer → `POST /api/auth {enable:true, first_free, userid: ME.id, password}` ; refus si le compte n'a pas `userAdmin` (Information « Vous n'avez pas les droits nécessaires. ») ou mot de passe faux (Erreur « Mot de passe erroné. ») ; succès → la session de l'administrateur est ouverte (cookie), Information « L'ouverture de session par mot de passe est activée. Les autres postes la demanderont à leur prochain chargement. ».
- Désactiver → `POST /api/auth {enable:false}` (session `userAdmin`) ; Information « L'ouverture de session par mot de passe est désactivée. ».

**« Utilisateurs actifs »** [P `login.AppUsersDialog`] : tableau « Nom » | « Utilisateur » | « Host » | « Utilisé le » (colonnes du type `loggedInUsers`) ; roue ▾ « Rejeter un utilisateur » active si la ligne choisie a une session → `POST /api/sessions/reject` (motif `rejet` ; le poste concerné affiche « Votre session a été fermée par l'administrateur. »).

### 4.19 Fin de session, expiration, refus

- **`#net` ▸ Fermer la session** : `POST /api/logout` (cookie effacé) puis `location.reload()` → ouverture de session.
- **Expiration** [C] : 12 h sans activité (cookie de session) ; 30 jours sans activité avec « Mémoriser les informations » (cookie `Max-Age=2592000`). Le poll de 4 s entretient la session tant que la page est ouverte ; le serveur ne met à jour `last` qu'une fois par minute.
- **401** (session absente, expirée, révoquée) sur `/api/changes`, `/api/commit`, `/api/snapshot?t=…` ou `/api/ids` (ancres D2 à D5) → `ch08dExpired(motif)` : dialogue d'ouverture de session au-dessus de la page, avec la ligne du motif (« Votre session a expiré. », « … reprise sur un autre poste. », « … fermée par l'administrateur. ») ; après la reconnexion : même compte → la page continue (l'écriture refusée peut être relancée, le dialogue d'édition est resté ouvert) ; autre compte → `location.reload()`.
- **403** sur `/api/commit` → `ch08dRefused` : toast « ✗ Enregistrement refusé : vous n'avez pas les droits nécessaires. » ; l'erreur porte `conflict:true` pour que le dialogue reste ouvert sans trace d'erreur.
- En mode avec mot de passe, `#net` (double-clic) ouvre `ch08dSessionMenu()` : « Modifier le mot de passe … », « Fermer la session ».

### 4.20 Serveur (lots 1 et 4)

#### 4.20.1 Contrôle d'accès et routes

**Contrôle d'accès** (lot 4) : `ch08_gate(h, méthode)` est la **première instruction** de `do_GET` et de `do_POST` (ancres S8, S9 ; arbitrage 26). Il :
1. laisse passer (rend `True`) une requête hors du réseau local : le code existant renvoie son 403 ;
2. traite lui-même les routes de CH-08 (`/api/login`, `/api/logout`, `/api/session`, `/api/password*`, `/api/auth`, `/api/sessions*`) et rend `False` ;
3. mode sans mot de passe (`meta.auth_enabled` ≠ « 1 ») : rend `True` pour tout le reste (comportement actuel à l'identique) ;
4. mode avec mot de passe : session valide (cookie `ds_session`, jeton non révoqué, non expiré) → mémorise le compte sur la requête (`h.ch08_user`) et rend `True` ; sinon, **exceptions** : `GET /` et `GET /DeltaSub.html` (la page porte l'ouverture de session) et `GET /api/ping` réduit à `{ok:true, auth:true}` ; tout autre chemin → 401 `{error:'session', reason}` et `False`.

Ainsi toute route `/api` — y compris `/api/file`, `/api/pdf` (CH-03), `/api/modeles/zip` (CH-10) et `/aide/manual_fr.pdf` — exige une session quand l'ouverture de session est active [C arrêté D6(2)], sans dépendre de l'ordre d'intégration.

| Route | Mode sans mot de passe | Mode avec mot de passe | Lot |
|---|---|---|---|
| `GET /`, `/DeltaSub.html` (page) | inchangé | ouvert (la page porte l'ouverture de session) | — |
| `GET /api/ping` | `{ok, seq, version, import, aide, auth:false}` | sans session : `{ok:true, auth:true}` (arbitrage 28) ; avec session : complet + `auth:true` | 1 (`aide`), 4 (`auth`) |
| `GET /aide/manual_fr.pdf` | ouvert (réseau local) | session requise | 1 |
| `GET /api/snapshot`, `/api/changes`, `/api/ids`, `POST /api/commit` (et routes des autres chantiers) | inchangés (`who` déclaré par le poste) ; règles d'écriture du § 4.20.3 sur ce `who` | **session requise** (401 sinon) ; `who` = USERID de la session ; règles d'écriture du § 4.20.3 (403) | 4 |
| `POST /api/login {userid,password,override,remember}` | 400 « mode sans mot de passe » | ouvert : 200 + cookie ; 401 `{error:'login'}` ; 200 `{first:true}` ; 409 `{locked:{user,host,since}}` | 4 |
| `GET /api/session` | `{auth:false}` | ouvert : 200 `{user:{ID,USERID}}` ou 401 `{error:'session', reason}` | 4 |
| `POST /api/logout` | 200 | ouvert : 200, session supprimée, cookie `Max-Age=0` | 4 |
| `POST /api/password {userid,old,new,confirm}` | changer (ancien requis si le compte a un mot de passe) ; définir si le compte n'en a pas | ouvert (l'ancien mot de passe est lui-même la preuve) ; définir sans ancien : seulement pour le compte de la session | 4 |
| `POST /api/password/first {userid,new,confirm,remember}` | définit le premier mot de passe | ouvert si `auth_first_free` = « 1 », puis ouvre la session | 4 |
| `POST /api/password/reset {appuser_id,new,confirm}` | **définir** le mot de passe d'un compte **qui n'en a pas**, si le compte déclaré (`who`) a `userAdmin` ; compte qui a déjà un mot de passe → 403 et Information « Ce compte a déjà un mot de passe : il se réinitialise quand l'ouverture de session est active. » (arbitrage 29) | session `userAdmin` : définit ou remplace, révoque les sessions du compte (`mdp`) | 4 |
| `GET /api/auth` | `{auth:false, firstFree, withPassword:[ID]}` | idem, session `userAdmin` | 4 |
| `POST /api/auth {enable,first_free,userid,password}` | activer : compte déclaré avec `userAdmin` **et** mot de passe vérifié | désactiver ou changer `first_free` : session `userAdmin` | 4 |
| `GET /api/sessions` ; `POST /api/sessions/reject {appuser_id}` | 400 | session `userAdmin` | 4 |

Toutes les routes restent limitées au réseau local (`lan_ok`). Cookie : `ds_session=<jeton>; Path=/; HttpOnly; SameSite=Strict` (+ `Max-Age=2592000` si Mémoriser) ; pas d'attribut `Secure` (HTTP, § 7 E12). Les réponses d'erreur ne distinguent jamais « compte inconnu » de « mot de passe faux ». Le blocage après échecs (§ 4.20.2) compte aussi les anciens mots de passe faux de `/api/password`.

#### 4.20.2 Ouverture de session côté serveur

1. Blocage : 5 échecs pour un même USERID en 10 min → refus pendant 60 s (même réponse 401) [C].
2. Compte : `USERID` exact (sensible à la casse), `ISENABLED`, ≠ `mayday` ; sinon 401.
3. Sans empreinte : `first:true` si `auth_first_free` = « 1 », sinon 401.
4. Empreinte fausse → 401 (échec compté).
5. Autre session valide du compte : même IP et même `User-Agent` → remplacée ; sinon, sans `override` → 409 `{locked}` ; avec `override` → l'ancienne est révoquée (`reprise`).
6. Nouvelle session (`auth_session`), cookie, 200.

#### 4.20.3 Règles d'écriture (`/api/commit`, **les deux modes**) [C, D6(3), arbitrage 27]

Identité : compte de la session (mode avec mot de passe) ; compte dont l'`USERID` est le `who` déclaré (mode sans mot de passe ; aucun compte → aucun droit).
- Collections d'administration `appuser`, `appuser_appcompanyrole`, `appuser_staff`, `appcompanyrole`, `appcompanyrole_approle`, `approle` : droit **`userAdmin`** ; exception : une opération sur l'`appuser` du compte lui-même qui ne change que `INITIALS`, `PHONE`, `EMAIL`, `JOBTITLE`, `JOBFUNCTION` (Préférences ▸ Utilisateur).
- `appusersignature` : l'enregistrement du compte lui-même, ou `userAdmin`.
- `setting` : les réglages des Paramètres système (`genCountryPos`, `mainCurrency`, `genVatRatePos`, `areBauadDocsLocked`, `isModuleFormVisible`, `isProjectMenuFilesVisible`, `standardFont*`, `standardTableFont*` : `admin` et `adminGeneral` ; `displayNameFormat`, `displayPhone*`, `countryCodeSeparator`, `areaCodeSeparator` : `admin` et `adminAddresses`) ; les autres réglages (`ds.tplGroup.*`, `standardTableRateLimit`…) : sans condition.
- Toute autre collection : sans condition (comme aujourd'hui).
- Les droits sont calculés sur `rec` par la même règle que `ch08aCan` (union, superadmin, comptes internes, **amorçage** : aucun `approle` → tout permis), mémorisés par numéro de séquence.
- Après un commit qui supprime un `appuser` : suppression de son empreinte et de ses sessions.
- Refus → 403 `{ok:false, error:'droits', t}` ; aucune opération du lot n'est écrite.
- Au bureau, en mode sans mot de passe, seul un poste qui se déclare 2752, `admin` (collections d'administration seulement) ou qui n'a pas encore de jeux de privilèges peut écrire ces collections ; c'est exactement ce que l'interface permet déjà après le lot 2.

#### 4.20.4 Commandes locales (Mac Studio)

- `python3 serveur_deltasub.py --desactiver-authentification` : `auth_enabled` = « 0 » (secours si plus aucun administrateur ne peut se connecter).
- `python3 serveur_deltasub.py --mot-de-passe <USERID>` : demande deux fois le mot de passe (`getpass`), l'enregistre, révoque les sessions du compte.
- Les deux commandes s'appliquent à `DB_PATH` (donc à `DELTASUB_DB` pour les essais) et sont décrites dans la docstring du serveur.

### 4.21 Messages et libellés (récapitulatif)

| Situation | Texte exact | Titre | Source |
|---|---|---|---|
| Suppression (confirmation) | Voulez-vous vraiment supprimer cette inscription ? | Avertissement (Oui / Non) | `rsrc\|Strings\|msgDeleteEntry` |
| Suppression d'un compte interne ou du compte connecté | Impossible d'effacer l'utilisateur ^0. | Avertissement | `UserAdminDialog\|msgDeleteNotAllowed` |
| Fonction utilisée | Cette fonction ne peut pas être effacée, car elle est déjà utilisée. | Avertissement | `AppCompanyRoleDialog\|msg2` |
| Jeu utilisé | Ce jeu de privilèges est utilisé et ne peut pas être effacé. | Avertissement | `AppRoleDialog\|msg2` |
| USERID pris | Le nom d'utilisateur ^0 est déjà utilisé. | Erreur | `AppUserDialog\|msgUserIDNotAvailable` |
| Aucune fonction | Vous devez définir une fonction. | Avertissement | `AppUserDialog\|msgNoCompanyRole` |
| Échec de connexion | Echec d'ouverture de session | Erreur | `LoginDialog\|msgLoginFailed` |
| Ancien mot de passe faux | Mot de passe erroné. | Erreur | `ChangePasswordDialog\|msgPasswordIncorrect` |
| Nouveau invalide | Le nouveau mot de passe n'est pas valable. | Erreur | `ChangePasswordDialog\|msgPasswordNotEqual` |
| Mot de passe changé | Le mot de passe a été modifié avec succès. | Information | `ChangePasswordDialog\|msgPasswordChanged` |
| Reprise d'une session | Voulez-vous vraiment déverrouiller ce document ? Attention, veuillez vous assurer que l'utilisateur mentionné ⏎ ne travaille pas dans le document afin d'éviter la perte de données. | Avertissement (Oui / Non) | `AppUserOverrideLoginDialog\|msg1a`, `msg1b` |
| Visibilité [Ancien document] changée | DeltaSub doit être redémarré. | Information | `rsrc\|Strings\|msgRestartAppNeeded` (nom adapté) |
| Assistant | Les utilisateurs suivants ont été configurés avec succès: ⏎ … ⏎ Ces utilisateurs peuvent maintenant utiliser DeltaSub. | Information | `EmployeesDialog\|msg1`, `msg2` (nom adapté) |
| *DeltaSub* : session reprise, expirée, rejetée ; refus 403 ; activation ; signature trop grande ; aucun module ; manuel inaccessible ; documents à auteur inconnu ; réinitialisation refusée sans session | textes des § 4.3.5, 4.6, 4.10.1, 4.12, 4.16, 4.18, 4.19, 4.20.1 | | [C] |

Convention d'affichage [C] : apostrophe typographique « ’ » dans l'interface, mots identiques à `Strings.db` (E10).

---

## 5. Documents imprimés

**Aucun.** [P] Aucun des 103 types `.dpdoc` n'appartient à ces dialogues (les tableaux s'exportent par la roue crantée). CH-08 **alimente** les moteurs existants : utilisateur connecté et utilisateur du document avec leurs 7 styles, signatures `appUserSignature` et `userSignature` (§ 4.13). Occurrences au bureau [P `rech_orig` § 9.4, `rech_exist` § 3.6] : `appUser` dans 85 types (750 références dans les jeux 0-2 de la collection `modeledocument`) ; `appUserSignature` : 80 références (10 types) ; `userSignature` : 24 références (3 types). Les autres moteurs (documents du contrôle des coûts de CH-01, calcul d'honoraires) appelleront `ch08cUserStr` et `ch08cSigFor`.

---

## 6. Valeurs de contrôle

Données : base de test `dstest/deltasub.sqlite` (copie du bureau). Valeurs recalculées pour ce cahier par `crit/droits_ctl.py` et `crit/phone_ctl.py`, ou exécutées sur le code original (`rech_orig` § 17). Les tests jsc chargent les fonctions nécessaires **extraites telles quelles** du `DeltaSub.html` source par le build, puis le fichier du lot.

### 6.1 Tests jsc

**Lot 1 (`test_ch08a.js`)**

| # | Cas | Attendu |
|---|---|---|
| J1 | `ch08aPhoneStr('+41','012','345 67 89', f, t, '/', ' ')` (bureau) | « 012 345 67 89 » |
| | pays et préfixe affichés (`t, t, '/', ' '`) | « +41/(0)12 345 67 89 » |
| | pays sans préfixe (`t, f`) | « +41/12 345 67 89 » |
| | « +39 », pays et préfixe | « +39/012 345 67 89 » |
| | indicatif vide, pays affiché | « +41 345 67 89 » |
| | défauts de l'original ([YES], [YES], « ␣ », « ␣ ») | « +41 (0)12 345 67 89 » [D] |
| | numéro vide | « » |
| J2 | `ch08aPhone` sur les adresses réelles, réglages du bureau (pays non affiché, « (0) », « / », « ␣ »), masque « chiffres 1 à 9 → 9, les 0 gardés » (arbitrage 30, `crit/phone_ctl.py`) | 3651 « 099 999 90 90 » ; 4078 « 99 999 99 99 » ; 12401 « 99 9999999 » ; 5335 « 099 9099990 » ; **7853 « 099 990 90 00 »** (aujourd'hui « +99␣␣099 990 90 00 », double espace) ; 4269 (pays étranger) « 099 999 99 99 » ; 4246 (sans pays) « 099 999 99 99 » |
| | mêmes adresses, pays et « (0) » affichés, « / » | 3651 « +99/(0)99 999 90 90 » ; 4078 « +99/99 999 99 99 » ; 12401 « +99/99 9999999 » ; 5335 « +99/(0)99 9099990 » ; 7853 « +99 099 990 90 00 » ; 4269 « +99/(0)99 999 99 99 » ; 4246 « 099 999 99 99 » |
| | pays affiché sans « (0) », séparateurs « ␣ » (proche du format actuel de DeltaSub) | 3651 « +99 99 999 90 90 » ; 12401 « +99 99 9999999 » ; 7853 « +99 099 990 90 00 » (un seul espace) |
| J3 | `ownerName` personne NAME1 « Muster », NAME2 « Hans » | [NO] « Hans Muster » ; [YES] « Muster Hans » ; [NO] avec `nomPrenom` « Muster Hans » ; sans prénom « Muster » (valeurs de l'original, `rech_orig` § 17) |
| J4 | `ch08aRightsStr(ch08aRightsParse('4,8;3,0;99,1;4,99;0,0;3,4'))` | « 0,0;3,0;3,4;4,8; » ; jeu 301 relu et réécrit : identique au caractère près (46 codes) ; « 3,x;4,0 » → {4,0} sans exception |
| | `ch08aCan` : `userAdmin` | vrai pour 1, 2, 2752 ; faux pour les 8 comptes Standard |
| | `staff`, `management`, `admin` | vrai pour 2752 seul |
| | `generalUnlockDocuments` | vrai pour les 9 comptes ayant une fonction ; faux pour 1 et 2 |
| | `projectPlanning` pour 2753 ; `contact` pour 1 | faux ; faux |
| | collection `approle` vidée (copie en mémoire) | vrai pour tout (amorçage) |
| | cohérence avec l'existant | `plCan('managementPlanning')`, `plCan('projectPlanning')`, `svRight('100,0')`, `svRight('0,0')` = `ch08aCan` des mêmes droits pour les 11 comptes |
| J5 | contrat `rg*` (§ 4.1) | après le lot 1 : `rgCan`, `rgSystemPreferences`, `rgSystemLegacyPreferences`, `rgHelp`, `rgAbout` sont des fonctions, les 4 autres noms n'existent pas ; `rgCan('admin')`, `rgCan('1,0')` et `rgCan(' 1 , 0 ')` égaux pour les 11 comptes ; `rgCan('99,1')` et `rgCan('inconnu')` faux ; `rgCan('2,0')` : vrai pour 1, 2, 2752, faux pour 2753 |
| | si le source contient `ch10aModel` (CH-10 lot 1), modèle calculé avec `can = rgCan` et les réglages du bureau | Réglages : 2752 [Administrateur …, —, Paramètres système …, Paramètres système … [Ancien document], —, Export des données …, —, Préférences …] ; 2753 [Export des données …, —, Préférences …] ; 1 [Configurer un collaborateur …, Gestion des utilisateurs …, —, Préférences …] ; Fichier absent pour 1 (valeurs annoncées par `spec_19` § 4.1.3) |
| J6 | textes des Paramètres système (réglages du bureau) | « Suisse » ; « CHF » ; « 8.1 % » ; « Prénom et nom » ; « 012 345 67 89 » ; « Les documents sont éditables par tous les utilisateurs. » ; [Ancien document] : « Affiché » ; « AkkuratLL-Light, 8 » ; « Akkurat-Light, 8 » ; « AkkuratLL-Bold, 8 » ; « AkkuratLL-Regular, 8 » ; « Masqué » |
| J7 | `ch08aAdmCats(cats)` | 2752 : 12 catégories (13 moins « Taux de TVA ») ; 2753 : [Heures prévues, Jours fériés, Tarifs de facturation] ; `ADM.cat` = « Taux de TVA » → « Heures prévues » |
| J8 | `ch08aSettingOps` du dialogue des téléphones (pays coché, « / », séparateur interurbain vide) | 4 opérations `setting` type 2, `areaCodeSeparator` = « ␣ », `bseq` des réglages existants 402, 602, 403, 404 ; réglage absent → nouvel `ID` (852 sur une copie fraîche), `SETTINGTYPE` 2 |
| J9 | `CH08A_COUNTRIES` | 246 pays ; CH → « +41 », « Suisse » ; IT → « +39 », « Italie » |
| J10 | `ch08aOrphanDocs()` (§ 4.3.5) sur la base de test | 41 : `costestimatedocument` 25, `costcontroldocument` 16, `costplanningdocument` 0, `devisdocument` 0 ; texte de l'avertissement « 41 documents Bâtiment … (25 devis, 16 contrôles des coûts) … » |
| J11 | Syntaxe | `jsc -e "new Function(readFile('script.js'))"` sur le script complet (`DeltaSub.html` source + lot) : aucune erreur ; aucune redéclaration |

**Lot 2 (`test_ch08b.js`)**

| # | Cas | Attendu |
|---|---|---|
| K1 | `ch08bViewOk`, sections de `NAV` (après CH-10 lot 1 : 43 entrées) et `rgBeforeGo` | 2752 : 10 sections, 43 entrées ; 2753 : 7 sections (Adresses, Affaires, Notes de frais, Heures, Tâches, Bâtiment, Modèles), 32 entrées, `config` refusée, `aff-toutes` permise ; `rgBeforeGo('mg-heures')` pour 2753 → `false` et `go('adr-entites')` différé ; pour 1 : 0 section, `rgBeforeGo` → `false`, `VIEWS['ch08b-aucun']` créé |
| K2 | `ch08bDomains(DOMAINS)` | 2753 : 17 (sans Calcul des honoraires, Planification RH, Analyse de planification RH, Avancement des prestations) ; 2752 : 21 ; 1 : 3 ; `AM.dom` = « Planification RH » pour 2753 → « Intervenants » |
| K3 | gardes | jeu factice {3,0 ; 3,1 ; 6,0} : dans `adr-entites`, « Modifier » masqué, « Nouveau » gardé ; dans `adr-groupes`, « Nouveau » masqué ; dans `collab-actuels`, « Ajouter un collaborateur » gardé, « Editer le collaborateur » grisé ; libellé « Modifier l’adresse » (apostrophe typographique) reconnu |
| K4 | `ch08bMyStaffs` | 2752 : 11 collaborateurs (inactifs compris) ; 2753 : 1 ; 1 : 0 ; `approle` vide : `staffList()` |
| K5 | `ch08bUserOps` (création) | USERID « Admin » accepté (casse), « admin » refusé ; sans fonction : `noRole` ; avec la fonction 201 et le collaborateur 2756 : 3 opérations (`appuser` 3352, `appuser_appcompanyrole` « 201-3352 », `appuser_staff` « 3352-2756 ») |
| K6 | suppressions | compte 1, 2 ou le compte connecté : `notAllowed` ; compte 3301 : 1 + 1 + 1 opérations (`appuser`, liaison « 201-3301 », liaison `appuser_staff`) ; fonction 201 : `used` ; fonction 301 : 3 opérations (301, « 301-301 », « 301-351 ») ; jeu 301 : `used` ; jeu 51 : 1 opération |
| K7 | `ch08bPickRight` sur le jeu 301 | 20 droits, dans l'ordre de l'énumération, le premier « Superadministrateur », le dernier « Menu Gestion des utilisateurs: lecture-écriture » |
| K8 | liste de `ch08bChoose` | 7 comptes (les 8 actifs moins `mayday`) |
| K9 | Syntaxe | idem J11 |

**Lot 3 (`test_ch08c.js`)**

| # | Cas | Attendu |
|---|---|---|
| L1 | `ch08cUserStr` sur un compte factice complet | les 7 styles rendent `NAME`, `USERID`, `INITIALS`, `PHONE`, `EMAIL`, `JOBTITLE`, `JOBFUNCTION` ; style absent → `NAME` |
| L2 | compte 2752 (champs vides) | `userName` = `NAME` ; `userEmail` = `EMAIL1` de l'adresse du collaborateur 2752 (repli), vérifié par égalité sans l'afficher |
| L3 | signature | « Sig.PNG » et « s.png » acceptés ; « s.jpg » ignoré sans message ; 200 001 octets refusés |
| L4 | `ch08cApply` avec les défauts | CSS sans différence avec l'existant (13 px, 24 px, fond alterné, sans traits) |
| L5 | `ch08cEmployeeOps` (société nouvelle, 2 personnes, dont 1 administrateur) | 14 opérations (`contactowner` 3, `contact` 3, `staff` 2, `appuser` 2, `appuser_staff` 2, `appuser_appcompanyrole` 2) ; fonction de l'administrateur = celle de `NAMEGE` « Administrator » (1) ; de l'autre = « Standard » (201) |
| L6 | Syntaxe | idem |

### 6.2 Tests Python (serveur, copie isolée)

`test_ch08_serveur.py` démarre la copie modifiée du serveur sur la base copiée (`DELTASUB_DB`) et le port attribué, avec des **mots de passe de test générés** (`secrets.token_urlsafe`), jamais affichés ni écrits.

| # | Cas | Attendu |
|---|---|---|
| S1 | vecteurs PBKDF2 (RFC 7914 § 11) | (`passwd`, `salt`, 1, 64) → `55ac046e56e3089fec1691c22544b605f94185216dde0465e68b9d57c20dacbc49ca9cccf179b645991664b39d77ef317c71b845b1e30bd509112041d3a19783` ; (`Password`, `NaCl`, 80000, 64) → `4ddcd8f60b98be21830cee5ef22701f9641a4418d04c0414aeff08876b34ab56a1d425a1225833549adb841b51c9b3176a272bdebba1d078478f62b397f33c8d` ; empreinte d'un mot de passe généré vérifiée, mauvais mot de passe refusé, deux empreintes du même mot de passe différentes (sel) |
| S2 | défaut | `ping.auth` faux ; `/api/snapshot` sans cookie : 200 (comportement actuel) |
| S3 | `/api/password/first` pour 2752 ; une seconde fois | 200 ; refus (mot de passe déjà défini) |
| S4 | `/api/auth` activer : mot de passe faux ; juste ; compte 2753 (sans `userAdmin`) | 403 « Mot de passe erroné. » ; 200 + `Set-Cookie` (`HttpOnly`, `SameSite=Strict`, `Path=/`) ; refus droits |
| S5 | mode avec mot de passe, sans cookie : `/api/snapshot`, `/api/changes`, `/api/ids`, `/api/commit`, `/aide/manual_fr.pdf` et, si le serveur source les contient, `/api/file` (CH-03), `/api/modeles/zip` (CH-10) | 401 ; `ping` réduit à `{ok:true, auth:true}` ; `ch08_gate` est la première instruction de `do_GET` et de `do_POST` du serveur construit (contrôle textuel) |
| S6 | 2753 : login vide → `first` ; définition → session | `{first:true}` ; 200 + cookie |
| S7 | commit de 2753 : `approle` ; son `appuser` (EMAIL) ; son `appuser` (NAME) ; `setting` `genVatRatePos` ; `setting` `ds.tplGroup.x` ; `project` | 403 ; 200 ; 403 ; 403 ; 200 ; 200 avec `rec.who` = USERID de 2753 (et non le `who` du corps) |
| S8 | 2752 depuis un second client (autre `User-Agent`) | 409 `{locked:{host,since}}` ; avec `override` : 200 ; `/api/changes` du premier client : 401 `reason:'reprise'` |
| S9 | même IP et même `User-Agent` | reprise silencieuse (200 sans 409) |
| S10 | 5 mots de passe faux puis le bon | 401 pendant 60 s |
| S11 | logout | cookie `Max-Age=0` ; session supprimée |
| S12 | suppression de l'`appuser` 3301 par 2752 | empreinte et sessions de 3301 supprimées |
| S13 | `--desactiver-authentification` ; `--mot-de-passe` (entrée simulée) | `ping.auth` faux ; empreinte remplacée, sessions révoquées |
| S14 | `/aide/manual_fr.pdf` (lot 1) | 200, `application/pdf`, `Content-Length` 32 330 593, pas de `Content-Encoding` ; `DELTASUB_MANUEL` vers un fichier absent : 404 et `ping.aide` faux |
| S15 | reprise protégée (lot 1) : sur la copie, modifier `appuser` 2753 (EMAIL), supprimer la liaison « 201-2753 », créer `setting` `ds.tplGroup.x`, modifier `genVatRatePos`, créer `appusersignature` 2753 ; puis `--importer-deltaproject <dossier temporaire> --force` avec les CSV des 7 tables lus dans `dpx/out` (dossier temporaire effacé après) | les 5 modifications conservées (la liaison reste supprimée) ; `appuser` 3001 (non touché) rafraîchi (`who` = « import Deltaproject ») ; un `appuser` 3352 créé dans DeltaSub face à un 3352 différent ajouté au CSV factice : conservé et message « ⚠ appuser 3352 NON repris … » ; compteur `next_id:appuser` recalculé |
| S16 | mode sans mot de passe, règles d'écriture (identité déclarée) : `approle` avec `who` 2753 ; avec `who` 2752 ; sans `who` ; `setting genVatRatePos` avec 2753 ; `setting ds.tplGroup.x` avec 2753 ; `appuser` 2753 (EMAIL) avec 2753 ; `approle` après avoir vidé `approle` dans la copie | 403 ; 200 ; 403 ; 403 ; 200 ; 200 ; 200 (amorçage) |
| S17 | mode sans mot de passe, `/api/password/reset` déclaré par 2752 : compte 3351 sans mot de passe ; puis de nouveau sur 3351 | 200 (défini) ; 403 et le texte de l'arbitrage 29 |

### 6.3 Essais navigateur (copie isolée, port attribué, onglet propre)

Base copiée par `.backup`, serveur copié (construit par `build_serveur.py` pour les lots 1 et 4), `DeltaSub.html` construit par le `build.py` du lot **sur un source qui contient CH-10 lot 1** (celui du dépôt s'il est intégré, sinon `ch/CH-10/lot1/DeltaSub.html`) ; `localStorage.ds_user='2752'` puis rechargement (et `'2753'`, `'1'` pour les droits) ; mots de passe de test générés, seulement dans la copie ; à la fin : serveur arrêté, onglet fermé, taille par défaut. `window.open` étant bloqué dans le panneau, le manuel et les CSV se vérifient par `fetch` et par le texte produit.

| # | Lot | Scénario | Attendu |
|---|---|---|---|
| B1-1 | 1 | ouverture avec 2752 (source contenant CH-10 lot 1) | barre de CH-10 : Réglages ▸ Paramètres système … et … [Ancien document], Aide ▸ Aide et A propos de … actifs (plus grisés « CH-08 ») ; Gestion des utilisateurs … et Préférences … encore grisés « CH-08 » ; avec 2753 : Paramètres système absents |
| B1-2 | 1 | Réglages ▸ Paramètres système … | 3 rubriques, textes J6 ; Taux de TVA ▸ 7.7 ▸ OK → « 7.7 % » ; `vatDefault()` = 7.7 |
| B1-3 | 1 | Téléphone ▸ … ▸ cocher « Afficher l'indicatif du pays » | case « (0) » activée ; exemple « +41/(0)12 345 67 89 » ; séparateur interurbain vidé → OK grisé ; OK → liste des adresses au nouveau format |
| B1-4 | 1 | Pays ▸ … ▸ Autres … ▸ recherche « auto » ▸ Autriche | « Autriche » ; nouvelle adresse : pays AT, indicatif +43 |
| B1-5 | 1 | Paramètres système ▸ Protection ▸ « Lecture et écriture: auteur uniquement. » ▸ OK | Avertissement « 41 documents Bâtiment … (25 devis, 16 contrôles des coûts) … » ; Non → dialogue ouvert, réglage inchangé ; Oui → [YES] ; remis à [NO] avant la fin de l'essai |
| B1-6 | 1 | Réglages ▸ Administrateur … (2752) ; puis 2753 | 12 catégories, plus de « Taux de TVA » ; 2753 : entrée absente du menu ; `go('config')` depuis la console (lot 1 seul, avant le refus de vue du lot 2) → 3 catégories |
| B1-7 | 1 | Aide ▸ Aide ; Aide ▸ A propos de DeltaSub | `fetch('/aide/manual_fr.pdf',{method:'HEAD'})` 200 ; dialogue À propos avec la version du serveur et la date de reprise |
| B1-8 | 1 | [Ancien document] ▸ Module DESIGN ▸ Masqué | Information « DeltaSub doit être redémarré. » ; lignes de police grisées |
| B2-1 | 2 | 2753 (rechargement) | 7 sections ; ni Collaborateurs, ni Factures, ni Management ; Réglages sans Administrateur ni Gestion des utilisateurs ; domaines : 17 ; Heures ▸ Saisie : 1 collaborateur ; `go('mg-heures')` → première vue permise |
| B2-2 | 2 | 2752 ▸ Réglages ▸ Gestion des utilisateurs … | 3 onglets ; 10 comptes (sans `mayday`) ; filtre « Afficher uniquement les utilisateurs activés. » → 7 et « Filtré » ; Fonctions et Jeux : 4 colonnes, triés sur le nom allemand |
| B2-3 | 2 | + ▸ « essai », sans fonction ▸ OK ; ajouter Standard ▸ OK | Avertissement « Vous devez définir une fonction. » ; compte 3352 créé, liaison « 201-3352 » |
| B2-4 | 2 | supprimer `admin` ; supprimer son propre compte ; supprimer la fonction Standard ; le jeu Standard | les 3 messages exacts du § 4.21 |
| B2-5 | 2 | jeu 51 ▸ Modifier ▸ + ▸ recherche « export » | « Droits d'utilisateur » filtré ; choix → droit ajouté ; OK → `RIGHTS` réécrit dans l'ordre de l'énumération |
| B2-6 | 2 | `ds_user='1'` | vue « Aucun module » ; Réglages : Configurer un collaborateur … et Préférences … (grisés « CH-08 » tant que le lot 3 manque), Gestion des utilisateurs … |
| B2-7 | 2 | « Qui utilise ce poste ? » au premier chargement (sans `ds_user`) ▸ Échap | le dialogue reste ouvert ; `mayday` absent |
| B3-1 | 3 | Préférences ▸ Utilisateur : initiales, courriel ; signature PNG | `appuser` 2752 mis à jour à l'OK ; signature enregistrée dès le choix, même après Annuler |
| B3-2 | 3 | impression d'une lettre de soumission (rendu HTML dans un iframe) | nom = `NAME` du compte ; courriel = celui des Préférences ; image de signature présente |
| B3-3 | 3 | Tableau : traits horizontaux, interligne 18 | effet immédiat sur `table.g` après OK ; retour aux défauts : apparence initiale |
| B4-1 | 4 | Paramètres système ▸ Ouverture de session ▸ activer (2752, mot de passe généré défini avant) | Information d'activation ; `ping.auth` vrai ; rechargement : pas de dialogue (session) |
| B4-2 | 4 | second onglet (autre `User-Agent` simulé impossible dans le panneau : essai par `fetch` avec cookie effacé) ; login 2752 | « Document verrouillé » ; OK grisé tant que la case n'est pas cochée ; confirmation ; premier onglet → ouverture de session « … reprise sur un autre poste. » |
| B4-3 | 4 | 2753 avec un mot de passe vide | « Modifier le mot de passe » en mode définition ; 6 caractères → « Le nouveau mot de passe n'est pas valable. » ; 12 caractères → session |
| B4-4 | 4 | 2753 : modifier le jeu 301 par `DS.commit` depuis la console | toast de refus (403) ; aucune écriture |
| B4-5 | 4 | double-clic sur `#net` ▸ Fermer la session | rechargement, ouverture de session ; Annuler → « Session non ouverte. » |
| B4-6 | 4 | fin : désactiver l'ouverture de session | `ping.auth` faux ; mode « Qui utilise ce poste ? » |

---

## 7. Écarts assumés

| # | Écart | Raison |
|---|---|---|
| E1 | *(Menu Édition, barre de menus, menus vides, raccourcis : écarts de CH-10, `spec_19` § 7 E1 à E6)* | la barre appartient à CH-10 (arbitrage 2) |
| E2 | Commandes de session par double-clic sur `#net` (« Qui utilise ce poste ? » ; avec mot de passe : Modifier le mot de passe, Fermer la session) au lieu de Quitter | navigateur ; la barre de CH-10 n'a pas d'entrée de session (§ 4.2) |
| E3 | Droits évalués à chaque ouverture de menu (par `ch10aModel` et `rgCan`), barre des modules reconstruite au changement d'utilisateur (original : à la session suivante) | effet plus prévisible ; identique après rechargement |
| E4 | Refus de vue : redirection vers la première vue permise ou « Aucun module » (original : la vue n'est simplement pas proposée) | une vue mémorisée (`ds_view`) ou un lien interne peut viser une vue retirée |
| E5 | Avertissement avant la protection des documents Bâtiment si des auteurs n'existent plus (41 au bureau) | éviter que 41 documents deviennent non modifiables par personne (arbitrage 31) |
| E6 | Amorçage : aucun jeu de privilèges en base → tout permis ; pas d'utilisateur → rien | une base neuve ne doit verrouiller personne |
| E7 | Lecture tolérante de `RIGHTS` (code invalide ignoré au lieu d'une exception) | robustesse |
| E8 | TVA : plage 0-100 (règle de `admVat`) | l'original accepte tout nombre ; valeur négative sans sens |
| E9 | « DELTAproject » remplacé par « DeltaSub » dans 2 messages (redémarrage, assistant) | nom du produit |
| E10 | Apostrophe typographique | convention DeltaSub |
| E11 | Polices proposées : celles des anciens modèles, pas celles du poste | le navigateur ne peut pas énumérer les polices |
| E12 | HTTP sans chiffrement : les mots de passe transitent en clair sur le réseau local ; cookie sans `Secure` | le serveur est en HTTP (décision n° 6) |
| E13 | « Mémoriser les informations » : USERID et cookie persistant de 30 jours ; jamais le mot de passe ni une empreinte (l'original mémorise l'empreinte, qui suffit à se connecter) | sécurité |
| E14 | Poste évincé déconnecté ; blocage de 60 s après 5 échecs | D6-c ; protection minimale |
| E15 | « Même poste » = même IP et même navigateur (original : même compte système et même nom d'hôte) ; « Utilisateur » de « Document verrouillé » = navigateur et système | informations disponibles côté serveur |
| E16 | Longueur minimale de 8 caractères, message de l'original réutilisé (original : aucune règle, vide permis) | décision n° 3 |
| E17 | `mayday` refusé à l'ouverture de session | compte du distributeur |
| E18 | Signature dans une collection (limite 200 Ko), pas dans un fichier partagé | pas de dépôt de fichiers indépendant de CH-03 |
| E19 | Champs d'impression : repli sur la fiche du collaborateur quand `APPUSER` est vide | éviter de vider les lettres existantes (décision n° 2) |
| E20 | Aide : texte quand le manuel manque (original : rien) | D6(5) |
| E21 | « Utilisateurs actifs » dans les Paramètres système (original : maintenance de la base, depuis la fenêtre d'ouverture de session) | pas de maintenance de base dans DeltaSub |
| E22 | Pas de limite de licences ni de message de licence | D6-k |
| E23 | Conditions de licence des domaines d'affaire et de FACTURES non reproduites | pas de licences ; seul le droit compte |
| E24 | Changement de mode d'ouverture de session pris en compte par les autres postes à leur prochain chargement | le mode est lu au démarrage |
| E25 | Règles d'écriture d'administration appliquées par le serveur aussi sans mot de passe (identité déclarée) ; réinitialisation d'un mot de passe existant réservée au mode avec mot de passe | D6(3) ; arbitrages 27 et 29 |
| E26 | Champs d'auteur des enregistrements (`USERID`, `OWNER` des documents) toujours écrits par la page ; seul `rec.who` est garanti par le serveur | le serveur ne réécrit pas le contenu des enregistrements ; en mode avec mot de passe, `ds_user` est réaligné sur la session à chaque chargement |

---

## 8. Écarts hors chantier signalés (non traités)

1. **TVA 8.1 codée en dur** dans le Devis (l. 2644) et le contrôle des coûts (l. 3000, 3006, 3029, 3050, 3075, 3114, 3115, 3167) : doivent lire `vatDefault()` ; CH-02 (qui réécrit le Devis), CH-07 / CH-01.
2. **`adrLines`** masque le pays quand `COUNTRYCODE` vaut « CH » en dur : devrait comparer au pays par défaut (`ch08aCountry()`) ; CH-04.
3. **`ownerName` pour une entité non personne** : l'original n'affiche que NAME1 (`ContactOwner.getName`, `rech_orig` § 17 : « Bureau SA » → « Bureau ») ; DeltaSub joint NAME1 et NAME2 ; CH-04.
4. **`tplSetDefaultGroup`** écrit un réglage par `DS.save`, sans `bseq` lu à l'ouverture (l. 6607) ; CH-12.
5. **Export des données** : le droit `contactExport` y est sans effet dans l'original (arbitrage 3) ; l'export des adresses contient N° AVS et date d'anniversaire ; traités par CH-10 (`spec_19` D-10.7, D-10.8).
6. **Protection Bâtiment** : `ecCanEdit` rend toujours `true`, CoCo et Devis sans contrôle ; CH-10 lot 3.
7. **Formats internationaux des exports** (`phoneToExportString`) : CH-04 / CH-10.
8. **Nouvelle affaire** : `CURRENCY` écrit « CHF » au lieu de rester vide (lecture de `mainCurrency`) ; négligeable (arbitrage 18).
9. **`copyTable`** inopérant sur les postes (contexte non sécurisé) : corrigé par CH-10 lot 1 (ancre C1 de `spec_19`).
10. **Auteur réécrit à l'enregistrement** (`dvEditor.save`, `dvDuplicate`, `ccDuplicate`, transferts de la Soumission, `spec_19` § 8 n° 2) : avec la protection à [YES], le dernier utilisateur deviendrait l'auteur ; CH-02, CH-10 lot 3, EC-1.

---

## 9. Points d'ancrage DeltaSub

Unicité vérifiée par `crit/ancres.py` (`grep -F -c` = 1) sur `a0165c9` puis **rejouée sur `9c9a3f9`** (13 h 30 : toutes à 1) ; absence de chevauchement avec les ancres des autres chantiers (`spec_13` à `spec_19`, `ch/*/lot*_integration.md`, `ch/*/lot*/build.py`) : aucune ancre de page de CH-08 n'y figure ; côté serveur, S0 et S5 sont aussi des ancres de CH-01, CH-02, CH-03 et CH-10, qui **ajoutent** une ligne avant ou après sans modifier la ligne d'ancrage (compatibles, quel que soit l'ordre). Le `build.py` de chaque lot prend le chemin du `DeltaSub.html` source en argument (défaut : celui du dépôt), vérifie chaque ancre (compte = 1) et les ancres de **présence** (P1, P2), et **échoue proprement** (message, code non nul, aucun fichier écrit) si l'une manque ou est multiple. **Chaque « nouveau » contient l'« ancien » intact** (préfixe ou suffixe), sauf A2 et A3 (fonctions de format, propres aux Paramètres système) et S10.

### 9.1 `DeltaSub.html`

| # | Lot | Ancre exacte (« ancien ») | « Nouveau » | Lieu indicatif |
|---|---|---|---|---|
| A0 | 1-4 | ligne `   DÉMARRAGE` | code du lot inséré **avant** la ligne `/* ═══…` qui ouvre ce commentaire (après le bloc CH-17 et ceux des autres chantiers) | l. 14 503 (`9c9a3f9`) |
| P1 | 1 à 4 (présence) | `  $('#boot').remove(); if(typeof ch10aInit==='function') ch10aInit();` (ancre M1 de `spec_19`, telle que CH-10 lot 1 l'écrit) | **aucune modification** ; absente → échec « Préalable manquant : CH-10 lot 1 (barre de menus) n'est pas intégré dans <source>. » | démarrage |
| P2 | 2 (présence) | `  if(typeof ch10aBeforeGo==='function'&&ch10aBeforeGo(id,arg)===false) return;` (ancre G1 de `spec_19`) | **aucune modification** ; même message | `go` |
| A1 | 3 | `  buildNav(); NET.ok(); chooseUser();` | l'ancien + ` if(typeof ch08cStart==='function') ch08cStart();` | démarrage (CH-10 vise la ligne `  $('#boot').remove();` : distincte) |
| A2 | 1 | `function phone(c,n){` … fin de la fonction (2 lignes, jusqu'à `+' '+c[p[2]]; }`) | `function phone(c,n){ return ch08aPhone(c,n); }   // CH-08 : format des Paramètres système` | l. 438-439 |
| A3 | 1 | `(nomPrenom?o.NAME1+' '+o.NAME2:o.NAME2+' '+o.NAME1)` | `((nomPrenom\|\|ch08aName1First())?o.NAME1+' '+o.NAME2:o.NAME2+' '+o.NAME1)` | `ownerName`, l. 391 |
| A4 | 1 | `ADDRESSTYPECODE:0,LANGUAGECODE:2,COUNTRYCODE:'CH',` | `ADDRESSTYPECODE:0,LANGUAGECODE:ch08aDocLangCode(),COUNTRYCODE:ch08aCountry(),` | `editContact`, l. 506 |
| A5a | 1 | `PHONECOUNTRY1:base?base.PHONECOUNTRY1:'+41',` | `PHONECOUNTRY1:base?base.PHONECOUNTRY1:ch08aDial(),` | l. 509 |
| A5b | 1 | `PHONECOUNTRY2:'+41'}; }` | `PHONECOUNTRY2:ch08aDial(),FAXCOUNTRY1:ch08aDial()}; }` | l. 509 |
| A6 | 1 | `rows:cats,sel:ADM.cat` | `rows:ch08aAdmCats(cats),sel:ADM.cat` | `VIEWS['config']`, l. 1932 (inchangé) |
| B1 | 2 | `  NAV.forEach(sec=>{` | `  NAV.filter(ch08bSecOk).forEach(sec=>{` | `buildNav`, l. 354 |
| B2 | 2 | `    sec.items.forEach(([id,label])=>{` | `    sec.items.filter(([id])=>ch08bViewOk(id)).forEach(([id,label])=>{` | l. 356 |
| B4 | 2 | `rows:DOMAINS,sel:AM.dom,sort:null,` | `rows:ch08bDomains(DOMAINS),sel:AM.dom,sort:null,` | `affNav`, l. 1489 |
| B5 | 2 | `function ibtn(b){` | l'ancien + ` b=ch08bGuard(b); if(!b) return h('span',{style:{display:'none'}});` | l. 252 |
| B6 | 2 | `closeMenus(); const m=h('div',{class:'menu'});` | `items=ch08bGuardItems(items,anchor); ` + l'ancien | `popMenu`, l. 261 |
| B7 | 2 | `function chooseUser(force){` | l'ancien + ` if(ch08bChoose(force)) return;` | l. 414 |
| B8 | 2 | `const sl=staffList(); if(!HS.staff` | `const sl=ch08bMyStaffs(); if(!HS.staff` | Heures ▸ Saisie, l. 9254 |
| B9 | 2 | `const sl=staffList(); if(!HR.staff` | `const sl=ch08bMyStaffs(); if(!HR.staff` | Heures ▸ Rapport, l. 1809 |
| B10 | 2 | `const sl=staffList(); if(!NF.staff` | `const sl=ch08bMyStaffs(); if(!NF.staff` | Notes de frais ▸ Saisie, l. 6785 |
| B11 | 2 | `const sl=staffList(); if(!NFR.staff` | `const sl=ch08bMyStaffs(); if(!NFR.staff` | Notes de frais ▸ Rapport, l. 6848 |
| C1 | 3 | `const user=ME.staff?staffName(ME.staff):ME.id;` | `const user=ch08cUserStr(ME.u,'userName')\|\|(ME.staff?staffName(ME.staff):ME.id);` | `mgPrint`, l. 2016 |
| C2 | 3 | `if(f==='user') return wrap(staffName(ME.staff)\|\|(ME.u\|\|{}).NAME\|\|'');` | `if(f==='user') return wrap(ch08cUserStr(ME.u,'userName')\|\|staffName(ME.staff)\|\|'');` | `tplPrint`, l. 6628 |
| C3 | 3 | `appUser:me?{t:'staff',id:me.ID}:null,` | `appUser:ME.u?{t:'appuser',id:ME.u.ID}:(me?{t:'staff',id:me.ID}:null),` | `svReportCtx`, l. 11010 |
| C4 | 3 | `if(v.t==='staff'){ const st=DS.get('staff',v.id), pc=st&&DS.get('contact',st.PERSON_ID);` | `if(v.t==='appuser') return ch08cUserStr(DS.get('appuser',v.id),s); ` + l'ancien | `svText`, l. 11050 |
| C5 | 3 | `im=ct.n?svImg(ct.n):(env.images\|\|{})[n];` | `im=ct.n?svImg(ct.n):((env.images\|\|{})[n]\|\|ch08cSigFor(n,env.F));` | `svDpBands`, l. 11157 |
| D1 | 4 | `  try{ await DS.boot(); }` | `  try{ await ch08dLogin(); await DS.boot(); }` | démarrage, l. 14312 |
| D2 | 4 | `try{ const d=await (await fetch('/api/changes?since='+this.seq,{cache:'no-store'})).json();` | `try{ const r0=await fetch('/api/changes?since='+this.seq,{cache:'no-store'}); if(r0.status===401){ ch08dExpired(r0); return; } const d=await r0.json();` | `DS.poll`, l. 203 |
| D3 | 4 | `    if(r.status===409){ d.conflicts.forEach(c=>this._put(c.t,c.id,c.seq,c.val));` | `    if(r.status===401\|\|r.status===403){ ch08dRefused(r.status,d); const e=new Error('session'); e.conflict=true; throw e; }` + saut de ligne + l'ancien | `DS.commit`, l. 192 |
| D4 | 4 | `const d=await (await fetch('/api/snapshot?t='+miss.join(','),{cache:'no-store'})).json();` | `const r0=await fetch('/api/snapshot?t='+miss.join(','),{cache:'no-store'}); if(r0.status===401){ ch08dExpired(r0); throw new Error('session'); } const d=await r0.json();` | `DS.need`, l. 183 |
| D5 | 4 | `x.open('GET','/api/ids?t='+t+'&n='+n,false); x.send(); return JSON.parse(x.responseText);` | `x.open('GET','/api/ids?t='+t+'&n='+n,false); x.send(); if(x.status===401){ ch08dExpired(); throw new Error('session'); } return JSON.parse(x.responseText);` | `DS.newIds`, l. 185 |

Dans le fichier d'intégration, les `\|` de ce tableau s'écrivent `|`. Retirées depuis la première rédaction : l'ancien A1 (`ch08aMenuBar`, la barre est à CH-10), A7 (`copyTable`, corrigé par CH-10 C1), B3 (`go`, remplacé par `rgBeforeGo` via le crochet G1 de CH-10).

Risques : CH-10 lot 1 réécrit des lignes de `NAV` (N1, N3) et le clic des sections de `buildNav` (M4) : lignes distinctes de B1 et B2 ; CH-12 la ligne `{s:'Modèles',` (sans effet ici : les droits suivent les identifiants de vue) ; CH-10 le libellé « Calcul des honoraires » de `DOMAINS` (les deux libellés sont dans la table des domaines) ; CH-02 lot 1 réécrit le Devis (aucune ancre de CH-08 dans le Devis) ; CH-06 pourrait réécrire la liste `cats` de l'Administrateur (A6 : ancre courte, catégories inconnues conservées par le filtre).

### 9.2 `serveur_deltasub.py` (build par ancres, copie modifiée complète + diff)

Le serveur change aussi en parallèle (CH-01, CH-02 lot 3, CH-03, CH-10 lot 2) : les lots 1 et 4 livrent `build_serveur.py`, qui applique ses remplacements par ancres (même contrôle d'unicité que pour la page) au serveur source donné en argument et produit la copie modifiée complète et le diff. Unicité vérifiée le 30.09.2026 (13 h 30).

| # | Lot | Ancre exacte | Modification |
|---|---|---|---|
| S0 | 1 | `PROTECTED_IF_EDITED \|= {"statisticalvalue", "constructionpart", "constructioncomponent", "ebkpelement", "ebkptobkp"}` | l'ancien, puis le bloc CH-08 partie A : `CH08_PIT`, `PROTECTED \|= {"appusersignature"}`, `MANUEL_FR` (`DELTASUB_MANUEL` ou le chemin fixe de l'application), `_ch08_touched(c)`, `_ch08_warn(t, rid, rec, c)`, `_ch08_manual(h)` (envoi par blocs, sans gzip) |
| S2 | 1 | `        pie = sorted(PROTECTED_IF_EDITED)` | `        pie = sorted(PROTECTED_IF_EDITED \| CH08_PIT)   # CH-08 : utilisateurs, droits, réglages touchés dans DeltaSub` |
| S3 | 1 | `    kept \|= set(kept2)   # eCCC lot 0` (début de ligne) | la ligne entière, puis `    kept \|= _ch08_touched(c)   # CH-08 : vivants ou supprimés, dernier auteur ≠ import` |
| S4 | 1 | `                if (table.lower(), str(rid)) in kept:   # déjà saisi / modifié dans DeltaSub : conservé` | l'ancien, puis (20 espaces) `_ch08_warn(table.lower(), str(rid), rec, c)   # CH-08 : collision d'identifiant` |
| S5 | 1 | `            f = STATIC.get(u.path)` | `            if u.path == "/aide/manual_fr.pdf":` ⏎ `                return _ch08_manual(self)   # CH-08` ⏎ puis l'ancien (CH-03 S3 insère aussi avant cette ligne : compatible) |
| S6 | 1 | `"import": json.loads(imp[0]) if imp else None}))` | `"import": json.loads(imp[0]) if imp else None, "aide": os.path.isfile(MANUEL_FR)}))` |
| S6b | 4 | `"aide": os.path.isfile(MANUEL_FR)}))` (texte du lot 1) | `"aide": os.path.isfile(MANUEL_FR), "auth": ch08_auth_on(c)}))` |
| S8 | 4 | `    def do_GET(self):` | l'ancien, puis `        if not ch08_gate(self, "GET"):` ⏎ `            return   # CH-08 lot 4 : session exigée (première instruction, § 4.20.1)` |
| S9 | 4 | `    def do_POST(self):` | idem avec `"POST"` |
| S10 | 4 | `            seq = commit(c, body.get("ops") or [], str(body.get("who") or self.client_address[0])[:80])` | `            who = ch08_who(self, c, body)   # CH-08 : session ou identité déclarée ; règles du § 4.20.3 ; None = 403 déjà envoyé` ⏎ `            if who is None:` ⏎ `                return` ⏎ `            seq = commit(c, body.get("ops") or [], who)` ⏎ `            ch08_after_commit(c, body.get("ops") or [])` |
| S11 | 4 | `    CREATE TABLE IF NOT EXISTS lock(t TEXT, id TEXT, who TEXT, ts REAL, PRIMARY KEY(t, id));` | l'ancien, puis les 3 `CREATE TABLE` du § 3.5 |
| S12 | 4 | `    ap.add_argument("--port", type=int, default=PORT)` | l'ancien, puis `--desactiver-authentification`, `--mot-de-passe` |
| S13 | 4 | `    if a.importer_deltaproject:` | les deux commandes (§ 4.20.4), puis l'ancien |
| S14 | 4 | `IMPORT_WHO = "import Deltaproject"` | le bloc d'authentification (`import hashlib, hmac, secrets, getpass`, `http.cookies`, constantes, fonctions `ch08_*`), puis l'ancien |

Dans le fichier d'intégration, les `\|` de ce tableau s'écrivent `|`. `S7` de la première rédaction (préfixe de `class H`) est fondu dans S0. `ch08_gate` et `ch08_who` ne changent **rien** au comportement actuel quand `auth_enabled` vaut « 0 », hormis les règles d'écriture du § 4.20.3 (vérifié par S2 et S16).

### 9.3 Fonctions exposées (contrat entre lots et chantiers)

- Lot 1 : `ch08aCan`, `ch08aRights`, `ch08aRightsParse`, `ch08aRightsStr`, `CH08A_RIGHTS`, `ch08aBool`, `ch08aSep`, `ch08aSettingOps`, `ch08aCountry`, `ch08aDial`, `ch08aCountryName`, `CH08A_COUNTRIES`, `ch08aDocLangCode`, `ch08aPhoneStr`, `ch08aPhone`, `ch08aName1First`, `ch08aAdmCats`, `ch08aSysPrefs`, `ch08aLegacyPrefs`, `ch08aOrphanDocs`, `ch08aHelp`, `ch08aAbout` ; **contrat CH-10** : `rgCan`, `rgSystemPreferences`, `rgSystemLegacyPreferences`, `rgHelp`, `rgAbout`.
- Lot 2 : `ch08bUserAdmin`, `ch08bUserDlg`, `ch08bFuncDlg`, `ch08bRoleDlg`, `ch08bPickFunction`, `ch08bPickRole`, `ch08bPickRight`, `ch08bPickStaff`, `ch08bUserOps`, `ch08bDelCheck`, `ch08bViewOk`, `ch08bSecOk`, `ch08bFirstView`, `CH08B_NONE`, `CH08B_NONE_ID`, `ch08bDomains`, `CH08B_GUARDS`, `ch08bGuard`, `ch08bGuardItems`, `ch08bMyStaffs`, `ch08bChoose` ; **contrat CH-10** : `rgUserAdmin`, `rgBeforeGo`.
- Lot 3 : `ch08cStart`, `ch08cPreferences`, `ch08cPrefs`, `ch08cApply`, `ch08cDocLang`, `ch08cDocLangCode`, `ch08cVcardCharset`, `ch08cUserStr`, `ch08cSigFor`, `ch08cEmployees`, `ch08cAutoEmployees`, `ch08cEmployeeOps` ; **contrat CH-10** : `rgPreferences`, `rgEmployees`.
- Lot 4 : `ch08dLogin`, `ch08dAuthOn`, `ch08dLoginDlg`, `ch08dOverrideDlg`, `ch08dPasswordDlg`, `ch08dSetPassword`, `ch08dExpired`, `ch08dRefused`, `ch08dSessionMenu`, `ch08dLogout`, `ch08dSysRubric`, `ch08dActiveUsers`.
- Noms libres, vérifiés par `crit/prefixes.py` (13 h 30) : `ch08`, `CH08`, `rg` déclarés (le préfixe `rg` sert **uniquement** aux 9 enveloppes du contrat CH-10), `ds_ch08`, `appusersignature`, `auth_pw`, `auth_session`, `auth_fail`, `/api/login`, `/api/auth`, `/api/session`, `/api/password`, `/api/logout`, `/aide/`, `ch08_` / `CH08_` (serveur) : 0 occurrence dans `DeltaSub.html`, `serveur_deltasub.py` et `ch/*/` (hors CH-08). Classes CSS `.ch08a-*`, `.ch08b-*`… ; identifiants `#ch08c-css`.

**Fonctions existantes réutilisées sans modification** : `h`, `esc`, `num`, `cmp`, `nm`, `toast`, `ibtn`, `popMenu`, `closeMenus`, `dialog`, `confirmDlg`, `formRows`, `readK`, `grid`, `gridSel`, `phead`, `seg`, `col`, `ecCss`, `ecCatDialog`, `ctMsg`, `ctBox`, `ivOkBtn`, `ivLine`, `plInfo`, `plAsk`, `hfSet`, `hfNum`, `vatDefault`, `staffName`, `staffList`, `contactName`, `ownerOf`, `svStaffOfUser`, `buildNav`, `go`, `ME`, `NET`, `VIEWS`, `NAV`, `DS.all/get/by/commit/newIds/need` ; de CH-10 lot 1 : `ch10aBeforeGo` (crochet), `ch10aModel` (test J5 seulement).

---

## 10. Plan en lots

Quatre lots (la fiche en prévoyait six : Paramètres système, Préférences, Utilisateurs, Session, Application des droits, Assistant et Aide). Fusions : socle des droits + Paramètres système + formats + Aide (lot 1) ; utilisateurs + application des droits (lot 2) ; Préférences + impressions + assistant (lot 3) ; session et mots de passe (lot 4). La barre de menus n'est plus dans ce plan : elle est livrée par CH-10 lot 1 (arbitrage 2).

**Préalable externe (tous les lots)** : CH-10 lot 1 intégré dans le `DeltaSub.html` source (ancre de présence P1 ; P2 pour le lot 2). Ordre d'intégration : CH-10 lot 1, puis CH-08 lot 1, puis 2, puis 3 et 4 dans n'importe quel ordre. Chaque lot : fichier JS séparé (`ch/CH-08/lotN/ch08x.js`, déclarations de haut niveau seulement, aucun accès au DOM au chargement), `build.py` (page), `build_serveur.py` (lots 1 et 4), tests jsc (et Python pour le serveur), `lotN_integration.md` (remplacements « ancien → nouveau »), `DeltaSub.html` construit pour l'essai.

### Lot 1 — Socle : droits, Paramètres système, formats, Aide, reprise protégée (préfixe `ch08a` / `CH08A` ; contrat `rgCan`, `rgSystemPreferences`, `rgSystemLegacyPreferences`, `rgHelp`, `rgAbout`)

- **Contenu** :
  - moteur de droits : `CH08A_RIGHTS` (66), `ch08aRightsParse`, `ch08aRightsStr`, `ch08aRights`, `ch08aCan` ; `rgCan` (clé ou code) pour la barre de CH-10 (§ 3.4, § 4.1) ;
  - réglages : `ch08aBool`, `ch08aSep`, `ch08aSettingOps` ; `CH08A_COUNTRIES` (script `build_pays.py`, lecture seule de `countries.csv`), `ch08aCountry`, `ch08aDial`, `ch08aCountryName`, `ch08aDocLangCode` (§ 3.3, § 4.3.1) ;
  - Paramètres système et 6 sous-dialogues, Navigateur de pays, avertissement des documents à auteur inconnu (`ch08aOrphanDocs`) ; [Ancien document] et « Définir la police standard » (§ 4.3, § 4.4) ;
  - formats : `ch08aPhoneStr`, `ch08aPhone`, `ch08aName1First` ; défauts d'une nouvelle adresse ; `ch08aAdmCats` (retrait de « Taux de TVA », filtre des catégories par droit) (§ 4.5) ;
  - Aide et « A propos de DeltaSub » (§ 4.6) ;
  - enveloppes du contrat CH-10 (§ 4.1) ;
  - serveur, partie A : protection des 7 collections touchées et de `appusersignature` au ré-import, message de collision, route `/aide/manual_fr.pdf`, `ping.aide` (§ 3.6, § 4.20) ;
  - ancres A0, P1, A2 à A6 ; serveur S0, S2 à S6.
- **Tests** : J1 à J11 ; S14, S15 ; essais B1-1 à B1-8.
- **Dépendances** : aucune dans le chantier ; externe : CH-10 lot 1.

### Lot 2 — Gestion des utilisateurs et application des droits (préfixe `ch08b` / `CH08B` ; contrat `rgUserAdmin`, `rgBeforeGo`)

- **Contenu** :
  - « Gestion des utilisateurs » : 3 onglets, filtre, suppressions et leurs messages (§ 4.7) ;
  - « Saisir un utilisateur » / « Modifier l'utilisateur », avec crochets `typeof` vers le lot 4 pour le mot de passe (§ 4.8) ;
  - fonctions, jeux, « Droits d'utilisateur », navigateurs de fonction, de jeu et de collaborateur (§ 4.9) ;
  - application des droits : sections et entrées de la barre des modules, refus de vue (`rgBeforeGo`), domaines, table de gardes dans `ibtn` et `popMenu` (hors barre de CH-10, avec contrôle des libellés par le build), collaborateurs de la saisie pour autrui (§ 4.10) ;
  - « Qui utilise ce poste ? » corrigé et double-clic sur `#net`, crochet vers le lot 4 (§ 4.2, § 4.11) ;
  - ancres A0, P1, P2, B1, B2, B4 à B11.
- **Tests** : K1 à K9 ; essais B2-1 à B2-7 (avec `ds_user` 2752, 2753 et 1).
- **Dépendances** : lot 1 (`ch08aCan`, `CH08A_RIGHTS`, `rgCan`) ; externe : CH-10 lot 1 (crochet G1).

### Lot 3 — Préférences, champs utilisateur des impressions, assistant (préfixe `ch08c` / `CH08C` ; contrat `rgPreferences`, `rgEmployees`)

- **Contenu** :
  - Préférences : Langue des documents, Utilisateur (5 champs, signature dans `appusersignature`), Saisie de texte, Tableau, vCard export ; `ch08cPrefs`, `ch08cApply`, `ch08cDocLang`, `ch08cDocLangCode`, `ch08cVcardCharset` (§ 4.12) ;
  - `ch08cUserStr`, `ch08cSigFor` et leurs branchements dans `mgPrint`, `tplPrint`, `svReportCtx`, `svText`, `svDpBands` (§ 4.13) ;
  - assistant « Configurer un collaborateur » et son ouverture automatique ; `ch08cStart` au démarrage (CSS des préférences, assistant) (§ 4.14) ;
  - ancres A0, P1, A1, C1 à C5.
- **Tests** : L1 à L6 ; essais B3-1 à B3-3.
- **Dépendances** : lot 1 (droits, protection de `appusersignature` au ré-import, `ch08aDocLangCode` qui délègue à `ch08cDocLangCode`) ; lot 2 (navigateur « Choisir les fonctions » de l'assistant).

### Lot 4 — Session et mots de passe : serveur et page (préfixe `ch08d` / `CH08D` ; serveur `ch08_` / `CH08_`)

- **Contenu** :
  - serveur, partie B : tables `auth_pw`, `auth_session`, `auth_fail` ; PBKDF2 ; contrôle d'accès en tête de `do_GET` / `do_POST` et routes du § 4.20.1 ; ouverture de session (§ 4.20.2) ; règles d'écriture dans les deux modes (§ 4.20.3) ; `who` de la session ; commandes locales (§ 4.20.4) ; ancres S6b, S8 à S14 ;
  - page : `ch08dLogin` et « Ouverture de session » (§ 4.15), « Document verrouillé » (§ 4.16), dialogues de mot de passe (§ 4.17), rubrique « Ouverture de session » et « Utilisateurs actifs » (§ 4.18), fin de session, expiration, refus (§ 4.19), menu de `#net` (§ 4.2) ; ancres A0, P1, D1 à D5.
- **Tests** : S1 à S13, S16, S17 (Python, mots de passe de test générés, jamais affichés ni écrits) ; essais B4-1 à B4-6.
- **Dépendances** : lot 1 (serveur partie A, S6b s'appuie sur le texte de S6 ; rubrique des Paramètres système) ; lot 2 (crochets de `AppUserDialog` et de `ch08bChoose`).

### Non livré (et pourquoi)

| Élément | Raison |
|---|---|
| Barre de menus, menu Édition, Affichage, correction de `copyTable` | CH-10 lot 1 (préalable) |
| Entrées sans objet (licences, Support, mises à jour, DELTAprojectFiles, Export iOS, [Dev], maintenance, langues de dialogue) ; Préférences Correcteur, Apparence, DELTAbaucost, Bâtiment | § 2.3 |
| Export des données, Importer les modèles, protection et verrou Bâtiment | CH-10 lots 2 et 3 (droits par `rgCan`) |
| Imports vCard / CSV, export vCard | CH-04 (droits par `rgCan` ; `ch08cVcardCharset`) |
| Emplacements des modèles et des documents externes, domaine Fichiers | CH-13 (droit `projectFiles` dans la table des domaines) |
| Langue des documents appliquée au choix des modèles | CH-09 (`ch08cDocLang` prêt) ; aujourd'hui les moteurs prennent les modèles français |
| Fiche d'adresse en lecture seule (`contactEdit`), tuiles du Controlling (`projectTime`, `projectCosts`), catégories de Management ▸ Collaborateurs (`managementStaff`), plan comptable du Devis et du CoCo (`projectBkp`), « Importer des heures » (`admin`), subdivisions par affectations et par locaux | dialogues ou tuiles sans libellé stable pour la table de gardes, dans des modules réécrits par d'autres chantiers (CH-02, CH-04, CH-05, CH-07) ; **sans effet au bureau** (§ 4.10.5) ; `ch08aCan` est prêt pour ces chantiers |
| Unification de `plCan` et `svRight` avec `ch08aCan` | résultats identiques sur les données du bureau (J4) ; passe de nettoyage ultérieure, pour ne pas toucher aux blocs de spec_10 et spec_11 |
| Polices standard des anciens modèles utilisées à l'impression | aucun moteur ne les lit (CH-12 / CH-14) |
| HTTPS | décision n° 6 ; demande un certificat installé sur chaque poste |
| Reprise des mots de passe, des empreintes et des sessions de Deltaproject | exclue par D6(1) : `SKIP_COLUMNS` inchangé, aucune lecture de `APPUSER.PASSWORD` |

---

## 11. Décisions restantes pour Paulo

*Déjà arrêté le 30.09.2026 (D6), non redemandé : mots de passe jamais en clair (PBKDF2 salé côté serveur), sessions par cookie, ouverture de session désactivée par défaut, 66 droits appliqués comme dans l'original, Préférences et Paramètres système utiles repris, aide par le manuel installé. Le menu « Édition » est tranché dans CH-10 (D-10.1).*

1. **Appliquer les droits tels qu'ils sont réglés dans Deltaproject.** Conséquence au bureau dès les lots 1 et 2 : les 5 personnes actives qui n'ont que le jeu Standard ne verront plus COLLABORATEURS, FACTURES, MANAGEMENT, Réglages ▸ Administrateur, Paramètres système et Gestion des utilisateurs, ni les domaines Calcul des honoraires, Avancement des prestations, Planification RH et Analyse de planification RH ; en Heures et Notes de frais, elles ne saisiront que pour leur propre collaborateur. C'est exactement leur écran dans Deltaproject. Pour leur rendre un module, il suffit d'ajouter le droit au jeu Standard dans Gestion des utilisateurs. **Par défaut : fidèle** ; variante : ajouter d'abord `staff` et `management` au jeu Standard.
2. **Champs « utilisateur » des impressions** : Deltaproject imprime le nom du compte (au bureau, un seul mot) et les initiales, téléphone, courriel, titre et fonction des Préférences (vides aujourd'hui) ; DeltaSub imprime aujourd'hui la fiche du collaborateur. **Par défaut : champs du compte, avec repli sur la fiche du collaborateur tant qu'un champ est vide** ; le nom devient celui du compte (à compléter dans Gestion des utilisateurs si le nom complet est souhaité). Variante : strictement fidèle (champs vides imprimés vides).
3. **Longueur minimale des mots de passe** : **par défaut 8 caractères** ; Deltaproject n'a aucune règle et accepte un mot de passe vide (8 comptes sur 11 en ont un vide).
4. **Première connexion** : **par défaut, chaque personne définit son mot de passe à sa première connexion** (le compte est alors pris par la première personne qui s'y connecte) ; variante : l'administrateur fixe tous les mots de passe avant l'activation (case à décocher dans Paramètres système ▸ Ouverture de session).
5. **Durée des sessions** : **par défaut 12 h sans activité, ou 30 jours avec « Mémoriser les informations »**.
6. **Réseau** : le serveur reste en HTTP ; les mots de passe transitent en clair sur le réseau local du bureau. **Par défaut : accepté** ; HTTPS (certificat local sur chaque poste) pourrait faire l'objet d'un chantier ultérieur.
7. **Formats du bureau appliqués partout** : les téléphones s'afficheront « 021 … » (réglage du bureau : sans indicatif du pays) au lieu de « +41 21 … » dans toutes les listes et impressions de DeltaSub. **Par défaut : oui** (fidèle) ; le format se change dans Paramètres système ▸ Téléphone.
8. **Signature** : image PNG de 200 Ko au plus, conservée dans la base DeltaSub (et non dans `DELTAprojectFiles`). **Par défaut : oui.**
9. **Documents Bâtiment sans auteur existant** (41 : 25 devis, 16 contrôles des coûts) : avant d'activer la protection « auteur uniquement », les rattacher à un compte existant ? **Par défaut : non** (la protection reste à « tous les utilisateurs », réglage du bureau) ; DeltaSub avertit si on l'active.

# Cahier des charges — CH-04 « Adresses et collaborateurs : imports, étiquettes, fiches, modification groupée » dans DeltaSub

**Rédaction critique du 01.10.2026.** Elle s'appuie sur les deux recherches du chantier (`ch/CH-04/rech_orig.md`, `ch/CH-04/rech_exist.md`), sur la fiche CH-04 de l'inventaire (`research/inv/inventaire_modules.md`, § 12.2, matrices A, B, H, I, et corrections du § 16 : C1, A2, § 16.4 n° 5), sur `vague4.json` (cahier `spec_20_adresses_imports`, ports à partir de 8000) et sur les cahiers voisins `spec_1` à `spec_19`. Chaque point contesté a été retranché à la source : bytecode (javap), `Strings.db` (colonne `fr`), données de la base de test, code de `DeltaSub.html` et de `serveur_deltasub.py`. Les preuves nouvelles de cette rédaction sont signalées « (vérifié ici) ».

Ce cahier décrit comment ajouter à `DeltaSub.html` :
- l'**import de vCards** (assistant à deux volets, jusqu'à 3 adresses) et l'**export vCard** ;
- l'**import d'adresses** au format CSV (disposition fixe de 33 colonnes) et `.archfile` ;
- la **modification groupée** « Editer des adresses … », le **bloc-notes temporaire** et les **menus de suggestions** de la fenêtre d'adresse ;
- les **liens vers l'annuaire et les cartes** (search.ch, local.ch, map.search.ch, Google Maps, appel) ;
- les **documents** Fiche de l'adresse, Liste adresses de l'entité, Liste des banques, Fiche-collaborateur, Liste des collaborateurs (depuis Collaborateurs), et la fenêtre **Liste d'adresses par entité / par CFC** ;
- **Participation aux affaires** des collaborateurs ;
- les **étiquettes** et l'**assistant « Liste d'adresses » [Ancien document]** avec ses favoris, avec la correction du convertisseur des anciens modèles qui les rend imprimables ;
- la **protection au ré-import** des saisies d'adresses faites dans DeltaSub.

Il répond à la demande de Paulo du 30.09.2026 : « ajouter les modules manquants », reproduire fidèlement tout ce qui est reproductible (hors contenu CRB).

**Conventions**
- **[P] PROUVÉ** : bytecode `Classe.méthode@offset` (désassemblages `ch/CH-04/w/a/`, `w/d/`, ou javap refait ici par `ch/CH-04/w/jp.sh`), libellé `Strings.db (classe|clé)`, donnée de la base de test, ou code de DeltaSub cité exactement.
- **[D] DÉDUIT** : interprétation cohérente, non démontrée ligne à ligne ; le lot concerné la vérifie dans le bytecode avant de coder.
- **[C] CHOIX** : décision de conception pour DeltaSub, signalée à Paulo (§ 7 et § 11).
- Paquets abrégés : `adr.` = `deltaproject.addresses.`, `lbl.` = `deltaproject.adr.label.`, `lst.` = `deltaproject.adr.list.`, `vc.` = `deltaproject.vCard.`, `emp.` = `deltaproject.employee.`.
- Dans les tableaux, une barre verticale qui fait partie d'un code est écrite `\|` ; le texte réel est `|`.
- Libellés : texte de `Strings.db` ; DeltaSub écrit l'apostrophe typographique « ’ » et « … » précédé d'une espace (convention de la page, `spec_19` arbitrage 19).

**Références**
- `DeltaSub.html` du dépôt au 01.10.2026 : **21 887 lignes, md5 `df42ee3eaff3df24052b96479d7fd93e`** (HEAD `9f184fe`), identique à la version de `rech_exist`. Les chantiers parallèles modifient ce fichier : **seules les ancres textuelles du § 9 font foi**, les numéros de ligne sont indicatifs.
- `serveur_deltasub.py` : 1 846 lignes, md5 `adb73549951af0e1a6778677b3761449`.
- `outils_deltaproject/convertir_modeles.py` (appelé par `extraire.sh` à chaque reprise Deltaproject) ; `outils_deltaproject/importer_dans_deltasub.sh`.
- Base de test `dstest/deltasub.sqlite` (lue en `mode=ro`) : séquence **691** au moment de la rédaction ; `contact` 755, `contactowner` 727, `bankaccount` 125, `staff` 13, `projectmember` 1 324, `modele` 353, `formtemplate` 316, `doctemplate` 625, `projectdocument` 1.

**Aucune donnée personnelle** : identifiants, compteurs, libellés d'interface et exemples fictifs seulement. **Aucun contenu CRB** : les textes des CFC sont lus dans la base au moment de l'affichage (collection `catalogpos`), jamais recopiés dans le code ni dans les tests.

---

## 0. Synthèse

1. **Ré-import et adresses (urgent).** Aucune collection d'adresses n'est protégée dans `serveur_deltasub.py` [P] (`PROTECTED`, `PROTECTED_IF_EDITED`, `CH08_PIT`). Un ré-import Deltaproject (`importer_dans_deltasub.sh`, point 2 de la demande de Paulo de ce jour) **efface donc toute adresse, entité, compte bancaire, propriété, note, groupe, intervenant ou attribution d'activité créé ou modifié dans DeltaSub**. Contrairement à ce que dit la demande, ces saisies ne sont **pas** protégées aujourd'hui. Le lot 1 ajoute ces collections à la protection « touché dans DeltaSub » de CH-08 (deux lignes de serveur, intégrables seules et **avant** le ré-import), avec l'avertissement de collision d'identifiant.
2. **L'import CSV « avec mappage » n'existe pas** dans l'original 16.05 [P vérifié ici] : `Fichier ▸ Importer des adresses …` lit un CSV selon une **disposition fixe de 33 colonnes** ; seuls le séparateur (détecté) et « Ignorer la première ligne à l'importation » se règlent. Les classes à mappage (`adr.ImportCSVDialog2`, `adr.ImportDialog`, `vc.VCardFieldsTableModel`) ne sont appelées par **aucune** classe des 7 archives. `spec_1` § 3.7 (mappage, 26 champs, « Définir comme standard ») décrit une version antérieure.
3. **vCard** : un assistant à **deux volets** (personne, société) ; il ne crée rien lui-même, chaque adresse passe par le dialogue standard « Nouvelle adresse » prérempli. **Export** : une vCard 3.0 par adresse, au texte exact de l'original.
4. **Étiquettes** : seul l'**ancien circuit** (`lbl.LabelPreviewDialog`, anciens modèles `label`) fonctionne au bureau ; le nouveau circuit `.dpdoc` exige des modèles d'étiquettes JSON, **absents** au bureau (CH-12). Mais les planches converties dans DeltaSub ont **perdu leur géométrie** : le convertisseur des anciens modèles est à corriger (lot 4), puis les modèles à reconvertir par la prochaine reprise.
5. **La « Liste d'adresses » imprime aujourd'hui des pages blanches** [P] : `printAdr` choisit le modèle orphelin `address1`, dont la géométrie est perdue. Le lot 4 fait choisir le modèle déclaré (`address2`), ce qui répare la liste **sans attendre** la reprise.
6. **Documents `.dpdoc`** du jeu 0 (« Group.general ») : Fiche de l'adresse, Liste adresses de l'entité, Liste des banques, Fiche-collaborateur, Liste des collaborateurs. Ils passent par `ch11aReport` (CH-11), qui prend le jeu 0 par `ch01aTplPick(type,null)` ; les formats de champ absents de `svFmtVal` sont fournis par des clés `nom~style` (`ch11aFlat`), **sans modifier** `svFmtVal`.
7. **Modification groupée** : seuls les champs **déjà identiques** dans toutes les adresses sont modifiables ; les autres sont grisés avec « - ».
8. **Annuaire et cartes** : URL exactes de l'original ; le lien map.search.ch existant de DeltaSub est réaligné (rue « - » NPA, sans localité).
9. **Participation aux affaires** : liste des inscriptions « Collaborateurs » (rôle d'équipe 12) du collaborateur, ajout multiple, suppression contrôlée, attribution des groupes d'activités.
10. **Retirés du chantier** : « Valider les courriels » (présent, `mailList`), les « Lettres en série » des groupes (absentes en 16.05), « Liste d'adresses … » au nouveau format (CH-09), modèles d'étiquettes `.dpdoc` (CH-12).
11. **4 lots** au lieu des 6 de la fiche : (1) imports, export vCard, crochets de menus, protection au ré-import ; (2) saisie et modification des adresses ; (3) documents `.dpdoc`, liste par entité / CFC, collaborateurs ; (4) étiquettes et listes [Ancien document], convertisseur.

---

## 1. Arbitrages entre les sources (tranchés à la source)

| # | Sujet | Affirmations en présence | Verdict | Preuve |
|---|---|---|---|---|
| 1 | Import CSV « avec mappage » | fiche, `spec_1` § 3.7 : mappage 26 champs, « Définir comme standard » ; `rech_orig` : disposition fixe | **Disposition fixe de 33 colonnes**, sans mappage. `ImportCSVDialog2`, `addresses.ImportDialog`, `VCardFieldsTableModel` : **0 référence** hors de leurs propres classes dans `app.jar` extrait, `jarbauad`, `db.jar`, `doc.jar`, `util.jar`, `aq.jar`, `app.jar` | [P vérifié ici] recherche binaire de `ImportCSVDialog2`, `deltaproject/addresses/ImportDialog`, `VCardFieldsTableModel` (0 appelant) ; `DataImport.importContacts@80-112` (`.CSV` → `ImportCSVDialog.importCSV`, `.ARCHFILE` → `ImportAFDialog.importCSV`) |
| 2 | Réglage `AddressImportSettings` | `rech_exist` : mappage enregistré, à décoder | **Obsolète**, lu par aucune classe de 16.05. Non repris ; sert seulement de trace historique | `rech_exist` § 1.7 ; `rech_orig` § 0.1 |
| 3 | Création d'une personne par le CSV | `rech_orig` : col5 **ou** col6 | **Confirmé** : personne créée si `NAME1` (col5) ou `NAME2` (col6) n'est pas vide ; **réutilisée** seulement si les deux sont présents et que la clé col5+col6+col7 existe déjà dans le fichier | [P vérifié ici] `ImportCSVDialog$ImportThread.run@285-465` |
| 4 | Société du CSV | — | Créée si col1 n'est pas vide ; clé = col1 + col3 (concaténation Java : une colonne absente donne « null ») ; type société, `NAME1` = col1, `NAME2` = col2 | [P vérifié ici] `run@120-221` |
| 5 | Troncature du CSV | `rech_orig` : max − 1 | **Confirmée** : `trim()`, puis si longueur > max → `substring(0, max−1)` ; colonne absente → `null` | [P vérifié ici] `ImportCSVDialog.getFieldData@0-38` |
| 6 | Volets de l'assistant vCard | fiche : « jusqu'à 3 adresses » ; `spec_1` : colonnes Personne / Société | **Deux volets**, trois créations possibles (société, personne liée à la société, personne privée) | [P] `vc.ImportVCardDialog.<init>`, `newContact@0-479` (`rech_orig` § 2.3-2.4) |
| 7 | Indicatif d'un numéro de vCard | `rech_orig` : « 41 » | Le découpage rend « 41 » (sans « + ») [P `vc.Phone.getPhoneNumer@79-81`]. **[C]** DeltaSub enregistre « +41 », format des données du bureau (730 adresses sur 755 en « +41 ») | [P] base de test (`PHONECOUNTRY1`) ; [D] effet exact d'un indicatif vide sur le champ prérempli (`showVCard@307-360`), à vérifier par le lot 1 |
| 8 | Entités : vCard dans la roue de gauche | `spec_1` § 3.1, `rech_exist` § 1.2 : « Export vCard » à gauche | **Absent en 16.05** : la roue des entités = infos, —, « Afficher les entités masquées », « Actualiser la liste ». L'export est dans la roue des **adresses** de l'entité : « Exporter vCards … » | [P vérifié ici] `ContactListFrame.getContactOwnerWheelPopupMenu@0-102`, `getContactWheelPopupMenu@31-126` (`ExportVCard.addExportPopupMenuItems`) ; la clé `ContactListFrame\|exportVCard` est un reste |
| 9 | « Valider les courriels » | fiche : CH-04 ; `rech_exist` D6 : contrôle de forme ? | **Présent** (`mailList`, critique C1) et **sans contrôle de forme dans l'original** : `CheckEmailListDialog` reçoit une liste de chaînes et ne contient ni motif ni validation. Rien à faire | [P vérifié ici] javap `adr.CheckEmailListDialog` (aucun `Pattern`, `matches`) |
| 10 | Lettres en série des groupes | inventaire P02, P45 ; manuel FR p. 20 | **Absentes en 16.05** : `GroupFrame` réutilise `AddressListFrame` (cadre `addressGroup`), mêmes menus que la Liste des adresses ; aucune classe de publipostage | [P] `rech_orig` § 0.10 |
| 11 | Choix du modèle de la Liste d'adresses | `rech_exist` D1, `rech_orig` § 0.4 | `tplFind` prend `Standard/address1` (premier par nom), **orphelin** (aucune ligne `FORMTEMPLATE`) et sans géométrie ; le seul modèle déclaré est `address2` (`FORMTEMPLATE` 4502 Default, 4507 Standard) | [P vérifié ici] base de test : `modele` contient `address1` et `address2` dans Default et Standard ; `formtemplate` TYPE `addressList` = 4502, 4507, NAME `address2` |
| 12 | Géométrie des planches d'étiquettes | `rech_exist` D2, `rech_orig` § 0.4 | **Perdue** : `labelTemplates/Standard/label/Herma`, planche « No. 4267 » : 16 éléments à x = y = l = h = 0, dont 1 seul `champ label` et 15 « texte » | [P vérifié ici] base de test, `modele` |
| 13 | Nombre d'étiquettes par page | — | Nombre de champs de type `label` **ou** `address` ; seuls les `label` sont remplis | [P] `lbl.LabelPreviewDialog.getNofLabelsPerPage`, `fillPage@180-290` |
| 14 | Ordre de remplissage des étiquettes | — | Ordre des composants triés par **y puis x** croissants | [P vérifié ici] `aq.form.View.getOrderedComponentList` (`Collections.sort` avec `View$1.compare` : `getY`, puis `getX`) |
| 15 | Calcul des pages et des copies | `rech_orig` § 4.2 | **Confirmé** : `pages = ceil((début−1 + N×copies)/n)` ; page p : `k = p×n − (début−1)`, `i = k / copies` (division entière Java, tronquée vers 0), `c = 1 + k % copies` (reste Java) ; champ vide si `c ≤ 0` ou `i` hors de [0, N[ | [P vérifié ici] `calcNofPages@0-44`, `fillPage@65-290` |
| 16 | Texte d'une étiquette | `rech_orig` : = `svAddress(c,'\n')` | **Pas tout à fait** : `Contact.getAddress(sep)` joint NAME1-3 par sep, puis ajoute **toujours** sep, puis rue, case postale, « NPA localité » (si la localité existe), et le pays en majuscules s'il diffère du **pays standard des Paramètres système** (`standardCountryCode`). `svAddrTail` compare à « CH » en dur et omet le séparateur obligatoire | [P vérifié ici] `db.Contact.getAddress(String,String)@0-69`, `getAddress(6 String)@123-200` (`standardCountryCode`) |
| 17 | Statut dans « Editer des adresses » | `rech_orig` : liste ignorée | **Confirmé** : à OK, si la liste est active, l'original recopie le statut **actuel** de la 1ʳᵉ adresse (`setContactState(getContactState())`) | [P vérifié ici] `adr.ContactsDialog.jOkButtonActionPerformed@1202-1266` |
| 18 | Contenu de « Participation aux affaires » | `rech_exist` § 3.5 : activités ou rôle 12 ? | **Rôle d'équipe 12** (`TeamRole.staff`) : `PROJECTMEMBER` où `(CONTACT_ID = personne OU RESPCONTACT_ID = personne) ET TEAMROLECODE = 12` | [P vérifié ici] requête nommée de `db.ProjectMember` ; `db.ProjectMemberRole$TeamRole.<clinit>@229-242` (« staff », 12) ; `emp.ProjectMembershipDialog@21-24` |
| 19 | Inscription « déjà utilisée » | — | Compte des documents d'affaire dont `RESPONSIBLEMEMBER_ID` = l'inscription | [P vérifié ici] requête nommée de `db.ProjectDocument` (`d.responsibleMember = :projectMember`) ; `projectdocument` a bien `RESPONSIBLEMEMBER_ID` (base de test) |
| 20 | Libellé « Liste adresses de l’entité … » du panneau d'adresse | — | Ouvre en réalité la **Fiche de l'adresse** (`contactSheet`) ; **[C]** DeltaSub libelle « Fiche de l’adresse … » | [P] `adr.ContactAddressPanel$14` (`rech_orig` § 0.7) |
| 21 | Bloc-notes : ouvert ou fermé | `spec_1` § 3.1.2 | **Ouvert** à la création, **fermé** en modification | [P] `ContactDialog.<init>@2119-2122` (`rech_orig` § 5.2) |
| 22 | Règle du courriel | DeltaSub `^[^@\s]+@[^@\s]+\.[^@\s]+$` ; original | Original : `.+@.+\..+` (correspondance entière, Java `matches`). **[C]** alignement sur l'original (D-04-10) | [P] `ContactDialog.jOkButtonActionPerformed@23` ; `editContact` de DeltaSub |
| 23 | Lien map.search.ch | DeltaSub : « rue, NPA localité » | Original : `https://map.search.ch/` + enc(rue [+ « - » + NPA]) ; Google Maps : `https://maps.google.ch/maps?q=` + enc(rue[, NPA][, code pays]) | [P] `adr.MapLookupPopup` (`rech_orig` § 6.6) |
| 24 | Favoris des listes [Ancien document] | `rech_orig` D-04-7 : table `setting` par utilisateur | **Par poste** dans l'original (fichiers XML du dossier de préférences). **[C]** DeltaSub les garde **par poste** en `localStorage` (`ds_ch04d_fav`), comme les Préférences de CH-08 (`ds_ch08c_prefs`) | [P] `lst.Favorites.read…Favorites` ; `DeltaSub.html` (`CH08C_KEY='ds_ch08c_prefs'`) |
| 25 | Formats de champ manquants (`contactOwner*`, `staff*`, `contactFormOfAddress`, `contactContactOwnerUid`) | `rech_orig` § 6.1 : étendre `svFmtVal` | **Sans modifier `svFmtVal`** : `ch11aFlat(rep,F)` remplace tout champ `{f:'…\|N', s:S}` par `F['N~S']` quand la clé existe ; CH-04 calcule ces valeurs | [P] `DeltaSub.html` (`ch11aFlat`, `ch11aReport`) |
| 26 | Jeu de modèles des 4 documents | `rech_orig` : `svDpFind` ne lit pas le jeu 0 | `ch11aReport` passe par `ch01aTplPick(type,null)` → « Group.general » (jeu 0) ; `svDpFind` n'est pas utilisé | [P] `DeltaSub.html` (`ch01aTplList`, `ch11aReport`) |
| 27 | Colonne « Type » des listes `.dpdoc` d'adresses | `rech_orig` : icône | Icône « adresse » ou « adresse liée » (`Icons$TableIcon.contactAddress` / `contactLinkedAddress`), pas le type de l'entité. `svDpCell` ne sait pas dessiner d'icône : **[C]** cellule vide (écart E3) | [P vérifié ici] `doc.data.ContactListTableContent` (`@66-85`) |
| 28 | Colonnes d'id 25 en double (`contactOwnerSheet`) | `rech_orig` D-04-12 | Les deux sont masquées : sans effet ; lecture par id, la 1ʳᵉ gagne | [P] `dpdoc_ch04.txt` |
| 29 | Catalogue des CFC de « Liste d'adresses par CFC » | — | Catalogue standard de la langue du dialogue = `catalog` **101** (« CFC », `LANGUAGECODE` 2) ; textes dans `catalogpos` (lourde, `DS.need`) | [P] `ContactListTableModel@267` (`Catalog.getStandardCatalogForDialogLanguage`) ; [D] correspondance 101 : base de test (`catalog` 100-114) |
| 30 | `projectmember` sans entité | — | Un collaborateur sans employeur (`COMPANYCONTACT_ID` vide : 3051) reçoit, par « + », une inscription avec `CONTACT_ID` vide : **reproduit** | [P] `ProjectMemberDialog.newStaffProjectMembers@0-133` (`rech_orig` § 7.1) ; base de test |
| 31 | Numérotation des décisions | `rech_orig` : D-04-1 à D-04-12 ; `rech_exist` : Q1, Q2 | **D-04-0 à D-04-16** (§ 11) ; Q1 = D-04-0, Q2 = D-04-1 | — |

---

## 2. Périmètre

### 2.1 Reproduit (fidèle)

- **Fichier ▸ Importer des vCards …** : sélection d'un `.vcf`, version et encodage, analyse, assistant à deux volets, recherche des entités existantes, création par les dialogues standard, découpage des numéros.
- **Exporter vCards …** (roues des adresses, Liste des adresses et dérivées, Intervenants) et **Export vCard …** (détail d'une adresse) : collecte, texte, encodage des Préférences.
- **Fichier ▸ Importer des adresses …** : CSV (disposition fixe, séparateur détecté, première ligne ignorée), `.archfile` (création ou mise à jour), messages, troncature.
- **Editer des adresses …** et sa confirmation « Modifier adresses ».
- **Bloc-notes temporaire** et **menus de suggestions** de la fenêtre d'adresse ; règle du courriel de l'original.
- **Annuaire et cartes** : search.ch, local.ch (nom et numéro), copier, appeler, map.search.ch, Google Maps.
- **Documents** : Fiche de l'adresse, Liste adresses de l'entité, Liste des banques, Fiche-collaborateur, Liste des collaborateurs (depuis Collaborateurs).
- **Liste d'adresses par entité / par CFC** (fenêtre avec index).
- **Participation aux affaires** (Collaborateurs) et attribution des groupes d'activités.
- **Etiquettes … [Ancien document]** : choix du modèle, aperçu paginé, paramètres, impression, depuis Adresses (et ses dérivées), Collaborateurs, Intervenants ; fonction publique pour Soumissionnaires (EC-1) et Entrepreneurs (CH-05).
- **Assistant « Liste d'adresses » [Ancien document]** avec paramètres et favoris, pour les types d'Adresses et de Collaborateurs ; fonction publique pour les autres types.

### 2.2 Choix DeltaSub

- **Protection au ré-import** des collections d'adresses touchées dans DeltaSub (serveur, lot 1).
- **Un seul `DS.commit`** par action (import entier compris : une transaction, comme l'original) ; `bseq` lus à l'ouverture des dialogues de modification.
- **Fichiers** : sélection par `<input type="file">`, téléchargement par `ch10bDownload` (pas de dialogue « Enregistrer sous » : le navigateur nomme et range le fichier).
- **Impressions** : visionneuse commune (`ch11aView` → `ch03bView`), y compris les anciens modèles (fausse fenêtre `ch11aWin`).
- **Corrections d'écarts manifestes de l'original** : statut de « Editer des adresses » (D-04-5), espace de « 12 de 100 » (D-04-8), « (0) » des numéros de vCard (D-04-9), libellé du panneau d'adresse (D-04-6), indicatif « +41 » (§ 1 n° 7).
- **Libellés d'adresse justes** : `adrLines` suit le pays standard des Paramètres système (D3) et `ownerName` n'affiche que `NAME1` pour une entité qui n'est pas une personne (D4), comme `ContactOwner.getName`.

### 2.3 Hors périmètre ou non livré

Voir le § 10, « Non livré ».

### 2.4 Place et accès

| Élément | Accès dans DeltaSub |
|---|---|
| Importer des vCards …, Importer des adresses … | barre de menus ▸ Fichier (entrées de CH-10, aujourd'hui grisées « CH-04 ») |
| Exporter vCards … | Liste des adresses (et Mes favoris, Groupes, Propriétés, Chercher) ▸ Fonctions ▾ ; Entités ▸ adresses ▸ Fonctions ▾ ; affaire ▸ Intervenants / Liste d'adresses ▸ Fonctions ▾ |
| Export vCard …, Fiche de l’adresse … (une adresse) | détail d'une adresse (onglet Adresse) ▸ roue ▾ |
| Editer des adresses … | Liste des adresses et dérivées ▸ Fonctions ▾ ; Entités ▸ adresses ▸ Fonctions ▾ |
| Fiche de l’adresse …, Liste d’adresses par entité …, Liste d’adresses par CFC …, … [Ancien document] | Liste des adresses et dérivées ▸ Prévisualisation ▾ |
| Liste adresses de l’entité … | Entités ▸ adresses ▸ nouveau bouton « Rapports » ▾ |
| Liste des banques | Entités ▸ Modifier ▸ « Modifier les coordonnées bancaires » ▸ nouveau bouton « Rapports » ▾ |
| Participation aux affaires … | Collaborateurs ▸ Paramètres (clé) ▾ |
| Fiche-collaborateur …, Liste des collaborateurs …, … [Ancien document] | Collaborateurs ▸ nouveau bouton « Rapports » ▾ |
| Etiquettes … [Ancien document] | Prévisualisation ▾ des adresses, Rapports ▾ des collaborateurs, Documents ▾ des Intervenants / Liste d'adresses d'affaire |
| Annuaire, cartes, appel | détail d'une adresse (boutons à côté du nom, de l'adresse et des numéros) ; fenêtre d'adresse (menus ◂) |
| Bloc-notes temporaire | fenêtre d'adresse, bouton ↗ / ↙ en bas à gauche |

### 2.5 Frontières avec les autres chantiers

| Chantier | Ce que CH-04 lui offre ou attend | Mode |
|---|---|---|
| **CH-10** (barre de menus, intégré) | entrées Fichier ▸ Importer des vCards … / Importer des adresses … (droit `contactImport` 3,8), résolues par nom | CH-04 déclare `ch04ImportVCards` et `ch04ImportContacts` (noms imposés, `spec_19` § 9.3) |
| **CH-08** (droits, Préférences, intégré) | `ch08aCan(clé)` (`contactImport`, `contactExport`, `contactEdit`, `staffEdit`) ; `ch08cVcardCharset()` ; `ch08aCountry`, `ch08aDial`, `ch08aDocLangCode`, `ch08aName1First`, `ch08aCountryName` ; protection `CH08_PIT` du serveur | `typeof` ; extension de `CH08_PIT` / `CH08_CLE` (lot 1) |
| **CH-01** (socle `.dpdoc`), **CH-11** (`ch11aReport`, `ch11aView`, `ch11aWin`, `ch11aFlat`) | impression des documents du jeu 0 et des anciens modèles dans la visionneuse | appel direct (intégrés) |
| **CH-03** (visionneuse `ch03bView`, PDF, partage) | toutes les impressions de CH-04 | par `ch11aView` |
| **CH-09** (impressions au nouveau format) | « Liste d’adresses … » `contactList` et `projectMemberList` : CH-09 remplace l'élément existant `{t:'Liste d’adresses',fn:()=>printAdr(…)}` ; CH-04 le garde à sa place dans le menu (§ 4.1) | ancres disjointes (§ 9.2) |
| **CH-05** (Entrepreneurs) et **EC-1** (Soumissionnaires) | `ch04dLabels(contacts, o)`, `ch04dAdrList(type, contacts, o)`, `ch04aExportVCards(contacts, nom)` | `typeof` dans leurs menus |
| **CH-12** (Modèles d'étiquettes `.dpdoc`) | nouveau circuit « Etiquettes … » | non livré ici |
| **CH-13** (messages brefs) | lettres en série | — |

---

## 3. Modèle de données

### 3.1 Collections

| Collection | Lue / écrite | Par | Lot |
|---|---|---|---|
| `contactowner` | lue ; **écrite** : création (vCard par le dialogue Entité, CSV, `.archfile`), mise à jour (`.archfile`) | `TYPECODE`, `FORMOFADDRESS`, `NAME1`, `NAME2`, `UID`, `CREATED`, `UPDATED`, `ISHIDDEN` | 1 |
| `contact` | lue ; **écrite** : création (vCard, CSV, `.archfile`), mise à jour (`.archfile`, Editer des adresses) | § 4.2-4.5 | 1, 2 |
| `bankaccount` | lue (Liste des banques, assistant) | — | 3, 4 |
| `contact_property`, `contactgroup`, `contactgroup_contact`, `contactnote`, `contactquery` | non écrites par CH-04 ; **protégées au ré-import** | — | 1 (serveur) |
| `contactstate` | lue (statut) | — | 2 |
| `staff` | lue | — | 3, 4 |
| `projectmember` | **écrite** (Participation : création, suppression) | `TEAMROLECODE` 12, `PROJECT_ID`, `CONTACT_ID`, `RESPCONTACT_ID`, `SORTORDER`, `ISHIDDEN` 0 | 3 |
| `projectactivity_staff` | **écrite** (ajouts) ; ID = `<ACTIVITY_ID>-<STAFF_ID>`, val `{PROJECTACTIVITY_ID, STAFFS_ID}` (convention existante de `cfgActivities`) | — | 3 |
| `projectactivitygroup`, `projectactivity`, `project`, `projectdocument` | lues | — | 3 |
| `catalog`, `catalogpos` (lourde) | lues (textes des CFC, à l'affichage seulement) | `DS.need(['catalogpos'])` | 3, 4 |
| `doctemplate`, `modeledocument`, `image` | lues (`ch01aTplPick`) | — | 3 |
| `modele`, `modelegroupe`, `formtemplate`, `formtemplategroup` | lues (anciens modèles) | `tplNeed`, `DS.need(['formtemplate','formtemplategroup'])` | 4 |
| `setting` | lue (`isModuleFormVisible` par `ivFormVisible`, `displayNameFormat`, `genCountryPos`, police standard) | — | 1-4 |

Aucune collection nouvelle. Valeurs vides : **[C]** une chaîne vide est enregistrée `null` (convention de `editContact`), là où l'original écrit « » ; l'affichage est identique.

### 3.2 Valeurs par défaut d'une adresse créée par un import

Comme le constructeur `db.Contact` [P `rech_orig` § 2.4] : `ADDRESSTYPECODE` 0, `CREATED` = aujourd'hui (`today()`), `LANGUAGECODE` = `ch08aDocLangCode()`, `ISHIDDEN` 0. Pour une entité : `CREATED` = aujourd'hui, `ISHIDDEN` 0 [D].
- CSV : les indicatifs absents du fichier restent `null` (l'original écrase les défauts du constructeur) [P] ; `COUNTRYCODE` vide → `ch08aCountry()`.
- vCard : les champs sont ceux du dialogue « Nouvelle adresse » prérempli ; c'est ce dialogue qui enregistre.

### 3.3 Écritures groupées et concurrence

- Imports CSV et `.archfile` : **un seul `DS.commit`** de toutes les créations et mises à jour (transaction unique de l'original) ; identifiants réservés d'avance par `DS.newIds('contactowner', n)` et `DS.newIds('contact', m)` ; `bseq` = séquence connue pour une mise à jour `.archfile`, 0 pour une création. Le serveur n'a pas de limite de taille sur `/api/commit` [P] (`do_POST` lit `Content-Length`).
- Editer des adresses : `bseq` de chaque adresse lu **à l'ouverture** du dialogue (`ctBseq`) ; conflit 409 → message générique de `DS.commit`, rien n'est écrit.
- Participation : un commit par action (ajout de n affaires, suppression, attribution).

### 3.4 Serveur : protection au ré-import (lot 1)

Ajout, après la ligne `# ── fin CH-08 lot 1 ──` de `serveur_deltasub.py`, de deux lignes :

```python
CH08_PIT |= {"contactowner", "contact", "bankaccount", "contact_property", "contactnote", "contactgroup",
             "contactgroup_contact", "contactquery", "projectmember", "projectactivity_staff"}   # CH-04 lot 1 : adresses et participations touchées dans DeltaSub
CH08_CLE.update({"contactowner": "CREATED", "contact": "CONTACTOWNER_ID", "bankaccount": "CONTACTOWNER_ID",
                 "contactnote": "CONTACT_ID", "contactgroup": "NAME", "contactquery": "NAME", "projectmember": "PROJECT_ID"})   # CH-04 : collisions d'identifiant
```

Effets [P] (`import_deltaproject`, `_ch08_touched`, `_ch08_warn`) :
- un enregistrement de ces collections dont le dernier auteur n'est pas « import Deltaproject », **vivant ou supprimé**, est conservé tel quel ; les autres sont rafraîchis depuis Deltaproject ;
- si l'identifiant conservé désigne, dans Deltaproject, un autre enregistrement (clé de `CH08_CLE` différente), le ré-import imprime « ⚠ … NON repris : l'identifiant est déjà pris dans DeltaSub … ». Raison : `new_ids` rend max + 1, alors que Deltaproject alloue par blocs de 50 par session (contacts du bureau créés en 2026 : 12701, 12702, 12751, 12801, 12851) ; une adresse créée dans DeltaSub peut donc prendre un numéro que Deltaproject utilisera ensuite.
- Le message existant « Utilisateurs, droits et réglages modifiés dans DeltaSub, conservés tels quels : n enregistrement(s) » compte aussi ces enregistrements : libellé à généraliser par CH-08 (§ 8 n° 1).
- Les tables de liaison (`contact_property`, `contactgroup_contact`, `projectactivity_staff`) ont un identifiant composé de leur contenu : pas de collision possible.

**Ce lot de deux lignes peut être intégré seul, avant le ré-import demandé par Paulo** (D-04-0).

### 3.5 Mémorisation par poste (`localStorage`, lecture et écriture sous `try`)

| Clé | Contenu | Lot |
|---|---|---|
| `ds_ch04d_fav` | favoris de l'assistant « Liste d'adresses » [Ancien document], par type de liste (§ 4.12) | 4 |
| `ds_ch04c_bounds` | taille de la fenêtre « Liste d’adresses par entité » (`ContactListDialogBounds`) | 3 |

Les paramètres des étiquettes **ne sont pas mémorisés** [P] (`new Settings()` à chaque ouverture). L'état du bloc-notes ne l'est pas non plus.

---

## 4. Écrans et dialogues

### 4.1 Points d'entrée et menus (lot 1 : crochets ; lots 2-4 : fonctions)

Le lot 1 pose **tous les crochets des menus partagés** et fournit un modèle pur `ch04aMenu(où, ctx, base)` qui rend la liste d'éléments `{t, fn, dis, chk}` / `'-'` de `popMenu`. Chaque élément d'un autre lot n'apparaît que si sa fonction existe (`typeof`). Notations : `sel` = sélection (au moins une ligne choisie), `n` = nombre de lignes de la table, `S` = suffixe « pour la sélection » ajouté si la sélection n'est pas vide (« Liste d’adresses pour la sélection … ») [P `Rsrc.mapStringWithEllipsisAndCheckSelection`], `[A]` = suffixe « [Ancien document] » [S `Strings|legacyMenu`], présent seulement si `ivFormVisible()` (`isModuleFormVisible`, `[YES]` au bureau).

**a) Liste des adresses, Mes favoris, Groupes, Propriétés, Chercher ▸ Prévisualisation ▾** (`où = 'adrRapports'`, `base` = éléments actuels de DeltaSub) [P `AddressListFrame.getReportsPopupMenu@0-583`]

| Ordre | Libellé | Actif si | Action (lot) |
|---|---|---|---|
| 1 | « Fiche de l’adresse … » | exactement 1 ligne sélectionnée | `ch04cContactSheet(c)` (3) |
| 2 | éléments de `base` sauf « Liste d’adresses par CFC » (aujourd'hui : « Liste d’adresses », imprimé par `printAdr` ; demain l'élément de CH-09) | tels quels | tels quels |
| ― | | | |
| 3 | « Liste d’adresses par entité … » | n > 0 | `ch04cByOwner(lignes)` (3) |
| 4 | « Liste d’adresses par CFC … » | n > 0 | `ch04cByCfc(lignes)` (3) ; sans le lot 3 : l'élément de `base` |
| ― | *(si `ivFormVisible()`)* | | |
| 5 | « Liste d’adresses … [Ancien document] » (avec S) | n > 0 | `ch04dAdrList(0, lignes)` (4) |
| 6 | « Liste des entités … [Ancien document] » (avec S) | n > 0 | `ch04dAdrList(12, lignes)` (4) |
| 7 | « Etiquettes … [Ancien document] » (avec S) | n > 0 | `ch04dLabels(lignes)` (4) |

`lignes` = la sélection si elle n'est pas vide, sinon toutes les lignes affichées (`st.g.view`) [P `adr.ContactList.getAllOrSelectedContactList`]. Les séparateurs en tête, en fin ou doublés sont retirés. « Etiquettes … » (nouveau circuit) n'est pas proposé (CH-12, D-04-11).

**b) Liste des adresses et dérivées ▸ Fonctions ▾** [P `AddressListFrame.getWheelPopupMenu@0-443`] : deux insertions dans le menu existant.
- avant `'-',{t:'Courriel …'…}` : `'-'`, « Editer des adresses … » — présent si `ch08aCan('contactEdit')` (droit 3,2 ; vrai sans CH-08), **actif si plus d'une ligne est sélectionnée**, sur la sélection → `ch04bBulk(sel())` (2) ;
- après « Exporter le tableau dans un fichier CSV … » : « Exporter vCards … » — présent si `ch08aCan('contactExport')`, actif si n > 0, sur la sélection, sinon toutes les lignes → `ch04aExportVCards(lignes)` (1).

**c) Entités ▸ adresses ▸ Fonctions ▾** [P `ContactListFrame.getContactWheelPopupMenu@31-126`] : après « Copier l’adresse dans le presse-papier » :
- `'-'`, « Editer des adresses … » — droit `contactEdit`, **actif si la table a plus d'une ligne**, sur **toutes** les adresses de l'entité affichées (propres et liées) → `ch04bBulk` (2) ;
- `'-'`, « Copier le contenu du tableau dans le presse-papier », « Exporter le tableau dans un fichier CSV … » (`copyTable(AE.ga)`, `csvTable(AE.ga,'Adresses')`, existants) ;
- « Exporter vCards … » — droit `contactExport`, actif si la table a des lignes, sélection sinon toutes → `ch04aExportVCards` (1).

**d) Entités ▸ adresses ▸ « Rapports » ▾** (nouveau bouton, lot 3, ancre propre) [P `ContactListFrame.getContactReportsPopupMenu@0-73`] : « Liste adresses de l’entité … », actif si une entité est sélectionnée → `ch04cOwnerSheet(entité, AE.hid)`.

**e) Collaborateurs ▸ Paramètres (clé) ▾** (lot 3, ancre propre) [P `EmployeeFrame.addEditPopupMenuItems@0-538`] : après « Verrouillage des heures », `'-'`, « Participation aux affaires … » — présent si `ch08aCan('staffEdit')`, actif si **exactement un** collaborateur est sélectionné → `ch04cMembership(staff)`.

**f) Collaborateurs ▸ « Rapports » ▾** (nouveau bouton avant la roue, crochet du lot 1) [P `EmployeeFrame.getReportsPopupMenu@0-427`]

| Ordre | Libellé | Actif si | Action (lot) |
|---|---|---|---|
| 1 | « Fiche-collaborateur … » | exactement 1 sélectionné | `ch04cStaffSheet(s)` (3) |
| 2 | « Liste des collaborateurs … » (avec S) | n > 0 | `ch04cStaffList(lignes)` (3) |
| ― | *(si `ivFormVisible()`)* | | |
| 3 | « Adresses privée … [Ancien document] » (avec S ; orthographe de l'original) | n > 0 | `ch04dAdrList(4, lignes)` (4) |
| 4 | « Adresses des entités … [Ancien document] » (avec S) | n > 0 | `ch04dAdrList(13, lignes)` (4) |
| 5 | « Etiquettes … [Ancien document] » (avec S) | n > 0 | `ch04dLabels(personnes)` (4) |

`lignes` = collaborateurs sélectionnés, sinon tous ceux de la vue ; `personnes` = leurs adresses `PERSON_ID`. Le bouton n'est affiché que s'il a au moins un élément. **Aucun export vCard** pour les collaborateurs [P] (`ExportVCard.addTableRow` ignore `StaffTableModel`).

**g) Affaire ▸ Intervenants / Liste d'adresses ▸ Fonctions ▾** (crochet du lot 1) : après « Courriel », « Exporter vCards … » — droit `contactExport` ; collecte : adresse de l'entité **et** adresse du responsable de chaque intervenant listé, doublons retirés [P `vc.ExportVCard.addTableRow@120-301`].

**h) Affaire ▸ Intervenants / Liste d'adresses ▸ Documents ▾** (lot 4, ancre propre) : à la fin, si `ivFormVisible()`, `'-'`, « Etiquettes … [Ancien document] » → `ch04dLabels(entités)` (adresse de l'entité `CONTACT_ID`, pas le responsable [P `adr.ContactList.getContact@22-158`]).

**i) Détail d'une adresse, onglet Adresse** (lot 2, ancre propre) [P `adr.ContactAddressPanel.getWheelPopupMenu@0-315`] : roue ▾ en tête du bloc : « Copier dans le presse-papier » (`svAddress(c,'\n')` complet avec téléphones, [D] contenu exact à vérifier dans `ContactAddressPanel$…`), « Copier l’adresse dans le presse-papier » (`adrLines`), —, « Export vCard … » (droit `contactExport`, `ch04aExportVCards([c])`), —, « Fiche de l’adresse … » (`ch04cContactSheet`, libellé corrigé D-04-6), —, « Ajouter aux favoris » (existant `addToGroup(favGroup(true),[c])`). Boutons d'annuaire et de carte : § 4.7.

### 4.2 Fichier ▸ Importer des vCards … (`ch04ImportVCards`, lot 1)

**Choix du fichier** [P `vc.ImportVCardDialog.selectVCardFile`] : `<input type="file" accept=".vcf">` ; titre affiché « Sélectionner le fichier vCard » ; seul un nom se terminant par `.vcf` (casse ignorée) est accepté, sinon rien ne se passe.

**Version et encodage** [P `vc.VCard.getVCardVersion`] : la première ligne contenant `VERSION:2.1`, `VERSION:3.0` ou `VERSION:4.0` fixe la version ; 2.1 → lecture en ISO-8859-1, sinon UTF-8. Deux boutons radio « UTF-8 » / « ISO-8859-1 » du dialogue relisent le fichier. **[C]** décodage ISO par `TextDecoder('iso-8859-1')` (le navigateur applique windows-1252 : seuls les octets 0x80-0x9F diffèrent, sans effet sur des adresses).

**Analyse** (`ch04aVcParse(texte)`, pure) [P `vc.VCard.parse@0-316`, `setValues@0-748`] — reproduite telle quelle, défauts compris :
- chaque ligne perd ses caractères de code < 28 (tabulations comprises) ;
- blocs entre `BEGIN:VCARD` et `END:VCARD` (casse ignorée) ;
- une ligne dont le **premier caractère est « ignorable »** (`Character.isIdentifierIgnorable` : U+0000-0008, 000E-001B, 007F-009F, et format Cf) est rattachée à la précédente ; les lignes de continuation qui commencent par une espace **ne sont pas** recollées ;
- découpe `split(':',2)` puis `split(';',2)` → nom | paramètres (mis en MAJUSCULES) | valeur (telle quelle) ; aucun décodage (quoted-printable, `\,`, `\;`, `\n`) ;
- `N` → nom, prénom, autres, préfixe, suffixe (`split(';')`) ; `ORG`, `FN`, `NICKNAME`, `VERSION` → première occurrence, « ; » final retiré (« Société;Service » reste tel quel) ;
- noms finissant par `ADR` : première occurrence = défaut ; paramètres contenant `PREF` → préférée, `HOME` → privée, `POSTAL` → postale, `WORK` → professionnelle (la dernière l'emporte) ; valeur `split(';')` → 0 case postale, 1 complément, **2 rue**, 3 localité, 4 région, 5 NPA, 6 pays ;
- `EMAIL`, `URL` : défaut, `PREF`, `HOME`, `WORK` ;
- `TEL` : `FAX` dans les paramètres → fax, sinon téléphone ; `PREF` → préféré, `WORK` → professionnel, `CELL` → mobile, `HOME` → privé (un `TEL;CELL;WORK` remplit le mobile **et** le téléphone professionnel).

**Fenêtre « Importer les vCards »** (modale) [P `<init>@0-616`, `checkGuards@0-136`, `showVCard@0-939`]

| Volet | Champs (libellés `ImportVCardDialog`) | Source |
|---|---|---|
| gauche, personne | Nom, Prénom, Rue et n°, Localité (NPA, localité, code pays), Téléphone, Mobile, Fax, Courriel, Site internet | `N[0]`, `N[1]`, adresse HOME, tél. HOME, CELL, fax HOME, courriel HOME, URL HOME |
| droite, société | Société, Complément société (vide), Rue et n°, Localité, Téléphone, Fax, Courriel, Site internet | `ORG`, adresse WORK, tél. WORK, fax WORK, courriel WORK, URL WORK |

- Champs **éditables** (l'utilisateur corrige avant de créer).
- **Pays** : nom du pays de la vCard comparé sans casse aux noms de pays (`ch08aCountryName`) ; à défaut, `ch08aCountry()`. Le champ reçoit le code ISO 2 lettres. Indicatif de chaque numéro : `ch08aDial(pays)`, puis remplacé par celui du découpage (§ 4.2.1) s'il en donne un ([C] préfixé de « + »).
- **Sous chaque volet**, un tableau des entités existantes de même nom (colonnes Type 35 px, Nom, Complément/Prénom) : égalité stricte sans casse de `NAME1` (et de `NAME2` s'il est donné) avec les valeurs `trim()` ; personne : (Nom, Prénom) ; société : (Société, —) [P `db.ContactOwner.getDuplicateList`]. Recalculé quand le nom change [D].
- Étiquette d'information : « vCard i/n », ou « Le format vCard du fichier ^0 n'est pas correct. » si aucune vCard n'est lue (^0 = nom du fichier).

| Bouton | Actif si | Action |
|---|---|---|
| « Prochaine vCard » | index < n − 1 | vCard suivante |
| « + » (personne) ▾ « Nouvelle société … », « Nouvelle personne … », « Nouvelle famille … », « Nouvelle communauté … », « Nouvelle association … » | Nom **ou** Prénom non vide | `editOwner({ID:null,TYPECODE:t,NAME1:Nom,NAME2:Prénom,FORMOFADDRESS:…défaut de editOwner,ISHIDDEN:0,CREATED:today()},t,après)` : dialogue Entité prérempli avec son contrôle « Attention aux doublons … » ; après : tableau rafraîchi, nouvelle entité sélectionnée |
| « + » (société) ▾ idem | Société non vide | idem avec NAME1 = Société, NAME2 = Complément société |
| « Importer » ▾ (sous la personne) : « Nouvelle adresse … », « Lier une entité … » | une entité sélectionnée dans le tableau de gauche ; « Lier une entité … » exige aussi une entité sélectionnée à droite | § ci-dessous |
| « Importer » ▾ (sous la société) : « Nouvelle adresse … » | une entité sélectionnée à droite | § ci-dessous |
| « Fermer » | toujours (Échap) | ferme ; rafraîchit Entités et Liste des adresses (`DS` les rafraîchit déjà) |

**Création des adresses** [P `newContact@0-479`] : `editContact({ID:null,…prérempli},owner,rel,après)` ouvre le **dialogue standard « Nouvelle adresse »** ; c'est lui qui enregistre.

| Menu | owner | rel | Champs | NAME1 / NAME2 |
|---|---|---|---|---|
| personne ▸ Nouvelle adresse | entité de gauche | — | volet personne : rue, pays, NPA, localité, tél. 1, **mobile**, fax, courriel, site | NAME1 = `getName` de l'entité ; NAME2 vide |
| personne ▸ Lier une entité | entité de gauche | entité de droite | volet **société** : rue, pays, NPA, localité, tél. 1, fax, courriel, site (**sans mobile**) | NAME1 = `getName` de la **personne**, NAME2 = `getName` de la **société** (inverse de `initName123`, reproduit : D-04-2) |
| société ▸ Nouvelle adresse | entité de droite | — | volet société | NAME1 = `getName` de la société (= NAME1 seul) |

Commun : `SHORTLABEL` = NAME1, textes `trim()`, défauts du § 3.2. `getName` = `ch10bOwnerName` (personne : selon `displayNameFormat` ; autres types : NAME1 seul) [P `db.ContactOwner.getName@0-106`].

#### 4.2.1 Découpage des numéros (`ch04aPhone(valeur, pays)`, pure) [P `vc.Phone.getPhoneNumer@0-386`]

Si `pays` n'est ni `CH` ni `CHE` : numéro = valeur brute, indicatif et préfixe vides. Sinon, `ch` = chiffres de la valeur :

| Cas | Indicatif | Préfixe | Numéro |
|---|---|---|---|
| commence par « + » et plus de 5 chiffres | 2 premiers chiffres | reste de 11 chiffres → 3 premiers ; sinon 2 premiers, préfixés de « 0 » s'ils font 2 caractères | reste ; 7 chiffres → « xxx xx xx » |
| commence par « + », 5 chiffres au plus | — | — | valeur brute |
| 10 chiffres | vide | 3 premiers | « xxx xx xx » |
| 13 chiffres (0041…) | indicatif par défaut | « 0 » + chiffres 5-6 | « xxx xx xx » |
| 9 chiffres | indicatif par défaut | 2 premiers (sans « 0 ») | « xxx xx xx » |
| autre | — | — | valeur brute |

**[C] D-04-9** : « (0) » est retiré de la valeur **avant** le découpage (l'original donne « 004 » / « 41234567 » pour « +41 (0)44 123 45 67 »). **[C]** un indicatif de chiffres seuls est enregistré « +41 ».

### 4.3 Export vCard (`ch04aExportVCards(contacts, nom)`, lot 1) [P `vc.ExportVCard`]

- Collecte selon le point d'entrée (§ 4.1 b, c, g, i), doublons retirés (par ID) ; adresses masquées exclues quand l'export part d'une entité [P].
- **Fichier** : nom = `ch10bOwnerName(entité)` pour une seule adresse, sinon « DELTAproject vCards » ; extension `.vcf` ; téléchargement `ch10bDownload(nom+'.vcf', octets, 'text/vcard')`.
- **Encodage** : `ch08cVcardCharset()` (UTF-8 par défaut, ISO-8859-1 possible) ; en ISO-8859-1, un caractère > U+00FF devient « ? » (comportement de Java) [D].
- **Texte d'une vCard** (lignes internes terminées par « \n », chaque vCard suivie de « \r\n ») :

```
BEGIN:VCARD
VERSION:3.0
N:<entité.NAME1>[;<entité.NAME2>]          (NAME1 vide : "N:"+NAME2), trim()
[ORG:<relation.NAME1>]                      (si l'adresse a une entité liée)
item1.ADR;type=<T>;type=pref:;<STREET>;<POBOX>;<LOCATION>;;<POSTALCODE>;
[EMAIL;type=INTERNET;type=<T>:<EMAIL1>]
[TEL;TYPE=<T>:<tél. 1>]
[TEL;TYPE=CELL:<mobile>]
[TEL;<T>;TYPE=FAX:<fax>]
END:VCARD
```

- `T` = `WORK` si l'adresse a une entité liée, sinon `HOME` ; téléphone = `phoneToExportString` : indicatif + « ␣ » + préfixe sans le « 0 » national (« (0) » retiré) + « ␣ » + numéro (« +41 44 123 45 67 »).
- **Reproduit tel quel (D-04-3)** : `STREET` dans le complément (index 1) et `POBOX` dans la rue (index 2), pas de pays, pas de `FN`, pas d'échappement.

### 4.4 Fichier ▸ Importer des adresses … (`ch04ImportContacts`, lot 1)

`<input type="file" accept=".csv,.archfile">` ; nom en `.CSV` → dialogue CSV ; `.ARCHFILE` → dialogue `.archfile` (casse ignorée) ; autre → rien [P `DataImport.importContacts`].

**Dialogue « Importer les adresses »** (commun) [P `adr.ImportCSVDialog`, `adr.ImportAFDialog`]
- Fermeture par la croix désactivée ; « Fermer » sur Échap ; boutons « Début » (par défaut) et « Fermer ».
- CSV seulement : « Séparateurs » ▾ (Virgule, Point-virgule, Deux-points, Touche tabulation, Espace), valeur proposée par `ch04aSepGuess` ; case « Ignorer la première ligne à l'importation », **cochée**.
- Étiquette d'état : « Préparer l'import » au départ.
- **Début** : lecture ; confirmation (titre « Importer les adresses », boutons « Importer » / « Annuler ») : CSV « Voulez-vous importer ^0 enregistrements? », `.archfile` « Voulez-vous mettre à jour ^0 contacts? » (^0 = lignes de données) ; Annuler → « Import abandonné. ».
- Pendant la préparation : « Préparer l'importation de l'adresse ^0. », barre de progression (toutes les 10 lignes), « i de n contacts importés » (**[C] D-04-8** : espace rétablie après « de ») ; puis « Terminer … », `DS.commit` unique, enfin « n contacts importés » (CSV) ou « n Importer les contacts » (`.archfile`, libellé de l'original) ; « Fermer » désactivé pendant l'import, « Début » masqué après.
- Échec du commit (409, réseau) : message d'erreur, **rien n'est écrit** (transaction unique).

**Lecture du CSV** (`ch04aCsvRead(texte, sep)`, pure) : lecteur `util.csv.CSVReader` — guillemet « " », **échappement « \ »** [P `rech_orig` § 3.1] ; fichier décodé en **UTF-8 imposé** ([C] BOM éventuel retiré) ; lignes vides ignorées [D].

**Séparateur proposé** (`ch04aSepGuess`, pure) [P `util.csv.Separators.checkSeparator`] : sur les 5 premières lignes, on compte « , », « ; », « : » et la tabulation (pas l'espace) ; le plus fréquent l'emporte ; égalité → premier dans l'ordre tab, « , », « : », « ; » ; aucun → Virgule.

**Disposition fixe du CSV** (index 0-32 ; max = longueur avant troncature `max − 1`) [P `ImportCSVDialog$ImportThread.run@0-1305`, vérifié ici pour 0-13]

| Col | Max | Destination |
|---|---|---|
| 0 | 64 | `CONTACT.EXTERNALREFERENCE` = « Import_ » + valeur |
| 1 | 64 | société : `NAME1` (TYPECODE 0) ; société créée si non vide |
| 2 | 64 | société : `NAME2` |
| 3 | 64 | complément de clé de la société (non enregistré) |
| 4 | 64 | personne : `FORMOFADDRESS` (TYPECODE 1) |
| 5 | 64 | personne : `NAME1` ; personne créée si col5 ou col6 non vide |
| 6 | 64 | personne : `NAME2` |
| 7 | 64 | complément de clé de la personne |
| 8 | 1 | `ADDRESSTYPECODE` (0-4), ignoré s'il est invalide |
| 9, 10, 11 | 64 | `NAME1`, `NAME2`, `NAME3` ; col9 vide → col10/col11 remontent ; col10 vide → col11 passe en NAME2 ; NAME1 encore vide → `initName123` |
| 12 | 64 | `STREET` |
| 13 | 64 | `POBOX` |
| 14 | 16 | `POSTALCODE` |
| 15 | 64 | `LOCATION` |
| 16 | 2 | `COUNTRYCODE` : vide → `ch08aCountry()` ; sinon code connu (majuscules) ou « » |
| 17-19 | 10, 10, 32 | `PHONECOUNTRY1`, `PHONEAREA1`, `PHONENUMBER1` |
| 20-22 | 10, 10, 32 | `PHONECOUNTRY2`, `PHONEAREA2`, `PHONENUMBER2` |
| 23-25 | 10, 10, 32 | `FAXCOUNTRY1`, `FAXAREA1`, `FAXNUMBER1` |
| 26 | 64 | `EMAIL1` |
| 27 | 64 | `SKYPE` |
| 28 | 64 | `INTERNET` |
| 29 | 64 | `SHORTLABEL` |
| 30 | 256 | `BKP` : caractères hors `[0-9.,]` retirés, puis coupé à 63 |
| 31 | 64 | `SALUTATION1` |
| 32 | 1024 | `REMARK` |

- **Rattachement** : personne présente → adresse de la personne, `CONTACTRELATION_ID` = la société si elle existe ; société seule → adresse de la société ; ni l'une ni l'autre → ligne ignorée.
- **Doublons** : regroupement **dans le fichier seulement** (clés ci-dessus), aucun contrôle avec la base [P].
- **`initName123`** [P vérifié ici, `db.Contact.initName123@0-98`] : entité liée → NAME1 = `getName(liée)`, NAME2 = `getName(entité)` ; sinon, `FORMOFADDRESS` non vide → NAME1 = `FORMOFADDRESS`, NAME2 = `getName(entité)` ; sinon NAME1 = `getName(entité)`. NAME3 n'est pas touché.

**`.archfile`** (export DELTAbauad, 36 colonnes, tabulation, première ligne toujours ignorée, encodage par défaut : [C] UTF-8) [P `ImportAFDialog$ImportThread.run@0-1171`] : clé « AF_ » + col0 ; adresse existante de même `EXTERNALREFERENCE` → **mise à jour** de l'adresse et de son entité ; sinon création ; col1 = « P » (casse ignorée) → personne. Correspondance des colonnes : `rech_orig` § 3.4 (communs 8-12, 20, 21, 23, 24 ; société 5, 6, 7, 13-19, 25 ; personne 2-4, 26-35 ; recopie de l'adresse de la société si rue et localité sont vides ; `initName123`). Pays vide → « CH » (non contrôlé). Aucune trace d'usage au bureau (0 référence « AF_ ») : livré pour la fidélité, à faible coût (D-04-4).

### 4.5 Editer des adresses … (`ch04bBulk(contacts)`, lot 2) [P `adr.ContactsDialog`, `ContactsConfirmationDialog`]

**Fenêtre « Editer l’adresse »** : mêmes libellés et même disposition que `editContact`, réduits aux champs modifiables en masse : Adresse (3 lignes), Rue, Rue 2, NPA/Localité, Pays, Téléphone, Tél. mobile, Fax, Courriel, Skype, Site internet, Abréviation, CFC, Civilité courrier, Langue, Statut. Boutons OK, Annuler.

**Remplissage** : référence = **1ʳᵉ adresse** de la liste. Pour chaque autre adresse, un champ dont la valeur diffère (`null` ≠ « ») devient **inactif, non éditable, avec le texte « - »** et son libellé est grisé ; Langue et Statut deviennent inactifs s'ils diffèrent. Groupes solidaires : NPA, Localité et Pays (l'un inactif → tous) [D pour Pays] ; indicatif, préfixe et numéro de chaque téléphone.

**OK** :
- actif si « Adresse » ligne 1 **ou** ligne 2 n'est pas vide (« - » compte comme non vide) ;
- courriel éditable non vide et ne vérifiant pas `^.+@.+\..+$` → « Cette adresse courriel est incomplète ou incorrecte. » et focus sur le champ ;
- chaque champ **actif** (modifié ou non) est relu (`trim()`) et ajouté à la liste (Champs, Valeur) : « Adresse 1 », « Adresse 2 », « Adresse 3 », « Rue », « Rue 2 », « NPA/Localité » = « NPA Localité, Pays », téléphones = `phone()` du triplet, « Courriel », « Skype », « Site internet », « Abréviation », « CFC », « Civilité courrier », « Langue » (nom), « Statut » (nom, « - » si vide).

**Confirmation « Modifier adresses »** (si la liste n'est pas vide) : « Souhaitez-vous modifier ces champs pour ^0 adresses? » (^0 = nombre d'adresses), tableau **Champs | Valeur**, boutons OK, Annuler.

**Écriture** : un `DS.commit` ; pour chaque adresse : champs actifs recopiés, `UPDATED` = aujourd'hui ; `bseq` lus à l'ouverture. **[C] D-04-5** : le statut **choisi** dans la liste est écrit (l'original recopie le statut de la 1ʳᵉ adresse).

### 4.6 Fenêtre d'adresse : bloc-notes, menus de suggestions, courriel (lot 2)

**Bloc-notes temporaire** [P `ContactDialog.setClipboardVisible@0-82`, `<init>@2119-2122`] : panneau latéral à droite de la fenêtre, titre « Bloc-notes temporaire », zone de texte libre ; bouton ↗ / ↙ en bas à gauche qui l'ouvre ou le ferme (la fenêtre s'élargit ou se réduit) ; **ouvert à la création** (`isNew`), **fermé en modification** ; rien n'est enregistré.

**Menus de suggestions ◂** (bouton à droite du champ, `popMenu`) [P `rech_orig` § 5.2-5.3] :

| Champ | Éléments, dans l'ordre |
|---|---|
| Adresse 1-3 | lignes de l'entité (`FORMOFADDRESS`, nom, « en-tête nom », complément) ; ― lignes de l'entité liée ; ― bloc-notes ; ― si le champ n'est pas vide : « search.ch », « local.ch » (nom, § 4.7) |
| Rue (bouton carte, infobulle « Affiche la carte des environs ») | adresses sur une ligne (« , ») des autres adresses de l'entité liée, de l'entité et de ses relations, sans doublon ; un clic recopie rue, rue 2, NPA, localité, pays ; ― « map.search.ch », « Google Maps » |
| Téléphone, Tél. mobile, Fax | numéros des autres adresses (mêmes sources) ; ― bloc-notes ; ― « search.ch », « local.ch » ; ― « Copier dans le presse-papiers » ; ― « Appeler » (actifs si le numéro n'est pas vide) |
| Courriel | courriels des autres adresses (actifs s'ils sont valides) ; ― bloc-notes ; ― « Envoyer un e-mail » (`mailto:`, actif si valide) |
| Site internet | vide et courriel présent : « www. » + domaine du courriel ; sinon le bouton ouvre le site |
| Abréviation | « entité, localité », « entité », « entité liée, localité », « entité liée » [D ordre exact] |
| Civilité courrier | les 10 formules (datalist existante, conservée) |

**Élément « bloc-notes »** : présent si le panneau est ouvert **et** qu'une sélection y existe :
- champs texte : 1ʳᵉ ligne de la sélection, `trim()` ;
- NPA/Localité : 1er mot fait de chiffres → NPA = ce mot, localité = le reste ; sinon localité = tout ;
- téléphones : chiffres de la sélection ; plus de 6 → numéro = 7 derniers (« xxx xx xx »), préfixe = ce qui précède, avec l'indicatif du pays de l'adresse retiré une fois, ramené aux 3 derniers chiffres ; indicatif = celui du pays ; 6 ou moins → numéro = les chiffres. L'élément affiche « indicatif préfixe numéro » et remplit les 3 champs.

**Courriel à OK** (D-04-10) : `^.+@.+\..+$` remplace `^[^@\s]+@[^@\s]+\.[^@\s]+$` ; message inchangé.

### 4.7 Annuaire et cartes (`ch04bDir`, `ch04bMap`, lot 2) [P `adr.PhoneDirectoryPopup`, `adr.MapLookupPopup`]

| Élément | URL (fr) |
|---|---|
| « search.ch » (nom) | `https://tel.search.ch/index.fr.html?was=` + enc(nom) [+ `&wo=` + enc(NPA)] |
| « local.ch » (nom) | `https://tel.local.ch/fr/q/` [+ enc(NPA) + `/`] + enc(nom) + `.html` |
| « search.ch » (numéro) | `https://tel.search.ch/index.fr.html?tel=` + enc(indicatif+préfixe+numéro, espaces retirés) |
| « local.ch » (numéro) | `https://tel.local.ch/fr/q/?what=` + enc(indicatif+préfixe+numéro) |
| « Copier dans le presse-papiers » | `ctCopy(phone(c,n))` |
| « Appeler » | `tel:` + numéro sans espaces ni « (0) » |
| « map.search.ch » | `https://map.search.ch/` + enc(rue [+ « - » + NPA]) |
| « Google Maps » | `https://maps.google.ch/maps?q=` + enc(rue[, NPA][, code pays]) ; code « au » (casse ignorée) → « Austria » |

- `enc` = `encodeURIComponent` puis `%20` → `+` (comme `URLEncoder.encode(…,"UTF-8")`) ; ouverture dans un nouvel onglet (`open(url,'_blank','noopener')`).
- Nom (panneau de détail) = « NAME1 NAME2 » de l'adresse ; (fenêtre d'adresse) = texte du champ.
- **Détail d'une adresse** : le lien ⌕ actuel (map.search.ch « rue, NPA localité ») devient un bouton ▾ (map.search.ch, Google Maps) ; un bouton ▾ d'annuaire à côté de Téléphone, Tél. mobile et Fax (actifs si le numéro existe), et à côté de « Entité » (search.ch, local.ch par nom).

### 4.8 Liste d’adresses par entité / par CFC (`ch04cByOwner`, `ch04cByCfc`, lot 3) [P `adr.ContactListDialog`, `adr.ContactListTableModel@0-1135`]

**Fenêtre** modale, titre **toujours** « Liste d’adresses par entité » (même par CFC) ; 800 × 600 au départ, taille mémorisée (`ds_ch04c_bounds`).
- **Index à gauche** : une colonne « Entité » ou « CFC » ; un clic fait défiler la liste jusqu'au groupe.
- **Liste à droite**, 9 colonnes : Entité, Adresse liée, Appartient à, Localité, Téléphone, Téléphone mobile, Courriel, CFC, Fonction.
- Roue ▾ : « Copier le contenu du tableau dans le presse-papier », « Exporter le tableau dans un fichier CSV … ». Pas de bouton Rapports (action vide dans l'original). Bouton « Fermer ».

**Par entité** : adresses triées alphabétiquement (`ch10bCmpIC` sur [liée NAME1, NAME2, entité NAME1, NAME2]) ; groupe = entité **liée** si elle existe, sinon entité propre (ordre de première apparition) ; pour chaque groupe : ligne vide (sauf le premier), ligne de groupe (nom en colonne 0, **gras + surligné**, entrée d'index), adresses sans entité liée puis adresses liées (triées). Colonnes : (1) `getContactOwnerDesc`, (2) entité liée, (3) `LOCATION`, (4) tél., (5) mobile, (6) courriel, (7) `BKP`, (8) `COMPANYROLE`.

**Par CFC** : `BKP` de chaque adresse découpé (séparateurs « , » et « / » [D `CatalogPos.splitBkps`]), chaque code coupé avant le premier « . » et rogné ; clé « code texte » d'après le catalogue 101 (`catalogpos`, lu à l'affichage), « code » seul si absent, « Sans CFC » sans CFC ; groupes triés par clé (ordre des chaînes) ; pour chaque groupe : ligne vide, ligne de groupe (gras + surligné, index), puis pour chaque entité une ligne d'entité (surlignage de niveau 2) suivie de ses adresses.

### 4.9 Coordonnées bancaires ▸ Rapports (lot 3) [P `adr.BankAccountsDialog.getReportsPopupMenu`]

Nouveau bouton « Rapports » ▾ dans la fenêtre « Coordonnées bancaires », **actif si l'entité a au moins un compte** : « Afficher le rapport … » → `ch04cBankList(entité)` (§ 5.3). L'ancien document (`BankPreviewDialog`) n'est pas livré (§ 10).

### 4.10 Participation aux affaires (`ch04cMembership(staff)`, lot 3) [P `emp.ProjectMembershipDialog`]

**Fenêtre « Attribuer un collaborateur »** (modale).
- Ligne « Collaborateur » : `getContactDesc` de la personne (`svContactDesc`), non éditable, bouton « < » (détails : carte de visite existante `ivCard` [D]).
- Liste « Participation aux affaires », colonnes **Numéro | Affaire** : inscriptions `projectmember` où `(CONTACT_ID = PERSON_ID ou RESPCONTACT_ID = PERSON_ID)` et `TEAMROLECODE = 12`, triées par numéro [D].

| Bouton | Actif si | Action |
|---|---|---|
| « + » | toujours | « Choix de l’affaire » **à sélection multiple** (modèle de `ch17aPrjPick`, Cmd / Maj-clic) : toutes les affaires sauf celles déjà listées, statut « Configuration » estompé ; pour chaque affaire choisie : `projectmember` {`TEAMROLECODE` 12, `PROJECT_ID`, `CONTACT_ID` = `COMPANYCONTACT_ID`, `RESPCONTACT_ID` = `PERSON_ID`, `SORTORDER` = rang en fin de liste de l'affaire, `ISHIDDEN` 0} ; un commit |
| « - » | une ligne sélectionnée | 1. inscription utilisée (un `projectdocument` a `RESPONSIBLEMEMBER_ID` = son ID) → « Cette inscription est déjà utilisée et⏎ne peut pas être supprimée. » ; 2. sinon statut de l'affaire ≠ 1 « Configuration » → « Cette fonction n'est disponible que⏎si le statut de l'affaire est «Configuration». » ; 3. sinon « Voulez-vous vraiment supprimer cette inscription ? » (Avertissement) → suppression |
| Roue ▾ | | « Attribuer tous les groupes d'activités à un collaborateur pour l'affaire sélectionné » (une ligne sélectionnée) ; « Attribuer tous les groupes d'activités à un collaborateur pour toutes les affaires » (liste non vide) |
| « Fermer » | | |

**Attribution** [P `ProjectActivitiesDialog.attachStaffToAllActivityGroups@0-106`] : pour chaque groupe d'activités de l'affaire et chaque activité, ajout de `projectactivity_staff` `<ACTIVITY_ID>-<STAFF_ID>` s'il manque ; un commit pour toutes les affaires concernées ; toast « Activités attribuées. ».

### 4.11 Etiquettes … [Ancien document] (`ch04dLabels(contacts, o)`, lot 4) [P `lbl.LabelPreviewDialog`, `lbl.LabelSettingsDialog`]

**1. Choix du modèle** (« Choix du modèle ») : groupes de la catégorie `labelTemplates` (`modelegroupe` : Default « DELTA Originaux », Standard), tableau des modèles du groupe (Nom = `NAMEFR` du `formtemplate`, sinon nom ; Type de modèle), tableau des **planches** (pages fr du modèle : « No. 4267 »…). « OK » actif si un modèle **et** une planche sont choisis. Groupe proposé : `tplDefaultGroup('labelTemplates')`.

**2. Contrôles** : planche introuvable → « Impossible de trouver le modèle ^0. » ; aucun champ `label` ni `address` → « Ce modèle ne contient aucun champ d'étiquette. ». Nombre d'étiquettes par page `n` = champs `label` + `address` de la planche (§ 1 n° 13).

**3. Fenêtre « Etiquettes [nom du modèle] »** : visionneuse `ch11aView` avec boutons « Paramètres » (infobulle « Paramètres ») et « Imprimer » ; navigation et zoom de la visionneuse commune.

**4. Pages** : § 1 n° 15 (en JavaScript : `Math.trunc(k/copies)` et `%`) ; champs `label` triés par y puis x ; texte = `ch04dAddress(c)` = `getAddress("\n")` exact (§ 1 n° 16, pays standard = `ch08aCountry()`, nom du pays en majuscules par `ch08aCountryName`) ; autres champs : `user` (nom de l'utilisateur), `pageNumber` (p+1 / pages), `printDate` (date du jour) par `tplFieldValue`. Police et taille des paramètres pour **tous** les éléments de la page. Rendu par `tplPageHTML(planche, k, {vals})` (positions en points, une page A4 par planche), texte en haut à gauche du cadre, débordement coupé [D].

**5. Paramètres** (titre « Paramètres ») :

| Libellé | Valeur et défaut |
|---|---|
| Etiquettes | « (n) », lecture seule |
| Nombre de copies | 1 (chiffres seulement) |
| Etiquette initiale | 1 |
| Police ; Taille de police | police et taille standard (`standardFontName` ; taille des Préférences, sinon 10) [D] |
| Triage : case « Trié par: », boutons Nom / N° postal / Localité (actifs si la case est cochée) | non coché ; Nom |

- « OK » actif si copies ≠ 0 **et** 1 ≤ initiale ≤ n ; après OK, retour à la page 1.
- Tri : Nom = `ch10bCmpIC` sur [liée NAME1, NAME2, entité NAME1, NAME2] ; N° postal / Localité = nom du pays, puis NPA ou localité, sans casse.
- « Préférence pour les sociétés / pour les personnes », « Adresse avec civilité », « Adresse de société / privée » : libellés morts de l'original, **non affichés** [P].
- Non mémorisés.

**6. Impression** : « Imprimer » de la visionneuse ; `@page{size:A4;margin:0}` (papier entier, comme l'original).

**Sources** : adresses (sélection sinon table) ; collaborateurs → `PERSON_ID` ; intervenants → `CONTACT_ID` ; doublons retirés.

### 4.12 Assistant « Liste d'adresses » [Ancien document] et favoris (`ch04dAdrList(type, lignes, o)`, lot 4) [P `lst.AdrListWizardDialog`, `lst.Favorites`, `lst.AdrListPreferencesDialog`, `lst.FavoritesDialog`, `lst.NewFavoriteDialog`]

**Types livrés** : 0 « Liste d'adresses », 12 « Liste des entités » (Adresses) ; 4 « Adresses des collaborateurs » (adresses privées), 13 « Liste des collaborateurs » (adresses des entités) (Collaborateurs). Les types 2, 3/14, 5/10, 11 (Intervenants, Adresses d'affaire, Soumissionnaires, Entreprises) sont accessibles par la même fonction pour CH-05, CH-09 et EC-1, avec les défauts du tableau ci-dessous ; leurs entrées de menu ne sont pas posées ici.

**Modèle** [P `createBooklet@0-237`] : anciens modèles `addressTemplates/addressList` (types 0, 12), `staffTemplates/staffList` (4, 13), `projectTemplates/projectMember` (2, 11), `projectTendererList` (5, 10), `projectAddressList` (3, 14) ; pages `cover` (si « Document avec page de garde »), `page1`, `pageN`. Choix : le modèle du favori, sinon le **premier modèle déclaré** (`formtemplate`) du type dans le groupe par défaut de la catégorie (`ch04dTpl`, § 4.13) ; erreurs « Le modèle de première page ne contient pas de champ de liste. », « … de page suivante … », « Impossible de trouver le modèle ^0. ».

**Fenêtre** : titre selon le type (« Liste d'adresses », « Liste des entités », « Adresses des collaborateurs », « Liste des collaborateurs »…) ; aperçu paginé dans la visionneuse ; boutons « Paramètres » ▾ (« Paramètres … », « Choisir parmi les paramètres favoris … ») et favoris (infobulle « Sélectionner parmi les paramètres favoris »). Moteur : `tplPrint({md, cols, rows, cover, win:ch11aWin(maj)})`.

**Paramètres** (« Paramètres ») : Titre ; Date ; Document avec page de garde (Oui / Non) ; Format de papier (A4 Portrait, A4 Paysage, A3 Portrait, A3 Paysage) ; Présentation (une ligne, deux lignes, plusieurs lignes) ; Interligne ; Fond alterné ; Avec désignation CFC ; Titre en gras (« Titre (désignation CFC) en gras » quand le tri est par CFC) ; Contacts en italique ; Police ; Police des titres ; Taille de police ; Tri (Tri alphabétique, Tri selon CFC, Selon critère de tri, Selon tableau) ; Modèle. Colonnes (un clic sur l'en-tête les affiche ou les masque : « Cliquez sur la souris dans l'en-tête de la colonne pour afficher ou masquer les colonnes. ») : N° CFC, Adresse, Adresse et contact, Contact, Abréviation, Rue et n°, NPA, Localité, Téléphone, Tél. mobile, Fax, Tél./Fax, Courriel, Site internet, Fonction, Groupe, Banque, N° de compte bancaire, Compte postal, SWIFT, N° de clearing, IBAN, Domaine spécialisé, Rôle. Boutons de favoris : « Ajouter aux favoris » (« Nouveau favori » : Nom, choix du modèle Groupe | Modèle), « Enregistrer les modifications », « Retirer de la liste des favoris » ; le favori standard ne s'efface pas : « Les paramètres par défaut ne peuvent pas être effacés. ».

**Favori par défaut** (un seul par type, « A4 Portrait standard ») [P `Favorites.default…Favorites`] :

| Type | Page de garde | Présentation | Interligne | Tri | Désignation CFC | Titre en gras | Colonnes (largeur) |
|---|---|---|---|---|---|---|---|
| Adresses (0, 12) | oui | plusieurs lignes | 15 | alphabétique | non | oui | Société 30, Téléphone 20, Tél. mobile 20, Courriel 30 |
| Collaborateurs (4, 13) | oui | plusieurs lignes | 12 | alphabétique | non | non | idem |
| Adresses d'affaire (3, 14) | oui | plusieurs lignes | 12 | alphabétique | non | non | idem |
| Intervenants (2) | oui | plusieurs lignes | 12 | alphabétique | non | non | Société 20, Contact 20, Téléphone 20, Tél. mobile 20, Courriel 20 |
| Soumissionnaires (5, 10) | oui | plusieurs lignes | 12 | CFC | oui | non | idem |
| Entreprises (11) | oui | plusieurs lignes | 12 | CFC | oui | oui | idem |

**Mise en page des lignes** [D, à établir par le lot dans `createTableColumns@0-207`, `displyAddrTable`, `Book.createPage`] : une adresse = une ou plusieurs lignes du tableau du modèle selon la Présentation ; colonne « Adresse » multi-ligne en « plusieurs lignes » ; groupe CFC en titre (gras si « Titre en gras »), contacts en italique ; interligne en points ; fond alterné ; page de garde avec titre et date. Favoris rangés par poste dans `ds_ch04d_fav` : `{<type>: [{nom, réglages, colonnes, modèle}]}`.

### 4.13 Choix du modèle déclaré (`ch04dTpl(cat, type, project)`, lot 4)

Pour la catégorie et le type, parmi les groupes dans l'ordre de `tplFind` (groupe de l'affaire, `tplDefaultGroup(cat)`, Standard, Default), le premier `modele` fr dont le **nom figure dans `formtemplate`** (même `TYPE`, `FORMTEMPLATEGROUP_ID` du groupe de même `CATEGORY` et `NAME`) ; `project1` d'abord, puis par nom ; aucun → `null` (repli `tplFind`). Pour `addressTemplates/addressList` au bureau : `Standard/address2` (`FORMTEMPLATE` 4507). Utilisé par `printAdr` (ancre A11) et par l'assistant.

### 4.14 Messages et libellés exacts (fr)

| Clé `Strings.db` | Texte |
|---|---|
| `AppForm\|importVCards` / `importContacts` | Importer des vCards / Importer des adresses (+ « … », CH-10) |
| `ImportVCardDialog\|dialogTitle`, `chooseFile`, `nextVCard`, `newContact`, `newContactWithRelation`, `msgNoVCard` | Importer les vCards ; Sélectionner le fichier vCard ; Prochaine vCard ; Nouvelle adresse ; Lier une entité ; Le format vCard du fichier ^0 n'est pas correct. |
| `ImportVCardDialog\|person1`, `person2`, `company1`, `company2`, `street`, `location`, `phone`, `mobile`, `fax`, `email`, `internet` | Nom ; Prénom ; Société ; Complément société ; Rue et n° ; Localité ; Téléphone ; Mobile ; Fax ; Courriel ; Site internet |
| `ExportVCard\|exportVCards`, `defaultFilename` ; `ContactDialog\|exportVCard` | Exporter vCards ; DELTAproject vCards ; Export vCard |
| `ImportCSVDialog\|…` | Importer les adresses ; Début ; Séparateurs ; Ignorer la première ligne à l'importation ; Préparer l'import ; Voulez-vous importer ^0 enregistrements? ; Import abandonné. ; Préparer l'importation de l'adresse ^0. ; de ; contacts importés ; Terminer … ; Importer |
| `ImportAFDialog\|msg1`, `importedContacts` | Voulez-vous mettre à jour ^0 contacts? ; Importer les contacts |
| `util.csv\|Separators` | Virgule ; Point-virgule ; Deux-points ; Touche tabulation ; Espace |
| `ContactListFrame\|editContacts` ; `ContactsConfirmationDialog\|…` | Editer des adresses ; Modifier adresses ; Souhaitez-vous modifier ces champs pour ^0 adresses? ; Champs ; Valeur |
| `ContactDialog\|inputAssistance`, `showMapT`, `msgEmailNok` | Bloc-notes temporaire ; Affiche la carte des environs ; Cette adresse courriel est incomplète ou incorrecte. |
| `PhoneDirectoryPopup\|…` ; `MapLookupPopup\|…` | search.ch ; local.ch ; Copier dans le presse-papiers ; Appeler ; map.search.ch ; Google Maps |
| `AddressListFrame\|contactSheet`, `openContactListByContactOwner`, `openContactListByBkp`, `addressList`, `contactList`, `labels` | Fiche de l’adresse ; Liste d'adresses par entité ; Liste d'adresses par CFC ; Liste d'adresses ; Liste des entités ; Etiquettes |
| `ContactListFrame\|contactOwnerSheet` | Liste adresses de l’entité |
| `ContactListDialog\|…` ; `ContactListTableModel\|…` | Liste d’adresses par entité ; Entité ; CFC ; Adresse liée ; Appartient à ; Localité ; Téléphone ; Téléphone mobile ; Courriel ; Fonction ; `Strings\|noBkp` Sans CFC |
| `Strings\|showReport` ; `BankAccountsDialog\|dialogTitle` | Afficher le rapport ; Coordonnées bancaires |
| `EmployeeFrame\|…` | Participation aux affaires ; Fiche-collaborateur ; Liste des collaborateurs ; Adresses privée ; Adresses des entités ; Etiquettes |
| `ProjectMembershipDialog\|…` ; `ProjectMemberTableModel\|colProjectNumber`, `colProjectDesc` | Attribuer un collaborateur ; Collaborateur ; Participation aux affaires ; Attribuer tous les groupes d'activités à un collaborateur pour l'affaire sélectionné ; … pour toutes les affaires ; Numéro ; Affaire |
| `Strings\|msgEntryIsNotDeletable0/1`, `msgProjectIsNotInitializing0/1`, `msgDeleteEntry` | Cette inscription est déjà utilisée et ⏎ ne peut pas être supprimée. ; Cette fonction n'est disponible que ⏎ si le statut de l'affaire est «Configuration». ; Voulez-vous vraiment supprimer cette inscription ? |
| `LabelPreviewDialog\|…` ; `LabelSettingsDialog\|…` | Etiquettes ; Paramètres ; Impossible de trouver le modèle ^0. ; Ce modèle ne contient aucun champ d'étiquette. ; Etiquette initiale ; Nombre de copies ; Police ; Taille de police ; Triage ; Trié par: ; Nom ; N° postal ; Localité |
| `Strings\|legacyMenu`, `selectedEntriesOnly` | « [Ancien document] » ; « pour la sélection » |
| `AdrListPreferencesDialog\|…`, `Favorites\|…`, `NewFavoriteDialog\|…`, `AdrListWizardDialog\|…` | § 4.12 (68 libellés, `ch/CH-04/strings_ch04.tsv`) |

---

## 5. Documents imprimés

Tous passent par `ch11aReport(type, job, o)` (jeu 0 « Group.general » par `ch01aTplPick(type,null)`, un seul modèle fr → pas de dialogue), `ch11aFlat` pour les formats manquants, `svDpHTML`, puis la visionneuse. Le titre (`reportTitle`) est celui du modèle. Logo « A0 architekten Logo.png » du modèle livré : absent de la collection `image`, **rien ne s'imprime à sa place** (fidèle) [P `dpdoc_ch04.txt`]. Repli si aucun modèle : tableau simple (`ch11aHTML`).

Formats calculés par CH-04 (`ch04cF`, pure) et passés sous la clé `nom~style` :
- **adresse** (`Contact`) : `contactFirstnameAndName` = `ch10bOwnerName(entité)` ; `contactFormOfAddress`, `contactContactOwnerUid` = `FORMOFADDRESS` / `UID` de l'entité **liée** si elle existe, sinon de l'entité ; les autres formats d'adresse sont déjà dans `svFmtVal` ;
- **entité** (`ContactOwner`) : `contactOwnerName` = `ch10bOwnerName` ; `contactOwnerName1`, `contactOwnerName2`, `contactOwnerFormOfAddress`, `contactOwnerUid`, `contactOwnerSocialSecurityNumber`, `contactOwnerRemark` tels quels ; `contactOwnerBirthday` = date MEDIUM (`svDateFmt(…,'dateMedium')`) ; défaut = `getName` ;
- **collaborateur** (`Staff`) : `staffIsInternal`, `staffIsActive` = « oui » / « non » ; `staffInitials` ; `staffJoiningDate`, `staffQuittingDate` (MEDIUM) ; `staffSocialSecurityNumber`, `staffBirthday` (MEDIUM) via la personne → entité ; `staffHolidays` (nombre) ; défaut = `getContactOwnerDesc` de la personne.

### 5.1 Fiche de l’adresse (`contactSheet`, `ch04cContactSheet(c)`)

`job.F = {contact:{t:'contact',id}, 'contact~contactFirstnameAndName', 'contact~contactFormOfAddress'}`. Modèle « Feuille d'adresse » (A4 portrait) : titre « {reportTitle} pour {contactShortForm} » | date longue ; grille de 15 lignes (Nom, Prénom, Adresse, Adresse mono-ligne, Adresse double-ligne, Abréviation d'adresse, Civilité, Prénom et nom, NPA et localité, Téléphone, Fax, Mobile, Site internet, Courriel, En-tête d'adresse) ; bande de texte reprenant les mêmes valeurs (et Localité). Pied : « Créé par … », date MEDIUM, « Page n|N ».

### 5.2 Liste adresses de l’entité (`contactOwnerSheet`, `ch04cOwnerSheet(e, masquées)`)

`job.F` : `contactOwner~contactOwnerName`, `~contactOwnerName1`, `~contactOwnerName2`, `~contactOwnerUid`, `~contactOwnerRemark`. Tableau `table` (« Contenu de la liste » = « Adresses avec contacts », défaut) : adresses **propres puis liées** de l'entité, ordre de la base (ID croissant [D]), masquées seulement si « Afficher les entités masquées » (`AE.hid`) est coché ([C] DeltaSub n'a qu'un interrupteur). Lignes : `{c:[31 valeurs par id], st:'tr'}`, colonnes [P `ContactListTableContent`] : 0 icône (vide, § 1 n° 27), 1 `getContactOwnerDesc`, 2 `getContactRelationDesc`, 3 type d'adresse, 4 `contactOwnerAndAddress`, 5 `contactAddress`, 6 mono-ligne, 7 double-ligne, 8-10 NAME1-3, 11 rue, 12 case postale, 13 « NPA Localité », 14 code pays, 15 tél., 16 mobile, 17 fax, 18 courriel, 19 Skype, 20 site, 21 abréviation, 22 CFC, 23 civilité courrier, 24 remarque, 25 fonction, 26 profession, 27 statut, 28 langue, 29 créé le, 30 modifié le. Colonnes visibles du modèle : Type, Entité, Appartient à, Entité et adresse, Téléphone, Tél. mobile, Courriel (A4 paysage).

### 5.3 Liste des banques (`bankList`, `ch04cBankList(e)`)

`job.F = {contactOwner: ch10bOwnerName(e)}` ; tableau `table` : un compte par ligne (ordre `bankaccount` par ID [D]), colonnes 0 `NAME`, 1 rue, 2 NPA, 3 localité, 4 `CLEARINGNR`, 5 `SWIFT`, 6 `ACCOUNT1` (« Compte postal »), 7 `IBAN`, 8 `ACCOUNT2` (« N° compte ») [P `rech_orig` § 6.4]. Visibles : Banque/Etablissement, Rue et n°, NPA, Localité, IBAN, N° compte. **Attention** : DeltaSub `bankDlg` libelle `ACCOUNT1` « N° compte bancaire » et `ACCOUNT2` « Compte postal », à l'inverse de `BankAccountTableModel` (§ 8 n° 4) ; le document suit l'original.

### 5.4 Fiche-collaborateur (`staffSheet`, `ch04cStaffSheet(s)`)

`job.F = {person:{t:'contact',id:PERSON_ID}, homeContact:{t:'contact',id:HOMECONTACT_ID}, staff}` + clés `person~contactFirstnameAndName`, `staff~staffInitials`, `staff~staffJoiningDate`, `staff~staffQuittingDate`, `staff~staffSocialSecurityNumber`, `staff~staffBirthday`. Modèle « Fiche du collaborateur » (A4 portrait) : titre, Prénom, Nom, « Données professionnelles » (Adresse = `contactOwnerAndAddress`, Téléphone, Tél. mobile, Courriel, Abréviation, Date d'engagement, Date de départ), « Données privées » (Adresse privée, Téléphone privé, Tél. mobile privé, Courriel privé, N° AVS, Date d'anniversaire).

### 5.5 Liste des collaborateurs (`staffList`, `ch04cStaffList(staffs)`)

Même remplissage que Management ▸ Collaborateurs ▸ Liste (`mgcPane`, branche `liste` : colonnes 0, 2, 6, 7, 9-14), recopié et non modifié ; `job.F = {filterDesc: titre de la vue}` [D]. Titre de la visionneuse « Liste des collaborateurs ».

### 5.6 Étiquettes et listes [Ancien document]

§ 4.11 et § 4.12 : anciens modèles DESIGN (`tplPageHTML`, `tplPrint`), pages A4 ou A3 selon le modèle et le format choisi.

---

## 6. Valeurs de contrôle

Base : copie `.backup` de `dstest/deltasub.sqlite` (séquence 691 à la rédaction ; `contact` 755, `contactowner` 727, `bankaccount` 125, `staff` 13, `projectmember` 1 324). **Avant chaque test**, le lot compare ces compteurs avec la copie du jour et recalcule les valeurs dépendantes s'ils ont changé (`ch/CH-04/exist/stats.py`). Les jeux extraits de la base sont générés dans le dossier du lot au moment du test, puis **effacés**. Utilisateur de l'essai : 2752.

### 6.1 Tests jsc

| # | Lot | Test | Attendu |
|---|---|---|---|
| T0 | 1-4 | syntaxe | `jsc -e "new Function(readFile('<script extrait du DeltaSub.html construit>'))"` sans erreur |
| T1 | 1 | `ch04aVcParse` sur la vCard 3.0 fictive de `rech_orig` § 11.1 | personne Muster / Hans ; `ORG` « Beispiel AG; » → « Beispiel AG » ; adresse WORK : rue « Bahnhofstrasse 1 », localité Zürich, NPA 8001, pays « Schweiz » ; tél. WORK, CELL, courriel WORK |
| T2 | 1 | `ch04aVcParse` : ligne repliée par une espace ; ligne commençant par U+0000 ; tabulation | la ligne à espace n'est **pas** recollée ; la ligne « ignorable » est recollée ; la tabulation disparaît |
| T3 | 1 | `ch04aPhone` | « +41 44 123 45 67 » → +41 \| 044 \| 123 45 67 ; « 044 123 45 67 » → (vide) \| 044 \| 123 45 67 ; « 0041 44 123 45 67 » → défaut \| 044 \| 123 45 67 ; « 44 123 45 67 » → défaut \| 44 \| 123 45 67 ; « +41 (0)44 123 45 67 » → +41 \| 044 \| 123 45 67 (D-04-9) ; pays FR → valeur brute |
| T4 | 1 | texte d'export (`ch04aVCardText`) de l'adresse fictive de `rech_orig` § 11.2 | lignes exactes `N:Muster;Hans`, `ORG:Beispiel AG`, `item1.ADR;type=WORK;type=pref:;Bahnhofstrasse 1;;Zürich;;8001;`, `TEL;TYPE=WORK:+41 44 123 45 67`, fin « END:VCARD\r\n » |
| T5 | 1 | encodage ISO-8859-1 | « Zürich » → octet 0xFC ; « € » → « ? » |
| T6 | 1 | `ch04aSepGuess` | 5 lignes à 3 « ; » et 1 « , » → Point-virgule ; égalité tab / « ; » → tabulation ; aucun → Virgule |
| T7 | 1 | `ch04aCsvRead` | `a,"b,c",d\"e` → [a] [b,c] [d"e] (échappement « \ ») |
| T8 | 1 | `ch04aCsvRows` (préparation pure) sur la ligne fictive de `rech_orig` § 11.3 | société (0) Beispiel AG ; personne (1) en-tête « Herr », Muster / Hans ; adresse `EXTERNALREFERENCE` « Import_7 », liée à Beispiel AG, NAME1 « Beispiel AG », NAME2 « Hans Muster » (`displayNameFormat` `[NO]`), pays CH, `BKP` « 211.1212 », `SALUTATION1` « Lieber Hans » |
| T9 | 1 | `ch04aCsvRows` : troncature et regroupement | col14 de 20 caractères → 15 ; deux lignes même société (col1+col3) → 1 entité ; deux lignes personne sans prénom → 2 personnes ; ligne sans société ni personne → ignorée |
| T10 | 1 | `.archfile` (pure) : ligne existante « AF_12 » et ligne nouvelle | 1 mise à jour (même ID, `bseq` connu), 1 création |
| T11 | 1 | `ch04aMenu('adrRapports', …)` sans lots 3-4, puis avec | sans : élément de `base` seul ; avec : ordre du § 4.1 a), séparateurs nettoyés, suffixes S et [A] ; `ivFormVisible()` faux → pas de [A] |
| T12 | 2 | `ch04bBulkModel` sur 2 adresses fictives (rue identique, NPA différents) | Rue active ; NPA, Localité, Pays inactifs « - » ; liste à OK : « Adresse 1 » (si identique), « Rue », … ; statut choisi écrit |
| T13 | 2 | bloc-notes : « 8001 Zürich » → NPA 8001, localité Zürich ; « Tel. +41 44 123 45 67 », pays CH → +41 \| 044 \| 123 45 67 ; « 12 34 » → numéro 1234 | idem |
| T14 | 2 | URL d'annuaire et de carte | `ch04bUrl('mapSearch',{rue:'Bahnhofstrasse 1',npa:'8001'})` = `https://map.search.ch/Bahnhofstrasse+1-8001` ; Google Maps code AU → « Austria » ; search.ch par nom avec NPA → `…index.fr.html?was=Muster+Hans&wo=8001` |
| T15 | 2 | courriel | `^.+@.+\..+$` accepte « a@b.ch » et la forme de l'adresse 4094 (deux @) ; refuse « a@b » |
| T16 | 2 | D3, D4 | `adrLines` d'une adresse FR avec pays standard CH → dernière ligne « FR-… » inchangée ; pays standard FR → sans préfixe ; `ownerName` d'une société avec complément → NAME1 seul |
| T17 | 3 | `ch04cF` | entité 1201 : `contactOwnerName` = NAME1 ; collaborateur 2752 : `staffIsActive` « oui » ; dates MEDIUM « 29 sept. 2026 » |
| T18 | 3 | lignes de `contactOwnerSheet` de l'entité 1201 | **16** lignes (1 propre + 15 liées, 0 masquée), propres d'abord |
| T19 | 3 | lignes de `bankList` de l'entité 1201 | **5** comptes |
| T20 | 3 | `ch04cByOwnerRows`, `ch04cByCfcRows` sur 3 adresses fictives | groupes, lignes vides, lignes de groupe, ordre du § 4.8 ; « Sans CFC » ; code « 211.1 » → groupe « 211 » |
| T21 | 3 | Participation (pure) | 2752 : **97** inscriptions, 97 affaires, 1 en « Configuration » ; 3051 : 85 ; ajout pour 3051 → `CONTACT_ID` null ; suppression d'une inscription d'une affaire au statut 2 → message « Configuration » |
| T22 | 4 | pagination des étiquettes | n = 8, N = 10, copies 2, début 3 → 3 pages ; p1 : –, –, A, A, B, B, C, C ; p2 : D, D, E, E, F, F, G, G ; p3 : H, H, I, I, J, J, –, – ; copies 3, début 3 → –, –, A, A, A, B… ; copies 3, début 5 → 4 vides puis A |
| T23 | 4 | Herma 4267 corrigé, 754 adresses visibles | n = 16 ; **48** planches (47 pleines + 2 étiquettes) ; 1ʳᵉ étiquette en (24 ; 47) pt, 258 × 73 pt |
| T24 | 4 | `ch04dAddress` | « N1⏎N2⏎Rue⏎8001 Zürich » ; sans NAME : « ⏎Rue⏎… » (séparateur obligatoire) ; pays PT, standard CH → dernière ligne « PORTUGAL » |
| T25 | 4 | `ch04dTpl('addressTemplates','addressList')` | `Standard/address2` (et non `address1`) |
| T26 | 4 | convertisseur corrigé (Python, copie) | planche Herma 4267 fr : 16 champs `label` 258 × 73 pt, coin (24, 47) ; `address1` fr page1 : 6 éléments, tableau 511 × 715 pt en (42, 92) ; aucune autre page modifiée hors des 36 modèles listés dans `exist/modeles_geometrie_perdue.tsv` |

### 6.2 Essai navigateur (copie isolée, par lot)

Dossier du lot, copies de `serveur_deltasub.py` (au lot 1 : la copie modifiée) et du `DeltaSub.html` construit ; base copiée par `sqlite3 '<dstest>/deltasub.sqlite' ".backup '<dossier>/deltasub.sqlite'"` ; serveur `DELTASUB_DB=<dossier>/deltasub.sqlite python3 -I <dossier>/serveur_deltasub.py --port 800n` (n = numéro du lot) en arrière-plan ; **onglet propre** (`tabs_create`, puis `http://127.0.0.1:800n/`), `localStorage.ds_user='2752'`, rechargement. Les téléchargements et `window.open` sont vérifiés par interception (contenu du Blob, URL demandée) ; les impressions dans l'iframe de la visionneuse. À la fin : serveur arrêté, onglet fermé, taille d'affichage par défaut.

| # | Lot | Scénario | Attendu |
|---|---|---|---|
| B1 | 1 | Fichier ▸ Importer des vCards … avec la vCard fictive ; « + » société ; Importer ▸ Nouvelle adresse ; « + » personne ; Importer ▸ Lier une entité | dialogue Entité prérempli (contrôle de doublons) ; dialogue « Nouvelle adresse » prérempli ; 2 entités et 2 adresses en base, NAME1/NAME2 du § 4.2 |
| B2 | 1 | Fichier ▸ Importer des adresses … avec un CSV fictif de 3 lignes (« ; ») | séparateur proposé Point-virgule ; confirmation « …importer 3 enregistrements? » ; un seul commit ; « Import_… » |
| B3 | 1 | Liste des adresses ▸ Fonctions ▸ Exporter vCards … sur 2 adresses ; entité 1201 sans sélection | fichiers « DELTAproject vCards.vcf » (2 vCards) et 16 vCards |
| B4 | 1 | ré-import de la copie : `python3 <dossier>/serveur_deltasub.py --importer-deltaproject <extraction> --force` avec `DELTASUB_DB` de la copie, après B1-B2 | adresses et entités créées **conservées** ; message de collision si un ID de l'extraction est déjà pris |
| B5 | 2 | Editer des adresses … sur 3 adresses d'une même entité | champs différents « - » ; confirmation ; `UPDATED` du jour |
| B6 | 2 | nouvelle adresse : bloc-notes ouvert, coller « 8001 Zürich » puis sélection ▸ menu NPA ; détail : menus annuaire et carte | NPA / localité remplis ; URL du § 4.7 |
| B7 | 3 | Fiche de l’adresse ; Liste adresses de l’entité 1201 ; Liste des banques 1201 ; Fiche-collaborateur 2752 ; Liste des collaborateurs | rendus dans la visionneuse, valeurs du § 5 ; 16 lignes, 5 comptes |
| B8 | 3 | Liste d’adresses par entité, par CFC (toutes les adresses) | index cliquable ; « Sans CFC » ; textes des CFC lus dans la base |
| B9 | 3 | Participation aux affaires de 2752 : « + » 2 affaires, « - » (affaire non « Configuration »), roue ▸ pour l'affaire sélectionnée | 99 lignes ; message ; liens `projectactivity_staff` créés |
| B10 | 4 | Etiquettes … [Ancien document] sur 20 adresses, Herma 4267 (modèles de la copie reconvertis par le convertisseur corrigé, § 10 lot 4), Paramètres copies 2 / initiale 3 | 3 planches, positions conformes ; OK grisé si initiale > 16 |
| B11 | 4 | Prévisualisation ▸ Liste d’adresses (existant) | modèle `address2`, tableau rempli (plus de pages blanches) |
| B12 | 4 | Liste d’adresses … [Ancien document] : Paramètres, colonnes, Ajouter aux favoris, rechargement | favori retrouvé (`ds_ch04d_fav`) ; « Les paramètres par défaut ne peuvent pas être effacés. » |

---

## 7. Écarts assumés

| # | Écart | Raison |
|---|---|---|
| E1 | Fichiers : sélection par le navigateur, téléchargement sans « Enregistrer sous » | navigateur |
| E2 | Indicatif « +41 » au lieu de « 41 » (vCard) | format des données du bureau (§ 1 n° 7) |
| E3 | Colonne « Type » des listes `.dpdoc` d'adresses vide (icône) | `svDpCell` sans icône |
| E4 | Un seul interrupteur « masquées » pour les entités et les adresses dans Entités | existant de DeltaSub |
| E5 | Statut écrit dans « Editer des adresses » (D-04-5), « 12 de 100 » (D-04-8), « (0) » retiré (D-04-9), libellé « Fiche de l’adresse … » du panneau (D-04-6) | défauts manifestes de l'original |
| E6 | Pas de nouveau circuit d'étiquettes ni de Style de texte | CH-12 (aucun modèle au bureau) |
| E7 | Favoris par poste en `localStorage` au lieu de fichiers XML | navigateur ; même portée que l'original |
| E8 | Valeur vide enregistrée `null` | convention de DeltaSub |
| E9 | Import : progression pendant la préparation, puis un seul commit | une transaction comme l'original |
| E10 | Décodage ISO par windows-1252 | navigateur ; sans effet sur des adresses |
| E11 | Aucune impression directe : tout passe par la visionneuse | socle CH-03 / CH-11 |

---

## 8. Écarts et incohérences hors chantier signalés (non traités ici)

1. **CH-08** : le message de ré-import « Utilisateurs, droits et réglages modifiés dans DeltaSub, conservés tels quels » compte désormais aussi les adresses (§ 3.4) ; libellé à généraliser (« Enregistrements modifiés dans DeltaSub … »).
2. **Collections non protégées au ré-import** que DeltaSub modifie aussi : `staff`, `staffrate`, `stafftargettime`, `staffholiday`, `staffprojecttime` (Collaborateurs ▸ Paramètres), `property`, `propertygroup`, `contactstate` (Administrateur), `projectactivitygroup`, `projectactivity`, `projectrategroup`… (Gestion de l'affaire). À traiter par CH-05, CH-06, CH-08 sur le même modèle.
3. **Convertisseur** : la même perte de géométrie touche, hors CH-04, les variantes allemandes « (A4H) » de `projectAddressList`, `projectMember`, `projectTendererList`, `projectTime`, `projectTimeJournal`, `projectCostcontrolEstimate`, `projectCostcontrolMutationList`, `projectMinutes` (groupes Default et Substances_2) et `bankList` (en) ; la correction du lot 4 les répare à la reprise suivante (CH-01, CH-09, CH-13 informés).
4. **`bankDlg`** : `ACCOUNT1` libellé « N° compte bancaire » et `ACCOUNT2` « Compte postal », inverses de l'original (`BankAccountTableModel` : `ACCOUNT1` « Compte postal », `ACCOUNT2` « N° compte bancaire ») [P `rech_orig` § 6.4]. À vérifier puis corriger par CH-06 ou un correctif.
5. **Propriétés ▸ « Retirer la propriété des adresses sélectionnées »** ne fait rien (D5) ; libellé d'origine « Supprimer la propriété ^0 », confirmation « Voulez-vous supprimer cette propriété ^0 ? ».
6. **Mes favoris** : « Retirer du groupe » au lieu de « Retirer de la liste des favoris » (D8).
7. **Entités ▸ roue de gauche** : « En tant que soumissionnaire » manque (`ContactListFrame.tendererInfo`) ; « Export tableau » n'existe pas dans l'original 16.05 (§ 1 n° 8) : EC-1 / correctif.
8. **`svAddrTail`** compare le pays à « CH » en dur et **`svOwnerDesc`** ignore `displayNameFormat` (formats des documents de la Soumission et de CH-11) ; CH-04 ne les modifie pas et calcule ses propres valeurs.
9. **`spec_1` § 3.7** (mappage CSV, 26 champs) et **`spec_5`** (format d'étiquette unique) sont périmés.

---

## 9. Points d'ancrage DeltaSub

### 9.1 Règles du `build.py` de chaque lot

- Il prend le chemin du `DeltaSub.html` source en argument (défaut : celui du dépôt) et, au lot 1, celui du serveur ; au lot 4, celui de `outils_deltaproject/convertir_modeles.py`.
- Il vérifie chaque ancre : **compte = 1** (`grep -F -c`) ; s'il en manque une ou qu'elle est multiple, il **échoue proprement** (message, code non nul, aucun fichier écrit).
- Il insère le bloc du lot **avant** le commentaire qui ouvre `DÉMARRAGE` (dernier `\n/*` avant la ligne `   DÉMARRAGE`), après avoir vérifié que `const HEAVY=` le précède.
- Le bloc ne contient que des déclarations de haut niveau, n'exécute aucun code au chargement et ne redéclare rien : le build vérifie que chaque nom déclaré est absent de la source.
- Il produit `lotN_integration.md` : remplacements exacts « ancien → nouveau » et bloc inséré ; pour Python, la copie complète modifiée et son diff.

### 9.2 Ancres (vérifiées uniques sur md5 `df42ee3e…`)

| # | Lot | Ancre (« ancien », exact) | « Nouveau » |
|---|---|---|---|
| A0 | 1-4 | ligne `   DÉMARRAGE` | bloc du lot inséré avant le commentaire |
| E1 | 1 | `const isNew=!o; const v=o?{...o}:` | `const isNew=!o\|\|o.ID==null; const v=o?{...o}:` |
| E2 | 1 | `const isNew=!c; const o=owner\|\|ownerOf(c)` | `const isNew=!c\|\|c.ID==null; const o=owner\|\|ownerOf(c)` |
| H1a | 1 | `{i:'doc',t:'Prévisualisation',menu:()=>[` | `{i:'doc',t:'Prévisualisation',menu:()=>ch04aMenu('adrRapports',{st,sel,opt},[` |
| H1b | 1 | `'Liste d’adresses par CFC')}]},` | `'Liste d’adresses par CFC')}])},` |
| H2 | 1 | `'-',{t:'Courriel …',dis:!n,fn:()=>mailList(sel())},` | `...ch04aMenu('adrEdit',{st,sel},[]),'-',{t:'Courriel …',dis:!n,fn:()=>mailList(sel())},` |
| H3 | 1 | `{t:'Exporter le tableau dans un fichier CSV …',fn:()=>csvTable(st.g,'Adresses')},` | même texte + `...ch04aMenu('adrVcard',{st,sel},[]),` |
| H4 | 1 | `{t:'Copier l’adresse dans le presse-papier',dis:!curA(),fn:()=>{ ctCopy(adrLines(curA()).join('\n'),'Adresse copiée.'); }}]}` | `{t:'Copier l’adresse dans le presse-papier',dis:!curA(),fn:()=>{ ctCopy(adrLines(curA()).join('\n'),'Adresse copiée.'); }},...ch04aMenu('entRoue',{curE,curA,AE},[])]}` |
| H7 | 1 | `{i:'gear',t:'Fonctions',menu:()=>[{t:'Courriel …',fn:()=>mailList(gridSel(CO.g` | `...ch04aBtn('staffRapports',{CO}),{i:'gear',t:'Fonctions',menu:()=>[{t:'Courriel …',fn:()=>mailList(gridSel(CO.g` |
| H10 | 1 | `{t:'Courriel',fn:()=>mailList(rows().map(x=>DS.get('contact',x.RESPCONTACT_ID)\|\|DS.get('contact',x.CONTACT_ID)).filter(Boolean))},` | même texte + `...ch04aMenu('pmRoue',{p,rows},[]),` |
| L1 | 2 | `const I=(k,w)=>h('input',{class:'inp',value:v[k]??'',style:w?{width:w}:null,'data-k':k});` | `const I=(k,w)=>ch04bField(h('input',{class:'inp',value:v[k]??'',style:w?{width:w}:null,'data-k':k}),k,{v,o,r,isNew});` (`ch04bField` rend l'`input` ou un conteneur [input, ◂] ; l'`input` garde `data-k`, la lecture à OK est inchangée) |
| L2 | 2 | `dialog({title:isNew?'Nouvelle adresse':'Editer l’adresse',body,buttons:` | `dialog({title:isNew?'Nouvelle adresse':'Editer l’adresse',body:ch04bPad(body,isNew),buttons:` |
| L3 | 2 | `if(v.EMAIL1&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.EMAIL1))` | `if(v.EMAIL1&&!/^.+@.+\..+$/.test(v.EMAIL1))` |
| L4 | 2 | `const map=adrLines(c).length?` | `const map=adrLines(c).length&&typeof ch04bMapBtn==='function'?ch04bMapBtn(c):adrLines(c).length?` (le bouton rend un `<span>` HTML, comme le lien actuel) |
| L5 | 2 | `...L('Téléphone',phone(c,1)),...L('Tél. mobile',phone(c,2)),...L('Fax',phone(c,3)),` | `...L('Téléphone',ch04bTel(c,1),true),...L('Tél. mobile',ch04bTel(c,2),true),...L('Fax',ch04bTel(c,3),true),` (`ch04bTel` rend le HTML échappé du numéro + bouton ▾) |
| L6 | 2 | `...L('Adresse',adrLines(c).map(esc).join('<br>')+map,true)),` | même texte + `ch04bWheel(c),` (roue ▾ du § 4.1 i, en tête de la 2e colonne) [D emplacement exact au build] |
| L7 | 2 | `function adrLines(c){ return c?[c.NAME1,c.NAME2,c.NAME3,c.STREET,c.POBOX,[c.COUNTRYCODE&&c.COUNTRYCODE!=='CH'?c.COUNTRYCODE+'-':'',locality(c)].join('')].filter(Boolean):[]; }` | identique, `'CH'` remplacé par `ch08aCountry()` (D3) |
| L8 | 2 | `:[o.NAME1,o.NAME2].filter(Boolean).join(' '); }` (fin de `ownerName`) | `:(o.NAME1\|\|''); }` (D4) |
| R1 | 3 | `{i:'minus',t:'Supprimer l’adresse',fn:()=>curA()&&delContact(curA())},` | même texte + `{i:'doc',t:'Rapports',menu:()=>[{t:'Liste adresses de l’entité …',dis:!curE(),fn:()=>ch04cOwnerSheet(curE(),AE.hid)}]},` |
| R2 | 3 | `{t:'Verrouillage des heures',dis:!cur(),fn:()=>staffFreeze(gridSel(CO.g,id=>DS.get('staff',id)))}]},` | `{t:'Verrouillage des heures',dis:!cur(),fn:()=>staffFreeze(gridSel(CO.g,id=>DS.get('staff',id)))},...ch04cCle(CO)]},` |
| R3 | 3 | `dialog({title:'Coordonnées bancaires — '+ownerName(e,true),body:h('div',{},phead([{i:'plus',fn:()=>ed()},` | même texte + `{i:'doc',t:'Rapports',menu:()=>[{t:'Afficher le rapport …',dis:!DS.by('bankaccount','CONTACTOWNER_ID',e.ID).length,fn:()=>ch04cBankList(e)}]},` |
| P1 | 4 | `function printAdr(rows,title,project){ tplOr(()=>tplPrint({cat:project?'projectTemplates':'addressTemplates',` | `function printAdr(rows,title,project){ tplOr(()=>tplPrint({md:ch04dTpl(project?'projectTemplates':'addressTemplates',project?'projectAddressList':'addressList',project)\|\|undefined,cat:project?'projectTemplates':'addressTemplates',` |
| P2 | 4 | `'Liste par CFC — '+projLabel(p))}]},` | `'Liste par CFC — '+projLabel(p))},...ch04dPmDocs(p,rows)]},` |
| S1 | 1 | serveur : ligne `# ── fin CH-08 lot 1 ──` | **après** : les deux lignes du § 3.4 (`CH08_PIT \|= …`, `CH08_CLE.update(…)`) |
| C1 | 4 | `convertir_modeles.py` : décodeur `XMLDecoder` | copie complète modifiée : (1) `<object class="java.awt.Rectangle">` à 4 `<int>` (ou `$args`) → `x, y, width, height` ; (2) `<object … method="valueOf">` porteur d'un `id` → valeur enregistrée dans `ids` ; diff joint ; aucune autre sortie modifiée (T26) |

Dans le fichier d'intégration, `\|` s'écrit `|` et `\n` de H4 est le texte à deux caractères du source.

**Croisement avec les autres chantiers** : aucune de ces ancres n'est visée par un lot déjà écrit dans `ch/*/` (recherche des textes ci-dessus, hors copies intégrales de `DeltaSub.html`) ; CH-10 et CH-08 ancrent le serveur sur d'autres lignes (S1 de CH-10 = ligne `PROTECTED_IF_EDITED |= {"statisticalvalue", …}`). CH-09 visera l'élément `{t:'Liste d’adresses',fn:()=>printAdr(st.g.view,'Liste d’adresses')}`, disjoint de H1a et H1b. **Les lots suivants doivent vérifier l'absence de chevauchement** avec les lots de CH-05 et CH-09 en cours de rédaction.

**Fonctions existantes réutilisées sans modification** : `h`, `esc`, `num`, `cmp`, `dfr`, `today`, `toast`, `ibtn`, `popMenu`, `dialog`, `confirmDlg`, `ctMsg`, `ctOk`, `ctBox`, `ctBseq`, `ctCopy`, `grid`, `gridSel`, `phead`, `formRows`, `readK`, `copyTable`, `csvTable`, `mailList`, `editOwner`, `editContact` (hors E1, E2, L1-L3), `ownerOf`, `relOf`, `locality`, `entityAddresses`, `phone`, `contactName`, `staffName`, `projects`, `projLabel`, `PSTATE`, `nm`, `addToGroup`, `favGroup`, `ivFormVisible`, `hfSet`, `ch08aCan`, `rgCan`, `ch08aCountry`, `ch08aDial`, `ch08aCountryName`, `ch08aDocLangCode`, `ch08aName1First`, `ch08cVcardCharset`, `ch10bOwnerName`, `ch10bCmpIC`, `ch10bDownload`, `ch17aPrjPick` (modèle), `svContactDesc`, `svFmtVal`, `svDateFmt`, `svDpHTML`, `ch01aTplPick`, `ch11aReport`, `ch11aView`, `ch11aWin`, `ch11aFlat`, `ch11aHTML`, `tplNeed`, `tplReady`, `tplFind`, `tplDefaultGroup`, `tplPrint`, `tplPageHTML`, `tplFieldValue`, `DS.all/get/by/commit/need/newIds`.

### 9.3 Préfixes

- **Réservés** : fonctions `ch04a`, `ch04b`, `ch04c`, `ch04d` ; constantes `CH04A_` … `CH04D_` ; classes CSS `ch04a-` … `ch04d-` ; clés `ds_ch04c_bounds`, `ds_ch04d_fav` ; plus les deux noms imposés `ch04ImportVCards`, `ch04ImportContacts` (lot 1).
- **Vérification** (vérifié ici) : dans `DeltaSub.html` et `serveur_deltasub.py`, `ch04` n'apparaît que dans `ch04ImportVCards` et `ch04ImportContacts` (entrées de `CH10A_MENU`) ; dans `ch/*/` et `research/` hors CH-04, aucune déclaration `ch04*` / `CH04*` (seul un test de CH-10 déclare `const ch04ImportVCards=()=>"vcf"` dans une chaîne de `loadString`).
- **Noms exposés aux autres chantiers** (par `typeof`) : `ch04aExportVCards(contacts, nom)`, `ch04dLabels(contacts, o)`, `ch04dAdrList(type, contacts, o)`, `ch04dTpl(cat, type, project)`.

---

## 10. Plan en lots

**Taille totale : L.** Estimation : lot 1 ≈ 750 lignes + 3 lignes Python ; lot 2 ≈ 520 lignes ; lot 3 ≈ 560 lignes ; lot 4 ≈ 700 lignes + correctif Python (≈ 30 lignes).

La fiche prévoyait 6 lots (vCard ; CSV ; étiquettes ; modification groupée et bloc-notes ; fiches et annuaire ; collaborateurs). Regroupement retenu :
- les deux imports et l'export vCard, qui écrivent des adresses en masse et partagent les entrées du menu Fichier, forment le **lot 1**, avec la protection au ré-import (préalable à tout import) et les crochets des menus partagés ;
- tout ce qui touche la saisie d'une adresse (fenêtre, détail, modification groupée, annuaire, corrections d'affichage D3, D4) forme le **lot 2** ;
- les documents `.dpdoc`, la liste par entité / CFC et les collaborateurs (Participation, fiches) forment le **lot 3** ;
- les deux circuits des anciens modèles (étiquettes, assistant de listes), avec la correction du convertisseur et du choix de modèle, forment le **lot 4**.

Chaque lot livre, dans `ch/CH-04/lotN/` : `ch04x.js` (déclarations de haut niveau seulement), `build.py`, `lotN_integration.md`, les tests jsc, le `DeltaSub.html` construit pour l'essai ; au lot 1, la copie modifiée du serveur et son diff ; au lot 4, la copie modifiée de `convertir_modeles.py` et son diff.

### Lot 1 — Imports, export vCard, crochets de menus, protection au ré-import (préfixe `ch04a` / `CH04A_`)

- **Ancres** : A0, E1, E2, H1a, H1b, H2, H3, H4, H7, H10 ; serveur S1.
- **Contenu** :
  - serveur : deux lignes du § 3.4 (**intégrables seules, avant tout ré-import**) ;
  - menus : `ch04aMenu(où, ctx, base)` pur (§ 4.1 a, b, c, f, g ; droits par `ch08aCan` si présent), `ch04aBtn(où, ctx)` (bouton « Rapports » des collaborateurs, absent s'il est vide), `ch04aSel(st)` ;
  - vCard : `ch04ImportVCards` (entrée Fichier), `ch04aVcRead(fichier)`, `ch04aVcParse(texte)`, `ch04aVcDialog(liste, nom)`, `ch04aDup(nom, prénom)`, `ch04aPhone(valeur, pays)`, `ch04aCountry(nom)`, `ch04aPrefill(volet, owner, rel)` ;
  - export : `ch04aExportVCards(contacts, nom)`, `ch04aVCardText(c)`, `ch04aPhoneExp(c, n)`, `ch04aBytes(texte, jeu)` ;
  - CSV et `.archfile` : `ch04ImportContacts` (entrée Fichier), `ch04aSepGuess`, `ch04aCsvRead`, `ch04aField(ligne, i, max)`, `ch04aCsvRows(lignes, ctx)` et `ch04aAfRows(lignes, ctx)` purs → opérations, `ch04aInitName123(c, o, rel)`, `ch04aImportDlg(fichier, format)`.
- **Tests** : T0 à T11 ; essais B1 à B4 (port 8001).
- **Dépendances** : aucune. CH-08 (`ch08aCan`, `ch08cVcardCharset`), CH-10 (`ch10bOwnerName`, `ch10bDownload`, `ch10bCmpIC`) sont intégrés. **Préalable des lots 2, 3, 4** (crochets de menus).

### Lot 2 — Saisie et modification des adresses : Editer des adresses, bloc-notes, suggestions, annuaire et cartes, D3, D4, courriel (préfixe `ch04b` / `CH04B_`)

- **Ancres** : A0, L1 à L8.
- **Contenu** :
  - modification groupée : `ch04bBulk(contacts)`, `ch04bBulkModel(contacts)` pur (champs actifs, « - », groupes), `ch04bBulkOps(contacts, valeurs, bseqs)` pur, `ch04bConfirm(champs, n)` ;
  - fenêtre d'adresse : `ch04bField(input, k, ctx)`, `ch04bPad(body, isNew)`, `ch04bSuggest(k, ctx)` (§ 4.6), `ch04bPadLine`, `ch04bPadZip`, `ch04bPadPhone` purs ;
  - annuaire et cartes : `ch04bUrl(genre, x)` pur (§ 4.7), `ch04bDirMenu(c, n)`, `ch04bMapMenu(c)`, `ch04bMapBtn(c)`, `ch04bTel(c, n)`, `ch04bWheel(c)` (§ 4.1 i) ;
  - corrections D3, D4 (L7, L8), règle du courriel (L3).
- **Tests** : T0, T12 à T16 ; essais B5, B6 (port 8002).
- **Dépendances** : lot 1 (crochets H2, H4 pour « Editer des adresses … » ; `ch04aExportVCards` dans la roue du détail, par `typeof`). Lot 3 facultatif (« Fiche de l’adresse … » de la roue du détail, par `typeof`).

### Lot 3 — Documents `.dpdoc`, liste par entité / CFC, coordonnées bancaires, collaborateurs (préfixe `ch04c` / `CH04C_`)

- **Ancres** : A0, R1, R2, R3.
- **Contenu** :
  - formats : `ch04cF(type, objet)` pur (§ 5) ;
  - documents : `ch04cContactSheet(c)`, `ch04cOwnerSheet(e, masquées)`, `ch04cOwnerRows(e, masquées)` pur, `ch04cBankList(e)`, `ch04cBankRows(e)` pur, `ch04cStaffSheet(s)`, `ch04cStaffList(staffs)` ;
  - fenêtre : `ch04cByOwner(contacts)`, `ch04cByCfc(contacts)`, `ch04cByOwnerRows`, `ch04cByCfcRows` purs, `ch04cBkpSplit(bkp)` pur ;
  - Participation : `ch04cCle(CO)` (élément de la clé), `ch04cMembership(staff)`, `ch04cMemberRows(staff)` pur, `ch04cPrjPickMulti(exclus, fn)`, `ch04cMemberAddOps`, `ch04cMemberDelCheck`, `ch04cAttachOps(projets, staff)` purs.
- **Tests** : T0, T17 à T21 ; essais B7 à B9 (port 8003).
- **Dépendances** : lot 1 (crochets H1a/b, H7 pour Fiche de l’adresse, par entité / CFC, Fiche-collaborateur, Liste des collaborateurs). CH-01, CH-11, CH-03 intégrés.

### Lot 4 — Étiquettes et listes [Ancien document], convertisseur, choix du modèle déclaré (préfixe `ch04d` / `CH04D_`)

- **Ancres** : A0, P1, P2 ; Python C1.
- **Fichiers en plus** : `convertir_modeles.py` modifié (copie complète) + `convertir_modeles.diff` ; script d'essai qui reconvertit, **en lecture seule** depuis `/Volumes/SUBSTANCES/Deltaproject/DELTAprojectFiles/Templates/`, les familles `labelTemplates` et `addressTemplates` dans un JSON du dossier du lot, puis les écrit **dans la copie de base de l'essai seulement** (par `/api/commit` du serveur de la copie).
- **Contenu** :
  - choix du modèle déclaré : `ch04dTpl(cat, type, project)` (§ 4.13) et P1 (répare D1 tout de suite) ;
  - étiquettes : `ch04dLabels(contacts, o)`, `ch04dChooser(fn)`, `ch04dLabelCount(planche)`, `ch04dPages(N, n, copies, début)` pur, `ch04dFill(planche, contacts, p, réglages)` pur, `ch04dAddress(c)` pur, `ch04dSort(contacts, critère)` pur, `ch04dSettings(réglages, n, fn)`, `ch04dPmDocs(p, rows)` (P2) ;
  - assistant : `ch04dAdrList(type, contacts, o)`, `CH04D_TYPES`, `CH04D_DEFAULTS` (§ 4.12), `ch04dRows(type, contacts, réglages)` pur, `ch04dPrefs(type, réglages, fn)`, `ch04dFavs(type)`, `ch04dFavSave(type, liste)` ;
  - convertisseur : C1 (§ 9.2).
- **Tests** : T0, T22 à T26 ; essais B10 à B12 (port 8004).
- **Dépendances** : lot 1 (crochets H1a/b, H7). **Effet des étiquettes au bureau seulement après intégration du convertisseur corrigé et une reprise Deltaproject** (`importer_dans_deltasub.sh`), qui remplace les modèles non modifiés dans DeltaSub (`modele` est `PROTECTED_IF_EDITED`) ; sans reprise, « Etiquettes … » affiche « Ce modèle ne contient aucun champ d'étiquette. » sur les planches non converties, et la liste d'adresses fonctionne déjà (P1).

### Non livré (et pourquoi)

| Élément | Raison |
|---|---|
| « Etiquettes … » (nouveau circuit `.dpdoc`, « Choisir modèles d'étiquette », Style de texte) | aucun modèle d'étiquettes JSON au bureau ; modèles d'étiquettes = CH-12 (D-04-11) |
| « Liste d’adresses … » au nouveau format (`contactList`), `projectMemberList` | CH-09 lot 3 |
| Import CSV « avec mappage », « Définir comme standard » | n'existe pas en 16.05 (§ 1 n° 1) |
| « Valider les courriels » | présent (`mailList`) ; l'original ne contrôle pas la forme (§ 1 n° 9) |
| Lettres en série des groupes d'adresses | absentes en 16.05 ; messages brefs = CH-13 |
| Liste des banques [Ancien document] (`BankPreviewDialog`, `BankSettingsDialog`, favori `BankFavorite`) | ancien document secondaire, sans usage connu ; le document `.dpdoc` est livré (D-04-14) |
| Cadre `labelGrid` des planches (marges, espacements, mm) | inutile à l'impression (positions des champs) ; utile à l'éditeur d'étiquettes (CH-12) |
| Entrées « Etiquettes » et listes [Ancien document] des Soumissionnaires et Entrepreneurs | domaines d'EC-1 et CH-05 ; fonctions exposées (§ 9.3) |
| Types 2, 3/14, 5/10, 11, 9 de l'assistant dans leurs menus | CH-05, CH-09, EC-1, Management (fonction `ch04dAdrList` prête) |
| Présentations (5 jeux de colonnes) et « Afficher les adresses masquées » séparé dans Entités ▸ adresses | hors fiche ; E4 |
| « En tant que soumissionnaire » (Entités) | hors fiche (§ 8 n° 7) |
| Export iOS, vCard des collaborateurs | sans objet ; absent de l'original |

---

## 11. Décisions restantes pour Paulo

1. **D-04-0 Ré-import et saisies d'adresses (urgent).** Aujourd'hui, un ré-import Deltaproject efface les adresses, entités, comptes bancaires, propriétés, notes, groupes, intervenants et attributions d'activités créés ou modifiés dans DeltaSub (§ 0 n° 1). Par défaut : **protéger** ces collections comme les utilisateurs (CH-08), avec l'avertissement de collision d'identifiant, et **intégrer ces deux lignes de serveur avant le ré-import** prévu. Variante : différer le ré-import.
2. **D-04-1 Convertisseur des anciens modèles.** Par défaut : **corriger** `convertir_modeles.py` (lot 4) ; les étiquettes deviennent utilisables à la reprise suivante, qui recharge aussi les autres modèles cassés (§ 8 n° 3). La liste d'adresses est réparée tout de suite par le choix du modèle déclaré.
3. **D-04-2 Noms d'une adresse « Lier une entité » créée depuis une vCard** : l'original met la personne en ligne 1 et la société en ligne 2, à l'inverse de la saisie normale. Par défaut : **fidèle** (le dialogue reste modifiable avant d'enregistrer).
4. **D-04-3 Export vCard** : l'original met la rue dans le « complément » et la case postale dans la « rue », sans pays. Par défaut : **fidèle** ; variante : vCard corrigée pour Contacts / Outlook.
5. **D-04-4 Import `.archfile`** (DELTAbauad, jamais utilisé au bureau) : par défaut **livré** (coût faible).
6. **D-04-5 Statut dans « Editer des adresses »** : l'original ignore le statut choisi. Par défaut : **écrit**.
7. **D-04-6 Libellé** « Fiche de l’adresse … » à la place de « Liste adresses de l’entité … » dans le détail d'une adresse : par défaut **oui**.
8. **D-04-7 Favoris des listes [Ancien document]** : par défaut **par poste** (comme l'original et les Préférences) ; variante : par utilisateur en base.
9. **D-04-8 Import CSV** : troncature à « max − 1 » **reproduite** (compatibilité des fichiers) ; espace de « 12 de 100 » **rétablie**.
10. **D-04-9 Numéros « +41 (0)44 … »** de vCard : par défaut **corrigés** (« (0) » ignoré) ; indicatif enregistré « +41 ».
11. **D-04-10 Contrôle du courriel** : par défaut la règle de l'original `.+@.+\..+` (plus permissive : elle accepte l'adresse 4094 à deux @) ; variante : garder la règle stricte actuelle de DeltaSub.
12. **D-04-11 Étiquettes au nouveau format** : par défaut **après CH-12** (aucun modèle au bureau).
13. **D-04-12 Noms des entités dans les listes (D4)** : l'original n'affiche que le nom (`NAME1`) d'une société, d'une famille, d'une communauté ou d'une association ; DeltaSub y ajoute le complément. Par défaut : **fidèle** (le complément disparaît de la colonne « Entité » des listes d'adresses).
14. **D-04-13 Pays sur les adresses (D3)** : par défaut le pays standard des Paramètres système, au lieu de « CH » fixé.
15. **D-04-14 Liste des banques [Ancien document]** : par défaut **non livrée** (le document `.dpdoc` suffit).
16. **D-04-15 Participation d'un collaborateur sans employeur** (un collaborateur actif au bureau) : l'original crée une inscription sans entité. Par défaut **fidèle**.
17. **D-04-16 Protection des autres collections modifiées dans DeltaSub** (collaborateurs, tarifs, propriétés, activités… § 8 n° 2) : à confier à CH-05, CH-06 et CH-08 sur le même modèle ; par défaut **signalé**, non traité ici.

# Cahier des charges — CH-05 « Gestion de l'affaire : configurations, imports, Entrepreneurs et filtre » dans DeltaSub

Version du rédacteur critique, 01.10.2026. Ce cahier décrit comment reproduire dans `DeltaSub.html` les fonctions d'Affaires ▸ Gestion de Deltaproject 16.05 encore absentes ou partielles (`ProjectDefinitionFrame` et ses dialogues), le domaine d'affaire « Entrepreneurs » (`ProjectMemberRoleFrame`) et le filtre de « Toutes les affaires » (`ProjectFrame`). Il confronte les deux recherches du chantier (`ch/CH-05/rech_orig.md` sur l'original, `ch/CH-05/rech_exist.md` sur DeltaSub), la fiche CH-05 de l'inventaire et son § 16. Chaque point contesté a été revérifié à la source pour ce cahier ; deux affirmations des recherches sont **renversées** (§ 1, n° 5 et n° 9).

**Conventions**
- **[P] PROUVÉ** : bytecode `Classe.méthode@offset` (désassemblages dans `scratchpad/ch/CH-05/jp/` et `ch/CH-05/work/`), libellé `Strings.db (classe|id)`, données de la base de test `dstest/deltasub.sqlite` (copie fidèle de la base du bureau : 111 affaires, 1 324 intervenants, 37 622 heures).
- **[D] DÉDUIT** : interprétation cohérente, non démontrée ligne à ligne.
- **[C] CHOIX** : décision de conception pour DeltaSub, signalée à Paulo (§ 7 et § 11).

**Références DeltaSub.** `DeltaSub.html` du dépôt au 01.10.2026 : commit `9f184fe`, 21 887 lignes, md5 `df42ee3eaff3df24052b96479d7fd93e` (CH-17, CH-01, CH-02, CH-03, CH-08, CH-10 et CH-11 intégrés). D'autres chantiers de la vague 4 (CH-04, CH-06, CH-07, CH-09) sont écrits en parallèle : **seules les ancres textuelles du § 9 font foi**, les numéros de ligne sont indicatifs.

**Aucune donnée personnelle** : identifiants (ID), compteurs, codes et libellés d'interface seulement. **Aucun contenu CRB** : ni texte de position, ni catalogue ; seulement des noms de types, de colonnes et des comptages.

**Fichiers de vérification** : `ch/CH-05/jp/` (≈ 80 désassemblages), `ch/CH-05/work/jp_CostControlDialog.txt` et `work/jp_ProjectStaffActivitiesDialog.txt` (ajoutés pour ce cahier), `ch/CH-05/strings_ch05.txt`, `ch/CH-05/work/stats.py` et `stats_out.txt`.

---

## 0. Synthèse

1. **La Gestion n'a pas d'« Editer le filtre ».** Son bouton Filtre est un menu à **choix unique de 7 valeurs** (« Afficher tout », « Afficher les non archivées » par défaut, puis les 5 statuts), avec le nom du filtre affiché à côté du bouton. Le dialogue « Editer le filtre » (`mgPFdialog`, déjà dans DeltaSub) appartient à **Affaires ▸ Toutes les affaires**, où il manque : « Appliquer le filtre », « Editer le filtre … », étiquette « Filtré », défaut « En cours » (§ 4.2, § 4.3).
2. **La barre de la Gestion est remise à l'identique** : 5 menus dans l'ordre de l'original, toutes les entrées avec « … », droits par entrée, présentations « Abrégée » / « Standard » et les 9 colonnes de l'original (§ 4.1, § 4.2).
3. **Importer d'une affaire existante** (activités et tarifs) : dialogue à 3 options qui **remplace** la configuration de l'affaire ; refusé hors statut « Configuration » et dès qu'une heure est saisie. C'est le geste le plus utile du chantier : 90 des 107 affaires du bureau ont le même jeu d'activités, 92 des 98 le même jeu de tarifs, et aucune celui du dossier standard (§ 4.5).
4. **Intervenants** : édition des **groupes de rôles**, entrée « Attribuer les collaborateurs d'affaire … », import d'intervenants et suppression rendus fidèles (l'import ne copie que Architecte, Directeur des travaux et Collaborateurs, § 1 n° 9) (§ 4.9, § 4.10).
5. **Nouveau domaine d'affaire « Entrepreneurs »** (rôle 19 « Entreprises », 330 lignes dans 26 affaires) ; selon D5, « Liste d'adresses » quitte la liste des domaines et reste une impression du domaine Intervenants (§ 4.11).
6. **Plans comptables de l'affaire** : liste, création, import d'une autre affaire et du dossier standard, configuration et positions, suppression. **Débloque** les 67 affaires sans plan (dont 20 en cours) pour le Devis et la Soumission. Contenu CRB : rien dans le code ; les plans sous licence ne s'éditent pas et ne se copient que jusqu'au niveau 3 (§ 4.12).
7. **Subdivisions par affectations et par locaux** : deux écrans identiques Code / Désignation (§ 4.13).
8. **Importer des heures** (CSV, droit `admin`) : format de 13 colonnes, vérification ligne à ligne avec les messages de l'original, import en un seul enregistrement groupé (§ 4.14).
9. **Listes des affaires** : « Liste des affaires … » (nouveau document : la fenêtre ici, le document par CH-09) et « Liste des affaires … [Ancien document] » (assistant avec paramètres et favoris par poste) (§ 4.4, § 4.15).
10. **Dossier des modèles** (« Définir les modèles » complet, 3 sections) ; dossiers des documents externes et des enregistrements, **masqués au bureau** comme dans l'original (§ 4.16, § 4.17).
11. **Retirés du chantier** : « Rôle secondaire » (fonction de développement, invisible en 16.05), `SelectBkpLanguageDialog` (sans appelant), « CFC par chapitre » (EC-1), import en ligne CRB (§ 2.3).
12. **Plan : 4 lots** (§ 10). Lot 1 `ch05a` : Gestion, filtres, import d'activités et de tarifs, activités par collaborateur, cascade. Lot 2 `ch05b` : rôles, intervenants, Entrepreneurs. Lot 3 `ch05c` : plans comptables, affectations, locaux. Lot 4 `ch05d` : import d'heures, assistant « Liste des affaires », modèles et dossiers. **Aucune nouvelle collection, aucune modification du serveur.**

---

## 1. Arbitrages entre les sources (tranchés à la source)

| # | Sujet | Affirmations en présence | Verdict | Preuve |
|---|---|---|---|---|
| 1 | Filtre de la Gestion | « brancher `mgPFdialog` sur Gestion » (inventaire C7, § 16.4 n° 6) | **Faux.** Menu `JCheckBoxMenuItem` sur l'énumération `ProjectDefinitionFrame$ProjectFilter` (7 valeurs, choix unique) ; défaut `notArchived` | [P] `ProjectDefinitionFrame.addFilterPopupMenuItems@0-91`, `<init>@24`, `setProjectListTable@0-113` |
| 2 | Où sert « Editer le filtre » | Gestion (inventaire) | **Toutes les affaires** (`ProjectFrame`, bouton visible seulement pour `projectsAll`), Management, navigateurs Bâtiment | [P] `ProjectFrame.setModule@0-38`, `getFilterPopupMenu@0-108`, `ProjectFrame$4` |
| 3 | « Rôle secondaire » (A8) | navigateur à ajouter (critique A8) | **Sans objet** : visible seulement si `Version.isDevVersion()` (toujours faux, `versionType = standard`) et rôle « Autres » ; entité absente de `persistence.xml` et de la base | [P] `ProjectMemberDialog.checkVisibleComponents@11-29`, `jOkButtonActionPerformed@17-61` |
| 4 | « Attribuer les collaborateurs d'affaire » | « variante filtrée » (§ 16.4) | **Même dialogue** « Définir les intervenants », la ligne « Collaborateurs » **présélectionnée**. Sans paramètre (« Attribuer les intervenants »), **aucune ligne n'est présélectionnée** ; DeltaSub présélectionne toujours 12 | [P] `ProjectTeamDialog.<init>@234-310`, `setProjectMemberRoleTable` (pas de sélection) ; DeltaSub `cfgMembers` `if(oR.sel==null) oR.sel='12'` |
| 5 | Message de statut de l'import d'activités et de tarifs | `msg1a/b` du dialogue, 'Configuration' entre apostrophes droites (`rech_exist` § 1.5) | **`rsrc` `msgProjectIsNotInitializing0/1`** : « Cette fonction n'est disponible que » ⏎ « si le statut de l'affaire est «Configuration». » ; `msg1a/b` est mort | [P] `ProjectImportFromProjectDialog.openDialog@14-25` |
| 6 | Refus « heures déjà comptabilisées » | seulement si les activités sont remplacées (`rech_exist` V3) | **Avant l'ouverture**, quelle que soit l'option : `TimeLog.getTimeLogCount(affaire) > 0` → « Le remplacement n'est pas possible, » ⏎ « car des heures ont déjà été comptabilisés. » | [P] `ProjectImportFromProjectDialog.openDialog@31-78` |
| 7 | Point d'entrée de l'import d'une autre affaire | Gestion (fiche) | Menu `+` de **Configurer les activités** (actif seulement si l'affaire n'a **aucun groupe**) et de **Configurer les tarifs** (toujours actif) | [P] `ProjectActivitiesDialog.addNewPopupMenuItems@0-151`, `ProjectRatesDialog.addNewPopupMenuItems@100-157` |
| 8 | Statut des imports du dossier standard | non contrôlé dans DeltaSub (spec_13 § 8 n° 4) | Activités : **refus** `msgProjectIsNotInitializing` hors « Configuration ». Tarifs : entrée **grisée** sauf statut « Configuration » **et** aucun tarif | [P] `ProjectActivitiesDialog.importFromAdmin@0-54` ; `ProjectRatesDialog.addNewPopupMenuItems@0-25, @105-106` |
| 9 | Rôles copiés par « Importer les intervenants d'une affaire existante » | « visibles et **différents** de Architecte, Directeur des travaux et Collaborateurs » (`rech_orig` § 5.2) | **L'inverse** : seulement les rôles visibles **égaux** à Architecte (1), Directeur des travaux (2) ou Collaborateurs (12). Champs copiés : rôle, entité, responsable, domaine spécialisé, fonction | [P] `TeamRole.isImportable@0-33` (`if_acmpeq 28` → vrai) ; `ProjectMemberDialog.importProjectMembers@27-151` |
| 10 | Activation de cet import | toujours (DeltaSub) | Seulement si l'affaire **n'a aucun intervenant** | [P] `ProjectTeamDialog.checkGuards@280-288` |
| 11 | Suppression d'un intervenant | confirmation simple (DeltaSub) | (1) intégrité : aucun document d'affaire avec `RESPONSIBLEMEMBER_ID` = l'intervenant, sinon « Cette inscription est déjà utilisée et » ⏎ « ne peut pas être supprimée. » ; (2) statut « Configuration », sinon `msgProjectIsNotInitializing` ; (3) « Voulez-vous vraiment supprimer cette inscription ? » (Avertissement, Oui / Non) | [P] `ProjectMemberDialog.deleteProjectMember@28-124` ; `db.Integrity.isProjectMemberDeletable` (`ProjectDocument.getProjectDocumentCount`) ; schéma `PROJECTDOCUMENT.RESPONSIBLEMEMBER_ID` |
| 12 | `SelectBkpLanguageDialog`, « CFC par chapitre » | à faire (fiche) | **Morts ou hors chantier** : aucun appelant ; « Editer le CFC par chapitre » relève du descriptif de la Soumission (EC-1) | [P] recherche binaire (`rech_orig` § 6.4) |
| 13 | Catalogues proposés par « Importer … du dossier standard » | « catalogues standard visibles » (`rech_orig` § 6.2) | **Tous les catalogues** (`Catalog.findAll`, tri `SORTORDER`), les masqués **estompés** ; au bureau 8 dont 2 non masqués (CFC 101, eCCC-Bâtiment 111) | [P] `CatalogBrowserDialog.setCatalogTable@4` → `Catalog.getCatalogs` = `SELECT c FROM Catalog c ORDER BY c.sortOrder`, `FadingCellRenderer` |
| 14 | Colonne « Type » des plans comptables | — | **Nom de l'énumération** (`BKP`, `SKP`, `MKP`, `eBKP_H`, `eBKP_T`, `eBKP_S`, `eBKP_Gate`), sans libellé traduit ; « Langue » = Deutsch / Français / Italiano / English | [P] `ProjectCatalogTableModel.getValueAt@43` ; `ProjectCatalog$CatalogType` sans `toString` ; `DocumentLanguages$Language.toString` |
| 15 | Copie d'un plan d'une autre affaire | — | L'original copie **tout** (positions, `UNIT`, `HINT`), **sans contrôle de licence**. DeltaSub [C] : copie intégrale pour un plan sans licence ; pour un plan sous licence, positions ≤ 1 point sans `HINT` (règle de spec_12 § 1.4) | [P] `ProjectCatalogsDialog.importFromProject@6-246` ; [C] § 7 E9 |
| 16 | Libellés du menu Documents d'Entrepreneurs | « Liste par rôle et CFC … » | Avec sélection : « Liste par rôle et CFC **pour la sélection** … » (`selectedEntriesOnly`, recette `\u0001 \u0001`, puis « … ») ; ancien : « Liste par rôle et CFC … [Ancien document] » | [P] `Rsrc.mapStringWithEllipsisAndCheckSelection@7-24` ; `ProjectMemberRoleFrame.getReportsPopupMenu@44-277` ; `Strings.db (Strings|selectedEntriesOnly)` |
| 17 | D5 | « remplacer » (`rech_orig` § 5.6) ; « garder le domaine et ajouter » (CH-04 `rech_exist` l. 39) | Décision arrêtée : « garder « Liste d'adresses » **comme impression** du domaine Intervenants et AJOUTER le domaine Entrepreneurs ». Lecture retenue [C] : le **domaine** « Liste d'adresses » quitte `DOMAINS` ; ses deux impressions restent dans Intervenants ▸ Documents ; « Entrepreneurs » prend la 3ᵉ place (§ 11 n° 1) | `vague4.json` ; [P] l'original n'ajoute jamais `contacts` (`ProjectFrame.setMenuTable@37-50`) |
| 18 | Inscription automatique des entreprises en rôle 19 | « CH-05 ou CH-07 » (spec_14 § 9 n° 3) | Faite par le **contrôle des coûts** à l'enregistrement ou à la fermeture du document (`matchEnterpriseList` → `setProjectRole`) : relève de **CH-07** | [P] `costcontrol.CostControlDialog.setProjectRole@0-392`, appelants `saveDocument`, `doQuit`, `jCloseMenuItemActionPerformed` |
| 19 | Colonnes de la Gestion | 8 colonnes DeltaSub (ordre propre, pas de « Tri ») | **9 colonnes** : Numéro \| Affaire \| Maître d'ouvrage \| Statut \| Début \| Fin \| Phase en cours \| Tri \| Actif ; « Abrégée » (masque `110111001`) = Numéro, Affaire, Statut, Début, Fin, Actif | [P] `db.ProjectTableModel.<clinit>` ; `ProjectTableModel$TableType` (`standard` = « Abrégée », `all` = « Standard ») |
| 20 | « Attribuer les activités aux collaborateurs » | ouvre `cfgActivities` (DeltaSub, menu Intervenants) | Dialogue propre `ProjectStaffActivitiesDialog`, vue **par collaborateur**, dans le menu **Paramètres** | [P] `ProjectDefinitionFrame.addProjectSettingsPopupMenuItems` ; `work/jp_ProjectStaffActivitiesDialog.txt` |
| 21 | Favoris de l'assistant « Liste des affaires » | collection serveur ou `localStorage` (`rech_exist` § 6 n° 3) | **Un seul jeu** de réglages, fichier XML dans le dossier de préférences **du poste** → DeltaSub `localStorage` [C, fidèle] | [P] `list.Favorites` (`XMLEncoder`, `projectListFavorites.xml`) |
| 22 | Dossiers des documents externes et des enregistrements | partiels (DeltaSub ouvre la fiche affaire) | **Masqués** si `isProjectMenuFilesVisible` = NON (**bureau : NON**) ; le panneau « Modèles externes » est alors grisé | [P] `ProjectDefinitionFrame.addProjectFilesSettingsPopupMenuItems@0-189` ; base de test `setting` `[NO]` |
| 23 | Format de l'import d'heures | 15 colonnes (spec_2 § 10.6) | **13 champs lus** (§ 4.14.4) ; le tableau d'information a 15 colonnes (Ligne et Info en plus) | [P] `ImportTimeLogsDialog.validateTimeLogs@0-1543`, `ImportTimeLogsTableModel` |

---

## 2. Périmètre

### 2.1 Reproduit (fidèle)

- Affaires ▸ Gestion : barre, 5 menus déroulants, droits par entrée, filtre à 7 valeurs avec son étiquette, présentations « Abrégée » / « Standard », 9 colonnes, compteur « n Affaire(s) ».
- Affaires ▸ Toutes les affaires : bouton Filtre (« Appliquer le filtre », « Editer le filtre … ») et étiquette « Filtré » ; défaut « En cours ».
- « Liste des affaires … » : fenêtre de choix des affaires (`ProjectListDialog`).
- « Importer d'une affaire existante … » (activités et tarifs), contrôles de statut des imports du dossier standard et des suppressions dans « Configurer les activités ».
- « Attribuer les activités aux collaborateurs … » (`ProjectStaffActivitiesDialog`).
- Groupes de rôles (liste, édition, import) ; « Attribuer les collaborateurs d'affaire … » ; import et suppression d'intervenants selon l'original.
- Domaine d'affaire « Entrepreneurs » (barre, menus, colonnes, règles).
- Plans comptables de l'affaire ; subdivisions par affectations et par locaux.
- Importer des heures (CSV).
- « Liste des affaires … [Ancien document] » : assistant (paramètres, favoris, aperçu, impression).
- « Dossier des modèles … » (« Définir les modèles », 3 sections) ; « Dossier des documents externes … » et « Dossier enregistrements des documents … » derrière le réglage `isProjectMenuFilesVisible`.
- Suppression d'une affaire : cascade des configurations orphelines (spec_13 § 8 n° 3).

### 2.2 Choix DeltaSub (arrêtés ou par défaut)

- **Navigation entre lots** : le lot 1 construit tous les menus de la Gestion ; une entrée dont la fonction appartient à un lot non encore intégré est **grisée** (infobulle « CH-05 lot n »), selon la convention des entrées « CH-xx » de CH-10.
- **Documents au nouveau format** : la fenêtre et les données sont faites ici ; le remplissage `.dpdoc` (`projectList`, `projectMemberList`) appartient à CH-09 et est appelé par une **interface nommée** (§ 5.1). Sans CH-09, l'entrée est grisée.
- **Plans sous licence** : non éditables (« Pas de licence disponible. ») ; copie limitée aux positions ≤ 1 point sans `HINT` (§ 1 n° 15, § 11 n° 3).
- **Dossiers** : chemins enregistrés comme texte ; « Afficher le dossier » copie le chemin dans le presse-papier (un navigateur n'ouvre pas un dossier local).

### 2.3 Hors périmètre

| Élément | Raison |
|---|---|
| « Rôle secondaire » (`ProjectMemberMinorRolesDialog`) | invisible en 16.05 (§ 1 n° 3) |
| `SelectBkpLanguageDialog` (« Importer au format CRB / texte … ») | aucun appelant (§ 1 n° 12) |
| « Editer le CFC par chapitre » | descriptif de la Soumission : EC-1 |
| « Importer le nouveau plan comptable CFC / eCCC online » (`ImportCatalogDialog`) | service et contenu CRB sous licence ; entrées affichées **grisées** |
| Niveaux eCCC 4 et 5, `HINT` | contenu CRB (spec_12 § 1.4) |
| Inscription automatique en rôle 19 depuis le contrôle des coûts | CH-07 (§ 1 n° 18) |
| Remplissage des documents `.dpdoc` `projectList` et `projectMemberList` | CH-09 |
| Étiquettes, export vCard, assistant « Liste d'adresses » (type 11) | CH-04 (appelés par `typeof`) |
| Configurer les frais | CH-17 (livré) |
| Ordre des rôles par affaire (`ROLELISTSORTCODE`, « L'ordre par défaut ») | hors fiche, jamais utilisé au bureau (0 affaire) ; § 8 |

### 2.4 Place et accès

- **Affaires ▸ Gestion** (`VIEWS['aff-gestion']`) : tout ce qui est dans les menus (§ 4.1).
- **Affaires ▸ Toutes les affaires** (`affNav(false)`) : filtre ; « Mes affaires » n'a pas de filtre [P].
- **Domaine d'affaire « Entrepreneurs »** dans Mes affaires et Toutes les affaires ; droit `projectContacts` déjà déclaré par CH-08 (`CH08B_DOM`).
- **Droits** : chaque entrée de menu créée par CH-05 interroge `ch08aCan(clé)` (si `typeof ch08aCan==='function'`, sinon autorisée) ; la règle de l'original est « entrée absente sans le droit » (`m`) dans les menus Paramètres et Subdivisions, « bouton grisé » (`g`) pour les boutons de la barre. Les gardes par libellé de CH-08 (`CH08B_GUARDS`) pour les boutons (« Intervenants », « Configuration », « Subdivisions », « Modèles et documents externes ») restent valables : CH-05 **ne change pas** ces libellés de boutons.

---

## 3. Modèle de données

### 3.1 Collections (aucune nouvelle collection)

| Collection | Champs écrits | Lot | Remarques |
|---|---|---|---|
| `projectactivitygroup`, `projectactivity`, `projectactivity_staff` | `SORTORDER`, `NAMEGE/FR/IT/EN`, `TYPECODE`, `PROJECTRATEGROUP_ID` ; lien `{PROJECTACTIVITY_ID, STAFFS_ID}`, id `«activité»-«collaborateur»` | 1 | prévisions (`TIMEBUDGET`, `TIMEAMOUNTBUDGET`) jamais copiées : 0 |
| `projectrategroup`, `projectrate` | `SORTORDER`, 4 noms ; `RATE`, `VALIDFROM` | 1 | |
| `projectmemberrolegroup` | `NAME` (64 saisis, 255 en base), `SORTORDER` 1..n, `TEAMROLECODES` | 2 | format `code,` répété, **virgule finale** (`"1,"`, `"1,8,"`) |
| `projectmember` | `TEAMROLECODE`, `CONTACT_ID`, `RESPCONTACT_ID`, `PROJECTDIVISION`, `PROJECTROLE`, `BKP`, `NOTE`, `ISHIDDEN`, `SORTORDER` | 2 | rôle 19 = Entreprises, 12 = Collaborateurs |
| `projectcatalog`, `projectcatalogpos` | `NAME` (32), `TITLE` (255), `CATALOGTYPECODE`, `LANGUAGECODE` (1 de, 2 fr, 3 it, 4 en), `VERSION`, `ISLICENCEREQUIRED` ; `CODE`, `TEXT1`, `TEXT2`, `UNIT`, `HINT` | 3 | `projectcatalogpos` est dans `HEAVY` : `DS.need(['projectcatalog','projectcatalogpos'])` avant toute lecture ; **au plus un plan de catégorie CFC (types 0-2) et un de catégorie eCCC (types 10-20) par affaire** (tous les lecteurs prennent le premier par `find`) |
| `projectusezone`, `projectroom` | `CODE` (6 saisis, 16 en base), `NAME` (30 saisis, 64 en base), `SORTORDER` 1..n | 3 | `DS.need` avant lecture, comme la Soumission |
| `timelog` | mêmes champs que `hsEdit.save` : `STAFF_ID`, `TIMEYEAR`, `TIMEMONTH` (**0 à 11**), `TIMEDAY`, `TIMEHOUR1/2`, `TIMEMINUTE1/2`, `TIMEPERIOD` (h décimales), `ISHOLIDAY`, `PROJECT_ID`, `ACTIVITYGROUP_ID`, `ACTIVITY_ID`, `SUBPROJECT_ID`, `PHASE_ID`, `SUBPHASE_ID`, `DESCRIPTION`, `ISCHARGEABLE`, `ISCHARGED`, `CHARGEDDATE` (null), `TIMELOGSTATECODE` 0 | 4 | une ligne « vacances » n'a ni affaire, ni activité, ni phase |
| `project` | `DOCTEMPLATEGROUPNAME`, `TEMPLATEGROUPNAME`, `PROJECTFOLDER`, `ISPATHTOPROJECTDOCUMENTSRELATIVE`, `PATHTOPROJECTDOCUMENTS` | 4 | `DOCTEMPLATEGROUPNAME` null = jeu par défaut (socle CH-01) |
| `projecttemplategroup`, `projectfolder` | `NOTE`, `SORTORDER`, `TEMPLATEGROUP_ID` ; `DIRECTORYNAME`, `NAME`, `ISHIDDEN`, `SORTORDER` | 4 | écrans masqués au bureau |

Lus sans écriture : `activitygroup`, `activity`, `rate` (dossier standard), `catalog`, `catalogpos`, `doctemplategroup`, `templategroup`, `modelegroupe` / `modele` (anciens modèles), `staff`, `contact`, `setting`, `projectdocument` (intégrité, si la collection existe).

### 3.2 Ordre (`SORTORDER`)

Groupes de rôles, affectations, locaux, modèles externes, sous-dossiers : ajout en fin (`n + 1`), `<` / `>` = ±2 puis tri stable et **renumérotation 1..n**, `|<` = 0, `>|` = n + 1 [P : `ProjectMemberRoleGroupTableModel.add`, `sort@0-49`]. Réutiliser `ctReorder` / `ctMoveRec` / `ctMoveBtns` et `ch17aSort` / `ch17aRenum` ; un déplacement = un `DS.commit` des seules lignes changées.

### 3.3 Écritures groupées et concurrence

- **Un seul `DS.commit` par action** (import, OK d'un dialogue, suppression, déplacement), opérations `{t,id,val,bseq}`.
- `bseq` lu **à l'ouverture** des dialogues d'édition (`ch17aBseq`) ; conflit 409 → message de `DS.commit`, panneaux redessinés avec la version à jour (`ch17aSave(ops,after)`), dialogue laissé ouvert.
- Imports qui **remplacent** (activités et tarifs) : les suppressions et les créations forment **un seul lot atomique**, comme la transaction de l'original. Les `bseq` des lignes supprimées sont ceux du cache au moment du clic sur « Importer ».
- Import d'heures : un seul lot (au bureau, une affaire compte au plus quelques milliers d'heures ; le serveur n'impose pas de taille maximale).

### 3.4 Statut « Configuration » (statut 1)

Exigé [P] pour : import d'activités et de tarifs d'une autre affaire ; import d'activités du dossier standard ; activation de l'import de tarifs du dossier standard ; suppression d'un groupe d'activités, d'une activité, d'un collaborateur d'une activité (dans les deux sens) ; suppression d'un intervenant (toutes les fenêtres) ; suppression d'un plan comptable, d'une affectation, d'un local. Message : `CH17A_MSG.notInit` (titre « Information »). Le statut est **relu au moment de l'action** (`ch17aState(p)`). Au bureau, **une seule affaire** est au statut 1 (ID 701) : voir § 11 n° 2.

### 3.5 Serveur et reprise Deltaproject

Aucune modification de `serveur_deltasub.py`. Toutes les collections écrites existent dans Derby : une reprise `--force` remplace par les données de Deltaproject les configurations faites dans DeltaSub (groupes de rôles, plans, affectations, locaux, activités et tarifs importés, heures importées), **comme aujourd'hui pour toutes les configurations et pour les heures**. Les favoris de l'assistant sont dans `localStorage` (non touchés). Voir § 11 n° 4.

---

## 4. Écrans et dialogues

### 4.1 Gestion : barre et menus (lot 1)

Ordre des boutons inchangé dans DeltaSub (Nouvelle affaire, Editer l'affaire, Supprimer l'affaire, Intervenants, Configuration, Subdivisions, Modèles et documents externes, Documents, Fonctions, Filtre, recherche). Chaque menu est construit par une fonction `ch05a…` ; `sel` = une affaire sélectionnée (règle `getSelectedRowCount() == 1` de l'original : chaque entrée des menus Paramètres, Subdivisions et Modèles est **grisée** sans sélection) ; « droit » = entrée **absente** sans le droit.

| Menu (bouton DeltaSub) | Entrées, dans l'ordre (libellés exacts) | Droit | Cible |
|---|---|---|---|
| Intervenants | « Attribuer les collaborateurs d'affaire … » | `projectTeam` | `cfgMembers(p,12)` (lot 2 ; sans lot 2 : `cfgMembers(p)`) |
| | « Attribuer les intervenants … » | `projectTeam` | `cfgMembers(p)` |
| | séparateur, « Groupes de rôles … » | `projectTeam` | `ch05bRoleGroups(p)` (lot 2) |
| Configuration (« Paramètres ») | « Configurer les phases … » | `projectPhases` | `cfgPhases` |
| | « Configurer les tarifs de facturation … » | `projectRates` | `cfgRates` |
| | « Configurer les activités … » | `projectActivities` | `cfgActivities` |
| | « Attribuer les activités aux collaborateurs … » | `projectActivities` | `ch05aStaffActs(p)` (§ 4.7) |
| | « Configurer les frais … » | `projectCosts` | `ch17aOpen` |
| | « Configurer les séances … », « Configurer les types de plans … », « Configurer la nomenclature des plans … » | `projectMeetings`, `projectPlans` | absentes de DeltaSub aujourd'hui (aucun écran) ; table `CH05A_MORE` = `[[libellé, droit, nom de fonction]]`, **vide par défaut** : une entrée n'apparaît que si la fonction nommée existe (`typeof globalThis[nom]`), pour que les chantiers des séances et des plans s'y branchent sans ancre |
| | séparateur, « Importer des heures … » | `admin` | `ch05dImportTimes(p)` (lot 4) |
| Subdivisions | « Configurer la subdivision par ouvrages et localisations … » | `projectSubProjects` | `cfgSubprojects` |
| | « Configurer les plans comptables … » | `projectBkp` | `ch05cCatalogs(p)` (lot 3) |
| | « Configurer la subdivision par affectations … » | `projectUseZones` | `ch05cZones(p,'projectusezone')` (lot 3) |
| | « Configurer la subdivision par locaux … » | `projectRooms` | `ch05cZones(p,'projectroom')` (lot 3) |
| Modèles et documents externes | « Dossier des modèles … » | `projectFiles` (bouton) | `ch05dTemplates(p)` (lot 4 ; sans lot 4 : `defineTemplates`) |
| | « Dossier des documents externes … » | idem, **et** réglage `isProjectMenuFilesVisible` = `[YES]` | `ch05dFiles(p)` (lot 4) |
| | « Dossier enregistrements des documents … » | idem | `ch05dFolders(p)` (lot 4) |
| Documents | « Liste des affaires … » | — | `ch05aListDlg()` (§ 4.4) |
| | si `isModuleFormVisible` (bureau : `[YES]`) : séparateur, « Liste des affaires … [Ancien document] » | — | `ch05dListWizard(AF.g.view)` (lot 4 ; sans lot 4 : `printProjects(AF.g.view)`) |
| Fonctions (roue) | « Copier le contenu du tableau dans le presse-papier », « Exporter le tableau dans un fichier CSV … », séparateur, cases exclusives « Abrégée » / « Standard » | — | `copyTable`, `csvTable` ; présentation § 4.2 |
| Filtre | 7 cases exclusives (§ 4.2) | — | — |

- Les entrées du menu Intervenants n'ont pas de règle de sélection propre dans l'original (elles suivent le bouton) ; DeltaSub garde `need(…)` (toast « Sélectionnez une affaire. »).
- « Attribuer les activités aux collaborateurs » **quitte** le menu Intervenants [P].
- Les libellés « Définir les modèles … » et « Liste des affaires » (sans « … ») disparaissent.

### 4.2 Gestion : filtre, présentation, colonnes, compteur (lot 1)

- **Filtre** (choix unique, case cochée sur la valeur courante) : « Afficher tout » (toutes) · « Afficher les non archivées » (**défaut**, statut ≠ 5) · « Configuration » · « En cours » · « En attente » · « Terminée » · « Archivée » (statut égal). Un clic recharge la liste et met **le nom du filtre** dans une étiquette à droite du bouton (créée par `ch05aGLabel(head)`). Valeur gardée pour la session (`AF.f`), non mémorisée entre deux ouvertures de DeltaSub, comme l'original [P : `<init>@24`].
- La case « Afficher les non archivées » de la roue et les choix DeltaSub « Affaires internes » / « Affaires externes » sont **retirés** (fidélité, § 11 n° 5) ; la clé `localStorage` `ds_af_arch` n'est plus lue.
- **Colonnes** (`ch05aGCols()`) : Numéro | Affaire | Maître d'ouvrage | Statut | Début | Fin | Phase en cours | Tri (`SORTLABEL`) | Actif (✔ / ✕). Présentation « Abrégée » : Numéro, Affaire, Statut, Début, Fin, Actif. Défaut « Standard » ; choix mémorisé par poste (`localStorage` `ds_ch05_gtype`, `'all'` / `'standard'`, lecture et écriture sous `try`).
- **Compteur** : « 1 Affaire » / « n Affaires » (`projectDesc` / `projectsDesc`) ; recherche texte inchangée.

### 4.3 Toutes les affaires : filtre (lot 1)

- Bouton Filtre (icône `filter`) dans l'en-tête de la liste des affaires **de « Toutes les affaires » seulement** ; étiquette « Filtré » à droite, visible quand le filtre est appliqué.
- Menu : « Appliquer le filtre » (case cochée si appliqué ; **grisée si le filtre n'a aucun critère**, `mpPFcrit`) · séparateur · « Editer le filtre … » (`mgPFdialog`, inchangé). Pas d'« Annuler la sélection » (propre au Management).
- Filtre `AM.pf = mgPF()` (appliqué, statut « En cours »), gardé pour la session ; liste = `mgPFlist(AM.pf)` (si appliqué et statut choisi : ce statut ; sinon tous sauf Configuration et Archivée ; puis interne / externe, groupe, genre ; tri `SORTLABEL`, `NUMBER`), plus l'affaire passée en argument de navigation si elle n'y est pas (comportement DeltaSub conservé).
- Tri d'affichage de la grille inchangé (Numéro décroissant), la grille restant triable par en-tête.

### 4.4 « Liste des affaires … » (`ch05aListDlg`, lot 1)

- Dialogue **« Liste des affaires »**, largeur minimale 800 px, bouton « Fermer ».
- Barre : **Documents ▾** avec une entrée « Afficher le rapport … » (ou « Afficher le rapport pour la sélection … » si des lignes sont sélectionnées) ; **Filtre ▾** = le menu à 7 valeurs du § 4.2, propre à ce dialogue, défaut « Afficher les non archivées », avec son étiquette.
- Tableau : les 9 colonnes du § 4.2 (présentation Standard), affaires inactives (`!projActive(p)`) **estompées** (opacité 0,49), sélection multiple (`multi:true`).
- « Afficher le rapport … » : affaires = **sélection, sinon toutes les lignes** dans l'ordre affiché ; appelle `ch05aDoc('projectList',{projects, filterDesc})` (§ 5.1) avec `filterDesc` = libellé du filtre. Entrée **grisée** si aucune fonction de CH-09 n'est trouvée (infobulle « Document au nouveau format : CH-09 »).

### 4.5 « Importer d'une affaire existante … » : activités et tarifs (lot 1)

**Points d'entrée** (remplacement des menus `+` existants) :
- Configurer les activités, `+` : « Nouveau … » (ancien « Ajouter un groupe d'activités »), « Importer du dossier standard … », « Importer d'une affaire existante … » (**grisé** si l'affaire a au moins un groupe d'activités).
- Configurer les tarifs de facturation, `+` : « Nouveau tarif … », « Nouveau tarif de facturation (taux daté) » (ajout DeltaSub conservé), « Importer du dossier standard … » (**grisé** sauf statut 1 **et** aucun niveau de tarif), « Importer d'une affaire existante … » (toujours actif).
- Après l'import, la fenêtre appelante se redessine.

**Contrôles avant ouverture** (`ch05aImpOpen(p,after)`, dans cet ordre) :
1. statut ≠ 1 → « Information » : `CH17A_MSG.notInit` ;
2. au moins une heure dans l'affaire (`DS.by('timelog','PROJECT_ID',p.ID).length>0`) → « Information » : « Le remplacement n'est pas possible, » ⏎ « car des heures ont déjà été comptabilisés. » (coquille d'origine « comptabilisés » conservée) ;
3. sinon le dialogue.

**Dialogue** « Importer les activités ainsi que les tarifs de facturation » (≈ 420 px) :
- trois boutons radio exclusifs, **aucun coché** à l'ouverture : « Importer les activités ainsi que les tarifs de facturation. » · « Importer seulement les tarifs de facturation. » · « Importer seulement les activités. » ;
- texte : « Les activités et/ou les tarifs de facturation précédents seront remplacés. » ;
- boutons « Annuler » et « Importer » (principal, **grisé** tant qu'aucune option n'est cochée).

**Import** : « Importer » ferme le dialogue, puis `ch17aPrjPick(p, src=>…)` (« Choix de l'affaire », toutes les affaires sauf la courante) ; Annuler → rien. Opérations (fonction pure `ch05aImpOps(D, pid, srcId, opt, ids)`, `opt = {rates, acts}`) :
- **tarifs** : suppression de tous les `projectrategroup` de l'affaire et de leurs `projectrate` ; pour chaque groupe de la source (tri `SORTORDER`) : nouveau groupe (`SORTORDER`, 4 noms), puis pour chaque taux : nouveau taux (`RATE`, `VALIDFROM`) ;
- **activités** : suppression de tous les `projectactivitygroup`, de leurs `projectactivity` et des `projectactivity_staff` de ces activités ; pour chaque groupe source : nouveau groupe (`SORTORDER`, 4 noms, prévisions à 0) ; pour chaque activité : nouvelle activité (`SORTORDER`, 4 noms, `TYPECODE`, prévisions à 0) et **les mêmes collaborateurs autorisés** (`projectactivity_staff` recopiés) ;
- **lien de tarif d'une activité** : si les tarifs sont aussi importés, `PROJECTRATEGROUP_ID` = nouveau groupe de tarifs **de même nom français non vide** que le groupe source ; sinon (activités seules) **null** [P] ;
- **tarifs seuls** [C] : les activités gardées sont rattachées au nouveau groupe de même nom, sinon `PROJECTRATEGROUP_ID` = null (l'original laisse un lien vers un groupe supprimé, § 7 E3) ;
- un seul `DS.commit` ; toast « Activités et tarifs importés. » / « Tarifs importés. » / « Activités importées. ».

### 4.6 Contrôles de statut de « Configurer les activités » (lot 1)

Remplacements minimes dans `cfgActivities` et `importStdActivities` [P § 1 n° 8] :
- « Importer du dossier standard … » (activités) : statut ≠ 1 → `CH17A_MSG.notInit`, rien d'importé ;
- suppression d'un groupe d'activités ou d'une activité : statut ≠ 1 → message **avant** les contrôles existants (heures, honoraires) ;
- « Supprimer un collaborateur » : statut ≠ 1 → message ; sinon confirmation « Voulez-vous vraiment supprimer ce collaborateur ? » (Avertissement, Oui / Non ; `ProjectActivitiesDialog|msg4`).

### 4.7 « Attribuer les activités aux collaborateurs … » (`ch05aStaffActs`, lot 1)

- Dialogue **« Attribuer les activités aux collaborateurs »**, bouton « Fermer ».
- Gauche : collaborateurs **actifs** de l'affaire (`staff.ISACTIVE` et intervenant « Collaborateurs » de l'affaire, `RESPCONTACT_ID` = `PERSON_ID`) [D : `Staff.getActiveStaffListByProject`], ordre `staffList`, colonne « Collaborateur ».
- Droite : activités attribuées au collaborateur choisi, colonnes « Groupe d'activités » | « Activité » (ordre des groupes puis des activités), sélection multiple.
- `+ ▾` (actif si un collaborateur est choisi) : « Ajouter des activités … » (navigateur « Choisir les activités », activités de l'affaire **non encore attribuées**, choix multiple) · « Ajouter toutes les activités ».
- `− ▾` (actif si un collaborateur est choisi et la liste non vide) : « Supprimer des activités » (actif si une sélection) · « Supprimer toutes les activités ». Statut ≠ 1 → `CH17A_MSG.notInit` ; puis « Voulez-vous vraiment supprimer cette inscription ? » (une ligne) ou « Voulez-vous tout effacer ? » (plusieurs), Avertissement, Oui / Non.
- Écritures : `projectactivity_staff` (id `act-staff`), un `DS.commit` par action, sans doublon.

### 4.8 Suppression d'une affaire : cascade (lot 1)

`ch05aDelOps(p,ops)` (asynchrone : `await DS.need(['projectcatalog','projectcatalogpos'])`) ajoute à `delProject` la suppression de : `projectactivity` des groupes supprimés et leurs `projectactivity_staff` ; `projectrate` des groupes de tarifs ; `projectsubphase` des phases ; `project_projectkind` ; `projectmemberrolegroup` ; `projectcatalog` et `projectcatalogpos` ; `projectusezone` ; `projectroom` ; `projecttemplategroup` ; `projectfolder` ; `projectnote` [D : compositions JPA de l'affaire]. Les contrôles bloquants de `delProject` sont inchangés.

### 4.9 Groupes de rôles (lot 2)

**Liste** (`ch05bRoleGroups(p)`) : dialogue **« Définir un groupe de rôles »**, minimum 400 × 400, bouton « Fermer ».
- Barre : `+` · `E` · `−` · `⤒ ↑ ↓ ⤓` (`ctMoveBtns`) · **Importer** (icône `import`), sans infobulle de l'original (infobulles DeltaSub sobres, § 7 E1).
- Tableau à une colonne **« Nom »**, ordre `SORTORDER`, double-clic = éditer.
- Activation : `E`, `−` si une ligne ; `⤒ ↑` si ligne > 0 ; `↓ ⤓` si ligne < dernière ; **Importer seulement si la liste est vide**.
- `−` : « Voulez-vous vraiment supprimer cette inscription ? » (Avertissement, Oui / Non) ; aucun contrôle d'utilisation ; renumérotation 1..n dans le même commit.
- Importer : `ch17aPrjPick`, puis pour chaque groupe de la source : nouveau groupe (`NAME`, `SORTORDER`, `TEAMROLECODES` copiés) ; aucun contrôle de statut.

**Édition** (`ch05bRoleGroup(p,g)`) : titres **« Groupe de rôles »** (nouveau) / **« Editer le groupe rôles »** (édition, coquille d'origine).
- **« Désignation »** (`maxlength` 64) ; **« Rôles »** : tableau à une colonne « Rôles », boutons `+ ▾` et `−` (actif si un rôle est sélectionné).
- `+ ▾` : « Tous » (ajoute tous les rôles visibles), puis chaque rôle visible **non encore présent**, dans **l'ordre de déclaration** de l'énumération (§ 4.18.3).
- Le tableau des rôles s'affiche dans ce même ordre de déclaration.
- **OK grisé** tant que la désignation (sans espaces) est vide ou qu'il n'y a aucun rôle (`ivOkBtn`).
- OK : `NAME` = désignation sans espaces de bord ; `TEAMROLECODES` = `ch05bCodes(rôles)` = codes dans l'ordre de déclaration, chacun suivi d'une virgule ; nouveau groupe : `SORTORDER` = n + 1.
- Le filtre « Filtre par rôle » du domaine Intervenants trie désormais les groupes par `SORTORDER` (ancre B6).

### 4.10 Définir les intervenants (lot 2)

- `cfgMembers(p, role)` : paramètre facultatif ; avec `role` (12 pour « Attribuer les collaborateurs d'affaire … »), la ligne de ce rôle est présélectionnée ; **sans `role`, aucune ligne présélectionnée** [P § 1 n° 4]. Titre inchangé « Définir les intervenants — … ».
- « Importer les intervenants d'une affaire existante » : **grisé** si l'affaire a au moins un intervenant ; `ch17aPrjPick` ; copie des seuls intervenants de rôle 1, 2 ou 12 (`ch05bImportable`), champs `TEAMROLECODE`, `CONTACT_ID`, `RESPCONTACT_ID`, `PROJECTDIVISION`, `PROJECTROLE` ; `BKP`, `NOTE` vides, `ISHIDDEN` 0, `SORTORDER` dans l'ordre `memberSort` de la source (0..n−1, base 0 comme `editMember`).
- **Suppression d'un intervenant** (`ch05bDelMember(p,m,after)`, employée par `cfgMembers`, le domaine Intervenants et le domaine Entrepreneurs) : (1) intégrité : si `DS.all('projectdocument')` contient une ligne avec `RESPONSIBLEMEMBER_ID` = l'intervenant → « Cette inscription est déjà utilisée et » ⏎ « ne peut pas être supprimée. » (Information) ; (2) statut ≠ 1 → `CH17A_MSG.notInit` ; (3) « Voulez-vous vraiment supprimer cette inscription ? » (Avertissement, Oui / Non) ; un commit.

### 4.11 Domaine d'affaire « Entrepreneurs » (`ch05bContractors(C,top,pane,p)`, lot 2)

- **Liste des domaines** : « Entrepreneurs » remplace « Liste d'adresses » en **3ᵉ position** (`DOMAINS`, `domainUsed`) ; un `ds_am_dom` resté sur « Liste d'adresses » retombe sur « Intervenants » par `ch08bDomains` (déjà en place). Droit `projectContacts` (déjà dans `CH08B_DOM`).
- **Tableau** : intervenants de rôle 19 de l'affaire (masqués compris [D]), colonnes **Entité | Responsable | Domaine spécialisé | Fonction | CFC | Note**, tri par en-tête, sélection multiple, double-clic = éditer ; compteur « n Intervenants ».
- **Fiches** sous le tableau : Entité et Responsable (`contactCard`), comme le domaine Intervenants.
- **Barre** (`R` = droit `projectTeam`, `one` = une seule ligne sélectionnée) :

| Bouton | Actif si | Action |
|---|---|---|
| `+ ▾` | `R` | « Nouvel intervenant … » → `editMember(p,null,19,…)` ; « Copier l'intervenant … » (actif si `one`) → nouvelle fiche préremplie avec le **rôle et l'entité seulement**, ouverte en mode « Nouvel intervenant » |
| `E` « Intervenant » | `R` et `one` | `editMember(p,m)` |
| `−` « Supprimer l'intervenant » | `R` et `one` | `ch05bDelMember` (§ 4.10) |
| Importer « Importer les entrepreneurs d'une affaire existante » | `R` et **aucun entrepreneur** dans l'affaire | `ch17aPrjPick` ; copie des intervenants de rôle 19 de la source : rôle, entité, responsable, domaine spécialisé, fonction (**ni CFC, ni note**) |
| Documents ▾ | toujours | voir ci-dessous |
| Fonctions (roue) ▾ | au moins une ligne | « Courriel » (actif si une sélection ; `mailList` des responsables, sinon des entités) ; séparateur ; copier le tableau, exporter CSV ; séparateur ; export vCard (CH-04, `typeof`, sinon absent) |

- **Documents ▾** (`rows` = au moins une ligne ; libellés « … pour la sélection … » quand il y a une sélection) :
  1. « Liste par rôle et CFC … » (actif si `rows`) → `ch05aDoc('projectMemberList',{project:p, members, groupBy:'bkp', title:'Entreprises'})` ; grisé sans CH-09 ;
  2. « Etiquettes … » → CH-04 (`typeof`), grisé sinon ;
  3. si `isModuleFormVisible` : séparateur ; « Liste par rôle et CFC … [Ancien document] » → assistant d'adresses de CH-04, liste de type 11 (`typeof`), sinon repli sur l'impression existante « Liste d'adresses par CFC » (`printAdr`, ancien modèle `projectAddressList`) ; « Etiquettes … [Ancien document] » → CH-04 (`typeof`), grisé sinon.
- `members` = lignes **sélectionnées, sinon toutes**, dans l'ordre affiché, sans doublon.
- Menu Documents construit à partir d'un **tableau nommé `CH05B_CDOCS`** (une entrée par ligne) : CH-04 peut y ajouter ses entrées sans toucher au code de CH-05.

### 4.12 Plans comptables (lot 3)

**Liste** (`ch05cCatalogs(p)`) : dialogue **« Plans comptables »**, minimum 500 × 300, « Fermer ». Barre `+ ▾`, `E`, `−` (`E`, `−` actifs si une ligne) ; double-clic = éditer.
- Colonnes : **Nom | Titre | Type | Langue | Version | Licence CRB obligatoire | Licence de données disponible** (cases ✔ / ✕ ; la dernière : ✔ si aucune licence n'est exigée, ✕ sinon, § 7 E9).
- Menu `+ ▾` (`hasCFC` / `hasECCC` = l'affaire a déjà un plan de la catégorie) :

| Libellé (+ « … ») | Actif si | Action |
|---|---|---|
| Créer un nouveau plan comptable CFC | `!hasCFC` | plan vide, type `BKP` (0), langue 2, version 0, sans licence → dialogue « Choisir le plan comptable » |
| Importer le nouveau plan comptable CFC online | jamais | service CRB : grisé (infobulle « Service CRB : non disponible dans DeltaSub ») |
| Importer le plan comptable CFC d'une autre affaire | `!hasCFC` | § ci-dessous |
| Importer le plan comptable CFC du dossier standard | `!hasCFC` | § ci-dessous |
| séparateur | | |
| Créer un nouveau plan comptable par éléments | `!hasECCC` | plan vide, type `eBKP_H` (10) |
| Importer le nouveau plan comptable eCCC online | jamais | grisé |
| Importer le plan comptable eCCC d'une autre affaire | `!hasECCC` | § ci-dessous |

- **Importer d'une autre affaire** : `ch17aPrjPick` ; plan de même catégorie de la source ; absent → « Pas de catalogue disponible. » (Avertissement) ; sinon nouveau plan (`NAME`, `TITLE`, `CATALOGTYPECODE`, `LANGUAGECODE`, `VERSION`, `ISLICENCEREQUIRED` copiés) et positions : plan **sans licence** → toutes (`CODE`, `TEXT1`, `TEXT2`, `UNIT`, `HINT`) ; plan **sous licence** → `ecCatalogPositions(c)` (codes à ≤ 1 point), `HINT` null [C] ; puis dialogue « Choisir le plan comptable » prérempli, **enregistrement à l'OK seulement** (Annuler n'écrit rien).
- **Importer du dossier standard** : navigateur **« Choisir CFC »**, colonnes « Catalogue » | « Masqué », **tous** les catalogues `catalog` triés par `SORTORDER`, les masqués estompés ; OK grisé sans sélection ; nouveau plan `NAME` = nom du catalogue, type `BKP`, langue du catalogue, version 0, sans licence ; positions `CODE`, `TEXT1`, `TEXT2` ; puis dialogue prérempli.
- **Éditer** : plan sous licence → « Pas de licence disponible. » (Information) ; sinon dialogue « Configurer le plan comptable ».
- **Supprimer** : statut ≠ 1 → `CH17A_MSG.notInit` ; puis « Voulez-vous vraiment supprimer cette inscription ? » (Avertissement, Oui / Non) ; un commit (plan + positions) ; toast « Les données seront supprimées. » pendant l'opération ; aucun contrôle d'utilisation [P].

**Dialogue du plan** (`ch05cCatalog(p,cat,pos)`) : titres « Choisir le plan comptable » (nouveau) / « Configurer le plan comptable » (édition).
- Champs : **Nom** (32), **Titre** (255), **Type** (liste des types de la catégorie : `BKP`, `SKP`, `MKP` ou `eBKP_H`, `eBKP_T`, `eBKP_S`, `eBKP_Gate`), **Langue** (Deutsch, Français, Italiano, English), **Version** (entier, 4 chiffres au plus). La case « Licence CRB est obligatoire pour » n'est pas affichée (version de développement seulement) ; la valeur `ISLICENCEREQUIRED` est conservée.
- **OK grisé** tant que Nom ou Titre est vide (sans espaces) ou que Type / Langue n'est pas choisi.
- **« Positions »** : tableau **N° | Texte** (Texte = `TEXT1`), barre `+` (« Ajouter une position »), `E` (« Modifier la position »), `−` (« Effacer la position ») et roue (copier, CSV) ; `E` / `−` actifs si une ligne.
- Les positions sont modifiées **dans le dialogue** et écrites avec le plan à l'OK : un seul commit (plan + positions créées, modifiées, supprimées) ; nouveau plan : toast « Les données seront installées. ».
- **Position** (`ch05cPos`) : titres « Nouvelle position » / « Modifier la position » ; **N°** (6 caractères pour un CFC, 14 pour un eCCC ; **non modifiable** en édition) ; **Texte 1ère ligne** (30) ; **Texte 2ème ligne** (30, actif seulement pour un CFC) ; **Unité** (visible seulement pour un eCCC, lecture seule) ; OK grisé tant que N° ou Texte 1 est vide ; suppression avec « Voulez-vous vraiment supprimer cette inscription ? ». Aucun contrôle de doublon (le message « Cette position existe déjà. » est mort [P]).

### 4.13 Subdivisions par affectations et par locaux (lot 3)

Un seul code pour les deux (`ch05cZones(p,t)`, `t` = `projectusezone` | `projectroom`).
- Dialogue **« Subdivision par affectations »** / **« Subdivision par locaux »**, minimum 400 × 400, « Fermer ».
- Barre `+`, `E`, `−`, `⤒ ↑ ↓ ⤓` ; tableau **Code | Désignation** dans l'ordre `SORTORDER` ; double-clic = éditer ; activation comme § 4.9.
- Fiche : titres « Nouveau » / « Modifier » ; **Code** (6 caractères, **modifiable seulement à la création**) ; **Désignation** (30) ; OK grisé tant que l'un est vide ; valeurs sans espaces de bord ; nouveau : `SORTORDER` = n + 1.
- Supprimer : statut ≠ 1 → `CH17A_MSG.notInit` ; confirmation habituelle ; aucun contrôle d'utilisation ; renumérotation.

### 4.14 « Importer des heures … » (lot 4)

#### 4.14.1 Lancement
- Gestion ▸ Configuration ▸ « Importer des heures … » (droit `admin`, une affaire sélectionnée).
- Sélecteur de fichier (`input type=file`, `accept=".csv,.CSV"`) ; un nom qui ne finit pas par « .CSV » (casse ignorée) est ignoré sans message [P].
- Lecture : `ecqDecode` (UTF-8 ; UTF-16 par BOM), découpage `ecqCsvParse(text, sep)`.

#### 4.14.2 Contrôle préalable
L'affaire a des heures → « Confirmation » : « ^0 heures ont déjà été saisies pour cette affaire. » ⏎ « Voulez-vous supprimer toutes les heures de cette affaire ? Attention, irréversible. » (^0 = nombre de lignes), boutons **« Supprimer »** / **« Annuler »**. « Supprimer » → un commit qui supprime toutes les heures de l'affaire, puis ouverture du dialogue ; « Annuler » → rien. Le dialogue ne s'ouvre que si l'affaire n'a plus aucune heure.

#### 4.14.3 Dialogue « Importer les heures »
- Largeur minimale 1 000 px ; haut : **« Séparateurs »** (Virgule, Point-virgule, Deux-points, Touche tabulation, Espace ; proposé : caractère le plus fréquent de la première ligne parmi `, ; : tab`, défaut Virgule) ; **« Ignorer la première ligne à l'importation »** (cochée) ; **« Langue des activités »** (lecture seule : « Français ») ; **« Données à importer »** ; libellé d'état (« Préparer l'import » à l'ouverture) ; barre de progression.
- Boutons **« Début »**, **« Importer »** (grisé à l'ouverture), « Fermer ».
- Tableau (15 colonnes) : **Ligne | Collaborateur | Jour | Heure | Heure | Vacances | Groupe d'activités | Activité | Ouvrage | Phase | Phase partielle | Commentaire | Facturable | Facturé | Info** ; cellules en erreur sur fond rouge pâle.

#### 4.14.4 Format du fichier (champ lu = `trim` puis tronqué à la longueur maximale)

| Col. | Champ | Max | Règle |
|---|---|---|---|
| 0 | initiales du collaborateur | 16 | `STAFF.INITIALS` parmi les collaborateurs dont la personne est entité ou responsable d'un intervenant quelconque de l'affaire |
| 1 | date | 12 | `jj.mm.aaaa` ; année < 100 → erreur |
| 2 | heure de début | 8 | `.` → `:` ; motif `([01]?[0-9]|2[0-3]):[0-5][0-9]|24:00` |
| 3 | heure de fin | 8 | idem (« 24:00 » accepté) |
| 4 | vacances | 4 | non vide = vrai |
| 5 | groupe d'activités | 32 | égal au nom français d'un groupe de l'affaire |
| 6 | activité | 32 | égal au nom français d'une activité de ce groupe |
| 7 | ouvrage | 32 | égal au `CODE` d'un ouvrage de l'affaire |
| 8 | phase | 8 | entier = `NUMBER` d'une phase de l'affaire |
| 9 | phase partielle | 8 | entier = `NUMBER` d'une phase partielle de la phase trouvée |
| 10 | commentaire | 256 | — |
| 11 | facturable | — | non vide = vrai |
| 12 | facturé | — | non vide = vrai |

#### 4.14.5 Vérification (« Début »)
Libellé « Vérifier les données. » ; pour chaque ligne une heure neuve (état 0, facturable selon la colonne 11). Chaque erreur marque la cellule, compte une erreur et ajoute son texte à **Info** (séparateur « / ») :

| Règle | Cellules | Texte dans Info |
|---|---|---|
| collaborateur absent ou inconnu | 0 | si plus de 16 caractères : « Saisie trop longue. (> 16), » ; puis « Collaborateur '«valeur»'pas trouvé ou pas attribué à l'affaire » (sans espace avant « pas », comme l'original) |
| date illisible ou année < 100 | 1 | — |
| heure de début ou de fin invalide | 2 / 3 | « Format d'heure pas valide » |
| durée ≤ 0 | 2 et 3 | « A doit être supérieur à de » |
| minutes non multiples de 15 | 2 / 3 | — |
| chevauchement avec une ligne déjà lue (même collaborateur, même jour) | 2 et 3 | « Saisie de temps qui se chevauchent » |
| *ligne qui n'est pas « vacances »* : groupe introuvable | 5 | — |
| activité introuvable | 6 | — |
| activité trouvée, collaborateur non autorisé (`projectactivity_staff`) | 6 | « Pas de droit pour cette actitvité » (coquille d'origine) |
| phase obligatoire (`ISTIMEPHASEMANDATORY`) absente ; phase partielle absente | 8 ; 9 | — |
| ouvrage obligatoire absent | 7 | — |
| commentaire obligatoire vide | 10 | — |

- Ligne « vacances » : `PROJECT_ID`, activité, phase, ouvrage **null**.
- Fin : « Données vérifiées: ^0 erreurs. » ; séparateur et case deviennent inactifs ; **« Importer » actif seulement si 0 erreur et au moins une ligne**.
- `TIMEMONTH` = mois **0 à 11** ; `TIMEPERIOD` = `(h2 + m2/60) − (h1 + m1/60)`.

#### 4.14.6 Import (« Importer »)
- « Importer les heures » : « Voulez-vous importer ^0 enregistrements? » (^0 = nombre de lignes), boutons « Importer » / « Annuler » ; Annuler → libellé « Import abandonné. ».
- Sinon : libellé « Préparer l'importation de ^0 Projekt-Stunden. » (texte d'origine), « Importer » grisé ; **un seul `DS.commit`** ; libellé « Terminer … » avant l'envoi ; fin : « ^0 Heures importés » ; « Fermer » réactivé.
- DeltaSub ajoute **après** la vérification de l'original le contrôle de chevauchement avec les heures **déjà en base** d'autres affaires (`hsOverlap`) et le verrouillage (`hsFrozen`) : erreur « Saisie de temps qui se chevauchent » / « Saisie des heures verrouillée pour cette période. » (§ 7 E6).

### 4.15 « Liste des affaires … [Ancien document] » : assistant (lot 4)

- **Aperçu** (`ch05dListWizard(rows)`) : dialogue « Liste des affaires » avec un `iframe` où `tplPrint` écrit le document (fenêtre factice `{document: iframe.contentDocument, print(){}}` passée en `o.win`) ; boutons **« Préférences d'impression »**, « Imprimer » (`iframe.contentWindow.print()`), « Fermer ». Données : les affaires de la liste affichée dans la Gestion (`AF.g.view`), filtrées par les critères.
- **Paramètres** (dialogue « Paramètres ») :
  - **Tri** (liste) : Tri alphabétique · Tri selon critères de tri · Tri selon début du projet · Tri selon fin du projet · Tri selon début du projet (libellé erroné de l'original : tri par localité) · Tri selon genre d'affaire · Tri selon numéro d'affaire · Tri selon maître d'ouvrage ;
  - **Critères d'impression** : Numéro d'affaire (Plus petit ou égal à | Plus grand ou égal à | Autour de ; de … à) ; Statut d'affaire (Toutes les affaires | Affaires en cours | Affaires terminées) ; Début du projet et Fin du projet (avant le | après le | Autour du ; dates) ; Genres d'affaire (tableau Groupe d'affaire | Genre d'affaire, choix multiple) ;
  - **Colonnes** (case, largeur, ordre ⤒ ↑ ↓ ⤓) : Numéro, Affaire, NPA, Localité, Début, Fin, Maître d'ouvrage, Statut ; « Répartition des colonnes » (largeurs égales) ;
  - **Mise en page** : « Document avec fond alterné » (Fond), « Taille de police », « Interligne » (défaut 15), « Avec page de garde », « Modèle » (anciens modèles `projectList` du groupe de l'affaire et des groupes par défaut), « Titre du document » (défaut « Liste des affaires »), « Date ».
- Données par affaire : numéro ; MO = premier intervenant rôle 8 (`projMO`) ; début ; fin ; **NPA et localité de l'adresse de l'affaire** (`CONTACT1_ID`) ; titre ; genres ; `SORTLABEL` ; statut.
- Rendu : `tplPrint({md, cols, rows, title, ctx:{date}, cover})` ; fond alterné et interligne par une **copie** du modèle (`e.rayures = true`, `e.hauteurLigne`) passée en `o.md` ; taille de police par `_fs`.
- Messages : « Le modèle de première page ne contient pas de champ de liste. », « Le modèle de page suivante ne contient pas de champ de liste. », « Impossible de trouver le modèle ^0. ».
- **Favoris** : un seul jeu de réglages **par poste**, `localStorage` `ds_ch05_plfav` (JSON), lu et écrit sous `try` ; libellé du bouton d'enregistrement « Préférences ».

### 4.16 « Dossier des modèles … » : « Définir les modèles » (lot 4)

Dialogue **« Définir les modèles »**, trois sections dans cet ordre :
1. **« Modèles documents »** — « Choix du groupe de modèles pour cette affaire. » — **« Groupe »** : entrée **vide**, puis chaque `doctemplategroup` non masqué et ≠ `Group.general`, trié `SORTORDER` ; libellé « Modèles d'affaires » pour `Group.project`, sinon `GROUPNAME`, suivi de « , » + description si elle n'est pas vide. Valeur initiale : `DOCTEMPLATEGROUPNAME`. OK écrit le `GROUPNAME` choisi, ou **null**.
2. **« Modèles »** — « Choix du groupe de modèles pour cette affaire. » — **« Groupe »** : groupes `modelegroupe` de catégorie `projectTemplates` ; si `TEMPLATEGROUPNAME` est vide, **présélection du groupe par défaut** (`tplDefaultGroup('projectTemplates')`) ; section **grisée** si `isModuleFormVisible` est NON.
3. **« Modèles externes (doc. types Word, LibreOffice...) »** — « Choix des groupes de modèles externes. » — tableau **Titre | Groupe de modèles externes | Remarque | Emplacement** (`projecttemplategroup` + `templategroup`) ; `+` (navigateur « Sélection du groupe de modèles externes », choix multiple ; un seul choix ouvre « Groupe de modèles » : Nom, Remarque), `E` (« Modifier le groupe de modèles »), `−`, `⤒ ↑ ↓ ⤓` ; section **grisée** si `isProjectMenuFilesVisible` est NON (**bureau**).
- **OK grisé** tant qu'aucun groupe n'est choisi dans la section « Modèles » ; un seul commit (affaire + modèles externes).

### 4.17 Dossiers des documents externes et des enregistrements (lot 4, masqués au bureau)

Entrées présentes seulement si `ch08aBool('isProjectMenuFilesVisible', false)`.
- **« Dossier des documents externes »** (`ch05dFiles`) : « Emplacement des fichiers liés à une affaire » (« Emplacement des fichiers liés, tels que image de l'affaire, annexes aux bons de paiement, etc. » ; **« Chemin du dossier de l'affaire »** → `PROJECTFOLDER`) ; « Emplacement du dossier DELTAprojectDocuments de cette affaire » (texte d'aide de l'original ; « Dossier Affaire » = chemin des réglages ; **« Définir l'emplacement »** : radio « DELTAprojectDocuments de cette affaire est un sous-dossier de Affaires » / « … est ailleurs, il n'est pas un sous-dossier de Affaires » ; champ « DELTAprojectDocuments » relatif ou absolu ; « Afficher le dossier » = copie du chemin) ; OK grisé si le chemin choisi est vide ; OK écrit `PROJECTFOLDER`, `ISPATHTOPROJECTDOCUMENTSRELATIVE`, `PATHTOPROJECTDOCUMENTS`.
- **« Liens avec les sous-dossiers de DELTAprojectDocuments »** (`ch05dFolders`) : refus si le chemin n'est pas configuré (« Le chemin des documents externes n'est pas encore configuré. », Avertissement) ; tableau **Nom du dossier | Masqué | Dossier** ; `+`, `E`, `−`, `⤒ ↑ ↓ ⤓`, Importer d'une autre affaire (actif si la liste est vide) ; fiche « Sélection du dossier » / « Modifier » : **Dossier**, **Nom**, **Masqué**, « Afficher le dossier » ; OK si Dossier et Nom non vides ; suppression refusée si un fichier du dépôt CH-03 y est rattaché (`typeof`, « Cette inscription est déjà utilisée et » ⏎ « ne peut pas être supprimée. »).

### 4.18 Messages et libellés exacts

#### 4.18.1 Messages

| Clé (`CH05_MSG`) | Texte | Titre | Source |
|---|---|---|---|
| `notInit` | réutilise `CH17A_MSG.notInit` | Information | `rsrc msgProjectIsNotInitializing0/1` |
| `hours` | « Le remplacement n'est pas possible, » ⏎ « car des heures ont déjà été comptabilisés. » | Information | `ProjectImportFromProjectDialog msg2a/b` |
| `del` | « Voulez-vous vraiment supprimer cette inscription ? » | Avertissement | `rsrc msgDeleteEntry` |
| `delAll` | « Voulez-vous tout effacer ? » | Avertissement | `rsrc msgDeleteEntries` |
| `delStaff` | « Voulez-vous vraiment supprimer ce collaborateur ? » | Avertissement | `ProjectActivitiesDialog msg4` |
| `used` | « Cette inscription est déjà utilisée et » ⏎ « ne peut pas être supprimée. » | Information | `rsrc msgEntryIsNotDeletable0/1` |
| `noCat` | « Pas de catalogue disponible. » | Avertissement | `ProjectCatalogsDialog msgNoCatalog` |
| `noLic` | « Pas de licence disponible. » | Information | `msgNoLicence` |
| `inst` / `supp` | « Les données seront installées. » / « Les données seront supprimées. » | (toast) | `ProjectCatalogDialog msgLoadingSave1 / msgLoadingDelete1` |
| `noPath` | « Le chemin des documents externes n'est pas encore configuré. » | Avertissement | `ProjectFoldersDialog msgDirectoryNotFound` |
| import d'heures | les 13 textes du § 4.14 | — | `ImportTimeLogsDialog` |

#### 4.18.2 Titres et libellés
Repris tels quels du § 4 ; toutes les entrées de menus de la Gestion finissent par « … » (`mapStringWithEllipsis`), sauf le filtre, la roue, « Ajouter toutes les activités », « Supprimer des activités », « Supprimer toutes les activités » et « Courriel ».

#### 4.18.3 Ordre de déclaration des rôles (`TeamRole`, menus et `TEAMROLECODES`)
1 Architecte · 2 Directeur des travaux · 3 Ingénieur civil · 4 Directeur d'affaire · 5 Représentant directeur · 6 Responsable de l'affaire · 7 Représentant resp. · 8 Maître d'ouvrage · 50 Consultant du MO · 51 Représentant du MO · 10 Spécialistes · 11 Experts · 12 Collaborateurs · 13 Collaborateurs externes · 14 Autorités · 15 Autres · 16 Locataires · 17 Acheteurs · 18 Voisins · 19 Entreprises · 20 Assurances · 21 Planificateur de coût · 22 Autres architectes · 23 Autres MO · 24 Gérant d'immeubles · 25 Entreprise générale · 26 Planificateur principal · 27 Gérance immobilière · 28 Clients · 29 Exploitants · 30 Participants concours · 31 Entreprise totale · 32 Economiste · 33 Garant (SIA 1018/1019) · 34 Usines · 35 Paysagiste · 36 Manager BIM · 37 Coordinateur BIM · 38 Responsable BIM · 39 Coordinateur ICT · 90 Intervenants archivés. (100 `realizationCostControl` invisible.) [P : `TeamRole.<clinit>`]. Libellés = `ROLE` de DeltaSub.

---

## 5. Documents imprimés

### 5.1 Interface avec CH-09 (nouveau format `.dpdoc`)

- `ch05aDoc(type, ctx)` cherche, au moment de l'appel, la première fonction globale existante parmi `CH05A_DOCFN[type]` (défaut `['ch09Doc']`, à compléter par l'intégrateur si CH-09 choisit un autre nom) et l'appelle avec `(type, ctx)`. `ch05aDocOk(type)` sert à griser l'entrée.
- `projectList` : `ctx = {projects:[…], filterDesc}` (ordre affiché). Modèle `.dpdoc` du jeu 0 ; champs `ProjectList$StringField|filterDesc` et `ProjectList$TableField|table`.
- `projectMemberList` : `ctx = {project, members:[…], groupBy:'bkp', title:'Entreprises'}`. Regroupement par CFC (`GroupedContactReport` `groupByBkp`) : un groupe par code CFC (un intervenant à plusieurs CFC apparaît dans chacun), libellé « numéro + texte » du plan de l'affaire, ligne vide entre groupes, en-tête de groupe en gras ; intervenant sans CFC → groupe de son rôle, sinon « Sans CFC ». Modèle du jeu de l'affaire puis jeu 0 (au bureau : jeu 1 « Liste des entreprises », jeu 2 « Liste des intervenants »).
- Sans fonction CH-09 : entrées grisées ; aucun repli silencieux (les entrées « [Ancien document] » existent).

### 5.2 Anciens modèles

- « Liste des affaires … [Ancien document] » : ancien modèle `projectTemplates/projectList` par `tplPrint` (§ 4.15).
- « Liste par rôle et CFC … [Ancien document] » : assistant d'adresses CH-04 (type 11) ou repli `printAdr` (ancien `projectAddressList`).
- Étiquettes : CH-04.

---

## 6. Valeurs de contrôle

Toutes tirées de la base de test (copie du bureau), identifiants seulement.

### 6.1 Tests jsc (fonctions pures)

| # | Lot | Fonction | Entrée | Attendu |
|---|---|---|---|---|
| T1 | 1 | `ch05aGFilter` | 111 affaires | Afficher tout 111 ; non archivées **87** ; Configuration 1 ; En cours 46 ; En attente 4 ; Terminée 36 ; Archivée 24 |
| T2 | 1 | `mgPFlist(mgPF())` | 111 affaires | **46** (DeltaSub actuel : 86 = 46 + 4 + 36) |
| T3 | 1 | `ch05aImpOps` | cible 701 (1 groupe, 3 activités, 11 liens, 5 niveaux, 5 taux), source **3651**, `{rates:1,acts:1}` | 25 suppressions + 25 créations (1 groupe, 3 activités, 11 liens, 5 niveaux, 5 taux) ; Σ `RATE` créés **595.00** ; `VALIDFROM` 2009-01-01 ×5 ; aucune prévision copiée |
| T4 | 1 | idem | source **915** | 1 groupe, **4** activités, **31** liens, 5 niveaux, Σ **580.00** |
| T5 | 1 | idem | source **902**, `{rates:1,acts:1}` | l'activité copiée de 754 pointe vers le **nouveau** niveau « Architecte » ; 755, 756 → null ; 33 liens |
| T6 | 1 | idem | source 902, `{acts:1}` | les 3 activités ont `PROJECTRATEGROUP_ID` null ; aucun tarif touché |
| T7 | 1 | idem | source 902, `{rates:1}` | les activités gardées de 701 sont rattachées par nom ou mises à null ; aucune activité touchée sinon |
| T8 | 1 | `ch05aGCols('standard')` | — | Numéro, Affaire, Statut, Début, Fin, Actif |
| T9 | 2 | `ch05bCodes` | {Architecte} ; {MO, Architecte} ; {Spécialistes, Consultant du MO} | `"1,"` ; `"1,8,"` ; `"50,10,"` ; relecture (`split`) identique |
| T10 | 2 | `ch05bImportable` | 3651 ; 915 | 3 intervenants ; **12** (1 + 1 + 10) |
| T11 | 2 | `ch05bContractorRows` | 915 ; 702 ; 913 ; 1251 ; 3001 ; 3701 ; 3651 | **34** (34 CFC distincts, 0 responsable) ; 24 ; 23 ; 23 ; 8 ; 1 ; 0 ; total bureau 330 dans 26 affaires |
| T12 | 3 | `ch05cCopyPos` | plan 2552 (eCCC 3601, sous licence, 10 195 positions) | **413** positions (85 + 328 à ≤ 1 point), `HINT` null |
| T13 | 3 | idem | plan 2551 (CFC 3601, sans licence) | **801** positions (doublons de code compris) |
| T14 | 3 | `ch05cStdPos` | `catalog` 101 « CFC » | **796** positions ; type 0, langue 2, sans licence |
| T15 | 3 | `ch05cHas` | 3601 ; 701 ; 3651 | CFC et eCCC ; CFC seul ; aucun (`+` : 4 entrées CFC actives sauf online) |
| T16 | 4 | `ch05dParseTimes` | fichier d'essai : 1 ligne correcte, 1 chevauchante, 1 fin ≤ début, 1 collaborateur inconnu, 1 vacances | « Données vérifiées: 3 erreurs. » ; Info exactes (§ 4.14.5) ; la ligne vacances sans affaire |
| T17 | 4 | idem | « 7.15 » ; « 24:00 » ; « 8:10 » ; « 25:00 » | 07:15 ; 24:00 ; erreur minutes (cellule seule) ; « Format d'heure pas valide » |
| T18 | 4 | idem | date « 03.02.2026 » | `TIMEYEAR` 2026, `TIMEMONTH` **1**, `TIMEDAY` 3 |
| T19 | 4 | `ch05dSep` | première ligne `a;b;c,d` | Point-virgule |
| T20 | 4 | `ch05dDocGroups` | 3 `doctemplategroup` | (vide), « Modèles d'affaires », « SUBSTANCES, … » (`Group.general` exclu) |

Plus : contrôle de syntaxe du script complet (`DeltaSub.html` construit + lot) avec `jsc -e "new Function(readFile('f.js'))"`.

### 6.2 Essai navigateur (copie isolée, un port par lot : 8020 à 8023)

Copie de la base par `sqlite3 … ".backup"`, serveur copié `DELTASUB_DB=… python3 -I … --port 80xx`, onglet propre, `localStorage.ds_user='2752'`. Les impressions sont vérifiées dans un `iframe`.

| # | Lot | Scénario | Attendu |
|---|---|---|---|
| B1 | 1 | Gestion | 87 affaires, étiquette « Afficher les non archivées » ; « Afficher tout » → 111 ; « Abrégée » → 6 colonnes, mémorisée au rechargement |
| B2 | 1 | menus | ordre et libellés du § 4.1 ; Paramètres grisé sans sélection ; « Attribuer les activités aux collaborateurs … » dans Configuration |
| B3 | 1 | Toutes les affaires | 46 affaires ; « Filtré » visible ; Editer le filtre → statut « Terminée » → 36 ; « Appliquer le filtre » décoché → 86 |
| B4 | 1 | 3651 (statut 2) ▸ tarifs ▸ Importer d'une affaire existante | message `notInit` |
| B5 | 1 | 701 (statut 1, 0 heure) ▸ activités ▸ `+` | « Importer d'une affaire existante … » grisé (701 a un groupe) ; tarifs ▸ import depuis 915, option 1 → activités 1/4/31, tarifs Σ 580.00 ; un seul commit |
| B6 | 1 | copie de la base, 701 avec une heure ajoutée | message `hours` avant le dialogue |
| B7 | 1 | 701 ▸ « Attribuer les activités aux collaborateurs … » | collaborateurs actifs de l'affaire ; ajout puis retrait d'une activité, confirmations |
| B8 | 1 | « Liste des affaires … » | 87 lignes, inactives estompées ; « Afficher le rapport … » grisé sans CH-09 |
| B9 | 1 | suppression d'une affaire d'essai créée dans la copie | ses configurations disparaissent (compte avant / après) |
| B10 | 2 | 915 ▸ Groupes de rôles | 1 groupe ; édition « Rôles » + MO → `TEAMROLECODES` `"1,8,"` ; Importer grisé |
| B11 | 2 | 3651 ▸ « Attribuer les collaborateurs d'affaire … » | ligne Collaborateurs choisie (3) ; « Attribuer les intervenants … » → aucune ligne choisie |
| B12 | 2 | affaire neuve ▸ Importer les intervenants depuis 915 | 12 intervenants (rôles 1, 2, 12) |
| B13 | 2 | domaine Entrepreneurs, 915 | 34 lignes ; « Liste par rôle et CFC pour la sélection … » après sélection ; suppression refusée (statut 2) |
| B14 | 2 | affaire neuve ▸ Entrepreneurs ▸ Importer depuis 915 | 34 lignes, CFC vides |
| B15 | 3 | 3651 ▸ Plans comptables ▸ dossier standard ▸ CFC | 796 positions ; Devis général de 3651 trouve son plan |
| B16 | 3 | 3651 ▸ eCCC d'une autre affaire (3601) | 413 positions ; « Editer » → « Pas de licence disponible. » |
| B17 | 3 | 2951 ▸ affectations / locaux | ESD, ARC, AE1, AE2, COM (ordre 1-5) ; local « D » ; Code non modifiable en édition ; suppression refusée (statut 2) |
| B18 | 4 | 701 ▸ Importer des heures (fichier T16) | 3 erreurs, Importer grisé ; fichier corrigé → import de n lignes, visibles dans la saisie (mois 0-11) |
| B19 | 4 | Liste des affaires [Ancien document] | aperçu dans l'iframe ; préférences gardées au rechargement |
| B20 | 4 | 1501 ▸ Dossier des modèles | « SUBSTANCES, … » / « Substances » / 2 modèles externes (section grisée) |
| B21 | 4 | réglage `isProjectMenuFilesVisible` = `[YES]` dans la copie | les deux entrées de dossiers apparaissent ; refus « chemin … pas encore configuré » |

---

## 7. Écarts assumés

| # | Écart | Raison |
|---|---|---|
| E1 | Infobulles sobres sur les boutons (l'original n'en a pas) | convention DeltaSub |
| E2 | Positions et tailles de fenêtres non mémorisées | aucun dialogue DeltaSub ne le fait |
| E3 | Import « tarifs seulement » : activités rattachées par nom ou mises à null | l'original laisse un lien vers un groupe supprimé |
| E4 | Filtre de la Gestion et des listes gardés pour la session | comme l'original ; seule la présentation est mémorisée |
| E5 | « Affaires internes / externes » retirés du filtre de la Gestion | fidélité (§ 11 n° 5) |
| E6 | Import d'heures : contrôle supplémentaire de chevauchement avec les heures d'autres affaires et du verrouillage | cohérence avec la saisie (`hsEdit`) ; l'original ne vérifie que les lignes du fichier |
| E7 | « Afficher le dossier » copie le chemin | un navigateur n'ouvre pas un dossier local |
| E8 | Langue de dialogue toujours « Français » (noms d'activités, de groupes et de tarifs comparés en `NAMEFR`) | DeltaSub est en français |
| E9 | Plans sous licence : non éditables, copiés jusqu'au niveau 3 sans `HINT` ; colonne « Licence de données disponible » ✕ | DeltaSub ne gère pas les licences de données CRB (spec_12 § 1.4) ; § 11 n° 3 |
| E10 | Import d'heures en un seul commit plutôt qu'en tâche de fond avec progression ligne à ligne | atomicité de la transaction de l'original |
| E11 | Entrées CRB « online » affichées grisées | fidélité visuelle sans service |
| E12 | « Configurer les séances / types de plans / nomenclature » absentes tant qu'aucune fonction n'est déclarée dans `CH05A_MORE` | écrans inexistants dans DeltaSub (chantiers des séances et des plans) |

---

## 8. Écarts hors chantier signalés (non traités)

1. **Inscription automatique en rôle 19 depuis le contrôle des coûts** (`CostControlDialog.matchEnterpriseList` → `setProjectRole` à l'enregistrement : entreprise du contrat, CFC des détails ajoutés au `BKP` si < 256 caractères, nouvel intervenant sinon) : **CH-07**.
2. **Domaine Intervenants, « Copier l'intervenant »** : DeltaSub copie l'adresse dans le presse-papier ; l'original crée un nouvel intervenant de même rôle et entité [D : même libellé `ProjectMemberFrame|copyProjectMember`]. Ligne du menu Fonctions partagée avec CH-04 : à traiter avec lui.
3. **« Mes affaires »** : l'original liste les affaires de l'utilisateur (`getProjectListByAppUser`) ; DeltaSub les intervenants « Collaborateurs » (`staffProjects`).
4. **Ordre des rôles par affaire** (`ROLELISTSORTCODE`, « L'ordre par défaut ») dans « Définir les intervenants » : 0 usage au bureau.
5. **Correspondance des colonnes du `.dpdoc projectList` (2022) avec le code 16.05** : à trancher dans CH-09.
6. **Reprise Deltaproject** : heures et configurations saisies dans DeltaSub écrasées par une reprise `--force` (§ 11 n° 4).

---

## 9. Points d'ancrage DeltaSub

Unicité vérifiée par `grep -F -c` = 1 sur `9f184fe` pour chaque « ancien ». Le `build.py` de chaque lot prend le chemin du `DeltaSub.html` source en argument (défaut : celui du dépôt), vérifie chaque ancre (compte = 1), refuse un préfixe déjà présent et **échoue proprement** (message, code non nul, rien d'écrit) sinon. Le code de chaque lot est inséré **avant** le commentaire qui contient la ligne `   DÉMARRAGE` (comme CH-17). Sauf mention, le « nouveau » est une ligne de remplacement minimale qui ne touche pas au code des autres chantiers.

| # | Lot | Ancre exacte (« ancien ») | « Nouveau » | Lieu |
|---|---|---|---|---|
| A0 | 1-4 | ligne `   DÉMARRAGE` | bloc du lot inséré avant le commentaire qui la contient | l. 21 868 |
| A1 | 1 | `{i:'person',t:'Intervenants',menu:()=>[{t:'Attribuer les intervenants',fn:need(cfgMembers)},{t:'Attribuer les activités aux collaborateurs',fn:need(cfgActivities)}]},` | `{i:'person',t:'Intervenants',menu:()=>ch05aMTeam(cur)},` | l. 1360 |
| A2 | 1 | ligne entière commençant par `{i:'wrench',t:'Configuration',menu:()=>[` (finit par `{t:'Configurer les frais …',fn:need(ch17aOpen)}]},`) | `{i:'wrench',t:'Configuration',menu:()=>ch05aMSet(cur)},` | l. 1361 |
| A3 | 1 | `{i:'tree',t:'Subdivisions',menu:()=>[{t:'Configurer la subdivision par ouvrages et localisations',fn:need(cfgSubprojects)}]},` | `{i:'tree',t:'Subdivisions',menu:()=>ch05aMSub(cur)},` | l. 1362 |
| A4 | 1 | ligne entière commençant par `{i:'save',t:'Modèles et documents externes',menu:()=>[` | `{i:'save',t:'Modèles et documents externes',menu:()=>ch05aMFiles(cur)},` | l. 1363 |
| A5 | 1 | `{i:'doc',t:'Documents',menu:()=>[{t:'Liste des affaires',fn:()=>printProjects(AF.g.view)}]},` | `{i:'doc',t:'Documents',menu:()=>ch05aMDocs()},` | l. 1364 |
| A6 | 1 | les deux lignes du menu `{i:'gear',t:'Fonctions',menu:()=>[{t:'Afficher les non archivées',chk:!AF.arch,` … `csvTable(AF.g,'Affaires')}]},` | `{i:'gear',t:'Fonctions',menu:()=>ch05aMWheel(draw)},` | l. 1365-1366 |
| A7 | 1 | les deux lignes du menu `{i:'filter',t:'Filtre',menu:()=>[{t:'Tous les statuts',chk:!AF.filt.s,` … `draw(); }}]}` | `{i:'filter',t:'Filtre',menu:()=>ch05aMFilter(AF,draw)}` | l. 1367-1368 |
| A8 | 1 | `const draw=()=>{ const rows=DS.all('project').filter(p=>(AF.arch||p.PROJECTSTATECODE!==5)&&(!AF.filt.s||p.PROJECTSTATECODE==AF.filt.s)&&(AF.filt.i==null||(+!!p.ISINTERNAL)===AF.filt.i)&&matchQ(AF.q,p.NUMBER,p.TITLE,p.DESCRIPTION));` | `const draw=()=>{ const rows=DS.all('project').filter(p=>ch05aGOk(AF,p)&&matchQ(AF.q,p.NUMBER,p.TITLE,p.DESCRIPTION));` | l. 1371 |
| A9 | 1 | du début `grid(pane,Object.assign(AF.g,{cols:[{k:'NUMBER',t:'Numéro',w:100},` jusqu'à `p.CURRENTPROJECTPHASE_ID)))}],` (3 lignes) | `grid(pane,Object.assign(AF.g,{cols:ch05aGCols(),` | l. 1372-1374 |
| A10 | 1 | `head.setCount(rows.length+' Affaires'); };` | `head.setCount(ch05aCount(rows.length)); ch05aGLabel(head,AF); };` | l. 1376 |
| A11 | 1 | `const st=ME.staff, list=mine?staffProjects(st).filter(p=>p.PROJECTSTATECODE===2):DS.all('project').filter(p=>[2,3,4].includes(p.PROJECTSTATECODE)||(arg&&arg.project===p.ID));` | `const st=ME.staff; let list=mine?staffProjects(st).filter(p=>p.PROJECTSTATECODE===2):ch05aAllList(arg);` (`let` : la liste est recalculée quand le filtre change) | l. 1487 |
| A12 | 1 | `A.el.prepend(phead([],{count:1,search:q=>{ AM.q=q; drawA(); }}));` | `A.el.prepend(phead(mine?[]:ch05aAllBtns(()=>{ list=ch05aAllList(arg); drawA(); ch05aAllLabel(A.el.firstChild); }),{count:1,search:q=>{ AM.q=q; drawA(); }})); if(!mine) ch05aAllLabel(A.el.firstChild);` (`drawA` est appelée au clic, après sa définition) | l. 1488 |
| A13 | 1 | `ch17aDelOps(p,ops);` | `ch17aDelOps(p,ops); await ch05aDelOps(p,ops);` | l. 1189 |
| A14 | 1 | `{t:'Ajouter un groupe d’activités',fn:()=>ed('projectactivitygroup')},{t:'Importer du dossier standard',fn:()=>importStdActivities(p).then(drawA)}` | `...ch05aActPlus(p,()=>ed('projectactivitygroup'),()=>importStdActivities(p).then(drawA),drawA)` (« Nouveau … », « Importer du dossier standard … », « Importer d'une affaire existante … ») | l. 1253 |
| A15 | 1 | `{i:'plus',menu:()=>[{t:'Nouveau tarif',fn:()=>edG()},{t:'Nouveau tarif de facturation (taux daté)',dis:!sel(),fn:()=>edR(sel()._g)},{t:'Importer du dossier standard',fn:std}]},` | `{i:'plus',menu:()=>[{t:'Nouveau tarif …',fn:()=>edG()},{t:'Nouveau tarif de facturation (taux daté)',dis:!sel(),fn:()=>edR(sel()._g)},...ch05aRatePlus(p,std,draw)]},` | l. 1286 |
| A16 | 1 | `const del=async(t,o,f)=>{ if(!o.sel) return;` | `const del=async(t,o,f)=>{ if(!o.sel) return; if(!ch05aInit(p)) return;` | l. 1245 |
| A17 | 1 | `{i:'minus',t:'Supprimer un collaborateur',fn:async()=>{ if(o2.sel&&o3.sel){` | `{i:'minus',t:'Supprimer un collaborateur',fn:async()=>{ if(o2.sel&&o3.sel&&ch05aInit(p)&&await ch05aAskDel('delStaff')){` | l. 1256 |
| A18 | 1 | `async function importStdActivities(p){` | `async function importStdActivities(p){ if(!ch05aInit(p)) return;` | l. 1259 |
| B1 | 2 | `function cfgMembers(p){` | `function cfgMembers(p,role){` | l. 1312 |
| B2 | 2 | `if(oR.sel==null) oR.sel='12'; drawL();` | `if(role!=null) oR.sel=String(role); drawL();` | l. 1322 |
| B3 | 2 | `{i:'import',t:'Importer les intervenants d’une affaire existante',fn:importFrom}` | `{i:'import',t:'Importer les intervenants d’une affaire existante',dis:ms().length>0,fn:()=>ch05bImportMembers(p,drawL)}` (état évalué à l'ouverture ; `ch05bImportMembers` refait le contrôle au clic) | l. 1327 |
| B4 | 2 | `{i:'minus',t:'Supprimer l’intervenant',fn:async()=>{ if(oM.sel&&await confirmDlg('Supprimer cet intervenant de l’affaire ?','Supprimer')){ await DS.del('projectmember',oM.sel); drawL(); } }},` | `{i:'minus',t:'Supprimer l’intervenant',fn:()=>oM.sel&&ch05bDelMember(p,DS.get('projectmember',oM.sel),drawL)},` | l. 1326 |
| B5 | 2 | `{i:'minus',t:'Supprimer l’intervenant',fn:async()=>{ if(o.sel&&await confirmDlg('Supprimer cet intervenant de l’affaire ?','Supprimer')) DS.del('projectmember',o.sel); }},` | `{i:'minus',t:'Supprimer l’intervenant',fn:()=>o.sel&&ch05bDelMember(p,DS.get('projectmember',o.sel))},` | l. 1514 |
| B6 | 2 | `const groups=DS.by('projectmemberrolegroup','PROJECT_ID',p.ID);` | `const groups=DS.by('projectmemberrolegroup','PROJECT_ID',p.ID).sort((a,b)=>cmp(a.SORTORDER,b.SORTORDER));` | l. 1508 |
| B7 | 2 | `const DOMAINS=['Intervenants','Soumissionnaires','Liste d’adresses',` | `const DOMAINS=['Intervenants','Soumissionnaires','Entrepreneurs',` | l. 1478 |
| B8 | 2 | `const domainUsed=d=>['Calcul des coûts','Intervenants','Soumissionnaires','Liste d’adresses',` | `const domainUsed=d=>['Calcul des coûts','Intervenants','Soumissionnaires','Entrepreneurs','Liste d’adresses',` | l. 1499 |
| B9 | 2 | `if(d==='Soumissionnaires'){ svTendererDomain(C,top,pane,p); return; }` | `if(d==='Entrepreneurs'){ ch05bContractors(C,top,pane,p); return; }` + l'ancien | l. 1534 |
| D1 | 4 | aucune ancre propre : les entrées du lot 4 sont déjà branchées par A2, A4, A5 (`typeof`) | — | — |

- Les lots 3 et 4 n'ont **aucune ancre** en dehors de A0 : leurs entrées de menu sont créées par le lot 1 et s'activent par `typeof`.
- A11-A12 : rien ne change pour « Mes affaires » (pas de bouton, même liste).
- A6, A7, A9 couvrent plusieurs lignes : l'« ancien » est le texte exact de bout en bout, sauts de ligne compris (fin de A6 : `csvTable(AF.g,'Affaires')}]},` l. 1366 ; fin de A7 : `{t:'Affaires externes',chk:AF.filt.i===0,fn:()=>{ AF.filt.i=AF.filt.i===0?null:0; draw(); }}]}` l. 1368 ; fin de A9 : `p.CURRENTPROJECTPHASE_ID)))}],` l. 1374).
- **Aucune modification** de `CH08B_GUARDS` : les libellés de boutons gardés sont inchangés ; les entrées de menu créées par CH-05 portent leurs propres droits. Les lignes de garde devenues sans objet (« Attribuer les intervenants », « Configurer les activités », etc., sans « … ») sont inoffensives.
- **Chantiers parallèles** : CH-04 (Documents des domaines : tableau `CH05B_CDOCS`), CH-09 (`ch05aDoc`, § 5.1), CH-07 (domaine « Contrôle des coûts », rôle 19), CH-06 (plans comptables de l'Administrateur : aucun helper partagé requis ; CH-06 peut réutiliser `ch05cPos` par `typeof`), CH-10 / CH-11 (`DOMAINS`, `domainView` : ancres B7-B9 distinctes des leurs).

**Fonctions existantes réutilisées, sans modification** : `h`, `esc`, `num`, `cmp`, `nm`, `toast`, `ibtn`, `popMenu`, `dialog`, `confirmDlg`, `phead`, `grid`, `gridSel`, `col`, `formRows`, `readK`, `lang4`, `copyTable`, `csvTable`, `projects`, `projLabel`, `projState`, `projActive`, `projMO`, `matchQ`, `dfr`, `staffList`, `staffName`, `contactName`, `contactCard`, `adrLines`, `mailList`, `memberSort`, `editMember`, `ROLES`, `ROLE`, `PSTATE`, `mgPF`, `mgPFlist`, `mgPFdialog`, `mpPFcrit`, `ch17aPrjPick`, `ch17aState`, `ch17aBseq`, `ch17aSave`, `ch17aSort`, `ch17aRenum`, `CH17A_MSG`, `ctMsg`, `ctReorder`, `ctMoveRec`, `ctMoveBtns`, `ctCopy`, `ivOkBtn`, `ivAsk`, `ecCatalogPositions`, `ecqCsvParse`, `ecqDecode`, `hsOverlap`, `hsFrozen`, `tplPrint`, `tplOr`, `tplNeed`, `tplDefaultGroup`, `printAdr`, `printProjects`, `ch08aCan`, `ch08aBool`, `DS.*`.

**Aucune modification** de `serveur_deltasub.py`, des outils de reprise ni des autres cahiers.

---

## 10. Plan en lots

Taille totale : **L**. La fiche prévoyait 6 lots ; ils sont fusionnés en 4 : le filtre et la « Liste des affaires » (fiche lot 5) rejoignent le lot 1, qui reconstruit de toute façon les menus de la Gestion ; l'assistant ancien et les dossiers (fiche lots 5 et 6) rejoignent l'import d'heures dans le lot 4, parce qu'aucun n'a d'ancre propre. Le lot 1 doit être intégré le premier ; les lots 2, 3 et 4 sont indépendants entre eux.

### Lot 1 — Gestion : barre, filtres, « Liste des affaires », import d'activités et de tarifs, activités par collaborateur, cascade (préfixe `ch05a` / `CH05A`, port 8020)

- **Fichiers** : `ch/CH-05/lot1/ch05a.js`, `build.py` (A0-A18), `test_ch05a.js` (jsc), `DeltaSub.html` construit pour l'essai.
- **Contenu** :
  - `CH05_MSG` (§ 4.18.1) ; `ch05aCan(clé)` (enveloppe `ch08aCan` par `typeof`) ; `ch05aInit(p)` (statut relu, message) ; `ch05aAskDel(clé)` ;
  - menus `ch05aMTeam`, `ch05aMSet`, `ch05aMSub`, `ch05aMFiles`, `ch05aMDocs`, `ch05aMWheel`, `ch05aMFilter` avec entrées des lots 2-4 grisées par `typeof` (§ 4.1) ;
  - `ch05aGOk`, `ch05aGFilter` (pure), `ch05aGCols`, `ch05aCount`, `ch05aGLabel` (§ 4.2) ;
  - `ch05aAllList`, `ch05aAllBtns`, `ch05aAllLabel` (§ 4.3) ;
  - `ch05aListDlg`, `CH05A_DOCFN`, `ch05aDoc`, `ch05aDocOk` (§ 4.4, § 5.1) ;
  - `ch05aImpOpen`, `ch05aImpOps` (pure), `ch05aActPlus`, `ch05aRatePlus` (§ 4.5) ; contrôles § 4.6 ;
  - `ch05aStaffActs` (§ 4.7) ; `ch05aDelOps` (§ 4.8).
- **Tests** : T1-T8 ; essai B1-B9.
- **Dépendances** : aucune (CH-17, CH-08 déjà intégrés).

### Lot 2 — Rôles, intervenants et domaine Entrepreneurs (préfixe `ch05b` / `CH05B`, port 8021)

- **Fichiers** : `ch/CH-05/lot2/ch05b.js`, `build.py` (A0, B1-B9), `test_ch05b.js`.
- **Contenu** : `ch05bRoleGroups`, `ch05bRoleGroup`, `ch05bCodes` / `ch05bParse` (purs), `CH05B_DECL` (ordre de déclaration § 4.18.3) (§ 4.9) ; `ch05bImportable` (pure), `ch05bImportMembers`, `ch05bDelMember` (§ 4.10) ; `ch05bContractors`, `ch05bContractorRows` (pure), `CH05B_CDOCS`, `ch05bCopyMember`, `ch05bImportContractors` (§ 4.11).
- **Tests** : T9-T11 ; essai B10-B14.
- **Dépendances** : lot 1 (entrées « Attribuer les collaborateurs d'affaire … » et « Groupes de rôles … », `CH05_MSG`, `ch05aInit`, `ch05aDoc`).

### Lot 3 — Plans comptables, affectations et locaux (préfixe `ch05c` / `CH05C`, port 8022)

- **Fichiers** : `ch/CH-05/lot3/ch05c.js`, `build.py` (A0 seulement), `test_ch05c.js`.
- **Contenu** : `ch05cCatalogs`, `ch05cHas` (pure), `ch05cCopyPos` (pure, règle licence), `ch05cStdPick`, `ch05cStdPos` (pure), `ch05cCatalog`, `ch05cPos` (§ 4.12) ; `ch05cZones`, `ch05cZone` (§ 4.13).
- **Tests** : T12-T15 ; essai B15-B17.
- **Dépendances** : lot 1 (entrées de menu, `CH05_MSG`, `ch05aInit`).

### Lot 4 — Import d'heures, « Liste des affaires [Ancien document] », modèles et dossiers (préfixe `ch05d` / `CH05D`, port 8023)

- **Fichiers** : `ch/CH-05/lot4/ch05d.js`, `build.py` (A0 seulement), `test_ch05d.js` et un fichier CSV d'essai sans donnée personnelle (initiales remplacées par celles des comptes d'essai de la copie).
- **Contenu** : `ch05dImportTimes`, `ch05dSep`, `ch05dParseTimes` (pure : lecture, vérification, Info) (§ 4.14) ; `ch05dListWizard`, `ch05dListPrefs`, `ch05dListRows` (pure) (§ 4.15) ; `ch05dTemplates`, `ch05dDocGroups` (pure) (§ 4.16) ; `ch05dFiles`, `ch05dFolders` (§ 4.17).
- **Tests** : T16-T20 ; essai B18-B21.
- **Dépendances** : lot 1 (entrées de menu, `CH05_MSG`, `ch05aInit`).

### Non livré (et pourquoi)

| Élément | Raison |
|---|---|
| « Rôle secondaire » | invisible dans Deltaproject 16.05 (§ 1 n° 3) |
| `SelectBkpLanguageDialog`, « CFC par chapitre » | sans appelant ; EC-1 |
| Import en ligne des plans CRB ; niveaux eCCC 4-5 et `HINT` | service et contenu sous licence CRB |
| Ouverture ou parcours de dossiers locaux (« Définir le chemin relatif / absolu », « Afficher le dossier ») | impossible dans un navigateur : chemin saisi et copié |
| Documents `.dpdoc` `projectList` et `projectMemberList` | CH-09 (appelés par `ch05aDoc`) |
| Étiquettes, vCard, assistant « Liste d'adresses » (type 11) | CH-04 (appelés par `typeof`) |
| Inscription automatique des entreprises par le contrôle des coûts | CH-07 (§ 8 n° 1) |
| Ordre des rôles par affaire, « Mes affaires » par utilisateur | hors fiche (§ 8 n° 3-4) |
| Protection au ré-import des saisies de ce chantier | changement de politique du serveur (§ 11 n° 4) |

---

## 11. Décisions restantes pour Paulo

1. **Lecture de D5.** Le domaine « Liste d'adresses » quitte la liste des domaines ; ses impressions « Liste d'adresses » et « Liste d'adresses par CFC » restent dans Intervenants ▸ Documents ; « Entrepreneurs » prend la 3ᵉ place. CH-04 a compris « garder le domaine et ajouter Entrepreneurs ». **Par défaut : domaine retiré** (une ligne, ancre B7, à rétablir si Paulo préfère garder les deux domaines).
2. **Contrôles du statut « Configuration » de l'original** (suppression d'un intervenant, d'un groupe d'activités, d'une activité, d'un collaborateur d'une activité, d'un plan, d'une affectation, d'un local ; imports). Au bureau, **une seule affaire** est au statut 1 (701) : ces suppressions demanderont de repasser l'affaire en « Configuration » (fiche affaire), comme dans Deltaproject. **Par défaut : fidèle.** Variante : n'appliquer le statut qu'aux imports.
3. **Plans sous licence** (4 « eCCC-Bât » et 1 « BKP » 2017) : non éditables, copie d'une autre affaire limitée aux niveaux 1-3 sans `HINT` (règle de spec_12). L'original copie tout et les édite avec la licence « CAN et CFC » du bureau. **Par défaut : restreint.**
4. **Reprise Deltaproject** : une reprise `--force` remplace les configurations et les heures saisies dans DeltaSub (groupes de rôles, plans, affectations, locaux, activités et tarifs importés, heures importées), comme aujourd'hui. Faut-il protéger ces collections (`PROTECTED_IF_EDITED` du serveur) ? **Par défaut : pas de changement dans CH-05** ; à traiter avec toutes les saisies lors de la bascule.
5. **Filtre de la Gestion** : retirer les choix DeltaSub « Affaires internes » / « Affaires externes » et la case de la roue (fidèle) ; le filtre interne / externe reste disponible dans « Toutes les affaires ▸ Editer le filtre ». **Par défaut : retirés.**
6. **Favoris de l'assistant « Liste des affaires »** : un jeu par poste (`localStorage`, fidèle) plutôt qu'un jeu partagé par le bureau. **Par défaut : par poste**, à aligner avec l'assistant d'adresses de CH-04.

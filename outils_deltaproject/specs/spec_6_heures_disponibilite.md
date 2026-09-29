# Cahier des charges — HEURES ▸ Disponibilité (DeltaSub)

Il s'agit de reproduire dans DeltaSub deux éléments de Deltaproject :

- l'écran **HEURES ▸ Disponibilité** (clé de module `module_timePlanning`, classe `deltaproject.time.PlanningFrame`) ;
- sa saisie, dans **COLLABORATEURS ▸ clé ▾ ▸ Disponibilité…**.

**Conventions**

- **[P]** = PROUVÉ. La source est citée : bytecode javap (`classe.méthode @offset`), libellé Strings.db (`paquet|classe|id`), ligne CSV ou page de manuel.
- **[D]** = DÉDUIT (interprétation).
- Les collaborateurs sont désignés par leur STAFF_ID, les affaires par leur PROJECT.ID. Aucun nom n'est reproduit.

**Fichiers de travail**

- Dans `…/scratchpad/research/critique/` :
  - javap : `Modules_Module.txt`, `MenuTree*.txt`, `StaffTableModel.txt`, `Tables.txt`, `TablePopup.txt`, `ReportCellRenderer.txt`, `CellRenderer.txt`, `Formatter.txt`, `Reports.txt`, `Integrity.txt` ;
  - script de vérification : `verif_rapports.py`.
- javap déjà produits : `…/research/planningframe/` et `…/research/dispo_dialogs/`.

---

## §1 Rôle de l'écran et place dans le module Heures

### 1.1 Place dans le menu

HEURES compte trois sous-modules, dans cet ordre :

1. « Saisie » (`timeRecord`) ;
2. « Rapport » (`timeAnalyze`) ;
3. « Disponibilité » (`timePlanning`).

Preuves [P] :

- `deltaproject.Modules$Module.<clinit>` : ordinals 15, 16 et 17, tous rattachés à `Modules$Menu.time`.
- Libellés `deltaproject|Modules|module_timeRecord` = « Saisie », `module_timeAnalyze` = « Rapport », `module_timePlanning` = « Disponibilité » (allemand « Projektverfügbarkeit »).
- `MenuTree` @362 appelle `PlanningFrame.setFrame`.
- Manuel allemand v16, capture p.42 : STUNDEN ▸ Erfassen / Auswerten / Projektverfügbarkeit.

### 1.2 Licence et droits

- [P] `timePlanning` est construit avec `(Menu.time, true)`. Il suffit donc de la licence de base DELTAproject ; le module est aussi visible en DELTAlimited (`Modules$Module.isVisible`).
- [P] **Aucune licence DELTAplanning n'est requise.** C'est une différence avec MANAGEMENT ▸ Planification RH (`managementPlanning`), qui est construit avec `AppLicenceModules$Module.DELTAplanning`.
- [P] Le seul droit contrôlé est celui du menu HEURES (`Modules$Menu.getRequiredRight`, `MenuTree` @62).

### 1.3 Fonction

L'écran sert **uniquement à consulter**, par collaborateur et par année (ou par mois pour l'un des rapports) :

- la disponibilité mensuelle saisie (STAFFPROJECTTIME) et sa décomposition ;
- les heures planifiées par le chef de projet (DELTAplanning, PLANNINGASSIGNMENT) ;
- les travaux planifiés d'un mois, avec leur « cahier des charges » (note) ;
- la comparaison entre la disponibilité et les heures réellement saisies sur les affaires (TIMELOG).

[P] Preuves que l'écran ne modifie rien :

- PlanningFrame ne référence aucun des dialogues `StaffProjectTime*Dialog` et ne fait aucun `persist`, `merge` ou `remove`.
- Sa seule action à la souris est le double-clic sur une ligne du rapport « Heures planifiées et cahier des charges », qui affiche la note (`jReportTableMouseClicked`).

### 1.4 Lien avec Collaborateurs ▸ Disponibilité

- Les chiffres se saisissent **uniquement** dans COLLABORATEURS, bouton clé ▾ → « Disponibilité… » (voir §4).
- [P] Seules deux méthodes créent des STAFFPROJECTTIME, d'après une recherche dans tout le jar : `StaffProjectTimeDialog.newStaffProjectTime` et `StaffProjectTimeYearDialog.newStaffProjectTimes`.
- HEURES ▸ Disponibilité relit ces enregistrements à chaque affichage.

### 1.5 Ce que disent les manuels

- [P] Le manuel français v14 (`manual_fr.pdf`) ne parle pas de cet écran. Le texte extrait ne contient ni « disponib… » (hors sens courant), ni « Travail interne », ni « Résultat calculé » ; en p.30, HEURES ne compte que Saisie et Rapport.
- [P] Le manuel allemand v16 (`manual_de.pdf`) le décrit p.38–44, chapitre « Projektplanung » :
  - p.38 : fenêtres de saisie de la disponibilité ;
  - p.42 : capture de l'écran, vue « Geplante Projektarbeiten ».

---

## §2 Disposition exacte

### 2.1 Structure générale

[P] `PlanningFrame.initComponents` :

- `jTopSplitPane`, séparation verticale entre gauche et droite, séparateur à **240 px** par défaut (`loadPreferences` @4). Sa position est mémorisée (préférence `planning.Preferences`, module time).
- **À gauche** (`jLeftSplitPane`) : un petit panneau d'outils vide en haut, puis la **liste des collaborateurs** (`jStaffTable`).
- **À droite** (`jRightSplitPane`) : la **barre d'outils** en haut (`jRightToolsPanel`), puis le **tableau du rapport** (`jReportTable`).

### 2.2 Liste des collaborateurs

**Colonne**

- [P] Une seule colonne, « Collaborateur » : `db.StaffTableModel(list, isSmallTable=true)` donne `getColumnCount()=1`, et l'en-tête vient de `db|StaffTableModel|employee`.
- La valeur affichée est `Contact.getContactOwnerDesc()`, le nom de l'entité (« Prénom Nom » sur la capture DE p.42).

**Contenu**

- [P] La liste contient `Security.getAppUser().getStaffs()` (`setStaffTable` @4–11). Ce sont les lignes APPUSER_STAFF de l'utilisateur connecté, **actifs et inactifs confondus**.
- [P] C'est la même liste, avec la même préférence de tri (`employeeTimeAnalyzeStaffListRowSorter`), que HEURES ▸ Rapport (`AnalyzeFrame` @2022–2061).
- [P] Dans les données du bureau (APP.APPUSER_STAFF) :
  - l'utilisateur 2752 voit 11 collaborateurs : 2751, 2752, 2753, 2754, 2755, 2757, 2801, 2851, 2901, 3051 et 3101, dont 6 inactifs ;
  - les utilisateurs 2753, 2754, 2755, 3001, 3201, 3251, 3301 et 3351 ne voient chacun que leur propre collaborateur ;
  - les utilisateurs 1 et 2 n'en voient aucun.

**Sélection**

- [P] **Sélection unique**, tri par clic sur l'en-tête : `Tables.initTable(table, listener, true)` fait `setSelectionMode(0)` (SINGLE_SELECTION) et `setAutoCreateRowSorter(true)`.
- [P] La sélection est restaurée à l'entrée dans le module et mémorisée à chaque changement (`StaffTableModel.selectStaff` / `storeSelectedStaff`). La préférence `lastStaffSelection` (module project) est commune à tous les écrans qui utilisent `StaffTableModel`.

### 2.3 Barre d'outils

[P] Contrôles de gauche à droite (GroupLayout horizontal @1111–1256, police Lucida Grande 11) :

| # | Contrôle | Détail |
|---|---|---|
| 1 | Liste des types de rapport (`jReportTypeComboBox`, largeur max. 160 px) | 4 entrées dans l'ordre de `PlanningFrame$ReportType` : « Heures disponibles » (`projectTimeReport`), « Heures planifiées » (`projectPlanningAssigmentReport`), « Heures planifiées et cahier des charges » (`projectPlanningAssigmentMonthReport`), « Solde des heures disponibles » (`projectTimeLogReport`). Libellés : `deltaproject.time\|PlanningFrame\|<id>`. |
| — | espace de 18 px | |
| 2 | Bouton `<` (mois précédent) | |
| 3 | Liste des 12 mois (`jMonthComboBox`, max. 110 px) | Noms longs `Strings.getMonthName(0..11)`, en `Locale.FRENCH` : « janvier » … « décembre » (minuscules, [D] d'après DateFormatSymbols français). |
| 4 | Bouton `>` (mois suivant) | |
| — | espace de 18 px | |
| 5 | Bouton `<` (année précédente) | |
| 6 | Année affichée (`jYearLabel`) | |
| 7 | Bouton `>` (année suivante) | |
| — | espace de 18 px | |
| 8 | Bouton document ▾ (`jReportsButton`, icône `reportsDropDown`) | Menu d'**une seule** entrée : « Afficher le rapport… » (`rsrc\|Strings\|showReport` + points de suspension). Voir §5. |
| 9 | Bouton roue ▾ (`jWheelButton`, icône `wheelDropDown`) | Menu `TablePopup.addExportPopupMenuItems` : « Copier le contenu du tableau dans le presse-papier » et « Exporter le tableau dans un fichier CSV… » (`util.table\|TablePopup\|exportTableClipboard`, `exportTableCSV`). Les deux entrées ne sont actives que si le tableau a au moins une ligne. |

[P] Il n'y a ni bouton « Aujourd'hui » ni champ de recherche (vérifié sur la liste complète des champs de la classe).

### 2.4 Activation des contrôles

[P] `checkGuards` @0–162. Ci-dessous, S signifie « un collaborateur est sélectionné ».

| Contrôle | Actif si |
|---|---|
| `<` mois, liste des mois, `>` mois | S **et** type = « Heures planifiées et cahier des charges » |
| `<` année, année, `>` année | S |
| Bouton document ▾ et son entrée « Afficher le rapport… » (`getReportsPopupMenu` @17–94) | S **et** type = « Heures disponibles » ou « Solde des heures disponibles » |
| Roue ▾ | toujours (ses entrées : seulement si le tableau n'est pas vide) |
| Liste des types | toujours |

### 2.5 État initial et navigation

- [P] Au démarrage (constructeur @114–196), `Calendar.add(MONTH,-1)` place l'**année et le mois sur le mois précédant la date du jour**. Exemples : le 29.09.2026, on arrive sur août 2026 ; en janvier, sur décembre de l'année précédente.
- [P] Le type affiché est le dernier utilisé (index mémorisé dans `planningFrame.LastSelectedReportType`, module time). À défaut, c'est « Heures disponibles ».
- [P] Boutons `<` / `>` du mois : mois précédent ou suivant. De janvier, on passe à décembre de l'année précédente ; de décembre, à janvier de l'année suivante (`jPrevMonthButtonActionPerformed`, `jNextMonthButtonActionPerformed`).
- [P] Boutons `<` / `>` de l'année : ±1 an, sans changer de mois.
- [P] Le tableau est entièrement recalculé (`setReportTable`) dans les cas suivants :
  - changement de collaborateur, de type, de mois ou d'année ;
  - retour dans le module (`setFrame` @19–22).

  L'écran n'écoute pas les modifications faites ailleurs.
- [P] Le tableau du rapport **ne se trie pas** (`initTable(jReportTable, …, false)`). Sélectionner une ligne n'a aucun effet, sauf le double-clic du §3.3.

### 2.6 Rendu des cellules à l'écran

**Nombres**

- [P] Format `util.Formatter.formatDouble` : motif `#,###,##0.00`, séparateur de milliers apostrophe (le `’` typographique est remplacé par `'`), alignement à droite.
- [P] Arrondi `Formatter.round` : `Math.round(|v|×100)/100`, puis le signe est rétabli. Les demis sont donc arrondis **en s'éloignant de zéro**, et « −0.00 » n'apparaît jamais.
- [P] **Zéro s'affiche « 0.00 »** ; une valeur absente (null) donne une cellule vide (`CellRenderer` @216–281).
- [P, calcul] Conséquence : 8.715 s'affiche « 8.72 » dans Deltaproject, comme sur la capture DE p.38. `toFixed(2)` donnerait « 8.71 ».

**Style**

- [P] `ReportCellRenderer` :
  - lignes « grasses » : police grasse ;
  - lignes « surlignées » : fond `rgba(20,20,20,40/255)`, soit un gris léger ;
  - couleur de texte par cellule : vert `rgb(0,143,0)` ou rouge `rgb(255,0,0)`.

**Colonnes**

- [P] Rapports 3.1, 3.2 et 3.4 : une colonne de texte « Désignation », puis 12 colonnes de mois à noms longs (« janvier » … « décembre »).
- [P] Rapport 3.3 : 5 colonnes.

---

## §3 Les quatre types de rapport

**Règles communes aux rapports 3.1, 3.2 et 3.4** [P] :

- 13 colonnes exactement (`columnNames` compte 13 entrées) : **pas de colonne Total ni de total annuel**.
- La période est l'année affichée ; le mois de la barre d'outils est ignoré.

### 3.1 « Heures disponibles » (`ProjectTimeTableModel`)

**Données**

[P] `staff.getStaffProjectTimes(année)` : les STAFFPROJECTTIME du collaborateur dont TIMEYEAR = année (`ProjectTimeTableModel.<init>` @36–62, `Staff.getStaffProjectTimes(int)`).

**Lignes**

Toujours 8 lignes, dans l'ordre de `ProjectTimeTableModel$RowType` [P]. Libellés : `deltaproject.time|ProjectTimeTableModel|<id>`.

| # | Libellé | Valeur du mois m (enregistrement de TIMEMONTH = m) | Gras et surligné |
|---|---|---|---|
| 1 | Heures prévues | `getTargetTime()` = STAFFTARGETTIME(STAFF_ID, TIMEYEAR).TARGETHOURS{m} brut. Vaut 0 s'il n'existe pas de fiche STAFFTARGETTIME pour l'année. Pas de repli sur TARGETTIME ; OVERTIME et TARGETTIMEREDUCTION ne sont pas pris en compte. | oui |
| 2 | Déduction sur les heures prévues | DEVIATION | |
| 3 | Vacances | HOLIDAY | |
| 4 | Formation | EDUCATION | |
| 5 | Militaire, service civil | OFFICIALABSENCE | |
| 6 | Autres absences | OTHERABSENCE | |
| 7 | Travail interne | INTERNALTIME | |
| 8 | Disponibilité du collaborateur | **TIMEBUDGET tel qu'il est stocké** (`getTimeBudget`, sans recalcul) | oui |

Preuves [P] : `ProjectTimeTableModel$ReportRow.<init>` (tableswitch @64–207) ; `RowType.isBold` est vrai pour `targetTime` et `timeBudget` ; `getHighlightedRows()` renvoie la même liste que `getBoldRows()`.

**Particularités**

- Il n'y a pas de ligne « Résultat calculé » : un écart éventuel entre TIMEBUDGET et le calcul n'apparaît pas.
- Mois sans enregistrement : les 8 cellules du mois sont vides.
- Aucun collaborateur sélectionné (cas théorique) : 8 lignes vides.

### 3.2 « Heures planifiées » (`ProjectPlanningAssignmentTableModel`)

**Données**

- Les STAFFPROJECTTIME de l'année et leurs PLANNINGASSIGNMENT (via `STAFFPROJECTTIME_ID`).
- [P] Chemin vers l'affaire (@265–289) : PLANNINGASSIGNMENT.PLANNINGTIME_ID → PLANNINGTIME.PLANNINGROLE_ID → PLANNINGROLE.PLANNINGSUBPROJECT_ID → PLANNINGSUBPROJECT.PROJECT_ID.
- [P] Le mois retenu est celui du STAFFPROJECTTIME, pas celui de PLANNINGMONTH (@361).

**Lignes**

[P] Ordre de `<init>` @37–760. Libellés : `deltaproject.time|ProjectPlanningAssignmentTableModel|<id>`.

1. « Disponibilité du collaborateur [h] » (`timeBudget`) : TIMEBUDGET du mois, vide s'il n'y a pas d'enregistrement. Gras et surligné.
2. Une ligne par affaire planifiée :
   - libellé : **PROJECT.TITLE seul** (`Project.getTitle`) ;
   - valeur : somme des PLANNINGASSIGNMENT.TIMEPERIOD du mois, vide s'il n'y en a aucune.
3. « Heures planifiées [h] » (`total`) : somme des lignes d'affaire. Vaut **0.00 pour chaque mois** sans planification (le tableau est initialisé à 0). Gras et surligné.
4. « Solde disponible [h] » (`available`) : TIMEBUDGET moins la somme des lignes d'affaire. Calculé seulement si TIMEBUDGET existe, vide sinon (`subtractMonthValuesFrom`). Surligné, non gras.

**Couleurs** [P] `setCellColors`

- Sur la dernière ligne : texte **vert si > 0, rouge si < 0**, aucune couleur si = 0.
- La boucle va de la colonne 1 à la colonne 11 (`i < getColumnCount()-1`) : **décembre n'est jamais coloré**. C'est un défaut de Deltaproject.

**Ordre des lignes d'affaire** : parcours d'une `HashMap<Integer id, …>`, voir §8-1.

**Données du bureau** [P] : les tables PLANNING* sont vides. Le rapport compte donc 3 lignes : Disponibilité, Heures planifiées (0.00 sur les 12 mois) et Solde (= TIMEBUDGET, vide s'il n'y a pas d'enregistrement).

### 3.3 « Heures planifiées et cahier des charges » (`ProjectPlanningAssignmentMonthTableModel`)

**Période et données**

- La période est **un mois** : le mois et l'année de la barre d'outils.
- [P] Données : `staff.getStaffProjectTime(année, mois).getPlanningAssignments()`, liste vide s'il n'y a pas d'enregistrement pour ce mois (`setReportTable` @206–253).
- Ordre : celui de la relation JPA, sans `@OrderBy` ([D] ordre des ID).

**Colonnes**

[P] `<clinit>`. Libellés : `…|ProjectPlanningAssignmentMonthTableModel|<id>`.

| Colonne | Valeur | Type |
|---|---|---|
| Affaire | PROJECT.NUMBER + « » + PROJECT.TITLE de PLANNINGMONTH.PROJECT_ID (via PLANNINGTIME.PLANNINGMONTH_ID) | texte |
| Ouvrage | SUBPROJECT.CODE de PLANNINGMONTH.SUBPROJECT_ID | texte |
| Phase partielle | PROJECTSUBPHASE.NUMBER + « » + NAME de PLANNINGMONTH.SUBPHASE_ID | texte |
| Durée | PLANNINGASSIGNMENT.TIMEPERIOD | nombre, aligné à droite |
| Cahier des charges | PLANNINGASSIGNMENT.NOTE | texte |

[P] Les concaténations utilisent la recette `"\u0001 \u0001"` (BootstrapMethods, `javap -v`).

**Comportement**

- Pas de ligne de total, ni gras, ni surlignage, ni couleur.
- [P] Double-clic gauche sur une ligne dont la note n'est pas vide (`jReportTableMouseClicked`, `PlanningNoteInfoDialog`) : ouvre une petite fenêtre modale sans bordure, placée au pointeur, qui affiche la note en lecture seule, avec un bouton « Fermer » (bouton par défaut, aussi sur Échap).
- Si NOTE est null, Deltaproject lève une exception (`getNote().isEmpty()`) : ne pas reproduire.
- Pas d'impression (voir §2.4).
- Données du bureau : tableau toujours vide.

### 3.4 « Solde des heures disponibles » (`ProjectTimeLogTableModel`)

**Données**

- Les STAFFPROJECTTIME de l'année.
- [P] La requête nommée `TimeLog.monthlyProjectReportForStaffAndYear` (texte JPQL extrait de `db/TimeLog.class`) :

  ```
  SELECT t.project, t.timeMonth, SUM(t.timePeriod) FROM Staff s INNER JOIN s.timeLogs t
  WHERE s.id = :staffId AND t.timeYear = :year AND t.project.isInternal = FALSE
  GROUP BY t.project, t.timeMonth
  ```

  Elle prend toutes les heures TIMELOG du collaborateur et de l'année qui portent sur une **affaire non interne** (PROJECT.ISINTERNAL = 0).
- Exclus : les vacances (ISHOLIDAY = 1, sans PROJECT_ID) et l'affaire interne.
- [P données] **Inclus** : les heures de l'affaire 501, qui a ISINTERNAL = 0 (travaux de bureau, maladie, formation…).

**Lignes**

[P] Ordre de `<init>` @47–927. Libellés : `…|ProjectTimeLogTableModel|<id>`.

| # | Libellé | Valeur du mois m | Style |
|---|---|---|---|
| 1 | Disponibilité pour les affaires (`timeBudget`, sans « [h] » en français) | TIMEBUDGET, vide s'il n'y a pas d'enregistrement | gras et surligné |
| 2 à k | une ligne par affaire, libellé = PROJECT.TITLE seul | SUM(TIMEPERIOD) du mois, vide si aucune heure | normal |
| k+1 | Total des heures effectuées [h] (`total`) | somme des lignes d'affaire ; **0.00 si aucune heure** | gras et surligné |
| k+2 | Part effectuée [%] (`rate` + recette `"\u0001 [%]"`) | vide si TIMEBUDGET est vide ou nul ; sinon Total ÷ TIMEBUDGET × 100 (`ddiv` puis `dmul 100.0`, @780–857) | normal ; texte **rouge si < 80** (`RATE_RED_LIMIT = 80`) |
| k+3 | Solde du temps disponible [h] (`available`) | TIMEBUDGET moins la somme des lignes d'affaire, seulement si TIMEBUDGET existe (vide sinon) ; peut être négatif ; jamais coloré | surligné |

**Particularités**

- [P] Rouge de « Part effectuée » :
  - à l'écran (`setCellColors`, ligne n−2), seules les colonnes 1 à 11 sont testées : **décembre n'est jamais en rouge** ;
  - à l'impression (`fillTable` @139–184), les 12 mois sont testés.
- Les heures d'affaires s'affichent même sans aucun STAFFPROJECTTIME : les lignes 1, k+2 et k+3 sont alors vides.
- Ordre des lignes d'affaire : `HashMap`, voir §8-1.

### 3.5 Cas limites

Tous [P] sauf mention contraire.

| Cas | Comportement |
|---|---|
| Aucun collaborateur sélectionné | 3.1 : 8 lignes vides. 3.2 : Disponibilité vide, Heures planifiées à 0.00 sur 12 mois, Solde vide. 3.3 : tableau vide. 3.4 : Disponibilité vide, Total à 0.00 sur 12 mois, Part et Solde vides. Année et impression désactivées. Au tout premier affichage sans sélection mémorisée, Deltaproject laisse même le tableau sans colonnes jusqu'au premier choix (`isInitializing`). DeltaSub sélectionne d'office un collaborateur (voir §7). |
| Plusieurs collaborateurs | impossible (sélection unique) |
| Collaborateur inactif | affiché s'il figure dans APPUSER_STAFF, et traité comme les autres |
| Pas de STAFFTARGETTIME pour l'année | 3.1 : « Heures prévues » = 0.00 dans les mois qui ont un enregistrement |
| Mois sans STAFFPROJECTTIME | cellules vides (3.1) ; Disponibilité, Part et Solde vides (3.2, 3.4) ; Total = 0.00 |
| TIMEBUDGET = 0 | Part effectuée vide (pas de division) ; Solde = −Total |
| Heures sur l'affaire interne, ou vacances | exclues de 3.4 |
| STAFFTARGETTIME modifié après la saisie | TIMEBUDGET ne change pas (valeur figée) ; seule la ligne « Heures prévues » change |
| Totaux annuels | aucun, dans aucun rapport |

---

## §4 Édition des disponibilités (COLLABORATEURS ▸ clé ▾ ▸ « Disponibilité… »)

Tout ce paragraphe est [P] sauf mention contraire. Classes vérifiées dans `…/research/dispo_dialogs/` : EmployeeFrame, StaffProjectTimesDialog, StaffProjectTimeDialog, StaffProjectTimeYearDialog, db.StaffProjectTime.

### 4.1 Point d'entrée

- Menu du bouton clé ▾ (`jEditMoreStaffButton`, `addEditPopupMenuItems(menu, false)`), dans cet ordre :
  1. « Coût de revient… » (`editStaffRates`)
  2. « Durée prévue… » (`editStaffTargetTimes`)
  3. « Vacances… » (`editStaffHoliday`)
  4. **« Disponibilité… »** (`editStaffProjectTimes`)
  5. séparateur
  6. « Verrouillage des heures… » (`editStaffWorkTime`)
  7. séparateur
  8. « Participation aux affaires… » (`editStaffProjectMembers`)

  Les libellés prennent les points de suspension via `mapStringWithEllipsis`.
- Le menu contextuel de la liste (`addStaffInfoPopupMenuItems` → `addEditPopupMenuItems(menu, true)`) ajoute « Modifier… » en tête.
- « Disponibilité… » n'est actif que si **un seul** collaborateur est sélectionné et que le bouton clé est actif (droits).

### 4.2 Fenêtre liste « Disponibilité » (`StaffProjectTimesDialog`)

**Disposition** (fenêtre modale, de haut en bas) :

1. « Collaborateur » : champ non modifiable (`getContactDesc()`), avec un bouton info qui ouvre la fiche d'adresse.
2. Titre « Heures disponibles pour les affaires ».
3. Le tableau.
4. Boutons **+ ▾**, **crayon** (Modifier) et **−**.
5. Bouton « Fermer » (bouton par défaut, aussi sur Échap).

**Tableau** (`db.StaffProjectTimeTableModel`, 13 colonnes)

« Année » | « Mois » (nom long) | « Heures prévues » | h | « Vacances » | h | « Formation » | h | « Travail interne » | h | « Disponibilité » | h | « Remarque »

- Les colonnes « h » ont un en-tête vide et affichent l'unité.
- « Heures prévues » = `getTargetTime()` (calculé) ; « Disponibilité » = TIMEBUDGET.
- DEVIATION, OFFICIALABSENCE et OTHERABSENCE n'apparaissent pas dans la liste.

**Comportement**

- Tri du plus récent au plus ancien (`@OrderBy("timeYear DESC, timeMonth DESC")`).
- Double-clic = Modifier.
- Crayon et − ne sont actifs que si une ligne est sélectionnée.

### 4.3 Menu du bouton + ▾ (`getNewStaffProjectTimePopupMenu`)

1. Douze entrées « <mois> <année> » (recette `"\u0001 \u0001"`, par exemple « janvier 2026 », [D] en minuscules) :
   - l'année est celle de la ligne sélectionnée, sinon l'année en cours ;
   - un mois déjà saisi est **désactivé** ;
   - un clic ouvre la fiche mensuelle sur ce mois.
2. Séparateur, puis « Nouvelle saisie… » (`Strings.newItem`) : ouvre la fiche mensuelle sans année ni mois. Le dialogue part du mois courant et avance jusqu'au premier mois libre (`setNextAvailableYearAndMonth(null)` @0–243).
3. Séparateur, puis « Année AAAA… » : AAAA est la première année ≥ l'année en cours qui n'a **aucun** enregistrement (@258–301). Ouvre la fenêtre « Travail interne » (§4.5), puis recharge la liste.

### 4.4 Fiche mensuelle « Heures disponibles pour les affaires » (`StaffProjectTimeDialog`)

Fenêtre modale de taille fixe. Libellés : `deltaproject.employee|StaffProjectTimeDialog|<id>`. L'unité « h » s'affiche à droite des lignes 3 à 11.

| # | Libellé | Contrôle | Particularités |
|---|---|---|---|
| 1 | Année | lecture seule | bouton ▾ (année −1 / +1), visible seulement pour « Nouvelle saisie… » |
| 2 | Mois | lecture seule (nom long) | bouton ▾ (12 mois, ceux déjà saisis grisés), visible seulement pour « Nouvelle saisie… » |
| 3 | Heures prévues | lecture seule | STAFFTARGETTIME(année, mois du dialogue).TARGETHOURS{mois}, sinon 0 (`setYearMonthAndTargetTime`) |
| 4 | Déduction sur les heures prévues | nombre | DEVIATION |
| 5 | Vacances | nombre | HOLIDAY |
| 6 | Formation | nombre + ▾ | EDUCATION. Le menu ▾ propose « Choisir… » (navigateur des collaborateurs actuels) puis « x h (INITIALES) », qui recopie la valeur EDUCATION de ce collègue pour le même mois. Le collègue choisi reste mémorisé (variable statique `staffCopyFrom`). |
| 7 | Militaire, service civil | nombre | OFFICIALABSENCE |
| 8 | Autres absences | nombre | OTHERABSENCE |
| 9 | Travail interne | nombre + ▾ | INTERNALTIME. Le menu ▾ propose 5, 10, 15, 20, 25, 30, 40 et 50 % des heures prévues (libellé « 12.50 h (5 %) ») ; le choix remplit le champ puis relance le calcul. |
| 10 | Résultat calculé | lecture seule | voir la formule ci-dessous |
| 11 | **Disponibilité** | nombre + ▾ | TIMEBUDGET. Suggestions : R, puis, si R ≥ 0, 10·⌊R/10⌋, ⌊R⌋, ⌈R⌉ et 10·⌈R/10⌉ (sans doublons, séparateur après la 1re) ; libellé « x h ». Marque rouge « Cette entrée doit être mise à jour. » |
| 12 | Note interne | zone de texte | REMARK, 1024 caractères au maximum ; espaces de début et de fin retirés à l'enregistrement |
| 13 | OK (bouton par défaut) / Annuler (Échap) | | |

**Saisie des nombres** : décimaux, signe moins autorisé, apostrophe acceptée comme séparateur de milliers. Un champ vide ou illisible vaut 0. Affichage `1'234.50`.

**Formule** (`db.StaffProjectTime.getAvailableTime` @0–36 et `calcAvailableTime` @0–98, six soustractions `dsub`) :

> **Résultat calculé = Heures prévues − Déduction − Vacances − Formation − Militaire, service civil − Autres absences − Travail interne.**

**Recalcul et marque « à mettre à jour »**

- Le résultat est recalculé à chaque frappe dans les lignes 4 à 9.
- Toute modification de ces lignes **marque la Disponibilité « à mettre à jour »** : le texte rouge s'affiche et OK est désactivé.
- Taper dans « Disponibilité » ou choisir une de ses suggestions efface la marque.
- La Disponibilité n'est **jamais** recopiée automatiquement.

**Pré-remplissage**

- Enregistrement existant : ses valeurs.
- Nouvel enregistrement : tout à 0, Disponibilité comprise, sans marque.
- « Résultat calculé » affiche au départ `getAvailableTime()`.
- Les vacances ne sont **jamais pré-remplies** depuis TIMELOG : la saisie est manuelle, en heures.

**Validation** (`checkGuards` @0–57)

OK n'est actif que si les trois conditions sont réunies :

- l'année et le mois sont définis ;
- la Disponibilité n'est pas marquée « à mettre à jour » ;
- la Disponibilité est ≥ 0.

Il n'y a aucun autre contrôle : les déductions peuvent être négatives.

**OK** (@0–159)

- Enregistre TIMEYEAR, TIMEMONTH (0–11), les 6 déductions, **TIMEBUDGET = la valeur du champ Disponibilité** et REMARK.
- Nouvel enregistrement : création. Modification : l'enregistrement est relu avant l'ouverture de la fiche, puis enregistré.

### 4.5 Fenêtre « Travail interne » (création d'une année, `StaffProjectTimeYearDialog`)

**Disposition** (fenêtre modale)

- « Année » (lecture seule) ;
- titre « Heures prévues par mois pour le travail interne » ;
- trois boutons radio :
  - « Aucun » (**coché par défaut**) ;
  - « En heures » : [champ] h + ▾ (5, 10, 15, 20 h) ;
  - « En pourcentage » : [champ] % + ▾ (5, 10, 15, 20, 25 %) ;
- OK et Annuler.

Le champ et le bouton ▾ d'une option ne sont actifs que si elle est cochée. Les champs valent 0 au départ. **OK est toujours actif.**

**OK** : `newStaffProjectTimes(staff, année, heures|null, taux|null)` @0–235, en une seule transaction. Pour chaque mois 0 à 11 **absent** de l'année, prévu = STAFFTARGETTIME(année).TARGETHOURS{m}, ou 0 :

| Option | INTERNALTIME | TIMEBUDGET |
|---|---|---|
| Aucun | 0 | prévu |
| En heures (h) | h | prévu − h |
| En pourcentage (p) | prévu × p / 100 (dans cet ordre) | prévu − INTERNALTIME |

- Les autres champs valent 0 et REMARK reste vide.
- **Aucun contrôle ≥ 0** : TIMEBUDGET est négatif si prévu < h.
- L'option choisie **n'est enregistrée nulle part**.

### 4.6 Suppression (bouton −)

- **Enregistrement utilisé par une planification** (PLANNINGASSIGNMENT) : suppression refusée, message « Cette inscription est déjà utilisée et ne peut pas être supprimée. » (`rsrc|Strings|msgEntryIsNotDeletable0/1`), titre « Information ».
- **Sinon** : confirmation « Voulez-vous vraiment supprimer cette inscription ? » (titre « Avertissement »), puis suppression.
- **Suppression d'un collaborateur** : refusée s'il a des STAFFPROJECTTIME (`db.Integrity.isStaffDeletable` → `StaffProjectTime.getStaffProjectTimeCount`), avec le même message `msgEntryIsNotDeletable`.

### 4.7 Défauts de Deltaproject à ne pas reproduire

- [P] **Mauvais mois de référence.** `calcAvailableTime` et le menu « Travail interne » s'appuient sur `staffProjectTime.getTargetTime()`, donc sur l'année et le mois **de l'enregistrement**. Or l'enregistrement ne reçoit le mois du dialogue qu'au clic sur OK. Avec « Nouvelle saisie… » (enregistrement créé à la date du jour), ou après un changement de mois par ▾, le Résultat et les pourcentages portent sur un autre mois que les « Heures prévues » affichées. Dans DeltaSub, toujours utiliser le mois affiché.
- [P] **Disponibilité à 0 sur une nouvelle fiche.** La Disponibilité vaut 0 sans être marquée : cliquer OK sans rien toucher enregistre TIMEBUDGET = 0. Pour DeltaSub, choix recommandé au §8-6.

---

## §5 Impression et export

### 5.1 Déclenchement

- [P] Bouton document ▾ → « Afficher le rapport… » (`showReport`). Disponible seulement :
  - pour « Heures disponibles » (type de document `timeProjectTimeReport`) et « Solde des heures disponibles » (`timeProjectTimeLogReport`) ;
  - quand un collaborateur est sélectionné.
- `Reports.newReport` prend le modèle du jeu **général** (`getGeneralTemplateFile` → `SelectTemplateDialog.browseTemplate` ; [D] choix automatique quand il n'y a qu'un modèle).
- Le rapport s'ouvre dans l'aperçu `ReportViewer`, d'où l'on imprime ou exporte en PDF [D].
- Pas d'impression pour « Heures planifiées » ni pour « Heures planifiées et cahier des charges ».

### 5.2 Modèles d'impression

[P] Source : modeles.json ▸ `modeledocument`, seul le jeu « 0 » existe, fichiers `…-fr.dpdoc`.

**Les deux modèles**

- `0/timeProjectTimeReport-fr.dpdoc` : description « Disponibilité de l'affaire », titre du rapport **« Planification du temps disponible »**.
- `0/timeProjectTimeLogReport-fr.dpdoc` : description « Utilisation aux affaires », titre **« Solde des heures disponibles »**.

**Page commune « A4 Paysage »** : 297 × 210 mm ; marges gauche 15, droite 15, haut 25, bas 20 mm.

- **En-tête** (y = 7 mm, hauteur 15 mm, filet bas gris de 0.25) :
  - à gauche, l'image `A0 architekten Logo.png` (largeur 89 mm) ;
  - au centre, un champ vide ;
  - à droite, le **titre du rapport**.
- **Pied** (y = 193 mm, filet haut) :
  - à gauche, « Créé par » suivi de l'utilisateur ;
  - au centre, la date (style `dateMedium`) ;
  - à droite, « Page » n « | » N.

**Corps**

1. Bande « Titre » (marge haute 10 mm, filet bas) :
   - à gauche : `<titre du rapport> de <Prénom Nom>` (police `title` ; champ `…$StringField|staff`, style `contactFirstnameAndName`) ;
   - à droite : « Année <année> ».
2. Bande « Information » (marge haute 5 mm), libellés en gras (`textBold`) :
   - « Date » → la date (style `dateLong`) ;
   - « Collaborateur » → Prénom Nom ;
   - « Année » → l'année.
3. Bande « Tableau » (champ `…$TableField|table`) :
   - colonne « Désignation » : 74 mm (70 mm pour le Solde) ;
   - colonnes « janv. » … « déc. » : 10 mm chacune, nombres alignés à droite, noms courts `getShortMonthName`.

**Remplissage du tableau**

- « Heures disponibles » [P] (`ProjectTimeTableModel.fillTable`) :
  - une ligne d'en-tête, puis les 8 lignes, valeurs au format `formatDouble` (vide si null) ;
  - « Heures prévues » et « Disponibilité du collaborateur » sont imprimées comme **lignes de total** (`addTotalRow`), les autres comme lignes normales.
- « Solde des heures disponibles » [P] (`ProjectTimeLogTableModel.fillTable`) :
  - 1re ligne (Disponibilité) et dernière ligne (Solde) : style `tableLevel1`, avec remise à zéro de l'alternance des couleurs ;
  - « Total des heures effectuées » : style `tableLevel1Total`, puis fin de tableau ;
  - autres lignes : style `tableRow` ;
  - « Part effectuée » < 80 : **texte rouge**, sur les 12 mois.

**Champs** [P] (`ProjectTimeReport.getString`, `ProjectTimeLogReport.getString`) : `year` = l'année ; `staff` = le contact du collaborateur (vide s'il n'y en a pas).

### 5.3 Export

- [P] Roue ▾ : copie du tableau affiché dans le presse-papier, ou export dans un fichier CSV.
- DeltaSub dispose déjà de `copyTable` et `csvTable`.

---

## §6 Données et vérifications numériques

### 6.1 Tables utilisées

| Table (collection DeltaSub) | Lignes au bureau | Rôle |
|---|---:|---|
| STAFFPROJECTTIME (`staffprojecttime`) | 24 | Colonnes : ID, STAFF_ID, TIMEYEAR, **TIMEMONTH 0–11**, DEVIATION, HOLIDAY, EDUCATION, OFFICIALABSENCE, OTHERABSENCE, INTERNALTIME, TIMEBUDGET (heures, double), REMARK (varchar 1024). Une ligne par collaborateur et par mois ; l'unicité est assurée par l'interface, pas par une contrainte. |
| STAFFTARGETTIME (`stafftargettime`) | 47 | TARGETTIMEYEAR, TARGETHOURS0..11 (mois 0–11) : les « Heures prévues ». Aucun doublon (STAFF_ID, année) dans les données. |
| TIMELOG (`timelog`) | 37 622 | TIMEYEAR, TIMEMONTH 0–11, TIMEPERIOD, PROJECT_ID, ISHOLIDAY : rapport 3.4. |
| PROJECT (`project`) | 111 | TITLE, NUMBER, ISINTERNAL (110 à 0, 1 à 1). |
| APPUSER_STAFF (`appuser_staff`) | 19 | liste des collaborateurs visibles par chaque utilisateur. |
| PLANNINGASSIGNMENT, PLANNINGTIME, PLANNINGROLE, PLANNINGSUBPROJECT, PLANNINGMONTH | 0 | rapports 3.2 et 3.3 ; DELTAplanning n'a jamais servi, et ces tables n'ont pas de collection dans DeltaSub. |

### 6.2 Contenu de STAFFPROJECTTIME au bureau [P CSV]

- **STAFF_ID 2801, année 2022** (ID 1 à 12) : tous les champs à 0, REMARK vide.
- **STAFF_ID 2752, année 2023** (ID 63 à 74, mois 0 à 11) :
  - INTERNALTIME = TARGETHOURS{m} de STAFFTARGETTIME 2752/2023 : 178.5, 170, 195.5, 153, 178.5, 187, 178.5, 187, 170, 187, 187, 161.5 ;
  - TIMEBUDGET = 0 ; autres champs à 0.

Interprétation :

- [D] 2752/2023 a été créé par la fenêtre « Travail interne » en « En pourcentage » à 100 % : les ID se suivent et INTERNALTIME vaut chaque mois 100 % du prévu. En décembre, 161.5 ≠ 170 (valeur standard TARGETTIME) : la source est bien STAFFTARGETTIME.
- [D] 2801/2022 a été créé en « Aucun » alors que la fiche STAFFTARGETTIME 2801/2022 (ID 403, créée plus tard) n'existait pas encore. TIMEBUDGET est donc resté figé à 0, alors que le Résultat calculé vaut aujourd'hui 189 / 30.75 / 59.75 / 16.5 en août, octobre, novembre et décembre. **Ce cas prouve que TIMEBUDGET est stocké et jamais recalculé.**

### 6.3 Résultats attendus sur les données du bureau

Les valeurs ci-dessous sortent de `research/critique/verif_rapports.py`, qui applique les règles du §3 aux CSV.

**Heures disponibles**

| Collaborateur / année | Résultat |
|---|---|
| 2752 / 2023 | Heures prévues = Travail interne = 178.50 · 170.00 · 195.50 · 153.00 · 178.50 · 187.00 · 178.50 · 187.00 · 170.00 · 187.00 · 187.00 · 161.50. Déduction, Vacances, Formation, Militaire et Autres absences : 0.00 sur 12 mois. Disponibilité du collaborateur : 0.00 sur 12 mois. |
| 2801 / 2022 | Heures prévues = 0.00 (7 premiers mois), 189.00, 0.00, 30.75, 59.75, 16.50. Toutes les autres lignes, Disponibilité comprise : 0.00 sur 12 mois. |
| 2752 / 2025 (aucun enregistrement) | 8 lignes vides. |

**Solde des heures disponibles, 2752 / 2023**

- Disponibilité : 0.00 sur 12 mois.
- 28 lignes d'affaire, dans l'ordre Java (HashMap de capacité 64) : 704, 1601, 2051, 901, 902, 1801, 906, 1551, 915, 917, 918, 1302, 1751, 920, 1501, 803, 1251, 1701, 1451, 1901, 753, 755, 1651, 501, 759, 1401, 1852, 702.
- Total : 155.00 · 177.00 · 265.25 · 159.50 · 209.75 · 207.25 · 93.25 · 175.75 · 188.75 · 184.50 · 214.75 · 172.50.
  - Dont l'affaire 501 : 62.25 · 70.25 · 41.25 · 25.75 · 47.75 · 44.75 · 18.75 · 84.75 · 48.75 · 89.25 · 77.00 · 116.50.
- Part effectuée : vide sur 12 mois (TIMEBUDGET = 0).
- Solde : −155.00 … −172.50.
- Contrôles croisés : juillet 93.25 = 178.25 h de TIMELOG − 85 h de vacances ✓ ; les totaux concordent avec le rapport « données ».

**Solde des heures disponibles, 2801 / 2022**

- Disponibilité : 0.00 sur 12 mois.
- 8 affaires, dans l'ordre 913, 501, 901, 1302, 759, 903, 906, 702.
- Total : 0.00 (7 premiers mois), 189.00, 0.00, 30.75, 59.75, 16.50. La somme, 296, correspond aux heures TIMELOG 2022 de 2801 sans les vacances.
- Part effectuée : vide.
- Solde : 0.00 (7 premiers mois), −189.00, 0.00, −30.75, −59.75, −16.50.

**Solde des heures disponibles, 2752 / 2025** (aucun enregistrement)

- Disponibilité : vide.
- 23 affaires.
- Total : 189.50 · 182.50 · 191.00 · 9.00 · 13.50 · 26.00 · 0.00 · 170.75 · 207.75 · 155.25 · 154.50 · 67.00. La somme, 1 366.75, vaut 1 562.25 h de TIMELOG − 195.50 h de vacances ✓.
- Part et Solde : vides.

**Heures planifiées** (quels que soient le collaborateur et l'année)

- Disponibilité : identique à la ligne 8 du rapport 3.1.
- Heures planifiées : 0.00 sur 12 mois.
- Solde disponible : = TIMEBUDGET, soit 0.00 dans les mois saisis et vide ailleurs. Jamais coloré, puisque la valeur est nulle.

**Heures planifiées et cahier des charges** : tableau vide.

**Arrondi** (capture DE p.38, travail interne à 5 %)

| Calcul | Valeur exacte | Affichage Java | `toFixed(2)` |
|---|---|---|---|
| 174.30 × 5 / 100 | 8.715 | « 8.72 » | 8.71 |
| 174.30 − 8.715 | 165.585 | « 165.59 » | |
| 190.90 × 5 / 100 | 9.545 | « 9.55 » | 9.54 |

Seul l'arrondi Java reproduit la capture.

---

## §7 Points d'ancrage dans DeltaSub (DeltaSub.html, 3 368 lignes)

### 7.1 Navigation

À la l.340, ajouter l'entrée :

```js
{s:'Heures', items:[['h-saisie','Saisie'],['h-rapport','Rapport'],['h-dispo','Disponibilité']]}
```

### 7.2 Nouvelle vue `VIEWS['h-dispo']`

À insérer après la l.1712 (fin de `VIEWS['h-rapport']`).

**Fonctions à réutiliser**

| Fonction | Ligne | Usage |
|---|---:|---|
| `col` | 330 | colonne de gauche |
| `grid` | 288 | tableaux |
| `setTools` / `ibtn` | 255 / 250 | barre d'outils |
| `popMenu` | 258 | menus déroulants |
| `dialog` | 270 | fenêtres |
| `copyTable` / `csvTable` / `tableText` | 745 / 746 / 742 | export |
| `staffName` | 389 | nom du collaborateur |
| `ME` | 405–409 | utilisateur du poste |
| `DS.by` | 167 | accès aux données |
| `hit` | 370 | rafraîchissement |
| `MOIS` | 401 | mois courts (impression) |
| `MOIS_L` | 2799 | mois longs en minuscules (écran et liste des mois) |
| `dLong` | 2800 | date longue |
| `dfr` | 147 | date courte |
| `num` | 143 | format suisse (à combiner avec l'arrondi Java) |
| `esc`, `h` | 137, 138 | HTML |

**Ne pas** utiliser `targetFor` (l.1578), qui se replie sur TARGETTIME, ni `hrMaps`, qui répartit les heures par jour.

**Squelette à adapter**

```js
/* ═══ HEURES · Disponibilité (PlanningFrame de Deltaproject) ═══ */
const DP_T=['Heures disponibles','Heures planifiées','Heures planifiées et cahier des charges','Solde des heures disponibles'];
const DP={t:0,staff:null,y:0,m:0,g:{}};
{ const d=new Date(); d.setDate(1); d.setMonth(d.getMonth()-1); DP.y=d.getFullYear(); DP.m=d.getMonth();   // mois précédent
  try{ const t=+localStorage.getItem('ds_dp_type'); if(t>=0&&t<=3) DP.t=t; }catch(_){} }
/* arrondi Java (Formatter.round) : demi à l'écart de zéro */
const numJ=v=>v==null?'':num(Math.sign(v)*Math.round(Math.abs(v)*100)/100);
function dpStaffs(){ const u=ME.u, l=u?DS.by('appuser_staff','APPUSER_ID',u.ID).map(x=>DS.get('staff',x.STAFFS_ID)).filter(Boolean):[];
  return (l.length?l:staffList(true)).sort((a,b)=>cmp(staffName(a),staffName(b))); }
function dpTarget(sid,y,m){ const st=DS.by('stafftargettime','STAFF_ID',sid).find(x=>x.TARGETTIMEYEAR===y); return st?(+st['TARGETHOURS'+m]||0):0; }
function dpAvail(r){ return dpTarget(r.STAFF_ID,r.TIMEYEAR,r.TIMEMONTH)-(+r.DEVIATION||0)-(+r.HOLIDAY||0)-(+r.EDUCATION||0)-(+r.OFFICIALABSENCE||0)-(+r.OTHERABSENCE||0)-(+r.INTERNALTIME||0); }
function dpSpt(sid,y){ return sid?DS.by('staffprojecttime','STAFF_ID',sid).filter(r=>r.TIMEYEAR===y):[]; }
/* ordre d'itération d'une HashMap Java<Integer> (capacité 16, doublée au-delà de 75 %) */
function dpJavaOrder(ids){ let cap=16; while(ids.length>cap*.75) cap*=2; return ids.map((k,i)=>[k,i]).sort((a,b)=>((a[0]&(cap-1))-(b[0]&(cap-1)))||a[1]-b[1]).map(x=>x[0]); }
function dpModel(){ const sid=DP.staff, y=DP.y, S=dpSpt(sid,y), R={rows:[]};
  const row=(d,v,o)=>Object.assign({d,v},o||{});
  const byM=f=>{ const v=Array(12).fill(null); S.forEach(r=>v[r.TIMEMONTH]=f(r)); return v; };
  if(DP.t===0){
    R.rows=[row('Heures prévues',byM(r=>dpTarget(sid,y,r.TIMEMONTH)),{b:1,hl:1}), row('Déduction sur les heures prévues',byM(r=>+r.DEVIATION||0)),
      row('Vacances',byM(r=>+r.HOLIDAY||0)), row('Formation',byM(r=>+r.EDUCATION||0)), row('Militaire, service civil',byM(r=>+r.OFFICIALABSENCE||0)),
      row('Autres absences',byM(r=>+r.OTHERABSENCE||0)), row('Travail interne',byM(r=>+r.INTERNALTIME||0)),
      row('Disponibilité du collaborateur',byM(r=>+r.TIMEBUDGET||0),{b:1,hl:1})];
    return R; }
  if(DP.t===2){ /* colonnes Affaire | Ouvrage | Phase partielle | Durée | Cahier des charges,
                   depuis le STAFFPROJECTTIME (DP.y, DP.m) → planningassignment (collections vides au bureau) */ return R; }
  const tb=byM(r=>+r.TIMEBUDGET||0), P=new Map();
  if(DP.t===3){ if(sid) DS.by('timelog','STAFF_ID',sid).filter(t=>t.TIMEYEAR===y&&t.PROJECT_ID!=null)
      .sort((a,b)=>a.PROJECT_ID-b.PROJECT_ID||a.TIMEMONTH-b.TIMEMONTH)
      .forEach(t=>{ const p=DS.get('project',t.PROJECT_ID); if(!p||p.ISINTERNAL) return;
        if(!P.has(p.ID)) P.set(p.ID,Array(12).fill(null)); const v=P.get(p.ID); v[t.TIMEMONTH]=(v[t.TIMEMONTH]||0)+(+t.TIMEPERIOD||0); }); }
  else { /* DP.t===1 : somme de PLANNINGASSIGNMENT.TIMEPERIOD par affaire
            (PLANNINGTIME → PLANNINGROLE → PLANNINGSUBPROJECT.PROJECT_ID), au mois du STAFFPROJECTTIME */ }
  const ids=dpJavaOrder([...P.keys()]), tot=Array(12).fill(0), av=tb.slice();
  ids.forEach(id=>P.get(id).forEach((x,m)=>{ if(x==null) return; tot[m]+=x; if(av[m]!=null) av[m]-=x; }));
  const proj=ids.map(id=>row((DS.get('project',id)||{}).TITLE||'',P.get(id)));
  if(DP.t===1) R.rows=[row('Disponibilité du collaborateur [h]',tb,{b:1,hl:1}),...proj,
    row('Heures planifiées [h]',tot,{b:1,hl:1}),row('Solde disponible [h]',av,{hl:1,sign:1})];
  else R.rows=[row('Disponibilité pour les affaires',tb,{b:1,hl:1}),...proj,row('Total des heures effectuées [h]',tot,{b:1,hl:1}),
    row('Part effectuée [%]',tb.map((b,m)=>b==null||b===0?null:tot[m]/b*100),{rate:1}),row('Solde du temps disponible [h]',av,{hl:1})];
  return R; }
```

**`tools()` : barre d'outils**

```js
[[select type],
 [prev mois, select mois, next mois],
 [prev année, libellé, next année],
 [{i:'doc', t:'Rapports', menu:()=>[{t:'Afficher le rapport …', dis:!(DP.staff&&(DP.t===0||DP.t===3)), fn:dpPrint}]},
  {i:'gear', t:'Fonctions', menu:()=>[copie, CSV]}]]
```

- Les listes sont des éléments `h('select',…)` insérés tels quels : `setTools` accepte les nœuds.
- Activation des contrôles : règles du §2.4, via `disabled`.

**`render(m)`** : sur le modèle de `h-rapport` (l.1689–1709).

- À gauche, `col(240)` avec une grille « Collaborateur » :
  - lignes : `dpStaffs()` ;
  - sélection : `DP.staff` ; par défaut `HR.staff` s'il est dans la liste, sinon `ME.staff`, sinon le premier.
- À droite, la grille du rapport :

  ```js
  grid(pane,Object.assign(DP.g,{state:{},sort:null,key:r=>r._k,
    cols:[{k:'d',t:'Désignation',f:…}, …MOIS_L.map((n,m)=>({k:'m'+m,t:n,cls:'r',w:80,f:r=>…numJ(r.v[m])…}))],rows}))
  ```

- Mise en forme :
  - gras : `<b>` ;
  - surlignage : post-traitement des `tr`, fond `rgba(20,20,20,.16)` ;
  - couleurs : si `r.sign`, vert `#008f00` quand > 0 et rouge `#f00` quand < 0 ; si `r.rate`, rouge quand < 80 (pour décembre, voir §8-4).

**Événements**

- Changement de collaborateur, de type (mémorisé dans `ds_dp_type`), de mois (±1 avec passage d'année) ou d'année (±1) → `draw()`.
- Double-clic dans le rapport 3.3 → la note, dans une fenêtre en lecture seule avec un bouton « Fermer ».

**Rafraîchissement**

```js
refresh(ts){ if(hit(ts,'staffprojecttime','stafftargettime','timelog','project','staff','appuser_staff')) this.draw(); }
```

**`dpPrint()`**

DeltaSub n'a pas de moteur .dpdoc : `tplPrint` (l.2842) ne lit que `modele`. Il faut donc une page HTML, calquée sur la page de secours de `hrPrint` (l.1676–1678) et sur le §5.2 :

- A4 paysage ;
- en-tête : titre du rapport à droite ;
- bande « Titre » : `<titre> de <staffName>` à gauche, « Année y » à droite ;
- bande « Information » : Date (`dLong(today())`), Collaborateur, Année ;
- tableau : « Désignation » + `MOIS` ; lignes de total en gras avec filet ; Part effectuée < 80 en rouge sur les 12 mois ;
- pied : « Créé par <ME.id> » · `dfr(today())` · « Page n|N ».

Titres : « Planification du temps disponible » et « Solde des heures disponibles ».

### 7.3 Collaborateurs ▸ clé ▾ ▸ Disponibilité (saisie, §4)

**Menu « Paramètres » de `collabView`** (l.906–907)

- Reprendre l'ordre de Deltaproject : « Coût de revient », « Durée prévue », « Vacances », **« Disponibilité … »**, séparateur, « Verrouillage des heures », séparateur, « Participation aux affaires ». Cette dernière entrée n'existe pas encore dans DeltaSub.
- « Disponibilité … » est désactivé (`dis`) si la sélection (`gridSel(CO.g,…)`) ne compte pas exactement un collaborateur.

**Nouvelles fonctions**, à placer après `staffHolidays` (l.994–1005) :

- `staffProjectTimes(s)` : la fenêtre « Disponibilité » (§4.2), sur le modèle de `staffTargets` (l.973–991) :
  - `phead([+ ▾ (menu du §4.3), crayon, −])` ;
  - grille triée par TIMEYEAR puis TIMEMONTH, décroissants ;
  - colonnes du §4.2, valeurs `numJ(x)+' h'` ;
  - double-clic = modifier.
- `sptEdit(s,rec,y,m)` : la fiche mensuelle (§4.4) :
  - `dialog` + `formRows` (l.1039) ;
  - champs texte, et non `type=number`, pour accepter « 1'234.50 » ; conversion :

    ```js
    v=>{ const n=parseFloat(String(v).replace(/['’\s]/g,'')); return isFinite(n)?n:0; }
    ```

  - OK désactivé via `bd.parentNode.querySelector('.ft .btn.pri').disabled` ;
  - enregistrement : `DS.save('staffprojecttime',v)`.
- `sptYear(s,y)` : la fenêtre « Travail interne » (§4.5) :
  - `const ids=DS.newIds('staffprojecttime',n)`, puis **un seul** `DS.commit(ops)` ;
  - seulement les mois manquants ;
  - calcul `prévu*p/100`, dans cet ordre.
- Suppression :
  - refus si `DS.all('planningassignment').some(a=>a.STAFFPROJECTTIME_ID===r.ID)` ;
  - sinon `confirmDlg('Voulez-vous vraiment supprimer cette inscription ?','Supprimer')`, puis `DS.del`.

**`delStaff`** (l.954–957) : ajouter un refus si `DS.by('staffprojecttime','STAFF_ID',s.ID).length`, avec le message « Cette inscription est déjà utilisée et ne peut pas être supprimée. ».

### 7.4 Serveur

Rien à changer [P, lecture du code] :

- `serveur_deltasub.py` (l.189–220) importe tous les `APP.*.csv`, donc la collection `staffprojecttime` (24 enregistrements). Elle est chargée au démarrage, car absente de `HEAVY` (l.160).
- `new_ids` (l.135) partira du plus grand ID existant, soit 75.

Non vérifié sur la base réelle du Mac Studio, absente de ce poste.

---

## §8 Incertitudes restantes et choix recommandés

1. **Ordre des lignes d'affaire (rapports 3.2 et 3.4).**
   - [P] Les lignes sont rangées dans une `HashMap<Integer,…>` par défaut. Java la parcourt case par case : case = `id & (capacité−1)`, capacité 16 doublée dès que la table est remplie à plus de 75 %. Dans une même case, l'ordre est celui d'insertion.
   - [D] L'ordre d'insertion suit le résultat SQL, supposé croissant par affaire.
   - **Choix** : reproduire l'ordre Java (`dpJavaOrder`). Un tri par numéro d'affaire, plus lisible, seulement si Paulo le demande.
2. **Noms des mois à l'écran.** [P] `DateFormatSymbols(Locale.FRENCH).getMonths()`, [D] donc en minuscules (« janvier »). → Utiliser `MOIS_L`.
3. **Liste des collaborateurs.** Deltaproject affiche les collaborateurs APPUSER_STAFF de l'utilisateur, inactifs compris ; l'écran `h-rapport` de DeltaSub utilise `staffList()` (tous les collaborateurs actifs).
   - **Choix** : règle de Deltaproject (`dpStaffs`). Si l'utilisateur n'a aucun lien, afficher tous les collaborateurs.
   - Trier par nom, comme sur la capture DE p.42 (« Mitarbeiter ▲ ») : l'ordre non trié de Deltaproject est inconnu.
4. **Défauts de coloration.** À l'écran, décembre n'est jamais coloré pour « Solde disponible » ni pour « Part effectuée ». **Choix** : colorer les 12 mois, comme l'impression du rapport 3.4. C'est un écart assumé, à signaler.
5. **Impression.**
   - Il n'y a pas de moteur .dpdoc.
   - Le logo `A0 architekten Logo.png` est celui de démonstration des modèles généraux (438 modèles l'utilisent) et il est absent de `image`.
   - Le rendu exact de « Page n|N » et du style `dateLong` n'est pas connu.
   - **Choix** : page HTML A4 paysage selon le §5.2, sans logo (ou avec `SUB_Logo noir.png` si Paulo le souhaite), « Page n|N » tel quel, date longue par `dLong`.
6. **Nouvelle fiche mensuelle avec Disponibilité à 0.** Dans Deltaproject, OK reste possible avec 0. **Choix** : garder ce comportement, mais sélectionner le champ Disponibilité à l'ouverture. Faire tous les calculs sur le mois affiché (§4.7).
7. **ISINTERNAL vide (null).** La requête JPQL `isInternal = FALSE` exclut les valeurs nulles. DeltaSub crée les affaires avec 0 (l.1046) et les données ne contiennent que 0 ou 1. → Tester `!p.ISINTERNAL` (null compté comme non interne).
8. **Rapports DELTAplanning (3.2 et 3.3).** Leur structure est prouvée, mais DeltaSub n'a ni données ni module de planification.
   - → Les implémenter sur les collections `planningassignment`, `planningtime`, `planningrole`, `planningsubproject` et `planningmonth` si elles existent (`DS.all` renvoie [] sinon).
   - Le rapport 3.2 affichera alors Disponibilité / 0.00 / Solde, et le rapport 3.3 un tableau vide avec « Aucune donnée pour cette période. ».
9. **Ordre des PLANNINGASSIGNMENT dans le rapport 3.3.** Pas d'`@OrderBy` → [D] tri par ID.
10. **Sélection d'une année par ▾ dans la fiche mensuelle.** [P] Quand l'année choisie n'est pas postérieure à celle affichée, `setNextAvailableYearAndMonth(année)` recule à partir de janvier de cette année. Il peut ainsi aboutir à décembre de l'année précédente. → Reproduire tel quel (cas rare).
11. **Base réelle.** Le contenu effectif de la base DeltaSub du bureau n'a pas pu être lu. Les vérifications portent sur les CSV de la dernière reprise.

---

## Annexe A — Contradictions entre les trois rapports et arbitrage

| # | Point | Ce que disaient les rapports | Arbitrage (source) |
|---|---|---|---|
| A1 | Menu clé de Collaborateurs | staffdialogs : « Coût de revient, Durée prévue, Vacances, —, Verrouillage » (Disponibilité citée à part, Participation oubliée). Manuel : « Modifier » en tête. spec_1 de DeltaSub : autre ordre. | Clé ▾ = Coût de revient…, Durée prévue…, Vacances…, Disponibilité…, —, Verrouillage des heures…, —, Participation aux affaires… « Modifier… » n'apparaît que dans le menu contextuel. [P] `addEditPopupMenuItems` @34–542 ; `jEditMoreStaffButtonActionPerformed` @10 (`iconst_0`) ; `addStaffInfoPopupMenuItems` @2 (`iconst_1`). |
| A2 | Sens de « Déduction » | manuel : « à confirmer » | Soustraction. [P] `getAvailableTime`, six `dsub`. |
| A3 | Ordre des 4 rapports | données : Heures disponibles, Solde, Heures planifiées, … et cahier des charges | Heures disponibles, Heures planifiées, Heures planifiées et cahier des charges, Solde. [P] `ReportType.$values`. |
| A4 | Barre d'outils | données : navigation par année + « Aujourd'hui » | Pas de bouton « Aujourd'hui ». Navigation par mois (active pour le rapport 3.3 seulement) et par année. [P] champs de PlanningFrame, `checkGuards`. |
| A5 | En-têtes de colonnes | données : mois courts `MOIS` (« janv. ») | Noms longs à l'écran (`getMonthName`) ; noms courts seulement à l'impression. [P] |
| A6 | Place après « Rapport » | données : [D] | [P] ordinals 15 / 16 / 17. |
| A7 | Rapport « Solde » | données : ordre des lignes et règles des valeurs vides non précisés | Ordre Disponibilité, affaires, Total, Part, Solde ; règles pour les valeurs vides, nulles et le seuil de 80. [P] §3.4. |
| A8 | Libellé des affaires | non traité | TITLE seul dans les rapports 3.2 et 3.4 ; « NUMBER TITLE » dans le 3.3. [P] |
| A9 | Entrées « Mois AAAA » du menu + | staffdialogs : « Janvier 2026 » | [D] « janvier 2026 » (Locale.FRENCH). |
| A10 | Arrondi | non traité | Java arrondit les demis en s'éloignant de zéro ; `num()` (toFixed) donne un autre résultat (8.715). [P] `Formatter.round`. |
| A11 | Totaux annuels / colonne Total | non traités | Aucun. [P] 13 colonnes. |
| A12 | « TIMEBUDGET pré-rempli seulement à la création d'une année » (données) | partiellement exact | Exact pour l'écriture automatique. La fiche mensuelle propose la valeur (suggestions) sans l'écrire. [P] |

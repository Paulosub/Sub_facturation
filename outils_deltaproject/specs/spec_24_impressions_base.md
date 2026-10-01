# Cahier des charges — CH-09 « Impressions au nouveau format (.dpdoc) des modules de base »

Version du rédacteur critique, 01.10.2026. Ce cahier décrit comment faire imprimer par `DeltaSub.html`, **au nouveau format `.dpdoc` et avec les modèles du bureau**, les 19 types de documents des modules de base de Deltaproject 16.05 :
- Heures ▸ Rapport (rapports hebdomadaire, mensuel, trimestriel, semestriel, annuel, journal mensuel, rapport des vacances) et Heures ▸ Disponibilité (Heures disponibles, Solde du temps disponible) ;
- Notes de frais ▸ Rapport (Liste des notes de frais), Liste des affaires, Liste des adresses, Intervenants ;
- Tâches (Tâches d'affaire, Liste des tâches de l'affaire) ;
- Controlling de l'affaire : « Composer le rapport » (heures et frais), Journal des heures, Rapport heures - facturation - coût de revient, Analyse détaillée des heures, Rapport des frais, Récapitulatif des frais, avec « Grouper les heures de l'affaire » complété et « Grouper les coûts » ;
- les entrées « … [Ancien document] » qui restent (modules de base, Management et Reporting), avec la boîte « Paramètres » et les favoris des anciens documents.

Il confronte les deux recherches du chantier (`ch/CH-09/rech_orig.md`, `ch/CH-09/rech_exist.md`), la fiche CH-09, la matrice et le § 16 de l'inventaire (`research/inv/inventaire_modules.md`), et les cahiers qui passent des consignes à CH-09 (spec_2, spec_6, spec_7, spec_13, spec_14, spec_16, spec_18). Chaque contradiction a été **revérifiée à la source** pour ce cahier (§ 1).

**Conventions**
- **[P] PROUVÉ** : bytecode `Classe.méthode@offset` (désassemblages `ch/CH-09/work/jp/`, outil `research/pl_critique/jp.sh`), libellé `Strings.db (classe|id)` en français, données de la copie du bureau `dpx/out` (identifiants et agrégats seulement) ou de la base de test `dstest`, modèles `.dpdoc` du bureau (`ch/CH-09/dpdoc/`, `work/dpdoc_structures.txt`).
- **[D] DÉDUIT** : interprétation cohérente, non démontrée ligne à ligne.
- **[C] CHOIX** : décision de conception pour DeltaSub, signalée à Paulo (§ 11).
- Abréviations : `pc.` = `deltaproject.project.controlling.`, `tm.` = `deltaproject.time.`, `dd.` = `doc.data.`, `mgl.` = `deltaproject.management.list.`.

**Références DeltaSub.** `DeltaSub.html` du dépôt au 01.10.2026 : commit `9f184fe`, **21 887 lignes**, md5 `df42ee3eaff3df24052b96479d7fd93e` (CH-01, CH-02, CH-03, CH-08, CH-10, CH-11 et CH-17 intégrés). Le fichier change pendant le travail des chantiers parallèles : **seules les ancres textuelles du § 9 font foi**, les numéros de ligne sont indicatifs. Toutes les ancres ont été contrôlées par `grep -F -c` = 1 sur cette version.

**Choix déjà arrêtés** (repris tels quels) :
- Demande explicite de Paulo (30.09.2026) : « ajouter les modules manquants » — reproduire fidèlement tout ce qui est reproductible, hors contenu CRB.
- Socles intégrés à réutiliser : impression `.dpdoc` commune (CH-01 lot 1 : `ch01aTplList`, `ch01aTplPick`, `ch01aPrep`, `ch01aView`, moteur `svDpHTML`), rapport temporaire et anciens documents du Management (CH-11 lot 1 : `ch11aFlat`, `ch11aF0`, `ch11aView`, `ch11aOld`, `ch11aRepMenu`, `ch11aOldData`), visionneuse, PDF et pièces jointes (CH-03 : `ch03bView`, `ch03bContexte`, `ch03bJoindre`, utilisés par `typeof`), barre de menus (CH-10), droits (CH-08 : `rgCan`, `ch08aCan`) et langue des documents (`ch08cDocLangs`).

**Aucune donnée personnelle** : identifiants (STAFF, PROJECT, ACTIVITY, DOCTEMPLATE…), compteurs, agrégats au centime et libellés d'interface seulement. **Aucun contenu CRB.**

---

## 0. Synthèse

1. **Pas de moteur à écrire.** La chaîne de l'original (`Reports.newReport` / `newProjectReport` → `SelectTemplateDialog.browseTemplate` → rapport temporaire → `<X>ReportData.setData` → visionneuse) existe déjà dans DeltaSub (CH-01 lot 1, CH-11 lot 1, CH-03). CH-09 fournit, pour chacun des 19 types, **les champs et les tableaux** (par identifiant de colonne), les **menus** de l'original et les **dialogues** manquants (« Composer le rapport » ×2, « Grouper » ×2, « Paramètres » des anciens documents).
2. **Rien n'est écrit en base** [P § 7 de rech_orig] : rapports temporaires, aucun `DS.commit`, aucun `bseq`, aucune collection nouvelle, `PROTECTED` inchangé. Les seules traces sont des préférences propres au poste (`localStorage`, comme l'original les met dans `DELTAproject.properties` et des XML locaux) et les PDF joints par la visionneuse (CH-03).
3. **Choix du modèle sans repli** [P `SelectTemplateDialog.browseTemplate@77-184`] : documents généraux dans « Group.general » (jeu 0), documents d'affaire dans `PROJECT.DOCTEMPLATEGROUPNAME`, sinon « Group.project » (jeu 1). La fiche (« jeu de l'affaire, puis jeu 0 ») est fausse. Au bureau, les jeux 1 et 2 ont tous les modèles du chantier. Seuls `timeJournal` et `timeMonthlyReport` ont deux modèles : ce sont les deux seules impressions qui ouvrent « Choisir le modèle ».
4. **Trimestre et semestre impriment le « Rapport annuel »** [P `tm.AnalyzeFrame$ReportType.<clinit>@76-108`, `tm.ReportData.getTableContent@0-70`] avec le tableau trimestriel ou semestriel de l'écran. Il n'existe aucun type `.dpdoc` « trimestriel ». `timeWeeklyJournal` est réservé à la version de développement : il n'est pas exposé (D7).
5. **Les documents ne sont pas la copie de l'écran DeltaSub.** L'original imprime **son** modèle d'écran (`ReportTableModel`, `JournalTableModel`…) colonne par identifiant. Les écrans DeltaSub ont un autre ordre de colonnes (Heures prévues avant Heures effectives, colonne « Vacances saisies » en plus) et un autre « Rapport des vacances » (une ligne par saisie au lieu d'une ligne par mois). CH-09 construit donc les lignes **selon l'original** à partir des calculs existants (`hrMaps`, `hrHoliday`, `dpModel`, `nfrRows`, `tlRate`/`tlFee`/`tlCost`), sans toucher aux écrans.
6. **Controlling** : « Afficher le rapport … » de l'original ouvre **« Composer le rapport »** [P `pc.TimeControllingDialog.openReportDashboard@0-21`], qui produit le « Journal des heures » (4 tris) ou le « Rapport heures - facturation - coût de revient » (récapitulatif par collaborateur avec totaux par mois, trimestre, semestre, année). « Grouper … » ouvre « Grouper les heures de l'affaire » (8 regroupements + Personnalisé) ou « Grouper les coûts » (clone pour les frais), d'où « Afficher le rapport … » imprime l'« Analyse détaillée des heures » ou le « Récapitulatif des frais ». Les PDF de ces 5 documents se joignent aux dossiers de facturation de l'affaire (spec_16 : la pièce jointe part désormais du nouveau document).
7. **Anciens documents** : chaque écran garde, derrière un séparateur et si `isModuleFormVisible` (vrai au bureau), ses entrées « … [Ancien document] » de l'original, branchées sur les impressions DESIGN actuelles (`tplPrint`). Les **assistants** de l'original (filtres et favoris des anciens documents d'analyse) ne sont pas reproduits (D3) ; la boîte **« Paramètres »** de la visionneuse des anciens documents l'est, avec ses **favoris par poste** (D2).
8. **Management** : 10 anciens types restent après CH-11, plus 2 entrées qui renvoient aux anciennes listes (Genres → ancienne « Liste des affaires » ; Collaborateurs ▸ Liste → ancienne liste d'adresses `managementStaff`). L'arbitrage à la source corrige les deux recherches sur 3 points (§ 1 n° 8 à 10). `mgPrint` n'est pas modifié (Q4).
9. **Tâches** : le choix de spec_7 § 6.5 (ancien modèle seul) est levé : nouveau document en entrée principale, ancien derrière « [Ancien document] », comme l'original (D4).
10. **Défaut de modèle du bureau** : le modèle « Liste des affaires » du jeu 0 (2022) est décalé d'une colonne à partir de « Statut », parce que 16.05 a inséré « Adresse-Maîtres d'ouvrage » en id 3 [P]. L'original imprime donc l'adresse sous « Statut », le statut sous « Début »… Par défaut, DeltaSub **corrige à la lecture** ce seul modèle (D1).
11. **Valeurs de contrôle recalculées pour ce cahier** sur la copie du bureau (§ 6) : affaire 2801 en 2025 = 333.75 h / 45’056.25 / 23’632.50 ; affaire 902 en 2025 = 264.00 h / 35’640.00 / 24’531.25 ; notes de frais du collaborateur 2753 en septembre 2025 = CHF 146.30. Un cas de demi-centime est relevé (affaire 702) et écarté des tests.
12. **Plan : 4 lots** (fiche : 6) — `ch09a` socle CH-09, Heures et Disponibilité ; `ch09b` frais, listes, intervenants et tâches ; `ch09c` Controlling ; `ch09d` anciens documents (Paramètres, favoris, Management, Reporting). Le lot 6 de la fiche (Management) est fusionné dans le lot 4 ; le lot 5 (Tâches) dans le lot 2.

---

## 1. Arbitrages entre les sources (tranchés à la source)

| # | Sujet | Positions divergentes | Verdict | Preuve |
|---|---|---|---|---|
| 1 | Jeu de modèles d'un document d'affaire | fiche : jeu de l'affaire, puis jeu 0 ; spec_14 et rech_orig : sans repli | **Sans repli.** Groupe introuvable : message « Information » / « DocTemplateGroup '<groupe>' (<type>) not found! » ; aucun modèle du type : rien ne s'ouvre dans l'original. DeltaSub se replie sur l'ancien document en le signalant (D6, § 4.2) | [P `browseTemplate@9-19`, `@77-184`, `Reports.getProjectTemplateFile@0-48`] ; spec_14 § 4.4 |
| 2 | Document des rapports trimestriel et semestriel (rech_exist Q5) | « à établir » ; DeltaSub `HR_TPL` : `timeQuarterlyReport`, `timeSemiAnnualReport` (types DESIGN seulement) | **`timeAnnualReport`**, avec le tableau de l'écran (trimestre ou semestre) : toute bande de tableau `time.Report$TableField` reçoit le modèle d'écran | [P `tm.AnalyzeFrame$ReportType.<clinit>@76-108` (quarterlyReport, semiAnnualReport → `DocumentType.timeAnnualReport`) ; `tm.ReportData.getTableContent@0-70` (les 4 `TableField` renvoient `tableModel`)] |
| 3 | `timeWeeklyJournal` (rech_exist Q6) | entrée présente puis repli ; fiche : 8 types dont celui-ci | **Non exposé** (D7). La période n'existe qu'en version de développement, le type est masqué dans les modèles, sans libellé FR ni modèle au bureau | [P `tm.AnalyzeFrame.<init>@292-363` (`Version.isDevVersion`), `Templates$Category.<init>@88-108` (`DocumentType.isDev`)] ; [D `doctemplate` : 0 ligne] |
| 4 | « Paramètres d'impression et favoris communs » (fiche lot 1) | fiche : socle commun ; spec_2 § 11 : critères, polices, favoris | **Les nouveaux documents n'ont aucun paramètre** : tout est dans le modèle, seul le modèle se choisit. Les « Paramètres » et favoris appartiennent à la visionneuse des **anciens** documents (`deltaproject.viewer.Viewer`), un fichier XML par famille dans le dossier des préférences du poste → lot 4 | [P `viewer.Viewer` (boutons « Paramètres », « Editer les favoris »), `TimeReportFavorites`, `StaffReportFavorites`, `CostSummaryReportFavorites` (`XMLEncoder`)] |
| 5 | « Afficher le rapport … » du Controlling | rech_exist : à confirmer ; DeltaSub : « Etablir le document d'analyse … » seul | **« Afficher le rapport … »** et « … pour les positions sélectionnées … » ouvrent **« Composer le rapport »** ; « Grouper … » et « Grouper les positions sélectionnées … » ouvrent le dialogue de regroupement. « Etablir le document d'analyse … » n'existe plus qu'en « [Ancien document] » | [P `TimeControllingDialog.openReportDashboard@0-21` → `TimeControllingReportDialog.openDialog`, `openSummaryDashboard@0-21` → `TimeControllingSummaryDialog.openDialog`] ; [S `TimeControllingDialog\|openReportDashboard`, `openReportDashboardSelection`, `openSummaryDashboard`, `openSummaryDashboardSelection`, `report`, `staffReport`, `staffReportSelection`, `reportSelection` ; idem `CostControllingDialog`] |
| 6 | Libellé de l'impression des notes de frais | Strings : `AnalyzeFrame\|showExpensesReport` = « Liste des notes de frais » | **« Afficher le rapport … »** (le libellé `showExpensesReport` est orphelin) ; ancien : « Rapport … [Ancien document] » | [P `deltaproject.expenses.AnalyzeFrame.getReportsPopupMenu@33-36` (`Strings$Label.showReport`), `@87-96` (`journalMenu` + `legacyMenu`)] |
| 7 | « Grouper les heures » | § 16 de l'inventaire : présent (retiré de CH-09) ; rech_exist : 5 regroupements sur 9, sans impression | **Partiel.** DeltaSub n'a ni le dialogue de choix, ni « Activités avec phases », « Ouvrage avec activités », « Ouvrages avec phases », « Personnalisé », ni les colonnes Tarif et Taux horaire, ni l'impression. Le dialogue commun aux heures et aux frais est fait au lot 3 (le document l'exige) ; `ctlGroup` reste en place | [P `pc.TimeLogSummaryTableModel$ReportType.<clinit>` : staff, activity, activityPhases, phase, phaseActivities, subProject, subProjectActivities, subProjectPhases] ; [S `TimeLogSummaryTableModel\|*`, `TimeControllingSummaryDialog\|isCustomReport`] |
| 8 | Management ▸ Controlling : catégories qui ont un ancien document | rech_exist : « Rapport des heures - Phases / Activités » ; rech_orig : « Affaires - Phases / Activités » | **« Affaires - Phases » et « Affaires - Activités »** (`ProjectReportFrame`, `ProjectReportTableModel`). Les catégories « Rapport des heures - … » (`PerformanceReportFrame`) n'en ont pas | [P `management.ProjectReportFrame` : `ProjectReportPhases.list`, `ProjectReportTime.list`, `legacyMenu` ; `PerformanceReportFrame` : 0 `legacyMenu`] ; [S `ProjectMenuTableModel\|reportPhases`, `reportPerformancePhases`] |
| 9 | Ancien modèle `managementProjects` | rech_exist : « Composer le rapport » du Controlling d'affaire (à confirmer) | **Management ▸ Analyse des heures** (`ProjectTimeFrame`) → `TimeAnalyzeWizardDialog.openManagementProjectAnalyze`. « Composer le rapport » n'a pas d'ancien document | [P `project.time.TimeAnalyzeWizardDialog` : `TemplateType.managementProjects` ; rech_orig § 6] |
| 10 | Anciens documents de Management ▸ Genres et ▸ Collaborateurs ▸ Liste | absents des deux recherches (rech_orig : « fenêtre appelante non relevée ») | **Genres** (`ProjectKindsFrame`) → `project.list.ProjectListWizardDialog.openProjectList` (ancienne « Liste des affaires ») ; **Liste des collaborateurs** (`EmployeeListFrame`) → `adr.list.AdrListWizardDialog.openAddressList` (ancien `managementStaff`) | [P `ProjectKindsFrame.showLegacyReport@6-13`, `EmployeeListFrame$5` @13] |
| 11 | Anciens modèles du Controlling d'affaire | DeltaSub `ctlPrint` : `projectTime` / `projectCost` pour la liste détaillée | **Liste détaillée → `projectTimeJournal` / `projectCostJournal`** ; récapitulatifs et collaborateurs → `projectTime` / `projectCost` [D par type cité dans chaque classe] | [P `project.time.TimeAnalyzeWizardDialog` (projectTime ×3, projectTimeJournal ×1, managementProjects), `ProjectTimeStaffDialog` (projectTime), `project.cost.CostDetailAnalyzeDisplayDialog` (projectCostJournal), `CostSummaryAnalyzeDisplayDialog` (projectCost)] |
| 12 | Règle des tarifs (rech_exist Q7) | `tlRate`/`rateOfGroup` accepte une ligne sans `VALIDFROM` ; `mgRates` de même ; original ? | **Sans effet au bureau.** L'original prend la première ligne du groupe dont `VALIDFROM` ≤ date (une ligne sans date lèverait une exception) ; les 488 `PROJECTRATE` et 37 `STAFFRATE` du bureau ont tous une date, et chaque groupe de tarifs n'a qu'une ligne. `tlRate`, `tlFee`, `tlCost` sont repris tels quels | [P `db.ProjectRateGroup.getProjectRate@0-57` (`Date.before` / `equals`)] ; [P données : 0 `VALIDFROM` vide, 0 groupe à plusieurs tarifs] |
| 13 | Valeur de contrôle de l'affaire 702 (honoraires) | rech_exist : 340 550.78 | **Cas de demi-centime** : la somme exacte vaut 340 550.775 ; la somme en virgule flottante (ordre des ID ou des dates) vaut 340 550.774 999 999 8, arrondie à **340’550.77** par `Formatter.round` comme par `rJ`. L'affaire 702 est retirée des tests au centime ; 2801 et 902 (2025) la remplacent | [P recalcul pour ce cahier, § 6.1] |
| 14 | « Rapport des vacances » imprimé | DeltaSub : une ligne par saisie de vacances (6 colonnes) | **12 lignes mensuelles** (« MMMM yyyy », vacances du mois), précédées, si l'année est `HOLIDAYBALANCEYEAR`, d'une ligne « droit » (colonne 2 = `HOLIDAYBALANCE`) et suivies de « Total » (gras) ; colonne 2 = solde restant après chaque mois | [P `tm.ReportTableModel.<init>@984-1353` (`getTimeLogMonthlyHolidayReport`, `isExtendedHolidayReport`, `boldRowList`)] |
| 15 | Ordre des colonnes des rapports d'heures | DeltaSub : Période, Heures prévues, Heures effectives, Différence, Solde cumulé, Vacances saisies | **ids 0 Période · 1 Heures effectives · 2 Heures prévues · 3 Différence · 4 Solde cumulé · 5-7 heures d'appoint** (vacances : 0 Période · 1 Vacances saisies · 2 Différence) | [P `tm.ReportTableModel.<clinit>` (timePeriodCol, attendanceTimeCol, targetTimeCol, balanceCol, cumulativeBalanceCol, overtimeCol…, holidaysSpentCol), `getDefaultTableColumns`] |
| 16 | Modèle `projectList` du jeu 0 décalé | rech_orig : décalé ; CH-05 : « à trancher dans le socle » | **Décalage prouvé** : la classe crée « Adresse-Maîtres d'ouvrage » en id 3 (masquée), le modèle de 2022 porte « Statut » en id 3. Le remplissage est par id, sans migration → correction ciblée (D1) | [P `ProjectListTableContent.getDefaultTableColumns@9-113` (iconst_3 = colProjectBauherrAddress, iconst_4 = colProjectState)] ; [P `dpdoc/0_projectList-fr.json` : 0 N° … 3 Statut … 8 Actif] |
| 17 | « Direction de l'affaire » (`projectMemberProjectManager`) | absent du socle (`ch01aCtx`) | Rôle **Directeur d'affaire, code 4** | [P `db.ProjectMemberRole$TeamRole.<clinit>@55-58` (managementProjectManager, ordinal 3, code 4)] |
| 18 | `TPL_ROLE.projectAddressBuilderConsultantStandby` = 50 (spec_16 demande la vérification) | 50 | **51** (50 = Consultant du MO, 51 = Représentant du MO). Corrigé au lot 2 (ancien moteur des anciens documents d'affaire) | [P `TeamRole.<clinit>@149-177` (managementBuilderConsultant : code 50 ; …Standby : code 51)] |
| 19 | Libellés des périodes du tableau | DeltaSub écran : « lundi, 5 août 2024 » ; mois « août 2024 » | Document : motifs de l'original `E, d. MMMM yyyy` (jour) et `MMMM yyyy` (mois), rendus en français [D rendu : « lun., 5. août 2024 »] | [P `tm.ReportTableModel.<clinit>@12-31`] |
| 20 | Séparateur des milliers | original : `’` (locale de-CH, `#,###,##0.00`) | **Convention DeltaSub « 1'234.50 »** (`num`, utilisée par `svDpHTML` pour toutes les colonnes `doubleColumn`) : écart assumé E1 | [P `util.Formatter.<clinit>@48-74`] ; [P `DeltaSub.html` `num`, `svDpHTML` l. 11042] ; spec_13 E3 |
| 21 | Tâches (spec_7 § 6.5 : ancien modèle seul) | spec_7 ; rech_orig et rech_exist : revenir sur le choix | **Revenir sur le choix** (D4) : moteur disponible ; 0 tâche au bureau | [P spec_7 § 6.1 vérifié : `ProjectTaskFrame.getReportsPopupMenu@0-274`, `TaskFrame.getReportsPopupMenu@0-62`] |
| 22 | `mgPrint` (spec_16 le réserve à CH-09) | rech_exist Q4 : basculer ou non | **Non modifié** dans CH-09 : 10 écrans validés ; les nouveaux documents du Management restent ceux de `mgPrint` | [C] |
| 23 | Langue des modèles (spec_18) | `ch01aTplList` impose `fr` | **Enveloppe CH-09** (`ch09aTplPick`) qui applique `ch08cDocLangs()` sans modifier `ch01a*` (propriété de CH-01) | [C] ; [P l. 14455 `t.LANGUAGEKEY==='fr'`] |
| 24 | Nombre de lots | fiche : 6 ; consigne : 4 au plus | 4 lots (§ 10) | [C] |

---

## 2. Périmètre

### 2.1 Reproduit (fidèle)

- Les 18 types `.dpdoc` exposés par l'original (tous sauf `timeWeeklyJournal`), avec le choix du modèle de l'original (§ 4.1), les champs et les tableaux par identifiant de colonne, les styles de lignes (`tableRow`, `tableLevel1`, `tableLevel1Total`… `tableTotal`) et les lignes de titre de groupe sur toute la largeur.
- Les menus « Rapports ▾ » de l'original (libellés, ordre, séparateurs, règles d'activation), y compris les entrées « … [Ancien document] » conditionnées par `isModuleFormVisible` (`ivFormVisible()`).
- « Composer le rapport » (heures et frais), « Grouper les heures de l'affaire » complet et « Grouper les coûts », avec leurs préférences de poste.
- La pièce jointe PDF des 5 documents du Controlling dans les dossiers de facturation de l'affaire (CH-03, `ch11dPickInvoice`).
- La boîte « Paramètres » des anciens documents (Document, Présentation limitée à ce que `tplPrint` sait rendre) et les favoris par famille.
- Les anciens documents du Management qui restent (10 types + 2 renvois).

### 2.2 Choix DeltaSub

- **Rapports temporaires** affichés dans la visionneuse commune (`ch11aView` → `ch03bView`) ; impression et PDF depuis la visionneuse.
- **Repli** quand aucun modèle n'existe dans le jeu (D6) : message « Information » « Aucun modèle « <libellé du type> » dans le jeu de modèles « <groupe> ». Impression de l'ancien document. » puis ancien document si `ivFormVisible()`, sinon tableau simple (`ch11aHTML`). L'original n'ouvre rien.
- **Préférences** dans `localStorage` (try/catch, valeur absente = défaut de l'original), jamais en base. Préfixe de clés `ds_ch09_`.
- **Correction de lecture** du modèle `projectList` décalé (D1, § 5.4).
- **Libellés de période** des tableaux selon les motifs de l'original (§ 1 n° 19) ; les écrans DeltaSub ne changent pas.

### 2.3 Hors périmètre, retiré ou non livré

| Élément | Raison |
|---|---|
| `timeWeeklyJournal` | version de développement seulement (§ 1 n° 3, D7) ; la fonction de données l'accepte (journal hebdomadaire), sans entrée de menu |
| Assistants des anciens documents (`time.*`, `project.time.*`, `project.cost.*`, `management.list.*PreferencesDialog`, `AdrListWizardDialog`, `ProjectListWizardDialog`) : filtres, critères, « Modèles » | D3 : les filtres de l'écran couvrent le besoin ; les assistants de listes (adresses, affaires) relèvent de CH-04 et CH-05 |
| Dialogue « Liste des affaires » (`ProjectListDialog` : filtre ▾, liste, « Fermer ») | CH-05 (rech_orig CH-05 § 10.2) ; CH-09 fournit le document et une entrée directe en attendant (§ 5.4) |
| « Etiquettes … », « Liste d'adresses par entité … », « Fiche de l'adresse … » | CH-04 |
| « Liste par rôle et CFC » (navigateur `ProjectMemberRoleFrame`, titre « Entreprises ») | CH-05 ; CH-09 fournit le document (`ch09bMembers`, § 5.6) |
| Éditeur de modèles `.dpdoc` (colonnes, largeurs, titres) | CH-14 |
| Bascule de `mgPrint` sur le choix du modèle | § 1 n° 22 |
| Sélecteur de période de Heures ▸ Rapport (liste « Période » de l'original au lieu des boutons Récapitulatif / Rapport / Aperçu des vacances) | écart d'écran signalé (§ 8), hors chantier |
| Colonnes masquées de l'écran du Rapport d'heures (« Vacances saisies » en trop, « Complément » du journal) | écrans hors chantier (§ 8) |

### 2.4 Coordination avec les chantiers parallèles

- **CH-04** (adresses) : garde l'assistant « Liste d'adresses » et ses favoris, les étiquettes, les listes par entité et par CFC ; CH-09 fournit `ch09bContactList(rows, filtre)` et insère seulement « Liste d'adresses … » (nouveau document) en tête du menu « Prévisualisation ▾ » existant. Si CH-04 reconstruit ce menu, il appelle `ch09bContactList` par `typeof`.
- **CH-05** (gestion de l'affaire) : construit `ProjectListDialog` et le navigateur « Liste par rôle et CFC » ; il appelle `ch09bProjectList(rows, filterDesc)` et `ch09bMembers(p, membres, 'bkp', 'Entreprises')` par `typeof`.
- **CH-11** : l'ancre K1 (menu document du Controlling) contient déjà `ch11dCtlCtx` ; le nouvel « ancien » la reprend intacte (§ 9).
- **CH-10** : aucune entrée grisée « CH-09 » dans la barre de menus (vérifié : 0 occurrence) ; rien à activer.
- **CH-08** : la visibilité des écrans (droits `projectTime`, `projectCosts`, tâches) est déjà gérée par les écrans eux-mêmes ; CH-09 n'ajoute aucun droit.

---

## 3. Modèle de données

- **Lectures seulement** : `timelog`, `stafftargettime`, `targettime`, `staff`, `contact`, `contactowner`, `publicholiday`, `staffprojecttime`, `projectcost`, `project`, `projectmember`, `projectactivity(group)`, `projectphase`, `projectsubphase`, `subproject`, `projectcostcategory(group)`, `projectrate`, `staffrate`, `projecttask`, `projecttasknote`, `setting`, `doctemplate`, `doctemplategroup`, `modeledocument`, `image`, `rowstyleset`, `modele`.
- **Écritures en base : aucune.** Pas de `DS.commit`, donc pas de `bseq`.
- **`localStorage`** (par poste ; toute lecture et écriture dans try/catch ; contenu invalide = défaut) :

| Clé | Écran | Contenu | Original |
|---|---|---|---|
| `ds_ch09_cr_t` | Composer le rapport (heures) | `"<type>,T[M][Q][H][Y]"`, type ∈ `timeLogReportByNone`, `…ByStaff`, `…ByActivity`, `…BySubPhase`, `staffReport` | `Project.TimeControllingReportDialog.Preferences` |
| `ds_ch09_cr_c` | Composer le rapport (frais) | `"<type>"`, type ∈ `projectCostReportByNone`, `…ByStaff`, `…ByCostCategory`, `…BySubPhase` | `Project.ProjectCostControllingReportDialog.Preferences` |
| `ds_ch09_gr_t`, `ds_ch09_gr_c` | Grouper (heures, coûts) | `"<index 0-8>,<types personnalisés séparés par ;>"` | `…SummaryDialog.Preferences` (`8,staff` sur ce poste) |
| `ds_ch09_fav_<famille>` | Paramètres des anciens documents | `{sel:'<nom>', list:[{nom, titre, date, cover, cols:[{t, vis}], tpl}]}` | `*Favorites.xml` du dossier des préférences |

- Les préférences de Heures ▸ Rapport (`ds_hr`) et de Disponibilité existent déjà : inchangées.

---

## 4. Socle CH-09 (lot 1)

### 4.1 Choix du modèle : `ch09aTplPick(type, p)` → Promise

- `p` nul → groupe « Group.general » ; sinon `p.DOCTEMPLATEGROUPNAME || 'Group.project'` (comme `ch01aTplList`).
- **Langues** : `L = typeof ch08cDocLangs==='function' ? ch08cDocLangs() : ['fr']`. Si `L` vaut `['fr']`, **délègue à `ch01aTplPick(type, p)`** (résultat identique). Sinon, même filtre que `ch01aTplList` avec `LANGUAGEKEY ∈ L`, même tri, même dialogue « Choisir le modèle » (colonnes Description | Langue, langue affichée par son nom : Allemand, Français, Italien, Anglais, `CH08C_LANGS`).
- Résultats : `{jeu, fichier, desc, rep, id}` ; `'aucun'` ; `null` (annulé ou groupe introuvable, message de `ch01aTplPick`).
- Contrôle au bureau : `timeJournal` (jeu 0) → dialogue, 1re ligne 25 « Journal mensuel » (verrouillé), puis 1352 « Fiche d'heures mensuel » ; `timeMonthlyReport` → 28 puis 1351 ; tous les autres types du chantier → sans dialogue.

### 4.2 Rapport temporaire : `ch09aRun(type, p, job, o)` → Promise

- `job = {F, tables}` (sans `title` : le `reportTitle` du modèle est gardé, comme l'original) ; `o = {titre, M, old, joindre, projet, fix}`.
- Étapes : `DS.need(['doctemplate','modeledocument','image','rowstyleset'])` → `ch09aTplPick(type, p)` → `null` : rien ; `'aucun'` : repli D6 ; sinon `R = svDpHTML(ch11aFlat((o.fix||(x=>x))(ch01aPrep(t.rep)), job.F), [job], {jeu:t.jeu, type})` → `ch11aView(R.title||o.titre, R, {joindre:o.joindre, projet:o.projet})`.
- Repli D6 : `ctMsg('Information', 'Aucun modèle « '+CH09A_LBL[type]+' » dans le jeu de modèles « '+grp+' ». Impression de l\'ancien document.')`, puis `o.old()` si `o.old && ivFormVisible()`, sinon `ch11aView(o.titre, ch11aHTML(o.titre, …ch11aOldData(o.M)))`.
- Exceptions de rendu : `console.error`, puis même repli.
- `CH09A_LBL` : libellés [S `app.doc|Templates|<clé>`] des 19 types (tableau du § 5).

### 4.3 Champs communs : `ch09aF(p, extra)`

- `ch11aF0(p)` (date, reportDate, appUser, project et formats d'affaire) ;
- membres d'affaire pour les rôles 8 (Builder), 1 (Architect), 2 (ConstructionManager) **et 4 (ProjectManager)** : `F[k]`, `F[k+'Contact']` = `{t:'contact', id: CONTACT_ID}`, `F[k+'Responsible']` = `{t:'contact', id: RESPCONTACT_ID}` (membre = `svMember(p, rôle)` : non masqué, plus petit `SORTORDER`) ;
- `extra` fusionné en dernier.
- Collaborateur d'un document (`staff`) : `{t:'contact', id: staff.PERSON_ID}` (l'original appelle `getContactString(staff.getPerson(), style)`).
- Nombres des champs : `ch09aN(x)` = `num(rJ(x))` (2 décimales, apostrophe DeltaSub) ; heures nulles affichées « 0.00 ».

### 4.4 Menus « Rapports ▾ » : `ch09aMenu(o)`

`o = {docs:[{t, dis, fn}], olds:[{t, dis, fn}], fin:[…]}` → `[...docs, ...(olds.length&&ivFormVisible() ? ['-', ...olds] : []), ...(fin.length ? ['-', ...fin] : [])]`. Le suffixe « [Ancien document] » est ajouté par `ch09aOldLbl(t)` = `t+' [Ancien document]'` (Strings `legacyMenu` = « ␠[Ancien document] »). « pour la sélection » : `t.replace(' …', ' pour la sélection …')` [P `Rsrc.mapStringWithEllipsisAndCheckSelection`].

### 4.5 Ancien document par le socle : `ch09aOld(fam, o)`

`o = {cat, type, project, title, cols, rows, ctx, cover, fallback}`. Si `typeof ch09dOld==='function'` (lot 4 intégré), délègue (boîte « Paramètres » et favoris) ; sinon appelle `tplOr(()=>tplPrint(o), o.fallback)`. Toutes les entrées « [Ancien document] » des lots 1 à 3 passent par cette fonction, avec une famille parmi `CH09_FAM` (§ 5.9).

---

## 5. Écrans, dialogues et documents

Pour chaque document : **entrées de menu** (libellés exacts [S]), **données** (champs `F` et tableau `tables[<nom>] = {rows:[{c:[…par id], st, fuse}]}`), **modèles du bureau**. Valeurs nulles : cellule vide sauf indication. Styles : `tableRow` par défaut.

### 5.1 Heures ▸ Rapport (lot 1) [P `tm.AnalyzeFrame`, `tm.Report`, `tm.ReportTableModel`, `tm.JournalReport`, `tm.JournalTableModel`]

**Menu.** Le bouton imprimante « Imprimer le rapport … » devient **« Rapports ▾ »** (icône `doc`), actif si un collaborateur est sélectionné [P `checkGuards@1-21`] :

| Période (`HR.kind`) | Entrées | Document |
|---|---|---|
| `week` | « Afficher le rapport … » ; sép. ; « Récapitulatif … [Ancien document] » | `timeWeeklyReport` |
| `month` | « Afficher le rapport … » ; sép. ; « Récapitulatif … [Ancien document] » ; « Rapport … [Ancien document] » | `timeMonthlyReport` |
| `quarter`, `half` | « Afficher le rapport … » ; sép. ; « Récapitulatif … [Ancien document] » | `timeAnnualReport` (tableau trimestriel / semestriel) |
| `year` | idem + « Rapport … [Ancien document] » | `timeAnnualReport` |
| `journal` | « Afficher le rapport … » (pas d'ancien document) | `timeJournal` |
| `holiday` | « Afficher le rapport … » ; sép. ; « Aperçu des vacances … [Ancien document] » | `timeHolidayReport` |

- « Récapitulatif … [Ancien document] » et « Aperçu des vacances … [Ancien document] » → l'impression actuelle `hrPrint()` (dialogue « Paramètres d'impression », types DESIGN de `HR_TPL`), par `ch09aOld('time', …)`.
- « Rapport … [Ancien document] » (mensuel, annuel) → ancien `timeTemplates/timeJournal` sur **la période affichée** (mois ou année) [D : `openDetailAnalyze` = assistant en mode détail] : lignes du journal (§ ci-dessous) au format de `hrModel('journal')`, période étendue à l'année pour l'annuel.
- L'entrée du diagramme de l'original (`Charts.addChartPopupMenuItem`) n'existe pas dans DeltaSub (pas de diagramme sur cet écran) : non ajoutée.

**Champs** (`tm.Report$StringField` ; `F` de `ch09aTime(kind)`) :

| Champ | Valeur | Contrôle (STAFF 2801, août 2024) |
|---|---|---|
| `timePeriod` | libellé de période de l'écran (`hrRange()[2]`) | « août 2024 » [D] |
| `year` | année | 2024 |
| `weekOfYear` | n° de semaine ISO (hebdo) | — |
| `month` | nom du mois (`MOISL`), vide hors mensuel | « août » |
| `staff` | `{t:'contact', id: PERSON_ID}` | — |
| `total` | Σ heures effectives de la période | 176.50 |
| `targetTime` | Σ heures prévues (`hrMaps`) | 178.50 |
| `balance` | total − prévu | -2.00 |
| `cumulativeBalance` | solde cumulé depuis le 1er janvier | — |
| `staffTargetTimeReduction` | `STAFFTARGETTIME.TARGETTIMEREDUCTION` de l'année (0) | 0.00 (2753 en 2024 : 286.15) |
| `cumulativeBalanceTargetTimeIncluded` | solde cumulé + report | — |
| `overtime`, `overtimeBalance`, `overtimeCumulativeBalance` | totaux des colonnes 5 à 7 | — |
| `overtimeCumulativeBalanceTargetTimeIncluded` | appoint cumulé − report (pas dans le journal) | — |
| `staffHolidaySpentInReportYear` | vacances saisies de l'année | 189.75 (2801/2024) |
| `staffHolidaySpentInReportMonth` | vacances du mois (mensuel), 0 sinon | 0.00 |
| `staffHolidayPerYear` | `STAFF.HOLIDAYS` | 212.50 |
| `staffHolidayBalance` | `STAFF.HOLIDAYBALANCE` brut | 212.50 |
| `staffHolidayBalanceDate` | `{t:'date', v: HOLIDAYBALANCECHANGEDDATE}` | — |
| `staffNewHolidayBalance` | si année = `HOLIDAYBALANCEYEAR` : `HOLIDAYBALANCE − vacances de l'année` ; sinon **« – »** (tiret demi-cadratin) [P `ReportTableModel.getStaffNewHolidayBalance@0-37`] | 2024 : « – » ; 2801/2025 : 0.00 ; 2753/2025 : 53.50 |

Remarque : `staffNewHolidayBalance` **ne reprend pas** le report pluriannuel de `hrHoliday` (écran) ; il suit l'original.

**Tableaux** (nom = `weeklyReport`, `monthlyReport`, `annualReport` ou `holidayReport` selon le type du **modèle** ; le même jeu de lignes est fourni sous les 4 noms) :

| id | Hebdo / mensuel / trimestre / semestre / annuel | Vacances |
|---|---|---|
| 0 | Période : jour « E, d. MMMM yyyy » (hebdo, mensuel) ou mois « MMMM yyyy » (trimestre, semestre, annuel) ; libellés de lignes [S `ReportTableModel\|*`] : « 1er trimestre » … « 4ème trimestre », « 1er semestre », « 2ème semestre », « Total », « Report des heures supplémentaires », « Total incl. report des heures suppl. » | « MMMM yyyy » ; 1re ligne sans libellé si l'année est `HOLIDAYBALANCEYEAR` ; « Total » |
| 1 | Heures effectives | Vacances saisies du mois |
| 2 | Heures prévues | Différence = solde restant (ligne 1 : `HOLIDAYBALANCE`) |
| 3 | Différence | — |
| 4 | Solde cumulé (lignes de période seulement) | — |
| 5-7 | Heures d'appoint prévues, Heures d'appoint, Heures d'appoint prévues cumulées | — |

- Valeurs : nombres (`svDpHTML` formate `num(rJ())`), **vides si nulles**, et vides sur les lignes d'information sauf le solde cumulé et l'appoint non nul [P `fillTable@0-477`].
- Styles : lignes de période `tableRow` ; trimestres et semestres (grasses à l'écran) `tableLevel1Total` ; « Total » `tableTotal` ; reprise des rayures après chaque total (`resetTableAlternateRowColor` → `fuse` non utilisé, l'alternance repart : `{st:'tableRow', reset:1}` si `svDpHTML` le gère, sinon écart mineur E2).

**Journal mensuel** (`timeJournal`, tableau `JournalReport$TableField|table`) :

| id | Colonne | Contenu |
|---|---|---|
| 0 | Date | `{t:'date'}` / ISO (colonne date) |
| 1, 2 | Début, Fin | « HH:MM » |
| 3 | Durée [h] | `TIMEPERIOD` |
| 4 | Arrêt de travail [h] | pause avant la saisie (calcul de l'écran), vide si 0 |
| 5 | N° d'affaire (titre « Affaire » dans les modèles du bureau) | `PROJECT.NUMBER` |
| 6 | Ouvrage | `SUBPROJECT.CODE` |
| 7, 8 | Groupe d'activités, Activité | noms, ou « Vacances » pour une saisie de vacances |
| 9, 10 | Phase, Phase partielle | noms |
| 11 | Commentaire | `DESCRIPTION` |
| 12 | Complément | `PROJECT.TITLE` |
| 13 | Affaire | « NUMBER TITLE » |

- Lignes « **Total du jour** » [S `textDayTotal`] : `tableLevel1Total`, col. 3 = total du jour, col. 4 = pause du jour ; « **Total** » final : `tableTotal`. Avec « Détails du rapport » décoché (`HR.det`), seules les lignes de total sont fournies [P `isJournalDetailsVisible`].
- Champs : ceux du tableau ci-dessus sauf `overtimeCumulativeBalanceTargetTimeIncluded` ; `targetTime` = `TARGETHOURS<mois>`.

**Modèles du bureau** (contrôle visuel) : `timeWeeklyReport-fr` ; `timeMonthlyReport-fr` (signature, vacances) et `-1` « Rapport mensuel_Substances » ; `timeJournal-fr` (date figée « 31.01.22 », défaut du modèle, gardé : P4) et `-1` « Fiche d'heures mensuel » (`LineBand` rendue par `ch01aPrep`) ; `timeAnnualReport-fr` (5-7 masquées ; libellé « Total\n ») ; `timeHolidayReport-fr` (titre « Vacances saisies »).

### 5.2 Heures ▸ Disponibilité (lot 1) [P `tm.PlanningFrame`, `ProjectTimeTableModel`, `ProjectTimeLogTableModel`]

- Menu existant « Rapports ▾ » (actif si collaborateur sélectionné et type 1 ou 4) : « Afficher le rapport … » → `ch09aDispo()` au lieu de `dpPrint()` ; pas d'ancien document. `dpPrint` reste le repli D6.
- Documents : type 0 → `timeProjectTimeReport` ; type 3 → `timeProjectTimeLogReport` (groupe général).
- Champs : `year`, `staff` (`{t:'contact'}`).
- Tableau `table` : id 0 Désignation, ids 1 à 12 = mois (« janv. » … « déc. ») ; lignes = `dpModel().rows` (`{d, v[12]}`) :
  - Heures disponibles : valeurs **en texte** `ch09aN`, vides si nulles ; lignes « grasses » → `tableLevel1Total`.
  - Solde du temps disponible : valeurs nombres ; 1re et dernière lignes `tableLevel1` ; ligne n−3 `tableLevel1Total` ; **« Part effectuée » en rouge si < 80** (style de cellule rouge : `c` = `{v, color:'#ff0000'}` si `svDpHTML` l'accepte, sinon `<span>` rouge dans la valeur texte ; à vérifier au lot).
- Contrôle : STAFF 2752 / 2023, « Travail interne » par mois = 178.50, 170.00, 195.50, 153.00, 178.50, 187.00, 178.50, 187.00, 170.00, 187.00, 187.00, 161.50 (rech_exist § 3.5).

### 5.3 Notes de frais ▸ Rapport : « Liste des notes de frais » (lot 2) [P `deltaproject.expenses.AnalyzeFrame`, `ProjectCostList`, `expenses.ProjectCostTableContent`]

- Le bouton imprimante « Imprimer le rapport » devient **« Rapports ▾ »** (actif avec un collaborateur) : « Afficher le rapport … » → `ch09bExpenses()` ; sép. ; « Rapport … [Ancien document] » → `nfrPrint()` (par `ch09aOld('expenses', …)`).
- Document `expensesReport` (groupe général).
- Champs :
  - `period` : semaine « Semaine <n>, <année> » ; mois « <mois> <année> » ; autres « <libellé de la période> <année> » (« 1er trimestre 2025 », « Année 2025 ») [P `getReportName@0-95`] ;
  - `year`, `month` (**index 0-11 brut**, P2), `weekOfYear`, `staff` ;
  - `total`, `totalChargeable`, `totalRefundable` : par monnaie (`PROJECT.CURRENCY`, CHF par défaut), « <MONNAIE> <montant> », plusieurs monnaies séparées par « / » [P `totalMapToString@0-105`] ; facturable = `ISCHARGEABLE`, remboursable = `ISREFUNDABLE` ; montant = `pcAmount`.
- Tableau `table` (lignes = `nfrRows()`, ordre de l'écran) :

| id | Colonne | Contenu |
|---|---|---|
| 0 | Date | date ISO |
| 1, 2 | Groupe de frais, Genre de frais | noms |
| 3 | N° pièce | `DOCUMENTNUMBER` |
| 4 | Désignation | `DESCRIPTION` |
| 5 | Quantité | nombre |
| 6 | Unité | `UNIT` |
| 7 | Prix | nombre |
| 8 | Monnaie | `PROJECT.CURRENCY` |
| 9 | Montant | nombre |
| 10 | Collaborateur | `staffName` |
| 11-14 | Facturable, Facturé, Remboursable, Ristourné | booléens |
| 15 | N° d'affaire | `NUMBER` |
| 16 | Ouvrage | `CODE` |
| 17, 18 | Phase, Phase partielle | noms |
| 19 | Complément | `TITLE` |
| 20 | Affaire | « NUMBER TITLE » |

- Totaux (si `isTV` du réglage ; `svDpHTML` lit le réglage) : une ligne par monnaie, `tableTotal`, col. 1 « Total », col. 8 monnaie, col. 9 montant.
- L'option d'écran « Additionner les totaux par affaire » n'a pas d'effet sur le document (l'original passe la liste de l'écran sans sous-totaux) [D].
- Modèle du bureau (2023) : colonnes visibles Date, Affaire (= n°, id 15), Genre de frais, Quantité, Unité, Prix, Monnaie, Montant ; « Total remboursable » dans un bloc de texte décalé ; bande Signatures.
- Contrôle : STAFF 2753, 2025, mois 8 → 13 lignes, `total` « CHF 146.30 », `totalChargeable` « CHF 146.30 », `totalRefundable` « CHF 146.30 » ; STAFF 2751, 2022, mois 8 → total 359.80, remboursable 302.40 ; mois 6 → 340.20, 134.40.

### 5.4 « Liste des affaires » (lot 2) [P `ProjectDefinitionFrame.getReportsPopupMenu@0-109`, `ProjectListDialog.showReport@1-54`, `ProjectListTableContent`]

- Affaires ▸ Gestion ▸ « Documents ▾ » : « Liste des affaires … » → `ch09bProjectListOpen()` ; sép. ; « Liste des affaires … [Ancien document] » → `printProjects(AF.g.view)`.
- `ch09bProjectListOpen()` : si CH-05 a fourni son dialogue (`typeof ch05ProjectListDialog==='function'`, nom à confirmer avec CH-05), l'ouvrir ; sinon imprimer directement **les affaires sélectionnées, sinon toutes les affaires visibles** de Gestion, dans l'ordre affiché, avec `filterDesc` = libellé du filtre courant de Gestion (vide s'il n'y en a pas) [D : équivalent du dialogue sans son propre filtre].
- `ch09bProjectList(rows, filterDesc)` (interface publique, document `projectList`, groupe général).
- Champ `filterDesc`.
- Tableau `table`, ids de la classe 16.05 :

| id | Colonne | Contenu |
|---|---|---|
| 0 | Numéro | `NUMBER` |
| 1 | Affaire | `TITLE` |
| 2 | Maître d'ouvrage | désignation abrégée du maître d'ouvrage (`svShortDesc`) |
| 3 | Adresse-Maîtres d'ouvrage | entité et adresse, multiligne |
| 4 | Statut | `projState` |
| 5, 6 | Début, Fin | dates ISO (`PROJECTSTARTDATE`, `PROJECTENDDATE`) |
| 7 | Phase en cours | nom de `CURRENTPROJECTPHASE` |
| 8 | Tri | `SORTLABEL` |
| 9 | Actif | booléen |
| 10-19 | Description, N° externe, Indice de base, dates de planification et de travaux, Zone/quartier, Volume construit | selon `ProjectListTableContent.fillTable` (masquées dans le modèle) |

- **Correction D1** (`fix` de `ch09aRun`) : si la bande `ProjectList$TableField|table` a un réglage **sans colonne d'id ≥ 9** et dont la colonne d'id 3 n'est pas de type texte nommé « Adresse… », alors les ids 3 à 8 du réglage deviennent 4 à 9 (sur la copie du modèle). Au bureau : seul `0/projectList-fr.dpdoc` est concerné. Sans correction (D1 refusé), le remplissage reste par id, comme l'original.
- Pas de ligne de total.

### 5.5 « Liste des adresses » (lot 2) [P `AddressListFrame.getReportsPopupMenu@0-587`, `showContactListReport@1-83`, `dd.ContactListTableContent`]

- Adresses ▸ (Liste, Favoris, Groupes, Propriétés, Chercher) ▸ « Prévisualisation ▾ » : **« Liste d'adresses … »** (ou « Liste d'adresses pour la sélection … » s'il y a une sélection) → `ch09bContactList(rows, filterDesc)` ; puis les entrées existantes ; sép. ; « Liste d'adresses … [Ancien document] » → `printAdr(st.g.view, 'Liste d’adresses')`. Les autres entrées (« Etiquettes … », « par entité … », « par CFC … », « Liste des entités … [Ancien document] ») relèvent de CH-04.
- `filterDesc` = nom du groupe d'adresses sélectionné, sinon de la propriété sélectionnée, sinon vide ; lignes = sélection, sinon toutes les lignes visibles.
- Tableau `table`, 31 positions [P `fillTable`] : 0 icône (texte vide), 1 entité (`getContactOwnerDesc`), 2 appartient à, 3 type d'adresse, 4 à 7 formats `contactOwnerAndAddress`, `contactAddress`, `contactAddressSingleLine`, `contactAddressDoubleLine`, 8-10 NAME1-3, 11 rue, 12 case postale, 13 « NPA localité », 14 pays, 15-20 téléphones, fax, courriel, Skype, internet, 21 abréviation, 22 CFC, 23 civilité, 24 remarque, 25 fonction, 26 profession, 27 statut, 28 langue, 29-30 dates de création et de modification.
- Modèle du bureau : deux colonnes d'id 25 (Remarque et Fonction, masquées), aucune d'id 24 : sans effet visible.

### 5.6 « Intervenants » (lot 2) [P `ProjectMemberFrame`, `GroupedContactReport.getGroupedData`, `ProjectMemberListTableModel.fillTable`]

- Domaine Intervenants ▸ « Documents ▾ » (ordre de l'original) :
  1. « Liste d'adresses … » (« … pour la sélection … ») → `ch09bMembers(p, membres, 'role', '')` ;
  2. « Liste d'adresses par CFC … » → `ch09bMembers(p, membres, 'bkp', '')` ;
  3. sép. ; « Liste d'adresses … [Ancien document] » → impression actuelle `printAdr(…,'Liste des adresses d’affaire',p)` ; « Liste par rôle et CFC … [Ancien document] » → `printMembers(p, rows())`.
- « Etiquettes … » et « Etiquettes … [Ancien document] » : CH-04.
- Document `projectMemberList`, **groupe de l'affaire**. Champs : `filterDesc` (vide ici ; « Entreprises » depuis le navigateur de CH-05), champs d'affaire de `ch09aF(p)` (dont `projectMemberProjectManager`).
- Membres = sélection, sinon tous les membres non masqués affichés.
- **Regroupement** : par rôle (ordre `memberSort`) ou par CFC (« n° et texte CFC » triés ; un membre peut figurer sous plusieurs CFC ; sans CFC → sous son rôle, sinon groupe « sans CFC »).
- Tableau `table` : rangée vide entre deux groupes ; titre de groupe en rangée pleine largeur (`fuse`, `tableLevel1`) ; entité `tableLevel2` (col. 0 désignation, col. 1 `contactOwnerAndAddress`, col. 2 `contactAddress`) ; membre : col. 3 Responsable (s'il diffère de l'entité), 4-7 téléphone, mobile, courriel, internet, 8 Domaine spécialisé, 9 Fonction, 10 CFC, 11 Note.
- Modèles : jeu 1 (2025, « Liste des entreprises ») ; jeu 2 (« Liste des intervenants », avec « Direction de l'affaire »).
- Contrôle : affaire 915 (jeu 1) = 47 intervenants visibles, 34 avec CFC ; affaire 913 (jeu 2) = 38.

### 5.7 Tâches (lot 2) [spec_7 § 6.1-6.2 ; P `ProjectTaskFrame.getReportsPopupMenu@0-274`, `TaskFrame.getReportsPopupMenu@0-62`]

- Module Tâches ▸ document : « Tâche d'affaire … » (une ligne) → `ch09bTask(t)` (`projectTask`, groupe de l'affaire de la tâche).
- Domaine Tâches de l'affaire ▸ document : « Tâche … » (exactement une ligne) → `ch09bTask` ; « Liste des tâches de l’affaire … » (sélection, sinon lignes visibles ; `filterDesc` = libellé du filtre) → `ch09bTaskList(list, p, filtre)` ; sép. ; « Liste … [Ancien document] » → `ptPrintList(…)` ; « Tâche … [Ancien document] » → `ptPrintTask(one())`.
- Champs de `projectTask` : `subject`, `startDate`, `deadline`, `doneDate` (dates), `taskState` (`PT_STATE`), `taskPriority` (`PT_PRIO`), `userName` (créateur ; défaut du modèle d'origine gardé), `description` (texte et notes, `ptDescText`), membres d'affaire `contactAddress` (dont ProjectManager).
- Tableau de `projectTaskList` : colonnes 0-13 de spec_7 § 6.2.
- Pied « Seite … » du modèle `projectTask` : gardé (P4).

### 5.8 Controlling de l'affaire (lot 3) [P `pc.*`, `dd.TimeLogTableContent`, `dd.ProjectCostTableContent`]

**Menus du pied de `ctlAnalyse`** (heures `timelog`, frais `projectcost`) :

- Roue (après « Modifier … ») : « **Grouper …** » (actif si le résultat a des lignes) et « **Grouper les positions sélectionnées …** » (actif s'il y a une sélection), pour les heures **et** les frais. Les 5 entrées « Grouper : X » sont retirées.
- Document ▾ (rapports) :
  1. « **Afficher le rapport …** » (résultat non vide) → « Composer le rapport » sur le résultat (ordre affiché) ;
  2. « **Afficher le rapport pour les positions sélectionnées …** » (sélection) → idem sur la sélection ;
  3. sép. et, si `ivFormVisible()` — heures : « Etablir le document d’analyse … [Ancien document] », « Etablir le document d’analyse des collaborateurs … [Ancien document] », « Afficher le rapport pour les positions sélectionnées … [Ancien document] », « Etablir le document d’analyse des collaborateurs pour les positions sélectionnées … [Ancien document] » ; frais : « Etablir le document d’analyse … [Ancien document] », « Afficher le rapport pour les positions sélectionnées … [Ancien document] ».
- Anciens : liste détaillée → `projectTimeJournal` / `projectCostJournal` (colonnes et lignes de l'écran, comme `ctlPrint`) ; collaborateurs → `projectTime` avec les lignes du récapitulatif par collaborateur (§ 5.8.3, sans totaux de période). `ch11dCtlCtx(p)` est appelé avant chaque impression (ancienne ou nouvelle).
- `timeFilterDesc` = « Filtre par date » actif : « <début> à <fin> » (dates JJ.MM.AAAA ; une seule borne : la seule date), vide sinon [D `getTimeFilterDesc`] ; `filterDesc` = sélections (ouvrage, groupe, activité ou genre, phase, phase partielle, collaborateur) mises bout à bout, séparées par « , » [P `getFilterDesc@3673`, `appendText`].
- **Tri `SORTORDER` des listes de filtre** (spec_13 § 8 n° 2) : `ch09cSort(rows)` trie par `SORTORDER` puis nom (phases et phases partielles : `NUMBER`), appliqué aux listes de `mk`.

#### 5.8.1 « Composer le rapport » (heures) — `ch09cComposeT(p, rows, timeFilter, filterDesc)` [P `pc.TimeControllingReportDialog`] [S `TimeControllingReportDialog|*`]

- Dialogue modal « **Composer le rapport** » ; en-tête « **Rapport d'heures** » / « **Les rapports d'heures selon les paramètres du filtre** ».
- Boutons radio : « Tri selon affichage » · « Tri par collaborateur avec sous-total » · « Tri par activité avec sous-total » · « Tri par phase partielle avec sous-total » · « Récapitulatif par collaborateur ».
- Cases : « Totaux par mois », « Totaux par trimestre », « Totaux par semestre », « Totaux par année » — **actives seulement avec « Récapitulatif par collaborateur »**.
- « Annuler » (Échap), « OK » (par défaut), **actif si un bouton radio est coché** ; défaut « Tri selon affichage » ; préférence `ds_ch09_cr_t` lue à l'ouverture, écrite à l'OK.
- OK : choix 1-4 → `projectTimeLog` (`SortedBy` none, staff, activity, subPhase) ; choix 5 → `projectTimeLogStaff`. Les deux par `ch09aRun(type, p, …, {joindre:()=>ch11dPickInvoice(p), projet:p.ID})`.

#### 5.8.2 « Journal des heures » (`projectTimeLog`)

- Champs : `timeFilter`, `filterDesc`, `currency` = **monnaie principale** (`mainCurrency`, CHF à défaut), `totalTimePeriod` = Σ heures, `totalAmount` = Σ `tlFee`, `totalStaffAmount` = Σ `tlCost` (tous par `ch09aN`).
- Tableau `timeLogTable` (17 positions) : 0 Date · 1 Début · 2 Fin · 3 Durée · 4 Tarif (`tlRate`) · 5 Montant (`tlFee`) · 6 Statut (`TSTATE`) · 7 Facturable · 8 Facturé · 9 Personne · 10 Groupe d'activités · 11 Activité · 12 Affaire (**NUMBER**) · 13 Ouvrage · 14 Phase · 15 Phase partielle · 16 Commentaire.
- Tri et groupes : collaborateur (nom), activité (groupe d'activités puis activité ; titre « Activité, Groupe d'activités »), phase partielle (phase puis phase partielle ; titre « Phase partielle, Phase » ou « Pas de phase partielle ») ; à chaque changement : total du groupe précédent (`tableLevel1Total` : col. 0 « Total <nom> », col. 3 heures, col. 5 montant), puis titre pleine largeur (`tableLevel1`) ; ligne finale « Total » (col. 3 et 5) si `isTV`.
- Modèle du bureau : visibles Date, Personne, Phase, Phase partielle, Durée, Montant, Commentaire.

#### 5.8.3 « Rapport heures - facturation - coût de revient » (`projectTimeLogStaff`)

- Champs : comme § 5.8.2 (libellés de l'original : « Total coûts » pour `totalAmount`, sic).
- Arbre : total → année (si « Totaux par année ») → semestre → trimestre → mois (selon les cases) → collaborateur. Libellés : « Année » ; « 1er semestre », « 2ème semestre » ; « 1er trimestre » … ; nom du mois ; nom du collaborateur. Parcours en profondeur, enfants avant leur sous-total.
- **Ordre chronologique des mois** (écart assumé E3 : l'original trie la clé texte « M: aaaa.m » et place octobre à décembre avant février [D]).
- Colonnes `timeLogStaffTable` : 0 Année (sur les rangées d'année), 1 Désignation, 2 Durée, 3 Honoraires, 4 Frais des collaborateurs, 5 Honoraires − frais (texte), 6 Tarif = honoraires ÷ heures, 7 Taux horaire du collaborateur = frais ÷ heures (0 si heures nulles). Styles `tableRow`, `tableLevel1Total`, `tableTotal`.
- Contrôle : affaire 702, couples année × collaborateur (rech_exist § 3.5, [D]) : 2019 / 2756 = 353.50 h, 37’276.58, 35’350.00.

#### 5.8.4 « Grouper les heures de l'affaire » et « Grouper les coûts » — `ch09cGroup(kind, p, rows, timeFilter, filterDesc)` [P `pc.TimeControllingSummaryDialog`, `pc.ProjectCostControllingSummaryDialog`]

- Titre « **Grouper les heures de l’affaire** » / « **Grouper les coûts** ».
- Boutons radio (ordre de l'énumération) :
  - heures : Collaborateur · Activités · Activités avec phases · Phases · Phases et activités · Ouvrage · Ouvrage avec activités · Ouvrages avec phases · **Personnalisé** ;
  - coûts : Collaborateur · Genre de frais · Genre de frais et phases · Phases · Phases et frais · Ouvrage · Ouvrage et frais · Ouvrages et phases · **Personnalisé**.
- Personnalisé : bouton « + ▾ » actif seulement avec Personnalisé ; menu = les 8 regroupements (chacun grisé s'il est déjà choisi) puis « Supprimer » (grisé si la liste est vide, vide la liste) ; étiquette « - » ou noms séparés par « , ». Tableau recalculé à chaque changement.
- Barre : « Rapports ▾ » : « Afficher le rapport … » (tableau non vide) ; roue : « Copier le contenu du tableau dans le presse-papier », « Exporter le tableau dans un fichier CSV … ». Bouton « Fermer ». Préférences `ds_ch09_gr_t` / `ds_ch09_gr_c`.
- **Calcul** : pour chaque regroupement choisi : rangée vide entre deux regroupements, titre (nom du regroupement, texte seul), puis l'arbre à 1 ou 2 niveaux, sous-totaux (`tableLevel1Total`… `tableLevel3Total`), total (`tableTotal`).
  - Heures : clés collaborateur (nom), groupe d'activités / activité (`SORTORDER`), phase / phase partielle (`NUMBER`), ouvrage (`SORTORDER`) ; « Pas de phase », « Pas de phase partielle », « pas d'ouvrage », « Pas d’activité » ; prévisions `TIMEBUDGET` et `TIMEAMOUNTBUDGET` du niveau 1.
  - Coûts : collaborateur (`STAFF.ID`, « - » sans collaborateur), groupe puis genre de frais (`SORTORDER`), phase / phase partielle (`NUMBER`), ouvrage ; montant = Σ `pcAmount` ; prévision **au premier niveau seulement** : `PROJECTCOSTCATEGORYGROUP.BUDGET`, `PROJECTCOSTCATEGORY.BUDGET`, `PROJECTPHASE.COSTBUDGET`, `PROJECTSUBPHASE.COSTBUDGET`, `SUBPROJECT.COSTBUDGET` ; « Prévision − Frais » vide sans prévision.
- Colonnes écran = colonnes du document :
  - heures (`timeLogSummaryTable`) : 0 Désignation · 1 Heures prévues · 2 Durée [h] · 3 Budget-Durée [h] · 4 Honoraires · 5 Frais des collaborateurs · 6 Honoraires-Coûts des collaborateurs · 7 Honoraires prévus · 8 Honoraires prévus-Honoraires · 9 Tarif · 10 Taux horaire du collaborateur ;
  - coûts (`projectCostSummaryTable`) : 0 Désignation · 1 Coûts · 2 Prévision · 3 Prévision - Frais.
- Documents : `projectTimeLogSummary` / `projectProjectCostSummary` (groupe de l'affaire, pièce jointe), champs `timeFilter`, `filterDesc`, `currency`.
- `ctlGroup` (ancien dialogue) reste dans le fichier, non appelé.
- Contrôle : affaire 702, activité 539 : 3’229.50 h, honoraires 340’550.77 (même demi-centime que le § 1 n° 13 : comparer à 0.01 près) / prévision 1’185.34 h et 150’000.00 ; frais : groupe 157 = 8’729.70, genres 183 = 759.92 et 185 = 7’969.78 ; prévisions de frais toutes nulles au bureau (202 groupes, 1 158 genres).

#### 5.8.5 « Composer le rapport » (frais) et « Rapport des frais » (`projectProjectCost`)

- Dialogue « **Composer le rapport** », en-tête « **Rapport de frais** » / « **Rapports de frais selon les paramètres du filtre** » ; radios « Tri selon affichage » · « Tri par collaborateur avec sous-total » · « **Trié** par groupe de frais avec sous-total » (sic ; tri par **genre**, titre « Genre, Groupe ») · « Tri par phase partielle avec sous-total ». OK actif si un choix est fait. Préférence `ds_ch09_cr_c`.
- Champs : `timeFilter`, `filterDesc`, `currency`, `totalAmount` = Σ montant.
- Tableau `projectCostTable` : 0 Date · 1 Groupe de frais · 2 Genre de frais · 3 N° pièce · 4 Quantité · 5 Unité · 6 Prix · 7 Montant · 8 Monnaie · 9 Statut · 10 Facturable · 11 Facturé · 12 Collaborateur · 13 Affaire (NUMBER) · 14 Ouvrage · 15 Phase · 16 Phase partielle · 17 Désignation ; groupes et totaux comme § 5.8.2, montant en col. 7.
- Contrôle : affaire 702 → 112 lignes, `totalAmount` 8’729.70 ; affaire 902 → 9 lignes, 109.80.

### 5.9 Anciens documents : « Paramètres », favoris, Management et Reporting (lot 4)

#### 5.9.1 Familles et enveloppe `ch09dOld(fam, o)`

`CH09_FAM` : `time` (Heures ▸ Rapport), `expenses`, `projectTime`, `projectCost` (Controlling), `members`, `tasks`, `projects`, `addresses`, `management` (une famille par type `management*`). `ch09dOld` ouvre la visionneuse « Préparation du document… » (comme `ch11aOld`), applique le **favori sélectionné** de la famille, puis appelle `tplPrint` avec `win: ch11aWin(v.maj)` ; la visionneuse reçoit un bouton **« Paramètres »** (et « Editer les favoris ») qui rouvre la boîte et redessine.

#### 5.9.2 Boîte « Paramètres » [P `viewer.Viewer`, CH-11 § 13] [S `Viewer|*`, `*PreferencesDialog|*`]

- Onglet « Document » : « Modèle » (liste des groupes de modèles DESIGN qui ont le type : `tplFind` en ordre ; défaut : groupe de l'affaire, groupe par défaut, Standard, Default), « Titre du document », « Date » (date du document, défaut aujourd'hui), « Document avec page de garde ».
- Onglet « Présentation » : colonnes (case « visible » et ordre par glisser, « Répartition des colonnes » = largeurs relatives).
- Les réglages de police, taille, interligne et fond alterné de l'original ne sont **pas** proposés : `tplPrint` ne sait pas les rendre (écart E4).
- Favoris : liste « Favori » (« Standard » + favoris du poste), « Ajouter aux favoris » (dialogue « Favori » : Nom, OK actif si non vide et non déjà pris), « Retirer de la liste des favoris » (grisé sur « Standard »), confirmation par `ivAsk`. Stockage `ds_ch09_fav_<famille>`.

#### 5.9.3 Management et Reporting : 10 types + 2 renvois [P `showLegacyReport` de chaque fenêtre ; rech_orig § 6]

Entrée « Afficher le rapport … [Ancien document] » ajoutée après un séparateur, si `ivFormVisible()`, à côté de « Afficher le rapport … » ; même règle d'activation (tableau non vide ; Maîtres d'ouvrage et Analyse des heures : ligne sélectionnée). Données : colonnes visibles et lignes de l'écran (`ch11aOldData(M)` : lignes grasses et surlignées) ; en-têtes des pages = ceux du modèle (`*Page`).

| Écran DeltaSub | Type DESIGN | Titre par défaut [S] |
|---|---|---|
| Management ▸ Maître d'ouvrage (`mg-mo`) | `managementBuilderAnalysis` | « Analyse » |
| Management ▸ Controlling ▸ Collaborateurs - Affaires (`sp`) | `managementEmployeeProjectAnalysis` | « Collaborateurs » |
| … ▸ Affaires - Collaborateurs (`ps`) | `managementProjectEmployeeAnalysis` | « Collaborateurs » |
| … ▸ Affaires - Phases (`ph`) | `managementProjectReportPhases` | « Phases » |
| … ▸ Affaires - Activités (`ac`) | `managementProjectReportActivities` | « Activités - Affaires » |
| Management ▸ Collaborateurs (catégories sauf Liste) | `managementStaffAnalysis` | « Heures prévues », « Situation d'heures », « Solde des heures », « Heures supplémentaires », « Situation de frais », « Situation des vacances », « Droit aux vacances » selon la catégorie |
| Management ▸ Collaborateurs ▸ Liste | `managementStaff` (renvoi `AdrListWizardDialog`) | « Liste des collaborateurs » |
| Management ▸ Analyse des heures (`mg-heures`) | `managementProjects` | « Récapitulatif-Affaire » |
| Management ▸ Genres (`mg-genres`) | renvoi : ancienne « Liste des affaires » (`printProjects` sur les affaires du genre) | « Liste des affaires » |
| Management ▸ Reporting (toutes catégories) | `managementTimeReportStaff` (catégorie Collaborateurs, collaborateur choisi) ou `managementTimeReportSummary` (autres) [D, à confirmer au lot par `mgl.Timereport.analyse`] | « Statistiques des heures de travail » |

- Messages de l'original [S `*|msg1..3`] si le modèle n'a pas de champ de liste ou est introuvable : « Le modèle de première page ne contient pas de champ de liste. », « Le modèle de page suivante ne contient pas de champ de liste. », « Impossible de trouver le modèle. » (puis repli tableau).
- Les catégories « Rapport des heures - Phases / Activités » n'ont pas d'ancien document (§ 1 n° 8).

### 5.10 Messages exacts (récapitulatif)

| Où | Texte | Source |
|---|---|---|
| Groupe de modèles introuvable | « Information » / « DocTemplateGroup '<groupe>' (<type>) not found! » | [P `browseTemplate`] (déjà dans `ch01aTplPick`) |
| Aucun modèle du type (D6) | « Information » / « Aucun modèle « <libellé> » dans le jeu de modèles « <groupe> ». Impression de l'ancien document. » | [C] |
| Ancien document sans modèle | « Le modèle de première page ne contient pas de champ de liste. » / « Le modèle de page suivante ne contient pas de champ de liste. » / « Impossible de trouver le modèle. » | [S] |
| Favori | « Ce nom est déjà utilisé. » (toast) | convention DeltaSub |

---

## 6. Valeurs de contrôle

### 6.1 Recalcul pour ce cahier (copie `dpx/out` du bureau, règles du § 5.8.2)

| Cas | Lignes | Heures | Honoraires (`totalAmount`) | Coût de revient (`totalStaffAmount`) |
|---|---|---|---|---|
| Journal des heures, affaire 2801, 2025 (filtre par dates 01.01.2025 à 31.12.2025) | 247 | **333.75** | **45’056.25** | **23’632.50** |
| idem, affaire 902, 2025 | 166 | **264.00** | **35’640.00** | **24’531.25** |
| idem, affaire 501, 2025 | 2 023 | **1’888.00** | **0.00** (activités sans groupe de tarifs) | **148’322.50** |
| affaire 902, toutes années | 1 042 | 2’128.00 | 263’958.75 | 173’491.75 |
| affaire 702, toutes années (non utilisé au centime) | 967 | 3’231.50 | 340’550.77 (double) / .78 (décimal) | 200’706.29 |
| Liste des notes de frais, STAFF 2753, 2025, mois 8 | 13 | — | `total` CHF 146.30, remboursable CHF 146.30 | — |
| Rapport annuel, STAFF 2753, 2025 : `staffNewHolidayBalance` | — | 191.25 − 137.75 = **53.50** | — | — |
| Rapport annuel, STAFF 2801, 2025 / 2024 | — | **0.00** / « – » | — | — |
| Rapport mensuel, STAFF 2801, août 2024 | 155 | `total` 176.50, `targetTime` 178.50, `balance` -2.00 | — | — |

### 6.2 Tests jsc (fonctions pures ; fixture construite par le test, identifiants seulement)

- **T-A1** `ch09aTime('month')` sur une fixture d'un mois (STAFF fictif, 3 saisies dont 1 vacances, durée prévue 168.00) : champs `total`, `targetTime`, `balance`, `staffHolidaySpentInReportMonth`, `staffNewHolidayBalance` (« – » hors `HOLIDAYBALANCEYEAR`) ; tableau id 1 = effectif, id 2 = prévu ; ligne « Total » en `tableTotal`.
- **T-A2** `ch09aTime('quarter')` → 3 mois + « Total », type demandé `timeAnnualReport`.
- **T-A3** `ch09aTime('holiday')` → 12 lignes « MMMM yyyy » (+ ligne de droit si l'année est `HOLIDAYBALANCEYEAR`), col. 2 = solde décroissant, « Total ».
- **T-A4** `ch09aJournal` → « Total du jour » `tableLevel1Total`, « Vacances » en col. 7-8, col. 5 = numéro.
- **T-A5** `ch09aTplPick` avec `ch08cDocLangs` simulé (`['fr']` → délégation ; `['fr','de']` → liste à deux langues).
- **T-B1** `ch09bExpensesF` : « CHF 146.30 » ; deux monnaies → « CHF 10.00 / EUR 5.00 ».
- **T-B2** correction D1 : réglage `projectList` à 9 colonnes → ids 3-8 décalés ; réglage 16.05 (≥ 10 colonnes) inchangé.
- **T-B3** `ch09bMembersRows` par rôle et par CFC (membre à 2 CFC présent deux fois ; sans CFC sous son rôle).
- **T-C1** `ch09cTimeLogRows` tri par activité : titres « Activité, Groupe », totaux de groupe, total final.
- **T-C2** `ch09cStaffTree` avec M+Q+Y : ordre chronologique, parcours enfants puis sous-total, tarif = honoraires ÷ heures.
- **T-C3** `ch09cGroupRows('cost', ['costCategory'])` : prévision au premier niveau seulement ; « Prévision − Frais » vide sans prévision.
- **T-C4** sur la **copie du bureau** (script du lot qui charge les CSV de `dpx/out` en mémoire, sans écrire de fichier de données) : 2801/2025 et 902/2025 au centime (tableau § 6.1) par `tlFee`/`tlCost`.
- **T-D1** `ch09dFav` : ajout, doublon refusé, retrait, « Standard » non retirable ; `localStorage` qui lève une exception → défaut sans erreur.
- **Syntaxe** : `jsc -e "new Function(readFile('f.js'))"` sur le script complet (DeltaSub.html construit + lot).

### 6.3 Essais navigateur (copie isolée, un port par lot : 7891 à 7894, onglet propre, `localStorage.ds_user='2752'`)

- **N1** (lot 1) : Heures ▸ Rapport, STAFF 2801, août 2024, « Rapports ▾ » : 1 nouveau + 2 anciens ; « Afficher le rapport … » → « Choisir le modèle » (2 lignes) → « Rapport mensuel_Substances » rendu dans la visionneuse (vérifier dans l'iframe : titre, 176.50, -2.00, tableau Période | Heures effectives | Heures prévues | Différence) ; Journal mensuel → dialogue → « Fiche d'heures mensuel » ; Rapport trimestriel → « Rapport annuel » avec 3 mois ; Rapport des vacances 2025 → 12 mois.
- **N2** (lot 1) : Disponibilité STAFF 2752 / 2023 → « Heures disponibles » ; « Part effectuée » < 80 en rouge.
- **N3** (lot 2) : Notes de frais STAFF 2753 septembre 2025 → CHF 146.30 ; Liste des affaires (Gestion) avec et sans D1 ; Liste d'adresses pour la sélection ; Intervenants 915 (jeu 1) et 913 (jeu 2, « Direction de l'affaire ») ; tâche de `dstest`.
- **N4** (lot 3) : affaire 2801, filtre 2025 : « Afficher le rapport … » → « Composer le rapport » (règles d'activation), Journal des heures 333.75 / 45’056.25 / 23’632.50 ; Récapitulatif par collaborateur avec mois ; Grouper … Personnalisé (Phases + Collaborateur) → Analyse détaillée ; frais 702 → Rapport des frais 8’729.70, Grouper les coûts ; « Enregistrer le PDF en pièce jointe … » proposé (sans enregistrer sur une facture réelle de la copie : annuler au choix de la facture).
- **N5** (lot 4) : « Récapitulatif … [Ancien document] » → bouton « Paramètres » → favori « essai » ajouté puis retiré ; Management ▸ Maître d'ouvrage et ▸ Controlling ▸ Affaires - Phases « [Ancien document] ».
- Fin de chaque essai : serveur arrêté, onglet fermé, taille d'affichage par défaut.

---

## 7. Défauts de l'original et écarts assumés

### 7.1 Défauts de l'original (traitement)

| # | Défaut | Traitement |
|---|---|---|
| P1 | Controlling : monnaie principale au lieu de celle de l'affaire | reproduit (CHF partout au bureau) |
| P2 | `month` de la liste des notes de frais = index 0-11 brut | reproduit (inutilisé par le modèle du bureau) |
| P3 | Ordre alphabétique des mois dans `projectTimeLogStaff` | **corrigé** (E3) |
| P4 | Textes figés des modèles (« 31.01.22 », « Seite », « Tatal facturable », « Informatin signature », « Solde de vacances à repoter ») | gardés : les modèles sont des données (éditeur : CH-14) |
| P5 | `projectList` du jeu 0 décalé | corrigé à la lecture (D1) |
| P6 | Aucun modèle dans le jeu de l'affaire → rien ne s'ouvre, sans message | message et ancien document (D6) |

### 7.2 Écarts assumés

| # | Écart | Raison |
|---|---|---|
| E1 | Milliers « ' » au lieu de « ’ » | convention de toutes les impressions DeltaSub (`num`) |
| E2 | Reprise des rayures après un total (`resetTableAlternateRowColor`) | rendue si `svDpHTML` sait repartir l'alternance ; sinon alternance continue |
| E3 | Mois en ordre chronologique dans le récapitulatif par collaborateur | défaut P3 |
| E4 | « Paramètres » des anciens documents sans police, taille, interligne, fond alterné | limites de `tplPrint` |
| E5 | Pas d'entrée de diagramme dans Heures ▸ Rapport | l'écran DeltaSub n'a pas de diagramme |
| E6 | Favoris des anciens documents par poste et par navigateur | équivalent des XML locaux de l'original (D2) |

---

## 8. Écarts hors chantier signalés (non traités)

1. **Heures ▸ Rapport, écran** : sélecteur de période en trois boutons (Récapitulatif, Rapport, Aperçu des vacances) au lieu de la liste « Période » ; colonnes dans un autre ordre que `ReportTableModel` (§ 1 n° 15) ; « Rapport des vacances » par saisie au lieu de par mois (§ 1 n° 14) ; vacances reportées sur plusieurs années (`hrHoliday`) alors que l'original affiche « – » hors `HOLIDAYBALANCEYEAR`. À confier à un correctif d'écran (CH-10 lot 4 « navigation et libellés » ou chantier dédié).
2. **`mgPrint`** ignore le format `s` des champs et lit `WrappingTextBand` dans `b.c` (spec_16 l. 1006) : non touché (Q4).
3. **`ctlGroup`** reste dans le fichier sans appelant après le lot 3 : à retirer lors d'un nettoyage.

---

## 9. Points d'ancrage DeltaSub

Unicité vérifiée par `grep -F -c` = 1 sur `DeltaSub.html` (md5 `df42ee3e…`). Chaque `build.py` prend le chemin du `DeltaSub.html` source en argument (défaut : celui du dépôt), vérifie chaque ancre (compte = 1) et **échoue proprement** (message, code de sortie non nul, aucun fichier écrit) si une ancre manque ou est multiple. Chaque « nouveau » **contient l'« ancien » intact** ou l'utilise comme branche `typeof` de repli.

| # | Lot | Ancre exacte (« ancien ») | « Nouveau » |
|---|---|---|---|
| A0 | 1-4 | ligne `   DÉMARRAGE` | code du lot inséré avant la ligne `/* ═══…` qui ouvre ce commentaire |
| H1 | 1 | `{i:'print',t:'Imprimer le rapport …',fn:()=>hrPrint()}` | `(typeof ch09aHrMenu==='function'?{i:'doc',t:'Rapports',dis:!HR.staff,menu:()=>ch09aHrMenu()}:{i:'print',t:'Imprimer le rapport …',fn:()=>hrPrint()})` |
| H2 | 1 | `menu:()=>[{t:'Afficher le rapport …',fn:()=>dpPrint()}]` | `menu:()=>[{t:'Afficher le rapport …',fn:()=>typeof ch09aDispo==='function'?ch09aDispo():dpPrint()}]` |
| N1 | 2 | `{i:'print',t:'Imprimer le rapport',fn:()=>nfrPrint()}` | `(typeof ch09bNfrMenu==='function'?{i:'doc',t:'Rapports',dis:!NFR.staff,menu:()=>ch09bNfrMenu()}:{i:'print',t:'Imprimer le rapport',fn:()=>nfrPrint()})` |
| P1 | 2 | `menu:()=>[{t:'Liste des affaires',fn:()=>printProjects(AF.g.view)}]` | `menu:()=>typeof ch09bProjMenu==='function'?ch09bProjMenu():[{t:'Liste des affaires',fn:()=>printProjects(AF.g.view)}]` |
| C1 | 2 | `menu:()=>[{t:'Liste d’adresses',fn:()=>printAdr(st.g.view,'Liste d’adresses')}` | `menu:()=>typeof ch09bAdrMenu==='function'?ch09bAdrMenu(st,sel):[{t:'Liste d’adresses',fn:()=>printAdr(st.g.view,'Liste d’adresses')}` — la suite du tableau d'origine (« Liste d’adresses par CFC ») devient la branche de repli ; `ch09bAdrMenu` renvoie « Liste d'adresses … » (nouveau), « Liste d’adresses par CFC » (inchangée, en attendant CH-04), sép., « Liste d'adresses … [Ancien document] » (→ `printAdr`) |
| M1 | 2 | `menu:()=>[{t:'Intervenants',fn:()=>printMembers(p,rows())}` | `menu:()=>typeof ch09bMemMenu==='function'?ch09bMemMenu(p,rows,o):[{t:'Intervenants',fn:()=>printMembers(p,rows())}` — `ch09bMemMenu` renvoie le menu du § 5.6, les impressions actuelles (`printAdr` du domaine, `printMembers`) passant en « [Ancien document] » ; sélection = `o.sel` (sélection simple de l'écran) |
| T1 | 2 | `{t:'Tâche d’affaire …',dis:!cur(),fn:()=>ptPrintTask(cur())}` | `{t:'Tâche d’affaire …',dis:!cur(),fn:()=>typeof ch09bTask==='function'?ch09bTask(cur()):ptPrintTask(cur())}` |
| T2 | 2 | `{i:'doc',menu:()=>[{t:'Tâche …',dis:!one(),fn:()=>ptPrintTask(one())},` | `{i:'doc',menu:()=>typeof ch09bTaskMenu==='function'?ch09bTaskMenu(p,S,one,sel):[{t:'Tâche …',dis:!one(),fn:()=>ptPrintTask(one())},` — l'entrée « Liste des tâches de l’affaire … » qui suit reste dans la branche de repli |
| R1 | 2 | `projectAddressBuilderConsultantStandby:50}` | `projectAddressBuilderConsultantStandby:51}` (§ 1 n° 18) |
| K1 | 3 | `ibtn({i:'doc',menu:()=>[{t:'Etablir le document d’analyse …',fn:()=>{ if(typeof ch11dCtlCtx==='function') ch11dCtlCtx(p); ctlPrint(p,t,o); }}]})` | `ibtn({i:'doc',menu:()=>typeof ch09cDocMenu==='function'?ch09cDocMenu(p,t,o,rowsNow,F):[{t:'Etablir le document d’analyse …',fn:()=>{ if(typeof ch11dCtlCtx==='function') ch11dCtlCtx(p); ctlPrint(p,t,o); }}]})` (ancre C1 de CH-11 conservée dans la branche de repli) |
| K2 | 3 | `...(tl?['Activités','Phases','Phases et activités','Collaborateur','Ouvrage'].map(g=>({t:'Grouper : '+g,fn:()=>ctlGroup(p,rowsNow(),g)})):[])` | `...(typeof ch09cGroupMenu==='function'?ch09cGroupMenu(p,t,o,rowsNow,F):tl?['Activités','Phases','Phases et activités','Collaborateur','Ouvrage'].map(g=>({t:'Grouper : '+g,fn:()=>ctlGroup(p,rowsNow(),g)})):[])` (heures et frais) |
| K3 | 3 | `const mk=(key,title,rows,nameF,bud)=>{ const o={multi:true,selSet:new Set(F[key]\|\|[])}; sels[key]=o;` | `const mk=(key,title,rows,nameF,bud)=>{ if(typeof ch09cSort==='function') rows=ch09cSort(rows,key); const o={multi:true,selSet:new Set(F[key]\|\|[])}; sels[key]=o;` |
| G1 | 4 | `[{t:'Afficher le rapport …',dis:!M.rows.length,fn:()=>print(M)}]` | `[{t:'Afficher le rapport …',dis:!M.rows.length,fn:()=>print(M)},...(typeof ch09dMgOld==='function'?ch09dMgOld('collab',cat,M):[])]` (Management ▸ Collaborateurs, Liste comprise) |
| G2 | 4 | `fn:()=>mgPrint(doc,MGT_CATS.find(c=>c[0]===cat)[1],fields,{table:mgRowsById(M)},M)}]` | `fn:()=>mgPrint(doc,MGT_CATS.find(c=>c[0]===cat)[1],fields,{table:mgRowsById(M)},M)},...(typeof ch09dMgOld==='function'?ch09dMgOld('ctl',cat,M):[])]` (`sp`, `ps`) |
| G3 | 4 | `fn:()=>mgPrint(doc,MGT_CATS.find(c=>c[0]===cat)[1],{},{table:M.full.map(r=>({c:r.c,st:mgSt(r),fuse:r.title}))},M)}]` | idem avec `ch09dMgOld('ctl',cat,M)` (`ph`, `ac`) |
| G4 | 4 | `{i:'doc',t:'Rapports',dis:!p,menu:()=>[{t:'Afficher le rapport …',fn:print}]}` | `{i:'doc',t:'Rapports',dis:!p,menu:()=>[{t:'Afficher le rapport …',fn:print},...(typeof ch09dMgOld==='function'?ch09dMgOld('heures',MGH.type,M,p):[])]}` (`M` = `MS[MGH.type]`, dans la portée de `drawR`) |
| G5 | 4 | `{builderContact:[contactName(c),...adrLines(c)].filter(Boolean).join(', ')},{table:mgRowsById(M)},M)}]},` | `{builderContact:[contactName(c),...adrLines(c)].filter(Boolean).join(', ')},{table:mgRowsById(M)},M)},...(typeof ch09dMgOld==='function'?ch09dMgOld('mo',null,M,c):[])]},` |
| G6 | 4 | `{i:'doc',t:'Rapports',menu:()=>[{t:'Afficher le rapport …',dis:!(this.M&&this.M.rows.length),fn:print}]}` | `{i:'doc',t:'Rapports',menu:()=>[{t:'Afficher le rapport …',dis:!(this.M&&this.M.rows.length),fn:print},...(typeof ch09dMgOld==='function'?ch09dMgOld('genres',null,this.M):[])]}` |
| G7 | 4 | `{t:'Afficher le rapport …',dis:!M.rows.length,fn:print},{t:'Enregistrer le diagramme …'` | `{t:'Afficher le rapport …',dis:!M.rows.length,fn:print},...(typeof ch09dMgOld==='function'?ch09dMgOld('reporting',cat,M):[]),{t:'Enregistrer le diagramme …'` |

- **Réutilisés sans modification** : `h`, `esc`, `num`, `rJ`, `cmp`, `dfr`, `diso`, `today`, `toast`, `ibtn`, `popMenu`, `dialog`, `confirmDlg`, `ivAsk`, `ctMsg`, `ctOk`, `ctBox`, `grid`, `gridSel`, `formRows`, `copyTable`, `csvTable`, `nm`, `staffName`, `projLabel`, `projState`, `memberSort`, `teamRole`, `contactName`, `svMember`, `svShortDesc`, `hrRange`, `hrMaps`, `targetFor`, `tlKey`, `tlDate`, `tlRate`, `tlFee`, `tlCost`, `pcDate`, `pcAmount`, `dpModel`, `nfrRange`, `nfrRows`, `ptDescText`, `PT_STATE`, `PT_PRIO`, `TSTATE`, `ch01aTplPick`, `ch01aTplList`, `ch01aPrep`, `ch11aFlat`, `ch11aF0`, `ch11aView`, `ch11aWin`, `ch11aOldData`, `ch11aHTML`, `ch11dPickInvoice`, `ch11dCtlCtx`, `svDpHTML`, `tplPrint`, `tplOr`, `tplFind`, `tplNeed`, `tplReady`, `ivFormVisible`, `ch08cDocLangs`, `DS.all/get/by/need`.
- **À ne pas modifier** : `ch01a*`, `ch11a*`, `ch03*`, `mgPrint`, `hrModel`, `ctlGroup`, `ctlPrint`, `printAdr` (partagé avec la Soumission), les écrans eux-mêmes hors ancres.
- C1, M1 : écrans aussi visés par CH-04 et CH-05. Si l'un d'eux a changé l'ancre avant l'intégration du lot 2, le `build.py` échoue : reprendre l'ancre sur la nouvelle version, sans réécrire leur bloc.

---

## 10. Plan en lots

Taille totale : **L** (lot 1 ≈ 450 lignes, lot 2 ≈ 450, lot 3 ≈ 650, lot 4 ≈ 350). La fiche prévoyait 6 lots : le socle (ancien lot 1) est réduit à quelques fonctions et rejoint les Heures ; les Tâches (lot 5) rejoignent les listes ; les anciens documents du Management (lot 6) rejoignent la boîte « Paramètres » au lot 4.

Préfixes `ch09a` à `ch09d` et `CH09A` à `CH09D` (constantes ; `CH09_FAM` appartient au lot 1) : 0 occurrence dans `DeltaSub.html` et dans `scratchpad/ch/*/` hors `ch/CH-09/` (vérifié le 01.10.2026) ; chaque `build.py` refait le contrôle (aucune déclaration `function|const|let|var ch09x…` déjà présente).

Chaque lot livre dans `ch/CH-09/lotN/` : `ch09x.js` (déclarations de haut niveau, aucun accès au DOM au chargement, aucune redéclaration) ; `build.py <DeltaSub.html source>` ; `test_ch09x.js` (jsc) ; le compte rendu de l'essai navigateur.

### Lot 1 — Socle CH-09, Heures ▸ Rapport et Disponibilité (préfixe `ch09a` / `CH09A`)

- **Contenu** :
  - socle : `CH09A_LBL`, `CH09_FAM`, `ch09aTplPick` (langues `ch08cDocLangs`, délégation à `ch01aTplPick`), `ch09aRun` (rapport temporaire des deux groupes, repli D6, `joindre`), `ch09aF` (champs communs + `projectMemberProjectManager`), `ch09aN`, `ch09aMenu`, `ch09aOldLbl`, `ch09aOld` (délégation à `ch09dOld` par `typeof`), `ch09aPref(k, def)` / `ch09aPrefSet` (`localStorage` en try/catch) ;
  - Heures : `ch09aTime(kind)` (champs et lignes selon `ReportTableModel`, 8 valeurs par ligne, vacances mensuelles), `ch09aJournal(a, b, det)` (14 positions, totaux du jour), `ch09aHrMenu()` (§ 5.1), `ch09aHrDoc()`, `ch09aHrOldDetail()` (« Rapport … [Ancien document] ») ;
  - Disponibilité : `ch09aDispo()` (§ 5.2) ;
  - ancres A0, H1, H2.
- **Tests** : T-A1 à T-A5 ; essais N1, N2.
- **Dépendances** : aucune dans le chantier (CH-01 lot 1, CH-11 lot 1 et CH-03 sont intégrés).

### Lot 2 — Notes de frais, Liste des affaires, Liste des adresses, Intervenants, Tâches (préfixe `ch09b` / `CH09B`)

- **Contenu** : `ch09bNfrMenu`, `ch09bExpenses`, `ch09bExpensesF` (totaux par monnaie) ; `ch09bProjMenu`, `ch09bProjectListOpen`, `ch09bProjectList(rows, filterDesc)` (API pour CH-05), `ch09bFixProjectList` (D1) ; `ch09bAdrMenu`, `ch09bContactList(rows, filterDesc)` (API pour CH-04) ; `ch09bMemMenu`, `ch09bMembers(p, membres, how, filterDesc)` (API pour CH-05), `ch09bMembersRows` ; `ch09bTask`, `ch09bTaskList`, `ch09bTaskMenu` (retour sur spec_7 § 6.5) ; ancres A0, N1, P1, C1, M1, T1, T2, R1.
- **Tests** : T-B1 à T-B3 ; essai N3.
- **Dépendances** : lot 1.

### Lot 3 — Controlling : Composer le rapport, Grouper, 5 documents (préfixe `ch09c` / `CH09C`)

- **Contenu** : `ch09cDocMenu` (Rapports ▾ heures et frais, anciens `projectTimeJournal` / `projectCostJournal` / `projectTime` collaborateurs), `ch09cGroupMenu`, `ch09cFilterDesc`, `ch09cTimeFilter`, `ch09cSort` ; `ch09cComposeT` et `ch09cComposeC` (dialogues « Composer le rapport ») ; `ch09cTimeLogRows`, `ch09cCostRows` (tris et groupes) ; `ch09cStaffTree` (`projectTimeLogStaff`) ; `ch09cGroup(kind, …)` (dialogue commun, Personnalisé), `ch09cGroupRows` (8 regroupements heures, 8 coûts, prévisions) ; documents `projectTimeLog`, `projectTimeLogStaff`, `projectTimeLogSummary`, `projectProjectCost`, `projectProjectCostSummary` avec pièce jointe (`ch11dPickInvoice`) ; ancres A0, K1, K2, K3.
- **Tests** : T-C1 à T-C4 ; essai N4.
- **Dépendances** : lot 1.

### Lot 4 — Anciens documents : Paramètres, favoris, Management et Reporting (préfixe `ch09d` / `CH09D`)

- **Contenu** : `ch09dOld(fam, o)` (visionneuse, favori, `tplPrint` par `ch11aWin`), `ch09dParams(fam, o, apres)` (boîte « Paramètres » : Document, Présentation), `ch09dFav*` (favoris `ds_ch09_fav_<famille>`) ; `CH09D_MG` (table du § 5.9.3), `ch09dMgOld(écran, cat, M)` (entrées « Afficher le rapport … [Ancien document] ») ; ancres A0, G1 à G7.
- **Tests** : T-D1 ; essai N5.
- **Dépendances** : lot 1 (`ch09aOld` délègue à `ch09dOld`) ; les entrées « [Ancien document] » des lots 2 et 3 en profitent sans dépendance d'intégration.

### Non livré (et pourquoi)

| Élément | Raison |
|---|---|
| `timeWeeklyJournal` (entrée de menu) | version de développement de l'original (D7) |
| Assistants de filtres et de favoris des anciens documents d'analyse | D3 ; filtres de l'écran |
| `ProjectListDialog`, navigateur « Liste par rôle et CFC », étiquettes, listes par entité / CFC des adresses | CH-05, CH-04 (APIs `ch09bProjectList`, `ch09bMembers`, `ch09bContactList` fournies) |
| Police, taille, interligne, fond alterné des anciens documents | `tplPrint` ne les rend pas (E4) |
| Réécriture des écrans Heures ▸ Rapport et Rapport des vacances selon l'original | hors chantier (§ 8) |
| Bascule de `mgPrint` sur le choix du modèle | Q4 : 10 écrans validés |
| Éditeur de modèles (corriger le modèle `projectList` à la source) | CH-14 |

---

## 11. Décisions restantes pour Paulo

1. **D1 — « Liste des affaires » du jeu 0 décalée.** L'original imprime l'adresse du maître d'ouvrage sous « Statut », le statut sous « Début », etc., parce que le modèle de 2022 n'a pas suivi la version 16.05. **Par défaut : DeltaSub corrige à la lecture** ce modèle (les colonnes impriment ce que leur titre annonce). Variante : imprimer comme l'original, en attendant de corriger le modèle dans l'éditeur (CH-14).
2. **D6 — Aucun modèle dans le jeu de l'affaire.** L'original n'ouvre rien, sans message. **Par défaut : message, puis ancien document** (ou tableau simple). Sans effet au bureau aujourd'hui (les jeux 1 et 2 ont tous les modèles).
3. **D2 — Favoris des anciens documents par poste** (navigateur), comme les fichiers XML locaux de l'original. **Par défaut : oui.** Variante : favoris partagés par tout le bureau (collection nouvelle, à protéger au ré-import).
4. **D3 — Assistants des anciens documents d'analyse non reproduits** (filtres et modèles des assistants `time`, `project.time`, `project.cost`, `management.list`). Les anciens documents restent accessibles, avec les données de l'écran et la boîte « Paramètres ». **Par défaut : non reproduits.**
5. **D4 — Tâches** : nouveau document en principal et ancien derrière « [Ancien document] », comme l'original (revient sur spec_7 § 6.5). **Par défaut : oui** (aucune tâche au bureau).
6. **D7 — `timeWeeklyJournal` non proposé** (version de développement de l'original, aucun modèle au bureau). **Par défaut : non proposé.**
7. **Mois du « Rapport heures - facturation - coût de revient »** : ordre chronologique au lieu de l'ordre alphabétique de l'original (défaut probable, non vérifié à l'écran). **Par défaut : chronologique.**

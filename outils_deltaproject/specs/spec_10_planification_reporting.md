# Cahier des charges : DeltaSub ▸ Planification RH, Analyse de planification RH, MANAGEMENT ▸ Planification RH et MANAGEMENT ▸ Reporting (reproduction de Deltaproject, licences DELTAplanning et DELTAreport)

Rédaction critique à partir de cinq rapports (« planning », « analyses », « mgmtplanning », « reporting », « manuel » ; le sixième, « deltasub », est vide et a été refait ici à la source). Chaque contradiction a été tranchée par le bytecode (`javap`), `Strings.db`, les CSV du bureau, `modeles.json` ou le manuel — jamais par vote. Fichiers de travail : `scratchpad/research/pl_critique/` (`jp.sh`, désassemblages `*.txt`). Lecture seule partout ailleurs.

Conventions : **[P]** prouvé (`Classe.méthode@offset`, libellé `Strings.db`, donnée CSV, page du manuel, modèle `.dpdoc`) ; **[D]** déduit. Mois **0 à 11** partout (`TIMEMONTH`, `VALIDFROMMONTH`, `TARGETHOURS0..11`). Montants CHF, format `#,###,##0.00` avec apostrophe, arrondi `Formatter.round` = `rJ` (DeltaSub l. 1982). DeltaSub = `DeltaSub.html` @ b42db0d (5 322 lignes).

---

## 0. Synthèse et arbitrages

### 0.1 Ce qu'il faut savoir avant de coder

1. **Quatre écrans, deux licences.** Domaines d'affaire « Planification RH » et « Analyse de planification RH » (licence 14 DELTAplanning + droits `projectPlanning` / `projectPlanningAnalyze`), MANAGEMENT ▸ « Planification RH » (module `managementPlanning`, licence DELTAplanning + droit `managementPlanning`), MANAGEMENT ▸ « Reporting » (module `managementTimeReport`, licence 12 DELTAreport, sans droit propre) [P `Modules$Module.$values`/`isVisible`, `Rights`]. **Le bureau n'a ni l'une ni l'autre : aucun de ces quatre écrans n'est visible chez Substances dans Deltaproject.** Toutes les tables PLANNING* sont vides [P schema.txt].
2. **Données réellement disponibles** : TIMELOG (37 622), STAFFRATE (37), STAFFTARGETTIME (47), STAFFPROJECTTIME (24, TIMEBUDGET = 0, INTERNALTIME 2023 du collaborateur 2752 égal aux heures prévues), PROJECTACTIVITY, SETTING `standardTableRateLimit` = 10.0 [P CSV]. Donc : **Reporting** fonctionne entièrement ; dans **Planification RH**, seules les grandeurs dérivées de TIMELOG × STAFFRATE (« Heures saisies », « Coût de revient ») et des disponibilités sont non nulles ; tout ce qui vient de PLANNINGMONTH / PLANNINGTIME vaut 0 tant que le domaine de saisie n'existe pas.
3. **« Tableau de bord pour direction »** : aucun écran de Deltaproject ne porte ce nom (§1.3). Ce qui en tient lieu est **MANAGEMENT ▸ Reporting ▸ Chiffres-clés** (seule occurrence de l'expression dans toute la documentation : légende de la capture, manuel FR p. 87) — déjà présent dans DeltaSub et à corriger (lot A). Au niveau financier, le rôle est tenu par **MANAGEMENT ▸ Planification RH ▸ Marge bénéficiaire** (manuel DE p. 44) et, par affaire, par la tuile **« Analyse de l'affaire »** (Projektstand) — tous deux vides sans saisie de planification.
4. **Ordre de réalisation** : Lot A (corriger Reporting, 16 écarts, données disponibles) → Lot B (modèle PLANNING* + domaine de saisie) → Lot D (Management ▸ Planification RH, en commençant par Marge bénéficiaire et Attribution des collaborateurs) → Lot C (Analyses 1 à 6). Détail §8.

### 0.2 Contradictions entre rapports, tranchées à la source

| # | Sujet | Rapports en désaccord | Tranché | Preuve |
|---|---|---|---|---|
| 1 | Le coût de revient par catégorie (étape 2) est-il majoré du facteur de frais internes ? | manuel (texte p. 40 « majoré ») vs capture p. 41 (4'120.62 sans facteur) | **Non à l'étape 2** : `PlanningSubPhase2TableModel` n'appelle jamais `getInternalCostFactor` ; les lignes « Coûts de revient selon les catégories » = Σ `PlanningTime.internalAmount` brut. **Oui dans les analyses** : Analyze2 ligne 12, Management ▸ Marge ligne 10 = `getTotalInternalAmount() × (1 + INTERNALCOSTFACTOR/100)` | [P] `PlanningSubPhase2TableModel.getValueAt@323-339` (pas de facteur) ; `PlanningAnalyzeProfitTableModel$ProjectColumn.addPlanningMonth@112-124` ; `Analyze2TableModel$MonthColumn@142-192` |
| 2 | Management ▸ Marge bénéficiaire : « Budget d'honoraires » et « Effort » sont-ils cumulés au mois de référence ? | manuel (« cumulés au mois de référence [P par recoupement] ») vs mgmtplanning (tous les mois) | **Tous les mois**, sans filtre de date, pour contrat, déductions, frais internes, budget, encaissements ; seuls `staffCost` (≤ réf.) et `plannedAmountFromReferenceMonth` (> réf.) dépendent du mois de référence. Les valeurs du manuel coïncident parce que la planification de l'affaire était entièrement passée (réalisation 98.90 %) | [P] `ProjectColumn.addPlanningMonth@2-75` (aucun test de date) et `@81-96` (test `>` réf. seulement pour le planifié) |
| 3 | Ordre de `PlanningCostFactor.findAll` | planning/analyses ([P]) vs mgmtplanning (« non prouvé ») | `SELECT f FROM PlanningCostFactor f ORDER BY f.validFromYear, f.validFromMonth` | [P] chaîne de la requête nommée dans `db/PlanningCostFactor.class` |
| 4 | Où est « Tableau de bord » ? | reporting (« notes marginales du chapitre ») vs manuel (« légende de la capture Chiffres-clés ») | Les deux notes marginales sont des légendes : « Productivité » légende la capture du haut (Comparaison années), « Tableau de bord » celle du bas (« Vue d'ensemble » = Chiffres-clés) | [P] rendu de la page 87 (`pl_manuel/fr_p87.png`) |
| 5 | Identifiant `dashboard` | reporting (icône du bouton d'`ActivityReportFrame`) vs manuel (`Buttons.dashboard` = « Présentations ») | Les deux : `Strings.db` ne contient que `rsrc|Buttons|dashboard = Présentations` (Controlling) et des ids `openReportDashboard*` = « Afficher le rapport » ; `ldc "Dashboard"` d'`ActivityReportFrame` est un nom d'icône sans libellé. Aucun libellé FR ne contient « tableau de bord » | [P] requête `Strings.db` (9 lignes) |
| 6 | Menu « Nombre de mois » de la répartition par ligne : 1..n ou 1..n−1 | planning ([P `if_icmpge`]) | **1..n−1** (`for i=1; i<nofTotalMonths`) | [P] `PlanningMonthsDialog.getNofMonthsPopupMenu@8-15,62` |
| 7 | Création multiple de mois : une position occupée consomme-t-elle une itération ? | planning ([D]) | **Oui** : la branche « existe déjà » (`if_icmpne 124`) et la branche « créé » (`goto 134`) aboutissent toutes deux à `iinc 4,1` ; au plus N mois créés | [P] `SubPhaseMonthDialog.newMonths@39-137` |
| 8 | Format « Valable dès le » des facteurs | planning ([D]) | `Strings.getMonthName(m) + " " + year` (mois long) | [P] `PlanningCostFactorTableModel.getValueAt@23-33` |
| 9 | Clé de préférence de la liste des domaines Management | mgmtplanning ([D]) | `lastPlanningMenuSelection` | [P] cpool `PlanningMenuTableModel` |
| 10 | Colonne « Année » des lignes « % » du bloc heures prévues (Reporting ▸ Collaborateurs) | reporting (défaut de l'original) | Défaut confirmé : `setTimeLogs@297-307/@339-349` appelle `calcTotal()` sur `staffSaldo1Ratio`/`staffSaldo2Ratio` → total = Σ des 12 ratios mensuels ; `ActivityYearReportTableModel.getReport@809-816` affiche ce `Year` en `percentageRow` (× 100). **Choix : garder la valeur DeltaSub (ratio des totaux)**, écart volontaire documenté §6.6 | [P] `ActivityYear.setTimeLogs`, `AYRTM.getReport` |
| 11 | Attribution des collaborateurs, valeur de contrôle du collaborateur 2752 en 2023 | mgmtplanning (« TARGETHOURS − 178.5… ») | INTERNALTIME 2023 = exactement TARGETHOURS 2023 mois par mois (178.5, 170.0, 195.5, 153.0, 178.5, 187.0, 178.5, 187.0, 170.0, 187.0, 187.0, 161.5) → **« Disponibilité [h] » = 0.00 sur les 12 mois**, solde 0.00 non coloré | [P] CSV STAFFPROJECTTIME / STAFFTARGETTIME |
| 12 | Titre du modèle FR `managementPlanningAnalyzeBudgetReport` | mgmtplanning (« Encaissements ») | Le `.dpdoc` FR du bureau s'intitule **« Paiements »** ; la bande Titre porte « Année {year} » | [P] `modeles.json` |
| 13 | `projectPlanningAnalyzeProfitReport` : jeux disponibles | analyses (« jeux 1 et 2 ») | Confirmé : **aucun `0/`**, seulement `1/` et `2/` (identiques) → `mgPrint` doit chercher `1/` en repli | [P] `modeles.json` |
| 14 | Position des deux domaines dans l'affaire | planning / spec_9 §1.3 | Entre « Contrats honoraires » et « Avancement des prestations » ; DeltaSub `DOMAINS` l. 1474 ne les a pas | [P] enum `MenuTableModel$MenuItem` |
| 15 | Visibilité de MANAGEMENT ▸ Reporting | reporting (non précisé) vs spec_8 §11 (« non licencié ») | Module `managementTimeReport` construit avec `AppLicenceModules$Module.DELTAreport` ; `isVisible()` exige la licence ; pas de droit spécifique (`Rights` n'a que `management`, `managementPlanning`, `managementProject`, `managementStaff`) | [P] `Modules$Module.$values@645-656`, `isVisible@0-73`, `Strings.db Rights` |

### 0.3 Trous de complétude comblés

- Ordre exact des modules Management (pour la NAV) : `managementProjectKinds, managementProjectTime, managementProjectControl, managementContracts, managementPlanning, managementInvoices, managementStaff, managementBuilder, managementTimeReport` [P `Modules$Module.$values`].
- Structure des 10 modèles `.dpdoc` FR (§7), relue dans `modeles.json` (pages, bandes, colonnes, champs).
- Existant DeltaSub réellement vérifié (§8.2) : `mgChart` (l. 2105) n'a **pas** de mode « Aires » ni de barres empilées horizontales ; `mgPrint` (l. 2010) gère déjà `FlexColumn` (`tables._flex`) mais lit uniquement `'0/'+type` ; `DOMAINS`/`domainView` (l. 1474, 1499) dispatchent par libellé ; `delProject` (l. 1184-1193) ne cascade pas encore les collections `planning*` ; le serveur importe tous les `APP.*.csv` sauf `SKIP_TABLES` (licences), donc les 9 collections `planning*` existeront vides sans modification serveur.
- Valeurs de contrôle recalculées sur les CSV (§9) : coût de revient 2025 par affaire, bureau janvier-juin 2025, disponibilités 2023.

---

## 1. Périmètre, licences, visibilité, réponse « tableau de bord », place dans NAV et DOMAINS

### 1.1 Périmètre

| Écran original | Classe(s) | Licence / droit [P] | Reproduit dans DeltaSub |
|---|---|---|---|
| Affaire ▸ domaine « Planification RH » | `project.planning.ProjectPlanningFrame`, `PlanningSubProjectDialog`, `PlanningRoles*`, `PlanningCostFactor*`, `PlanningBoilerplateDialog`, `SetTableRateLimitDialog`, `SubPhaseMonths*`, `PlanningSubPhaseDialog` + 6 modèles, `PlanningMonth*Dialog`, `PlanningTime*`, `PlanningAssignment*`, `PlanningStaff*`, `StaffAvailableTimeDialog` | DELTAplanning + `projectPlanning` (« Module DELTAplanning: afficher la planification RH ») | Lot B, §3 |
| Affaire ▸ domaine « Analyse de planification RH » | `ProjectPlanningAnalyzeFrame`, `Analyze1..6Dialog`, `Analyze2..6TableModel`, `Analyze2Report` | DELTAplanning + `projectPlanningAnalyze` (« afficher l'analyse d'affaire ») | Lot C, §4 |
| MANAGEMENT ▸ Planification RH | `management.PlanningFrame`, `PlanningMenuTableModel`, `PlanningAnalyzeFrame` + 5 modèles, `PlanningProjectAssignment*`, `PlanningStaffAssignment*` | module `managementPlanning` : DELTAplanning + droit `managementPlanning` | Lot D, §5 |
| MANAGEMENT ▸ Reporting | `management.TimeReportFrame`, `TimeReportMenuTableModel`, `ActivityReportFrame`, `ActivityYear`, `ActivityYearReportTableModel`, `ActivityReportTableModel`, `TimeBalanceReportTableModel`, `ChartModel`, `list.Timereport*` | module `managementTimeReport` : DELTAreport ; droit `management` du menu | Lot A, §6 (vue `mg-reporting` existante) |

Hors périmètre, cités : HEURES ▸ Disponibilité (spec_6, déjà livré, lit PLANNINGASSIGNMENT), contrats/encaissements/avancement (spec_9, lots en cours), `OvertimeBalance*` (Management ▸ Collaborateurs, spec_8 §9).

### 1.2 Visibilité au bureau et choix DeltaSub

- Deltaproject masque les quatre écrans chez Substances (pas de licence 12 ni 14). DeltaSub ne reproduit pas les licences : il **affiche** les écrans, mais garde les droits : `projectPlanning`, `projectPlanningAnalyze`, `managementPlanning` (colonnes de `appuser`/`rights` déjà reprises ; à défaut, droit `management`). Reporting : visible avec le droit `management`, comme aujourd'hui.
- Un bandeau discret « Données DELTAplanning : aucune planification saisie » remplace les tableaux vides (voir §3.4, §4.1) tant que `planningmonth` est vide — amélioration, pas une reproduction.

### 1.3 Réponse à « Tableau de bord pour direction selon app d'origine »

1. **Aucun écran, aucun libellé, aucun chapitre de Deltaproject ne s'appelle « Tableau de bord »** [P : `Strings.db`, 0 libellé FR contenant « tableau de bord » ; enum des menus ; TOC des deux manuels]. Le seul identifiant `dashboard` est `rsrc|Buttons|dashboard` = « **Présentations** » (bouton du Controlling d'affaire, graphiques) et le nom d'icône `Dashboard` du bouton « Comparer N ans » d'`ActivityReportFrame` [P].
2. **L'unique occurrence de l'expression** est la légende de la capture de **MANAGEMENT ▸ Reporting ▸ « Vue d'ensemble »** (libellé actuel **« Chiffres-clés »**, DE « Kennzahlen ») dans le manuel FR p. 87, sous la légende « Productivité » de la capture « Comparaison années » [P image de la page]. C'est donc l'écran que l'éditeur lui-même désigne comme tableau de bord : 15 lignes (heures facturables / non facturables / présence / absences / vacances et leurs %), 12 mois + année, graphique courbes / barres / barres empilées / secteurs, filtre collaborateurs.
3. **Ce qui en tient lieu au sens financier**, d'après le manuel DE p. 43-44 (« Projektstand » : repérer immédiatement les écarts par rapport au plan ; « Gewinnmarge und Mitarbeiterauslastung » : suivre la marge sur toutes les affaires en cours, occupation, encaissements, coûts internes) [P] :
   - au niveau **bureau** : MANAGEMENT ▸ Planification RH ▸ **Marge bénéficiaire** (une colonne par affaire en cours planifiée, marge CHF/% colorée au seuil `standardTableRateLimit`, rapport « Marge bénéficiaire » 7 colonnes), complété par Encaissements, Disponibilité, Occupation ;
   - au niveau **affaire** : Analyse de planification RH ▸ tuile 1 **« Analyse de l'affaire »** (3 cadres de chiffres + 3 graphiques au mois de référence).
   Ces deux écrans exigent des PLANNINGMONTH saisis : vides au bureau aujourd'hui.
4. **Recommandation (sans inventer d'écran)** :
   - reproduire fidèlement les écrans ci-dessus (lots A, D1, C1) ;
   - dans la NAV de DeltaSub, **aucune entrée « Tableau de bord »** : Reporting ▸ Chiffres-clés est déjà la première catégorie et la dernière sélection est mémorisée (`ds_mg_reporting`) ; au plus, si Paulo le souhaite, une entrée NAV `['mg-tdb','Tableau de bord']` qui ouvre `mg-reporting` avec la catégorie `kf` présélectionnée — simple alias de navigation, étiqueté comme tel ;
   - retirer le libellé « Tableau de bord » du bouton de Comparaison années (DeltaSub l. 2476) : l'original n'a qu'une icône `Dashboard` sans texte ; garder l'icône et l'info-bulle « Comparer ».
   - ne **pas** construire de synthèse « direction » alimentée par les contrats de spec_9 en lieu et place des PLANNINGMONTH : ce serait une adaptation étrangère à l'original (voir §10, choix 1).

### 1.4 Place dans NAV et DOMAINS

- **NAV** (l. 337-348) : dans le groupe Management, l'ordre original est Genres d'affaires, Heures, Controlling, Contrats honoraires, **Planification RH**, Factures, Collaborateurs, Maître d'ouvrage, **Reporting** [P `Modules$Module.$values`]. Insérer `['mg-planning','Planification RH']` après l'entrée Contrats honoraires (à créer par spec_9) ou, tant qu'elle n'existe pas, après `mg-controlling`. `mg-reporting` reste en dernier.
- **DOMAINS** (l. 1474) : insérer `'Planification RH','Analyse de planification RH'` entre `'Contrats honoraires'` et `'Avancement des prestations'` [P enum `MenuTableModel$MenuItem` : … contracts, planning, planningAnalyze, implementation …]. `domainUsed` (l. 1495) : ajouter les deux libellés. `domainView` (l. 1499) : deux branches `plDomain(C,top,pane,p)` et `paDomain(C,top,pane,p)`.
- Préférences : `ds_pl_type` (type de grille, §3.4), `ds_pl_split`, `ds_pa_bounds` facultatif, `ds_mg_planning` (catégorie, via `mgCatView`), `ds_mgp_*` (mois de départ, type d'affichage, « Détails »).

---

## 2. Modèle de données PLANNING* et tables lues

### 2.1 Collections (noms en minuscules, champs en MAJUSCULES) [P schema.txt, entités `db.Planning*`]

Clés `ID` entières (`TableGenerator <Entité>_KeyGenerator`) ; DeltaSub : `DS.save(t,rec)` / `DS.commit(ops)` comme pour les autres collections ; le serveur les importe déjà (tout `APP.*.csv` hors licences).

**`planningsubproject`** — planification d'une affaire pour un ouvrage (une par couple affaire × ouvrage, `SUBPROJECT_ID` null = « Sans ouvrage » / « Pas d'ouvrage »).

| Colonne | Type | Sens |
|---|---|---|
| PROJECT_ID | FK PROJECT | affaire |
| SUBPROJECT_ID | FK SUBPROJECT, nullable | ouvrage |
| PROJECTCONTRACT_ID | FK PROJECTCONTRACT, nullable | contrat d'honoraires **informatif** (manuel DE p. 39) : source des suggestions de montants, bloque la suppression du contrat (spec_9 §2.6, `ctBlocked` l. 3945 déjà en place) |
| EXTERNALRATE | double | « Tarif de facturation » CHF/h, > 0 obligatoire |
| NOTE | 1024 | « Note interne » |
| USERID | 32 | « Utilisateur » (directeur d'affaire), défaut = utilisateur courant |

**`planningrole`** — « catégorie d'honoraires » d'une planification : `PLANNINGSUBPROJECT_ID`, `NAME` (255, saisie 64), `SORTORDER` (ordre manuel 0..n−1), `TIMERATE` (part du budget d'honoraires en %, valeur proposée), `INTERNALRATE` (coût de revient horaire CHF/h, valeur proposée). Tri `SORTORDER`.

**`planningroletemplate`** — modèles globaux : `NAME`, `SORTORDER`, `TIMERATE`, `INTERNALRATE`. Tri `SORTORDER`. Sept noms prédéfinis [P `roleName0..6`] : Assistant, Directeur d'affaire, Architecte, Planificateur, Stagiaire, Apprenti, Directeur des travaux (manuel DE : tarifs 120/140/150/150/50/40/90 à titre d'exemple).

**`planningcostfactor`** — facteur des frais internes du bureau, daté : `VALIDFROMYEAR`, `VALIDFROMMONTH` (0-11), `INTERNALCOSTFACTOR` (%). Tri `VALIDFROMYEAR, VALIDFROMMONTH` [P requête `findAll`]. Un seul enregistrement par (année, mois) (le dialogue désactive les mois déjà présents).

**`planningmonth`** — un mois de planification d'une phase partielle d'un ouvrage. Parent logique : l'affaire (`Project.planningMonths`, tri `TIMEYEAR, TIMEMONTH`), **pas** la planification par ouvrage.

| Colonne | Sens (libellé FR) | Étape |
|---|---|---|
| PROJECT_ID, SUBPROJECT_ID (nullable), SUBPHASE_ID (nullable = « Pas de phase partielle ») | rattachement | période |
| TIMEYEAR, TIMEMONTH (0-11) | mois ; libellé court « janv. 2026 », long « janvier 2026 » | période |
| CONTRACTAMOUNT | Contrats | 1 |
| CONTRACTAMOUNTADDITION | Avenants | 1 |
| DEDUCTIONEXTERNAL | Frais externes | 1 |
| DEDUCTIONCOST | Coûts supplémentaires | 1 |
| DEDUCTIONSUBPLANNER | Sous-planificateurs | 1 |
| DEDUCTIONSCALEMODEL | Modèle BIM | 1 |
| DEDUCTIONSUBCONTRACTOR | Sous-traitants | 1 |
| DEDUCTIONINSURANCE | Assurances | 1 |
| DEDUCTIONOTHER | Autres déductions | 1 |
| INTERNALCOSTFACTOR | Facteur des frais internes [%] — **instantané** copié de `planningcostfactor` à la création et au déplacement du mois | 1 |
| EXTERNALRATE | Tarif de facturation CHF/h — instantané de `planningsubproject.EXTERNALRATE` | 1 |
| TIMEHOUR | Budget temps [h] — **stocké**, saisi ou recalculé (§3.7.1) | 1 |
| NOTE | Note interne | 1 |
| IMPLEMENTATIONRATE, IMPLEMENTATIONNOTE | Taux de réalisation estimé [%] (cumulé, 0-100), note | 4 |
| SCHEDULEDAMOUNT, SUBPLANNERAMOUNT, SUBCONTRACTORAMOUNT, AMENDEDAMOUNT, SCHEDULEDAMOUNTNOTE | Encaissements planifiés, pour sous-planificateurs, pour sous-traitants, ajustements, note | 5 |
| SETTLEDAMOUNT, SETTLEDAMOUNTNOTE | Encaissements reçus, note | 6 |

**`planningtime`** — part d'une catégorie dans un mois : `PLANNINGMONTH_ID`, `PLANNINGROLE_ID`, `TIMERATE` (% du budget temps du mois), `INTERNALRATE` (CHF/h), `NOTE` (1024). Une par (mois, catégorie) au plus.

**`planningassignment`** — attribution d'un collaborateur : `PLANNINGTIME_ID`, `STAFFPROJECTTIME_ID` (disponibilité du collaborateur **au même mois**), `TIMEPERIOD` (h), `NOTE` (1024, « cahier des charges »). Sans `@OrderBy` → ordre par ID [D, déjà retenu par spec_6].

**`planningstaff`** — sous-catégorie anonyme (« rôle de planification ») d'une catégorie pour une phase partielle : `PLANNINGROLE_ID`, `SUBPHASE_ID` (nullable), `NAME` (255, saisie 64), `STAFFRATE` (CHF/h).

**`planningstafftime`** — heures d'une sous-catégorie pour un mois : `PLANNINGMONTH_ID`, `PLANNINGSTAFF_ID`, `TIMEHOUR`.

### 2.2 Graphe, cascades, intégrité [P sauf mention]

```
project ─┬─ planningsubproject (× ouvrage) ─ planningrole ─┬─ planningtime ── planningassignment ── staffprojecttime
         │                                                  └─ planningstaff ── planningstafftime
         └─ planningmonth (× ouvrage × phase partielle × mois) ─┬─ planningtime
                                                                 └─ planningstafftime
planningroletemplate, planningcostfactor : globaux, sans FK.
```

- Suppression d'une **planification par ouvrage** : autorisée seulement si elle n'a ni catégorie ni mois (`PlanningSubProjectDialog.editPlanningSubProject@1-24`, `isPlanningMonthListEmpty`) ; cascade JPA rôles → sous-catégories → heures et rôles → parts → attributions.
- Suppression d'une **catégorie** refusée si `planningtime` ou `planningstaff` existent : « Cette inscription est déjà utilisée et ne peut pas être supprimée. »
- Suppression d'un **mois** refusée (§3.6) si `SETTLEDAMOUNT > 0`, si une attribution existe, si une `planningstafftime` existe ; sinon cascade `planningtime` (+ attributions) [D pour la cascade des `planningstafftime`, supposée ALL comme les collections sœurs].
- Suppression d'une **part** (`PlanningTime.executeDeleteCommand@0-107`) : détache et supprime ses attributions ; d'une **sous-catégorie** : supprime ses heures.
- `staffprojecttime` attribué : suppression refusée (déjà en place, DeltaSub l. 1031).
- Contrat lié : suppression refusée (`ctBlocked`, l. 3945).
- **Affaire** : `delProject` (l. 1184-1193) doit cascader `planningsubproject` (+ `planningrole`, `planningstaff`, `planningstafftime`, `planningtime`, `planningassignment`) et `planningmonth` (+ `planningtime`, `planningstafftime`, `planningassignment`) ; ouvrage (`SUBPROJECT`, l. 1343) : refuser si `planningsubproject` ou `planningmonth` le référencent [D, cohérent avec `countBySubProject`] ; phase partielle : refuser si `planningmonth.SUBPHASE_ID` ou `planningstaff.SUBPHASE_ID` [D, `countByProjectSubPhase`].

### 2.3 Formules d'entité (module JS `pl*`, calculs purs) [P `db.PlanningMonth`, `db.PlanningTime`, `db.PlanningCostFactor`, `db.StaffProjectTime`, `db.TimeLog`, `db.Staff`]

```
plContrat(pm)      = CONTRACTAMOUNT + CONTRACTAMOUNTADDITION                                  (getContractAmountTotal)
plDeductions(pm)   = Σ DEDUCTIONEXTERNAL, DEDUCTIONCOST, DEDUCTIONSUBPLANNER, DEDUCTIONSCALEMODEL,
                     DEDUCTIONSUBCONTRACTOR, DEDUCTIONINSURANCE, DEDUCTIONOTHER                 (getDeductionTotal)
plFraisInternes(pm)= base = plContrat − plDeductions ; base = 0 ? 0 : base × INTERNALCOSTFACTOR / 100  (getInternalCost@10-28)
plBudget(pm)       = plContrat − plDeductions − plFraisInternes                                (getAmountTotal, « Budget d'honoraires »)
plAttendu(pm)      = SCHEDULEDAMOUNT + SUBPLANNERAMOUNT + SUBCONTRACTORAMOUNT + AMENDEDAMOUNT   (getExpectedAmount)
plHeures(pt)       = planningmonth(pt).TIMEHOUR × pt.TIMERATE / 100                            (PlanningTime.getTimeHour, jamais stocké)
plMontantInterne(pt)= plHeures(pt) × pt.INTERNALRATE                                          (getInternalAmount, « Coût de revient »)
plTotalTimeRate(pm)= Σ pt.TIMERATE des planningtime du mois
plTotalInterne(pm) = Σ plMontantInterne(pt)                                                     (getTotalInternalAmount)
plSuggestedRate(pm,role) = TIMEHOUR ≤ 0 ? null : 100 × Σ planningstafftime.TIMEHOUR (sous-catégories du rôle) / TIMEHOUR
plFacteur(y,m)     = dernier planningcostfactor (tri année, mois) tel que 12·VY+VM ≤ 12·y+m, sinon 0   (getInternalCostFactor)
plAssHeures(pt)    = Σ planningassignment.TIMEPERIOD de la part
sptAttribue(spt)   = Σ planningassignment.TIMEPERIOD (STAFFPROJECTTIME_ID)                     (getTotalAssignedTime)
sptDisponible(spt) = dpTarget(staff,y,m) − DEVIATION − HOLIDAY − EDUCATION − OFFICIALABSENCE − OTHERABSENCE − INTERNALTIME
                                                                                                (getAvailableTime = dpCalc, l. 1846)
tlCout(t)          = TIMEPERIOD × rateAt(STAFF_ID, date(t))   ; 0 sans tarif                   (TimeLog.getStaffAmount ; rateAt l. 970)
tlCoutFI(t)        = tlCout(t) × (1 + plFacteur(t.TIMEYEAR, t.TIMEMONTH)/100)                  (« Coût de revient (+) frais internes »)
```

Tous les Σ sont des `reduce` sur des doubles ; arrondir avec `rJ` **seulement à l'affichage** (exception : total de colonne d'Analyze4, arrondi à chaque pas, §4.5).

### 2.4 Taux de réalisation pondéré — `SubPhaseReport` [P classe entière]

`plSubPhaseMap(project, filtreOuvrages, filtrePhases)` :
1. parcourir les `planningmonth` de l'affaire qui passent les filtres (liste vide = pas de filtre ; entrée `null` = « sans ») ; regrouper **par SUBPHASE_ID** (tous ouvrages confondus) ;
2. par phase : `budget_phase += plBudget(pm)` (tous mois) ; `taux[12·an+mois] = IMPLEMENTATIONRATE` (dernier gagnant si deux ouvrages ont le même mois [D]) ;
3. `kmax` = plus grand 12·an+mois parmi les mois retenus ; `completeImplementationRates(kmax)` : du premier mois planifié à `kmax`, **reporter le dernier taux connu** dans les clés absentes ;
4. `taux_phase(y,m)` : clé = min(12·y+m, kmax) ; 0 si antérieure au premier mois.

`plTauxPondere(map, y, m)` = Σ_phases `taux_phase(y,m) × budget_phase / budgetTotal` avec `budgetTotal = Σ plBudget` des mois filtrés ; **0 si budgetTotal = 0** (l'original divise par zéro et affiche NaN — Analyze1@526-535, Analyze2@734-749, Analyze3@535-547, Analyze4@525-558). `plPrestations(y,m)` = `budgetTotal × τ / 100`. Manuel DE p. 43 : « les parts sont pondérées par les budgets d'honoraires » [P].

### 2.5 Tables lues (hors PLANNING*)

| Table | Colonnes | Usage |
|---|---|---|
| PROJECT | ID, NUMBER, TITLE, PROJECTSTATECODE, PROJECTSTARTDATE (111/111 renseignés), SORTLABEL, ISINTERNAL, phases | filtres, colonnes, mois de départ (Analyze3) |
| PROJECTPHASE / PROJECTSUBPHASE | NUMBER, NAME, ordre | lignes/colonnes de phases partielles ; libellé `NUMBER + " " + NAME` |
| SUBPROJECT | CODE, `toString` | filtres ouvrage |
| PROJECTCONTRACT (+ PROJECTFEECALCULATION*) | NUMBER, NAME, montants HT (spec_9 §4) | contrat informatif, suggestions de montants, lecture seule |
| STAFF, CONTACT | ISACTIVE, SORTORDER, nom entité (`staffName`) | listes, lignes collaborateurs |
| STAFFRATE | STAFF_ID, VALIDFROM, RATE | `rateAt` |
| STAFFPROJECTTIME | TIMEYEAR, TIMEMONTH, TIMEBUDGET, DEVIATION, HOLIDAY, EDUCATION, OFFICIALABSENCE, OTHERABSENCE, INTERNALTIME | attributions, disponibilités |
| STAFFTARGETTIME | TARGETHOURS0..11, OVERTIME0..11, TARGETTIMEREDUCTION | heures prévues (Reporting, disponibilité) |
| TIMELOG | PROJECT_ID, SUBPROJECT_ID, SUBPHASE_ID, STAFF_ID, TIMEYEAR, TIMEMONTH, TIMEDAY, TIMEPERIOD, ISHOLIDAY, ACTIVITY_ID | heures saisies, coût de revient, Reporting |
| PROJECTACTIVITY | TYPECODE | catégories Reporting |
| APPUSER | USERID | « Utilisateur » |
| BOILERPLATEGROUP / BOILERPLATE | TYPECODE = `planningText` | textes types du cahier des charges (1 groupe au bureau, type 0 ; aucun texte) |
| SETTING | `standardTableRateLimit` = 10.0 | seuil de marge |

Écritures : les 9 collections `planning*` et `setting.standardTableRateLimit` uniquement — jamais `staffprojecttime` ni `timelog` [P].

---

## 3. Domaine d'affaire « Planification RH » (`ProjectPlanningFrame` et dialogues de saisie) — lot B

Règles communes [P] : dialogues modaux, OK par défaut / Échap = Annuler ; champs numériques `NumberGuard` (double) ; notes 1024 caractères ; boutons « ▾ » (icône `suggestion`) = menu de suggestions qui remplit le champ ; création = `persist` + ajout aux listes parentes, édition = `merge` → DeltaSub : `DS.save` / `DS.commit`. Libellés FR = `Strings.db`, paquet `deltaproject.project.planning` (451 chaînes ; extraits dans `pl_saisie/strings_planning.txt`).

### 3.1 Cycle de planification (manuel DE p. 38-44 + bytecode)

1. Réglages globaux (bouton Settings gauche) : facteur des frais internes daté (§3.3), catégories d'honoraires modèles (§3.2), textes types « Cahier des charges [par défaut] » (§3.3), « Indicateur de la marge bénéficiaire » (§3.3). Préalable métier : disponibilités `staffprojecttime` saisies (spec_6 §4).
2. Par ouvrage (ou « Sans ouvrage ») : `planningsubproject` (contrat informatif, tarif de facturation, note, utilisateur) puis ses catégories `planningrole` (import des modèles).
3. Par phase partielle (ou « Pas de phase partielle ») : période = liste de `planningmonth`, déplaçable ±1 mois.
4. Étape 1 « Planifier le budget temps » : contrats − déductions − frais internes = budget d'honoraires ; ÷ tarif = budget temps.
5. Étape 2 « Catégories d'honoraires et coût de revient » : `planningtime` (% et CHF/h) ; variante « Planification des ressources » (§3.10).
6. Étape 3 « Attribuer les collaborateurs » : `planningassignment` sur les `staffprojecttime` du mois.
7. Étape 4 « Taux de réalisation estimé » : `IMPLEMENTATIONRATE` cumulé par mois.
8. Étape 5 « Planification des encaissements », 9. Étape 6 « Encaissements ».

### 3.2 Écran `ProjectPlanningFrame` [P `initComponents`, `Strings`]

- **Disposition** : split gauche/droite (position mémorisée `projectPlanningFrame.Preferences` = `"<divider>,<TableType>"`). Gauche : barre (bouton « Settings » ▾) + **liste des ouvrages** (`SubProjectFilterTableModel`, type `all`) : ligne 0 « Pas d'ouvrage » (null) puis les `subproject` de l'affaire ; col 0 « ● » si une `planningsubproject` existe pour l'ouvrage, col 1 « Ouvrage » ; première ligne sélectionnée ; changer de ligne reconstruit la grille. Droite : barre (Settings ▾, E ▾, Roue ▾, Type ▾ + libellé « <type> [unité] », champ de recherche) + **grille phases partielles × mois** avec en-tête de ligne fixe « Phase partielle ».
- **Grille** : lignes = « Pas de phase partielle » puis chaque `projectsubphase` de chaque `projectphase` (libellé `NUMBER + " " + NAME`) ; colonnes = tous les mois de min à max sur l'ensemble des lignes (mois vides inclus), en-tête « janv. 2026 », largeur 80. Valeur selon le type (défaut `timeHour`) :

| Type | Libellé | Valeur du `planningmonth` (ouvrage, phase, mois) |
|---|---|---|
| timeHour | Budget temps [h] | TIMEHOUR |
| amountTotal | Budget d'honoraires disponible [CHF] | plBudget |
| implementationRate | Degré d'accomplissement selon le directeur d'affaire [%] | IMPLEMENTATIONRATE |
| expectedAmount | Encaissements planifiés [CHF] | plAttendu |
| settledAmount | Encaissements [CHF] | SETTLEDAMOUNT |

  Cellule vide si pas de mois ; fond **orange `rgba(255,144,0,0.196)`** (50/255) sur toute cellule non vide non sélectionnée [P `MonthCellRenderer@4-16`] ; recherche = `Tables.filterTable` sur la grille.
- **Menus** :
  - Settings gauche : « Facteur des frais internes… », « Catégories d'honoraires et coût de revient… » (modèles), « Cahier des charges [par défaut]… », « Indicateur de la marge bénéficiaire… ».
  - Settings droit : « Ouvrage, contrat et tarif de facturation… » (actif si affaire) → nouveau/édition de la `planningsubproject` de l'ouvrage sélectionné ; « Catégories d'honoraires et coût de revient… » (actif si la planification existe) ; — ; « Editer la période de planification… » (actif si planification **et** phase sélectionnée).
  - E : « Planifier le budget temps… », « Catégories d'honoraires et coût de revient… », « Attribuer les collaborateurs… », —, « Taux de réalisation estimé par le directeur des travaux… », « Planification des encaissements… », « Encaissements… » ; actifs si une phase est sélectionnée **et possède des mois**.
  - Clic droit (en-tête ou grille) = Settings droit + — + E. **Double-clic** = « Editer la période de planification ». Roue = copier / CSV (`mgGear`). **Aucune impression** dans ce domaine [P].
  - Guards : E et Type actifs si affaire chargée et exactement un ouvrage sélectionné.

### 3.3 Référentiels et réglages

**`PlanningSubProjectDialog` « Ouvrage, contrat et tarif de facturation »** (500×418) [P] : Affaire (ro), Ouvrage (ro / « Sans ouvrage »), Contrat d'honoraires (ro, `NUMBER + " " + NAME`) + bouton « > » → « Choisir… » (navigateur des contrats de l'affaire, spec_9 §3) / « Supprimer » (actif si lié ; met null), Utilisateur (ro) + « < » (menu des `appuser`), Tarif de facturation [CHF] (60 px), Note interne. Bouton « Supprimer » (édition seulement, actif si ni catégorie ni mois ; confirmation « Voulez-vous vraiment supprimer cette inscription ? », titre « Avertissement », Oui/Non). **OK actif si tarif non vide et > 0** [P `checkGuards@24-41`].

**Catégories d'honoraires** [P] :
- `PlanningRolesDialog` « Catégories d'honoraires et coût de revient » (600×428, Fermer) : Affaire, Ouvrage (ro), tableau « Désignation | Part du budget d'honoraires en % | Coût de revient horaire » tri `SORTORDER` ; barre + ▾ (« Nouvelle saisie… », « Importer… » actif si des modèles existent), E, −, |<, <, >, >| ; double-clic = E. Ordre : haut → 0, monter → −2, descendre → +2, bas → n+1, puis re-tri et renumérotation 0..n−1 [P `setPlanningRoleSortOrder*` ; renumérotation D]. Suppression refusée si utilisée (message §2.2), sinon confirmation. Import = `PlanningRoleTemplateBrowserDialog` (420×368, multi-sélection, OK si sélection, double-clic = OK) → copie NAME, SORTORDER, TIMERATE, INTERNALRATE. Retour `isDirty` → rafraîchir.
- `PlanningRoleDialog` « Nouveau » / « Editer » (500×165) : Désignation (64, obligatoire), Part [%], Coût de revient horaire [CHF/h].
- `PlanningRoleTemplatesDialog` (global, 600×428, même barre) : + ▾ = « Nouvelle saisie… », —, les 7 noms prédéfinis (pré-remplissent la désignation), —, « Insérer tout » (actif seulement si la liste est vide ; crée les 7 avec SORTORDER 0..6 et taux 0). `PlanningRoleTemplateDialog` « Nouvelle catégorie d'honoraires » / « Editer les catégories d'honoraires ».

**Facteur des frais internes** [P] : `PlanningCostFactorsDialog` (420×428) texte « Ce facteur sert à évaluer le montant des frais internes », tableau « Valable dès le » (= `<mois long> <année>`) | « Facteur des frais internes [%] », + E − Fermer, double-clic = E. `PlanningCostFactorDialog` « Nouveau » / « Editer le facteur des frais internes [%] » (400×185) : Année (ro, ▾ y−1, y+1, y+2, y+3, y+4 ; défaut année courante), Mois (ro, ▾ 12 mois, **désactivés** si (année, mois) existe déjà), Facteur [%] obligatoire ; suppression avec confirmation, sans contrôle d'usage (les mois gardent leur instantané). Manuel DE p. 39 : exemple nov. 2015 → 5.00 %, nov. 2017 → 7.00 %.

**« Cahier des charges [par défaut] »** : `PlanningBoilerplateDialog` (1200×728, Fermer) incorpore la gestion des textes types du groupe `planningText` (`admin.BoilerplateFrame`) → réutiliser l'éditeur de textes types de DeltaSub s'il existe, sinon liste + éditeur simple sur `boilerplategroup`/`boilerplate` de ce type.

**« Indicateur de la marge bénéficiaire »** : `SetTableRateLimitDialog`, un champ « Afficher la marge bénéficiaire en vert à partir de » [%] → `setting.standardTableRateLimit` (défaut 10.0, présent au bureau) ; consommé par §5.3 uniquement (§4.3 colore au signe).

### 3.4 Période de planification — `SubPhaseMonthsDialog` « Editer la période de planification » (420×448) [P]

- Champs ro : Affaire, Ouvrage (« Pas d'ouvrage »), Phase partielle ; libellé « Mois de planification de la phase partielle » ; tableau « Année | Mois | Heures (TIMEHOUR) | Total (plBudget) », sélection par intervalle contigu ; barre + ▾, <, >, −, Fermer.
- **+ ▾** : si un mois est sélectionné, **13 mois** à partir de (mois sélectionné − 6), libellé long, désactivés s'ils existent ; — ; « Nouvelle saisie… » → `SubPhaseMonthDialog` « Mois de planification » (400×165) : Année (▾ y−1, y, y+1), Mois (▾ 12, désactivés si présents pour l'année), Nombre de mois (▾ 1..12, défaut 1), défaut = mois courant, OK si (année, mois) libre. Création [P `newMonths@30-137`] : N itérations à partir du mois choisi ; à chaque position libre `new planningmonth(y, m, EXTERNALRATE de la planification)` avec `INTERNALCOSTFACTOR = plFacteur(y,m)`, `IMPLEMENTATIONRATE = 0`, PROJECT_ID / SUBPROJECT_ID / SUBPHASE_ID ; **une position occupée est sautée mais consomme une itération** (≤ N créés) ; sélection du premier créé.
- **< / >** (`movePlanningMonths`, @1-815), sur les lignes sélectionnées, dans l'ordre :
  1. un mois a `SETTLEDAMOUNT > 0` → Information « Déplacer n'est pas possible » / « Au moins un mois ne peut pas être déplacé car il présente déjà une entrée de paiement. » → abandon ;
  2. sinon, un mois a des attributions → `ConfirmationCheckedDialog` (titre « Confirmation », bouton « Déplacer », texte « Des collaborateurs sont déjà planifiés pour au moins un mois. Voulez-vous quand même reporter les mois ? », case « Les disponibilités des collaborateurs et les charges d'affaire doivent être réexaminées pour ces mois. ») ; puis pour chaque attribution dont le collaborateur n'a pas de `staffprojecttime` au mois cible → Information « Un mois ne peut pas être déplacé car aucune disponibilité d'affaire (<mois longs séparés par « , »>) n'a encore été saisie pour au moins un collaborateur. » → abandon ;
  3. un mois a des `planningstafftime` → Information « Déplacer avec précaution » / « Au moins un mois ne peut pas être reporté, car les catégories d'honoraires sont déjà affectées à des attributions détaillées (planification des ressources). » (avertissement, on continue) ;
  4. avant : du dernier au premier, `moveMonths(m, +1)` ; arrière : du premier au dernier, `moveMonths(m, −1)` ; `moveMonths` n'agit que si le mois cible n'existe pas dans la phase ; met à jour TIMEYEAR/TIMEMONTH, **recopie `plFacteur` du nouveau mois**, et **re-lie chaque attribution au `staffprojecttime` du collaborateur au nouveau mois** s'il existe (sinon elle garde l'ancien).
  Guards : < actif si le mois précédant la première ligne sélectionnée est libre ; > si le mois suivant la dernière est libre ; − si exactement une ligne.
- **−** : refus (Information) « Ce mois ne peut pas être supprimé, car il présente déjà une entrée de paiement. » / « … parce que des collaborateurs sont déjà planifiés. » / « … car les catégories d'honoraires sont des attributions détaillées (planification des ressources). » ; sinon `ConfirmationCheckedDialog` (« Confirmation », OK, « Voulez-vous vraiment supprimer cette inscription ? L'action ne peut pas être annulée. », case « Je confirme que cette inscription n'est plus utilisée. ») → suppression + cascade `planningtime`.
- Retour `isDirty` → rafraîchir la grille.

### 3.5 Cadre commun des six étapes — `PlanningSubPhaseDialog` (« Editer », 1000×528, min 1000×750 [sic], redimensionnable, bornes mémorisées) [P]

- En-tête ro : Affaire, Ouvrage, Contrat d'honoraires + bouton « ContractInfo » ▾ (actif si contrat lié), Phase partielle. Titre de section (gras) = `planningSubPhase_editStepN` : 1 « Budget », 2 « Coûts selon les catégories d'honoraires », 3 « Attribution des collaborateurs », 4 « Taux de réalisation estimé par le directeur des travaux », 5 « Encaissements planifiés », 6 « Encaissements ».
- Boutons : « Type » ▾ + libellé (**étape 2 seulement**), « Edit » ▾, Roue ▾ (export), « … Planification des ressources » (**étape 2 seulement**, → §3.10), Fermer.
- Menu ContractInfo (lecture seule, dialogues de spec_9) : si le contrat a un calcul d'honoraires : « Conditions du contrat d'honoraires… » (actif si `timeCalculationAmount`), « Honoraires d'après le temps employé effectif… », « Honoraires d'après le coût de l'ouvrage… », —, « Conditions des coûts supplémentaires… » (actif si `costCalculationAmount`), « Coûts supplémentaires… » ; puis — « Planification des encaissements… », « Encaissements… » (spec_9 §7, ro).
- Tableau (`PlanningSubPhaseTableModel`) : « Description » | une colonne par mois **de min à max, mois manquants compris** (`janv. 2026`, null si pas de mois) | « Total » (si `hasTotalColumn`) | « Unité ». Lignes surlignées (fond `rgba(20,20,20,.16)`), lignes grasses, couleurs de cellules (vert `#008F00`, orange `#FF9000`, rouge `#FF0000`).
- Menu Edit : si le modèle est « shared-editable » : item « <edit editStepN>… » (étapes 1 et 2 : « Répartition par mois… », étape 5 : « Editer… ») actif si une ligne éditable en ligne est sélectionnée et s'il existe des mois → `editAllMonthsInRow` ; — ; un item par mois « janv. 2026… » actif si `isPlanningMonthEditable(mois, ligne)` → `editPlanningMonth`.
- Souris : double-clic sur une cellule mois → `editPlanningMonth` ; double-clic sur « Description » d'une ligne éditable en ligne → `editAllMonthsInRow` ; clic droit → menu Edit. Après édition : reconstruction si la structure a changé, sinon rafraîchissement du rendu.

### 3.6 Étapes 1 à 6 : lignes, formules, couleurs, édition

#### Étape 1 « Budget » — `PlanningSubPhase1TableModel` (Total : oui) [P]
16 lignes : Contrats, Avenants, **Contrats et avenants**, Frais externes, Coûts supplémentaires, Sous-planificateurs, Modèle BIM, Sous-traitants, Assurances, Autres déductions, **Déductions**, Facteur des frais internes [%], Frais internes, **Budget d'honoraires**, Tarif de facturation, **Budget temps (h)** (gras = surlignées). Total = Σ mois, **vide** pour le facteur et le tarif. Unités % / CHF/h / h / CHF. Aucune couleur. Manuel DE p. 41 (valeurs de contrôle §9.1).
Édition en ligne : Contrats, Avenants, les 7 déductions, Facteur ; **pas** Tarif ni Budget temps. Facteur → `PlanningMonthsInternalCostFactorDialog` ; autres → `PlanningMonthsDialog` (§3.7.2) ; puis pour les **n premiers mois** : affecter la valeur, **recalculer `TIMEHOUR = plBudget / EXTERNALRATE` (0 si tarif ≤ 0)** [P `updatePlanningMonths@45-81`]. Cellule → `PlanningMonthDialog` (§3.7.1).

#### Étape 2 « Coûts selon les catégories d'honoraires » — `PlanningSubPhase2TableModel` (Total : oui ; Type : oui) [P]
Types : `timeRate` « Répartition du budget temps [%] » (défaut), `timeHour` « Budget temps [h] », `internalAmount` « Coût de revient [CHF] ». Lignes : « Contrat d'honoraires (CHF) » (= plBudget), « Budget temps » [h], **une par catégorie** (unité %, h ou CHF selon le type), « Total réparti par catégorie (%) » = plTotalTimeRate, « Différence par rapport au 100% » = plTotalTimeRate − 100, « Heures réparties par catégorie (h) » = TIMEHOUR × plTotalTimeRate/100, « Heures réparties (-) budget temps (h) », « Coûts de revient selon les catégories d'honoraires (CHF) » = plTotalInterne **sans facteur** (§0.2 n° 1), « Coût de revient (-) contrat d'honoraires (CHF) » = plTotalInterne − plBudget. Total : Σ mois pour contrat, budget temps, heures, coûts et leurs différences ; catégorie → Σ heures ou Σ coûts (vide en %) ; vide pour les deux lignes en %. Surlignées : contrat, budget temps, total réparti, heures réparties, coûts ; gras : budget temps, total réparti. Couleurs (colonnes mois) : « Total réparti » ≠ 100 → **orange** ; « Différence 100 % » > 0 → **rouge**, < 0 → **vert**. Manuel DE p. 41 (§9.2).
Édition : lignes de catégorie seulement. En ligne → `PlanningTimesDialog` « Budget d'honoraires » (500×165 : Désignation ro, Part du budget d'honoraires en % init `planningrole.TIMERATE` ▾ idem, Coût de revient horaire init `INTERNALRATE` ▾ idem) → pour **chaque mois** créer ou mettre à jour la `planningtime`. Cellule → `PlanningTimeDialog` (§3.8).

#### Étape 3 « Attribution des collaborateurs » — `PlanningSubPhase3TableModel` (Total : oui, pas d'édition en ligne) [P]
Lignes : pour chaque catégorie : ligne de la catégorie [h] = plHeures(pt), puis une ligne par **collaborateur distinct** attribué à une part de cette catégorie dans cette phase (nom entité) = TIMEPERIOD de son attribution ; puis « Budget temps (h) » = Σ plHeures des parts du mois, « Heures attribuées aux collaborateurs » = Σ TIMEPERIOD. Total : catégories et budget = Σ mois ; collaborateurs et attribuées = vide. Surlignées + gras : catégories et 2 dernières. Couleur sur « Heures attribuées » : si ≠ budget (tolérance 0,005) : attribuées − budget > 0 → **rouge**, sinon **vert**. Cellule d'une catégorie avec `planningtime` → `PlanningAssignmentsDialog` (§3.9) ; « structure changée » si création/suppression.

#### Étape 4 « Taux de réalisation estimé par le directeur des travaux » — `PlanningSubPhase4TableModel` (**sans** Total) [P]
Source : `SELECT timeYear, timeMonth, SUM(timePeriod) FROM timelog WHERE project = p AND subPhase = s GROUP BY …` (`subPhase IS NULL` pour « Pas de phase partielle ») ; cumuls sur les colonnes mois dans l'ordre. Lignes : « Budget temps (cumul) » [h] = Σ TIMEHOUR ≤ mois ; « Part du budget temps en % » = cumul / Σ total TIMEHOUR × 100 (vide si total 0) ; « Heures saisies » [h] = cumul TIMELOG ; « Part des heures saisies en % » = cumul saisi / total budget × 100 ; « Taux de réalisation estimé par le directeur des travaux » [%] = IMPLEMENTATIONRATE si > 0 sinon vide. Surlignée : taux ; gras : les deux « Part » et le taux. Toute cellule mois → `PlanningMonthImplemenmtationDialog` (450×238) : Mois (ro), Taux de réalisation [%] ▾ (0, 1, …, 100), Note interne ; OK si taux non vide.

#### Étape 5 « Encaissements planifiés » — `PlanningSubPhase5TableModel` (Total : oui) [P]
Lignes : « Contrats et avenants », « Encaissements planifiés » (SCHEDULEDAMOUNT), « Encaissements planifiés pour sous-planificateurs », « … pour sous-traitants », « Ajustements », « Encaissements planifiés » (= plAttendu), « Contrats et avenants (cumul) », « Encaissements planifiés (cumul) », « Situation des encaissements planifiés liés au contrat » = cumul contrats − cumul planifiés. Cumul = Σ mois ≤ courant. Total : Σ pour les non cumulées, vide pour les cumulées. Surlignées : contrats, planifiés (total), situation ; gras : situation. Édition en ligne (« Editer… ») sur les 4 lignes de saisie → `PlanningMonthsDialog` → n premiers mois. Cellule → `PlanningMonthExpectedAmountDialog` « Editer » (450×378) : Mois, Encaissements planifiés [CHF], Pour sous-planificateurs ▾, Pour sous-traitants ▾, Ajustements, Encaissements planifiés (ro = Σ 4, recalculé à la frappe), Note ; ▾ propose **−DEDUCTIONSUBPLANNER** / **−DEDUCTIONSUBCONTRACTOR** du mois (« <val> CHF », −0 → 0) ; OK si les 4 montants sont non vides. Manuel DE p. 43 (§9.3).

#### Étape 6 « Encaissements » — `PlanningSubPhase6TableModel` (Total : oui) [P]
Lignes : « Encaissements planifiés », « Encaissements » (SETTLEDAMOUNT), « Encaissements planifiés (cumul) », « Encaissements (cumul) », « Solde » = cumul planifiés − cumul reçus. Surlignées : 3 cumuls ; gras : solde. **Aucune édition en ligne** (`isSharedEditable` = false). Cellule → `PlanningMonthSettledAmountDialog` « Encaissements » (450×248) : Mois, Encaissements [CHF] ▾ (propose plAttendu du mois), Note ; OK si non vide.
Articulation avec spec_9 §7 : l'original garde **séparés** les encaissements de la planification (PLANNINGMONTH) et ceux des contrats (PROJECTPAYMENT) ; DeltaSub fait de même (une suggestion « = encaissements reçus du contrat ce mois » peut être ajoutée au ▾, étiquetée adaptation).

### 3.7 Dialogues de l'étape 1

#### 3.7.1 `PlanningMonthDialog` « Modifier la planification » (600×728) [P]
Champs (unités à droite) : Mois (ro, long), Contrats [CHF], Avenants [CHF], Contrats et avenants (ro), Frais externes, Coûts supplémentaires, Sous-planificateurs, Modèle BIM, Sous-traitants, Assurances, Autres déductions, Déductions (ro), Facteur des frais internes [%] ▾ (propose `plFacteur(y,m)` ; libellé rouge « Le facteur est différent de la valeur par défaut. » si ≠), Frais internes (ro), Budget d'honoraires (ro), Tarif de facturation [CHF/h] ▾ (propose `planningsubproject.EXTERNALRATE`), Budget temps [h] ▾, libellé « Cette entrée doit être mise à jour. », Note interne.
- Calcul en direct (`calcAmounts@1-208`) à chaque frappe dans un montant ou le facteur : total, déductions, frais internes = (total − déductions) × facteur/100, budget = total − déductions − frais internes ; puis **`isTimeHourDirty = true`**. Frappe dans le tarif → dirty ; frappe dans le budget temps → non dirty. **OK actif seulement si non dirty et budget temps non vide** (`checkGuards@33-74`) : le budget temps doit être ressaisi/choisi après tout changement de montant.
- Suggestions du budget temps (`getTimeHourPopupMenu@16-319`) : q = budget / tarif (si tarif > 0) ; liste sans doublon des valeurs > 0 : round(q), —, ⌊q/100⌋×100, ⌊q/10⌋×10, ⌊q/5⌋×5, round(q/5)×5, round(q/10)×10, round(q/100)×100 [ordre exact D]. Manuel DE p. 41 : 28'737 / 135 = 212.87 → 213 saisi.
- OK → écrit les 13 champs + note (trim). Le budget temps est **stocké** ; il n'est recalculé automatiquement que par la répartition par ligne (§3.6 étape 1).

#### 3.7.2 Répartition par ligne (étapes 1 et 5) — `PlanningMonthsDialog` « Répartir le montant par mois » (450×225) [P]
Désignation (ro = nom de la ligne), Montant [CHF] ▾, Nombre de mois (ro, ▾ **1..n−1**, défaut n = nombre de mois de la phase), Montant par mois (calculé) (ro = Montant / nb), Montant par mois (arrondi) [CHF] ▾ (⌊c/100⌋×100, ⌊c/10⌋×10, round(c/10)×10, round(c/100)×100) ; OK actif si l'arrondi est non vide.
Menu Montant ▾ (bouton actif si contrat lié) : « Conditions du contrat d'honoraires… » (ro) ; si `timeCalculationAmount` : item « <montant HT> CHF » → Montant = `getAmount2VatExcluded()` ; — ; « Honoraires d'après le temps employé effectif… », « Honoraires d'après le coût de l'ouvrage… » ; — ; « Conditions des coûts supplémentaires… » ; si `costCalculationAmount` : item « <montant> » (préfixe non lisible dans le bytecode, probablement « − » [D]) ; « Coûts supplémentaires… ». Montants HT (manuel DE p. 40 : « tous les montants hors TVA »).
`PlanningMonthsInternalCostFactorDialog` « Attribuer le facteur des frais internes [%] » (450×165) : Désignation, Nombre de mois (▾ 1..n−1), Facteur [%] ▾ (`plFacteur` du **premier** mois de la phase) ; retour (n, facteur).

### 3.8 Étape 2 par cellule — `PlanningTimeDialog` « Nouveau » / « Heures attribuées » (500×428) [P]
Mois (ro), Catégories d'honoraires (ro), Part du budget temps en % ▾, Coût de revient horaire [CHF/h] ▾ (propose `planningrole.INTERNALRATE`), Heures [h] (ro = TIMEHOUR × part / 100, recalculé à la frappe), Note interne, bouton « Supprimer » (édition). Suggestions de part : `max = 100 − Σ TIMERATE des autres parts du mois` (si 0 ≤ Σ ≤ 100), `suggested = plSuggestedRate(pm, role)` (si ≠ 0 et non null), —, 0, 10, …, 100. Validation : part et coût non vides. Nouveau : INTERNALRATE préinitialisé au taux de la catégorie. Suppression : confirmation puis suppression de la part **et de ses attributions**.

### 3.9 Étape 3 — `PlanningAssignmentsDialog` « Attribuer les collaborateurs » (900×628, Fermer) [P]
- En-tête ro : Mois, Catégories d'honoraires, Budget temps [h] (= plHeures(pt)), Heures attribuées [h] (= Σ TIMEPERIOD), Part des heures attribuées en % (= attribuées / budget × 100, vide si budget 0). Libellé « Attribution ».
- Tableau : une ligne par **collaborateur actif de l'affaire** (`Staff.getActiveStaffListByProject` = intervenants « Collaborateurs » actifs) avec son `staffprojecttime` du mois (éventuellement absent). Colonnes : « Collaborateur », « Coût de revient » (`rateAt` au 1er du mois, vide sans spt), « Budget temps » (TIMEBUDGET), « Déjà attribuées (h) » (sptAttribue − attribution courante), « Disponibles [h] » (TIMEBUDGET − déjà attribuées), « Attribuées [h] » (TIMEPERIOD), « Part [%] » (entier = round(TIMEPERIOD / (budget/100))), « Disponibles après attribution [h] » (TIMEBUDGET − sptAttribue). Colonnes 3 et 6 colorées (> 0 vert, < 0 rouge). Manuel DE p. 42 (§9.4).
- Barre : + (**toujours désactivé**), E (ligne sans attribution mais avec spt → nouveau ; avec attribution → édition), − (confirmation, suppression), double-clic = E. `suggestionMap` = {nom de `planningstaff` de la catégorie → TIMEHOUR de sa `planningstafftime` du mois}.
- `PlanningAssignmentDialog` « Nouveau » / « Editer » (500×425) : Mois, Catégories d'honoraires, Collaborateur, Coût de revient [CHF/h] (ro, `rateAt` au 1er du mois, 0 sinon), Heures [h] ▾ (obligatoire ; champ et ▾ actifs seulement si `unassigned` calculable), Note (« cahier des charges ») + « … » → navigateur des textes types `planningText` (insère). `unassigned` = plHeures(pt) − Σ TIMEPERIOD des autres attributions si > 0, sinon `sptDisponible(spt)`. Menu ▾ : « <unassigned> h », —, entrées de `suggestionMap` « <h> h (<nom>) », —, « <x> h (50 %) », 25 %, 20 %, 10 % de unassigned (troncature entière). Nouveau : `planningassignment` liée à la part et au spt.

### 3.10 Planification des ressources — `PlanningStaffsDialog` (1200×778) [P]
- Barre : + (nouvelle sous-catégorie pour la catégorie sélectionnée), E ▾ (« <nom>… » ; — ; par mois « <nom>, <mois long>… » ; — ; « Budget horaire pour le rôle de planification… »), − (confirmation, cascade des heures), Roue (export), « Actualiser les catégories d'honoraires » ▾ (par catégorie « <nom>… », —, par mois « <mois long>… »), « Disponibilité des collaborateurs (h) » → `StaffAvailableTimeDialog`. Double-clic : ligne sous-catégorie col 0-1 → édition ; colonne mois → heures du mois ; ligne « Part … à ce jour » → `PlanningTimeDialog`. Clic droit : sous-catégorie → menu E ; sinon catégorie → « <catégorie>: Nouvelle sous-catégorie… ».
- Tableau `PlanningStaffTableModel` : colonnes « Nom », « Coût de revient [CHF] », mois « janv. 2026 » (min à max, gaps inclus), « Unité ». Lignes : « Budget temps » [h] (TIMEHOUR) ; vide ; par catégorie : titre, « Part du budget d'honoraires en % à ce jour [%] » (TIMERATE), « Part du budget d'honoraires en % replanifié [%] » (= Σ heures des sous-catégories / TIMEHOUR × 100, grisée), « Budget d'honoraires replanifié [h] » (Σ heures, taux = INTERNALRATE, grisée), une ligne par sous-catégorie (taux = STAFFRATE, valeur = `planningstafftime.TIMEHOUR`) ; vide ; « Total » (Σ heures) ; « Différence par rapport au budget temps » (TIMEHOUR − total) ; vide ; « Budget d'honoraires » (plBudget) ; ligne libellée « Désignation » dans l'original (anomalie de libellé ; = Σ TIMEHOUR × STAFFRATE = **coût de revient replanifié**, à nommer ainsi dans DeltaSub) ; « Différence par rapport au budget d'honoraires » (plBudget − coût). Surlignées : budget temps, titres, total, différence, budget d'honoraires, différence d'honoraires ; gras : budget temps, titres, lignes « replanifié [h] », total, budget d'honoraires ; fond gris `#F5F5F5` sur les mois sans `planningmonth` pour les lignes catégorie/sous-catégorie. Manuel DE p. 42 (§9.5).
- `PlanningStaffDialog` (500×135) : Nom (64, obligatoire), Coût de revient horaire [CHF/h] ; défauts : « <catégorie> <n+1> », taux = INTERNALRATE, SUBPHASE_ID = phase.
- `PlanningStaffTimeDialog` (500×195) : Mois, Catégories d'honoraires, Nom (ro), Heures [h] ▾ (cible = plHeures(pt) − heures déjà planifiées de la catégorie (+ heures courantes en édition)), « Supprimer » en édition.
- `PlanningStaffTimesDialog` « Editer » (500×281) : cadre « Budget temps » à 3 radios : « Heures par mois » [h] → valeur fixe ; « Part du budget temps en % » ▾ (TIMERATE de la catégorie, puis 10..100) → TIMEHOUR du mois × part/100 (0 si nul) ; « Taux de disponibilité des collaborateurs pour les affaires » [%] ▾ + « Collaborateur » « … » (`StaffAvailableTimeDialog.browseStaff`) → (sptDisponible − sptAttribue) du collaborateur au mois × taux/100 (mois sans spt ou taux 0 ignorés). Crée ou met à jour la `planningstafftime` de chaque mois.
- « Actualiser les catégories d'honoraires » (`updatePlanningTime@2-159`) après « Ces modifications sont irréversibles. » : pour chaque mois (ou catégorie) : s = plSuggestedRate ; si s = 0 et part existante → TIMERATE = 0 ; si s ≠ 0 : part créée (INTERNALRATE de la catégorie, TIMERATE = s) ou mise à jour. **Si TIMEHOUR ≤ 0, s est null → ignorer le mois** (l'original planterait).
- `StaffAvailableTimeDialog` « Heures disponibles » (1000×528) : « Nom », « Coût de revient [CHF] » (`rateAt` au premier mois de la phase), mois de la phase, « Unité » (h) ; lignes = tous les collaborateurs actuels ; valeur = sptDisponible − sptAttribue (vide sans spt), **négatif possible** (manuel DE p. 41 : −7.64). Mode info (Fermer) ou choix (OK/Annuler, double-clic = OK).

### 3.11 Validations transverses et rafraîchissement
- `VIEWS['h-dispo'].refresh` (l. 1923) écoute déjà `planningassignment` ; ajouter `planningtime`, `planningrole`, `planningsubproject`, `planningmonth` aux `hit()` de cette vue et de la nouvelle vue du domaine (grille + dialogues ouverts : rafraîchir à la fermeture, comme les `isDirty` de l'original).
- Détection de conflit 409 (serveur) : chaque dialogue relit l'enregistrement avant `DS.save` (`em.refresh(project)` de `SubPhaseMonthsDialog`).

---

## 4. Domaine d'affaire « Analyse de planification RH » (`ProjectPlanningAnalyzeFrame`, Analyses 1 à 6) — lot C

Six analyses **en lecture seule** (aucune écriture) [P]. Socle : §2.3 (formules), §2.4 (taux pondéré), filtres JPQL de `TimeLog.addPlanningFilterQuery@0-351` : `project = p` + `(subProject = s1 OR subProject IS NULL …)` + idem `subPhase`, chaque `null` de la liste devenant `IS NULL` ; variantes `getFilteredTimeLogList(p, sp, ph, y, m)` (mois exact), `…Until(p, sp, ph, y, m)` (`timeYear*12+timeMonth ≤ y*12+m`), `getFilteredTimePeriodUntil` (Σ TIMEPERIOD, 0 si NULL) [P].

### 4.1 Page des tuiles [P `initComponents`, `initTile@0-59`, `openAnalyzeDialog@0-199`]
- Split vertical : haut = barre de filtres (deux tables `Ouvrage` / `Phase partielle`, sélection **multiple**, chacune avec « Annuler la sélection » actif si sélection) ; bas = 6 tuiles blanches en grille 2 × 3, chacune = titre (gras 13) + description + bouton « Appliquer » ; un clic n'importe où sur la tuile = « Appliquer » ; boutons actifs seulement si une affaire est chargée.
- Table Ouvrage : ligne 0 `null` → « Pas d'ouvrage », puis les ouvrages ; table Phase partielle : ligne 0 `null` → « Pas de phase partielle », puis toutes les phases partielles de toutes les phases.
- Descriptions de filtre (`getFilterDesc`) : « - » si vide ; libellé complet (ou « Pas d'ouvrage » / « Pas de phase partielle ») si un élément ; sinon les codes (`SUBPROJECT.CODE`, resp. libellé de phase) séparés par « , ».

| # | Titre | Description | Dialogue |
|---|---|---|---|
| 1 | Analyse de l'affaire | Avancement des travaux, analyse du temps et des coûts | `Analyze1Dialog` |
| 2 | Marge bénéficiaire | Prévision de rendement, analyse des dépenses et des bénéfices | `Analyze2Dialog` |
| 3 | Analyse de l'affaire par mois | Analyse détaillée | `Analyze3Dialog` |
| 4 | Analyse de l'affaire par phase partielle | Analyse de l'équipe, analyse des coûts et état des prestations par phase partielle | `Analyze4Dialog` |
| 5 | Analyse de l'équipe | Budget d'honoraires, coût de revient par collaborateur et par catégorie d'honoraires | `Analyze5Dialog` |
| 6 | Analyse de l'équipe par phase partielle | Budget d'honoraires, coût de revient par collaborateur, par catégorie d'honoraires et par phase | `Analyze6Dialog` |

Dialogues modaux, « Fermer » par défaut, bornes mémorisées (`planning.AnalyzeNDialogBounds`). En-tête commun : « Filtre » — « Ouvrage » [desc] « Phase partielle » [desc] ; sélecteur temporel (◀ année ▶, mois ▾ = 12 cases à cocher, la courante cochée) ; **« Appliquer » seul recalcule** (◀/▶ et le mois ne changent que l'état) ; [Rapports ▾] et [Roue ▾ : « Copier le contenu du tableau dans le presse-papier », « Exporter le tableau dans un fichier CSV »] selon l'analyse. Mois de référence par défaut = **mois précédent** (`Calendar.add(MONTH, −1)`).

### 4.2 Analyse 1 « Analyse de l'affaire » (min 1050×700) — tableau de bord par affaire [P `Analyze1Dialog.setReport@0-737`, `createChart1/3`, `createPieChart`]
- Trois cadres : **Analyse des heures** (« Budget temps » h, « Heures saisies » h, 3e champ % sans libellé), **Taux de réalisation** (« Réalisé » %), **Budget, charges, encaissements (cumul)** (« Prestations estimées », « Budget d'honoraires », « Coût de revient (+) frais internes », « Encaissements planifiés », « Encaissements », CHF) ; trois graphiques en dessous ; aucun rapport ni export.
- Formules, R = 12·an+mois de référence, sur les `planningmonth` filtrés : si 12·TIMEYEAR+TIMEMONTH ≤ R : `budgetTemps += TIMEHOUR`, `budget += plBudget`, `encPlanifiés += plAttendu`, `encaissements += SETTLEDAMOUNT` ; dans tous les cas `budgetTotal += plBudget`. Heures saisies = `getFilteredTimePeriodUntil`. Coût de revient (+) FI = Σ `tlCoutFI` des `getFilteredTimeLogListUntil`. τ = plTauxPondere(R). **Prestations estimées = budgetTotal (tous mois) × τ / 100** — pas le cumul ≤ R. 3e champ = 100 × heuresSaisies / budgetTemps (0 si 0).
- Graphiques : (1) barres « Analyse des heures », axe Y « h », 2 séries Budget temps / Heures saisies ; (2) secteurs « Taux de réalisation » Réalisé τ / Non réalisé 100 − τ ; (3) barres « Budget, charges, encaissements (cumul) », axe Y CHF, 5 séries dans l'ordre des champs ; **un seul point par série** (l'original en ajoute deux à « Prestations estimées », copier-coller @149-204 : ne pas reproduire).
- Manuel DE p. 44 (§9.6) : 1'375.50 / 1'304.85 = 105.41 % ; 167'963.58 / 169'823.58 = 98.90 %.

### 4.3 Analyse 2 « Marge bénéficiaire » (min 1000×600) [P `Analyze2TableModel`]
- Colonnes : « Désignation » | une par mois calendaire **du premier au dernier mois planifié, mois sans ligne inclus** (cellules vides) | « Total » | « Unité ». [Rapports ▾] → « Afficher le rapport… » (actif si lignes) ; [Roue ▾].
- 18 lignes (ordre de l'enum) ; R = mois de référence ; par mois, Σ sur les `planningmonth` filtrés du mois :

| # | Libellé | Par mois | Total | Unité |
|---|---|---|---|---|
| 0 | Contrats | Σ CONTRACTAMOUNT | Σ | CHF |
| 1 | Avenants | Σ CONTRACTAMOUNTADDITION | Σ | CHF |
| 2 | **Contrats et avenants** | Σ plContrat | Σ | CHF |
| 3 | Total déductions (sous-traitants, assurances, autres frais etc.) | Σ plDeductions | Σ | CHF |
| 4 | Frais internes | Σ plFraisInternes | Σ | CHF |
| 5 | **Budget d'honoraires (-) déductions et frais internes** | Σ plBudget | Σ | CHF |
| 6 | Encaissements planifiés | Σ plAttendu | Σ | CHF |
| 7 | Encaissements | Σ SETTLEDAMOUNT | Σ | CHF |
| 8 | **Encaissements planifiés (-) encaissements** | 6 − 7 | Σ | CHF |
| 9 | Coût de revient | mois ≤ R : Σ tlCout des timelog du mois ; > R : vide | Σ | CHF |
| 10 | Frais internes | 9 × plFacteur(an, mois)/100 ; vide si > R | Σ | CHF |
| 11 | **Coût de revient (+) frais internes** | 9 + 10 | Σ | CHF |
| 12 | Coût de revient selon les catégories d'honoraires (+) frais internes | mois > R : Σ plTotalInterne(pm) × (1 + pm.INTERNALCOSTFACTOR/100) ; ≤ R : vide | Σ | CHF |
| 13 | **Coût de revient total (CHF)** | 11 + 12 (réel jusqu'à R, planifié après) | Σ | CHF |
| 14 | Coût de revient total (%) | 11 / 13 × 100 (null si 11 ou 13 absent ; 0 si 13 = 0) | Σ11 / Σ13 × 100 | % |
| 15 | **Marge bénéficiaire (CHF)** | 5 − 13 (ou 5 si 13 absent) | Σ | CHF |
| 16 | Marge bénéficiaire | 15 / 2 × 100 (0 si 2 = 0) | Σ15 / Σ2 × 100 | % |
| 17 | Taux de réalisation | mois ≤ R : τ(an, mois) ; > R : vide | vide | % |

  Surlignées + grasses : 2, 5, 8, 11, 13, 15. Couleurs (lignes 15 et 16, colonnes mois **et** Total) : > 0 vert, < 0 rouge. Un mois ≤ R **sans ligne planifiée** reste entièrement vide même s'il a des heures (`isEmpty`) [P] : reproduire.
- Impression : §7.5.

### 4.4 Analyse 3 « Analyse de l'affaire par mois » [P `Analyze3TableModel`, `Analyze3Dialog`]
- En-tête : « Mois de départ » (◀ année ▶, mois ▾ ; défaut = `PROJECT.PROJECTSTARTDATE`, sinon aujourd'hui − 6 mois), « Nombre de mois affiché » (spinner 3…96, défaut 12, mémorisé `planning.Analyze3Dialog.Preferences` → `ds_pa3_n`), Appliquer ; [Rapports ▾] « Enregistrer le diagramme » ; [Roue ▾]. Tableau + une zone graphique à **6 boutons à bascule** : « Analyse de l'équipe » (défaut), « Analyse des coûts », « Encaissements planifiés (-) coût de revient et frais internes », « … (cumul) », « Prestations estimées (-) budget d'honoraires », « Encaissements planifiés (-) prestations estimées ».
- Colonnes : « Désignation » | n mois consécutifs à partir du départ | « Unité » — **sans Total**. Un mois sans `planningmonth` filtré est `isEmpty` → **toutes ses cellules vides**, heures comprises [P `getValueAt@69-78`].
- Par mois : plBudget, plAttendu, SETTLEDAMOUNT (Σ) ; coût par collaborateur = Σ tlCoutFI des `getFilteredTimeLogList` du mois, groupé par STAFF_ID ; τ(an, mois) et prestations = budgetTotalFiltré × τ/100 ; **cumuls sur la fenêtre affichée seulement** (partent de 0 à la première colonne) pour budget, coût total, encaissements planifiés, encaissements.
- Lignes (H surlignée, B grasse) : Budget d'honoraires (H,B) ; Budget d'honoraires (cumul) (H) ; — ; une par collaborateur (nom entité, tri alphabétique) ; Coût de revient (+) frais internes (H,B) ; … (cumul) (H) ; — ; Taux de réalisation (%) ; Prestations estimées par le directeur d'affaire ; — ; Encaissements planifiés (H,B) ; … (cumul) (H) ; — ; Encaissements (H,B) ; … (cumul) (H) ; — ; 4 balances : `plAttendu − coûtTotal` ; `cumAttendu − cumCoût` ; `prestations − budgetCumulé` ; `cumAttendu − prestations`. Unité « % » pour le taux, CHF sinon, vide sur les séparateurs. Aucune couleur.
- Graphiques : (1) barres empilées « Analyse de l'équipe » : par mois deux catégories « Budget d'honoraires <mois> » (série unique) et « Coût de revient (+) frais internes <mois> » (une série par collaborateur empilée), étiquettes tournées si > 3 mois ; (2) courbes « Analyse des coûts » : Budget (cumul), Enc. planifiés (cumul), Encaissements (cumul), Coût de revient (+) FI (cumul), Prestations estimées ; (3-6) barres d'une série = la balance choisie, titre = libellé.

### 4.5 Analyse 4 « Analyse de l'affaire par phase partielle » [P `Analyze4TableModel`]
- « Mois de référence » (défaut mois − 1) ; [Rapports ▾] « Enregistrer le diagramme » ; [Roue ▾].
- Colonnes : « Désignation » | une par phase partielle : celles du filtre, sinon « Pas de phase partielle » (`null`) puis toutes ; libellé `<n°> <nom>`, ou forme courte « Phase partielle <n°> » / « Phase partielle - » si **plus de 4 colonnes** | « Unité ».
- Formules : `budgetAffaire` = Σ plBudget de **tous** les mois de l'affaire (avant filtre — sans effet sur l'affichage) ; par colonne (mois filtrés par ouvrage et par phase) : « Budget d'honoraires » = Σ plBudget (tous mois) ; « Budget d'honoraires du mois de référence » = Σ plBudget des mois ≤ R ; « Taux de réalisation estimé par le directeur des travaux » = taux propre de la phase à R (map avec `[phase]` seule) ; « Prestations estimées par le directeur d'affaire » = taux_phase × budget_phase / 100 ; coût par collaborateur = Σ tlCoutFI des `getFilteredTimeLogListUntil(p, sp, [phase], R)` ; **total de colonne arrondi au centime à chaque pas** (`Formatter.round`, `getStaffCostTotal@582-608`).
- Lignes : Budget d'honoraires (H) ; Taux de réalisation estimé… (%) ; Prestations estimées par le directeur d'affaire (H,B) ; — ; Budget d'honoraires du mois de référence (H,B) ; — ; collaborateurs ; Coût de revient (+) frais internes (H,B). (Les lignes `cumulativeAmountTotal` et `implementationRateWeighted` de l'enum ne sont pas affichées.)
- Graphique : barres empilées « Analyse de l'affaire par phase partielle », par phase trois catégories « Budget d'honoraires <phase> » (série « Budget d'honoraires du mois de référence »), « Prestations estimées <phase> », « Coût de revient (+) frais internes <phase> » (séries collaborateurs empilées) ; catégorie = n° (ou « - ») en forme courte, étiquettes à −90°.

### 4.6 Analyse 5 « Analyse de l'équipe » [P `Analyze5TableModel`]
- « Mois » (défaut mois − 1) ; tableau **3 colonnes** « Désignation » | « <mois court> <année> » | « Unité » ; graphique.
- Sur le seul mois (Y, M) : « Budget d'honoraires » = Σ plBudget des mois filtrés (Y, M) ; par collaborateur Σ tlCout × (1 + plFacteur(Y,M)/100) des `getFilteredTimeLogList(…, Y, M)` ; « Coût de revient (+) frais internes » = Σ ; « Différence avec le budget d'honoraires » = budget − coût ; par catégorie (`planningrole` des parts des mois retenus) « coût estimé » = **Σ plMontantInterne par catégorie** (l'original ne garde que le premier `planningtime` rencontré et le compte autant de fois qu'il y a d'occurrences, `$PlanningRole.<init>@9-28` : corriger) ; « Coût de revient estimé par catégorie d'honoraires » = Σ ; « Différence avec (coût de revient + frais internes) » = totalCatégories − coût.
- Lignes : Budget (H,B) ; — ; collaborateurs ; Coût de revient (+) FI (H,B) ; Différence avec le budget (H) ; — ; catégories (tri nom) ; Coût estimé par catégorie (H,B) ; Différence avec (coût + FI) (H). Unité CHF.
- Graphique : barres empilées **horizontales** « Analyse de l'équipe », 3 catégories : « Coût de revient estimé par catégorie d'honoraires » (séries catégories), « Coût de revient (+) frais internes » (séries collaborateurs), « Budget d'honoraires » (série unique). DeltaSub : `mgChart` en mode empilé vertical accepté (§8.2).

### 4.7 Analyse 6 « Analyse de l'équipe par phase partielle » [P `Analyze6TableModel`]
- « Mois de référence » ; colonnes comme Analyse 4 ; `isSingletonFilter` = exactement 1 ouvrage et 1 phase sélectionnés (ne joue que sur le graphique).
- Par colonne, sur les mois filtrés ≤ R : « Budget d'honoraires (cumul) » = Σ plBudget ; par catégorie Σ plMontantInterne (correctement additionné) ; « Coût de revient estimé par catégorie d'honoraires » = Σ ; par collaborateur Σ tlCoutFI des `getFilteredTimeLogListUntil(p, sp, [phase], R)` ; « Coût de revient (+) frais internes (cumul) » = Σ ; « Budget d'honoraires (-) coût de revient et frais internes » = budget − coût ; « Coût de revient et frais internes (-) coût de revient estimé par catégorie » = **totalCatégories − coût** dans le code (signe inversé par rapport au libellé, `getValueAt@260-270`). **Choix : garder la formule du code** (positif = estimation supérieure au réel) et **corriger le libellé** en « Coût de revient estimé par catégorie (-) coût de revient et frais internes » — décision à confirmer avec Paulo (§10).
- Lignes : Budget (cumul) (H,B) ; — ; collaborateurs ; Coût (cumul) (H,B) ; Budget (-) coût (H) ; — ; catégories ; Coût estimé par catégorie (H,B) ; écart (H). Unité CHF.
- Graphique : barres empilées, par phase « Budget d'honoraires <phase> », « Coût de revient (+) frais internes <phase> » (collaborateurs) et, **seulement si singleton**, une barre des catégories empilées (libellé `barInternalAmount` « Coût de revient (+) frais internes (cumul) <phase> » dans l'original).

### 4.8 Données lues et état au bureau
Lues : `planningmonth`, `planningtime`, `planningrole`, `planningcostfactor`, `timelog`, `staffrate`, `staff`/`contact`, `project`, `projectphase`/`projectsubphase`, `subproject`. **Non lues** : `planningstaff*`, `planningassignment`, `planningsubproject`, `projectcontract`, `projectpayment`, `projectscheduledpayment`, `projectimplementation`. Au bureau (PLANNING* vides) : seules « Heures saisies » et « Coût de revient (+) frais internes » (facteur 0) sont non nulles ; τ = 0 grâce à la garde.

---

## 5. MANAGEMENT ▸ Planification RH (`management.PlanningFrame`, 7 domaines) — lot D

### 5.1 Fenêtre et liste des domaines [P `PlanningFrame`, `PlanningMenuTableModel`, Strings.db]
- Split gauche/droite ; à gauche la table **« Domaine »** (séparateur 200 px, préférence `planningFrame.Preferences`) ; entrées ajoutées **seulement si** droit `managementPlanning` ; dernière sélection mémorisée `lastPlanningMenuSelection` ; si rien n'est sélectionné, première ligne. DeltaSub : `mgCatView('planning', PL_CATS, plmPane, 200)` avec un paramètre d'en-tête « Domaine » à ajouter à `mgCatView` (l. 2057, en-tête « Catégorie » codé en dur).
- Ordre de l'enum : 1 Marge bénéficiaire (`profit`), 2 Encaissements (`budget`), 3 Disponibilité (`assignment`), 4 Occupation (`staffCost`), 5 Rapport mensuel collaborateur (`staffProjectTime`), 6 Attribution de l'affaire (`projectAssignment`), 7 Attribution des collaborateurs (`staffAssignment`). 1-5 partagent `PlanningAnalyzeFrame` (une instance par type) ; 6 et 7 ont leur écran.

### 5.2 Écran commun `PlanningAnalyzeFrame` (domaines 1 à 5) [P `<init>@208-583`, `setReportTable@10-223`]
- État initial : année/mois = **mois précédent** ; `projectFilter` = En cours ; tableau **vide jusqu'au premier « Appliquer »** ; ◀ ▶ et le mois ne recalculent pas.
- Barre : Filtre ▾ + étiquette · « Mois de référence » + champ mois + ▾ · ◀ année ▶ · **« Appliquer »** · Rapports ▾ · Roue ▾ · bascules Chart1/Chart2.

| Composant | Visible / actif |
|---|---|
| Filtre ▾ (+ étiquette) | **Encaissements** seulement ; Marge : filtre figé « En cours », caché |
| Étiquette « Mois de référence » | Marge seulement |
| Champ mois + ▾ | Marge et Rapport mensuel |
| Impression | Marge, Encaissements |
| Graphique | Encaissements, Disponibilité, Occupation, Rapport mensuel |
| Bascules Chart1/Chart2 | Disponibilité (« Occupation » / « Attribution »), Occupation (« Occupation » / « Coût de revient ») ; Chart1 au départ |

- Menus : Filtre ▾ = ☑ « Afficher tout » (coché si état null) puis une case par état : Configuration, En cours, En attente, Terminée, Archivée ; état null ⇒ `PROJECTSTATECODE ∉ {1, 5}` (spec_8 §2.4 B). Mois ▾ = 12 cases. Rapports ▾ = « Afficher le rapport… » (actif si ≥ 1 ligne) → `managementPlanningAnalyzeProfitReport` / `…BudgetReport` ; + « Enregistrer le diagramme » (nom de fichier « <mois long> <année> ») si graphique. Roue ▾ = copier / CSV.
- Rendu : `ReportCellRenderer(false)`, lignes surlignées/grasses, `setCellColors` ; colonnes des 4 tableaux « mois » : « Désignation » | 12 mois « janv. 2026 »… | « Total » (somme des non nuls, null si tous nuls) | « Unité ». Noms courts FR : janv., févr., mars, avr., mai, juin, juil., août, sept., oct., nov., déc. [P dpdoc] → constante `MOIS_C` à créer.

### 5.3 Domaine 1 — Marge bénéficiaire (`PlanningAnalyzeProfitTableModel(projects, y, m)`) — le tableau de bord financier de direction
- Colonnes : « Désignation » | **une par affaire** de la liste « En cours » (`ORDER BY SORTLABEL, NUMBER`) **ayant au moins un `planningmonth`**, en-tête `PROJECT.TITLE` | « Total » | « Unité ».
- Accumulation par affaire sur **tous** ses `planningmonth`, toutes années (§0.2 n° 2) : contrat += plContrat ; déductions += plDeductions ; fraisInternes += plFraisInternes ; budget += plBudget ; attendu += plAttendu ; encaissé += SETTLEDAMOUNT ; **si** 12·TIMEYEAR+TIMEMONTH **>** 12·y+m : `planifié += plTotalInterne(pm) × (1 + pm.INTERNALCOSTFACTOR/100)`.
- `coût` = Σ tlCout sur `timelog` de l'affaire avec `TIMEYEAR*12+TIMEMONTH ≤ y*12+m` (pas de filtre ouvrage/phase) ; `coûtFI` = Σ tlCout × plFacteur(TIMEYEAR, TIMEMONTH)/100 ; `τ` = plTauxPondere de l'affaire (map sur tous ses mois, sans filtre) à (y, m), 0 si Σ plBudget = 0.
- Dérivés : solde = attendu − encaissé ; coûtTotalRéel = coût + coûtFI ; effort = coûtTotalRéel + planifié ; tauxDépensé = effort ≠ 0 ? coûtTotalRéel / effort × 100 : 0 ; marge = budget − effort ; marge% = contrat ≠ 0 ? marge / contrat × 100 : 0.

| # | Libellé FR | Valeur | Unité | Surligné + gras |
|---|---|---|---|---|
| 0 | Contrats et avenants | contrat | CHF | oui |
| 1 | Total déductions (sous-traitants, assurances, autres frais etc.) | déductions | CHF | |
| 2 | Frais internes | fraisInternes | CHF | |
| 3 | Budget d'honoraires | budget | CHF | oui |
| 4 | Encaissements planifiés | attendu | CHF | |
| 5 | Encaissements | encaissé | CHF | |
| 6 | Solde à encaisser | solde | CHF | oui |
| 7 | Coût de revient | coût | CHF | |
| 8 | Frais internes | coûtFI | CHF | |
| 9 | Coût de revient (+) frais internes | coûtTotalRéel | CHF | oui |
| 10 | Coût de revient à accomplir selon les catégories d'honoraires | planifié | CHF | |
| 11 | Effort accompli+prévu | effort | CHF | oui |
| 12 | Coût de revient total | tauxDépensé | % | |
| 13 | Marge bénéficiaire CHF | marge | CHF | oui |
| 14 | Marge bénéficiaire % | marge% | % | |
| 15 | Taux de réalisation estimé par le directeur des travaux | τ | % | |

- Total : Σ des affaires, sauf 12 = Σ coûtTotalRéel / Σ effort × 100 (0 si l'un est 0), 14 = Σ marge / Σ contrat × 100 (0 si 0), 15 = **vide**.
- Couleurs (colonnes d'affaires **et** Total) : ligne 13 : > 0 vert, = 0 orange, < 0 rouge ; ligne 14 : > `standardTableRateLimit` (10) vert, 0 ≤ x ≤ limite orange, < 0 rouge. Pas de graphique. Impression §7.1. Manuel DE p. 44 (§9.7).

### 5.4 Domaine 2 — Encaissements (`PlanningAnalyzeBudgetTableModel(projects, year)`)
- 12 colonnes de mois de l'année ; chaque `planningmonth` d'une affaire filtrée avec `TIMEYEAR = année` alimente sa colonne : contrat += plContrat ; scheduled += SCHEDULEDAMOUNT ; subPlanner += SUBPLANNERAMOUNT ; subContractor += SUBCONTRACTORAMOUNT ; amended += AMENDEDAMOUNT ; settled += SETTLEDAMOUNT ; planned += plTotalInterne(pm) ; **plannedStaff** : pour chaque part, chaque attribution : `rateAt(collaborateur, 1er du mois) × TIMEPERIOD`, cumulé sur tous les mois de la colonne — **correction de deux défauts de l'original** (date prise avec MONTH = année, `@96-121` ; heures de toute la catégorie et remise à zéro par mois, `@91-93, @220-237`), à commenter dans le code.
- Dérivés : attendu = scheduled + subPlanner + subContractor + amended ; **solde = settled − attendu** (signe inverse de la Marge).

| # | Libellé | Valeur | Surligné + gras |
|---|---|---|---|
| 0 | Situations (titre) | — | |
| 1 | Contrats et avenants | contrat | oui |
| 2 | Encaissements planifiés | scheduled | |
| 3 | Encaissements planifiés pour sous-planificateurs | subPlanner | |
| 4 | Encaissements planifiés pour sous-traitants | subContractor | |
| 5 | Ajustements | amended | |
| 6 | Encaissements planifiés | attendu | oui |
| 7 | Encaissements | settled | oui |
| 8 | Encaissements (-) encaissements planifiés | 7 − 6 | oui |
| 9 | (vide) | | |
| 10 | Coûts selon planification par catégorie d'honoraires (titre) | | |
| 11 | Coûts selon les catégories d'honoraires | planned | oui |
| 12 | Différence avec la situation | 11 − 6 | |
| 13 | (vide) | | |
| 14 | Coûts selon la planification des collaborateurs (titre) | | |
| 15 | Coût de revient | plannedStaff | oui |
| 16 | Différence avec la situation | 15 − 6 | |
| 17 | Différence avec les coûts selon les catégories d'honoraires | 15 − 11 | |

  Unité CHF (vide sur titres et lignes vides). Aucune couleur. Graphique : courbes, X = 12 mois, Y « CHF », titre « Encaissements et coût de revient », 5 séries : lignes 6, 7, 8, 11, 15. Impression §7.2.

### 5.5 Domaine 3 — Disponibilité (`PlanningAnalyzeAssignmentTableModel(year)`)
- **Tous** les collaborateurs (sans filtre), leurs `staffprojecttime` de l'année : `staffTimeBudget += TIMEBUDGET` ; `staffAssignedTime += sptAttribue` ; **toutes** les `planningmonth` de l'année (sans filtre d'affaire ni d'état) : `timeHour += TIMEHOUR` ; par part `plannedTimeHour += plHeures(pt)` ; `assignedTimeHour += plAssHeures(pt)`. Colonnes initialisées à 0 → **0.00 partout**, jamais vide.

| # | Libellé | Valeur | Unité | Surligné | Gras |
|---|---|---|---|---|---|
| 0 | Utilisation de collaborateurs | — | — | oui | oui |
| 1 | Heures disponibles des collaborateurs | Σ TIMEBUDGET | h | | oui |
| 2 | Attribuées | Σ sptAttribue | h | | |
| 3 | Non attribuées | 1 − 2 | h | oui | oui |
| 4 | (vide) | | | | |
| 5 | Solde du temps disponible | — | — | oui | oui |
| 6 | Budget horaire de l'affaire | Σ TIMEHOUR | h | | oui |
| 7 | Heures par catégorie d'honoraires | Σ plHeures | h | | |
| 8 | Heures attribuées aux collaborateurs | Σ plAssHeures | h | | |
| 9 | Heures non attribuées | 7 − 8 | h | oui | oui |

- Couleurs : lignes 3 et 9, colonnes mois **et** Total : **rouge si > 10.0** (constante codée, pas le SETTING) ; jamais vert. Graphiques en **aires**, axe Y « h » : Chart1 « Heures disponibles des collaborateurs » (lignes 1, 2, 3), Chart2 « Heures attribuées » (lignes 6, 7, 8, 9). Pas d'impression. Manuel DE p. 44 (§9.8).

### 5.6 Domaine 4 — Occupation (`PlanningAnalyzeStaffCostTableModel(year)`)
- Tous les collaborateurs ; par `staffprojecttime` de l'année : `taux = rateAt(staff, 1er du mois)` (correct ici) ; budget += TIMEBUDGET ; attribué += sptAttribue ; coût += TIMEBUDGET × taux ; coûtAttribué += sptAttribue × taux. Par colonne : f = plFacteur(année, mois) ; coûtFI = coût × f/100 ; coûtAttribuéFI = coûtAttribué × f/100.

| # | Libellé | Valeur | Unité | Surligné | Gras |
|---|---|---|---|---|---|
| 0 | Heures disponibles des collaborateurs | budget | h | | oui |
| 1 | Attribuées | attribué | h | | |
| 2 | Non attribuées | 0 − 1 | h | oui | oui |
| 3 | (vide) | | | | |
| 4 | Coût de revient attribué (+) non attribué | coût | CHF | | oui |
| 5 | Frais internes | coûtFI | CHF | | |
| 6 | Coût de revient attribué (+) non attribué (+) frais internes | 4 + 5 | CHF | oui | oui |
| 7 | (vide) | | | | |
| 8 | Coût de revient attribué | coûtAttribué | CHF | | oui |
| 9 | Frais internes | coûtAttribuéFI | CHF | | |
| 10 | Coût de revient attribué (+) frais internes | 8 + 9 | CHF | oui | oui |
| 11 | (vide) | | | | |
| 12 | Coût de revient non attribué | 4 − 8 | CHF | | oui |
| 13 | Frais internes | 5 − 9 | CHF | | |
| 14 | Coût de revient non attribué (+) frais internes | 6 − 10 | CHF | oui | oui |

- Aucune couleur. Graphiques en barres : Chart1 « Disponibilité et charge de travail » (Y « h », lignes 0, 1, 2), Chart2 « Coût de revient » (Y « CHF », lignes 6, 10, 14). Pas d'impression.

### 5.7 Domaine 5 — Rapport mensuel collaborateur (`PlanningAnalyzeStaffProjectTimeTableModel(y, m)`)
- Pour chaque collaborateur (tous) : taux = rateAt au 1er du mois ; spt du mois : si présent → ligne (budget = TIMEBUDGET ; coût = TIMEBUDGET × taux ; FI = coût × plFacteur(y,m)/100 ; attribuées = sptAttribue) ; sinon **si actif** → ligne à zéros ; les anciens sans saisie sont omis. Tri par nom entité, puis ligne **Total** (seule surlignée + grasse).
- 8 colonnes : « Collaborateur » · « Disponibilité [h] » · « Coût de revient [CHF] » · « Frais internes [CHF] » · « Coût de revient (+) frais internes [CHF] » · « Heures attribuées [h] » · « Heures non attribuées [h] » (= budget − attribuées) · « Attribuées aux affaires [%] » (= budget ≠ 0 ? 100 × attribuées / budget : 0). Aucune couleur. Graphique : barres empilées, X = collaborateurs (sans Total), Y « h », titre « Occupation », séries « Heures attribuées » / « Heures non attribuées ». Sélecteur de mois visible ; pas d'impression.

### 5.8 Domaine 6 — Attribution de l'affaire (`PlanningProjectAssignmentFrame`)
- Gauche : Filtre ▾ (« Appliquer le filtre » actif si critères, —, « Editer le filtre… » (`mgPFdialog`, l. 2094), —, « Annuler la sélection ») + étiquette (`ProjectFilter.getDesc` : nom de l'état ou « Filtré ») ; **liste des affaires** (« Numéro », « Affaire », tri mémorisé, dernière affaire resélectionnée) ; en dessous **table des ouvrages** (« ● » si planification, « Ouvrage » ; ligne 0 « Pas d'ouvrage »). Droite : outils / tableau.
- Outils : « Mois de départ » + champ + ▾ (12 mois) ; ◀ année ▶ ; type d'affichage ▾ (radios « Heures réparties par catégorie » / « Coût de revient » ; étiquette « <nom> [h] » ou « <nom> [<monnaie>] ») ; ☐ « Détails » ; « Appliquer » (actif si une affaire est sélectionnée) ; Rapports ▾ (« Afficher le rapport… » si lignes) ; Roue ▾. Défauts : mois de départ = mois précédent ; filtre En cours. Préférences `planningProjectAssignmentFrame.Preferences` → `ds_mgp_pa`.
- Modèle (`generateProjectReport@0-1389`) : **4 colonnes de mois** à partir du départ (« janv. 2026 »), « Désignation » + 4 mois, sans Total. Données seulement si l'affaire a une `planningsubproject` pour l'ouvrage choisi (null = sans ouvrage), sinon tableau vide. Phases : `null` (« Pas de phase partielle ») puis toutes les phases partielles ; par phase : ligne `<NUMBER> <NAME>` ; pour chaque `planningmonth` (même ouvrage, même phase, mois dans la fenêtre) : valeur = TIMEHOUR (heures) ou plTotalInterne(pm) (coût) ; par catégorie (`planningrole` de la planification, **par ID croissant**) : ligne = plHeures(pt) ou plMontantInterne(pt) ; par attribution : sous-ligne par collaborateur (ID croissant, nom entité) = TIMEPERIOD ou TIMEPERIOD × `rateAt(staff, 1er du mois)` (correction du défaut de date de l'original) ; **cumuler** si deux attributions du même collaborateur dans une même part (l'original écrase, `@643-721`).
- Lignes produites (ligne vide entre deux phases) : 1) « <N> <phase> » `tableLevel1`, gras + surligné ; 2) par catégorie : « <catégorie> » (`tableLevel2` si Détails, sinon `tableRow`) ; si Détails : gras + surligné niveau 2, puis « ␣␣<collaborateur> » (`tableRow`), « Total <catégorie> » (`tableLevel2Total`) = Σ collaborateurs, « Non attribuées » (`tableLevel2Total`) = catégorie − Σ ; 3) « Total <phase> » (`tableLevel1Total`) = Σ catégories ; « Non attribuées » (`tableLevel1Total`) = phase − Σ catégories. Additions/soustractions seulement si les deux valeurs sont non nulles. **Aucune couleur** (`coloredRowList` jamais rempli). Impression §7.3.

### 5.9 Domaine 7 — Attribution des collaborateurs (`PlanningStaffAssignmentFrame`)
- Gauche : Filtre ▾ (cases « Tous les collaborateurs », « Collaborateurs actuels » (défaut), « Anciens collaborateurs », —, « Annuler la sélection ») + étiquette « Filtré » (si ≠ tous) ; **table des collaborateurs** (colonne « Collaborateur », **sélection multiple**, tri `Staff.compareTo` [D SORTORDER puis nom]). Droite : « Mois de départ » + ▾ ; ◀ année ▶ ; ☐ « Détails » ; « Appliquer » (**toujours actif**) ; Rapports ▾ ; Roue ▾. Collaborateurs analysés = sélection, ou **toutes les lignes** si aucune sélection.
- Modèle (`generateStaffReport@0-1320`) : 4 mois ; par collaborateur : pour chacun des 4 mois, spt = `staffprojecttime(an, mois)` ; si présent : « Disponibilité [h] » = **`sptDisponible(spt)`** (heures prévues − 6 déductions, **pas** TIMEBUDGET — différence avec Heures ▸ Disponibilité, spec_6 §3.2) ; sinon cellule null. Par attribution du spt : affaire via part → catégorie → planification → `PROJECT.TITLE` (par ID croissant) += TIMEPERIOD ; phase via part → `planningmonth.SUBPHASE_ID` (clé −1 « Pas de phase partielle » ou ID, libellé `<N> <nom>`) += TIMEPERIOD.
- Lignes (ligne vide entre collaborateurs) : « <collaborateur> » (`tableLevel1`, sans valeurs, gras + surligné) ; « Disponibilité [h] » (`tableLevel1Total`) ; par affaire « <titre> » (`tableLevel2` si Détails, sinon `tableRow`) = Σ, avec, si Détails, « ␣␣<N> <phase> » (`tableRow`) ; « Heures planifiées [h] » (`tableLevel1Total`, gras + surligné) = Σ affaires ; « Solde disponible [h] » (`tableLevel1Total`, surligné, **colorée**) = disponibilité − Σ (null si disponibilité null). Puis, si la liste n'est pas vide : ligne vide ; « Total des collaborateurs sélectionnés » (`tableLevel1`, gras + surligné) ; « Disponibilité [h] », « Heures planifiées [h] », « Solde disponible [h] » (sommes, surlignées, colorées).
- Couleurs : > 0 vert, < 0 rouge, 0 sans couleur, **sur les 4 mois** (l'original oublie le 4e, boucle `< colonnes − 1` : ne pas reproduire, comme spec_6). Impression §7.4.

### 5.10 Défauts de l'original et choix
| # | Défaut [P] | Choix DeltaSub |
|---|---|---|
| 1 | Taux de collaborateur à `Calendar(YEAR=an, MONTH=an, DAY=1)` (Encaissements, Attribution de l'affaire) ⇒ toujours le dernier tarif | `rateAt` au 1er du mois planifié ; commentaire |
| 2 | Encaissements ▸ « Coût de revient » : `RATE × plHeures(pt)` par attribution et remise à 0 par mois | Σ TIMEPERIOD × taux, cumulé ; commentaire |
| 3 | 4e mois jamais coloré (Attribution des collaborateurs) | colorer les 4 |
| 4 | Seuil rouge « Non attribuées » codé 10.0 | reproduire (10 h) |
| 5 | Écrasement au lieu de cumul (deux attributions même collaborateur, même part) | cumuler ; commentaire |
| 6 | `coloredRowList` vide (Attribution de l'affaire) | reproduire (aucune couleur) |
| 7 | Division par zéro du taux pondéré | 0 |

---

## 6. MANAGEMENT ▸ Reporting (DELTAreport, `TimeReportFrame`) — lot A (vue `mg-reporting` existante, l. 2403-2486)

### 6.1 Structure [P]
- Table gauche **« Catégorie »** : 1 Chiffres-clés, 2 Collaborateurs, 3 Heures supplémentaires, 4 Collaborateurs-affaires, 5 Comparaison années ; dernier choix mémorisé (`lastTimeReportMenuSelection` → `ds_mg_reporting`). Un `ActivityReportFrame` par catégorie, chacun avec son année (défaut année courante), son modèle et son type de graphique (défaut Courbes).
- Filtres, défauts `TimeReportFrame.<init>` : affaires internes = TRUE, état = En cours, collaborateurs = actuels pour **les deux** listes (`staffListKindFilter1`, `…2`, indépendants). Étiquette « Filtré ».
  - Variante A (1, 2, 3) : Filtre ▾ (« Tous les collaborateurs », « Collaborateurs actuels », « Anciens collaborateurs », —, « Annuler la sélection » actif si sélection) + liste 2 « Collaborateur ».
  - Variante B (4, 5) : liste 1 « Collaborateur » + liste d'affaires « Numéro | Affaire » ; Filtre ▾ = sous-menu « Filtre Collaborateurs » (3 cases), sous-menu « Filtre Affaires » (« Afficher tout » / « Affaire internes » / « Affaire externes », —, « Afficher tout » / Configuration / En cours / En attente / Terminée / Archivée), —, « Annuler la sélection » (actif si affaire ou collaborateur sélectionné).
  - Listes de collaborateurs : `findActual` = `ISACTIVE ≠ 0 ORDER BY SORTORDER`, `findFormer`, `findAll` — **tri SORTORDER**. Aucune sélection = tout.
- Barre : ◀ année ▶ (recalcul immédiat), bouton icône `Dashboard` ▾ (**Comparaison seulement**, sans libellé) = « Comparer 2 ans », « Comparer 3 ans », « Comparer 5 ans », « Comparer 10 ans », —, « Année de référence <année> » (défaut 5 et cochée ; **non persistés**, `storePreferences` vide) ; Rapports ▾ (« Afficher le rapport… » actif si lignes ; « Afficher le rapport… [Ancien document] » si anciens formulaires activés ; « Enregistrer le diagramme » image) ; Roue ▾.
- Graphique : bouton ▾ (modèles), **étiquette du modèle choisi**, étiquette « Mois » (« Années » pour Comparaison), radios Courbes / Barres / Barres empilées ; étiquette « Total » au-dessus du radio « Secteurs », **Chiffres-clés seulement** ; si le modèle interdit les barres, radios désactivées et Courbes recliqué. Rendu : `ReportCellRenderer(false)`, gras, surlignage de lignes et de colonnes ; **jamais de vert/rouge** (aucun `colorizeColumns`). Noms de mois **complets** en colonnes (`getMonthName`), courts à l'impression.

### 6.2 Moteur `ActivityYear` [P]
Par TIMELOG : `ISHOLIDAY` → vacances (+ grandTotal) ; sinon activité null → **ignoré** ; sinon `TYPECODE` → type et catégorie : 0 Affaires, 1 Etudes → **Heures facturables** ; 50 Travaux de bureau, 51 Formation continue, 52 Direction, 53 Concours, 54 Acquisition, 55 Conseil d'administration → **Heures non facturables** ; 90 Absences justifiées (mariage, naissance, …), 91 Maladie, accident, maternité, 92 Militaire, service civil, 93 Formation, apprentis → **Heures d'absences** ; subTotal = hors absences (et hors vacances) ; grandTotal = tout.
`setStaffTargetTime` (si STAFFTARGETTIME de l'année existe, **sans repli**) par mois : target = TARGETHOURSm ; grand = grandTotal ; saldo1 = grand − target ; ratio1 = target = 0 ? 0 : grand/target ; overtime = OVERTIMEm (série « Heures d'appoint » seulement si un mois > 0) ; saldo2 = saldo1 − overtime ; ratio2 = (target+overtime) = 0 ? 0 : grand/(target+overtime). Pourcentages `calcPercentage(v,t) = t = 0 ? 0 : v/t`, total annuel = ratio des totaux ; affichage `round(v × 100)` pour les lignes « % ».

### 6.3 Catégories
- **Chiffres-clés** : colonnes « Type d'activité » | janvier … décembre | « Année » ; 15 lignes : Heures facturables ; Heures non facturables ; **Heures de présence** ; % Heures facturables ; % Heures non facturables ; (vide) ; Heures facturables ; Heures non facturables ; Heures d'absences ; Heures de vacances ; **Total des heures** ; % (4 lignes) sur le total. Modèles de graphique = les deux totaux (n = 2 et 4 valeurs) ; Courbes = valeurs + total ; Barres = sans total ; Secteurs = les lignes % (colonne Année). Axe X : **13 catégories** (12 mois + « Année » sans point), Y « Heures [h] », titre « <modèle>, <année> ».
- **Collaborateurs** : 23 lignes (12 types dans l'ordre, sous-total par catégorie + ligne vide, récapitulatif 3 catégories + Heures de vacances + Total des heures) ; si STAFFTARGETTIME : (vide), « Total des heures » (valeur), **« Heures prévues » (ligne valeur, ni gras ni gris)**, « Solde » (total, saldo1), « % » (ratio1) ; si appoint : « Heures d'appoint » (valeur), « Solde des heures à effectuer y.c. heures d'appoint » (total), « % ». Modèles : Heures facturables (2), non facturables (6), absences (4), Total des heures (4), **Solde (n = 2 : Total des heures, Heures prévues, Solde)**, **Solde y.c. appoint (n = 1 : Heures d'appoint, Solde y.c.)**, barres désactivées pour les deux soldes ; pas de Secteurs.
- **Heures supplémentaires** : tableau vide sans collaborateur ; colonnes « Collaborateur » | 12 mois | « Total » ; Heures prévues (TARGETHOURS, 0 sans STT) ; Heures effectives (Σ TIMEPERIOD **tout compris**) ; Solde des heures ; **Solde des heures cumulées de l'année** (gras, non surligné) ; « Solde + prise en compte du report des heures suppl. » = cumul + TARGETTIMEREDUCTION, **seulement si R ≠ 0**, gras. Total = Σ 12 mois pour 1-3, **valeur de décembre** pour 4-5. Graphiques : un modèle par ligne grasse, une série, barres désactivées, 12 mois.
- **Collaborateurs-affaires** : lignes 1-23 de Collaborateurs, jamais le bloc heures prévues ; filtre affaires (défaut internes + En cours ⇒ **liste vide au bureau**, 1 seule affaire interne, terminée).
- **Comparaison années** : colonnes « Type d'activité » puis par année `<année>` | « +/- » (N colonnes, années décroissantes, années vides affichées) ; colonne de l'année choisie surlignée si référence cochée ; 23 lignes : 12 types avec sous-total + **une** ligne vide par catégorie, puis Heures facturables / non facturables / d'absences (non gras), « Vacances », « Total général » (gras) ; « +/- » = valeur(i) − valeur(réf.) en **heures**, réf. = colonne 0 si référence cochée ou i = 0, sinon i − 1 ; aucune couleur. Modèles : 3 sous-totaux + Total général (n = 4), titre = nom seul, axe « Années ».

### 6.4 Impression et export [P dpdoc, `AY.fillTable`]
Cinq `.dpdoc` (jeu 0, fr) : `managementTimeReportKeyFigures` « Analyse du temps de travail : chiffres-clés », `…Staff` « Analyse du temps de travail », `…TimeBalance` « … : heures supplémentaires », `…Year` « … : vue d'ensemble de l'année », `…Compare` « … : comparaison sur plusieurs années ». Structure §7.6. Lignes grasses → `tableLevel1` avec remise à zéro de l'alternance ; valeurs « % » × 100. Export presse-papier / CSV ; « Enregistrer le diagramme » = image.
**Ancien document** (`list.Timereport`) : modèles `managementTemplates/{Default,Standard}/managementTimeReportStaff` (« Heures-Collaborateurs ») et `…Summary` (« Bureau ») ; page de garde : Titre, Date, Année/Période, Nom, Total heures effectives, Total heures prévues, Solde, Heures d'appoint, Heures prévues − heures d'appoint, Solde de vacances, Solde actuel de vacances ; paramètres `TimereportPreferencesDialog` (titre défaut « Statistiques des heures de travail », police, interligne, fond alterné, répartition des colonnes). Priorité basse : uniquement si Paulo l'utilise.

### 6.5 Données du bureau [P CSV]
TIMELOG 37 622 (2021→2026 : 2 449 / 6 260 / 6 306 / 6 987 / 8 753 / 6 746) ; 789 lignes ISHOLIDAY = 1 = les 789 lignes sans ACTIVITY_ID ; TYPECODE présents : 0, 50, 54, 90, 91, 92, 93 (types 1, 51, 52, 53, 55 à 0.00) ; STAFF 13 (5 actifs, SORTORDER présent) ; STAFFTARGETTIME 47, **aucun OVERTIME > 0** (lignes « appoint » jamais visibles), 21 couples avec TARGETTIMEREDUCTION ≠ 0 ; PROJECT 111 (états 1:1, 2:46, 3:4, 4:36, 5:24 ; 1 interne). Valeurs de contrôle §9.9.

### 6.6 TABLEAU DES ÉCARTS avec la vue DeltaSub existante (à corriger, par gravité)

| # | Écart | DeltaSub (ligne) | Original [P] | Correction |
|---|---|---|---|---|
| 1 | « Heures prévues » en gras + gris | 2453 `row('Heures prévues',TY,{b:1,lv:1})` | ligne valeur simple (`getReport@762-781`, ajoutée par `add`, pas `insertTotalRow`) | retirer `{b:1,lv:1}` (écran et impression `tableRow`) |
| 2 | Séries des modèles « Solde » | 2454 `series:[Solde]` ; 2456 `[Solde y.c.]` | « Solde » : Total des heures, Heures prévues, Solde ; « Solde y.c. appoint » : Heures d'appoint, Solde y.c. (`getChartModels@87-118`) | compléter les séries ; `noBar` conservé |
| 3 | Deux lignes vides consécutives en Comparaison | 2433 `M.rows.push({c:[],sp:1})` après la boucle | une seule ligne vide (`AR.getReport@486-525`) : 23 lignes | supprimer ce push |
| 4 | « +/- » colorée vert/rouge | 2429 `col:'sign'` | aucune couleur dans Reporting | retirer `col:'sign'` |
| 5 | Colonne « Année » des lignes « % » du bloc heures prévues | 2453 : ratio des totaux | Σ des 12 ratios × 100 (défaut, §0.2 n° 10) | **garder DeltaSub**, écart volontaire à noter dans le code et spec_8 §11 |
| 6 | Axe X des graphiques mensuels | `M.xs = MOIS_L` (12) | 13 catégories (+ « Année » sans point) pour Chiffres-clés, Collaborateurs, Collaborateurs-affaires ; 12 pour Heures supplémentaires ; années pour Comparaison | ajouter la catégorie vide « Année » |
| 7 | Tri des listes de collaborateurs | 2415 `mgrStaffs` par nom | `ORDER BY SORTORDER` | trier par `SORTORDER` puis nom |
| 8 | Persistance N / « Année de référence » | 2404-2405 `ds_mg_rep` | non persistés (5, cochée à chaque ouverture) | retirer (facultatif, fidélité) |
| 9 | Filtre collaborateurs unique `MGR.sf` | 2403 | deux filtres indépendants (listes 1 et 2) | `sf1` / `sf2` |
| 10 | « Annuler la sélection » efface s1, s2 et pl | 2466 `clear` | variante A : liste 2 seulement ; B : liste 1 + affaire [D pour l'effacement, P pour l'activation] | limiter à la variante affichée |
| 11 | Étiquette du modèle choisi absente | 2481 | `jChartTitleLabel` à côté du bouton | ajouter |
| 12 | « Total : Secteurs » sur une ligne | 2481 | étiquette « Total » au-dessus du radio « Secteurs » | cosmétique |
| 13 | Bouton « Tableau de bord » avec libellé | 2476 `t:'Tableau de bord'` | icône `Dashboard` sans texte (§1.3) | garder l'icône, info-bulle « Comparer » |
| 14 | « Enregistrer le diagramme » en SVG | 2123 `mgSaveChart` | image (PNG) | optionnel : rasteriser via canvas |
| 15 | TYPECODE hors des 12 comptés par seuil | 2409 `rpYear` | NPE dans l'original | garder, documenter (aucun cas au bureau) |
| 16 | Ancien document absent | — | « Afficher le rapport… [Ancien document] » | basse priorité (§6.4) |
| 17 | Message « Sélectionnez un collaborateur. » | 2420 | tableau vide sans message | garder (amélioration) |

Aucun écart sur les formules (moteur, cumuls, +/-, ratios), ni sur les libellés FR des lignes, colonnes et menus [P relecture ligne à ligne 2403-2486].

---

## 7. Impressions (`.dpdoc` du bureau, `modeles.json`, langue fr) [P]

Moteur : `mgPrint(type, title, fields, tables, M)` (l. 2010) lit `DS.T.modeledocument['0/'+type+'-fr.dpdoc']`, rend les bandes `GridBand` / `TextBand` / `LineBand` / `TableBand` (avec `FlexColumn` étendue par `tables._flex`), pied `appUser` | `page | pages`, repli `mgPrintHTML`. À étendre : (a) chercher `'1/'+type` puis `'2/'+type` si `'0/'` est absent (`projectPlanningAnalyzeProfitReport`) ; (b) style `tableLevel2Total` / `tableLevel1Total` distincts de `tot` ; (c) une ligne de données non numérique (« Mois », « Unité ») passe telle quelle ; (d) polices `small`/`smallBold` (Analyse 2). Bordure de bande `bc = −6250336` = `#A0A0A0`, `ls 0.25`.

| Document | Page | Titre (bande « Titre ») | Bande Informations (col. 1 gras / col. 2) | Tableau (colonnes, largeur, alignement) | Remplissage |
|---|---|---|---|---|---|
| 7.1 `managementPlanningAnalyzeProfitReport` | A4 paysage 297×210, marges g15 d15 h25 b20 | « Marge bénéficiaire » | 50 % `{reportTitle}` / 70 % droite « Mois de référence {referenceMonth} » ; Informations 30/70 : « Date » `{date}` (long), « Mois de référence » `{referenceMonth}` = « <mois long> <année> » | Désignation 40 g · **Total contrats et avenants** 20 d · **Budget total** 20 d · **Effort total** 20 d · **Profit/Perte** 20 d · **Marge bénéficiaire** 20 d · **Degré de réalis. selon la gestion d'affaire** 20 d (noms personnalisés du bureau, différents des défauts du code « Contrats et avenants / Budget d'honoraires / Effort accompli+prévu / Marge bénéficiaire CHF / Marge bénéficiaire % / Taux de réalisation… ») ; `isS` alterné | ligne 1 « Unité, CHF, CHF, CHF, CHF, %, % » ; **une ligne par affaire** (contrat, budget, effort, marge, marge%, τ) ; ligne « Total » (`addTotalRow` : sommes, marge% totale, τ vide) — tableau **transposé** par rapport à l'écran |
| 7.2 `managementPlanningAnalyzeBudgetReport` | A4 paysage, mêmes marges | **« Paiements »** (titre du dpdoc FR du bureau) | 50/40 : `{reportTitle}` / « Année {year} » ; Informations 15/70 : « Date », « Année » `{year}` | Désignation 40 g · janv. … déc. 15 d (12) · Total 20 d · (en-tête vide) 10 g | les **18 lignes** (titres et vides comprises, valeurs vides) ; lignes surlignées en `tableTotal` + remise à zéro de l'alternance |
| 7.3 `managementPlanningProjectAssignmentReport` | A4 portrait 210×297, marges g25 d15 h25 b20 | « Attribution des collaborateurs » | 50 % `{reportTitle}` ; Informations 25/70 : « Affaire » `{project}` (`projectNumberAndTitle`), « Date », « Ouvrage » `{subProjectFilterDesc}` (« Pas d'ouvrage » ou ouvrage) ; champs `year`/`month` disponibles non placés | « Attribution des collaborateurs » : Désignation 40 g · `FlexColumn` 20 → 4 sous-colonnes de 15 (droite, en-têtes = mois « janv. 2026 ») ; `isS`, `isHV` | styles par type de ligne : `tableRow`, `tableLevel1`, `tableLevel1Total`, `tableLevel2`, `tableLevel2Total` ; espace minimal avant niveaux 1 et 2 ; nombres 2 décimales, null → vide ; alternance remise à zéro après une ligne non `tableRow` |
| 7.4 `managementPlanningStaffAssignmentReport` | A4 portrait, idem | « Attribution des collaborateurs » | Informations 25/70 : « Date », « Mois de départ » `{month} {year}` | idem 7.3 | idem, lignes vides omises |
| 7.5 `projectPlanningAnalyzeProfitReport` (jeux **1 et 2**, identiques ; pas de `0/`) | A4 portrait, marges g25 d15 h25 b20 | « Marge bénéficiaire » | 50/40 : `{reportTitle}` / `{referenceMonth}` droite ; Informations 25/70 en `smallBold`/`small` : « Date », « Affaire » `{project}` (`projectNumberAndTitle`), « Ouvrage » `{subProjectFilterDesc}`, « Phase partielle » `{subPhaseFilterDesc}`, « Mois de référence » `{referenceMonth}` | Désignation 40 g · **Mois précédent** 20 d · **Mois de référence** 25 d · **Mois prochain** 25 d · Total 25 d · Unité 15 g (le code propose « Mois suivant » et 40/20/20/20/20/15 : suivre le fichier) | en-tête `tableHeader` ; première ligne « **Mois** » = libellés des 3 colonnes (vides si absentes) + libellé du **dernier mois planifié** sous Total ; puis les 18 lignes de §4.3 (nom, 3 valeurs, total, unité) ; lignes surlignées → `tableLevel1` ; sélection des 3 mois : colonne du mois de référence → [précédente, référence, suivante], complété par null ; si le mois de référence n'est pas une colonne, 3 cellules vides [D] |
| 7.6 `managementTimeReport{KeyFigures,Staff,TimeBalance,Year,Compare}` | « A4 Paysage marge latérale étroite » 297×210, marges g10 d10 h25 b20 | KeyFigures « Analyse du temps de travail : chiffres-clés » ; Staff « Analyse du temps de travail » ; TimeBalance « … : heures supplémentaires » ; Year « … : vue d'ensemble de l'année » ; Compare « … : comparaison sur plusieurs années » | Informations 25 ou 30/70 : « Date », « Année » `{year}`, « Collaborateur » `{person}` (+ « Affaire » `{project}` pour Year et Compare) | KeyFigures/Staff/Year : « Type d'activité » 30 g · janv. … déc. 18 d · « Année » 18 d ; TimeBalance : « Collaborateur » 30 g · 12 mois · « Total » 18 d ; Compare : « Type d'activité » 40 g · `FlexColumn` 20 (années et « +/- ») ; `isS`, `isHV` | en-tête `tableHeader`, lignes `tableRow`, lignes grasses `tableLevel1` avec remise à zéro de l'alternance ; valeurs « % » × 100 ; déjà câblé dans DeltaSub (`MGR_DOC`, `print`, l. 2458-2470) |

En-tête de page commun (modèle de page) : 3 cellules (logo image 57 × 15 mm à gauche / vide / vide, filet bas) ; pied : utilisateur à gauche, date au centre, « Page n | N » à droite (reproduit par `@page` dans `mgPrint`).

Aucune impression dans le domaine de saisie (§3), ni dans les Analyses 1, 3-6, ni dans Disponibilité / Occupation / Rapport mensuel (export tableau et « Enregistrer le diagramme » seulement) [P].

---

## 8. Plan par lots et points d'ancrage DeltaSub

### 8.1 Lots (livrables et testables)

| Lot | Contenu | Dépend de | Test d'acceptation |
|---|---|---|---|
| **A — Reporting DELTAreport** (petit, données disponibles) | les 17 corrections du §6.6 (au minimum 1-7, 9-11, 13) ; constante `MOIS_C` ; catégorie « Année » sur l'axe X ; documentation des écarts volontaires (5, 15, 17) | rien | Chiffres-clés 2025 = §9.9 ; Collaborateurs : « Heures prévues » en `tableRow` ; Comparaison 2026 N=5 = 23 lignes, +/- de §9.9, sans couleur |
| **B0 — Socle PLANNING*** | collections `planning*` (déjà importées vides), module `pl*` (§2.3-2.4), `plAssProject(a)` (chaîne part → catégorie → planification → affaire, extraite de `dpModel` l. 1860-1868), cascades `delProject` (§2.2), modes `Aires` et empilé de `mgChart`, `mgPrint` jeux 1/2 + styles `tableLevel2Total` | rien | tests unitaires des formules sur le jeu du manuel (§9.1-9.5) |
| **B — Domaine « Planification RH »** | §3 complet : DOMAINS + `plDomain`, grille 5 types, référentiels (catégories modèles, facteur daté, textes types, seuil), planification par ouvrage, période (création, ±1 mois, suppression), étapes 1-6, planification des ressources, « Heures disponibles » | B0 ; spec_9 lot contrats pour le contrat informatif, le menu ContractInfo et les suggestions de montants (à défaut : bouton « > » et ▾ désactivés) ; Heures ▸ Disponibilité existant pour l'étape 3 | ressaisir l'exemple du manuel (§9.1-9.5) et retrouver les valeurs au centime ; refus/messages de §3.4 ; re-liaison des attributions au déplacement |
| **D — MANAGEMENT ▸ Planification RH** | D1 Marge bénéficiaire + impression 7.1 ; D2 Attribution des collaborateurs + impression 7.4 (seul domaine avec valeurs au bureau) ; D3 Encaissements + graphique + impression 7.2 ; D4 Disponibilité, D5 Occupation, D6 Rapport mensuel ; D7 Attribution de l'affaire + impression 7.3 | B0 (tous) ; B (valeurs non nulles) ; `mgPF`/`mgPFdialog` existants ; `dpSpt`, `dpCalc`, `rateAt` | §9.7, §9.8, §9.10 ; avec B : rapport « Marge bénéficiaire » = valeurs du manuel DE p. 44 |
| **C — Domaine « Analyse de planification RH »** | C1 page des tuiles + filtres ; C2 Analyse 1 (tableau de bord par affaire) ; C3 Analyse 2 + impression 7.5 ; C4 Analyse 3 ; C5 Analyse 4 ; C6 Analyse 5 ; C7 Analyse 6 | B0, B (pour des valeurs non nulles) ; `mgChart` étendu | §9.6 (Projektstand) ; τ = 0 sans planification (pas de NaN) |

Ordre recommandé : A → B0 → B (étapes 1, période, 2, 3 d'abord ; 4-6 et ressources ensuite) → D1, D2 → C1, C2, C3 → D3-D7 → C4-C7. Facturable dès A ; B0 + D2 visibles immédiatement avec les 24 `staffprojecttime`.

### 8.2 Points d'ancrage (`DeltaSub.html` @ b42db0d)

| Besoin | Existant (ligne) | À faire |
|---|---|---|
| NAV | `NAV` l. 337-348 (Management l. 346) | insérer `['mg-planning','Planification RH']` (§1.4) |
| Domaines d'affaire | `DOMAINS` l. 1474 ; `domainUsed` l. 1495 ; `domainView` l. 1499 (branches `d==='Contrats honoraires'` → `ctDomain`, `'Avancement des prestations'` → `imDomain`) | ajouter les deux libellés et `plDomain` / `paDomain` |
| Fenêtre à catégories | `mgCatView(id,cats,paneFn,w)` l. 2057 (en-tête « Catégorie », `ds_mg_<id>`) | paramètre d'en-tête « Domaine » |
| Barre d'outils, menus, dialogues, grilles | `setTools` 257, `ibtn` 252, `popMenu` 260, `dialog` 272, `confirmDlg` 285, `grid` 290, `phead` 323, `col` 332 | `ConfirmationCheckedDialog` (case à cocher obligatoire) à créer sur `dialog` |
| Copier / CSV / roue | `copyTable` 748, `csvTable` 749, `mgGear` 2006 | — |
| Nombres | `num` 144, `rJ` 1982 | — |
| Filtre d'affaires | `mgPF` 2088, `mgPFdialog` 2094, `PSTATE` 1113, `pIsActive` 1983 | menu simplifié « Afficher tout + états » pour Encaissements |
| Tarif | `rateAt(staffId,dateIso)` 970 | — |
| Disponibilités | `dpTarget` 1844, `dpCalc` 1846, `dpSpt` 1847, `dpModel` 1850 (`assOf` 1860) | extraire `plAssProject` |
| Contrainte spt attribué | l. 1031 | — |
| Suppression d'affaire | `delProject` l. 1184-1193 | cascades `planning*` |
| Suppression d'ouvrage | l. 1343 | refus si planifié |
| Contrat lié | `ctBlocked` l. 3945 | — |
| Graphiques | `mgChart` 2105 (Courbes / Barres / Barres empilées / Secteurs), `MG_COL` 2104, `mgSaveChart` 2123 | modes `Aires`, empilé multi-catégories, étiquettes −90° ; PNG optionnel |
| Impression | `mgPrint` 2010, `mgPrintHTML` 2048, `mgSt` 2009, `mgRowsById` 2055, `tplOr` 3572 | jeux 1/2, styles niveau 2, lignes texte |
| Rendu des tableaux | `mgRender` 2001, `mgColor` 2000 | couleurs par cellule (orange = 100 %, seuil de marge) |
| Reporting | `MGR` 2403, `MGR_CATS` 2406, `rpYear` 2409, `mgrStaffs` 2415, `mgrModel` 2416, `mgrPane` 2459, `MGR_DOC` 2458, `mgYearBar` 2125, `mgTT` 2134, `mgArr` 2135 | corrections §6.6 |
| Mois | `MOIS_L` 3492 | `MOIS_C` |
| Rafraîchissement | `VIEWS['h-dispo'].refresh` 1923 (`hit` avec `planningassignment`) | ajouter `planning*` ; nouvelles vues `refresh` |
| Textes types | à localiser (`boilerplate*`) | éditeur du groupe `planningText` |
| Serveur | `serveur_deltasub.py` : import de tous les `APP.*.csv` sauf `SKIP_TABLES` (licences) | rien (collections vides créées à la reprise ; vérifier qu'elles ne sont pas dans `HEAVY`) |

---

## 9. Valeurs de contrôle

Exemples du manuel DE (captures, recalculés au centime) et agrégats du bureau (CSV). Aucune donnée personnelle : identifiants seulement.

1. **Étape 1, avril 2022** (p. 41) : contrats 31'200.00, avenants 0, déductions 300.00 (coûts supplémentaires) → base 30'900.00 ; facteur 7 % → frais internes **2'163.00** ; budget d'honoraires **28'737.00** ; tarif 135 → suggestion q = 212.87 → budget temps saisi **213.00**. Mai : 36'200 − 300 = 35'900 ; 2'513.00 ; 33'387.00 ; budget temps resté 213.00 (stocké, non recalculé).
2. **Étape 2, 2018** (p. 41) : budget 5'952.00 / tarif 130 → budget temps 45.7846 (affiché 45.78) ; parts 10 / 10 / 80 % aux tarifs 140 / 40 / 90 → coût **4'120.62** (= 45.7846 × 90), écart au budget **−1'831.38** ; totaux sur 5 mois 29'760.00 / 228.92 h / 20'603.08 / −9'156.92 ; « Total réparti » 100.00 orange, « Différence » 0.00 vert ; **aucun facteur** appliqué (§0.2 n° 1).
3. **Étape 5** (p. 43) : contrat 6'400.00/mois, acomptes 5'960.00 → cumuls 12'800 / 11'920, situation **880.00** ; total 32'000.00 / 29'800.00, situation finale 2'200.00.
4. **Étape 3, décembre 2021** (p. 42) : part 34.00 h ; collaborateur 3 : budget 176.00, déjà attribuées 37.10, disponibles 138.90, attribuées 30.00, part **88 %**, disponibles après 108.90 ; collaborateur 6 : 92.00 / 0 / 92.00 / 4.00 / 12 % / 88.00.
5. **Ressources** (p. 42) : 8.25 h × 150 + 4.95 h × 40 + 19.80 h × 90 = 33.00 h, coût **3'217.50**, budget 4'301.25 → différence 1'083.75.
6. **Analyse 1, novembre 2021** (p. 44) : budget temps 1'304.85, heures saisies 1'375.50 → **105.41 %** ; prestations estimées 167'963.58 / budget cumulé 169'823.58 → réalisé **98.90 %** ; coût de revient (+) FI 151'303.35 ; encaissements planifiés 179'276.00.
7. **Management ▸ Marge bénéficiaire, nov. 2021** (p. 44, rapport) : affaire « Haus zum Forst » : contrat 183'560.00, budget 169'823.58, effort 151'303.35, marge **18'520.23**, **10.09 %** (orange : ≤ 10), τ 98.90 ; total 8 affaires : 1'488'820.00 / 1'361'168.46 / 1'203'940.46 / 157'228.00 / **10.56 %** ; une affaire à −19'849.54 / −21.48 % (rouge).
8. **Management ▸ Disponibilité 2021** (p. 44) : janvier : disponibles 836.95, attribuées 101.82, non attribuées **735.13** (rouge) ; totaux 9'693.75 / 1'092.26 / 8'601.49 ; budget 1'092.29 − attribuées 1'092.26 = **0.03** non attribuées.
9. **Reporting, bureau** [P CSV] : Chiffres-clés 2025 : facturables 8'550.25, non facturables 883.25, présence 9'433.50 (90.64 %), absences 332.75, vacances 1'079.50, total 10'845.75 (78.84 / 8.14 / 3.07 / 9.95 %) ; 2026 : 5'454.00 / 312.50 / 5'766.50 (94.58 %) / 86.75 / 559.50 / 6'412.75. Comparaison 2026, N = 5, référence cochée : 2026 6'412.75 (0.00) ; 2025 10'845.75 (+4'433.00) ; 2024 12'389.25 (+5'976.50) ; 2023 11'127.75 (+4'715.00) ; 2022 12'664.50 (+6'251.75). Manuel FR p. 87 (2017) : présence 1'067.00 en janvier = 628.50 + 438.50, 58.90 % ; total 1'108.65, 56.69 % ; année 12'190.90 = Total général 2017 de Comparaison années.
10. **Attribution des collaborateurs, bureau, départ juin 2023, collaborateur 2752** [P CSV] : INTERNALTIME 2023 = TARGETHOURS 2023 pour les 12 mois → « Disponibilité [h] » **0.00** sur juin-septembre, « Heures planifiées » 0.00, « Solde disponible » 0.00 (non coloré). Collaborateur 2801, 2022 : STAFFPROJECTTIME à 0, TARGETHOURS 2022 = 0 sauf août 189.0, oct. 30.75, nov. 59.75, déc. 16.5 → disponibilité = ces valeurs (vert).
11. **Coût de revient réalisé, bureau** [P CSV, `TIMEPERIOD × rateAt`] : 2025, affaire 501 : 1'888.00 h → **148'322.50** ; affaire 2851 : 1'096.00 h → 83'238.75 ; affaire 1651 : 986.00 h → 77'448.75 ; heures sans affaire (vacances/absences) 1'079.50 h → 83'516.25 (à exclure des analyses par affaire, incluses dans Reporting). Bureau janvier–juin 2025 : 5'279.50 h → **437'616.25** (= ligne « Coût de revient » de la Marge au mois de référence juin 2025 pour l'ensemble des affaires, facteur 0 → frais internes 0.00).
12. **Cas de formules** : plFraisInternes(base = 0) = 0 ; plSuggestedRate(TIMEHOUR = 0) = null → ignoré ; τ avec budgetTotal = 0 → 0 (pas NaN) ; taux pondéré sur deux phases : budgets 100 et 300, taux 50 % et 100 % → 87.5 % ; report du dernier taux : phase planifiée jan-mars, taux saisis 20 (jan), 60 (mars), mois de référence février → 20, avril → 60 (plafonné), décembre précédent → 0.

---

## 10. Incertitudes restantes et choix recommandés

1. **Variante « direction » sans DELTAplanning** (proposée par le rapport mgmtplanning : Marge bénéficiaire alimentée par les contrats/encaissements de spec_9) : **non retenue** — étrangère à l'original ; si Paulo veut un suivi financier immédiat, saisir les PLANNINGMONTH (étape 1 seule : contrat, déductions, tarif) suffit à faire vivre Marge bénéficiaire, Analyse 1 et Analyse 2 avec le coût réel `timelog × rateAt`.
2. **Analyse 6, ligne d'écart** : formule du code = estimé − réel, libellé inversé. Recommandé : formule du code + libellé corrigé ; alternative : libellé original + formule inversée. À trancher avec Paulo.
3. **Reporting, colonne « Année » des lignes « % »** : garder le ratio des totaux (écart volontaire, §0.2 n° 10).
4. **Analyse 5** : sommer réellement par catégorie (correction d'anomalie) ; Management ▸ Encaissements : corrections des défauts 1-2 et 5 (§5.10) — toutes commentées dans le code comme écarts assumés.
5. **Cascades JPA** non extraites de `PlanningMonth.planningTimes/planningStaffTimes` et `PlanningTime.planningAssignments` : supposées ALL ; DeltaSub supprime explicitement les enfants.
6. **Préfixe du montant « coûts supplémentaires »** dans le menu Montant (§3.7.2) : probablement « − » ; afficher le montant signé négativement.
7. **Ordre exact des suggestions de budget temps** (§3.7.1) : q arrondi en tête, séparateur, puis les arrondis ; l'ordre interne des six arrondis est déduit.
8. **Analyse 2, impression** quand le mois de référence n'est pas une colonne : trois cellules vides [D] ; DeltaSub peut afficher la colonne la plus proche — non, reproduire (vide).
9. **Tri `Staff.compareTo`** (Attribution des collaborateurs) : SORTORDER puis nom [D] ; cohérent avec `findActual ORDER BY sortOrder`.
10. **Textes types `planningText`** : le bureau a un groupe de type 0 et aucun texte ; l'éditeur générique de textes types de DeltaSub, s'il existe, sera réutilisé ; sinon un éditeur minimal.
11. **Graphiques** : `mgChart` n'a pas d'aires ni d'empilé horizontal ; aires = polylignes fermées (à ajouter) ; Analyse 5 en empilé vertical accepté.
12. **Libellé « Désignation »** de la ligne coût replanifié (§3.10) : anomalie de l'original, remplacé par « Coût de revient replanifié ».
13. **Ancien document** Reporting : ne pas construire sans demande.
14. **Bandeau « aucune planification saisie »** (§1.2) : amélioration DeltaSub, à valider.

---

## À reproduire dans DeltaSub (par priorité)

1. **Lot A — Reporting** : appliquer le tableau des écarts §6.6 (1 « Heures prévues » en ligne simple ; 2 séries des modèles Solde ; 3 ligne vide en double ; 4 « +/- » sans couleur ; 6 catégorie « Année » sur l'axe X ; 7 tri SORTORDER ; 9-10 filtres et « Annuler la sélection » par variante ; 11-13 étiquette du modèle, « Total » au-dessus de « Secteurs », bouton icône sans « Tableau de bord ») ; consigner 5, 15, 17 comme écarts volontaires. Contrôle : §9.9.
2. **Réponse « tableau de bord »** : aucune vue nouvelle ; Reporting ▸ Chiffres-clés est le tableau de bord de l'original (manuel FR p. 87) ; au plus un alias NAV qui l'ouvre.
3. **Lot B0 — socle** : collections `planning*`, module `pl*` (§2.3-2.4) avec gardes /0, `plAssProject`, cascades `delProject`, `MOIS_C`, `mgChart` aires/empilé, `mgPrint` jeux 1/2 + styles niveau 2, `mgCatView` en-tête paramétrable.
4. **Lot B — domaine « Planification RH »** dans `DOMAINS` : grille 5 types (§3.2), planification par ouvrage et catégories (§3.3), facteur daté, seuil de marge, période ±1 mois avec les 3 contrôles et messages exacts (§3.4), cadre des 6 étapes (§3.5-3.6), dialogues §3.7-3.9, ressources §3.10 ; intégrité §2.2.
5. **Lot D1 — Marge bénéficiaire** (§5.3) + impression transposée 7.1 avec les noms de colonnes du dpdoc du bureau et la ligne d'unités ; **D2 — Attribution des collaborateurs** (§5.9, `sptDisponible`, 4 mois colorés, impression 7.4) — seul domaine non nul aujourd'hui.
6. **Lot C1-C3** : page des 6 tuiles avec filtres multi-sélection (§4.1) ; Analyse 1 = tableau de bord par affaire (§4.2, un seul point par série) ; Analyse 2 (18 lignes, coût réel ≤ R / planifié × (1 + facteur) > R, couleurs, totaux %) + impression 7.5.
7. **Lot D3-D7** : Encaissements (18 lignes, courbes 5 séries, impression 7.2 « Paiements », défauts 1-2 corrigés), Disponibilité (rouge > 10 h, aires), Occupation (barres), Rapport mensuel (8 colonnes, empilé), Attribution de l'affaire (3 niveaux, sans couleur, impression 7.3).
8. **Lot C4-C7** : Analyse 3 (fenêtre de mois, cumuls sur la fenêtre, 4 balances, 6 graphiques), Analyse 4 (colonnes phases, libellés courts > 4, arrondi au pas), Analyse 5 (un mois, Σ par catégorie corrigée, empilé), Analyse 6 (cumuls ≤ R, écart à trancher, barre catégories si singleton).
9. **Rafraîchissement et droits** : `hit()` sur `planning*` dans Heures ▸ Disponibilité et les nouvelles vues ; droits `projectPlanning`, `projectPlanningAnalyze`, `managementPlanning` ; bandeau « aucune planification saisie ».
10. **Basse priorité** : export PNG des diagrammes, « Ancien document » Reporting, textes types `planningText` avancés.
# Cahier des charges : DeltaSub ▸ MANAGEMENT (reproduction de Deltaproject 16.05)

Ce document est la version finale et critique, établie après confrontation des 7 rapports (navigation, reporting, collaborateurs, affaires, contrats, manuel, deltasub). Chaque point litigieux a été revérifié à la source.

**Sources et marqueurs**
- **[bc]** bytecode (`classe.méthode`, offset).
- **[lib]** libellé Strings.db.
- **[doc]** modèle `.dpdoc` (`modeles.json → modeledocument`, jeu 0).
- **[don]** données CSV de la sauvegarde du 28.09.2026, identiques à la base de test `dstest`.
- **[man]** manuel.
- **[D]** DÉDUIT. Tout ce qui n'est pas marqué [D] est PROUVÉ.

**Fichiers de vérification** (dans `…/scratchpad/research/mgmt_critique/`)
- `verif.py`, `verif2.py` : recalcul indépendant des valeurs de contrôle.
- `verif_out.txt` : leurs résultats.
- `dpdoc_p1.txt` : mises en page d'impression des rapports P1.

**Données personnelles** : les collaborateurs, affaires et maîtres d'ouvrage sont désignés par leur ID. Seuls des totaux agrégés figurent ici.

---

## 0. Synthèse et décisions

### Ce que le bureau voit réellement

MANAGEMENT n'apparaît que pour l'administrateur (APPUSER 2752), avec **5 entrées** dans cet ordre (§1) :
1. Affaires - Genres d'affaires
2. Heures
3. Controlling
4. Collaborateurs
5. Maître d'ouvrage

Les quatre autres entrées de l'original sont masquées faute de licence : Contrats honoraires, Planification RH, Factures, Reporting.

La vue actuelle de DeltaSub, « Statistiques » (`VIEWS['mgmt']`), reproduit en partie Reporting ▸ Comparaison années. Or Reporting n'est **pas visible au bureau**.

### Priorités

**P1 : visibles au bureau et alimentés par ses données.** Ce sont les 5 entrées, à construire dans cet ordre de réalisation :
1. Collaborateurs : 10 catégories, le plus utile.
2. Controlling : 6 catégories.
3. Heures.
4. Maître d'ouvrage.
5. Genres d'affaires : le bureau a peu de données.

**P2 : reproductibles, mais non visibles au bureau ou vides aujourd'hui.**
- **Reporting** : la vue existe déjà et les données sont riches. Je recommande de la garder et de la corriger (§11), en dernière position de la navigation, sous le libellé « Reporting ».
- **Planification RH** : tables vides, sauf STAFFPROJECTTIME, désormais saisissable dans DeltaSub.

**P3 : hors périmètre.**
- **Contrats honoraires** et **Factures** : la facturation et les contrats vivent dans `Facturation.html`, qu'il ne faut jamais fusionner avec DeltaSub. DeltaSub applique déjà cette politique (`why`, ligne 1543).
- Les impressions « [Ancien document] » (FORMTEMPLATE).

### Socle commun à coder une fois (§2)
- fenêtre à liste « Catégorie » ;
- barre d'outils Rapports / Roue / Filtre ;
- rendu `ReportCellRenderer` ;
- filtres `ReportFilter` et `ProjectFilter` ;
- agrégateur `TimeLogReportItem` ;
- **moteur d'impression générique `.dpdoc`**, qui sert pour les 34 types de documents.

### Prérequis hors MANAGEMENT
- Corriger la clé `project_projectkind` écrite par `editProject` (lignes 1167 à 1169), sinon le rapport Genres d'affaires reste faux après une modification (§3).

### Corrections majeures apportées aux rapports (détail en annexe A)
- Aucun rôle « Direction » ne donne MANAGEMENT.
- L'enum compte 50 modules (et non 35).
- Ordre des catégories : c'est celui de l'enum qui fait foi, pas celui de Strings.db.
- Valeurs 2025 de Collaborateurs corrigées : 10'845.75 et −1'372.15.
- Le report des heures supplémentaires est un nombre décimal, pas un entier.
- Impression : colonnes identifiées par `id`, affichées dans l'ordre `sortOrder`, en-tête `customH`.
- Les numéros de ligne de DeltaSub cités par les rapports sont périmés : le fichier compte désormais 3 548 lignes.

---

## 1. Arborescence MANAGEMENT visible au bureau

### 1.1 Règles de construction de l'arbre

**Parcours de l'arbre**
- `MenuTree.initModules` parcourt `Modules$Menu.values()`. Un menu est inséré si `menu.isVisible() && Security.hasRight(menu.getRequiredRight())`. Pour MANAGEMENT, le droit requis est `management` (8,0) [bc].
- Les modules d'un menu sont ceux de `Modules$Module.values()` dont `menu == management`, dans l'ordre de l'enum.

**L'enum `Modules$Module`**
- Il compte **50 constantes**. MANAGEMENT occupe les ordinaux 26 à 34 [bc `Modules$Module.<clinit>`] :

  | Ordinal | Clé | Libellé fr [lib `deltaproject/Modules`] | Licence exigée | Classe ouverte |
  |---|---|---|---|---|
  | 26 | managementProjectKinds | Affaires - Genres d'affaires | aucune (office) | management.ProjectKindsFrame |
  | 27 | managementProjectTime | Heures | aucune | management.ProjectTimeFrame |
  | 28 | managementProjectControl | Controlling | DELTAcontrol (10) | management.ProjectFrame |
  | 29 | managementContracts | Contrats honoraires | DELTAhonorar (13) | ProjectContractFrame |
  | 30 | managementPlanning | Planification RH | DELTAplanning (14) | PlanningFrame |
  | 31 | managementInvoices | Factures | DELTAfaktura (11) | ProjectInvoiceFrame |
  | 32 | managementStaff | Collaborateurs | aucune, mais droit `staff` (6,0) exigé | management.EmployeeFrame |
  | 33 | managementBuilder | Maître d'ouvrage | DELTAcontrol (10) | management.BuilderFrame |
  | 34 | managementTimeReport | Reporting | DELTAreport (12) | TimeReportFrame |

- `Module.isVisible()` exige `Security.hasActivatedLicence(licence)` quand une licence est requise [bc].
- `Menu.getModules()` ajoute un test pour `managementStaff` : `hasRight(Right.staff)` [bc `Modules$Menu`, offsets 41 à 63].
- Les libellés `module_managementInvoiceAnalyze`, `module_managementProjectStaff` et `module_managementStaffProject` de Strings.db ne correspondent à **aucun** module : ce sont des restes. Les deux derniers existent en revanche comme catégories du Controlling (§5).

### 1.2 Données du bureau [don]

**Licences**
- `APPLICENCE` contient les codes 1 (office, 7 postes), 10 (controle, 1 poste), 100, 101 et 103.
- Les codes 11, 12, 13 et 14 sont **absents**.

**Activations (`APPACTIVATEDLICENCE`)**
- office : utilisateurs 2752, 2753, 2755, 3001, 3201 et 3351.
- controle : utilisateur 2752 seulement (ligne 66351).

**Fonctions et jeux de droits**

| Fonction | Jeux de droits | Détenteurs |
|---|---|---|
| 1 « Administrateur » | jeu 1 = `0,0;1,0;1,1` (superadmin) | 2752 seulement |
| 201 « Standard » | jeu 301, sans 8,0 ni 6,0 | tous les utilisateurs |
| 301 « Direction » | jeux 301 et 351 ; **351 = `4,8;` seulement** | personne |
| 251 (sans nom) | jeu 1 | personne |

- Le jeu 201 « Gestion » (8,0) n'est rattaché à aucune fonction.

**Conséquences**
- **Seul 2752 voit MANAGEMENT**, et il y voit : Genres d'affaires · Heures · Controlling · Collaborateurs · Maître d'ouvrage.
- Contrats honoraires, Planification RH, Factures et Reporting sont invisibles pour tout le monde.
- Même un utilisateur « Direction » ne verrait pas MANAGEMENT. Le rapport « navigation » affirmait l'inverse (« 4,8 et 8,0 ») : c'est une erreur.

### 1.3 Écarts avec la NAV DeltaSub (`DeltaSub.html`, lignes 335 à 345 ; Management = ligne 343)

| Point | Deltaproject au bureau | DeltaSub aujourd'hui | Action |
|---|---|---|---|
| Entrées MANAGEMENT | les 5 entrées ci-dessus | `[['mgmt','Statistiques']]` | remplacer (§1.4) |
| Reporting | masqué (pas de licence report) | « Statistiques » ≈ Comparaison années | garder, renommé « Reporting », en dernier (P2) |
| Droits | MANAGEMENT réservé au superadmin | DeltaSub ne gère aucun droit (`ME`, ligne 405) | pas de filtrage pour l'instant (§14) |
| Hors MANAGEMENT, pour mémoire | Collaborateurs : actuels, **Tous**, **Anciens** ; Tâches : Urgent, En traitement, Réglé ; Bâtiment : eCCC, devis, contrôle | Collaborateurs : actuels, anciens, tous ; Tâches : `_todo` | hors de ce lot |

- Heures ▸ Disponibilité **existe désormais** dans DeltaSub (`h-dispo`, commit 0eaf4db). Le rapport « navigation » était périmé sur ce point.

### 1.4 NAV cible (à reporter ligne 343)

```js
{s:'Management', items:[['mg-genres','Affaires - Genres d’affaires'],['mg-heures','Heures'],['mg-controlling','Controlling'],
                        ['mg-collab','Collaborateurs'],['mg-mo','Maître d’ouvrage'],['mg-reporting','Reporting']]},
```

- **Alias obligatoire.** `VIEWS['mgmt']=VIEWS['mg-reporting']`. Sans lui, `go(localStorage.ds_view)` (ligne 3540) retombe sur `_todo` pour les postes qui avaient mémorisé `mgmt`.
- **Libellés.** Casse normale, comme le reste de la NAV DeltaSub. L'original les affiche en majuscules (`menu_*`), mais c'est une différence purement cosmétique.

---

## 2. Socle commun (préalable à tous les sous-modules)

### 2.1 Fenêtre « à catégories » (patron `*MenuTableModel`)

Collaborateurs, Controlling et Reporting (ainsi que Contrats, Factures et Planification) utilisent le même patron [bc] :
- un `JSplitPane` avec, à gauche, une table d'une seule colonne dont l'en-tête vaut **« Catégorie »** (« Domaine » pour la Planification) ;
- les entrées suivent l'ordre de `MenuItem.values()` ;
- la dernière entrée choisie est mémorisée (`last…MenuSelection`) ; à défaut, la première ligne est sélectionnée ;
- séparateur à 200 px par défaut, mémorisé.

**DeltaSub**
- Fonction `mgCatView({id, cats:[[clé,libellé]], pane:(R,clé)=>…, w:200})`, copiée de `VIEWS['config']` (lignes 1898 à 1906).
- Mémoriser la catégorie dans `localStorage` sous `ds_mg_<id>`, dans un try/catch.

### 2.2 Barre d'outils standard

**Boutons, de gauche à droite selon l'écran**
- `[<] année [>]` : année courante par défaut, ±1 puis recalcul.
- **Rapports ▾** : « Afficher le rapport… ». Ce menu n'est actif que si le tableau a des lignes ou si une affaire est sélectionnée.
- **Roue ▾** : « Copier le contenu du tableau dans le presse-papier » et « Exporter le tableau dans un fichier CSV… » [lib `util.table.TablePopup`], puis les options propres à l'écran.
- **Filtre ▾** : entonnoir, avec à côté une étiquette « Filtré » ou la description du filtre.

**« [Ancien document] »**
- Dans l'original, une entrée séparée « Afficher le rapport… [Ancien document] » s'ajoute si `Settings.isModuleFormVisible()`. C'est le cas au bureau : SETTING 801 vaut `[YES]` [don].
- DeltaSub : **P3**, à ne pas faire dans ce lot (§2.7).

**Code DeltaSub**
- `setTools` (ligne 255) avec des `ibtn` (ligne 250).
- Les menus passent par `popMenu` (ligne 258) avec des entrées `{t, fn, chk, dis}`.
- Copie et export : `copyTable(g)` et `csvTable(g, nom)` (lignes 745 et 746).

### 2.3 Rendu des tableaux (`util.table.ReportCellRenderer`) [bc]

**Nombres**
- Arrondi `Formatter.round(x) = signe × Math.round(|x|×100)/100`, sans −0.
- Affichage `#,###,##0.00` avec l'apostrophe comme séparateur de milliers (`1'234.50`) : `num(v)` à la ligne 143.
- Zéro affiché `0.00`. Il faut **arrondir avant** d'appeler `num` pour éviter l'affichage `-0.00`.

**Couleurs**

| Élément | Rendu |
|---|---|
| Lignes surlignées niveau 1 | fond `rgba(20,20,20,.16)` (alpha 40/255) |
| Lignes surlignées niveau 2 | fond `rgba(120,120,120,.16)` |
| Lignes surlignées niveau 3 | fond `rgba(200,200,200,.16)` |
| Lignes en gras | liste `boldRows` |
| Colonnes surlignées (trimestres, année) | fond courant avec alpha 150 : léger voile |
| Colonnes colorisées | valeur > 0 en vert `#008F00`, < 0 en rouge `#FF0000` |
| Colonnes « % » colorisées | < limite en vert ; < 100 en orange `#FF9000` ; sinon rouge. Limite = **80** pour le Controlling (`ProjectReportFrame`, offset 50 : `bipush 80`) |

- Le SETTING `standardTableRateLimit` (10.0) ne concerne que la Planification RH.

### 2.4 Filtres

**A. `ReportFilter` et le dialogue « Editer le filtre »** (`ReportFilterDialog`) [bc + lib]

Constructeur : `(nomStatut, libelléPériode, statutActivé, facturableActivé)`.

Valeurs par défaut :
- filtre **arrêté** (`isOn=false`) ;
- période de janvier à décembre de l'année courante ;
- `isChargeable` et `isCharged` à `null`.

Menu du bouton :
- ☐ « Appliquer le filtre », actif seulement s'il y a au moins un critère ;
- séparateur ;
- « Editer le filtre… ».

Le dialogue, modal, compte trois panneaux :
1. « Statut de l'affaire », si `statutActivé` : ( ) [nomStatut] / ( ) « Toutes les affaires ». Le bouton radio porte d'abord le libellé « Filtré selon statut de l'affaire », remplacé ensuite par `nomStatut` (offsets 377 à 380).
2. [libelléPériode] : « de » [mois ▼] [◀ année ▶] « à » [mois ▼] [◀ année ▶].
3. « Filtre Facturable/Facturé », si `facturableActivé` : ☐ Facturable ( ) Non ( ) Oui · ☐ Facturé ( ) Non ( ) Oui. Les boutons radio sont inactifs tant que la case n'est pas cochée.

Boutons « Annuler » et « OK ». OK enregistre, puis met le filtre en marche selon `hasCriteria()`.

Étiquette à côté de l'entonnoir, visible seulement si le filtre est en marche :
- « Filtré » s'il y a un critère de statut ou de facturation ;
- sinon la période, au format « janvier 2026 - décembre 2026 ».

Requêtes :
- `12×a1+m1 ≤ 12×TIMEYEAR+TIMEMONTH ≤ 12×a2+m2`, plus `ISCHARGEABLE=` et `ISCHARGED=` si ces critères sont renseignés (`TimeLog.findByYearAndMonth`) ;
- variante au jour pour « Heures » (§4) : `a×372+m×31+j`.

**Deux prédicats de statut différents** (ce n'est pas une contradiction entre rapports, ce sont deux écrans différents) :
- Controlling ▸ Affaires - Collaborateurs, « Affaires en cours » : `Project.isActive()`, soit `2 ≤ PROJECTSTATECODE < 4`, donc **En cours ou En attente** [bc `db.Project.isActive` ; `EmployeeProjectReportTableModel`, offset 157].
- Contrats, « Affaires en cours et terminées » : état compris entre 2 et 4 (JPQL `projectStateCodeFrom … To`) [bc] ; P3.

**B. `db.ProjectFilter`, pour les listes d'affaires à gauche** [bc]
- Par défaut : `isOn=true`, statut « En cours » (2).
- Critères : statut, interne ou externe, groupe d'affaires, genre d'affaires. Dialogue « Editer le filtre » : Statut de l'affaire / Type d'affaire (Affaires externes, Affaires internes) / Groupe d'affaires / Genre d'affaires [lib `deltaproject.project.ProjectFilterDialog`].
- Requête `Project.getProjectListByFilter` :
  - filtre en marche avec un statut : `PROJECTSTATECODE = statut` ;
  - sinon `≠ 1 AND ≠ 5` ;
  - puis les critères interne, genre ou groupe, **seulement si le filtre est en marche** ;
  - `ORDER BY SORTLABEL, NUMBER`.
- Liste affichée : `ProjectTableModel` de type `small` (masque `110000000`), colonnes « Numéro » et « Affaire ». Le tri est mémorisé.
- Menu : ☐ « Appliquer le filtre », « Editer le filtre… », séparateur, « Annuler la sélection ».

**C. Filtre de statut simple** (menu à cases exclusives)
- Libellés « Afficher tout », « Configuration », « En cours », « En attente », « Terminée », « Archivée » [lib `db.Project`] ; `PSTATE` à la ligne 1105.

### 2.5 Agrégateur `TimeLogReportItem`, noté `mgItem` [bc `db.TimeLogReportItem`]

**Nœud**
- `{key, lbl, tp, amt, chg, cost, tb, tab, kids:Map}`.

**`put(cléObjet, tl)`** : crée l'enfant s'il n'existe pas.
- À la création, lire les budgets sur la clé :
  - phase, sous-phase, groupe d'activités, activité : `TIMEBUDGET` et `TIMEAMOUNTBUDGET` ;
  - ouvrage : `TIMEBUDGET` seul ;
  - affaire, collaborateur ou null : 0.
- Puis cumuler :
  ```
  tp   += TIMEPERIOD
  amt  += tlFee(tl)   si ISCHARGEABLE      (« Facturable »)
  chg  += tlFee(tl)   si ISCHARGED         (« Montant facturé »)
  cost += tlCost(tl)  toujours             (« Coût de revient »)
  ```
- `tlFee` et `tlCost` (ligne 1553) correspondent à `getAmount` et `getStaffAmount` : heures × tarif du groupe de tarifs de **l'activité** à la date de la saisie, et heures × coût de revient du collaborateur à cette date. Le premier tarif retenu est celui dont `VALIDFROM ≤ date`, dans l'ordre `VALIDFROM` décroissant.

**Dérivés**
- à facturer = `amt − chg` ;
- facturable − coût = `amt − cost` ;
- prévision (−) facturable = `tab − amt` ;
- solde = `tb − tp`.

**Total**
- `add()` des nœuds de **niveau 1**, budgets compris. Seules les lignes présentes comptent (voir « Toutes y.c. », §5.3).
- Parts : `tp/total.tp`, `amt/total.amt`, `tb/total.tb`.

**Tri** [bc `TimeLogReportItem$1`]
- clé null en premier : « Pas de phase », « Pas d'activité »… ;
- phases et sous-phases par `NUMBER` ;
- groupes d'activités, activités et ouvrages par `SORTORDER` ;
- collaborateurs par nom ;
- affaires **par ID**.

**Divergence voulue**
- L'original fusionne deux clés qui ont le même `NUMBER` ou le même `SORTORDER`, car son comparateur renvoie 0.
- Au bureau, cela touche l'affaire 1651, qui a deux phases de NUMBER « 0 », et les affaires 1052 et 1053, qui ont chacune deux groupes de SORTORDER 7 [don].
- DeltaSub doit **regrouper par ID** et trier par numéro puis par ID. Documenter cette divergence dans un commentaire.

**Données** [don]
- `ISCHARGEABLE=1` sur les 37 622 saisies. Tester ou non ISCHARGEABLE ne change donc rien au bureau.
- `ISCHARGED=1` sur 1 514 saisies.
- 6 activités sur 390 seulement ont un groupe de tarifs. « Facturable » est donc presque toujours à 0 : prévoir un avertissement comme celui de `ctlAnalyse` (ligne 1633 : « ⚠ aucune activité n’a de tarif : honoraires à 0 »).

### 2.6 Impression « Afficher le rapport… » : moteur générique `.dpdoc`

L'original utilise `Reports.newReport(DocumentType)` et imprime **exactement les données à l'écran**. Les modèles `0/<type>-fr.dpdoc` sont déjà dans la collection `modeledocument` de DeltaSub (chargée par `tplNeed`, ligne 2806).

**Moteur `mgDoc(type, data)`** à écrire une fois, avec `data = {fields:{nomChamp:texte}, tables:{nomTable:{rows:[[…]], styles:[…]}}}` :

1. **Page.** `r.pageTemplates[0].page` : `w`, `h`, `l`, `r`, `t`, `b` en mm. Le fichier contient les formats suivants (tous en haut 25, bas 20) :

   | Format | Dimensions (mm) | Marges gauche / droite (mm) |
   |---|---|---|
   | A4 Paysage | 297 × 210 | 15 / 15 |
   | A4 Paysage marge latérale étroite | 297 × 210 | 10 / 10 |
   | A4 Portrait | 210 × 297 | 25 / 15 |
   | A4 Portrait marge latérale étroite | 210 × 297 | 15 / 10 |

   `pageCells` :
   - en-tête : 3 cellules à y = 7, h = 15 ; `Logo.png` à gauche (collection `image`), puis un filet bas ;
   - pied : à y = 193 (paysage) ; nom de l'utilisateur à gauche (`ME.u`), « n° | nb de pages » à droite, filet haut.
2. **Bandes.** Les parcourir dans l'ordre de `sections[0].bands[]` (trié par `sortOrder`).
   - **`GridBand`** : les lignes contiennent des cellules `Text`. Chaque `ts[]` est soit un `TextString` (texte littéral), soit un `TextField` (`f='Classe$Champ|nom'`, style `s`). Styles `s` rencontrés :
     - `standard`, `dateLong` (« 29 septembre 2026 », `dLong`, ligne 2980) ;
     - `contactOwnerAndAddress`, `contactFirstnameAndName`, `projectNumberAndTitle`, `subProjectCode`.

     Colonnes `cols[]` : largeur relative `pw`, `textFont` (`title`, `text`, `textBold`) et alignement `ha`.
   - **`TableBand`** : `f` désigne la table. Colonnes : `tableSettings[0].columns`, triées par `sortOrder`.
     - Colonnes masquées : celles où `isH` est vrai.
     - En-tête : `customH` si `isHC`, sinon `name`.
     - Largeur relative `pw`, alignement `ha`.
     - **La valeur d'une colonne est la cellule d'indice `id` de la ligne de données.** C'est prouvé par `EmployeeReportTableModel.fillTable`, qui ajoute les valeurs dans l'ordre des id, alors que le `.dpdoc` affiche l'id 2 avant l'id 1.
3. **Styles de ligne.** Chaque ligne de données porte un style parmi `tableRow`, `tableLevel1` (titre, gras), `tableLevel2` (sous-ligne), `tableLevel1Total` / `tableTotal` (gras avec filet) et `space` (ligne vide). Le fond est alterné si le jeu de réglages le demande (`isS`) [D].
4. **Repli.** Si le modèle manque ou n'est pas chargé, produire une impression HTML simple comme `hrPrint` (ligne 1758), avec `tplOr` (ligne 3052).

Chaque sous-module ci-dessous précise son `type`, son titre, sa page, ses champs et ses colonnes (source : `dpdoc_p1.txt`).

### 2.7 « [Ancien document] » (P3)

Formulaires FORMTEMPLATE de la catégorie `managementTemplates`, groupes Default et Standard, identiques entre eux et sans groupe « Substances » ; ils sont imprimables avec `tplPrint` (ligne 3022).

À ne faire qu'à la demande de Paulo. Deux raisons :
- les traductions de l'original sont inversées (`withOvertime` est traduit « Sans heures d'appoint ») ;
- ils font double emploi avec les documents `.dpdoc`.

### 2.8 Mise à jour et performances

- `refresh(ts)` avec `hit(ts, …)` (ligne 371), selon les tables utilisées par chaque vue ; redessiner avec `this.draw`.
- Préparer les index **une seule fois par dessin**. Pour 37 622 saisies :
  - `Map` activité → {TYPECODE, groupe de tarifs} ;
  - une passe unique sur `DS.all('timelog')`.
- Éviter les `DS.get` imbriqués dans des boucles sur les jours.

---

## 3. Affaires - Genres d'affaires (`ProjectKindsFrame`) : P1, faible volume

**a) Accès.** MANAGEMENT ▸ entrée n° 1. Aucune licence. Pas de liste « Catégorie ».

**b) Disposition** [bc]
- **Gauche, 240 px** : table « **Groupe** | **Genre d'affaire** » (`db.admin.ProjectKindsTableModel`) [lib].
  - Elle liste tous les genres, groupe par groupe.
  - Les groupes suivent `ORDER BY sortOrder` [bc JPQL ProjectGroup].
  - Les genres suivent `getProjectKinds()`, probablement dans l'ordre de `SORTORDER` [D]. DeltaSub trie déjà ainsi ligne 1147.
- **Droite, barre d'outils** :
  - champ de recherche, qui filtre la table à la frappe ;
  - `[étiquette][Filtre ▾]`, avec les choix exclusifs « Afficher tout » (**défaut**, statut `null`), Configuration, En cours, En attente, Terminée, Archivée ;
  - `[Rapports ▾]` ;
  - `[Roue ▾]` : copier, CSV, séparateur, puis les boutons radio « Abrégée » et « **Standard** » (défaut). Mémorisé dans `managementProjectKinds.Preferences`.

**c) Tableau** (`db.ProjectTableModel`) [bc + lib]

| Présentation | Colonnes |
|---|---|
| **Standard** (`all`, `111111111`) | Numéro · Affaire · Maître d'ouvrage · Statut · Début · Fin · Phase en cours · Tri · Actif |
| **Abrégée** (`standard`, `110111001`) | Numéro · Affaire · Statut · Début · Fin · Actif |

Sources des colonnes :
- `NUMBER`, `TITLE` ;
- Maître d'ouvrage : nom court du contact rôle 8 (`ROLE 8`, `contactName`) ;
- Statut : `PSTATE` ;
- Début et Fin : `PROJECTSTARTDATE`, `PROJECTENDDATE` (au format `dfr`) ;
- Phase en cours : nom de la phase `CURRENTPROJECTPHASE_ID` ;
- Tri : `SORTLABEL` ;
- Actif : `isActive()` (état 2 ou 3), ✔ / ✕.

**d) Contenu** [bc `ProjectKindsFrame` + `getProjectListByFilter`]
- Aucun genre sélectionné : la liste est vide.
- Sinon : `kind MEMBER OF projectKinds` (table `project_projectkind`) et état = filtre ; avec « Afficher tout », état ∉ {1, 5}.
- Tri : `SORTLABEL`, puis `NUMBER`.

**e) Graphique.** Aucun.

**f) Impression.** `managementProjectKindList`, « Liste des affaires par genre », A4 Paysage.
- Bande titre : `reportTitle` suivi de `filterDesc`, avec `filterDesc` = « Groupe, Genre | statut ». Date longue à droite.
- Colonnes, largeur relative entre parenthèses : N° (20) · Affaire (40) · Maître d'ouvrage (20) · ~~Adresse-Maîtres d'ouvrage~~ (40, masquée) · Statut (20) · Début (20) · Fin (20) · Phase en cours (20) · Tri (20) · Actif (20).

**g) Données** [don]
- 12 groupes, 69 genres, **22 liens** (16 affaires, 10 genres).
- Avec « Afficher tout », **16 liens visibles** : 5 liens sont sur des affaires archivées et 1 sur une affaire en configuration.

**Prérequis.** Corriger `editProject` (lignes 1167 à 1169).
- Le serveur fabrique la clé de `project_projectkind` en joignant les champs `*_ID` **triés par nom** : `PROJECTKINDS_ID-PROJECT_ID` (`serveur_deltasub.py`, ligne 200).
- `editProject` écrit et supprime au contraire `PROJECT_ID-PROJECTKINDS_ID`.
- Conséquence : décocher un genre importé ne le supprime pas.
- Correction : `id: k+'-'+v.ID` à l'écriture comme à la suppression.

---

## 4. Heures (`ProjectTimeFrame`) : P1

**a) Accès.** MANAGEMENT ▸ entrée n° 2. Aucune licence.

**b) Disposition** [bc]

**Gauche, 250 px :**
- `[Filtre statut ▾][étiquette]` : choix exclusifs **En cours** (défaut), Terminée, Archivée ; il n'y a ni « Afficher tout » ni « En attente » [bc `getProjectFilterPopupMenu`, offsets 10 à 26]. La requête porte sur l'état exact.
- Liste d'affaires : Numéro · Affaire, **une seule sélection**.
- Dessous, liste des **Ouvrages** de l'affaire (`SubProjectTableModel`, colonne « Ouvrage »). Une sélection filtre par `SUBPROJECT_ID`.
- Le champ de recherche n'existe qu'en version de développement : à ne pas reproduire.

**Droite, barre d'outils :**
- `[Filtre ▾][étiquette]` : `ReportFilter("Affaires en cours et terminées", "Période", false, false)`. **Seul le panneau Période** est proposé.
- Liste déroulante du type de rapport, mémorisée (`LastSelectedReportType`) : « **Affaires - Activités** » (défaut), « Affaires - Phases », « Collaborateurs » [lib].
- `[Rapports ▾]` (actif si une affaire est sélectionnée) et `[Roue ▾]`.
- ☐ « Toutes y.c. les positions non utilisées », inactif pour « Collaborateurs ».

**c) Tableau.** Présentation fixe `projectTime` = `11010100100000` [bc] :

| Colonne | Contenu |
|---|---|
| « Activités » / « Phases » / « Collaborateurs » | libellé |
| H. prévues | `tb`, vide pour Collaborateurs |
| H. saisies | `tp` |
| Solde | `tb − tp`, colorisé ; vide pour Collaborateurs |
| Facturable | `amt` |

Lignes :
- **Affaires - Activités** : niveau 1 = groupe d'activités (ou « Pas de groupe d'activités »), en gras sur fond niveau 2 ; niveau 2 = activités, **toujours affichées**.
- **Affaires - Phases** : niveau 1 = phase (ou « Pas de phase »), niveau 2 = sous-phases (ou « Pas de phase partielle »).
- **Collaborateurs** : une ligne par collaborateur, triée par nom.
- Toutes les variantes se terminent par « Total N° Titre », en gras et surligné niveau 1.

**d) Formules.** `mgItem` sur `getTimeLogList(affaire, ouvrage, …, de, à)` :
- filtre arrêté : **toute la vie de l'affaire** ;
- filtre en marche : du 1ᵉʳ jour de `m1/a1` au **dernier jour** de `m2/a2`.

« Toutes y.c. » ajoute des lignes à 0 h pour chaque groupe, activité, phase ou sous-phase sans saisie ; leurs budgets entrent alors dans le total.

**e) Graphique.** Aucun.

**f) Impression.** `managementProjectTimeReport`, « Analyse des heures de l'affaire », A4 Portrait.
- Bande « Informations » : Date · Affaire (`projectNumberAndTitle`) · « Filtre par date » (`timeFilter`) · Ouvrage (`subProjectCode`).
- **Trois tableaux, toujours tous imprimés** :

  | Tableau | Colonnes (largeur relative) |
  |---|---|
  | Activités | Activités (30) · H. prévues (20) · H. saisies (20) · Solde (20) · Facturable (20) |
  | Phases | Phases (30) · mêmes colonnes |
  | Collaborateurs | Collaborateurs (30) · H. saisies (20) · Facturable (20) |

  Les autres colonnes du `.dpdoc` sont masquées.

**g) Données.** SUBPROJECT : 30 lignes sur 9 affaires ; 659 saisies avec ouvrage [don]. Valeurs de contrôle au §12.4.

---

## 5. Controlling (`management.ProjectFrame`) : P1

**Conteneur.** `mgCatView`, en-tête « Catégorie », 6 entrées dans l'ordre de l'enum [bc `ProjectMenuTableModel$MenuItem`] :

| # | Entrée [lib] | Écran |
|---|---|---|
| 1 | Collaborateurs - Affaires | EmployeeProjectReportFrame(staffReport) |
| 2 | Affaires - Collaborateurs | EmployeeProjectReportFrame(projectReport) |
| 3 | Affaires - Phases | ProjectReportFrame(reportPhases) |
| 4 | Affaires - Activités | ProjectReportFrame(reportActivities) |
| 5 | Rapport des heures - Phases | PerformanceReportFrame(reportPhases) |
| 6 | Rapport des heures - Activités | PerformanceReportFrame(reportActivities) |

Préférences : `management.lastProjectMenuSelection` pour l'entrée, séparateur à 200 px. La licence controle est exigée côté original ; DeltaSub n'a pas de licences (§14).

### 5.1 Collaborateurs - Affaires

**Barre d'outils.** `[<] année [>]` (année courante), `[Rapports ▾]`, `[Roue ▾]`. Pas de filtre.

**Colonnes** [lib `EmployeeProjectReportTableModel`] :

| Colonne | Contenu |
|---|---|
| Désignation | libellé |
| H. saisies | heures |
| Facturable | montant |
| *(sans titre)* | monnaie de l'affaire |
| Coût de revient | montant |
| *(sans titre)* | monnaie principale (CHF) |

**Données.** Saisies de l'année (`TIMEYEAR = année`) ayant une affaire **et** un collaborateur.

**Lignes**, pour chaque collaborateur trié par nom :
- une ligne vide avant chaque bloc, sauf le premier ;
- une ligne titre en gras, avec le nom ;
- une ligne par affaire, triée **par ID**, libellé « N° Titre » ;
- « Total <nom> » par monnaie, en gras et surligné niveau 1.

**Pas de total général.**

**Impression.** `managementProjectControlStaffReport`, A4 Portrait.
- Titre « Controlling : Collaborateurs - Affaires <année> », date longue.
- Colonnes : Désignation (30) · H. saisies (30) · Facturable (30) · (15) · Coût de revient (30) · (15).
- Styles : ligne vide → `space` ; titre → ligne fusionnée ; total → `tableLevel1Total`.

### 5.2 Affaires - Collaborateurs

**Barre d'outils.** `[Rapports ▾]`, `[Roue ▾]` et, à droite, `[étiquette][Filtre ▾]` avec `ReportFilter("Affaires en cours", "Période", true, true)`, soit les 3 panneaux. Pas de navigation par année.

**Données.**
- Filtre arrêté (défaut) : **toutes les saisies, toutes années**.
- Filtre en marche : période, avec ou sans Facturable / Facturé ; avec « Affaires en cours », seulement les affaires `isActive()` (état 2 ou 3).

**Lignes.** Pour chaque affaire triée par ID :
- une ligne vide, sauf avant la première ;
- une ligne titre « N° Titre » en gras ;
- une ligne par collaborateur, triée par nom ;
- « Total N° Titre ».

À la fin, **seulement si toutes les affaires ont la même monnaie** : une ligne vide, puis « Total » avec la monnaie (offset 772, selon le rapport « affaires »).

**Impression.** `managementProjectControlProjectReport`, A4 Portrait.
- Bande « Filtres » : « Filtre Statut de l'affaire » · « Période » · « Filtre Facturable » · « Filtre Facturé » · « Date ».
- Même tableau que 5.1.

### 5.3 Affaires - Phases et Affaires - Activités (`ProjectReportFrame`)

**Gauche, 200 px.**
- `[étiquette][Filtre ▾]` avec `ProjectFilter` (défaut « En cours »).
- Liste d'affaires en **sélection multiple** (Maj pour une plage, Cmd pour ajouter ou retirer : `grid` avec `multi:true`, ligne 288).

**Droite, barre d'outils.**
- ☐ « Détails » ;
- ☐ « Toutes y.c. les positions non utilisées » ;
- `[Rapports ▾]` ;
- `[Roue ▾]` : copier, CSV, séparateur, puis boutons radio de présentation [lib] :
  - « Présentation : temps » (défaut) ;
  - « Présentation : temps, honoraires prév., facturable » ;
  - « Présentation : temps, honoraires prév, facturable, coût de revient » ;
  - « Présentation : honoraires prév., facturable, à facturer » ;
  - « Toutes les colonnes ».
- Mémorisé dans `managementProjectReport.Preferences`.

**Colonnes et masques** [bc `isColumnVisibleDefinition`] :

| # | En-tête [lib] | Valeur | temps `11111110000000` | ext. `11010101100000` | int. `11010101111000` | compta `10000001110011` | tout |
|---|---|---|---|---|---|---|---|
| 0 | Affaire | libellé | ✓ | ✓ | ✓ | ✓ | ✓ |
| 1 | H. prévues | tb | ✓ | ✓ | ✓ | | ✓ |
| 2 | % | tb/total.tb ×100 | ✓ | | | | ✓ |
| 3 | H. saisies | tp | ✓ | ✓ | ✓ | | ✓ |
| 4 | % | tp/total.tp ×100 | ✓ | | | | ✓ |
| 5 | Solde | tb − tp (colorisé) | ✓ | ✓ | ✓ | | ✓ |
| 6 | % | tp/tb ×100 (%, limite 80) | ✓ | | | | ✓ |
| 7 | Prévision d'honoraires | tab | | ✓ | ✓ | ✓ | ✓ |
| 8 | Facturable | amt | | ✓ | ✓ | ✓ | ✓ |
| 9 | Prévision (-) facturable | tab − amt (colorisé) | | | ✓ | ✓ | ✓ |
| 10 | Coût de revient | cost | | | ✓ | | ✓ |
| 11 | Facturable - coût de revient | amt − cost, si monnaie principale (colorisé) | | | | | ✓ |
| 12 | Montant facturé | chg | | | | ✓ | ✓ |
| 13 | Montant à facturer | amt − chg | | | | ✓ | ✓ |

Règles des pourcentages :
- un pourcentage nul s'affiche vide ;
- la ligne Total n'a pas de % en colonnes 2 et 4, mais en a un en colonne 6.

**Lignes**, pour chaque affaire sélectionnée qui a au moins une saisie (toutes si « Toutes y.c. » est coché), dans l'ordre de la liste :
- une ligne vide, sauf avant la première ;
- un titre en gras « N° Titre (CHF) » ;
- **niveau 1, toujours affiché** : phase, ou groupe d'activités ; « Pas de phase » ou « Pas de groupe d'activités » en premier. Gras sur fond niveau 2 **seulement si « Détails »** est coché ;
- **niveau 2, seulement si « Détails »** : « ␣␣ » + sous-phase ou « Pas de phase partielle » (ou activité / « Pas d'activité ») ;
- « Total N° Titre », gras et surligné niveau 1.

Pas de total général.

**Données.** Toutes les saisies de l'affaire, **sans filtre de période**. Sans affaire sélectionnée, le tableau est vide.

**Impression.** `managementProjectControlPhasesReport` ou `…ActivitiesReport`, A4 Paysage, titre et date.
- Colonnes imprimées, avec leur en-tête `customH` [doc] : Affaire (30) · H. prévues (25) · H. saisies (25) · Solde (25) · Prévision d'honoraires (25) · Facturable (25) · Prévision (-) facturable (25) · Coût de revient (25).
- Masquées : les colonnes « % », Facturable - coût de revient, Montant facturé et Montant à facturer.
- Styles : `tableLevel1`, `tableLevel2`, `tableLevel1Total`.

### 5.4 Rapport des heures - Phases et Rapport des heures - Activités (`PerformanceReportFrame`)

**Gauche** (séparateurs 200 / 400 / 200 px, mémorisés dans `managementPerformanceReport.Preferences`) :
- `ProjectFilter` et liste d'affaires, **une seule affaire utilisée** ;
- en dessous, deux listes de filtre croisées :
  - pour « Phases » : « Groupe d'activités », puis « Activité » (activités du groupe choisi) ;
  - pour « Activités » : « N° / Phase », puis « N° / Phase partielle ».

**Droite, barre d'outils.** ☐ Détails · ☐ Toutes y.c. · `[Rapports ▾]` = « Enregistrer le diagramme » seul · `[Roue ▾]`. Dessous : le tableau, puis le graphique.

**Tableau**
- Colonne 0 [lib] : « Phase/Phase partielle » ou « Groupe d'activités/Activités ».
- Puis **une colonne par mois**, au format `MM.yyyy` [bc `SimpleDateFormat`], du premier au dernier mois ayant des saisies (dans le filtre).
- Valeurs : heures seulement. **Aucune colonne de budget ni de montant.**

Lignes :
- niveau 1 (gras si Détails) ;
- sous-lignes « ␣␣nom » si Détails ;
- ligne finale « Total », ou « Total: <filtre> », gras et surlignée.

**Graphique** (DeltaSub : SVG, comme `VIEWS['mgmt']`).
- Boutons radio « Courbes » (défaut) et « Barres empilées ». Le bouton « Barres » est **masqué** (`jChart2RadioButton.setVisible(false)`) [bc].
- Menu `[Graphique ▾]` :
  - « Total… » : séries = Total + chaque niveau 1 en Courbes ; niveaux 1 seuls en Barres empilées ;
  - puis un modèle par ligne de niveau 1 : la ligne et ses sous-lignes (les sous-lignes seules en empilé).
- Axe X en `MM.yyyy`, axe Y « Heures [h] », titre = nom du modèle.

**Impression.** Aucun document. Seulement « Enregistrer le diagramme » (SVG ou PNG) et l'export du tableau.

---

## 6. Contrats honoraires (`ProjectContractFrame`) : P3, ne pas construire

- Masqué au bureau (pas de licence honoraire 13). Les données sont quasi vides : 1 contrat, 0 encaissement.
- Surtout, **les contrats d'honoraires sont gérés dans `Facturation.html`**, conformément à la politique DeltaSub (`why`, ligne 1543).

Pour mémoire, les 7 catégories dans l'ordre de l'enum [bc] :
1. Contrats
2. Contrats et sous-traitants
3. Echéancier d'encaissements
4. Encaissements planifiés
5. Encaissements reçus
6. Situation des encaissements
7. Avancement des prestations (`ProjectPerformanceFrame` appartient **ici**, pas au Controlling)

Le détail des colonnes et des formules est dans le rapport « contrats ». Il n'est pas repris ici.

---

## 7. Planification RH (`PlanningFrame`) : P2, plus tard

**Visibilité.** Masquée au bureau (pas de licence 14). Elle exige en plus le droit `managementPlanning` (8,3).

**Domaines**, dans l'ordre de l'enum [bc], sous l'en-tête « Domaine » :
1. Marge bénéficiaire
2. Encaissements
3. Disponibilité
4. Occupation
5. Rapport mensuel collaborateur
6. Attribution de l'affaire
7. Attribution des collaborateurs

**Données** [don]
- Toutes les tables PLANNING* sont vides.
- STAFFPROJECTTIME compte 24 lignes, avec `TIMEBUDGET = 0`.
- DeltaSub saisit désormais STAFFPROJECTTIME (Collaborateurs ▸ Paramètres ▸ Disponibilité, `dpModel`, ligne 1818).

**Seuls candidats utiles à terme** :
- « Rapport mensuel collaborateur » : `TIMEBUDGET`, `rateAt`, facteur 0 ;
- « Attribution des collaborateurs » : disponibilité = `dpTarget − DEVIATION − HOLIDAY − EDUCATION − OFFICIALABSENCE − OTHERABSENCE − INTERNALTIME`, réutilisable depuis `dpModel`.

Formules détaillées : voir le rapport « contrats », §4. Hors de ce lot.

---

## 8. Factures (`ProjectInvoiceFrame`) : P3, ne jamais construire contre les données de Facturation

**Visibilité et données.** Masquée au bureau (pas de licence 11). PROJECTINVOICE compte 0 ligne.

**Catégories** [bc] :
1. Vue d'ensemble de l'année
2. Selon statut
3. Date de la facture
4. Date d'échéance
5. Date d'encaissement
6. Honoraires et frais

**Pourquoi ne pas le reproduire.**
- La seule catégorie qui serait remplie est « Honoraires et frais » (heures facturables non facturées, environ 49 814 h).
- Elle serait **trompeuse** : la facturation réelle se fait dans `Facturation.html`, et `ISCHARGED` n'y est pas tenu à jour.
- Il ne faut jamais lire le `localStorage` de Facturation.

---

## 9. Collaborateurs (`management.EmployeeFrame`) : P1, priorité n° 1

### 9.1 Accès et catégories

**Accès.** MANAGEMENT ▸ entrée n° 4. L'original exige le droit `staff` (6,0) pour afficher l'entrée. Sans le droit `managementStaff` (8,2), seule la catégorie « Liste » est proposée [bc `EmployeeFrame.setMenuTable`, offsets 8 à 58].

**Catégories.** `mgCatView`, en-tête « Catégorie », mémorisée (`lastEmployeeMenuSelection`), 10 entrées dans l'ordre de l'enum [bc `EmployeeMenuTableModel$MenuItem` ; lib] :

| # | Libellé | Écran / famille |
|---|---|---|
| 1 | Liste | EmployeeListFrame (§9.2) |
| 2 | Durée prévue | A |
| 3 | Heures à effectuer (+) heures d'appoint | A |
| 4 | Heures saisies | A |
| 5 | Solde des heures | A |
| 6 | Solde des heures avec heures d'appoint | A |
| 7 | **Heures supplémentaires** | B |
| 8 | Notes de frais | A |
| 9 | Vacances saisies | A |
| 10 | Situation des vacances | C |

L'ordre de Strings.db, qui place « Heures supplémentaires » en dernier, **n'est pas** l'ordre affiché.

### 9.2 Liste (`EmployeeListFrame`)

**Barre d'outils.** `[Rapports ▾]` · `[Roue ▾]` · champ de recherche (filtre à la frappe).

**Lignes.**
- `ISACTIVE <> 0` : collaborateurs **actuels** seulement (`ListKind.actual`) [bc].
- Tri par nom de l'entité ; tri possible par clic sur l'en-tête.

**Colonnes** [lib `db.StaffTableModel`] :

| Colonne | Source |
|---|---|
| Collaborateur | nom |
| Appartient à | `relOf` |
| Fonction | `CONTACT.COMPANYROLE` |
| Abrév. | `INITIALS` |
| Interne | ✔ / ✕ |
| Tél. prof. | téléphone 1 |
| Tél. mobile | téléphone 2 |
| Courriel | `EMAIL1` |
| **Verrouillage des heures** | « Verrouillage avant » + date, si verrouillé |
| Engagement | date d'engagement |
| Départ | date de départ |

Ces colonnes reprennent les helpers de `collabView` (lignes 898 à 924 : `P(s)`, `relOf`, `phone`), avec les **libellés exacts** ci-dessus.

**Impression.** « Afficher le rapport… » avec le document `staffList`, titre « Liste des collaborateurs » + « Collaborateurs actuels », A4 Paysage.
- On imprime **les lignes visibles, dans l'ordre affiché** (`convertRowIndexToModel`).
- Le `.dpdoc` a 20 colonnes, dont 11 visibles : Collaborateur, Entité et adresse, Fonction, Abréviation, Téléphone, Téléphone mobile, Courriel, Tél. privé, Tél. mobile privé, Courriel privé.

### 9.3 Écran commun des catégories 2 à 10 (`EmployeeReportFrame`, un seul écran)

L'année et le mois sont conservés quand on change de catégorie.

**Barre d'outils** [bc] : `[<] [année] [>]` · `[Rapports ▾]` · `[Roue ▾]` · `☐ mois` · `[liste des mois ▾]`

| Élément | Règle |
|---|---|
| Année | année courante par défaut ; `<`, `>` et le libellé sont **désactivés pour « Situation des vacances »** |
| Case « mois » [lib `reportingMonth`] | décochée au départ ; active **seulement pour « Heures supplémentaires »** |
| Liste des mois | noms complets en minuscules (`MOIS_L`, ligne 2979) ; mois courant présélectionné ; active seulement si la case est cochée et que la catégorie est « Heures supplémentaires » |

**Tableau.**
- Non triable ; aucune action au double-clic ; aucun graphique.
- Dernière ligne : « Total ».
- Colonnes 4, 8, 12, 16 et 17 (trimestres et année) teintées dans la famille A.

**Notations** (année *y*, collaborateur *s*, mois *m* de 0 à 11) [bc + JPQL]

| Notation | Définition |
|---|---|
| `T(s,m)` | `TARGETHOURSm` de la ligne STAFFTARGETTIME (`STAFF_ID = s`, `TARGETTIMEYEAR = y`). **Aucun repli sur TARGETTIME**, ni sur `targetFor` (ligne 1664) ; utiliser la recherche de `dpTarget` (ligne 1812) |
| `O(s,m)` | `OVERTIMEm` |
| `R(s)` | `TARGETTIMEREDUCTION` |
| `H(s,m)` | Σ `TIMEPERIOD` de **toutes** les saisies de *s* en *y* : vacances, absences et vacances planifiées dans le futur comprises (`monthlyTimeReportForAllStaff`, sans filtre) |
| `V(s,m)` | même chose avec `ISHOLIDAY` |
| `F(s,m)` | Σ `QUANTITY × UNITPRICE × (FOREIGNCURRENCYRATE si FOREIGNCURRENCYCODE)` sur PROJECTCOST avec `STAFF_ID = s`, `DATEYEAR = y`, `ISREFUNDABLE = 1`, par `DATEMONTH`. Ni ISREFUNDED ni l'état ne sont filtrés. Formule de `pcAmount`, ligne 1368 |
| `A(h,T,O)` | `h > T+O ? h−O : (h > T ? T : h)` [bc `getTargetTimeAndOvertimeSum`] |

**Famille A : tableaux mensuels.**

18 colonnes : Collaborateur | janv. | févr. | mars | **1er trimestre** | avr. | mai | juin | **2ème trimestre** | juil. | août | sept. | **3ème trimestre** | oct. | nov. | déc. | **4ème trimestre** | Année. Les mois sont en abrégé (`getShortMonthName`, soit `MOIS`, ligne 401).

- Trimestre = somme de 3 mois ; Année = somme des 12 mois.
- Ligne « Total » = somme, mois par mois, de toutes les lignes.

| Catégorie | Lignes | Cellule |
|---|---|---|
| Durée prévue | tout STAFF (actuel **et ancien**) ayant une ligne STAFFTARGETTIME pour *y* | `T` |
| Heures à effectuer (+) heures d'appoint | idem | `T+O` |
| Heures saisies | tout STAFF ayant au moins 1 saisie en *y* | `H` |
| Solde des heures | idem Heures saisies | `H−T`. Un mois sans saisie vaut −T ; sans STAFFTARGETTIME, T = 0 |
| Solde des heures avec heures d'appoint | idem | `A(H,T,O) − T` |
| Notes de frais (CHF) | tout STAFF ayant au moins 1 frais remboursable en *y* | `F` |
| Vacances saisies | tout STAFF ayant au moins 1 saisie ISHOLIDAY en *y* | `V` |

- Tri par nom, puis Total.
- Un collaborateur qui a des heures prévues mais aucune saisie **n'apparaît pas** dans les soldes (jointure interne).
- Avec O = 0 partout au bureau, les catégories 3 et 6 donnent exactement les chiffres des catégories 2 et 5.

**Famille B : Heures supplémentaires** [bc `timeBalanceTargetTimeReport` + `TimeBalanceTargetTimeReportRow`]

Lignes : **les collaborateurs actuels**, même sans STAFFTARGETTIME (prévues et report valent alors 0), puis Total.

| Colonne [lib] | Sans « mois » | Avec « mois » = M |
|---|---|---|
| H. saisies | Σ TIMEPERIOD de *y* | Σ jusqu'à `TIMEMONTH ≤ M` inclus |
| H. prévues | Σ TARGETHOURS0..11 | Σ TARGETHOURS0..M |
| Solde | **H. prévues − H. saisies** | idem |
| Report des heures suppl. | `R`, valeur complète, **non proratisée**, arrondie à 2 décimales | idem |
| Total | **H. prévues − R − H. saisies** | idem |

- **Attention au signe** : ici, un nombre positif signifie des heures manquantes, un nombre négatif des heures supplémentaires. C'est l'inverse de « Solde des heures ».
- Pratique observée au bureau : `R(y) = −Total(y−1)` dans 20 cas sur 21. L'exception est l'ID 2754 en 2025 (départ) [don]. C'est DÉDUIT, et ce n'est pas une fonction de l'original.

**Famille C : Situation des vacances**

Lignes : collaborateurs actuels, triés par `HOLIDAYBALANCEYEAR`, puis par nom, puis Total.

Colonnes : Collaborateur | Année | Droit aux vacances | Vacances saisies | Solde.
- Année = `HOLIDAYBALANCEYEAR`, vide si ≤ 0.
- Droit = `HOLIDAYBALANCE`.
- Vacances saisies = Σ ISHOLIDAY de l'année `HOLIDAYBALANCEYEAR`.
- Solde = Droit − Vacances saisies.
- Si l'année est ≤ 0 : 0 et 0, sans ajout au Total.

**L'année affichée ne joue aucun rôle.** `STAFF.HOLIDAYS` n'est pas utilisé. `hrHoliday` (ligne 1679) ne doit **pas** être réutilisé : il calcule un report pluriannuel qui n'existe pas dans ce rapport.

### 9.4 Impression et export

« Afficher le rapport… » imprime exactement le modèle affiché. Seul champ texte disponible : `reportYear`. **Le mois de référence n'est pas imprimé.** Pour « Situation des vacances », l'année imprimée est vide.

Chaque document a une bande Titre (« `reportTitle` + ' ' + année » à gauche, police titre ; date longue à droite) et une bande Tableau. La dernière ligne utilise le style total. [doc] :

| Catégorie | Type | Titre | Page | Colonnes (largeur relative) |
|---|---|---|---|---|
| Durée prévue | managementStaffTargetTimeReport | Collaborateurs : heures à effectuer | A4 Paysage étroite | Collaborateur 20, mois 12, trimestres et année 18 |
| (+) appoint | managementStaffTargetTimeOvertimeReport | Collaborateurs : heures à effectuer (+) heures d'appoint | idem | idem |
| Heures saisies | managementStaffTimeReport | Collaborateurs : heures saisies | idem | idem |
| Solde | managementStaffTimeBalanceReport | Collaborateurs : Solde des heures à effectuer | idem | idem |
| Solde (+) appoint | managementStaffTimeBalanceOvertimeReport | Collaborateurs : solde des heures à effectuer y c. heures d'appoint | idem | idem |
| Heures supplémentaires | managementStaffTimeBalanceTargetTimeReport | Collaborateurs : heures supplémentaires | idem | Collaborateur 40 · **H. prévues (id 2)** · **H. saisies (id 1)** · Solde · Report des heures suppl. · Total, 20 chacune |
| Notes de frais | managementStaffExpensesReport | Collaborateurs : notes de frais | idem | comme les mensuels |
| Vacances saisies | managementStaffHolidayReport | Collaborateurs : vacances saisies | idem | idem |
| Situation des vacances | managementStaffHolidayBalanceReport | Collaborateurs : situation des vacances | **A4 Portrait étroite** | Collaborateur 40 · Année · Droit aux vacances · Vacances saisies · Solde, 20 chacune |

Export par la roue : copier ou CSV.

---

## 10. Maître d'ouvrage (`BuilderFrame`) : P1

**a) Accès.** MANAGEMENT ▸ entrée n° 5. Licence controle.

**b) Disposition** [bc + lib]

**Gauche, 200 px** : table « Maître d'ouvrage ».
- Elle contient les **adresses** (CONTACT) dont au moins une ligne PROJECTMEMBER a `CONTACT_ID = c` et `TEAMROLECODE = 8`. Seul le contact compte, pas le responsable.
- Requête `findContactsByTeamRole`, avec DISTINCT et sans ORDER BY, donc dans l'ordre de la base.
- DeltaSub : trier par `contactName` [D].

**Droite, barre d'outils.** `[Rapports ▾]` · `[Roue ▾]` · `[étiquette][Filtre ▾]`, avec les choix exclusifs « Afficher tout », **En cours** (défaut), Terminée, Archivée.

**c) Tableau** [lib `BuilderReportTableModel`]

| Colonne | Contenu |
|---|---|
| N° d'affaire | numéro |
| Affaire | titre |
| Prévision (h) | heures prévues |
| Facturable | montant |
| *(sans titre)* | monnaie de l'affaire |
| Coût de revient | montant |
| *(sans titre)* | monnaie principale |

**Lignes.**
- Une ligne par PROJECTMEMBER du MO choisi (`(CONTACT_ID = MO OR RESPCONTACT_ID = MO) AND rôle 8`) dont l'affaire a l'état du filtre. « Afficher tout » ne filtre pas : **y compris** Configuration et Archivée [bc, offset 68 : `getProjectState() == filtre`].
- Ordre de la base : DeltaSub triera par NUMBER [D].
- Puis une ligne « Total <monnaie> » par monnaie, en gras.

**d) Formules** [bc `BuilderReportTableModel.getReport`, offsets 106 à 285]
- Prévision (h) = Σ `PROJECTACTIVITYGROUP.TIMEBUDGET` de l'affaire, c'est-à-dire des **groupes d'activités**, pas des phases.
- Facturable = Σ `tlFee` de **toutes** les saisies de l'affaire, toutes périodes, **sans test ISCHARGEABLE**. C'est sans effet au bureau.
- Coût de revient = Σ `tlCost`.

**e) Graphique.** Aucun.

**f) Impression.** `managementBuilderReport`, « Maître d'ouvrage : liste des affaires », A4 Paysage.
- Informations : « Maître d'ouvrage » (`contactOwnerAndAddress`) et Date.
- Colonnes : N° (20) · Affaire (80) · ~~Prévision (h)~~ (40, **masquée**) · Facturable (40) · (15) · Coût de revient (40) · (15).

**g) Données** [don]
- 50 membres de rôle 8 sur 50 affaires ; 34 MO distincts ; 5 MO ont plus d'une affaire (au maximum 11).
- Aucune ligne n'a de `RESPCONTACT_ID`.

---

## 11. Reporting (`TimeReportFrame`) : P2 (non licencié au bureau ; vue existante à corriger)

Les formules sont celles du rapport « reporting », revérifiées sur les points clés. L'ordre des catégories suit l'enum [bc `iconst 0..4`] :
1. Chiffres-clés
2. Collaborateurs
3. Heures supplémentaires
4. Collaborateurs-affaires
5. Comparaison années

**Moteur `ActivityYear`** (catégories 1, 2 et 4)
- Pour chaque saisie :
  - `ISHOLIDAY` → vacances ;
  - sinon, activité null → **ignorée** ;
  - sinon catégorie selon `TYPECODE` : < 50 facturable ; < 90 non facturable ; ≥ 90 absence.
- `subTotal` = hors absences et hors vacances ; `grandTotal` = tout.
- Heures prévues : **seulement** `stafftargettime`.

**Chiffres-clés** : 15 lignes, dans cet ordre :
1. Heures facturables
2. Heures non facturables
3. Heures de présence
4. % Heures facturables
5. % Heures non facturables
6. *(ligne vide)*
7. Heures facturables
8. Heures non facturables
9. Heures d'absences
10. Heures de vacances
11. Total des heures
12. % Heures facturables
13. % Heures non facturables
14. % Heures d'absences
15. % Heures de vacances

**Heures supplémentaires** : il faut sélectionner un collaborateur. Lignes :
1. Heures prévues
2. Heures effectives
3. Solde des heures = effectives − prévues [bc `TimeBalanceReportTableModel.report`, offset 235]
4. Solde des heures cumulées de l'année, en gras
5. Solde + prise en compte du report des heures suppl., en gras, seulement si R ≠ 0. Vaut cumul + R (offset 294)

La colonne Total vaut décembre pour les lignes cumulées.

**Comparaison années** : corrections à apporter à `VIEWS['mgmt']` (lignes 1942 à 1976).

| Point | Aujourd'hui dans DeltaSub | Original |
|---|---|---|
| Années | les 8 années les plus récentes présentes | année choisie avec `< >` (défaut 2026), puis N ans en arrière (2, 3, 5 ou **10** ; défaut **5**), y compris les années vides |
| « +/- » | % par rapport à l'année plus ancienne | **différence en heures** par rapport à l'année de référence (case « Année de référence <année> » cochée par défaut, colonne surlignée), sinon par rapport à la colonne de gauche |
| Types d'activité | seulement ceux qui ont des heures | **les 12 types**, puis un bloc récapitulatif : 3 catégories, « Vacances », « Total général » |
| Saisie sans activité | comptée en type 0 | ignorée |
| Décimales | 1 | 2 |
| Graphique | Barres empilées par défaut | un modèle au choix ; **Courbes** par défaut |
| Filtres | aucun sur les affaires | filtre d'affaires (défaut « Affaire internes » + « En cours », ce qui donne une liste vide au bureau) |

**Impressions** : `managementTimeReport{KeyFigures|Staff|TimeBalance|Year|Compare}`, A4 Paysage étroite. Bande Informations : Date, Année, Collaborateur (et Affaire pour Year et Compare).

**Recommandation** : un lot séparé, après les P1. La première étape est de renommer « Statistiques » en « Reporting » et d'afficher la liste « Catégorie ».

---

## 12. Valeurs de contrôle

Calculées par `verif.py` et `verif2.py` selon les règles prouvées, sur les CSV du 28.09.2026 (base de test `DELTASUB_DB = dstest`, mêmes volumes). La base de production a pu recevoir de nouvelles saisies : **tester sur la base de test**.

### 12.1 Collaborateurs (§9)

| Rapport | 2025 | 2026 (année par défaut) |
|---|---|---|
| Durée prévue : lignes / T1 / T2 / T3 / T4 / Année | 8 / 3'478.20 / 2'896.80 / 2'959.70 / 2'883.20 / **12'217.90** | 5 / 2'582.30 / 2'540.65 / 2'707.25 / 2'707.25 / **10'537.45** |
| (+) heures d'appoint : Année | 12'217.90 | 10'537.45 |
| Heures saisies : lignes / T1 / T2 / T3 / T4 / Année | 8 / 3'115.00 / 2'164.50 / 2'813.50 / 2'752.75 / **10'845.75** | 5 / 2'163.00 / 2'057.25 / 2'065.00 / 127.50 / **6'412.75** (T4 = vacances planifiées) |
| Solde des heures, et solde avec appoint : Total année | **−1'372.15** | **−4'124.70** |
| Vacances saisies : lignes / Année | 7 / 1'079.50 | 4 / 559.50 |
| Notes de frais : lignes / Année CHF | 5 / 8'121.52 | 3 / 1'030.70 |
| Heures suppl., 5 actifs, sans mois : saisies / prévues / Solde / Report / Total | 8'660.50 / 9'254.80 / 594.30 / 397.20 / **197.10** | 6'412.75 / 10'537.45 / 4'124.70 / 0.00 / **4'124.70** |
| Heures suppl., mois = août (7) | 5'209.00 / 5'672.90 / 463.90 / 397.20 / 66.70 | 5'634.00 / 6'955.55 / 1'321.55 / 0.00 / 1'321.55 |
| Heures suppl., mois = septembre (8, défaut de la liste) | 6'129.75 / 6'547.55 / 417.80 / 397.20 / 20.60 | 6'285.25 / 7'830.20 / 1'544.95 / 0.00 / 1'544.95 |
| Situation des vacances (5 actifs, année 2025 pour tous ; indépendante de l'année affichée) | Droit 917.29 / saisies 864.75 / Solde **52.54** | identique |
| Liste | 5 lignes : STAFF 2752, 2753, 2801, 2901, 3051 | idem |

- Actifs : STAFF 2752, 2753, 2801, 2901, 3051 [don].
- Aucune ligne n'a `OVERTIME > 0`.
- Aucune ligne n'a de `TARGETTIMEREDUCTION` pour 2026.

### 12.2 Controlling (§5)

| Rapport | Réglage | Résultat : h / Facturable / Coût / (Facturé) |
|---|---|---|
| Collaborateurs - Affaires | 2026 (défaut) | 5 collaborateurs, 56 lignes collaborateur × affaire, 32 affaires : **5'853.25 / 3'746.25 / 358'198.75** |
| Collaborateurs - Affaires | 2025 | 8 collaborateurs, 43 affaires : 9'766.25 / 80'696.25 / 753'845.00 |
| Collaborateurs - Affaires | 2024 | 9 collaborateurs, 45 affaires : 11'189.25 / 105'156.68 / 889'357.25 |
| Affaires - Collaborateurs | filtre arrêté (défaut), toutes années | 106 affaires, 348 lignes : **55'673.50 / 777'782.34 / 4'027'682.01** ; Facturé 259'028.02 ; un seul Total général (CHF) |
| Affaires - Collaborateurs | janvier–décembre 2025 + « Affaires en cours » (états 2 et 3) | 32 affaires : 8'845.00 / 35'640.00 / 682'458.75 |
| Affaires - Collaborateurs | janvier–décembre 2026 + « Affaires en cours » | 32 affaires : 5'853.25 / 3'746.25 / 358'198.75 |
| Affaires - Phases | les 46 affaires « En cours » sélectionnées, « Toutes y.c. » **décoché** | 44 blocs ; Σ H. saisies 37'923.00 ; Σ H. prévues **16'663.01** ; Prévision d'honoraires 2'091'354.52 ; Facturable 263'958.75 ; Coût 2'797'149.95 ; Facturé 47'823.75 ; 9'939 saisies « Pas de phase » |
| Affaires - Phases | idem, « Toutes y.c. » **coché** | 46 blocs ; Σ H. prévues **16'685.01** ; Prévision 2'094'054.52 |
| Affaires - Activités | idem | Σ H. prévues (groupes) 11'704.72 ; Prévision 2'149'067.00 |
| Rapport des heures | affaire 1651 | 43 colonnes mensuelles (03.2023 → 09.2026) |
| Rapport des heures | affaire 501 | 69 colonnes (01.2021 → 09.2026). C'est le **maximum** au bureau, et non « environ 90 » |

### 12.3 Maître d'ouvrage (§10)

| Filtre | Lignes | MO avec au moins une ligne | Prévision (h) | Facturable | Coût de revient |
|---|---|---|---|---|---|
| En cours (défaut) | 25 | 17 | 11'705 (11'704.72) | 263'959 | 1'754'103 |
| Afficher tout | 50 | 34 | 20'686 | 670'390 | 2'690'647 |

La liste de gauche compte 34 MO.

### 12.4 Heures (§4) : affaire de test ID 1651 (« En cours », budgétée)

Pour toutes les périodes :
- 3'661.00 h ; Facturable 0.00 ; 8 collaborateurs.
- **Affaires - Phases** : H. prévues 1'354.90 ; Solde **−2'306.10**. Deux phases de NUMBER « 0 », fusionnées dans l'original (§2.5).
- **Affaires - Activités** : H. prévues 1'355.40 ; Solde −2'305.60.
- Détail par phase (h saisies / h prévues) : 3 → 1'062.75 / 440.00 · 4 → 1'028.00 / 243.90 · 5 → 1'477.00 / 671.00 · Pas de phase → 2.50.

### 12.5 Genres d'affaires et Reporting

**Genres** : 22 liens ; 16 visibles avec « Afficher tout ».

**Reporting, Chiffres-clés pour tout le bureau :**

| Ligne | 2025 | 2026 |
|---|---|---|
| Heures facturables | 8'550.25 | 5'454.00 |
| Heures non facturables | 883.25 | 312.50 |
| Heures de présence | 9'433.50 | 5'766.50 |
| % facturables (sur présence) | 90.64 | 94.58 |
| Heures d'absences | 332.75 | 86.75 |
| Heures de vacances | 1'079.50 | 559.50 |
| Total des heures | 10'845.75 | 6'412.75 |
| % facturables / non facturables / absences / vacances (sur le total) | 78.84 / 8.14 / 3.07 / 9.95 | 85.05 / 4.87 / 1.35 / 8.72 |

**Reporting, Comparaison années 2026, N = 5, référence cochée** :

| Année | Total général | +/- par rapport à 2026 |
|---|---|---|
| 2026 | 6'412.75 | 0.00 |
| 2025 | 10'845.75 | +4'433.00 |
| 2024 | 12'389.25 | +5'976.50 |
| 2023 | 11'127.75 | +4'715.00 |
| 2022 | 12'664.50 | +6'251.75 |

---

## 13. Points d'ancrage DeltaSub

`DeltaSub.html` compte **3 548 lignes** au commit 0eaf4db. Les numéros ci-dessous le concernent.

### Navigation et vues

| Élément | Ligne(s) | Usage |
|---|---|---|
| `NAV` / Management | 335–345 / **343** | remplacer par la NAV du §1.4 |
| `VIEWS`, `buildNav`, `go`, `hit` | 346, 348, 359–367, 371 | enregistrer les 6 vues et l'alias `mgmt` |
| Démarrage `go(ds_view)` | 3540 | raison de l'alias |
| `VIEWS._todo` | 376 | ne plus y tomber |
| `VIEWS['config']` | 1898–1906 | modèle de `mgCatView` (`col(230)` + `grid` « Catégorie ») |
| `VIEWS['mgmt']` + `MG`, `ACT_CAT` | 1942–1976 | devient `mg-reporting` (§11) |

### Interface

| Élément | Ligne(s) | Usage |
|---|---|---|
| `h`, `esc`, `num`, `hrs`, `dfr`, `diso`, `cmp`, `toast` | 137–152 | formats (arrondir avant `num`) |
| `ibtn`, `setTools`, `popMenu`, `dialog`, `confirmDlg` | 250, 255, 258, 270, 283 | barre d'outils, menus, dialogue « Editer le filtre » |
| `grid` (multi, sort:null, onSel), `gridSel`, `phead`, `seg`, `col` | 288, 319, 321, 328, 330 | tableaux, sélection multiple d'affaires |
| `tableText`, `copyTable`, `csvTable` | 742, 745, 746 | roue « Copier » / « CSV » |
| `formRows` | 1125 | dialogues |

### Référentiels

| Élément | Ligne(s) | Usage |
|---|---|---|
| `ownerName`, `contactName`, `staffName`, `staffList`, `projLabel`, `projects` | 387–392 | libellés, listes (trier par nom, sans SORTORDER) |
| `dayKey`, `tlKey`, `MOIS`, `MOISL` | 395–396, 401–402 | mois abrégés « janv. » pour les colonnes |
| `ownerOf`, `adrLines` | 436, 439 | MO et adresse (`contactOwnerAndAddress`) |
| `ME` | 405 | nom de l'utilisateur dans le pied de page |
| `collabView` (`P(s)`, `relOf`, `phone`) | 898–924 | Collaborateurs ▸ Liste |
| `rateAt` | 962 | coût de revient daté |
| `sumT`, `holidaysTaken` | 974, 995 | aides STAFFTARGETTIME et vacances |
| `PSTATE`, `ROLES` (8 = Maître d'ouvrage), `ACT_T`, `projActive`, `staffProjects` | 1105, 1108, 1117, 1120, 1122 | états, rôles, types d'activité. Attention : `projActive` (≠ 5) **n'est pas** `isActive()` (2 ou 3) : créer `pIsActive=p=>p.PROJECTSTATECODE>=2&&p.PROJECTSTATECODE<4` |
| `editProject` (clé `project_projectkind`) | 1131 ; **1167–1169** | corriger la clé (§3) |
| tri des genres | 1147 | ordre groupe puis genre |

### Montants et calculs existants

| Élément | Ligne(s) | Usage |
|---|---|---|
| `rateOfGroup`, `pcDate`, `pcAmount` | 1249, 1367, 1368 | tarifs, frais |
| `tlRate`, `tlFee`, `tlCost` | 1552, 1553 | montants de `mgItem` (ajouter les tests ISCHARGEABLE et ISCHARGED) |
| `ctlGroup` | 1638–1650 | **ne pas réutiliser tel quel** : il regroupe par nom (`nm`) et non par ID, sans niveaux ni tri NUMBER. Le remplacer par `mgItem` et, si possible, le faire passer lui-même par `mgItem` |
| avertissement « aucune activité n’a de tarif » | 1633 (`ctlAnalyse`) | à reprendre sous les tableaux du Controlling |
| `domainView` / `why` | 1482 / 1543 | politique Contrats et Factures → app Facturation |
| `targetFor` | 1664 | **à ne pas utiliser** en MANAGEMENT (repli sur TARGETTIME) |
| `hrMaps`, `hrHoliday` | 1669, 1679 | à ne pas utiliser pour Collaborateurs : `hrMaps` répartit par jours ouvrés, `hrHoliday` fait un report pluriannuel |
| `hrModel`, `hrPrint`, `VIEWS['h-rapport']` | 1695, 1758, 1766 | modèle d'objet rapport `R={title, cols, rows(_bold/_line…)}` et affichage `grid` avec `fmt` |
| `DP`, `dpTarget`, `dpSpt`, `dpModel` | 1802, 1812, 1815, 1818 | T(s,m) sans repli ; P2 Planification |

### Impression

| Élément | Ligne(s) | Usage |
|---|---|---|
| `TPL_TABLES`, `tplNeed` | 2805–2806 | charge `modeledocument` et `image` (Logo) |
| `MOIS_L`, `dLong` | 2979–2980 | date longue « 29 septembre 2026 », liste des mois en minuscules |
| `tplPrint`, `tplOr` | 3022, 3052 | P3 « [Ancien document] » ; `tplOr` pour attendre le chargement |
| `tpl-documents` | 3120 | exemple de lecture de `DS.T.modeledocument` |

### Nouvelles fonctions à créer

| Fonction | Section |
|---|---|
| `mgCatView` | §2.1 |
| `mgFilterReport` : `ReportFilter` + dialogue | §2.4 A |
| `mgProjFilter` | §2.4 B |
| `mgRender` : rendu gras, niveaux, couleurs | §2.3 |
| `mgItem` | §2.5 |
| `mgDoc` | §2.6 |
| `mgStaffYear(y)` : une passe sur timelog et projectcost → H, V, F par collaborateur et par mois | §9 |
| `mgTT(s,y)` : STAFFTARGETTIME sans repli | §9 |

### Rafraîchissement

`refresh` par vue :

| Vue | Tables à surveiller |
|---|---|
| Collaborateurs | `timelog`, `stafftargettime`, `staff`, `projectcost`, `contact` |
| Controlling et Heures | `timelog`, `project`, `projectphase`, `projectsubphase`, `projectactivitygroup`, `projectactivity`, `projectrate`, `staffrate`, `subproject` |
| Maître d'ouvrage | les tables de Controlling et Heures, plus `projectmember` |
| Genres | `project_projectkind`, `projectkind`, `projectgroup`, `project`, `projectmember` |

---

## 14. Incertitudes restantes et choix recommandés

1. **Garder Reporting ?**
   - Il n'est pas visible au bureau, mais la vue existe et les données sont riches.
   - **Choix recommandé :** le garder, renommé « Reporting », en dernier (P2). Le retirer serait une régression pour Paulo. À confirmer avec lui.
2. **Filtrer la navigation selon les droits ?**
   - Dans l'original, seul le superadmin voit MANAGEMENT.
   - DeltaSub n'implémente aucun droit : les Collaborateurs, par exemple, sont visibles par tous.
   - **Choix :** pas de filtrage dans ce lot. Option ultérieure : lire APPUSER_APPCOMPANYROLE, APPCOMPANYROLE_APPROLE et APPROLE (tables importées) pour masquer MANAGEMENT si l'utilisateur `ME` n'a ni 8,0 ni 0,0.
3. **Licence controle** (Controlling et Maître d'ouvrage) : DeltaSub n'a pas de licences. **Choix :** les afficher. Dans les faits, l'usage reste l'administrateur.
4. **Contrats honoraires, Planification RH, Factures dans la navigation ?**
   - **Choix :** non, par fidélité au bureau.
   - Contrats et Factures, jamais contre les données de Facturation.
   - Si Paulo le souhaite, une entrée renvoyant à l'app Facturation, comme `why` (ligne 1543).
5. **Impression.**
   - **Choix :** moteur `.dpdoc` générique (§2.6) pour « Afficher le rapport… ». C'est le menu principal de l'original, et un seul moteur sert tous les types.
   - Les « [Ancien document] » sont reportés (P3).
   - Incertitude : le rendu exact des styles de ligne (jeu `Default` des styles de tableaux) n'a pas été reconstitué au pixel près. On se limite au gras, aux filets et au fond alterné [D].
6. **Contenu des champs Filtres imprimés** quand le filtre est arrêté (`projectStateFilter`, `timeFilter`, `chargeableFilter`, `chargedFilter` de 5.2).
   - Non établi. Le texte est vraisemblablement vide, ou « Toutes les affaires » [D].
   - **Choix :** chaîne vide si le filtre est arrêté ; sinon le nom du statut, la période au format « janvier 2026 - décembre 2026 », et « oui » / « non ».
7. **Fusion des clés de même NUMBER ou SORTORDER** dans l'original. **Choix :** regrouper par ID (divergence documentée). Trois affaires sont concernées.
8. **Ordres non définis dans l'original** (liste des MO, lignes d'un MO, genres dans un groupe) : ordre de la base. **Choix :** nom du MO, NUMBER de l'affaire, SORTORDER du genre [D].
9. **Filtre d'affaires par défaut du Reporting** (« Affaire internes » + « En cours ») : il donne une liste vide au bureau, puisque la seule affaire interne est terminée et que l'affaire 501 (SUBSTANCES) n'est pas marquée interne. **Choix :** rester fidèle, mais afficher un message « Aucune affaire pour ce filtre ».
10. **Vacances planifiées dans le futur** (136 h après le 29.09.2026) : l'original les compte dans Heures saisies, Solde et Heures supplémentaires. **Choix :** fidélité, sans exclusion.
11. **Bouton « Reporter −Total vers TARGETTIMEREDUCTION de l'année suivante »** : il correspond à la pratique observée, mais n'existe pas dans l'original. **Choix :** ne pas le faire sans demande explicite.
12. **Licences Bâtiment** : ce n'est pas l'objet de ce lot. Constat : aucune activation au moment de la sauvegarde.

---

## Annexe A. Confrontation des 7 rapports : contradictions et affirmations tranchées à la source

| # | Affirmation | Rapport(s) | Verdict | Preuve |
|---|---|---|---|---|
| 1 | L'enum `Modules$Module` compte 35 valeurs | affaires | **Faux** : 50 constantes, dont MANAGEMENT aux ordinaux 26 à 34 | [bc `Modules$Module.<clinit>`] |
| 2 | La fonction « Direction » donne 4,8 **et 8,0** | navigation | **Faux** : APPROLE 351 = `"4,8;"`. Le jeu « Gestion » (8,0) n'est rattaché à aucune fonction. Seul le superadmin 2752 voit MANAGEMENT | [don APPROLE, APPCOMPANYROLE_APPROLE] |
| 3 | Ordre des catégories Collaborateurs, avec « Heures supplémentaires » en dernier | manuel, deltasub (ordre de Strings.db) | **Faux** : « Heures supplémentaires » est 7ᵉ, entre « Solde des heures avec heures d'appoint » et « Notes de frais » | [bc `EmployeeMenuTableModel$MenuItem`] |
| 4 | Ordre Reporting : Collaborateurs, Collaborateurs-affaires, Comparaison années, Chiffres-clés, Heures supplémentaires | deltasub | **Faux** : Chiffres-clés, Collaborateurs, Heures supplémentaires, Collaborateurs-affaires, Comparaison années | [bc `iconst 0..4`] |
| 5 | « Affaires en cours » = états 2 et 3 (affaires), contre états 2 à 4 (contrats) | affaires, contrats | **Les deux sont vrais**, dans deux écrans différents : Controlling utilise `isActive()` ; Contrats utilise « en cours et terminées », soit 2 à 4 | [bc `db.Project.isActive` ; JPQL ProjectContract] |
| 6 | « Report des heures suppl. : R en entier » | collaborateurs | **Imprécis** : la valeur est complète (non proratisée) et **arrondie à 2 décimales** (397.20 en 2025) | [bc `getTargetTimeReduction:D`, `Formatter.round`] |
| 7 | 2025 : Heures saisies 10'845.80 ; Solde −1'372.10 | collaborateurs | **Faux** : 10'845.75 et −1'372.15 | [don `verif.py`] |
| 8 | Impression « Heures supplémentaires » : « Heures prévues, Heures effectives » | deltasub (B4) | **Libellés bruts** : on imprime `customH` (« H. prévues », « H. saisies », « Solde ») dans l'ordre `sortOrder`, et la valeur est lue à l'indice `id`, donc les valeurs sont justes | [doc colonnes id/sortOrder/isHC ; bc `fillTable`] |
| 9 | En-têtes imprimés du Controlling Phases | affaires (« H. prévues… ») contre deltasub (« Heures prévues / effectuées ») | **Affaires a raison** grâce à `customH` : « H. prévues », « H. saisies », « Solde », « Prévision d'honoraires », « Prévision (-) facturable » | [doc] |
| 10 | Rapport des heures : « jusqu'à environ 90 mois » | affaires | **Faux** : 69 au maximum (affaire 501) | [don] |
| 11 | Total H. prévues Affaires - Phases = 16'685 | affaires | **Seulement avec « Toutes y.c. »**. Sans cette case : 16'663.01 (le total additionne les lignes de niveau 1 présentes) | [bc `add()` ; don] |
| 12 | DeltaSub : 3 368 lignes ; Heures sans Disponibilité | deltasub, navigation | **Périmé** : 3 548 lignes ; `h-dispo` existe ; lignes décalées (voir §13) | fichier au commit 0eaf4db |
| 13 | NAV à 9 entrées dans DeltaSub | affaires, contrats, deltasub | **Rejeté** pour la fidélité au bureau : 5 entrées plus Reporting conservé (P2) | §1.2 |
| 14 | Libellé du bouton radio de statut : « Filtré selon statut de l'affaire » | contrats | **Écrasé** par le nom du filtre (« Affaires en cours ») | [bc `ReportFilterDialog`, offsets 377 à 380] |
| 15 | « Liste » de Collaborateurs : les 11 colonnes du tableau à l'écran sont imprimées | collaborateurs | **Nuancé** : le `.dpdoc` `staffList` a 20 colonnes, dont 11 visibles, qui ne sont pas celles de l'écran (Entité et adresse, Tél. privé, etc.) | [doc staffList] |
| 16 | Couleurs : vert (0,143,0), orange (255,144,0), rouge non précisé | affaires | **Complété** : rouge = `Color.red` (255,0,0) ; troisième niveau de surlignage (200,200,200,40) | [bc `ReportCellRenderer.<clinit>`] |
| 17 | Maître d'ouvrage : Facturable sans test ISCHARGEABLE | affaires | **Vrai** (offsets 238 à 257), mais sans effet au bureau (ISCHARGEABLE = 1 partout) | [bc + don] |
| 18 | « Heures » : pas de choix « Afficher tout » | affaires | **Vrai** : le cas `null` est inatteignable depuis l'interface | [bc `getProjectFilterPopupMenu`] |

**Lacunes comblées par ce document**
- Moteur d'impression (§2.6).
- Valeurs pour l'année par défaut, 2026 (§12).
- Effet de « Toutes y.c. » sur les budgets (§12.2).
- Clés en double (§2.5).
- Genres visibles : 16.
- Liste des MO : 34.
- Couleurs exactes.
- Pièges `targetFor`, `hrHoliday`, `projActive` et `ctlGroup` (§13).

---

## Annexe B. Plan de réalisation

1. **Lot 0.**
   - Corriger la clé `project_projectkind`.
   - NAV et alias `mgmt`.
   - Socle : `mgCatView`, `mgRender`, `mgItem`, `mgFilterReport`, `mgProjFilter`, `mgDoc`.
2. **Lot 1 : Collaborateurs** (§9). Tests §12.1.
3. **Lot 2 : Controlling** (§5), en commençant par les catégories 1 à 4, puis 5 et 6 avec le graphique. Tests §12.2.
4. **Lot 3 : Heures** (§4), puis **Maître d'ouvrage** (§10), puis **Genres d'affaires** (§3). Tests §12.3 à §12.5.
5. **Lot 4, P2 : Reporting** (§11), qui corrige la vue existante et ajoute les 4 autres catégories.
6. **Plus tard, P2 et P3** : Planification RH ; « [Ancien document] » ; Contrats et Factures, jamais contre Facturation.

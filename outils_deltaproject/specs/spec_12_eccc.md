# Cahier des charges — Module eCCC-Bâtiment « Mes estimations eCCC » dans DeltaSub

Ce cahier décrit comment reproduire dans `DeltaSub.html` le module BÂTIMENT ▸ « Mes estimations eCCC » de Deltaproject (`deltaproject.costplanning.*`, dans DELTAbauad.jar). Il part de la première version de DeltaSub, qui est partielle (`VIEWS['coplan']`, `cpCompute`, `cpNew`, `cpEditor`).

**Légende.**
- `[P: …]` = PROUVÉ : bytecode `Classe.méthode@offset`, libellé de `Strings.db`, ligne de donnée ou page du manuel.
- `[D]` = DÉDUIT : interprétation cohérente, non vérifiée à l'instruction près.
- Les numéros de ligne DeltaSub sont ceux du 29.09.2026 (`DeltaSub.html`, 6 392 lignes).

**Sources confrontées.** Sept rapports : document, éléments, quantités référentielles, calcul des résultats, impressions, manuel, données. Les vérifications faites pour ce cahier sont dans `scratchpad/research/cp_critique_eccc/` :
- `jp.sh` (javap) ;
- `audit.py` (pertes de conversion sur les 13 fichiers bruts) ;
- les désassemblages `CPD.javap`, `CalcElements.javap`, `Init.javap`, `KeyFigureFrame.javap`, `OverviewTable.javap`, `VolumeTable.javap`, `ECD.javap`, `CPDD.javap`.

**Moteur de référence (normatif).** C'est `scratchpad/research/cp_elements2/cp_calc.py`. Il réimplémente `setGeneratedPositions`, `setRefCodes`, `CalcElements.calc`, `calcBookedElements` et `Refquantity.calcRefQuantities`.
- Relancé pour ce cahier avec `cp_check2.py`, il donne **0 écart** sur les documents 3, 101, 202 et 252. La comparaison porte sur les coûts, prix et quantités des éléments, des ouvrages et des sous-éléments, et sur les quantités référentielles calculées.
- `research/cp_module/a_recalc.py` donne le même résultat sur les 5 369 éléments des 13 documents.

---

## 0. Arbitrages entre les rapports (tranchés à la source)

| # | Sujet | Affirmations divergentes | Verdict | Preuve |
|---|---|---|---|---|
| 1 | Barre latérale | 5 sections, ou 6-7 (manuel DE, `spec_5` §16.2 : CALCULS, DONNÉES DE L'AFFAIRE, Groupes, Unités fonctionnelles, Données de base, IFC) | **5 sections** : QUANTITES REFERENTIELLES ▸ Editer · ELEMENTS ▸ Editer, Documents · APERCU ▸ Editer · CHIFFRES CLEFS ▸ Editer · CALCUL DES RESULTATS ▸ Editer | [P: `MenuTree$Menu.<clinit>` (refCodes, elements, overView, keyFigures, afterCalculation) ; `MenuTree$SubMenu` (refCodesEdit, elementsEdit, elementsDocuments, overViewEdit, keyFiguresEdit, afterCalculationEdit) ; `MenuTreeOld` : 0 référence (recherche binaire dans DELTAbauad.jar et DELTAproject.jar)] |
| 2 | « Données de l'affaire » | section de l'arbre, ou menu | Menu **Editer ▸ Données de l'affaire…** (`ObjectDialog`) | [P: `CostPlanningDialog.initComponents@8857-8889`] |
| 3 | Licence du module | `DELTAeBKP` ou `DELTAcostPlanning` | **`DELTAeBKP`** (« DELTAproject.eCCC »). `DELTAcostPlanning` (« DELTAproject.estimation eCCC ») n'est pas celle du module | [P: `Modules$Module.<clinit>@402-413`] |
| 4 | Nom du domaine d'affaire | « Détermination des coûts » (`spec_5`), « Calcul des coûts » | **« Calcul des coûts »**, entre « Liste de distribution » et « Devis général ». « Détermination des coûts » est le titre de la fenêtre | [P: `MenuTableModel$MenuItem.<clinit>@270-298` (planDistribution, costPlanning, costEstimate) ; libellés `MenuTableModel.costPlanning`, `CostPlanningDialog.dialogTitle`] |
| 5 | Taux de TVA du calcul | « premier élément Z » ou « dernier Z non nul » | **Dernier élément dont le code commence par « Z » et dont le prix est ≠ 0** (la boucle ne s'arrête pas au premier). Pour un Z avec ouvrages : le prix **de l'élément** est retenu dès qu'un ouvrage a un prix ≠ 0 | [P: `CalcElements.calcBookedElements(LinkedList,boolean)@0-124`] |
| 6 | Arrondi des chiffres clefs | 0,01 (rapport QR) ou 0,05 (manuel : 0.70) | **Écran CHIFFRES CLEFS : 0,01.** Impression (ELEMENTS ▸ Documents) : arrondi du document, soit 0,05 si « Arrondir » | [P: `KeyFigureFrame.setKeyFiguresTable@53` (`iconst_0`) ; `CostPlanningDialog.setMenu@263-276` et `@472-485` (`doRound()`)] |
| 7 | Colonne « CHF/m² SP » | vide dans l'original (rapports données et impressions), ou FA (rapport aperçu) | **Écran APERCU : grandeur `FA`**, car le catalogue eCCC-Bât est en version 2022 > 2020. **Impression Vue d'ensemble : « SP » en français**, donc colonne vide avec les données du bureau | [P: `CostPlanningDialog.<init>@361-439` (`isNewCatalogNorm` → "FA") ; `CatalogVersion.<init>@31-37` (`getVersion() > 2020`) ; `OverviewTable.<init>@135-159` ("GF"/"SP" sans test de norme)] |
| 8 | Menu de « Importer les présentations… » | Fichier (rapport impressions) ou Editer | **Editer**. Ordre : Configuration… · Données de l'affaire… · Importer les présentations… · séparateur · Système référentiel… (masqué) | [P: `CostPlanningDialog.initComponents@8810-8987`] |
| 9 | Statuts d'un document | « Définitif » (`spec_5`, DeltaSub) | **0 Brouillon · 1 Provisoire · 2 Validé · 3 Affaire de référence** | [P: `db.CostPlanningDocument$State.<clinit>` (draft, temporary, valid, referenceProject) ; libellés `db|CostPlanningDocument`] |
| 10 | Statuts du contrôle des coûts (utilisés par le Calcul des résultats) | DeltaSub `CC_STATE` l.2720 = {0 Créé, 1 Provisoire, 2 En cours, 3 Etat intermédiaire, 4 Terminée} | **0 Provisoire · 1 En cours · 2 Etat intermédiaire · 3 Terminé**. Les 3 contrôles du bureau à l'état 3 s'affichent à tort « Etat intermédiaire » | [P: `db.CostControlDocument$State.<clinit>` ; libellés `db|CostControlDocument`] |
| 11 | Sous-éléments perdus au niveau élément | « 7 éléments », « 9 SE », « 11 » | **7 éléments portant 9 sous-éléments**, plus 1 composant. Doc 3 : G02.02 (005, 009), G06.03 (002) · Doc 101 : D01.01 (003), G02.02 (009), G05.02 (000), G06.03 (002) · Doc 202 : G01.02 (000, 002). Les 2 SE par ouvrage du doc 252 sont conservés | [P: `audit.py`] |
| 12 | « Calcul définitif » perdu | « 3 éléments du doc 101 » | **Z01.01 des docs 3, 101 et 202** | [P: `audit.py`] |
| 13 | Textes `hint` | 637 / 3 129 | **637 renvois d'éléments** : textes du catalogue CRB, par exemple « Installations de chantier [B02] ». **3 129 `hint` de quantités référentielles**, tous égaux à la désignation (redondants) | [P: comptage sur les 13 bruts] |
| 14 | Table des composants de la base du bureau | « aucune table » (rapport manuel) | **`CONSTRUCTIONCOMPONENT` existe** (3 lignes, liée à `CONSTRUCTIONPART`) | [P: `APP.CONSTRUCTIONCOMPONENT.csv`, `schema.txt`] |
| 15 | Libellé du 2e article « Valeurs référentielles » | « …des sous-éléments et composants » | **« Valeurs référentielles des sous-éléments »** | [P: `CostPlanningFrame.constructionParts`] |
| 16 | Propositions « Origine du prix » | 6 ou 7 (avec OFS) | **6** : Offre, Prévision, Calcul, Estimation, Supposition, Base de données de prix. « Office fédéral de la statistique » existe dans les libellés mais n'est pas proposé dans le dialogue d'élément | [P: `ElementCalcDialog.getDisplayProposePriceOriginMenu@15-215`] |
| 17 | Système A/B | seulement eCCC-GC (manuel) | **Aussi eCCC-Bât** : Bât + A → 511, Bât + B → 514, GC + A → 512, GC + B → 513. Deux documents du bureau sont en 514 (2 et 51) | [P: `Init.initDocument@95-168` ; COSTPLANNINGDOCUMENT.ISREFERENCEBASEA] |
| 18 | Source des éléments d'un nouveau document | `EBKPELEMENT` ou catalogue de l'affaire | **Catalogue d'éléments de l'affaire** : `PROJECTCATALOG` de type 10, positions ≤ 1 point. `EBKPELEMENT` (410 codes, sans Z) est la structure de la **base de valeurs référentielles du bureau** | [P: `Init.initDocument@1-91` (`getProjectCatalogPositions`) ; libellé `CostPlanningFrame.eBKPElements`] |
| 19 | Présentations « Standard / Avec le calcul de prix / Avec des coûts » | tableau des éléments (`spec_5` §16.4) | **Tableau des quantités référentielles** (`refQuantityDisplayMode` 0/1/2) | [P: `CostPlanningDialog.jRefQuantityDisplayButtonActionPerformed`] |
| 20 | « Indice de forme » | colonne des éléments (`spec_5`) | **Aucune colonne** : libellé orphelin. La constante `ELEM_FQ_COL` porte le « [%] » | [P: rapport éléments, `desc.Columns`] |
| 21 | Base de la TVA | Z = taux × Σ(B…W) (`spec_5`) | **Z = taux × PSBY = Σ(B…Y)** | [P: `Refquantity.calcRefQuantities` ; doc 3 : 8,1 % × 647 900 = 52 479.90] |
| 22 | Fiche « Nouveau document » de `spec_5` §16.1 | Mots-clés, Langue, Date du prix, Variante, Catalogue… | **Libellés orphelins** de `NewCostPlanDialog`, classe absente des jars. La vraie fiche est `deltabauad.project.CostPlanningDocumentDialog` | [P: rapport document §3] |
| 23 | Bugs du calcul des volumes | VC/VB du graphique, ou ligne VB | **Deux bugs distincts**, ni l'un ni l'autre à reproduire. Impression : ligne VB = `100·VN/VB`. Graphique : série VC/VB = `100·VN/VC` | [P: `VolumeTable@1087-1115` ; `VolumeChartClass@198-216` (rapport QR)] |
| 24 | Ancien moteur d'impression « [Ancien document] » | « inaccessible, à ne pas reproduire » | **Visible au bureau**, car le réglage `isModuleFormVisible` vaut `[YES]`. Le bureau a ses propres modèles « Kostenermittlung » (groupes Substances et Substances_2). Le même réglage rend visible la catégorie « Texte libre » de la fenêtre Affichage | [P: `APP.SETTING` ID 801 ; `modeles.json` `projectTemplates/Substances/projectCostplannigElements/Kostenermittlung`] |
| 25 | Import BIMeq | non reproductible (licence) | **Import CSV générique de quantités** : reproductible, aucune donnée CRB en jeu. Le service BIMeq lui-même est hors périmètre | [D] |
| 26 | Anomalie du manuel C 5.1 (176 264 au lieu de 176 327) | non expliquée | Probablement un décalage de rafraîchissement : les quantités issues de montants ne sont recopiées qu'au `setRefCodes` suivant. Sans incidence | [D] |

---

## 1. Périmètre, licence, visibilité, place

### 1.1 Périmètre fonctionnel

- **Listes** : module « Mes estimations eCCC » et domaine d'affaire « Calcul des coûts ».
- **Fiche d'en-tête** et création conforme à `Init.initDocument`.
- **Fenêtre « Détermination des coûts »** :
  - les 5 sections de l'arbre ;
  - les menus Fichier et Editer (Configuration, Données de l'affaire, Importer les présentations) ;
  - la fenêtre « Affichage ».
- **ELEMENTS** : arborescence, 27 colonnes, présentations et filtres, ouvrages, sous-éléments, composants, attribution CFC, niveau de saisie, moteur exact, documents et images.
- **QUANTITES REFERENTIELLES** : lignes de calcul, grandeurs calculées et personnalisées, import CSV.
- **APERCU**, avec la répartition CFC 0-9 / 1-9 et le graphique.
- **CHIFFRES CLEFS** : unités fonctionnelles, volumes, énergie grise.
- **CALCUL DES RESULTATS** : postcalculation à partir d'un contrôle des coûts terminé.
- **Valeurs référentielles** : d'une autre affaire, des calculs précédents, de la base du bureau.
- **Impressions** : nouveau document `.dpdoc` et ancien document.
- **Passerelles** : « Créer un devis selon le CFC » ; export CSV ; export SIA 451 en option.

### 1.2 Place dans DeltaSub

| Élément | Original | DeltaSub à faire |
|---|---|---|
| Module | BÂTIMENT ▸ **« Mes estimations eCCC »**, 1er article, avant « Mes devis » et « Contrôle des coûts » [P: `Modules$Module.<clinit>`, ordre 22 < 23 < 24 < 25 ; libellé `module_constructionCostPlanning`] | Dans `NAV` l.345, mettre `['coplan','Mes estimations eCCC']` en tête de `Bâtiment`. L'identifiant de vue `coplan` est conservé |
| Domaine d'affaire | « Calcul des coûts » après « Liste de distribution » [P: n° 4 du §0] | Dans `DOMAINS` l.1474-1475, insérer `'Calcul des coûts'` avant `'Devis général'`. L'ajouter à `domainUsed` l.1495. Ajouter une branche dans `domainView` l.1499 (liste intégrée, §3.1) |
| Titre de la fenêtre | « Détermination des coûts - <Nom> (<N°>) » | idem (§3.4) |

### 1.3 Visibilité et droits

- **Original.**
  - Le module est visible avec la licence `DELTAeBKP`.
  - Le domaine est visible avec le droit `construction` et le module.
  - La modification est permise si le document n'a pas d'utilisateur, si c'est l'utilisateur courant, ou si le réglage « Bâtiment » l'autorise [P: `Rights.checkRigth@1-32`].
  - Réglage du bureau : `areBauadDocsLocked=[NO]`, donc tout le monde modifie [P: `APP.SETTING`].
  - Message de refus : « Vous n'avez pas les droits pour modifier ce document. » [P: `deltaproject.costplanning.data|Rights|msg`].
- **DeltaSub.**
  - Le module est toujours visible (DeltaSub ne gère pas de licences).
  - Tous les utilisateurs modifient.
  - Garder quand même le contrôle de droits sous forme d'une fonction `cpCanEdit(doc)` qui renvoie `true`. On pourra ainsi activer plus tard l'option « Seulement des documents personnels sont éditables ».

### 1.4 Licence des contenus (tranchée)

| Catégorie | Contenu | Décision | Justification |
|---|---|---|---|
| **Reproductible** | Structure eCCC-Bât **niveaux 1 à 3** : codes, libellés, unités, paire de grandeurs A/B (`PROJECTCATALOGPOS.UNIT`) | Oui, **comme données du bureau**, jamais codée en dur dans `DeltaSub.html` | Déjà dans les données du bureau (4 catalogues de type 10, `EBKPELEMENT`, 13 documents) ; autorisé par la consigne |
| Reproductible | Grandeurs référentielles SIA 416 / eCCC : codes, libellés, unités, UN/ECE (511 : 237 grandeurs ; 514 : 261) | Oui, tirées des documents et des catalogues du bureau | Consigne |
| Reproductible | Calculs, dialogues, présentations, messages, mises en page | Oui | Logique de l'application |
| Reproductible | Valeurs saisies par le bureau : prix des 13 documents, `STATISTICALVALUE` (4), `CONSTRUCTIONPART` (2), `CONSTRUCTIONCOMPONENT` (3), résultats de postcalculation | Oui | Données du bureau |
| Reproductible (données du document seulement) | Sous-éléments et composants **déjà saisis** dans les documents du bureau, y compris les numéros 000-099 issus d'eCCC-gate (par exemple doc 101 D01.01/003 « Installation photovoltaïque non intégrée ») | Oui, dans le document ; **jamais proposés comme catalogue** | Données du document |
| **Non reproductible** | Fichier `gate` (catalogue eCCC-gate, environ 795 Ko par document) ; **niveaux 4 et 5 de `PROJECTCATALOGPOS`** (1 824 + 7 958 positions par catalogue, déjà importées dans la base DeltaSub) | Non : ne jamais les lister ni les proposer | Licence CRB [P: `CostPlanningDocumentDialog.msg14/msg20` « … jusqu'au 3ème niveau »] |
| Non reproductible | Renvois `hint` des éléments (637) et `PROJECTCATALOGPOS.HINT` | Non : ne pas les convertir, ne pas les afficher | Textes du catalogue CRB |
| Non reproductible | Base de prix CRB, « Kennwert vom CRB », « Donnée du CRB », téléchargement de catalogue, « Importer le eCCC », Système référentiel, Types d'élément, contrôle des licences CRB, validation SIATEST en ligne | Non | Licence ou service CRB |
| Non reproductible | Descriptif selon le CAN (`CreateDevisDialog`) et mode de calcul « CAN » d'un sous-élément | Non. Les lignes CAN existantes restent en lecture seule (aucune dans les données) | Licence CAN du CRB [P: `CreateDevisDialog.msgCrb*`] |
| **Incertain** | Table eCCC → CFC intégrée au code (`EbkpToBpkTable`, 628 couples) et fichier `Costplanning/ebkpToBkp` (identique, 627 couples, `isUserProposal` faux partout) | Ne pas la coder en dur. Import facultatif du fichier comme donnée du bureau. L'apprentissage des choix de l'utilisateur est reproductible | [D] : il n'y a que des codes, mais l'origine CRB est probable |
| Incertain | Reprise de la structure niveaux 1-3 d'une affaire pour une autre affaire qui n'a pas de catalogue eCCC (DeltaSub n'attribue pas de catalogue) | À valider avec Paulo, car `PROJECTCATALOG.ISLICENCEREQUIRED=1` | §12 |

### 1.5 Hors périmètre

- Système référentiel (masqué en production) [P: `CostPlanningDialog.initDialog@1454-1479`].
- Types d'élément : les classes sont absentes des jars [P].
- Contrôles de licence.
- Bouton « lune » (`ModuleSelectionDialog`).
- `InformationFrame` et `SiaDocumentInfos` (code mort).
- CAN.
- Dialogue de fermeture sans enregistrement : DeltaSub enregistre à chaque modification.

---

## 2. Modèle de données

### 2.1 En-tête `costplanningdocument` (table COSTPLANNINGDOCUMENT, 13 lignes) — source unique de l'en-tête

| Colonne | Sens | Type, défaut | Règle |
|---|---|---|---|
| ID | clé, identique au dossier `Costplanning/<affaire>/<ID>` | entier (`DS.newIds`) | — |
| PROJECT_ID | affaire | entier | — |
| VERSION | « Nom » | texte ≤ 64, obligatoire | — |
| VERSIONNUMBER | « N° de version » | entier, 1 | — |
| STATECODE | statut | 0 à 3 (§2.10), 0 | — |
| USERID | « Utilisateur » : propriétaire, filtre de « Mes estimations » | texte ≤ 32 (`ME.id`) | — |
| CHANGEDDATE | « Date », saisie dans la fiche (ce n'est pas la date technique) | AAAA-MM-JJ, aujourd'hui | — |
| NOTE | « Note », imprimée comme « Information du document » | texte ≤ 1 024, sans espaces en tête ni en fin | — |
| ISMARKEDASDELETED | corbeille | 0/1, 0 | — |
| ISAPPLYSUBPROJECTS | « Estimation avec subdivisons » | 0/1, 0 | figé après création, sauf passage à 1 par « Subdivision… » |
| ISREFERENCEBASEA | grandeurs A (1) ou B (0) | 0/1, 1 | figé après création |
| DOCUMENTLOCK_ID | verrou | — | option (§3.10) |

Données réelles [P: CSV] :
- documents actifs : 152, 202, 252 et 301 ;
- tous au statut 0 et au N° 1 ;
- `ISAPPLYSUBPROJECTS=1` pour 2, 251 et 252 ;
- `ISREFERENCEBASEA=0` pour 2 et 51.

**Règle DeltaSub.** `costplanning.entete` n'est qu'une copie informative issue de la conversion. L'en-tête ne s'affiche et ne se met à jour **que** dans `costplanningdocument`.

Aujourd'hui, `cpEditor.save` écrase `USERID` avec `ME.id` à chaque enregistrement. C'est à corriger : l'utilisateur ne change que par la fiche.

### 2.2 Document `costplanning` (clé = ID) : Java → JSON v2

Principe : **toutes les clés v1 sont conservées avec le même sens**. Les clés v2 sont facultatives ; une clé absente vaut le défaut indiqué. On ajoute `schema: 2` dès que le convertisseur v2 ou DeltaSub a écrit le document.

| Java (`data.CostplanningDocument`) | Clé JSON | Type | Défaut à la création | v1 |
|---|---|---|---|---|
| — | `schema` | 2 | 2 | absente (= 1) |
| — | `id`, `projetId` | entiers | — | oui |
| en-tête | `entete{version,numeroVersion,statutCode,note,utilisateur,dateModification,supprime}` (+ `appliquerSubdivisions`, `referenceA` en v2) | informatif | — | oui |
| `fileName` | `source.fichier` | texte | — | oui |
| `docTitle` | `titre` | texte | « Estimation des coûts » [P: `Init.docTitle`] | oui |
| `docDate` | `date` | ISO | aujourd'hui | oui |
| `index` | `indice` | nombre | 100 | oui |
| `round` | `arrondir` | bool | true | oui |
| `devirationTotal` / `devirationSection` | `pourcentage` | `'totalGeneral'` \| `'groupePrincipal'` \| `'aucun'` (v2) | `'totalGeneral'` | oui (2 valeurs) |
| `erstellungsCostFrom/To` | `coutRealisation{de,a}` | lettres | B / W (L / W en GC) | oui |
| `bauwerksCostFrom/To` | `coutOuvrage{de,a}` | lettres | C / G (M / R en GC) | oui |
| `estimatePrecision` | `precision` | texte | '' | oui |
| `projectState`, `planningState` | `etatProjet`, `etatPlanification` | texte | '' | oui |
| `freeText1..5` | `textesLibres[5]` | textes | 5 × '' | oui |
| og des `divList` | `ouvrages[]` | codes | codes des subdivisions si l'option est cochée | oui |
| og/id/lg | `ouvragesDetail[{code,id,lg}]` | `id` = SUBPROJECT.ID, `lg` = '' | — | **v2** |
| `refQuantitySystemCode` (des éléments) | `systeme` | '511' \| '514' \| '512' \| '513' | selon le type de catalogue et `ISREFERENCEBASEA` | **v2** (v1 : déduit de l'en-tête) |
| `functionalUnit[]` | `unitesFonctionnelles[{nom,equation,unite,genre,afficher}]` | — | 7 unités (§5.8) | oui (complet) |
| `elemList[]` | `elements[]` | §2.3 | — | oui, partiel |
| `baseQuantityList[]` | `quantitesReferentielles[]` | §2.6 | — | oui, partiel |
| (calculé) | `totaux{coutInvestissement,coutRealisation,coutOuvrage}` | **cache** : jamais lu comme vérité | — | oui |
| `display{Subelements,Components,Remark,InternalNote,BKP,Oeko,Realisation,Description,Definitv,Options}InTable`, `showOnlyUsedPositions`, `showOnlyValuePositions` | `affichage{sousElements,composants,remarques,notesInternes,cfc,eco,execution,descriptions,definitifs,eventuelles,seulementUtilises,seulementAvecMontant}` | bools | true, true, puis false pour les 10 autres | **v2** |
| `displayCover`, `documentList[DocSorter{kind,display}]`, `anlageCostDisplay`, `erstellungsCostDisplay`, `bauwerkCostDisplay`, `displayAnlageCostBKPDisplay`, `rowHeight`, `title/standard/detailFontName/Size`, `templateId`, `doElemSort`, `doBkpSort`, `pageBreakList` | `impression{pageDeGarde, documents[{genre,afficher}], totaux{investissement,realisation,ouvrage,investissementCFC}, hauteurLigne, polices{titre,standard,detail:{nom,taille}}, modele, triElements, triCFC, sautsDePage[]}` | — | page de garde true ; documents [(1,f),(3,v),(2,v),(4,f),(5,f),(6,f)] ; totaux {true,false,false,true} ; hauteur 14 ; polices du bureau ; modèle 0 ; tri éléments true ; tri CFC false ; sauts [] | **v2** |
| `displayQuantiyCalculation`, `displayQuantiyComment`, `displayComponents`, `displayComponentsDescription`, `displaySubElements`, `displaySubElementsDescription`, `displaySubElementsSubmission`, `displayElementComment`, `displaySecondKAG`, `displayOeco`, `displayEventualPosition`, `displayElemSubprojects`, `displayOnlyThreeLevelPositions`, `displayDeviration`, `displayOnlyCosts`, `printImages`, `printInternalNotes`, `printRealisation`, `printDescription`, `doRound1/100/1000`, `doSpecialRound` | `impression.options{…}` (mêmes noms en camelCase français, §8.4) | bools | `displayElemSubprojects` et `displayDeviration` à true, le reste à false [P: constructeur] | **v2** |
| préférences du nouveau moteur (`documents/archive/*.json`) | `impressionDoc{subdivisions,sousElements,composants,deuxiemeStructure,eventuelles,arrondi,calculQR}` | — | true, true, false, false, true, 0, false | **v2** (dossiers `archive` vides au bureau) |
| `buildingVolume`, `nettoBuildingVolume`, `construcionVolume`, `utilityVolume`, `mainUtilityVolume`, `subUtilityVolume`, `trafficVolume`, `functionVolume` | `volumes{VB,VN,VC,VU,VUP,VUS,VD,VI}` | m³ | 0 | **v2** (docs 3 et 101 : 1500/1000/200/800/400/300/500/50) |
| `floorArea…constructionsArea` (8) | `surfacesSIA416{…}` | m² | 0 | v2, facultatif (tous nuls) |
| données de l'objet (§2.8) | `donneesAffaire{…}` | — | vide | **v2** |
| fichiers `afterCalcPayments` / `afterCalcElements` | `resultats{…}` (§2.9) | — | absent | **v2** (aucun au bureau) |
| `docs/*` | `annexes[{nom,fichier,taille}]` | — | [] | **v2** (doc 202 : `Export.csv`) |
| `siaDocumentInfos`, `maxVersion`, `version` | — | — | — | inutiles |

### 2.3 Élément `elements[]` (`data.Element`)

| Java | Clé | Type, défaut | v1 |
|---|---|---|---|
| `number` | `code` | 'A', 'A01', 'A01.01' | oui |
| `text1` (ou `text`) / `text2` | `libelle` / `libelle2` | ≤ 64 chacun | libelle oui, **libelle2 v2** |
| (longueur du code) | `niveau` | 1 (1 car.), 2 (≤ 3 car.), 3 (≥ 4 car.) | oui |
| `measUnit` | `unite` | texte | oui |
| `measUnits` « m² FCA \| m² FFMA » | `grandeursPossibles[{unite,code}]` | liste | **v2** |
| `refCode` / `uneCode` | `grandeurRef` / `uniteUNECE` | — | oui |
| `quantity`, `price`, `value` | `quantite`, `prix`, `cout` | nombres | oui |
| `fixedValue` | `coutFixe` | 0 | **v2** |
| `priceIsPourcent` | `prixEnPourcent` | bool | oui |
| `priceIsQuantityPourcent` | `prixEnPourcentQuantite` | bool. En v1, **le déduire** : vrai si `grandeurRef` ∈ {ACC11, ACC12, ACC13, ACC14, PV11, PV12, PV13} | **v2** (52 éléments : V01.01-04 × 13) |
| `isStandardPosition` | `standard` | bool | oui |
| `isGenerated` (transient) | `genere` | **ignoré à la lecture, recalculé** (§4.4.2) | oui, toujours faux |
| `isEventualPosition` | `eventuelle` | bool (V) | oui |
| `calculationIsDefinitiv` | `definitif` | bool (D) | **v2** |
| `positenIsFixed` | `niveauFixe` | bool (« Niveau de saisie ») | **v2** (doc 101 B08.01) |
| `positonIsUsedForCalculation` | `utiliserPourCalcul` | **true** [P: `Element.<init>@237`] | **v2** |
| `priceOrigin` | `origineprix` | ≤ 30 | **v2** |
| `remark` / `internalNote` / `description` | `remarque` (≤ 30) / `noteInterne` (≤ 1 024) / `description` (≤ 1 024) | — | oui |
| `submissionsText` | `execution` | ≤ 1 024 | **v2** |
| `greyEnergy`, `uValue`, `greenHouseEffect` | `energieGrise`, `coefficientU`, `effetSerre` | nombres | oui |
| `*Comment` | `commentaires{energieGrise,coefficientU,effetSerre}` | ≤ 30 | **v2** |
| `refQuantitySystemCode` | `systeme` | facultatif (celui du document suffit) | v2 |
| `kagList[KagItem]` | `cfc[{numero,pourcent,montant}]` | [] | **v2** |
| `subElementList` | `sousElements[SE]` (§2.5) | [] | **v2** (perdu au niveau élément) |
| `docDescList` / `imageDescList` | `documents[{nom,fichier}]` / `images[{nom,fichier}]` | [] | **v2** |
| `divList[Subproject]` | `parOuvrage[]` (§2.4) | — | oui, filtré |
| `hint` | — | **ne pas convertir** (CRB) | — |
| `afterCalcList` | dans `resultats` | — | — |
| `mPos`, `uPos`, `afterCalcValue`, `editionYear`, `isPageBreakBefore` | — (transients) | — | — |

Règle de lecture du coût (`getValue(true)`) : `gv(o) = o.coutFixe ? o.coutFixe : o.cout` [P: `Element/Subproject/SubElement.getValue(Z)@0-22`].

### 2.4 Ligne d'ouvrage `parOuvrage[]` (`data.Subproject`)

- **Clés v1 conservées** :
  - `ouvrage` (og) ;
  - `localisation` (lg), toujours vide : « Lagen sind nicht erlaubt » (manuel DE p. 65) ;
  - `ouvrageId` (SUBPROJECT.ID) ;
  - `grandeurRef`, `unite`, `quantite`, `prix`, `prixEnPourcent`, `prixEnPourcentQuantite`, `cout`, `coutFixe` ;
  - `eventuelle`, `definitif`, `origineprix`, `remarque`, `noteInterne` ;
  - `sousElements`, qui ne contient en v1 que numero, libelle, unite, grandeurRef, quantite, prix, cout et remarque.
- **Clés v2** :
  - `cfc[]`, `utiliserPourCalcul`, `niveauFixe`, `execution`, `description` ;
  - `energieGrise`, `coefficientU`, `effetSerre`, `commentaires` ;
  - `documents`, `images`, `uniteUNECE` ;
  - `sousElements` au schéma complet du §2.5.
- **En v2, toutes les lignes d'ouvrage sont conservées**, même à 0. En v1, seules les lignes non vides l'étaient (convertisseur l.964-965).
- **Règle de lecture** : une ligne absente vaut une ligne à 0 ; elle est créée au premier enregistrement.
- **Égalité** de deux lignes : même `ouvrage` et même `localisation` [P: `Subproject.equals`].
- **Rattachement** : relier par `ouvrageId` et afficher le code actuel de `subproject`. Exemple : dans le doc 252, l'ouvrage `EDP` correspond à la subdivision 654, qui s'appelle aujourd'hui `STU` [P: `APP.SUBPROJECT.csv`].

### 2.5 Sous-élément, composant, attribution CFC

**Sous-élément** (`data.SubElement`), clés :

| Clé | Sens / défaut |
|---|---|
| `numero` | 3 chiffres ; 100-999 pour une saisie DeltaSub |
| `libelle`, `libelle2` | textes |
| `unite`, `grandeurRef`, `uniteLocaux` | `uniteLocaux` = `spaceMeasUnit` |
| `quantite`, `quantiteFixe` | `quantiteFixe` = `quantityIsFixValue` |
| `prix`, `prixEnPourcent`, `cout`, `coutFixe` | nombres |
| `eventuelle`, `definitif` | bools |
| `modeCalcul` | 0 Sans calcul · 1 Calcul selon composants eCCC-gate · 2 Calcul selon CAN [P: `CalcKind$State.<clinit>`] |
| `origineprix`, `remarque`, `noteInterne`, `description`, `execution` | `execution` = `awardingText` [D] |
| `energieGrise`, `coefficientU`, `effetSerre`, `commentaires` | écologie |
| `dureeVie`, `intervalleEntretien`, `coutEntretien` | codes des listes du §2.10 |
| `locaux` | `spaceList`, conservé tel quel |
| `can` | `npkChapterList`, lecture seule |
| `cfc[]`, `composants[]`, `documents[]`, `images[]` | listes |

**Composant** (`data.Component`), clés :
- `numero`, `libelle`, `libelle2` ;
- `cfcNumero` (`bkpNr`) : un seul CFC, à 100 % ;
- `unite`, `quantite`, `prix`, `cout` (`costs`), `prixEnPourcent`, `eventuelle` ;
- `montantSeul` (`isCostPosition`, « Utiliser uniquement le montant ») ;
- `modeCalcul`, `remarque`, `noteInterne`, `description`, `can`, `documents`, `images`.

**Attribution CFC** (`KagItem`) : `{numero, pourcent, montant}`. Le montant est recalculé par le moteur (§4.6).

### 2.6 Quantité référentielle `quantitesReferentielles[]` (`data.BaseQuantity`)

| Java | Clé | Défaut | v1 |
|---|---|---|---|
| `refCode` | `code` | ≤ 7 caractères, en majuscules | oui ; **masquer `"null"`**, artefact présent dans tous les documents [P: `CPD.setRefQuantityTable@187-206`] |
| `text` | `libelle` | ≤ 60 | oui |
| `measUnit`, `uneCode` | `unite`, `uniteUNECE` | — | oui |
| `quantity` | `quantite` | 0 ; avec ouvrages, Σ des ouvrages | oui |
| `isStandardPosition` | `standard` | bool | oui |
| `refCodeForCalculation` | `codeCalcul` | ''. En v1, **le déduire** : `code` s'il fait partie de {PSBY, SSBW, SSBT, SSBJ, SSBI, SSA01, SSD, SD110} | **v2** (104 valeurs) |
| `isCalcualted` | `estCalculee` | false | **v2** (docs 2 et 202) |
| `refefenceElementList` | `elementsReference[]` | [] | **v2** (PA ← G02 ; SOS ← W01.02) |
| `remark` | `remarque` | ≤ 30 | **v2** |
| `internalRemark` | `noteInterne` | '' | **v2** |
| `calcIsDefinitiv` | `definitif` | false | **v2** |
| `calcList[CalcItem]` | `calcul[{formule,commentaire,quantite,sousTotal,genre}]` | [] | **v2 au niveau de la grandeur** (5 grandeurs : docs 1 FCA, 101 FCA, 3 BSA et FCA, 202 EWIA) |
| `refQuantitySystemCode` | `systeme` | — | v2, facultatif |
| `subProjectList[]` | `parOuvrage[{ouvrage,localisation,ouvrageId,quantite,definitif,noteInterne,calcul[]}]`, plus `remarque`, `codeCalcul` et `calcul[].genre` en v2 | toutes les lignes en v2 | oui, partiel (17 sur 1 428 pour le doc 252) |
| `hint` | — | = `libelle` (3 129 sur 3 129) | inutile |

Ligne de calcul (`CalcItem`) :
- `genre` ∈ {'' standard, 'r' arrondi à l'entier suivant, 'r5' arrondi au multiple de 5 suivant} [P: `RefQuantityKind`] ;
- `sousTotal` = colonne « M ».

### 2.7 Unité fonctionnelle `unitesFonctionnelles[]`

- Clés : `{nom, equation, unite, genre, afficher}`. La conversion est complète.
- `genre` (`keyFigureKind`) : 1 Caractéristiques de quantité · 2 Unités fonctionnelles · 3 Paramètre de coût selon eCCC · 4 Paramètre de coût selon CFC.
- `couts` est transient : il est recalculé et jamais stocké.

### 2.8 `donneesAffaire` (Editer ▸ Données de l'affaire)

```
donneesAffaire: {
  designation: '',                       // projectDesc.text
  lieu: {npa:'', localite:'', lignes:''},// standortDesc{postalcode,location,text}
  genre: {numero:'', texte:''},          // objectKindDiv{oagNumber,text}
  intervenants: [{role:'', adresse:'', contactId:null}], // projectMembers
  delais: [{designation:'', echeance:''}],               // terminDocumentList (30 car. chacun, obligatoires)
  affectation: '', descriptionAffaire: '', descriptionConstruction: '',
  documents: [{nom:'', fichier:''}], images: [{nom:'', fichier:''}],
  parOuvrage: { '<ouvrageId>': { /* mêmes clés */ } }    // listes …Subprojects indexées par ogCode
}
```

Données réelles [P: rapport document §10.2] :
- une désignation dans les docs 1, 3 et 101 ;
- un intervenant dans les docs 3 et 101 ;
- un document externe dans le doc 202.

Les intervenants sont des contacts professionnels, rattachés par `contactId` quand il existe.

### 2.9 `resultats` (Calcul des résultats)

```
resultats: {
  source: {ccId, date},                                   // contrôle des coûts importé (statut 3 Terminé)
  paiements: [{refNum, lot, lotTexte, numero, datePaiement, facture, dateFacture, entreprise, genre,
               description, net /*TTC*/, tva, lignes:[{refNum, cfc, ouvrage, localisation, net, tva}]}],
  instantane: [{code, libelle, unite, grandeurRef, quantite, genere, pct, eventuelle,
               parOuvrage:[{ouvrage, localisation, quantite, pct, eventuelle}]}],
  attributions: [{code, ouvrage, localisation, paiement /*Pay.refNum*/, ligne /*BkpDetail.refNum*/,
                 cfc, pourcent, ht, tva, remarque}]
}
```

- `instantane` fige la structure du document au moment de l'import. Aucun prix ni montant n'y est copié [P: `CalculationFrame.extractPaymentList@874-1188`].
- Rien n'existe au bureau : aucun fichier `afterCalc*`, et `afterCalcList` est vide dans les 13 documents [P].

### 2.10 Énumérations

| Énumération | Valeurs |
|---|---|
| Statut du document | 0 Brouillon · 1 Provisoire · 2 Validé · 3 Affaire de référence |
| Statut du contrôle des coûts | 0 Provisoire · 1 En cours · 2 Etat intermédiaire · 3 Terminé |
| `DocumentKind` (sections imprimées) | 1 Quantités référentielles · 2 Eléments · 3 Coûts sommaires · 4 Volumes · 5 Surfaces · 6 Évaluation écologique [P: `DocumentKind$Kind`] |
| `keyFigureKind` | 1 à 4 (§2.7) |
| `modeCalcul` | 0 / 1 / 2 (§2.5) |
| `CalcItem.genre` | '' / 'r' / 'r5' |
| Système | 511 Bât-A · 514 Bât-B · 512 GC-A · 513 GC-B |
| Origine du prix | Offre · Prévision · Calcul · Estimation · Supposition · Base de données de prix (texte libre ≤ 30) |
| `pourcentage` | totalGeneral · groupePrincipal · aucun |
| Durée de fonctionnement | 10 ans · 10-20 ans · 20-30 ans · > 30 ans |
| Intervalle d'entretien | une fois par an · tous les 5 ans · tous les 10 ans · au besoin (libellés de `Strings.db`) |

### 2.11 Tables de référence

- **`projectcatalog` / `projectcatalogpos`** (catalogue de l'affaire) :
  - type 10 « eCCC-Bât », version 2022, `ISLICENCEREQUIRED=1`, pour les affaires 501, 2451, 2951 et 3601 ;
  - 10 195 positions [P: CSV] : 85 codes sans point (niveaux 1-2) et 328 codes à 1 point (niveau 3), soit **413** ; puis 1 824 codes à 2 points et 7 958 à 3 points ;
  - `UNIT` est un JSON `[A,B]`, par exemple `[{"U":"m²","D":"FCA","R":"Surface de revêtement de sol","C":"MTK"},{"U":"m²","D":"FFMA","R":"… selon maquette","C":"MTK"}]`. On prend l'index 0 si `ISREFERENCEBASEA`, sinon l'index 1 [P: `Init.initDocument@173-383`, découpe sur `},{`] ;
  - `CATALOGTYPECODE=0` désigne le catalogue CFC de l'affaire, déjà utilisé par le devis (l.2591).
- **`ebkpelement`** (410 codes, niveaux 1 à 3, sans Z) : structure de la base de valeurs du bureau.
- **`statisticalvalue`** : NAME, CONSTRUCTIONDESCRIPTION, DATASOURCE, REGIONCODE, UNIT, QUANTITY, UNITPRICE, PRICEINDEX, PRICEINDEXMONTH (0 à 11), PRICEINDEXYEAR, REMARK, EBKPELEMENT_ID.
- **`constructionpart`** : les mêmes champs, plus NUMBER, BKP, DESCRIPTION, EMBODIEDENERGY, GREENHOUSEEFFECT, UVALUE.
- **`constructioncomponent`** : NUMBER, NAME, UNIT, QUANTITY, UNITPRICE, BKP, DESCRIPTION, SORTORDER, CONSTRUCTIONPART_ID.
- Ces collections sont **déjà importées dans DeltaSub et encore inutilisées**.

### 2.12 Pertes de conversion et correctif

#### 2.12.1 Inventaire des pertes (13 fichiers bruts, [P: `audit.py`])

| Donnée | Occurrences réelles | Impact |
|---|---|---|
| `Element.priceIsQuantityPourcent` | 52 (V01.01-04 × 13) | **Critique** : pour V01.01 du doc 252 (q 250 000, p 100), DeltaSub donnerait 25 000 000 |
| `Element.subElementList` | 7 éléments, 9 SE (§0 n° 11) | **Critique** : dans le doc 3, G02.02 vaut 80 000 grâce au SE 009 et à son composant 001 « Revêtement » (1 000 × 80). Avec le prix dérivé 53.35 = R(80 000/1 500), DeltaSub obtiendrait 80 025 |
| `SubElement.components` | 1 | Idem |
| `Element.kagList` / `SubElement.kagList` | 1 élément : 202 G01.01 → 277.2, 100 %, 24 000. 3 SE : 202 G01.02/000 et /002 → 277.1, 15 000 et 20 000 ; 3 G02.02/009 → 281.7, 80 000 | CFC 0-9, msg11, devis CFC |
| `BaseQuantity.refCodeForCalculation` | 104 (8 codes par document, plus PA et SOS) | **Critique** : la TVA, les honoraires et les provisions ne se recalculent plus |
| `BaseQuantity.isCalcualted` + `refefenceElementList` | 2 (doc 2 PA ← G02 ; doc 202 SOS ← W01.02) | Grandeurs personnalisées calculées |
| `BaseQuantity.calcList` au niveau de la grandeur | 5 grandeurs, 10 lignes | Lignes de calcul invisibles |
| `BaseQuantity.remark` / `internalRemark` / `calcIsDefinitiv` | 2 / 1 / 1 | Affichage |
| `Element.calculationIsDefinitiv` | 3 (Z01.01 des docs 3, 101, 202) | Colonne D |
| `Element.positenIsFixed` | 1 (101 B08.01) | Change les groupes générés |
| `Element.priceOrigin` | 2 (202 G01.01 « Prévision », Z01.01 « Base de données de prix ») | Traçabilité |
| `Element.submissionsText`, `docDescList` | 1 et 1 (202 G01.01 : « doc » → `Export.csv`) | Exécution, pièce jointe |
| `Element.measUnits` | tous | Choix de la grandeur (A/B) |
| `refQuantitySystemCode` | 511 × 11, 514 × 2 | Système |
| Réglages du document | `showOnlyUsedPositions` (3, 101) ; `displayBKPInTable` (3, 101, 202) ; `displayDescriptionInTable` (202) ; `*CostDisplay` (301 : réalisation et ouvrage vrais, investissement faux) ; `documentList` (identique dans les 13) | Présentation et impression |
| Volumes SIA 416 | docs 3 et 101 | CHIFFRES CLEFS |
| Données de l'objet | désignation dans 3 documents ; intervenants dans 2 ; 1 document externe | Données de l'affaire |
| `divList` / `subProjectList` vides | filtrées | Affichage des ouvrages |
| `BkpDetail.refNum` (contrôle des coûts, `_ligne` l.245) | toutes les lignes | Clé d'attribution du Calcul des résultats |
| Fichiers | `docs/Export.csv` (202) ; `documents/element.dpdoc` (2951/1, 2951/3, 3601/301, 2451/202 = modèle jeu 1) ; `Costplanning/ebkpToBkp` ; copie manuelle `2451/202/costplanning_15.12.2025 10.11` | — |
| Sans perte en pratique | `Element.fixedValue` = 0 partout ; `isEventualPosition` de l'élément = faux partout ; `afterCalc*` vides | — |

#### 2.12.2 Correctif de `outils_deltaproject/convertir_couts.py` (`convert_costplanning`, l.944-1042)

1. Supprimer la fonction interne morte `ouvrages()` (l.948-958).
2. Écrire quatre fonctions communes :
   - `_se(x)` (sous-élément) et `_comp(c)` (composant), avec toutes les clés du §2.5 ;
   - `_cfc(lst)` → `[{numero, pourcent, montant}]` ;
   - `_calc(lst)` → `[{formule, commentaire, quantite, sousTotal, genre: txt(x,'id')}]`.
3. **Élément** : ajouter
   - `libelle2`, `grandeursPossibles` (découper `measUnits` sur « | », puis sur le dernier espace), `coutFixe`, `prixEnPourcentQuantite` ;
   - `definitif`, `niveauFixe`, `utiliserPourCalcul`, `origineprix`, `execution`, `commentaires`, `systeme` ;
   - `cfc`, **`sousElements` = `[_se(x) for x in subElementList]`**, `documents`, `images`.
4. **Ouvrage** : ne plus filtrer (l.964-965). Ajouter `cfc`, `utiliserPourCalcul`, `niveauFixe`, `execution`, `description` et les champs d'écologie. `sousElements` utilise `_se` complet.
5. **Quantité** : ajouter `codeCalcul`, `estCalculee`, `elementsReference`, `remarque`, `noteInterne`, `definitif`, `calcul` (au niveau de la grandeur) et `systeme`. Garder toutes les lignes d'ouvrage. Ajouter `remarque`, `codeCalcul` et `genre` par ouvrage.
6. **Document** : ajouter
   - `schema: 2`, `pourcentage` à 3 valeurs, `systeme`, `ouvragesDetail` ;
   - `affichage`, `impression`, `volumes`, `surfacesSIA416`, `donneesAffaire` ;
   - `annexes` : lister `Costplanning/<P>/<ID>/docs/*`, comme `_annexes_dossier` le fait pour le contrôle des coûts ;
   - `entete.appliquerSubdivisions` et `entete.referenceA`.
7. **Contrôle des coûts** : dans `_ligne` (l.245), ajouter `("refNum", d.get("refNum"))`.
8. Facultatif : convertir `ebkpToBkp` en collection `ebkptobkp` (`{ebkp, standard, cfc:[{numero, proposition}]}`), sous la réserve de licence du §1.4.
9. Ne jamais lire `gate` ni `hint`.
10. **Vérification** : `verifier_planification` ne contrôle aujourd'hui que q × p par ouvrage. Le remplacer par un appel au moteur de référence porté sur le JSON v2 (`cp_calc` adapté aux clés françaises). Objectif : 0 écart ; sinon, le document est signalé dans le rapport.

#### 2.12.3 Protection au ré-import (`serveur_deltasub.py`)

- **Constat** [P: l.42-45, l.189-197, l.217-230] :
  - `PROTECTED` ne contient ni `costplanningdocument` ni `costplanning`, ni `costestimate*` ni `costcontrol*` ;
  - les documents convertis sont réécrits sans le test `kept` ;
  - conséquence : un ré-import (`--force`) marque supprimés les documents créés dans DeltaSub et écrase les modifications.
- **Correctif** :
  1. Créer `PROTECTED_IF_EDITED = {costplanningdocument, costplanning, costestimatedocument, costestimate, costcontroldocument, costcontrol}`.
  2. Calculer `kept2` **avant** l'`UPDATE … val=NULL`, parce que cet `UPDATE` remplace `who` par « import Deltaproject ». `kept2` = les enregistrements `(t,id)` avec `t` dans `PROTECTED_IF_EDITED`, `val` non NULL et `who ≠ 'import Deltaproject'`.
  3. Exclure `kept2` de cet `UPDATE`.
  4. Sauter les lignes CSV et les entrées de `documents/*.json` dont la clé est dans `kept ∪ kept2`.
- **Résultat** : un document non modifié dans DeltaSub est remplacé par sa conversion v2 ; un document modifié est conservé.

#### 2.12.4 Lecture des documents v1 (en mémoire, sans réécriture)

À l'ouverture d'un document sans `schema` :
1. déduire `prixEnPourcentQuantite` et `codeCalcul` (§2.3, §2.6) ;
2. prendre `systeme` dans `ISREFERENCEBASEA` ;
3. masquer le code « null » ;
4. recalculer ;
5. si un coût recalculé s'écarte du coût stocké de plus de 0,01, afficher « Document converti partiellement : réimporter depuis Deltaproject ». Le cas réel est le doc 3 G02.02, dont les sous-éléments ont été perdus. **Ne pas enregistrer** le recalcul de ces éléments sans confirmation.

---

## 3. Listes, fiche, fenêtre, configuration, affichage, données de l'affaire, subdivisions

### 3.1 Les deux listes (`deltaproject.costplanning.CostPlanningFrame` et `deltaproject.project.CostPlanningFrame`)

| | « Mes estimations eCCC » | Domaine « Calcul des coûts » |
|---|---|---|
| Lignes | documents avec `USERID === ME.id`, toutes affaires confondues [P: requête `getCostPlanningDocumentListByAppUser`] | documents de l'affaire [P: `Project.getCostPlanningDocuments`] |
| Colonne « Numéro d'affaire » | oui | non |
| Bouton « + » | choisit d'abord l'affaire (navigateur d'affaires), puis ouvre la fiche | affaire courante ; inactif sans affaire |
| Importer ▾ | — | « Importer un calcul des coûts d'une affaire… » (§3.7) |

**Colonnes** [P: `db.CostPlanningDocumentTableModel`] :
- verrou (icône) | [Numéro d'affaire] | Utilisateur | Date (`CHANGEDDATE`) | Version (`VERSION`) | N° de version | Statut | Notes ;
- DeltaSub peut garder « Coût d'investissement » comme colonne ajoutée, placée après Notes et signalée comme absente de l'original.

**Barre** : + · Dupliquer · Editer ▾ (« Editer… », « Ouvrir… ») · − · roue ▾ · **Valeurs référentielles ▾** · recherche.
- Roue : « Copier le contenu du tableau dans le presse-papier », « Exporter le tableau dans un fichier CSV ».
- Valeurs référentielles : « Valeurs référentielles des éléments… » · « Valeurs référentielles des sous-éléments… » · séparateur · « Structure des éléments pour les valeurs référentielles… » (§6.5).
- Dupliquer, Editer et « − » sont actifs si « + » l'est et qu'une ligne est sélectionnée.
- Double-clic = Ouvrir ; Maj + double-clic = Editer ; clic droit = Editer… / Ouvrir… [P: `CostPlanningFrame$14@7-49`].

**Corbeille** [P: `CostPlanningDocumentDialog.deleteCostPlanningDocument@15-119`] :
1. Premier « − » : « Voulez-vous vraiment supprimer cette inscription ? » → `ISMARKEDASDELETED=1`.
2. Sur un document déjà marqué : « Voulez-vous vraiment supprimer définitivement cette inscription ? » → `DS.del` des deux enregistrements `costplanningdocument` et `costplanning`.
3. Affichage : l'original montre les documents supprimés en semi-transparence (alpha 125) quand on ouvre la liste avec Alt ou Ctrl enfoncé. DeltaSub remplace ce geste par une case « Afficher les documents supprimés ».
4. Restauration : Editer puis OK sur un document supprimé **le restaure** [P: `jOkButtonActionPerformed@139-144`].

### 3.2 Fiche « Nouvelle estimation des coûts » / « Edition » (`deltabauad.project.CostPlanningDocumentDialog`)

| Libellé | Champ | Règle |
|---|---|---|
| Nom | VERSION | ≤ 64, **obligatoire** (OK reste inactif sinon) ; vide en création |
| N° de version | VERSIONNUMBER | entier ; **1** en création |
| Utilisateur | USERID | non saisissable ; le bouton « ◂ » propose la liste des utilisateurs ; défaut `ME.id` |
| Date | CHANGEDDATE | calendrier ; aujourd'hui |
| Statut | STATECODE | 4 choix ; Brouillon |
| Estimation avec subdivisons (sic) | ISAPPLYSUBPROJECTS | en création : actif seulement si l'affaire a des subdivisions, sinon décoché et grisé ; **toujours grisé en édition** |
| eCCC-GC : Grandeurs référentielles A / B | ISREFERENCEBASEA | radios ; A par défaut ; **grisés en édition** ; tout est grisé sans catalogue |
| Note | NOTE | multiligne ≤ 1 024, sans espaces en tête ni en fin |

Messages :
- sans catalogue d'éléments : « Aucun catalogue d'éléments n'a encore été attribué au projet. » [P: `msg1`] ;
- les messages de licence (`msg12` à `msg16`, `msg19` à `msg23`) ne sont pas reproduits.

**Dupliquer** (`duplicateCostPlanningDocument@32-43`) :
- VERSION devient « <Nom> Copie » [P: recette `\u0001 \u0001` + `Strings.copy` = « Copie »] ; les autres champs de l'en-tête sont identiques ;
- la fiche s'ouvre en mode édition, options figées ;
- sur OK, le contenu `costplanning` (et les annexes) est copié en entier sous le nouvel ID.

### 3.3 Création du contenu (`Init.initDocument`)

1. **Éléments** : positions du catalogue eCCC de l'affaire dont le code a **au plus un point**, dans l'ordre du catalogue.
   - Vérifié sur le doc 252 : les 413 codes du catalogue 2302 sont exactement ses 413 éléments [P].
   - Pour chaque élément : `standard=true`, `libelle` = TEXT1, `libelle2` = TEXT2.
   - `grandeurRef`, `unite`, `uniteUNECE` = champs `D`, `U`, `C` de l'entrée A ou B de `UNIT`.
   - `grandeursPossibles` = les deux entrées ; `systeme` selon le §0 n° 17.
2. **Codes à 2 points ou plus** : **non repris** (niveaux 4-5, sous licence).
3. **Quantités référentielles** [P: `Init.updateBaseQuantityList@0-529`] :
   - une par grandeur distincte des éléments : `code`, `libelle` = `UNIT.R`, `unite`, `uniteUNECE`, `standard=true`, quantité 0 ;
   - `codeCalcul` = le code, s'il fait partie des 8 codes calculés ;
   - `prixEnPourcent=true` pour les éléments dont la grandeur est un montant ;
   - `prixEnPourcentQuantite=true` pour ACC11-14 et PV11-13, éléments et ouvrages [P: `Init.initDocument@1002-1797`].
4. **Avec subdivisions** : une ligne d'ouvrage par subdivision de l'affaire sur chaque élément et chaque grandeur (`ouvrage` = CODE, `ouvrageId` = ID, `localisation` = '').
5. **Défauts** :
   - `coutRealisation` B–W, `coutOuvrage` C–G ; `arrondir=true` ; `pourcentage='totalGeneral'` ; `indice=100` ; `titre` = « Estimation des coûts » ; `date` = aujourd'hui ;
   - les 7 unités fonctionnelles (§5.8.2) ;
   - `impression.documents` = [(1,f),(3,v),(2,v),(4,f),(5,f),(6,f)] ;
   - `affichage.sousElements` et `affichage.composants` à true ;
   - polices du bureau (en réalité Akkurat, 9) ; `hauteurLigne` = 14.
6. **Supprimer** la copie actuelle « du plus gros document d'une autre affaire » (`cpNew` l.3261). En pratique, elle prend le doc 1, qui est supprimé et en système 511.
7. **Affaire sans catalogue eCCC** : afficher le message ci-dessus. Puis, selon le choix du §12, proposer « Reprendre la structure eCCC-Bât (niveaux 1 à 3) d'une autre affaire du bureau ». Cette option crée un `projectcatalog` de type 10 pour l'affaire et copie les positions à ≤ 1 point, sans HINT ; les niveaux 4 et 5 restent toujours exclus.

### 3.4 Fenêtre « Détermination des coûts » (`CostPlanningDialog`)

- **Titre** : « Détermination des coûts - <Nom> (<N°>) » ; « (N°) » n'apparaît que si le N° est différent de 0 [P: `initDialog@18-100`].
- **Menu Fichier** : « Fermer… » (⌘W) ; « Enregistrer » (⌘S), masqué si l'enregistrement automatique est actif. DeltaSub enregistre toujours.
- **Menu Editer** : « Configuration… » (§3.5, contrôle des droits) · « Données de l'affaire… » (§3.8) · « Importer les présentations… » (§3.7, contrôle des droits).
- **Barre latérale**, ordre imposé : QUANTITES REFERENTIELLES (Editer) · ELEMENTS (Editer, Documents) · APERCU (Editer) · CHIFFRES CLEFS (Editer) · CALCUL DES RESULTATS (Editer).
  - L'original enregistre la dernière section choisie sans jamais la restaurer.
  - DeltaSub la mémorise dans `localStorage`, comme commodité locale.
- **En-tête** : « Total », suivi du coût d'investissement A–Z arrondi par `R(x, arrondir)` [P: `writeHeaderTotal@0-34`].
- **ELEMENTS ▸ Documents** : si Σ CFC ≠ 0 et |Σ CFC − total| ≥ 50 (`BKP_EKG_TOLERANC=50.0`), avertir « L'attribution CFC n'est pas terminée. » [P: `setMenu@534-594`].
- **Concurrence** : aujourd'hui, `DS.commit` reçoit la version courante en `bseq`, et une modification faite sur un autre poste est écrasée sans rien dire. `cpEditor` doit mémoriser le `seq` lu à l'ouverture et le passer en `bseq`, pour que le serveur renvoie le 409.

### 3.5 Configuration (`ConfigDialog`)

- Deux catégories : « Pourcentage » et « Définitions des coûts ».
- **Pourcentage** : radios « Pourcentage sur le total général » / « Pourcentage sur le groupe principal » ; case « Arrondir ».
- **Définitions des coûts** : « Coût de réalisation » de […] à […], « Coût de l'ouvrage » de […] à […].
  - Les champs ne se saisissent pas au clavier. Chacun a un bouton ◂ qui ouvre le « Navigateur d'éléments » limité aux groupes principaux.
  - Dans ce navigateur, la case « Afficher uniquement les groupes principaux » est cochée, grisée et cachée.
- **OK** : les 7 valeurs sont écrites, puis tout est recalculé.
- **Plage** [P: `createErstellungsElemString@19-66`, `getElementRangeCosts@2-58`] :
  - la chaîne est faite des lettres consécutives, de la 1re lettre de « de » à la 1re lettre de « à » ;
  - le montant est la somme des `gv` des groupes principaux dont le code est dans cette chaîne ;
  - `cpCompute` (comparaison de chaînes sur le niveau 1) donne le même résultat.

### 3.6 Affichage (`PreferenceDialog`, bouton pinceau « Affichage… »)

- **Document** : Titre · Date (calendrier) · Indice (décimal, 100) · « Marge d'approximation du DG » · « Etat de planification » · « Etat du projet ».
- **Texte libre** (visible, car le Module DESIGN est actif au bureau) : « Texte libre 1 » (multiligne) et « Texte libre 2 » à « 5 ».
- Ces valeurs **ne servent qu'à l'impression**. `indice` n'entre dans aucun calcul : seule `desc.Display` lit `getIndex()` [P].

### 3.7 Importer les présentations / Importer un calcul d'une affaire

**Fenêtre « Choix du document »** (`PlanningBrowserDialog`) :
- à gauche, les affaires, avec un filtre (« Editer le filtre », « Appliquer le filtre », étiquette « Filtré ») ;
- à droite, les documents non supprimés de l'affaire choisie ;
- OK ou double-clic valide.

**Importer les présentations** [P: `jImportPrefMenuItemActionPerformed`] :
- confirmation « Voulez-vous remplacer tous les paramètres? » ;
- éléments copiés : unités fonctionnelles, `arrondir`, `pourcentage`, plages, `impression.*` (page de garde, documents, totaux, hauteur de ligne, polices, options, tris), `titre`, `precision`, `etatPlanification` et `affichage.*` ;
- ne pas reproduire le bug d'origine : `displayComponentsDescription` est recopié dans `displayComponents` (`@476-479`).

**Importer un calcul des coûts d'une affaire** (`CostPlanningPlugin$1`) :
- si les types de catalogue diffèrent : « Les types de catalogue ne correspondent pas. », et l'import s'arrête ;
- si les versions de catalogue diffèrent : « Ce document et le document à importer sont de versions de catalogue différentes. » / « Vous voulez toujours importer ? ». Si oui, les libellés sont réalignés sur le catalogue de l'affaire ;
- ensuite, la fiche s'ouvre en mode nouveau, puis le contenu est copié.

### 3.8 Données de l'affaire (`ObjectDialog`, titre « Données de l'affaire »)

**Disposition** :
- à gauche en haut, le tableau « Code | Texte » : 1re ligne « - / Affaire », puis les subdivisions ;
- à gauche en bas, les catégories **Affaire · Délais · Affectation · Description · Documents · Images** ;
- à droite, le panneau de la catégorie ;
- un seul bouton « Fermer » : les modifications s'appliquent directement.

**Catégorie Affaire** :
- « Désignation de l'affaire ou de la subdivision » : proposition = `PROJECT.DESCRIPTION`, sinon `TITLE`.
- « Lieu de l'affaire ou de la subdivision » : fenêtre « District de l'affaire/de l'ouvrage » (N° postal, Localité ≤ 164, « Lignes d'adresse supplémentaires »).
- « Genre d'affaire » : Numéro ≤ 12 et Désignation ≤ 164, fenêtre « Classification par types d'ouvrages », proposition depuis les genres de l'affaire.
- « Intervenants de l'affaire ou de la subdivision » : Rôle, Entité.
  - Ajout par le navigateur d'adresses.
  - Si le contact est intervenant de l'affaire, son rôle est repris ; sinon la fenêtre « Rôle » s'ouvre.
  - Flèches début / monter / descendre / fin.

**Autres catégories** :
- **Délais** : Désignation et Echéance (30 caractères chacun, obligatoires), fenêtre « Délais ».
- **Affectation** et **Description** (« … de l'affaire ou de la subdivision », « Description de la construction … ») : fenêtre « Description ».
- **Documents** et **Images** : Nom, Nom du fichier. Fichier absent : « Document introuvable. » Suppression avec confirmation. Pour les images : « Taille d'image recommandée env. 6 cm x 4 cm, format jpg (300dpi) ou png(72-300dpi) ».

**Usage** : impression et SIA 451 seulement.

**Ne pas reproduire** le bug d'origine : avec une subdivision sélectionnée, l'Affectation est écrite dans la description de la construction [P: `ObjectDialog.setData`].

### 3.9 Subdivisions (ouvrages)

- **Colonnes OUV / Localisation et filtre par ouvrage** : affichés si `ISAPPLYSUBPROJECTS` est vrai **et** que l'affaire a des subdivisions [P: `subprojectFounds@0-33`].
- **Crayon ▸ « Subdivision… »** (`OgSelectionDialog` « Subdivision », colonnes Code | Texte | M) :
  - `ISAPPLYSUBPROJECTS` passe à 1 ;
  - chaque grandeur et chaque élément reçoivent une ligne par ouvrage coché ;
  - **la première fois** : la 1re ligne reprend les valeurs de l'élément (`setFromElement`), les sous-éléments de l'élément sont vidés, et la quantité globale d'une grandeur passe à la 1re subdivision ;
  - ensuite, les lignes de calcul et les quantités globales sont effacées, et chaque grandeur devient la somme de ses ouvrages (`sumRefQuantiesOgs`).
- **Contrôle** (`allSubprojectsAvailable`) : chaque couple (og, lg) doit exister dans l'affaire. Sinon, « Créer un devis selon le CFC » affiche « Toutes les subdivisions ne sont pas définies. » et s'arrête.
  - DeltaSub relie les ouvrages par `ouvrageId` : le renommage EDP → STU n'est donc pas une erreur. Seule une subdivision supprimée en est une.

### 3.10 Verrou (facultatif)

- **Original** : Ouvrir, Editer, Dupliquer et Supprimer passent par `DocumentLockDialog.tryLock`.
  - Si le document est pris, la fenêtre « Document verrouillé » affiche « Ce document est actuellement utilisé. », l'utilisateur et « Utilisé le ».
  - Elle propose la case « Déverrouiller ce document », avec l'avertissement `msg1a/b`.
- **DeltaSub** : le serveur a déjà une table `lock(t,id,who,ts)` (l.69), inutilisée.
  - Option : ajouter `/api/lock` et `/api/unlock`, en plus de la détection 409.

---

## 4. ÉLÉMENTS

### 4.1 Disposition et barre d'outils [P: `CostPlanningDialog.initComponents/initDialog`]

- **À gauche** :
  - en haut, les groupes principaux (« Code | Désignation », codes d'une lettre) ;
  - en bas, les groupes du groupe principal sélectionné (codes de longueur ≤ 3 qui commencent par cette lettre) ;
  - un clic sélectionne la ligne et fait défiler le tableau jusqu'à elle.
- **Au centre**, le tableau des éléments.
- **En bas**, le panneau de détail : « Elément », « Grandeur réf. », « Quantité réf. », « Valeur réf. », « Coût », « Calcul définitif : » Oui/Non, « Remarque », « Note interne », « CFC », « Énergie grise ».

| Bouton | Articles (libellés exacts) |
|---|---|
| + | Nouveau groupe principal · Nouveau groupe d'éléments (code sélectionné ≥ 1 car.) · Nouvel élément (≥ 3 car.) · — · Navigateur de sous-éléments… · Nouveau sous-élément… |
| Import ▾ (droits) | Valeurs référentielles des éléments… · Valeurs référentielles d'une affaire… · Valeurs référentielles des sous-éléments… · — · Import SIA451… |
| Crayon | Grandeur référentielle… · Elément… (grisé pour un élément standard) · Sous-élément… (n° ≥ 100) · — · Subdivision… (si l'affaire a des subdivisions) · Niveau de saisie… |
| − | Supprimer un élément… · Supprimer un sous-élément… · — · Supprimer tous les prix de tous les articles… · Effacer tous les éléments… |
| Tableau (affichage) | 10 cases + 2 filtres (§4.3) |
| Entonnoir | cases par ouvrage · — · cases par groupe principal (« A Terrain »…) ; étiquette « Elément: » / « Ouvrage: » |
| Documents ▾ | Estimation des coûts… [Ancien document] · Créer un descriptif selon le CAN… (non reproduit) · Créer un devis selon le CFC… · — · Export SIA451… · Exporter les documents et les images… |
| Pinceau | Affichage… (§3.6) |
| Roue | Copier dans le presse-papier · Exporter en CSV · Copyright… |
| Libellé | « Total <montant> » |

### 4.2 Colonnes (27, aucune éditable dans la cellule) [P: `desc.Columns.<init>`, `initElementTable`]

| n° | En-tête | Largeur | Visible si |
|---|---|---|---|
| 0 | (id caché : 0 généré / 1 saisi) | 0 | — |
| 1 | Code | 75 | toujours |
| 2 | OUV | 65 | ouvrages (§3.9) |
| 3 | Localisation | 65 | ouvrages |
| 4 | Sous-él. | 70 | `affichage.sousElements` |
| 5 | Composant | 80 | `affichage.composants` |
| 6 | Désignation | 280 | toujours |
| 7 | Grand. réf. | 70 | toujours |
| 8 | Quantité réf. | 90 | toujours |
| 9 | Unité | 40 | toujours |
| 10 | Valeur réf. | 90 | toujours |
| 11 | (« % » ou vide) | 20 | toujours |
| 12 | Coûts | 90 | toujours |
| 13 | D | 20 | `affichage.definitifs` |
| 14 | V | 20 | `affichage.eventuelles` |
| 15 | CFC | 50 | `affichage.cfc` |
| 16 | Montant CFC | 90 | `affichage.cfc` |
| 17 | +/- | 90 | `affichage.cfc` |
| 18 | [%] | 60 | toujours |
| 19-21 | Énergie grise · Coefficient U · Effet de serre | 90 | `affichage.eco` |
| 22 | « ● » (documents ou images) | 15 | toujours |
| 23 | Remarques | 160 | `affichage.remarques` |
| 24 | Notes internes | 200 | `affichage.notesInternes` |
| 25 | Exécution | 200 | `affichage.execution` |
| 26 | Description | 200 | `affichage.descriptions` |

- Format numérique : `#,###,##0.00`, avec l'apostrophe comme séparateur de milliers [P: `Formatter.formatDouble`].
- L'export CSV reprend ces en-têtes. Exemple réel : `2451/202/docs/Export.csv`, en UTF-16, séparateur « ; ».

### 4.3 Lignes, styles, filtres, navigation [P: `setElementTable@171-6159`, `ElementTableCellRenderer`]

**Ordre des lignes** :
1. une ligne vide avant chaque retour à un code plus court ;
2. la ligne de l'élément ;
3. si l'élément a plus d'un CFC, une ligne par CFC (CFC, Montant, [%] = montant/coût × 100) ;
4. une ligne par ouvrage, puis ses CFC ;
5. les sous-éléments et leurs CFC, puis les composants (colonne Composant ; CFC = `cfcNumero`, Montant = coût) ;
6. les lignes CAN, en lecture seule.

**Quantité et prix des groupes** : ils sont affichés aussi. Prix d'un groupe = coût/q, ou 100 × coût/q si le groupe est en %.

**Colonne +/-** (`calcBkpDiff`) :
- affichée si |diff| > 0,001, sur une ligne non générée, sans ouvrages, hors Z ;
- sans sous-éléments : diff = coût − Σ des montants CFC ;
- avec sous-éléments : diff = coût − Σ des CFC des SE − Σ des coûts des composants qui ont un CFC ;
- même calcul par ouvrage.

**Styles** :
- gras si le code a 3 caractères au plus ;
- fond RGB(243,243,243) pour les groupes principaux ;
- cellule Valeur réf. en fond RGB(217,217,217) sur les lignes saisissables : feuille sans ouvrage ni SE, ligne d'ouvrage sans SE, ligne de SE.

**Menu Affichage ▾** (cases liées aux clés `affichage.*`, **toutes décochées par défaut sauf sous-éléments et composants**) :
- dix cases : « Afficher les sous-éléments », « … les composants », « … les remarques », « … les notes internes », « … les CFC », « … les indicateurs écologiques », « … le type d'exécution », « … les descriptions », « … les calculs définitifs », « … les positions éventuelles » ;
- « Afficher uniquement les articles utilisés et fixées » : élément `utiliserPourCalcul` dont aucun parent n'est « non utilisé » ou fixé (`isActivePosition`) ;
- « Afficher uniquement les articles avec un montant » : `gv ≠ 0` ;
- ces options remplacent `CPV.only`, qui est global et vrai par défaut.

**Filtres** :
- par ouvrage (`Filter.filterElementList`) : copie de la liste sans les autres ouvrages, puis recalcul ; la quantité de l'élément devient la somme des ouvrages restants ;
- par groupe principal.

**Navigation** :
- double-clic sur la colonne Code = zoom : seuls restent les codes qui commencent par ce code ; un second double-clic rétablit tout ;
- une lettre tapée saute au premier code qui commence par elle.

### 4.4 Moteur de calcul (formules prouvées), à porter tel quel depuis `cp_calc.py`

#### 4.4.1 Primitives

```js
// util.Formatter.round(Double, boolean) [P: @0-82] — attention : r05 (l.2496) n'est pas signé, ne pas le réutiliser tel quel
const R=(x,arr)=>{ const a=Math.abs(x), v=arr?Math.round(a*20)/20:Math.round(a*100)/100; return (x<0&&v!==0)?-v:v; };
const gv=o=>(+o.coutFixe? +o.coutFixe : +o.cout||0);        // getValue(true)
const pct=e=>!!(e.prixEnPourcent||e.prixEnPourcentQuantite);
const actif=e=>!e.genere||e.niveauFixe;                     // !isGenerated || positenIsFixed
const V_PROC=new Set(['V 1.1','V 1.2','V 1.3','V01.01','V01.02','V01.03','V01.04']);
```

#### 4.4.2 Séquence d'un recalcul (`refreshAllTables` → `setElementTable@0-125`)

1. **Positions générées** (`setGeneratedPositions@35-246`) :
   - en remontant la liste, `e.genere` est vrai si le code suivant est plus long, commence par `e.code`, **et** si `e.niveauFixe` est faux ;
   - le 1er élément est forcé à « généré », sauf si les deux premiers codes ont la même longueur.
2. **`setRefCodes`** (`@0-552`) :
   - quantité de l'élément = quantité de la grandeur de même code ;
   - quantité de chaque ouvrage = quantité de la ligne d'ouvrage de la grandeur qui a le même `ouvrage` et la même `localisation` ;
   - un SE sans `quantiteFixe` prend la quantité de l'élément (ou de l'ouvrage) si sa grandeur est celle de l'élément, sinon la quantité de sa propre grandeur ;
   - **la quantité d'un élément ne se saisit donc pas librement** : c'est celle de sa grandeur.
3. **Prépasse** (`calc@36-292`) :
   - pour un élément **non standard**, `prixEnPourcent = (unite.toLowerCase()==='chf')`, et de même pour ses ouvrages ;
   - un SE en % sans quantité fixe prend la quantité de sa grandeur ;
   - un composant prend le `prixEnPourcent` de l'élément ; si le SE est en %, la quantité du composant devient celle du SE.
4. Enchaîner `calcBookedElements`, puis `calcRefQuantities` (§4.4.4), puis de nouveau `calcBookedElements` [P: `calc@495-519`].
5. **Totaux** :
   - `inv` = Σ des `gv` des éléments dont le code a 1 caractère [P: `@1101-1181`] ;
   - `real` et `ouv` = plages du §3.5 ;
   - totaux par ouvrage des groupes principaux : investissement, réalisation, ouvrage [P: `@543-1098`] ;
   - `tva` = `gv` de l'élément « Z ».
6. **Répéter les étapes 1 à 5 jusqu'à stabilité**, au plus 5 fois. Les quantités issues de montants ne sont recopiées qu'au `setRefCodes` suivant. Deux passages suffisent sur les 13 documents.

#### 4.4.3 `calcBookedElements` [P: offsets de `CalcElements`]

**Passe 0 — taux de TVA** : voir §0 n° 5.

**Passe 1 — prix unitaires** (éléments actifs, `@138-1827`) :
- **Feuille sans ouvrage ni SE, et non en %** : `cout = R(q×p)`. Pour chaque CFC : `montant = R(pourcent×0.01×gv(e))`.
- **Élément avec SE, sans ouvrage** :
  - `prix = 0` ;
  - cas V_PROC : les SE, et leurs composants, prennent la quantité de l'élément et passent en % ;
  - chaque SE non éventuel et non en % : `cout = R(q×p)`, `Σ += gv(SE)`, et les CFC du SE sont calculés si l'élément n'est pas en % de quantité ;
  - ensuite `cout(élément) = Σ`, puis, si l'élément n'est pas en % et que q ≠ 0, `prix = R(gv/q)`.
- **Élément avec ouvrages** : même logique, ouvrage par ouvrage. Le total est réécrit en passe 3.
  - L'anomalie `divTot += gv(div)` juste après la remise à 0 (`@1310`) n'a pas d'effet sur le résultat final.

**Passe 2 — prix en %** (éléments actifs en % ou en % de quantité, `@1834-3878`) :
- **Feuille** : `cout = R(q × 0.01 × p)`.
- **SE en %**, ou élément en % de quantité :
  - SE sans composant : `coutSE = R(qSE × 0.01 × pSE)` ;
  - SE avec composants : `coutComp = R(qC × 0.01 × pC)` pour chaque composant non éventuel, `coutSE = R(Σ)`, `pSE = coutSE/qSE × 100` ;
  - un SE qui n'est pas en % garde son coût de la passe 1 ;
  - ensuite `cout = Σ` et, si q ≠ 0, `prix = R(100×cout/q)`.
- **Par ouvrage** : idem.

**Passe 3 — groupes et éléments à ouvrages** (`@3885-4889`) :
- **Groupe généré non fixé** :
  - remise à 0 ;
  - `posTotal` = Σ des `gv` de **tous** les éléments actifs dont le code commence par celui du groupe. Le groupe lui-même est compris (déjà à 0), les éléments éventuels **aussi** ;
  - par ouvrage, cumul des ouvrages égaux ;
  - `cout` = somme des ouvrages si le groupe a des ouvrages, sinon `posTotal` ;
  - `prix = R((pct?100:1)×cout/q)`, ou 0 si q = 0 ; même règle par ouvrage.
- **Élément non généré avec ouvrages** :
  - ouvrage sans SE : `total += gv(ouv)` ;
  - ouvrage avec SE : `coutOuv = Σ gv(SE)`, **sans** filtre « éventuel » à cet endroit, et `prixOuv = R((pct?100:1)×coutOuv/qOuv)` ;
  - `cout(élément) = total` et `prix = R((pct?100:1)×cout/q)`.

**Composants hors %** : leur coût `R(q×p)` (ou le « montant seul ») est fixé dans leur dialogue. Le SE reçoit alors `prix = R(Σ/q)`, puis la passe 1 recalcule `coutSE = R(qSE×pSE)`. C'est le comportement de l'original (§12 n° 7).

#### 4.4.4 Quantités calculées (`Refquantity.calcRefQuantities`, `calcElementFromTo@0-287`)

Pour chaque grandeur dont le `codeCalcul` figure dans la table ci-dessous (ou qui est `estCalculee`, avec sa liste `elementsReference`) :
1. mettre à 0 la grandeur et ses ouvrages ;
2. pour chaque code de la liste, ajouter `gv(élément)` pour l'élément dont le code est **exactement** égal ;
3. pour chaque ouvrage de même `ouvrage`/`localisation`, ajouter `gv(ligne d'ouvrage)`.

| codeCalcul | Éléments sommés |
|---|---|
| PSBY | B…Y (lettres B à Y) |
| SSBW | B…W |
| SSBT | B…T |
| SSBJ | B…J |
| SSBI | B…I |
| SSA01 | A01 |
| SSD | D |
| SD110 | D01, D03…D10 (sans D02) |

- **Anciens codes allemands et français** (BBY…, PBY…, PA…) : **non repris**, ils sont absents des catalogues du bureau.
- **Bug d'origine évité** : l'original donne à une grandeur personnalisée un `codeCalcul` égal à son code. Une grandeur personnalisée « PA » serait donc prise pour l'ancien code français « PA ». DeltaSub **n'utilise la table que pour les grandeurs standard** ; pour les personnalisées, seulement `estCalculee` et `elementsReference`.
- **Référence circulaire interdite** (`Check.refQunantityIsIndependent`, msg6 « Le code dépend de lui-même. ») :
  - un élément ne peut pas avoir pour grandeur un code qui le somme lui-même : SSBW sur un élément B…W, SSD sur D…, SSA01 sur A01, SD110 sur D01…D10, ou une liste personnalisée qui le contient ;
  - l'original oublie D06 dans ce contrôle : ne pas reproduire l'oubli.
- **Contrôle sur le doc 252** : PSBY = SSBW = 367 640 (AP3 72 640 + COM 295 000) ; SSBT = SSBJ = SSBI = 36 320.

#### 4.4.5 Colonne [%] [P: `calcElemDeviration@4-617`]

- `'totalGeneral'` : `100 × gv(ligne) / inv`. Pour une ligne d'ouvrage ou de SE, le dénominateur reste le total général.
- `'groupePrincipal'` : `100 × gv(ligne) / gv(groupe principal dont la lettre commence le code)`.
- `'aucun'`, ou dénominateur nul : 0.
- **Format** : « <0.01 » si 0 < |x| < 0,01 ; sinon 2 décimales ; « 0.00 » si la valeur est nulle [P: `CPD@719-735`].

### 4.5 Coût fixé, V, D, « utiliser », niveau de saisie

- **Coût fixé** : `gv` le préfère au coût calculé ; la valeur 0 l'efface.
- **V (éventuelle)** :
  - un SE ou un composant éventuel est exclu des sommes des passes 1 et 2 (`@480`, `@686`, `@2163`, `@2358`) ;
  - au niveau élément ou ouvrage, `CalcElements` ne le teste **jamais** : le coût reste compté, malgré le libellé « Position éventuelle (ne pas inclure le montant) » ;
  - aucune donnée réelle n'est concernée (§12 n° 1).
- **D (définitif)** et « Utiliser la position pour le calcul » : affichage et filtre seulement.
- **Niveau de saisie** (`FixPositionDialog`, « Niveau de saisie des valeurs », « Déterminez le niveau de saisie ») :
  - radios « Saisie des valeurs sur le niveau de la position sélectionnée. » / « Saisie des valeurs sur les positions subordonnées. » ;
  - pour verrouiller, toutes les positions subordonnées doivent être vides : pas de SE, coût 0, pas de CFC, ouvrages à 0. Pour déverrouiller, la position elle-même doit être vide ;
  - sinon : « La position ^0 contient déjà des données. La position ne peut pas être verrouillée. » ;
  - ensuite, les positions générées sont recalculées ;
  - une position placée sous un parent fixé ne peut plus être saisie : « L'élément ^0 est fixé. » (`ElementTableUtil.isBlockePosition`).

### 4.6 Attribution CFC

- **Montant** : `montant = R(pourcent × 0.01 × gv(ligne))` pour un élément, un ouvrage ou un SE. Un composant qui a un `cfcNumero` compte pour 100 % de son coût.
- **Un seul niveau par branche CFC** (`convert.Bkp.isGenaratedPosition`) : si un autre élément utilise déjà un CFC de la même branche, messages « Vous ne pouvez pas utiliser de positions de niveau supérieur. » + « L'élément ^0 utilise la position ^1. », ou « Vous ne pouvez pas utiliser de positions de niveau mineur. ».
- **Groupes CFC** (`calcBkpMainGroupList@7-228`) :
  - cumul par 1er chiffre de `montant × (1 + tva/100)`, **sauf** pour les éléments A… et Z… ;
  - Σ CFC = `calcBkpTotal`, un total TTC ;
  - contrôle msg11 à 50 CHF.
- **Données** :
  - doc 202 : CFC 2 = (24 000 + 15 000 + 20 000) × 1,081 = **63 779** = A–Z → pas d'avertissement ;
  - doc 3 : CFC 2 = 86 480 ≠ 700 379.90 → msg11.

### 4.7 Double-clic et clic droit [P: `jElementTableMouseClicked@16-2083`]

**Colonnes Grand. réf. ou Quantité réf.** :
- si l'élément a une grandeur, ouvrir la saisie de **la grandeur partagée** (§5.3) ;
- sinon, le dialogue « Quantité » (Quantité, Unité) ;
- dans un document à ouvrages, seules les lignes d'ouvrage sont acceptées.

**Autres colonnes** :
- ligne de SE : « Paramètre de coût ^0 » ;
- élément ou ouvrage avec SE : « Référence de coût ^0 » en mode total (Remarque, Note, Description seulement) ;
- feuille : « Référence de coût ^0 » complète ;
- groupe non fixé : mode « généré » (Description, Exécution, Remarque, Images, Documents).

**Clic droit** : Navigateur de sous-éléments… · Nouveau sous-élément… · Valeurs référentielles des éléments… · Niveau de saisie…
- L'article « Attribution CFC… » n'existe dans ce menu qu'en version de développement.
- En production, l'attribution passe par la catégorie du dialogue d'élément [P: `ElementCalcDialog.initCategoryTable`, sans test de version].

**Un sous-élément est autorisé** sur un élément de niveau 3, non généré, et sur une ligne d'ouvrage si le document a des ouvrages. Sont exclus « H 4 » et les codes à 2 points.

### 4.8 Dialogues

#### 4.8.1 « Référence de coût ^0 » (`ElementCalcDialog`, minimum 800×450)

**Catégories** : Calcul · Attribution CFC · Évaluation écologique · Description · Exécution · Remarque · Images · Documents.
- Groupe : ni Calcul, ni CFC, ni Écologie.
- Z… : ni CFC, ni Écologie, ni Exécution, ni Images, ni Documents.

**Calcul** :
- « Quantité référentielle », en **lecture seule** ;
- « Référence de coût » (nombre), avec l'unité « CHF » ou « % » ;
- « Coût » calculé en direct : q × p, ou q × p × 0,01. Les CFC suivent au prorata ;
- « Fixer le coût » : montant, visible s'il est ≠ 0 ;
- cases « Le calcul est définitif », « Position éventuelle (ne pas inclure le montant) », « Utiliser la position pour le calcul ».

**Menu de proposition** :
- « Valeurs référentielles des calculs précédents » (§6.5.1) ;
- « Valeurs référentielles de la base de données » (§6.5.2) ;
- « Insérer le coût… » (visible si q ≠ 0) : `prix = coût/q`, ou `100·coût/q` si le prix est en % ;
- « Fixer le coût ».

**Autres champs et règles** :
- « Origine du prix » : texte ≤ 30, avec le menu des 6 propositions ;
- bouton info : « Information sur l'élément » / « … sur la grandeur référentielle » → « Aucune information disponible. » (les textes CRB ne sont pas repris) ;
- longueurs : Remarque 30 ; Note, Description et Exécution 1 024 ; commentaires d'écologie 30 ;
- unités : « kWh/m2 a », « [W/m²K] », « [kg/p a] » ;
- OK refuse toute valeur de plus de 10 chiffres entiers : « Valeur trop élevée. » (`Check.numberRangesIsOk`).

**Attribution CFC** (tableau N° | Texte | Montant | [%], titre « Attribution CFC à l'élément ») :
1. « + » ouvre « Navigateur » / « Propositions CFC » : colonnes Nº | Désignation, catalogue CFC de l'affaire, case « Afficher uniquement les CFC proposés ».
2. Sans catalogue CFC : « Vous n'avez pas attribué de catalogue CFC. » / « L'attribution est faite sous Gestion. »
3. Le dialogue « Coût selon CFC » demande « Part CFC de ^0 », « Pourcentage [%] », avec un « Montant » en lecture seule.
4. Le bouton « < » propose le reste : `100 − Σ%` si le prix est en %, sinon `100 − 100·R(Σmontants/coût)`.
5. Chaque couple validé enrichit les propositions (`updateEbkpToBkp`, `proposition=true`).

#### 4.8.2 « Nouveau » / « Editer » (`ElementDialog`)

- Consignes : « Définir un groupe principal / un groupe d'éléments / un élément / un sous-élément ».
- Code proposé :
  - groupe principal : **K, U, X**, s'ils sont libres ;
  - groupe : « C01 »…« C99 » ;
  - élément : « C01.01 »…
- Champs : Désignation et texte 2 (≤ 64 chacun) ; « Code référentiel », liste des grandeurs, avec pour défaut celle du 1er élément du groupe principal.
- OK si le texte 1 et le code sont remplis. Contrôle circulaire. Doublon : « Cet élément est déjà utilisé. »
- Insertion triée, avec une ligne par ouvrage si le document a des ouvrages.

#### 4.8.3 Suppressions (`data.Delete`)

- Élément standard : « Les éléments standard ne peuvent pas être supprimés. », puis « Voulez-vous mettre cette position à zéro? », puis « La position est mise à zéro. »
- Autre élément : « Voulez-vous effacer cette position? »
- « Voulez-vous effacer tous les prix? » : met à 0 le prix, le coût, le coût fixé et l'origine, à tous les niveaux.
- « Voulez-vous effacer toutes les éléments ? »

#### 4.8.4 Sous-élément (`SubElementDialog`, « Sous-élément »)

- Champs : Code (3 chiffres, **≥ 100**, sinon « Le nombre doit être supérieur à 099. ») · Désignation · « Grandeur de référence » (bouton « < » = celle de l'élément) · Unité · « En pourcentage » · Note interne.
- Doublon : « Cet élément est déjà utilisé. » Insertion triée.
- Le « Navigateur de sous-éléments » **n'affiche que les SE du bureau** (base `constructionpart`, §6.5.2), jamais le catalogue gate.

#### 4.8.5 « Paramètre de coût ^0 » (`SubElementCalcDialog` / `…ProcentDialog`)

- **Modes** :
  - Sans calcul : `R(p×q)`, ou `R(p×0,01×q)` ;
  - Composants : Σ des composants non éventuels, puis `prix = R(Σ/q)` ;
  - CAN : lecture seule.
- En mode Composants, avec q = 0 et sans coût fixé : « Vous devez définir une quantité. », puis « Voulez-vous vraiment insérer les données ? »
- **Quantité fixe** : dialogue « Modifier la quantité de référence », case « Quantité à valeur fixe ».
- **Onglets** : Locaux ; Durée de fonctionnement (listes du §2.10 et coût annuel) ; CFC ; Écologie ; Description ; Exécution ; Remarque ; Images ; Documents.

#### 4.8.6 Composant (`ComponentDialog`, « Editer le composant »)

- `cout = R(q×p)`, ou `R(q×p×0,01)` en %.
- « Utiliser uniquement le montant » : q et p passent à 0 et le coût se saisit.
- « Inclure / Position éventuelle ». Un seul CFC.

### 4.9 Énergie grise, U, effet de serre, indice

- **Énergie grise** (`calcGreyEnergy`) :
  - **somme simple** des kWh/m² a saisis sur l'élément, ou sur ses SE et ses ouvrages, **non pondérée** par la quantité ;
  - remontée au groupe (3 caractères) et au groupe principal ;
  - la liste ne garde que les codes de moins de 5 caractères ou à 1 point, et les valeurs non nulles.
- **Coefficient U et effet de serre** : saisie et affichage seulement (0 référence dans `CalcElements`).
- **Indice** : n'entre dans aucun calcul (§3.6).

---

## 5. QUANTITES REFERENTIELLES, unités fonctionnelles, CHIFFRES CLEFS

### 5.1 Catalogue des grandeurs

- **511 (A)** : 237 grandeurs réelles, plus l'artefact « null ». Dont 156 en m², 41 en p, 21 en m, 7 en m³, 12 en CHF et 1 en m³/h.
- **514 (B)** : 261 grandeurs réelles, dont les grandeurs « selon maquette », des volumes, des puissances…
- Listes complètes (données du bureau) : `research/cp_refq/grandeurs_511.tsv` et `grandeurs_514.tsv`.

### 5.2 Tableau (16 colonnes) et présentations [P: `desc.Columns`, `CPD.initRefQuantityTable`]

| # | En-tête | Larg. | Standard | Avec le calcul de prix | Avec des coûts |
|---|---|---|---|---|---|
| 0 | (0 éditable / 1 non) | 0 | — | — | — |
| 1 | Abrév. | 70 | ✓ | ✓ | ✓ |
| 2 | Désignation | 300 | ✓ | ✓ | ✓ |
| 3-4 | OUV · Localisation | 80 | si ouvrages | si ouvrages | si ouvrages |
| 5 | Unité | 70 | ✓ | ✓ | ✓ |
| 6 | Quantité réf. | 120 | ✓ | ✓ | ✓ |
| 7 | Définitif (✔/✕) | 80 | ✓ | ✓ | ✓ |
| 8 | Remarque | 180 | ✓ | ✓ | — |
| 9 | Note interne | 180 | ✓ | ✓ | — |
| 10 | Remarque de calcul | 180 | — | ✓ | — |
| 11 | Calcul | 180 | — | ✓ | — |
| 12 | Résultat | 70 | — | ✓ | — |
| 13 | Coût de réalisation/QR | 150 | — | — | ✓ |
| 14 | Coût de l'ouvrage/QR | 150 | — | — | ✓ |
| 15 | Coût d'investissement/QR | 150 | — | — | ✓ |

**Lignes** (`setRefQuantityTable@0-1987`), en sautant le code « null » :
1. la ligne principale : en gras et non éditable si la grandeur a des ouvrages (elle vaut alors leur somme) ;
2. en présentation « Avec le calcul de prix » seulement, une ligne par ligne de calcul (Remarque de calcul, Calcul, Résultat) ;
3. une ligne par ouvrage, même à 0, avec la cellule quantité en fond RGB(217,217,217), suivie de ses lignes de calcul dans la même présentation.

**Barre** :
- + « Grandeur référentielle… » ;
- Import ▾ « Import BIMeq… » (§6.6) ;
- ✎ « Quantité référentielle… » / « Grandeur référentielle… » (grandeurs personnalisées seulement) ;
- − « Supprimer la grandeur référentielle… » / « Supprimer toutes les quantités référentielles… » ;
- ⚙ exports ;
- ▼ filtres **exclusifs** : « Positions avec quantités référentielles » / « Positions sans quantité référentielle » / « Grandeurs référentielles personnalisées ». Aucun filtre par défaut ; une étiquette montre le filtre actif ;
- ▦ présentation ;
- Documents « Quantités référentielles… [Ancien document] » (visible au bureau) ;
- recherche insensible à la casse (une regex invalide est ignorée) ; une lettre tapée saute au premier code qui commence par elle.

**Panneau inférieur** : « Code » (CODE: texte) · « Désignation » · « Quantité référentielle » + unité · « Calcul définitif: » Oui/Non · « Remarque » · « Note interne » · « Coût de réalisation / QR » · « Coût de l'ouvrage / QR ».

### 5.3 « Quantité référentielle » (`RefUnitDialog`, minimum 500×300)

- **Champs** : en-tête (code et désignation) · « Quantité référentielle » (nombre, unité, calculatrice) · « Remarque » (≤ 30) · « Note interne » · « Le calcul est définitif ».
- **Verrous** :
  - la quantité ne se saisit pas s'il existe des lignes de calcul ;
  - ni si la grandeur est calculée (`codeCalcul` ou `estCalculee`) : la calculatrice est alors grisée ;
  - la ligne principale d'une grandeur ventilée n'est pas éditable : on saisit par ouvrage.
- **OK** : nombre valide, au plus 10 chiffres entiers. Avec un ouvrage, la valeur va sur l'ouvrage, puis **la grandeur devient la somme des ouvrages**. Ensuite, recalcul complet.
- **Même dialogue depuis ELEMENTS** (§4.7) : la grandeur est partagée par tous les éléments qui la référencent.

### 5.4 « Calcul de quantité référentielle ^0 » (`QuantityCalcDialog`, minimum 600×380)

**Colonnes** : (genre, 25) · Remarque · Calcul · Quantité (120) · Sous-total (120) · M (25).

**Barre** :
- + : insère une ligne après la ligne courante.
- −▾ : « Effacer la ligne de calcul » (« Veuillez sélectionner une ligne. ») et « Effacer toutes les lignes de calcul » (« Voulez-vous vraiment supprimer ce métré ? » ; une ligne vide reste).
- Deux boutons d'arrondi, « Arrondir au prochain nombre entier » et « Arrondir au prochain multiple de cinq » :
  - chacun ajoute **à la fin** une seule ligne `r` ou `r5`, de commentaire « Arrondi » ;
  - si cette ligne existe déjà, elle est seulement sélectionnée.
- ⚙ : exports. Libellé « Total 0.00 ».

**Algorithme** [P: `CalcBaseQuantiy.calc`] :

```
ra = x => Math.round(x*100)/100 ; total = 0 ; st = 0
pour chaque ligne :
  genre ''  : f = formule sans le texte entre [ et ] ; si f : v = eval(f) ; quantite = ra(v) ; total += v ; st += v
  genre 'r' : n = trunc(total)+1 (même si total est entier : 53 → 54) ; d = ra(n−total) ; calcul = quantite = d ; total += d ; st += d
  genre 'r5': n = trunc(total)+1 ; tant que n % 5 ≠ 0 : n++ ; d = ra(n−total) ; idem
  si M : sousTotal = ra(st) ; st = 0
libellé = "Total " + ra(total)
```

**Contrôles au clic sur OK** [P: `jOkButtonActionPerformed@0-564`] :
1. les lignes de quantité 0 sont retirées sans message ;
2. pour chaque ligne standard :
   - évaluation nulle ou syntaxe invalide : « L'équation de la ligne ^0 est incomplète, contient des erreurs » + « ou ne peut pas être calculée. » ;
   - plus de 90 caractères en tout (commentaire + formule) : « La formule et le commentaire ne peuvent pas dépasser 90 caractères. » ;
   - deux opérateurs consécutifs : « Deux opérateurs se suivent dans le calcul. » ;
3. partie entière du total de plus de 10 chiffres : « Valeur trop élevée. »

Après OK, la quantité de la grandeur reçoit le total et ne se saisit plus. Si le total vaut 0, elle redevient saisissable, à « 0 ».

**Évaluateur** (remplace mXparser, **sans `eval` ni `Function`**) :
- analyse récursive : `+ − × ÷ * / ^`, parenthèses, moins unaire, point ou virgule décimale ;
- constantes `pi` et `e` ; fonctions `sqrt`, `abs`, `floor`, `ceil`, `round`, `min`, `max`, `sin`, `cos`, `tan`, `ln`, `log10` ;
- tout autre identifiant est une erreur de syntaxe ;
- il remplace `evalQ` (l.2498), qui utilise `Function` ; le devis peut l'adopter aussi.
- Lignes réelles à accepter : `29+24`, `6*0.5`, `17+8`, `15+7`, `65+99`, `10+2+3`, `213`, `1000`, `500`, `27`, `3`.

### 5.5 Grandeur personnalisée (`RefcodeDialog`, « Grandeur référentielle »)

- **Champs** :
  - « Abréviation » : ≤ 7 caractères, en majuscules, non modifiable en édition ;
  - « Désignation » : ≤ 60 ;
  - « Calcul » : radios « Quantité référentielle » / « Montants référentiels (CHF) » (**choix par défaut**).
- **Mode Quantité** : liste « Unité », en français : m, m2, m3, m3/h, h, d, se, ms, p, t, kg, kW.
- **Mode Montants** :
  - tableau « Code | Désignation » avec le libellé « Coûts des éléments suivants : » ;
  - + ouvre le « Navigateur d'éléments » (sélection multiple) ;
  - −▾ : « Supprimer la ligne » / « Supprimer toutes les lignes » (« Voulez-vous vraiment supprimer toutes les lignes ? »).
- **OK** : le code et la désignation doivent être remplis ; en mode Montants, il faut au moins un élément. Doublon : « Ce code est déjà utilisé. »
- **Création** :
  - `standard=false` ;
  - en mode Montants : `unite='CHF'`, `estCalculee=true`, `elementsReference` ;
  - **`codeCalcul=''`** : écart volontaire (§4.4.4) ;
  - une ligne par ouvrage si le document est ventilé ;
  - insertion triée par code [D].

### 5.6 Suppressions

- **« Supprimer la grandeur référentielle… »** (grandeur personnalisée seulement) :
  - si un élément l'utilise : « Cette inscription est déjà utilisée. » ;
  - sinon : « Voulez-vous effacer cette inscription ? »
- **« Supprimer toutes les quantités référentielles… »** (« Voulez-vous supprimer ces entrées irrévocablement? ») :
  - grandeurs **non calculées** et leurs ouvrages : quantité à 0, calculs, remarque et note vidés ; `definitif` ne change pas ;
  - éléments générés : prix et coût à 0 ;
  - puis recalcul.

### 5.7 Coûts / QR [P: `CPD.setRefQuantityTable@439-617`, `@1216-1686`]

- Ligne principale : `R(real/Q, arrondir)`, `R(ouv/Q, arrondir)` et `R(inv/Q, arrondir)` ; vide si Q = 0.
- Ligne d'ouvrage : mêmes ratios avec les totaux de l'ouvrage.
- Exemple : doc 252, BRA = 53 → 6 936.60 · 685.30 · 6 936.60.

### 5.8 CHIFFRES CLEFS (`keyFigures.KeyFigureFrame`)

#### 5.8.1 Catégories

Seules trois catégories sont accessibles : **Volumes · Surfaces et coûts · Énergie grise** [P: `initKeyFiguresMenuTable`, cas 1, 3, 4]. Les écrans SIA 416, « Indice de forme », « Quantités de base » et `SurfaceDialog` ne sont pas accessibles : ils ne sont pas reproduits.

#### 5.8.2 Surfaces et coûts (unités fonctionnelles)

**Tableau** Nom | Calcul | Coûts (150) | Unité :
- groupé par genre, dans l'ordre 1, 2, 3, 4 ;
- chaque groupe a un en-tête gras sur fond gris et se termine par une ligne vide ;
- seules les unités « afficher » apparaissent ;
- arrondi à 0,01 à l'écran, arrondi du document à l'impression (§0 n° 6).

**✎▾ « Chiffres-cléfs »** ouvre « Calculs » (`FunctionalUnitsDialog`, « Paramétrer les chiffres clés ») :
- colonnes Nom | Équation | Unité (60) | Type (200) | M (25) ;
- boutons + ; éditer (ou double-clic) ; − (sans confirmation) ; |< < > >|.

**« Définir le calcul »** (`EquationDefinitionDialog`) :
- champs : Nom · Équation (**non saisissable**, construite par le menu) · Unité (texte libre) · Type (4 genres) · Afficher (coché) ;
- menu +▾, par groupes :
  - Addition, Soustraction, Multiplication, Division ;
  - Parenthèse ouvrante, Parenthèse fermante ;
  - Groupe principal eCCC (`|X|`), Coût d'investissement (`eBât`), Quantité référentielle (navigateur Abrév. | Désignation | Unité) ;
  - Coûts selon CFC (0 - 9) `CFC_0-9`, (1 - 9) `CFC_1-9`, (2) `CFC_2`, (4) `CFC_4` ;
  - Volume (`GV`) ; Valeur personnalisée (« Valeur », « Nom », insérée sous la forme `valeur [nom]`) ;
- chaque opérateur est inséré précédé d'une espace. Les opérateurs sont inactifs si l'équation est vide ou finit par un opérateur ou par « ( » ;
- − vide l'équation. OK exige un nom et une équation qui ne finit ni par un opérateur ni par « ( ».

**Évaluation** [P: `solveEquation`, `calcFuntcionalEntites@0-92`] :
1. retirer le texte entre `[…]` ;
2. substituer par **jetons** (délimiteurs : espace et `+ - * / ( )`), en écrivant les nombres au format `0.000` (3 décimales) :
   - `CFC_0-9` = somme des groupes CFC TTC ; `CFC_1-9` = la même sans le groupe 0 ; `CFC_2` et `CFC_4` = montant du groupe ;
   - `GV` = `volumes.VB` ; `eBât` = `inv` ;
   - code d'une grandeur = sa quantité ; `|X|` et `|X01|` = coût de l'élément ;
3. évaluer l'expression ;
4. arrondir.

L'original remplace les sous-chaînes (`String.replace`) : ce bug n'est pas à reproduire.

**Contrôles à OK** (`checkEquation`) :
- syntaxe invalide : « L'équation est incomplète, contient des erreurs » / « ou ne peut pas être calculée. » (bloquant) ;
- NaN : « Attention, division par 0 dans l'équation. » (avertissement) ;
- résultat 0 : « Le résultat est 0. » (avertissement).

**L'unité n'est qu'un libellé** : « BRA / FA » affiche 0.50 « % », sans multiplier par 100.

**Unités créées par défaut** (norme récente) [P: `Init.initDocument@2204-3263`, identiques dans les 13 documents] :

| Nom | Équation | Unité | Genre |
|---|---|---|---|
| USA / FA | USA/FA | % | 1 |
| FGA / FA | FGA/FA | % | 1 |
| BRA / FA | BRA/FA | % | 1 |
| SA / FA | SA/FA | % | 1 |
| ESA / FA | ESA/FA | % | 1 |
| BEV / FA | BEV/FA | m | 1 |
| BKP 2 / FA | CFC_2/FA | CHF/m2 | 4 |

#### 5.8.3 Volumes

- **Dialogue « Volumes [m3] »** : Volume bâti VB, Volume net VN, Volume de construction VC, Volume utile VU, Volume de dégagement VD, Volume d'installation VI, Volume utile principal VUP, Volume utile secondaire VUS.
- **Tableau** Description | Code | Quantité | Unité :
  - en m³ : VB, VN, VC, VU, VUP, VUS, VD, VI ;
  - en % (2 décimales, 0 si la base est nulle), en trois blocs : VB = 100, VN/VB, VC/VB │ VN = 100, VU/VN, VD/VN, VI/VN │ VU = 100, VUP/VU, VUS/VU.
- **Graphique** « Volumes [%] » : VN/VB, VC/VB, VU/VN, VD/VN, VI/VN, VUP/VU, VUS/VU, **avec les bonnes formules**.

#### 5.8.4 Énergie grise

- Tableau Code (70) | Désignation (350) | Énergie grise (120) | « kWh/m2 a ». Groupes principaux en gras ; « Total » = somme des groupes principaux.
- Graphique▾ : « Groupes principaux eCCC », puis, pour chaque groupe principal, ses groupes, puis leurs éléments.
- Aucune valeur dans les données du bureau.

---

## 6. APERCU, CALCUL DES RESULTATS, système référentiel, valeurs référentielles, imports et exports

### 6.1 APERCU ▸ Editer (`setOverviewTable@103-2272`, recalcul complet préalable)

**Colonnes** (libellés `CostPlanningDialog.over*`) :

| # | En-tête | Larg. |
|---|---|---|
| 1 | Code | 70 |
| 2 | Désignation | 300 |
| 3-4 | OUV · Localisation | 65 (si ouvrages) |
| 5 | Abrév. | 90 |
| 6 | Quantité | 120 |
| 7 | (unité) | 40 |
| 8 | Param. coût | 100 |
| 9 | (« % » pour V, Y, Z, sinon « CHF ») | 40 |
| 10 | Coût [CHF] | 120 |
| 11 | Coût investis. % | 120 |
| 12 | Coût réalisation % | 120 |
| 13 | Coût de l'ouvrage % | 120 |
| 14 | CHF/m² SP | 120 |

**Lignes des groupes principaux** (ceux dont `gv ≠ 0`) :
- Code, texte, Abrév. = grandeur, Quantité, Param. coût = prix, Coût = `gv` ;
- % investissement = `100·gv/inv` (2 décimales) ;
- % réalisation = `100·gv/real` si le groupe est dans la plage, sinon vide ; même règle pour le % ouvrage ;
- **CHF/m² SP = gv / quantité de la grandeur `FA`** (2 décimales), avec repli sur « SP » ou « GF » si FA est absente ;
- ligne surlignée si le groupe a des ouvrages.

**Lignes d'ouvrage** :
- OUV, Localisation, Abrév., Quantité, Unité, Prix, Coût ;
- % ouvrage = `div / Σ(même ouvrage dans la plage C–G)` ; CHF/m² = `div / FA de l'ouvrage` ;
- DeltaSub calcule en plus `100·div/inv` et `100·div/real de l'ouvrage`.

Deux anomalies de l'original ne sont pas reproduites :
- le « Coût investis. % » de l'ouvrage est écrit dans la ligne parente (`@1186`) ;
- le « Coût réalisation % » de l'ouvrage vaut toujours 100 (`@1401-1407`).

**Synthèse** : une ligne vide, puis trois lignes en gras et surlignées :
- « A - Z | Coût de l'investissement » · « B - W | Coût de la réalisation » (« de - à ») · « C - G | Coût de l'ouvrage » ;
- coût = `R(Σ, arrondir)`, avec son CHF/m² ;
- une ligne par ouvrage si FA a des ouvrages.

**Coûts selon CFC** (`writeBKPCosts`) :
- une ligne vide, puis l'en-tête « 0 - 9 | Coût de l'ouvrage selon CFC » ;
- une ligne par groupe CFC (1er chiffre), triée : texte du catalogue CFC de l'affaire, coût, `100·v/total09` ;
- « Coût de l'ouvrage selon CFC (0-9) » (100 %) ; « … (1-9) » (`100·total19/total09`).

**Graphique** (SVG, `mgChart` l.2107) : axe « CHF », titre « <vue> [CHF] », quatre vues :
- « Groupes principaux eCCC » ;
- « Coûts selon eCCC » (3 barres) ;
- « Coûts selon CFC (0-9) » ;
- « Coûts selon CFC (1-9) ».

**Liste** : « Estimation des coûts… [Ancien document] » (§8.5).

### 6.2 CALCUL DES RESULTATS (`aftercalc.*`)

**Disposition** : deux catégories, « Recalculer » et « Résultats ».

**Barre de « Recalculer »** :
- Import ▾ « Importer un contrôle du coûts… », actif **seulement si le tableau est vide** ;
- Éditer (ligne sélectionnée) ;
- Supprimer ▾ « Supprimer les paiements et le calcul… » / « Supprimer les attributions d'éléments… », avec la confirmation « Voulez-vous supprimer ces données de manière irrévocable? » ;
- roue.

**Import** :
- **Choix du contrôle** : seuls ceux de l'affaire à l'état **3 Terminé** comptent.
  - Plusieurs : fenêtre « Contrôles des coûts » (Date | N° de version | Version).
  - Un seul : import direct.
  - Aucun : « Il n'existe aucun contrôle du coûts dont le statut est terminé. »
- **Paiements repris** : ceux des contrats, des avenants et hors contrat.
  - `to` et `lg` sont vidés si l'estimation n'a pas d'ouvrages.
  - Un paiement dont l'entreprise est absente est ignoré.
- **Tri** : par lot (comparaison de texte) ; à lot égal, le dernier inséré passe devant.
- **Instantané** : la structure du document est figée (§2.9).
- **Prérequis côté DeltaSub** : `CC_STATE` corrigé et `refNum` des lignes (§2.12.2 n° 7).

**Tableau « Recalculer »** (14 colonnes) : id · Lot d'adj. 70 · Adjudication · N° pmt 50 · CFC 60 · Ouvrage 70 · Localisation 70 · Paiement HT 120 · TVA 80 · Paiement TTC 120 · Code 55 · Désignation · Valeur réf. HT · Valeur réf. TTC.
- **a) Paiement** : en gras, fond RGB(243,243,243) ; HT = net − TVA, TTC = net.
- **b) Ligne CFC** (si net ≠ 0) : HT = net − TVA ; col. 12 = Σ des HT attribués ; col. 13 = Σ (HT + TVA).
- **c) Élément attribué** : code, texte de l'instantané, HT, HT + TVA.

**Panneau de détail** : CFC + texte · Numéro de paiement · Date du paiement · Numéro de facture · Date de la facture · Adjudicataire · Paiements · Remarque paiement · (ouvrage) · **Coûts selon CFC** (TTC) · **Coûts selon eCCC** (« code montant | … ») · **Différence** = net − Σ(HT + TVA).

**Attribution** : double-clic sur une ligne CFC. Sur une ligne de paiement : « Sélectionnez le détail du paiement. »
- **Fenêtre** « Attribuer des élément » (sic), consigne « Attribuer les paiements aux éléments » :
  - en-tête : CFC, Total TTC, TVA, Total HT, ouvrage ;
  - tableau N° 70 | Texte | Montant HT 120 | TVA 100 | [%] 60 ;
  - boutons + / éditer / −▾ (« Supprimer la position » / « Supprimer toutes les positions »).
- **+ ouvre le « Navigateur d'éléments »** : Code | Désignation, recherche, sélection simple, et la case « Afficher uniquement les éléments proposés », cochée par défaut, qui montre dans l'ordre :
  1. les éléments dont une attribution CFC est égale au CFC payé (éléments, SE, composants, ouvrages) ;
  2. à défaut, les éléments tirés de la table de propositions du bureau ;
  3. dans les deux cas, seulement les éléments non générés, actifs, de montant ≠ 0.
  - Case « Afficher toutes les éléments ».
  - Un groupe est refusé : « Les positions générées telles que ^0 ne peuvent pas être attribuées. »
  - Un élément de montant 0 demande confirmation : « L'élément ^0 n'a pas été utilisé dans le calcul. » / « Voulez-vous l'utiliser quand même? »
- **Fenêtre « Coûts selon élément »** :
  - « Pourcentages [%] » saisi ;
  - Montant HT = `% × 0,01 × (net − TVA)` et TVA = `% × 0,01 × TVA`, en lecture seule, arrondis à 0,01 ;
  - Remarque ; « < » propose `100 − Σ%` des autres lignes.
- **OK** :
  - Σ% > 100 : « Les pourcentages sont supérieurs à 100. » (bloquant) ;
  - 0 < Σ% < 100 : « Les pourcentages sont inférieurs à 100. Souhaitez-vous vraiment continuer ? » ;
  - l'attribution est rangée dans l'élément (sans ouvrage) ou dans l'ouvrage de même og/lg ;
  - un même couple (paiement, ligne) remplace l'attribution existante ; enregistrement immédiat.

**Tableau « Résultats »** : Code 65 · Désignation · OUV 70 · Localisation 70 · Quantité réf. 110 · (unité) 30 · Prix déterminé 140 · Montant déterminé 140 · Prix recalculé 140 · Montant recalculé 140 · Différence 140 · [%].
- Montant déterminé = `gv` actuel du document.
- Montant recalculé = Σ des HT attribués. **Pour Z : Σ des TVA de toutes les attributions.**
- Groupes : Σ des éléments non générés dont le code **contient** celui du groupe ; par ouvrage, cumul par og/lg.
- Prix recalculé = recalculé / q ; vide si q = 0 ou si le prix est en %.
- Différence = déterminé − recalculé ; [%] = `100 · recalculé / déterminé`.
- Lignes affichées si déterminé ≠ 0 ou recalculé ≠ 0. Gras jusqu'à 3 caractères ; surlignage pour 1 caractère.
- L'en-tête d'origine « [%} » est corrigé en « [%] ». L'anomalie `getRecalcedVat` (seule la 1re subdivision est cumulée) n'est pas reproduite.

**Graphique** :
- vue « Répartition : Groupes principaux eCCC [%] » : une barre par groupe principal, valeur `100 · recalculé / déterminé` ;
- puis vues par groupe : niveau 2, puis niveau 3 ;
- le menu n'inclut pas Z.

**Suppressions** : « Supprimer les attributions » **ne vide que les attributions**. L'original vide aussi l'instantané, ce qui bloque ensuite l'import : c'est corrigé.

### 6.3 Système référentiel

- **Non reproduit** : l'opération est masquée en production, elle efface les éléments et les quantités, et elle télécharge un catalogue CRB [P: `NewCatalogueDialog`].
- La fiche affiche seulement, en lecture : « eCCC-Bât 2022 — Grandeurs référentielles A (511) » ou « B (514) ».

### 6.4 Valeurs référentielles d'une affaire (`CostObjectsBrowserDialog`)

- **Titre** : « Insérer les valeurs référentielles d'une autre affaire ».
- **Liste** : documents **non supprimés, autres que le document courant, au statut 2 ou 3**, avec l'aide « Documents avec le statut validé ou Affaire de réfférence : ». Colonnes : N° d'affaire | Nom d'affaire | Statut | Utilisateur | Version | N° de version | Note.
- **Options** :
  - radios « Reprendre les valeurs référentielles (jusqu'au niveau 3) » / « Reprendre les valeurs référentielles recalculées (jusqu'au niveau 3) » ;
  - cases « Remplacer les valeurs référentielles existantes » et « Reprendre les CFC ».
- **Algorithme** (appariement par code d'élément) :
  - sauter l'élément si « Remplacer » est décoché et que son prix est déjà ≠ 0 ;
  - sinon, `prix` = prix de la source, `cout = 0`, puis recalcul ;
  - si le prix source est ≠ 0, `origineprix` = « <N° affaire> <titre affaire> » ;
  - « Reprendre les CFC » ajoute les CFC de la source.
- **Écarts volontaires** (l'original est inopérant ou incohérent sur ces points) :
  - option « recalculées » = Σ des HT attribués / quantité de l'instantané, lus dans `resultats`. L'original donne 0 : le champ qu'il lit est transient ;
  - prix de l'ouvrage source quand il existe (l'original prend toujours le prix de l'élément) ;
  - pas de doublon de CFC.

### 6.5 Valeurs référentielles : autres sources

#### 6.5.1 Calculs précédents

`CostDocumentsBrowserDialog`, titre « Navigateur de déterminations des coûts » :
- même liste de documents qu'au §6.4 ; tableau des ouvrages, ou « - » sans ouvrages ;
- tableau Texte | Valeur | Unité | **M** :
  - lignes : Prix unitaire, Prix unitaire recalculé (M décoché par défaut), Énergie grise, Coefficient U, Effet de serre, Remarque, Note interne, Description, Exécution ;
  - pour un SE, en plus : Vie moyenne, Intervalle d'entretien, Coûts annuels de maintenance, Calcul selon composants ;
  - « M » est coché par défaut si la valeur est ≠ 0 ou non vide ;
- tableau des CFC et case « Transférer l'affectation CFC » ;
- seules les valeurs cochées sont reportées dans l'élément.

#### 6.5.2 Base du bureau

**« Valeurs référentielles des éléments »** (`StatisticalValuesDialog`) :
- colonnes : Code eCCC | Nom eCCC | Nom | Source | Région | Unité | Quantité | Prix unitaire | Montant | Date de l'indice | Indice ;
- dialogue « Valeur de l'élément » :
  - Elément eCCC, Nom (obligatoire), Source (avec suggestions) ;
  - Région : Suisse, Zurich, Plateau suisse, Suisse nord-occidentale, Suisse centrale, Suisse orientale, Tessin, Arc lémanique ;
  - Unité, Quantité, Prix, **Montant = Quantité × Prix** ;
  - Date de l'indice ICC (mois 0 à 11 + année), Indice ICC, Description, Remarque.

**« Valeurs référentielles des sous-éléments »** (`ConstructionPartsDialog`) :
- à gauche, les SE du bureau ;
- à droite, leurs composants : Numéro | Nom | Unité | Quantité | Prix unitaire | Montant | CFC, avec +, ✎, − et flèches ;
- le dialogue d'un SE ajoute CFC, Description, Exécution, Remarque, énergie grise, U et GWP.

**« Structure des éléments pour les valeurs référentielles »** (`EBkpElementsDialog`) :
- tableau `ebkpelement` ; bouton « Nouvel élément » ;
- « Importer le eCCC » n'est **pas reproduit** (CRB) ;
- suppression refusée si l'élément porte des valeurs : « Cette position ne peut été supprimée car elle contient des valeurs référentielles ».

**Sélecteur « Base de données de valeurs référentielles »** (ouvert depuis le dialogue d'élément) :
- colonnes : Région | Quantité | Unité | Valeur | Montant | Indice ICC | Valeur indexée ;
- formule d'origine : `indice × prix / PROJECT.BASISINDEX`, et 0 si l'indice de base vaut 0 [P: `PriceDataInputDialog.calcIndexValue@0-32`] ;
- au bureau, BASISINDEX vaut 0 pour les affaires 2451, 2951 et 3601, et tous les indices valent 0. On **reprend donc le prix brut** (§12 n° 4).

**Exclure toute ligne dont la source est le CRB.**

### 6.6 Import CSV de quantités (« Import BIMeq… », `cad.ImportFromArchiCadDialog`)

- **Dialogue « Import de quantités référentielles »** :
  - aide « Importer des quantités référentielles depuis fichier *.csv » ;
  - Nom du fichier ; Séparateur (Tab, « , », « ; ») ; « Ouvrage » ; case « Afficher uniquement les positions avec des quantités » ;
  - tableau Abrév. | Désignation | Quantité réf. | Unité.
- **Lecture** :
  - UTF-8, **1re ligne ignorée** ;
  - colonne 1 = quantité (virgule remplacée par un point), colonne 2 = unité, colonne 3 = code ;
  - la désignation est reprise du document ;
  - format du manuel DE p. 67 : Classification | Quantité | Unité | Code.
- **OK** : pour chaque code connu, la quantité de la grandeur (ou celle de l'ouvrage choisi) est remplacée et **les lignes de calcul sont effacées**. DeltaSub avertit avant d'écraser.
- La conversion des codes français en codes allemands est sans objet.

### 6.7 SIA 451 (facultatif, dernier lot)

- **Dialogue « Export SIA451 »** : Statut du document (A/B/C/D) ; Version précédente (A/B) ; Version du document ; Société (Expéditeur) ; Responsable ; Téléphone ; Courriel ; filtre éléments de / à et Ouvrage ; case « Export CFC ».
- **Fichier** : `Sia451.e1s` (UTF-8), zippé en `.crbx` avec les documents.
  - Enregistrements : A (type « K »), B001/B002, D000 à D6, E0 à E6, Z.
  - Carte des positions : `research/cp_documents/w/siamap.py`.
- **Non reproduits** : code client CRB (msg1), validation SIATEST, import SIA451 (contrôles de langue, de version et de système).
- Aucun usage au bureau [D].

### 6.8 Export du tableau

La roue de chaque tableau propose :
- « Copier le contenu du tableau dans le presse-papier » (texte séparé par des tabulations) ;
- « Exporter le tableau dans un fichier CSV », avec les en-têtes du §4.2 ; en UTF-8 avec BOM dans DeltaSub.

---

## 7. Flux vers le devis général et le contrôle des coûts

### 7.1 « Créer un devis selon le CFC… » (`convert.CreateEstimateDialog`) → `costestimatedocument` + `costestimate`

**Avant l'ouverture** :
- msg11 si l'attribution CFC est incomplète (simple avertissement) ;
- « Toutes les subdivisions ne sont pas définies. » (bloquant, §3.9).

**Dialogue « Créer un devis »** (« Créer un devis selon le CFC ») :
- « Titre » (obligatoire, ≤ 30) ;
- « Marge d'approximation du DG » (obligatoire, ≤ 30) ;
- case « Transférer les désignations des éléments dans le devis général » ;
- case « Transférer la description dans le devis » ;
- « Transférer les quantités référentielles » est masqué hors version de développement : non reproduit.

**Au clic sur OK** :
- si Z vaut 0 : « Aucune TVA n'a été définie. », et abandon (cas réel : doc 252) ;
- si `arrondir` est faux : « Vous avez désactivé la fonction Arrondir. Les montants sont reportés arrondis dans le devis. » ;
- à la fin : « Le devis a été créé dans le module DELTA devis. »

**Algorithme** (`convertCostToEstimate` + `addToKagList`) :
1. Ignorer les éléments Z… et les éléments générés, ainsi que les CFC **57…**.
2. Chaque attribution (élément, ouvrage, SE, ou composant avec CFC à 100 %) devient une ligne dans la position CFC `numero`, créée si elle n'existe pas :
   - quantité 1, prix HT = montant HT, `var` = position éventuelle ;
   - `tva` = 0 pour les éléments A…, sinon le taux de Z ; `ttc = R(montant × (1 + tva/100), true)` ;
   - commentaire, si l'option est cochée : « <code> <texte> », « … \| <n° SE> <texte> » ou « … \| <n° comp.> <texte> » ;
   - description, si l'option est cochée : ajoutée au descriptif de la position.
3. Générer les parents CFC à 1, 2 et 3 chiffres, puis trier.
4. Prendre les textes dans le catalogue CFC de l'affaire, coupés à 30 caractères : `texte` = [0,30), `texte2` = le reste.

**Correspondance DeltaSub** (schéma de `dvEditDoc` l.2564-2579 et de `dvAdd` l.2622) :
- `costestimatedocument` :
  ```
  {ID:new, PROJECT_ID, VERSION:titre, VERSIONNUMBER:nb+1, STATECODE:0, CHANGEDDATE:today(), USERID:ME.id,
   ISVATSEPARETED:1, ISAPPLYSUBPROJECTS: celui de l'estimation, ISMARKEDASDELETED:0, NOTE:'Export du devis selon eCCC'}
  ```
- `costestimate` :
  ```
  {schema:1, DOCUMENT_ID, PROJECT_ID,
   reglages:{arrondi5ct:true, pourcentageSur:'groupe', marge, indice:'', etatProjet:'', etatPlanification:'',
             textesLibres:['','','','',''], titres:{document:titre}},
   ouvrages: depuis ouvragesDetail → {code, SUBPROJECT_ID, lg:''},
   positions:[{cfc, texte, texte2, genere, descriptif, descriptifFormat:null,
               parts: dvNewParts(E) avec lignes:[{commentaire, base:null, formule:'', qte:1, unite:'', prixHT, tva, var, ttc}]}],
   remarques:[], presentations:[], filtres:[]}
  ```
- chaque ligne est rattachée à la part de l'ouvrage correspondant (`ouv`) ;
- puis `dvOpen(ID)`.

### 7.2 Contrôle des coûts

- Le seul flux est l'import du Calcul des résultats (§6.2).
- **Prérequis** :
  - `CC_STATE` (l.2720) devient `{0:'Provisoire',1:'En cours',2:'Etat intermédiaire',3:'Terminé'}`, y compris dans la liste de choix du dialogue (l.2874) ;
  - `refNum` des lignes de paiement.

### 7.3 Descriptif selon le CAN

Non reproduit (§1.4).

---

## 8. Impressions

### 8.1 Nouveau document « Estimation des coûts » (ELEMENTS ▸ Documents, `documents.ElementDocumentsFrame`)

**Panneau « Documents »** (150 px) : une seule ligne, « Document » (colonnes Nom du document | Document disponible | PDF disponible).

**Barre** :
- Nouveau ▾ : « Ouvrir… » · « Ouvrir PDF… » · — · « Créer un PDF comme jointe au document… » ;
- Supprimer ▾ :
  - « Effacer le document… », refusé si un PDF existe (« Un fichier PDF existe déjà. »), sinon confirmation « Voulez-vous supprimer ce fichier définitivement ? » ;
  - « Effacer le PDF… » ;
- roue : préférences (§8.2).

**Panneau « Fichiers PDF »** (dossier `archive`) :
- colonnes Nom du fichier | Date de dernière modification ;
- actions : Ouvrir · Partager · Import fichier PDF · Fusionner · Supprimer ;
- à l'import, les caractères `" * / : ; < > ? |` sont interdits dans le nom : « Le caractère ^0 ne doit pas être utilisé dans le nom du fichier. » ;
- dans DeltaSub, ces PDF exigent le stockage de fichiers (§8.6) ; à défaut, on imprime directement depuis le navigateur.

**Ouvrir** :
- sans `element.dpdoc`, la fenêtre « Choisir le modèle » (type `costPlanningDocument`) s'ouvre d'abord ;
- avertissements :
  - `msgRoundIsOn` si un arrondi 1/100/1000 est actif : « Attention, vous utilisez une fonction d'arrondi pour un aperçu approximatif. Uniquement possible pour les montants d'éléments. » ;
  - msg11 si l'attribution CFC est incomplète ;
- **le document porte sur la liste filtrée** de l'éditeur ;
- ne pas reproduire le bug « Oui annule l'ouverture » quand un PDF existe (`@29-73`).

**Nom de PDF proposé** : « Planificateur de coût.pdf ».

### 8.2 Préférences du document (roue) → `impressionDoc`

| Case | Défaut | Effet |
|---|---|---|
| Afficher les subdivisions | vrai | agit seulement sur le tableau des quantités référentielles ; les lignes d'ouvrage des éléments sont **toujours** imprimées [P: `ElementsReportData@127-167`] |
| Afficher les sous-éléments | vrai | — |
| Afficher les composants | faux | — |
| Afficher la deuxième structure | faux | lignes CFC sous chaque élément |
| Afficher les positions éventuelles | vrai | — |
| Arrondir à 1 / à 100 / à 1000 | faux | voir ci-dessous |
| Afficher le calcul de quantité référentielle | faux | — |

**Arrondis 1 / 100 / 1000** :
- les trois cases s'excluent mutuellement ;
- formule : `ceilN(v) = i` si `i % N = 0`, sinon `i + N − i % N`, avec `i = trunc(v)`. « À 1 » tronque donc les décimales ; « à 100 » et « à 1000 » arrondissent vers le haut ;
- ils s'appliquent par un recalcul sur une copie (`new CalcElements(…, doRound1/100/1000)`), et seulement aux montants d'éléments.

Ces préférences sont enregistrées **par document** dans les données partagées, jamais dans `localStorage`.

### 8.3 Modèle `.dpdoc` « costPlanningDocument » (jeu 1 = jeu 2, fr ; pas de jeu 0) [P: `modeles.json`, 4 `element.dpdoc`]

**Gabarits** :
- A4 paysage 297×210, marges g15 h25 d15 b20 :
  - en-tête de 3 cellules, logo à gauche : remplacer le logo d'exemple « A0 architekten Logo.png » par celui du bureau ;
  - pied de page `{appUser:userName}` à gauche, `{pageNumber} | {nofPages}` à droite ;
- A4 portrait 210×297, marges g25 h25 d15 b20.

**Styles** :
- texte : `title` AkkuratLLTT-Black 11 · `subTitle` Light 8 #606060 · `text` Light 8 · `textBold` Regular 8 · `pageSide` Light 8 #333 ;
- lignes : `ch` Bold 8, `c1` fond noir, `c2`/`c3` Light 8 (hauteur 4 mm), `cd` Italic 8, `ct` Bold 8 avec filets de 0,5 pt ;
- titres de bande : bordure basse 0,25 pt #333.

| # | Section | Page | Contenu |
|---|---|---|---|
| 1 | Page de garde | Portrait | `{reportTitle}` · Affaire · Filtre · Maître d'ouvrage (adresse ‖ tél., e-mail) · Architecte · Planificateur (+ responsable) · Grandeurs référentielles `{costPlanReferenzSysem}` · Indice · Etat de la planification · Etat du projet · Marge d'approximation · Date (`dateLong`) · « Total TTC » CHF `{amountTotal}` |
| 2 | Grandeurs référentielles | Paysage | titre, Affaire, Date, adresses courtes · `baseQuantityTable` |
| 3 | Vue d'ensemble | Paysage | + Filtre · `overviewTable` (k0..k5 = v, v, v, f, f, f) |
| 4 | Eléments | Paysage | `elementTable` (k0..k2 = f, f, f) |
| 5 | Coûts selon CFC | Portrait | `kagListTable` (k0 = allDigit, k1 = vrai) |
| 6 | Chiffres-clés | Portrait | sous-titres « Volumes » `volumeTable`, « Surfaces » `surfaceTable` |
| 7 | Evaluation écologique | Portrait | `energyTable` |
| 8 | Descriptif | Paysage | `elementTable` (k1 = k2 = vrai ; oui/non affichés en « x ») |

**Champs** (`ElementsReport$StringField`) :
- maître d'ouvrage : membres non masqués, ou ceux de l'ouvrage si un filtre est actif ;
- `staff` (USERID) ; `docDate` ; `docTitle` (c'est le titre du rapport, « Calcul des coûts ») ;
- `amountTotalExcludedVat` = `R(inv − tva)` ; `amountVat` = tva ; `amountTotal` = `R(inv)` ;
- `constructionPriceIndex` (1 décimale) ; `constructionPlanningStatus` ; `constructionCostEstimateProjectState` ; `constructionCostEstimateAccuracy` ;
- `reportFilter` (vide dans le nouveau moteur) ; `projectBaseIndex` ;
- `costPlanReferenzSysem` : « eCCC-Bât (<version>)/Grandeur référence A », ou « …/eCCC-GC : Grandeurs référentielles B » ;
- `constructionInternalVersionNr` / `…Version` / `…Note` ;
- plus les champs de l'affaire (Project) et des contacts (Contact).

**Colonnes des tables** (libellé · largeur en mm · d = aligné à droite · M = masqué) :

- **baseQuantityTable** : Abrév. 14 · Désignation 14 (extensible) · OUV 14 (« Ouv. ») · Quantité réf. 25 d · Unité 10 d · Définitif 20 M · Remarque 30 M · Note interne 14 M · Résultat 14 M · Coût de réalisation/QR 35 d · Coût de l'ouvrage/QR 35 d · Coût d'investissement/QR 35 d.
  - Seules les grandeurs de quantité ≠ 0 sont imprimées.
  - Lignes de calcul « <commentaire>, Calcul : <formule> » si l'option est cochée ; ouvrages si « Afficher les subdivisions ».
- **overviewTable** : Code 10 · Désignation 30 · Ouvrage 12 · Abrév. 15 M · Quantité 25 d · Unité 9 · Valeur réf. 17 d · Unité 9 d · Coûts 24 d · Coût investis. % 30 d · Coût réalisation % 32 d · Coût de l'ouvrage % 32 d · CHF/m² SP 20 d.
  - Titres : « Coût total selon eCCC », « Coût de l'investissement (A - Z) », « Coût de la réalisation (B - W) », « Coût de l'ouvrage (C - G) », « Coût de l'ouvrage selon CFC » (0-9, 1-9).
  - Options : k0 Groupes d'éléments ; k1 Groupes principaux CFC ; k2 Coût de l'investissement ; k3 subdivisions ; k4 « Utiliser la surface de plancher comme surface de référence » ; k5 « Utiliser les coûts de l'ouvrage comme coûts de référence ».
  - Formats : `formatProc` `0.0 %`, `formatProc2` `0.00 %`, `formatProc20` `0.00`.
  - **SP = FA** : écart volontaire (§0 n° 7).
- **elementTable** : Code 12 · SE Code 8 · Comp. 8 · Désignation 40 · OUV 15 · Grand. réf. 15 · Unité 15 · Quantité 25 d · Prix 25 d · Unité 15 d · Coûts 25 d · [%] 12 d · Remarque M · Notes internes M · N° CFC M · Coûts selon CFC M · Différence M · Option M · Définitif M.
  - Un élément est imprimé si sa valeur ≠ 0, si son coût fixé ≠ 0, s'il a des documents ou des images, ou s'il ne contient que des positions éventuelles et que l'option est cochée.
  - k0 : seulement les codes ≤ 3 caractères. Filtre `seulementUtilises`.
  - Quantité et prix vides si q = p = 0 ; quantité seule si p = 0.
  - Lignes filles, dans l'ordre : deuxième structure (« CFC : <n°> <texte> ») · « Descriptif » · « Réalisation » · « Documents complémentaires » (« DOC » + fichier) · images si `printImages` · ouvrages (toujours) · SE · composants · CAN.
  - Styles : 1 caractère `catalogLevel1`, 3 caractères `catalogLevel2`, sinon `catalogLevel3`.
- **kagListTable** : N° 15 · Désignation 50 · Ouvrage M · Monnaie M · Montant 30 d · % 15 d.
  - Liste CFC TTC (TVA ajoutée sauf pour A et Z), avec les parents générés ; `%` = valeur / Σ des non-générés.
  - Modes : « Totaux récapitulatifs à 1 chiffre » / « à 1 et 2 chiffres » / « Seulement positions de 1 à 3 chiffres » / « Toutes les positions ».
  - k1 : « Les positions supérieures à trois chiffres comme celles à deux chiffres ». Total 100.00.
- **volumeTable** : Désignation 50 · Code 15 · Valeur 30 d · Unité 15 d (m³, puis %, avec **VB = 100**).
- **surfaceTable** : Désignation 50 · Calcul 50 · Unité M · Coûts 30 d ; 4 blocs, un par genre.
- **energyTable** : E Code 15 · SE Code 15 · Désignation 50 · Ouvrage 15 · Énergie grise [kWh/m2 a] 25 d · Coefficient U 20 d · Effet de serre (GWP 100a) 25 d ; chaque commentaire sur sa propre ligne.

**Moteur DeltaSub** : étendre `mgPrint` (l.2012-2049), qui ne lit aujourd'hui que `'0/'+type` et `sections[0]`. Il faut :
- un jeu de modèles paramétrable (1 par défaut) ;
- toutes les sections visibles, chacune avec son gabarit (`@page` nommées portrait et paysage) ;
- l'en-tête et le pied de page ;
- les bandes Grid, Text, Line et Table, et les tables ci-dessus.

### 8.4 Correspondance `impression.options` (ancien moteur, `DocPrefernecesDialog`)

- **Catégories de la fenêtre** : Document, Sommaire, Eléments, Informations des éléments, Sous-éléments, Composants, Quantités référentielles, Choix d'arrondis, Police & Style.
- **Clés** : `calculsQuantites`, `remarquesQuantites`, `composants`, `descriptionsComposants`, `sousElements`, `descriptionsSousElements`, `soumissionSousElements`, `commentaireElement`, `deuxiemeStructure`, `eco`, `eventuelles`, `ouvrages`, `troisNiveaux`, `pourcent`, `seulementCouts`, `images`, `notesInternes`, `realisation`, `description`, `arrondi{a1,a100,a1000,special}`.

### 8.5 Ancien document « Estimation des coûts… [Ancien document] » (visible au bureau)

- **Moteur** : `desc.Printlist` (0 = complet, 1 = quantités réf., 2 = sommaire) et la fenêtre `DocumentDialog` « Estimation des coûts » (navigation, zoom, Imprimer, « Saut de page », « Préférences »).
- **Modèle** : `projectTemplates/<groupe>/projectCostplannigElements/Kostenermittlung`.
  - Groupes existants : Default, Standard, **Substances**, **Substances_2**.
  - Mise en forme : AkkuratLL-Light 9 et 12, A4 paysage 842×595, fonds « A4 Deckblatt / Erste Seite / Folgeseiten Querformat.xml ».
  - Page de garde : `documentTitle`, `date`, `projectNumber`, `projectTitle`, « Maître d'ouvrage : » `projectAddressBuilder`, « Architecte : » `projectArchitectContact`, `reportFilter`, « Marge d'approximation : » `constructionCostEstimateAccuracy`, « Total TTC » `amountTotal`.
  - Pages 1 et suivantes : titre, « Affaire : », « Page n|N », filet, `projectTableHeader` et `constructionCostplanningTable`.
- **Contenu** : les sections, dans l'ordre et selon la visibilité de `impression.documents`.
  - Libellés : « Quantités réf. », « Sommaire », « Coût total selon eCCC », « Chiffres de volume », « Surfaces métriques », « Indicateurs d'énergie », « Coût total selon CFC (0-9) / (1-9) », « Coût d'investissement », « Coût de réalisation », « Coût de l'ouvrage », « /m² GF », « Remarque : », « Note interne : », « Description : », « Exécution : », « Documents complémentaires (nom du fichier): ».
  - TVA de la page de garde avec un filtre : `Z × (Σ groupes filtrés hors Z / Σ groupes hors Z)`.
- **DeltaSub** : passer par `tplPrint` (l.3537), qui sait déjà lire ces modèles `modele`.
- **À faire avant l'implémentation** : désassembler `desc.Printlist.createPrintPositionList` pour établir les colonnes exactes de `constructionCostplanningTable` (§12 n° 10).

### 8.6 Documents et images ; « Exporter les documents et les images… »

- **Saisie** (`DocNameDialog`) :
  - titres « Document externe » / « Image » ; champs « Nom du document », « Nom du fichier » ;
  - conseils : « Document externe, par exemple : pdf, docx, xlsx, png », et la taille recommandée pour les images ;
  - extensions exécutables refusées (.apk .app .bat .cgi .com .exe .cmd .drv .vbs .jar .wsf .cab .cpl .cur .dl .dmp .icns …) ;
  - messages : « Ce nom est déjà utilisé. », « Un document avec ce nom de fichier est déjà utilisé dans l'article ^0. », « L'image est trop grande. »
- **Export** :
  - choix d'un dossier, dans lequel sont créés `Documents/` et `Images/` ;
  - copie des fichiers du document, des éléments, des ouvrages, des SE et des composants, en respectant le filtre actif ;
  - DeltaSub : un zip téléchargé.
- **Stockage DeltaSub** : le serveur n'a pas d'API de fichiers (seulement `/api/ping`, `snapshot`, `changes`, `ids` et `commit`).
  - Il faut **ajouter `/api/file`**, qui dépose les fichiers dans `~/Library/Application Support/DeltaSub/fichiers/costplanning/<ID>/`, accessible au réseau local seulement.
  - Reprendre `docs/Export.csv` du doc 202 à l'import.

---

## 9. Tableau des écarts DeltaSub ↔ original

| Fonction | DeltaSub aujourd'hui (ligne) | Original | Lot |
|---|---|---|---|
| Nom et place du module | « Planification des coûts », 3e (l.345) | « Mes estimations eCCC », 1er | 1 |
| Liste du module | affaires puis documents (l.3235-3258) | documents de l'utilisateur, toutes affaires, colonne n° d'affaire | 1 |
| Domaine d'affaire | absent (l.1474) | « Calcul des coûts » | 1 |
| Statuts | 3 valeurs, « Définitif » (l.3218) | 4 valeurs | 0 |
| `CC_STATE` | faux (l.2720) | 0 à 3 | 0 |
| Boutons de la liste | Nouveau, Ouvrir, Supprimer | + Dupliquer, Editer ▾, Importer ▾ (domaine), roue, Valeurs référentielles ▾, Maj + double-clic | 1 / 2 / 3 |
| Corbeille | marquage sans retour, supprimés invisibles | 2 temps, restauration, affichage | 1 |
| Fiche | aucune ; VERSION imposée ; N° = nombre + 1 ; subdivisions forcées à 0 ; A/B absent (l.3259-3269) | fiche complète, options figées | 1 |
| Contenu initial | copie du plus gros document d'une autre affaire | catalogue de l'affaire + défauts | 1 |
| En-tête | `USERID` écrasé à chaque enregistrement ; `entete` divergent | la table est la seule source | 1 |
| Titre et menus | « ‹ Liste », titre, Présentation, Enregistrer | titre « Détermination des coûts - V (N) », Fichier, Editer | 1 |
| Barre latérale | 3 sections, ordre différent | 5 sections, sous-entrées | 1-3 |
| Concurrence | écrasement silencieux (pas de `bseq`) | verrou | 1 |
| Moteur | q × p ou /100 ; groupes = Σ ; éventuel = 0 (l.3220-3233) | §4.4 complet : arrondi 0,05, % de quantité, quantités calculées, itérations | 1 |
| Quantité d'un élément | saisie libre, copiée une seule fois | = grandeur, partagée | 1 |
| Arrondi | au centime (`r2`) | 0,05 si « Arrondir » | 1 |
| [%] | sur le total, 1 décimale | 2 modes, format « <0.01 » | 1 |
| Colonnes des éléments | 9 | 27 | 1 |
| Filtre « avec montant » | global, vrai par défaut (`CPV.only`) | par document, faux par défaut, + 11 options | 1 |
| Groupes | quantité et prix masqués | quantité et prix dérivé | 1 |
| Ouvrages | ignorés | colonnes, lignes, édition, filtre, « Subdivision… » | 1 |
| Sous-éléments, composants | absents | complets (100-999) | 1 |
| CFC | absent | colonnes, dialogues, +/-, groupes TTC, msg11, propositions | 1 / 3 |
| Coût fixé, Insérer le coût, D, V, « utiliser », origine, exécution, description, écologie | partiel (V, remarque) | complet | 1 |
| Niveau de saisie | absent | dialogue + blocage | 1 |
| Créer et supprimer des éléments | absent | K/U/X, tri, élément standard mis à zéro, effacer les prix | 1 |
| Configuration, Affichage | absents | §3.5-3.6 | 1 |
| Tableau des quantités réf. | 6 colonnes, « null » visible, filtre montant | 16 colonnes, 3 présentations, 3 filtres | 2 |
| Saisie d'une quantité réf. | quantité seule, même pour PSBY | dialogue complet, verrous, Σ des ouvrages | 2 |
| Lignes de calcul | invisibles | dialogue complet | 2 |
| Grandeurs calculées et personnalisées | absentes | §4.4.4, §5.5 | 1 (calcul) / 2 (écran) |
| Coûts/QR | non arrondis, pas d'investissement, pas par ouvrage | 3 ratios arrondis, par ouvrage | 2 |
| CHIFFRES CLEFS | absent | §5.8 | 2 |
| Données de l'affaire | absent | §3.8 | 4 |
| Importer les présentations, importer un calcul | absents | §3.7 | 2 |
| APERCU | 5 colonnes, % à 1 décimale, encart de totaux | 14 colonnes, ouvrages, synthèse, CFC 0-9 / 1-9, graphique | 3 |
| Calcul des résultats | absent | §6.2 | 3 |
| Valeurs référentielles | absentes (collections inutilisées) | §6.4-6.5 | 3 |
| Impression | aucune | `.dpdoc` en 8 sections + ancien document | 4 |
| Créer un devis selon le CFC | absent | §7.1 | 4 |
| Documents et images | absents | §8.6 | 4 |
| Import CSV de quantités, SIA 451, exports | absents | §6.6-6.8 | 2 / 4 |
| Convertisseur | pertes du §2.12.1 | — | 0 |
| Ré-import | écrase les modifications DeltaSub | — | 0 |

---

## 10. Plan par lots et points d'ancrage

### Lot 0 — Préalables sur les données (bloquant)

1. **`convertir_couts.py`** : correctifs du §2.12.2 (l.944-1042, `_ligne` l.245) et vérification par le moteur porté. Rapport attendu : 13 documents, 0 écart.
2. **`serveur_deltasub.py`** : `PROTECTED_IF_EDITED` et `kept2` (§2.12.3, l.42-45, l.189-230).
   - Test sur une base de test `DELTASUB_DB` : modifier un document, ré-importer avec `--force`. Le document modifié doit être conservé, les autres doivent passer en `schema: 2`.
3. **Statuts** : `CP_ST` l.3218 = `{0:'Brouillon',1:'Provisoire',2:'Validé',3:'Affaire de référence'}` ; `CC_STATE` l.2720 (+ l.2860, l.2874).
4. **Lecture v1 en mémoire** (§2.12.4). En attendant le lot 1, corriger l.3227 pour tenir compte de `prixEnPourcentQuantite`.
   - Test : V01.01 du doc 252, rouvert et validé sans changement, vaut toujours 250 000.
5. Relancer `outils_deltaproject/importer_dans_deltasub.sh`.

### Lot 1 — Documents, fenêtre, éléments complets, moteur exact

- **Moteur** : `cpCompute` (l.3220-3233) est remplacé par `cpEngine(P)`, portage ligne à ligne de `cp_calc.py` sur les clés JSON v2.
  - Contenu : `R`, `gv`, `setGenerated`, `setRefCodes`, prépasse, `booked` en 3 passes, `calcRef`, totaux et totaux par ouvrage, groupes CFC, itérations.
  - Retour : `{val, prix, qte, T:{inv, real, ouv, tva, parOuvrage}, cfc:{groupes, total}, diff}`.
  - Fonction pure, testée en Node sur les 13 JSON v2.
- **Listes** : réécrire `VIEWS['coplan']` (l.3235) autour d'un composant `cpList(el,{mode:'module'|'domaine', project})`.
  - Mode module : `USERID===ME.id`.
  - Mode domaine : branche dans `domainView` (l.1499), entrées dans `DOMAINS` et `domainUsed`, sur le modèle du lien l.1563.
- **Fiche** :
  - `cpDocDialog(p,d,mode)`, sur le modèle de `dvEditDoc` (l.2564) ;
  - `cpNew` (l.3259) réécrit selon le §3.3 : `projectcatalog` de type 10, `projectcatalogpos` à ≤ 1 point, `DS.need(['projectcatalog','projectcatalogpos'])` ;
  - `cpDuplicate`, sur le modèle de `dvDuplicate` (l.2582) ;
  - corbeille en 2 temps.
- **Fenêtre** (`cpEditor`, l.3270) :
  - titre, menus Fichier et Editer, Total, navigateur de gauche, `bseq` lu à l'ouverture ;
  - barre latérale à 5 entrées : QUANTITES REFERENTIELLES et CHIFFRES CLEFS marquées « lot 2 », APERCU et CALCUL DES RESULTATS marquées « lot 3 » tant qu'ils ne sont pas livrés.
- **ELEMENTS** :
  - 27 colonnes, styles, menu Affichage (`P.affichage`), filtres par ouvrage et par groupe principal, zoom et saut par lettre, panneau de détail ;
  - dialogues du §4.8 : Référence de coût (avec CFC), Nouveau / Editer, suppressions, SE, Paramètre de coût, Composant, Niveau de saisie, Subdivision ;
  - Configuration et Affichage ;
  - export CSV et presse-papier.
- **Tests d'acceptation** :
  - 0 écart du moteur sur les 13 documents ;
  - valeurs des §11.1 à 11.3, dont la perturbation du §11.2 ;
  - création sur l'affaire 2951 : 413 éléments, 237 grandeurs, 7 unités ;
  - duplication et corbeille ;
  - arrondi : doc 3 G02.02 = 80 000 / 53.35.

### Lot 2 — Quantités référentielles, chiffres clefs, imports d'autres documents

- **Contenu** :
  - tableau des quantités réf. (§5.2), dialogues des §5.3 à 5.6 ;
  - évaluateur sûr, qui remplace `evalQ` (l.2498) ;
  - grandeurs personnalisées, suppression globale, import CSV (§6.6) ;
  - CHIFFRES CLEFS (§5.8), avec `mgChart` (l.2107) pour les graphiques ;
  - « Importer les présentations » et « Importer un calcul d'une affaire » (§3.7).
- **Tests** :
  - lignes réelles : doc 3 FCA, 1000 + 500 = 1 500 ; doc 202 EWIA, 10 + 15 = 25 ;
  - `r` sur 53 donne 54, `r5` sur 53 donne 55 ;
  - messages du §5.4 ;
  - Coûts/QR du §11.4 ; chiffres clefs du §11.5.

### Lot 3 — APERCU, CFC agrégés, valeurs référentielles, calcul des résultats

- **Contenu** :
  - APERCU (§6.1) et son graphique à 4 vues ;
  - propositions CFC (`ebkptobkp` facultatif, et apprentissage) ;
  - valeurs référentielles (§6.4, §6.5) sur `statisticalvalue`, `constructionpart`, `constructioncomponent` et `ebkpelement`, ouvertes depuis la liste et depuis le dialogue d'élément ;
  - Calcul des résultats (§6.2), stocké dans `costplanning.resultats`.
- **Tests** :
  - aperçus des docs 3, 101, 202 et 252 (§11.3) ;
  - msg11 sur le doc 3, pas de msg11 sur le doc 202 ;
  - exemple E5 du manuel (§11.6), reconstitué sur un contrôle des coûts de test.

### Lot 4 — Impressions, devis CFC, données de l'affaire, fichiers, options

- **Contenu** :
  - `mgPrint` multi-sections et tables du §8.3 ; préférences du document (§8.2) ; ancien document via `tplPrint` (§8.5) ;
  - « Créer un devis selon le CFC » (§7.1) vers `costestimate`, en réutilisant `dvNewParts` (l.2535) et `dvOpen` (l.2563) ;
  - Données de l'affaire (§3.8) ;
  - API `/api/file`, documents et images, export zip (§8.6) ;
  - en option : verrou (§3.10) et export SIA 451 (§6.7).
- **Tests** :
  - doc 202 → devis CFC 277.1 / 277.2, TVA 8,1 %, TTC 63 779 ;
  - doc 252 → « Aucune TVA n'a été définie. » ;
  - impression du doc 3 : 8 sections, total TTC 700 379.90.

---

## 11. Valeurs de contrôle

### 11.1 Totaux des 13 documents (recalcul = valeurs stockées) [P: `a_recalc.py`, `costcontrol.json`]

| Doc | Actif | Investissement A–Z | Réalisation | Ouvrage C–G | Remarque |
|---|---|---|---|---|---|
| 1 | non | 30 160.00 | 30 160.00 (**plage A–Z**) | 30 160.00 | G02.02 377 × 80 |
| 2 | non | 0 | 0 | 0 | système 514, 263 grandeurs (dont PA, personnalisée) |
| 3 | non | 700 379.90 | 647 900.00 | 415 000.00 | Z = 8,1 % × 647 900 |
| 51, 52, 151, **152**, 201, 251, **301** | 152, 301 | 0 | 0 | 0 | 301 : totaux imprimés réalisation et ouvrage |
| 101 | non | 273 595.70 | 253 095.00 | 20 000.00 | Z = 20 500.70 |
| **202** | oui | 63 779.00 | 59 000.00 | 59 000.00 | Z = 4 779 |
| **252** | oui | 367 640.00 | 367 640.00 | 36 320.00 | 6 ouvrages ; Z = 0 (pas de TVA) |

### 11.2 Éléments et quantités

**Doc 3** :
- G02.02 = 80 000 : SE 009, composant 001 (1 000 × 80), quantité fixe ; prix R(80 000/1 500) = **53.35** ;
- Z01.01 = 8,1 × 0,01 × PSBY 647 900 = **52 479.90** ;
- groupes : B 232 900, E 210 000, F 125 000 (500 × 250), G 80 000.

**Doc 101** :
- D01.01 = 1 000 × 20 = 20 000 (SE 003) ;
- Z01.01 = 253 095 × 8,1 % = 20 500.695 → **20 500.70**.

**Doc 202** :
- G01.01 = 200 × 120 = 24 000 (CFC 277.2 à 100 %) ;
- G01.02 = SE 000 (15 000) + SE 002 (20 000) = **35 000**, prix 350 (CFC 277.1) ;
- Z01.01 = 59 000 × 8,1 % = **4 779** ;
- W01.02 alimente SOS, grandeur personnalisée calculée.

**Doc 252** :
- V01.01 = ACC11 250 000 × 100 % = 250 000 (**% de quantité**) ;
- V01.05 = SSBT 36 320 × 100 % ;
- groupe V = 331 320, prix de groupe R(100 × 331 320/36 320) = **912.20** % ;
- G02.02/AP3 = SE 5 580 + 7 440 = 13 020 ;
- PSBY = SSBW = 367 640 (AP3 72 640, COM 295 000).

**Perturbation** (doc 3, prix de B02.02 porté à 200) : B02.02 = 200 000, B02 = 260 000, B = 332 900, PSBY = 747 900, Z = **60 579.90**, total 808 479.90 [P: `cp_check2.py`].

**Arrondi** : R(12.345, vrai) = 12.35 ; R(−2.5, vrai) = −2.50 ; R(912.224, vrai) = 912.20 ; R(685.283, vrai) = 685.30.

### 11.3 APERCU (écran, 2 décimales)

**Doc 3** (FA = 1 000) :

| Groupe | Coût | % inv. | % réal. | % ouvr. | CHF/m² SP |
|---|---|---|---|---|---|
| B | 232 900.00 | 33.25 | 35.95 | — | 232.90 |
| E | 210 000.00 | 29.98 | 32.41 | 50.60 | 210.00 |
| F | 125 000.00 | 17.85 | 19.29 | 30.12 | 125.00 |
| G | 80 000.00 | 11.42 | 12.35 | 19.28 | 80.00 |
| Z | 52 479.90 | 7.49 | — | — | 52.48 |

- Synthèse : A–Z 700 379.90 (700.38/m²) · B–W 647 900.00 (647.90) · C–G 415 000.00 (415.00).
- CFC : 281.7 → 80 000 × 1,081 = 86 480, donc CFC 2 = 86 480 (100 % du 0-9), et msg11.

**Doc 101** : B 233 095 (85.20 / 92.10) ; D 20 000 (7.31 / 7.90 / 100.00 ; 20.00/m²) ; Z 20 500.70 (7.49).

**Doc 202** : G 59 000 (92.51 / 100.00 / 100.00) ; Z 4 779 (7.49) ; pas de FA, donc CHF/m² vide ; CFC 2 = 63 779 = A–Z, donc **pas de msg11**.

**Doc 252** : F 23 300 (6.34 / 6.34 / 64.15) ; G 13 020 (3.54 / 3.54 / 35.85) ; V 331 320 (90.12 / 90.12 / —).

### 11.4 Coûts / QR (arrondi 0,05)

| Doc | Grandeur | Réalisation/QR | Ouvrage/QR | Investissement/QR |
|---|---|---|---|---|
| 252 | BRA 53 | 6 936.60 | 685.30 | 6 936.60 |
| 252 | FCA 62 | 5 929.70 | 585.80 | 5 929.70 |
| 3 | FA 1 000 | 647.90 | 415.00 | 700.40 |
| 3 | FCA 1 500 | 431.95 | 276.65 | 466.90 |
| 3 | BSA 30 | 21 596.65 | 13 833.35 | 23 346.00 |
| 101 | FCA 1 500 | 168.75 | 13.35 | 182.40 |

### 11.5 Chiffres clefs

- **Doc 3** (écran, 0,01) : BRA/FA = 0.50 ; **CFC_2/FA = 86.48** CHF/m² (86 480 / 1 000).
- **Volumes des docs 3 et 101** : VB 1 500, VN 1 000, VC 200, VU 800, VUP 400, VUS 300, VD 500, VI 50. D'où VN/VB 66.67 %, VC/VB 13.33 %, VU/VN 80.00 %, VD/VN 50.00 %, VI/VN 5.00 %, VUP/VU 50.00 %, VUS/VU 37.50 %.

### 11.6 Exemples du manuel DE (v16) — tests unitaires du moteur

- **p. 72, arrondi 0,05** : V = 1 992 509.55 × 14.40 % = 286 921.375 → **286 921.40** ; Z = 2 364 180.85 × 7.70 % → **182 041.95**.
- **p. 72, impression, arrondi du document** : FAW/GF = 550/759 → 0.70 ; BKP_2/GF = 2 205 144.10/759 → **2 905.35**.
- **p. 67-68** :
  - 245 × 304.13 = 74 511.85, avec 304.15 affiché en en-tête ;
  - 500 × 304.13 = 152 065, réparti 80/20 en CFC : 121 652 / 30 413 ;
  - 759 × 15.33 = 11 635.47 → **11 635.45** ;
  - composant : 23 × 24 = 552.
- **p. 66** : C 4.2 = 22 200 + 680 = 22 880, prix 22 880/9 = 2 542.22, [%] 1.93 ; C 4.4/100 = 9 065 + 1 904 + 1 996 + 119 = 13 084.
- **p. 73, calcul des résultats** :
  - 3 694.11 TTC = 3 430.00 HT + 264.11 de TVA ;
  - I 3.2 à 15 % → 514.50 + 39.62 ; I 3.3 à 85 % → 2 915.50 + 224.49 ;
  - B 8.1 = 55 555.56 × 25 % = 13 888.89 ; résultat B 8 = 9 130.00 − 13 888.89 = −4 758.89, [%] **152.12**.

---

## 12. Incertitudes restantes et choix recommandés

1. **Position éventuelle au niveau élément ou ouvrage.** L'original la compte, malgré son libellé.
   - **Choix recommandé : l'exclure**, comme le dit le libellé et comme sont traités les SE et les composants.
   - Réglage codé `CP_EVENTUELLE_EXCLUE=true`, écart signalé. Aucune donnée réelle n'est touchée.
   - **À faire valider par Paulo.**
2. **Arrondi des chiffres clefs** : 0,01 à l'écran, arrondi du document à l'impression (prouvé).
3. **CHF/m² SP à l'impression** : l'original imprime une colonne vide, car « SP » n'existe pas. **Choix : FA partout**, écart signalé.
4. **Indexation des valeurs de la base** :
   - la formule d'origine est `indice × prix / BASISINDEX`, et 0 si la base vaut 0 ; elle semble inversée [D] ;
   - au bureau, tout vaut 0 ;
   - **choix : reprendre le prix brut quand l'indice ou la base vaut 0**, sinon appliquer la formule d'origine. La corriger seulement avec l'accord de Paulo.
5. **Table eCCC → CFC** (`EbkpToBpkTable` / `ebkpToBkp`) : origine CRB probable. **Choix : pas de table codée dans DeltaSub** ; import facultatif du fichier du bureau, et apprentissage des choix.
6. **Nouvelle estimation dans une affaire sans catalogue eCCC** : l'original refuse. **Choix : proposer la copie de la structure niveaux 1-3 d'une affaire du bureau**, sous réserve de l'avis de Paulo, car Deltaproject marque ce catalogue « licence requise ».
7. **SE à composants hors %** : le coût est recalculé en `R(q × R(Σ/q))`, ce qui peut s'écarter de Σ de quelques centimes. **Choix : reproduire l'original**, condition des 0 écart ; le dialogue affiche à la fois Σ et le coût retenu.
8. **Convergence** : répéter jusqu'à stabilité, au plus 5 passages ; 2 suffisent sur les données. Un cycle entre grandeurs personnalisées est empêché par le contrôle circulaire.
9. **`execution` d'un SE** = `awardingText` [D] ; aucune donnée ne l'utilise.
10. **Colonnes de l'ancien document** (`constructionCostplanningTable`) : à désassembler avant le lot 4 (`desc.Printlist`, `desc.Display`). **Choix provisoire** : les mêmes contenus que les tables `.dpdoc`, dans le modèle Substances.
11. **Ordre d'insertion d'une grandeur personnalisée** : tri par code [D].
12. **Première ligne forcée à « générée »** (`setGeneratedPositions`) : reproduite ; sans effet sur les données, où A est suivi de A01.
13. **Anomalies de l'original à ne pas reproduire** :
    - impression : ligne VB % = VN/VB ; graphique : série VC/VB fausse ;
    - « Coût investis. % » des ouvrages dans l'aperçu ; « Oui annule » l'ouverture du document ;
    - `displayComponentsDescription` dans « Importer les présentations » ; `String.replace` dans les unités fonctionnelles ;
    - anciens catalogues : PKO/PO, « O 7 » en double ; grandeur personnalisée « PA » prise pour un code calculé ;
    - « Supprimer les attributions » qui bloque l'import ; option « recalculées » qui donne 0 ; `getRecalcedVat` ;
    - Affectation écrite dans la description de la construction ; message de fermeture `msg6` ; oubli de D06 dans le contrôle circulaire.
14. **Localisation (`lg`)** : toujours vide, les localisations étant interdites.
15. **`spec_5` §16-17** : à corriger selon le §0 (n° 1, 4, 9, 19, 20, 21, 22) et le §2.

---

## À reproduire dans DeltaSub (par priorité)

1. **Protéger les saisies au ré-import** : `PROTECTED_IF_EDITED` et `kept2` dans `serveur_deltasub.py` (l.42-45, l.189-230), pour `costplanningdocument`, `costplanning`, `costestimate*` et `costcontrol*`.
2. **Convertisseur v2** (`convert_costplanning`, l.944-1042 ; `_ligne`, l.245) :
   - `prixEnPourcentQuantite`, sous-éléments et composants au niveau élément, CFC, `codeCalcul`, `estCalculee` et `elementsReference` ;
   - calculs au niveau de la grandeur, remarques, notes, `definitif` ;
   - `grandeursPossibles`, `systeme`, `ouvragesDetail`, toutes les lignes d'ouvrage ;
   - `affichage`, `impression`, `volumes`, `donneesAffaire`, `annexes`, `refNum` ;
   - vérification par le moteur (0 écart), puis ré-import.
3. **Corriger les statuts** : `CP_ST` (Validé, Affaire de référence) et `CC_STATE` (0 Provisoire à 3 Terminé).
4. **Moteur exact** `cpEngine`, portage de `cp_calc.py` (§4.4) :
   - arrondi 0,05 signé, `getValue` avec coût fixé, positions générées et niveau de saisie ;
   - `setRefCodes` (quantité = grandeur), prépasse CHF, 3 passes, % de quantité, cas V_PROC ;
   - quantités calculées PSBY…SD110, taux de TVA du dernier Z ;
   - totaux par plage et par ouvrage, groupes CFC TTC, itérations ;
   - lecture des documents v1 en mémoire.
5. **Listes et place** :
   - « Mes estimations eCCC » en tête de Bâtiment (filtre `USERID`, colonne n° d'affaire), et domaine « Calcul des coûts » ;
   - colonnes d'origine ;
   - Dupliquer (« Copie »), Editer / Ouvrir, corbeille en 2 temps avec restauration, Maj + double-clic, exports.
6. **Fiche et création** :
   - fiche « Nouvelle estimation des coûts » / « Edition » : Nom obligatoire, N° 1, Utilisateur, Date, 4 statuts, Note, subdivisions et A/B figés après création ;
   - contenu tiré du catalogue eCCC de l'affaire (≤ 1 point, grandeur A ou B), avec les grandeurs, les 7 unités fonctionnelles et les défauts ;
   - suppression de la copie « du plus gros document ».
7. **Fenêtre** : titre « Détermination des coûts - V (N) », menus Fichier et Editer, barre latérale à 5 sections, Total A–Z, navigateur des groupes, `bseq` lu à l'ouverture, en-tête unique dans `costplanningdocument`.
8. **ELEMENTS complet** :
   - 27 colonnes, styles, 10 cases et 2 filtres par document, filtres par ouvrage et par groupe principal, zoom, panneau de détail ;
   - quantité et prix affichés sur les groupes ; [%] à 2 modes et au format d'origine.
9. **Dialogues d'élément** :
   - « Référence de coût » : quantité réf. en lecture seule, Insérer le coût, Fixer le coût, D, V, « utiliser », origine du prix, exécution, description, écologie, contrôle des 10 chiffres ;
   - Nouveau / Editer (K/U/X, insertion triée) ;
   - suppressions (élément standard mis à zéro, effacer les prix) ;
   - Niveau de saisie.
10. **Ouvrages** : colonnes OUV et Localisation, une ligne par ouvrage, édition par ouvrage, « Subdivision… » (transfert vers la 1re subdivision), rattachement par `ouvrageId`.
11. **Sous-éléments et composants** : numéros 100-999, modes Sans calcul / Composants, quantité fixe, %, position éventuelle, « montant seul », CFC du composant, durée de vie et entretien ; aucun catalogue gate.
12. **Attribution CFC** : dialogue « Coût selon CFC » (reste proposé par « < »), règle d'un seul niveau par branche, colonnes CFC / Montant CFC / +/-, deuxième structure, groupes TTC (TVA sauf A et Z), avertissement « L'attribution CFC n'est pas terminée. » à 50 CHF.
13. **Configuration et Affichage** :
    - Configuration : Arrondir, Pourcentage (total ou groupe principal), plages de / à ;
    - Affichage : Titre, Date, Indice, Marge, états, Textes libres 1 à 5, pour l'impression seulement.
14. **QUANTITES REFERENTIELLES** : 16 colonnes, 3 présentations, 3 filtres exclusifs, code « null » masqué, lignes d'ouvrage, dialogue « Quantité référentielle » avec ses verrous, Coûts/QR arrondis.
15. **Lignes de calcul** : évaluateur sûr sans `eval` (remplace `evalQ`), `[commentaires]`, lignes `r` et `r5`, sous-totaux, retrait des lignes à 0 et messages exacts.
16. **Grandeurs personnalisées** (quantité ou montants d'éléments), contrôle circulaire, « Supprimer toutes les quantités référentielles », import CSV de quantités.
17. **CHIFFRES CLEFS** :
    - unités fonctionnelles : menu de jetons, substitution par jeton, 4 genres, 0,01 à l'écran ;
    - Volumes, avec les formules correctes ;
    - Énergie grise, en somme simple ;
    - graphiques.
18. **APERCU** : 14 colonnes, lignes d'ouvrage, synthèse A–Z / B–W / C–G, SP = FA, CFC 0-9 / 1-9, graphique à 4 vues.
19. **Valeurs référentielles**, sans aucune donnée CRB :
    - d'une autre affaire : statut 2 ou 3, options, origine « N° titre » ;
    - des calculs précédents : Texte | Valeur | Unité | M ;
    - base du bureau : 3 écrans et un sélecteur, Montant = Quantité × Prix.
20. **Importer les présentations** et **Importer un calcul d'une affaire**, avec les contrôles de type et de version de catalogue.
21. **Créer un devis selon le CFC** vers `costestimatedocument` / `costestimate` : TVA de Z, terrain sans TVA, CFC 57 et Z ignorés, textes coupés à 30, parents générés, NOTE « Export du devis selon eCCC », messages exacts.
22. **Impression `.dpdoc` costPlanningDocument (jeu 1)** : `mgPrint` multi-sections en portrait et paysage, 17 champs, 7 tables, préférences par document. Ensuite, l'ancien document via `tplPrint` (modèles Substances), visible au bureau.
23. **Calcul des résultats** : import d'un contrôle des coûts Terminé, attribution en % (HT / TVA), écran Résultats et graphique, stockage dans `resultats`, suppression limitée aux attributions.
24. **Données de l'affaire**, pour l'affaire et pour chaque subdivision : désignation, lieu, genre, intervenants, délais, affectation, descriptions, documents, images.
25. **Fichiers** : API `/api/file`, documents et images par position, « Exporter les documents et les images » (zip), reprise de `Export.csv`.
26. **Options** : verrou de document (table `lock` déjà présente dans le serveur), export SIA 451.
27. **À ne pas reproduire** :
    - gate et niveaux 4-5, `hint`, données CRB, Système référentiel, Types d'élément, CAN ;
    - contrôles de licence, bouton « lune », code mort ;
    - les anomalies listées au §12 n° 13.
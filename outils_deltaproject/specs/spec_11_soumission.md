# Cahier des charges — module SOUMISSION de DeltaSub (reproduction de DELTAsoumission / devis18)

Version finale du rédacteur critique, 29.09.2026. Elle remplace `spec_4_devis_soumissions.md` §7 et s'appuie sur la confrontation des sept rapports (document, soumissionnaires, comparatif bref, comparatif détaillé, descriptif, manuel, données/DeltaSub). Chaque point contesté a été vérifié à la source (§0).

**Conventions**
- **[P] PROUVÉ** : la référence est vérifiable.
  - Bytecode `Classe.méthode@offset`. Les préfixes sont abrégés : `d18.` = `deltaproject.devis18.`, `db.` = entités de `db.jar`.
  - Libellé `Strings.db (classe|id)`.
  - Données : CSV `APP.<TABLE>`, `schema.txt`, `modeles.json`.
  - Manuel : `MAN-FR p.` ou `MAN-DE S.`
- **[D] DÉDUIT** : interprétation non démontrée ligne à ligne.
- **[C] CHOIX** : décision de conception pour DeltaSub, en général pour corriger un défaut de Deltaproject. Elle doit être signalée à Paulo.

**Règles de licence.** Aucun texte d'article CAN/NPK/CPN n'est reproduit dans ce document, et aucun ne doit l'être dans DeltaSub. Aucun nom d'entreprise ni de personne n'est repris. Les textes d'impression cités sont ceux des modèles `.dpdoc` du bureau ou de DELTA, jamais du CRB.

**Fichiers de vérification** : `…/scratchpad/research/sm_critique/` (`TD.txt`, `MD.txt`, `PCR.txt`, `DDT.txt`, `NPT.txt`, `ESST.txt`, `DST.txt`, `DF.txt`, `STD.txt`, `cctest.js`, `npk_ref.py`, `arrete.py`) et `…/sm_comparatif_bref/sim.py`.

---

## 0. Arbitrages entre les rapports (vérifiés à la source)

| # | Sujet | Affirmations en présence | Verdict | Preuve |
|---|---|---|---|---|
| 1 | Purge du métré lors d'un transfert | « si la **source** est l'appel d'offres » (document) contre « **vers** B » (descriptif) | **Source = B**. Tout transfert *depuis* l'appel d'offres vide, dans la cible, le métré des quantités partielles dont le GQ ≠ « A ». | [P] `TransferDocument.transferDocument@0-26` : le 4ᵉ paramètre est la cible, le 3ᵉ la source. `setOneCostUnit@33-48` : `if (sourceDocType == B) cleanMeasureList(cible)`. `cleanMeasureList@84-102` |
| 2 | « Créer le métré » remet-il les quantités à zéro ? | oui (descriptif §1, manuel §2.30, spec_4 §7.16) contre non (document, comparatif) | **Non.** Le transfert D → I copie quantités et prix. C'est l'utilisateur qui supprime ensuite les quantités (« − ▸ Supprimer les quantités »). | [P] `transferDocument@4709-4853`. Aucun `setQuantity` dans toute la classe (grep). MAN-FR p.75 « vous supprimez les quantités » |
| 3 | Longueurs du métré 30 / 60 / 90 | contrôlées (manuel) contre seule 90 (descriptif) | **Seule la limite « commentaire + formule ≤ 90 » est contrôlée.** `msg5` (60) et `msg6` (30) ne sont jamais référencés. La clé `msg0` (numéro manquant) est appelée mais absente de Strings.db ; le texte prévu est `msg8`. | [P] `MeasureDialog` : `bipush 90` @386 → `msg9a/b`. Pool : pas de `msg5`/`msg6` |
| 4 | Évaluation d'un critère principal qui a des sous-critères | « Évaluation = Σ(note × coef) » (bref) contre « colonne vide » (détaillé) | **Colonne Évaluation vide.** Points = Σ(note_s × coef_s) × coef × 0,01. Ligne Total : Σ coefficients, vide, Σ points. | [P] `PriceCompareRaitingDialog.setCriteriaTable@237-418` (row[2] ← "" @413-418) |
| 5 | Arrondi de l'écart % | entier (comparatif) contre 1 décimale (manuel) | **Les deux, selon le tableau.** Descriptif avec comparatif (`DevisDescTable`) : 1 décimale. Tableau « Article CAN » (`DevisNpkPositionTable`) : entier. Récapitulatifs (`…ShortSummaryTable`, etc.) : 2 décimales ; 0 s'imprime « < 0.01 ». | [P] `DevisDescTable.formatProcent1`, `DevisNpkPositionTable.formatProcent0`, `DevisStrings.formatProcent@0-62` |
| 6 | Entrée « Entrepreneur » du pinceau du descriptif | seulement en C1 (descriptif) contre partout sauf C1 (soumissionnaires) | **Partout sauf C1.** Elle ouvre `tools.ContactSpecDialog` (Entité + Responsable) et écrit `contactId` et `responsableId` de l'**unité de l'étape**. | [P] `DescFrame.getPreferendesPopupMenu@586-592` (`if_icmpeq` C1 → saut), `DescFrame.getEntrepreneurAddressMenu@18-490` |
| 7 | Colonnes de SOUMISSIONNAIRES ▸ Editer | 2 (manuel), 5 (soumissionnaires), avec « Envoyé le », « Document PDF »… (manuel) | **5 colonnes** : Entités, Responsable, Situation de l'offre, Pris en compte dans la comparaison des prix, Désignation (`remarkCol` = texte « Désignation », donnée `tenderNote`). « Envoyé le », « Note d'expédition », « Document PDF » et « Courrier d'accompagnement » existent dans Strings.db mais ne sont pas utilisés. | [P] pool de constantes de `d18.TenderingFrame` |
| 8 | Champs d'« Informations » (appel d'offres) | avec « Nombre d'exemplaires », « Plans annexés », « Lieu de dépôt » (manuel) | **Ces trois libellés sont inutilisés.** | [P] pool de `d18.tools.DevisTenderDataDialog` |
| 9 | Réutiliser `ccCond` / `ccBrutFromNet` / `ccArrete` de DeltaSub pour les conditions de soumission | recommandé par 3 rapports | **Rejeté.** La sémantique de REF est différente : `ccCond` pose `R[n] = R[réf] + m`, alors que devis18 cumule tous les niveaux ≤ réf. Sur l'exemple MAN-FR p.73, `ccCond` donne **1'278.00** au lieu de **1'116.00**. De plus, `ccArrete` (l. 3192) est l'arrêté de compte avec garantie, pas « Net - arrêté à ». Deux moteurs propres sont à écrire (§5.4, §7.13). | [P] test `sm_critique/cctest.js` (jsc) ; `NpkConditions.refBetrag3@0-247`, `CalcCondition` (rapport comparatif bref) |
| 10 | Statuts du contrôle des coûts dans DeltaSub | `CC_STATE` décalé (rapport données) | **Confirmé.** Codes réels : 0 Provisoire · 1 En cours · 2 Etat intermédiaire · 3 Terminé. DeltaSub affiche 1 = « Provisoire », et `ccDuplicate` pose 3, soit « Terminé ». Bureau : 72 × 0, 40 × 1, 3 × 3. | [P] `db.CostControlDocument$State.<clinit>@4-50`, Strings `db|CostControlDocument`, CSV. DeltaSub l. 2720 et 2880 |
| 11 | `DevisEntrepreneurs.setEntrepreneurs` ignore les chapitres dont le n° contient « 0 » | « défaut probable » (document) | **Comportement voulu [D]** : un chapitre dont le numéro contient un 0 ne porte aucun article de quantité. | [P] règle `RChapterDialog|msg1a/b`, MAN-FR p.62 règle 1 |
| 12 | Jeu de modèles `.dpdoc` à défaut de jeu d'affaire | non traité | Si `PROJECT.DOCTEMPLATEGROUPNAME` est vide : **Group.project = jeu 1** (« DELTA Originaux »). Un seul modèle : pris directement. Plusieurs : dialogue de choix. | [P] `doc.app.SelectTemplateDialog.browseTemplate@9-19, @79-126` ; CSV `DOCTEMPLATEGROUP` |
| 13 | Licence CRB du bureau | « jamais sous licence » (données) | **Module DELTAdevis (102) absent** de `APPLICENCE`. La licence de données « Licence CAN et CFC » ne couvre que les produits BKP, eBKP-H, eBKP-T, eBKP gate et « 1003 GL » [D : non identifié]. **Aucun chapitre CAN.** | [P] CSV `APPLICENCE`, `DATALICENCE.LICENCEINFO` |
| 14 | « Nombre de collaborateurs » dans les indications de l'offre | présent (bref) contre absent (détaillé) | **Les deux sont exacts.** Dialogue du bref : 9 champs, avec `teamMembers`. Dialogue du comparatif détaillé : 8 champs, sans lui. | [P] `PriceCompareEntrepreneurInfoDialog` contre `PriceCompareEntrepreneursInfoDialog` (appels `EntrepreneurOfferData.set*`) |
| 15 | Tri automatique | net croissant (tous) | **Confirmé**, avec deux compléments. Tri par insertion : à égalité, le nouveau passe devant. Les nets = 0 sont mis à la fin. `sortShortEntrepreneurList` ne teste pas `autoSort` : c'est l'appelant qui choisit. Défaut : `insertShortEntrepreneur@141` teste la liste négociée de l'élément inséré au lieu de celle de l'élément comparé. | [P] `award.Calc.insertShortEntrepreneur@0-212`, `sortShortEntrepreneurList@0-249` |
| 16 | « Stade actuel » | liste des étapes (spec_4 §7.1) | **13 valeurs métier, purement déclaratives** (consensus des rapports). | [P] `db.DevisDocument$DocumentState` |
| 17 | Types de procédure | 4 (manuel) contre 7 | **7 valeurs, codes 0-6.** Le libellé 7 contient une coquille (« hors aux traités »). | [P] `deltaproject.devis.data.BiddingKind$State.<clinit>` |
| 18 | Entreprise en vert | « moins-disant » (spec_4 §7.14) | **Faux.** Le vert du descriptif et des listes désigne l'**entreprise proposée (+)**. Le vert du plus bas prix ne vaut que dans « Prix des entreprises » (min vert, max rouge, proposée bleue) et dans l'impression « Article CAN » (propriété k8). | [P] `NpkFormCellRenderer@813-849`, `PriceDialogCellRenderer@410-489` |
| 19 | Place de « Mes soumissions » | non traité | Ordre de BÂTIMENT : Mes estimations eCCC · Mes devis · **Mes soumissions** · Contrôle des coûts. | [P] `deltaproject.Modules$Module.<clinit>@402-465` |
| 20 | Rôle d'intervenant « Entreprises » | 19 | **Confirmé : TEAMROLECODE 19** (`contractors`). Bureau : 330 intervenants de rôle 19. NB : dans DeltaSub, `TPL_ROLE.projectContractor = 31` correspond à « Entreprise totale » et ne doit pas servir aux documents de soumission. | [P] `db.ProjectMemberRole$TeamRole.<clinit>@369-377`, CSV `PROJECTMEMBER` |

Les autres affirmations concordent entre rapports et sont reprises telles quelles, avec la référence du rapport source.

---

## 1. Périmètre, licence CRB, visibilité au bureau, navigation

### 1.1 Constat au bureau [P]

| Élément | État |
|---|---|
| Table `DEVISDOCUMENT` | 0 ligne (absente des CSV exportés) |
| Dossier `Construction/Devis` | vide |
| « Devis type.deltakv » | vide |
| `PROJECTTENDERER` | 1 ligne (CFC 292, `ISACCEPTED` = 0), saisie à la main |
| `DOCUMENTLOCK` | 1 ligne, d'un autre module |
| Licence du module DELTAdevis (102) | absente, donc « Mes soumissions » n'a jamais été utilisable |
| Chapitres CAN sous licence | aucun |

Modèles utiles déjà présents :
- `INVOICECONDITION` (10 lignes) et `INVOICECONDITIONGROUP` (2 : « Conditions », « Conditions électro ») : modèles de conditions. La TVA y est encore à 7.7.
- `BIDCRITERIONGROUP` (2 : « Offre », « Enterprise ») et `BIDCRITERION` (4 : Prix, Qualité, Experience, Collaborateurs) : critères d'évaluation modèles, tous avec `QUANTIFIER` = 0.
- Taux de TVA par défaut : `SETTING genVatRatePos` = 8.1.
- `SUBPROJECT` : 30 ouvrages ; `PROJECTROOM` : 1 local ; `PROJECTUSEZONE` : 5 affectations.

**Conséquence** : aucune donnée à reprendre. DeltaSub part de zéro. Les noms de champs du contenu JSON sont libres ; ils suivent la convention française de `costestimate` et `costcontrol`, avec une table de correspondance Java (§2.11) pour la traçabilité.

### 1.2 Licence CRB : ce qui est reproductible [P / D]

**Deltaproject exempte lui-même les chapitres de réserve de tout contrôle de licence** :
- un chapitre dont le numéro contient « 9 » a un accès complet (`LicenceCheck.licenceIsOk@142-150`, `chapterHasFullAccess@1-16`) ;
- il est dispensé de l'article 000.200 (`CheckDesc.abbIsOk@201-206`).

| Reproductible dans DeltaSub (structure, règles, données du bureau) | NON reproductible (contenu sous licence CRB ou service CRB) |
|---|---|
| En-tête de soumission, liste, stades, verrous, transitions entre étapes | Catalogues CAN / NPK / CPN : arbre des chapitres, titres, textes d'articles, textes de variables |
| Soumissionnaires, lettres, liste, informations d'appel d'offres | Textes indicatifs « h », éco-devis (E/e, évaluation), produits PRD |
| Comparatif bref complet (CFC × ouvrage × entreprise, conditions, négociation) | Prix du manuel de construction CRB (« trois catégories de prix ») |
| Conditions (moteurs de calcul, genres, contrôles) | Variables alternatives (lettres) et articles de répétition « dito » (plages lues dans le CAN) |
| Évaluation, adjudication, commande, refus, début de préparation | « Convertir le descriptif (année) », « Traduire » (NPK ↔ CAN ↔ CPN), « Info chapitre », navigateur CGC/normes (`AbbBrowser`) |
| **Descriptif libre** : chapitres et articles **de réserve** (texte du bureau), quantités, GQ/GP, métré, subdivisions, variantes, TVA, totaux, tri, filtre, sauts de page | Article 000.200 et ses variables (règles de rémunération ABB), exigence du paragraphe 090 |
| Comparatif détaillé, contrat, métré, descriptif type, estimatif **sur un descriptif de réserve** | Propositions de numéros d'articles dans un **chapitre CAN** (lecture du fichier CAN) |
| Impressions `.dpdoc` et anciens modèles du bureau | Contrôles de licence (`userHasAccessToData`, `LicenceCheck`, `luiIsOk`), mise à jour du CAN, « Copyright » |
| Structure de fichier SIA451 (positions de colonnes) | Validation SIATEST (service en ligne CRB) et code client CRB (propre au bureau) |

**Approche DeltaSub** [C] :
1. **Descriptif libre** : uniquement des chapitres de réserve (n° contenant 9, hors 000-099 et 800-899), leurs articles et variables, avec un texte propre au bureau.
2. Aucune colonne ni zone « Catalogue CAN ». La zone catalogue de Deltaproject est remplacée par « Perso » : réutiliser ses propres descriptifs comme catalogue.
3. **Import SIA451 d'un tiers** (option, lot 4) : on n'importe que les chapitres de réserve, ou, pour un chapitre CAN, uniquement les **numéros, unités, quantités, prix et conditions**, sans enregistrer aucun enregistrement G3 (texte) ni G2 (mot-clé). La ligne est alors affichée « Article CAN <n°> (texte sous licence non repris) ».
4. Les champs `ISIFA2018` et `NORMPOSITIONCATALOGCODE` sont conservés pour la compatibilité (valeurs figées 1 / 1 = CAN). Le dialogue « Sélection des standards CRB » est réduit à une information.

### 1.3 Navigation et domaines [P + C]

| Accès | Deltaproject [P] | DeltaSub [C] |
|---|---|---|
| BÂTIMENT ▸ « Mes soumissions » | `deltaproject.devis.DevisFrame` : documents dont `USERID` = utilisateur connecté, colonne « Numéro d'affaire » visible ; « + » passe par « Choix de l'affaire » | `NAV` l. 345 : insérer `['soum','Mes soumissions']` entre `devis` et `coco`, avec la vue `VIEWS['soum']` |
| Domaine d'affaire « Soumission » | `deltaproject.project.DevisFrame` : tous les documents de l'affaire, **tous utilisateurs**, colonne affaire masquée | Branche `d==='Soumission'` dans `domainView`, avant le texte de repli l. 1566, et ajout de « Soumission » à `domainUsed` l. 1495 |
| Documents supprimés | Visibles si Alt/Ctrl est tenu à l'ouverture | Case « Afficher les documents supprimés » dans la roue ▾ [C] |

### 1.4 Droits [P + C]

**Modification du contenu** : permise si l'une des trois conditions est vraie ; sinon message d'information « Vous n'avez pas les droits pour modifier ce document. » :
- `DEVISDOCUMENT.USERID` est vide ;
- il est égal à l'utilisateur courant ;
- le réglage `areBauadDocsLocked` est à NON (c'est le cas au bureau).

Référence : `d18.data.Rights.checkRigth@1-57`.

L'ancien `deltaproject.devis.data.Rights`, utilisé par le comparatif bref, affiche « Vous n'avez pas le droit de modifier ce document. ». DeltaSub utilisera un seul message, le premier [C].

**Déverrouillage** : droit `generalUnlockDocuments`, libellé « Paramètres : Déverrouiller les documents des autres utilisateurs » (§3.5).

---

## 2. Modèle de données

### 2.1 En-tête : collection `devisdocument` (colonnes Derby de `DEVISDOCUMENT`) [P schema.txt, `db.DevisDocument`]

| Champ | Type | Défaut à la création | Règle |
|---|---|---|---|
| `ID` | int | `DS.newIds('devisdocument')` | clé, partagée avec `soumission` |
| `PROJECT_ID` | int | affaire | obligatoire |
| `BKP` | texte ≤ 64 | '' | « Lot d'adjudication » : code CFC |
| `AWARDINGTEXT` | texte ≤ 128 | '' | désignation du lot |
| `ORDERNUMBER` | texte ≤ 64 | '' | « Numéro de l'ordre » |
| `VERSION` | texte ≤ 64 | '' | « Version » |
| `VERSIONNUMBER` | int | **1** (le dialogue affiche 1 en création) | valeur invalide : l'ancienne est conservée |
| `STATECODE` | 0-3 | 0 | Statut |
| `DOCUMENTSTATECODE` | code 0-12 | 0 (Appel d'offres) | Stade actuel |
| `CHANGEDDATE` | date ISO | aujourd'hui | sélecteur de date uniquement |
| `USERID` | texte ≤ 32 | utilisateur courant | menu des utilisateurs |
| `NOTE` | texte ≤ 1024 | '' | |
| `ISIFA2018` | 0/1 | **1** | figé |
| `NORMPOSITIONCATALOGCODE` | 0-2 | **1** (CAN) | figé, informatif |
| `ISMARKEDASDELETED` | 0/1 | 0 | corbeille |
| `LOCKUSERID`, `LOCKTIME` | texte, ISO | null | **ajout DeltaSub [C]** qui remplace `DOCUMENTLOCK_ID` (table non reprise, `SKIP_TABLES`) |

### 2.2 Énumérations

**Statut** (`STATECODE`) [P `db.DevisDocument$State`] : 0 Brouillon · 1 Provisoire · 2 Validé · 3 Annulé. Identique à `DV_STATE`.

**Stade actuel** (`DOCUMENTSTATECODE`) [P `$DocumentState`]. La colonne « code » est la valeur stockée ; l'ordre des lignes est celui de la liste déroulante et du filtre.

| Ordre | Code | Libellé |
|---|---|---|
| 1 | 0 | Appel d'offres |
| 2 | 11 | Soumission |
| 3 | 1 | Offre |
| 4 | 2 | Proposition d'adjudication |
| 5 | 3 | Négociation |
| 6 | 4 | Adjugé |
| 7 | 5 | Commande |
| 8 | 6 | Contrat |
| 9 | 7 | Devis |
| 10 | 8 | Comparatif |
| 11 | 9 | Situation |
| 12 | 10 | Facture |
| 13 | 12 | Calcul des coûts |

**Catalogue** : 0 NPK (D) · 1 CAN (F) · 2 CPN (I).

**Étapes** (`doctype`) [P `deltabauad.settings.DocType`] :

| Clé DeltaSub | Code Java | Étape | Unité Java | Titre par défaut [P `InitDocument|docType*`] |
|---|---|---|---|---|
| `A` | 0 | Descriptif type | masterUnit | « Document type d'appel d'offres » |
| `B` | 1 | Appel d'offres | tender | « Appel d'offres » |
| `C` | 2 | Offre | offerUnit | « Offre » |
| `D` | 3 | Contrat | contractUnit | « Contrat » |
| `I` | 5 | Métré | measureUnit | « Métré » |
| `K` | 6 | Estimatif | costEstimatingUnit | « Estimatif » |
| `C1` | 102 | Comparatif | priceCompareUnit | « Comparaison des offres » |

**Dernier nœud** (`lastPrefType`) : A, B, C, C1, D, I (=F 5), K (Elem 105), `SUB` (SubList 107), `BREF` (ShortOffer 108). Défaut B.

**Type de procédure** (`procedure`, `biddingKind`) [P] :

| Code | Libellé |
|---|---|
| 0 | Procédure ouverte |
| 1 | Procédure sélective |
| 2 | Procédure sur invitation |
| 3 | Procédure de gré à gré |
| 4 | Procédure de gré à gré sous concours |
| 5 | Procédure de gré à gré aux traités internationaux |
| 6 | Procédure de gré à gré hors traités internationaux |

Le libellé 6 est corrigé [C].

**Genres de condition** (commun à tous les moteurs de la soumission) [P `d18.data.ConditionKind$Kind`, `PriceCompareConditionDialog` cond0..8]. La colonne « Genre » affiche l'abréviation. Forfait = `isAbsoluteCondition`.

| Code | Libellé de menu (bref) | Abrév. | Nature | Libellé d'impression / grand dialogue |
|---|---|---|---|---|
| 0 | Déduction | P | forfait | Déduction |
| 1 | Rabais | % | % | Rabais |
| 2 | TVA | M | % | TVA |
| 3 | Escompte (%) | S% | % | Escompte |
| 4 | Escompte (-) | S- | forfait | Escompte (P) |
| 5 | Retenue (%) | R% | % | Retenue de garantie (%) |
| 6 | Retenue(-) | R- | forfait | Retenue de garantie (P) |
| 7 | Autres (%) | U% | % | Autres (%) (corrige la coquille `ConditionKind|othersProc`) [C] |
| 8 | Autres (-) | U- | forfait | Autres (-) |
| 10 | Arrondi (« Net - arrêté à ») | P- | forfait | Net - arrêté à |

Un genre inconnu s'affiche « ?? ».

**GQ, genre de quantité** (`Div.measKind`, défaut « A ») [P `QuantityInputDialog|q*`, `Div.calc`] :

| Code | Libellé | Compté |
|---|---|---|
| A | Avant-métré établi par le concepteur | oui |
| B | Quantité fixe établie par le concepteur | oui |
| D | Avant-métré sur ordre du concepteur (fenêtre de l'article : « sur estimation du concepteur ») | oui |
| W | PAR | non (quantité affichée « par ») |
| J / K / M | = A / B / D, **variante primaire**, comptabilisé | oui |
| Q / R / U | = A / B / D, **variante éventuelle**, non comptabilisé | non (montant entre parenthèses) |
| S | libellé présent, jamais proposé | 0 |

**GP, genre de prix** (`Div.priceKind`, défaut « A ») [P `PriceInputDialog|pA..pR`] :

| Code | Libellé | Montant |
|---|---|---|
| A | Prix de l'offre de l'entreprise | q × p |
| F | Prix indicatif établi par le concepteur | q × p |
| I | Compris dans l'offre | 0 |
| N | Non compris dans l'offre | 0 |
| R | Régie | q × p |

Les codes G, K, P (Global, Gratuit, Forfaitaire) sont propres à l'ancien IfA 92 : **à ne pas reprendre** [P `PriceInputDialog|priceKind_*`, non proposés en devis18].

GP proposés selon l'étape [P `PositionDialog.jDivTableMouseClicked@1075-1547`] :

| Étape | GP proposés |
|---|---|
| A, B | A, F, R |
| C, C1, K | A, I, N |
| D | A, I, N, R |
| I | A, F, I, N, R |

Au comparatif, le dialogue « Prix » ne propose que A, I, N (`PriceInputDialog.initDialog@492-563`). « Prix des entreprises » en C / C1 propose A, I, N, F.

**Genre de ligne de métré** (`Ausmass.id`) [P `AusmassKind`] : "0" standard · "1" rue (« S ») · "2" réserve (« + ») · "3" arrondi (« R ») · "4" arrondi 5 (« R5 »).

**Unités** [P `MeasUnit|meas1..23`] : m, m2, m3, f, up, p, gl, ms, h, %, %o, se, j, hl, kJ, kg, l, t, su, br, pa, ro, sa.

### 2.3 Contenu : collection `soumission` (clé = `devisdocument.ID`, chargée à la demande comme `costestimate`) [C]

```js
{ schema:1, DOCUMENT_ID, PROJECT_ID,
  etape:'B',                 // doctype courant
  dernierNoeud:'B',          // lastPrefType : 'A'|'B'|'C'|'C1'|'D'|'I'|'K'|'SUB'|'BREF'
  arrondi5ct:true,           // doRound (descriptif, comparatif détaillé)          [P défaut true]
  triAuto:true,              // autoSortEntrepreneur (bref + détaillé)             [P]
  referenceAuto:true,        // autoReferenceEntrepreneur (réf. = proposée)        [P]
  appelOffres:{              // DevisDocument : données d'appel d'offres
    procedure:null,          // biddingKind 0..6 (Deltaproject : 0 par défaut)     [C null = non renseigné]
    dateDepot:null, heureDepot:'', dateOuverture:null,   // inputDate / inputTime / biddingStartDate [C null au lieu de « date de création »]
    debutPreparation:'', debutTravaux:'', finTravaux:'',  // workPrepBegin / workBegin / workEnd : TEXTE LIBRE [P]
    mandataire:{contactId:null, personId:null},          // expertPlannerCompany/PersonContactId
    lieuDepot:{contactId:null, personId:null},           // tenderInputContactId / PersonContactId
    montantDG:''             // priceCompareUnit.kvSum (chaîne saisie ou reprise d'un DG validé)
  },
  informationsComparatif:{   // priceCompareUnit (dialogue « Informations »)
    totalDG:'', dgRevise:'', montantAdjudication:'', mutation:'', cfcMutation:'', adjudication:'',
    ouvert:'', reserve:'', garantie:'', niveauPrix:'', dateDocument:null, dateOffreNegociee:null,
    textesLibres:['','','','']                           // (totalDG ≡ appelOffres.montantDG : un seul champ en Java) [P]
  },
  commentaireBref:'',        // shortPriceCompareComment (« Commentaire d'adjudication » du bref)
  commentaireComparatif:'',  // priceCompareComment
  entreprises:[ENTREPRISE],
  bref:BREF,
  criteres:[CRITERE],
  unites:{A:null,B:UNITE,C:null,C1:null,D:null,I:null,K:null},   // lot 3 ; B créée vide à la création
  metreModeles:[{nom, unite, quantite, lignes:[LIGNE_METRE]}],   // ausmassTemplateList
  documents:{},              // notes d'expédition et état des documents du document (§2.10)
  presentation:{}            // DescDisplay / PriceCompareDisplay / couleurs : lot 4
}
```

### 2.4 `ENTREPRISE` (`d18.data.Entrepreneur`, serialVersionUID 40)

Défauts [P `Entrepreneur.<init>@15-333`] :

```js
{ contactId, responsableId:null,       // Java : -1 = vide
  abreviation:'',                      // contactDesc = SHORTLABEL sinon nom de l'entité ; clé de tri de l'écran [P]
  proposee:false,                      // isProposed : exclusive, affiche « (+) » [P]
  reference:false,                     // isReference (si referenceAuto = false)
  prisEnCompte:true,                   // useInPriceCompare « Pris en compte dans la comparaison des prix »
  afficher:true,                       // display = case M du dialogue « Tri »
  ordreManuel:0,                       // privateOrder
  rang:0,                              // order : calculé par le tri (§5.9), stocké pour les impressions
  situationOffre:'',                   // offerState
  remarque:'',                         // tenderNote (colonne « Désignation »)
  indications:{ totalOffreBrut:'', nbCollaborateurs:'', genreOffre:'', dateOffre:null, dateOffreNegociee:null,
                genreRemuneration:'', numeroOffre:'', commentaire:'', commentaireInterne:'' },  // EntrepreneurOfferData
  bref:{ offre:{conditions:[COND], brut:0, tva:0, net:0}, negociee:{conditions:[COND], brut:0, tva:0, net:0},
         noteInterne:'' },             // …Short, comment (Note interne commune aux deux tableaux [P])
  detail:{ offre:{conditions:[COND], brut:0, tva:0, net:0}, negociee:{conditions:[COND], brut:0, tva:0, net:0} },
  notes:{ lettre:{exp:'',rem:''}, negociation:{exp:'',rem:''}, adjudication:{exp:'',rem:''}, refus:{exp:'',rem:''},
          commande:{exp:'',rem:''}, debutPreparation:{exp:'',rem:''}, descriptif:{exp:'',rem:''} }  // *MailingNote / *Note
}
```

Règles :
- Pas de doublon de `contactId`.
- `contactId` doit être > 0.
- Tout ajout exige une abréviation (§4.2).

### 2.5 `BREF` (comparatif bref)

```js
{ saisie:'brut',            // 'brut'|'net' : un seul mode pour tout le comparatif (PriceCompareBkp.calcForward du dernier CFC) [P]
  arrondi5ct:true,          // roundShortPriceCompare [P défaut true]
  avecOuvrages:false,       // useSubprojectsInShortPriceCompare ; forcé false si l'affaire n'a pas d'ouvrages [P]
  structure:[{ cfc, texte,  // PriceCompareBkp{bkpNum, bkpText} ; triée par comparaison de chaînes [P]
     ouvrages:[{ouv, lg, SUBPROJECT_ID}],       // PriceCompareSubprojet{to, lg, dbId} ; vide si sans ouvrages
     lignes:{ [contactId]:{ '': LIGNE_BREF } | { [ouv]: LIGNE_BREF } } }] }
LIGNE_BREF = { offre:{brut, tva, net, montants:{[niv]:m}}, negociee:{brut, tva, net, montants:{}} }
```

Si « Avec ouvrages » est coché, `montants` et les lignes sont indexés par ouvrage (clé `ouv` ou `ouv  |  lg`).

### 2.6 `CRITERE` (`OfferCritera`)

```js
{ nom, coefficient, notes:[{contactId, note, remarque}], sousCriteres:[CRITERE] }
```

### 2.7 `UNITE` (`DevisCostUnit`, une par étape, lot 3)

```js
{ titre:'', date:null,                          // documentTitle / docDate (« Titre et date du document »)
  entreprise:{contactId:null, personId:null},   // contactId / responsableId de l'étape (pinceau « Entrepreneur », sauf C1)
  textesLibres:['','','','',''],                // comment1..5
  contrat:{numero:'', avenant:'', genre:''},    // contractNumber / addendumNumber / contractKind (D, I)
  titresCAN:true,                               // useNpkTitleInLv (commun en Java : conservé par document) [P]
  tri:'chapitre',                               // sort*Mode (§7.12)
  ordreColonnes:[…],                            // DivisionOrder
  subdivisions:{ combinaisons:[CODES], insertionAuto:false,           // <étape>SubDivList, useForCatToDevis
                 listes:{cfc:[], ouv:[], cfe:[], te:[], locaux:[], affectations:[]} },  // DescSortOrder
  variantes:[{code, texte1, texte2, variantes:[{code, texte1, texte2, primaire}]}],     // <étape>VarList
  filtre:null, sautsPage:[{c,m,u}],
  conditions:[COND],                            // <étape>ConditionList (null en C1 : conditions portées par les entreprises) [P]
  brut:0,                                       // <étape>BruttoValue (absent en C1)
  chapitres:[CHAPITRE],
  notesDoc:{exp:'',rem:''}, notesDebutPrep:{exp:'',rem:''}   // mailingNote/documentNote, workPrep* (D)
}
CHAPITRE = { numero:'911', texte1:'', texte2:'', version:'2026', cfc:{numero:'', texte1:'', texte2:''}, articles:[ARTICLE] }
ARTICLE  = { m:'000', u:'', unite:'', motCle:'', motCleAuto:false, texte:[/* lignes ≤ 30 car. */],
             pointInsertion:null /* {ligne, col} */, prixIdentique:false, largeurForcee:false, sautPage:false,
             variables:[{ v:'01', texte:[], pointInsertion:null, documents:[] }],
             quantites:[QP], remarquesPrelim:[CODES], documents:[{nom, fichier, article:true}],
             textesEntreprise:{ [contactId]:{ texte:[], documents:[] } } }   // UDesc (C1 → D)
QP = { cfc:'', ouv:'', lg:'', cfe:'', te:'', locaux:'', affectation:'', gv:'', var:'', cal:'',
       gq:'A', quantite:0, gp:'A', prix:0, montant:0, tvaStandard:true, tva:null, rpa:null /* {m,u} */,
       numeroCourant:'', metre:[LIGNE_METRE], prixEntreprises:[{contactId, gp:'A', prix:0, montant:0}] }
LIGNE_METRE = { genre:'0', no:'01', date:null, commentaire:'', formule:'', quantite:0, st:false }
CODES = { cfc, ouv, lg, cfe, te, locaux, affectation, gv, var }
```

### 2.8 `COND` (commun)

```js
{ niv, ref, genre /*0..10*/, texte /*≤ 30*/, valeur /*≤ 2 décimales*/, jours:0 /*termOfPayment*/,
  ouv:'', lg:'', cfc:'', m:true /*apply*/, afficherST:false /*applyBetweenTotal = « M S-T »*/,
  montant:0 /*total calculé, arrondi*/ }
```

Au bref, seuls `niv, ref, genre, texte, valeur, ouv, lg, m, montant` sont utilisés.

### 2.9 Documents et pièces : collection `soumissiondoc` [C]

```js
{ ID, DOCUMENT_ID, type /* clé .dpdoc */, contactId:null, etabliLe, USERID, jeu:1|2,
  textes:{ [bandeId]:'…' }   // textes modifiés du modèle, lot 4
  pdf:null                   // {nom, date, taille} quand le serveur de fichiers existe (lot 4)
}
```

- « Document disponible » = la ligne existe.
- « PDF disponible » = `pdf` renseigné.
- Les notes d'expédition et remarques vivent dans `soumission.documents[type]` ou dans `entreprises[].notes`.

### 2.10 Notes d'expédition du document (`soumission.documents`) [P champs `DevisDocument`]

| Clé | Champs Java |
|---|---|
| `listeSoumissionnaires` | subListMailingNote |
| `comparatif` | priceComparisonMailingNote / Note |
| `comparatifDescriptif` | priceComparisonDesc… |
| `propositionAdjudication` | awardRequest… |
| `commandeContrat` | contractOrder… |

Chacune a la forme `{exp, rem}`.

### 2.11 Correspondance Java → DeltaSub (pour mémoire)

| Java | DeltaSub |
|---|---|
| `inputDate` / `inputTime` / `biddingStartDate` | `appelOffres.dateDepot` / `heureDepot` / `dateOuverture` |
| `workPrepBegin` / `workBegin` / `workEnd` | `appelOffres.debutPreparation` / `debutTravaux` / `finTravaux` |
| `expertPlanner*` / `tenderInput*` | `appelOffres.mandataire` / `lieuDepot` |
| `priceCompareUnit.kvSum` | `appelOffres.montantDG` |
| `revKvSum`, `vergabeSum`, `mutationSum`, `mutationKag`, `orderSum`, `openSum`, `reserveSum`, `garantieSum`, `preisStand`, `abgebotDate`, `comment1..4` | `informationsComparatif.*` |
| `shortPriceCompareStructureList` | `bref.structure` |
| `Entrepreneur.bruttoValueShort` / `nettoValueShort` / `vatShort` / `conditionListShort` | `entreprises[].bref.offre` |
| `…AbgebotValueShort` / `abgebotConditionListShort` | `entreprises[].bref.negociee` |
| `bruttoValue` / `nettoValue` / `vat` / `conditionList` / `abgebot…` | `entreprises[].detail.*` |
| `offerData` | `indications` |
| `Div.priceList[Price{contactID, price, value, priceKind}]` | `QP.prixEntreprises` |
| `Position.c` | `CHAPITRE.numero` |
| `m` / `u` / `v` | `ARTICLE.m` / `u` / `variables[].v` |

### 2.12 Serveur et chargement [P code DeltaSub + C]

- `serveur_deltasub.py` l. 42 : ajouter `devisdocument`, `soumission`, `soumissiondoc`, `soumissionhist` **et `projecttenderer`** à `PROTECTED`. Aujourd'hui, un ré-import `--force` efface les saisies de soumissionnaires.
- `DeltaSub.html` l. 161 (`HEAVY`) : ajouter `soumission` et `soumissionhist`.
- `DeltaSub.html` l. 181 : ajouter `devisdocument`, `soumission`, `soumissiondoc`, `soumissionhist` aux collections éventuellement vides, sur le modèle de `HF_TABLES`, via une constante `SV_TABLES`.
- Collections déjà importées mais pas encore chargées par l'interface : `invoicecondition`, `invoiceconditiongroup`, `bidcriterion`, `bidcriteriongroup`, `projectroom`, `projectusezone`. Les charger à la demande (`DS.need`).
- Détection des conflits entre postes : `bseq` / 409 existants, en plus du verrou (§3.5).

---

## 3. Liste, fiche de soumission, création, stades et transitions

### 3.1 Liste des soumissions [P `db.DevisDocumentTableModel`, `DevisFrame`]

**Mise en page**
- Barre : `+` · copier (Dupliquer) · crayon ▾ · `−` · roue ▾ · entonnoir ▾ · libellé du filtre actif · recherche plein texte.
- Dans « Mes soumissions », une colonne A affiche les affaires, comme dans `VIEWS['devis']` [C].

**Colonnes**

| # | En-tête | Contenu |
|---|---|---|
| 0 | (vide) | icône de verrou si le document est verrouillé |
| 1 | Numéro d'affaire | seulement dans « Mes soumissions » |
| 2 | CFC | |
| 3 | Adjudication | |
| 4 | Numéro d'ordre | |
| 5 | Utilisateur | |
| 6 | Date | |
| 7 | Version | |
| 8 | N° de version | |
| 9 | Statut | |
| 10 | Stade actuel | |
| 11 | Note | |

**Vues** (roue ▾, mémorisées par utilisateur) : « Adjudication » (masque Numéro d'ordre) · « Commande » (masque CFC et Adjudication) · « Standard » (défaut, tout visible). La roue propose aussi « Copier le contenu du tableau dans le presse-papier » et « Exporter le tableau dans un fichier CSV ».

**Entonnoir ▾** : « Afficher tout », puis une case par stade (13 stades). Le libellé du filtre affiche le stade choisi. « + » remet le filtre à « Afficher tout ».

**Lignes supprimées** (corbeille) : grisées (alpha 125) quand on les affiche.

**Crayon ▾** : « Editer… » (dialogue §3.3) · « Ouvrir le document… ».
- Double-clic : ouvrir.
- Maj + double-clic : éditer.

**Nouveau (+)** :
- dans le domaine de l'affaire : actif seulement si une affaire est sélectionnée ;
- dans « Mes soumissions » : dialogue « Choix de l'affaire » d'abord.
- Enchaînement : dialogue d'information « Sélection des standards CRB » réduit (texte « Document selon IFA 2018 — Catalogue CAN. Ce choix ne peut pas être modifié ultérieurement. ») [C], puis dialogue « Nouveau document » (§3.3), puis création atomique `devisdocument` + `soumission` (unité B vide, `dernierNoeud:'B'`) par `DS.commit`, puis ouverture sur APPEL D'OFFRES ▸ Editer.

**Dupliquer** [P `duplicateDevisDocument`] :
- copie de l'en-tête : affaire, utilisateur, date, statut, note, n° de version, IfA, catalogue, stade, CFC, adjudication ;
- `VERSION` = `<version> Copie`, ou « Copie » si la version est vide [C : corrige « null Copie »] ;
- **numéro d'ordre non copié** ; N° de version réaffiché à 1 ;
- copie profonde du JSON `soumission` et des `soumissiondoc`.

**Supprimer en deux temps** [P `deleteDevisDocument`] :
1. Document non marqué : « Voulez-vous vraiment supprimer cette inscription ? » → `ISMARKEDASDELETED` = 1.
2. Document déjà marqué (visible avec « Afficher les supprimés ») : « Voulez-vous vraiment supprimer définitivement cette inscription ? » → suppression de `devisdocument`, `soumission` et `soumissiondoc` [C : Deltaproject laissait les fichiers].

**Editer** : sur OK, un document marqué supprimé est **restauré** [P `editDevisDocument@48-56`].

**Pas de « Traduire » ni de « Convertir au format IfA '18 »** (licence et ancien format).

### 3.2 Création indirecte

**Depuis la Planification eCCC** (lot 4) [P `costplanning.convert.CreateDevisDialog`] :
- en-tête : CFC et adjudication saisis, note « Export du devis selon eCCC », Brouillon, N° de version 1, **stade « Soumission » (11)** ;
- contenu dans l'unité **K** (Estimatif) ;
- message « Le descriptif a été créé dans le module DELTA soumissions. ».

### 3.3 Dialogue « Nouveau document » / « Editer la soumission » [P `DevisDocumentDialog`]

| Libellé | Contrôle | Règle |
|---|---|---|
| Lot d'adjudication | [CFC] [désignation ≤ 128] [ … ] | « … » ouvre « Choix de la position » sur le **plan CFC de l'affaire** (`projectcatalog` de type 0 → `projectcatalogpos`, comme `dvEditor` l. 2589). Au retour : CFC ← code, désignation ← texte. Si l'affaire n'a pas de plan : « Aucun catalogue n'a été attribué. ». Les deux champs restent éditables à la main. |
| Numéro de l'ordre | texte | ≤ 64 |
| Version | texte | ≤ 64 |
| N° de version | nombre | 1 en création ; saisie invalide → valeur précédente |
| Standard CRB | lecture seule | « IFA 2018 » |
| Catalogue | lecture seule | « CAN » |
| Statut | liste 4 | |
| Date | champ + calendrier | non saisissable au clavier ; jamais mise à jour automatiquement |
| Stade actuel | liste 13 | ordre du §2.2 |
| Utilisateur | champ + ◀ | menu des utilisateurs |
| Note | zone de texte 5 lignes | ≤ 1024 |

- OK est actif si Statut et Stade sont renseignés.
- Les textes sont `trim()`.

### 3.4 Stade actuel : purement déclaratif [P]

Aucune navigation ne le modifie. Seuls le dialogue et la création depuis l'eCCC l'écrivent.

[C] Pas d'automatisme dans DeltaSub. À signaler à Paulo : on pourrait **proposer**, sans imposer, « Proposition d'adjudication » à l'impression de la proposition, « Commande » à celle de la commande, et « Contrat » au transfert vers le contrôle des coûts.

### 3.5 Verrou coopératif [P `DocumentLockDialog.tryLock@0-107` + C]

- **Pose** : à l'ouverture, à l'édition, à la duplication (sur la source) et à la suppression : `LOCKUSERID` = moi, `LOCKTIME` = maintenant.
- **Levée** : à la fermeture.
- **Document déjà verrouillé par un autre** : dialogue « Document verrouillé », texte « Ce document est actuellement utilisé. », champs « Utilisateur », « Utilisé le ».
  - Case « Déverrouiller ce document », active pour le propriétaire du verrou ou le droit `generalUnlockDocuments`.
  - OK n'est actif que si la case est cochée, puis confirmation « Voulez-vous vraiment déverrouiller ce document ? Attention, veuillez vous assurer que l'utilisateur mentionné ne travaille pas dans le document afin d'éviter la perte de données. ».
- **Refus** : ouverture en **lecture seule** [C, mieux que le refus de Deltaproject].

### 3.6 Fenêtre de soumission [P `d18.DevisDialog`, `MenuTree`]

**Titre** : `<N° affaire> <CFC> <désignation>` ; si le CFC est vide, `<N° affaire> <Numéro de l'ordre>`.

**Menus**
- « Fichier » : « Enregistrer » (⌘S), « Fermer… » (⌘W).
- « Paramètres » : « Présentation… », qui ouvre « Paramètres utilisateur » (lot 4, §10.9).
- Dans DeltaSub : barre « ‹ Liste » + titre + boutons, comme `ccEditor` [C].

**Arbre** (à gauche, 155 px, accordéon, racine masquée, ligne vide entre les étapes ; seules les feuilles agissent) [P `MenuTree|menu_*`, `subMenu_*`] :

| Étape | Sous-entrées | Lot |
|---|---|---|
| APPEL D'OFFRES | Editer · Documents | 1 (données) / 3 (descriptif) |
| SOUMISSIONNAIRES | Editer · Documents · Lettres d'accompagnement | 1 |
| COMPARATIF BREF | Editer · Documents · Négociation · Courriers de refus | 2 |
| COMPARATIF | Editer · Documents · Négociation · Courriers de refus · Descriptif | 3 |
| OFFRE | Editer · Documents | 3 |
| CONTRAT | Editer · Documents | 3 |
| MÉTRÉ | Editer · Documents | 3 |
| DESCRIPTIF TYPE | Editer · Documents | 3 |
| ESTIMATIF | Editer · Documents | 3 |

- Les nœuds d'un lot non livré sont affichés grisés, avec la mention « prévu au lot n » [C].
- « PARAMÈTRES » **n'est pas un nœud** [P : l'énumération `Menu` a 9 valeurs].

**Nœud initial** : « Editer » de `dernierNoeud` (A…K, SUB → SOUMISSIONNAIRES, BREF → COMPARATIF BREF) ; défaut APPEL D'OFFRES ▸ Editer.

Chaque navigation met à jour `etape` et `dernierNoeud` [P `DevisDialog.setMenu`] :
- SOUMISSIONNAIRES → étape B, nœud SUB ;
- COMPARATIF BREF → étape inchangée, nœud BREF ;
- COMPARATIF → C1.

**Garde-fou avant les nœuds Documents / Négociation / Courriers de refus / Descriptif d'une étape à descriptif** [P `documentIsErrorFree`] : contrôles de §7.14 (article de réserve sans texte, puis descriptif). En cas d'échec, retour à « Editer » et sélection de l'article fautif. La règle 000.200 est **désactivée** (sans objet sans CAN) [C].

**Synchronisation à l'entrée du COMPARATIF et du COMPARATIF BREF** [P `DevisEntrepreneurs.setEntrepreneurs`] :
- rafraîchir `abreviation` depuis l'adresse ;
- au comparatif détaillé seulement :
  - assurer une entrée `prixEntreprises` par entreprise prise en compte ;
  - reporter le prix du concepteur si GP = R ou F et prix ≠ 0 ;
  - retirer les entrées des entreprises non prises en compte.
- Les chapitres dont le numéro contient « 0 » sont ignorés (voulu, §0-11).

**Panneau « Données de l'étape »** [C] : tant que le descriptif (lot 3) n'existe pas, APPEL D'OFFRES ▸ Editer affiche un panneau qui regroupe les entrées du pinceau de l'étape B (§4.4) : Titre et date du document, Informations d'appel d'offres, Mandataire spécialisé, Lieu de dépôt des offres, Entrepreneur.

### 3.7 « Transférer ▾ » : transitions entre étapes (lot 3) [P `DescFrame.getTransferPopupMenu@9-516`, `transferDocType@1-208`, `TransferDocument`]

**Menu** : une entrée n'apparaît que si l'étape cible ≠ l'étape courante **et** que l'unité cible est **vide**.
- « Créer l'appel d'offres »
- « Créer le comparatif » — **uniquement depuis B**
- « Créer l'offre »
- « Créer le contrat »
- « Créer le métré »
- — « Créer le descriptif type »
- — « Créer l'estimatif »

**Préconditions**
- Vers C1 : au moins un soumissionnaire, sinon « Vous n'avez pas défini les soumissionnaires. » (`DescFrame|msg5`).
- Pour tous : contrôles du descriptif (§7.14), puis droits (§1.4).

**Règle générale de copie** (`setOneCostUnit`) :
- Unité : entreprise, **copie profonde des chapitres** (articles, variables, QP, métrés, prix par entreprise), `arrondi5ct`, colonnes, tris, insertion automatique, date, textes libres 1-5. Le **titre n'est pas copié** (le titre par défaut de la cible s'applique).
- Listes : subdivisions, variantes, ordre des colonnes, 6 ordres de tri, filtre, conditions, brut.
- Pièces jointes des articles et documents `.dpdoc` du descriptif.

**Cas particuliers**

| Transfert | Règle |
|---|---|
| **Depuis B** (vers toute cible) | Dans la cible, métré vidé pour toute QP dont GQ ≠ « A » (§0-1). |
| **B → C1** (@6327-6861) | Chapitres copiés. Pour chaque entreprise × article, un `textesEntreprise` initialisé. **Chaque entreprise reçoit `detail.offre.conditions` = copie des conditions de l'appel d'offres.** Si aucune entreprise n'est proposée, la **première** le devient. Chaque QP reçoit un `prixEntreprises` par entreprise (`gp:'A'`, `prix` = prix de la QP ; F et R du concepteur conservés). |
| **C1 → cible** (A, B, C, D, I, K) (@763-1036, @3856-4245) | Chapitres copiés, puis, pour l'**entreprise proposée** : ses `textesEntreprise` remplacent textes et pièces, et, pour chaque QP, `prix`, `montant` et `gp` sont ceux de son `prixEntreprises`. **Conditions de la cible = conditions négociées de la proposée si elles existent, sinon ses conditions d'offre.** Entreprise de l'unité = proposée. Le brut n'est pas transféré (recalculé). |
| **D → I** (@4709-4853) | Règle générale, **quantités et prix conservés**, conditions copiées, brut = brut du contrat. |

**Après le transfert** : sélection automatique de « Editer » de la cible.

### 3.8 Enregistrement et fermeture [P `DevisDialog.doClose@1-127`, `formWindowClosing@4-39`, `Save` + C]

- DeltaSub enregistre au fil de l'eau (`DS.commit`, comme `dvEditor`). « Enregistrer » force l'écriture et l'historique.
- **Historique** [C, remplace les 5 copies `devis18_<date>`] : une version horodatée du JSON `soumission` toutes les 10 minutes d'édition, 5 conservées, dans un champ `historique` d'une collection `soumissionhist`. Commande cachée « À la dernière version… » (Maj + clic sur « Paramètres »), qui restaure la version choisie après confirmation.
- **À la fermeture** (et à « Enregistrer »), deux écritures sur l'affaire (§9.4) :
  1. `bookEntrepreneur` : entreprise du **contrat** → intervenant « Entreprises » ;
  2. `matchTenderers` : chaque entreprise → `projecttenderer`.
- Les deux questions de Deltaproject à la fermeture ne sont **pas** reprises [C] :
  - « Voulez-vous enregistrer les modifications ? » est inutile en enregistrement continu ;
  - la seconde question porte un libellé erroné (`msg14`).

---

## 4. Appel d'offres et soumissionnaires

### 4.1 SOUMISSIONNAIRES ▸ Editer [P `d18.TenderingFrame`]

**Disposition**
- Barre : `+`▾ · ✎▾ · `−` · pinceau ▾ · roue ▾ (+ document ▾ « [Ancien document] » : non repris).
- Table des soumissionnaires.
- En dessous, deux volets :
  - à gauche, fiche « Entité » (nom, adresse, Téléphone, Tél. mobile, Courriel, ⓘ) et « Responsable » (idem) ;
  - à droite, « Documents PDF attribués » (lot 4).

**Table**

| Colonne | Contenu |
|---|---|
| Entités | nom du propriétaire de l'adresse + « (+) » si proposée |
| Responsable | nom |
| Situation de l'offre | |
| Pris en compte dans la comparaison des prix | case, lecture seule |
| Désignation | `remarque` |

- Table non éditable ; **tri permanent** par `abreviation` (comparaison de chaînes, à égalité le nouveau devant) ; sélection multiple.
- Masquées : entreprises à `contactId` ≤ 0.
- Clic : la fiche suit. Double-clic : fiche soumissionnaire (§4.3). Clic droit : « Entité et responsable ».
- **Activation** : `−`, ✎ et PDF exigent **exactement une** ligne sélectionnée ; Courriel et « Actualiser l'adresse » au moins une.

### 4.2 Ajouts (`+`▾) [P `openProjectTenderList`, `openProjectAddrList`]

**« Depuis la liste des soumissionnaires »** : dialogue « Liste de soumissionnaires » sur **tous** les `projecttenderer` de l'affaire.
- Colonnes : CFC (60) · Entité · Responsable · Commande reçue · Note.
- Recherche insensible à la casse sur toutes les colonnes.
- Entonnoir : « Afficher tout », puis les CFC distincts triés (40 au plus, au-delà « Autres… »), **égalité stricte**. Pas de filtre initial sur le lot [P] ; [C] présélectionner le filtre sur le CFC du lot s'il existe.
- OK actif si au moins une ligne est sélectionnée : `contactId` ← `CONTACT_ID`, `responsableId` ← `RESPCONTACT_ID`.

**« Depuis les adresses »** : `pickContact` en sélection multiple, type entreprise par défaut, responsable vide.

**Pour les deux sources**
- Adresse sans abréviation (`SHORTLABEL`, sinon nom) : erreur « L'adresse ^0 n'a pas d'abréviation. » (^0 = NAME1), ligne ignorée.
- Dédoublonnage par `contactId` : une entreprise déjà présente voit seulement son abréviation rafraîchie.
- Toujours renseigner `abreviation` [C : corrige l'oubli de Deltaproject @274-282].
- Aucune écriture dans `projecttenderer` à ce moment-là : elle a lieu à la fermeture (§9.4).

**Supprimer** (`−`)
- « Voulez-vous vraiment supprimer cette saisie? ».
- Retire l'entreprise **et** ses notes d'évaluation (critères et sous-critères) [P @128-323].
- Ses prix et conditions restent orphelins dans Deltaproject [D]. [C] Les purger aussi.

### 4.3 Fiche soumissionnaire (`d18.tender.ContactSpecDialog`, titre « Nouveau » / « Modifier ») [P @27-495, @103-203]

| Libellé | Contrôle |
|---|---|
| Entité | lecture seule + adresse + [suggestion ▾] + ⓘ. Suggestion : autres adresses du même propriétaire · « Choisir… » · « Supprimer ». Le bouton de suggestion est masqué depuis Editer et depuis Lettres. |
| Responsable | idem ; suggestion : personnes liées au propriétaire (20 au plus, puis « Autres… »), « Choisir… », « Supprimer ». |
| Note d'expédition | texte + suggestions « Par courrier, jj.mm.aaaa » / « Par courriel, jj.mm.aaaa » (date du jour) |
| Situation de l'offre | zone de texte + suggestions « Offre reçue, jj.mm.aaaa » · « Pas offert » · « Annulée » · « Refusé » |
| Remarque | texte |
| ☐ Prendre en compte dans la comparaison des prix | case |

**Champs actifs selon l'appelant**
- Depuis Editer : note d'expédition **désactivée**.
- Depuis Lettres d'accompagnement : case « Prendre en compte… » **désactivée**.

**Règle à OK** : si l'on décoche « Prendre en compte… » alors que l'entreprise a des prix, question « Les prix ont déjà été saisis pour cet entrepreneur. Voulez-vous vraiment le supprimer du comparatif ? ». Non : le dialogue reste ouvert. Oui : validé ; les prix sont conservés, seul l'indicateur change.

« A des prix » :
- au bref : `bref.offre.conditions` ou `bref.negociee.conditions` non vide ;
- au détaillé : un prix ≠ 0 dans **n'importe quelle** QP [C : Deltaproject ne regardait que les articles à une seule QP].

### 4.4 Données d'appel d'offres (pinceau ▾ de SOUMISSIONNAIRES et d'APPEL D'OFFRES) [P]

**Pinceau de SOUMISSIONNAIRES** : « Informations » · « Mandataire spécialisé » · « Lieu de dépôt des offres » · « Montant du DG ».

**Pinceau du descriptif** (étapes B et C) : « Informations d'appel d'offres », etc. (§7.5).

**« Informations »** (`tools.DevisTenderDataDialog`, titre « Informations ») :

| Libellé | Donnée |
|---|---|
| Date de dépôt de l'offre | `dateDepot` (champ + calendrier) |
| Heure de dépôt de l'offre | `heureDepot` (texte) |
| Date d'ouverture des offres | `dateOuverture` |
| Type de procédure | `procedure` (liste 7) |
| Début de la préparation / Début des travaux / Fin des travaux | textes libres |
| Texte libre 1…5 | `unites[étape].textesLibres` (en SOUMISSIONNAIRES : étape B) |

- [C] Enregistrer les **5** textes : Deltaproject oublie `comment5` et la sauvegarde automatique dans ce point d'accès.
- Les mêmes champs de délais sont aussi écrits par « Informations du contrat » (D, I, §8.8) [P].

**« Mandataire spécialisé » / « Lieu de dépôt des offres »** (`tools.ContactSpecDialog`, titre « Editer ») : blocs Entité et Responsable avec suggestion, « Choisir… », « Supprimer », ⓘ.

**« Montant du DG »** (`tools.EstimateSumDialog`) : champ « Montant » (texte) + bouton de parcours sur les devis généraux de l'affaire au statut **Validé** (`costestimatedocument.STATECODE` = 2) :
- 0 validé : « Il n'existe aucun devis général dont le statut est validé. » ;
- 1 : ouverture directe ;
- plusieurs : « Devis généraux » (`Date | Version | N° de version`), puis « Estimatif » (`N° | Texte | Montant`, lignes CFC du DG calculées par `dvCompute`) ;
- la valeur choisie est écrite formatée dans `appelOffres.montantDG`.

**« Titre et date du document »** (`tools.TitleDateDialog`) : « Titre du document », « Date du document » (+ calendrier), ☐ « Titres de chapitres CAN plutôt que CFC ». OK n'est actif que si titre et date sont remplis.

**« Entrepreneur »** (toutes étapes sauf C1, §0-6) : Entité + Responsable de l'unité.

### 4.5 Roue ▾, courriel, actualisation, PDF [P]

- **Courriel** : `mailto:` vers, pour chaque ligne sélectionnée, le responsable s'il existe, sinon l'entité (`EMAIL1`) ; sujet et texte vides.
- **Actualiser l'adresse** (dialogue « Actualiser l'adresse », « Adresse précédente: », bouton « Nouvelle adresse ») : remplace `contactId` et `responsableId`, et les `contactId` des notes d'évaluation. [C] Remapper **aussi** les `prixEntreprises` et les clés `bref.structure[].lignes` (Deltaproject perd le lien).
- **Documents PDF attribués** (lot 4, serveur de fichiers) :
  - « Ajouter un fichier PDF », « Ouvrir PDF » (dès 1 ligne ; corrige le seuil de 2), « Fusionner PDF » (nom proposé « <abréviation> fusion.pdf », corrige « TODO Merged.pdf »), « Partager le fichier PDF », « Supprimer le fichier PDF » ;
  - suppression avec confirmation « Voulez-vous supprimer ce fichier définitivement ? ».

### 4.6 SOUMISSIONNAIRES ▸ Documents et ▸ Lettres d'accompagnement [P `TendererDocumentsFrame`, `TendererDocumentsLetters`]

**Documents** :
- Table `Type de document | Document disponible | PDF disponible | Note d'expédition`, une seule ligne « Liste des soumissionnaires » (`devisTendererList`).
- Crayon ▾ : « Liste des soumissionnaires » · « Fichier PDF attribué » · — « Note d'expédition ».
- Gomme ▾ : « Effacer le document » (**refusé si le PDF existe** : « Un fichier PDF existe déjà. » ; sinon « Voulez-vous supprimer ce fichier définitivement ? ») · « Effacer le PDF ».
- Partage ▾ : « Partager le fichier PDF » · « Exporter le PDF ».
- Double-clic : PDF s'il existe, sinon document.
- Note d'expédition : dialogue « Note d'expédition », suggestions « Par courrier » / « Par courriel ».
- Sujet de partage : « Liste des soumissionnaires <CFC> <désignation> ».

**Lettres d'accompagnement** :
- Table, une ligne par entreprise (ordre de la liste) : `Entité | Responsable | Situation de l'offre | Document disponible | PDF disponible | Note d'expédition | Remarque`.
- Crayon ▾ : « Document » · « Document PDF attribué » · — « Informations de l'entreprise » (fiche §4.3, avec note d'expédition active).
- Gomme ▾ : « Effacer le document » · « Effacer le PDF » · — « Supprimer tous les documents et fichiers PDF ».
- Roue ▾ : « Utiliser ce document pour tous » (actif si la lettre de la ligne existe) + export du tableau.
- Une lettre `devisTendererLetter` par entreprise ; **date du rapport = date du document de l'étape B** (`unites.B.date`, défaut aujourd'hui).
- « Utiliser ce document pour tous » : copie les textes modifiés vers toutes les autres entreprises, puis régénère leurs documents et PDF.
- Partage : sujet « <titre de l'étape B> <CFC> <désignation> » ; destinataires = entité + responsable.
- [C] Nom d'export `Lettre d'accompagnement_<CFC>_<désignation>.pdf` (Deltaproject réutilise par erreur la clé du courrier de refus).

### 4.7 Domaine d'affaire « Soumissionnaires » (existant, l. 1530-1539) : corrections [P `ProjectTendererDialog` + C]

- Ajouter le champ **Responsable** (`RESPCONTACT_ID`, via `pickContact` parmi les personnes).
- CFC choisi dans le plan CFC de l'affaire (bouton « … »), le texte libre restant permis.
- Libellé exact de la case : « Commande reçue ».
- Menus manquants (lot 4) :
  - Courriel ;
  - Liste d'adresses et Étiquettes ;
  - « Groupés par CFC » ;
  - « Importer la liste de soumissionnaires d'une autre affaire » (contrôle « Les plans comptables sont différents ») ;
  - impression `projectTendererList`.
- Sémantique [P `DevisDialog.setTenderers`] : « Commande reçue » = **entreprise proposée à l'adjudication** du lot (écrit à la fermeture de la soumission).

---

## 5. Comparatif bref (lot 2)

### 5.1 Écran « Editer » [P `SimplePriceCompareFrame`]

**Volet gauche**
- Barre : crayon ▾ · personnes ▾.
- Table des entreprises : colonnes `Société | Responsable | Offre | Offre négociée`.
  - Offre et Offre négociée sont les **nets** arrondis selon « Arrondir ».
  - Lignes : `contactId` > 0 **et** `prisEnCompte`.
  - Nom + « (+) » si proposée, affiché en vert (0,155,0) [D : rendu].
  - **Ordre toujours alphabétique** par abréviation.
  - Double-clic : « Indications de l'offre ».
- Fiche contact.
- « Fichiers PDF relatifs aux offres reçues » (lot 4).

**Volet droit**
- Barre : `+` (CFC) · `−` (CFC) · export ▾ · clé ▾ · document ▾ · lune (non reprise).
- Deux tableaux superposés, **« Offre »** et **« Offre négociée »**, chacun avec un bouton ✎. Colonnes (6) :
  - avec ouvrages : `CFC | Texte | Ouvrage | "" | Localisation | Montant` ;
  - sans ouvrages : `CFC | Texte | Conditions | "" | "" | Montant`.
- Lignes, pour l'entreprise sélectionnée :
  1. une ligne par CFC (ou CFC × ouvrage), **au brut** ;
  2. « Total brut » ;
  3. une ligne par condition : texte, facteur et « % » pour les genres en %, montant, **montant entre parenthèses si M est décoché** ;
  4. « Total net ».
- Double-clic sur un tableau : dialogue Conditions de l'offre ou de l'offre négociée.

**Menus** (libellés exacts)

| Menu | Entrées |
|---|---|
| Crayon ▾ | « Informations… » (ouvre « Indications de l'offre ») · « Evaluation… » · « Référence pour l'écart… » |
| Personnes ▾ | une case par entreprise, cochée = proposée ; **exclusif** ; on ne peut pas décocher [P @17-48] |
| Clé ▾ | « Affichage et tri… » · « Commentaire… » · « Indications de l'offre » (ouvre « Informations ») — ☐ « Arrondir » · ☐ « Avec ouvrages » (actif seulement si l'affaire a des ouvrages) |
| Export ▾ | « Créer un contrat sur la base de ce descriptif » (lot 3, §8.11) |
| Document ▾ | « Transférer vers contrôle du coût… » (actif si une entreprise est proposée). Les six « [Ancien document] » ne sont pas repris. |

[C] Les libellés des menus crayon et clé sont **inversés** par rapport aux titres des dialogues. DeltaSub libelle les menus d'après les dialogues : crayon ▾ « Indications de l'offre… », clé ▾ « Informations… ». Écart à signaler.

**États** :
- ✎ Offre / ✎ Offre négociée : entreprise sélectionnée et au moins une ligne CFC ;
- `+`, clé, document et export : au moins une entreprise.
- [C] « Arrondir » soumis aux droits (Deltaproject basculait avant le contrôle).

### 5.2 Structure CFC (`+` / `−`) [P `jEntrepreneurNewButtonActionPerformed@23-401`, `jConditionRemoveButtonActionPerformed`]

- **`+`** : navigateur du plan CFC de l'affaire.
  - CFC déjà présent : rien ne se passe.
  - Sinon : `{cfc, texte}` inséré dans la liste triée par comparaison de chaînes.
  - Si « Avec ouvrages » : un sous-élément par ouvrage de l'affaire (`SUBPROJECT.CODE`, `LOCATIONCODE`, ID).
- La structure est **commune à toutes les entreprises**. Basculer « Avec ouvrages » ne modifie pas les CFC existants [D].
  - [C] À la bascule, proposer « Reconstruire les lignes par ouvrage ? », sans perte des montants CFC quand on passe à « sans ».
- **`−`** : « Voulez-vous vraiment supprimer cette saisie? », puis recalcul silencieux de toutes les entreprises.

### 5.3 Dialogue « Conditions » (`pricecompare.PriceCompareConditionDialog`, 930 × 675) [P]

**« Positions de l'offre : »**
- Colonnes : `CFC (60) | Texte | [Ouvrage (100), si l'affaire a des ouvrages ; affiché « ouv  |  lg »] | Brut (100) | Net (100)`.
- Ligne « Total » s'il y a plus d'une ligne.
- Colonne saisissable (fond gris) : **Brut** en « Saisie du brut », **Net** en « Saisie du net ».

**« Conditions de l'offre : »**, avec à droite la liste « Saisie du brut » / « Saisie du net »
- Colonnes : `NIV (30) | REF (30) | Désignation | Genre (30) | Ouvrage (70) | Conditions (90) | Montant (90) | M (25)`.
- Saisissables : Désignation, Genre, Conditions, M.
- Par clic :
  - NIV → « Ajouter une condition au-dessus / au-dessous », « Supprimer la condition » ;
  - REF → menu 0 … n−1 ;
  - Genre → les 9 genres du §2.2 ;
  - Ouvrage → ouvrages présents dans les positions, plus « Supprimer l'ouvrage ».
- Roue ▾ : « Ajouter une condition au-dessus » · « … au-dessous » · « Navigateur » · « Net - arrêté à » — « Supprimer la condition ».
  - « au-dessus » insère à la ligne sélectionnée, « au-dessous » après elle [P ; les identifiants de Strings.db sont croisés].

**Autres éléments**
- « Note interne » : `noteInterne`, **commune** à l'offre et à l'offre négociée [P].
- Bouton « Proposition » : visible **seulement pour l'offre négociée**.
- « Annuler » / « OK ».

**Nouvelle ligne** : NIV = rang, REF = NIV − 1, Désignation « Escompte (%) », Genre S%, valeur `-0.0`, M ✓.
- NIV est **toujours renuméroté 1…n** dans l'ordre des lignes ; les REF suivantes sont décalées à l'insertion et à la suppression.
- Suppression : « Voulez-vous vraiment supprimer cette inscription ? ».

**Choisir un genre** remplit Genre et Désignation ; pour la TVA, Conditions = `genVatRatePos` (8.1).

**Valeurs signées** : le programme n'inverse jamais le signe (un rabais de 5 % se saisit −5).

**Contrôles** [P `calc@26-385`, `jOkButtonActionPerformed@48-91`] :
- REF ≥ NIV : « Le niveau de référence de la condition ^0 est incorrect. »
- REF vide : « Vous n'avez pas défini de niveau de référence pour la condition ^0. », puis « Au moins un niveau de référence n'est pas défini. »
- Plus de 2 décimales : « La condition ne peut avoir que deux décimales. »
- OK avec des conditions mais aucune ligne CFC : « Vous n'avez défini aucune position. »

Le bref ne fait **aucun** contrôle de TVA ni de longueur à 30 caractères [P].

### 5.4 Moteur `svCondBref` (portage fidèle de `d18.CalcCondition` + `PriceCompareConditionDialog.calc`) [P rapport comparatif bref ; vérifié par `sim.py` sur MAN-FR p.74]

```
r2(x)      = Math.floor(x*100 + 0.5)/100                        // CalcCondition.roundPrice (Math.round Java)
rnd(x,a5)  = signe(x) · (a5 ? floor(20|x|+0.5)/20 : floor(100|x|+0.5)/100)   // util.Formatter.round(Double,boolean)
FORFAIT    = {0,4,6,8,10}
entrées    : lignes i = {b_i (brut), clé_i = '' | 'ouv' | 'ouv  |  lg'}, conds c = {niv, ref, genre, valeur, clé, m}
B          = Σ b_i (calcBruttoOfThisNumber : TOUTES les lignes)

pour chaque ligne i :
   L = [{niv:0, ref:-1, fac:0, sum:0, base:0}]
   pour chaque c (ordre du tableau) :
      actif = c.m && (c.clé=='' || c.clé==clé_i) ; v = actif ? c.valeur : 0
      L.push({niv:c.niv, ref:c.ref,
              fac: c.genre∈FORFAIT ? 0 : v,
              sum: c.genre∈FORFAIT ? (saisie brut ? v·b_i/B : v·n_i/Σn) : 0, base:0})
   pour chaque c actif, dans l'ordre :
      lv = niveau de c ; x = b_i
      si lv.ref > 0 : pour chaque y de L (dans l'ordre) avec y.niv ≤ lv.ref : x = r2(x + y.base·y.fac·0,01 + y.sum)
      lv.base = x
      montant_i(c) = c.genre∈FORFAIT ? lv.sum : c.valeur·x·0,01
   affiché_i(c) = rnd(montant_i(c), a5)
   net_i        = rnd(b_i + Σ_c r2(affiché_i(c)), a5)
total(c) = rnd(Σ_i montant_i(c), a5)
Brut = Σ r2(b_i) ; Net = Σ r2(net_i) ; TVA = Σ total(c) pour genre 2 et c.m
```

- **Condition liée à un ouvrage** : elle ne s'applique qu'aux lignes de même clé.
- **Défaut de Deltaproject** [P] : un forfait lié à un ouvrage est réparti au prorata de B (**toutes** les lignes), donc **sous-imputé**. Exemple §12.
  - [C] DeltaSub répartit sur les **seules lignes concernées** (`B_c = Σ b_i des lignes de même clé`).
  - Écart assumé, à signaler à Paulo (§13).

### 5.5 Saisie du net [P `calc@2302-3489`, `CalcCondition.approxMultiConditions@2-257`]

- Pour chaque ligne de net `n` : chercher `b` tel que `f(b) = b + Σ r2(montant_j(b)) = n` (sans arrondi à 5 ct).
- Deltaproject part de `b = 40·n`, puis fait `b ← b ± |n − f|/2`, jusqu'à |n − f| < 1e-5 ou 14'500 itérations.
- **Brut = rnd(b, false)**, donc à 0.01 **même avec « Arrondir »**. Le net affiché reste celui saisi ; les montants des conditions suivent « Arrondir ».
- [C] DeltaSub : solveur par sécante ou bissection sur `f`, même tolérance, même arrondi du brut. Résultats identiques à 0.01 près (§12).
- « Calculer le rabais » (`calcCondition`, msg10/12) existe mais n'est jamais proposé : **non repris**.

### 5.6 « Net - arrêté à », « Proposition », « Navigateur » [P]

**« Net - arrêté à »** (`calcPauschal`, `PauschalOfferDialog`, titre « Arrêté », champ « Net - arrêté à ») :
1. force « Saisie du brut » ;
2. s'il n'y a pas de ligne `P-`, en insère une **à la place de la dernière TVA** (donc juste avant elle ; en tête s'il n'y a pas de TVA) : Désignation « Arrondi », genre 10, valeur −0.0, REF = niveau précédent, M ✓ ;
3. calcule le forfait qui donne le net visé : tolérance 1e-4, pas de 1000, 100, 10, 1, 0.05, 0.01. [C] Solveur direct, même tolérance, résultat arrondi à 0.01.

**« Proposition »** (offre négociée) : recharge les bruts et nets de l'offre et, **sans ouvrages**, ses conditions. [C] Avec ouvrages aussi (Deltaproject garde alors les anciennes conditions négociées, ce qui est incohérent).

**« Navigateur »** (`openBrowser@1-572`) : choix d'un groupe `invoiceconditiongroup`. Le tableau est **entièrement remplacé** par ses `invoicecondition`, triées par `SORTORDER` :
- NIV = rang ;
- REF = `REFERENCESTEP` (vide → 0) ;
- Désignation = `NAMEFR` ;
- Conditions = `PRICE` ;
- genre selon `TYPECODE` :

| TYPECODE | Genre |
|---|---|
| 0 | 0 (P) |
| 1 | 2 (M) |
| 2 | 1 (%) |
| 3 | 3 (S%) si `ISPERCENT`, sinon 4 (S-) |
| 4 | 5 (R%) si `ISPERCENT`, sinon 6 (R-) |
| ≥ 5 | 7 (U%) si `ISPERCENT`, sinon 0 (P) |

[C] Proposer de remplacer une TVA 7.7 du modèle par 8.1.

### 5.7 Ce qui est enregistré à OK [P `getStructureList`]

- **Par ligne** (`bref.structure[].lignes[contactId][clé].offre|negociee`) : brut, tva, net, `montants` (montant de chaque niveau pour la ligne).
- **Global** (`entreprises[].bref.offre|negociee`) : conditions avec `montant` = total(c), brut = Σ Brut, net = Σ Net, tva = Σ TVA ; `bref.noteInterne`.
- Le mode de saisie est enregistré **pour tout le comparatif** (`bref.saisie`).

### 5.8 Indications de l'offre, Informations, Commentaire [P]

**« Indications de l'offre »** (bref, par entreprise), 9 champs **texte** sans contrôle :

| Libellé | Remarque |
|---|---|
| Total de l'offre brut | montant déclaré, non contrôlé → « Total de l'offre (non révisée) » à l'impression |
| Nombre de collaborateurs | |
| Genre d'offre | |
| Date de l'offre | calendrier seulement |
| Date de l'offre négociée | calendrier seulement |
| Genre de rémunération | |
| Commentaire | imprimé dans « Remarques » |
| Numéro de l'offre | |
| Commentaire interne | |

**« Informations »** (document entier) : Total du devis général · Devis révisé · Montant d'adjudication · Mutation · CFC Mutation · Adjudication · Ouvert · Réserve · Garantie · Niveau des prix · Date du document · Date de l'offre négociée · Texte libre (×4). Bouton DG : comme au §4.4 (DG validés, messages « Aucun devis général validé n'a été trouvé. » / « Il n'existe aucun devis général dont le statut est validé. »).

**« Commentaire »** : titre « Commentaire d'adjudication », un seul texte `commentaireBref`.

### 5.9 Tri, rang, référence, écart, moins-disant [P `award.Calc`, `DevisEntrepreneurShortSummaryTable`, `EnterpriseOrderDialog`, `ReferenceEntrepriceDialog`]

**Dialogue « Tri »**
- Texte « Déterminez le tri des entreprises ».
- Table `Société | M` (M = `afficher`) avec ▲▼ (→ `ordreManuel`).
- ☑ « Tri automatique » (`triAuto`).
- Contrôle des droits avant l'ouverture.
- **N'agit pas sur l'écran** (qui reste alphabétique), seulement sur les documents et le rang.

**Entreprises retenues** pour documents et rang : `afficher && prisEnCompte`.

**Clé de tri** : `net négocié ≠ 0 ? net négocié : net offre`.
- `triAuto` : tri croissant, à égalité l'arrivant devant ; ensuite les nets d'offre = 0 vont à la fin.
- Sinon : ordre `ordreManuel`.
- **Rang** = 1…n dans cet ordre (« Nº », « Votre Rang »).

**Référence** : si `referenceAuto`, la proposée ; sinon l'entreprise `reference`. Aucune : −1 (colonnes vides).

**Dialogue « Référence pour l'écart »**
- Texte « Définir l'entreprise de référence pour le calcul de l'écart dans le comparatif ».
- (•) « Même entreprise que celle proposée pour l'adjudication ».
- ( ) « Marquer une autre entreprise » → table `Entreprise | [Montants] | M`, une seule marquée.

**Écarts**
- **Écart %** = net ÷ net de référence × 100, **référence = 100** ; nets négociés si l'entreprise en a, sinon ceux de l'offre ; 0 si l'un vaut 0. Formats selon le tableau (§0-5).
- **Écart CHF** = rnd(net) − rnd(net de référence).

**Moins-disant, « Meilleure offre »** [P `DevisBiddingReportData.getBestOfferAmount@0-137`] : minimum, sur les entreprises retenues, du net négocié s'il existe, sinon du net d'offre s'il est ≠ 0, sinon du brut ; 0 s'il n'y a aucune entreprise.

[C] DeltaSub applique la référence choisie **partout** (Deltaproject `Calc.getReferenceTotal()` sans argument l'ignore).

### 5.10 PDF des offres reçues (lot 4)

Un dossier par entreprise, menu « Ajouter un fichier PDF… », « Ouvrir PDF… », « Partager le fichier PDF… », « Supprimer le fichier PDF… ».

---

## 6. Évaluation, négociation, proposition d'adjudication, commande, courriers

### 6.1 Évaluation (`PriceCompareRaitingDialog`, titre « Evaluation ») [P]

**Disposition**
- Liste « Entreprises » ; texte « Evaluation de l'offre de ^0 ».
- **« Principaux critères »** : `Critère | Coefficient | Evaluation | Points | Remarque`, boutons `+ ✎▾ − importer ▲ ▼`.
- **« Sous-critères »** : mêmes colonnes, `+ ✎▾ − ▲ ▼`.
- « Fermer ».

**Dialogues**
- « Nouveau critère » / « Modifier le critère » : Nom, Coefficient « [p.e. 30 %] ».
- Note (« Evaluation ») : nombre à 1 décimale, propositions 10 … 0, Remarque. OK si la note n'est pas vide. **Aucune borne imposée** [P] ; [C] avertir hors de [0 ; 10].

**Formules écran** [P `setCriteriaTable@60-477`]
- Sans sous-critère : `Points = note × coef`.
- Avec sous-critères : Evaluation **vide**, `Points = Σ(note_s × coef_s) × coef × 0,01`. La note stockée du critère principal = Σ des notes des sous-critères (`calcRating`).
- Ligne « Total » : `Σ coef | "" | Σ points`.

**Formules d'impression** [P `DevisAwardRequestCriteriaTable.calcSubpoints@127-151`] : même calcul, avec **troncature entière** à chaque produit. Entreprises retenues triées **meilleurs points d'abord**.

**Import des modèles** (bouton importer)
- Vide la liste, puis crée un critère principal par `bidcriteriongroup` : nom FR, coef = `QUANTIFIER`.
- Aucun modèle : « Vous devez d'abord définir les valeurs par défaut dans la zone administrateur. ».
- [C] Créer aussi les sous-critères `bidcriterion` avec leur `QUANTIFIER` : Deltaproject les crée sans les ajouter (@169-251).

**Suppression** : « Voulez-vous vraiment supprimer cette inscription ? » / « … pour toutes les entreprises? ».

**Administrateur** (Réglages ▸ Administrateur ▸ « Comparaison des offres », `VIEWS['config']` l. 1931)
- Groupes et critères : Nom (4 langues), Coefficient, colonne « % ».
- Règle du manuel p.11 : « l'évaluation de tous les critères d'un groupe ou de tous les groupes doit toujours être 100% » → [C] avertissement si Σ ≠ 100.

**Critères par défaut** d'un nouveau document [P `InitDocument.initOfferCriteriaList`] : « Prix de l'offre » (coquille « ofre » corrigée [C]), « Expérience », « Calendrier », « Qualité de l'offre », tous au coefficient 0 [D].

### 6.2 Entreprise proposée (+) [P]

- Choix exclusif : personnes ▾ du bref, personne ▾ du comparatif détaillé, import SIA451.
- Elle détermine :
  - la référence par défaut ;
  - `projectContractor` des documents ;
  - le montant d'adjudication ;
  - l'exclusion des courriers de refus ;
  - la commande et le courrier d'adjudication ;
  - le contrat créé (C1 → D) ;
  - le transfert vers le contrôle des coûts ;
  - `projecttenderer.ISACCEPTED` à la fermeture.
- **Montant d'adjudication** = net négocié de la proposée si elle a des conditions négociées, sinon son net d'offre, arrondi selon « Arrondir » ; sans condition, net = brut [P `DevisRejectionLetterReportData@525-642`].

### 6.3 Nœuds de documents du comparatif (bref et détaillé) [P]

| Nœud | Table | Lignes / destinataires |
|---|---|---|
| BREF ▸ Documents | `Type de document \| Document disponible \| PDF disponible \| Note d'expédition \| Remarque` | Comparatif · Proposition d'adjudication · Commande · Courrier d'adjudication (proposée) |
| COMPARATIF ▸ Documents | idem | Proposition d'adjudication · Commande · Courrier d'adjudication · Comparatif · Descriptif avec comparatif des prix |
| … ▸ Négociation | `Entité \| Responsable \| Situation de l'offre \| Pris en compte dans la comparaison des prix \| Document disponible \| PDF disponible \| Note d'expédition \| Remarque` | une ligne par entreprise `prisEnCompte` ; « Utiliser ce document pour tous » |
| … ▸ Courriers de refus | idem | entreprises `contactId` > 0, `prisEnCompte` **et non proposées** ; « Utiliser ce document pour tous » |
| COMPARATIF ▸ Descriptif | `Entité \| Responsable \| Document SIA451 \| Document disponible \| PDF disponible \| Note d'expédition \| Remarque` | une ligne par entreprise prise en compte (lot 3-4) |

- Menus communs : « Document » · « Fichier PDF attribué » · « Note d'expédition et remarque » · « Exporter le PDF » · « Partager le fichier PDF » · « Effacer le document » · « Effacer le PDF ».
- Message du détaillé en mode filtre : « Attention, vous travaillez en mode filtre. ».

### 6.4 Notes d'expédition

Dialogue « Note d'expédition » : « Note d'expédition » (suggestions « Par courrier » / « Par courriel ») + « Remarque », stockés selon le §2.4 / §2.10.

---

## 7. Descriptif libre (lot 3)

### 7.1 Principe [C]

- Un descriptif par étape (A, B, C, C1, D, I, K), composé uniquement de **chapitres de réserve**.
- La zone catalogue est remplacée par un panneau « Perso » : descriptifs du bureau (même affaire ou toutes), avec « Importer un descriptif », « Importer un paragraphe », « Importer le chapitre des conditions générales <10R> » (§7.15).

### 7.2 Numérotation et règles [P]

**Niveaux**
- Chapitre : 3 chiffres.
- Article principal `m` : 3 chiffres (paragraphe X00, sous-paragraphe XY0, article XYZ).
- Sous-article `u` : 3 chiffres ou vide (groupe A00, sous-groupe AB0, article ABC).
- Variable `v` : 01-99.

Affichage « C | P | S | V ».

**Article de réserve** [P `Position.isReservePos@0-92`, vérifié] : `c` contient '9', **ou** `m[1]` ou `m[2]` = '9', **ou** `u[0]` ou `u[1]` = '9'.

**Texte seul** (double largeur, sans quantité) [P `Position.isDoubleText@0-133`] : l'un des cas suivants :
- `u` non vide et (`c` ou `m` contient '0') ;
- `u[2]` = '0' et aucune variable ;
- `m` contient '0' et il existe des variables ;
- `m` sans '0' et `u` se termine par '0'.

**Quantités interdites** [P MAN-FR p.62, `RChapterDialog|msg1a/b`] :
- chapitre ou article principal contenant un 0 ;
- niveaux chapitre, paragraphe et sous-paragraphe ;
- sous-article terminé par 0.

**Texte**
- Lignes fixes de **30 caractères**, **99 lignes au plus** : « Il n'y a pas plus de 99 lignes autorisées. ».
- Dans un article de réserve, tout le texte est modifiable. Les suites de points sont mises en évidence.

**Mot-clé**
- ≤ 30 caractères, **obligatoire** : « Vous devez définir un mot-clé. ».
- ☐ « Utiliser la première ligne du texte comme mot-clé ».
- Les variables n'ont pas de mot-clé.

**Point d'insertion du texte de l'entrepreneur** : seulement dans une variable ou un article de réserve. Menu « Définir / Supprimer le point d'insertion ». Marque « * » à l'impression.

**Limites**
- 99 lignes de QP par article : « Il n'y a pas plus de 99 subdivisions autorisés. ».
- 99 documents par article : « Il n'y a pas plus de 99 documents autorisés. ».
- MAN-FR p.60 dit 100 : la valeur du code prime.

### 7.3 « Définir le chapitre de réserve » (`RChapterDialog`) [P `checkGuards@1-86`, `jOkButtonActionPerformed@6-430`]

**Champs**
- Aide : « Le numéro du chapitre de réserve doit contenir un 9 ».
- « Nº CAN » (chiffres).
- « Texte 1ère ligne » / « Texte 2ème ligne » (≤ 30 chacun).
- « Version » : 4 chiffres, « p.ex. <année> ».

**OK actif si** : texte 1 non vide, n° de 3 caractères contenant '9', version de 4 caractères.

**Refus, dans l'ordre**

| Condition | Message |
|---|---|
| Se termine par « 00 » | « Un chapitre de réserve ne peut pas être un groupe ou un sous-groupe de chapitres. » |
| Commence par « 0 » | « Les chapitres de réserve ne peuvent pas être créer dans les groupes de chapitres 000. » |
| Commence par « 8 » | « … dans les groupes de chapitres 000 ou 800. » |
| Vaut « 900 » | « Le numéro doit être supérieur à 900. » |
| Inférieur à 100 | « Le numéro doit être supérieur à 100. » |
| Contient un 0 | confirmation « Il est impossible d'insérer un article de quantité dans un chapitre dont son numéro contient un 0. Êtes-vous sûr de vouloir créer un tel chapitre ? » |
| Déjà présent | « Ce chapitre existe déjà. » |

**En modification**, si le n° gagne ou perd un 0 : « Le numéro du nouveau chapitre doit contenir au moins un 0 » / « … ne peut pas contenir de 0 ». Les clés `msg120` / `msg121` manquent dans Strings.db pour cette classe : texte repris des autres classes [P].

**Création** : chapitre + article initial `m` = "000". Chapitres triés par numéro croissant.

**Menus** : « Modifier le chapitre de réserve » (texte, version) et « Supprimer le chapitre » (« Souhaitez-vous supprimer le chapitre ^0 ? Attention, irréversible. »).

### 7.4 « Article de réserve » (`ResPosDialog`) [P `setMainPositionsInTable@56-227`, `setMainMenu2/4`, `setUMenu2/4`]

**Disposition**
- En-tête « Article de réserve pour ^0 ».
- Table `C | P | S | V | Text | U` (les nouvelles lignes en rouge).
- Liste « Catégorie » : « Articles principaux » / « Groupe de sous-articles » / « Sous-article » / « Variable ».
- Liste des **numéros libres** proposés.
- `−`▾ : « Supprimer l'article sélectionné » / « Supprimer tous les articles ».

**Propositions pour un chapitre de réserve**
- Chapitre avec 0 : paragraphes X00 et sous-paragraphes X10…X90.
- Chapitre sans 0 : en plus, les articles principaux XY1…XY9.
- Sous-articles `P.A00 / P.AB0 / P.ABC`, sauf « 000 ».

**Validation**
- **OK désactivé tant qu'une unité vaut « ?? »** (unité obligatoire pour un article de quantité).
- Message : « L'article précédent contient une attribution de remarque préliminaire. ».

**Le texte** se saisit ensuite dans « Editer l'article ».

**Article de répétition « dito »** : désactivé dans les chapitres de réserve [P @300-312] ; remplacé par « Dupliquer l'article » [C], qui propose le numéro libre suivant.

### 7.5 Fenêtre du descriptif (`DescFrame`) [P]

**Barre** : `+`▾ · import ▾ · crayon ▾ · `−`▾ · tableau ▾ · transférer ▾ · entonnoir ▾ · pinceau ▾ · documents ▾ · personnes ▾ (C1 seulement) · plein écran.

**Colonnes** (30, `DevisFormColumns`) :

| Index | Libellé | Index | Libellé |
|---|---|---|---|
| 0 | * | 15 | GV |
| 1 | S (« R » en rouge si réserve) | 16 | Var |
| 2 | C | 17 | Cal |
| 3 | P | 18 | RPA |
| 4 | S | 19 | U |
| 5 | V | 20 | G (GQ) |
| 6 | Texte | 21 | Métré |
| 7 | D (« ● » si document) | 22 | Quantité |
| 8 | RNF | 23 | Numéro courant |
| 9 | Locaux | 24 | Entreprise |
| 10 | Affectations | 25 | P (GP) |
| 11 | OUV | 26 | CP |
| 12 | LOC | 27 | Prix |
| 13 | CFE | 28 | Montant |
| 14 | TE | 29 | TVA |

- Les colonnes 8-16 ne s'affichent que si au moins une QP porte ce code ; leur ordre suit `ordreColonnes`.
- Couleurs :
  - fonds alternés (243) / (217) ;
  - articles de réserve en rouge (202,45,45) ;
  - subdivisions et métré en bleu (42,78,129) ;
  - proposée en vert (0,155,0) ;
  - fond de la colonne Quantité : gris 217 si métré, 243 si quantité simple.

**Menus** (entrées CAN retirées)

| Menu | Entrées |
|---|---|
| `+` | « Article de réserve » · « Créer le chapitre de réserve » · « Dupliquer l'article » [C] |
| Tableau | (•) « Standard » / « Texte abrégé » / « Mots-clés » — ☐ « Uniquement les articles avec quantité » · ☐ « Afficher les graphiques » — « Tri du descriptif » · « Ordre des subdivisions » · « Aller à l'article » ▸ |
| Crayon | « Editer l'article » · « Editer les quantités » · « Editer le métré » — « Editer les prix » · [B] « Prix identique » · [C1] « Prix des entreprises » · « Editer les conditions » — [C1] « Evaluation » · « Informations de l'entreprise » — « Configurer les subdivisions » · « Configurer les variantes » · « Editer le CFC » · « Modifier le chapitre de réserve » — « Insérer une subdivision » · « Insérer les subdivisions pour tous les articles » · « Modifier les subdivisions » · « Attribuer un remarque préliminaire » |
| `−` | « Supprimer l'article » · « Supprimer le chapitre » · « Supprimer les quantités » · « Supprimer le métré » · « Supprimer les prix » · « Supprimer les subdivisions » · « Supprimer les codes de calcul » · « Supprimer les remarques concernant le prix » · « Supprimer les numéros courants » — « Supprimer le descriptif » |
| Pinceau | [C1] « Référence pour l'écart » (seulement si plus d'une entreprise) · [C1] « Affichage et tri » · [C1] « Commentaire » · « Titre et date du document » · [C1] « Informations de l'offre » · [D] « Indications de l'offre » · [B, C] « Informations d'appel d'offres » · [D, I] « Informations du contrat » · « Mandataire spécialisé » · [B, C] « Lieu de dépôt des offres » · [≠ C1] « Entrepreneur » — ☐ « Arrondir » |
| Documents | [C1] « Comparatif », etc. (nœuds Documents) · « Page de garde » · « Récapitulatif » · « Récapitulatif par chapitres / par subdivisions / par paragraphes » · « Descriptif » · [B, C, D] « Composition du cahier » · « Cahier » — « Export SIA451 » (lot 4) · [C1, C, D] « Transférer vers le contrôle des coûts » — « Copier dans le presse-papier » · « Export CSV » |

- Menu `−` : utiliser le **sens correct** des libellés « Supprimer les codes de calcul » et « Supprimer les remarques concernant le prix » (inversés dans Strings.db [P]).
- Confirmations de suppression [P `npk.Delete|msg*`] : « Souhaitez-vous supprimer le chapitre ^0 ? Attention, irréversible. » et variantes (paragraphe, sous-paragraphe, article principal, groupe, sous-groupe, article) ; « Souhaitez-vous supprimer tous les prix ? Attention, irréversible. » ; « … toutes les quantités ? … » ; « … le métré … » ; « … ce descriptif … ».
- Protections : « L'article ^0 est une remarque préliminaire attribuée au ^1. », « Supprimez d'abord la subdivision au ^0. », « Il y a des quantités partielles avec différents genres de quantité ou de prix. ».

**Clic droit** : « Editer l'article » · « Editer le métré » — « Supprimer l'article » — « Article de réserve » · « Créer le chapitre de réserve » — « Attribuer un remarque préliminaire » ; sur un chapitre : « Modifier le chapitre de réserve », « Supprimer le chapitre ».

**Double-clic** : « Editer l'article » ; Maj + double-clic : métré.

### 7.6 « Editer l'article » (`PositionDialog`) [P]

**Catégories** : « Quantité et prix » · « Description » · « Documents joints » · « Images ».

**Texte** : éditeur à chasse fixe de 30 colonnes, roue ▾ « Définir / Supprimer le point d'insertion ».

**Tableau « Quantité et prix »** : `RNF | Locaux | Affectations | OUV | LOC | CFE | TE | GV | Var | Cal | RPA | U | GQ | M | Quantité | Numéro courant | GP | CP | Prix | Montant` (+ TVA).

**Menus du tableau**
- `+` : « Nouvelle ligne » · « Dupliquer la ligne » · « Insérer une nouvelle subdivision » · « Insérer la combinaison des subdivisions » — « Utiliser les subdivisions du premier article / du dernier article » · « Utiliser toutes les subdivisons précédentes » · « Utiliser toutes les subdivisions de ce chapitre » — « Utiliser les quantités de l'article précédente ».
- ✎ : « Modifier la subdivision » · « Métré » · [C1] « Prix de l'entreprise ».
- `−` : « Supprimer la ligne » · « Supprimer toutes les lignes » · « Supprimer la variante » · « Supprimer la référence article CRB » · « Supprimer le code de calcul ».
- Roue : « Remarque concernant le prix » · « Modifier le code de calcul » · « Numéro courant » · « Taux de TVA ».

**Menu GQ** (clic en colonne GQ)
- Ligne **avec variante** : primaire → J, K, M ; éventuelle → Q, R, U.
- Ligne **sans variante** : A, B, D, W, Q, R, U.
- Choisir une variante (colonnes GV / Var) **force** J (primaire) ou Q (éventuelle) [P `PositionDialog$90@50-92`].

**Menu GP** : selon l'étape (§2.2). Menu d'unité : article de réserve uniquement.

**Autres cases**
- ☐ « Prix identique pour tous les ouvrages » : GP, prix et montant de la 1ʳᵉ ligne recopiés sur les autres.
- ☐ « Forcer la largeur de texte par défaut pour cet article dans l'impression ».

**Validations à OK** [P `jOkButtonActionPerformed`]
- Deux lignes égales (tous codes égaux, sans casse sauf le code de calcul) : « Double subdivision ^0. »
- |quantité| > 9 999 999 999 : « Quantité trop élevée. » ; |prix| > 9 999 999 999 : « Prix trop élevé. »
- **Étape B** : prix ≠ 0 avec GP ≠ F → question « Vous devriez utiliser le "prix indicatif" comme type de prix. Voulez-vous effectuer ce changement ? ».
- Mot-clé absent : message du §7.2.

**Documents et images** (`DocNameDialog`)
- Champs : « Nom du document », « Nom du fichier », ☐ « Appartient à l'article (pas à la variable) ».
- Aide : « Taille d'image recommandée env. 6 cm x 4 cm, résolution 300 dpi, format: png, jpg ».
- Messages : « Ce nom est déjà utilisé. », « Le caractère ^0 ne doit pas être utilisé dans le nom du fichier. », « Un document avec ce nom de fichier est déjà utilisé dans l'article ^0. ».
- Stockage : serveur de fichiers (lot 4) ; d'ici là, images PNG/JPG ≤ 500 ko en base64 dans le JSON [C].

### 7.7 Calculs de ligne [P `Div.calc@0-507`, `util.Formatter.round`, `DevisFormPosition`]

```
si GQ ∈ {W,Q,R,U}          : montant = 0 (et tous les prixEntreprises[].montant = 0)
sinon si GQ ∈ {A,B,D,J,K,M} : montant = GP ∈ {A,F,R} ? rnd(quantité × prix, arrondi5ct) : 0
sinon                       : 0
```

**Affichage**
- W : quantité « par », montant vide.
- Q / R / U : montant indicatif `(q×p)` **entre parenthèses**, non compté.
- Quantités : arrondies à 3 décimales (`#,###,##0.000`, zéros de fin supprimés).

**Brut** (base des conditions) : Σ des montants des QP qui remplissent toutes ces conditions [P `DevisCalc.calcOgBrutto@109-271`, `NpkConditions.getBruttoValue@0-497`] :
- GQ ∈ {A,B,D,J,K,M} ;
- GP ∉ {I,N} ;
- sans variante, ou variante **primaire** ;
- dans le filtre actif.

Au comparatif : montant = `rnd(prix de l'entreprise × q)`.

**Totaux imprimés** : par article, sous-paragraphe, paragraphe, chapitre, chapitre × subdivision, paragraphe × subdivision, total de page, « Total intermédiaire et report », « Total chapitre », « Total général ».

**« Additionner les ouvrages »** : seulement si les QP ont les mêmes GQ, GP et prix [D].

**Saisie rapide « Quantités »** (`QuantityInputDialog`)
- Navigation |< < > >|, « Genre de quantité », « Quantité », « Métré », ☐ « Appliquer un facteur » / « Facteur », « Saisir », « Total ».
- `quantité = saisie × facteur` ; « per » ou « par » → 0.
- Messages : « La quantité "par" ne doit contenir aucun métré », « Vous avez atteint la fin du document. », « La valeur est trop élevée. ».

### 7.8 Métré (`MeasureDialog`, titre « Avant-métré » en B, « Métré » ailleurs) [P `round()@40-340`, `calcReserves`, `calc()@23-356`, `checkEquation`]

**Colonnes** : `* | Nº | Date | Commentaire | Formule | Quantité | Sous-total | S-T` (case).

**Boutons** :
- `+` « Insérer une nouvelle ligne » ;
- `−`▾ « Supprimer la ligne de calcul » / « Supprimer toutes les lignes de calcul » ;
- « Res » « Réserve de métré (facteur) » ;
- « r » « Arrondir au prochain nombre entier » ;
- « r5 » « Arrondir au prochain multiple de cinq » ;
- roue ▾ : « Réserve de métré », « Copier le calcul de quantité », « Remplacer le calcul de quantité par celui du presse-papier » (question « Vous avez déjà inséré un calcul de quantité. Voulez-vous le remplacer ou le compléter par le contenu du presse-papier? ») ;
- volet des modèles : « Enregistrer le métré », « Navigateur des métrés » (`Nom | U | Quantité`) ;
- libellé « Total des quantités » ; en I, « Quantité du contrat ».

**Formule**
- `'` et `’` retirés.
- `.5` devient `0.5` après un opérateur.
- `[texte]` = commentaire, retiré avant le calcul.
- Opérateurs `+ - * / ^`, parenthèses, fonctions `sin cos tan cotan sqrt ceil floor fac abs`, `pi`. Trigonométrie **en radians**.
- [C] Évaluateur JavaScript maison, sans `eval`, qui reproduit mXparser sur ce sous-ensemble.

**Algorithme**, S = cumul, lignes dans l'ordre :

```
standard : q = r3(eval(formule))                      ; S += q        r3(x) = round(x·1000)/1000
réserve  : q = r3(r3(eval(facteur)) × S)              ; S += q
r        : n = floor(S) + 1 ; q = r3(n − S)           ; S += q        (+1 même si S est entier)
r5       : n = floor(S) + 1 ; tant que n % 5 ≠ 0 : n++ ; q = r3(n − S) ; S += q   (+5 si S est déjà multiple de 5)
total    = r3(Σ q)
Sous-total : sur une ligne S-T, r3(Σ q depuis la ligne S-T précédente), puis l'accumulateur repart à 0
```

**Contrôles**
- Numéro vide, « 0 » ou « 00 » : « Le numéro de la ligne ^0 est manquant ou est à zéro. » (texte de `msg8` ; la clé appelée `msg0` est absente).
- Numéros non croissants : « Le tri des numéros doit être en ordre ascendant. »
- Formule incorrecte : « L'équation de la ligne ^0 est incomplète, contient des erreurs ou ne peut pas être calculée. »
- **Commentaire + formule > 90** : « La formule et le commentaire ne peuvent pas dépasser 90 caractères. » (seule limite de longueur, §0-3).
- Deux opérateurs consécutifs : « Deux opérateurs se suivent dans le calcul. »
- Plus de 99 lignes : « Il n'y a pas plus de 99 lignes autorisées. » ; |total| > 999 999 999 : « Valeur trop élevée. »
- Coller alors que des réserves ou arrondis existent : « Vous devez préalablement effacer les réserves et les arrondis. »
- Métré seulement si GQ = A [P `PositionDialog|msg22`].

**Préférence** « Insérer automatiquement une ligne de réserve de métré. » (lot 4).

**Colonne Nº** = étape de métré (filtre « Numéros du métré de / à », « Date du métré de / à ») [D].

### 7.9 Subdivisions [P `DescDivisionDialog`, `DivisionEditDialog`, `DivInputDialog`, `RedefDivisionDialog`, `RemoveSubdivDialog`, `DivisionOrderDialog`]

**« Subdivision et tri »** : listes « Combinaison des subdivisions », « Ouvrage », « Type d'équipement », « Subdivision par affectations », « Subdivision par locaux », « Coûts par éléments », « Nature des coûts (CFC) ».
- Boutons `+ ✎ − ⇈↑↓⇊` ; l'ordre de la liste est l'ordre de tri.
- ☐ « Insérer automatiquement les subdivisions ».

**Sources des propositions**
- Ouvrages et localisations : `subproject`.
- Locaux : `projectroom`.
- Affectations : `projectusezone` [D].
- CFC : plan CFC de l'affaire (`projectcatalogpos` de type 0).
- CFE : catalogue eCCC de l'affaire (type 10), s'il existe.
- Code > 6 caractères : « Extension du Code », aide « Vous devez définir votre propre code car le réel contient trop de caractères pour l'échange de données. ». Le code long va dans `eCode` (≤ 16).

**Longueurs** : OUV et LOC 6 ; textes 2 × 30 ; eCode 16 ; « Le code et le code étendu ne peuvent pas être identiques. ».

**Messages** : « Cette subdivision existe déjà. », « Souhaitez-vous vraiment supprimer cette subdivision ? », « Vous n'avez pas défini la combinaison des subdivisions pour la saisie des articles. Souhaitez-vous vraiment continuer ? », « Certaines combinaisons des subdivisions sont dupliquées. ».

**Insertion à l'ajout d'un article** (si l'insertion automatique est cochée) : une QP par combinaison, restreinte au filtre si « Appliquer le filtre » est actif. Unité « gl » avec une seule combinaison → quantité 1.

**« Insérer les subdivisions pour tous les articles »** : pour chaque article de quantité, une seule ligne sans code reçoit les codes ; sinon, ajout d'une ligne si elle n'existe pas [P @587-791 ; D pour le détail].

**« Modifier les subdivisions »** (`Code | Nouveau Code | Texte`) : si deux lignes deviennent identiques, elles **fusionnent** : quantités additionnées, métrés concaténés, prix de la 2ᵉ ligne si la 1ʳᵉ vaut 0 [P `Div.sumQuantity@0-51`].

**« Effacer les subdivisions »**
- Portée : « Pour toutes les subdivisions » / « Pour une subdivision ».
- Type : les 9 dimensions + « Code de calcul ».
- « Effacer toutes les subdivisions » / « … sans quantité ».
- Remplacement : GQ W / Q / U / « Effacer la quantité ».
- Messages : « L'article ^0 n'a pas de quantité, effacement impossible. », « Ces modifications sont irréversibles. Voulez-vous continuer ? ».

**« Ordre des subdivisions dans le descriptif »** : liste réordonnable de 11 dimensions.

### 7.10 Variantes (`VarianteDefinitionDialog`, « Définir les variantes ») [P]

- Tables « Groupes de variantes » et « Variantes » (`Code | Texte | M`) ; codes ≤ 3, textes 2 × 30.
- La **première variante** d'un groupe devient primaire ; une seule primaire par groupe [D].
- Messages : « Cette variante existe déjà. », « Voulez-vous vraiment supprimer cette variante ? ».
- Effets : GQ forcé J / Q ; les variantes éventuelles sont exclues du brut et imprimées entre parenthèses.

### 7.11 Numéro courant, TVA de ligne, code de calcul, remarques préliminaires [P]

**Numéro courant** (`BarcodeDialog`)
- 7 chiffres ou vide. Clé de contrôle : `s = d1 + 3d2 + d3 + 3d4 + d5 + 3d6` ; `d7 = (10 − s mod 10) mod 10`.
- « 0000000 » est refusé ; le numéro doit être unique dans le descriptif.
- Messages : « Le numéro courant n'est pas conforme à IfA. », « Le numéro courant doit être unique dans le descriptif. ».

**Taux de TVA** (`DevisVatRateDialog`) : (•) « Standard » / « Taux » (1 décimale). Stocké et affiché ; aucun effet trouvé sur les totaux devis18 [D].

**Code de calcul** : ≤ 6 caractères.

**RPA** (« Remarque concernant le prix ») : référence à un article du paragraphe 000 (liste `Chapitre | Article | Texte | M`).

**« Attribuer un remarque préliminaire »** : jeu de codes `DivRemark` (« Référence articles valides CRB » : `RNF | OUV | LOC | CFE | TE | GV | Var | Local | Affectation`).

### 7.12 Tri, filtre, CFC, titre, sauts de page [P]

- **« Tri du descriptif »** : (•) Chapitre · Chapitre (CFC) · Ouvrage · Plan comptable (CFC) · Coûts par éléments · Subdivision par locaux · Subdivision par affectations · Type d'équipement. Le stockage reste trié par chapitre ; le tri sert à l'affichage et à l'impression.
- **« Editer le CFC »** (« Position CFC pour chapitre ^0 », Numéro + 2 lignes de texte) : préalable au tri « Chapitre (CFC) ». Message « Cette structure existe déjà dans le chapitre ^0. ».
- **« Filtre »** : Chapitre, CFC, Ouvrage et localisation, CFE, TE, Groupes de variantes / Variantes, Locaux, Affectations, Code de calcul ; au métré, « Numéro de métré » de / à et « Date » de / à.
  - Libellé d'état : « Filtré ».
  - Entonnoir ▾ : « Paramètres du filtre » · ☐ « Appliquer les paramètres du filtre » · ☐ « Appliquer le filtre » · « Désactiver le filtre ».
- **Saut de page** : clic sur un n° d'article dans l'aperçu (liste `sautsPage` de l'étape).

### 7.13 Moteur `svCondNpk` : conditions du descriptif et du comparatif détaillé [P `NpkConditions.initConitionList@0-76`, `refBetrag3@0-247`, `calc3@0-78`, `DevisCalc.calcOgBrutto`, `award.Calc.calcNettoTotal` ; vérifié par `npk_ref.py` sur MAN-FR p.68 et p.73]

```
QP comptées d (§7.7), valeur v_d (au comparatif : montant de l'entreprise)
pour chaque d :
   contrib[0] = v_d
   pour chaque c (ordre des niveaux) :
      concerne = c.m && codes de c (cfc, ouv, lg…) vides ou égaux à ceux de d
      si non concerne : contrib[c.niv] = 0 ; continuer
      base = Σ contrib[k] pour k ≤ c.ref                    // cumul de d au niveau Réf. (PAS d'arrondi intermédiaire)
      m = c.genre∈FORFAIT ? c.valeur × v_d / (Σ v des QP concernées par c) : base × c.valeur / 100
      contrib[c.niv] = m ; total(c) += m
S-T(c)  = arrondi(brut) + Σ_{c' ≤ c} arrondi(total(c'))     // colonne « S-T » (« A reporter »)
Net     = arrondi(brut) + Σ arrondi(total(c)) pour c.m       // arrondi = rnd(x, arrondi5ct)
TVA     = Σ total(c) pour genre 2
```

- **Offre négociée** : même brut, second jeu de conditions. Sans conditions négociées, les valeurs négociées valent 0.
- Conditions liées à des subdivisions : **CFC et ouvrages seulement** en IfA 18 (MAN-FR p.68). Les colonnes affichées sont celles utilisées par le descriptif.

**Dialogue « Conditions »** (`conditions.ConditionDialog`)
- En-tête « Conditions <étape> » + « Brut ».
- Colonnes `ID | Niveau | Réf. | Texte | Genre | Jours | [Chap | RNF | OUV | LOC …] | Condition | Montant | S-T | M S-T | M`.
- `+`▾ « Nouvelle condition » / « Navigateur » / « Net - arrêté à » ; roue ▾ « Copier les conditions » / « Coller les conditions » / « Transférer les conditions dans l'offre négociée » (offre seulement).
- « Net », « Fermer » / « Calculer ».
- Au comparatif : liste « Entreprises » à gauche, deux tableaux « Conditions offre » (→ « Net offre ») et « Conditions offre négociée » (→ « Net offre négociée »), menu personne ▾ « Evaluation », « Informations de l'offre ».

**Contrôles** [P `checkNumber`, `checkTextLength`, `checkVat`] :
- « Deux ID-conditions ne peuvent pas être identiques. »
- « Le tri des ID-conditions doit être en ordre ascendant. »
- « L'ID doit être numérique. »
- Texte > 30 caractères : message `msg50` (limite de 30).
- « Le taux de TVA ^0 ne peut être utilisé qu'une seule fois » (même taux, même RNF, même OUV).
- « Les lignes de TVA doivent se suivre directement. »
- « La TVA est toujours prise en considération. »
- « Il y a des montants sans TVA: ^0 »
- « Toutes les lignes de TVA doivent toujours se référer à la dernière ligne précédant la TVA »
- « Le niveau de référence de la condition ^0 est incorrect. »
- « Vous n'avez choisi aucune entreprise pour l'adjudication. »

### 7.14 Contrôles avant documents, transferts et export (`npk.CheckDesc`, adapté) [P + C]

- « Position de réserve ^0 sans texte. »
- « Vous devez définir un mot-clé. »
- « L'article ^0 n'est pas pas encore terminée. Vous devez l'effacer ou terminer. » (coquille « pas pas » corrigée [C])
- **Retirés** [C] : 000.200 / 090 (règles CAN) ; « Les mots-clés Divers et Spécifications doivent être remplacés… » (mots-clés CAN).
- SIA451 (lot 4) :
  - « Vous n'avez défini aucun maître d'ouvrage. » (intervenant de rôle 8 avec nom) ;
  - « Vous n'avez défini aucun lot d'adjudication. » (CFC, puis désignation) ;
  - « Vous n'avez défini aucun numéro de version. » (> 0) ;
  - « Vous n'avez pas défini la subdivision ^0. » ;
  - « La quantité de l'article ^0 doit avoir le genre de quantité A. » (métré).

### 7.15 Import interne et catalogue « Perso » [P `DescFrame.insertChapterDesc`, `insertChapterSection`, `DevisPreconditionDialog`, `ImportDevisCostDialog`]

- **« Importer un descriptif »** : navigateur des soumissions du bureau (`CFC | Utilisateur | Texte`, filtre) → type de document source (« Types de documents utilisés dans le descriptif ») → « Souhaitez-vous filtrer l'import ? ».
  - Chapitre déjà présent : « Le chapitre ^0 est déjà utilisé. ».
  - Subdivisions et pièces fusionnées.
  - Fin : « L'import est terminé. ».
- **« Importer un paragraphe »** : « Choix du paragraphe » → « Paragraphes pour le chapitre ^0 » ; conflit : « Le chapitre ^0 est déjà utilisé avec la version ^1. ».
- **« Importer le chapitre des conditions générales <10R> »** (« Chapitres avec des conditions générales », colonnes `Numéro | Texte | Statut | N° de version | Utilisateur | Note | Numéro de l'ordre | Version`) : chapitres de réserve **contenant un 0** [D] des soumissions de la même affaire.
- **Catalogue « Perso »** : « Choix du type de document » (Document type d'appel d'offres, Appel d'offres, Offre, Contrat, Métré, Estimatif), puis double-clic pour transférer un article. Option/Alt + double-clic : sans ouvrir la fenêtre de l'article.
- **« Navigateur des articles »** (ⓘ de l'article) : « Cet article a déjà été utilisé comme suit. », colonnes `N° d'affaire | Désignation | Statut | Stade actuel | Adjudication | Quantité | Prix`, dans toutes les soumissions du bureau (même n° de chapitre, `m` et `u`, ou même mot-clé [C]).

---

## 8. Comparatif détaillé, contrat, métré, descriptif type (lot 3)

### 8.1 Création B → C1 : voir §3.7.

### 8.2 Affichage C1 [P `DevisFormPosition.writeOneChapter@6599-6948`, `NpkFormCellRenderer`]

- Sous chaque QP, une ligne par entreprise, dans l'ordre d'ajout : `Entreprise | P | Prix | Montant`.
- Montant :
  - W : vide ;
  - Q / R / U : `(x)` ;
  - J / K / M : calculé ;
  - sinon : `montant`.
- Nom de l'entreprise **proposée en vert**, les autres en noir.
- Menu personne ▾ : une case par entreprise, exclusive.

### 8.3 Dialogue « Prix » (`PriceInputDialog`) [P `initDialog@492-725`, `calcTotal@0-177`, `jInsertButtonActionPerformed@523-854`, `calcBetweenTotal@0-995`]

**Disposition**
- À gauche : « Entreprise » (avec « (+) »).
- « Article » `<chap>  <art>  | <QP>` + texte court.
- `Début · Précédent · Suivant · Fin`.
- « Quantité » + unité (non modifiable si un calcul est lié : « Vous ne pouvez pas modifier la quantité car il y a un calcul lié. »).
- « Genre de prix » : A / I / N ; I et N rendent le prix non éditable. [C] Ne pas écrire « 0 » dans la quantité : défaut d'affichage @43-50.
- « Prix ».
- ☐ « Prix identique pour les ouvrages ».
- « Facteur » + ☐ « Appliquer un facteur » : **désactivés en C1**.
- « Total » = prix × facteur × quantité.
- « Total » + ☐ « Calculer le total cumulé ».
- Boutons : « Chercher » (Chapitre, Article) · ⓘ · « Fermer » · « Conditions » · « Insérer ».

**Garde** : « Insérer » exige une entreprise sélectionnée et un prix non vide.

**Insérer**
1. `prixEntreprises[e].gp` = genre ; `prix` = saisi si A ou F, sinon 0 ; `montant` = calcul du §7.7 avec le GQ de la QP.
2. Toutes les QP de l'article si « Prix identique ».
3. |prix × facteur| > 999 999 999 : « Valeur trop élevée. ».
4. Puis QP suivante (une position « prix identique » se franchit d'un pas) et total cumulé.
5. Fin de liste : « Vous avez atteint la fin du document. ».

**Total cumulé** : Σ des montants de l'entreprise pour les QP de GP A ou F, du début jusqu'à l'article courant compris.

### 8.4 « Prix des entreprises » (`DevisPriceDialog`, titre « Prix ») [P `DescFrame.editPrice@0-689`, `CalcEntrepreneurDiv.setRenderer`, `PriceDialogCellRenderer@410-489`]

- Colonnes `Entreprises | GP | Prix | Montant` pour la QP sélectionnée ; GP A / I / N / F (C, C1).
- Prix : chiffres, « . » et « - » ; désactivé si I ou N.
- Couleurs :
  - **prix minimum** (≠ 0) en vert (0,155,0) ;
  - **maximum** en rouge ;
  - **proposée** en bleu ;
  - [C] les prix à 0 sont ignorés pour le minimum (sinon plus personne n'est vert).
- OK : liste remplacée, puis recalcul du brut de chaque entreprise (§8.5).

### 8.5 Totaux par entreprise [P `NpkConditions.getBruttoValue`, `award.Calc.sortNpkEntrepreneurList@222-1191`]

- Brut = Σ `rnd(prix_e × q)` sur les QP comptées (§7.7) dont le GP de l'entreprise ∉ {I, N}.
- Net et TVA : `svCondNpk` avec `detail.offre.conditions`, puis `detail.negociee.conditions` si non vide.

### 8.6 Tri, référence, écart par article

- Comme au §5.9, sur les nets détaillés.
- Écart par article (impression « Article CAN ») = montant ÷ montant de référence de l'article × 100, arrondi **à l'entier** ; « 100 % » si égal ; vide si la référence vaut 0.
- Dans « Descriptif avec comparatif » : prix ÷ prix de référence × 100 à **1 décimale** (§0-5).

### 8.7 « Créer le contrat » (C1 → D) : voir §3.7.

Le document « descriptif » de l'entreprise proposée devient celui du contrat, sans ses pages de garde (`disableCoverSections` : on garde les sections dont le titre commence par « descriptif » [P]).

### 8.8 CONTRAT [P]

- **« Informations du contrat »** (`DevisContractDataDialog`) : Numéro du contrat · Numéro de l'avenant · Type de contrat (texte + suggestions « Contrat sur prix unitaires » / « Contrat sur prix forfaitaires ») · Texte libre 1..4 · Début de la préparation · Début des travaux · Fin des travaux (mêmes champs que l'appel d'offres).
- **« Indications de l'offre »** (pinceau en D) : genre, n° et date de l'offre, genre de rémunération de l'entreprise, repris dans le contrat.
- **Nœud CONTRAT ▸ Documents**, lignes :
  - « Descriptif », « Descriptif en PDF », « Note d'expédition », « Remarque » ;
  - « Document de commande », « Commande en PDF », « Note d'expédition de la commande », « Remarque » ;
  - « Début préparation document », « Début préparation Pdf », « Note d'expédition pour le début de la préparation », « Remarque pour le début de la préparation ».
  - Sans entreprise du contrat : « Vous n'avez choisi aucun entrepreneur pour l'ordre. ».

### 8.9 MÉTRÉ (D → I)

- Copie du contrat, **quantités conservées** (§0-2).
- L'utilisateur fait « − ▸ Supprimer les quantités » (« Souhaitez-vous supprimer toutes les quantités ? Attention, irréversible. ») : quantités, métrés et montants à 0, prix conservés [P `Delete.removeQuantities@304-356`].
- « Quantité du contrat » dans le métré et option d'impression « Comparer le métré avec le contrat » : quantité métrée, quantité du contrat et différence (« Différence: ») [P libellés ; D rendu].

### 8.10 OFFRE (C), DESCRIPTIF TYPE (A), ESTIMATIF (K) [P + D]

- **OFFRE** : descriptif de l'offre d'**une** entreprise (pinceau « Entrepreneur »), GP A / I / N, « Informations d'appel d'offres » et « Lieu de dépôt des offres ».
- **DESCRIPTIF TYPE** : modèle réutilisable (via « Perso » ou « Importer un descriptif »), titre « Document type d'appel d'offres ».
- **ESTIMATIF** : cible de « Créer l'estimatif » et de la création depuis l'eCCC ; l'import « Des types d'éléments » est hors périmètre (eCCC).

### 8.11 « Créer un contrat sur la base de ce descriptif » (COMPARATIF BREF, export ▾) [P rapport comparatif bref, `docTransfer`]

- Seulement si l'unité D est vide ; sinon « Le contrat est déjà utilisé. ».
- Crée un **chapitre de réserve 911** :
  - CFC = BKP ;
  - texte = AWARDINGTEXT coupé sur 2 lignes ;
  - version = année courante ;
  - articles 000 « Conditions », 100 « Travaux », 110 « Travail », 111 « Article », 111.001 « Descriptif » (textes DELTA, pas CRB), unité « gl » ;
  - une QP par CFC (× ouvrage) : GQ et GP « A », quantité 1 [D], prix = montant = brut de la proposée (négocié si ≠ 0).
- Fournit un contrat D utilisable par les documents CONTRAT sans descriptif saisi.

---

## 9. Transferts vers le contrôle des coûts et vers les intervenants

### 9.1 Prérequis DeltaSub (défauts existants, §0-10)

- `CC_STATE` (l. 2720) → `{0:'Provisoire',1:'En cours',2:'Etat intermédiaire',3:'Terminé'}`, avec la liste du dialogue `ccEditDoc` (l. 2874) sur ces 4 valeurs.
- `ccDuplicate` (l. 2880) : `STATECODE:2` au lieu de 3.
- [C] Pas de migration à faire : les codes stockés sont déjà ceux de Deltaproject.

### 9.2 Depuis le COMPARATIF BREF (`costcontrol.DevisBookShortToCostDialog`) [P]

**Avant d'ouvrir**, dans cet ordre :
1. Il faut un `costcontroldocument` de l'affaire non supprimé au statut **1 « En cours »**, sinon « Il n'existe aucun document dont le statut est en cours. ». S'il y en a plusieurs : « Contrôle des coûts » (`Date | Note`).
2. Il faut une entreprise **proposée**, sinon « Vous devez préalablement définir une entreprise. ».
3. Elle doit avoir des conditions d'offre, sinon « Vous n'avez défini aucune condition. ».

**Dialogue « Comptabiliser »**

| Libellé | Contenu |
|---|---|
| Nº d'affaire | n° + titre |
| RNF | BKP + AWARDINGTEXT, affichés |
| Commentaire | saisie libre |
| Numéro de contrat | + « Trouve le n° de contrat ou d'avenant suivant » |
| ☑ Contrat prioritaire sur devis pour le coût probable | coché par défaut |

- Numéro suivant : max + 1 des numéros entiers, en gardant un préfixe non numérique ; « 1 » par défaut.
- Non numérique : « Le prochain numéro ne peut être généré que lorsque la numérotation est basée sur des nombres entiers. ».
- [C] Le RNF est **affiché en lecture seule** : Deltaproject l'ignore s'il est modifié.

**À OK**
- Contrôles : verrou (§3.5) ; « Ce numéro de contrat est déjà utilisé. » ; « Vous n'avez défini aucun numéro de contrat. ».
- Écriture dans `costcontrol[doc].contrats` (schéma de `ccContract`, l. 3060) :

```js
{ id:'c'+Date.now().toString(36), type:'contrat', contratParentId:null, lieAuContrat:true /*isContractBound*/,
  numero, designation:'Contrat', date:today(), statut:'definitif' /*contractState 5*/,
  contactId: proposée.contactId, lot:{numero:BKP, texte:AWARDINGTEXT} /*vergabeNr/Text*/,
  prioritaireSurDevis: case, saisie:'brut' /*calcCondForward=true*/, description: commentaire,
  niveauPrestations:0, delaiGarantie:'', annexes:[],
  lignes:[ pour chaque CFC (× ouvrage) :
     {cfc, ouvrage:ouv, localisation:lg, refCond:'', brut, net, tva, partsForfaits:{[niv]:montant forfait de la ligne}} ],
  conditions:[ pour chaque condition (négociées si non vides, sinon offre) :
     {niveau:niv, reference:ref, kind, genre, libelle:texte, refCond:'', valeur, montant:total, appliquee:m} ] }
```

- **Valeurs de ligne** : négociées si le brut négocié de la ligne ≠ 0, sinon celles de l'offre.
- **Genres** [P] :

| Genre soumission | `kind` contrôle des coûts | `valeur` |
|---|---|---|
| forfaits {0, 4, 6, 8, 10} | 2 Déduction | total |
| 2 TVA | 6 TVA | taux |
| autres % {1, 3, 5, 7} | 1 Rabais | taux |

  [C] On garde ce repli (1 / 2 / 6) plutôt que 3 / 4 / 21 : les genres « retenue de garantie » du contrôle des coûts ont des effets propres ; le libellé conserve le sens.
- **La limitation à un ouvrage est perdue** (`number` = "") [P]. Les nets et TVA de ligne **stockés** font foi, avec `partsForfaits`. [C] **Ne pas appeler `ccApply`** : sémantique différente, §0-9. Bandeau dans l'éditeur du contrôle des coûts « Contrat issu de la soumission <n°> — valeurs figées ».
- Ajouter l'entreprise à `C.entreprises` si absente (`{contactId, nomCourt}`), comme `ccEntPicker` l. 2986.
- Écriture en un seul `DS.commit` avec `bseq` (conflit → message et abandon).

### 9.3 Depuis le COMPARATIF détaillé et le CONTRAT (`costcontrol.DevisBookToCostDialog`, lot 3) [P rapport comparatif §15, rapport données A.7]

**Dialogue « Transférer vers contrôle des coûts »**
- Champs : Nº d'affaire · Lot d'adjudication / RNF · Texte · Numéro de contrat (+ suivant) · Numéro d'ordre (affiché, non transféré) · Contrat pour.
- (•) « Contrat à prix unitaires » / « Contrat à forfait ».
- ☐ « Contrat prioritaire sur devis pour le coût probable ».
- ☐ « Répartir par nature des coûts » · ☐ « Répartir par ouvrages » (« Ouvrage/localisation »).
- Tableau `Brut | Net | Total`, « Commentaire », bouton « Comptabiliser ».

**Données**
- C1 : entreprise proposée, conditions négociées sinon offre.
- C / D : entreprise de l'unité et ses conditions.
- Date = date du document de l'étape, sinon aujourd'hui.

**Lignes**
- Sans répartition : une seule ligne (CFC = BKP).
- Sinon : par nature des coûts (CFC des QP) et/ou par ouvrage × localisation.
- Forfaits ramenés au prorata `valeur × brut_ligne / brut_total` [D].

**Messages**
- « Vous n'avez défini aucune condition. »
- « Les conditions se réfèrent aux ouvrages ou au CFC et ne peuvent donc pas être transférées. »
- « Ce numéro de contrat est déjà utilisé. »
- « Vous n'avez défini aucun numéro de contrat. »
- « Vous devez préalablement définir la correspondance CFC-CAN. » : sans objet sans CAN [C] ; le CFC vient des QP ou du chapitre.
- « Vous devez préalablement définir une entreprise. »
- « L'ouvrage ^0 n'est pas défini. »
- « La nature des coûts ^0 n'est pas définie dans cette affaire. »
- « Il y a des articles sans ouvrage. »
- « Aucun titre n'a été défini pour les travaux. »
- « Êtes-vous sûr de vouloir comptabiliser cet avenant sans contrat ? »
- « Opération impossible car le devis n'est pas encore chargé dans le contrôle des coûts. »

[C] Sans entreprise proposée : message explicite (Deltaproject reste muet @206-399).

### 9.4 Écritures dans l'affaire à la fermeture et à l'enregistrement [P `DevisDialog.matchTenderers@30-66`, `setTenderers@0-323`, `DevisToProjectMembers.setProjectRole@1-421`]

**Soumissionnaires de l'affaire** (`projecttenderer`) : pour chaque entreprise dont le contact existe, recherche de (`PROJECT_ID`, `BKP` = BKP du document, égalité stricte, `CONTACT_ID`).
- **Trouvée** :
  - `RESPCONTACT_ID` remplacé s'il était vide et que le nouveau est renseigné, ou si les deux sont renseignés et différents ;
  - un responsable vide n'efface jamais l'ancien ;
  - `ISACCEPTED` = `proposee` (écrasement).
- **Absente** : création `{PROJECT_ID, BKP, CONTACT_ID, RESPCONTACT_ID, ISACCEPTED: proposee}`.
- `NOTE` n'est jamais écrit ; aucune suppression.

**Intervenants** (`projectmember`), si l'entreprise du **contrat** (`unites.D.entreprise.contactId`) existe : recherche d'un intervenant `TEAMROLECODE` 19 pour ce contact.
- **Trouvé** : si le CFC du lot n'est pas dans `BKP` (liste séparée par des virgules) et que la longueur totale reste < 256 → `BKP = ancien + ',' + lot` ; si `BKP` est vide → lot.
- **Absent** : nouvel intervenant `{TEAMROLECODE:19, CONTACT_ID, RESPCONTACT_ID, PROJECT_ID, BKP: lot}`.
  - [C] Renseigner le CFC : Deltaproject l'oublie (@327-355).

Tout se fait dans un seul `DS.commit`.

### 9.5 Montant du DG (lecture du devis général) : §4.4.

Soumission depuis la Planification eCCC : §3.2 (lot 4).

---

## 10. Impressions et exports

### 10.1 Moteur `dpPrint`, généralisation de `mgPrint` (l. 2012) [P limites du code + C]

| Élément | Aujourd'hui (`mgPrint`) | À faire (`dpPrint`) |
|---|---|---|
| Jeu | `'0/'+type` (l. 2014) : aucun modèle de soumission, qui n'existent qu'en jeux 1 et 2 | `doctemplategroup[PROJECT.DOCTEMPLATEGROUPNAME].TEMPLATEFOLDERID`, sinon **1** (§0-12) ; choix si plusieurs |
| Sections | `sections[0]` seulement, `isVisible` ignoré | toutes les sections visibles, chacune avec **son** gabarit de page (portrait / paysage), `@page` nommé par section |
| Champs | par nom seul, format `s` ignoré | clé `Classe$StringField\|nom` + format `s` (liste ci-dessous) |
| Colonnes flexibles | `name==='FlexColumn'` (faux en jeux 1-2) | test `type==='flexColumn'` : une colonne par entreprise, paginée selon « Entreprises par page » |
| Polices | 5 | + `small`, `smallBold`, `largeBold` |
| Bandes | GridBand, TableBand, TextBand | + `PageBreakBand`, `WrappingTextBand`, bordures `rs`, images (`appUserSignature` : espace vide tant qu'aucune signature n'est stockée [C]) |
| Tableaux | — | `tableProperties` {k, v} lues et appliquées ; colonnes `isH` masquées ; styles de ligne `tableHeader/tableRow/tableLevel1Total/tableTotal/catalog*` |
| Pages | en-têtes et pieds figés | cellules de page `pageCells` : `text` / `textField` (`pageNumber`, `nofPages`, `sectionTitle`, `currentHeader`), `isFP` (1ʳᵉ page seulement) |

`mgPrint` reste en façade pour le jeu 0 (Management), afin de ne pas casser l'existant.

**Formats `s`** [P relevé des modèles ; rendu D] :

| Format | Rendu DeltaSub |
|---|---|
| `standard` | valeur brute |
| `contactOwnerAndAddress` | nom du propriétaire + `adrLines` |
| `contactAddress` | `adrLines` |
| `contactAddressSingleLine` | lignes jointes par « , » |
| `contactShortForm` | `SHORTLABEL`, sinon nom |
| `contactSalutation` | formule d'appel de l'adresse |
| `contactFirstnameAndName` | prénom + nom |
| `contactPhone` | `PHONE1` |
| `contactEmail` | `EMAIL1` |
| `contactLocation` | `LOCATION` |
| `userName` / `userEmail` / `userPhoneNumber` / `userJobTitle` | collaborateur |
| `projectNumber` / `projectTitle` / `projectNumberAndTitle` / `projectCurrency` (CHF) / `projectBaseIndex` / `projectStartOfConstruction` / `projectEndOfConstruction` | affaire |
| `dateFull` | `dLongFr` |
| `dateLong` | `dLong` |
| `dateMedium` | jj.mm.aaaa |
| `dateShort` | jj.mm.aa |

### 10.2 Contexte commun `svReportCtx(doc, soum, etape, entreprise)` [P `DevisDocumentReport.getString` tableswitch 0-42, `DevisTendererList.getString`, rapport données B.4]

| Champ | Source |
|---|---|
| devisBkpNumber / devisBkpText / constructionOrderNumber | `BKP` / `AWARDINGTEXT` / `ORDERNUMBER` |
| constructionInternalVersion / …VersionNr / …Note | `VERSION` / `VERSIONNUMBER` / `NOTE` |
| staff | collaborateur de `USERID` |
| appUser | utilisateur connecté |
| docDate / docTitle | `unites[etape].date` / `.titre` (titre par défaut de l'étape) |
| constructionPlanner (+Contact, +Resonsable) | `appelOffres.mandataire` (pas de repli) |
| constructionLocation (+Contact, +Resonsable) / projectAddress2 | `lieuDepot` ; sinon **`PROJECT.CONTACT2_ID`** (« Lieu de dépôt des offres » de l'affaire) |
| constructionInputDate / InputTime | `dateDepot` / `heureDepot` |
| **constructionBidOpeningDate** | **`dateOuverture`** [C : la liste et la lettre de Deltaproject impriment à tort la date de dépôt, @429 / @424] |
| constructionBiddingKind | libellé de `procedure` |
| constructionStartWorkPreparation / WorkBegin / WorkEnd | textes libres |
| constructionEstimateSummary / RevEstimateSummary / AwardSummary / PartnerBkpNumber / MutationSum / GuarantyValue / PriceLevel / OpenSum / ReserveSum / OrderSummary | `montantDG` / `informationsComparatif.*` (chaînes saisies) |
| constructionRevBidDate / constructionAbgebotDate | `informationsComparatif.dateOffreNegociee` / `indications.dateOffreNegociee` de l'entreprise |
| constructionOfferDate / offerDate / constructionOfferNumber / offerReference / constructionOfferKind / constructionPriceAgreement / constructionBruttoOfferSummary | `indications` de l'entreprise (proposée ou destinataire) |
| constructionContractKind / projectContractNumber / constructionAddendumNumber | `unites.D.contrat` |
| projectContractor (+Contact, +Responsible) | entreprise de l'unité de l'étape ; en C1 et au bref, **la proposée** |
| contact / contactContact / responsibleContact | destinataire : responsable s'il existe, sinon entité / entité / responsable |
| projectMemberBuilder / …Architect / …ConstructionManager (+Contact, +Responsible) | intervenants de rôle 8 / 1 / 2 |
| projectmanagementBuilderBySuproject | MO de l'ouvrage, sinon MO de l'affaire [D] |
| amountBrutto / amountTotalExVat / amountVat / amountTotal | brut / HT / TVA / TTC de l'entreprise concernée (ou de l'étape), `rnd(·, arrondi)`, « 0.00 » si nul |
| constructionBestOfferAmount / constructionYourOfferRang | §5.9 |
| priceComparisonCriterias | noms des critères principaux séparés par « , » [D] |
| reportFilter | description du filtre actif |

### 10.3 Documents `.dpdoc` : un par un (mises en page détaillées : rapport données, annexe B-1)

| Type | Nœud | Destinataire / date | Contenu propre |
|---|---|---|---|
| `devisTendererList` | SOUMISSIONNAIRES ▸ Documents | — / aujourd'hui | A4 paysage ; Titre, Information (Affaire, Travaux, Responsable) ; tableau `DevisTendererTable` (§10.4) |
| `devisTendererLetter` | SOUMISSIONNAIRES ▸ Lettres | chaque entreprise / date de l'étape B | Adresse ; Informations ; Titre « Appel d'offres <CFC> <texte> » ; Texte ; Date et heure de dépôt ; Lieu de dépôt ; Documents ; Dernier texte ; Signature |
| `devisPriceComparison` | BREF / COMPARATIF ▸ Documents | — | Page de garde (portrait) : infos, adresses, « Proposition d'adjudication » = proposée, `shortSummary`. Document (paysage) : `entrepreneurSummaryTable`, ⤓, `devisNpkPositionTable` (détaillé seulement [D]). Annexe : `entrepreneurList`, `notOfferdEntrepreneurTable`, `entrepreneurCommentTable` |
| `devisAwardRequest` | idem | — | Page de garde : Travaux, Entreprise, Montant du DG, Montant plafonné (TTC), `devisAwardRequestSummaryTable`, `…ConditionTable`. Comparaison : `…EntrepreneurListTable`, critères, `…CriteriaTable`. Annexe : commentaires, soumissionnaires |
| `devisAcceptanceLetter` | idem | proposée | Délais (préparation, début, fin) |
| `devisConfirmationOfOrder` | idem + CONTRAT ▸ Documents | proposée / entreprise du contrat | `devisConfiramtionOfOrderConditionTable` ; commentaires (genre d'offre, « Offre du », « Offre négociée du ») |
| `devisBidding` | … ▸ Négociation | chaque entreprise prise en compte | « Meilleure offre », « Votre offre », « Votre Rang » ; « Offre révisée » `conditionTable` à remplir et signer ; annexe (récapitulatif, offres soumises, « Comparer à la meilleure offre » par chapitre) |
| `devisRejectionLetter` | … ▸ Courriers de refus | non proposées prises en compte | « Refus <CFC> <texte> », adjudicataire et « Montant d'adjudication <CHF> … (TTC) » |
| `devisWorkPreparationLetter` | CONTRAT ▸ Documents | entreprise du contrat / aujourd'hui | « Engagement pour les travaux », Délais |
| `devisDocument` | Documents des étapes A, B, C, D, I, K ; COMPARATIF ▸ Descriptif | — | 8 sections, dont 4 visibles par défaut : **Appel d'offres** (intervenants, conditions, déclaration, documents d'appel d'offres, remarque, **Dépôt des offres (lieu, date, heure)**, questionnaire « Informations sur l'entreprise »), Récapitulatif (`devisChapterTable`), Descriptif (`devisDescTable`) ; masquées : Estimatif, Métrés, Contrat, Document type, Offre |
| `devisPriceComparisonDesc` | COMPARATIF ▸ Documents | — | Page de garde, Récapitulatif, Descriptif avec une ligne par entreprise `Entreprise \| % \| GP \| Prix \| Montant` |
| `projectTendererList` | domaine Soumissionnaires | — | `ProjectTendererList.table` (Entité, Responsable, Tél., Tél. mobile, Courriel, CFC, Commande reçue) |

- **Sujets de partage** : « <titre> <CFC> <désignation> ».
- **Nom d'export** : `<type FR>_<CFC>_<désignation>.pdf` [C].

**Défauts des modèles du bureau à signaler, sans les « améliorer »** (règle 4 du CLAUDE.md) :
- `devisConfirmationOfOrder`, ligne Téléphone = `staff#userName` ;
- pieds « Seite » dans `devisAcceptanceLetter`, `devisConfirmationOfOrder`, `devisWorkPreparationLetter` ;
- titre « Liste des soummissionaires ».

### 10.4 Tableaux (colonnes par défaut, visibilités du bureau) [P rapport soumissionnaires §8.2, rapport comparatif §12.2, rapport données B.5 et annexe B-1]

**`DevisTendererTable`** : 15 colonnes, une ligne par entreprise de la liste (sautée si l'entité est introuvable).

| id | Colonne | Visible |
|---|---|---|
| 0 | Adresse | oui |
| 1 | Adresse abrégée | non |
| 2 | Adresse compacte | non |
| 3 | Téléphone | non |
| 4 | Fax | non |
| 5 | Courriel | non |
| 6 | Responsable | oui |
| 7 | Tél. contact | oui |
| 8 | Tél. mobile | oui |
| 9 | Fax Responsable | non |
| 10 | Courriel du contact | oui |
| 11 | Note d'expédition | non |
| 12 | Situation de l'offre | non |
| 13 | Pris en compte dans la comparaison des prix | oui (« x » / vide) |
| 14 | Remarque | non |

**`shortSummary`** (`DevisEntrepreneurShortSummaryTable`)
- Colonnes : Nº · Entreprise · (N° de l'offre) · (Monnaie) · (Date de l'offre) · Offre · (Date de négociation) · Négociation · Pourcentages (2 décimales).
- Ordre §5.9.

**`entrepreneurSummaryTable`** : une colonne par entreprise ; propriétés k0-k20 :

| k | Propriété | k | Propriété |
|---|---|---|---|
| 0 | adresse | 11 | commentaires |
| 1 | présentation (deux lignes / localité) | 12 | détail des chapitres |
| 2 | responsable | 13 | date de l'offre négociée |
| 3 | téléphone | 14 | entreprises par page |
| 4 | courriel | 15 | maximum |
| 5 | date de l'offre | 16 | % offre |
| 6 | genre d'offre | 17 | % négociée |
| 7 | genre de rémunération | 18 | sous-total |
| 8 | brut non contrôlé | 19 | fond |
| 9 | conditions de l'offre | 20 | déduction avant rabais et escompte |
| 10 | offre négociée | | |

- Valeurs du bureau : 0 = vrai, 1 = deux lignes, 9 / 10 / 12 / 18 = vrai, 14 = 4, 15 = 20.
- Lignes, bloc Offre puis bloc Négociation : Brut ; Déduction (0, si « avant ») ; Rabais (1, avec %) ; Escompte (3, 4) ; Sous-total ; Déduction (sinon) ; Autres (7, 8) ; Retenue (5, 6) ; Net - arrêté à (10) ; Total HT ; TVA ; Total TTC ; Pourcentages (% et CHF).

**`devisNpkPositionTable`** : `N° | Désignation | GQ | Quantité | U | [Prix unit. min. | Montant min. | Prix le plus élevé | Montant le plus élevé] | Entreprises…`.
- Propriétés du bureau : k0 « Par article », k1 = 6, k2 = 30, **k8 (le plus bas en vert) = vrai**, k12 = 100 %.
- Textes « Inclus » / « Non offert » pour I / N.
- **Filtre x %** : QP de la proposée (GQ ≠ W), valeur q × p, tri décroissant, gardées tant que le cumul ≤ brut × x %.
  - Avertissement : « Attention, vous travaillez en mode analyse. Ne sont affichées que les positions représentant ^0 % du total. ».
  - [C] Pour un descriptif de réserve, la colonne « Désignation » affiche le mot-clé.

**Autres tableaux**
- `notOfferdEntrepreneurTable` « Offres non prises en compte » : `Entreprise | Situation de l'offre`, pour les entreprises non `prisEnCompte` ou non `afficher`.
- `entrepreneurCommentTable` « Remarques » : entreprises prises en compte ayant un `indications.commentaire`.
- `entrepreneurList` : `Adresse | Téléphone | (Fax) | (Courriel) | Responsable | Tél. contact | Tél. mobile | (Fax Responsable)`.
- `devisAwardRequestCriteriaTable` : `Nº | Entreprise | Principaux critères | Sous-critère | Points | Remarque` (points entiers, meilleur d'abord).
- `devisConditionTable` et équivalents : `Désignation | Conditions | % | Total | [Sous-total]`, colonnes techniques masquées (ID, Niveau, Référence, Type, Jours, CFC, Ouvrage, Monnaie, Montant, Pris en compte).
- `devisChapterTable` : `N° | Texte | Montant`.
- `devisDescTable` : `R | M | U | V | Texte | Q | Quantité | UN | P | Prix | Montant`, propriétés k0-k26 (texte triple largeur par défaut, sauts de page « auto », etc.).

### 10.5 Cycle de vie d'un document [P `newSingleDocument@22-158`, `subListDocument@87-177` + C]

1. « Document » : si absent, choix du modèle (jeu de l'affaire, sinon 1), création `soumissiondoc`, puis aperçu `dpPrint`.
2. Aperçu → « Imprimer / PDF » par le navigateur. [C, lot 4] Envoi du PDF au serveur, puis « PDF disponible ».
3. « Effacer le document » refusé si le PDF existe : « Un fichier PDF existe déjà. ». Sinon « Voulez-vous supprimer ce fichier définitivement ? ».
4. Textes des bandes `TextBand` modifiables par document (lot 4) ; « Utiliser ce document pour tous » recopie ces textes.

### 10.6 Anciens modèles « modele » `projectDevis*` (lot 4) [P rapport données annexe B-2]

- Pages de garde par étape :
  - B : `projectDevisTenderCover` ;
  - C et C1 : `projectDevisOfferCover` (C1 utilise l'ID de l'offre [P `CoverDisplayDialog@414-818`]) ;
  - D : `…ContractCover` ;
  - I : `…MeasureCover` ;
  - A : `…MasterDescCover` ;
  - K : `…EstimateCover`.
- Récapitulatifs : `projectDevisSummary`, `…ChapterSummary`, `…SubprojectSummary`, `…TotalSummary`.
- Autres : `projectDevisDescription`, `projectDevisABB`, `projectDevisTenderLeadDocument` et `…ContractLeadDocument` (pages fixes `pageF1-F4`).
- Via `tplPrint` (l. 3537), à étendre à `pageF1-F4`. Défaut de conversion connu : des champs intégrés au RTF ont été réduits à leur libellé (`convertir_modeles.py` l. 211-218).
- **Non repris** : `projectDevisOfferOverview`, `…DetailPriceComparison`, `…OfferProposal`, `…GlobalPercentageBid`, `…Order` (anciens documents « [Ancien document] »).

### 10.7 Exports

- CSV et presse-papier de chaque tableau (listes, descriptif).
- Export du comparatif (« Sélectionner les données à exporter » : Récapitulatif, chapitres, paragraphes, articles, ouvrages, détails ; format csv) : lot 4, csv seulement [C].

### 10.8 SIA451 (option, lot 4, à valider avec Paulo) [P `sia451.*Record.setExport*`, rapport descriptif §13]

**Conteneur**
- `.CRBX` (zip) contenant un `.E1S` (IfA 18), encodage UTF-8, sous-dossier `Files/`.
- Nom de fichier sans espace, sans « , » ni « - », un seul point.

**Enregistrements** à largeur fixe, colonnes numérotées depuis 1.
- Prix : 12 chiffres, 2 décimales implicites, signe séparé.
- Quantité : 13 chiffres, 3 décimales implicites.
- Ordre : A, B, C0, C1, C5, puis par chapitre G1, par article G2, G3…, G4, G5, G6 (+ EG6), P1-5, X4 / X5, Z.

| Rec. | Champs (colonne de début / longueur) |
|---|---|
| **A** | date 2/6 · version de format 8/6 « CRBX17 » · version 14/2 « 21 » · MO 18/12 · propriétaire (code client CRB) 30/12 · langue 42/1 · état 43/1 · type de document 44/1 (A B C D I K ; C1 → C) · statut 45/1 · lot 46/13 · n° de document 59/4 · version 75/7 · n° d'affaire 82/11 · titre 93/30 · identification 123/15 · désignation du lot 138/30 · logiciel 168/20 · téléphone 188/20 · version du logiciel 208/30 |
| **B** | subdivisions : n° 2/3 (001 CFC, 002 OUV/LOC, 003 CFE, 004 TE, 005 GV/Var, 007 SpA, 008 SpL) ; codes CFC 82/5, OUV 18/6, LOC 24/6, CFE 87/6, TE 129/6, GV 30/3, Var 33/3, SpA 168/16, SpL 188/16 ; textes 93/30, 138/30 ; eCode 208/16 |
| **C** | conditions : n° 2/3 · genre 5/1 · niveau et référence 6/2, 16/2 · délai 36/6 · % ou P 44/1 · valeur 63/12 · pourcentage 76/6 · texte 93/30 ; C0 brut 46/15 ; C5 liaison OUV / CFC |
| **G1** | chapitre 2/3 · version 6/2 · titre 93/30 + 138/30 |
| **G2** | chapitre · m+u 8/6 · mot-clé 93/30 · éco 43/1 |
| **G3** | variable 14/2 · n° de ligne 16/2 · ligne de 30 car. 93/30 · début du texte entrepreneur 136/2 |
| **G4** | remarque par subdivision (codes comme B) |
| **G5** | unité 59/2 ; prix identique 62/1 + 63/12 |
| **G6** | codes · Cal 36/6 · GQ 44/1 · signe 45/1 · quantité 46/13 · GP 61/1 · signe 62/1 · prix 63/12 · n° courant 75/7 · RPA 123/6 |
| **EG6** | n° de groupe 14/2 · n° de ligne 16/2 · « [commentaire] formule » en 93/30, 138/30, 208/30 (d'où la limite de 90) |
| **Z** | propriétaire 18/12 · expéditeur 138/30 · téléphone 168/20 · responsable 188/20 · courriel 208/49 |

- La réserve et les arrondis du métré ne sont pas transmis ; les pièces vont en X4 / X5.
- **Dialogue d'export** : « Statut du document », « Version précédente » (**peut** être vide : DE fait foi), « Version du document », « Société (Expéditeur) », « Responsable », « Téléphone », « Courriel », ☐ « Exporter les conditions / les quantités / le métré / les prix » (conditions grisées en B), ☐ « Filtrer ». Contrôles du §7.14.
- **Import** : licence (§1.2-3).

### 10.9 Paramètres utilisateur (« Paramètres ▸ Présentation… », lot 4) [P `d18.pref.PreferencesDialog|*`]

- Catégories : Affichage, Catalogue, Chapitres, Conditions, Document, Métré, Police & Style, Cahier / Composition du cahier, Comparatif : récapitulatif / détail.
- Options principales :
  - couleurs (texte, subdivisions, réserve, éco, métré, totaux, traits, prix le moins cher, prix le plus cher) ;
  - traits (sous l'adresse, sous les titres de colonnes, après sous-totaux, après le total) ;
  - polices ;
  - totaux (§7.7) ;
  - « Affichage avec 3 décimales » ;
  - « Comparer le métré avec le contrat » ;
  - « Masquer les ouvrages » ;
  - cahier (Page de garde, Informations préalables, Descriptif, Récapitulatifs, Conditions, CGC).
- Stockage : `soumission.presentation` (défauts à la création, comme `PreferencesDialog.setPreferences`) et préférences par utilisateur (`localStorage` pour les seules commodités d'affichage).

---

## 11. Plan par lots et points d'ancrage DeltaSub

Lignes de `DeltaSub.html` à la date du 29.09.2026 (6 392 lignes, fichier modifié non commité). Elles sont **à relocaliser par nom de fonction** avant de coder. Avant chaque lot : copie `DeltaSub_backup_AAAAMMJJ_HHMM.html`.

### Lot 1 : document de soumission, étapes, soumissionnaires, lettres

| # | Livrable | Ancrage |
|---|---|---|
| 1.0 | Prérequis. `PROTECTED` += `projecttenderer`, `devisdocument`, `soumission`, `soumissiondoc`, `soumissionhist`. `SV_TABLES` dans la liste l. 181 ; `soumission` dans `HEAVY` l. 161. Corrections `CC_STATE` l. 2720 et `ccDuplicate` l. 2880 (§9.1) | `serveur_deltasub.py` l. 42 |
| 1.1 | `NAV` : `['soum','Mes soumissions']` ; `VIEWS['soum']` (liste §3.1, sur le modèle de `VIEWS['devis']` l. 2538) ; domaine « Soumission » (`domainView`, avant l. 1566 ; `domainUsed` l. 1495) | l. 345, 1474-1566 |
| 1.2 | `svEditDoc` (dialogue §3.3, sur le modèle de `dvEditDoc` l. 2564) ; création atomique ; `svDuplicate` ; corbeille en 2 temps ; verrou `LOCKUSERID` / `LOCKTIME` | `dialog` l. 272, `formRows` / `readK` l. 1133-1134 |
| 1.3 | `svEditor` : barre, titre, arbre à 9 étapes (nœuds des lots suivants grisés), nœud initial, `etape` / `dernierNoeud`, panneau « Données de l'étape » (B) | modèle `ccEditor` l. 2887 et `editorRefresh` |
| 1.4 | SOUMISSIONNAIRES ▸ Editer (§4.1-4.5 sauf PDF) : table, fiche, ajouts (dialogue « Liste de soumissionnaires », `pickContact` multiple l. 955), suppression en cascade, Informations, Mandataire, Lieu de dépôt, Montant du DG (DG validés, `dvCompute`), Titre et date, Entrepreneur, Courriel, Actualiser l'adresse | `hfContactField` l. 3846 (champ Entité / Responsable réutilisable) |
| 1.5 | `dpPrint` (§10.1) + `svReportCtx` (§10.2) ; `devisTendererList`, `devisTendererLetter` ; nœuds Documents et Lettres (§4.6), `soumissiondoc`, notes d'expédition, « Utiliser ce document pour tous » (textes fixes au lot 1) | `mgPrint` l. 2012 (façade), `tplFind` l. 3490 |
| 1.6 | Écritures à la fermeture et à l'enregistrement : `projecttenderer`, `projectmember` rôle 19 (§9.4) | `DS.commit` l. 187 |
| 1.7 | Domaine Soumissionnaires : Responsable, CFC dans le plan (§4.7) | l. 1530-1539 |

**Tests du lot 1**
- Création, duplication, corbeille, filtre des 13 stades, vues.
- Ajout sans abréviation → message.
- Tri de l'écran par abréviation.
- Lettre datée de la date du document B.
- « Ouverture des offres » = `dateOuverture`.
- Fermeture : `projecttenderer` créé avec `ISACCEPTED` = 0, puis 1 après proposition (lot 2) ; responsable non effacé.
- Verrou entre deux postes.

### Lot 2 : comparatif bref, conditions, évaluation, adjudication, courriers, transfert au contrôle des coûts

| # | Livrable | Ancrage |
|---|---|---|
| 2.1 | Moteur `svCondBref` + solveur net + « Net - arrêté à » (§5.4-5.6) avec tests §12 | nouveau, à côté de `ccCond` l. 2738 (sans le modifier) |
| 2.2 | Écran COMPARATIF BREF ▸ Editer (§5.1-5.2), dialogue Conditions (§5.3), Navigateur (`invoicecondition*` : collections déjà importées ; ajouter aux chargements), Proposition | `grid` l. 290, `phead` l. 323 |
| 2.3 | Indications de l'offre (9 champs), Informations, Commentaire, Tri, Référence, écart, rang, moins-disant (§5.8-5.9) | |
| 2.4 | Évaluation (§6.1) + Administrateur « Comparaison des offres » | `VIEWS['config']` l. 1931, `admPane` l. 1941 |
| 2.5 | Nœuds BREF ▸ Documents / Négociation / Courriers de refus (§6.3) ; `devisPriceComparison` (sans `devisNpkPositionTable`), `devisAwardRequest`, `devisAcceptanceLetter`, `devisConfirmationOfOrder`, `devisBidding`, `devisRejectionLetter` (§10.3-10.4) | `dpPrint` |
| 2.6 | « Transférer vers contrôle du coût » (§9.2) | `ccContract` l. 3060 (schéma), `ccNextNum` l. 2883, `C.entreprises` l. 2986 |

**Tests du lot 2**
- §12.1 à 12.5 (bref, forfaits, arrêté).
- Transfert : contrat définitif, lignes par CFC, genres 2 / 6 / 1, TVA additionnée, entreprise ajoutée, numéro unique.
- Aucun document « En cours » → message.
- `ISACCEPTED` = 1 pour la proposée à la fermeture.

### Lot 3 : descriptif libre, comparatif détaillé, contrat, métré

| # | Livrable |
|---|---|
| 3.1 | Unités et `DescFrame` libre (§7.1-7.6) : chapitres et articles de réserve, texte 30 × 99, mots-clés, pièces jointes |
| 3.2 | Calculs de ligne, brut, totaux (§7.7) ; métré (§7.8) ; subdivisions (§7.9) ; variantes (§7.10) ; §7.11-7.12 |
| 3.3 | `svCondNpk` + dialogue Conditions complet (§7.13) ; contrôles §7.14 |
| 3.4 | « Transférer ▾ » (§3.7) ; COMPARATIF détaillé (§8.1-8.6 : Prix, Prix des entreprises, conditions offre / négociée, tri et écart) ; nœuds COMPARATIF ▸ Documents / Négociation / Refus / Descriptif |
| 3.5 | CONTRAT (§8.8, Informations du contrat, Commande, Début de préparation), MÉTRÉ (§8.9), OFFRE / DESCRIPTIF TYPE / ESTIMATIF (§8.10), « Créer un contrat sur la base de ce descriptif » (§8.11) |
| 3.6 | Transfert détaillé vers le contrôle des coûts (§9.3) ; import interne et « Perso » (§7.15) |

**Tests du lot 3** : §12.6 à 12.12.

### Lot 4 : impressions complètes, fichiers, SIA451, paramètres

| # | Livrable |
|---|---|
| 4.1 | Serveur de fichiers (`/api/file`, dossier `…/DeltaSub/fichiers/soumission/<id>/`) : PDF générés, PDF attribués (§4.5), PDF des offres (§5.10), pièces des articles |
| 4.2 | `devisDocument` (sections), `devisPriceComparisonDesc`, `devisNpkPositionTable`, `devisWorkPreparationLetter`, textes modifiables par document, anciens modèles `projectDevis*` (`tplPrint` + `pageF*`), cahier |
| 4.3 | Paramètres utilisateur (§10.9) ; historique « À la dernière version… » (§3.8) |
| 4.4 | Création depuis la Planification eCCC (§3.2) ; menus complémentaires du domaine Soumissionnaires |
| 4.5 | SIA451 export (et import restreint), après accord de Paulo (§13) |

---

## 12. Valeurs de contrôle (recalculées)

| # | Cas | Entrées | Résultat attendu | Source |
|---|---|---|---|---|
| 12.1 | Bref, saisie du net | nets 25'000 / 12'500 ; Rabais % −0.0 (1/0), Escompte S% −0.0 (2/1), TVA M 7.7 (3/2) | bruts **23'212.63** / **11'606.31**, Brut **34'818.94** ; TVA **2'681.06** sans Arrondir, **2'681.05** avec Arrondir (1'787.35 + 893.70) ; nets de ligne 25'000.00 / 12'500.00 | MAN-FR p.74 ; `sim.py` [P] |
| 12.2 | Bref, forfait lié à un ouvrage | 2 lignes a1 = 2'000, a2 = 2'000 ; Déduction −1'000 liée à a1 | Deltaproject : **−500** imputés (défaut) ; DeltaSub [C] : **−1'000** sur a1, net 3'000 | rapport comparatif bref §4.4 |
| 12.3 | Bref, Arrondir | un montant de condition de 1'787.37 | affiché 1'787.35 (pas de 0.05, symétrique) | `Formatter.round` |
| 12.4 | Bref, « Net - arrêté à » | brut 10'000, TVA 8.1 (niv 1 / réf 0), cible 10'800.00 | ligne P- « Arrondi » insérée **avant** la TVA (niv 1, la TVA passe en niv 2 / réf 1), forfait **−9.25** → base 9'990.75, TVA 809.25, net **10'800.00** (avec ou sans Arrondir) | `calcPauschal`, `sm_critique/arrete.py` [D : valeur de F issue du moteur §5.4] |
| 12.5 | Écart % et rang | nets 1'450 (proposée), 1'459, 1'495, 1'500 | descriptif (1 décimale) 100.0 / **100.6 / 103.1 / 103.4** ; « Article CAN » (entier) 100 / 101 / 103 / 103 ; récapitulatif (2 décimales) 100.00 / 100.62 / 103.10 / 103.45 ; rangs 1…4 ; écart CHF 0 / 9 / 45 / 50 | MAN-FR p.73, DE S.98 ; §0-5 |
| 12.6 | Conditions détaillées, cascade | brut 100'000 ; Rabais −5 (1/0), Escompte −2 (2/1), Autres −1.5 (3/2), TVA 7.7 (4/3) | montants −5'000, −1'900, −1'396.50, +7'061.17 ; Net **98'764.67** sans Arrondir, **98'764.65** avec Arrondir (TVA 7'061.15) | MAN-FR p.68 ; `npk_ref.py` [P] |
| 12.7 | Offre / offre négociée par ouvrage | brut 4'000 (a1 = a2 = 2'000) ; conditions de MAN-FR p.73 (−10 % a1 réf. 0 ; −10 % a2 réf. 0 ; −10 % a1 réf. 2 ; −10 % a2 réf. 3 ; forfait −2'000 réf. 4 ; −10 % a1 réf. 5 ; −10 % a2 réf. 6) ; négociée −15 % sur les 4 premières | montants −200, −200, −180, −180, −2'000, −62, −62 → Net offre **1'116.00** ; négociée −300, −300, −255, −255, −2'000, −44.50, −44.50 → **801.00** ; `ccCond` actuel donne 1'278.00 (à ne pas réutiliser) | MAN-FR p.73 ; `npk_ref.py`, `cctest.js` [P] |
| 12.8 | Forfait lié à un ouvrage (détaillé) | a1 = a2 = 2'000 ; Déduction −1'000 liée à a1 | −1'000 entièrement sur a1, Net 3'000 (bien réparti dans Deltaproject) | `refBetrag3` [P] |
| 12.9 | Métré | 20*2.3 ; 20*2.3 ; 15*2.3 ; 15*2.3 (S-T sur la 4ᵉ) ; r5 | 46.000 ; 46.000 ; 34.500 ; 34.500, sous-total **161.000** ; ligne « Arrondi » **+4.000** ; total **165.000** | MAN-FR p.66 |
| 12.10 | Métré, cas limites | cumul 160 + r5 ; 161 + r ; 161.4 + r ; réserve 0.05 sur 161 | +5.000 ; +1.000 ; +0.600 ; **8.050** | `MeasureDialog.round` [P] |
| 12.11 | Formules | `(11+5.6)*2.8*0.25` ; `[paroi] 12*3*0.3` ; `sin(1/2)` ; `cotan(1/2)` ; `64^(1/3)` ; `fac(4)` ; `ceil(5/2)` ; `pi*2` | 11.620 (le manuel affiche le cumul 22.420) ; 10.800 ; 0.479 ; 1.830 ; 4 ; 24 ; 3 ; 6.283 | MAN-FR p.66-67 |
| 12.12 | Ligne de quantité | q 12.345 × p 17.30 | Arrondir : **213.55** ; sans : **213.57** ; GP I ou N → 0 ; GQ W → vide ; GQ Q → « (213.55) » non compté | `Div.calc` [P] |
| 12.13 | Évaluation | Prix 90 × 10, Expérience 5 × 8, Qualité 5 × 7 | points 900 / 40 / 35 ; Total : coefficients **100**, évaluation vide, points **975** | MAN-DE S.96 ; `setCriteriaTable` [P] |
| 12.14 | Évaluation avec sous-critères | « Offre » coef 60 ; sous-critères Prix coef 70 note 10, Qualité coef 30 note 8 | écran : Evaluation vide, Points = (700 + 240) × 60 × 0.01 = **564.0** ; impression : int(700) + int(240) = 940 [P], puis int(940 × 60 × 0.01) = 564 [D] | `setCriteriaTable@237-418`, `calcSubpoints@127-137` |
| 12.15 | Numéro courant | 1234565 ; 1234567 ; 0000000 | valide ; « … n'est pas conforme à IfA. » ; refusé | `BarcodeDialog.codeIsOk@74-135` |
| 12.16 | Numéro de contrat suivant | contrats 1, 2, 7 | **8** ; aucun contrat → **1** | `returnMaxContractNumber` |

> Cas 12.4 : Deltaproject cherche F par pas successifs de 1000, 100, 10, 1, 0.05 et 0.01 ; −9.25 est atteint au pas de 0.05. Le test automatique vérifie `net(F) = cible` à 0.01 près et F = −9.25.

---

## 13. Incertitudes restantes et choix recommandés

1. **SIA451** (lot 4) : le format est décrit à partir du code de Deltaproject. L'en-tête exige un **code client CRB**, et la validation est un service CRB. **Recommandation** : ne rien faire avant une demande explicite de Paulo. L'import, si un jour il est fait, n'enregistre jamais les textes CAN (§1.2).
2. **Forfait bref lié à un ouvrage** (§5.4) : Deltaproject sous-impute (défaut prouvé). **Recommandation** : corriger (répartition sur les seules lignes concernées) et signaler. Le transfert vers le contrôle des coûts porte les `partsForfaits` corrigés.
3. **Libellés inversés** Informations / Indications de l'offre dans le bref (§5.1). **Recommandation** : libeller les menus comme les dialogues.
4. **Défauts de Deltaproject à ne pas reproduire** (liste close) :
   - « Ouverture des offres » = date de dépôt (liste, lettre) ;
   - `comment5` non enregistré ;
   - abréviation vide à l'import depuis la liste ;
   - « Ouvrir PDF » à partir de 2 lignes ;
   - « TODO Merged.pdf » ;
   - nom d'export des lettres ;
   - Actualiser l'adresse sans remappage des prix ;
   - intervenant 19 créé sans CFC ;
   - « a des prix » limité aux articles à une QP ;
   - référence ignorée par `getReferenceTotal()` ;
   - sous-critères non importés ;
   - prix 0 considéré comme minimum ;
   - transfert muet sans proposée ;
   - « Arrondir » basculé avant les droits ;
   - « Proposition » avec ouvrages ;
   - « null Copie » ;
   - message « Il n'y a plus de licence disponible. » pour un fichier illisible ;
   - dates de dépôt et d'ouverture initialisées à la date de création ;
   - quantité « 0 » écrite au changement de GP.
5. **Stockage des PDF et pièces** : exige une extension du serveur (`/api/file`). D'ici là : « Document disponible » seulement, PDF via le navigateur, images légères en base64.
6. **Stade actuel** : laissé déclaratif (fidèle). Des suggestions non bloquantes restent possibles (§3.4), à valider par Paulo.
7. **Enregistrement** : continu dans DeltaSub (pas de cadence 1 sur 6 ni de question à la fermeture). L'historique remplace les copies `devis18_*`.
8. **Réutilisation des moteurs du contrôle des coûts** : **exclue** (§0-9). Deux moteurs dédiés, `svCondBref` et `svCondNpk`. La sémantique de `ccCond` pour le contrôle des coûts n'est pas remise en cause ici [D : conforme au module coûts analysé séparément ; à reconfirmer si un jour on veut unifier].
9. **Plages de numéros « neutres » 901-909** (MAN-DE) : acceptées par les règles (§7.3) ; aucune règle supplémentaire.
10. **Jeu de modèles** : si l'affaire n'en a pas, jeu 1 (fidèle, §0-12). Les jeux 1 et 2 sont identiques en FR, donc sans effet visible au bureau.
11. **Critères par défaut** d'un nouveau document : les 4 critères d'`InitDocument` au coefficient 0 [D]. Alternative : importer d'emblée les modèles de l'administrateur. **Recommandation** : les 4 critères, avec le bouton « importer » bien visible.
12. **« 1003 GL »** dans la licence de données : produit CRB non identifié [D]. Sans incidence : aucune donnée CAN n'est utilisée.
13. **Affectations** (`projectusezone`) comme source de la liste « Subdivision par affectations » [D] : à confirmer sur l'écran « Subdivision et tri ».

---

## À reproduire dans DeltaSub (par ordre de priorité)

1. **Prérequis (lot 1.0)** : protéger `projecttenderer`, `devisdocument`, `soumission`, `soumissiondoc`, `soumissionhist` contre le ré-import. Déclarer les collections de soumission (`HEAVY`, liste des collections éventuellement vides). Corriger `CC_STATE` et `ccDuplicate` (codes 0 Provisoire, 1 En cours, 2 Etat intermédiaire, 3 Terminé).
2. **Document de soumission** : collection `devisdocument` (colonnes Derby + `LOCKUSERID` / `LOCKTIME`) et contenu JSON `soumission`. Statuts 0-3, **13 stades déclaratifs** avec leurs codes, IfA 2018 / CAN figés.
3. **Accès** : BÂTIMENT ▸ « Mes soumissions » (entre Devis et Contrôle des coûts) et domaine d'affaire « Soumission ». Liste à 12 colonnes, vues Adjudication / Commande / Standard, filtre des stades, recherche, CSV. Dialogue « Nouveau document » / « Editer la soumission » (lot tiré du plan CFC, gardes 64 / 128 / 1024, N° de version 1). Dupliquer (« … Copie », sans n° d'ordre). Corbeille en 2 temps avec restauration. Verrou coopératif.
4. **Fenêtre de soumission** : titre, arbre à 9 étapes et sous-entrées exactes, nœud initial selon le dernier nœud, panneau des données de l'étape B.
5. **SOUMISSIONNAIRES** : table à 5 colonnes triée par abréviation, fiche soumissionnaire (Situation de l'offre, Remarque, Note d'expédition, Prendre en compte…), ajouts depuis la liste de l'affaire ou les adresses (abréviation obligatoire, sans doublon), suppression en cascade des évaluations. Informations d'appel d'offres (7 procédures, dates, délais texte, 5 textes libres), Mandataire spécialisé, Lieu de dépôt, Montant du DG (DG validés), Titre et date, Entrepreneur, Courriel, Actualiser l'adresse (avec remappage des prix).
6. **Moteur d'impression `dpPrint`** (jeu de l'affaire, sinon 1 ; toutes les sections visibles ; champs `nom#format` ; colonnes flexibles ; sauts de page) et contexte `svReportCtx`. Documents `devisTendererList` et `devisTendererLetter` (une par entreprise, datée du document B, « Utiliser ce document pour tous »). Nœuds Documents et Lettres avec notes d'expédition. « Ouverture des offres » = date d'ouverture.
7. **Écritures dans l'affaire** à la fermeture et à l'enregistrement : `projecttenderer` (upsert par affaire × CFC du lot × entité, `ISACCEPTED` = proposée, responsable jamais effacé) et intervenant rôle 19 « Entreprises » avec la liste de CFC (y compris pour un nouvel intervenant). Compléter le domaine Soumissionnaires (Responsable, CFC du plan).
8. **Comparatif bref** : structure CFC (× ouvrages), deux tableaux Offre / Offre négociée au brut, conditions avec le **moteur `svCondBref`** (r2 par niveau, 5 ct si Arrondir, forfaits au prorata, mode brut / net global, solveur net → brut, « Net - arrêté à », « Proposition », Navigateur des modèles `invoicecondition`). Contrôles et messages exacts. Tests §12.1-12.4.
9. **Adjudication** : proposée exclusive « (+) » en vert, Tri (M, ordre manuel, tri automatique net croissant, nets 0 à la fin, rang), Référence pour l'écart, écarts % et CHF aux formats exacts, meilleure offre, montant d'adjudication. Indications de l'offre (9 champs), Informations (13 champs + DG), Commentaire d'adjudication.
10. **Évaluation** : critères et sous-critères (formules écran et impression), import des modèles **avec** les sous-critères, administrateur « Comparaison des offres ».
11. **Documents du comparatif** : nœuds Documents / Négociation / Courriers de refus. `devisPriceComparison`, `devisAwardRequest`, `devisAcceptanceLetter`, `devisConfirmationOfOrder`, `devisBidding` (meilleure offre, votre rang, offre révisée), `devisRejectionLetter` (non proposées), avec tableaux et propriétés du bureau.
12. **Transfert vers le contrôle des coûts depuis le bref** : document « En cours », dialogue « Comptabiliser », contrat définitif prioritaire par défaut, saisie brute, lignes par CFC (× ouvrage) aux valeurs négociées sinon offre, genres 2 / 6 / 1, `partsForfaits`, valeurs figées (sans `ccApply`), entreprise ajoutée, numéro unique et suivant.
13. **Descriptif libre** (lot 3) : chapitres de réserve (règles du 9, refus 00 / 0xx / 8xx / 900 / < 100, version 4 chiffres), articles de réserve (numéros libres, unité obligatoire, texte 30 × 99, mot-clé ≤ 30 obligatoire, point d'insertion), 30 colonnes, GQ / GP selon l'étape, `Div.calc`, brut (variantes primaires), totaux, métré (algorithme exact, 90 caractères, 99 lignes), subdivisions (7 listes, combinaisons, insertion automatique, fusion), variantes, numéro courant, TVA de ligne, RPA, tri, filtre, sauts de page, import interne et « Perso ».
14. **Moteur `svCondNpk`** et dialogue Conditions complet (ID, Jours, S-T, M S-T, contrôles TVA), tests §12.6-12.8.
15. **Transitions « Transférer ▾ »** (cible vide, comparatif seulement depuis B et avec soumissionnaires, purge du métré depuis B, B → C1 avec conditions par entreprise, C1 → cible avec les prix et conditions de la proposée, D → I avec quantités **conservées** et « Supprimer les quantités »).
16. **Comparatif détaillé, contrat, métré** : dialogues « Prix » et « Prix des entreprises », conditions offre / négociée par entreprise, « Créer le contrat », Informations du contrat, Commande, lettre de début de préparation, métré avec comparaison au contrat, « Créer un contrat sur la base de ce descriptif » (chapitre 911), transfert détaillé vers le contrôle des coûts.
17. **Lot 4** : serveur de fichiers (PDF générés, PDF attribués, PDF des offres, pièces), `devisDocument` complet, `devisPriceComparisonDesc`, anciens modèles `projectDevis*`, textes modifiables par document, paramètres utilisateur, historique « À la dernière version… », création depuis la Planification eCCC, menus complémentaires du domaine Soumissionnaires.
18. **Option soumise à Paulo** : SIA451 (export d'un descriptif de réserve ; import restreint aux numéros, quantités, prix et conditions, sans aucun texte CAN).
19. **Jamais** : catalogue CAN / NPK / CPN, textes indicatifs, éco-devis, PRD, prix CRB, variables alternatives, articles « dito », conversion d'année, traduction, CGC / normes, contrôles de licence CRB, ancien format IfA 92, anciens documents « [Ancien document] ».
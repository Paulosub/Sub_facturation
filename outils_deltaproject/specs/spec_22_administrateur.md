# Cahier des charges — CH-06 « Administrateur : catégories manquantes et édition complète » dans DeltaSub

Version du rédacteur critique, 01.10.2026. Ce cahier décrit comment compléter, dans `DeltaSub.html`, la fenêtre Réglages ▸ « Administrateur » de Deltaproject 16.05 (`deltaproject.admin.AdminDialog` et ses fenêtres de catégorie). Il confronte les deux recherches du chantier (`ch/CH-06/rech_orig.md` sur l'original, `ch/CH-06/rech_exist.md` sur DeltaSub), la fiche CH-06 et le § 16 de l'inventaire (`research/inv/inventaire_modules.md`). Chaque point contesté a été revérifié à la source pour ce cahier (§ 1).

**Conventions**
- **[P] PROUVÉ** : bytecode `Classe.méthode@offset` (désassemblages dans `scratchpad/ch/CH-06/jp/`, versions condensées dans `ch/CH-06/cz/`, `ch/CH-06/x/ck.txt` pour `costcontrol.ConditionKind$Kind`), libellé `Strings.db (classe|id)`, données de la base de test `dstest/deltasub.sqlite` (copie fidèle de la base du bureau, toutes les collections du chantier importées, dernier auteur « import Deltaproject » partout).
- **[D] DÉDUIT** : interprétation cohérente, non démontrée ligne à ligne.
- **[C] CHOIX** : décision de conception pour DeltaSub, signalée à Paulo (§ 7 et § 11).

**Références DeltaSub.** `DeltaSub.html` du dépôt au 01.10.2026 : 21 887 lignes, md5 `df42ee3eaff3df24052b96479d7fd93e`, commit `9f184fe`. `serveur_deltasub.py` du même commit. Le fichier change pendant le travail des chantiers parallèles : **seules les ancres textuelles du § 9 font foi**, les numéros de ligne sont indicatifs.

**Aucune donnée personnelle** : identifiants, compteurs, libellés d'interface. **Aucun contenu CRB** : les plans comptables ne sont décrits que par leurs identifiants, leurs compteurs et la longueur de leurs codes ; aucun `TEXT1` / `TEXT2` de `catalogpos` ne figure ici ni ne doit figurer dans un fichier du chantier (code, tests, captures, comptes rendus).

**Lien avec la demande en cours de Paulo** (réimporter les données Deltaproject dans la base du bureau) : aujourd'hui, aucune collection du chantier n'a été modifiée dans DeltaSub (dernier auteur « import Deltaproject » partout, `rech_exist` § 0). Un ré-import fait **avant** l'intégration de CH-06 ne perd donc rien de ce chantier. Après l'intégration, la protection du § 3.3 devient indispensable.

---

## 0. Synthèse

1. **Un squelette commun pour 15 catégories** (§ 4.2) : une ou deux tables (groupes | éléments) dans le panneau droit de l'Administrateur, chacune avec sa barre `+ E − ⤒ ↑ ↓ ⤓` ; un dialogue par entité aux champs **« Deutsch / Français / Italiano / English »** (64 caractères) ; **OK grisé tant que le nom français est vide** ; ordre `SORTORDER` dense 1..n renuméroté à chaque création, édition, déplacement, suppression ; suppression précédée de la question « Voulez-vous vraiment supprimer cette inscription ? » (titre « Avertissement », Oui / Non), et, pour 4 entités, d'un contrôle d'usage (« Cette inscription est déjà utilisée et⏎ne peut pas être supprimée. »). Supprimer un groupe supprime ses éléments.
2. **Tables multilingues** : les 4 noms côte à côte, chaque en-tête écrit dans sa langue (« Projekteigenschaft | Genre d'affaire | Genero di progetto | Project type »). C'est le cœur de « l'édition complète » : DeltaSub n'édite aujourd'hui que le français.
3. **Six catégories absentes ajoutées** : Genres d'affaires, Séances, Types de plans (lot 1) ; Groupes de conditions, Blocs de texte (type « texte ») (lot 2) ; Plans comptables (lot 3, contenu CRB édité seulement sur la base).
4. **Navigateur « Sélection des conditions »** branché dans le contrôle des coûts (contrat et paiement hors contrat), entrée « Navigateur … » : sélection multiple, tout le groupe sélectionné, **remplacement** des conditions du document avec la correspondance Type → genre CC prouvée au bytecode (§ 4.7).
5. **Édition complète des 7 catégories partielles** (lot 4) : groupes de propriétés, statuts, phases et phases partielles (numéro unique, Remarque, bouton « Phases et phases partielles standards »), groupes et types d'activités, groupes, unité et prix des frais, Tarifs et Jours fériés en 4 langues avec leur ordre.
6. **Libellés et ordre de l'original** pour la liste des catégories : « Phases », « Activités », « Frais » (au lieu de « … standard »), ordre de `AdminDialog$Menu` (§ 4.1).
7. **Droits** : les 5 catégories nouvelles de `adminProjects` et les 3 renommées sont ajoutées à `CH08A_ADM` (sinon visibles par tout titulaire de `admin`).
8. **Protection au ré-import** : les référentiels de l'Administrateur touchés dans DeltaSub (vivants **ou supprimés**) sont conservés par `importer_dans_deltasub.sh`, sur le modèle `CH08_PIT` (§ 3.3).
9. **Aucun document imprimé** ni export dans l'Administrateur de l'original (§ 5).
10. **Plan : 4 lots** (§ 10) : `ch06a` socle + lot 1 de la fiche, `ch06b` conditions et blocs, `ch06c` plans comptables, `ch06d` édition complète.

---

## 1. Arbitrages entre les sources (tranchés à la source)

| # | Sujet | Affirmations en présence | Verdict | Preuve |
|---|---|---|---|---|
| 1 | Champs de langue des dialogues | `spec_1` § 2.5 : un seul champ « Français » ; `rech_exist` § 1.4 n° 7 : libellés à trancher (« Allemand… » ou « Deutsch… ») | **4 champs, de haut en bas « Deutsch », « Français », « Italiano », « English »** (chaque langue écrite dans sa langue), 64 caractères (255 pour les conditions). `spec_1` décrivait le manuel v14 | [P] `ProjectKindDialog.<init>@92-131` (`Strings$Label.german/french/italian/english`) ; `Strings.db (rsrc|Strings|german…)` fr = « Deutsch », « Français », « Italiano », « English » ; `lang4` de DeltaSub a déjà ces libellés |
| 2 | Propriétés : arbre à 2 niveaux avec infobulles (« Ajouter un groupe », « Déplacer au début »…) | `spec_1` § 2.5 (manuel v14) | **Deux tables** (groupes \| propriétés), **icônes sans libellé ni infobulle** | [P] `AddressPropertiesFrame` : 92 références `JTable`, aucune `JTree`, aucun `setToolTipText` ; `Strings.db` n'a aucune clé d'infobulle pour `AddressPropertiesFrame` |
| 3 | Règle OK | `rech_orig` : « Français non vide », test sur le texte brut (un espace suffit) | Original : `isEmpty` sur le texte brut, puis `trim()` à l'enregistrement (un nom « » peut donc être enregistré). DeltaSub : **OK grisé tant que `trim()` est vide** [C] (écart de robustesse E3) | [P] `ProjectKindDialog.checkGuards@0-127`, `jOkButtonActionPerformed@0-75` |
| 4 | Contrôle d'usage à la suppression | `rech_exist` § 3.3 : « comportement à établir » ; `rech_exist` § 1.4 n° 5 cite le refus CH-17 « Ce groupe ne peut pas être supprimé… » | **Seuls** Genre d'affaire, Groupe d'affaires, Propriété, Groupe de propriétés ont un contrôle (`msgEntryIsNotDeletable`) ; Catalogue a ses 2 refus propres. **Tous les groupes sont supprimés en cascade** avec leurs éléments (pas de refus « groupe non vide », propre aux frais **d'affaire** de CH-17) | [P] seuls `ProjectGroupDialog`, `ProjectKindDialog`, `PropertyDialog`, `PropertyGroupDialog` référencent `db/Integrity` ; `@OneToMany(cascade=ALL)` (`v_db.admin.BoilerplateGroup.txt` etc.) ; `CatalogDialog.deleteCatalog@22-185` |
| 5 | Statut d'adresse utilisé | `rech_orig` : l'original ne contrôle rien et échoue sur la clé étrangère | **Refus DeltaSub** avec le message commun [C] (E4) : 22 adresses portent un statut au bureau, un `DS.commit` réussirait et laisserait des adresses pointant vers un statut supprimé | [P] `ContactStateDialog` : aucune référence à `Integrity` ; FK `CONTACT.CONTACTSTATE_ID` (`schema.txt`) ; données : statut 101 → 11 adresses |
| 6 | Colonnes des conditions | `rech_exist` § 6 : « Condition, Genre, Prix, %, Quantité » | **7 colonnes** : 4 noms « Kondition \| Condition \| Condizioni \| Condition », « Genre », « Prix », « % ». « Quantité » existe dans `Strings.db` mais n'est pas utilisée | [P] `InvoiceConditionTableModel.<clinit>@8-103` ; `Strings.db (InvoiceConditionTableModel|quantityCol)` non référencé |
| 7 | Blocs de texte : quels groupes dans l'Administrateur | `rech_exist` § 6 : « tous types, type éditable ? » | **Seulement les groupes de type 0 (`text`)** ; le type est fixé par la fenêtre, jamais saisi. Le type 1 reste dans la Planification RH (`ppBoilerplates`, intact) | [P] `BoilerplateFrame.setFrame@6-13` (`new BoilerplateFrame(Type.text)`), `BoilerplateGroup.findByType` |
| 8 | Conversion Type de condition → genre du contrôle des coûts | `rech_exist` § 1.3 : table proposée « à confirmer » | **Confirmée** telle quelle ; les codes de `ConditionKind$Kind` sont exactement les clés de `COND` de DeltaSub (1 `rebate` … 22 `othersPauschal`). Montant, Rabais, Escompte et TVA ignorent `ISPERCENT` | [P] `ContractBookDialog.openBrowser@188-902` ; `ConditionKind$Kind.<clinit>` (`x/ck.txt` : `rebate` 1, `reduction` 2, `cashDiscount` 3, `garantyProc` 4, `garantyPauschal` 5, `tvaProc` 6, `roundProc` 7, `recyclingCharge` 8/9, `contructionCleaning` 10/11, `publicitySignboard` 12/13, `insurance` 14/15, `energyCosts` 16/17, `waterCosts` 18/19, `situation` 20) |
| 9 | Colonne « M » d'une condition importée dans le CC | `rech_orig` : `retenue ? false : true` | **Confirmé** : M = faux pour le Type « Retenue », vrai sinon. Dans DeltaSub, c'est `appliquee` (colonne « M » de `condTable`, `spec_11` l. 1580) | [P] `ContractBookDialog.openBrowser@931-963` ; `Strings.db (ContractBookDialog|condApplyCol)` = « M » |
| 10 | Référence d'une condition importée | non traité | **Corrigée** après insertion : si N° ≤ Référence, la Référence devient N° − 1 | [P] `ContractBookDialog.openBrowser@979-1127` |
| 11 | Remplacement de la TVA 7.7 par 8.1 dans le navigateur | `rech_exist` § 3.4 (repris de la Soumission) | **Pas dans le contrôle des coûts** : le prix est recopié tel quel (`String.valueOf(7.7)`). La proposition de remplacement est propre aux navigateurs de la Soumission (`svbBrowser`), hors chantier | [P] `ContractBookDialog.openBrowser@910-920` |
| 12 | Déclencheur du navigateur dans le CC | « bouton à côté de Nouvelle condition » (`rech_exist` § 5) | Original : entrée **« Navigateur … »** du menu contextuel de la table des conditions et du menu du bouton « insérer », dans `ContractBookDialog` (contrats, avenants) et `GeneralPaymentBookDialog` (paiement **hors contrat**) seulement ; ni le paiement sur contrat (`PayBookDialog`) ni l'arrêté de compte. DeltaSub : bouton « Navigateur … » dans la barre de `condTable` de ces deux dialogues [C] (E8) | [P] `ContractBookDialog@11374`, `@14107`, `GeneralPaymentBookDialog@7511`, `@13000` (`JMenuItem`, `mapStringWithEllipsis(condBrowser)`) ; seuls ces deux dialogues du CC appellent `browseInvoiceConditionList` |
| 13 | Ouverture du navigateur de conditions | « tout sélectionné » | Aucun groupe présélectionné ; au choix d'un groupe, **toutes ses conditions sont sélectionnées** ; OK si au moins une condition sélectionnée ; aucun message quand il n'y a aucun groupe (tables vides, OK grisé) | [P] `InvoiceConditionBrowserDialog.setInvoiceConditionGroupTable`, `setInvoiceConditionTable@58-76` (`selectAll`) |
| 14 | En-têtes « N° » et « Remarque » des phases | `rech_orig` : « Nr. \| … \| Remarque » | **« N° »** et **« Remarque »** : ces deux colonnes prennent la langue du dialogue ; seules les colonnes de nom sont dans leur propre langue | [P] `PhaseTableModel.<clinit>@18-87` (`mapString` sans langue pour `phaseNrCol`, `descriptionCol`) ; `Strings.db (PhaseTableModel|phaseNrCol)` fr « N° » |
| 15 | Navigateur des blocs de texte | `rech_orig` § 6.4 : à reprendre comme outil commun | **Déjà livré** deux fois (`ch03cBlocs` type 0 pour « Partager le PDF », `ppTextBrowse` type 1). CH-06 ne fournit que l'**éditeur** du type 0 ; aucune factorisation des copies existantes (blocs d'autres chantiers) [C] | `rech_exist` § 1.3 ; `DeltaSub.html` (`function ch03cBlocs`, `function ppTextBrowse`) |
| 16 | Protection au ré-import | `rech_orig` § 15 : `PROTECTED_IF_EDITED` ; `rech_exist` § 4 : modèle `CH08_PIT` | **Modèle `CH08_PIT`** (vivants **et** supprimés), ensemble propre `CH06_PIT` et fonction `_ch06_touched` ; `PROTECTED_IF_EDITED` ferait revenir une ligne supprimée dans DeltaSub | [P] `serveur_deltasub.py` : `_batiment_edites` ne lit que `val IS NOT NULL` ; `_ch08_touched` lit aussi les suppressions |
| 17 | Message d'unicité des numéros de phase | « numéro unique » | **Couple (numéro, remarque)** unique parmi les autres phases ; numéro unique **dans la phase** pour une phase partielle ; message « Ce numéro est déjà utilisé. », titre « Avertissement », le dialogue reste ouvert | [P] `PhaseDialog.jOkButtonActionPerformed@20-103` ; `SubPhaseDialog` ; `Strings.db (PhaseDialog|msgNumberNotUnique)` |
| 18 | Boutons de Tarifs et Jours fériés | non établi | **Barre complète `+ E − ⤒ ↑ ↓ ⤓`** comme les autres listes | [P] `RateFrame` (`jMoveTopButton`… `jMoveBottomButton`), `PublicHolidaysFrame` (`jMoveItemTopButton`…) |
| 19 | Langues d'un plan comptable | `LANG_T` de DeltaSub (« Allemand… ») | **« Deutsch », « Français », « Italiano », « English »** (codes 1 à 4) | [P] `app.DocumentLanguages$Language.<clinit>@4-42` (littéraux) |

---

## 2. Périmètre

### 2.1 Reproduit (fidèle)

- Liste des catégories : libellés, ordre, filtre par droit (§ 4.1).
- Genres d'affaires (groupes, genres), Séances, Types de plans (groupes, types, Code) (§ 4.3 à 4.5).
- Groupes de conditions et leurs conditions (Type, Référence, Prix, Unité) (§ 4.6) ; navigateur « Sélection des conditions » dans le contrôle des coûts (§ 4.7).
- Blocs de texte, groupes de type « texte » (§ 4.8).
- Plans comptables : catalogues (Nom, Langue, Masqué, cadenas des catalogues standard), positions (N°, 2 lignes de texte), refus de suppression (§ 4.9).
- Adresses - Propriétés et Adresses - Statuts, Phases, Activités, Frais, Tarifs de facturation, Jours fériés : 4 langues, ordre, groupes éditables, champs manquants, contrôles (§ 4.10 à 4.16).
- Messages : suppression, refus d'usage, refus des catalogues, numéro déjà utilisé, phases standard.

### 2.2 Adapté (DeltaSub)

- Tables et dialogues dans le style DeltaSub (`grid`, `phead`, `dialog`) ; boutons d'icône avec infobulles sobres (l'original n'en a pas) (E2).
- Sélection simple dans les tables de l'Administrateur [D] (les boutons E et − de l'original n'agissent que sur la ligne sélectionnée).
- Plusieurs postes : version lue à l'ouverture des dialogues (`bseq`, conflit 409), ligne relue avant édition (`ch17aFresh`), message « Cette inscription a été supprimée sur un autre poste. » (`CH17A_MSG.gone`).
- Ordre des boutons de dialogue : toujours « Annuler » puis « OK » (l'original met OK d'abord dans `PhaseDialog` et `CatalogDialog`) (E6).

### 2.3 Hors chantier (et pourquoi)

| Élément | Où |
|---|---|
| Copies d'affaire : « Configurer les séances / types de plans / plans comptables / phases / activités » et leurs « Importer de l'administrateur » | CH-05 (lot 3 : `CatalogBrowserDialog`), CH-15, CH-16 ; ils liront les référentiels tels que CH-06 les édite |
| « Masqué » appliqué aux navigateurs de catalogues | CH-05 lot 3 (décision n° 4) ; l'original ne l'applique nulle part |
| Navigateur des blocs dans l'éditeur de texte des documents (Insérer ▸ bloc de texte) | CH-14 (éditeur de modèles) ; `ch03cBlocs` est prêt |
| Navigateurs de conditions de la Soumission (`svbBrowser`, `svdCondFromTemplate`), libellés de « Comparaison des offres » (`svbAdmPane` : « Français / Allemand… ») | EC-1 |
| Modèles externes, Rubriques, Nomenclature (masqués au bureau) | CH-13 |
| Choix des CFC des adresses (`BkpBrowserDialog`) | CH-04 |
| Configuration du contrôle des coûts (libellés des genres de conditions) | CH-07 |

---

## 3. Modèle de données

### 3.1 Collections (toutes déjà importées ; aucune nouvelle collection)

| Collection | Champs écrits | Clé de groupe | Ordre |
|---|---|---|---|
| `projectgroup` | `ID, NAMEGE, NAMEFR, NAMEIT, NAMEEN, SORTORDER` | — | `SORTORDER` |
| `projectkind` | idem + `PROJECTGROUP_ID` | `PROJECTGROUP_ID` | `SORTORDER` dans le groupe |
| `meetingtype` | `ID, NAME×4, SORTORDER` | — | `SORTORDER` |
| `plangroup` | `ID, CODE, NAME×4, SORTORDER` | — | `SORTORDER` |
| `plantype` | idem + `PLANGROUP_ID` | `PLANGROUP_ID` | `SORTORDER` |
| `invoiceconditiongroup` | `ID, NAME×4, SORTORDER` | — | `SORTORDER` |
| `invoicecondition` | `ID, NAME×4, TYPECODE, REFERENCESTEP, PRICE, ISPERCENT (0/1), SORTORDER, INVOICECONDITIONGROUP_ID` | `INVOICECONDITIONGROUP_ID` | `SORTORDER` |
| `boilerplategroup` | `ID, NAME, SORTORDER, TYPECODE (0)` | — | `SORTORDER` (type 0 seulement) |
| `boilerplateitem` | `ID, NAME, TEXT, SORTORDER, BOILERPLATEGROUP_ID` | `BOILERPLATEGROUP_ID` | `SORTORDER` |
| `catalog` | `ID, NAME, LANGUAGECODE (1-4), ISHIDDEN (0/1), ISSTANDARDCATALOG (0 à la création, jamais modifié), SORTORDER` | — | `SORTORDER` |
| `catalogpos` (HEAVY : `DS.need`) | `ID, CODE, TEXT1, TEXT2, CATALOG_ID` | `CATALOG_ID` | `CODE` (comparaison de chaînes, § 4.9) |
| `propertygroup` / `property` | `NAME×4, SORTORDER` (+ `PROPERTYGROUP_ID`) | `PROPERTYGROUP_ID` | `SORTORDER` |
| `contactstate` | `ID, NAME×4, SORTORDER` | — | `SORTORDER` |
| `phase` | `ID, NUMBER, NAME×4, DESCRIPTION` (pas de `SORTORDER`) | — | sans remarque d'abord, puis `NUMBER` |
| `subphase` | `ID, NUMBER, NAME×4, PHASE_ID` | `PHASE_ID` | `NUMBER` |
| `activitygroup` | `ID, NAME×4, DESCRIPTION, SORTORDER` | — | `SORTORDER` |
| `activity` | `ID, NAME×4, TYPECODE, SORTORDER, ACTIVITYGROUP_ID` | `ACTIVITYGROUP_ID` | `SORTORDER` |
| `costcategorygroup` | `ID, NAME×4, DESCRIPTION, SORTORDER` | — | `SORTORDER` |
| `costcategory` | `ID, NAME×4, UNIT, UNITPRICE, SORTORDER, COSTCATEGORYGROUP_ID` | `COSTCATEGORYGROUP_ID` | `SORTORDER` |
| `rate` | `ID, NAME×4, RATE, VALIDFROM, SORTORDER` | — | `SORTORDER` |
| `publicholiday` | champs existants + `NAME×4, SORTORDER` | — | `SORTORDER` |

`NAME×4` = `NAMEGE, NAMEFR, NAMEIT, NAMEEN`. Les champs texte sont enregistrés `trim()` ; une langue laissée vide est enregistrée `null` (comme `readK`) [C] — l'original écrit `""` ; aucun lecteur DeltaSub ne distingue les deux (`nm` teste la vacuité) [D].

**Règles d'écriture communes** [P] (`rech_orig` § 2.5, § 2.7) :
- nouvel élément : `SORTORDER = nombre de lignes de la table (du groupe) + 1` (`ch17aNext`) ; nouvel élément d'un groupe : clé de groupe = groupe sélectionné, **jamais modifiable ensuite** ;
- édition : la ligne, puis renumérotation 1..n des lignes de la même table dont le rang change (`ch17aRenum`) ;
- déplacement : `ctReorder` (⤒ 0, ↑ −2, ↓ +2, ⤓ n+1, tri stable, 1..n), lignes changées seulement (`ctMoveRec`) ;
- suppression d'un élément : `val:null` + renumérotation des suivantes ; d'un groupe : groupe + **tous ses éléments** + renumérotation des groupes ;
- **un seul `DS.commit` par action**, `bseq` lu à l'ouverture pour la ligne éditée ou supprimée.

### 3.2 Valeurs par défaut à la création [P]

| Entité | Défauts |
|---|---|
| Condition | `TYPECODE 0`, `REFERENCESTEP 0`, `PRICE 0`, `ISPERCENT 0` (`InvoiceCondition.<init>@4-26`, exécuté) |
| Activité | `TYPECODE 0` (« Affaires ») (`Activity.<init>@5-11`) ; à l'affichage, `TYPECODE` vide = 0 (20 activités au bureau) |
| Catalogue | `LANGUAGECODE null` (à choisir : OK grisé), `ISHIDDEN 0`, `ISSTANDARDCATALOG 0` |
| Groupe de blocs | `TYPECODE 0` |
| Genre de frais | `UNIT null`, `UNITPRICE 0` |
| Phase | `DESCRIPTION null` |

### 3.3 Protection au ré-import (serveur)

[C] sur le modèle `CH08_PIT` (arbitrage 16), dans `serveur_deltasub.py` :

```python
# ── CH-06 lot 1 ── Référentiels de l'Administrateur : un enregistrement touché dans DeltaSub (dernier auteur ≠ IMPORT_WHO),
# vivant OU supprimé, est conservé tel quel au ré-import (--force) ; les autres sont rafraîchis depuis Deltaproject.
CH06_PIT = {"projectgroup", "projectkind", "meetingtype", "plangroup", "plantype", "invoiceconditiongroup",
            "invoicecondition", "boilerplategroup", "boilerplateitem", "catalog", "catalogpos", "propertygroup",
            "property", "contactstate", "phase", "subphase", "activitygroup", "activity", "costcategorygroup",
            "costcategory", "rate", "publicholiday",
            "taskgroup", "task", "invoiceposgroup", "invoicepos", "bidcriteriongroup", "bidcriterion", "targettime"}

def _ch06_touched(c):
    """{(t, id)} des collections CH06_PIT dont le dernier auteur n'est pas l'import, suppressions comprises (val NULL)."""
    ...même requête que _ch08_touched sur CH06_PIT...
    print("Référentiels de l'Administrateur modifiés dans DeltaSub, conservés tels quels : %d enregistrement(s), dont %d suppression(s)." % (…))
# ── fin CH-06 lot 1 ──
```

- La dernière ligne de l'ensemble (`taskgroup` … `targettime` : catégories déjà « présentes » dont les éditions DeltaSub sont aussi perdues aujourd'hui) est le choix par défaut de la décision n° 1.
- Deux remplacements dans `import_deltaproject` (ancres S2 et S3 du § 9) : `pie = sorted(PROTECTED_IF_EDITED | CH08_PIT | CH06_PIT)` et une ligne `kept |= _ch06_touched(c)   # CH-06` après celle de CH-08.
- Les identifiants : `new_ids` repart du maximum des `id` présents (lignes supprimées comprises) après la remise à zéro des compteurs. Un ID créé dans DeltaSub et plus tard dans Deltaproject entrerait en collision ; risque négligeable, le bureau ne saisit plus les référentiels dans Deltaproject [D]. Aucun message de collision propre à CH-06.

---

## 4. Écrans et dialogues

### 4.1 Liste des catégories (`VIEWS['config']`)

**Ordre et libellés** [P] (`AdminDialog$Menu`, `Strings.db (AdminDialog|admin*)`), droit entre parenthèses :

1. Adresses - Propriétés (`adminAddresses`) — lot 4
2. Adresses - Statuts (`adminAddresses`) — lot 4
3. Plans comptables (`adminBkp`) — lot 3
4. Genres d'affaires (`adminProjects`) — lot 1
5. **Phases** (`adminProjects`) — lot 4 (ex « Phases standard »)
6. **Activités** (`adminProjects`) — lot 4 (ex « Activités standard »)
7. **Frais** (`adminProjects`) — lot 4 (ex « Frais standard »)
8. Séances (`adminProjects`) — lot 1
9. Types de plans (`adminProjects`) — lot 1
10. Blocs de texte (`adminProjects`) — lot 2
11. Gabarits de facturation (`adminProjects`) — présent
12. Comptes pour QR-facture (`adminQRBillAccounts`) — présent
13. Groupes de conditions (`adminProjects`) — lot 2
14. Comparaison des offres (`adminProjects`) — présent
15. Tâches (`adminProjects`) — présent
16. Tarifs de facturation (`adminRates`) — lot 4 (4 langues)
17. Heures prévues (`adminTargetTime`) — présent
18. Jours fériés (`adminPublicHolidays`) — lot 4 (4 langues)

(« Taux de TVA » reste retiré par `ch08aAdmCats`.)

**Mécanique** :
- `ch06aCats(cats)` (lot 1) : renomme les 3 catégories, ajoute les nouvelles **dont le panneau est chargé** (`typeof ch06bCond==='function'` pour « Groupes de conditions », etc.), puis classe selon `CH06A_ORDER` ; une catégorie inconnue (chantier futur) est gardée en fin de liste. Branchement : `rows:ch08aAdmCats(typeof ch06aCats==='function'?ch06aCats(cats):cats)` (ancre A2). Le filtre par droit s'applique après le renommage.
- `CH08A_ADM` complété (ancre A3) : `'Genres d\'affaires'`, `'Phases'`, `'Activités'`, `'Frais'`, `'Séances'`, `'Types de plans'`, `'Blocs de texte'`, `'Groupes de conditions'` → `adminProjects` (les anciennes clés « … standard » restent, sans effet).
- `ch06aPane(R,c)` (lot 1) en tête de `admPane` (ancre A1) : aiguille les catégories de CH-06 vers leur panneau ; renvoie `false` pour les autres. Tant que le lot 4 n'est pas chargé, « Phases » / « Activités » / « Frais » sont dessinés par l'ancienne branche : `admPane(R,'Phases standard')` (pas de récursion : `ch06aPane` ne connaît pas les anciens noms). Le lot 4 intercepte aussi « Adresses - Propriétés », « Adresses - Statuts », « Tarifs de facturation », « Jours fériés » : les anciennes branches de `admPane` deviennent mortes mais **restent intactes** (on pourra les retirer plus tard).
- État de sélection gardé hors du redessin (la vue `config` se redessine à chaque changement de collection) : `ADM.ch06 = {<catégorie>: {g:{}, i:{}}}` (objets d'état de `grid`).
- Catégorie mémorisée : `ADM.cat` reste en mémoire (pas de préférence `lastAdminMenuSelection`) (E9).

### 4.2 Moteur commun (lot 1 ; repris par les lots 2 à 4)

**Disposition** [P] (`rech_orig` § 2.1-2.2) : panneau à **une** table, ou **deux** panneaux côte à côte à 50 % (groupes | éléments), chacun avec sa barre au-dessus de sa table (`phead`). Tables sans tri par en-tête (`ctNoSort`) : l'ordre est celui du § 3.1.

**Barres** : `+` (Nouveau), `E` (Editer), `−` (Supprimer), `⤒ ↑ ↓ ⤓` (`ctMoveBtns`, infobulles `CT_MV`). Variantes : positions de plan comptable `+ E −` ; phases `+ E −` + bouton « standard » ; phases partielles `+ E −`.

**Activation** [P] (`checkGuards` des fenêtres) :
- groupe : `E`, `−` si un groupe est sélectionné ; `⤒ ↑` si sa ligne > 0 ; `↓ ⤓` si sa ligne < n−1 ;
- éléments : `+` si un groupe est sélectionné ; `E`, `−` si un élément est sélectionné ; flèches selon sa position dans la table ;
- table unique : `+` toujours ; les autres comme un élément.
- Double-clic sur une ligne = `E` de sa table. Changer de groupe vide la sélection d'élément ; sans groupe, la table des éléments est vide.

**Dialogue d'édition `ch06aDlg(o)`** :
- titre « nouveau » / « éditer » propre à l'entité ; champs : éventuels champs placés avant (Numéro, Code), puis **Deutsch, Français, Italiano, English** (`maxlength` 64, ou 255 pour les conditions), puis les champs propres (Remarque, Type, Unité, Prix…) ;
- **OK grisé** tant que `NAMEFR.trim()` est vide ou qu'une condition propre n'est pas remplie (recalcul à chaque frappe, `input`) ;
- à l'ouverture d'une édition : ligne relue (`ch17aFresh`) — si elle a disparu, toast `CH17A_MSG.gone` et pas de dialogue ; `bseq` lu à ce moment ;
- à l'OK : opérations du § 3.1 en un `DS.commit` ; conflit 409 → le dialogue reste ouvert (comportement de `dialog`), les tables se redessinent avec la version à jour ; la sélection passe sur la ligne créée ou éditée.

**Suppression `ch06aDel(o)`** [P] :
1. contrôle d'usage éventuel → `ctMsg('Avertissement', CH06A_MSG.used)` et arrêt ;
2. `ivAsk('Avertissement', CH06A_MSG.del)` (Oui / Non) ;
3. commit : ligne (`bseq`), éléments du groupe si c'est un groupe, renumérotation des suivantes.

**Messages** (`CH06A_MSG`, [P] `Strings.db rsrc`) :
- `del` : « Voulez-vous vraiment supprimer cette inscription ? » ;
- `used` : « Cette inscription est déjà utilisée et\nne peut pas être supprimée. » ;
- `num` : « Ce numéro est déjà utilisé. » ;
- `gone` : celui de CH-17 (« Cette inscription a été supprimée sur un autre poste. »).

**Colonnes de langue** `ch06aLangCols(heads)` : 4 colonnes `NAMEGE | NAMEFR | NAMEIT | NAMEEN`, en-têtes donnés dans l'ordre DE, FR, IT, EN ; les cases vides restent vides (au bureau, beaucoup d'entrées n'ont que le français, comme dans l'original).

### 4.3 Genres d'affaires (lot 1)

- **Groupes** : « Gruppe | Groupe | Gruppo | Group ». **Genres** : « Projekteigenschaft | Genre d'affaire | Genero di progetto | Project type ».
- Dialogues : « Nouveau groupe d'affaires » / « Editer le groupe d'affaires » ; « Nouveau genre d'affaire » / « Editer le genre d'affaire ». 4 langues ; OK = Français.
- Suppression : genre refusé s'il a un lien `project_projectkind` (`PROJECTKINDS_ID`) ; groupe refusé si l'un de ses genres en a un (`Integrity.isProjectGroupDeletable`). Sinon cascade. Les liens ne sont jamais modifiés ici.
- Consommateurs déjà présents (lecture) : Editer l'affaire, `mgPFdialog`, Management ▸ Genres d'affaires — ils suivent l'ordre `SORTORDER` modifié ici.

### 4.4 Séances (lot 1)

- Table unique « Besprechungsart | Genre de discussion | Genere di colloquio | Meeting type ».
- Dialogue « Ajouter un genre de discussion » / « Editer un genre de discussion » ; 4 langues ; OK = Français.
- Suppression : confirmation seule (les séances d'affaire sont des copies, CH-15).

### 4.5 Types de plans (lot 1)

- **Groupes** : 5 colonnes « Code | Plangruppe | Groupe de plans | Gruppi di piani | Plan type » ; **types** : « Code | Planart | Type de plan | Tipo di piano | Plan type » (« Plan type » en EN pour les groupes est une erreur de l'original, reproduite).
- Dialogues : « Nouveau groupe de plans » / « Editer un groupe de plans » ; « Nouveau type de plan » / « Editer un type de plan ». Champs : **Code** (64) **en premier**, puis les 4 langues. OK = Code (`trim`) non vide ET Français non vide. Pas d'unicité du code.
- Suppression : confirmation seule ; un groupe emporte ses types.

### 4.6 Groupes de conditions (lot 2)

- **Groupes** : « Gruppe | Groupe | Gruppo | Group ». **Conditions** : « Kondition | Condition | Condizioni | Condition | Genre | Prix | % ».
  - Genre = libellé du Type (`CH06B_TYPES`) ; Prix : `num(PRICE,2)` avec séparateur « ' » (« 0.00 », « -0.05 », « 7.70 ») ; % : « % » si `ISPERCENT`, sinon vide.
- **Types** [P] (`db.admin.InvoiceCondition|<nom>`) : 0 Montant, 1 TVA, 2 Rabais, 3 Escompte, 4 Retenue, 5 Taxes de recyclage, 6 Prorata, 7 Panneau publicitaire, 8 Assurance, 9 Frais en énergie, 10 Frais en eau, 11 Autres.
- **Groupe** : « Nouveau groupe » / « Editer le groupe » ; 4 langues (64) ; OK = Français.
- **Condition** : « Nouvelle position » / « Editer la position ». Champs de haut en bas : Deutsch, Français, Italiano, English (**255**) ; « Type » (liste des 12) ; « Référence » (chiffres seulement) ; « Prix » (nombre, signe admis, prérempli « 0.00 ») suivi d'une étiquette d'unité ; « Unité » : deux boutons radio « Monnaie de l'affaire » / « % ». L'étiquette après le Prix affiche « % » ou « Monnaie de l'affaire » selon le bouton.
  - OK = Français non vide ET Prix numérique ET **Référence non vide** [C] (l'original lève une exception si elle est vide : E5).
  - Le prix est enregistré **sans arrondi** (−0.05 reste −0.05).
- Suppression : confirmation seule ; un groupe emporte ses conditions.

### 4.7 Navigateur « Sélection des conditions » et contrôle des coûts (lot 2)

**Dialogue `ch06bCondBrowse(fn)`** [P] (`InvoiceConditionBrowserDialog`) :
- titre « Sélection des conditions » ; à gauche les groupes (1 colonne « Groupe », nom FR), à droite les conditions du groupe (1 colonne « Condition », `NAMEFR`), **sélection multiple** (`grid` `multi`) ;
- aucun groupe présélectionné ; au choix d'un groupe, **toutes** ses conditions sont sélectionnées ;
- OK actif si au moins une condition est sélectionnée ; double-clic = OK ; « Annuler » ne fait rien ;
- retour : les conditions sélectionnées **dans l'ordre des lignes** (`SORTORDER`).

**Branchement** : bouton « Navigateur … » ajouté à la barre de `condTable` (`CT.bar`) dans `ccContract` (contrat et avenant) et dans `ccPayment` **seulement pour un paiement hors contrat** (`!ctr`) (ancres C1, C2). Rien dans l'arrêté de compte (`ch01cEdit`) ni dans le paiement sur contrat [P].

**Conversion `ch06bCondRows(list)`** (fonction pure) : le tableau des conditions du document est **vidé puis remplacé** [P] ; pour la condition de rang `i` (0..n−1) :

```
{ niveau: i+1, reference: REFERENCESTEP (vide → 0), kind, genre: COND[kind][0], libelle: NAMEFR ?? '',
  refCond: '', valeur: PRICE, appliquee: TYPECODE !== 4 }
puis, ligne par ligne : si niveau ≤ reference → reference = i
```

| `TYPECODE` | `kind` si `ISPERCENT` | `kind` sinon |
|---|---|---|
| 0 Montant | 2 | 2 |
| 1 TVA | 6 | 6 |
| 2 Rabais | 1 | 1 |
| 3 Escompte | 3 | 3 |
| 4 Retenue | 4 | 5 |
| 5 Taxes de recyclage | 8 | 9 |
| 6 Prorata | 10 | 11 |
| 7 Panneau publicitaire | 12 | 13 |
| 8 Assurance | 14 | 15 |
| 9 Frais en énergie | 16 | 17 |
| 10 Frais en eau | 18 | 19 |
| 11 Autres | 21 | 22 |

Puis `recalc(true)` (recalcul et redessin du document). Aucun remplacement de la TVA (arbitrage 11).

### 4.8 Blocs de texte (lot 2)

- **Groupes** (type 0 seulement) : 1 colonne « Groupe » (`NAME`). **Blocs** : « Nom | Texte », Texte = 120 premiers caractères suivis de « … » si plus long (blancs non modifiés) [P].
- Barres complètes (§ 4.2).
- **Groupe** : « Nouveau groupe » / « Editer le groupe » ; champ « Nom » (64) ; OK = Nom non vide ; `TYPECODE 0` posé à la création, jamais modifié.
- **Bloc** : « Nouvelle description » (sic) / « Editer le bloc de texte » ; « Nom » (64) et « Texte » (zone multiligne, 4096) ; OK = Nom non vide ; `NAME` et `TEXT` enregistrés `trim()`.
- Suppression : confirmation seule ; un groupe emporte ses blocs (différent de `ppBoilerplates`, type 1, qui refuse un groupe non vide ; ce dernier reste inchangé).
- Le navigateur de « Partager le PDF » (`ch03cBlocs`) lit ces données sans changement.

### 4.9 Plans comptables (lot 3)

**Chargement** : `catalogpos` est HEAVY. Au premier affichage, « Chargement… » puis `DS.need(['catalogpos'])` et redessin si `ADM.cat` n'a pas changé (modèle `svbAdmPane`).

**Catalogues** (table de gauche, barre complète) : 4 colonnes [P] :
1. (sans titre, 20 px) icône cadenas (`ICO.lock`) si `ISSTANDARDCATALOG` ;
2. « Catalogue » (`NAME`) ;
3. « Langue » : « Deutsch » / « Français » / « Italiano » / « English » (`LANGUAGECODE` 1-4) ;
4. « Masqué » : ✔ si `ISHIDDEN` (affichage seul).

**Positions** (table de droite, barre `+ E −` seulement) : « N° | Texte 1ère ligne | Texte 2ème ligne » (col. N° 60 px). Tri **par `CODE`** en comparaison de chaînes simple (`a<b`, comme `String.compareTo`, pas `localeCompare`) ; après création ou édition, la ligne prend sa place dans ce tri. `+` si un catalogue est sélectionné ; `E`, `−` si une position l'est.

**Dialogue Catalogue** : titre « Catalogue » (création et édition) ; « Nom » (255), « Langue » (liste des 4, vide pour un nouveau catalogue), case « Masqué ». OK = Nom non vide ET Langue choisie. Un catalogue standard reste éditable (Nom, Langue, Masqué) ; `ISSTANDARDCATALOG` n'est jamais modifié.

**Suppression d'un catalogue** [P] (`CatalogDialog.deleteCatalog`) :
1. standard → `ctMsg('Information','Impossible de supprimer un catalogue standard.')` ;
2. a des positions → `ctMsg('Information','Impossible de supprimer un catalogue avec des positions.')` ;
3. sinon confirmation `del`, puis suppression et renumérotation des catalogues.

**Dialogue Position** : « Nouvelle position » / « Modifier la position » ; « Numéro » (6), « Texte 1ère ligne » (30), « Texte 2ème ligne » (30). OK = Numéro non vide ET Texte 1ère ligne non vide. Pas d'unicité du numéro. Les positions des catalogues standard sont modifiables. Une position importée dont `TEXT1` dépasse 30 caractères s'affiche entière ; à l'édition, le champ montre la valeur entière et `maxlength` n'empêche que la saisie au-delà [D]. Suppression : confirmation seule.

**« Masqué »** : enregistré et affiché seulement, **sans effet** ailleurs, comme 16.05 (décision n° 4).

**Fonction pure** `ch06cBkpText(t1,t2)` [P] (`CatalogPos.getBkpText`), mise à disposition de CH-04 / CH-05 :

```
t1 vide ou null → null ; t = trim(t1) ; t finit par « - » → t sans ce caractère, sinon t + " " ;
t2 non vide → t + t2 ; résultat trim(t)
```

**Licence CRB** : aucun texte de position dans le code ni dans les tests ; essais navigateur contrôlés par compteurs et identifiants ; aucune capture d'écran de la table des positions conservée.

### 4.10 Adresses - Propriétés (lot 4)

- **Groupes** : « Gruppe | Groupe | Gruppo | Group » ; **propriétés** : « Bezeichnung | Désignation | Designazione | Description ». Barres complètes.
- Dialogues : « Ajouter un groupe de propriétés » / « Modifier le groupe de propriétés » ; « Ajouter une propriété » / « Modifier la propriété ». 4 langues ; OK = Français. **Le groupe ne se choisit pas** : la propriété est créée dans le groupe sélectionné et n'en change plus (le sélecteur « Groupe » actuel disparaît).
- Suppression : propriété refusée si elle figure dans `contact_property` (`PROPERTIES_ID`) ; groupe refusé si l'une de ses propriétés est utilisée ; sinon cascade.

### 4.11 Adresses - Statuts (lot 4)

- Table unique « Status | Statut | Stato | State », barre complète.
- Dialogue « Ajouter un statut » / « Modifier le statut » ; 4 langues ; OK = Français.
- Suppression : **refus `used`** si une adresse a `CONTACTSTATE_ID` = ce statut [C] (arbitrage 5) ; sinon confirmation.

### 4.12 Phases (lot 4)

- **Phases** : « N° | Phase | Phase | Fase | Phase | Remarque » (N° 30 px). Ordre : phases **sans remarque d'abord**, puis par `NUMBER` [P] (`Phase.findAll`).
- **Phases partielles** : « N° | Teilphase | Phase partielle | Fase parziale | Subphase », ordre `NUMBER`.
- Barres : phases `+ E −` et bouton « Phases et phases partielles standards » (infobulle ; icône propre au lot) ; phases partielles `+ E −`. Pas de flèches.
- **Phase** : « Nouvelle phase » / « Editer la phase » ; « Numéro » (chiffres), 4 langues, « Remarque » (255). OK = Numéro non vide ET Français non vide. À l'OK, si une **autre** phase a le même numéro **et** la même remarque (vide = null) → `ctMsg('Avertissement', CH06A_MSG.num)`, dialogue gardé ouvert.
- **Phase partielle** : « Nouvelle phase partielle » / « Editer la phase partielle » ; « Numéro », 4 langues. OK = Numéro et Français. Numéro unique **dans la phase** (même message).
- Suppression : confirmation ; une phase emporte ses phases partielles.
- **Bouton standard** [P] (`PhasesFrame.jStandardButtonActionPerformed`, `initAllPhases`) :
  1. `ivAsk('Confirmation', 'Voulez-vous remplacer vos préréglages par les\nles phases et phases partielles standard?')` (« les » doublé et absence d'espace avant « ? » : texte de l'original) ;
  2. si Oui : **un seul commit** qui supprime toutes les `phase` et `subphase`, puis recrée depuis `CH06D_STDPH` dans l'ordre du fichier : un numéro à 1 chiffre crée une phase (numéro, 4 noms, sans remarque), les lignes suivantes deviennent ses phases partielles ;
  3. `CH06D_STDPH` est généré par le `build.py` du lot 4 à partir de `/Applications/DELTAproject.app/Contents/app/rsrc/app/lists/standardPhasesList.csv` (lecture seule, CSV UTF-8 à guillemets, colonnes numéro, DE, FR, IT, EN ; lignes à numéro vide ignorées) et embarqué dans le JS (décision n° 6).

### 4.13 Activités (lot 4)

- **Groupes** : « Tätigkeitsgruppe | Groupe d'activités | Gruppo di attività | Activity group | Remarque » ; **activités** : « Tätigkeit | Activité | Attività | Activity » (**le Type n'est pas affiché**, comme l'original). Barres complètes.
- Groupe : « Nouveau groupe d'activités » / « Editer le groupe d'activités » ; 4 langues, « Remarque » (255) ; OK = Français.
- Activité : « Nouvelle activité » / « Editer l'activité » ; 4 langues, « Type » (liste `ACT_T`, 12 valeurs dans l'ordre des codes) ; OK = Français. Créée dans le groupe sélectionné, n'en change plus.
- Suppression : confirmation ; cascade pour un groupe.

### 4.14 Frais (lot 4)

- **Groupes** : « Kostengruppe | Groupe de frais | Gruppi di costo | Gruppi di costo | Remarque » (en-tête EN fautif de l'original, reproduit) ; **genres** : « Kostenart | Genre de frais | Genere di costi | Cost category | Unité | Prix » (Prix : `ch17aN`).
- Groupe : « Nouveau groupe de frais » / « Editer le groupe de frais » ; 4 langues, « Remarque » (255) ; OK = Français.
- Genre : « Nouveau genre de frais » / « Editer le genre de frais » ; 4 langues ; « Unité » (16) suivie d'un bouton qui ouvre la liste des **21 suggestions** (`popMenu` : h, j, ms, se, gl, f, p, m, m2, m3, su, br, up, pa, ro, sa, hl, kJ, kg, l, t ; un clic remplit Unité) ; « Prix » (nombre, « 0.00 ») suivi de « Monnaie de l'affaire » ou « Monnaie de l'affaire / <unité> » (`ch17aUnitLbl('Monnaie de l\'affaire', unité)`). OK = Français ET Prix numérique. Créé dans le groupe sélectionné.
- Suppression : confirmation ; cascade pour un groupe (les genres sans groupe existants au bureau restent invisibles, comme dans l'original [D] : 0 au bureau).
- `ch17aStdOps` / `ch17aStdPick` (import standard de CH-17) lisent ces données sans changement.

### 4.15 Tarifs de facturation (lot 4)

- Table « Tarif | Qualification | Tariffa | Rate | Valable dès le | Tarif de facturation » (`VALIDFROM` en `dfr`, `RATE` en `num(…,2)`), ordre `SORTORDER`, barre complète.
- Dialogue « Nouveau tarif de facturation » / « Editer le tarif de facturation » ; 4 langues, « Tarif de facturation », « Valable dès le ». OK = Français ET Tarif numérique ET date remplie [P] (`RateDialog.checkGuards`).
- Suppression : confirmation seule.

### 4.16 Jours fériés (lot 4)

- Table « Feiertag | Le jour férié | Giorni festivi | Public holiday | Visible », puis la colonne DeltaSub « Date <année> » gardée en dernière position (E10), ordre `SORTORDER`, barre complète.
- Dialogue actuel conservé (type de date, jour/mois, jours après Pâques, Type, Visible), avec **4 langues** à la place de « Français », titres « Nouveau jour férié » / « Editer le jour férié ». OK = Français ET champ de la date choisie rempli [P] (`PublicHolidayDialog.checkGuards`).
- Suppression : confirmation seule.

### 4.17 Libellés de langue de Tâches (lot 4)

`admTasks` affiche « Allemand / Français / Italien / Anglais » : remplacement par « Deutsch / Français / Italiano / English » (ancre D1) [P] (`TaskDialog` utilise les mêmes `Strings$Label`). Le reste d'`admTasks` est inchangé.

---

## 5. Documents imprimés

**Aucun.** Aucune fenêtre ni aucun dialogue de `deltaproject.admin` n'appelle `doc.*`, une impression ou un export ; aucun type `.dpdoc` ne correspond à ces catégories [P] (`rech_orig` § 11). La seule entrée de fichier est la lecture du fichier des phases standard (§ 4.12), embarqué au build. Le socle d'impression de CH-01 et le stockage de CH-03 ne sont pas utilisés par ce chantier.

---

## 6. Valeurs de contrôle

Tests jsc par lot (`ch/CH-06/lotN/test_ch06x.js`), sur des données extraites de `dstest` (identifiants, compteurs, nombres ; **jamais** de `TEXT1`/`TEXT2`), plus contrôle de syntaxe du script complet.

### 6.1 Moteur et lot 1 (T1)

| # | Contrôle | Attendu |
|---|---|---|
| T1-1 | Groupes d'affaires triés | 12 ; premier ID 2, dernier ID 109 (3 genres) ; 69 genres au total |
| T1-2 | Genres du groupe 2 par `SORTORDER` | 4, 5, 6, 82, 7, 72 |
| T1-3 | Supprimer le genre 82 | refus `used` (6 liens) |
| T1-4 | Supprimer le groupe 2 / 3 / 102 | refus (11 / 8 / 1 liens) |
| T1-5 | Supprimer le groupe 1 | autorisé ; ops = 1 groupe + 6 genres + renumérotation des groupes suivants (le groupe 1 a `SORTORDER` 11 : seul le groupe 109 passe de 12 à 11) |
| T1-6 | Déplacements (`ctReorder`, valeurs exécutées sur l'original, `rech_orig` § 13.2), 5 séances T1..T5 | ↓ ligne 2 : T1 T3 T2 T4 T5 ; puis ↑ ligne 4 : T1 T3 T4 T2 T5 ; puis ⤒ ligne 5 : T5 T1 T3 T4 T2 ; puis ⤓ ligne 1 : T1 T3 T4 T2 T5 |
| T1-7 | Nouvelle séance | `SORTORDER` 9 |
| T1-8 | Types de plans du groupe 1 | 7 (codes A1-A7, IDs 1-6 et 106) ; OK grisé si Code vide |
| T1-9 | `ch06aCats` sur les 13 catégories actuelles, lots 1 à 4 chargés | 18 lignes dans l'ordre du § 4.1 (sans « Taux de TVA ») |
| T1-10 | `ch06aCats` avec le lot 1 seul | Genres d'affaires, Séances, Types de plans ajoutés ; « Phases » renommée et dessinée par l'ancienne branche |
| T1-11 | Serveur (Python, base copiée) | séance modifiée dans DeltaSub et séance supprimée dans DeltaSub conservées par un ré-import ; séance non touchée rafraîchie ; message « Référentiels de l'Administrateur… : 2 enregistrement(s), dont 1 suppression(s). » |

### 6.2 Lot 2 (T2)

| # | Contrôle | Attendu |
|---|---|---|
| T2-1 | Conditions du groupe 1 par `SORTORDER` | 1, 55, 56, 57, 58 |
| T2-2 | `ch06bCondRows` groupe 1 | niveaux 1-5 ; références 0, 1, 2, 3, 4 ; `kind` 1, 3, 4, 10, 6 ; valeurs 0, 0, −10, −0.05, 7.7 ; `appliquee` vrai, vrai, **faux**, vrai, vrai |
| T2-3 | `ch06bCondRows` groupe 51 | conditions 51, 52, 53, 54, 59 → `kind` 1, **2** (Montant, forfait), 3, **8** (Taxes de recyclage %), 6 |
| T2-4 | Référence trop grande | une condition seule avec `REFERENCESTEP` 5 → `reference` 0 |
| T2-5 | Colonne Prix | −0.05 → « -0.05 » ; 7.7 → « 7.70 » ; 1234.5 → « 1'234.50 » |
| T2-6 | Blocs : groupes de type 0 / 1 | 1 / 0 ; bloc ID 1 : 30 caractères (pas de « … ») ; texte de 130 caractères → 120 + « … » |
| T2-7 | Supprimer le groupe de blocs 1 | ops = groupe + 1 bloc |

### 6.3 Lot 3 (T3) — identifiants et compteurs seulement

| # | Contrôle | Attendu |
|---|---|---|
| T3-1 | Positions par catalogue | 100 : 803 ; 101 : 796 ; 102 : 796 ; 103 : 0 ; 110, 111, 112 : 337 ; 114 : 193 ; total 3 599 |
| T3-2 | Standard / visibles | standard 100-103 (langues 1-4) ; `ISHIDDEN` 0 : 101 et 111 seulement |
| T3-3 | Supprimer 101 / 103 / 110 | « …catalogue standard. » / « …catalogue standard. » / « …avec des positions. » |
| T3-4 | Tri des positions du 101 | premier code de longueur 1, croissant ; 10 codes à 1 caractère et 70 à 2 caractères (contrôle `feFactorsInit` inchangé) ; aucun doublon |
| T3-5 | `ch06cBkpText` (textes inventés, exécutés sur l'original) | (« Travaux prépa- », « ratoires ») → « Travaux préparatoires » ; (« ␣␣Gros oeuvre 1␣ », « ») → « Gros oeuvre 1 » ; (« », « x ») → null ; (« Abc -», null) → « Abc » |

### 6.4 Lot 4 (T4)

| # | Contrôle | Attendu |
|---|---|---|
| T4-1 | Supprimer la propriété 401 / 505 | refus (325 liens) / autorisé |
| T4-2 | Supprimer le groupe de propriétés 251 / 252 / 301 | refus (235 liens) / refus (326) / autorisé (2 propriétés, 0 lien) |
| T4-3 | Supprimer le statut 101 / 51 | refus (11 adresses) / autorisé |
| T4-4 | Ordre des phases | `NUMBER` 0..8 = IDs 102, 103, 101, 3, 51, 4, 5, 1, 2 ; une phase de remarque « X » passe après toutes |
| T4-5 | Unicité | phase n° 3 sans remarque → `num` ; phase n° 3 remarque « X » → acceptée ; phase partielle n° 32 dans la phase 3 → `num` ; n° 32 dans la phase 4 → acceptée |
| T4-6 | Phases standard | 6 phases (1-6), 12 phases partielles (11, 21, 22, 31, 32, 33, 41, 51, 52, 53, 61, 62) ; ops = 9 + 12 suppressions et 18 créations en un commit ; aucune remarque |
| T4-7 | Déplacer le genre de frais 7 (groupe 2) « Au début » | 7 → 1 ; 4, 5, 6 → 2, 3, 4 ; 153, 154, 158, 159, 162 inchangés |
| T4-8 | Étiquette du prix | unité vide → « Monnaie de l'affaire » ; « km » → « Monnaie de l'affaire / km » |
| T4-9 | Multilingue (lignes sans `NAMEGE`) | 3 statuts, 3 phases, 12 activités, 3 groupes d'activités, 19 genres de frais, 2 groupes de frais, 11 propriétés, 1 jour férié : cases DE vides affichées vides |

### 6.5 Essais navigateur (copie isolée, `ds_user` 2752)

- **B1** (lot 1) : Réglages ▸ Administrateur : 18 catégories dans l'ordre (lots chargés) ; Genres d'affaires : créer un genre dans le groupe 109 (SO 4), le monter en tête, le supprimer ; refus sur le genre 82 ; Séances : OK grisé tant que Français est vide ; un 2e onglet du même poste modifie une séance pendant qu'un dialogue d'édition est ouvert → OK donne le conflit 409, dialogue ouvert.
- **B2** (lot 2) : créer une condition (Retenue, %, −5, Référence 1) ; contrat du CC : « Navigateur … » ▸ groupe 1 → 5 conditions remplacent les précédentes, M décoché sur la retenue, totaux recalculés ; paiement sur contrat : pas de bouton ; Blocs de texte : créer un bloc, le retrouver dans « Partager le PDF » (`ch03cBlocs`).
- **B3** (lot 3) : chargement des positions, sélection du 101 (796 lignes), refus sur 101 et 110, création puis suppression d'un catalogue vide, création d'une position fictive « ZZ » dans un catalogue d'essai.
- **B4** (lot 4) : propriétés (groupe créé, propriété créée dedans, refus sur 401) ; phases (unicité, bouton standard sur la copie) ; frais (suggestions d'unité, étiquette) ; tarifs et jours fériés en 4 langues et déplacements ; libellés de Tâches.

---

## 7. Écarts assumés

| # | Écart | Raison |
|---|---|---|
| E1 | Sélection simple dans les tables de l'Administrateur | `grid` ; E et − de l'original n'agissent que sur une ligne [D] |
| E2 | Infobulles sur les boutons d'icône (« Nouveau », « Editer », « Supprimer », `CT_MV`) | l'original n'en a pas ; convention DeltaSub (CH-17, `admTasks`) |
| E3 | OK grisé si le nom français ne contient que des blancs | l'original accepte un espace puis enregistre un nom vide |
| E4 | Refus de supprimer un statut d'adresse utilisé | l'original échoue sur la clé étrangère ; DeltaSub n'a pas de contrainte et laisserait des adresses orphelines |
| E5 | OK grisé si la Référence d'une condition est vide | l'original lève une exception |
| E6 | « Annuler » puis « OK » partout | convention DeltaSub |
| E7 | Langue vide enregistrée `null` (et non `""`) | `readK` ; sans effet sur l'affichage |
| E8 | « Navigateur … » en bouton de la barre de `condTable` (et non en entrée de menu contextuel) | `condTable` n'a pas de menu contextuel ; même effet |
| E9 | Dernière catégorie mémorisée en mémoire seulement | `ADM.cat` existant ; pas de préférence `lastAdminMenuSelection` |
| E10 | Jours fériés : colonne « Date <année> » gardée, en dernier | fonction DeltaSub existante, utile au contrôle des heures prévues |
| E11 | Protection des référentiels au ré-import | n'existe pas dans Deltaproject (pas de ré-import) ; nécessaire à la reprise DeltaSub |

---

## 8. Écarts hors chantier signalés (non traités)

1. `importStdActivities` (l. 1259-1264) recalcule `SORTORDER` dans l'ordre de `DS.all`, pas du `SORTORDER` standard : visible dès que l'ordre des activités standard est édité (CH-05).
2. `svbAdmPane` (Comparaison des offres) : libellés « Français / Allemand / Italien / Anglais » et ordre FR d'abord (EC-1).
3. `ppBoilerplates` (Planification RH, type 1) refuse un groupe non vide alors que `BoilerplateFrame` le supprime en cascade (spec_10).
4. `ACT_T[55]` écrit « Conseil d’administration » (apostrophe typographique), `Strings.db` « Conseil d'administration » (sans effet).

---

## 9. Points d'ancrage DeltaSub

Toutes les ancres sont vérifiées par `grep -F -c` = 1 sur le fichier du 01.10.2026. Chaque `build.py` les revérifie sur le `DeltaSub.html` source passé en argument et échoue proprement si l'une manque ou est en double.

| Id | Ancre exacte (« ancien ») | Remplacement (« nouveau ») | Lot |
|---|---|---|---|
| A1 | `function admPane(R,c){` | `function admPane(R,c){ if(typeof ch06aPane==='function'&&ch06aPane(R,c)) return;` | 1 |
| A2 | `rows:ch08aAdmCats(cats)` | `rows:ch08aAdmCats(typeof ch06aCats==='function'?ch06aCats(cats):cats)` | 1 |
| A3 | `'Plans comptables':'adminBkp'};` | `'Plans comptables':'adminBkp','Genres d\'affaires':'adminProjects','Phases':'adminProjects','Activités':'adminProjects','Frais':'adminProjects','Séances':'adminProjects','Types de plans':'adminProjects','Blocs de texte':'adminProjects','Groupes de conditions':'adminProjects'};` | 1 |
| C1 | `CT=condTable(v,x=>recalc(x));` (dans `ccContract`) | idem + ` if(typeof ch06bCondNav==='function') CT.bar.append(ch06bCondNav(v,recalc));` | 2 |
| C2 | `()=>recalc(true)), CT=condTable(v,y=>recalc(y));` (dans `ccPayment`) | idem + ` if(!ctr&&typeof ch06bCondNav==='function') CT.bar.append(ch06bCondNav(v,recalc));` | 2 |
| D1 | `[['Allemand',F.NAMEGE],['Français',F.NAMEFR],['Italien',F.NAMEIT],['Anglais',F.NAMEEN]` | `[['Deutsch',F.NAMEGE],['Français',F.NAMEFR],['Italiano',F.NAMEIT],['English',F.NAMEEN]` | 4 |
| P0 | présence : `function ch17aOpen`, `const ch17aFresh=`, `function ch17aRenum`, `function ctReorder`, `function ctMoveBtns`, `function ivAsk`, `const lang4=`, `function ch08aAdmCats` | aucune modification (helpers réutilisés) | 1-4 |
| P1 | présence : `function ch06aPane` | aucune (le lot 1 doit être intégré) | 2-4 |
| S1 | `# ── fin CH-08 lot 1 ──` (serveur) | idem + bloc CH-06 du § 3.3 | 1 |
| S2 | `pie = sorted(PROTECTED_IF_EDITED \| CH08_PIT)` | `pie = sorted(PROTECTED_IF_EDITED \| CH08_PIT \| CH06_PIT)` | 1 |
| S3 | `kept \|= _ch08_touched(c)   # CH-08 : vivants ou supprimés, dernier auteur ≠ import` | idem + `\n    kept \|= _ch06_touched(c)   # CH-06 : référentiels de l'Administrateur` | 1 |

Dans C1 et C2, `recalc` est la fonction locale de `ccContract` / `ccPayment` ; `ch06bCondNav(doc,recalc)` renvoie le bouton, qui remplace `doc.conditions` puis appelle `recalc(true)`. Les anciennes branches de `admPane` (« Phases standard », « Activités standard », « Frais standard », « Adresses - … », « Tarifs … », « Jours fériés ») ne sont **pas** modifiées.

**Préfixes** : `ch06a` / `CH06A_` (lot 1), `ch06b` / `CH06B_` (lot 2), `ch06c` / `CH06C_` (lot 3), `ch06d` / `CH06D_` (lot 4) ; serveur `CH06_PIT`, `_ch06_touched`. Contrôle fait le 01.10.2026 : aucune occurrence de `ch06` / `CH06` dans `DeltaSub.html` ni dans `scratchpad/ch/*/` (hors fichiers de recherche de CH-06). Aucun nouveau nom `adm*`.

---

## 10. Plan en lots

Quatre lots, comme la fiche. Le socle commun (moteur, liste des catégories, droits, protection serveur) est placé dans le lot 1. Chaque lot : fichier JS séparé `ch/CH-06/lotN/ch06x.js` (déclarations de haut niveau seulement, aucun accès au DOM au chargement), `build.py` (chemin du `DeltaSub.html` source en argument, défaut : celui du dépôt ; ancres vérifiées), `lotN_integration.md` (remplacements « ancien → nouveau »), tests jsc, `DeltaSub.html` construit pour l'essai ; lot 1 : copie modifiée complète de `serveur_deltasub.py` + diff + test Python.

### Lot 1 — Socle et Genres d'affaires, Séances, Types de plans (préfixe `ch06a` / `CH06A_` ; serveur `CH06_PIT`)

- **Contenu** :
  - `CH06A_ORDER`, `CH06A_REN`, `ch06aCats`, `ch06aPane` (aiguillage par `typeof` vers les panneaux des lots 2 à 4, repli sur les anciennes branches) ; ancres A1, A2, A3 (§ 4.1) ;
  - moteur : `ch06aOne`, `ch06aTwo` (tables, barres, activation, double-clic, état `ADM.ch06`), `ch06aLangCols`, `ch06aDlg` (4 langues, OK grisé, `bseq`, `ch17aFresh`), `ch06aDel` (usage, confirmation, cascade, renumérotation), `ch06aMove`, `CH06A_MSG` (§ 4.2) ;
  - Genres d'affaires, Séances, Types de plans (§ 4.3 à 4.5) ;
  - serveur : `CH06_PIT`, `_ch06_touched`, ancres S1 à S3 (§ 3.3).
- **Tests** : T1-1 à T1-11 ; essai B1.
- **Dépendances** : aucune dans le chantier ; externes, déjà intégrées : CH-08 (`CH08A_ADM`, `ch08aAdmCats`), CH-10 (`ch10aAdmin`), CH-17 (`ch17aFresh`, `ch17aRenum`, `ch17aNext`, `CH17A_MSG`).

### Lot 2 — Groupes de conditions, navigateur du CC, Blocs de texte (préfixe `ch06b` / `CH06B_`)

- **Contenu** : `CH06B_TYPES`, panneau « Groupes de conditions » et ses 2 dialogues (§ 4.6) ; `ch06bCondBrowse`, `ch06bCondRows` (pure), `ch06bCondNav` et ancres C1, C2 (§ 4.7) ; panneau « Blocs de texte » (type 0) et ses 2 dialogues (§ 4.8).
- **Tests** : T2-1 à T2-7 ; essai B2.
- **Dépendances** : lot 1 (moteur, aiguillage) ; externes : `condTable`, `ccContract`, `ccPayment` (CC présents ; CH-07 travaille en parallèle sur la configuration du CC : ancres courtes C1/C2 seulement).

### Lot 3 — Plans comptables (préfixe `ch06c` / `CH06C_`)

- **Contenu** : panneau « Plans comptables » avec chargement `DS.need(['catalogpos'])`, `CH06C_LANG`, dialogues Catalogue et Position, refus de suppression, tri par code, `ch06cBkpText` (§ 4.9).
- **Tests** : T3-1 à T3-5 (compteurs et identifiants seulement) ; essai B3 sans capture des positions.
- **Dépendances** : lot 1. Peut être avancé avec CH-05 lot 3 (qui en lit les données, inventaire § 16.4).

### Lot 4 — Édition complète et multilingue (préfixe `ch06d` / `CH06D_`)

- **Contenu** : Adresses - Propriétés, Adresses - Statuts (§ 4.10, 4.11) ; Phases et phases partielles, unicité, bouton standard, `CH06D_STDPH` généré au build (§ 4.12) ; Activités (§ 4.13) ; Frais avec suggestions d'unité (§ 4.14) ; Tarifs (§ 4.15) ; Jours fériés en 4 langues (§ 4.16) ; libellés de Tâches, ancre D1 (§ 4.17).
- **Tests** : T4-1 à T4-9 ; essai B4.
- **Dépendances** : lot 1 ; externes : CH-17 (`ch17aUnitLbl`, `ch17aN`).

**Ordre d'intégration** : lot 1, puis 2, 3 et 4 dans n'importe quel ordre (chacun ne dépend que du lot 1 ; leurs ancres sont disjointes).

### Non livré (et pourquoi)

| Élément | Raison |
|---|---|
| Copies d'affaire (séances, types de plans, plans comptables, phases, activités) et leurs imports depuis l'Administrateur | CH-05, CH-15, CH-16 |
| « Masqué » appliqué au choix des catalogues | sans effet dans 16.05 ; à décider avec CH-05 (décision n° 4) |
| Navigateur des blocs dans l'éditeur de texte des documents | CH-14 |
| Navigateurs de conditions de la Soumission, libellés de `svbAdmPane` | EC-1 |
| Factorisation de `ch03cBlocs` / `ppTextBrowse` | blocs d'autres chantiers déjà intégrés ; aucun gain fonctionnel |
| Suppression des anciennes branches mortes de `admPane` | à faire après intégration complète, par l'intégrateur, pour ne pas réécrire un bloc pendant les chantiers parallèles |
| Modèles externes, Rubriques, Nomenclature | CH-13 (masqués au bureau) |
| Préférence `lastAdminMenuSelection` | E9 |

---

## 11. Décisions restantes pour Paulo

| # | Question | Choix par défaut (appliqué si Paulo ne dit rien) |
|---|---|---|
| 1 | Étendre la protection au ré-import aux catégories déjà présentes (Tâches, Gabarits, Comparaison des offres, Heures prévues) en plus des 22 collections du chantier ? | **Oui** (une ligne de `CH06_PIT`) : sans cela, leurs éditions dans DeltaSub sont perdues au prochain ré-import |
| 2 | Refuser la suppression d'un statut d'adresse encore utilisé (l'original échoue sans message clair) ? | **Oui**, message « Cette inscription est déjà utilisée… » |
| 3 | Renommer « Phases standard », « Activités standard », « Frais standard » en « Phases », « Activités », « Frais » et adopter l'ordre de l'original ? | **Oui** (fidèle) |
| 4 | « Masqué » des plans comptables : seulement stocké et affiché (16.05), ou aussi appliqué au choix des catalogues d'une affaire (CH-05) ? | **Stocké et affiché seulement** |
| 5 | Référence vide d'une condition : griser OK (l'original plante) ? | **Oui** |
| 6 | Embarquer le fichier des phases standard de l'application (6 phases, 12 phases partielles) dans DeltaSub ? | **Oui**, généré au build depuis l'application installée |
| 7 | Garder la colonne « Date <année> » des jours fériés (absente de l'original) ? | **Oui**, en dernière colonne |

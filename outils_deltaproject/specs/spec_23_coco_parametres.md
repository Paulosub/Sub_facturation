# Cahier des charges — CH-07 « Contrôle des coûts : paramètres, présentations et domaine d'affaire » dans DeltaSub

Version 1 du rédacteur critique, 01.10.2026. Ce cahier décrit comment compléter le module Contrôle des coûts de `DeltaSub.html` pour reproduire, dans la fenêtre `deltaproject.costcontrol.CostControlDialog` de Deltaproject 16.05 : le menu « Paramètres » (Configuration, Comptes du maître d'ouvrage, Titres de colonnes, Importer les présentations, À la dernière version), les coordonnées bancaires des paiements, la gestion des présentations de CONTRÔLE DU COÛT (menu, colonnes, détails, fenêtre « Affichage », navigation), les filtres et favoris, le domaine d'affaire « Contrôle des coûts » (`project.CostControlFrame`, greffon `plugins.CostControlPlugin`, fiche `deltabauad.project.CostControlDocumentDialog`), la liste du module, la corbeille et l'historique. Il confronte les deux recherches du chantier (`ch/CH-07/rech_orig.md`, `ch/CH-07/rech_exist.md`), la fiche CH-07 et le § 16 de l'inventaire ; chaque contradiction a été retranchée à la source (§ 1).

**Conventions**
- **[P] PROUVÉ** : bytecode `Classe.méthode@offset` (désassemblages dans `ch/CH-07/jp/`, `ch/CH-07/bc/` et, pour cette critique, `research/crit_CH-07/` : `MTBD.txt` = `MutationTransferBookDialog`, `EF.txt` = `EntrepreneurFrame`, `ic.txt` = `ConfigCostDialog.initComponents`), libellé `Strings.db (classe|id)` (paquet `deltaproject.costcontrol` sauf mention), donnée de la base de test (copie `ch/CH-07/ds_rech.sqlite`), manuel.
- **[D] DÉDUIT** : interprétation cohérente, non démontrée ligne à ligne ; **le lot concerné la vérifie avant de coder** (classe et méthode indiquées).
- **[C] CHOIX** : décision de conception pour DeltaSub, signalée à Paulo (§ 7 et § 11).

**Références.** `DeltaSub.html` du dépôt au commit `9f184fe` : 21 887 lignes, md5 `df42ee3eaff3df24052b96479d7fd93e` (identique à la copie lue par `rech_exist`). `serveur_deltasub.py` : 1 846 lignes, md5 `adb73549951af0e1a6778677b3761449`. `outils_deltaproject/convertir_couts.py` : 1 848 lignes, md5 `4b20c0da0d693298deeec8cfcc79c1d1`. Le fichier change pendant le travail des chantiers parallèles : **seules les ancres textuelles du § 9 font foi** (toutes vérifiées `grep -F -c` = 1 sur cette source).

**Aucune donnée personnelle** : identifiants de documents (CC), d'affaires et d'utilisateur (2752), codes CFC, compteurs, montants de contrôle et libellés d'interface seulement. Aucun IBAN, nom ni adresse. **Aucun contenu CRB.**

**Fichiers de vérification de cette critique** (`research/crit_CH-07/`) : `MTBD.txt`, `EF.txt`, `ic.txt` (désassemblages) ; `t_filtre.js` (règle du filtre CFC sur le moteur DeltaSub, CC 3601 : `jsc -e "var D='<ch/CH-07>';" t_filtre.js`).

---

## 0. Synthèse

1. **Socle existant** : DeltaSub sait déjà calculer le contrôle des coûts au centime (6 CC du bureau égaux aux totaux Deltaproject stockés), imprimer ses documents (CH-01), protéger et verrouiller le document (CH-10 lot 3), synchroniser l'adresse d'une entreprise (CH-10 lot 3 : **retiré de CH-07**). Toutes les données nécessaires existent déjà dans `costcontrol` (paramètres, genres, titres, comptes MO, présentations avec largeurs et 23 options), sauf deux : les **drapeaux de lignes de détail** (`*_Row`) et les **favoris de filtre**, que le convertisseur ne reprend pas.
2. **Configuration** : 4 catégories (Mutations, Paiements, Centres de coût, Comptabilisation), pas 5 ; « Conditions » n'est plus affichée en 16.05 [P]. Comptabilisation : 10 réglages visibles, 4 lus et réécrits sans être posés à l'écran [P] ; « Métré » **est** visible (correction de `rech_orig`) [P].
3. **Statut de mutation prédéfini = 0** (46 CC du bureau) : l'original propose **« Brouillon »** à la saisie d'une mutation [P] ; DeltaSub propose « Acceptée » (repli `'acceptee'`) : corrigé au lot 1, ainsi que `ccEmpty` (un nouveau CC = CC 4951 créé dans Deltaproject le 25.09.2026 : 190 titres, 20 conditions, 9 sections de présentation, statut nul).
4. **Titres de colonnes** : les clés de DeltaSub sont les noms des champs `ColumnNames` (coquilles comprises : `genealPayment`, `contractNumver`, `beneficary`…), pas celles de `titres_defaut.json` (15 différences) ; la référence « Standard » est le CC 4951 [P].
5. **Détails de CONTRÔLE DU COÛT** : commandés par 13 drapeaux par présentation (engrenage ▸ Détails), pas par les cases par colonne [P] ; DeltaSub les déduit des colonnes (approximation exacte pour 126 présentations sur 130). Le lot 2 ajoute `lignesDetails` au convertisseur et un repli.
6. **Présentations** : menu de l'original (liste cochée, Enregistrer [copie de la **première**], Renommer, Supprimer [1re non supprimable : « Cette écriture ne peut pas être effacée. »], Navigation ▸) [P] ; « Dupliquer la présentation » et « Préférences par défaut » **n'existent pas** en 16.05 [P] (correction de `rech_exist`). Colonnes par clic droit sur l'en-tête, glisser, largeurs, titres sur deux lignes, fenêtre « Affichage » (4 catégories, 22 réglages, défauts « > », « + », couleurs noires sauf dépassement rouge) [P].
7. **Filtre de CONTRÔLE DU COÛT** : favoris (désignation, CFC de … jusqu'à, ouvrages cochés), comparaison **de chaînes** [P] ; il ne vaut que pour l'écran, pas pour le document [P].
8. **Liste et domaine** : liste de l'original (documents de l'utilisateur dans le module, documents de l'affaire dans le domaine ; colonnes verrou, [Numéro d'affaire], Utilisateur, Date, Version, N° de version, Statut, Notes), fiche « Nouveau » / « Editer le contrôle du coût » avec Utilisateur, duplication « <version> Copie » avec fiche pré-remplie, **corbeille en deux temps** [P] ; retour au domaine à la fermeture.
9. **Historique** : D12 de CH-02 transposée [C] : historique propre à DeltaSub (`costcontrolhist`, 5 versions, au plus une toutes les 10 minutes), « À la dernière version » par Maj + clic sur « Paramètres », avec choix et confirmation (écart volontaire, l'original restaure sans message) ; pas de reprise des 897 archives (décision Q4).
10. **Dettes reprises** : `kvValue` HT (CC 301 : 907'200.00), `awardingProfit` de signe juste (CC 4954 : 5'632'460.00), enregistrement avec la version lue (`bseq`, fin du « dernier qui écrit gagne »), taux de TVA par `vatDefault()` (8 sites).
11. **Plan : 4 lots** (la fiche en prévoyait 3, le § 16.4 en a renvoyé 3 autres à CH-18) : `ch07a` configuration, comptes, banque, titres, défauts d'un nouveau CC, dettes (lot 1) ; `ch07b` présentations, colonnes, détails, Affichage, navigation, filtre, import des présentations, convertisseur (lot 2) ; `ch07c` liste, domaine, fiche, duplication, corbeille, historique, serveur (lot 3) ; `ch07d` réglages et filtres des autres sections (lot 4). Non livré : § 10.5.

---

## 1. Arbitrages entre les sources (tranchés à la source)

| # | Sujet | Sources en désaccord | Verdict | Preuve |
|---|---|---|---|---|
| 1 | Catégories de « Configuration » | spec_5 § 1.1 et `rech_exist` § 0 n° 3 : 5 (avec « Conditions ») ; `rech_orig` : 4 | **4** : Mutations (id 0), Paiements (2), Centres de coût (3), Comptabilisation (4). `doMouseClick` sait encore afficher l'id 1, mais aucune ligne ne le porte | [P] `ConfigCostDialog.initCategory@121-271` (ids 0, 2, 3, 4) |
| 2 | « Métré » dans « Centres de coût » | `rech_orig` § 2.4 : non posé | **Posé et visible**, ordre vertical : Renchérissement ICC, DG 2 révisé, Montant plafonné, **Métré**, Libre 1, Libre 2, Libre 3 | [P] `ic.txt` l. 683-718 (groupe vertical de `jCostAccountsPanel`) |
| 3 | Réglages invisibles de « Comptabilisation » | spec_5 : visibles | **4 invisibles** : `jVergabeEqualToBkpCheckBox`, `jPayWidthDetailsCheckBox`, `jPaymentForEachSubprojctCheckBox`, `jPayNumberingforEachSubProjectCheckBox` (3 `getfield`, 0 `addComponent` chacun) ; les 10 autres ont 2 `addComponent` | [P] `ic.txt` |
| 4 | Ordre de « Comptabilisation » | — | Statut de mutation, statut de paiement, date de paiement, contrat prioritaire, total brut, numérotation par MO, texte du compte (+ champ), Arrondir, TVA visible, avenants non liés | [P] `ic.txt` l. 1401-1504 |
| 5 | Statut de mutation prédéfini à 0 | `rech_exist` D12 : à vérifier ; `rech_orig` : « Brouillon » à l'ouverture de la Configuration | **« Brouillon »** partout : la liste reçoit les 5 états (codes 1 à 5) et ne choisit un index que si un code égale la proposition ; 0 ne correspond à rien → 1re valeur (« Brouillon », sélection automatique de `JComboBox.addItem`). Même règle dans la Configuration ; son OK écrit alors 1 | [P] `MutationTransferBookDialog.initDialog@864-940` (`MTBD.txt` l. 3851-3906) ; `MutDocState$State` : draft 1 … refused 5 ; `ConfigCostDialog.initDialog@282-321` |
| 6 | Défauts de `OverviewPref` | `rech_orig` § 7 : « 3 chiffres : faux / vrai » | `displayThreeDigitSupproject` **faux**, `displayThreeDigitLocationSum` **faux** ; le reste conforme à `rech_orig` : couleurs noires sauf `payRedColor` rouge, `detailSign` « > », `finalPayment` « + », gras 1/2/3 vrais, `colorPayments` faux | [P] `OverviewPref.<init>` ; CC 4951 (nouveau, 16.05) identique |
| 7 | Message de la 1re présentation non supprimable (CONTRÔLE DU COÛT) | `rech_exist` § 4.9 : « Cette inscription ne peut pas être effacée. » | **« Cette écriture ne peut pas être effacée. »** (`CostControlDialog|msg2`, titre « Erreur »). « Cette inscription … » (`EditFavoriteDialog|msg5`) vaut pour les **autres sections** | [P] `OverviewFrame.removeColumnSettings@72-108`, `PATH_TO_RSRC` = `CostControlDialog` (`OverviewFrame.<clinit>@0-6`) |
| 8 | « Dupliquer la présentation », « Préférences par défaut » | `rech_exist` § 1 : à ajouter | **N'existent pas** en 16.05 : libellés présents dans `Strings.db`, aucune classe ne référence `duplicateColumnSettingMenu` ni `standardMenu` | [P] recherche dans toutes les classes de `DELTAbauad.jar` |
| 9 | « Afficher / Masquer les détails », « Afficher le genre de contrat / de paiement » | `rech_exist` § 1 : options du CONTRÔLE DU COÛT | Ce sont des cases de la roue de **COMPTES D'ENTREPRISE** (`detailPayment_Row`, `displayContractComment`, genre de paiement) et de PAIEMENTS (`showDetailMenu`) ; `hideDetailMenu` n'est référencé nulle part | [P] `EntrepreneurFrame.jServiceButtonActionPerformed@15-313` (`EF.txt`), `PaymentFrame` |
| 10 | Détails de CONTRÔLE DU COÛT | convertisseur : `detail<Col>` | **Drapeaux `*_Row` de la présentation** (OverviewFrame : 7 + 7 + 5 + 3 × 9 accès) ; un seul accès par colonne : `detailContractAndAddendumTot` (avenants liés sous le contrat) | [P] `OverviewFrame.fillTable` (comptage des appels `ColumnSetting.*`) |
| 11 | Messages de suppression d'un document | `rech_exist` § 5 : `CostControlDocumentDialog|msg2` « … ce document ? » | **`msgDeleteEntry`** « Voulez-vous vraiment supprimer cette inscription ? » puis, pour un document déjà marqué, **`msgDeleteEntryDefinitely`** « Voulez-vous vraiment supprimer définitivement cette inscription ? » (titre « Avertissement ») ; `msg2` n'est pas utilisé [D] | [P] `deltabauad.project.CostControlDocumentDialog.deleteCostControlDocument@9-29` |
| 12 | Archives Deltaproject | `rech_orig` : 765 dans `coco/` ; `rech_exist` : 257 | Même total : **257** dans `coco/` + **508** dans les 105 copies `coco_<date>/` + **132** à la racine = **897** | les deux recherches |
| 13 | Restauration des `.zip` par « À la dernière version » | `rech_exist` § 5 : dossier ou zip | **Dossiers `coco_<date>` seulement** ; branche des zip morte (condition constante) | [P] `CostControlDialog.jRestoreMenuItemActionPerformed@3` (`rech_orig` § 11.2) |
| 14 | Clés des titres de colonnes | `titres_defaut.json` (189 clés `CostColumns`) | Clés de DeltaSub = **champs de `ColumnNames`** tels que convertis (190 dans un CC 16.05 : 188 + `contractDesc`, `paymentDesc` vides) ; 15 clés s'écrivent autrement (`genealPayment` ↔ `generalPayment`, `contractNumver` ↔ `contractNr`, `beneficary` ↔ `beneficaryTot`, `kv2MinusKv2` ↔ `kv2MinusKv1`, `honor` ↔ `honorValue`, `mutationNumber1` ↔ `mutationNumber1_1`…). Défauts réels d'un nouveau CC = CC 4951 : 10 titres y ont une **espace finale** (« Transferts 2␣ », « Métrés HT␣ », « Etat du coût TTC␣ »…) | [P] base : CC 4951, 4952, 4953 identiques |
| 15 | Portée du filtre | — | **Écran seulement** : `filterOverView` n'est appelé que par `OverviewFrame` ; le document « Contrôle des coûts » n'est pas filtré | [P] recherche des appels dans `DELTAbauad.jar` |
| 16 | Règle CFC du filtre | — | `de ≤ n° ≤ à` en **comparaison de chaînes** sur le n° de la position ; bord vide = sans borne ; ainsi « 1 à 6 » exclut « 61 » | [P] `Booking.containsBkp@0-107`, `filterOverView@39-43` |
| 17 | Champs du favori | `Strings.db` : « Date de », « jusqu'à date » | **Inutilisés** (aucune classe ne lit `dateBegin` / `dateEnd`) | [P] recherche dans les classes |
| 18 | Champs bancaires d'un paiement | — | `bankAccount1` = **Compte postal** → `banque.compte` ; `bankAccount2` = **N° compte bancaire** → `banque.texteCompte` (c'est là que s'insère « Voir bulletin de versement ») | [P] `convertir_couts.py` l. 594-595 ; `BankAccountDialog` (`postKonto` → account1, `bankKontoNr` → account2) |
| 19 | `BANKACCOUNT.ACCOUNT1` / `ACCOUNT2` | `bankDlg` (l. 833) : ACCOUNT1 = « N° compte bancaire » | ACCOUNT1 = **Compte postal** (9/9 au format `nn-nnnnn-n`), ACCOUNT2 = **N° compte bancaire** (120/122) ; `bankDlg` intervertit les libellés : écart **hors chantier** (§ 8) | [P] base, 125 lignes |
| 20 | Contrôle IBAN | `rech_exist` : 5 IBAN MO sur 10 refusés par `ibanOk` | L'algorithme de l'original (`isIBANValid`) et `ibanOk` donnent **le même verdict sur les 10** (5 refusés : 13 caractères, des numéros de compte saisis dans le champ IBAN) ; `ibanOk` est réutilisé | [P] essai sur la base (comptage seul) |
| 21 | « Configurer le plan comptable … » | `rech_exist` : lot 1 ou CH-18 | Ouvre `ProjectCatalogDialog.editProjectCatalog` (plan comptable CFC de l'affaire, contrôles de licence CRB `msgCrb*`), puis `updateBkp` et le recalcul des sections. DeltaSub n'a **aucun éditeur** de plan comptable d'affaire → **non livré**, entrée grisée (§ 10.5) | [P] `CostControlDialog.jBkpMenuItemActionPerformed@5-343` |
| 22 | « Chercher » de la fiche bancaire | — | `BankBrowserDialog` lit `rsrc/app/lists/bankList.csv` (répertoire SIX des banques, 3 386 lignes, 556 Ko, **daté de 2017**) → non livré, bouton grisé (§ 10.5, décision Q9) | [P] classes `addresses.Bank` (`loadBankList`, `CSVReader`) |
| 23 | Documents supprimés dans les listes | original : ⌥ ou ⌃ au clic | **[C]** case « Afficher les documents supprimés », comme « Mes devis » (CH-02 lot 4) et l'eCCC | spec_19 § 1 n° 38 ; spec_15 § 4.15 |
| 24 | Liste du module | `rech_exist` § 6 n° 1 | **Documents de l'utilisateur** avec « Numéro d'affaire » (`getCostControlDocumentListByAppUser`) ; **[C]** adopté, comme CH-02 | [P] `deltaproject.costcontrol.CostControlFrame` (`bc/`) |
| 25 | Duplication | DeltaSub : « (état intermédiaire) », n° + 1, statut 2, auteur courant | **Fiche pré-remplie**, Version « <version> Copie », mêmes n°, statut, date, utilisateur et note ; Annuler = rien n'est créé ; OK = copie de tout le dossier **[C] fidèle** (Q8) | [P] `duplicateCostControlDocument` (`rech_orig` § 10.3) |
| 26 | « Nouveau » | DeltaSub : ouvre le document | La ligne créée est **choisie, pas ouverte** [D] (même schéma que `CostEstimateDocumentDialog`, spec_15 n° 19) ; le lot 3 le vérifie dans `newCostControlDocument` | [D] |
| 27 | Écran de `kvValue` et `awardingProfit` | CC_COL (TTC ; C+A − DG rév.) | `kvValue` = DG **HT** ; `awardingProfit` = **DG rév. − C+A** sans condition ; déjà codés dans `ch01aOvVal` (CH-01) : le lot 2 l'utilise | [P] `CalcCost.calcTot` (spec_14) |
| 28 | Synchroniser l'adresse | fiche CH-07 | **Présent** (CH-10 lot 3 : `ch10cSyncDlg`, `ch10cRemap`, `ch10cEntCtx`) : retiré | `rech_orig` § 12 |

---

## 2. Périmètre

### 2.1 Reproduit (fidèle)
- Menu « Paramètres » du document, ordre et séparateurs de l'original ; entrée cachée « À la dernière version » (Maj + clic).
- « Configuration » complète (4 catégories), dialogues de genre de mutation et de paiement (4 langues).
- « Comptes du maître d'ouvrage » et « Editer le compte bancaire » ; « Coordonnées bancaires … » dans la fenêtre de paiement, avec création du `bankaccount` de l'entité.
- « Editer les titres de colonnes » (19 catégories, 1re et 2e ligne, Variable / Equation, « Standard »).
- Défauts d'un nouveau contrôle des coûts identiques à Deltaproject 16.05.
- Présentations de CONTRÔLE DU COÛT : menu, colonnes (menu par catégories, glisser, largeurs, titres sur deux lignes), Détails ▸, « Affichage … », Navigation ▸, « Importer les présentations … ».
- Filtre et favoris de CONTRÔLE DU COÛT.
- Liste du module, domaine d'affaire, fiche d'en-tête, duplication, corbeille en deux temps, protection (droits du document) de toutes ces actions.
- Lot 4 : filtres d'ADJUDICATIONS, de MUTATIONS et de DEVIS GENERAL ; « Paramètres » de DEVIS GENERAL et d'ORDRES DE PAIEMENT ; menu « Présentation » (choisir, enregistrer, renommer, supprimer) des autres sections.

### 2.2 Choix DeltaSub
- Historique propre à DeltaSub (D12 de CH-02) ; « À la dernière version » avec choix et confirmation.
- Case « Afficher les documents supprimés » au lieu de ⌥/⌃-clic.
- Enregistrement continu (pas de menu « Fichier ▸ Enregistrer » masqué selon la sauvegarde automatique) ; « ‹ Liste » tient lieu de « Fermer ».
- Édition des genres en 4 langues mais **titres de colonnes en français seulement** (Q1).
- Couleurs de l'« Affichage » : défauts de l'original (non converties, Q3), éditables et enregistrées par DeltaSub.
- Colonne « Coût probable TTC » de la liste conservée (extension DeltaSub, comme « Total TTC » de CH-02, E12).

### 2.3 Place et accès
- Bâtiment ▸ Contrôle des coûts : liste de l'utilisateur (lot 3), puis la fenêtre du document (`ccEditor`).
- Affaires ▸ domaine « Contrôle des coûts » : liste de l'affaire (lot 3) ; fermeture du document = retour au domaine.
- Droits : module et domaine sous `construction` (CH-08, déjà en place) ; écritures sous `ch10cGuard('costcontroldocument', id)` (droits du document, `Rights.rigthsIsOk`) avec le message de CH-10.

---

## 3. Modèle de données

### 3.1 Collections
| Collection | Rôle | Changement |
|---|---|---|
| `costcontroldocument` | en-tête (VERSION, VERSIONNUMBER, STATECODE, CHANGEDDATE, USERID, NOTE, ISMARKEDASDELETED, PROJECT_ID) | aucun champ nouveau |
| `costcontrol` | contenu (JSON par document, HEAVY) | champs ajoutés au § 3.2 |
| `bankaccount` | coordonnées bancaires des entités (`CONTACTOWNER_ID`, NAME, STREET, POSTALCODE, LOCATION, ACCOUNT1 = compte postal, ACCOUNT2 = n° de compte, CLEARINGNR, SWIFT, IBAN) | créations par le lot 1 |
| `cocodoc` | documents CH-01 (`<docId>/<dossier>`) | copiés à la duplication, supprimés à la suppression définitive (lot 3) |
| `depotfichier` (CH-03) | PDF du CC (`Construction/Costcontrol/<P>/<ID>/coco/…`) | copiés à la duplication par `ch03aCopier` si l'API existe (lot 3) |
| **`costcontrolhist`** (nouvelle) | versions : `{DOCUMENT_ID, PROJECT_ID, date, USERID, contenu}` ; id `<docId>/<AAAAMMJJ-HHMMSS>` | lot 3 ; `HEAVY.push('costcontrolhist')` dans le code du lot ; `PROTECTED` au serveur |

### 3.2 Champs de `costcontrol`
- `parametres` (existant) : `centres{dgRevise2, rencherissementIcc, montantPlafonne, metre, libre1, libre2, libre3}`, `statutMutationDefaut` (null = « Brouillon », § 1 n° 5), `statutPaiementDefaut`, `joursPaiementApresFacture`, `contratPrioritaireDefaut`, `saisieBrutDefaut`, `numerotationOrdresParMO`, `texteCompteAuto`, `texteCompte`, `arrondir`, `tvaVisibleNouvellesEcritures`, `avenantsNonLiesAutorises`, invisibles `lotEgalCFC`, `paiementsAvecDetailsDefaut`, `bonParOuvrage` (toujours réécrit à faux), **nouveau** `contratPrioritaireCoutProbable` (`payNumberPerSubproject`, invisible, conservé), `equations[6]`, `facteurDG`.
- `genresMutation[{code, texte, genre ∈ transfert|variation|rencherissement, actif, textes?{de,fr,it,en}}]` et `genresPaiement[{code, texte, texteFacture, genre ∈ surContrat|surContratFinal|regie|rencherissement|rencherissementFinal|horsContrat|horsContratFinal, textes?, textesFacture?}]` : `texte` reste le français (lu partout) ; `textes` n'est écrit que par le dialogue.
- `titresColonnes{<champ ColumnNames>: [ligne1, ligne2]}` (français).
- `comptesMO[{ouvrage, localisation, SUBPROJECT_ID?, banque, rue, npa, lieu, compte (postal), compte2 (n° de compte), swift, clearing, iban, contact}]` : liste **aplatie** du convertisseur (un élément par compte) ; l'entrée de l'affaire a `ouvrage` et `localisation` vides.
- `paiements[].banque{nom, rue, npa, lieu, compte (postal), texteCompte (n° de compte), swift, clearing, iban, compteMO}` (existant).
- `presentations.<section>[{nom, favori, colonnes[{id, idDelta, largeur, details}], options, **lignesDetails**}]` : `lignesDetails` = liste parmi `mut1, mut2, icc, contrat, avenant, adjudication, metre, paiement, provision, coutProbablePerso, libre1, libre2, libre3` (drapeaux `detailMut_1_Row` … `detailFree3Cost_Row`) ; **absente** = repli (§ 4.8). Options de couleur (nouvelles clés, `#rrggbb`) : `payGreenColor`, `payRedColor`, `mutDetailColor`, `contractDetailColor`, `payDetailColor`, `costRelevantColor`, `costNotRelevantColor` ; absentes = défauts de l'original.
- **`filtres`** (nouveau) : `{controle:[{nom, favori, cfcDe, cfcA, ouvrages:[{ouvrage, localisation, m}]}], adjudications:{…}, mutations:{…}, devis:[{nom, favori, ouvrages:[{ouvrage, localisation, m, facteur}]}]}` (lot 4 pour les trois derniers). `C.filtrePaiements` (CH-01) n'est **pas** déplacé.
- **`historique`** (nouveau, lot 3) : index `[{id, date, USERID}]` des versions de `costcontrolhist` (5 au plus).

### 3.3 Écritures groupées et concurrence
- Fenêtre du document : chaque action appelle `touch()` → `save()` → **un seul** `DS.commit([...versions d'historique, costcontrol, costcontroldocument])`. Le lot 1 fait lire la version au chargement (`CCV.bs = ctBseq('costcontrol', id)` dans `load`) et l'envoie (`bseq: CCV.bs`) ; après succès `CCV.bs` = seq renvoyé ; en conflit (409) : `load()` (comportement actuel de `touch`) et message standard de `DS.commit`.
- Dialogues : contenu lu à l'ouverture (copie de `C`) ; OK → mise à jour de `C` puis `touch()`. Liste et fiche : `ctBseq` lu à l'ouverture du dialogue (modèle `ch02dEditDoc`).
- Coordonnées bancaires d'un paiement : le `bankaccount` éventuel est créé **à l'OK de la fiche bancaire** (transaction de l'original) par son propre `DS.commit` ; le paiement est enregistré à l'OK de la fenêtre de paiement.

### 3.4 Serveur et convertisseur
- **Serveur (lot 3)** : après l'ancre `PROTECTED |= {"costestimatehist"}   # CH-02 lot 4 : historique des devis`, ajouter `PROTECTED |= {"costcontrolhist"}   # CH-07 lot 3 : historique des contrôles des coûts`. Copie complète modifiée + diff.
- **Convertisseur (lot 2)**, `_presentations` : ajouter `lignesDetails` (lecture des 13 champs `detail*_Row` de chaque `ColumnSetting`, toutes sections) ; nouvelle fonction `_filtres` : `overFilterList` → `filtres.controle` (`FavoriteFilterItem{name, isFavorite, supProjects[{to, lg, apply}], bkpFrom, bkpTo}`). Copie complète modifiée + diff. Les favoris et les drapeaux n'atteignent la base qu'au **ré-import** (opération de l'intégrateur sur la base partagée, avec l'accord de Paulo) ; les CC modifiés dans DeltaSub sont protégés (`PROTECTED_IF_EDITED`) et gardent le repli.
- **Non convertis** (inchangé, § 7) : couleurs (`java.awt.Color` non exporté par `Ser2Json`), titres DE/IT/EN, préférences des autres sections, noms des centres de coût.

---

## 4. Écrans et dialogues

### 4.1 Menu « Paramètres » de la fenêtre du document (lot 1)
Remplace le bouton clé actuel (ancre A8). Ordre exact (`CostControlDialog.initComponents@917-1195`) :
```
Configuration …
Comptes du maître d'ouvrage …
Titres de colonnes …
─────────
Configurer le plan comptable …        grisé, info-bulle « CH-05 » (non livré, § 1 n° 21)
Définir facteur d'index. du DG …      grisé « CH-18 »
Importer les présentations …          lot 2 (typeof ch07bImport), sinon grisé
─────────
Calculer prorata …                    grisé « CH-18 »
[À la dernière version]               seulement après Maj + clic sur le bouton (lot 3, typeof ch07cLastVersion) ; grisé sans version
─────────                             [C] extension DeltaSub conservée
Attribuer le devis général validé …   (existant, ccAssignDG)
```
- Maj : `mousedown` (capture) sur le bouton mémorise `e.shiftKey` (modèle `ch02a`, l. 16073).
- Chaque commande d'écriture commence par `ch10cGuard('costcontroldocument', id)` ; refus = message de CH-10, rien n'est ouvert.

### 4.2 « Configuration » (lot 1, `ch07aConfig`, délégué depuis `ccConfig`)
- Titre « Configuration » ; boutons « Annuler » / « OK » (OK par défaut, Échap = Annuler). Gauche : tableau « Catégorie » : « Mutations », « Paiements », « Centres de coût », « Comptabilisation » ; 1re ligne choisie à l'ouverture. Travail sur une **copie** de `parametres`, `genresMutation`, `genresPaiement` ; OK seul écrit.
- **Mutations** : tableau trié « Code » (50 px) | « Texte » (250) | « Genre » (« Transfert », « Renchérissement », « Variation de coût ») ; boutons + / crayon / − ; crayon et − actifs si **une seule** ligne choisie ; double-clic = crayon. − : « Voulez-vous vraiment supprimer cette écriture ? » (`ConfigCostDialog|msg2`, Avertissement), sans contrôle d'usage [P].
- **Dialogue de genre de mutation** : titre « Nouvelle inscription » / « Edition » ; « Abréviation » (2 caractères) ; 4 lignes libellées « Deutsch », « Français », « Italiano », « English » (30 caractères) ; radios « Transfert » (coché pour un nouveau), « Renchérissement », « Variation de coût ». **OK actif si le texte français n'est pas vide.** Création seulement : code déjà présent → « Il existe déjà une mutation ^0. » (Erreur, ^0 = code). Écriture : `texte` = français, `textes{de,fr,it,en}`.
- **Paiements** : tableau « Code » | « Texte » (texte de paiement) | « Genre » : « Paiement sur contrat », « Paiement final sur contrat », « Paiement de régie », « Paiement hors contrat », « Paiement final hors contrat », « Paiement de renchérissement », « Paiement final de renchérissement ». Mêmes boutons et règles.
- **Dialogue de genre de paiement** : « Abréviation » (2) ; 4 lignes par langue, **deux champs par ligne** (texte de paiement, texte de facture ; aucun en-tête de colonne [P]) ; 7 radios dans l'ordre « Paiement sur contrat », « Paiement final sur contrat », « Paiement de régie sur contrat », « Paiement de renchérissement », « Paiement final de renchérissement », « Paiement hors contrat », « Paiement final hors contrat ». **OK actif si texte de paiement ET texte de facture français saisis.** Doublon à la création : « Il existe déjà un paiement ^0. »
- **Centres de coût** : 7 cases dans l'ordre du § 1 n° 2 (« Renchérissement ICC », « DG 2 révisé », « Montant plafonné », « Métré », « Libre 1 », « Libre 2 », « Libre 3 »), **affichées et grisées** [C] (leur effet relève de CH-18 ; les 84 CC du bureau les ont toutes fausses) ; valeurs lues et réécrites telles quelles.
- **Comptabilisation** (ordre du § 1 n° 4) : « Prédéfinir [▾] comme statut de mutation » (Brouillon, Provisoire, Demande transmise, Acceptée, Rejetée ; nul → Brouillon) ; « Prédéfinir [▾] comme statut de paiement » (réceptionné, libéré, transmis, débité ; nul → transmis) ; « Date de paiement [n] jours après la date de facture » (texte non entier → valeur inchangée) ; « Prédéfinir le contrat comme prioritaire sur le devis pour la prévision » ; « Prédéfinir la saisie du total brut lors de la comptabilisation » ; « Numéroter les ordres séparément pour chaque maître d'ouvrage » ; « Insérer automatiquement à la place du numéro de compte: » + champ ; « Arrondir » ; « Afficher le taux de TVA dans les nouvelles écritures (transferts, variations, renchérissements) » ; « Autoriser des avenants non lié au contrat » (coquille d'origine).
- **OK** : `bonParOuvrage` = faux ; les 3 autres invisibles réécrits inchangés ; un seul `touch()` (le recalcul de toutes les sections est celui de `draw`).
- Effet des réglages déjà lus par DeltaSub : inchangé. Réglages jusqu'ici **jamais lus** : le lot 1 ne leur ajoute un effet que pour `statutMutationDefaut` (repli corrigé) ; les autres (numérotation par MO, avenants non liés, TVA visible, texte automatique) gardent leur absence d'effet, listée au § 8.

### 4.3 « Comptes du maître d'ouvrage » (lot 1, `ch07aMoAccounts`)
- Titre « Comptes du maître d'ouvrage » ; un seul bouton « Fermer » ; **chaque modification est enregistrée aussitôt** (`touch()`).
- Gauche (190 px) : « Maître d'ouvrage » | « Ouvrage/Loc ». Ligne 1 : premier `projectmember` de l'affaire de rôle 8 (MO), par `SORTORDER` puis ID, non masqué ; libellé court du contact ; ouvrage vide. Puis une ligne par `subproject` de l'affaire **ayant un `CONTACT_ID`** : libellé court, « CODE » ou « CODE/LOCATIONCODE » (2 au bureau). Sans MO d'affaire : « Vous n'avez défini aucun maître d'ouvrage. » (Avertissement) et liste vide.
- Droite : « Etablissement » | « Lieu » | « Compte » (= `compte2` s'il est saisi, sinon `iban`) pour les entrées de `comptesMO` de même (ouvrage, localisation).
- + actif si une ligne de gauche est choisie ; crayon et − si un compte est choisi ; double-clic = crayon. − : « Voulez-vous vraiment supprimer cette inscription ? » (`BuildingOwnerAccountDialog|msg1`).

### 4.4 « Editer le compte bancaire » (lot 1, `ch07aBankDlg(o)`, commun MO et paiements)
- Titre toujours « Editer le compte bancaire ». Bloc « Banque/Etablissement » : « Banque/Etablissement », « Rue et n° », « NPA/Localité » (2 champs), « Compte postal », « N° de clearing », « SWIFT », « Contact de la banque ». Bloc « Compte bancaire » : « IBAN », « N° compte bancaire ».
- « Chercher » : **grisé** (§ 1 n° 22). « Comptes » : visible seulement pour une entreprise (paiement) ; ouvre « Banque » (`EntrepreneurAccountDialog`) : liste des `bankaccount` de l'entité (`contact.CONTACTOWNER_ID`) ; double-clic ou OK remplit nom, rue, NPA, lieu, compte postal (ACCOUNT1), n° de compte (ACCOUNT2), clearing, SWIFT, IBAN. « Contact de la banque » : **masqué pour une entreprise**, visible pour un MO.
- **OK actif si « N° compte bancaire » ou « IBAN » est saisi.** IBAN saisi et `!ibanOk` → « L'IBAN est incorrect. Voulez-vous vraiment enregistrer? » (Oui / Non ; Non = rester). Tous les champs `trim()` sauf le contact.
- **Paiement** (lot 1, ancre A19) : sous « Entreprise », ligne « Coordonnées bancaires: » + nom de la banque + bouton « Coordonnées bancaires … » (texte `PayBookDialog|openBank`). OK de la fiche → `v.banque` reçoit nom, rue, NPA, lieu, compte, texteCompte, SWIFT, clearing, IBAN (le reste de `banque` est gardé) ; puis, si l'entité n'a **aucun** `bankaccount` de même ACCOUNT2 (= texteCompte) **et** même IBAN, `DS.commit` d'un nouveau `bankaccount` {CONTACTOWNER_ID, NAME, STREET, POSTALCODE, LOCATION, ACCOUNT1, ACCOUNT2, SWIFT, CLEARINGNR, IBAN} (pas de contact) [P]. Les entrées « Facture de l'entreprise en annexe … » et « Annexe … » restent à CH-03.

### 4.5 « Editer les titres de colonnes » (lot 1, `ch07aTitles`)
- Gauche « Catégorie », 19 lignes : Subdivision, DG, Mutations du DG, DG révisé, Mutations 2 DG révisé, DG révisé 2, ICC, Adjudication, Paiements, Garantie, Différences, Coût probable, Equations, Libre 1, Libre 2, Libre 3, Conditions, Honoraires, Centres de coût.
- Droite : une ligne par colonne : libellé long (lecture) · « 1ère ligne » · « 2ème ligne » · « Variable » (lecture, `[ca]`…). « Equations » : « Equation » (formule éditable, `parametres.equations[0..5]`) à la place de « Variable ». « Centres de coût » : les 30 noms par défaut **en lecture seule** [C] (Q2).
- **Table catégorie → clés** : le lot l'extrait de `ColumnNameDialog.initCategory@142-802` et des méthodes `init*` (désassemblage `ch/CH-07/jp/costcontrol.ColumnNameDialog.txt`) avec les clés **de `ColumnNames`** (§ 1 n° 14) ; contrôle : l'union des 18 premières catégories = les 190 clés du CC 4951. Variables : `data.EquationVar` (spec_5 § 2.2).
- Bas : liste de langue (« Deutsch », « Français », « Italiano », « Englsih ») avec **seul « Français » actif** [C] ; « Standard » : « Voulez-vous vraiment réinitialiser les titres de colonnes ? » ; Oui → titres français = défauts du CC 4951 **immédiatement** (`touch()`), champs rechargés, « Annuler » devient « Fermer ».
- **OK** : titres (espaces gardées telles quelles) + 6 équations → `touch()`.

### 4.6 Défauts d'un nouveau contrôle des coûts (lot 1, `ch07aEmpty`, délégué depuis `ccEmpty`)
Structure actuelle de `ccEmpty` conservée (collections vides, `annexes`), avec les valeurs du CC 4951 : `parametres` complet (§ 3.2 ; `statutMutationDefaut` **null**, `centres` à faux, `facteurDG` 1, `equations` 6 × '', `texteCompte` « Voir bulletin de versement », `paiementsAvecDetailsDefaut` et `texteCompteAuto` vrais, `saisieBrutDefaut` et `contratPrioritaireDefaut` vrais, autres faux) ; 9 genres de mutation et 4 genres de paiement (inchangés) ; **20 conditions** ; **190 titres** ; présentations « Standard » favorites dans **9 sections** (`controle` : 11 colonnes `kag` 60, `kagText` 200, `entrepreneur` 200, `kvTot`, `mutationTransferTot1`*, `mutationIncreaseTot1`*, `kv1Tot`, `contractAndAddendumTot`*, `payementTot`*, `forcastCalculatedTot`, `balanceOfCostsTot` à 100 ; * = détails ; options = défauts du § 1 n° 6 ; `lignesDetails` = `['mut1','contrat','avenant','paiement']`). Le lot génère ces constantes par un script depuis la copie de base (aucune donnée personnelle : libellés et réglages).

### 4.7 Fenêtre du document : barre (lot 2)
Ordre : « ‹ Liste », titre, + ▾, crayon, −, **« Filtre ▾ »** et étiquette « Filtré » (si un favori est actif), **« Présentation ▾ »** et le **nom de la présentation active** à droite, « Paramètres ▾ », roue ▾, « Enregistrer ». Le filtre et la présentation agissent sur CONTRÔLE DU COÛT ; dans les autres sections ils délèguent au lot 4 (sinon grisés).

### 4.8 Présentations de CONTRÔLE DU COÛT (lot 2)
- **Menu « Présentation ▾ »** : une case par présentation (cochée = favorite), ─, « Enregistrer la présentation … », « Renommer la présentation … », « Supprimer la présentation … », ─, « Navigation ▸ ». « Afficher les détails » et « N'afficher que … » (ajouts DeltaSub) disparaissent : leurs équivalents sont Détails ▸ et « Affichage » (enregistrés).
- **Choisir** : droits ; la présentation choisie devient la seule favorite ; `touch()`.
- **Enregistrer** : droits ; copie de la **1re** présentation de la liste (pas de l'active) ; dialogue de nom ; ajout en fin, devenue favorite ; `touch()`.
- **Renommer** : **sans contrôle de droits** [P] — mais l'écriture reste soumise à la garde de `save` (CH-10) ; dialogue de nom sur la favorite.
- **Supprimer** : droits ; favorite = 1re → « Cette écriture ne peut pas être effacée. » (Erreur) ; sinon « Voulez-vous vraiment supprimer la présentation ^0 ? » (Avertissement) ; la 1re devient favorite ; `touch()`.
- **Dialogue de nom** : « Nouvelle inscription » / « Edition », champ « Nom » ; OK sans effet si vide ; nom déjà pris dans la section (y compris par la présentation renommée) → « Ce nom est déjà utilisé. » (Erreur).
- **Navigation ▸** : une entrée « <CFC> <désignation> » par position affichée (après filtre) de moins de 4 caractères ; s'il y en a plus de 30, de moins de 3 ; choisir sélectionne la ligne et la fait défiler.
- **Colonnes** : celles de la favorite, dans l'ordre, largeur = `largeur` (px) [C 1:1]. Titre = `titresColonnes[id]` sur **deux lignes** (`<br>`) si la 2e est saisie, sinon libellé de repli (`CC_COL[id].t` ou libellé long du catalogue). **Pas de colonne Entreprise ajoutée d'office** (CC 4853). Identifiants inconnus de DeltaSub (`equ1`, `og`, `contractKvMinusAccordPayment`) : colonne affichée **vide** avec son titre [C] (au lieu d'être ignorée en silence).
- **Valeurs** : `ch01aOvVal(id, v, hv, p, fac)` (CH-01) pour toutes les colonnes ; HT par `ccCalc(ch01aHT(C))`. `CC_COL` n'est pas modifié.
- **Ligne d'entreprise** : produite si la présentation affiche `entrepreneur` [D] (`OverviewFrame.fillTable@2417-2495` : `displayEntrepreneur`) ; sinon les détails s'attachent à la position. Le lot vérifie aussi ce que montre `kagText` sans colonne `kag` (`displayKag`, 1 accès).
- **Détails** : `lignesDetails` de la favorite ; repli (absent) : `mut1` si une colonne de mutation a `details`, `contrat` + `avenant` si une colonne de contrats, `paiement`, `provision` (+ `coutProbablePerso`, comportement actuel) — exact pour 126 présentations sur 130. Clés du moteur : `mut` ← mut1 ; `ctr` ← contrat (type contrat) / avenant (type avenant) ; `pay` ← paiement ; `prov` ← provision ; `cpp` ← coutProbablePerso ; les autres (mut2, icc, adjudication, métré, libres) n'ont pas de colonne dans DeltaSub (CH-18). Texte : `ch01aDetTxt(C, d, options, true)` (signe, date courte, n°, date de facture selon l'option).
- **Clic droit ou Maj + clic sur un en-tête** : menu par catégories du catalogue (`ch/CH-07/catalogue_colonnes_controle.txt` : libellés longs, ordre TTC, TVA, HT, séparateurs) ; catégories conditionnelles masquées tant que leur centre est inactif ; case cochée = affichée ; une entrée dont DeltaSub ne sait pas calculer la valeur est **grisée** avec la mention « non disponible » [C]. Cocher : colonne insérée avant la 1re colonne affichée de `idDelta` supérieur (ordre du catalogue) [C] ; décocher : retirée. Modification **en place** de la favorite (pas d'« Enregistrer »), `touch()`, droits d'abord.
- **Glisser un en-tête** : déplace la colonne ; les colonnes de référence (CFC, désignation) restent en tête ; ordre enregistré à la fin du glisser (`touch()`). Le clic simple sur un en-tête **ne trie plus** le tableau (tri parasite actuel de `grid`).
- **Roue ▾** (section CONTRÔLE DU COÛT) : « Affichage … », « Détails ▸ » (sous-menu : « Détails des mutations 1 », [« Détails des mutations 2 »], [« indice ICC »], « Détails des contrats », « Détails des avenants », « Détails des adjudications », [« Détails du métré »], « Détails des paiements », « Détails des provisions », « Détails des coûts probables perso », [« Détails du libre 1/2/3 »] ; [ ] = centre actif seulement), puis les entrées existantes (copier, CSV, imprimer). Le même menu (« Affichage … », « Détails ▸ ») s'ouvre au clic droit sur le tableau. Chaque case écrit `lignesDetails` de la favorite (`touch()`).

### 4.9 Fenêtre « Affichage » (lot 2, `ch07bDisplayDlg`)
Droits d'abord ; agit sur `options` de la favorite ; OK → `touch()`. Gauche « Catégorie » : « Format », « Ouvrage », « Paiements », « Présentation ».

| Catégorie | Contrôle | Clé `options` | Effet à l'écran (lot 2) |
|---|---|---|---|
| Format | « Devis général sans décimales » | `formatKvComma` | colonnes DG (`kv*`) sans décimales |
| Format | « Texte CFC en deux lignes » | `twoLineBkpText` | désignation sur deux lignes [D] (texte 1 / texte 2 de la position ; le lot vérifie la source dans `OverviewFrame`) |
| Ouvrage | « Ouvrages sur positions à 1 / 2 / 3 / 4 chiffres » + « Somme des localisations » ; « Totaux généraux des ouvrages » + « Somme des localisations » | `display*Supproject`, `display*LocationSum`, `displayTotalSubprojectSum`, `displayTotalLocationSum` | enregistrés ; **sans effet** tant que la colonne « OUV » n'est pas dessinée (§ 10.5) |
| Paiements | « Afficher les paiements en couleur », couleurs « Paiement < ou = au budget » / « Paiement > que le budget » | `colorPayments`, `payGreenColor`, `payRedColor` | montant des paiements de la ligne position coloré selon la règle actuelle de DeltaSub (≤ budget + 0.05) [D : `BkpItem.getRedPayColor`] ; sans la case, couleur normale |
| Paiements | « Marquer les derniers paiements (+) », « Caractère avant le dernier paiement » | `markFinalPays`, `finalPayment` | marque devant le montant du dernier paiement (au lieu de « F » fixe) |
| Paiements | « Date de facturation plutôt que la date de paiement » | `invoiceNumberInsteadOfPayNumber` | date du détail de paiement (`ch01aDetTxt`) |
| Présentation | couleurs « … détail des mutations / des contrats / des paiements », « Positions saisies », « Positions calculées » | `mutDetailColor`, `contractDetailColor`, `payDetailColor`, `costRelevantColor`, `costNotRelevantColor` | couleurs des détails et des positions (saisies / générées) ; défaut noir |
| Présentation | « Titres à 1 / 2 / 3 chiffres en gras » | `oneDigitBold`, `twoDigitBold`, `threeDigitBold` | gras des positions de 1, 2, 3 caractères [D : `CostDisplayCellRenderer`] (au lieu de « titres jusqu'au niveau 2 ») |
| Présentation | « Afficher les détails en italique » | `detailsItalic` | italique des détails seulement si coché (défaut : non) |
| Présentation | « N'afficher que les positions de 1 à 3 chiffres » | `displayOnlyThreeDigitPos` | remplace `CCV.only3` (enregistré) |
| Présentation | « Caractère avant détails » | `detailSign` | signe des détails (défaut « > ») |

Couleur : `<input type="color">` libellé « Choix de couleur ». `markLastPayment` (case sans « (+) ») existe mais n'est pas écrite par l'original : non reproduite.

### 4.10 Filtre de CONTRÔLE DU COÛT (lot 2)
- Bouton « Filtre ▾ » : « Editer le filtre … », case « Désactiver le filtre », puis (si l'affaire a des ouvrages, ─ et) une case par favori. Étiquette « Filtré » quand un favori est actif. **Favori actif = état de session** de la fenêtre (`CCV`), remis à zéro à l'ouverture d'un autre document ; seuls les favoris et leur drapeau `favori` sont enregistrés.
- **Fenêtre « Filtre »** : tableau « Favori » ; + « Ajouter aux favoris », − « Retirer de la liste des favoris » (« Voulez-vous effacer cette inscription ? »), crayon « Editer les favoris » ; − et crayon actifs si une ligne est choisie ; « Fermer » et « OK » (info-bulle « Appliquer le filtre ») ; OK : le favori choisi devient actif et `favori` (droits, `touch()`).
- **Fiche de favori** : « Nouveau favori » / « Editer le favori » ; « Désignation » ; « CFC de » … « jusqu'à » ; tableau « M » (25 px) | « Ouvrage » | « Localisation » (ouvrages de l'affaire). **OK actif si la désignation n'est pas vide** ; pas de contrôle de doublon.
- **Règle** (§ 1 n° 16) : une position passe si `cfcDe ≤ cfc ≤ cfcA` (chaînes ; bord vide = libre) et, si au moins un ouvrage est coché, ses écritures ne comptent que pour les (ouvrage, localisation) cochés ; contrats, paiements, écritures : lignes filtrées par leur CFC ; mutation : chaque côté (origine, destination) ne compte que s'il passe [D] ; totaux recalculés par `ccCalc` sur la copie filtrée ; ouvrages non retenus retirés. Écran seulement.

### 4.11 « Importer les présentations … » (lot 2, `ch07bImport`)
Droits ; « Choix du contrôle du coût » : affaires à gauche (« Numéro », « Affaire »), contrôles des coûts non supprimés de l'affaire à droite (Version, N° de version, Statut, Date ; le document courant exclu) ; OK actif si un CC est choisi. Puis « Voulez-vous remplacer tous les paramètres? » (Avertissement). Oui : copie **depuis la source** de `titresColonnes`, `genresMutation`, `genresPaiement`, `catalogueConditions`, **toutes** les `presentations`, `filtres.devis`, `parametres.arrondir`, `equations`, `tvaVisibleNouvellesEcritures`, `joursPaiementApresFacture`, `statutPaiementDefaut`, `lotEgalCFC`, `saisieBrutDefaut`, `contratPrioritaireDefaut`, `centres`. **Non copiés** : `statutMutationDefaut`, `texteCompteAuto` / `texteCompte`, `numerotationOrdresParMO`, `avenantsNonLiesAutorises`, `comptesMO`, `filtres.controle` / `adjudications` / `mutations`, `facteurDG`, `filtrePaiements`. Un seul `touch()`.

### 4.12 Liste du module et domaine d'affaire (lot 3, `ch07cList(el, {mode, project})`)
Modèle direct : `ch02dList`.
- **Barre** : « N » (nouveau), « D » (dupliquer), « E ▾ » (« Editer … », « Ouvrir … »), « − », roue ▾ (copier, CSV), recherche (filtre à la frappe), case « Afficher les documents supprimés ».
- **Colonnes** : verrou (icône si un poste tient le document, `documentlock` de CH-10), [« Numéro d'affaire » : module seulement], « Utilisateur », « Date », « Version », « N° de version », « Statut » (Provisoire, En cours, Etat intermédiaire, Terminé), « Notes », puis [C] « Coût probable TTC » (calculé seulement si `costcontrol` est chargé, sinon « — »). Supprimés : ligne grisée et « (supprimé) ».
- **Lignes** : module = documents dont `USERID` = utilisateur courant ; domaine = documents de l'affaire. Tri par Date décroissante.
- **Activation** : N actif dans le domaine (affaire présente) et dans le module ; D, E, − si une ligne visible est choisie. Double-clic = Ouvrir ; Maj + double-clic = Editer.
- **Nouveau** : module : choix de l'affaire d'abord (`pickProject`) ; fiche « Nouveau » ; OK → en-tête + `ch07aEmpty` (ou `ccEmpty`) dans un seul commit ; la ligne est choisie, **pas ouverte** (§ 1 n° 26).
- **Fiche** (`ch07cHeadDialog`) : titre « Nouveau » / « Editer le contrôle du coût » ; « Version » (64 caractères), « N° de version » (entier, 1 par défaut ; DeltaSub : nombre de CC de l'affaire + 1 conservé [C]), « Statut » (liste), « Date » (date), « Utilisateur » (liste des comptes actifs, défaut : courant), « Note » ; **OK actif si la version est saisie et un statut choisi**. Editer + OK d'un document supprimé le **restaure** (`ISMARKEDASDELETED` = 0) [D, comme CH-02 @48-56].
- **Dupliquer** : droits (`ch10cGuard`) ; fiche pré-remplie (§ 1 n° 25) ; OK → nouvel en-tête, copie de `costcontrol` (sans `historique`, `id` changé), copie des `cocodoc` (`<nouvelId>/<dossier>`, `COSTCONTROLDOCUMENT_ID`) dans le même commit ; puis copie des PDF du dossier (`depotfichier` dont `DOSSIER` commence par `ch03aDossier('coco', P, ancienId)`) par `ch03aCopier` si l'API existe (`typeof`), sans bloquer en cas d'échec (toast) ; la copie est choisie.
- **Supprimer** : droits ; verrou (`ch10cHeld` : document ouvert ailleurs → message de CH-10) ; non marqué → `msgDeleteEntry` puis marquage ; marqué (visible avec la case) → `msgDeleteEntryDefinitely` puis suppression de l'en-tête, du contenu, des `cocodoc` et des versions d'historique (index `historique`) en un commit ; PDF laissés au dépôt [C] (§ 7).
- **Ouvrir** : `ccOpen` (verrou CH-10) ; depuis le domaine, retour au domaine à « ‹ Liste » (`CCV.back`).

### 4.13 Historique et « À la dernière version » (lot 3)
- **Prise de version** (`ch07cHistOps(id, C)`, appelée par `save` avant le commit) : si la dernière version de ce document prise dans la session date de plus de 10 minutes (ou n'existe pas), l'état **enregistré** (`DS.get('costcontrol', id)`, s'il existe) devient une version `costcontrolhist` ; l'index `C.historique` reçoit `{id, date, USERID}` ; au-delà de 5, les plus anciennes sont supprimées (`val: null`). Le commit est atomique : en conflit, rien n'est écrit et `load()` rétablit l'index.
- **« À la dernière version »** (Maj + clic sur « Paramètres ») : grisé sans version ; dialogue « À la dernière version » : liste des versions (Date, Utilisateur), la plus récente choisie ; OK → « Voulez-vous remplacer le contrôle des coûts par la version du ^0 ? » (Avertissement, [C] E3) → droits → contenu de la version (index `historique` courant gardé), version forcée de l'état remplacé, `touch()`, toast « Contrôle des coûts remplacé par la version du ^0. » ; version introuvable : « Cette version de l'historique est introuvable. »

---

## 5. Documents imprimés

CH-07 n'a **pas de document propre** (`rech_orig` § 13). Points d'extension sur les documents de CH-01 :
1. **Lignes de détail du document « Contrôle des coûts »** (lot 2) : `ch01aOverviewJob` construit `detK` à partir des colonnes `details`. Remplacement d'une expression (ancre A22) par `typeof ch07bDetK==='function'?ch07bDetK(P):<ancienne expression>`. `ch07bDetK(P)` renvoie un `Set` des clés du moteur selon `lignesDetails` (ou le repli) : `mut`, `ctr` (contrat **ou** avenant : exact au bureau, où les deux drapeaux vont toujours ensemble), `pay`, `prov`, `cpp`.
2. Les signes, la marque du dernier paiement, la date de facture, `displayOnlyThreeDigitPos` et les titres sont **déjà lus** par CH-01 dans `options` / `titresColonnes` : rien d'autre à faire.
3. Le filtre ne s'applique pas au document [P].
4. Lot 4 : les options d'ORDRES DE PAIEMENT écrites par « Paramètres » (`soldeAvantApres`, `displayBkpText`, `displayPayDate`) sont celles que lit déjà `ch01dOrder*` (l. 15694-15695).

---

## 6. Valeurs de contrôle

### 6.1 Tests jsc (par lot ; fixtures de `ch/CH-07/fx/` et extraits de la copie de base, effacés après usage)
| Lot | Cas | Attendu |
|---|---|---|
| 1 | `ch07aEmpty(4951, 2051)` comparé au CC 4951 | `parametres`, `genresMutation`, `genresPaiement`, 20 `catalogueConditions`, 190 `titresColonnes` (espaces finales comprises), 9 sections de `presentations` identiques ; `statutMutationDefaut` null |
| 1 | Statut proposé à une nouvelle mutation, `statutMutationDefaut` null (CC 2101, 4954) | « brouillon » ; CC 301 : « acceptee » ; CC 952 : « provisoire » |
| 1 | Configuration du CC 954 | 9 genres de mutation, `mu`, `pv`, `mv` en tête ; 4 genres de paiement en minuscules ; OK sans changement → contenu identique sauf `bonParOuvrage` = faux |
| 1 | Configuration du CC 301 | « Numéroter les ordres séparément … » cochée ; statut de mutation « Acceptée » |
| 1 | Doublon de genre | création de `T1` dans un CC standard → « Il existe déjà une mutation T1. » ; paiement `AC` → « Il existe déjà un paiement AC. » ; règles d'OK (FR vide → inactif ; paiement : facture vide → inactif) |
| 1 | Titres, CC 251 | `contractAndAddendumTot` = [« Contrats », « / avenants »] ; `kvTot` « Devis général » ; « Standard » → 190 clés du CC 4951 |
| 1 | Table catégorie → clés | union des 18 catégories = 190 clés du CC 4951, sans doublon |
| 1 | Comptes MO | CC 3702 : 1 compte complet (10 champs) ; CC 3801 : banque et IBAN seuls, « Compte » = IBAN ; IBAN : 5 acceptés, 5 refusés sur les 10 comptes MO (même verdict qu'`isIBANValid`) |
| 1 | Banque d'un paiement | entité sans compte égal (ACCOUNT2 + IBAN) → 1 `bankaccount` créé ; entité qui a déjà le même couple → aucun |
| 1 | TVA | les 8 sites lisent `vatDefault()` (8.1 au bureau) |
| 2 | `kvValue`, CC 301, favorite « DG révisé MO » | total général **907'200.00** (aujourd'hui 977'054.40) |
| 2 | `awardingProfit`, CC 4954, Standard | **5'632'460.00** (aujourd'hui −5'632'460.00) ; `kvTotInclFac` 6'000'000.00 ; `kv1M2Procent`, `kv1M3Procent` vides |
| 2 | Totaux inchangés | CC 301 / 3601 / 2101 / 4954 / 251 / 952 : DG TTC 977'054.40 / 6'000'000.00 / 136'000.00 / 6'000'000.00 / 501'800.00 / 1'623'100.00 ; coût probable TTC 985'963.85 / 6'013'769.93 / 137'000.00 / 6'328'540.00 / 586'151.71 / 2'592'674.60 |
| 2 | Présentations du CC 3601 | 3 ; Standard favorite, 13 colonnes et largeurs (`kag` 60, `kagText` 200, `entrepreneur` 200, `kvTot` 100, `mutationTot1` 50, `contractAndAddendumTot` 100, `addendumToContractTot` 50, `additionalCostsTot` 50, `kv1Tot` 100, `payementTot` 100, `forcastCalculatedTot` 100, `balanceOfCostsTot` 100, `kvProcent` 50) ; signe « >␣ », marque « FF » active, paiements colorés ; « Récapitulatif » : 10 colonnes, signe « > », sans couleur, gras 3 chiffres |
| 2 | CC 4853 | favorite « Soumission » : 4 colonnes, **sans** colonne Entreprise |
| 2 | Présentations, règles | Enregistrer copie la 1re (pas la favorite) ; supprimer la 1re → « Cette écriture ne peut pas être effacée. » ; nom pris → « Ce nom est déjà utilisé. » |
| 2 | Détails (repli) | 126 des 130 présentations du bureau : repli = drapeaux `*_Row` du convertisseur (4 exceptions attendues : celles sans détail ou « mutations 1 seules ») |
| 2 | Filtre CC 3601 (règle DeltaSub [D]) | « Tout CFC » 1 à 6 : totaux inchangés ; [2..3] : 80 positions, DG 4'819'000.00, C+A 4'514'924.21, paiements 4'708'392.94, coût probable 4'803'654.13 ; [2..29] : 66 positions, DG 3'786'000.00 ; [..2] : 24 positions, DG 290'000.00 ; [4..] : 22 positions, DG 891'000.00 (`research/crit_CH-07/t_filtre.js`) |
| 2 | Navigation | > 30 positions de moins de 4 caractères → seules celles de moins de 3 |
| 2 | Import des présentations | champs copiés / non copiés du § 4.11 (deux CC de test) |
| 3 | Domaine | affaire 1401 : 15 lignes, 16 avec les supprimés ; affaire 918 : 1 / 10 ; affaires 601, 2451, 3352, 3501, 3502 : vides sans les supprimés |
| 3 | Module, utilisateur 2752 | 28 lignes, 49 avec les supprimés |
| 3 | Historique | 3 enregistrements en 10 min → 1 version ; un 4e à 11 min → 2 ; la 6e version supprime la plus ancienne ; conflit → aucune version écrite |
| 3 | Duplication | Version « X Copie », mêmes n°, statut, date, utilisateur, note ; `cocodoc` copiés avec le nouvel id |
| 4 | Filtres ADJUDICATIONS / MUTATIONS | défauts des 33 / 3 CC du bureau (non appliqués) : listes inchangées ; filtre « Avenant » seul → seuls les avenants |

**Attention** : le CC 3401 a été réenregistré dans la base de test le 01.10.2026 (08 h 27) : ne pas l'utiliser sans revérification. Syntaxe : `jsc -e "new Function(readFile('f.js'))"` sur DeltaSub.html construit + lot.

### 6.2 Essais navigateur (copie isolée, par lot ; port propre, `localStorage.ds_user='2752'`)
- Lot 1 : CC 3601 ▸ Paramètres : ordre du menu, entrées grisées ; Configuration (4 catégories, nouveau genre, doublon, Comptabilisation) ; Comptes MO du CC 3702 ; paiement : Coordonnées bancaires, création du `bankaccount` ; Titres (Standard, deux lignes) ; nouveau CC = défauts.
- Lot 2 : CC 3601 : présentations, clic droit sur un en-tête, glisser, Détails ▸, Affichage (signe, marque, gras, couleurs), Navigation, filtre [2..3] ; CC 301 : 907'200.00 ; CC 4853 sans Entreprise ; aperçu du document Contrôle des coûts (iframe) avec les détails des `lignesDetails`.
- Lot 3 : domaine affaires 1401 et 918, case des supprimés, fiche, duplication, corbeille en deux temps, retour au domaine, Maj + clic ▸ À la dernière version.
- Lot 4 : filtres ADJUDICATIONS et MUTATIONS, Paramètres d'ORDRES DE PAIEMENT et aperçu de l'ordre.

---

## 7. Écarts assumés

| # | Écart | Raison |
|---|---|---|
| E1 | Enregistrement continu ; pas de « Fichier ▸ Enregistrer » masqué selon la sauvegarde automatique ni de question à la fermeture | modèle DeltaSub (base partagée) |
| E2 | Historique DeltaSub (5 versions, 10 min) au lieu des archives `coco_<date>` / zip ; pas de reprise des 897 archives | D12 de CH-02 ; Q4 |
| E3 | « À la dernière version » : choix et confirmation | sécurité ; l'original restaure sans message |
| E4 | Case « Afficher les documents supprimés » au lieu de ⌥/⌃-clic | cohérence CH-02 / eCCC |
| E5 | Titres de colonnes en français seulement ; genres en 4 langues | DE/IT/EN non convertis ; Q1 |
| E6 | Noms des centres de coût en lecture seule | jamais personnalisés au bureau ; Q2 |
| E7 | Couleurs : défauts de l'original pour tous les CC importés | `Ser2Json` n'exporte pas `java.awt.Color` ; Q3 |
| E8 | Colonnes inconnues affichées vides ; entrées non calculables grisées dans le menu des colonnes | ne rien perdre de la présentation du bureau |
| E9 | Centres de coût affichés grisés dans la Configuration | effets relevant de CH-18 |
| E10 | Colonne « Coût probable TTC » ajoutée à la liste | repère utile (extension, comme CH-02 E12) |
| E11 | Suppression définitive : les PDF restent au dépôt (inaccessibles) | CH-03 garde les octets ; l'original laisse aussi le dossier |
| E12 | Détails « contrats » et « avenants » réunis dans le document CH-01 | clés du moteur de CH-01 ; exact pour les 130 présentations du bureau |
| E13 | Ordre des sections : CONTRÔLE DU COÛT en premier (`CC_SECS`) | usage ; bloc hors chantier |

---

## 8. Écarts hors chantier signalés (non traités)

1. `bankDlg` (fiche d'adresse, l. 833) intervertit « N° compte bancaire » (ACCOUNT2) et « Compte postal » (ACCOUNT1) : **CH-04**.
2. Inscription des entreprises dans les Intervenants (rôle 19 + CFC) à la saisie d'un contrat (`ccContract`, D10 de `rech_exist`) : **CH-05**.
3. Réglages de Comptabilisation sans effet dans DeltaSub : numérotation des ordres par MO (CC 301), avenants non liés, TVA visible dans les nouvelles écritures, insertion automatique du texte de compte : à reprendre par CH-01 (ordres et paiements) ; signalés.
4. « Attribuer le devis général validé … » appartient à la section DEVIS GENERAL dans l'original : laissé dans « Paramètres » (extension).
5. Colonne « OUV » et sous-lignes par ouvrage de CONTRÔLE DU COÛT (1 présentation au bureau, CC 251) et options « Ouvrage » de l'Affichage : non dessinées (le moteur par ouvrage `ch01aOuv` existe ; à faire sur demande).

---

## 9. Points d'ancrage DeltaSub

Toutes vérifiées `grep -F -c` = 1 sur `df42ee3e…`. Le `build.py` de chaque lot prend le chemin de `DeltaSub.html` en argument, vérifie chaque ancre et échoue proprement si l'une a disparu ou n'est plus unique. Le code du lot est inséré avant la ligne `   DÉMARRAGE` (A0). « + » = insertion, l'ancien texte restant intact.

| # | Lot | Ancien (exact) | Nouveau |
|---|---|---|---|
| A0 | tous | ligne `   DÉMARRAGE` (commentaire) | bloc du lot inséré avant le commentaire |
| A1 | 1 | `function ccEmpty(id,pid){ return {` | `function ccEmpty(id,pid){ if(typeof ch07aEmpty==='function') return ch07aEmpty(id,pid); return {` |
| A2 | 1 | `function ccConfig(C,touch){` | `function ccConfig(C,touch){ if(typeof ch07aConfig==='function') return ch07aConfig(C,touch);` |
| A3 | 1 | `let C=null; const load=()=>{ C=JSON.parse(JSON.stringify(DS.get('costcontrol',id)\|\|ccEmpty(id,doc.PROJECT_ID)));` | + ` CCV.bs=ctBseq('costcontrol',id);` |
| A4 | 1 | `DS.commit([{t:'costcontrol',id,val:C},` | `DS.commit([...(typeof ch07cHistOps==='function'?ch07cHistOps(id,C):[]),{t:'costcontrol',id,val:C,bseq:CCV.bs},` |
| A5 | 1 | `(DS.get('costcontroldocument',id))}]);` | `(DS.get('costcontroldocument',id))}]).then(q=>{ CCV.bs=q; if(typeof ch07cHistDone==='function') ch07cHistDone(id); return q; });` |
| A6 | 1 | `  bar.append(ibtn({label:'‹ Liste',fn:()=>{ CCV.open=null; go('coco'); }})` | `  const CX=()=>({C,p,doc,id,touch,save,load,draw:()=>draw(),editDet:()=>editDet(),pane,bar,G,sec:CCV.sec}); ` + ancien |
| A7 | 1 | `ibtn({i:'wrench',t:'Paramètres',menu:()=>[{t:'Attribuer le devis général validé …',fn:()=>ccAssignDG(C,p,touch)},{t:'Configuration …',fn:()=>ccConfig(C,touch)}]}),` | `(typeof ch07aParamBtn==='function'?ch07aParamBtn(CX()):` + ancien sans la virgule finale + `),` |
| A8 | 1 | `const body=h('div',{style:{minWidth:'980px'}},formRows([['Entreprise',E],` | `const body=h('div',{style:{minWidth:'980px'}},formRows([['Entreprise',E],...(typeof ch07aPayBankRow==='function'?[ch07aPayBankRow(C,v)]:[]),` |
| A9 | 1 | `statutMutationDefaut\|\|'acceptee'` | `statutMutationDefaut\|\|'brouillon'` |
| A10 | 1 | 8 sites du taux 8.1 : `tva.value=o.tauxTVA??8.1;` ; `valeur:kind===6?8.1:0` ; `libelle:'TVA',refCond:'',valeur:8.1,appliquee:true}]).f` ; `po.tauxTVA=tva?tva.tva:8.1;` ; `ht:null,tauxTVA:8.1,tva:null` (2 sites : `ccMut` l. 2910, `ccEntry` l. 2933) ; `valeur:8.1` de `ccContract` (l. 2979) et de `ccPayment` (l. 3019) | `8.1` → `vatDefault()` ; le lot allonge chaque ancre à gauche jusqu'à l'unicité et la fige dans `build.py` |
| A11 | 2 | `if(sec==='CONTRÔLE DU COÛT'\|\|sec==='DEVIS GENERAL'){` | `if(typeof ch07bDraw==='function'&&ch07bDraw(pane,CX(),R)) return; ` + ancien |
| A12 | 2 | `ibtn({i:'list',t:'Présentation',menu:()=>[` | `...(typeof ch07bBarItems==='function'?ch07bBarItems(CX()):[]),ibtn({i:'list',t:'Présentation',menu:()=>typeof ch07bPresMenu==='function'?ch07bPresMenu(CX()):[` |
| A13 | 2 | `menu:()=>[{t:'Copier le contenu du tableau dans le presse-papier',fn:()=>copyTable(G)},{t:'Exporter le tableau dans un fichier CSV …',fn:()=>csvTable(G,'Controle_couts_'` (unique dans son entier) | `menu:()=>[...(typeof ch07bGearItems==='function'?ch07bGearItems(CX()):[]),{t:'Copier …` (suite identique) |
| A14 | 2 | `const k6=ch01aProp(bO,6,true), detK=new Set((P.colonnes\|\|[]).filter(c=>c.details&&CC_COL[c.id]&&CC_COL[c.id].det).map(c=>CC_COL[c.id].det));` | `const k6=ch01aProp(bO,6,true), detK=typeof ch07bDetK==='function'?ch07bDetK(P):new Set(…ancienne expression…);` |
| A15 | 3 | `  if(d==='Contrôle des coûts'){ C.append(` | `  if(d==='Contrôle des coûts'&&typeof ch07cDomain==='function'){ ch07cDomain(C,top,pane,p); return; }   // CH-07 lot 3` + saut de ligne + ancien |
| A16 | 3 | `if(CCV.open){ ccEditor(m,CCV.open); return; }` | + ` if(typeof ch07cModule==='function'){ ch07cModule(m,arg,this); return; }` |
| A17 | 3 | `{label:'‹ Liste',fn:()=>{ CCV.open=null; go('coco'); }}` | `{label:'‹ Liste',fn:()=>{ CCV.open=null; if(typeof ch07cBack==='function'&&ch07cBack()) return; go('coco'); }}` |
| A18 | 3 | `async function ccDuplicate(d){` | `async function ccDuplicate(d){ if(typeof ch07cDuplicate==='function') return ch07cDuplicate(d);` |
| A19 | 3 | `function ccEditDoc(p,d){` | `function ccEditDoc(p,d){ if(typeof ch07cEditDoc==='function') return ch07cEditDoc(p,d);` |
| S1 | 3 | `serveur_deltasub.py` : `PROTECTED \|= {"costestimatehist"}   # CH-02 lot 4 : historique des devis` | + ligne `PROTECTED \|= {"costcontrolhist"}   # CH-07 lot 3 : historique des contrôles des coûts` |
| A20 | 4 | `rows:C.contrats,sort:['lot',1]` | `rows:typeof ch07dRows==='function'?ch07dRows(C,'ADJUDICATIONS',C.contrats):C.contrats,sort:['lot',1]` |
| A21 | 4 | `rows:C.mutations,sort:['numero',1]` | `rows:typeof ch07dRows==='function'?ch07dRows(C,'MUTATIONS',C.mutations):C.mutations,sort:['numero',1]` |

Notes :
- A4 et A5 sont dans la ligne `save` déjà modifiée par CH-10 (P6) : insertions minimales, la garde `ch10cGuard` n'est pas touchée. Les crochets de l'historique (A4, A5) sont posés par le lot 1 et remplis par le lot 3 : aucun lot ne retouche une ancre d'un autre.
- A6 / A17 : textes distincts et non chevauchants une fois appliqués dans n'importe quel ordre.
- `ch07bDraw` délègue DEVIS GENERAL au lot 4 (`typeof ch07dKvDraw`) et renvoie faux pour les autres sections ; `ch07bBarItems`, `ch07bPresMenu` et `ch07bGearItems` délèguent de même hors CONTRÔLE DU COÛT.
- `HEAVY.push('costcontrolhist')` dans le code du lot 3 (comme `CH02D_HEAVY`) ; la ligne `HEAVY` n'est pas modifiée.
- Ancres à éviter : `grid(pane,G); return; }` et le début seul de la roue (5 occurrences chacune), `  render(m,arg){` (5).
- Préfixes `ch07a`…`ch07d` / `CH07A`…`CH07D` et `costcontrolhist` : 0 occurrence dans `DeltaSub.html` et dans les `.js` / `.py` de `ch/*/` (vérifié).

---

## 10. Plan en lots

### Lot 1 — Paramètres : menu, Configuration, comptes du MO, coordonnées bancaires, titres de colonnes, défauts d'un nouveau CC, dettes (préfixe `ch07a` / `CH07A`)
- **Contenu** : § 4.1 (menu, Maj + clic mémorisé, entrées des lots 2 et 3 par `typeof`, grisées sinon) ; § 4.2 (Configuration, dialogues de genres en 4 langues) ; § 4.3 et 4.4 (Comptes du MO, fiche bancaire commune, « Comptes », bouton du paiement et création du `bankaccount`) ; § 4.5 (titres, table catégorie → clés extraite du bytecode, Standard) ; § 4.6 (`ch07aEmpty`, constantes générées depuis le CC 4951) ; dettes : `bseq` à l'enregistrement (A3-A5), crochets d'historique pour le lot 3, contexte `CX` (A6), repli « brouillon » (A9), `vatDefault()` (A10).
- **Ancres** : A0-A10.
- **Dépendances** : aucune dans le chantier ; utilise CH-10 lot 3 (`ch10cGuard`, `documentlock`), CH-01 (déjà intégré).

### Lot 2 — Présentations de CONTRÔLE DU COÛT, colonnes, détails, Affichage, navigation, filtre et favoris, import des présentations, convertisseur (préfixe `ch07b` / `CH07B`)
- **Contenu** : § 4.7 à 4.11 ; dessin de CONTRÔLE DU COÛT réécrit dans `ch07bDraw` (largeurs, titres sur deux lignes, sans Entreprise forcée, valeurs `ch01aOvVal` → corrige `kvValue` et `awardingProfit`, options d'Affichage, `lignesDetails` avec repli, couleurs, gras, signes, filtre de session) ; menu des colonnes par catégories (catalogue), glisser, tri désactivé ; Détails ▸ ; Navigation ▸ ; fenêtre « Filtre » et fiche de favori ; « Importer les présentations … » ; point d'extension du document (A14) ; **convertisseur** : `lignesDetails` + `filtres.controle` (copie complète modifiée de `convertir_couts.py` + diff, § 3.4).
- **Ancres** : A11-A14 (+ A0).
- **Dépendances** : lot 1 (`CX`, menu « Paramètres » qui appelle `ch07bImport`). Le ré-import de la base partagée (pour les drapeaux et favoris des CC non modifiés) est une opération de l'intégrateur, avec l'accord de Paulo.

### Lot 3 — Liste du module, domaine d'affaire, fiche, duplication, corbeille, retour au domaine, historique et « À la dernière version » (préfixe `ch07c` / `CH07C`)
- **Contenu** : § 4.12 et 4.13 ; `ch07cList` commun (module : documents de l'utilisateur ; domaine : de l'affaire), `ch07cModule`, `ch07cDomain` (chargement à la demande), `ch07cHeadDialog`, `ch07cEditDoc`, `ch07cDuplicate` (fiche, `cocodoc`, PDF par `ch03aCopier`), `ch07cDelete` (deux temps, verrou), `ch07cOpen` / `ch07cBack` ; historique `ch07cHistOps` / `ch07cHistDone` / `ch07cLastVersion` ; `HEAVY.push('costcontrolhist')` ; protection de toutes les actions de la liste (`ch10cGuard`) ; **serveur** : S1 (copie complète modifiée + diff).
- **Ancres** : A15-A19, S1 (+ A0).
- **Dépendances** : lot 1 (crochets A4-A5 et entrée cachée du menu « Paramètres »). Indépendant du lot 2.

### Lot 4 — Réglages et filtres des autres sections (préfixe `ch07d` / `CH07D`)
- **Contenu** :
  1. **Filtre d'ADJUDICATIONS** (`AwardingFilterDialog`, `data.AwardingFilter`) : « Contrat », « Avenant » ; « Critères pour les contrats » : statuts ; « Début », « Fin » ; tableau « M | Ouvrage | Localisation » ; « Appliquer le filtre » ; enregistré dans `filtres.adjudications` ; appliqué aux lignes (A20).
  2. **Filtre de MUTATIONS** (`MutationsFilterDialog`, `data.MutFilter`) : « Afficher les transferts / les variations de coût / le renchérissement », « Statut », « Genre de mutation », « Début », « Fin », ouvrages ; `filtres.mutations` ; A21.
  3. **Filtre de DEVIS GENERAL** (`KVFilterDialog`, `KvFilterFavoriteDialog`) : favoris « Nom », « M | Ouvrage | Localisation | Facteur » ; doublon : « Cette désignation existe déjà. » [D : `FilterFavoriteDialog`] ; `filtres.devis` ; dessin du DEVIS GENERAL par `ch07dKvDraw` (appelé par `ch07bDraw`) avec le DG par ouvrage (`ch01aOuv`) multiplié par le facteur.
  4. **« Paramètres » de DEVIS GENERAL** (`KvPreferencesDialog`) : « Montants sans décimales », « Pourcentages sur le total général » / « Pourcentages sur les groupes principaux », « Décaler hiérarchiquement les montants », « Récapitulatif par ouvrages à la fin », « N'afficher que les positions de 1 à 3 chiffres » ; options de la favorite de `devis`, appliquées par `ch07dKvDraw`.
  5. **« Paramètres » d'ORDRES DE PAIEMENT** (`AdviceOfPaymentPreferencesDialog`) : « Afficher les montants avant/après exécution », « Afficher la désignation CFC », « Trier les paiements par CFC » / « Trier les paiements par numéro » ; clés `soldeAvantApres`, `displayBkpText` et le tri lus par CH-01 ; le lot vérifie la correspondance des champs dans `AdviceOfPaymentPref` [D].
  6. **Menu « Présentation » des autres sections** (choisir, « Enregistrer la présentation … », puis « Renommer » / « Supprimer » par `EditFavoriteDialog` : titre « Supprimer la présentation », tableau « Présentation », 1re non supprimable « Cette inscription ne peut pas être effacée. », confirmation « Voulez-vous vraiment supprimer la présentation ^0 ? ») : ne gère que les noms et les options (les colonnes de ces sections restent fixes, § 10.5).
  Les entrées passent par la roue et les boutons du lot 2 (délégation par `typeof`) ; chaque écriture : droits, `touch()`.
- **Ancres** : A20, A21 (+ A0).
- **Dépendances** : lots 1 et 2.

### 10.5 Non livré (et pourquoi)
| Élément | Raison |
|---|---|
| « Configurer le plan comptable … » (grisé « CH-05 ») | ouvre l'éditeur du plan comptable CFC de l'affaire (`ProjectCatalogDialog`), absent de DeltaSub ; à brancher quand CH-05 lot 3 / CH-06 lot 3 l'auront |
| « Définir facteur d'index. du DG … », « Calculer prorata … », effets des centres de coût, Mutations 2, ICC, montant plafonné, métré, libres, équations (effet), DESCRIPTIF, HONORAIRES | **CH-18** (D17 : seulement sur demande ; jamais utilisés au bureau) |
| « Chercher » (navigateur d'établissements bancaires) | répertoire SIX livré avec Deltaproject daté de 2017 (3 386 lignes, 556 Ko) : obsolète ; Q9 |
| Titres DE / IT / EN, noms des centres éditables, couleurs importées | non convertis ; Q1, Q2, Q3 |
| Colonnes et largeurs des présentations des autres sections ; cases « Afficher les détails », « Afficher le genre de contrat / de paiement » de COMPTES D'ENTREPRISE | DeltaSub dessine ces sections avec des colonnes fixes et COMPTES D'ENTREPRISE sans détail ; usage : une seule présentation « Standard » partout sauf 2 CC (PAIEMENTS) ; à reprendre avec une réécriture de ces sections (CH-01) |
| Colonne « OUV » et options « Ouvrage » de l'Affichage (effet) | 1 présentation au bureau ; § 8 n° 5 |
| Reprise des 897 archives de l'historique Deltaproject | D12 ; Q4 |
| Synchroniser l'adresse | déjà présent (CH-10 lot 3) |

---

## 11. Décisions restantes pour Paulo

1. **Q1 — Langues** : titres de colonnes en français seulement (proposé) ; les genres de mutation et de paiement s'éditent en 4 langues mais seules les saisies DeltaSub en auront (le convertisseur ne reprend que le français).
2. **Q2 — Noms des centres de coût** (catégorie 19 des titres) : lecture seule (proposé ; jamais personnalisés au bureau).
3. **Q3 — Couleurs de l'Affichage** : défauts de l'original pour tous les CC importés, réglables ensuite dans DeltaSub (proposé) ; ou étendre `Ser2Json.java` pour reprendre les couleurs du bureau.
4. **Q4 — Historique** : pas de reprise des 897 archives (proposé, comme D12) ; variantes : dernière copie `coco_<date>` par document (43 versions), ou tout.
5. **Q5 — « À la dernière version »** : avec choix et confirmation (proposé, comme CH-02) ou restauration immédiate sans message (original).
6. **Q6 — Liste du module** : documents de l'utilisateur, comme l'original et « Mes devis » (proposé) ; ou garder « affaire | documents ».
7. **Q7 — Duplication** : fidèle (« <version> Copie », fiche pré-remplie, même auteur) (proposé, demande du 30.09) ou comportement actuel (« (état intermédiaire) », n° + 1).
8. **Q8 — Ré-import** : après intégration du lot 2, ré-importer les données Deltaproject dans la base du bureau pour reprendre drapeaux de détail et favoris de filtre (seuls les CC non modifiés dans DeltaSub en profitent ; opération sur la base partagée).
9. **Q9 — Répertoire des banques** (« Chercher ») : ne pas le reprendre (proposé : liste SIX de 2017, obsolète) ou embarquer cette liste.
10. **Q10 — Lot 4** : à faire maintenant (filtres et réglages des autres sections : usage nul ou faible au bureau) ou seulement sur demande.

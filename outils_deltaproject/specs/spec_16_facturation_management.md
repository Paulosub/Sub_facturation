# Cahier des charges — CH-11 « Honoraires et facturation, lot 7 » : Management ▸ Contrats honoraires et Factures, documents `.dpdoc`, ancien document de facture, PDF, QR et fusion

**Version 2 du rédacteur critique, 30.09.2026 (14 h).** Elle remplace la version 1 de 12 h 35 (copie : `ch/CH-11/spec16/spec_16_v1_1235.md`). Les numéros de section de la version 1 sont conservés ; le journal des changements est à l'annexe A.

Ce cahier décrit comment reproduire dans `DeltaSub.html` ce que Deltaproject 16.05 offre encore pour les honoraires et la facturation, au-delà des lots 0 à 6 de spec_9 déjà intégrés :
- **Management ▸ Contrats honoraires** : 7 catégories, 4 fenêtres, 6 documents du jeu 0, 5 anciens documents ;
- **Management ▸ Factures** : 6 catégories, 4 fenêtres, jour de référence, 3 documents du jeu 0, 2 anciens documents ;
- les **documents d'objet au nouveau format** (jeux 1 et 2) : Offre d'honoraires, Contrat d'honoraires, Facture, enregistrés par objet ;
- les **Paramètres de l'ancien document de facture** (`PROJECTINVOICE.TEMPLATEPROPERTIES`) ;
- les **PDF stockés** : 3 options de la QR-facture, fusion facture + QR + annexes, pièces jointes du Controlling, « Importer des fichiers PDF du calcul ».

Il confronte les deux recherches du chantier dans leur **version 2** (`ch/CH-11/rech_orig.md`, 1 833 lignes, journal V1-V23 ; `ch/CH-11/rech_exist.md`, 398 lignes), la fiche CH-11 et le § 16 de l'inventaire (`research/inv/inventaire_modules.md`), ainsi que les cahiers voisins : spec_14 (CH-01), **spec_17 (CH-03, écrit depuis la version 1)**, spec_18 (CH-08), spec_19 (CH-10). Chaque point contesté a été revérifié à la source pour ce cahier (§ 1).

**Conventions**
- **[P] PROUVÉ** : bytecode `Classe.méthode@offset` (désassemblages `ch/CH-11/dis/`, outil `ch/CH-11/d.sh`), libellé `Strings.db (classe|clé)` noté [S], requête nommée [Q], données de la base de test (copie `ch/CH-11/deltasub.sqlite`), fichiers du bureau lus sans écriture.
- **[D] DÉDUIT** : interprétation cohérente, non démontrée ligne à ligne.
- **[C] CHOIX** : décision de conception pour DeltaSub, signalée à Paulo (§ 13 et § 17).
- `mg.` = `deltaproject.management.`, `mgl.` = `deltaproject.management.list.`, `pr.` = `deltaproject.project.`, `rep.` = `deltaproject.project.report.`

**Références DeltaSub.** `DeltaSub.html` du dépôt au 30.09.2026 14 h : commit **`9c9a3f9`** (CH-17 intégré), **14 522 lignes**, md5 `b5db79206029ddfe413a4ec83bcd3858`. `serveur_deltasub.py` : 431 lignes, md5 `20c0933d385f03f71d47e51202d03c3c`. Les 43 ancres de `rech_exist` § 1.6 et l'ancre serveur ont été recontrôlées sur ce fichier (`ch/CH-11/exist/ancres.py` : 0 en défaut), les nouvelles ancres de ce cahier aussi (§ 15). Le fichier change pendant le travail des chantiers parallèles : **seules les ancres textuelles du § 15 font foi**, les numéros de ligne sont indicatifs.

**État des chantiers voisins au 30.09.2026, 14 h** : CH-01 lot 1 écrit, non intégré (`ch/CH-01/lot1.js`, md5 `b5f4736e…`) ; CH-03 : cahier `spec_17` écrit (interface « figée » au § 3), lot 1 en cours d'écriture, **aucun `.js`** ; CH-08 et CH-10 : cahiers écrits, aucun code ; CH-17 : intégré.

**Mise à jour de l'état, 30.09.2026, 18 h 30** (sans changement du contenu du cahier) : `DeltaSub.html` du dépôt est toujours au commit `9c9a3f9` (14 522 lignes, aucun `ch11`/`ch01a`/`ch03` intégré). CH-11 lots 1 à 3 sont écrits (`ch/CH-11/lot1.js` à `lot3.js`, notes d'intégration avec leurs corrections du cahier : `lot1_integration.md` § 6, `lot2_integration.md` § 6, `lot3_integration.md` § 8 ; **ces notes priment sur ce cahier** là où elles le corrigent). CH-01 lots 1 à 4 et CH-03 lots 1 à 3 sont écrits, non intégrés ; **toutes les fonctions CH-03 du § 10.1 existent** (`ch03a*` au lot 1, `ch03bView`, `ch03bContexte`, `ch03bEnregistrerPdf`, `ch03bNomDlg` au lot 2, `ch03cPdfZone`, `ch03cImporterDe` au lot 3) : le lot 4 relit leurs signatures réelles et applique CH-03 lots 1 à 3 dans sa copie de test.

**Décision D2 arrêtée par Paulo (30.09.2026)** : « réalisez le module de facturation, selon app d'origine ». La facturation vit dans DeltaSub ; les deux applications restent séparées (jamais de lecture ni d'écriture de `Facturation.html` ni de `localStorage sa_*`). Conséquence : les passages « ne pas construire, géré dans Facturation.html » de spec_8 § 6 et § 8 et de spec_3 § 6 sont **périmés** (§ 14).

**Choix par défaut arrêtés** : documents au nouveau format par le socle d'impression de **CH-01 lot 1** (`ch01aTplPick`, `ch01aPrep`, `ch01aTexts`, `ch01aNameDlg`) quand il est intégré, sinon `svDpHTML` directement, jamais `mgPrint` ; ancien modèle DESIGN en repli. Fichiers PDF, fusion et « Afficher le PDF » par l'API de fichiers de **CH-03** (`spec_17` § 3), dans le **dernier lot** seulement, entrées grisées (`typeof`) tant qu'elle manque. Courriel : téléchargement du PDF puis `mailto:`, jamais d'envoi automatique (D8, fait par CH-03).

**Aucune donnée personnelle** : identifiants (affaire, contrat, facture, contact), compteurs, montants et libellés d'interface seulement. **Aucun contenu CRB.**

---

## 0. Synthèse

1. **Deux modules Management, dix fenêtres, treize catégories** [P `mg.ProjectContractFrame.showMenu@29-155`, `mg.ProjectInvoiceFrame.showMenu@39-147`]. Contrats honoraires : Contrats et Contrats et sous-traitants (**une** fenêtre, même filtre, mêmes cases), Echéancier d'encaissements, Encaissements planifiés / reçus / Situation (même structure, **une fenêtre par catégorie**, chacune avec son affaire et son contrat), Avancement des prestations. Factures : Vue d'ensemble de l'année, Selon statut, **une seule fenêtre pour les trois catégories par date** (même filtre, même tri, même jour de référence), Honoraires et frais. **Chaque retour sur une catégorie recalcule** le tableau (les réglages de la session restent).
2. **Le jour de référence appartient aux trois catégories par date**, pas à « Honoraires et frais » (fiche corrigée) [P 43 occurrences de `reportingDate` dans `ProjectInvoiceDateFilterFrame`, 0 dans `ProjectInvoicePendingFrame*`].
3. **Les 9 documents Management sont des rapports temporaires du jeu 0** [P `doc.app.Reports.newReport(Window,DocumentType)` → `SelectTemplateDialog.browseTemplate(…,"Group.general")`]. Ils impriment le tableau de l'écran et ne sont jamais enregistrés : c'est `ch01aTplPick(type, null)` de CH-01 ; au bureau, un seul modèle fr non masqué par type (pas de dialogue).
4. **Modèles du bureau** [P comparaison JSON]. Les 6 `managementContracts*` sont identiques aux originaux 16.05 ; les 3 `managementInvoice*` sont d'anciennes copies jamais vues au bureau. [C] On garde les modèles du bureau avec **deux corrections à l'impression** : la date figée « 9. Dezember 2021 » (champ `date`/`dateFull` de l'original) et les textes de page allemands « Erstellt von » / « Seite » (→ « Créé par » / « Page ») (D-CH11-2, D-CH11-7).
5. **Aucun moteur existant ne suffit tel quel** : `mgPrint` ignore le format des champs et ne doit pas être modifié. CH-11 passe par `svDpHTML` après une **mise à plat des champs** (`ch11aFlat`).
6. **Documents d'objet** (Offre, Contrat, Facture) : panneau « Document » sous le tableau des 4 écrans (calcul, contrats, factures, Contrôle de factures), document enregistré par objet dans une **nouvelle collection `hfdoc`** (copie du modèle, textes modifiables, données recalculées à chaque ouverture). Le panneau est **propre à CH-11** (`ch11cPanel`) pour garder les libellés exacts de l'original ; sa liste « Fichiers PDF » vient de CH-03 (`ch03cPdfZone`) au lot 4 (§ 1 n° 34).
7. **Panneau fidèle à 16.05** (corrigé en version 2) : sans document, le bouton principal porte le libellé de création **entre guillemets** « «Nouveau document de facturation» » ; les points de suspension sont « espace + … » ; « QR-facture … » suit « Enregistrer sous forme de fichier PDF … » **sans séparateur** [P V11, V12, V23].
8. **Paramètres de l'ancien document de facture** [P `pr.invoice.InvoiceDialog.codePreferences/decodePreferences`] : 35 valeurs « ; », dialogue « Paramètres » (Document, Impression), écriture immédiate dans la facture et défaut du poste. **Défaut de DeltaSub corrigé** : `ivPrintOpts` lit prix et unités aux indices 20 et 21 au lieu de **21 et 22**.
9. **Ancien document de facture dans une visionneuse** [C, D-CH11-6] : « Document de facturation … [Ancien document] » ouvre une visionneuse « Facture » (boutons « Préférences », « Imprimer », « Fermer »), comme `InvoiceDialog`. Sans réglage enregistré, l'impression reste **identique à aujourd'hui** (police et interligne du modèle, D-CH11-8).
10. **« Honoraires et frais » affichera des chiffres trompeurs au bureau** : 49 814.00 h facturables non facturées (84 affaires) et 518 754.31 CHF, plus 27 585.74 CHF de frais, parce que la facturation réelle se fait dans `Facturation.html`. La fidélité impose de les afficher (D-CH11-5).
11. **Tout ce qui écrit des fichiers est au lot 4**, écrit contre l'interface figée de CH-03 (`spec_17` § 3, table de correspondance § 3.5), chaque entrée gardée par `typeof` et grisée avec l'infobulle « Fichiers PDF : prévu avec CH-03 » tant qu'elle manque. Les lots 1 à 3 appellent des **crochets** (`ch11dXxx`) gardés par `typeof` : le lot 4 n'a aucune ancre dans le code des lots 1 à 3.
12. **Plan : 4 lots** (§ 16). Lot 1 `ch11a` : socle et Management ▸ Contrats honoraires. Lot 2 `ch11b` : Management ▸ Factures et Paramètres de l'ancien document de facture. Lot 3 `ch11c` : documents d'objet `.dpdoc` (après CH-01 lot 1). Lot 4 `ch11d` : PDF, QR, fusion, pièces jointes, import (après CH-03). Le libellé « Offres d'honoraires » est fait par **CH-10 lot 1** (et non « lot 4 » comme l'écrivait la version 1).

---

## 1. Arbitrages entre les sources (tranchés à la source)

| # | Sujet | Affirmations en présence | Verdict | Preuve |
|---|---|---|---|---|
| 1 | Où vit la facturation | inventaire § 15 D2 : ouvert ; spec_8 § 6/§ 8, spec_3 § 6 : « Facturation.html » | **DeltaSub** (D2 arrêtée par Paulo) ; lots 0-6 de spec_9 livrés, collections honoraires dans `PROTECTED` | demande de Paulo du 30.09.2026 ; `serveur_deltasub.py` l. 42-48 |
| 2 | Jour de référence | fiche CH-11 : « Honoraires et frais » | **Seulement** les 3 catégories par date | [P] `grep reportingDate` : 43 dans `ProjectInvoiceDateFilterFrame`, 0 ailleurs |
| 3 | Instances des fenêtres | rech_orig v1 : « singleton » | Contrats / et sous-traitants : **une** instance (`isSubContractVisible` basculé) ; Encaissements planifiés / reçus / Situation : **une par catégorie** (`EnumMap`) ; Date de la facture / d'échéance / d'encaissement : **une** ; chaque sélection recalcule | [P] `ProjectContractAnalyzeFrame.setFrame@0-39`, `ProjectContractPaymentsFrame.setFrame@0-58`, `ProjectInvoiceDateFilterFrame.setFrame@0-33` (V1) |
| 4 | Défauts du filtre `ReportFilter` | `mgRF` de DeltaSub : statut coché par défaut | Filtre **arrêté**, période janvier - décembre de l'année courante, **« Filtré selon statut » = faux** (« Toutes les affaires » cochée à la première ouverture du dialogue) | [P] `ReportFilter.<init>(String,String,Z,Z)@19-26` |
| 5 | « Affaires en cours et terminées » | spec_8 : `isActive()` (2, 3) | **2 ≤ `PROJECTSTATECODE` ≤ 4** pour contrats, échéancier et factures (`pIsActive` de DeltaSub = 2 et 3 : ne pas l'utiliser) | [Q] `ProjectContract.findByProjectState`, `ProjectInvoice.findBy…AndProjectState` ; [P] `db.Project$ProjectState` (V20 : 1 Configuration, 2 En cours, 3 En attente, 4 Terminée, 5 Archivée) |
| 6 | Libellé du filtre | `mgRFlabel` : « Filtré » dès qu'un critère existe | Toujours **la période** « janvier 2026 - décembre 2026 » quand le filtre est en marche, rien sinon | [P] `ReportFilter.getDesc@0-113`, `hasCriteria@0-54` (toujours vrai) |
| 7 | Colonne « Affaire » des contrats | spec_3 : affaire | Ligne de contrat : **nom du contrat** ; défaut reproduit (le modèle du bureau l'imprime aussi) | [P] `ProjectContractListReportTableModel.getValueAt@42` |
| 8 | Colonne « Mandataire » | — | `getContactDesc()` du **mandataire** (`SUPPLIERCONTACT_ID`) = `svContactDesc` | [P] `getValueAt@137-149` |
| 9 | « Encaissé » d'un contrat | Σ encaissements ou Σ `AMOUNTPAID` | **Σ `PROJECTPAYMENT.AMOUNT`** du contrat | [P] `db.ProjectContract.getAmountPaid@3-44` |
| 10 | Contrats refusés dans « Honoraires et frais » et l'Avancement | — | **Comptés** (aucun test de statut) | [P] `ProjectInvoicePendingTableModel.<init>@147-289` ; `ProjectPerformanceTableModel.getReport` |
| 11 | « Contrats » de « Honoraires et frais » | v1 : « si ≠ 0 » ambigu | Somme HT (±) des conditions honoraires et frais des calculs liés ; **les trois lignes** reçoivent « Contrats » seulement si H + F ≠ 0 ; contrat **sans calcul ignoré** ; une ligne peut afficher 0.00 si l'autre part ≠ 0 | [P] `<init>(Z)@139-332` (V2) |
| 12 | « Solde à encaisser » de « Honoraires et frais » | v1 : « Contrats vide = 0 » | **Vide** si « Contrats » est vide (donc aussi sur les lignes Honoraires et Frais) ; sinon Contrats − Factures sur contrat | [P] `$ReportRow.getPendingContractAmount@0-34` (V2) — **correction de la version 1** |
| 13 | HT d'une condition et d'une facture | — | Condition : `getAmount2VatExcluded()` = **SubTotal3** (`feeCond(a).st3`) ; facture : `AMOUNT − Σ positions de genre 4 et 5` (`invHT`) | [P] `db.ProjectFeeCalculationAmount.getAmount2VatExcluded@1` ; `db.ProjectInvoice.getAmountExcludedVat@0-9` (V3) |
| 14 | Heures et frais facturables | formule à prouver | Heures `ISCHARGEABLE` et non `ISCHARGED`, **toutes périodes** ; montant = `mgRates().fee(t)` ; frais facturables non facturés × `EXTERNALRATE` (`pcAmount`) | [P] `TimeLog.getTimeLogList(p,…,−1,−1,TRUE,FALSE)@340-356` ; `db.TimeLog.getAmount@1-25` ; `db.ProjectCost.getExternalAmount@1-9` |
| 15 | Documents Management et choix du modèle | spec_9 § 10.1 : paramètre de jeu dans `mgPrint` ; inventaire § 16.4 n° 3 : socle CH-01 | **Jeu 0 par `SelectTemplateDialog`** (« Group.general ») = `ch01aTplPick(type, null)` ; `mgPrint` ni modifié ni utilisé | [P] `doc.app.Reports.newReport@2-12` ; `doctemplate` 10, 372, 377, 747-767 |
| 16 | Variante `managementInvoicePendingReport-1.dpdoc` | copie parasite | **Invisible** : aucun `doctemplate` ne la référence (IDs 9, 10, 11, 374 du type) | [P] table `doctemplate` (V19) |
| 17 | Modèles Management Factures | rech_orig : originaux 16.05 recommandés | [C] **Modèles du bureau** (ce que la base contient et ce que Deltaproject imprimerait), **plus** deux corrections à l'impression : date figée (E9) et textes de page allemands (E13) | [P] diff JSON bureau / `OriginalTemplates.zip` (annexe C de rech_orig) |
| 18 | Moteur des documents d'objet | spec_9 § 10.1-10.3 | `svDpHTML` (pur) après `ch01aPrep` puis `ch11aFlat` ; données recalculées à l'ouverture | [P] `svFmtVal` ne connaît que `contact`, `project`, `staff`, `date` |
| 19 | Tableau « Factures à ce jour » | spec_9 § 10.1 : dans le modèle | **Absent du modèle du bureau** (et de l'original 16.05) ; on le remplit quand même | [P] annexe B.1 et C de rech_orig |
| 20 | `paymentTable` du contrat | spec_9 § 10.2 : présent | Rempli par l'original, **jamais imprimé** par le modèle du bureau | [P] `rep.ProjectContractData.setProjectContract@0-106` ; annexe B.3 |
| 21 | Libellé « Offres d'honoraires » | spec_9 § 13 n° 1 ; v1 : « CH-10 lot 4 » | Nom du **domaine** seulement, fait par **CH-10 lot 1** (ancres H1-H4 de spec_19, `ds_am_dom` converti) ; CH-11 n'y touche pas et **ne compare jamais** le nom du domaine | [S] `pr.MenuTableModel|fees` ; spec_19 § 1 n° 24 |
| 22 | « Titres des colonnes en gras » | spec_9 § 10.1 : réglage | Affiché, **jamais enregistré** : l'indice 5 vaut toujours « 0 » | [P] `InvoiceDialog.codePreferences@70-102` |
| 23 | Liste des réglages de l'ancien document | spec_9 § 10.1 : totaux bruts, fond alterné… | Clés présentes dans Strings.db mais **inutilisées** par `pr.invoice.PreferencesDialog` 16.05 : liste réduite aux 2 catégories du § 9.2 | [P] `PreferencesDialog.<init>`, `initCategory` |
| 24 | Listes de polices et tailles du dialogue | — | Tailles : **6 à 12** ; polices : polices du système (`getAllFonts`) → [C] polices citées par les modèles `modele` du bureau, plus « Arial » et la valeur courante ; épaisseurs : décimal ; interligne : entier (8 chiffres) | [P] `pr.invoice.PreferencesDialog.<init>@820-1091` (boucles `6 … <13`, `getAllFonts`, `NumberGuard`) |
| 25 | Panneau « Document » : libellés | capture DE v15 : « Rechnungsdokument » ; CH-03 § 6.5 : « Nouveau document » | 16.05 : « Document », « Nom du document », « Fichiers PDF » ; bouton principal = nom du document, sinon **« «<libellé de création>» »** (guillemets français sans espace) ; libellés de création : « Nouveau document de facturation », « Nouveau document contrat », « Nouveau document de calcul », « Nouveau document » (Contrôle de factures) | [P] `DocumentReportPanel.setDocumentName@27-40`, bootstrap `«\u0001»` (V11) ; [S] `ProjectInvoiceFrame|newInvoiceDocument`, `ProjectContractFrame|newContractDocument`, `ProjectFeeFrame|newFeeCalculationDocument`, `invoice.ProjectInvoiceStateFrame|newInvoiceDocument` |
| 26 | Points de suspension | v1, CH-01, CH-03 : « … » collé | **« espace + … »** pour les entrées de l'original : « Renommer le document … », « Enregistrer sous forme de fichier PDF … », « QR-facture … », « Afficher le rapport … » | [P] `rsrc.Strings.addEllipsis@0-20` (constante « ␣… ») (V12) |
| 27 | Séparateur avant « QR-facture … » | v1 § 8.4 : « séparateur puis » | **Aucun** séparateur pour la facture ; le contrat commence, lui, par un séparateur | [P] `pr.ProjectInvoiceDocumentReport.addDocumentPopupMenuItems@0-70` ; `ProjectContractFrame$ProjectContractDocumentReport.addDocumentPopupMenuItems@7` (V23) — **correction de la version 1** |
| 28 | « QR-facture … » du panneau | `qrPrint` de DeltaSub : QR existante → génération | L'**éditeur** s'ouvre si la QR-facture n'existe pas, si son montant ≠ `AMOUNT` ou si sa monnaie ≠ monnaie de l'affaire ; sinon « Créer une QR-facture » ; puis rafraîchissement | [P] `pr.ProjectInvoiceDocumentReport.qrBillPdf@1-78` |
| 29 | Option A de la QR-facture | v1 : grisée sans dossier | **Toujours disponible** en 16.05 (la facture est toujours transmise). Défauts sans préférence : option A, sous-option « **Ajouter le QR-facture à la fin de la facture** », « Afficher le fichier PDF » **décoché**, langue « Deutsch », « Portrait A4 », « Sans » ; 3 séparations au bureau | [P] `GenerateQRBillDialog.<init>@381-404`, `loadPreferences@230-639` (V7) ; [C] langue « Français » gardée (spec_9 § 13 n° 15, E16) |
| 30 | « Enregistrer sous forme de fichier PDF … » | rech_orig v1 : en-tête avec le nom | En-tête « **Créer un fichier PDF à partir du document** » (sans nom) ; nom proposé « `<nom du document>.pdf` » | [P] `DocumentReportPanel.saveDocumentAsPdf@17-50` (V10) ; spec_17 § 1 n° 10 concorde |
| 31 | « Sélectionner une facture » (pièces jointes) | CH-03 § 3.3 : « Sélectionner une facture (…) » | Titre **exact, sans suffixe** ; 4 colonnes Désignation, Numéro, Date de facture, Statut (= `IV_BCOLS` de DeltaSub) ; OK si une ligne est choisie | [P] `ProjectInvoiceBrowserDialog.<init>@12-65`, `db.ProjectInvoiceTableModel$TableType` (V13) |
| 32 | Formats des champs | — | Montants et taux des champs contrat, condition, facture : `formatDouble` (2 décimales, « ' ») ; taux 7.7 → « 7.70 » ; date sans format de date → **MEDIUM** (« 2 mars 2026 », `svDateFmt`) ; condition du tableau : « \u0001 % » sur un double Java (« 7.7 % », « -2.0 % ») | [P] `FieldStyles.getDateString@0-99`, `getProjectContractString@0-189`, `getProjectFeeCalculationAmountString@0-242` (V17) |
| 33 | Anciens documents Management : titres et en-têtes | v1 : titre = libellé de la catégorie | Titres par défaut **propres** : « Liste des contrats », « Echéancier d'encaissements », « Plan de paiements », « Plan d'ordres de paiements », « Contract - paiements » (sic), « Analyse de factures », « Contrôle de factures ». En-têtes de l'original **décalés d'une colonne** pour les contrats et les encaissements planifiés, « Vertragsart » non traduit : [C] en-têtes de l'écran (E15, D-CH11-9) | [P] `mgl.*.analyse`, `*Page.createTableColumns` (V18) |
| 34 | Panneau Documents : local ou générique | spec_16 v1 : `ch11cPanel` ; spec_17 § 3.4 : `ch03cPanel` instancié 4 fois | **Partie « Document » locale** (`ch11cPanel`, sur `hfdoc`) ; **zone « Fichiers PDF » de CH-03** (`ch03cPdfZone`, lot 4). Raisons : `ch03cPanel` affiche « Nouveau document » au lieu de « «libellé» » et met un séparateur avant les entrées de l'appelant (faux pour la facture, n° 25 et 27) ; `ch03cPdfZone` est prévue par CH-03 pour les panneaux déjà écrits | [P] n° 25, 27 ; spec_17 § 3.4, § 6.5, § 6.6 |
| 35 | Ancien document : fausse fenêtre (T1) ou capture CH-03 | rech_exist : double emploi avec `ch03bCapture` | **T1 gardée** (`o.win`, une expression) : compatible avec l'interception de CH-03 (quand `o.win` est fourni, `open` n'est pas appelé). La visionneuse de CH-11 (`ch11aView`) délègue à `ch03bView` quand elle existe | [D] spec_17 § 6.2 ; [C] |
| 36 | Verrou de l'offre d'honoraires | v1 : « CH-03 (verrou) » ; spec_17 : CH-10 lot 3 | CH-10 lot 3 ne couvre que les documents Bâtiment (`ch10cGate` lié à `DV.open`, `CCV.open`, `EC_V.open`) : **non livré** ici, conflits 409 seulement (§ 16) | [P] spec_19 § 4.10 |
| 37 | Rôles 4 et 51 du contrat | TPL_ROLE : 50 pour « BuilderConsultantStandby » | `projectMemberProjectManager*` = rôle **4**, `projectMemberBuilderConsultantStandby*` = rôle **51** (50 = BuilderConsultant) | [P] `db.ProjectMemberRole$TeamRole.<clinit>@55-182` |
| 38 | Menu Rapports | v1 : deux entrées | « Afficher le rapport … », puis (si `isModuleFormVisible`) **séparateur** et « Afficher le rapport … [Ancien document] » ; Situation : séparateur puis « Enregistrer le diagramme … » ; les deux entrées « rapport » grisées si le tableau est vide | [P] `getReportsPopupMenu` des fenêtres ; `ProjectInvoiceStateFrame.getReportsPopupMenu@12-125` (V6) |
| 39 | Champs des anciens documents | — | `timespace` ← libellé du filtre (Contrats, Echéancier) ; `timespace` ← année (Vue d'ensemble, `reportFilter` vide) ; Contrôle de factures : `timespace` ← libellé du statut (Selon statut) ou « Jour de référence: jj.mm.aaaa » (par date, case cochée), sinon vide | [P] `InvoiceControl.control@0-153`, `InvoiceControlPage.fill@847-924`, `InvoiceAnalysisPage.fill@886-896`, `ProjectContractAnalysePage.fill@870-880` |
| 40 | `typeof` sur une constante déclarée plus loin | — | `typeof x` sur une `const` encore en zone morte **lève une erreur**. Tout nom CH-11 testé par `typeof` depuis du code exécuté **au chargement** (ancre I1 : `IV_PRCOLS`) doit être une déclaration `function` (remontée) ; par prudence, **tous les crochets appelés depuis une ancre sont des `function`** | [P] sémantique JavaScript (TDZ) ; `DeltaSub.html` l. 7429 `const IV_PRCOLS=ivPrintCols(ivPrintOpts(null))` |

---

## 2. Périmètre

### 2.1 Reproduit (fidèle)

- **MANAGEMENT ▸ Contrats honoraires** : liste « Catégorie » (7), filtres, cases de statut, tableaux, totaux par affaire et par monnaie, listes d'affaires et de contrats, diagrammes « Situation » (4 et 5 courbes), Rapports ▾, ⚙ (copier, exporter CSV).
- **MANAGEMENT ▸ Factures** : 6 catégories, ◀ année ▶, filtre de statut, filtre période et statut, jour de référence, 11 tris, « Mettre les montans en evidence de : » et « Afficher les détails », mise en évidence en vert.
- **9 documents** `.dpdoc` du jeu 0 et **7 anciens documents** DESIGN du groupe Standard (`managementTemplates`).
- **3 documents d'objet** `.dpdoc` (jeux 1 et 2) : panneau « Document » (nouveau, ouvrir, renommer, supprimer, modifier les textes), entrées propres (« QR-facture … », « Afficher le calcul des honoraires », « Importer des fichiers PDF du calcul »), refus de suppression.
- **Paramètres de l'ancien document de facture** : 35 valeurs, dialogue, écriture immédiate, défaut du poste, correction des indices, effets (modèle, page de garde, colonnes, polices, interligne, traits).
- **Lot 4, avec CH-03** : liste « Fichiers PDF » des 4 panneaux, « Enregistrer sous forme de fichier PDF … », QR « Nouveau fichier PDF », « Ajouter le QR-facture à la fin de la facture », « … comme nouvelle page à la fin », « Afficher le fichier PDF », « Enregistrer le PDF en pièce jointe … » (Controlling et calcul du contrat), « Importer des fichiers PDF du calcul », fusion, refus de suppression étendu aux PDF.

### 2.2 Choix DeltaSub

- **Visionneuse** `ch11aView` : `ch03bView` de CH-03 si elle existe, sinon dialogue interne (`iframe`) avec « Imprimer » (`contentWindow.print()`) et « Fermer ». Le panneau du navigateur de test bloque `window.open` : la visionneuse n'en a pas besoin [C].
- **Anciens documents** rendus dans la visionneuse par une **fausse fenêtre** passée à `tplPrint` (`o.win`, ancre T1) [C].
- **Défauts corrigés** : E1, E2, E3, E4, E6, E8 (interligne), E9 (date figée), E11, E13 (textes allemands) (§ 13) [C].
- **Ordre des monnaies** (HashMap de l'original) : seaux d'un `HashMap` Java de 16 cases (`ch11aHm`), identique à l'ordre alphabétique pour CHF, EUR, GBP, USD [C].
- **Préférences locales** (catégorie, tris, seuil, détails, défaut de l'ancien document, options QR) en `localStorage`, lecture et écriture en `try/catch` ; tout le reste du chantier est lecture seule, sauf `TEMPLATEPROPERTIES` et `hfdoc`.

### 2.3 Hors périmètre, retiré ou non livré

- **Libellé du domaine « Offres d'honoraires »** : CH-10 lot 1 (§ 1 n° 21).
- **Paramètres et favoris des anciens documents Management** (`*PreferencesDialog`) : non livrés (P3, double emploi avec les `.dpdoc`) ; l'impression prend le premier modèle du type dans le groupe Standard et les valeurs du modèle.
- **Verrou de l'offre** (`DocumentLockDialog`) : non livré (§ 1 n° 36).
- **Partage** (« Partager le fichier PDF … », « … individuellement ») et « Afficher le dossier » : entrées génériques de CH-03 (le second n'est pas livré par CH-03, E4 de spec_17) ; CH-11 fournit seulement le sujet et les destinataires (§ 10.6).
- **Signature** (`ImageField userSignature`) : vide ; fournie par CH-08 lot 3 (`ch08cSigFor`, ancre C5 de spec_18) s'il est intégré, sans code CH-11.
- **Éditeur de documents** (bandes, colonnes) : CH-14 ; « Modifier les textes… » de CH-01 en tient lieu.
- **Coloriage du document « Honoraires et frais »** : réservé aux comptes de développement (`App.isDevAccount`).
- **Rapports du Controlling au nouveau format** : CH-09 ; la pièce jointe du lot 4 part de l'ancien document actuel (`ctlPrint`).

### 2.4 Place et accès

- **Barre des modules**, groupe Management, ordre de l'original : Affaires - Genres d'affaires · Heures · Controlling · **Contrats honoraires** (`mg-contrats`, lot 1) · Planification RH · **Factures** (`mg-factures`, lot 2) · Collaborateurs · Maître d'ouvrage · Reporting [P `Modules$Module`, spec_10 § 0.3].
- DeltaSub n'importe ni licences ni droits : les deux entrées sont visibles pour tous, comme les domaines de spec_9. CH-08 les couvrira sans changement (règle `mg*` → droit `management`, spec_18 § 4.10.1).
- Anciens documents : entrées « … [Ancien document] » visibles si `ivFormVisible()` (réglage `isModuleFormVisible` ≠ `[NO]` ; `[YES]` au bureau).

---

## 3. Modèle de données

### 3.1 Collections lues (aucune modification de schéma)

| Collection | Champs utilisés |
|---|---|
| `projectcontract` | `ID`, `PROJECT_ID`, `NAME`, `NUMBER`, `SORTORDER`, `CONTRACTDATE`, `ISSUBCONTRACT`, `STATECODE` (0 En traitement, 1 Validé, 2 Refusé), `SUPPLIERCONTACT_ID`, `CONTACT_ID`, `SUPPLIERDESC`, `USERID`, `CONTRACTAMOUNT`, `TIMEHOUR`, `PROJECTFEECALCULATION_ID`, `SUBPROJECT_ID`, `REMARK` |
| `projectscheduledpayment` | `PROJECTCONTRACT_ID`, `NAME`, `PHASE_ID`, `SUBPHASE_ID`, `REMARK`, `INVOICEDATE`, `DUEDATE`, `PAYMENTDATE`, `AMOUNT`, `SORTORDER` |
| `projectpayment` | `PROJECTCONTRACT_ID`, `PROJECTINVOICE_ID`, `NAME`, `REMARK`, `INVOICEDATE`, `PAYMENTDATE`, `AMOUNT`, `SORTORDER` |
| `projectimplementation` | `PROJECT_ID`, `IMPLEMENTATIONDATE`, `SCHEDULEDVALUE`, `CURRENTVALUE` (−1 = vide) |
| `projectinvoice`, `projectinvoicepos` | champs de spec_9 § 2.2 ; `TEMPLATEPROPERTIES` (VARCHAR 255) écrit au lot 2 |
| `projectfee`, `projectfeecalculation`, `projectfeecalculationamount`, `projectfee*item` | documents d'objet, « Honoraires et frais » |
| `project`, `subproject`, `projectphase`, `projectsubphase`, `projectmember`, `contact`, `contactowner` | libellés, intervenants, adresses |
| `timelog`, `projectcost`, `projectactivity`, `projectrate` | « Honoraires et frais », Avancement |
| `qrbill` | « QR-facture … » (lot 3) |
| `doctemplate`, `doctemplategroup`, `modeledocument`, `image`, `modele`, `modelegroupe`, `formtemplate`, `formtemplategroup`, `textstyleset`, `rowstyleset` | impression ; les lourdes (`HEAVY`) sont chargées par `DS.need` / `tplNeed` avant la première impression |

### 3.2 Nouvelle collection `hfdoc` (lot 3) : un enregistrement = un dossier de documents d'objet

Nom libre (vérifié le 30.09.2026 14 h : 0 occurrence dans `DeltaSub.html`, le serveur et les `.js`, `.py`, `.html` de `ch/*/` hors CH-11).
- **Déclaration** : `const CH11C_T=(DS.loaded.add('hfdoc'),'hfdoc');` (modèle de `CH03A_T` de CH-03) : la collection est marquée chargée même vide, pour que `DS.poll` suive ses changements. Déclaration de haut niveau, sans accès au DOM.
- **Identifiant déterministe** (chaîne) : `<sous-dossier>/<ID de l'objet>`, avec les sous-dossiers de l'original [P `app.doc.Settings$ProjectDocumentType`] : `Invoices/<PROJECTINVOICE.ID>`, `Contracts/<PROJECTCONTRACT.ID>`, `FeeCalculations/<PROJECTFEECALCULATION.ID>`. Deux postes qui créent le même document en même temps obtiennent un 409, pas un doublon ; `DS.newIds` n'est pas utilisé.
- **Jamais supprimé** (`val` jamais nul) : « Supprimer le document » met `doc` à `null`, comme `cocodoc`.
- **Champs** : `ID`, `PROJECT_ID`, `dossier` (`Invoices` | `Contracts` | `FeeCalculations`), `objet` (ID numérique de l'objet), `doc` = `null` ou `{nom, type, templateDesc, jeu, fichier, report (copie profonde du modèle), creeLe, creePar, modifieLe, modifiePar}`.
- **Écritures** : un seul `DS.commit` par action, `bseq` lu à l'ouverture du dialogue (`ctBseq('hfdoc', id)`, 0 pour un nouvel enregistrement).
- **Cascade** : la suppression d'un objet est refusée tant que `doc` existe (§ 8.5) ; un enregistrement orphelin à `doc: null` est sans effet. `delProject` n'est pas modifié : les `hfdoc` d'une affaire supprimée restent orphelins [C, écart mineur].

### 3.3 Serveur : une ligne (lot 3)

`hfdoc` est saisie dans DeltaSub : elle entre dans `PROTECTED` (sinon un ré-import `--force` la viderait) [P `serveur_deltasub.py` l. 253, 257]. Copie modifiée complète et diff dans le dossier du lot ; ligne ajoutée **après** la ligne (inchangée) `             "projecttenderer", "devisdocument", "soumission", "soumissionhist"}` :
```
PROTECTED |= {"hfdoc"}   # CH-11 : documents d'honoraires et de facturation (offre, contrat, facture) créés dans DeltaSub
```
CH-03 (S1, `depotfichier`) et CH-02 (S2) ajoutent aussi une ligne après la même ancre : chacun la garde intacte, l'ordre d'application est indifférent. Le `build.py` du lot 3 accepte la présence de leurs lignes.

### 3.4 `PROJECTINVOICE.TEMPLATEPROPERTIES` (lot 2)

Format complet au § 9.1 (35 valeurs). Écriture : un commit d'une seule opération `{t:'projectinvoice', id, val:{…facture relue, TEMPLATEPROPERTIES:s}, bseq}` à l'OK de « Paramètres », `bseq` lu à l'ouverture de la visionneuse. Chaîne de 255 caractères ou plus : rien n'est écrit, sans message [P `codePreferences`].

### 3.5 Préférences locales (`localStorage`, `try/catch`, jamais indispensables)

| Clé | Contenu | Original |
|---|---|---|
| `ds_mg_contrats`, `ds_mg_factures` | dernière catégorie (géré par `mgCatView`) | `lastProjectContractMenuSelection`, `lastProjectInvoiceMenuSelection` |
| `ds_mg_inv_tri_statut`, `ds_mg_inv_tri_dates` | clé du tri de « Selon statut » et des catégories par date | `managementProjectInvoiceStateFrame.Preferences`, `managementProjectInvoiceDateFilterFrame.Preferences` |
| `ds_mg_inv_pending` | « seuil,1\|0 » | `projectInvoicePendingFrame.Preferences` |
| `ds_inv_tplprops` | dernier réglage de l'ancien document (défaut des factures sans réglage, D-CH11-3) | préférence `favoriteInvoiceDialog` (module `project`) |
| `ds_qr_gen`, `ds_qr_open` (lot 4, par `qrPref`/`qrPrefSet`) | sous-option `newPdf` \| `lastPage` \| `newPage` ; « Afficher le fichier PDF » `1` \| `0` | `qrbill.GeneratedPdf`, `qrbill.OpenFile` |

Filtres, cases de statut, année, jour de référence et sélections : mémoire de session seulement (l'original ne les mémorise pas) [P].

### 3.6 Arrondis et formats

- Écran : nombres par `mgRender` (`num(rJ(v))`, « 1'234.00 ») ; dates `dfr` (« 18.08.2025 »).
- Champs de documents : `num(rJ(v))` pour `Formatter.formatDouble` ; dates par `svDateFmt` selon le format du champ (MEDIUM par défaut, § 1 n° 32).
- Tableaux de documents : nombres passés en **nombres** (`svDpCell` les formate pour une colonne `doubleColumn`), dates en ISO (`dfr` pour `dateColumn`), entiers et textes en chaînes ; « vide » = `''`.
- Pourcentages de l'Avancement : `num(rJ(x))` ; `NaN` ou ±∞ (aucun contrat) → vide [C, E7].

---

## 4. Socle commun CH-11 (lot 1)

### 4.1 Fenêtre à catégories

`VIEWS['mg-contrats'] = mgCatView('contrats', CH11A_CATS, ch11aPane, 210)` et `VIEWS['mg-factures'] = mgCatView('factures', CH11B_CATS, ch11bPane, 210)` (affectations de haut niveau, comme `VIEWS['fact-controle']`). En-tête de la liste : « Catégorie » (défaut). Chaque fonction de volet renvoie `{tables, redraw}`. L'état de chaque **fenêtre de l'original** vit dans un objet de module pour la session : `CH11A = {ct:{…} (partagé par ct et cs), ech:{…}, ep:{…}, er:{…}, si:{…}, av:{…}}`, `CH11B = {an:{…}, st:{…}, dt:{…} (partagé par fd, ed, pd), hf:{…}}`. `mgCatView` redessine le volet à chaque sélection : le tableau est recalculé, l'état est conservé (§ 1 n° 3).

### 4.2 Filtre période et statut (`ReportFilter`)

- `ch11aRF(stName, perName)` = `Object.assign(mgRF(stName, perName, true, false), {st:false})` (§ 1 n° 4).
- Menu de l'entonnoir : `mgRFmenu(F, redraw)` (☐ « Appliquer le filtre », séparateur, « Editer le filtre … ») ; dialogue `mgRFdialog` tel quel (« Statut de l'affaire » : ( ) *stName* / ( ) « Toutes les affaires » ; *perName* « de » mois année « à » mois année ; OK met le filtre en marche).
- Libellé à côté de l'entonnoir : `ch11aRFdesc(F)` = `F.on ? mgRFper(F) : ''` (jamais « Filtré »).
- Test d'une date ISO `d` : `ch11aRFin(F, d)` = filtre arrêté → vrai ; sinon `d` non vide et `y1-m1-01 ≤ d ≤ dernier jour de y2-m2` (bornes incluses) ; date vide → faux.
- Test du statut : `ch11aRFst(F, p)` = `!F.on || !F.st || (p && p.PROJECTSTATECODE >= 2 && p.PROJECTSTATECODE <= 4)`.
- `mgRF*` n'est **pas modifié** (Controlling, Reporting).

### 4.3 Filtre des affaires (`ProjectFilter`)

`mgPF()` (en marche, « En cours »), `mgProjList(el, F, g, false, onSel)` (colonnes Numéro | Affaire), menu `mgPFmenu(F, redraw).slice(0, 2)` (l'original n'a pas « Annuler la sélection ») et `mgPFdialog`. Libellé : `mgPFlabel(F)`.

### 4.4 Rendu, tri des chaînes, ordre des monnaies

- Lignes pour `mgRender` : `{c:[…], b, lv, sp, cc}` ; « surlignée » = `lv:1`, « gras » = `b:true`, ligne vide = `sp:true`. Chaque ligne garde son **type** (`k` : `'info' | 'val' | 'sub' | 'tot' | 'vide'`) pour le document et l'ancien document.
- `ch11aJs(a, b)` : `String.compareTo` (unités UTF-16, `a < b ? -1 : a > b ? 1 : 0`), **pas** `localeCompare`.
- `ch11aHm(cles)` : ordre d'itération d'un `HashMap<String,…>` Java de capacité 16 (jusqu'à 12 clés) : tri par `(h ^ (h >>> 16)) & 15` où `h` = `String.hashCode` (`Math.imul(31, h) + code`), puis ordre d'insertion. CHF → 0, EUR → 3, GBP → 4, USD → 7.
- `ch11aAff(p)` = `pLbl(p)` (« NUMBER TITLE », `Project.toString`).
- Contact : `svContactDesc(c)` (`Contact.getContactDesc`).

### 4.5 Mise à plat des champs (`ch11aFlat(rep, F)`, pure) et corrections (`ch11aFix(type, rep)`, pure)

Sur une **copie** du rapport (déjà passé par `ch01aPrep` si CH-01 est intégré), tout `TextField {f:'…|N', s:S}` dont le format `S` appartient à `CH11A_FMT` devient `{f:'x|N~S', s:'standard'}`. Les valeurs `F['N~S']` sont calculées par les constructeurs de chaque document (lots 1 à 3). `svField` trouve `F['N~S']` sans modification. Les `ImageField` ne sont **jamais** touchés (signature de CH-08).

`CH11A_FMT` : `projectContractNumber`, `projectContractName`, `projectContractDate`, `projectContractSupplierDesc`, `projectContractType`, `projectContractUserId`, `projectContractState`, `projectContractRemark`, `projectContractAmount`, `projectContractAmountExcludedVat`, `projectContractAmountVat` ; `projectFee*` (Number, Name, BillingCategoryCode, BasedOnCode, SupplierDesc, ContractType, UserId, ChangedDate, Version, Remark) ; `projectFeeCalculation*` (Number, Title, Name, ChangedDate, Version) ; `projectFeeCalculationAmount*` (Amount1, SalesDiscountRate, SalesDiscountAmount, SubTotal1, CashDiscountRate, CashDiscountAmount, SubTotal2, Rounding, SubTotal3, VatRate, VatAmount, Amount2) ; formats d'affaire absents de `svFmtVal` : `projectStartDate`, `projectEndDate` (dates MEDIUM), `projectStartOfPlanning`, `projectEndOfPlanning`, `projectMoveInDeadline` (textes `STARTOFPLANNING`, `ENDOFPLANNING`, `MOVEINDEADLINE`) [P `FieldStyles.getProjectString@0-290`].

Défaut d'un format de contrat, d'en-tête ou de variante inconnu de la liste : le **nom** (`getName`), comme l'original [P].

`ch11aFix(type, rep)` (sur la copie, parcours profond, pages `rep.pageTemplates` comprises) :
- **E9** : pour `managementInvoicePendingReport` seulement, un `TextString` dont le texte rogné vaut « 9. Dezember 2021 » devient `{class:'TextField', f:'doc.reports.Report$ReportStringField|date', s:'dateFull'}` (« mardi, 30 septembre 2026 »).
- **E13** (D-CH11-7) : pour les 9 types Management, un `TextString` dont le texte rogné vaut « Erstellt von » devient « Créé par », et « Seite » devient « Page », espaces de bord conservés.

### 4.6 Impression d'un rapport (`ch11aReport(type, job, o)`)

`job = {F, tables}` (pas de `title`, sinon `svDpHTML` remplacerait le `reportTitle` du modèle) ; `o = {titre, old}` (titre de repli, fonction de l'ancien document).
1. `await DS.need(['doctemplate','modeledocument','image'])`.
2. Si `typeof ch01aTplPick === 'function'` : `t = await ch01aTplPick(type, null)` ; `null` → rien ; `'aucun'` → étape 4 ; sinon `rep = t.rep`, `jeu = t.jeu`. Sinon : `rep = (DS.T.modeledocument['0/' + type + '-fr.dpdoc'] || {}).report`, `jeu = '0'` ; absent → étape 4.
3. `R = svDpHTML(ch11aFlat(ch11aFix(type, typeof ch01aPrep === 'function' ? ch01aPrep(rep) : copie(rep)), job.F), [job], {jeu, type})` ; `ch11aView(R.title || o.titre, R)`.
4. Repli : `o.old()` (ancien document, § 4.8) s'il existe et si `ivFormVisible()`, sinon `ch11aHTML(o.titre, cols, rows)` (tableau simple dans la visionneuse).

Champs communs `F` : `date` et `reportDate` `{t:'date', v:today()}`, `appUser` `{t:'staff', id:ME.staff.ID}` (s'il existe), `project` `{t:'project', p}` quand le document a une affaire.

Styles de ligne (clés de `svRowStyles`) : tableRow `tr`, tableTotal `tt`, tableLevel1 `l1`, tableLevel1Total `l1t`, tableLevel2 `l2` ; « vide » = `space` ou ligne sautée selon le document. Titre orphelin (`setMinimalGap`) : non reproduit exactement, `svDpDocHTML` évite déjà la coupure d'une ligne [C, écart mineur].

### 4.7 Visionneuse (`ch11aView(titre, src, o)`) et fausse fenêtre (`ch11aWin`)

- `src` = HTML complet ou résultat `R` de `svDpHTML` ; `o = {btns:[{t, fn(maj)}], pdf, joindre, concerne, contacts}`.
- Si `typeof ch03bView === 'function'` : `return ch03bView(titre, src, {boutons:o.btns, pdf:o.pdf, joindre:o.joindre, concerne:o.concerne, contacts:o.contacts})` (CH-03 lot 2 : zoom, PDF ▾, Partager ▾).
- Sinon : dialogue d'environ 920 px, corps = `iframe` (`srcdoc` = `src` ou `svDpDocHTML(src)`, hauteur 72vh) ; boutons dans l'ordre : `o.btns` (chacun garde la fenêtre ouverte), « Imprimer » (`contentWindow.focus(); contentWindow.print()`), « Fermer » (principal). Retour `{close, iframe, maj(src)}`.
- `ch11aWin(maj)` : `{document:{open(){b=''}, write(s){b+=s}, writeln(s){b+=s+'\n'}, close(){maj(b)}, body:{…}}, print(){}, focus(){}, close(){}, closed:false}`. `tplPrint(o)` l'utilise quand `o.win` est fourni (ancre T1) : aucune fenêtre, le `print()` automatique ne fait rien.

### 4.8 Anciens documents Management (`ch11aOld(type, o)`)

`await tplNeed()` (modèles chargés, sinon repli HTML) ; visionneuse ouverte avec un texte d'attente, puis `tplPrint({cat:'managementTemplates', type, title:o.title, ctx:{fields:{}, filtre:o.filtre||'', periode:o.periode||''}, cols:o.cols, rows:o.rows, win:ch11aWin(v.maj), fallback:()=>v.maj(ch11aHTML(o.title, o.cols, o.rows))})`. Modèle : `tplFind('managementTemplates', type, null)` = groupe par défaut de la catégorie (« Standard » au bureau : aucun groupe Substances), puis Standard, puis Default : la règle de l'original (premier modèle du type dans le groupe Standard) [P `mgl.ProjectContractAnalyze.getFormTemplate@1-106`].
- `cols` = colonnes **visibles à l'écran** (titre de l'écran, largeur relative, `r` pour les nombres) [C, E15] ; `rows` = lignes de l'écran en chaînes formatées (vides comprises), `_bold` sur les lignes grasses **et** surlignées [D `createBooklet` recopie les deux].

| Écran | Type DESIGN | Titre [P § 1 n° 33] | `periode` (`timespace`) | `filtre` (`reportFilter`) |
|---|---|---|---|---|
| Contrats, Contrats et sous-traitants | `managementProjectContractList` | « Liste des contrats » | libellé du filtre (`ch11aRFdesc`) | — |
| Echéancier | `managementProjectScheduledPaymentList` | « Echéancier d’encaissements » | libellé du filtre | — |
| Encaissements planifiés | `managementProjectContractScheduledPayments` | « Plan de paiements » | — | — |
| Encaissements reçus | `managementProjectContractPayments` | « Plan d’ordres de paiements » | — | — |
| Situation | `managementProjectContractPaymentsBalance` | « Contract - paiements » | — | — |
| Vue d'ensemble (lot 2) | `managementInvoiceAnalysis` | « Analyse de factures » | année (texte) | vide |
| Selon statut (lot 2) | `managementInvoiceAudit` | « Contrôle de factures » | libellé du statut | — |
| Par date (lot 2) | `managementInvoiceAudit` | « Contrôle de factures » | « Jour de référence: jj.mm.aaaa » si la case est cochée, sinon vide | — |
| Honoraires et frais, Avancement | — | — | pas d'ancien document | — |

Le Contrôle de factures ajoute sa ligne « Total » par le tableau de l'écran (déjà présente).

### 4.9 Diagramme (`ch11aChart(el, o)`)

SVG propre (`mgChart` remplace les valeurs vides par 0) : `o = {xs, series:[{name, vals, col}], y, title}` ; courbes avec **points ronds creux**, valeur `null` = point absent et courbe interrompue ; axe Y libellé `o.y` ; titre en `<text font-weight="700">` ; légende en **pastilles HTML** (`span` avec `background`) comme `mgChart` ; `el._svg` = le SVG, pour `mgSaveChart(el, nom)` (« Enregistrer le diagramme … »). Cette structure est celle qu'attend `ch10bSaveChart` de CH-10 lot 2 (PNG, légende redessinée, nom tiré du titre) [P spec_19 § 4.8]. Couleurs : `MG_COL` dans l'ordre, sauf « Avancement prévu » `IM_PREV` et « Avancement effectif » `IM_EFF`.

---

## 5. Management ▸ Contrats honoraires (lot 1)

### 5.1 Catégories (`CH11A_CATS`) [P `mg.ProjectContractMenuTableModel$MenuItem`] [S]

| Clé | Libellé | Fenêtre (état) | Document |
|---|---|---|---|
| `ct` | Contrats | Analyse, sous-traitants masqués (`CH11A.ct`) | `managementContracts` |
| `cs` | Contrats et sous-traitants | Analyse, sous-traitants visibles (**même état `CH11A.ct`**) | `managementContractsAndSubContracts` |
| `ech` | Echéancier d’encaissements | Echéancier (`CH11A.ech`) | `managementContractsScheduledPaymentsList` |
| `ep` | Encaissements planifiés | Encaissements (`CH11A.ep`) | `managementContractsScheduledPayments` |
| `er` | Encaissements reçus | Encaissements (`CH11A.er`) | `managementContractsPayments` |
| `si` | Situation des encaissements | Encaissements + diagramme (`CH11A.si`) | `managementContractsPaymentBalance` |
| `av` | Avancement des prestations | Avancement (`CH11A.av`) | — |

Apostrophes typographiques selon la convention d'affichage de DeltaSub.

### 5.2 Contrats / Contrats et sous-traitants (`ch11aContracts(o)`, pure)

**Barre** (`phead`, ordre de l'original [P `lay.py`]) : entonnoir « Filtre » ▾ + libellé `ch11aRFdesc` · Rapports ▾ · ⚙ · « Statut du contrat » · ☑ « En traitement » · ☑ « Validé » · ☐ « Refusé ». Chaque case recalcule. Filtre : `ch11aRF('Affaires en cours et terminées', 'Date de contrat')` [S `ProjectContractAnalyzeFrame|*`].

**Sélection** : contrats dont l'affaire passe `ch11aRFst` et dont `CONTRACTDATE` passe `ch11aRFin`, puis cases de statut ; tri : numéro d'affaire (`ch11aJs`), puis `SORTORDER`, puis `ID` (contrats sans affaire en tête) [P `ProjectContractComparator`].

**Lignes** [P `getReport(List,Z)@0-787`] :
```
pour chaque contrat c (dans l'ordre) :
  si sous-traitants masqués et c.ISSUBCONTRACT : ignorer
  nouvelle affaire : si ce n'est pas la première → clôture(affaire précédente) puis ligne vide ;
                     ligne titre en gras « ch11aAff(p) » ; ST_c = « Contrats », ST_s = « Contrats sous-traitants »
  ligne valeur c ; (ST_s si sous-traitant, sinon ST_c) += (CONTRACTAMOUNT, Σ encaissements de c)
  T_c[monnaie] ou T_s[monnaie] += idem (monnaie de l'affaire, hfCur)
clôture(affaire) : ST_c (surlignée) ; si sous-traitants visibles : ST_s (surlignée), « Contrats - sous-traitants » = ST_c − ST_s (surlignée)
fin : clôture(dernière affaire)
pour chaque monnaie de T_c (ch11aHm) : ligne vide (si sous-traitants visibles : avant chaque monnaie ; sinon avant la première seulement)
  « Total contrats » (surlignée + gras) ; si sous-traitants visibles et T_s[monnaie] : « Total sous-traitants », « Total contrats - sous-traitants » (surlignées + gras)
```
Libellés [S `ProjectContractListReportTableModel|*`] : « Contrats », « Contrats sous-traitants », « Contrats - sous-traitants », « Total contrats », « Total sous-traitants », « Total contrats - sous-traitants ». Une monnaie qui n'a que des sous-traitants n'a pas de total (reproduit).

**Colonnes** (12, toutes visibles) [S `…|col*`] :

| id | Colonne | Ligne valeur | Autres lignes |
|---|---|---|---|
| 0 | Affaire | **`NAME` du contrat** (E12) | libellé |
| 1 | Numéro | `NUMBER` | — |
| 2 | Date | `CONTRACTDATE` | — |
| 3 | Type de contrat | `CT_KIND` | — |
| 4 | Type de prestations | `SUPPLIERDESC` | — |
| 5 | Mandataire | `svContactDesc(SUPPLIERCONTACT)` | — |
| 6 | Utilisateur | `USERID` | — |
| 7 | Statut | `CT_STATE` | — |
| 8 | Monnaie | monnaie de l'affaire | monnaie (vide pour titre et vide) |
| 9 | Montant du contrat | `CONTRACTAMOUNT` | somme |
| 10 | Encaissé | Σ `projectpayment.AMOUNT` du contrat | somme |
| 11 | Solde à encaisser | 9 − 10 | 9 − 10 |

**Rapports ▾** (§ 1 n° 38) : « Afficher le rapport … » ; séparateur ; « Afficher le rapport … [Ancien document] » (si `ivFormVisible()`) ; les deux **grisées si le tableau est vide**.
- Document : `ch11aReport(ct ? 'managementContracts' : 'managementContractsAndSubContracts', {F:{…communs, filterDesc: ch11aRFdesc(F)}, tables:{table:{rows}}})` ; lignes : vides **sautées**, valeur → `tr`, titre → `l1`, sous-total → `l1t`, total → `tt` ; les 12 valeurs dans l'ordre des id (le modèle masque 3, 4, 6, 7).
- Ancien document : § 4.8. ⚙ : `mgGear(g, 'Contrats')` / `'Contrats_et_sous-traitants'`.

### 5.3 Echéancier d'encaissements (`ch11aSched(F)`, pure)

- **Barre** : entonnoir + libellé · Rapports ▾ · ⚙. Filtre : `ch11aRF('Affaires en cours et terminées', 'Dates d’échéance')`.
- **Sélection** : planifications dont l'affaire du contrat passe `ch11aRFst` et dont `DUEDATE` passe `ch11aRFin` ; tri par `DUEDATE`, dates vides **en dernier** [D Derby : `NULL` en dernier en ordre croissant], puis `ID` ; statut du contrat ignoré.
- **Lignes** : une par planification, puis une ligne vide **avant le premier total seulement**, puis un « Total » par monnaie (`ch11aHm`, surligné + gras) [S `ProjectScheduledPaymentListReportTableModel|totalDesc`].
- **Colonnes** : 0 Affaire (`ch11aAff`) · 1 Contrat (`NAME`) · 2 Type de contrat · 3 Mandataire · 4 Genre (`NAME` de la planification) · 5 Date de la facture · 6 Date d'échéance · 7 Monnaie · 8 Montant (maître d'ouvrage, **vide si 0** sur une ligne valeur) · 9 Sous-traitants (idem). Les totaux affichent toujours 8 et 9.
- **Document** `managementContractsScheduledPaymentsList` : `filterDesc` = `ch11aRFdesc(F)` (vide si le filtre est arrêté) ; valeur → `tr`, total → `tt`, vide sautée.

### 5.4 Encaissements planifiés et reçus (`ch11aPays(c, kind)`, pure)

**Disposition** : Affaires (entonnoir + `mgPFlabel`, `mgProjList`) | « Contrats » (une colonne « Contrats » = `NAME`, tous les contrats de l'affaire, **tous statuts**, maîtres d'ouvrage et sous-traitants, ordre `SORTORDER`) | tableau (Rapports ▾ · ⚙). Choisir une affaire recharge les contrats **sans sélection** (tableau vide, Rapports grisé) ; choisir un contrat remplit le tableau. Une instance par catégorie.

**Lignes** : titre en gras = `NAME` du contrat ; une ligne par planification (`ep`) ou encaissement (`er`), ordre `SORTORDER` puis `ID` ; « Total » (surligné + gras) = Σ `AMOUNT`.

| id | Colonne [S `…PaymentsReportTableModel|col*`] | Planifiés (`ep`) | Reçus (`er`) écran |
|---|---|---|---|
| 0 | Genre | `NAME` | `NAME` |
| 1 | Phase | `feNumName(phase)` | masquée |
| 2 | Phase partielle | `feNumName(sous-phase)` | masquée |
| 3 | Remarque | `REMARK` | `REMARK` |
| 4 | Date de la facture | `INVOICEDATE` | `INVOICEDATE` |
| 5 | Date d'échéance | `DUEDATE` | **masquée** [C, E2] |
| 6 | Date de paiement | `PAYMENTDATE` | **visible** [C, E2] |
| 7 | Montant | montant / total | montant / total |
| 8 | Monnaie | **monnaie de l'affaire** [C, E1] | idem |

**Documents** (`fillTable` de l'original, juste) : `managementContractsScheduledPayments` (9 colonnes, table `scheduledPaymentTable`) et `managementContractsPayments` (8 colonnes sans Date d'échéance, table `paymentTable` : ids 0-4 Genre…Date de la facture, 5 Date de paiement, 6 Montant, 7 Monnaie) ; ligne titre **non imprimée** ; Total → `tt` ; valeurs → `tr` ; monnaie remplie. Champs : `project` `{t:'project', p}`, `projectContract~projectContractNumber` = `NUMBER`, `projectContract~projectContractName` = `NAME`.

### 5.5 Situation des encaissements (`ch11aBal(c)`, pure)

Même disposition que § 5.4 (instance `si`), plus un **diagramme** sous le tableau (partage 55 / 45).

**Lignes** [P `getReport@0-472`] :
```
titre (gras) : « NAME », Solde = CONTRACTAMOUNT (colonne 7), monnaie (colonne 8)
événements triés par date (ISO), date vide EN PREMIER [C, E4] ; même date : planifications puis encaissements, chacun par SORTORDER puis ID
  planification → clé INVOICEDATE, colonnes 0 NAME, 1 INVOICEDATE, 2 AMOUNT, 3 monnaie
  encaissement  → clé PAYMENTDATE, colonnes 0 NAME, 4 PAYMENTDATE, 5 AMOUNT, 6 monnaie ; solde −= AMOUNT
  colonne 7 = solde courant, 8 = monnaie
Total (surligné + gras) : 2 Σ planifiés, 5 Σ encaissés, 7 solde final, monnaies 3, 6, 8
```
**Colonnes** [S `…BalanceReportTableModel|col*`] : 0 Encaissements planifiés / reçus · 1 Date fact. planifiées · 2 Encaiss. planifiés · 3 Monnaie · 4 Date encaissements · 5 Montants encaissés · 6 Monnaie · 7 Solde à encaisser · 8 Monnaie. Les monnaies 3 et 6 ne s'affichent que si le montant voisin a une valeur.

**Diagramme** « Situation » [S `…|chartTitle`] : un point par **mois** contenant un événement daté, ordre (année, mois), libellé « `<mois> <année>` » (« mars 2026 ») ; axe Y = monnaie ; 4 courbes : « Contrat » = **`CONTRACTAMOUNT` constant** [C, E3], « Encaissements planifiés » = cumul des planifiés, « Encaissements » = cumul des encaissés, « Solde à encaisser » = solde à la fin du mois.

**Rapports ▾** : « Afficher le rapport … », séparateur, « … [Ancien document] », séparateur, « Enregistrer le diagramme … » (`mgSaveChart(el, 'Situation_des_encaissements')`).

**Document** `managementContractsPaymentBalance` : champs comme § 5.4 ; ligne titre **imprimée** ; surlignée → `l1t`, gras → `l1`, sinon `tr` ; pas de diagramme ; textes de page traduits (E13).

### 5.6 Avancement des prestations (`ch11aPerf(p)`, pure)

- **Disposition** : Affaires (entonnoir + liste) | Rapports ▾ (**seulement** « Enregistrer le diagramme … ») · ⚙ + tableau + diagramme.
- **Données** [P `ProjectPerformanceTableModel.getReport(Project)@0-245`] :
```
aucune ligne si l'affaire n'a pas d'avancement (projectimplementation)
M = Σ ±CONTRACTAMOUNT (sous-traitant −), TOUS statuts (E7) ; H = Σ ±TIMEHOUR (idem)
pour chaque avancement (IMPLEMENTATIONDATE croissante, puis ID) :
  prévu = SCHEDULEDVALUE, effectif = CURRENTVALUE (−1 ou vide = vide)
  enc%  = 100 × Σ ±AMOUNT des encaissements des contrats de l'affaire dont PAYMENTDATE ≤ date / M
  heu%  = 100 × Σ TIMEPERIOD des heures de l'affaire (toutes) dont tlIso ≤ date / H
```
- **Colonnes** (11) [S `ProjectPerformanceTableModel|*Col`] : 0 Date · 1 Avancement prévu · 2 « % » · 3 Avancement effectif · 4 « % » · 5 Encaissements [%] · 6 « % » · 7 Encaissements planifiés [%] (= 100 − enc%) · 8 « % » · 9 Heures effectuées · 10 « % ». Les colonnes paires sans en-tête affichent « % » ; valeur négative ou non finie → vide.
- **Diagramme** « Situation » : axe X = dates `dd.MM.yyyy` sans doublon ; axe Y « % » ; 5 courbes : « Avancement prévu » et « Avancement effectif » (points ≥ 0 seulement), « Encaissements », « Encaissements planifiés », « Heures effectuées ».
- **Document** : aucun [P].

---

## 6. Management ▸ Factures (lot 2)

### 6.1 Catégories (`CH11B_CATS`) [S `ProjectInvoiceMenuTableModel|*`]

| Clé | Libellé | Fenêtre (état) | Document | Ancien document |
|---|---|---|---|---|
| `an` | Vue d’ensemble de l’année | `CH11B.an` | `managementInvoiceReport` | `managementInvoiceAnalysis` |
| `st` | Selon statut | `CH11B.st` | `managementInvoiceListReport` | `managementInvoiceAudit` |
| `fd` | Date de la facture | `CH11B.dt` (**commun**) | idem | idem |
| `ed` | Date d’échéance | `CH11B.dt` | idem | idem |
| `pd` | Date d’encaissement | `CH11B.dt` | idem | idem |
| `hf` | Honoraires et frais | `CH11B.hf` | `managementInvoicePendingReport` | — |

### 6.2 Vue d'ensemble de l'année (`ch11bYear(y)`, pure)

- **Barre** : `mgYearBar(CH11B.an, redraw)` (année courante à l'ouverture, non mémorisée) · Rapports ▾ · ⚙.
- **Factures** : `INVOICEDATE` dans l'année, **tous statuts et toutes affaires**, archivées comprises [P `db.ProjectInvoice.getProjectInvoices(I)@0-67`].
- **Lignes**, par monnaie (`ch11aHm`) : 12 mois « janvier » … « décembre » (`MOIS_L`, 0.00 si aucune facture), après chaque groupe de trois mois une ligne **surlignée** « 1er trimestre » … « 4ème trimestre », puis « `<année>` Total » en **gras** ; une ligne vide entre deux monnaies. Sans aucune facture : aucune ligne (Rapports grisé) [D].
- **Colonnes** [S] : Période · Monnaie · Montant (Σ `AMOUNT`) · Encaissé (Σ `AMOUNTPAID`) · Solde à encaisser.
- **Document** `managementInvoiceReport` : `year` = année (texte) ; surligné → `l1t`, gras → `tt`, sinon `tr`, vide sautée.

### 6.3 Selon statut (`ch11bByState(k)`, pure)

- **Barre** : entonnoir « Filtre » ▾ [libellé = statut choisi] · « Tri » ▾ · Rapports ▾ · ⚙.
- **Filtre** : cases exclusives, dans l'ordre : « Planifiée » (**défaut**) · « Envoyée » · « Rappel envoyé » · « Ouverte » · « Payée » ; non mémorisé.
- **Sélection** : statut donné, ou « Ouverte » = statut ≠ 3 ; toujours affaire d'état 2 à 4 ; ordre `INVOICEDATE`, puis `ID`.
- **Tableau** : liste du § 6.5, type `all`. Tri mémorisé `ds_mg_inv_tri_statut`.
- **Document** : `managementInvoiceListReport`, `filterDesc` = libellé du statut, `reportingDate` vide.

### 6.4 Date de la facture / d'échéance / d'encaissement (`ch11bByDate(kind, F, ref)`, pure)

- **Barre** : entonnoir + libellé · ☐ « Jour de référence » + champ date (`input type=date`, **grisé tant que la case est décochée**) · « Tri » ▾ · Rapports ▾ · ⚙.
- **Jour de référence** : défaut = dernier jour du mois courant ; case décochée à l'ouverture ; changer la case ou la date recalcule ; commun aux trois catégories.
- **Filtre** : `ch11aRF('Affaires en cours et terminées', libellé)`, le libellé de période suivant la catégorie : « Date de facture » / « Date d’échéance » / « Date d’encaissement » (`F.perName` mis à jour à chaque changement de catégorie).
- **Sélection** : filtre arrêté → **toutes les factures**, archivées comprises ; en marche → date de la catégorie dans la période et `ch11aRFst` ; ordre `INVOICEDATE`, puis `ID`.
- **Tableau** : § 6.5 avec le jour de référence si la case est cochée (type `reportingDate`), sinon type `all`. Tri mémorisé `ds_mg_inv_tri_dates`.
- **Document** : `filterDesc` = `ch11aRFdesc(F)` ; `reportingDate` = `{t:'date', v:jour}` si la case est cochée, sinon vide.

### 6.5 Liste des factures (`ch11bList(list, tri, ref)`, pure), commune aux § 6.3 et § 6.4

**Colonnes** (16) [S `ProjectInvoiceListReportTableModel|col*`] ; masques [P `$TableType`] : `all` masque 11 et 12 ; `reportingDate` masque 10, 13 et 15.

| id | Colonne | Ligne valeur | Lignes de total |
|---|---|---|---|
| 0 | Affaire | `ch11aAff(p)` | libellé |
| 1 | Désignation | `NAME` | — |
| 2 | Numéro | `NUMBER` | — |
| 3 | Date | `INVOICEDATE` | — |
| 4 | Date d'échéance | `DUEDATE` | — |
| 5 | Statut | `PI_STATE` | — |
| 6 | Contrat | `ctrLbl(contrat)` (« NUMBER NAME ») | — |
| 7 | Débiteur | `svContactDesc(débiteur)` | — |
| 8 | Monnaie | monnaie de l'affaire | monnaie |
| 9 | Montant | `AMOUNT` | Σ |
| 10 | Encaissé | `AMOUNTPAID` | Σ |
| 11 | Encaissée avant jour de référence | `AMOUNTPAID` si `PAYMENTDATE` < jour, sinon 0.00 ; **vide** sans jour de référence [C, E14] | Σ |
| 12 | Encaissée après jour de référence | `AMOUNTPAID` si `PAYMENTDATE` ≥ jour, sinon 0.00 ; idem | Σ |
| 13 | Solde à encaisser | `AMOUNT − AMOUNTPAID` | Σ |
| 14 | Dernier encaissement | `PAYMENTDATE` | — |
| 15 | Nb rappels | `DUNNINGLEVEL` (entier, vide si nul) | — |

Encaissée le jour même → « après » ; sans `PAYMENTDATE`, ni avant ni après [P `Date.before` strict].

**Tris** (« Tri » ▾, cases exclusives, séparateur avant le 8ᵉ) [S `…|none`, `sortBy*`, textes **tels quels**, E5] [P `$SortType`, `$ProjectInvoiceComparator`] :

| # | Clé | Libellé | Règle |
|---|---|---|---|
| 1 | none | Tri selon affichage | ordre de la sélection (**défaut**) |
| 2 | sortByDate | Tri par date facture (ordre croissant) | `INVOICEDATE` ↑ |
| 3 | sortByDateReverse | Tri par date facture (ordre décroissant) | `INVOICEDATE` ↓ |
| 4 | sortByDueDate | Tri par date d'échéance | `DUEDATE` ↑ |
| 5 | sortByDueDateReverse | Tri par date d'échéance (ordre croissant) | `DUEDATE` ↓ |
| 6 | sortByPaymentDate | Tri par date de facturation | `PAYMENTDATE` ↑ |
| 7 | sortByPaymentDateReverse | Tri par date facture (ordre croissant) | `PAYMENTDATE` ↓ |
| — | *(séparateur)* | | |
| 8 | sortByProjectAndInvoiceNumber | Tri par Nº de facture (ordre croissant) | numéro d'affaire (`ch11aJs`) puis `NUMBER` (`ch11aJs`, vide = `''` [C, E6]) |
| 9 | sortByProjectAndDate | Tri par affaire et date (ordre croissant) | affaire puis `INVOICEDATE` |
| 10 | sortByProjectAndDueDate | Tri par affaire et date d'échéance | affaire puis `DUEDATE` |
| 11 | sortByProjectAndPaymentDate | Tri par affaire et date de paiement | affaire puis `PAYMENTDATE` |

Dates vides **en premier** ; tri **stable** ; un tri « inverse » est la négation du comparateur entier.

**Lignes** [P `getReport(List,Z)@0-549`] :
```
groupé = tri 8 à 11
pour chaque facture (ordre du tri) :
  si groupé et nouvelle affaire : clôture du sous-total précédent (surligné + gras) puis ligne vide ;
     titre en gras « ch11aAff(p) » ; nouveau sous-total « Total » (monnaie de l'affaire)
  ligne valeur ; sous-total et total[monnaie] += AMOUNT, AMOUNTPAID, avant, après
fin : si groupé : dernier sous-total (surligné + gras) puis ligne vide
      un « Total » par monnaie (ch11aHm), surligné + gras, sans ligne vide entre deux monnaies
```
**Document** `managementInvoiceListReport` : 16 valeurs dans l'ordre des id ; titre → `l1` ; surlignée → `l1t` ; gras → `tt` ; sinon `tr` ; vide sautée [P `fillTable@1-53`, `@778-848`]. Le modèle du bureau n'imprime pas `filterDesc` (bande Titre = `reportTitle` ‖ `date`) : le champ est rempli quand même.

### 6.6 Honoraires et frais (`ch11bPending(det)`, pure)

- **Barre** : Rapports ▾ · ⚙ (**ni filtre ni jour de référence**).
- **⚙**, dans l'ordre [P `addPreferencesPopupMenuItems@0-359`] : sous-menu « Mettre les montans en evidence de : `<seuil>` » [S, faute d'origine gardée, E5] avec cases exclusives « Tous » (0), « 1'000 », « 2'000 », « 5'000 », « 10'000 » (**défaut**), « 20'000 », « 50'000 », « 100'000 » ; ☑ « Afficher les détails » (défaut coché) ; séparateur ; copier ; exporter CSV. Mémorisé `ds_mg_inv_pending`.
- **Mise en évidence** : seuil > 0 seulement, dernière colonne, valeur > seuil en vert `#008F00` (`r.cc` de `mgRender`) ; « Tous » = aucune couleur.
- **Affaires** : état ≠ 5 (Archivée) et ≠ 1 (Configuration), triées `SORTLABEL` puis `NUMBER` = `mgPFlist({on:false})` [P `Project.findByNotProjectStateCode`, `isInitializing`] ; tri par `cmp` (écart mineur avec le tri Derby, [C]).
- **Lignes par affaire** [P `<init>(Z)@36-747`] : avec détails, **ligne vide** avant chaque affaire sauf la première, ligne d'affaire « `ch11aAff(p)` » en gras, puis « Honoraires » et « Frais » [S `ProjectInvoicePendingTableModel|time/cost`] ; sans détails, les lignes d'affaire seules, sans gras ni ligne vide.

| Colonne [S `…|*Col`] | Affaire | Honoraires | Frais |
|---|---|---|---|
| 0 Dépense | `ch11aAff(p)` | Honoraires | Frais |
| 1 Monnaie | — | monnaie | monnaie |
| 2 Contrats | H + F | H | F |
| 3 Factures sans contrat | Σ `invHT` des factures sans contrat (0.00 possible) | — | — |
| 4 Factures sur contrat | Σ `invHT` des factures avec contrat | — | — |
| 5 Solde à encaisser | Contrats − Factures sur contrat, **vide si Contrats est vide** (§ 1 n° 12) | — (vide) | — (vide) |
| 6 Heures facturables [h] | — | Σ `TIMEPERIOD` des heures facturables non facturées | — |
| 7 Montant facturable | Honoraires + Frais | Σ `mgRates().fee(t)` des mêmes heures | Σ `EXTERNALRATE × pcAmount(r)` des frais facturables non facturés |

  - **H et F** : pour chaque contrat de l'affaire (**tous statuts**, tous types) ; contrat sans calcul (`ctrCalc(c)` nul) **ignoré** ; signe −1 pour un sous-traitant ; H += signe × `feeCond(ctrAmt(c,'time')).st3` si la condition existe ; F idem avec `'cost'`.
  - **Colonne 2 des trois lignes** remplie seulement si H + F ≠ 0 (sinon vide, `null`) (§ 1 n° 11).
  - **Factures** : tous statuts ; ligne d'affaire seulement.
  - [C] Sous le tableau, l'avertissement de `mgtPane` si des heures facturables existent mais qu'aucune activité n'a de tarif (« ⚠ aucune activité n’a de tarif : montants « Facturable » à 0 »).
  - Performance : `mgRates()` une fois par calcul, `DS.by('timelog','PROJECT_ID',id)` par affaire (37 622 saisies au bureau).
- **Document** `managementInvoicePendingReport` (corrections E9 et E13) : avec détails, ligne d'affaire → `tt` précédée d'une ligne `space` (sauf la première), Honoraires et Frais → `tr` ; sans détails, lignes d'affaire → `tr` ; aucun champ propre ; les 8 valeurs par id (le remplissage par id sert aussi l'original 16.05, dont l'ordre des colonnes diffère, E14 de rech_orig).

---

## 7. Documents imprimés : structure et remplissage

### 7.1 Les 9 documents Management (jeu 0, rapports temporaires)

| Type | Titre du modèle bureau | Page | Champs propres | Table(s) | Lignes |
|---|---|---|---|---|---|
| managementContracts | Contrats d'honoraires | A4 paysage 15/15/25/20 | `filterDesc` | `table` (12, masquées 3 4 6 7) | § 5.2 |
| managementContractsAndSubContracts | Contrats d'honoraires et contrats sous-traitants | idem | idem | idem | § 5.2 |
| managementContractsScheduledPaymentsList | Echéancier des encaissements | idem | `filterDesc` | `table` (10) | § 5.3 |
| managementContractsScheduledPayments | Encaissements planifiés | idem | `project`, `projectContract~Number`, `~Name` | `scheduledPaymentTable` (9) | § 5.4 |
| managementContractsPayments | Encaissements | idem | idem | `paymentTable` (8) | § 5.4 |
| managementContractsPaymentBalance | Situation des encaissements | idem | idem | `table` (9) | § 5.5 |
| managementInvoiceReport | Sommaire | A4 portrait 25/15/25/20 | `year` | `table` (5, Monnaie masquée) | § 6.2 |
| managementInvoiceListReport | Listes des factures | A4 paysage étroit 10/10/20/15 | `filterDesc`, `reportingDate` | `table` (16) | § 6.5 |
| managementInvoicePendingReport | Honoraires et frais facturables | A4 paysage | — (date corrigée E9) | `table` (8) | § 6.6 |

Champs communs : `reportTitle` (texte du modèle), `date` (dateLong), `appUser` (userName), `reportDate` (dateMedium, en-têtes de section des 3 modèles « factures »), `pageNumber` / `nofPages` (compteurs CSS). Logos des modèles (« A0 architekten Logo.png », « companyLogo@2x.png ») absents de `image` : aucune image, comme aujourd'hui.

### 7.2 Offre d'honoraires (`projectFeeCalculation`, lot 3)

Objet : la **variante** sélectionnée dans le domaine (calcul avec en-tête `PROJECTFEE_ID`). Modèle : jeu de l'affaire (`ch01aTplPick(type, p)`), 8 sections, 5 visibles (Courrier d'accompagnement, Récapitulatifs, Honoraires selon le coût de l'ouvrage, Récap. selon coût de l'ouvrage, Récap. selon phases).

**Champs** (`rep.ProjectFeeCalculation$StringField`, 27) [P `getString@13-506`] :

| Champ | Valeur |
|---|---|
| `projectFee` | en-tête (`projectfee`), formats `projectFee*` (§ 4.5), défaut `NAME` |
| `contact` / `supplierContact` | `svC(CONTACT_ID)` / `svC(SUPPLIERCONTACT_ID)` de l'en-tête |
| `number`, `title`, `name`, `changedDate` (date), `version`, `remark` | de la variante |
| `projectFeeCalculationTimeAmount` / `…CostAmount` | conditions (`feeCond`) : Amount1 `A1`, SalesDiscountRate `SALESDISCOUNT`, SalesDiscountAmount `rab`, SubTotal1 `st1`, CashDiscountRate `CASHDISCOUNT`, CashDiscountAmount `esc`, SubTotal2 `st2`, Rounding `rounding`, SubTotal3 `st3`, VatRate `t`, VatAmount `tva`, Amount2 `ttc` ; tous `num(rJ(v))` |
| `timeHour` | `TIMEHOUR` |
| `contractAmount` / `contractAmountExcludedVat` / `contractAmountVat` | Σ `ttc` des deux conditions ; Σ `ttc` − Σ `tva` ; Σ `tva` |
| `calculationFactorsAmountB`, `ValueZ1`, `ValueZ2`, `FactorP`, `FactorQ`, `FactorR`, `FactorN`, `FactorU`, `AmountTm`, `AverageTimeRate` | `feFactorsRead(CALCULATIONDETAILS)` ; p = `feP`, Tm = `feTm` ; **tous à 2 décimales** (`num(rJ(v))`) : Z1 0.062 → « 0.06 », p 0.1678 → « 0.17 » (E10) |
| `project`, `subProject` | de l'en-tête |
| `userSignature` (image) | vide (CH-08) |

**Tableaux** :

| Table | Contenu | Construction |
|---|---|---|
| `timeCalculationTable` / `costCalculationTable` | conditions honoraires / frais | § 7.5 |
| `timeCalculationItemTable` | temps employé : groupe d'activités → activité → lignes | colonnes 0 Activité, 1 Phase, 2 Phase partielle, 3 Durée, 4 Tarif, 5 Facteur, 6 Montant, 7 Option ; § 7.6 |
| `additionalCalculationItemTable` | prestations supplémentaires : phase → phase partielle → lignes | 0 Numéro, 1 Phase partielle, 2 Heure, 3 Tarif horaire, 4 Facteur, 5 Montant, 6 Option ; § 7.6 |
| `costCalculationItemTable` | frais : groupe de genres → genre → lignes | 0 Genre de frais, 1 Phase, 2 Phase partielle, 3 Quantité, 4 Monnaie, 5 Prix, 6 Facteur, 7 Montant, 8 Option ; § 7.6 |
| `timeCalculationByConstructionTable` | phases SIA : N°, Phases, Part, %, Tm, Facteur de groupe, Tp, Tarif, Prestations spéciales, Honoraires | `fePhaseRows(F, Tm, q)` (spec_9 § 4.6.2) |
| `projectFeeBkpCalculation` | coût déterminant par CFC : N°, Désignation, Monnaie, Montant | `F.bkp` (spec_9 § 4.6.3) |

Chaque constructeur remplit **tous** les identifiants de colonne (le modèle choisit ceux qu'il affiche).

### 7.3 Contrat d'honoraires (`projectContract`, lot 3)

Modèle du bureau (jeux 1 = 2 = original 16.05) : 7 sections visibles (Page de garde contrat, Objet du contrat, Eléments du contrat, Conditions de paiement échéances et délais, Intervenants et leurs relations contractuelles, Organisation du projet, Contrat court).

**Champs** (`rep.ProjectContract$StringField`, 20) [P `getString@8-386`] :

| Champ | Valeur |
|---|---|
| `number`, `name`, `contractDate` (date), `supplierDesc`, `userId`, `remark` | du contrat |
| `contractType` | `CT_KIND` |
| `contractState` | `CT_STATE` |
| `project` | `{t:'project', p}` (+ formats d'affaire du § 4.5) |
| `contact` / `supplierContact` | `svC` mandant / mandataire |
| `subProject` | ouvrage (`CODE`) |
| `projectFee` / `projectFeeCalculation` | en-tête et variante du calcul lié, **vides pour un calcul de base** (`isBasicCalc`) |
| `projectFeeCalculationTimeAmount` / `…CostAmount` | conditions (formats du § 7.2) |
| `timeHour` | `TIMEHOUR` du contrat |
| `contractAmount` | `CONTRACTAMOUNT` stocké |
| `contractAmountExcludedVat` | `ctrHT(c)` |
| `contractAmountVat` | `ctrVat(c)` |

Intervenants (`doc.data.Project$StringField`), servis par `ch11cMembers(p)` (pure) : rôles **8** `projectMemberBuilder`, **1** `projectMemberArchitect`, **2** `projectMemberConstructionManager`, **4** `projectMemberProjectManager`, **51** `projectMemberBuilderConsultantStandby` (§ 1 n° 37), chacun `…Contact` (`svC(m.CONTACT_ID)`) et `…Responsible` (`svC(m.RESPCONTACT_ID)`) par `svMember(p, rôle)`. Les formats `contactFirstname`, `contactFirstnameAndName`, `contactOwnerAndAddress`, `contactShortForm`, `contactEmail`, `contactPhone` sont servis par `svFmtVal`.

**Tableaux** : `timeCalculationTable`, `costCalculationTable` (§ 7.5), `scheduledPaymentTable` (§ 5.4, lignes planifiées **sans** la ligne titre, avec le Total) ; `paymentTable` rempli aussi (absent du modèle).

### 7.4 Facture (`projectInvoice`, lot 3)

Modèle du bureau (jeux 1 = 2, ancienne copie aux champs de l'original), 1 section : adresse (`contact:contactAddress`), titre (`name`), Informations (Affaire ; Contrat = monnaie + `projectContract:projectContractName` + « (TTC) », le **nom** du contrat, comme l'original ; N° de facture ; Date de facture ; Date d'échéance ; Période facturée ; Montant ; Remarque), tableau « Facture » (Position 50, Quantité 20, Unité 20, Prix 20, « % » 10, Montant 30), « Conditions de paiement : » + `termsOfPayment`, « Avec nos remerciements. ».

**Champs** (`doc.data.ProjectInvoice$StringField`, 20) [P `getString@8-347`] : `name`, `number`, `accountingPeriod` ; `contact` (débiteur, `svC`) ; `invoiceDate`, `dueDate`, `paymentDate` (dates) ; `projectInvoiceState` (`PI_STATE`) ; `termsOfPayment`, `note` ; `amount`, `amountExcludedVat` (`invHT`), `amountVat` (`invVat`), `amountPaid` (`num(rJ)`) ; `dunningLevel` (entier) ; `projectContract` (formats `projectContract*`) ; `projectContractSubProject` (ouvrage du contrat, sinon vide) ; `previousInvoicesAmount` / `previousInvoicesAmountPaid` (`prevInvoices`, spec_9 § 6.7) ; `contractAmountNotInvoiced` (`openContract`, vide sans contrat).

**Tableaux** :
- `projectInvoicePosTable` [P `doc.data.ProjectInvoicePosTableContent.fillTable@0-464`] : positions **visibles** ; 0 Position = `NAME` ; 1 Quantité et 2 Unité si `ivHasQ` ; 3 Prix si `ivHasP` ; 4 « % » si le prix est un pourcentage (genres 3, 4, 5) ; 5 Montant si visible (`ivHasA`, vide pour Groupe et Commentaire) ; 6 Monnaie si le montant est visible. Styles : Groupe `l1`, Position `tr`, Sous-total `l1t`, % / % TVA / % TVA incl. `tr`, Total `tt`, Commentaire `tr`.
- `projectInvoicesTable` (« factures à ce jour » du même contrat) : 0 Désignation, 1 Numéro, 2 Date de facture, 3 Montant TTC, 4 Encaissé, 5 Encaissement, 6 Monnaie, 7 Montant HT, 8 Montant TVA ; lignes `tr`, total `tt`. Absent du modèle (rempli quand même).

### 7.5 Tableau des conditions (`ch11cCondRows(a, ignorer, cur)`, pure) [P `rep.ProjectFeeCalculationAmountTableContent.fillTable@0-442`]

Colonnes : 0 Désignation · 1 Condition · 2 Monnaie · 3 Montant. Propriété k0 « Ignorer les positions sans montant » (`ch01aProp(band, 0, true)` ; vraie dans les modèles du bureau). Avec `x = feeCond(a)` :
```
« Brut »         A1                                    l1t
si ¬ignorer ou rab ≠ 0 :     « Rabais » « <SALESDISCOUNT> % » rab (tr) ; « Sous-total » st1 (l1t)
si ¬ignorer ou CASHDISCOUNT ≠ 0 ou esc ≠ 0 : « Escompte » « <CASHDISCOUNT> % » esc (tr) ; « Sous-total » st2 (l1t)
si ¬ignorer ou rounding ≠ 0 : « Arrondi » rounding (tr) ; « Sous-total HT » st3 (l1t)
si ¬ignorer ou t ≠ 0 ou tva ≠ 0 : « TVA » « <t> % » tva (tr)
« Total TTC »    ttc                                   tt
```
Libellés [S `ProjectFeeCalculationAmountDialog|*`]. Condition : `ch01aJd(v) + ' %'` (« -2.0 % », « 7.7 % ») ; taux −1 résolu en `vatDefault()` (E11). `ch01aCondRows` de CH-01 (contrôle des coûts) ne convient pas : autres libellés et arrondis.

### 7.6 Tableaux de lignes du calcul (`ch11cItemRows(W, kind, props)`, pure) [S `rep|ProjectFeeCalculationItemTableContent|*`] [P `fillTable`]

Propriétés : k0 « Ignorer les positions sans montant » ; k1 « Afficher les positions » : `level0` « Groupe », `itemsLevel0And1` « Groupe et position », `levelAll` « Groupe, position et calcul » ; k2 « Masquer les options ». Structure = celle de `feReportRows(W, kind)` (groupes et positions de l'affaire, lignes non optionnelles additionnées, total) complétée des **lignes de calcul** (éléments `projectfee*item`) au niveau `levelAll`. Styles : groupe `l1` ; position `l1` si le niveau maximal visible est 1, sinon `l2` ; lignes de calcul `tr` ; total `tt`. Options : colonne Option cochée (`tText`) ; k2 vrai → lignes optionnelles sautées. [D] Le détail par niveau est à vérifier au moment d'écrire le lot contre `ch/CH-11/dis/ProjectFeeCalculationItemTableContent.txt` et `db_ProjectFeeItemReportRow*.txt`.

### 7.7 Anciens documents

Management : § 4.8. Facture : `ivPrint` (lot 4 de spec_9) avec les Paramètres du § 9, dans la visionneuse (lot 2). Contrat et calcul : inchangés (`ctPrintOverview`, `fePrint`).

---

## 8. Documents d'objet : panneau, cycle de vie, refus (lot 3)

### 8.1 Écrans et libellés

| Écran | Objet | Libellé de création [S] | Type | Nom par défaut [P `getDefaultFilename`] | Place du panneau (ancre) |
|---|---|---|---|---|---|
| Domaine « Calcul des honoraires » (« Offres d'honoraires » après CH-10) | variante sélectionnée | « Nouveau document de calcul » | `projectFeeCalculation` | `NUMBER` puis espace puis `TITLE`, chacun s'il est rempli | sous les deux listes (P7) |
| Domaine « Contrats honoraires » | contrat sélectionné | « Nouveau document contrat » | `projectContract` | `NAME` | entre le tableau et la synthèse (P1) |
| Domaine « Factures » | facture sélectionnée | « Nouveau document de facturation » | `projectInvoice` | `NAME` | sous le tableau, au-dessus de la synthèse du contrat (P3) |
| FACTURES ▸ Contrôle de factures | facture sélectionnée | « Nouveau document » | `projectInvoice` | `NAME` | sous le tableau (P5) |

### 8.2 Panneau (`ch11cPanel(o)`)

`o = {dossier, get() → objet | null, p (ou fonction), type, nomDefaut(objet), libelle (création), extra(objet, rec) → entrées de menu}` ; renvoie un élément avec `.redraw()`, appelé par la fonction `upd` de l'écran (ancres P2, P4, P6, P8).

Disposition (celle de `ch01aPanel`, pour l'unité visuelle) : libellé « Document » ; « Nom du document » + **bouton principal** + bouton ▾ ; « Fichiers PDF » + zone : au lot 3, tableau vide « Nom du fichier | Date de dernière modification » grisé (infobulle « Fichiers PDF : prévu avec CH-03 ») ; au lot 4, `ch11dZone(o, rec)` s'il existe (§ 10.2).

- **Bouton principal** : nom du document s'il existe ; sinon **« «<libellé>» »** (guillemets français sans espace, § 1 n° 25). Clic : ouvre le document s'il existe, sinon le crée.
- **Menu ▾ du document**, dans l'ordre [P `DocumentReportPanel.getDocumentPopupMenu@0-414`] :

| Entrée | Active si |
|---|---|
| Nouveau document | objet sélectionné et aucun document |
| Renommer le document … | un document |
| Supprimer le document | un document |
| — | |
| Ouvrir le document | un document |
| — | |
| Enregistrer sous forme de fichier PDF … | un document **et** `typeof ch11dSavePdf === 'function'` (lot 4) ; sinon grisée, infobulle « Fichiers PDF : prévu avec CH-03 » |
| *entrées propres* (`o.extra`) | § 8.4 (sans séparateur pour la facture, séparateur en tête pour le contrat) |

- Aucun objet sélectionné : bouton principal et menus grisés [P `checkGuards@0-37`].

### 8.3 Cycle de vie

| Action | Déroulement |
|---|---|
| **Nouveau** | `bseq = ctBseq('hfdoc', id)` ; nom (`ch01aNameDlg(nomDefaut, libellé)`) → modèle (`ch01aTplPick(type, p)`) → `null` : rien ; `'aucun'` : ancien document (Facture : `ivPrint` ; Contrat : `ctPrintOverview` ; Offre : `fePrint(c, p, 'overview')`), rien d'enregistré → sinon un commit `hfdoc` : `doc = {nom, type, templateDesc, jeu, fichier, report: copie, creeLe: today(), creePar: ME.id}` → ouverture |
| **Ouvrir** | job calculé maintenant (§ 7.2 à 7.4) → `R = svDpHTML(ch11aFlat(ch01aPrep(doc.report), F), [job], {jeu, type})` → `ch11aView(doc.nom, R, {btns:[« Modifier les textes… »], …(typeof ch11dViewOpts==='function' ? ch11dViewOpts(dossier, p, objet, doc) : {})})` |
| **Modifier les textes…** | `ch01aTexts({ID, doc}, apres, save)` avec `save(report)` = commit `hfdoc` (`doc.report`, `modifieLe`, `modifiePar`, `bseq` lu à l'ouverture de la visionneuse) ; `apres` redessine la visionneuse (`maj`) |
| **Renommer le document …** | `ch01aNameDlg(doc.nom, 'Renommer le document')` → commit si le nom change |
| **Supprimer le document** | `ivAsk('Avertissement', 'Voulez-vous supprimer ce fichier définitivement ?')` [S `Strings|msgDeleteFileDefinitely`] → Oui : `doc = null` (les PDF restent, comme l'original) |

Sans CH-01 lot 1 (`typeof ch01aTplPick !== 'function'`) : le panneau n'est pas monté ; le lot 3 ne doit pas être intégré avant CH-01 lot 1 (§ 16).

### 8.4 Entrées propres

- **Facture** (domaine et Contrôle), **sans séparateur** : « QR-facture … » [S `ProjectInvoiceDocumentReport|qrBillPdf` + « ␣… »], active si un document existe [P `addDocumentPopupMenuItems@0-70`]. Action `ch11cQr(f)` (§ 1 n° 28) : `q = qrbill` de la facture ; si `!q`, ou `rJ(+q.AMOUNT) !== rJ(+f.AMOUNT)`, ou `q.CURRENCY !== hfCur(p)` → `qrEdit(f, redraw)` (sans message) ; sinon `qrGenerate(qrBillFromRec(q), f)` ; puis redessin du panneau.
- **Contrat** : séparateur, « Afficher le calcul des honoraires » (toujours ajoutée) et « Importer des fichiers PDF du calcul » (ajoutée seulement si le contrat a un calcul), actives si un document du contrat existe ; la seconde est grisée jusqu'au lot 4 (`typeof ch11dImportCalc`) [P `ProjectContractFrame$ProjectContractDocumentReport.addDocumentPopupMenuItems@0-165`] [S `ProjectContractFrame|showFeeCalculationReport/importPdfFromCalculation`].
  - `ch11cShowCalc(c)` : calcul du contrat (y compris un calcul de base) → `ch01aTplPick('projectFeeCalculation', p)` → rapport temporaire (§ 7.2, jamais enregistré) dans `ch11aView(R.title, R, typeof ch11dViewOpts==='function' ? ch11dViewOpts('Contracts', p, c, null, {joindre:true}) : {})` : au lot 4, « Enregistrer le PDF en pièce jointe … » dépose dans `Contracts/<ID>`.
- **Offre** : aucune.

### 8.5 Refus de suppression

« Supprimer » d'un contrat, d'une variante de calcul ou d'une facture : `ch11cBlockDel(dossier, id)` → si `hfdoc['<dossier>/<id>'].doc` existe, ou si `typeof ch11dHasPdf === 'function' && ch11dHasPdf(dossier, p, id)` (lot 4), `ctMsg('Information', 'Cette inscription ne peut pas être effacée, car il existe encore des documents ou des fichiers PDF.')` [S `Strings|msgFileGroupNotEmpty`] et renvoie vrai (rien d'autre). Ordre : contrat, après le refus existant `ctBlocked` (D1) ; variante, après le refus « utilisée dans un contrat » (D3) ; facture, **avant** la question de confirmation (D2) [P `pr.ProjectInvoiceFrame.jDeleteButtonActionPerformed@4-28`, `pr.ProjectContractFrame.jDelete…@4-14`, `pr.ProjectFeeFrame.jDeleteProjectFeeCalculation…@42-54`].

---

## 9. Paramètres de l'ancien document de facture (lot 2)

### 9.1 Format `TEMPLATEPROPERTIES` : 35 valeurs, chacune suivie de « ; » [P `InvoiceDialog.codePreferences@0-586`, `decodePreferences@0-892`]

| Indice | Réglage | Type | Défaut |
|---|---|---|---|
| 0 | `templateId` (`FORMTEMPLATE.ID`, 0 = premier du groupe de l'affaire) | entier | 0 |
| 1 | taille des positions standards | entier | 9 |
| 2 | page de garde | 1/0 | 1 |
| 3 | interligne (points) | entier | 14 |
| 4 | afficher les titres des colonnes | 1/0 | 1 |
| 5 | **toujours « 0 »** (« Titres des colonnes en gras », jamais enregistré) | — | 0 |
| 6 / 7 / 8 | trait sous les titres / au-dessus de la TVA / après le total | 1/0 | 0 |
| 9 / 10 / 11 | épaisseurs correspondantes | décimal Java (« 1.0 ») | 1.0 |
| 12-14 / 15-17 / 18-20 | couleurs R, V, B des trois traits | entiers | 0 |
| **21** | afficher les quantités et les prix | 1/0 | 1 |
| **22** | afficher les unités de quantité | 1/0 | 0 |
| 23 / 24 / 25 | tailles : titres / sous-totaux / totaux | entiers | 9 |
| 26 / 27 / 28 / 29 | polices : positions standards / titres / sous-totaux / totaux | texte | « Arial » |
| 30 | trait après sous-totaux | 1/0 | 1 |
| 31 | épaisseur après sous-totaux | décimal | 0.5 |
| 32-34 | couleur du trait des sous-totaux | entiers | 0 |

- `ch11bEncode(o)` : valeurs dans l'ordre, chacune suivie de « ; » ; décimaux par `ch11bJd(x)` = `Number.isInteger(x) ? x.toFixed(1) : String(x)` (même règle que `ch01aJd`, sans dépendre de CH-01).
- `ch11bDecode(s, def)` : `split(';')`, indice par indice tant qu'il y a des valeurs ; valeur manquante = défaut ; valeur illisible → **tous les défauts, interligne 14** [C, E8 ; l'original prend 11].
- Chaîne des défauts de l'original : `0;9;1;14;1;0;0;0;0;1.0;1.0;1.0;0;0;0;0;0;0;0;0;0;1;0;9;9;9;Arial;Arial;Arial;Arial;1;0.5;0;0;0;` (95 caractères).
- **Source** d'une facture (`ch11bSrc(f)`) : `TEMPLATEPROPERTIES` s'il est rempli, sinon `ds_inv_tplprops` du poste (`ch11bFav()`), sinon **aucune** [P `getDefaultPreferences`, recopie en mémoire seulement].
- **Sans aucune source** [C, D-CH11-8] : l'impression garde **police, taille et interligne du modèle** (aucun changement par rapport à aujourd'hui) ; les autres réglages prennent les défauts de l'original (page de garde, titres, prix oui ; unités non ; trait de sous-total 0.5 pt noir, déjà dessiné par `ivPrintRows`). Le dialogue affiche alors, pour les indices 1, 3 et 23-29, les valeurs de l'élément tableau du corps du modèle (`police`, `taille`, `hauteurLigne` ou `taille × 1.35`, arrondi à l'entier) ; elles deviennent explicites à l'OK.
- **Correction de `ivPrintOpts`** (ancre I1) : indices **21** et **22** ; source `TEMPLATEPROPERTIES`, sinon, pour une facture (jamais pour `null`), `ch11bFav()` s'il existe ; commentaire corrigé. `ch11bFav` est une déclaration `function` (§ 1 n° 40). Avec la chaîne de défaut, le code actuel donne prix **faux** (indice 20 = bleu du trait total) et unités **vraies** : contrôle K44.

### 9.2 Visionneuse « Facture » et dialogue « Paramètres »

**Visionneuse** (`ch11bOldInvoice(f, p, extra, fb)`, appelée par `ivPrint` à la place de l'impression directe, ancre I2) : `await tplNeed()` ; titre « Facture » [S `InvoiceDialog|dialogTitle`] ; rendu `tplPrint` par `ch11aWin` ; boutons « Préférences » [S `InvoiceDialog|preferences`], « Imprimer », « Fermer ». `bseq` de la facture lu à l'ouverture. La page ajoutée (`extra`, QR) et la question « avec requête de statut » de `ivPrint` sont inchangées (la question s'affiche au-dessus de la visionneuse). Repli : `fb` (`ivPrintHTML`), comme aujourd'hui.

**« Paramètres »** [S `pr.invoice|PreferencesDialog|*`] : liste « Catégorie » à gauche (« Document », « Impression »), volet à droite, « Annuler » / « OK » (**OK toujours actif**).
- **Document**
  - « Modèle » : champ en lecture seule « `<groupe> <modèle>` » (`formtemplategroup.NAME`, puis `NAMEFR` ou `NAME` du modèle) + bouton « … » → dialogue « Choix du modèle » [S `form|ChooseTemplate`] : liste déroulante des groupes de `projectTemplates` (groupe du modèle courant, sinon Standard) et table des modèles `projectInvoice` du groupe, colonne « Modèle » [S `form|templateCol`] ; OK si une ligne est sélectionnée ; double-clic = OK [P `aq.TemplateChooserDialog.<init>@5-220`] ; résultat = `formtemplate.ID` (correspondance `formtemplate.ID` → `modele['projectTemplates/<groupe>/projectInvoice/<nom>']` : 4901 Default, 4905 Standard, 5568 Substances, 5633 Substances_2 au bureau [D]).
  - ☐ « Page de garde ».
  - « Police des positions standards », « Police des titres », « Police des sous-totaux », « Police des totaux » : chacune une liste de polices + « Taille de police » (liste **6 à 12**) (§ 1 n° 24).
  - « Interligne » (entier).
- **Impression** [S `displayConditions`]
  - ☐ « Afficher les titres des colonnes » ; ☐ « Titres des colonnes en gras » (affichée, **non enregistrée**, décochée à chaque ouverture) ;
  - ☐ « Trait sous les titres des colonnes », ☐ « Trait au-dessus du total avant la TVA », ☐ « Trait après le total », ☐ « Trait après sous-totaux », chacun avec « Épaisseur » (décimal) et une couleur (`input type=color` ↔ R, V, B) ;
  - ☐ « Afficher les quantités et les prix » ; ☐ « Afficher les unités de quantité ».
- Valeur illisible (taille, interligne, épaisseur) : **ignorée sans message**, ancienne valeur gardée [P `jOkButtonActionPerformed@0-525`].
- **OK** : relecture de la facture, `s = ch11bEncode(o)` ; si `s.length < 255` : commit (§ 3.4) **et** `ds_inv_tplprops = s` ; sinon rien. Puis la visionneuse se redessine. Conflit 409 : message de `DS.commit`, dialogue gardé ouvert (`return false`).

### 9.3 Effets sur l'ancien document [P `InvoiceDialog.createTitleLine`, `fillConditionTable`, `fillPage`, `getFormTemplate`]

| Réglage | Effet dans DeltaSub |
|---|---|
| `templateId` | ≠ 0 : modèle correspondant passé à `tplPrint` par `o.md` (ancre T2) ; introuvable : `ctMsg('Information', 'Impossible de trouver le modèle ' + id + '.')` [S `InvoiceDialog|msg3`] et rien ; 0 : `tplFind` (groupe de l'affaire) |
| page de garde, titres, prix, unités | inchangés (`ivCover`, `noHeader`, `ivPrintCols`, `ivPrintRows`) avec les bons indices |
| police et taille standards, interligne | **seulement avec une source** (§ 9.1) : copie du modèle (`o.md`), éléments `tableau` du corps des pages (`police`, `taille`, `hauteurLigne`) ; la pagination de `tplPrint` suit |
| polices et tailles des titres, sous-totaux, totaux | seulement avec une source : drapeaux `_font`, `_fs` sur les lignes Groupe (0 : police 27, taille 23), Sous-total (2 : 28, 24), Total (6 : 29, 25) [D] (ancres T3, T4) ; police : `tplFont` + gras si le nom contient bold, black ou heavy |
| traits | sous l'en-tête : `cols._hl = {w, c}` ; au-dessus de la première ligne de TVA (genres 4 et 5) : `_line`, `_lw`, `_lc` ; après un Total : `_lb = {w, c}` ; après un Sous-total : `_line` de la ligne suivante avec `_lw` = indice 31 et `_lc` = indices 32-34, **retiré** si l'indice 30 vaut 0 ; épaisseurs en points, couleur `rgb(r,g,b)` (ancres T3, T4) |
| montants | inchangés (`num`, « x % ») |

Fonctions pures du lot : `ch11bRows(pos, O, S)` = `ivPrintRows(pos, O)` décorées selon les positions visibles (même ordre), `ch11bCols(O, S)` = `ivPrintCols(O)` avec `_hl`, `ch11bModel(md, S)` = copie du modèle avec la police de corps.

---

## 10. PDF stockés, QR-facture, fusion, pièces jointes, import (lot 4, avec CH-03)

### 10.1 Interface de CH-03 utilisée (spec_17 § 3, « figée »)

À relire, avec le code `ch/CH-03/lot*.js`, **au moment d'écrire le lot** ; appliquer CH-03 dans la copie de test s'il est disponible. Chaque appel est gardé par `typeof` sur la fonction citée ; sans elle, l'entrée est grisée avec l'infobulle « Fichiers PDF : prévu avec CH-03 ».

| Besoin CH-11 | Fonctions CH-03 | Lot CH-03 |
|---|---|---|
| Dossier d'un objet | `ch03aDossier('facture' \| 'contrat' \| 'calcul', p.ID, id)` = `ProjectDocuments/Documents/<P>/Invoices\|Contracts\|FeeCalculations/<id>` | 1 |
| Liste des PDF, tableau et menu ▾ (Ouvrir, Partager le fichier PDF…, Import fichier PDF…, Fusionner PDF…, Supprimer) | `ch03cPdfZone({dossier, projet, concerne, contacts, lectureSeule, fusionNom})` → `{el, bouton, sel(), redraw()}` | 3 |
| « Enregistrer sous forme de fichier PDF … » | `ch03bEnregistrerPdf({dossier, nomDoc, html, projet})` (dialogue « Enregistrer le fichier », en-tête « Créer un fichier PDF à partir du document », nom « `<doc>.pdf` », question de remplacement, PDF sans visionneuse) | 2 |
| Visionneuse, PDF ▾, Partager ▾, pièce jointe | `ch03bView(titre, src, {pdf, joindre, concerne, contacts, boutons})` (via `ch11aView`) ; contexte d'un moteur existant : `ch03bContexte({joindre})` | 2 |
| Dialogue de nom / choix d'un PDF | `ch03bNomDlg({mode:'enregistrer' \| 'choisir', entete, dossier, nom})` | 2 |
| Générer, déposer, superposer, fusionner | `ch03aPdf(html)`, `ch03aEnregistrer(dossier, nom, r, {projet, origine, remplacer})`, `ch03aSuperposer(base, calque)`, `ch03aFusion([…])` | 1 |
| Ouvrir le fichier produit | `const t = ch03aOnglet()` **dans le clic**, puis `t.aller(ch03aUrl(rec))` | 1 |
| Copie d'un PDF d'un autre dossier | `ch03cImporterDe(source, cible)` (dialogue « Fichiers PDF ») | 3 |
| Dossier vide ? | `ch03aDossierVide(dossier)` (après `ch03aPret()`) | 1 |

### 10.2 Panneaux : PDF (crochets appelés par le lot 3)

- `ch11dZone(o, rec)` → élément + bouton ▾ de `ch03cPdfZone` sur le dossier de l'objet ; `concerne` et `contacts` du § 10.6 ; `lectureSeule` faux ; `fusionNom` vide.
- `ch11dSavePdf(o, rec)` → `ch03bEnregistrerPdf({dossier, nomDoc: rec.doc.nom, html: () => svDpDocHTML(R de l'ouverture), projet: p.ID})` ; rafraîchissement.
- `ch11dViewOpts(dossier, p, objet, doc, x)` → `{pdf:{dossier, nom: doc.nom, projet}}` pour un document enregistré (« Sauvegarder et ouvrir »), ou `{joindre: dossier}` (`x.joindre`, calcul du contrat) ; `concerne`, `contacts`.
- `ch11dHasPdf(dossier, p, id)` → `!ch03aDossierVide(ch03aDossier(genre, p.ID, id))` (refus du § 8.5).

### 10.3 QR-facture (ancres Q1, Q2) [P `GenerateQRBillDialog.generateQRBill()@0-382`, `QRBill.appendBillOnly@0-232`]

- `ch11dQrFs(f)` = facture enregistrée **et** `ch03aPdf`, `ch03aEnregistrer`, `ch03bNomDlg`, `ch03aSuperposer`, `ch03aFusion`, `ch03aOnglet` présents.
- **Activation** (Q1, remplace la ligne de `sync`) : avec `fs = ch11dQrFs(f)`, à la **première** exécution de `sync` seulement (drapeau) : sous-option cochée d'après `qrPref('gen', 'lastPage')`, « Afficher le fichier PDF » d'après `qrPref('open', '0')`, option A cochée si `canApp && qrPref('save', 'fileGroup') === 'fileGroup'` (rB coché sinon, explicitement : les radios ne sont pas encore dans le document) ; infobulles « lot 7 » vidées. À chaque exécution : `dis(rA, lA, !canApp)`, `dis(mNew, lNew, !fs || !rA.checked)`, `dis(mLast, lLast, !fs || !rA.checked)`, `dis(mPage, lPage, !rA.checked)`, `dis(opn, lO, !fs)`. Sans `fs` : comportement actuel inchangé.
- **OK** (Q2, avant la branche existante) : si `rA.checked && canApp && fs` : `qrPrefSet('gen', …)`, `qrPrefSet('open', …)`, puis `return ch11dQrOut(f, bill, {lang, size, sep, mode, open})`. `ch11dQrOut` appelle `ch03aOnglet()` **avant tout `await`** si « Afficher le fichier PDF » est coché (le clic sur OK est le geste) :
  - **Nouveau fichier PDF** : `ch03bNomDlg({mode:'enregistrer', entete:'Enregistrer le bulletin de versement QR', dossier, nom:'Bulletin de versement QR'})` [S `GenerateQRBillDialog|saveQRPdfTitle`, `|defaultFilename`] → `ch03aPdf(ch11dQrHtml(qrBillSVG(bill, {lang, size, sep}), size))` → `ch03aEnregistrer(dossier, nom, r, {projet, origine:'qr', remplacer:true})` (la question de remplacement est posée par le dialogue) → ouverture si demandée.
  - **Ajouter le QR-facture à la fin de la facture** / **… comme nouvelle page à la fin** : `ch03bNomDlg({mode:'choisir', entete:'Joindre QR-facture à un document', dossier})` [S `|appendQRPdfTitle`] (liste vide : OK grisé) → calque = `ch03aPdf(ch11dQrCalque(bill, {lang, sep}))` → `ch03aSuperposer(rec.SHA256, calque.sha)` (dernière page) ou `ch03aFusion([rec.SHA256, calque.sha])` (nouvelle page) → `ch03aEnregistrer(dossier, rec.NOM, r, {remplacer:true, origine:'qr'})` → ouverture si demandée. Aucun contrôle de place libre, rien n'est masqué (comme l'original, spec_17 § 1 n° 21).
- `ch11dQrHtml(svg, size)` (pure) : même document que `qrPrintSVG` (format exact `@page`), sans fenêtre. `ch11dQrCalque(bill, o)` (pure) : page A4 `@page{size:210mm 297mm;margin:0}`, `html,body{margin:0;background:transparent}`, un seul SVG `qrBillSVG(bill, {…o, size:'a4'})` (section en bas, format QR_BILL_EXTRA_SPACE), **sans** le fond blanc de `qrPageHTML`.
- Écritures : aucune en base ; préférences `ds_qr_*`. Erreur : `ctMsg('Avertissement', <message du serveur>)`.

### 10.4 Fusion facture + QR + annexes

Pas de fonction propre à la facture : « Fusionner PDF … » de la zone CH-03 (plusieurs PDF sélectionnés, ordre modifiable, « Nom du fichier » vide, OK si plus d'une ligne et un nom) [P `MergePdfFilesDialog.checkGuards@109-142`]. Recette : PDF de la facture (§ 10.2), QR (nouveau fichier ou ajoutée), pièces jointes (§ 10.5, ou « Import fichier PDF … »), fusion.

### 10.5 Pièces jointes et « Importer des fichiers PDF du calcul »

- **Controlling** (ancre C1) : l'entrée existante « Etablir le document d’analyse … » appelle d'abord `ch11dCtlCtx(p)` s'il existe, qui pose `ch03bContexte({joindre: () => ch11dPickInvoice(p)})` ; la fenêtre de `ctlPrint` interceptée par CH-03 lot 2 s'ouvre alors dans la visionneuse avec Partager ▾ « Enregistrer le PDF en pièce jointe … » [S `doc.ui|Viewer|attachPdf`] (dépôt dans `Invoices/<ID>`, en-tête « Enregistrer le PDF en pièce jointe », nom **vide**) [P `Viewer.attachPdf(FileGroup)@0-88`]. `ch11dPickInvoice(p)` → Promise(dossier | null) : dialogue « **Sélectionner une facture** » (titre exact), factures de l'affaire, tous statuts, colonnes `IV_BCOLS` (Désignation, Numéro, Date de facture, Statut), OK si une ligne, double-clic = OK, Annuler / Échap → `null` [P § 1 n° 31]. Sans facture dans l'affaire : liste vide, OK grisé.
- **Calcul des honoraires du contrat** (§ 8.4) : `joindre` = dossier du contrat, sans choix de facture.
- **« Importer des fichiers PDF du calcul »** (`ch11dImportCalc(c, p)`) [P `pr.ProjectContractFrame.importPdfFromCalculation@0-36`] : `ch03cImporterDe(ch03aDossier('calcul', p.ID, c.PROJECTFEECALCULATION_ID), ch03aDossier('contrat', p.ID, c.ID))` (dialogue « Fichiers PDF », un choix, question de remplacement) ; rafraîchissement. Aucune écriture en base.

### 10.6 Partage et courriel

Générique CH-03 (D8 : téléchargement puis `mailto:`, **jamais d'envoi automatique**). Données fournies par CH-11 (`ch11dShare(dossier, objet, p)`, pure) [P `getDefaultSubject`, `addDocumentContacts`] : `concerne` = `NAME` (facture, contrat), `TITLE` (variante) ; `contacts` = débiteur (facture), mandant (contrat), mandant **puis** mandataire de l'en-tête (offre, rien sans en-tête), chacun `{desc: contactName(c), email: c.EMAIL1, civilite: c.SALUTATION1}` s'il a un courriel.

---

## 11. Messages et libellés exacts (récapitulatif)

| Où | Texte | Source |
|---|---|---|
| Barre des modules | « Contrats honoraires », « Factures » | [S `Modules`] |
| Catégories | § 5.1 et § 6.1 | [S] |
| Filtres | « Appliquer le filtre », « Editer le filtre … », dialogue « Editer le filtre », « Statut de l’affaire », « Affaires en cours et terminées », « Toutes les affaires », « Date de contrat », « Dates d’échéance », « Date de facture », « Date d’échéance », « Date d’encaissement », « de », « à » | [S `ReportFilter*`, `*Frame|*`] |
| Contrats | « Statut du contrat », « En traitement », « Validé », « Refusé » | [S] |
| Rapports | « Afficher le rapport … », « Afficher le rapport … [Ancien document] », « Enregistrer le diagramme … » | [S `Strings|showReport`, `legacyMenu`, `Charts|saveChartAsImage`] |
| Factures | « Jour de référence », tris du § 6.5, « Mettre les montans en evidence de : », « Tous », « Afficher les détails » | [S] |
| Diagrammes | « Situation », « Contrat », « Encaissements planifiés », « Encaissements », « Solde à encaisser », « Avancement prévu », « Avancement effectif », « Heures effectuées » | [S] |
| Panneau | « Document », « Nom du document », « Fichiers PDF », « Nouveau document », « Renommer le document … », « Supprimer le document », « Ouvrir le document », « Enregistrer sous forme de fichier PDF … », « «Nouveau document de facturation» », « «Nouveau document contrat» », « «Nouveau document de calcul» », « «Nouveau document» », « QR-facture … », « Afficher le calcul des honoraires », « Importer des fichiers PDF du calcul » | [S] [P § 1 n° 25-27] |
| Suppression d'un document | « Voulez-vous supprimer ce fichier définitivement ? » (Avertissement) | [S `Strings|msgDeleteFileDefinitely`] |
| Suppression d'un objet | « Cette inscription ne peut pas être effacée, car il existe encore des documents ou des fichiers PDF. » (Information) | [S `Strings|msgFileGroupNotEmpty`] |
| Ancien document | « Facture », « Préférences », « Paramètres », « Catégorie », « Document », « Impression », « Modèle », « Page de garde », « Police des positions standards », « Police des titres », « Police des sous-totaux », « Police des totaux », « Taille de police », « Interligne », « Afficher les titres des colonnes », « Titres des colonnes en gras », « Trait sous les titres des colonnes », « Trait au-dessus du total avant la TVA », « Trait après le total », « Trait après sous-totaux », « Épaisseur », « Afficher les quantités et les prix », « Afficher les unités de quantité », « Choix du modèle », « Modèle » (colonne), « Impossible de trouver le modèle ^0. » | [S `pr.invoice|*`, `form|ChooseTemplate`, `form|templateCol`] |
| Anciens documents Management | « Liste des contrats », « Echéancier d’encaissements », « Plan de paiements », « Plan d’ordres de paiements », « Contract - paiements », « Analyse de factures », « Contrôle de factures », « Jour de référence: » | [S] [P § 1 n° 33, 39] |
| QR | « Enregistrer le bulletin de versement QR », « Bulletin de versement QR », « Joindre QR-facture à un document », « Nouveau fichier PDF », « Ajouter le QR-facture à la fin de la facture », « Ajouter le QR-facture comme nouvelle page à la fin », « Afficher le fichier PDF » | [S `GenerateQRBillDialog|*`] |
| Pièces jointes, import | « Enregistrer le PDF en pièce jointe … », « Enregistrer le PDF en pièce jointe » (en-tête), « Sélectionner une facture », « Fichiers PDF », « Créer un fichier PDF à partir du document », « Le fichier existe déjà. Voulez-vous le remplacer ? » | [S] |

---

## 12. Valeurs de contrôle

Recalculs de référence : `ch/CH-11/ctl.py` (réimplémentation littérale des § 5 et § 6, relancée pour cette version : sortie identique) et les cas F1-F11, C1-C9, T1-T8 de spec_9 § 12. Les jeux d'essai sont **synthétiques** sauf les lignes « bureau », qui ne citent que des identifiants et des montants.

**Jeu synthétique S** (rech_orig § 15.2) : affaires A1 (CHF, état 2) et B7 (CHF, état 4) ; contrats C1 (A1, n° 1, maître d'ouvrage, Validé, 10.02.2026, 108'100.00, 800 h), C2 (A1, n° 2, sous-traitant, En traitement, 01.03.2026, 21'620.00, 150 h), C3 (A1, n° 3, maître d'ouvrage, Refusé, 10'000.00), C4 (B7, n° 1, maître d'ouvrage, Validé, 20.11.2025, 54'050.00) ; planifications de C1 : 31.03 / 30.04.2026 32'430.00, 30.06 / 30.07.2026 32'430.00, 31.12.2026 / 30.01.2027 43'240.00 ; encaissements C1 28.04.2026 32'430.00 et 15.07.2026 21'620.00, C2 20.05.2026 5'405.00 ; factures F1 (A1, 2026-01, 31.03 / 30.04, Payée, C1, 32'430.00 encaissé 32'430.00 le 28.04), F2 (A1, 2026-02, 30.06 / 30.07, Payée, C1, 32'430.00, encaissé 21'620.00 le 15.07), F3 (B7, 2026-03, 15.09 / 15.10, Envoyée, C4, 54'050.00), F4 (A1, 2026-04, 30.09 / 30.10, Planifiée, sans contrat, 1'081.00).

### 12.1 Tests jsc (fonctions pures ; `jsc lotN_test.js` sur le script du `DeltaSub.html` construit)

**Lot 1**

| # | Cas | Attendu |
|---|---|---|
| K1 | `ch11aHm(['USD','EUR','GBP','CHF'])` | CHF, EUR, GBP, USD |
| K2 | `ch11aJs('a','B')`, `ch11aJs('Z','a')` | 1 ; −1 |
| K3 | bureau R1 : Contrats, filtre arrêté, cases par défaut (contrat 501) | 5 lignes : titre affaire 915 (gras) · valeur (colonne 0 = `NAME` du contrat 501, N° 1, 2025-08-18, Maître d’ouvrage, Validé, CHF) **186'999.99 / 0.00 / 186'999.99** · « Contrats » (surligné) idem · vide · « Total contrats » (surligné + gras) idem |
| K4 | bureau R2 : filtre en marche, janvier - décembre 2026 | 0 ligne ; Rapports grisé ; libellé « janvier 2026 - décembre 2026 » |
| K5 | bureau R3 : case « Validé » décochée | 0 ligne |
| K6 | S, T1 : Contrats | « Total contrats » **162'150.00 / 54'050.00 / 108'100.00** ; C2 et C3 absents |
| K7 | S, T2 : Contrats et sous-traitants | A1 : « Contrats - sous-traitants » **86'480.00 / 48'645.00 / 37'835.00** ; B7 : « Contrats sous-traitants » 0.00 / 0.00 / 0.00 ; « Total contrats - sous-traitants » **140'530.00 / 48'645.00 / 91'885.00** |
| K8 | S, T3 : « Refusé » cochée | C3 sous C1 ; « Contrats » A1 = 118'100.00 / 54'050.00 / 64'050.00 |
| K9 | manuel M1 (5 affaires, montants seulement) | « Total contrats » **2'071'740.00 / 440'814.40 / 1'630'925.60** |
| K10 | S, T7 : Echéancier, filtre arrêté | échéances 30.04.2026, 30.07.2026, 30.01.2027 ; « Montant » rempli, « Sous-traitants » vide ; vide ; « Total » CHF **108'100.00 / 0.00** |
| K11 | S, T8 : Encaissements reçus de C1 (E1 et E2 corrigés) | colonnes visibles Genre, Remarque, Date de la facture, **Date de paiement**, Montant, Monnaie (**CHF**) ; « Total » 54'050.00 |
| K12 | manuel M3 : Encaissements planifiés, 50'000.00, 40'000.00, 80'000.00 | « Total » **170'000.00** |
| K13 | S, T4 : Situation de C1 | soldes 108'100.00 · 108'100.00 · **75'670.00** · 75'670.00 · **54'050.00** · 54'050.00 ; « Total » 108'100.00 / 54'050.00 / 54'050.00 |
| K14 | S, T5 : diagramme de C1 | mois mars, avril, juin, juillet, décembre 2026 ; Contrat 108'100 constant ; planifiés cumulés 32'430 / 32'430 / 64'860 / 64'860 / 108'100 ; encaissés 0 / 32'430 / 32'430 / 54'050 / 54'050 ; solde 108'100 / 75'670 / 75'670 / 54'050 / 54'050 |
| K15 | S, T6 : premier encaissement au 15.03.2026 | courbe « Contrat » = **108'100.00** (E3 corrigé ; l'original donnerait 75'670.00) |
| K16 | manuel M4 : contrat 270'000.00, 4 planifications, 4 encaissements | « Total » **265'000.00 / 269'373.35 / 626.65** |
| K17 | E4 : encaissement de C1 à 0.00 avec seulement une date de facture | pas d'exception ; ligne en tête des événements, solde inchangé ; absente du diagramme |
| K18 | bureau R4 : Situation du contrat 501 | titre (solde 186'999.99 CHF) · « Total » 0.00 CHF / 0.00 CHF / 186'999.99 CHF ; diagramme vide |
| K19 | S, T9 : Avancement A1 (30.04.2026 prévu 20 effectif 15 ; 31.07.2026 prévu 50 effectif vide ; heures 130 et 325) | M = **96'480.00** (Refusé compris), H = 650 ; ligne 1 : **33.61**, 66.39, 20.00 ; ligne 2 : **50.42**, 49.58, 50.00, effectif vide |
| K20 | Avancement d'une affaire sans contrat | colonnes 5, 7, 9 vides (pas « NaN ») |
| K21 | `ch11aFlat` sur `0/managementContractsScheduledPayments-fr`, contrat n° « 1 » nommé « X » | « Contrat d'honoraires » = « 1 X » (et non « X X ») |
| K22 | lignes du document de K3 | vides sautées ; titre `l1`, valeur `tr`, « Contrats » `l1t`, « Total contrats » `tt` ; `filterDesc` vide |
| K23 | `ch11aRFdesc` : filtre arrêté ; en marche mars 2026 - juin 2026 | `''` ; « mars 2026 - juin 2026 » |
| K24 | table des anciens documents (§ 4.8) | titres « Plan de paiements », « Plan d’ordres de paiements », « Contract - paiements » ; `periode` du Contrôle par date avec jour 15.07.2026 = « Jour de référence: 15.07.2026 » |
| K25 | `ch11aFix` sur `0/managementContractsPaymentBalance-fr` | plus aucun « Erstellt von » ni « Seite » ; « Créé par » et « Page » à leur place ; aucun autre texte modifié |
| K26 | menu Rapports de la Situation, tableau vide | « Afficher le rapport … » et « … [Ancien document] » grisés, séparateurs présents, « Enregistrer le diagramme … » actif |

**Lot 2**

| # | Cas | Attendu |
|---|---|---|
| K30 | S, T10 : Vue d'ensemble 2026 | mars 32'430.00 / 32'430.00 / 0.00 ; juin 32'430.00 / 21'620.00 / 10'810.00 ; septembre 55'131.00 / 0.00 / 55'131.00 ; « 4ème trimestre » 0.00 ; « 2026 Total » **119'991.00 / 54'050.00 / 65'941.00** ; 17 lignes |
| K31 | S, T11 : Selon statut | Planifiée : F4, 1'081.00 / 0.00 / 1'081.00 ; Ouverte : F3 et F4, 55'131.00 / 0.00 / 55'131.00 ; Payée : F1 et F2, 64'860.00 / 54'050.00 / 10'810.00 |
| K32 | S, T12 : Date d'échéance, jour de référence **15.07.2026** coché | F1 avant 32'430.00 / après 0.00 ; F2 avant 0.00 / **après 21'620.00** ; F3, F4 0.00 / 0.00 ; « Total » 119'991.00, avant 32'430.00, après 21'620.00 ; colonnes Encaissé, Solde, Nb rappels masquées |
| K33 | S, T13 : idem, « Tri par affaire et date (ordre croissant) » | titre A1 · F1, F2, F4 · « Total » 65'941.00 · vide · titre B7 · F3 · « Total » 54'050.00 · vide · « Total » CHF 119'991.00 |
| K34 | tri 3 (décroissant) sur F1-F4, F4 sans date de facture | F4 en **dernier** |
| K35 | tri 8 avec deux factures de A1 sans numéro | pas d'exception (E6) ; ordre stable |
| K36 | manuel M6 : Date d'échéance, trois affaires | sous-totaux **35'000.00**, **158'000.00**, **1'075'000.00** |
| K37 | S, T14 : Honoraires et frais (conditions HT C1 100'000, C2 20'000, C3 9'250.69, C4 50'000 ; factures HT F1 et F2 30'000, F3 50'000, F4 1'000) | A1 : Contrats **89'250.69** · sans contrat 1'000.00 · sur contrat 60'000.00 · Solde **29'250.69** · Montant facturable 0.00 ; B7 : 50'000.00 · 0.00 · 50'000.00 · Solde 0.00 |
| K38 | bureau R6-R6c, affaire 915 | affaire : Contrats **173'630.45**, sans contrat 0.00, sur contrat 0.00, Solde 173'630.45, Montant facturable **31.50** ; Honoraires : Contrats 173'630.45, **539.50 h**, 0.00 ; Frais : Contrats **0.00**, 31.50 |
| K39 | bureau R7 | **86** affaires (états 2, 3, 4 : 46 + 4 + 36) ; Σ heures **49'814.00** (84 affaires avec des heures), Σ montant facturable des heures **518'754.31** ; Σ frais **27'585.74** (41 affaires) |
| K40 | seuil 10'000 | seules les valeurs > 10'000.00 de la dernière colonne en vert ; « Tous » : aucune couleur |
| K41 | `ch11aFix` sur `0/managementInvoicePendingReport-fr` | plus aucun « 9. Dezember 2021 » ; champ `date` `dateFull` à sa place |
| K42 | `ch11bEncode(défauts de l'original)` | la chaîne de 95 caractères du § 9.1, 35 valeurs |
| K43 | `ch11bDecode` de cette chaîne avec indice 21 = 0 et 22 = 1 | prix faux, unités vraies |
| K44 | `ivPrintOpts` corrigé sur la chaîne de défaut | `{cover:true, title:true, price:true, unit:false}` (le code actuel donne price false, unit true) |
| K45 | `ch11bDecode('x;y;z;')` | défauts, interligne **14** |
| K46 | réglage de 255 caractères ou plus | aucune écriture, aucune préférence |
| K47 | T15 : affaire A9 (état 2), un contrat **sans calcul** 50'000.00, une facture sur ce contrat HT 10'000.00 | A9 : Contrats **vide**, sans contrat 0.00, sur contrat 10'000.00, Solde **vide** ; Honoraires et Frais : Contrats vides |
| K48 | T16 : condition honoraires HT 20'000.00, frais HT −20'000.00 | H + F = 0 → les trois « Contrats » vides, Solde vide |
| K49 | T17 : honoraires HT 20'000.00, frais 0.00, facture sur contrat HT 10'000.00 | affaire : Contrats 20'000.00, Solde 10'000.00 ; Honoraires 20'000.00 ; Frais **0.00** |
| K50 | source absente, modèle Substances (`AkkuratLL-Light`, taille 10, sans interligne) | `ch11bModel` rend le modèle **inchangé** ; valeurs initiales du dialogue : police `AkkuratLL-Light`, tailles 10, interligne 14 |
| K51 | `ch11bRows` avec trait après le total (1.0, rouge 255/0/0), indice 30 = 0 | ligne Total : `_lb = {w:1, c:'rgb(255,0,0)'}` ; aucune ligne `_line` après un Sous-total |
| K52 | ancre T4 : Groupe dont le nom tient sur 2 lignes, avec `_font`, `_fs`, `_lb` | les 2 sous-lignes gardent `_font` et `_fs` ; `_lb` sur la dernière seulement |

**Lot 3**

| # | Cas | Attendu |
|---|---|---|
| K60 | bureau R8 : contrat 501 | `contractAmount` « 186'999.99 », `contractAmountVat` « 13'369.54 », `contractAmountExcludedVat` « 173'630.45 » ; `projectFee` et `projectFeeCalculation` vides (calcul de base) |
| K61 | bureau R9 : `timeCalculationTable` (k0 vrai) | Brut 173'630.45 (`l1t`) · « TVA » « 7.7 % » 13'369.54 · « Total TTC » 186'999.99 (`tt`) ; sans rabais, escompte ni arrondi |
| K62 | bureau R10 : `costCalculationTable` (condition 501, taux −1) | Brut 0.00 · « TVA » « 8.1 % » 0.00 · « Total TTC » 0.00 |
| K63 | spec_9 C2 : 100'000, rabais −2, TVA 7.7 | Brut 100'000.00 · Rabais « -2.0 % » −2'000.00 · Sous-total 98'000.00 · TVA « 7.7 % » 7'546.00 · Total TTC 105'546.00 |
| K64 | `projectFeeCalculationAmount~projectFeeCalculationAmountVatRate` à 7.7 | « 7.70 » |
| K65 | spec_9 T1 : facteurs Z1 0.062, p 0.1678, Tm 1'678 | `calculationFactorsValueZ1` « 0.06 », `FactorP` « 0.17 », `AmountTm` « 1'678.00 » |
| K66 | spec_9 F8 dans `projectInvoicePosTable` | Groupe (`l1`), 10'000.00, % −1'000.00 (« % » en colonne 4), % TVA −81.00, Total 8'919.00 (`tt`) |
| K67 | `projectInvoicesTable`, contrat avec deux factures antérieures | 2 lignes + total `tt` |
| K68 | champ `projectContract~projectContractName` de la facture | `NAME` du contrat |
| K69 | `ch11cBlockDel('Invoices', id)` avec un document | vrai, message exact ; sans document ni PDF : faux |
| K70 | « QR-facture … » : facture 1'081.00, QR-facture de 1'080.00 | ouvre l'**éditeur** |
| K71 | `projectStartDate` d'une affaire au 2026-03-02 | « 2 mars 2026 » (MEDIUM) |
| K72 | T20 : panneau d'une facture sans document | bouton principal « «Nouveau document de facturation» » ; menu : seul « Nouveau document » actif ; « QR-facture … » grisé |
| K73 | menus propres | facture : « QR-facture … » juste après « Enregistrer sous forme de fichier PDF … », **sans** séparateur ; contrat : séparateur puis « Afficher le calcul des honoraires », « Importer des fichiers PDF du calcul » (absente si le contrat n'a pas de calcul) |
| K74 | noms par défaut | offre `NUMBER` vide, `TITLE` « Etude » → « Etude » ; `NUMBER` « 3 » → « 3 Etude » ; contrat et facture : `NAME` |
| K75 | `ch11cMembers` | clés `projectMemberProjectManagerContact/Responsible` (rôle 4) et `projectMemberBuilderConsultantStandbyContact/Responsible` (rôle **51**) |

**Lot 4**

| # | Cas | Attendu |
|---|---|---|
| K80 | T18 : nom proposé par « Enregistrer sous forme de fichier PDF … » d'un document « Facture 1 » | « Facture 1.pdf » ; en-tête « Créer un fichier PDF à partir du document » (appel `ch03bEnregistrerPdf` avec `nomDoc` = « Facture 1 ») |
| K81 | `ch11dQrCalque(bill valide)` | contient `@page{size:210mm 297mm;margin:0}` et `background:transparent` ; un seul `<svg` de 297mm ; aucun `background:#fff` |
| K82 | `ch11dQrHtml(svg, 'bill')` | `@page{size:210mm 105mm;margin:0}` (même format que `qrPrintSVG`) |
| K83 | T19 : « Créer une QR-facture », fichiers disponibles, aucune préférence | option A cochée, « Ajouter le QR-facture à la fin de la facture » cochée, « Afficher le fichier PDF » décoché, langue « Français » (E16), 3 séparations |
| K84 | T21 : `ch11dPickInvoice` pour une affaire à 2 factures | titre « Sélectionner une facture », colonnes Désignation, Numéro, Date de facture, Statut ; OK grisé sans sélection ; Annuler → `null` |
| K85 | `ch11dShare` | facture : débiteur avec courriel ; contrat : mandant ; offre sans en-tête : aucun contact ; `concerne` = `NAME` / `TITLE` |
| K86 | `ch11cBlockDel` avec un PDF et sans document | vrai (refus) |
| K87 | QR sans CH-03 (`ch11dQrFs` faux) | dialogue identique à aujourd'hui (options A grisées sauf « comme nouvelle page ») |

### 12.2 Essai navigateur (copie isolée, un port par lot, obligatoire)

Dossier du lot, copies de `serveur_deltasub.py` (modifiée au lot 3) et du `DeltaSub.html` construit par le `build.py` du lot ; base par `sqlite3 dstest/deltasub.sqlite ".backup '<dossier>/deltasub.sqlite'"` ; `DELTASUB_DB=<dossier>/deltasub.sqlite python3 -I <dossier>/serveur_deltasub.py --port <port>` en arrière-plan (proposition 7881 à 7884, libre vérifié par `lsof`) ; onglet propre (`tabs_create` puis `navigate`), `localStorage.ds_user='2752'`, rechargement. Données S créées dans la copie par `DS.commit` depuis la console (identifiants de deux affaires existantes d'états 2 et 4, montants synthétiques). Impressions vérifiées dans l'`iframe` de la visionneuse. Au lot 4, appliquer CH-03 (lots disponibles) dans la copie. À la fin : serveur arrêté, onglet fermé, taille d'affichage par défaut.

| # | Lot | Scénario | Attendu |
|---|---|---|---|
| N1 | 1 | Management ▸ Contrats honoraires, catégorie Contrats | K3 à l'écran ; catégorie mémorisée au rechargement |
| N2 | 1 | Filtre : Editer le filtre (2026) puis OK | 0 ligne, libellé de période ; Rapports grisé |
| N3 | 1 | Données S : Contrats et sous-traitants, Afficher le rapport … | visionneuse : titre du modèle, 8 colonnes visibles, lignes K7, pied « Page n|N » |
| N4 | 1 | Situation de C1 : tableau, diagramme, Enregistrer le diagramme … | K13, K14 ; fichier SVG (PNG si CH-10 lot 2 est intégré) ; pied « Créé par … » (E13) |
| N5 | 1 | Avancement A1 | K19, 5 courbes, trous pour l'effectif vide |
| N6 | 1 | … [Ancien document] de l'Echéancier et des Encaissements planifiés | visionneuse, modèle Standard, titres « Echéancier d’encaissements » et « Plan de paiements » |
| N7 | 2 | Vue d'ensemble 2026, ◀ ▶ | K30 ; 2025 vide |
| N8 | 2 | Date d'échéance, jour de référence, tri par affaire | K32, K33 ; tri gardé au rechargement ; passage à « Date de la facture » : même jour, même tri |
| N9 | 2 | Honoraires et frais sur la base de test | K38, K39 ; seuil et détails gardés |
| N10 | 2 | Document « Honoraires et frais » | date du jour en toutes lettres à la place de « 9. Dezember 2021 » |
| N11 | 2 | Facture de S : Document de facturation … [Ancien document], Préférences, décocher les prix, OK | visionneuse redessinée sans prix ; `TEMPLATEPROPERTIES` enregistré (35 valeurs) ; une nouvelle facture sans réglage reprend ce défaut |
| N12 | 2 | Facture de S sans réglage | impression identique à celle d'avant le lot (police Akkurat du modèle Substances, interligne du modèle) |
| N13 | 3 | Contrat 501 : «Nouveau document contrat» | nom proposé = `NAME` ; modèle unique pris sans dialogue ; 7 sections ; K60 à K62 |
| N14 | 3 | Modifier les textes…, fermer, rouvrir | texte modifié conservé ; montants recalculés |
| N15 | 3 | Supprimer le contrat 501 avec un document | refus, message exact ; après « Supprimer le document » : comportement actuel |
| N16 | 3 | Facture de S : Nouveau document de facturation, QR-facture … | K70 ; menu K73 |
| N17 | 3 | Afficher le calcul des honoraires (contrat 501, calcul de base) | offre en visionneuse, champs d'en-tête vides |
| N18 | 3 | Contrôle de factures : panneau « «Nouveau document» » | création et ouverture |
| N19 | 3 | Ré-import `--force` sur la copie | `hfdoc` conservée |
| N20 | 4 | (avec CH-03) Enregistrer sous forme de fichier PDF … | fichier « <nom>.pdf » dans `Invoices/<ID>`, liste rafraîchie |
| N21 | 4 | QR : Nouveau fichier PDF, puis « à la fin de la facture » sur ce PDF, Afficher le fichier PDF | deux fichiers ; bulletin dessiné sur la dernière page ; onglet ouvert |
| N22 | 4 | Controlling ▸ Etablir le document d’analyse … ▸ Partager ▸ Enregistrer le PDF en pièce jointe … | K84 ; PDF dans le dossier de la facture choisie |
| N23 | 4 | Contrat : Importer des fichiers PDF du calcul | copie dans `Contracts/<ID>` |
| N24 | 4 | Fusionner PDF … (facture, QR, pièce jointe) | un PDF fusionné dans le dossier |
| N25 | 4 | Supprimer la facture avec un PDF et sans document | refus, message exact |

---

## 13. Défauts de l'original et écarts assumés

### 13.1 Défauts de l'original (traitement)

| # | Constat [P] | Traitement |
|---|---|---|
| E1 | Monnaie toujours vide à l'écran des encaissements planifiés et reçus (`getValueAt@321-406` teste deux fois la colonne 7) | **corrigé** à l'écran ; document fidèle (juste dans l'original) |
| E2 | Encaissements reçus : « Date d'échéance » visible et toujours vide, « Date de paiement » masquée (masque `100111011`) | **corrigé** (D-CH11-4) |
| E3 | Situation : courbe « Contrat » = solde de fin du premier mois | **corrigé** : montant du contrat |
| E4 | Situation : exception sur un événement sans date (clé `null` d'un `TreeMap`) | **corrigé** : dates vides en premier |
| E5 | Libellés de tri faux (n° 5, 6, 7) et faute « montans » | **reproduits** ; règles de tri exactes |
| E6 | Tri par n° de facture : exception si le second numéro est vide | **corrigé** : vide = `''` |
| E7 | Avancement : contrats refusés comptés ; « NaN » sans contrat | somme **reproduite** ; valeurs non finies vides |
| E8 | `formatTitleBold` jamais enregistré ; interligne 11 après une erreur de lecture | indice 5 **reproduit** ; interligne 14 dans tous les cas |
| E9 | Modèle `managementInvoicePendingReport` du bureau : date figée « 9. Dezember 2021 » | **corrigé** à l'impression (`ch11aFix`) |
| E10 | Facteurs SIA de l'offre imprimés à 2 décimales | **reproduit** |
| E11 | `getVatAmount` lit le taux brut (−1) | **corrigé** (déjà par `feeCond`) |
| E12 | Colonne « Affaire » des contrats = nom du contrat | **reproduit** |
| E13 | Modèle `managementContractsPaymentBalance` (= original 16.05) et pied de `managementInvoiceReport` : « Erstellt von », « Seite » | **traduits** à l'impression (D-CH11-7) |
| E14 | Colonnes 11 et 12 de la liste de factures en type `all` : exception (`before(null)`) | vides [C] (masquées à l'écran et dans le modèle) |
| E15 | Anciens documents : en-têtes propres à chaque page, décalés d'une colonne (contrats, encaissements planifiés), « Vertragsart », colonnes sans en-tête (Contrôle de factures) | **en-têtes de l'écran** (D-CH11-9) |
| E16 | QR : langue par défaut « Deutsch » | « Français » gardé (spec_9 § 13 n° 15) |

### 13.2 Écarts assumés

1. Visionneuse interne (ou celle de CH-03) au lieu des fenêtres de l'original et de l'impression directe actuelle de DeltaSub, anciens documents compris [C].
2. Ordre des monnaies par les seaux d'un `HashMap` Java de 16 cases [C].
3. Dates vides de l'échéancier en dernier (Derby) [D] ; dates vides des listes de factures en premier (comparateur) [P].
4. « Honoraires et frais » : avertissement de tarif sous le tableau (addition DeltaSub) ; tri des affaires par `cmp`.
5. Titre sans orphelin (`setMinimalGap`) non reproduit exactement.
6. Anciens documents Management sans « Paramètres » ni favoris.
7. Offre d'honoraires sans verrou de document (conflit 409 seulement).
8. Pièces jointes du Controlling tirées de l'ancien document actuel, jusqu'à CH-09.
9. Enregistrements `hfdoc` orphelins après la suppression d'une affaire.
10. Ancien document de facture sans réglage : police et interligne du modèle (D-CH11-8) ; polices limitées à ce que `tplFont` sait rendre (Akkurat ou Helvetica, gras déduit du nom).
11. Liste des polices du dialogue « Paramètres » : polices des modèles du bureau, pas celles du système.

---

## 14. Écarts hors chantier signalés (non traités)

- **spec_8 § 6, § 8 et spec_3 § 6** : passages « Facturation.html » périmés depuis D2 ; à corriger (texte seulement) au moment de l'intégration de CH-11.
- **CH-03 (spec_17)** : § 6.5 du panneau générique : le bouton principal doit porter « «<libellé>» » (et non « Nouveau document ») et les entrées de l'appelant ne sont pas toujours précédées d'un séparateur (facture : aucun) ; § 3.3 : le titre du choix de facture est « Sélectionner une facture » **sans suffixe** ; les entrées de `DocumentReportPanel` ont « espace + … » (« Renommer le document … ») [P V11-V13, V23].
- **CH-01 (lot 1)** : mêmes points de suspension (« Renommer le document… », « Enregistrer sous forme de fichier PDF… ») ; « Imprimer… » de sa visionneuse contre « Imprimer » de CH-03 : à harmoniser.
- **`TPL_ROLE`** (anciens modèles) : `projectAddressBuilderConsultantStandby` → rôle 50, alors que 50 = BuilderConsultant et 51 = BuilderConsultantStandby dans `db.ProjectMemberRole$TeamRole` : à vérifier par CH-09 / CH-12 contre le champ DESIGN.
- **`qrPrint`** (jamais appelé) n'applique pas la règle montant / monnaie de l'original : CH-11 ne l'utilise pas (`ch11cQr`), à retirer ou corriger plus tard.
- **`mgPrint`** : format `s` ignoré et `WrappingTextBand` lu dans `b.c` ; sans effet sur CH-11 (non utilisé), à signaler à CH-09.
- **Polices Akkurat** des impressions : alias de CH-03 lot 2 (décision n° 2 de spec_17).
- **Contrôle de factures, Controlling** : l'ancre C1 (menu du Controlling) peut être modifiée par CH-09 ; le `build.py` du lot 4 échoue proprement dans ce cas.

---

## 15. Points d'ancrage DeltaSub

Chaque « ancien » a `grep -F -c` = 1 dans `DeltaSub.html` @ `9c9a3f9` (md5 `b5db7920…`, vérifié pour ce cahier ; T1 : 2 lignes, compte = 1 par `str.count` en Python). Chaque `build.py` prend le chemin du `DeltaSub.html` source en argument (défaut : le dépôt), vérifie chaque ancre (compte = 1, lot pas déjà intégré : 0 occurrence du préfixe du lot) et **échoue proprement** sinon (message, code non nul, aucun fichier écrit) ; aucune réécriture d'un bloc d'un autre chantier ; chaque « nouveau » garde l'« ancien » ou le remplace par une expression qui le contient comme repli.

| # | Lot | Ancre (texte exact) | Modification |
|---|---|---|---|
| A0 | 1-4 | la ligne `   DÉMARRAGE` | code du lot inséré **avant** le commentaire `/* ═══…` qui la contient (convention CH-01, CH-03, CH-17 ; ordre indifférent) |
| N1 | 1 | `['mg-controlling','Controlling'],['mg-planning','Planification RH']` | `['mg-controlling','Controlling'],['mg-contrats','Contrats honoraires'],['mg-planning','Planification RH']` |
| N2 | 2 | `['mg-planning','Planification RH'],['mg-collab','Collaborateurs']` | `['mg-planning','Planification RH'],['mg-factures','Factures'],['mg-collab','Collaborateurs']` (indépendant de N1) |
| T1 | 1 | `  const w=open('','_blank'); if(!w) return;` + retour à la ligne + `  w.document.write(\`<html><head><meta charset="utf-8"><title>${esc(o.title\|\|tplLabel(md))}</title>` (dans `tplPrint`) | `  const w=o.win\|\|open('','_blank'); if(!w) return;` (le reste identique) |
| T2 | 2 | `const md=tplFind(o.cat\|\|'projectTemplates',o.type,o.project);` | `const md=o.md\|\|tplFind(o.cat\|\|'projectTemplates',o.type,o.project);` |
| T3a | 2 | `${r._line?'border-top:'+.5*k+'px solid #000;':''}` (dans `tplTableHTML`) | `${r._line?'border-top:'+(r._lw!=null?r._lw:.5)*k+'px solid '+(r._lc\|\|'#000')+';':''}${r._lb?'border-bottom:'+r._lb.w*k+'px solid '+r._lb.c+';':''}${r._font?'font-family:'+tplFont(r._font)+';'+(/bold\|black\|heavy/i.test(r._font)?'font-weight:700;':''):''}${r._fs?'font-size:'+r._fs*k+'px;':''}` ; sans drapeau, rendu identique |
| T3b | 2 | `` const trs=head?`<tr style="height:${rh}px">${cols.map(c=>cell(c,c.t,'font-weight:600')).join('')}</tr>` `` (début de la ligne) | même ligne avec `style="height:${rh}px;${cols._hl?'border-bottom:'+cols._hl.w*k+'px solid '+cols._hl.c+';':''}"` |
| T4 | 2 | `['_bold','_italic','_color'].forEach(k=>{ if(r[k]) row[k]=r[k]; }); if(q===0&&r._line) row._line=1;` (dans `tplPrint`) | `['_bold','_italic','_color','_font','_fs'].forEach(k=>{ if(r[k]) row[k]=r[k]; }); if(q===0&&r._line){ row._line=1; if(r._lw!=null) row._lw=r._lw; if(r._lc) row._lc=r._lc; } if(q===n-1&&r._lb) row._lb=r._lb;` (**nouvelle ancre** : sans elle, les drapeaux de T3 seraient perdus au découpage des lignes longues) |
| I1 | 2 | la ligne `  return {cover:b(2,true),title:b(4,true),price:b(20,true),unit:b(21,false)}; };` et la ligne `const ivPrintOpts=f=>{ const a=String((f&&f.TEMPLATEPROPERTIES)\|\|'').split(';'), …` et le commentaire au-dessus (`… 20 prix, 21 unités ;`) | indices **21** et **22** ; source `(f&&(f.TEMPLATEPROPERTIES\|\|(typeof ch11bFav==='function'?ch11bFav():'')))\|\|''` ; commentaire « 21 prix, 22 unités (5 : constante « 0 ») » |
| I2 | 2 | `tplOr(()=>tplPrint({type:'projectInvoice',project:p,title:f.NAME\|\|'Facture',cover:O.cover,noHeader:!O.title,ctx:{fields,total:+f.AMOUNT\|\|0,totalHT:invHT(f),totalTVA:invVat(f)},cols,rows,extra,fallback:fb}),fb);` | `if(typeof ch11bOldInvoice==='function') ch11bOldInvoice(f,p,extra,fb); else ` + l'ancien |
| P1 | 3 | `top.append(head,pane); C.append(top,info);` (`ctDomain`) | panneau `Contracts` entre `top` et `info` si `typeof ch11cPanel==='function'` |
| P2 | 3 | `if(bDoc) bDoc.disabled=!c; ctrInfoPanel(info,c,p); };` | + redessin du panneau (variable déclarée avant le premier appel de `upd`) |
| P3 | 3 | `C.append(h('div',{style:{display:'flex',flex:1,minHeight:0}},L.el,top),info);` (`ivDomain`) | panneau `Invoices` sous le tableau |
| P4 | 3 | `bE.disabled=bQ.disabled=bD.disabled=!cur(); if(bP) bP.disabled=!(S.g.view&&S.g.view.length); };` | + redessin |
| P5 | 3 | `R.append(head,pane); drawT();` (`fcPane`) | panneau `Invoices` (« Nouveau document ») |
| P6 | 3 | `const upd=()=>{ const f=cur(); bE.disabled=!f\|\|typeof ivEdit!=='function'; bQ.disabled=!f\|\|typeof qrEdit!=='function'; bD.disabled=!(g.view&&g.view.length); };` | + redessin |
| P7 | 3 | `top.append(h('div',{class:'cols',style:{padding:0,flex:1}},L,R)); C.append(top); drawF(); drawC(); }` (`feDomain`) | panneau `FeeCalculations` sous les listes |
| P8 | 3 | `bCE.disabled=bCD.disabled=!c; bFG.disabled=!fees().length; bCG.disabled=!calcs().length; };` | + redessin |
| D1 | 3 | `if(ctBlocked(c)){ ctMsg('Information','Le contrat ne peut pas être supprimé parce que les paiements ont été saisi.'); return; }` | + `if(typeof ch11cBlockDel==='function'&&ch11cBlockDel('Contracts',c.ID)) return;` |
| D2 | 3 | `async function ivDelete(f0){ const f=f0&&DS.get('projectinvoice',f0.ID); if(!f) return false;` | + `if(typeof ch11cBlockDel==='function'&&ch11cBlockDel('Invoices',f.ID)) return false;` |
| D3 | 3 | `if(DS.by('projectcontract','PROJECTFEECALCULATION_ID',c.ID).length){ feMsg('Cette inscription ne peut pas être supprimée car elle est toujours utilisée dans un contrat.','Avertissement'); return; }` | + refus `FeeCalculations` |
| S1 | 3 | serveur : `             "projecttenderer", "devisdocument", "soumission", "soumissiondoc", "soumissionhist"}` | ligne `PROTECTED \|= {"hfdoc"}` ajoutée après (§ 3.3) ; copie complète + diff |
| Q1 | 4 | `dis(rA,lA,!canApp); dis(mNew,lNew,true); dis(mLast,lLast,true); dis(mPage,lPage,!rA.checked); dis(opn,lO,true);` | règles du § 10.3 (initialisation à la première exécution, puis activation) ; sans `ch11dQrFs`, identique |
| Q2 | 4 | `if(rA.checked&&canApp){ ivPrint(f,false,null,qrPageHTML(bill,{lang:lg.value,sep:sp.value})); return; }` | branche fichiers (§ 10.3) insérée **avant** l'ancien |
| C1 | 4 | `{t:'Etablir le document d’analyse …',fn:()=>ctlPrint(p,t,o)}` | `{t:'Etablir le document d’analyse …',fn:()=>{ if(typeof ch11dCtlCtx==='function') ch11dCtlCtx(p); ctlPrint(p,t,o); }}` (CH-09 peut toucher ce menu : revérifier) |

La version 1 prévoyait une ancre Q3 (infobulles « lot 7 ») : supprimée, les infobulles sont vidées par Q1.

**Crochets** (toujours des déclarations `function`, § 1 n° 40) : `ch11bFav`, `ch11bOldInvoice`, `ch11cPanel`, `ch11cBlockDel`, `ch11dZone`, `ch11dSavePdf`, `ch11dViewOpts`, `ch11dHasPdf`, `ch11dImportCalc`, `ch11dQrFs`, `ch11dQrOut`, `ch11dCtlCtx`.

**À ne pas modifier** : `mgPrint`, `mgRF*`, `plModelDoc` (CH-09, Planification RH), `svDpFind` (EC-1), `ch01a*` (CH-01), `ch03*` (CH-03), `DOMAINS`, `domainUsed`, `domainView` (CH-10, CH-05), `qrPrint`, `delProject` (CH-17).

**Préfixes** : `ch11a` … `ch11d` / `CH11A` … `CH11D` ; collection `hfdoc` ; clés `ds_mg_contrats`, `ds_mg_factures`, `ds_mg_inv_*`, `ds_inv_tplprops`, `ds_qr_gen`, `ds_qr_open` ; vues `mg-contrats`, `mg-factures`. Vérifié le 30.09.2026 14 h : 0 occurrence dans `DeltaSub.html`, `serveur_deltasub.py` et les `.js`, `.py`, `.html` de `ch/*/` hors CH-11 ; chaque `build.py` refait la vérification (source + `scratchpad/ch/*/*.js`).

---

## 16. Plan en lots

| Lot | Titre | Préfixe | Dépend de |
|---|---|---|---|
| 1 | Socle CH-11 et Management ▸ Contrats honoraires | `ch11a` / `CH11A` | — (utilise CH-01 lot 1 et CH-03 lot 2 s'ils sont intégrés, `typeof`) |
| 2 | Management ▸ Factures et Paramètres de l'ancien document de facture | `ch11b` / `CH11B` | lot 1 |
| 3 | Documents d'objet `.dpdoc` : Offre, Contrat, Facture | `ch11c` / `CH11C` | lot 1 ; **CH-01 lot 1 intégré avant** |
| 4 | PDF stockés, QR-facture, fusion, pièces jointes, import | `ch11d` / `CH11D` | lots 2 et 3 ; **CH-03 lots 1 à 3** (sinon entrées grisées, aucune écriture de fichier) |

Chaque lot livre dans `ch/CH-11/lotN/` : `ch11x.js` (déclarations de haut niveau, aucun accès au DOM au chargement, aucune redéclaration), `lotN_test.js` (jsc), `lotN_integration.md` (ancres « ancien → nouveau »), `build.py <DeltaSub.html source>` (et `build_serveur.py` au lot 3), le contrôle de syntaxe du script complet (`jsc -e "new Function(readFile('f.js'))"`) et le compte rendu de l'essai navigateur.

### Lot 1 — Socle CH-11 et Management ▸ Contrats honoraires (préfixe `ch11a` / `CH11A`)

- **Socle** (§ 4) : `ch11aRF`, `ch11aRFdesc`, `ch11aRFin`, `ch11aRFst`, `ch11aJs`, `ch11aHm`, `ch11aAff`, `CH11A_FMT`, `ch11aFlat`, `ch11aFix` (E9, E13), `ch11aReport`, `ch11aHTML`, `ch11aView` (délègue à `ch03bView`), `ch11aWin`, `ch11aOld` (titres et champs du § 4.8), `ch11aChart`, correspondance des styles de ligne.
- **Écrans** (§ 5) : `CH11A_CATS`, `CH11A` (états de session par fenêtre), `ch11aPane`, fonctions pures `ch11aContracts`, `ch11aSched`, `ch11aPays`, `ch11aBal` (+ données du diagramme), `ch11aPerf` ; `VIEWS['mg-contrats']`.
- **Documents** : 6 `.dpdoc` du jeu 0 et 5 anciens documents (§ 4.8, § 7.1).
- **Ancres** : A0, N1, T1.
- **Tests** : K1-K26 (jsc) ; N1-N6 (navigateur).

### Lot 2 — Management ▸ Factures et Paramètres de l'ancien document de facture (préfixe `ch11b` / `CH11B`)

- **Écrans** (§ 6) : `CH11B_CATS`, `CH11B`, `ch11bPane`, fonctions pures `ch11bYear`, `ch11bByState`, `ch11bByDate`, `ch11bSort`, `ch11bList`, `ch11bPending` ; `VIEWS['mg-factures']` ; 3 `.dpdoc` (E9, E13) et 2 anciens documents.
- **Paramètres** (§ 9) : `CH11B_TP` (35 réglages), `ch11bJd`, `ch11bEncode`, `ch11bDecode`, `ch11bSrc`, `ch11bFav` (`function`), `ch11bModel`, `ch11bRows`, `ch11bCols`, `ch11bOldInvoice` (`function`, visionneuse « Facture »), `ch11bParams` (« Paramètres »), `ch11bTplChooser` (« Choix du modèle »).
- **Ancres** : A0, N2, T2, T3a, T3b, T4, I1, I2.
- **Tests** : K30-K52 ; N7-N12.

### Lot 3 — Documents d'objet `.dpdoc` : Offre d'honoraires, Contrat d'honoraires, Facture (préfixe `ch11c` / `CH11C`)

- **Collection `hfdoc`** (`CH11C_T`, § 3.2) et ligne serveur S1 (§ 3.3).
- **Panneau** `ch11cPanel` (`function`), cycle de vie `ch11cNew`, `ch11cOpen`, `ch11cRename`, `ch11cErase`, `ch11cTexts` (via `ch01aTexts` avec `save`) (§ 8) ; crochets lot 4 appelés par `typeof`.
- **Jobs** : `ch11cFeeJob`, `ch11cContractJob`, `ch11cInvoiceJob` ; tableaux `ch11cCondRows`, `ch11cItemRows`, `ch11cPosRows`, `ch11cInvoicesRows`, `ch11cPayRows` (réutilise `ch11aPays`) ; `ch11cMembers` (rôles 8, 1, 2, 4, 51) ; formats d'affaire manquants (§ 7.2 à 7.6).
- **Entrées propres** : `ch11cQr` (« QR-facture … »), `ch11cShowCalc` (« Afficher le calcul des honoraires ») ; « Importer des fichiers PDF du calcul » grisée tant que `ch11dImportCalc` manque.
- **Refus** : `ch11cBlockDel` (`function`, § 8.5).
- **Ancres** : A0, P1-P8, D1-D3, S1 (serveur : copie complète + diff).
- **Tests** : K60-K75 ; N13-N19.

### Lot 4 — PDF stockés, QR-facture, fusion, pièces jointes, import (préfixe `ch11d` / `CH11D`)

- **Au moment d'écrire le lot** : relire `research/spec_17_fichiers_pdf.md` (§ 3, § 6) et `ch/CH-03/lot*/ch03*.js` ; ajuster les appels du § 10.1 aux signatures réelles ; appliquer CH-03 dans la copie de test s'il est disponible.
- **Contenu** : crochets `ch11dZone`, `ch11dSavePdf`, `ch11dViewOpts`, `ch11dHasPdf` (panneaux, § 10.2) ; QR `ch11dQrFs`, `ch11dQrOut`, `ch11dQrHtml`, `ch11dQrCalque` (§ 10.3) ; pièces jointes `ch11dCtlCtx`, `ch11dPickInvoice` (§ 10.5) ; `ch11dImportCalc` ; `ch11dShare` (§ 10.6). Toutes les fonctions appelées depuis une ancre ou un autre lot sont des `function`.
- **Ancres** : A0, Q1, Q2, C1.
- **Tests** : K80-K87 ; N20-N25 (N20-N25 seulement si CH-03 est disponible ; sinon K87 et vérification des entrées grisées).

### Non livré (et pourquoi)

| Élément | Raison |
|---|---|
| Renommage « Offres d'honoraires » | fait par CH-10 lot 1 (§ 1 n° 21) |
| Paramètres et favoris des anciens documents Management | P3, double emploi avec les `.dpdoc` ; aucun usage possible au bureau (pas de licence) |
| Verrou de document de l'offre | le verrou de CH-10 lot 3 ne couvre que les documents Bâtiment ; conflit 409 en attendant (§ 1 n° 36) |
| Partage, « Afficher le dossier », import de PDF du poste | génériques de CH-03 (« Afficher le dossier » : non livré par CH-03) |
| Rapports du Controlling au nouveau format comme pièces jointes | CH-09 |
| Signature de l'offre | CH-08 lot 3 (aucun dossier de signatures au bureau) |
| Éditeur complet des documents | CH-14 |
| Coloriage du document « Honoraires et frais » | réservé aux comptes de développement de l'original |
| Tout le lot 4 sans CH-03 | entrées grisées (`typeof`), aucune écriture de fichier |

---

## 17. Décisions restantes pour Paulo

| # | Question | Proposition (appliquée par défaut) |
|---|---|---|
| D-CH11-1 | Nom du domaine d'affaire « Offres d'honoraires » ou « Calcul des honoraires » ? | tranché dans CH-10 (D-10.2) : « Offres d'honoraires » ; CH-11 n'y touche pas |
| D-CH11-2 | Modèles Management ▸ Factures : ceux de la base du bureau (anciennes copies : titres « Sommaire », « Listes des factures », « Honoraires et frais facturables ») ou les originaux 16.05 ? | modèles du bureau, avec correction de la date figée « 9. Dezember 2021 » |
| D-CH11-3 | Le dernier réglage de l'ancien document de facture devient le défaut des factures sans réglage, **par poste** (comme l'original) ? | oui (`localStorage`) |
| D-CH11-4 | Défauts d'affichage de l'original (monnaie vide, colonne « Date d'échéance » vide des encaissements reçus, courbe « Contrat » fausse) : corriger ou reproduire ? | corriger à l'écran ; libellés de tri faux et faute « montans » gardés |
| D-CH11-5 | « Honoraires et frais » montrera environ 49 814 h et 518 754 CHF « facturables » (plus 27 586 CHF de frais) parce que le statut « Facturé » n'est pas tenu dans DeltaSub : ajouter un bandeau d'avertissement ? | non (fidélité) ; seul l'avertissement de tarif, comme au Controlling |
| D-CH11-6 | Ancien document de facture : visionneuse avec « Préférences » (comme l'original) au lieu de l'impression directe actuelle ? | oui |
| D-CH11-7 | Textes allemands « Erstellt von » / « Seite » dans les pieds de page de la Situation des encaissements (modèle identique à l'original) et de la Vue d'ensemble : traduire à l'impression ? | oui : « Créé par » / « Page » |
| D-CH11-8 | Ancien document de facture sans réglage : garder la police et l'interligne du modèle du bureau (Akkurat, comme aujourd'hui) ou appliquer les défauts de l'original (Arial 9, interligne 14) ? | garder ceux du modèle ; les défauts de l'original ne servent qu'aux autres réglages |
| D-CH11-9 | Anciens documents Management : en-têtes de colonnes de l'original (décalés d'une colonne, « Vertragsart ») ou ceux de l'écran ? | ceux de l'écran |

---

## Annexe A — Journal des changements par rapport à la version 1 (12 h 35)

| # | Point | Version 1 | Version 2 | Preuve |
|---|---|---|---|---|
| 1 | Séparateur avant « QR-facture … » | « séparateur puis » | **aucun** | V23 |
| 2 | Bouton principal sans document | libellé de création | **« «libellé» »** | V11 |
| 3 | Points de suspension | « … » collé | « espace + … » | V12 |
| 4 | Solde à encaisser de « Honoraires et frais » | « Contrats vide = 0 » | **vide** si Contrats vide | V2 |
| 5 | Titres des anciens documents | libellé de la catégorie | « Plan de paiements », « Plan d’ordres de paiements », « Contract - paiements »… | V18 |
| 6 | Champs `timespace` / `reportFilter` des anciens documents | libellé du filtre / statut | détail du § 4.8 (année, « Jour de référence: … ») | bytecode `InvoiceControl`, `*Page.fill` |
| 7 | Textes allemands de la Situation | non traités | traduits (E13, D-CH11-7) | annexe A de rech_orig |
| 8 | Libellé « Offres d'honoraires » | CH-10 lot 4 | CH-10 **lot 1** | spec_19 |
| 9 | Interface CH-03 | minimale, supposée | celle de `spec_17` § 3 (table § 10.1) | spec_17 |
| 10 | Panneau Documents | `ch11cPanel` complet | `ch11cPanel` + `ch03cPdfZone` au lot 4 ; crochets `ch11d*` | § 1 n° 34 |
| 11 | Visionneuse | `ch11aView` seule | délègue à `ch03bView` | § 1 n° 35 |
| 12 | Drapeaux de ligne de `tplPrint` | T3 seule | **T4 ajoutée** (propagation au découpage) | code `tplPrint` |
| 13 | Police de l'ancien document sans réglage | défauts de l'original appliqués | modèle inchangé (D-CH11-8) | CLAUDE.md règle 4, modèle Substances |
| 14 | Tailles et polices du dialogue « Paramètres » | liste libre | tailles 6 à 12 ; polices des modèles | `PreferencesDialog.<init>@820-1091` |
| 15 | QR : ancres | Q1-Q3 | Q1, Q2 (défauts de l'original à la première exécution) | V7 |
| 16 | Rôles du contrat | 4 et 51 | confirmés (51 = BuilderConsultantStandby) | `TeamRole.<clinit>` |
| 17 | `typeof` et zone morte | — | crochets en `function` | § 1 n° 40 |
| 18 | Contrôles | K1-K61 | K1-K26, K30-K52, K60-K75, K80-K87 (T15-T21 ajoutés) | rech_orig § 15.2 |
| 19 | Verrou de l'offre | « CH-03 (verrou) » | non livré (CH-10 lot 3 = Bâtiment seulement) | spec_19 § 4.10 |
| 20 | Pièce jointe du Controlling | entrée de menu propre | contexte `ch03bContexte` avant `ctlPrint` (visionneuse CH-03, comme l'original) | spec_17 § 3.5 |

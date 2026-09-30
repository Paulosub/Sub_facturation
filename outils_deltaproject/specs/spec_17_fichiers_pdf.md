# Cahier des charges — CH-03 « Socle documents : stockage des fichiers, PDF enregistrés, visionneuse, partage et fusion »

Version du rédacteur critique, 30.09.2026. Ce cahier décrit comment doter `DeltaSub.html` et `serveur_deltasub.py` du **socle documents** de Deltaproject 16.05 :
- un **dépôt de fichiers** par objet (facture, contrat, calcul, document d'affaire, dossier du contrôle des coûts, devis général, eCCC, Soumission), servi par `/api/file` ;
- la **génération de vrais PDF** sur le Mac Studio, sans Internet et sans rien installer, avec **fusion** et **superposition** (QR-facture sur la dernière page) ;
- une **visionneuse commune** qui remplace les 24 fenêtres d'impression surgissantes ;
- le **panneau « Document »** générique et sa liste **« Fichiers PDF »** (ouvrir, partager, importer, fusionner, supprimer), que CH-11 (facturation) instanciera quatre fois ;
- le **partage** (téléchargement puis message `mailto:`, décision D8) ;
- le branchement sur les documents du contrôle des coûts (CH-01), l'écran des annexes de contrat et l'outil de reprise des fichiers (D12, jamais lancé sur la base du bureau).

Il confronte les deux recherches du chantier (`ch/CH-03/rech_orig.md`, `ch/CH-03/rech_exist.md`), la fiche CH-03, la matrice et le § 16 de l'inventaire (`research/inv/inventaire_modules.md`), ainsi que les cahiers voisins en cours (spec_14 = CH-01, spec_15 = CH-02, recherches de CH-10 et CH-11). Chaque point contesté a été revérifié à la source pour ce cahier (§ 1), et les choix techniques ont été **mesurés** sur ce Mac Studio (§ 5).

**Conventions**
- **[P] PROUVÉ** : bytecode `Classe.méthode@offset` (désassemblages dans `ch/CH-03/jp/`, outils `ch/CH-03/jp.sh`, `jpv.sh`), libellé `Strings.db (classe|id)`, données de la copie de base `dstest/deltasub.sqlite`, fichiers du bureau lus sans écriture, **mesure** faite pour ce cahier (fichiers de travail dans `ch/CH-03/spec_work/`).
- **[D] DÉDUIT** : interprétation cohérente, non démontrée ligne à ligne.
- **[C] CHOIX** : décision de conception pour DeltaSub, signalée à Paulo (§ 9 et § 13).
- `ui.` = `doc.ui.`, `files.` = `doc.ui.files.`, `cc.` = `deltaproject.costcontrol.`.

**Références DeltaSub.** `DeltaSub.html` du dépôt au 30.09.2026 13 h 40 : 14 324 lignes, md5 `fe6d02dbb00fb1a653086b3599563c2c`, commit `b50edc6` (la première rédaction s'appuyait sur `a0165c9`, md5 `866e3ea8…` ; toutes les ancres ont été recontrôlées sur la nouvelle version). `serveur_deltasub.py` : 431 lignes, md5 `20c0933d385f03f71d47e51202d03c3c`. Le fichier change pendant le travail des chantiers parallèles : **seules les ancres textuelles du § 11 font foi**, les numéros de ligne sont indicatifs. CH-01 lot 1 : `ch/CH-01/lot1.js` du 30.09.2026 12 h 24 (md5 `b5f4736e4d2ad2ff964cf62ff2416a7a`), non encore intégré. Cahiers voisins lus pour la cohérence : spec_15 (CH-02), spec_16 (CH-11, écrit contre ce cahier), spec_18 (CH-08), spec_19 (CH-10).

**Choix déjà arrêtés** (repris tels quels) :
- **D8** : aucun envoi automatique de courriel. « Partager » = téléchargement du PDF (ou enregistrement dans le dépôt), puis ouverture d'un message `mailto:`.
- **D12** : pas de reprise en masse des fichiers de Deltaproject dans cette vague. Un outil de reprise est écrit et testé sur une base d'essai, **jamais lancé sur la base du bureau**.
- Stockage sur le **disque local du Mac Studio, à côté de la base** (dossier dérivé de `DB_PATH`, donc isolé pour une base d'essai `DELTASUB_DB`), accès réseau local seulement, limites de taille, noms de fichiers sûrs, collection de métadonnées **protégée au ré-import**.
- Génération des PDF sans Internet à l'exécution et sans rien installer sur le Mac.

**Aucune donnée personnelle** : identifiants (affaire, document, contrat, facture, utilisateur technique), compteurs, tailles, nombres de pages, empreintes tronquées et libellés d'interface seulement. Les copies de PDF du bureau faites pour les mesures ont été supprimées. **Aucun contenu CRB.**

---

## 0. Synthèse

1. **Dépôt adressé par contenu, rangé comme Deltaproject** [C]. Les octets vont dans `dirname(DB_PATH)/fichiers/objets/<2 premiers>/<sha256>` (noms de fichiers toujours sûrs, déduplication gratuite). L'arborescence visible est une **collection DeltaSub `depotfichier`** : un enregistrement par fichier, identifiant `<dossier>/<nom>`, où `<dossier>` reprend **exactement les chemins de `DELTAprojectFiles`** (`ProjectDocuments/Documents/<P>/Invoices/<id>`, `Construction/Costcontrol/<P>/<D>/coco/award/contractSheet_…`). La reprise est alors un simple recopiage, et les autres postes voient les changements en 4 s par `/api/changes`.
2. **La duplication est massive au bureau** [P, mesure] : les 152 PDF de l'état courant (139 du contrôle des coûts, 13 du devis) n'ont que **48 contenus distincts** (3,17 Mo). Un groupe de 14 copies identiques vient des 14 contrôles des coûts d'une même affaire. La recherche sur l'existant annonçait « 11 doublons » : c'est faux.
3. **PDF générés par le Chrome déjà installé sur le Mac Studio** [P, mesure] : `--headless --print-to-pdf` produit un PDF fidèle en **0,43 à 0,65 s**, `@page` et boîtes de marge compris. Scripts, réseau et fichiers locaux sont coupés par une politique CSP insérée **juste après le doctype** (et non après `<head>` : un `iframe` placé avant `<head>` imprimait alors un fichier du Mac Studio dans le PDF, mesure § 5.3) ; les `meta refresh` sont retirés. Le processus ne se termine pas seul : le serveur l'arrête dès que le fichier est complet. Si Chrome manque, **repli** : impression du navigateur, puis « Import fichier PDF… ».
4. **Fusion et superposition par les frameworks de macOS** [P, mesure] : PDFKit et Quartz, pilotés par `osascript -l JavaScript` (JXA), fusionnent 13 + 13 pages en 26 pages en 0,14 s et mêlent PDF 1.4 et PDF 1.7 à flux d'objets (2 + 10 = 12 pages). Ils posent aussi la QR-facture **sur la dernière page** d'une facture en gardant le format A4 et le texte vectoriel, **sans rien masquer**, comme l'original (section 210 × 110 mm dessinée par-dessus, fond transparent : bytecode et mesure, § 1 n° 21). Rien à installer, bibliothèque standard de Python seulement.
5. **L'Akkurat revient dans les impressions** [P, mesure] : les moteurs demandent `'Akkurat LL'`, `'AkkuratLL-Light'` ou `'Akkurat'`, alors que les polices du bureau s'appellent « Akkurat LL TT ». Des règles `@font-face { src: local('AkkuratLLTT-…') }` injectées par la visionneuse suffisent : le PDF embarque AkkuratLLTT-Regular, -Light et -Bold, et le navigateur les charge aussi. **À valider par Paulo** (décision n° 2) : toutes les impressions changent de police, de Helvetica Neue vers l'Akkurat du bureau.
6. **Visionneuse commune** [P + C]. Toute fenêtre d'impression `open('','_blank')` (24 appels, et ceux des chantiers à venir) est interceptée par une **fausse fenêtre** qui capte le document, puis l'affiche dans une visionneuse interne. Celle-ci offre « Imprimer », le zoom (125 % par défaut, comme l'original), **PDF** (« Ouvrir dans l'aperçu », « Sauvegarder et ouvrir ») et **Partager** (« Enregistrer le PDF en pièce jointe… », « Partager le fichier PDF… »). Il n'y a **plus de fenêtre bloquée** (aujourd'hui `tplPrint` et `mgPrint` échouent en silence). Il faut un clic de plus pour imprimer (décision n° 1).
7. **Panneau « Document » générique et zone « Fichiers PDF »** [P `files.DocumentReportPanel`] : mêmes menus, mêmes règles d'activation, mêmes messages que l'original. CH-11 les instancie pour la facture, le contrat, le calcul et le contrôle de factures. CH-01 et CH-02 y branchent leurs panneaux existants.
8. **Partage selon D8** [P + C] : les dialogues « Partager le fichier PDF » (aperçu et fichiers enregistrés) gardent les champs de l'original (À et ses suggestions, Civilité, Concerne, Contenu et ses blocs de texte, Pièce jointe). « Enregistrer » **télécharge** le PDF ; « Préparer le courrier » ouvre un `mailto:` construit comme l'original (`platform.Mail`), défaut de l'original corrigé (§ 9). « Utiliser Apple Mail » est retiré : un script lancé par le serveur ouvrirait Mail **sur le Mac Studio**, pas sur le poste.
9. **Interface figée pour les autres chantiers** (§ 3) : 8 routes HTTP, les fonctions `ch03a…` (dépôt), `ch03b…` (visionneuse, PDF), `ch03c…` (panneau, dialogues). CH-11 peut coder dès maintenant contre elles, en les gardant par `typeof`.
10. **Retirés du chantier** [P] : le **verrou généralisé** va à CH-10 lot 3, qui le spécifie déjà (spec_19 § 4.10 : collection `documentlock`, dialogue « Document verrouillé », droit 100,0, sans modifier le serveur). La **corbeille Bâtiment** n'est pas dans CH-10 : elle existe déjà dans l'eCCC et la Soumission, CH-02 lot 4 la fait pour le devis (spec_15 § 1 n° 17), et CH-07 lot 3 (liste et domaine d'affaire) doit la faire pour le contrôle des coûts, qui marque aujourd'hui en un seul temps, sans restauration. « Confirmer l'envoi… » va à CH-13. La note d'expédition existe déjà dans la Soumission, seul appelant avec les Documents d'affaire. Six libellés de la fiche sont **orphelins** (aucun écran ne les charge) : « Archiver », « Exporte le contenu vers un fichier », « Envoyer un courriel », « Créer un document PDF », « Editer les favoris », « Partager le PDF et cacheter le document ».
11. **Annexes du contrôle des coûts** : les 208 annexes de contrat sont des **références** vers `01-AFFAIRES`, pas des copies. Elles deviennent visibles dans la fiche du contrat (« Annexes: n », dialogue « Document »). « Ouvrir l'annexe » passe par une route en **lecture seule**, désactivée tant que Paulo n'a pas autorisé la racine (décision n° 5).
12. **Plan : 4 lots** (§ 12). Lot 1 `ch03a` : serveur de fichiers et de PDF, API du dépôt. Lot 2 `ch03b` : visionneuse, interception, PDF et pièces jointes, polices. Lot 3 `ch03c` : panneau générique, liste des PDF, import, fusion, partage. Lot 4 `ch03d` : branchement du contrôle des coûts (CH-01), annexes de contrat, outil de reprise. Le lot 1 contient **toutes** les modifications du serveur (une seule copie et un seul diff).

---

## 1. Arbitrages entre les sources (tranchés à la source)

| # | Sujet | Positions divergentes | Verdict | Preuve |
|---|---|---|---|---|
| 1 | Point d'accès | `/api/file` (fiche, spec_11, spec_12) ; `/api/files` (spec_9 lot 7) | **`/api/file`** pour les fichiers, **`/api/pdf`** pour la génération. spec_9 § 10.5 est à lire avec ce nom | [C] |
| 2 | Racine et clé du dépôt | `fichiers/soumission/<id>/` (spec_11), `fichiers/costplanning/<ID>/` (spec_12), `documents/<PROJECT_ID>/Invoices/<ID>` (spec_9) | **Contenus** dans `dirname(DB_PATH)/fichiers/objets/`, **arborescence logique** = chemins relatifs de `DELTAprojectFiles` (§ 4.3). Les trois propositions sont remplacées | [C] ; chemins [P `app.doc.Settings$ProjectDocumentType.getPath`, `db.ProjectInvoice.getDocumentsPath@0-15`, `deltabauad.settings.*Filenames`] ; [P dossiers du bureau `ProjectDocuments/Documents/911/Documents/151/151.dpdoc`, `Construction/Costcontrol/1401/2601/coco/award/contractSheet_7554_2/Contrat.pdf`] |
| 3 | Métadonnées des PDF | `soumissiondoc.pdf = {nom, date, taille}` (spec_11) ; rien dans `cocodoc` ni `costestimatedpdoc` | **Une collection commune `depotfichier`** (§ 4.2), protégée au ré-import. `soumissiondoc.pdf` devient redondant : EC-1 lot 4 lira le dépôt | [C] |
| 4 | Caractères interdits (3 listes dans DeltaSub) | `ecDocsPanel` : `" * / : ; < > ? \|` ; `svdDocNameDlg` et spec_14 : `\ / : * ? " < > \|` | **Deux règles de l'original, toutes deux prouvées.** (a) Dialogues génériques (`util.swing.FileNameGuard`) : `< > : " / \| \ ? *` **retirés à la frappe**, 64 caractères, insertion refusée en entier au-delà (bip). (b) Bâtiment (`deltabauad.util.Files.isBlackListCharacter`) : `" * / : ; < > ? \|` refusés à l'OK, message « Le caractère ^0 ne doit pas être utilisé dans le nom du fichier. » (Erreur). Les listes de DeltaSub sont justes dans leur contexte, sauf `svdDocNameDlg` : `devis18.posedit.DocNameDialog` applique la règle Bâtiment (signalé à EC-1, § 10) | [P `FileNameGuard.<clinit>` (60, 62, 58, 34, 47, 124, 92, 63, 42), `insertString@0-90`, `<init>@5 bipush 64` ; `Files.isBlackListCharacter@15 lookupswitch` (34, 42, 47, 58, 59, 60, 62, 63, 124) ; appelants : `KvDialog`, `ElementDocumentsFrame`, `costplanning.element.DocNameDialog`, `devis18.posedit.DocNameDialog`, `PayementDocumentsFrame`, `ContractBookDialog`] |
| 5 | Choix du jeu de modèles | `svDpFind`, `plModelDoc`, spec_14 | **CH-01 § 4.4 fait foi.** La visionneuse ne choisit pas de modèle : le choix a lieu avant l'ouverture | [P `Reports.getProjectTemplateFile@1-48`, rech_orig § 3.3] |
| 6 | Verrou des documents | coopératif dans l'en-tête (spec_11, livré) ; `/api/lock` sur la table `lock` (spec_12) ; 409 seul (spec_4, spec_9, spec_15) ; fiche CH-03 lot 6 ; CH-10 lot 3 « protection, déverrouillage » | **Retiré de CH-03, confié à CH-10 lot 3**, qui le spécifie : collection `documentlock`, dialogue « Document verrouillé », confirmation `msg1a`/`msg1b`, droit 100,0, levée à la fermeture (`pagehide`), sans toucher au serveur. Deux verrous concurrents seraient pires qu'aucun. CH-03 n'utilise pas la table `lock`. Le verrou de l'offre d'honoraires, que spec_16 attribue à « CH-03 (verrou) », doit s'appuyer sur `ch10cGate` / `ch10cAcquire` (§ 10) | [C] ; [P spec_19 § 4.10, lot 3 ; spec_16 § 2.3 et § 16 « Non livré »] |
| 7 | Note d'expédition « généralisée » (fiche, inventaire C4) | à généraliser ; spec_14 : inexistante au contrôle des coûts | **Rien à faire dans CH-03.** Seul appelant 16.05 de `deltabauad.util.MailingInfoDialog` : la liste des soumissionnaires (déjà dans DeltaSub, `svDlgMailing`). « Confirmer l'envoi… » (`ProjectDocumentSealDialog`) n'est appelé que par `ProjectDocumentFrame` : CH-13 | [P recherche binaire : `deltabauad/util/MailingInfoDialog` référencé seulement par `devis18/TendererDocumentsFrame.class` ; `ProjectDocumentSealDialog` seulement par `project/ProjectDocumentFrame.class`] |
| 8 | « Archiver », « Exporte le contenu vers un fichier », « Envoyer un courriel », « Créer un document PDF », « Editer les favoris », « Partager le PDF et cacheter le document », « Document sigillé » | fiche : à reproduire | **Libellés orphelins**, aucune classe 16.05 ne les charge. Non reproduits | [P recherche binaire de `sharePdfAndSeal` : 0 classe ; `viewer.Viewer\|archiveT…` absents des jars] |
| 9 | « Enregistrer le PDF comme annexe » ; « Créer un PDF » (fiche) | — | **« Enregistrer le PDF en pièce jointe… »** ; « Créer un PDF » = **« Ouvrir dans l'aperçu »** et **« Sauvegarder et ouvrir »** | [S `Viewer\|attachPdf`, `previewPdf`, `saveAndPreviewPdf`] |
| 10 | « Enregistrer sous forme de fichier PDF… » | rech_orig : en-tête « Créer un fichier PDF à partir du document : <nom> » | **En-tête « Créer un fichier PDF à partir du document »**, **nom proposé `<nom du document>.pdf`** | [P `DocumentReportPanel.saveDocumentAsPdf@20-50` : titre = `generatePdfTitle` seul ; nom = recette n° 1 « \u0001.pdf » sur `getDocumentName`] |
| 11 | Nom proposé par « Enregistrer le PDF en pièce jointe… » | non établi | **Vide** | [P `Viewer.attachPdf(FileGroup)@10-20` : `ldc ""` passé comme nom] |
| 12 | « Nom du fichier » de « Partager le fichier PDF » (aperçu) | FileNameGuard supposé | **128 caractères, aucun filtre** (`LengthGuard`) | [P `SharePdfDialog.<init>@368-375` : `new LengthGuard(sipush 128)`] |
| 13 | Ordre de la liste « Fichiers PDF » | « par nom » | **`String.compareTo` du nom** : sensible à la casse, ordre des codes (majuscules avant minuscules, lettres accentuées après « z ») | [P `files.File.compareTo@26-28`, `getFileList@116 Collections.sort`] |
| 14 | Doublons de PDF | « 11 des 139 PDF courants ont un doublon exact » | **139 PDF du contrôle des coûts = 42 contenus distincts (97 copies)** ; devis 13 = 6 ; total **152 = 48 contenus, 3 174 502 o** | [P sha256 du dossier vivant et de la sauvegarde du 28.09.2026 : même résultat] |
| 15 | Construction du `mailto:` | « À, Subject, Body, URL-encodage » | `mailto:` + `urlEncode(À)` (ou « %20 » si vide) + `?Subject=…` si Concerne non vide + **`&Body=…`** si texte non vide. `urlEncode` = `URLEncoder` UTF-8 puis « + » → « %20 ». **Défaut** : Concerne vide et texte présent donnent `mailto:x&Body=…`, que les messageries lisent mal. DeltaSub corrige (§ 9) | [P `platform.Mail.composeNewMailMessage@14-117`, `urlEncode@4-11`] |
| 16 | Texte du message | « Civilité + ligne vide + Contenu » | `addText(Civilité)` puis `addText(Contenu)` : chaque partie non vide est précédée d'un saut de ligne si le texte n'est pas vide, puis suivie d'un saut de ligne. Résultat `Civilité\n\nContenu\n` | [P `SharePdfDialog.addText@0-40`, `composeEmail@0-29`] |
| 17 | Où fabriquer le PDF (O2, à trancher avec D4) | impression du navigateur ; bibliothèque JS ; côté serveur (Chrome disponible ?) | **Côté serveur, par le Chrome déjà installé**, avec repli sur l'impression du navigateur. Mesures au § 5.1 | [P mesures `spec_work/`] |
| 18 | D8 : Apple Mail par le serveur | proposé par l'inventaire | **Écarté** : Mail s'ouvrirait sur le Mac Studio, pas sur le poste. `.eml` brouillon : non livré, décision n° 3 | [D] |
| 19 | Police des impressions | aucun cahier | **Alias `@font-face local()`** injecté par la visionneuse | [P mesure : PDF avec `AkkuratLLTT-Regular/-Light/-Bold` ; sans alias, `Helvetica` ; onglet : faces `Akkurat 400/700 loaded`] |
| 20 | `.dpdoc` et données figées | — | `data.json` vaut `{}` au bureau : **le PDF est la seule trace figée** d'un document. Un PDF enregistré ne se régénère pas tout seul | [P rech_orig § 1.3] |
| 21 | QR-facture « à la fin de la facture » : format et masquage | première rédaction de ce cahier : calque A4 à section de 105 mm **opaque** (fond blanc) qui masque le bas de la page ; spec_16 § 10.3 : « format forcé 210 × 110 mm », aucun contrôle de place | **spec_16 a raison.** `appendBillOnly` force `OutputSize.QR_BILL_EXTRA_SPACE` (210 × 110 mm, trait et ciseaux compris) et dessine en mode `APPEND` sur la dernière page (`-1`), ou sur une **nouvelle page A4** 595,2756 × 841,8898 pt ajoutée à la fin (`-2`). `BillLayout` ne remplit aucun fond (seul `drawScissorsBlade` appelle `fillPath`) : **rien n'est masqué**, ce qui se trouvait dans les 110 mm du bas reste visible sous la section. Le calque de CH-11 a donc un **fond transparent** ; mesuré : Chrome ne peint aucun fond de page, et après superposition le fond de la page de base reste visible en bas de page | [P `deltaproject.qrbill.QRBill.appendBillOnly@0-97` (désassemblage `ch/CH-11/dis/QRBill.txt`) ; `qrInvoice.jar` : `qrbill.canvas.PDFCanvas.preparePage` (`-2` → `new PDPage(595.2756f, 841.8898f)`, `OVERWRITE` ; `-1` → dernière page, `APPEND`), `qrbill.generator.BillLayout` (désassemblages `ch/CH-03/spec_work/qrlib/`)] ; [P mesure `spec_work/qrt/` : base à fond rouge + calque transparent → pixels à 20 %, 80 % et 95 % de la hauteur restés rouges (187, 38, 26)] |
| 22 | Où insérer la politique CSP du HTML envoyé à `/api/pdf` | première rédaction : « juste après `<head>`, sinon après le doctype, sinon au début » | **Juste après le doctype de tête** (s'il ouvre le document, après BOM, espaces et commentaires), **sinon tout au début** ; ne jamais chercher `<head>`. Retirer aussi toute balise `<meta … http-equiv=refresh …>` | [P mesure `spec_work/sec/` : `iframe src=file://…/temoin.txt` placé **avant** `<head>`, CSP après `<head>` → le texte témoin est **imprimé dans le PDF** ; même document, CSP après le doctype → absent ; `meta refresh` vers `file://` → Chrome quitte sans écrire de PDF (code 0)]. Le HTML vient de n'importe quel poste du réseau, et Chrome l'ouvre en `file://` sur le Mac Studio : sans cette règle, n'importe quel fichier lisible du Mac Studio (base, clés) pourrait sortir dans un PDF |
| 23 | « Imprimer » dans la visionneuse | première rédaction : ajout DeltaSub [C] | Libellé **de l'original**, mais de l'**ancienne visionneuse DESIGN** (`deltaproject.viewer.Viewer`, bouton Imprimer, `PrinterJob`, nom de tâche « Imprimer ») ; la visionneuse du nouveau format (`doc.ui.Viewer`) n'imprime pas et passe par l'aperçu PDF. DeltaSub n'a qu'une visionneuse pour les deux formats : bouton « Imprimer » (sans points de suspension) | [P `deltaproject.viewer.Viewer.jPrintButtonActionPerformed@73-91` (`PrinterJob.setJobName(mapString("printing"))`) ; S `Viewer\|printing`, `Viewer\|printT` « Imprimer » ; rech_orig § 3.4] |
| 24 | Contrôle de session de CH-08 (lot 4) sur les routes de fichiers | aucun cahier | **GET** : automatique, la ligne S3 de CH-03 est placée après le point S8 de CH-08 (`ch08_gate`, avant `/api/ping`). **POST** : `ch03_post` appelle `ch08_gate` **s'il existe**, avec les mêmes arguments que `do_GET` ; sinon comportement actuel (réseau local seulement). Sans cela, un poste sans session pourrait déposer des fichiers ou faire générer des PDF | [P structure de `do_GET` / `do_POST` ; spec_18 § 9.2, S8 à S10] ; [C] |
| 25 | Dossier de sauvegarde des fichiers d'une base d'essai | première rédaction : `Sauvegarde DeltaSub/fichiers/` | `BACKUP_DIR` dérive du dossier du **script** (`HERE`), pas de la base : un serveur du dépôt lancé avec `DELTASUB_DB` écrirait les fichiers d'essai dans la sauvegarde du bureau. **`CH03_SAUV`** = `BACKUP_DIR/fichiers` sans `DELTASUB_DB`, et `dirname(DB_PATH)/Sauvegarde DeltaSub/fichiers` avec | [P `serveur_deltasub.py` l. 29-32] ; [C] |
| 26 | Corbeille des documents Bâtiment | fiche CH-03 (verrou et corbeille) ; première rédaction : CH-10 lot 3 « proposé » | **Pas dans CH-10** (spec_19 n'en parle pas). État : eCCC et Soumission **déjà présentes** (deux temps, restauration par « Editer ») ; devis : **CH-02 lot 4** (spec_15 § 1 n° 17) ; contrôle des coûts : un seul temps, sans restauration (« Supprimer ce contrôle des coûts ? » → `ISMARKEDASDELETED:1`), **à confier à CH-07 lot 3** (liste et domaine d'affaire). Dans tous les cas, **le dépôt n'est pas touché** (les fichiers restent, comme l'original) | [P `DeltaSub.html` : `ecList` (corbeille eCCC en deux temps), `svDelete` (Soumission), entrée « Supprimer » de la liste des contrôles des coûts (`confirmDlg('Supprimer ce contrôle des coûts ?'…)`) ; spec_15 § 1 n° 17 ; rech_orig § 7] |

---

## 2. Périmètre

### 2.1 Reproduit (fidèle)

- **Dépôt par objet** : un dossier par objet, un nombre quelconque de PDF, un « PDF officiel » par document (`<nom du document>.pdf`, signalé « PDF disponible ») [P `FileGroup`, `Settings.getPdfFilename@0-54`].
- **Liste « Fichiers PDF »** : colonnes « Nom du fichier | Date de dernière modification » (`dd.MM.yyyy HH:mm`), fichiers `.pdf` sans tenir compte de la casse, fichiers masqués exclus, tri `String.compareTo` [P `files.File`, `FileTableModel`].
- **Menus et règles d'activation** du panneau générique [P `DocumentReportPanel.getDocumentPopupMenu`, `getPdfFilesPopupMenu@1-374`].
- **Dialogues** : « Nom du document », « Enregistrer le fichier » / « Choix du fichier », « Nom du fichier » (Bâtiment), « Fichiers PDF » (import depuis un autre dossier), « Fusionner PDF », les deux « Partager le fichier PDF », avec leurs messages.
- **Visionneuse** : PDF ▾ (« Ouvrir dans l'aperçu », « Sauvegarder et ouvrir » qui écrase sans demander), Partager ▾, zoom 25 à 400 % (125 % par défaut, mémorisé par poste) [P `Viewer.getPdfPopupMenu`, `previewPdf@26-72`, `getSharePopupMenu`, `Zoom$ZoomFactor`, `loadPreferences@0` (`zoom125`)].
- **Fusion** : ordre réglable, OK si au moins 2 fichiers et un nom, résultat dans le même dossier, sources conservées [P `MergePdfFilesDialog`].
- **QR** (pour CH-11) : « Nouveau fichier PDF », « Ajouter le QR-facture à la fin de la facture » (dernière page), « … comme nouvelle page à la fin » [P `GenerateQRBillDialog.generateQRBill@80-382`].
- **Annexes de contrat du contrôle des coûts** : références, dialogue « Document » (Document | Emplacement) [P `cc.AttachmentDialog`, `cc.AttachementNameDialog`].

### 2.2 Choix DeltaSub

- Stockage **par empreinte** (sha256) et métadonnées dans `depotfichier`, au lieu de fichiers nommés dans un dossier partagé [C].
- PDF produits par **Chrome sans fenêtre sur le Mac Studio** (PDFBox dans l'original) ; fusion et superposition par **PDFKit/Quartz** [C].
- « Emplacement » des dialogues de partage = **téléchargements du navigateur** (le navigateur choisit le dossier) ; « Afficher le dossier » retiré [C].
- « Utiliser Apple Mail » retiré (D8) ; « Préparer le courrier » télécharge d'abord les PDF enregistrés, puis ouvre le `mailto:` [C].
- Bouton « Imprimer » dans la visionneuse commune : présent dans l'ancienne visionneuse DESIGN de l'original, absent de la nouvelle, qui imprimait depuis l'aperçu PDF du système (§ 1 n° 23) [P + C].
- Déposer un PDF par glisser-déposer sur la liste « Fichiers PDF » = « Import fichier PDF… » [C].
- Alias de polices Akkurat dans la visionneuse et les PDF [C, décision n° 2].

### 2.3 Hors périmètre, retiré ou non livré

| Élément | Raison | Où |
|---|---|---|
| Verrou généralisé (`DocumentLockDialog`, droit `generalUnlockDocuments`) | spécifié par CH-10 lot 3 (§ 1 n° 6) | CH-10 lot 3 |
| Corbeille des documents Bâtiment (deux temps, Alt/Ctrl, restauration) | eCCC et Soumission : déjà présentes ; devis : liste de CH-02 ; contrôle des coûts : liste de CH-07 (§ 1 n° 26) | CH-02 lot 4 ; CH-07 lot 3 (à ajouter à sa fiche) |
| « Confirmer l'envoi… », `ISSEALED`, `MAILINGNOTE` | Documents d'affaire | CH-13 |
| « Partager le fichier PDF individuellement… » (`ShareOnePdfDialog`, rapports maîtres) | aucun moteur DeltaSub n'expose encore ses éléments ; interface réservée (`o.elements`, § 3.4) | EC-1 lot 4, CH-13 |
| « Paramètres », « Données », « Contenu », zone de travail, « Afficher les éléments masqués » de la visionneuse | éditeur de documents | CH-12, CH-14 |
| Navigation par page (\|< < n > >\|) | le document HTML n'est pas paginé à l'écran | écart E3 |
| Brouillon `.eml` avec pièce jointe | D8 arrêté ; non testé sur les postes | décision n° 3 |
| Branchement dans la Soumission (34 entrées grisées, 8 messages « prévu au lot 4 ») | 0 document au bureau, sans licence | EC-1 lot 4, avec l'API § 3 |
| Branchement dans l'eCCC (`ec4SectionDocuments`, `ec4ExportFiles`, documents de position) | points d'extension propres à EC-2 ; les déclarer ici créerait des redéclarations | EC-2 lot 4, avec l'API § 3 |
| Branchement du devis général (panneau Documents, « Créer un PDF comme jointe au document… ») | le panneau de CH-02 lot 3 n'est pas encore écrit | CH-02 lot 3, avec l'API § 3 |
| QR, facture, contrat, calcul, Controlling, « Importer des fichiers PDF du calcul » | facturation | CH-11 lot 4, avec l'API § 3 |
| Bons de paiement (« Créer un PDF avec tous les bons », facture d'entrepreneur jointe, autres annexes au paiement), annexes de l'arrêté, colonnes « PDF » des listes CoCo | code de CH-01 lots 2 à 4, pas encore écrit ou intégré | complément CH-01 après ses lots 2 à 4 (§ 12, non livré) |
| Annexes des paiements (2 au bureau) | `ccPayment` est réécrit par CH-01 (ancres A9, A10) | même complément |
| Règles de nom de fichier (Administrateur, domaine Fichiers) | domaine masqué au bureau | CH-13 |
| Reprise effective des fichiers (D12) | choix arrêté | outil livré, décision n° 4 |

### 2.4 Place et accès

- **Aucun nouveau module** dans la barre : le socle apparaît dans les fenêtres qui l'utilisent.
- **Accès** : réseau local seulement (`lan_ok`, comme aujourd'hui). Pas de droit par fichier, comme l'original [P rech_orig § 1.6] ; la lecture seule d'un panneau est décidée par l'appelant (`o.lectureSeule`), en attendant CH-08.

---

## 3. Interface figée pour les autres chantiers

*Section écrite en premier pour CH-11 (facturation), qui code en parallèle. Les noms, signatures et routes ci-dessous ne changent plus. Un chantier qui s'en sert garde chaque appel par `typeof ch03xNom==='function'` et grise l'entrée sinon, avec l'infobulle « Fichiers PDF : prévu avec CH-03 ».*

### 3.1 Routes HTTP (lot 1, `serveur_deltasub.py`)

Toutes passent par `lan_ok` (403 sinon). Quand CH-08 lot 4 (ouverture de session) est intégré, elles passent aussi par son contrôle `ch08_gate` : les routes GET automatiquement (S3 est placée après son point S8), les routes POST par un appel explicite dans `ch03_post` si la fonction existe (§ 1 n° 24). Les réponses JSON ont la forme `{ok:true, …}` ou `{ok:false, error:"<message>"}`.

| # | Méthode et route | Entrée | Réponse | Erreurs (message exact) |
|---|---|---|---|---|
| R1 | `GET /api/file?sha=<64 hex>&nom=<nom>[&dl=1]` | — | les octets ; `Content-Type` selon l'extension de `nom` ; `Content-Disposition: inline` (pdf, png, jpg, jpeg, gif) ou `attachment` (autres types, ou `dl=1`) avec `filename*=UTF-8''…` ; `Cache-Control: private, max-age=31536000, immutable` ; `X-Content-Type-Options: nosniff` ; jamais de gzip | 400 « Empreinte invalide. » ; 404 « Fichier introuvable dans le dépôt. » |
| R2 | `GET /api/file?apercu=<32 hex>&nom=<nom>[&dl=1]` | — | aperçu temporaire (conservé 24 h), `Cache-Control: no-store` | 404 « Aperçu expiré. » |
| R3 | `POST /api/file?nom=<nom>` | octets bruts du fichier (corps de la requête) | `{ok, sha, taille, pages}` (`pages` : PDF seulement, sinon `null`) | 400 « Nom de fichier invalide. » ; 413 « Fichier trop volumineux (25 Mo au plus). » ; 415 « Type de fichier refusé. » ; 507 « Espace disque insuffisant sur le Mac Studio. » |
| R4 | `GET /api/pdf` | — | `{ok, chrome:"154.0.8037.58"\|null, outils:true\|false}` : moteurs disponibles (mis en cache au démarrage) | — |
| R5 | `POST /api/pdf` | JSON `{html, apercu?:bool}` (16 Mo au plus) | `{ok, sha\|apercu, taille, pages}` | 400 « Document vide. » ; 413 ; 503 « Génération des PDF indisponible : Chrome introuvable sur le Mac Studio. » ; 503 « Serveur occupé, réessayez. » ; 504 « La génération du PDF a échoué (délai dépassé). » |
| R6 | `POST /api/file/fusion` | JSON `{shas:[s1, s2, …]}` (au moins 2, dans l'ordre voulu) | `{ok, sha, taille, pages}` | 404 « Fichier introuvable dans le dépôt. » ; 422 « Fusion impossible : un des fichiers est illisible ou protégé. » ; 503 « Outils PDF de macOS indisponibles. » |
| R7 | `POST /api/file/superposer` | JSON `{base, calque}` : la **page 1** du calque est dessinée **par-dessus la dernière page** de la base (fond du calque transparent : rien n'est masqué) | `{ok, sha, taille, pages}` | idem R6 |
| R8 | `GET /api/file?ref=<chemin absolu>[&dl=1]` | — | fichier externe en **lecture seule** (annexes de `01-AFFAIRES`), `no-store` | 403 « Annexes externes non autorisées sur ce serveur (réglage DELTASUB_ANNEXES). » ; 404 « Le fichier ^0 n'existe pas. » ([S `Strings\|msgFileNotFound`], ^0 = chemin) |

Les métadonnées ne passent **pas** par ces routes : le poste les enregistre lui-même par `DS.commit` sur `depotfichier` (§ 4.2), avec la détection de conflit habituelle (409).

### 3.2 Fonctions du dépôt (lot 1, préfixe `ch03a`)

Fonctions pures marquées (pur) ; les autres renvoient une `Promise` quand c'est indiqué.

| Fonction | Rôle |
|---|---|
| `CH03A_T` | `'depotfichier'`. Déclaré ainsi : `const CH03A_T=(DS.loaded.add('depotfichier'),'depotfichier');` (collection marquée chargée dès le démarrage, même vide, pour que `DS.poll` suive ses changements) |
| `ch03aDossier(genre, p, id, sous)` (pur) | chemin du dossier d'un objet, table § 4.3 ; genre inconnu → `Error` |
| `ch03aFichiers(dossier, ext='pdf')` (pur sur DS) | enregistrements du dossier (pas des sous-dossiers), extension donnée (`null` = toutes), triés par `NOM` en ordre `String.compareTo` |
| `ch03aTrouve(dossier, nom)` | enregistrement de ce nom, **casse ignorée**, forme Unicode NFC ; `null` sinon |
| `ch03aPdfDispo(dossier, nom)` | booléen « PDF disponible » ; `nom` avec ou sans « .pdf » |
| `ch03aDossierVide(dossier)` | aucun fichier dans le dossier ni ses sous-dossiers |
| `ch03aNomPdf(nom)` (pur) | nom rogné, « .pdf » ajouté s'il manque (comparaison en minuscules) [P `PdfFilenameDialog.jOkButtonActionPerformed@0-47`] |
| `ch03aFiltreNom(avant, apres, max=64)` (pur) | règle FileNameGuard à la frappe : `{nom, rejet}` ; caractères `< > : " / \| \ ? *` retirés, `rejet` = dernier caractère retiré ; si `apres` (filtré) dépasse `max`, `nom = avant` (insertion refusée en entier) |
| `ch03aNomBatiment(nom)` (pur) | règle Bâtiment : premier caractère de `" * / : ; < > ? \|` trouvé, ou `null` |
| `ch03aDate(iso)` (pur) | `'dd.MM.yyyy HH:mm'` |
| `ch03aUrl(x, dl)` (pur) | URL de R1, R2 ou R8 ; `x` = enregistrement, `{sha, nom}`, `{apercu, nom}` ou `{ref}` |
| `ch03aOnglet()` | à appeler **dans le geste** de l'utilisateur (clic) : ouvre tout de suite un onglet `about:blank`, puis rend `{aller(url), fermer()}`. Si le navigateur a bloqué l'onglet, `aller()` télécharge le fichier |
| `ch03aOuvrir(x)` | ouvre `x` dans un nouvel onglet (dans le geste) |
| `ch03aTelecharger(x \| [x])` | téléchargement par `<a download>`, un fichier après l'autre |
| `ch03aEnvoyer(nom, donnees)` → Promise | R3 ; `donnees` = `Blob`, `File`, `ArrayBuffer` ou chaîne ; rend `{sha, taille, pages}` |
| `ch03aPdf(html, {apercu})` → Promise | R5 |
| `ch03aFusion(shas)` → Promise | R6 |
| `ch03aSuperposer(base, calque)` → Promise | R7 (empreintes) |
| `ch03aMoteur()` → Promise | R4, mis en cache pour la session |
| `ch03aEnregistrer(dossier, nom, r, o)` → Promise(enregistrement) | **un** `DS.commit` de l'enregistrement. `r = {sha, taille, pages}` ; `o = {projet, origine, remplacer}`. Nom déjà pris (casse ignorée) et `!o.remplacer` → rejet `Error('existe')`, l'appelant pose la question. Remplacement : même `ID` et même `NOM` que l'existant [D : un disque insensible à la casse garde le nom d'origine], `bseq` lu au moment de l'appel |
| `ch03aDeposer(dossier, nom, donnees, o)` → Promise(enregistrement) | `ch03aEnvoyer` puis `ch03aEnregistrer` |
| `ch03aCopier(rec, dossier, nom, o)` → Promise(enregistrement) | même contenu, nouvel enregistrement, aucun octet copié |
| `ch03aSupprimer(recs)` → Promise | **un** `DS.commit` de toutes les suppressions (`val:null`) ; les octets restent dans le dépôt (§ 4.6) |
| `ch03aPret()` → Promise | `DS.need([CH03A_T])` : à attendre avant la première lecture d'une vue |

### 3.3 Visionneuse et PDF (lot 2, préfixe `ch03b`)

| Fonction | Rôle |
|---|---|
| `CH03B_OPEN` | la vraie `window.open` (pour ouvrir une vraie fenêtre, ou `open('about:blank','_blank')`, que l'interception ne touche pas) |
| `CH03B_ACTIF` | `true` : les fenêtres `open('','_blank')` sont interceptées (décision n° 1) |
| `ch03bView(titre, src, o)` → `{close, bd, iframe, maj(src)}` | visionneuse (§ 6.1). `src` = HTML complet, ou résultat `R` de `svDpHTML` (converti par `svDpDocHTML`). `o = {pdf:{dossier, nom, projet}, joindre, contacts, concerne, boutons:[{t, fn(maj)}]}` : `o.pdf` fait d'un aperçu un **document enregistré** (« Sauvegarder et ouvrir ») ; `o.joindre` = dossier, ou fonction → Promise(dossier \| null) (« Sélectionner une facture (…) » de CH-11) |
| `ch03bContexte(o)` | options de la **prochaine** fenêtre interceptée (valables 10 s) : un moteur existant (`ivPrint`, `ctlPrint…`) s'ouvre ainsi avec « Enregistrer le PDF en pièce jointe… » |
| `ch03bCapture(fn)` → Promise(html) | exécute `fn` (un moteur qui écrit dans une fenêtre) et rend le HTML **sans ouvrir la visionneuse** : c'est ainsi qu'on fait le PDF d'une facture `tplPrint` |
| `ch03bHtml(src)` (pur) | HTML complet avec les alias de polices (§ 5.4) |
| `ch03bNomDlg(o)` → Promise(nom \| enregistrement \| null) | « Enregistrer le fichier » (`o.mode:'enregistrer'`, rend le nom avec « .pdf ») ou « Choix du fichier » (`'choisir'`, rend l'enregistrement choisi) ; `o = {mode, entete, dossier, nom}` (§ 6.3) |
| `ch03bNouveauPdfDlg(nom, dossier)` → Promise(nom \| null) | « Nom du fichier », règle Bâtiment (§ 6.4) : « Créer un PDF comme jointe au document… » du devis général et de l'eCCC |
| `ch03bEnregistrerPdf(o)` → Promise(enregistrement \| null) | « Enregistrer sous forme de fichier PDF… » sans ouvrir la visionneuse : `o = {dossier, nomDoc, html:()=>chaîne \| Promise, projet}` |
| `ch03bJoindre(html, dossier, o)` → Promise(enregistrement \| null) | « Enregistrer le PDF en pièce jointe… » hors visionneuse |

### 3.4 Panneau et dialogues (lot 3, préfixe `ch03c`)

| Fonction | Rôle |
|---|---|
| `ch03cPanel(o)` → élément (`.redraw()`) | panneau « Document » + « Fichiers PDF » (§ 6.5). `o = {titre, dossier, projet, doc:{existe(), nom(), nouveau(), renommer(), supprimer(), ouvrir(), html()}, menuDoc:[items], lectureSeule, dis, concerne, contacts, fusionNom}` : l'appelant garde son document dans sa propre collection (comme `cocodoc`) |
| `ch03cPdfZone(o)` → `{el, bouton, sel(), redraw()}` | la liste « Fichiers PDF » seule et son bouton ▾ (§ 6.6), pour les panneaux déjà écrits (CH-01, CH-02) |
| `ch03cNomDocDlg(titre, nom)` → Promise(nom \| null) | « Nom du document » (§ 6.7) |
| `ch03cImporter(dossier, o)` → Promise(enregistrement \| null) | « Import fichier PDF… » (§ 6.8) |
| `ch03cImporterDe(source, cible, o)` → Promise(enregistrement \| null) | « Fichiers PDF » : copie d'un PDF d'un autre dossier (contrat ▸ « Importer des fichiers PDF du calcul ») |
| `ch03cFusionDlg(dossier, recs, o)` → Promise(enregistrement \| null) | « Fusionner PDF » (§ 6.9) ; `o.nom` = nom proposé |
| `ch03cPartager(recs, o)` | « Partager le fichier PDF », fichiers enregistrés (§ 6.10) ; `o = {concerne, contacts}` |
| `ch03cPartagerApercu(src, o)` | « Partager le fichier PDF », aperçu de la visionneuse (§ 6.11) |
| `ch03cMailto(a, concerne, texte)` (pur) | URL `mailto:` (§ 6.12) |
| `ch03cTexte(civilite, contenu)` (pur) | texte du message (§ 1 n° 16) |
| `ch03cListeNoms(recs)` (pur) | « a, b, c » (moins de 4 fichiers) ou « <n> Fichiers PDF » |
| `ch03cBlocs(fn)` | « Blocs de texte » de type texte (groupes `TYPECODE = 0`, éléments par `ppBpItems`, cadres `ppBox`, bouton OK `ppOk`) → `fn(texte)` |
| `ch03cContactsAffaire(p, roles)` (pur sur DS) | destinataires proposés : intervenants de l'affaire non masqués des rôles donnés (`projectmember.TEAMROLECODE`, 8 = maître d'ouvrage), puis leur responsable (`RESPCONTACT_ID`), s'ils ont un courriel : `{desc: contactName(c), email: EMAIL1, civilite: SALUTATION1}` |

`o.elements` (rapport maître, « Partager le fichier PDF individuellement… ») est **réservé** : `[{libelle, contact, html()}]`. Non livré dans cette vague.

### 3.5 Recettes pour les chantiers utilisateurs

| Besoin | Appel |
|---|---|
| **CH-11** dossier d'une facture, d'un contrat, d'un calcul | `ch03aDossier('facture', p.ID, f.ID)`, `('contrat', p.ID, c.ID)`, `('calcul', p.ID, fee.ID)` |
| **CH-11** panneau Documents de la facture, avec « QR-facture… » | `ch03cPanel({titre, dossier, projet:p.ID, doc:{…}, menuDoc:[{t:'QR-facture…', fn}], concerne, contacts})` |
| **CH-11** PDF de la facture (ancien modèle `tplPrint`) | `const html=await ch03bCapture(()=>ivPrint(f,…));` puis `ch03aPdf(html)` puis `ch03aEnregistrer(dossier, nom, r, {projet, origine:'pdf'})` |
| **CH-11** QR « Nouveau fichier PDF » | `ch03bNomDlg({mode:'enregistrer', entete:'Enregistrer le bulletin de versement QR', dossier, nom:'Bulletin de versement QR'})` → `ch03aPdf(qrHtml)` → `ch03aEnregistrer(…, {origine:'qr'})` |
| **CH-11** QR « Ajouter le QR-facture à la fin de la facture » | `ch03bNomDlg({mode:'choisir', entete:'Joindre QR-facture à un document', dossier})` → calque = `ch03aPdf(html)` d'une page A4 (`@page{size:A4;margin:0}`, `html,body{background:transparent}`) portant **seulement** la section de paiement 210 × 110 mm (`QR_BILL_EXTRA_SPACE` : trait et ciseaux en haut) collée au bas de la page, **sans aucun fond** → `ch03aSuperposer(rec.SHA256, calque.sha)` → `ch03aEnregistrer(dossier, rec.NOM, r, {remplacer:true, origine:'qr'})`. Rien n'est masqué, aucune place libre n'est contrôlée, comme l'original (§ 1 n° 21) |
| **CH-11** « … comme nouvelle page à la fin » | même calque A4 → `ch03aFusion([rec.SHA256, calque.sha])` → même enregistrement, remplacé (l'original ajoute une page A4 595,28 × 841,89 pt portant la section en bas) |
| **CH-11** « Afficher le fichier PDF » | `const t=ch03aOnglet();` **au clic sur OK**, puis `t.aller(ch03aUrl(rec))` après l'enregistrement |
| **CH-11** Controlling ▸ « Enregistrer le PDF en pièce jointe… » dans une facture | `ch03bContexte({joindre:()=>choisirFacture(p)})` juste avant l'appel du moteur existant |
| **CH-11** « Importer des fichiers PDF du calcul » | `ch03cImporterDe(ch03aDossier('calcul',…), ch03aDossier('contrat',…))` |
| **CH-11 / CH-13** refus « Cette inscription ne peut pas être effacée, car il existe encore des documents ou des fichiers PDF. » (Information) | `!ch03aDossierVide(dossier) \|\| docExiste` [S `Strings\|msgFileGroupNotEmpty`] |
| **CH-01** « Supprimer les PDF associés. » | `ch03aSupprimer(ch03aFichiers(dossier))` |
| **CH-01, CH-02, EC-2** colonne « PDF disponible » | `typeof ch03aPdfDispo==='function'&&ch03aPdfDispo(dossier,'Contrat.pdf')` (après `ch03aPret()`) |
| **CH-02, EC-2** « Créer un PDF comme jointe au document… » | messages préalables de l'appelant, puis `ch03bNouveauPdfDlg('Devis général', ch03aDossier('devis',P,D,'archive'))` → `ch03aPdf(html)` → `ch03aEnregistrer` |
| **CH-02, EC-2** liste « Fichiers PDF » du dossier `archive/` | `ch03cPdfZone({dossier:ch03aDossier('devis',P,D,'archive'), projet:P, fusionNom:''})` |
| **EC-1** PDF officiel d'un document de Soumission | `ch03aPdfDispo(dossier, 'devisTendererList.pdf')` ; nom proposé de la fusion « TODO Merged.pdf » dans l'original (défaut de l'éditeur ; spec_11 le corrige) |
| **CH-02, CH-07, EC-2** suppression définitive d'un document Bâtiment (corbeille) | aucun appel : les fichiers du dépôt restent, comme l'original, où la suppression ne touche pas `DELTAprojectFiles` |

**Correspondance avec l'adaptateur `ch11dFS` de CH-11** (spec_16 § 10.1). Chaque ligne se garde par `typeof` sur la fonction citée :

| Capacité CH-11 | Fonctions CH-03 | Lot |
|---|---|---|
| F1 Lister les PDF d'un dossier (nom, date) | `ch03aPret()` puis `ch03aFichiers(dossier)` → `[{NOM, MODIFIED, SHA256, TAILLE, PAGES, …}]` (tri `String.compareTo`) ; affichage de la date : `ch03aDate(MODIFIED)` ; tableau et menu complets : `ch03cPdfZone(o)` | 1 ; 3 |
| F2 Produire un PDF depuis un HTML complet et le déposer | `ch03aPdf(html)` → `{sha, taille, pages}` puis `ch03aEnregistrer(dossier, ch03aNomPdf(nom), r, {projet, origine, remplacer})` ; avec le dialogue de nom : `ch03bEnregistrerPdf(o)` ; HTML d'un moteur existant qui écrit dans une fenêtre : `ch03bCapture(fn)` | 1 ; 2 |
| F3 Ouvrir / télécharger | `ch03aOnglet()` **dans le clic**, puis `t.aller(ch03aUrl(rec))` ; `ch03aOuvrir(rec)` ; `ch03aTelecharger(rec)` | 1 |
| F4 Superposer sur la dernière page / ajouter en nouvelle page | `ch03aSuperposer(base, calque)` / `ch03aFusion([base, calque])` (empreintes), puis `ch03aEnregistrer(…, {remplacer:true})` | 1 |
| F5 Fusionner dans un ordre donné | dialogue : `ch03cFusionDlg(dossier, recs, {nom})` ; sans dialogue : `ch03aFusion(shas)` | 3 ; 1 |
| F6 Copier un PDF d'un dossier vers un autre | dialogue « Fichiers PDF » : `ch03cImporterDe(source, cible, o)` ; sans dialogue : `ch03aCopier(rec, dossier, nom, o)` (aucun octet copié) | 3 ; 1 |
| F7 Importer, supprimer, partager | `ch03cImporter(dossier)`, `ch03aSupprimer(recs)`, `ch03cPartager(recs, {concerne, contacts})` ; tout le menu : `ch03cPdfZone` | 3 |
| Dossier `{projet, sous, id}` | `ch03aDossier('facture' \| 'contrat' \| 'calcul', projet, id)` | 1 |

Ce que CH-11 attend et que CH-03 **ne livre pas** : « Afficher le dossier » (le navigateur ne peut pas montrer un dossier du Mac Studio, écart E4) ; « Partager le fichier PDF individuellement… » (réservé, `o.elements`) ; le verrou de l'offre (CH-10 lot 3, § 1 n° 6).

---

## 4. Modèle de données

### 4.1 Dépôt sur disque (lot 1)

```
dirname(DB_PATH)/fichiers/            (~/Library/Application Support/DeltaSub/fichiers, ou <dossier d'essai>/fichiers)
  objets/<sha[0:2]>/<sha>             contenus, immuables, nommés par leur empreinte (64 hex)
  tmp/                                fichiers de travail et aperçus (purgés après 24 h)
```

- Écriture **atomique** : fichier temporaire dans `tmp/`, puis `os.replace` vers `objets/`. Un contenu déjà présent n'est pas réécrit (déduplication).
- Le dossier dérive de `DB_PATH` : une base d'essai (`DELTASUB_DB`) a son propre dépôt, jamais celui du bureau.
- **Aucun fichier dans `rec`** : les 152 PDF en base64 feraient environ 27 Mo, pour un démarrage qui pèse 18,5 Mo bruts [P rech_exist V10].

### 4.2 Collection `depotfichier` (un enregistrement = un fichier)

Nom libre (0 occurrence dans `DeltaSub.html`, le serveur et `ch/*/`, vérifié). `fichier` est écarté (76 champs de ce nom).

| Champ | Contenu |
|---|---|
| `ID` | `<DOSSIER>/<NOM>` (chaîne) |
| `DOSSIER` | chemin relatif, segments séparés par « / » (§ 4.3) |
| `NOM` | nom du fichier avec son extension, forme Unicode NFC |
| `EXT` | extension en minuscules (`pdf`, `dpdoc`…) |
| `SHA256` | empreinte du contenu (clé de `objets/`) |
| `TAILLE` | octets |
| `PAGES` | nombre de pages (PDF), sinon `null` |
| `MODIFIED` | « Date de dernière modification » : `AAAA-MM-JJTHH:MM:SS`, heure locale du poste à l'enregistrement ; date du fichier source pour la reprise |
| `USERID` | `ME.id` de l'auteur (`null` pour la reprise) |
| `ORIGINE` | `import` · `pdf` (généré) · `fusion` · `qr` · `copie` · `reprise` |
| `PROJECT_ID` | affaire, ou `null` |

- **Suppression** = `val:null` (le numéro de séquence reste connu du poste : la recréation du même nom ne fait pas de conflit parasite).
- **Unicité** : deux fichiers d'un même dossier ne peuvent différer que par la casse (contrôle côté poste, § 3.2). Deux postes qui créent le même nom en même temps : le second reçoit le 409 habituel.
- **Volume** : environ 400 octets par fichier ; 500 fichiers = 200 Ko bruts, chargés au démarrage (hors `HEAVY`).
- **Pas de lien vers le document** : le « PDF officiel » se retrouve par son nom (`<nom du document>.pdf`), comme dans l'original. Renommer un document « perd » donc son PDF officiel, **comme dans l'original** [P `Settings.getPdfFilename`].

### 4.3 Arborescence logique : `ch03aDossier(genre, p, id, sous)`

`P` = `PROJECT.ID`, `D` = identifiant du document Bâtiment (= identifiant DeltaSub de `costcontrol`, `costestimate`, `costplanning`).

| Genre | Dossier | Preuve |
|---|---|---|
| `document` | `ProjectDocuments/Documents/<P>/Documents/<PROJECTDOCUMENT.ID>` | [P `Settings$ProjectDocumentType.<clinit>`, fichier du bureau `…/911/Documents/151/151.dpdoc`] |
| `seance` | `ProjectDocuments/Documents/<P>/Meetings/<id>` | idem |
| `facture` | `ProjectDocuments/Documents/<P>/Invoices/<PROJECTINVOICE.ID>` | [P `db.ProjectInvoice.getDocumentsPath@0-15`] |
| `calcul` | `ProjectDocuments/Documents/<P>/FeeCalculations/<id>` | [P `$ProjectDocumentType`] |
| `contrat` | `ProjectDocuments/Documents/<P>/Contracts/<id>` | idem ; dossier du bureau `1401/Contracts/352/` |
| `coco` | `Construction/Costcontrol/<P>/<D>/coco/<sous>` ; `sous` = dossier de `cocodoc` (`award/contractSheet_<contact>_<n°>`, `paymentorder/<ref>`, `entrepreneurInvoices/<n° pmt>`…) | [P `CostcontrolFilenames`] ; CH-01 § 3.1 |
| `devis` | `Construction/Costestimate/<P>/<D>/documents` ; `sous='archive'` → `…/documents/archive` | [P `CostestimateFilenames`] |
| `eccc` | `Construction/Costplanning/<P>/<D>/documents` (`sous='archive'` → `…/archive`) ; `sous='docs'` → `Construction/Costplanning/<P>/<D>/docs` | [P `CostplanningFilenames`] |
| `soumission` | `Construction/Devis/devis18/<P>/<D>/<sous>` | [D `DevisFilenames` : `Construction`, `Devis`, `devis18`, `documents`, `externalTendererPdfs/contactID_<id>` ; ordre exact à confirmer par EC-1 lot 4, 0 document au bureau] |

PDF officiels (nom fixe) : devis `estimate.pdf`, `honorar.pdf`, `desc.pdf` ; eCCC `element.pdf`, `desc.pdf` ; Soumission `devisTendererList.pdf`… ; documents nommés (contrôle des coûts, factures) : `<nom du document>.pdf`.

### 4.4 Noms de fichiers

| Où | Règle | Preuve |
|---|---|---|
| « Nom du document », « Nom du fichier » d'« Enregistrer le fichier » | FileNameGuard : `< > : " / \| \ ? *` retirés à la frappe ; 64 caractères (insertion refusée en entier au-delà) ; « Nom du document » affiche sous le champ « Caractère incorrect: x », masqué à la touche suivante | [P § 1 n° 4 ; `DocumentNameDialog.jNameTextFieldKeyReleased@1-62`] [S `Strings\|msgIllegalCharacter` « Caractère incorrect »] |
| « Nom du fichier » Bâtiment, « Titre du document » des pièces Bâtiment | `" * / : ; < > ? \|` refusés à l'OK : « Le caractère ^0 ne doit pas être utilisé dans le nom du fichier. » (Erreur) | [P, S `ElementDocumentsFrame\|msg8`] |
| « Nom du fichier » de « Partager le fichier PDF » (aperçu) | 128 caractères, aucun filtre (le nom sert au téléchargement) | [P § 1 n° 12] |
| « Nom du fichier » de « Fusionner PDF » | champ simple, rogné, « .pdf » ajouté | [P `MergePdfFilesDialog.jOkButtonActionPerformed@0-223`] |
| Serveur (toutes routes) | refuse : vide, plus de 128 caractères, « / » ou « \ », caractère de contrôle, nom commençant par « . », extension hors liste (§ 4.5) | [C] |
| Aperçu | `DeltaSub PDF (dd.MM.yy HH-mm-ss).pdf` (l'original écrit « DELTAproject PDF (…) ») | [P `Settings.getPreviewPdfFilename`] [C nom de l'application] |

### 4.5 Types acceptés et limites

| Extension | Contrôle du contenu | Affichage |
|---|---|---|
| `pdf` | `%PDF-` dans les 1 024 premiers octets | `inline` |
| `png`, `jpg`, `jpeg`, `gif` | signature (`\x89PNG`, `\xFF\xD8\xFF`, `GIF8`) | `inline` |
| `dpdoc`, `zip`, `docx`, `xlsx` | `PK\x03\x04` | `attachment` |
| `csv`, `txt`, `doc`, `xls` | aucun | `attachment` |

- Tout autre type : 415 (notamment `html`, `svg`, `js`, `app`, `command`, `sh`) [C]. EC-2 lot 4 pourra allonger la liste (`CH03_TYPES`).
- **25 Mo par fichier** (contrats signés de 10,1 Mo au bureau ; PDF de `DELTAprojectFiles` : 405 ko au plus) ; **16 Mo** de HTML pour `/api/pdf` ; refus si moins de **2 Go** libres sur le disque [C].
- `Content-Length` lu **avant** le corps : un envoi trop gros est refusé sans être lu.

### 4.6 Sauvegarde, restauration, purge

- **Sauvegarde** : à chaque cycle de `backup_loop` où la séquence a changé, recopie des contenus absents de `CH03_SAUV/objets/` (copie incrémentale ; les contenus sont immuables). Les métadonnées sont déjà dans les 48 copies horaires de la base [C].
- **`CH03_SAUV`** [C, § 1 n° 25] : `os.path.join(BACKUP_DIR, "fichiers")` (au bureau : « Sauvegarde DeltaSub/fichiers » du dossier du serveur, sur le NAS, donc hors du disque du Mac Studio) ; **si `DELTASUB_DB` est défini** : `os.path.join(os.path.dirname(DB_PATH), "Sauvegarde DeltaSub", "fichiers")`, pour qu'une base d'essai ne dépose jamais ses fichiers dans la sauvegarde du bureau.
- **Restauration** : copier `CH03_SAUV/objets/` dans `…/DeltaSub/fichiers/objets/`, puis la copie de base voulue. Toute copie de base retrouve ses fichiers, puisqu'aucun contenu n'est effacé.
- **Aucune purge automatique** des contenus supprimés : environ 150 PDF par an × 60 ko, soit 9 Mo par an [C]. `tmp/` est purgé des fichiers de plus de 24 h à chaque génération et à chaque sauvegarde.

### 4.7 Protection au ré-import

`PROTECTED |= {"depotfichier"}` : un ré-import `--force` ne vide jamais les métadonnées (il n'en produit pas). L'outil de reprise (lot 4) n'ajoute que les fichiers absents et n'écrase jamais un fichier déposé dans DeltaSub.

### 4.8 Serveur : modifications (lot 1, copie modifiée complète et diff)

Bloc `# ── CH-03 ──` inséré avant `# ─────────── HTTP ───────────` (imports `hashlib, secrets, shutil, signal, subprocess` et `pathlib.Path` **dans le bloc**, pour ne pas toucher la ligne d'import) :
- constantes `CH03_FICHIERS = os.path.join(os.path.dirname(DB_PATH), "fichiers")`, `CH03_SAUV` (§ 4.6), `CH03_TYPES`, `CH03_MAX = 25 << 20`, `CH03_HTML_MAX = 16 << 20`, `CH03_POST = {"/api/file", "/api/pdf", "/api/file/fusion", "/api/file/superposer"}` ;
- `ch03_post` commence par le contrôle de session de CH-08 s'il existe : `g = globals().get("ch08_gate")` ; si `g`, ouvrir `c = db()`, `if not g(h, c, urlparse(h.path)): return` (la réponse 401 est déjà envoyée), puis `c.close()` (§ 1 n° 24) ;
- `ch03_nettoyer_html(html)` (§ 5.3, étape 2) : politique CSP après le doctype de tête, balises `meta refresh` retirées ;
- `ch03_chrome()` (chemin et version, une fois) : `DELTASUB_CHROME`, puis `/Applications/Google Chrome.app/…/Google Chrome`, `~/Applications/…`, Microsoft Edge, Brave, Chromium ;
- `ch03_get(h, u, q)` (R1, R2, R4, R8), `ch03_post(h, chemin)` (R3, R5, R6, R7), `_ch03_envoyer(h, chemin, nom, dl, cache)` (lecture par blocs, sans gzip) ;
- `ch03_pdf(html)` (§ 5.3), `ch03_outil(op, sortie, entrees)` (JXA, § 5.5), `CH03_JXA` (script en chaîne) ;
- `ch03_sauvegarde()` (§ 4.6, avec `try` : une erreur n'empêche jamais la sauvegarde de la base) ;
- verrou `_ch03_pdflock` (un seul Chrome à la fois ; attente de 60 s au plus, puis 503).

Lignes ailleurs : S1 à S5 du § 11.

---

## 5. Génération des PDF, fusion, superposition, polices

### 5.1 Options étudiées (mesures sur ce Mac Studio, macOS 15.7.4)

| Voie | Fidélité | Dépendance | Mesure | Verdict |
|---|---|---|---|---|
| Impression du navigateur, puis « Import fichier PDF… » | celle du poste | aucune | deux gestes ; aucun octet côté DeltaSub | **repli** |
| Bibliothèque JS embarquée (jsPDF, html2canvas) | image du HTML (texte non sélectionnable), ou mise en page à réécrire [D] | quelques centaines de ko dans `DeltaSub.html` [D] ; la police Akkurat ne peut pas y être embarquée (licence Lineto : jamais dans git) | non mesurée | écartée |
| WebKit par JXA (`WKWebView`) | pas de boîtes de marge `@page` (numéros de page de `mgPrint`) ; `createPDF` sans pagination [D, documentation d'Apple] | macOS | non mesurée | écartée |
| **Chrome sans fenêtre sur le Mac Studio** | le moteur de Chrome, comme l'impression sur les postes ; `@page`, pages nommées et boîtes de marge rendues | Chrome 154.0.8037.58, déjà installé | PDF de synthèse A4 de 2 pages en **0,43 à 0,65 s** (11 essais, lancement du processus compris) ; A4 paysage 842 × 595 pt ; polices embarquées ; titre = `<title>` | **retenue** |
| Fusion par `join` (Automator) | PDFKit | macOS | 13 + 13 = 26 pages, 188 654 o | équivalent |
| **Fusion et superposition par JXA** (PDFKit, Quartz) | vectoriel, pages A4 conservées | macOS | fusion 13 + 13 = 26 pages en 0,14 s (189 821 o) ; 2 + 10 = 12 pages (PDF 1.4 + PDF 1.7 à 63 flux d'objets) ; superposition 2 pages, 595 × 842 conservé | **retenue** (un seul outil pour fusion, superposition et nombre de pages) |

### 5.2 Choix [C]

- **Tout PDF est produit par le serveur** (R5) à partir du HTML que voit l'utilisateur (visionneuse, ou `ch03bCapture`).
- Si Chrome manque (`GET /api/pdf` → `chrome:null`) : « Ouvrir dans l'aperçu » imprime par le navigateur avec le toast « Le Mac Studio ne peut pas créer de PDF (Chrome introuvable) : choisissez « Enregistrer au format PDF » dans la fenêtre d'impression, puis « Import fichier PDF… ». » ; les entrées qui enregistrent un PDF sont grisées, avec la même infobulle.
- Chrome se met à jour seul ; le chemin est relu à chaque démarrage du serveur. Aucune installation.

### 5.3 Algorithme `ch03_pdf(html)` [P mesures]

1. Refus si le HTML est vide ou dépasse 16 Mo.
2. **Nettoyage et politique de sécurité** (`ch03_nettoyer_html`) :
   - retirer toute balise `<meta … http-equiv=refresh …>` (expression `(?is)<meta\b[^>]*http-equiv\s*=\s*["']?\s*refresh[^>]*>`) [P mesure : un `meta refresh` vers `file://` fait quitter Chrome sans PDF, code 0] ;
   - insérer `<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:">` **juste après le doctype de tête** : expression `(?is)^﻿?(?:\s|<!--.*?-->)*<!doctype[^>]*>` ; sans doctype de tête, **tout au début**. Le parseur HTML range alors ces `meta` dans l'en-tête implicite, avant tout contenu. **Ne jamais chercher `<head>`** : un `iframe` placé avant `<head>` échappait à la politique et imprimait un fichier local du Mac Studio dans le PDF [P mesure `spec_work/sec/` a.html → texte témoin présent ; b.html → absent].
   - La politique coupe scripts, réseau, cadres et fichiers locaux ; les polices `local()` restent permises (ce ne sont pas des chargements) [P : même document, 1 page avec la politique, 5 pages sans (script qui ajoute 4 sauts de page) ; image `file:///…` non chargée ; `AkkuratLLTT-*` embarquées avec la politique]. **Ne pas utiliser `--blink-settings=scriptEnabled=false`** : avec ce drapeau, Chrome s'arrête sans rien écrire [P mesure].
3. Écriture UTF-8 dans `tmp/<jeton>.html` ; profil jetable `tmp/chrome-<jeton>/`.
4. Lancement dans un nouveau groupe de processus : `<chrome> --headless --disable-gpu --no-first-run --no-default-browser-check --disable-extensions --disable-background-networking --disable-sync --disable-component-update --use-mock-keychain --password-store=basic --no-pdf-header-footer --user-data-dir=<profil> --print-to-pdf=<tmp/jeton.pdf> <URI file:// du HTML>` [P : 3 essais, 0,43 à 0,64 s, 33 374 o chacun ; sans `--no-pdf-header-footer`, Chrome ajoute date et adresse en tête et en pied].
5. Attente, toutes les 50 ms et 60 s au plus : le PDF existe et se termine par `%%EOF`. **Chrome ne s'arrête pas seul** [P : processus vivant après l'écriture] : `killpg(SIGTERM)`, puis `SIGKILL` après 3 s ; profil et HTML supprimés.
6. `pages` par JXA (§ 5.5) ; empreinte ; rangement dans `objets/` (ou dans `tmp/` pour un aperçu, jeton de 32 hex).
7. Dépassement du délai : 504 ; Chrome terminé sans PDF : 504 avec le même message.

### 5.4 Polices (alias Akkurat) [P mesures]

Polices du bureau (`~/Library/Fonts`, identiques à `DELTAprojectFiles/ProjectDocuments/Fonts`) : famille « Akkurat LL TT », noms PostScript `AkkuratLLTT-Thin`, `-Light`, `-Regular`, `-Italic`, `-Bold`, `-BoldItalic`, `-Black` (et italiques) ; `ReAkkuratLL-Regular.otf` a pour nom complet « Akkurat LL » mais pour famille « Reakkurat ». Chrome ne trouve donc ni `'Akkurat LL'`, ni `'AkkuratLL-Light'`, ni `'Akkurat'`.

`CH03B_POLICES` (lot 2), inséré par `ch03bHtml` juste après le doctype de tête, sinon au début (même règle que le serveur, § 5.3) (visionneuse **et** PDF) : pour chacune des familles `'Akkurat LL'`, `'AkkuratLL-Light'`, `'Akkurat'`, une règle `@font-face` par graisse et par style :

| `font-weight` | `font-style: normal` | `font-style: italic` |
|---|---|---|
| 100 | `local('AkkuratLLTT-Thin')` | `local('AkkuratLLTT-ThinItalic')` |
| 300 | `local('AkkuratLLTT-Light')` | `local('AkkuratLLTT-LightItalic')` |
| 400 | `local('AkkuratLLTT-Regular'), local('AkkuratLL-Regular')` | `local('AkkuratLLTT-Italic')` |
| 700 | `local('AkkuratLLTT-Bold')` | `local('AkkuratLLTT-BoldItalic')` |
| 900 | `local('AkkuratLLTT-Black')` | `local('AkkuratLLTT-BlackItalic')` |

Pour `'AkkuratLL-Light'`, la graisse 400 pointe aussi vers `AkkuratLLTT-Light` (le nom demande la Light).

- Résultat mesuré : PDF avec `AkkuratLLTT-Regular`, `AkkuratLLTT-Light`, `AkkuratLLTT-Bold` ; dans l'onglet, les faces `Akkurat 400` et `Akkurat 700` passent à `loaded`.
- Un poste sans les polices retombe sur Helvetica Neue, comme aujourd'hui. Le PDF du serveur est toujours en Akkurat.
- Les moteurs (`tplFont`, `svFontCss`…) ne sont **pas modifiés**.
- **Décision n° 2** : ce changement touche la typographie de toutes les impressions.

### 5.5 Outils JXA (`CH03_JXA`)

Script unique, lancé par `/usr/bin/osascript -l JavaScript -e <script> <op> <sortie> <entrées…>` (arguments reçus par `run(argv)` [P mesure]) :
- `pages <f…>` : `PDFDocument.pageCount` de chaque fichier (0,07 s pour 3 fichiers) ; fichier illisible → erreur « illisible » ;
- `fusion <sortie> <f1> <f2> …` : `insertPage:atIndex:` de toutes les pages, dans l'ordre, puis `writeToFile` ; fichier protégé (`isLocked`) → erreur ;
- `superposer <sortie> <base> <calque>` : contexte `CGPDFContextCreateWithURL` ; pour chaque page de la base, `CGPDFContextBeginPage` avec la **boîte de la page d'origine**, `CGContextDrawPDFPage`, puis, sur la dernière page, la page 1 du calque.
- Pièges vérifiés [P mesure] :
  - `CGPDFDocumentGetNumberOfPages` rend une **chaîne** en JXA : convertir (`+n`) avant de comparer ;
  - la boîte de page se passe en **données** sous la clé `"MediaBox"`, avec les 4 doubles (little-endian) en base64, lus par `NSData initWithBase64EncodedString`. La constante `$.kCGPDFContextMediaBox` et un rectangle passé par référence ne marchent pas (pages au format Letter 612 × 792).

---

## 6. Écrans et dialogues

### 6.1 Visionneuse (`ch03bView`, lot 2) [P `ui.ReportViewer`, `ui.Viewer`]

- **Fenêtre** : `dialog` de `min(1000px, 96vw)`, titre = `titre` (sinon le `<title>` du document).
- **Barre** (`phead`, icônes avec infobulle, de gauche à droite) :

| # | Élément | Action | Activation |
|---|---|---|---|
| 1 | « Imprimer » (icône `print`) [P `Viewer\|printing` ; § 1 n° 23] | `iframe.contentWindow.print()` : fenêtre d'impression du navigateur (« Enregistrer au format PDF » compris) | toujours |
| 2 | Zoom (liste) : 25 %, 50 %, 75 %, 100 %, **125 %**, 150 %, 200 %, 300 %, 400 % | `zoom` CSS du document = valeur × 0,75 (72/96 : 125 % donne 0,9375, taille voisine de l'original) ; mémorisé par poste (`ds_ch03_zoom`, lu et écrit sous `try`) | toujours |
| 3 | « PDF » (icône `pdf`) | **aperçu temporaire** : clic = « Ouvrir dans l'aperçu » ; **document enregistré** (`o.pdf`) : menu « Ouvrir dans l'aperçu » / « Sauvegarder et ouvrir » | grisé si le moteur PDF manque (§ 5.2), sauf l'aperçu (repli sur l'impression) |
| 4 | « Partager » ▾ (icône `share`) | 1. « Enregistrer le PDF en pièce jointe… » (seulement si `o.joindre` ou `o.pdf.dossier`) ; 2. « Partager le fichier PDF… » | voir § 6.3 et § 6.11 |

- **Corps** : `iframe` `sandbox="allow-same-origin allow-modals"` (scripts coupés ; impression permise), `srcdoc = ch03bHtml(src)`, hauteur 76vh.
- **Pied** : boutons de l'appelant (`o.boutons`, ex. « Modifier les textes… » de CH-01, qui reçoit `maj`), puis « Fermer » (Échap).
- **« Ouvrir dans l'aperçu »** : `const t=ch03aOnglet()` au clic ; toast « Création du PDF… » ; `ch03aPdf(html,{apercu:true})` ; `t.aller(ch03aUrl({apercu, nom:'DeltaSub PDF (dd.MM.yy HH-mm-ss).pdf'}))`. En cas d'erreur, onglet fermé et toast d'erreur (message du serveur).
- **« Sauvegarder et ouvrir »** : même chose sans `apercu`, puis `ch03aEnregistrer(o.pdf.dossier, ch03aNomPdf(o.pdf.nom), r, {remplacer:true, projet:o.pdf.projet, origine:'pdf'})` : **écrase sans demander**, comme l'original [P `Viewer.previewPdf@26-72`] ; puis ouverture.
- **Enregistrement inutile** : les documents de DeltaSub s'enregistrent à l'OK de leurs dialogues. Il n'y a donc ni « * » dans le titre ni « Voulez-vous enregistrer les modifications ? » (écart E2).

### 6.2 Interception des fenêtres d'impression (lot 2)

- **Déclaration** : `const CH03B_OPEN=(()=>{ … })();` remplace `window.open` par une enveloppe. Seuls `open('','_blank')` et `open(undefined,'_blank')` **sans troisième argument** sont interceptés, et seulement si `CH03B_ACTIF` est vrai. `open('')` (aperçu d'image de la Soumission) et toute URL passent tels quels.
- **Fausse fenêtre** (`ch03bWin()`), membres utilisés par les 24 appels et par CH-01 [P relevé : `document.open`, `document.write`, `document.close`, `document.body`, `print`, `focus`, `close`] :
  - `document.open()` : vide le tampon ;
  - `document.write(s)`, `writeln(s)` : ajoutent au tampon ;
  - `document.close()` : ouvre la visionneuse (la première fois), puis la met à jour ;
  - `document.body.textContent = m`, `innerHTML` : affiche le message dans la visionneuse (chemins d'erreur de `svDpPrint`) ;
  - `print()`, `focus()` : sans effet (la visionneuse attend « Imprimer », comme l'original attendait l'aperçu) ;
  - `close()` : ferme la visionneuse ;
  - `closed` (faux), `location` (affecter une URL ouvre un vrai onglet), `addEventListener`, `onload` : sans effet.
- **Contexte** : `ch03bContexte(o)` est lu à la création de la fausse fenêtre, puis effacé.
- **Capture** : pendant `ch03bCapture(fn)`, la fausse fenêtre rend le HTML au premier `document.close()` d'un document non vide, sans visionneuse. Un message (`body.textContent`) rejette la promesse avec ce message. `close()` sans contenu attend la fenêtre suivante (repli `o.fallback` de `svDpPrint`). Délai : 30 s.
- **Effet** : plus aucune impression bloquée par le navigateur. Les `toast('Fenêtre d’impression bloquée…')` existants deviennent inatteignables, sans modification.

### 6.3 « Enregistrer le fichier » / « Choix du fichier » (`ch03bNomDlg`) [P `files.PdfFilenameDialog`] [S `PdfFilenameDialog|*`]

| Élément | Mode `enregistrer` | Mode `choisir` |
|---|---|---|
| Titre | « Enregistrer le fichier » | « Choix du fichier » |
| En-tête | `o.entete` (« Enregistrer le PDF en pièce jointe », « Créer un fichier PDF à partir du document », « Enregistrer le bulletin de versement QR ») | `o.entete` (« Joindre QR-facture à un document ») |
| « Nom du fichier » | saisissable, règle FileNameGuard (64), prérempli par `o.nom` (vide pour « Enregistrer le PDF en pièce jointe… », `<nom du document>.pdf` pour « Enregistrer sous forme de fichier PDF… ») | grisé, rempli par la sélection |
| « Fichiers PDF » | liste du dossier « Nom du fichier \| Date de dernière modification », lignes **estompées** (opacité 0,5) ; clic ou double-clic → nom repris | lignes normales ; sélection → nom repris ; double-clic = OK |
| OK | actif si le nom rogné n'est pas vide ; « .pdf » ajouté ; nom déjà pris (casse ignorée) → « Le fichier existe déjà. Voulez-vous le remplacer ? » (Confirmation, Oui/Non) ; Non → reste ouvert | actif si une ligne est sélectionnée ; aucune question |
| Annuler | `null` | `null` |

**« Enregistrer le PDF en pièce jointe… »** (visionneuse) : dossier = `o.pdf.dossier`, sinon `o.joindre` (appelé d'abord s'il s'agit d'une fonction ; `null` → abandon). Puis ce dialogue en mode `enregistrer` (en-tête « Enregistrer le PDF en pièce jointe », nom vide), `ch03aPdf`, `ch03aEnregistrer(…, {remplacer})`. Toast « PDF enregistré : <nom> ».

### 6.4 « Nom du fichier » Bâtiment (`ch03bNouveauPdfDlg`) [P `deltabauad.util.NewPdfFilenameDialog`] [S `NewPdfFilenameDialog|*`]

- Titre et libellé « Nom du fichier » ; prérempli par le nom fourni (« Devis général », « Planificateur de coût »).
- OK : nom rogné ; caractère Bâtiment → « Le caractère ^0 ne doit pas être utilisé dans le nom du fichier. » (Erreur), dialogue gardé ouvert ; « .pdf » ajouté ; nom déjà pris dans le dossier → « Le fichier existe déjà. Voulez-vous le remplacer ? » (**Avertissement**, Oui/Non).

### 6.5 Panneau « Document » générique (`ch03cPanel`, lot 3) [P `files.DocumentReportPanel`] [S `DocumentReportPanel|*`]

- **Disposition** (celle de `ch01aPanel`, pour l'unité visuelle) : titre du panneau (`o.titre`) ; libellé « Document », **bouton principal** portant le nom du document, ou « Nouveau document » s'il n'y en a pas (clic : ouvre ou crée), bouton ▾ ; libellé « Fichiers PDF », zone § 6.6.
- **Menu ▾ du document**, dans cet ordre :

| Entrée | Active si |
|---|---|
| Nouveau document | aucun document, pas en lecture seule |
| Renommer le document… | un document, pas en lecture seule |
| Supprimer le document | un document, pas en lecture seule ; **ne supprime que le document, les PDF restent** [P `FileGroup.deleteDocument@0-49`] |
| — | |
| Ouvrir le document | un document |
| — | |
| Enregistrer sous forme de fichier PDF… | un document, moteur PDF disponible, pas en lecture seule |
| (entrées de l'appelant, `o.menuDoc`, après un séparateur) | selon l'appelant (ex. « QR-facture… ») |

- **« Enregistrer sous forme de fichier PDF… »** : `ch03bEnregistrerPdf` → dialogue § 6.3 (en-tête « Créer un fichier PDF à partir du document », nom `<nom du document>.pdf`) → PDF **sans ouvrir la visionneuse** [P `saveDocumentAsPdf@59-101`] → liste rafraîchie.
- **`o.dis`** : bouton principal et menus grisés (panneau qui dépend d'une ligne non sélectionnée) [P `checkGuards@0-37`].

### 6.6 Zone « Fichiers PDF » (`ch03cPdfZone`) [P `getPdfFilesPopupMenu@1-374`, `deletePdfFiles@1-119`]

- **Tableau** `grid` multi-sélection (Maj, Cmd), colonnes « Nom du fichier » | « Date de dernière modification » (210 px), ordre `String.compareTo`, sans tri par en-tête (`ctNoSort`) ; hauteur `o.hauteur` (défaut 96 px) ; vide : aucun texte.
- **Double-clic** = « Ouvrir » [D].
- **Glisser-déposer** d'un fichier PDF sur le tableau = « Import fichier PDF… » avec ce fichier [C] ; refusé en lecture seule.
- **Bouton ▾ « Fichiers PDF »**, dans cet ordre :

| Entrée | Active si | Action |
|---|---|---|
| Ouvrir | exactement 1 sélection | `ch03aOuvrir` (onglet) |
| Partager le fichier PDF… | au moins 1 | § 6.10 |
| — | | |
| Import fichier PDF… | dossier défini, pas en lecture seule | § 6.8 |
| Fusionner PDF… | au moins 2, pas en lecture seule | § 6.9 |
| Supprimer | au moins 1, pas en lecture seule | 1 fichier : « Voulez-vous supprimer ce fichier définitivement ? » ; n fichiers : « Voulez-vous supprimer ^0 fichiers définitivement ? » (Avertissement, Oui/Non) → `ch03aSupprimer` (un commit) [S `Strings\|msgDeleteFileDefinitely`, `msgDeleteFilesDefinitely`] |

- **Rafraîchissement** : un seul écouteur `DS.on` pour toutes les zones (ensemble `CH03C_ZONES`) ; il redessine les zones affichées quand `depotfichier` change, et oublie celles qui ne sont plus dans la page. La sélection est gardée par `ID`.
- **Chargement** : si `depotfichier` n'est pas prête, « Chargement des fichiers… », puis `ch03aPret()` et redessin.

### 6.7 « Nom du document » (`ch03cNomDocDlg`) [P `files.DocumentNameDialog`] [S `DocumentNameDialog|*`]

- Titre « Nom du document » ; libellé d'en-tête = `titre` (« Nouveau document » / « Renommer le document ») ; champ « Nom », prérempli.
- Frappe : règle FileNameGuard (64) ; caractère retiré → « Caractère incorrect: x » sous le champ, masqué à la touche suivante.
- OK actif si le champ n'est pas vide ; valeur rognée. Annuler / Échap → `null`.
- CH-01 garde son propre `ch01aNameDlg` (même comportement, sans le message) ; les nouveaux panneaux utilisent celui-ci.

### 6.8 « Import fichier PDF… » et « Fichiers PDF » (autre dossier) [P `FileGroup.importPdfFile@0-29`, `copyFile@1-118`, `files.ImportPdfFileDialog`]

- **« Import fichier PDF… »** : sélecteur du système (`<input type=file accept=".pdf,application/pdf">`, un seul fichier) ; nom du fichier choisi (NFC) ; nom déjà pris → « Le fichier existe déjà. Voulez-vous le remplacer ? » (Confirmation, Oui/Non) ; `ch03aDeposer(…, {origine:'import', remplacer})` ; toast en cas de refus du serveur.
- **« Fichiers PDF »** (`ch03cImporterDe`) : titre « Fichiers PDF » ; liste du dossier source « Nom du fichier | Date de dernière modification » ; OK si une ligne est sélectionnée ; double-clic = OK ; même question de remplacement ; `ch03aCopier` (aucun octet copié).

### 6.9 « Fusionner PDF » (`ch03cFusionDlg`) [P `files.MergePdfFilesDialog`] [S `MergePdfFilesDialog|*`, `DocumentReportPanel|mergePdfsTitle`]

- Titre « Fusionner PDF » ; en-tête **« Fichiers PDF et pièces jointes au document »**.
- Tableau des PDF sélectionnés, **dans l'ordre de la liste d'origine** [P `getSelectedFiles@9-85`], « Nom du fichier | Date de dernière modification ».
- Boutons Premier (▲▲), Monter (▲), Descendre (▼), Dernier (▼▼), Retirer (−), en boutons texte (`ICO` n'a pas d'icône « bas »), infobulles « Premier », « Monter », « Descendre », « Dernier », « Retirer » [C]. Retirer : une ligne sélectionnée ; ▲▲ et ▲ : pas la première ; ▼ et ▼▼ : pas la dernière.
- « Nom du fichier » (vide, sauf `o.nom`) ; **OK actif si au moins 2 lignes et un nom**.
- OK : nom rogné + « .pdf » ; nom déjà pris → « Le fichier existe déjà. Voulez-vous le remplacer ? » (Confirmation) ; `ch03aFusion(shas dans l'ordre affiché)` ; `ch03aEnregistrer(dossier, nom, r, {origine:'fusion', remplacer})`. Les sources restent.
- Échec : toast avec le message du serveur (l'original n'affichait rien : écart E6).

### 6.10 « Partager le fichier PDF » : fichiers enregistrés (`ch03cPartager`) [P `files.SharePdfsDialog`] [S `SharePdfsDialog|*`]

| Zone | Élément | Règle |
|---|---|---|
| — | « Fichiers PDF » | `ch03cListeNoms` : moins de 4 fichiers → noms séparés par « , » ; sinon « <n> Fichiers PDF » [P `<init>@353-488`] |
| — | « Modifié le » | date la plus récente des fichiers, `d. MMMM yyyy, HH:mm` |
| « Exporter le fichier PDF » | « Fichiers PDF » (emplacement) | « Téléchargements (navigateur) », non modifiable [C] |
| | **Enregistrer** | actif s'il y a des fichiers ; télécharge chaque fichier sous son nom, sans question |
| « Message par courrier » | « À » + ▾ | suggestions `<désignation> <<courriel>>` (`o.contacts`) ; clic : « À » reçoit le courriel, « Civilité courrier » la civilité ; ▾ actif si des contacts sont fournis |
| | « Civilité courrier », « Concerne », « Contenu » | textes libres ; « Concerne » prérempli par `o.concerne` ; « Contenu » multiligne avec bouton « … » : dialogue « Blocs de texte » (`ch03cBlocs`) limité aux groupes de type **texte** (`boilerplategroup.TYPECODE = 0`), insertion à la position du curseur [P `SharePdfDialog.jInsertTextButtonActionPerformed@1-8` : `BoilerplateBrowserDialog.openDialogAndInsertText(…, BoilerplateGroup$Type.text, …)` ; `$Type.<clinit>` : text = 0, planningText = 1]. `ppTextBrowse` ne convient pas : il est fixé sur le type 1 (`PP_BPTYPE`). Au bureau : 1 groupe, de type 0 |
| | **« Préparer le courrier »** | actif dès qu'il y a des fichiers ; télécharge les fichiers pas encore exportés dans ce dialogue, puis ouvre `ch03cMailto(À, Concerne, ch03cTexte(Civilité, Contenu))` ; toast « Joignez au message les fichiers téléchargés. » [C, D8] |
| Pied | « Fermer » (Échap) | |

« Utiliser Apple Mail » et « Afficher le dossier » ne sont pas affichés (§ 2.2).

### 6.11 « Partager le fichier PDF » : aperçu de la visionneuse (`ch03cPartagerApercu`) [P `ui.SharePdfDialog.<init>@16-246`, `checkGuards@1-186`, `savePdfFile@1-133`] [S `SharePdfDialog|*`]

| Zone | Élément | Règle |
|---|---|---|
| — | « Document PDF » + ▾ (« Ouvrir le document ») ; « Modifié le » | date du PDF créé dans ce dialogue, `d. MMMM yyyy, HH:mm`, sinon « - » ; ▾ actif quand le PDF existe |
| « PDF en pièce jointe » | « Emplacement » | « Téléchargements (navigateur) » [C] |
| | « Nom du fichier » (128) + ▾ (« Ouvrir le document ») | mémorisé par poste (`ds_ch03_share_nom`) |
| | **Enregistrer** (bouton par défaut au départ) | actif si le nom n'est pas vide ; `ch03aPdf(html)` puis téléchargement sous `ch03aNomPdf(nom)` ; « Pièce jointe » reçoit le nom ; « Préparer le courrier » devient le bouton par défaut |
| « Message par courrier » | « À » + ▾, « Civilité », « Concerne », « Contenu » + « … », « Pièce jointe » (non modifiable) | comme § 6.10 ; « Concerne » : `o.concerne`, sinon le dernier saisi sur ce poste (`ds_ch03_share_concerne`) |
| | **« Préparer le courrier »** | actif seulement quand la pièce jointe existe (il faut enregistrer d'abord) ; `mailto:` ; toast « Joignez au message le fichier téléchargé : <nom>. » |
| Pied | « Fermer » | |

### 6.12 Construction du courrier (`ch03cMailto`, `ch03cTexte`) [P § 1 n° 15, 16]

- Texte = `ch03cTexte(civ, contenu)` : on part d'un texte vide ; pour `civ` puis `contenu`, si la partie n'est pas vide : saut de ligne si le texte n'est pas vide, puis la partie, puis un saut de ligne. D'où `civ\n\ncontenu\n`, `contenu\n` ou `civ\n`.
- URL : `'mailto:' + (À rogné ? enc(À) : '%20') + (Concerne non vide ? '?Subject='+enc(Concerne) : '') + (texte non vide ? (Concerne non vide ? '&' : '?')+'Body='+enc(texte) : '')`.
  - `enc` = `encodeURIComponent`, puis « %40 » → « @ », « %2C » → « , », « %3B » → « ; » dans le champ « À » seulement.
  - Les sauts de ligne du texte deviennent CRLF (`%0D%0A`), comme le demande la RFC 6068 [C].
- Ouverture : `location.href = url` (aucun onglet vide).

### 6.13 Annexes de contrat du contrôle des coûts (lot 4) [P `cc.ContractBookDialog`, `cc.AttachmentDialog`, `cc.AttachementNameDialog`] [S `ContractBookDialog|numOfAttachment`, `AttachmentDialog|*`, `AttachementNameDialog|*`]

- **Dans la fiche du contrat** (`ccContract`), après « Délai de garantie » : ligne « Annexes: » + « n » + bouton « … » ; `n` = nombre d'annexes.
- **Dialogue « Document »** : tableau « Document | Emplacement » (`v.annexes`, champs `nom` et `chemin`) ; boutons :
  - « Ajouter une annexe » ;
  - « Editer l'annexe » (une ligne) ;
  - « Supprimer l'annexe » (une ligne) : « Voulez-vous vraiment supprimer cette annexe? » ;
  - « Ouvrir l'annexe » (une ligne) : sans emplacement, « Vous n'avez pas défini l'emplacement de l'annexe. » ; sinon `ch03aOuvrir({ref:chemin})` ; refus du serveur (403, 404) affiché tel quel ;
  - « Afficher l'annexe » (une ligne) : le navigateur ne peut pas montrer le dossier. Un dialogue « Emplacement » affiche le chemin complet, avec « Copier » (`ctCopy`) [C].
- **Fiche « Nouvelle annexe » / « Editer l'annexe »** : « Titre du document » ; « Fichier / Emplacement » (texte saisi ou collé : le navigateur ne donne pas le chemin d'un fichier choisi, d'où le bouton « Définir l'emplacement » grisé avec l'infobulle « Collez le chemin du fichier (le navigateur ne donne pas les chemins). ») [C] ; case « Utiliser l'emplacement relatif au dossier d'affaire » (`relatifDossierAffaire`, conservée, sans effet : `DEFAULTPATH` type 2 est vide au bureau). « Référence sur un fichier » n'est pas affichée [D : option de la liste, toujours vraie au bureau].
- **Enregistrement** : les modifications vont dans `v.annexes` et sont enregistrées **avec le contrat**, à l'OK de sa fiche (`Object.assign(c, v)`).

### 6.14 Messages exacts (récapitulatif)

| Message | Titre | Source |
|---|---|---|
| Le fichier existe déjà. Voulez-vous le remplacer ? | Confirmation (Avertissement dans le Bâtiment) | [S `Strings\|msgFileAlreadyExists`] |
| Voulez-vous supprimer ce fichier définitivement ? / Voulez-vous supprimer ^0 fichiers définitivement ? | Avertissement | [S `Strings\|msgDeleteFileDefinitely`, `msgDeleteFilesDefinitely`] |
| Cette inscription ne peut pas être effacée, car il existe encore des documents ou des fichiers PDF. | Information | [S `Strings\|msgFileGroupNotEmpty`] (pour les appelants) |
| Caractère incorrect: x | (sous le champ) | [S `Strings\|msgIllegalCharacter`] + recette « \u0001: \u0001 » |
| Le caractère ^0 ne doit pas être utilisé dans le nom du fichier. | Erreur | [S `ElementDocumentsFrame\|msg8`] |
| Le fichier ^0 n'existe pas. | Information | [S `Strings\|msgFileNotFound`] |
| Voulez-vous vraiment supprimer cette annexe? | Avertissement | [S `AttachmentDialog\|msg1`] |
| Vous n'avez pas défini l'emplacement de l'annexe. | Information | [S `AttachmentDialog\|msg9`] |
| Création du PDF… · PDF enregistré : <nom> · Joignez au message le(s) fichier(s) téléchargé(s)… · Le Mac Studio ne peut pas créer de PDF (Chrome introuvable)… | toasts | [C] |
| Messages des routes (§ 3.1) | toast d'erreur | [C] |

---

## 7. Documents produits

Le socle n'a **pas de document imprimé à lui**. Il fixe les propriétés des fichiers qu'il produit :
- **PDF généré** : format et marges de `@page` du document (A4 portrait ou paysage, pages nommées de `svDpDocHTML`), boîtes de marge (`mgPrint` : utilisateur, « page | pages »), aucune en-tête ni pied ajoutés par Chrome, polices embarquées en sous-ensemble (Akkurat du bureau par l'alias), titre = `<title>`, producteur « Skia/PDF m154 ». Pas de protection ni de signet, comme l'original [P `doc.pdf.Report` : `protectDocument` jamais appelé ; `doc.zutil.PDFMerger`, `CreateBookmarks` jamais appelés].
- **PDF fusionné** : pages des sources dans l'ordre choisi, sans signet ; PDF 1.3 écrit par PDFKit ; taille voisine de la somme des sources (189 821 o pour 2 × 81 890 o ; PDFBox donnait 162 327 o).
- **Superposition QR** : format de chaque page de la base conservé ; la page 1 du calque est dessinée telle quelle par-dessus la dernière page. Le calque est un PDF A4 **sans aucun fond**, qui ne porte que la section de paiement 210 × 110 mm (trait et ciseaux compris) collée au bas de la page : **rien n'est masqué**, ce qui se trouvait dans ces 110 mm reste visible dessous, exactement comme `QRBill.appendBillOnly(…, lastPage)` (`APPEND`, aucun remplissage) [P § 1 n° 21]. « Comme nouvelle page à la fin » : le même calque ajouté comme page A4. Le calque lui-même est fabriqué par CH-11 (`qrPageHTML` ou `qrPrintSVG` en A4, fond transparent).
- **Conteneur `.dpdoc`** (reprise seulement) : archive zip `report.json`, `data.json` (`{}` au bureau), `images/…` ; conservé tel quel, jamais lu par ce chantier [P rech_orig § 1.3].

---

## 8. Valeurs de contrôle

### 8.1 Tests jsc (fonctions pures, fixture sans donnée personnelle)

| # | Lot | Appel | Attendu |
|---|---|---|---|
| T-A1 | 1 | `ch03aDossier('facture',911,1051)` · `('contrat',1401,352)` · `('document',911,151)` · `('coco',1401,2601,'award/contractSheet_7554_2')` · `('devis',902,7004)` · `('devis',902,7004,'archive')` · `('eccc',P,202,'docs')` | `ProjectDocuments/Documents/911/Invoices/1051` · `ProjectDocuments/Documents/1401/Contracts/352` · `ProjectDocuments/Documents/911/Documents/151` · `Construction/Costcontrol/1401/2601/coco/award/contractSheet_7554_2` · `Construction/Costestimate/902/7004/documents` · `…/documents/archive` · `Construction/Costplanning/P/202/docs` |
| T-A2 | 1 | `ch03aNomPdf('  Facture 12 ')` · `('x.PDF')` · `('rest')` | `Facture 12.pdf` · `x.PDF` · `rest.pdf` |
| T-A3 | 1 | `ch03aFiltreNom('', 'a<b>:c"d/e\|f\\g?h*i')` | `{nom:'abcdefghi', rejet:'*'}` |
| T-A4 | 1 | `ch03aFiltreNom('x'.repeat(60), 'x'.repeat(66))` | `nom` = 60 caractères (insertion refusée) |
| T-A5 | 1 | `ch03aNomBatiment('Devis;1')` · `('Devis\\1')` · `('Devis 1')` | `';'` · `null` · `null` |
| T-A6 | 1 | `ch03aDate('2025-10-06T09:10:05')` | `06.10.2025 09:10` |
| T-A7 | 1 | tri de `['rest.pdf','Devis général2.pdf','arrêté.pdf','Devis général.pdf','Arrêté.pdf']` | `Arrêté.pdf`, `Devis général.pdf`, `Devis général2.pdf`, `arrêté.pdf`, `rest.pdf` |
| T-A8 | 1 | `ch03aTrouve` sur « Arrêté de compte.pdf » cherché en NFD et en minuscules | trouvé |
| T-A9 | 1 | `ch03aUrl({sha:'9c91…',nom:'Arrêté de compte.pdf'},true)` | `/api/file?sha=9c91…&nom=Arr%C3%AAt%C3%A9%20de%20compte.pdf&dl=1` |
| T-B1 | 2 | `ch03bHtml('<!doctype html><html><head><title>x</title>…')` · `ch03bHtml('\ufeff <!DOCTYPE html>…')` · `ch03bHtml('<p>x')` | alias inséré juste après le doctype · après le doctype (BOM et espaces gardés) · tout au début |
| T-B2 | 2 | correspondance du zoom 25/100/125/400 | 0,1875 / 0,75 / 0,9375 / 3 |
| T-B3 | 2 | fausse fenêtre : `write`+`close` · `write`(attente)+`open`+`write`+`close` (motif `svDpPrint`) · `body.textContent` · `close()` | 1 ouverture, contenu écrit · contenu final seul · message · fermeture |
| T-B4 | 2 | `ch03bCapture` : moteur synchrone ; moteur asynchrone (après une promesse) ; repli `close()` puis nouvelle fenêtre | HTML final dans les trois cas |
| T-B5 | 2 | interception : `open('','_blank')` · `open('')` · `open('about:blank','_blank')` · `open('','_blank','width=1')` | fausse · vraie · vraie · vraie |
| T-C1 | 3 | `ch03cListeNoms` sur 3 puis 4 noms | `a.pdf, b.pdf, c.pdf` · `4 Fichiers PDF` |
| T-C2 | 3 | `ch03cTexte('Madame,','Veuillez trouver ci-joint')` · `('','X')` · `('Madame,','')` | `Madame,\n\nVeuillez trouver ci-joint\n` · `X\n` · `Madame,\n` |
| T-C3 | 3 | `ch03cMailto('a@b.ch, c@d.ch','Facture 12','L1\nL2\n')` | `mailto:a@b.ch,%20c@d.ch?Subject=Facture%2012&Body=L1%0D%0AL2%0D%0A` |
| T-C4 | 3 | `ch03cMailto('','','X\n')` | `mailto:%20?Body=X%0D%0A` (l'original donnerait `mailto:%20&Body=…`) |
| T-C5 | 3 | règles d'activation du menu « Fichiers PDF » (0, 1, 2 sélections ; lecture seule) | § 6.6 |
| T-C6 | 3 | fusion : ordre après ▲▲ sur la 3e ligne de [a, b, c] ; OK après Retirer jusqu'à 1 ligne | [c, a, b] ; OK grisé |
| T-D1 | 4 | `ch03dCocoDossier(E,'award/contractSheet_7554_2')` avec `E.p.ID=1401, E.id=2601` | `Construction/Costcontrol/1401/2601/coco/award/contractSheet_7554_2` |
| T-D2 | 4 | concerne CoCo : libellé « Contrat », affaire `NUMBER`, `SORTLABEL` | `Contrat <NUMBER> <SORTLABEL>` (vide pour une valeur nulle, jamais « null ») |

### 8.2 Tests du serveur (copie isolée, fichiers du bureau copiés dans le dossier d'essai puis supprimés)

Empreintes tronquées à 16 caractères ; les valeurs complètes sont recalculées par le test.

| # | Contrôle | Valeur attendue |
|---|---|---|
| S1 | aller-retour : `Costestimate/902/7004/documents/estimate.pdf` | `sha` `4d22a51ce4b7ca3d…`, `taille` 81 890, `pages` 13 ; octets relus identiques |
| S2 | `Costestimate/1401/3652/documents/estimate.pdf` | `9c91b6967493926e…`, 75 540 o, 8 pages |
| S3 | déduplication : même fichier envoyé deux fois ; `estimate.pdf` de 1401/3652, 3901, 3951 et 4001 | même `sha`, **un seul** fichier dans `objets/` |
| S4 | fusion `archive/Devis général.pdf` (`6affffc35f5c723f…`, 13 p) + `Devis général2.pdf` (`6dd440bc678e7bfb…`, 13 p) de 902/7004 | **26 pages** (comme `rest.pdf` du bureau, `77b87d925135decc…`, 26 p, 162 327 o) |
| S5 | fusion d'un PDF 1.4 à table xref (contrat `1401/2601/…/contractSheet_7554_2/Contrat.pdf`, 45 924 o, 2 p) et d'un PDF 1.7 à flux d'objets (facture d'entrepreneur `3701/4954/…/entrepreneurInvoices/1`, 405 186 o, 10 p) | **12 pages** |
| S6 | superposition : base de synthèse (page A4 entièrement colorée, `spec_work/qrt/base.html`) + calque QR de synthèse à fond transparent (`qrt/calque.html`, section 210 × 110 mm) | 1 page, **595 × 842** conservé ; trait et texte de la section visibles ; **fond de la base toujours visible** sous la section (pixels à 80 % et 95 % de la hauteur : (187, 38, 26), comme à 20 %) |
| S7 | `/api/pdf` : HTML de synthèse avec alias (`ch/CH-03/spec_work/t1.html`) | 2 pages ; polices `AkkuratLLTT-Regular`, `-Light`, `-Bold` ; page A4 paysage → 842 × 595 ; titre = `<title>` |
| S8 | politique de sécurité : document dont un script ajoute 4 sauts de page | **1 page** (5 sans la politique) |
| S8b | `iframe src="file://<dossier d'essai>/temoin.txt"` placé **avant** `<head>` (`spec_work/sec/a.html`, sans la politique) | texte du PDF (PDFKit `string`) **sans** le texte témoin (avec l'ancienne règle « après `<head>` » : présent) |
| S8c | `<META HTTP-EQUIV=Refresh CONTENT="0;url=file://…">` | balise retirée ; PDF produit (et non 504) |
| S9 | refus : `nom=../x.pdf`, `nom=.x.pdf`, `nom=x.html`, PDF sans `%PDF-`, corps de 26 Mo | 400, 400, 415, 415, 413 |
| S10 | `GET` d'un `sha` inconnu ; `Content-Disposition` de « Arrêté de compte.pdf » | 404 ; `filename*=UTF-8''Arr%C3%AAt%C3%A9%20de%20compte.pdf` |
| S11 | `ref` sans `DELTASUB_ANNEXES` ; avec la racine autorisée : chemin dedans, chemin dehors (`/etc/hosts`), chemin avec `..` | 403 ; 200 ; 403 ; 403 |
| S12 | sauvegarde : après un envoi et un commit, appel direct de `ch03_sauvegarde` ; serveur lancé avec `DELTASUB_DB=<dossier d'essai>/deltasub.sqlite` | contenu présent dans `<dossier d'essai>/Sauvegarde DeltaSub/fichiers/objets/<2>/<sha>` ; **rien** sous le `BACKUP_DIR` du script (§ 4.6) |
| S13 | Chrome absent (`DELTASUB_CHROME=/inexistant` et chemins masqués) | `GET /api/pdf` → `chrome:null` ; `POST /api/pdf` → 503 |
| S14 | reprise `--essai` sur `Backup/2026-09-28 23-00-00/DELTAProjectFiles` | **152 PDF** (contrôle des coûts 139 : award 85, finalpayment 31, entrepreneurInvoices 8, paymentorder 7, overview 5, payments 3 ; devis 13), **48 contenus distincts, 3 174 502 o** ; avec `--avec-dpdoc` : + 347 `.dpdoc` (283 + 59 + 4 + 1) |
| S15 | reprise réelle sur base d'essai, lancée deux fois | 1re : 152 ajoutés ; 2e : 0 ajouté, 152 ignorés ; un fichier déposé avant sous le même nom n'est pas écrasé |

### 8.3 Essais navigateur (copie isolée, un port par lot, onglet propre, utilisateur 2752)

| # | Lot | Scénario | Attendu |
|---|---|---|---|
| N1 | 1 | console : `await ch03aPret()` ; `ch03aDeposer(dossier de synthèse, 'essai.pdf', <PDF de /api/pdf>)` ; relire `ch03aFichiers` ; `fetch(ch03aUrl(rec))` | enregistrement présent ; octets identiques ; `DS.S` à jour |
| N2 | 1 | `ch03aEnregistrer` du même nom sans `remplacer`, puis avec | rejet `existe` ; remplacement, même `ID` |
| N3 | 2 | Gestion ▸ impression de la liste des affaires (`printProjects`), puis un document Management (`mgPrint`), un document de Soumission (`svDpPrint`) | visionneuse ouverte, contenu identique à l'ancienne fenêtre, aucune fenêtre surgissante ; fausse fenêtre déjà validée : HTML de 830 caractères capté et `print()` intercepté (essai de ce cahier) |
| N4 | 2 | zoom 25 % à 400 %, rechargement de la page | zoom retrouvé |
| N5 | 2 | « Ouvrir dans l'aperçu » | onglet avec le PDF (le panneau de l'agent bloque `window.open` : vérifier la réponse de `/api/pdf` et le lien produit) |
| N6 | 2 | polices : `iframe.contentDocument.fonts` après chargement | faces Akkurat `loaded` (essai de ce cahier : `Akkurat 400` et `700` `loaded`) |
| N7 | 3 | panneau de démonstration (console) : Nouveau, Enregistrer sous forme de fichier PDF…, Import (glisser un PDF de synthèse), Fusionner (2 fichiers), Supprimer (2 fichiers : message au pluriel) | liste rafraîchie après chaque action ; menus activés selon § 6.6 |
| N8 | 3 | « Partager le fichier PDF » (fichiers et aperçu) : champs, suggestions, « Préparer le courrier » | URL `mailto:` correcte (lue dans `location.href` interceptée par le test) |
| N9 | 4 | contrôle des coûts ▸ ADJUDICATIONS ▸ Documents (CH-01 intégré) : ouvrir un Contrat, « Sauvegarder et ouvrir » | `Contrat.pdf` dans la liste « Fichiers PDF » du panneau ; « PDF disponible » vrai |
| N10 | 4 | fiche d'un contrat du CC 3601 (22 annexes au bureau) | « Annexes: 22 » ; dialogue « Document » : 22 lignes ; « Ouvrir l'annexe » → 403 (réglage absent), puis 200 avec `DELTASUB_ANNEXES` réglé sur la copie de test |

---

## 9. Défauts de l'original et écarts assumés

### 9.1 Défauts de l'original (traitement)

| # | Défaut | Traitement |
|---|---|---|
| F1 | `mailto:` sans « ? » quand Concerne est vide et le texte ne l'est pas (`mailto:x&Body=…`) [P § 1 n° 15] | **corrigé** |
| F2 | « Fusionner PDF » : une erreur d'entrée-sortie ne produit qu'une trace, sans message [P rech_orig § 5.1] | **corrigé** : toast |
| F3 | Nom proposé « TODO Merged.pdf » dans la Soumission [P `d18.TenderingFrame.mergePdfFiles@139`] | à trancher par EC-1 (spec_11 le corrige) |
| F4 | « OK » de « Nom du document » actif pour un nom fait d'espaces (test `isEmpty` avant `trim`) [P `DocumentNameDialog.checkGuards`] | **corrigé** : test sur le nom rogné |
| F5 | Renommer un document « perd » son PDF officiel (nom dérivé) | **reproduit** (fidèle, rare) |
| F6 | Libellés « Choisir l'mplacement », « Mail standard standard (sans annexe) » | sans objet (non affichés) |

### 9.2 Écarts assumés

| # | Écart | Raison |
|---|---|---|
| E1 | Pas de dossier partagé : contenus par empreinte, arborescence dans `depotfichier` | robustesse, déduplication, sauvegarde incrémentale |
| E2 | Pas de « * » dans le titre ni de question à la fermeture de la visionneuse | les documents DeltaSub s'enregistrent à l'OK de leurs dialogues |
| E3 | Pas de navigation par page ni d'affichage « page n » dans la visionneuse | document HTML continu à l'écran |
| E4 | « Emplacement » = téléchargements du navigateur ; « Afficher le dossier » absent | le navigateur choisit le dossier |
| E5 | « Utiliser Apple Mail » absent ; pièces jointes à glisser à la main | D8 |
| E6 | Messages d'erreur du serveur (limites, types, moteur absent) | propres à DeltaSub |
| E7 | « Imprimer » aussi pour les documents au nouveau format (l'original ne l'a que dans l'ancienne visionneuse DESIGN) | une seule visionneuse ; le navigateur imprime directement |
| E8 | ⌘W et ⌘S non repris ; Échap ferme | raccourcis réservés au navigateur |
| E9 | « Définir l'emplacement » des annexes grisé, chemin collé à la main | le navigateur ne donne pas les chemins |
| E10 | PDF fusionnés en PDF 1.3 (PDFKit) au lieu de PDF 1.6 (PDFBox) | outil de macOS, rendu identique |

---

## 10. Écarts hors chantier signalés (non traités)

1. **Police des impressions** : sans l'alias (décision n° 2), toutes les impressions restent en Helvetica Neue au lieu de l'Akkurat du bureau (mesure, § 5.4). Les impressions faites **hors** visionneuse (aucune après le lot 2) ne sont plus concernées.
2. **`svdDocNameDlg` (Soumission)** applique la règle FileNameGuard, alors que `devis18.posedit.DocNameDialog` applique la règle Bâtiment (`;` refusé, `\` accepté). À corriger par EC-1.
3. **`mailList` et `copyTable`** utilisent `navigator.clipboard` sans repli, indisponible sur les postes (`http://<Mac-Studio>.local:7790` n'est pas un contexte sûr) ; `ctCopy` a le repli. Hors chantier (CH-04 ou CH-10).
4. **Pièces d'article de la Soumission** : images en base64 dans le JSON `soumission` (500 Ko chacune). À migrer vers le dépôt par EC-1 lot 4 (`ch03aDeposer`).
5. **Contrôle des coûts, statut 3** affiché « Etat intermédiaire » au lieu de « Terminé » (spec_12 § 0 n° 10) : rappel, CH-07.
6. **CH-11 (spec_16)** :
   - le verrou de l'offre d'honoraires (§ 2.3 et « Non livré » du § 16) est attribué à « CH-03 (verrou) » : il relève de **CH-10 lot 3** (`ch10cGate`, `ch10cAcquire`, collection `documentlock`) ;
   - « Afficher le dossier » et « Partager le fichier PDF individuellement… » ne sont pas livrés par CH-03 (§ 3.5) ;
   - § 10.3 : le format 210 × 110 mm est confirmé ; le calque doit avoir un fond **transparent** (§ 1 n° 21) ;
   - l'adaptateur `ch11dFS` trouve sa table de correspondance au § 3.5.
7. **CH-07** : ajouter à son lot 3 (liste et domaine d'affaire) la **corbeille en deux temps** du contrôle des coûts (affichage Alt/Ctrl, restauration par « Editer »), aujourd'hui suppression en un temps sans retour (§ 1 n° 26).
8. **CH-08** : garder la signature `ch08_gate(h, c, u)` de spec_18 (S8) ; `ch03_post` l'appelle pour les routes POST de fichiers (§ 1 n° 24).

---

## 11. Points d'ancrage DeltaSub

Unicité vérifiée par `grep -F -c` = 1 sur `DeltaSub.html` et `serveur_deltasub.py` du 30.09.2026 (md5 ci-dessus), et sur `ch/CH-01/lot1.js` (11 h 51) pour B1 à B4.
- Le `build.py` de chaque lot prend le chemin du `DeltaSub.html` source en argument (défaut : celui du dépôt). Il vérifie chaque ancre (compte = 1) et **échoue proprement** si une ancre manque ou est multiple : message, code de sortie non nul, aucun fichier écrit.
- Chaque « nouveau » **contient l'« ancien » intact** (insertion avant ou après), pour ne pas gêner les autres chantiers.
- **Les lots 1 à 3 n'ont aucune ancre dans le code existant** : seulement A0 (insertion du code). L'interception (`CH03B_OPEN`) et le chargement de `depotfichier` (`CH03A_T`) sont des déclarations de haut niveau, sans accès au DOM : `CH03B_OPEN` enveloppe `window.open` (objet global, pas le DOM) et `CH03A_T` ajoute une clé à `DS.loaded`, un `Set` créé une seule fois et complété par `DS.boot()` (vérifié : l'ajout fait avant `boot()` est conservé, et le sondage suit la collection même vide).
- **Ancres serveur partagées** : CH-02 (S2 de spec_15) et CH-11 (S1 de spec_16) ajoutent eux aussi une ligne après l'ancre S1 (`… "soumissionhist"}`), CH-08 (S9) et CH-10 (S2) un préfixe avant l'ancre S4. Chacun garde l'ancre intacte : l'ordre d'application est indifférent. La ligne S3 est placée après le point S8 de CH-08 (préfixe de `if u.path == "/api/ping":`), donc derrière son contrôle de session.

| # | Lot | Fichier | Ancre exacte (« ancien ») | « Nouveau » |
|---|---|---|---|---|
| A0 | 1-4 | `DeltaSub.html` | ligne `   DÉMARRAGE` | code du lot inséré **avant** la ligne `/* ═══…` qui ouvre ce commentaire (convention CH-01, CH-02, CH-17) |
| S1 | 1 | serveur | `"projecttenderer", "devisdocument", "soumission", "soumissiondoc", "soumissionhist"}` | l'ancien, puis la ligne `PROTECTED \|= {"depotfichier"}   # CH-03 : métadonnées du dépôt de fichiers (jamais vidées au ré-import)` |
| S2 | 1 | serveur | `# ─────────── HTTP ───────────` | bloc `# ── CH-03 ──` (§ 4.8), puis l'ancien |
| S3 | 1 | serveur | `            f = STATIC.get(u.path)` | `            if u.path in ("/api/file", "/api/pdf"):` / `                return ch03_get(self, u, q)` puis l'ancien |
| S4 | 1 | serveur | `        if urlparse(self.path).path != "/api/commit":` | `        if urlparse(self.path).path in CH03_POST:` / `            return ch03_post(self, urlparse(self.path).path)` puis l'ancien |
| S5 | 1 | serveur | `                last = seq` | `                ch03_sauvegarde()` puis l'ancien |
| S6 | 1 | serveur | `    srv.serve_forever()` | ligne d'information (`Fichiers : <dossier> — PDF : Chrome <version> \| impression du navigateur`) puis l'ancien |
| B1 | 4 | `DeltaSub.html` (code CH-01) | `{t:'Enregistrer sous forme de fichier PDF…',dis:true}` | `{t:'Enregistrer sous forme de fichier PDF…',dis:!d\|\|typeof ch03dCocoPdfSave!=='function',fn:()=>ch03dCocoPdfSave(o)}` |
| B2 | 4 | idem | `lbl('Fichiers PDF'),pdf,pm)` | `lbl('Fichiers PDF'),...(typeof ch03dCocoZone==='function'?ch03dCocoZone(o,dis):[pdf,pm]))` |
| B3 | 4 | idem | `return ch01aView(r.doc.nom,R,{edit:upd=>{` | `return ch01aView(r.doc.nom,R,{pdf:typeof ch03dCocoPdf==='function'?ch03dCocoPdf(o,r):null,edit:upd=>{` |
| B4 | 4 | idem | `function ch01aView(titre,R,o){ o=o\|\|{};` | l'ancien + ` if(typeof ch03bView==='function') return ch03bView(titre,R,{pdf:o.pdf,concerne:o.pdf&&o.pdf.concerne,contacts:o.pdf&&o.pdf.contacts,boutons:o.edit?[{t:'Modifier les textes…',fn:maj=>o.edit(maj)}]:[]});` |
| B5 | 4 | `DeltaSub.html` (`ccContract`) | `formRows([['Description',dsc],['Délai de garantie',gar]],420)` | `formRows([['Description',dsc],['Délai de garantie',gar],...(typeof ch03dAnnexesRow==='function'?[ch03dAnnexesRow(v,C)]:[])],420)` |

- **Réutilisés sans modification** : `h`, `esc`, `num`, `cmp`, `dfr`, `today`, `toast`, `ibtn`, `popMenu`, `closeMenus`, `dialog`, `confirmDlg`, `ivAsk`, `ctMsg`, `ctOk`, `ctBox`, `ctCopy`, `ctNoSort`, `grid`, `gridSel`, `phead`, `formRows`, `ppBpItems`, `ppBox`, `ppOk`, `contactName`, `svDpDocHTML`, `DS.all/get/by/need/commit/on/S/loaded`, `ME`, `ICO` (`print`, `pdf`, `share`, `import`, `export`, `doc`, `zoom`).
- **À ne pas modifier** : les moteurs d'impression (`tplPrint`, `mgPrint`, `svDpPrint`, `svbDpPrint`, `svcPrintWin`, `svdPrint`, `qrPrintSVG`, `ivPrint`, les replis HTML) ; `svLockAsk`, `svSetLock`, `svLockOp` ; `dvEditor`, `ccEditor` ; la table serveur `lock`.
- **B1 à B4** touchent `ch01aPanel`, `ch01aOpen` et `ch01aView` (CH-01 lot 1). Ce sont des insertions d'une expression : l'ancien code reste le repli quand le socle manque. Si CH-01 change ces lignes avant l'intégration du lot 4, le `build.py` du lot 4 échoue et les ancres se reprennent.

---

## 12. Plan en lots

Taille totale : **L** (lot 1 ≈ 250 lignes Python + 220 lignes JS, lot 2 ≈ 330, lot 3 ≈ 480, lot 4 ≈ 200 JS + 180 Python). La fiche prévoyait 6 lots. Ils sont regroupés en 4 :
- serveur de fichiers et génération du PDF réunis au lot 1 (toutes les modifications du serveur en une copie) ;
- visionneuse et enregistrement du PDF au lot 2 ;
- partage, fusion, import et panneau au lot 3 ;
- l'ancien lot 6 (verrou) est confié à CH-10 lot 3 ;
- le lot 4 porte les branchements, les annexes et la reprise.

Préfixes `ch03a` à `ch03d` (et `CH03A` à `CH03D`, `ch03_`/`CH03_` côté serveur) et collection `depotfichier` : vérifiés libres par recherche dans `DeltaSub.html`, `serveur_deltasub.py` et les fichiers de `ch/*/` (0 occurrence au 30.09.2026).

Chaque lot livre dans `ch/CH-03/lotN/` :
- `ch03x.js` : déclarations de haut niveau, aucun accès au DOM au chargement, aucune redéclaration ;
- `build.py <DeltaSub.html source> [<serveur source>]` : ancres, contrôle d'unicité, `DeltaSub.html` (et serveur) construits pour l'essai ;
- `test_ch03x.js` pour jsc, et contrôle de syntaxe du script complet (`jsc -e "new Function(readFile('f.js'))"`) ;
- le compte rendu de l'essai navigateur (copie isolée, port propre, onglet propre, serveur arrêté et onglet fermé à la fin).

### Lot 1 — Dépôt de fichiers, génération et outils PDF côté serveur, API du dépôt (préfixe `ch03a` / `CH03A`, serveur `ch03_` / `CH03_`)

- **Contenu** :
  - **serveur** : bloc CH-03 (§ 4.8) avec les routes R1 à R8, `ch03_pdf` (Chrome, arrêt du processus), `ch03_nettoyer_html` (politique CSP après le doctype, `meta refresh` retirés), `CH03_JXA` (pages, fusion, superposition), limites, types, espace disque, sauvegarde incrémentale dans `CH03_SAUV` (isolée pour une base d'essai), purge de `tmp/`, contrôle de session de CH-08 sur les POST s'il existe, route `ref` désactivée sans `DELTASUB_ANNEXES` ; lignes S1 à S6 ; copie modifiée complète `lot1/serveur_deltasub.py` et `lot1/serveur.diff`, produites par `build.py` à partir du serveur source donné en argument (ancres contrôlées comme pour la page) ;
  - **page** : `CH03A_T`, `ch03aDossier`, `ch03aFichiers`, `ch03aTrouve`, `ch03aPdfDispo`, `ch03aDossierVide`, `ch03aNomPdf`, `ch03aFiltreNom`, `ch03aNomBatiment`, `ch03aDate`, `ch03aUrl`, `ch03aOnglet`, `ch03aOuvrir`, `ch03aTelecharger`, `ch03aEnvoyer`, `ch03aPdf`, `ch03aFusion`, `ch03aSuperposer`, `ch03aMoteur`, `ch03aEnregistrer`, `ch03aDeposer`, `ch03aCopier`, `ch03aSupprimer`, `ch03aPret` (§ 3.2) ; ancre A0.
- **Tests** : T-A1 à T-A9 ; S1 à S13, S8b et S8c (script `lot1/test_serveur.py`, bibliothèque standard, sur copie isolée) ; essais N1 et N2.
- **Dépendances** : aucune.

### Lot 2 — Visionneuse commune, interception des impressions, PDF et pièces jointes, polices (préfixe `ch03b` / `CH03B`)

- **Contenu** : `CH03B_OPEN` (interception), `CH03B_ACTIF`, `ch03bWin` (fausse fenêtre), `ch03bContexte`, `ch03bCapture`, `CH03B_POLICES`, `ch03bHtml`, `ch03bView` (barre, zoom, PDF ▾, Partager ▾, « Imprimer »), « Ouvrir dans l'aperçu » et « Sauvegarder et ouvrir », repli sans Chrome, `ch03bNomDlg` (« Enregistrer le fichier » / « Choix du fichier »), `ch03bNouveauPdfDlg` (« Nom du fichier » Bâtiment), `ch03bEnregistrerPdf`, `ch03bJoindre` (§ 3.3, § 5.4, § 6.1 à 6.4). « Partager le fichier PDF… » de la visionneuse appelle `ch03cPartagerApercu` s'il existe, sinon l'entrée est grisée (« Partage : prévu au lot 3 de CH-03 »).
- **Tests** : T-B1 à T-B5 ; essais N3 à N6 (dont les 7 moteurs principaux : `printProjects`, `mgPrint`, `svDpPrint`, `svbDpPrint`, `svcPrintWin`, `qrPrintSVG`, `ivPrint`).
- **Dépendances** : lot 1.

### Lot 3 — Panneau « Document » générique, liste « Fichiers PDF », import, fusion, partage et courrier (préfixe `ch03c` / `CH03C`)

- **Contenu** : `ch03cPanel`, `ch03cPdfZone` (avec `CH03C_ZONES` et un seul écouteur `DS.on`, glisser-déposer), `ch03cNomDocDlg`, `ch03cImporter`, `ch03cImporterDe`, `ch03cFusionDlg`, `ch03cPartager` (fichiers enregistrés), `ch03cPartagerApercu` (aperçu), `ch03cBlocs`, `ch03cMailto`, `ch03cTexte`, `ch03cListeNoms`, `ch03cContactsAffaire` (§ 3.4, § 6.5 à 6.12). Démonstration pour l'essai : aucun écran existant ne l'appelle encore ; le test construit un panneau depuis la console sur un dossier de synthèse (`ProjectDocuments/Documents/<P>/Invoices/<id>` d'une facture d'essai), en attendant CH-11.
- **Tests** : T-C1 à T-C6 ; essais N7 et N8.
- **Dépendances** : lots 1 et 2.

### Lot 4 — Branchement du contrôle des coûts, annexes de contrat, outil de reprise (préfixe `ch03d` / `CH03D`)

- **Contenu** :
  - **contrôle des coûts** (après intégration de CH-01 lot 1) :
    - `ch03dCocoDossier(E, dossier)` ;
    - `ch03dCocoZone(o, dis)` → `[élément, bouton]` : zone « Fichiers PDF » du dossier du document ; concerne « <libellé du document> <n° d'affaire> <libellé de tri de l'affaire> » (`o.nomDefaut`, `PROJECT.NUMBER`, `PROJECT.SORTLABEL`, valeurs nulles remplacées par du vide) ; destinataires : maîtres d'ouvrage non masqués (`TEAMROLECODE` 8) et leurs responsables, plus l'entreprise et sa personne de contact pour les documents d'entreprise [P CH-01 rech_orig : `getDefaultSubject`, `AwardDocumentsFrame.getSummaryMailContacts@0-242`] ;
    - `ch03dCocoPdf(o, r)` → `{dossier, nom:'<nom du document>.pdf', projet, concerne, contacts}` pour « Sauvegarder et ouvrir » et le partage de l'aperçu ;
    - `ch03dCocoPdfSave(o)` : « Enregistrer sous forme de fichier PDF… » (HTML = `svDpDocHTML(ch01aRender(o, rec))`) ;
    - ancres B1 à B4. **Effet** : les 8 sections (tous les panneaux `ch01aPanel`) reçoivent la liste des PDF, « Enregistrer sous forme de fichier PDF… », la visionneuse commune et « Sauvegarder et ouvrir » ;
  - **annexes de contrat** : `ch03dAnnexesRow(v,C)`, dialogue « Document », fiche « Nouvelle annexe » / « Editer l'annexe » (§ 6.13) ; ancre B5 ;
  - **outil de reprise** (D12) : `lot4/outils_deltaproject/reprendre_fichiers.py` (nouveau fichier, bibliothèque standard, importe `serveur_deltasub` pour `db`, `commit`, `CH03_FICHIERS`, `IMPORT_WHO`) :
    - `python3 outils_deltaproject/reprendre_fichiers.py [--source <…/DELTAProjectFiles>] [--essai] [--avec-dpdoc] [--base-du-bureau]` ;
    - source par défaut : dernière sauvegarde nocturne (`/Volumes/SUBSTANCES/Deltaproject/Backup/*/DELTAProjectFiles`), en lecture seule ;
    - **refuse de tourner sans `DELTASUB_DB`**, sauf `--base-du-bureau` : « Base du bureau : reprise non autorisée dans cette vague (D12). Définissez DELTASUB_DB pour une base d'essai. » ;
    - sélection de l'état courant : dossiers du § 4.3 ; dossiers `coco_<date>`, archives `*.zip`, fichiers masqués et autres extensions exclus ; `.dpdoc` seulement avec `--avec-dpdoc` ;
    - pour chaque fichier : empreinte, contenu rangé s'il manque, enregistrement ajouté **seulement s'il n'existe pas** (jamais d'écrasement) ; commits par paquets de 200, `who = IMPORT_WHO`, `MODIFIED` = date du fichier source, `ORIGINE='reprise'`, `PROJECT_ID` = segment `<P>` ;
    - compte rendu par module : ajoutés, ignorés, contenus distincts, octets rangés ;
    - `--essai` : compte rendu seul, rien d'écrit.
- **Tests** : T-D1, T-D2 ; S14, S15 ; essais N9, N10.
- **Dépendances** : lots 1 à 3 ; **CH-01 lot 1 intégré** (ancres B1 à B4).

### Non livré (et pourquoi)

| Élément | Raison |
|---|---|
| Verrou généralisé, dialogue « Document verrouillé », droit de déverrouillage | CH-10 lot 3, qui le spécifie (§ 1 n° 6) |
| Corbeille Bâtiment (deux temps, Alt/Ctrl, restauration) | eCCC et Soumission déjà présentes ; devis : CH-02 lot 4 ; contrôle des coûts : CH-07 lot 3 (§ 1 n° 26) |
| « Confirmer l'envoi… », note d'envoi des documents d'affaire | CH-13 |
| « Partager le fichier PDF individuellement… » | aucun rapport maître n'expose ses éléments ; interface réservée (`o.elements`) |
| Branchements Soumission (34 entrées), eCCC (`ec4*`), devis général (panneau Documents), facturation et QR, Controlling | chantiers propriétaires (EC-1 lot 4, EC-2 lot 4, CH-02 lot 3, CH-11 lot 4), avec l'API du § 3 et les recettes du § 3.5 |
| Bons de paiement (« Créer un PDF », « Créer un PDF avec tous les bons », facture d'entrepreneur jointe, « Autres annexes au paiement »), annexes de l'arrêté et des paiements, colonnes « PDF » des listes CoCo, « Il existe déjà un PDF pour ce document… » | code de CH-01 lots 2 à 4 pas encore intégré : complément à ancrer après leur intégration (une dizaine d'insertions d'une expression, sur le modèle de B1 à B4) |
| Brouillon `.eml` avec pièce jointe | D8 arrêté ; décision n° 3 |
| Reprise effective des fichiers | D12 ; décision n° 4 |
| Paramètres du document, zone de travail, éléments masqués, navigation par page | CH-12, CH-14 ; écart E3 |

---

## 13. Décisions restantes pour Paulo

1. **Toutes les impressions passent par la visionneuse** (interception de `open('','_blank')`). Avantages : plus de fenêtre bloquée, PDF, pièce jointe et partage partout. Inconvénient : un clic de plus (« Imprimer »). **Par défaut : oui** (fidèle à l'original, qui ouvre toujours la visionneuse). Variante : `CH03B_ACTIF = false`, la visionneuse n'étant alors utilisée que par les documents enregistrés.
2. **Police Akkurat dans les impressions et les PDF** : aujourd'hui, les impressions de DeltaSub sortent en Helvetica Neue, faute de trouver « Akkurat LL TT ». L'alias rend la police du bureau, mais change l'aspect (et parfois la coupure des lignes) de tous les documents. **Par défaut : oui.**
3. **Courriel avec la pièce jointe** (D8, complément) : un brouillon `.eml` (destinataire, objet, texte, PDF joint, rien d'envoyé) pourrait remplacer le `mailto:` + glisser-déposer. Il faut l'essayer sur un poste (Apple Mail et Outlook l'ouvrent-ils en brouillon ?). **Par défaut : non** dans cette vague.
4. **Reprise des fichiers de Deltaproject** (D12) : l'outil est prêt. Sur la sauvegarde du 28.09.2026, il reprendrait 152 PDF (48 contenus distincts, 3,2 Mo) et, en option, 347 `.dpdoc` pour un futur convertisseur. Les panneaux du contrôle des coûts montreraient alors les `Contrat.pdf` et `Arrêté de compte.pdf` existants. **Par défaut : pas dans cette vague** ; à lancer sur décision (`--base-du-bureau`).
5. **Annexes des contrats (208 références vers `01-AFFAIRES`)** : autoriser le serveur à les servir en lecture seule (`DELTASUB_ANNEXES="/Volumes/SUBSTANCES ARCHITECTES/01-AFFAIRES"` dans `Lancer_DeltaSub.command`). Toute machine du réseau local pourrait alors lire ces PDF par DeltaSub, **sans mot de passe** (comme le reste de DeltaSub). **Par défaut : désactivé** ; les annexes s'affichent, mais ne s'ouvrent pas.
6. **Chrome sur le Mac Studio** : la génération des PDF compte sur le Chrome déjà installé (mis à jour seul). S'il est désinstallé, DeltaSub repasse à l'impression du navigateur. **Par défaut : accepté.**
7. **Verrou des documents** confié à CH-10 lot 3, qui le spécifie déjà (spec_19 § 4.10, décision D-10.5) ; **corbeille du contrôle des coûts** à ajouter au lot 3 de CH-07 (celle du devis est dans CH-02 lot 4, celles de l'eCCC et de la Soumission existent). **Par défaut : oui.**
8. **Types de fichiers acceptés et limite de 25 Mo** (§ 4.5). **Par défaut : cette liste**, que l'eCCC pourra allonger.

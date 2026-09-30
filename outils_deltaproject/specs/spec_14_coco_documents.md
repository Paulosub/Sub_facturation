# Cahier des charges — CH-01 « Contrôle des coûts : documents imprimés, arrêtés de compte et garanties » (avec le socle commun d'impression `.dpdoc`)

**Version 2 du rédacteur critique, 30.09.2026 (après-midi).** Elle remplace la version du matin (11 h 08, conservée dans `ch/CH-01/spec_14_v1_1108.md`). La numérotation des paragraphes et des lignes du § 1 est conservée : les renvois des autres cahiers (spec_15, spec_16, spec_17, spec_18 : « spec_14 § 1 », « § 4.11 », « § 6.7 »…) restent valables. Les changements de fond sont listés au § 0.2.

Ce cahier décrit comment reproduire dans `DeltaSub.html` :
- les **14 documents** du contrôle des coûts de Deltaproject 16.05 (nœud « Documents » de chaque section) ;
- le **socle commun d'impression** au format `.dpdoc` (choix du modèle, document enregistré par dossier, textes modifiables), qui sert aussi à CH-02, CH-09, CH-11 et EC-2 lot 4 (inventaire § 16.4 n° 3) ;
- l'**arrêté de compte complet** (`DeductionDialog`), la garantie et « Comptabiliser le paiement final » ;
- le **rapport de paiements** (filtre, tris, récapitulatif de TVA) ;
- les options « Arrondir les conditions » et « Afficher le total arrondi ».

**Sources confrontées** : `ch/CH-01/rech_orig.md` (révisé à 14 h 00, corrections R1-R13 et nouveaux § 10-11), `ch/CH-01/rech_exist.md` (version 2, 13 h 44), la fiche CH-01 et le § 16 de l'inventaire (`research/inv/inventaire_modules.md`), le lot 1 déjà écrit (`ch/CH-01/lot1.js`, `lot1_test.js`, `lot1_integration.md`). Chaque point contesté a été revérifié à la source pour cette version (§ 1, lignes 27 à 41).

**Conventions**
- **[P] PROUVÉ** : bytecode `Classe.méthode@offset` (désassemblages `ch/CH-01/w/c/`, outils `w/jp.sh`, `w/bsm.py`), libellé **[S]** `Strings.db (classe|id)`, données de la base de test (copie `ch/CH-01/r2/ds_now.sqlite`), fichiers du bureau lus sans écriture (`DELTAprojectFiles/Construction/Costcontrol`).
- **[D] DÉDUIT** : interprétation cohérente, non démontrée ligne à ligne, ou constat sur les données et PDF du bureau.
- **[C] CHOIX** : décision de conception pour DeltaSub, signalée à Paulo (§ 8 et § 12).
- `cc.` = `deltaproject.costcontrol.`

**Références DeltaSub.** `DeltaSub.html` du dépôt au commit `9c9a3f9` (CH-17 intégré) : **14 522 lignes**, md5 `b5db79206029ddfe413a4ec83bcd3858` ; `serveur_deltasub.py` : 431 lignes, md5 `20c0933d385f03f71d47e51202d03c3c`. Le fichier change pendant le travail des chantiers parallèles : **seules les ancres textuelles du § 10 font foi**, les numéros de ligne sont indicatifs. Aucun code `ch01*` n'est encore intégré.

**Décision D4 déjà arrêtée** : rendu `.dpdoc` fidèle en principal (jeu de modèles de l'affaire, sinon jeu du bureau ; choix du modèle quand il y en a plusieurs), ancien modèle DESIGN `projectCostcontrol*` en repli (comme `tplOr`). L'enregistrement des PDF et les annexes dépendent de CH-03 : **entrées grisées** dans cette vague.

**Aucune donnée personnelle** : identifiants (affaire, contrôle des coûts, contrat, arrêté, paiement, contact), compteurs, montants et libellés d'interface seulement. **Aucun contenu CRB.**

---

## 0. Synthèse

### 0.1 L'essentiel

1. **Deux circuits d'impression, comme l'original** [P]. Le circuit `.dpdoc` passe par un nœud **« Documents »** sous chacune des 8 sections du contrôle des coûts. L'ancien circuit (modèles DESIGN, « … [Ancien document] ») reste en **repli** quand aucun modèle `.dpdoc` n'est disponible ; les deux entrées existantes des ORDRES DE PAIEMENT prennent le suffixe « [Ancien document] » (§ 4.10).
2. **Choix du modèle exact** [P] : jeu de l'affaire (`PROJECT.DOCTEMPLATEGROUPNAME`), sinon « Group.project » = **jeu 1** ; langue fr, modèles non masqués ; **aucun repli** vers le jeu 0 ou 2 (la fiche et le § 16.4 n° 3 disaient « puis jeu 0 » : faux pour les documents d'affaire, vrai seulement pour les documents généraux de CH-09 et CH-11). Un modèle : pris directement ; plusieurs : dialogue **« Choisir le modèle »** (Description | Langue). Au bureau, le Contrat et le Bon sur contrat ont deux modèles (dont « Contrat_Entreprise », utilisé pour 108 contrats sur 113).
3. **Un document par dossier, modèle copié** [P]. Nouvelle collection **`cocodoc`** : un enregistrement par dossier Deltaproject (`<CC>/award/contractSheet_<contact>_<n°>`…), qui contient la **copie du modèle** choisi, le nom du document et les options de la section. Les données sont **recalculées à chaque ouverture**. « Modifier les textes… » remplace l'éditeur complet (CH-14) pour ce que le bureau modifie réellement : textes fixes et en-têtes de section.
4. **Rendu par `svDpHTML` sans le modifier** : une préparation du modèle (`ch01aPrep`) traduit les traits (`LineBand` : hauteur `lh` en mm, couleur `lc`) et deux champs absents (`projectDescription`, `userJobFunction`). La visionneuse affiche le document dans un `iframe` et imprime par `contentWindow.print()`.
5. **Colonnes flexibles fidèles** [P] : seules les colonnes de la présentation favorite **admises par la section** deviennent des colonnes du document (§ 4.8), et chaque tableau ne **remplit** qu'une partie des identifiants admis. Les valeurs sont implémentées pour tous les identifiants que remplit l'original dans chaque tableau ; un identifiant admis mais non rempli donne une cellule vide (correction du défaut F13, sans effet visible au bureau).
6. **Arrondis exacts** [P] : `signe × round(|v| × 100) / 100` (déjà `rJ`) et `signe × round(|v| × 20) / 20`. « Arrondir les conditions » arrondit **ligne par ligne** les tableaux ; « Afficher le total arrondi » ajoute une ligne « Arrondi » « (x) ». Cas réel vérifié : arrêté d57, solde **0.05** (§ 7).
7. **Solde de l'arrêté** [P] : Σ des nets **de ligne** − Σ des paiements à ce jour, TVA au **taux par défaut du système** (`vatDefault()`, 8.1). Vérifié au centime sur les PDF du bureau, dont d884 (−0.02), d57 (0.05) et d1034 (33'672.22 HT, 36'399.67 TTC).
8. **Arrêté de compte complet** [P] : « Nouvel arrêté de compte » (dialogue « Liste des adjudications »), dialogue « Arrêté de compte » (récapitulatif, positions, saisie du brut ou du net, conditions, garantie, numéro et proposition, date, statut, description, commentaire), contrôles et messages exacts, suppression, tri et adresses de la liste.
9. **« Comptabiliser le paiement final »** [P] : exige le statut « définitif » ; ouvre la fenêtre de paiement sur contrat **pré-remplie** (saisie du net, net restant par ligne, conditions de l'arrêté avec « Paiements à ce jour » inséré avant la TVA). Au bureau, les paiements finaux ont été saisis directement.
10. **Rapport de paiements** [P] : filtre « Filtre » (genres, statuts, période bornes incluses, ouvrages cochés, comptes du maître d'ouvrage, n° d'ordre), 6 tris, case « Récapitulatif de TVA » ; TVA **par ligne de paiement** avec la TVA de la ligne ; lignes du document « Total TVA <taux> % ».
11. **Retirés du chantier** [P] : « Note d'expédition » et « Commentaire sur le document » n'existent pas dans le contrôle des coûts 16.05 (libellés morts, seules des classes de la Soumission `devis18.*` les emploient). Descriptif et Honoraires restent à CH-18.
12. **Plan : 4 lots** (§ 11). Lot 1 `ch01a` (**écrit**, à reconstruire sur la source actuelle) : socle, Devis général, Contrôle des coûts, une ligne du serveur. Lot 2 `ch01b` : Adjudications (liste, Contrat, Avenant), Mutations (liste, feuille), Comptes d'entreprise. Lot 3 `ch01c` : arrêtés complets, garanties, paiement final, documents Arrêté et Liste des garanties. Lot 4 `ch01d` : rapport de paiements (filtre, tris, TVA, document), Ordre de paiement et bons.

### 0.2 Ce qui change par rapport à la version du matin (tranché à la source)

| # | Sujet | Version du matin | Version 2 (preuve au § 1) |
|---|---|---|---|
| V1 | Ordre de paiement : lignes du tableau | « avant », paiements, « après », total ; valeurs flexibles « de la présentation » | **[avant], paiements, total, [après]** ; lignes « avant / après » liées à une option de présentation (F14) que DeltaSub n'a pas encore : **pas imprimées** (comme les ordres du bureau) ; seules 90, 122, 136 remplies (§ 1 n° 27) |
| V2 | Rapport de paiements : colonne flexible du modèle du bureau | « le modèle du bureau s'affiche correctement » | L'original 16.05 imprime le **statut** dans la 1re colonne de montant et **aucun montant** (3 PDF sur 3) : défaut F18, corrigé par défaut (décision n° 9) (§ 1 n° 28) |
| V3 | Rapport de paiements : avertissement de filtre | bannière dans la fenêtre | **message** « Information » à la préparation du document (§ 1 n° 30) |
| V4 | Rapport de paiements : lignes de TVA et texte du filtre | « Part TVA <taux> » ; texte simple | document : **« Total TVA <taux> % »** ; texte du filtre exact avec clés brutes (F16, décision n° 8) ; les ouvrages s'impriment quand ils ne sont **pas tous** cochés (règle logique, pas un défaut) (§ 1 n° 29, 36) |
| V5 | Case « Récapitulatif de TVA » | défaut vrai | **défaut faux** : aucun des 3 rapports du bureau n'a de lignes de TVA (§ 1 n° 37) |
| V6 | Liste contrats et avenants | 90 = TTC de la ligne | ligne de contrat : 82-84 **contrat**, 88-90 **contrat + tous ses avenants** ; ligne d'avenant : 85-87, imprimée seulement si non nulle ; n° « contrat \| avenant » ; « Genre de contrat » = remarque (§ 1 n° 31) |
| V7 | Liste des mutations | colonnes 8-11 « Genre, Remarque, Contreparties, Description » ; totaux « Renchérissement / Variation de coût / Transfert » | colonnes **8 Remarque, 9 Genre, 10 Transfert, 11 Commentaire** ; une ligne par écriture (2 par transfert) ; totaux : 3 lignes sous conditions, libellés = noms de centres (F15) (§ 1 n° 32) |
| V8 | Page de garde du Contrôle des coûts | libellés par défaut justes | l'original libelle les renchérissements « Variations » et les variations « Renchérissement » (F15), corrigé par défaut (décision n° 7) (§ 1 n° 33) |
| V9 | Comptes d'entreprises | lignes « contrats, avenants, paiements » | algorithme exact (titres de lot, contrat, avenants, paiements, hors contrat par lot), colonnes 0-17 ; message au titre **« Erreur »** (§ 1 n° 34) |
| V10 | Fenêtre Adjudications ▸ Documents ; « Liste des adjudications » | n° « contrat-avenant » | fenêtre : **n° propre** de l'avenant ; « Liste des adjudications » : **« contrat \| avenant »** (§ 1 n° 12, 35) |
| V11 | Filtre des paiements : ouvrages | tous les ouvrages stockés | **seuls les ouvrages cochés** sont enregistrés ; liste vide = pas de filtre d'ouvrage (§ 1 n° 36) |
| V12 | Ancres | A5 et A9 réécrivaient l'ancien texte ; A1, A2, A4 différaient du lot 1 écrit | **insertions pures** partout sauf les deux libellés « [Ancien document] » ; A9 supprimée (`CH01C_PRE`) ; A1, A2, A4 = formes du lot 1 écrit ; lignes de `ch01a` gelées pour CH-03 (B1-B4) (§ 10) |
| V13 | Lot 1 | à écrire | **écrit** (`lot1.js`, 339 lignes, 83 contrôles jsc) ; construction d'essai périmée : à refaire sur `9c9a3f9` (§ 11) |
| V14 | Taux du solde de l'arrêté | `DS.all('setting')` | `vatDefault()` (existe dans DeltaSub, l. 6895) |

---

## 1. Arbitrages entre les sources (tranchés à la source)

Lignes 1 à 26 : version du matin, revérifiées (les lignes modifiées portent « révisé »). Lignes 27 à 41 : nouvelles.

| # | Sujet | Affirmations en présence | Verdict | Preuve |
|---|---|---|---|---|
| 1 | Jeu de modèles quand l'affaire n'en a pas, et repli | fiche et inventaire § 16.4 n° 3 : « jeu de l'affaire, puis jeu 0 » ; `svDpFind` : affaire → 1 → 2 ; `rech_orig` : affaire, sinon 1, sans repli | **Affaire, sinon « Group.project » (jeu 1). Aucun repli** vers un autre jeu. Groupe introuvable : message « Information » « DocTemplateGroup '<groupe>' (<type>) not found! » et aucun document. Les **documents généraux** (CH-09, CH-11) prennent « Group.general » (jeu 0) | [P] `SelectTemplateDialog.browseTemplate(Window,DocumentType,String,Language)@9-20`, `@26-28`, `@185-226` ; `Reports.getProjectTemplateFile@1-41`, `getGeneralTemplateFile@33-54` ; `doctemplategroup` : 1 « Group.general » → 0, 2 « Group.project » → 1, 51 « SUBSTANCES » → 2 |
| 2 | Nombre de modèles | « plusieurs → dialogue » | **1 → pris sans dialogue ; 0 ou plus de 1 → « Choisir le modèle »** (liste vide possible dans l'original) | [P] `browseTemplate@77-142` (`size() == 1`) |
| 3 | Filtre et ordre de la liste des modèles | — | Type, **langue de document par défaut (fr)**, dossier du jeu, **`isHidden = FALSE`**, tri **ISLOCKED décroissant, LANGUAGEKEY, FILENAME** | [P] `db.DocTemplate` requêtes nommées ; `browseTemplate@49-75` |
| 4 | Modèles du bureau en jeu 1 | « les `-1.dpdoc` sont invisibles pour `svDpFind` » | Contrat : 615 « Contrat » (verrouillé, 1er) puis 1251 « Contrat_Entreprise » ; Bon sur contrat : 611 « Bon de paiement sur contrat » (verrouillé) puis 1301 « Bon de paiement ». Les 12 autres types : 1 modèle | [P] table `doctemplate` ; `modeledocument` `1/costControlContractSummary-1.dpdoc`, `1/costControlContractPaymentSummary-1.dpdoc` |
| 5 | « Note d'expédition » et « Commentaire sur le document » | fiche et § 16.4 n° 9 : généraliser `svDlgMailing` | **Inexistants dans le contrôle des coûts 16.05.** `openMailingNote` n'apparaît que dans `devis18.SingleDocTypeDocumentsFrame` ; `MailingInfoDialog` n'est employé que par 9 classes `devis18.*` ; aucune classe `costcontrol`. Bureau : aucune note ni aucun commentaire | [P] recherche sur les `.class` des deux jars (`rech_orig` § 5, R13) |
| 6 | Sens de « Arrondir les conditions » et « Afficher le total arrondi » | — | « Arrondir les conditions » : chaque montant des tableaux (lignes, conditions, paiements) arrondi à 5 ct **ligne par ligne**, totaux refaits sur les montants arrondis, et champs texte des **bons**. « Afficher le total arrondi » : ligne « Arrondi » « (x) » **seulement si « Arrondir les conditions » est faux**. Défaut des deux : option « Arrondir » de la Configuration | [P] `FinalpaymentsDocumentsFrame.setReportBookData@54-168`, `@213-223` ; `AwardDocumentsFrame.getWheelPopupMenu@8-100`, `readForceRoundJasonString@0-28` ; `AwardTable.fillTable@622-806`, `roundetEqualAnrounded@0-43` |
| 7 | Base du solde de l'arrêté | `rech_orig` v1 : « décompte net » | **Σ des nets de LIGNE** de l'arrêté (arrondis selon l'option), et **non** `totauxDelta.net` : d884 donne 1'192'000.00 − 1'192'000.02 = **−0.02**, comme le PDF du bureau | [P] `setReportBookData@145-166, @244-270` ; [D] `ctl_arretes.jsonl` |
| 8 | Règle « 0.00 si \|solde\| ≤ 0.01 » | ligne « Solde à verser » | **Colonne TTC** (9) seulement ; HT (6) et TVA (8) formatés normalement (vides si nuls), taux (7) « t % » | [P] `PreviousPaymentsTable.fillTable@1104-1259` ; [D] PDF d884 (−0.02) et d879 (« 0.00 ») |
| 9 | « Comptabiliser le paiement final » | arrêtés « établis » avec paiement final | **Statut « définitif » exigé** (`msg14a/b`). Les paiements finaux du bureau ont été saisis **directement** dans la fenêtre de paiement | [P] `FinalPaymentFrame.bookFinalPayment@159-230` ; [D] 8 cas (§ 7.1) |
| 10 | Pré-remplissage du paiement final | — | Conditions de l'arrêté **plus « Paiements à ce jour » avant la première TVA** ; « Saisie du net » ; net par ligne = net de la ligne d'arrêté − Σ nets des lignes des paiements du contrat. Plusieurs taux de TVA : **aucune ligne** pré-remplie, conditions sans la dernière TVA. Ligne de paiement sans correspondance : ajoutée **avec son net positif** (F12) | [P] `bookFinalPayment@233-306, @314-712` ; `PayBookDialog.<init>(…,LinkedList,LinkedList,…)@358-494` ; `setConditions@57-171` ; données d1034 [22,1,3,10,6] → p984 [22,1,3,10,20,6] |
| 11 | Message pour un avenant non lié | — | L'original affiche `msg11a/b` au lieu de `msg14a/b` : **défaut F7**, corrigé | [P] `bookFinalPayment@866-922` |
| 12 | « Liste des adjudications » (nouvel arrêté) **(révisé)** | Genre « Contrat / Lié / Non lié » ; n° « contrat-avenant » | Lignes : contrats **sans arrêté** (Genre « Contrat ») puis avenants **non liés** sans arrêté (Genre « Avenant ») ; « Lié au contrat » / « Non lié au contrat » jamais affichés. Numéro d'un avenant : **« <n° contrat> \| <n° avenant> »** ; Entreprise : nom court, vide si l'entreprise n'est pas dans la liste | [P] `ContractListDialog.initTable@206-644` (`contractStr` @394, `addendumStr` @627, recette `#0` « \u0001 \| \u0001 » @530, `getAddrList` @546-621) |
| 13 | Création de l'arrêté | — | L'original **crée l'arrêté dès l'OK du choix** ; annuler le dialogue suivant le laisse « non défini » (4 au bureau) : **défaut F8** | [P] `getSelection@116-152` |
| 14 | Colonnes « Paiements à ce jour » de l'arrêté | F1 | Colonne 2 « Date fact. » reçoit la **date de paiement**, colonne 4 « Date pmt » la **date de facture**. Le modèle du bureau affiche la colonne 4 : ses PDF impriment la date de facture sous « Date pmt » | [P] `PreviousPaymentsTable.fillTable@303-342` |
| 15 | Suppression dans le dialogue d'arrêté | — | Ligne de position : supprimée **sans confirmation** ; ligne « Total » : « Cette structure ne peut pas être effacée. » (« Erreur »). Condition bloquée : « Cette inscription ne peut pas être effacée. » (« Erreur ») ; sinon « Voulez-vous vraiment supprimer cette inscription ? » (« Avertissement », Oui/Non), puis **niveaux renumérotés 1..n** | [P] `DeductionDialog.removeContractLine@0-178`, `removeOneCondition@27-191` |
| 16 | Valeurs initiales d'un nouvel arrêté | — | Lignes du contrat (et des avenants liés) regroupées par (CFC, ouvrage, localisation, réf. cond.), adjudications brute et nette additionnées ; **facture finale brute et nette à 0** ; conditions = copie de celles du contrat | [P] `buildDeductionList@1-311`, `setContractToAddendum@4-453` |
| 17 | Colonnes flexibles **(révisé)** | « une par colonne visible de la présentation » | **Seules les colonnes admises par la section** (§ 4.8) ; et chaque tableau ne remplit qu'une partie des admises. Admis non rempli : l'original n'ajoute **aucune cellule** et les valeurs suivantes glissent (F13) ; DeltaSub imprime une cellule vide [C]. Au bureau, toutes les colonnes flexibles utilisées sont remplies | [P] `cc.<section>.Columns.getFlexColumnNames` (`lookupswitch`) ; `w2/flexmap.py` ; [D] 84 présentations favorites |
| 18 | Colonnes du rapport de paiements **(révisé)** | 15 (modèles du bureau) contre 17 (classe 16.05) | L'original remplit les cellules **par identifiant** : la colonne 14 du modèle du bureau (de type flexible) reçoit la cellule 14 de la classe 16.05, le **statut** ; les montants (cellule 15) ne s'impriment pas (F18). DeltaSub repère la colonne flexible **par son type** (`svDpCols`, inchangé) et imprime les montants [C] | [P] `PaymentListTable.getDefaultTableColumns@9-370` ; [D] PDF du bureau CC 753, 901, 1802 : statut à x = 469 pt sous « Paiements HT », aucun montant sur les pages de liste |
| 19 | Récapitulatif de TVA des paiements | « le document somme par paiement » | **Par ligne de paiement**, avec la condition TVA de la ligne (même réf. cond., ou condition sans réf.) : HT += arrondi(net) − TVA de la ligne ; TVA += TVA de la ligne ; TTC += arrondi(net). **Lignes sans condition TVA : ignorées** | [P] `PayFillTable.calcVatList@1-33`, `updateVatList@1-400` ; `payment.Total.updateVatList@1-825` |
| 20 | Ensemble de styles `Costcontrol` | équivalence avec « Contrôle du coût » ? | **Égalité exacte** de `STYLESETID`, sinon « Default » : les modèles d'origine retombent sur Default, **comme dans l'original** ; `svRowStyles` fait déjà de même | [P] `doc.model.RowStyleSet.findStyleSet@0-59` |
| 21 | Traits (`LineBand`) | couleur et épaisseur absentes du moteur | `lh` = **hauteur en mm** d'une cellule pleine de couleur `lc` (noir par défaut) | [P] `doc.reports.content.LineBand` |
| 22 | Page de garde du Contrôle des coûts | totaux constatés | Une ligne par **centre de coût** correspondant à une colonne de la présentation, TTC ≠ 0, dédoublonnée ; libellé = nom du centre (§ 1 n° 33) | [P] `CostOverviewTotalTable.fillTable@1-244`, `overview.Columns.getOverviewTotalColumnList@84-5926` |
| 23 | Stockage | dans `costcontrol` ou nouvelle collection | [C] **Collection `cocodoc`**, protégée au ré-import par une ligne du serveur (§ 3.2) | `costcontrol` pèse jusqu'à **514 Ko** (CC 3601) et `ccEditor.save` l'écrit **sans relire la version** |
| 24 | Totaux imprimés | `ccCond` retrouve 107 nets sur 114 à 1 ct | Les documents lisent les **valeurs stockées** (nets et TVA de ligne, montants de condition, totaux) ; jamais un recalcul par `ccCond` | [P] `*DocumentReport.getString` (getters) |
| 25 | Boutons « Ouvrir… / Ouvrir PDF / Supprimer » de la fenêtre des arrêtés | — | **Code mort** : placés dans aucun conteneur. Seul le panneau Document standard sert | [P] `FinalpaymentsDocumentsFrame.initComponents@416-627` ; bureau : aucun fichier `finalpayment/<n°>_<contact>.dpdoc` |
| 26 | Statut « non défini » d'un arrêté | défaut d'affichage | `DeductionDocState` n'a que 3 libellés : le code 0 s'affiche **vide**, comme aujourd'hui dans DeltaSub | [S] `DeductionDocState\|*` ; 4 arrêtés `statutCode` 0 |
| 27 | Ordre de paiement : lignes et valeurs | v1 : « avant », paiements, « après », total ; toutes colonnes flexibles | Ordre **[« Paiements avant exécution de l'ordre »], paiements, total (k0), [« Paiements après exécution de l'ordre »]** ; les deux lignes de solde n'existent que si l'option **« Afficher la désignation CFC »** de la présentation est cochée (au lieu de « Afficher les montants avant/après exécution » : F14). Valeurs remplies : **90** (formatValue), **122** (`formatDouble(round(v, Arrondir))`, « 0.00 » sur une ligne de solde, vide ailleurs), **136** (`formatDouble(round(v))`, vide si 0) ; tout autre identifiant admis : aucune cellule (F13). Les sauts de page de tableau du modèle (`pageBreaks`) sont vides dans les modèles du bureau | [P] `AdviceOfPayementDocumentsFrame.setReportData@48-99`, `AdviceOfPaymentTable.fillTable@315-931`, `getLine@142-641` ; [D] 5 PDF d'ordres sans ces lignes ; `modeledocument` jeux 1 et 2 : `"pageBreaks":[]` |
| 28 | Rapport de paiements : ce que le bureau imprime | — | Voir n° 18 : en 16.05, le tableau des paiements du bureau n'imprime **aucun montant** ; seul le récapitulatif de la 1re page (montants) et le « Total » sont exploitables. Correction proposée par défaut (décision n° 9) | [D] 3 PDF sur 3 (`coco/payments/Rapport des paiements.pdf` des CC 753, 901, 1802) |
| 29 | Texte du filtre (`reportFilter`) du rapport | liste simple | Reconstitution exacte (§ 5.6) : premier filtre appliqué seulement ; parties omises quand tout est coché ; libellés **collés** au texte (« Paiements :Paiements sur contrat ») ; clés sans libellé imprimées **brutes** (« payGeneral », « payed ») : F16. **Ouvrages** imprimés quand la liste enregistrée (ouvrages **cochés**) n'a pas la taille de la liste des ouvrages de l'affaire, c'est-à-dire quand le filtre **restreint** les ouvrages : règle logique, **pas un défaut** (correction de `rech_orig` F16) | [P] `PaymentListDocumentReport.getString@1024-2066` ; `rsrc.db.Resources.lookUp@90-120` (clé absente → clé) ; `PayFilterDialog.getInput@97-213` (seules les lignes cochées sont ajoutées, @171) |
| 30 | Avertissement de filtre | v1 : bannière | **Message** `JOptionPane` « Attention, vous travaillez en mode filtre. » (titre « Information ») au moment où les données du document sont préparées (création, ouverture), si le filtre est appliqué | [P] `PayementDocumentsFrame.setReportData@166-224` (`filterApplay`, `msg4`, `showMessageDialog`) ; même mécanisme dans `KvDocumentsFrame`, `AwardDocumentsFrame`, `MutationDocumentsFrame` |
| 31 | Liste contrats et avenants | v1 : 90 = TTC de la ligne | Pour chaque contrat de la liste : ligne du **contrat** (82-84 contrat HT/TVA/TTC ; **88-90 contrat + tous ses avenants** ; 94 niveau des prestations), puis une ligne par **avenant** (85-87 ; 94 ; 82-84 et 88-90 vides), **imprimée seulement si une de ses valeurs flexibles est non nulle**. Colonne 5 d'un avenant : « <n° contrat> \| <n° avenant> » ; colonne 8 « Genre de contrat » : **remarque**, sinon « Contrat » / « Avenant » ; 3-4 : ouvrage et localisation **communs** aux lignes (vides s'ils diffèrent). Total (k0) : 82-87 cumulés, 88-90 = total des adjudications, 94 vide | [P] `award.Columns.getAwardList@0-334`, `writeAwardLine@2-1877`, `CostContractListTable.getLine`, `getTotalLine` |
| 32 | Liste des mutations | v1 : colonnes 8 Genre, 9 Remarque, 10 Contreparties, 11 Description ; totaux simples | Colonnes fixes **0 CFC · 1 Désignation CFC · 2 Entreprise · 3 Ouvrage · 4 Localisation · 5 Numéro · 6 Date · 7 Statut · 8 Remarque · 9 Genre · 10 Transfert · 11 Commentaire** · 12 flexibles. Une ligne **par écriture** (origine et destination d'un transfert = 2 lignes), triée par numéro (défaut `MutPref`). Totaux « Totaux » : renchérissements et variations **seulement si leur HT ≠ 0**, transferts **toujours** ; montants `formatRoundedDouble` (« 0.00 » si nuls) ; libellés = noms de centres (n° 33) | [P] `mutation.Columns.getMutationsList`, `MutationsListTable.getLine`, `MutationsListTotalTable.fillTable@321-758` (`formatRoundedDouble` @397-741, test `dcmpl` @616-629) |
| 33 | Noms des centres de coût (page de garde et totaux des mutations) | v1 : noms par défaut justes | Clés : renchérissement (ids 20-22) → `inflation_costname`, variations (26-28) → `increase_costname`. Or les noms par défaut sont **croisés** : `inflation_costname` = « Variations » (`modificationCostName`), `increase_costname` = « Renchérissement » (`increaseCostName`). Avec les noms par défaut, l'original libelle donc les renchérissements « Variations » et les variations « Renchérissement » (**F15**, sur les deux documents). Bureau : 20 `costnamesFr.json` sur 22 gardent les défauts ; 2 (CC 2301 et 2751) les ont inversés à la main — le CC 2751 a des variations (34'314.50) et la colonne 28 dans sa favorite | [P] `overview.Columns.getOverviewTotalColumnList@941-1464` (ids 20/22 → `inflation_costname`, 26/28 → `increase_costname`) ; `ColumnNameDialog.initCostNames(CostControlDocument,Language)@123-187` ; [S] `ColumnNameDialog\|increaseCostName` « Renchérissement », `\|modificationCostName` « Variations » ; [D] fichiers `json/costnamesFr.json` |
| 34 | Comptes d'entreprises | v1 : « lignes = contrats, avenants et paiements » ; message « Information » | Algorithme exact (§ 5.5) ; colonnes 0-17 nommées ; total = cumuls de toutes les écritures de l'entreprise ; entreprise introuvable : « L'entreprise n'existe pas. » au titre **« Erreur »** | [P] `entrepreneur.Columns.getEntrepreneurLineList@0-4190`, `EntrepreneurTable.getLine@185-362`, `getTotaLine`, `EntrepreneurDocumentsFrame.setReportData@1-247` |
| 35 | Fenêtre ADJUDICATIONS ▸ Documents | v1 : n° « contrat-avenant » | Ligne d'avenant : N° = **n° propre de l'avenant**, Adjudicataire = entreprise du contrat, Type « Avenant », Montant = TTC arrondi selon « Arrondir » ; Document / PDF : cases (présence d'un fichier dans le dossier) | [P] `AwardDocumentsFrame.setContractBookTable@132-451` (@370 `getContractNumber` de l'avenant, @377 même entreprise, @384 `addendumStr`, @394-407 `getTotal`, `round(doRound)`) |
| 36 | Filtre des paiements : ouvrages et comptes | v1 : « si aucun ouvrage n'est coché, pas de filtre [D] » | **Prouvé** : la liste enregistrée ne contient que les ouvrages **cochés** ; liste vide → pas de filtre d'ouvrage ; un paiement passe si **une de ses lignes** a un ouvrage et une localisation de la liste ; les lignes des autres ouvrages sont retirées de l'affichage. Comptes : liste vide → pas de filtre ; sinon `banque.compteMO` égal au compte 2, au compte 1 ou à l'IBAN d'un compte de la liste | [P] `PayFilterDialog.getInput@97-213` ; `PaymentFrame.displayPosition@378-629` ; `PaymentFrame.createFilteredList@400-531` (retire des paiements listés les lignes des autres ouvrages) |
| 37 | Défaut de la case « Récapitulatif de TVA » | v1 : vrai (affichage actuel de DeltaSub) | [C] **Faux** : aucun des 3 rapports du bureau n'a de lignes « Total TVA » ; l'écran n'affiche la carte qu'une fois la case cochée (réglage enregistré par contrôle des coûts) | [D] PDF des CC 753, 901, 1802 |
| 38 | « Total avant paiement » de l'ordre | `rech_orig` : « paiements antérieurs des mêmes contrats » | **Σ des paiements de tous les ordres antérieurs** du contrôle des coûts : date de valeur antérieure, ou même date de valeur et numéro inférieur (comparaison de chaînes) ; ordres sans date de valeur ignorés ; chaque paiement pour son TTC (arrondi si « Arrondir ») ou, en bon par ouvrage, le net de la ligne | [P] `AdviceOfPayementDocumentsFrame.calcSaldo@0-203`, `calcOneSaldoPos@0-197` ; [D] o42, o45, o55 du CC 4853 (§ 7.1) |
| 39 | Fenêtre MUTATIONS ▸ Documents | — | Une ligne **par mutation** : l'écriture d'origine d'un transfert, l'écriture unique d'une variation ou d'un renchérissement ; la feuille imprime cette écriture et son partenaire | [P] `MutationDocumentsFrame.setMutBookTable@218-261` (`isOrigMutationPos` ou partenaire vide) |
| 40 | Liste des adjudications : ordre des contrats | — | Tri de la présentation ADJUDICATIONS (`AwardingPref` : n° d'adjudication, n° de contrat, date) ; DeltaSub n'a pas ces préférences : **par n° de lot** (comme l'écran) [C] | [P] `setContractBookTable@35-122` |
| 41 | Taux du solde | `SETTING genVatRatePos` | `vatDefault()` de DeltaSub (même réglage ; 8.1 si absent, alors que l'original prendrait 0) | [P] l. 6895 `vatDefault` ; écart E20 |

---

## 2. Périmètre

### 2.1 Reproduit (fidèle)

- **Socle** : nœud « Documents » sous les 8 sections ; panneau « Document » (bouton principal, menu ▾, liste « Fichiers PDF » grisée) ; dialogue « Nom du document » ; choix du modèle et « Choisir le modèle » ; copie du modèle dans le document ; ouverture avec **données recalculées** ; renommer et supprimer.
- **14 types de documents** : `costControlEstimate`, `costControlOverview`, `costControlMutationsList`, `costControlMutationSummary`, `costControlAwardList`, `costControlContractSummary`, `costControlAddendumSummary`, `costControlPaymentList`, `costControlEntrepreneurSummary`, `costControlPaymentOrder`, `costControlContractPaymentSummary`, `costControlGeneralPaymentSummary`, `costControlGuaranteeSummary`, `costControlGuaranteeList`.
- **Options** « Arrondir les conditions » et « Afficher le total arrondi » (roue dentée d'ADJUDICATIONS, ORDRES DE PAIEMENT et ARRÊTÉS DE COMPTE ▸ Documents), enregistrées par contrôle des coûts et par section.
- **Arrêtés de compte** : nouvel arrêté (« Liste des adjudications »), dialogue « Arrêté de compte » complet, « Informations de la garantie », suppression, statut, tri et adresses de la liste, « Comptabiliser le paiement final ».
- **Rapport de paiements** : filtre, 6 tris, « Récapitulatif de TVA » à cocher, document.
- **Ordres de paiement ▸ Documents** : ordre, bons sur contrat et hors contrat (Ouvrir, Effacer le document, Créer tous les documents, Supprimer tous les documents).

### 2.2 Choix DeltaSub

- **Visionneuse** : aperçu HTML dans un `iframe`, « Imprimer… » (impression du navigateur, qui sait aussi « Enregistrer au format PDF ») et « Modifier les textes… ». L'éditeur complet relève de CH-14 [C].
- **Aucun modèle trouvé** dans le jeu : repli sur l'ancien modèle DESIGN, puis HTML simple, au lieu du dialogue vide de l'original [C].
- **Arrêté créé à l'OK** du dialogue « Arrêté de compte » (F8, décision n° 2) [C].
- **Corrections visibles par défaut** (décisions n° 5, 7, 8, 9) : F12, F15, F16, F18 ; corrections invisibles au bureau : F7, F13, F17.

### 2.3 Hors périmètre, retiré ou non livré

- **Retiré** : « Note d'expédition » et « Commentaire sur le document » (inexistants dans l'original, § 1 n° 5).
- **CH-03** (entrées **grisées**) : « Enregistrer sous forme de fichier PDF… », liste « Fichiers PDF » et son menu (Ouvrir, Partager le fichier PDF…, Import fichier PDF…, Fusionner PDF…, Supprimer), « Créer un PDF », « Créer un PDF avec tous les bons », case « Joindre la facture d'entreprise au bon de paiement. », zones « Facture d'entrepreneur » et « Autres annexes au paiement », « Annexe… » de l'arrêté, case « Supprimer les PDF associés. », colonnes « PDF » et « Annexe PDF à la facture » des grilles (vides).
- **CH-18** : documents Descriptif et Honoraires, Mutations 2, centres libres, métré, équations, montant plafonné (valeurs flexibles correspondantes : vides).
- **CH-07** : présentations (création, favori, préférences `AwardingPref`, `MutPref`, `PayPref` autres que les deux ajoutées ici, `AdviceOfPaymentPref`), filtres des autres sections, titres de colonnes et **noms des centres de coût** (`json/costnamesFr.json`), options d'affichage du rapport (« Afficher les détails », « Couleur des informations détaillées… », « Texte CFC en deux lignes »), option « Afficher les montants avant/après exécution » de l'ordre.
- **CH-14** : édition des bandes, colonnes et mises en page d'un document.
- **Ancien circuit** : préférences d'impression des anciens documents (`*PrintPreferencesDialog`), `DeductionPreferencesDialog` (4 cases), entrées « … [Ancien document] » autres que les deux existantes.
- **Reprise des 719 `.dpdoc`** du bureau (D4-d) : décision n° 4.

### 2.4 Place et accès

- Fenêtre « Contrôle des coûts » (`ccEditor`) : sous chaque section de la colonne de gauche, une ligne indentée **« Documents »** [S `MenuTree|subMenu_*Documents`]. Cliquer une section rouvre sa grille ; cliquer « Documents » affiche la fenêtre de documents de la section à la place de la grille. La barre d'édition reste visible (écart E6).
- Section ARRÊTÉS DE COMPTE : le bouton « + » de la barre propose en tête « Nouvel arrêté de compte … » ; « Editer l'écriture » et « Supprimer l'écriture » agissent sur l'arrêté sélectionné ; un bouton d'outils ▾ en tête de la section porte Adresses, Tri et « Comptabiliser le paiement final ».
- Section PAIEMENTS : en tête de la grille, bouton Filtre (entonnoir), menu « Tri » ▾, case « Récapitulatif de TVA », libellé « Filtré » quand le filtre est appliqué.
- Aucun contrôle de droit (DeltaSub n'en gère pas : CH-08) ; aucune lecture seule.

---

## 3. Modèle de données

### 3.1 Nouvelle collection `cocodoc` (un enregistrement = un dossier de documents)

Nom libre dans `DeltaSub.html`, le serveur et les fichiers des autres chantiers (revérifié : 0 déclaration ; `costcontroldoc` est écarté car préfixe de `costcontroldocument`).

- **Identifiant déterministe** (chaîne) : `<COSTCONTROLDOCUMENT.ID>/<dossier>`, par exemple `3601/award/contractSheet_4305_1`. Deux postes qui créent le même document en même temps obtiennent un conflit 409, et non un doublon. `DS.newIds` n'est pas utilisé.
- **Un enregistrement n'est jamais supprimé** (`val` jamais nul) : « Supprimer le document » met `doc` à `null`.
- **Champs** :

| Champ | Contenu |
|---|---|
| `ID` | identifiant ci-dessus |
| `PROJECT_ID`, `COSTCONTROLDOCUMENT_ID` | affaire et contrôle des coûts (`PROJECT_ID` sert au contrôle d'affaire du serveur au ré-import) |
| `dossier` | sous-dossier Deltaproject (table ci-dessous) |
| `options` | dossiers de section : `{roundContractSummary, addRoundedTotalKey}` (clés des fichiers `.json` de l'original) ; pour `paymentorder`, aussi `addEntrepreneurInvoiceToPayment` (lu, affiché grisé) ; clé absente = défaut |
| `doc` | `null`, ou `{nom, type, templateDesc, jeu, fichier, report, creeLe, creePar, modifieLe, modifiePar}` : `report` est la **copie** de `modeledocument['<jeu>/<fichier>'].report` au moment de la création, puis modifiée par « Modifier les textes… » |

- **Dossiers** [P `deltabauad.settings.CostcontrolFilenames`, `AwardDocumentsFrame.getContractSheetIdentifier`, `FinalpaymentsDocumentsFrame.getGuaranteeSheetDirectoryName`, `AdviceOfPayementDocumentsFrame.openPaymentDoc@98-336`] ; libellé du bouton tant qu'il n'y a pas de document = `newDocument` / `newListDocument` de la fenêtre [S] :

| Section | Dossier | Nom par défaut [S] | Libellé « nouveau » [S] | Type |
|---|---|---|---|---|
| DEVIS GENERAL | `estimate` | « Devis général » | « Devis général » | costControlEstimate |
| CONTRÔLE DU COÛT | `overview` | « Contrôle des coûts » | « Contrôle des coûts » | costControlOverview |
| MUTATIONS | `mutation` ; `mutation/<n° de mutation>` | « Liste des mutations » ; « Mutation » | « Liste des mutations » ; « Mutation » | costControlMutationsList ; costControlMutationSummary |
| ADJUDICATIONS | `award` ; `award/contractSheet_<contactId>_<n° contrat>` ; `award/addendumSheet_<contactId>_<n° contrat>_<n° avenant>` | « Liste adjudication » ; « Contrat » ; « Avenant » | « Contrats et avenants » ; « Contrat » / « Avenant » (« Document » sans sélection) | costControlAwardList ; costControlContractSummary ; costControlAddendumSummary |
| PAIEMENTS | `payments` | « Rapport des paiements » | « Rapport des paiements » | costControlPaymentList |
| COMPTES D'ENTREPRISE | `entrepreneur/<contactId>` | « Entreprise » | « Entreprise » | costControlEntrepreneurSummary |
| ORDRES DE PAIEMENT | `paymentorder` (options) ; `paymentorder/<refId>` ; `paymentorder/<refId>/<n° pmt>` | — ; « Ordre de paiement » ; `<n° pmt>_<contactId>_payment` (sans dialogue) | — ; « Ordre de paiement » ; — | — ; costControlPaymentOrder ; costControlContractPaymentSummary ou costControlGeneralPaymentSummary |
| ARRÊTÉS DE COMPTE | `finalpayment` ; `finalpayment/<refNum>_<contactId>` | « Liste des garanties » ; « Arrêté de compte » | « Liste des garanties » ; « Arrêté de compte » | costControlGuaranteeList ; costControlGuaranteeSummary |

  - `refId` d'un ordre = `o.refId`, sinon `o.id` ; `refNum` d'un arrêté = `a.refNum`, sinon `a.id`.
  - Le numéro d'un contrat ou d'un avenant entre dans le nom du dossier : renuméroter un contrat « perd » son document, **comme dans l'original**.
- **Chargement** : collection hors `HEAVY`. Chaque point d'entrée appelle d'abord `DS.need(['cocodoc','doctemplate','modeledocument','image'])` (`CH01A_T`), qui la marque chargée même vide. Volume mesuré : 19 215 octets pour un Contrôle des coûts (copie du modèle), soit environ 70 documents par an au rythme du bureau.

### 3.2 Serveur : une ligne (lot 1)

Dans `serveur_deltasub.py`, après la ligne `PROTECTED_IF_EDITED |= {"statisticalvalue", "constructionpart", "constructioncomponent", "ebkpelement", "ebkptobkp"}` :

```python
PROTECTED_IF_EDITED |= {"cocodoc"}   # CH-01 : documents du contrôle des coûts créés ou modifiés dans DeltaSub (conservés au ré-import)
```

Aucun import ne produit `cocodoc` aujourd'hui ; un futur convertisseur des `.dpdoc` du bureau (décision n° 4) remplacerait ainsi ses documents non retouchés sans toucher à ceux faits dans DeltaSub. Livraison : copie modifiée complète et diff (déjà faits : `lot1prev/serveur_deltasub.py`, `serveur.diff`, à régénérer sur la source du moment). CH-03 ajoutera ses propres lignes (S1-S6 de spec_17) : aucune ne touche celle-ci.

### 3.3 `costcontrol` : champs ajoutés ou utilisés

Tous écrits par le mécanisme de l'éditeur (`touch()` → `ccEditor.save`), dans l'enregistrement déjà protégé au ré-import.

| Emplacement | Contenu | Lot |
|---|---|---|
| `C.arretes[]` | schéma existant (spec_5 § 22.1 : `id` « d<refNum> », `refNum`, `contratId`, `contactId`, `numero`, `date`, `statut`, `statutCode`, `saisie`, `commentaire`, `description`, `garantie{genre,genreCode,montant,debut,fin}`, `lignes[{cfc,ouvrage,localisation,refCond,brut,net,tva,adjudicationBrut,adjudicationNet,partsForfaits}]`, `conditions`, `annexes`, `totauxDelta`) ; **ajouts** : `avenantIds` (avenants liés rattachés, `AddendumNr`), `apresTva` (`deductionAfterVat`), `ht`, `tva`, `net` (totaux de l'OK) | 3 |
| `C.presentations.arretes[favori].options` | `triGaranties` (`date` \| `adjudication` \| `adresse` \| `numero`, défaut `date`), `adresses` (`1` \| `2` \| `n`, défaut `1`) | 3 |
| `C.filtrePaiements` | `{applique, genres:{contrat,rencherissement,horsContrat}, statuts:{receptionne,libere,transmis,debite}, debut, fin, ouvrages:[[ouvrage,localisation]] (cochés seulement), comptes:[{iban,compte,compte2}] (cochés seulement), ordre}` (`Costcontrol.paymentFilterList`, premier élément) | 4 |
| `C.presentations.paiements[favori].options` | `tri` (`cfc` \| `numero` \| `ordre` \| `entreprise` \| `datePaiement` \| `dateFacture`, défaut `datePaiement`, tri actuel de l'écran), `recapTVA` (booléen, **défaut faux**, § 1 n° 37) | 4 |

- Les présentations autres que `controle` n'ont aujourd'hui **aucune option** dans les données converties : `options` est créé au premier réglage.
- **Numéro de référence d'un nouvel arrêté** [C] : `refNum = 1 + max(refNum)` sur `C.contrats`, `C.paiements`, `C.arretes`, `C.mutations`, `C.ecritures` et `C.ordresPaiement` (`refId`) ; `id = 'd' + refNum`.
- **Arrêté d'un avenant non lié** : `contratId` = identifiant de l'avenant.
- **Contrats issus de la Soumission** (`origineSoumission`, `svbCostContract`, `svcCostContract`) : même schéma, montants figés ; les documents les impriment sur leurs **valeurs stockées** (`totauxDelta{brut,net,tva}`), sans mention de l'origine (aucun équivalent dans l'original).

### 3.4 Écritures groupées et concurrence

- **`cocodoc`** : un seul `DS.commit` par action, `bseq` lu à l'ouverture du dialogue (`ctBseq('cocodoc',id)`, 0 à la création). En cas de 409, rien n'est écrit : message du `DS.commit` et version à jour dans le cache.
- **`costcontrol`** (arrêté, garantie, paiement final, filtre, tri, options de présentation) : les dialogues modifient la copie `C` de l'éditeur puis appellent `touch()`. Comme `ccEditor.save` n'envoie pas de `bseq`, chaque dialogue du chantier **relit la version en cache à l'ouverture** (`ctBseq('costcontrol',id)`) et, **à l'OK**, si elle a changé (autre poste) : toast « ⚠ Modifié entre-temps sur un autre poste : la version à jour est affichée, reprenez votre saisie. », rien d'écrit, dialogue fermé puis `VIEWS['coco'].editorRefresh()` [C] (écart E15).
- Un document et l'enregistrement qu'il imprime ne sont jamais écrits dans le même commit.
- Les dialogues qui utilisent `readK` ne posent `data-k` que sur des `input`, `select` ou `textarea` (correctif `b50edc6`).

### 3.5 Arrondis et formats (lot 1, fonctions pures, écrites)

| Fonction | Règle | Source |
|---|---|---|
| `ch01aR(v, cinq)` | `cinq` : `signe(v) × Math.round(abs(v) × 20) / 20` ; sinon `rJ(v)` ; jamais `−0` ; `null` si la valeur manque | [P] `util.Formatter.round(Double,boolean)@0-79` |
| `ch01aF(v, arr)` | champs texte : `num(ch01aR(v, arr))`, **« 0.00 » si v = 0**, `''` si la valeur manque | [P] `*DocumentReport.getString` |
| `ch01aV(v, arr)` | tableaux : **`''` si v = 0**, sinon `num(ch01aR(v, arr))` | [P] `cc.documents.Strings.formatValue` |
| `ch01aP(v)` | pourcentage : 0 → « 0.0 % », ≥ 100 → « 100.0 % », sinon une décimale et « % » | [P] `Strings.formatOneDigitProc` |
| `ch01aP1(v)`, `ch01aPc(v)`, `ch01aJd(v)` | % des tableaux du contrôle (« <0.1 », sans « % ») ; « DG % » ; `Double.toString` (« 8.1 », « 8.0 ») | [P] `CostOverview*Table.formatOneDigitProc`, `CostEstimateTable.formatPourcentage` |

`num` produit le séparateur « ' » de_CH. Contrôles : `ch01aR(-0.125,false)` = −0.13 ; `ch01aR(-0.025,true)` = −0.05 ; `ch01aF(1234.567,true)` = « 1'234.55 ».

### 3.6 Totaux stockés ou recalculés

`ch01aTot(x)` (contrat, avenant, paiement, arrêté) renvoie `{brut, ht, tva, net}` :
- si `x.totauxDelta` existe et que |Σ nets de ligne − `totauxDelta.net`| ≤ 0.05 : les valeurs de `totauxDelta` (`ht` = `net − tva` si absent) ;
- sinon : Σ des lignes. C'est le cas d'un document modifié dans DeltaSub, dont `totauxDelta` n'est plus à jour [C] (écart E10).

Les nets et TVA **de ligne** et les **montants de condition** (`c.montant`) sont toujours lus tels quels.

---

## 4. Socle commun d'impression (lot 1, écrit)

L'interface ci-dessous est celle de `ch/CH-01/lot1.js` (56 déclarations `ch01a*` / `CH01A*`). Elle est attendue par CH-02 (spec_15), CH-03 (spec_17, ancres B1-B4), CH-08 (spec_18), CH-11 (spec_16) et EC-2 lot 4 : **les noms, signatures et les lignes citées au § 10.2 ne changent plus**.

### 4.1 Nœud « Documents » et aiguillage

- **Colonne de gauche** (ancre A2) : après chaque section, `ch01aDocNode(s, side, redraw)` ajoute une ligne « Documents » (retrait 28 px, graisse normale). Clic : `CCV.sec = s ; CCV.docs = true`, surlignage de cette ligne seule, `redraw()`. Le clic sur une section remet `CCV.docs = false` (ancre A1).
- **`draw()`** (ancre A3) : si `CCV.docs`, appel de `ch01aDocsDraw(pane, E)` puis retour. `E = {C, p, doc, id, sec, touch}` : copie de travail de l'éditeur, affaire, en-tête `costcontroldocument`, identifiant, section, fonction d'enregistrement.
- **`ch01aDocsDraw`** attend `DS.need(CH01A_T)` (« Chargement des modèles… » entre-temps ; « Modèles indisponibles : serveur injoignable. » en cas d'échec), puis appelle la fenêtre de la section :

| Section | Fonction | Lot |
|---|---|---|
| DEVIS GENERAL | `ch01aKvFrame` | 1 |
| CONTRÔLE DU COÛT | `ch01aOverviewFrame` | 1 |
| MUTATIONS / ADJUDICATIONS / COMPTES D’ENTREPRISE | `ch01bMutFrame` / `ch01bAwardFrame` / `ch01bEntFrame` | 2 |
| ARRÊTÉS DE COMPTE | `ch01cFinalFrame` | 3 |
| PAIEMENTS / ORDRES DE PAIEMENT | `ch01dPayFrame` / `ch01dOrderFrame` | 4 |

  Chaque appel est gardé par `typeof …==='function'` : un lot non intégré affiche « Documents de cette section : CH-01, lot n (non intégré). ». Signature commune des fenêtres : `(pane, E)`.
- **Rafraîchissement** (ancre A4) : `VIEWS['coco'].refresh` réagit aussi à `cocodoc` (`editorRefresh` redessine hors dialogue).

### 4.2 Panneau « Document » (`ch01aPanel(o)`)

Composant répété dans chaque fenêtre [P `doc.ui.files.DocumentReportPanel`].
- **Paramètres** : `o = {E, dossier, type (ou fonction), nomDefaut, label, titre, job, dis, fixe}`.
  - `label` : libellé « nouveau » de la fenêtre (§ 3.1), affiché « «label» » sur le bouton tant qu'il n'y a pas de document ;
  - `titre` : intertitre facultatif au-dessus du panneau ;
  - `job(rep)` rend `{F, tables, adapt, old, ref}` **au moment de l'ouverture** : champs, tableaux, adaptation facultative du modèle préparé (colonnes masquées), données du repli ancien (`old : {title, cols, rows, fields, tables}`), objet imprimé pour les replis `ccPrintOrder` / `ccPrintBon` (`ref`). `job` ne renvoie pas de `title` (le `reportTitle` du modèle est gardé) ;
  - `dis` : le panneau dépend d'une liste et aucune ligne n'est sélectionnée ;
  - `fixe` : nom imposé, sans dialogue (bons de paiement).
- **Disposition** : intertitre ; « Document » ; « Nom du document » + **bouton principal** (nom du document, ou « «label» ») + bouton ▾ ; « Fichiers PDF » + tableau « Nom du fichier | Date de dernière modification » vide et grisé (infobulle « Fichiers PDF : prévu avec CH-03 ») + bouton ▾ des PDF.
- **Bouton principal** : ouvre le document s'il existe, sinon le crée [P `jOpenDocumentButtonActionPerformed@4-18`].
- **Menu ▾ du document**, dans cet ordre [P `getDocumentPopupMenu@0-414`] :

| Entrée | Active si |
|---|---|
| Nouveau document | aucun document |
| Renommer le document… | un document |
| Supprimer le document | un document |
| — | |
| Ouvrir le document | un document |
| — | |
| Enregistrer sous forme de fichier PDF… | **grisée** (CH-03, ancre B1) |

- **Menu ▾ des PDF** [P `getPdfFilesPopupMenu`] : Ouvrir / Partager le fichier PDF… / — / Import fichier PDF… / Fusionner PDF… / Supprimer : **toutes grisées** (CH-03, ancre B2).
- **`dis`** : bouton principal et menus grisés [P `checkGuards@0-37`].

### 4.3 Nom, renommer, supprimer (`ch01aNameDlg`, `ch01aNew`, `ch01aRename`, `ch01aErase`)

- **« Nom du document »** [S `DocumentNameDialog|dialogTitle`, `|name` « Nom »] : un champ prérempli (nom par défaut, § 3.1), intitulé = libellé de la fenêtre.
  - OK actif si le champ n'est pas vide ; le nom est rendu sans espaces de bord (un nom fait d'espaces seulement garde le dialogue ouvert [C]).
  - `/ \ : * ? " < > |` refusés à la frappe, avec « Caractère incorrect: x » ; au plus 64 caractères [P `FileNameGuard(64)`].
  - « Annuler » abandonne la création.
- **Renommer le document…** : même dialogue, intitulé « Renommer le document », prérempli ; OK → `doc.nom` (commit avec `bseq`).
- **Supprimer le document** : `ivAsk('Avertissement','Voulez-vous supprimer ce fichier définitivement ?')` [S `Strings|msgDeleteFileDefinitely`] ; Oui → `doc = null` (options conservées).

### 4.4 Choix du modèle (`ch01aTplList(type, p)` pur ; `ch01aTplPick(type, p)` → Promise)

1. Groupe = `p.DOCTEMPLATEGROUPNAME || 'Group.project'` pour un document d'affaire ; `'Group.general'` si `p` est nul (documents généraux de CH-09 et CH-11).
2. Groupe introuvable dans `doctemplategroup` : `ctMsg('Information', "DocTemplateGroup '<groupe>' (<type>) not found!")` (texte non traduit de l'original), résultat `null`.
3. Liste : `doctemplate` avec `DOCUMENTTYPEKEY === type`, `String(TEMPLATEFOLDERID) === String(groupe.TEMPLATEFOLDERID)`, `LANGUAGEKEY === 'fr'`, `!ISHIDDEN`, et un contenu `modeledocument['<jeu>/<FILENAME>'].report.sections`. Tri : `ISLOCKED` décroissant, `LANGUAGEKEY`, `FILENAME`.
4. **Aucun** modèle : `'aucun'` → repli (§ 4.10) [C, écart E4]. **Un** : pris sans dialogue. **Plusieurs** : dialogue ci-dessous.
5. Résultat : `{jeu, fichier, desc, rep, id}`.

**Dialogue « Choisir le modèle »** [S `SelectTemplateDialog|dialogTitle`] [P `SelectTemplateDialog.<init>`, `DocTemplateTableModel` type `small`] : grille « Description | Langue » (la langue s'affiche « Français ») ; première ligne sélectionnée (décision n° 6) ; OK actif avec une ligne sélectionnée ; double-clic = OK ; Échap = Annuler (`null`). Au bureau, jeu 1 : « Contrat », « Contrat_Entreprise » ; « Bon de paiement sur contrat », « Bon de paiement ».

### 4.5 Cycle de vie et visionneuse (`ch01aNew`, `ch01aOpen`, `ch01aRender`, `ch01aView`, `ch01aTexts`)

| Action | Déroulement |
|---|---|
| **Nouveau** | nom (§ 4.3, sauf `fixe`) → modèle (§ 4.4) → si `'aucun'` : repli (§ 4.10), rien d'enregistré → sinon un commit : `doc = {nom, type, templateDesc, jeu, fichier, report: copie profonde, creeLe, creePar}` (`bseq` lu avant le dialogue de nom) → ouverture |
| **Ouvrir** | `ch01aRender(o, rec)` : `rep = ch01aPrep(doc.report)`, `J = o.job(rep)`, `J.adapt(rep)` éventuel, `svDpHTML(rep, [J], {jeu, type, title: doc.nom})` → `ch01aView(doc.nom, R, {edit})` |
| **Visionneuse** | dialogue de 920 px, titre = nom du document ; `iframe` (`srcdoc = svDpDocHTML(R)`, 72vh) ; boutons « Modifier les textes… » (document enregistré), « Imprimer… » (`contentWindow.print()`, sans fenêtre surgissante), « Fermer » |
| **Modifier les textes…** | voir ci-dessous |

**« Modifier les textes… »** (substitut de l'éditeur de l'original) [C] :
- Pour chaque section visible, dans l'ordre : intertitre, **en-têtes de section** (`pageItems`, « En-tête <cellId> »), bandes `TextBand`, `WrappingTextBand` et `GridBand` (ordre `sortOrder`, nom de la bande).
- Chaque fragment `TextString` est éditable (`input`, ou `textarea` s'il contient un saut de ligne) ; chaque `TextField` est une étiquette « «nom du champ» » : les champs ne peuvent être ni supprimés ni ajoutés. Bandes sans texte fixe non listées ; aucun texte : « Ce document n’a aucun texte fixe modifiable. ».
- OK : un commit, `doc.report` modifié, `modifieLe`, `modifiePar`, `bseq` lu à l'ouverture ; la visionneuse se redessine. Pour les autres chantiers : `ch01aTexts(rec, apres, save)` avec une fonction `save(report)` fournie.

### 4.6 Préparation du modèle (`ch01aPrep(rep)`) : `svDpHTML` n'est pas modifié

Sur une **copie profonde** :
- `LineBand {lh, lc, mt, ml, sortOrder, isH}` → `TextBand {h: max(lh, 0.05), rs: {bgc: lc ?? -16777216}, c: {class:'Text', ts: []}, …}` : rectangle plein de `lh` mm, comme l'original.
- `TextField` `projectDescription` → `{f: 'x|ch01aProjDesc', s: 'standard'}` ; `userJobFunction` → `{f: 'x|ch01aUserJob', s: 'standard'}`.
- `projectContact4` : résolu par `svField` sur `F.projectContact4 = svC(p.CONTACT4_ID)`, sans réécriture.
- Styles : `svRowStyles` retombe déjà sur « Default » (§ 1 n° 20).

### 4.7 Contexte commun des champs (`ch01aCtx(E, {F, ouvrages})`)

| Champ | Valeur |
|---|---|
| `project` | `{t:'project', p}` (formats de `svFmtVal`) |
| `date`, `reportDate`, `docDate` | date du jour |
| `docTitle` | `''` (préférences des anciens documents non reprises) |
| `appUser` | collaborateur du poste (`ME.staff`) ; `ch01aUserJob` = `JOBFUNCTION` de l'`appuser` du poste |
| `staff` | collaborateur de `COSTCONTROLDOCUMENT.USERID` (`svStaffOfUser`) |
| `constructionInternalVersion` / `…VersionNr` / `…Note` | `VERSION` / `VERSIONNUMBER` / `NOTE` de l'en-tête |
| `projectMemberBuilder`, `…Architect`, `…ConstructionManager` (+ `Contact`, `Responsible`) | intervenants des rôles 8, 1 et 2 (`svMember`, `svC`) |
| `projectContact4`, `ch01aProjDesc` | `svC(p.CONTACT4_ID)`, `p.DESCRIPTION` |
| `projectmanagementBuilderBySuproject` | `ch01aMoOuv(p, ouvrages)` : maître d'ouvrage des ouvrages cités (`subproject.CONTACT_ID`), un seul ou tous identiques → ce contact ; sinon `projectMemberBuilder` [P `CostAwardSummaryDocumentReport.getString@144-832`]. Devis général et Contrôle des coûts : ouvrages du **filtre**, absent dans DeltaSub → maître d'ouvrage de l'affaire |

Signatures (`appUserSignature`…) : vides ; CH-08 les alimentera (spec_18). Chaque type complète `F` (§ 5).

### 4.8 Tableaux

**Données passées à `svDpTable`** : `tables[nom] = {rows: [{c: [valeur par identifiant de colonne], f: [valeurs flexibles], st}], flex: [titres]}`.
- Montants : **chaînes déjà formatées** (`ch01aV` ou `ch01aF`).
- Chaque constructeur remplit **tous** les identifiants de colonne de la classe 16.05 ; le modèle choisit ceux qu'il affiche. La colonne flexible du modèle se repère par son **type** (`svDpCols`, inchangé).

**Styles de ligne** (`RowStyleSet$RowType` → clé `svRowStyles`) : tableHeader `th` ; tableRow `tr` ; tableTotal `tt` ; tableLevel1Total `l1t` (« Total HT » des conditions) ; tableLevel4 `l4` (« Arrondi ») ; catalogHeader `ch` ; catalogLevel1 / 2 / 3 / 1a / 2a / 3a `c1` / `c2` / `c3` / `c1a` / `c2a` / `c3a` ; catalogSubtotal1-3 `cst1`-`cst3` ; catalogTotal / Totala `ct` / `cta` ; lignes de détail `cd`.

**Propriétés de tableau** : `ch01aProp(band, k, défaut)` lit `band.tableProperties[{k, v}]` ; `ch01aBands(rep, nom)` rend les bandes d'un `TableField`. Table des clés : `rech_orig` § 1.8. « Fond alterné », « Titres multilignes » et couleurs ne sont pas rendus (écart E9).

**Colonnes flexibles** (`CH01A_FLEX`, `ch01aFlex(C, cle)`) :
- Présentation favorite de la section (`favori`, sinon la première) ; colonnes dans l'ordre ; on ne garde que les `idDelta` **admis** par la section ; au plus 25 [P `getFlexColumnNames(list, 25)`].
- Titre : `C.titresColonnes[id]`, parties non vides jointes par une espace ; à défaut `CC_COL[id].t`.
- Sans présentation : aucune colonne flexible [P : les `setReportData` testent `setting != null`].

| Section (`C.presentations`) | Admis [P `cc.<section>.Columns.getFlexColumnNames`] | Remplis par l'original [P `w2/flexmap.py`] | Utilisés au bureau |
|---|---|---|---|
| `controle` | 7-8, 10-15, 20-37, 40-46, 50-67, 70-103, 120-144, 150-154, 160-164, 170-181, 190-195, 200-202, 204-209, 220-227, 230, 1601-1602, 1611-1612, 1621-1622, 1631-1632, 1641-1642 | 10-15, 20-31, 40-46, 50-61, 70-90, 95-103, 120-128, 132-134, 160-161, 163-164, 170-181, 190-195, 200-202, 204-209, 16x1-16x2 (sauf 1621-1622) | 11, 13, 14, 15, 25, 28, 31, 42, 43, 44, 45, 84, 87, 90, 101, 122, 160, 164, 172, 178, 181, 190 |
| `adjudications` | 10-15, 20-37, 40-46, 50-67, 70-90, 94-103, 120-144, 150-154, 160-164, 170-181, 190-195, 200-202, 204-209, 220-226, 230, 16xx | 82-90, 94 | 84, 87, 90 (91 et 92 des favorites : non admis, écartés) |
| `mutations` | 7-8, 10-15, 20-31, 40-46, 50-61, 70-103, 120-144, 150-154, 160-164, 170-181, 190-195, 200-202, 204-209, 220-227, 230, 16xx | 20-31, 50-61 | 25, 28, 31 |
| `paiements` | 120-128, 150-154, 160-164, 170-181, 190-195, 200-202, 204-209, 220-227, 230, 16xx | 120-130, 132-134 | 120, 121, 122 |
| `ordresPaiement` | 90, 121-130, 132-138, 140-144, 150-154, 160-164, 170-181, 190-195, 200-202, 204-209, 220-227, 230, 16xx | 90, 122, 136 | 136, 90, 122 (dans cet ordre) |
| `comptesEntreprise` | 10-15, 20-37, 40-46, 50-67, 70-90, 94-103, 120-134, 161, 1611-1612 | 82-90, 120-130, 132-134, 161, 1611-1612 | 84, 87, 90, 122, 161 |

Chaque lot implémente **toutes** les valeurs de la colonne « Remplis » de ses tableaux (hors CH-18 : 50-61 Mutations 2, 95-100 plafonné et métré, 190-209 équations et centres libres → vides) ; un identifiant admis non rempli donne une cellule vide (F13 corrigé). Largeurs : égales (`svDpCols` recopie la colonne modèle), alors que l'original les rend proportionnelles (écart E9).

**Valeurs flexibles** (identifiants de `rech_orig` § 10) : 82-84 contrats, 85-87 avenants, 88-90 contrats + avenants, 94 niveau des prestations (`ch01aP`), 120-122 paiements, 123-125 renchérissement, 126-128 sur contrat, 132-134 hors contrat, 129 compte bancaire de l'entreprise (`banque.iban`, sinon `banque.compte`), 130 compte du maître d'ouvrage (`banque.compteMO`), 136 paiements à ce jour, 160 contrat − paiements, 161 contrat − paiements sur contrat, 163-164 (contrat ou DG rév.) − paiements, 16x1 / 16x2 = TVA / HT des quatre précédents ; triplets HT / TVA / TTC dans cet ordre.

### 4.9 Options d'arrondi (`ch01aGear(E, dossier)`, `ch01aArr(E, dossier)`)

- **Roue dentée ▾** en tête des fenêtres ADJUDICATIONS, ORDRES DE PAIEMENT et ARRÊTÉS DE COMPTE ▸ Documents : « Arrondir les conditions », « Afficher le total arrondi » (coches) [S `…DocumentsFrame|doForceRound`, `|addRoundedTotal`].
- Chaque clic inverse l'option et l'écrit dans `options` du dossier de section (`award`, `paymentorder`, `finalpayment`), créé au besoin avec `doc: null`.
- **Défaut** : `C.parametres.arrondir` (faux dans les 84 contrôles du bureau) [P `readForceRoundJasonString@0-28`].
- `ch01aArr` renvoie `{cfg, cond, tot}` :
  - `cfg` = `!!C.parametres.arrondir` : **champs texte** du Contrat, de l'Avenant, de l'Arrêté, de l'Ordre, des listes (adjudications, garanties, mutations), du Devis général et du Contrôle des coûts ;
  - `cond` = « Arrondir les conditions » : **tableaux** du Contrat, de l'Avenant, de l'Arrêté et des Bons, et **champs texte des Bons** ; chaque montant arrondi, totaux refaits sur les montants arrondis ;
  - `tot` = « Afficher le total arrondi » : `ch01aRoundRow(t, a, o)` rend `{st:'l4'}` « Arrondi » avec « (x) », x = `num(ch01aR(t, true))`, si `tot && !cond && |rJ(t) − ch01aR(t, true)| ≥ 0.005` [P `roundetEqualAnrounded@0-43`].
- Tableaux qui portent la ligne « Arrondi » : positions, conditions et contrat-avenants du Contrat et de l'Avenant ; positions et conditions des Bons ; conditions de l'Arrêté ; « Paiements à ce jour » de l'Arrêté (sous le total et sous le solde). « Commande » de l'arrêté : jamais (F10).
- **Tableau des conditions commun** : `ch01aCondRows(x, o)` (5 colonnes : Désignation | Type | N° | Monnaie | Montant ; brut ; conditions appliquées dans l'ordre des niveaux, « Type » = `num(valeur,2)+' %'` pour une condition en %, montant vide si 0 sauf TVA « 0.00 » ; « Total HT » (`l1t`) une fois avant la 1re TVA ; total ; « Arrondi »). `o = {brutLbl, totLbl, htLbl, cur, cond, tot, brut, total, conditions}`.

### 4.10 Repli : ancien modèle, puis HTML simple (`CH01A_OLD`, `CH01A_OLDF`, `ch01aOld`, `ch01aHTML`)

- Quand `ch01aTplPick` renvoie `'aucun'` :
  - Ordre de paiement → `ccPrintOrder(C, p, J.ref)` ; Bons → `ccPrintBon(C, p, J.ref)` (fonctions existantes) ;
  - autres types → `tplOr(() => tplPrint({type: CH01A_OLD[type], project: p, title, ctx: {fields}, cols, rows, tables, fallback}), html)` ; `fields` = chaînes de `J.F`, plus les anciens noms (`CH01A_OLDF` : `projectBkpNumber` ← `bkp`, `projectContractNumber` ← `constructionContractNumber`, `projectContractDate` ← `contractDate`, `amountTotalExcludedVat` ← `amountTotalExVat`) et `J.old.fields` ;
  - `html` = `ch01aHTML(J)` : titre et tableaux en HTML simple (`open('','_blank')`, comme `ccPrintHTML`).
- `CH01A_OLD` : Estimate → `projectCostcontrolEstimate` ; Overview → `…Overview` ; MutationsList → `…MutationList` ; MutationSummary → `…MutationSheet` ; AwardList → `…ContractList` ; ContractSummary → `…Contract` ; AddendumSummary → `…Addendum` ; PaymentList → `…PaymentRapport` ; EntrepreneurSummary → `…EntrepreneurAccount` ; GuaranteeSummary → `…EntrepreneurDeduction` ; GuaranteeList → `…GarantyList`.
- **Libellés de l'ancien circuit** (lot 4, ancres A12 et A13) : les deux entrées du menu « Documents » des ORDRES DE PAIEMENT deviennent « Ordre de paiement [Ancien document] » et « Bon de paiement [Ancien document] » [S `Strings|legacyMenu`]. « Imprimer le tableau (A4 paysage) » ne change pas.

### 4.11 Interface offerte aux autres chantiers

Sans dépendre du contrôle des coûts :
- `ch01aTplList(type, p|null)`, `ch01aTplPick(type, p|null)` (§ 4.4 ; `null` → « Group.general ») ;
- `ch01aPrep(rep)` (§ 4.6) ;
- `ch01aView(titre, R, o)` (§ 4.5) ;
- `ch01aTexts(rec, apres, save)` sur `{doc: {report}}` avec une fonction d'enregistrement fournie ;
- `ch01aNameDlg(nom, titre)` → Promise(nom | null) ;
- `ch01aR`, `ch01aF`, `ch01aV`, `ch01aP` (§ 3.5).

Propres au contrôle des coûts, mais point d'accroche de CH-03 : `ch01aPanel`, `ch01aOpen`, `ch01aRender`, `ch01aView` (ancres B1-B4, § 10.2). Un autre chantier qui veut des documents enregistrés crée sa propre collection sur le modèle de `cocodoc`.

---

## 5. Documents imprimés : structure et remplissage

Pour chaque type : la **fenêtre** de la section, les **champs propres** (libellés [S] `<Report>|<champ>`), les **tableaux** (nom du `TableField`, colonnes de la classe, lignes) et le modèle du bureau (structure : `rech_orig` annexe A). Arrondis : `cfg`, `cond`, `tot` du § 4.9. Montants de champ : `ch01aF` ; de tableau : `ch01aV`.

**Avertissement de filtre** [P n° 30] : pour les documents dont la section a un filtre appliqué, `ctMsg('Information','Attention, vous travaillez en mode filtre.')` à la préparation des données (création et ouverture), puis le document s'ouvre. Dans cette vague, seul le rapport de paiements a un filtre (lot 4) ; les autres sections n'en ont pas dans DeltaSub (CH-07), leur `reportFilter` est `''`.

**Sujet de partage** (pour CH-03) : « <libellé du document> <n° d'affaire> <libellé de tri de l'affaire> » [P `getDefaultSubject`].

### 5.1 DEVIS GENERAL ▸ Documents : « Devis général » (`costControlEstimate`, lot 1, écrit)

- **Fenêtre** `ch01aKvFrame` : un panneau, dossier `estimate`.
- **Champs** : `amountTotal`, `amountTotalExVat`, `amountVat` (Σ `dgTTC`, `dgHT`, `dgTVA` des positions non générées, `cfg`) ; `amountTotInclFac` = TTC × `C.parametres.facteurDG` ; `projectBaseIndex` « Indice ICC » (`BASISINDEX`, une décimale) ; `reportFilter` `''` ; `docDate`, `docTitle`.
- **`costcontrolEstimateTable`** « Devis » : colonnes fixes 0 N° CFC | 1 Désignation CFC | 2 Ouvrage | 3 Localisation | 4 Montant HT | 5 TVA | 6 Montant TTC | 7 Devis général indexé | 8 DG %. Positions de TTC non nul (ordre `cfcCmp`), styles `c1` / `c2` / `c3` (positions générées à 3 chiffres comme à 2 si k1) ; k0 « Afficher les subdivisions » → lignes par ouvrage (`cst1`-`cst3`) ; « DG % » = part dans la position de 1er niveau, « 100.0 » au total ; ligne `ct` « Total ». Sans subdivisions : colonnes Ouvrage et Localisation masquées (largeur rendue à la Désignation).
- **`costcontrolSummaryEstimateTable`** « Récapitulatif du devis général » : mêmes colonnes ; k0 « Totaux récapitulatifs à 1 chiffre » ; k1 « Devis avec subdivisions » ; « Total ».
- **Bureau** : jeu 1 « Devis général » (pages Substances) ; 1 document enregistré.

### 5.2 CONTRÔLE DU COÛT ▸ Documents : « Contrôle des coûts » (`costControlOverview`, lot 1, écrit)

- **Fenêtre** `ch01aOverviewFrame` : un panneau, dossier `overview`.
- **Données** : `ccCalc(C)` (le calcul de l'écran) et présentation favorite `controle` ; montants HT par `ccCalc` sur une **vue HT** (`ch01aHT`) ; subdivisions par `ch01aOuv` [D].
- **Champs** : `docDate`, `docTitle`, `reportFilter` (`''`), `projectBaseIndex` « Indice », `subproject` « Ouvrage » (`''`), `bkpRange` « BKP: », `projectmanagementBuilderBySuproject`.
- **`costcontrolTotalTable`** « Totaux des centres de coût » (page de garde) : Désignation | Montant HT | TVA | Montant TTC ; une ligne par centre correspondant à une colonne de la favorite, dans l'ordre des colonnes, dédoublonnée, **TTC ≠ 0** ; `cfg` [P n° 22].

| idDelta | Centre | Libellé imprimé (décision n° 7) | HT / TVA / TTC |
|---|---|---|---|
| 11, 13 | `kv_costname` | « Devis général » | Σ `dgHT` / `dgTVA` / `dgTTC` des positions non générées |
| 14 | `kv_index_costname` | « Devis général avec facteur » | TTC × `facteurDG` ; HT et TVA « 0.00 » |
| 20, 22 | `inflation_costname` | **« Renchérissement »** (original avec les noms par défaut : « Variations », F15) | mutations `rencherissement` du centre 1, Σ signée (destination +, origine −) |
| 23, 25 | `transfer_costname` | « Transfert » | idem, `transfert*` |
| 26, 28 | `increase_costname` | **« Variations »** (original : « Renchérissement », F15) | idem, `variation` |
| 29, 31 | `mutation_costname` | « Mutation » | toutes les mutations du centre 1 |
| 40, 42 | `kv_1_costname` | « Devis général 2 » | HT = DG HT + mutations HT ; TTC = DG TTC + mutations TTC ; TVA = TTC − HT |
| 82-84 / 85-87 / 88-90 | `contract_` / `addendum_` / `contractAndAddendum_costname` | « Contrats » / « Avenants » / « Contrats et avenants » | Σ des lignes : `net − tva` / `tva` / `net` |
| 101, 103 | `award_profit_costname` | « Bénéfice d'adjudication » | TTC = contrats et avenants − DG 2 ; HT par la vue HT |
| 120, 122 | `payments_costname` | « Paiements » | Σ des lignes de paiement |
| 170, 172 | `prognosis_costname` | « Coût probable » | TTC = `G.coutProbable` ; HT par la vue HT |
| 176, 178 | `additionalCosts_costname` | « Provisions » | Σ des écritures `provision` |
| 179, 181 | `costBalance_costname` | « Etat du coût » | TTC = `G.etatCout` ; HT par la vue HT |
| autres | — | — | CH-18 |

  Les noms personnalisés du bureau (`json/costnamesFr.json`) ne sont pas repris : DeltaSub imprime ces libellés (écart E7, CH-07). C'est exactement ce que le lot 1 écrit fait déjà (`CH01A_CNOM`) ; si Paulo choisit la variante fidèle de la décision n° 7, seuls les deux libellés de `renc` et `varia` s'échangent.
- **`costcontrolOverviewSummaryTable`** « Totaux récapitulatifs à 1 ou 2 chiffres » : 0 N° CFC | 1 Désignation CFC | 2 Ouvrage | 3 Localisation | 4 flexibles ; k0 `displayOneDigitPositions` / `displayTwoDigitPositions` ; k1 « Afficher les subdivisions » ; styles `c1` / `c3` / `c1a` / `c2a` ; `ct` « Total » = `R.G`. Positions sans valeur dans les colonnes affichées (hors %) : omises [P `Columns.isEmpty`].
- **`costcontrolOverviewTable`** « Récapitulatif des coûts » : 0 N° CFC | 1 Désignation CFC | 2 Entreprise | 3 Ouvrage | 4 Localisation | 5 flexibles ; lignes de l'écran (positions `c1` / `c2` / `c3`, positions générées comme `c2` si k6, lignes d'entreprise `c3`, détails `cd` des colonnes marquées « détails » avec le signe `detailSign` et la marque `finalPayment` de la présentation) ; `ct` « Total ».
- **Valeurs flexibles** : `CC_COL[id]` (TTC de `ccCalc`), sauf 11 DG **HT** (vue HT), 14 DG × facteur, 44 / 45 DG 2 par m² / m³ (vide si surface ou volume nul), 190 `''` (CH-18) ; % : `ch01aP1` sur la position de 1er niveau.
- **Bureau** : jeu 1 retouché le 05.03.2025 (3 sections paysage, en-têtes « DECOMPTE FINAL » et « <n° d'affaire>.DC.FF ») ; 20 documents enregistrés.

### 5.3 ADJUDICATIONS ▸ Documents : « Liste contrats et avenants », « Contrat », « Avenant » (lot 2)

**Fenêtre** (`ch01bAwardFrame`) [P `AwardDocumentsFrame.initDialog`, `initContractBookTable@0-357`, `setContractBookTable@0-466`] :
- en haut, panneau « Contrats et avenants » : dossier `award`, nom « Liste adjudication » ;
- roue dentée ▾ (§ 4.9) ;
- grille : N° CFC (60) | Désignation | N° (80) | Adjudicataire | Type (100) | Montant (120) | Document (80) | PDF (80) [S `bkpNrCol`, `bkpTextCol`, `contractNrCol`, `entrepeneurCol`, `awardKindCol`, `valueCol`, `docAbvailableCol`, `pdfAbvailableCol`] :
  - pour chaque contrat (ordre du § 1 n° 40), sa ligne, puis une ligne par avenant du contrat ;
  - N° CFC et Désignation : lot d'adjudication (`lot.numero`, `lot.texte`) ; N° : n° du contrat, **n° propre** de l'avenant ; Adjudicataire : entreprise du **contrat** (aussi sur les lignes d'avenant) ; Type « Contrat » / « Avenant » ; Montant : TTC (`ch01aTot`) arrondi par `cfg` ;
  - Document : « x » si le dossier de la ligne a un document ; PDF : vide (CH-03) ;
  - sélection simple, tri par en-tête permis.
- en bas, libellé « Contrat/Avenant » [S `awardDocument`] et panneau du document de la ligne sélectionnée (type Contrat ou Avenant ; libellé « Contrat » / « Avenant » ; sans sélection : « Document », panneau grisé).

**« Liste contrats et avenants »** (`costControlAwardList`) [P `AwardDocumentsFrame.setListReportData@1-205`] :
- **Champs** : `contractSum` « Montant du contrat », `addendumSum` « Avenants », `awardSum` « Contrats et avenants » (Σ TTC, `cfg`) ; `reportFilter` `''`.
- **`costContractListSummaryTable`** « Récapitulatif des totaux » : Désignation | Monnaie | Total HT | TVA | Total TTC ; lignes « Montant des contrats », « Montant des avenants », « Total des adjudications » (`tt`) [S `CostContractListSummaryTable|*`] ; `cfg`.
- **`costcontrolAwardListTable`** « Liste d'adjudications » [P n° 31] : colonnes 0 CFC | 1 Désignation CFC | 2 Entreprise | 3 Ouvrage | 4 Localisation | 5 Numéro du contrat | 6 Date | 7 Statut du contrat | 8 Genre de contrat | 9 Descriptif contrat | 10 flexibles ; en-tête `ch`, lignes `tr`, total `tt` (k0).
  - Ligne de **contrat** : 0-1 lot ; 2 entreprise (`ccEntName`) ; 3-4 ouvrage / localisation communs aux lignes (vides s'ils diffèrent) ; 5 n° ; 6 date ; 7 `CTR_ST[statut]` ; 8 `designation`, sinon « Contrat » ; 9 `description` ; flexibles 82-84 = contrat HT / TVA / TTC, **88-90 = contrat + tous ses avenants** (liés ou non), 94 = `ch01aP(niveauPrestations)`.
  - Ligne d'**avenant** (après son contrat, ordre des avenants) : 5 « <n° contrat> | <n° avenant> » ; 8 `designation`, sinon « Avenant » ; 85-87 = avenant ; 94 = niveau de l'avenant ; 82-84, 88-90 vides ; **omise si toutes ses valeurs flexibles affichées sont nulles**.
  - Total : 82-87 cumulés, 88-90 = total des adjudications, 94 vide.
- **Bureau** : modèle d'origine ; 6 listes enregistrées.

**« Contrat » et « Avenant »** (`costControlContractSummary`, `costControlAddendumSummary`) : un seul constructeur [P `CostAwardSummaryDocumentReport.getString@144-2313`].

| Champ (libellé [S]) | Valeur |
|---|---|
| `contractSum` « Montant du contrat » | TTC du **contrat** (`cfg`) |
| `previousAddendumSum` « Avenants précédents » | Σ TTC des avenants du contrat **avant** l'avenant imprimé (ordre `refNum`) ; vide pour un contrat ; « 0.00 » pour un premier avenant [D] |
| `contractAndAddendumSum` « Contrats + avenants TTC » | contrat + avenants **jusqu'à l'avenant imprimé inclus** ; contrat seul pour un contrat |
| `addendumSum` | vide (non implémenté dans l'original) |
| `amount` « Total HT » / `amountVat` « TVA » / `amountTotal` « Total TTC » | du document imprimé (avenant, sinon contrat), `ch01aTot` |
| `constructionCostcontrolDescriptor` « Descriptif » | `description` de l'avenant, sinon du contrat |
| `bkp` / `bkpNumber` / `bkpText` | lot du **contrat** : « n° texte » / n° / texte |
| `constructionContractNumber` / `constructionAddendumNumber` | n° du contrat / n° de l'avenant |
| `contractDate` / `addendumDate` | dates |
| `constructionLevelOfProficiency` « Niveau des prestations » | `ch01aP(niveauPrestations)` |
| `projectContractor` / `…Contact` / `…Responsible` | personne de contact de l'entreprise si elle existe, sinon l'entreprise / l'entreprise / la personne seule (`svPair` sur l'entreprise du contrat) |
| `projectContractStatus` « Statut du contrat » | `CTR_ST[statut]` du contrat |
| `note` « Remarque » | `designation` du **contrat**, même pour un avenant (F2, reproduit) |
| `projectAddendumComment` / `projectContractComment` | `designation` de l'avenant / du contrat |

- `projectmanagementBuilderBySuproject` : ouvrages des lignes du document.
- **`awardListTable`** (`AwardTable`) : 0 N° CFC | 1 Désignation | 2 Ouvrage | 3 N° (réf. cond.) | 4 Monnaie | 5 Montant brut | 6 Montant net. Une ligne par ligne du document ; Désignation = `libelle` et `libelle2` de la position ; Ouvrage = vide, « OUV », ou « OUV␣␣|␣␣LOC » ; Monnaie = `p.CURRENCY`, sinon CHF ; montants `cond`. Puis `tt` (k0, « Totaux » ; au bureau « Montant total brut HT »), sommes des montants **arrondis** ; « Arrondi » éventuel.
- **`conditionTable`** : `ch01aCondRows` avec « Contrat brut » / « Avenant brut » (1re ligne du titre `condContractBrutto` / `condAddendumBrutto` de `C.titresColonnes`, sinon ce libellé), « Total HT » (`condNettoExVatTotal`), total k0 « Total TTC ».
- **`contractAndAddendum`** : 0 N° | 1 Désignation | 2 Date | 3 Monnaie | 4 Montant brut | 5 Montant net ; ligne du contrat (Désignation = `designation`, sinon « Contrat ») ; pour un avenant, les avenants jusqu'à l'avenant imprimé inclus ; `tt` k0 ; « Arrondi ».
- **Bureau** : « Contrat_Entreprise » (jeu 1, styles `Contrat`) pour 108 des 113 contrats enregistrés ; 6 avenants.

### 5.4 MUTATIONS ▸ Documents : « Liste des mutations », « Mutation » (lot 2)

**Fenêtre** (`ch01bMutFrame`) [S `Mutation1DocumentsFrame|*`] [P n° 39] :
- en haut, panneau « Liste des mutations » (dossier `mutation`) ;
- grille : N° CFC | Désignation | N° de mutation | Adjudicataire | Montant | Document | PDF ; une ligne **par mutation** du centre 1, triée par numéro : CFC et entreprise de l'**origine** d'un transfert, sinon de la destination ; Montant = TTC de ce côté (négatif à l'origine d'un transfert) [D] ;
- en bas, panneau « Mutation » de la mutation sélectionnée (`mutation/<numero>`).

**« Liste des mutations »** (`costControlMutationsList`) [P n° 32] :
- **Champs** : `reportFilter` `''`.
- **`mutationsListTable`** : 0 CFC | 1 Désignation CFC | 2 Entreprise | 3 Ouvrage | 4 Localisation | 5 Numéro | 6 Date | 7 Statut | 8 Remarque | 9 Genre | 10 Transfert | 11 Commentaire | 12 flexibles.
  - Une ligne **par écriture** : deux pour un transfert (origine puis destination), une pour une variation ou un renchérissement ; ordre : numéro, puis origine avant destination.
  - 0-1 CFC du côté et texte du plan comptable (`R.lbl`) ; 2 entreprise du côté (`contactId`, sinon vide) ; 3-4 ouvrage / localisation du côté ; 5 `numero` ; 6 `date` ; 7 `MUT_ST[statut]` ; 8 `remarque` ; 9 `genreTexte` (texte du catalogue) ; 10 CFC **partenaire** (autre côté d'un transfert) ; 11 `commentaire`.
  - Flexibles (présentation `mutations`), montants **signés** du côté (origine −, destination +) : 20-22 si renchérissement, 23-25 si transfert, 26-28 si variation, 29-31 toujours (HT / TVA / TTC) ; 50-61 vides (CH-18).
  - k0 « Afficher le total » (défaut vrai) → ligne `tt` « Total » (sommes des flexibles).
- **`mutationsListTotalTable`** « Totaux » : Désignation | Monnaie | Montant HT | TVA | Montant TTC ; dans l'ordre : renchérissement (si HT ≠ 0), variations (si HT ≠ 0), transferts (**toujours**) ; montants arrondis (`cfg`), « 0.00 » si nuls ; libellés (décision n° 7) : « Renchérissement », « Variations », « Transfert » (original avec les noms par défaut : « Variations », « Renchérissement », « Transfert »).

**« Mutation »** (`costControlMutationSummary`) [P `CostMutationSummaryDocumentReport.getString`] : l'écriture de la fenêtre et son partenaire.

| Champ | Valeur |
|---|---|
| `mutationsNumber`, `mutationsDate`, `mutationsState` « Statut de la mutation », `mutationsKind` « Genre de mutation » | `numero`, `date`, `MUT_ST[statut]`, `genreTexte` |
| `mutationsDescription`, `mutationsRemark` | `commentaire`, `remarque` |
| `bkp` / `bkpNr` / `bkpText`, `subprojectText` | CFC de l'écriture (origine d'un transfert, sinon destination), « OUV \| LOC » |
| `toBkp` / `toBkpNr` / `toBkpText`, `toSubprojectText`, `toEntrepreneur(+Contact, +Responsible)` | côté partenaire (destination d'un transfert) ; vides sinon |
| `mutationsValueExVat`, `mutationsVat`, `mutationsTotal` (+ `toMutations…`) | montants signés de l'écriture et du partenaire (`cfg`) [D] |
| `kvOrig` « Devis original », `kvRev` « DG révisé » (+ `…Partner`) | DG et DG 2 TTC des CFC (`ccCalc`) |

- **Bureau** : modèles d'origine ; 4 feuilles et 2 listes enregistrées. `appUserSignature` : vide (CH-08).

### 5.5 COMPTES D'ENTREPRISE ▸ Documents : « Comptes d'entreprises » (`costControlEntrepreneurSummary`, lot 2)

- **Fenêtre** (`ch01bEntFrame`) : liste « Entreprise » (`C.entreprises` dans l'ordre, doublons de `contactId` retirés, nom court, sinon `ccEntName` ; complétée des entreprises des contrats et paiements absentes de la liste [C]) ; panneau du document de l'entreprise sélectionnée (dossier `entrepreneur/<contactId>`). Contact introuvable : `ctMsg('Erreur','L\'entreprise n\'existe pas.')` [S `msgEntrepreneurNotExisting`] [P n° 34].
- **Champs** : `contact` « Entreprise », `contactContact` « Entreprise contact », `contactResponsible` « Entreprise responsable » (`svPair`) ; `entrepreneurInformation` `''` (non repris, écart E7) ; `staff`, version.
- **`entrepreneurTable`** « Compte d'entreprise » : 0 N° (lot) | 1 Désignation CFC (texte du lot) | 2 CFC | 3 Ouvrage | 4 Localisation | 5 Type (remarque) | 6 Descriptif contrat | 7 Descriptif paiement | 8 Numéro du contrat | 9 Date | 10 Statut du contrat | 11 Genre de paiement | 12 N° pmt | 13 Date pmt | 14 Statut du paiement | 15 Numéro de l'ordre de paiement | 16 N° fact | 17 Date fact. | 18 flexibles (présentation `comptesEntreprise`).
- **Lignes** [P `entrepreneur.Columns.getEntrepreneurLineList@0-4190`] ; pour chaque contrat de l'entreprise (ordre du lot) :
  - **cas A** (avenants liés, ou contrat sans avenant) : (1) ligne **titre** (`ct`) : n° et texte du lot, cumuls du contrat et de ses avenants (82-90, paiements par genre, 161 et 1611-1612) ; (2) ligne du **contrat** : 5 `designation` sinon « Contrat », 6 `description`, 2 CFC des lignes, 8 n°, 9 date, 10 statut, 3-4 ouvrage / localisation communs ; 82-84 et 88-90 = contrat seul ; (3) chaque **avenant** : 5 `designation` sinon « Avenant » ; 85-87 et 88-90 = avenant ; (4) chaque **paiement** du contrat et des avenants liés : 5 `commentaire` sinon genre, 11 genre, 12 n°, 13 date, 14 statut, 15 n° d'ordre, 16-17 facture, 7 `description` ; 120-122 = paiement, 123-128 et 132-134 selon le genre, 129 compte de l'entreprise ;
  - **cas B** (avenants non liés) : titre du lot, ligne du contrat, paiements du contrat, puis pour chaque avenant : sa ligne et ses paiements ;
  - puis, s'il y a des **paiements hors contrat** : une ligne vide ; pour chaque lot rencontré, une ligne **titre** (valeurs = Σ des paiements hors contrat de l'entreprise pour ce lot), puis une ligne par paiement ;
  - enfin la ligne **total** (k0, « Totaux ») : cumuls de toutes les écritures de l'entreprise pour 82-90, 120-128, 132-134, 161, 1611-1612 ; 129 et 136 vides.
  - Lignes de détail (option « détails » de la présentation) : non produites (option non reprise, écart E17) ; F17 sans objet.
- **Bureau** : modèle d'origine (colonnes visibles 0, 1, 5 et la flexible) ; 5 documents enregistrés.

### 5.6 PAIEMENTS ▸ Documents : « Rapport de paiements » (`costControlPaymentList`, lot 4)

- **Fenêtre** (`ch01dPayFrame`) [S `PayementDocumentsFrame|*`] :
  - en haut, panneau « Rapport des paiements » (dossier `payments`) ;
  - grille des paiements du rapport (filtrés et triés comme la section, § 6.7) : N° pmt | CFC | Désignation | Entreprise | Montant | « Bon de paiement PDF » | « Annexe PDF à la facture » (les deux dernières vides) ;
  - zones « Facture d'entrepreneur » et « Autres annexes au paiement » : affichées **grisées** (CH-03).
- **Préparation** : si le filtre est appliqué, message « Attention, vous travaillez en mode filtre. » (§ 5 en tête).
- **Champs** :
  - `amountTotal`, `amountTotalExVat`, `amountVat` : Σ `ch01aTot` des paiements listés (`cfg`) ;
  - `docDate`, `docTitle` : **vides** (non implémentés dans l'original, F5) ;
  - `reportFilter` [P n° 29] : vide si le filtre n'est pas appliqué ; sinon, assemblé ainsi (entre crochets : ce qui diffère dans la variante corrigée de la décision n° 8, **appliquée par défaut**) :
    1. genres, si les trois ne sont pas tous cochés : « Paiements : »[espace] suivi des genres cochés dans l'ordre sur contrat, hors contrat, renchérissement, joints par « | » : « Paiements sur contrat », « payGeneral » [« Paiements hors contrat »], « Renchérissement » ;
    2. statuts, si les quatre ne sont pas tous cochés, sur une nouvelle ligne si le texte n'est pas vide : « Prédéfinir »[espace] suivi, dans l'ordre transmis, débité, libéré, réceptionné, des statuts cochés joints par « | » : « transmis », « payed » [« débité »], « libéré », « réceptionné » ;
    3. n° d'ordre s'il est saisi : « | Numéro de l'ordre de paiement <n> » sur la même ligne ;
    4. ouvrages, si la liste des ouvrages cochés **n'est pas vide** et n'a pas la taille de la liste des ouvrages de l'affaire (filtre restrictif) [P `getString@1689-1695` `isEmpty`, puis comparaison des tailles] : nouvelle ligne, « Ouvrage »[espace] suivi des ouvrages « OUV » ou « OUV LOC » joints par « | » ;
    5. période, si début et fin sont saisis : nouvelle ligne, « Période »[espace] suivi de « jj.mm.aaaa - jj.mm.aaaa ».
- **`costcontrolPaymentSummaryTable`** « Récapitulatif » : Désignation | Monnaie | Total hors TVA | TVA | Total TTC [S `CostPaymentSummaryTable|*`] ; lignes « Paiements sur contrat » (genres sur contrat et final), « Paiements de renchérissement », « Paiements hors contrat », puis « Total paiements » (`tt`) ; montants = Σ `ch01aTot` **par paiement** (valeurs Deltaproject).
- **`costcontrolPaymentListTable`** « Rapport de paiements » [P `PaymentListTable.fillTable`, `payment.Columns.getPaymentList@0-484`] :
  - colonnes de la classe 16.05 : 0 CFC (n° de lot) | 1 Désignation CFC (texte du lot) | 2 Entreprise | 3 Ouvrage | 4 Localisation (communs aux lignes) | 5 N° pmt | 6 Date pmt | 7 N° Ordre (`numeroOrdre`) | 8 Compte bancaire de l'entreprise (`banque.iban`, sinon `banque.compte`) | 9 Compte bancaire du maître d'ouvrage (`banque.compteMO`) | 10 Genre de paiement (**`commentaire`, sinon `genreTexte`**) | 11 N° fact | 12 Date fact. | 13 Paiement descriptif (`description`) | 14 Statut du paiement | 15 flexibles « Paiements » | 16 CFC (n° de CFC de la 1re ligne) ;
  - rendu dans le modèle du bureau (15 colonnes, flexible de type `flexColumn` en 14) : la colonne flexible reçoit les **montants** 120-130, 132-134 (décision n° 9 ; l'original y met le statut, F18) ;
  - une ligne `tr` par paiement ; lignes de détail : non produites (écart E17) ;
  - ligne **« Total »** (libellé fixe [S `PaymentListTable|total`]) : cumuls par genre, chacun somme des TTC et TVA **arrondis paiement par paiement** (`cfg`), HT = TTC − TVA ;
  - si « Récapitulatif de TVA » est coché : une ligne **« Total TVA <taux> % »** par taux (`ch01aJd(taux)`, ex. « Total TVA 8.1 % »), valeurs `ch01dVat` (§ 6.7) ventilées dans les colonnes 120-122 (et 123-128, 132-134 selon le genre).
- **Bureau** : jeu 1 retouché le 05.03.2025 (paysage) ; 13 rapports enregistrés.

### 5.7 ORDRES DE PAIEMENT ▸ Documents : « Ordre de paiement », « Bon de paiement » (lot 4)

**Fenêtre** (`ch01dOrderFrame`) [S `AdviceOfPayementDocumentsFrame|*`] :
- roue dentée ▾ (§ 4.9) ;
- grille des ordres : N° | Date | Maître d'ouvrage | Statut ; en dessous, panneau « Ordre de paiement » de l'ordre sélectionné (`paymentorder/<refId>`) ;
- grille des paiements de l'ordre : N° pmt | Bénéficiaire | Montant | Document | PDF | « Annexe PDF à la facture » ;
- bouton **« Bon de paiement »** ▾, actif si un paiement est sélectionné :
  - « Ouvrir » : crée le bon s'il n'existe pas. Type `costControlGeneralPaymentSummary` si le paiement est hors contrat (`!contratId`), sinon `costControlContractPaymentSummary`. Choix du modèle, puis copie sous le nom `<n° pmt>_<contactId>_payment`, **sans dialogue de nom** [P `openPaymentDoc@180-291`]. Paiement introuvable : `ctMsg('Erreur','Le paiement n\'existe pas.')` ;
  - « Effacer le document » : confirmation `msgDeleteFileDefinitely` ;
  - « Créer un PDF » : grisé (CH-03) ;
- bouton **édition** ▾ : case « Joindre la facture d'entreprise au bon de paiement. » **grisée** (cochée selon `options.addEntrepreneurInvoiceToPayment`) ; « Créer tous les documents » (ordre avec paiements : crée les bons manquants ; choix du modèle **une fois par type** [C, écart E13] ; un commit) ; « Créer un PDF avec tous les bons » grisé ;
- bouton **suppression** ▾ : « Effacer le document » ; « Supprimer tous les documents » : `ivAsk('Avertissement','Voulez-vous effacer tous les documents?')` [S `msgRemoveAllDocuments`] (case « Supprimer les PDF associés. » grisée) ; Oui → `doc = null` pour tous les bons de l'ordre (un commit).

**« Ordre de paiement »** (`costControlPaymentOrder`) [P n° 27, 38] :

| Champ [S] | Valeur (`cfg`) |
|---|---|
| `constructionRemittanceSummary` « Total des paiements » | Σ TTC (`ch01aTot`) des paiements de l'ordre |
| `constructionTotalBeforeRemittance` « Total avant paiement » | Σ TTC des paiements des **ordres antérieurs** du contrôle des coûts (date de valeur antérieure, ou même date de valeur et `numero` inférieur en comparaison de chaînes ; ordres sans date de valeur ignorés) |
| `constructionTotalAfterRemittance` « Total après paiement » | avant + ordre |
| `constructionNumberOfOrders` « Nombre de paiements » | nombre de paiements de l'ordre |
| `amountTotal`, `amountVat`, `amountTotalExcludedVat` | TTC, TVA, HT de l'ordre |
| `constructionDateOfRemittance`, `constructionValutaDate` | `date`, `dateValeur` |
| `constructionNumberOfRemittance`, `constructionRemittanceStatus` | `numero`, `ORD_ST[statut]` |
| `constructionBank…BuildingOwner` | `o.banque`, sinon `C.comptesMO[0]` : nom ; adresse (nom, rue, NPA localité sur plusieurs lignes) ; compte 2 ; compte postal (compte 1) ; contact ; IBAN ; clearing ; SWIFT |

- **`adviceOfPaymentTable`** « Paiements » : 0 N° CFC | 1 Bénéficiaire (nom court ; adresse complète si k1) | 2 N° pmt | 3 Monnaie | 4 flexibles « Montants » (présentation `ordresPaiement`). Lignes, dans cet ordre :
  1. si l'option de soldes est active : « Paiements avant exécution de l'ordre » (122 = total avant paiement, « 0.00 » si nul), puis une ligne vide si k2 ;
  2. une ligne par paiement (ordre des n°), ligne vide intercalée si k2 : 90 = TTC du contrat et des avenants liés (vide si 0) ; 122 = TTC du paiement ; 136 = Σ TTC des paiements antérieurs du même contrat et de ses avenants liés (vide si 0) [D pour 90 et 136 d'un paiement hors contrat : vides] ;
  3. ligne `tt` (k0, au bureau « Total paiements ») : 122 = Σ arrondie ;
  4. si l'option de soldes est active : ligne vide si k2, puis « Paiements après exécution de l'ordre » (122 = avant + total).
  - **Option de soldes** (décision n° 10) : l'original lit « Afficher la désignation CFC » (F14) ; DeltaSub lit `C.presentations.ordresPaiement[favori].options.soldeAvantApres` (option « Afficher les montants avant/après exécution », que CH-07 ajoutera) ; absente → **faux** : lignes non imprimées, comme les ordres du bureau.
  - Sauts de page de tableau (`pageBreaks`) : non reproduits ; vides dans les modèles du bureau (écart E18).
- **Bureau** : jeu 1 retouché le 29.04.2026 ; 39 ordres enregistrés.

**« Bon de paiement sur contrat »** (`costControlContractPaymentSummary`) [P `PaymentSummaryDocumentReport.getString`, `CalcPayment`] :
- **Arrondi des champs texte : `cond`**, et non la Configuration.
- **Paiements à ce jour** : paiements du même contrat et de ses avenants liés placés **avant** ce paiement dans `C.paiements` (ordre de saisie, `refNum`) [D].

| Champ [S] | Valeur |
|---|---|
| `amount`, `amountVat`, `amountTotal` | HT, TVA, TTC du **paiement** |
| `projectPaymentNumber`, `projectInvoiceNumber` | n° de paiement, n° de facture ; « - » si vide |
| `projectPaymentDate`, `projectInvoiceDate` | dates (« - » si la date de paiement est vide) |
| `projectPaymentStatus` | `PAY_ST[statut]` |
| `projectPaymentMethod` « Condition de paiement » | « <code> <genre> » (code de `C.genresPaiement`) ; hors contrat : le genre |
| `projectPreviousPayementSummary` | Σ TTC des paiements à ce jour |
| `constructionTotalAfterRemittance` / `constructionTotalOpenAfterRemittance` | à ce jour + ce paiement / commande − (à ce jour + ce paiement) |
| `constructionOrderSummary` | commande = TTC du contrat + avenants liés datés au plus tard du jour du paiement (avenant non lié : l'avenant seul) |
| `constructionAwardSummary`, `constructionEstimateSummary`, `constructionCostForcast` | adjudication, DG, coût probable (TTC, `ccCalc`) des CFC des lignes du paiement |
| `projectContractNumber`, `projectContractSummary`, `contractDate`, `projectContractAddendumSummary` | contrat : n°, TTC, date ; contrat + avenants |
| `constructionAwardPaymentDifference`, `constructionAwardContractDifference` | adjudication − paiements à ce jour ; adjudication − contrat |
| `constructionLevelOfProficiency` | niveau des prestations du contrat (`ch01aP`) |
| `bkp` / `bkpText` / `bkpNumber` | lot du **paiement** |
| `note`, `constructionCostcontrolDescriptor` | `commentaire`, `description` du paiement |
| `constructionBank…Entrepreneur`, `constructionIVAEntrepreneur` | `x.banque` (nom, adresse, comptes, IBAN, clearing, SWIFT) ; `contactowner.UID` de l'entreprise |
| `constructionBank…BuildingOwner`, `constructionDateOfRemittance`, `constructionNumberOfRemittance` | de l'ordre qui contient le paiement |
| `constructionContractNumber`, `constructionAddendumNumber`, `addendumDate`, `projectContractStatus` | **vides** (F3) |
| `reportFilter` / `reportFilterLong` | ouvrages des lignes (court / avec désignation) |

- **`awardTable`** : 0 N° CFC | 1 Désignation | 2 Ouvrage | 3 N° | 4 Monnaie | 5 Adjudication brute | 6 Adjudication nette | 7 Paiement brut | 8 Paiement net ; une ligne par ligne du paiement (adjudication = lignes correspondantes du contrat et des avenants liés) ; `tt` k0 ; k1 « Totaux détaillés » ; « Arrondi ».
- **`conditionTable`** : `ch01aCondRows` avec brut du paiement (k0, « Total brut HT » au bureau), conditions (« Paiements à ce jour » compris), « Net hors TVA » (k2, « Total net HT ») avant la TVA, total k1 (« Total net TTC »), « Arrondi ».
- **`previousPaymentsTable`** : 0 Désignation (`commentaire`, sinon genre) | 1 N° pmt | 2 N° fact | 3 Date pmt | 4 Date fact. | 5 Monnaie | 6 Montant HT | 7 Taux de TVA | 8 TVA | 9 Total TTC ; total k1 « Total TTC ». Ici, **pas d'inversion** des dates.
- **Bureau** : « Bon de paiement sur contrat » (original) et « Bon de paiement » (`-1`) en jeu 1 ; 23 bons enregistrés.

**« Bon de paiement hors contrat »** (`costControlGeneralPaymentSummary`) : mêmes champs de paiement, de banque et d'ordre, sans contrat ; `constructionEstimateSummary`, `constructionCostForcast`. `positionsTable` : 0 N° CFC | 1 Désignation | 2 Ouvrage | 3 N° | 4 Monnaie | 5 Paiement brut | 6 Paiement net ; total ; « Arrondi ». `conditionTable` : comme le bon sur contrat. 7 bons enregistrés.

### 5.8 ARRÊTÉS DE COMPTE ▸ Documents : « Arrêté de compte », « Liste des garanties » (lot 3)

**Fenêtre** (`ch01cFinalFrame`) [P `FinalpaymentsDocumentsFrame.<init>@148-242`, `initGuaranteeBookTable`] :
- en haut, panneau « Liste des garanties » : dossier `finalpayment` ;
- libellé « Arrêtés de compte » [S `deductionDocument`] et roue dentée ▾ (§ 4.9) ;
- grille des arrêtés : N° CFC (70) | Désignation | Numéro de la garantie (120, n° de l'arrêté) | Adjudicataire | Montant de garantie (100) | Document (80) | PDF (80) ; ordre et adresses de la liste (§ 6.1) ;
- en bas, panneau « Arrêté de compte » de l'arrêté sélectionné : dossier `finalpayment/<refNum>_<contactId>`.

**« Arrêté de compte »** (`costControlGuaranteeSummary`) [P `setReportBookData@1-333`, `askForFinalPaymente`, `getPreviousPaymentList`, `getOtherPayments` ; `GuaranteeSummaryDocumentReport.getString`] :
1. `a = ch01aArr(E, 'finalpayment')`.
2. Σ des lignes de l'arrêté, **chaque valeur arrondie par `ch01aR(v, a.cond)`** : adjudication brute, adjudication nette, décompte brut (`brut`), **décompte net** (`net`).
3. **Question** si le contrat ou ses avenants liés ont un paiement final (`genre === 'surContratFinal'`) : `ivAsk('Arrêté de compte','Voulez-vous inclure le paiement dans l’arrêté de compte ?')` (Oui / Non) [S `indlFinal`]. La réponse vaut pour cette ouverture (écart E12).
4. **Paiements à ce jour** : paiements du contrat et des avenants liés (`avenantIds`, sinon avenants `lieAuContrat !== false`), sans les paiements finaux si la réponse est Non. Somme = Σ `ch01aR(ch01aTot(x).net, a.cond)`.
5. Taux `t` = `vatDefault()` (8.1 au bureau).
6. **Solde à verser** TTC = décompte net − paiements à ce jour ; TVA = solde × t / (100 + t) ; HT = solde − TVA.
7. **Autres paiements** : paiements **hors contrat** de la même entreprise dont une ligne a le même CFC, ouvrage et localisation qu'une ligne de l'arrêté, regroupés par n° de paiement.

| Champ [S] | Valeur (`cfg`) |
|---|---|
| `deductionNumber` « Numéro », `deductionDate` « Date d'arrêté de compte » | `numero`, `date` |
| `constructionCostcontrolDescriptor`, `note` | `description`, `commentaire` |
| `bkp` / `bkpNumber` / `bkpText` | lot du contrat |
| `constructionContractNumber`, `projectContractDate` | contrat |
| `constructionAddendumNumber`, `addendumDate` | avenant (arrêté d'un avenant non lié) |
| `projectContractor` (+ `Contact`, `Responsible`) | entreprise du contrat (règle du § 5.3) |
| `subproject` « Ouvrage » | ouvrage de la 1re ligne (« OUV \| LOC ») |
| `totalToPay` « Solde à verser » | solde TTC |
| `constructionGuarantyKind` / `Value` / `BeginDate` / `EndDate` | `GAR_T[genre]` (vide si « non défini »), `montant`, `debut`, `fin` |

- **`summaryTable`** « Récapitulatif » : 0 Contrat | 1 N° du contrat | 2 Date du contrat | 3 Monnaie | 4 Adjudication brute | 5 Adjudication nette ; ligne du contrat (`designation`, sinon « Contrat »), puis une ligne « Avenant » par avenant lié ; avenant non lié : sa seule ligne ; total k0 « Totaux ».
- **`orderTable`** « Commande » : 0 N° CFC | 1 Désignation | 2 Ouvrage | 3 Localisation | 4 Numéro (réf. cond.) | 5 Monnaie | 6 Adjudication brute | 7 Adjudication nette | 8 Décompte brut | 9 Décompte net ; une ligne par ligne de l'arrêté ; total k0 ; **jamais de ligne « Arrondi »** (F10).
- **`guaranteeConditionTable`** « Conditions » (`ch01aCondRows`) : « Décompte brut », conditions (`c.montant` arrondis par `cond`), « Total HT » avant la TVA, total k1 « Total net TTC » = brut + Σ montants, « Arrondi ».
- **`previousPaymentsTable`** « Paiements à ce jour » [P `PreviousPaymentsTable.fillTable@0-2357`] :
  1. ligne de titre « Paiements à ce jour » ;
  2. une ligne par paiement : 0 Désignation (`commentaire`, sinon genre) | 1 N° fact | 2 **date de paiement** | 3 N° pmt | 4 **date de facture** (F1, décision n° 1) | 5 Monnaie | 6 Total HT | 7 « <taux> % » | 8 TVA | 9 Montant ;
  3. « Total des paiements à ce jour », puis « Arrondi » ;
  4. si k2 « Récapitulatif de TVA à la fin » : « Total des paiements par taux » et une ligne par taux ;
  5. « Solde à verser » : 6 HT | 7 « t % » | 8 TVA | 9 TTC, **« 0.00 » si |solde| ≤ 0.01** (colonne 9 seulement) ; puis « Arrondi » ;
  6. s'il existe des paiements hors contrat : ligne vide, « Autres paiements », leurs lignes, « Total des autres paiements » ;
  7. si k1 : « Montant total des paiements » (paiements à ce jour + autres).
- **Bureau** : jeu 1 retouché le 11.12.2025 (logos SUB, en-têtes « ARRÊTÉ DE COMPTE », « <n° d'affaire>.AC.<n° lot> ») ; 54 documents et 31 PDF.

**« Liste des garanties »** (`costControlGuaranteeList`) [P `GuaranteeListTable.fillTable`, `insertDeduction`] :
- **Tri** et **adresses** de la liste (§ 6.1) ; recette d'adresse sur deux lignes « nom⏎NPA localité » [P recette `#1` « \u0001\n\u0001 \u0001 »].
- **`guaranteeListTable`** : 0 N° CFC | 1 Désignation | 2 Entreprise | 3 Numéro de la garantie (n° de l'arrêté) | 4 Genre de garantie | 5 Début de la garantie | 6 Echéance de la garantie | 7 Montant de garantie (`cfg`, vide si 0) | 8 Statut ; en-tête `ch`.
- **Bureau** : modèle d'origine ; 2 listes enregistrées (CC 3451 et 3601).

---

## 6. Écrans et dialogues

### 6.1 Section ARRÊTÉS DE COMPTE (lot 3, `ch01cDraw`)

- **Grille** (ancre A8) : colonnes actuelles de DeltaSub, conservées (présentations : CH-07) : N° | Entreprise | Date | Statut | Genre de garantie | Montant de garantie | Début de la garantie | Echéance de la garantie | Facture finale nette.
  - Statut et genre « non défini » : vides.
  - `onSel` → `CCV.detSel = {k:'arr', ref: a}` ; double-clic → dialogue « Arrêté de compte » ; `G` rempli pour « Copier » et « CSV ».
  - Colonne « Entreprise » selon « Adresses » : une ligne = `ccEntName` ; deux lignes = nom⏎NPA localité ; complètes = `adrLines` joints par ⏎.
  - Ordre selon « Tri » ; les en-têtes restent triables.
- **Barre de la fenêtre** : « + » propose en tête « Nouvel arrêté de compte … » [S `CostControlDialog|newDeduction` « Nouvel arrêté de compte », points de suspension DeltaSub] puis un séparateur, avant les entrées existantes (ancre A5) ; « Editer l'écriture » et « Supprimer l'écriture » agissent sur l'arrêté sélectionné (A6, A7).
- **Bouton d'outils ▾** en tête de la section, et même menu au clic droit [P `FinalPaymentFrame.initMenuPopup`, `jServiceButtonActionPerformed`] [S `CostControlDialog|*`] :
  - « Adresses » ▸ « Adresses sur une ligne » / « Adresses sur deux lignes » / « Adresses complètes » (coche) ;
  - « Tri » ▸ « par date d'échéance » / « par adjudication » / « par adresse » / « par numéro d'arrêté de compte » (coche) ;
  - — ;
  - « Editer l'arrêté de compte » ; « Supprimer l'arrêté de compte » ; « Comptabiliser le paiement final ».
- « Adresses » et « Tri » sont enregistrés dans `C.presentations.arretes[favori].options` (`touch()`) et servent à la « Liste des garanties » (document et grille de la fenêtre de documents). Tri par date d'échéance : `garantie.fin`, puis n° ; par adjudication : n° de lot ; par adresse : nom de l'entreprise ; par numéro : `numero` (numérique).

### 6.2 « Liste des adjudications » (choix du contrat d'un nouvel arrêté)

[S `ContractListDialog|*`] [P `ContractListDialog.initTable@206-644`, `getSelection@1-305`]
- Titre « Liste des adjudications » ; champ de recherche au-dessus de la grille (`matchQ` sur toutes les colonnes).
- Grille à sélection simple : Adjudication (n° de lot) | Texte (texte du lot) | Numéro | Entreprise (nom court) | Genre.
  - Lignes : chaque contrat **sans arrêté** (Genre « Contrat »), puis chaque avenant **non lié** (`lieAuContrat === false`) sans arrêté (Genre « Avenant », Numéro « <n° contrat> | <n° avenant> »).
- OK actif avec une ligne sélectionnée ; double-clic = OK. `msg1` / `msg2` sans objet (sélection simple). Aucune ligne : grille vide, sans message.
- OK → dialogue « Arrêté de compte » en création (§ 6.3). **Rien n'est écrit avant l'OK de ce second dialogue** (F8).

### 6.3 Dialogue « Arrêté de compte » (`ch01cEdit(C, a|null, touch, choix)`)

[S `DeductionDialog|*`] [P `DeductionDialog.initDialog@32-1151`, `jOkButtonActionPerformed@0-427`, `book@1-438`] ; largeur 1080 px ; `bseq` de `costcontrol` lu à l'ouverture (§ 3.4).

| Zone | Contenu |
|---|---|
| Titre | « Arrêté de compte » ; sous-titre : entreprise |
| En-tête | « Lot d'adjudication » : « n° texte » |
| Récapitulatif | « Adjudication \| Date \| N° \| Brut \| Net » : ligne « Contrat » (ou « Avenant »), une ligne « Avenant » par avenant lié, puis « Total » ; valeurs `ch01aTot` |
| Positions | « CFC \| Texte \| Ouvrage \| Réf. cond. \| Adjudication brute \| Adjudication nette \| Facture finale brute \| Facture finale nette », puis « Total ». « Saisie du brut » : « Facture finale brute » éditable ; « Saisie du net » : « Facture finale nette » éditable (brut par `ccBrutFromNet`). Clic droit : « Déplacer au début » / « Déplacer vers le haut » / « Déplacer vers le bas » / « Déplacer à la fin » / — / « Supprimer la sélection » |
| Mode de saisie | « Saisie du brut » / « Saisie du net » (« Calculer le rabais » non proposé ici) |
| Conditions | « Conditions de l'arrêté de compte » ; « Niveau \| Référence \| Désignation \| Genre \| Réf. cond. \| Conditions \| Montant \| M » (montants par `ccCond`, `condTable` réutilisé). Roue dentée et clic droit : « Ajouter une condition au-dessus » / « Ajouter une condition au-dessous » / — / « Supprimer la condition » (clés `insertCondAfter`/`insertCondBefore` inversées dans Strings.db : libellés affichés tels quels) |
| Crayon ▾ | « Garantie… » (§ 6.4) ; « Annexe… » **grisée** (CH-03) ; libellés « Garantie: <genre> » et « Annexes: n » |
| Édition ▾ | « Modifier le descriptif » (curseur dans « Description ») |
| Champs | « Description » (texte long), « Commentaire », « Numéro » + bouton « Proposition », « Date » (défaut : aujourd'hui), « Statut » (« établi » par défaut, « pour signature », « définitif ») |
| Boutons | Annuler, OK |

- **Arrêté neuf** (§ 1 n° 16) : lignes du contrat et des avenants liés regroupées par (CFC, ouvrage, localisation, réf. cond.), adjudications additionnées ; avenant non lié : ses propres lignes ; facture finale à 0 ; conditions = copie de celles du contrat (ou de l'avenant) ; mode de saisie du contrat ; `avenantIds` = avenants liés ; numéro = proposition.
- **Proposition** : plus grand numéro d'arrêté du contrôle des coûts (partie numérique finale) + 1, préfixe non numérique conservé (« A7 » → « A8 ») ; « 1 » s'il n'y en a aucun [P `generateNextDeductionNumber`, `nextNumber`].
- **Suppressions** (§ 1 n° 15) : position sans confirmation ; « Total » : `ctMsg('Erreur','Cette structure ne peut pas être effacée.')` ; condition : `ivAsk('Avertissement','Voulez-vous vraiment supprimer cette inscription ?')`, puis niveaux renumérotés 1..n (références > niveau supprimé décrémentées [D]).
- **OK, contrôles dans cet ordre** [P `jOkButtonActionPerformed@0-427`] :

| Contrôle | Message exact | Effet |
|---|---|---|
| la dernière condition n'est pas une TVA | « La dernière condition n'est pas le TVA.⏎Voulez-vous enregistrer ce paiement? » (Oui / Non) | Non → dialogue ouvert |
| contrat non prioritaire (`!prioritaireSurDevis`) | « Le contrat est inférieur au devis et n'est pas prioritaire pour le coût probable.⏎L'arrêté de compte verrouillera le contrat. Souhaitez-vous le valider ? » (Oui / Non) ; seule la priorité est testée (F9) | Non → dialogue ouvert |
| numéro déjà utilisé par un autre arrêté du contrôle des coûts | « Le numéro de contrat ^0 est déjà utilisé. » (^0 = numéro) | refus |
| numéro vide | « Vous n'avez pas défini de numéro d'arrêté de compte. » | refus |
| niveau de référence ≥ niveau, ou négatif [D] | « Le niveau de référence de la condition ^0 est incorrect. » | refus |
| niveau de référence absent | « Vous n'avez pas défini de niveau de référence pour la condition ^0. » ; plusieurs : « Au moins un niveau de référence n'est pas défini. » | refus |
| version de `costcontrol` changée depuis l'ouverture | toast de conflit (§ 3.4) | rien d'écrit |

  Les refus passent par `ctMsg('Information', …)` et laissent le dialogue ouvert.
- **Écriture** [P `book@134-438`] : `ccApply(v)` ; `numero`, `date`, `commentaire`, `description`, `lignes`, `conditions`, `statut` et `statutCode` (1 établi, 2 pour signature, 3 définitif), `saisie`, `garantie` ; totaux `net` = brut + Σ montants, `tva` = Σ des conditions TVA, `ht` = `net − tva`, `apresTva` = Σ des conditions de niveau **supérieur** à celui de la TVA ; arrêté neuf : `id`, `refNum` (§ 3.3), `contratId`, `contactId`, `avenantIds`, `annexes: []`, ajout à `C.arretes` ; puis `touch()`.
- **Libellés non utilisés** par ce dialogue dans l'original, donc **non reproduits** : « Nouvelle condition », « Arrondi », « Ajouter la TVA », « Rabais % », « Navigateur », « Taux de TVA », « Dupliquer », « Tout supprimer », « Paiements à ce jour », « Total des paiements à ce jour », « Commande », « Total des paiements par taux ».

### 6.4 « Informations de la garantie »

[S `GarantyInfoDialog|*`] [P `GarantyInfoDialog.<init>`, `DeductionDialog.openGarantie@83-216`]
- Champs : « Type de garantie » (Banque / Assurance / Comptant / Sans garantie), « Montant de la garantie », « Début de la garantie », « Echéance de la garantie » ; menu de l'échéance : « Début de la garantie + 2 années » / « Début de la garantie + 5 années » (+ n années − 1 jour, comme `ccArrete`).
- OK : modifie la garantie de l'arrêté **en cours d'édition** et le libellé « Garantie: <genre> » ; l'écriture se fait à l'OK de l'arrêté.
- `ccArrete` n'est plus appelé une fois le lot 3 intégré ; il reste dans le fichier.

### 6.5 Supprimer l'arrêté de compte

[P `FinalPaymentFrame.removePosition@136-269`] [S `CostControlDialog|msg11a/b`, `msg7`]
- Statut « définitif » : `ctMsg('Avertissement','L\'arrêté de compte a déjà été signé et⏎ne peut donc plus être supprimé.')`.
- Sinon : `ivAsk('Confirmation','Voulez-vous vraiment supprimer cette écriture ?')` ; Oui → retrait de `C.arretes`, `touch()`.
- Le document de l'arrêté (`cocodoc`) n'est pas supprimé (l'original laisse aussi le dossier).

### 6.6 « Comptabiliser le paiement final » (`ch01cBookFinal`)

[P `FinalPaymentFrame.bookFinalPayment@0-1420`, `PayBookDialog.<init>(…,LinkedList,LinkedList,…)@358-494`, `setConditions@57-171`]
1. Aucun arrêté sélectionné : toast « Sélectionnez un arrêté de compte. ».
2. Statut ≠ « définitif » : `ctMsg('Avertissement','L\'arrêté de compte doit avoir le statut Définitif pour⏎comptabiliser le paiement final.')` ; même message pour un avenant non lié (F7 corrigé).
3. **Conditions** : copie de celles de l'arrêté. **Plusieurs taux** de TVA : on retire la dernière condition TVA, **aucune ligne** n'est pré-remplie (étape 4 sautée). On insère « Paiements à ce jour » (kind 20, genre `paiementsAnterieurs`, `valeur` = Σ (net − TVA) des paiements antérieurs du contrat et des avenants liés, comme `syncSI`) **avant la première TVA** ; niveaux renumérotés.
4. **Lignes** : une par ligne d'arrêté (CFC, ouvrage, localisation, réf. cond.), cible nette = net de la ligne d'arrêté − Σ nets des lignes correspondantes de **tous** les paiements du contrat et de ses avenants liés. Ligne de paiement sans correspondance : ajoutée avec la cible −Σ de ses nets (F12 corrigé, décision n° 5). Bruts par `ccBrutFromNet`, répété jusqu'à un écart < 0.005 sur chaque ligne (au plus 10 passages), car « Paiements à ce jour » est réparti au prorata.
5. **Paiement pré-rempli** : le même objet que la branche « nouveau paiement » de `ccPayment`, avec `id: 'p'+Date.now().toString(36)`, `contratId` = contrat de l'arrêté (ou l'avenant non lié), `genre: 'surContratFinal'`, `genreCode: 4`, `genreTexte` et `commentaire` = texte du genre final de `C.genresPaiement` (code « AZ » au bureau), `dernier: true`, `numero: ccNextNum(C.paiements,'numero')`, `numeroFacture: ''`, `dateFacture: today()`, `datePaiement` = aujourd'hui + `parametres.joursPaiementApresFacture` (30 par défaut), `statut: parametres.statutPaiementDefaut || 'transmis'`, `description: ''`, `contactId` et `lot` du contrat, `saisie: 'net'`, `lignes` et `conditions` des étapes 3-4, `banque: {texteCompte: parametres.texteCompte || ''}`, `annexes: []`. `ccPayment` recalcule « Paiements à ce jour » (`syncSI`) et, à l'OK, les nets et TVA par `ccApply` (`edited` vrai pour un nouveau paiement).
6. Ouverture de **`ccPayment(C, null, ctr, null, touch)`** après avoir posé le paiement pré-rempli dans `CH01C_PRE.v` ; `ccPayment` le reprend (ancre A10) et le vide. L'utilisateur vérifie et valide : mêmes contrôles et même écriture qu'un paiement ordinaire. Annuler : rien n'est écrit.
- **Contrôle** : sur d1034 (sans p984), TTC pré-rempli **36'399.67**, TVA 2'727.45 (T-C4).

### 6.7 PAIEMENTS : filtre, tri, récapitulatif de TVA (lot 4, `ch01dPayDraw`)

Tête de la section (ancre A11), au-dessus de la grille actuelle (colonnes inchangées) :
- **Bouton Filtre** (entonnoir) → dialogue **« Filtre »** [S `PayFilterDialog|*`] [P `cc.data.PayFilter`, `PaymentFrame.displayPosition@0-633`, `PayFilterDialog.getInput`] :
  - case « Appliquer le filtre » ;
  - cases « Paiement sur contrat » (genres 1 et 4), « Renchérissement » (2 et 5), « Paiement hors contrat » (3 et 6) : un paiement passe si son groupe est coché ;
  - « Statut » : réceptionné / libéré / transmis / débité ;
  - « Début » et « Fin » : date de paiement dans [début, fin], **bornes incluses** ;
  - grille « M | Ouvrage | Localisation | Texte » (`subproject` de l'affaire) : **seuls les ouvrages cochés** sont enregistrés ; liste vide → pas de filtre d'ouvrage ; sinon un paiement passe si **une de ses lignes** a un ouvrage et une localisation de la liste [P n° 36] (les montants du paiement restent ceux du paiement entier, écart E19) ;
  - « Maître d'ouvrage » ▸ « Compte » : liste à cocher de `C.comptesMO` (IBAN, sinon compte) ; liste vide → pas de filtre ; sinon `banque.compteMO` égal au compte 2, au compte 1 ou à l'IBAN d'un compte coché ;
  - « Ordre de paiement » : n° d'ordre (texte) ; s'il est saisi, seuls les paiements dont `numeroOrdre` est égal passent ;
  - **OK actif seulement si « Début » et « Fin » sont saisis** [P `PayFilterDialog.checkGuards`] ; par défaut, dates du premier et du dernier paiement [C] ;
  - OK → `C.filtrePaiements`, `touch()`.
- **Libellé « Filtré »** [S `CostControlDialog|filterOn`] à côté du bouton quand le filtre est appliqué.
- **Menu « Tri »** ▾ (une coche) [S `CostControlDialog|*Sorter*`] : « par CFC » (n° de lot, puis n° de paiement), « par numéro de paiement », « par ordre de paiement », « par entreprise », « par date de paiement », « par date de facture » ; enregistré dans la présentation `paiements`.
- **Case « Récapitulatif de TVA »** (défaut **faux**, § 1 n° 37) : affiche ou masque la carte existante, recalculée par `ch01dVat(paiements, cfg)` [P `PayFillTable.updateVatList`] :
  - pour chaque **ligne** de chaque paiement listé, la condition TVA appliquée de la ligne (`kind 6`, même réf. cond. ou réf. vide) donne le taux ; **ligne sans TVA : ignorée** ;
  - HT += `ch01aR(l.net, cfg)` − `l.tva` ; TVA += `l.tva` ; TTC += `ch01aR(l.net, cfg)` ;
  - écran : une ligne « Part TVA <taux> » par taux (`ch01aJd`), colonnes HT | TVA | TTC, puis « Total » ; document : « Total TVA <taux> % » (§ 5.6).
- La grille, la fenêtre de documents et le document utilisent le même filtre et le même tri (`ch01dList(C)`).

### 6.8 Messages et libellés exacts (récapitulatif)

| Clé [S] | Texte | Emploi |
|---|---|---|
| `Strings\|msgDeleteFileDefinitely` | Voulez-vous supprimer ce fichier définitivement ? | supprimer un document (titre « Avertissement ») |
| `Strings\|legacyMenu` | [Ancien document] | suffixe de l'ancien circuit |
| `…DocumentsFrame\|msg4` | Attention, vous travaillez en mode filtre. | document préparé avec un filtre appliqué (titre « Information ») |
| `FinalpaymentsDocumentsFrame\|indlFinal` | Voulez-vous inclure le paiement dans l’arrêté de compte ? | document Arrêté (titre « Arrêté de compte ») |
| `AdviceOfPayementDocumentsFrame\|msgPaymentNotExisting` | Le paiement n'existe pas. | bon (titre « Erreur ») |
| `…\|msgRemoveAllDocuments` | Voulez-vous effacer tous les documents? | supprimer tous les bons |
| `EntrepreneurDocumentsFrame\|msgEntrepreneurNotExisting` | L'entreprise n'existe pas. | compte d'entreprise (titre « Erreur ») |
| `ContractListDialog\|dialogTitle` | Liste des adjudications | nouvel arrêté |
| `DeductionDialog\|msg17a/b` | La dernière condition n'est pas le TVA.⏎Voulez-vous enregistrer ce paiement? | OK de l'arrêté |
| `DeductionDialog\|msg15a/b` | Le contrat est inférieur au devis et n'est pas prioritaire pour le coût probable.⏎L'arrêté de compte verrouillera le contrat. Souhaitez-vous le valider ? | OK de l'arrêté |
| `DeductionDialog\|msg6` | Le numéro de contrat ^0 est déjà utilisé. | numéro d'arrêté déjà pris |
| `DeductionDialog\|msg9` | Vous n'avez pas défini de numéro d'arrêté de compte. | numéro vide |
| `DeductionDialog\|msg3` / `msg4` / `msg5` | Le niveau de référence de la condition ^0 est incorrect. / Vous n'avez pas défini de niveau de référence pour la condition ^0. / Au moins un niveau de référence n'est pas défini. | conditions |
| `DeductionDialog\|msg1` / `msg14` / `msg13` | Cette structure ne peut pas être effacée. / Cette inscription ne peut pas être effacée. / Voulez-vous vraiment supprimer cette inscription ? | suppressions dans le dialogue |
| `CostControlDialog\|msg11a/b` | L'arrêté de compte a déjà été signé et⏎ne peut donc plus être supprimé. | supprimer un arrêté définitif |
| `CostControlDialog\|msg14a/b` | L'arrêté de compte doit avoir le statut Définitif pour⏎comptabiliser le paiement final. | paiement final |
| `CostControlDialog\|msg7` | Voulez-vous vraiment supprimer cette écriture ? | supprimer un arrêté |
| `PaymentListTable\|total` · `CostPaymentSummaryTable\|*` | Total · Paiements sur contrat, Paiements de renchérissement, Paiements hors contrat, Total paiements | rapport de paiements |
| `PaymentListDocumentReport\|payTypes`, `payState`, `subprojects`, `timePeriod`, `adviceOfOrderNumber` | Paiements : · Prédéfinir · Ouvrage · Période · Numéro de l'ordre de paiement | texte du filtre |

---

## 7. Valeurs de contrôle

Données : base de test (copie `ch/CH-01/r2/ds_now.sqlite`, identique au bureau pour les collections du chantier). PDF du bureau : `rech_exist` § 3.6 (`ctl_arretes.jsonl`, `pdf_amounts.py`). Recalculs de cette version : `ch/CH-01/w2/crit_vals.py`, `crit_vat.py`, `crit_mut.py`.

Chaque lot fournit un test jsc :
- il charge `num`, `rJ`, `cmp`, `cfcCmp`, `cfcLevel`, `COND`, `condNat`, `ccCond`, `ccApply`, `ccBrutFromNet`, `docNet`, `docTva`, `ccCalc` et ses constantes, `CC_COL`, **extraits du `DeltaSub.html` construit par le `build.py`** (jamais recopiés à la main) ; les lots 2 à 4 chargent aussi `lot1.js` (ou le code `ch01a` intégré) ;
- puis le fichier du lot et une fixture JSON extraite de la base (identifiants et montants seulement).

Chaque lot contrôle la syntaxe du script complet : `jsc -e "new Function(readFile('script.js'))"` sur `DeltaSub.html` du moment + le lot. Aucune erreur, aucune redéclaration.

### 7.1 Tests jsc

**Lot 1 (`ch01a`, 83 contrôles écrits : `lot1_test.js`)** : T-A1 à T-A16 (arrondis, formats, choix du modèle, préparation, colonnes flexibles, pages de garde CC 901 / 753 / 3601, conditions c1 et d57, ligne « Arrondi », `ch01aTot`, Devis général, Contrôle des coûts, subdivisions CC 4853, formats %). Rappel des valeurs principales :

| # | Cas | Attendu |
|---|---|---|
| T-A1 | `ch01aR` | (−0.125, faux) → −0.13 ; (−0.025, vrai) → −0.05 ; (1234.567, vrai) → 1234.55 ; (−941.88, vrai) → −941.90 ; (−3729.81, vrai) → −3729.80 ; (7247.07, vrai) → 7247.05 ; (96717.03, vrai) → 96717.05 ; (−0.001, faux) → 0 |
| T-A3 | `ch01aTplList` | affaire sans groupe, Contrat → jeu « 1 », [615, 1251] ; Bon sur contrat → [611, 1301] ; Arrêté → [639] ; affaire « SUBSTANCES » → jeu « 2 », 1 modèle ; groupe inexistant → `null` ; `p` nul → jeu « 0 » |
| T-A6 | page de garde CC **901** | 4 lignes : DG 439'246.45 / 33'821.98 / 473'068.45 ; DG 2 439'246.45 / **33'822.00** / 473'068.45 ; Contrats et avenants 415'484.76 / 32'057.58 / 447'542.34 ; Paiements 428'501.73 / 32'630.81 / 461'132.54 (PDF du bureau) |
| T-A7 | idem CC **753** | écarts de 1 à 3 ct avec le PDF (écart E11) |
| T-A8 | conditions du contrat c1, CC **3501** | « Contrat brut » 452'578.90 ; Rabais −9'051.58 ; Escompte −8'870.55 ; Prorata (%) −6'519.85 ; « Total HT » 428'136.92 ; TVA « 8.10 % » 34'679.09 ; total **462'816.01** (PDF) |
| T-A9 | d57, CC 2101, `cond` | Rabais −941.90 ; Escompte −3'729.80 ; Autres (−) −45.75 ; « Total HT » 89'469.95 ; TVA 7'247.05 ; total 96'717.00 ; aucune ligne « Arrondi » |
| T-A12 | CC **3601**, TTC | DG 6'000'000.00 ; Contrats et avenants 4'866'499.35 ; Paiements 5'336'718.45 ; Coût probable 6'013'769.93 ; Etat du coût 13'769.93 |

**Ajouté par cette version (lot 1)** :

| # | Cas | Attendu |
|---|---|---|
| T-A17 | page de garde CC **3501** (favorite [0, 1, 2, 13, 25, 28, 42, 90, 178, 122, 172, 181]) | ligne « Variations » **56'131.48 / 4'546.65 / 60'678.13** juste après « Devis général » (décision n° 7 par défaut) ; aucune ligne « Transfert » (TTC nul) |

**Lot 2 (`ch01b`)**

| # | Cas | Attendu |
|---|---|---|
| T-B1 | Contrat c1 de CC 3501 | `amountTotal` « 462'816.01 », `amount` « 428'136.92 », `amountVat` « 34'679.09 », `contractSum` « 462'816.01 », `previousAddendumSum` « », `constructionContractNumber` « 1 », `projectContractStatus` « Définitif » |
| T-B2 | `awardListTable` du même contrat | 5 lignes (201.1, 211.0, 211.4, 211.5, 211.6) ; « Totaux » : brut 452'578.90, net 462'816.01 |
| T-B3 | Avenant a594 de CC 3601 (contrat c85, n° 23) | `amountTotal` « 77'189.77 » ; `contractSum` « 68'500.00 » ; `previousAddendumSum` « 0.00 » ; `contractAndAddendumSum` « 145'689.77 » ; `contractAndAddendum` : 2 lignes et le total |
| T-B4 | Liste contrats et avenants, CC **3601** (39 contrats, 6 avenants) | récapitulatif : « Montant des contrats » **4'404'850.82 / 353'410.52 / 4'758'261.34** ; « Montant des avenants » **100'145.62 / 8'092.39 / 108'238.01** ; « Total des adjudications » **4'504'996.44 / 361'502.91 / 4'866'499.35** ; flexibles de la favorite : 84, 87, 90 (91 et 92 écartés) ; ligne de c85 : 84 « 68'500.00 », 90 « 145'689.77 » ; ligne de a594 : colonne 5 « 23 \| 1 », 87 « 77'189.77 », 84 et 90 vides ; total : 90 « 4'866'499.35 » |
| T-B5 | Mutations CC **3501** (81 mutations, dont 76 transferts) | liste : **157** lignes (2 par transfert) ; colonne 25 : Σ = 0 ; totaux : « Variations » **56'131.48 / 4'546.65 / 60'678.13**, « Transfert » « 0.00 / 0.00 / 0.00 », aucune ligne de renchérissement. CC 901 : 24 lignes, une seule ligne de totaux « Transfert » à « 0.00 » |
| T-B6 | Compte d'entreprise 10508, CC 3601 (contrat c85 + avenant lié a594, 4 paiements p440, p462, p595, p834) | cas A : lignes titre, contrat, avenant, 4 paiements ; total : 84 « 68'500.00 », 87 « 77'189.77 », 90 « 145'689.77 », 122 « 151'700.00 », 161 « -6'010.23 » |
| T-B7 | Fenêtre ADJUDICATIONS ▸ Documents, CC 3601 | ligne de a594 : N° « 1 », Type « Avenant », Adjudicataire = entreprise de c85, Montant « 77'189.77 » ; dossier `award/addendumSheet_10508_23_1` |
| T-B8 | Fenêtre MUTATIONS ▸ Documents, CC 3501 | 81 lignes ; transfert : CFC de l'origine ; feuille : `bkp` origine, `toBkp` destination |
| T-B9 | Contrat issu de la Soumission (créé sur une copie de base par `svbCostContract`) | Contrat et Liste impriment `totauxDelta` (valeurs figées), aucun champ propre à la Soumission |

**Lot 3 (`ch01c`)**

| # | Cas | Attendu (PDF du bureau, au centime) |
|---|---|---|
| T-C1 | Solde **d1034** (CC 3601), réponse Non | décompte net 355'851.23 ; paiements à ce jour 295'514.86 / 23'936.70 / **319'451.56** ; solde **33'672.22**, « 8.1 % », **2'727.45**, **36'399.67** ; `totalToPay` « 36'399.67 » ; garantie « 35'500.00 » |
| T-C2 | **d884** (CC 3601), réponse Oui | décompte net (lignes) 1'192'000.00 ; total des conditions 1'192'000.01 ; paiements 1'192'000.02 ; solde TTC **−0.02** |
| T-C3 | **d57** (CC 2101), `cond` et `tot` vrais, Oui | conditions 96'717.00 ; paiements 27'025.00 + 34'592.00 + 35'100.00 = 96'717.00 ; solde **0.05** |
| T-C4 | Pré-remplissage du paiement final de **d1034**, sans p984 | lignes 271 : **28'736.14**, 285 : **7'663.53** (TTC 36'399.67) ; conditions [22, 1, 3, 10, **20**, 6], « Paiements à ce jour » **295'514.86** ; bruts vers 310'270.50 et 40'729.00 ; TVA 2'727.45 ± 0.01 (= p984) |
| T-C5 | d1038 (sans p985), d881 (sans p838), d930 (sans p933), d931, d941, d970, d980 | TTC pré-remplis 30'811.52, 17'364.30, 29'000.00 ; « Solde à verser » HT : 28'502.79, 16'063.18, 26'827.01, 44'403.33, 31'428.31, 4'143.48, 11'378.35 |
| T-C6 | **d879** (CC 3601), Oui | 151'700.00 − 151'700.00 = 0 → colonne TTC « 0.00 », HT et TVA vides |
| T-C7 | **d201** (CC 1201) | 1 ligne CFC 214.7 : adjudication 9'625.00 / 9'480.63, décompte 6'159.39 / 6'067.00 ; Prorata (%) −92.39 ; aucune TVA ; genre de garantie vide |
| T-C8 | Proposition de numéro | CC 3601 (1 à 24) → « 25 » ; [« A7 », « 3 »] → « A8 » ; vide → « 1 » |
| T-C9 | Liste des garanties CC 3601 | 22 lignes ; Σ 344'001.00 ; tri par échéance : première échéance 12.09.2025 (arrêté n° 1) |
| T-C10 | Contrôles de l'OK | numéro « 23 » d'un autre arrêté → `msg6` avec « 23 » ; vide → `msg9` ; condition de niveau 2 avec référence 2 → `msg3` avec « 2 » |
| T-C11 | « Liste des adjudications » | CC 3601 : seuls les contrats sans arrêté ; un avenant non lié (fixture modifiée) → Numéro « <n° contrat> \| <n° avenant> », Genre « Avenant » |

**Lot 4 (`ch01d`)**

| # | Cas | Attendu (PDF du bureau) |
|---|---|---|
| T-D1 | Récapitulatif du rapport, CC **753** (26 paiements) | sur contrat 405'998.16 / 31'261.88 / 437'260.04 ; hors contrat 14'784.41 / 1'138.39 / 15'922.80 ; « Total paiements » **420'782.57 / 32'400.27 / 453'182.84** |
| T-D2 | idem **901** et **1802** | 901 : total 428'501.72 / 32'630.82 / 461'132.54 ; 1802 : total 390'503.15 / 31'387.03 / 421'890.18 |
| T-D3 | `ch01dVat` | 753 : une ligne 7.7 : **420'782.55 / 32'400.29 / 453'182.84** (ligne à ligne : diffère du récapitulatif par paiement, comme l'original) ; 901 : 7.7 : **423'776.73 / 32'630.81 / 456'407.54** (4'725.00 de lignes sans TVA exclus) ; 1802 : 8.1 : **387'493.16 / 31'387.02 / 418'880.18** (3'010.00 exclus) ; écran « Part TVA 7.7 », document « Total TVA 7.7 % » |
| T-D4 | `ch01dFilter` | bornes incluses ; 901, « Paiement hors contrat » seul → les 10 paiements hors contrat ; ouvrage coché → seuls les paiements dont une ligne porte cet ouvrage ; aucun ouvrage coché → pas de filtre d'ouvrage ; filtre non appliqué → 23 paiements |
| T-D5 | Tris | « par date de facture » : `dateFacture` croissante, puis n° ; « par CFC » : n° de lot (`cfcCmp`), puis n° |
| T-D6 | Ordre **o37** (CC 4853, n° 1) | « Total des paiements » **48'381.31** ; « Total avant paiement » « 0.00 » ; « Nombre de paiements » 11 ; tableau : 11 lignes puis « Total paiements », **aucune** ligne avant / après |
| T-D7 | o42, o45, o55 (CC 4853) | « Total avant paiement » 48'381.31 ; 137'340.66 ; 139'392.66 ; « Total après » = avant + 88'959.35 ; + 2'052.00 ; + 4'482.00 |
| T-D8 | Bon **p341** (CC 1401) | brut 18'494.98 ; Rabais « -2.50 % » −462.37 ; Prorata (%) « -1.50 % » −270.49 ; Paiements à ce jour 0.00 ; « Total net HT » 17'762.12 ; TVA « 7.70 % » 1'367.68 ; « Total net TTC » **19'129.80** |
| T-D9 | Texte du filtre | « Paiement hors contrat » seul, statuts tous, 01.01.2025-31.12.2025 → défaut (décision n° 8) « Paiements : Paiements hors contrat⏎Période 01.01.2025 - 31.12.2025 » ; variante fidèle « Paiements :payGeneral⏎Période01.01.2025 - 31.12.2025 » |
| T-D10 | Tableau du rapport, modèle jeu 1 | colonne flexible = montants 120 / 121 / 122 ; le statut (cellule 14) n'apparaît pas (décision n° 9) |

### 7.2 Essai navigateur (copie isolée, un port par lot)

Copie de `serveur_deltasub.py` (celle du lot 1 à partir du lot 1), `DeltaSub.html` construit par `build.py`, base copiée par `.backup`. Onglet propre, `localStorage.ds_user = '2752'`. Les impressions se vérifient **dans l'`iframe` de la visionneuse** (`contentDocument`), sans fenêtre.

| # | Lot | Scénario | Attendu |
|---|---|---|---|
| N1 | 1 | Contrôle des coûts 3601 ▸ colonne de gauche | « Documents » sous chacune des 8 sections ; section → grille ; « Documents » → fenêtre ; lots non intégrés : message de lot |
| N2 | 1 | CONTRÔLE DU COÛT ▸ Documents ▸ « «Contrôle des coûts» » | « Nom du document » prérempli ; OK → **aucun** « Choisir le modèle » ; visionneuse : 3 sections paysage, « DECOMPTE FINAL », « <n°>.DC.FF », logos SUB |
| N3 | 1 | même document, page de garde | lignes dans l'ordre des colonnes de la favorite, TTC non nul ; valeurs de T-A12 ; `cocodoc` `3601/overview` créé |
| N4 | 1 | « Modifier les textes… » : en-tête « DECOMPTE FINAL » → « DECOMPTE FINAL V2 » ; OK ; rouvrir | l'en-tête modifié apparaît ; `modeledocument` inchangé |
| N5 | 1 | Renommer en « CC/test » | « / » refusé avec « Caractère incorrect: / » ; « CCtest » |
| N6 | 1 | Supprimer le document | message exact ; Oui → « «Contrôle des coûts» » ; l'enregistrement reste avec `doc: null` |
| N7 | 1 | DEVIS GENERAL ▸ Documents de 901 | total TTC 473'068.45 |
| N8 | 1 | Affaire 913 (« SUBSTANCES ») ▸ Contrôle des coûts ▸ Documents | modèle du jeu 2 |
| N9 | 1 | Menus ▾ | « Enregistrer sous forme de fichier PDF… » et menu des PDF grisés |
| N10 | 1 | Conflit : « Modifier les textes… » ouvert ; même enregistrement modifié par `fetch('/api/commit')` ; OK | conflit signalé, rien d'écrit |
| N11 | 2 | ADJUDICATIONS ▸ Documents de 3501 ; contrat c1 | « Choisir le modèle » : « Contrat » (sélectionné), « Contrat_Entreprise » ; choisir le second ; montants de T-B1 |
| N12 | 2 | Roue dentée ▸ « Arrondir les conditions » ; rouvrir | montants à 5 ct ; `cocodoc` `3501/award` : `options.roundContractSummary = true` |
| N13 | 2 | ADJUDICATIONS ▸ Documents de 3601 ▸ « Contrats et avenants » | valeurs de T-B4 ; ligne de a594 dans la grille : N° « 1 » |
| N14 | 2 | MUTATIONS ▸ Documents de 3501 ; COMPTES D'ENTREPRISE ▸ Documents de 3601 (10508) | liste et totaux de T-B5 ; compte de T-B6 ; entreprise absente simulée → « L'entreprise n'existe pas. » (« Erreur ») |
| N15 | 3 | ARRÊTÉS DE COMPTE de 3601 ▸ « + » ▸ « Nouvel arrêté de compte … » | « Liste des adjudications » ; OK → dialogue, numéro « 25 » ; Annuler → **aucun** arrêté |
| N16 | 3 | Nouvel arrêté : saisie du net, OK | contrôles du § 6.3 ; arrêté ajouté (`id` « d<refNum> ») |
| N17 | 3 | d1034 ▸ « Comptabiliser le paiement final » (établi) | `msg14a/b` ; passer à « définitif » (copie sans p984) → fenêtre de paiement conforme à T-C4 ; Annuler → rien d'écrit |
| N18 | 3 | Supprimer un arrêté définitif ; un établi | `msg11a/b` ; « Voulez-vous vraiment supprimer cette écriture ? » |
| N19 | 3 | ARRÊTÉS ▸ Documents ▸ d1034 | question « Voulez-vous inclure le paiement… » ; Non → T-C1 ; dates du tableau selon la décision n° 1 |
| N20 | 3 | Tri « par adresse » ; Adresses « complètes » | ordre et colonne « Entreprise » modifiés dans la grille et la Liste des garanties |
| N21 | 4 | PAIEMENTS de 753 : Filtre (OK grisé tant qu'une date manque) ; « Paiement hors contrat » seul | « Filtré » ; grille réduite ; document : message « Attention, vous travaillez en mode filtre. » puis `reportFilter` de T-D9 |
| N22 | 4 | Tri « par date de facture » ; « Récapitulatif de TVA » (décochée au départ) cochée puis décochée | ordre de la grille et du document ; carte affichée puis masquée, sans part 0 % ; lignes « Total TVA 7.7 % » dans le document |
| N23 | 4 | ORDRES DE PAIEMENT de 4853 ▸ Documents ▸ o37 ; « Bon de paiement » ▸ Ouvrir sur un paiement sur contrat | ordre : T-D6 ; bon : choix entre deux modèles, document « <n°>_<contactId>_payment » sans dialogue de nom |
| N24 | 4 | « Créer tous les documents » ; « Supprimer tous les documents » ; menu « Documents » de la section d'édition | un choix de modèle par type, bons créés en un commit, puis effacés ; « Ordre de paiement [Ancien document] », « Bon de paiement [Ancien document] » |

---

## 8. Défauts de l'original et écarts assumés

### 8.1 Défauts de l'original (traitement)

| # | Défaut [P] | Traitement |
|---|---|---|
| F1 | « Paiements à ce jour » de l'arrêté : date de paiement sous « Date fact. », date de facture sous « Date pmt » | **Reproduit** par défaut (31 PDF du bureau) ; décision n° 1 |
| F2 | Avenant : `note` imprime la remarque du **contrat** | reproduit (aucun modèle du bureau ne l'utilise) |
| F3 | Bon sur contrat : 4 champs vides | reproduit |
| F4 | `reportFilter` : « OUV \| LOC », ouvrages joints par « \| » | reproduit |
| F5 | Rapport de paiements : `docDate` et `docTitle` vides ; « Prédéfinir » | reproduits |
| F6 | Solde de l'arrêté au taux par défaut du système, même si le contrat a un autre taux | reproduit (T-C1 à T-C3) |
| F7 | Paiement final d'un avenant non lié : `msg11` au lieu de `msg14` | **corrigé** |
| F8 | Nouvel arrêté créé dès le choix ; annuler laisse un arrêté « non défini » | **corrigé** par défaut ; décision n° 2 |
| F9 | « Contrat inférieur au devis » : seule la priorité est testée | reproduit |
| F10 | `OrderTable` a le libellé « Arrondi » sans jamais produire la ligne | reproduit |
| F11 | Cellules de page avec `cellId` en double | sans effet (`svDpPageCss`) |
| F12 | Paiement final : ligne de paiement sans correspondance ajoutée avec un net **positif** | **corrigé** ; décision n° 5 |
| F13 | Colonne flexible admise non remplie : aucune cellule, valeurs suivantes décalées | **corrigé** (cellule vide) ; sans effet sur les présentations du bureau |
| F14 | Ordre : lignes « avant / après » liées à « Afficher la désignation CFC » | décision n° 10 ; aujourd'hui sans effet (aucune des deux options dans DeltaSub) |
| F15 | Noms de centres par défaut croisés (page de garde du Contrôle des coûts, totaux de la Liste des mutations) | **corrigé** par défaut ; décision n° 7 |
| F16 | Texte du filtre du rapport de paiements : clés brutes « payGeneral », « payed », libellés collés | **corrigé** par défaut ; décision n° 8 |
| F17 | Compte d'entreprise : lignes de détail d'un contrat écrivent 88-90 dans 82-83 | sans objet (lignes de détail non produites) |
| F18 | Rapport de paiements avec le modèle du bureau : statut dans la 1re colonne de montant, aucun montant | **corrigé** par défaut ; décision n° 9 |

### 8.2 Écarts assumés

| # | Écart | Raison |
|---|---|---|
| E1 | Visionneuse = aperçu HTML et impression du navigateur ; seuls textes fixes et en-têtes modifiables | éditeur complet : CH-14 |
| E2 | PDF, partage, import, fusion, annexes : entrées grisées | CH-03 (D4) |
| E3 | Pas de préférence « Toutes les langues » | DeltaSub est en français |
| E4 | Aucun modèle dans le jeu : repli ancien modèle / HTML au lieu d'un dialogue vide | un dialogue vide n'offre que « Annuler » |
| E5 | Pas de lecture seule ni de contrôle de droit | CH-08 |
| E6 | « Documents » : ligne indentée sous chaque section ; barre d'édition visible en mode Documents | insertion minimale dans `ccEditor` |
| E7 | Noms de centres (libellés du § 5.2) ; `Entrepreneur.information` vide | `costnamesFr.json` et indications non repris par le convertisseur (CH-07) |
| E8 | Valeurs flexibles CH-18 (Mutations 2, plafonné, métré, équations, centres libres) vides | CH-18 |
| E9 | Non rendus : fond alterné, titres multilignes, couleurs, largeur proportionnelle des flexibles | `svDpTable` et `svDpCols` ne sont pas modifiés |
| E10 | Totaux : `totauxDelta` si l'écart avec Σ des lignes ≤ 0.05, sinon Σ des lignes | document modifié dans DeltaSub |
| E11 | Page de garde : nets de ligne arrondis par le convertisseur (±3 ct sur CC 753) | pleine précision non reprise |
| E12 | Question « Voulez-vous inclure le paiement… » à chaque ouverture | fidélité |
| E13 | « Créer tous les documents » : choix du modèle une fois par type | éviter un dialogue par bon |
| E14 | Taille et position du dialogue d'arrêté non mémorisées | convention DeltaSub |
| E15 | Conflit sur `costcontrol` détecté à l'OK par la version en cache | `ccEditor.save` n'envoie pas de `bseq` |
| E16 | Colonnes non affichées du compte d'entreprise remplies selon l'écran | modèle du bureau : 4 colonnes affichées |
| E17 | Lignes de détail (rapport de paiements, compte d'entreprise) non produites | options de présentation non reprises (CH-07) |
| E18 | Sauts de page de tableau (`pageBreaks`) non reproduits | vides dans les modèles du bureau |
| E19 | Filtre d'ouvrage : montants du paiement entier ; les lignes des autres ouvrages ne sont pas retirées du document | [D] ; totaux du récapitulatif inchangés |
| E20 | Taux du solde : `vatDefault()` (8.1 si le réglage manque ; l'original prendrait 0) | réglage présent au bureau |

---

## 9. Écarts hors chantier signalés (non traités)

1. **`CC_COL.kvValue`** (écran) : titre « DG » et valeur TTC ; l'identifiant 11 est le DG **HT**. CH-07. Le document imprime le HT.
2. **Récapitulatif de TVA de l'écran PAIEMENTS** : corrigé par le lot 4 (parts 0 % supprimées, arrondi par ligne, case à cocher).
3. **`ccContract`** n'inscrit pas l'entreprise dans les intervenants (rôle 19). CH-05 ou CH-07.
4. **Convertisseur** : ne reprend ni les options d'arrondi (3 fichiers), ni `addEntrepreneurInvoiceToPayment` (7), ni `costnamesFr.json` (22), ni `Entrepreneur.information`, ni `PayFilter` / `PayPref` / `GarantiePref` / `AdviceOfPaymentPref` / `AwardingPref` / `MutPref`, ni les `.dpdoc` enregistrés (décision n° 4).
5. **`ccEditor.save`** sans relecture de version : le dernier écrit gagne. CH-07.
6. **TVA 8.1 codée en dur** dans le contrôle des coûts (l. 3001, 3007, 3030, 3051, 3076, 3115, 3116, 3168) : CH-01 n'utilise que `vatDefault()` ; le reste va à CH-07 ou CH-08.
7. **Styles de lignes tronqués** à l'extraction (`ROWSTYLES` coupé à 4 000 caractères) : les lignes `catalogLevel1` s'impriment noir sur noir ; correction côté données (ré-extraction de `ROWSTYLESET` et `TEXTSTYLESET`), à signaler à l'intégrateur.

---

## 10. Points d'ancrage DeltaSub

### 10.1 Remplacements dans `DeltaSub.html` et le serveur

Unicité vérifiée par `grep -F -c` = 1 sur `DeltaSub.html` au commit `9c9a3f9` (md5 `b5db7920…`) et sur `serveur_deltasub.py` (md5 `20c0933d…`).
- Le `build.py` de chaque lot prend le chemin du `DeltaSub.html` source en argument (défaut : celui du dépôt), et pour le lot 1 celui du serveur (`--serveur`).
- Il vérifie chaque ancre (compte = 1) et **échoue proprement** si une ancre manque ou est multiple, ou si le lot est déjà intégré : message, code de sortie 1, aucun fichier écrit.
- **Tous les « nouveaux » contiennent l'« ancien » intact** (insertion pure), sauf A12 et A13 (libellés).

| # | Lot | Ancre exacte (« ancien ») | « Nouveau » | Lieu indicatif |
|---|---|---|---|---|
| A0 | 1-4 | ligne `   DÉMARRAGE` | code du lot, inséré **avant** la ligne `/* ═══…` qui ouvre ce commentaire (dernier `\n/*` avant l'ancre) ; plusieurs lots ou chantiers au même endroit : ordre indifférent | l. 14 503 |
| A1 | 1 | `CCV.sec=s; CCV.detSel=null;` | `CCV.docs=false; CCV.sec=s; CCV.detSel=null;` | `ccEditor`, clic sur une section (l. 2907) |
| A2 | 1 | `draw(); }; side.append(it);` | l'ancien + ` side.append(ch01aDocNode(s,side,()=>draw()));` | `ccEditor`, colonne de gauche (l. 2907) |
| A3 | 1 | `const draw=()=>{ pane.innerHTML=''; for(const k in G) delete G[k]; const R=ccCalc(C), sec=CCV.sec;` | l'ancien + ` if(CCV.docs){ ch01aDocsDraw(pane,{C,p,doc,id,sec,touch}); return; }` | début de `draw` (l. 2924) |
| A4 | 1 | `if(hit(ts,'costcontrol')&&this.editorRefresh) this.editorRefresh();` | l'ancien + ` else if(hit(ts,'cocodoc')&&this.editorRefresh) this.editorRefresh();` | `VIEWS['coco'].refresh` (l. 2875) |
| S1 | 1 | `serveur_deltasub.py` : `PROTECTED_IF_EDITED \|= {"statisticalvalue", "constructionpart", "constructioncomponent", "ebkpelement", "ebkptobkp"}` | l'ancienne ligne, puis `PROTECTED_IF_EDITED \|= {"cocodoc"}   # CH-01 …` | l. 61 ; copie modifiée complète et diff |
| A5 | 3 | `const addMenu=()=>{ const s=cur(), ctr=ctrOf(s); return [` | l'ancien + `...ch01cAddItems(C,touch),` (rend `[{t:'Nouvel arrêté de compte …',fn}, '-']` dans ARRÊTÉS DE COMPTE hors mode Documents, sinon `[]`) | `ccEditor` (l. 2910) |
| A6 | 3 | `const editDet=()=>{ const d=CCV.detSel;` | l'ancien + ` if(d&&d.k==='arr'){ ch01cEdit(C,d.ref,touch); return; }` | `ccEditor` (l. 2982) |
| A7 | 3 | `const delDet=async()=>{ const d=CCV.detSel;` | l'ancien + ` if(d&&d.k==='arr'){ await ch01cDelete(C,d.ref,touch); return; }` | `ccEditor` (l. 2985) |
| A8 | 3 | `if(sec==='ARRÊTÉS DE COMPTE'){` | l'ancien + ` if(ch01cDraw(pane,C,G,touch)) return;` | `draw` (l. 2977) ; l'ancien code reste en repli |
| A10 | 3 | `if(x) v=JSON.parse(JSON.stringify(x));` | l'ancien + ` else if(CH01C_PRE.v){ v=CH01C_PRE.v; CH01C_PRE.v=null; }` (la ligne suivante commence par `else {` : la chaîne `if / else if / else` reste valide) | `ccPayment` (l. 3107) |
| A11 | 4 | `if(sec==='PAIEMENTS'){` | l'ancien + ` if(ch01dPayDraw(pane,C,G,touch)) return;` | `draw` (l. 2963) |
| A12 | 4 | `{t:'Ordre de paiement',dis:` | `{t:'Ordre de paiement [Ancien document]',dis:` | `ccOrders`, menu « Documents » (l. 3194) |
| A13 | 4 | `{t:'Bon de paiement',dis:` | `{t:'Bon de paiement [Ancien document]',dis:` | idem |

- A9 de la version du matin (`ccPayment(…,touch,pre)`) est **supprimée** : le paiement pré-rempli passe par `const CH01C_PRE={v:null}` (lot 3), posé juste avant l'appel synchrone de `ccPayment` ; la signature de `ccPayment` ne change pas (CH-03 cite A10 pour les annexes des paiements, sans dépendre d'une signature).
- **Réutilisées sans modification** : `h`, `esc`, `num`, `rJ`, `r2`, `cmp`, `cfcCmp`, `cfcLevel`, `cfcAnc`, `cfcPar`, `dfr`, `today`, `diso`, `toast`, `ibtn`, `popMenu`, `closeMenus`, `dialog`, `confirmDlg`, `ivAsk`, `ctMsg`, `ctBseq`, `ctOk`, `ctBox`, `ctNoSort`, `grid`, `phead`, `formRows`, `readK`, `matchQ`, `tableText`, `copyTable`, `csvTable`, `adrLines`, `contactName`, `vatDefault` ; `ccCond`, `ccApply`, `ccBrutFromNet`, `docNet`, `docTva`, `docBrut`, `ccCalc`, `CC_COL`, `COND`, `condNat`, `condTable`, `CTR_ST`, `MUT_ST`, `PAY_ST`, `ORD_ST`, `ARR_ST`, `GAR_T`, `ccEntName`, `ccNextNum`, `ccPayment` (après A10), `ccPrintOrder`, `ccPrintBon`, `tplOr`, `tplPrint` ; `svDpHTML`, `svDpDocHTML`, `svFmtVal`, `svField`, `svMember`, `svC`, `svPair`, `svStaffOfUser` ; `DS.all/get/by/need/commit/loaded/T`, `ME`, `CCV`, `VIEWS`, `$$`.
- **À ne pas modifier** : `svDpFind`, `svDpBands`, `svDpTable`, `svDpCols`, `svRowStyles` (Soumission) ; `svbProps`, `svbDpPrint` (lecture seule) ; `mgPrint`, `plModelDoc` ; `ccArrete` (reste en place) ; `ccPrint` ; `save` de `ccEditor` (garde CH-10 P5-P6) ; le menu « Paramètres » de `ccEditor` (CH-07).
- Les ancres A1-A8 touchent `ccEditor`, que CH-07 modifiera (barre, présentations) : **intégrer CH-01 avant CH-07**.

### 10.2 Lignes de `ch01a` gelées pour CH-03 (ancres B1-B4 de spec_17)

Ces textes du lot 1 écrit ne doivent plus changer (CH-03 lot 4 s'y accroche par insertion) :
- B1 : `{t:'Enregistrer sous forme de fichier PDF…',dis:true}` (`ch01aPanel`) ;
- B2 : `lbl('Fichiers PDF'),pdf,pm)` (`ch01aPanel`) ;
- B3 : `return ch01aView(r.doc.nom,R,{edit:upd=>{` (`ch01aOpen`) ;
- B4 : `function ch01aView(titre,R,o){ o=o||{};`.

Les lots 2 à 4 appellent `ch01aPanel` pour tous leurs panneaux (y compris les bons, via `fixe`) : ils héritent ainsi du branchement de CH-03 sans ancre supplémentaire. Les colonnes « PDF » des grilles des fenêtres (lots 2-4) restent vides : leur remplissage relève du complément CH-03 prévu après les lots 2 à 4 (spec_17 § 12, non livré).

---

## 11. Plan en lots

Taille totale : **L**. La fiche prévoyait 6 lots ; ils sont fusionnés en 4 :
- l'ancien lot 1 (socle) garde le Devis général et le Contrôle des coûts ;
- Mutations et Comptes d'entreprise rejoignent les Adjudications (même forme : liste et document par élément) ;
- le Rapport de paiements rejoint les Ordres et les Bons ;
- l'ancien lot 6 (PDF et annexes) n'est pas livré (CH-03).

Préfixes `ch01a` à `ch01d` (et `CH01A` à `CH01D`) et collection `cocodoc` : 0 déclaration dans `DeltaSub.html`, `serveur_deltasub.py` et les fichiers `.js`/`.py` des autres dossiers `ch/*/` (revérifié à 14 h 20 ; seules des mentions en commentaire dans CH-03).

Chaque lot livre dans `ch/CH-01/lotN/` :
- `ch01x.js` : déclarations de haut niveau, aucun accès au DOM au chargement, aucune redéclaration ;
- `build.py <DeltaSub.html source>` : ancres, contrôle d'unicité, collisions, syntaxe jsc, `DeltaSub.html` construit pour l'essai ;
- `test_ch01x.js` et `fixture_ch01x.json` pour jsc ;
- `integration.md` (remplacements exacts dans l'ordre) et le compte rendu de l'essai navigateur.

**Ordre d'intégration** : lot 1, puis 2, 3, 4 dans n'importe quel ordre ; CH-01 lot 1 avant CH-02 lot 3, CH-03 lot 4, CH-07, CH-11 (documents), EC-2 lot 4.

### Lot 1 — Socle d'impression, Devis général, Contrôle des coûts (préfixe `ch01a` / `CH01A`) — écrit

- **État** : `ch/CH-01/lot1.js` (339 lignes, 56 déclarations), `lot1_test.js` (83 contrôles), `lot1_integration.md`, `lot1prev/` (build, fixture, serveur modifié et diff). **Non intégré** ; la construction d'essai date de la source `866e3ea8` (avant `b50edc6` et CH-17).
- **À faire** :
  - reconstruire sur la source du moment (`9c9a3f9` ou suivante) avec `lot1prev/build.py`, régénérer `serveur_deltasub.py` modifié et `serveur.diff` ;
  - ajouter T-A17 (§ 7.1) ; relancer les 84 contrôles et la syntaxe du script complet ;
  - repasser l'essai navigateur N1-N10 sur la copie isolée ;
  - aucun changement de nom, de signature ni des lignes B1-B4 (§ 10.2). Seul changement de code admis : l'échange des deux libellés de `CH01A_CNOM` si Paulo choisit la variante fidèle de la décision n° 7.
- **Contenu** (rappel) : `cocodoc` (`CH01A_T`, `ch01aId`, `ch01aRec`, `ch01aSave`) ; serveur S1 ; arrondis et formats (`ch01aR`, `ch01aF`, `ch01aV`, `ch01aP`, `ch01aP1`, `ch01aPc`, `ch01aJd`, `ch01aTot`) ; nœud « Documents » (`ch01aDocNode`, `ch01aDocsDraw`, `ch01aFrame`) ; panneau et cycle de vie (`ch01aPanel`, `ch01aLbl`, `ch01aType`, `ch01aNameDlg`, `ch01aNew`, `ch01aOpen`, `ch01aRender`, `ch01aRename`, `ch01aErase`) ; modèle (`ch01aTplList`, `ch01aTplPick`) ; visionneuse et textes (`ch01aView`, `ch01aTexts`) ; préparation et contexte (`ch01aPrep`, `ch01aCtx`, `ch01aMoOuv`) ; tableaux (`ch01aProp`, `ch01aBands`, `CH01A_FLEX`, `ch01aFlex`, `ch01aCondRows`, `ch01aRoundRow`) ; options (`ch01aArr`, `ch01aGear`) ; repli (`CH01A_OLD`, `CH01A_OLDF`, `ch01aOld`, `ch01aHTML`) ; vues de calcul (`ch01aHT`, `ch01aOuv`, `ch01aOuvs`, `ch01aNt`) ; Devis général (`ch01aKvFrame`, `ch01aKvAgg`, `ch01aKvJob`) ; Contrôle des coûts (`ch01aOverviewFrame`, `CH01A_CENTRE`, `CH01A_CNOM`, `ch01aCentres`, `ch01aOvVal`, `ch01aOverviewJob`) ; ancres A0-A4, S1.
- **Tests** : T-A1 à T-A17 ; essai N1 à N10.
- **Dépendances** : aucune.

### Lot 2 — Adjudications, Mutations, Comptes d'entreprise (préfixe `ch01b` / `CH01B`)

- **Contenu** :
  - `ch01bAwardFrame` : fenêtre (grille de § 5.3 avec la règle du n° d'avenant, roue dentée, deux panneaux) ; `ch01bAwardListJob` « Liste contrats et avenants » (récapitulatif, lignes contrat / avenant avec 82-90 et 94, omission des avenants nuls, total) ; `ch01bSummaryJob` « Contrat » / « Avenant » (champs, `awardListTable`, `conditionTable` par `ch01aCondRows`, `contractAndAddendum`) ;
  - `ch01bMutFrame` : fenêtre (une ligne par mutation) ; `ch01bMutListJob` « Liste des mutations » (une ligne par écriture, 12 colonnes fixes, flexibles 20-31 signées, total, `mutationsListTotalTable` à 3 lignes conditionnelles, libellés de la décision n° 7) ; `ch01bMutJob` « Mutation » ;
  - `ch01bEntFrame` : fenêtre (liste des entreprises, message « Erreur ») ; `ch01bEntJob` « Comptes d'entreprises » (algorithme cas A / B, hors contrat par lot, total ; flexibles 82-90, 120-130, 132-134, 161, 1611-1612) ;
  - fonctions pures testées : `ch01bAwardRows`, `ch01bMutRows`, `ch01bMutTotals`, `ch01bEntRows` ;
  - ancre A0 seulement.
- **Tests** : T-B1 à T-B9 ; essai N11 à N14 (dont un contrat issu de la Soumission créé sur la copie de base).
- **Dépendances** : lot 1 (`ch01aPanel`, `ch01aTplPick`, `cocodoc`, `ch01aCondRows`, `ch01aRoundRow`, `ch01aFlex`, `ch01aArr`, `ch01aGear`, `ch01aCtx`, `ch01aTot`, `CH01A_OLD`).

### Lot 3 — Arrêtés de compte, garanties, paiement final, documents Arrêté et Liste des garanties (préfixe `ch01c` / `CH01C`)

- **Contenu** :
  - section ARRÊTÉS DE COMPTE : `ch01cDraw` (grille, `onSel`, Adresses, Tri, menu d'outils et clic droit), `ch01cAddItems` (A5) ;
  - « Liste des adjudications » (`ch01cPickContract`) ;
  - dialogue « Arrêté de compte » : `ch01cEdit`, `ch01cInit` (pur), `ch01cNextNum` (pur), `ch01cCheck` (pur : contrôles de l'OK et messages), écriture ; « Informations de la garantie » (`ch01cGarantie`) ; `ch01cDelete` ;
  - « Comptabiliser le paiement final » : `CH01C_PRE`, `ch01cFinalPrefill` (pur), `ch01cBookFinal` ;
  - `ch01cFinalFrame` et documents « Arrêté de compte » (`ch01cSolde` pur, `ch01cPrevRows` pur, `ch01cGuaranteeJob`) et « Liste des garanties » (`ch01cGarRows` pur, `ch01cGarListJob`) ;
  - ancres A0, A5-A8, A10.
- **Tests** : T-C1 à T-C11 ; essai N15 à N20.
- **Dépendances** : lot 1. Aucune dépendance aux lots 2 et 4.

### Lot 4 — Rapport de paiements, Ordres et Bons de paiement (préfixe `ch01d` / `CH01D`)

- **Contenu** :
  - section PAIEMENTS : `ch01dPayDraw` (en-tête : Filtre, « Filtré », Tri, case « Récapitulatif de TVA » ; grille actuelle filtrée et triée ; carte de TVA), dialogue « Filtre » (`ch01dFilterDlg`), `ch01dFilter` (pur), `ch01dSort` (pur), `ch01dList`, `ch01dVat` (pur) ;
  - `ch01dPayFrame` et « Rapport de paiements » (`ch01dFilterText` pur, décision n° 8 ; `ch01dPayListJob` : récapitulatif, tableau à 17 colonnes, « Total », « Total TVA <taux> % ») ;
  - `ch01dOrderFrame` (deux grilles, menus « Bon de paiement », édition, suppression), « Ordre de paiement » (`ch01dBefore` pur, `ch01dOrderRows` pur avec l'option de soldes, `ch01dOrderJob`), bons sur contrat et hors contrat (`ch01dBonJob`, `ch01dPrevPays` pur), « Créer tous les documents », « Supprimer tous les documents » ;
  - libellés « [Ancien document] » (A12, A13) ;
  - ancres A0, A11-A13.
- **Tests** : T-D1 à T-D10 ; essai N21 à N24.
- **Dépendances** : lot 1. Aucune dépendance aux lots 2 et 3.

### Non livré (et pourquoi)

| Élément | Raison |
|---|---|
| Enregistrement en PDF, liste et menus des PDF, partage, import, fusion, « Créer un PDF (avec tous les bons) », facture d'entrepreneur jointe, annexes de l'arrêté, colonnes « PDF » des grilles | CH-03 (stockage des fichiers) ; entrées grisées ; branchement par B1-B4 puis complément CH-03 après les lots 2-4 |
| Note d'expédition, commentaire sur le document | n'existent pas dans le contrôle des coûts 16.05 (§ 1 n° 5) |
| Documents Descriptif et Honoraires, Mutations 2, valeurs flexibles des options avancées | CH-18 |
| Noms personnalisés des centres, titres de colonnes, présentations et leurs préférences, filtres des autres sections, options d'affichage du rapport, option « Afficher les montants avant/après exécution » | CH-07 |
| Éditeur complet d'un document | CH-14 |
| Préférences d'impression des anciens documents, `DeductionPreferencesDialog`, autres entrées « [Ancien document] » | ancien circuit, repli seulement (D4) |
| Reprise des 719 `.dpdoc` et des options du bureau par le convertisseur | décision n° 4 |
| Contrôle de droits, lecture seule | CH-08 |

---

## 12. Décisions restantes pour Paulo

1. **Dates inversées dans « Paiements à ce jour » de l'arrêté (F1)** : l'original imprime la date de facture sous « Date pmt » ; les 31 PDF du bureau sont ainsi. **Par défaut : reproduire**. Variante : corriger.
2. **Création d'un arrêté (F8)** : l'original le crée dès le choix du contrat ; annuler laisse un arrêté vide « non défini » (4 au bureau). **Par défaut : ne le créer qu'à l'OK.**
3. **Note d'expédition et commentaire sur le document** : inexistants dans l'original, jamais utilisés au bureau. **Par défaut : retirés du chantier** (extension DeltaSub possible plus tard).
4. **Reprise des documents du bureau** (D4-d) : 719 `.dpdoc`, options d'arrondi (3), « Joindre la facture d'entreprise » (7), noms des centres (22). **Par défaut : pas dans cette vague** ; les documents se recréent dans DeltaSub à partir des modèles du bureau.
5. **Ligne de paiement sans correspondance au paiement final (F12)** : l'original l'ajoute avec un net positif. **Par défaut : corriger** (net négatif).
6. **Présélection du modèle** : le bureau choisit « Contrat_Entreprise » pour 108 contrats sur 113, mais l'original présélectionne « Contrat » (verrouillé). **Par défaut : fidèle** (première ligne). Variante : dernier modèle choisi pour le type sur ce poste (`localStorage`).
7. **Noms croisés des centres (F15)** : avec les noms par défaut, l'original libelle « Variations » les renchérissements et « Renchérissement » les variations (page de garde du Contrôle des coûts, totaux de la Liste des mutations) ; le bureau a corrigé ces noms à la main dans 2 contrôles des coûts (dont 2751, qui a des variations). **Par défaut : libellés justes** (« Renchérissement » pour les renchérissements, « Variations » pour les variations). Variante : fidèle.
8. **Texte du filtre du rapport de paiements (F16)** : l'original imprime « Paiements :payGeneral », « Prédéfinirpayed »… **Par défaut : libellés lisibles** (« Paiements hors contrat », « débité ») et une espace après chaque intitulé. Variante : fidèle.
9. **Montants du rapport de paiements (F18)** : avec le modèle du bureau, Deltaproject 16.05 imprime le statut dans la 1re colonne de montant et aucun montant par paiement (3 rapports sur 3). **Par défaut : imprimer les montants** (colonne flexible). Variante : fidèle. Lié : la case « Récapitulatif de TVA » part **décochée** (aucun rapport du bureau n'a de lignes de TVA) ; l'écran PAIEMENTS n'affiche plus la carte de TVA tant qu'on ne l'a pas cochée.
10. **Lignes « avant / après exécution » de l'ordre (F14)** : l'original les lie à « Afficher la désignation CFC ». **Par défaut : les lier à « Afficher les montants avant/après exécution »** quand CH-07 ajoutera cette option ; d'ici là, elles ne s'impriment pas (comme les 39 ordres du bureau).

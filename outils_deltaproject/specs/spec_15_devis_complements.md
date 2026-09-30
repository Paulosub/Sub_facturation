# Cahier des charges — CH-02 « Devis général : compléments d'édition, descriptif, imports et exports, historique » dans DeltaSub

Version 3 du rédacteur critique, 30.09.2026 (18 h 45) : **revalidation sans changement de fond** de la version 2 de 14 h 42 (copie : `research/crit_CH-02/spec_15_v2_1442.md`), qui remplaçait la version 1 de 10 h 55 (`research/crit_CH-02/spec_15_v1_1055.md`). Ajouts de la v3 : § 1.3 (revalidation, arbitrage du compte « Arrondi »), états des lots au § 10, point 9 du § 11. Les lots construits depuis 15 h sur la v2 restent conformes. Ce cahier décrit comment compléter le module Devis général de `DeltaSub.html` pour reproduire la fenêtre `deltaproject.costestimate.KvDialog` de Deltaproject 16.05, sa fenêtre « Calcul pour … » (`KvCalcDialog`), ses réglages (`KvPreferencesDialog`), ses documents (ancien format DESIGN `KvListDisplayDialog` / `KvHonorarDisplayDialog` et nouveau format `.dpdoc`), ses exports, la liste « Mes devis » et le domaine d'affaire « Devis général » (`CostEstimateFrame`, greffon `plugins.CostEstimatePlugin`, `deltabauad.project.CostEstimateDocumentDialog`), ainsi que l'historique des versions. Il confronte les deux recherches du chantier (`ch/CH-02/rech_orig.md` v2, `ch/CH-02/rech_exist.md` sur `9c9a3f9`), la version 1 du cahier, le lot 1 déjà construit (`ch/CH-02/lot1/`), la fiche CH-02 et le § 16 de l'inventaire. Chaque point contesté a été revérifié à la source (§ 1).

**Conventions**
- **[P] PROUVÉ** : bytecode `Classe.méthode@offset` (désassemblages dans `ch/CH-02/work/jp/`, `ch/CH-02/r2/`, `ch/CH-02/crit2/` ; `ce.` = `deltaproject.costestimate.`, `dba.` = `deltabauad.`), libellé `Strings.db (classe|id)`, donnée de la base de test (`dstest/deltasub.sqlite`, copie de la base du bureau), fichier `.dpdoc` du bureau (`work/dpdoc/`, 59 copies), manuel.
- **[D] DÉDUIT** : interprétation cohérente, non démontrée ligne à ligne ; le lot concerné la vérifie avant de coder.
- **[C] CHOIX** : décision de conception pour DeltaSub, signalée à Paulo (§ 7 et § 11).

**Références.** `DeltaSub.html` du dépôt au commit `9c9a3f9` : 14 522 lignes, md5 `b5db79206029ddfe413a4ec83bcd3858`. `serveur_deltasub.py` : 431 lignes, md5 `20c0933d385f03f71d47e51202d03c3c`. `outils_deltaproject/extraire.sh` : md5 `df6e256e371377a36cf53c8fb3b3aa8d`. Lot 1 de CH-02 (`ch/CH-02/lot1/ch02a.js`, 75 déclarations, non intégré) : **reconstruit sur `9c9a3f9`** dans une copie temporaire — ancres A0, R1, R3 à R9, A11 toutes trouvées une fois avec leurs empreintes, syntaxe OK, **162 contrôles jsc réussis** ; la copie a été effacée ensuite (ses déclarations `ch02a` auraient fait échouer le contrôle de collisions des `build.py`). Socle CH-01 lot 1 (`ch/CH-01/lot1.js`, 30.09 12 h 24) : écrit, **non intégré**. Le fichier change pendant le travail des chantiers parallèles : **seules les ancres textuelles et les empreintes du § 9 font foi**.

**Aucune donnée personnelle** : identifiants de documents et d'affaires, codes CFC et d'ouvrages, compteurs, montants de contrôle et libellés d'interface seulement. **Aucun contenu CRB.**

**Fichiers de vérification de cette version** (`ch/CH-02/crit2/`) : `t_qte3.js` (quantité de formule arrondie à 3 décimales : 345/345) ; `t_arrondi.js` (recalcul des lignes quand « Arrondi » change) ; `dv_engine.js` (moteur et évaluateur extraits à l'identique de `9c9a3f9`, plus `ecR`) ; `Display.txt`, `HDS.txt` (désassemblages des valeurs par défaut) . Version 1 du cahier : `research/crit_CH-02/spec_15_v1_1055.md` (hors de `ch/`, pour ne pas gêner les contrôles de collisions). Pour rejouer la reconstruction du lot 1 : copier `ch/CH-02/lot1/` hors de `ch/`, lancer `python3 build.py` puis `zsh test.sh`, effacer la copie. Les fixtures JSON de données du bureau ont été **effacées** après usage (`python3 ch/CH-02/exist2/gen_ce.py <base> ce.json` pour rejouer, puis effacer). Contrôles des règles de l'ancien document et des exports : `ch/CH-02/r2/ctl_v2.js` (rejoué : **23 OK**).

---

## 0. Synthèse

1. **DeltaSub a le squelette du devis** (liste par affaire, éditeur, « Calcul pour … », moteur exact `dvCompute` : 130/130 devis recalculés au centime) mais presque aucune commande de la fiche. Les données manquantes à l'écran existent déjà dans la base : 251 présentations, 940 sauts de page, 25 favoris de filtre, 3 686 descriptifs, les titres de document de 130 devis (112 pages de garde personnalisées).
2. **Le lot 1 est déjà construit et reste bon** : il est gardé (préfixe `ch02a`) et reçoit quatre **compléments** établis par cette critique : quantité de formule arrondie à 3 décimales, fenêtre « Paramètres » du devis complète (4 catégories, recalcul des lignes quand « Arrondi » change), en-tête du devis **non modifié** par l'enregistrement du contenu, point d'extension d'affichage du panneau Documents à l'ouverture (§ 1, n° 28 à 31 et 45).
3. **Portée des commandes, tranchée au bytecode** : « Modifier la TVA » et « Modifier le montant soumis » agissent sur **tout le devis** ; seul « Indexer » agit sur la position et ses sous-positions (préfixe du numéro). Le prix HT est conservé par « Modifier la TVA », le TTC est recalculé.
4. **« Arrondi » (fenêtre Calcul) est intensif** (790 lignes « Arrondi » au bureau) ; l'algorithme reproduit 719 des 753 lignes finales au centime, les 34 autres à 0,05 près (TTC ressaisis).
5. **Filtre** : la sémantique de `dvCompute` est corrigée par un remplacement d'une ligne (ouvrage absent du filtre = 0, facteur 0 = 0, partie sans ouvrage toujours comptée) ; aucun consommateur actuel n'appelle le moteur avec un filtre (130/130 identiques sans filtre).
6. **Deux circuits d'impression coexistent** et sont repris : l'**ancien document** (modèle DESIGN `projectCostcontrolEstimate`, présentations enregistrées, sauts de page, « Honoraires », « Feuille de position » ; 104 « impression MO » + 104 « impression TRAVAIL ») et le **nouveau format** `.dpdoc` (panneau Documents : Devis général, Honoraires, Devis descriptif ; 59 documents du bureau, dont 24 retouchés, conservés **par devis**).
7. **Historique** : D12 est arrêtée par défaut — **pas de reprise** des 15 431 versions Deltaproject des devis vivants. DeltaSub tient son propre historique (5 versions, au plus une toutes les 10 minutes d'édition), avec la commande cachée « À la dernière version » (Maj + clic sur Edition).
8. **`.deltakv`** (zip d'objets Java sérialisés ; un seul fichier au bureau, de 0 octet) : **non reproduit** (D18) ; entrées visibles et grisées.
9. **Conflits** : l'enregistrement continu envoie la version lue (`bseq`) ; une modification faite ailleurs n'est plus écrasée en silence.
10. **Plan : 4 lots** (la fiche en prévoyait 6, fusionnés). Lot 1 `ch02a` : fenêtre, commandes d'édition, Calcul, filtre, modes, Paramètres (construit + compléments). Lot 2 `ch02b` : ancien format complet (présentations, aperçu, sauts, réglages, Feuille de position, Honoraires) et exports RTF / FastTrack. Lot 3 `ch02c` : nouveau format (panneau Documents, trois documents, reprise des 59 `.dpdoc`). Lot 4 `ch02d` : « Mes devis », domaine, fiche, Dupliquer et modifier, import d'une affaire, navigateur, historique (§ 10).
11. **Coordination** : socle d'impression de CH-01 lot 1 utilisé **s'il est intégré** au moment du lot 3 (sinon `svDpFind` / `svDpHTML`, sans modification) ; PDF enregistrés par l'API de CH-03 **si elle existe** ; verrou d'ouverture posé par CH-10 lot 3 sur `dvOpen` ; libellé « Mes devis » pris par CH-02 lot 4 (accord de spec_19, n° 37).

---

## 1. Arbitrages entre les sources (tranchés à la source)

### 1.1 Arbitrages de la version 1, confirmés

Les 27 arbitrages de la version 1 sont confirmés par la recherche v2 et par la relecture du lot 1. Résumé (preuves détaillées dans la copie de la v1, § 1) :

| # | Sujet | Verdict | Preuve |
|---|---|---|---|
| 1 | Portée de « Modifier la TVA » | **Tout le devis** (positions non générées, toutes les lignes, Var comprises) ; `fixe.tva` mis à jour si un coût est fixé ; HT inchangé, TTC recalculé | [P] `ce.KvDialog.insertVat@33-265`, `vatOnePosition@0-23` |
| 2 | Portée de « Modifier le montant soumis » | **Tout le devis** : `honorPct` de chaque partie des positions non générées | [P] `insertHonorar@32-130` |
| 3 | Colonnes de la fenêtre « Filtre » | « Ouvrage » \| « Localisation » \| « Facteur » \| « M » ; M décoché par défaut ; pas de plage CFC | [P] `ce.FilterDialog.initSubProjectTable@0-36` |
| 4 | Menu « Présentation ▾ » | **5 boutons radio** seulement ; les cases sont celles du menu de réglages **du document** (panneau Documents) | [P] `KvDialog.initDisplayPopup@15-367` |
| 5 | Pré-contrôle du navigateur | Devis **Validés ou Annulés** des **autres** affaires ; tableau : devis **Validés** seulement | [P] `KvCalcDialog.bkpBrowser@113-130`, `BkpPositionBrowserDialog.setProjectListTable@129-132` |
| 6 | Bouton « Compare » | Masqué dans le module et le domaine : rien à reproduire | [P] `CostEstimateFrame.<init>@93-98` (les deux classes) |
| 7 | Devis à ouvrages dans une affaire qui n'en a plus | Aucun message : `ISAPPLYSUBPROJECTS` remis à 0 en silence ; `KvDialog/msg8a-b` n'est appelé nulle part (la seule référence à `msg8a` est celle de `KvCalcDialog`, « Le montant de la position est fixé. ») | [P] `plugins.CostEstimatePlugin.openCommand@164-267` ; recherche binaire |
| 8 | « Supprimer la position » | `msg1` sans sous-position, `msg2` avec ; sous-positions retirées **seulement si le numéro ne contient pas de point** ; ancêtres générés devenus vides retirés après `msg1` | [P] `KvDialog.removePosition@205-1121` |
| 9 | « Supprimer les ouvrages à 0 » | Règle **par partie** : partie de code non vide, total 0, couple (code, localisation) absent de l'affaire → retirée ; puis dédoublonnage | [P] `jMatchSupbrojectsMenuItemActionPerformed@43-514` |
| 10 | « Mettre tous les montants à zéro » | `msg14a` ⏎ `msg14b` ; prix et TTC à 0, coût fixé retiré ; taux « soumis » intact | [P] `jSetValueToZeroMenuItemActionPerformed@3-270` |
| 11 | Textes de suppression | `msg1` « … cette position ? » (avec espace) ; `msg2` « … subordonnées? » (**sans** espace) | [P] `Strings.db (ce.KvDialog\|msg1, msg2)` |
| 12 | Filtre actif | Propre à la session de la fenêtre (vidé à l'ouverture) ; seuls les favoris sont enregistrés | [P] `KvDialog.<init>@1048-1052` |
| 13 | TTC d'une ligne sans « Arrondi » | L'original ne l'arrondit pas ; **[C] centime** (écart E1) : 3 177 lignes déjà au centime au bureau, 1 seule ne l'est pas | [P] `ce.Format.roundValue@5-77` |
| 14 | Arrondi au pas de 0,05 | **Symétrique** : `ecR(x, arr)` (= `Formatter.round`), jamais `r05` / `r2` | [P] `util.Formatter.round@0-78` |
| 15 | « À la dernière version » (original) | Dernière copie horodatée ; l'état courant devient `_old` ; fenêtre fermée sans message ; jamais utilisé au bureau (0 `_old`) | [P] `jRestoreMenuItemActionPerformed@8-434` |
| 16 | « Effacer le document » (panneau) | PDF existant : « Un fichier PDF existe déjà. » et arrêt ; sinon « Voulez-vous supprimer ce fichier définitivement ? » | [P] `KvDialog.deleteKvDocument@55-160` |
| 17 | Suppression d'un devis | **Corbeille en deux temps** (`msgDeleteEntry`, puis `msgDeleteEntryDefinitely`) | [P] `dba.project.CostEstimateDocumentDialog.deleteCostEstimateDocument@9-119` |
| 18 | « Dupliquer » | Fiche en mode création, Version = « <version> Copie » (recette `"\u0001 \u0001"`), autres champs recopiés ; case « subdivisions » grisée, case TVA grisée si la source sépare la TVA (n° 46) ; OK : copie du dossier | [P] `duplicateCostEstimateDocument@12-258` ; pool de constantes (v2) |
| 19 | « Mes devis » | Devis **de l'utilisateur** (`findByUserId`), colonne « N° d'affaire » ; « Nouveau » et « Importer ▾ » demandent **d'abord l'affaire** (`ProjectBrowserDialog`) | [P] `ce.CostEstimateFrame.setDocumentTable@0-23`, `jImportButtonActionPerformed@0-43` |
| 20 | Colonnes de la liste | [verrou] · [« N° d'affaire » en module] · « Utilisateur » · « Date » · « Version » · « N° de version » · « Statut » · « Notes » ; « Ouvrages » et « Total TTC » : ajouts DeltaSub conservés (E12) | [P] `db.CostEstimateDocumentTableModel.<clinit>@15-91` |
| 21 | Fiche d'en-tête | « Nouveau devis général » / « Editer le devis général » ; OK actif si **Version non vide et statut choisi** | [P] `checkGuards@4-44` (relu : `jVersionTextField.isEmpty`, `jStateComboBox.getSelectedItem`) |
| 22 | Emplacement des commandes | Navigateur : roue de la fenêtre **Calcul** ; Dupliquer et modifier : roue de la **liste** ; À la dernière version : **Maj + clic** sur Edition | [P] `KvCalcDialog.jBigWheelButtonActionPerformed`, `CostEstimatePlugin.addWheelPopupMenuItems@17-203`, `KvDialog.jEditMenuMouseClicked@1-23` |
| 23 | Devis descriptif à l'ancien format | **Code mort** en 16.05 : seul le `.dpdoc` `costEstimateDesc` existe | [P] recherche binaire des références |
| 24 | Droits de modification | `Rights.rigthsIsOk` : `USERID` vide ou égal, ou `areBauadDocsLocked` = `[NO]` (cas du bureau, réglage 601) | [P] `ce.data.Rights.rigthsIsOk@1-52` |
| 25 | Taux de TVA par défaut | Réglage `genVatRatePos` (réglage 55 = « 8.1 ») | [P] `KvCalcDialog.doRound@136-156` |
| 26 | Historique au bureau | 17 226 versions pour 221 dossiers (1,17 Go) ; 15 431 pour les 130 devis vivants (1,10 Go) | données `DELTAprojectFiles` (lecture seule) |
| 27 | Filtre et parties sans ouvrage | Le filtre ne porte que sur les parties **d'ouvrages** ; une partie sans ouvrage garde le facteur 1 (sinon 7052 tomberait à 0) | [P] `CalcKv.containsSubProject` appelé seulement sur les `SubProjectItem` |

### 1.2 Arbitrages nouveaux de cette version

| # | Sujet | Affirmations en présence | Verdict | Preuve |
|---|---|---|---|---|
| 28 | Quantité calculée par une formule | `rech_exist` § 1.4 n° 8 : arrondie à 3 décimales, « règle à confirmer » ; lot 1 : `l.qte = evalQ(formule)` non arrondi | **Arrondie à 3 décimales** : q = `Math.round(calcul × 1000) / 1000` (arrondi Java = JS : demi vers +∞). Sur les 345 formules du bureau : **345/345** reproduites (340 sans arrondi) | [P] `ce.BkpQuantityCalcCellEditor.getCellEditorValue@76-85` → `deltaproject.costplanning.Ausmass.roundAusmass@0-13` (`× 1000.0`, `Math.round`, `/ 1000.0`) ; `crit2/t_qte3.js` |
| 29 | Date et utilisateur de l'en-tête à l'enregistrement | DeltaSub et lot 1 : `CHANGEDDATE = aujourd'hui`, `USERID = utilisateur courant` à chaque enregistrement ; spec_19 (CH-10) § 8 n° 3 : « l'original conserve l'auteur » | **L'enregistrement du contenu ne touche pas l'en-tête** : ni la date ni l'utilisateur. Seule la fiche « Editer le devis général » les modifie. Conséquence utile : un devis ne change pas de « Mes devis » quand un collègue le modifie | [P] aucun setter de `db.CostEstimateDocument` ni d'`EntityManager` dans `KvDialog`, ses classes internes, `KvCalcDialog`, `ce.data.Save` et `Save$DirectoryDuplicator` (recherche dans les désassemblages) |
| 30 | Fenêtre « Paramètres … » (clé ▾) | spec_4 § 5.1 : 8 catégories (Généralité, Document, Positions…) ; DeltaSub `dvSettings` : 7 champs ; inventaire : « présent » | `KvPreferencesDialog` a **4 catégories** : « Information », « Affichage », puis, si `isModuleFormVisible` (réglage 801 = `[YES]`), « Commentaire » et « Titres ». La liste de spec_4 mélange ces réglages et ceux de la présentation (`KvDisplayPrefsDialog`). DeltaSub n'édite ni les 4 titres de pages, ni la date, ni les 5 textes libres : **partiel** | [P] `KvPreferencesDialog.initCategory@0-317` (`INFORMATION_NAME`, `SETTING_NAME`, test `Settings.isModuleFormVisible`, `COMMENT_NAME`, `KV_NAME`), `<init>` (`docInformation`, `docSetting`, `docComment`, `docTitles`), mises en page `glv2.py` ; données : titre de page de garde personnalisé dans 112 devis sur 130 |
| 31 | « Arrondi » modifié dans les Paramètres | v1 § 8 n° 2 : écart hors chantier | **Dans le lot 1** : si la case « Arrondi » change, le TTC de chaque ligne des positions non générées est recalculé (`calcOnePosition`), TTC saisis compris | [P] `KvDialog$47` (`doRound` avant/après, `recalcPositions`), `KvDialog.recalcPositions` (`setTotal(calcOnePosition(l))`) ; `crit2/t_arrondi.js` |
| 32 | Libellés du menu Documents ▾ | v1 § 4.6 : « Ajouter … par défaut … », « Supprimer la présentation … », « Honoraires », « Feuille de position » | « Document <nom> … » · [séparateur **seulement s'il y a plus d'une présentation**] · « Ajouter une présentation par défaut » (sans « … ») · « Renommer la présentation … » · [« Supprimer la présentation » (sans « … »), s'il y en a plus d'une] · séparateur · « Honoraires … » · « Feuille de position … » (active si une ligne est choisie) | [P] `KvDialog.initDocumentPopup` : `mapParamStringWithEllipsis(printKvFR)`, `mapString(newSettingMenu)`, `mapStringWithEllipsis(editSettingMenu)`, `mapString(removeSettingMenu)`, `mapStringWithEllipsis(honorarMenu, posheet)`, `addSeparator` sous `size() > 1` (@383) et avant « Honoraires » (@550) |
| 33 | Liste de présentations vide ; présentation initiale | v1 : présentation « Standard » créée [D] | **Liste vide** (Documents ▾) : une présentation **sans nom** (`KvDisplaySettings()` : nom `""`, valeurs par défaut de `Display`) est **ajoutée** à la liste et proposée comme « Document  … ». **Nouveau devis, import d'une affaire** : une seule présentation « Standard » favorite (`Init|standard`), valeurs = préférences de l'utilisateur (non livrées, CH-08) → valeurs par défaut de `Display` (§ 3.2) | [P] `initDocumentPopup@233-369` (`new KvDisplaySettings`, `getPrefList().add`), `KvDialog$52` ; `Init.initDocument` ; `ce.data.Display.<init>` (77 valeurs relevées, `crit2/Display.txt`) |
| 34 | « Importer les présentations … » : ce qui est copié | v1 : présentations, remarques, réglages dont **textes libres** ; en-tête intact [C] | Copiés : présentations (clone), `introDescList` (remarques), `round`, `referProcToTot`, `precision` (marge), les 5 titres, `displayMode` et les clés d'affichage, réglages du descriptif et des honoraires, `separateVat` **d'`Estimate`**. **Non copiés** : textes libres, indice, états, date. Les lignes ne sont **pas** recalculées même si « Arrondi » change. `Estimate.separateVat` n'est pas repris par le convertisseur DeltaSub (la TVA séparée vit dans l'en-tête) : **[C] ignoré**, en-tête intact | [P] `KvDialog.jImportPrefMenuItemActionPerformed` (suite exacte des `get`/`set` relue dans `work/jp/deltaproject.costestimate.KvDialog.txt`, l. 10731 et suivantes) ; `outils_deltaproject/convertir_devis.py` l. 548-566 |
| 35 | « Dupliquer et modifier la subdivision » : titres et aplatissement | v1 § 4.14 : `msg3`, `msg4` « Avertissement » ; `msg5`, `msg6a` « Information » ; aplatissement : « descriptifs joints par un saut de ligne, commentaires joints par une espace » ; rien d'écrit après `msg5` | Titres : `msg3` et `msg4` **« Information »** (Oui/Non) ; `msg5` et `msg6` **« Erreur »** (OK) ; `msg6b` est vide. L'en-tête et la copie du dossier sont **déjà écrits** avant les messages (après `msg5` / `msg6`, la copie reste telle quelle). Aplatissement (`msg3` Oui) : lignes propres de la position **effacées** ; lignes de chaque partie copiées dans la position ; texte des descriptifs des parties **préfixé** au descriptif de la position, **sans séparateur** avec lui, séparés entre eux par un saut de ligne ; **commentaires des parties perdus** ; parties retirées. **Défaut** : le descriptif d'une partie est ajouté **une fois par ligne** de la partie → **[C] une seule fois** (E16) | [P] `dba.project.CostEstimateDocumentDialog.matchCostEstimateDocument@0-1599` (`persist` @184, `copyDirectory` @316, `msg5` @349 / `error`, `msg4` @530 / `information`, `msg3` @1115 / `information`, boucle @1164-1539, `insertString(0, …)` @1526, `msg6` @1552 / `error`) ; `Strings.db (dba.project\|CostEstimateDocumentDialog\|msg6b)` = vide |
| 36 | « Importer un devis CFC d'une affaire » | v1 § 4.11 : fiche préremplie, Version vide [D] ; en module `pickProject` [D] ; aplatissement « comme § 4.10 » | Fiche **vierge** (seule l'affaire est posée, OK grisé jusqu'à la saisie de la Version) ; en module, **choix de l'affaire cible d'abord** ; aplatissement **propre à l'import**, différent du n° 35 : commentaire = commentaire + « ␠ » + commentaire de la partie (le résultat commence donc par une espace), descriptif de la partie ajouté **à la fin**, sans séparateur, **seulement si** la position a déjà un descriptif, `definitif` à faux | [P] `copyCostEstimateDocument@0-88, @565-844, @851` ; `ce.CostEstimateFrame.jImportButtonActionPerformed@0-43` (rech_orig v2 § 5.3) |
| 37 | Page « A4 Landscape 2 » du modèle `costEstimateEstimate` du jeu 2 | rech_orig v2 § 11 : page absente, repli à vérifier [D] | Page absente → **modèle de page par défaut « A4 Portrait »** : c'est exactement le repli de `svDpPage` (page du rapport, sinon « A4 Portrait » du rapport ou du jeu) | [P] `doc.reports.Report.getPage@0-54` (id cherché dans `pageTemplates`, sinon `PageTemplate.getDefaultPageTemplate()`), `doc.reports.PageTemplate` (`defaultPageTemplateId_A4Portrait`) ; `DeltaSub.html` `svDpPage` |
| 38 | Encodage du fichier FastTrack | rech_orig v2 : UTF-8 [D] | **UTF-8** : `FileWriter(String)` (jeu de caractères par défaut) sur la JVM embarquée 23.0.1, sans `-Dfile.encoding` (défaut UTF-8 depuis Java 18) | [P] `ExportDialog` #626 `FileWriter."<init>":(Ljava/lang/String;)V` ; `DELTAproject.app/Contents/runtime/…/release` `JAVA_VERSION="23.0.1"` ; `app/DELTAproject.cfg` sans `file.encoding` |
| 39 | Sources de champs | v1 § 5.2 : `projectBaseIndex` [D] ; date du devis = en-tête | `projectBaseIndex` = **`project.BASISINDEX`** ; `estimateDate` et le champ `date` de l'ancien document = **`Estimate.date`**, conservée par le convertisseur dans `source.date` (format Java « EEE MMM dd HH:mm:ss zzz yyyy ») ; `Estimate.date` s'édite dans « Paramètres » ▸ Information ▸ « Date » | [P] `APP.PROJECT` colonne `BASISINDEX` ; `EstimateDocumentReport.getString` (rech_orig v2 § 4.3, ordinaux 4-5) ; `convertir_devis.py` l. 546 ; `KvPreferencesDialog.initDialog` (`getDate`, `jDateTextField`) |
| 40 | Ancien document : réglages sans effet, pages vides | v1 § 5.1 : `titlePosBold`, `detailItalic` parmi les styles ; 6 catégories [D] | « Titres en gras » et « Détails en italique » **n'ont aucun effet** (le gras vient du nom de police) ; « Détails en italique » et « Décaler légèrement les montants » **ne sont pas affichés** ; les « Pages vides » **ne créent aucune page** (elles réservent des numéros) ; « Paramètres » de la présentation : **7 catégories** (« Arrondir » en plus) | [P] `PrintCellRenderer.<init>@205-687`, `glv.py` ; `KvListDisplayDialog.createBooklet@660-4641` ; `KvDisplayPrefsDialog.initCategory@132-392` (rech_orig v2 § 3.5-3.6) |
| 41 | Préfixes du chantier | `rech_exist` § 0.2 : `ch02a`-`ch02d` déjà pris dans `ch/CH-02/` ; cités par CH-10 (`ch02aBar`, `ch02aCanEdit`), CH-03 (`costestimatedpdoc`, `costestimatehist`), spec_19 | **[C] conservés** : `ch02a` (lot 1, déjà écrit), `ch02b`, `ch02c`, `ch02d` ; collections `costestimatedpdoc`, `costestimatehist`. Les points d'extension appelés par le lot 1 (`ch02bDocMenu`, `ch02bImportPres`, `ch02bExport`, `ch02bExportDesc`, `ch02cToggleDocs`, `ch02dLastVersion`, `ch02dNavigator`, `ch02dHistOps`, `ch02dHistDone`) fixent l'affectation des fonctions aux lots | `lot1/ch02a.js` ; spec_17 § 3.5 ; spec_19 § 8 |
| 42 | Modèle de l'historique DeltaSub | v1 : collection `costestimatehist`, une version par enregistrement, index dans le devis, suppression avec le `seq` mémorisé ; spec_11 § 3.8 (Soumission, non codé) : un enregistrement par document | **v1 retenue** (une version = un enregistrement, index `historique[]` dans le devis) : elle évite de charger toute la collection (`DS.need` charge une collection entière, ≈ 26 Mo) à chaque ouverture. **Simplification** : la suppression d'une version part avec `bseq` = version lue du devis (`X.seq`), toujours ≥ celle de la version (créée dans un commit antérieur, jamais modifiée) ; aucun `seq` n'est stocké dans l'index | [C] ; serveur `commit` : conflit si `seq courant > bseq` (l. 154) |
| 43 | Reprise des 59 `.dpdoc` du bureau | v1 : oui ; spec_14 (CH-01) décision n° 4 : pas de reprise des 719 `.dpdoc` du contrôle des coûts dans cette vague | **[C] oui pour le devis** : 59 fichiers d'un seul genre (convertisseur d'environ 80 lignes), dont **24 retouchés** (colonnes « Ouv. » et « Loc. » masquées) qu'aucun écran DeltaSub ne sait refaire tant que l'éditeur (CH-14) n'existe pas. Décision n° 4 du § 11 | `work/cmpdp.txt` ; `serveur_deltasub.py` : import générique de `documents/*.json` |
| 44 | Libellé « Mes devis » (ancre A2) | fiche CH-10 et v1 A2 | **CH-02 lot 4** ; CH-10 ne touche pas `['devis','Devis']` | spec_19 § 1 n° 37 |
| 45 | Panneau Documents à l'ouverture | lot 1 : panneau créé masqué, `X.docsOn = true`, affichage seulement par la case « Afficher les documents » | Le panneau est **visible** à l'ouverture ; le lot 1 appelle un point d'extension `ch02cMount(X)` à la fin du montage | [P] `KvDialog.<init>@1060-1062` |
| 46 | Fiche d'en-tête : valeurs initiales et cases | v1 : « Devis avec subdivisons » figée hors création ; création avec subdivisions dans une affaire sans ouvrages → message ; DeltaSub : N° de version = nombre de devis + 1, subdivisions décochées, TVA toujours modifiable | Nouveau : N° de version **1**, Brouillon, date du jour, TVA séparée cochée, subdivisions **cochée et active ssi l'affaire a des ouvrages** (grisée sinon : le cas « affaire sans ouvrages » ne peut pas se produire) ; édition : subdivisions grisée, TVA grisée **si déjà séparée** ; Dupliquer : les deux cases grisées, subdivisions = « l'affaire a des ouvrages » (défaut) | [P] `db.CostEstimateDocument.<init>@0-50` (`State.draft`, `versionNumber` 1, `isVatSepareted` 1, `isApplySubProjects` 1) ; `CostEstimateDocumentDialog.<init>@524-619` ; `duplicateCostEstimateDocument` (dialogue construit en mode création, puis `setEnabled(false)`) ; `jOkButtonActionPerformed` (recopie des deux cases) ; données : 5901 et 6501 |

### 1.3 Revalidation de la version 3 (18 h 45)

| N° | Point | Constat | Preuve |
|---|---|---|---|
| 47 | Dépôt | HEAD `9c9a3f9`, `DeltaSub.html` 14 522 lignes md5 `b5db7920…`, `serveur_deltasub.py` md5 `20c0933d…` : **inchangés depuis 13 h 33** ; 0 nom `ch01a*` ni `ch02*` dans `DeltaSub.html` (aucun lot de CH-01 ni de CH-02 intégré) | [P] `git log`, `md5`, `grep -c` à 18 h 39 ; `rech_exist` § 0.4 (ancres du § 9 toutes à 1, moteur 130/130, base de test identique) |
| 48 | Compte des lignes « Arrondi » finales | `rech_orig` v2 § 2.9 : 717 / 751 ; ce cahier : 719 / 753 ; **719 / 753 (34 à 0,05 près)** fait foi : mesuré par le contrôle T10 de `ch/CH-02/lot1_test.js` sur les données du bureau ; l'écart de `rech_orig` vient du décompte des lignes finales (753 = lignes « Arrondi » en dernière ligne de partie, chiffre que `rech_orig` donne lui-même) | [P] `lot1_test.js` l. 144 (`n===753&&same===719&&near===34`), `lot1/integration_relecture2.md` |
| 49 | Socle CH-01 lot 1 | `ch/CH-01/lot1.js` écrit (finalisation en cours, `ch/CH-01/lot1fin/`), **non intégré** ; le lot 3 garde la règle du § 10 : `ch01a*` seulement si présents dans le `DeltaSub.html` source au moment du build (le `build.py` du lot 3 le teste), sinon `svDpFind` / `svDpHTML` sans les modifier | [P] `grep -c ch01a DeltaSub.html` = 0 |
| 50 | Chevauchements | CH-10 lot 3 remplace `async function dvOpen(id){…}` en gardant ce début (repère de fin de L1 du lot 4) ; CH-03 lot 1, CH-11 lot 3 et le lot 4 ajoutent chacun une ligne `PROTECTED \|= {…}` après la même ancre serveur ; le lot 3 et CH-01 ajoutent chacun une ligne `PROTECTED_IF_EDITED \|= {…}` ; aucun autre chantier ne déclare ni n'appelle de nom `ch02*` ; **compatibles** à condition que chaque intégration laisse l'ancre intacte (insertion après, jamais remplacement) | [P] `ch/CH-02/exist2/chevauch.py` (18 h 35) |
| 51 | D12 | `rech_exist` § 5 n° 9 : « arrêtée » sans trace dans l'inventaire § 15 ; la consigne de la tâche fixe D12 **par défaut** (pas de reprise) ; les paramètres de l'historique DeltaSub (5 versions, 10 minutes) restent soumis à Paulo (§ 11 n° 1) | consigne du chantier |

---

## 2. Périmètre

### 2.1 Reproduit (fidèle)

- **Fenêtre du devis** : barre de menus Fichier / Edition / Paramètres, barre d'outils (crayon ▾, position ▾, « − », entonnoir ▾, Présentation ▾, clé ▾, Documents ▾, roue ▾), menu contextuel, touches Suppr et Retour arrière, totaux selon la séparation de la TVA, 5 modes de présentation.
- **Commandes d'édition** : Indexer la position (+ sub.), Modifier la TVA, Modifier le montant soumis, Mettre tous les montants à zéro, statut « non définitif », Supprimer la position, Supprimer les ouvrages à 0.
- **Fenêtre Calcul** : roue (Copier le calcul, Coller le calcul, Navigateur, Arrondi), Fixer le coût, Calcul définitif, déplacements ⤒ ↑ ↓ ⤓, message du coût fixé, **quantité de formule à 3 décimales**.
- **Filtre** : menu entonnoir, fenêtre « Filtre » avec favoris, étiquette de filtre, message « mode filtre » à l'ouverture d'un document.
- **Paramètres du devis** (clé ▾) : 4 catégories, recalcul des lignes quand « Arrondi » change.
- **Ancien document** : menu Documents ▾, présentations enregistrées (ajouter, renommer, supprimer, importer), aperçu avec sauts de page, « Paramètres » de la présentation (7 catégories), « Honoraires » (aperçu et réglages), « Feuille de position ».
- **Nouveau format** : panneau Documents (Devis général, Honoraires, Devis descriptif), document `.dpdoc` propre à chaque devis, 25 options d'affichage par devis, arrondis à 10, 100 ou 1000 ; reprise des 59 documents du bureau.
- **Exports** : « Exporter le devis » (RTF ou FastTrack), « Exporter le descriptif » (RTF).
- **Liste et domaine** : « Mes devis » (par utilisateur), domaine « Devis général » de l'affaire, fiche d'en-tête 16.05, Dupliquer, corbeille, Importer un devis CFC d'une affaire, Dupliquer et modifier la subdivision.
- **Navigateur de positions** et **historique** (« À la dernière version »).

### 2.2 Choix DeltaSub

- Historique propre (5 versions, cadence de 10 minutes, choix de la version et confirmation) (§ 4.19).
- Documents `.dpdoc` de chaque devis dans la collection `costestimatedpdoc` ; « Effacer le document » vide le document sans supprimer l'enregistrement (protection à la reprise, comme `cocodoc` de CH-01).
- Détection des conflits par version lue (`bseq`) ; le verrou d'ouverture (« Document verrouillé ») est l'affaire de CH-10 lot 3.
- Les bascules de session actuelles de DeltaSub (« Afficher les subdivisions » en colonnes par ouvrage, « Afficher les positions sans montant », « Seulement positions de 1 à 3 chiffres ») restent sous les 5 modes (E4).
- Aperçu de l'ancien document dans un dialogue DeltaSub ; impression par le navigateur (`iframe`, `contentWindow.print()`), qui propose aussi « Enregistrer au format PDF ».

### 2.3 Hors périmètre ou non livré

Voir le § 10, « Non livré » : `.deltakv`, PDF enregistrés (CH-03), éditeur de document (CH-14), texte riche du descriptif, préférences de l'utilisateur pour les nouveaux devis (CH-08), reprise de l'historique Deltaproject (D12), verrou d'ouverture (CH-10).

### 2.4 Place et accès

- **Bâtiment ▸ « Mes devis »** (libellé actuel « Devis », ancre A2) : liste des devis de l'utilisateur (lot 4 ; décision n° 3 du § 11).
- **Affaire ▸ domaine « Devis général »** : liste des devis de l'affaire (lot 4 ; remplace le lien actuel, ancre A1).
- **Fenêtre du devis** : `dvEditor` (lot 1), ouverte par double-clic, « Ouvrir … » ou le menu contextuel de la liste ; `dvOpen` reste le point d'entrée (CH-10 y pose le verrou).

---

## 3. Modèle de données

### 3.1 Collections

| Collection | État | Contenu | Écrite par |
|---|---|---|---|
| `costestimatedocument` | existante | en-tête Derby (`ID, PROJECT_ID, VERSION, VERSIONNUMBER, STATECODE, CHANGEDDATE, USERID, NOTE, ISVATSEPARETED, ISAPPLYSUBPROJECTS, ISMARKEDASDELETED, DOCUMENTLOCK_ID`) | lot 4 (fiche, Dupliquer, corbeille, import, `ISAPPLYSUBPROJECTS` remis à 0 à l'ouverture depuis la liste, arbitrage n° 7). **Plus aucune écriture à l'enregistrement du contenu** (lot 1, n° 29) |
| `costestimate` | existante, `HEAVY` | contenu du devis, schéma spec_4 § 9 (id = `DOCUMENT_ID`) | lots 1 à 4 |
| `projectcatalogpos` | existante, `HEAVY` | positions du plan comptable de l'affaire (`CODE, TEXT1, TEXT2, PROJECTCATALOG_ID`) | lot 4 (import d'une affaire) |
| **`costestimatedpdoc`** | **nouvelle** (lot 3), ajoutée à `HEAVY` au chargement | document `.dpdoc` d'un devis ; id **`<DOCUMENT_ID>/<genre>`**, genre ∈ `estimate`, `honorar`, `desc` ; `val = {ID, DOCUMENT_ID, PROJECT_ID, genre, doc, source?}` ; `doc = {nom, type, jeu, fichier, templateDesc, report, creeLe, creePar, modifieLe?, modifiePar?}` ou `null` (document effacé) ; `report` = `report.json` du `.dpdoc` (mise en page, sans données) ; `source = {fichier, date}` pour les documents repris | lot 3 (création à la 1ʳᵉ ouverture, « Modifier les textes… », effacement), convertisseur de reprise |
| **`costestimatehist`** | **nouvelle** (lot 4), ajoutée à `HEAVY` au chargement | une version du contenu ; id **`<DOCUMENT_ID>/<AAAAMMJJ-HHMMSS>`** ; `val = {DOCUMENT_ID, PROJECT_ID, date (ISO), USERID, contenu}` où `contenu` = `costestimate` sans le champ `historique` | lot 4 |

La structure `doc` est celle de `cocodoc` (CH-01) : `ch01aTexts(rec, apres, save)` s'applique tel quel avec un `save` propre au devis [C].

### 3.2 Champs de `costestimate` lus ou ajoutés

| Champ | État | Règle | Lot |
|---|---|---|---|
| `reglages.affichage.displayMode` | existant (0 : 123 devis, 2 : 2, 3 : 3, 4 : 2) | mode de présentation 0 à 4, **enregistré par devis** (`Estimate.displayMode`) | 1 |
| `positions[].parts[].lignes[].qte` | existant | quantité ; issue d'une formule : **arrondie à 3 décimales** (n° 28) | 1 |
| `filtres[]` `{nom, favori, ouvrages[{ouv, actif, facteur, lg?}], cfcDe, cfcA}` | existant (25 favoris dans 7 devis) | favoris ; `cfcDe`/`cfcA` conservés, jamais lus | 1 |
| `parts[].fixe` `{ttc, tva}` \| `null` ; `parts[].definitif` | existants (0 et 8 au bureau) | Fixer le coût ; Calcul définitif | 1 |
| `reglages.arrondi5ct`, `pourcentageSur`, `marge`, `indice`, `etatProjet`, `etatPlanification` | existants | fenêtre « Paramètres » | 1 |
| `reglages.titres.{garde, unChiffre, deuxChiffres, document, descriptif}` | existants (130 devis) | 4 titres éditables (catégorie « Titres ») ; `descriptif` conservé, non éditable (panneau mort de l'original) ; vide = « Devis général » à l'affichage | 1 |
| `reglages.textesLibres[0..4]` | existant (2 devis non vides) | catégorie « Commentaire » ; `[0]` en zone de texte multiligne | 1 |
| **`reglages.date`** | **nouveau** | date du devis (`Estimate.date`), ISO `AAAA-MM-JJ` ; absente → `source.date` convertie (« Tue Sep 06 00:00:00 CEST 2022 » → `2022-09-06`), sinon `CHANGEDDATE` de l'en-tête [C] | 1 (écrit), 2 et 3 (lu) |
| `presentations[]` `{nom, favori, options, sautsDePage[{cfc, niveau}]}` | existant (251 ; `niveau` ∈ `tous`, `2`, `1`) | présentations de l'ancien document ; `options` = les 77 clés de `Display` | 2 |
| `reglages.impressionHonoraires` | existant (25 clés) | réglages de l'ancien « Honoraires » (`HonorarDisplaySettings`), sauts compris (`pageBreakList`) | 2 |
| `reglages.impressionDescriptif` | existant (11 clés) | réglages de l'ancien descriptif (code mort) : conservés, copiés par « Importer les présentations », jamais affichés | 2 |
| **`reglages.optionsDocuments`** | **nouveau** | les 25 options du panneau Documents (§ 4.14), `{clé: booléen}` ; clé absente = défaut | 3 |
| **`historique[]`** `{id, date, USERID}` | **nouveau** | index des versions de `costestimatehist` (5 au plus, de la plus ancienne à la plus récente) | 4 |

**Valeurs par défaut de `Display`** [P `ce.data.Display.<init>`] (présentation créée par Documents ▾ sur une liste vide, par un nouveau devis ou par un import) : `version` 2 ; vrais : `displayPosOptions`, `displayDeviation`, `includeDescCover`, `includeDescDoc`, `detailItalic`, `titlePosBold`, `standard`, `displayDetailOptions`, `includeKvCover`, `includeDocument`, `dispalyEmptyPositions`, `dispalyRound1000`, `displayValuesPositions`, `displayNoTitlePositions` ; tailles `detailFontSize` 8, `titleFontSize` 9, `posFontSize` 9, `rowHeigth` 15, `oneDigitThickness` 1, `twoDigitThickness` 1 ; `templateId` 0 ; couleurs 0 ; toutes les chaînes vides (polices et titres de colonnes : défauts de `Strings.db` au rendu) ; tout le reste faux ou 0. **`HonorarDisplaySettings`** [P `<init>`] : `includeDescCover` vrai, `displayOptions` vrai, `displayGeneratedPositions` faux, `rowHeigth` 14, `titleFontSize` 9, `fontSize` 9, `dispalyAfterComma` vrai, `zebra` faux, `dispalyRound1000` vrai, `specialRound` faux, `displayEmptyPositions` vrai, `templateId` 0, chaînes vides ; `Init.initDocument` y recopie ensuite les polices et tailles de la présentation « Standard ».

**Règle** : toute copie de contenu (Dupliquer, Dupliquer et modifier, Importer d'une affaire, version d'historique) **retire `historique`** ; toute restauration **conserve** l'`historique` courant.

### 3.3 Écritures groupées et concurrence

- **Un seul `DS.commit` par action** : contenu (+ version d'historique éventuelle, lot 4) ; ou en-tête + contenu (+ documents, lot 3 ; + positions du plan comptable, lot 4).
- **Enregistrement du contenu** (lot 1, déjà construit, modifié par le complément C3) : opération `costestimate` avec `bseq: X.seq` (version lue à l'ouverture, remise à jour après chaque succès et à chaque rechargement) ; **aucune opération sur l'en-tête** (n° 29) ; file d'enregistrement chaînée (`X.q`) ; conflit 409 : toast de `DS.commit`, rechargement de `E`, `dirty` = faux, redessin.
- **Dialogues** (fiche, présentations, corbeille, documents) : `bseq` lus **à l'ouverture** du dialogue (`ctBseq(t, id)` ou `DS.S[t][id]`).
- **Identifiants** : `DS.newIds('costestimatedocument')` et `DS.newIds('projectcatalogpos', n)` une fois par action (jamais avec `n = 0`) ; aucun `DS.newIds` pour `costestimatedpdoc` et `costestimatehist` (identifiants composés).
- **Suppression d'une version d'historique** : `{t:'costestimatehist', id, val:null, bseq: X.seq}` dans le commit du contenu (n° 42).

### 3.4 Arrondis

Notations : q = quantité (1 si la ligne n'a ni formule ni quantité : forfait, comme `dvLine`), p = prix HT, t = taux de TVA, R = `reglages.arrondi5ct`.

| Fonction | Règle | Preuve |
|---|---|---|
| `ch02aR(x, arr)` | = `ecR(x, arr)` : `signe × arrondi(|x| × 20) / 20` si `arr`, sinon au centime, symétrique ; −0 → 0 | [P] `Formatter.round@0-78` |
| Quantité d'une formule | `Math.round(calcul × 1000) / 1000` | [P] `Ausmass.roundAusmass@0-13` |
| TTC d'une ligne recalculée | `ch02aR(q × p × (1 + t/100), R)` (centime si R faux : [C] E1) | [P] `calcOnePosition` |
| Prix indexé | `ch02aR(p × f, R)` | [P] `indexOnePosition@0-60` |
| HT et TVA affichés d'une ligne | inchangés : HT = `dvLine(l).ht`, TVA = TTC − HT | spec_4 § 9.3 |

### 3.5 Serveur, chaîne d'import et `HEAVY`

- **Serveur** (copie modifiée complète + diff à chaque lot concerné ; une **ligne ajoutée** après une ligne existante, qui reste intacte) :
  - S1 (lot 3) : après `PROTECTED_IF_EDITED |= {"statisticalvalue", …, "ebkptobkp"}` : `PROTECTED_IF_EDITED |= {"costestimatedpdoc"}   # CH-02 lot 3 : documents .dpdoc des devis`. Un document modifié ou créé dans DeltaSub (auteur ≠ `import Deltaproject`, `doc` à `null` compris) est gardé à la reprise ; un document encore tel qu'importé est remplacé par sa nouvelle conversion. CH-01, CH-08 et CH-10 ajoutent eux aussi une ligne après la même ancre : compatibles.
  - S2 (lot 4) : après `             "projecttenderer", "devisdocument", "soumission", "soumissiondoc", "soumissionhist"}` : `PROTECTED |= {"costestimatehist"}   # CH-02 lot 4 : historique des devis`. CH-11 ajoute aussi une ligne après cette ancre : compatible.
- **`HEAVY`** (ligne partagée, l. 161) **n'est pas modifiée** : `const CH02C_HEAVY=HEAVY.push('costestimatedpdoc');` (lot 3) et `const CH02D_HEAVY=HEAVY.push('costestimatehist');` (lot 4) s'exécutent au chargement du script, **avant** `DS.boot()` (bloc inséré avant `DÉMARRAGE`) ; déclarations sans accès au DOM ; `build.py` vérifie que `const HEAVY=` précède le point d'insertion. Chargement par `DS.need([...])` avant usage (une collection vide est gérée : `DS.need` la marque chargée).
- **Chaîne d'import** (lot 3) : nouveau `outils_deltaproject/convertir_docs_devis.py` (fichier livré à ajouter au dépôt) et une **ligne ajoutée** à `extraire.sh` (copie modifiée complète + diff), après la ligne `python3 $HERE/convertir_devis.py … APP.COSTESTIMATEDOCUMENT.csv` : `[ -f $HERE/convertir_docs_devis.py ] && python3 $HERE/convertir_docs_devis.py "$FILES" $OUT/documents/costestimatedpdoc.json --entetes $OUT/tables/APP.COSTESTIMATEDOCUMENT.csv`. Le serveur importe déjà tout `documents/*.json` de forme `{"<collection>": {"<id>": {...}}}` : **aucune autre modification**.

---

## 4. Écrans et dialogues

Les § 4.1 à 4.5 décrivent le lot 1 **tel qu'il est construit** (`ch/CH-02/lot1/ch02a.js`, relu contradictoirement le 30.09 ; ses écarts propres sont au § 6 de `lot1_integration.md` et repris au § 7). Le § 4.6 et les mentions « **complément** » sont à ajouter au lot 1.

### 4.1 Fenêtre du devis (lot 1)

**Titre** : « Devis général  <n° affaire> — <version> » (DeltaSub, inchangé).

**Barre de menus** (boutons texte à menu, dans l'ordre) [P `KvDialog.initComponents@3713-4189`, `<init>@1114-1393`] :

| Menu | Entrées, dans l'ordre | Règles |
|---|---|---|
| **Fichier** | « Fermer … » | Retour à la liste d'origine (`DV.back` posé par le lot 4, sinon la liste du module). « Enregistrer » est **masqué**, comme dans l'original quand la sauvegarde automatique est active : DeltaSub enregistre en continu (E3) |
| **Edition** | « Indexer la position … » · « Modifier la TVA … » · « Modifier le montant soumis … » · « Mettre tous les montants à zéro … » · « Attribuer le statut "non définitif" à toutes les positions … » · séparateur · « Supprimer les ouvrages à 0 … » · [« À la dernière version » : seulement après **Maj + clic** sur « Edition » (lot 4)] | « Indexer … » actif si une position est choisie ; « Modifier la TVA … » actif si l'en-tête sépare la TVA ; les autres toujours actifs ; guillemets **droits** |
| **Paramètres** | « Paramètres … » (grisé : préférences de l'utilisateur, CH-08) · « Importer les présentations … » (lot 2) | |

Points de suspension : **espace + « … »** (U+2026) [P `rsrc.Strings.addEllipsis@10`].

**Barre d'outils** (dans l'ordre) : crayon ▾ (« Editer la position … », actif pour une position **saisie** ; « Informations pour le devis … » = `dvIntro` inchangé) · position ▾ (« Supprimer la position … », « Indexer la position … », [« Modifier la TVA … » si la TVA est séparée]) · « − » · entonnoir ▾ (grisé sans ouvrages) · Présentation ▾ · clé ▾ (« Paramètres … » → **§ 4.6, complément**) · Documents ▾ (lot 2 ; en attendant, les entrées actuelles `dvPrint`) · roue ▾ (« Exporter le devis … », « Exporter le descriptif … » (lot 2) · séparateur · « Copier le contenu du tableau dans le presse-papier » · « Exporter le tableau dans un fichier CSV … » · « Exporter le devis (CSV) » (ajout DeltaSub `dvCsv`, E12) · séparateur · case « Afficher les documents » (lot 3)) · totaux à droite (TVA séparée : « Total TTC », « Total HT », « Honoraires HT » ; sinon « Total TTC », « Honoraires HT » ; filtre compris). Position ▾ et « − » actifs selon la sélection ; Documents ▾ et roue ▾ actifs si le tableau a des lignes [P `checkGuards`].

Une entrée d'un lot non intégré est **grisée** avec la mention « (lot n) » (`ch02aExt`).

**Menu contextuel** du tableau : « Editer la position … » · « Supprimer la position … » · « Indexer la position … » · [« Modifier la TVA » (sans « … »)] [P `createKvTablePopup@1-224`]. **Clavier** : Suppr ou Retour arrière = Supprimer la position. **Étiquette de filtre** au-dessus du tableau (nom du favori marqué quand un filtre est appliqué). **Droits** : `ch02aCanEdit(doc)` (toujours vrai au bureau).

**Compléments du lot 1** :
- C4 : à la fin de `ch02aMount(X)`, `if(typeof globalThis.ch02cMount==='function') globalThis.ch02cMount(X);` (le lot 3 affiche le panneau Documents à l'ouverture, n° 45).
- C2 : clé ▾ « Paramètres … » appelle `ch02aSettings(X)` (§ 4.6) au lieu de `X.dvSettings()` ; `dvSettings` reste dans le fichier, inutilisé.

### 4.2 Modes de présentation (écran) (lot 1)

« Présentation ▾ » : 5 boutons radio [P `initDisplayPopup`] : « Standard » (0) · « Avec colonnes honoraires » (2 : + « % soumis », « Montant soumis », « Définitif ») · « Toutes les colonnes » (1 : + « Commentaire », « Descriptif ») · « Toutes les colonnes avec le calcul de prix » (3 : comme 1, plus les lignes de calcul sous chaque partie) · « Avec le descriptif » (4 : « Descriptif » seul : écran du **Devis descriptif**). Le choix est enregistré dans `reglages.affichage.displayMode` (sans contrôle des droits) et appliqué à l'ouverture. Sous un séparateur, les 3 bascules de session de DeltaSub (E4). Valeurs par position quand le devis a plusieurs parties : agrégées (E5).

### 4.3 Commandes d'édition (lot 1)

Règles détaillées : version 1, § 4.3 (inchangées) et arbitrages n° 1, 2, 8 à 11.
- **Indexer la position (+ sub.)** : « Indexer cette position + sub. », « Facteur », prérempli « 1.0 », « (p.ex. 1.05) » ; saisie illisible ou 0 : rien, sans message ; portée : positions non générées dont le numéro **commence par** le numéro choisi ; prix indexé `ch02aR(p × f, R)` puis TTC recalculé (un TTC saisi est perdu, fidèle).
- **Modifier la TVA** : « Modifier le taux de TVA », « TVA », prérempli « 1.0 », « [p.ex. 8.0] » ; saisie illisible : fermeture sans effet ; tout le devis ; lignes à 0 % comprises (§ 11, n° 6).
- **Modifier le montant soumis** : « Soumis aux honoraire » (sic), « Soumis aux honoraires », champ vide, « [p.ex. 100.0] » ; saisie illisible **refusée** (E6) ; `honorPct` = valeur pour toutes les parties.
- **Mettre tous les montants à zéro** (déplacé dans Edition) : `msg14a` ⏎ `msg14b` ; prix et TTC à 0, `fixe` = `null`, `honorPct` inchangé.
- **Statut « non définitif »** : aucun dialogue, `definitif` = faux partout.
- **Supprimer la position** : `msg1` / `msg2` ; règle du point ; nettoyage des ancêtres générés vides.
- **Supprimer les ouvrages à 0** : `msg10` ; retrait par partie ; dédoublonnage ; un code ne quitte `E.ouvrages` que si des parties viennent d'être retirées et qu'il n'en reste aucune.

### 4.4 Fenêtre « Calcul pour … » (lot 1)

`ch02aCalc(X)` reprend la fenêtre actuelle et ajoute : barre des lignes « + » (insère après la ligne choisie) · « − » · ⤒ « Déplacer au début » · ↑ · ↓ · ⤓ « Déplacer à la fin » ; « Total TTC » de la **partie affichée** (lignes non Var ; « Total HT » si la TVA est séparée) et « Total fixé TTC » ; case « Calcul définitif » ; ▾ « Fixer le coût … » (dialogue « Fixer le coût » : « Total TTC », « TVA » « [p.e. 7.7] », « Total HT » calculé ; 0 retire le coût fixé) ; message du coût fixé à l'ajout ou au retrait d'une ligne (`KvCalcDialog/msg8a` ⏎ `msg8b`, « Supprimer » / « Laisser tel quel ») ; roue ▾ : « Copier le calcul » · « Coller le calcul » (`msg167a` ⏎ `msg167b`, « Remplacer » / « Compléter ») · séparateur · « Navigateur … » (lot 4) · « Arrondi … » (dialogue « Arrondir », « Montant » ; ligne « Arrondi » ajoutée en fin, algorithme `doRound@37-652`) · séparateur · « Copier le contenu du tableau dans le presse-papier » · « Exporter le tableau dans un fichier CSV … ».

**Complément C1 — quantité d'une formule** [P n° 28] : partout où le lot 1 affecte `l.qte` à partir de `evalQ(formule)` (validation de la cellule « Calcul de quantités », collage d'un calcul, retour du navigateur), la valeur enregistrée est `Math.round(q × 1000) / 1000`, puis `ttc = ch02aLineTTC(l, R)`. L'affichage reste `num(q, 3)`. Une formule illisible garde le message `KvCalcDialog/msg4` existant.

### 4.5 Filtre et favoris (lot 1)

- **Moteur** (ancre A11) : filtre absent ou vide → 1 ; partie sans ouvrage → 1 ; partie trouvée et cochée → son facteur (vide ou illisible = 1, **0 = 0**) ; trouvée et décochée → 0 ; **absente → 0**.
- **Entonnoir ▾** : « Editer le filtre … » · « Désactiver le filtre » · séparateur · une case par ouvrage (`CODE` ou `CODE | LOC`, espaces ordinaires), qui filtre sur ce seul ouvrage.
- **Fenêtre « Filtre »** : tableau « Ouvrage » | « Localisation » | « Facteur » | « M » ; tableau « Favori » ; « + » « Ajouter aux favoris », crayon « Editer les favoris », « − » « Retirer de la liste des favoris » (« Voulez-vous effacer cette inscription? ») ; case « Appliquer le filtre » ; boutons OK / « Fermer ». « Nouveau favori » / « Editer le favori » : « Désignation » ; doublon : « Cette désignation existe déjà. » (titre « Erreur »).
- Le filtre actif n'est pas enregistré ; `ch02aFilterMsg(X)` affiche « Attention, vous travaillez en mode filtre. » avant l'ouverture d'un document (lots 2 et 3).

### 4.6 Fenêtre « Paramètres » du devis (clé ▾) — complément C2 du lot 1

Remplace `dvSettings` [P `ce.KvPreferencesDialog`, n° 30 et 31]. Dialogue « Paramètres », liste « Catégorie » à gauche (clic : la carte de droite change), OK / Annuler, sans garde.

| Catégorie | Contrôles, dans l'ordre | Champ DeltaSub |
|---|---|---|
| « Information » | « Etat de planification » · « Etat du projet » · « Marge d'approximation du DG » (liste de propositions ±10 % à ±25 %, comme aujourd'hui) · « Indice » · « Date » (champ date) | `reglages.etatPlanification`, `etatProjet`, `marge`, `indice`, **`date`** |
| « Affichage » | boutons radio « Pourcentage sur le total général » / « Pourcentage sur le groupe principal » · case « Arrondi » | `pourcentageSur` (`total` / `groupe`), `arrondi5ct` |
| « Commentaire » (si `isModuleFormVisible`) | « Texte libre 1 » (zone multiligne) · « Texte libre 2 » à « Texte libre 5 » (champs) | `textesLibres[0..4]` |
| « Titres » (si `isModuleFormVisible`) | « Page de garde » · « Devis à 1 chiffre » · « Devis à 2 chiffres » · « Document principal » ; un titre vide s'affiche « Devis général » | `titres.garde`, `unChiffre`, `deuxChiffres`, `document` |

- `isModuleFormVisible` : réglage `setting` de nom `isModuleFormVisible` (801 = `[YES]` au bureau) ; absent = vrai.
- **OK** : droits (`ch02aCanEdit`) ; recopie des champs ; **si « Arrondi » a changé**, pour chaque position non générée, chaque ligne de chaque partie (Var comprises) : `ttc = ch02aLineTTC(l, R nouveau)` (les TTC saisis sont perdus, fidèle) ; puis redessin et un enregistrement.

### 4.7 Menu Documents ▾, présentations enregistrées (lot 2)

`ch02bDocMenu(X)` renvoie les entrées [P n° 32, 33 ; `KvDialog.initDocumentPopup@12-694`] :
1. une entrée « Document <nom> … » par présentation, dans l'ordre ; elle marque la présentation comme **seule favorite** (enregistrement) puis ouvre l'**aperçu** (§ 4.8) ; au retour de l'aperçu, les réglages modifiés par le pinceau sont déjà enregistrés dans la favorite ;
2. **liste vide** : une présentation `{nom:'', favori:true, options: <défauts Display>, sautsDePage:[]}` est ajoutée au devis (enregistrement) et proposée « Document  … » ;
3. séparateur **si la liste a plus d'une présentation** ;
4. « Ajouter une présentation par défaut » · « Renommer la présentation … » · [« Supprimer la présentation », s'il y en a plus d'une] ;
5. séparateur · « Honoraires … » (§ 4.11) · « Feuille de position … » (§ 4.10 ; active si une ligne est choisie).

Si `isModuleFormVisible` est faux, le bouton Documents ▾ est masqué [P `<init>`].

**Ajouter une présentation par défaut** [P `addSettings@11-141`] : copie de la **première** présentation (sauts compris) ; dialogue « Nouvelle inscription », « Nom » ; nom vide : OK grisé ; nom existant : « Ce nom est déjà utilisé. » ; la copie devient la seule favorite et s'ajoute en fin de liste ; un enregistrement.

**Renommer / Supprimer** [P `ce.FavoriteNameDialog`] : titres « Renommer la présentation » / « Supprimer la présentation » ; tableau « Présentation » ; bouton « Renommer » / « Supprimer » actif si une ligne est choisie ; renommer → dialogue « Edition », « Nom », même contrôle de doublon ; supprimer → « Voulez-vous vraiment supprimer la présentation ^0 ? » (Avertissement, Oui/Non), puis la première devient favorite. **La présentation n° 0 est protégée** : « Cette inscription ne peut pas être effacée. » (Erreur) et rien n'est supprimé [C, E14 : le bytecode la retire quand même].

### 4.8 Aperçu de l'ancien document et sauts de page (lot 2)

`ch02bPreview(X, pres, o)` [C, E8 : dialogue DeltaSub] [P `KvListDisplayDialog`] :
- titre « Devis général » ; barre : première / précédente / « n / N » / suivante / dernière page, zoom, **pinceau** (« Paramètres », § 4.9, sur la présentation favorite), « Imprimer » (toutes les pages dans un `iframe` : `contentWindow.print()`), « Fermer » ;
- corps : pages rendues par le moteur du § 5.1, chacune sur sa page de modèle (`tplPageHTML`, non modifié) ;
- **saut de page** : un clic sur la cellule N° d'une ligne ouvre un menu à entrée unique, « Insérer un saut de page » ou « Supprimer le saut de page » selon qu'un saut existe déjà pour ce numéro (égalité exacte) **et ce type de page** ; type : récapitulatif à 1 chiffre → `niveau:'1'`, à 2 chiffres → `'2'`, document principal → `'tous'` ; stocké dans `sautsDePage` de la **présentation favorite** (un enregistrement), puis rendu refait et retour à la page courante [P `showPageBreak`, `handlePageBreak@1-557`, `KvBook$Page.pageDigit`] ;
- avant l'ouverture : `ch02aFilterMsg(X)` (mode filtre) ; le filtre actif s'applique au document ;
- modèle introuvable : « Impossible de trouver le modèle ^0. » (Erreur, ^0 = nom) et pas d'aperçu ; page `page1` ou `pageN` sans tableau `constructionEstimateTable` : « Le modèle de première page ne contient pas de champ de liste. » / « Le modèle de page suivante ne contient pas de champ de liste. » (Erreur).

### 4.9 « Paramètres » d'une présentation (pinceau de l'aperçu) (lot 2)

`ch02bPresPrefs(X, pres)` [P `ce.KvDisplayPrefsDialog`, rech_orig v2 § 3.5] : titre « Paramètres » ; tableau « Catégorie » ; OK / Annuler ; OK recopie tous les contrôles dans `options` de la présentation et enregistre (titres vides remis à leur défaut). Catégories et contrôles, dans l'ordre (entre parenthèses : clé d'`options`) :
- **« Document »** : en-tête de colonne « Pages vides » ; « Page de garde » (`includeKvCover`) + nombre (`coverKvEmptyPages`) ; « Informations » (`includeKvInformation`) + nombre (`infoKvEmptyPages`) ; « Afficher les noms des ouvrages sous informations » (`displaySubprojectNames`) ; « Récapitulatif à 1 chiffre » (`includeKvOneDigit`) + nombre (`kvOneDigitEmptyPages`) ; « Récapitulatif à 2 chiffres » (`includeKvTwoDigit`) + nombre (`kvTwoDigitEmptyPages`) ; « Document principal » (`includeDocument`) ; « Modèle: » + champ non modifiable « <groupe> - <modèle> » + bouton de choix (`templateId` = `formtemplate.ID`, modèles `projectCostcontrolEstimate` de tous les groupes).
- **« Positions »** : « Seulement positions de 1 à 3 chiffres » (`onlyThreeDigits`) · « Base et commentaire de la position » (`displayComment`) · « Base et commentaire dans colonne séparée » (`commentInColumn`) · « Intégrer le descriptif » (`displayDescription`) · « Afficher les positions à exclure » (`displayPosOptions`) · « Pourcentages » (`displayDeviation`) · « Séparer la TVA » (`separateVat`) · « Ne pas afficher les décimales » (`dispalyAfterComma`) · « Ouvrage » (`displaySubprojects`) · « Assembler les descriptifs des ouvrages » (`compactDescription`) · « Afficher les positions sans montant » (`dispalyEmptyPositions`) · « Afficher les montants » (`displayValuesPositions`) · « Afficher les positions saisies et les totalisateurs » (`displayNoTitlePositions`).
- **« Calcul »** : « Bases de prix » (`displayPriceBase`) · « Montants détaillés » (`displayDetailValues`) · « Variantes » (`displayDetailOptions`) · « Commentaires et bases des prix » (`displayDetailComment`) · « Quantités, prix et montants » (`displayQuanPriceValue`) · « Calculs des quantités » (`dispalyCalcualtion`).
- **« Police »** : « Police des titres » + police + taille (`titleFontName`, `titleFontSize`) · « Police des positions » (`standardFontName`, `posFontSize`) · « Police des informations détaillées » (`detailFontName`, `detailFontSize`) · « Interligne » (`rowHeigth`).
- **« Présentation et style »** : « Titres en gras » (`titlePosBold`, sans effet au rendu, fidèle) · en-tête « Épaisseur » · « Trait sous les positions à 1 chiffre » (`underlineOneDigit`) + épaisseur (`oneDigitThickness`) + carré de couleur (`oneDigitColor_R/G/B`, sélecteur « Couleur ») · « Trait sous les positions à 2 chiffres » (idem `twoDigit…`) · « Décaler les montants » (`hierarchicalAdjust`) · boutons radio « Sans formatage de ligne » (`standard`) / « Fond alterné » (`zebra`) / « Détails en gris » (`grayDetails`).
- **« Titres de colonnes »** : « Titre: N° CFC » (`kagNumberColTitle`, défaut « CFC ») · « Titre: Texte CFC » (`kagTextColTitle`, « Texte ») · « Titre: Commentaire » (`commentColTitle`) · « Titre: Montants à 4 chiffres » … « Titre: Montants à 1 chiffre » (`value4…1ColTitle`, « à 4 chiffres » … « à 1 chiffre ») · « Titre: Montant » (`valueColTitle`, « Montant ») · « Titre: Ouvrage » (`subprojectColTitle`, « OUV ») · « Titre: Localisation » (`locationColTitle`, « Localisation ») · « Titre: Ecart » (`devColTitle`, « [%] ») · « Nom » (`infoNameColTitle`) · « Description » (`infoDescColTitle`).
- **« Arrondir »** : « Choix d'arrondis » ; case « Arrondir » (`specialRound`) ; boutons radio « Arrondir à 10 » / « Arrondir à 100 » / « Arrondir à 1000 » (`dispalyRound10/100/1000`).
- **Non affichés** (valeur conservée) : `detailItalic`, `lightHierarchicalAdjust`.
- **Règles d'activation** : « Base et commentaire dans colonne séparée » actif seulement si « Base et commentaire de la position » est coché (décocher l'une décoche l'autre) ; idem « Variantes » ← « Montants détaillés », « Calculs des quantités » ← « Quantités, prix et montants » ; décocher « Afficher les positions saisies et les totalisateurs » décoche « Seulement positions de 1 à 3 chiffres », cocher celle-ci coche celle-là.

### 4.10 Feuille de position (lot 2)

`ch02bPosSheet(X)` [P `KvDialog.openPosSheet@0-677`] : aperçu (§ 4.8) d'un devis temporaire ne contenant que la **position choisie** (copie), sans filtre, avec une **copie** de la présentation favorite **sans sauts** et 44 réglages forcés : `displaySubprojects` = « Devis avec subdivisons » de l'en-tête ; `onlyThreeDigits` faux ; `displayComment` vrai ; `displayDescription` vrai ; `displayPosOptions` vrai ; `displayDeviation` faux ; `detailItalic` faux ; traits 1 et 2 chiffres faux, couleurs noires ; `standard` vrai, `zebra` et `grayDetails` faux ; `displayPriceBase`, `displayDetailOptions`, `displayQuanPriceValue`, `displayDetailValues`, `displayDetailComment` vrais ; `includeKvCover` faux (pages vides 0) ; récapitulatifs faux ; `includeDocument` vrai ; **`separateVat` faux** (montants TTC) ; `hierarchicalAdjust` et `lightHierarchicalAdjust` faux ; `commentInColumn` faux ; `compactDescription` faux ; **`dispalyAfterComma` vrai** (décimales masquées) ; `dispalyEmptyPositions` vrai ; `dispalyCalcualtion` vrai ; `specialRound` faux ; `displayValuesPositions` vrai ; `displayNoTitlePositions` vrai. Les modifications faites par le pinceau dans cet aperçu ne sont **pas** enregistrées.

### 4.11 « Honoraires … », ancien document (lot 2)

`ch02bHonPreview(X)` [P `ce.list.KvHonorarDisplayDialog`, `KvHonorarDisplayPrefsDialog`, rech_orig v2 § 3.8] : aperçu du document des honoraires (§ 5.2), même barre que le § 4.8, sauts de page dans `reglages.impressionHonoraires.pageBreakList` (clic sur la cellule N°, un seul type de page). Pinceau → « Paramètres » : catégories « Document » (« Page de garde » `includeDescCover`, « Modèle: » `templateId`, modèles `projectCostcontrolFee`) · « Police » (« Police des titres » `titleTypeFace`/`titleFontSize`, « Police des positions » `typeFace`/`fontSize`, « Interligne » `rowHeigth`, « Fond alterné » `zebra`) · « Titres de colonnes » (« Titre: N° CFC », « Titre: Texte CFC », « Titre: Montant », « Titre: Ouvrage », « Titre: Localisation », « Honoraires : % soumis/DG » `honorProcColTitle`, « Honoraires : montant soumis » `honorValueColTitle`) · « Arrondir » (« Choix d'arrondis », « Arrondir » `specialRound`, « Arrondir à 10 / 100 / 1000 ») · « Présentation et style » (« Afficher toutes les positions y compris les non soumises aux honoraires. » `displayEmptyPositions`). OK enregistre `reglages.impressionHonoraires`.

### 4.12 « Importer les présentations … » (lot 2)

`ch02bImportPres(X)` (menu Paramètres) [P n° 34] : droits ; « Choix du devis » (`ch02aPickEstimate({exclude: devis courant})`) ; « Voulez-vous remplacer tous les paramètres? » (Avertissement, Oui/Non) ; copie depuis le devis choisi : `presentations` (clone profond, sauts compris), `remarques`, `reglages.arrondi5ct`, `pourcentageSur`, `marge`, `titres` (5), `affichage` (dont `displayMode`), `impressionDescriptif`, `impressionHonoraires` ; **ne copie pas** : `textesLibres`, `indice`, `etatProjet`, `etatPlanification`, `date`, l'en-tête ; **aucun recalcul des lignes** ; un enregistrement ; redessin complet (l'original ferme et rouvre la fenêtre).

### 4.13 Exports (lot 2)

**« Exporter le devis … »** → `ch02bExport(X)`, fenêtre « Exporter » [P `ce.ExportDialog`] : boutons radio « Exporter le devis général » (par défaut) / « Exporter vers FastTrack » ; cases « Inclure le commentaire », « Inclure le calcul », « Inclure le descriptif », actives seulement pour le devis général ; OK → téléchargement (les champs « Fichier » et « Choix du fichier » sont remplacés par le téléchargement du navigateur, E9).
- **Devis général → `.rtf`** [P `externalize@0-735`, `getCalcLine@0-119`] : toutes les positions (générées comprises), sans filtre ; ligne « <n°>␠<texte> » + tabulation + montant TTC `formatCurrency` (arrondi à 0,05, apostrophes), en **gras** ; lignes de calcul (option) : « ␠<commentaire>␠<formule>␠<quantité> » puis « ␠<taux>␠<montant> » si l'en-tête sépare la TVA, sinon « ␠<montant> » (ligne Var : montant entre parenthèses ; quantité et taux écrits comme des doubles Java : « 21.0 », « 8.1 ») ; position sans partie : commentaire puis descriptif (options) ; avec parties : pour chaque partie « <code>␠<loc> » (espaces finales retirées) + tabulation + montant, en gras, puis commentaire, lignes et descriptif. RTF simple (texte, `\b`, `\tab`, `\par`, caractères non ASCII en `\uN?`) [C, E9]. Nom : `Devis_<n° affaire>_<n° version>.rtf`.
- **FastTrack → `.txt`** [P `externalizeTermin@0-1348`, n° 38] : UTF-8, fins de ligne CR LF, 4 colonnes séparées par tabulation, toutes les positions, sans filtre. Une liste des parents déjà écrits et les dernières étiquettes « n° texte » vues aux niveaux 1, 2, 3 (mises à jour par **toute** position de ce niveau) ; seules les positions **saisies** produisent une ligne ; pour une position saisie de niveau n (longueur du n°, 4 et plus = 4) : pour chaque niveau parent k < n, préfixe = n° tronqué à k caractères ; s'il n'est pas dans la liste, il y est ajouté et l'étiquette du niveau k + tabulation est écrite, sinon une tabulation seule ; puis l'étiquette propre, suivie de 5 − n tabulations pour les niveaux 1 à 3 et d'aucune pour le niveau 4 (formes : `L1⇥⇥⇥⇥` · `[P1]⇥L2⇥⇥⇥` · `[P1]⇥[P2]⇥L3⇥⇥` · `[P1]⇥[P2]⇥[P3]⇥L4`) ; les niveaux 1 et 2 ajoutent **leur propre n°** à la liste, les niveaux 3 et 4 non. Nom : `Devis_<n° affaire>_<n° version>.txt` (l'original n'impose aucune extension).

**« Exporter le descriptif … »** → `ch02bExportDesc(X)`, fenêtre « Exporter » : case « Exporter les montants » [P `ce.ExportDescriptorDialog.externalize@0-441`] ; `.rtf` : pour **chaque** position, « <n°>␠<texte> » en gras (+ tabulation + montant si coché) ; sans partie : son descriptif s'il existe ; avec parties : pour chaque partie « <code>␠<loc> » en gras (+ montant), puis son descriptif. Nom : `Descriptif_<n° affaire>_<n° version>.rtf`.

### 4.14 Panneau Documents, nouveau format (lot 3)

À droite du tableau, **visible à l'ouverture** (`ch02cMount`, n° 45) et montré ou masqué par la case « Afficher les documents » de la roue (`ch02cToggleDocs`, état `X.docsOn`, conteneur `X.dpane` créé par R4) [P `initDocumentsTable`, `setDocumentTable`] :
- tableau : « Nom du document » | « Document disponible » (case) | [« PDF disponible » : seulement si l'API de CH-03 existe, `ch03aPdfDispo`] ; trois lignes fixes : « Devis général », « Honoraires », « Devis descriptif » ;
- bouton **« Nouveau » ▾** : « Ouvrir … » · [« Ouvrir PDF … », séparateur, « Créer un PDF comme jointe au document … » : API de CH-03, spec_17 § 3.5 ; grisées sinon] ;
- bouton **« Supprimer » ▾** : « Effacer le document » (si le document existe) · [« Effacer le PDF » : CH-03] ; « Effacer le document » : PDF existant → « Un fichier PDF existe déjà. » (Information) et arrêt ; sinon « Voulez-vous supprimer ce fichier définitivement ? » (Avertissement, Oui/Non) → `doc: null` (enregistrement gardé, § 2.2) ;
- bouton de **réglages** ▾ (cases, effet immédiat, un enregistrement par clic) [P `getDocumentPrererencesPopupMenu@1-1102`], ligne 0 = Devis général, 1 = Honoraires, 2 = Devis descriptif :
  1. « Afficher les subdivisions » (`displaySubprojects`, vrai) · « Seulement positions de 1 à 3 chiffres » (`displayOnlyThreeDigits`) · « Afficher les positions saisies et les totalisateurs » (`dispalySumedPositions`, vrai) ;
  2. lignes 0 et 1 : « Base et commentaire de la position » (`displayCommentToPositionColumn`) · « Base et commentaire dans colonne séparée » (`displayRemarkInCommentColumn`) ;
  3. ligne 0 : séparateur · « Uniquement les montants avec calculs et remarque » (`displayDetailRemarkAndPrices`) · « Tous les montants détaillés » (`displayDetailValues`) · séparateur · « Commentaire du calcul » (`displayCommentToCalculation`) · « Bases de prix » (`displayPriceBase`) · « Afficher le calcul » (`dispalyCalcualtion`) · « Quantités » (`displayQuantity`) · « Prix TTC » (`displayPriceInclusiveVat`) · « Prix HT » (`displayPriceExklusiveVat`) · « Afficher les montants » (`displayValues`) · « Variantes » (`displayDetailOptions`) ;
  4. toutes : séparateur · « Masquer les décimales » (`hideAfterCommaDigits`) ;
  5. lignes 0 et 1 : « Arrondir à 10 » · « Arrondir à 100 » · « Arrondir à 1000 » (`round10/100/1000`, avec `doSpecialRound`) ;
  6. toutes : séparateur · « Afficher les positions sans montant » (`displayEmptyPositions`, vrai) ;
  7. ligne 0 : « Descriptif » (`displayDescriptor`) ;
  8. toutes : « Assembler les descriptifs des ouvrages » (`compactDescription`).

  Stockage : `reglages.optionsDocuments` **par devis** (partagé par les trois documents, comme les fichiers JSON de l'original) ; défauts entre parenthèses, tout le reste faux ; `displayDetailRemark` et `displayQuanPriceValue` existent sans case (lues, faux). **Règles** [P lambdas 23-36] : les deux préréglages sont exclusifs et remettent à faux les 8 cases détaillées ; cocher ou décocher une case détaillée remet les deux préréglages à faux ; « Arrondir à 10 / 100 / 1000 » exclusifs ; « Prix TTC » et « Prix HT » **non** exclusifs (défaut reproduit, sans conséquence au bureau). Au bureau : 4 fichiers d'options, tous à la valeur par défaut : rien à reprendre.
- **Ouvrir …** [P `openEstimateDocument@1-415`] :
  1. document absent (`doc` nul ou enregistrement absent) : choix du modèle — `ch01aTplPick(type, p)` si le socle de CH-01 est intégré (groupe de l'affaire, sinon « Group.project » ; un modèle : sans dialogue ; plusieurs : « Choisir le modèle »), sinon `svDpFind(type, p)` (jeu de l'affaire, puis 1, puis 2) — puis **copie** de son `report` dans `costestimatedpdoc` (`{nom: <libellé de la ligne>, type, jeu, fichier, templateDesc, report, creeLe, creePar}`, un commit, `bseq` lu avant) ; aucun modèle : toast « Aucun modèle « <type> » disponible. » ;
  2. `ch02aFilterMsg(X)` puis, si une option « Arrondir à … » est cochée (lignes 0 et 1), « Attention, vous utilisez une fonction d’arrondi pour un aperçu approximatif. Uniquement possible pour les montants TTC. » (Information ; apostrophe typographique, comme `Strings.db`) ;
  3. rendu du `report` **du devis** (`ch01aPrep` s'il existe) avec les données du § 5.3 à 5.5 par `svDpHTML` (non modifié), dans `ch01aView` (« Modifier les textes… » par `ch01aTexts(rec, apres, save)` avec un `save` qui écrit `costestimatedpdoc`) si le socle de CH-01 est intégré, sinon dans un dialogue `iframe` propre au lot (`svDpDocHTML`, « Imprimer… », « Fermer »). Le document n'est pas modifiable autrement (éditeur : CH-14).

### 4.15 Liste « Mes devis », domaine « Devis général », fiche d'en-tête (lot 4)

**Liste** `ch02dList(el, {mode:'module'|'domaine', project})`, sur le modèle d'`ecList` [P `CostEstimateFrame.<init>@27-128`, `checkGuards`] :
- barre : « + » (domaine : actif avec l'affaire ; module : `pickProject` d'abord) · Dupliquer · crayon ▾ (« Editer … », « Ouvrir … ») · « − » · Importer ▾ (« Importer un devis CFC d'une affaire … » ; « Importer un devis externe (format *.deltakv) … » grisé, D18 ; en module, `pickProject` de l'affaire cible **d'abord**) · roue ▾ (« Copier le contenu du tableau dans le presse-papier », « Exporter le tableau dans un fichier CSV … », séparateur, « Dupliquer et modifier la subdivision » actif si une ligne est choisie et que l'affaire a des ouvrages, « Exporter (format *.deltakv) … » grisé) · recherche · case « Afficher les documents supprimés » (DeltaSub, comme `ecList` ; tient lieu du ⌥⌃-clic de l'original, spec_19 n° 38) ;
- Dupliquer, crayon et « − » actifs si une ligne visible est choisie ;
- colonnes : [verrou, vide] · [« N° d'affaire » en module] · « Utilisateur » · « Date » · « Version » · « N° de version » · « Statut » · « Notes » · « Ouvrages » · « Total TTC » (E12) ; tri initial par date décroissante ; lignes supprimées estompées ;
- module : devis dont `USERID` = utilisateur courant ; domaine : devis de l'affaire ;
- double-clic : Ouvrir (Maj + double-clic : Editer) ; clic droit : « Editer … », « Ouvrir … » ;
- « − » : corbeille en deux temps (n° 17), `bseq` lus avant la confirmation ; la suppression définitive retire aussi, dans le même commit, `costestimate`, les `costestimatedpdoc` du devis (après `DS.need(['costestimatedpdoc'])`, si le lot 3 est intégré) et ses versions d'historique (identifiants tirés de `historique[]`, `bseq` = version lue du contenu : sans charger `costestimatehist`) [C, comme `ecList` ; l'original ne touche pas aux fichiers, CH-03 laisse aussi les PDF] ;
- **Ouvrir** : si `ISAPPLYSUBPROJECTS` = 1 et que l'affaire n'a plus d'ouvrages, l'en-tête est remis à 0 en silence (n° 7) ; puis `DV.back` = vue d'origine et `dvOpen(id)` (CH-10 lot 3 y pose le verrou).

**Fiche d'en-tête** `ch02dEditDoc(p, d, after)` (remplace `dvEditDoc`, ancre L2) [P `dba.project.CostEstimateDocumentDialog`, n° 46] : titres « Nouveau devis général » / « Editer le devis général » ; « Version », « N° de version », « Date » (bouton calendrier), « Statut » (Brouillon, Provisoire, Validé, Annulé), case « Séparer la TVA », case « Devis avec subdivisons » (sic), « Utilisateur » (bouton de choix ; vide → utilisateur courant), « Note » ; **OK actif si Version non vide et statut choisi**.
- **Nouveau devis** : Version vide, N° de version **1**, Date du jour, Statut « Brouillon », « Séparer la TVA » cochée et active, « Devis avec subdivisons » **cochée et active si l'affaire a des ouvrages, décochée et grisée sinon** ; contenu initial `{schema:1, DOCUMENT_ID, PROJECT_ID, reglages:{arrondi5ct:true, pourcentageSur:'groupe', marge:'', indice:'', etatProjet:'', etatPlanification:'', textesLibres:['','','','',''], titres:{…vides}, date:<jour>}, ouvrages:<ouvrages de l'affaire si la case est cochée>, positions:[], remarques:[], presentations:[{nom:'Standard', favori:true, options:<défauts Display>, sautsDePage:[]}], filtres:[]}` [P `db.CostEstimateDocument.<init>@0-50` ; `Estimate.<init>` : `round` 1, `referProcToTot` 1 ; `Init.initDocument`].
- **Edition** : « Devis avec subdivisons » grisée ; « Séparer la TVA » **grisée si la TVA est déjà séparée** (on peut passer de « non séparée » à « séparée », pas l'inverse) [P `<init>@524-559`] ; `bseq` de l'en-tête lu à l'ouverture.

**Dupliquer** `ch02dDuplicate(d)` (remplace `dvDuplicate`) : n° 18 ; fiche « Nouveau devis général » préremplie (Version « <version> Copie », N° de version, Statut, Date, Utilisateur, Note, TVA, subdivisions du devis source), « Devis avec subdivisons » grisée, « Séparer la TVA » grisée si la source sépare la TVA ; la case « Devis avec subdivisons » garde la **valeur du devis source** [C, E17 : l'original y met « l'affaire a des ouvrages », d'où les deux devis 5901 et 6501 marqués « avec subdivisions » sans aucune partie] ; OK → nouvel en-tête + copie du contenu sans `historique` + copie des `costestimatedpdoc` du devis source (si le lot 3 est intégré), un seul commit ; nouvelle ligne choisie. Annuler : rien.

**Domaine** `ch02dDomain(C, top, pane, p)`, appelé par `domainView` (ancre A1) : liste en mode domaine après `DS.need(['costestimate'])`.

### 4.16 Dupliquer et modifier la subdivision (lot 4)

`ch02dMatchStructure(d)` [P n° 35 ; `matchCostEstimateDocument@0-1599`] :
1. Fiche « Nouveau devis général » : Version = « <version> Copie », autres champs recopiés ; case « Séparer la TVA » grisée ; « Devis avec subdivisons » **cochée et active** (l'entrée n'est active que si l'affaire a des ouvrages) [P `matchCostEstimateDocument@127-152`, `<init>@562-619`]. Annuler : rien.
2. OK → **écriture de l'en-tête et de la copie** (contenu sans `historique`, documents du lot 3), puis selon la case « Devis avec subdivisons » de la fiche et le devis source (source « avec ouvrages » = au moins une partie de code non vide) :
   - cochée, affaire sans ouvrages → « Vous devez d'abord configurer les subdivisions » ⏎ « dans votre affaire. » (Erreur) ; la copie reste telle quelle ;
   - cochée, source sans ouvrages → « Souhaitez-vous attribuer les subdivisions » ⏎ « à ce nouveau devis ? » (Information, Oui/Non) ; Oui : dans chaque position qui a des lignes, une partie par ouvrage de l'affaire (ordre `SORTORDER`), **toutes les lignes, le descriptif et le mode Inclure/Exclure dans la première**, honoraire et commentaire recopiés dans chacune, commentaire de la position vidé, `definitif` faux ; `ouvrages` = ouvrages de l'affaire ; Non : copie telle quelle ;
   - cochée, source avec ouvrages → fenêtre « Modifier les ouvrages » (ci-dessous) ;
   - décochée, source avec ouvrages → « Ce devis a des subdivisions. Voulez-vous le créer » ⏎ « sans subdivison? » (Information, Oui/Non) ; Oui : **aplatissement** (n° 35) : une seule partie `ouv:null` par position, lignes = lignes des parties dans leur ordre (les lignes d'une éventuelle partie `ouv:null` d'une position à ouvrages sont effacées ; 0 cas au bureau), descriptif = textes des descriptifs des parties joints par un saut de ligne, **placés avant** le descriptif existant de la position sans séparateur, commentaire de la position inchangé (commentaires des parties perdus), `ouvrages` = [] ; Non : copie telle quelle ;
   - décochée, source sans ouvrages → « Aucune subdivision n'est configurée dans cette affaire. » (Erreur) ; la copie reste telle quelle.
3. **« Modifier les ouvrages »** [P `ce.MatchStructureDialog`] : tableau « Ancien » | « Nouveau » ; une ligne par partie de la **première position qui en a** ; Ancien = `CODE` ou `CODE|LOC` (sans espaces) ; « + » : menu des ouvrages de l'affaire, qui remplit « Nouveau » de la ligne choisie ; « − » vide « Nouveau » ; OK : chaque position garde son numéro et ses textes ; celles qui avaient des parties reçoivent une partie par **ouvrage actuel de l'affaire** (ordre de l'affaire) ; pour chaque nouvelle partie K, reprise des anciennes parties dont « Nouveau » = K : lignes **cumulées**, honoraire, commentaire et mode : **la dernière gagne**, descriptifs joints par un saut de ligne ; ancien ouvrage sans « Nouveau » : **abandonné** ; nouvel ouvrage sans ancien : partie vide. Annuler : la copie reste telle quelle.
4. Chaque suite est un second commit sur le nouveau devis (`bseq` = seq du premier) ; puis le nouveau devis est choisi dans la liste.

### 4.17 « Choix du devis » et « Importer un devis CFC d'une affaire »

**« Choix du devis »** `ch02aPickEstimate({title, project, exclude})` (lot 1, déjà construit) [P `ce.EstimateBrowserDialog`] : affaires à gauche (« N° d'affaire », « Affaire » ; ▾ « Appliquer le filtre » / « Editer le filtre … », étiquette « Filtré »), devis non supprimés à droite ; OK actif si un devis est choisi ; double-clic = OK.

**Importer un devis CFC d'une affaire …** `ch02dImportFromProject(p)` (lot 4) [P n° 36 ; `copyCostEstimateDocument@0-853`] :
1. choix du devis source ; affaire cible = celle du domaine (en module : choisie avant) ;
2. fiche « Nouveau devis général » **vierge** (affaire posée ; Annuler : rien n'est créé) ;
3. contenu copié sans `historique` ; **présentations remplacées** par une seule « Standard » favorite (défauts `Display`) ; `impressionHonoraires` réinitialisé (défauts `HonorarDisplaySettings`) ;
4. **plan comptable de l'affaire cible** (catalogue de type 0) : pour chaque position, code présent mais texte différent → « Dans le devis général, le texte de la position '<n°> <texte>' » ⏎ « diffère de celui du catalogue de base de l'affaire. '<code> <texte>' » ⏎ « Voulez-vous récupérer le texte du devis général ? » (Avertissement, Oui/Non) ; Oui → `TEXT1`/`TEXT2` mis à jour ; code absent → ajouté à `projectcatalogpos` ; affaire sans catalogue CFC (cas de 2251) : aucune écriture de catalogue [C] ;
5. ouvrages : parties rattachées aux ouvrages de l'affaire cible par (code, localisation) (`SUBPROJECT_ID` mis à jour), parties sans correspondance **conservées** ; affaire cible sans ouvrages : aplatissement **propre à l'import** (n° 36) : lignes de la position effacées puis lignes de chaque partie copiées, commentaire = commentaire + « ␠ » + commentaire de chaque partie, descriptif de chaque partie ajouté à la fin sans séparateur **si** la position a un descriptif, `definitif` faux, parties retirées, `ouvrages` = [] ;
6. écriture groupée : en-tête, contenu, positions de catalogue (un commit).

### 4.18 Navigateur de positions (lot 4)

`ch02dNavigator(X, C)` (roue de la fenêtre Calcul ▸ « Navigateur … ») [P n° 5] :
- **Pré-contrôle** : parmi les devis non supprimés **Validés ou Annulés** des **autres** affaires, une position de même numéro (égalité exacte) à total non nul ? Sinon : « Cette position n'est pas utilisée dans une autre affaire. » (Information). `DS.need(['costestimate'])`.
- **Fenêtre « Choix du CFC ^0 »** [P `ce.BkpPositionBrowserDialog`] : liste déroulante des CFC du plan de l'affaire (positionnée sur le n° courant ; la changer relit les listes) ; tableau des affaires (« Numéro », « Texte » ; ▾ « Appliquer le filtre » / « Editer le filtre … », « Filtré ») limité aux autres affaires qui ont un devis **Validé** contenant ce CFC à total ≠ 0 ; tableau des positions : « CFC » | « Texte » | « OUV » | « Localisation » | « Commentaire de la position » | « Montant » (une ligne par position sans ouvrages ou par partie non nulle) ; bouton « Affichage » (position en lecture : fenêtre Calcul sans OK) ; OK actif si une ligne est choisie.
- **Retour** : la partie affichée a déjà des lignes → « Voulez-vous ajouter cette position? » (Avertissement, Oui/Non ; Oui : **ajout** en fin) ; sinon **remplacement** ; lignes (copies, quantités de formule arrondies, C1), commentaire et descriptif copiés dans la copie de travail (`C.redraw()`).

### 4.19 Historique et « À la dernière version » (lot 4)

[C, D12 arrêtée par défaut : pas de reprise de l'historique Deltaproject ; n° 42]
- **Point d'historique** `ch02dHistOps(X)` (appelé par `ch02aSave` avant chaque commit) : si aucune version n'a été créée dans cette session d'édition, ou si la dernière date de plus de **10 minutes** (`X.now()`), ajouter au commit une version dont le `contenu` est l'état **avant** la modification en cours (`X.prev`) ; mettre à jour `E.historique` ; au-delà de **5** versions, supprimer la plus ancienne (`val:null`, `bseq: X.seq`). `ch02dHistDone(X, seq, ops)` met à jour l'état de session après succès.
- **« À la dernière version »** `ch02dLastVersion(X)` : entrée cachée du menu Edition (Maj + clic) ; `DS.need(['costestimatehist'])` ; dialogue « À la dernière version » : tableau des versions (« Date », « Utilisateur »), la plus récente choisie ; OK → « Voulez-vous remplacer le devis par la version du <date> ? » (Avertissement, Oui/Non) [C : l'original restaure sans message] ; Oui : l'état courant devient lui-même une version (équivalent de `costestimate_old`), puis `E` = contenu de la version choisie (`historique` courant conservé), un commit, redessin, toast. Aucune version : entrée grisée.

### 4.20 Messages et libellés exacts

| Clé | Texte (fr) | Titre, boutons | Lot |
|---|---|---|---|
| `KvDialog/msg1` | Voulez-vous supprimer cette position ? | Avertissement, Oui/Non | 1 |
| `KvDialog/msg2` | Voulez-vous supprimer cette position et celles qui lui sont subordonnées? | Avertissement, Oui/Non | 1 |
| `KvDialog/msg10` | Voulez-vous supprimer les ouvrages à zéro? Seuls les ouvrages supprimés dans l'affaire dont toutes les positions sont à zéro seront supprimés. | Avertissement, Oui/Non | 1 |
| `KvDialog/msg14a` ⏎ `msg14b` | Ces modifications sont irréversibles. ⏎ Voulez-vous continuer ? | Avertissement, Oui/Non | 1 |
| `KvDialog/msgFilterIsOn` | Attention, vous travaillez en mode filtre. | Information | 1 (utilisé 2, 3) |
| `ce.data.Rights/msg` | Vous n'avez pas le droit de modifier ce document. | Information | 1 |
| `KvCalcDialog/msg8a` ⏎ `msg8b` | Le montant de la position est fixé. ⏎ Voulez-vous supprimer le montant fixe ou le laisser tel quel ? | « Supprimer » / « Laisser tel quel » | 1 |
| `KvCalcDialog/msg167a` ⏎ `msg167b` | Vous avez déjà inséré un calcul. Voulez-vous le remplacer ⏎ ou le compléter par le contenu du presse-papier? | « Remplacer » / « Compléter » | 1 |
| `KvCalcDialog/msg4` | L'équation de la ligne ^0 est incomplète ou contient des erreurs. | Erreur | 1 |
| `FilterDialog/msg1` | Voulez-vous effacer cette inscription? | Avertissement, Oui/Non | 1 |
| `FilterFavoriteDialog/msg1` | Cette désignation existe déjà. | Erreur | 1 |
| `KvDialog/msg13` | Voulez-vous remplacer tous les paramètres? | Avertissement, Oui/Non | 2 |
| `KvSettingsNameDialog/msg1` | Ce nom est déjà utilisé. | Information | 2 |
| `FavoriteNameDialog/msg4` | Voulez-vous vraiment supprimer la présentation ^0 ? | Avertissement, Oui/Non | 2 |
| `FavoriteNameDialog/msg5` | Cette inscription ne peut pas être effacée. | Erreur | 2 |
| `KvListDisplayDialog/msg1` / `msg2` / `msg3` | Le modèle de première page ne contient pas de champ de liste. / Le modèle de page suivante ne contient pas de champ de liste. / Impossible de trouver le modèle ^0. | Erreur | 2 |
| `KvDialog/msgRoundIsOn` | Attention, vous utilisez une fonction d’arrondi pour un aperçu approximatif. Uniquement possible pour les montants TTC. | Information | 3 |
| `KvDialog/msgPdfFileExists` | Un fichier PDF existe déjà. | Information | 3 |
| `rsrc/msgDeleteFileDefinitely` | Voulez-vous supprimer ce fichier définitivement ? | Avertissement, Oui/Non | 3 |
| `KvCalcDialog/msg1` | Voulez-vous ajouter cette position? | Avertissement, Oui/Non | 4 |
| `KvCalcDialog/msg2` | Cette position n'est pas utilisée dans une autre affaire. | Information | 4 |
| `CostEstimateDocumentDialog/msg1a` ⏎ `msg1b` ⏎ `msg1c` | Dans le devis général, le texte de la position '<n°> <texte>' ⏎ diffère de celui du catalogue de base de l'affaire. '<code> <texte>' ⏎ Voulez-vous récupérer le texte du devis général ? | Avertissement, Oui/Non | 4 |
| `…/msg3a` ⏎ `msg3b` | Ce devis a des subdivisions. Voulez-vous le créer ⏎ sans subdivison? | **Information**, Oui/Non | 4 |
| `…/msg4a` ⏎ `msg4b` | Souhaitez-vous attribuer les subdivisions ⏎ à ce nouveau devis ? | **Information**, Oui/Non | 4 |
| `…/msg5a` ⏎ `msg5b` | Vous devez d'abord configurer les subdivisions ⏎ dans votre affaire. | **Erreur** | 4 |
| `…/msg6a` (`msg6b` vide) | Aucune subdivision n'est configurée dans cette affaire. | **Erreur** | 4 |
| `rsrc/msgDeleteEntry` | Voulez-vous vraiment supprimer cette inscription ? | Avertissement, Oui/Non | 4 |
| `rsrc/msgDeleteEntryDefinitely` | Voulez-vous vraiment supprimer définitivement cette inscription ? | Avertissement, Oui/Non | 4 |

Titres de dialogues : « Indexer cette position + sub. », « Modifier le taux de TVA », « Soumis aux honoraire », « Fixer le coût », « Arrondir », « Filtre », « Nouveau favori », « Editer le favori », « Paramètres » (devis, présentation, honoraires), « Nouvelle inscription », « Edition », « Renommer la présentation », « Supprimer la présentation », « Devis général » (aperçu), « Exporter », « Choix du devis », « Choix du CFC ^0 », « Modifier les ouvrages », « Nouveau devis général », « Editer le devis général », « Calcul pour ». Titres de boîtes : « Avertissement », « Information », « Erreur » (`ch02aAsk`, `ch02aInfo`, `ctMsg`).

---

## 5. Documents imprimés

Les règles fines (offsets, cas limites) sont dans `ch/CH-02/rech_orig.md` v2 (§ 3.6 A-K pour l'ancien document, § 3.8 pour l'ancien « Honoraires », § 4.3-4.8 pour le nouveau format), qui font partie de ce cahier par renvoi ; les règles rejouées en jsc sont dans `r2/ctl_v2.js` (23 OK). Ce qui suit fixe ce que chaque lot doit produire.

### 5.1 Ancien document « Devis général » (présentation, livret) (lot 2)

Moteur pur `ch02bBook(E, doc, p, pres, filtre)` → `{pages:[{type, modele, lignes, n}], nofPages}` (testable en jsc), puis rendu `ch02bBookHTML` (pages par `tplPageHTML`, non modifié ; lignes par un rendu de tableau propre au lot, `tplTableHTML` ne gérant ni les polices par ligne ni les traits de niveau).

**A. Modèle** [P `Favorites.getTemplateFileName@0-609`] : 1) `formtemplate` d'ID = `options.templateId` (tout groupe) → `modele` d'id `projectTemplates/<formtemplategroup.NAME>/projectCostcontrolEstimate/<formtemplate.NAME>` ; 2) sinon le premier modèle du type dans le groupe de l'affaire (`project.TEMPLATEGROUPNAME`) ; 3) sinon le premier d'un groupe « Standard » ; 4) sinon « Impossible de trouver le modèle ^0. » [« premier » : ordre de `FormTemplateGroup.getFormTemplates()`, **[D]** identifiant croissant ; seules les 12 présentations à `templateId` 0 en dépendent]. Au bureau : 5751 → `Standard/…/DG horizontal` (229 présentations), 4619 → `Standard/…/project1` (10), 0 → modèle par défaut (12). `tplFind` (autre ordre, `project1` d'abord) **n'est pas utilisé** pour ce document. Pages : `cover`, `pageToc1` / `pageTocN` (informations), `page1` / `pageN` (tableau `constructionEstimateTable`, titres `projectTableHeader`). **Lignes par page** = partie entière (hauteur du tableau en pt / « Interligne ») ; la première page de tableau perd une ligne si la taille « Police des positions » ≠ « Police des titres » (« DG horizontal » : `page1` 381,5 / 15 → 25, ou 24 ; `pageN` 383 / 15 → 25).

**B. Ordre et numérotation** (présentation favorite) : page de garde (`includeKvCover`, non numérotée ; puis le compteur avance de `coverKvEmptyPages`) ; informations (`includeKvInformation` : remarques préliminaires, puis, si `displaySubprojectNames`, une ligne par ouvrage de l'affaire présent dans le devis — et coché dans le filtre — « CODE | LOC » ou « CODE » / « Description | Description de la localisation » ; nouvelle page `pageTocN` quand la page atteint lignes − 3 ; puis `+ infoKvEmptyPages`) ; récapitulatif à 1 chiffre (`includeKvOneDigit`, page `page1`, `+ kvOneDigitEmptyPages`) ; récapitulatif à 2 chiffres (`includeKvTwoDigit`, `pageN` ou `page1` s'il n'y a pas de récapitulatif à 1 chiffre) ; document principal (`includeDocument`, `page1` s'il n'y a aucun récapitulatif, sinon `pageN`). Chaque partie commence sur une nouvelle page. **Les pages vides ne produisent aucune page** : elles réservent des numéros. Numéro 1 = première page après la garde ; `nofPages` = numéro de la dernière.

**Données** : copie du contenu, arrondi spécial (§ 5.6), calcul filtré (`dvCompute(E, filtre)`), pourcentages sur le groupe ou le total (`pourcentageSur`). Filtres de lignes : sans `dispalyEmptyPositions`, parties puis positions à total 0 **et** option 0 retirées ; `onlyThreeDigits` : n° de plus de 3 caractères retirés (plus de 4 si le 2ᵉ est une espace) ; sans `displayPosOptions` : parties et positions « Exclure » retirées, ainsi que les positions à total 0 et option ≠ 0 ; sans `displayNoTitlePositions` : positions **générées** retirées ; `compactDescription` : descriptif d'une position à ouvrages = descriptifs de ses parties retenues joints par un saut de ligne.

**Pagination du document principal** : nouvelle page quand la page atteint lignes − 1, ou **avant** une ligne dont le n° porte un saut de page de ce type (une seule fois par saut) ; total (G) en fin ; première ligne d'une page supprimée si elle est vide ; pages complétées par des lignes vides.

**C. Colonnes** (largeurs en pt pour un tableau de 727 pt) : N° (`kagNumberColTitle` / « CFC », 45) · Texte (`kagTextColTitle` / « Texte », le reste, partagé à moitié avec Commentaire) · [Commentaire (`commentColTitle` / « Commentaire ») si `displayComment` **et** `commentInColumn`] · [OUV (`subprojectColTitle` / « OUV ») et Localisation (`locationColTitle` / « Localisation », si l'affaire a au moins une localisation) si `displaySubprojects` : 60 chacune si `displayComment` ou `displayValuesPositions`, sinon 0] · montants : si `hierarchicalAdjust`, 4 colonnes « à 4 chiffres » … « à 1 chiffre » de 80 (0 pour « à 4 » si `onlyThreeDigits`), sinon « Montant » (`valueColTitle`, 120) · [« [%] » (`devColTitle`, 45) si `displayDeviation`]. Sans `displayValuesPositions` : montants et % à largeur 0. Cellules alignées à droite à partir de la 1ʳᵉ colonne de montant. Pages d'informations : « Nom » (15 %) et « Description ». Titre vide = défaut `Strings.db (KvListDisplayDialog)`.

**D. Lignes du document principal** : ligne de position (N°, Texte, [Commentaire], [OUV, LOC de la partie **si la position n'a qu'une partie** retenue], montant(s), [%]) ; montant = **HT** si `separateVat` de la présentation, sinon **TTC** ; « Exclure » : « (x) » ; total 0 et option ≠ 0 : « (option) » ; `hierarchicalAdjust` : montant dans la colonne de son niveau (1 caractère → « à 1 chiffre », 2 → « à 2 », 3 → « à 3 » ou « à 2 » si le 1ᵉʳ caractère n'est pas un chiffre, plus → « à 4 » ou « à 3 ») ; % = « 0.0 » si nul, sinon une décimale. Style : 1 caractère `ONE_DIGIT_POS`, 2 `TWO_DIGIT_POS`, 3 `STANDARD` (ou `TWO_DIGIT_POS` si non numérique), plus `STANDARD`. Puis : commentaire (si `displayComment` sans colonne séparée) en ligne `['', commentaire]` `DETAIL_POS` ; avec `displaySubprojects`, pour chaque partie retenue d'une position à **plusieurs** parties : ligne `['', commentaire de la partie ou '' ou « TO LG », [commentaire en colonne], TO, LG, montant, [%]]` `STANDARD`, puis ses lignes de calcul (E), puis son descriptif (`displayDescription` sans `compactDescription`) en lignes `DESCRIPTION_POS` ; sans ouvrages : lignes de calcul puis descriptif de la position ; ligne vide (`EMPTY_LINE`) après une position quand la suivante a un n° plus court (et `displayNoTitlePositions`). Descriptifs coupés aux sauts de ligne, puis au dernier espace pour tenir dans la colonne Texte − 25 pt (− 30 pt sous 9 pt) ; texte brut.

**E. Lignes de calcul** (`writeDetailLine`) : ligne Var écrite seulement avec `displayDetailOptions` ; texte : avec `displayDetailComment` (sans colonne séparée) et un commentaire non vide : le commentaire, précédé de « Base <état>: » si `displayPriceBase` et que la ligne a une base ; il reste sur la ligne du montant seulement si `displayDetailValues` est coché **et** que `displayQuanPriceValue` et `dispalyCalcualtion` ne le sont pas, sinon il forme sa propre ligne ; avec `displayQuanPriceValue` : ligne « Quantité <formule> =  <q> <unité> Prix <prix> » (**deux espaces** après « = », formule seulement avec `dispalyCalcualtion`), ou « Quantité <q> <unité> Prix <prix> », ou « Prix <prix> » si q = 0 ; q écrit comme un double Java (21 → « 21.0 ») ; prix = HT si `separateVat`, sinon HT × (1 + TVA/100) arrondi ; avec `displayDetailValues` : montant de la ligne (HT ou TTC ; Var entre parenthèses) dans la colonne du niveau ; la ligne est écrite si `displayDetailValues`, ou commentaire en colonne séparée, ou `displayPriceBase` ; style `DETAIL_POS`. Au bureau, « impression TRAVAIL » (104) : commentaire en propre ligne, puis ligne « Quantité … Prix … » avec le montant ; « impression MO » (104) : aucune ligne de calcul.

**F. Récapitulatifs** : ligne `[N°, Texte, (''), ('' OUV, '' LOC), montant au niveau (HT ou TTC, **jamais entre parenthèses**), (%)]` ; avec `displaySubprojects` : une ligne par partie retenue `['', '', (''), TO, LG, montant, %]` `STANDARD` ; une position et ses parties ne sont pas coupées entre deux pages ; styles : récapitulatif à 1 chiffre `ONE_DIGIT_POS_FIRST_PAGE` (ou `ONE_DIGIT_POS` si la position a des parties affichées) ; à 2 chiffres : 1 caractère `ONE_DIGIT_POS`, 2 caractères `STANDARD` ; sauts de page du type ; total (G) en fin, sur la page suivante s'il ne tient pas.

**G. Total** : place réservée = 1 + parties retenues (si ouvrages) + 2 (si TVA séparée), sinon page suivante ; ligne vide ; avec ouvrages : `['', 'Total', …, TO, LG, montant, (%)]` par ouvrage ; TVA séparée : « Total HT » (% = 100 − (TTC / HT − 1) × 100) puis « TVA » (% = (TTC / HT − 1) × 100) ; dernière ligne « Total TTC » (« Total » sans TVA séparée), % « 100.0 », style `TOTAL` ; avec `hierarchicalAdjust` : dans la colonne « à 1 chiffre ». Contrôle : TVA 8,1 % partout → « 91.9 » et « 8.1 ».

**H. Montants** : `ch02aR(x, arrondi5ct)` puis apostrophes (« 1'234.50 ») ; `dispalyAfterComma` coupe les 3 derniers caractères ; option : « (x) ».

**I. Styles** [P `PrintCellRenderer`] : `STANDARD`, `EMPTY_LINE`, `ONE_DIGIT_POS_FIRST_PAGE` = « Police des positions » (nom + taille) ; `TOTAL`, `ONE_DIGIT_POS`, `TWO_DIGIT_POS` = « Police des titres » ; `DETAIL_POS`, `DESCRIPTION_POS` = « Police des informations détaillées » ; retrait de 2 pt ; **aucun attribut gras ni italique** (le gras vient d'un nom de police `…-Bold`) ; `ONE_DIGIT_POS` / `TWO_DIGIT_POS` : trait sous la ligne si `underlineOneDigit` / `underlineTwoDigit`, épaisseur et couleur du réglage ; `zebra` : lignes d'indice pair `rgb(232,232,232)` ; `grayDetails` : lignes `DETAIL_POS` et `DESCRIPTION_POS` sur `rgb(235,235,235)` ; `standard` : blanc ; grille : celle du champ tableau du modèle. Polices : `tplFont` (Akkurat, repli Helvetica).

**J. Champs du modèle** (passés dans `ctx.fields` de `tplFieldValue`, qui n'est pas modifié) : `documentTitle` (garde : `titres.garde` ; récapitulatif à 1 chiffre : `titres.unChiffre` ; à 2 chiffres : `titres.deuxChiffres` ; document et informations : `titres.document` ; titre vide → « Devis général ») · `date` (`reglages.date`, format de la date longue actuelle) · `printDate` (jour) · `user` (`USERID` du devis, **pas** l'utilisateur courant) · `pageNumber` · `projectBaseIndex` (`project.BASISINDEX`) · `constructionIndex` (`reglages.indice`) · `amountTotalExcludedVat`, `amountVat`, `amountTotal` (filtrés, **toujours avec décimales**, défaut reproduit) · `reportFilter` (§ 5.3, espaces insécables) · `constructionPlanningStatus` (`etatPlanification`), `projectContractStatus` et `constructionCostEstimateProjectState` (`etatProjet`), `constructionCostEstimateAccuracy` (`marge`) · `customText1` à `customText5` (`textesLibres`) · `constructionInternalNote`, `…Version`, `…VersionNr` (en-tête) · rôles (`projectAddressBuilder`…) : pour le maître d'ouvrage, si les ouvrages du filtre ont un seul contact (ou tous le même), ce contact, sinon l'intervenant de l'affaire.

### 5.2 Ancien document « Honoraires » (lot 2)

Modèle `projectCostcontrolFee` (même résolution que § 5.1 A, `templateId` de `impressionHonoraires`) ; pages `cover` (si « Page de garde »), `page1`, `pageN`. Lignes [P `KvBook.createHonorarPage@0-755`] : sans `displayEmptyPositions`, parties et positions à **taux soumis 0** et option 0 retirées ; sans `displayOptions`, « Exclure » retirées ; position `[N°, Texte, ('' OUV, '' LOC si le devis a des ouvrages), HT (option entre parenthèses), % soumis, montant soumis]`, le % n'étant écrit que pour une position **sans** parties et **non générée** ; style `GENERATED_POSITION` / `NOT_GENERATED_POSITION` ; parties `['', '', TO, (LG), HT, % soumis (vide si la position est générée), montant soumis]` ; ligne vide avant une position de niveau supérieur ; total (`writeHonorTotal`) en fin. Colonnes : « CFC » · « Texte » · [« OUV » · « Localisation »] · « Montant » · « [%] » · « Montant soumis » (titres de `impressionHonoraires`). Montants : `dispalyAfterComma`, arrondis spéciaux comme § 5.6.

### 5.3 Document « Devis général » au nouveau format (`costEstimateEstimate`) (lot 3)

- **Modèles** : jeux 1 (bureau, 4 sections : Page de garde, Information, Récapitulatif avec réglage « CFC 1 chiffre », Devis général ; A4 paysage) et 2 (« SUBSTANCES » : Page de garde, Récapitulatif avec `summaryTable`, Devis général sur la page « A4 Landscape 2 » absente → **« A4 Portrait »**, n° 37). 36 documents du bureau viennent du jeu 1, 15 du jeu 2 ; 24 masquent Ouv. et Loc.
- **Champs** `ch02cFields(X, genre)` (sur le modèle de `svReportCtx`, ou `ch01aCtx` s'il est intégré) [P `EstimateDocumentReport$StringField`, `getString@15-1561`] :

| Champ | Source DeltaSub |
|---|---|
| `projectmanagementBuilderBySuproject` | contact de l'ouvrage si le filtre ne retient qu'un contact (ou tous le même), sinon maître d'ouvrage de l'affaire (`ch01aMoOuv` / `svMember(p, 8)`) |
| `staff` | collaborateur de `USERID` (`svStaffOfUser`) |
| `docDate`, `docTitle` | jour ; `titres.document` (vide : titre du modèle) |
| `estimateDate` | `reglages.date` (n° 39) |
| `projectBaseIndex`, `constructionIndex` | `project.BASISINDEX` ; `reglages.indice` |
| `reportFilter` | ouvrages cochés du filtre actif : `CODE`, ou `CODE` + U+00A0 + `|` + U+00A0 + `LOC`, séparés par « ␠/␠ » ; facteurs non affichés ; sans filtre : vide |
| `amountTotalExcludedVat`, `amountVat`, `amountTotal` | totaux filtrés, `ch02aR(x, arrondi5ct)` avec apostrophes ; « Masquer les décimales » retire « .xx » ; absent : « 0.00 » / « 0 » |
| `constructionPlanningStatus`, `constructionCostEstimateAccuracy`, `constructionCostEstimateProjectState` | `etatPlanification`, `marge`, `etatProjet` |
| `constructionInternalVersionNr`, `constructionInternalVersion`, `constructionInternalNote` | en-tête |
| `amountHonorar` (Honoraires seulement) | montant soumis |
| `project`, intervenants | socle (`svReportCtx` / `ch01aCtx`) |

- **Tables** [P `EstimateDocumentReportData.getTableContent@26-265`] : `informationTable` (remarques : « Désignation », « Texte ») ; `subProjectTable` (« Code d'ouvrage », « Ouvrage », « Code de localisation », « Localisation », « Maître d'ouvrage ») ; `estimateTable` ; `summaryTable`. Colonnes de `estimateTable` **par id** (les modèles du bureau portent d'anciens noms pour 4 et 5) : 0 N° CFC · 1 Désignation · 2 Ouvrage · 3 Localisation · 4 Monnaie · 5 Commentaire position · 6-9 Devis à 4 / 3 / 2 / 1 chiffre(s) · 10 Montant HT · 11 Taux de TVA · 12 TVA · 13 Montant TTC · 14 Pourcentage · 15 Définitif.
- **Remplissage de `estimateTable`** [P `EstimateTable.fillTable@0-5177`] : positions préparées (copie, arrondi spécial, calcul filtré) ; générées sautées sans « Afficher les positions saisies et les totalisateurs » ; saut de page si le n° figure dans les réglages du tableau (0 au bureau, non rendu : E13) ; style par longueur du n° (1 → `c1`, 2 → `c2`, 3 → `c3` ou `c2` pour une générée si k3, plus → `c3` ; variantes `…a` pour le fond alterné) ; marge de 4 mm avant chaque nouveau groupe ; ligne de position : n°, désignation, (ouvrage, localisation vides), monnaie, commentaire si « Base et commentaire dans colonne séparée », montant dans la colonne de son niveau (> 3 caractères → 6, 3 → 7, 2 → 8, 1 → 9), HT, (taux vide), TVA, TTC, % (`formatOneDigitProc`), Définitif (« oui » / vide) ; exclu ou nul avec option : valeurs d'option entre parenthèses ; puis commentaire en ligne séparée, lignes de calcul (ci-dessous), descriptif (titre « Description : » si k1 et « Descriptif »), et si « Afficher les subdivisions », une ligne par ouvrage avec montant, commentaire, calcul et descriptif ; fin : « Total » (`ct`) = total, HT, TVA, TTC, « 100.0 », puis, si subdivisions et k2, « Total <ouvrage> » par ouvrage. **Une propriété de tableau absente vaut vrai** (k0 titre « Calcul : », k1 titre « Description : », k2 récapitulatif par ouvrage, k3 « positions supérieures à trois chiffres comme celles à deux chiffres », k4 fond alterné) [P `initProperties@1-152`]. Styles : `catalogLevel1/2/3` → `c1/c2/c3`, `…a`, `catalogTotal` → `ct`, `catalogHeader` → `ch`, `catalogDetail` → `cd`, `catalogSubtotal1-3` → `cst1-3`, `tableRow` → `tr` (clés de `svRowStyles`).
- **Lignes de calcul** (`writeDetails`) [P `@0-4549`, rech_orig v2 § 4.7] : écrites seulement si l'une des options suivantes est vraie : les 2 préréglages, Bases de prix, Afficher le calcul, Variantes, Commentaire du calcul, Quantités, Prix TTC, Prix HT, Afficher les montants (`displayCalculationLine` toujours faux). **Avec les réglages du bureau (tous par défaut), aucune ligne de calcul n'est imprimée.** Branches : 1) « Uniquement les montants avec calculs et remarque » : lignes à commentaire non vide ; Désignation = commentaire (+ « ␠|␠Base de prix␠<état> ») ; montants complets ; 2) « Tous les montants détaillés » : chaque ligne, sans texte, montants complets ; 4) cases détaillées : avec « Commentaire du calcul », une ligne `['', commentaire (+ « | Base de prix <état> »)]` puis une 2ᵉ ligne dont la Désignation assemble par « ␠|␠ » : `<formule> = <q> <unité>` (« Afficher le calcul », formule non vide), ou `Quantité = <q> <unité>` (« Quantités »), `Prix TTC <prix>`, `Prix HT <prix>` — écrite seulement si l'un de ces textes existe ; sans « Commentaire du calcul », une seule ligne (« Base de prix <état> » puis les mêmes éléments), toujours écrite ; montants si « Afficher les montants » (ligne Var entre parenthèses). Titre « Calcul : » avant la 1ʳᵉ ligne de calcul d'une position si k0 et que la ligne a une quantité avec « Quantités » ou « Afficher le calcul ».
- **`summaryTable`** (jeu 2) [P `SummaryTable.fillTable@0-2191`] : propriétés k0 « Totaux récapitulatifs à 2 chiffres », k1 « Afficher les subdivisions », k2 « Fond alterné » (absentes = vrai) ; positions à 1 caractère, plus celles à 2 caractères si k0 ; ligne `[N°, Désignation, '', '', Monnaie (« CHF » par défaut), « Devis à 1 chiffre », « Devis à 2 chiffres » (si k0), HT, TVA, TTC, % du total général]` ; exclu ou nul avec option : entre parenthèses ; si k1 et « Afficher les subdivisions » : une ligne par partie non nulle ; « Total » puis, si k1, un « Total » par ouvrage ; styles `c1` (1 caractère, ou `c3` si k0 faux), `c3` sinon ; marge de 4 mm avant la première ligne.
- **Récapitulatif du jeu 1** (réglage « CFC 1 chiffre ») : liste **toutes** les positions ; le réglage ne filtre que les colonnes (contrôlé sur le PDF du devis 7801).

### 5.4 Document « Honoraires » (`costEstimateHonorar`) (lot 3)

Modèle (jeux 1 et 2 identiques) : « Soumis à honoraires », A4 portrait ; page de garde **masquée** ; section « Positions soumises à honoraires ». `honorarTable` : « N° CFC » (14) · « Désignation » (45) · « Ouvrage » (15) · « Localisation » (15) · Monnaie, Commentaire (masquées) · « Montant HT » (30) · « % soumis » (15) · « Honoraires » (30) ; même parcours et mêmes styles que `estimateTable` ; % soumis (`formatProcent`, « 0.0 » si nul) seulement pour une position saisie sans ouvrages ; lignes d'ouvrage et total [P `HonorarTable.fillTable@469-1062`]. Au bureau : 4 documents repris (3453, 5001, 5503, 6001).

### 5.5 Document « Devis descriptif » (`costEstimateDesc`) (lot 3)

Modèle (jeux 1 et 2 identiques) : « Descriptif », A4 portrait ; page de garde visible ; section « Descriptif du devis ». `descTable` : « N° CFC » (14) · « Désignation » (40) · « Ouvrage » (15) · « Localisation » (15) · « Montant » (25) · « Pourcentage » (15 ; masquée par défaut, **visible** dans le modèle du jeu 2). Ligne de position (n°, texte, TTC entre parenthèses si exclu, %), puis une ligne portant le descriptif de la position ; avec ouvrages : descriptifs des parties (filtre respecté), regroupés si « Assembler les descriptifs des ouvrages » ; seule propriété : k3 [P `DescTable.fillTable@144-947`]. Cas du bureau : 5252 (12 descriptifs) et 6751 (10), qui ont un `desc.dpdoc`.

### 5.6 Formats et arrondis spéciaux (lots 2 et 3)

- `formatValue` : 0 → « 0.00 » (« 0 » si décimales masquées) ; sinon `ch02aR(x, arrondi5ct)` avec apostrophes ; décimales masquées : 3 derniers caractères coupés.
- `formatOneDigitProc` : 0 → « 0.0 » ; ≤ 0,1 → « <0.1 » ; ≥ 100 → « 100.0 » ; sinon une décimale.
- **Arrondir à 10 / 100 / 1000** (`specialRound`) : par position non générée (par partie s'il y a des ouvrages), TTC et HT tronqués vers zéro puis `n + m − n % m` si `n % m ≠ 0` (reste tronqué de Java) : 1'234.56 → 1'240 / 1'300 / 2'000 ; 1'230.00 → 1'230 (10) ; −1'234.56 → −1'100 (100) ; totalisateurs recalculés [P `ceil10/100/1000`, `specialRound@73-237`].

---

## 6. Valeurs de contrôle

Données : base de test (`dstest/deltasub.sqlite`, copie de la base du bureau). Les fixtures extraites pour jsc contiennent des données du bureau : elles sont **effacées après usage** (modèle : `lot1/test.sh`, `trap 'rm -f …' EXIT`). Montants en CHF.

### 6.1 Tests jsc

| # | Lot | Cas | Attendu |
|---|---|---|---|
| T1-T11 | 1 | déjà écrits (`lot1/test_ch02a.js`) : `ch02aR`, Indexer (7052, 6701, 7751, 5252), Modifier la TVA (1001, 5252, 6751, 3201, 7751), Supprimer les ouvrages à 0 (7751, 7602, 7651, 4802, 7101, 3503, 6901), Modifier le montant soumis, filtre (130/130 sans filtre ; favoris de 7751, 6801, 7052 ; BUR 550'000.00, facteur 0,5 → 275'000.00, facteur 0 → 0), Mettre à zéro, Supprimer la position, Arrondi (719/753, 34 à 0,05), Fixer le coût | **162 contrôles réussis** sur `9c9a3f9` (vérifié par cette critique) ; valeurs détaillées : version 1, § 6.1 |
| T21 | 1 (C1) | quantité de formule | 345 formules : **345/345** égales à la quantité enregistrée avec l'arrondi à 3 décimales (340 sans) ; 951 / 221.9 : 4.9335 → **4.934**, TTC de la ligne **2'922.65** (DeltaSub actuel : 2'922.35) ; 6801 et 7101 / 271.1 / AP2 : 34.6275 → **34.628**, **4'155.05** (actuel 4'155.00) ; 5101 et 3402 / 211.5 / EX : 47.7744 → **47.774**, TTC recalculé **11'944.70** (actuel 11'944.80 ; valeur enregistrée 11'943.50 = TTC saisi) |
| T22 | 1 (C2) | « Arrondi » changé dans les Paramètres | 7751 (décoché → coché) : TTC 3'556'000.00 → **3'556'000.05**, HT inchangé 3'289'546.75 ; 5252 (coché → décoché) : 490'000.00 → **489'998.56**, HT 453'721.10 ; 6751 : 213'000.00 → **212'998.61** ; 7052 : 1'325'999.98 → **1'326'000.08** ; « Arrondi » inchangé : aucun recalcul |
| T23 | 1 (C3) | enregistrement du contenu | le commit ne contient **que** `costestimate` (avec `bseq`) ; `CHANGEDDATE` et `USERID` de l'en-tête inchangés |
| T24 | 1 (C2) | date du devis | `source.date` « Tue Sep 06 00:00:00 CEST 2022 » → `2022-09-06` ; 7751 : « Fri Sep 04 00:00:00 CEST 2026 » → `2026-09-04` ; `reglages.date` présent : prioritaire |
| T12 | 2 | présentations de 7751 | 2 présentations : « impression MO » (`templateId` 5751, 1 saut « 235 » tous), « impression TRAVAIL » (favorite, 5 sauts « 224.5 », « 239.2 », « 281.9 », « 225 », « 53 ») ; modèle `projectTemplates/Standard/projectCostcontrolEstimate/DG horizontal` ; séquence MO : garde, informations, récap. 1, récap. 2, document ; TRAVAIL : garde et document ; `page1` : **24** lignes (polices 9 et 10), `pageN` : 25 |
| T25 | 2 | menu Documents ▾ de 7751 | « Document impression MO … », « Document impression TRAVAIL … », séparateur, « Ajouter une présentation par défaut », « Renommer la présentation … », « Supprimer la présentation », séparateur, « Honoraires … », « Feuille de position … » ; avec une seule présentation : pas de premier séparateur ni de « Supprimer » ; liste vide : « Document  … » et une présentation sans nom ajoutée (77 clés `Display` par défaut) |
| T26 | 2 | règles de l'ancien document (`r2/ctl_v2.js`, repris dans les tests du lot) | total TVA 8,1 % : « 91.9 » / « 8.1 » / « 100.0 » ; ligne « Quantité 3*7 =  21.0 m2 Prix 1'575.00 » (TVA non séparée) ; colonnes pour 727 pt avec décalage, ouvrages et % : N° 45 · Texte 197 · OUV 60 · LOC 60 · 4 × 80 · [%] 45 ; « Décaler légèrement » (invisible) : « 1'234.50␠␠␠ » ; Arrondir à 100 : −1'234.56 → −1'100 |
| T13 | 2 | FastTrack (synthétique, « T » = texte) | positions 2 et 21 générées, 211, 212, 212.1 saisies → `2 T⇥21 T⇥211 T⇥⇥` CRLF · `⇥⇥212 T⇥⇥` CRLF · `⇥⇥212 T⇥212.1 T` CRLF [P] ; octets UTF-8 |
| T27 | 2 | export RTF | ligne de calcul « ␠Béton␠3*7␠21.0␠8.1␠30'597.00 » (TVA séparée) ; ligne Var « …␠8.1␠(30'597.00) » ; montant d'une position `formatCurrency` à 0,05 ; « Exporter le descriptif » de 5252 : **toutes** les positions (39), 12 descriptifs |
| T14 | 3 | formats | `formatOneDigitProc` : 0 → « 0.0 », 0.08 → « <0.1 », 3.94 → « 3.9 », 100.2 → « 100.0 » ; `formatValue` masqué 1'234.55 → « 1'234 » ; arrondis spéciaux 1'234.56 → 1'240 / 1'300 / 2'000 |
| T15 | 3 | rendu `svDpHTML` du devis 7751 (jeu 1, sans document enregistré) | contient « RÉCAPITULATION », « Total », « 3'556'000.00 » ; 64 positions ; avec « Masquer les décimales » : « 3'556'000 » ; aucune ligne de calcul avec les options par défaut |
| T28 | 3 | champ Filtre et lignes de calcul | HAL1 (sans loc.) + HAL2 (loc. « E1 ») cochés → « HAL1 / HAL2 | E1 » avec U+00A0 autour de « | » ; « Afficher le calcul » + « Prix HT », formule « 3*7 », q 21, m2, prix 1'457.00 → « 3*7 = 21.0 m2 | Prix HT 1'457.00 » ; « Tous les montants détaillés » puis « Quantités » : le préréglage repasse à faux |
| T16 | 3 | convertisseur (Python) | 59 enregistrements (`estimate` 51, `desc` 4, `honorar` 4) ; id `<DOCUMENT_ID>/<genre>` ; `doc.report.reportType` conforme ; `PROJECT_ID` renseigné ; `data.json` vides ignorés ; devis absents de l'en-tête ignorés |
| T17 | 4 | Dupliquer et modifier, 4802 | correspondance APPR, APP1, APPC → LOG ; INF → GEN ; GA → GRAN ; LOG, GRAN, GEN → eux-mêmes : LOG **735'197.00**, GEN **333'605.00**, GRAN **111'000.00**, total **1'179'802.00** ; 7101 : EDP → STU : STU **78'000.00**, total 1'675'000.00 ; EDP sans correspondance : **1'597'000.00** |
| T29 | 4 | aplatissements (synthétiques) | `msg3` Oui : position à 2 parties (lignes a, b / c ; descriptifs « D1 » / « D2 » ; commentaires « c1 » / « c2 » ; descriptif de position « P ») → une partie `ouv:null`, lignes a, b, c, descriptif « D1⏎D2P », commentaire de la position inchangé ; import vers une affaire sans ouvrages, même position, commentaire de position « C » → commentaire « C c1 c2 », descriptif « PD1D2 » ; sans descriptif de position → descriptif vide |
| T30 | 4 | fiche d'en-tête | nouveau devis dans 3601 (6 ouvrages) : N° de version 1, Brouillon, TVA cochée, subdivisions cochée active ; dans une affaire sans ouvrages : subdivisions décochée grisée ; édition de 7751 (TVA séparée) : case TVA grisée ; Dupliquer « Variante A » → « Variante A Copie », subdivisions = valeur source |
| T18 | 4 | navigateur depuis 3601 | CFC 291 : **20** affaires, **23** lignes (pré-contrôle : 21 affaires) ; 272.2 : 15 affaires (pré-contrôle : 16) ; 011 : `KvCalcDialog/msg2` |
| T19 | 4 | historique (horloge simulée) | 3 enregistrements en 10 min → 1 version ; + 1 à 11 min → 2 ; 6ᵉ version → la plus ancienne supprimée (`val:null`, `bseq` = `X.seq`) ; restauration → contenu = version, `historique` conservé, une version de plus |
| T20 | 1 à 4 | syntaxe et collisions | `jsc -e "new Function(readFile('script.js'))"` sur le script complet (`DeltaSub.html` du dépôt au moment du build + lot) ; aucune redéclaration ; collisions de préfixe (déclarations) avec `DeltaSub.html` et `ch/*/` |

### 6.2 Essais navigateur (copie isolée, par lot)

Protocole : dossier du lot ; copies de `serveur_deltasub.py` (modifiée pour les lots 3 et 4) et du `DeltaSub.html` construit par `build.py` ; base copiée par `sqlite3 '…/dstest/deltasub.sqlite' ".backup '<dossier>/deltasub.sqlite'"` ; serveur `DELTASUB_DB=<dossier>/deltasub.sqlite python3 -I <dossier>/serveur_deltasub.py --port <port>` en arrière-plan ; **onglet propre** (`tabs_create` puis `navigate`), `localStorage.ds_user='2752'`, rechargement ; impressions vérifiées sur le HTML produit (`iframe`) ; à la fin : serveur arrêté, onglet fermé, taille d'affichage par défaut.

| # | Lot | Scénario | Attendu |
|---|---|---|---|
| B1-B10 | 1 | déjà définis (v1 § 6.2) et joués à la relecture du lot 1 (port 7883) | à rejouer après les compléments |
| B23 | 1 | 5101 ▸ Calcul pour 211.5 ▸ partie EX ▸ formule revalidée à l'identique | quantité 47.774, montant de ligne **11'944.70** |
| B24 | 1 | clé ▾ ▸ Paramètres : 4 catégories ; « Titres » ▸ Page de garde « Essai » ; « Affichage » ▸ Arrondi décoché (5252) | titre enregistré ; Total TTC **489'998.56** ; en-tête : date et utilisateur inchangés |
| B11 | 2 | Documents ▾ ▸ « Document impression TRAVAIL … » (7751) | aperçu : garde puis document ; sauts avant 224.5, 239.2, 281.9, 225, 53 ; clic sur la cellule 235 → « Insérer un saut de page » → saut ajouté à la favorite |
| B12 | 2 | Ajouter une présentation « impression MO » ; « Essai » ; supprimer la n° 0 | « Ce nom est déjà utilisé. » ; « Essai » ajoutée en fin, favorite ; « Cette inscription ne peut pas être effacée. », rien de supprimé |
| B13 | 2 | 7602 ▸ Paramètres ▸ Importer les présentations ▸ 7751 | `msg13` ; présentations, remarques et titres de 7751 copiés ; textes libres et indice de 7602 intacts |
| B14 | 2 | pinceau ▸ Paramètres de la présentation ; Feuille de position ; Honoraires … (3201) | 7 catégories, règles d'activation ; feuille : position seule, TTC sans décimales ; honoraires : montant soumis 46'239.50 |
| B15 | 2 | Exporter le devis (FastTrack), Exporter le descriptif (5252) | fichiers téléchargés ; contenu conforme à T13 et T27 |
| B16 | 3 | 5252 ▸ panneau Documents (visible à l'ouverture) | « Devis descriptif » disponible (repris) ; Ouvrir → « Descriptif », 12 descriptifs ; « Effacer le document » → `msgDeleteFileDefinitely` ; Ouvrir → recopie du modèle du jeu 1 |
| B17 | 3 | 7751 avec filtre BUR ▸ Devis général ▸ Ouvrir ; « Arrondir à 1000 » | message mode filtre ; champ Filtre « BUR » ; message d'arrondi ; montants à 1000 près |
| B18 | 4 | Mes devis (utilisateur 2752) | **22** devis vivants ; colonne « N° d'affaire » ; « Afficher les documents supprimés » montre les autres |
| B19 | 4 | domaine « Devis général » de 3601 ; Dupliquer 7751 | liste de l'affaire ; fiche « Nouveau devis général », Version « <version> Copie », cases grisées ; OK → nouveau devis, total 3'556'000.00 |
| B20 | 4 | Dupliquer et modifier 4802 | fenêtre « Modifier les ouvrages » (8 lignes) ; résultat T17 |
| B21 | 4 | Importer un devis CFC d'une affaire (7751 vers une affaire de test) | fiche vierge ; `msg1a-c` si un texte diffère ; positions ajoutées au plan ; présentations = « Standard » |
| B22 | 4 | Calcul pour 291 de 7751 ▸ Navigateur ; 12 minutes simulées puis Maj + clic sur Edition ▸ À la dernière version | « Choix du CFC 291 » : 20 affaires ; versions listées ; restauration après confirmation |

---

## 7. Écarts assumés

| # | Écart | Raison |
|---|---|---|
| E1 | TTC recalculé au centime dans un devis sans « Arrondi » (l'original garde la valeur non arrondie) | convention DeltaSub ; données du bureau au centime |
| E2 | Pas de verrou de document dans ce chantier : conflits détectés par version lue (409) ; verrou d'ouverture par CH-10 lot 3 | architecture DeltaSub |
| E3 | « Enregistrer » masqué, pas de question à la fermeture ni `msg11` | enregistrement continu (comme la sauvegarde automatique de l'original) |
| E4 | Les 3 bascules de session de DeltaSub restent sous les 5 modes ; parties en colonnes par ouvrage | pas de régression |
| E5 | Colonnes Définitif, Commentaire, Descriptif agrégées au niveau de la position | conséquence de E4 |
| E6 | « Modifier le montant soumis » refuse une saisie illisible | défaut de l'original (applique 0 %) |
| E7 | Statut « non définitif » enregistré aussitôt | enregistrement continu |
| E8 | Aperçu de l'ancien document dans un dialogue DeltaSub ; impression par le navigateur | `tplPrint` ne gère ni le modèle choisi, ni les récapitulatifs, ni les sauts ; moteur partagé non modifié |
| E9 | Exports téléchargés ; RTF simplifié | navigateur ; `RTFEditorKit` non reproductible à l'octet |
| E10 | « Choix du devis » écrit à part (`ch02aPickEstimate`), non mutualisé avec `ecqPickDocument` | ne pas modifier le code de l'eCCC |
| E11 | Historique : 5 versions, 10 minutes, choix de la version et confirmation | D12 ; l'original restaure sans message la dernière copie |
| E12 | Colonnes « Ouvrages » et « Total TTC » de la liste, « Exporter le devis (CSV) » conservés | ajouts DeltaSub utiles |
| E13 | Sauts de page propres au `.dpdoc` (`TableBand.pageBreaks`) et logos absents de la bibliothèque `image` non rendus | 0 usage ; moteur `svDp*` non modifié |
| E14 | Présentation n° 0 protégée | intention de l'original (le bytecode la retire) |
| E15 | Texte riche du descriptif non repris | 0 descriptif mis en forme au bureau |
| E16 | Aplatissement « sans subdivison » : descriptif de chaque partie repris **une fois** | défaut de l'original (une fois par ligne de la partie) |
| E17 | Dupliquer : « Devis avec subdivisons » garde la valeur du devis source | défaut de l'original (valeur de l'affaire), à l'origine des devis 5901 et 6501 |
| E18 | `reglages.date` créé par DeltaSub, dérivé de `source.date` | le convertisseur ne range pas `Estimate.date` dans `reglages` ; le convertisseur n'est pas modifié |
| E19 | Suppression définitive d'un devis : contenu, documents `.dpdoc` et versions supprimés avec l'en-tête | comme `ecList` ; l'original laisse le dossier sur le disque (inaccessible) |
| E20 | « Modifier les textes… » (textes fixes du document) seulement si le socle CH-01 est intégré ; aucune autre modification du document | l'éditeur de document relève de CH-14 |
| — | Écarts propres au lot 1 : `lot1_integration.md` § 6 (14 points : titre « Erreur » du doublon de favori, totaux de la fenêtre Calcul, TVA des lignes « Arrondi » sans séparation, saisie illisible refusée, favoris gardés seulement par OK, « ‹ Liste des devis » conservé, droits contrôlés aussi pour Mettre à zéro et le clavier, etc.) | relecture contradictoire du lot 1 |

---

## 8. Écarts hors chantier signalés (non traités)

1. **`dvAdd`** : ajouter une sous-position sous une position saisie qui a déjà un montant ne pose pas la question de l'original (`KvDialog/msg3a-b` « Un montant figure déjà dans la position subordonnée ^0. » ⏎ « Voulez-vous le reporter dans la nouvelle position ? ») ; `dvCompute` additionne alors les deux. Correctif du module à prévoir (bytecode : `KvDialog.addPosition`).
2. **`dvOuvName`** cherche l'ouvrage par code : les descriptifs d'ouvrages renommés (4802, 7101, 6801) perdent leur nom affiché ; passer par `SUBPROJECT_ID` (modèle `ecqImportedContent`).
3. **Styles de lignes tronqués** (signalé par CH-01) : `ROWSTYLESET.ROWSTYLES` coupé à 4 000 caractères par `outils_deltaproject/Dump.java` ; `c1_color` perdu → lignes `catalogLevel1` noir sur noir **aussi dans les trois documents du devis**. Correction côté données (ré-extraction de `ROWSTYLESET` et `TEXTSTYLESET`), sans code DeltaSub.
4. **Devis 5901 et 6501** (affaire 2951) : `ISAPPLYSUBPROJECTS` = 1 sans aucune partie (défaut E17 de l'original) ; l'éditeur les traite comme des devis sans ouvrages ; aucune correction automatique.
5. **Moteur `svDp*`** : ni saut de page de tableau ni image embarquée dans le document (E13) ; à traiter avec CH-14.

---

## 9. Points d'ancrage DeltaSub

Unicité vérifiée par `grep -F -c` = 1 sur `9c9a3f9` (md5 `b5db7920…`) ; les empreintes (SHA-1 des lignes de la plage jointes par `\n`, 12 premiers caractères) sont **inchangées** depuis `a0165c9`. Le `build.py` de chaque lot :
- prend le chemin du `DeltaSub.html` source en argument (défaut : celui du dépôt, jamais modifié) ;
- vérifie : préfixe du lot absent de la source ; déclarations du lot toutes préfixées, sans doublon, sans collision (déclarations) avec la source et `ch/*/` (hors fichiers du lot) ; chaque ancre (compte = 1) et chaque empreinte de plage ;
- **échoue proprement** (message, code non nul, rien d'écrit) si une ancre manque, est multiple ou a changé ;
- insère le bloc du lot **avant** le commentaire qui ouvre `DÉMARRAGE` (dernier `\n/*` avant la ligne `   DÉMARRAGE`), après avoir vérifié que `const HEAVY=` le précède ;
- contrôle la syntaxe du script complet par jsc.

| # | Lot | Ancre (« ancien ») | Plage, empreinte | « Nouveau » |
|---|---|---|---|---|
| A0 | 1-4 | ligne `   DÉMARRAGE` | l. 14 503 | bloc du lot inséré avant le commentaire |
| R1 | 1 | `  const save=async()=>{ await DS.commit([{t:'costestimate',id,val:E},` | l. 2602, `95269981d7b7` | contexte `X` + `  const save=()=>ch02aSave(X);` (texte exact : `lot1_integration.md` § 2) |
| R9 | 1 | `  const totals=()=>{ const {T}=dvCompute(E);` | l. 2606, `02e4f1fb8e22` | `  const totals=()=>ch02aTotals(X);` |
| R3 | 1 | `  bar.append(ibtn({label:'‹ Liste des devis'` … `    ibtn({i:'save',t:'Enregistrer',fn:save}),tot);` | l. 2607-2614, `bc4422cead0f` | `  bar.append(...ch02aBar(X));` |
| R4 | 1 | `  R.append(rp); body.append(L.el,R); m.append(bar,body);` | l. 2617, `eb6cebffad8b` | étiquette de filtre, `X.dpane`, `ch02aMount(X)` |
| R5 | 1 | `  const draw=()=>{ const {M}=dvCompute(E); const ouv=st.ouv?OUV():[];` … `    totals(); };` | l. 2621-2630, `adb115e84be0` | `  const draw=()=>ch02aDraw(X);` |
| R6 | 1 | `  const dvDel=async()=>{` … (avant `  /* Fenêtre « Calcul pour <CFC> » */`) | l. 2638-2640, `d7aaff865cd6` | `  const dvDel=()=>ch02aDelPos(X);` |
| R7 | 1 | `  const dvCalc=()=>{ const pos=E.positions.find(` … (avant `  const dvIntro=()=>{`) | l. 2642-2688, `fe1f1a489aec` | `  const dvCalc=()=>ch02aCalc(X);` |
| R8 | 1 | `  VIEWS['devis'].editorRefresh=ts=>{` | l. 2703, `f51b53a9c92f` | `  VIEWS['devis'].editorRefresh=ts=>ch02aRefresh(X,ts);` |
| A11 | 1 | `  const fac=o=>{ if(!filter) return 1;` (ligne entière) | l. 2526, `263bbc3645e8` | nouvelle règle du filtre (§ 4.5) |
| L1 | 4 | `VIEWS['devis']={` … `};` (avant `async function dvOpen(id){`, qui reste intact : CH-10 P2) | l. 2548-2572, `f63f85afb5d3` | vue module : `DV.open` → `dvEditor`, sinon `ch02dList(box,{mode:'module'})` ; `refresh` équivalent |
| L2 | 4 | `function dvEditDoc(p,d,after){` … dernière ligne de `dvDuplicate` (`… toast('Devis dupliqué.'); }`) | l. 2574-2594, `2e8c0d02e862` | `function dvEditDoc(p,d,after){ return ch02dEditDoc(p,d,after); }` ⏎ `async function dvDuplicate(d){ return ch02dDuplicate(d); }` |
| A1 | 4 | `  if(d==='Devis général'){ C.append(` | l. 1561 (ligne `283514685de6`) | préfixe inséré : `  if(d==='Devis général'&&typeof ch02dDomain==='function'){ ch02dDomain(C,top,pane,p); return; }` + l'ancienne ligne intacte (la suivante, contrôle des coûts, est à CH-07) |
| A2 | 4 | `['devis','Devis']` | l. 345 | `['devis','Mes devis']` (décision n° 3 du § 11 ; CH-10 n'y touche pas) |
| S1 | 3 | serveur : `PROTECTED_IF_EDITED \|= {"statisticalvalue", "constructionpart", "constructioncomponent", "ebkpelement", "ebkptobkp"}` | l. 61 | ligne **ajoutée** après (§ 3.5) |
| S2 | 4 | serveur : `             "projecttenderer", "devisdocument", "soumission", "soumissiondoc", "soumissionhist"}` | l. 48 | ligne **ajoutée** après (§ 3.5) |
| X1 | 3 | `extraire.sh` : `python3 $HERE/convertir_devis.py $TMP/raw_devis $OUT/documents/costestimate.json --entetes $OUT/tables/APP.COSTESTIMATEDOCUMENT.csv` | l. 39 | ligne ajoutée après (§ 3.5) |

Les lots 2 et 3 **n'ajoutent aucune ancre** dans `DeltaSub.html` (hors A0) : ils s'accrochent aux points d'extension du lot 1. Les compléments C1 à C4 du lot 1 ne touchent que `ch02a.js`.

**Fonctions existantes réutilisées, sans modification** : `h`, `esc`, `num`, `cmp`, `toast`, `ibtn`, `popMenu`, `dialog`, `confirmDlg`, `ivAsk`, `ctMsg`, `ctBseq`, `ctBox`, `ctOk`, `ctCopy`, `formRows`, `readK`, `tI`, `nI`, `seg`, `grid`, `phead`, `col`, `copyTable`, `csvTable`, `matchQ`, `dfr`, `dLong`, `today`, `projects`, `projLabel`, `pickProject`, `mgPF`, `mgPFlist`, `mgPFlabel`, `mgPFdialog`, `ecR`, `evalQ`, `dvLine`, `dvCompute` (hors A11), `dvOuvCodes`, `dvPartExcl`, `dvHonPct`, `dvNewParts`, `cfcParent`, `cfcCmp`, `cfcLevel`, `dvPrint` (repli), `dvCsv`, `tplNeed`, `tplReady`, `tplFont`, `tplPageHTML`, `tplFieldValue`, `svJeu`, `svDpFind`, `svDpHTML`, `svDpDocHTML`, `svRowStyles`, `svImg`, `svC`, `svMember`, `svStaffOfUser`, `svReportCtx` (modèle), `DS.*`. Socle CH-01 (si intégré) : `ch01aTplPick`, `ch01aPrep`, `ch01aView`, `ch01aTexts`, `ch01aCtx`, `ch01aMoOuv`. API CH-03 (si intégrée) : `ch03aPdfDispo`, `ch03bNouveauPdfDlg`, `ch03aDossier`, `ch03cPdfZone`. Modèles de structure : `ecList`, `ecDomain`, `ecqPickDocument`, `ecqImportedContent`.

**Aucune modification** de `dvIntro`, `dvAdd`, `dvPrint`, `tplPrint`, `tplFind`, `svDp*`, `mgPrint`, `ecqPickDocument`, des lignes partagées `HEAVY` (l. 161) et collections vides (l. 181).

---

## 10. Plan en lots

La fiche prévoyait 6 lots ; ils sont fusionnés en 4 : lot 1 = fiche 1 + filtre de la fiche 2 ; lot 2 = présentations et sauts de la fiche 2 + exports de la fiche 5 ; lot 3 = fiche 3 ; lot 4 = fiches 4 et 6. Taille totale : **L**. Les noms des points d'extension du lot 1 fixent l'affectation des fonctions : `ch02b*` au lot 2, `ch02c*` au lot 3, `ch02d*` au lot 4.

### Lot 1 — Fenêtre du devis : menus, commandes d'édition, fenêtre Calcul, filtre, modes, Paramètres du devis (préfixe `ch02a` / `CH02A`)

- **État** (18 h 45) : **construit avec les compléments C1-C4** (`ch/CH-02/lot1/ch02a.js` = `lot1.js`, 85 déclarations ; `lot1_integration.md` : A0, R1, R3 à R9, A11 ; `lot1/integration_complements.md`, `integration_relecture2.md`), **228 contrôles jsc** (`lot1_test.js`), relu deux fois ; **non intégré**. À intégrer en premier.
- **Contenu à ajouter** (dans `ch02a.js`, sans nouvelle ancre) :
  - **C1** quantité de formule arrondie à 3 décimales partout où `l.qte` est tiré de `evalQ` (§ 4.4) ;
  - **C2** `ch02aSettings(X)` : fenêtre « Paramètres » à 4 catégories (§ 4.6), `reglages.date` (lecture de `source.date`, `ch02aDate(E, doc)` pure), recalcul des lignes si « Arrondi » change (`ch02aRecalcCalc(E, R)` pure) ; clé ▾ « Paramètres … » → `ch02aSettings(X)` ;
  - **C3** `ch02aSaveNow` : plus d'opération sur `costestimatedocument` (ni date, ni utilisateur) (n° 29) ; retirer la reprise « en-tête seul modifié ailleurs » devenue sans objet ;
  - **C4** fin de `ch02aMount(X)` : appel de `ch02cMount(X)` s'il existe (n° 45) ;
  - mise à jour de `test_ch02a.js` (T21 à T24), de `lot1_integration.md` (régénéré par `gen_integration.py`) et essai navigateur B1-B10, B23, B24.
- **Dépendances** : aucune.

### Lot 2 — Ancien format : présentations, aperçu et sauts de page, réglages, Feuille de position, Honoraires, Importer les présentations ; exports RTF et FastTrack (préfixe `ch02b` / `CH02B`)

- **État** (18 h 45) : **construit** (`lot2/ch02b.js` = `lot2.js`, 104 déclarations ; `lot2_integration.md` : A0 seule ; 104 contrôles jsc ; essai `lot2prev/`) ; **relecture contradictoire non faite** (`lot2rev/` vide) : à faire avant intégration.
- **Fichiers** : `ch/CH-02/lot2/ch02b.js`, `build.py` (A0 seulement), `test_ch02b.js` (+ extraction et effacement de fixture), `integration.md`.
- **Contenu** :
  - `ch02bDocMenu(X)` (§ 4.7, libellés et séparateurs exacts), `ch02bAddPres`, `ch02bRenamePres`, `ch02bDelPres`, `ch02bDefaultDisplay()` (77 valeurs), `ch02bDefaultHon()` ;
  - moteur pur `ch02bModele(pres, p)` (résolution § 5.1 A), `ch02bBook(...)` (pages, lignes, récapitulatifs, totaux, sauts, filtre, arrondis spéciaux), `ch02bHonBook(...)` (§ 5.2), `ch02bRowsHTML`, `ch02bBookHTML` (via `tplPageHTML`, champs `ctx.fields`) ;
  - `ch02bPreview` (navigation, zoom, impression `iframe`, menu du saut de page, messages `msg1`-`msg3`), `ch02bPresPrefs` (7 catégories, règles d'activation, sélecteur de modèle `formtemplate`), `ch02bPosSheet` (44 réglages forcés), `ch02bHonPreview` et `ch02bHonPrefs` (5 catégories) ;
  - `ch02bImportPres(X)` (§ 4.12) ;
  - `ch02bExport(X)`, `ch02bExportDesc(X)` et les générateurs purs `ch02bRtf`, `ch02bRtfDesc`, `ch02bFastTrack` (§ 4.13).
- **Tests** : T12, T13, T25-T27, T20 ; essai B11-B15.
- **Dépendances** : lot 1 intégré (contexte `X`, points d'extension, `ch02aPickEstimate`, `ch02aR`, `ch02aFilterMsg`, `ch02aCanEdit`, `reglages.date`).

### Lot 3 — Nouveau format : panneau Documents, Devis général, Honoraires, Devis descriptif, reprise des `.dpdoc` du bureau (préfixe `ch02c` / `CH02C`)

- **État** (18 h 45) : **en cours** (`lot3/ch02c.js` = `lot3.js`, 80 déclarations ; convertisseur, diffs serveur et `extraire.sh`, tests jsc et Python écrits ; essai `lot3prev/`) ; **note d'intégration `lot3_integration.md` absente** : le lot n'est pas livrable tant qu'elle n'est pas écrite et que la relecture n'est pas faite.
- **Fichiers** : `ch/CH-02/lot3/ch02c.js`, `build.py` (A0) ; `serveur_deltasub.py` modifié (S1) + diff ; `convertir_docs_devis.py` (nouveau, pour `outils_deltaproject/`) ; `extraire.sh` modifié (X1) + diff ; tests jsc et Python.
- **Contenu** :
  - `const CH02C_HEAVY=HEAVY.push('costestimatedpdoc');` (§ 3.5) ;
  - `ch02cMount(X)`, `ch02cToggleDocs(X)`, `ch02cDocPane(X)` : tableau, « Nouveau » ▾, « Supprimer » ▾, réglages (25 options, règles d'exclusion), branchements CH-03 conditionnels (§ 4.14) ;
  - `ch02cOpen(X, genre)` : copie du modèle (`ch01aTplPick` si le socle CH-01 est intégré au début du lot, sinon `svDpFind`), messages, rendu (`ch01aView` + `ch01aTexts` avec `save` propre, sinon visionneuse propre) ; `ch02cErase(X, genre)` ;
  - fournisseurs de données purs : `ch02cFields`, `ch02cEstimateTable` (dont `writeDetails` et ses 3 branches), `ch02cSummaryTable`, `ch02cInfoTable`, `ch02cSubprojectTable`, `ch02cHonorarTable`, `ch02cDescTable`, `ch02cSpecialRound`, `ch02cFmtValue`, `ch02cFmtPct`, `ch02cFilterText` (§ 5.3 à 5.6) ;
  - convertisseur : lit `Costestimate/<P>/<D>/documents/{estimate,honorar,desc}.dpdoc` (zip : `report.json`), écrit `{"costestimatedpdoc": {"<D>/<genre>": {ID, DOCUMENT_ID, PROJECT_ID, genre, doc:{nom:<libellé de la ligne>, type, jeu:null, fichier:null, templateDesc:'', report, creeLe:<date du fichier>, creePar:null}, source:{fichier, date}}}}` pour les devis présents dans l'en-tête ; lecture seule de `DELTAprojectFiles` ; au rendu, `jeu:null` → `svJeu(p)`.
- **Tests** : T14-T16, T28, T20 ; comparaison visuelle du document 7801 avec son PDF du bureau (13 pages, « RÉCAPITULATION ») ; essai B16, B17 ; essai d'import complet sur une copie de base (`--importer-deltaproject` sur une extraction de test) pour vérifier la conservation d'un document modifié dans DeltaSub.
- **Dépendances** : lot 1 intégré ; lot 2 facultatif ; socle CH-01 lot 1 **facultatif** (vérifier au début du lot s'il est intégré dans `DeltaSub.html`, sinon `svDpFind` / `svDpHTML` sans les modifier) ; API CH-03 facultative (entrées PDF grisées sans elle).

### Lot 4 — « Mes devis » et domaine d'affaire, fiche, Dupliquer, corbeille, Dupliquer et modifier la subdivision, import d'une affaire, navigateur, historique (préfixe `ch02d` / `CH02D`)

- **État** (18 h 45) : **construit et relu** (`lot4/ch02d.js` = `lot4.js`, 67 déclarations ; `lot4_integration.md` : A0, L1, L2, A1, A2, A3 dans `ch02aBar`, S2 ; 103 contrôles jsc ; `lot4rev/`, essai `lot4prev/`) ; **non intégré**.
- **Fichiers** : `ch/CH-02/lot4/ch02d.js`, `build.py` (A0, L1, L2, A1, A2) ; `serveur_deltasub.py` modifié (S2) + diff ; tests jsc.
- **Contenu** :
  - `const CH02D_HEAVY=HEAVY.push('costestimatehist');` ;
  - `ch02dList`, `ch02dDomain`, vue module (L1), ouverture avec `DV.back`, corbeille (§ 4.15) ;
  - `ch02dEditDoc` (valeurs initiales et cases du n° 46, présentation « Standard »), `ch02dDuplicate` (copie des documents du lot 3 si la collection existe) ;
  - `ch02dMatchStructure` (fiche, `msg3` à `msg6` avec leurs titres, « Modifier les ouvrages », `ch02dRemap` et `ch02dFlatten` purs) (§ 4.16) ;
  - `ch02dImportFromProject` (`ch02aPickEstimate`, catalogue, `msg1a-c`, rattachement des ouvrages, `ch02dFlattenImport` pur) (§ 4.17) ;
  - `ch02dNavigator` (pré-contrôle, « Choix du CFC ^0 », `ch02dNavRows` pur) (§ 4.18) ;
  - `ch02dHistOps`, `ch02dHistDone`, `ch02dLastVersion` (§ 4.19) ; horloge `X.now()`.
- **Tests** : T17-T19, T29, T30, T20 ; essai B18-B22.
- **Dépendances** : lot 1 intégré (contexte, `ch02aPickEstimate`, points d'extension) ; lot 3 facultatif (copie et suppression des documents) ; coordination CH-10 lot 3 (verrou sur `dvOpen`, ancre distincte).

### Non livré (et pourquoi)

| Élément | Raison |
|---|---|
| Import et export `.deltakv` | objets Java sérialisés ; un seul fichier au bureau, de 0 octet ; usage nul (D18) ; entrées visibles et grisées |
| « Créer un PDF comme jointe au document », « Ouvrir PDF », « Effacer le PDF », liste « Fichiers PDF » | stockage des fichiers : CH-03 (branchés par le lot 3 si l'API existe) |
| Modification du document `.dpdoc` (colonnes, sections, sauts du document) | éditeur de modèles et d'états : CH-14 |
| Paramètres ▸ « Paramètres … » (`FormPreferencesDialog`, préférences de l'utilisateur pour les nouveaux devis) | réglages par utilisateur : CH-08 ; les nouvelles présentations prennent les valeurs par défaut de `Display` |
| Reprise de l'historique Deltaproject (15 431 versions, 1,10 Go) | D12 arrêtée par défaut ; consultable en lecture seule dans `DELTAprojectFiles` |
| Texte riche du descriptif | 0 usage (E15) |
| Verrou de document « Document verrouillé » | CH-10 lot 3 |
| Contrôle de licence, mode d'évaluation (`msg12`), bouton Comparer (masqué), ancien Devis descriptif (code mort), `MatchSubprojectDialog` (jamais affiché) | sans objet dans DeltaSub ou absent de l'original |
| Correctifs du § 8 | hors fiche |

---

## 11. Décisions restantes pour Paulo

1. **D12 (arrêtée par défaut)** : pas de reprise de l'historique Deltaproject ; historique DeltaSub de 5 versions, au plus une toutes les 10 minutes d'édition, avec choix et confirmation à la restauration. Variante : conserver plus de versions (10, 20 ; ≈ 40 Ko par version).
2. **D18 `.deltakv`** : **par défaut, non reproduit** (usage nul) ; variantes : import serveur des vrais fichiers (Java de `DELTAproject.app`, `Ser2Json`, `convertir_devis.py`) ou export propre à DeltaSub (JSON zippé, incompatible avec Deltaproject).
3. **Module « Mes devis »** : remplacer la vue actuelle (affaires à gauche, devis de l'affaire à droite) par la liste fidèle des devis **de l'utilisateur** (22 devis vivants pour l'utilisateur de l'essai), les devis de l'affaire restant accessibles par le domaine « Devis général » ? **Par défaut : fidèle**, libellé « Mes devis ». Variante : garder la vue actuelle sous « Devis » et n'ajouter que le domaine.
4. **Reprise des 59 documents `.dpdoc` du bureau** (retouches de colonnes et de pages conservées ; documents modifiés dans DeltaSub protégés) : **par défaut, oui** (lot 3). CH-01 a choisi l'inverse pour ses 719 documents ; pour le devis, la reprise coûte peu et garde 24 mises en page qu'aucun écran DeltaSub ne sait refaire.
5. **TTC au centime dans les devis sans « Arrondi »** (l'original garde la valeur exacte) : **par défaut, centime** (E1).
6. **« Modifier la TVA » sur tout le devis**, lignes à 0 % comprises (51 au bureau) : **par défaut, fidèle** ; variante : ne modifier que les lignes dont le taux n'est pas 0.
7. **En-tête non modifié par l'enregistrement** (n° 29) : la colonne « Date » de la liste ne montre plus la date de dernière modification mais la date du document (fiche), et l'auteur ne change plus. **Par défaut : fidèle** (aligné sur la décision D-10.12 de CH-10) ; variante : garder la mise à jour de la date seule.
8. **Défauts de l'original corrigés** (E16 descriptif répété à l'aplatissement, E17 case « subdivisions » de Dupliquer, E14 présentation n° 0, E6 montant soumis illisible) : **par défaut, corrigés** ; variante : reproduire à l'identique.
9. **Ordre d'intégration** (information, pas de décision) : lot 1, puis lots 2, 3 et 4 dans n'importe quel ordre (indépendants entre eux) ; chaque `build.py` part du `DeltaSub.html` du dépôt et échoue proprement si une ancre a disparu.

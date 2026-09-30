# Cahier des charges — CH-10 « Fonctions transverses, conformité de navigation et reliquats » dans DeltaSub : barre de menus, exports, modèles, Bâtiment, Veille

**Version 2 du rédacteur critique, 30.09.2026 (après-midi).** Elle remplace la version de 12 h 29 (conservée dans `research/spec_19_menus_exports_v1_1229.md`). Elle intègre les deux recherches révisées du chantier (`ch/CH-10/rech_orig.md` version 2 de 13 h 49, `ch/CH-10/rech_exist.md` version 2 de 13 h 45), la révision de `spec_18` (CH-08, 13 h 30 : la barre de menus revient à CH-10), la révision de `spec_17` (CH-03 : la corbeille du contrôle des coûts va à CH-07), la fiche CH-10 de l'inventaire (`research/inv/inventaire_modules.md`, § 12.2, matrices F et G, § 16) et les cahiers voisins `spec_13` à `spec_18`. Chaque point contesté a été retranché à la source (bytecode, `Strings.db`, données) ; la liste des changements est au § 12.

Ce cahier décrit comment ajouter à `DeltaSub.html` :
- la **barre de menus** de la fenêtre principale de Deltaproject 16.05 (`deltaproject.AppForm.initMenu`) et un menu **Edition** demandé par Paulo ;
- la **conformité de la barre des modules** (Affichage, ordre, libellés, Administrateur sous Réglages) ;
- l'**Export des données** (`DataExportDialog`) ;
- l'**import des anciens modèles** (`TemplateImport`) et le **changement de police de tous les modèles d'un groupe** (`form.ChangeFontDialog`) ;
- l'**enregistrement des diagrammes en PNG** (`util.Charts`) ;
- la **protection** et le **verrou** des documents Bâtiment (`*.data.Rights`, `DocumentLockDialog`) ;
- la **synchronisation d'adresse** du contrôle des coûts (`costcontrol.AddrSynchDialog`) ;
- la **Veille** (`ModuleSelectionDialog`) ;
- la correction du **presse-papier** sur les postes du bureau.

Il répond à la demande de Paulo du 30.09.2026 : « une barre de menus (Fichier, Édition, Aide…) » et « les exports ».

**Conventions**
- **[P] PROUVÉ** : bytecode `Classe.méthode@offset` (désassemblages `ch/CH-10/jp/`, `ch/CH-10/crit/jp/`), libellé `Strings.db (classe|id)` (colonne `fr`), donnée de la base de test (copie `.backup` de `dstest`, séquence 680), ou **exécution du code original** (jshell de `research/jrun` sur `util.jar`, `db.jar`, `app.jar` : `crit/ctl_csv.jsh`, `crit/ctl2.jsh`).
- **[D] DÉDUIT** : interprétation cohérente, non démontrée ligne à ligne ; le lot concerné la vérifie avant de coder.
- **[C] CHOIX** : décision de conception pour DeltaSub, signalée à Paulo (§ 7 et § 11).
- Dans les tableaux, une barre verticale qui fait partie d'un texte ou d'un code est écrite `\|` (échappement Markdown) ; le texte réel est `|`.

**Références.**
- `DeltaSub.html` du dépôt au 30.09.2026 après-midi : 14 522 lignes, md5 `b5db79206029ddfe413a4ec83bcd3858` (HEAD `9c9a3f9`, CH-17 intégré).
- `serveur_deltasub.py` : 431 lignes, md5 `20c0933d385f03f71d47e51202d03c3c`.
- `outils_deltaproject/convertir_modeles.py` : 377 lignes ; `outils_deltaproject/convertir_couts.py` (correspondance du contrôle des coûts).
- Les chantiers parallèles modifient ces fichiers : **seules les ancres textuelles et l'empreinte du § 9 font foi**, les numéros de ligne sont indicatifs. Toutes les ancres ont été recontrôlées sur la version ci-dessus (`research/crit19/verif_ancres_v2.py` : « TOUT OK »).

**Aucune donnée personnelle** : identifiants (APPUSER.ID, ID de documents, de contacts, de lignes), compteurs, sommes, empreintes SHA-1 et libellés d'interface seulement. Les scripts de vérification n'impriment jamais de nom ni de contenu. **Aucun contenu CRB.**

**Fichiers de vérification de ce cahier**
- `ch/CH-10/crit/` (première rédaction, réexécutés) : `ref_export.py` (référence des trois exports, sans rien écrire), `ref_sync.py`, `ctl_csv.jsh` et `ctl2.jsh` (code original exécuté), `t_jdouble.js` (algorithme JavaScript de `Double.toString`, jsc 14/14), `jp/` (désassemblages complémentaires, dont `deltaproject.form.TextEditorDialog`, `aq.form.Editor`, `util.table.TablePopup`, `db.Contact` ajoutés pour cette version).
- `research/crit19/` (cette version) : `verif_ancres_v2.py` (unicité des 30 ancres, empreinte E2, préfixes libres dans la page, le serveur et les 235 fichiers des autres chantiers), `ref_remap.py` (règle de remplacement exacte de la synchronisation d'adresse, compteurs seulement), copie de la base `deltasub.sqlite` (séquence 680, valeurs de contrôle identiques à celles des recherches).

---

## 0. Synthèse

1. **Barre de menus.** L'original a **quatre menus : Fichier, Affichage, Réglages, Aide**, dans cet ordre, et **aucun menu « Edition »** dans la fenêtre principale [P]. Paulo le demande : DeltaSub ajoute un menu **Edition** entre Fichier et Affichage, **annoncé comme extension** et retirable par une constante. Son titre et son contenu viennent du menu Edition que l'original a dans ses propres éditeurs : « Edition », Annuler, Rétablir, Couper, Copier, Coller, Tout sélectionner [P `form.TextEditorDialog`, `Strings.db (form|form)`]. Il est complété par les deux commandes de tableau de l'original.
2. **Propriétaire de la barre : CH-10 lot 1**, confirmé par la révision de `spec_18` (arbitrage 2). CH-08 fournit les fonctions `rg*` (droits, Paramètres système, Gestion des utilisateurs, Préférences, Configurer un collaborateur, Aide, A propos de). CH-10 les résout par `typeof` ; une entrée sans fonction est **grisée avec la mention du chantier**. Les entrées sans objet sont omises : licences CRB, mises à jour, Support, DELTAprojectFiles, [Dev], Export iOS (D9), Quitter.
3. **Affichage.** Masquer / Afficher la barre des modules (bascule non mémorisée), Ouvrir les modules, Fermer les modules. **Le groupe du module actif ne se replie jamais** (veto de l'original). Un clic sur le logo ferme les modules. Les raccourcis ⌘M, ⌘T et ⌘⇧T sont réservés par le navigateur : ils ne sont ni armés ni affichés.
4. **Conformité de navigation** :
   - « Tous les collaborateurs » passe en 2e position ;
   - « Administrateur » quitte la barre des modules et s'ouvre par **Réglages ▸ Administrateur …** ;
   - le domaine d'affaire devient « **Offres d'honoraires** ».
   « Mes devis » reste à CH-02 lot 4, et la séparation des groupes de modèles à CH-12.
5. **Presse-papier.** Les 4 commandes de copie qui appellent `navigator.clipboard` sans repli échouent sur les postes (`http://<Mac-Studio>.local:7790/` n'est pas un contexte sécurisé). Elles passent par `ctCopy`, qui existe déjà. Un seul chantier s'en charge : CH-10 lot 1.
6. **Export des données** (Réglages) : **3 exports et non 4**, car « adresses pour DELTAbauad » est un libellé que plus aucune classe ne référence [P].
   - Colonnes : adresses 35, rapports d'heures 19, frais d'affaires 19.
   - Format : CSV **UTF-16 gros-boutiste avec BOM**, `;`, tous les champs entre guillemets, fin de ligne LF, fichier « Export.csv ».
   - Formats Java exacts (nombres `8.0`, `1.0E7`, booléens « oui »/« non »), établis **en exécutant le code original**.
   - `lockExportAllAddresses` est **obsolète** (jamais lu) ; le droit `contactExport` est **sans effet** dans l'original.
7. **Importer les modèles** (Fichier) : archive `.zip` d'anciens modèles DESIGN, **jamais d'écrasement**. Le **serveur** lit l'archive en réutilisant `convertir_modeles.py` ; la page crée ensuite les groupes, modèles et pages manquants en un seul `DS.commit`.
8. **Police de tous les modèles** (anciens modèles, roue ▾) : remplace la police de tous les textes, champs et tableaux du groupe, dans toutes les langues ; message « Cette opération ne peut pas être annulée. ».
9. **Diagrammes** : `mgSaveChart` passe du SVG au **PNG à double résolution**, légende comprise ; le nom est tiré du titre du diagramme.
10. **Bâtiment** :
    - **protection** `areBauadDocsLocked` active dans l'eCCC et le contrôle des coûts, avec l'auteur conservé à l'enregistrement (le Devis relève de CH-02 lot 1) ;
    - **verrou d'ouverture** « Document verrouillé » étendu au Devis, au contrôle des coûts et à l'eCCC (collection `documentlock`, sans modifier le serveur), avec une API générique réutilisable par CH-11 ;
    - **« Synchroniser l'adresse … »** dans COMPTES D'ENTREPRISE du contrôle des coûts, selon la règle exacte de l'original.
11. **Veille** : bouton lune dans les fenêtres Bâtiment ; navigation restreinte à ADRESSES et HEURES, avec un bouton « Reprendre » ; le document reste ouvert et verrouillé.
12. **Reliquats de la Planification RH** : l'écart de l'Analyse 6 et le bandeau « aucune planification saisie » sont **déjà en place** ; il ne manque que la confirmation de Paulo.
13. **Aucun document imprimé** n'appartient à ce chantier. Ses sorties sont des CSV, des PNG et des pages XML DESIGN.
14. **Plan en 4 lots** : `ch10a` barre de menus, Edition, Affichage, navigation, presse-papier (préalable de CH-08) ; `ch10b` exports, modèles, police, PNG ; `ch10c` protection, verrou, synchronisation ; `ch10d` Veille (§ 10).

---

## 1. Arbitrages entre les sources (tranchés à la source)

| # | Sujet | Affirmations en présence | Verdict | Preuve |
|---|---|---|---|---|
| 1 | Menu « Édition » | Paulo : « Fichier, Édition, Aide… » ; tâche : « Édition s'il existe » | **Absent** de la fenêtre principale : la barre est Fichier (s'il n'est pas vide), Affichage, Réglages, Aide. « Edition » n'existe que dans les fenêtres de document Bâtiment et dans les éditeurs d'anciens modèles. **[C]** La demande prime : menu ajouté comme **extension** (§ 4.2), constante `CH10A_EDITION` | [P] `AppForm.initMenu@1427-1488` (`menuFile`, `menuView`, `menuExtras`, `menuHelp`) ; `Strings.db (AppForm)` n'a aucun `menuEdit` ; `setJMenuBar` seulement dans `KvDialog`, `CostControlDialog`, `CostPlanningDialog`, `devis18.DevisDialog`, `devis.DevisDialog`, `form.TextEditorDialog`, `form.TemplateDialog`, `form.DocumentDialog` |
| 2 | Titre et contenu du menu Edition | brouillon de 12 h 29 : « Édition » ; Couper, Copier, Coller, Tout sélectionner | Titre **« Edition »** (orthographe de l'original, sans accent) ; entrées dans l'ordre de l'éditeur de texte de l'original : **Annuler, Rétablir, —, Couper, Copier, Coller, —, Tout sélectionner**, puis (DeltaSub) —, les deux commandes de tableau | [P] `form.TextEditorDialog.initComponents@499-668` (Edit, Undo, Redo, séparateur, Cut, Copy, Paste, séparateur, Select All) ; `Strings.db (form\|form)` : Edit « Edition », Undo « Annuler », Redo « Rétablir », Cut « Couper », Copy « Copier », Paste « Coller », SelectAll « Tout sélectionner » ; `Strings.db (costestimate\|KvDialog\|editMenu)` « Edition » |
| 3 | Commandes de tableau | — | « Copier le contenu du tableau dans le presse-papier » **sans** « … », « Exporter le tableau dans un fichier CSV … » **avec** « … » | [P] `util.table.TablePopup.<init>@32-37` (`mapString`), `@83-88` (`mapStringWithEllipsis`) ; `Strings.db (util.table\|TablePopup)` |
| 4 | Propriétaire de la barre de menus | `rech_exist` v2 Q1 : conflit `spec_18` (CH-08 lot 1, `ch08aMenuBar`, contrat `dsMenu_*`) / `spec_19` (CH-10 lot 1) | **CH-10 lot 1.** `spec_18` révisé (13 h 30, arbitrage 2, § 4.1) s'y range, fournit les noms `rg*` et fait de CH-10 lot 1 le **préalable** de CH-08 lot 1. Il reste dans `spec_18` des traces de la première rédaction à retirer (§ 8 n° 1) | `spec_18` § 0 n° 1-2, § 1 n° 2, § 4.1, l. 12 |
| 5 | Noms des fonctions de CH-08 | brouillon : `rg*` seulement ; `spec_18` § 9.3 : « la barre de CH-10 appelle `ch08aSysPrefs`… » | Les deux : chaque entrée résout une **liste** de noms, `rg*` d'abord, puis le nom de travail de CH-08 (`ch08aSysPrefs`, `ch08bUserAdmin`…) ; le premier trouvé l'emporte | `spec_18` § 4.1 (contrat `rg*`, enveloppes d'une ligne), § 9.3 |
| 6 | Place de « Export des données » | spec_1 § 1.1 : menu Fichier | **Réglages**, après les emplacements, si le droit `adminDataExport` est accordé | [P] `initMenu@815-876`, `AppForm$18` |
| 7 | Nombre d'exports | fiche et matrice G : 4 (dont « adresses pour DELTAbauad ») | **3** : « Exporter les adresses », « Exporter les rapports d'heures », « Exporter les frais d'affaires ». `export1` à `export4` et `exportProperties` ne sont référencés **par aucune classe** : aucun fichier `.class` de `DELTAproject.jar`, `DELTAbauad.jar`, `db.jar`, `app.jar`, `doc.jar`, `util.jar`, `aq.jar` ne contient la chaîne `export2` | [P] `DataExportDialog.<init>@86-191` (ldc `exportContacts`, `exportTimeLog`, `exportProjectCost`) ; `jExportButtonActionPerformed@0-101` (3 branches) ; recherche binaire refaite pour cette version |
| 8 | `lockExportAllAddresses` | fiche : verrou de l'export ; bureau `[YES]` | **Obsolète** : la chaîne n'apparaît que dans `db/admin/Setting.class` (`removeOldSettings`, méthode appelée par aucune classe). Rien à reproduire | [P] recherche binaire refaite (seul fichier : `Setting.class`) |
| 9 | Droit `contactExport` (3,4) | CH-08 `rech_orig` § 12.1 : « Exporter » inactif sans le droit ; CH-10 : sans effet | **Sans effet** : `<init>` grise « Exporter », puis `checkGuards`, appelé juste après et à chaque bouton radio, fixe `Exporter = adresses ∨ heures ∨ frais` sans retester le droit. **[C]** DeltaSub applique le droit à l'export des adresses (D-10.8) | [P] `DataExportDialog.<init>@229-243` puis `@315` ; `checkGuards@58-81` ; `spec_18` arbitrage 3 d'accord |
| 10 | Format des CSV | `rech_exist` : à établir | Séparateur `;`, **tous** les champs entre `"` (`"` doublé), fin de ligne `\n`, retours à la ligne internes gardés entre guillemets, **UTF-16 gros-boutiste avec BOM `FE FF`**, 1re ligne = en-têtes. Exécution : `"ID";"a""b";"x;y";""⏎"8.0";"0.25";"1.0E7";"1.0E-4";"36.900000000000006";"-0.0";"l1⏎l2"⏎` = 176 octets commençant par `FE FF 00 22 00 49 00 44` | [P exécuté] `crit/ctl_csv.jsh` (`util.csv.CSVWriter`, `OutputStreamWriter(…,"UTF-16")`) ; `exportListCsv@1146-1165`, `ExportCsv.exportContacts@1105-1124` |
| 11 | Nombres, dates, heures | — | `String.valueOf(Double)` de Java 23 (chiffres les plus courts ; décimal si 10⁻³ ≤ \|v\| < 10⁷, sinon `d.dddE±n`) ; dates `dd.MM.yyyy` ; heures `HH:mm`, « ? » si une valeur est négative ; booléens « oui » / « non » en minuscules | [P exécuté] `ctl_csv.jsh`, `ctl2.jsh` ; `Strings.db (rsrc\|Strings\|yes, no)` |
| 12 | Tarifs d'une ligne d'heures | `rech_exist` : `rateAt`, `tlRate` | Premier tarif du groupe de l'activité (ou du collaborateur), dans l'ordre `VALIDFROM` décroissant, avec `VALIDFROM` ≤ date de la ligne ; **cellule vide s'il n'y en a pas**. Les helpers DeltaSub renvoient 0 : non réutilisables tels quels | [P] `TimeLog.getProjectRate@0-34`, `getStaffRate@0-25`, `ProjectRateGroup.getProjectRate(Date)@0-57`, `Staff.getStaffRate(Date)@0-57` |
| 13 | Monnaie des frais | `rech_orig` v1 : « sinon monnaie principale » | `FOREIGNCURRENCYCODE`, sinon `PROJECT.CURRENCY` (ou monnaie principale `mainCurrency` si vide), **vide si le frais n'a pas d'affaire** | [P] `ProjectCost.getCurrency@0-28`, `Project.getCurrency@0-18` |
| 14 | Nom du collaborateur | DeltaSub : `staffName`, `ownerName` | `ContactOwner.getName()` : personne → prénom puis nom (`displayNameFormat` `[NO]` au bureau), parties vides omises ; **autre type → NAME1 seul** ; vide sans personne | [P] `ContactOwner.getName@0-109`, `Contact.getContactOwnerDesc@0-16` |
| 15 | Libellés d'activité, de phase, de frais | DeltaSub `nm()` : repli sur les autres langues | `NAMEFR` **sans repli** (vide s'il est vide) | [P] `ProjectActivity.getName@0-61` |
| 16 | Tri des adresses | `rech_orig` : `compareToIgnoreCase` | Liste [personne liée NAME1, NAME2 ; entité NAME1, NAME2] (valeurs `null` omises), comparée élément par élément ; comparaison Java **par unité de code** (« É » après « Z ») | [P] `Contact.compareContactsAlphabetically`, `addContactStrings@0-38` ; [P exécuté] `"Émile".compareToIgnoreCase("Zoé")` = 111 |
| 17 | Repli du groupe actif | `rech_exist` v1 : repli de tous les groupes | **Veto** : un groupe qui contient le module sélectionné ne se replie pas, ni au clic, ni par « Fermer les modules » | [P] `MenuTree.treeWillCollapse@0-45` (`ExpandVetoException`) |
| 18 | Logo | — | Le bouton-logo appelle `collapseTree` | [P] `AppForm.jDELTAprojectLogoButtonActionPerformed@0-4` |
| 19 | Points de suspension | — | « … » (espace + U+2026) sur les 21 entrées qui ouvrent un dialogue ; **pas** sur les titres de menu, Masquer / Afficher la barre, Ouvrir / Fermer les modules, Aide, Support, Quitter | [P] `rsrc.Strings.addEllipsis@0-20` ; relevé des appels `mapString` / `mapStringWithEllipsis` de `initMenu` et `hideTree` |
| 20 | « Configurer un collaborateur … » | matrice F : droit admin | Condition = version de développement **ou** USERID **égal à « admin »** (ce n'est pas un droit). Au bureau : APPUSER 1 seulement | [P] `initMenu@433-445`, `AppUser.isAdminUserID` |
| 21 | Réglages pour 2752 | `spec_18` § 6.1 (valeur attendue) : Administrateur, —, Paramètres système… sans Gestion des utilisateurs | 2752 est superadministrateur (0,0) : `userAdmin` accordé (`spec_18` § 3.4, « userAdmin : oui »). Réglages = Administrateur …, **Gestion des utilisateurs …**, —, Paramètres système …, Paramètres système … [Ancien document], —, Export des données …, —, Préférences … La valeur attendue de `spec_18` est à corriger (§ 8 n° 2) | [P] `initMenu@535-541` (droit `userAdmin`) ; `spec_18` § 3.4 (tableau « Effet au bureau ») |
| 22 | Bandeau « aucune planification » | `rech_exist` v1 : absent de la page des tuiles de l'Analyse | **Déjà présent** dans `paDomain` : `top.append(...[plBanner(),…` | [P] `DeltaSub.html` (`paDomain`) |
| 23 | Capitales des groupes | `rech_orig` v1 : DeltaSub en casse normale | **Déjà en capitales** par CSS (`.sec{…text-transform:uppercase…}`) | [P] `DeltaSub.html` l. 47 |
| 24 | Nom court de l'adresse | DeltaSub (transferts de la Soumission) : « nom, localité » | `SHORTLABEL` s'il n'est pas vide, sinon [nom de la personne liée] + « , » **sans espace** + [nom de l'entité] ; la virgule n'apparaît que si les deux parties sont présentes | [P] `Contact.getShortContactDesc@0-22`, `getContactDesc@0-70` (constante `,` seule, vérifiée octet par octet), `getContactRelationDesc@0-16` |
| 25 | Synchronisation : correspondance des champs | brouillon de 12 h 29 : « [D] à vérifier dans `convertir_couts.py` » | **Établie [P]** (§ 4.12) ; en particulier : **1re** entreprise seulement ; contrat de 1er niveau (`contratParentId` nul) dont le contact est l'ancien → contrat, **tous** ses paiements et arrêtés, **tous** ses avenants avec leurs paiements et arrêtés passent au nouveau ; un avenant dont le contrat n'a pas l'ancien contact **n'est pas touché** ; écritures et mutations : valeur égale à l'ancien → nouveau ; ordres de paiement non touchés | [P] `AddrSynchDialog.jOkButtonActionPerformed@0-1195` (relevé des appels) ; `convertir_couts.py` : `convert_costcontrol` (entreprises, mutations, écritures), `_contrat`, `_paiement`, `_arrete` |
| 26 | Libellé du menu contextuel | — | « Synchroniser l'adresse … » (avec « … ») | [P] `EntrepreneurFrame` : `ldc addrChangeMenu` + `Rsrc.mapStringWithEllipsis` ; `Strings.db (costcontrol\|CostControlDialog\|addrChangeMenu)` « Synchroniser l'adresse » |
| 27 | Auteur du contrôle des coûts à l'enregistrement | DeltaSub : `USERID:ME.id` à chaque enregistrement | L'original **ne touche pas l'en-tête** à l'enregistrement : l'auteur ne change pas. **[C]** Lot 3 : auteur conservé (sinon la protection n'a plus de sens) | [P] `costcontrol.data.Save.autosave@0-39` (aucun `setUserId`) ; `DeltaSub.html` (`ccEditor`, `const save=`) |
| 28 | « Annuler » dans « Document verrouillé » | Soumission DeltaSub : lecture seule | **Abandon de l'ouverture** pour le Devis, le contrôle des coûts et l'eCCC (fidèle : aucun des trois n'a de lecture seule) ; la Soumission garde son extension déjà livrée | [P] `DocumentLock.tryLock@0-107` (`false` → action abandonnée) |
| 29 | Verrou du Devis | spec_15 (CH-02) : `bseq` à la place du verrou ; fiche : déverrouillage | **Compatibles** : CH-02 détecte les conflits d'écriture, CH-10 lot 3 pose le verrou d'ouverture fidèle (D-10.5) | [P] `plugins.CostEstimatePlugin.openCommand` (`tryLock`) |
| 30 | Presse-papier | `spec_18` A7 (`ch08aCopyText`), brouillon C1 (`ch10aCopyText`), `spec_17` § 8 n° 3 : même ligne `copyTable` ; `rech_exist` v2 : 4 appels sans repli | **CH-10 lot 1, les 4 appels** (`mailList`, `copyTable`, copie d'adresse, copie d'intervenant), par `ctCopy(texte, message)` existant ; aucun nouveau helper. `spec_18` révisé (arbitrage 23) confie `copyTable` à CH-10 | [P] `DeltaSub.html` : `ctCopy` (repli `execCommand` hors contexte sécurisé, déclaration `function` hissée) ; 4 appels sans repli |
| 31 | Corbeille des documents Bâtiment | `spec_17` v1 : CH-10 lot 3 « proposé » ; `rech_exist` v2 Q3 | **Pas dans CH-10** : eCCC et Soumission l'ont déjà ; Devis = CH-02 lot 4 ; contrôle des coûts = **CH-07 lot 3** | `spec_17` révisé § 1 n° 26, § 12 n° 7 |
| 32 | Lot de « Offres d'honoraires » | `spec_16` : « CH-10 lot 4, `ch10e` » ; brouillon : lot 1 | **CH-10 lot 1** (`ch10a`) ; `spec_16` est à corriger (§ 8 n° 5) | fiche CH-10 lot 4 (« Navigation et libellés ») fusionné au lot 1 |
| 33 | Nombre de fenêtres avec Veille | fiche : 19 ; `rech_orig` : 17 | **Les deux** : 17 fenêtres Bâtiment (28 boutons) et 2 dialogues d'affaire (Séances, versions de plan) | [P] `rech_orig` § 6.3 (recherche binaire des appelants) |
| 34 | Retour de Veille | brouillon : noms courts à jour par `ccEntName` | L'original rafraîchit en mémoire `shortName` des entreprises dans 5 écrans du contrôle des coûts, **sans enregistrer**. DeltaSub affiche déjà le nom actuel du carnet (`ccEntName`) : **aucune écriture** au retour [C] | [P] `OverviewFrame.jMoonButtonActionPerformed@0-65` (et 4 autres fenêtres) |
| 35 | Export des diagrammes | inventaire : absent | **Partiel** : SVG dans 6 vues. L'original enregistre en PNG ×2, nom « <titre>[ <suffixe>].png », « : » → « , » ; entrée dans 12 fenêtres | [P] `Charts.saveFXNodeAsImage@0-134`, `saveSceneAsImage@0-61` |
| 36 | Contrôle « début ≤ fin » de l'export | — | **Aucun** dans l'original (fichier réduit à l'en-tête sinon) : reproduit | [P] `jExportButtonActionPerformed@0-101` |
| 37 | Libellé « Mes devis » | fiche CH-10 ; spec_15 A2 (CH-02 lot 4) | **CH-02 lot 4** (le libellé va avec la liste par utilisateur) ; CH-10 ne touche pas `['devis','Devis']` | spec_15 § 9 A2 |
| 38 | ⌥⌃-clic sur un module BÂTIMENT | nouveau (`rech_orig` v2 § 3.3) | L'original affiche alors aussi les documents **marqués comme supprimés** de l'utilisateur (corbeille cachée) ; relève des listes Bâtiment (CH-02, CH-07) : **signalé, non repris** | [P] `MenuTree$1.mousePressed` ; `*Document.findAllByUserId` |
| 39 | Numéros de décision | `rech_orig` v1 : D18 à D24 | Collision avec spec_15 (D18 = `.deltakv`) : **D-10.1 à D-10.13** (§ 11) | spec_15 § 11 |

---

## 2. Périmètre

### 2.1 Reproduit (fidèle)

- **Barre de menus** Fichier, Affichage, Réglages, Aide : entrées, ordre, séparateurs, conditions (droits, réglages, USERID), libellés et points de suspension de l'original.
- **Affichage** : Masquer / Afficher la barre des modules, Ouvrir les modules, Fermer les modules, veto du groupe actif, logo = Fermer les modules.
- **Navigation** : ordre COLLABORATEURS, Administrateur sous Réglages, « Offres d'honoraires ».
- **Export des données** : fenêtre, 3 exports, colonnes, formats, période, tris, encodage.
- **Importer les modèles** : archive `.zip`, création des groupes et des modèles manquants, jamais d'écrasement, message de fin.
- **Changer le style de police de tous les modèles** du groupe sélectionné (anciens modèles), toutes langues ; textes, champs et tableaux.
- **Enregistrer le diagramme …** en PNG ×2.
- **Protection** des documents Bâtiment (règle `areBauadDocsLocked`) pour l'eCCC et le contrôle des coûts, avec les messages exacts ; auteur conservé à l'enregistrement.
- **Verrou d'ouverture** et **déverrouillage** (droit `generalUnlockDocuments` 100,0) pour le Devis, le contrôle des coûts et l'eCCC.
- **Synchroniser l'adresse …** (COMPTES D'ENTREPRISE du contrôle des coûts), remplacements dans tout le document selon la règle exacte.
- **Veille** : accès aux modules ADRESSES et HEURES depuis une fenêtre Bâtiment, sans fermer le document.

### 2.2 Choix DeltaSub

- Menu **Edition** (extension demandée par Paulo, § 4.2).
- Entrées d'autres chantiers **grisées avec la mention du chantier** tant que leur fonction n'existe pas ; entrées sans objet **omises**.
- **Droits** : les conditions de droit passent par `rgCan(code)` de CH-08 lot 1 quand elle existe ; sans elle, toutes les entrées sont visibles (comportement actuel de DeltaSub).
- **Presse-papier** : les 4 copies passent par `ctCopy`, qui se replie sur `execCommand('copy')` hors contexte sécurisé.
- **Export** : téléchargement « Export.csv » par le navigateur (pas de choix de dossier) ; égalités de tri départagées par l'ID.
- **Import des modèles** par le **serveur** (réutilisation de `convertir_modeles.py`) ; modèles modifiés ou importés protégés au ré-import.
- **Verrou** stocké dans une **collection `documentlock`** (création atomique par `bseq`), levé à la fermeture du document ou de l'onglet.
- **Veille** par **navigation restreinte** plutôt que par une fenêtre modale.
- Contrôle des coûts : **auteur conservé** à l'enregistrement, date mise à jour.

### 2.3 Hors périmètre ou non livré

Voir le § 10, « Non livré ».

### 2.4 Place et accès

| Élément | Accès dans DeltaSub |
|---|---|
| Barre de menus | dans l'en-tête `#top`, entre le logo du bureau et la marque « DeltaSub » |
| Export des données | Réglages ▸ Export des données … |
| Importer les modèles | Fichier ▸ Importer les modèles … |
| Police de tous les modèles | Modèles (anciens modèles, les 7 familles) ▸ roue ▾ ▸ « Modifier la police dans tous les modèles du groupe … » |
| Diagrammes | menus « Rapports » existants ▸ « Enregistrer le diagramme … » |
| Verrou | ouverture d'un devis, d'un contrôle des coûts, d'une estimation eCCC |
| Synchronisation | contrôle des coûts ▸ COMPTES D'ENTREPRISE ▸ clic droit sur une entreprise |
| Veille | bouton lune de la barre d'outils quand un document Bâtiment est ouvert |

### 2.5 Frontières avec les autres chantiers

| Chantier | Ce que CH-10 lui offre ou attend | Mode |
|---|---|---|
| **CH-08** (spec_18) | CH-10 lot 1 construit la barre et pose les crochets `ch10aBeforeGo` / `ch10aAfterGo` de `go` ; CH-08 fournit `rgCan`, `rgSystemPreferences`, `rgSystemLegacyPreferences`, `rgHelp`, `rgAbout` (son lot 1), `rgUserAdmin`, `rgBeforeGo` (lot 2), `rgPreferences`, `rgEmployees` (lot 3) | `typeof` ; CH-10 lot 1 est le **préalable** de CH-08 lot 1 |
| **CH-04** | entrées Fichier ▸ Importer des vCards …, Importer des adresses … | `typeof` (`ch04ImportVCards`, `ch04ImportContacts`, noms à confirmer par CH-04 dans `CH10A_MENU`) |
| **CH-13** | Réglages ▸ Emplacements des modèles et des documents externes … (masqué au bureau) | `typeof` (`ch13Paths`) |
| **CH-06** | Réglages ▸ Administrateur … ouvre la vue `config` (identifiant inchangé) | `go('config')` |
| **CH-02** | protection du Devis (`ch02aCanEdit`, lot 1) ; « Mes devis » et sa corbeille (lot 4) ; le verrou d'ouverture du Devis est posé par CH-10 lot 3 sur `dvOpen` | ancres distinctes |
| **CH-07** | corbeille du contrôle des coûts (lot 3) ; peut appeler `ch10cGuard` dans les actions de sa liste | fonction exposée |
| **CH-11** (spec_16) | verrou de l'offre d'honoraires par `ch10cGate` / `ch10cAcquire` / `ch10cRelease` (API générique, § 4.11.6) ; nouvel appel de `mgSaveChart` (profite du PNG) | fonctions exposées |
| **CH-12** | séparation MODELES DOCUMENTS / ANCIENS MODELES (ligne des groupes de `NAV`) ; collection des polices (liste de la police) | ancre N3 idempotente ; `typeof` |
| **EC-2** | libellés « Enregistrer le graphique (SVG) » de l'eCCC, `ecCanEdit` | ancres E6, E7, P1 (changements d'une ligne) |

---

## 3. Modèle de données

### 3.1 Collections

| Collection | État | Lue / écrite | Lot |
|---|---|---|---|
| `setting` | existante | lue : `isModuleFormVisible` (`[YES]` au bureau), `isProjectMenuFilesVisible` (`[NO]`), `areBauadDocsLocked` (`[NO]`), `displayNameFormat` (`[NO]`), `mainCurrency` (`CHF`), `standardFontName`, `standardTableFont*Name` | 1-3 |
| `appuser`, `appuser_appcompanyrole`, `appcompanyrole_approle`, `approle` | existantes | lues (droits, par `rgCan`, sinon `svRight` pour le droit 100,0) | 1-3 |
| `contact`, `contactowner` | existantes | lues (export des adresses, nom court) | 2, 3 |
| `timelog`, `projectcost`, `project`, `subproject`, `projectactivitygroup`, `projectactivity`, `projectrate`, `projectphase`, `projectsubphase`, `projectcostcategorygroup`, `projectcostcategory`, `staff`, `staffrate` | existantes | lues (exports) | 2 |
| `modele` (ID = `categorie/groupe/type/nom`), `modelegroupe` (ID = `categorie/groupe`) | existantes (`HEAVY`) | écrites : import (création, pages ajoutées), police (modification) | 2 |
| `formtemplategroup`, `formtemplate` | existantes (`formtemplate` dans `HEAVY`) | écrites à l'import quand elles manquent : `{ID, CATEGORY, NAME}` et `{ID, TYPE, NAME, FORMTEMPLATEGROUP_ID}`, sans `NAMEFR` ni `SORTORDER`, comme `TemplateImport` [P] | 2 |
| `costcontrol`, `costcontroldocument` | existantes | écrites : synchronisation (contenu + date), enregistrement (auteur conservé) | 3 |
| `costestimatedocument`, `costplanningdocument` | existantes | lues (auteur, protection) | 3 |
| **`documentlock`** | **nouvelle** | `{ID:'<collection>:<id>', T:'<collection>', DOCUMENT_ID, USERID, MODIFIED:'AAAA-MM-JJTHH:MM:SS', SESSION:'<jeton d'onglet>'}` ; ligne supprimée (`val:null`) = document libre | 3 |

- `documentlock` reprend le nom de la table Derby `DOCUMENTLOCK`, qui n'est pas reprise (`SKIP_TABLES`). Le verrou résiduel du bureau (devis 6451, verrou 57305, 06.10.2025) **n'est pas repris** (D-10.11). Un ré-import Deltaproject efface les verrous (collection non protégée) : c'est voulu.
- L'en-tête des documents (`DOCUMENTLOCK_ID`) n'est **pas** utilisé : poser un verrou modifierait l'en-tête, qui deviendrait « modifié dans DeltaSub » et ne serait plus remplacé au ré-import (`PROTECTED_IF_EDITED`).
- `documentlock` n'existe pas au démarrage : le lot 3 appelle `DS.need(['documentlock'])` avant tout contrôle, ce qui la marque chargée et la fait suivre par le sondage (`DS.poll` ne lit que les collections chargées).

### 3.2 Écritures groupées et concurrence

- Un seul `DS.commit` par action ; `bseq` lu à l'ouverture de chaque dialogue (police, synchronisation).
- Création d'un verrou : `bseq` = séquence connue de la ligne (0, ou celle de la ligne supprimée). Si un autre poste l'a posé entre-temps, le serveur répond 409 et le dialogue « Document verrouillé » s'affiche. `DS.commit` montre alors aussi son message générique de conflit (E19).
- Import des modèles : `bseq` = séquence lue au moment de la fusion pour chaque `modele` complété ; `bseq:0` pour les créations.
- Police : un modèle n'est écrit que si au moins un de ses éléments change [P] (`aq.Commands.changeAllFonts` ne réécrit que les fichiers modifiés).

### 3.3 Serveur (lot 2 seulement)

- **Point d'entrée `POST /api/modeles/zip`** : le corps contient les octets de l'archive ; réponse JSON `{"pages":[{categorie, groupe, type, nom, langue, page, val}], "ignores":n, "erreurs":n}`. **Aucune écriture en base.**
- Fonction `ch10_modeles_zip(h)` :
  - importe `convertir_modeles` depuis `HERE/outils_deltaproject` (`sys.path.insert`) et ouvre l'archive (`zipfile`) ;
  - pour chaque entrée `<catégorie>/<groupe>/<type>/<nom…>/<langue>/<page>.xml` dont la catégorie est l'une des 7 (`addressTemplates`, `expensesTemplates`, `labelTemplates`, `managementTemplates`, `projectTemplates`, `staffTemplates`, `timeTemplates`) et la langue un dossier de `LANGUES` (`french` → `fr`…), appelle `convertir_modeles.page(fichier)`, qui accepte un objet fichier (`ET.parse`) ;
  - `nom` = segments entre le type et la langue, joints par « / » (règle du convertisseur) ;
  - les autres entrées sont comptées dans `ignores`, les pages illisibles dans `erreurs`.
  - Limites : corps de 50 Mo au plus (413 au-delà) ; réseau local seulement (`lan_ok`, testé en tête de `do_POST`) ; contrôle de session de CH-08 lot 4 appliqué s'il est intégré (il est placé en tête de `do_POST`).
- **Protection au ré-import** : ligne ajoutée `PROTECTED_IF_EDITED |= {"modele", "modelegroupe", "formtemplate", "formtemplategroup"}`.
  - Les modèles modifiés ou créés dans DeltaSub ne sont plus écrasés par un ré-import : police, import, et déjà aujourd'hui `tplNewGroup`, `tplRenameGroup` et l'éditeur de page. Les autres restent remplacés.
  - `_batiment_edites` et `_projet` s'appliquent sans changement (`_projet` renvoie `None` : pas de conflit d'affaire).
- Pour l'essai navigateur, le dossier du lot contient la copie modifiée du serveur **et** une copie de `convertir_modeles.py` dans `<dossier>/outils_deltaproject/`.

### 3.4 Mémorisation par poste (`localStorage`, lecture et écriture sous `try`)

| Clé | Contenu | Lot |
|---|---|---|
| `ds_nav_open` | existante ; mise à jour par Ouvrir / Fermer les modules | 1 |
| `ds_am_dom` | existante ; l'ancienne valeur « Calcul des honoraires » est convertie | 1 |
| `ds_ch10d_last` | dernier module choisi en Veille (clé propre, comme `LastSelectedDialogNode`) | 4 |

L'état Masquer / Afficher la barre des modules **n'est pas mémorisé** [P] (`hideTree`, aucune préférence) ; les dates de l'export sont gardées pour la session seulement [P] (champs statiques de classe).

---

## 4. Écrans et dialogues

### 4.1 Barre de menus (lot 1)

#### 4.1.1 Disposition et comportement

- **Élément** : `<nav id="ch10a-mb">` inséré par `ch10aInit()` dans `#top`, après `#logo` et avant `#brand`.
  - Titres de menu plats (13,5 px, marge gauche 28 px, `margin-right:auto` pour ne pas se centrer dans `#top`, qui est en `justify-content:space-between`) ; fond `var(--sel)` et texte blanc au survol et quand le menu est ouvert.
  - CSS injecté une seule fois (`<style id="ch10a-css">`, sur le modèle d'`ecCss`), sans toucher au bloc `<style>`.
- **Ouverture** : un clic sur un titre ouvre le menu sous le titre.
  - `popMenu` est réutilisé, avec des éléments `{t:nœud, dis, fn}` ; le menu créé reçoit la classe `ch10a-dd`.
  - Survoler un autre titre pendant qu'un menu `ch10a-dd` est ouvert bascule sur ce menu.
  - Un clic hors du menu ou Échap le ferme (écouteur `keydown` posé une fois par `ch10aInit`).
- **Focus** : un `mousedown` sur un titre ou dans le menu fait `preventDefault()`, pour que les commandes d'Edition agissent sur le champ qui avait le focus.
- **Modèle** : il est reconstruit **à chaque ouverture** par une fonction pure `ch10aModel(X)`, testable en jsc. `X` fournit `can(code)`, `yes(réglage)`, `userId`, `has(nom)`, `navHidden`, `edit` (état du champ actif et du tableau courant), `edition` (= `CH10A_EDITION`).
  - Chaque menu est rendu comme `{titre, items:[{k, t, sc, dis, ch, act} | '-']}` ; `act` est le **nom** de la fonction à appeler (le modèle ne contient aucune fermeture).
- **Séparateurs** : jamais en tête, en fin ni en double. Le menu **Fichier est omis s'il est vide** [P] (`initMenu@1437-1453`) ; les autres menus sont toujours présents.
- **Entrées** :
  - condition fausse : entrée absente [P] ;
  - condition vraie, mais aucune fonction : entrée grisée, suivie à droite d'une mention grise du chantier (« CH-08 », « CH-10 lot 2 »…). Un élément grisé de `popMenu` n'a pas d'infobulle (`pointer-events:none`) : la mention est donc écrite.
- **Raccourcis** : ceux d'Edition sont affichés à droite, en gris, dans un `span` (jamais un `div` : la règle `.menu div` s'appliquerait).
- **Dialogues** : une fenêtre ouverte (`.ov`) recouvre l'en-tête ; la barre est donc inaccessible pendant un dialogue, comme dans une application modale.
- **`ch10aEnable(on)`** grise toute la barre (classe `ch10a-off`) ; la Veille l'utilise (lot 4).

#### 4.1.2 Entrées, dans l'ordre

Libellés : `Strings.db (deltaproject|AppForm)`. « … » = espace + U+2026. Droits : `ch10aCan(code)`. « Réglage » : `hfSet(nom)` contient `YES`.

Les fonctions sont résolues par `typeof window[nom]==='function'`, dans l'ordre de la liste `f`, et le premier nom trouvé l'emporte. Toute la table est une seule constante, `CH10A_MENU` : l'intégrateur n'y change que les noms si CH-04, CH-08 ou CH-13 en retiennent d'autres.

**Fichier** (`menuFile` « Fichier »)

| # | Libellé | Condition | Fonctions (`f`) | Si aucune |
|---|---|---|---|---|
| 1 | Importer des vCards … | droit 3,8 (`contactImport`) | `ch04ImportVCards` | grisée « CH-04 » |
| 2 | Importer des adresses … | droit 3,8 | `ch04ImportContacts` | grisée « CH-04 » |
| — | séparateur | | | |
| 3 | Importer les modèles … | réglage `isModuleFormVisible` **et** droit 9,0 (`design`) | `ch10bImportTemplates` (§ 4.7) | grisée « CH-10 lot 2 » |
| — | *(séparateur + Quitter : omis ; l'onglet se ferme par le navigateur, comme Quitter est absent sous macOS)* | | | |

**Edition** *(extension DeltaSub, § 4.2 ; présent si `CH10A_EDITION`)*

**Affichage** (`menuView` « Affichage », § 4.3)

| # | Libellé | Action |
|---|---|---|
| 1 | Masquer la barre des modules ⇄ Afficher la barre des modules | `ch10aToggleNav()` |
| 2 | Ouvrir les modules | `ch10aExpand()` |
| 3 | Fermer les modules | `ch10aCollapse()` |

**Réglages** (`menuExtras` « Réglages »)

| # | Libellé | Condition | Fonctions (`f`) | Si aucune |
|---|---|---|---|---|
| 1 | Configurer un collaborateur … | `(ME.u\|\|{}).USERID === 'admin'` [P] | `rgEmployees`, `ch08cEmployees` | grisée « CH-08 » |
| 2 | Administrateur … | droit 1,0 (`admin`) | interne : `go('config')` (contenu : CH-06) | — |
| 3 | Gestion des utilisateurs … | droit 2,0 (`userAdmin`) | `rgUserAdmin`, `ch08bUserAdmin` | grisée « CH-08 » |
| — | *(Mettre à jour les licences CRB … : omis, sans objet)* | | | |
| — | séparateur | droit 1,0 [P `@622-633`] | | |
| 4 | Paramètres système … | droit 1,0 | `rgSystemPreferences`, `ch08aSysPrefs` | grisée « CH-08 » |
| 5 | Paramètres système … [Ancien document] | droit 1,0 | `rgSystemLegacyPreferences`, `ch08aLegacyPrefs` | grisée « CH-08 » |
| — | *(Emplacement du dossier DELTAprojectFiles … : omis, sans objet)* | | | |
| 6 | Emplacements des modèles et des documents externes … | réglage `isProjectMenuFilesVisible` (bureau `[NO]` : absente) | `ch13Paths` | grisée « CH-13 » |
| — | séparateur | droit 1,7 [P `@815-835`] | | |
| 7 | Export des données … | droit 1,7 (`adminDataExport`) | `ch10bDataExport` (§ 4.6) | grisée « CH-10 lot 2 » |
| — | *(séparateur + Export iOS … : omis, D9)* | | | |
| — | séparateur | toujours [P `@930`] | | |
| 8 | Préférences … | toujours | `rgPreferences`, `ch08cPreferences` | grisée « CH-08 » |

Le libellé 5 est `mapStringWithEllipsis(systemPreferences)` + `Strings$Label.legacyMenu` (« ␣[Ancien document] ») [P] : « Paramètres système … [Ancien document] ».

**Aide** (`menuHelp` « Aide »)

| # | Libellé | Fonctions (`f`) | Si aucune |
|---|---|---|---|
| 1 | Aide | `rgHelp`, `ch08aHelp` (manuel PDF, CH-08) | grisée « CH-08 » |
| — | *(Support, Gestion des licences DELTAproject …, Gestion des licences CRB …, Rechercher les mises à jour … : omis, sans objet)* | | |
| — | séparateur | | |
| 2 | A propos de … | `rgAbout`, `ch08aAbout` | grisée « CH-08 » |

« A propos de » s'écrit sans accent dans `Strings.db` [P]. L'entrée est placée dans Aide, comme dans l'original hors macOS : DeltaSub n'a pas de menu d'application.

#### 4.1.3 Droits et effet au bureau

`ch10aCan(code)` = `!!rgCan(code)` si CH-08 l'a livrée (son lot 1), sinon **vrai** : toutes les entrées restent visibles, comme les écrans actuels.

Codes utilisés : `contactImport` 3,8 ; `design` 9,0 ; `admin` 1,0 ; `userAdmin` 2,0 ; `adminDataExport` 1,7 ; `contactExport` 3,4 ; `generalUnlockDocuments` 100,0.

Effet au bureau quand `rgCan` existera [P] (données ; règles de `spec_18` § 3.4) :

| Compte | Fichier | Réglages |
|---|---|---|
| 2752 (superadministrateur) | vCards, adresses, —, modèles | Administrateur …, Gestion des utilisateurs …, —, Paramètres système …, Paramètres système … [Ancien document], —, Export des données …, —, Préférences … |
| comptes « Standard » (2753, 2754, 2755, 3001, 3201, 3251, 3301, 3351) | vCards, adresses, —, modèles | Export des données …, —, Préférences … |
| 1 (USERID `admin`, aucune fonction ; `userAdmin` d'office) | absent | Configurer un collaborateur …, Gestion des utilisateurs …, —, Préférences … |
| 2 (`mayday`, aucune fonction) | absent | Gestion des utilisateurs …, —, Préférences … |

#### 4.1.4 Crochets de navigation

`ch10aBeforeGo(id,arg)` et `ch10aAfterGo(id,arg)` sont appelés par `go` (ancres G1 et G2).
- Avant le rendu, dans l'ordre : `ch10dBeforeGo` (Veille), puis `rgBeforeGo` (droits d'accès aux vues de CH-08, qui n'a ainsi pas à ancrer `go`). Le premier qui renvoie `false` annule la navigation.
- Après le rendu : `ch10cAfterGo` (levée des verrous), puis `ch10dAfterGo` (bouton lune).
- Chaque fonction n'est appelée que si elle existe.

#### 4.1.5 Raccourcis

- L'original arme ⌘Q (Quitter, hors macOS), ⌘M (Masquer / Afficher la barre des modules), ⌘T (Ouvrir les modules) et ⌘⇧T (Fermer les modules) [P] (`initMenu@219`, `@283`, `@334`, `@383-388`).
- Dans Chrome et Safari, ces touches réduisent la fenêtre, ouvrent ou rouvrent un onglet avant que la page les reçoive. **[C]** Ils ne sont ni armés ni affichés (D-10.3).
- Les raccourcis de l'Edition (⌘Z, ⇧⌘Z, ⌘X, ⌘C, ⌘V, ⌘A) sont affichés parce que le navigateur les exécute nativement.

### 4.2 Menu Edition (lot 1, extension)

Titre **« Edition »** [P `form|form|Edit`, `KvDialog|editMenu`]. L'ordre des six premières entrées est celui de l'éditeur de texte de l'original [P `form.TextEditorDialog.initComponents@499-668`].

| # | Libellé (`Strings.db`) | Raccourci affiché | Actif si | Action |
|---|---|---|---|---|
| 1 | Annuler (`form\|Undo`) | ⌘Z | un champ modifiable (`input` texte, `textarea`, `contenteditable`) avait le focus | `document.execCommand('undo')` sur ce champ |
| 2 | Rétablir (`form\|Redo`) | ⇧⌘Z | idem | `document.execCommand('redo')` |
| — | séparateur | | | |
| 3 | Couper (`form\|Cut`) | ⌘X | champ modifiable avec une sélection non vide | `document.execCommand('cut')` |
| 4 | Copier (`form\|Copy`) | ⌘C | sélection non vide (champ ou page) | `document.execCommand('copy')` |
| 5 | Coller (`form\|Paste`) | ⌘V | champ modifiable **et** `window.isSecureContext && navigator.clipboard && navigator.clipboard.readText` | `navigator.clipboard.readText()` puis `execCommand('insertText')`. Sinon l'entrée est grisée : sur les postes (`http://<Mac-Studio>.local:7790/`), seul ⌘V fonctionne, et le raccourci affiché le dit |
| — | séparateur | | | |
| 6 | Tout sélectionner (`form\|SelectAll`) | ⌘A | un champ avait le focus | `select()` du champ |
| — | séparateur | | | |
| 7 | Copier le contenu du tableau dans le presse-papier (`TablePopup\|exportTableClipboard`) | — | le tableau courant a des lignes | texte tabulé du tableau courant, puis `ctCopy(texte,'Tableau copié (<n> lignes).')` |
| 8 | Exporter le tableau dans un fichier CSV … (`TablePopup\|exportTableCSV`, avec « … » [P]) | — | idem | même contenu que `csvTable` : UTF-8 avec BOM, `;`, guillemets seulement si la valeur contient `;`, `"` ou un saut de ligne ; fichier `<id de la vue>_<AAAA-MM-JJ>.csv` |

- **Champ cible** : `document.activeElement` au moment du `mousedown` sur le titre ; il garde le focus grâce au `preventDefault()` (§ 4.1.1).
- **Tableau courant** :
  - c'est le `table.g` de `#main` qui contient la ligne sélectionnée (`tr.on`) ; sinon le premier `table.g` visible de `#main` qui a des lignes ; sinon les entrées 7 et 8 sont grisées ;
  - lecture par le DOM : en-têtes = texte des `th`, cellules = `textContent.trim()` des `td`, ce qui équivaut au calcul de `tableText` ;
  - une colonne dont toutes les cellules sont vides de texte et contiennent une icône (`svg`) est exclue : c'est l'équivalent des colonnes d'icône `ty` que `tableText` exclut [C] ;
  - la grille ne garde aucune référence de son objet dans le DOM, et CH-10 ne modifie pas `grid`.
- `CH10A_EDITION=true` ; mis à `false`, le menu disparaît (D-10.1).

### 4.3 Affichage (lot 1)

- **Masquer la barre des modules** : classe `ch10a-nonav` sur `#body` (`grid-template-columns:0 1fr`, `#side` masqué) ; le libellé devient « Afficher la barre des modules ». L'inverse rétablit 230 px et « Masquer la barre des modules » [P] (`hideTree@0-82`). L'état n'est pas mémorisé : au chargement, la barre est affichée.
- **Ouvrir les modules** : toutes les sections `.sec` reçoivent `open` [P] (`expandTree`).
- **Fermer les modules** : toutes les sections perdent `open`, **sauf** celle qui contient l'entrée active (`.item.on` dans le `.sub` suivant) [P] (veto `treeWillCollapse`).
- Ouvrir et Fermer mettent à jour `ds_nav_open` [C], sans quoi un rechargement rétablirait l'ancien état. La clé est le libellé de la section = `s.lastChild.textContent`, le texte qui suit le triangle. Cette règle ne dépend pas de l'ordre de `NAV`, que CH-08 lot 2 filtre par les droits.
- **Veto au clic** : `ch10aVeto(s)` renvoie vrai quand la section `s` est ouverte et contient l'entrée active ; le clic ne la replie alors pas (ancre M4). `go()` ouvre une section fermée par `s.click()` : le veto ne s'applique qu'au repli.
- **Logo** : un clic sur `#logo` exécute « Fermer les modules » [P] ; curseur main.
- Fonction pure testable : `ch10aNavState(sections, active, mode)` → `{libellé: ouvert}`, avec `mode` = `'expand'` ou `'collapse'`.

### 4.4 Navigation et libellés (lot 1)

| Point | Avant | Après | Ancre |
|---|---|---|---|
| COLLABORATEURS | actuels · anciens · tous | Collaborateurs actuels · **Tous les collaborateurs** · Anciens collaborateurs [P] (`Modules$Module`, ordre de l'énumération) | N1 |
| Administrateur | dernière entrée de « Modèles » | retiré de `NAV` ; Réglages ▸ Administrateur … → `go('config')` ; `ds_view='config'` reste restaurable au démarrage (`go` fonctionne sans entrée dans `NAV`) | N3 |
| Domaine d'affaire | « Calcul des honoraires » | « Offres d’honoraires » (apostrophe typographique, convention de `DOMAINS`) ; `domainView` accepte les deux clés ; la valeur mémorisée `ds_am_dom` est convertie | H1-H4 |

- Les autres emplois de « Calcul des honoraires » sont d'autres libellés de l'original : **ne pas les toucher**. Il s'agit des titres de `feBrowse`, du dialogue de contrat, de l'impression du devis `kind==='hon'` et du motif de `delOwner`. Le document imprimé reste « Offre d'honoraires » (`app.doc.Templates.projectFeeCalculation`).
- La séparation MODELES DOCUMENTS / ANCIENS MODELES reste à CH-12 ; « Mes devis » à CH-02 lot 4.
- Valeurs après le lot : 10 sections, **43 entrées** (44 − Administrateur) ; la section « Modèles » en compte 10.

### 4.5 Presse-papier (lot 1)

`ctCopy(x,msg)` existe déjà (déclaration `function`, hissée, utilisable partout). Elle appelle `navigator.clipboard.writeText` en contexte sécurisé, sinon elle passe par une zone de texte cachée et `execCommand('copy')`, puis affiche `toast(msg)` ou « Copie impossible. ». Les 4 appels sans repli y passent, avec leur message actuel inchangé :

| # | Commande | Avant | Après |
|---|---|---|---|
| C1 | `copyTable` (19 appels : roues ▾ « Fonctions » et menus des listes) | `navigator.clipboard.writeText(tableText(g,'\t')); toast('Tableau copié ('+g.view.length+' lignes).');` | `ctCopy(tableText(g,'\t'),'Tableau copié ('+g.view.length+' lignes).');` |
| C2 | « Valider les courriels » ▸ « Copier dans le presse-papier » | `navigator.clipboard.writeText(ta.value); toast('Courriels copiés.');` | `ctCopy(ta.value,'Courriels copiés.');` |
| C3 | Adresses ▸ « Copier l’adresse dans le presse-papier » | `navigator.clipboard.writeText(adrLines(curA()).join('\n')); toast('Adresse copiée.');` | `ctCopy(adrLines(curA()).join('\n'),'Adresse copiée.');` |
| C4 | Intervenants ▸ « Copier l’intervenant » | `navigator.clipboard.writeText(adrLines(…).join('\n')); toast('Intervenant copié.');` | `ctCopy(adrLines(…).join('\n'),'Intervenant copié.');` |

Aujourd'hui, `copyTable` lève une erreur sur les postes avant même d'afficher son message.

### 4.6 Export des données (lot 2)

#### 4.6.1 Fenêtre (`ch10bDataExport`)

- `dialog` titré « **Export des données** », largeur fixe 520 px ; Échap et « Fermer » ferment.
- Disposition, de haut en bas :
  1. titre de section « **Adresses** » ; bouton radio « **Exporter les adresses** » ;
  2. titre de section « **Affaires** » ; ligne « **Date depuis le** » [date] « **jusqu'au** » [date] ; boutons radio « **Exporter les rapports d'heures** », « **Exporter les frais d'affaires** » ;
  3. pied : « **Fermer** », « **Exporter** » (bouton principal).
- Les trois boutons radio sont exclusifs ; **aucun n'est coché à l'ouverture** [P].
- **Dates** : `<input type="date">`. Défaut 01.01 et 31.12 de l'année courante, **conservées d'une ouverture à l'autre pendant la session** (variable `CH10B_DATES`) [P] (`<clinit>@26-59`). **Aucun contrôle** que le début précède la fin [P] : sinon le fichier ne contient que l'en-tête.
- **Règles d'activation** [P] (`checkGuards@0-84`) :
  - libellés et champs de date actifs si « rapports d'heures » ou « frais d'affaires » est choisi ;
  - « Exporter » actif si l'un des trois est choisi ;
  - **[C] D-10.8** : « Exporter » reste grisé quand « Exporter les adresses » est choisi et que `ch10aCan('3,4')` est faux.
- La ligne « Emplacement du fichier d'export » n'est pas reproduite [C] : le navigateur enregistre dans son dossier de téléchargement, et `showSaveFilePicker` n'existe pas en contexte non sécurisé.
- Accès : Réglages ▸ Export des données … (droit 1,7).

#### 4.6.2 Déroulement de « Exporter »

1. Curseur d'attente (`document.body.style.cursor='wait'`, rétabli dans un `finally`).
2. Lignes = [en-têtes] + une ligne par enregistrement (§ 4.6.3 à 4.6.5), valeurs mises en forme selon le § 4.6.6.
3. Octets : `FE FF`, puis chaque unité de code UTF-16 en gros-boutiste ; chaque champ entre `"` (`"` doublé), séparés par `;`, chaque ligne terminée par `\n` (`ch10bCsvBytes(rows)` → `Uint8Array`).
4. Téléchargement du `Blob` sous le nom « **Export.csv** » [P] (nom proposé « Export » + extension `csv`).
5. Aucun message de fin [P] ; en cas d'erreur, `toast` d'erreur.

#### 4.6.3 Adresses (35 colonnes, `ch10bRowsContacts`)

- **Enregistrements** : tous les `contact` **non masqués** (`ISHIDDEN` faux), sans filtre de date [P].
- **Tri** : liste [personne liée (`CONTACTRELATION_ID`) NAME1, NAME2 ; entité (`CONTACTOWNER_ID`) NAME1, NAME2], valeurs nulles omises, comparée élément par élément par `ch10bCmpIC` (chaîne manquante de l'autre côté = « »). Tri stable, après un ordre initial par ID croissant [C].

| # | En-tête | Source | # | En-tête | Source |
|---|---|---|---|---|---|
| 1 | Numéro d'adresse | `CONTACT.ID` | 19 | Telefon pay | `PHONECOUNTRY1` |
| 2 | Numéro de référence ext. | `EXTERNALREFERENCE` | 20 | Telefon indicatif | `PHONEAREA1` |
| 3 | En-tête adresse | entité `FORMOFADDRESS` | 21 | Téléphone | `PHONENUMBER1` |
| 4 | Nom | entité `NAME1` | 22 | Mobile pay | `PHONECOUNTRY2` |
| 5 | Complément | entité `NAME2` | 23 | Mobile indicatif | `PHONEAREA2` |
| 6 | Remarque | entité `REMARK` | 24 | Tél. mobile | `PHONENUMBER2` |
| 7 | IDE | entité `UID` | 25 | Fax pay | `FAXCOUNTRY1` |
| 8 | N° AVS | entité `SOCIALSECURITYNUMBER` | 26 | Fax indicatif | `FAXAREA1` |
| 9 | Date d'anniversaire | entité `BIRTHDAY`, `JJ.MM.AAAA` | 27 | Fax | `FAXNUMBER1` |
| 10 | Type | libellé du type de l'entité | 28 | Courriel | `EMAIL1` |
| 11 | Adresse 1 | `NAME1` | 29 | Skype | `SKYPE` |
| 12 | Adresse 2 | `NAME2` | 30 | Internet | `INTERNET` |
| 13 | Adresse 3 | `NAME3` | 31 | CFC | `BKP` |
| 14 | Rue 1 | `STREET` | 32 | Civilité | `SALUTATION1` |
| 15 | Rue 2 | `POBOX` | 33 | Remarque | `CONTACT.REMARK` |
| 16 | NPA | `POSTALCODE` | 34 | Function | `COMPANYROLE` |
| 17 | Localité | `LOCATION` | 35 | Profession | `PROFESSION` |
| 18 | Code de pays | `COUNTRYCODE` | | | |

- En-têtes exacts de `Strings.db (deltaproject.addresses|ExportCsv)`, **coquilles comprises** (« Telefon pay », « Fax pay », « Function ») et **apostrophes droites** (le fichier doit être identique octet par octet) [P].
- Colonnes 3 à 10 vides si l'adresse n'a pas d'entité. Type : `TYPECODE` 0 « Société », 1 « Personne », 2 « Famille », 3 « Communauté », 4 « Association » [P] (`db.ContactOwner$Type`, `Strings.db (db|ContactOwner)`).
- Téléphones écrits bruts, sans mise en forme [P]. La personne liée sert au tri mais n'est pas écrite [P].

#### 4.6.4 Rapports d'heures (19 colonnes, `ch10bRowsTimeLog(de, à)`)

- **Enregistrements** : **toutes** les lignes `timelog` (tous collaborateurs, toutes affaires, absences comprises) telles que `de ≤ TIMEYEAR×372 + TIMEMONTH×31 + TIMEDAY ≤ à`, bornes incluses, mois de 0 à 11 [P]. `de` et `à` se calculent de la même façon sur les dates choisies.
- **Tri** : `TIMEYEAR`, `TIMEMONTH`, `TIMEDAY`, `TIMEHOUR1`, `TIMEMINUTE1` [P], puis ID [C].

| # | En-tête | Source |
|---|---|---|
| 1 | ID | `TIMELOG.ID` |
| 2 | Numéro d'affaire | `PROJECT.NUMBER` (vide sans affaire) |
| 3 | Nom de l'affaire | `PROJECT.TITLE` |
| 4 | Ouvrage | `SUBPROJECT.CODE` (le code, pas la désignation) |
| 5 | Localisation | `SUBPROJECT.LOCATIONCODE` |
| 6 | Groupe d'activités | `PROJECTACTIVITYGROUP.NAMEFR` (`ACTIVITYGROUP_ID`) |
| 7 | Activité | `PROJECTACTIVITY.NAMEFR` (`ACTIVITY_ID`) |
| 8 | Phase | `PROJECTPHASE.NAMEFR` (`PHASE_ID`) |
| 9 | Phase partielle | `PROJECTSUBPHASE.NAMEFR` (`SUBPHASE_ID`) |
| 10 | Collaborateur | nom de la personne du collaborateur (§ 1 n° 14) |
| 11 | Date | `JJ.MM.AAAA` de (`TIMEYEAR`, `TIMEMONTH`+1, `TIMEDAY`) |
| 12 | Début | `HH:mm` de `TIMEHOUR1`, `TIMEMINUTE1` ; « ? » si l'une est négative [P] (`TimeLog.formatTime@0-13`) ; une valeur absente est traitée comme négative [C] |
| 13 | Fin | idem avec `TIMEHOUR2`, `TIMEMINUTE2` |
| 14 | Période | `TIMEPERIOD` (`ch10bJavaDouble`) |
| 15 | Tarif externe | `RATE` du premier `projectrate` du groupe de l'activité (`PROJECTRATEGROUP_ID`) avec `VALIDFROM` ≤ date, dans l'ordre `VALIDFROM` décroissant ; vide si aucun (un `VALIDFROM` vide est ignoré) |
| 16 | Tarif interne | idem sur les `staffrate` du collaborateur (`STAFF_ID`) |
| 17 | Facturable | `ISCHARGEABLE` → « oui » / « non » |
| 18 | Facturé | `ISCHARGED` → « oui » / « non » |
| 19 | Description | `DESCRIPTION` |

- En-têtes : `Strings.db (deltaproject|DataExportDialog)`, dans l'ordre de `timeLogHeader` [P].
- Le libellé est « Période » (`timePeriod`), pas « Durée » (`period`, libellé mort). « Ouvrage » et « Localisation » sont `subProjectName` et `subProjectLocation` [P].

#### 4.6.5 Frais d'affaires (19 colonnes, `ch10bRowsCost(de, à)`)

- **Enregistrements** : toutes les lignes `projectcost` de la période (même règle sur `DATEYEAR`, `DATEMONTH`, `DATEDAY`).
- **Tri** : par date [P], puis ID [C].

| # | En-tête | Source |
|---|---|---|
| 1-5 | ID · Numéro d'affaire · Nom de l'affaire · Ouvrage · Localisation | comme au § 4.6.4 |
| 6 | Groupe de frais de l'affaire | `PROJECTCOSTCATEGORYGROUP.NAMEFR` (`COSTCATEGORYGROUP_ID`) |
| 7 | Frais de l'affaire | `PROJECTCOSTCATEGORY.NAMEFR` (`COSTCATEGORY_ID`) |
| 8-10 | Phase · Phase partielle · Collaborateur | comme au § 4.6.4 |
| 11 | Date | `JJ.MM.AAAA` |
| 12 | Quantité | `QUANTITY` (`ch10bJavaDouble`) |
| 13 | Unité | `UNIT` |
| 14 | Montant | `QUANTITY × UNITPRICE`, puis × `FOREIGNCURRENCYRATE` si `FOREIGNCURRENCYCODE` n'est pas nul ; **non arrondi** [P] (`calcAmount@0-19`) |
| 15 | Monnaie | § 1 n° 13 |
| 16 | Montant externe | `EXTERNALRATE × Montant` [P] (`getExternalAmount@0-9`) |
| 17-19 | Facturable · Facturé · Description | comme au § 4.6.4 |

#### 4.6.6 Mises en forme (fonctions pures, testées en jsc)

- **`ch10bJavaDouble(v)`** :
  - `0` → « 0.0 » (« -0.0 » pour −0) ;
  - si 10⁻³ ≤ |v| < 10⁷ : `String(v)`, avec « .0 » ajouté s'il n'y a pas de point ;
  - sinon : mantisse de `v.toExponential()` (« .0 » ajouté si besoin) + « E » + exposant sans « + » (`1.0E7`, `1.0E-4`, `1.23456789E7`).
- **`ch10bCmpIC(a,b)`** : unité de code par unité de code ; si elles diffèrent, comparer `toUpperCase` puis `toLowerCase` de chacune (garder le caractère d'origine si la conversion donne plusieurs caractères, comme `Character`) ; sinon différence des longueurs.
- **`ch10bOwnerName(o)`** : § 1 n° 14 ; ordre selon `displayNameFormat`.
- **`ch10bFmtTime(h,m)`**, **`ch10bFmtDate(y,m0,d)`**, **`ch10bYesNo(b)`**. `null` → chaîne vide ; les textes sont écrits tels quels.

### 4.7 Importer les modèles (lot 2)

- Fichier ▸ Importer les modèles … ouvre le sélecteur de fichier du navigateur (`<input type="file" accept=".zip">`). Le navigateur ne peut pas afficher le titre « Choix du dossier des nouveaux modèles. » [C].
- Nom ne finissant pas par `.zip` (sans casse) ou aucun fichier : rien, sans message [P] (`AppForm$5@0-129`, `AppForm$5$1.accept`).
- Sinon, `ch10bImportTemplatesFrom(blob)` :
  1. `await tplNeed()` puis `DS.need(['formtemplate','formtemplategroup'])` ;
  2. `POST /api/modeles/zip` avec le fichier ;
  3. fusion `ch10bImportMerge(pages, état)` (pure, renvoie les opérations) ; pour chaque page renvoyée :
     - groupe `categorie/groupe` absent de `modelegroupe` → création `{categorie, groupe, libelle: groupe==='Default'?'DELTA Originaux':groupe, ordre:9, verrouille: groupe==='Default'}` (règle du convertisseur), plus un `formtemplategroup {ID, CATEGORY, NAME}` s'il manque [P] ;
     - modèle `categorie/groupe/type/nom` absent → création `{categorie, groupe, type, nom, libelle:{fr:'',de:'',it:'',en:''}, langues:{}}`, plus un `formtemplate {ID, TYPE, NAME:<1er segment de nom>, FORMTEMPLATEGROUP_ID}` s'il manque [P] (`TemplateImport` : `NAME = parts[3]`) ;
     - page déjà présente (`langues[lg].pages[page]`) → **ignorée**, jamais d'écrasement [P] (un fichier existant n'est pas réécrit) ; sinon elle est ajoutée ;
  4. un seul `DS.commit` (identifiants numériques par `DS.newIds`) ;
  5. message `ctMsg('Information','Import des nouveaux modèles terminé.')` [P] (`msgTemplatesImported`), même si rien n'a été ajouté et même après des pages illisibles [P] (erreurs seulement dans la console). Le nombre de pages ajoutées, ignorées et illisibles va dans la console [C].
- Les entrées hors des 7 catégories (arrière-plans, images, `.DS_Store`, dossier racine « Templates/ ») sont ignorées [C] : l'original les écrirait sous `Templates/`, où rien ne les lit.
- Les groupes « DELTA Originaux » (`verrouille`) reçoivent eux aussi les pages manquantes [P] : l'original ne teste rien.

### 4.8 Changer le style de police de tous les modèles (lot 2)

- **Accès** : vue des anciens modèles (`tplView`, les 7 familles). Un bouton roue ▾ (icône `gear`) est ajouté dans un groupe à droite des outils (ancre E3).
  - Il est **actif si un groupe est sélectionné** (`tplCurGroup(cat)`), **même pour « DELTA Originaux »** [P] (`TemplatesFrame.checkGuards@123-128`).
  - Menu à une entrée : « **Modifier la police dans tous les modèles du groupe …** » (`changeAllFonts`), active si la liste des groupes n'est pas vide.
- **Dialogue** « **Changer le style de police de tous les modèles** » [P] (`ChangeFontDialog.<init>@0-174`) :
  - « **Groupe** » : champ non modifiable, `libelle` du groupe (ou `groupe`) ;
  - « **Nouvelle police** » : liste de 10 lignes visibles. Un navigateur ne peut pas lister les polices installées ; la liste contient donc l'union triée des `police` présentes dans `modele`, de `standardFontName` et des `standardTableFont*Name` (`setting`), et des polices de la collection de CH-12 si elle existe [C] ;
  - message permanent « **Cette opération ne peut pas être annulée.** » ;
  - « **Annuler** » (Échap), « **OK** » actif si une police est choisie.
- **OK** : `ch10bFontApply(modeles, police)` (pure) sur les modèles du groupe (`categorie`/`groupe`).
  - Pour chaque langue, page et élément de type `texte`, `champ` ou `tableau` : `police = <nouvelle>`. Taille, gras, italique, souligné et couleur sont inchangés [P] (`Text.replaceFont`, `TableField.replaceFont`). Traits, rectangles, repères et images ne sont pas touchés.
  - Les modèles modifiés partent en un seul `DS.commit`, avec le `bseq` lu à l'ouverture ; puis fermeture.

### 4.9 Enregistrer le diagramme … en PNG (lot 2)

`mgSaveChart(el,name)` délègue à `ch10bSaveChart(el,name)` (ancre E2) :

1. **SVG** = `el._svg`, sinon `el.querySelector('svg').outerHTML` ; s'il n'y en a pas : `toast('Aucun diagramme.',true)`.
2. **Légende** : les pastilles HTML sous le diagramme (`span` intérieur avec `background`, suivi du nom) sont redessinées en SVG sous le graphique (carré de 10 px + texte, sur une ou plusieurs lignes).
3. **Image** : `xmlns`, largeur et hauteur explicites = `viewBox` ; `Image` d'un `Blob` SVG → `canvas` à **l'échelle 2** → `toBlob('image/png')` [P] (`saveSceneAsImage@0-61`, `Transform.scale(2.0, 2.0)`).
4. **Nom** : `ch10bChartName(titre, name)` (pure) [P] (`saveFXNodeAsImage@0-134`) :
   - titre = texte du dernier `<text font-weight="700">` du SVG, avec « : » remplacé par « , » ;
   - si `name` est de la forme « <mois de `MOIS_L`> <année> », c'est le suffixe de l'original (Analyses 3 à 6, Management ▸ Planification RH, qui passent déjà ce texte) : « <titre> <mois> <année> » ;
   - sinon « <titre> » ;
   - sans titre : `name`, sinon « Snapshot » ;
   - extension `.png`.
- Libellés de l'eCCC : « Enregistrer le graphique (SVG) » → « **Enregistrer le diagramme …** » (ancres E6, E7) [P] (`Charts.saveChartAsImage`).
- Les 6 points d'appel existants gardent leur place, ainsi que celui que CH-11 ajoutera. L'original n'a pas l'entrée dans les Analyses 1 et 2 ni dans le Calcul des résultats de l'eCCC ; l'entrée DeltaSub existante du Calcul des résultats est conservée.

### 4.10 Protection des documents Bâtiment (lot 3)

- **Règle** [P] (`<module>.data.Rights.checkRigth@0-58`) : modification autorisée si le `USERID` du document est vide, s'il est égal à l'utilisateur courant (`ME.id`), **ou** si `areBauadDocsLocked` ne vaut pas `[YES]`. `ch10cCanEdit(doc)` = `svCanEdit(doc)` (même règle, déjà conforme).
- **`ch10cGuard(t,id)`** : lit l'en-tête `t`/`id`. Refus → `ctMsg('Information', message du module)`, puis renvoie `false`. Messages [P] :
  - `costcontroldocument`, `costestimatedocument` : « Vous n’avez pas le droit de modifier ce document. » ;
  - `costplanningdocument` : « Vous n’avez pas les droits pour modifier ce document. ».
  Cette fonction est exposée aux autres chantiers (CH-07 pour sa liste).
- **eCCC** : `ecCanEdit` applique la règle (ancre P1) ; les messages existants (`EC_MSG_DROITS`) et les points de contrôle de l'eCCC restent.
- **Contrôle des coûts** (ancre P6) :
  - l'enregistrement de la fenêtre appelle `ch10cGuard`. En cas de refus, l'écriture n'est pas envoyée et la promesse est rejetée avec `conflict:true` ; `touch` recharge alors l'état enregistré et redessine [C]. L'original refuse avant d'ouvrir le dialogue de modification (E13).
  - Le même enregistrement **conserve l'auteur** : `USERID` inchangé s'il est renseigné, `ME.id` s'il est vide [P] (§ 1 n° 27). La date `CHANGEDDATE` reste mise à jour, comme aujourd'hui dans DeltaSub.
- **Devis** : CH-02 lot 1 (`ch02aCanEdit`). **Soumission** : existant (`svCanEdit`).
- Le réglage se change dans Paramètres système ▸ Bâtiment (CH-08). Au bureau il vaut `[NO]` : aucun effet visible tant qu'il n'est pas changé.

### 4.11 Verrou d'ouverture et déverrouillage (lot 3)

#### 4.11.1 Pose

- À l'ouverture d'un devis (`dvOpen`), d'un contrôle des coûts (`ccOpen`) ou d'une estimation eCCC (`ecOpen`) (ancres P2-P4), par `ch10cGate(t,id,reprise)`. `t` est la collection d'en-tête : `costestimatedocument`, `costcontroldocument` ou `costplanningdocument`.
- `ch10cGate` renvoie `false` (l'ouverture continue) quand **cet onglet** tient déjà le verrou.
- Sinon elle renvoie `true` (l'ouverture est suspendue) et lance `ch10cAcquire(t,id)` (asynchrone) :
  1. `await DS.need(['documentlock'])` ;
  2. ligne `documentlock` `<t>:<id>` absente → création (`bseq` connu) ; en cas de succès, la clé entre dans `CH10C_HELD` puis `reprise()` rouvre ;
  3. 409 → la ligne à jour est lue et le dialogue s'affiche ;
  4. ligne présente, tenue par un autre onglet (autre `SESSION`) → dialogue « Document verrouillé ».

#### 4.11.2 Dialogue « Document verrouillé » [P] (`DocumentLockDialog.<init>@0-252`, `checkGuards@0-45`, `jOkButtonActionPerformed@0-149`)

- Texte « **Ce document est actuellement utilisé.** » ;
- « **Utilisateur** » (non modifiable, `USERID` du verrou) ; « **Utilisé le** » (non modifiable, `JJ.MM.AAAA HH:mm`) ;
- case « **Déverrouiller ce document** », active si le `USERID` du verrou = `ME.id` **ou** si l'utilisateur a le droit 100,0 (`rgCan` si elle existe, sinon `svRight('100,0')`, comme la Soumission) ;
- « **Annuler** » (et Échap) : l'ouverture est **abandonnée** [P] ;
- « **OK** » (principal) : actif seulement si la case est cochée [P] ;
- OK → confirmation titrée « **Avertissement** », boutons « Oui » / « Non », texte `msg1a` + saut de ligne + `msg1b` : « Voulez-vous vraiment déverrouiller ce document ? Attention, veuillez vous assurer que l'utilisateur mentionné » ⏎ « ne travaille pas dans le document afin d'éviter la perte de données. » ;
  - Oui → suppression de la ligne (`bseq` lu), puis nouvelle tentative. Si un autre poste a repris le verrou entre-temps, le dialogue se rouvre avec ses données ; sinon le verrou est posé et le document s'ouvre ;
  - Non → retour au dialogue.

#### 4.11.3 Levée

- **Après chaque `go`** (`ch10cAfterGo`) : tout verrou de `CH10C_HELD` dont le document n'est plus ouvert (`DV.open`, `CCV.open`, `EC_V.open` ≠ id) est supprimé. Dans DeltaSub, un document reste ouvert quand on change de module ; il garde alors son verrou, comme une fenêtre Deltaproject restée ouverte.
- **Fermeture de l'onglet** : `pagehide` → `navigator.sendBeacon('/api/commit', Blob JSON)` qui supprime les verrous tenus (modèle de la Soumission). L'écouteur est posé à la première acquisition.
- **Déverrouillage par un autre poste** : détecté au sondage (écouteur `DS.on` posé à la première acquisition) ; la clé sort de `CH10C_HELD` et `toast('Ce document a été déverrouillé sur un autre poste.',true)` [C].

#### 4.11.4 Session

`SESSION` = jeton aléatoire tiré à la première acquisition (mémoire de la page). Un verrou resté d'une session précédente du même utilisateur affiche le dialogue, avec la case active [P].

#### 4.11.5 Non reproduit

Pose du verrou pour l'édition de l'en-tête, la duplication, la suppression et l'export (E14).

#### 4.11.6 API pour les autres chantiers

Ces fonctions sont exposées, génériques et utilisables pour n'importe quelle collection d'en-tête : `ch10cGate(t,id,reprise)`, `ch10cAcquire(t,id)` (promesse → `true` si posé), `ch10cRelease(t,id)`, `ch10cHeld(t,id)`. `spec_17` attend que le verrou de l'offre d'honoraires de CH-11 s'appuie sur elles.

### 4.12 Synchroniser l'adresse … (contrôle des coûts, lot 3)

- **Accès** : section COMPTES D'ENTREPRISE, **clic droit** sur une entreprise. La ligne est sélectionnée par ce clic : l'original exige exactement une ligne sélectionnée. Un menu à une entrée s'ouvre : « **Synchroniser l'adresse …** » [P] (`addrChangeMenu` + `mapStringWithEllipsis`, `EntrepreneurFrame.jEntrepreneurListTableMousePressed@0-84`). Branchement par `ch10cEntCtx(pane,ctx)` (ancre P5, `pane.oncontextmenu`).
- **Contrôle** : règle de protection d'abord (`ch10cGuard`) ; refus → message, fin [P] (`synchroniziceAddress@0-161`).
- **Dialogue** « **Actualiser l'adresse** » [P] (`costcontrol.AddrSynchDialog.<init>@0-230`) :
  - « **Adresse précédente:** » (deux-points collés), suivi du `nomCourt` de la première entrée de `C.entreprises` dont `contactId` est l'ancien ;
  - séparateur ; bouton « **Nouvelle adresse** » et libellé « Nouvelle adresse », remplacé par le nom court du contact choisi ;
  - le bouton ouvre `pickContact('Navigateur d’adresses', …)` (sélection simple). Nom court = `ch10cShortDesc(contact)` : `SHORTLABEL` s'il n'est pas vide, sinon [nom de la personne liée] + « , » (sans espace, seulement si les deux parties existent) + [nom de l'entité], chaque nom selon `ContactOwner.getName` (§ 1 n° 14 et 24) ;
  - « **Annuler** » (Échap) et « **OK** » (principal) toujours actifs ; OK sans nouvelle adresse → fermeture sans changement [P].
- **OK** :
  1. `ch10cRemap(C, ancien, nouveau, nomCourt)` (pure) sur une copie du contenu ;
  2. un seul `DS.commit` : `costcontrol` avec le `bseq` lu à l'ouverture du dialogue, et l'en-tête avec `CHANGEDDATE` (auteur conservé) ;
  3. rechargement, redessin de la fenêtre et resélection de la ligne [P] (`Save.autosave`, qui ne fait dans l'original qu'une copie de sauvegarde, une fois sur 11).

**Règle de remplacement exacte** [P] (`AddrSynchDialog.jOkButtonActionPerformed@0-1195` ; champs DeltaSub d'après `convertir_couts.py`) :

| Tableau DeltaSub (`costcontrol`) | Remplacement | Original |
|---|---|---|
| `entreprises[]` | **1re** entrée dont `contactId` = ancien : `contactId` = nouveau, `nomCourt` = nom court du nouveau. **Sans elle, rien n'est fait** | `getAddrList` : boucle arrêtée à la 1re entrée (`@21-100`) |
| `mutations[]` | `origine.contactId` et `destination.contactId` égaux à l'ancien → nouveau | `kvList[].entrepreneurList[]` (`companyNumber`, `personNumber` = −1, non converti) ; `mut1List`, `mut2List` (`partnerUrefNum`, `uRefNumber`) (`@109-435`) |
| `ecritures[type='icc']` | `contactId` = ancien → nouveau | `indexList` (`uRefNumber`) et entrepreneur de la position (`@377-426`) |
| `ecritures[type≠'icc']` | `contactId` = ancien → nouveau | `awardList`, `measurementList`, `prognoseList`, `additionalCostList`, `freeAccount1/2/3List` (`BaseBook.companyNumber` = `uRefNumber`) (`@728-…`) |
| `contrats[]` de 1er niveau (`contratParentId` nul) | contrat dont `contactId` = ancien → nouveau, puis, **sans autre test** : **tous** les `paiements` et `arretes` de ce contrat (`contratId`), **tous** ses avenants (`contratParentId` = id du contrat) et **tous** leurs paiements et arrêtés → nouveau | `getContractBookList` : `setCompanyNumber` sur le contrat, tous ses `payList`, ses `deductionList` (champs `transient`), tous ses `addendumList` et leurs paiements et déductions (`@442-721`) |
| avenant dont le contrat n'a pas l'ancien contact | **non touché**, même s'il porte lui-même l'ancien contact | idem (le test porte sur le contrat) |
| `paiements[]` hors contrat (`contratId` nul) | `contactId` = ancien → nouveau | `getPayBookList` (`Pay.companyNumber`) (`@840-889`) |
| `ordresPaiement[].maitreOuvrageContactId`, `comptesMO[]` | **non touchés** | `adviceOfPaymentList`, `builOwnerAccountList` non parcourus |

- Si la nouvelle adresse figure déjà dans `entreprises`, l'original ne fusionne pas : il reste deux entrées du même numéro. DeltaSub non plus [P].
- Données du bureau : dans les 84 contenus, tous les paiements d'un contrat et tous les avenants portent le contact de leur contrat. La règle en cascade et une simple égalité donnent donc le même résultat au bureau, mais le lot applique la règle exacte (`research/crit19/ref_remap.py`).

### 4.13 Veille (lot 4)

- **Bouton** : icône lune (`ICO.moon`, déjà dessinée), infobulle « Veille » (terme du manuel FR p. 15 ; l'original n'a pas d'infobulle) [C]. `ch10dAfterGo` l'ajoute dans un groupe à droite de `#tools` quand la vue est `devis` (`DV.open`), `coco` (`CCV.open`), `coplan` (`EC_V.open`) ou `soum` (`SV_UI.open`) avec un document ouvert.
- **Entrée en Veille** (`ch10dStart`) :
  - `CH10D.v = {id, arg}` de la vue courante ;
  - la barre des modules est affichée si elle était masquée ; les sections autres qu'ADRESSES et HEURES sont masquées (classe `ch10d-hide`). Il reste Entités, Liste des adresses, Mes favoris, Groupes d'adresses, Propriétés, Chercher ; Saisie, Rapport, Disponibilité [P] (`ModuleSelectionDialog.initModuleTree`, `Modules$Menu.addresses`, `time`) ;
  - la barre de menus est grisée (`ch10aEnable(false)`) : la Veille est modale pour toute l'application [P] (`APPLICATION_MODAL`) ;
  - un bandeau dans `#top` affiche « DeltaSub - <`ME.u.NAME`> » et un bouton « Reprendre » [C] (titre de l'original : « DELTAproject - <nom> ») ;
  - le dernier module choisi en Veille s'ouvre (`ds_ch10d_last`) ; à défaut, la zone principale est vide avec « Choisissez un module ADRESSES ou HEURES. » [P] (volet vide, `restoreLastSelectedModule`).
- **Pendant la Veille** : `ch10dBeforeGo` refuse toute vue hors de ces 9 et de la vue d'origine, avec `toast('Veille : seuls les modules ADRESSES et HEURES sont accessibles. « Reprendre » pour revenir au document.')` [C]. Le choix est mémorisé dans `ds_ch10d_last`.
- **Reprendre** (`ch10dStop`) : sections, barre de menus et bandeau sont rétablis ; `go(v.id, v.arg)` redessine le document resté ouvert (données relues ; noms d'entreprise à jour par `ccEntName`, sans écriture, § 1 n° 34) ; les verrous restent tenus.
- **Soumission** : la vue ferme aujourd'hui le document quand on la quitte. Pendant la Veille, elle ne le ferme pas (ancre V1) ; `svEditor` sait redessiner la fenêtre ouverte en gardant le travail en cours.

### 4.14 Reliquats de la Planification RH (aucun code)

- **Analyse 6, dernière ligne** : la formule du code (coût estimé par catégorie − coût de revient et frais internes) et le libellé corrigé sont déjà en place (`paM6`) [P] (`Analyze6TableModel.getValueAt@260-270` ; libellé allemand neutre, identique à l'Analyse 5).
- **Bandeau « Données DELTAplanning : aucune planification saisie »** : présent dans le domaine Planification RH, dans Management ▸ Planification RH et dans la page des tuiles de l'Analyse [P] ; absent de l'original (amélioration).
- Confirmation de Paulo seulement.

### 4.15 Messages et libellés exacts

| Clé | Texte | Source |
|---|---|---|
| menus | Fichier · Affichage · Réglages · Aide | `AppForm` (`menuFile`, `menuView`, `menuExtras`, `menuHelp`) |
| Edition (extension) | Edition · Annuler · Rétablir · Couper · Copier · Coller · Tout sélectionner | `form\|form` (Edit, Undo, Redo, Cut, Copy, Paste, SelectAll) |
| tableaux | Copier le contenu du tableau dans le presse-papier · Exporter le tableau dans un fichier CSV … | `util.table.TablePopup` |
| Fichier | Importer des vCards … · Importer des adresses … · Importer les modèles … | `AppForm` |
| Réglages | Configurer un collaborateur … · Administrateur … · Gestion des utilisateurs … · Paramètres système … · Paramètres système … [Ancien document] · Emplacements des modèles et des documents externes … · Export des données … · Préférences … | `AppForm`, `Strings$Label.legacyMenu` |
| Aide | Aide · A propos de … | `AppForm` |
| affichage | Masquer la barre des modules · Afficher la barre des modules · Ouvrir les modules · Fermer les modules | `AppForm` (`hideTree`, `displayTree`, `expandTree`, `collapseTree`) |
| export | Export des données · Adresses · Exporter les adresses · Affaires · Date depuis le · jusqu'au · Exporter les rapports d'heures · Exporter les frais d'affaires · Exporter · Fermer | `DataExportDialog`, `rsrc.Strings\|close` |
| modèles | Import des nouveaux modèles terminé. · Information | `AppForm\|msgTemplatesImported`, `rsrc.Strings\|information` |
| police | Modifier la police dans tous les modèles du groupe … · Changer le style de police de tous les modèles · Groupe · Nouvelle police · Cette opération ne peut pas être annulée. | `form.TemplatesFrame`, `form.ChangeFontDialog` |
| diagrammes | Enregistrer le diagramme … | `util.Charts\|saveChartAsImage` |
| protection | Vous n'avez pas le droit de modifier ce document. (CC, Devis) · Vous n'avez pas les droits pour modifier ce document. (eCCC) | `costcontrol.data.Rights\|msg`, `costestimate.data.Rights\|msg`, `costplanning.data.Rights\|msg` |
| verrou | Document verrouillé · Ce document est actuellement utilisé. · Utilisateur · Utilisé le · Déverrouiller ce document · Avertissement · `msg1a` / `msg1b` (§ 4.11.2) · Oui · Non · Annuler · OK | `DocumentLockDialog`, `rsrc.Strings\|warning` |
| synchronisation | Synchroniser l'adresse … · Actualiser l'adresse · Adresse précédente: · Nouvelle adresse · Navigateur d'adresses | `costcontrol.CostControlDialog\|addrChangeMenu`, `costcontrol.AddrSynchDialog` |
| presse-papier | Tableau copié (<n> lignes). · Courriels copiés. · Adresse copiée. · Intervenant copié. · Copie impossible. | DeltaSub existant (`copyTable`, `ctCopy`) |
| Veille | Veille · DeltaSub - <nom> · Reprendre · Choisissez un module ADRESSES ou HEURES. | [C] (manuel FR p. 15) |

- **Apostrophes des textes affichés** : la convention de DeltaSub s'applique (’ typographique, comme `EC_MSG_DROITS` ou « Copier l’adresse… ») ; les textes sont sinon identiques à `Strings.db`.
- **Contenu des fichiers CSV** : en-têtes avec les **apostrophes droites** de `Strings.db`, pour que le fichier soit identique octet par octet.

---

## 5. Documents imprimés

Aucun `.dpdoc` ni ancien modèle d'impression n'appartient à CH-10 [P] (`rech_orig` § 15). Les sorties du chantier sont :
- 3 fichiers CSV (§ 4.6) ;
- des PNG (§ 4.9) ;
- des pages de modèles DESIGN (§ 4.7, 4.8) ;
- le texte copié dans le presse-papier (§ 4.2, 4.5).

---

## 6. Valeurs de contrôle

Base : copie `.backup` de `dstest` (import Deltaproject du 29.09.2026, séquence 680, recontrôlée pour cette version : `contact` 755, `timelog` 37 622, `projectcost` 635, `costcontrol` 84, `modele` 353). Utilisateur de l'essai : 2752 (superadministrateur).

**Avant chaque test**, le lot compare ces compteurs avec la copie du jour. S'ils ont changé, il relance `crit/ref_export.py` et `research/crit19/ref_remap.py` et reprend les valeurs recalculées. Les jeux de données de test extraits de la base (JSON) sont générés dans le dossier du lot au moment du test, puis **effacés** (données personnelles).

### 6.1 Tests jsc

| # | Lot | Test | Attendu |
|---|---|---|---|
| T0 | 1-4 | syntaxe | `jsc -e "new Function(readFile('<script extrait du DeltaSub.html construit>'))"` sans erreur, sur le fichier du dépôt du jour + le lot |
| T1 | 1 | `ch10aModel` : `can` toujours vrai, aucune fonction externe, USERID ≠ `admin`, `isModuleFormVisible` `[YES]`, `isProjectMenuFilesVisible` `[NO]`, Edition active | 5 menus dans l'ordre Fichier, Edition, Affichage, Réglages, Aide.<br>Fichier : vCards (grisé « CH-04 »), adresses (grisé « CH-04 »), —, modèles (grisé « CH-10 lot 2 »).<br>Edition : 8 entrées et 3 séparateurs dans l'ordre du § 4.2.<br>Affichage : 3 entrées.<br>Réglages : Administrateur …, Gestion des utilisateurs … (grisé), —, Paramètres système … (grisé), Paramètres système … [Ancien document] (grisé), —, Export des données … (grisé « CH-10 lot 2 »), —, Préférences … (grisé).<br>Aide : Aide (grisé), —, A propos de … (grisé) |
| T2 | 1 | idem, avec des fonctions factices `rgSystemPreferences` et `ch08bUserAdmin` | entrées Paramètres système … et Gestion des utilisateurs … actives (nom de secours reconnu) ; les autres entrées CH-08 restent grisées |
| T3 | 1 | `can` = droits du jeu « Standard » (100,0 ; 1,1 ; 1,7 ; 3,4 ; 3,8 ; 9,0 ; 10,0) | Fichier : 3 entrées et 1 séparateur ; Réglages : Export des données …, —, Préférences … ; ni Administrateur, ni Gestion des utilisateurs, ni Paramètres système |
| T4 | 1 | aucun droit, USERID ≠ `admin` | Fichier **absent** ; Réglages : Préférences … seul ; Aide inchangé |
| T5 | 1 | USERID = `admin`, `can` = {2,0} seulement | Réglages : Configurer un collaborateur … (grisé « CH-08 »), Gestion des utilisateurs …, —, Préférences … ; Fichier absent |
| T6 | 1 | `can` = tout (superadministrateur), USERID ≠ `admin` | Réglages : Administrateur …, Gestion des utilisateurs …, —, Paramètres système …, Paramètres système … [Ancien document], —, Export des données …, —, Préférences … |
| T7 | 1 | `isProjectMenuFilesVisible` `[YES]` ; `isModuleFormVisible` `[NO]` ; `CH10A_EDITION=false` | « Emplacements des modèles et des documents externes … » (grisé « CH-13 ») entre [Ancien document] et le séparateur de l'export ; Fichier sans « Importer les modèles … » ; pas de menu Edition (4 menus) |
| T8 | 1 | séparateurs (tous les cas T1-T7) et `ch10aNavState` | jamais en tête, en fin ni en double ; `ch10aNavState(['Adresses','Affaires','Heures'],'Affaires','collapse')` → `{Adresses:false, Affaires:true, Heures:false}` ; `'expand'` → tout vrai |
| T9 | 2 | `ch10bJavaDouble` | 8 → « 8.0 » ; 0.25 ; 1e7 → « 1.0E7 » ; 1e-4 → « 1.0E-4 » ; 12.3×3 → « 36.900000000000006 » ; −0 → « -0.0 » ; 12345678.9 → « 1.23456789E7 » ; 1234567 → « 1234567.0 » ; 0.001 → « 0.001 » ; 1.4×0.7 → « 0.9799999999999999 » ; 123456789012 → « 1.23456789012E11 » [P exécuté] |
| T10 | 2 | `ch10bCsvBytes([["ID",'a"b',"x;y",""],["8.0","0.25","1.0E7","1.0E-4","36.900000000000006","-0.0","l1\nl2"]])` | 176 octets ; début `FE FF 00 22 00 49 00 44 00 22 00 3B` [P exécuté] |
| T11 | 2 | `ch10bCmpIC`, `ch10bFmtTime` | (« Émile », « Zoé ») = 111 ; (« abc », « ABD ») = −1 ; (« ß », « ss ») = 108 [P exécuté] ; `ch10bFmtTime(-1,0)` = « ? » ; `(8,5)` = « 08:05 » |
| T12 | 2 | Heures 01.01.2026 – 31.12.2026 | **6 746** lignes (+ en-tête), 69 sans affaire, Σ Période **6 412.75**, 6 722 sans tarif externe, 2 034 sans tarif interne ; premiers ID 235351, 235352, 235401 ; derniers 252117, 240224, 252118 ; ligne 235711 : 06.01.2026, 16:30, 17:00, « 0.5 », « 135.0 », « 105.0 », « oui », « non » ; ligne 235351 : période « 0.25 » ; 3 125 456 octets |
| T13 | 2 | Heures 2025 | 8 753 lignes, 132 sans affaire, Σ **10 845.75**, 8 340 sans tarif externe, 875 sans tarif interne ; ligne 197105 : 06.01.2025, 08:00, 09:00, « 1.0 », « 135.0 », « 90.0 » ; 3 940 272 octets |
| T14 | 2 | Heures septembre 2025 | 925 lignes, Σ 1 081.75 h ; Σ période × tarif externe 10 867.50, × tarif interne 78 848.75 ; 873 / 180 lignes sans tarif |
| T15 | 2 | Frais 2026 | **45** lignes, Σ Montant **1 030.70** = Σ Montant externe, monnaie « CHF » ×45 ; 13 montants à plus de 2 décimales (ID 9213 : « 19.599999999999998 ») ; 23 012 octets |
| T16 | 2 | Frais 2025 | 108 lignes, Σ **8 121.52** ; ID 9081 « 1182.885 », 9082 « 1130.5620000000001 », 8251 « 30.799999999999997 » ; 48 860 octets |
| T17 | 2 | Adresses | **754** adresses sur 755 ; types Société 465, Personne 262, Famille 17, Association 6, Communauté 4 ; 9 N° AVS, 11 dates d'anniversaire ; premiers ID 11302, 12101, 4144 ; 326 310 octets |
| T18 | 2 | `ch10bFontApply` sur `timeTemplates/Standard` → « AkkuratLL-Light » | 7 modèles, 63 pages, **608** éléments changés (527 ArialMT + 81 Arial-BoldMT) ; `timeTemplates/Default` intact |
| T19 | 2 | `ch10bImportMerge` : les 63 pages de `timeTemplates/Standard` | 0 page ajoutée, 0 groupe, 0 modèle ; renommé en groupe « Essai » : 1 `modelegroupe` (`libelle` « Essai », `ordre` 9, non verrouillé), 1 `formtemplategroup`, 7 `modele` (libellés vides), 7 `formtemplate`, 63 pages |
| T20 | 2 | `ch10bChartName` | (« Heures: 2025 », « Rapport_des_heures ») → « Heures, 2025.png » ; (« Analyse 6 », « septembre 2025 ») → « Analyse 6 septembre 2025.png » (mois en minuscules, comme `MOIS_L`) ; (« », « Apercu_12 ») → « Apercu_12.png » ; (« », « ») → « Snapshot.png » |
| T21 | 3 | `ch10cRemap` 1401 : 4301 → 4256 | **13** remplacements : entreprises 1 (+ `nomCourt`), mutations.destination 4, contrats 1 + avenants 2, paiements 4, arrêtés 1 ; 0 référence à 4301 restante ; `ordresPaiement` inchangés ; 2 entreprises portent 4256 (pas de fusion) |
| T22 | 3 | `ch10cRemap` 1251 : 6303 → 6303 et 2551 : 9001 → 9001 (même adresse) | références inchangées (1251 : entreprise, contrat, 2 paiements, arrêté ; 2551 : entreprise, 1 paiement hors contrat) ; `nomCourt` = NAME1 actuel de l'entité (vrai ; faux avant) ; un avenant fictif portant l'ancien contact sous un contrat d'un autre contact reste inchangé |
| T23 | 3 | `ch10cCanEdit`, `ch10cShortDesc` | `USERID` vide → vrai ; = `ME.id` → vrai ; autre + `[NO]` → vrai ; autre + `[YES]` → faux ; `ch10cShortDesc` : `SHORTLABEL` « X » → « X » ; personne liée + entité → « <personne>,<entité> » (sans espace) ; entité seule → « <entité> » |
| T24 | 3 | automate du verrou (`ch10cLockStep`, `DS` simulé) | libre → posé ; posé par cet onglet → ouverture immédiate ; posé ailleurs → dialogue ; 409 à la pose → dialogue ; Annuler → pas d'ouverture ; déverrouillage puis reprise par un tiers → dialogue avec le nouveau détenteur |
| T25 | 4 | `ch10dAllowed(id, origine)` | vrai pour `adr-entites`, `adr-liste`, `adr-favoris`, `adr-groupes`, `adr-props`, `adr-chercher`, `h-saisie`, `h-rapport`, `h-dispo` et pour la vue d'origine ; faux sinon |

Empreintes de référence (`crit/ref_export.py`, SHA-1, 16 premiers caractères) :
- heures 2026 `b3c3a40389dc1d9a` ;
- heures 2025 `f9dc10d00172c202` ;
- frais 2026 `6918555063f2a2c5` ;
- frais 2025 `50e4e0cf768b1341` ;
- frais 09.2025 `26b9177a18bdacf3` ;
- adresses `33a1f863129a03b4`.

Elles contrôlent la conformité au présent cahier, départages [C] compris. L'essai navigateur les recalcule par `crypto.subtle` (disponible sur 127.0.0.1, qui est un contexte sécurisé).

### 6.2 Essai navigateur (copie isolée, par lot)

**Mise en place**
- Dossier du lot : copies de `serveur_deltasub.py` (modifiée au lot 2, avec `outils_deltaproject/convertir_modeles.py` copié à côté) et d'un `DeltaSub.html` construit par `build.py`.
- Base copiée par `sqlite3 …/dstest/deltasub.sqlite ".backup '<dossier>/deltasub.sqlite'"`.
- Serveur `DELTASUB_DB=<dossier>/deltasub.sqlite python3 -I <dossier>/serveur_deltasub.py --port <port attribué au lot>`, en arrière-plan.
- Onglet propre (`tabs_create`, puis `navigate`), `localStorage.ds_user='2752'`, rechargement.

**À la fin** : serveur arrêté, onglet fermé, taille d'affichage par défaut. `window.open` est bloqué dans le panneau : les fichiers se vérifient par le `Blob` produit (lu par `FileReader` ou `arrayBuffer`) et les PNG par `canvas.toDataURL`.

**Contexte non sécurisé** : 127.0.0.1 est un contexte sécurisé, alors que les postes ne le sont pas. Les chemins de repli se testent donc en neutralisant l'API dans l'onglet d'essai : `Object.defineProperty(navigator,'clipboard',{value:undefined,configurable:true})`.

| # | Lot | Scénario | Attendu |
|---|---|---|---|
| B1 | 1 | ouverture | barre Fichier, Edition, Affichage, Réglages, Aide entre le logo et « DeltaSub » ; survol d'un titre voisin quand un menu est ouvert : bascule ; Échap ferme ; un dialogue ouvert recouvre la barre |
| B2 | 1 | Affichage ▸ Masquer la barre des modules | barre des modules masquée, libellé « Afficher la barre des modules » ; rechargement : barre affichée |
| B3 | 1 | vue Gestion ; Fermer les modules ; clic sur la section AFFAIRES | 9 sections fermées, AFFAIRES reste ouverte ; le clic ne la ferme pas ; Ouvrir les modules : 10 ouvertes ; clic sur le logo = Fermer les modules ; rechargement : même état |
| B4 | 1 | COLLABORATEURS ; section Modèles | ordre actuels, Tous, anciens ; plus d'Administrateur (10 entrées) ; Réglages ▸ Administrateur … ouvre la vue `config` |
| B5 | 1 | Affaires ▸ Toutes les affaires, domaine | « Offres d’honoraires » ouvre le calcul des honoraires ; avec `ds_am_dom='Calcul des honoraires'` avant rechargement : même domaine sélectionné |
| B6 | 1 | Edition dans une liste d'adresses | Copier le tableau : toast « Tableau copié (n lignes). », texte identique à celui de la roue ▾ « Fonctions » de la vue ; Exporter : `Blob` `adr-liste_<date>.csv` au contenu identique à `csvTable` ; Couper / Copier / Tout sélectionner / Annuler dans le champ de recherche ; Coller actif sur 127.0.0.1 |
| B7 | 1 | presse-papier, API neutralisée | Coller grisé ; roue ▾ ▸ Copier le contenu du tableau : toast « Tableau copié (n lignes). » (repli `execCommand`, plus d'erreur) ; « Copier l’adresse dans le presse-papier » : « Adresse copiée. » |
| B8 | 1 | `ds_user='1'` (sans CH-08) | « Configurer un collaborateur … » en tête de Réglages, grisé « CH-08 » |
| B9 | 2 | Réglages ▸ Export des données … | Exporter grisé ; choix Heures : dates actives, 01.01.2026 / 31.12.2026 ; Exporter : `Blob` de 3 125 456 octets, SHA-1 `b3c3a403…`, nom « Export.csv » ; fermer puis rouvrir : dates conservées ; Adresses : SHA-1 `33a1f863…` ; Frais 2026 : SHA-1 `69185550…` |
| B10 | 2 | Fichier ▸ Importer les modèles … : appel direct `ch10bImportTemplatesFrom(blob)` avec une archive de `timeTemplates/Standard` faite dans le dossier du lot depuis `DELTAprojectFiles/Templates` (lecture seule) | « Import des nouveaux modèles terminé. » ; 0 page ajoutée ; archive renommée « Essai » : groupe « Essai » visible dans Modèles de temps de travail, 7 modèles, aperçu d'une page identique à Standard |
| B11 | 2 | police sur « Essai » → AkkuratLL-Light | 608 éléments changés, aperçu en Akkurat ; Standard intact |
| B12 | 2 | Management ▸ Controlling, Rapports ▸ Enregistrer le diagramme … ; eCCC Aperçu ; Analyse 6 | PNG (`canvas.toDataURL` vérifié : largeur = 2 × `viewBox`), légende présente ; nom « <titre>.png » ou « <titre> <mois> <année>.png » ; libellé eCCC « Enregistrer le diagramme … » |
| B13 | 2 | serveur : ré-import de contrôle sur la copie après B10 et B11 | `modele` du groupe « Essai » et `modele` de Standard modifiés conservés |
| B14 | 3 | deux onglets propres (2752, puis 2753) : ouvrir le même contrôle des coûts | 2e onglet : « Document verrouillé », Utilisateur = USERID de 2752 ; Annuler : rien ne s'ouvre ; case + OK + Oui : ouverture ; 1er onglet : toast de déverrouillage ; ‹ Liste dans l'onglet détenteur : ligne `documentlock` supprimée ; fermeture de l'onglet : verrou levé (beacon) |
| B15 | 3 | `areBauadDocsLocked` → `[YES]` dans la **copie** ; 2753 modifie un CC de 2752 | message « Vous n’avez pas le droit de modifier ce document. », contenu revenu à l'état enregistré ; eCCC : `EC_MSG_DROITS` ; enregistrement par 2752 : `USERID` du document inchangé |
| B16 | 3 | CC 1401, COMPTES D'ENTREPRISE, clic droit sur 4301 → Synchroniser l'adresse … → 4256 | dialogue « Actualiser l'adresse » ; après OK : 13 remplacements (T21) ; CC 1251, 6303 → 6303 : `nomCourt` = NAME1 actuel |
| B17 | 4 | devis ouvert → lune | seules ADRESSES et HEURES visibles, menus grisés, bandeau « DeltaSub - <nom> » ; clic vers Affaires : refusé (toast) ; Heures ▸ Saisie utilisable ; Reprendre : le devis réapparaît tel quel, verrou toujours posé |
| B18 | 4 | soumission ouverte → lune → Adresses → Reprendre | la soumission n'a pas été fermée (verrou `LOCKUSERID` inchangé), travail en cours conservé |

---

## 7. Écarts assumés

| # | Écart | Raison |
|---|---|---|
| E1 | Menu **Edition** ajouté (extension), avec les deux commandes de tableau | demande explicite de Paulo ; absent de l'original (§ 1 n° 1) ; D-10.1 |
| E2 | Raccourcis ⌘M, ⌘T, ⌘⇧T, ⌘Q ni armés ni affichés | réservés par le navigateur ; D-10.3 |
| E3 | À propos dans Aide, Préférences dans Réglages seulement, Quitter omis | pas de menu d'application dans une page web |
| E4 | Entrées sans objet omises : Mettre à jour les licences CRB, Gestion des licences DELTAproject et CRB, Rechercher les mises à jour, Support, Emplacement du dossier DELTAprojectFiles, [Dev] ×4, Export iOS | services de l'éditeur ou du poste, serveur DeltaSub, D9 |
| E5 | Entrées d'autres chantiers grisées avec la mention du chantier | livraison progressive |
| E6 | Conditions de droit ignorées tant que `rgCan` (CH-08) n'existe pas | ne pas changer les écrans avant les droits de CH-08 |
| E7 | Export : pas de choix du dossier ni de confirmation d'écrasement ; dates par sélecteur natif | navigateur (téléchargement « Export.csv ») |
| E8 | Égalités de tri départagées par l'ID | ordre de la base Derby non reproductible ; fichiers déterministes |
| E9 | Droit `contactExport` appliqué à l'export des adresses | corrige un défaut de l'original ; D-10.8 |
| E10 | Import des modèles : pas de titre du sélecteur ; entrées hors des 7 catégories ignorées ; compteurs en console | navigateur ; l'original les écrirait où rien ne les lit |
| E11 | Police : liste des polices connues (modèles, réglages, CH-12) au lieu des polices installées | le navigateur ne liste pas les polices |
| E12 | PNG : polices du navigateur, légende redessinée ; suffixe reconnu au format « <mois> <année> » ; nom de l'appelant si le diagramme n'a pas de titre | rendu SVG → canvas ; les appelants existants ne sont pas modifiés |
| E13 | Protection du CC : refus à l'enregistrement (retour à l'état enregistré) au lieu d'avant l'action ; l'en-tête, la duplication et la suppression de la liste ne sont pas contrôlés (CH-07) | un seul point d'accroche au lieu de 145 classes |
| E14 | Verrou posé à l'ouverture seulement ; tenu tant que le document reste ouvert dans l'onglet | les listes DeltaSub n'ont pas de fenêtre de document séparée ; ancres minimales |
| E15 | Veille par navigation restreinte, bandeau et « Reprendre » ; titre « DeltaSub - <nom> » ; infobulle « Veille » | les vues DeltaSub ne se dessinent pas dans un dialogue |
| E16 | CC : auteur conservé, date mise à jour à l'enregistrement ; à la duplication, DeltaSub garde l'utilisateur courant comme auteur de la copie (l'original recopie l'auteur de la source) | la date est un repère utile de DeltaSub ; duplication hors des ancres de CH-10 (CH-07) |
| E17 | « Offres d’honoraires » avec apostrophe typographique | convention de `DOMAINS` |
| E18 | Colonnes d'icône exclues de « Copier / Exporter le tableau » par leur contenu (cellules sans texte avec icône), et non par leur clé `ty` | CH-10 ne modifie pas `grid` |
| E19 | Conflit à la pose d'un verrou : le message générique de `DS.commit` (« Modifié entre-temps sur un autre poste… ») précède le dialogue « Document verrouillé » | `DS.commit` n'est pas modifié |
| E20 | Retour de Veille : aucun `nomCourt` réécrit (l'original met à jour les noms courts en mémoire) | l'affichage lit déjà le carnet d'adresses ; aucune écriture silencieuse |

---

## 8. Écarts et incohérences hors chantier signalés (non traités ici)

1. **CH-08 (`spec_18`)** : restes de la première rédaction, contraires à son arbitrage 2.
   - § 9.1 A1 (`  buildNav(); NET.ok(); chooseUser();` + ` ch08aMenuBar();`) et A7 (`copyTable` → `ch08aCopyText`) ;
   - § 9.3 et § 10 lot 1 : `ch08aMenuBar`, `ch08aMenuModel`, `ch08aClean`, `ch08aCopyText`, `ch08aTableText`, « contrat `dsMenu_*` ».
   Intégrés tels quels, ces restes donneraient deux barres, et A7 échouerait sur l'ancre déjà remplacée par CH-10 C1. **À retirer par CH-08.** Les « ancres de présence P1, P2 » annoncées par `spec_18` (l. 12) ne figurent pas dans son § 9.1. CH-10 propose d'y tester `function ch10aModel(` et `ch10aBeforeGo(id,arg)`.
2. **CH-08 (`spec_18` § 6.1, valeur attendue du modèle de menus)** : pour 2752, la liste attendue omet « Gestion des utilisateurs … », alors que son propre § 3.4 donne `userAdmin : oui` à 2752. Valeur correcte : § 4.1.3.
3. **CH-02 lot 1 (écrit)** : `ch02a.js` l. 141 écrit `USERID:ME.id` dans l'en-tête du devis à chaque enregistrement. L'original conserve l'auteur ; avec `[YES]`, l'auteur deviendrait « le dernier qui a enregistré ». À aligner sur D-10.12 : `USERID:d.USERID||ME.id`.
4. **Transferts de la Soumission vers le CC** (EC-1), `dvDuplicate`, `ccDuplicate` : ils posent l'utilisateur courant comme auteur. C'est sans conséquence tant que la protection vaut `[NO]`.
5. **CH-11 (`spec_16`)** : « Offres d'honoraires » est fait par **CH-10 lot 1 (`ch10a`)**, non par « lot 4, `ch10e` » ; corriger les mentions (§ 0 n° 12, § 1 n° 20, § 2, § 14, § 16).
6. **CH-02 / CH-07** : le ⌥⌃-clic de l'original sur un module BÂTIMENT montre aussi les documents marqués comme supprimés (§ 1 n° 38) : à considérer avec « Mes devis » (CH-02 lot 4) et la liste du CC (CH-07 lot 3, qui reçoit la corbeille du CC).
7. **`ccEditor.save` sans `bseq`** : une écriture simultanée écrase l'autre en silence (CH-07) ; le verrou du lot 3 réduit le risque.
8. **Modèles non protégés au ré-import** : aujourd'hui, les groupes créés ou renommés dans DeltaSub (`tplNewGroup`, `tplRenameGroup`) sont perdus au ré-import ; la ligne S1 du lot 2 corrige ce défaut.
9. **Auteurs disparus** : 13 documents vivants (9 devis, 4 CC) ont un auteur disparu. Avec `[YES]`, personne ne pourrait plus les modifier ; à traiter dans les Paramètres système (CH-08) avant d'activer la protection.
10. `rateOfGroup` accepte un `VALIDFROM` vide, alors que l'original lèverait une erreur : sans effet pratique.

---

## 9. Points d'ancrage DeltaSub

### 9.1 Règles du `build.py` de chaque lot

- Il prend le chemin du `DeltaSub.html` source en argument (défaut : celui du dépôt) et, au lot 2, celui du serveur.
- Il vérifie chaque ancre : compte = 1 ; pour la plage E2, première ligne unique et empreinte SHA-1 des 2 lignes jointes par `\n` = `d5454f907c1e`.
- **Ancres idempotentes** (N3, H1-H4, C1-C4) : si l'ancien texte est absent mais le nouveau présent (fait par un autre chantier), l'ancre est sautée avec un avertissement ; si aucun des deux n'est présent, c'est un échec.
- Il **échoue proprement** (message, code non nul, aucun fichier écrit) si une ancre manque ou est multiple.
- Il insère le bloc du lot **avant** le commentaire qui ouvre `DÉMARRAGE` (dernier `\n/*` avant la ligne `   DÉMARRAGE`), après avoir vérifié que `const HEAVY=` le précède.
- Le bloc ne contient que des déclarations de haut niveau et n'exécute aucun code au chargement ; `ch10aInit` est appelée par M1. Il ne redéclare aucune fonction existante : le build vérifie que chaque nom déclaré est absent de la source.
- Il produit `lotN_integration.md` : la liste exacte des remplacements « ancien → nouveau » et le bloc inséré.

### 9.2 Ancres (vérifiées sur md5 `b5db7920…` par `research/crit19/verif_ancres_v2.py`)

| # | Lot | Ancre (« ancien », exact) | « Nouveau » | l. |
|---|---|---|---|---|
| A0 | 1-4 | ligne `   DÉMARRAGE` | bloc du lot inséré avant le commentaire | 14 503 |
| M1 | 1 | `  $('#boot').remove();` | `  $('#boot').remove(); if(typeof ch10aInit==='function') ch10aInit();` | 14 516 |
| G1 | 1 | `  if(VIEW&&VIEW.v&&VIEW.v.leave) VIEW.v.leave(id,arg);` | `  if(typeof ch10aBeforeGo==='function'&&ch10aBeforeGo(id,arg)===false) return;` ⏎ + l'ancien intact | 363 |
| G2 | 1 | `  const m=$('#main'); m.innerHTML=''; v.render(m,arg,id);` | même ligne + ` if(typeof ch10aAfterGo==='function') ch10aAfterGo(id,arg);` | 369 |
| M4 | 1 | `s.onclick=()=>{ s.classList.toggle('open');` | `s.onclick=()=>{ if(typeof ch10aVeto==='function'&&ch10aVeto(s)) return; s.classList.toggle('open');` | 358 |
| N1 | 1 | `['collab-actuels','Collaborateurs actuels'],['collab-anciens','Anciens collaborateurs'],['collab-tous','Tous les collaborateurs']` | `['collab-actuels','Collaborateurs actuels'],['collab-tous','Tous les collaborateurs'],['collab-anciens','Anciens collaborateurs']` | 340 |
| N3 | 1 | `,['config','Administrateur']` | (vide) ; sauté si `['config',` n'apparaît plus dans `NAV` (CH-12) | 347 |
| H1 | 1 | `'Calcul des honoraires','Contrats honoraires',` suivi d'un saut de ligne (`DOMAINS`) | `'Offres d’honoraires','Contrats honoraires',` + saut de ligne | 1 477 |
| H2 | 1 | `'Frais','Calcul des honoraires','Contrats honoraires','Planification RH'` (`domainUsed`) | `'Frais','Offres d’honoraires','Contrats honoraires','Planification RH'` | 1 498 |
| H3 | 1 | `if(d==='Calcul des honoraires'){ feDomain(C,top,pane,p); return; }` | `if(d==='Offres d’honoraires'\|\|d==='Calcul des honoraires'){ feDomain(C,top,pane,p); return; }` | 1 545 |
| H4 | 1 | `try{ AM.dom=localStorage.getItem('ds_am_dom')\|\|AM.dom; }catch(_){}` | `try{ AM.dom=localStorage.getItem('ds_am_dom')\|\|AM.dom; if(AM.dom==='Calcul des honoraires') AM.dom='Offres d’honoraires'; }catch(_){}` | 1 480 |
| C1 | 1 | `function copyTable(g){ navigator.clipboard.writeText(tableText(g,'\t')); toast('Tableau copié ('+g.view.length+' lignes).'); }` | `function copyTable(g){ ctCopy(tableText(g,'\t'),'Tableau copié ('+g.view.length+' lignes).'); }` | 749 |
| C2 | 1 | `navigator.clipboard.writeText(ta.value); toast('Courriels copiés.');` | `ctCopy(ta.value,'Courriels copiés.');` | 743 |
| C3 | 1 | `navigator.clipboard.writeText(adrLines(curA()).join('\n')); toast('Adresse copiée.');` | `ctCopy(adrLines(curA()).join('\n'),'Adresse copiée.');` | 782 |
| C4 | 1 | `navigator.clipboard.writeText(adrLines(DS.get('contact',x.RESPCONTACT_ID)\|\|DS.get('contact',x.CONTACT_ID)).join('\n')); toast('Intervenant copié.');` | `ctCopy(adrLines(DS.get('contact',x.RESPCONTACT_ID)\|\|DS.get('contact',x.CONTACT_ID)).join('\n'),'Intervenant copié.');` | 1 517 |
| E2 | 2 | plage `function mgSaveChart(el,name){` … `document.body.append(a); a.click(); a.remove(); }` (2 lignes, SHA-1 `d5454f907c1e`) | `function mgSaveChart(el,name){ return typeof ch10bSaveChart==='function'?ch10bSaveChart(el,name):null; }` | 2 131-2 132 |
| E3 | 2 | `    {i:'doc',t:'Editer la page',fn:()=>tplOpenEditor()}]]; },` | `    {i:'doc',t:'Editer la page',fn:()=>tplOpenEditor()}],...(typeof ch10bTplTools==='function'?ch10bTplTools(cat):[])]; },` | 6 481 |
| E6 | 2 | `{t:'Enregistrer le graphique (SVG)',fn:()=>mgSaveChart(ch,'Apercu_'+ctx.id)}` | `{t:'Enregistrer le diagramme …',fn:()=>mgSaveChart(ch,'Apercu_'+ctx.id)}` | 5 693 |
| E7 | 2 | `{t:'Enregistrer le graphique (SVG)',fn:()=>mgSaveChart(ch,'Resultats_'+ctx.id)}` | `{t:'Enregistrer le diagramme …',fn:()=>mgSaveChart(ch,'Resultats_'+ctx.id)}` | 6 361 |
| S1 | 2 | serveur : ligne `PROTECTED_IF_EDITED \|= {"statisticalvalue", "constructionpart", "constructioncomponent", "ebkpelement", "ebkptobkp"}` | ligne **ajoutée après** : `PROTECTED_IF_EDITED \|= {"modele", "modelegroupe", "formtemplate", "formtemplategroup"}   # CH-10 lot 2 : anciens modèles modifiés ou importés dans DeltaSub` (CH-01, CH-02 lot 3 et CH-08 S0 ajoutent aussi après la même ancre : compatibles, chacun garde l'ancre intacte) | serveur 61 |
| S2 | 2 | serveur : `        if urlparse(self.path).path != "/api/commit":` | **avant** : `        if urlparse(self.path).path == "/api/modeles/zip":` ⏎ `            return ch10_modeles_zip(self)   # CH-10 lot 2` (CH-03 insère aussi avant la même ligne : compatible) | serveur 399 |
| S3 | 2 | serveur : `# ─────────── HTTP ───────────` | **avant** : fonction `ch10_modeles_zip(h)` (§ 3.3) | serveur 340 |
| P1 | 3 | `function ecCanEdit(doc){ return true; }` | `function ecCanEdit(doc){ return typeof ch10cCanEdit==='function'?ch10cCanEdit(doc):true; }` (le commentaire de fin de ligne reste) | 3 619 |
| P6 | 3 | `  const save=()=>DS.commit([{t:'costcontrol',id,val:C},{t:'costcontroldocument',id,val:{...DS.get('costcontroldocument',id),CHANGEDDATE:today(),USERID:ME.id}}]);` (ligne entière) | `  const save=()=>(typeof ch10cGuard==='function'&&!ch10cGuard('costcontroldocument',id))?Promise.reject(Object.assign(new Error('droits'),{conflict:true})):DS.commit([{t:'costcontrol',id,val:C},{t:'costcontroldocument',id,val:(d=>({...d,CHANGEDDATE:today(),USERID:d.USERID\|\|ME.id}))(DS.get('costcontroldocument',id))}]);` | 2 901 |
| P2 | 3 | `async function dvOpen(id){ await DS.need(['projectcatalog','projectcatalogpos']); DV.open=+id; go('devis'); }` | `async function dvOpen(id){ if(typeof ch10cGate==='function'&&ch10cGate('costestimatedocument',id,()=>dvOpen(id))) return; await DS.need(['projectcatalog','projectcatalogpos']); DV.open=+id; go('devis'); }` (le préfixe `async function dvOpen(id)`, repère de fin de L1 de CH-02 lot 4, est conservé) | 2 573 |
| P3 | 3 | `function ccOpen(id){ CCV.open=+id;` | `function ccOpen(id){ if(typeof ch10cGate==='function'&&ch10cGate('costcontroldocument',id,()=>ccOpen(id))) return; CCV.open=+id;` | 2 877 |
| P4 | 3 | `function ecOpen(id,back){ if(EC_V.el&&EC_V.el.doc!==+id) EC_V.el=null;` | `function ecOpen(id,back){ if(typeof ch10cGate==='function'&&ch10cGate('costplanningdocument',id,()=>ecOpen(id,back))) return; if(EC_V.el&&EC_V.el.doc!==+id) EC_V.el=null;` | 3 748 |
| P5 | 3 | `    if(sec==='COMPTES D’ENTREPRISE'){ const ents=` | `    if(sec==='COMPTES D’ENTREPRISE'&&typeof ch10cEntCtx==='function') ch10cEntCtx(pane,{get C(){ return C; },id,doc,p,load,draw:()=>draw()});` ⏎ + l'ancien intact | 2 972 |
| V1 | 4 | `leave(id){ if(id!=='soum'&&SV_UI.ed) svClose({silent:true}); } };` | `leave(id){ if(id!=='soum'&&SV_UI.ed&&!(typeof ch10dOn==='function'&&ch10dOn())) svClose({silent:true}); } };` | 11 248 |

Dans le fichier d'intégration, les `\|` de ce tableau s'écrivent `|`, et `\n` dans C3 et C4 est le texte à deux caractères (antislash + n) du source.

**Croisement avec les autres chantiers**
- Aucune de ces ancres n'est visée par un lot déjà écrit (CH-01 lot 1, CH-02 lot 1, CH-17 lots 1 et 2) ; les fichiers qui les contiennent ailleurs dans `ch/*/` sont des copies intégrales du script.
- Seul conflit : C1 = `spec_18` A7, à retirer par CH-08 (§ 8 n° 1).
- CH-08 vise aussi le démarrage (A1 : `  buildNav(); NET.ok(); chooseUser();`, D1 : `  try{ await DS.boot(); }`), sur d'autres lignes que M1.
- CH-08 lot 2 filtre `NAV` (B1 `  NAV.forEach(sec=>{`, B2), sur d'autres lignes que M4 et N1.
- CH-08 lot 2 réécrit `go` à la ligne `const v=VIEWS[id]||VIEWS._todo; VIEW={id,v,arg};`, distincte de G1 et G2 (mais `spec_18` révisé dit ne plus ancrer `go` et passer par `rgBeforeGo`).

**Fonctions existantes réutilisées, sans modification** : `h`, `esc`, `num`, `cmp`, `dfr`, `diso`, `today`, `toast`, `ICO`, `icon`, `ibtn`, `setTools`, `popMenu`, `closeMenus`, `dialog`, `confirmDlg`, `ctMsg`, `ctOk`, `ctCopy`, `svYesNo` (modèle), `formRows`, `readK`, `grid`, `phead`, `col`, `tableText`, `csvTable`, `hfSet`, `svRight`, `svCanEdit`, `svNowIso`, `svFmtTs`, `pickContact`, `ccEntName`, `ownerOf`, `adrLines`, `tplNeed`, `tplKey`, `tplCurGroup`, `tplModelesOf`, `TPL_TABLES`, `MOIS_L`, `ME`, `NAV`, `VIEWS`, `go`, `buildNav`, `DS.all/get/by/commit/need/newIds/on`, `DS.S`, `DS.loaded`.

**Modèles de structure** : `svLockAsk`, le `pagehide` + `sendBeacon` de la Soumission, `svDlgAddrSynch`, `svRemap`, `ecCss`.

**Aucune modification** :
- de `svLockAsk`, `svSetLock`, `svLockOp` (verrou de la Soumission, déjà livré) ;
- de `grid`, `mgChart`, `plBanner`, `paDomain`, `paM6`, `DS` ;
- de `tplView` hors E3 ;
- de la barre du Devis (CH-02 R3), de la barre, de la liste et des dialogues du CC hors P3, P5 et P6 ;
- de la ligne `['devis','Devis']` (CH-02 A2) et de la ligne des groupes de modèles hors N3 (CH-12).

### 9.3 Préfixes

- **Préfixes réservés** :
  - fonctions `ch10a`, `ch10b`, `ch10c`, `ch10d` ; constantes `CH10A_` … `CH10D_` ;
  - classes CSS `ch10a-` … `ch10d-` ; identifiants `#ch10a-mb`, `#ch10a-css`, `#ch10d-css` ;
  - clé `ds_ch10d_last` ; collection `documentlock` ;
  - route `/api/modeles/zip` ; fonction serveur `ch10_modeles_zip`.
- **Vérification** : 0 occurrence dans `DeltaSub.html` et dans `serveur_deltasub.py`, et 0 déclaration dans les 235 fichiers `.js`, `.py`, `.md`, `.html` de `ch/*/` hors CH-10 (`verif_ancres_v2.py`, 30.09.2026).
- **Noms attendus des autres chantiers** (résolus par `typeof`, jamais déclarés par CH-10) :
  - CH-08 : `rgCan`, `rgEmployees`, `rgUserAdmin`, `rgSystemPreferences`, `rgSystemLegacyPreferences`, `rgPreferences`, `rgHelp`, `rgAbout`, `rgBeforeGo`, et leurs noms de secours `ch08cEmployees`, `ch08bUserAdmin`, `ch08aSysPrefs`, `ch08aLegacyPrefs`, `ch08cPreferences`, `ch08aHelp`, `ch08aAbout` ;
  - CH-04 : `ch04ImportVCards`, `ch04ImportContacts` ;
  - CH-13 : `ch13Paths`.

---

## 10. Plan en lots

**Taille totale : M.** Estimation : lot 1 ≈ 420 lignes, lot 2 ≈ 560 lignes + 70 lignes Python, lot 3 ≈ 440 lignes, lot 4 ≈ 160 lignes.

La fiche prévoyait 4 lots (exports et modèles ; Veille ; synchronisation, protection, déverrouillage ; navigation et libellés), `rech_orig` 5. Regroupement retenu :
- la barre de menus demandée par Paulo, l'Edition, l'Affichage, la navigation, les libellés et le presse-papier forment le **lot 1**, préalable de CH-08 ;
- les exports, l'import et la police des modèles et les diagrammes forment le **lot 2** ;
- tout le Bâtiment forme le **lot 3** ;
- la Veille forme le **lot 4** ;
- les reliquats de la Planification RH n'ont plus de code (§ 4.14).

Chaque lot livre, dans `ch/CH-10/lotN/` :
- `ch10x.js` : déclarations de haut niveau seulement, aucun accès au DOM au chargement, aucune redéclaration ;
- `build.py` ;
- `lotN_integration.md` ;
- les tests jsc ;
- le `DeltaSub.html` construit pour l'essai ;
- au lot 2, la copie modifiée complète du serveur et son diff.

### Lot 1 — Barre de menus (Fichier, Edition, Affichage, Réglages, Aide), Affichage, navigation et presse-papier (préfixe `ch10a` / `CH10A`)

- **Ancres** : A0, M1, G1, G2, M4, N1, N3, H1-H4, C1-C4.
- **Contenu** :
  - `CH10A_EDITION`, `CH10A_MENU` (§ 4.1.2 : clés `Strings.db`, libellés, conditions, listes de noms `f`, chantier) ;
  - `ch10aModel(X)` pur (conditions, grisage, séparateurs, Fichier omis s'il est vide) ; `ch10aCtx()` (contexte réel : `ch10aCan`, `hfSet`, `ME`, `typeof`, état du champ actif et du tableau courant) ;
  - `ch10aCss`, `ch10aInit` (barre dans `#top`, logo → `ch10aCollapse`, Échap), `ch10aOpen` (via `popMenu`, bascule au survol, focus conservé), `ch10aRun(nom)`, `ch10aEnable(on)` ;
  - `ch10aCan(code)` ; `ch10aBeforeGo`, `ch10aAfterGo` (chaînes vers `ch10dBeforeGo`, `rgBeforeGo`, `ch10cAfterGo`, `ch10dAfterGo`) ;
  - Affichage : `ch10aToggleNav`, `ch10aExpand`, `ch10aCollapse`, `ch10aVeto`, `ch10aNavState` (pur) ;
  - Edition : `ch10aEditCmd(k)`, `ch10aCurTable()`, `ch10aTableRows(table)`, `ch10aTableText(rows, sep)` (même règle que `tableText`), export CSV identique à `csvTable` ; copies par `ctCopy` ;
  - libellés et ordre (N1, N3, H1-H4) ; presse-papier (C1-C4).
- **Tests** : T0 à T8 ; essais B1 à B8.
- **Dépendances** : aucune. CH-04, CH-08, CH-13 et les lots 2 à 4 sont branchés par `typeof`. **Préalable de CH-08 lot 1.**

### Lot 2 — Export des données, Importer les modèles (serveur), police de tous les modèles, diagrammes PNG (préfixe `ch10b` / `CH10B`)

- **Ancres** : A0, E2, E3, E6, E7 ; serveur S1-S3 (le build prend aussi le chemin du serveur en argument).
- **Fichiers en plus** : `serveur_deltasub.py` modifié (copie complète) + `serveur.diff` ; extracteur de jeux de test (effacés après usage) ; archive de test faite dans le dossier du lot.
- **Contenu** :
  - export : `CH10B_DATES`, `ch10bDataExport` (fenêtre, règles, D-10.8), `ch10bJavaDouble`, `ch10bFmtTime`, `ch10bFmtDate`, `ch10bYesNo`, `ch10bCmpIC`, `ch10bOwnerName`, `ch10bRate`, `ch10bRowsContacts`, `ch10bRowsTimeLog`, `ch10bRowsCost`, `ch10bCsvBytes`, `ch10bDownload` (fonctions pures séparées de l'interface) ;
  - import : `ch10bImportTemplates` (sélecteur), `ch10bImportTemplatesFrom(blob)` (appel serveur), `ch10bImportMerge(pages, état)` pur → opérations ;
  - police : `ch10bTplTools(cat)` (roue ▾), `ch10bFontDialog(cat)`, `ch10bFontList()`, `ch10bFontApply(modeles, police)` pur ;
  - diagrammes : `ch10bSaveChart(el,name)`, `ch10bChartName(titre,name)` pur, `ch10bLegendSvg(el)` ;
  - serveur : `ch10_modeles_zip`, route, ligne `PROTECTED_IF_EDITED` (§ 3.3).
- **Tests** : T0, T9 à T20 ; essais B9 à B13.
- **Dépendances** : lot 1 (entrées Fichier ▸ Importer les modèles … et Réglages ▸ Export des données …). `tplView` et `mgSaveChart` existent déjà.

### Lot 3 — Bâtiment : protection, verrou et déverrouillage, synchronisation d'adresse du contrôle des coûts (préfixe `ch10c` / `CH10C`)

- **Ancres** : A0, P1-P6.
- **Fichiers en plus** : jeux de test des CC 1401, 1251 et 2551 (effacés après usage).
- **Contenu** :
  - protection : `ch10cCanEdit(doc)` (= `svCanEdit`), `ch10cGuard(t,id)` (message du module), `CH10C_MSG` ; P1, P6 (auteur conservé) ;
  - verrou : `CH10C_HELD`, `ch10cKey`, `ch10cGate`, `ch10cAcquire`, `ch10cRelease`, `ch10cHeld`, `ch10cLockDlg` (dialogue et confirmation « Avertissement »), `ch10cCanUnlock`, `ch10cAfterGo` (levée des documents fermés), `ch10cBye` (`pagehide`), écouteur de déverrouillage distant ; automate pur `ch10cLockStep` pour T24 ;
  - synchronisation : `ch10cEntCtx(pane,ctx)` (clic droit), `ch10cSyncDlg(ctx, ancien)`, `ch10cShortDesc(contact)` (nom court de l'original), `ch10cRemap(C, ancien, nouveau, nomCourt)` pur (règle exacte du § 4.12, contrôlée contre `research/crit19/ref_remap.py`).
- **Tests** : T0, T21 à T24 ; essais B14 à B16.
- **Dépendances** : lot 1 (point `ch10aAfterGo` pour la levée ; sans lui, levée à la fermeture de l'onglet seulement). CH-08 est facultatif (`rgCan`, réglage de protection éditable). Compatible avec CH-02 lot 1 (`bseq` et `ch02aCanEdit` du Devis).

### Lot 4 — Veille (préfixe `ch10d` / `CH10D`)

- **Ancres** : A0, V1 (plus G1 et G2 du lot 1).
- **Contenu** : `CH10D` (état), `CH10D_IDS` (9 vues), `ch10dAllowed(id, origine)` pur, `ch10dAfterGo` (bouton lune dans les 4 fenêtres Bâtiment), `ch10dStart`, `ch10dStop`, `ch10dBeforeGo`, `ch10dOn`, bandeau, masquage des sections, `ch10dCss`, mémoire `ds_ch10d_last`.
- **Tests** : T0, T25 ; essais B17, B18.
- **Dépendances** : lot 1 (points `ch10aBeforeGo`, `ch10aAfterGo`, `ch10aEnable`, affichage de la barre des modules). Lot 3 facultatif : les verrous restent posés pendant la Veille sans code supplémentaire.

### Non livré (et pourquoi)

| Élément | Raison |
|---|---|
| Réglages ▸ Export iOS … (JSON ou XML pour l'application mobile de l'éditeur) | D9 : sans objet, aucune trace d'usage |
| Mettre à jour les licences CRB, Gestion des licences DELTAproject / CRB, Rechercher les mises à jour, Support, Emplacement du dossier DELTAprojectFiles, [Dev] ×4, Quitter | services de l'éditeur ou du poste ; sans objet dans un navigateur |
| `lockExportAllAddresses`, « Exporter toutes les adresses », « Exporter les adresses pour DELTAbauad », « Exporter les coûts d'affaire », « Propriétés », « Durée » | obsolètes ou libellés morts en 16.05 (§ 1 n° 7-8) |
| Bouton « Projekt-Liste [Bering] » | version de développement seulement |
| Contenu de Préférences, Paramètres système, Gestion des utilisateurs, mots de passe, droits, Configurer un collaborateur, Aide, À propos ; commandes de session (indicateur `#net`) | CH-08 (écrit en parallèle ; entrées déjà branchées) |
| Importer des vCards, Importer des adresses | CH-04 (entrées branchées) |
| Emplacements des modèles et des documents externes | CH-13 (masqué au bureau) |
| « Mes devis » ; ⌥⌃-clic (documents supprimés dans les listes Bâtiment) | CH-02 lot 4, CH-07 (§ 8 n° 6) |
| Corbeille du contrôle des coûts | CH-07 lot 3 (`spec_17` révisé) |
| Séparation MODELES DOCUMENTS / ANCIENS MODELES | CH-12, qui ajoute les modules du premier groupe |
| Menus « Fichier / Edition / Paramètres » des fenêtres de document | CH-02, CH-07, EC-1, EC-2 |
| Protection du Devis ; auteur conservé à l'enregistrement du Devis | CH-02 lot 1 (`ch02aCanEdit` ; § 8 n° 3) |
| Protection de l'en-tête, de la duplication et de la suppression dans la liste du CC | CH-07 (liste réécrite ; `ch10cGuard` exposée) |
| Veille des Séances et des versions de plan | CH-15, CH-16 (modules absents) ; `ch10dStart` réutilisable |
| Verrou à l'édition d'en-tête, à la duplication, à la suppression, à l'export | E14 |
| Raccourcis ⌘M, ⌘T, ⌘⇧T | E2 |
| Flèches ↑ ↓ neutralisées dans la barre des modules | sans objet : la barre de DeltaSub ne se parcourt pas au clavier |

---

## 11. Décisions restantes pour Paulo

1. **D-10.1 Menu « Edition ».** L'original n'en a pas dans sa fenêtre principale ; vous l'avez demandé.
   - Par défaut : **ajouté** comme extension, avec le titre et les entrées du menu Edition que l'original a dans ses éditeurs : « Edition » (sans accent, comme dans Deltaproject), Annuler, Rétablir, Couper, Copier, Coller, Tout sélectionner, plus Copier le tableau et Exporter le tableau.
   - Variante : barre strictement fidèle (4 menus), par une constante ; ou titre « Édition » avec accent.
2. **D-10.2 Nom du domaine d'affaire** : « Offres d'honoraires » (libellé de 16.05) ou « Calcul des honoraires » (manuel, spec_9) ? Par défaut, **« Offres d'honoraires »**, fait par CH-10 lot 1.
3. **D-10.3 Raccourcis ⌘M, ⌘T, ⌘⇧T** : impossibles dans le navigateur ; par défaut, **ni armés ni affichés**.
4. **D-10.4 Veille** par navigation restreinte (ADRESSES et HEURES, bouton « Reprendre ») au lieu d'une fenêtre : par défaut, **oui**.
5. **D-10.5 Verrou « Document verrouillé »** étendu au Devis, au contrôle des coûts et à l'eCCC, comme l'original, « Annuler » abandonnant l'ouverture : par défaut, **oui**. Il s'ajoute à la détection des conflits de CH-02.
6. **D9 Export iOS** : **sans objet** (non reproduit, entrée omise).
7. **D-10.6 `lockExportAllAddresses`** : réglage mort en 16.05 ; par défaut, **non repris**.
8. **D-10.7 N° AVS et date d'anniversaire** dans l'export des adresses (9 et 11 adresses au bureau) : par défaut, **fidèle (35 colonnes)** ; variante : colonnes vidées.
9. **D-10.8 Droit « Module Adresses: exporter »** : sans effet dans l'original ; par défaut, **appliqué** à l'export des adresses. Aucun effet visible au bureau : tous les comptes qui exportent ont ce droit.
10. **D-10.9 Encodage** : par défaut, **UTF-16 avec BOM**, fichier identique à celui de Deltaproject (Excel l'ouvre par l'import de texte). Variante : UTF-8 avec BOM, comme les exports de tableaux, pour un double-clic dans Excel.
11. **D-10.10 Modèles** : par défaut, **ainsi** :
    - import des archives `.zip` par le serveur (réutilisation de `convertir_modeles.py`), jamais d'écrasement ;
    - changement de police permis aussi sur « DELTA Originaux », comme l'original ;
    - modèles modifiés dans DeltaSub protégés au ré-import.
12. **D-10.11 Verrou résiduel du bureau** (un devis, octobre 2025) : par défaut, **non repris**.
13. **D-10.12 Auteur conservé** à l'enregistrement du contrôle des coûts. L'original ne le change pas ; DeltaSub le remplace aujourd'hui par le dernier utilisateur. Par défaut, **conservé** ; à aligner aussi dans CH-02 (Devis) et EC-1 (transferts).
14. **D-10.13 Presse-papier** : correction des 4 copies inopérantes sur les postes du bureau (tableaux, courriels, adresse, intervenant) : par défaut, **oui**, au lot 1.
15. **spec_10 n° 2 et n° 14** : libellé corrigé de la dernière ligne de l'Analyse 6 et bandeau « aucune planification saisie », déjà en place partout : par défaut, **gardés**.

---

## 12. Changements par rapport à la version de 12 h 29

| § | Version de 12 h 29 | Version 2 |
|---|---|---|
| Réf. | md5 `866e3ea8…` (`a0165c9`) | md5 `b5db7920…` (`9c9a3f9`, 14 522 lignes) ; 30 ancres recontrôlées, dont 3 nouvelles ; numéros de ligne mis à jour |
| 0, 1 n° 4-5 | barre de CH-10, noms `rg*` seuls ; conflit non vu | conflit avec `spec_18` établi puis résolu (révision de CH-08 : CH-10 lot 1, préalable de CH-08) ; listes de noms `rg*` + noms de secours `ch08*` ; restes de `spec_18` signalés (§ 8 n° 1-2) |
| 1 n° 2-3, 4.2 | « Édition » : Couper, Copier, Coller, Tout sélectionner | « Edition » et entrées du menu Edition de l'original (`form.TextEditorDialog`, `form\|form`) : + Annuler, Rétablir ; « … » des commandes de tableau établis [P] |
| 1 n° 7-8 | `export2` et `lockExportAllAddresses` : recherche précédente | recherche binaire refaite sur les 7 jars (aucun `export2` ; `lockExportAllAddresses` seulement dans `Setting.class`) |
| 1 n° 21, 4.1.3 | 2752 : Réglages sans détail | valeur exacte (avec Gestion des utilisateurs) ; comptes 1 et 2 ; écart de `spec_18` signalé |
| 1 n° 24-26, 4.12 | correspondance [D] ; « contrats et avenants » remplacés s'ils portent l'ancien | correspondance [P] ; règle en cascade du contrat de 1er niveau ; avenant d'un autre contrat non touché ; 1re entreprise seulement ; virgule sans espace vérifiée octet par octet ; « … » du menu contextuel [P] |
| 1 n° 30, 4.5 | C1 facultatif, nouveau helper `ch10aCopyText` | C1 à C4 obligatoires, par `ctCopy` existant ; aucun nouveau helper |
| 1 n° 31 | corbeille non mentionnée | corbeille du CC → CH-07 lot 3 (`spec_17` révisé) |
| 1 n° 32 | — | lot de « Offres d'honoraires » : CH-10 lot 1 ; `spec_16` à corriger |
| 1 n° 34, 36, 38 | — | retour de Veille sans écriture ; pas de contrôle début ≤ fin ; ⌥⌃-clic signalé |
| 4.9 | suffixe « si l'appelant le passe » | suffixe reconnu au format « <mois> <année> », que les appelants passent déjà ; `ch10bChartName` testé (T20) |
| 4.11.6 | — | API générique du verrou pour CH-11 |
| 6 | T0-T23, B1-B17 | T0-T25, B1-B18 ; compteurs de la base recontrôlés ; tests des noms de secours, du repli du presse-papier, de la règle en cascade |
| 7 | E1-E17 | + E18 (colonnes d'icône), E19 (message de conflit du verrou), E20 (retour de Veille) ; E13 et E16 précisés |
| 11 | 15 décisions | D-10.1 précisé (titre « Edition ») ; D-10.13 (presse-papier) remplace « Correction C1 » |

Rien n'a été modifié dans le dépôt, dans Deltaproject ni dans les bases (lecture seule, copies dans `research/crit19/`).

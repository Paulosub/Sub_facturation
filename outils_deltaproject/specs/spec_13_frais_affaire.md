# Cahier des charges — CH-17 « Configurer les frais de l'affaire » (groupes et genres de frais) dans DeltaSub

Version du rédacteur critique, 30.09.2026 ; **révision 2 du 30.09.2026, 13 h 40**, faite après l'intégration du chantier (voir « État » ci-dessous). Ce cahier décrit comment reproduire dans `DeltaSub.html` la commande Affaires ▸ Gestion ▸ « Configurer les frais » de Deltaproject 16.05 (`ProjectCostCategoriesDialog`, `ProjectCostCategoryGroupDialog`, `ProjectCostCategoryDialog`) avec ses deux imports. Il confronte les deux recherches du chantier (`ch/CH-17/rech_orig.md` sur l'original, `ch/CH-17/rech_exist.md` sur DeltaSub), la fiche CH-17 et le § 16 de l'inventaire. Chaque point contesté a été revérifié à la source pour ce cahier.

**Conventions**
- **[P] PROUVÉ** : bytecode `Classe.méthode@offset` (désassemblages dans `scratchpad/ch/CH-17/jp/`), libellé `Strings.db (classe|id)`, données de la base de test `dstest/deltasub.sqlite` (copie fidèle de la base du bureau : 202 groupes, 1 158 genres, 635 frais).
- **[D] DÉDUIT** : interprétation cohérente, non démontrée ligne à ligne.
- **[C] CHOIX** : décision de conception pour DeltaSub. Elle est signalée à Paulo (§ 7 et § 11).

**Références DeltaSub.** `DeltaSub.html` du dépôt au 30.09.2026 10:08 : 14 324 lignes, md5 `866e3ea8b5cc940578c02640ace6a15d`, commit `7c8e543` plus des modifications non commitées d'autres chantiers. Le fichier change pendant le travail des chantiers parallèles : **seules les ancres textuelles du § 9 font foi**, les numéros de ligne sont indicatifs. Les lignes 1 à 1 700 sont identiques à `ece452b` (base des recherches).

**État (révision 2).**
- **Chantier livré et intégré.** Les deux lots du § 10 sont dans le dépôt : commit `9c9a3f9` (« DeltaSub : Gestion ▸ « Configurer les frais … » de l'affaire (CH-17) + avertissement dans la saisie des frais »). Il est précédé du correctif `b50edc6` (`readK`, § 8 n° 7).
  - `DeltaSub.html` du HEAD : 14 522 lignes, md5 `b5db79206029ddfe413a4ec83bcd3858`, identique octet pour octet à `ch/CH-17/lot2/DeltaSub.html`. `lot1/ch17a.js` et `lot2/ch17b.js` y figurent à l'identique.
  - La version 1 de ce cahier a été copiée dans `outils_deltaproject/specs/spec_13_frais_affaire.md` ; elle est conservée dans `ch/CH-17/work/spec_13_v1.md`. La révision 2 ne modifie **aucune règle fonctionnelle**. Remplacer la copie du dépôt est l'affaire de l'intégrateur ; rien n'a été modifié dans le dépôt.
- **Contre-vérification à la source faite pour cette révision** :
  - bytecode : menu `+` (`addNewPopupMenuItems@0-151`), ordre des contrôles des deux suppressions (`@43-183`, `@43-137`), calculatrice sans confirmation (`jCalcBudgetButtonActionPerformed@0-63`), prix à facturer masqué (`ProjectCostCategoryDialog.<init>@335-351`), estompage limité au statut « Configuration » (`FadingCellRenderer@102-125`), `Integrity` (frais **ou** ligne de calcul d'honoraires pour un genre) ;
  - `Strings.db` : tous les libellés du § 4.12 (titres, champs, colonnes, menu, messages) et ceux du § 1 ;
  - données : `work/verif_spec2.py` sur `dstest`, toutes les valeurs du § 6 retrouvées au centime.
  - **Aucune erreur de fond** n'a été trouvée.
- **Changements de la révision 2** : état et plan (§ 0, § 10) ; mesures de mise en page retenues par les relectures (§ 4.2, § 4.8, § 4.9, § 7 E15-E16) ; résultats des contrôles faits sur la version intégrée (§ 6.3) ; correctif `readK` (§ 8 n° 7) ; lignes des ancres dans le HEAD (§ 9) ; précisions sur les décisions n° 1 à 3 et sur ce qu'impliquerait chaque variante (§ 11) ; une précision au § 1 (n° 15).

**Aucune donnée personnelle** : identifiants, compteurs, libellés d'interface et libellés génériques de frais seulement. **Aucun contenu CRB.**

**Fichiers de vérification** : `ch/CH-17/jp/` (désassemblages), `ch/CH-17/stats.py`, `stats2.py`, `work/data_frais*.py`, `work/verif_spec.py` (contrôles de ce cahier), `work/DeltaSub_ref.html` (copie de référence du 30.09.2026 10:08). Révision 2 : `work/verif_spec2.py` (contre-vérification des données), `work/DeltaSub_HEAD.html` (copie du HEAD `9c9a3f9`), `specrev/` (essai navigateur de la version intégrée, § 6.3).

---

## 0. Synthèse

1. **Blocage levé.** DeltaSub n'écrit jamais `projectcostcategorygroup` ni `projectcostcategory` : une affaire créée dans DeltaSub ne peut recevoir aucun frais, car la saisie ne propose que les groupes et genres de l'affaire. CH-17 ajoute l'écran de configuration et ses deux imports [P : aucune écriture de ces collections dans `DeltaSub.html`].
2. **Un dialogue à deux panneaux** « Configurer les frais » : groupes à gauche (Groupe de frais | Prévision CHF), genres du groupe sélectionné à droite (Genre de frais | Unité | Prix | Prévision CHF). Chaque panneau a sa barre `+ E − ⤒ ↑ ↓ ⤓` ; bouton « Fermer » (§ 4.2).
3. **Le `+` des groupes est un menu** : « Nouveau … », « Importer du dossier standard … », « Importer d'une affaire existante … ». Le dernier est **grisé dès que l'affaire a un groupe** (§ 4.3).
4. **Statut « Configuration » exigé** pour les deux imports et les deux suppressions, **pas** pour créer, éditer ou déplacer (§ 3.4).
5. **Suppressions** : un groupe non vide est refusé ; un groupe ou un genre sur lequel des frais sont comptabilisés est refusé (message « Le remplacement n'est pas possible, … », qui s'affiche bien à la **suppression**) ; un genre utilisé dans un calcul d'honoraires aussi (§ 4.7).
6. **« Prix à facturer » existe en base mais est masqué** dans l'original : DeltaSub ne l'affiche pas, l'initialise à 0, le conserve à l'édition et le copie à l'import depuis une affaire (§ 4.5).
7. **Bouton calculatrice** du groupe : remplace la prévision par la somme des prévisions des genres, arrondie au centime comme `Formatter.round`, **sans confirmation** (§ 4.4).
8. **Imports** : du standard, choix multiple, **ajout** sans dédoublonnage, `SORTORDER` du standard recopié ; d'une affaire, toutes les affaires sauf la courante, copie des noms, de l'ordre, de l'unité, du prix et du prix à facturer, jamais de la prévision (§ 4.8, § 4.9).
9. **D16 (arrêtée)** : pas de copie automatique à la création d'une affaire (fidèle) ; import manuel ; **avertissement DeltaSub** dans la saisie des frais quand l'affaire n'a aucun groupe (extension, l'original n'en a pas) (§ 4.11).
10. **Cascade** : la suppression d'une affaire DeltaSub supprime aussi ses groupes et genres de frais (l'original le fait par cascade JPA ; `delProject` l'oublie) (§ 4.10).
11. **Aucun document imprimé** dans ce chantier (§ 5).
12. **Plan : 2 lots** (§ 10), **livrés et intégrés** (commit `9c9a3f9`). Lot 1 `ch17a` : tout le dialogue, les imports et la cascade. Lot 2 `ch17b` : l'avertissement D16. **Aucun lot ne reste à construire** ; il reste les trois décisions du § 11, dont les choix par défaut sont déjà en service.

---

## 1. Arbitrages entre les sources (tranchés à la source)

| # | Sujet | Affirmations en présence | Verdict | Preuve |
|---|---|---|---|---|
| 1 | 1re entrée du menu `+` des groupes | « Ajouter un groupe de frais » (`rech_exist` § 3) | **« Nouveau … »**. « Ajouter un groupe de frais » est l'infobulle morte `newCostCategoryGroupT` | [P] `ProjectCostCategoriesDialog.addNewPopupMenuItems@23-26` (`newProjectCostCategoryGroup` = « Nouveau », `mapStringWithEllipsis`) |
| 2 | Infobulles des boutons | 7 infobulles listées (`rech_exist` § 3), dont « Rimuovi genere di spese » | **Aucune** dans l'original : les chaînes `…T` ne sont référencées par aucune classe. DeltaSub met des infobulles sobres [C] (§ 7, E2) | [P] `ProjectCostCategoriesDialog.<init>@60-197` : icônes seules, aucun `setToolTipText` |
| 3 | Colonnes des genres | 5, avec « Prix à facturer » (`spec_2` § 5.9, `rech_exist` § 3) | **4** : Genre de frais \| Unité \| Prix \| Prévision CHF | [P] `db.ProjectCostCategoryTableModel` `<clinit>` : `costCategoryCol`, `unitCol`, `unitPriceCol`, `budgetCol` ; `unitExternalPriceCol` absent |
| 4 | Champ « Prix à facturer » du genre | visible (`spec_2` § 5.9) | **Masqué** (étiquette, champ, unité : `setVisible(false)`) ; valeur conservée, 0 au bureau sur les 1 158 genres | [P] `ProjectCostCategoryDialog.<init>@330-351` ; données |
| 5 | Message de refus lié au statut | `msg2a/msg2b` du dialogue, avec 'Configuration' entre apostrophes droites (`spec_2` § 2) | **`rsrc` `msgProjectIsNotInitializing0/1`** : « Cette fonction n'est disponible que » ⏎ « si le statut de l'affaire est «Configuration». » ; `msg2` est mort | [P] `ProjectCostCategoriesDialog.importFromAdmin@0-31`, `importFromProject@0-31`, `jDelete…GroupButtonActionPerformed@140-172` |
| 6 | « Le remplacement n'est pas possible, car des frais ont déjà été comptabilisés. » | message d'import ou de remplacement (fiche CH-17) | **Message de suppression** d'un groupe ou d'un genre comptabilisé ; aucun import ne l'emploie | [P] `jDeleteProjectCostCategoryGroupButtonActionPerformed@87-134`, `jDeleteProjectCostCategoryButtonActionPerformed@41-88` |
| 7 | Suppression d'un groupe qui contient des genres | cascade avec confirmation (`rech_exist` V8) | **Refus** « Ce groupe ne peut pas être supprimé, car il existe encore des entrées. », **avant** tout autre contrôle | [P] `jDelete…GroupButtonActionPerformed@46-81` (`getProjectCostCategories().isEmpty()`, `msgGroupNotEmpty`) |
| 8 | « Voulez-vous remplacer le montant existant ? » (`ProjectCostCategoryGroupDialog.msg4`) | confirmation de la calculatrice (fiche, `rech_exist` § 3) | **Jamais affiché** (chaîne morte). La calculatrice remplace le champ sans confirmation | [P] `ProjectCostCategoryGroupDialog.jCalcBudgetButtonActionPerformed@0-60` ; seuls `dialogNewTitle`, `dialogEditTitle`, `budgetTitle`, `budget`, `msg5a`, `msg5b` sont chargés |
| 9 | Import dans une affaire qui a déjà des groupes | « les précédents seront remplacés » (`spec_2` § 5.1, règle des activités) | Standard : **ajout** (aucun remplacement, `SORTORDER` du standard, ex æquo possibles). Affaire : **menu grisé** ; la confirmation `msg5` et le remplacement qu'elle précède sont inatteignables | [P] `ProjectCostCategoryGroupDialog.importFromAdmin@0-305` ; `ProjectCostCategoriesDialog.addNewPopupMenuItems@0-15, @136-146` ; `ProjectCostCategoryGroupDialog.importFromProject@2-68` |
| 10 | « Importer les frais standards d'une affaire » | entrée d'import (`spec_2` § 5.9) | **Libellé mort** (`importCostCategoriesFromProjectT`) ; l'entrée visible est « Importer d'une affaire existante … » | [P] aucune référence dans `DELTAproject.jar` (recherche binaire, `rech_orig` § 10.3) |
| 11 | Confirmation de suppression | `msg4` du dialogue / `msg3` du groupe (« Voulez-vous supprimer cette inscription ? ») | **`rsrc` `msgDeleteEntry`** « Voulez-vous vraiment supprimer cette inscription ? », titre **« Avertissement »**, boutons Oui / Non | [P] `ProjectCostCategoryGroupDialog.deleteProjectCostCategoryGroup@25-47`, `ProjectCostCategoryDialog.deleteProjectCostCategory@25-47` |
| 12 | Titre des refus | non établi (`rech_exist` question 7) | **« Information »**, icône d'information, bouton OK | [P] `jDelete…GroupButtonActionPerformed@95-134` (`Strings$Label.information`, `INFORMATION_MESSAGE`) |
| 13 | Pratique du bureau | « 3 ou 4 groupes configurés à la main » (inventaire § 16.4) | **Importés** : 36 affaires ont exactement la configuration de l'affaire modèle 701 (dont 3454, 3551, 3601, 3651) ; 4 affaires (2501, 3251, 3351, 3352) ont exactement le standard actuel à 4 groupes. Aucune prévision, aucun prix à facturer, aucun nom hors standard ou modèle | [P] `work/verif_spec.py` (signatures identiques 701 = 3651 = 3454) ; `stats.py` |
| 14 | Avertissement quand l'affaire n'a aucun groupe | à reproduire (fiche) | **Absent de l'original** : liste vide, OK grisé, aucun message. L'avertissement D16 est une **extension DeltaSub** | [P] `deltaproject.expenses.ProjectCostDialog` : seuls `msgProjectIsNotActive`, `msgProjectSubPhaseIsTerminated`, `msgDeleteEntry` |
| 15 | « Choix de l'affaire » (import depuis une affaire) | filtre par statut ? affaire courante incluse (`pickProject`) ? | **Toutes les affaires (tous statuts) sauf la courante** ; colonnes Numéro \| Affaire ; les affaires au statut « Configuration » sont **estompées** | [P] `ProjectBrowserDialog.setProjectListTable@0-48` (`Project.getProjectList` = `Project.findAll`, `removeAll`) ; `FadingCellRenderer@102-127, @345-385` (`isInitializing` → alpha 125). Révision 2 : `rech_orig` § 10.2 écrit « affaires inactives estompées », ce qui est **inexact** : pour `ProjectTableModel`, seul `isInitializing` est testé (`@102-125`) |
| 16 | Règle de l'ordre | « ±2 de `ctReorder` » ou « échange de voisins » | **Les deux coïncident** quand `SORTORDER` vaut 1..n : ±2 puis tri stable et renumérotation 1..n. DeltaSub réutilise `ctReorder` [C] (écart seulement sur des `SORTORDER` non normalisés, § 7 E7) | [P] `setProjectCostCategoryGroupSortOrder{Top,Backward,Forward,Bottom}@23-30` ; `db.ProjectCostCategoryGroupTableModel.sort@0-46` |
| 17 | `SORTORDER` d'un nouvel élément | à partir de 0 (modèle `cfgActivities`) | **Nombre d'éléments du panneau + 1**, sans renumérotation | [P] `db.ProjectCostCategoryGroupTableModel.add@0-12`, `db.ProjectCostCategoryTableModel.add@0-12` |
| 18 | Arrondi de la prévision calculée | `num()` de DeltaSub (`toFixed`) | **`Formatter.round`** : `signe × Math.round(|x| × 100) / 100`. Écart réel : 2.675 → « 2.68 » (Deltaproject) contre « 2.67 » (`toFixed`) ; 1.115 → « 1.12 » contre « 1.11 » | [P] `util.Formatter.round@0-67`, `formatDouble@0-17` ; calcul jsc et Python |
| 19 | Titres des dialogues d'édition | « Editer » partout | Groupe : « Nouveau groupe de frais » / **« Modifier le groupe de frais »** ; genre : « Nouveau genre de frais » / **« Editer le genre de frais »** (asymétrie de l'original, reproduite) | [P] `Strings.db (ProjectCostCategoryGroupDialog|dialogEditTitle)`, `(ProjectCostCategoryDialog|dialogEditTitle)` |
| 20 | Contrôle de droit | droit `projectCosts` | Exigé dans l'original ; **non contrôlé** dans DeltaSub, dont la Gestion ne contrôle aucun droit (relève de CH-08) [C] | [P] `ProjectDefinitionFrame.addProjectSettingsPopupMenuItems@251-306` ; `rech_exist` § 1.4 |

---

## 2. Périmètre

### 2.1 Reproduit (fidèle)

- Entrée « Configurer les frais … » dans le menu Configuration de la Gestion ; active pour une affaire sélectionnée.
- Dialogue « Configurer les frais » : deux panneaux, barres, règles d'activation, double-clic.
- « Nouveau groupe de frais » / « Modifier le groupe de frais » : 4 langues, Budget ▸ Prévision, calculatrice.
- « Nouveau genre de frais » / « Editer le genre de frais » : 4 langues, Unité, Prix « CHF / unité », Budget ▸ Prévision ; prix à facturer masqué mais conservé.
- Ordre (au début, monter, descendre, à la fin) et renumérotation 1..n.
- Suppressions avec l'ordre exact des contrôles et les messages exacts.
- « Importer du dossier standard … » (dialogue « Frais », choix multiple) et « Importer d'une affaire existante … » (dialogue « Choix de l'affaire »).
- Contrôle du statut « Configuration » là où l'original l'exige.
- Suppression des groupes et genres avec l'affaire.

### 2.2 Extension DeltaSub (décision D16, arrêtée)

- Avertissement non bloquant dans la fenêtre de saisie des frais (frais d'affaire et notes de frais) quand l'affaire choisie n'a aucun groupe de frais (§ 4.11).
- **Pas** de copie automatique des frais standard à la création d'une affaire (fidèle : aucune classe de Deltaproject ne crée de groupe hors des trois dialogues du chantier, `rech_orig` § 1).

### 2.3 Hors périmètre

- Administrateur ▸ Frais standard (édition de l'unité, du prix, du groupe, des 4 langues, de l'ordre) : CH-06. Le chantier lit le standard tel qu'il est.
- Contrôle des droits (`projectCosts`) : CH-08.
- Récapitulatif des frais, « Grouper les coûts » (lecteurs de la prévision) : CH-09.
- Contrôle du statut « Configuration » pour les imports d'activités, de tarifs et de phases, et cascade des tables d'activités, de phases partielles et de tarifs dans `delProject` : CH-05 (signalés au § 8).

### 2.4 Place et accès

- **Original** [P] : Gestion ▸ bouton roue ▾ (paramètres de l'affaire), 5e entrée après « Attribuer les activités aux collaborateurs », avant « Configurer les séances ». Visible avec le droit `projectCosts`, active si exactement une affaire est sélectionnée (`addProjectSettingsPopupMenuItems@0-16`, `@251-306`).
- **DeltaSub** [C] : menu clé « Configuration » de `VIEWS['aff-gestion']`, **à la suite de « Configurer les phases »** (l'ordre de DeltaSub diffère déjà : activités, tarifs, phases). Libellé **« Configurer les frais … »** (espace + « … », comme `Rsrc.mapStringWithEllipsis` et comme « Définir les modèles … » dans DeltaSub). Ouverture par `need(ch17aOpen)` : sans affaire sélectionnée, le toast existant « Sélectionnez une affaire. ».

---

## 3. Modèle de données

### 3.1 Collections (aucune nouvelle collection)

| Collection | Champs écrits | Défauts à la création | Lecture |
|---|---|---|---|
| `projectcostcategorygroup` | `ID`, `PROJECT_ID`, `NAMEGE`, `NAMEFR`, `NAMEIT`, `NAMEEN`, `BUDGET`, `SORTORDER` | `BUDGET: 0` (jamais `null`) | `DS.by('projectcostcategorygroup','PROJECT_ID',p.ID)` |
| `projectcostcategory` | `ID`, `PROJECTCOSTCATEGORYGROUP_ID`, `NAMEGE`, `NAMEFR`, `NAMEIT`, `NAMEEN`, `UNIT`, `UNITPRICE`, `EXTERNALUNITPRICE`, `BUDGET`, `SORTORDER` | `UNITPRICE: 0`, `EXTERNALUNITPRICE: 0`, `BUDGET: 0` | `DS.by('projectcostcategory','PROJECTCOSTCATEGORYGROUP_ID',g.ID)` |
| `costcategorygroup` (standard, lu) | `ID`, `NAMEGE/FR/IT/EN`, `SORTORDER`, `DESCRIPTION` | — | `DS.all` |
| `costcategory` (standard, lu) | `ID`, `COSTCATEGORYGROUP_ID`, `NAMEGE/FR/IT/EN`, `UNIT`, `UNITPRICE`, `SORTORDER` | — | `DS.all` |
| `projectcost`, `projectfeecostitem` (lus) | `COSTCATEGORYGROUP_ID`, `COSTCATEGORY_ID` | — | contrôles de suppression |

[P] Colonnes et types : `schema.txt` (`PROJECTCOSTCATEGORYGROUP`, `PROJECTCOSTCATEGORY`), champs `double` primitifs (jamais `null` : 0 sur les 202 + 1 158 enregistrements de la base de test, `verif_spec.py`). Le standard n'a ni `BUDGET` ni `EXTERNALUNITPRICE`.

Règles d'écriture [C] (convention DeltaSub, sans effet visible) :
- noms et unité : texte « trimé », `null` si vide (`readK`) ; l'original enregistre la chaîne vide ;
- nombres : `+valeur` (0 si vide), jamais `null`.

### 3.2 Ordre (`SORTORDER`)

| Action | Règle | Preuve |
|---|---|---|
| Nouveau groupe / nouveau genre | `SORTORDER` = nombre d'éléments du panneau **+ 1**, aucune renumérotation | [P] `TableModel.add@0-12` |
| Éditer | enregistrement, puis **tri stable et renumérotation 1..n de tout le panneau** | [P] `TableModel.edit` → `sort@0-46` |
| Supprimer | suppression, puis renumérotation 1..n des restants | [P] `TableModel.remove` → `sort` |
| Au début / Monter / Descendre / À la fin | `ctReorder(list,id,how)` puis écriture des seules lignes changées (`ctMoveRec`) | [P] règle ±2 ; [C] réutilisation (§ 7 E7) |
| Importer du dossier standard | `SORTORDER` **du standard**, sans renumérotation (ex æquo possibles avec les groupes existants) | [P] `importFromAdmin@92-99, @205-212` |
| Importer d'une affaire existante | `SORTORDER` **de la source** | [P] `importFromProject@294-297, @407-410` |

**Affichage** : tri par `SORTORDER`, puis par `ID` pour les ex æquo [C] (ordre stable ; l'original ne le définit pas). Tri par en-tête désactivé (`ctNoSort`), comme les autres tableaux ordonnés à la main.

**Au bureau** [P] : `SORTORDER` va toujours de 1 à n (67 affaires, 202 groupes), jamais d'ex æquo.

### 3.3 Écritures groupées et concurrence

- **Un seul `DS.commit` par action** : l'élément édité ou supprimé et les voisins renumérotés ; un import entier (groupes et genres) ; une cascade d'affaire.
- **Identifiants** : `DS.newIds(t,n)` une fois par collection et par action (jamais avec `n = 0`). Sur une copie fraîche de la base de test, les premiers identifiants sont **1604** (groupes) et **2268** (genres) [P : max 1603 / 2267, aucun compteur `next_id:`].
- **`bseq`** : lu à l'ouverture d'un dialogue d'édition (`(DS.S[t]||{})[String(id)]`) et passé sur l'opération de l'élément édité ; lu au clic sur `−` pour une suppression. Les voisins renumérotés prennent la version courante (défaut de `DS.commit`). Conflit 409 : le toast de `DS.commit` s'affiche, le dialogue d'édition reste ouvert ; les actions directes (ordre, suppression, import) redessinent les panneaux.
- **Statut relu au moment de l'action** : `DS.get('project',p.ID).PROJECTSTATECODE`, pas la copie passée à l'ouverture.

### 3.4 Statut « Configuration »

[P] `db.Project.isInitializing@0-18` = `PROJECTSTATECODE === 1` (`Project$ProjectState.created`). DeltaSub : `PSTATE[1]` = « Configuration » ; une nouvelle affaire naît au statut 1 (`editProject`, l. 1141).

| Action | Statut 1 exigé | Autres conditions |
|---|---|---|
| Ouvrir le dialogue | non | une affaire sélectionnée |
| Nouveau / Modifier un groupe | non | OK : Français non vide, Prévision numérique |
| Nouveau / Editer un genre | non | un groupe sélectionné ; OK : Français non vide, Prix et Prévision numériques |
| Déplacer | non | position |
| Supprimer un groupe | **oui** (3e contrôle) | aucun genre ; aucun frais |
| Supprimer un genre | **oui** (2e contrôle) | aucun frais, aucune ligne de calcul d'honoraires |
| Importer du dossier standard | **oui** | — |
| Importer d'une affaire existante | **oui** | l'affaire n'a aucun groupe (menu grisé sinon) |

### 3.5 Serveur et reprise Deltaproject : aucune modification

- `projectcostcategorygroup` et `projectcostcategory` ne sont pas dans `PROTECTED` (`serveur_deltasub.py`), comme `project`, `projectactivitygroup`, `projectcost` et `timelog`. Une reprise Deltaproject `--force` remplace donc la configuration faite dans DeltaSub, comme les frais et les heures qui y sont saisis. C'est la politique actuelle des référentiels d'affaire ; CH-17 ne la change pas (décision au § 11, n° 3).
- **Risque résiduel** : `projectfeecostitem` est protégé et pointe vers `projectcostcategory`. Une ligne de calcul d'honoraires saisie dans DeltaSub sur un genre créé dans DeltaSub pendrait après une reprise, ou pointerait vers un autre genre si l'identifiant est réattribué (les compteurs `next_id:` des collections non protégées sont effacés à la reprise). Le bureau n'a **aucune** ligne `projectfeecostitem` aujourd'hui.

### 3.6 Arrondi

`ch17aR(x) = (x < 0 ? −1 : 1) × Math.round(|x| × 100) / 100`, avec 0 pour −0 [P `Formatter.round@0-67`]. Affichage `ch17aN(x) = num(ch17aR(x))` : « 1'234.75 », « 0.00 ». Il sert au résultat de la calculatrice (enregistré arrondi) et aux colonnes Prix et Prévision du dialogue.

---

## 4. Écrans et dialogues

### 4.1 Entrée de menu

Remplacement exact au § 9 (A1) : `{t:'Configurer les frais …',fn:need(ch17aOpen)}` à la suite de « Configurer les phases ».

### 4.2 Dialogue « Configurer les frais » (`ch17aOpen(p)`)

**Fenêtre** [P `ProjectCostCategoriesDialog.<init>@12-253`] ; adaptation DeltaSub [C] :
- titre : **« Configurer les frais — » + `projLabel(p)`** [C] (convention de `cfgActivities` ; l'original affiche « Configurer les frais ») ;
- un seul bouton : **« Fermer »** (principal, Échap) ;
- corps : grille de deux colonnes, `minmax(260px,1fr)` et `minmax(420px,2fr)`, écart 10 px, largeur minimale 780 px ; chaque panneau = `phead` + boîte de 300 px de haut à défilement (même boîte que `cfgActivities`).

**Tableau des groupes** (gauche) [P `db.ProjectCostCategoryGroupTableModel`, `Strings.db (ProjectCostCategoryGroupTableModel|costCategoryGroupCol, budgetCol)`] :

| Colonne | Contenu | Format |
|---|---|---|
| Groupe de frais | `nm(g)` | texte |
| Prévision CHF | `BUDGET` | `ch17aN`, aligné à droite, largeur **110** (révision 2 : à 100 px, l'en-tête devient « Prévision C… », il faut 101 px ; valeur retenue par la relecture du lot 1, § 7 E15) |

« CHF » = monnaie de l'affaire : `hfCur(p)` (`CURRENCY`, sinon monnaie principale, sinon CHF), comme `Project.getCurrency` [P `db.Project.getCurrency@0-18`].

**Tableau des genres** (droite) [P `db.ProjectCostCategoryTableModel`] : genres du groupe sélectionné.

| Colonne | Contenu | Format |
|---|---|---|
| Genre de frais | `nm(c)` | texte |
| Unité | `UNIT` | texte, largeur 60 |
| Prix | `UNITPRICE` | `ch17aN`, à droite, largeur 80 |
| Prévision CHF | `BUDGET` | `ch17aN`, à droite, largeur **110** (même raison) |

**Comportement** [P] :
- sélection simple ; tri par en-tête désactivé (`ctNoSort`) ;
- à l'ouverture, aucun groupe sélectionné, tableau des genres vide ;
- sélectionner un groupe recharge les genres et désélectionne le genre (`$ProjectCostCategoryGroupListSelectionListener.valueChanged@24-35`) ;
- **double-clic** sur une ligne = bouton E du panneau (`initProjectCostCategoryGroupTable@24-39`, `initProjectCostCategoryTable@24-39`) ;
- après « Nouveau », la nouvelle ligne est sélectionnée (`Tables.selectRow`) ; après un déplacement, la ligne déplacée reste sélectionnée ; après une suppression ou un import, plus rien n'est sélectionné dans le panneau touché (le tableau des genres se vide si c'est le panneau des groupes) [D pour la suppression].

**Barres** : groupes `[+▾] [E] [−] [⤒] [↑] [↓] [⤓]`, genres `[+] [E] [−] [⤒] [↑] [↓] [⤓]`. Les quatre boutons d'ordre sont ceux de `ctMoveBtns` (icônes `first`, `prev`, `next`, `last`, infobulles « Au début », « Monter », « Descendre », « À la fin »).

**Activation** (`checkGuards@0-245` [P]), recalculée après chaque sélection, écriture ou import. `g` = un groupe sélectionné (rang `ig` sur `ng`), `c` = un genre sélectionné (rang `ic` sur `nc`) :

| Bouton | Actif si |
|---|---|
| Groupes `+▾` | toujours |
| Groupes E, − | `g` |
| Groupes ⤒, ↑ | `g && ig > 0` |
| Groupes ↓, ⤓ | `g && ig < ng − 1` |
| Genres `+` | **`g`** |
| Genres E, − | `c` |
| Genres ⤒, ↑ | `c && ic > 0` |
| Genres ↓, ⤓ | `c && ic < nc − 1` |

Réalisation : boutons créés par `ibtn` et gardés en référence ; `el.disabled` mis à jour ; `B.upd(i,n)` de `ctMoveBtns` pour les flèches.

### 4.3 Menu `+` des groupes

[P `addNewPopupMenuItems@0-155`] :

| # | Libellé | Action | Activation |
|---|---|---|---|
| 1 | **Nouveau …** | « Nouveau groupe de frais » (§ 4.4) | toujours |
| 2 | **Importer du dossier standard …** | § 4.8 | toujours (le statut est contrôlé après le clic) |
| 3 | **Importer d’une affaire existante …** | § 4.9 | **grisé si l'affaire a au moins un groupe** (`dis:true`, que `popMenu` rend inerte) |

Apostrophe typographique « ’ » dans les libellés et messages [C] (convention DeltaSub ; mêmes mots que `Strings.db`, § 7 E9).

### 4.4 « Nouveau groupe de frais » / « Modifier le groupe de frais » (`ch17aEditGroup`)

[P `ProjectCostCategoryGroupDialog.<init>`, `initComponents`, `checkGuards@0-141`, `jOkButtonActionPerformed@0-79`]

| Ligne | Libellé | Champ | Règle |
|---|---|---|---|
| 1-4 | Deutsch, Français, Italiano, English | `lang4(v)`, `maxLength = 64` | [P] `LengthGuard(64)` |
| 5 | **Budget** (titre de section, en gras) | bouton **calculatrice** sur la même ligne | [P] `<init>@347-354` ; icône SVG en ligne [C] (§ 7 E10), sans infobulle |
| 6 | Prévision | champ numérique (`type=number`, `step=any`, aligné à droite, 120 px) suivi de « CHF » (`hfCur(p)`) | valeur initiale `ch17aR(BUDGET).toFixed(2)` : « 0.00 » pour un nouveau groupe |

- **Boutons** : Annuler, OK (principal).
- **OK actif** si **Français non vide** et **Prévision non vide** (un `type=number` invalide donne `''`, ce qui couvre « . » et « ' » de `Formatter.isDouble`). Recalcul à chaque frappe (`input`). Le test du Français porte sur le texte « trimé » [C] (l'original teste le texte brut, § 7 E4).
- **Calculatrice** [P `jCalcBudgetButtonActionPerformed@0-60`] : `Prévision ← ch17aR(Σ BUDGET des genres enregistrés du groupe)`, affichée `toFixed(2)`, **sans confirmation**, rien n'est enregistré avant OK. Nouveau groupe : « 0.00 ». Les prévisions du groupe et des genres restent indépendantes hors de ce bouton.
- **OK** : noms « trimés », `BUDGET = +Prévision` ;
  - nouveau : `ID` par `DS.newIds`, `PROJECT_ID`, `SORTORDER = ng + 1` ; un commit ; la ligne est sélectionnée ;
  - édition : commit de l'enregistrement (avec son `bseq`) et des voisins renumérotés (`ch17aRenum`).

### 4.5 « Nouveau genre de frais » / « Editer le genre de frais » (`ch17aEditCat`)

[P `ProjectCostCategoryDialog.<init>`, `setUnitOfPrice@0-54`, `checkGuards@0-169`, `jOkButtonActionPerformed@0-124`]

| Ligne | Libellé | Champ | Règle |
|---|---|---|---|
| 1-4 | Deutsch, Français, Italiano, English | `maxLength = 64` | [P] |
| 5 | Unité | texte, `maxLength = 16`, 100 px | [P] `LengthGuard(16)` |
| 6 | Prix | champ numérique suivi de l'étiquette **« CHF / km »** (monnaie + « / » + unité), ou **« CHF »** si l'unité est vide ; mise à jour à chaque frappe dans Unité | [P] `setUnitOfPrice` (recette `"\u0001 / \u0001"`) |
| — | *Prix à facturer* | **non affiché** ; `EXTERNALUNITPRICE` = 0 à la création, **inchangé** à l'édition | [P] `<init>@330-351` |
| 7 | **Budget** (titre de section) | — | [P] |
| 8 | Prévision | champ numérique suivi de « CHF » | [P] |

- Dialogue non redimensionnable dans l'original (sans objet dans DeltaSub).
- **OK actif** si Français non vide et Prix et Prévision non vides. L'unité est facultative.
- **OK** : noms et `UNIT` « trimés » (`null` si vides), `UNITPRICE`, `BUDGET` numériques ; nouveau : `PROJECTCOSTCATEGORYGROUP_ID` = groupe sélectionné, `SORTORDER = nc + 1`, `EXTERNALUNITPRICE: 0`, ligne sélectionnée ; édition : `{...ancien, champs}` (le prix à facturer est conservé) et renumérotation des genres du groupe.

### 4.6 Ordre

- ⤒ ↑ ↓ ⤓ des deux panneaux : `ctMoveRec(t, liste du panneau triée, id, 'first'|'prev'|'next'|'last')` ; la ligne déplacée reste sélectionnée ; redessin.
- Pas de contrôle du statut [P].

### 4.7 Suppressions

**Groupe** (`ch17aDelGroup`), contrôles dans cet ordre [P `jDeleteProjectCostCategoryGroupButtonActionPerformed@0-186`] :

| # | Condition | Boîte | Texte exact |
|---|---|---|---|
| 1 | le groupe contient au moins un genre | Information / OK | Ce groupe ne peut pas être supprimé, car il existe encore des entrées. |
| 2 | au moins un `projectcost` avec `COSTCATEGORYGROUP_ID` = groupe | Information / OK | Le remplacement n’est pas possible, ⏎ car des frais ont déjà été comptabilisés. |
| 3 | statut de l'affaire ≠ 1 | Information / OK | Cette fonction n’est disponible que ⏎ si le statut de l’affaire est «Configuration». |
| 4 | sinon | **Avertissement**, boutons **Non / Oui** (`ivAsk`) | Voulez-vous vraiment supprimer cette inscription ? |

Oui → un commit : suppression du groupe et renumérotation 1..n des groupes restants. Pas de cascade vers les genres, puisqu'un groupe non vide est refusé.

**Genre** (`ch17aDelCat`) [P `jDeleteProjectCostCategoryButtonActionPerformed@0-140`, `db.Integrity.isProjectCostCategoryDeletable`] :

| # | Condition | Boîte | Texte |
|---|---|---|---|
| 1 | au moins un `projectcost` avec `COSTCATEGORY_ID` = genre, **ou** au moins un `projectfeecostitem` avec `COSTCATEGORY_ID` = genre | Information | Le remplacement n’est pas possible, ⏎ car des frais ont déjà été comptabilisés. (même texte dans les deux cas) |
| 2 | statut ≠ 1 | Information | Cette fonction n’est disponible que ⏎ si le statut de l’affaire est «Configuration». |
| 3 | sinon | Avertissement, Non / Oui | Voulez-vous vraiment supprimer cette inscription ? |

Oui → un commit : suppression et renumérotation des genres restants du groupe.

La décision est une fonction pure `ch17aDelCheck(kind, {nCats, nCosts, nFee, state})` → `'notEmpty'` | `'booked'` | `'notInit'` | `null`, testée en jsc (§ 6.1). Les boîtes « Information » passent par `ctMsg('Information', texte)` (un bouton OK, `pre-line` pour le saut de ligne).

### 4.8 « Importer du dossier standard … » (`ch17aImportStd`)

1. Statut ≠ 1 → Information `notInit`, fin [P `ProjectCostCategoriesDialog.importFromAdmin@0-31`].
2. Dialogue **« Frais »** (`ch17aStdPick`) [P `admin.CostCategoryGroupBrowserDialog`] :
   - tableau des groupes standard triés par `SORTORDER` (puis `ID`) ; colonnes **Groupe de frais** (`nm`) | **Remarque** (`DESCRIPTION`, vide au bureau) [P `db.admin.CostCategoryGroupTableModel` type `small`] ;
   - **sélection multiple** : grille `multi` de DeltaSub (Maj = plage, Cmd/Ctrl = ajout ou retrait) [P `setSelectionMode(2)`] ;
   - boutons Annuler / OK ; **OK actif si au moins une ligne est sélectionnée** (`ivOkBtn(D).disabled`) ; double-clic = OK ;
   - boîte de **420 px de large, fixe**, sur 300 px de haut (révision 2 : avec une largeur minimale seule, la fenêtre s'étirait à 92 % de l'écran ; § 7 E16).
3. Copie (`ch17aStdOps`, un seul commit) [P `ProjectCostCategoryGroupDialog.importFromAdmin@0-305`], pour chaque groupe choisi dans l'ordre des lignes :
   - groupe : `PROJECT_ID` = affaire, `SORTORDER` = celui du standard, 4 noms, `BUDGET: 0` ;
   - pour chaque genre standard du groupe, par `SORTORDER` : `PROJECTCOSTCATEGORYGROUP_ID` = nouveau groupe, `SORTORDER`, 4 noms, `UNIT`, `UNITPRICE` du standard, `EXTERNALUNITPRICE: 0`, `BUDGET: 0`.
   - **Aucun dédoublonnage, aucun remplacement, aucun message** de fin. Les genres standard sans groupe (possibles dans l'Administrateur actuel de DeltaSub) sont ignorés.
4. Rechargement du panneau des groupes, sélection vidée, activation recalculée.

### 4.9 « Importer d’une affaire existante … » (`ch17aImportPrj`)

1. Entrée grisée si l'affaire a déjà un groupe (§ 4.3).
2. Statut ≠ 1 → Information `notInit`, fin [P `importFromProject@0-31`].
3. Dialogue **« Choix de l’affaire »** (`ch17aPrjPick`) [P `ProjectBrowserDialog`] :
   - champ de recherche (placeholder « Rechercher », filtre `matchQ` sur Numéro et Affaire) ;
   - colonnes **Numéro** | **Affaire** [P `Strings.db (ProjectTableModel|colProjectNumber, colProjectDesc)`] ;
   - lignes : **toutes les affaires, tous statuts, sauf l'affaire courante**, dans l'ordre de `projects()` [C] ; tri par en-tête permis ;
   - affaires au statut 1 **estompées** (opacité 0,49 du texte) [P `FadingCellRenderer`] ;
   - sélection simple ; OK actif si une ligne **visible** (après recherche) est sélectionnée ; double-clic = OK ; Annuler = rien ;
   - boîte de 520 × 340 px (largeur fixe, comme « Frais »), colonne Numéro 90 px [C].
4. Copie (`ch17aPrjOps`, un seul commit) [P `importFromProject@227-508`], pour chaque groupe de la source par `SORTORDER` : nouveau groupe (`SORTORDER`, 4 noms, **`BUDGET: 0`**) ; pour chaque genre par `SORTORDER` : `SORTORDER`, 4 noms, `UNIT`, `UNITPRICE`, **`EXTERNALUNITPRICE` copié**, **`BUDGET: 0`**.
5. Source sans groupe : rien n'est écrit, aucun message [P].
6. La branche « remplacer les groupes existants » (confirmation « Voulez-vous importer tous les frais ⏎ d'une affaire existante? ») est inatteignable dans l'original : **non reproduite** (§ 7 E8).

### 4.10 Suppression d'une affaire (cascade)

[P `v_db.Project` : `projectCostCategoryGroups` `@OneToMany(cascade=ALL)`, `v_db.ProjectCostCategoryGroup` idem vers les genres.] `delProject` refuse déjà une affaire qui a des frais ; il faut y ajouter, dans le même commit, la suppression de tous les groupes de l'affaire et de tous leurs genres : `ch17aDelOps(p, ops)` pousse `{t, id, val:null}` pour chacun. Ancre A2 du § 9.

### 4.11 Avertissement D16 dans la saisie des frais (lot 2, extension DeltaSub)

- **Où** : fenêtre commune `editCost` (« Nouveau » / « Edition » des frais d'affaire, domaine Frais, et des notes de frais), dans la liste « Groupe de frais ».
- **Quand** : une affaire est choisie (`v.PROJECT_ID`) et elle n'a aucun groupe de frais. La liste des groupes étant alors vide, le texte s'affiche **à la place des lignes**, par l'option `empty` de `grid` ; il disparaît dès que l'affaire choisie a des groupes, et se met à jour à chaque changement d'affaire (la fonction `fill` redessine la liste).
- **Texte proposé** (à valider, § 11 n° 1) : « ⚠ Aucun groupe de frais n’est configuré pour cette affaire. », en couleur d'avertissement `#9a5b00` (celle de `ctlAnalyse`), infobulle « Gestion ▸ Configuration ▸ Configurer les frais … ».
- **Non bloquant** : rien d'autre ne change ; l'enregistrement reste refusé par le toast existant « Affaire, groupe de frais et genre de frais sont obligatoires. ».
- **Réalisation** : `ch17bWarn(pid)` renvoie `null` si `pid` est nul, sinon un `span` stylé ; l'ancre A3 (§ 9) affecte `lists.grp.empty` juste avant l'appel `listGrid('grp', …)`.

### 4.12 Messages et libellés exacts

| Clé | Texte (DeltaSub, apostrophe « ’ ») | Source |
|---|---|---|
| `notInit` | Cette fonction n’est disponible que⏎si le statut de l’affaire est «Configuration». | `rsrc` `msgProjectIsNotInitializing0/1` |
| `notEmpty` | Ce groupe ne peut pas être supprimé, car il existe encore des entrées. | `rsrc` `msgGroupNotEmpty` |
| `booked` | Le remplacement n’est pas possible,⏎car des frais ont déjà été comptabilisés. | `ProjectCostCategoriesDialog` `msg1a` + `msg1b` |
| `del` | Voulez-vous vraiment supprimer cette inscription ? | `rsrc` `msgDeleteEntry` |
| titres | Configurer les frais · Nouveau groupe de frais · Modifier le groupe de frais · Nouveau genre de frais · Editer le genre de frais · Frais · Choix de l’affaire · Information · Avertissement | `Strings.db` |
| champs | Deutsch · Français · Italiano · English · Unité · Prix · Budget · Prévision | `Strings.db` |
| colonnes | Groupe de frais · Prévision CHF · Genre de frais · Unité · Prix · Remarque · Numéro · Affaire | `Strings.db` |
| menu | Configurer les frais … · Nouveau … · Importer du dossier standard … · Importer d’une affaire existante … | `Strings.db` + `mapStringWithEllipsis` |
| boutons | Fermer · Annuler · OK · Oui · Non | `rsrc.Strings` |

Les messages sont des constantes `CH17A_MSG` (lot 1).

**Libellés morts à ne pas reproduire** [P `rech_orig` § 11] : `newCostCategoryGroupT`, `editCostCategoryGroupT`, `deleteCostCategoryGroupT`, `newCostCategoryT`, `editCostCategoryT`, `deleteCostCategoryT` (« Rimuovi genere di spese »), `importCostCategoriesFromProjectT`, `msg2a/b`, `msg4` des deux dialogues, `msg3`, `msg5a/b`, `unitExternalPriceCol`, `externalRate`, `internalRate`, `tarifStep`, `validFrom`, `hourBudget`, `budgetUnit`.

---

## 5. Documents imprimés

**Aucun.** [P] `ProjectCostCategoriesDialog` et ses deux dialogues n'ont ni menu Documents ni impression ; aucun des 103 types `.dpdoc` (`Templates$DocumentType`) ne concerne la configuration des frais. Pour mémoire, la prévision (`BUDGET`) est lue par le « Récapitulatif des frais » (`projectProjectCostSummary`, CH-09) et, dans DeltaSub, par la colonne « Prévision » de `ctlAnalyse` (l. 1615), qui n'est pas modifiée.

---

## 6. Valeurs de contrôle

Données : base de test `dstest/deltasub.sqlite` (identique au bureau). Contrôles recalculés pour ce cahier par `work/verif_spec.py`.

### 6.1 Tests jsc (fonctions pures du lot 1)

Le test charge `num`, `cmp` et `ctReorder` copiés à l'identique de `DeltaSub.html` (ou extraits par le build), puis `ch17a.js`, et une fixture `fixture_frais.json` extraite de la base de test (standard, groupes et genres des affaires 701, 3352, 3454, 3651 : identifiants, libellés génériques, unités, prix).

| # | Cas | Attendu |
|---|---|---|
| T1 | `ch17aR` | 2.675 → **2.68** ; 1.115 → **1.12** ; 0.285 → 0.28 ; 1.005 → 1 ; −0.125 → −0.13 ; −0.001 → 0 ; `ch17aN(1234.5 + 0.25)` = « 1'234.75 » ; `ch17aN(0)` = « 0.00 » |
| T2 | `ch17aUnitLbl` | ('CHF','km') → « CHF / km » ; ('CHF','') et ('CHF',null) → « CHF » |
| T3 | `ch17aStdOps`, les 4 groupes standard | 4 groupes `SORTORDER` 1, 2, 3, 4 : Frais de déplacement, Frais de copie, Frais du bureau, Frais admin ; **25 genres** (5, 9, 3, 8), `SORTORDER` 1..n par groupe ; **Σ `UNITPRICE` = 29.15** (au centime) ; prix non nuls : 0.70 km, 0.30 kWh, 0.35 / 1.30 / 0.65 / 2.60 p, 9.30 / 13.95 m2 ; `BUDGET` = `EXTERNALUNITPRICE` = 0 partout ; traductions reprises (groupes 1 et 2, genres standard 2 à 7) ; signature hors identifiants = celle des affaires **2501, 3251, 3351, 3352** |
| T4 | `ch17aStdOps`, groupes 1, 2, 101 ; puis 151 seul | 3 groupes (1, 2, 3), 17 genres, Σ 29.15 ; puis 1 groupe au `SORTORDER` **4** (non renuméroté), 8 genres, Σ 0.00 |
| T5 | `ch17aPrjOps` | source **701** : 3 groupes (1, 2, 3), 17 genres, Σ **28.85**, signature = **3651** (et 3454) ; source 3352 : 4 groupes, 25 genres, Σ 29.15 ; `BUDGET` 0, `EXTERNALUNITPRICE` copié |
| T6 | `ch17aDelCheck` | groupe 1501 (4 genres, 4 frais, statut 2) → `notEmpty` ; groupe 1502 (9 genres, 0 frais) → `notEmpty` ; groupe vide avec 1 frais → `booked` ; groupe vide sans frais, statut 2 → `notInit`, statut 1 → `null` ; genre 2152 (4 frais, statut 2) → `booked` ; genre avec 1 `projectfeecostitem` → `booked` ; genre 2151 (0 frais, statut 2) → `notInit`, statut 1 → `null` |
| T7 | Ordre (`ctReorder`) et `ch17aRenum` | A1 B2 C3, B `next` → A1 C2 B3 ; puis C `first` → C1 A2 B3 ; `ch17aRenum` de [A1, C3] (B supprimé) → 1 op (C → 2) ; de [A1, D1(ID supérieur), B2] → A1 D2 B3 (2 ops) |
| T8 | `SORTORDER` d'un nouvel élément | groupe dans une affaire à 3 groupes → 4 ; genre dans un groupe de 5 → 6 ; nouveau groupe après l'import du seul 151 → **2** (affiché avant « Frais admin », 4) |
| T9 | Syntaxe | `jsc -e "new Function(readFile('script.js'))"` sur le script complet (`DeltaSub.html` du dépôt au moment du build + lot) : aucune erreur ; aucune redéclaration |

### 6.2 Essai navigateur (copie isolée, lot 1 puis lot 2)

| # | Scénario | Attendu |
|---|---|---|
| B1 | Gestion, aucune affaire sélectionnée ▸ Configuration ▸ Configurer les frais … | toast « Sélectionnez une affaire. » |
| B2 | Nouvelle affaire (statut 1 par défaut) ▸ Configurer les frais … | deux tableaux vides ; seul `+▾` des groupes actif ; `+` des genres grisé |
| B3 | `+▾` ▸ Importer du dossier standard … | dialogue « Frais », 4 lignes (déplacement, copie, bureau, admin), Remarque vide, OK grisé ; Cmd-clic sur les 4 → OK → résultat T3 ; premiers ID 1604 / 2268 sur une copie fraîche |
| B4 | `+▾` de la même affaire | « Importer d’une affaire existante … » grisé ; « Importer du dossier standard … » actif et **ajoute** (`SORTORDER` doublés) |
| B5 | Deuxième nouvelle affaire ▸ Importer d’une affaire existante … | « Choix de l’affaire » : l'affaire courante absente, 701 estompée ; recherche « 701 », OK → résultat T5 (= 3651) |
| B6 | Groupe « Frais de déplacement » : Prévision des genres à 1234.5 et 0.25, puis Modifier le groupe ▸ calculatrice | champ « 1234.75 », rien d'enregistré avant OK ; après OK, colonne « 1'234.75 » ; un genre à 2.675 seul → « 2.68 » |
| B7 | Nouveau genre dans « Frais de déplacement » (5 genres) | `SORTORDER` 6 ; Unité « km » → étiquette « CHF / km » ; unité vidée → « CHF » ; OK grisé si Français vide, Prix vide ou Prévision vide |
| B8 | Ordre : groupes A, B, C ; B sélectionné, ↓ ; puis C, ⤒ | A C B, puis C A B ; ⤒ ↑ grisés sur la 1re ligne, ↓ ⤓ sur la dernière |
| B9 | Affaire 3454 (statut 2) : supprimer le groupe 1501 ; le genre 2152 ; le genre 2151 | Information `notEmpty` ; Information `booked` ; Information `notInit` ; rien d'écrit |
| B10 | Nouvelle affaire (statut 1) : supprimer un genre sans frais | Avertissement « Voulez-vous vraiment supprimer cette inscription ? » Non → rien ; Oui → supprimé, genres restants 1..n |
| B11 | Affaire 3701 (statut 2, aucun groupe) : les deux imports | Information `notInit` pour chacun ; rien d'écrit |
| B12 | Non-régression : domaine Frais de l'affaire de B5, `+`, groupe « Frais de déplacement », genre « Kilomètres voiture privé », 32 | prix proposé 0.70, unité km, **Montant 22.40 CHF** (comme le frais 9401 de 3551) ; Désignation remplie (obligatoire par défaut sur une nouvelle affaire) → enregistré |
| B13 | Non-régression : Controlling de 3454 ▸ Critères d'analyse des frais | groupe 1501 : 4 frais, **23.40** (6 × 3.90) ; 1502 et 1503 : 0.00 |
| B14 | Supprimer l'affaire de B2 (sans frais) | `DS.by` sur ses groupes et sur les genres de ces groupes : 0 enregistrement |
| B15 | Conflit : dialogue « Modifier le groupe » ouvert, même groupe modifié par `fetch('/api/commit')` depuis la console, puis OK | toast « Modifié entre-temps … », dialogue ouvert, aucune écriture |
| B16 (lot 2) | Domaine Frais de 3701 ▸ `+` | la liste « Groupe de frais » affiche l'avertissement ; OK → toast « Affaire, groupe de frais et genre de frais sont obligatoires. » ; choisir une affaire qui a des groupes → avertissement remplacé par les groupes |
| B17 (lot 2) | Affaire de B5 (importée) ▸ `+` ; saisie sans affaire (note de frais) | aucun avertissement ; aucun avertissement tant qu'aucune affaire n'est choisie |

### 6.3 Résultats (révision 2)

**Tests des lots** (détail dans `ch/CH-17/lot1_integration.md` et `lot2_integration.md`) :
- `jsc lot1/test_ch17a.js` : 95 contrôles, T1 à T9 plus T10 (DS simulé : cascade, conflit 409 des dialogues d'édition, actions directes) ;
- `jsc lot2/test_ch17b.js` : 41 contrôles, W1 à W5 ;
- essais navigateur des relectures : `lot1rev/` pour B1 à B15, `lot2rev/` pour B16, B17 et la non-régression B12 (22.40 CHF) ;
- la relecture du lot 2 a dû créer l'affaire d'essai par `DS.commit`, car OK de « Nouvelle affaire » échouait alors (§ 8 n° 7).

**Contrôles sur la version intégrée** (HEAD `9c9a3f9`, copie `work/DeltaSub_HEAD.html`, révision 2) :

| Contrôle | Résultat |
|---|---|
| `jsc lot1/test_ch17a.js -- work/DeltaSub_HEAD.html` | **95 réussis, 0 en échec** |
| `jsc lot2/test_ch17b.js -- work/DeltaSub_HEAD.html` (y compris W5 : syntaxe du script complet, déclarations uniques, A3 précédée d'un `;`) | **41 réussis, 0 en échec** |
| `python3 lot1/build.py work/DeltaSub_HEAD.html`, puis `lot2/build.py` | arrêt propre, code 1 : « le préfixe ch17a/CH17A existe déjà dans la source (lot déjà intégré ?) », idem ch17b ; aucun fichier réécrit (md5 inchangés) |
| B2, **par l'interface** (Nouvelle affaire, OK) | affaire d'essai créée au statut 1 (ID 3702) ; « Configurer les frais … » en 4e entrée du menu Configuration ; seuls `+▾` des groupes et « Fermer » actifs ; en-têtes Groupe de frais \| Prévision CHF \| Genre de frais \| Unité \| Prix \| Prévision CHF |
| B3 | « Frais » : 4 lignes, en-têtes Groupe de frais \| Remarque, OK grisé puis actif après sélection multiple ; résultat : groupes **1604 à 1607** (`SORTORDER` 1-4, `BUDGET` 0), genres **2268 à 2292** (5 / 9 / 3 / 8), **Σ prix 29.15**, prix à facturer et prévisions à 0 |
| B4 | « Importer d’une affaire existante … » rendu inerte (`dis`) ; le clic n'ouvre rien |
| B6 | double-clic sur le genre 2268 → « Editer le genre de frais », étiquette « CHF / km » ; Prévision 2.675 → colonne « 2.68 » ; « Modifier le groupe de frais » ▸ calculatrice : champ 0.00 → **2.68**, base inchangée avant OK, 2.68 après OK |
| B9 | affaire 3454 : groupe 1501 → Information `notEmpty` ; genre 2152 → Information `booked` ; genre 2151 → Information `notInit` (textes exacts du § 4.12) |
| B14 | suppression de l'affaire d'essai : l'affaire, ses 4 groupes et ses 25 genres sont supprimés dans la même écriture (`val` nul côté serveur pour les 30 enregistrements) |
| Console | aucune erreur |

L'essai a été fait sur une copie isolée : `specrev/`, port 7873, `ds_user = 2752`, onglet propre. À la fin, le serveur a été arrêté, l'onglet fermé et la taille d'affichage remise par défaut ; la base du bureau n'a pas été touchée.

---

## 7. Écarts assumés

| # | Écart | Raison |
|---|---|---|
| E1 | Titre « Configurer les frais — N° : Affaire » | convention DeltaSub (`cfgActivities`) |
| E2 | Infobulles sur les boutons (« Nouveau », « Editer », « Supprimer », et celles de `ctMoveBtns`) ; l'original n'en a aucune | convention DeltaSub ; les libellés `…T` de l'original sont morts et l'un est en italien |
| E3 | Champs numériques `type=number` : saisie sans séparateur de milliers (« 1234.75 »), les tableaux affichent « 1'234.75 » | convention DeltaSub (`nI`) |
| E4 | OK : Français testé après `trim` (l'original accepte un nom fait d'espaces, puis enregistre une chaîne vide) | éviter un groupe sans nom |
| E5 | Noms et unité vides enregistrés `null` (original : chaîne vide) | convention `readK` ; `nm()` se replie sur les autres langues |
| E6 | Pas de taille minimale exacte (600 × 400) ni de position mémorisée de la fenêtre | les dialogues DeltaSub ne mémorisent pas leur position |
| E7 | Monter / Descendre selon le **rang** (`ctReorder`) et non selon `SORTORDER ± 2` : identique quand l'ordre vaut 1..n (toujours le cas au bureau) ; après un import du standard par-dessus des groupes existants, DeltaSub déplace toujours d'une ligne, l'original peut sauter une ligne ou sembler ne rien faire | comportement prévisible ; cas jamais rencontré au bureau |
| E8 | Branche « remplacer tous les frais » de l'import depuis une affaire non reproduite | inatteignable dans l'original (menu grisé) |
| E9 | Apostrophe typographique « ’ » | convention DeltaSub ; mots identiques à `Strings.db` |
| E10 | Calculatrice : icône SVG en ligne dans le lot (pas d'entrée ajoutée à `ICO`) | éviter de modifier un bloc commun |
| E11 | Pas de contrôle du droit `projectCosts` | la Gestion DeltaSub ne contrôle aucun droit (CH-08) |
| E12 | Contrôles de suppression faits sur le cache local (`DS`) ; le serveur n'impose pas l'intégrité référentielle | architecture DeltaSub ; fenêtre de risque de quelques secondes entre postes |
| E13 | Avertissement D16 dans la saisie (lot 2) | extension demandée (D16) ; absent de l'original |
| E14 | Menu : entrée après « Configurer les phases » (original : après « Attribuer les activités aux collaborateurs ») | l'ordre de DeltaSub diffère déjà ; insertion minimale |
| E15 | Colonnes « Prévision CHF » larges de 110 px (révision 2) | à 100 px, l'en-tête était tronqué (mesure de la relecture du lot 1) |
| E16 | « Frais » à 420 px et « Choix de l’affaire » à 520 px de large, fixes (original « Frais » : taille minimale 400 × 400, `rech_orig` § 9.2) | sans largeur fixe, les dialogues DeltaSub s'étirent à 92 % de l'écran |

---

## 8. Écarts hors chantier signalés (non traités)

1. **`editCost`** : à la sélection d'un genre, DeltaSub recopie le prix du genre dès qu'il n'est pas `null`, donc aussi 0 ; l'original ne le recopie que s'il est **différent de 0** [P `ProjectCostDialog.setProjectCostCategory@0-38`]. Conséquence : choisir un genre à prix 0 efface un prix déjà tapé. Relève de CH-09 ou d'une correction ponctuelle.
2. **`ctlAnalyse`** (Controlling ▸ Critères d'analyse) : les listes de groupes, de genres, de groupes d'activités et d'activités ne sont pas triées par `SORTORDER`. Plus visible une fois l'ordre éditable. CH-09.
3. **`delProject`** oublie aussi `projectactivity`, `projectactivity_staff`, `projectsubphase` et `projectrate` (orphelins). CH-05.
4. **Imports d'activités, de tarifs et de phases** : aucun contrôle du statut « Configuration », que l'original impose. CH-05.
5. **Administrateur ▸ Frais standard** : « Ajouter » crée un genre sans groupe, sans unité ni prix ; édition du seul `NAMEFR` ; tri par nom. CH-06. L'import de CH-17 ignore les genres sans groupe.
6. **`cfgActivities`** numérote à partir de 0 et ne renumérote pas ; la suppression d'un groupe d'activités laisse ses activités. CH-05.
7. **`readK`** (révision 2) : il lisait tous les `[data-k]` du dialogue, y compris les lignes `tr[data-k]` que `grid` pose dans l'onglet « Genres d’affaire ». Résultat : OK de « Nouvelle affaire » et d'« Editer l’affaire » échouait (`TypeError` sur `.value`) dès que `projectkind` n'est pas vide. Le défaut a été constaté par la relecture du lot 2, puis **corrigé** par le commit `b50edc6`, antérieur à l'intégration (lecture limitée à `input`, `select`, `textarea`, ici et dans le dialogue d'adresse). Depuis, B2 passe par l'interface (§ 6.3).

---

## 9. Points d'ancrage DeltaSub

Unicité vérifiée par `grep -F -c` = 1 sur la version du 30.09.2026 10:08. Le `build.py` de chaque lot prend le chemin du `DeltaSub.html` source en argument (défaut : celui du dépôt), vérifie chaque ancre (compte = 1) et **échoue proprement** (message, code de sortie non nul, aucun fichier écrit) si une ancre manque ou est multiple. Chaque « nouveau » contient l'« ancien » intact, pour ne pas gêner les autres chantiers.

| # | Lot | Ancre exacte (« ancien ») | « Nouveau » | Lieu indicatif |
|---|---|---|---|---|
| A0 | 1 et 2 | ligne `   DÉMARRAGE` (1 occurrence) | le bloc de code du lot, inséré **avant** la ligne `/* ═══…` qui ouvre ce commentaire (recherche du dernier `\n/*` avant l'ancre) | l. 14 304-14 305 |
| A1 | 1 | `{t:'Configurer les phases',fn:need(cfgPhases)}` | `{t:'Configurer les phases',fn:need(cfgPhases)},{t:'Configurer les frais …',fn:need(ch17aOpen)}` | l. 1359, `VIEWS['aff-gestion']` |
| A2 | 1 | `/* honoraires et facturation : suppression en cascade` | `ch17aDelOps(p,ops);   /* CH-17 : groupes et genres de frais de l'affaire */` + saut de ligne + deux espaces + l'ancien | l. 1188, `delProject` (la ligne précédente se termine par `;`) |
| A3 | 2 | `listGrid('grp',[{k:'n',t:'Groupe de frais',f:nm}],gs,` | `(lists.grp||(lists.grp={})).empty=ch17bWarn(v.PROJECT_ID); listGrid('grp',[{k:'n',t:'Groupe de frais',f:nm}],gs,` | l. 1419, `editCost.fill` (la ligne précédente se termine par `;`) |

**Après intégration (révision 2, HEAD `9c9a3f9`).**
- Chaque « ancien » reste présent une seule fois, puisque chaque « nouveau » le contient :
  - A1 l. 1 360 ;
  - A2 l. 1 188 ;
  - A3 l. 1 420 ;
  - code du lot 1 l. 14 305-14 487, code du lot 2 l. 14 489-14 500, « DÉMARRAGE » l. 14 503.
- Sur cette source, les deux `build.py` s'arrêtent proprement (« préfixe déjà présent », code 1, rien d'écrit) : un chantier parallèle qui les relancerait ne peut pas intégrer le code deux fois (vérifié, § 6.3).

**Fonctions existantes réutilisées, sans modification** : `h`, `esc`, `num`, `cmp`, `nm`, `toast`, `ibtn`, `popMenu`, `dialog`, `phead`, `grid`, `lang4`, `formRows`, `readK`, `projects`, `projLabel`, `matchQ`, `hfCur`, `ctMsg`, `ivAsk`, `ivOkBtn`, `ctNoSort`, `ctReorder`, `ctMoveRec`, `ctMoveBtns`, `DS.all/get/by/commit/newIds`. Modèle de structure : `cfgActivities` (l. 1226) et `importStdActivities` (l. 1257) ; ne pas reprendre leurs écarts (§ 8, n° 6).

**Aucune modification** de `serveur_deltasub.py`, des outils de reprise ni des autres cahiers.

---

## 10. Plan en lots

**État (révision 2)** : les deux lots sont **livrés, relus et intégrés** (commit `9c9a3f9`, § 6.3). **Aucun lot supplémentaire n'est prévu.** Ce qui n'est pas livré figure dans le tableau ci-dessous : cela relève d'autres chantiers ou attend une décision de Paulo (§ 11). Le préfixe `ch17c` / `CH17C` est réservé à un éventuel correctif qui suivrait ces décisions.

Taille totale : **S** (lot 1 : 183 lignes, lot 2 : 12 lignes, plus 3 remplacements d'une ligne). La fiche prévoyait un seul lot ; l'avertissement D16 est isolé dans un lot 2 parce qu'il s'agit d'une extension, que Paulo peut refuser sans toucher au lot 1, et qu'il modifie une autre fonction existante (`editCost`).

### Lot 1 — « Configurer les frais » : dialogue, groupes, genres, ordre, suppressions, imports, cascade (préfixe `ch17a` / `CH17A`) — LIVRÉ, intégré (`9c9a3f9`)

- **Fichiers** : `ch/CH-17/lot1/ch17a.js` (déclarations de haut niveau seulement, aucun accès au DOM au chargement), `build.py` (ancres A0, A1, A2), `test_ch17a.js` et `fixture_frais.json` (jsc), `DeltaSub.html` construit pour l'essai.
- **Contenu** :
  - `CH17A_MSG` (§ 4.12) ; `ch17aR`, `ch17aN` (§ 3.6) ; `ch17aUnitLbl` ; `ch17aSort` (par `SORTORDER` puis `ID`) ; `ch17aRenum(t,list)` → opérations des lignes dont `SORTORDER` ≠ rang + 1 ;
  - `ch17aOpen(p)` : dialogue, deux panneaux, barres, activation, double-clic, sélection (§ 4.2, § 4.3) ;
  - `ch17aEditGroup`, `ch17aEditCat` (§ 4.4, § 4.5), avec `bseq` lu à l'ouverture et renumérotation à l'édition ;
  - ordre par `ctMoveRec` / `ctMoveBtns` (§ 4.6) ;
  - `ch17aDelCheck` (pure), `ch17aDelGroup`, `ch17aDelCat` (§ 4.7) ;
  - `ch17aStdPick`, `ch17aStdOps` (pure), `ch17aImportStd` (§ 4.8) ;
  - `ch17aPrjPick`, `ch17aPrjOps` (pure), `ch17aImportPrj` (§ 4.9) ;
  - `ch17aDelOps(p,ops)` pour `delProject` (§ 4.10) ;
  - ancres A0, A1, A2.
- **Tests** : T1 à T9 (§ 6.1) ; essai navigateur B1 à B15 (§ 6.2).
- **Dépendances** : aucune.

### Lot 2 — Avertissement D16 dans la saisie des frais (préfixe `ch17b` / `CH17B`) — LIVRÉ, intégré (`9c9a3f9`)

- **Fichiers** : `ch/CH-17/lot2/ch17b.js`, `build.py` (ancres A0, A3), test jsc.
- **Contenu** : `ch17bWarn(pid)` (§ 4.11) et l'ancre A3. Texte et infobulle selon la décision n° 1 du § 11.
- **Tests** : jsc (`ch17bWarn(null)` → `null` ; sinon un nœud dont le texte est celui du § 4.11 ; syntaxe du script complet) ; essai navigateur B16, B17.
- **Dépendances** : lot 1 (l'infobulle renvoie à son entrée de menu et l'essai B17 utilise son import ; le code n'appelle aucune fonction du lot 1).

### Non livré (et pourquoi)

| Élément | Raison |
|---|---|
| Contrôle du droit `projectCosts` | DeltaSub ne gère pas encore les droits dans la Gestion : CH-08 |
| Position et taille mémorisées de la fenêtre | aucun dialogue DeltaSub ne le fait ; sans effet fonctionnel |
| Langue de dialogue autre que le français (test OK sur le nom de la langue de dialogue) | DeltaSub est en français seulement |
| Protection au ré-import des groupes et genres créés dans DeltaSub | changement de politique du serveur ; décision n° 3 du § 11 |
| Corrections du § 8 (prix 0 dans `editCost`, tri du Controlling, cascades et contrôles de statut des autres configurations, Administrateur ▸ Frais standard) | hors chantier : CH-05, CH-06, CH-09 |

---

## 11. Décisions restantes pour Paulo

1. **Texte de l'avertissement D16** (extension, l'original n'en a pas) : « ⚠ Aucun groupe de frais n’est configuré pour cette affaire. », infobulle « Gestion ▸ Configuration ▸ Configurer les frais … ». **Par défaut : ce texte** (en service ; texte et infobulle sont les constantes `CH17B_TXT` et `CH17B_TIP`, à changer à un seul endroit ; pour supprimer l'avertissement, il suffit de retirer l'ancre A3).
2. **Statut « Configuration » exigé pour les imports** (fidèle). Conséquence au bureau : **17 affaires « En cours » n'ont aucun groupe** (dont 3701, 3502, 3501, 3453, 3301, 3201 parmi les plus récentes). Pour leur importer une configuration, il faudra repasser l'affaire au statut « Configuration », importer, puis la remettre « En cours » ; la création manuelle (« Nouveau … ») reste possible à tout statut. Variante possible : autoriser l'import à tout statut quand l'affaire n'a encore aucun groupe. **Par défaut : fidèle** (statut exigé, en service).
   - Révision 2 : le détour est possible sans aucun développement. La fiche affaire (`editProject`, liste « Statut de l’affaire ») propose librement les 5 statuts, retour à « Configuration » compris, et l'enregistrement de la fiche fonctionne depuis `b50edc6`. À noter : une affaire au statut « Configuration » n'apparaît plus aux collaborateurs pendant ce temps (manuel FR p. 24).
   - Si Paulo choisit la variante : correctif `ch17c` limité au premier test de `ch17aImportStd` et de `ch17aImportPrj`, qui deviendrait « statut 1 **ou** aucun groupe ». Il faudrait adapter B11 et T6, rien d'autre.
3. **Reprise Deltaproject** : une reprise `--force` efface les groupes et genres créés dans DeltaSub, comme les frais et les heures qui y sont saisis. Faut-il les protéger dès maintenant, ou traiter la question avec toutes les saisies lors de la bascule définitive ? **Par défaut : pas de changement dans CH-17.**
   - Si Paulo veut les protéger : il faut ajouter les deux collections à `PROTECTED` dans `serveur_deltasub.py` (copie modifiée complète + diff). Il faut aussi que l'import Deltaproject n'ajoute que les enregistrements manquants, comme pour les honoraires. Point à trancher dans ce cas : sans `projectcost`, un frais repris de Deltaproject pourrait pointer vers un genre supprimé dans DeltaSub.

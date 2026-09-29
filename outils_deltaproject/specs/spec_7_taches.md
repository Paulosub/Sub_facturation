# Cahier des charges : les Tâches dans DeltaSub

Ce cahier couvre le module **TÂCHES** (Urgent, En traitement, Réglé) et le domaine **« Tâches »** de l'affaire. Il reproduit le fonctionnement de Deltaproject, version installée dans `/Applications/DELTAproject.app`.

Il a été rédigé le 29.09.2026 par relecture critique de 4 rapports : taskframe, projecttask, manuel et deltasub. Chaque point contesté a été revérifié à la source : bytecode (javap), Strings.db, CSV du bureau, `modeles.json`, `manual_fr.pdf` et `DeltaSub.html` (commit 0eaf4db, 3 548 lignes).

## Légende et références

**Légende** :
- **[P]** = prouvé, la référence suit.
- **[D]** = déduit.
- **[C]** = choix de reproduction proposé pour DeltaSub.

**Abréviations des classes** :

| Abréviation | Classe |
|---|---|
| TF | `deltaproject.task.TaskFrame` (écran du module) |
| TD | `deltaproject.task.ProjectTaskDialog` (dialogue réduit du module) |
| PF | `deltaproject.project.ProjectTaskFrame` (panneau du domaine) |
| PD | `deltaproject.project.ProjectTaskDialog` (dialogue complet, domaine et PV) |
| ND | `deltaproject.project.ProjectTaskNoteDialog` |
| TBD | `deltaproject.admin.TaskBrowserDialog` |
| PT | `db.ProjectTask` |
| PTTM | `db.ProjectTaskTableModel` |
| DPD | `util.swing.DatePickerDialog` |

**Notations** :
- `@n` = offset dans le bytecode.
- SDB = Strings.db, noté `paquet|classe|id`.
- « Manuel pN » = `manual_fr.pdf`, page N.
- Les numéros de ligne de DeltaSub renvoient à `DeltaSub.html`.

**Fichiers de travail** : `research/taches_critique/`, qui contient DPD.txt, Contact.txt, ContactOwner.txt, Project.txt, SBD.txt, Staff.txt, ProjectFrame.txt, TasksFrame.txt, TaskDialog.txt, TaskGroupDialog.txt, TLP.txt et TaskPage.txt. S'y ajoutent les dossiers des 4 rapports : `taches_taskframe/`, `taches_domaine/out/`, `taches_manuel/` et `taches_donnees/`.

---

## §0 Arbitrages : contradictions et affirmations corrigées

| # | Point | Ce que disaient les rapports | Verdict tranché à la source |
|---|---|---|---|
| 1 | Texte du champ « Création » | Rapport taskframe : `Nom,29.09.2026`, sans espace | **`USERNAME` + `", "` + jj.mm.aaaa**, avec une espace. La recette de concaténation `\u0001, ` fait 3 octets (01 2C 20) dans le pool de TD comme dans celui de PD [P] |
| 2 | Boutons du sélecteur de date | Taskframe : « Calendrier / Aujourd'hui / Null / OK / Cancel ». Domaine : « Aujourd'hui / Semaine / Supprimer » | Les deux dialogues utilisent **le même DPD**. Titre « Calendrier » (`util.swing\|DatePickerDialog\|calendar`). Boutons « Aujourd'hui » (`Buttons.setTodayButton`), « **Supprimer** » (le bouton Null reçoit `Strings$Label.cancelItem`, qui vide la date), « Annuler » et « OK ». « Semaine » est l'en-tête de la colonne des numéros de semaine (@146). « Null », « Cancel » et « Today » ne sont que les textes de conception, remplacés à l'exécution [P DPD constructeur @24-60] |
| 3 | « Position mémorisée » des dialogues | Les deux rapports | Seule la **taille** est restaurée (`getRectangleProperty` puis `setBounds`). Ensuite `setLocationRelativeTo(parent)` **recentre** le dialogue [P TD @759-797, PD @881-919]. Le dialogue de note n'est jamais mémorisé [P ND @187] |
| 4 | Création de plusieurs tâches depuis le catalogue : quelle ligne est sélectionnée ? | Deltasub : la dernière. Domaine : la première | **La première** [P PF.jNewProjectTaskButtonActionPerformed @181-190, `if (first == null) first = t`] |
| 5 | Icônes de priorité | Manuel : trois barres. Taskframe et domaine : étoiles | **Étoiles** dans la version installée : ☆ Basse, demi-étoile Normale, ★ Elevée, rien pour Aucune [P `rsrc.Icons$TableIcon` <clinit> @182-220]. Les captures du manuel viennent de versions anciennes (données de 2014 à 2017) |
| 6 | Collaborateurs listés à gauche du module | Deltasub : `staffList()` (actifs) avec `ME.staff` par défaut | **Les collaborateurs liés à l'utilisateur connecté** par `APPUSER_STAFF`, actifs **et** anciens [P TF.setStaffTable @4-11 : `Security.getAppUser().getStaffs()`] |
| 7 | Libellés des états d'affaire | Taskframe : « Créée (1), Suspendue (3) » | 1 **Configuration**, 2 **En cours**, 3 **En attente**, 4 **Terminée**, 5 **Archivée** [P SDB `db\|Project\|created/active/deferred/terminated/archived`, `Project$ProjectState` <clinit>] |
| 8 | Portée des listes du module | Manuel (déduit) : les tâches du collaborateur connecté | Les tâches dont le **Responsable** (STAFF_ID) est le collaborateur **sélectionné à gauche**, parmi ceux liés à l'utilisateur, et **uniquement dans les affaires « En cours »** [P JPQL, §2.4] |
| 9 | Cahier existant spec_3 §2.8 | « Nouveau tant qu'il ne l'a pas ouverte » | Faux : « Nouveau » ne s'efface qu'au clic sur **OK** du dialogue du module [P TD @57-61] |
| 10 | Cahier existant spec_3 §2.8 | « Réglé le renseigné au passage à Réglé » | Vrai **seulement dans le module**. Le dialogue du domaine ne pose jamais DONEDATE [P PD.jOk @56-68] |
| 11 | Cahier existant spec_3 §2.8 | ⚙▾ « Exporter » | Faux : ce sont 2 entrées génériques, « Copier le contenu du tableau dans le presse-papier » et « Exporter le tableau dans un fichier CSV … » [P `util.table.TablePopup`]. Le libellé `exportMenu` (TF et PF) existe dans SDB mais **aucune classe ne l'appelle** [P grep binaire] |
| 12 | Cahier existant spec_3 §2.8 | Colonnes « disponibles » à afficher | Faux : le domaine a **14 colonnes fixes** et le module **13 colonnes fixes**, sans masquage. La notion de colonne masquée n'existe que dans les modèles d'impression [P PTTM <clinit>] |
| 13 | Cahier existant spec_3 §1.3 | Touche Suppr = Supprimer | **Pas pour les tâches** : aucune liaison clavier. `Tables.setTableKeyStrokes` ne gère que TAB et Maj-TAB [P] |
| 14 | Cahier existant spec_3 §2.8 | Icônes « ⊘ = réglé, ≡ = priorité » | Faux. Statut : Brouillon `spinner`, En traitement `pencil`, Annulé `times_circle`, Réglé `check_circle_outlined`. Priorité : étoiles. Nouveau : `circle` ●. Urgent : `bolt` ⚡ [P TableIcon] |
| 15 | Droits de modification | Manuel p39 : responsable et directeur d'affaire | Le **code n'impose rien**. Seuls les droits d'accès aux écrans existent [P, §4.6] |
| 16 | Garde du bouton OK du module | Taskframe : Concerne non vide **et** une priorité choisie | La liste des priorités n'a pas de valeur vide, donc la garde se réduit à « Concerne non vide ». Or Concerne n'est pas modifiable dans TD. Une tâche au Concerne vide ne peut donc **jamais** être validée dans le module [P TD.checkGuards, constructeur @252-256 ; D] |
| 17 | Rapport deltasub : « conditions de `setUntouched` et `setDoneDate` à confirmer » | — | Confirmées au §4.5. Seuls TD, PD et `db.Cleanup.forwardTime` (utilitaire de décalage des dates de démonstration) appellent ces setters [P grep binaire] |
| 18 | Catalogue du bureau | Deltasub : tâches 3 et 5 dans le groupe 2 | Exact. Le groupe 52 « Tâches de bureau » est **vide**. La tâche 3 a NAMEFR « Tâches du collaborateur » mais NAMEGE « Mitarbeitereintritt » (entrée d'un collaborateur) : incohérence dans les données du bureau [P CSV] |
| 19 | Numéros de ligne DeltaSub du rapport deltasub | Calculés sur 3 368 lignes | **Périmés** : le fichier compte 3 548 lignes depuis le commit 0eaf4db. Tous les ancrages sont recalculés au §8 |

---

## §1 Rôle et place

- **But** [P Manuel p39] : dans une affaire, le directeur d'affaire attribue des tâches aux collaborateurs. Chaque collaborateur les retrouve, toutes affaires confondues, dans le module TÂCHES, où il peut les éditer et les commenter. Des tâches peuvent aussi naître d'une séance (PV). Un contact externe peut être associé (« Entité »).
- **Deux écrans et deux dialogues distincts** [P] :

| Écran | Classe | Dialogue ouvert | Ce qu'on y fait |
|---|---|---|---|
| Module **TÂCHES** ▸ Urgent / En traitement / Réglé | TF (écran unique, paramétré par `db.ProjectTask$ListKind` = urgent / pending / done) | **TD**, dialogue réduit | Le responsable traite ses tâches : priorité, délai, urgent, réglé, notes. Pas de création ni de suppression |
| AFFAIRES ▸ Mes affaires / Toutes les affaires ▸ domaine « Tâches » (8e domaine) | PF | **PD**, dialogue complet | Création (via le catalogue), édition complète, suppression, filtre de statut, impressions |

- **Place dans la navigation** [P `Modules$Menu` <clinit>, SDB `deltaproject|Modules`] : TÂCHES se place entre HEURES et FACTURES. Dans DeltaSub, qui n'a pas de FACTURES, la section vient donc entre Heures et Bâtiment. Les 3 entrées s'affichent dans l'ordre Urgent, En traitement, Réglé. Il n'y a ni compteur ni badge [P `MenuTree$ModuleIconNodeRenderer`].
- **Place dans l'affaire** [P spec_3 §1.1, `DOMAINS` l.1457] : le domaine se trouve entre « Notes » et « Frais ».
- **Données du bureau** [P schema.txt] : PROJECTTASK, PROJECTTASKNOTE et MEETINGITEM sont **vides**. Le catalogue compte 4 groupes (TASKGROUP) et 7 tâches (TASK). Rien n'est à reprendre : les deux écrans démarreront vides.

---

## §2 Module TÂCHES (Urgent, En traitement, Réglé)

### 2.1 Ouverture

- **Droits** [P `MenuTree.initModules`] : le menu « TÂCHES » (`deltaproject|Modules|menu_tasks`) n'est visible qu'avec le droit `Rights$Right.tasks` (module 13, droit 0, « Module Tâches: lecture-écriture ») ou pour un superadmin.
- **Entrées** [P `Modules$Module` ordinaux 18-20, SDB] : `module_tasksUrgent` « Urgent », `module_tasksPending` « En traitement », `module_tasksDone` « Réglé ».
- **Chargement** [P `MenuTree.setModuleFrame` @382-406, `TF.setFrame` @0-48] : chaque clic sur une entrée pose `listKind`, **recharge la liste des tâches depuis la base**, puis resélectionne le collaborateur mémorisé. Il n'y a pas de bouton « Actualiser » : pour rafraîchir, on reclique sur l'entrée.
- La liste des collaborateurs n'est chargée qu'une fois par session, car TF est un singleton [P `setStaffTable` n'est appelé que par `initStaffTable`].

### 2.2 Disposition [P TF.initComponents, loadPreferences]

- La fenêtre est coupée **verticalement en deux**. Le séparateur se place à **240 px** par défaut ; sa position est mémorisée (préférence `task / taskList.Preferences`).
- **Gauche** : une bande vide en haut, puis la table **Collaborateurs**.
- **Droite** : la barre d'outils en haut, puis la table des tâches.

### 2.3 Liste des collaborateurs (gauche)

- **Contenu** [P TF.setStaffTable] : `APPUSER_STAFF` de l'utilisateur connecté, sans filtre actif/ancien et sans exception pour l'administrateur.
  - Au bureau, `APPUSER_ID` 2752 est lié à 11 collaborateurs, dont 6 anciens. Les 8 autres utilisateurs liés le sont à un seul collaborateur. 2 utilisateurs sur 11 n'ont aucun lien et verraient donc une liste vide [P APP.APPUSER_STAFF.csv, APP.STAFF.csv].
- **Présentation** : 1 colonne « Collaborateur » (`db|StaffTableModel|employee`), qui affiche `Staff.person.getContactOwnerDesc()`, c'est-à-dire le nom de l'entité personne [P `StaffTableModel(list, true)`].
- **Tri** : par clic sur l'en-tête, mémorisé dans `task / taskStaffListRowSorter`.
- **Sélection** : simple.
  - Elle est mémorisée dans `project / lastStaffSelection` (ID du collaborateur).
  - Cette mémoire est **partagée** avec Notes de frais (saisie et rapport), Heures (saisie, rapport, planification) et les dialogues de controlling [P grep `storeSelectedStaff`].
  - **Sans sélection mémorisée, rien n'est sélectionné et la liste des tâches reste vide** [P TF.setProjectTaskTable @1-35].
- Changer de collaborateur recharge les tâches puis mémorise le choix [P `TaskFrame$StaffSelectionListener`].

### 2.4 Filtres exacts des 3 entrées [P TF.setProjectTaskTable → `Staff.getProjectTasks(kind)` → `PT.getProjectTasks` ; JPQL du pool de `db.ProjectTask`]

| Entrée | Requête nommée | JPQL exacte (S = collaborateur sélectionné) |
|---|---|---|
| **Urgent** | `ProjectTask.findByStaffAndUrgent`, état = `pending` (1), affaire = `active` (2) | `SELECT t FROM Staff s INNER JOIN s.projectTasks t WHERE s.id = :staffId AND t.isUrgent <> 0 AND t.projectTaskStateCode = :projectTaskStateCode AND t.project.projectStateCode = :projectStateCode ORDER BY t.startDate` |
| **En traitement** | `ProjectTask.findByStaffAndTaskState`, état 1, affaire 2 | `… WHERE s.id = :staffId AND t.projectTaskStateCode = :projectTaskStateCode AND t.project.projectStateCode = :projectStateCode ORDER BY t.startDate` |
| **Réglé** | `ProjectTask.findByStaffAndTaskState`, état 3 (`done`), affaire 2 | idem |

Conséquences, toutes prouvées :

- `s.projectTasks` est mappé par `mappedBy="staff"`. Le critère porte donc sur `PROJECTTASK.STAFF_ID`, le **Responsable** [P `v_db.Staff`]. Il ne porte ni sur « Créé par », ni sur le directeur d'affaire, ni sur l'équipe de l'affaire.
- **Seules les affaires « En cours » (code 2) comptent**, dans les 3 entrées, y compris « Réglé ». Au bureau, 46 affaires sur 111 sont en cours [P APP.PROJECT.csv].
- **Urgent** = case ISURGENT **et** statut En traitement. Aucun critère de délai n'intervient : un délai dépassé ne rend pas une tâche urgente.
- Une tâche urgente apparaît **à la fois** dans Urgent et dans En traitement.
- **Brouillon (0) et Annulé (2) n'apparaissent dans aucune entrée**, ce que confirme le manuel p39 pour le brouillon.
- **Tri initial** : STARTDATE croissant (plus anciennes d'abord).

### 2.5 Table des tâches : 13 colonnes fixes [P PTTM `columnNamesProject`, getValueAt, getColumnClass]

| # | En-tête | Valeur | Rendu / tri |
|---|---|---|---|
| 0 | `●` (littéral) | ISUNTOUCHED ≠ 0, glyphe `circle` | icône gris foncé, centrée, 20 px |
| 1 | `!` (littéral) | ISURGENT ≠ 0, glyphe `bolt` ⚡ | icône, 20 px |
| 2 | Date | STARTDATE | jj.mm.aaaa, 80 px |
| 3 | Affaire | `Project.toString()` = `NUMBER + " " + TITLE` (repli `db.Project[id=…]`) | texte |
| 4 | Concerne | SUBJECT | texte |
| 5 | Description | DESCRIPTION tronquée : au-delà de 30 caractères, les 29 premiers + « … » (`Formatter.toCroppedString`) | texte |
| 6 | *(vide)* | icône de priorité : rien / ☆ / demi-étoile / ★ | 20 px |
| 7 | Priorité | Aucune / Basse / Normale / Elevée | tri par code |
| 8 | Entité | `Contact.getContactDesc()` = `nom(CONTACTRELATION) + ", " + nom(CONTACTOWNER)`, en omettant la partie vide | texte |
| 9 | Délai | DEADLINE | date, 80 px |
| 10 | Réglé le | DONEDATE | date, 80 px |
| 11 | Créé par | USERNAME | texte |
| 12 | Ouvrage | `SubProject.toString()` = `CODE + " " + DESCRIPTION + " \| " + LOCATIONDESCRIPTION`, en omettant les parties vides | texte |

- Il n'y a **ni colonne Statut ni colonne Responsable** : le statut est fixé par l'entrée choisie, le responsable par la liste de gauche [D].
- Les libellés `colIsUntouched` « Nouveau » et `colIsUrgent` « Urgent » **ne sont pas utilisés** : les en-têtes sont les littéraux ● et ! [P PTTM <clinit> @15-20].
- Comportement de la table [P `Tables.initTable`] : cellules non éditables, **sélection simple**, colonnes non déplaçables, pas de menu contextuel.

### 2.6 Barre d'outils, souris, recherche [P TF.initComponents, checkGuards, getReportsPopupMenu, jWheelButtonActionPerformed]

Les boutons, de gauche à droite, n'ont **aucune infobulle** :

1. **✎** (`editItem`) : actif si une ligne est sélectionnée. Ouvre TD (§4.2).
2. **📄▾** (`reportsDropDown`) : actif si la table a au moins une ligne. Menu d'**une seule entrée**, « **Tâche d'affaire …** » (`deltaproject.task|TaskFrame|taskReport` + points de suspension), active si une ligne est sélectionnée (§6.1).
3. **⚙▾** (`wheelDropDown`) : « Copier le contenu du tableau dans le presse-papier » et « Exporter le tableau dans un fichier CSV … », actifs si la table a des lignes (§6.4).
4. Un espace, puis le **champ de recherche**.

**Absents du module** [P] : **+**, **−**, filtre ▼ et bouton pour ouvrir l'affaire. `newProjectTask` et `deleteProjectTask` de TD existent mais ne sont jamais appelés.

**Souris** [P `util.table.RowMouseListener`] : un double-clic sur une ligne équivaut à ✎, un clic dans le vide désélectionne.

**Recherche** [P `Tables.filterTable`] : `RowFilter.regexFilter("(?i)" + texte)` à chaque touche relâchée, sur toutes les colonnes.
- La comparaison porte sur le `toString()` de la valeur du modèle, sans convertisseur de texte. Les dates ressortent donc sous la forme `aaaa-mm-jj` et la description tronquée à 30 caractères [D].
- Une expression régulière invalide est ignorée. Le bouton ⓧ vide le champ et relance le filtre.
- Après un rechargement (changement d'entrée, Urgent ou Réglé modifié), le texte reste dans le champ mais le filtre n'est pas réappliqué, car la table reçoit un nouveau modèle [D].

**Tri** : un clic sur un en-tête trie la colonne ; la clé est mémorisée dans `task / taskListRowSorter` [P].

### 2.7 Rechargement après édition [P TF.editProjectTask @46-84]

- Si **Urgent ou Réglé a changé**, toute la liste est rechargée, et la ligne peut disparaître. La sélection est alors perdue [D].
- Sinon, la ligne est mise à jour sur place (`fireTableRowsUpdated`) : le ● disparaît, la ligne reste.
- Les deux voies donnent le même contenu, car le filtre ne dépend que de l'urgence, du statut et de l'état de l'affaire [D].

### 2.8 Mise en forme [P `util.table.CellRenderer`, `Icons$TableIcon`]

- Aucune couleur selon le statut, la priorité, l'urgence ou un délai dépassé. Il n'y a aucune comparaison de dates dans PTTM ni dans CellRenderer.
- Lignes alternées, texte noir, icônes FontAwesome **gris foncé** centrées, dates `dd.MM.yyyy`.

---

## §3 Domaine « Tâches » de l'affaire (PF)

### 3.1 Accès [P ProjectFrame @142-155]

- Le domaine n'apparaît qu'avec le droit `Rights$Right.projectTasks` (module 4, droit 16, « Domaine Affaires: tâches par affaire: lecture-écriture »).
- Il n'existe pas de variante en lecture seule.
- Aucune restriction selon l'état de l'affaire : `checkGuards` ne teste que la présence d'une affaire.

### 3.2 Barre d'outils [P PF.initComponents, checkGuards @1-112]

Ordre : `+` · `✎` · `−` · `📄▾` · `⚙▾` · `▼▾` · libellé du filtre · espace · recherche. Aucune infobulle.

| Bouton | Actif si |
|---|---|
| + (`newItem`) | une affaire est ouverte |
| ✎ (`editItem`) | affaire **et exactement 1** ligne sélectionnée |
| − (`deleteItem`) | affaire **et exactement 1** ligne sélectionnée |
| 📄▾ | affaire **et** au moins une ligne dans la table |
| ⚙▾ | toujours ; ses entrées exigent des lignes |
| ▼▾ | une affaire est ouverte |

- Le libellé du filtre est en Lucida Grande 11, gris (51,51,51), vide au départ.
- La table accepte la **sélection multiple** (`setSelectionMode(2)`), utile pour la liste imprimée.
- Un double-clic équivaut à ✎. Aucune touche Suppr.

### 3.3 Colonnes : 14 colonnes fixes [P PTTM `columnNamesStaff`, mode `false`]

| # | En-tête | Valeur | Largeur |
|---|---|---|---|
| 0 | Date | STARTDATE | 80 |
| 1 | Créé par | USERNAME | — |
| 2 | Concerne | SUBJECT | — |
| 3 | Description | tronquée : 29 caractères + « … » au-delà de 30 | — |
| 4 | *(vide)* | icône du statut : spinner / crayon / cercle barré / cercle coché | 20 |
| 5 | Statut | Brouillon / En traitement / Annulé / Réglé, tri par code | — |
| 6 | *(vide)* | icône de priorité | 20 |
| 7 | Priorité | libellé, tri par code | — |
| 8 | Responsable | `staff.person.getContactOwnerDesc()` | — |
| 9 | Entité | `contact.getContactDesc()` | — |
| 10 | `!` | ⚡ si ISURGENT | 20 |
| 11 | Délai | DEADLINE | 80 |
| 12 | Réglé le | DONEDATE | 80 |
| 13 | Ouvrage | `SubProject.toString()` | — |

Il n'y a **ni colonne ● (Nouveau) ni colonne Affaire** dans le domaine [P].

### 3.4 Filtre de statut ▼▾ [P PF.addFilterPopupMenuItems, `$12`, `$13`, setProjectTaskTable, setFrame]

- Le menu propose des cases à cocher à choix unique : « **Afficher tout** » (`rsrc|Strings|noFilter`, coché si aucun filtre), puis « Brouillon », « En traitement », « Annulé », « Réglé ».
- Choisir un statut :
  - recharge la liste par `findByProjectAndTaskState` (`SELECT t FROM ProjectTask t WHERE t.project = :project AND t.projectTaskStateCode = :projectTaskStateCode ORDER BY t.startDate`) ;
  - affiche le **nom du statut** à droite du bouton.
- « Afficher tout » vide ce libellé et recharge par `findByProject`.
- **Le filtre est conservé d'une affaire à l'autre** pendant toute la session (PF est un singleton et `setFrame` ne le remet pas à zéro). Il n'est pas enregistré dans les préférences.

### 3.5 Recherche et tri

- Même mécanisme que dans le module (§2.6).
- Tri initial : STARTDATE croissant.
- Clé de tri mémorisée dans `project / projectTaskListRowSorter`. Seule la première clé est relue (`app.Preferences.sortTable`) [P].
- **Astuce du manuel p39** : taper le nom d'un contact dans la recherche et choisir le filtre « En traitement » pour obtenir les tâches ouvertes de cette entité. La portée reste **l'affaire ouverte**, puisque le domaine ne charge que ses tâches [P PF.setProjectTaskTable].

### 3.6 Bouton « + » : il passe toujours par le catalogue [P PF.jNewProjectTaskButtonActionPerformed @1-227, TBD]

Le bouton ouvre **TBD « Sélection des tâches »** (`deltaproject.admin|TaskBrowserDialog|dialogTitle`), avec deux tables côte à côte :
- à gauche, « **Groupe** » : TASKGROUP triés par SORTORDER ;
- à droite, « **Désignation** » : TASK du groupe sélectionné, triées par SORTORDER, **sélection multiple**.

**Aucun groupe n'est présélectionné**, donc la liste de droite est vide au départ.

Boutons : « **Nouveau** » (`…|TaskBrowserDialog|new`), « Annuler », « OK ». OK n'est actif qu'avec au moins une tâche sélectionnée ; un double-clic sur une tâche équivaut à OK. La taille est mémorisée dans `project / AdminTaskBrowserDialogBounds`.

| Choix dans TBD | Résultat |
|---|---|
| Annuler (renvoie `null`) | rien |
| « Nouveau » (liste vide) | `new ProjectTask()` + l'affaire, puis PD « **Nouveau** ». Le statut est **vide** (−1), donc OK reste grisé tant qu'on n'a pas choisi de statut |
| 1 tâche + OK | `copyFrom(task)` : **Brouillon**, SUBJECT = nom de la tâche **dans la langue de l'interface** (NAMEFR en français, **sans repli**), DESCRIPTION = DESCRIPTION du catalogue. Puis PD « Nouveau » |
| ≥ 2 tâches + OK | **création directe sans dialogue** : une tâche par élément, en Brouillon (copie), persistées dans **une seule transaction**. **La première** est sélectionnée |

- Le nom de la tâche est choisi par `db.admin.Task.getName()` [P tableswitch + `Task$1`] : ch_FR → NAMEFR, ch_IT → NAMEIT, en → NAMEEN, sinon NAMEGE.
- Au bureau, les tâches 51, 52 et 53 ont un NAMEFR vide. Elles s'affichent comme des lignes vides et donnent un Concerne **vide** [P CSV + D].

### 3.7 Mise à jour de la table après une action [P PTTM.add/edit, PD.newProjectTask, PF]

- **Création** : la ligne est **ajoutée** et sélectionnée, **même si elle ne correspond pas au filtre de statut**.
- **Édition** : la ligne est redessinée sur place et **reste affichée même si son nouveau statut sort du filtre**.
- **Suppression** : la ligne est retirée.
- Dans les deux premiers cas, la liste n'est reconstruite qu'au prochain changement d'affaire ou de filtre.

---

## §4 Dialogues de tâche et de note

### 4.1 Dialogue complet du domaine (PD) : « Nouveau » / « Edition »

**Cadre** [P PD constructeur] :
- Titre « Nouveau » (`newProjectTaskTitle`) ou « Edition » (`editProjectTaskTitle`).
- Modal, taille minimale **600 × 585**, taille mémorisée dans `project / ProjectTaskDialogBounds`, centré.
- Boutons « Annuler » et « OK » ; OK est le bouton par défaut, Échap équivaut à Annuler.
- En édition, la tâche est **relue en base** (`em.refresh`) avant l'ouverture, puis enregistrée par `merge` et commit. En création : `persist`.

**Champs, dans l'ordre vertical** [P GroupLayout, SDB `deltaproject.project|ProjectTaskDialog`] :

| Libellé | Composant | Détail |
|---|---|---|
| Concerne | texte | 255 caractères au plus (`LengthGuard`) |
| Description | zone multiligne, 20 colonnes, retour à la ligne par mot | 4096 au plus |
| Création | texte **en lecture seule** | `USERNAME + ", " + jj.mm.aaaa(STARTDATE)` |
| Statut | liste : **valeur vide** + Brouillon, En traitement, Annulé, Réglé | sélection = statut actuel (−1 donne vide) |
| Priorité | liste : Aucune, Basse, Normale, Elevée (sans valeur vide) | — |
| Responsable | texte en lecture seule + bouton `>` (icône `suggestion`) + ⓘ | voir ci-dessous |
| Entité | texte en lecture seule + `>` + ⓘ | voir ci-dessous |
| Délai | texte **en lecture seule** + 📅 (DPD, §4.4), puis la case « **Urgent** » sur la même ligne | — |
| Ouvrage | liste : **valeur vide** + `Project.getSubProjects()` | libellé `SubProject.toString()` |
| Notes | tableau + boutons ＋ ✎ − | §4.3 |

- **Libellés inutilisés** dans PD [P constantes] : `project` « Affaire », `isDone` « Réglé », `deleteStaff` et `deleteContact` « Supprimer ». Le « Supprimer » affiché vient de `rsrc|Strings|cancelItem`.

**Choix du Responsable** [P PD.suggestStaff, browseStaff, `Staff.findActiveByProject`, `StaffBrowserDialog.initStaffTable`] :
- Le bouton `>` ouvre un menu :
  - « **Choisir …** » (`rsrc|Strings|browseItem` + points de suspension) ;
  - « **Supprimer** », actif si un responsable est renseigné ; il vide le champ.
- « Choisir … » ouvre « **Choix du collaborateur** » (`StaffBrowserDialog|staffBrowserTitle`), en sélection simple, qui liste :
  - `SELECT s FROM Staff s WHERE s.isActive <> 0 AND EXISTS (SELECT m FROM Project p INNER JOIN p.projectMembers m WHERE p.id = :projectId AND (m.contact = s.person OR m.responsibleContact = s.person))`,
  - c'est-à-dire les **collaborateurs actifs qui sont intervenants de l'affaire, quel que soit leur rôle** : la personne est l'Entité (CONTACT_ID) ou le Responsable (RESPCONTACT_ID) d'une ligne PROJECTMEMBER.
  - Le responsable actuel est **retiré** de la liste, qui est **triée** par `Staff.compareTo` : nom de la personne, sinon initiales, sinon SORTORDER.
- ⓘ ouvre la fiche adresse de la personne ; il est grisé s'il n'y a pas de responsable.

**Choix de l'Entité** [P PD.browseContact, suggestContact] :
- Le menu `>` est le même (« Choisir … » / « Supprimer »).
- « Choisir … » ouvre `ContactBrowserDialog(fenêtre, affaire)`, le navigateur d'adresses **complet** en sélection simple. Ses modes sont Recherche, Groupes, Propriétés, **Intervenants** (de l'affaire), Soumissionnaires et CFC ; le dernier mode utilisé est mémorisé.
- La valeur est une **adresse CONTACT** (CONTACT_ID), affichée par `getContactDesc()`. ⓘ ouvre la fiche adresse et est grisé si le champ est vide.

**Validation** [P PD.checkGuards] :
- OK n'est actif que si **Concerne n'est pas vide, un Statut est choisi et une Priorité est choisie**. Aucun message : le bouton reste simplement grisé.
- Le test de Concerne porte sur le texte **avant** trim : « ␣␣ » passe, puis est enregistré comme chaîne vide.

**Enregistrement au clic sur OK** [P PD.jOkButtonActionPerformed @1-184] :
- SUBJECT et DESCRIPTION trimés, statut, priorité, STAFF_ID, CONTACT_ID, DEADLINE (`parseDate`, `null` si vide), ISURGENT, SUBPROJECT_ID.
- **Si le statut ≠ Réglé : DONEDATE = null. Si le statut = Réglé : DONEDATE est laissé tel quel** ; il n'est jamais renseigné ici.
- **ISUNTOUCHED n'est jamais modifié** : une tâche éditée dans l'affaire reste « Nouveau ».
- Les notes modifiées sont enregistrées avec la tâche (§4.3).

**Autres appelants de PD** [P] : `MeetingItemDialog` (bouton « éditer la tâche » d'un point de PV) et `ProjectTaskBrowserDialog` (bouton « Nouveau »).

### 4.2 Dialogue réduit du module (TD) : « Edition »

**Cadre** [P TD constructeur, editProjectTask] :
- Titre « Edition ».
- Modal, taille minimale **600 × 550**, taille mémorisée dans `task / ProjectTaskDialogBounds`, centré.
- La tâche est relue en base (`refresh`) avant l'ouverture, puis enregistrée par `merge` et commit.
- OK est le bouton par défaut, Échap équivaut à Annuler.

**Champs, dans l'ordre vertical** [P, SDB `deltaproject.task|ProjectTaskDialog`] :

| Libellé | Composant | Modifiable |
|---|---|---|
| Concerne | texte | **non** |
| Description | zone multiligne | **non** |
| Création | `USERNAME + ", " + jj.mm.aaaa` | non |
| Priorité | liste Aucune / Basse / Normale / Elevée | **oui** |
| Délai | texte non modifiable au clavier + 📅 (DPD) | oui, par 📅 (« Supprimer » vide la date) |
| Urgent | case à cocher (ligne propre, libellé `isUrgent`) | **oui** |
| Affaire | texte `NUMBER TITLE` | non |
| Ouvrage | texte `SubProject.toString()` | non |
| Notes | tableau + ＋ ✎ − | **oui** |
| Réglé | case à cocher dont le **texte affiche la date de règlement**, avec un bouton 📅 à côté | **oui** |

- **Il n'y a ni Statut, ni Responsable, ni Entité** : le responsable ne peut ni réattribuer la tâche, ni l'annuler, ni la remettre en brouillon.
- **Case Réglé** [P TD constructeur @655-728, jIsDoneCheckBoxActionPerformed, jDoneDateButtonActionPerformed, checkGuards @80-111] :
  - À l'ouverture, elle est cochée si le statut vaut 3. Son texte est la DONEDATE (vide si elle est nulle).
  - Cocher écrit **la date du jour** dans le texte ; décocher vide le texte.
  - Le bouton 📅 n'est visible que si la case est **cochée et datée**. Il ouvre DPD sur la date de règlement ; si cette date est effacée par « Supprimer », le texte se vide et le 📅 disparaît.
- **Garde du bouton OK** [P TD.checkGuards] : Concerne non vide **et** une priorité choisie. En pratique, cela revient à « Concerne non vide » (§0 #16).
- **Au clic sur OK** [P TD.jOkButtonActionPerformed @1-126] :
  1. PROJECTTASKPRIORITYCODE ← la liste.
  2. DEADLINE ← `parseDate(texte)`, `null` si vide.
  3. ISURGENT ← la case.
  4. **ISUNTOUCHED ← 0**, sans condition.
  5. Réglé coché : **PROJECTTASKSTATECODE = 3** et **DONEDATE = date affichée** (`null` si vide). Réglé décoché : **PROJECTTASKSTATECODE = 1** et **DONEDATE = null**.
- Annuler n'écrit rien ; « Nouveau » reste donc allumé.

### 4.3 Notes (`PROJECTTASKNOTE`) : tableau et dialogue ND, communs à PD et TD

**Tableau** [P `db.ProjectTaskNoteTableModel`, checkGuards de PD et TD] :
- Colonnes « Date » (CHANGEDDATE), « Auteur » (OWNER), « Sujet » (SUBJECT), « Texte » (CONTENT) (`noteCol1..4`).
- Ordre de la liste, triable, non éditable. Aucun `@OrderBy` : c'est l'ordre de chargement ou d'ajout.
- ＋ est toujours actif ; ✎ et − s'activent dès qu'une note est sélectionnée ; un double-clic équivaut à ✎.

**Dialogue ND** [P ND] :
- Titre « Nouvelle note » (`newNote`) ou « Modifier la note » (`editNote`). Centré, taille non mémorisée.
- Champs : « **Concerne** » (64 caractères au plus) et une zone de texte **sans libellé** (1024 au plus, `JTextPane`).
- **OK est grisé si Concerne est vide.**
- **Au clic sur OK**, qu'il s'agisse d'une création **ou d'une modification** : SUBJECT et CONTENT trimés, **CHANGEDDATE = maintenant**, **OWNER = `AppUser.USERID`** de l'utilisateur courant (l'identifiant de connexion, pas le nom). Modifier la note de quelqu'un d'autre en change donc l'auteur et la date.
- **Suppression** : confirmation Oui/Non « Voulez-vous vraiment supprimer cette inscription ? » (`rsrc|Strings|msgDeleteEntry`), titre « Avertissement » (`rsrc|Strings|warning`).

**Enregistrement** [P mapping `@OneToMany(cascade=ALL, orphanRemoval=true, mappedBy="projectTask")` ; D] :
- Les notes sont modifiées **en mémoire** et ne sont écrites qu'au **OK de la tâche**. Annuler abandonne ces modifications.

### 4.4 Sélecteur de date (DPD), commun au Délai et au Réglé [P DPD]

- Titre « **Calendrier** ».
- Navigation par mois et par année (◀ ▶).
- Colonne des numéros de semaine, d'en-tête « Semaine ».
- Boutons « **Aujourd'hui** », « **Supprimer** » (vide la date), « Annuler », « OK ».
- OK est le bouton par défaut, Échap équivaut à Annuler.

### 4.5 Règles transverses [P PT constructeur @0-57, copyFrom, TD, PD]

| Événement | Statut (PROJECTTASKSTATECODE) | DONEDATE | ISUNTOUCHED | Autres |
|---|---|---|---|---|
| Création d'objet (`new ProjectTask()`) | **−1** (affiché vide) | null | **1** | USERNAME = `Security.getUserName()` = **APPUSER.NAME** ; STARTDATE = maintenant ; DEADLINE null ; ISURGENT 0 ; priorité 0 Aucune ; STAFF, CONTACT, SUBPROJECT vides |
| Reprise du catalogue (`copyFrom`) | **0 Brouillon** | inchangé | inchangé (1) | SUBJECT = nom dans la langue de l'interface, DESCRIPTION = DESCRIPTION du catalogue |
| OK dans PD (domaine, PV) | valeur choisie (0-3) | ≠ 3 : **null** ; = 3 : **inchangé** | **inchangé** | tous les champs du dialogue |
| OK dans TD (module), Réglé coché | **3** | date affichée, aujourd'hui par défaut (null possible) | **0** | priorité, délai, urgent |
| OK dans TD, Réglé décoché | **1** | **null** | **0** | idem |
| Annuler (PD, TD, ND) | inchangé | inchangé | inchangé | rien n'est écrit |

- **Visibilité** : une tâche n'est visible dans le module que si son statut vaut 1 ou 3, qu'elle a un responsable et que son affaire est en cours. Brouillon et Annulé restent limités au domaine.
- **« Nouveau »** (● du module) marque les tâches que le responsable n'a pas encore validées dans le module. Il n'existe **aucun compteur** et aucune notification. Le manuel ne mentionne aucune notification [P manuel ; recherche plein texte].

### 4.6 Droits

- **Deltaproject** [P `db.user.Security.hasRight`, absence de tout appel Security/Rights dans TF, TD, PF, PD et ND, hormis la lecture de l'utilisateur] :
  - `tasks` (13,0) montre le module ; `projectTasks` (4,16) montre le domaine ; le superadmin passe partout.
  - **Aucune règle ne restreint l'édition selon l'auteur, le responsable ou le statut.** Quiconque voit le domaine peut tout créer, modifier et supprimer. Quiconque voit le module peut éditer, de façon réduite, les tâches des collaborateurs qui lui sont liés.
- **Données du bureau** [P CSV] :
  - APPROLE 301 « Standard » contient `4,16` et `13,0` ; APPROLE 252 « Tâches » ne contient que `4,16` ; APPROLE 1 « Administrateur » est superadmin.
  - Les 10 utilisateurs liés à un rôle d'entreprise ont tous le rôle 201 « Standard », qui renvoie à APPROLE 301 : **tout le monde a les deux droits**.
- **DeltaSub** : il n'y a aucun contrôle de droits (l'utilisateur choisit son nom sans mot de passe, l.410). Au bureau, le comportement est identique puisque tous ont les deux droits [C].

### 4.7 Cas limites

| Cas | Comportement |
|---|---|
| Tâche **sans affaire** | Impossible par l'interface : le domaine et le PV posent toujours PROJECT_ID. Une telle tâche serait exclue du module par la jointure `t.project.projectStateCode` [P JPQL ; D]. TD tolère une affaire nulle (champ vide) [P TD @579-596] |
| Tâche **sans responsable** | Visible seulement dans le domaine (colonne vide), jamais dans le module [P] |
| Responsable **inactif** | La tâche reste attribuée. Elle reste visible dans le module si ce collaborateur est lié à l'utilisateur, car APPUSER_STAFF n'est pas filtré. Elle n'est plus **proposée** dans « Choix du collaborateur » (`isActive <> 0`) [P] |
| Responsable **retiré des intervenants** | La tâche reste attribuée, mais le collaborateur n'est plus proposé au choix. `isProjectMemberDeletable` ne regarde pas les tâches [P Integrity] |
| Affaire **non en cours** (Configuration, En attente, Terminée, Archivée) | Tâches absentes des 3 entrées du module, y compris « Réglé ». Elles restent éditables dans le domaine pour les affaires listées dans « Toutes les affaires » (en cours, en attente, terminées ; manuel p34). Les affaires archivées ne sont pas listées [P ; D] |
| Utilisateur **sans collaborateur lié** | Liste de gauche vide, donc module vide [P] |
| Tâche **urgente** | Figure dans Urgent **et** dans En traitement [P] |
| **Délai dépassé** | Aucun effet : ni couleur, ni tri, ni filtre, ni passage en Urgent [P] |
| **Concerne vide** (tâches 51-53 du catalogue, création multiple) | Tâche créée au Concerne vide. Dans PD, il faut saisir un Concerne pour valider. Dans TD, OK reste **définitivement grisé** [P + D] |
| Statut **Réglé posé dans le domaine** | DONEDATE reste null (ou garde sa valeur) : « Réglé le » est vide. Dans TD, la case est cochée sans date et OK conserve DONEDATE null [P] |
| Réglé **décoché dans l'entrée « Réglé »** | Statut 1, DONEDATE null. La tâche sort de « Réglé » et rejoint « En traitement » [P] |
| Note **sans texte** | Enregistrée, mais omise par l'ancien document « Tâche » (§6.3) [P `Tasksreport` @191-197] |
| Deux postes éditent la même tâche | Deltaproject relit l'enregistrement avant d'ouvrir, puis la dernière écriture l'emporte [P refresh/merge]. DeltaSub : conflit 409 de `DS.commit` [C] |

---

## §5 Suppression et lien avec les procès-verbaux

### 5.1 Supprimer une tâche : seulement dans le domaine, bouton − avec exactement 1 ligne [P PD.deleteProjectTask, identique dans TD mais jamais appelé ; `db.Integrity.isProjectTaskDeletable`]

1. **Contrôle** : `SELECT COUNT(m) FROM MeetingItem m WHERE m.projectTask = :projectTask`.
2. **Si le compte est > 0** : message WARNING, bouton OK seul, titre « **Avertissement** », texte `msg2a + "\n" + msg2b` :
   « Cette tâche ne peut pas être effacée, car elle
   est utilisée dans un procès-verbaux. »
   Le texte est à reproduire tel quel, faute comprise [P SDB].
3. **Sinon** : confirmation Oui/Non « **Voulez-vous vraiment supprimer cette inscription ?** », titre « Avertissement ». Oui entraîne `remove`, et les **notes sont supprimées en cascade**.

### 5.2 Intégrité inverse [P `db.Integrity`]

Une tâche qui y fait référence bloque la suppression :
- d'une **adresse** (`isContactDeletable` : l'usage « **Entité dans des tâches** » s'ajoute à la liste, `db|Integrity|ProjectTask`) ;
- d'un **collaborateur** (`isStaffDeletable`) ;
- d'une **affaire** (`isProjectDeletable`) ;
- d'un **ouvrage** (`isSubProjectDeletable`).

Pour cela, `PT.getProjectTaskCount(contact | staff | project | subProject)` s'appuie sur les requêtes `countByContact`, `countByStaff`, `countByProject` et `countBySubProject`.

### 5.3 Lien avec le PV [P rapport domaine §6 ; SDB `db|MeetingItem` ; manuel p37]

- `MEETINGITEM.PROJECTTASK_ID` relie un point de PV, de catégorie **3 « Tâche »**, à une tâche. Les catégories sont : 0 Aucun, 1 Information, 2 Décision, 3 Tâche, 4 Point ouvert.
- Dans `MeetingItemDialog`, trois actions sont possibles :
  - **Parcourir** : `ProjectTaskBrowserDialog` « Sélection des tâches », qui liste les tâches de l'affaire avec les 14 colonnes du domaine. Son bouton « Nouveau » ouvre TBD en sélection **simple**, applique `copyFrom`, puis ouvre PD « Nouveau » ;
  - **Éditer** : ouvre PD ;
  - **Retirer** : délie la tâche.
- `ProtocolDialog` imprime l'état réglé et l'entité de la tâche liée.
- Un « Point ouvert » n'est **pas** une tâche PROJECTTASK (manuel p37 ; version allemande p52).
- **DeltaSub** : il n'y a ni séances ni PV, et la collection `meetingitem` n'existe pas (domaine « Séances » renvoyé vers le module PV externe, l.1543-1545). Le contrôle du §5.1 renverra toujours 0, mais il faut l'écrire pour être prêt [C].

---

## §6 Impression et export

### 6.1 Menus de Deltaproject [P TF.getReportsPopupMenu, PF.getReportsPopupMenu @0-284 ; SDB ; APP.SETTING ID 801]

| Écran | Entrée (texte exact) | Active si | Document |
|---|---|---|---|
| Module | « **Tâche d'affaire …** » | 1 ligne sélectionnée | `.dpdoc` de type `projectTask` pour la tâche |
| Domaine | « **Tâche …** » | affaire + **exactement 1** ligne sélectionnée | `.dpdoc` `projectTask` |
| Domaine | « **Liste des tâches de l’affaire …** » (apostrophe typographique) | affaire | `.dpdoc` `projectTaskList` : **lignes sélectionnées, sinon toutes les lignes visibles**, dans l'ordre affiché (filtre et tri) ; passe aussi le texte du filtre (`filterDesc`) |
| Domaine | séparateur, puis « **Liste … [Ancien document]** » | affaire | ancien moteur `tasklist.Tasklist` |
| Domaine | « **Tâche … [Ancien document]** » | affaire | ancien moteur `tasklist.Tasksreport` : tâches sélectionnées, sinon toutes |

- Les deux dernières entrées n'apparaissent que si `Settings.isModuleFormVisible` est vrai. **Au bureau, il vaut `[YES]`** (SETTING 801).
- Le suffixe vient de `rsrc|Strings|legacyMenu` « [Ancien document] ».
- Pour les nouveaux documents, `Reports.newProjectReport` ouvre `SelectTemplateDialog.browseTemplate` (choix du modèle dans le jeu `DOCTEMPLATEGROUPNAME` de l'affaire), puis l'aperçu `ReportViewer`, d'où l'on imprime ou exporte en PDF.

### 6.2 Nouveaux documents `.dpdoc` (`modeles.json ▸ modeledocument`, jeux 1 et 2 identiques) [P dpdoc_taches.txt]

**`projectTask-fr` « Tâches d'affaire »**, A4 portrait :
- En-tête (cellule 2) : `{userName}`. Pied (cellule 5) : `Seite {pageNumber}/{nofPages}`, resté en allemand.
- Bandes :
  1. `{subject}` | `{startDate/dateLong}` ;
  2. « Affaire » : Affaire `{project/projectNumberAndTitle}`, Maître d'ouvrage, Architecte, Directeur de projet, Direction des travaux (`projectMember…/contactAddress`) ;
  3. « Informations » :
     - **Responsable = `{userName}`**, c'est-à-dire le **créateur** (USERNAME), anomalie du modèle d'origine ;
     - Date `{startDate}`, Délai `{deadline}`, Réglé `{doneDate}` (dateLong) ;
     - Statut, Priorité ;
  4. « Description de la tâche : » en gras ;
  5. `{description}`.
- Champs disponibles (`deltaproject.task.ProjectTask$StringField`) :
  - subject, description, userName « Nom », startDate « Début de la tâche », doneDate « Réglé le », deadline « Date de tâche », taskState, taskPriority, subProject, subProjectContact ;
  - les champs d'affaire ;
  - la table `noteTable` « Notes » : une ligne `jj.mm.aaaa, OWNER: Sujet` (ou « - ») par note, puis une ligne de texte. Le modèle du bureau ne l'utilise pas.
- **Il n'existe aucun champ Responsable (STAFF) ni Entité (CONTACT)** [P `ProjectTask.getString` tableswitch 0-9].

**`projectTaskList-fr` « Liste des tâches de l’affaire »**, A4 paysage, rangées alternées :
- Pied : `{appUser/userName}` et `n | N`.
- Bandes : Titre `{reportTitle}` | `{date/dateMedium}`, puis « Informations » (Affaire, Maître d'ouvrage, Architecte, Directeur de projet, « Direction de travaux »), puis la table.
- Colonnes (`ProjectTaskTableContent`) :

| id | Colonne | Contenu | Largeur | Modèle du bureau |
|---|---|---|---|---|
| 0 | Date | STARTDATE | 20 | visible |
| 1 | Affaire | NUMBER + " " + TITLE | 20 | masquée |
| 2 | Créé par | USERNAME | 20 | visible |
| 3 | Concerne | SUBJECT | 20 | visible |
| 4 | Description | DESCRIPTION complète | 20 | masquée |
| 5 | ! | icône du statut | 10 | visible |
| 6 | Statut | libellé | 20 | visible |
| 7 | ! | icône de priorité | 10 | visible |
| 8 | Priorité | libellé | 20 | visible |
| 9 | Responsable | staff | 20 | visible |
| 10 | Entité | contact | 20 | masquée |
| 11 | Délai | DEADLINE | 20 | visible |
| 12 | Réglé le | DONEDATE | 20 | visible |
| 13 | Ouvrage | **CODE** de l'ouvrage | 20 | masquée |

### 6.3 Anciens modèles `modele` : le seul moteur rendu par DeltaSub [P modeles.json ; `Tasksreport`, `TaskListPreference`, `TaskPage` ; SDB `deltaproject.project.tasklist`]

- **Emplacement** : `projectTemplates/<groupe>/projectTask/project1` et `…/projectTaskList/project1`, pour les groupes Default, Standard, Substances et Substances_2. Standard ≡ Substances (police AkkuratLL-Light) ; Default ≈ Substances_2 (Arial).

**`projectTask`** (A4 portrait) :
- **page1** (valeurs du groupe Substances) :

| Champ | Position | Étiquette ou format |
|---|---|---|
| `projectTaskTitle` | (41,41) 302×16, taille 10 | titre de la tâche |
| `date` | (366,41) | — |
| trait | y 60 | — |
| `projectNumberAndTitle` | (154,66) | « Affaire » |
| trait | y 92 | — |
| `projectAddressBuilder` | (154,99) | « Maître d'ouvrage » |
| `projectArchitect` | (154,118) | « Architecte » |
| trait | y 140 | — |
| `projectTaskStaff` | (154,148) | « **Collaborateur** » : c'est bien le responsable STAFF |
| `projectTaskContact` | (154,169) | « **Contact de la tâche** » |
| trait | y 188 | — |
| `projectTaskDeadline` | (154,197) | étiquette « **Date de tâche** », mais la valeur est le **délai** |
| `projectTaskStatus` | (154,212) | format « Statut de la tâche  » |
| `projectTaskPriority` | (297,212) | format « Priorité de la tâche  » |
| trait | y 232 | — |
| `projectTaskDesc` | (42,240) 524×566 | description |
| `pageNumber` | (468,806) | « Page n/N » |

- **pageN** : `projectNumber` (282,14), `documentTitle` (41,27), `date` (348,27), trait à y 48, **`projectTaskDesc` (40,55) 524×744** (suite de la description), `pageNumber`.
- **cover** (arrière-plan « A4 Deckblatt Hochformat ») : `documentTitle`, `date`, affaire, `projectTaskTitle` et les blocs d'intervenants. Plusieurs de ses éléments sont de type `texte` et ressemblent à des champs d'exemple : ils s'imprimeraient tels quels [D].
- **Texte de `projectTaskDesc`** [P Tasksreport @79-284] :
  - SUBJECT en style titre, puis `\n`, puis DESCRIPTION ;
  - si l'option « **Document avec des notes** » est cochée (`TaskPreference.displayProjectTaskNote = 1`), pour chaque note dont le CONTENT n'est pas vide : `\n\n£Note du <jj.mm.aaaa>:` + SUBJECT + `\n` + CONTENT ;
  - « £ » marque une ligne en gras [D] ;
  - le texte est ensuite découpé en lignes sur la page 1, puis sur les pages N.
- **Options** (`TaskPreferencesDialog` « Paramètres ») : Titre du document, Police, Police gras, Taille de police, « Document avec page de garde », « Document avec des notes », Modèle, Favoris.

**`projectTaskList`** (A4 paysage) :
- page1 et pageN : `projectNumber` (440,12), `date` (440,28), `documentTitle` (56,28), `pageNumber` (700,552 / 712,552), trait à y 78.
- Tableau `projectTableHeader` (56,56) 741×16 et tableau **`projectTaskTable`** (56,84 ; 741×466 ; rayures #eaeaea).
- **Colonnes par défaut** (`TaskListPreference`) : **10 colonnes toutes visibles, largeur 30 chacune**, dans l'ordre Date, Créé par, Concerne, Statut, Priorité, Responsable, Entité, Délai, Réglé le, Ouvrage [P constructeur, ordres 0-9].
- Réglages possibles : répartition des colonnes, Favoris, Interligne, Fond alterné, page de garde.
- Messages [P SDB] : « Impossible de trouver le modèle. » ; « Le modèle de première page ne contient pas de champ de liste. ».

### 6.4 Export ⚙▾, module et domaine [P `util.table.TablePopup.addExportPopupMenuItems`, `Tables.tableToLines` / `exportToCSV`]

- « **Copier le contenu du tableau dans le presse-papier** » : séparateur **tabulation**.
- « **Exporter le tableau dans un fichier CSV …** » : séparateur **`;`**, encodage **UTF-16**, extension `csv`.
- Contenu : en-têtes du modèle, y compris les en-têtes vides et « ! » ; lignes **dans l'ordre affiché** (filtre et tri) ; dates `jj.mm.aaaa` ; icônes **vides** ; booléens ✔ / ✕ ; autres valeurs par `toString`.

### 6.5 Choix de reproduction pour DeltaSub [C]

DeltaSub ne rend que les anciens `modele` ; `tpl-documents` n'offre qu'un aperçu des `.dpdoc`. Le choix proposé est donc le suivant :
- **Module ▸ 📄 « Tâche d'affaire … »** et **domaine ▸ 📄 « Tâche … »** : ancien modèle `projectTask` de l'affaire, via `tplOr(() => tplPrint(…), secours)`. Page de garde désactivée par défaut, option « Document avec des notes » cochée par défaut (voir §9).
- **Domaine ▸ 📄 « Liste des tâches de l’affaire … »** : ancien modèle `projectTaskList`, avec les 10 colonnes par défaut de `TaskListPreference`, sur les lignes sélectionnées, sinon toutes les lignes visibles.
- Les entrées « [Ancien document] » ne sont **pas** dupliquées dans DeltaSub : elles produiraient le même document.
- Les `.dpdoc` sont notés en incertitude (§9).

---

## §7 Données

### 7.1 Tables [P schema.txt ; mapping `db.ProjectTask` et `db.ProjectTaskNote`]

**PROJECTTASK** (0 ligne au bureau) → collection DeltaSub `projecttask` :

| Colonne | Type | Rôle |
|---|---|---|
| ID | INTEGER PK | — |
| SUBJECT | VARCHAR 255 | Concerne |
| DESCRIPTION | VARCHAR 4096 | — |
| USERNAME | VARCHAR 64 | Créé par = APPUSER.**NAME** |
| STARTDATE | DATE | Date de création (DeltaSub : `'AAAA-MM-JJ'`) |
| DEADLINE | DATE | Délai |
| DONEDATE | DATE | Réglé le |
| ISURGENT | SMALLINT 0/1 | Urgent |
| ISUNTOUCHED | SMALLINT 0/1 | Nouveau |
| PROJECTTASKSTATECODE | INTEGER | −1 (sans statut, transitoire), 0 à 3 |
| PROJECTTASKPRIORITYCODE | INTEGER | 0 à 3 |
| PROJECT_ID | FK PROJECT | affaire |
| STAFF_ID | FK STAFF | **Responsable** |
| CONTACT_ID | FK **CONTACT** (adresse, pas CONTACTOWNER) | Entité |
| SUBPROJECT_ID | FK SUBPROJECT | Ouvrage |

**PROJECTTASKNOTE** (0 ligne) → `projecttasknote` :
- ID PK ; SUBJECT VARCHAR **64** ; OWNER VARCHAR **32** (= APPUSER.**USERID**) ; CHANGEDDATE DATE ; CONTENT VARCHAR **1024** ; PROJECTTASK_ID FK.
- Cascade depuis la tâche (ALL + orphanRemoval).

**MEETINGITEM** (0 ligne), pour le lien PV : PROJECTTASK_ID FK, ITEMCATEGORYCODE (3 = Tâche), USERNAME, DEADLINE, ISDONE…

**Tables liées** :
- `APPUSER_STAFF` (19 lignes) : colonnes **APPUSER_ID** et **STAFFS_ID** (avec un S).
- `PROJECTMEMBER` : CONTACT_ID et RESPCONTACT_ID, utiles au choix du responsable.
- `CONTACT` : CONTACTOWNER_ID et CONTACTRELATION_ID, qui composent `getContactDesc`.
- `SUBPROJECT` : CODE, DESCRIPTION, LOCATIONDESCRIPTION.

### 7.2 Énumérations et libellés [P `db.ProjectTask$ProjectTaskState`, `$ProjectTaskPriority`, `$ListKind` ; SDB `db|ProjectTask`]

- **Statut** : 0 draft « Brouillon », 1 pending « En traitement », 2 cancelled « Annulé », 3 done « Réglé ». `getProjectTaskState(code)` renvoie null pour un code inconnu, dont −1.
- **Priorité** : 0 none « Aucune », 1 low « Basse », 2 normal « Normale », 3 high « Elevée ».
- **ListKind** : urgent, pending, done.
- **État d'affaire** : 1 Configuration, 2 En cours, 3 En attente, 4 Terminée, 5 Archivée.

### 7.3 Requêtes nommées de `db.ProjectTask` [P pool de constantes]

- `findAll` : `ORDER BY t.startDate`.
- `findByProject` : `WHERE t.project = :project ORDER BY t.startDate`.
- `findByProjectAndTaskState` : idem `AND t.projectTaskStateCode = :projectTaskStateCode`.
- `findByStaff`, `findByStaffAndUrgent`, `findByStaffAndTaskState` : §2.4.
- Comptages `countByContact`, `countByProject`, `countBySubProject`, `countByStaff` ; `MeetingItem.countByProjectTask`.

### 7.4 Catalogue TASK / TASKGROUP [P CSV, `db.admin.Task`, `TaskGroup`, `deltaproject.admin.*`]

**Données du bureau** :

| TASKGROUP.ID | SORTORDER | NAMEFR | Tâches (ID, SORTORDER, NAMEFR) |
|---|---|---|---|
| 1 | 1 | Tâches d'affaires | 1 (1) « Ouverture de l'affaire: organisation du projet » ; 2 (2) « Clôture de l'affaire: classement des données » |
| 52 | 2 | Tâches de bureau | *(aucune)* |
| 2 | 3 | Tâches du collaborateur | 5 (1) « Départ du collaborateur » ; 3 (2) « Tâches du collaborateur » (NAMEGE : entrée d'un collaborateur) |
| 51 | 4 | Facturation | 51, 52, 53 : **NAMEFR vide** (NAMEGE : établir la facture d'honoraires, facturer les frais, facturer les copies) |

- NAMEEN est vide partout.
- DESCRIPTION (1024) est **un seul champ** qui contient à la suite les blocs DE, FR et IT ; il est recopié tel quel.
- **Ordre** : groupes `ORDER BY g.sortOrder` ; tâches `@OrderBy("sortOrder")` sur `TaskGroup.tasks`, avec cascade ALL.
- **Nom** : choisi selon la langue de l'interface, **sans repli** (§3.6).

**Maintenance : Administrateur ▸ « Tâches »** (`AdminDialog|adminProjectTasks`, classe `deltaproject.admin.TasksFrame`) [P TasksFrame, TaskGroupDialog, TaskDialog] :
- Deux listes, Groupes et Tâches du groupe. Chacune a ＋ ✎ − et quatre déplacements (début, haut, bas, fin), qui modifient SORTORDER.
- **Groupe** : « Nouveau groupe de tâches » / « Editer le groupe de tâches ». Noms DE, FR, IT, EN, 64 caractères chacun.
- **Tâche** : « Nouvelle tâche » / « Editer la tâche ». Mêmes 4 noms + « Description » (1024).
- **OK exige le nom dans la langue de l'interface** (FR au bureau).
- **Suppression** : confirmation « Voulez-vous vraiment supprimer cette inscription ? ». Supprimer un groupe supprime ses tâches (cascade).
- **Aucun lien** avec PROJECTTASK : les tâches d'affaire sont des **copies**, donc on peut supprimer librement.
- Les libellés d'infobulles présents dans SDB sous `deltaproject.admin|TaskFrame|…` (« Définir les genres de tâches », « Ajouter une tâche »…) ne figurent pas dans le pool de `TasksFrame` [P cpool].

**Usages du catalogue** : uniquement le « + » du domaine (sélection multiple) et le « Nouveau » du choix de tâche depuis un PV (sélection simple). Il n'est pas proposé comme suggestion dans le champ Concerne [P grep des appelants].

---

## §8 Points d'ancrage dans DeltaSub (`DeltaSub.html`, 3 548 lignes)

Tout se fait dans ce seul fichier (CLAUDE.md, règle 1). **Aucune modification du serveur n'est nécessaire** : il accepte toute collection `[a-z0-9_]+` (`serveur_deltasub.py` l.98), et `new_ids` part de 1 pour une collection nouvelle (l.135-150).

### 8.1 Données et chargement (DS, l.160-212)

**Défaut à corriger** [P l.179, 181-183, 202-211] :
- `DS.loaded` ne contient que les collections présentes au démarrage. Or `poll()` **ignore** les changements des collections absentes, et `commit` ne les ajoute pas à `loaded`.
- `projecttask`, `projecttasknote` et `meetingitem` n'existent pas sur le serveur. `projectnote` (domaine Notes) non plus, d'après le rapport deltasub.
- **Correction [C]** : dans `DS.boot`, juste après la l.179, ajouter :
  ```js
  ['projecttask','projecttasknote','meetingitem','projectnote'].forEach(t=>this.loaded.add(t));
  ```
  Ces collections sont connues même vides ; cela corrige aussi le domaine Notes. Solution alternative : un `DS.need([...])` en tête de chaque `render`, comme aux l.2025, 2329 et 2722. `DS.need` ajoute bien les tables vides à `loaded` (l.181-183).

**Constantes et utilitaires**, à placer après les référentiels (l.387-392) :
```js
const PT_STATE={0:'Brouillon',1:'En traitement',2:'Annulé',3:'Réglé'};
const PT_PRIO={0:'Aucune',1:'Basse',2:'Normale',3:'Elevée'};
const ptProj=p=>p?[p.NUMBER,p.TITLE].filter(Boolean).join(' '):'';                 // Project.toString (≠ projLabel « N°: titre »)
const ptSub=s=>s?[s.CODE,s.DESCRIPTION].filter(Boolean).join(' ')+(s.LOCATIONDESCRIPTION?' | '+s.LOCATIONDESCRIPTION:''):'';
const ptContact=c=>c?[ownerName(DS.get('contactowner',c.CONTACTRELATION_ID)),ownerName(ownerOf(c))].filter(Boolean).join(', '):''; // getContactDesc
const ptCrop=s=>!s?'':s.length>30?s.slice(0,29)+'…':s;
const ptCreated=t=>(t.USERNAME||'')+', '+dfr(t.STARTDATE);
function ptNew(p){ return {ID:null,PROJECT_ID:p.ID,SUBJECT:'',DESCRIPTION:'',USERNAME:(ME.u||{}).NAME||'',STARTDATE:today(),
  DEADLINE:null,DONEDATE:null,ISURGENT:0,ISUNTOUCHED:1,PROJECTTASKSTATECODE:-1,PROJECTTASKPRIORITYCODE:0,
  STAFF_ID:null,CONTACT_ID:null,SUBPROJECT_ID:null}; }
function ptFromCatalog(p,task){ return {...ptNew(p),PROJECTTASKSTATECODE:0,SUBJECT:task.NAMEFR||'',DESCRIPTION:task.DESCRIPTION||''}; } // voir §9 (repli)
```

**Icônes** : ajouter à `ICO` (l.223-247) des dessins pour `dot` (●), `bolt` (⚡), `star0`, `starHalf`, `star` (priorité), `spin`, `pencil`, `xcircle` et `ccircle` (statut). Les dessiner en gris foncé, sans couleur. Utiliser du SVG plutôt que des glyphes Unicode : la demi-étoile est peu fiable en Unicode, et le texte copié ou exporté d'une cellule-icône reste ainsi vide, comme dans Deltaproject.

**Enregistrement** : une tâche et ses notes partent en **un seul** `DS.commit(ops)` (l.185-197).
- Les ID viennent de `DS.newIds('projecttask',n)` et `DS.newIds('projecttasknote',n)` (l.184).
- Un conflit 409 lève `e.conflict`. Le `dialog` reste alors ouvert (l.275-276), et la version à jour s'affiche.

### 8.2 Module TÂCHES

**NAV, l.341**, à remplacer par :
```js
{s:'Tâches', items:[['taches-urgent','Urgent'],['taches-encours','En traitement'],['taches-regle','Réglé']]},
```
L'ancien id `taches` peut être mémorisé dans `ds_view` (l.366) et rouvert au démarrage (l.3540-3541). Pour éviter qu'il tombe sur `VIEWS._todo` (l.376), ajouter l'alias `VIEWS['taches']=VIEWS['taches-encours']`.

**Vues** : `VIEWS['taches-urgent']=taskModule('urgent')`, puis `pending` et `done`. Les placer après `VIEWS['frais']` (l.3140), dont on reprend la disposition collaborateurs + table :

```js
const PTM={staff:null,g:{},sg:{}}; try{ PTM.staff=+localStorage.getItem('ds_h_staff')||null; }catch(_){}   // mémoire partagée avec Heures ▸ Saisie (l.3239), comme lastStaffSelection
function ptStaffs(){ const u=ME.u; return u?DS.by('appuser_staff','APPUSER_ID',u.ID).map(l=>DS.get('staff',l.STAFFS_ID)).filter(Boolean):[]; } // APPUSER_STAFF strict, anciens compris
function ptModuleRows(kind,sid){ return DS.by('projecttask','STAFF_ID',sid).filter(t=>{ const p=DS.get('project',t.PROJECT_ID);
  if(!p||p.PROJECTSTATECODE!==2) return false;
  if(kind==='done') return t.PROJECTTASKSTATECODE===3;
  return t.PROJECTTASKSTATECODE===1&&(kind!=='urgent'||!!t.ISURGENT); }); }
```

**`render`** :
- `col(240)` à gauche, avec une grille « Collaborateur » : `f:s=>esc(staffName(s))`, `rows:ptStaffs()`, tri par clic.
- Sélection : `PTM.staff` s'il est dans la liste, sinon `ME.staff` s'il est dans la liste, sinon aucune (§9).
- Attention, `grid` rend `o.sel` **en chaîne** : convertir avec `+`, car `DS.by` compare des nombres.
- À droite, `phead([...],{count:1,search})` puis une grille : `rows:ptModuleRows(kind,PTM.staff)`, `sort:['STARTDATE',1]`, sélection simple, `onDbl:ptEditReduced`.

**Colonnes (13, §2.5)** :
```js
[{k:'u',t:'●',w:22,cls:'c',f:r=>r.ISUNTOUCHED?icon('dot'):'',v:r=>r.ISUNTOUCHED?1:0},
 {k:'x',t:'!',w:22,cls:'c',f:r=>r.ISURGENT?icon('bolt'):'',v:r=>r.ISURGENT?1:0},
 {k:'STARTDATE',t:'Date',w:80,f:r=>dfr(r.STARTDATE)},
 {k:'p',t:'Affaire',w:200,f:r=>esc(ptProj(DS.get('project',r.PROJECT_ID))),v:r=>ptProj(DS.get('project',r.PROJECT_ID))},
 {k:'SUBJECT',t:'Concerne',w:180},
 {k:'DESCRIPTION',t:'Description',w:180,f:r=>esc(ptCrop(r.DESCRIPTION))},
 {k:'pi',t:'',w:20,cls:'c',f:r=>ptPrioIcon(r),v:r=>r.PROJECTTASKPRIORITYCODE},
 {k:'PROJECTTASKPRIORITYCODE',t:'Priorité',w:70,f:r=>PT_PRIO[r.PROJECTTASKPRIORITYCODE]||''},
 {k:'c',t:'Entité',w:180,f:r=>esc(ptContact(DS.get('contact',r.CONTACT_ID)))},
 {k:'DEADLINE',t:'Délai',w:80,f:r=>dfr(r.DEADLINE)},
 {k:'DONEDATE',t:'Réglé le',w:80,f:r=>dfr(r.DONEDATE)},
 {k:'USERNAME',t:'Créé par',w:110},
 {k:'s',t:'Ouvrage',w:140,f:r=>esc(ptSub(DS.get('subproject',r.SUBPROJECT_ID)))}]
```

**Barre** (`phead`, l.321) :
- `{i:'edit',t:'',fn:()=>sel&&ptEditReduced(sel)}` ;
- `{i:'doc',menu:()=>[{t:'Tâche d’affaire …',dis:!sel,fn:()=>ptPrintTask(sel)}]}` ;
- `{i:'gear',menu:()=>[{t:'Copier le contenu du tableau dans le presse-papier',dis:!o.view.length,fn:()=>copyTable(o)},{t:'Exporter le tableau dans un fichier CSV …',dis:!o.view.length,fn:()=>csvTable(o,'Taches')}]}`, avec `copyTable` et `csvTable` des l.745-746.
- **Pas de ＋, ni de −, ni de ▼.**

**Recherche** : sous-chaîne sans distinction de casse (`matchQ`, l.443) sur le **texte affiché** de toutes les colonnes, dates en jj.mm.aaaa (§9). La vider au changement d'entrée, comme le fait déjà `go` pour la recherche générale (l.363).

**`refresh(ts)`** : redessiner si `hit(ts,'projecttask','projecttasknote','project','staff','appuser_staff','contact','contactowner','subproject')` (l.370).
- Après un OK dans TD, le redessin applique le filtre : la ligne sort d'elle-même si Urgent ou Réglé a changé.
- Conserver la sélection si la ligne existe encore.

**`ptEditReduced(t)`** : dialogue « Edition », `width` ≈ 600 px, §4.2.
- Champs en lecture seule : Concerne, Description, Création (`ptCreated`), Affaire (`ptProj`), Ouvrage (`ptSub`).
- Champs modifiables :
  - `<select>` Priorité ;
  - `<input type=date>` Délai (DeltaSub laisse la saisie au clavier) ;
  - case Urgent ;
  - tableau Notes (§8.4) ;
  - case « Réglé » : quand elle est cochée, afficher `<input type=date>`, initialisé à `today()` au moment du clic ; au décochage, le masquer et le vider.
- Relire `DS.get` juste avant d'ouvrir.
- OK (grisé si SUBJECT est vide) :
  ```js
  v.PROJECTTASKPRIORITYCODE=prio; v.DEADLINE=dl||null; v.ISURGENT=urg?1:0; v.ISUNTOUCHED=0;
  if(done){ v.PROJECTTASKSTATECODE=3; v.DONEDATE=dd||null; } else { v.PROJECTTASKSTATECODE=1; v.DONEDATE=null; }
  await DS.commit([{t:'projecttask',id:v.ID,val:v},...noteOps]);
  ```

### 8.3 Domaine « Tâches »

- **l.1478 `domainUsed`** : ajouter `'Tâches'` pour retirer le « · » gris.
- **`domainView`** (l.1482) : insérer `if(d==='Tâches'){ ptDomain(C,top,pane,p); return; }` après le bloc Frais (l.1533-1540), sur le modèle du bloc Notes (l.1523-1532). Sans cela, « Tâches » tombe sur le texte de repli de la l.1545.
- **État persistant de session** : `AM.pt={g:{multi:true},state:null,keep:new Set()}`, à côté de `AM` (l.1459).
  - `state` porte le filtre de statut, `null` pour « Afficher tout ». Il est **conservé d'une affaire à l'autre** et n'est pas écrit dans `localStorage`.
  - `keep` reprend le §3.7 : les ID créés ou édités pendant la session y sont ajoutés, et `keep` est vidé à chaque changement d'affaire ou de filtre.
- **Lignes** :
  ```js
  DS.by('projecttask','PROJECT_ID',p.ID).filter(t=>AM.pt.state==null||t.PROJECTTASKSTATECODE===AM.pt.state||AM.pt.keep.has(String(t.ID)))
  ```
  avec `sort:['STARTDATE',1]` et une sélection **multiple** (`multi:true`, `gridSel`, l.319).
- **Colonnes (14, §3.3)** : Date, Créé par, Concerne, Description (`ptCrop`), icône de statut, Statut (tri par code), icône de priorité, Priorité (tri par code), Responsable (`staffName`), Entité (`ptContact`), `!` (bolt), Délai, Réglé le, Ouvrage (`ptSub`).
- **Barre** :
  - ＋ → `ptPickCatalog` (§8.5) ;
  - ✎ et −, qui exigent exactement 1 ligne dans `selSet` ;
  - 📄▾ :
    - « Tâche … », qui exige exactement 1 ligne ;
    - « Liste des tâches de l’affaire … », sur `gridSel(...)` sinon `o.view` ;
  - ⚙▾ Copier / CSV ;
  - ▼▾ `popMenu` avec `chk` : « Afficher tout », puis les 4 statuts ;
  - un `span` qui affiche le nom du statut filtré ;
  - `{count:1, search}`.
- **`ptEditFull(t|null, p)`** : dialogue « Nouveau » / « Edition », §4.1, construit avec `formRows` (l.1125) et `readK` (l.1126).
  - Concerne `maxlength 255` ; Description `textarea maxlength 4096` ; Création en `span`.
  - Statut `<select>` avec une valeur vide + 0-3 ; Priorité `<select>` 0-3.
  - Responsable et Entité : `span` + `ibtn({i:'list',menu:()=>[{t:'Choisir …',fn},{t:'Supprimer',dis:!val,fn}]})` + `ibtn({i:'info',dis:!val})`. Le ⓘ ouvre un `dialog` qui contient `contactCard(c,'Entité')` (l.1479).
  - Délai `<input type=date>` et case Urgent sur la même ligne.
  - Ouvrage `<select>` avec une valeur vide + `DS.by('subproject','PROJECT_ID',p.ID)` trié par SORTORDER, libellé `ptSub`.
  - Notes : §8.4.
  - OK grisé sans Concerne (**trimé**, voir §9) ni Statut. À l'enregistrement : `if(v.PROJECTTASKSTATECODE!==3) v.DONEDATE=null;` ; ne jamais toucher à ISUNTOUCHED ; ajouter l'ID à `AM.pt.keep`.
- **Choix du responsable** : `ptPickStaff(p, current, fn)`. `pickStaff` (l.1245) est multiple et porte sur tout le personnel ; il faut donc une variante simple, titrée « Choix du collaborateur » :
  ```js
  const mem=DS.by('projectmember','PROJECT_ID',p.ID);
  staffList().filter(s=>s.ID!==current&&mem.some(m=>m.CONTACT_ID===s.PERSON_ID||m.RESPCONTACT_ID===s.PERSON_ID)).sort((a,b)=>cmp(staffName(a),staffName(b)))
  ```
- **Choix de l'entité** : `pickContact('Navigateur d’adresses', c=>…)` (l.948) renvoie une adresse CONTACT, ce qui convient. Le mode « Intervenants » de Deltaproject n'existe pas dans ce navigateur (§9).
- **Suppression** (`ptDelete`) :
  ```js
  if(DS.by('meetingitem','PROJECTTASK_ID',t.ID).length){ dialog({title:'Avertissement',body:h('div',{style:{whiteSpace:'pre-line'}},'Cette tâche ne peut pas être effacée, car elle\nest utilisée dans un procès-verbaux.'),buttons:[{t:'OK',pri:true}]}); return; }
  if(!await confirmDlg('Voulez-vous vraiment supprimer cette inscription ?','Supprimer')) return;
  await DS.commit([{t:'projecttask',id:t.ID,val:null},...DS.by('projecttasknote','PROJECTTASK_ID',t.ID).map(n=>({t:'projecttasknote',id:n.ID,val:null}))]);
  ```

### 8.4 Notes, communes aux deux dialogues

- **Tableau** : Date (`dfr(CHANGEDDATE)`), Auteur (OWNER), Sujet, Texte, avec ＋ ✎ −. ✎ et − exigent une sélection ; un double-clic équivaut à ✎.
- Travailler sur une **copie locale** : `notes=DS.by('projecttasknote','PROJECTTASK_ID',t.ID).map(n=>({...n}))`, plus un ensemble d'ID supprimés.
- **Dialogue** « Nouvelle note » / « Modifier la note » : champ « Concerne » (`maxlength 64`, OK grisé s'il est vide) et un `textarea` sans libellé (`maxlength 1024`).
- À chaque OK de note : `SUBJECT=trim`, `CONTENT=trim`, `CHANGEDDATE=today()`, `OWNER=ME.id` (USERID, l.409).
- Suppression : `confirmDlg('Voulez-vous vraiment supprimer cette inscription ?')`.
- **Écriture** seulement au OK de la tâche, dans le même `DS.commit` :
  - notes nouvelles : ID par `DS.newIds('projecttasknote',n)` et `PROJECTTASK_ID` = ID de la tâche (obtenu d'abord par `newIds('projecttask')` en création) ;
  - notes modifiées ;
  - notes supprimées : `val:null`.
- Le modèle existant de `ProjectNote` (l.1523-1532) écrit dès le OK de la note et laisse la date modifiable. **Ne pas le copier** sur ces deux points.

### 8.5 Catalogue

**`ptPickCatalog(p)`** : dialogue « Sélection des tâches ».
- Deux grilles côte à côte :
  - « Groupe » : `DS.all('taskgroup')` trié par SORTORDER, **rien de présélectionné** ;
  - « Désignation » : `DS.all('task').filter(x=>x.TASKGROUP_ID===g)` trié par SORTORDER, `multi:true`, double-clic = OK.
- Boutons :
  - « Nouveau » → `ptEditFull(ptNew(p))` ;
  - « Annuler » ;
  - « OK », qui exige au moins une tâche sélectionnée :
    - 1 tâche → `ptEditFull(ptFromCatalog(p,x))`, en mode « Nouveau » ;
    - ≥ 2 tâches → `DS.newIds('projecttask',n)` puis **un seul** `DS.commit` de n tâches en Brouillon, sans dialogue. **La première** est sélectionnée, et toutes rejoignent `AM.pt.keep`.

**Administrateur** : ajouter `'Tâches'` à `cats` (l.1902) et une branche dans `admPane` (l.1908).
- Deux grilles Groupes / Tâches, avec ＋ ✎ − et quatre boutons `first` / `prev` / `next` / `last` (icônes déjà dans `ICO`), qui renumérotent SORTORDER.
- Dialogues « Nouveau groupe de tâches » / « Editer le groupe de tâches » et « Nouvelle tâche » / « Editer la tâche » : `lang4(v)` (l.1124), avec `maxlength 64`, plus un `textarea` « Description » (1024) pour la tâche. OK exige NAMEFR.
- Suppression d'un groupe : `DS.commit` du groupe **et de ses tâches**.

### 8.6 Intégrité inverse (§5.2)

`projecttask` doit être chargée (§8.1) avant ces contrôles :
- **`delProject`** (l.1173) : ajouter `DS.by('projecttask','PROJECT_ID',p.ID).length` aux conditions de refus.
- **`delStaff`** (l.955) : refuser si `DS.by('projecttask','STAFF_ID',s.ID).length`, message « Cette inscription est déjà utilisée et ne peut pas être supprimée. (tâches) », sur le modèle de la l.957.
- **`delContact`** (l.807) : si `DS.by('projecttask','CONTACT_ID',c.ID).length`, l'adresse est utilisée (« Entité dans des tâches ») ; proposer de la masquer, comme le fait la fonction.
- **`delOwner`** (l.794) : ajouter `if(cs.some(c=>DS.by('projecttask','CONTACT_ID',c.ID).length)) used.push('Entité dans des tâches');`.
- **Ouvrage** (`cfgSubprojects`, suppression l.1327) : refuser si `DS.by('projecttask','SUBPROJECT_ID',+o.sel).length`.

### 8.7 Impression (moteur `tplPrint`, l.3022-3049)

**Fiche d'une tâche** :
```js
tplOr(()=>tplPrint({type:'projectTask',project:p,title:'Tâche',ctx:{fields:{
  projectTaskTitle:t.SUBJECT, projectTaskStaff:staffName(DS.get('staff',t.STAFF_ID)), projectTaskContact:ptContact(DS.get('contact',t.CONTACT_ID)),
  projectTaskDeadline:dLong(t.DEADLINE), projectTaskStatus:PT_STATE[t.PROJECTTASKSTATECODE]||'', projectTaskPriority:PT_PRIO[t.PROJECTTASKPRIORITYCODE]}},
  flow:{champ:'projectTaskDesc',text:ptDescText(t,withNotes)}, fallback:()=>ptPrintHTML(t)}),()=>ptPrintHTML(t));
```
- `dLong` est défini l.2980. Les préfixes « Statut de la tâche  » et « Priorité de la tâche  » sont déjà appliqués par `tplFieldValue` (l.2986-2988, `format[0]`).
- `ptDescText` = SUBJECT + `\n` + DESCRIPTION, plus, si les notes sont demandées, pour chaque note dont CONTENT n'est pas vide : `\n\nNote du jj.mm.aaaa:` + SUBJECT + `\n` + CONTENT. La ligne « Note du » est en gras (marque « £ » d'origine).
- **Extension à prévoir dans `tplPrint`** : avec une zone `champ` sans `tableau`, `cap()` vaut `Infinity`, donc on n'obtient qu'une seule page. Le texte est alors coupé par l'`overflow:hidden` de `tplPageHTML` (l.2815) [D du code l.3026-3035]. Ajouter une option `o.flow` qui fonctionne ainsi :
  - découper `text` en lignes, avec l'estimation de largeur déjà utilisée pour `cap1` (l.3030) ;
  - capacité de chaque page = `Math.floor(e.h/(e.taille*1.35))` pour l'élément `champ===o.flow.champ` de page1 (524×566), puis de pageN (524×744) ;
  - créer autant de pages que nécessaire ;
  - dans `vals`, renvoyer pour `o.flow.champ` le morceau de la page `n`.
- La page de garde reste désactivée par défaut (`cover` n'est pas passé).

**Liste** :
```js
tplOr(()=>tplPrint({type:'projectTaskList',project:p,title:'Liste des tâches de l’affaire',
  cols:[{t:'Date',w:30},{t:'Créé par',w:30},{t:'Concerne',w:30},{t:'Statut',w:30},{t:'Priorité',w:30},{t:'Responsable',w:30},{t:'Entité',w:30},{t:'Délai',w:30},{t:'Réglé le',w:30},{t:'Ouvrage',w:30}],
  rows:list.map(t=>[dfr(t.STARTDATE),t.USERNAME||'',t.SUBJECT||'',PT_STATE[t.PROJECTTASKSTATECODE]||'',PT_PRIO[t.PROJECTTASKPRIORITYCODE]||'',
    staffName(DS.get('staff',t.STAFF_ID)),ptContact(DS.get('contact',t.CONTACT_ID)),dfr(t.DEADLINE),dfr(t.DONEDATE),(DS.get('subproject',t.SUBPROJECT_ID)||{}).CODE||'']),
  fallback:()=>ptListHTML(list,p)}),()=>ptListHTML(list,p));
```
- `tplFind` (l.2975) choisit le groupe de l'affaire (`TEMPLATEGROUPNAME`), puis le groupe par défaut, puis Standard, puis Default.
- Le tableau `projectTaskTable` et l'en-tête `projectTableHeader` sont reconnus par `tplPrint` : le plus grand `tableau` et le suffixe `TableHeader`.

**Secours HTML** (`ptPrintHTML`, `ptListHTML`) : reprendre la présentation `.dpdoc` du §6.2, avec les bandes Concerne / Affaire / Informations / Description.

### 8.8 Récapitulatif des ancrages

| Élément | Lignes |
|---|---|
| DS (boot, need, newIds, commit, save, del, poll) | 160-212 (boot 175-180, need 181-183, commit 185-197, poll 202-211) |
| `nm` (repli NAMEGE, ≠ `Task.getName`) | 217 |
| `ICO`, `icon`, `ibtn`, `setTools`, `popMenu` | 223-247, 248, 250, 255, 258 |
| `dialog`, `confirmDlg` | 270, 283 |
| `grid`, `gridSel`, `phead`, `seg`, `col` | 288, 319, 321, 328, 330 |
| NAV (Tâches) | 335-345 (**341**) |
| `go`, `hit`, `DS.on`, `VIEWS._todo` | 359-367, 370, 371-373, 376-377 |
| `ownerName`, `contactName`, `staffName`, `staffList`, `projLabel` | 387-391 |
| `ME` (u, staff, id), `chooseUser` | 405-409, 410 |
| `today`, `ownerOf`, `matchQ` | 433, 436, 443 |
| `tableText`, `copyTable`, `csvTable` | 742, 745, 746 |
| `delOwner`, `delContact`, `pickContact`, `delStaff` | 794, 807, 948, 955 |
| `staffProjects`, `lang4`, `formRows`, `readK`, `tI` | 1122, 1124, 1125, 1126, 1128 |
| `delProject`, `pickStaff`, `cfgSubprojects` (suppression d'ouvrage) | 1173, 1245, 1313 (1327) |
| `DOMAINS`, `AM`, `affNav`, `domainUsed`, `contactCard`, `domainView` | 1457, 1459, 1461-1476, 1478, 1479, 1482 |
| Bloc Notes (modèle), bloc Frais, texte de repli | 1523-1532, 1533-1540, 1543-1545 |
| `dpStaffs` (APPUSER_STAFF avec repli sur tous) | 1809 |
| `ADM`, `VIEWS['config']`, `cats`, `admPane` | 1895, 1898, 1902, 1908 |
| `TPL_TABLES`, `tplNeed`, `tplPageHTML` | 2805, 2806, 2815 |
| `tplFind`, `dLong`, `tplMember`, `tplFieldValue`, `tplTableHTML`, `tplPrint`, `tplReady`, `tplOr` | 2975, 2980, 2982, 2986, 3014, 3022, 3051, 3052 |
| `VIEWS['frais']` (modèle de disposition), `ds_h_staff` | 3140, 3239 |
| Démarrage (`go(last)`) | 3530-3546 |

---

## §9 Incertitudes restantes et choix recommandés

| # | Incertitude ou écart | Choix recommandé [C] |
|---|---|---|
| 1 | **Rendu des `.dpdoc`** (« Tâche d'affaire », « Tâche », « Liste des tâches de l’affaire » : ce que produit réellement Deltaproject) : DeltaSub ne les rend pas | Imprimer avec les **anciens modèles** `projectTask` / `projectTaskList` du jeu de l'affaire, comme les autres modules DeltaSub. Garder l'HTML de secours inspiré du `.dpdoc`. À valider par Paulo |
| 2 | **DONEDATE jamais posé depuis le domaine** : fidèle, mais « Réglé le » reste vide pour une tâche close dans l'affaire | **Fidèle** par défaut. Option : poser `today()` si le statut passe à 3 et que DONEDATE est vide. À valider par Paulo |
| 3 | **Collaborateur présélectionné** dans le module : Deltaproject reprend le dernier choix partagé, sinon ne sélectionne rien, et la liste reste vide | Dernier choix (`ds_h_staff`) s'il figure dans la liste, sinon `ME.staff`, sinon aucun. Écart assumé, car c'est une amélioration |
| 4 | **Utilisateur sans collaborateur lié** : 2 utilisateurs sur 11 au bureau | Rester **strict** (APPUSER_STAFF) et afficher « Aucun collaborateur n'est lié à votre utilisateur. » Ne pas reprendre le repli « tous » de `dpStaffs` (l.1809) |
| 5 | **Catalogue : NAMEFR vide** (tâches 51-53) : fidèle, cela donne un Concerne vide et une tâche qu'on ne peut pas valider dans le module | Afficher et recopier `task.NAMEFR || task.NAMEGE` (écart signalé). Le vrai remède est de compléter NAMEFR dans Administrateur ▸ Tâches |
| 6 | **Concerne composé seulement d'espaces** : Deltaproject l'accepte puis l'enregistre vide | Tester après trim (écart mineur) |
| 7 | **Recherche** : Deltaproject compare avec une expression régulière sur `toString()` (dates `aaaa-mm-jj`, description tronquée) | Sous-chaîne sans distinction de casse sur le **texte affiché** (dates jj.mm.aaaa, description complète en plus), sans syntaxe regex. C'est plus utile et reste proche |
| 8 | **Saisie du Délai** : Deltaproject impose le sélecteur | `<input type=date>`, saisie au clavier comprise. Le bouton « Supprimer » est remplacé par l'effacement du champ |
| 9 | **Case Réglé sans date** (le 📅 disparaît quand on efface la date) | Laisser le champ date visible tant que la case est cochée (amélioration). Enregistrer DONEDATE null si le champ est vide, comme Deltaproject |
| 10 | **Lignes hors filtre après création ou édition** dans le domaine (§3.7) | **Reproduire** avec `AM.pt.keep` : c'est moins déroutant qu'une ligne qui disparaît juste après sa création |
| 11 | **Mémorisation du tri et de la taille des dialogues** (préférences Deltaproject) | Tri gardé dans `o.state` pour la session. Option : `localStorage` `ds_pt_sort_m` / `ds_pt_sort_d`. Tailles non mémorisées |
| 12 | **Mode « Intervenants »** du navigateur d'adresses pour l'Entité (`ContactBrowserDialog(win, project)`) : absent de `pickContact` | Première étape : `pickContact` tel quel. Ensuite, ajouter à `pickContact` un filtre facultatif « Intervenants de l'affaire » (`DS.by('projectmember','PROJECT_ID',p.ID)`) |
| 13 | **« Responsable » du modèle `.dpdoc` = USERNAME** (anomalie d'origine) | Sans objet si l'on suit le point 1 : l'ancien modèle imprime le vrai responsable (« Collaborateur ») |
| 14 | **Valeur des champs `projectTaskStaff` et `projectTaskContact`** de l'ancien modèle : les exemples indiquent « (Abréviation d'adresse) », le formatage par le moteur `aq.form` n'a pas été suivi | `SHORTLABEL` de l'adresse s'il existe, sinon `staffName` / `ptContact` [D] |
| 15 | **`documentTitle` de l'ancien document « Tâche »** : sa valeur par défaut vient de `TaskPreferencesDialog`, non vérifiée | « Tâche » [D]. `documentTitle` n'apparaît que sur pageN et sur la page de garde |
| 16 | **Option « Document avec des notes »** : défaut non vérifié (`TaskPreference`) | Cochée par défaut. Proposer une case à cocher avant l'impression |
| 17 | **Lien PV** : DeltaSub n'a pas de séances | Écrire le contrôle `meetingitem` (§5.1), qui répondra toujours 0. Les boutons Parcourir / Éditer / Retirer d'un point de PV viendront avec un futur module Séances |
| 18 | **Droits** : DeltaSub n'en a pas | Rien à faire aujourd'hui, car tout le bureau a `4,16` et `13,0`. Si des droits arrivent un jour : `13,0` pour la section TÂCHES, `4,16` pour le domaine |
| 19 | **Reprise Deltaproject** (`importer_dans_deltasub.sh --force`) : elle **remplace toutes** les données DeltaSub, tâches créées dans DeltaSub comprises (`serveur_deltasub.py` l.181-185) | À signaler à Paulo avant toute réimportation une fois les tâches utilisées |
| 20 | **Notes modifiées puis tâche annulée** : dans Deltaproject, l'entité reste modifiée en mémoire jusqu'au prochain `refresh`. Un effet de bord à l'enregistrement suivant n'est pas exclu [D] | DeltaSub travaille sur une copie locale : Annuler n'écrit rien |
| 21 | **Recherche du module non réappliquée après un rechargement** (Deltaproject) | Vider la recherche au changement d'entrée. La garder et la réappliquer lors d'un redessin dû à `refresh` |
| 22 | **Aucune notification** d'une tâche attribuée (ni compteur, ni e-mail) | Fidèle : pas de compteur. Une pastille « n nouvelles » sur l'entrée En traitement serait une amélioration, à ne faire que sur demande |

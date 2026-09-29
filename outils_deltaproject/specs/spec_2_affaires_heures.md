# Cahier des charges d'interface — DeltaSub.html
## Partie 2 : Gestion des affaires, Heures, Notes de frais, Controlling

Périmètre : manuel DELTAproject FR, pages 24 à 33 (+ p. 34 pour la navigation « Mes affaires »).
Sources croisées : copies d'écran du manuel, libellés officiels (`Strings.db`), schéma et données de la base Derby réelle du bureau, constantes des énumérations lues dans `db.jar` (lecture seule).

Conventions du document :
- « Libellé » = texte FR exact affiché par DELTAproject (à reprendre tel quel).
- `TABLE.COLONNE` = correspondance avec la base réelle (pour l'import/export et la reprise des données).
- **(déduit)** = comportement/correspondance déduit des données ou des libellés, non visible sur une capture.
- Booléens en base : `SMALLINT` 0/1. Mois en base : **0 à 11** (convention Java : 0 = janvier). Heures : `TIMEHOUR` 0–24 (24 = minuit en fin de plage).
- Budgets : partout `TIMEBUDGET` = heures, `TIMEAMOUNTBUDGET` = CHF d'honoraires, `COSTBUDGET` = frais (« NK ») en CHF — vérifié sur les données (ex. 1 030 h ↔ 133 900 CHF).

---

## 0. Cadre général de l'application (rappel utile à ce périmètre)

### 0.1 Fenêtre principale
- **Bandeau haut** : nom du bureau à gauche (grand, gras), logo à droite ; titre de fenêtre « DELTAproject - <utilisateur> ».
- **Barre d'outils** contextuelle au module (au-dessus du contenu), compteur à droite (« 11 Affaires ») et champ de recherche avec loupe.
- **Arborescence des modules à gauche** (fond gris clair, triangles repliables, titres en MAJUSCULES) :
  ADRESSES · AFFAIRES · COLLABORATEURS · NOTES DE FRAIS · HEURES · TÂCHES · FACTURES · BÂTIMENT · MANAGEMENT · MODELES.
  - AFFAIRES ▸ `Gestion`, `Controlling`, `Mes affaires`, `Toutes les affaires`
  - NOTES DE FRAIS ▸ `Saisie`, `Rapport`
  - HEURES ▸ `Saisie`, `Rapport` (libellé module additionnel dans la base : `Disponibilité`)
  - Sous-module sélectionné : fond gris moyen, texte blanc.
- **Navigation en colonnes** (principe Finder/Miller) : `liste des affaires | domaine d'affaire | contenu`. Chaque colonne est un tableau à en-têtes triables, lignes zébrées (blanc / bleu très pâle), sélection bleu vif texte blanc.

### 0.2 Boutons standards récurrents
| Icône | Rôle |
|---|---|
| `+` | Nouveau (parfois avec ▾ = menu de variantes) |
| crayon | Éditer la ligne sélectionnée (double-clic équivalent) |
| `−` | Supprimer (confirmation) |
| `⤒ ↑ ↓ ⤓` | Déplacer tout en haut / monter / descendre / tout en bas (ordre = `SORTORDER`) |
| ↻ | Réinitialiser / ordre par défaut / insérer les standards |
| plateau + flèche (import) | Importer du dossier standard / d'une affaire existante |
| document ▾ | Documents / impressions |
| roue crantée ▾ | Réglages / actions secondaires |
| entonnoir ▾ | Filtre |
| `Fermer` (bouton bleu, bas-droite) | Ferme une fenêtre de configuration (enregistrement immédiat) |
| `Annuler` / `OK` | Fenêtres d'édition modales |

---

## 1. AFFAIRES ▸ Gestion — liste des affaires (p. 24, capture p24_227)

### 1.1 Disposition
Contenu = un seul grand tableau (pas de colonnes supplémentaires en Gestion).

**Barre d'outils (de gauche à droite)** : `+` · crayon · `−` · [personne ▾] · [clé ▾] · [organigramme ▾] · [boîte d'archive ▾] · [document ▾] · [roue ▾] · [entonnoir ▾] · compteur « N Affaires » · recherche.

Répartition des commandes dans les menus (libellés exacts `ProjectDefinitionFrame` ; regroupement par icône **(déduit)**) :

| Menu | Entrées |
|---|---|
| personne ▾ (intervenants) | `Attribuer les intervenants` · `Groupes de rôles` · `Attribuer les collaborateurs d'affaire` · `Attribuer les activités aux collaborateurs` |
| clé ▾ (configuration) | `Configurer les activités` · `Configurer les tarifs de facturation` · `Configurer les phases` · `Configurer les frais` · `Configurer les séances` · `Configurer les types de plans` · `Configurer la nomenclature des plans` · `Configurer les plans comptables` · `Configurer le CFC` · `Configurer la répartition des frais par éléments` |
| organigramme ▾ (subdivisions) | `Configurer la subdivision par ouvrages et localisations` · `Configurer la subdivision par locaux` · `Configurer la subdivision par affectations` |
| archive ▾ (dossiers) | `Dossier des documents externes` · `Dossier des modèles` · `Dossier enregistrements des documents` |
| document ▾ | `Liste des affaires` (impression, cf. 1.4) |
| roue ▾ | `Afficher les non archivées` (case) · `Importer des heures` |
| entonnoir ▾ | `Editer le filtre` (cf. 1.3) |

### 1.2 Colonnes du tableau (ordre de la capture)
| # | Libellé | Source | Remarque |
|---|---|---|---|
| 1 | `Numéro` | `PROJECT.NUMBER` (varchar 32) | Chez Substances : format dominant `99AAA` (ex. « 22BHF »), plus quelques codes libres |
| 2 | `Affaire` | `PROJECT.TITLE` (varchar 128) | |
| 3 | `Statut` | `PROJECT.PROJECTSTATECODE` | libellé, cf. 1.5 |
| 4 | `Début` | `PROJECT.PROJECTSTARTDATE` | format `JJ.MM.AAAA` |
| 5 | `Fin` | `PROJECT.PROJECTENDDATE` | vide le plus souvent |
| 6 | `Actif` | calculé | ✔ si statut ∈ {Configuration?, En cours, En attente, Terminée}, ✕ si `Archivée` **(déduit : sur la capture seule « Archivée » porte ✕)** |

Colonnes optionnelles disponibles (libellés `ProjectTableModel`, à proposer via un sélecteur de colonnes) : `Complément`, `Maître d'ouvrage`, `Adresse-Maîtres d'ouvrage`, `Phase en cours`, `Numéro d'affaire externe`, `Tri`, `Volume construit`, `Zone/quartier`, `Indice`, `Début de planification`, `Fin de planification`, `Début des travaux`, `Fin des travaux`, `Remise des clés`. Deux présentations : `Abrégée` / `Standard`.

**Tri** : l'ordre par défaut suit le champ `Tri` (`SORTLABEL`) puis le numéro ; clic sur en-tête = tri colonne.
**Comportements** : double-clic → « Editer l'affaire » ; `−` refusé si des données existent : « Des documents, des heures ou des frais ont déjà été saisis dans cette affaire. Suppression impossible. » ; sinon « Voulez-vous vraiment supprimer cette affaire ? ».

### 1.3 Filtre (`Editer le filtre`)
Champs : `Statut de l'affaire` (liste 1.5) · `Type d'affaire` (`Affaires internes` / `Affaires externes`) · `Groupe d'affaires` (PROJECTGROUP) · `Genre d'affaires` (PROJECTKIND). Option roue : `Afficher les non archivées`.

### 1.4 Impression « Liste des affaires »
- Critères : `Statut d'affaire` (`Toutes les affaires` / `Affaires en cours` / `Affaires terminées`), `Numéro d'affaire` (`Est égal à`, `Plus grand ou égal à`, `Plus petit ou égal à`, `Autour de`), `Début du projet` / `Fin du projet` (`avant le`, `après le`, `Autour du`), `Genres d'affaire`.
- Colonnes imprimables : `Numéro`, `Affaire`, `Maître d'ouvrage`, `NPA`, `Localité`, `Début`, `Fin`, `Statut`, `Groupe d'affaire`, `Genre d'affaire`.
- Tri : `Tri selon numéro d'affaire`, `Tri alphabétique`, `Tri selon maître d'ouvrage`, `Tri selon début du projet`, `Tri selon fin du projet`, `Tri selon genre d'affaire`, `Tri selon critères de tri`.
- Mise en page : `Titre du document`, `Modèle`, `Taille de police`, `Interligne`, `Avec page de garde`, `Document avec fond alterné`.

### 1.5 Codes de statut d'affaire — `PROJECT.PROJECTSTATECODE`
(valeurs lues dans l'énumération `Project$ProjectState`, libellés `db/Project`)

| Code | Libellé FR | Sens | Répartition réelle (111 affaires) |
|---|---|---|---|
| 1 | `Configuration` | en préparation ; invisible pour les collaborateurs ; seul statut où l'import d'activités/phases/tarifs/nomenclature est permis | 1 |
| 2 | `En cours` | ouverte à la saisie des heures et frais | 46 |
| 3 | `En attente` | active mais suspendue | 4 |
| 4 | `Terminée` | close | 36 |
| 5 | `Archivée` | masquée (Actif = ✕) | 24 |

Message réutilisé : « Cette fonction n'est disponible que si le statut de l'affaire est 'Configuration'. »

---

## 2. Fiche affaire — « Nouvelle affaire » / « Editer l'affaire » (p. 24, capture p24_231)

Fenêtre modale à **6 onglets** : `Affaire` · `Genres d'affaire` · `Délais` · `Paramètres` · `Adresses` · `Références`. Boutons `Annuler` / `OK`.

### 2.1 Onglet `Affaire`
| Libellé | Contrôle | Source |
|---|---|---|
| `Numéro d'affaire` | texte court | `NUMBER` (obligatoire, unique **(déduit)**) |
| `Désignation de l'affaire` | texte pleine largeur | `TITLE` |
| `Complément` | zone de texte 3 lignes | `DESCRIPTION` (varchar 255) |
| `Type d'affaire` | case `Interne` | `ISINTERNAL` (1 seule affaire interne chez Substances = « bureau ») |
| `Statut de l'affaire` | liste déroulante (5 statuts 1.5) | `PROJECTSTATECODE` |
| `Phase en cours` | liste déroulante des phases de l'affaire (vide possible) | `CURRENTPROJECTPHASE_ID` → `PROJECTPHASE.ID` |
| `Tri` | texte | `SORTLABEL` |
| `Indice ICC` | nombre (ex. 101.5) | `BASISINDEX` — utilisé par le contrôle des coûts (renchérissement) |
| `Volume construit` | nombre + « m3 » | `VOLUME` |
| `Surface de plancher` | nombre + « m2 » | `AREA` |

### 2.2 Onglet `Genres d'affaire`
Tableau à cases à cocher, colonnes `Groupe d'affaires` | `Genre d'affaire` ; une affaire peut avoir plusieurs genres.
→ table de liaison `PROJECT_PROJECTKIND(PROJECT_ID, PROJECTKINDS_ID)` ; `PROJECTKIND.PROJECTGROUP_ID` → `PROJECTGROUP`.
Référentiel réel : 12 groupes × 6 genres (voir §13.6).

### 2.3 Onglet `Délais`
| Libellé | Source | Type |
|---|---|---|
| `Début du projet` | `PROJECTSTARTDATE` | date |
| `Fin du projet` | `PROJECTENDDATE` | date |
| `Début de planification` | `STARTOFPLANNING` | **texte libre** (varchar) |
| `Fin de planification` | `ENDOFPLANNING` | texte libre |
| `Début des travaux` | `STARTOFCONSTRUCTION` | texte libre |
| `Fin des travaux` | `ENDOFCONSTRUCTION` | texte libre |
| `Remise des clés` | `MOVEINDEADLINE` | texte libre |

### 2.4 Onglet `Paramètres` (décrit p. 24)
| Groupe | Libellé | Source |
|---|---|---|
| — | `Monnaie` | `CURRENCY` (toujours « CHF » dans les données) |
| `Temps de travail` | `Phase obligatoire` | `ISTIMEPHASEMANDATORY` (55/111 à 1) |
| | `Subdivision obligatoire` | `ISTIMESUBPROJECTMANDATORY` (0 partout) |
| | `Commentaire obligatoire` | `ISTIMEDESCMANDATORY` (59/111 à 1) |
| `Notes de frais` | `Phase obligatoire` | `ISEXPENSESPHASEMANDATORY` |
| | `Description obligatoire` | `ISEXPENSESDESCMANDATORY` (107/111 à 1) |
| `Plan-ID` | `Prochain plan-ID` | `NEXTUNIQUEPLANID` (incrémenté de 1 à chaque plan créé) |
| | `Créer automatiquement` | `ISUNIQUEPLANIDLOCKED` |
| — | `Modèles de documents` | `TEMPLATEGROUPNAME` / `DOCTEMPLATEGROUPNAME` (cf. §9) |
| — | `Emplacement du dossier d'affaire` + `Afficher l'emplacement` | `PROJECTFOLDER` |
| — | `URL de la messagerie` | `MAILBOXURL` |

### 2.5 Onglet `Adresses`
Quatre adresses liées à `CONTACT` (bouton ◀ = choisir dans le carnet, `i` = afficher la fiche) :
`Adresse d'affaire` · `Adresse de facturation` · `Adresse de livraison` · `Lieu de dépôt des offres`
→ `CONTACT1_ID … CONTACT4_ID` dans cet ordre **(déduit, à vérifier sur une affaire test)**. Message : « Voulez-vous supprimer cette adresse ? »

### 2.6 Onglet `Références` (titre interne « Références externes »)
`Numéro d'affaire externe` (`EXTERNALNUMBER`) · `District` (`LOCATION`) · `Zone/quartier` (`PLOT`) · `Numéro registre foncier` (`LANDREGISTERNR`) · `Service comptabilité` (`ACCOUNTINGAREA`).

---

## 3. Intervenants de l'affaire (p. 25, captures p25_238, p25_242, p34_341)

### 3.1 Fenêtre « Définir les intervenants » (Gestion ▸ `Attribuer les intervenants`)
Disposition en 2 panneaux :
- **Gauche** : liste `Rôle` ; chaque rôle affiche le nombre d'intervenants entre parenthèses (« Spécialistes (3) »). Sous la liste : `⤒ ↑ ↓ ⤓` (ordre des rôles, propre à l'affaire → `PROJECT.ROLELISTSORTCODE` **(déduit)**) et ↻ `L'ordre par défaut`.
- **Droite** : barre `+` (`Attribuer un nouvel intervenant`) · crayon (`Editer`) · `−` (`Supprimer l'intervenant`) · import (`Importer les intervenants d'une affaire existante`).
  Tableau, colonnes : `Entité` · `Responsable` · `Domaine spécialisé` · `Fonction` · `CFC` · `Notes` · `Masqué` (✕/✔).
- Bouton `Fermer`.

Correspondance `PROJECTMEMBER` :
| Colonne | Source |
|---|---|
| Rôle | `TEAMROLECODE` (cf. 3.4) |
| Entité | `CONTACT_ID` → CONTACT (société ou personne) |
| Responsable | `RESPCONTACT_ID` → CONTACT (personne) |
| Domaine spécialisé | `PROJECTDIVISION` |
| Fonction | `PROJECTROLE` |
| CFC | `BKP` (varchar 256 ; rempli surtout pour les Entreprises) |
| Notes | `NOTE` |
| Masqué | `ISHIDDEN` |
| ordre | `SORTORDER` |

Règles :
- Pour le rôle `Collaborateurs` : Entité = le bureau, Responsable = la personne du collaborateur (`STAFF.PERSON_ID`) — vérifié sur 815 lignes. **Indispensable** : seuls ces collaborateurs voient l'affaire dans « Mes affaires » et peuvent y saisir des heures.
- Un même contact peut avoir plusieurs rôles. Certains rôles n'acceptent qu'une entité (Directeur d'affaire, Maître d'ouvrage…), d'autres plusieurs (Entreprises) — drapeau « unique » en 3.4.
- Rôle spécial `Intervenants archivés` (code 90) : déplacer un intervenant pour qu'il n'apparaisse plus dans les listes.

### 3.2 Fenêtre d'édition « Nouvel intervenant » / « Modifier l'intervenant »
Champs : `Rôle` (liste) · `Rôle secondaire` · `Entité` (sélection dans le carnet ; `Ajouter un responsable à l entité`) · `Responsable` (personnes liées à l'entité) · `Domaine spécialisé` · `Fonction` · `CFC` · `Note` · case `Masquer dans la liste des affaires`.

### 3.3 Groupes de rôles — « Définir un groupe de rôles » (capture p25_242)
- Barre : `+` (`Nouveau groupe de rôles`) · crayon (`Editer`) · `−` (`Effacer`) · `⤒ ↑ ↓ ⤓` · import.
- Tableau une colonne `Nom` (ex. « Entrepreneurs », « Equipe de planification »). Bouton `Fermer`.
- Édition (« Groupe de rôles » / « Editer le groupe rôles ») : `Désignation` + liste `Rôles` avec `Ajouter un rôle` / `Supprimer un rôle`.
- Table `PROJECTMEMBERROLEGROUP(NAME, SORTORDER, TEAMROLECODES, PROJECT_ID)` ; `TEAMROLECODES` = liste de codes séparés par virgules terminée par une virgule (ex. « 1, »).
- Usage : dans « Mes affaires ▸ Intervenants », le filtre entonnoir propose `Afficher tout`, puis les groupes entre chevrons `<Nom du groupe>`, puis chaque rôle.

### 3.4 Liste de référence des rôles — `PROJECTMEMBER.TEAMROLECODE`
Codes lus dans l'énumération `ProjectMemberRole$TeamRole`. « Ordre » = ordre d'affichage par défaut (confirmé par la capture p34_341). « Unique » = une seule entité admise **(déduit du drapeau de l'énumération + manuel)**.

| Ordre | Code | Libellé FR | Unique |
|---|---|---|---|
| 0 | 8 | Maître d'ouvrage | oui |
| (après 0) | 23 | Autres MO | non |
| 1 | 31 | Entreprise totale | oui |
| 2 | 1 | Architecte | oui |
| (après 2) | 22 | Autres architectes | non |
| 3 | 2 | Directeur des travaux | oui |
| 4 | 3 | Ingénieur civil | oui |
| 5 | 35 | Paysagiste | oui |
| 6 | 19 | Entreprises | non |
| 7 | 25 | Entreprise générale | non |
| 8 | 4 | Directeur d'affaire | oui |
| 9 | 5 | Représentant directeur | oui |
| 10 | 6 | Responsable de l'affaire | oui |
| 11 | 7 | Représentant resp. | oui |
| 12 | 50 | Consultant du MO | oui |
| 13 | 51 | Représentant du MO | oui |
| 14 | 32 | Economiste | non |
| 20 | 12 | Collaborateurs | non |
| 21 | 13 | Collaborateurs externes | non |
| 22 | 24 | Gérant d'immeubles | non |
| 23 | 10 | Spécialistes | non |
| 24 | 26 | Planificateur principal | non |
| 25 | 21 | Planificateur de coût | oui |
| 26 | 11 | Experts | non |
| 27 | 14 | Autorités | non |
| 28 | 20 | Assurances | non |
| 29 | 16 | Locataires | non |
| 30 | 17 | Acheteurs | non |
| 31 | 18 | Voisins | non |
| 32 | 27 | Gérance immobilière | non |
| 33 | 28 | Clients | non |
| 34 | 29 | Exploitants | non |
| 35 | 30 | Participants concours | non |
| 36 | 36 | Manager BIM | non |
| 37 | 37 | Coordinateur BIM | non |
| 38 | 38 | Responsable BIM | non |
| 39 | 39 | Coordinateur ICT | non |
| 40 | 33 | Garant (SIA 1018/1019) | oui |
| 41 | 34 | Usines | non |
| 42 | 15 | Autres | non |
| 43 | 90 | Intervenants archivés | non |
| — | 100 | (interne : contrôle des coûts de réalisation, non affiché) | — |

Usage réel chez Substances (1 324 lignes) : 12 Collaborateurs (872), 19 Entreprises (330, avec CFC), 8 Maître d'ouvrage (50), 1 Architecte (44), 2 Directeur des travaux (28).

### 3.5 Domaine « Intervenants » dans Mes affaires / Toutes les affaires (p. 34, pour cohérence)
Colonnes : `Rôle` · `Entité` · `Responsable` · `Domaine spécialisé` · `Fonction` · `CFC` · `Notes`. Panneau inférieur « fiche » : `Entité` à gauche, `Responsable` à droite (Téléphone, Tél. mobile, Courriel…), bouton `i`.
Menus : `Nouvel intervenant`, `Intervenant`, `Copier l'intervenant`, `Afficher l'entité`, `Afficher le responsable`, `Courriel` ; documents : `Liste d'adresses`, `Liste d'adresses par CFC`, `Liste par rôle et CFC`, `Etiquettes` ; tri `Groupés par rôles` / `Groupés par CFC`.

---

## 4. Navigation « Mes affaires » / « Toutes les affaires »

Disposition en 3 colonnes : **`Numéro | Affaire`** (liste) → **`Domaine d'affaire`** → **contenu du domaine**.
- `Mes affaires` : affaires au statut `En cours` (2) où l'utilisateur est intervenant au rôle `Collaborateurs` (12).
- `Toutes les affaires` : statuts En cours, En attente, Terminée (non archivées).
- Liste des domaines (ordre de la capture p34 ; libellés `MenuTableModel`) :
  `Intervenants` · `Soumissionnaires` · `Liste d'adresses` · `Documents` · `Messages brefs` · `Séances` · `Notes` · `Tâches` · `Frais` · `Offres d'honoraires` (affiché « Calcul des honoraires » dans la version du manuel) · `Contrats honoraires` · `Avancement des prestations` · `Factures` · `Liste des plans` · `Liste de distribution` · `Devis général` · `Soumission` · `Contrôle des coûts` · (+ `Fichiers`, `Planification RH`, `Analyse de planification RH`, `Calcul des coûts` selon licence).
- Pour DeltaSub (périmètre de cette partie) : implémenter au minimum `Intervenants`, `Séances`, `Frais`, `Liste des plans` ; les autres domaines relèvent des autres parties du cahier des charges.

---

## 5. Configuration pour la saisie des heures (p. 26)

### 5.1 « Configurer les activités » (capture p26_249)
Trois panneaux côte à côte, chacun avec sa barre d'outils :

| Panneau | Barre | Colonnes | Source |
|---|---|---|---|
| Groupes | `+▾` (`Ajouter un groupe d'activités` / `Importer du dossier standard` / `Importer d'une affaire existante`), crayon, `−`, `⤒ ↑ ↓ ⤓` ; roue ▾ en bas | `Groupe d'activités` · `Prévision …` (CHF) · `Prévision …` (h) | `PROJECTACTIVITYGROUP` (NAMEFR, TIMEAMOUNTBUDGET, TIMEBUDGET, SORTORDER) |
| Activités du groupe sélectionné | `+`, crayon, `−`, `⤒ ↑ ↓ ⤓` ; roue ▾ en bas | `Activité` · `Prévision du travail` (CHF) · `Prévision du travail` (h) · `Tarif` | `PROJECTACTIVITY` (NAMEFR, TIMEAMOUNTBUDGET, TIMEBUDGET, PROJECTRATEGROUP_ID) |
| Collaborateurs autorisés pour l'activité sélectionnée | `+` (`Ajouter un collaborateur`), `−` (`Supprimer un collaborateur`) | `Collaborateur` | `PROJECTACTIVITY_STAFF(PROJECTACTIVITY_ID, STAFFS_ID)` |

Menus roue : `Attribuer toutes les activités à un collaborateur`, `Attribuer tous les groupes d'activités à un collaborateur`, `Vérification` (contrôle des sommes des prévisions).
Import : « Importer les activités ainsi que les tarifs de facturation » → options `Importer les activités ainsi que les tarifs de facturation.` / `Importer seulement les activités.` / `Importer seulement les tarifs de facturation.` ; avertissement « Les activités et/ou les tarifs de facturation précédents seront remplacés. » ; refus si heures déjà saisies ou statut ≠ Configuration.
Bouton `Fermer`.

Règles :
- Seuls les collaborateurs attribués à une activité la voient dans la saisie des heures.
- Suppression d'une activité/groupe ayant des heures : « Des heures sont déjà comptabilisées sur cette activité. Elle ne peut pas être effacée. »

### 5.2 « Nouvelle activité » / « Editer l'activité » (capture p26_253)
| Libellé | Contrôle | Source |
|---|---|---|
| `Deutsch` / `Français` / `Italiano` / `English` | 4 champs texte | `NAMEGE`, `NAMEFR`, `NAMEIT`, `NAMEEN` |
| `Type d'activité` | liste déroulante (§5.4) | `TYPECODE` |
| `Tarif` | liste des tarifs de l'affaire (vide possible) | `PROJECTRATEGROUP_ID` |
| **Temps prévu** : `Honoraires` | CHF + h | `TIMEAMOUNTBUDGET`, `TIMEBUDGET` |

« Nouveau groupe d'activités » / « Editer le groupe d'activités » : 4 langues + `Prévision` (CHF, h).

### 5.3 « Attribuer les activités aux collaborateurs »
Vue inverse (par collaborateur) : `Ajouter des activités`, `Ajouter toutes les activités`, `Supprimer des activités`, `Supprimer toutes les activités`.

### 5.4 Types d'activité — `ACTIVITY.TYPECODE` / `PROJECTACTIVITY.TYPECODE`
(énumération `Activity$Type`, catégories `Activity$Category`)

| Code | Libellé FR | Catégorie (reporting) |
|---|---|---|
| 0 | `Affaires` | Heures facturables |
| 1 | `Etudes` | Heures facturables |
| 50 | `Travaux de bureau` | Heures non facturables |
| 51 | `Formation continue` | Heures non facturables |
| 52 | `Direction` | Heures non facturables |
| 53 | `Concours` | Heures non facturables |
| 54 | `Acquisition` | Heures non facturables |
| 55 | `Conseil d'administration` | Heures non facturables |
| 90 | `Absences justifiées (mariage, naissance, …)` | Heures d'absences |
| 91 | `Maladie, accident, maternité` | Heures d'absences |
| 92 | `Militaire, service civil` | Heures d'absences |
| 93 | `Formation, apprentis` | Heures d'absences |
| (ISHOLIDAY) | `Vacances` | ligne séparée |

Libellés de catégories : `Heures facturables` · `Heures non facturables` · `Heures d'absences`.
Données réelles : 378/390 activités d'affaire en type 0 ; les types 50/54/90–93 ne sont utilisés que dans l'affaire interne « bureau ».

### 5.5 Tableau de reporting par type d'activité (capture p26_257, module Management/Reporting — pour mémoire)
Tableau : `Type d'activité` puis pour chaque année (décroissante) deux colonnes `AAAA` et `+/-`. Lignes : types 0–1, sous-total gras sur fond gris `Heures facturables` ; types 50–55, sous-total `Heures non facturables` ; types 90–93, sous-total `Heures d'absences`. Graphique « Total général », ordonnée `Heures [h]`, choix `Années` : `Courbes` / `Barres` / `Barres empilées` ; séries `Heures facturables`, `Heures non facturables`, `Heures d'absences`, `Vacances`, `Total général`.

### 5.6 « Configurer les tarifs de facturation »
- Liste des niveaux (`Nouveau tarif`, `Editer le groupe de tarifs`) → `PROJECTRATEGROUP` (NAMEFR…, SORTORDER, PROJECT_ID).
- Pour chaque niveau, historique de taux (« Nouveau tarif de facturation » : `Tarif de facturation`, `Valable dès le`) → `PROJECTRATE(RATE, VALIDFROM, PROJECTRATEGROUP_ID)`.
- Colonnes : `Niveau de tarification` · `Tarif horaire` · `Valable dès le`.
- `Importer du dossier standard` (table `RATE`) / `Importer d'une affaire existante`.
- Le taux applicable à une heure = taux du niveau de l'activité valable à la date de l'heure **(déduit)**.
- Coût de revient (« Coût de revient horaire ») = `STAFFRATE(RATE, VALIDFROM, STAFF_ID)` — taux interne par collaborateur.

### 5.7 « Configurer les phases » (p. 27, captures p27_264, p27_268)
Deux panneaux :
- **Phases** : barre `+` · crayon · `−` · ↻ (`Insérer les phases et phases partielles standards`). Colonnes `Nr.` · `Phase` · `Budget CHF` · `Budget h` · `Budget NK CHF` → `PROJECTPHASE(NUMBER, NAMEFR, TIMEAMOUNTBUDGET, TIMEBUDGET, COSTBUDGET)`.
- **Phases partielles** de la phase sélectionnée : `+` · crayon · `−`. Colonnes `Nr.` · `Phase partielle` (capture en allemand « Teilphase ») · `Budget CHF` · `Budget h` · `Budget NK CHF` → `PROJECTSUBPHASE(NUMBER, NAMEFR, TIMEAMOUNTBUDGET, TIMEBUDGET, COSTBUDGET, PROJECTPHASE_ID)`.
- Autres commandes : `Importer du dossier standard`, `Importer d'une affaire existante`, `Vérification` ; `Fermer`.
- Règle : le budget d'une phase = somme de ses phases partielles quand il y en a (capture : 3 = 31 + 32 + 33) **(déduit)**.

« Editer la phase » / « Editer la phase partielle » :
| Libellé | Source |
|---|---|
| `Numéro` | NUMBER |
| `Deutsch` / `Français` / `Italiano` / `English` | NAMEGE/FR/IT/EN |
| **Budget** — `Honoraires` : CHF + h | TIMEAMOUNTBUDGET, TIMEBUDGET |
| `Prévision des frais` : CHF | COSTBUDGET |
| (phase partielle seulement) case `Verrouillé` — info « Saisies des heures et des frais sont vérrouillées. » | `PROJECTSUBPHASE.ISTERMINATED` |

Usage : pour un contrat SIA calculé sur le coût de l'ouvrage, saisir par phase et phase partielle les honoraires, les heures prévues et les frais.

### 5.8 « Configurer les séances » (genres de procès-verbaux)
Fenêtre « Configurer les genres de procès-verbaux » : liste + `Nouveau genre de procès-verbaux`, `Editer le genre de procès-verbaux`, `Effacer le genre de procès-verbaux`, `Insérer les genres de procès-verbaux standards`, `Importer du dossier standard`, `Importer d'une affaire existante`. Édition « Nouveau genre de discussion » : 4 langues.
→ `PROJECTMEETINGTYPE(NAMEFR…, SORTORDER, PROJECT_ID)` ; standards = `MEETINGTYPE` (§13.7).
Colonnes de la liste des séances (domaine « Séances ») : `Date` · `Du` · `au` · `Genre` · `Titre` · `Lieu` · `Animation` · `Participants` · `Brouillon`.

### 5.9 « Configurer les frais »
Deux panneaux : `Groupe de frais` | `Genre de frais`. Colonnes genres : `Genre de frais` · `Unité` · `Prix` · `Prix à facturer` · `Prévision …`.
Édition genre : 4 langues + `Unité`, `Prix`, `Prix à facturer`, **Budget** `Prévision`. Édition groupe : 4 langues + `Prévision`.
→ `PROJECTCOSTCATEGORYGROUP(NAMEFR…, BUDGET, SORTORDER, PROJECT_ID)`, `PROJECTCOSTCATEGORY(NAMEFR…, UNIT, UNITPRICE, EXTERNALUNITPRICE, BUDGET, SORTORDER, PROJECTCOSTCATEGORYGROUP_ID)`. Standards : `COSTCATEGORYGROUP` / `COSTCATEGORY` (§13.5). Import : `Importer les frais standards d'une affaire`, `Importer du dossier standard`.

---

## 6. Liste des plans — nomenclature (p. 27–28, captures p27_272, p28_279)

### 6.1 « Editer la nomenclature des plans »
Deux panneaux :
- **Gauche** — barre `+▾` (`Nouvelle règle`, `Définition du numéro de plan`, `Définition du numéro de plan d'une autre affaire`) · crayon (`Modifier règle`) · `−` (`Effacer règle`) · `⤒ ↑ ↓ ⤓`. Colonnes `Type` · `Nom` · `Activé` (✔).
- **Droite** — valeurs de la règle sélectionnée : `+` (`Nouvelle inscription`) · crayon · `−` · `⤒ ↑ ↓ ⤓`. Colonnes `Code` · `Description` (ex. A Avant-projet, C1 Concours, C2 Conception, D1 Définition du projet, D2 Demande de permis de construire, E Etudes, L Listes des plans, P Projet, R Révision, T Transferts — valeurs de démonstration).
- L'ordre des règles = ordre des segments du numéro de plan.

### 6.2 « Nouveau type de plans » / « Editer le type de plans »
| Libellé | Source `PROJECTPLANRULE` |
|---|---|
| `Type` (liste §6.3) | TYPECODE |
| `Nom` | CUSTOMNAME (pour les types personnalisés) |
| case `Intégrer dans la nomenclature` | ISENABLED |
| `Séparateur devant` | PREFIXSTRING (≤16) |
| `Nombre de caractères` | NOFCHARACTERS |
| `Remplissage` + case `Rempli à gauche` | FILLCHARACTER (≤4), ISLEFTFILLED |
| `Séparateur après` | POSTFIXSTRING |

Valeurs propres : `PROJECTPLANRULEVALUE` (Code, Description).

### 6.3 Types de règles — `PROJECTPLANRULE.TYPECODE`
| Code | Libellé | | Code | Libellé |
|---|---|---|---|---|
| 0 | Groupe du plan | | 9 | Intervenants (rôles) |
| 1 | Type de plans | | 10 | Profil |
| 2 | Numéro d'affaire | | 11 | Echelle |
| 3 | Numéro d'affaire externe | | 12 | Format |
| 4 | Ouvrage | | 13 | Niveau |
| 5 | Localisation | | 14 | Représentation |
| 6 | Phase | | 15 | Plan ID |
| 7 | Phase partielle | | 100–104 | Type personnalisé 1 à 5 |
| 8 | CFC | | | |
(+ libellé `Auteur du fichier` présent dans les chaînes.)
Données : 10 affaires ont une nomenclature, toutes activées, sans séparateurs.

### 6.4 « Configurer les types de plans »
Groupes de plans (`Code`, 4 langues) et types de plans (`Code`, 4 langues) : `Ajouter un groupe de plans`, `Ajouter un type de plans`, `Editer…`, `Effacer…`, imports. → `PROJECTPLANGROUP`, `PROJECTPLANTYPE` ; standards `PLANGROUP` (A/B/C = dossiers projet définitif / plans d'exécution / plans de détail) et `PLANTYPE`.

---

## 7. Subdivisions — ouvrages et localisations (p. 28, captures p28_283, p28_287)

### 7.1 Liste « Editer les ouvrages et localisations »
Barre `+` · crayon · `−` · `⤒ ↑ ↓ ⤓`. Colonnes :
`Ouvrage` (= « Code Désignation | Désignation Loc. ») · `Maître d'ouvrage` · `Prévision honor. CHF` · `Prévision honor. h` · `Prévision frais CHF`. Bouton `Fermer`.

### 7.2 Fiche « Nouvel ouvrage » / « Editer les ouvrages et localisations »
| Groupe | Libellé | Source `SUBPROJECT` |
|---|---|---|
| **Ouvrage** | `Code Ouvrage` | CODE (≤16) |
| | `Désignation Ouv.` | DESCRIPTION |
| | `Code Localisation` | LOCATIONCODE (≤16) |
| | `Désignation Loc.` | LOCATIONDESCRIPTION |
| **Maître d'ouvrage** | bloc adresse multi-lignes + ◀ (choisir) + `i` | CONTACT_ID |
| **Temps prévu** | `Prévision honoraires` CHF + h | TIMEAMOUNTBUDGET, TIMEBUDGET |
| | `Prévision frais` CHF | COSTBUDGET |

Règles : ne renseigner le maître d'ouvrage que s'il diffère par subdivision ; suppression refusée si des données existent (« Des documents, des heures ou des frais ont déjà été saisis dans cette subdivision. Suppression impossible. »). Déconseillé si non nécessaire (30 ouvrages seulement dans toute la base).

---

## 8. Plan comptable (CFC…) (p. 28)
Fenêtre « Plans comptables » : `Créer un nouveau plan comptable CFC`, `Créer un nouveau plan comptable par éléments`, `Importer le plan comptable CFC du dossier standard`, `Importer le plan comptable CFC d'une autre affaire`, `Importer le nouveau plan comptable CFC online` (licence CRB), idem eCCC.
Fiche : `Nom`, `Titre`, `Type`, `Langue`, `Version`, `Licence disponible` ; positions : `Ajouter une position`, `Modifier la position`, `Effacer la position` (`Unité`).
→ `CATALOG`/`CATALOGPOS` (standards) et `PROJECTCATALOG`/`PROJECTCATALOGPOS` (77 336 positions). Utilisé par devis, soumissions et contrôle des coûts (autres parties).

---

## 9. Modèles et documents externes (p. 29, captures p29_294, p29_298)

### 9.1 « Définir les modèles »
Trois sections séparées par des filets :
1. **Modèles des documents** — « Choix du groupe de modèles pour cette affaire. » — `Groupe` (liste, ex. « Modèle d'affaire ») → `PROJECT.DOCTEMPLATEGROUPNAME`.
2. **Modèles des formulaires** — même texte — `Groupe` (ex. « DELTA ») → `PROJECT.TEMPLATEGROUPNAME`.
3. **Modèles externes (doc. types Word, LibreOffice...)** — « Choix des groupes de modèles externes. » — tableau `Groupe de modèles ext…` · `Remarque` · (icône lien) · `Emplacement` ; barre `+` · crayon · `−` · `⤒ ↑ ↓ ⤓` → `PROJECTTEMPLATEGROUP(TEMPLATEGROUP_ID, NOTE, SORTORDER, PROJECT_ID)` ; `TEMPLATEGROUP(NAMEFR, DIRECTORYNAME)` = « Bureau »/Office, « Affaires »/Projects.
Boutons `Annuler` / `OK`.

### 9.2 « Dossier des documents externes »
- Section **Emplacement des fichiers liés à une affaire** — « Emplacement des fichiers liés, tels que image de l'affaire, annexes aux bons de paiement, etc. » — `Chemin du dossier de l'affaire` [champ] [◀ parcourir] → `PROJECT.PROJECTFOLDER`.
- Section **Emplacement du dossier DELTAprojectDocuments de cette affaire** — « Définissez le chemin pour accéder aux documents externes qui se trouvent dans DELTAprojectDocuments » — `Définir l'emplacement` :
  - (•) `DELTAprojectDocuments de cette affaire est un sous-dossier de Affaires` → `Dossier Affaire` (lecture seule, racine commune) + `DELTAprojectDocuments` (chemin relatif) [◀]
  - ( ) `DELTAprojectDocuments de cette affaire est ailleurs, il n'est pas un sous-dossier de Affaires` → `DELTAprojectDocuments` (chemin absolu) [◀]
  → `ISPATHTOPROJECTDOCUMENTSRELATIVE` (1 partout) + `PATHTOPROJECTDOCUMENTS`.
- Seuls les liens sont stockés, jamais les fichiers.
- Pour DeltaSub (navigateur) : stocker les chemins comme texte ; bouton « Afficher le dossier » = copier le chemin / lien `file://` (l'ouverture directe dépend du navigateur).

---

## 10. HEURES ▸ Saisie (p. 30, captures p30_305, p30_309)

### 10.1 Disposition
`arborescence modules | liste « Collaborateur » | agenda`.
- **Liste Collaborateur** : par défaut seulement l'utilisateur ; tous les collaborateurs autorisés si droit de saisie pour autrui.
- **Barre d'outils** (centrée) : bascule segmentée `Semaine` | `Mois` · ◆ `Aujourd'hui` · `«` `‹` « Semaine N » `›` `»` (sauts ±1 semaine / ±4 semaines **(déduit)**) · `‹` Année `›` · roue ▾.

### 10.2 Vue Semaine (agenda)
- **En-tête de colonnes** : cellule d'angle « `SS/AAAA` » + total semaine « `40.5 h` » ; puis 7 colonnes jour « `Mo, 15. Mai` » (en FR : `Lu, 15 mai` **à localiser**) avec total du jour « `8.0 h` » dessous. Samedi/dimanche grisés.
- **Axe vertical** : heures « 8:00, 9:00 … » ; grille au quart d'heure (unité de saisie = 15 min).
- **Bloc d'entrée** (rectangle pleine largeur de colonne, hauteur ∝ durée) :
  - bande de titre colorée : « `08:00 – 10:45, 2.75 h` » (début – fin, durée décimale) ;
  - corps : « `N° affaire: libellé` » en gras (ex. `22BHF: Nom affaire`) ; options : activité, phase, commentaire.
  - Option `Titre : afficher la durée` (défaut) / `Titre : afficher l'affaire`.
- **Couleurs d'état** :
  | État | Couleur | Condition |
  |---|---|---|
  | Saisi (nouveau) | bleu (titre bleu vif, corps bleu pâle) | `TIMELOGSTATECODE = 0` |
  | Approuvé | vert (titre vert vif, corps vert pâle) | `= 3` |
  | Refusé | rouge | `= 1` |
  | Corrigé | (bleu, à préciser) | `= 2` |
  | Vacances | orange | `ISHOLIDAY = 1` |
  | Non modifiable | bleu clair | date ≤ `STAFF.TIMELOGFREEZINGDATE` (`ISTIMELOGFROZEN`), phase partielle `Verrouillé`, ou entrée approuvée **(déduit)** |
  | Autres affaires (mode CTRL) | gris | |
- **Interactions** :
  - glisser dans une colonne → sélection d'une plage (arrondie au ¼ h) → ouvre « Editer l'inscription » ;
  - double-clic sur un bloc → édition ;
  - **ALT** + dessiner une nouvelle plage → copie du contenu du bloc sélectionné (même si la source est dans une autre semaine) ; message d'aide « Remarque « Copier » » ;
  - **CTRL** + clic sur un bloc → les heures des autres affaires s'affichent en gris ;
  - **ALT + CTRL** + clic dans un bloc : moitié gauche = fin −1 min, moitié droite = fin +1 min ;
  - clic droit : `Sélectionner les précédents`, `Marquer tout de cette affaire`, `Tout sélectionner`.
- **Menu roue (réglages personnels)** : `Afficher les activités` · `Afficher les phases` · `Afficher les commentaires` · `Afficher les arrêts de travail` · `Afficher les saisies d'heure des autres affaires` · `Titre : afficher l'affaire` / `Titre : afficher la durée` · `Taguer les samedis` · `Taguer les dimanches` · `Taguer les jours fériés` · `Agrandir` · `Taguer les heures -> la fin de semaine` · `Taguer les heures -> la sélection` · `Taguer les heures ->` (marquer ses entrées comme définitives → `STAFF.TIMELOGCOMPLETEDDATE`).

### 10.3 Vue Mois **(déduit des libellés, pas de capture)**
Tableau des inscriptions du mois : `Date` · `Début` · `Fin` · `Durée` · `Affaire` · `Groupe d'activités` · `Activité` · `Ouvrage` · `Phase` · `Phase partielle` · `Statut` (+ `Commentaire`), totaux par jour (`Total du jour`). Création via « Nouvelle saisie par mois » (champs `Jour`, `Heure` de–à, `Période`) avec boutons `OK & continuer` et `OK & jour suivant`.

### 10.4 Fenêtre « Editer l'inscription » (capture p30_309)
- Haut : boutons radio `Temps de travail` / `Vacances` (`ISHOLIDAY`). En mode Vacances, les listes affaire/activité sont désactivées (entrées vacances sans affaire ni activité dans les données).
- **Rangée 1** (3 listes) : `Num… | Affaire` (affaires visibles de l'utilisateur) · `Groupe d'activités` · `Activité` (filtrées par affaire puis groupe, et par collaborateur autorisé).
- **Rangée 2** (3 listes) : `Ouvrage` · `Phase` · `Phase partielle` (filtrées en cascade) ; sous chacune un bouton ✕ `Annuler la sélection`.
- `Commentaire` (texte une ligne).
- Champs de date/heure (en-tête, vue mois) : `Date`, `Heure`, `Période` ; `Statut` en lecture (`Saisi`, `Approuvé`, `Refusé`, `Corrigé`) ; `Afficher l'inscription` si non modifiable.
- `Annuler` / `OK`.
- **Validation** :
  - obligatoires : Affaire, Groupe d'activités, Activité ;
  - Phase (+ phase partielle si la phase en a) si `ISTIMEPHASEMANDATORY` ; Ouvrage si `ISTIMESUBPROJECTMANDATORY` ; Commentaire si `ISTIMEDESCMANDATORY` ;
  - phase partielle verrouillée interdite ;
  - suppression : « Voulez-vous vraiment supprimer cette inscription ? ».

### 10.5 Correspondance `TIMELOG` (37 622 lignes réelles)
| Donnée | Colonne | Remarques données réelles |
|---|---|---|
| Collaborateur | `STAFF_ID` | toujours rempli |
| Date | `TIMEYEAR`, `TIMEMONTH` (**0–11**), `TIMEDAY` | 2019–2026 ; saisies le week-end rares (~110) |
| Début | `TIMEHOUR1`, `TIMEMINUTE1` | minutes ∈ {0, 15, 30, 45} |
| Fin | `TIMEHOUR2`, `TIMEMINUTE2` | heure 24 possible |
| Durée | `TIMEPERIOD` (h décimales) | = fin − début, exact sur 100 % des lignes ; stocker quand même |
| Affaire | `PROJECT_ID` | vide pour les vacances |
| Groupe / Activité | `ACTIVITYGROUP_ID` → PROJECTACTIVITYGROUP, `ACTIVITY_ID` → PROJECTACTIVITY | cohérents à 100 % |
| Ouvrage | `SUBPROJECT_ID` | 659 lignes |
| Phase / Phase partielle | `PHASE_ID` → PROJECTPHASE, `SUBPHASE_ID` → PROJECTSUBPHASE | cohérents à 100 % |
| Commentaire | `DESCRIPTION` | 75 % rempli |
| Vacances | `ISHOLIDAY` | 789 lignes |
| État | `TIMELOGSTATECODE` | 0 = Saisi (37 432), 1 = Refusé, 2 = Corrigé, 3 = Approuvé (190) |
| Facturable | `ISCHARGEABLE` | 1 partout ; libellé `Facturable` (et commande « Insérer facteur ») |
| Facturé | `ISCHARGED` + `CHARGEDDATE` | 1 514 lignes facturées, toujours avec date |

Plusieurs entrées par jour et collaborateur (jusqu'à 23) — pas de fusion automatique ; chevauchements signalés à l'import (« Saisie de temps qui se chevauchent »).

### 10.6 Import d'heures (Gestion ▸ roue ▸ `Importer des heures`)
Assistant « Importer les heures » : fichier texte, `Séparateurs`, `Ignorer la première ligne à l'importation`, `Langue des activités`. Colonnes : `Ligne` · `Collaborateur` · `Jour` · `Heure` (de) · `Heure` (à) · `Groupe d'activités` · `Activité` · `Ouvrage` · `Phase` · `Phase partielle` · `Commentaire` · `Vacances` · `Facturable` · `Facturé` · `Info`. Contrôles : « Format d'heure pas valide », « A doit être supérieur à de », « Saisie de temps qui se chevauchent », « pas trouvé ou pas attribué à l'affaire », « Pas de droit pour cette actitvité », « Saisie trop longue. » ; résumé « Données vérifiées: N erreurs. » ; option de purge des heures existantes de l'affaire.

---

## 11. HEURES ▸ Rapport
Rapports personnels uniquement (analyses par affaire → Controlling).
- Menu `Rapport` : `Rapport hebdomadaire` · `Rapport mensuel` · `Rapport trimestriel` · `Rapport semestriel` · `Rapport annuel` · `Journal mensuel` ; `Aperçu des vacances` / `Rapport des vacances` ; `Récapitulatif` ; options `Toutes les colonnes`, `Détails du rapport`.
- Colonnes du tableau de synthèse : `Période` · `Heures prévues` · `Heures effectives` · `Différence` · `Solde cumulé` · `Vacances saisies` · `Heures d'appoint prévues` · `Heures d'appoint` · `Heures d'appoint prévues cumulées`. Lignes : mois, `1er trimestre`… `4ème trimestre`, `1er semestre`/`2ème semestre`, `Total`, `Report des heures supplémentaires`, `Total incl. report des heures suppl.`.
- Bas de rapport : `Droit aux vacances annuel`, `Vacances saisies du collaborateur dans le mois`, `… dans l'année de report`, `Nouveau solde à reporter`, `Date de la dernière mise à jour du droit aux vacances`.
- Journal : `Date` · `N° d'affaire` · `Affaire` · `Complément` · `Groupe d'activités` · `Activité` · `Ouvrage` · `Phase` · `Phase partielle` · `Début` · `Fin` · `Durée [h]` · `Arrêt de travail [h]` · `Commentaire` ; `Total du jour`.
- Paramètres d'impression : critères (`Numéro d'affaire` avec opérateurs, `Date` … `jusqu'à`, `Activités`, `Phases`), `Répartition des colonnes`, `Titre du document`, `Modèle`, `Taille de police`, `Taille de police des détails`, `Détails en italique`, `Interligne`, `Avec page de garde`, `Avec fond alterné`, favoris (`Ajouter à la liste des favoris` / `Retirer…`).
- Données : heures prévues = `TARGETTIME` (modèle annuel, `TARGETHOURS0..11` par mois, DESCRIPTION « 100 % ») et `STAFFTARGETTIME` (par collaborateur : `TARGETHOURS0..11`, `OVERTIME0..11`, `TARGETTIMEREDUCTION` = report d'heures sup.) ; vacances = `STAFF.HOLIDAYS`, `HOLIDAYBALANCE`, `HOLIDAYBALANCEYEAR` ; jours fériés = `PUBLICHOLIDAY` (§13.8) ; disponibilité mensuelle = `STAFFPROJECTTIME` (`TIMEBUDGET` Disponibilité, `HOLIDAY` Vacances, `INTERNALTIME` Travail interne, `EDUCATION` Formation, `OFFICIALABSENCE` Militaire, service civil, `OTHERABSENCE` Autres absences, `DEVIATION` Déduction sur les heures prévues, `REMARK`).

---

## 12. NOTES DE FRAIS (p. 31, captures p31_316, p31_320)

### 12.1 Saisie — disposition
`modules | liste « Collaborateur » | tableau des frais du mois`.
Barre : `+` · [copier ▾ : `Dupliquer`, `Dupliquer dans le mois prochain`] · crayon · `−` · `‹` [Mois ▾] `›` · `‹` Année `›`. (Pour un contrôleur : `Approuver`, `Refuser`, `Réinitialiser`.)
Colonnes (ordre de la capture, libellés `ProjectCostTableModel`) :
`Date` · `Groupe de frais` · `Genre de frais` · `N° pièce` · `Quantité` · `Unité` · `Montant` · `Monnaie` · `Désignation` · `Statut` · `Facturable` · `Facturé` · `Affaire` (N°) · `Ouvrage`.
Colonnes disponibles en plus : `Prix`, `Remboursable`, `Ristourné`, `Phase`, `Phase partielle`, `Collaborateur`, `N° d'affaire`, `Complément`, `Tarif`.

### 12.2 Fenêtre « Nouveau » / « Edition » (capture p31_320)
- **Rangée haute** (3 listes) : `Numéro | Affaire` · `Groupe de frais` · `Genre de frais` (genres du groupe, configurés dans l'affaire).
- `Date` : `‹` [liste « jour, JJ mois AAAA (Semaine NN) »] `›`.
- `Quantité` [nombre] + unité du genre (ex. « Stk », « km »).
- `Prix` [nombre] + « CHF / unité » · case `Monnaie étrangère` [code devise] · `Cours` [nombre, défaut 1.0, grisé si non coché].
- `Montant` (calculé, lecture seule) = Quantité × Prix × Cours, affiché « 20.00 CHF ».
- `Désignation` (texte ; obligatoire si `ISEXPENSESDESCMANDATORY`).
- `N° de la pièce` · `Taux TVA` · case `Remboursable`.
- **Rangée basse** : `Ouvrage` · `Phase` · `Phase partielle`, chacune avec ✕ `Annuler la sélection` (phase obligatoire si `ISEXPENSESPHASEMANDATORY`).
- `Annuler` / `OK`.
- Forfait : quantité 1, unité « gl ». Montants toujours dans la monnaie de l'affaire.

### 12.3 Correspondance `PROJECTCOST` (635 lignes)
| Champ | Colonne | Données réelles |
|---|---|---|
| Affaire | `PROJECT_ID` | toujours |
| Collaborateur | `STAFF_ID` | 525 (vide = frais saisi directement dans l'affaire) |
| Date | `DATEYEAR`, `DATEMONTH` (0–11), `DATEDAY` | |
| Groupe / Genre | `COSTCATEGORYGROUP_ID` → PROJECTCOSTCATEGORYGROUP, `COSTCATEGORY_ID` → PROJECTCOSTCATEGORY | |
| Quantité / Unité / Prix | `QUANTITY`, `UNIT`, `UNITPRICE` | km 460 lignes (0.70 CHF/km) |
| Devise / cours | `FOREIGNCURRENCYCODE`, `FOREIGNCURRENCYRATE` | jamais utilisé (1.0) |
| Facteur externe | `EXTERNALRATE` | 1.0 partout |
| TVA | `VATRATE` | 0.0 / 7.7 / 8.1 |
| N° pièce | `DOCUMENTNUMBER` | jamais utilisé |
| Désignation | `DESCRIPTION` | |
| Remboursable / remboursé | `ISREFUNDABLE`, `ISREFUNDED` (« Ristourné ») | |
| Facturable / facturé | `ISCHARGEABLE`, `ISCHARGED`, `CHARGEDDATE` | |
| État | `PROJECTCOSTSTATECODE` | 0 Saisi · 1 Refusé · 2 Corrigé · 3 Approuvé |
| Ouvrage / Phase / Phase partielle | `SUBPROJECT_ID`, `PHASE_ID`, `SUBPHASE_ID` | |

### 12.4 Rapport
Périodes : `Semaine`, `Mois`, `1ère trimestre`…`4ème trimestre`, `1ère semestre`/`2ème semestre`, `Année` (rapports hebdomadaire, mensuel, trimestriel, semestriel, annuel). Colonnes : `Date` · `Affaire` · `Ouvrage` · `Groupe de frais` · `Genre de frais` · `Quantité` · `Unité` · `Prix` · `Montant` · `Monnaie` · `Remarque`. Totaux : `Total`, `Tatal facturable` (sic), `Total remboursable`. Options : `Additionner les totaux par affaire`, mise en page identique aux heures.

---

## 13. CONTROLLING (p. 32–33, captures p32_325, p32_329, p33_336)

### 13.1 Page d'accueil Controlling (domaine Affaires)
Quatre cartes/actions (titre + description) par affaire sélectionnée :
| Titre | Description |
|---|---|
| `Contrôle des heures d'affaires` | « Vérifier et valider les saisies d'heures » |
| `Critères d'analyse des heures` | « Analyser les heures par collaborateur, activité et phase. Créer les rapports horaires et les pièces jointes à la facture. » |
| `Contrôle des frais` | « Vérifier et valider les frais » |
| `Critères d'analyse des frais` | « Analyser les frais par collaborateur, groupe de frais et frais. Créer les rapports et les pièces jointes à la facture. » |
(+ `Récapitulatif`, `Récapitulatif des collaborateurs`.)

### 13.2 « Contrôle des heures » (capture p32_325)
- Gauche : liste `Collaborateur` (intervenants collaborateurs de l'affaire).
- Droite : même agenda semaine qu'en §10.2 (barre ◆ `Aujourd'hui`, semaines, année, roue), ne montrant que les heures de l'affaire.
- Clic droit sur un ou plusieurs blocs : **`Approuver`** · **`Refuser`** · **`Réinitialiser`** · séparateur · **`Tout sélectionner`** (+ `Sélectionner les précédents`, `Marquer tout de cette affaire`).
- Effets : Approuver → état 3 (vert, non modifiable par le collaborateur) ; Refuser → état 1 (rouge) ; Réinitialiser → état 0 (bleu).
- Variante tableau (« Contrôle ») : `Valider l'inscription`, `Refuser l'inscription`, `Insérer facteur`, filtre `Comptabilisé` Oui/Non, `Filtre par date`, `Document`, `Document des collaborateurs`.

### 13.3 « Critères d'analyse des heures » (capture p32_329)
**Zone 1 — six listes de filtre** (multi-sélection, chacune avec ✕ `Annuler la sélection` dessous) :
| Liste | Colonnes |
|---|---|
| Ouvrage | `Ouvrage` · `Prévision` CHF · `Prévision` h |
| Groupe d'activités | `Groupe d'activités` · `Prévision` CHF · `Prévision` h |
| Activité | `Activité` · `Prévision` CHF · `Prévision` h |
| Phase | `Phase` · `Prévision` CHF · `Prévision` h |
| Phase partielle | `Phase partielle` · `Prévision` CHF · `Prévision` h |
| Collaborateur | `Collaborateur` |

**Zone 2 — filtres** :
- case `Filtre par dates` ; radio A = `‹` [Mois ▾] `›` `‹` Année `›` ; radio B = [date] 📅 `à` [date] 📅.
- case `Facturable` + radios `Non` / `Oui` ; case `Facturé` + radios `Non` / `Oui`.
- boutons `Réinitialiser le filtre` · `Appliquer le filtre`.

**Zone 3 — tableau** : `Date` · `Début` · `Fin` · `Durée` · `Statut` · `Facturable` (✔/✕) · `Facturé` (✔/✕) · `Personne` · `Groupe d'activités` · `Activité` · `Ouvrage` · `Phase` · `Phase partielle` · `Commentaire`. (Colonnes additionnelles : `Tarif`, `Montant`, `Contrat`.)

**Pied** : roue ▾ · document ▾ · « `Total 1'375.50 h / CHF 178'815.00 / CHF 154'781.25` » = heures / `Honoraires` (au tarif de facturation) / `Coûts salariaux des employés` (au coût de revient `STAFFRATE`) · compteur « N positions de M » · `Fermer`.
- Roue ▾ : `Modifier le statut "Facturable"` (→ « Editer la sélection » : `Facturable` / `Non facturable`) · `Modifier le statut "Facturé" et transférer en facturation` (→ `Facturé`/`Non facturé`, `Date`, `Transférer en facturation` : `Nouvelle position de facture`, `… par activité`, `… par groupe d'activités`, `… par phase`, `… par phase partielle`, `… par collaborateur`) · `Modifier le commentaire` · `Grouper` / `Grouper les positions sélectionnées` · `Afficher le rapport` / `… pour les positions sélectionnées`.
- Document ▾ : `Etablir le document d'analyse …` · `Etablir le document d'analyse des collaborateurs …`.
- Messages : « Certaines positions ne sont pas cochées "facturable". », « Toutes les positions facturables sont déjà choisies. », « Cette activité a différents tarifs. ».
- L'impression reprend exactement les lignes filtrées.
- Transfert en facturation : nécessite une facture préparée (module Factures, autre partie) ; met `ISCHARGED = 1` et `CHARGEDDATE`.

**Composer le rapport** (« Rapport d'heures ») : `Tri selon affichage`, `Tri par activité avec sous-total`, `Tri par collaborateur avec sous-total`, `Tri par phase partielle avec sous-total` ; `Récapitulatif par collaborateur` ; `Totaux par mois` / `par trimestre` / `par semestre` / `par année`. Totaux imprimés : `Total heures`, `Total facturable`, `Total frais des collaborateurs`.

**Grouper les heures de l'affaire** (récapitulatif) — regroupements : `Activités`, `Activités avec phases`, `Phases`, `Phases et activités`, `Ouvrage`, `Ouvrage avec activités`, `Ouvrages avec phases`, `Collaborateur`, `Personnalisé`. Colonnes : `Désignation` · `Heures prévues` · `Durée [h]` · `Budget-Durée [h]` · `Tarif` · `Honoraires` · `Honoraires prévus` · `Honoraires prévus-Honoraires` · `Taux horaire du collaborateur` · `Frais des collaborateurs` · `Honoraires-Coûts des collaborateurs`. Lignes sans affectation : `Pas d'ouvrage`, `Pas de phase`, `Pas de phase partielle`.

### 13.4 « Critères d'analyse des frais » (capture p33_336)
Même structure que 13.3 :
- Listes : `Ouvrage | Prévision frais` · `Groupe de frais | Prévision` · `Genre de frais | Prévision` · `Phase | Prévision frais` · `Phase partielle | Prévision frais` · `Collaborateur`.
- Mêmes filtres date / Facturable / Facturé, `Réinitialiser le filtre`, `Appliquer le filtre`.
- Tableau : `Date` · `Groupe de frais` · `Genre de frais` · `N° pièce` · `Quantité` · `Unité` · `Montant` · `Monnaie` · `Désignation` · `Statut` · `Facturable` · `Facturé` · `Collaborateur` · `Ouvrage` · `Phase` · `Phase partielle`.
- Pied : roue ▾, document ▾, « `Total CHF 611.00` », `Fermer`.
- Transfert : `Nouvelle position de facture`, `… par genre de frais`, `… par phase`, `… par phase partielle`.
- Rapport : `Rapport de frais` — `Tri selon affichage`, `Trié par groupe de frais avec sous-total`, `Tri par collaborateur avec sous-total`, `Tri par phase partielle avec sous-total`. Groupement : `Genre de frais`, `Genre de frais et phases`, `Phases`, `Phases et frais`, `Ouvrage`, `Ouvrage et frais`, `Ouvrages et phases`, `Collaborateur` ; colonnes `Désignation`, `Prévision`, `Coûts`/`Frais`, `Prévision - Frais`.
- « Contrôle des frais » : `Valider l'inscription`, `Refuser l'inscription`, filtre `Comptabilisé`.

---

## 14. Listes de référence (données réelles, non personnelles)

### 14.1 Phases SIA standard — `PHASE` (dossier standard)
Numérotation adaptée par le bureau (0–8) ; la colonne « SIA 112 » donne le rattachement officiel.

| NUMBER | Phase (FR) | DE | SIA 112 |
|---|---|---|---|
| 0 | Concours | — | (hors SIA) |
| 1 | Relevé et recherche de documentations | — | (spécifique bureau) |
| 2 | Faisabilité | — | (spécifique bureau) |
| 3 | Etude du projet | Projektierung | 3 |
| 4 | Appel d'offres | Ausschreibung | 4 |
| 5 | Réalisation | Realisierung | 5 |
| 6 | Exploitation | Bewirtschaftung | 6 |
| 7 | Définition des objectifs | Strategische Planung | 1 |
| 8 | Etudes préliminaires | Vorstudien | 2 |

### 14.2 Phases partielles standard — `SUBPHASE`
| N° | Phase partielle (FR) | Phase |
|---|---|---|
| 11 | Enoncé des besoins, approche méthodologique | Définition des objectifs |
| 21 | Définition de l'objet, étude de faisabilité | Etudes préliminaires |
| 22 | Procédure de choix de mandataires | Etudes préliminaires |
| 31 | Avant-projet | Etude du projet |
| 32 | Projet de l'ouvrage | Etude du projet |
| 33 | Procédure de demande d'autorisation | Etude du projet |
| 41 | Appel et comparaisons des offres, propositions d'adjudication | Appel d'offres |
| 51 | Projet d'exécution | Réalisation |
| 52 | Exécution de l'ouvrage | Réalisation |
| 53 | Mise en service, achèvement | Réalisation |
| 61 | Fonctionnement | Exploitation |
| 62 | Maintenance | Exploitation |

Configuration type réellement utilisée dans les affaires (`PROJECTPHASE` / `PROJECTSUBPHASE`, fréquences sur 111 affaires) :
0 Concours (14) · 1 Relevé et recherche de documentations (38) · 2 Faisabilité (62) · 3 Etude du projet (70 : 31/32/33) · 4 Appel d'offres (67 : 41) · 5 Réalisation (67 : 51/52/53) · 6 Exploitation (17 : 61/62) · 7 Définition des objectifs (10 : 11) · 8 Etudes préliminaires (8 : 21/22). Des phases libres existent (« Expertise », « Phase 1…4 », « Hors prestations »…) : le numéro de phase n'est donc **pas** une clé fixe.

### 14.3 Groupes d'activités et activités
**Dossier standard** (`ACTIVITYGROUP` / `ACTIVITY`, tous de type 0 « Affaires ») :
| Groupe | Activités (ordre) |
|---|---|
| Entretien | avec les autorités · avec le maître de l'ouvrage · avec les mandataires spécialisés · avec l'entreprise |
| Séance | avec le maître de l'ouvrage · avec les autorités · avec les mandataires spécialisés · avec l'entreprise |
| Planification | Projet · Préparation de l'exécution · Travail de création |
| Secrétariat | Travaux de secrétariat · Envoi · Achats |
| Exécution | Dossier d'appel d'offres · Envoi d'appels d'offres · Comparaison des offres · Négociation d'adjudication · Contrat d'entreprise · Saisie des métrés · Contrôle du coût · Comptabilisation des paiements · Planification des délais |
| Projet | Direction générale · Demande de permis de construire · Traitement des oppositions · Planification des délais · Documentation |
| Affaire | Projet · Secrétariat · Image de synthèse · Maquette |
(fautes de frappe des données d'origine corrigées : « madataires », « mâitre », « autoritéss »)

**Configuration réelle par affaire** (106 affaires sur 111) : un seul groupe `Affaire` avec `Projet`, `Maquette`, `Image de synthèse` (+ ponctuellement `Secrétariat`, `Heure hors bureau`, `Analyse`, `Expertise`, `DT`).
**Affaire interne « bureau »** : groupes `Absence justifiées + Maladie et accident` (Maladie [91], Maladie enfant [91], Accident [91], Mariage, naissance, déménagement, décès [90], Service militaire, service civil [92], Cours apprentissage [93], Formations continues collaborateurs [93]) ; `Divers activité bureau` (Informatique bureau [50], Tâche apprentis [50], Divers bureau [50], Prospection [54], Formation des apprentis et stagiaire par collaborateur [93], Pause - obligatoire 15 minutes [0]) ; `Admin` (Comptabilité, Facturation, Gestion collaborateurs, Divers).

### 14.4 Tarifs de facturation
Standard `RATE` (valable dès 01.01.2009) : Architecte en chef 210 · Architecte dirigeant 180 · Directeur général des travaux 180 · Architecte 135 · Directeur des travaux 155 · Technicien 132 · Personnel dirigeant de l'administration 132 · Dessinateur 110 · Adjoint au directeur des travaux 110 · Secrétariat 110 · Personnel auxiliaire 100.
**Grille réellement utilisée** (95 affaires, 5 niveaux) : Architecte dirigeant **150** · Architecte **135** · Directeur des travaux **120** · Dessinateur **100** · Secrétariat **90** CHF/h.

### 14.5 Frais standard (`COSTCATEGORYGROUP` / `COSTCATEGORY`)
| Groupe | Genres (unité, prix CHF) |
|---|---|
| Frais de déplacement | Kilomètres voiture privé (km, 0.70) · Billet · Kilomètres avec voiture Substances · Tickets de parking · Recharge à domicile (kWh, 0.30) |
| Frais de copie | A4 noir/blanc (p, 0.35) · A4 couleur (p, 1.30) · A3 noir/blanc (p, 0.65) · A3 couleur (p, 2.60) · Plotter noir /blanc (m2, 9.30) · Plotter couleur (m2, 13.95) · Poste · Dossier · Livres |
| Frais du bureau | Matériel informatique · Fourniture · Représentation |
| Frais admin | Frais de déplacement · Frais de stationnement · Frais de fourniture · Frais de matériel informatique · Frais de téléphonie · Frais de représentation · Frais web, literature, poste · Facture de fonctionnement |

### 14.6 Groupes et genres d'affaire (`PROJECTGROUP` / `PROJECTKIND`)
Groupes (ordre) : Habitat individuel · Habitat collectif · Maisons en terrasse · Habitations pour personnes âgées · Bâtiments scolaires · Entrepôts · Halles industrielles · Bâtiments hospitaliers · Bâtiments de bureaux · Hôtels · Bâtiments provisoires · Canalisations.
Genres (dans chaque groupe) : Nouvelle construction · Rénovation · Démolition · Transformation · Assainissement · Concours (Canalisations : Nouvelle construction, Assainissement, Démolition).

### 14.7 Genres de séances (`MEETINGTYPE`)
Séance avec les autorités · Séance avec le maître d'ouvrage · Séance de coordination · Séance de chantier · Séance de projet · Journal de chantier · Entretien de collaborateur · Information collaborateur.

### 14.8 Jours fériés (`PUBLICHOLIDAY`, `ISON` = actif)
Fixes (`TYPECODE` 0, `DATEMONTH` 0–11) : Nouvel an 1.1 ✔ · Saint Berchtold 2.1 ✔ · Fête du travail 1.5 · Fête nationale Suisse 1.8 ✔ · Assomption 15.8 · Lundi du jeune (stocké 22.9) ✔ · La Toussaint 1.11 · Noël 25.12 ✔ · Saint Etienne 26.12.
Mobiles (`TYPECODE` 1, `NOFDAYSEASTERSUNDAY` = décalage / Pâques) : Mercredi des Cendres −53 · Carnaval lundi −48 · Carnaval mercredi −46 · Vendredi Saint −2 ✔ · Pâques 0 ✔ · Lundi de Pâques +1 ✔ · Ascension +39 ✔ · Pentecôte +49 ✔ · Lundi de Pentecôte +50 ✔ · Fête-Dieu +60.
(Le Lundi du Jeûne fédéral est en réalité mobile — 3e lundi de septembre + 1 ; à calculer plutôt que stocker.)

### 14.9 Récapitulatif des codes
| Colonne | Valeurs |
|---|---|
| `PROJECT.PROJECTSTATECODE` | 1 Configuration · 2 En cours · 3 En attente · 4 Terminée · 5 Archivée |
| `TIMELOG.TIMELOGSTATECODE`, `PROJECTCOST.PROJECTCOSTSTATECODE` | 0 Saisi · 1 Refusé · 2 Corrigé · 3 Approuvé |
| `ISCHARGEABLE` | 1 Facturable · 0 Non facturable |
| `ISCHARGED` (+ `CHARGEDDATE`) | 1 Facturé · 0 Non facturé |
| `TIMELOG.ISHOLIDAY` | 1 Vacances · 0 Temps de travail |
| `PROJECTCOST.ISREFUNDABLE` / `ISREFUNDED` | Remboursable / Ristourné |
| `PROJECTSUBPHASE.ISTERMINATED` | 1 Verrouillé |
| `PROJECT.ISINTERNAL` | 1 Interne |
| `PROJECTMEMBER.TEAMROLECODE` | cf. §3.4 |
| `(PROJECT)ACTIVITY.TYPECODE` | cf. §5.4 |
| `PROJECTPLANRULE.TYPECODE` | cf. §6.3 |
| Mois (`TIMEMONTH`, `DATEMONTH`, `PUBLICHOLIDAY.DATEMONTH`, `TARGETHOURS0..11`) | 0 = janvier … 11 = décembre |

---

## 15. Priorités pour DeltaSub.html

**P1 — indispensable (remplacement quotidien)**
1. Liste Gestion des affaires (§1) + fiche affaire onglets `Affaire`, `Paramètres`, `Délais` (§2) avec statuts 1–5 et règle « Configuration = invisible ».
2. Configuration des phases / phases partielles avec budgets CHF/h/frais et bouton « phases standards » (§5.7, §14.1–14.2).
3. Configuration des activités à 3 panneaux + attribution des collaborateurs + tarifs de facturation (§5.1–5.6, grille 150/135/120/100/90).
4. Intervenants au minimum pour le rôle `Collaborateurs` (§3.1) — condition d'accès à la saisie.
5. **Saisie des heures en vue Semaine** (§10.2, §10.4) : glisser-créer au ¼ h, blocs « HH:MM – HH:MM, x.xx h » + « N°: libellé », couleurs d'état, totaux jour/semaine, copie ALT, validation des champs obligatoires.
6. Import des 37 622 `TIMELOG` et référentiels (mois 0–11 → 1–12 à la conversion).

**P2 — contrôle et facturation**
7. Contrôle des heures (Approuver / Refuser / Réinitialiser) (§13.2).
8. Critères d'analyse des heures : 6 filtres, filtre date, Facturable/Facturé, total h / honoraires / coût de revient, changement de statut « Facturé » et transfert vers les factures de Facturation.html (§13.3).
9. Notes de frais : saisie mensuelle + fenêtre d'édition (§12.1–12.2) et analyse des frais (§13.4).
10. Rapports personnels d'heures (hebdo/mensuel/annuel, solde, vacances) (§11).
11. Vue Mois de la saisie (§10.3), Mes affaires / Toutes les affaires (§4).

**P3 — confort / usage marginal au bureau**
12. Intervenants complets (tous rôles, groupes de rôles, listes d'adresses) (§3).
13. Subdivisions ouvrages/localisations (30 lignes seulement) (§7).
14. Genres d'affaire, onglets `Adresses` et `Références` (§2.2, 2.5, 2.6).
15. Types de séances (§5.8), configuration des frais par affaire (§5.9).
16. Nomenclature et types de plans (10 affaires) (§6), plan comptable CFC (§8), modèles et dossiers externes (§9), import d'heures CSV (§10.6), graphique de reporting par type d'activité (§5.5).

Points à vérifier sur une affaire test avant implémentation : ordre `CONTACT1..4` (§2.5), sens exact de « Corrigé » (état 2) et de la couleur « bleu clair », éventuelle sémantique « facteur » d'`ISCHARGEABLE` (commande « Insérer facteur »).

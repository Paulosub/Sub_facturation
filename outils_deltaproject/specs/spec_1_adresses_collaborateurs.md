# Spec 1 — Configuration, interface générale, Adresses, Collaborateurs

Cahier des charges d'interface pour **DeltaSub.html** : reproduction fidèle des modules
DELTAproject décrits aux pages 10 à 23 du manuel FR.

**Sources** : texte du manuel p.10-23 ; copies d'écran `shots/p12_*` à `p23_*` et pages
entières p14, p15, p20, p23 ; libellés FR exacts tirés de `Strings.db` (paquets
`deltaproject.addresses`, `.adr*`, `.employee`, `.admin`, `.user`, `.pref`, `.vCard`,
`db`, `db.admin`) ; schéma Derby réel (`out/schema.txt`) et statistiques sur les données
réelles (aucune donnée personnelle n'est recopiée ici).

**Conventions**
- Les libellés entre « » sont les libellés FR exacts de DELTAproject, à reprendre tels quels
  (y compris les petites incohérences d'origine, p. ex. « Press-papiers »).
- `TABLE.COLONNE` renvoie à la base Derby. Le suffixe *(déduit)* signale une
  correspondance déduite des données ou de l'ordre des énumérations, **à vérifier**.
- `^0`, `^1` = paramètres substitués dans le message.
- ▾ = bouton avec menu déroulant (petite flèche à droite de l'icône).

---

## 0. Vue d'ensemble

| Zone | Contenu | Pages |
|---|---|---|
| Configuration | Gestion des utilisateurs (utilisateurs, fonctions, jeux de privilèges), licences, paramètres système, préférences, Administrateur (propriétés, statuts, heures prévues, jours fériés) | 10-13 |
| Interface générale | Fenêtre principale, barre des modules, barre d'outils, icônes standard | 14-15 |
| Adresses | Entités, Liste des adresses, Mes favoris, Groupes d'adresses (intelligents / statiques), Propriétés, Chercher, import vCard | 16-21 |
| Collaborateurs | Liste, fiche, coût de revient, durée prévue, vacances, verrouillage des heures | 22-23 |

Modèle conceptuel central (à respecter strictement) :

```
CONTACTOWNER (= « Entité » : Société / Personne / Famille / Communauté / Association)
   └─ 1..n CONTACT (= « Adresse » : Adresse, Adresse postale, Livraison, Facturation, Autre)
          ├─ CONTACTOWNER_ID      → l'entité propriétaire de l'adresse
          ├─ CONTACTRELATION_ID   → « appartient à » : l'entité à laquelle l'adresse est liée
          │                          (p. ex. adresse professionnelle d'une personne dans une société)
          ├─ n..n PROPERTY        (via CONTACT_PROPERTY)
          ├─ 0..n CONTACTNOTE
          └─ n..n CONTACTGROUP    (groupes statiques, via CONTACTGROUP_CONTACT)
STAFF (collaborateur) → PERSON_ID, COMPANYCONTACT_ID, HOMECONTACT_ID (3 × CONTACT)
APPUSER (utilisateur) ↔ STAFF (APPUSER_STAFF) ; APPUSER ↔ APPCOMPANYROLE (fonction) ↔ APPROLE (jeu de privilèges)
```

Point clé : les **propriétés, notes, groupes, CFC, statut s'attachent à l'ADRESSE (CONTACT)**,
pas à l'entité. L'entité ne porte que l'identité (nom, prénom, IDE, AVS, anniversaire).

---

## 1. Interface générale (p.14-15, captures p16, p18, p19)

### 1.1 Fenêtre principale
- **Barre de titre** : « DELTAproject - » + nom de l'utilisateur connecté.
- **Bandeau d'en-tête** (fond blanc) : à gauche logo rond bleu + nom de la base (« DEMO »),
  à droite le logotype « DELTAproject ». Pour DeltaSub : logo/nom du bureau.
- **Barre des modules** (colonne gauche, fond gris clair, ~200 px) : arborescence à deux
  niveaux. Groupes en MAJUSCULES grasses avec triangle ▶/▼ ; sous-modules indentés ;
  l'élément actif a un fond gris plus foncé. Ordre des groupes : ADRESSES, AFFAIRES,
  COLLABORATEURS, NOTES DE FRAIS, HEURES, TÂCHES, FACTURES, BÂTIMENT, MANAGEMENT, MODELES.
  - ADRESSES : « Entités », « Liste des adresses », « Mes favoris », « Groupes d'adresses »,
    « Propriétés », « Chercher ».
  - COLLABORATEURS : « Collaborateurs actuels », « Anciens collaborateurs »,
    « Tous les collaborateurs ».
  - (pour mémoire, AFFAIRES : « Gestion », « Controlling », « Mes affaires », « Toutes les affaires ».)
- **Zone de contenu** : barre d'outils (boutons carrés gris à coins arrondis, icône seule),
  puis tableau(x). Tableaux : en-tête gris, lignes zébrées (blanc / bleu très pâle),
  sélection bleu vif texte blanc, colonnes redimensionnables, tri par clic sur l'en-tête
  (triangle ▲/▼ dans l'en-tête trié), largeur tronquée avec « … ».
- **Menus** (barre de menus) : « Fichier », « Affichage », « Réglages », « Aide ».
  - Fichier : « Importer des adresses », « Importer des vCards », « Importer les modèles »,
    « Export des données », « Quitter ».
  - Affichage : « Afficher la barre des modules » / « Masquer la barre des modules »,
    « Ouvrir les modules », « Fermer les modules ».
  - Réglages : « Préférences », « Paramètres système », « Administrateur »,
    « Gestion des utilisateurs », « Mettre à jour les licences CRB »,
    « Emplacements des modèles et des documents externes », « Base de donnée ».
  - Aide : « Gestion des licences DELTAproject », « Gestion des licences CRB »,
    « Rechercher les mises à jour », « Procédures et vidéos », « Support », « A propos de ».
  - *(Répartition exacte des entrées entre menus déduite du manuel + libellés `AppForm`.)*

### 1.2 Icônes standard (p.14-15) — à reproduire comme jeu d'icônes unique

| Icône (dessin) | ▾ | Libellé / fonction |
|---|---|---|
| + | parfois | Nouveau, créer, ajouter |
| crayon | parfois | Editer, modifier |
| − | non | Supprimer, effacer |
| deux feuilles | non | Dupliquer |
| feuille lignée | oui | Prévisualisation des documents |
| imprimante | non | Imprimer |
| pinceau | oui | Options d'impression (en prévisualisation) |
| entonnoir | oui (dans Gestion des utilisateurs) | Filtrer |
| loupe | non | Rechercher |
| clé plate | oui | Paramètres |
| silhouette | oui | Intervenants |
| organigramme | oui | Configurer les subdivisions et le plan comptable d'une affaire |
| boîte d'archive | oui | Paramétrage des modèles et des documents externes d'une affaire |
| palette/jauge | oui | Analyser |
| flèche vers un bac | non | Importer |
| croissant de lune | non | Veille, accès rapide aux adresses et à la saisie des heures |
| liste à puces | oui | Présentations |
| « i » | oui | Informations |
| flèche sortant d'un cadre | oui | Transférer (créer un nouveau type de document à partir d'un autre) |
| roue crantée | oui | Différentes fonctions (exports, affichage…) |
| disque dur | non | Enregistrer un document |
| flèche courbe | oui | Partager un document |
| feuille PDF | non | Créer un PDF |

Autres boutons récurrents : **◂** (petit triangle à droite d'un champ = menu de suggestions
/ actions du champ), **…** (ouvre un navigateur de sélection), **calendrier « 31 »**
(sélecteur de date), **i** (informations sur l'élément lié), **↗ / ↙** (agrandir / réduire
un dialogue, en bas à gauche).

### 1.3 Comportements généraux
- Double-clic sur une ligne = ouvrir la fenêtre d'édition.
- Sélection multiple : Maj (plage) et Cmd/Ctrl (discontinue).
- Champ de recherche (loupe, bouton ⊗ pour vider) : filtre instantané du tableau associé.
- Compteur en haut à droite du tableau : « ^0 Entités / ^1 Adresses », « ^0 Adresses ».
- Dialogues modaux avec « Annuler » (bouton blanc) et « OK » (bouton bleu, défaut) en bas à
  droite ; fenêtres de consultation avec « Fermer » seul.
- Dates au format `JJ.MM.AAAA`. Montants : `88.0 CHF` dans les listes, `88.00` en saisie.

---

## 2. Configuration (p.10-13)

### 2.1 Gestion des utilisateurs (capture p12_26, p12_30)
Menu Réglages > « Gestion des utilisateurs ». Fenêtre « Gestion des utilisateurs » avec
**3 onglets segmentés** centrés : « Utilisateurs », « Fonctions », « Jeux de privilèges ».

**Onglet Utilisateurs**
- Barre d'outils : + / crayon / − / entonnoir ▾ (filtre : « Afficher uniquement les
  utilisateurs activés. »).
- Tableau : `Nom` | `Nom d'utilisateur` | `Actif` (coche ✔ centrée).
  Variante « utilisateurs connectés » : colonnes supplémentaires `Host`, `Utilisateur`,
  `Utilisé le` (APPUSER.LOGINLOCALHOST / LOGINLOCALUSER / LOGINTIMESTAMP).
- Double-clic ou crayon → dialogue « Modifier l'utilisateur » ; + → « Saisir un utilisateur ».

**Dialogue « Modifier l'utilisateur » / « Saisir un utilisateur »**

| Libellé | Contrôle | Base |
|---|---|---|
| Nom d'utilisateur | texte (grisé en modification) | APPUSER.USERID (unique : « Le nom d'utilisateur ^0 est déjà utilisé. ») |
| Nom | texte | APPUSER.NAME |
| Mot de passe | champ masqué + ◂ (« Modifier le mot de passe », « Réinitialiser le mot de passe ») | APPUSER.PASSWORD (haché) |
| Actif | case à cocher | APPUSER.ISENABLED |
| Fonction | liste (1 col.) + boutons + / − (navigateur « Choisir les fonctions ») | APPUSER_APPCOMPANYROLE |
| Collaborateur | liste (1 col.) — collaborateur lié | APPUSER_STAFF |

Règles : au moins une fonction (« Vous devez définir une fonction. ») ; nombre d'utilisateurs
actifs limité par licence (« Le nombre maximal d'utilisateurs actifs est atteint. ») ;
suppression impossible si licences actives.
Dialogue « Modifier le mot de passe » : « Ancien mot de passe », « Nouveau mot de passe »,
« Confirmation ».

**Onglet Fonctions** — liste `Fonction` ; dialogue « Nouvelle fonction » / « Editer la
fonction » : « Nom de la fonction » + liste des jeux de privilèges (navigateur « Choisir le
jeu de privilèges »). Suppression refusée si utilisée. Tables APPCOMPANYROLE (NAMEFR/GE/IT/EN)
+ APPCOMPANYROLE_APPROLE.
Valeurs réelles : « Administrateur », « Standard », « Direction ».

**Onglet Jeux de privilèges** — liste `Jeux de privilèges` ; dialogue « Nouveau jeu de
privilèges » / « Modifier le jeu de privilèges » : « Nom du jeu » + liste `Privilèges`
(navigateur « Droits d'utilisateur »). Table APPROLE ; colonne RIGHTS = chaîne
`"module,id;module,id;…"`.

Jeux de privilèges réels (APPROLE.NAMEFR) : Administrateur, Editer les contacts, Visualiser
les contacts, Editer les groupes d'adresses, Exporter les contacts, Visualiser les groupes
d'adresses, Définir les affaires, Evaluer les affaires, Editer les affaires, Liste de
soumissionnaires, Gestion des collaborateurs, Liste de collaborateurs, Gestion, Heures,
Modèles, Frais, Tâches, Bâtiment, Standard, Direction.

Privilèges du périmètre (libellés exacts, codes *(déduits de l'ordre + données)*) :

| Code | Libellé |
|---|---|
| 0,0 | Superadministrateur |
| 1,x | « Menu Réglages-> Administrateur : lecture-écriture », « Menu Paramètres système: lecture-écriture », « Paramètres d'adresses: lecture-écriture », « Paramètres heures prévues… », « Paramètres jours fériés: lecture-écriture », « Menu Exporter les données: lecture-écriture », « Paramètres : Déverrouiller les documents des autres utilisateurs » |
| 3,0 | Module Adresses: afficher le module (barre latérale) |
| 3,1 | Module Adresses: créer |
| 3,2 | Module Adresses: modifier |
| 3,3 | Module Adresses: effacer |
| 3,4 | Module Adresses: exporter |
| 3,5 | Module Adresses: attribuer les propriétés |
| 3,6 | Module Adresses: supprimer les propriétés |
| 3,7 | Module Adresses: effacer tous les contacts |
| 3,8 | Module Adresses: importer |
| 3,9 | Module Adresses: groupes d'adresses : lecture seulement |
| 3,10 | Module Adresses: groupes d'adresses : lecture-écriture |
| 3,11 | Module Adresses: supprimer les groupes d'adresses |
| 6,0 | Module Collaborateurs: afficher le module (barre latérale) |
| 6,1 | Module Collaborateurs: créer |
| 6,2 | Module Collaborateurs: modifier |
| 6,3 | Module Collaborateurs: effacer |
| (autre) | « Menu Gestion des utilisateurs: lecture-écriture » |

Fonctions suggérées par le manuel (exemples, non en base) : Direction de l'entreprise,
Direction d'affaire, Direction des travaux, Secrétariat, Secrétariat en chef, Apprenti,
Stagiaire, Standard, Administrateur.

### 2.2 Licences (p.12-13, captures p13_37, p13_41) — hors besoin DeltaSub
- « Gestion des licences du CRB » : tableau `Numéro de client` | `Licence ID` | `Type de
  licence` | `Description` | `Valide` | `Nombre de licences` | `Licences disponibles`
  (en-têtes allemands dans la capture) ; + / crayon / − / roue ▾ ; « Fermer ».
- « Modifier licence de données » : Numéro de client, Type de licence (« CAN » / « Code des
  coûts de construction »), Numéro de licence ◂, Description ◂ (« Licence CAN et CFC »,
  « Licence Classification CRB »), boutons « Tester », « Mettre à jour » ; zone lecture seule :
  Client, Valable de, Valable jusqu'à, Classe de licence, Statut de licence, Langues
  (Langue | Nombre de licences), Droits d'accès (Produit | Chapitre | Droit d'accès :
  « Utilisation » / « Seulement lecture »). Tables DATALICENCE, DATAACTIVATEDLICENCE.
- « Gestion des licences DELTAproject » : Module | Nombre de licences | Licences
  disponibles (APPLICENCE, APPACTIVATEDLICENCE).
→ **Pour DeltaSub : ne pas reproduire** (pas de licences). Garder seulement l'idée « nombre
max. de collaborateurs » = aucun plafond.

### 2.3 Paramètres système (p.12) — Réglages > « Paramètres système »
Dialogue « Paramètres système », sections :
- **Général** : « Pays » (Suisse, Allemagne, France, Italie, Autriche) → SETTING
  `genCountryPos` = CH ; « Taux de TVA » (dialogue « Définir le taux de TVA ») →
  `genVatRatePos` = 8.1 ; « Monnaie standard » → `genCurrencyPos` = CHF
  (+ `chCurrencyPos` CHF, `euroCurrencyPos` €, `mainCurrency` CHF).
- **Adresses** : « Personne » = « Nom et prénom » / « Prénom et nom » → `displayNameFormat`
  ([NO] = Prénom et nom dans la base réelle *(déduit)*). « Téléphone » → dialogue
  « Préférences des numéros de téléphone » : « Afficher l'indicatif du pays »
  (`displayPhoneNumberFormat` = « Utiliser la notation internationale »), « Afficher
  l'indicatif (0) régional » (`displayPhoneAreaPrefix`), « Séparateur indicatif du pays »
  (`countryCodeSeparator` = « / »), « Séparateur indicatif interurbain »
  (`areaCodeSeparator` = espace), « Exemple » (aperçu en direct).
- **Protection** : documents Bâtiment (hors périmètre).
- Polices pour modèles (« Police standard », « Taille de police des positions standards »)
  → `standardFontName` = AkkuratLL-Light, `standardFontSize` = 8, polices de tableaux
  Akkurat 8 pt (cohérent avec Facturation.html).
Table SETTING (SETTINGTYPE, SETTINGNAME, SETTINGVALUE ; booléens écrits `[YES]`/`[NO]`).

### 2.4 Préférences (p.12-13, capture p13_45) — Réglages > « Préférences »
Dialogue « Préférences » : liste `Catégorie` à gauche (cadre bleu), panneau à droite,
« Annuler » / « OK ». Catégories : « Langue » (« Langue des documents »), « Correcteur
orthographique », « Utilisateur », « Apparence », « Tableau », « Saisie de texte »,
« vCard export », « Bâtiment ».

| Catégorie | Champs (libellés exacts) | Stockage |
|---|---|---|
| Utilisateur — titre « Paramètres personnels » + nom | Initiales, Téléphone, Adresse courriel, Titre, Fonction, Signature (image PNG, bouton « … ») | APPUSER.INITIALS, PHONE, EMAIL, JOBTITLE, JOBFUNCTION ; signature = fichier image |
| Tableau | Police, Taille, Interligne, « Afficher le fond alterné », « Afficher les traits horizontaux », « Afficher les traits verticaux », aperçu (« Colonne », « Texte ») | local poste |
| Apparence | « Personnalisation de l'apparence », « Variante », « Ecran » (bleu, Pourtour, Eplucheur, Béton), « Affichage des icônes » (Icône seulement / Texte seulement / Texte sous l'icône / Texte à droite de l'icône) | local |
| Langue | « Par défaut », « Choix des modèles documents pour des nouveaux documents » (Toutes les langues / La langue définie par défaut), « Langue de l'aide » | local |
| Correcteur orthographique | « Afficher le correcteur orthographique », « Dictionnaire » | local |
| Saisie de texte | Police, « Taille de police » | local |
| vCard export | « Encodage des caractères pour l'export vCard » | local |
| Bâtiment | « Enregistrer automatiquement les documents », « Afficher la boîte de dialogue à la fermeture des modules », « Emplacement des catalogues CAN (p.e. /CRBdata/Npkdt) » | local |

DeltaSub : garder **Utilisateur** (initiales, tél., courriel, titre, fonction, signature PNG
en dataURL) et **Tableau** (fond alterné, interligne) ; le reste est secondaire.

### 2.5 Administrateur (p.10-11) — Réglages > « Administrateur »
Dialogue « Administrateur » : liste `Catégorie` à gauche, panneau à droite. Catégories
(ordre) : Général, Adresses, Adresses - Propriétés, Adresses - Statuts, Affaires, Genres
d'affaires, Phases, Activités, Frais, Tarifs de facturation, **Heures prévues**,
**Jours fériés**, Plans comptables, Gabarits de facturation, Groupes de conditions, Tâches,
Comparaison des offres, Séances, Types de plans, Modèles externes, Rubriques modèles
externes, Nomenclature des doc. ext., Blocs de texte, Comptes pour QR-facture.
Seules les catégories du périmètre sont détaillées ci-dessous.

**Adresses (panneau « AdrFrame »)** — trois sous-sections :
1. « Général » (« Paramètres généraux d'adresses ») : tableau `Définition` | `Réglage`
   (Oui/Non), édition par dialogue « Editer les paramètres » (Verrouiller / Autoriser) :
   « Verrouiller l'importation d'adresses » (`lockAdrImport`), « Verrouiller la modification
   d'adresses importées » (`lockAdrMatch`), « Verrouiller la suppression de toutes les
   adresses » (`lockRemoveAllAdrs`), « Verrouiller l'export d'adresses »
   (`lockExportAllAddresses` = [YES] en réel).
2. « Propriétés » (« Définir les propriétés ») : arbre à 2 niveaux `Groupe` > `Désignation`.
   Boutons (infobulles) : « Ajouter un groupe », « Ajouter une propriété », « Modifier le
   groupe sélectionné », « Modifier la propriété sélectionnée », « Effacer le groupe
   sélectionné », « Effacer la propriété sélectionnée », « Déplacer au début », « Déplacer
   vers le haut », « Déplacer vers le bas », « Déplacer à la fin » (→ SORTORDER).
   Dialogues « Ajouter un groupe de propriétés » / « Modifier le groupe de propriétés »,
   « Ajouter une propriété » / « Modifier la propriété » : un champ libellé « Français »
   (NAMEFR ; NAMEGE/IT/EN conservés).
3. « Statut » (« Définir le statut ») : liste `Statut` ; « Ajouter un nouveau statut »,
   « Modifier le statut », « Effacer le statut », déplacements. Dialogue « Ajouter un
   statut » / « Modifier le statut » : champ « Français ».

Référentiel réel PROPERTYGROUP → PROPERTY (ordre SORTORDER) :

| Groupe | Propriétés |
|---|---|
| Branche | Entreprise, Maître d'ouvrage, Architecte, Direction de travaux, Ingénieur civil, Ingénieur bois, Ingénieur CVCE, Géomètre, Ingénieur en physique du bâtiment, Ingénieur en acoustique, Mandataire spécialisé, Architecte d'intérieur, Expert incendie, Commune, Experts, Avocat, Assurances, Locataire, Acheteur |
| Mailing | Carte de voeux, Apéro de bureau |
| Affiliation | Membre SIA, Membre BNI |
| Fournisseurs | Matériaux, Matériel de bureau |

Référentiel réel CONTACTSTATE (ordre SORTORDER) : `-` (1, valeur neutre), Recommandé,
Bonnes relations, A éviter, Entreprise liquidée, Arrêt de livraison.

**Heures prévues (TargetTimeFrame)** — tableau `Année` | `Description` | `Heures prévues`
(total annuel). Boutons : « Créer une série d'heures prévues », « Editer la série d'heures
prévues », « Effacer la série d'heures prévues ». Dialogue « Définir des heures prévues » /
« Editer heures prévues » : « Année », « Description » (champ « Français »), 12 champs
mensuels (unité « Heures », au centième). Table TARGETTIME : TARGETHOURS0…11 = janvier…
décembre, TARGETTIMEYEAR, DESCRIPTION. Données réelles : une série par année 2008-2026,
description « 100 % » puis « 100% - 8.5h/j » (≈ 170-195,5 h/mois).

**Jours fériés** — tableau `Le jour férié` | `Visible` (coche). Dialogue « Nouveau jour
férié » / « Editer le jour férié » :
- Nom (champ « Français »),
- « Date » : 3 boutons radio — « Chaque année le » [jour.mois] / « Chaque année » [n]
  « Jours après Pâques » / « Unique » [date],
- « Type » : « Tout le jour » / « Matin » / « Après-midi »,
- « Visible » (case).
Table PUBLICHOLIDAY : TYPECODE 0 = date fixe, 1 = relatif à Pâques (NOFDAYSEASTERSUNDAY,
ex. −2 Vendredi Saint, 1 Lundi de Pâques, 39 Ascension, 50 Lundi de Pentecôte), 2 = unique
(DATEYEAR) ; DATEDAY + DATEMONTH **0-based** (0 = janvier ; Fête nationale = 1/7 = 1ᵉʳ
août) ; OFFTYPECODE 0 = Tout le jour (1 Matin, 2 Après-midi *(déduit)*) ; ISON = Visible.
Liste réelle (Visible ✔ / –) : Nouvel an ✔, Saint Berchtold ✔, Mercredi des Cendres –,
Carnaval lundi –, Carnaval mercredi –, Vendredi Saint ✔, Pâques ✔, Lundi de Pâques ✔,
Fête du travail –, Ascension ✔, Pentecôte ✔, Lundi de Pentecôte ✔, Fête-Dieu –, Fête
nationale Suisse ✔, Assomption –, La Toussaint –, Noël ✔, Saint Etienne –, Lundi du jeûne ✔.

---

## 3. Module Adresses (p.16-21)

### 3.1 Sous-module « Entités » (captures p16_139, p18_161, p19_168/172/176/180)

**Disposition** : deux panneaux côte à côte + panneau de détail en bas à droite.

```
┌ Barre modules ┬─ [+▾][✎▾][−][⚙▾]   (🔍 recherche) ─┬─ [+▾][✎][−][⚙▾]  « 58 Entités / 3 Adresses »  (🔍) ─┐
│               │ Tableau des ENTITÉS (≈40 %)         │ Tableau des ADRESSES de l'entité (≈60 %)                 │
│               │ Type | Nom | Complément/Prénom      │ Type | Entité | Appartient à | Type d'adresse |          │
│               │                                     │ Identité 1 | Identité 2 | Identité 3 | Rue et n° |       │
│               │                                     │ Complément | Localité                                   │
│               │                                     ├──────────────────────────────────────────────────────────┤
│               │                                     │ [Adresse][Propriétés][Notes][Intervenant][Soumissionnaire]│
│               │                                     │ panneau de détail de l'adresse sélectionnée              │
└───────────────┴─────────────────────────────────────┴──────────────────────────────────────────────────────────┘
```

**Tableau gauche — entités (CONTACTOWNER)**

| Colonne | Contenu | Base |
|---|---|---|
| Type | icône : immeuble = Société, silhouette = Personne, deux silhouettes = Famille, groupe = Communauté/Association | TYPECODE |
| Nom | raison sociale ou nom de famille | NAME1 |
| Complément/Prénom | complément de société ou prénom | NAME2 |

Tri par défaut : Nom ▲. Recherche (loupe au-dessus) : filtre sur Nom/Prénom (« dupo » →
toutes les entités Dupont : personnes, famille, société). Entités masquées (ISHIDDEN)
exclues sauf si « Afficher les entités masquées ».

Codes **CONTACTOWNER.TYPECODE** (confirmés par l'ordre de l'énumération + données) :

| Code | Libellé | Nb réel | Champ Complément |
|---|---|---|---|
| 0 | Société | 458 | Complément |
| 1 | Personne | 245 | Prénom |
| 2 | Famille | 17 | — |
| 3 | Communauté (PPE, consortium, hoirie) | 2 | Complément |
| 4 | Association (fondation, fédération) | 5 | Complément |

Barre d'outils gauche :
- **+ ▾** : « Nouvelle société », « Nouvelle personne », « Nouvelle famille », « Nouvelle
  communauté », « Nouvelle association ».
- **crayon ▾** : « Modifier l'entité », « Modifier les coordonnées bancaires ».
- **−** : supprimer l'entité (refusé si utilisée : « Cette entité est utilisée comme: » +
  liste → proposer de la masquer).
- **roue ▾** (d'après manuel p.17 et `ContactListFrame`) : « Afficher tous les CFC »,
  « Afficher toutes les propriétés », « En tant qu'intervenant », « En tant que
  soumissionnaire » (ouvrent le dialogue d'info d'entité, voir 3.1.5), « Afficher les
  entités masquées », « Export tableau », « Export vCard ».

**Tableau droit — adresses de l'entité sélectionnée (CONTACT)**

Contient : (a) les adresses propres de l'entité (CONTACTOWNER_ID = entité) ;
(b) les adresses d'autres entités **liées** à elle (CONTACTRELATION_ID = entité), p. ex.
les collaborateurs d'une société ; (c) pour une personne, ses adresses professionnelles
dans les sociétés/familles auxquelles elle est liée.

| Colonne | Contenu | Base |
|---|---|---|
| Type (en-tête « … ») | icône : carte = adresse propre, maillon de chaîne = adresse liée | CONTACTRELATION_ID vide / renseigné |
| Entité | nom de l'entité propriétaire | CONTACTOWNER → NAME1 NAME2 |
| Appartient à | entité liée | CONTACTRELATION → NAME1 |
| Type d'adresse | Adresse, Adresse postale… | ADDRESSTYPECODE |
| Identité 1 / 2 / 3 | 3 lignes nominatives du bloc adresse (société, service, « Monsieur », « Jules Dupont »…) | NAME1 / NAME2 / NAME3 |
| Rue et n° | | STREET |
| Complément | 2ᵉ ligne de rue / case postale | POBOX |
| Localité | « NPA Localité » | POSTALCODE + LOCATION |

Compteur : « ^0 Entités / ^1 Adresses ». Recherche propre (loupe droite).

Codes **CONTACT.ADDRESSTYPECODE** (ordre de l'énumération) :

| Code | Libellé | Nb réel |
|---|---|---|
| 0 | Adresse | 742 |
| 1 | Adresse postale | 1 |
| 2 | Adresse de livraison | 4 |
| 3 | Adresse de facturation | 4 |
| 4 | Autre adresse (ex. chantier, adresse du projet) | 4 |

Barre d'outils droite :
- **+ ▾** : « Nouvelle adresse » (adresse propre de l'entité), « Lier une entité »
  (ouvre le « Navigateur des entités » pour choisir une entité existante et créer une
  adresse liée ; libellé contextuel « <entité> : lier à une entité »).
- **crayon** : « Modifier l'adresse » ; **−** : supprimer (dialogue de confirmation
  « Voulez-vous vraiment supprimer l'adresse de la base de données ? », boutons
  « Supprimer » / « Ne pas supprimer » / « Interrompre », case « Pour tous »).
- **roue ▾** : « Ajouter aux favoris », « Ajouter à un groupe d'adresses », « Copier
  l'adresse dans le presse-papier », « Afficher les adresses masquées », « Export vCard »,
  « Liste adresses de l'entité ».

**Panneau de détail (onglets segmentés)** : « Adresse », « Propriétés », « Notes »,
« Intervenant », « Soumissionnaire ».

1. **Adresse** (lecture seule, capture p16_139) : barre crayon + roue ▾. Deux colonnes :
   - gauche : « Entité », « appartient à », « Type d'adresse », « Adresse » (bloc
     multi-lignes : identités + rue + NPA localité) avec boutons loupe (carte :
     « Google Maps » / « map.search.ch », infobulle « Affiche la carte des environs ») et
     flèche (itinéraire) ;
   - droite : « Téléphone », « Tél. mobile », « Fax » (chacun avec ◂ → menu
     « search.ch », « local.ch », « Copier dans le presse-papiers », « Appeler … »),
     « Courriel » (bouton @ = « Envoyer un e-mail »), « Skype », « Site internet »
     (bouton ouvrir), « CFC ».
2. **Propriétés** : tableau `Groupe de propriétés` | `Propriété` (CONTACT_PROPERTY) ;
   + ouvre « Sélectionner les propriétés » (même colonnes, multi-sélection) ; − retire.
3. **Notes** : tableau `Date` | `Auteur` | `Sujet` | `Texte` (CONTACTNOTE.CHANGEDDATE,
   OWNER, SUBJECT, CONTENT) ; dialogue « Nouvelle note » / « Modifier la note » : « Concerne »
   + texte ; ISPUBLIC = note visible par tous (sinon privée à l'auteur *(déduit)*).
4. **Intervenant** (capture p18_161) : `Numéro` | `Affaire` | `Statut de l'affaire` |
   `Rôle` | `Domaine spécialisé` | `Fonction` | `CFC` | `Note` | … | `Responsable`
   → PROJECTMEMBER (CONTACT_ID = adresse) : PROJECT.NUMBER/NAME, état, TEAMROLECODE,
   PROJECTDIVISION, PROJECTROLE, BKP, NOTE, RESPCONTACT_ID. Double-clic → ouvrir l'affaire.
5. **Soumissionnaire** : `Numéro` | `Affaire` | `Statut de l'affaire` | `CFC` |
   `Responsable` → PROJECTTENDERER.

#### 3.1.1 Dialogue entité « Nouveau » / « Editer » (capture p16_143)

| Libellé | Contrôle | Base | Remarque |
|---|---|---|---|
| **Type** | liste : Société, Personne, Famille, Communauté, Association | TYPECODE | change les libellés/champs actifs |
| En-tête adresse | texte + ◂ (suggestions : Société, Monsieur, Madame, Madame et Monsieur, Famille, Commune) | FORMOFADDRESS | |
| **Nom** | texte | NAME1 | obligatoire |
| Complément / Prénom | texte (libellé « Prénom » si Personne) | NAME2 | |
| — séparateur — | | | |
| Affichage | case « Masquer l'entité dans les listes » | ISHIDDEN | remplace la suppression d'une entité utilisée |
| Remarque | zone multi-lignes | REMARK (1024) | |
| Créée le | texte fixe (+ « Modifié le ») | CREATED / UPDATED | |
| IDE | texte (actif pour Société/Communauté/Association) | UID | |
| N° AVS | texte (actif pour Personne seulement) | SOCIALSECURITYNUMBER | |
| Date d'anniversaire | date + calendrier (Personne seulement) | BIRTHDAY | |

Contrôle de doublons à la création : « Attention aux doublons. Il y a déjà ^0 entité(s) ^1. »
+ « Voulez-vous quand même la créer? ». Enregistrer une entité neuve enchaîne sur la
création de sa première adresse.

Coordonnées bancaires (bouton crayon ▾ > « Modifier les coordonnées bancaires ») :
dialogue « Coordonnées bancaires » (Entité + liste), puis « Nouvelle coordonnée bancaire »
: « Nom », « Banque/Etablissement » (navigateur d'établissement bancaire), « Rue et n° »,
« NPA/Localité », « Pays », « N° de clearing », « SWIFT », « IBAN » (contrôle : « L'IBAN est
incorrect. Voulez-vous vraiment enregistrer ? »), « N° compte bancaire », « Compte postal ».
Table BANKACCOUNT (CONTACTOWNER_ID, NAME, STREET, POSTALCODE, LOCATION, CLEARINGNR, SWIFT,
IBAN, ACCOUNT1, ACCOUNT2).

#### 3.1.2 Dialogue adresse « Nouvelle adresse » / « Editer l'adresse » (captures p17_150, p18_157)

Deux colonnes séparées par un filet vertical ; libellés alignés à droite ; libellés en gras
= champs principaux. Bouton ↗/↙ en bas à gauche : affiche/masque le **« Bloc-notes
temporaire »** (panneau gauche, zone de texte libre).

Colonne gauche :

| Libellé | Contrôle | Base |
|---|---|---|
| **Entité** | texte (entité propriétaire, lecture seule) | CONTACTOWNER_ID |
| appartient à | texte grisé (entité liée) | CONTACTRELATION_ID |
| **Adresse** (3 lignes) | 3 champs, chacun avec ◂ | NAME1, NAME2, NAME3 |
| Rue | texte + ◂ | STREET |
| Rue 2 | texte | POBOX |
| NPA/Localité | 2 champs (NPA court + localité) + ◂ | POSTALCODE, LOCATION |
| Pays | texte + ◂ (navigateur de pays ; « Plus ») ; défaut « Suisse » | COUNTRYCODE (CH) |
| **Téléphone** | 3 champs : indicatif pays (+41) / indicatif (026) / numéro + ◂ | PHONECOUNTRY1, PHONEAREA1, PHONENUMBER1 |
| Tél. mobile | idem | PHONECOUNTRY2, PHONEAREA2, PHONENUMBER2 |
| Fax | idem | FAXCOUNTRY1, FAXAREA1, FAXNUMBER1 |
| **Courriel** | texte + ◂ (contrôle : « Cette adresse courriel est incomplète ou incorrecte. ») | EMAIL1 |
| Skype | texte + bouton Skype | SKYPE |
| Site internet | texte + bouton ouvrir | INTERNET |

Colonne droite :

| Libellé | Contrôle | Base |
|---|---|---|
| Type d'adresse | liste (5 valeurs ci-dessus) | ADDRESSTYPECODE |
| Description | texte | ADDRESSDESC |
| **Abréviation** | texte + ◂ | SHORTLABEL |
| CFC | texte (liste de codes séparés par « , ») + « … » (navigateur CFC) | BKP |
| Civilité courrier | texte + ◂ (suggestions : « Monsieur ^0, », « Madame ^0, », « Bonjour Monsieur ^0, », « Bonjour Madame ^0, », « Cher Monsieur ^0, », « Chère Madame ^0, », « Cher ^1, », « Chère ^1, », « Bonjour ^1, », « Madame, Monsieur, » ; ^0 = nom, ^1 = prénom) | SALUTATION1 |
| Affichage | case « Masquer l'adresse dans les listes » | ISHIDDEN |
| Remarque | zone multi-lignes | REMARK |
| Fonction | texte | COMPANYROLE |
| Profession | texte | PROFESSION |
| Langue | liste (Allemand, Français, Italien, Anglais) | LANGUAGECODE (2 = Français pour 100 % des adresses réelles ; 1 = Allemand, 3 = Italien, 4 = Anglais *(déduit)*) |
| Statut | liste (CONTACTSTATE) | CONTACTSTATE_ID (vide = aucun) |
| Créée le | « 06.11.2014 (Modifiée le 09.10.2017) » | CREATED, UPDATED |
| Numéro | identifiant (lecture seule) | ID |

Champs non affichés mais présents : CODELABEL (« Code », critère de groupe intelligent),
EXTERNALREFERENCE (« Numéro de référence ext. », rempli par l'import, ex. `Import_XXX`).

**Menus ◂** : chaque ◂ propose des valeurs issues du **Bloc-notes temporaire** (le texte
collé est découpé en lignes ; la ligne sélectionnée dans le bloc-notes est proposée en tête
du menu, surlignée) puis des actions propres au champ. Menu ◂ du téléphone : [valeur du
bloc-notes] / « search.ch », « local.ch » / « Copier dans le presse-papiers » /
« Appeler … ». Menus ◂ de l'adresse : valeurs du bloc-notes + « Copier l'adresse dans le
presse-papier ».

**Pré-remplissage** : pour une nouvelle adresse, Adresse ligne 1 = nom de l'entité,
ligne 2 = complément ; pour une adresse liée (personne dans une société) : ligne 1 = société,
ligne 2 = « Prénom Nom » ou civilité, rue/NPA/localité/téléphone repris de l'adresse de la
société (cf. capture p16_139 : trois adresses à la même rue).

#### 3.1.3 Liens entre entités (p.17-18, captures p19_*)
- Société ↔ collaborateurs : chaque personne a une adresse dont CONTACTRELATION_ID =
  la société ; dans la société elle apparaît avec l'icône maillon, « Appartient à » =
  société, Identité 1 = société, Identité 2 = nom de la personne.
- Famille ↔ membres : entité Famille (Identité 1 « Famille Dupont », Identité 2
  « Mme et M. Julie et Jules Dupont ») + adresses liées des membres (Identité 1
  « Monsieur » / « Madame », Identité 2 « Jules Dupont »).
- Consortium / communauté d'héritiers : entité Communauté + sociétés ou personnes liées.
- Sélectionner une personne affiche : son adresse privée + ses adresses dans la famille et
  dans chaque société (capture p19_176 : 4 adresses).
- **Société individuelle** : une seule entité Société avec son adresse ; ne pas créer de
  Personne si le domicile est identique.
- Statistiques réelles : 170 adresses liées sur 755 ; liens dominants Personne→Société
  (144), Personne→Association (10), Personne→Famille (10).

#### 3.1.4 Navigateurs (dialogues de sélection)
- « Navigateur des entités » : « Critère de recherche » (« commence par » / « contient »),
  colonnes `Type` | `Nom` | `Complément/Prénom` (« Société »/« Complément »,
  « Nom »/« Prénom »), case « Montrer les détails ».
- « Navigateur d'adresses » : mêmes critères + onglets/filtres « Recherche », « Groupes »,
  « Propriétés », « CFC », « Intervenants », « Soumissionnaires » ; multi-sélection
  avec Cmd.
- « Navigateur de groupes d'adresses ».

#### 3.1.5 Dialogue d'info d'entité (roue ▾)
Titres « CFC », « Propriétés », « Intervenants », « Soumissionnaires » ; colonnes
`Entité` | `CFC` ou `Groupe de propriétés` | `Propriétés`, ou `Entité` | affaire |
`Responsable` — agrège les données de toutes les adresses de l'entité.

### 3.2 Sous-module « Liste des adresses » (capture p19_184)
Tableau plein écran de **toutes les adresses** (CONTACT), panneau de détail en bas (mêmes
onglets Adresse / Propriétés / Notes / Intervenant / Soumissionnaire, affichable via
« Afficher les détails des adresses »). Compteur « 115 Adresses » + recherche.

Barre d'outils : crayon (éditer) | feuille ▾ (prévisualisation : « Liste d'adresses »,
« Etiquettes », « Liste d'adresses par entité », « Liste d'adresses par CFC ») | roue ▾.

**Menu roue ▾** (ordre exact, séparateurs = filets) :
1. « Ajouter aux favoris » · « Ajouter à un groupe d'adresses … »
2. « Ajouter des propriétés … »
3. « Editer des adresses … » (modification groupée : dialogue « Modifier adresses »,
   tableau `Champs` | `Valeur`, confirmation « Souhaitez-vous modifier ces champs pour ^0
   adresses? »)
4. « Courriel … » (dialogue « Valider les courriels » : « Séparateur des courriels » =
   « Virgule (Standard) » / « Point-virgule (Outlook) », « Copier dans le presse-papier » ;
   avertissement « Les contacts suivants n'ont pas d'E-mail : »)
5. « Copier le contenu du tableau dans le presse-papier » · « Exporter le tableau dans un
   fichier CSV … »
6. « Exporter vCards… »
7. Présentations (radio ✓) : « Standard », « Adresse », « Communication », « Adresse +
   Communication », « Tous »
8. « ✓ Afficher les détails des adresses » · « Actualiser la liste »

Les 3 premiers groupes sont grisés sans sélection.

**Colonnes par présentation** (Standard relevée sur capture ; autres *(déduites des
colonnes disponibles `ContactTableModel`)*) :

| Présentation | Colonnes |
|---|---|
| Standard | Type(icône) · Entité · Type d'adresse · Identité 1 · Identité 2 · Localité · Téléphone · Tél. mobile · Fax · Courriel · Site internet · CFC |
| Adresse | Type · Entité · Appartient à · Type d'adresse · Identité 1 · Identité 2 · Identité 3 · Rue et n° · Complément · Localité · Pays |
| Communication | Type · Entité · Identité 1 · Identité 2 · Téléphone · Tél. mobile · Fax · Courriel · Skype · Site internet |
| Adresse + Communication | union des deux précédentes |
| Tous | toutes : … + Abréviation · Civilité courrier · Fonction · Profession · Langue · Statut · Remarque · Créé le · Modifié le · CFC |

« Tous » sert à chercher dans les remarques. Le tri se fait par clic d'en-tête (défaut
Entité ▲). Les numéros de téléphone s'affichent selon les paramètres système (ex.
« 026-660 89 89 »).

**Export CSV** — colonnes et libellés exacts (`ExportCsv`) : Numéro d'adresse, Type
(entité), Nom, Complément, En-tête adresse, IDE, N° AVS, Date d'anniversaire, Type
(adresse), Adresse 1, Adresse 2, Adresse 3, Rue 1, Rue 2, NPA, Localité, Code de pays,
Telefon pay, Telefon indicatif, Téléphone, Mobile pay, Mobile indicatif, Tél. mobile, Fax
pay, Fax indicatif, Fax, Courriel, Internet, Skype, Civilité, Function, Profession, CFC,
Remarque, Numéro de référence ext.

**Etiquettes** (dialogue « Paramètres ») : « Etiquette initiale », « Nombre de copies »,
« Police », « Taille de police », « Trié par: » Nom / Localité / N° postal, « Adresse avec
civilité », « Préférence pour les sociétés » / « … pour les personnes » : « Adresse de
société » / « Adresse privée ».

**Liste d'adresses imprimée** (dialogue « Liste d'adresses » / « Paramètres ») :
colonnes cochables N° CFC, Adresse / Adresse et contact, Contact, Abréviation, Rue et n°,
NPA, Localité, Téléphone, Tél. mobile, Fax, Tél./Fax, Courriel, Site internet, Fonction,
Groupe, Banque, IBAN… ; « Format de papier » (A4/A3 Portrait/Paysage) ; « Tri »
(Tri alphabétique, Tri selon CFC, Selon critère de tri, Selon tableau) ; « Fond alterné »,
« Interligne » (une ligne / deux lignes / plusieurs lignes), « Titre », « Date »,
« Document avec page de garde » ; favoris d'impression (« A4 Portrait standard », « A4
Paysage standard », « A4 Portrait abrégé », « A4 Paysage abrégé »).

### 3.3 Sous-module « Mes favoris »
Même écran que Liste des adresses, restreint au groupe statique personnel de l'utilisateur.
Menu : « Retirer de la liste des favoris ». Base : CONTACTGROUP avec ISSMART = 0,
NAME = « Mes favoris », OWNER = nom d'utilisateur ; membres dans CONTACTGROUP_CONTACT.

### 3.4 Sous-module « Groupes d'adresses » (p.20, capture p20_191)
**Disposition** : liste des groupes (gauche/haut) + liste des adresses du groupe
sélectionné (même tableau que Liste des adresses). Pseudo-groupe « Toutes les adresses ».

Liste des groupes : `Nom du groupe` | `Date` | `Type` (CONTACTGROUP.NAME, SORTDATE, ISSMART :
1 = intelligent, 0 = statique). Bouton **+ ▾** : « Nouveau groupe d'adresses intelligent »,
« Nouveau groupe d'adresses statique » → petit dialogue « Nom du groupe ». Double-clic sur un
groupe → dialogue d'édition.

**Groupe statique** : dialogue « Editer le groupe d'adresses statique » (nom seul). Ajout
d'adresses par la commande « Ajouter » au-dessus de la liste → Navigateur d'adresses
(multi-sélection Cmd) ; retrait : « Supprimer des adresses du groupe d'adresses »
(confirmation « retirer l'adresse du groupe ? », boutons « Retirer » / « Ne pas retirer »).
Table CONTACTGROUP_CONTACT (vide dans la base réelle).

**Groupe intelligent** — dialogue « Editer le groupe intelligent » (capture p20_191) :
- « Nom du groupe » (texte pleine largeur).
- Radio : « Correspond à tous les critères suivants » / « Correspond à un des critères
  suivants » → CONTACTQUERY.ISANDOPERATOR (1 = tous / ET).
- **5 lignes de critères libres** : [case] [champ ▾] [opérateur ▾] [valeur].
  Champs : « Nom/Société », « Prénom », « Localité », « Remarque », « Code », …,
  « Notes », « Profil ». Opérateurs texte : « est exactement », « n'est pas »,
  « contient », « ne contient pas », « commence par », « finit par ».
- **Lignes fixes** :
  - [case] « CFC » [opérateur] [valeur] (ex. contient « 211 »),
  - [case] « NPA (plage) » [« compris entre » / « est exactement » / « plus grand que » /
    « plus petit que »] [de] « et » [à] (ex. 1200 et 1230),
  - [case] « Statut » [opérateur] [liste des statuts],
  - [case] « Dernière modification » [« est exactement » / « avant le » / « après le » /
    « compris entre »] [date 📅] « et » [date 📅],
  - [case] « Création » (idem).
- [case] « Propriétés d'adresses » + radio « Comprend toutes les propriétés » /
  « Comprend une propriété » ; deux listes côte à côte « Propriétés d'adresses incluses »
  et « Propriétés d'adresses exclues », colonnes `Groupe de propriétés` | `Propriété`,
  boutons +▾ / − sous chacune.
- Les contrôles d'une ligne sont grisés tant que sa case n'est pas cochée.
- « Annuler » / « OK ». Le résultat est recalculé en direct : toute adresse qui répond aux
  critères apparaît automatiquement ; aucun ajout manuel possible.

Stockage : CONTACTGROUP (ISSMART = 1, CONTACTQUERY_ID) → CONTACTQUERY (ISANDOPERATOR,
MAXRESULT = −1) → **11 lignes CONTACTQUERYCLAUSE** ordonnées par POSITION :

| POSITION | Critère | FIELDID | PATTERN1 / PATTERN2 |
|---|---|---|---|
| 0-4 | 5 critères libres | index du champ (0 = Nom/Société…) | valeur |
| 5 | CFC | −1 | valeur |
| 6 | NPA (plage) | −1 | de / à |
| 7 | Statut | −1 | id statut |
| 8 | Dernière modification | −1 | date(s) |
| 9 | Création | −1 | date(s) |
| 10 | Propriétés d'adresses | −1 | PATTERN1 = ids PROPERTY **incluses** (liste « , ») ; PATTERN2 = ids **exclues** |

ISENABLED = case cochée ; OP = index de l'opérateur (pour la position 10 : 0/1 = radio
« une propriété » / « toutes » *(déduit, à vérifier)*).
Groupes intelligents réels (noms non personnels) : « Entreprise », « Maitre d'ouvrage »,
« Carte de voeux », « Pas d'envoie de carte » (exclut Carte de voeux), « BNI », « BNI pas
encore envoyé », « Ami », « contient aucun détail » (exclut toutes les propriétés).

### 3.5 Sous-module « Propriétés » (p.20)
Liste des propriétés groupées (`Groupe` | `Propriétés`) ; la sélection d'une propriété
affiche les adresses qui la possèdent (CONTACT_PROPERTY). Menu : « Supprimer la propriété
^0 » (confirmation « Voulez-vous supprimer cette propriété ^0 ? ») — retire la propriété
des adresses sélectionnées. Attribution : « Ajouter des propriétés … » depuis toute liste
d'adresses (multi-sélection).

### 3.6 Sous-module « Chercher »
Recherche plein texte : « Critère de recherche » + « commence par » / « contient » ;
périmètres « CFC », « Notes ». Résultat = tableau d'adresses standard.

### 3.7 Import vCard (p.21, capture p21_198)
Menu Fichier > « Importer des vCards … » → sélection du fichier (« Sélectionner le fichier
vCard ») → assistant « Importer les vCards », une vCard à la fois (« vCard 1/1 »).
- **Colonne gauche = Personne** : « Nom » [+▾], « Prénom » ; tableau des entités
  existantes correspondantes `Type` | `Nom` | `Complément/Prénom` ; puis « Rue et n° »,
  « Localité » (pays / NPA / localité), « Téléphone » (pays / indicatif / numéro),
  « Mobile », « Fax », « Courriel », « Site internet », bouton [+▾] en bas.
- **Colonne droite = Société** : « Société » [+▾], « Complément société » ; tableau des
  entités existantes ; « Rue et n° », « Localité », « Téléphone », « Fax », « Courriel »,
  « Site internet », [+▾].
- Menus +▾ : « Nouvelle adresse », « Lier une entité » (« Lier à la société »).
- Bas : radio encodage « UTF-8 » / « ISO-8859-1 » ; boutons « Prochaine vCard » et
  « Fermer ».
- Flux : si l'entité existe elle est proposée dans le tableau, sinon la créer (+), puis
  créer l'adresse ; pour une vCard personne + société : créer la société et son adresse,
  puis la personne et son adresse professionnelle via « Lier à la société ».
- Erreur : « Le format vCard du fichier ^0 n'est pas correct. »

Import CSV (Fichier > « Importer des adresses ») : assistant « Importer les adresses »,
tableau `M` | `Attribution du champ` | `Ligne d'import`, « Enregistrement ^0 de ^1 »,
« Séparateurs », « Ignorer la première ligne à l'importation », « Définir comme standard »
(→ SETTING `AddressImportSettings`), champs cibles : Société, Complément, Département, Nom,
Prénom, En-tête adresse, Rue et n°, Case postale, NPA, Localité, Code de pays, Indicatif du
pays, Indicatif, Téléphone, Tél. mobile, Fax, Courriel, Site internet, Skype, Civilité
courrier, Numéro CFC, N° de TVA, Adresse abrégée, Commentaire, Propriété, Numéro d'adresse
de la société / Numéro de personne (→ EXTERNALREFERENCE, permet les mises à jour).
Export vCard : fichier par défaut « DELTAproject vCards ».

---

## 4. Module Collaborateurs (p.22-23)

Principe : un collaborateur est d'abord une **Personne liée à l'entité du bureau** dans
Adresses/Entités, puis est ajouté dans Collaborateurs. Seuls les collaborateurs peuvent
avoir un compte utilisateur.

### 4.1 Liste des collaborateurs (capture p22_205)
Sous-modules : « Collaborateurs actuels » (ISACTIVE = 1), « Anciens collaborateurs »
(ISACTIVE = 0), « Tous les collaborateurs ».

Barre d'outils : **+** (« Ajouter un collaborateur ») · **crayon** (« Editer le
collaborateur ») · **−** (« Voulez-vous vraiment supprimer ce collaborateur ? » ; refus si
utilisateur lié : « Ce collaborateur est déjà défini dans la gestion d'utilisateurs. Vous
devez préalablement l'en retirer. ») · **clé ▾ Paramètres** · **feuille ▾** · **roue ▾**.

**Menu clé ▾** : « Coût de revient », « Durée prévue », « Vacances », « Verrouillage des
heures », « Participation aux affaires », « Disponibilité ».
**Menu feuille ▾** : « Liste des collaborateurs », « Fiche-collaborateur », « Etiquettes »,
« Adresses des collaborateurs », « Liste des adresses privées ».
**Menu roue ▾** : « Courriel », exports / présentations.

Tableau — colonnes visibles (capture) : `Collaborateur` | `Appartient à` | `Fonction` |
`Abréviation` | `Interne` (✔) | `Téléphone` | `Téléphone mobile` | `Courriel` …
Colonnes disponibles (`StaffTableModel`) : Collaborateur, Abrév., Fonction, Appartient à,
Entité et adresse, Adresse, Tél. prof., Tél. mobile, Courriel, Interne, Engagement, Départ,
Adresse privée, Contact privée, Tél. privé, Tél. mobile privé, Courriel privé, Date
d'anniversaire, N° AVS, Verrouillage des heures, Verrouillage avant.
Tri par défaut : STAFF.SORTORDER puis nom.

### 4.2 Dialogue « Ajouter un collaborateur » / « Editer le collaborateur » (capture p22_209)

| Libellé | Contrôle | Base |
|---|---|---|
| Collaborateur | champ nom (lecture seule) + ◂ (choisir l'adresse professionnelle via navigateur) ; dessous bloc adresse multi-lignes + bouton **i** | STAFF.PERSON_ID → CONTACT (adresse de la personne liée au bureau) |
| Employeur | bloc adresse + ◂ + **i** | STAFF.COMPANYCONTACT_ID → CONTACT (adresse de la société) |
| Adresse privée | bloc adresse + ◂ + **i** | STAFF.HOMECONTACT_ID → CONTACT |
| Abréviation | texte court (ex. 3 lettres) | STAFF.INITIALS |
| **Engagement** | date + calendrier (obligatoire) | STAFF.JOININGDATE |
| Départ | date + calendrier | STAFF.QUITTINGDATE |
| Collaborateur actuel | case (obligatoire à la création) | STAFF.ISACTIVE |
| Collaborateur interne | case | STAFF.ISINTERNAL |

Autres colonnes STAFF : SORTORDER, REMARK, HOLIDAYS, HOLIDAYBALANCE, HOLIDAYBALANCEYEAR,
HOLIDAYBALANCECHANGEDDATE, ISTIMELOGFROZEN, TIMELOGFREEZINGDATE, TIMELOGCOMPLETEDDATE.

### 4.3 « Coût de revient » (capture p23_216 + page 23)
Fenêtre « Coût de revient » : « Collaborateur » (« Société, Prénom Nom », lecture seule, **i**),
titre « Coût de revient horaire » (libellé complet : « Coût de revient horaire (charges
salariales) »), tableau `Valable dès le` | `Tarif` (« 88.0 CHF »), tri date décroissante,
boutons + / crayon / −, « Fermer ».
Sous-dialogue « Coût de revient » : « Coût de revient » [88.00] « Monnaie standard (CHF) »,
« Valable dès le » [date 📅], « Annuler » / « OK ».
Règle : le tarif applicable à une date d = ligne de plus grande VALIDFROM ≤ d ; même taux
pour toutes les activités (facturables ou non) ; il inclut charges sociales + surcoûts
(formation…). Table STAFFRATE (STAFF_ID, VALIDFROM, RATE).

### 4.4 « Durée prévue » (heures à effectuer)
Fenêtre « Editer la durée prévue » : « Collaborateur », tableau `Année` | `Heures prévues`
(unité « Heures ») ; + / crayon / −.
Dialogue « Editer heures prévues » :
- « Année »,
- 12 lignes mensuelles avec deux colonnes : « Heures prévues » et « Heures d'appoint
  prévues » (au centième),
- bouton « Insérer les heures prévues standard » (infobulle « Définir les heures
  prévues ») : copie la série TARGETTIME de l'année (Administrateur > Heures prévues),
  à ajuster pour un temps partiel,
- « Report des heures supplémentaires »,
- « Remarques ».
Règles : heures prévues = jours ouvrés (hors week-ends et jours fériés visibles) ; les
heures d'appoint s'ajoutent aux heures prévues et ne comptent pas comme heures
supplémentaires. Table STAFFTARGETTIME (STAFF_ID, TARGETTIMEYEAR, TARGETHOURS0…11,
OVERTIME0…11 = heures d'appoint, TARGETTIMEREDUCTION = report des heures supplémentaires,
REMARK).

### 4.5 « Vacances »
Dialogue « Vacances » : « Collaborateur » ; « Droit aux vacances annuel » [h] « Heures » ;
« Droit aux vacances ^0 » (année courante) ; « Vacances saisies ^0 » (calculé depuis la
saisie des heures) ; « Solde à reporter » ; bouton reporter (infobulle « Reporter ce solde
dans le champ "Droit aux vacances" de l'année suivante ») ; « Dernière modification » ;
« Remarque ».
Règles : droit annuel et solde de l'année précédente en heures pour l'année civile ; on
peut y ajouter les heures supplémentaires de l'année précédente.
Base : STAFF.HOLIDAYS (droit annuel, ex. 212.5 h = 25 j × 8.5 h), HOLIDAYBALANCE (droit
de l'année HOLIDAYBALANCEYEAR, solde inclus), HOLIDAYBALANCECHANGEDDATE.

### 4.6 « Verrouillage des heures »
Dialogue « Heures de travail » / « Verrouillage des heures » : « Collaborateur » (ou liste
si plusieurs sélectionnés — « editForStaffList »), case « Verrouiller les heures saisies
jusqu'au » + date, raccourcis « Plus 7 jours », « Fin du mois prochain », « Choisir la
date ». Effet : aucune saisie/modification d'heures ≤ date (heures facturées protégées).
Base : STAFF.ISTIMELOGFROZEN, TIMELOGFREEZINGDATE.
Variante « Taguer jusqu'au » (dialogue « Modifier ») : STAFF.TIMELOGCOMPLETEDDATE = date
jusqu'à laquelle la saisie est déclarée complète.

### 4.7 Secondaire : « Disponibilité », « Participation aux affaires »
- « Disponibilité » → « Heures disponibles pour les affaires » par mois : « Heures
  prévues », « Vacances », « Formation », « Militaire, service civil », « Autres
  absences », « Travail interne », « Déduction sur les heures prévues », « Résultat
  calculé », « Note interne » (STAFFPROJECTTIME : TIMEYEAR, TIMEMONTH, HOLIDAY, EDUCATION,
  OFFICIALABSENCE, OTHERABSENCE, INTERNALTIME, DEVIATION, TIMEBUDGET, REMARK). Travail
  interne réglable « En heures » / « En pourcentage » / « Aucun ».
- « Participation aux affaires » → « Attribuer un collaborateur » : liste d'affaires ;
  « Attribuer tous les groupes d'activités à un collaborateur pour toutes les affaires » /
  « … pour l'affaire sélectionné » (PROJECTACTIVITY_STAFF).

---

## 5. Correspondance DeltaSub (données)

Recommandation : stocker en `localStorage` des tableaux JSON qui reprennent **les noms de
tables et de colonnes Derby** (ex. `sa_dp_contactowner`, `sa_dp_contact`,
`sa_dp_contact_property`, `sa_dp_property`, `sa_dp_propertygroup`, `sa_dp_contactstate`,
`sa_dp_contactgroup`, `sa_dp_contactquery(+clause)`, `sa_dp_contactnote`,
`sa_dp_bankaccount`, `sa_dp_staff`, `sa_dp_staffrate`, `sa_dp_stafftargettime`,
`sa_dp_targettime`, `sa_dp_publicholiday`, `sa_dp_setting`, `sa_dp_appuser`) afin
d'importer directement les CSV `out/tables/APP.*.csv`. Conserver les ID d'origine
(références croisées vers PROJECTMEMBER, TIMELOG, etc.). Faire le lien avec les clés
existantes de Facturation.html (`sa_collaborateurs`, `sa_heures`) par STAFF.ID / INITIALS.
Pas de vrai mot de passe dans une app HTML locale : remplacer l'ouverture de session par
un choix d'utilisateur (APPUSER) sans prétention de sécurité.

---

## 6. Priorités

### Indispensable (V1)
1. **Fenêtre principale** : barre des modules ADRESSES / COLLABORATEURS, barres d'outils
   avec icônes standard (+, crayon, −, roue ▾, feuille ▾, clé ▾, loupe), tableaux triables
   zébrés, dialogues Annuler/OK.
2. **Entités** : double tableau entités / adresses, recherche, compteur, 5 types d'entité,
   dialogue entité complet, dialogue adresse complet (tous les champs de 3.1.2),
   « Nouvelle adresse » et « Lier une entité », masquage (ISHIDDEN), onglets de détail
   Adresse + Propriétés + Notes.
3. **Liste des adresses** : tableau global, présentations Standard / Adresse /
   Communication / Tous, copie presse-papier, export CSV, « Ajouter des propriétés »,
   « Ajouter aux favoris ».
4. **Propriétés et statuts** (référentiels + attribution) et sous-module Propriétés.
5. **Groupes d'adresses intelligents** (critères CFC, NPA, statut, dates, propriétés
   incluses/exclues, ET/OU) et **Mes favoris**.
6. **Collaborateurs** : liste actuels/anciens/tous, fiche (3 adresses, abréviation,
   engagement, départ, actuel, interne), **Coût de revient** historisé, **Durée prévue**
   (+ standard TARGETTIME), **Vacances**, **Verrouillage des heures**.
7. **Administrateur** : Heures prévues (TARGETTIME) et Jours fériés (PUBLICHOLIDAY, calcul
   de Pâques) — nécessaires au calcul des heures à effectuer.
8. **Import initial** des CSV DELTAproject (tables listées en §5).

### Secondaire (V2+)
- Onglets Intervenant / Soumissionnaire (dépendent du module Affaires).
- Groupes statiques, sous-module Chercher, navigateur d'adresses avancé.
- Bloc-notes temporaire avec suggestions ◂ ; menus ◂ téléphone (search.ch / local.ch /
  Appeler) et cartes (Google Maps / map.search.ch).
- Coordonnées bancaires des entités (utile pour factures fournisseurs / QR).
- Import/export vCard, import CSV avec mappage, étiquettes et listes d'adresses imprimées.
- Modification groupée « Editer des adresses … », « Courriel … » (liste d'e-mails).
- Paramètres système (format nom/téléphone, TVA, monnaie) et Préférences (Utilisateur +
  signature, Tableau).
- Gestion des utilisateurs, fonctions, jeux de privilèges (utile seulement si plusieurs
  personnes utilisent DeltaSub ; privilèges des modules 3 et 6 prioritaires).
- Disponibilité, Participation aux affaires.
- **Ne pas reproduire** : licences CRB et DELTAproject, mises à jour, connexion base de
  données, catégories Administrateur hors périmètre (traitées dans d'autres specs).

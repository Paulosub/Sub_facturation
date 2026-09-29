# Cahier des charges n° 4 — DEVIS GÉNÉRAL et SOUMISSIONS (manuel DELTAproject p. 50-75)

Cible : `DeltaSub.html` (Substances Architectes). Ce document décrit les écrans, libellés,
calculs et la structure de données à reproduire. Il ne contient aucun code DELTAproject et
aucune donnée client (les exemples chiffrés sont soit ceux du manuel, soit neutralisés).

Sources utilisées :
- manuel FR p. 50-75 et **toutes** les copies d'écran de ces pages (69 images) ;
- `Strings.db` (paquets `deltaproject.costestimate*` = 774 libellés, `deltaproject.devis18*` = 4187) ;
- schéma Derby (`COSTESTIMATEDOCUMENT`, `DEVISDOCUMENT`, `SUBPROJECT`, `PROJECTCATALOG*`…) ;
- 43 devis réels désérialisés en JSON (dont 3 récents et volumineux analysés en détail :
  `ser/ce_2951_7101.json`, `ser/ce_2851_7701.json`, `ser/ce_3601_7751.json`, plus `ser/scan/*.json`) ;
- réflexion sur les classes Java (`tools/Enums.java`) pour les énumérations et les classes de
  soumission (`deltaproject.devis18.data.*`).

Conventions : « DG » = devis général ; « position » = une ligne du plan comptable (CFC) dans le
devis ; « ouvrage » (OUV) = subdivision de l'affaire (table `SUBPROJECT`) ; « ligne de calcul »
= une ligne de la fenêtre « Calcul pour … ». Montants en CHF, séparateur de milliers `'`,
2 décimales.

---

## 0. Constat d'usage au bureau (détermine les priorités)

| Indicateur (base Derby / fichiers réels) | Valeur |
|---|---|
| Documents `COSTESTIMATEDOCUMENT` | 221 (91 marqués supprimés) |
| Par année (CHANGEDDATE) | 2022 : 60 · 2023 : 46 · 2024 : 41 · 2025 : 41 · 2026 : 31 (à fin sept.) |
| Statuts (STATECODE) | 0 Brouillon 132 · 1 Provisoire 24 · 2 Validé 38 · 3 Annulé 27 |
| `ISVATSEPARETED` = 1 | 220 / 221 → « Séparer la TVA » quasi systématique |
| `ISAPPLYSUBPROJECTS` = 1 (devis avec ouvrages) | 28 / 221 (mais ce sont les plus gros devis récents) |
| Documents par affaire | de 1 à 14 versions/variantes (sauvegardes horodatées nombreuses sur disque) |
| `DEVISDOCUMENT` (soumissions) | **0 ligne** ; dossier `Construction/Devis` **vide** |
| `PROJECTTENDERER` (soumissionnaires) | 1 ligne |

Échantillon de 43 devis désérialisés :
- arrondi 5 centimes actif (`round`) : 40 / 43 ;
- lignes de calcul avec formule : 200 ; unités utilisées : (vide) ≫ m2 > m > p > m3 ;
- taux de TVA des lignes : 8.1 (1275), 7.7 (329), 0 (3) ;
- lignes « Var » (exclues) : 27 + 78 ; positions « Exclure » : quelques-unes ;
- « Soumis aux honoraires » renseigné sur **6 positions seulement** (les autres à 0) ;
- « Fixer le coût », « Calcul définitif », « Base de prix », localisation : **jamais** utilisés
  (sauf 2 lignes avec base « Estimation ») ;
- remarques préliminaires (« Informations pour le devis ») : 441 entrées ; sauts de page : 337.

Conclusion : **le devis général est le cœur du module** (≈ 40-60 documents/an) ;
les soumissions CAN n'ont jamais été utilisées (et exigent une licence CRB).

---

## 1. DEVIS GÉNÉRAL — liste des documents (domaine d'affaire « Devis général »)

Accès : AFFAIRES › (Mes affaires | Toutes les affaires) › affaire › domaine « Devis général »
(3ᵉ colonne de l'écran principal, sous « eCCC-Bât. », au-dessus de « Soumission » et
« Contrôle des coûts »).

### 1.1 Tableau des documents (4ᵉ colonne)
Colonnes, dans l'ordre (copie d'écran p. 50) :
`Utilisateur | Date | Version | N° de version | Statut | Notes`
(Les libellés Strings.db `CostEstimateFrame` donnent la variante : `Date | Statut | Variante |
Numéro | Remarque` — retenir ceux de l'écran.)

Barre d'outils au-dessus : `+` (nouveau), copier (dupliquer), crayon ▾ (éditer), `−`
(supprimer = marquage `ISMARKEDASDELETED`), import ▾, roue crantée ▾ ; champ de recherche à droite.
Double-clic sur une ligne = ouvrir le devis. Messages : « Ce document est actuellement utilisé. »
(verrou `DOCUMENTLOCK`), « Il n'y a plus de licence disponible. »

### 1.2 Fenêtre « Editer le devis général » / « Nouveau document »
Disposition (p. 50) — 2 colonnes :
- gauche : `Version` [texte] ; `Statut` [liste] ; case `Séparer la TVA` ; case (grisée après
  création) `Devis avec subdivisons` [sic] ; `Utilisateur` [texte + bouton ◀ = choix du
  collaborateur] ;
- droite : `N° de version` [texte] ; `Date` [date + bouton calendrier] ;
- bas : `Note` [zone de texte multi-lignes] ; boutons `Annuler` / `OK`.

Statut (enum `db.CostEstimateDocument$State`) :

| code | libellé |
|---|---|
| 0 | Brouillon |
| 1 | Provisoire |
| 2 | Validé |
| 3 | Annulé |

Règles :
- plusieurs variantes/versions par affaire ; **seule la variante « Validé »** est proposée pour le
  transfert vers le contrôle des coûts ;
- « Devis avec subdivisions » = `ISAPPLYSUBPROJECTS` : ne peut plus être changé ensuite ; à la
  création, message « Souhaitez-vous attribuer les ouvrages à ce nouveau devis ? » ;
- « Séparer la TVA » (`ISVATSEPARETED`) conseillé : permet les présentations HT/TTC.
  NB : dans le contenu sérialisé, le champ `separateVat` vaut toujours `false` — la **source de
  vérité est la colonne de la table**.

Mapping table → DeltaSub (collection `costestimatedocument`, colonnes en MAJUSCULES comme le
reste de DeltaSub) : `ID, PROJECT_ID, VERSION, VERSIONNUMBER, STATECODE, CHANGEDDATE, USERID,
NOTE, ISVATSEPARETED, ISAPPLYSUBPROJECTS, ISMARKEDASDELETED, DOCUMENTLOCK_ID`.

---

## 2. DEVIS GÉNÉRAL — fenêtre principale « Devis général <n° affaire> »

### 2.1 Disposition (p. 51)
- Titre de fenêtre : `Devis général  <n° d'affaire>`.
- Barre de menus : `Fichier | Edition | Paramètres …`
- Barre d'outils :
  - au-dessus du catalogue (gauche) : `+` (« Ajouter une position »), crayon (« Editer la position »
    du catalogue / « Editer le filtre » selon contexte) ;
  - au-dessus du devis (droite) : crayon (« Editer la position »), `−` (« Supprimer la position »),
    entonnoir ▾ (Filtre), tableau ▾ (Présentation), clé ▾ (Paramètres), document ▾ (Documents /
    impressions), roue crantée ▾, lune (mode nuit/affichage) ;
  - à droite, bloc de totaux sur 3 lignes : `Total HT` · `Total TTC` · `Honoraires:` avec les
    montants alignés à droite.
- Corps en 2 volets redimensionnables :
  - **gauche = plan comptable de l'affaire** (CFC, ou eCCC-Bât selon `PROJECTCATALOG`) :
    colonnes `N° | Texte` ; titres (1-2 chiffres et groupes) en gras ; zébrage bleu clair ;
  - **droite = le devis** : colonnes `N° | Désignation | Montant HT | TVA` (avec ouvrages :
    une colonne par ouvrage + total, voir 2.6) ; positions totalisatrices en gras ;
    **cellule montant grisée = position saisissable** (feuille), non grisée = totalisateur.

Colonnes disponibles du tableau (`KvDialog`) : `N°`, `Désignation`, `Montant HT`, `Montant TTC`,
`TVA`, `OUV`, `Localisation`, `Pourcent`, `% soumis`, `Montant soumis`, `Honoraires HT`,
`Commentaire`, `Définitif`.

### 2.2 Interactions
- Double-clic sur une position du catalogue (gauche) → insertion dans le devis ; création
  automatique des parents manquants (totalisateurs « générés »). Si un montant existe déjà dans
  une position subordonnée : « Un montant figure déjà dans la position subordonnée ^0. Voulez-vous
  le reporter dans la nouvelle position ? »
- Double-clic sur une position saisissable (droite) → fenêtre « Calcul pour <CFC> » (§ 3).
- Menu contextuel (clic droit) sur une position : `Editer la position`, `Supprimer la position`
  (« Voulez-vous supprimer cette position et celles qui lui sont subordonnées ? »),
  `Indexer la position`, `Modifier la TVA`, `Modifier le montant soumis` (honoraires).
- « Indexer » : dialogue « Indexer cette position + sub. », champ `Facteur` « (p.ex. 1.05) » →
  multiplie les prix de la position et de ses sous-positions.
- « Modifier la TVA » : dialogue « Modifier le taux de TVA », champ `TVA` « [p.ex. 8.0] » →
  remplace le taux des lignes de la position (et sous-positions).
- « Soumis aux honoraire[s] » (dialogue `InsertHonorarDialog`) : champ `Soumis aux honoraires`
  « [p.ex. 100.0] ».

### 2.3 Menus (libellés exacts, regroupement d'après Strings.db `KvDialog`)
- **Fichier** : `Enregistrer` · `Exporter le devis` · `Exporter vers FastTrack Schedule` ·
  `Exporter le descriptif` · `Import fichier PDF` · `Créer un PDF comme jointe au document` ·
  `Ouvrir PDF` · `Effacer le PDF` · `Fusionner PDF` · `Effacer le document` · `Rejeter` ·
  `Fermer` · `Quitter`. En quittant : « Voulez-vous enregistrer les modifications ? »
- **Edition** : `Ajouter une position` · `Editer la position` · `Supprimer` · `Indexer` ·
  `Modifier la TVA` · `Modifier le montant soumis` · `Mettre tous les montants à zéro` ·
  `Supprimer les ouvrages à 0` · `Attribuer le statut "non définitif" à toutes les positions` ·
  `Informations pour le devis` (= remarques préliminaires, § 2.8).
- **Paramètres …** : `Paramètres` (fenêtre § 5) · `Ajouter une présentation par défaut` ·
  `Renommer la présentation` · `Supprimer la présentation` · `Importer les présentations` ·
  liste des présentations enregistrées (ex. « Standard » + présentations du bureau).
- **Filtre ▾** : `Editer le filtre` · `Désactiver le filtre` · favoris (§ 2.7). Bandeau
  d'avertissement : « Attention, vous travaillez en mode filtre. »
- **Présentation ▾ (icône tableau)** : `Standard` · `Toutes les colonnes` ·
  `Toutes les colonnes avec le calcul de prix` · `Avec colonnes honoraires` · `Avec le descriptif`
  · cases : `Afficher les subdivisions`, `Afficher les montants`, `Afficher les positions sans
  montant`, `Seulement positions de 1 à 3 chiffres`, `Afficher les positions saisies et les
  totalisateurs`, `Quantités`, `Prix HT`, `Prix TTC`, `Bases de prix`, `Variantes`,
  `Masquer les décimales`, `Afficher le calcul`, `Commentaire du calcul`, `Afficher les remarques
  du calcul`, `Base et commentaire de la position`, `Base et commentaire dans colonne séparée`.
- **Arrondi (dans Présentation ou Paramètres)** : `Arrondir à 10` · `Arrondir à 100` ·
  `Arrondir à 1000` · `Choix d'arrondis`. Message : « Attention, vous utilisez une fonction
  d'arrondi pour un aperçu approximatif. Uniquement possible pour les montants TTC. »
- **Documents ▾** : `Devis général` · `Devis descriptif` · `Honoraires` (= « Montant soumis ») ·
  `Feuille de position` · `Documents` · `Afficher les documents`.
- **Roue crantée ▾** : `Navigateur` (recherche de la position dans les autres affaires) ·
  `Exporter` (FastTrack) · `Dupliquer et modifier division` (§ 2.9) · `À la dernière version`.

### 2.4 Hiérarchie CFC (règle de totalisation)
Numéros observés (longueur) : `2` (1 chiffre) → `21` (2) → `211` (3) → `211.6` (4ᵉ niveau,
avec point). Le parent d'un numéro :
- `211.6` → `211` ; `211` → `21` ; `21` → `2` ; `2` → racine.
- Plan eCCC-Bât (codes type `C 2.1`) : parent = code tronqué au dernier séparateur
  (`C 2.1` → `C 2` → `C`) — à confirmer au premier devis eCCC.

Une position est :
- **saisissable** (feuille) si elle porte des lignes de calcul (`priceState` 1 ou 2) ;
- **totalisatrice** sinon : montant = somme des enfants directs. Une position de 3 chiffres
  peut être saisissable (ex. `112`) si elle n'a pas d'enfant.

Tri : ordre lexicographique « naturel » des numéros CFC (1 < 10 < 101 < 101.0 < 101.1 < 11 …),
identique au catalogue.

### 2.5 Totaux affichés
- `Total HT` = Σ montants HT des positions de 1 chiffre (hors positions « Exclure »).
- `Total TTC` = Σ montants TTC correspondants.
- `Honoraires:` = Σ montants soumis (HT × % soumis).
- Colonne `TVA` : montant de TVA (ou taux si les lignes d'une position en ont un seul — l'écran
  du manuel ne montre la colonne que vide ; afficher le montant de TVA).
- Colonne `[%]`/`Pourcent` : selon le paramètre (§ 5.2) « Pourcentage sur le groupe principal »
  (base = position de 1 chiffre parente ; valeur **stockée** dans les fichiers) ou
  « Pourcentage sur le total général ».

### 2.6 Devis avec ouvrages (subdivisions)
- Chaque position saisissable contient **une partie par ouvrage** de l'affaire (même si 0).
- Affichage « Afficher les subdivisions » : colonnes `OUV` (et `Localisation`) ou une ligne par
  ouvrage sous la position ; le total de la position = Σ ouvrages.
- Ouvrages = table `SUBPROJECT` de l'affaire (`CODE`, `DESCRIPTION`, `LOCATIONCODE`,
  `LOCATIONDESCRIPTION`, `SORTORDER`). Seul le code est stocké dans le devis.
- `Supprimer les ouvrages à 0` : « Voulez-vous supprimer les ouvrages à zéro? Seuls les ouvrages
  supprimés dans l'affaire dont toutes les positions sont à zéro seront supprimés. »
- À l'ouverture d'un devis avec ouvrages quand l'affaire n'en a plus : « Ce devis a des
  ouvrages. Voulez-vous l'ouvrir sans ouvrages ? »

### 2.7 Filtre (fenêtre « Filtre »)
Tableau `M | Ouvrage | Localisation | Facteur` (+ `Favori`) ; boutons `Appliquer le filtre`,
`Ajouter aux favoris`, `Retirer de la liste des favoris`, `Editer les favoris`.
- `M` coché = ouvrage inclus ; `Facteur` multiplie les montants de l'ouvrage (défaut 1.0).
- Favori (« Nouveau favori » / « Editer le favori », champ `Désignation`, « Cette désignation
  existe déjà. ») = nom + liste {ouvrage, inclus, facteur} + plage CFC de/à.
- Les totaux affichés et imprimés ne portent alors que sur la sélection × facteurs.

### 2.8 Remarques préliminaires (« Informations pour le devis »)
Dialogue « Remarques préliminaires », indication « Informations pour le devis », tableau
`Nom | Texte` (lignes libres, réordonnables). Imprimé en tête du DG sous le titre
« Informations pour le devis » (colonnes `Désignation | Texte`).
NB : la fenêtre équivalente de DeltaSub/Facturation est déclarée **terminée** — ne pas la
modifier, seulement y brancher les données (`introDescList` → `remarques`).

### 2.9 Dupliquer et modifier la subdivision (« Modifier les ouvrages »)
Dialogue « Modifier les ouvrages » : tableau `Ancien | Nouveau` (une ligne par ouvrage du
devis source) ; boutons `+`/`−` sous le tableau ; `+` ouvre une liste déroulante des ouvrages
de l'affaire. Effet : crée une **copie** du devis où les montants de chaque ouvrage « Ancien »
sont réaffectés à l'ouvrage « Nouveau » (plusieurs anciens → même nouveau = cumul ; « Nouveau »
vide = montants abandonnés). Dialogue associé « Importer des ouvrages ».

### 2.10 Navigateur de positions (« Choix du CFC ^0 »)
Liste de toutes les affaires où ce CFC a été utilisé : `Numéro | Texte | OUV | Localisation |
Montant | Commentaire de la position` ; `Affichage`, `Filtré`, `Appliquer le filtre`,
`Editer le filtre`. Double-clic → reprise des lignes de calcul dans la position courante
(« Voulez-vous ajouter cette position ? »). Message si vide : « Cette position n'a jamais été
utilisée dans une autre affaire. » Dans DeltaSub : recherche dans tous les devis stockés.

### 2.11 Saut de page
Dans l'aperçu avant impression, clic sur une position → `Insérer un saut de page` /
`Supprimer le saut de page`. Stocké **par présentation** : `{cfc, oneDigitBreak, twoDigitBreak,
allDigitBreak}` (observé : toujours `allDigitBreak=true`, i.e. saut avant cette position).

### 2.12 Export FastTrack
Dialogue « Exporter » : `Fichier` + `Choix du fichier`, cases `Exporter le devis général`,
`Exporter vers FastTrack`, `Exporter les montants`, `Inclure le calcul`, `Inclure le
commentaire`, `Inclure le descriptif`. Export texte « numéro + texte » (4 niveaux d'activité).
Priorité basse : remplacer par un export CSV (CFC ; désignation ; montants HT/TVA/TTC par ouvrage).

---

## 3. Fenêtre « Calcul pour <CFC> » (saisie d'une position)

### 3.1 Disposition (p. 51-52)
- Haut : boutons `+` (« Insérer une ligne »), `−` (« Effacer la ligne »), `⇈` (« Déplacer au
  début »), `↑` (« Déplacer vers le haut »), `↓` (« Déplacer vers le bas »), `⇊` (« Déplacer à la
  fin ») ; à droite, total de la position en gras (ex. `46'000.00`).
- Tableau des lignes, colonnes dans l'ordre :
  `Commentaire | Base | Calcul de quantités | Quantité | Unité | Prix | TVA | Montant | Var`
  (Strings : `Prix` = « Prix HT » ; colonne optionnelle « Prix TTC »).
  La dernière ligne vide porte le taux de TVA par défaut (ex. 7.7 ou 8.1).
  `Var` : ✕ = ligne comptée, ✓ = ligne « variante » **non additionnée**.
- Sous le tableau : `Commentaire de la position` [texte court] ; à droite `Montant de
  position` [liste : `Inclure` | `Exclure`].
- `Soumis aux honoraires` [nombre] `%` + bouton ◀ ouvrant un menu `100.0 %`, `90.0 %`,
  `50.0 %`, `0.0 %`.
- `Descriptif` [zone de texte riche : `Gras`, `Italique`, `Souligner`, `Couleur de texte`].
- Bas gauche : roue crantée ▾ : `Navigateur`, `Copier le calcul`, `Coller le calcul`
  (« Vous avez déjà inséré un calcul. Voulez-vous le remplacer ou le compléter par le contenu du
  presse-papier ? » → `Remplacer` / `Compléter`), `Fixer le coût`, `Arrondi`, `Calcul définitif`.
- Boutons `Annuler` / `OK`.
- Avec ouvrages : une grille de lignes **par ouvrage** (sélection de l'ouvrage dans la fenêtre ;
  titre « Calcul pour <CFC> » + ouvrage).

### 3.2 Colonnes et valeurs
- `Base` (enum `PriceBaseState`) : vide (−1) · 1 `Offre` · 2 `Prévision` · 3 `Calcul` ·
  4 `Estimation` · 5 `Supposition`. (Le manuel montre « Calcul » et « Offre ».)
- `Unité` (liste) : `m, m2, m3, f, p, gl, h, t, %, %o, su, br, up, ms, pa, ro, sa, se, j, hl,
  kJ, kg, l` (saisie libre acceptée).
- `Calcul de quantités` : expression arithmétique (+ − × ÷, parenthèses ; ex. `4.44*4+1.36+5.42*3`,
  `(0.85+1.95+1)*2.5`, `25+19-7`). Erreurs : « Il y a deux opérateurs consécutives dans le
  calcul. », « L'équation de la ligne ^0 est incomplète ou contient des erreurs. »
- `Montant de position` (enum `PriceTypeState`) : `Inclure` (compté) / `Exclure` (option : non
  compté dans le total, montant conservé à part).

### 3.3 Règles de calcul d'une ligne (vérifiées sur les données)
Soit `q` la quantité (résultat de la formule si présente), `p` le prix HT, `t` le taux TVA (%).
1. **Montant HT** `ex` = `q × p` ; si pas de formule et `q = 0` → ligne **forfaitaire** :
   `ex = p` (cas le plus fréquent : commentaire + prix global).
2. `TVA` = `ex × t / 100` (non arrondie en stockage).
3. `Montant` (TTC) = `ex + TVA`.
4. **Arrondi 5 centimes** (option `round` du devis, active dans 40/43 devis) :
   - les prix HT sont arrondis à 0.05 (« Le prix de la ligne ^0 n'est pas arrondi. ») ;
   - le montant TTC est arrondi à 0.05 ;
   - **saisie en TTC** (colonne « Prix TTC ») : l'utilisateur tape un prix/total TTC rond
     (ex. 40.00/m2 ou 18'000.00) ; DELTA stocke `p = arrondi0.05(prixTTC / (1 + t/100))` et
     conserve le montant TTC tapé (`q × prixTTC`). Conséquence : `ex + TVA` peut différer de
     quelques centimes du TTC stocké → **le TTC stocké fait foi**.
   - avertissement : « Vous avez défini la fonction d'arrondi et n'utilisez pas de prix ou de
     montants arrondis. Voulez-vous toujours continuer à travailler ? »
5. Ligne `Var` cochée → exclue de toutes les sommes (reste affichée, imprimable via l'option
   « Variantes »).

### 3.4 Totaux d'une position
- Partie (ouvrage) : `TTC = Σ Montant`, `HT = Σ ex`, `TVA = Σ TVA` des lignes non-Var.
- Position feuille : Σ des parties (ou des lignes directes si le devis n'a pas d'ouvrages).
- Si `Montant de position = Exclure` : total compté = 0 ; le montant est reporté dans
  `optionValue`/`optionExVatValue` et **cumulé vers les parents** (affichable via « Afficher les
  positions à exclure »).
- Totalisateur : Σ des enfants directs (TTC, HT, TVA, option, montant soumis).
- `Montant soumis` (honoraires) de la position = `HT × %soumis / 100` ; `%soumis` saisi par
  position (0 par défaut dans les fichiers réels ; 100 dans l'exemple du manuel).
  Ex. manuel : 211.6 = 100 %, 291 = 0 %, 900 = 50 %.
- `Fixer le coût` (dialogue « Fixer le coût » : `Total TTC`, `TVA` « [p.e. 7.7] », `Total HT`) :
  impose le total de la position indépendamment des lignes ; à la modification suivante :
  « Le montant de la position est fixé. Voulez-vous supprimer le montant fixe ou le laisser tel
  quel ? » (`Supprimer` / `Laisser tel quel`). Jamais utilisé au bureau → P3.
- `Calcul définitif` : drapeau « Définitif » (colonne, impression). Jamais utilisé → P3.

---

## 4. Documents imprimés du devis général

Trois documents (Strings `KvDialog`/`*DocumentReport`), chacun avec page de garde optionnelle :
1. **Devis général** (titre configurable, défaut « Devis général » ou « Estimation des coûts »).
   En-tête d'informations : `Titre du document`, `Date du document`, `Date du devis`,
   `Version du document`, `Numéro du document`, `Information du document`, `Etat du projet`,
   `Etat de la planification`, `Marge d'approximation du devis` (ex. `±10%`, `±15%`, `±20%`,
   `±25%`), `Indice ICC`, `Collaborateur`, `Filtre`, `Maître d'ouvrage dans l'ouvrage`.
   Tableaux : `Informations pour le devis` (Désignation | Texte), `Ouvrages` (`Code d'ouvrage |
   Ouvrage | Code de localisation | Localisation | Maître d'ouvrage`), `Récapitulatif`,
   `Devis général`. Colonnes du tableau principal : `N° CFC | Désignation | Montant TTC`
   (+ `Montant HT`, `TVA`, `Taux de TVA`, `Quantité`, `Prix HT`/`Prix TTC`, `Base de prix`,
   `Pourcentage`, `Ouvrage`, `Localisation`, `Commentaire position`, `% soumis`, `Honoraires`,
   `Définitif`, `Monnaie`), variantes de colonnes « Devis à 1/2/3/4 chiffres » (montants décalés
   par niveau). Pied : `Total hors TVA`, `TVA`, `Total TTC`.
   Options : « Récapitulatif par ouvrage à la fin », « Totaux récapitulatifs à 2 chiffres »,
   « Afficher le titre pour le calcul détaillé d'une position » (`Calcul :`), « … pour le
   descriptif détaillé » (`Description :`), « Les positions supérieures à trois chiffres comme
   celles à deux chiffres », « Fond alterné ».
2. **Devis descriptif** (« Descriptif du devis général ») : `N° CFC | Désignation | Montant |
   Pourcentage | Ouvrage | Localisation | Honoraires [%]` + texte du descriptif par position ;
   options `Afficher les montants`, `Afficher les options`, `Afficher les ouvrages`,
   `Regrouper les ouvrages`, `Afficher les positions titres`, police / police des titres, modèle,
   pages vides, page de garde.
3. **Honoraires** (« Montant soumis », titre « Calcul des honoraires ») : colonnes `CFC | Texte |
   OUV | LOC | Montant | [%] | Montant soumis` ; pied `Total hors TVA`, `TVA`, `Total TTC`,
   `Montant soumis`.

Aperçu : fenêtre avec pinceau (paramètres), imprimante, navigation `|< < [n] > >|`, zoom (%).
Mise en page : reproduire la présentation du bureau (police Akkurat-Light pour le standard,
titres « Serif », tailles 9/8, interligne 14) — voir règle 4 du CLAUDE.md : ne pas « améliorer ».

Aperçus déjà présents dans l'app (DG, Soumis à honoraires, Descriptif) : **à laisser en l'état**
(mémoire projet) ; ce chapitre sert de référence pour la phase design ultérieure.

---

## 5. Paramètres / présentations (fenêtre « Paramètres »)

### 5.1 Structure
Liste de catégories à gauche (`Catégorie`) : `Généralité`, `Document`, `Positions`, `Calcul`,
`Titres de colonnes`, `Présentation et style`, `Police`, `Modèle:`. Chaque présentation
enregistrée (« Ajouter une présentation par défaut », dialogue `Nom`, « Ce nom est déjà
utilisé. ») mémorise l'ensemble + ses sauts de page ; une présentation peut être « favorite »
(par défaut). Le bureau utilise typiquement 2 présentations (une « MO » pour le maître
d'ouvrage, une « travail »).

### 5.2 Champs (clé JSON source → libellé FR)
| Clé (`Estimate`/`Display`) | Libellé |
|---|---|
| `kvCoverTitle`, `kvDocTitle`, `kvOneDigitTitle`, `kvTwoDigitTitle`, `kvDescTitle` | Page de garde · Document principal · Devis à 1 chiffre · Devis à 2 chiffres · Descriptif (titres) |
| `includeKvCover`, `coverKvEmptyPages` | Afficher la page de garde · Pages vides |
| `includeKvOneDigit` / `includeKvTwoDigit` (+ `…EmptyPages`) | Afficher le récapitulatif à 1 / 2 chiffres |
| `includeDocument` | Afficher le document |
| `includeKvInformation` | Informations |
| `precision` | Marge d'approximation du DG |
| `index`, `projectState`, `plannigState` | Indice · Etat du projet · Etat de planification |
| `freeText1..5` | Texte libre 1…5 |
| `referProcToTot` | Pourcentage sur le groupe principal / sur le total général (radio) |
| `round` | Arrondi (5 centimes) |
| `separateVat` | Séparer la TVA |
| `displaySubprojects`, `displaySubprojectNames` | Afficher les ouvrages · Afficher les noms des ouvrages sous informations |
| `onlyThreeDigits` | Seulement positions de 1 à 3 chiffres |
| `displayComment`, `commentInColumn` | Base et commentaire de la position · … dans colonne séparée |
| `displayDescription`, `compactDescription` | Intégrer le descriptif · Assembler les descriptifs des ouvrages |
| `displayPosOptions` | Afficher les positions à exclure |
| `displayDeviation` | Afficher les pourcentages |
| `displayPriceBase` | Bases de prix |
| `displayDetailOptions`, `displayQuanPriceValue`, `displayDetailValues`, `displayDetailComment`, `dispalyCalcualtion` | Variantes · Quantités, prix et montants · Montants détaillés · Commentaire du calcul · Afficher le calcul |
| `dispalyEmptyPositions`, `dispalyAfterComma` | Afficher les positions sans montant · Ne pas afficher les décimales |
| `dispalyRound10/100/1000`, `specialRound` | Arrondir à 10 / 100 / 1000 · Choix d'arrondis |
| `hierarchicalAdjust`, `lightHierarchicalAdjust` | Décaler les montants · Décaler légèrement les montants |
| `standard`, `zebra`, `titlePosBold`, `detailItalic`, `grayDetails` | Sans formatage de ligne · Fond alterné · Titres en gras · Détails en italique · Détails en gris |
| `underlineOneDigit`/`underlineTwoDigit`, `oneDigitThickness`/`twoDigitThickness`, `oneDigitColor_RGB`/`twoDigitColor_RGB` | Trait sous les positions à 1 / 2 chiffres · Épaisseur · Couleur |
| `titleFontSize`, `posFontSize`, `detailFontSize`, `rowHeigth`, `titleFontName`, `standardFontName`, `detailFontName` | Police des titres / des positions / des informations détaillées · Interligne · polices |
| `kagNumberColTitle`, `kagTextColTitle`, `commentColTitle`, `valueColTitle`, `value1..4ColTitle`, `subprojectColTitle`, `locationColTitle`, `devColTitle`, `honorProcTitle`, `honorSumTitle`, `infoNameColTitle`, `infoDescColTitle` | Titres de colonnes (défauts : `CFC`, `Texte`, `Commentaire`, `Montant`, `à 1 chiffre`…`à 4 chiffres`, `OUV`, `LOC`, `[%]`, `% soumis`, `Montant soumis`, `Nom`, `Description`) |
| `templateId` | Modèle (gabarit de page) |

---

## 6. STRUCTURE DES DONNÉES D'UN DEVIS (déduite des JSON)

### 6.1 Stockage DELTAproject
- Ligne de table `COSTESTIMATEDOCUMENT` (métadonnées, § 1.2).
- Fichier `…/Construction/Costestimate/<PROJECT_ID>/<DOCUMENT_ID>/costestimate` : objet Java
  sérialisé `deltaproject.costestimate.data.Estimate` (≈ 60-310 Ko).
- `costestimateDESC` (même dossier) : flux binaire **non-objet** (écrit à la main) contenant les
  **descriptifs** : `int version (=4)`, `int nbPositions`, puis par position :
  `String numéroCFC`, `int nbOuvrages`, puis par ouvrage un drapeau booléen « a un descriptif »
  et, si vrai, le texte (`String`) suivi de ses attributs de mise en forme (liste de segments
  avec `java.awt.Color`, gras/italique/souligné). → le convertisseur générique échoue
  (`OptionalDataException`) ; il faut un lecteur dédié (lire séquentiellement `readInt/
  readObject/readBoolean`) et ne garder que le texte brut (+ éventuellement gras).
  → format exact au § 9.5, lecteur `lire_desc()` dans `outils_deltaproject/convertir_devis.py`.
- Copies horodatées `costestimate_JJ.MM.AAAA HH.MM` (+ `…DESC`) = historique automatique ;
  `costestimatetemp` = sauvegarde temporaire. Ne convertir que `costestimate`.
- Dossier `documents/` = PDF joints (« Fichiers PDF et pièces jointes au document »).

### 6.2 Classes Java et champs utiles
```
Estimate (racine)
 ├─ bkpList : [BkpItem]            ← liste PLATE de toutes les positions (totalisateurs inclus)
 ├─ introDescList : [IntroDesc{name, desc}]        ← remarques préliminaires
 ├─ prefsList : [KvDisplaySettings{name, isFavorite, display: Display, pageBreakList:[PageBreak]}]
 ├─ filterFavoritesList : [FavoriteFilterItem{name, isFavorite, supProjects:[SubProjectItem(to, lg, scale, apply)], bkpFrom, bkpTo}]
 ├─ descSettings : DescDisplaySettings   honorarSettings : HonorarDisplaySettings
 ├─ round, referProcToTot, separateVat(ignoré), precision, index, projectState, plannigState,
 │  freeText1..5, kv*Title, date, stateDocCode, displayMode + copie des champs Display
 └─ calcList : (même objet que bkpList vide — inutilisé)

BkpItem (position CFC)
   number "211.6" · text "" (inutilisé) · text1 (désignation, ligne 1) · text2 (suite, ligne 2)
   isGenerated (true = totalisateur créé automatiquement) · isCostPosition (toujours false)
   priceState : 0 = totalisateur / vide · 1 = saisie « Inclure » · 2 = saisie « Exclure »
   calcList : [CalcItem]           ← lignes si le devis n'a PAS d'ouvrages
   kvSubProjectList : [SubProjectItem]  ← une entrée par ouvrage si devis AVEC ouvrages
   kvTotal (TTC) · kvExVat (HT) · kvVat · percentage (% du groupe 1 chiffre)
   optionValue / optionExVatValue (montants « Exclure » cumulés)
   honorarFactor (% soumis) · honorar (montant soumis HT) · honorarValue (toujours 0)
   fixedValue / fixedVatFactor (Fixer le coût) · isDefinitif · comment
   isPageBreakBefore / isTwoDigitPageBreakBefore (inutilisés ; sauts dans les présentations)
   entrepreneurList, subProjectList (vides dans le DG)

SubProjectItem (partie d'une position pour un ouvrage)
   to (code ouvrage) · lg (code localisation, toujours "") · dbId (= SUBPROJECT.ID)
   priceState (0/1/2 comme ci-dessus) · calcList : [CalcItem]
   kvTotal · kvExVat · kvVat · percentage · optionValue · optionExVatValue
   honorarFactor · honorar · fixedValue · fixedVatFactor · isDefinitif · comment
   scale (facteur 1.0) · apply (inclus) — utilisés par les filtres
   (+ nombreux champs du contrôle des coûts vides : contractList, awardList, measureList,
    prognoseList, mut1List… → ignorer)

CalcItem (ligne de calcul)
   comment · equation (formule texte) · quantity · measUnit · price (HT)
   vatFac (taux %, ex. 8.1) · exclVatValue (HT) · vatValue · total (TTC)
   option (true = ligne « Var », non comptée) · priceBaseState (−1 ou 1..5)

PageBreak : number (CFC) · oneDigitBreak · twoDigitBreak · allDigitBreak · allreadySet
```
Invariants vérifiés sur 3 devis : Σ lignes non-Var = total de la partie (0 écart sur 395
parties) ; Σ parties = total de la position ; Σ enfants = total du parent ; les totalisateurs de
haut niveau (1-2 chiffres) n'ont **pas** de `kvSubProjectList` (listes vides) — leurs montants
par ouvrage se recalculent.

### 6.3 Schéma JSON cible proposé pour DeltaSub (indicatif — voir le § 9, qui fait foi)
Métadonnées dans la collection `costestimatedocument` (colonnes Derby). Contenu dans une
collection `costestimate` (1 objet par document), en camelCase, **sans champs calculés
obligatoires** (les totaux sont recalculés ; `cache` facultatif pour les listes rapides).

```json
{
  "DOCUMENT_ID": 7751,
  "PROJECT_ID": 3601,
  "schema": 1,
  "catalogue": "CFC",
  "reglages": {
    "arrondi5ct": true,
    "pourcentageSur": "groupe",
    "marge": "±15%",
    "indice": "",
    "etatProjet": "",
    "etatPlanification": "",
    "textesLibres": ["", "", "", "", ""],
    "titres": { "garde": "DEVIS GENERAL", "document": "Devis général",
                "unChiffre": "Devis général", "deuxChiffres": "Devis général",
                "descriptif": "Devis général" }
  },
  "ouvrages": ["OUV1", "OUV2"],
  "positions": [
    { "cfc": "211", "texte": "Travaux de l'entreprise", "texte2": "de maçonnerie",
      "genere": true },
    { "cfc": "211.6", "texte": "Maçonnerie", "texte2": "",
      "genere": false,
      "mode": "inclure",
      "honorPct": 0,
      "commentaire": "",
      "definitif": false,
      "fixe": null,
      "parts": [
        { "ouv": "OUV1", "lg": "", "descriptif": "",
          "lignes": [
            { "commentaire": "Mur a", "base": null, "formule": "0.94*2.5",
              "qte": 2.35, "unite": "m2", "prixHT": 185.00, "tva": 8.1,
              "var": false, "ttc": 470.00 }
          ] },
        { "ouv": "OUV2", "lg": "", "descriptif": "", "lignes": [] }
      ] }
  ],
  "remarques": [ { "nom": "Devis général", "texte": "…" } ],
  "presentations": [
    { "nom": "Standard", "favori": true,
      "options": { "…": "clés du § 5.2, noms d'origine conservés" },
      "sautsDePage": [ { "cfc": "224", "niveau": "tous" } ] }
  ],
  "filtres": [
    { "nom": "Filtre A", "ouvrages": [ { "ouv": "OUV1", "actif": true, "facteur": 1 } ],
      "cfcDe": "", "cfcA": "" }
  ],
  "cache": { "totalHT": 0, "totalTVA": 0, "totalTTC": 0, "honoraires": 0, "calculeLe": "" }
}
```
Règles du modèle :
- **Devis sans ouvrages** : `parts` contient **une seule** partie `{ "ouv": null, … }`.
- Positions totalisatrices : pas de `parts` (ou vide) ; `genere` = créé automatiquement
  (supprimable si plus d'enfant).
- `mode` : `"inclure"` | `"exclure"` ; `base` : `null | "offre" | "prevision" | "calcul" |
  "estimation" | "supposition"`.
- `ttc` de ligne stocké car il peut être saisi en TTC (arrondi) ; `prixHT` et `qte` stockés ;
  `ht` et `tvaMontant` recalculés.
- `fixe` : `null` ou `{ "ttc": 50000, "tva": 8.1 }`.
- Descriptif : au niveau de la partie (DELTA le stocke par position × ouvrage) ; texte brut
  (mise en forme riche optionnelle : `descriptifHtml`).

### 6.4 Règles de conversion Java → DeltaSub
| Source | Cible | Règle |
|---|---|---|
| `COSTESTIMATEDOCUMENT.*` | `costestimatedocument` | copie colonne à colonne |
| `Estimate.round` | `reglages.arrondi5ct` | direct |
| `Estimate.referProcToTot` | `reglages.pourcentageSur` | `true`→`"groupe"` (constaté : `percentage` des 1-chiffre = 100), `false`→`"total"` — à valider visuellement |
| `precision, index, projectState, plannigState, freeText1..5, kv*Title` | `reglages.*` | direct |
| `Estimate.separateVat` | — | ignorer (prendre `ISVATSEPARETED`) |
| codes `SubProjectItem.to` distincts (ordre de la 1ʳᵉ position qui en a) | `ouvrages[]` | libellés via `SUBPROJECT` (`dbId`) |
| `BkpItem` | `positions[]` | 1 pour 1, ordre de `bkpList` (déjà trié) |
| `number, text1, text2, isGenerated` | `cfc, texte, texte2, genere` | trim de `text2` |
| `priceState` (BkpItem, sinon max des SubProjectItem) | `mode` | 2 → `"exclure"`, sinon `"inclure"` |
| `honorarFactor` | `honorPct` | direct (0 = non soumis) |
| `comment, isDefinitif` | `commentaire, definitif` | direct |
| `fixedValue≠0` | `fixe` | `{ttc: fixedValue, tva: fixedVatFactor}` |
| `BkpItem.calcList` non vide | `parts=[{ouv:null, lignes}]` | devis sans ouvrages |
| `kvSubProjectList[i]` | `parts[i]` | `ouv=to`, `lg=lg`, `lignes=calcList` ; conserver les parties vides pour garder l'ordre des ouvrages |
| `CalcItem` | ligne | `comment→commentaire`, `equation→formule`, `quantity→qte`, `measUnit→unite`, `price→prixHT`, `vatFac→tva`, `option→var`, `total→ttc`, `priceBaseState: -1→null, 1 offre, 2 prevision, 3 calcul, 4 estimation, 5 supposition` |
| `introDescList` | `remarques` | `name→nom`, `desc→texte` ; ignorer les entrées vides (`name` et `desc` blancs) |
| `prefsList` | `presentations` | `display` recopié tel quel dans `options` ; `pageBreakList` → `sautsDePage` (`allDigitBreak`→`"tous"`, `twoDigitBreak`→`"2"`, `oneDigitBreak`→`"1"`) |
| `filterFavoritesList` | `filtres` | `supProjects[].to/apply/scale` → `ouv/actif/facteur` |
| `costestimateDESC` | `parts[].descriptif` | lecteur dédié, par (CFC, ouvrage) |
| `kvTotal, kvExVat, kvVat, percentage, optionValue, honorar` | — | **ne pas importer** ; servent de contrôle : après recalcul DeltaSub, écart toléré ≤ 0.05 CHF par position, sinon journaliser |

Outil de conversion : réutiliser `Ser2Json.java` (lecture seule) puis un script Python/JS de
projection vers le schéma ci-dessus ; traiter les 130 documents non supprimés.

---

## 7. SOUMISSIONS (DELTAsoumission) — p. 53-75

> Licence : le contenu des catalogues CAN (textes d'articles, textes indicatifs, prix du manuel
> CRB, données PRD, éco-devis) est protégé et **ne doit pas être reproduit** dans DeltaSub.
> Seules les structures d'écran et les articles/chapitres **de réserve** (texte propre au bureau)
> peuvent l'être. Rappel : 0 soumission existante au bureau.

### 7.1 Liste des soumissions (domaine « Soumission »)
Colonnes (p. 53) : `CFC | (lot) … | Nu[méro de l'ordre] | Utilisateur | Date | Version |
N° de version | Statut | Stade actuel | Note`. Barre : `+`, copier, crayon ▾, `−`, roue ▾,
filtre ▾.
- **Sélection des standards CRB** (à la création) : « Sélectionnez le format IFA et le catalogue
  des articles normalisés (D = NPK, F = CAN, I = CPN) » ; `Document selon` (•) `IFA 1992` /
  `IFA 2018` ; `Catalogue` [CAN] ; « Ce choix ne peut pas être modifié ultérieurement. »
- **Editer la soumission** : `Lot d'adjudication` [CFC] [désignation] [bouton …] ; `Numéro de
  l'ordre` ; `Version` / `N° de version` ; `Standard CRB` (lecture) / `Catalogue` (lecture) ;
  `Statut` [Brouillon|Provisoire|Validé|Annulé] ; `Date` ; `Stade actuel` [Appel d'offres,
  Soumissionnaires, Comparatif bref, Comparatif, Offre, Contrat, Métré, Descriptif type,
  Estimatif] ; `Utilisateur` ◀ ; `Note`.
- Table `DEVISDOCUMENT` : `ID, NOTE, VERSION, USERID, VERSIONNUMBER, STATECODE,
  DOCUMENTSTATECODE (stade), CHANGEDDATE, BKP, PROJECT_ID, AWARDINGTEXT, ORDERNUMBER,
  ISIFA2018, NORMPOSITIONCATALOGCODE, ISMARKEDASDELETED`.

### 7.2 Fenêtre de soumission (disposition commune)
- Titre : `<n° affaire> <lot> <désignation>`. Menus `Fichier | Paramètres`.
- Colonne gauche = **étapes** (MenuTree) : `APPEL D'OFFRES`, `SOUMISSIONNAIRES`,
  `COMPARATIF BREF`, `COMPARATIF`, `OFFRE`, `CONTRAT`, `MÉTRÉ`, `DESCRIPTIF TYPE`
  (+ `ESTIMATIF`, `PARAMÈTRES`). Chaque étape a « Editer » / « Documents » (et « Négociation »,
  « Courriers de refus », « Lettres d'accompagnement » selon l'étape).
- Zone centrale gauche = **catalogue** : liste `CAN` ▾ / `Chap…` ▾ / `Perso` ▾, année ▾
  (ex. 2018), import ▾ (`Mise à jour du CAN …`, `Mise à jour la liste du CAN …`,
  `Copyright …`), recherche ; liste des chapitres `CAN | Texte` ; navigateur à deux listes
  (`N° | Chapitre` puis `N° | Article`/`Position`) + texte du chapitre (colonnes marge : `h`
  texte indicatif, `E`/`e` éco 1ʳᵉ/2ᵉ priorité, `R` réserve, `PRD` produits, `I` info éco).
- Zone droite = **descriptif** ; barre : `+` ▾, import ▾, crayon ▾, `−` ▾, tableau ▾, export ▾,
  entonnoir ▾, pinceau ▾, document ▾, lune ; bouton plein écran.
  Colonnes : `S | C | P | S | V | Texte | D | <subdivisions…> | U | G | Quantité | P | Prix |
  Montant` (S = marque réserve « R » ; C chapitre ; P article principal ; S sous-article ;
  V variable ; D documents ; U unité ; G genre de quantité ; P genre de prix).
  Au comparatif : `… | Quantité | Entreprise | P | Prix | Montant` avec une ligne par entreprise.

### 7.3 Menus du descriptif
- `+` ▾ : `Article de réserve …` · `Créer le chapitre de réserve …` · `Créer un article de
  répétition …`
- import ▾ : `Importer le chapitre des conditions générales <10R>…` · `Importer un descriptif …`
  · `Importer un paragraphe …` · `Import SIA451 …`
- crayon ▾ : `Modifier l'article …` · `Quantité …` · `Modifier le métré …` | `Prix …` ·
  `Conditions …` | `Configurer les subdivisions …` · `Définir les variantes…` · `Editer le CFC …`
  | `Insérer une subdivision …` / `Insérer des subdivisions (pour tous les articles) …` ·
  `Modifier les subdivisions …` | `Convertir le descriptif (année) …`
  (au comparatif : `Prix des entreprises …`, `Evaluation …`, `Information de l'entreprise …`)
- tableau ▾ : `Standard` · `Texte abrégé` · `Mots-clés` | `Uniquement les articles avec
  quantité` · `Afficher les graphiques` · `Afficher les produits` | `Tri du descriptif…` ·
  `Ordre des subdivisions…` · `Aller à l'article` ▸
- document ▾ : `Page de garde …` · `Récapitulatif …` · `Récapitulatif par chapitres …` ·
  `Récapitulatif par subdivisions …` · `Récapitulatif par paragraphes …` · `Descriptif …` |
  `Composition du cahier …` · `Cahier …` | `Export SIA451 …` · `Exporter les documents et les
  images …`
- export ▾ (comparatif) : `Créer le contrat` · `Créer le métré` | `Créer le descriptif type`
  (au contrat : `Créer le métré` · `Créer le descriptif type`).

### 7.4 Préférences du catalogue (« Préférences »)
`Couleur des textes dans le CAN et le descriptif` → `Couleur du texte` [pastille] `Remarque …`
· `Afficher les images dans le catalogue CAN` ☐ `Images` · `Présentation` ☐ `Afficher les
produits` ☐ `Afficher les articles eco` ☐ `Afficher les corrections` · `Transfert des articles`
☐ `Ouvrir la fenêtre de l'article` · `Document Indications générales` ☐ `Ouvrir le document
Indications générales automatiquement`.

### 7.5 Produits PRD, éco-devis, texte indicatif (P3 — services CRB en ligne)
- « Produits PRD à choix pour : <article> » + `Nombre de produits: n` ; colonnes `Produit |
  Société | Info | (icônes) | Lien | Lien` ; image + logo ; « Double-cliquez sur une image pour
  obtenir les informations. » ; `Fermer`.
- « Produit » : `Description du produit` ⓘ · `Produit sur plateforme PRD` ↗ · ☐ `L'entreprise
  peut utiliser un produit équivalent` · `Fabricant / Fournisseur` · `Textes spécifiques au
  produit` · `Images du produit` (☐ Sélectionner) · `Documentation du produit` (listes
  `Description | Dessin technique, CAD, BIM | Certificats | Autres documents | Appel d'offres`,
  colonne `M`) · ☐ `Intégrer seulement…`.
- « Evaluation éco-devis » : `L'évaluation écologique de l'article éco-devis <n>` ;
  `Critère | Valeur` ; zone texte ; `Fermer`.
- « Texte indicatif » : zone de texte ; `Fermer`.

### 7.6 Articles, variables, réserve, répétition
- **Editer l'article** : titre `Article <P.S V>` ; à gauche le texte (éditable seulement dans
  les parties en couleur ; point d'insertion du texte de l'entrepreneur marqué `*`) + boutons
  roue ▾ (`Sélectionner le point d'insertion`) et ⓘ (navigateur d'articles / normes) ; au centre
  `Catégorie` : `Quantité` · `Document(s)` · `Images`/`Croquis` (+ ▾) ; à droite, pour
  `Quantité`, tableau `[GV | Var |] [Local/OUV…] | U | GQ | M | Quantité | GP | Prix | Montant`
  avec `+`▾ `✎`▾ `−`▾ roue ▾ (`Remarque concernant le prix…`, `Modifier le code de calcul`,
  `Numéro courant …`) et ⇈ ↑ ↓ ⇊ ; ☑ `Prix identique pour tous les ouvrages` ;
  `Mots-clés pour <art>` [texte ≤ 30 car.] ◀ ; ☑ `Utiliser la première ligne du texte comme
  mot-clé` ; `Annuler` / `OK`. Pour `Documents` : `Name | Dateiname | Position` (+ ⓘ pour
  rouvrir). Jusqu'à 100 images/documents par article (png, jpg ; PDF/Word conseillés).
- **Navigateur** (« Cet article a déjà été utilisé comme suit. ») : `N° d'affaire | Désignation
  … | Statut | Stade actuel | Vergabe | Quantité | Prix` + aperçu du texte ; `Fermer`.
- **Conditions et normes** : listes `Conditions contractuelles` / `Normes des associations
  professionnelles` (`Nom`, cases à cocher) → deviennent le texte de l'article de réserve
  (> 99 lignes : découper en variables).
- **Article de réserve** : « Article de réserve pour <P.S> » ; tableau `C | P | S | V | Text | U`
  (nouvelles lignes en rouge, `??` = unité à choisir) ; `Catégorie` : `Articles principaux` /
  `Sous-article` / `Variable` ; liste `Article` des numéros libres (ex. `311.900…311.9xx`) ;
  `−` ▾ ; `Annuler` / `OK`.
  Règles CAN à contrôler : (1) chapitres/articles principaux contenant un 0 → pas de quantité ;
  (2) au moins un chiffre 9 là où le CAN n'en prévoit pas (chapitre, 2ᵉ/3ᵉ chiffre de l'article
  principal, 1ᵉʳ/2ᵉ chiffre du sous-article) ; (3) chapitres/paragraphes/sous-paragraphes sans
  quantité ; (4) sous-article se terminant par 0 → pas de quantité. Chapitres de réserve :
  contiennent un 9, jamais dans 000-099 ni 800-899 ; tri croissant.
- **Créer un article de répétition** : `Article de répétition (dito) <chap> <art>` ▲▼ ;
  tableau `V | Texte | A | ✓` ; ☐ `Copier le texte` ; `Annuler` / `OK`. Notation catalogue
  « à .129 dito 122 ».
- Variables alternatives : lettre majuscule après le texte ; mêmes lettres = mutuellement
  exclusives. Article 000 obligatoire ; 000.200 variable 01 (règles ABB) ou 02 (réserve 090).

### 7.7 Subdivisions, variantes, tri
- **Subdivision et tri** : liste à gauche `Combinaison des subdivisions` · `Ouvrage` · `Type
  d'équipement` · `Subdivision par affectations` · `Subdivision par locaux` · `Coûts par
  éléments` · `Nature des coûts (CFC)` ; à droite, p. ex. « Ouvrages dans le descriptif »
  `Ouvrage | Texte | Localisation | Texte`, ou « Subdivisions pour la saisie des articles. »
  `Nature des … | Ouvrage | Localisation | Coûts par él… | Type d'équi… | Subdivision par
  locaux | Subdivision par affectat…` ; `+`▾ ✎ `−` ⇈↑↓⇊ ; ☑ `Insérer automatiquement les
  subdivisions` ; `Annuler` / `OK`.
  Abréviations : RNF (nature des coûts/CFC), OUV (ouvrage), LOC (localisation), CFE (coûts par
  éléments), TE (type d'équipement), Affectations (SpA), Locaux (SpL). Code + texte court ;
  code complémentaire ≤ 16 car. pour RNF et CFE.
- **Référence article CRB** : « Référence articles valides CRB » `RNF | OUV | LOC | CFE | TE |
  GV | Var | Local | Affectat…` ; boutons + ✎ − ⇈↑↓⇊.
- **Définir les variantes** : `Groupes de variantes` (`Code | Texte`) et `Variantes`
  (`Code | Texte | M` — M ✓ = variante **primaire**, une seule par groupe) ; boutons + ✎ −
  ⇈↑↓⇊ ; `Fermer`. Choix dans la colonne `GV` de l'article (menu groupe ▸ variante).
  Variantes éventuelles : montants entre parenthèses à l'impression, non comptés.
- **Tri** : « Tri du descriptif » (•) `Chapitre` · `Chapitre (CFC)` · `Ouvrage` · `Plan
  comptable (CFC)` · `Coûts par éléments` · `Subdivision par locaux` · `Subdivision par
  affectations` · `Type d'équipement` (tri CFC → définir d'abord la correspondance CAN/CFC via
  `Editer le CFC …`).
- **Ordre des subdivisions** : liste réordonnable `Texte`, `Plan comptable (CFC)`,
  `Ouvrages`, `Localisations`, `Coûts par éléments`, `Type d'équipement`, `Groupes de
  variantes`, …

### 7.8 Genres de quantité (GQ) et genres de prix (GP)
| GQ | Libellé (dialogue « Quantités ») | Compté |
|---|---|---|
| A | Avant-métré établi par le concepteur | oui |
| B | Quantité fixe établie par le concepteur | oui |
| D | Avant-métré sur ordre du concepteur | oui |
| W | PAR (article « par », sans quantité ; ne doit contenir aucun métré) | non |
| J | Article éventuel avec avant-métré établi par le concepteur, comptabilisé (var. primaire) | oui |
| K | Article éventuel avec quantité fixe établie par le concepteur, comptabilisé (var. primaire) | oui |
| M | Avant-métré établi selon les instructions du concepteur, comptabilisé (var. primaire) | oui |
| Q | Article éventuel avec avant-métré établi par le concepteur, non-comptabilisé | non |
| R | Article éventuel avec quantité fixe établie par le concepteur, non-comptabilisé | non |
| U | Avant-métré établi selon les instructions du concepteur, non-comptabilisé | non |

| GP | Libellé court (liste) | Sens (manuel / dialogue Prix) |
|---|---|---|
| A | A Métré | Prix de l'offre de l'entreprise (standard) |
| F | F Prix fixe | Prix indicatif établi par le concepteur (non modifiable par l'entreprise) |
| I | I Inclus | Compris dans l'offre |
| N | N Pas offert | Non compris dans l'offre |
| R | R Régie | Régie : montant = quantité × prix de la quantité partielle |
| G / K / P | G Global · K Gratuit · P Forfaitaire | (liste IfA 2018) |

Montant d'une quantité partielle = `quantité × prix` si GQ compté et GP ∈ {A, F, R, G, P} ;
0 pour I, N, K ; exclu du total si GQ ∈ {W, Q, R, U} (affiché entre parenthèses pour Q/R/U).
Fenêtre « Quantités » : `Article`, `Genre de quantité`, `Quantité`, `Métré`, ☐ `Appliquer un
facteur` / `Facteur`, `Saisir`, `Total` ; navigation.

### 7.9 Métré (quantité détaillée) — fenêtre « Article <n> » / « Métré » / « Avant-métré »
Colonnes : `* | N° | Date | Commentaire | Formule | Quantité | Sous-total | ✓` ; volet droit
favoris `Nom | U | Quantité` (+ ✎ − import roue) ; boutons `+`, `−`▾ (`Supprimer la ligne de
calcul`, `Supprimer toutes les lignes de calcul`), `Res`, `r`, `r5` ; `Total des quantités` ;
`Annuler` / `OK`.
Règles :
- chaque ligne : formule ≤ 30 car., commentaire ≤ 60 car. (formule + commentaire ≤ 90) ;
  ≤ 99 lignes ; numéros croissants ; commentaire entre crochets autorisé dans la formule
  (`[paroi a] + (11+5.6)*2.8*0.25 [paroi b]`) ;
- opérateurs `+ - * / ^`, parenthèses, fonctions `sin cos tan cotan sqrt ceil floor fac abs`,
  constante `pi` ; nombres négatifs avec `-` ;
- `✓` (colonne de droite) = afficher le **sous-total** cumulé à cette ligne ;
- `Res` : ajoute une ligne de réserve (marque `+`) avec un **facteur** (0.05 = 5 %) appliqué à
  la somme des lignes précédentes ; `r` : arrondi au prochain entier (marque `R`) ; `r5` :
  arrondi au prochain multiple de 5 (marque `R5`) ; ces lignes doivent être supprimées avant
  modification (« Vous devez préalablement effacer les réserves et les arrondis. ») ;
- total = Σ lignes (+ réserve) puis arrondi éventuel ; SIA451 ne transmet ni réserve ni arrondi ;
- favoris de métré réutilisables et importables d'autres descriptifs ; au type « Métré », colonne
  `Quantité du contrat` pour comparaison.
Classe `Ausmass{id, number, date, comment, equation, quantity, betweenTotal, siaLineNumber}`,
genres `'' standard | S rue | + réserve | R arrondi | R5 arrondi 5`.

### 7.10 Conditions (fenêtre « Conditions »)
- En-tête : titre de la section (`Conditions appel d'offres` / `offre` / `comparatif` /
  `contrat` / `métré` / `descriptif type`), champ `Brut` en haut à droite.
- Tableau : `ID | Niveau | Réf. | Texte | Genre | Jours | OUV | Condition | Montant | S-T |
  M S-T | M`
  - `ID` numérique croissant (001, 002…) ; `Niveau` = ordre de calcul ; `Réf.` = niveau de
    référence (0 = total brut) ; `Texte` ≤ 30 car. ; `Genre` (liste) ; `Jours` = délai d'escompte ;
    `OUV` = subdivision visée (liste des ouvrages, vide = tout) ; `Condition` = % (2 décimales)
    ou montant ; `Montant` calculé ; `S-T` = sous-total cumulé ; `M S-T` = afficher le sous-total ;
    `M` = prendre en considération.
- Bas : `+`▾ (`Nouvelle condition`, `Copier les conditions`, `Coller les conditions`,
  `Transférer les conditions dans l'offre négociée`), `−`, roue ▾ ; `Net` ; boutons `Fermer` /
  `Calculer`.
- Genres (enum `ConditionKind`, code → libellé liste) : 0 `Déduction` · 1 `Rabais` · 2 `TVA` ·
  3 `Escompte (%)` · 4 `Escompte (-)` · 5 `Retenue (%)` · 6 `Retenue(-)` · 7 `Autres (%)` ·
  8 `Autres (-)` · 10 `Forfaitaire` (« Net - arrêté à »). Abréviations affichées dans la colonne
  (observées) : `%` rabais, `S%` escompte %, `U%` autres %, `M` TVA, `P` déduction forfaitaire.
- Algorithme :
  1. `Brut` = Σ montants des articles (par OUV aussi).
  2. Pour chaque condition dans l'ordre des niveaux : base = sous-total **au niveau `Réf.`**,
     restreint à l'ouvrage `OUV` s'il est renseigné ; `Montant = base × Condition / 100`
     (genres %) ou `= Condition` (genres « (-) »/forfait) ; `S-T` = S-T précédent + Montant.
  3. Une déduction forfaitaire globale est **répartie au prorata** des ouvrages pour les
     conditions suivantes restreintes à un ouvrage (vérifié sur l'exemple p. 73 : brut 4'000 =
     2 × 2'000 ; −10 % OUV a1 → −200 ; −10 % a2 (réf 0) → −200 ; −10 % a1 (réf 2) → −180 ;
     −10 % a2 → −180 ; −2'000 forfait → 1'240 ; −10 % a1 (réf 5) → −62 ; −10 % a2 → −62 ;
     Net 1'116.00).
  4. TVA obligatoirement en **dernier** ; plusieurs taux consécutifs, tous référencés au niveau
     qui précède la première TVA ; un taux n'apparaît qu'une fois.
  5. Contrôles (messages) : « Le taux de TVA ^0 ne peut être utilisé qu'une seule fois »,
     « Les lignes de TVA doivent se suivre directement. », « Toutes les lignes de TVA doivent
     toujours se référer à la dernière ligne précédant la TVA », « Le niveau de référence de la
     condition ^0 est incorrect. », « Deux ID-conditions ne peuvent pas être identiques. »,
     « Le tri des ID-conditions doit être en ordre ascendant. », « L'ID doit être numérique. »,
     « Il y a des montants sans TVA: ^0 ».
  6. Conditions liées aux subdivisions : seules CFC et ouvrages sont acceptées en IfA 18.
- Au comparatif : liste `Entreprises` à gauche, deux tableaux `Conditions offre` (→ `Net offre`)
  et `Conditions offre négociée` (→ `Net offre négociée`).
- Classe `Condition{order, number, step, refStep, kind, text, apply, applyBetweenTotal, fac,
  value, total, ogCode, kagCode, locCode…, termOfPayment}`.

### 7.11 Remarques préliminaires facultatives (descriptif)
Attribuables à une subdivision (valables pour elle seule) et, « significatives quant au prix »,
à chaque quantité partielle d'un article (classe `DivRemark` = jeu de codes de subdivision).

### 7.12 SIA451
- **Export Sia451** : `Statut du document` [Document validé (standard)…] ; `Version précédente`
  [Modification…] ; `Version du document` ; `Société` ◀ ; `Responsable` ; ☐ `Exporter les
  conditions` ☑ `Exporter les quantités` ☐ `Exporter le métré` ☑ `Exporter les prix` ☐ `Filtrer`.
- **Import Sia451** : blocs `Expéditeur` (Société, Responsable, Téléphone, Courriel), `Affaire`
  (Numéro, Nom, Unité d'adjudication, Désignation), `Document` (Statut, Version précédente),
  `Type de document d'import` (actuel ; `Nouveau type de document` [Comparaison des offres…]),
  `Comparaison des offres` → `Entreprise` [liste] ; ☑ `Importer les conditions / les quantités /
  les prix / le métré` ☐ `Filtrer` ; `Rapport de modification` ; `Annuler` / `OK`.
- Images, produits et documents sont embarqués dans le fichier. Priorité P3 (format CRB,
  lecture seule éventuelle pour importer des offres d'entreprises).

### 7.13 Soumissionnaires
Tableau `Entités | Responsable` (entreprise « (+) » = proposée) ; fiche `Entité` ⓘ /
`Responsable` ⓘ avec téléphone ; barre `+`▾ ✎▾ `−` pinceau document roue lune. Documents :
lettre d'accompagnement, liste des soumissionnaires. Source : `PROJECTTENDERER` (BKP,
CONTACT_ID, RESPCONTACT_ID, ISACCEPTED, NOTE).

### 7.14 Comparatif
- Descriptif avec, sous chaque quantité, une ligne par entreprise `Entreprise | P | Prix |
  Montant` (moins-disant en vert).
- **Prix** : liste `Enterprise` à gauche ; `Article <chap> <art> | <sous-quantité>` + texte ;
  `Quantité` + unité ; `Genre de prix` [Prix de l'offre de l'entreprise…] ; `Prix` ☑ `Prix
  identique pour les ouvrages` ; `Facteur` ☐ `Appliquer un facteur` ; `Total` ; `Total`
  ☐ `Calculer le total cumulé` ; loupe, ⓘ ; `Fermer` · `Conditions` · `Insérer` ;
  navigation |< < > >|.
- **Evaluation** : `Entreprises` ; `Principaux critères` `Critère | Coefficient | Evaluation |
  Points | Remarque` (ex. Prix offre 90, Expérience 5, Qualité de l'offre 5 ; ligne `Total`
  = 100) ; `Sous-critères` (mêmes colonnes) ; évaluation 1-10 ; Points = Coefficient ×
  Évaluation (à confirmer) ; tables `BIDCRITERION(GROUP)` = critères modèles.
- **Indications de l'offre** : `Total de l'offre brut`, `Genre d'offre`, `Date de l'offre`,
  `Genre de rémunération`, `Numéro de l'offre`, `Commentaire`, `Commentaire interne`.
- **Tri** (« Affichage et tri ») : « Déterminez le tri des entreprises » `Société | M` ▲▼
  ☑ `Tri automatique` (du moins cher au plus cher ; M = prise en compte).
- **Impression « Comparatif des offres »** : `Nº | Texte | Quantité | GQ | U | Prix |
  <entreprise> | [%] | …` (écart en % par rapport à la référence = 100) ; options : filtre,
  critères d'évaluation, articles représentant ≥ x % du total ; `Paramètres d'impression` →
  catégories `Modèle`, `Descriptif` (Texte : • Standard / Double / Triple largeur de texte ;
  ☐ Avec remarques préliminaires ; ☐ Imprimer les numéros des variables ; ☐ Trait sous le titre ;
  Métré : ☐ Afficher le métré ☐ Uniquement les articles avec métré ; Subdivisions : ☐ Description
  détaillée ☐ Additionner les ouvrages ☐ Masquer les ouvrages ; Articles ECO ; Comparaison des
  offres : ☐ Afficher la comparaison des offres), `Totaux`, `Police & Style`, `Format`.
- **Offre négociée**, proposition d'adjudication, courrier d'adjudication, courriers de refus :
  générés depuis le comparatif (`AwardDialog` : Entreprise, Responsable, Tél., Fax, Courriel,
  Date/Numéro de l'offre, Nombre de collaborateurs, Offre / Révisé, Total brut, Sous-total,
  Total net, Écart).

### 7.15 Comparatif bref (sans descriptif) — **seule partie soumission utile sans licence**
- Écran : liste `Société` (≈ soumissionnaires/adresses) | liste `Offre` (`Offre`, `Offre
  négociée`) | tableau `CFC | Texte | Ouvrage | Localisation | Montant` + ligne `Total`.
- Barre : crayon ▾ (`Commentaire`, `Indications de l'offre`, `Evaluation`, `Référence pour
  l'écart`, `Arrondir`, `Affichage et tri`), `+`, ✎, `−`, export ▾, clé ▾, document ▾ :
  `Vue d'ensemble …` · `Offre négociée …` · `Proposition d'adjudication …` | `Commande …` ·
  `Courrier de refus …` · `Courrier d'adjudication …` · `Transférer vers contrôle du coût …` ;
  PDF des offres reçues (`Ajouter un fichier PDF`, `Ouvrir PDF`, `Supprimer le fichier PDF`,
  `Fusionner des fichiers PDF`).
- **Conditions** (comparatif bref) : `Positions de l'offre :` `CFC | Texte | Brut | Net` +
  `Total` ; `Conditions de l'offre :` `NIV | REF | Désignation | Genre | Condition | Montant | M`
  ; liste mode de saisie (`Saisie nette` / `Saisie brute`) ; roue ▾ ; `Remarque interne` ;
  `Annuler` / `OK`. En saisie nette, le brut est recalculé à rebours à travers les conditions
  (ex. manuel : Net 37'500.00, TVA 7.7 % → Brut 34'818.94, TVA 2'681.06).
- ☐ `Avec ouvrages` : montants par CFC × ouvrage (si subdivisions définies dans l'affaire).
- Données : `DevisDocument.shortPriceCompareStructureList : [PriceCompareBkp{bkpNum, bkpText,
  subprojectList:[PriceCompareSubprojet{to, lg, dbId, entrepreneurList}], entrepreneurList}]`,
  `Entrepreneur{contactId, responsableId, bruttoValueShort, vatShort, nettoValueShort,
  …AbgebotShort, conditionListShort, abgebotConditionListShort, offerData, isProposed,
  isReference, order, display}`.

### 7.16 Transfert vers le contrôle des coûts / contrat / métré
- **Transférer vers contrôle des coûts** (depuis comparatif, comparatif bref ou contrat) :
  vers le document de contrôle des coûts au statut **« En cours »** (sinon « Il n'existe aucun
  document dont le statut est en cours. » / « … plusieurs documents … »). Champs : `Nº
  d'affaire`, `Lot d'adjudication`/`RNF`, `Texte`, `Numéro de contrat` (+ « Trouve le n° de
  contrat ou d'avenant suivant »), `Numéro d'ordre`, `Contrat pour` [entreprise],
  (•) `Contrat à prix unitaires` / `Contrat à forfait`, ☐ `Contrat prioritaire sur devis pour
  le coût probable`, `Répartir par nature des coûts` / `Répartir par ouvrages`
  (`Ouvrage/localisation`), `Brut` / `Net` / `Total`, `Commentaire`, bouton `Comptabiliser`.
  Contrôles : correspondance CFC-CAN définie, entreprise définie, ouvrages/CFC existants dans
  l'affaire, conditions transférables (pas liées à OUV/CFC), numéro de contrat unique.
- **Créer le contrat** (depuis le comparatif) : copie du descriptif + prix + documents de
  l'entreprise retenue ; ajustable.
- **Créer le métré** (depuis le contrat) : quantités remises à zéro, prix conservés ;
  impression comparant quantité métrée / quantité du contrat.
- **Créer le descriptif type** : enregistre le descriptif comme modèle.
- **Convertir le descriptif (année)** : « Seul un nouveau chapitre de la même version CAN peut
  être attribué. » `Edition` (ex. 2013) ; `Ancienne version` ; `Nouvelle version` [liste des
  versions de la même édition]. Changement d'édition impossible.
- **Saut de page** dans le descriptif : clic sur un numéro CAN dans l'aperçu.

### 7.17 Données de soumission (pour mémoire, si jamais implémenté)
`DevisDocument{doctype, entrepreneurList, offerCriteriaList, shortPriceCompareStructureList,
<étape>Unit: DevisCostUnit{chapterList:[Chapter], docDate, documentTitle, contractNumber,
…colUsed flags, sort modes}, <étape>SubDivList, <étape>VarList: [Variante{code, text1, text2,
isPrimVariante, sublist}], <étape>ConditionList: [Condition], <étape>BruttoValue, biddingKind,
dates…}` ;
`Chapter{npkNumber, npkText1/2, npkEdition, npkRevision, bkpNumber, bkpText1/2, posList:
[Position], divList, total}` ;
`Position{c, m, u, v, altVariable, measUnit, searchTitle, posText, variableList:[Variable],
divList:[Div], remarkList, addOnDocumentList, graphicList, prdList, uDescList, kag/og/lg/ekg/
space/utility/varGroup/variante/ein, ecoSign, pageBreak}` ;
`Div{kagCode, ogCode, locCode, ekgCode, spaceCode, utilityCode, varGroupCode, varianteCode,
einCode, measKind(GQ), quantity, price, vat, value, priceKind(GP), priceRelM/U, barcode,
ausmassList:[Ausmass], priceList:[Price{contactID, price, value, priceKind, dev}]}`.
Stockage sur disque : `Construction/Devis/<affaire>/<doc>/…` (vide au bureau).

---

## 8. PRIORITÉS

### P1 — indispensable (remplace l'usage réel, ~40-60 devis/an)
1. Liste des devis par affaire + fenêtre « Editer le devis général » (statuts 0-3, variantes,
   Séparer la TVA, avec/sans ouvrages, note, utilisateur, date).
2. Fenêtre principale : plan comptable de l'affaire à gauche (CFC ; eCCC-Bât si l'affaire l'a),
   devis à droite, totalisation hiérarchique, totaux HT/TTC/Honoraires, suppression avec
   sous-positions, ajout par double-clic avec création des parents.
3. Fenêtre « Calcul pour … » : lignes (commentaire, base, formule, quantité, unité, prix HT /
   saisie TTC, TVA, montant, Var), Inclure/Exclure, % soumis aux honoraires, descriptif texte,
   déplacement des lignes, copier/coller du calcul.
4. Règles de calcul du § 3.3-3.4 **dont l'arrondi 5 centimes et la saisie TTC** (40/43 devis).
5. Devis avec ouvrages (une partie par ouvrage, colonnes OUV, filtre ouvrages + facteur,
   favoris de filtre).
6. Remarques préliminaires (brancher sur la fenêtre existante, **ne pas la retoucher**).
7. Impression « Devis général » (1, 2, 3/4 chiffres, avec/sans ouvrages, HT/TVA/TTC) +
   présentations enregistrées + sauts de page — aperçus actuels à garder en l'état.
8. Import des 130 devis existants (§ 6.4) avec contrôle des totaux ; descriptifs via lecteur DESC.

### P2 — utile
9. Documents « Devis descriptif » et « Honoraires / Montant soumis ».
10. Dupliquer un devis, « Dupliquer et modifier division » (réaffectation d'ouvrages).
11. Navigateur de positions inter-affaires ; Indexer ; Modifier la TVA (passage 7.7 → 8.1) ;
    Mettre tous les montants à zéro ; Supprimer les ouvrages à 0.
12. Transfert de la variante « Validé » vers le contrôle des coûts (spec contrôle des coûts).
13. Comparatif bref (CFC × entreprises, conditions, net/brut, offre négociée, courrier
    d'adjudication/refus, transfert vers contrôle des coûts) — aucune licence CRB nécessaire.
14. Export CSV/Excel du devis (en remplacement de FastTrack).

### P3 — ne pas faire (ou beaucoup plus tard)
15. Fixer le coût, Calcul définitif, Base de prix, localisations (jamais utilisés).
16. Toute la chaîne soumission CAN (catalogues, PRD, éco-devis, textes indicatifs, articles
    CAN, conversion d'année, SIA451, comparatif détaillé, contrat, métré CAN) : 0 usage et
    **contenu sous licence CRB — ne pas reproduire les catalogues**. Si un jour nécessaire :
    ne reproduire que les structures (descriptif libre de chapitres/articles **de réserve**,
    genres de quantité/prix, métré, conditions, variantes) avec des textes propres au bureau.
17. Export FastTrack, fusion PDF, pièces jointes PDF au document.

### Points à valider avec Paulo
- Pourcentages : sur le groupe principal (valeur stockée) ou sur le total général ?
- `% soumis` : défaut 0 (fichiers réels) ou 100 (manuel) pour un nouveau devis ?
- Arrondi 5 centimes : garder la saisie TTC « ronde » comme mode par défaut ?
- Plan comptable eCCC-Bât : utilisé dans des affaires récentes (`PROJECTCATALOG` en contient) —
  à prendre en charge dès P1 ou non ?

---

## 9. SCHÉMA FINAL DeltaSub — collection `costestimate` (fait foi pour l'interface)

> Remplace le schéma indicatif du § 6.3. Produit par
> `outils_deltaproject/convertir_devis.py` (130 devis non supprimés convertis ; 130/130 totaux
> identiques à DELTA, dont 4 enregistrés avec un filtre d'ouvrages actif ; 130 fichiers
> `costestimateDESC` lus).

### 9.1 Emplacement et clé
- Collection : `costestimate` ; **id = `COSTESTIMATEDOCUMENT.ID`** (= 2ᵉ niveau de dossier
  `Costestimate/<PROJECT_ID>/<ID>/costestimate`, vérifié 221/221).
- Les métadonnées (VERSION, VERSIONNUMBER, STATECODE, CHANGEDDATE, USERID, NOTE,
  ISVATSEPARETED, ISAPPLYSUBPROJECTS, ISMARKEDASDELETED) restent dans `costestimatedocument` ;
  elles ne sont **pas** dupliquées ici (sauf `DOCUMENT_ID` / `PROJECT_ID` de contrôle).
- Fichier source = `costestimate` (version courante). Ignorer `costestimate_<date>` (historique)
  et `costestimatetemp` (sauvegarde automatique non validée).

### 9.2 Champs (noms exacts)

**Racine**
| Champ | Type | Contenu |
|---|---|---|
| `schema` | int | 1 |
| `DOCUMENT_ID` | int | = id de la collection |
| `PROJECT_ID` | int | affaire |
| `source` | objet | `fichier` (chemin DELTA d'origine), `versionJava`, `date` (date DELTA, texte), `desc` (bool : descriptifs lus), `converti` (ISO), facultatifs `alertes` [texte], `filtreActifALaSauvegarde` [codes ouvrages] |
| `reglages` | objet | voir ci-dessous |
| `ouvrages` | [objet] | `{code, SUBPROJECT_ID, lg}` dans l'ordre d'affichage ; libellés à lire dans la collection `subproject` (DESCRIPTION, LOCATIONDESCRIPTION) |
| `positions` | [objet] | liste plate, triée par CFC, totalisateurs inclus |
| `remarques` | [objet] | `{nom, texte}` (remarques préliminaires / « Informations pour le devis ») |
| `presentations` | [objet] | `{nom, favori, options, sautsDePage:[{cfc, niveau:"tous"|"2"|"1"}]}` ; `options` = clés DELTA d'origine (§ 5.2) |
| `filtres` | [objet] | `{nom, favori, ouvrages:[{ouv, actif, facteur}], cfcDe, cfcA}` |
| `cache` | objet | informatif, recalculable : `totalHT, totalTVA, totalTTC, totalExcluTTC, honoraires, nbPositions, calculeLe` |

**`reglages`** : `arrondi5ct` (bool), `pourcentageSur` (`"groupe"`|`"total"`), `marge` (ex. `"±15%"`),
`indice`, `etatProjet`, `etatPlanification`, `textesLibres` [5 textes],
`titres {garde, document, unChiffre, deuxChiffres, descriptif}`, `affichage` (options d'affichage
courantes, clés DELTA), `impressionDescriptif`, `impressionHonoraires` (clés DELTA).

**Position** (`positions[]`)
| Champ | Type | Règle |
|---|---|---|
| `cfc` | texte | `"2"`, `"21"`, `"211"`, `"211.6"` ; parent = ancêtre le plus proche présent (211.6→211→21→2) |
| `texte`, `texte2` | texte | désignation (ligne 1, ligne 2 éventuelle) |
| `genere` | bool | totalisateur créé automatiquement |
| `descriptif` | texte\|null | descriptif au niveau de la position (devis sans ouvrages) |
| `descriptifFormat` | [run]\|null | seulement si mise en forme (gras/italique/souligné/couleur) : `{t, police, taille, b, i, u, couleur}` |
| `parts` | [partie] | **vide = totalisateur** (montant = Σ enfants directs) ; sinon position saisissable |

**Partie** (`positions[].parts[]`) — une par ouvrage (devis avec ouvrages), ou une seule avec `ouv: null`
| Champ | Type | Règle |
|---|---|---|
| `ouv` | texte\|null | code ouvrage ; `null` = devis sans ouvrages |
| `SUBPROJECT_ID` | int\|null | lien `subproject` |
| `lg` | texte | code localisation (toujours "" au bureau) |
| `mode` | `"inclure"`\|`"exclure"` | « Montant de position » ; exclure → compté à part (option) |
| `honorPct` | nombre | % soumis aux honoraires (0 = non soumis) |
| `commentaire` | texte | « Commentaire de la position » |
| `definitif` | bool | « Calcul définitif » |
| `fixe` | null\|`{ttc, tva}` | « Fixer le coût » |
| `descriptif`, `descriptifFormat` | texte\|null, [run]\|null | descriptif de la position pour cet ouvrage |
| `lignes` | [ligne] | lignes de calcul, dans l'ordre |

**Ligne** (`parts[].lignes[]`)
| Champ | Type | Règle |
|---|---|---|
| `commentaire` | texte | |
| `base` | null\|`"offre"`\|`"prevision"`\|`"calcul"`\|`"estimation"`\|`"supposition"` | Base de prix |
| `formule` | texte | « Calcul de quantités » (vide si quantité saisie) |
| `qte` | nombre | quantité (résultat de la formule) |
| `unite` | texte | |
| `prixHT` | nombre | |
| `tva` | nombre | taux en % (8.1, 7.7, 0…) |
| `var` | bool | true = ligne non comptée |
| `ttc` | nombre | montant TTC **stocké, fait foi** (peut être saisi en TTC arrondi) |

### 9.3 Calcul (fonction `calculer()` du convertisseur = référence pour l'interface)
- `ht(ligne)` = `qte × prixHT` si `formule` non vide ou `qte ≠ 0`, sinon `prixHT` (forfait) —
  vérifié sur 4 509 lignes réelles, 0 exception.
- `ttc(ligne)` = champ `ttc` ; pour une nouvelle ligne : `ht × (1 + tva/100)`, arrondi à 0.05 si
  `reglages.arrondi5ct` ; en saisie TTC : `prixHT = arrondi0.05(prixTTC / (1 + tva/100))`,
  `ttc = qte × prixTTC`.
- `tva(ligne)` = `ht × tva / 100` (non arrondi).
- Partie : Σ lignes avec `var = false` ; si `fixe` : TTC imposé, HT = TTC / (1 + tva/100) ;
  si `mode = "exclure"` : montants → `optHT/optTTC`, 0 dans les totaux ; `soumis = HT × honorPct / 100`.
- Position saisissable : Σ parties (× facteur des ouvrages si filtre) ; totalisateur : Σ enfants
  directs ; total du devis : Σ positions sans parent.
- `%` : sur la position racine (groupe à 1 chiffre) si `pourcentageSur = "groupe"`, sinon sur
  le total.
- Filtre : `{code ouvrage: facteur}` ; les ouvrages absents sont exclus. NB : DELTA enregistre
  les totaux de la vue filtrée — DeltaSub, lui, ne stocke que les lignes et recalcule.

### 9.4 Exemple (anonymisé, devis avec 2 ouvrages)
```json
{
  "schema": 1,
  "DOCUMENT_ID": 9001,
  "PROJECT_ID": 901,
  "source": { "fichier": ".../Costestimate/901/9001/costestimate", "versionJava": 4,
              "date": "Mon Aug 31 00:00:00 CEST 2026", "desc": true,
              "converti": "2026-09-29T12:00:00" },
  "reglages": {
    "arrondi5ct": true, "pourcentageSur": "groupe", "marge": "±15%", "indice": "",
    "etatProjet": "", "etatPlanification": "", "textesLibres": ["", "", "", "", ""],
    "titres": { "garde": "DEVIS GENERAL", "document": "Devis général", "unChiffre": "Devis général",
                "deuxChiffres": "Devis général", "descriptif": "Devis général" },
    "affichage": { "displaySubprojects": true, "onlyThreeDigits": false },
    "impressionDescriptif": {}, "impressionHonoraires": {}
  },
  "ouvrages": [ { "code": "A", "SUBPROJECT_ID": 11, "lg": "" },
                { "code": "B", "SUBPROJECT_ID": 12, "lg": "" } ],
  "positions": [
    { "cfc": "2",   "texte": "Bâtiment", "texte2": "", "genere": true,
      "descriptif": null, "descriptifFormat": null, "parts": [] },
    { "cfc": "21",  "texte": "Gros oeuvre 1", "texte2": "", "genere": true,
      "descriptif": null, "descriptifFormat": null, "parts": [] },
    { "cfc": "211", "texte": "Travaux de l'entreprise", "texte2": "de maçonnerie", "genere": true,
      "descriptif": null, "descriptifFormat": null, "parts": [] },
    { "cfc": "211.6", "texte": "Maçonnerie", "texte2": "", "genere": false,
      "descriptif": null, "descriptifFormat": null,
      "parts": [
        { "ouv": "A", "SUBPROJECT_ID": 11, "lg": "", "mode": "inclure", "honorPct": 100,
          "commentaire": "", "definitif": false, "fixe": null,
          "descriptif": "Murs intérieurs en briques terre cuite", "descriptifFormat": null,
          "lignes": [
            { "commentaire": "Mur 1", "base": null, "formule": "0.94*2.5", "qte": 2.35,
              "unite": "m2", "prixHT": 185, "tva": 8.1, "var": false, "ttc": 470 },
            { "commentaire": "Divers", "base": "estimation", "formule": "", "qte": 0,
              "unite": "", "prixHT": 925.05, "tva": 8.1, "var": false, "ttc": 1000 },
            { "commentaire": "Variante briques apparentes", "base": null, "formule": "", "qte": 0,
              "unite": "", "prixHT": 4625.35, "tva": 8.1, "var": true, "ttc": 5000 }
          ] },
        { "ouv": "B", "SUBPROJECT_ID": 12, "lg": "", "mode": "inclure", "honorPct": 100,
          "commentaire": "", "definitif": false, "fixe": null,
          "descriptif": null, "descriptifFormat": null, "lignes": [] }
      ] }
  ],
  "remarques": [ { "nom": "Devis général", "texte": "Base : plans d'avant-projet." } ],
  "presentations": [ { "nom": "Standard", "favori": true, "options": { "zebra": false },
                       "sautsDePage": [ { "cfc": "23", "niveau": "tous" } ] } ],
  "filtres": [ { "nom": "Bâtiment A", "favori": false,
                 "ouvrages": [ { "ouv": "A", "actif": true, "facteur": 1 },
                               { "ouv": "B", "actif": false, "facteur": 1 } ],
                 "cfcDe": "", "cfcA": "" } ],
  "cache": { "totalHT": 1359.80, "totalTVA": 110.14, "totalTTC": 1470, "totalExcluTTC": 0,
             "honoraires": 1359.80, "nbPositions": 4, "calculeLe": "2026-09-29T12:00:00" }
}
```
(Ici 211.6 = 470 + 1'000 TTC ; la ligne « Var » de 5'000 n'est pas comptée ; 211, 21 et 2
valent aussi 1'470.)

### 9.5 Format du fichier `costestimateDESC` (établi d'après `Estimate.internalizeDesc`)
`int version (4)`, `int nbPositions`, puis par position : `Object cfc`, `int nbOuvrages`,
`boolean aDescriptif` [+ texte riche], puis par ouvrage : `Object codeOuvrage`,
`Object codeLocalisation`, `boolean aDescriptif` [+ texte riche].
Texte riche = répéter `tant que readBoolean()` : `Object texte`, `Object police`, `int taille`,
`boolean gras`, `boolean italique`, `boolean souligné`, `java.awt.Color couleur` ; le dernier
`\n` final est supprimé. Lu en Python pur par `lire_desc()` (lecteur de sérialisation Java intégré).

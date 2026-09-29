# Spec 5 — Contrôle des coûts, planification des coûts (eBKP), DELTAreporting, Modèles

Cahier des charges d'interface pour reproduire dans **DeltaSub.html** les modules correspondants
de DELTAproject. Aucun code n'est reproduit : on décrit écrans, libellés, calculs, données.

**Sources utilisées**

| Source | Contenu exploité |
|---|---|
| Manuel FR p. 76–93 + 58 copies d'écran (`shots/p76_*` … `p93_*`) | écrans, menus, fenêtres, exemples chiffrés (données de démonstration du manuel) |
| `Strings.db` — paquets `deltaproject.costcontrol*`, `deltaproject.costplanning*`, `doc.reports*`, `deltaproject.form`, `deltaproject.management` | libellés FR exacts (≈ 6 500 chaînes) |
| Classe `EquationVar` (lib/DELTAbauad.jar, lecture des constantes) | table complète des variables d'équation `[xx]` |
| `ser/cc_915_3601.json` (CC réel, 39 contrats, 240 paiements, 22 arrêtés, 19 ordres), `ser/cc_2951_4853.json`, `ser/cc_2451.json` (CC vide) | structure des données, codes, vérification des formules |
| `ser/cp_2951_252.json`, `ser/cp_2951_3.json` | planification des coûts eBKP |
| `out/schema.txt` (Derby) | table `COSTCONTROLDOCUMENT`, `BANKACCOUNT`, `CONTACT` |

**Conventions** : les libellés entre « » sont les libellés FR exacts de DELTAproject.
[obs.] = observé dans les données/écrans ; [déd.] = déduit (à confirmer en ouvrant DELTAproject).
Montants en CHF, séparateur de milliers « ' » (ex. `1'154'881.46`), 2 décimales.

---

## 0. Vue d'ensemble et navigation

### 0.1 Accès au module
Navigateur d'affaires (écran principal) : colonne 1 « Numéro | Affaire », colonne 2 « Domaine
d'affaire » (… « Devis général », « Soumission », **« Contrôle des coûts »**), colonne 3 = liste
des documents de contrôle des coûts de l'affaire :

| Colonne | Contenu |
|---|---|
| Utilisateur | initiales/login de l'auteur |
| Date | date de modification |
| Version | libellé libre de version |
| N° de version | entier |
| Statut | « Créé », « Provisoire », « En cours », « Etat intermédiaire », « Terminée » |
| Notes | texte libre |

Barre d'outils au-dessus : **+** (nouveau), **dupliquer** (icône deux feuilles), **crayon ▾**
(« Editer », « Ouvrir »…), **−** (supprimer). Double-clic = ouvrir.
Règle métier (manuel) : **dupliquer** le document pour figer un état intermédiaire (ex. après une
séance de validation avec le MO) — le duplicata prend en général le statut « Etat intermédiaire ».
Messages : « Ce document est actuellement utilisé. » (verrou), « Il n'y a plus de licence disponible. »

Stockage DELTA : table `COSTCONTROLDOCUMENT` (ID, CHANGEDDATE, STATECODE, USERID, NOTE, PROJECT_ID,
VERSION, VERSIONNUMBER, ISMARKEDASDELETED) + fichier sérialisé
`Construction/Costcontrol/<PROJECT_ID>/<ID>/coco/costcontrol` ; DELTA garde aussi des copies
horodatées `coco_JJ.MM.AAAA HH.MM/` (sauvegardes automatiques). Au bureau : 115 documents,
STATECODE 0 (72), 1 (40), 3 (3).

### 0.2 Fenêtre « Contrôle des coûts »
Titre : `Contrôle des coûts  <n° affaire> <nom affaire>`.

* **Barre de menus** : « Fichier » (« Enregistrer », « Fermer », « Quitter ») — « Paramètres » (§ 1).
* **Barre latérale gauche** (sections, majuscules, la section active est grisée) :
  1. « CONTRÔLE DU COÛT » (tableau principal, § 2)
  2. « DEVIS GENERAL » (§ 3)
  3. « MUTATIONS » (§ 4) — puis « MUTATIONS 2 » si le centre de coût « DG 2 révisé » est activé
  4. « RENCHERISSEMENT » (uniquement si « Renchérissement ICC » est activé, § 5)
  5. « ADJUDICATIONS » (§ 6)
  6. « PAIEMENTS » (§ 7)
  7. « ORDRES DE PAIEMENT » (§ 8)
  8. « COMPTES D'ENTREPRISE » (§ 9)
  9. « ARRÊTÉS DE COMPTE » (§ 10) (+ « GARANTIE » dans certaines versions)
  10. (versions récentes) « HONORAIRES », « DESCRIPTIF » — hors périmètre prioritaire.
* **Barre d'outils** (identique dans toutes les sections, boutons désactivés si sans objet) :

| Bouton | Infobulle / libellé | Action |
|---|---|---|
| **+ ▾** | « Nouvelle écriture » | menu contextuel d'ajout propre à la section (§ 2.4) |
| crayon | « Editer l'écriture » | édite la ligne sélectionnée (uniquement « écritures isolées ») |
| **−** | « Supprimer l'écriture » | confirmation « Voulez-vous vraiment supprimer cette écriture ? » |
| entonnoir ▾ | « Filtre » | « Editer le filtre » / « Désactiver le filtre » ; libellé « Filtré » affiché quand actif |
| grille ▾ + nom | « Présentation » | liste des présentations enregistrées + gestion (§ 2.3) ; le nom de la présentation active est affiché à droite (« Standard », « Maître d'ouvrage »…) |
| engrenage ▾ | « Paramètres, présentations et réglages » | « Affichage … », « Détails ▸ », « Copier le contenu du tableau dans le presse-papier », « Exporter le tableau dans un fichier CSV … » (+ options propres à la section) |
| document ▾ | « Documents » | documents imprimables de la section (§ 13) |
| lune | (non documentée) | fonction secondaire — ignorer dans DeltaSub |

---

## 1. Menu « Paramètres »

Contenu exact (ordre, séparateurs) :
```
Configuration...
Comptes du maître d'ouvrage ...
Titres de colonnes ...
─────────
Configurer le plan comptable ...
Définir facteur d'index. du DG ...
Importer les présentations ....
─────────
Calculer prorata ...
```

### 1.1 « Configuration » (fenêtre modale)
Gauche : liste « Catégorie » : « Mutations », « Paiements », « Centres de coût », « Comptabilisation »
(+ « Conditions » dans les versions récentes). Droite : contenu. Boutons « Annuler », « OK ».

**a) Mutations** — tableau « Code | Texte | Genre » + boutons **+ / crayon / −**.
Valeurs par défaut (identiques dans les CC du bureau) :

| Code | Texte | Genre |
|---|---|---|
| T1 | Transfert | Transfert |
| M2 | Plus-value | Variation de coût |
| M3 | Moins-value | Variation de coût |
| M4 | Décision MO | Variation de coût |
| M5 | Décision DT | Variation de coût |
| M6 | Exigence autorités | Variation de coût |
| T7 | Bénéfice d'adjudication | Transfert |
| T8 | Perte sur adjudication | Transfert |
| C9 | Renchérissement | Renchérissement |

Fenêtre d'édition (« Nouvelle inscription » / « Edition ») : « Abréviation » (code), texte par
langue (champ « Français » + DE/IT/EN), genre = « Transfert » / « Variation de coût » /
« Renchérissement ». Erreur : « Il existe déjà une mutation ^0. »
Codes internes du genre : 1 = Transfert, 2 = Renchérissement, 3 = Variation de coût [obs.].

**b) Paiements** — tableau « Code | Texte | Genre ». Défauts :

| Code | Texte paiement | Texte facture | Genre (code interne) |
|---|---|---|---|
| AC | Situation | Situation | Paiement sur contrat (1) |
| TC | Paiement de renchérissement | Facture de renchérissement | Paiement de renchérissement (2) |
| GC | Paiement | Facture | Paiement hors contrat (3) |
| AZ | Paiement final | Facture finale | Paiement final sur contrat (4) |

Genres possibles (liste déroulante) : « Paiement sur contrat », « Paiement final sur contrat »,
« Paiement de régie sur contrat », « Paiement final de régie », « Paiement de renchérissement »,
« Paiement final de renchérissement », « Paiement hors contrat », « Paiement final hors contrat ».

**c) Conditions** — catalogue des conditions proposées dans les contrats/paiements
(« Code | Texte | Genre »). Défauts (code interne `kind`, abréviation `sign`) :

| kind | Code | Texte FR | Nature |
|---|---|---|---|
| 1 | R1 | Rabais | % |
| 2 | P1 | Déduction | montant forfaitaire |
| 3 | S1 | Escompte | % |
| 4 | G1 | Garantie (= « Retenue de garantie (%) ») | % |
| 5 | G2 | Déduction de garantie (= « Retenue de garantie (P) ») | forfait |
| 6 | M1 | TVA | % (MwSt) |
| 8 / 9 | oc / al | Taxes de recyclage (%) / (-) | % / forfait |
| 10 / 11 | | Prorata (%) / Prorata (-) | % / forfait |
| 12 / 13 | | Panneau publicitaire (%) / (-) | |
| 14 / 15 | | Assurance (%) / (-) | |
| 16 / 17 | | Frais en énergie (%) / (-) | |
| 18 / 19 | | Frais en eau (%) / (-) | |
| 20 | — | Paiements à ce jour (situation, ajouté automatiquement) | montant |
| 21 / 22 | | Autres (%) / Autres (-) — utilisé au bureau pour « Arrondi », « Geste commercial », « arrondi selon contrat » | % / forfait |

**d) Centres de coût** — cases à cocher qui activent des colonnes/sections :
« DG 2 révisé » (mutations 2), « Renchérissement ICC », « Libre 1 », « Libre 2 », « Libre 3 »,
« Montant plafonné », « Métré ». (Au bureau : tous désactivés [obs.].)

**e) Comptabilisation** — options :
- « Arrondir »
- « N° du lot d'adjudication correspondant au numéro CFC si identique sur toutes les positions »
- « Afficher le taux de TVA dans les nouvelles écritures (transferts, variations, renchérissements) » (bureau : oui)
- « Date de paiement [30] jours après la date de facture » (bureau : 30)
- « Prédéfinir [statut ▾] comme statut de paiement »
- « Prédéfinir [statut ▾] comme statut de mutation »
- « Prédéfinir la saisie du total brut lors de la comptabilisation » (bureau : oui)
- « Prédéfinir le contrat comme prioritaire sur le devis pour le coût probable » (bureau : oui)
- « Prédéfinir la comptabilisation des paiements avec détails » (bureau : oui)
- « Etablir un bon de paiement pour chaque ouvrage »
- « Numéroter les ordres séparément pour chaque maître d'ouvrage »
- « Insérer automatiquement à la place du numéro de compte: [texte] » (bureau : oui, texte type « Voir bulletin de versement »)
- « Autoriser des avenants non lié au contrat » (bureau : non)

### 1.2 « Comptes du maître d'ouvrage »
Fenêtre en 2 volets, bouton « Fermer ».
- Gauche : « Maître d'ouvrage | Ouvrage/Loc » (MO de l'affaire, un par ouvrage si plusieurs MO).
- Droite : comptes du MO sélectionné : « Etablissement | Lieu | Compte » + **+ / crayon / −**.
- Message si aucun MO : « Vous n'avez défini aucun maître d'ouvrage. »

### 1.3 « Editer le compte bancaire » / « Introduire la banque »
Même fenêtre pour comptes MO et coordonnées bancaires des entreprises :
- Bloc **« Banque/Etablissement »** : « Banque/Etablissement », « Rue et n° », « NPA/Localité » (2 champs),
  « N° de clearing », « SWIFT », « Compte postal », « Contact de la banque » (comptes MO seulement).
- Bloc **« Compte bancaire »** : « IBAN », « N° compte bancaire ».
- Boutons : « Comptes ... » (reprendre un compte existant de l'adresse — entreprises), « Chercher ... »
  (annuaire des banques par clearing), « Annuler », « OK ».
- Contrôle IBAN : « L'IBAN est incorrect. Voulez-vous vraiment enregistrer? » (contrôle modulo 97).

### 1.4 « Titres de colonnes » → fenêtre « Editer les titres de colonnes »
Gauche : « Catégorie » : Subdivision, DG, Mutations du DG, DG révisé, Mutations 2 DG révisé,
DG révisé 2, ICC, Adjudication, Paiements, Garantie, Différences, Coût probable, Equations,
Libre 1, Libre 2, Libre 3, Conditions, Honoraires.
Droite : pour chaque colonne de la catégorie : libellé long (ex. « DG révisé HT ») · champ
« 1ère ligne » · champ « 2ème ligne » · « Variable » (ex. `[ca]`). Pour « Equations » : colonne
« Equation » (formule) à la place de « Variable ».
Bas : sélecteur de langue (« Français »…), « Standard » (réinitialiser — « Voulez-vous vraiment
réinitialiser les titres de colonnes ? »), « Annuler », « OK ».
Les titres sont stockés par document et par langue (4 jeux `ColumnNames`, 379 champs `<col>_1`/`<col>_2`).

### 1.5 Autres commandes
- **Configurer le plan comptable ...** : structure CFC (ajout de positions non présentes dans le DG ;
  les positions créées ainsi sont « générées », ex. `101.6`, `214.1` au bureau).
- **Définir facteur d'index. du DG ...** → « Facteur du DG » : champ « Facteur (p.ex. 1.05) ».
  Alimente la colonne « DG indexé » = DG × facteur (bureau : 1.0).
- **Importer les présentations ...** → « Choix du contrôle du coût » : gauche « Numéro | Affaire »,
  droite « Numéro d'affaire | Utilisateur | Date | Version | N° de version | Statut | Notes ».
  Confirmation « Voulez-vous remplacer tous les paramètres? ». Copie présentations, titres,
  configuration.
- **Calculer prorata ...** : calcule la condition « Prorata » (nettoyage de chantier / frais communs)
  sur les contrats — non prioritaire.
- **Synchroniser l'adresse** : met à jour les adresses d'entreprises depuis le carnet d'adresses.

---

## 2. Section « CONTRÔLE DU COÛT » (tableau principal)

### 2.1 Structure des lignes
Tableau arborescent trié par numéro CFC :
1. **Titres CFC** à 1, 2, 3 chiffres (et positions à 4+ chiffres `211.5`) : ligne avec CFC,
   désignation et totaux. Options : « Titres à 1 chiffre en gras », « … 2 chiffres en gras »,
   « … 3 chiffres en gras » ; « N'afficher que les positions de 1 à 3 chiffres » ; ligne vide
   avant chaque groupe principal (1 chiffre).
2. **Lignes entreprise** : sous une position, une ligne par entreprise adjudicataire (colonne
   « Entreprise » = nom court + localité). Une position sans entreprise = « Aucune entreprise ».
3. **Lignes de détail** (si « Détails » activés pour la colonne) sous la position/entreprise,
   indentées, en italique (« Afficher les détails en italique »), préfixées du « Caractère avant
   détails » (défaut `-`), couleurs paramétrables :
   - **mutations** (brun, « Couleur du détail des mutations ») : `-<remarque>` ; montant dans la
     colonne mutation ; dans la colonne « Contreparties » le CFC partenaire entre crochets `[211.4]` ;
     numéro de mutation entre crochets `[111]`.
   - **contrats/avenants** (orange, « Couleur du détail des contrats ») : `-<désignation> <date>[<n° contrat>-<n°>]`,
     ex. `-Contrat 13.07.18[1]`, `-Avenant … [7-1]` ; montant dans « Contrats + avenants ».
   - **paiements** (bleu, « Couleur du détail des paiements ») : `-<genre/commentaire> <date>[<n° pmt>]`,
     ex. `-Situation 30.06.17[1]`, `-Paiement final 09.11.17[5]` ; montant dans « Paiements ».
     Le dernier paiement est précédé du « Caractère avant le dernier paiement » (défaut `F`,
     ex. `F150'000.00`) si « Marquer les derniers paiements » est coché.
   - provisions : `-Réserve 06.02.19` ; coût probable perso, libres, métré, plafonné idem.
4. **Total général** en bas (« Total général »), et récapitulatif par ouvrage si activé
   (« Récapitulatif par ouvrages à la fin »).

Couleur des paiements sur la ligne position (« Afficher les paiements en couleur ») :
vert = « Paiement < ou = au budget », rouge = « Paiement > que le budget ».
Couleurs « Positions saisies » (noir) / « Positions calculées » (noir) paramétrables.

### 2.2 Catalogue des colonnes
Chaque colonne a : un identifiant (id DELTA), un titre court (1re ligne, modifiable), un titre
long (menu), une variable d'équation, une formule. Un clic droit sur l'en-tête ouvre le menu de
sélection par catégorie (sous-menus « Subdivision », « DG », « Mutations du DG », « DG révisé »,
« Adjudication », « Paiements », « Différences », « Coût probable », « Equations » + catégories
actives), chaque entrée cochable (✓ = visible). Glisser un en-tête = réordonner.
Chaque colonne montant existe en 3 variantes **HT / TVA / TTC**.

Notations : `HT`, `TVA`, `TTC` d'une même grandeur ; `Σ` = somme des écritures de la ligne
(position ou entreprise) ; les titres CFC totalisent leurs enfants.

**Subdivision**

| id | Titre court (défaut) | Titre long | Contenu |
|---|---|---|---|
| 0 | CFC | Numéro CFC | n° de position |
| 1 | Désignation | Désignation CFC | texte (option « Texte CFC en deux lignes ») |
| 2 | Entreprise | Entreprise | nom court de l'adjudicataire |
| 3 | Numéro | Numéro d'adresse de l'entreprise | n° d'adresse |
| 4 | Entreprise et CFC | Entreprise et texte CFC | texte CFC sur la position, entreprise sur les lignes entreprise |
| 5 / 6 | OUV / LOC | Ouvrage / Localisation | subdivision |
| 7 / 8 | N° / Lot d'adjudication | N° d'adjudication / Lot d'adjudication | |

**DG** (devis général original)

| id | Titre | Var. | Formule |
|---|---|---|---|
| 10 | Indice ICC | aa | indice de base du DG |
| 11 | DG (HT) | ab | Σ DG HT |
| 12 | TVA DG | ac | Σ TVA DG |
| 13 | DG (TTC) | ad | Σ DG TTC |
| 14 | DG indexé | ae | DG TTC × facteur du DG |
| 15 | DG % | af | DG TTC / total de référence × 100 (« Pourcentage sur le total général » ou « … sur les groupes principaux ») |

**Mutations du DG** (mutations 1) — HT / TVA / TTC

| ids | Titre | Var. | Formule |
|---|---|---|---|
| 20–22 | Renchérissement | ba bb bc | Σ mutations de genre Renchérissement |
| 23–25 | Transferts | bd be bf | Σ transferts (total général = 0) |
| 26–28 | Variations | bg bh bi | Σ variations de coût |
| 29–31 | Mutations | bj bk bl | Transferts + Variations + Renchérissement |
| 32–37 | Numéro, Statut, Remarque, Genre de mutation, Date, Contreparties | — | informations des lignes de détail |

**DG révisé**

| id | Titre | Var. | Formule |
|---|---|---|---|
| 40–42 | DG rév. HT / TVA / DG rév. TTC | ca cb cc | DG + Mutations 1 |
| 43 | DG rév. (%) | cd | part en % |
| 44 | DG rév. par m2 | ce | DG rév. TTC / surface de référence de l'affaire |
| 45 | DG rév. par m3 | cf | DG rév. TTC / volume de l'affaire |
| 46 | DG rév. - DG orig. | cg | DG rév. − DG |

**Mutations 2 DG révisé / DG révisé 2** (si « DG 2 révisé » activé) : ids 50–67 (var. `da`…`dl`,
même structure que Mutations 1), ids 70–77 (`ea`…`ej`) : DG révisé 2 = DG révisé + Mutations 2 ;
« DG révisé 2 - DG » (`eh`), « DG révisé 2 - DG révisé » (`ej`).
Dans tout le reste du document, **« DG révisé » de référence = DG révisé 2 si activé, sinon DG révisé.**

**ICC** (si activé) : ids 78–81 : « Renchérissement ICC DG HT / TVA / TTC » (`fa fb fc`), « DG indicé » (`fd`) = DG révisé + renchérissement ICC.

**Adjudication**

| id | Titre | Var. | Formule |
|---|---|---|---|
| 82–84 | Contrats HT / TVA contrats / Contrats | ga gb gc | Σ contrats (net) |
| 85–87 | Avenants HT / TVA / Avenants | gh gi gj | Σ avenants (net) |
| 88–90 | Contrats + avenants HT / TVA / TTC | gd ge gg | Contrats + Avenants |
| 91–93 | Numéro du contrat, Date, Statut | — | infos |
| 94 | Niveau des prestations | — | % du contrat |
| 95–97 | Montants plafonnés HT/TVA/TTC | gk gl gm | Σ montants plafonnés (si activé) |
| 98–100 | Métrés HT/TVA/TTC | gn go gp | Σ métrés (si activé) |
| 101–103 | Bénéfice d'adjudication TTC/TVA/HT | gq | (Montant plafonné, à défaut Contrats + avenants) − DG révisé ; uniquement si adjugé |
| 104 | Descriptif contrat | — | |

**Paiements**

| id | Titre | Var. | Formule |
|---|---|---|---|
| 120–122 | Paiements HT / TVA / Paiements TTC | ha hb hc | Σ tous les paiements |
| 123–125 | Renchérissement HT/TVA/TTC | hd he hf | Σ paiements de renchérissement |
| 126–128 | Paiements sur contrat HT/TVA/TTC | hh hi hj | Σ paiements sur contrat (situations + final) |
| 132–134 | Paiements hors contrat HT/TVA/TTC | hk hl hm | Σ paiements hors contrat |
| — | Paiements finaux HT / TTC | hn ho | Σ paiements marqués « Dernier paiement » |
| 135, 136, 139–145 | Genre de paiement, Paiements à ce jour, N° pmt, Date pmt, Statut, N° d'ordre, N° fact., Date fact., Paiement descriptif | — | infos |
| 129–131 | Compte d'entreprise, Compte du maître d'ouvrage, Bénéficiaire | — | infos |

**Garantie** : ids 150–154 : « Genre de garantie », « Montant de garantie » (`ia`), « Début de la
garantie », « Echéance de la garantie », « Numéro de la garantie ».

**Différences** (TTC ; variantes HT/TVA ids 16x1/16x2)

| id | Titre | Var. | Formule |
|---|---|---|---|
| 160 | Contrat moins paiements TTC | ja | (Contrat + avenant) − paiements (tous) |
| 161 | Contrat - paiements sur contrat TTC | jb | (Contrat + avenant) − paiements sur contrat |
| 162 | Plus-/moins-values TTC | jc | (Contrat + avenant) − paiements sur contrat, **uniquement si dernier paiement** comptabilisé |
| 163 | Contrat/DG rév. moins pmts. TTC | jd / je | (Contrat + avenants, à défaut DG révisé) − paiements |
| 164 | DG rév. moins paiements TTC | — | DG révisé − paiements |

**Coût probable**

| id | Titre | Var. | Formule |
|---|---|---|---|
| 170–172 | Coût probable HT / TVA / Coût probable TTC (« Prévision calculée ») | ka kb kc | algorithme § 11 |
| 173–175 | Coût probable perso HT/TVA/TTC | kd ke kf | Σ écritures « Coût probable perso » |
| 176–178 | Provision HT/TVA/TTC (« Réserves ») | kg kh ki | Σ provisions |
| 179–181 | Etat du coût HT / TVA / Etat du coût TTC | kj kk kl | **Coût probable − DG révisé** (négatif = économie) |

**Equations** : ids 190–195 « Equation 1…6 » (§ 12.2). **Libres** : ids 200–209 « Montant libre n HT/TVA/TTC » (`la…nc`, § 12.1). **Honoraires** : ids 220–227 (`oc`, `pa…pf`) — hors priorité.

### 2.3 Présentations
Une présentation = jeu {colonnes visibles, ordre, largeurs, détails affichés par colonne, options
d'affichage de toutes les sections}. Menu du bouton grille :
```
Standard            ← liste des présentations (✓ = active)
Maître d'ouvrage
Devis rév.
─────────
Enregistrer la présentation ...
Renommer la présentation ...
Supprimer la présentation ...
```
(+ « Dupliquer la présentation », « Préférences par défaut »). « Standard » ne peut pas être
supprimée (« Cette inscription ne peut pas être effacée. »). Confirmation « Voulez-vous vraiment
supprimer la présentation ^0 ? ».

**Présentations du bureau** (lues dans `cc_915_3601`, ordre exact des colonnes) :

| Présentation | Colonnes (dans l'ordre) — (D) = détails affichés |
|---|---|
| **Standard** | CFC · Désignation · Entreprise · DG TTC · Mutations TTC · Contrats + avenants TTC (D) · Avenants TTC · Provision TTC · DG rév. TTC · Paiements TTC (D) · Coût probable TTC · Etat du coût TTC · DG % |
| **Récapitulatif** | CFC · Désignation · Entreprise · DG TTC · DG % · DG rév. TTC · DG rév. % · Contrats + avenants TTC (D) · Coût probable TTC · Paiements TTC (D) |
| **Maître de l'ouvrage** | CFC · Désignation · Entreprise · DG TTC · Mutations TTC · Provision TTC · DG rév. TTC · Contrats + avenants TTC (D) · Paiements TTC (D) |

Présentation « Standard » du manuel (démo) : CFC · Désignation · Entreprise · DG TTC · Transferts
TTC · Variations TTC · DG rév. TTC · Contrats + avenants · Paiements TTC · Prévision calculée TTC ·
Etat du coût TTC.

### 2.4 Menus d'ajout et contextuels
**Menu « + » (section Contrôle du coût)** :
```
Mutations 1          ▸  Transfert ... | Variation ... | Renchérissement ...
(Mutations 2         ▸  idem, si activé)
(Indice ICC ...          si ICC activé)
Contrat ...
Avenant ...              (actif si la ligne sélectionnée porte un contrat)
─────────
Paiement sur contrat ... (actif si la ligne porte un contrat)
Paiement hors contrat ...
Coût probable perso ...
Provisions ...
(Montant plafonné ... / Métré ... si activés)
─────────
Libre 1 ... (Libre 2, Libre 3 si activés)
─────────
Editer l'écriture ...
Supprimer l'écriture ...
```
La position CFC / entreprise sélectionnée pré-remplit la fenêtre ouverte.

**Menu contextuel (clic droit sur une ligne)** : « Détails ▸ » (« Détails des mutations 1 »,
« Détails des mutations 2 », « indice ICC », « Détails des contrats », « Détails des avenants »,
« Détails des contrats et des avenants », « Détails des adjudications », « Détails du métré »,
« Détails des paiements », « Détails des provisions », « Détails des coûts probables perso »,
« Détails du libre 1/2/3 ») · « Affichage ... » · puis les mêmes entrées que le menu « + ».

**Menu engrenage** : « Affichage ... » · « Détails ▸ » · ─ · « Copier le contenu du tableau dans le
presse-papier » · « Exporter le tableau dans un fichier CSV ... ».

**Filtre** (« Filtre ») : plage CFC (de/à), ouvrages ; favoris (« Ajouter aux favoris »,
« Retirer de la liste des favoris », « Editer les favoris », colonne « Favori ») ; bouton
« Appliquer le filtre ».

Règles d'édition : « Vous ne pouvez éditer que des écritures isolées. » / « Vous ne pouvez
supprimer que des écritures isolées. » (sélectionner une ligne de détail) ; « Ecriture impossible
sur une position supérieure. » (pas d'écriture sur un titre calculé) ; « Vous devez afficher la
colonne et les détails. » (pour éditer via le tableau). Double-clic sur une ligne de détail = édition.
Retirer une entreprise : « Voulez-vous retirer cette entreprise et supprimer toutes ses écritures ? ».

### 2.5 Fenêtre « Affichage »
Catégories : « Devis général », « Présentation », « Paiements », « Ouvrage » ; boutons « Fermer », « OK ».
- **Devis général** : « Devis général sans décimales », « Pourcentage sur le total général » /
  « Pourcentage sur les groupes principaux », « Texte CFC en deux lignes ».
- **Présentation** : 5 pastilles couleur « Couleur du détail des mutations » (défaut brun `#993300`),
  « Couleur du détail des contrats » (orange `#FF6633`), « Couleur du détail des paiements » (bleu
  nuit `#003366`), « Positions saisies », « Positions calculées » (noir) ; cases « Titres à 1 chiffre
  en gras », « Titres à 2 chiffres en gras », « Titres à 3 chiffres en gras », « Afficher les détails
  en italique », « N'afficher que les positions de 1 à 3 chiffres » ; champ « Caractère avant détails » (`-`).
- **Paiements** : « Afficher les paiements en couleur » (couleurs « Paiement < ou = au budget » vert /
  « Paiement > que le budget » rouge), « Marquer les derniers paiements », « Caractère avant le
  dernier paiement » (`F`), « Date de facturation plutôt que la date de paiement » (date affichée
  dans les détails).
- **Ouvrage** : « Ouvrages sur positions à 1/2/3/4 chiffres », « Totaux généraux des ouvrages »,
  « Somme des localisations ».

---

## 3. Section « DEVIS GENERAL »

Tableau : « CFC | Désignation | DG | DG % » (présentation bureau : CFC · Désignation · DG TTC · DG %).
Montants DG sans décimales par défaut, pourcentage à 1 décimale (`<0.1` si très petit).
Barre d'outils : libellé « Devis original », bouton **Attribuer** (icône importer — « Attribuer le
devis général »), filtre, présentation, engrenage, documents.

**Attribuer le devis** : choisit un devis général de l'affaire au statut **Validé** (module Devis
général). Messages : « Aucun devis général validé n'a été trouvé. » / « Il n'existe aucun devis
général dont le statut est validé. » ; si déjà attribué : « Un devis a déjà été attribué. Il sera
complété ou remplacé en cas de nouvelle attribution. Souhaitez-vous poursuivre ? » (Nein/Ja) ;
devis avec ouvrages : « Souhaitez-vous attribuer les ouvrages à ce nouveau ctrl. des coûts ? »
(au premier import, possibilité d'importer **sans ouvrage** — choix irréversible).
Effet : copie la structure CFC et les montants (HT, taux, TTC) → colonnes DG. Les positions de 1–3
chiffres sont des titres calculés (somme).
« Paramètres » : « N'afficher que les positions de 1 à 3 chiffres », « Pourcentages sur le total
général » / « … sur les groupes principaux », « Récapitulatif par ouvrages à la fin », « Montants
sans décimales », « Décaler hiérarchiquement les montants ».

Pourcentage observé [obs.] : `percentage` = montant / total du groupe principal (1 chiffre) × 100
(le groupe principal vaut 100 %).

---

## 4. Mutations

### 4.1 Principes
- Deux centres : **Mutations 1** (toujours, sur le DG → DG révisé) et **Mutations 2** (optionnel, sur
  le DG révisé → DG révisé 2, ex. pour isoler le renchérissement en fin de chantier).
- Trois genres : **Transfert** (d'un CFC/ouvrage à un autre, total général inchangé : la colonne
  Transferts totalise 0), **Variation** (plus/moins-value, décisions MO/DT, exigences autorités :
  modifie le DG révisé), **Renchérissement** (modifie le DG révisé).
- Saisie dans le tableau (menu +) ou dans la section « MUTATIONS ».
- Chaque mutation a un **numéro** unique (bouton ◀ = « prochain numéro libre » ; erreurs « Ce numéro
  de mutation est déjà utilisé. », « Veuillez définir un numéro de mutation. »), une date, un statut
  (« Brouillon », « Provisoire », « Demande transmise », « Acceptée », « Rejetée »), une remarque
  (affichée dans les détails), un commentaire (texte long).
- **Au bureau** : 134 transferts (268 écritures) dans le plus gros CC, aucune variation — le genre
  Transfert est l'usage principal [obs.].

### 4.2 Section « MUTATIONS » (liste)
Colonnes (présentation bureau) : CFC · Désignation · Entreprise · Transferts TTC · Variations TTC ·
Contreparties · Date · Mutations TTC. (Autres colonnes possibles : « Numéro », « Statut »,
« Remarque », « Genre » ; libellés `MutCol` : « DG original », « Mutation », « DG révisé »,
« Répartition ».) Ligne « Total ».
Menu « + » : « Transfert ... », « Variation ... », « Renchérissement ... », « Tri ▸ » (« par numéro
de CFC (Source) », « par numéro de CFC », « par numéro de mutation », « par date »).
Présentation liste : « Toutes les mutations », « Mutations sans destination de la mutation »,
« Mutations sans origine de la mutation ». Filtre : « Afficher les transferts », « Afficher les
variations de coût », « Afficher le renchérissement », période « Début »/« Fin », ouvrages, genre,
statut. Documents : « Liste des mutations », « Mutation » (feuille de mutation individuelle,
avec « Signature (utilisateur de document) »).

### 4.3 Fenêtre « Transfert »
Disposition (≈ 940×545) :
- **Colonne gauche** : liste des positions « CFC | Montant | Mutation » (montant = DG révisé TTC de la
  position, mutation = cumul des mutations déjà passées) ; option « Afficher seulement les positions
  comptabilisées ». Sélection = origine.
- En haut : « Genre de mutation » (liste des codes de genre Transfert : Transfert, Bénéfice
  d'adjudication, Perte sur adjudication) · « Statut » (défaut : statut prédéfini).
- Cadre **« Origine de la mutation »** : CFC + texte, entreprise (« Aucune entreprise »), ouvrage.
- Cadre **« Avant mutation »** (origine) : « Total HT », « TVA », « Total TVA incl. » (lecture seule).
- Cadre **« Après mutation »** (origine) : Total HT (éditable), TVA, Total TVA incl. (éditable).
- Cadre **« Destination de la mutation »** : liste déroulante CFC, liste déroulante entreprise
  (« Aucune entreprise » / « Ajouter »), bouton **⤢** (« Bloquer les paramètres » / navigateur).
- Cadre **« Mutation »** : « Total HT », « TVA » [taux %] + montant, « Total TVA incl. ».
- Cadre **« Après mutation »** (destination) : Total HT, TVA, Total TVA incl.
- « Numéro de mutation » [champ] [◀] · « Remarque » · « Date » [📅] · « Commentaire » (zone de texte).
- Boutons : « Annuler », « OK » (+ « OK & continuer », « Nouveau », « Supprimer », « Demande »).

Calcul : saisie en HT ou en TTC, TVA = HT × taux ; l'origine reçoit **−montant**, la destination
**+montant** (même taux de TVA). Contrôles : « Vous exécutez une mutation sur elle-même. »,
« Montant de mutation trop élevé. » / « Voulez-vous comptabiliser une mutation supérieure à la somme
du devis ? » (origine négative).
Données : deux écritures liées (origine `isOrigMutationPos = vrai`, montant négatif ; destination
positive), liées par `partnerMutRefNum`, même `mutNum` [obs.].

### 4.4 Fenêtre « Variation de coût » (et « Renchérissement »)
- « Genre de mutation » (Plus-value, Moins-value, Décision MO, Décision DT, Exigence autorités…) ·
  date [📅] en haut à droite.
- Cadre **« Position »** : CFC (liste déroulante), entreprise, bouton ⤢.
- Cadre montants : colonnes « Mutation » et « DG après mutation » ; lignes « Total hors TVA »,
  « TVA » [taux] %, « Total TVA incluse ». Saisie possible dans l'une ou l'autre colonne
  (saisir le DG après mutation calcule la mutation = DG après − DG révisé actuel).
- « Numéro de mutation » [◀] · « Statut » · « Remarque » · « Commentaire ».
- « Annuler », « OK ».
Une seule écriture (sur la position choisie). Une moins-value est saisie en négatif.
« Renchérissement » : même fenêtre, titre « Renchérissement », genre C9.

---

## 5. Renchérissement ICC (optionnel)
Activer « Renchérissement ICC » dans Configuration ; l'affaire doit avoir un indice de base
(« Aucun indice de base n'a été défini. »).
Fenêtre **« Indice des coûts de construction (ICC) »** :
- gauche : « CFC | Entreprise | DG révisé HT | Indice ICC » (liste des positions renchérissables) ;
- droite : « Indice ICC » [valeur], « Renchéri. ICC HT », « TVA » [taux] % [montant],
  « Renchéri. ICC TTC », « DG indicé » (lecture) ;
- « Remarque », date, « Commentaire » ; « Fermer », « OK ».
Calcul : saisir soit l'indice, soit le montant (HT ou TTC) :
`Renchéri. TTC = montant DG révisé de la position × (Indice / Indice de base − 1)`,
`Renchéri. HT = TTC / (1 + TVA)` ; `DG indicé = DG révisé + Renchéri. TTC`.
Exemple manuel (position 211, colonne « DG révisé HT » 470'220.00, indice 110, base 100) :
Renchéri. TTC 47'022.00, HT 43'660.15, TVA 7.7 % 3'361.85, « DG indicé » 517'242.00.
NB : la colonne est intitulée « HT » mais le calcul de l'exemple part du montant comme s'il était
TTC — à vérifier dans DELTAproject avant de reproduire (non prioritaire, non utilisé au bureau).

---

## 6. Adjudications (contrats et avenants)

### 6.1 Section « ADJUDICATIONS » (liste)
Colonnes (présentation bureau) : N° (lot) · Lot d'adjudication · Entreprise · Contrats TTC ·
Avenants TTC · Contrats + avenants TTC · Numéro du contrat · Date. Menus : « Montrer les contrats »,
« Montrer les avenants », tri « par CFC », « par numéro de contrat ». Filtre : « Contrat »,
« Avenant », statuts (« Brouillon », « En traitement », « Définitif », « Sur demande », « Pour
signature »), période, ouvrages (« Critères pour les contrats »). Documents : « Liste des
adjudications », « Contrat », « Avenant » (options « Arrondir les conditions », « Afficher le
total arrondi »).

### 6.2 Fenêtre « Contrat » (titre = nom de l'entreprise)
Choix préalable de l'entreprise (carnet d'adresses). Disposition (≈ 1050×770) :
- **Colonne gauche** : « CFC | Montant du devis | Adjudication » (toutes les positions ; adjudication
  = déjà adjugé). **Double-clic** = ajoute la position au contrat. Un même CFC peut être ajouté deux
  fois (« Voulez-vous insérer plusieurs fois ce CFC? A utiliser seulement avec différentes
  Réf.cond. ») — cas d'une part à un autre taux de TVA.
- « Lot d'adjudication » [n°] [texte] [◀].
- **« Positions du contrat : »** — case « Contrat prioritaire sur le devis pour le coût probable ».
  Tableau « CFC | Texte | Réf. cond. | Brut | Net » + ligne « Total » ; boutons **+ − ▲ ▼**
  (« Ajouter Position », « Supprimer sélection », « Déplacer vers le haut/bas ») ; liste déroulante
  **« Saisie du net » / « Saisie du brut »** (colonne éditable grisée).
- **« Conditions du contrat : »** — tableau « NIV | REF | Désignation | Genre | Réf. cond. |
  Conditions | Montant | M » ; bouton engrenage ▾ (« Nouvelle condition », « Ajouter une condition
  au-dessus / au-dessous », « Supprimer la condition », « Arrondi », « Ajouter la TVA »,
  « Calculer le rabais », « Rabais % », « Les conditions du dernier contrat », « Navigateur »).
- « Désignation » (ex. « Contrat ») · « Numéro » [◀ prochain] · « Date » [📅] · « Statut »
  (« Brouillon », « En traitement », « Définitif », « Sur demande », « Pour signature »).
- « Description » (texte long, imprimé sur le contrat) · annexes (« Annexes: n »).
- « Niveau des prestations » : curseur 0–100 %.
- « Délai de garantie » (texte) ; « Annuler », « OK ».
Contrôles : « Veuillez définir le lot d'adjudication. », « Vous n'avez défini aucun numéro de
contrat. », « Le numéro de contrat ^0 est déjà utilisé. », « La dernière condition n'est pas le TVA.
Voulez-vous enregistrer ce contrat? », « Le niveau de référence de la condition ^0 est incorrect. »,
« Vous avez déjà comptabilisé des paiements. … Attention. Il faut éventuellement modifier les
paiements de cette adjudication. », « ^0 est une position calculée. ».
Contrat à 0 (provisoire) : autorisé pour pouvoir payer avant de saisir le contrat (manuel).

### 6.3 Moteur de conditions (commun contrat, avenant, paiement, arrêté)
Chaque condition : **NIV** (n° d'étape 1…n), **REF** (étape de référence, 0 = montant brut),
**Désignation**, **Genre**, **Réf. cond.** (filtre de positions), **Conditions** (taux % ou montant),
**Montant** (calculé), **M** (appliquée, case).
Genres affichés : `%` (pourcentage : rabais, prorata %, autres %), `S` (escompte), `G` (retenue de
garantie) [déd.], `P` / `-` (montant forfaitaire) [déd.], `SI` (paiements à ce jour / situation),
`M` (TVA).

Algorithme (vérifié sur les données du bureau) — pour **chaque ligne de position** :
```
R(0) = Brut de la ligne
pour n = 1..N (conditions appliquées dont Réf.cond est vide ou = Réf.cond de la ligne) :
    Base(n)    = R(REF(n))
    Montant(n) = Base(n) × taux/100          (condition en %)
               = forfait × Base(n)/ΣBase     (condition forfaitaire répartie au prorata des lignes)
    R(n)       = Base(n) + Montant(n)
Net de la ligne = R(N)     (N = dernière condition = TVA)
TVA de la ligne = Montant de la condition TVA
```
Totaux du contrat = Σ lignes (Brut, Net, TVA) ; le tableau de conditions affiche Σ par condition.
Exemple réel : Brut 112'022.60 ; Rabais −5 % → −5'601.13 ; Escompte −1 % (réf. 1) → −1'064.21 ;
Prorata −1.2 % (réf. 2) → −1'264.29 ; TVA 8.1 % (réf. 3) → 8'431.53 ; **Net 112'524.50**.
Exemple manuel (2 taux) : positions « Plantes » (TVA 2.8 %) et « Travaux » (TVA 7.7 %), Rabais −5 %
sur tout, TVA 2.8 % Réf. cond. « Plantes », TVA 7.7 % Réf. cond. « Travaux ».

**Saisie du net** (défaut au bureau pour les paiements) : l'utilisateur saisit le Net (TTC) ; le brut
est obtenu en inversant la chaîne : `Brut = Net / Π(1 + taux_i/100)` pour les conditions en %,
forfaits déduits avant inversion. **Saisie du brut** : calcul direct.
« Calculer le rabais » : saisir brut **et** net → le rabais % est calculé (« Vous avez choisi de
calculer le rabais. Veuillez sélectionner Saisie du brut ou Saisie du net. », « Ceci n'est pas un
rabais. »). Arrondi : condition forfaitaire « Arrondi » (Autres (-)).

### 6.4 Avenants
Menu « Avenant ... » sur une ligne de contrat. Fenêtre « Avenant <entreprise> » identique au contrat :
« Positions de l'avenant : » (ou « Positions de l'avenant (lié au contrat): » / « (non lié au
contrat): »), « Conditions de l'avenant : » (reprises du contrat), n° d'avenant (1, 2…).
Au premier avenant, choisir **lié / non lié** au contrat (« Lié au contrat » / « Non lié au
contrat » ; le non-lié exige l'option « Autoriser des avenants non lié au contrat »). Avenant lié :
toujours affiché avec le contrat, payé et soldé avec lui (arrêté de compte commun) — c'est l'usage
normal. Affichage détail : « Contrat ^0 + avenants liés ». Suppression refusée si des paiements
existent (« Des paiements ont été comptabilisés sur cet aventant, il ne peut donc pas être effacé. »).

### 6.5 Montant plafonné et métré (optionnels)
Fenêtres génériques (« Montant plafonné », « Métré ») identiques à « Coût probable perso » (§ 11.3).
Montant plafonné = plafond des coûts contrats + suppléments connu de l'architecte et du MO.

---

## 7. Paiements

### 7.1 Paiement sur contrat (fenêtre titrée du nom de l'entreprise)
Ouverte depuis une ligne de contrat (menu « Paiement sur contrat ... ») ou la section PAIEMENTS.
Disposition (≈ 800×750) :
- « Lot d'adjudication » [n°] [texte].
- **« Positions du paiement »** : « CFC | Texte | Réf. cond. | Adjudication brute | Adjudication
  nette | Cumul acptes bruts | Paiement net » + « Total ». Adjudication = contrat + avenants liés.
  Colonne éditable : « Paiement net » (saisie du net) ou « Cumul acptes bruts » (saisie du brut) —
  liste « Saisie d… » à droite.
- **« Conditions du paiement »** : « Niveau | Référence | Désignation | Genre | Réf. cond. |
  Conditions | Montant » ; conditions reprises du contrat + retenue de garantie + « Paiements à ce
  jour » (SI) + TVA. Menu engrenage : « Conditions du dernier paiement », « Insérer la TVA »,
  « Arrondi »…
- Ligne sous le tableau : engrenage ▾, crayon ▾ (« Coordonnées bancaires ... », « Annexe... »),
  libellé de la banque retenue (« Coordonnées bancaires: <banque> »), « Annexes: n ».
- « Description » (zone de texte) ; à droite « Commentaire » [texte, ex. « Situation »], liste
  **genre de paiement** (« Situation », « Paiement final »…), liste **statut** (« réceptionné »,
  « libéré », « transmis », « débité »), « Niveau des prestations » (curseur 0–100).
- Case **« Dernier paiement »**.
- « N° pmt » [◀ prochain] · « Date fact. » [📅] · « N° fact » · « Date pmt » [📅] (défaut = date
  facture + n jours de la configuration) · « Annuler » · « OK ».

**Logique « situation » cumulée** [obs., vérifié] : le brut saisi est le **cumul** des acomptes
bruts ; la chaîne de conditions retient la garantie sur le cumul puis déduit « Paiements à ce jour »
= Σ HT des paiements précédents (après conditions, avant TVA) ; la TVA s'applique au solde :
```
Cumul brut 288'960.55
 Rabais −4 %            −11'558.42
 Escompte −2 %           −5'548.04
 Prorata −1.2 %          −3'262.25
 Garantie −10 %         −26'859.18   (retenue de garantie, genre G)
 Paiements à ce jour    −64'666.05   (= HT du paiement précédent)
 TVA 8.1 %              +14'342.40
 Paiement net (TTC)     191'409.00
```
**Paiement final** (genre AZ, « Dernier paiement » coché) : même chaîne **sans** retenue de
garantie (libérée) ; le brut = facture finale ; « Paiements à ce jour » déduit tous les paiements.
Contrôles : « Ce paiement n'a pas de montant. », « Le numéro de paiement ^0 est déjà utilisé. »,
« Le numéro de facture ^0 est déjà utilisé. Souhaitez-vous enregistrer ce paiement? », « En tenant
compte de la retenue de garantie, le total des paiements sera supérieur à l'adjudication.
Souhaitez-vous enregistrer ce paiement? » (idem par position), « Le dernier paiement n'est pas un
paiement final. », « Le numéro de paiement contient des caractères non autorisés. ».
Paiements au statut « transmis » ou « débité » : non modifiables / non supprimables (manuel) ;
à l'édition d'un paiement : « Voulez-vous modifier cette écriture ou la comptabiliser à nouveau ? »
(« Modifier » / « Comptabiliser à nouveau »).
Annexes : « Joindre la facture d'entreprise au bon de paiement. » (PDF de la facture) — fenêtre
« Document » : « Document | Emplacement », « Utiliser l'emplacement relatif au dossier d'affaire ».

### 7.2 Paiement hors contrat
Même fenêtre, sans colonnes d'adjudication : colonne gauche « CFC | Montant DG », positions
« CFC | Texte | Réf. cond. | Paiement brut | Paiement net », conditions libres (souvent escompte +
TVA), genre « Paiement » (GC), « Dernier paiement » possible. Sert aux factures sans contrat
(taxes, autorisations, petites fournitures). Au bureau : 68 paiements hors contrat dans le plus
gros CC [obs.]. Impact sur le coût probable : § 11.

### 7.3 Section « PAIEMENTS » (rapport de paiement)
Colonnes (présentation bureau) : N° (lot) · Lot d'adjudication · Entreprise · Paiements HT · TVA ·
Paiements TTC. Menu engrenage : « Couleur des informations détaillées ... », « Afficher les
détails », « Tri ▸ » (« par CFC », « par numéro de paiement », « par ordre de paiement », « par
entreprise », « par date de paiement », « par date de facture »), « Récapitulatif de TVA » (✓),
copier / exporter CSV.
**Récapitulatif de TVA** en fin de liste : une ligne par taux « Part TVA 2.4 », « Part TVA 7.7 »,
« Part TVA 8.0 »… (HT, TVA, TTC), puis « Total ».
Filtre : « Paiement sur contrat », « Renchérissement », « Paiement hors contrat », statuts, période,
ouvrages, « Compte », « Maître d'ouvrage », « Ordre de paiement ». Document « Rapport des paiements ».

---

## 8. Ordres de paiement et bons de paiement
Section « ORDRES DE PAIEMENT » en deux volets :
- **Gauche** : ordres « N° | Date | Maître d'ouvrage | Statut » ; boutons + / crayon / −.
- **Droite** : paiements de l'ordre sélectionné : « N° (lot) | Bénéficiaire (nom, NPA localité,
  texte compte — ex. « Voir bulletin de versement ») | N° Paiement | Paiements à ce jour |
  Contrats + avenants TTC | Paiements TTC » + « Total » ; boutons + (ajouter des paiements) / −
  (« Retirer le paiement », « Retirer tous les paiements »).
Fenêtre **« Ordre de paiement »** : « Numéro », « Date », « Date de valeur », « Maître d'ouvrage »,
« Compte », « Statut ». Fenêtre **« Paiements pour ordre »** : « N° | Texte | Créditeur | N° pmt |
Montant | Statut » (+ « Tous les paiements »), « Fermer », « OK ».
Statuts de l'ordre : « Brouillon », « Contrôlé », « Transmis », « Débité », « En traitement ».
Quand le MO a payé : passer l'ordre de « Transmis » à « Débité » (« Souhaitez-vous attribuer un nouveau
statut à cet ordre de paiement? » propage le statut aux paiements). Paiements « Débité »/« Transmis » :
verrouillés (« Le statut du paiement est ^0, il ne peut donc pas être effacé. »).
Documents : « Ordre de paiement » (liste avec totaux « Total avant paiement », « Total des
paiements », « Total après paiement », banque/IBAN du MO) et **« Bon de paiement »** par paiement
(contrat, avenants, conditions, « Paiements à ce jour », « Montant à recevoir après exécution de
l'ordre », coordonnées bancaires de l'entreprise, signature) ; « Créer tous les documents »,
« Créer un PDF avec tous les bons », « Joindre la facture d'entreprise au bon de paiement. ».
Options : « Trier les paiements par CFC / par numéro », « Afficher la désignation CFC », « Afficher
les montants avant/après exécution », « Afficher la date d'échéance ».
Au bureau : 19 ordres, 241 lignes [obs.].

## 9. Comptes d'entreprise
Liste par entreprise (présentation bureau) : N° · Lot d'adjudication · CFC · Contrats TTC ·
Avenants TTC · Contrats + avenants TTC · Paiements TTC · Contrat − paiements sur contrat TTC.
Options : « Récapitulatif par ouvrages », couleurs « Paiements », « Contrats et avenants ».
Document « Compte d'entreprise » (relevé contrat/avenants/paiements d'une entreprise).

## 10. Arrêtés de compte et garanties
Section « ARRÊTÉS DE COMPTE » : liste « N° | Entreprise (adresse sur 1, 2 ou n lignes) | Genre de
garantie | Montant de garantie | Début de l'arrêté de compte | Fin de l'arrêté de compte ».
Menu + : « Nouvel arrêté de compte », « Editer l'arrêté de compte », « Supprimer l'arrêté de compte » ;
choix du contrat (« Liste des adjudications » : « Adjudication | Texte | Numéro | Entreprise | Genre »)
— « L'arrêté de compte ne peut porter que sur un seul contrat. ».
Fenêtre **« Arrêté de compte »** :
- « Lot d'adjudication <n°> <texte> » ; tableau récapitulatif « Adjudication | Date | N° | Brut | Net »
  (Contrat, Avenants…, « Total »).
- **« Arrêté de compte »** : « CFC | Texte | Réf. cond. | Adjudication brute | Adjudication nette |
  Facture finale brute | Facture finale nette » + « Total » ; « Saisie du net »/« Saisie du brut ».
- **« Conditions de l'arrêté de compte »** (même moteur).
- crayon ▾ : « Garantie ... » (fenêtre « Informations de la garantie » : « Type de garantie »
  = « Banque » / « Assurance » / « Comptant » / « Sans garantie », « Montant de la garantie »,
  « Début de la garantie », « Echéance de la garantie », raccourcis « Début de la garantie + 2
  années » / « + 5 années »), « Annexe ... ». Libellés « Garantie: », « Annexes: ».
- « Description » ; « Commentaire », « Numéro », « Date », « Statut » (« établi », « pour signature »,
  « définitif »).
Règles : avenants liés soldés avec le contrat ; l'arrêté verrouille le contrat (« Le contrat est
inférieur au devis et n'est pas prioritaire pour le coût probable. L'arrêté de compte verrouillera le
contrat. Souhaitez-vous le valider ? ») ; « L'arrêté de compte a déjà été signé et ne peut donc plus
être supprimé. » ; **« Comptabiliser le paiement final »** exige le statut « Définitif ». Document
« Arrêté de compte » : Commande / Paiements à ce jour (« Total des paiements à ce jour ») / Autres
paiements / « Solde à verser » ; options « Afficher les paiements de renchérissement », « … généraux »,
« … à ce jour », « Afficher les arrêtés de compte détaillés ».
**Liste des garanties** : triable « par date d'échéance », « par adjudication », « par adresse »,
« par numéro d'arrêté de compte ». Au bureau : 22 arrêtés [obs.].

---

## 11. Coût probable (« Prévision calculée »), provisions, coût probable perso

### 11.1 Règles (manuel p. 84–85 + classe `Prognosis`)
Calcul pour chaque **structure** (position CFC × entreprise × ouvrage), puis totalisé vers les titres.
Ordre de priorité, de la plus forte à la plus faible :

1. **Coût probable perso** saisi (écriture manuelle, § 11.3) → remplace le calcul ; la case
   « Coût probable à zéro » force 0 (position non exécutée).
2. **Dernier paiement** comptabilisé (case « Dernier paiement » / paiement final) →
   `CP = Σ paiements de la structure` (sur contrat + hors contrat).
3. **Contrat + avenants** (s'il existe un contrat et pas de dernier paiement) :
   `CP = max(Contrats + avenants, Σ paiements + retenues de garantie)` ;
   si Contrats + avenants < DG révisé : on prend le contrat **seulement si** « Contrat prioritaire sur
   le devis pour le coût probable » est coché, sinon `CP = DG révisé`.
4. **Pas de contrat** : `CP = DG révisé` (ou DG indicé si ICC actif) ; si des paiements hors
   contrat dépassent ce montant : `CP = Σ paiements hors contrat` [déd. : « dans certaines conditions »].
5. **Provision** : `CP = CP calculé + Σ provisions` (toujours ajoutée, sauf CP perso). Les provisions
   doivent être maintenues à la main (libellé détail « Réserve »).

Plusieurs entreprises sur un même CFC : le calcul se fait **au niveau du CFC** (Σ contrats vs DG du
CFC), sauf si le DG a été réparti entre les entreprises (DG saisi par entreprise) → calcul séparé
par entreprise. HT / TVA / TTC calculés en parallèle ; TVA du CP = TVA des montants retenus.

**Etat du coût** = `CP − DG révisé` (TTC, HT, TVA) : négatif = économie, positif = dépassement.
**Plus-/moins-values** = (Contrats + avenants) − paiements sur contrat, seulement après dernier paiement.

### 11.2 Exemple de contrôle (manuel, capture p. 76)
CFC 211.0 : DG 24'948 ; contrat 24'283.60 ; paiements 3'862.65 → CP 24'283.60 (contrat prioritaire),
Etat du coût −664.40.

### 11.3 Fenêtres « Coût probable », « Provision », « Libre n », « Montant plafonné », « Métré »
Même gabarit (≈ 790–1290 px de large) :
- à gauche : CFC (liste déroulante, ex. « 211.6 Maçonnerie »), entreprise (« Aucune entreprise »,
  « Ajouter »), bouton ⤢ (« Filtrer par ouvrages / par CFC / par entreprises ») ;
- à droite deux colonnes **« Ecriture »** et **« Total TVA incl. »** : lignes « Hors TVA », « TVA »
  [taux] %, « Montant » ; (« Coût probable » : case **« Coût probable à zéro »**) ;
- « Remarque » (affichée en détail), date [📅] ;
- boutons « Annuler », « Valider » (+ « Valider & continuer », « Nouveau », « Dupliquer »,
  « Modifier », « Supprimer »). Liste des écritures existantes : « CFC | Entreprise | Ouvrage | Date | Montant ».
Exemple : 220'000 TTC à 7.7 % → HT 204'271.10, TVA 15'728.90.

## 12. Centres de coût libres et équations personnelles

### 12.1 Libre 1 / 2 / 3
Activer dans Configuration → Centres de coût. Chaque centre = colonne HT/TVA/TTC + écritures libres
(fenêtre § 11.3 titrée « Libre 1 »). Usage : budget interne, fonds propres, subventions…
Titres modifiables (« Libre 1 » → ex. « Budget MO »).

### 12.2 Equations 1–6
Définies dans « Titres de colonnes » → catégorie « Equations » : pour chaque équation, titre (2 lignes)
et formule. Opérateurs `+ − × /` (`*`, `/`), parenthèses [déd.], nombres, variables à 2 lettres.
Exemples : manuel `gg - hj` = (Contrats + avenants TTC) − Paiements sur contrat TTC ;
capture `gd - hj`. Calcul ligne par ligne (positions, entreprises, titres, total : l'équation est
évaluée sur les valeurs de la ligne, pas sommée). Division par 0 → cellule vide.

**Table complète des variables** (classe `EquationVar`) :

| Var | Colonne | Var | Colonne | Var | Colonne |
|---|---|---|---|---|---|
| aa | Indice ICC (index) | ca | DG révisé HT | ga | Contrats HT |
| ab | DG HT | cb | TVA DG révisé | gb | TVA contrats |
| ac | TVA DG | cc | DG révisé TTC | gc | Contrats TTC |
| ad | DG TTC | cd | DG révisé % | gd | Contrats + avenants HT |
| ae | DG indexé | ce | DG rév. par m2 | ge | TVA contrats + avenants |
| af | DG % | cf | DG rév. par m3 | gg | Contrats + avenants TTC |
| ba/bb/bc | Renchérissement 1 HT/TVA/TTC | cg | DG rév. − DG | gh/gi/gj | Avenants HT/TVA/TTC |
| bd/be/bf | Transferts 1 HT/TVA/TTC | da…dl | Mutations 2 (même ordre que b.) | gk/gl/gm | Montants plafonnés HT/TVA/TTC |
| bg/bh/bi | Variations 1 HT/TVA/TTC | ea/eb/ec | DG révisé 2 HT/TVA/TTC | gn/go/gp | Métrés HT/TVA/TTC |
| bj/bk/bl | Mutations 1 HT/TVA/TTC | ed/ef/eg | DG rév. 2 %, /m2, /m3 | gq | Bénéfice d'adjudication |
| ha/hb/hc | Paiements HT/TVA/TTC | eh / ej | DG rév. 2 − DG / − DG rév. | ia | Montant de garantie |
| hd/he/hf | Paiements renchérissement HT/TVA/TTC | fa/fb/fc | Renchéri. ICC HT/TVA/TTC | ja | Contrat − paiements |
| hh/hi/hj | Paiements sur contrat HT/TVA/TTC | fd | DG indicé | jb | Contrat − paiements sur contrat |
| hk/hl/hm | Paiements hors contrat HT/TVA/TTC | ka/kb/kc | Coût probable HT/TVA/TTC | jc | Plus-/moins-values |
| hn / ho | Paiements finaux HT / TTC | kd/ke/kf | Coût probable perso HT/TVA/TTC | jd | Contrat/DG rév. − paiement final |
| la/lb/lc | Libre 1 HT/TVA/TTC | kg/kh/ki | Provision HT/TVA/TTC | je | Contrat/DG rév. − paiements |
| ma/mb/mc | Libre 2 HT/TVA/TTC | kj/kk/kl | Etat du coût HT/TVA/TTC | oc | Honoraires % |
| na/nb/nc | Libre 3 HT/TVA/TTC | pa/pb/pc | Honoraires : montant DG soumis HT/TVA/TTC | pd/pe/pf | Honoraires HT/TVA/TTC |

---

## 13. Documents imprimables du contrôle des coûts
Menu « Documents » de chaque section (chaque document : aperçu, « Document » / « PDF »,
« Note d'expédition », « Commentaire sur le document », « Partager le fichier PDF », « Effacer le
document », options « Arrondir les conditions », « Afficher le total arrondi ») :

| Section | Documents | Contenu clé |
|---|---|---|
| Contrôle du coût | « Contrôle des coûts » / « Récapitulatif des coûts » | tableau selon la présentation, plage « CFC: » de/à, « Ouvrages: », totaux 1–2 chiffres, « Totaux des centres de coût », sauts de page manuels (« Insérer un saut de page ») |
| Devis général | « Devis général » | CFC, désignation, montants, % |
| Mutations | « Liste des mutations », « Mutation » (feuille) | n°, statut, genre, date, CFC / CFC partenaire, montants avant/après, « Devis original », « DG révisé », signature |
| Adjudications | « Liste des adjudications », « Contrat », « Avenant » | page de garde contrat (parties, MO, architecte, DT, entreprise, « L'offre du … sert de base au présent contrat », début/fin des travaux, conditions, « Lieu, date », « Timbre et signature ») |
| Paiements | « Rapport des paiements » | liste filtrée + « Récapitulatif » TVA |
| Ordres de paiement | « Ordre de paiement », « Bon de paiement » | § 8 |
| Comptes d'entreprise | « Compte d'entreprise » | |
| Arrêtés de compte | « Arrêté de compte », « Liste des garanties » | § 10 |

Champs d'en-tête communs : « Titre du document », « Date du document », « Collaborateur »,
« Maître d'ouvrage dans l'ouvrage », « Numéro du document », « Version du document », « Information
du document », « Filtre ». Pour DeltaSub : générer ces documents en HTML imprimable A4 (portrait ;
paysage pour le tableau principal) avec la mise en page du bureau (Akkurat, cf. CLAUDE.md).

---

## 14. DELTAreporting (manuel p. 87)
Module « MANAGEMENT → Reporting » : ratios de productivité à partir des **heures saisies** (pas du
contrôle des coûts). Écran : filtre (« Filtré »), année ◀ 2017 ▶, documents, engrenage.
Colonnes de sélection : « Catégorie » (« Vue d'ensemble », « Collaborateurs », « Collaborateurs… »,
« Comparaison a[nnuelle] ») · « Collaborateur » (liste) · (« Numéro | Affaire » en comparaison).
- **Vue d'ensemble** : tableau « Type d'activité | Jan … Déc | Année » — « Heures facturables »,
  « Heures non facturables », **« Heures de présence »** (total, fond gris), « % Heures facturables »,
  « % Heures non facturables » ; puis « Heures d'absences », « Heures de vacances », **« Total des
  heures »**, et les % correspondants. (Autres libellés : « Heures prévues », « Solde », « Heures
  d'appoint », « Solde des heures à effectuer y.c. heures d'appoint ».)
- **Comparaison annuelle** : colonnes « 2018 | +/- | 2017 | +/- | … » ; lignes par activité groupées
  (« Affaires », « Etudes » → « Heures facturables » ; « Travaux de bureau », « Formation continue »,
  « Direction », « Concours », « Acquisition », « Conseil d'administration » → « Heures non
  facturables » ; absences « Absences justifiées (mariage, naissance, …) », « Maladie, accident,
  maternité », « Militaire, service civil », « Formation, apprentis » → « Heures d'absences » ;
  « Vacances » ; **« Total général »**). Option « Comparer ^0 ans », « Année de référence ^0 ».
- **Graphique** sous le tableau : titre (« Heures de présence, 2017 »), axe « Heures [h] » ; choix
  « Mois » / « Années » / « Total » et type « Courbes », « Barres », « Barres empilées », « Secteurs ».
À rattacher au module Heures de DeltaSub (données `sa_heures`) — voir spec correspondante.

---

## 15. Modèles (manuel p. 88–93)

### 15.1 Organisation (section « MODELES » du navigateur)
Sous-menus : « Images », « Arrière-plans », « Modèles d'adresses », « Modèles d'étiquettes »,
« Modèles d'affaires », « Modèles de collaborateurs », « Modèles de frais », « Modèles de temps de
travail », « Modèles de management ».
- **Images** : liste « Fichier » (PNG/JPEG, 300 dpi recommandé) + aperçu ; + / −. Messages « Ce format
  de fichier d'image n'est pas compatible. », « Ce nom est déjà utilisé. ».
- **Arrière-plans** : fichiers XML nommés `<A3|A4> <Page de garde|1ere page|Pages suivantes>
  <portrait|paysage>.xml` (+ équivalents DE/IT) ; + / dupliquer / crayon / − ; aperçu. Un document =
  **page de garde** + **1re page** + **pages suivantes** (+ dernière page pour certains) ; chaque page =
  calque page + calque arrière-plan (logo, pied de page).
- **Modèles d'…** : 3 colonnes : « Groupe » (« DELTA Originaux » non modifiable, « Standard »,
  groupes du bureau) — « Type de modèle | Nom » (ex. « Arrêté de compte », « Avenant », « Bon de
  paiement », « Commande », « Comparatif », « Contrat contrôle du coût », « Contrôle du coût »,
  « Devis général », « Facture », « Liste d'adjudications »…) — « Modèle | Langue » (« Page de
  garde », « 1ère page », « Page suivante » × langue) + aperçu. Chaque affaire choisit son groupe.
- **Nouveau modèle / Editer le modèle** : « Type de modèle », « Nom », libellés « Deutsch »,
  « Français », « Italiano », « English », cadre « Copier les modèles depuis » (« Groupe », « Modèle »).
  Groupe : « Nouveau groupe de modèles » (« Seuls les groupes de modèles vides peuvent être
  supprimés. »), « Modifier la police dans tous les modèles du groupe ».

### 15.2 Éditeur de modèle (fenêtre `<Groupe> - <Type> - <Nom> - <Page> (<Langue>)`)
- Menus « Fichier » (« Fermer ⌘W », « Enregistrer ⌘S », « Mise en page ... ⇧⌘P »), « Edition »,
  « Vue » (guides, grille, zoom 100 %), « Etiquettes » (« Insérer des étiquettes ... », « Supprimer
  les étiquettes »).
- Barre d'outils 1 : ligne horizontale, ligne verticale, rectangle, **T** (texte), champ, tableau,
  image, image variable (croix), logo ; alignements / distribution / premier plan–arrière-plan.
- Barre 2 : « Arrière-plan » (choisir → fenêtre « Choix de l'arrière-plan » : liste + aperçu +
  « 21.0 cm x 29.7 cm (A4) »), « Remplissage » [couleur], « Style de trait » « Couleur » « Epaisseur »
  [0.25 pt] « Segmentation ».
- Barre 3 : police, taille, couleur, **B** *I* U, alignement gauche/centre/droite.
- Plan de travail : règles en cm, grille 5 mm, lignes guides roses (déplaçables).
- Clic droit sur un objet : « Premier plan », « Arrière-plan », « Editer le champ ... »,
  « Verrouiller le texte ».
- **Types de champ** : texte fixe (plusieurs polices possibles), **variable** (une police/taille),
  **tableau** (liste d'adresses, bloc de conditions…), informations.
- Fenêtre **« Editer le champ »** : « Catégorie » (« Général », « Adresses », « Affaires », « Rôle dans
  l'affaire », « Etiquettes », « Temps de travail », « Notes de frais », « Direction d'entreprise »,
  « Bâtiment ») · « Type de rubrique » (Général : « Utilisateur », « Page », « Date », « Date du jour »,
  « Heure », « Titre de document », « Concerne », « Remarque », « Période », « Filtre », « Texte libre
  1…5 » ; Affaires : …, « Titres de colonnes », « Conditions », « Image de l'affaire ») · « Format »
  (ex. « Page », « Nombre de pages », « Page et nombre de pages ») · « Compléments de texte » « Texte 1 »
  (« Page ») « Texte 2 » (« de ») « Texte 3 » · « Exemple » (« Page 1 de 1 »).
  Pour un tableau : « Hauteur de ligne [5] mm », « Traits horizontaux », « Traits verticaux »,
  « Fond alterné », « Couleur de trait », « Couleur de fond alterné » (le tableau et ses titres de
  colonnes doivent avoir la même largeur).
- **Image variable** : champ « Image de l'affaire », « Emplacement du dossier d'affaire », « Nom du
  fichier » (ex. `affaire.png`, dans le dossier de l'affaire, actualisable).
- **Verrouiller** : clic droit « Verrouiller le texte » (non modifiable en mode édition du document).
- **Guides** : afficher/masquer ; **Transparence** : cadre transparent par défaut, fenêtre
  « Couleurs » (onglets … « Transparence », curseur « Alpha » 0.0–1.0).
- **Étiquettes** (p. 93) : modèles « Zweckform », « Herma » (n° de planche `No. 4267.xml`…),
  « Modèles personnalisés » ; assistant **« Définir les étiquettes »** : marges haut/gauche (mm),
  espacements horizontal/vertical, largeur (70.0 mm) et hauteur (29.7 mm) d'étiquette, marges
  intérieures ; étiquettes cadrées en jaune, zone de contenu en gris ; cases « Effacer les étiquettes »,
  « Insérer les étiquettes ».

### 15.3 Transposition DeltaSub
Pas d'éditeur WYSIWYG complet. Prévoir : (1) images/logos du bureau stockés une fois ;
(2) gabarits HTML fixes par type de document (page de garde / 1re page / suivantes, A4 portrait et
paysage) reproduisant les documents papier du bureau ; (3) champs variables par jeton
`{{affaire.numero}}`, `{{mo.adresse}}`, `{{page}} / {{pages}}`… ; (4) « Image de l'affaire »
optionnelle ; (5) étiquettes : un seul format (planches du bureau) paramétrable en mm.

---

## 16. Planification des coûts (eBKP / eCCC-Bâtiment)

Le manuel en parle peu ; spécification d'après les libellés `deltaproject.costplanning*` et deux
documents réels convertis (`cp_2951_252` : 413 éléments, 6 ouvrages ; `cp_2951_3`).

### 16.1 Document
Domaine d'affaire « Détermination des coûts » (titre de fenêtre). Nouveau document : « Nom du
document », « Mots-clés », « Langue », « Affaire », « Utilisateur », « Statut » (« Brouillon »,
« Provisoire », « Définitif »), « Date du prix », « Date », « Indice » (100), « Variante » /
« N° de variante », **« Catalogue »** (« eCCC-Bâtiment », « eCCC-Génie civil », « CCP 2009 Bâtiment »…),
« Titre du document » (défaut « Estimation des coûts »), « Genre d'affaire », « Précision »
(« Marge d'approximation du DG »).

### 16.2 Navigation (barre latérale)
« QUANTITES REFERENTIELLES » (« Groupes », « Unités fonctionnelles », « Données de base ») ·
« ELEMENTS » (Editer / Documents) · « CALCULS » · « APERCU » · « CHIFFRES CLEFS » · « CALCUL DES
RESULTATS » · « DONNEES DE L'AFFAIRE » (+ « IFC »).

### 16.3 Quantités référentielles (SIA 416 / eCCC)
Tableau « Abrév. | Désignation | OUV | Localisation | Unité | Définitif | Quantité réf. | Note interne |
Remarque | Remarque de calcul | Calcul | Résultat | Coût de réalisation/QR | Coût de l'ouvrage/QR |
Coût d'investissement/QR ». 238 grandeurs standard, ex. `SA` Surface de terrain (ST), `FA` Surface de
plancher (SP), `USA` Surface utile (SU), `BRA` Surface de toiture, `FGA` Surface de façades…, `BEV`
Volume d'excavation, `ACC11…` parts de montant (CHF). Unités UN/ECE : `MTK` m², `MTQ` m³, `MTR` m,
`C62` p (pièce), `UserDef_CHF`. Saisie par ouvrage ; calcul par lignes de formule (« Calcul »,
« Remarque de calcul », sous-totaux) → quantité = Σ lignes. Filtres « Grandeurs référentielles
personnalisées », « Positions avec quantités référentielles », « Positions sans quantité référentielle ».

### 16.4 Éléments (écran principal)
Arborescence eCCC-Bâtiment : 14 groupes principaux (1 lettre) — A Terrain, B Travaux préparatoires,
C Gros œuvre, D Installations, E Revêtements de façades et de murs contre terre, F Toitures,
G Aménagements intérieurs, H Installations spécifiques, I Abords de bâtiments, J Ameublement,
décoration, V Etude du projet, W Frais secondaires à la réalisation, Y Provisions, renchérissement,
Z Taxe sur la valeur ajoutée — puis groupes d'éléments (`F01`) et éléments (`F01.03`).
Colonnes : « Code | SE Code | Comp. | Désignation | OUV | Grand. réf. | Quantité | Unité | Prix |
Unité | Coûts | Indice de forme | [%] | Remarque | Notes internes | N° CFC | Coûts selon CFC |
Différence | Définitif | Option | Énergie grise | Coefficient U | Effet de serre ».
Menus « Editer » : « Nouveau groupe principal », « Nouveau groupe d'éléments », « Nouvel élément »,
« Nouveau sous-élément », « Navigateur de sous-éléments », « Composant », « Subdivision »,
« Supprimer un élément », « Supprimer tous les prix de tous les articles », « Niveau de saisie des
valeurs », « Afficher uniquement les articles avec un montant ». Présentations : « Standard »,
« Avec le calcul de prix », « Avec des coûts ».
**Calcul d'un élément** (fenêtre « Référence de coût ^0 ») : grandeur référentielle (ex. `BRA`),
quantité (reprise des quantités référentielles de l'ouvrage), valeur référentielle (prix unitaire),
`Coûts = Quantité × Prix` ; ou prix en % (`priceIsPourcent` : `Coûts = Quantité(CHF) × % / 100`,
ex. honoraires, TVA) ; « Fixer le coût » ; « Utiliser uniquement les coûts » ; « Position éventuelle
(ne pas inclure le montant) » ; « Le calcul est définitif » ; « Origine du prix » (« Offre »,
« Prévision », « Calcul », « Estimation », « Supposition », « Office fédéral de la statistique ») ;
onglets « Composants », « Calcul », « Locaux », « Propriétés », « CAN », « Description », « Images »,
« Documents », « Attribution CFC », « Évaluation écologique », « Exécution ».
Totaux : groupe = Σ enfants ; Z (TVA) = taux × Σ(B…W) [obs. : 8.1 % × 647'900 = 52'479.90].
Exemples réels : F01.03 Toitures inclinées 53 m² × 100 = 5'300 ; G02.02 Revêtements de sol 62 m² ×
210 = 13'020 ; V01.01 Architectes 250'000 (montant forfaitaire via grandeur CHF).

### 16.5 Aperçu et chiffres clés
« APERCU » : « Code | Désignation | Ouvrage | Abrév. | Quantité | Unité | Valeur réf. | Coûts |
Coût investis. % | Coût réalisation % | Coût de l'ouvrage % | CHF/m² SP » ; vues « Groupes d'éléments »,
« Groupes principaux CFC », « Afficher les subdivisions » ; totaux :
- **« Coût de l'investissement »** = A…Z ;
- **« Coût de la réalisation »** = B…W (paramétrable « de / à ») ;
- **« Coût de l'ouvrage »** = C…G (paramétrable) ;
- « Coût de l'ouvrage selon CFC (0-9) / (1-9) » (si attribution CFC).
Configuration : « Pourcentage sur le total général » / « … sur le groupe principal », « Définitions
des coûts » (de/à), « Arrondir ». « CHIFFRES CLEFS » : unités fonctionnelles = ratios (ex. `USA/FA`,
`FGA/FA`, `BRA/FA`, `BEV/FA`, `CFC_2/FA` en CHF/m²).

### 16.6 Documents et passerelles
Documents : « Quantités référentielles », « Eléments », « Coûts sommaires », « Volumes », « Surfaces »,
« Évaluation écologique » (options arrondi 1/100/1000, sous-éléments, subdivisions…).
Passerelles : **« Créer un devis selon le CFC »** (→ DG : « Transférer les désignations des éléments
dans le devis général », « Transférer la description dans le devis », « Transférer les quantités
référentielles », TVA requise) ; « Créer un descriptif selon le CAN » ; « Export/Import SIA451 » ;
« Import BIMeq » (ArchiCAD) ; « Calcul des résultats » (comparaison avec un contrôle des coûts :
« CostcontrolSelectionDialog »).

---

## 17. Structure des données DELTA (déduite des JSON)

Sérialisation Java (`Ser2Json`) : chaque objet porte `$c` (classe) et `$id` ; références `$ref`
(uniquement préférences/couleurs et quelques `condList` d'arrêtés). Dates = chaîne Java
`"Mon Jan 22 00:00:00 CET 2024"`.

### 17.1 Hiérarchie `deltaproject.costcontrol.data.*`
```
Costcontrol
├─ réglages : useKv2CostAccount, useIndexCostAccount, useAwardCostAccount, useMeasureCostAccount,
│             useFreeCostAccount1..3, useFreeAddendum, kvFactor, doRound, equation1..6, separateVat,
│             payStateProposal, payAfterBillDays, mutStateProposal, awardingEqualToBKP, bruttoInputPref,
│             contractPriorityPref, payWidthDetailsPref, accountPreferences, lookPaymentOrder (texte compte),
│             payToEachSubproject, adviceOfPayNumberPerEachBuildOwnder, bookRefNum (compteur d'écritures)
├─ germanColumnNames / frenchColumnNames / italianColumnNames / englishColumnNames : ColumnNames (<col>_1, <col>_2)
├─ mutationsList[Mutation]     kind(1 transfert,2 renchérissement,3 variation), sign("T1"…), frenchText, isSelected
├─ conditionList[Condition]    catalogue (kind, sign, frenchText…)
├─ paymentList[Payment]        kind(1 AC,2 TC,3 GC,4 AZ), sign, frenchPayText, frenchBillText
├─ *DisplayList[ColumnSetting] présentations : name, isFavorite, order[ids], display<Col>, detail<Col>,
│                               width<Col>, id<Col>, + *Pref / *PrintPref (options d'affichage, couleurs)
├─ kvList[BkpItem]             POSITIONS CFC (DG)
│   ├─ number ("211.5"), text1 (désignation), text2, isGenerated (titre/position créée), isCostPosition,
│   │  kvTotal (DG TTC), kvExVat (HT), kvVat, percentage, priceState, comment
│   ├─ calcList[CalcItem]      lignes de calcul du DG : price (HT), vatFac (8.1), total (TTC),
│   │                          exclVatValue, vatValue, quantity, measUnit, equation, option
│   └─ entrepreneurList[Entrepreneur]   companyNumber (→ APP.CONTACT.ID ; −1 = « Aucune entreprise »),
│       │                               shortName, information, isLastPay
│       └─ subprojectList[SubProjectItem]  to (ouvrage), lg (localisation), dbId, scale, apply, zeroCost,
│           │                              kvTotal/kvExVat/kvVat (DG réparti), groupNumber
│           ├─ mut1List[Book] / mut2List[Book]   MUTATIONS
│           ├─ indexList[Book]                   renchérissement ICC
│           ├─ prognoseList / additionalPrognoseList / free1List..3 / awardList / measureList [Book]
│           └─ contractList, kvList                (non sérialisés : reconstruits en mémoire)
├─ contractList[Contract]      CONTRATS (isContract = vrai)
│   ├─ refNum, bookDate, companyNumber, vergabeNr (lot), vergabeText, contractNumber, remark (désignation),
│   │  description, contractState, brutto, netto (TTC), vat, contractHasPriotity, calcCondForward
│   │  (vrai = saisie du brut), detailPaymenst, workProgress (0–100), isContractBound, payToContract,
│   │  setGarantyDuration
│   ├─ detailList[BkpDetail]   POSITIONS : kag (CFC), to, lg, number (Réf. cond.), bruttoTotal,
│   │                          nettoTotal, vatTotal, condList[Condition] (chaîne calculée par ligne)
│   ├─ condList[Condition]     CONDITIONS du contrat (totaux)
│   ├─ addendumList[Contract]  AVENANTS (isContract = faux ; mêmes champs ; n° 1, 2…)
│   ├─ payList[Pay]            PAIEMENTS SUR CONTRAT
│   ├─ deductionList[Deduction] ARRÊTÉS DE COMPTE
│   └─ attachmentList[PaymentAttachment]  name, reference (chemin), reltativeToProjectFolder
├─ payList[Pay]                PAIEMENTS HORS CONTRAT (payCode 3)
├─ adviceOfPaymentList[AdviceOfPayment]   ORDRES : number, date, valutaDate, buildingOwnerRefNum,
│   │                                     bank*, refId, docState
│   └─ bookList[AdviceOfPaymentBook]      payRefNum (→ Pay.refNum), isPageBreakBefore
├─ builOwnerAccountList                   comptes MO
├─ setAddrList[Entrepreneur]              entreprises utilisées (carnet)
└─ filtres (overFilterList, contractFilterList[AwardingFilter], paymentFilterList[PayFilter]…),
   honorarItemList, descList
```

**Condition** : kind, frenchText (+ DE/IT/EN), sign, step (NIV), refStep (REF), number (Réf. cond.),
condValue (taux ou montant), total (montant calculé), refStepValue (base), applay (M), vatRefNumber.

**Book** (écriture de mutation/provision/CP…) : refNum, remark, value (HT), vat, vatFac, total (TTC),
bookDate, bkpNumber, og, lg, partnerMutRefNum / partnerMutBkp / partnerMutOg / partnerMutLg
(contrepartie d'un transfert), costId (centre de coût : 1 = mutations 1…), mutDocState, setMutationsSign
("T1"), setMutationsText, mutKind (1/2/3), isOrigMutationPos (vrai = côté origine, montant négatif),
mutNum (n° de mutation, partagé par les 2 écritures), description, kvIndex.

**Pay** : refNum, payNumber (N° pmt), billNumber, payDate, billDate, remark (commentaire), description,
companyNumber, payState, isLastPay, calcCondForward, payKind (texte) / payCode (1 AC situation,
2 renchérissement, 3 hors contrat, 4 paiement final), vergabeNr, vergabeText, vergNumber (n° d'ordre
de paiement [déd.]), brutto (cumul brut pour une situation), netto (montant payé TTC), vat,
detailList[BkpDetail] (+ payCode, payState par ligne), condList, coordonnées bancaires copiées
(name, street, postalcode, location, account1, account2, swift, clearingNr, iban,
buildingOwnerAccount2), attachmentList, isListed.

**Deduction** (arrêté) : refNum, number, bookDate, deductionState, garantyKind, value (montant de
garantie), garantyBegin, garantyEnd, deductionExVat / deductionVat / deductionTotal (facture
finale), calcForward, detailList[DeductionDetail] (kag, bruttoTotal, nettoTotal, vergabeBruttoTotal,
vergabeNettoTotal, vatTotal, condList), condList, addendumList, attachmentList.

**Codes d'état** — lus dans les enums du logiciel (réflexion Java, fiables) ; remplace les déductions antérieures :

| Objet | Codes | Observé au bureau |
|---|---|---|
| CostDocState (enum) | 1 Créé, 2 Provisoire, 3 En cours, 4 Etat intermédiaire, 5 Terminée | — |
| COSTCONTROLDOCUMENT.STATECODE (base) | 0-based [déd.] : 0 Créé, 1 Provisoire, 2 En cours, 3 Etat intermédiaire, 4 Terminée | 0, 1, 3 |
| ContractState | 1 Brouillon, 2 En traitement, 3 Sur demande, 4 Pour signature, 5 Définitif | 5 partout |
| MutDocState | 1 Brouillon, 2 Provisoire, 3 Demande transmise, 4 Acceptée, 5 Rejetée | 1 partout |
| PayDocState (paiement) | 1 réceptionné, 2 libéré, 3 transmis, 4 débité | 2, 3 |
| AdviceOfPaymentState (ordre) | 0 En traitement, 1 Contrôlé, 2 Transmis, 3 Débité | 0, 1, 2 |
| DeductionDocState (arrêté) | 1 établi, 2 pour signature, 3 définitif (0 = non défini) | 0, 1, 2 |
| GarantyKind | 1 Banque, 2 Assurance, 3 Comptant, 4 Sans garantie (0 = non défini) | 0, 1, 2 |
| AddendumState | 1 Lié au contrat, 2 Non lié au contrat | lié |
| PayKind (payCode) | 1 sur contrat, 2 renchérissement, 3 hors contrat, 4 final sur contrat, 5 final renchérissement, 6 final hors contrat, 7 régie | 1, 3, 4 |
| ConditionKind | 1 Rabais, 2 Déduction, 3 Escompte, 4 Retenue de garantie %, 5 Retenue forfait, 6 TVA, 7 Arrondi, 8–19 taxes/prorata/panneau/assurance/énergie/eau (% puis forfait), 20 Paiements à ce jour, 21 Autres %, 22 Autres forfait | |
| CostId (Book/BaseBook) | 0 DG, 1 Mutations 1, 2 Mutations 2, 3 ICC, 4 Contrat, 5 Avenant, 6 Montant plafonné, 7 Métré, 8 Paiement, 9 Coût probable perso, 10 Provision, 11–13 Libre 1–3 | 1, 10 |

### 17.2 Planification des coûts `deltaproject.costplanning.data.*`
```
CostplanningDocument : docTitle, docDate, index, round, erstellungsCostFrom/To ("B"/"W"),
  bauwerksCostFrom/To ("C"/"G"), options d'affichage, surfaces/volumes SIA (floorArea…),
  functionalUnit[FunctionalUnit(name, equation, measUnit, keyFigureKind)], documentList[DocSorter]
├─ elemList[Element] : number ("F01.03"), text1, measUnit, measUnits, refCode, uneCode, quantity,
│   price, value, priceIsPourcent, priceIsQuantityPourcent, fixedValue, isEventualPosition,
│   calculationIsDefinitiv, remark, internalNote, description, greyEnergy, uValue, greenHouseEffect,
│   priceOrigin, kagList (attribution CFC), isGenerated, editionYear
│   └─ divList[Subproject] : og (code ouvrage), lg, refCode, quantity, price, value, proc,
│       calculationsKind (0 sans calcul, eCCC, CAN), subElementList[SubElement(number, text1,
│       quantity, price, value, components…)]
└─ baseQuantityList[BaseQuantity] : refCode, uneCode, text, measUnit, quantity, calcIsDefinitiv,
    refCodeForCalculation, subProjectList[BaseQuantitySubproject(og, quantity, calcList[CalcItem
    (formula, comment, quantity, betweenTotal)])]
```

---

## 18. Schéma cible simplifié pour DeltaSub (esquisse — REMPLACÉE par le § 22 « Schéma final DeltaSub »)

Stockage : `localStorage` clé **`sa_cc`** (objet `{ [idDocument]: CC }`) + index des documents par
affaire. Montants en CHF, nombres JS, arrondis au centime à l'affichage ; les montants calculés
(totaux, CP, états) **ne sont pas stockés** — recalculés à l'ouverture.

```jsonc
{
  "id": "cc_915_3601",               // id unique
  "affaire": "FA26.xxx",             // code affaire DeltaSub (lien sa_affaires)
  "version": "Etat au 30.09", "versionNr": 1,
  "statut": "en_cours",              // cree | provisoire | en_cours | intermediaire | terminee
  "notes": "", "user": "Paulo", "modifie": "2026-09-29",
  "source": { "delta": "Costcontrol/915/3601", "importe": "2026-09-29" },
  "config": {
    "mutGenres":  [{ "code": "T1", "texte": "Transfert", "genre": "transfert" }, …],
    "payGenres":  [{ "code": "AC", "texte": "Situation", "facture": "Situation", "genre": "contrat" },
                   { "code": "AZ", "texte": "Paiement final", "facture": "Facture finale", "genre": "contrat_final" },
                   { "code": "GC", "texte": "Paiement", "facture": "Facture", "genre": "hors_contrat" },
                   { "code": "TC", "texte": "Paiement de renchérissement", "genre": "rencherissement" }],
    "condCatalogue": [{ "kind": 1, "code": "R1", "texte": "Rabais", "type": "pct" }, …],
    "centres": { "mut2": false, "icc": false, "libre1": false, "libre2": false, "libre3": false,
                 "plafonne": false, "metre": false },
    "compta": { "tvaVisible": true, "joursPaiement": 30, "statutPaiementDefaut": "transmis",
                "statutMutationDefaut": "acceptee", "saisieBrutDefaut": true,
                "contratPrioritaireDefaut": true, "paiementDetailsDefaut": true,
                "texteCompte": "Voir bulletin de versement", "avenantsNonLies": false, "arrondir": false },
    "facteurDG": 1.0, "indiceBase": null,
    "equations": ["gg - hj", "", "", "", "", ""],
    "titres": { "fr": { "kvTot": ["DG", ""], "kv1Tot": ["DG rév. TTC", ""], … } }
  },
  "comptesMO": [{ "mo": 3930, "ouvrage": "", "banque": "", "rue": "", "npa": "", "lieu": "",
                  "clearing": "", "swift": "", "ccp": "", "contact": "", "iban": "", "compte": "" }],
  "positions": [                      // DG, trié par CFC ; titres NON stockés (calculés)
    { "cfc": "211.5", "lbl": "Béton et béton armé", "lbl2": "", "genere": false,
      "dg": { "ht": 800185.00, "taux": 8.1, "ttc": 865000.00 },
      "calc": [{ "qte": 0, "unite": "", "prix": 800185.00, "taux": 8.1, "ttc": 865000.00, "txt": "" }],
      "repart": [{ "ent": 10504, "ouv": "", "ttc": 0 }]   // répartition DG par entreprise (rare)
    }
  ],
  "entreprises": { "10504": { "nom": "…", "npa": "", "lieu": "", "adrId": 10504 } },
  "mutations": [                      // 1 objet par mutation (les 2 écritures DELTA fusionnées)
    { "id": "m40", "centre": 1, "num": 40, "code": "T1", "genre": "transfert",
      "date": "2025-09-10", "statut": "acceptee", "remarque": "…", "commentaire": "",
      "de": { "cfc": "225.3", "ent": null, "ouv": "" },     // origine (null pour variation)
      "vers": { "cfc": "1", "ent": null, "ouv": "" },       // destination / position
      "ht": 41069.15, "taux": 8.1, "ttc": 44395.75 }        // montant positif ; signe par le genre
  ],
  "ecritures": [                      // CP perso, provisions, libres, plafonné, métré, ICC
    { "id": "e1", "type": "cp_perso|provision|libre1|libre2|libre3|plafonne|metre|icc",
      "cfc": "211.6", "ent": null, "ouv": "", "date": "2019-02-06", "remarque": "",
      "ht": 204271.10, "taux": 7.7, "ttc": 220000.00, "zero": false, "indice": null }
  ],
  "contrats": [
    { "id": "c72", "type": "contrat", "parent": null, "lie": true,
      "num": "17", "designation": "Contrat", "date": "2024-01-22", "statut": "definitif",
      "ent": 10504, "lot": { "num": "222", "txt": "…" },
      "prioritaire": true, "saisie": "net", "niveau": 0, "delaiGarantie": "",
      "description": "", "annexes": [{ "nom": "", "chemin": "", "relatif": true }],
      "lignes": [{ "cfc": "222", "ouv": "", "ref": "", "brut": 112022.60, "net": 112524.50 }],
      "conds": [{ "niv": 1, "ref": 0, "kind": 1, "lbl": "Rabais", "refCond": "", "val": -5.0, "on": true },
                { "niv": 2, "ref": 1, "kind": 3, "lbl": "Escompte", "refCond": "", "val": -1.0, "on": true },
                { "niv": 3, "ref": 2, "kind": 10, "lbl": "Prorata (%)", "refCond": "", "val": -1.2, "on": true },
                { "niv": 4, "ref": 3, "kind": 6, "lbl": "TVA", "refCond": "", "val": 8.1, "on": true }],
      "delta": { "brut": 142030.40, "net": 142666.75, "tva": 10690.11 }   // contrôle d'import
    },
    { "id": "c82", "type": "avenant", "parent": "c72", "lie": true, "num": "1", … }
  ],
  "paiements": [
    { "id": "p181", "contrat": "c72",          // null = hors contrat
      "code": "AZ", "genre": "contrat_final", "dernier": true,
      "num": "26", "numFacture": "", "dateFacture": "2025-12-15", "datePaiement": "2026-01-14",
      "statut": "transmis", "commentaire": "Paiement final", "description": "", "niveau": 0,
      "ent": 10504, "lot": { "num": "211.5", "txt": "…" }, "saisie": "net",
      "lignes": [{ "cfc": "211.5", "ouv": "", "ref": "", "brut": 1186304.87, "net": 97915.65 }],
      "conds": [ … , { "niv": 4, "ref": 3, "kind": 20, "lbl": "Paiements à ce jour", "val": 1012103.95, "on": true }, … ],
      "banque": { "nom": "", "iban": "", "clearing": "", "swift": "", "compte": "" },
      "annexes": [], "ordre": "o1",
      "delta": { "brut": 1186304.87, "net": 97915.65, "tva": 7336.88 }
    }
  ],
  "ordres": [{ "id": "o1", "num": "1", "date": "2025-01-01", "valeur": "2025-01-01", "mo": 3930,
               "compte": {…}, "statut": "brouillon", "paiements": ["p172", "p174"] }],
  "arretes": [{ "id": "a884", "contrat": "c72", "num": "15", "date": "2025-12-16", "statut": "definitif",
                "saisie": "net", "lignes": [{ "cfc": "211.5", "brut": 1186304.86, "net": 1192000.00 }],
                "conds": [ … ], "garantie": { "genre": "assurance", "montant": 119200.00,
                "debut": "2025-10-31", "fin": "2027-10-30", "num": "" }, "description": "", "commentaire": "" }],
  "presentations": [{ "nom": "Standard", "section": "controle",
                      "colonnes": [{ "id": "kvTot", "w": 100, "details": false }, …],
                      "options": { "gras1": true, "gras2": true, "gras3": true, "italique": true,
                                   "carDetail": "-", "carDernier": "F", "couleurs": { "mut": "#993300",
                                   "contrat": "#FF6633", "paiement": "#003366" }, "pct": "groupe" } }],
  "presentationActive": { "controle": "Standard", "paiements": "Standard", … }
}
```
Identifiants de colonnes DeltaSub = noms DELTA (`kag`, `kagText`, `entrepreneur`, `kvTot`, `kvProcent`,
`mutationTot1`, `kv1Tot`, `addendumToContractTot`, `contractAndAddendumTot`, `payementTot`,
`forcastCalculatedTot`, `additionalCostsTot`, `balanceOfCostsTot`…) → conversion directe des
présentations (`order` = liste d'ids numériques → table id↔nom du § 2.2).

---

## 19. Règles de conversion DELTA → DeltaSub

1. **Lecture** : fichier `…/Costcontrol/<projet>/<doc>/coco/costcontrol` (jamais les copies
   `coco_JJ.MM…`) → `Ser2Json` → JSON ; le nom d'affaire / n° vient de `APP.PROJECT` (PROJECT_ID) ;
   métadonnées document depuis `APP.COSTCONTROLDOCUMENT` (VERSION, VERSIONNUMBER, STATECODE, NOTE,
   USERID, CHANGEDDATE). Ignorer `ISMARKEDASDELETED = 1`.
2. **Dates** : `"EEE MMM dd HH:mm:ss zzz yyyy"` → `YYYY-MM-DD` en **heure locale** (ne pas passer
   par UTC : minuit CET deviendrait la veille).
3. **Positions** : une entrée par `BkpItem` dont `isGenerated = faux` **ou** qui porte des écritures
   (positions générées par le plan comptable, ex. `101.6`) ; les titres (`isGenerated` sans écriture)
   sont recalculés. `dg.ttc = kvTotal`, `dg.ht = kvExVat`, taux = `calcList[0].vatFac` (sinon
   `kvVat/kvExVat`). Libellé = `text1` (+ `text2`).
4. **Entreprises** : `companyNumber` → `APP.CONTACT.ID` (nom via le carnet d'adresses DeltaSub `sa_adr`),
   `-1` → `null` (« Aucune entreprise »). `shortName` pour l'affichage si l'adresse manque.
5. **Mutations** : parcourir `kvList[].entrepreneurList[].subprojectList[].mut1List` (centre 1) et
   `mut2List` (centre 2) ; regrouper les `Book` par `mutNum` + paire `refNum`/`partnerMutRefNum` ;
   origine = écriture `isOrigMutationPos = vrai` (valeur négative), destination = l'autre ; montant =
   valeur absolue. Variation/renchérissement : une seule écriture, montant signé, `de = null`.
   Genre : `mutKind` (1 transfert, 2 renchérissement, 3 variation) ; code : `setMutationsSign`.
   Contrôle : Σ transferts = 0.
6. **Autres écritures** : `prognoseList` → `cp_perso` (+ `zeroCost` de la subdivision → `zero`),
   `additionalPrognoseList` → `provision`, `free1..3List` → `libre1..3`, `awardList` → `plafonne`,
   `measureList` → `metre`, `indexList` → `icc`. CFC = `bkpNumber`, ent = entreprise parente.
7. **Contrats / avenants** : `contractList[]` (isContract vrai) → `type contrat` ; `addendumList[]` →
   `type avenant`, `parent` = contrat, `lie = isContractBound`. `saisie = calcCondForward ? "brut" : "net"`.
   Lignes = `detailList` (kag, to, number, bruttoTotal, nettoTotal) ; conditions = `condList`
   **d'en-tête** (step, refStep, kind, frenchText, number, condValue, applay) — les `condList` de
   lignes sont recalculées. Conserver brut/net/TVA DELTA dans `delta` pour le contrôle.
8. **Paiements** : `contractList[].payList` (et ceux des avenants) → `contrat` = id ; `payList` racine
   → hors contrat. `code` d'après `payCode` (1 AC, 2 TC, 3 GC, 4 AZ), `dernier = isLastPay`,
   `saisie = calcCondForward ? "brut" : "net"`, `statut` d'après `payState`. Garder `brutto` (cumul brut)
   et les conditions **y compris** « Paiements à ce jour » (kind 20, valeur figée) — en saisie DeltaSub
   la valeur est recalculée à partir des paiements antérieurs du même contrat (ordre de n°/date).
9. **Ordres** : `adviceOfPaymentList` → `ordres` ; `bookList[].payRefNum` → ids des paiements.
10. **Arrêtés** : `contractList[].deductionList` → `arretes` (garantie : `garantyKind`, `value`,
    `garantyBegin`, `garantyEnd`). Les `condList` en `$ref` renvoient à des conditions déjà lues.
11. **Présentations** : `overViewDisplayList` (+ listes des autres sections) → `presentations` ; ids →
    noms via le § 2.2 ; `display<Col>` = visible, `detail<Col>` = détails, `width<Col>` = largeur,
    `order` = ordre. Couleurs `java.awt.Color` → hex.
12. **Titres de colonnes** : `frenchColumnNames` → `config.titres.fr` (`<col>_1`, `<col>_2`).
13. **Validation après import** (obligatoire) : pour chaque contrat/paiement, recalculer brut/net/TVA
    avec le moteur § 6.3 et comparer à `delta` (écart toléré 0.05 CHF) ; comparer Σ DG, Σ contrats,
    Σ paiements par CFC avec l'écran DELTAproject (présentation Standard) sur 2–3 CC réels ; lister
    les écarts dans un rapport d'import.
14. **Confidentialité** : les fichiers JSON d'import contiennent des données clients — ne jamais les
    committer (cf. `.gitignore`), import uniquement via le fichier d'export local.

**Reprise de l'existant `sa_cout`** (Facturation.html, clé `sa_cout` = `{ [affaire]: { version, date,
rows:[{id,cfc,lbl,ent,dg}], ecr:[{type:'contrat'|'avenant'|'pay'|'mut'|'arr'|'prov'|'cp'|'pers', num,
ht, tva, ent, cfc, genre, sens, src, dst, hors, ordreId, numP, dateP, dateF, statut, conds, garantie…}],
ordres, tva, presAct, colOrder… } }`) : migrer `rows` → `positions`, `ecr` par type vers
`contrats` / `paiements` / `mutations` / `ecritures` / `arretes`, `ordres` → `ordres`. Garder la
lecture de `sa_cout` tant que la migration n'est pas validée.

---

## 20. Priorités

Contexte : 20–30 contrôles des coûts par an, module clé ; usage réel observé = DG attribué,
**transferts**, **contrats + avenants liés**, **situations cumulées avec retenue de garantie**,
**paiements finaux**, **paiements hors contrat**, **ordres de paiement / bons**, **arrêtés de compte**
avec garantie ; aucune utilisation de mutations 2, ICC, libres, plafonné, métré, équations.

**P1 — indispensable (reprise du travail quotidien)**
1. Liste des documents CC par affaire + duplication (états intermédiaires) + statuts.
2. Import DELTA (§ 19) avec rapport de validation ; import d'un DG validé depuis le module Devis.
3. Tableau « CONTRÔLE DU COÛT » : hiérarchie CFC, lignes entreprise, détails colorés, colonnes
   DG / Mutations / DG révisé / Contrats + avenants / Paiements / Coût probable / Provision / Etat
   du coût / DG %, 3 présentations du bureau, total général, export CSV, impression A4 paysage.
4. Moteur de conditions (NIV/REF, Réf. cond., saisie brut/net, TVA multiple, forfaits répartis,
   arrondi) — commun contrats/avenants/paiements/arrêtés, testé contre les données DELTA.
5. Contrats et avenants liés (fenêtre § 6.2), contrat prioritaire, statuts.
6. Paiements sur contrat (situation cumulée, garantie, paiements à ce jour, dernier paiement,
   paiement final) et hors contrat ; contrôles de dépassement ; statuts et verrouillage.
7. Transferts (fenêtre § 4.3) et variations (§ 4.4) avec numérotation.
8. Coût probable (§ 11) + coût probable perso + provisions + Etat du coût.
9. Ordres de paiement + bon de paiement + ordre imprimables ; comptes MO et bancaires (IBAN contrôlé).

**P2 — important**
10. Arrêtés de compte + garanties + liste des garanties + « Comptabiliser le paiement final ».
11. Rapport de paiement (tris, filtres, récapitulatif TVA) ; comptes d'entreprise ; liste des
    mutations et feuille de mutation ; liste des adjudications ; documents contrat/avenant.
12. Gestion des présentations (enregistrer/renommer/supprimer, glisser les colonnes, détails par
    colonne), fenêtre « Affichage », titres de colonnes éditables.
13. Filtres et favoris ; annexes PDF (facture d'entreprise jointe au bon).

**P3 — secondaire**
14. Équations personnelles, centres libres, montant plafonné, métré, mutations 2, ICC, facteur DG,
    ouvrages/localisations, prorata, honoraires.
15. Planification des coûts eBKP (§ 16) : saisie éléments/quantités, aperçu, passerelle « Créer un
    devis selon le CFC ».
16. Modèles : gabarits HTML simplifiés (§ 15.3) ; DELTAreporting à rattacher au module Heures.

---

## 21. Points à vérifier dans DELTAproject avant implémentation
1. ~~Correspondance des codes d'état~~ : résolu (enums lus dans le logiciel, § 17.1). Reste à confirmer
   seulement le décalage 0-based de `COSTCONTROLDOCUMENT.STATECODE`.
2. Coût probable avec paiements hors contrat sans contrat, et avec plusieurs entreprises par CFC :
   comparer 3 positions réelles.
3. Abréviations exactes de la colonne « Genre » des conditions (`G`, `P`, `-`).
4. Calcul ICC (base HT ou TTC) — seulement si le bureau veut l'utiliser.
5. Ordre de calcul des « Paiements à ce jour » (par n° de paiement ou par date) quand des paiements
   sont saisis dans le désordre.

---

## 22. Schéma final DeltaSub (sortie de `outils_deltaproject/convertir_couts.py`)

Remplace le § 18. Produit par `convert_costcontrol(raw, header)` / `convert_costplanning(raw, header)`.
Stockage serveur DeltaSub : deux **nouvelles collections** à côté des tables Derby importées
(`costcontroldocument`, `costplanningdocument` = en-têtes, champs MAJUSCULES) :

| Collection | Clé (id) | Valeur |
|---|---|---|
| `costcontrol` | `COSTCONTROLDOCUMENT.ID` (texte, ex. `"3601"`) | objet `ControleCouts` ci-dessous |
| `costplanning` | `COSTPLANNINGDOCUMENT.ID` (ex. `"252"`) | objet `PlanificationCouts` ci-dessous |

Fichier de sortie du convertisseur : `{"costcontrol": {"3601": {…}, …}, "costplanning": {"252": {…}, …}}`.
Montants : nombres CHF arrondis au centime, **TTC** sauf mention (`ht`, `tva`). Dates : `"AAAA-MM-JJ"` (heure
locale, jamais convertie en UTC) ou `null`. Références aux entreprises / MO : **`contactId` = ID `CONTACT`
Deltaproject** (`null` = « Aucune entreprise »). Les valeurs `…Code` gardent le code Deltaproject (§ 17.1).

### 22.1 `ControleCouts` (collection `costcontrol`)

```
id                  int      COSTCONTROLDOCUMENT.ID
projetId            int      PROJECT_ID
entete              { version, numeroVersion, statut (cree|provisoire|enCours|etatIntermediaire|terminee),
                      statutCode (STATECODE), note, utilisateur, dateModification, supprime (bool) }
source              { fichier ("Costcontrol/<P>/<ID>/coco/costcontrol"), formatDelta (int),
                      sauvegardes [noms des zip costcontrol_JJ.MM.AAAA HH.MM.zip] }
parametres          { centres { dgRevise2, rencherissementIcc, montantPlafonne, metre, libre1, libre2, libre3 : bool },
                      arrondir, facteurDG (float), equations [6 × texte],
                      tvaVisibleNouvellesEcritures, joursPaiementApresFacture (int),
                      statutPaiementDefaut, statutMutationDefaut, saisieBrutDefaut, contratPrioritaireDefaut,
                      paiementsAvecDetailsDefaut, texteCompteAuto, texteCompte, bonParOuvrage,
                      numerotationOrdresParMO, avenantsNonLiesAutorises, lotEgalCFC }
genresMutation      [ { code ("T1"), texte, genre (transfert|rencherissement|variation), actif } ]
genresPaiement      [ { code ("AC"), texte, texteFacture, genre (surContrat|surContratFinal|horsContrat|rencherissement…) } ]
catalogueConditions [ { kind (int § 17.1), code ("R1"), genre (rabais|escompte|…), nature (pct|forfait|cumul), texte } ]
titresColonnes      { <idColonne>: [ligne1, ligne2] }        idColonne = noms Deltaproject (kvTot, kv1Tot, payementTot…)
comptesMO           [ { ouvrage, localisation, banque, rue, npa, lieu, compte, compte2, swift, clearing, iban, contact } ]
entreprises         [ { contactId, nomCourt } ]              carnet local du document (nom affiché si l'adresse manque)
ouvragesProjet      [codes] | null                           ouvrages (SUBPROJECT.CODE) existant dans l'affaire ; null = inconnu
positions           [ Position ]      devis général (plan comptable CFC)
mutations           [ Mutation ]
ecritures           [ Ecriture ]      provisions, coût probable perso, libres, plafonné, métré, ICC
contrats            [ Contrat ]       contrats ET avenants (type)
paiements           [ Paiement ]      sur contrat (contratId) et hors contrat (contratId null)
ordresPaiement      [ OrdrePaiement ]
arretes             [ Arrete ]
presentations       { controle|devis|mutations|mutations2|adjudications|paiements|ordresPaiement|comptesEntreprise|
                      arretes|honoraires|descriptif : [ { nom, favori, colonnes [ { id, idDelta, largeur, details } ],
                      options { …booléens/texte d'affichage, ex. oneDigitBold, detailSign ("> "), finalPayment ("FF") } } ] }
annexes             [ { chemin (relatif à coco/), categorie (award|payments|paymentorder|finalpayment|overview|
                        entrepreneurInvoices|mutation|entrepreneur), type (pdf|dpdoc) } ]     — liens seulement
controle            { dgTTC, mutationsTTC, dgReviseTTC, contratsAvenantsTTC, paiementsTTC, provisionsTTC,
                      coutProbableTTC, etatCoutTTC }        totaux généraux calculés à la conversion (contrôle rapide)
```

**Position** : `{ cfc, libelle, libelle2, genere (bool : titre/position créée par le plan comptable), positionCout,
dgHT, dgTVA, dgTTC (0 pour un titre), tauxTVA, commentaire, lignesCalcul [ { texte, formule, quantite, unite, prixHT,
tauxTVA, ht, tva, ttc, option } ], parOuvrage [ { ouvrage, localisation, ouvrageId, dgHT, dgTVA, dgTTC, actif } ] }`

**Mutation** : `{ id ("m<refNum>"), centre (1|2), numero, code, genre (transfert|variation|rencherissement|
transfertSansContrepartie), genreTexte, date, statut (brouillon|provisoire|demandeTransmise|acceptee|rejetee), statutCode,
remarque, commentaire, origine { cfc, contactId, ouvrage, localisation } | null, destination { … }, ht, tauxTVA, tva, ttc }`
— `ttc` est **signé** : destination += ttc, origine −= ttc (variation : seulement la destination).

**Ecriture** : `{ id ("e<refNum>"), type (provision|coutProbablePerso|libre1|libre2|libre3|montantPlafonne|metre|icc),
cfc, contactId, ouvrage, localisation, date, remarque, ht, tauxTVA, tva, ttc, coutProbableZero (bool), indice (icc) }`

**Contrat** (contrat ou avenant) : `{ id ("c<refNum>" contrat, "a<refNum>" avenant), refNum, type (contrat|avenant),
contratParentId, lieAuContrat, numero, designation, date, statut (brouillon|enTraitement|surDemande|pourSignature|
definitif), statutCode, contactId, lot { numero, texte }, prioritaireSurDevis, saisie (net|brut), paiementsAvecDetails,
niveauPrestations (0–100), delaiGarantie, description, annexes [ { nom, chemin, relatifDossierAffaire } ],
lignes [ Ligne ], conditions [ Condition ], totauxDelta { brut, net, tva } }`

**Ligne** : `{ cfc, ouvrage, localisation, refCond, brut, net, tva, brutCalcul?, partsForfaits? }` —
`brut` = brut saisi (pour une situation : **brut cumulé**) ; `brutCalcul` = brut de CE paiement quand il diffère
(cumul − acomptes précédents) ; `partsForfaits` = `{ "<niveau>": montant }` part de la ligne des conditions
forfaitaires et des « paiements antérieurs » (telle que Deltaproject l'a stockée). `net` / `tva` = montants DE CE
document (TTC). Arrêtés : + `adjudicationBrut`, `adjudicationNet`.

**Condition** : `{ niveau (NIV), reference (REF), kind, genre, libelle, refCond, valeur (taux % ou montant),
montant (total stocké, informatif), appliquee (M) }`

**Paiement** : `{ id ("p<refNum>"), refNum, contratId (id du contrat OU de l'avenant) | null, genre (surContrat|
surContratFinal|horsContrat|horsContratFinal|rencherissement|…), genreCode (payCode), genreTexte ("Situation"…),
dernier (bool), numero, numeroFacture, dateFacture, datePaiement, statut (receptionne|libere|transmis|debite),
statutCode, commentaire, description, contactId, lot { numero, texte }, numeroOrdre, saisie, lignes, conditions,
banque { nom, rue, npa, lieu, compte, texteCompte, swift, clearing, iban, compteMO }, annexes, ordreId?,
totauxDelta { brut (cumulé pour une situation), net (montant payé TTC), tva } }`

**OrdrePaiement** : `{ id ("o<refId>"), refId, numero, date, dateValeur, maitreOuvrageContactId, statut (enTraitement|
controle|transmis|debite), statutCode, banque { nom, rue, npa, lieu, compte, texteCompte, swift, clearing, iban,
contact }, paiementIds [ids] }` — `refId` = nom du sous-dossier `paymentorder/<refId>/` des documents.

**Arrete** : `{ id ("d<refNum>"), refNum, contratId, contactId, numero, date, statut (etabli|pourSignature|definitif|
nonDefini), statutCode, saisie, commentaire, description, garantie { genre (banque|assurance|comptant|sansGarantie|
nonDefini), genreCode, montant, debut, fin }, lignes, conditions, annexes, totauxDelta { ht, tva, net } }`

### 22.2 `PlanificationCouts` (collection `costplanning`)

```
id, projetId, entete { version, numeroVersion, statutCode, note, utilisateur, dateModification, supprime }
source { fichier ("Costplanning/<P>/<ID>/costplanning") }
titre ("Estimation des coûts"), date, indice (100), arrondir, pourcentage (totalGeneral|groupePrincipal)
coutRealisation { de ("B"), a ("W") }, coutOuvrage { de ("C"), a ("G") }
precision, etatProjet, etatPlanification, textesLibres [5], ouvrages [codes]
unitesFonctionnelles [ { nom ("USA / FA"), equation ("USA/FA"), unite, genre, afficher } ]
elements [ { code ("F01.03"), libelle, niveau (1 groupe principal | 2 groupe | 3 élément), unite, grandeurRef ("BRA"),
             uniteUNECE ("MTK"), quantite, prix, cout, prixEnPourcent, genere, standard, eventuelle, remarque,
             noteInterne, description, energieGrise, coefficientU, effetSerre,
             parOuvrage [ { ouvrage, localisation, ouvrageId, grandeurRef, unite, quantite, prix, prixEnPourcent,
                            prixEnPourcentQuantite, cout, coutFixe, eventuelle, definitif, origineprix, remarque,
                            noteInterne, sousElements [ { numero, libelle, unite, grandeurRef, quantite, prix, cout, remarque } ] } ] } ]
quantitesReferentielles [ { code ("FA"), libelle, unite, uniteUNECE, quantite, standard,
                            parOuvrage [ { ouvrage, localisation, ouvrageId, quantite, definitif, noteInterne,
                                           calcul [ { formule, commentaire, quantite, sousTotal } ] } ] } ]
totaux { coutInvestissement (A…Z), coutRealisation (de…a), coutOuvrage (de…a) }
```
Seuls les éléments / ouvrages avec une valeur sont détaillés dans `parOuvrage` (le catalogue eCCC complet reste
dans `elements`, 413 lignes).

### 22.3 Formules à implémenter côté interface (moteur de référence : `calculer_controle` / `cout_probable` du convertisseur)

**A. Conditions** (contrats, avenants, paiements, arrêtés) — par ligne :
```
R[0] = ligne.brutCalcul ?? ligne.brut
pour chaque niveau n croissant (conditions « appliquee », refCond vide ou = ligne.refCond) :
    base = R[ plus grand niveau ≤ reference ]
    montant = base × valeur / 100                          (nature pct)
            = partsForfaits[n] si fournie, sinon valeur × base / Σ bases des lignes concernées   (forfait)
            = −(partsForfaits[n] ?? valeur × base / Σ bases)                                   (cumul = kind 20)
    plusieurs conditions au même niveau : calculées sur la même base, R[n] = base + Σ montants du niveau
    R[n] = base + montant
net ligne = R[dernier niveau] ; tva ligne = Σ montants kind 6 ; ht = net − tva ; document = Σ lignes
```
Saisie du net : inverser la chaîne (brut = (net − forfaits) / Π(1 + taux/100)). Documents importés : ne pas
recalculer, afficher `net`/`tva` stockés (le recalcul redonne ces valeurs, cf. § 22.5).

**B. « Paiements à ce jour »** (kind 20) d'une nouvelle situation = Σ (net − tva) des paiements antérieurs du même
contrat (+ avenants liés), dans l'ordre de saisie. Valeur **figée** à l'enregistrement (Deltaproject ne la met pas à
jour si un paiement antérieur est modifié — 56 cas observés).

**C. Rattachement des montants** à une structure (CFC × ouvrage × entreprise) :
- DG : `parOuvrage[].dgTTC` (sinon `dgTTC`) ; mutations : destination +ttc / origine −ttc ; écritures : `cfc`, `ouvrage`, `contactId` ;
- contrats / avenants : lignes → entreprise du contrat ; avenant **lié** : seules ses lignes dont (cfc, ouvrage) existent
  dans le contrat parent sont comptées (règle Deltaproject — une ligne hors structure est ignorée ; DeltaSub doit l'afficher
  en avertissement) ;
- paiements : lignes → entreprise du contrat (sur contrat) ou `contactId` du paiement (hors contrat) ;
- normalisation : un CFC « NNN.0 » absent du plan comptable est compté sur « NNN » ;
- un montant sur un ouvrage qui n'existe pas dans l'affaire (`ouvragesProjet`) est **ignoré** par Deltaproject (à signaler) ;
- titres implicites : tout CFC crée ses ancêtres (211.51 → 211.5 → 211 → 21 → 2 ; 000 → 00 → 0).

**D. Colonnes par structure puis par position** (TTC ; HT et TVA de la même façon) :
```
mutations        = transferts + variations + renchérissement
dgRevise         = dg + mutations                        (+ mutations 2 si centre dgRevise2)
contratsAvenants = contrats + avenants
paiements        = paiementsContrat + paiementsHorsContrat
coutProbable     = règle E
etatCout         = coutProbable − dgRevise
titre CFC        = valeurs propres + Σ enfants  (le parent = plus long préfixe existant)
total général    = Σ positions à 1 chiffre
```
**E. Coût probable d'une structure** (vérifié : 99,0 % des positions, 64/75 totaux exacts, écart max. 0,56 %) :
```
si écriture coutProbablePerso « coutProbableZero »       → 0
si écriture(s) coutProbablePerso                          → Σ de ces écritures
entreprises actives E = celles ayant contrat, avenant ou paiement sur la structure
provisions comptées seulement si ≤ 1 entreprise (hors « Aucune entreprise »)
SANS contrat :
    si toutes les entreprises payées hors contrat ont un paiement « dernier » non nul sur ce CFC → Σ paiements
    sinon (paiements ? max(dgRevise, Σ paiements) : dgRevise) + provisions        (dgRevise peut être négatif)
AVEC contrat(s) : CP = Σ_E
    E sans contrat                         → ses paiements hors contrat
    E soldée (paiement final hors contrat de E, ou TOUS ses contrats sur ce CFC ont un paiement « dernier »
      dont la ligne sur ce CFC est non nulle)  → Σ paiements de E (sur contrat + hors contrat)
    sinon → max(contrats+avenants de E, paiementsContrat de E + retenue) + paiementsHorsContrat de E
            retenue = Σ (net ligne × g / (100 − g)) des paiements avec retenue g % (kind 4),
                      0 si le dernier paiement de E sur ce CFC n'a plus de retenue
    si aucune E soldée, aucun contrat « prioritaireSurDevis » et CP < dgRevise → CP = dgRevise
    CP += provisions
```
**F. Équations** (`parametres.equations`) : variables `[aa]…[pf]` du § 12.2 évaluées ligne par ligne.

### 22.4 Exemple JSON (anonymisé, valeurs fictives)

```json
{
  "costcontrol": {
    "9001": {
      "id": 9001, "projetId": 901,
      "entete": {"version": "CC.V1", "numeroVersion": 1, "statut": "enCours", "statutCode": 2, "note": "",
                 "utilisateur": "Paulo", "dateModification": "2026-09-29", "supprime": false},
      "source": {"fichier": "Costcontrol/901/9001/coco/costcontrol", "formatDelta": 4, "sauvegardes": []},
      "parametres": {"centres": {"dgRevise2": false, "rencherissementIcc": false, "montantPlafonne": false, "metre": false,
                     "libre1": false, "libre2": false, "libre3": false}, "arrondir": false, "facteurDG": 1.0,
                     "equations": ["", "", "", "", "", ""], "joursPaiementApresFacture": 30,
                     "statutPaiementDefaut": "transmis", "saisieBrutDefaut": true, "contratPrioritaireDefaut": true},
      "entreprises": [{"contactId": 5001, "nomCourt": "Entreprise A, Lieu"}],
      "ouvragesProjet": [],
      "positions": [
        {"cfc": "2", "libelle": "Bâtiment", "genere": true, "dgHT": 0, "dgTVA": 0, "dgTTC": 0, "tauxTVA": null,
         "lignesCalcul": [], "parOuvrage": []},
        {"cfc": "211.5", "libelle": "Béton et béton armé", "genere": false, "dgHT": 92506.94, "dgTVA": 7493.06,
         "dgTTC": 100000.0, "tauxTVA": 8.1, "lignesCalcul": [{"prixHT": 92506.94, "tauxTVA": 8.1, "ttc": 100000.0}],
         "parOuvrage": []},
        {"cfc": "299", "libelle": "Réserve", "genere": false, "dgHT": 9250.69, "dgTVA": 749.31, "dgTTC": 10000.0,
         "tauxTVA": 8.1, "lignesCalcul": [], "parOuvrage": []}
      ],
      "mutations": [
        {"id": "m12", "centre": 1, "numero": 1, "code": "T1", "genre": "transfert", "date": "2026-05-04",
         "statut": "acceptee", "statutCode": 4, "remarque": "adjudication",
         "origine": {"cfc": "299", "contactId": null, "ouvrage": "", "localisation": ""},
         "destination": {"cfc": "211.5", "contactId": null, "ouvrage": "", "localisation": ""},
         "ht": 4625.35, "tauxTVA": 8.1, "tva": 374.65, "ttc": 5000.0}
      ],
      "ecritures": [
        {"id": "e20", "type": "provision", "cfc": "211.5", "contactId": 5001, "ouvrage": "", "date": "2026-06-01",
         "remarque": "Réserve", "ht": 1850.14, "tauxTVA": 8.1, "tva": 149.86, "ttc": 2000.0, "coutProbableZero": false}
      ],
      "contrats": [
        {"id": "c1", "refNum": 1, "type": "contrat", "contratParentId": null, "lieAuContrat": true, "numero": "1",
         "designation": "Contrat", "date": "2026-04-01", "statut": "definitif", "statutCode": 5, "contactId": 5001,
         "lot": {"numero": "211", "texte": "Maçonnerie"}, "prioritaireSurDevis": true, "saisie": "net",
         "niveauPrestations": 0, "lignes": [{"cfc": "211.5", "ouvrage": "", "localisation": "", "refCond": "",
         "brut": 100000.0, "net": 100641.1, "tva": 7541.1}],
         "conditions": [
           {"niveau": 1, "reference": 0, "kind": 1, "genre": "rabais", "libelle": "Rabais", "refCond": "", "valeur": -5.0, "appliquee": true},
           {"niveau": 2, "reference": 1, "kind": 3, "genre": "escompte", "libelle": "Escompte", "refCond": "", "valeur": -2.0, "appliquee": true},
           {"niveau": 3, "reference": 2, "kind": 6, "genre": "tva", "libelle": "TVA", "refCond": "", "valeur": 8.1, "appliquee": true}],
         "totauxDelta": {"brut": 100000.0, "net": 100641.1, "tva": 7541.1}}
      ],
      "paiements": [
        {"id": "p30", "refNum": 30, "contratId": "c1", "genre": "surContrat", "genreCode": 1, "genreTexte": "Situation",
         "dernier": false, "numero": "1", "dateFacture": "2026-06-10", "datePaiement": "2026-07-10",
         "statut": "transmis", "statutCode": 3, "contactId": 5001, "saisie": "net",
         "lignes": [{"cfc": "211.5", "ouvrage": "", "localisation": "", "refCond": "", "brut": 40000.0,
                     "net": 36230.8, "tva": 2714.8}],
         "conditions": [
           {"niveau": 1, "reference": 0, "kind": 1, "genre": "rabais", "valeur": -5.0, "appliquee": true},
           {"niveau": 2, "reference": 1, "kind": 3, "genre": "escompte", "valeur": -2.0, "appliquee": true},
           {"niveau": 3, "reference": 2, "kind": 4, "genre": "retenueGarantie", "valeur": -10.0, "appliquee": true},
           {"niveau": 4, "reference": 3, "kind": 20, "genre": "paiementsAnterieurs", "valeur": 0.0, "appliquee": true},
           {"niveau": 5, "reference": 4, "kind": 6, "genre": "tva", "valeur": 8.1, "appliquee": true}],
         "banque": {"nom": "", "iban": "", "texteCompte": "Voir bulletin de versement"}, "ordreId": "o7",
         "totauxDelta": {"brut": 40000.0, "net": 36230.8, "tva": 2714.8}}
      ],
      "ordresPaiement": [{"id": "o7", "refId": 7, "numero": "1", "date": "2026-07-01", "dateValeur": "2026-07-10",
                          "maitreOuvrageContactId": 5100, "statut": "transmis", "statutCode": 2, "paiementIds": ["p30"]}],
      "arretes": [],
      "presentations": {"controle": [{"nom": "Standard", "favori": true, "colonnes": [
          {"id": "kag", "idDelta": 0, "largeur": 60, "details": false},
          {"id": "kvTot", "idDelta": 13, "largeur": 100, "details": false},
          {"id": "contractAndAddendumTot", "idDelta": 90, "largeur": 100, "details": true},
          {"id": "payementTot", "idDelta": 122, "largeur": 100, "details": true},
          {"id": "forcastCalculatedTot", "idDelta": 172, "largeur": 100, "details": false}], "options": {}}]},
      "annexes": [{"chemin": "paymentorder/7/Ordre de paiement.dpdoc", "categorie": "paymentorder", "type": "dpdoc"}],
      "controle": {"dgTTC": 110000.0, "mutationsTTC": 0.0, "dgReviseTTC": 110000.0, "contratsAvenantsTTC": 100641.1,
                   "paiementsTTC": 36230.8, "provisionsTTC": 2000.0, "coutProbableTTC": 107641.1, "etatCoutTTC": -2358.9}
    }
  },
  "costplanning": {
    "9101": {"id": 9101, "projetId": 901, "titre": "Estimation des coûts", "indice": 100.0,
             "coutRealisation": {"de": "B", "a": "W"}, "coutOuvrage": {"de": "C", "a": "G"}, "ouvrages": ["AP1"],
             "elements": [{"code": "F", "libelle": "Toitures", "niveau": 1, "unite": "m2", "grandeurRef": "BRA", "cout": 5300.0, "parOuvrage": []},
                          {"code": "F01.03", "libelle": "Toitures inclinées", "niveau": 3, "unite": "m2", "grandeurRef": "PRNA",
                           "quantite": 53.0, "prix": 100.0, "cout": 5300.0,
                           "parOuvrage": [{"ouvrage": "AP1", "grandeurRef": "PRNA", "quantite": 53.0, "prix": 100.0, "cout": 5300.0, "sousElements": []}]}],
             "quantitesReferentielles": [{"code": "BRA", "libelle": "Surface de toiture du bâtiment", "unite": "m2", "quantite": 53.0,
                                          "parOuvrage": [{"ouvrage": "AP1", "quantite": 53.0, "calcul": []}]}],
             "totaux": {"coutInvestissement": 5300.0, "coutRealisation": 5300.0, "coutOuvrage": 5300.0}}
  }
}
```
(Dans l'exemple : 211.5 DG révisé 105'000 ; CP = contrat 100'641.10 (> paiements 36'230.80 + retenue
4'025.64 ; contrat prioritaire) + provision 2'000 = 102'641.10 ; réserve 299 : DG révisé 5'000 = CP ;
total CP 107'641.10 − DG révisé 110'000 = état du coût −2'358.90.)

### 22.5 Vérification sur les données réelles (29.09.2026)
Jeu : **84 contrôles des coûts** (tous les dossiers `coco/costcontrol`) + 13 planifications. Référence : pour chaque
CC, les colonnes calculées par **le moteur de Deltaproject lui-même** (`DeltaCalc.java` : `Booking.convert` →
`Booking.compact` → `CalcCost.calc`, séquence de l'écran « Contrôle du coût »).

| Contrôle | Résultat |
|---|---|
| Contrats, avenants, paiements, arrêtés : net et TVA recalculés par le moteur de conditions (§ 22.3 A) | **100 %** identiques aux totaux stockés (1 050 contrats/avenants, 2 970 paiements, 114 arrêtés) |
| « Paiements à ce jour » stocké vs Σ HT des paiements antérieurs | identique sauf 56 cas où un paiement antérieur a été modifié après coup (valeur figée → remarque) |
| 75 CC sans ouvrages — positions feuilles (2 268) : DG, DG révisé, contrats+avenants, paiements | **100 %** (1 écart isolé lié au moteur hors application) |
| idem — coût probable / état du coût par position | **99,0 %** (23 positions) |
| idem — totaux généraux DG / DG rév. / contrats / paiements | 75/75, 75/75, 74/75, 74/75 |
| idem — total général coût probable | **64/75 exacts** ; 11 écarts de −0,56 % à +0,53 % |
| 9 CC avec ouvrages (251, 3651, 3702, 3751, 4801, 4851, 4852, 4853, 4901) | non concluant : hors de l'application, le moteur Deltaproject ignore certains ouvrages (ex. CC 251 : DG 250'800 au lieu de 501'800 imprimé par Deltaproject) → à valider à l'écran |
| Planifications (13) | Σ enfants = groupes, quantité × prix = coût : OK |

Écarts résiduels de coût probable (positions, recalcul − Deltaproject) : CC 954 `411.4` −5'315.23 ; 1251 `231.5`
−758.00 (contrat < DG, prioritaire, sans paiement → Deltaproject garde le DG) ; 1401 `225.3` +1'066.23 (ligne sur
ouvrage inexistant) ; 2751 `112.1`, `114.1`, `211.0`, `211.4` (−25 à −36, formule de retenue) ; 3101–3601 (états
successifs de la même affaire) `222`, `224`, `232`, `242`, `254`, `281.6`, `290` (contrat prioritaire inférieur au DG
parfois ignoré, retenue libérée). Rapport complet : `scratchpad/dpx/work/rapport.txt` (données clients — ne pas diffuser).
**Avant la bascule** : comparer à l'écran de Deltaproject ces positions et 2 CC avec ouvrages.

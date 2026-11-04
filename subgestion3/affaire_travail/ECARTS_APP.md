# Écarts de l'app relevés avec l'affaire 99TST

Relevés le 04–05.11.2026 en remplissant une affaire complète. **Rien n'a été corrigé dans l'app** : l'affaire les laisse visibles, à Paulo de décider.
Les noms de fonctions servent de repères (`sg3_plus.js`, `sg3_offres.js`, `Facturation.html`) ; les numéros de ligne changent trop vite.
« Vu » = constaté à l'écran dans l'aperçu le 05.11 ; « relevé » = constaté par la génération ou dans le code.

## Montants faux ou trompeurs

| # | Écart | Où | Dans 99TST | État |
|---|---|---|---|---|
| 1 | Les notes de frais sont déduites des frais de la facture suivante : frais négatifs | `calcF` (`totalFacc`) | AC07 −3'188.10, AC12 −2'865.25, tuile « Factures ouvertes · Frais : −2'610 » | Vu |
| 2 | Un contrat non signé compte dans les honoraires | `sgRenta`, page Factures | Expertise envoyée (3'892 TTC) dans Honoraires 586'389, Contrat, Reste à facturer ; absente de Contrats honoraires | Vu |
| 3 | Facture hors contrat absente de la rentabilité | `sgRenta` (`fs` : seulement les `contrat_id` reliés) | 1'751 TTC : comptés dans la page Factures et le Cockpit, pas au tableau de bord, en Rentabilité ni aux Apports | Relevé |
| 4 | Ligne « Projet » de Phases contrat ≠ somme des phases | Phases contrat (`tot` compte aussi les contrats sans phases) | Faisabilité et expertise n'apparaissent que sur cette ligne | Relevé |
| 5 | Faisabilité : heures et coût sans honoraires en face | `sgSiaGroupe` | Marge négative sur la phase 2 | Relevé |
| 6 | Acomptes d'avant l'avenant calculés sur les honoraires finaux | `calcF` | AC01 et AC02 un peu plus élevés qu'à leur date | Relevé |
| 7 | Double rabais possible (question ouverte depuis le 01.11) | `calcF` : `f_rabais` appliqué à `c.hht`, qui le comprend déjà | Masqué ici : rabais 0 sur les contrats facturés | Code |
| 8 | Note de frais ouverte comptée comme facture ouverte à 0 | `sgFactKpis` | Masqué ici : les deux notes sont payées | Code |

## Affichage et libellés

| # | Écart | Où | Dans 99TST | État |
|---|---|---|---|---|
| 9 | Identifiant technique à la place du contrat | Onglet Factures, fiche d'affaire (`sgContratPhLib` vide : contrat sans phases SIA) | `mw2r2s8ryxt` sur FA23.91_99TST.FF | Vu |
| 10 | Date de l'avenant = date de l'offre initiale | Onglet Contrat | Avenant affiché au 15.01.2024, signé le 25.11.2024 | Vu |
| 11 | Tuile et page Permis ouvrent la dernière demande, pas le permis principal | `sgPermisCompte`, `sgPermisModule` | « 0 condition à régler » alors que le permis principal en a 3 | Vu |
| 12 | Le nom de l'affaire est le `projet` du premier contrat | `affairesAll` | Contournement : mandat placé en tête de `sa_contrats`, sinon les PV et leur PDF s'intitulent « Étude de faisabilité » ; la liste des contrats n'est donc pas chronologique | Relevé |
| 13 | Deux définitions de tâche ouverte | Tuile Tâches / page Tâches | Une tâche annulée compte comme ouverte dans la tuile (« 11 ouvertes sur 24 ») | Relevé |
| 14 | Liste des soumissions : offre, pas adjudication | Soumission | Net de la liste ≠ contrat après négociation | Relevé |
| 15 | « À valider » sans liste en local | `nx-valider` | Chiffre affiché, liste vide ; la validation se lit dans Cockpit ▸ À traiter ; aucun écran ne montre l'état « validé » ; décider exige le serveur (`/api/valider`) | Relevé |
| 16 | Pas d'écran de courriers | — | Destinataire et objet ne sont que dans le PDF et le nom de fichier | Relevé |

## Documents et PDF

| # | Écart | Où | Dans 99TST |
|---|---|---|---|
| 17 | PDF d'une note de frais à 0.00 | Facturation | NF01, NF02 |
| 18 | PDF d'une facture hors contrat : restes de cadre à gauche, pied « 1 \| 1 1 » | Facturation | Facture hors contrat |
| 19 | Planning graphique du contrat illisible au-delà de 9 mois | Facturation | Mandat imprimé en liste, Gantt gardé dans `detail` |
| 20 | « … », « ² », « ³ » absents de la police Light | Facturation | Remplacés dans les textes par « ... », m2, m3 |
| 21 | Courriels imprimés avec « (at) » dans les PDF de PV de chantier | PV de chantier | Tous les PV |

## Fonctionnement

| # | Écart | Où |
|---|---|---|
| 22 | Fermer une soumission ajoute le CFC au rôle 19 (« 226,226.2 ») | Soumission |
| 23 | Comparatif bref et détaillé diffèrent de 5 ct | Soumission |
| 24 | Reclasser un fichier remet sa date au jour même | `sgFichierPhase` |
| 25 | Management et Facturation sans lien : une modification ne suit pas de l'autre côté | Tout le domaine Finances |
| 26 | `sgFaisaOk` : son enveloppe s'écarte de la règle écrite (contrat de faisabilité seulement) | `sg3_plus.js` ; sans effet sur 99TST |
| 27 | « Pré-remplir » ajouterait 11 contraintes mal classées (mots-clés : « avant-toits » classé en toiture) | Parcelle & règlements |

## Limites propres à l'affaire (pas des défauts)

- Collaborateurs fictifs : heures sur cette seule affaire, donc tirets rouges au Contrôle des heures et bouclement très négatif (choix « option A »).
- Parcelle fictive sur le lac, pour ne désigner aucune parcelle réelle : cartes bleues, coupe plate.
- Ne pas cliquer sur 99TST : « Appliquer à la parcelle », « Tout rechercher », « geo.admin.ch », « Extrait RDPPF » : ils remplaceraient les données fictives.
- Polygone de la parcelle (`m90`) ≈ 40 m de profondeur, plans (`m97`) ≈ 31 m pour tenir les distances de la variante B : la vignette et les plans diffèrent.
- Restent vides, sur demande : Archives ▸ Offres d'honoraires (ancien), QR-facture (`projectfee`, `qrbill`) ; Cockpit « à envoyer » ; registres `fx-carnet`, `fx-collaborateurs`.
- Le compte courant (Paulo) est un vrai collaborateur de la base : il figure dans l'équipe, les séances et certains PV.

# Inventaire des modules : écarts entre Deltaproject 16.05 et DeltaSub

*Synthèse critique du 30.09.2026, faite en lecture seule. DeltaSub est analysé au commit `784d131` (`DeltaSub.html`, 9 874 lignes, copie de travail identique). Deltaproject est la version 16.05 (`/Applications/DELTAproject.app`, base 16.0 du bureau).*

*Le document ne contient aucune donnée personnelle : seulement des identifiants, des compteurs et des noms de classes. Il ne reproduit aucun texte CRB.*

> **Critique d'exhaustivité (30.09.2026)** : voir le **§ 16 « Corrections de la critique »**, qui prime sur les § 1 à 15. Elle ajoute 8 éléments, corrige 10 statuts, crée CH-17 (Configurer les frais, priorité 1, bloquant) et CH-18 (options avancées du contrôle des coûts, découpées de CH-07), et révise l'ordre de priorité.

---

## 0. Sources, méthode, légende

**Sources.** Cinq recensements, tous dans `research/inv/` :
- `inv_menus.md` : le bytecode des menus ;
- `inv_manuel.md` : les manuels FR v14 et DE v16 ;
- `inv_strings.md` : `Strings.db` et les 1 096 classes d'interface ;
- `inv_deltasub.md` : ce que contient `DeltaSub.html` ;
- `inv_usage.md` : l'usage réel, établi sur la base du bureau du 28.09.2026 et sur `DELTAprojectFiles`.

S'y ajoutent les cahiers `outils_deltaproject/specs/spec_1` à `spec_12`.

**Vérifications propres à cette synthèse.** J'ai tranché les statuts douteux ou contradictoires en contrôlant moi-même :
- `DeltaSub.html`, par recherche de libellés et lecture de `NAV`, `DOMAINS`, `domainView`, `VIEWS.config`, `CC_SECS` et des moteurs d'impression `tplPrint`, `mgPrint`, `svDpPrint`, `dpPrint`, `ccPrint*` et `dvPrint` ;
- le bytecode : `AdminDialog$Menu`, `ProjectFrame.setMenuTable`, `ProjectMemberRoleFrame`, `app.doc.Templates$DocumentType` (103 types), `costplanning.MenuTree$Menu/$SubMenu` et `costcontrol.MenuTree$Menu` ;
- les données : la table `FORMTEMPLATE`, qui donne les types d'anciens modèles présents au bureau.

Le détail des arbitrages est au § 1.

**Statuts DeltaSub**

| Statut | Sens |
|---|---|
| **Présent** | Reproduit et utilisable ; les écarts sont mineurs ou volontaires. |
| **Partiel** | L'écran existe, mais des fonctions ou le document au nouveau format manquent. « Partiel (ancien) » : le document s'imprime seulement par l'ancien modèle DESIGN ou en HTML simple. |
| **Placeholder** | L'entrée est visible, mais n'affiche qu'un texte de repli ou un lien. |
| **En cours** | Code écrit ou en cours d'écriture dans le scratchpad, **non intégré**. |
| **Absent** | Rien dans DeltaSub. |
| **Sans objet** | Ne concerne pas DeltaSub : licences, base Derby, outils de développeur. |

**Usage au bureau.** Les catégories viennent de `inv_usage.md` :
- **Intensif** : données courantes jusqu'en 2026 ;
- **Occasionnel** : essais ou usage ponctuel ;
- **Jamais** : droit disponible, aucune donnée ;
- **Sans licence** : le module est invisible au bureau ;
- **n/m** : non mesurable (rapports calculés).

**Licences du bureau.** Présentes (✔) : DELTAproject ×7, DELTAcontrol ×1, DELTAcostControl ×1, DELTAcostEstimate ×1, DELTAeBKP ×1, plus la licence de données CRB « CAN et CFC » (produits GL, BKP, eBKP-H, eBKP-T, eBKP gate, **sans catalogue CAN**). Absentes (✘) : DELTAfaktura, DELTAreport, DELTAhonorar, DELTAplanning, DELTAdevis, DELTAlimited et les 17 catalogues CRB.

**Taille de l'écart**
- **S** : moins d'un lot ;
- **M** : 2 ou 3 lots ;
- **L** : 4 à 6 lots ;
- **XL** : 7 ou 8 lots.

La colonne « Chantier » renvoie aux chantiers du § 12 (`CH-nn`) ou aux chantiers en cours du § 13 (`EC-n`).

---

## 1. Arbitrages entre recensements (contradictions tranchées)

| # | Point contesté | Recensements en désaccord | Vérification | Statut retenu |
|---|---|---|---|---|
| 1 | Import de vCards | manuel B17 : « Oui » ; menus et strings : absent | `vCard` n'apparaît que dans `ivCard` (fiche débiteur) ; aucun `.vcf` | **Absent** |
| 2 | Impression d'étiquettes d'adresses | strings G03 : « présent » ; deltasub : manque | Aucune impression d'étiquettes, seulement l'édition des modèles `tpl-labelTemplates` | **Absent** |
| 3 | « Gestion des utilisateurs » | strings : « partiel (sans mot de passe ni droits) » ; menus : absent | Le dialogue l. 5254 est `ctPickUser`, un simple sélecteur d'utilisateur (`AppUserBrowserDialog`) ; `chooseUser` sert à « Qui utilise ce poste ? » | **Absent** (gestion) ; le choix de l'utilisateur est **partiel** |
| 4 | Afficher, masquer, ouvrir ou fermer la barre des modules | strings : « présent (NAV) » ; menus : absent | Les sections se replient une à une ; il n'existe ni masquage global ni commande « tout ouvrir / tout fermer » | **Partiel** |
| 5 | SIA 451 de l'eCCC | strings G19 : « présent » ; deltasub : grisé lot 4 | L. 4167 `ext('ec4ExportSia451', …)` : point d'extension absent, entrée grisée | **Absent** (EC-2, lot 4) |
| 6 | Administrateur : catégories « Général », « Adresses », « Affaires » | deltasub : 13 catégories manquantes | `AdminDialog$Menu` a 21 valeurs et aucune de ces trois. Ce sont des droits (`adminGeneral`, `adminAddresses`, `adminProjects`) et des sections des **Paramètres système** | 10 catégories manquantes (dont 3 masquées au bureau et 1 en cours) ; Général et Adresses relèvent des Paramètres système (CH-08) |
| 7 | Management ▸ Contrats honoraires et Factures | strings : « écartés volontairement (spec 8) » ; deltasub : « lot 7 » | spec_8 § P3 : « hors périmètre (Facturation.html) » ; puis spec_9 l. 1416, lot 7 : « vues Management Contrats et Factures » à faire | **Absent**, prévu au lot 7 et non livré : **décision de Paulo** (D2) |
| 8 | « Les 50 modules sont tous présents » | usage § 6 ; menus : 8 manquent | `NAV` : 44 entrées. MANAGEMENT 7/9 ; MODELES DOCUMENTS : 1 sur 6, et en consultation seulement | 7 absents, 6 partiels (§ 2) |
| 9 | Domaine « Liste d'adresses » ou « Entrepreneurs » | deltasub : correspondance à confirmer | `ProjectFrame.setMenuTable` ajoute `contractors` (Entrepreneurs), jamais `contacts` (Liste d'adresses). `ProjectMemberRoleFrame` = intervenants du rôle d'équipe `contractors` (« Entreprises »), avec nouveau, copier, importer d'une autre affaire, courriel, étiquettes et liste d'adresses | DeltaSub a un domaine **en trop** (Liste d'adresses) et un **absent** (Entrepreneurs) |
| 10 | Nœuds eCCC IFC, DONNEES DE L'AFFAIRE, CALCULS | strings § 1.5 : nœuds de l'arbre | `costplanning.MenuTree$Menu` n'a que 5 nœuds (refCodes, elements, overView, keyFigures, afterCalculation). Les autres libellés sont des menus ou des vestiges | Arbre eCCC = 5 nœuds ; DeltaSub l'a à l'identique |
| 11 | Contrôle des coûts : GARANTIE, RENCHERISSEMENT, CALCUL DES RESULTATS | strings : nœuds | `costcontrol.MenuTree$Menu` : 11 nœuds sans ceux-ci | 11 nœuds ; DeltaSub en a 8 (`CC_SECS`) |
| 12 | Planification RH G08, G10, G12 | manuel : « ? » | « Planification des ressources » (9 occurrences), « Répartir le montant par mois » (2), « Rapport mensuel collaborateur » (2) | **Présent** |
| 13 | Réglages personnels de la saisie des heures (E03) | manuel : « ? » | Présents dans `h-saisie` (deltasub § 2.5) | **Présent** |
| 14 | Comptes de frais de l'affaire (D11) | manuel : « ? » | « Configurer les frais » : 0 occurrence ; les frais d'affaire sont lus mais ne s'éditent pas | **Absent** (CH-05) |
| 15 | Comparaison des offres (A14) | manuel : « ? » ; strings : absent | Écrit dans le lot 2 de la Soumission (`svbAdmPane`), non intégré | **En cours** (EC-1) |
| 16 | Impression des documents du contrôle des coûts | deltasub : « ordres et bons » ; manuel : « ? » | Le menu Documents (l. 3192) n'imprime que l'Ordre de paiement, le Bon de paiement et le tableau A4 (ancien modèle ou HTML). Aucun Contrat, Avenant, Arrêté, Mutation ni Rapport de paiement | Partiel : 4 types sur 16 (§ 10) |
| 17 | Impression de la Disponibilité | deltasub : présent | `dpPrint` imprime en HTML simple (`open('','_blank')`), sans `.dpdoc` | Écran **présent** ; documents **partiels (HTML)** |
| 18 | « Séances » : renvoi au « module PV existant » | — | `Facturation.html` contient bien un module PV (`sa_pv_data`, `pvPersist`) | Placeholder volontaire : **décision de Paulo** (D1) |

---

## 2. Matrice A : barre des modules (11 groupes, 50 modules)

| # | Groupe ▸ module (FR) | Classe DP | Licence | Usage au bureau | DeltaSub | Écart restant | Chantier | Taille |
|---|---|---|---|---|---|---|---|---|
| 0 | ADRESSES ▸ Entités | `addresses.ContactListFrame` | base | Intensif (727 entités, 125 comptes) | Présent (`adr-entites`) | vCard, CSV, étiquettes, modification groupée, bloc-notes, annuaire, fiche d'adresse | CH-04 | L |
| 1 | ADRESSES ▸ Liste des adresses | `AddressListFrame` | base | Intensif (755 adresses) | Présent (`adr-liste`) | étiquettes ; assistant de listes avec favoris ; nouveau document `contactList` | CH-04, CH-09 | — |
| 2 | ADRESSES ▸ Mes favoris | `AddressListFrame` | base | n/m | Présent | — | — | — |
| 3 | ADRESSES ▸ Groupes d'adresses | `GroupFrame` | base | Occasionnel (8 intelligents ; groupes fixes vides) | Présent | sorties des groupes (étiquettes, lettres en série) | CH-04 | — |
| 4 | ADRESSES ▸ Propriétés | `PropertiesFrame` | base | Intensif (608) | Présent | — | — | — |
| 5 | ADRESSES ▸ Chercher | `SearchFrame` | base | n/m | Présent | — | — | — |
| 6 | AFFAIRES ▸ Gestion | `ProjectDefinitionFrame` | base | Intensif (111 affaires) | **Partiel** | configuration des frais, groupes de rôles, plans comptables de l'affaire, affectations, import d'heures, import d'activités et de tarifs, Editer le filtre, dossiers | CH-05 | L |
| 7 | AFFAIRES ▸ Controlling | `ProjectControllingFrame` | DELTAcontrol ✔ (1 poste) | n/m | Présent | nouveaux documents (Journal des heures, etc.), « Composer le rapport » | CH-09 | — |
| 8 | AFFAIRES ▸ Mes affaires | `ProjectFrame` | base | Intensif | Présent | domaines : § 3 | — | — |
| 9 | AFFAIRES ▸ Toutes les affaires | `ProjectFrame` | base + `projectEditAll` | Intensif | Présent | — | — | — |
| 10 | COLLABORATEURS ▸ Collaborateurs actuels | `EmployeeFrame` | base | Intensif (13, dont 5 actifs) | Présent | Participation aux affaires, fiche du collaborateur, étiquettes | CH-04 | — |
| 11 | COLLABORATEURS ▸ Tous les collaborateurs | idem | base | Intensif | Présent (placé en 3e au lieu du 2e rang) | ordre | CH-10 | S |
| 12 | COLLABORATEURS ▸ Anciens collaborateurs | idem | base | Intensif | Présent | — | — | — |
| 13 | NOTES DE FRAIS ▸ Saisie | `expenses.RecordFrame` | base | Intensif (635 frais, 2019-2026) | Présent | — | — | — |
| 14 | NOTES DE FRAIS ▸ Rapport | `expenses.AnalyzeFrame` | base | Intensif (modèle personnalisé 2023) | Présent | document `.dpdoc` `expensesReport` (seul l'ancien s'imprime) | CH-09 | — |
| 15 | HEURES ▸ Saisie | `time.RecordFrame` | base | Intensif (37 622 lignes) | Présent | import d'heures (relève de Gestion) | CH-05 | — |
| 16 | HEURES ▸ Rapport | `time.AnalyzeFrame` | base | Intensif (timeJournal et timeMonthlyReport personnalisés en 2024) | Présent | documents `.dpdoc` time* (seul l'ancien s'imprime) | CH-09 | — |
| 17 | HEURES ▸ Disponibilité | `time.PlanningFrame` | base | Abandonné (2022-2023) | Présent | documents `.dpdoc` (HTML simple aujourd'hui) | CH-09 | — |
| 18 | TÂCHES ▸ Urgent | `task.TaskFrame` | base | Jamais (0 tâche) | Présent | `.dpdoc` projectTask et projectTaskList (écart assumé par spec_7) | CH-09 | — |
| 19 | TÂCHES ▸ En traitement | idem | base | Jamais | Présent | — | — | — |
| 20 | TÂCHES ▸ Réglé | idem | base | Jamais | Présent | — | — | — |
| 21 | FACTURES ▸ Contrôle de factures | `invoice.ProjectInvoiceFrame` | DELTAfaktura ✘ | Sans licence | Présent | `.dpdoc` et PDF stockés | CH-11 | — |
| 22 | BÂTIMENT ▸ Mes estimations eCCC | `CostPlanningFrame` | DELTAeBKP ✔ + CRB | Occasionnel, en croissance (13 documents depuis 11.2025) | **Partiel / En cours** (lots 0-1) | lots 2 à 4 | EC-2 | XL |
| 23 | BÂTIMENT ▸ Mes devis | `CostEstimateFrame` | DELTAcostEstimate ✔ | **Intensif** (221 documents, 45 affaires, 1,36 Go) | **Partiel** (libellé « Devis ») | compléments spec_4 P2 | CH-02 | L |
| 24 | BÂTIMENT ▸ Mes soumissions | `devis.DevisFrame` | DELTAdevis ✘ | Sans licence (0 document) | **Partiel / En cours** (lot 1) | lots 2 à 4 | EC-1 | XL |
| 25 | BÂTIMENT ▸ Contrôle des coûts | `CostControlFrame` | DELTAcostControl ✔ | **Intensif** (115 documents, 719 `.dpdoc`, 380 PDF) | **Partiel** | documents, arrêtés, paramètres, options | CH-01, CH-07 | L + L |
| 26 | MANAGEMENT ▸ Affaires - Genres d'affaires | `ProjectKindsFrame` | base | n/m | Présent | — | — | — |
| 27 | MANAGEMENT ▸ Heures | `ProjectTimeFrame` | base | n/m | Présent | — | — | — |
| 28 | MANAGEMENT ▸ Controlling | `management.ProjectFrame` | DELTAcontrol ✔ | n/m | Présent (6 catégories) | « [Ancien document] » | CH-09 | — |
| 29 | MANAGEMENT ▸ Contrats honoraires | `management.ProjectContractFrame` | DELTAhonorar ✘ | Sans licence | **Absent** | 7 catégories et 6 documents | CH-11 | L |
| 30 | MANAGEMENT ▸ Planification RH | `management.PlanningFrame` | DELTAplanning ✘ | Sans licence | Présent | — | — | — |
| 31 | MANAGEMENT ▸ Factures | `management.ProjectInvoiceFrame` | DELTAfaktura ✘ | Sans licence | **Absent** | 6 catégories et 3 documents | CH-11 | (dans L) |
| 32 | MANAGEMENT ▸ Collaborateurs | `management.EmployeeFrame` | base + `staff` | n/m | Présent (10 catégories) | « [Ancien document] » | CH-09 | — |
| 33 | MANAGEMENT ▸ Maître d'ouvrage | `BuilderFrame` | DELTAcontrol ✔ | n/m | Présent | — | — | — |
| 34 | MANAGEMENT ▸ Reporting | `TimeReportFrame` | DELTAreport ✘ | Sans licence | Présent (5 catégories) | « Ancien document » | CH-09 | — |
| 35 | MODELES DOCUMENTS ▸ Modèles de pages | `doc.app.PageTemplatesFrame` | base | Occasionnel (8 modèles de pages, retouchés jusqu'en 12.2025) | **Absent** | module entier | CH-12 | (L) |
| 36 | MODELES DOCUMENTS ▸ Modèles | `doc.app.TemplatesFrame` | base | Occasionnel (625 modèles, retouches CoCo 2024-2026) | **Partiel** (`tpl-documents`, consultation seule) | éditeur complet | CH-14 | XL |
| 37 | MODELES DOCUMENTS ▸ Modèles d'étiquettes | `LabelTemplatesFrame` | base | Jamais (dossier vide) | **Absent** | module entier | CH-12 | — |
| 38 | MODELES DOCUMENTS ▸ Styles de textes | `TextStyleSetFrame` | base | Essai (1 jeu) | **Absent** | module entier | CH-12 | — |
| 39 | MODELES DOCUMENTS ▸ Styles de tableaux | `RowStyleSetFrame` | base | Occasionnel (4 jeux, dont « Substances ») | **Absent** | module entier | CH-12 | — |
| 40 | MODELES DOCUMENTS ▸ Polices | `FontFrame` | base | Occasionnel (14 polices, dont Akkurat) | **Absent** | module entier | CH-12 | — |
| 41 | ANCIENS MODELES ▸ Images | `form.GraphicsFrame` | base | Occasionnel | Présent | — | — | — |
| 42 | ANCIENS MODELES ▸ Arrière-plans | `form.BackgroundsFrame` | base | Occasionnel (42, retouchés jusqu'en 04.2026) | Présent | — | — | — |
| 43-49 | ANCIENS MODELES ▸ 7 familles (adresses, étiquettes, affaires, collaborateurs, frais, temps, management) | `form.TemplatesFrame` | base | Intensif pour le CoCo (XML modifiés le 16.09.2026) | Présent (7 entrées, éditeur de page) | « Modifier la police dans tous les modèles du groupe » à vérifier | — | — |

**Bilan (50 modules)** : 37 présents, 6 partiels (dont 2 avec un chantier en cours), 7 absents.

---

## 3. Matrice B : domaines d'affaire (`project.MenuTableModel`, 22 domaines actifs et 1 domaine mort)

| Ordre DP | Domaine | Classe DP | Condition / licence | Usage au bureau | DeltaSub | Écart | Chantier | Taille |
|---|---|---|---|---|---|---|---|---|
| 1 | Intervenants | `ProjectMemberFrame` | toujours | **Intensif** (1 324, dans les 111 affaires) | Présent | étiquettes ; édition des groupes de rôles | CH-04, CH-05 | — |
| 2 | Soumissionnaires | `TendererFrame` | `projectTenderers` | Essai (1) | Partiel (Soumission lot 1) | menus du lot 4, `projectTendererList`, « Importer la liste d'une autre affaire » | EC-1 | — |
| 3 | **Entrepreneurs** | `ProjectMemberRoleFrame` (rôle d'équipe `contractors`) | `projectContacts` | n/m (liste dérivée des intervenants) | **Absent** | domaine entier (nouveau, copier, importer d'une autre affaire, courriel, étiquettes, liste d'adresses) | CH-05 | S |
| 4 | Documents | `ProjectDocumentFrame` | `projectMemoranda` | Essai (1 document, 2023) | **Placeholder** | domaine entier | CH-13 | L |
| 5 | Fichiers | `ProjectFileFrame` | `projectFiles` + `isProjectMenuFilesVisible` (bureau : NON) | Jamais (masqué) | **Absent** | domaine entier | CH-13 | — |
| 6 | Messages brefs | `MemorandaFrame` | `projectMemoranda` + `isModuleFormVisible` (bureau : OUI) | Essai (3 lettres, 2023) | **Placeholder** | domaine entier | CH-13 | — |
| 7 | Séances | `MeetingSequenceFrame` | `projectMeetings` | Jamais (0 séance ; 106 genres copiés automatiquement) | **Placeholder** (renvoi au PV de Facturation.html) | domaine entier | CH-15 | L |
| 8 | Notes | `ProjectNoteFrame` | toujours | Jamais (0) | Présent | document `projectNote` | CH-13 | — |
| 9 | Tâches | `ProjectTaskFrame` | `projectTasks` | Jamais (0) | Présent | `.dpdoc` | CH-09 | — |
| 10 | Frais | `ProjectCostFrame` | `projectCosts` | Intensif (avec les notes de frais) | Présent | — | — | — |
| 11 | Offres d'honoraires | `ProjectFeeFrame` | DELTAhonorar ✘ + `honorarFeeCalculation` | Sans licence (1 calcul en 2025) | Présent (libellé « Calcul des honoraires ») | document `.dpdoc` « Offre d'honoraires » ; libellé | CH-11 | — |
| 12 | Contrats honoraires | `ProjectContractFrame` | `projectContracts` (sans licence) | Essai (1 contrat, 2025) | Présent | `.dpdoc` ; « Importer des fichiers PDF du calcul » | CH-11 | — |
| 13 | Planification RH | `ProjectPlanningFrame` | DELTAplanning ✘ | Sans licence | Présent | — | — | — |
| 14 | Analyse de planification RH | `ProjectPlanningAnalyzeFrame` | DELTAplanning ✘ | Sans licence | Présent | — | — | — |
| 15 | Avancement des prestations | `ProjectImplementationFrame` | DELTAhonorar ✘ | Sans licence | Présent | — | — | — |
| 16 | Factures | `ProjectInvoiceFrame` | DELTAfaktura ✘ | Sans licence (1 essai supprimé) | Présent | QR : 3 options grisées ; `.dpdoc` ; fusion | CH-11 | — |
| 17 | Liste des plans | `ProjectPlanFrame` | `projectPlans` | Jamais (0 plan ; référentiels copiés automatiquement) | **Placeholder** | domaine entier | CH-16 | L |
| 18 | Liste de distribution | `ProjectPlanRecipientFrame` | `projectPlans` | Jamais | **Placeholder** | domaine entier | CH-16 | — |
| 19 | Calcul des coûts | `project.CostPlanningFrame` + greffon | DELTAeBKP ✔ | Occasionnel | Partiel / En cours | import d'une affaire (lot 2), valeurs référentielles (lot 3) | EC-2 | — |
| 20 | Devis général | `project.CostEstimateFrame` + greffon | DELTAcostEstimate ✔ | Intensif | **Placeholder** (lien vers Bâtiment ▸ Devis) | liste et commandes du greffon dans l'affaire | CH-02 | S |
| 21 | Soumission | `project.DevisFrame` + greffon | DELTAdevis ✘ | Sans licence | Partiel / En cours | lots 2 à 4 | EC-1 | — |
| 22 | Contrôle des coûts | `project.CostControlFrame` + greffon | DELTAcostControl ✔ | Intensif | **Placeholder** (lien vers Bâtiment ▸ Contrôle des coûts) | liste et commandes du greffon dans l'affaire | CH-07 | S |
| (mort) | Liste d'adresses (`contacts`) | `project.AddressListFrame` | jamais ajouté en 16.05 | — | **Présent dans DeltaSub (en trop)** | à garder ou à remplacer par Entrepreneurs | D5 | — |

**Bilan (22 domaines actifs)** :
- 10 présents ;
- 3 partiels, tous rattachés à un chantier en cours ;
- 7 placeholders ;
- 2 absents ;
- en plus, un domaine en trop (Liste d'adresses).

---

## 4. Matrice C : catégories de niveau 3 et arbres des documents Bâtiment

### 4.1 Catégories des modules

| Module | Catégories Deltaproject | DeltaSub | Chantier |
|---|---|---|---|
| Factures ▸ Contrôle de factures | Planifiée, Envoyée, Rappel envoyé, Payée, Toutes | Présent (5/5) | — |
| Management ▸ Controlling | Collaborateurs - Affaires, Affaires - Collaborateurs, Affaires - Phases, Affaires - Activités, Rapport des heures - Phases, Rapport des heures - Activités | Présent (6/6) | — |
| Management ▸ Contrats honoraires | Contrats, Contrats et sous-traitants, Echéancier d'encaissements, Encaissements planifiés, Encaissements reçus, Situation des encaissements, Avancement des prestations | **Absent (0/7)** | CH-11 |
| Management ▸ Planification RH | Marge bénéficiaire, Encaissements, Disponibilité, Occupation, Rapport mensuel collaborateur, Attribution de l'affaire, Attribution des collaborateurs | Présent (7/7) | — |
| Management ▸ Factures | Vue d'ensemble de l'année, Selon statut, Date de la facture, Date d'échéance, Date d'encaissement, Honoraires et frais | **Absent (0/6)** | CH-11 |
| Management ▸ Collaborateurs | Liste, Durée prévue, Heures à effectuer (+) heures d'appoint, Heures saisies, Solde des heures, Solde avec heures d'appoint, Heures supplémentaires, Notes de frais, Vacances saisies, Situation des vacances | Présent (10/10) | — |
| Management ▸ Reporting | Chiffres-clés, Collaborateurs, Heures supplémentaires, Collaborateurs-affaires, Comparaison années | Présent (5/5) | — |
| Affaires ▸ Controlling (tuiles) | Contrôle des heures, Critères d'analyse des heures, Contrôle des frais, Critères d'analyse des frais | Présent (4/4) | — |
| Analyse de planification RH (tuiles) | 6 analyses | Présent (6/6) | — |
| Planification RH (réglages) | Facteur des frais internes, Catégories d'honoraires et coût de revient, Cahier des charges, Indicateur de la marge bénéficiaire | Présent | — |

### 4.2 Arbres des fenêtres de documents Bâtiment

| Fenêtre | Nœuds Deltaproject (enum) | DeltaSub | Chantier |
|---|---|---|---|
| Contrôle des coûts (`costcontrol.MenuTree`) | DEVIS GENERAL, CONTRÔLE DU COÛT, MUTATIONS, **MUTATIONS 2** (si `useKv2CostAccount`), ADJUDICATIONS, PAIEMENTS, COMPTES D'ENTREPRISE, ORDRES DE PAIEMENT, ARRÊTÉS DE COMPTE, **DESCRIPTIF**, **HONORAIRES** ; chaque nœud a « Edition » et « Documents » | 8/11 (`CC_SECS`). Absents : MUTATIONS 2, DESCRIPTIF, HONORAIRES. Les nœuds « Documents » n'impriment que 4 types | CH-01, CH-07 |
| Contrôle des coûts : menus Fichier et Paramètres | Fermer, Enregistrer, **À la dernière version** ; Configurer le plan comptable, **Configuration** (complète), **Titres de colonnes**, **Comptes du maître d'ouvrage**, **Définir facteur d'index du DG**, Importer les présentations, **Calculer prorata** | Configuration réduite à 3 champs ; titres de colonnes et comptes MO non éditables ; facteur DG et prorata absents | CH-07 |
| eCCC (`costplanning.MenuTree`) | QUANTITES REFERENTIELLES (Editer), ELEMENTS (Editer, Documents), APERCU, CHIFFRES CLEFS, CALCUL DES RESULTATS | 1 sous-nœud actif sur 6 (ELEMENTS ▸ Editer) ; le reste est grisé (lots 2 à 4) | EC-2 |
| eCCC : menus | Système référentiel, Configuration, Données de l'affaire, Importer les présentations | Configuration présente ; Données de l'affaire (lot 4) et Importer les présentations (lot 2) grisés | EC-2 |
| Soumission IfA 18 (`devis18.MenuTree`) | 9 nœuds, 24 sous-nœuds (APPEL D'OFFRES à ESTIMATIF) ; menus Fichier (Fermer, Enregistrer, À la dernière version), Paramètres (Paramètres, Présentation) | 4/24 actifs ; 20 grisés (lots 2 et 3) ; Présentation et À la dernière version grisés (lot 4) | EC-1 |
| Soumission ancien format (`devis.MenuTree`) | ESTIMATIF … DOCUMENT TYPE ; mode genre d'élément | Absent (0 document au bureau) | D6 (non prévu) |
| Devis général (`KvDialog`, sans arbre) | Fichier (**À la dernière version**) ; Edition (**Indexer la position**, **Modifier la TVA**, **Supprimer la position**, **Supprimer les ouvrages à 0**, Mettre tous les montants à zéro, **Attribuer le statut « non définitif »**, **Modifier le montant soumis**) ; Paramètres ; **filtre** | Mettre à zéro, paramètres et montant soumis présents ; les autres entrées en gras manquent | CH-02 |
| Commandes des greffons (listes Bâtiment) | Nouveau, Dupliquer, Editer, Effacer, Ouvrir (verrou) ; eCCC : **Importer un calcul d'une affaire** ; Devis : **Importer un devis CFC d'une affaire**, **Importer / Exporter un `.deltakv`**, **Dupliquer et modifier la subdivision** ; Soumission : **Traduire**, **Convertir IfA 18** | CRUD présent partout ; entrées en gras absentes (eCCC : grisée, lot 2) | CH-02, EC-2, EC-1 |

---

## 5. Matrice D : Administrateur (`AdminDialog$Menu`, 21 catégories)

| # | Catégorie | Classe | Données au bureau | DeltaSub | Écart | Chantier |
|---|---|---|---|---|---|---|
| 0 | Adresses - Propriétés | `AddressPropertiesFrame` | 25 propriétés / 4 groupes | **Partiel** | édition en français seulement ; groupes de propriétés non éditables | CH-06 |
| 1 | Adresses - Statuts | `AddressStatesFrame` | 6 | **Partiel** | français seulement | CH-06 |
| 2 | Plans comptables | `CatalogsFrame` | 8 catalogues, 3 599 positions (**contenu CRB**) | **Absent** | catégorie entière | CH-06 |
| 3 | Genres d'affaires | `ProjectGroupsFrame` | 12 groupes / 69 genres | **Absent** (consultation dans Management) | catégorie entière | CH-06 |
| 4 | Phases | `PhasesFrame` | 9 / 12 partielles | **Partiel** (« Phases standard ») | phases partielles et numéro non éditables ; français seulement | CH-06 |
| 5 | Activités | `ActivitiesFrame` | 32 / 7 groupes | **Partiel** | groupe et type non éditables ; français seulement | CH-06 |
| 6 | Frais | `CostCategoriesFrame` | 25 / 4 groupes | **Partiel** | unité, prix et groupe non éditables | CH-06 |
| 7 | Séances (genres de discussion) | `MeetingTypesFrame` | 8 | **Absent** | catégorie entière | CH-06 |
| 8 | Types de plans | `PlanTypesFrame` | 15 / 3 groupes | **Absent** | catégorie entière | CH-06 |
| 9 | Blocs de texte | `BoilerplateFrame` | 1 / 1 (essai) | **Partiel** (seul le groupe `planningText` s'édite, dans la Planification RH) | catégorie entière dans l'Administrateur | CH-06 |
| 10 | Modèles externes* | `admin.TemplatesFrame` | 2 modèles `.docx` | **Absent** (masqué au bureau) | — | CH-13 |
| 11 | Rubriques modèles externes* | `TemplateFieldsFrame` | 8 | **Absent** (masqué) | — | CH-13 |
| 12 | Nomenclature des doc. ext.* | `FilenameRulesFrame` | 3 | **Absent** (masqué) | — | CH-13 |
| 13 | Gabarits de facturation | `InvoicePositionsFrame` | 27 / 5 | Présent | — | — |
| 14 | Comptes pour QR-facture | `QRBillAccountFrame` | 0 | Présent | — | — |
| 15 | Groupes de conditions | `InvoiceConditionsFrame` | 10 / 2 (servent au CC et à la soumission) | **Absent** | catégorie et navigateur de conditions | CH-06 |
| 16 | Comparaison des offres | `BidCriteriaFrame` | 4 / 2 | **En cours** (Soumission lot 2) | intégration | EC-1 |
| 17 | Tâches | `TasksFrame` | 7 / 4 | Présent | — | — |
| 18 | Tarifs de facturation | `RateFrame` | 11 | Présent | — | — |
| 19 | Heures prévues | `TargetTimeFrame` | 17 | Présent | — | — |
| 20 | Jours fériés | `PublicHolidaysFrame` | 19 | Présent | — | — |
| + | (DeltaSub) Taux de TVA | Paramètres système dans DP | `genVatRatePos` 8.1 | Présent, mais mal placé | déplacer dans les Paramètres système | CH-08 |
| + | (placement) | Réglages ▸ Administrateur dans DP | — | DeltaSub le range sous « Modèles » | placer sous Réglages | CH-10 |

\* Catégories masquées au bureau (`isProjectMenuFilesVisible = NON`).

**Bilan (21 catégories)** : 6 présentes, 6 partielles, 1 en cours, 8 absentes, dont 3 masquées au bureau.

---

## 6. Matrice E : modèles

### 6.1 MODELES DOCUMENTS (`doc.app`)

| Module / commande | DeltaSub | Chantier |
|---|---|---|
| Modèles : navigation groupe (général / affaire) ▸ 25 catégories ▸ 103 types ▸ modèles | Partiel : liste plate en consultation, aperçu d'en-tête et de pied, français seulement | CH-14 |
| Modèles : Nouveau groupe, Copier le groupe, Copier le modèle, Nouveau modèle, Restaurer à partir de l'original, Importer de nouveaux modèles, Modifier, Ouvrir, Afficher le dossier des originaux, Remplacer l'original, filtre, « Toutes les langues » | Absent | CH-14 |
| Éditeur d'états (`doc.reports*`) : sections, modèles de page, éléments de contenu, champs, signature, éléments de bord éditables, tableaux, images, sauts de page | Absent (seul le moteur de rendu existe : `mgPrint`, `svDpPrint`, `plModelDoc`) | CH-14 |
| `SelectTemplateDialog` : choix du modèle à l'impression (ouvert depuis 15 fenêtres) | Absent (jeu 0, puis 1, puis 2 imposé) | CH-09 |
| Modèles de pages (Nouveau, Copier, Mettre à jour ; `PageTemplateViewer`) | Absent | CH-12 |
| Modèles d'étiquettes (Nouveau, Copier ; `LabelSettingsDialog`) | Absent | CH-12 |
| Styles de textes (jeux de 10 styles, Modifier le nom de la police) | Absent | CH-12 |
| Styles de tableaux (Nouveau, Dupliquer, Réinitialiser ; aperçu simple, groupé, CAN) | Absent | CH-12 |
| Polices (Vérifier / Importer TTF et TTC, Importer un dossier, Informations) | Absent | CH-12 |
| « Télécharger des modèles » (serveur de l'éditeur, classe sans référence) | Sans objet | — |

### 6.2 Les 25 catégories de modèles (groupe général : 14, groupe affaire : 11)

| Catégorie | Types | DeltaSub : types imprimables au nouveau format (détail au § 10) |
|---|---|---|
| Entités et adresses | 4 | 0 (ancien modèle `addressList` seulement) |
| Collaborateurs | 2 | 1 (Liste des collaborateurs) |
| Affaires | 1 | 0 (ancien) |
| Notes de frais | 1 | 0 (ancien) |
| Heures | 8 | 0 (ancien ou HTML) |
| Management - Genres d'affaires | 1 | 1 |
| Management - Analyse des heures | 1 | 1 |
| Management - Controlling | 4 | 4 |
| Management - Contrats d'honoraires | 6 | 0 |
| Management - Planification RH | 4 | 4 |
| Management - Facturation | 3 | 0 |
| Management - Collaborateurs | 9 | 9 |
| Maître d'ouvrage | 1 | 1 |
| Reporting | 5 | 5 |
| Modèles généraux (affaire) | 6 | 0 (Intervenants, Tâches, Liste des tâches par l'ancien modèle) |
| Séances | 3 | 0 |
| Honoraires | 2 | 0 (ancien) |
| Factures | 1 | 0 (ancien) |
| Gestion des plans | 4 | 0 |
| Controlling | 5 | 0 (ancien `projectTime` / `projectCost`) |
| Planification RH | 1 | 1 |
| Calcul des coûts | 1 | 0 (EC-2, lot 4) |
| Devis général | 3 | 0 (ancien ou HTML pour 2 sur 3) |
| Soumission | 11 | 2 (6 en cours au lot 2) |
| Contrôle des coûts | 16 | 0 (ancien ou HTML pour 4 sur 16) |

### 6.3 ANCIENS MODELES (DESIGN)

Images, Arrière-plans et les 7 familles de formulaires sont **présents**. La commande « Changer le style de police de tous les modèles » (`ChangeFontDialog`) reste à vérifier et relève de CH-10.

Anciens types présents au bureau (`FORMTEMPLATE`) et encore inutilisés par DeltaSub :
- `projectCostcontrol*` : Addendum, Contract, ContractList, Description, EntrepreneurAccount, EntrepreneurDeduction, GarantyList, MutationList, MutationSheet, PaymentRapport, BuildingDescription ;
- `projectCostJournal`, `projectTimeJournal`, `projectMinutes`, `projectPlanList`, `projectPlanDeliveryNote`, `projectTendererList` ;
- 20 types `projectDevis*` ;
- `projectCostplannigElements` ;
- `note` (messages brefs, 20) ;
- `label` (5) ;
- `bankList` ;
- les 17 types `management*`.

Ils offrent un **repli immédiat** pour CH-01, CH-09, CH-13, CH-15 et CH-16.

---

## 7. Matrice F : barre de menus, Préférences, Paramètres système

| Menu ▸ entrée | Classe DP | Condition | DeltaSub | Chantier |
|---|---|---|---|---|
| Fichier ▸ Importer des vCards | `vCard.ImportVCardDialog` | `contactImport` | Absent | CH-04 |
| Fichier ▸ Importer des adresses (CSV, `.archfile`) | `ImportCSVDialog`, `ImportAFDialog` | `contactImport` | Absent | CH-04 |
| Fichier ▸ Importer les modèles | `TemplateImport` | `isModuleFormVisible` + `design` | Absent | CH-10 |
| Fichier ▸ Quitter | — | hors macOS | Sans objet | — |
| Affichage ▸ Masquer / Afficher la barre des modules (⌘M) | `AppForm.hideTree` | — | Absent | CH-10 |
| Affichage ▸ Ouvrir les modules (⌘T) / Fermer les modules (⌘⇧T) | `expandTree` / `collapseTree` | — | Partiel (repli section par section) | CH-10 |
| Réglages ▸ Configurer un collaborateur | `intro.EmployeesDialog` | admin | Absent | CH-08 |
| Réglages ▸ Administrateur | `admin.AdminDialog` | `admin` | Partiel (§ 5) | CH-06 |
| Réglages ▸ Gestion des utilisateurs | `user.UserAdminDialog` | `userAdmin` | Absent | CH-08 |
| Réglages ▸ Mettre à jour les licences CRB | `DataLicencesAdminDialog` | `userAdmin` | Sans objet (service CRB) | § 14 |
| Réglages ▸ Paramètres système | `SystemPreferencesDialog` | `admin` | Absent (hors TVA) | CH-08 |
| Réglages ▸ Paramètres système [Ancien document] | `SystemLegacyPreferencesDialog` | `admin` | Absent | CH-08 |
| Réglages ▸ Emplacement du dossier DELTAprojectFiles | `PathToFilesDialog` | — | Sans objet (serveur) | — |
| Réglages ▸ Emplacements des modèles et des documents externes | `PathsDialog` | `isProjectMenuFilesVisible` (NON) | Absent (masqué) | CH-13 |
| Réglages ▸ Export des données | `DataExportDialog` | `adminDataExport` | Absent (seulement des CSV ponctuels) | CH-10 |
| Réglages ▸ Export iOS | `ExportiOSDialog` | — | Absent | D9 (sans objet ?) |
| Réglages ▸ Préférences | `pref.PreferencesDialog` | — | Absent | CH-08 |
| Réglages ▸ [Dev] × 4 | `ResourcesAdminDialog`, `db.Cleanup`, `DatabaseTypeDialog`, `ForwardTimeDialog` | version de développement | Sans objet | — |
| Aide ▸ Aide (manuel PDF) | — | — | Absent | CH-08 |
| Aide ▸ Support | page du distributeur | — | Sans objet | — |
| Aide ▸ Gestion des licences DELTAproject / CRB | `LicencesDialog`, `DataLicencesDialog` | — | Sans objet | § 14 |
| Aide ▸ Rechercher les mises à jour | `CheckUpdateDialog` | — | Sans objet | — |
| Aide ▸ À propos | `AboutDialog` | — | Absent (trivial) | CH-08 |

**Préférences** (9 catégories) : Langue des documents, Correcteur orthographique, Utilisateur (initiales, téléphone, courriel, titre, fonction, **signature PNG**), Apparence, Saisie de texte, Tableau, vCard export, DELTAbaucost (masquée au bureau), Bâtiment (catalogues CAN, dialogue des licences, enregistrement automatique). **Toutes absentes** (CH-08). La catégorie Bâtiment ne porte que des réglages sans objet, à l'exception de l'enregistrement automatique.

**Paramètres système** :
- Général : pays, monnaie, TVA ;
- Adresses : « Nom et prénom » ou « Prénom et nom », format des téléphones ;
- Bâtiment : protection des documents, `areBauadDocsLocked` ;
- dossier des logos ;
- [Ancien document] : module DESIGN affiché, polices standard, domaine Fichiers affiché.

Seul le taux de TVA existe dans DeltaSub (CH-08).

---

## 8. Matrice G : fonctions transverses

| Fonction | Classe(s) DP | Usage au bureau | DeltaSub | Chantier |
|---|---|---|---|---|
| Contrat de licence au démarrage | `LicenseAgreementDialog` | — | Sans objet | — |
| Ouverture de session (serveur, utilisateur, mot de passe, mémoriser) | `login.LoginDialog` | 11 comptes, 8 actifs | Partiel (« Qui utilise ce poste ? », sans mot de passe) | CH-08 |
| Modifier le mot de passe, reprendre une session ouverte | `ChangePasswordDialog`, `AppUserOverrideLoginDialog` | — | Absent | CH-08 |
| Maintenance de la base, type de connexion, licences d'application | `MaintenanceDialog`, `DatabaseTypeDialog`, `LicenceDialog` | — | Sans objet (serveur SQLite, sauvegarde horaire) | — |
| Utilisateurs, fonctions, jeux de privilèges, navigateur des droits | `UserAdminDialog`, `AppUserDialog`, `AppCompanyRoleDialog`, `AppRoleDialog`, `RightBrowserDialog` | 20 rôles, 3 fonctions | Absent | CH-08 |
| Application des 66 droits | `Rights$Right` (62 testés) | — | Partiel (Planification RH seulement ; `areBauadDocsLocked` pour la Soumission) | CH-08 |
| Verrouillage des documents + déverrouillage (droit `generalUnlockDocuments`) | `DocumentLockDialog` (29 fenêtres) | 1 verrou résiduel | Partiel (verrou coopératif dans la Soumission seulement) | CH-03, CH-10 |
| Veille : accès rapide aux Adresses et aux Heures depuis un document | `ModuleSelectionDialog` (19 fenêtres Bâtiment) | n/m | Absent | CH-10 |
| Export des données (adresses, adresses pour DELTAbauad, heures, frais d'affaire) | `DataExportDialog` | `lockExportAllAddresses` = OUI | Absent | CH-10 |
| Import / export vCard, import CSV, import `.archfile` | `vCard.*`, `ImportCSVDialog`, `ImportAFDialog` | n/m | Absent | CH-04 |
| Import des modèles | `TemplateImport` | — | Absent | CH-10 |
| Export iOS (JSON ou XML des affaires) | `export.ExportiOSDialog` | aucune trace | Absent | D9 |
| Importer les heures | `ImportTimeLogsDialog` | n/m | Absent | CH-05 |
| Importer les activités et les tarifs d'une autre affaire | `ProjectImportFromProjectDialog` | n/m | Absent (seul « Importer du dossier standard » existe) | CH-05 |
| Importer un plan comptable | `ImportCatalogDialog` | 48 catalogues d'affaire | Absent | CH-05 |
| Import / export `.deltakv`, import d'un devis d'une affaire, Dupliquer et modifier la subdivision | `CostEstimatePlugin`, `MatchStructureDialog` | 1 devis type `.deltakv` | Absent | CH-02 |
| Synchronisation d'adresse d'entreprise (Bâtiment ↔ carnet d'adresses) | `costcontrol.AddrSynchDialog` | n/m | Absent | CH-10 |
| Transférer la soumission vers le contrôle des coûts | `DevisBookToCostDialog`… | — | En cours (lot 2) | EC-1 |
| Créer un devis ou un descriptif depuis l'eCCC | `CreateEstimateDialog`, `CreateDevisDialog` | — | Absent (lot 4) | EC-2 |
| Marquer heures ou frais « facturés » (lien avec une facture) | `TimeLogChargedDialog`… | 1 514 lignes facturées | Présent (« Transférer en facturation », statuts) | — |
| Lier un point de séance à une tâche | `MeetingItemDialog` | — | Absent | CH-15 |
| Courriel groupé (mailto) depuis les listes | `EmailActions` | n/m | Présent | — |
| Valider les courriels (séparateurs, Outlook) | `CheckEmailListDialog` | — | Absent | CH-04 |
| Visionneuse `ReportViewer` / `Viewer` (Imprimer, PDF, Exporter, Archiver, Courriel) | `doc.ui.*` (61 fenêtres) | n/m | Partiel (fenêtre d'impression du navigateur) | CH-03 |
| Partager le fichier PDF (formule d'appel, objet, texte, pièce jointe) | `SharePdfDialog`, `ShareOnePdfDialog`, `SharePdfsDialog` | — | Absent (menus grisés dans la Soumission) | CH-03 |
| Enregistrer le PDF comme annexe ; fusionner des PDF ; importer un PDF | `MergePdfFilesDialog`, `ImportPdfFileDialog` | 380 PDF CoCo, dont 17 factures d'entreprise jointes | Absent | CH-03 |
| Note d'expédition, commentaire sur le document | `MailingInfoDialog` | — | Absent (2 mentions en texte) | CH-01, CH-03 |
| Serveur de fichiers (PDF et pièces jointes stockés) | dépôt `DELTAprojectFiles` | 1,70 Go | Absent (`/api/file` inexistant) | CH-03 |
| Présentations de listes (assistants avec favoris) | `AdrListWizardDialog`, `ProjectListWizardDialog`, `time.list.*`, `project.cost.*`, `project.plan.*`, `management.list.*` (15) | n/m | Partiel (réglages de colonnes dans certaines vues) | CH-04, CH-05, CH-09, CH-16 |
| Carte (map.search.ch, Google Maps), annuaire (tel.search.ch, local.ch) | `MapLookupPopup`, `PhoneDirectoryPopup` | — | Partiel (lien map.search.ch seulement) | CH-04 (liens) |
| Rapport d'erreur au support | `ErrorMessageDialog` | — | Sans objet | — |
| Outils cachés (décalage des saisies, purge, éditeur de libellés) | `ForwardTimeDialog`, `db.Cleanup`, `ResourcesAdminDialog` | — | Sans objet | — |
| Services CRB : CRBonline, PRD, éco-devis, SIATEST, SFTP | `crbonline*`, `prd.*`, `eco.*`, `SiaTest`, `SFTPService` | licence CAN absente | Non reproductible | § 14 |

Fonctions **inexistantes** dans Deltaproject, vérifiées dans le bytecode (rien à reprendre) : recherche globale, notifications, rappels, agenda, synchronisation générale, sauvegarde intégrée.

---

## 9. Matrice H : écrans et fonctions secondaires par module

Pour les lignes « Présent », la liste est donnée en bloc ; les autres sont détaillées une à une. Les numéros renvoient à `inv_manuel.md` § 4.

### 9.1 Adresses et collaborateurs

**Présents** :
- Adresses : B01-B05, B07-B15, B18, B19 (sous-modules, entités, comptes bancaires, informations, adresses liées, participations, familles et consortiums, listes, favoris, propriétés, groupes intelligents et statiques, recherche, navigateur) ;
- Collaborateurs : C01-C06 (y compris le verrouillage et la disponibilité) ;
- copie dans le presse-papier, export CSV d'un tableau, courriel.

| Élément | DeltaSub | Chantier |
|---|---|---|
| B06 Bloc-note temporaire (aide à la saisie) | Absent | CH-04 |
| B16 Sorties des groupes : étiquettes, lettres en série | Absent (étiquettes) | CH-04 |
| B17 Import de vCards, export vCard | Absent | CH-04 |
| Import CSV avec mappage, import `.archfile` | Absent | CH-04 |
| « Editer des adresses… » (modification groupée, `ContactsDialog`) | Absent | CH-04 |
| Fiche de l'adresse, liste des adresses de l'entité, liste des banques (impressions) | Absent | CH-04 |
| Assistant « Liste d'adresses » avec favoris (`AdrListWizardDialog`, 68 libellés) | Partiel (présentations fixes) | CH-04 |
| Annuaire (tel.search.ch, local.ch), Google Maps | Absent (map.search.ch présent) | CH-04 |
| Collaborateurs ▸ Participation aux affaires, Fiche du collaborateur, Etiquettes | Absent | CH-04 |

### 9.2 Gestion de l'affaire (configuration)

**Présents** : D01-D05, D07-D10, D14 ; Attribuer les intervenants ; Attribuer les activités aux collaborateurs ; Configurer les activités, les phases et les tarifs ; subdivisions par ouvrages et par locaux ; Définir les modèles (groupe de formulaires) ; Liste des affaires.

| Élément | DeltaSub | Chantier |
|---|---|---|
| D06 Groupes de rôles (édition, « Définir un groupe de rôles ») | Partiel (filtre seulement) | CH-05 |
| « Attribuer les collaborateurs d'affaire » | Absent | CH-05 |
| D11 Configurer les frais (comptes de frais de l'affaire ; 1 158 lignes au bureau) | Absent | CH-05 |
| D12 Genres de séances de l'affaire (« Configurer les genres de procès-verbaux ») | Absent | CH-15 |
| D13 Types de plans et nomenclature des plans de l'affaire | Absent | CH-16 |
| D15 Plans comptables de l'affaire (CFC, eCCC, plan propre ; import ; CFC par chapitre) | Partiel (lecture) | CH-05 |
| Subdivision par affectations (`ProjectUseZonesDialog`) | Absent | CH-05 |
| D16 « Définir les modèles » : sections Modèles de documents (`DOCTEMPLATEGROUPNAME`) et Modèles externes | Partiel | CH-05, CH-13 |
| D17 Dossier des documents externes, liens avec les sous-dossiers `DELTAprojectDocuments` | Partiel (chemin relatif) | CH-05 |
| Importer les heures (`ImportTimeLogsDialog`, 27 libellés) | Absent | CH-05 |
| Importer les activités et les tarifs d'une autre affaire | Absent | CH-05 |
| Editer le filtre (`ProjectFilterDialog`, 11 fenêtres) ; assistant Liste des affaires avec favoris | Partiel (menu simple) | CH-05 |
| « Configurer la répartition des frais par éléments » | Libellé seul ; la classe n'existe plus en 16.05 | Sans objet |

### 9.3 Heures, notes de frais, Controlling

**Présents** :
- Heures : E01-E06 (saisie semaine et mois, couleurs, réglages personnels, rapports, notes de frais et leurs rapports, duplication, export) ;
- Controlling : F01, F02, F04, F05 ;
- statuts facturable et facturé ;
- transfert en facturation.

| Élément | DeltaSub | Chantier |
|---|---|---|
| F03 Récapitulatifs imprimés directement : Journal des heures, Rapport heures-facturation-coût de revient, Analyse détaillée des heures, Rapport des frais, Récapitulatif des frais (nouveau format) | Partiel (ancien `projectTime` / `projectCost`) | CH-09 |
| « Composer le rapport », « Grouper les heures / les coûts », favoris et filtres des analyses | Absent | CH-09 |
| Documents time* au nouveau format (8 types, dont `timeWeeklyJournal`) | Partiel (ancien) | CH-09 |
| Disponibilité : Heures disponibles, Solde du temps disponible (nouveau format) | Partiel (HTML) | CH-09 |

### 9.4 Honoraires, contrats, factures

**Présents** : I01-I07, I09-I12, I17-I20, I22 (calcul, modes de calcul, coût de l'ouvrage, temps effectif, frais, contrats, encaissements planifiés et saisis, avancement, factures, positions, statuts, contrôle de factures, QR-facture, import des positions).

| Élément | DeltaSub | Chantier |
|---|---|---|
| I08 Document « Offre d'honoraires » (`projectFeeCalculation`) ; libellé du domaine « Offres d'honoraires » | Partiel (« [Ancien document] ») | CH-11 |
| I13-I16 Management ▸ Contrats honoraires (contrats, échéancier, situation, graphique d'avancement) | Absent | CH-11 |
| I21 Facture enregistrée + QR-facture + annexes fusionnées en un PDF ; QR « Nouveau fichier PDF », « Ajouter à la fin », « Afficher le PDF » | Partiel (QR sans fusion ; 3 options grisées) | CH-11 (+ CH-03) |
| I23 Management ▸ Factures (jour de référence) | Absent | CH-11 |
| « Importer des fichiers PDF du calcul » | Absent | CH-11 |
| Paramètres de l'ancien document de facture (`TEMPLATEPROPERTIES`) | Partiel (valeurs du modèle) | CH-11 |

### 9.5 Planification RH et Reporting

**Tous présents** : G01-G14, O01, O02. Restent ouverts :
- le point § 10 de spec_10 (écart d'Analyse 6, bandeau « aucune planification ») ;
- l'« Ancien document » du Reporting (CH-09).

### 9.6 Devis général

**Présents** : L01-L04, L11 (liste et variantes, nouveau devis, édition, fenêtre de calcul, montant soumis aux honoraires), Mettre à zéro, remarques préliminaires, paramètres, présentations, export CSV.

| Élément | DeltaSub | Chantier |
|---|---|---|
| L05 Navigateur de positions (autres devis et affaires) | Absent | CH-02 |
| L06 Menu contextuel : indexer la position, modifier le taux de TVA | Absent | CH-02 |
| Supprimer la position, Supprimer les ouvrages à 0, statut « non définitif », Fixer le coût, Arrondir | Absent | CH-02 |
| L07 Présentations d'impression enregistrées (« Ajouter une présentation par défaut ») | Partiel | CH-02 |
| L08 Export FastTrack Schedule | Absent | CH-02 |
| L09 Saut de page en prévisualisation | Absent | CH-02 |
| L10 Dupliquer et modifier la subdivision (fusionner ou renommer des sous-projets) | Absent | CH-02 |
| Devis descriptif (`costEstimateDesc`, `DescDisplayPrefsDialog`) | Absent | CH-02 |
| Filtre ouvrages et facteur, favoris de filtre | Absent | CH-02 |
| Import / export `.deltakv`, import d'un devis CFC d'une affaire | Absent | CH-02 |
| À la dernière version (historique automatique : 17 226 versions au bureau) | Absent | CH-02 |

### 9.7 Contrôle des coûts

**Présents** : N01, N03, N06-N09, N11-N13, N15, N17-N19, N22-N24 (liste, types, présentations du bureau, colonnes, attribution du DG, mutations 1, contrats et avenants, priorité du contrat, paiements sur contrat et hors contrat, ordres et bons, section des arrêtés, coût probable, provisions, comptes d'entreprise).

| Élément | DeltaSub | Chantier |
|---|---|---|
| Documents : Contrat, Avenant, Liste contrats et avenants, Arrêté de compte, Liste des garanties, Rapport de paiements, Compte d'entreprise, Liste des mutations, Mutation, Devis général (CC), Contrôle des coûts (nouveau format) | Absent (Ordre, Bon et tableau : partiel, ancien ou HTML) | CH-01 |
| N19-N20 Arrêté de compte complet (`DeductionDialog`, 96 libellés), garanties, « Comptabiliser le paiement final » | Partiel (section présente ; document et garanties absents) | CH-01 |
| N21 Rapport de paiement (filtres, tris, récapitulatif TVA, imprimé) | Partiel (liste sans document) | CH-01 |
| Options « Arrondir les conditions », « Afficher le total arrondi », note d'expédition, commentaire sur le document | Absent | CH-01 |
| Annexes PDF (facture d'entreprise jointe au bon) | Absent | CH-01 (+ CH-03) |
| N02 Configuration complète (types de mutation, conditions, genres de paiement, centres à activer) | Partiel (3 champs) | CH-07 |
| N04 Comptes du maître d'ouvrage (édition) ; N16 compte bancaire de l'entreprise | Partiel (lecture) | CH-07 |
| N05 Titres de colonnes (1 ou 2 lignes, variables) | Partiel (lecture) | CH-07 |
| Gestion des présentations (enregistrer, renommer, supprimer, glisser), fenêtre « Affichage », filtres et favoris | Absent | CH-07 |
| À la dernière version (897 archives `.zip` d'historique) | Absent | CH-07 |
| N09 Mutations 2 ; N10 renchérissement ICC ; facteur d'index du DG ; prorata | Absent (P3, jamais utilisé) | CH-07 |
| N14 Montant plafonné ; N25 centres libres 1-3 ; N26 équations 1-6 ; métré | Absent (P3, jamais utilisé) | CH-07 |
| N27 DESCRIPTIF (descriptif de construction) ; section HONORAIRES | Absent (P3) | CH-07 |

### 9.8 eCCC

| Élément | DeltaSub | Chantier |
|---|---|---|
| K01, K05, K11 (nouvelle estimation, quantités dépendantes, navigateur des sous-éléments) | Présent | — |
| K02, K06, K09, K12, K14, K15 (fenêtre, calcul des éléments et sous-éléments, données écologiques, composants, durée de vie) | Partiel (lots 0-1) | EC-2 |
| K03, K04 (quantités de référence et import), K20 (chiffres-clés) | Absent (lot 2) | EC-2 |
| K07 propositions CFC, K19 vue d'ensemble, K21 post-calcul, K22 base de valeurs de référence | Absent (lot 3) | EC-2 |
| K08, K10, K13, K16, K17 (descriptif propre, fixer une position, positions CAN, éléments individuels, options d'affichage) | Partiel ou à confirmer au fil des lots (K13 dépend du CAN : non reproductible) | EC-2 |
| K18 devis CFC et descriptif dérivés ; impressions ; SIA 451 ; fichiers ; verrou | Absent (lot 4) | EC-2 |
| Import ArchiCAD / IFC (`cad.ImportFromArchiCadDialog`) | Absent | D10 |

### 9.9 Soumission IfA 18

| Élément | DeltaSub | Chantier |
|---|---|---|
| M01, M03, M37 (liste, données du document, soumissionnaires) | Présent (lot 1) | — |
| M02, M05 (création, étapes) | Partiel | EC-1 |
| M38-M47, M49 (comparatif, saisie des prix, évaluation, adjudication, comparatif bref, contrat) | En cours (lot 2) ou absent (lot 3b) | EC-1 |
| M12-M15, M17-M34 (descriptif : articles, articles et chapitres de réserve, subdivisions, variantes, genres, métré, conditions, remarques préliminaires, tri, colonnes) | En cours (lot 3a, descriptif libre sans CAN) | EC-1 |
| M35, M36 (export et import SIA 451) ; M48 (transfert vers le CC) ; M50 (métré) ; M53 (documents et PDF) | En cours (M48 au lot 2) ou absent (lot 4) | EC-1 |
| M04 (traduire, convertir IfA 18), M51 (convertir le descriptif d'une édition CAN à l'autre) | Absent ; dépend du CAN | § 14 |
| M06-M11, M16 (catalogues en ligne, CAN, préférences du catalogue, PRD, éco-devis, textes indicatifs, normes) | Non reproductible (CRB) | § 14 |

### 9.10 Modèles, serveur

**Présents** :
- O03-O05 (images, arrière-plans, organisation des anciens modèles) ;
- O06-O13 (éditeur de page des anciens modèles : à confirmer au détail) ;
- O27 (serveur partagé : équivalent `serveur_deltasub.py`).

| Élément | DeltaSub | Chantier |
|---|---|---|
| O14 et P45 Étiquettes (assistant d'étiquettes) | Partiel (édition du modèle, pas d'impression) | CH-04 |
| O16 Polices ; O17 Styles de textes ; O18 Styles de tableaux ; O19, O20 Modèles de pages | Absent | CH-12 |
| O21-O26 Modèles de documents (catégories, types, sections, éléments, champs, signature, éléments de bord éditables) | Partiel (consultation) | CH-14 |
| O28 Licences ; O29 mise à jour annuelle de la base | Sans objet | — |

---

## 10. Matrice I : documents imprimés (103 types `.dpdoc`)

Liste lue dans `app.doc.Templates$DocumentType` ; libellés tirés de `Strings.db`.

Moteurs DeltaSub :
- **dpdoc** : `mgPrint`, `svDpPrint` ou `plModelDoc` ;
- **ancien** : `tplPrint`, avec un ancien modèle DESIGN du bureau ;
- **HTML** : impression simple du navigateur.

Pour l'usage : `.dpdoc` = documents enregistrés dans `DELTAprojectFiles` ; « perso » = modèle retouché par le bureau.

### 10.1 Groupe général (50 types)

| Type | Libellé FR | DeltaSub | Usage au bureau | Chantier |
|---|---|---|---|---|
| contactOwnerSheet | Liste adresses de l'entité | Absent | n/m | CH-04 |
| contactSheet | Fiche de l'adresse | Absent | n/m | CH-04 |
| contactList | Liste des adresses | Partiel (ancien `addressList`) | n/m | CH-09 |
| bankList | Liste des banques | Absent | n/m | CH-04 |
| staffSheet | Fiche du collaborateur | Absent | n/m | CH-04 |
| staffList | Liste des collaborateurs | Présent (dpdoc) | n/m | — |
| projectList | Liste des affaires | Partiel (ancien) | n/m | CH-09 |
| expensesReport | Liste des notes de frais | Partiel (ancien) | perso 2023 | CH-09 |
| timeWeeklyReport | Rapport hebdomadaire | Partiel (ancien) | n/m | CH-09 |
| timeWeeklyJournal | (sans libellé FR) | Absent | — | CH-09 |
| timeMonthlyReport | Rapport mensuel | Partiel (ancien) | perso 2024 | CH-09 |
| timeJournal | Journal mensuel | Partiel (ancien) | perso 2024 | CH-09 |
| timeAnnualReport | Rapport annuel | Partiel (ancien) | n/m | CH-09 |
| timeHolidayReport | Rapport des vacances | Partiel (ancien) | n/m | CH-09 |
| timeProjectTimeReport | Heures disponibles | Partiel (HTML) | abandonné | CH-09 |
| timeProjectTimeLogReport | Solde du temps disponible | Partiel (HTML) | abandonné | CH-09 |
| managementProjectKindList | Genres d'affaires | Présent | n/m | — |
| managementProjectTimeReport | Analyse des heures | Présent | n/m | — |
| managementProjectControlStaffReport | Collaborateurs - Affaires | Présent | n/m | — |
| managementProjectControlProjectReport | Affaires - Collaborateurs | Présent | n/m | — |
| managementProjectControlPhasesReport | Affaires - Phases | Présent | n/m | — |
| managementProjectControlActivitiesReport | Affaires - Activités | Présent | n/m | — |
| managementContracts | Contrat d'honoraires | Absent | sans licence | CH-11 |
| managementContractsAndSubContracts | Contrats et sous-traitants | Absent | sans licence | CH-11 |
| managementContractsScheduledPaymentsList | Echéancier d'encaissements | Absent | sans licence | CH-11 |
| managementContractsScheduledPayments | Encaissements planifiés | Absent | sans licence | CH-11 |
| managementContractsPayments | Encaissements | Absent | sans licence | CH-11 |
| managementContractsPaymentBalance | Situation des encaissements | Absent | sans licence | CH-11 |
| managementPlanningAnalyzeProfitReport | Marge bénéficiaire | Présent | sans licence | — |
| managementPlanningAnalyzeBudgetReport | Encaissements | Présent | sans licence | — |
| managementPlanningProjectAssignmentReport | Attribution de l'affaire | Présent | sans licence | — |
| managementPlanningStaffAssignmentReport | Attribution des collaborateurs | Présent | sans licence | — |
| managementInvoiceReport | Vue d'ensemble de l'année | Absent | sans licence | CH-11 |
| managementInvoiceListReport | Listes des factures | Absent | sans licence | CH-11 |
| managementInvoicePendingReport | Honoraires et frais | Absent | sans licence | CH-11 |
| managementStaffTargetTimeReport … managementStaffHolidayBalanceReport (9 types) | Heures à effectuer, avec heures d'appoint, saisies, soldes (3), supplémentaires, notes de frais, vacances saisies, droit aux vacances | Présent (9/9) | n/m | — |
| managementBuilderReport | Maîtres d'ouvrage | Présent | n/m | — |
| managementTimeReportKeyFigures, …Staff, …TimeBalance, …Year, …Compare | Reporting (5) | Présent (5/5) | sans licence | — |

### 10.2 Groupe affaire (53 types)

| Type | Libellé FR | DeltaSub | Usage au bureau | Chantier |
|---|---|---|---|---|
| projectDocument | Document | Absent | 1 `.dpdoc` ; perso 2023 | CH-13 |
| projectMemberList | Intervenants | Partiel (ancien `projectMember`) | perso 2025 | CH-09 |
| projectTendererList | Soumissionnaires | Absent | essai | EC-1 (lot 4) |
| projectNote | Note | Absent | 0 | CH-13 |
| projectTask | Tâches d'affaire | Partiel (ancien, choix de spec_7) | 0 | CH-09 |
| projectTaskList | Liste des tâches de l'affaire | Partiel (ancien) | 0 | CH-09 |
| projectMeetingAgenda | Convocation | Absent | 0 | CH-15 |
| projectMeeting | Procès-verbal | Absent | 0 | CH-15 |
| projectMeetingItems | Rapport | Absent | 0 | CH-15 |
| projectFeeCalculation | Offre d'honoraires | Partiel (« [Ancien document] ») | sans licence | CH-11 |
| projectContract | Contrat d'honoraires | Partiel (ancien `projectContractOverview`) | essai | CH-11 |
| projectInvoice | Facture | Partiel (ancien « Substances ») | sans licence | CH-11 |
| projectPlanList | Liste des plans | Absent | 0 | CH-16 |
| projectPlanVersionList | Versions des plans | Absent | 0 | CH-16 |
| projectPlanRecipientList | Liste des destinataires du plan | Absent | 0 | CH-16 |
| projectPlanDeliveryList | Bulletin de livraison | Absent | 0 | CH-16 |
| projectTimeLog | Journal des heures | Partiel (ancien `projectTime`) | perso 2024 (timeJournal) | CH-09 |
| projectTimeLogStaff | Rapport heures - facturation - coût de revient | Partiel (ancien) | n/m | CH-09 |
| projectTimeLogSummary | Analyse détaillée des heures | Partiel (ancien) | n/m | CH-09 |
| projectProjectCost | Rapport des frais | Partiel (ancien `projectCost`) | n/m | CH-09 |
| projectProjectCostSummary | Récapitulatif des frais | Partiel (ancien) | n/m | CH-09 |
| projectPlanningAnalyzeProfitReport | Marge bénéficiaire | Présent | sans licence | — |
| costPlanningDocument | Calcul des coûts | Absent (lot 4) | 4 `element.dpdoc` | EC-2 |
| costEstimateEstimate | Devis général | Partiel (ancien `projectCostcontrolEstimate` ou HTML) | **51 `.dpdoc` + 13 PDF** ; perso 2024-2026 | CH-02 |
| costEstimateDesc | Devis descriptif | Absent | 4 `.dpdoc` | CH-02 |
| costEstimateHonorar | Honoraires | Partiel (ancien `projectCostcontrolFee`) | 4 `.dpdoc` | CH-02 |
| devisTendererLetter | Courrier d'accompagnement | Présent (dpdoc) | sans licence | — |
| devisTendererList | Soumissionnaires | Présent (dpdoc) | sans licence | — |
| devisRejectionLetter | Courrier de refus | En cours (lot 2) | sans licence | EC-1 |
| devisAcceptanceLetter | Courrier d'adjudication | En cours (lot 2) | sans licence | EC-1 |
| devisConfirmationOfOrder | Commande | En cours (lot 2) | sans licence | EC-1 |
| devisBidding | Négociation | En cours (lot 2) | sans licence | EC-1 |
| devisPriceComparison | Comparatif | En cours (lot 2) | sans licence | EC-1 |
| devisAwardRequest | Proposition d'adjudication | En cours (lot 2) | sans licence | EC-1 |
| devisWorkPreparationLetter | Lettre de début préparation | Absent (lot 4) | sans licence | EC-1 |
| devisPriceComparisonDesc | Descriptif avec comparatif des prix | Absent (lot 3b / 4) | sans licence | EC-1 |
| devisDocument | Descriptif | Absent (lot 4) | sans licence | EC-1 |
| costControlEstimate | Devis général (CC) | Absent | 1 `.dpdoc` | CH-01 |
| costControlOverview | Contrôle des coûts | Partiel (ancien `projectCostcontrolOverview` ou HTML A4) | **40 `.dpdoc`** ; perso | CH-01 |
| costControlMutationsList | Liste des mutations | Absent | rare | CH-01 |
| costControlMutationSummary | Mutation | Absent | 4 `.dpdoc` | CH-01 |
| costControlAwardList | Liste contrats et avenants | Absent | **14 `.dpdoc`** | CH-01 |
| costControlContractSummary | Contrat | **Absent** | **360 `.dpdoc` + 297 PDF** (dont « Contrat nettoyage » 16, « Contrat RE » 2) | CH-01 |
| costControlAddendumSummary | Avenant | Absent | 6 `.dpdoc` | CH-01 |
| costControlPaymentOrder | Ordre de paiement | Partiel (ancien `projectCostcontrolRemittanceOrder` ou HTML) | **104 `.dpdoc`** ; perso 04.2026 | CH-01 |
| costControlContractPaymentSummary | Bon de paiement sur contrat | Partiel (ancien `projectCostcontrolPaymentOrder` ou HTML) | **61 paiements individuels** | CH-01 |
| costControlGeneralPaymentSummary | Bon de paiement hors contrat | Partiel (même moteur) | idem | CH-01 |
| costControlPaymentList | Rapport de paiements | Absent | **25 `.dpdoc`** | CH-01 |
| costControlEntrepreneurSummary | Comptes d'entreprises | Absent | 5 `.dpdoc` | CH-01 |
| costControlGuaranteeSummary | Arrêté de compte | **Absent** | **74 `.dpdoc` + 39 PDF** (plus « Décompte final » : 4) ; perso 12.2025 | CH-01 |
| costControlGuaranteeList | Liste des garanties | Absent | 2 `.dpdoc` | CH-01 |
| costControlDesc | Descriptif | Absent | 0 | CH-07 |
| costControlHonorar | Honoraires | Absent | 0 | CH-07 |

**Bilan (103 types)** : 29 présents, 27 partiels (ancien modèle ou HTML), 6 en cours, 41 absents. Les écarts les plus lourds pour l'usage réel sont tous au **contrôle des coûts** : Contrat (360), Arrêté de compte (74), Rapport de paiements (25), Liste d'adjudication (14).

### 10.3 Sorties hors modèles (manuel P01-P45) et exports

Les entrées P01, P03-P05, P07, P09, P10, P37-P39, P43 et P44 sont présentes. P06, P11-P36 et P40-P42 correspondent aux types du § 10.2 ou aux exports suivants :

| Sortie | DeltaSub | Chantier |
|---|---|---|
| P02 et P45 Étiquettes, lettres en série | Absent | CH-04 |
| P08 et P17 Pièces jointes de facture, fusion facture + QR + annexes | Partiel | CH-11, CH-03 |
| P11 Table des matières des documents externes | Absent | CH-13 |
| P12 Messages brefs : lettres, bulletins, refus, accompagnement en série (anciens modèles `note`, 20) | Absent | CH-13 |
| P14 Invitation à la séance par courriel | Absent | CH-15 |
| P21 Livraison des plans par courriel | Absent | CH-16 |
| P25 Export FastTrack Schedule | Absent | CH-02 |
| P27 Fichier SIA 451 (soumission ; eCCC) | Absent | EC-1, EC-2 |
| Export `.deltakv` | Absent | CH-02 |
| Export des données (CSV), vCard, iOS | Absent | CH-10, CH-04, D9 |

---

## 11. Synthèse chiffrée des écarts

| Matrice | Total | Présent | Partiel | Placeholder | En cours | Absent |
|---|---|---|---|---|---|---|
| Modules de la barre (A) | 50 | 37 | 4 | — | 2 | 7 |
| Domaines d'affaire (B) | 22 | 10 | — | 7 | 3 | 2 |
| Administrateur (D) | 21 | 6 | 6 | — | 1 | 8 |
| MODELES DOCUMENTS (E) | 6 | — | 1 | — | — | 5 |
| Barre de menus (F), hors sans objet | 17 | — | 3 | — | — | 14 |
| Documents `.dpdoc` (I) | 103 | 29 | 27 | — | 6 | 41 |

Les 17 entrées de la matrice F sont les entrées de la barre de menus qui ne sont pas sans objet. Les 3 partiels sont Administrateur, Ouvrir / Fermer les modules et l'ouverture de session.

---

## 12. Chantiers (tout ce qui est absent, placeholder ou partiel, hors chantiers en cours)

Chaque chantier se mène en deux temps : une recherche (bytecode, manuel, données du bureau), puis une implémentation de 4 à 8 lots.

**Ordre de priorité** : 1 = le plus utile au bureau et le moins dépendant ; 5 = sans usage au bureau ou très dépendant.

### 12.1 Tableau récapitulatif

| Id | Titre | Priorité | Taille | Statut | Usage au bureau | Licence | Dépend de | Reproductible |
|---|---|---|---|---|---|---|---|---|
| CH-01 | Contrôle des coûts : documents, arrêtés de compte et garanties | **1** | L | partiel | Intensif (719 `.dpdoc`, 380 PDF) | DELTAcostControl ✔ | moteur `.dpdoc` (existe) ; CH-03 en option | oui |
| CH-02 | Devis général : compléments d'édition, descriptif, imports / exports, historique | **1** | L | partiel | Intensif (221 devis, 17 226 versions) | DELTAcostEstimate ✔ | aucune (CH-03 en option) | oui |
| CH-03 | Socle documents : stockage des fichiers, PDF enregistrés, visionneuse, partage et fusion | 2 | L | absent | Intensif (1,70 Go de fichiers) | base | serveur DeltaSub | oui (courriel avec pièce jointe : D8) |
| CH-04 | Adresses et collaborateurs : imports, étiquettes, fiches, modification groupée | 2 | L | partiel | Intensif (755 adresses) | base | aucune | oui (annuaire : lien) |
| CH-05 | Gestion de l'affaire : configurations, imports, Entrepreneurs, filtre | 2 | L | partiel | Intensif (111 affaires, 1 158 frais d'affaire) | base | CH-06 (plans comptables, pour un lot) | oui |
| CH-06 | Administrateur : catégories manquantes et édition complète | 2 | M | partiel | Référentiels (peu modifiés) | base (plans comptables : contenu CRB) | aucune | oui (contenu CRB : copie du bureau seulement) |
| CH-07 | Contrôle des coûts : paramètres, présentations, domaine d'affaire et options avancées | 2 | L | partiel | Intensif pour la partie P2 ; options P3 jamais utilisées | DELTAcostControl ✔ | CH-01 | oui |
| CH-09 | Impressions au nouveau format (`.dpdoc`) des modules de base | 2 | L | partiel | Intensif (modèles heures, frais et intervenants personnalisés en 2023-2025) | base, DELTAcontrol ✔ | moteur `.dpdoc` (existe) | oui |
| CH-08 | Réglages, session, utilisateurs et droits | 3 | L | absent | 11 comptes, 20 rôles | base | aucune (côté serveur) | oui |
| CH-10 | Fonctions transverses et conformité de navigation (exports, Veille, verrou, synchronisation d'adresses, barre des modules) | 3 | M | absent | n/m | base | CH-08 (droit de déverrouillage) | oui (export iOS : D9) |
| CH-11 | Honoraires et facturation, lot 7 (Management Contrats et Factures, documents, QR, PDF) | 4 | L | absent | Sans licence au bureau | DELTAhonorar ✘, DELTAfaktura ✘ | CH-03, moteur `.dpdoc` | oui (**D2**) |
| CH-12 | Modèles documents : polices, styles, modèles de pages et d'étiquettes | 4 | L | absent | Occasionnel | base | aucune | oui |
| CH-13 | Documents d'affaire, messages brefs et fichiers externes | 4 | L | placeholder | Essai (1 document, 3 messages) ; Fichiers masqués | base | CH-03 ; CH-14 pour l'édition du contenu | oui (génération `.docx` : D11) |
| CH-14 | Modèles documents : éditeur de modèles et d'états | 5 | XL | partiel | Occasionnel (retouches CoCo 2024-2026) | base | CH-12 | oui (**D7**) |
| CH-15 | Séances et procès-verbaux | 5 | L | placeholder | Jamais (0 séance) ; le PV vit dans Facturation.html | base | CH-06 (genres), CH-03, CH-09 | oui (**D1**) |
| CH-16 | Liste des plans et liste de distribution | 5 | L | placeholder | Jamais (0 plan) | base | CH-06 (types de plans), CH-05, CH-03 | oui (**D3**) |

### 12.2 Fiches des chantiers (éléments complets et découpage en lots)

**CH-01 : Contrôle des coûts : documents, arrêtés de compte et garanties** (P1, L)

- *Éléments* : les 16 documents du contrôle des coûts (§ 10.2), dont 12 absents et 4 partiels. S'y ajoutent :
  - l'Arrêté de compte complet (`DeductionDialog`), les garanties et « Comptabiliser le paiement final » ;
  - le Rapport de paiements (filtres, tris, récapitulatif TVA) ;
  - les options « Arrondir les conditions » et « Afficher le total arrondi » ;
  - la note d'expédition et le commentaire sur le document ;
  - les annexes PDF du bon (avec CH-03).
- *Lots* :
  1. Socle : généraliser `svDpPrint` / `mgPrint` aux jeux 1 et 2 de l'affaire, avec repli sur les anciens modèles `projectCostcontrol*` du bureau ; Devis général et Contrôle des coûts.
  2. Adjudications : Contrat, Avenant, Liste contrats et avenants.
  3. Arrêtés de compte, garanties, paiement final ; documents Arrêté de compte et Liste des garanties.
  4. Rapport de paiements ; Bon sur contrat, Bon hors contrat et Ordre de paiement au nouveau format.
  5. Liste des mutations, feuille de mutation, Compte d'entreprise.
  6. En option : enregistrement des PDF et annexes (après CH-03).
- *Décision* : D4 (moteur de rendu).

**CH-02 : Devis général : compléments** (P1, L)

- *Éléments* :
  - édition : Indexer la position (+ sub.), Modifier la TVA, Supprimer la position, Supprimer les ouvrages à 0, statut « non définitif », Fixer le coût, Arrondir ;
  - filtre ouvrages et facteur, favoris de filtre ;
  - saut de page ; présentations d'impression enregistrées ;
  - Devis descriptif (écran et document) ; documents Devis général et Honoraires au nouveau format ;
  - Dupliquer et modifier la subdivision (MatchStructure / MatchSubproject) ;
  - navigateur de positions entre devis et affaires ; import d'un devis CFC d'une affaire ;
  - import et export `.deltakv` ; export FastTrack ; « Exporter » ;
  - domaine « Devis général » de l'affaire (placeholder à remplacer) ;
  - « À la dernière version » et historique.
- *Lots* :
  1. Commandes d'édition.
  2. Filtre, favoris, saut de page, présentations.
  3. Devis descriptif et documents `.dpdoc`.
  4. Subdivision, navigateur, import d'une affaire.
  5. `.deltakv`, FastTrack, exports.
  6. Domaine d'affaire et historique des versions.
- *Décision* : D12 (reprise de l'historique des versions).

**CH-03 : Socle documents : stockage, PDF, visionneuse, partage** (P2, L)

- *Éléments* :
  - `/api/file` dans `serveur_deltasub.py` : dépôt par objet, inclus dans la sauvegarde horaire ;
  - PDF enregistrés, « Enregistrer le PDF comme annexe » ;
  - visionneuse (`ReportViewer` : choix du modèle, Imprimer, Créer un PDF, Archiver) ;
  - Partager le fichier PDF (un ou plusieurs), note d'expédition, cacheter et confirmer l'envoi ;
  - fusion de PDF, import d'un PDF externe ;
  - verrou des documents généralisé ;
  - débloque les options grisées : Soumission lot 4, eCCC lot 4, QR (lot 7), annexes du contrôle des coûts.
- *Lots* :
  1. Serveur de fichiers et droits d'accès.
  2. Génération et enregistrement du PDF.
  3. Visionneuse et choix du modèle.
  4. Partage et courriel.
  5. Fusion et import de PDF, annexes.
  6. Verrou généralisé.
- *Décisions* : D8 (courriel avec pièce jointe), D12 (reprise des fichiers existants).

**CH-04 : Adresses et collaborateurs : fonctions secondaires** (P2, L)

- *Éléments* :
  - import vCard (assistant, jusqu'à 3 adresses, lier à la société) et export vCard ;
  - import CSV avec mappage, import `.archfile` ;
  - étiquettes (aperçu et réglages, anciens modèles `label`) depuis Adresses, Collaborateurs, Intervenants, Entrepreneurs et Soumissionnaires ;
  - « Editer des adresses… » (modification groupée) ;
  - bloc-notes d'aide à la saisie ; valider les courriels ;
  - fiche de l'adresse, liste des adresses de l'entité, liste des banques ;
  - assistant « Liste d'adresses » avec favoris ;
  - liens vers l'annuaire (tel.search.ch, local.ch) et Google Maps ;
  - Collaborateurs : Participation aux affaires, Fiche du collaborateur, étiquettes.
- *Lots* :
  1. vCard.
  2. CSV et `.archfile`.
  3. Étiquettes.
  4. Modification groupée, bloc-notes, validation des courriels.
  5. Fiches et listes imprimées, liens vers l'annuaire.
  6. Collaborateurs.

**CH-05 : Gestion de l'affaire : configurations, imports, Entrepreneurs** (P2, L)

- *Éléments* :
  - Configurer les frais (comptes et groupes de frais de l'affaire) ;
  - importer activités et tarifs d'une autre affaire ;
  - groupes de rôles (édition) ; Attribuer les collaborateurs d'affaire ;
  - domaine **Entrepreneurs** (intervenants du rôle `contractors`, import par rôle d'une autre affaire) ;
  - plans comptables de l'affaire (choisir, importer, configurer, CFC par chapitre) ;
  - subdivision par affectations ;
  - Importer les heures ;
  - Editer le filtre et assistant « Liste des affaires » avec favoris ;
  - dossier des modèles de documents (`DOCTEMPLATEGROUPNAME`), dossiers des enregistrements, liens vers les sous-dossiers.
- *Lots* :
  1. Frais et import depuis une autre affaire.
  2. Rôles, collaborateurs d'affaire, Entrepreneurs.
  3. Plans comptables et affectations.
  4. Importer les heures.
  5. Filtre et liste des affaires.
  6. Dossiers et modèles.
- *Décision* : D5 (domaine Liste d'adresses).

**CH-06 : Administrateur : catégories manquantes et édition complète** (P2, M)

- *Éléments* :
  - Genres d'affaires, Séances (genres de discussion), Types de plans (groupes et types) ;
  - Groupes de conditions, avec le navigateur de conditions réutilisé par le CC et la soumission ;
  - Blocs de texte (tous les groupes, navigateur `BoilerplateBrowser`) ;
  - Plans comptables (catalogues, positions propres, visibilité, langues ; **contenu CRB**) ;
  - édition complète des 5 catégories partielles : 4 langues, groupes de propriétés, phases partielles, groupes et types d'activités, unité, prix et groupe des frais.
- *Lots* :
  1. Genres, séances, types de plans.
  2. Conditions et blocs de texte.
  3. Plans comptables.
  4. Édition complète et multilingue.
- Le déplacement de l'Administrateur sous « Réglages » relève de CH-10.

**CH-07 : Contrôle des coûts : paramètres, présentations, options avancées** (P2, L)

- *Éléments P2* :
  - Configuration complète ;
  - comptes du maître d'ouvrage (édition), compte bancaire de l'entreprise ;
  - titres de colonnes éditables ;
  - gestion des présentations et fenêtre « Affichage » ; filtres et favoris ;
  - domaine « Contrôle des coûts » de l'affaire (placeholder à remplacer) ;
  - « À la dernière version » (897 archives).
- *Éléments P3* (jamais utilisés au bureau) :
  - MUTATIONS 2, renchérissement ICC, facteur d'index du DG, prorata ;
  - centres libres 1-3, montant plafonné, métré, équations 1-6 ;
  - sections DESCRIPTIF et HONORAIRES, avec leurs documents.
- *Lots* :
  1. Configuration, comptes, titres.
  2. Présentations, Affichage, filtres.
  3. Domaine d'affaire et historique.
  4. Mutations 2, ICC, facteur DG, prorata.
  5. Libres, plafonné, métré, équations.
  6. Descriptif et Honoraires.

**CH-08 : Réglages, session, utilisateurs et droits** (P3, L)

- *Éléments* :
  - Paramètres système : Général (pays, monnaie, TVA déplacée depuis l'Administrateur), Adresses (ordre nom/prénom, format des téléphones), Bâtiment (protection), logos ; [Ancien document] ;
  - Préférences : 9 catégories, dont Utilisateur avec la **signature PNG** utilisée par les modèles ;
  - Gestion des utilisateurs : comptes, mot de passe, actif, fonctions, jeux de privilèges, navigateur des droits ;
  - ouverture de session, changement de mot de passe, reprise de session ;
  - application des 66 droits dans les écrans ;
  - assistant « Configurer un collaborateur » ;
  - Aide : manuel PDF, À propos.
- *Lots* :
  1. Paramètres système.
  2. Préférences.
  3. Utilisateurs, fonctions, privilèges.
  4. Session et mot de passe (serveur).
  5. Application des droits.
  6. Assistant et Aide.
- *Décision* : D6 (authentification).

**CH-09 : Impressions au nouveau format (`.dpdoc`) des modules de base** (P2, L)

- *Éléments* :
  - `SelectTemplateDialog` (choix du modèle dans le jeu de l'affaire, puis jeu 0), paramètres d'impression et favoris communs ;
  - Heures : 8 types, dont `timeWeeklyJournal` ; Heures disponibles, Solde du temps disponible ;
  - Liste des notes de frais, Liste des affaires, Liste des adresses, Intervenants ;
  - Controlling : Journal des heures, Rapport heures - facturation - coût de revient, Analyse détaillée, Rapport des frais, Récapitulatif des frais, « Composer le rapport », « Grouper les heures / les coûts » ;
  - Tâches : 2 types (revenir sur le choix de spec_7 § 6.5) ;
  - « [Ancien document] » du Management et du Reporting (17 anciens types `management*`).
- *Lots* :
  1. Socle et choix du modèle.
  2. Heures et disponibilité.
  3. Frais, affaires, adresses, intervenants.
  4. Controlling.
  5. Tâches.
  6. Anciens documents du Management.

**CH-10 : Fonctions transverses et conformité de navigation** (P3, M)

- *Éléments* :
  - Export des données (4 exports CSV, verrou `lockExportAllAddresses`) ; Importer les modèles ;
  - Veille (accès rapide Adresses et Heures depuis une fenêtre de document Bâtiment) ;
  - synchronisation d'adresse d'entreprise (Bâtiment ↔ carnet) ;
  - protection des documents Bâtiment (`areBauadDocsLocked`) et déverrouillage (droit) ;
  - barre des modules : masquer, afficher, tout ouvrir, tout fermer ;
  - conformité des libellés et de l'ordre : « Tous les collaborateurs » en 2e, « Mes devis », « Offres d'honoraires » ;
  - Administrateur sous « Réglages » ;
  - « Changer le style de police de tous les modèles » (anciens modèles).
- *Lots* :
  1. Exports et import des modèles.
  2. Veille.
  3. Synchronisation d'adresses, protection, déverrouillage.
  4. Navigation et libellés.
- *Décision* : D9 (export iOS).

**CH-11 : Honoraires et facturation, lot 7 de spec_9** (P4, L)

- *Éléments* :
  - Management ▸ Contrats honoraires (7 catégories, 6 documents) ;
  - Management ▸ Factures (6 catégories, jour de référence, 3 documents) ;
  - `.dpdoc` des jeux 1 et 2 : Offre d'honoraires, Contrat d'honoraires, Facture ;
  - PDF stockés ;
  - options QR : Nouveau fichier PDF, Ajouter à la fin de la facture, Afficher le PDF ;
  - fusion facture + QR + annexes ; pièces jointes du Controlling ;
  - paramètres de l'ancien document (`TEMPLATEPROPERTIES`) ;
  - « Importer des fichiers PDF du calcul » ;
  - libellé « Offres d'honoraires » ;
  - anciens documents Management `managementProjectContract*` et `managementInvoice*`.
- *Lots* :
  1. Management Contrats.
  2. Management Factures.
  3. `.dpdoc` honoraires et facture.
  4. PDF, QR et fusion (après CH-03).
  5. Paramètres de l'ancien document et imports.
- *Décision* : **D2**.

**CH-12 : Modèles documents : polices, styles, pages, étiquettes** (P4, L)

- *Éléments* :
  - Polices (liste, import TTF/TTC, vérifier, informations ; embarquées dans les PDF) ;
  - Styles de textes (jeux de 10 styles, noms de police) ;
  - Styles de tableaux (simple, groupé, CAN ; réinitialiser) ;
  - Modèles de pages (format, marges, éléments de bord, logo, variables, 1re page ou toutes) ;
  - Modèles d'étiquettes `.dpdoc`.
- *Lots* :
  1. Polices.
  2. Styles de textes.
  3. Styles de tableaux.
  4. Modèles de pages.
  5. Modèles d'étiquettes.

**CH-13 : Documents d'affaire, messages brefs, fichiers externes** (P4, L)

- *Éléments* :
  - Messages brefs : lettres sur les anciens modèles `note` (20), destinataires, annexes, autres indications, mention au-dessus de l'adresse, dupliquer, rechercher ;
  - Documents d'affaire : nouveau document sur le modèle `projectDocument`, champs figés, plusieurs destinataires, « Terminé », PDF, partager, cacheter et confirmer l'envoi, courriel ;
  - document Note ;
  - Fichiers : lier un fichier, nouveau depuis un modèle externe, versions, dossiers, fichiers supprimés, table des matières d'archivage ;
  - Administrateur : Modèles externes, Rubriques, Nomenclature des documents externes ;
  - Réglages ▸ Emplacements.
- *Lots* :
  1. Messages brefs.
  2. Documents et Note.
  3. PDF, partage, sceau (après CH-03).
  4. Fichiers et catégories d'administration.
  5. Génération `.docx`.
- *Décisions* : D3, D11.

**CH-14 : Modèles documents : éditeur de modèles et d'états** (P5, XL)

- *Éléments* :
  - `TemplatesFrame` complet : groupes général et affaire, 25 catégories, 103 types, langues ; copier, restaurer depuis l'original, importer, remplacer l'original ;
  - éditeur d'états : sections, modèle de page, préférences du document ;
  - éléments de contenu : blocs, texte multiligne, titre, listes à 2, 3 ou 4 colonnes, image, ligne, saut de page ;
  - champs : texte, modules de texte, champs de la base, signature, éléments de bord éditables ;
  - tableaux et colonnes ; images du modèle ; aperçu ;
  - intégration du choix du modèle.
- *Lots* : 7, dans l'ordre des éléments.
- *Décision* : **D7**.

**CH-15 : Séances et procès-verbaux** (P5, L)

- *Éléments* :
  - genres de séances de l'affaire ; séries de séances ;
  - séances : nouvelle, dupliquer ; participants avec rôles (animation, présent, distribution, auteur) ;
  - points sur 1 à 3 niveaux : catégories Information, Décision, Point ouvert, Tâche (vers les tâches), responsable, échéance, renuméroter, classer, presse-papier ;
  - documents Convocation, Procès-verbal (table des matières, annexe) et Rapport, avec leurs préférences ;
  - invitation par courriel, copie des courriels ; recherche dans les points de la série.
- *Lots* :
  1. Genres, séries, séances, participants.
  2. Points et lien vers les tâches.
  3. Documents.
  4. Courriel et recherche.
  5. Passerelle éventuelle avec le PV de Facturation.html.
- *Décision* : **D1**.

**CH-16 : Liste des plans et liste de distribution** (P5, L)

- *Éléments* :
  - nomenclature de l'affaire : règles, valeurs, types, groupes, attributs (le n° de plan est généré) ;
  - liste des plans : versions et index, filtre des versions, « Publié » ;
  - destinataires, liste de distribution, marquer comme envoyé, export ;
  - livraison : sélection, bulletin, courriel ; afficher le dossier ;
  - 4 documents et favoris d'impression.
- *Lots* :
  1. Nomenclature.
  2. Plans et versions.
  3. Destinataires et distribution.
  4. Livraison.
  5. Documents.
- *Décision* : **D3**.

---

## 13. Chantiers en cours (statut `en_cours`, non intégrés)

| Id | Titre | Contenu restant | État au 30.09, 08 h 30 | Licence / usage | Taille |
|---|---|---|---|---|---|
| EC-1 | Soumission IfA 18, lots 2 à 4 (spec_11) | 20 nœuds grisés ; COMPARATIF BREF (lot 2) ; descriptif libre (lot 3a) ; COMPARATIF détaillé, CONTRAT, « Créer un contrat » (lot 3b) ; documents et PDF, Présentation, historique, SIA 451, `devisDocument`, `devisPriceComparisonDesc`, `devisWorkPreparationLetter`, création depuis l'eCCC (lot 4) ; Administrateur ▸ Comparaison des offres ; transfert vers le CC ; domaine Soumissionnaires (menus, `projectTendererList`, import d'une autre affaire) | Lot 2 écrit (63 tests, en relecture) ; lot 3a écrit (78 tests, en relecture) ; lots 3b et 4 non commencés | DELTAdevis ✘ ; 0 document au bureau ; pas de CAN | XL |
| EC-2 | eCCC-Bâtiment, lots 2 à 4 (spec_12) | QUANTITES REFERENTIELLES, CHIFFRES CLEFS, import CSV, import d'un calcul d'une affaire, Importer les présentations (lot 2) ; APERCU, propositions CFC, valeurs référentielles, CALCUL DES RESULTATS (lot 3) ; impressions `costPlanningDocument`, « Créer un devis selon le CFC », « Créer un descriptif », Données de l'affaire, fichiers, verrou, SIA 451 (lot 4) | Lot 2 non commencé ; lot 3 en rétro-ingénierie, sans code ; lot 4 non commencé | DELTAeBKP ✔ + CRB ; 13 documents depuis 11.2025 | XL |

Deux choix du lot 1 de l'eCCC attendent la validation de Paulo : `CP_EVENTUELLE_EXCLUE` et la copie de la structure eCCC (niveaux 1 à 3) d'une autre affaire (D13).

---

## 14. Non reproductible ou sans objet

**Contenu sous licence CRB** : non reproductible. Le bureau n'a ni licence CAN, ni DELTAdevis, ni catalogue `DELTAcrb*`.
- Catalogue CAN (NPK) : navigateur, « Indications générales », textes indicatifs, normes et conditions générales du paragraphe 000, corrections CRB, préférences du catalogue, positions CAN dans le calcul eCCC (K13).
- Traduction d'un document par le catalogue (M04) ; conversion d'un descriptif d'une édition CAN à l'autre (M51, `MapNpkChapterDialog`) ; conversion IfA 92 vers IfA 18 (sans objet : aucun document ancien).
- Produits PRD (prd.crb.ch), éco-devis, CRBonline (téléchargement des catalogues, `DownloadNpk`, `DownloadBKP`), certificats et copyright CRB.
- Textes d'information CRB des éléments eCCC, déjà volontairement non repris ; données « eBKP gate ».
- **Plans comptables CFC et eCCC** : leur contenu est CRB. On peut les consulter et les éditer seulement sur la copie qui existe dans la base du bureau. Jamais de reproduction dans le code, le dépôt git ou les cahiers.

**Services externes** : non reproductibles ou sans objet.
- Licences CRB (gestion, mise à jour, postes, activation en ligne).
- Validation en ligne SIATEST (siatest.crb.ch) ; envoi SFTP vers le CRB (des identifiants y sont codés en dur ; ils ne sont pas repris).
- Serveur de licences DELTAproject (prendre ou rendre une licence de module), contrat de licence (EULA).
- Mises à jour en ligne, téléchargement de modèles depuis le serveur de l'éditeur, page support du distributeur, rapport d'erreur au support.
- Export iOS pour l'application mobile DELTAproject : aucune application cible (D9).
- Messagerie Outlook / AppleScript avec pièce jointe : impossible depuis le navigateur seul (D8).
- Annuaire tel.search.ch / local.ch et Google Maps : reproductibles seulement comme **liens** (CH-04), sans intégration.

**Sans objet** (architecture DeltaSub) :
- type de connexion, maintenance de la base Derby, emplacement de `DELTAprojectFiles`, emplacements par défaut ;
- entrées [Dev] : éditeur de libellés, purge, décalage des saisies ;
- « Configurer la répartition des frais par éléments » (classe supprimée en 16.05) ;
- les 127 classes orphelines de l'annexe C de `inv_strings.md` ;
- les en-têtes de menu CONTRATS, OFFRES, MANDATS, RESSOURCES : vestiges sans module, rien à reproduire.

**Non prévu, sauf avis contraire** :
- Soumission ancien format (`devis.*`, 3 528 libellés) : aucun document au bureau, et le format dépend du CAN (D6b).
- Import ArchiCAD / IFC de l'eCCC : format externe lourd, aucun usage constaté (D10).

---

## 15. Décisions à soumettre à Paulo

| # | Question | Contexte | Proposition |
|---|---|---|---|
| D1 | **Séances et PV** : reproduire le domaine Deltaproject dans DeltaSub (CH-15) ou garder le module PV de Facturation.html ? | 0 séance dans Deltaproject ; `Facturation.html` a un module PV (`sa_pv_data`) ; règle : ne jamais fusionner les deux apps | Garder le PV de Facturation.html ; CH-15 seulement sur demande |
| D2 | **Management ▸ Contrats honoraires et Factures, lot 7 honoraires** : les faire dans DeltaSub ? | spec_8 : hors périmètre (« la facturation vit dans Facturation.html ») ; spec_9 : lots 0 à 6 livrés dans DeltaSub, lot 7 prévu ; pas de licence au bureau | Trancher une fois pour toutes où vit la facturation, puis faire CH-11 ou le retirer |
| D3 | Domaines jamais utilisés (Documents, Messages brefs, Fichiers, Liste des plans, Liste de distribution) : reproduction complète ou minimale ? | spec_3 : « seulement sur demande » ; 0 à 3 enregistrements au bureau | Placeholders tant que Paulo ne le demande pas ; CH-13 avant CH-16 |
| D4 | Documents du contrôle des coûts : rendu `.dpdoc` fidèle (jeux du bureau) ou anciens modèles DESIGN `projectCostcontrol*` ? | Le bureau a les deux ; 719 `.dpdoc` enregistrés ; anciens XML modifiés jusqu'au 16.09.2026 | `.dpdoc` en principal, ancien modèle en repli, comme `tplOr` |
| D5 | Domaine « Liste d'adresses » (mort dans 16.05) : le garder ? Ajouter « Entrepreneurs » ? | `setMenuTable` n'ajoute jamais `contacts` | Remplacer par Entrepreneurs ; garder la liste d'adresses comme impression du domaine Intervenants |
| D6 | Authentification et droits : mots de passe et 66 droits appliqués dans DeltaSub ? | Réseau local seulement ; aujourd'hui « Qui utilise ce poste ? » sans mot de passe | Session simple côté serveur et droits en lecture seule d'abord (CH-08) |
| D6b | Soumission ancien format : confirmer l'abandon | 0 document, format dépendant du CAN | Ne pas reproduire |
| D7 | Éditeur de modèles complet (XL) ou consultation et retouches ciblées ? | Retouches ponctuelles des modèles CoCo, heures et frais entre 2023 et 2026 | Faire CH-12 ; décider CH-14 après usage |
| D8 | Courriel avec pièce jointe PDF | Le navigateur ne sait faire que `mailto` sans pièce jointe | Envoi par le serveur du Mac Studio (osascript vers Mail) ou téléchargement puis `mailto` |
| D9 | Export iOS | Aucune application cible | Sans objet |
| D10 | Import ArchiCAD / IFC de l'eCCC | Aucun usage constaté | Ne pas reproduire pour l'instant |
| D11 | Modèles externes Word (`.docx` remplis par champs) | 2 modèles, masqués au bureau | Seulement si le domaine Fichiers est réactivé |
| D12 | Reprise des fichiers existants de `DELTAprojectFiles` dans le dépôt DeltaSub | 1,70 Go ; 17 226 versions de devis ; 897 archives CoCo ; 380 PDF | Reprendre les PDF et l'état courant ; l'historique en lecture seule, sur demande |
| D13 | eCCC lot 1 : `CP_EVENTUELLE_EXCLUE` et copie de la structure d'une autre affaire | En attente depuis le lot 1 | À valider avant le lot 2 |
| D14 | Accord pour la SIA 451 de la Soumission | Réservé par spec_11 | Seulement avec le lot 4 |
| D15 | Ordre des chantiers | Proposé ici : CH-01, CH-02, puis CH-03 / CH-09 / CH-04 / CH-05 / CH-06 / CH-07, puis CH-08 / CH-10, puis le reste | À valider |

---

## 16. Corrections de la critique

*Relecture critique faite le 30.09.2026, en lecture seule, sur `DeltaSub.html` au commit `784d131` (9 874 lignes), sur le bytecode de Deltaproject 16.05 et sur la copie de la base du bureau. **Les corrections de cette section priment sur les § 1 à 15.***

### 16.1 Méthode

- **Énumérations reparcourues dans le bytecode** :
  - `Modules$Module` : 50 modules ;
  - `project.MenuTableModel$MenuItem` : 23 valeurs, dont `contacts`, que `ProjectFrame` n'ajoute jamais ;
  - `AdminDialog$Menu` : 21 catégories ;
  - `app.doc.Templates$Category` : 25 catégories ; `$DocumentType` : 103 types ;
  - `AppForm` : les libellés de la barre de menus ;
  - `ProjectDefinitionFrame` : les 15 dialogues de configuration qu'il ouvre.

  Les totaux du § 0 et des matrices A, B, D, E et I sont exacts.
- **Paquets à interface** :
  - 993 classes `Frame`, `Dialog`, `Wizard`, `Popup`, `Browser`, `Viewer` et `Panel` dans `DELTAproject.jar` et `DELTAbauad.jar`, plus 86 dans `doc.jar`, `app.jar` et `db.jar`, comparées aux 6 recensements ;
  - seules 30 fenêtres surgissantes (éditeurs de cellule) n'y figurent nulle part ;
  - 58 `Frame` et 538 `Dialog` ne sont pas nommés dans la synthèse. Je les ai triés à la main : ce sont des sous-fenêtres des arbres Bâtiment, des catégories du Management ou des dialogues d'édition de domaines présents. Ce tri a fait apparaître les 8 éléments du § 16.2.
- **Vérification des statuts dans `DeltaSub.html`** : toutes les entrées « Absent » des matrices, plus 30 entrées « Présent » ou « Partiel » (§ 16.3).
- **Usage** : tables `PROJECTCOSTCATEGORYGROUP`, `PROJECTCOST`, `PROJECTROOM` et `PROJECTUSEZONE` de la base du bureau, et contenu de `DELTAprojectFiles` (aucun dossier de signatures).

### 16.2 Éléments de l'original absents de la matrice (ajoutés)

| # | Élément Deltaproject | Classe ou preuve | Usage au bureau | DeltaSub | Chantier |
|---|---|---|---|---|---|
| A1 | Gestion ▸ « Configurer la subdivision par locaux » | `ProjectRoomsDialog`, droit `projectRooms`, ouvert par `ProjectDefinitionFrame` | `PROJECTROOM` : 1 ligne (essai) | **Absent** : aucune occurrence de `projectroom` ; seule « ouvrages et localisations » existe (l. 1360). Le § 9.2 le disait présent : c'est faux | CH-05 |
| A2 | Adresses ▸ « Liste d'adresses par entité » | `ContactListDialog`, `AddressListFrame.openContactListByContactOwner` | n/m | Absent. Seule « Liste d'adresses par CFC » existe (l. 712 et 1514) | CH-04 |
| A3 | Controlling ▸ grouper les **frais** | `project.cost.CostSummary*` | n/m | Absent : le regroupement n'existe que pour les heures (l. 1645) | CH-09 |
| A4 | Soumission ▸ import interne et catalogue « Perso » : Importer un descriptif, un paragraphe, le chapitre des conditions générales | `devis18.devisimport.*` (`DevisBrowserDialog`, `ChapterBrowserDialog`, `SectionBrowserDialog`, `DevisPreconditionDialog`) ; spec_11 § 7.15, lot 3.6 | Sans licence | Absent (lot 3b) | EC-1 |
| A5 | Soumission : MÉTRÉ, OFFRE, DESCRIPTIF TYPE, ESTIMATIF ; transfert détaillé vers le contrôle des coûts ; Paramètres utilisateur ; anciens modèles `projectDevis*` | spec_11, lots 3.5, 3.6, 4.2 et 4.3 | Sans licence | Absent (lots 3b et 4) | EC-1 |
| A6 | Planification RH : points ouverts de spec_10 § 10 (n° 2 : libellé ou formule de l'écart de l'Analyse 6 ; n° 14 : bandeau « aucune planification ») ; export PNG des diagrammes | spec_10 § 10 et liste « Basse priorité » | Sans licence | Absent | CH-10 |
| A7 | Anciens modèles ▸ « Changer le style de police de tous les modèles » | `form.ChangeFontDialog` | n/m | **Absent**, vérifié (aucune occurrence) ; le § 6.3 le laissait « à vérifier » | CH-10 |
| A8 | Intervenants ▸ « Rôle secondaire » (choix de la fonction parmi les valeurs déjà saisies) | `ProjectMemberMinorRolesDialog` | n/m | Partiel : le champ « Fonction » (`PROJECTROLE`) est libre, sans navigateur | CH-05 |

**Précision.** « Attribuer les collaborateurs d'affaire » est `ProjectTeamDialog` filtré sur le rôle d'équipe `staff` (bytecode de `ProjectDefinitionFrame`). C'est une variante de « Attribuer les intervenants », qui existe déjà : taille S.

**Rien d'autre ne manque** dans la matrice :
- les 50 modules ;
- les 22 domaines actifs et le domaine mort ;
- les 21 catégories de l'Administrateur ;
- les 25 catégories et 103 types de modèles ;
- les entrées de la barre de menus ;
- les 15 commandes de configuration de `ProjectDefinitionFrame`.

### 16.3 Vérification des statuts dans `DeltaSub.html`

**Statuts corrigés (10)**

| # | Élément (section d'origine) | Statut de l'inventaire | Preuve dans `DeltaSub.html` | Statut corrigé |
|---|---|---|---|---|
| C1 | Valider les courriels, `CheckEmailListDialog` (§ 8, § 9.1, CH-04) | Absent | `mailList`, l. 736-744 : dialogue « Valider les courriels », séparateur « Virgule (Standard) » ou « Point-virgule (Outlook) », liste des contacts sans courriel, copie dans le presse-papier | **Présent** ; retiré de CH-04 |
| C2 | « Grouper les heures / les coûts » (§ 9.3, CH-09) | Absent | `ctlGroup`, l. 1668-1680, et menu l. 1645 : les heures se groupent par Activités, Phases, Phases et activités, Collaborateur ou Ouvrage, avec les budgets | **Partiel** : heures présentes, frais absents (A3) |
| C3 | Subdivisions « par ouvrages et par locaux » (§ 9.2, parmi les présents) | Présent | l. 1360 : seule « Configurer la subdivision par ouvrages et localisations » ; aucune occurrence de `projectroom` | Ouvrages et localisations : **présent** ; locaux : **absent** (A1) |
| C4 | Note d'expédition, `MailingInfoDialog` (§ 8) | Absent (2 mentions en texte) | `svDlgMailing`, l. 9687-9691, utilisé par les documents et lettres de la Soumission (l. 9810, 9815, 9834) | **Partiel** : présent dans la Soumission, absent du contrôle des coûts et des autres documents |
| C5 | Synchronisation de l'adresse d'entreprise, `AddrSynchDialog` (§ 8, CH-10) | Absent | `svDlgAddrSynch`, l. 9757-9760 : « Actualiser l'adresse » des soumissionnaires | **Partiel** : présent dans la Soumission (`devis.AddrSynchDialog`), absent du contrôle des coûts (`costcontrol.AddrSynchDialog`) |
| C6 | Garanties de l'arrêté de compte (§ 9.7, N19-N20) | « document et garanties absents » | `ccArrete`, l. 3198-3206 : statut de l'arrêté ; type, montant, début et échéance de la garantie (boutons +2 et +5 ans) | Saisie de la garantie **présente**. Restent absents : les déductions complètes de `DeductionDialog`, « Comptabiliser le paiement final » et les documents Arrêté de compte et Liste des garanties |
| C7 | Editer le filtre, `ProjectFilterDialog` (§ 9.2, CH-05) | Partiel (menu simple) | Le dialogue existe déjà : `mgPFmenu` et `mgPFdialog`, l. 2093-2099 (Management ; Planification RH, l. 9024). Gestion n'a qu'un menu de statuts | Partiel confirmé. Le lot de CH-05 se réduit à brancher `mgPFdialog` sur Gestion et sur les listes d'affaires : taille S |
| C8 | Renchérissement (§ 9.7, N10) | Absent (P3) | Mutation « Renchérissement » et paiement « de renchérissement » saisis à la main (l. 2877-2878, 2909, 3001-3016) | Renchérissement **manuel présent**. Seul le calcul par l'indice ICC manque, comme le facteur d'index du DG |
| C9 | « Changer le style de police de tous les modèles » (§ 6.3) | À vérifier | Aucune occurrence | **Absent** (A7) |
| C10 | Configurer les frais (D11, CH-05) | Absent | Aucune écriture de `projectcostcategory` ni de `projectcostcategorygroup` dans tout le fichier ; la saisie des frais (l. 1417-1420) ne propose que les groupes de l'affaire | Absent confirmé, **et bloquant** : voir le § 16.4 |

**Statuts « absent » confirmés.** Aucune occurrence, ou seulement un lien, un texte ou une entrée grisée :
- **Modules et domaines** :
  - Management ▸ Contrats honoraires et Management ▸ Factures ;
  - Modèles de pages, Modèles d'étiquettes `.dpdoc`, Styles de textes, Styles de tableaux, Polices. Les collections `textstyleset` et `rowstyleset` ne servent qu'au rendu (l. 9318-9320) ;
  - domaines Entrepreneurs et Fichiers.
- **Administrateur** : Plans comptables, Genres d'affaires, Séances, Types de plans, Groupes de conditions, Modèles externes, Rubriques et Nomenclature.
- **Menus et fonctions transverses** :
  - imports : vCard (seul `ivCard` existe, qui est la fiche d'adresse du débiteur, l. 5680), CSV, `.archfile`, Importer les modèles ;
  - navigation et session : masquage de la barre des modules, Configurer un collaborateur, Gestion des utilisateurs (l. 5254 : simple sélecteur `ctPickUser`), mot de passe ;
  - réglages et services : Paramètres système, Préférences, Export des données, Aide, Veille ;
  - documents : fusion de PDF, `/api/file`, `SelectTemplateDialog` (jeu imposé, l. 2011).
- **Adresses et collaborateurs** :
  - bloc-notes ;
  - étiquettes imprimées ;
  - Editer des adresses ;
  - Fiche de l'adresse, Liste des banques, Fiche du collaborateur ;
  - Participation aux affaires ;
  - annuaire et Google Maps.
- **Affaires** :
  - Importer les heures ;
  - importer les activités et les tarifs d'une autre affaire (seul « Importer du dossier standard » existe, l. 1251 et 1284) ;
  - Importer un plan comptable ;
  - Composer le rapport ;
  - Importer des fichiers PDF du calcul.
- **Devis général** :
  - Indexer, Modifier le taux de TVA, Supprimer les ouvrages à 0, statut « non définitif » ;
  - Fixer le coût et Arrondir : les occurrences trouvées sont dans l'eCCC (l. 4381-4581) ;
  - saut de page, Dupliquer et modifier la subdivision, Devis descriptif, À la dernière version ;
  - `.deltakv` et FastTrack.
- **Contrôle des coûts** :
  - titres de colonnes ;
  - comptes du maître d'ouvrage : lecture seule (l. 4950-4957) ;
  - facteur d'index et calcul du prorata : il n'existe qu'une condition « Prorata (%) » (l. 2738) ;
  - Mutations 2, montant plafonné ;
  - documents Liste des mutations, Liste des garanties et Rapport de paiements.
- **eCCC** : ArchiCAD / IFC.

**Statuts « présent » ou « partiel » confirmés (30)** :
- **Adresses et collaborateurs** :
  - les 6 vues Adresses ;
  - groupes intelligents et statiques (l. 853-869) ;
  - verrouillage des heures (l. 1106-1107) ;
  - « Taguer les heures » (l. 7454-7456) ;
  - report du solde de vacances (l. 1006-1014) ;
  - Disponibilité.
- **Tâches et Factures** : les 3 vues Tâches ; les 5 catégories du Contrôle de factures.
- **Management** : les 10 catégories de Management ▸ Collaborateurs (l. 2136-2137) ; Controlling, Planification RH, Reporting et Maître d'ouvrage.
- **Affaires** :
  - « Importer les intervenants d'une affaire existante » (l. 1318-1325) ;
  - « Attribuer les activités aux collaborateurs » (l. 1358) ;
  - Configurer les activités, les tarifs et les phases (l. 1359) ;
  - « Définir les modèles » (l. 1361-1381 ; groupe de formulaires seulement).
- **Devis général** : Mettre tous les montants à zéro, montant soumis, remarques préliminaires (« Informations pour le devis »), export CSV.
- **Fonctions transverses** : « Transférer en facturation » ; courriel `mailto`.
- **Anciens modèles** : groupes de modèles et copie (l. 4711-4737).
- **Contrôle des coûts** :
  - menu Présentation : choix parmi les présentations enregistrées (l. 2916), sans gestion ;
  - menu Documents : Ordre et Bon seulement (l. 3192) ;
  - Blocs de texte : partiel, seul `planningText` s'édite (l. 8200-8208).
- **eCCC** : SIA 451 grisé (l. 4167).
- **Structures générales** :
  - domaines placeholders (l. 1560-1563) ;
  - `DOMAINS` : 21 entrées (l. 1476) ;
  - `NAV` : 44 entrées (l. 337-347) ;
  - Administrateur : 12 catégories (l. 1931).

**Légende précisée.**
- **« Présent »**, dans les matrices A et B, signifie : écran et fonctions principales reproduits. 16 des 37 modules présents gardent des écarts secondaires (colonne « Écart restant »), le plus souvent le document au nouveau format. Ces écarts sont rattachés à un chantier. Le bilan chiffré du § 11 reste valable.
- **Administrateur** : Tarifs et Jours fériés ne s'éditent qu'en français, comme les 5 catégories partielles. L'édition multilingue est un élément transversal de CH-06.

### 16.4 Chantiers : cohérence, taille et priorité

1. **Nouveau CH-17 « Configurer les frais de l'affaire » (priorité 1, S)**, retiré de CH-05.
   - **Blocage** : DeltaSub ne crée jamais de groupes ni de genres de frais d'affaire. La création d'une affaire (l. 1172-1180) ne les copie pas, et Deltaproject ne les copie pas non plus. Or la saisie des frais ne propose que ceux de l'affaire.
   - **Données du bureau** :
     - 44 des 111 affaires n'ont aucun groupe de frais, dont 7 des 14 plus récentes ;
     - les affaires récentes qui en ont reçoivent 3 ou 4 groupes, configurés à la main ;
     - une affaire créée dans DeltaSub ne peut donc recevoir aucune note de frais, alors que le module sert beaucoup : 635 frais, environ 100 par an.
   - **Contenu** : `ProjectCostCategoriesDialog`, `ProjectCostCategoryGroupDialog` et `ProjectCostCategoryDialog`, c'est-à-dire :
     - groupes et genres de frais, avec unité, prix, prix à facturer et prévision ;
     - « Importer du dossier standard » et « Importer d'une affaire existante » ;
     - message « seulement si le statut de l'affaire est 'Configuration' ».

     Un seul lot, sur le modèle de `importStdActivities`.
2. **CH-07 est découpé en deux.** Le chantier mêlait des éléments de priorité 2, utilisés intensivement, et 3 lots d'options jamais utilisées au bureau.
   - **CH-07 (priorité 2, M, 3 lots)** : configuration, comptes et titres ; présentations, Affichage et filtres ; domaine d'affaire et historique.
   - **Nouveau CH-18 (priorité 5, M, 3 lots)** : Mutations 2, renchérissement par l'indice ICC, facteur d'index du DG, prorata, centres libres, montant plafonné, métré, équations, sections DESCRIPTIF et HONORAIRES avec leurs documents. À ne faire que sur demande (D17).
3. **Chevauchement du socle d'impression supprimé.** Le socle `.dpdoc` pour les jeux 0, 1 et 2 apparaissait trois fois : CH-01 lot 1, CH-09 lot 1 et CH-11 lot 3.
   - Il est défini **une seule fois, au lot 1 de CH-01**, qui est de priorité 1. Ce lot comprend `SelectTemplateDialog`, le choix du modèle dans le jeu de l'affaire puis dans le jeu 0.
   - CH-09 et CH-11 en dépendent. Le lot 1 de CH-09 se réduit aux paramètres et favoris d'impression communs.
4. **CH-06 passe de la priorité 2 à la priorité 3.**
   - Ce sont des référentiels livrés et peu modifiés, et aucun écran intensif n'attend ce chantier.
   - Seul le lot « Plans comptables » sert CH-05 (lot 3) : il peut être avancé avec lui.
   - Le navigateur de conditions du lot 2 de la Soumission lit déjà `invoicecondition*` sans l'éditeur.
5. **CH-04** : « Valider les courriels » est retiré (présent) ; « Liste d'adresses par entité » est ajoutée.
6. **CH-05** :
   - retirés : « Configurer les frais » (passe dans CH-17) ;
   - ajoutés : subdivision par locaux, navigateur « Rôle secondaire », « Attribuer les collaborateurs d'affaire » (variante filtrée, S) ;
   - réduit : Editer le filtre se limite à réutiliser `mgPFdialog`.

   La taille reste L.
7. **CH-09** : « Grouper les heures » est retiré (présent) ; « Grouper les coûts » et « Composer le rapport » restent.
8. **CH-10** :
   - la synchronisation d'adresse ne concerne plus que le contrôle des coûts (celle de la Soumission existe) ;
   - « Changer le style de police de tous les modèles » est confirmé absent ;
   - ajoutés : les reliquats de la Planification RH (spec_10 § 10, n° 2 et n° 14) et l'export PNG des diagrammes.
9. **CH-01** : la saisie de la garantie existe. Il reste les déductions de `DeductionDialog`, le paiement final et les documents. La note d'expédition doit être généralisée depuis la Soumission (`svDlgMailing`).
10. **EC-1** :
    - ajoutés : A4, A5 et « Créer un descriptif depuis l'eCCC » (spec_11 lot 4.4, qui était classé dans EC-2) ;
    - priorité : intégrer d'abord les lots 2 et 3a, déjà écrits. Les lots 3b et 4 relèvent de la priorité 4 par l'usage (sans licence, 0 document).
11. **EC-2** :
    - ajoutés : les arrondis spéciaux d'impression, non livrés au lot 1 ;
    - « Créer un descriptif » reste une dépendance d'EC-1.

**Ordre de priorité révisé**

| Priorité | Chantiers |
|---|---|
| 1 | **CH-17** Configurer les frais (S, bloquant) ; CH-01 Contrôle des coûts : documents (L), socle d'impression en lot 1 ; CH-02 Devis général (L) |
| 2 | CH-03 Fichiers et PDF (L) ; CH-04 Adresses (L) ; CH-05 Gestion de l'affaire (L) ; CH-07 Contrôle des coûts : paramètres (M) ; CH-09 Impressions des modules de base (L) ; EC-2 eCCC lots 2 à 4 (XL) |
| 3 | CH-06 Administrateur (M) ; CH-08 Réglages, session et droits (L) ; CH-10 Fonctions transverses (M) ; EC-1 Soumission (XL ; lots 2 et 3a à intégrer d'abord) |
| 4 | CH-11 Honoraires et facturation, lot 7 (L) ; CH-12 Polices, styles, pages, étiquettes (L) ; CH-13 Documents, messages brefs, fichiers (L) |
| 5 | CH-14 Éditeur de modèles (XL) ; CH-15 Séances (L) ; CH-16 Plans (L) ; **CH-18** Options avancées du contrôle des coûts (M) |

**Décisions ajoutées**

| # | Question | Proposition |
|---|---|---|
| D16 | CH-17 : copier automatiquement les frais standard à la création d'une affaire dans DeltaSub ? Deltaproject ne le fait pas. | Rester fidèle : import manuel « du dossier standard ». Ajouter un avertissement dans la saisie des frais quand l'affaire n'a aucun groupe de frais. |
| D17 | CH-18 : options avancées du contrôle des coûts, jamais utilisées au bureau | Seulement sur demande |
| D15 (révisée) | Ordre des chantiers | CH-17, CH-01, CH-02 ; puis CH-03, CH-09, CH-04, CH-05, CH-07, EC-2 ; puis CH-06, CH-08, CH-10, EC-1 ; puis le reste |

### 16.5 Fichiers de travail de la critique

Tous sont dans `research/inv/` :
- `_crit_pkgs.txt` : nombre de classes par paquet ;
- `_crit_ui_classes.txt` : les 993 classes d'interface ;
- `_crit_unmentioned.txt` : les 30 fenêtres surgissantes absentes des recensements ;
- `_crit_dlg_missing.txt` : les 538 dialogues non nommés dans la synthèse ;
- `_crit_docui.txt` : les classes d'interface de `doc.jar`, `app.jar` et `db.jar` ;
- `_crit_dbProject.txt` et `_crit_pdf.txt` : désassemblages de `db.Project` et `ProjectDefinitionFrame` ;
- `_crit_ctx.py` : recherche avec contexte dans `DeltaSub.html`.

Rien n'a été modifié dans le dépôt ni dans Deltaproject.

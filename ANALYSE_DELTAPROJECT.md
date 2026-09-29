# Analyse de Deltaproject — en vue de sa reproduction

*Analyse du 29.09.2026, réalisée en lecture seule sur la sauvegarde du 28.09.2026
(`/Volumes/SUBSTANCES/Deltaproject/Backup/2026-09-28 23-00-00`). Rien n'a été
modifié dans l'installation Deltaproject.*

## 1. Ce qu'est Deltaproject

| | |
|---|---|
| Version installée | DELTAproject **V16** (`/Applications/DELTAproject.app`), V13/V14 dans `Ressources/` |
| Technologie | Java 23 + JavaFX/Swing, ~6 000 classes (`DELTAproject.jar` + `DELTAbauad.jar` pour devis / contrôle du coût / planification) |
| Base de données | **Apache Derby** (`DELTAprojectDatabase/DeltaProject`, 43 Mo), 143 tables, accès par serveur Derby partagé |
| Documents lourds | **Objets Java sérialisés** dans `DELTAprojectFiles/Construction/` (devis 1,3 Go avec l'historique, contrôle du coût 165 Mo, planification 14 Mo) |
| Interface | 24 983 libellés en DE / FR / IT / EN (`rsrc/Strings.db`) |
| Documentation | Manuel français de 93 pages (`rsrc/help/manual_fr.pdf`) — sert de cahier des charges |
| Catalogues | CAN / eBKP de la **CRB** sous licence (`crbOnline.jar`, `CRBdata`) |
| Sauvegardes | Automatiques chaque nuit à 23h00 dans `Backup/` (5 jours glissants) |

## 2. Modules, et usage réel au bureau

Classement selon les données réellement présentes dans la base :

| Module (manuel) | Usage au bureau | Données | Déjà reproduit dans l'app Substances |
|---|---|---|---|
| **Heures** (saisie, contrôle, rapports) | ★★★ intensif | 37 622 saisies, ~61 400 h, 2019 → 2026 | Oui : Saisie + Rapport + Import CSV |
| **Adresses** (entités, contacts, propriétés, groupes) | ★★★ | 755 contacts, 727 liens, 608 propriétés | Oui : Navigateur d'adresses |
| **Gestion des affaires** (intervenants, phases, activités, subdivisions) | ★★★ | 111 affaires, 1 324 intervenants, 388 phases, 390 activités, 30 subdivisions | Partiel : registre Admin · Affaires |
| **Devis** (descriptifs CFC / CAN, subdivisions, variantes) | ★★★ | 221 devis (≈ 40–60 / an) | Oui en bonne partie : liste, import, paramètres, catalogue CFC |
| **Contrôle des coûts** (devis attribué, adjudications, mutations, paiements, coût probable) | ★★★ | 115 documents (≈ 20–30 / an), 360 contrats, 100 ordres de paiement | Oui en bonne partie : mutations, paiements, avenants, provisions |
| **Collaborateurs** (taux, temps cible, vacances, verrouillage) | ★★ | 13 collaborateurs (5 actifs), 37 taux, 47 temps cibles | Oui : Admin · Collaborateurs |
| **Planification des coûts** (eBKP, valeurs de référence) | ★ récent | 13 documents (2025–2026) | **Non** |
| **Modèles / DELTAreporting** (documents, arrière-plans, champs) | ★ | 625 modèles de documents, 316 formulaires | Partiel (PDF fidèles propres au bureau) |
| **Soumissions / Comparatif** | ? | 1 soumissionnaire | Non |
| Séances et procès-verbaux | Non utilisé | 0 séance | PV de chantier (squelette) |
| Calcul des honoraires / contrats / factures | Non utilisé | 0 facture, 0 honoraire | Fait par l'app **Facturation** |
| Liste des plans, tâches, planification des ressources | Non utilisé | 0 | — |

## 3. Modèle de données (tables principales)

- **PROJECT** (affaire) : n°, titre, lieu, parcelle, volume, surface, indice de base, statut, 4 contacts (MO…), dossier.
  - PROJECTMEMBER (intervenants) · PROJECTPHASE / PROJECTSUBPHASE (phases SIA) · PROJECTACTIVITY(+GROUP) · SUBPROJECT (subdivisions) · PROJECTRATE · PROJECTCOSTCATEGORY (plan comptable CFC de l'affaire).
- **CONTACT** (entités et personnes) + CONTACTOWNER (appartenance personne ↔ société) + CONTACT_PROPERTY + CONTACTGROUP / CONTACTQUERY (groupes intelligents).
- **STAFF** (collaborateur → CONTACT) + STAFFRATE, STAFFTARGETTIME, TARGETTIME, PUBLICHOLIDAY.
- **TIMELOG** : jour / mois / année, heures de début et de fin, durée, affaire, phase, sous-phase, activité, subdivision, facturable / facturé, vacances.
- **COSTESTIMATEDOCUMENT / COSTCONTROLDOCUMENT / COSTPLANNINGDOCUMENT** : en-têtes (affaire, version, état, date). Le contenu (positions, contrats, mutations, paiements) est dans les fichiers sérialisés `Construction/<affaire>/<document>/…`.
- Référentiels : CATALOG / CATALOGPOS (CFC), EBKPELEMENT, PHASE / SUBPHASE (SIA), BANKACCOUNT, INVOICECONDITION, DOCTEMPLATE, FORMTEMPLATE.

## 4. Points durs pour la reproduction

1. **Volume** : le stockage actuel de l'app (localStorage, ~5–10 Mo au total) ne peut pas contenir l'historique Deltaproject (37 600 heures, 220 devis, 235 contrôles du coût). Il faut passer à **IndexedDB** (centaines de Mo, dans le navigateur) ou stocker sur disque via le serveur local (port 7788).
2. **Multi-utilisateur** : Deltaproject tourne sur un serveur Derby partagé par tout le bureau. L'app Substances est mono-poste (données dans le navigateur, synchronisation par Export / Import). Remplacer Deltaproject au quotidien pour plusieurs collaborateurs demande une **base partagée** (serveur local sur le NAS ou le Mac Studio).
3. **Format des devis et contrôles du coût** : objets Java sérialisés. Ils sont lisibles grâce aux classes de l'app installée (convertisseur `outils_deltaproject/Ser2Json.java`, testé), mais leur structure interne doit être cartographiée classe par classe.
4. **Catalogues CRB (CAN, eBKP)** : contenu sous licence CRB. Il ne peut pas être recopié dans l'app ; seuls les textes déjà utilisés dans les devis du bureau peuvent être repris.
5. **Taille** : ~6 000 classes, 25 000 libellés. Une reproduction complète se fait module par module, en priorité selon l'usage réel (§ 2).

## 5. Outils d'extraction (dans ce dépôt)

`outils_deltaproject/` — code seulement, aucune donnée :
- `jrun.c` : lanceur minimal qui utilise le Java embarqué de DELTAproject.app (aucun Java n'est installé sur le Mac).
- `Dump.java` : schéma + export CSV de toutes les tables Derby (à partir d'une **copie** d'une sauvegarde).
- `Ser2Json.java` : conversion des fichiers sérialisés (devis, contrôle du coût) en JSON.
- `extraire.sh` : enchaîne le tout. La sortie va dans `extraction_deltaproject/` (ignoré par git : données clients).

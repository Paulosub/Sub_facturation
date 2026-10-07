---
name: substances-app-bureau
description: "Développement des apps de bureau de Substances Architectes — Facturation.html, DeltaSub.html et SUBGestion (versions 1, 2, 3 générées par construire.py) : règles du projet, carte des fichiers, recettes pour ajouter ou modifier un module, un écran, une fiche, un menu, et pour produire une nouvelle version. Utiliser ce skill dès qu'une demande touche à l'une de ces apps (modifier, corriger, redessiner, étendre, ajouter un module, « nouvelle version », menu, écran, fiche projet, contrats, factures, heures, devis, Deltaproject…), même si le fichier n'est pas nommé."
---

# Apps de bureau Substances Architectes

Trois familles d'apps HTML autonomes (ouvertes par double-clic dans Chrome, sans serveur), pour Paulo et l'équipe de
Substances Architectes. Interface, code commenté et réponses **en français**.

| Fichier | Rôle | Se modifie… |
|---|---|---|
| `Facturation.html` | contrats d'honoraires SIA, factures, cockpit, PV de chantier, registres Admin — données `localStorage` `sa_*` | à la main (source) |
| `DeltaSub.html` | moteur de gestion, reproduction de Deltaproject : 45 écrans, base IndexedDB « DeltaSub » | à la main (source) |
| `SUBGestion.html` (v1) | Facturation + DeltaSub en cadre | `python3 subgestion/construire.py` |
| `SUBGestion2.html` (v2) | DeltaSub seul, interface violette « NX » | `python3 subgestion2/construire.py` |
| `SUBGestion3.html` (v3, **référence**) | charte Substances, menu à gauche, moteur DeltaSub + Facturation en cadre | `python3 subgestion3/construire.py` |

Les `SUBGestion*.html` sont **générés** : ne jamais les éditer, modifier leurs sources (`subgestionN/*`, `DeltaSub.html`,
`Facturation.html`) puis reconstruire. Une modification de `DeltaSub.html` ou `Facturation.html` se propage à toutes les
versions qui les embarquent : reconstruire chacune.

Détails techniques (API du moteur, globales de Facturation, clés de session, internes de SUBGestion 3) :
`references/architecture.md`. Recettes pas à pas : `references/recettes.md`.

## Règles du bureau (et pourquoi)

1. **Sauvegarder avant toute modification** : copie `<Fichier>_backup_AAAAMMJJ_HHMM.html` (ignorée par git) ; pour une
   refonte de SUBGestion, copier aussi les sources dans `subgestionN/_backup_…/`. Le dossier est sur le NAS et les apps
   tiennent dans un seul fichier : une erreur de remplacement peut tout casser, la copie permet de revenir en arrière.
2. **Ne jamais committer de données clients** (`facturation_data_*.json`, `deltasub/`, `extraction_deltaproject*/`,
   `Sauvegarde *`, PDF réels, `FA26.*`, `24PRC_*`…) : le dépôt GitHub ne transporte que le code.
3. **Les PDF reproduisent exactement les documents papier du bureau** (police AkkuratDoc, filets 0,25 pt…) : ne pas
   « améliorer » typographie ou espacements sans demande explicite.
4. **Ne pas fusionner les fichiers sources** Facturation et DeltaSub : l'assemblage se fait par construction (cadre
   embarqué), ce qui évite les conflits de noms entre ~1250 et ~2050 fonctions globales et leurs feuilles de style.
5. **Confirmations : `chConfirm(message, onYes, opts)`** dans Facturation, `confirmDlg` / `dialog` dans le moteur —
   jamais `confirm()` natif (renvoie `false` silencieusement dans certains contextes).
6. **Garder chaque version** quand Paulo demande « une nouvelle version » : nouveau dossier `subgestionN/`, nouveau fichier
   `SUBGestionN.html`, clés de session propres (sinon deux versions ouvertes dans le même Chrome se rouvrent mutuellement
   sur des écrans qu'elles n'ont pas). Quand il demande de « reprendre » ou « modifier » l'app, modifier la version de
   référence après sauvegarde.
7. **Identité visuelle et fonctionnement uniformes** : toute interface suit la charte Substances (skill `substances-charte`),
   Akkurat pour tous les textes ; tout module (moteur, Facturation, écrans propres) utilise les mêmes boutons (bleu nuit /
   contour noir / rouge), les mêmes fenêtres de confirmation (`sgConfirm`, `dialog`), les mêmes messages (`toast`) et les
   mêmes raccourcis (⌘K, « / », ⌥←/→). Un nouveau module de Facturation se règle dans `subgestion3/fx_theme.css`.

## Déroulé d'une modification

1. Comprendre la demande ; si elle est ambiguë sur un point qui change le résultat (quelle version, garder l'ancienne ?),
   demander — sinon choisir le défaut raisonnable et le dire.
2. Sauvegarde (règle 1).
3. Modifier les sources. Remplacements dans de gros fichiers : par script Python avec `assert old in s` (échoue
   bruyamment si la source a changé) plutôt que des `sed` aveugles.
4. Reconstruire (`construire.py` vérifie lui-même ses points d'ancrage et s'arrête s'ils ont bougé).
5. **Vérifier** avec le skill `substances-verification-app` : balayage automatique de tous les écrans, captures, test
   `file://` dans Chrome. Ne jamais toucher aux données du Chrome de Paulo pendant les tests.
6. Documenter : `CLAUDE.md` (architecture, décisions datées) et la mémoire du projet.
7. Résumer à Paulo en français : ce qui change pour lui, ce qui a été testé, les limites — sans jargon inutile.

## Pièges déjà rencontrés

- **Classe CSS `ov`** = voile modal du moteur (`$$('.ov')` détecte une fenêtre ouverte) : ne jamais l'utiliser ailleurs.
  Plus généralement, préfixer les classes de la coquille (`sg-`, `nx-`).
- **Clés de session** : `ds_view` (DeltaSub), `sa_ui_state` (Facturation) sont partagées entre fichiers ouverts dans le
  même Chrome (`file://` = même stockage) : chaque version de SUBGestion remplace ces clés à la construction.
- **`location.reload()`** dans un document écrit dans un cadre (`document.write`) recharge… toute l'app dans le cadre : le
  constructeur le redirige vers la coquille (`parent.sgFxReload`, `parent.sgDsReload`).
- Fonctions du moteur déclarées `function x(){}` = globales réassignables (`go=function…`, `ibtn=…`, `icon=…`) ; les
  `const`/`let` de haut niveau sont visibles par nom depuis un autre script mais pas via `window`.
- Mises en page : la zone de travail dépend du menu → requêtes de conteneur (`@container`), pas de `@media`.
- Polices : Akkurat via `local()` (installée sur les Mac du bureau), jamais embarquée (licence desktop Lineto).

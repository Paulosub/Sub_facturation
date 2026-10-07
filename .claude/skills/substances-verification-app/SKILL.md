---
name: substances-verification-app
description: "Méthode de vérification des apps de bureau de Substances Architectes (SUBGestion, DeltaSub, Facturation) après toute modification — construction et aperçu isolé, base de test, balayage automatique de tous les écrans, captures, test d'ouverture par double-clic dans un vrai Chrome — avec scripts prêts. Utiliser ce skill systématiquement après avoir modifié ou reconstruit l'une de ces apps, avant d'annoncer qu'une modification « fonctionne », et quand Paulo demande de tester, vérifier, contrôler ou « voir si tout marche »."
---

# Vérifier une app de bureau Substances

But : prouver que la modification fonctionne **sans jamais toucher aux données réelles** (le Chrome de Paulo, son
`localStorage`, sa base IndexedDB), puis montrer des preuves (captures, résultats du balayage).

## 1. Construire et préparer l'aperçu

```bash
.claude/skills/substances-verification-app/scripts/construire_et_previsualiser.sh 3     # ou 2, 1
```
Le script reconstruit la version, la copie dans `/tmp/subgestion_apercu/` avec la base de test la plus récente
(`base_test.json.gz`) et rappelle la configuration `subgestion-apercu` (port 7797) à ajouter à `.claude/launch.json`
si elle manque. Puis `preview_start {name:"subgestion-apercu"}` et naviguer vers `http://localhost:7797/SUBGestion3.html`.

L'aperçu a sa propre origine (localhost) : sa base est séparée de celle de Paulo. Pour y charger la base de test :
```js
const b=await (await fetch('/base_test.json.gz')).blob(); await lbImport(new File([b],'base_test.json.gz')); location.reload();
```

## 2. Balayer tous les écrans

Exécuter le contenu de `scripts/verifier_ecrans.js` avec l'outil JavaScript du navigateur (il lance le balayage en
tâche de fond), attendre (~0,5 s par écran), puis lire :
```js
[window.__sgFin, window.__sgRes.length, window.__sgRes.filter(x=>/ERR|NAV |VOILE/.test(x)).join('\n')||'tout OK']
```
Chaque ligne indique si l'écran s'est bien ouvert, son titre, les erreurs JS (page et cadre Facturation) et un voile
de fenêtre resté ouvert. Ne pas lancer deux balayages à la fois, ni recharger pendant un balayage.

## 3. Captures et contrôle visuel

- Taille de bureau : `resize_window` 1280×800 ou 1440×900, puis **remettre `desktop`** à la fin.
- Avec une taille émulée, les clics par coordonnées peuvent être décalés : naviguer par JavaScript (`go('aff-mes')`,
  `go('nx-projet', id)`) plutôt qu'en cliquant.
- Une capture prise juste après une action peut montrer l'état précédent : en reprendre une si le résultat surprend.
- Les messages de console s'accumulent d'une page à l'autre : recharger avant de juger, et ignorer les erreurs
  connues et préexistantes (serveur de sauvegarde 7788 absent, `POST /api/commit` 501 des verrous du moteur).
- Naviguer vers un `.pdf` déclenche un téléchargement : afficher les PDF avec une page pdf.js.

## 4. Test du mode réel (double-clic, `file://`)

```bash
.claude/skills/substances-verification-app/scripts/sonde_chrome.sh SUBGestion3.html
```
Lance Google Chrome sans fenêtre, profil neuf et temporaire, et affiche `SONDE {…}` : erreurs, écran de démarrage
(base vide attendue), police Akkurat disponible, cadre Facturation chargé (nombre de contrats/factures).

## 5. Rendre compte

Résumer en français ce qui a été vérifié (nombre d'écrans, absence d'erreurs, captures montrées), ce qui ne l'a pas
été et pourquoi (ex. données réelles inaccessibles), et les limites. Après les tests, remettre l'aperçu dans un état
neutre (taille `desktop`, écran d'accueil) — Paulo reprend souvent l'aperçu là où il est.

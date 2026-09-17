# Application de facturation — Substances Architectes

Application de facturation et de gestion d'honoraires pour le bureau
Substances Architectes (Paulo, paulo@substances.ch). Interface en français,
montants en CHF, TVA suisse.

## Architecture

- **`Facturation.html`** — TOUTE l'application : une seule page HTML autonome
  (~4 Mo) contenant le CSS, le JavaScript (~400 fonctions) et les gabarits.
  Elle s'ouvre directement dans le navigateur, sans build ni dépendance.
- **Les données ne sont PAS dans le fichier HTML** : elles vivent dans le
  `localStorage` du navigateur, sous des clés préfixées `sa_`
  (`sa_contrats`, `sa_factures5`, `sa_affaires`, `sa_heures`,
  `sa_collaborateurs`, `sa_phases_pct_migrated`, etc.).
- **`fact_backup_server.py`** — petit serveur local (port 7788, 127.0.0.1
  uniquement) qui permet à l'app d'écrire de vraies sauvegardes `.json` sur le
  disque (export/import + sauvegarde automatique), dossier de base :
  « Sauvegarde Facturation » dans ce dossier. Sur le Mac Studio de l'atelier,
  il démarre automatiquement à l'ouverture de session via
  `~/Applications/Serveur Sauvegarde Facturation.app` (élément d'ouverture) ;
  sinon : `python3 fact_backup_server.py` ou `Lancer_serveur_sauvegarde.command`.
  NB : ce dossier est un partage réseau (NAS) — macOS refuse l'accès aux
  processus d'arrière-plan (LaunchAgent impossible, l'app de démarrage doit
  rester en mode visible) et l'aperçu intégré de Claude ne peut pas écrire
  directement dans les dossiers (le bouton 📁 de l'app ne marche que dans un
  vrai Chrome/Edge/Arc/Brave).
- **`serve.py` / `serve_facturation.py`** — petits serveurs HTTP pour servir
  la page localement si besoin.

## Fonctionnalités principales

Onglets : contrats d'honoraires, factures (acomptes, factures finales),
affaires/projets, heures des collaborateurs, récapitulatifs par phases SIA,
export PDF fidèle aux documents papier du bureau (police Akkurat).

## Règles pour travailler sur ce projet

1. **Un seul fichier à modifier** : `Facturation.html`. Avant toute
   modification importante, l'utilisateur (ou un script) crée des copies
   `Facturation_backup_AAAAMMJJ_HHMM.html` — elles sont ignorées par git.
2. **Ne jamais committer de données clients** : les `facturation_data_*.json`,
   les PDF de factures réelles et les fichiers d'affaires (`FA26.*`, `24PRC_*`,
   etc.) sont exclus par `.gitignore` et doivent le rester.
3. **Synchronisation entre machines** : git ne transporte que le code.
   Les données se transfèrent via *Exporter* dans l'app (fichier
   `facturation_data_*.json`) puis *Importer* sur l'autre machine.
4. La mise en page des PDF reproduit exactement les documents du bureau —
   ne pas « améliorer » la typographie ou l'espacement sans demande explicite.
5. Répondre et documenter en français.

## Dépôt GitHub

`git@github.com:Paulosub/facturation.git` — dépôt privé, branche `main`.

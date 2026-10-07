---
name: substances-donnees
description: "Données des apps de bureau de Substances Architectes — où elles vivent (localStorage de Facturation, base IndexedDB du moteur), sauvegarde, export / import, transfert entre machines, reprise des données Deltaproject dans SUBGestion sans perdre les saisies (outils_deltaproject/reprise_subgestion.py), protection des données clients. Utiliser ce skill dès qu'il est question d'importer, exporter, sauvegarder, restaurer, synchroniser, migrer ou reprendre des données (Deltaproject, base, contrats, factures, heures, adresses), ou avant toute opération qui pourrait remplacer ou effacer des données."
---

# Données des apps de bureau

## Principes

- **Une opération qui remplace des données commence par un export.** L'import d'une base (moteur) ou d'un
  `facturation_data_*.json` (Facturation) **remplace** ce qui est dans le navigateur. Faire exporter d'abord, et ne rien
  saisir entre l'export et l'import.
- **Les données réelles sont dans le Chrome de Paulo** (`file://`, partagées entre Facturation.html, DeltaSub.html et les
  SUBGestion*.html). Ne jamais les modifier pour un test : travailler dans l'aperçu (origine localhost séparée) avec une
  base de test. Une opération sur les vraies données se fait par Paulo, ou avec son accord explicite au moment même.
- **Jamais de données clients dans git** : `deltasub/`, `extraction_deltaproject*/`, `Sauvegarde DeltaSub/`,
  `Sauvegarde Facturation/`, `facturation_data_*.json`, PDF réels sont ignorés — vérifier avec `git check-ignore` avant
  tout commit qui ajoute des fichiers.

## Où sont les données

| App | Stockage | Sauvegarde |
|---|---|---|
| Facturation (et cadre de SUBGestion 1/3) | `localStorage` `sa_*` (+ données de départ dans le HTML) | Import / Export (JSON) ; sauvegarde auto sur disque via `fact_backup_server.py` (port 7788) |
| Moteur de gestion (DeltaSub, SUBGestion) | IndexedDB « DeltaSub » | Réglages ▸ Données & sauvegarde ▸ Exporter / Importer (`deltasub_base_*.json.gz`) |

Transfert entre machines : exporter sur l'une, importer sur l'autre (git ne transporte que le code).

## Reprendre les données Deltaproject dans SUBGestion

Deltaproject reste en service au bureau ; ses sauvegardes nocturnes sont sur le NAS :
`/Volumes/SUBSTANCES/Deltaproject/Backup/<date>/` (volume monté seulement au bureau ; à la maison le NAS est
injoignable — le dire et préparer la suite plutôt que d'improviser).

1. Paulo exporte la base depuis SUBGestion (Réglages ▸ Données & sauvegarde ▸ Exporter).
2. `python3 outils_deltaproject/reprise_subgestion.py` — prend l'export le plus récent (Téléchargements) et la dernière
   sauvegarde Deltaproject (ou `--extraction <dossier>` / `--sauvegarde <dossier>`), extrait en **lecture seule**
   (`extraire.sh`, Java embarqué dans DELTAproject.app), fusionne, et écrit `deltasub/subgestion_reprise_<date>.json.gz`.
3. Paulo importe ce fichier dans SUBGestion (Réglages ▸ Données & sauvegarde ▸ Importer).

Ce qui est conservé : collections saisies dans l'app (honoraires, contrats, factures, encaissements, QR, tâches,
planification, soumissions, documents, dépôt de fichiers…), adresses, participations, utilisateurs, réglages, documents
Bâtiment et modèles modifiés dans l'app ; les saisies locales effacées par la reprise et absentes de Deltaproject sont
rétablies ; celles remplacées par une autre version Deltaproject sont listées dans `…_remplaces.json`. La provenance
se lit dans la version `s` de chaque enregistrement (plage de la reprise précédente, notée dans `sg_meta/import`).

Limites actuelles : le contenu des fichiers joints et PDF du dépôt n'est pas dans la base locale (seule la liste) ;
les verrous de documents ne sont jamais repris.

Français seulement : une reprise ramène les libellés allemands, italiens et anglais de Deltaproject (NAMEGE…, modèles,
documents types, catalogues). Au démarrage suivant, SUBGestion 3 repropose à l'administrateur « Ne garder que le
français » (`sgFrReste()`), avec sauvegarde juste avant ; aussi dans Réglages ▸ Données & sauvegarde. Marque
`sg_meta/francais` {DATE, N cumulé}. Sur le NAS, la sauvegarde d'avant est `avant_francais_<date>.sqlite` dans le dossier
des sauvegardes du serveur (`POST /api/sauvegarder`, administrateur, hors rotation des 48).

## Lire les bases hors de l'app

- Export `.json.gz` : `{"format":"deltasub-base","seq":…,"ids":{…},"tables":{t:{id:{"s":…,"v":{…}}}}}`.
- Anciennes bases serveur : `Sauvegarde DeltaSub/deltasub_*.sqlite` (table `rec(t,id,val,seq,who,ts)`), à ouvrir en
  lecture seule : `sqlite3.connect('file:%s?mode=ro&immutable=1' % quote(chemin), uri=True)`.
- Conversion SQLite → export : `python3 outils_deltaproject/exporter_base_deltasub.py <base.sqlite>`.

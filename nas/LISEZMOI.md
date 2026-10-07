# SUBGestion sur le NAS — base du bureau partagée

NAS : Synology DS923+ (DSM 7.4), adresse 192.168.1.100. Une fois installée, l'app s'ouvre sur chaque poste à
**http://192.168.1.100:7790** : tout le bureau travaille sur les mêmes données (gestion + Facturation).
Ouverte en double-clic (`SUBGestion3.html`), l'app reste en « base locale » comme avant (secours, consultation).

## Ce qui est partagé
- Base de gestion (moteur DeltaSub : projets, adresses, heures, frais, devis, contrôles des coûts…) : base SQLite du
  serveur, modifications des autres postes relevées toutes les 4 s, conflit détecté si deux postes modifient la même fiche.
- Données Facturation (contrats, factures, carnet, PV, heures Facturation…) : clés `sa_*` synchronisées (`/api/kv`).
  Deux postes qui modifient en même temps des contrats ou factures **différents** : réunis automatiquement. Le **même**
  contrat / la même facture : la première modification gagne, l'autre poste est averti (bandeau rouge « Conflit »).
- Fichiers joints (PDF, annexes) : dépôt du serveur (`donnees/fichiers/objets`).
- Restent propres à chaque poste : réglages d'affichage, brouillons, polices Akkurat (licence par poste).

## Dossier partagé `subgestion` sur le NAS
```
subgestion/
  app/          ← nas/preparer.sh : SUBGestion3.html, DeltaSub.html, serveur_deltasub.py, docker-compose.yml
  donnees/      ← base deltasub.sqlite + fichiers joints (créés au premier démarrage)
  sauvegardes/  ← copie horaire de la base (48 dernières) + copie des fichiers joints
```

## Installation (une fois)
1. DSM ▸ Centre de paquets ▸ installer **Container Manager** (et **Hyper Backup**).
2. Panneau de configuration ▸ Dossier partagé ▸ Créer ▸ `subgestion` (Corbeille activée, masqué ; votre compte en
   Lecture/Écriture, les autres « Pas d'accès »).
3. Sur le Mac : Finder ▸ Aller ▸ Se connecter au serveur (⌘K) ▸ `smb://192.168.1.100/subgestion`, puis dans le Terminal,
   depuis le dossier de l'application : `nas/preparer.sh` (copie dans `/Volumes/subgestion/app`).
4. Container Manager ▸ Projet ▸ Créer : nom `subgestion`, chemin `subgestion/app`, source « Utiliser le
   docker-compose.yml existant » ▸ Suivant ▸ (portail Web Station : rien) ▸ Terminé. Attendre « En cours d'exécution ».
5. Chrome : `http://192.168.1.100:7790` → écran « La base du bureau est vide ».

## Reprise des données (une fois, personne ne saisit pendant ce temps)
1. Sur votre poste actuel (SUBGestion 3 en double-clic) :
   - ⋯ ▸ **Données & sauvegarde** ▸ **Exporter** → `deltasub_base_….json.gz` (base de gestion) ;
   - ⋯ ▸ **Sauvegarde Facturation** ▸ **Exporter** → `facturation_data_….json`.
2. Sur `http://192.168.1.100:7790` : bouton **Importer une base …** → le `.json.gz` (la page se recharge).
3. Choisir l'utilisateur, puis ⋯ ▸ **Sauvegarde Facturation** ▸ **Importer** → le `facturation_data_….json` (confirmer).
4. Contrôler : nombre de projets, contrats, factures, heures ; 2 ou 3 PDF. Dès ce moment, ne plus saisir en double-clic.

## Comptes et mots de passe (recommandé à plusieurs)
Par défaut chaque poste choisit « Qui utilise ce poste ? ». Pour exiger un mot de passe : Réglages ▸ Paramètres système ▸
Ouverture de session ▸ Mode ▸ « Avec nom d'utilisateur et mot de passe » (compte administrateur).

## Postes et iPad
- Mac : Chrome ▸ ⋮ ▸ Caster, enregistrer et partager ▸ **Installer la page en tant qu'application**.
- iPad (au bureau) : Safari ▸ Partager ▸ **Sur l'écran d'accueil**. Hors du bureau : VPN (Tailscale ou VPN Server du NAS),
  jamais d'ouverture du port 7790 vers Internet (le serveur refuse d'ailleurs toute adresse hors réseau local).

## Mise à jour de l'app
`nas/preparer.sh` (partage monté) : la nouvelle page est servie tout de suite (recharger les postes). Si
`serveur_deltasub.py` a changé : Container Manager ▸ Projet ▸ subgestion ▸ Action ▸ **Redémarrer**.

## Sauvegardes et restauration
- Automatiques : `sauvegardes/deltasub_AAAAMMJJ_HHMM.sqlite` (toutes les heures s'il y a eu des modifications, 48 gardées)
  + Hyper Backup quotidien du dossier `subgestion` (à configurer : Hyper Backup ▸ + ▸ Tâche de sauvegarde des données).
- Export manuel à tout moment : ⋯ ▸ Données & sauvegarde ▸ Exporter (base complète + données Facturation).
- Restaurer une sauvegarde horaire : Container Manager ▸ arrêter le projet ; remplacer `donnees/deltasub.sqlite` par la
  copie choisie (supprimer `deltasub.sqlite-wal` et `-shm`) ; redémarrer le projet.

## Limites connues
- Création de PDF à partir d'une page HTML (documents du moteur) : demande encore le serveur de sauvegarde du Mac
  (`fact_backup_server.py`, Chrome et polices Akkurat) ; les PDF de Facturation se font dans le navigateur, sans changement.
- Pas de travail hors connexion en mode bureau : si le NAS est injoignable, l'indicateur passe à « Hors ligne ».

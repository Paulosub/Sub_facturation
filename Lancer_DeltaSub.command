#!/bin/bash
# Double-cliquez ce fichier SUR LE MAC STUDIO pour démarrer le serveur DeltaSub (base partagée du bureau).
# Laissez la fenêtre du Terminal ouverte tant que le bureau utilise DeltaSub.
# Les postes du bureau ouvrent ensuite : http://<nom-du-Mac-Studio>.local:7790/
# Pour arrêter le serveur : fermez la fenêtre, ou appuyez sur Ctrl+C.

cd "$(dirname "$0")"
echo "Démarrage du serveur DeltaSub…"
python3 "serveur_deltasub.py"
echo ""
echo "Le serveur s'est arrêté. Vous pouvez fermer cette fenêtre."

#!/bin/bash
# Double-cliquez ce fichier pour démarrer le serveur de sauvegarde de l'app Facturation.
# Laissez la fenêtre du Terminal ouverte tant que vous utilisez l'application.
# Pour arrêter le serveur : fermez la fenêtre, ou appuyez sur Ctrl+C.

cd "$(dirname "$0")"
echo "Démarrage du serveur de sauvegarde…"
python3 "fact_backup_server.py"
echo ""
echo "Le serveur s'est arrêté. Vous pouvez fermer cette fenêtre."

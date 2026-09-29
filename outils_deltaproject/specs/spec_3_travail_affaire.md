# Cahier des charges d'interface — 3. Travailler dans l'affaire

**Objet** : reproduire dans `DeltaSub.html` (HTML/JS autonome) les domaines d'affaire de DELTAproject décrits aux pages 34 à 49 du manuel FR.
**Sources** : manuel FR p. 34-49 (texte + 46 copies d'écran `shots/p34_*` à `p49_*`), libellés FR de `Strings.db` (paquets `deltaproject.project*`, `deltaproject.invoice`, `deltaproject.qrbill`, `db`, `db.admin`), schéma Derby réel (`out/schema.txt`), comptage des CSV réels (`out/tables/*.csv`). Les codes d'énumération ont été relus dans `lib/db.jar` (ordre des constantes uniquement, sans reprendre de code).
**Conventions** : les libellés entre « » sont les libellés FR exacts du logiciel. `TABLE.COLONNE` renvoie à la base Derby. ◀ = bouton « navigateur / suggestions » à droite d'un champ ; 📅 = sélecteur de date ; ⓘ = fiche du contact ; 🖩 = calculette (conditions) ; ⚙▾ = menu Actions ; 📄▾ = menu Documents/Rapports ; ▼▾ = menu Filtre ; ⇈ ↑ ↓ ⇊ = déplacer en tête / monter / descendre / en fin.
Aucune donnée client n'est reprise : les exemples chiffrés viennent des copies d'écran du manuel (affaires de démonstration).

---

## 1. Cadre commun

### 1.1 Navigation en colonnes (« Miller columns »)

Fenêtre principale = bandeau (logo du bureau à gauche, logo produit à droite) + barre d'outils + 4 zones horizontales :

| Zone | Contenu | Détails |
|---|---|---|
| A. Arbre des modules | ADRESSES, **AFFAIRES** (Gestion, Controlling, **Mes affaires**, **Toutes les affaires**), COLLABORATEURS, NOTES DE FRAIS, HEURES, TÂCHES, FACTURES, BÂTIMENT, MANAGEMENT, MODELES | En-têtes en capitales, triangle ▸/▾ pour replier. Entrée active sur fond gris. |
| B. Liste des affaires | Colonnes « Numéro » (tri ▲/▼), « Affaire » | Sélection simple ; tri cliquable ; lignes zébrées bleu pâle. |
| C. « Domaine d'affaire » | Liste fixe (ordre exact ci-dessous) | Sélection simple ; change la zone D. |
| D. Contenu du domaine | Selon le domaine : tableau seul, colonne de filtre + tableau, tableau + panneau de détail, ou tableau + graphique | Barre d'outils propre au domaine, placée au-dessus de la zone D (champ de recherche 🔍 à droite). |

**Mes affaires** : seulement les affaires *en cours* dans lesquelles l'utilisateur est intervenant avec le rôle « Collaborateurs » (code 12). **Toutes les affaires** : affaires en cours, en attente et terminées.

**Ordre des domaines** (colonne C, en-tête « Domaine d'affaire », `MenuTableModel`) tel qu'affiché dans toutes les copies d'écran :
1. « Intervenants » 2. « Soumissionnaires » 3. « Liste d'adresses » 4. « Documents » 5. « Messages brefs » 6. « Séances » 7. « Notes » 8. « Tâches » 9. « Frais » 10. « Calcul des honoraires » 11. « Contrats honoraires » 12. « Avancement des prestations » 13. « Factures » 14. « Liste des plans » 15. « Liste de distribution » 16. « Devis général » 17. « Soumission » 18. « Contrôle des coûts ».

Variantes présentes dans `Strings.db` de la version installée (non visibles dans le manuel) : « Entrepreneurs », « Fichiers » (documents externes, distinct de « Documents »), « Calcul des coûts », « Offres d'honoraires » (libellé alternatif de « Calcul des honoraires »), « Planification RH », « Analyse de planification RH ». DeltaSub suit l'ordre du manuel ; les variantes sont hors périmètre (cf. §8).

Les domaines 16-18 (Devis général, Soumission, Contrôle des coûts) sont traités dans d'autres cahiers ; ici on ne décrit que leur place dans la navigation.

### 1.2 Barre d'outils type

Boutons carrés gris à icône, dans cet ordre quand ils existent : « + » Nouveau, ✎ Éditer (parfois avec ▾), « − » Supprimer, ⬇ Importer, ⇈ ↑ ↓ ⇊ (ordre manuel), 📄▾ Documents/rapports, ⚙▾ Actions, ▼▾ Filtre, puis champ de recherche à droite (filtre plein texte instantané sur toutes les colonnes visibles). Un bouton est grisé si l'action n'est pas possible (aucune sélection, droits, statut).

### 1.3 Comportements communs

- Double-clic sur une ligne = Éditer. Touche Suppr = Supprimer avec confirmation « Voulez-vous vraiment supprimer cette inscription ? ».
- Colonnes : tri par clic sur l'en-tête (flèche ▲/▼), largeur réglable, ordre mémorisé par utilisateur. Libellés tronqués par « … » si trop étroits.
- Dialogues modaux : libellés alignés à droite, champs à gauche ; **libellés en gras = champs obligatoires** ; boutons « Annuler » et « OK » (OK = bouton par défaut, bleu) en bas à droite ; « Fermer » pour les dialogues de consultation.
- ◀ ouvre un navigateur (adresses, modèles, contrats…) ou une liste de suggestions de texte (le champ reste libre).
- ⓘ ouvre la fiche adresse du contact.
- Dates `JJ.MM.AAAA` ; montants `1'234.50` (apostrophe des milliers, 2 décimales) suivis de l'unité « CHF », « h », « % », « CHF/h ».
- Panneau contact (sous les tableaux Intervenants / Soumissionnaires) en deux moitiés « Entité » ⓘ | « Responsable » ⓘ : nom et adresse, puis « Téléphone », « Tél. mobile », « Courriel » (lien mailto).

---

## 2. Domaines d'affaire

### 2.1 Intervenants (`PROJECTMEMBER`, `PROJECTMEMBERROLEGROUP`)

**Rôle** : tous les participants de l'affaire avec leur rôle. Répartis par le directeur d'affaire dans *Affaires › Gestion* (« Attribuer les intervenants ») ; les **entreprises** y sont inscrites automatiquement depuis le contrôle des coûts ou le contrat de la soumission.

**Disposition** (p34_341) : tableau + panneau contact (Entité | Responsable) en dessous.

**Colonnes** (`ProjectMemberTableModel`) : « Rôle » (tri par défaut ▲), « Entité », « Responsable », « Domaine spécialisé », « Fonction », « CFC », « Note » (affichée « Notes » dans le manuel), option « Masqué ».

**Barre d'outils** (manuel) : 📄▾, ⚙▾, ▼▾, recherche. La version installée ajoute « Nouvel intervenant », « Intervenant » (éditer) et « Copier l'intervenant ».
- ⚙▾ : « Courriel » (message à l'intervenant sélectionné), « Afficher l'entité », « Afficher le responsable », « Copier l'intervenant », « Groupés par rôles » / « Groupés par CFC » (bascule).
- 📄▾ : « Standard » (liste des intervenants), « Liste d'adresses » (par rôles), « Liste d'adresses par CFC » (« Liste par rôle et CFC »), « Etiquettes ».
- ▼▾ (filtre par rôle) : « Afficher tout » (coché par défaut), puis les **groupes de rôles** entre chevrons (ex. `<Planerteam>`), puis les rôles un par un dans l'ordre de tri ci-dessous. Choix unique, coche ✓.

**Dialogue « Nouvel intervenant » / « Modifier l'intervenant »** : « Rôle » (liste), « Rôle secondaire », « Entité » ◀ (navigateur d'adresses), « Responsable » ◀ (personne de l'entité ; lien « Ajouter un responsable à l'entité »), « Fonction », « Domaine spécialisé », « CFC » ◀, « Note », ☐ « Masquer dans la liste des affaires ».

**Rôles** (`TEAMROLECODE` → libellé), dans l'ordre d'affichage du filtre (p34_341) :
8 « Maître d'ouvrage » · 23 « Autres MO » · 31 « Entreprise totale » · 1 « Architecte » · 22 « Autres architectes » · 2 « Directeur des travaux » · 3 « Ingénieur civil » · 35 « Paysagiste » · 19 « Entreprises » · 25 « Entreprise générale » · 4 « Directeur d'affaire » · 5 « Représentant directeur » · 6 « Responsable de l'affaire » · 7 « Représentant resp. » · 50 « Consultant du MO » · 51 « Représentant du MO » · 32 « Economiste » · 12 « Collaborateurs » · 13 « Collaborateurs externes » · 24 « Gérant d'immeubles » · 10 « Spécialistes » · 26 « Planificateur principal » · 21 « Planificateur de coût » · 11 « Experts » · 14 « Autorités » · 20 « Assurances » · 16 « Locataires » · 17 « Acheteurs » · 18 « Voisins » · 27 « Gérance immobilière » · 28 « Clients » · 29 « Exploitants » · 30 « Participants concours » · 36 « Manager BIM » · 37 « Coordinateur BIM » · 38 « Responsable BIM » · 39 « Coordinateur ICT » · 33 « Garant (SIA 1018/1019) » · 34 « Usines » · 15 « Autres » · 90 « Intervenants archivés ».
Le logiciel marque d'un indicateur les rôles 1-8, 21, 31, 33, 35, 50 et 51 (rôles de direction repris comme champs dans les modèles de documents, ex. « Entreprise totale contact / responsable ») ; signification exacte à confirmer.

**Groupes de rôles** (*Gestion › « Groupes de rôles »*, dialogue « Définir un groupe de rôles ») : « Désignation » + liste « Rôles » (« Ajouter un rôle » / « Supprimer un rôle »). Stocké dans `PROJECTMEMBERROLEGROUP.NAME` et `TEAMROLECODES` (liste de codes séparés par virgule, ex. `1,`).

**Correspondance** : `PROJECTMEMBER` : `PROJECT_ID`, `TEAMROLECODE` (Rôle), `CONTACT_ID` (Entité), `RESPCONTACT_ID` (Responsable), `PROJECTROLE` (Fonction), `PROJECTDIVISION` (Domaine spécialisé), `BKP` (CFC), `NOTE`, `ISHIDDEN`, `SORTORDER`.

### 2.2 Soumissionnaires (`PROJECTTENDERER`)

**Rôle** : par affaire, liste des entreprises proposées par type de travaux (CFC). Les entreprises saisies dans les soumissions y sont ajoutées automatiquement par CFC.

**Disposition** (p34_345) : tableau + panneau contact.

**Colonnes** : « CFC », « Entité », « Responsable » (+ « Commande reçue », « Note » disponibles).

**Barre d'outils** : « + », ✎, « − », ⬇ (« Importer la liste de soumissionnaires d'une autre affaire »), 📄▾ (« Standard », « Liste d'adresses », « Etiquettes »), ⚙▾ (« Courriel », « Afficher l'entité », « Afficher le responsable », « Modifier », « Groupés par CFC »), ▼▾, recherche.

**Comportements**
- « + » : 1) dialogue « Choix de la position » (catalogue CFC de l'affaire, « Catalogue », « Positions sélectionnées ») — on peut choisir plusieurs positions ; 2) navigateur d'adresses — plusieurs entreprises à la fois. Une ligne est créée par couple (CFC, entreprise).
- Import depuis une autre affaire : copie toute la liste, puis modifiable. Avertissement si « Les plans comptables sont différents ».
- Suppression : « Voulez-vous vraiment retirer cette adresse / ces adresses de la liste ? ».

**Dialogue « Nouveau » / « Modifier »** : « CFC », « Entité » ◀, « Responsable » ◀, ☐ « Commande reçue », « Note ».

**Correspondance** : `PROJECTTENDERER` : `BKP`, `CONTACT_ID`, `RESPCONTACT_ID`, `ISACCEPTED` (Commande reçue), `NOTE`, `PROJECT_ID`.

### 2.3 Liste d'adresses

Non détaillée pages 34-49. Vue « Liste d'adresses » des intervenants groupée par rôle (même données que §2.1, même impression « Liste d'adresses » / « Etiquettes »). Colonnes du rapport (`ProjectMemberListTableModel`) : « Entité », « Entité et adresse », « Adresse », « Responsable », « Fonction », « Domaine spécialisé », « CFC », « Téléphone », « Tél. mobile », « Courriel », « Fax », « Site internet », « Note ».

### 2.4 Documents (documents externes : `PROJECTFILE`, `PROJECTFOLDER` ; version récente : `PROJECTDOCUMENT`, `PROJECTDOCUMENT_CONTACT`)

**Rôle** : lier des documents externes (Word, PDF…) à l'affaire, créés depuis un **modèle** (paramétré dans *Gestion*) ou simplement déposés dans le dossier de l'affaire puis liés.

**Disposition** (p35_356) : colonne intermédiaire de regroupement (dossiers, utilisateurs, destinataires, CFC) entre « Domaine d'affaire » et le tableau, avec son propre ⚙▾ :
« Affichage selon dossiers » (défaut), « Affichage selon utilisateurs », « Affichage selon destinataires », « Affichage selon CFC », « Affichage tous » (+ « Affichage selon types de documents »). « Affichage tous » montre toutes les colonnes et l'export du tableau donne la table des matières pour l'archivage.

**Colonnes** (`ProjectFileTableModel`) : « N° » (N° du document), « CFC », « Nom du document », « Version », « Brouillon » (✔), « Concerne », « Utilisateur », « Modifié le », « Entité », « Responsable », icône de lien fichier, « Nom du fichier » ; en affichage élargi : « Type de document », « Numéro de référence », « Notes », « Dossier », « Nom du modèle ». Présentations « Abrégé » / « Standard » / « Élargi ».

**Barre d'outils** : « + »▾ (« Nouveau » = depuis un modèle, « Lier un fichier », « Nouveau fichier temporaire »), ✎▾ (« Editer les données du document », « Nouvelle version »), « − », ⚙▾ (« Ouvrir le document », « Afficher le dossier », « Définir le dossier de l'affaire »).

**Dialogue « Modifier les donnés du document »** (p35_352 ; titre tel quel) :
« **Type de document** » ; « N° du document » ; « CFC » + bouton ⋯ ; « **Nom du document** » ◀ ; « Version » ; ☐ « Brouillon » ; « **Titre du document/concerne** » ◀ ; « Numéro de référence » ; « Utilisateur » ◀ ; « Date du document » 📅 ; « Adresse entité » ◀ ⓘ ; « Adresse responsable » ◀ ⓘ ; « **Nom du fichier** » ◀ ; « Nom du modèle » (lecture seule) ; « Remarque ».

**Comportements**
- Nouveau : choisir d'abord le modèle, puis remplir la fiche. DELTA **propose un nom de fichier** (modifiable), construit par les règles `FILENAMERULE` (base réelle : 3 éléments séparés par « _ » ; exemple manuel : `CFC-Nom du document-Entité.docx`). Le fichier est créé sous ce nom dans le dossier « DELTAprojectDocuments » de l'affaire.
- Lier : même fiche sans modèle ; bouton « Créer un lien vers le fichier ». Contrôles : « Le fichier est ok. », « Ce fichier n'existe pas. », « Pas de nom du fichier. ».
- Suppression de la fiche : le fichier reste sur le disque (message « Le document externe est toujours présent sur votre disque dur. »).
- Paramétrage du dossier : dialogue « Dossier des documents externes » (chemin relatif au dossier Affaires ou absolu) ; sous-dossiers : « Liens avec les sous-dossiers de DELTAprojectDocuments » (`PROJECTFOLDER` : « Nom », « Dossier », ☐ « Masqué »).

**Version récente (`PROJECTDOCUMENT`)** — « Nouveau document d'affaire » / « Modifier le document d'affaire » : « Type de documents », « Modèle », « Concerne », « Entité » ou ☐ « Plusieurs contacts » (« Nombre de contacts »), « Responsable », « CFC », « Texte CFC », « Date du document », « Utilisateur de document », « Note », « Note d'envoi » (suggestions « Par courrier », « Par courriel »), « Statut » ☐ « Le document est envoyé » (document sigillé, non modifiable). Menus : « Nouveau », « Modifier le document », « Ouvrir le document », « Copier le document », « Confirmer l'envoi », « Ouvrir PDF », « Partager le fichier PDF », « Partager le PDF et cacheter le document », « Supprimer le fichier PDF » ; regroupements « Groupé selon types de documents / contacts / utilisateurs / CFC », « Tous ».

**Correspondance** : `PROJECTFILE` (`DOCUMENTTYPE`, `DOCUMENTNUMBER`, `BKP`, `DOCUMENTNAME`, `VERSION`, `ISDRAFT`, `SUBJECT`, `REFERENCE`, `USERID`, `CHANGEDDATE`, `CONTACT_ID`, `RESPCONTACT_ID`, `FILENAME`, `TEMPLATEDESC`, `NOTE`, `PROJECTFOLDER_ID`) ; `PROJECTDOCUMENT` (`DOCUMENTTYPE`, `TEMPLATEDESC`, `SUBJECT`, `CONTACT_ID`, `ISMASTER`, `RESPCONTACT_ID`/`RESPONSIBLEMEMBER_ID`, `BKP`, `BKPTEXT`, `CHANGEDDATE`, `USERID`, `NOTE`, `MAILINGNOTE`, `ISSEALED`, `FILENAME`) ; destinataires multiples : `PROJECTDOCUMENT_CONTACT`.

### 2.5 Messages brefs (`DOCUMENT`, `DOCUMENTRECIPIENT`, `DOCUMENTATTACHEMENT`)

**Rôle** : correspondance créée **uniquement avec les modèles DELTA** (éditeur de texte intégré), un ou plusieurs destinataires.

**Colonnes** (`DocumentTableModel`) : « Titre », « Concerne », « Entité », « Appartient à », « Date », « Utilisateur », « Statut » (« Brouillon » / « Envoyé »), « Annexes » (nombre), « Modèle ».

**Menus** : ⚙▾ « Dupliquer le document », « Dupliquer le document et les destinataires », « Rechercher » ; menu contextuel « Ouvrir le document », « Editer le document », « Editer les destinataires », « Editer les annexes », ☐ « Brouillon ».

**Création** : choisir le modèle dans le navigateur de modèles, puis dialogue « Nouveau document » / « Editer la correspondance » : « Titre », « Concerne », « Utilisateur », « Date », « Langue », ☐ « Brouillon », « Mots-clé », « Ouvrage », « Mention préalable » (= « Type d'envoi »), liste « Destinataires » (« Ajouter un destinataire », « Editer le destinataire », « Supprimer le destinataire » ; « Civilité de courrier » globale : formelle / personnelle / personnalisée). « Autres indications » : « Texte libre 1 » à « Texte libre 5 ».

**Éditeur** (p36_363) : fenêtre titrée par le « Concerne » ; menus « Fichier », « Edition », « Vue » ; navigation ⏮ ◀ ▶ ⏭ entre les exemplaires (un par destinataire) ; bouton bleu d'aperçu ; ⚙▾ « Editer le document … », « Autres indications … », « Editer les destinataires … » ; barre de mise en forme (police, taille, **G**, *I*, S, alignements gauche/centre/droite). Page A4 : bloc adresse à droite, lieu et date, n° + nom d'affaire en gras avec filet, concerne, corps.

**Destinataire** (« Editer le destinataire ») : « Adresse », « Type d'adresse » (« Adresse de société » / « Adresse privée »), « Civilité de courrier » (« Civilité formelle », « Civilité personnelle », « Civilité personnalisée »).
**Annexes** (« Editer les annexes ») : « Titre du document », « Fichier / Emplacement » (« Définir l'emplacement »), ☐ « Référence sur un fichier », ☐ « Utiliser l'emplacement relatif au dossier d'affaire » ; actions « Ouvrir l'annexe », « Afficher le dossier ».

**Correspondance** : `DOCUMENT` (`NAME` Titre, `SUBJECT`, `USERID`, `CHANGEDDATE`, `LANGUAGECODE`, `ISDRAFT`, `NOTE` Mots-clé, `SUBPROJECT_ID`, `ADDRESSPREFIX`, `CUSTOMTEXT1-5`, `TYPE`='note' pour les messages brefs) ; `DOCUMENTRECIPIENT` (`DOCUMENT_ID`, `CONTACT_ID`) ; `DOCUMENTATTACHEMENT` (`NAME`, `REFERENCE`, `ISFILEREFERENCE`, `ISRELATIVETOPROJECTFOLDER`).

### 2.6 Séances et procès-verbaux (`MEETINGSEQUENCE`, `MEETING`, `MEETINGPARTICIPANT`, `MEETINGITEM`, `PROJECTMEETINGTYPE`)

**Principe** : séances classées par **genre** (à créer par affaire). Une **série de séances** (ex. « Séance de chantier, 1, Information générale ») contient des **procès-verbaux** numérotés ; chacun a ses participants et ses points de l'ordre du jour.

**Liste du domaine** (`MeetingSequenceTableModel`) : « Numéro », « Genre », « Sujet », « Discussions » (nombre de PV), « Animation », « Terminée ».
Menus : ⚙▾ « Ouvrir », « Editer », « Ajouter un procès-verbal », « Dupliquer un procès-verbal », « Editer le procès-verbal », « Editer les participants », « Modifier tous les points », « Marquer tous comme "présent" », « Marquer tous comme "en distribution" », « Copier les courriels dans le presse-papier » (tous / présents / distribution), « Envoyer une invitation » ; 📄▾ « Convocation », « Procès-verbal », « Envoi courriel », « Nouveau document du procès-verbal » ; 🔍 (loupe) = recherche dans les points.

**Dialogue « Nouveau » / « Editer » (série)** (p36_367) : « Genre » (liste des genres de l'affaire), « Numéro », « Sujet », « Remarque », ☐ « Terminé », « Ouvrage ». Suppression refusée si la série contient des PV (« Suppression impossible. Vous devez supprimer préalablement tout son contenu. »).

**Fenêtre « Editer la série de séances »** (p38_385) :
- en haut « Série de séances » (description lecture seule) ;
- à gauche « Séances (n) » : « Numéro », « Titre », « Date », « Brouillon » ; boutons « + » (« Ajouter un procès-verbal »), ✎, « − », 📄▾ (« Procès-verbal ») ;
- à droite « Description » (n°, titre, date, heure, lieu du PV sélectionné), puis « Participants (n) » : « Entité », « Appartient à », « Abréviation », « Animation », « Présent », « Distribution », « Auteur » (✔/✕) ; boutons + ✎ − ⇈ ↑ ↓ ⇊ ⚙▾ ;
- « Points de l'ordre du jour (n) » : « N° du point », « Titre du point », « Catégorie », « Responsable », « Délai », « Réglé » ; boutons + ✎ − ⇈ ↑ ↓ ⇊, renuméroter (↓1-9), ⚙▾ (« Copier le point sélectionné », « Copier tous les points », « Coller le ou les points »), ☾ ;
- « Fermer ».

**Dialogue « Nouveau procès-verbal » / « Editer le procès-verbal »** (p37_374) : « Numéro », « Titre », « Date de la séance » 📅, « Heure » [de] – [à], « Lieu », « Objectif », « Notes » (multiligne), « Annexes » ◀ (dossier ; « Afficher l'emplacement »), « Date du procès-verbal » 📅, ☐ « Brouillon ».

**Dialogue « Dupliquer la séance »** : ☐ « Intégrer les participants » ; ☐ « Intégrer les points de la séance » : ◉ « Tous » / ◉ « Seulement les points non réglés ».

**Dialogue « Editer le participant »** : « Participant », « Abréviation », « Fonction », « Domaine spécialisé », « CFC », ☐ « Animation », ☐ « Présent », ☐ « Distribution », ☐ « Auteur », « Absent » (suggestions « Excusé », « Non excusé », « En vacances »).

**Dialogue « Nouveau point » / « Editer le point »** (p37_378) : « Niveau hiérarchique » (0, 1, 2), « Titre », « Texte » (multiligne), « Catégorie », « Catégorie libre », « Responsable » ◀, « Délai » 📅, ☐ « Réglé », ☐ « Saut de page avant le point ».
- Niveau 0 = ordre du jour / sommaire (titres 1, 2, 3…) ; niveaux 1 et 2 = positions (1.1, 1.1.1). Renumérotation automatique, points déplaçables et supprimables à tout moment.
- **Catégories** (`ITEMCATEGORYCODE`) : 0 « Aucun », 1 « Information », 2 « Décision », 3 « Tâche », 4 « Point ouvert ». Symboles dans le PV : I, D, T, O.
- « Tâche » : liable à une tâche existante ou crée une nouvelle tâche (visible dans la liste des tâches du collaborateur, §2.8). « Point ouvert » = tâche d'un intervenant externe.
- Texte long : conseil « Il est recommandé de diviser des longs textes en sections. ».

**Recherche « Rechercher dans les points de l'ordre du jour »** (p38_389) : « Série de séances » ; ⚙▾ ; ▼▾ catégorie (« Afficher tout », « Aucun », « Information », « Décision », « Tâche », « Point ouvert ») ; 🔍 ; filtres « Séance », « Participant », « Catégorie libre », « Réglé ». Colonnes : « N° du procès-verbal », « Titre du procès-verbal », « N° du point », « Titre du point », « Texte », « Catégorie », « Responsable », « Délai », « Réglé ». Usage : toutes les tâches ouvertes d'une entreprise avant une séance.

**Document PV** (bouton « Document ») : colonnes « Numéro », « Texte », « Délai », « Catégorie », « Responsable » (largeur et titre réglables). Paramètres : « Page de garde », « Sommaire », « Titres à un / deux / trois chiffres en gras », « Afficher seulement le titre », « N'afficher que les tâches », « Afficher les participants avec des détails », récapitulations en fin (« … des décisions », « … des points ouverts », « … des tâches », « … des participants »), « Police », « Taille de police », « Interligne », « Séparateur ». Blocs : « Liste des participants » (« Nom », « Société », « Fonction », « Abréviation », « Courriel/Tél. », « Pres. », « Distr. »), « Animation de la discussion », « Rédaction PV de la discussion », « Distribution du PV aux absents ».

**Genres de séances** (*Gestion › « Configurer les séances »*, `PROJECTMEETINGTYPE`, copiés de la liste standard `MEETINGTYPE`) : « Séance avec les autorités », « Séance avec le maître d'ouvrage », « Séance de coordination », « Séance de chantier », « Séance de projet », « Journal de chantier », « Entretien de collaborateur », « Information collaborateur ». Actions : « Nouveau genre de procès-verbaux », « Insérer les genres de procès-verbaux standards », « Importer du dossier standard », « Importer d'une affaire existante ». Genre utilisé = non supprimable.

**Correspondance** : `MEETINGSEQUENCE` (`PROJECTMEETINGTYPE_ID` Genre, `NUMBER`, `SUBJECT`, `NOTE`, `ISCLOSED`, `SUBPROJECT_ID`) ; `MEETING` (`MEETINGNUMBER`, `SUBJECT` Titre, `MEETINGDATE`, `TIMEFROM`, `TIMETO`, `LOCATION`, `GOAL`, `NOTE`, `ATTACHEMENTFOLDER`, `MINUTESDATE`, `ISDRAFT`) ; `MEETINGPARTICIPANT` (`CONTACT_ID`, `INITIALS`, `PROJECTROLE`, `PROJECTDIVISION`, `BKP`, `ISLEADER`, `ISPRESENT`, `ISRECIPIENT`, `ISRECORDINGSECRETARY`, `ATTENDANCENOTE`, `SORTORDER`) ; `MEETINGITEM` (`STRUCTURINGLEVEL`, `NUMBER`, `TITLE`, `TEXT` ≤ 4096, `ITEMCATEGORYCODE`, `ITEMID` Catégorie libre, `USERNAME` Responsable, `DEADLINE`, `ISDONE`, `ISPAGEBREAKBEFORE`, `PROJECTTASK_ID`, `SORTORDER`).

### 2.7 Notes (`PROJECTNOTE`)

Petites notes internes de l'affaire.
**Colonnes** : « Date », « Utilisateur », « Sujet », « Texte », « Ouvrage ».
**Dialogue « Nouvelle note » / « Modifier la note »** : « Concerne », « Date », « Utilisateur », « Ouvrage », texte libre. 📄 « Note ».
**Correspondance** : `SUBJECT`, `CONTENT` (≤ 4096), `OWNER`, `CHANGEDDATE`, `SUBPROJECT_ID`.

### 2.8 Tâches (`PROJECTTASK`, `PROJECTTASKNOTE`)

**Rôle** : le directeur d'affaire attribue des tâches aux collaborateurs ; ceux-ci les voient aussi dans le module TÂCHES, peuvent les éditer et les commenter. Tâches aussi créées depuis une séance (§2.6).

**Colonnes** (p39_404, `ProjectTaskTableModel`) : « Date », « Créé par », « Concerne », « Description », icône + « Statut », icône + « Priorité », « Responsable », « Entité », « Délai » ; disponibles : « Réglé le », « Urgent », « Nouveau », « Ouvrage ».
Icônes : ✎ = en traitement, ⊘ = réglé ; ≡ = priorité.

**Barre d'outils** : +, ✎, −, 📄▾ (« Tâche », « Liste des tâches de l'affaire »), ⚙▾ (« Exporter »), ▼▾ (filtre de statut), recherche. Astuce du manuel : saisir le nom d'un contact dans la recherche + filtre « En traitement » = toutes les tâches ouvertes de l'entreprise.

**Dialogue « Nouveau » / « Edition »** (p39_408) : « Concerne », « Description » (multiligne), « Création » (auteur, date — lecture seule), « Statut », « Priorité », « Responsable » ◀ ⓘ (collaborateur), « Entité » ◀ ⓘ (contact externe), « Délai » 📅 + ☐ « Urgent », « Ouvrage », tableau « Notes » (« Date », « Auteur », « Sujet », « Texte » ; + ✎ −). Note : « Nouvelle note » / « Modifier la note » (« Concerne » + texte).

**Énumérations** : Statut 0 « Brouillon », 1 « En traitement », 2 « Annulé », 3 « Réglé » ; Priorité 0 « Aucune », 1 « Basse », 2 « Normale », 3 « Elevée ».
**Règles** : dès que le statut n'est plus « Brouillon », le responsable voit la tâche ; indicateur « Nouveau » tant qu'il ne l'a pas ouverte ; « Réglé le » renseigné au passage à « Réglé » ; responsable et directeur d'affaire peuvent ajouter des notes ; une tâche utilisée dans un PV n'est pas supprimable (« Cette tâche ne peut pas être effacée, car elle est utilisée dans un procès-verbaux. »).

**Correspondance** : `SUBJECT`, `DESCRIPTION`, `USERNAME` (créé par), `STARTDATE`, `PROJECTTASKSTATECODE`, `PROJECTTASKPRIORITYCODE`, `STAFF_ID` (Responsable), `CONTACT_ID` (Entité), `DEADLINE`, `ISURGENT`, `ISUNTOUCHED`, `DONEDATE`, `SUBPROJECT_ID` ; notes `PROJECTTASKNOTE` (`SUBJECT`, `CONTENT`, `OWNER`, `CHANGEDDATE`).

### 2.9 Frais (`PROJECTCOST`, `PROJECTCOSTCATEGORYGROUP`, `PROJECTCOSTCATEGORY`)

**Rôle** : frais liés à l'affaire (et non au collaborateur, contrairement aux notes de frais — qui écrivent pourtant dans la même table avec `STAFF_ID`).

**Disposition** (p39_396) : barre d'outils « + », copier ▾, ✎, « − », puis **navigateur de période** « ‹ [mois ▾] › » et « ‹ [année] › », recherche. Le tableau n'affiche que le mois/année choisi.

**Colonnes** (`ProjectCostTableModel`) : « Date », « Groupe de frais » (tri ▲), « Genre de frais », « N° pièce », « Quantité », « Unité », « Montant », « Monnaie », « Désignation », « Statut », « Facturable » (✔/✕), « Facturé », « Ouvrage », « Phase », « Phase partielle » ; disponibles : « Prix », « Tarif », « Remboursable », « Ristourné », « Collaborateur ».

**Dialogue « Nouveau » / « Edition »** (p39_400) :
- deux listes côte à côte « Groupe de frais » | « Genre de frais » (le genre dépend du groupe) ;
- « Date » : ‹ [« lundi, 1 octobre 2018 (Semaine 40) » ▾] › ;
- « Quantité » ; « Prix » [ ] CHF ; ☐ « Monnaie étrangère » [code] « Cours » [1.0] ;
- « Montant » (calculé, lecture seule) ; « **Désignation** » (obligatoire) ; « N° de la pièce » ; « Taux de TVA » ;
- trois listes « Ouvrage » | « Phase » | « Phase partielle », chacune avec « Annuler la sélection » ;
- (version installée) ☐ « Remboursable », « Statut ».

**Règles** : prix et unité proposés depuis le genre de frais ; saisie toujours dans la monnaie de l'affaire ; si monnaie étrangère (ex. « € ») avec cours : Montant = Quantité × Prix × Cours. Statuts (`PROJECTCOSTSTATECODE`) : 0 « Saisi », 1 « Refusé », 2 « Corrigé », 3 « Approuvé ». « Facturé » est posé par le controlling (« Modifier le statut "Facturé" et transférer en facturation »).

**Catalogue de frais du bureau** (`COSTCATEGORYGROUP` / `COSTCATEGORY`, copié par affaire dans `PROJECTCOSTCATEGORYGROUP` / `PROJECTCOSTCATEGORY`) :
- « Frais de déplacement » : Kilomètres voiture privé (km, 0.70), Billet, Kilomètres avec voiture Substances, Tickets de parking, Recharge à domicile (kWh, 0.30) ;
- « Frais de copie » : A4 noir/blanc (p, 0.35), A4 couleur (p, 1.30), A3 noir/blanc (p, 0.65), A3 couleur (p, 2.60), Plotter noir /blanc (m2, 9.30), Plotter couleur (m2, 13.95), Poste, Dossier, Livres ;
- « Frais du bureau » : Matériel informatique, Fourniture, Représentation ;
- « Frais admin » : Frais de déplacement, Frais de stationnement, Frais de fourniture, Frais de matériel informatique, Frais de téléphonie, Frais de représentation, Frais web, literature, poste, Facture de fonctionnement.

**Correspondance** : `DATEYEAR`/`DATEMONTH`/`DATEDAY` (date éclatée), `COSTCATEGORYGROUP_ID`, `COSTCATEGORY_ID`, `DOCUMENTNUMBER`, `QUANTITY`, `UNIT`, `UNITPRICE`, `FOREIGNCURRENCYCODE`, `FOREIGNCURRENCYRATE`, `EXTERNALRATE` (tarif refacturé), `DESCRIPTION`, `VATRATE`, `PROJECTCOSTSTATECODE`, `ISCHARGEABLE`, `ISCHARGED`, `CHARGEDDATE`, `ISREFUNDABLE`, `ISREFUNDED`, `STAFF_ID`, `SUBPROJECT_ID`, `PHASE_ID`, `SUBPHASE_ID`.

### 2.10 Calcul des honoraires (`PROJECTFEE`, `PROJECTFEECALCULATION`, `PROJECTFEECALCULATIONAMOUNT`, `PROJECTFEETIMEITEM`, `PROJECTFEECOSTITEM`, `PROJECTFEEADDITIONALITEM`)

**Principe** : un **calcul d'honoraires** (en-tête : mode de calcul, contrat selon, mandant…) porte plusieurs **variantes de calcul** (offre, contrat, avenant…). Une variante peut ensuite être reprise dans un contrat d'honoraires (§2.11).

**Disposition** (p40_415) : deux tableaux côte à côte dans la zone D.
- Gauche — calculs (`PROJECTFEE`) : « Numéro », « Désignation », « Utilisateur » ; barre + ✎ − ⚙▾.
- Droite — variantes du calcul sélectionné (`PROJECTFEECALCULATION`) : « Numéro », « Titre », « Désignation », « Version », « Date » ; barre + ✎ − 📄▾ ⚙▾.
- ⚙▾ (droite) : « Honoraires selon les activités », « Honoraires selon les phases 3 - 5 », « Frais », « Récapitulatif », « Cahier ». 📄▾ : « Nouveau document de calcul ».

**Étape 1 — « Choix du mode de calcul honoraires »** (p40_417) : « Mode de calcul » (liste) et « Contrat selon » (liste).
- Mode (`BILLINGCATEGORYCODE`) : 1 « Global », 2 « Forfaitaire », 3 « Coût de l'ouvrage », 4 « Temps employé effectif », 5 « Autre ». Fixé à la création.
- Contrat selon (`BASEDONCODE`) : 11 « SIA 1001/1 Contrat de mandataire/de direction des travaux », 12 « SIA 1001/2 Contrat de société pour communauté de mandataires », 13 « SIA 1001/3 Sous-contrat… », 20 « SIA 1002 Contrat relatif aux prestations de l'architecte », 30 « SIA 1003 … ingénieur civil », 40 « SIA 1004 … ingénieur forestier », 50 « SIA 1005 … architecte paysagiste », 60 « SIA 1006 … géologue (D) », 80 « SIA 1008 … l'ingénieur », 111-114 « SIA 1011/1-4 Modèle de prestations 111 … », 121-123 « SIA 1012/1-4 Modèle de prestations 112 … », 0 autre.

**Étape 2 — « Nouveau contrat d'honoraires » / « Editer le calcul des honoraires »** (p40_421, titre affiché « Editer le calcul du contrat honoraires ») : « Numéro » ; « Désignation » ◀ (suggestions « Calcul du contrat », « Calcul de l'avenant », « Précalculation », « Comparaison », « Recalculation ») ; « Mode de calcul » (lecture seule) ; « Contrat selon » (lecture seule) ; « Type de prestations » ◀ (« Prestations de l'architecte », « … de l'ingénieur civil », « … de l'ingénieur forestier », « … de l'architecte paysagiste », « Prestations du géologue », « … de l'ingénieur », « … de l'ingénieur électricien », « … de l'ingénieur acousticien », « Prestations garantie des coûts ») ; « Mandant » ◀ ⓘ ; « Mandataire » ◀ ⓘ ; « Contrat avec » ◉ « Maître d'ouvrage » / ◉ « Sous-traitant » ; « Ouvrage » ; « Utilisateur » ◀ ; « Date » 📅 ; « Statut » ◀ (« validé », « refusé », « interne ») ; « Remarque ». Non supprimable s'il a une variante liée.

**Étape 3 — variante « Nouveau calcul » / « Modifier »** (p41_428, p41_436) : « Numéro » ; « Type de document » ◀ (« Offre », « Contrat », « Avenant ») ; « Désignation » ; « Date » 📅 ; « Statut » ◀ (« Base pour contrat », « Etat intermédiaire », « Annulé ») ; « Remarque » ; « Mode de calcul » (lecture seule).
Bloc « **Rémunération** » :
- « Honoraires brut/HT » [ ] CHF 🖩 — saisi directement en mode Global/Forfaitaire/Autre (🖩 grisé) ; en modes Coût de l'ouvrage / Temps effectif, 🖩 ouvre « Calculer » (voir ci-dessous) ;
- « Honoraires net/TTC » [ ] CHF 🖩 → « Editer les conditions » ;
- « Temps prévu » [ ] h ;
- « Coûts supplémentaires brut HT » [ ] CHF 🖩 → « Calculer les frais » ;
- « Coûts supplémentaires brut TTC » (libellé tel quel ; = net TTC) [ ] CHF 🖩 → conditions ;
- « **Total contrat honoraires net TTC** » = honoraires net TTC + coûts supplémentaires net TTC (lecture seule).
Non supprimable si utilisée dans un contrat.

**Dialogue « Editer les conditions »** (p41_432, `PROJECTFEECALCULATIONAMOUNT`) — cascade, exemple du manuel :
| Ligne | % | Montant |
|---|---|---|
| **Total HT** | | 100'000.00 |
| Rabais | -2.00 % | -2'000.00 |
| Sous-total | | 98'000.00 |
| Escompte | 0.00 % | 0.00 |
| Sous-total | | 98'000.00 |
| Arrondi | | 0.00 |
| Sous-total HT | | 98'000.00 |
| TVA | 7.70 % | 7'546.00 |
| **Total TTC** | | 105'546.00 🖩 |
Options : « Arrondir à 5 ct », « Calculer l'arrondi » (depuis un Total TTC saisi), « Supprimer l'arrondi ». TVA par défaut à mettre à jour : 8.1 % depuis 2024 (la base contient encore 7.7).
Champs : `AMOUNT1` (brut), `SALESDISCOUNT` (rabais %), `CASHDISCOUNT` (escompte %), `ROUNDING`, `ISMERCANTILEROUNDING`, `VATRATE`, `AMOUNT2` (TTC). Une ligne pour les honoraires (`TIMECALCULATIONAMOUNT_ID`), une pour les frais (`COSTCALCULATIONAMOUNT_ID`).

**Dialogue « Calculer »** (p41_440) — trois parts additionnées :
« Honoraires d'après le temps employé effectif » : « Honoraires » CHF 🖩, « Heures de travail » h ;
« Honoraires d'après le coût de l'ouvrage » : « Honoraires » CHF 🖩, « Temps prévu » h ;
(« Services supplémentaires selon des phases » : « Honoraires », « Temps prévu ») ;
« Total » : « Honoraires » CHF, « Heures » h. → `TIMEAMOUNTPART1..3`, `TIMEHOURPART1..3`, `TIMEHOUR`.

**Dialogue « Honoraires d'après le coût de l'ouvrage »** (p42_447) :
Bloc « Calcul d'honoraires » : « Coût de l'ouvrage, en francs, déterminant le temps nécessaire » (B) CHF ◀ (« Calculer » par CFC / « Import de DELTAdevis » / « Annuler le calcul ») ; « Z-valeur Z1 » ◀ (« Architectes, SIA 102: 0.062 », « Génie civil, SIA 103: 0.075 », « Architectes paysagistes, SIA 105: 0.062 », « Ingénieurs … SIA 108: 0.066 ») ; « Z-valeur Z2 » ◀ (10.58 / 7.23 / 10.58 / 11.28) ; « Facteur de base pour le temps nécessaire p » (calculé) ; « Part de prestations, en pourcent q » % ; « Facteur d'ajustement r » ; « Degré de difficulté n » ; « Majoration pour transformation u » ; « Temps moyen nécessaire, en heures » (calculé) ; « Taux horaire(s) h » CHF/h ◀ (« Taux horaire(s) h SIA: 100 CHF/h »).
Bloc « Honoraires d'après les phases 3-5 » : barre 🖩 (« Calculer les phases »), ✎ (modifier la phase), ⚙▾ (« Actualiser les phases », « Transférer les heures et les coûts dans l'analyse de l'affaire », « Ajouter les heures et les coûts au budget dans l'analyse de l'affaire »). Tableau : « N° », « Phases », « Part » (%), « Temps nécessaire (Tm) », « Facteur de groupe », « Prévision (Tp) », « Tarifs horaire(s) h », « Prestations spéciales (s) », « Honoraires ». Lignes de phase en gras (3 Etude du projet, 4 Appel d'offres, 5 Réalisation) avec sous-totaux, lignes de phases partielles (31 Avant-projet 9 %, 32 Projet de l'ouvrage 21 %, 33 Procédure de demande d'autorisation 2.5 %, 41 Appel et comparaisons des offres… 18 %, 51 Projet d'exécution 16 %, 52 Exécution de l'ouvrage 29 %, 53 Mise en service, achèvement 4.5 %), ligne total.
Pied : « Honoraires » CHF, « Temps prévu » h ; « Fermer ». Bandeau « Recalcul nécessaire! » si un paramètre a changé.
Dialogue de phase (✎) : « Facteur de groupe », « Facteur pour prestations spéciales », « Part (q = 100%) », « Part (q <= 100%) », « Tarif horaire par phase ». Avertissement si la répartition ne correspond pas à q.
Calculs : Tp = Tm(phase) × facteur de groupe ; Honoraires(phase) = Tp × tarif × s. **Cas de test** (manuel) : B = 551'400, Z1 = 0.062, Z2 = 10.58, q = 100 %, r = n = u = 1, tarif 135 → 1'678.00 h et 226'530.00 CHF (ex. 31 : 151.02 h × 135 = 20'387.70). La formule de Tm suit SIA 102 art. 7 ; à valider sur ce cas (le champ « Temps moyen nécessaire » de la copie d'écran est incohérent et ne doit pas servir de référence).

**Dialogue « Calcul » (temps employé effectif)** (p42_451) : en-tête « Total 255.00 h / 41'800.00 CHF » ; barre ✎, ⚙▾ (« Ajouter en tant que prévision », « Transférer en tant que prévision ») ; tableau « Groupe d'activités », « Activité », « Durée », « Montant », sous-total gras par groupe, ligne « Total » (fond gris). ✎ ouvre « Honoraires selon le temps effectif » (p42_455) : « Groupe d'activités », « Activité », « Phase », « Phase partielle », « Durée », « Tarif », « Facteur », « Montant », « Option », « Remarque » ; barre + ✎ − ⇈ ↑ ↓ ⇊ ⚙. Montant = Durée × Tarif × Facteur ; une ligne « Option » n'entre pas dans le total. Les activités viennent de la gestion de l'affaire (`PROJECTACTIVITY`).

**Dialogue « Calculer les frais »** (p43_462) : « Total 2'190.00 CHF » ; tableau « Groupe de frais », « Genre de frais », « Montant » avec sous-totaux par groupe et « Total ». Détail « Calculer » (p43_466) : « Groupe de frais », « Genre de frais », « Phase », « Phase partielle », « Quantité », unité, « Prix », « Facteur », « Montant », « Option », « Remarque ». Montant = Quantité × Prix × Facteur.

**Correspondance** : `PROJECTFEE` (`NUMBER`, `NAME`, `BILLINGCATEGORYCODE`, `BASEDONCODE`, `SUPPLIERDESC`, `CONTACT_ID` Mandant, `SUPPLIERCONTACT_ID` Mandataire, `ISSUBCONTRACT`, `SUBPROJECT_ID`, `USERID`, `CHANGEDDATE`, `VERSION` Statut, `REMARK`) ; `PROJECTFEECALCULATION` (`NUMBER`, `TITLE` Type de document, `NAME`, `VERSION` Statut, `CHANGEDDATE`, `REMARK`, `TIMEHOUR`, `TIMEAMOUNTPART1-3`, `TIMEHOURPART1-3`, `CALCULATIONDETAILS` = paramètres B, Z1, Z2, q, r, n, u, h et répartition des phases, `PROJECTFEE_ID`, `TIMECALCULATIONAMOUNT_ID`, `COSTCALCULATIONAMOUNT_ID`) ; lignes `PROJECTFEETIMEITEM` (`ACTIVITY_ID`, `SUBPHASE_ID`, `TIMEHOUR`, `RATE`, `FACTOR`, `ISOPTIONAL`, `REMARK`, `SORTORDER`), `PROJECTFEECOSTITEM` (`COSTCATEGORY_ID`, `SUBPHASE_ID`, `QUANTITY`, `UNITPRICE`, `FACTOR`, `ISOPTIONAL`, `REMARK`), `PROJECTFEEADDITIONALITEM` (services supplémentaires : `SUBPHASE_ID`, `TIMEHOUR`, `RATE`, `FACTOR`, `ISOPTIONAL`).

### 2.11 Contrats honoraires (`PROJECTCONTRACT`, `PROJECTSCHEDULEDPAYMENT`, `PROJECTPAYMENT`)

**Colonnes** (p43_470, `ProjectContractTableModel`) : « Numéro », « Désignation », « Date », « Mandant », « Mandataire », « Type de prestations », « Contrat avec », « Ouvrage » ; disponibles : « Statut », « Utilisateur », « Total ».

**Barre d'outils** : « + »▾ (« Nouveau contrat », « Nouveau contrat basé sur un calcul »), ✎▾ (« Editer le contrat », « Planifier des encaissements », « Editer les encaissements »), « − » (refusé si des encaissements existent : « Le contrat ne peut pas être supprimé parce que les paiements ont été saisi. »), ⇈ ↑ ↓ ⇊, 📄▾ (« Nouveau document contrat », « Afficher le calcul des honoraires », « Importer des fichiers PDF du calcul »).

**Dialogue « Nouveau contrat » / « Editer le contrat »** (p43_474) : « Numéro » ; « Désignation » ; « Type de prestations » ◀ ; « Date » 📅 ; « Mandant » ◀ ⓘ ; « Mandataire » ◀ ⓘ ; « Contrat avec » ◉ « Maître d'ouvrage » / ◉ « Sous-traitant » ; « Ouvrage » ; « Utilisateur » ◀ ; « Statut » (liste : « En traitement », « Validé », « Refusé ») ; « Remarque » ; « Emplacement du dossier d'affaire » ◀ (« Afficher l'emplacement »).
Bloc « Rémunération » : « Calcul des honoraires » ◀ (choix d'une variante → reprise des montants), « Honoraires bruts/HT » CHF, « Honoraires nets/TTC » CHF ⓘ (« Définir les conditions »), « Temps prévu » h, « Coûts supplémentaires bruts/HT » CHF, « Coûts supplémentaires nets/TTC » CHF ⓘ, « **Total contrat honoraires net/TTC** » CHF 🖩 ; « Facturation » ☑ « Contrat accessible » (le contrat apparaît dans les factures).

**« Planifier les encaissements »** (p44_485, ✎ › « Planifier des encaissements… ») : « Contrat » (lecture seule) ; « Encaissements planifiés » : « Désignation », « Date de la facture », « Date d'échéance », « Date encaissement », « Phase », « Phase partielle », « Montant » ; barre + ✎ − ⇈ ↑ ↓ ⇊ ⚙ ; pied « Montant du contrat: 332'000.00 CHF / Total: 332'000.00 CHF » (contrôle visuel de l'écart) ; « Fermer ».
Dialogue « Nouvelle planifification d'encaissement » / « Editer planification d'encaissement » (p44_489) : « Désignation » ◀ (« Acompte », « Encaissement final ») ; « Date de la facture » 📅 ; « Date d'échéance » 📅 (+ « Jours ») ; « Date encaissement » 📅 ; « Montant » CHF ; « Phase/Phase partielle » (deux listes « Phase » | « Phase partielle », « Annuler la sélection ») ; « Remarque ».
Ces lignes peuvent générer des factures au statut « Planifiée » (§2.13).

**« Editer les encaissements »** (« Encaissements ») : « Contrat », « Montant du contrat », tableau « Désignation », « Facture », « Date de la facture », « Date encaissement », « Montant », « Total ». Les lignes avec **cadenas** viennent d'un paiement saisi dans une facture (non modifiables ici) ; les autres se saisissent avec « + ».
Dialogue « Nouveau » / « Editer » (p44_501) : « Désignation » ◀ (« Encaissement acompte », « Encaissement final », « Versement à sous-traitant ») ; « Facture » (grisé, lien) ; « Date de la facture » ; « Date encaissement » ; « Montant » CHF ; « Remarque ».

**Correspondance** : `PROJECTCONTRACT` (`NUMBER`, `NAME`, `SUPPLIERDESC`, `CONTRACTDATE`, `CONTACT_ID`, `SUPPLIERCONTACT_ID`, `ISSUBCONTRACT` 0 = Maître d'ouvrage / 1 = Sous-traitant, `SUBPROJECT_ID`, `USERID`, `STATECODE` 0 « En traitement » / 1 « Validé » / 2 « Refusé », `REMARK`, `CONTRACTFOLDER`, `PROJECTFEECALCULATION_ID`, `TIMEAMOUNT1`, `TIMEAMOUNT2`, `TIMEHOUR`, `COSTAMOUNT1`, `COSTAMOUNT2`, `CONTRACTAMOUNT`, `ISINVOICEABLE`, `SORTORDER`) ; `PROJECTSCHEDULEDPAYMENT` (`NAME`, `INVOICEDATE`, `DUEDATE`, `PAYMENTDATE`, `AMOUNT`, `PHASE_ID`, `SUBPHASE_ID`, `REMARK`, `SORTORDER`) ; `PROJECTPAYMENT` (`NAME`, `INVOICEDATE`, `PAYMENTDATE`, `AMOUNT`, `REMARK`, `PROJECTINVOICE_ID` = cadenas).

### 2.12 Avancement des prestations (`PROJECTIMPLEMENTATION`)

**Disposition** (p45_512) : tableau en haut, graphique en bas.
**Barre** : + ✎ − ⚙▾ (☐ « Afficher les semaines »).
**Colonnes** : « Date », « Désignation », « Avancement prévu » (%), « Utilisateur », « Remarque », « Avancement effectif » (%), « Utilisateur », « Remarque ». Une valeur peut être vide (prévu saisi d'avance, effectif saisi plus tard).
**Graphique** « Avancement des prestations » : axe Y en %, axe X = dates (ou semaines) ; séries « Avancement prévu » (orange foncé) et « Avancement effectif » (orange clair), points ronds.
**Dialogue « Nouveau » / « Editer »** : « Date », « Désignation », « Avancement prévu » (% (mes prestations)), « Utilisateur », « Remarque » ; « Avancement effectif », « Utilisateur », « Remarque ».
**Correspondance** : `IMPLEMENTATIONDATE`, `NAME`, `SCHEDULEDVALUE`/`SCHEDULEDUSERID`/`SCHEDULEDREMARK`, `CURRENTVALUE`/`CURRENTUSERID`/`CURRENTREMARK` (entiers).

### 2.13 Factures (`PROJECTINVOICE`, `PROJECTINVOICEPOS`, `QRBILL`, gabarits `INVOICEPOSGROUP`/`INVOICEPOS`)

**Sources d'une facture** : un calcul d'honoraires ; une planification d'encaissements ; les heures et frais du controlling ; facture libre.

**Disposition** (p46_527) : colonne « Filtre des contrats » (« Sans contrat », « Tous les contrats », puis chaque contrat « n Désignation ») | tableau | panneau de synthèse du contrat en bas.
**Barre** : + ✎ − 📄▾ (« Document de facturation », « Document de facturation avec requête de statut », « Nouveau document de facturation ») ⚙▾ (« Modifier la QR-facture », « Afficher l'entité ») ▼▾ (statut) recherche.
**Colonnes** (`ProjectInvoiceTableModel`) : « Désignation », « Numéro », « Date de facture », « Date d'échéance », « Statut », « Contrat », « Débiteur », « Monnaie », « Montant » (TTC), « Encaissé », « Solde à encaisser », « Dernier encaissement » (« Encaissement »), « Nb rappels » ; disponibles : « Type », « QR ».
**Panneau de synthèse** (3 colonnes) : « Contrat », « Date », « Mandant » ⓘ, « Mandataire » ⓘ, « Type de prestations », « Ouvrage » | « Montants » : « Honoraires brut/HT », « Honoraires net/TTC » ⓘ, « Coûts supplémentaires brut/HT », « Coûts supplémentaires net/TTC » ⓘ, « Total contrat honoraires net/TTC » | « Encaissements » : « Encaissements planifiés », « Total facturé », « Total encaissé ».

**Dialogue « Nouvelle facture » / « Editer la facture »** (p46_531) : « Numéro » ; « Désignation » ◀ (« Facture », « Facture d'acompte », « Facture finale ») ; « Date de facture » 📅 ; « Contrat » ◀ (« Choix du contrat », case « Reprendre le débiteur ») ; « Débiteur » ◀ ⓘ ; « Période facturée » ◀ ; « Statut de la facture » (liste) ; « Date d'échéance » 📅 ; « Conditions de paiement » ◀ (« 10 jours net », « 10 jours, escompte 2% », « 30 jours net », « 30 jours, escompte 2% », « 60 jours net », « 60 jours, escompte 2% », « Selon accord », « Paiement à la commande ») ; « Nb rappels » ; « Montant » CHF ; « Encaissé » CHF ✎▾ (« Encaissement », « Editer ») ; « Date dernier encaissement » 📅 ; « Remarque ».
Bloc « Positions » : « Genre », « Position », « Quantité », « Unité », « Prix », « % », « Montant », « Visible » (+ « Rabais », « TVA » disponibles) ; barre « + »▾ (« Nouvelle position », « Navigateur de positions », « Importer des positions de calcul », « Importer des positions de factures »), ✎, −, ⇈ ↑ ↓ ⇊, 🖩, ☑ « Arrondir ». Bandeau « Recalcul nécessaire! ». Si le montant ≠ cumul des positions : « Le total de la facture ne correspond pas au cumul des positions. » + confirmation.

**Dialogue « Nouvelle / Editer la position de facturation »** (p46_533) : « Genre » (liste), « Nom » ◀ (navigateur : « Activités », « Frais », « Phases », « Collaborateur »), « Quantité », « Unité » ◀, « Prix ou taux » CHF / unité, « Total » CHF, ☑ « Visible ».
**Genres de position** (`TYPECODE`) et calcul :
| Code | Libellé | Calcul |
|---|---|---|
| 0 | Groupe | titre, texte seul |
| 1 | Position | Quantité × Prix |
| 2 | Sous-total | somme des positions depuis le dernier groupe |
| 3 | % (Dernier montant) | % × montant de la ligne précédente (ex. rabais) |
| 4 | % TVA (Dernier montant) | TVA sur la ligne précédente |
| 5 | % TVA incl. (Dernier montant) | TVA incluse : précédent × t / (100 + t) |
| 6 | Total | somme de toutes les lignes précédentes (hors sous-totaux) |
| 7 | Commentaire | texte libre |
Exemple (p46_531) : 6 positions en h × 130.00 → Sous-total 17'452.50 ; % TVA 8.00 % 1'396.20 ; Total 18'848.70. Une ligne non « Visible » est calculée mais pas imprimée.
Import depuis le calcul (« Importer ») : ☐ « Importer les groupe d'activités », « … les activités », « … les phases », « … les phases partielles », « … les groupes de frais », « … les genres de frais ».

**Statuts** (`PROJECTINVOICESTATECODE`) : 0 « Planifiée » (préparée depuis une planification d'encaissements), 1 « Envoyée », 2 « Rappel envoyé », 3 « Payée ». Questions automatiques : « Voulez-vous modifier le statut de la facture dans Envoyée ? » (à l'impression avec requête de statut), « … dans Payée ? » (quand l'encaissé atteint le montant). Filtre supplémentaire « Ouverte » (non payée). Un paiement saisi sur une facture liée à une planification est reporté automatiquement dans les encaissements du contrat (cadenas, §2.11).

**Gabarits de positions** (réglages administrateur, `INVOICEPOSGROUP` / `INVOICEPOS`) — base réelle :
- « Facturation en régie » : Régie (groupe), Directeur général des travaux, Architecte, Directeur des travaux, Technicien, Personnel dirigeant de l'affaire, Dessinateur, Adjoint au directeur des travaux, Secrétariat, Personnel auxiliaire, Sous-total régie ;
- « Facturation des frais » : Frais (groupe), Frais de transport, Frais bureau de chantier, Frais de copie, Frais de documentation, Sous-total frais ;
- « Facturation des honoraires » : Honoraires (groupe), Honoraires, Sous-total honoraires ;
- « HT/conditions/TVA/TTC » : Total brut HT, Rabais (%), Sous-total HT, TVA (7.7 → 8.1), TOTAL TTC ;
- « TTC (TVA incluse) » : TOTAL TTC, TVA inclusive (7.7 → 8.1).
**Conditions** (`INVOICECONDITIONGROUP` / `INVOICECONDITION`) : « Conditions » : Rabais, Escompte, Retenue (-10 %), Prorata (-0.05 %), TVA ; « Conditions électro » : Rabais, Deduction, Escompte, Taxes de recyclage, TVA. Types : Montant, TVA, Rabais, Escompte, Retenue, Taxes de recyclage, Prorata, Panneau publicitaire, Assurance, Frais en énergie, Frais en eau, Autres.

**QR-facture** (« Editer la QR-facture ») : « Compte / Payable à » (« Compte », « Sélection du compte », « Nom », « Rue et n° », « NPA/Localité », « Pays »), « Payable par » (mêmes champs), « Information du paiement » : « Monnaie », « Montant », « Référence QR » / « Référence créancier », « Informations supplémentaires », « Information de facture » ; boutons « Valider la facture QR », « Créer la QR-facture ». Contrôles : « N° IBAN valide / incorrect (CH ou LI) », « Une référence QR doit être fournie pour QR-IBAN. », « Vérifier le montant de la facture! ». Sortie « Créer une QR-facture » : « Portrait A4 », « Facture QR uniquement », « Code QR uniquement », lignes de séparation (« Ligne pointillée », « … avec des ciseaux », « Ligne continue », « Sans »), « Ajouter le QR-facture à la fin de la facture » / « … comme nouvelle page à la fin » / « Nouveau fichier PDF ».

**Paramètres d'impression** (« Paramètres ») : « Modèle », « Page de garde », « Afficher les quantités et les prix », « Afficher les unités de quantité », « Afficher les totaux bruts », « Totaux détaillés », « Sous-total avant la TVA », « Afficher les titres des colonnes », « Titres des colonnes en gras », « Afficher le fond alterné », traits (« après sous-totaux », « sous les titres des colonnes », « après le total », « au-dessus du total avant la TVA »), polices, « Interligne », « Désignation du total ».

**Correspondance** : `PROJECTINVOICE` (`NUMBER`, `NAME`, `INVOICEDATE`, `PROJECTCONTRACT_ID`, `CONTACT_ID` Débiteur, `ACCOUNTINGPERIOD`, `PROJECTINVOICESTATECODE`, `DUEDATE`, `TERMSOFPAYMENT`, `DUNNINGLEVEL`, `AMOUNT`, `AMOUNTPAID`, `PAYMENTDATE`, `NOTE`, `PROJECTPAYMENT_ID`, `QRBILL_ID`, `TEMPLATEPROPERTIES`) ; `PROJECTINVOICEPOS` (`TYPECODE`, `NAME`, `QUANTITY`, `UNIT`, `PRICE`, `AMOUNT`, `ISVISIBLE`, `SORTORDER`) ; `QRBILL` (créancier / débiteur éclatés, `AMOUNT`, `CURRENCY`, `REFERENCE`, `UNSTRUCTUREDMESSAGE`, `BILLINFORMATION`) ; comptes `QRBILLACCOUNT`.

### 2.14 Liste des plans (`PROJECTPLAN`, `PROJECTPLANVERSION`, `PROJECTPLANATTRIBUTE`, `PROJECTPLANGROUP`, `PROJECTPLANTYPE`, `PROJECTPLANRULE`, `PROJECTPLANRULEVALUE`)

**Principe** : on enregistre un plan, puis on lui ajoute régulièrement des **versions** (index). La dernière version de chaque plan est toujours visible. Plans affichés **par groupes**.

**Barre** (p48_551) : + ✎▾ (« Editer les attributs de plan », « Editer les versions de plan ») − 📄▾ (« Liste des plans », « Filtre des versions ») ⚙▾ ▼▾ recherche.
**Colonnes** (`ProjectPlanTableModel`) : « Groupe de plans », « Genre de plans », « Numéro », « Date », « Auteur », « Externe », « Versions » (nombre), « Version actuelle », « Statut du plan », « Date » (de la version), « Publié », « Remarque » ; disponibles : « Phase », « Phase partielle », « Ouvrage », « Localisation », « Remarque de livraison ».

**Dialogue « Nouveau plan » / « Editer le plan »** (p48_555) : « Groupe de plan » (liste), « Genre de plan » (liste filtrée par groupe), « Ouvrage », « Phase », « Phase partielle », « Attributs de plan » (tableau « Type », « Code », « Description » ; « + »▾ « Ajouter un attribut de plan », « − »), « Date » 📅, « Plan-ID », « CFC » ◀, « Auteur » ◀ ⓘ, ☐ « Externe », « Remarque », « Numéro ».
**Numéro de plan** : formé automatiquement à partir des éléments choisis selon la **nomenclature** de l'affaire (ex. démo `BE-GID_g1_d01_101_3_05_11`) ; modifiable tant que ni le plan ni sa version ne sont « Publié ».

**Fenêtre des versions** (p48_559, « Editer le plan ») : à gauche « Versions (n) » : « Version », « Statut », « Date », « Publié » (+ ✎ −, « Dupliquer un plan ») ; à droite « Version » « Numéro » (numéro + index), « Destinataire (n) » : « Contact », « Appartient à », « Nombre », « Distribué », « Date de distribution » (+ ✎ − ⇈ ↑ ↓ ⇊) ; « Fermer ». Les destinataires d'un plan se saisissent ici.
**Dialogue « Nouvelle version » / « Editer la version »** : « Version », « Statut » (0 « Conception », 1 « Préavis », 2 « Définitif »), « Date », ☐ « Publié », « Architecte », « Emplacement », « Nom du fichier », « Nom du fichier d'échange », « Nom du fichier PDF » (« Choisir le fichier », ☐ « Utiliser l'emplacement relatif au dossier d'affaire »), « Note », « Remarque de livraison », « Numéro ».

**Paramétrage** (*Gestion*) :
- « Configurer les types de plans » : groupes (`Code`, `Groupe de plan`) et types (`Code`, `Type de plans`) ; standards du bureau : A « Dossier du projet définitif, établi par l'architecte » (A1 Plan de situation 1:500, A2 Plan du rez-de-chaussée 1:100, A3 Plan d'étage 1:100, A4 Coupe A 1:100, A5 Élévation est 1:100, A6 Élévation sud 1:100, A7 Plan des canalisations 1:100) ; B « Dossier des plans d'exécution, établi par l'architecte » (B1 Plan du rez 1:50, B2 Coupe A 1:50, B3 Élévation est 1:50, B4 Élévation sud 1:50, B5 Plan et coupe de la charpente 1:50) ; C « Dossier des plans de détail, établi par l'architecte » (C1 Coupe sur porte-fenêtre rez…, C2 Détail … 1:5, C3 Détails cuisine et W.-C. 1:20).
- « Configurer la nomenclature des plans » (« Editer la nomenclature des plans ») : règles ordonnées, chacune : « Type », « Nom », ☐ « Intégrer dans la nomenclature », « Nombre de caractères », « Remplissage », ☐ « Rempli à gauche », « Séparateur devant », « Séparateur après », valeurs (« Code », « Description »). Types (`TYPECODE`) : 0 Groupe du plan, 1 Type de plans, 2 Numéro d'affaire, 3 Numéro d'affaire externe, 4 Ouvrage, 5 Localisation, 6 Phase, 7 Phase partielle, 8 CFC, 9 Intervenants, 10 Profil, 11 Echelle, 12 Format, 13 Niveau, 14 Représentation, 15 Plan ID, 100-104 Type personnalisé 1-5.

**Document « Liste des plans »** : colonnes configurables (« Numéro de plan », « Version actuelle », « Nombre des versions », « Date de plan », « Date du publication », « Statut », « Publié », « Groupe de plans », « Type de plans », « Phase », « Phase partielle », « CFC », « Echelle », « Format », « Niveau », …), favoris, page de garde, fond alterné ; « Filtre des plans » (« Publié » Oui/Non, « Filtre par date » de … à …).

### 2.15 Liste de distribution (`PROJECTPLANRECIPIENT`)

**Disposition** (p49_566) : colonne « Filtre des destinataires » (« Tous les destinataires », puis chaque destinataire) | tableau.
**Barre** : ✎▾ (« Destinataire », « Liste de distribution », « Marquer des plans comme envoyé: ») 📄▾ (« Liste des plans ») ⚙▾ (« Afficher le dossier », « Export ») ▼▾ (« Distribué » / « Pas distribué ») recherche.
**Colonnes** : « Entité », « Appartient à », « Nombre », « Distribué » (✔/✕), « Date de distribution », « Numéro », « Version », « Statut du plan », « Date », « Publié », « Architecte ».

**Fenêtre « Livraison des plans »** (p49_570) : « Liste des plans » (mêmes colonnes, sélection multiple des versions à envoyer) ; boutons « Afficher le fichier », « Afficher l'annexe » (format d'échange), « Afficher le fichier PDF » ; ☑ « Marquer comme envoyé: » [date] 📅 ; « Destinataire » (adresse multiligne) ; bouton « Bulletin de livraison » ; « E-Mail » [adresse] ⋯ (« E-Mail », « E-Mail avec les informations du plan », « Copier dans le presse-papiers », objet « Couriel objet ») ; « Annuler » / « OK ». À la validation : `ISSENT` = vrai et `MAILINGDATE` = date pour les lignes choisies.
**Bulletin de livraison** : colonnes « Numéro de plan », « Version/Date », « Statut », « Copies ».
**Correspondance** : `PROJECTPLANRECIPIENT` (`PROJECTPLANVERSION_ID`, `CONTACT_ID`, `NOFCOPIES`, `ISSENT`, `MAILINGDATE`, `SORTORDER`) ; `PROJECTPLANVERSION.DELIVERYNOTE`.

### 2.16 Devis général, Soumission, Contrôle des coûts

Présents dans la colonne des domaines (positions 16-18) ; décrits dans les cahiers dédiés. Liens avec ce cahier : le contrôle des coûts et les contrats de soumission alimentent « Intervenants » (rôle Entreprises + CFC) ; les soumissions alimentent « Soumissionnaires » ; DELTAdevis fournit B au calcul SIA (« Import de DELTAdevis »).

---

## 3. Vues transverses liées (pages 43-47)

- **MANAGEMENT › Contrats honoraires** (p43_478, p44_493, p45_508, p46_523) — colonne « Catégorie » : « Contrats », « Contrats et sous-traitants », « Echéancier d'encaissements », « Encaissements planifiés », « Encaissements reçus », « Situation des encaissements », « Avancement des prestations ».
  - Contrats et sous-traitants : colonnes « Affaire », « Genre », « Numéro », « Date », « Type de contrat », « Type de prestations », « Mandataire », « Utilisateur », « Statut », « Monnaie », « Montant du contrat », « Encaissé », « Solde à encaisser » ; regroupé par affaire avec lignes grises « Contrats », « Contrats sous-traitants », « Contrats - sous-traitants » (gras) et « Total contrats » final.
  - Encaissements planifiés : Catégorie | Affaire | « Contrats » | tableau « Genre », « Phase », « Phase partielle », « Remarque », « Date de la facture », « Date de paiement », « Montant » (+ « CHF »), ligne titre du contrat, « Total ». Échéancier : trié par date d'échéance, filtre « Dates d'échéance ».
  - Situation des encaissements : tableau « Encaissements planifiés / reçus », « Date fact. planifiées », « Encaiss. planifiés », « Date encaissements », « Montants encaissés », « Solde à encaisser » + graphique « Situation des encaissements » (CHF cumulés) : « Contrat », « Encaissements planifiés », « Encaissements », « Solde à encaisser ».
  - Avancement des prestations : « Date », « Avancement prévu », « Avancement effectif », « Encaissements [%] », « Encaissements planifiés [%] », « Heures effectuées » (% des heures du contrat) + graphique « Situation » (5 séries).
- **FACTURES › Contrôle de factures** (p47_540) : « Catégorie » « Planifiée », « Envoyée », « Rappel envoyé », « Payée » ; colonnes « Affaire », « Désignation », « Numéro », « Date de facture », « Date d'échéance », « Statut », « Contrat », « Débiteur », « Monnaie », « Montant », « Encaissé », « Solde à encaisser », « Dernier encaissement », « Nb rappels ».
- **MANAGEMENT › Factures** (p47_544) : « Catégorie » « Vue d'ensemble de l'année », « Selon statut », « Date de la facture », « Date d'échéance », « Date d'encaissement » (+ « Honoraires et frais ») ; barre ▼▾, ☐ « Jour de référence » [date] 📅, tri ▾ (« Tri par date facture (ordre croissant) », « Tri par affaire et date… », « Tri par Nº de facture… », …), 📄▾, ⚙▾ ; tableau groupé par affaire avec « Total » ; filtre de période « de … à ».

---

## 4. Synthèse domaine → tables

| Domaine | Tables principales | Référentiels |
|---|---|---|
| Intervenants | PROJECTMEMBER | PROJECTMEMBERROLEGROUP, CONTACT |
| Soumissionnaires | PROJECTTENDERER | PROJECTCATALOG (CFC) |
| Documents | PROJECTFILE, PROJECTFOLDER / PROJECTDOCUMENT, PROJECTDOCUMENT_CONTACT | DOCTEMPLATE, FILENAMERULE, DEFAULTPATH |
| Messages brefs | DOCUMENT, DOCUMENTRECIPIENT, DOCUMENTATTACHEMENT | TEMPLATE |
| Séances | MEETINGSEQUENCE, MEETING, MEETINGPARTICIPANT, MEETINGITEM | PROJECTMEETINGTYPE ← MEETINGTYPE |
| Notes | PROJECTNOTE | — |
| Tâches | PROJECTTASK, PROJECTTASKNOTE | STAFF |
| Frais | PROJECTCOST | PROJECTCOSTCATEGORYGROUP/PROJECTCOSTCATEGORY ← COSTCATEGORYGROUP/COSTCATEGORY |
| Calcul des honoraires | PROJECTFEE, PROJECTFEECALCULATION, PROJECTFEECALCULATIONAMOUNT, PROJECTFEETIMEITEM, PROJECTFEECOSTITEM, PROJECTFEEADDITIONALITEM | PROJECTACTIVITY, PROJECTPHASE, PROJECTSUBPHASE |
| Contrats honoraires | PROJECTCONTRACT, PROJECTSCHEDULEDPAYMENT, PROJECTPAYMENT | — |
| Avancement | PROJECTIMPLEMENTATION | — |
| Factures | PROJECTINVOICE, PROJECTINVOICEPOS, QRBILL | INVOICEPOSGROUP/INVOICEPOS, INVOICECONDITIONGROUP/INVOICECONDITION, QRBILLACCOUNT |
| Liste des plans / distribution | PROJECTPLAN, PROJECTPLANVERSION, PROJECTPLANATTRIBUTE, PROJECTPLANRECIPIENT | PROJECTPLANGROUP/PROJECTPLANTYPE ← PLANGROUP/PLANTYPE, PROJECTPLANRULE/PROJECTPLANRULEVALUE |

---

## 5. Usage réel au bureau (comptage des CSV de la base réelle, 111 affaires)

| Domaine | Table | Lignes | Constat |
|---|---|---|---|
| **Intervenants** | PROJECTMEMBER | **1 324** | Utilisé dans les 111 affaires. Rôles : Collaborateurs (12) 872, **Entreprises (19) 330** (dont 328 avec CFC → alimentation automatique depuis le contrôle des coûts), Maître d'ouvrage (8) 50, Architecte (1) 44, Directeur des travaux (2) 28. « Fonction » renseignée 4 fois, « Domaine spécialisé » 1 fois, « Note » jamais, « Masqué » jamais. |
| Groupes de rôles | PROJECTMEMBERROLEGROUP | 2 | Un seul rôle (Architecte) par groupe. |
| Soumissionnaires | PROJECTTENDERER | 1 | Essai isolé. |
| Documents | PROJECTDOCUMENT / PROJECTFILE / PROJECTFOLDER | 1 / 0 / 0 | Essai isolé (2023). |
| Messages brefs | DOCUMENT / DOCUMENTRECIPIENT / DOCUMENTATTACHEMENT | 3 / 2 / 0 | Essais (même jour, 2023). |
| **Séances et PV** | MEETINGSEQUENCE, MEETING, MEETINGPARTICIPANT, MEETINGITEM | **0** | Jamais utilisé. PROJECTMEETINGTYPE (106 lignes = 8 genres standard copiés dans 14 affaires) n'est qu'un paramétrage par défaut. |
| Notes | PROJECTNOTE | 0 | Jamais utilisé. |
| **Tâches** | PROJECTTASK, PROJECTTASKNOTE | **0** | Jamais utilisé. |
| **Frais** | PROJECTCOST | **635** | Utilisé : 43 affaires, 2019-2026. 525 lignes liées à un collaborateur (= notes de frais), 110 frais d'affaire directs. Groupes : déplacement 560, admin 53, bureau 17, copie 5 ; kilomètres ≈ 520 lignes (unité km 460). Statut toujours « Saisi », toujours « Facturable », **jamais « Facturé »**, aucune monnaie étrangère, pas de N° de pièce, TVA 0 % (528), 7.7 % (105), 8.1 % (2). Phase renseignée 374 fois. |
| **Calcul des honoraires** | PROJECTFEE / PROJECTFEECALCULATION / …AMOUNT / …TIMEITEM / …COSTITEM / …ADDITIONALITEM | **0** / 1 / 2 / 0 / 0 / 0 | Aucun calcul réel : 1 variante isolée (2025, sans en-tête PROJECTFEE) créée pour le seul contrat. |
| Contrats honoraires | PROJECTCONTRACT | 1 | 1 contrat (2025, Maître d'ouvrage, « Validé », « Contrat accessible »). |
| Planification / encaissements | PROJECTSCHEDULEDPAYMENT / PROJECTPAYMENT | 0 / 0 | Jamais utilisé. |
| Avancement | PROJECTIMPLEMENTATION | 0 | Jamais utilisé. |
| **Factures** | PROJECTINVOICE / PROJECTINVOICEPOS / QRBILL / QRBILLACCOUNT | **0** / 0 / 0 / 0 | Jamais utilisé (les gabarits INVOICEPOS 27 et INVOICECONDITION 10 sont les réglages par défaut). |
| **Plans** | PROJECTPLAN / PROJECTPLANVERSION / PROJECTPLANRECIPIENT / PROJECTPLANATTRIBUTE / PROJECTPLANRULEVALUE | **0** | Jamais utilisé. PROJECTPLANGROUP 36 (3 × 12 affaires), PROJECTPLANTYPE 180 (15 × 12), PROJECTPLANRULE 100 (10 × 10) = paramétrages par défaut copiés à la création d'affaire. |

Conclusion : dans ce périmètre, le bureau n'utilise réellement que **Intervenants** et **Frais**. Les contrats d'honoraires et factures sont gérés hors DELTA, dans `Facturation.html` (`sa_contrats`, `sa_factures5`).

---

## 6. Priorités pour DeltaSub

**P1 — à reproduire fidèlement (usage réel)**
1. **Navigation en colonnes** (§1.1) avec la liste complète des domaines dans l'ordre exact ; les domaines non développés restent visibles mais grisés ou avec un écran « non utilisé au bureau » (fidélité visuelle, pas de trou dans la liste).
2. **Intervenants** : tableau, filtre par rôle et groupes de rôles, panneau Entité/Responsable, dialogue d'édition, impressions « Liste d'adresses » / « Etiquettes », et surtout **l'inscription automatique des entreprises (rôle 19 + CFC)** depuis le contrôle des coûts / contrats de soumission. Rôles à livrer d'abord : Collaborateurs, Entreprises, Maître d'ouvrage, Architecte, Directeur des travaux (les autres dans la liste mais sans traitement particulier).
3. **Frais** : navigateur mois/année, tableau, dialogue de saisie avec catalogue de frais du bureau (§2.9), calcul du montant, phase/phase partielle. Partager les données avec les **notes de frais** (même structure, `STAFF_ID`). Monnaie étrangère, statuts Refusé/Corrigé/Approuvé et « Facturé » : prévoir les champs, interface minimale (jamais utilisés).

**P2 — simple et peu coûteux**
4. **Soumissionnaires** (alimentation automatique depuis la Soumission, qui est un module utilisé) + import depuis une autre affaire.
5. **Notes** (une table, un dialogue).
6. **Liste d'adresses** (vue des intervenants groupée par rôle, export/étiquettes).

**P3 — déjà couvert par `Facturation.html` : ne pas dupliquer**
7. **Calcul des honoraires, Contrats honoraires, Planification des encaissements, Avancement des prestations, Factures, QR-facture** : 0 ou 1 ligne dans DELTA ; le bureau les gère dans Facturation. Dans DeltaSub, ces domaines doivent **ouvrir Facturation** ou afficher une synthèse en lecture seule par affaire, à partir des mêmes données `localStorage` (`sa_contrats`, `sa_factures5`) ; conforme au blocage `APP_DELTA` / `DP_BLOCKED` des modules Contrats/Factures en mode Deltaproject. Ce cahier sert de référence si l'on veut aligner Facturation sur DELTA (ex. cascade des conditions §2.10, genres de positions §2.13, calcul SIA 102 phases 3-5 avec son cas de test).
8. **Séances et PV** : 0 ligne dans DELTA, mais l'app a déjà un module PV (mode Deltaproject). Utiliser §2.6 comme **modèle de données de référence** (séries par genre, participants avec 4 rôles, points hiérarchiques 0/1/2, catégories I/D/T/O, duplication « points non réglés ») pour faire évoluer le module PV existant, sans le remplacer.

**P4 — non utilisés : ne pas développer sans demande**
9. **Tâches** (0), **Liste des plans** et **Liste de distribution** (0), **Documents / Messages brefs** (1 et 3 essais) : pas de développement. Au plus, un lien vers le dossier de l'affaire sur le NAS à la place du module Documents.

---

## 7. Écarts et points à vérifier

- Le manuel montre une version antérieure : « Documents » y correspond au module des documents externes (`PROJECTFILE`, affichage par dossiers) ; la version installée sépare « Documents » (`PROJECTDOCUMENT`, documents sigillés/PDF) et « Fichiers » (`PROJECTFILE`). Les deux structures existent dans la base réelle.
- Libellés tels quels dans le logiciel (à garder pour la fidélité ou à corriger, à décider) : « Modifier les donnés du document », « planifification », « Coûts supplémentaires brut TTC » pour un montant net TTC, « Conditions des doûts supplémentaires », « Couriel objet », « Nombre dîndice ».
- Dans le dialogue de variante de calcul, « Type de document » stocke `TITLE` et « Statut » stocke `VERSION` ; dans l'en-tête `PROJECTFEE`, « Statut » stocke aussi `VERSION` (validé / refusé / interne).
- Taux de TVA à jour : 8.1 % (la base et les gabarits contiennent 7.7 %).
- Formule SIA 102 du temps moyen nécessaire : à reprendre de la norme et à valider sur le cas de test du §2.10 avant toute mise en service.

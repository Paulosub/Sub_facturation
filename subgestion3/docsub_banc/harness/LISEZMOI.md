# Banc d'essai « Documents Substances »

> **Préparer l'atelier d'abord** (hors du dépôt : polices, gabarits et modèles n'y sont jamais recopiés) :
> `python3 -I subgestion3/docsub_banc/preparer.py <atelier> <export_base.json.gz>` — crée `<atelier>/harness/` (copie de ce
> dossier), `<atelier>/pdf2png.js` et `<atelier>/res/` (polices et gabarits extraits de `Facturation.html`, bibliothèques de
> `subgestion3/vendor/`, documents types de l'export). Dans ce mode d'emploi, `<atelier>/docsub` = `<atelier>`.

Rend des documents par `sgDsPdf` — le fichier du projet `subgestion3/sg3_docsub.js`, lu tel quel à chaque lancement — dans
Google Chrome **sans fenêtre** (`--headless=new`, profil temporaire effacé à la fin), enregistre les PDF, puis les PNG
(PDFKit du Mac, `../pdf2png.js`). Aucun navigateur partagé, aucun port fixe (le serveur prend un port libre sur 127.0.0.1),
rien n'est écrit dans le projet.

## Lancer

```sh
H=<atelier>/docsub/harness
$H/rendre.sh epreuve,reference  <atelier>/docsub/sorties/1_base          # épreuves du papier + référence contrat
$H/rendre.sh tous               <atelier>/docsub/sorties/4_controle --texte # les 163 documents types (~50 s, PNG compris)
$H/rendre.sh 12                 /tmp/x --pages 1                           # un document par son index (0 à 162)
$H/rendre.sh 0/bankList-fr.dpdoc,timeJournal,3-9  /tmp/x                   # id, type (tous les jeux), plage d'index
```

Sélection (liste séparée par des virgules) : `epreuve` (4 épreuves du papier), `reference` (référence contrat, voir plus bas),
`tous`, un index `12`, une plage `3-9`, un `id` (`jeu/fichier`), un `type` ou un nom de `fichier` (avec ou sans extension).
Sortie par défaut : `<atelier>/docsub/sorties/banc_<date>`.

Options : `--sans-png`, `--echelle 1.2` (échelle des PNG, celle des références `res/*.png`), `--pages 1,2`, `--texte` (texte
extrait de chaque PDF par pdf.js → `<nom>.txt` : utile pour contrôler le « texte identique »), `--zones` (zone utile tracée),
`--meme-page` (sgDsPdf exécutée dans la page au lieu d'un cadre séparé), `--chaines` (polices et gabarits passés en chaînes
`data:…;base64,…` comme dans l'app), `--date AAAA-MM-JJ` (défaut 2026-10-25), `--delai S` (défaut 900), `--paralleles N`
(rendus PNG simultanés, défaut 4).

Noms des fichiers : `<index sur 3 chiffres>_<fichier sans extension>_j<jeu>.pdf` (ex. `000_bankList-fr_j0.pdf`), PNG
`…-<page>.png`, texte `….txt`.

## Ce que le banc vérifie d'office

- `subgestion3/sg3_docsub.js` se charge seul dans une page sans l'app (aucune référence à `VIEWS`, `DS`, `SG_DOM`…) ;
- `sgDsPdf` est **recréée par `toString()` dans un cadre séparé** qui a son propre pdf-lib et fontkit, exactement comme l'app le
  fera dans le cadre Facturation (`w.Function('return ('+sgDsPdf.toString()+')')()`) : une variable extérieure à la fonction ou
  un tableau d'un autre domaine provoquent une erreur ici ;
- chaque PDF est relu par pdf-lib (nombre de pages, orientations).

## Récupérer les erreurs

- Résumé en fin de `rendre.sh` (code de sortie 1 s'il y a une erreur) : erreurs et piles d'appel.
- `<sortie>/journal.jsonl` : une ligne JSON par événement (`niveau` : `info`, `ok`, `erreur`) ; `extra` = pile d'appel JS ou
  fiche du document (pages, orientations, octets, ms, `alertes` = `o.journal` de sgDsPdf, ex. glyphes de repli).
- `<sortie>/fin.json` : bilan (`etat` `fini` | `échec` | `délai dépassé`, nombre de documents, d'erreurs, de pages, fiches).
- `<sortie>/chrome.log` : sortie de Chrome (rarement utile).
- Les erreurs JS non attrapées (`window.onerror`, promesses rejetées) sont journalisées aussi.

## Comparer avec les références

- `python3 $H/comparer_base.py <dossier des épreuves> [échelle fine = 5]` : après `rendre.sh epreuve,reference <dossier>`,
  mesure en points l'en-tête, le pied, la numérotation et le logo contre (1) la **référence contrat** et les gabarits bruts à
  l'échelle fine (1 px = 0,2 pt), (2) les rendus fournis `res/OFFRE-1, OFFRE-3, OFFRE-10, FA-1, FA-2` à l'échelle 1,2 ; écrit
  `<dossier>/comparaisons/` : `mesures.md`, `mesures.json`, planches `fin_*.png` et `x12_*.png` (référence | ma page |
  superposition : cyan = référence seule, rouge = ma page seule, noir = commun).
- `comparaison.py` (module PIL) : `Page(png).encre(zone)`, `ecarts(a, b, zone)`, `planche(...)` ; en ligne de commande :
  `python3 comparaison.py A.png B.png portrait x0 y0 x1 y1 [planche.png]`.
- **Référence contrat** (`reference_contrat.js`, sélection `reference`) : copie, pour comparaison seulement, des instructions
  d'`offrePDFBytes` (Facturation.html) qui posent logo, en-tête courant et numérotation, appliquées aux pages 1, 3 et 10 du
  gabarit de l'offre avec les textes des épreuves → c'est la sortie réelle d'un contrat, à laquelle le papier doit être identique.

## Fichiers

| fichier | rôle |
|---|---|
| `rendre.sh` | lancement (serveur, Chrome sans fenêtre, PNG, bilan) |
| `serveur.py` | serveur local : sert l'atelier et `/projet/subgestion3/<nom>.js`, reçoit `/enregistrer`, `/journal`, `/fin` |
| `banc.html`, `banc.js` | page de banc (ressources, cadre séparé, sélection, envoi des PDF, texte pdf.js) |
| `reference_contrat.js` | référence contrat pour les comparaisons |
| `comparaison.py`, `comparer_base.py` | mesures et planches |

Prérequis : Google Chrome (`/Applications/Google Chrome.app`, ou variable `SGDS_CHROME`), Python 3 + PIL, `osascript`.
Projet : variable `SGDS_PROJET` (défaut : le dossier du dépôt sur ce poste).

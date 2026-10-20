---
name: substances-charte
description: "Charte graphique officielle de Substances Architectes (Akkurat, nuancier noir / bleu nuit #003346 / jaune #FFF266, logo aux lettres « cryptées », filets noirs, angles droits) avec jetons CSS et logo prêts à l'emploi. Utiliser ce skill pour toute interface, page, écran, tableau de bord, document HTML, présentation ou visuel produit pour Substances Architectes ou pour ses apps (SUBGestion, Facturation, DeltaSub), et chaque fois que Paulo parle de « charte », « design de Substances », « couleurs du bureau », « police Akkurat » ou « logo » — même s'il ne dit pas « charte »."
---

# Charte Substances Architectes

Source : `/Users/paulomeireles/Documents/Substances/01-IDENTITY/00-CHARTE/00-CHARTE/sub-ide_Charte graphique_OFFICIELLE.pdf`
(44 pages ; typographie p. 22, nuanciers p. 23-24 ; logos dans `../00-LOGO/`). Pour relire le PDF dans l'aperçu
intégré, passer par une petite page pdf.js (naviguer directement vers un .pdf déclenche un téléchargement).

Fichiers prêts : `assets/charte_substances.css` (polices, couleurs, composants de base) et `assets/logo_substances.svg`
(logo officiel recadré ; lettres `.L`, parties décryptées `.g` dans `.G`, à colorer en CSS).

## Typographie

**Akkurat** pour tous les textes : Light (300) pour les grands chiffres et les textes d'accompagnement, Regular (400)
pour le courant, Bold (700) pour titres, libellés, navigation et boutons. Chargée par `local()` : elle est installée
sur les Mac du bureau ; la licence desktop Lineto ne permet en principe pas de l'embarquer dans une page (repli Arial).
Les documents PDF de Facturation utilisent leur propre police « AkkuratDoc » : ne pas y toucher.

## Couleurs

| Rôle | Couleur |
|---|---|
| Texte, filets, logo | noir `#1d1d1b` |
| Texte secondaire | gris `#706F6F` ; gris du logo `#9D9D9C` (50 %) |
| Aplats, menus, boutons principaux | bleu nuit `#003346` (survol `#636E7E`) |
| Accent, élément actif sur bleu nuit, survol | jaune `#FFF266` ; jaune clair `#FEF6B0` pour sélection et étiquettes |
| États uniquement (statuts, alertes, séries de graphiques) | rouge `#BD1E42`, orange `#D7860D`, vert `#98C21F`, turquoise `#4CBAB5`, bleu `#3F4193` |

Le nuancier secondaire sert à **signaler** (urgent, échu, en attente, en cours), jamais à décorer : sinon l'interface
perd la sobriété noir / bleu nuit / jaune qui fait l'identité du bureau.

## Mise en page

- Esprit des pages de la charte : **petit libellé Bold, filet noir de 2 px, titre Bold** ; colonne d'introduction à
  gauche et contenu à droite quand la place le permet.
- **Angles droits, pas d'ombres décoratives**, cartes ouvertes par un filet noir de 2 px, séparations par filets fins `#e3e3e0`.
- **Aplats bleu nuit avec chiffres ou titres jaunes** pour l'élément principal (comme les cartes de visite) — un seul par bloc.
- Boutons : contour noir de 2 px (secondaires), aplat bleu nuit (principal), survol jaune.
- Tableaux : en-têtes Bold soulignés d'un filet noir, lignes séparées par filets fins, sélection jaune clair `#FEF6B0`
  avec trait bleu nuit à gauche.
- Icônes : traits fins (1,7 px), extrémités carrées, sans remplissage.
- Grands chiffres en Akkurat Light avec séparateur suisse (1'234).

## Logo

Lettres « cryptées » SUBSTANCES / ARCHITECTES : noir sur fond clair, blanc sur bleu nuit ou noir, parties décryptées en
gris à 50 %. Ne pas le redessiner, le déformer ni le recolorer en couleurs secondaires ; garder une marge libre autour.
Le sigle (le « S » du logo) sert d'icône d'onglet ou de logo réduit, avec un point jaune.

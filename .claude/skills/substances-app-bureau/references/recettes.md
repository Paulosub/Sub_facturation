# Recettes (SUBGestion 3)

Toujours : sauvegarde → modification des sources → `python3 subgestion3/construire.py` → vérification
(`substances-verification-app`) → `CLAUDE.md`.

## Ajouter un écran existant du moteur au menu

Dans `subgestion3/sg3.js`, `SG_DOM`, domaine voulu :
```js
{v:'mg-reporting', t:'Indicateurs', ico:'analyse', d:'Chiffres-clés, heures supplémentaires, comparaisons.'},
```
`v` = identifiant de la vue du moteur (`VIEWS[v]`), `t` = libellé du menu, `d` = texte de la tuile de la vue
d'ensemble, `hero:1` pour la tuile bleu nuit (une par domaine), `reg:1` pour un registre en double de Facturation
(étiquette « F »), `hide:1` pour une vue atteinte seulement par navigation interne. Les icônes viennent de `NXI`.

## Ajouter un module de Facturation

Même chose avec `v:'fx-<onglet>'` (onglet = suffixe de `#panel-<onglet>` dans Facturation.html). La vue, le pont et la
synchronisation de l'onglet sont créés automatiquement. Pour ouvrir un enregistrement : `go('fx-calchono','c:'+id)`,
`go('fx-saisie','f:'+id)`, création : `go('fx-calchono','new')`.

## Créer un nouvel écran (tableau de bord, fiche, rapport)

```js
VIEWS['nx-exemple']={
  render(m,arg){
    const ps=DS.all('project').filter(p=>+p.PROJECTSTATECODE===2);
    const pg=nxPage(m,'<div class="nx-hero">…</div><div class="nx-grid">'
      +nxCard('c7','Projets en cours','<div class="b flush">'+ps.map(p=>'<div class="nx-row" data-ref="p:'+p.ID+'">…</div>').join('')+'</div>')
      +'</div>');
    pg._fn.action=()=>editProject();          // boutons data-fn="action"
  },
  refresh(ts){ if(hit(ts,'project')) go('nx-exemple',VIEW.arg); }   // se redessine si les données changent
};
```
Puis l'inscrire dans `SG_DOM` (menu, palette, titre). Composants : `nxCard(classe c3…c12, titre, corps, extra)`,
`nxKpi(icône, libellé, valeur, sous-titre, barre%, go, hero)`, `nxBars(données,{la,lb,every})`, `sgIntro(...)`.
Respecter la charte (`substances-charte`) : filet noir de 2 px en tête de carte, angles droits, bleu nuit/jaune.

## Modifier le moteur ou Facturation

Modifier `DeltaSub.html` / `Facturation.html` (sauvegarde d'abord), puis reconstruire **toutes** les versions qui les
embarquent. Si `construire.py` s'arrête sur « occurrence(s) trouvée(s) », adapter le remplacement concerné au nouveau
texte source plutôt que de forcer.

## Produire une nouvelle version (« SUBGestion N »)

1. Copier `subgestion3/` vers `subgestionN/` ; renommer `sg3.*` si utile.
2. Dans le nouveau `construire.py` : sortie `SUBGestionN.html`, clé `'ds_view'` → `'sgN_view'`, clé Facturation
   `sa_ui_state_sgN`. Dans le JS : suffixes des clés `nx_*3` → `nx_*N`.
3. Laisser les versions précédentes intactes ; documenter la décision (date, ce qui change) dans `CLAUDE.md`.

## Changer l'organisation de la navigation

La structure vient de `SG_DOM` + `sgSide()` (menu) + `sgNav()` (en-tête). Une variante « barres en haut » existe dans
`subgestion3/_backup_20261006_2227_barre_haute/` (préférence de Paulo au 06.10.2026 : **menu à gauche**).

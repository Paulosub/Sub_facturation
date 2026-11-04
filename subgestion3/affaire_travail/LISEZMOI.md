# Affaire de travail 99TST

Affaire **entièrement fictive**, complète, de la faisabilité au décompte final, créée par script pour développer et contrôler l'app (demande de Paulo, 04.11.2026).
Elle n'est PAS dans `SUBGestion3.html` et ne va pas sur le NAS : les fichiers de ce dossier sont injectés dans la page de l'aperçu seulement.

- `ref.js` : la référence unique (identité, calendrier, montants, lots, équipe, récit). Tout module lit ses valeurs ici.
- `socle.js` : `AT.mod`, `AT.commit`, dates ouvrées, cadre Facturation, purge, `AT.generer()`.
- `m*.js` : un fichier par module, enchaînés selon leur numéro. Rejouable : `AT.generer()` retire d'abord tout ce que le registre `sg_meta/affaire_travail` connaît.
- `assembler.py` : assemble le tout en un fichier ; `banc/banc.py` : essai dans un Chrome sans fenêtre, sur une copie.

Modules : 10 annuaire et collaborateurs · 20 affaire · 30 contrats · 40 estimations et devis · 45 soumissions · 47 contrôle des coûts · 50 avenant · 60 heures et frais · 70 factures · 80 tables du moteur (Finances, planification RH) · 90 modules Substances (faisabilité, plannings, permis, avancement, apports) · 95 séances, PV MO, notes, tâches, PV de chantier · 96 registres d’archives de Facturation (Contrôle du coût, Devis) · 97 documents et courriers · 99 contrôle de concordance (`ctx.verif`, aussi dans le journal ; à relancer seul : `await AT.verifAffaire('99TST')`).

## `ctx` : ce que les modules se passent (noms imposés)

`ctx.me` {user, staff, person} compte courant · `ctx.bureau` {owner, contact} Substances Architectes · `ctx.staff[cle]` {id, owner, person (contact de la personne), nom, ini} · `ctx.mo` {owner, contact, nom, pers:{pres,dir}} · `ctx.commune` idem · `ctx.mand[cle]` {owner, contact, nom, pers} · `ctx.ent[lotK]` = tableau dans l'ordre de `REF.lots[].ent` de {owner, contact, nom, pers:{owner,contact,nom}} · `ctx.pid` · `ctx.phases[n]` (n = 2, 3, 4, 5) · `ctx.sub[n]` (n = 31…53) · `ctx.contrats` {faisa, mandat, variante, expertise} (identifiants Facturation) · chaque fichier décrit en tête ce qu'il ajoute.

## Régénérer dans l'aperçu

Dans la page de l'aperçu (`http://localhost:7797/SUBGestion3.html`), une fois la base de test chargée :

```js
await new Promise((ok,ko)=>{ const s=document.createElement('script'); s.src='/affaire_travail.js?'+Date.now(); s.onload=ok; s.onerror=ko; document.head.append(s); });
await AT.generer();
```

`javascript_tool` s'arrête à 45 s : lancer sans attendre (`AT.generer().then(r=>window.__r=r)`) puis relire `__r`. Durée : ~1 min ; contrôle attendu : `ctx.verif.n === 0`, `journal` « contrôle : 0 écart(s) ». Les identifiants changent à chaque génération (projet compris).

Après chaque construction de l'app, `construire_et_previsualiser.sh 3` réassemble ce générateur dans l'aperçu. Le stockage du navigateur intégré peut se vider à la fermeture de l'app : recharger alors la base de test, puis régénérer.

Écarts de l'app relevés avec cette affaire : `ECARTS_APP.md`.

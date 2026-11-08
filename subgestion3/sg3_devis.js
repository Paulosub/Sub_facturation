/* ═══ DESCRIPTIFS & DEVIS AU GRAPHISME DE L'APP (05.11.2026, bloc 37 ; demande de Paulo : « reproduire graphiquement ce chapitre comme tout le reste
   de l'app, améliore pour rendre plus lisible et simple à utiliser ») ═══
   Le moteur reste celui de DeltaSub.html (positions, calculs, filtre, présentations, impressions, documents) ; DeltaSub.html seul garde ses écrans.
   Liste (VIEWS.devis, ch02dDomain) : page commune de la liste du projet et de tous les projets — bandeau, chiffres, statuts, recherche, tableau ; un clic
   ouvre le devis, clic droit = en-tête, dupliquer, supprimer ; un devis créé s'ouvre aussitôt.
   Devis ouvert (dvEditor enveloppé, éléments du moteur déplacés tels quels) : bandeau jaune, chiffres (totaux), onglets Devis · Documents (ex-Positions). Devis : tableau
   sur toute la largeur (les montants ne sortent plus de l'écran), niveaux CFC lisibles, choix du détail (Tout · 3 · 2 · 1 chiffres), barre en texte réduite à
   l'essentiel, le reste dans Fonctions (sous-menus) ; le plan CFC ne s'ouvre que pour ajouter une position (d'office si le devis est vide). Documents : une ligne
   par document (Devis général, Honoraires, Devis descriptif) avec ses actions, puis les fichiers PDF.
   Fenêtre « Calcul pour <CFC> » (ch02aCalc enveloppé) : bandeau jaune, totaux dedans, tableau qui tient dans la fenêtre, options groupées ; après une saisie, le
   curseur reste dans le tableau (Tab, Entrée, clic : le moteur redessine le tableau à chaque modification et perdait le champ suivant).
   Styles <style id="sgde-css">, classes sgde-* et sgdc-*. Débogage : window.SGDE. */
(function(){
if(typeof ch02dList!=='function'||typeof dvEditor!=='function'||typeof ch02aCalc!=='function'||!window.SGSV||!window.SGSV.outils) return;
const {monter,tete,kpi,btn,lien,menuSous,E,IC,pl,trouve,moT,css}=SGSV.outils;
const CSS=`
.sgde-lt tr.supp td{opacity:.5}
.sgde-lt td.note{max-width:320px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgde-tag{display:inline-block;margin-left:8px;font-size:11px;font-weight:400;color:var(--s-gris);white-space:nowrap}
.sgde{flex:1 1 auto;display:flex;flex-direction:column;min-height:0;height:100%;overflow:hidden;background:#fff}
.sgde.sgde-plein{position:fixed;inset:0;z-index:800;height:auto;padding-top:8px}
.sgde.sgde-plein>.sgde-tete{display:none}
.sgde.sgde-plein .sgde-kp .nx-kpi{padding:4px 12px 6px 0}
.sgde.sgde-plein .sgde-kp .nx-kpi .v{font-size:clamp(11px,calc(2.4cqi - 5.6px),17px);margin-top:2px}
.sgde.sgde-plein .sgde-kp .nx-kpi .s{display:none}
.sgde-tete{flex:none;padding:8px 24px 0}
.sgde-tete .sgfh-tete{margin:0;padding:10px 18px}
.sgde-tete .sgfh-ini{font-size:28px;white-space:nowrap}
.sgde-tete .sgfh-nm{min-width:0}
.sgde-tete .sgfh-nm h2{font-size:20px}
.sgde-kp{flex:none;margin:0 24px;grid-template-columns:86px;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);border-top:0;container-type:inline-size}   /* toujours une seule rangée (Paulo, 07.11.2026 : « toujours sur une ligne, pas de renvoi à la ligne ») ; 1re colonne étroite : précision ; montants : taille qui suit la largeur de la rangée (2.4cqi − 5.6px : 13 signes de 0,52 em tiennent dans une colonne), plafonnée */
.sgde-kp .nx-kpi{padding:10px 12px 10px 0;margin-right:12px;min-width:0}
.sgde-kp .nx-kpi .v{font-size:clamp(11px,calc(2.4cqi - 5.6px),22px);margin-top:5px;white-space:nowrap}
.sgde-kp .nx-kpi .l{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgde-kp .nx-kpi .s{margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgde-ong{flex:none;display:flex;align-items:center;gap:8px 24px;margin:0 24px;border-bottom:1px solid var(--s-filet)}
.sgde-ong .sg-onglets{flex:1 1 auto;margin:0;border:0}
.sgde-niv{flex:none;display:flex;align-items:center;gap:12px;font-size:12px;color:var(--s-gris)}
.sgde-niv button{border:0;background:none;padding:2px 0 3px;font:inherit;font-size:12.5px;color:var(--s-gris);cursor:pointer;white-space:nowrap;font-variant-numeric:tabular-nums}
.sgde-niv button:hover{color:var(--s-noir)}
.sgde-niv button.on{color:var(--s-noir);font-weight:700;box-shadow:inset 0 -2px 0 var(--s-nuit)}
.sgde-bar{flex:none;margin:0 24px;padding:4px 0;min-height:40px;height:auto;gap:2px;flex-wrap:wrap;border:0;background:transparent}
.sgde-bar .ib{border:0!important;background:transparent!important;box-shadow:none!important;border-radius:0!important;height:32px;padding:0 9px;font-size:12.5px;font-weight:700;color:var(--s-noir)}
.sgde-bar .ib:first-child{padding-left:0}
.sgde-bar .ib:hover{background:var(--s-jaune3)!important}
.sgde-bar .ib.on{box-shadow:inset 0 -2px 0 var(--s-nuit)!important}
.sgde-kp .sgde-hreg{border:0;background:none;padding:0;font:inherit;color:var(--s-nuit);text-decoration:underline;text-underline-offset:2px;cursor:pointer}
.sgde .sgde-kp .nx-kpi .s:has(.sgde-hreg){display:block!important}
.sgde .sgde-kp .nx-kpi .s:has(.sgde-npos){display:block!important}   /* nombre total de positions toujours visible, en gris (Paulo, 07.11.2026 : « pour identifier si j'ai des positions vides ») */
.sgde-bar .ib:disabled{color:#b9b9b6}
.sgde-bar .ib .lb{display:inline!important}
.sgde-sep{flex:none;width:1px;height:18px;background:var(--s-filet);margin:0 6px}
.sgde-fin{flex:1 1 auto}
.sgde>.cols{flex:1 1 auto;min-height:0;padding:0 24px 12px;gap:14px}
.sgde>.cols>.col{border:0;background:#fff;box-shadow:none;min-width:0}
.sgde .pane{border:0;background:#fff;box-shadow:none}
.sgde-cfc{flex:0 0 280px!important;width:280px!important;border-right:1px solid var(--s-filet)!important;padding-right:12px}
.sgde-cfc.sgde-ferme{display:none}
.sgde-cfc-t{flex:none;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:4px 0 6px;border-top:2px solid var(--s-noir)}
.sgde-cfc-t b{font-size:13px}
.sgde-x{border:0;background:none;font-size:18px;line-height:1;width:26px;height:26px;cursor:pointer;color:var(--s-gris)}
.sgde-x:hover{color:var(--s-noir);background:var(--s-jaune3)}
.sgde-cfc .ph2{min-height:0;padding:0 0 6px;border:0;background:transparent}
.sgde-cfc .ph2 .ib{height:32px;padding:0 8px 0 0;border:0;background:transparent;font-weight:700}
.sgde-cfc .ph2 .ib:hover{background:var(--s-jaune3)}
.sgde-cfc .ph2 .psearch{flex:1 1 auto;width:auto;min-width:0;height:32px;border:1.5px solid var(--s-noir)}
.sgde-aide{flex:none;font-size:11.5px;color:var(--s-gris);padding:0 0 6px;line-height:1.35}
.sgde-cfc table.g tr.sgde-dans td:last-child::after{content:'';position:absolute;right:6px;top:50%;width:9px;height:5px;margin-top:-5px;border-left:2px solid var(--s-nuit);border-bottom:2px solid var(--s-nuit);transform:rotate(-45deg)}
.sgde-cfc table.g td{position:relative}
.sgde-cfc table.g tr.sgde-dans td:last-child{padding-right:22px}
.sgde-cfc-t .sgde-cfc-g{display:flex;gap:2px;margin-left:auto}
.sgde-cfc-t .sgde-cfc-g button{border:0;background:none;padding:2px 6px;font:inherit;font-size:11.5px;color:var(--s-gris);cursor:pointer}
.sgde-cfc-t .sgde-cfc-g button:hover{color:var(--s-noir);text-decoration:underline}
.sgde-cfc table.g tr.sgde-g1 td{background:var(--s-nuit3)}
.sgde-cfc table.g tr.sgde-g1.on td{background:var(--s-jaune2)!important}
.sgde-tg{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;margin:0 4px 0 -4px;vertical-align:-3px;cursor:pointer;color:var(--s-nuit)}
.sgde-tg::before{content:'';width:0;height:0;border-left:5px solid currentColor;border-top:4px solid transparent;border-bottom:4px solid transparent;transition:transform .12s}
.sgde-tg.ouv::before{transform:rotate(90deg)}
.sgde-tg:hover{background:var(--s-jaune3)}
.sgde-cfc .sgde-nbg{color:var(--s-gris);font-weight:400;font-size:11px;margin-left:6px}
.sgde .ch02-flab{background:var(--s-jaune3)!important;border:0!important;font-size:12px;padding:4px 8px!important}
.sgde table.g thead th{background:#fff!important;border:0!important;border-bottom:2px solid var(--s-noir)!important;font-size:11px;font-weight:700;color:var(--s-gris)!important;padding:8px!important;height:auto!important}
.sgde table.g tbody td{border:0!important;border-bottom:1px solid var(--s-filet)!important;height:30px;padding:0 8px!important;font-size:12.5px}
.sgde table.g tbody tr:hover td{background:var(--s-jaune3)!important}
.sgde table.g tbody tr.on td{background:var(--s-jaune2)!important;color:var(--s-noir)!important}
.sgde table.g tbody tr.on td span{background:transparent!important;color:inherit!important}
.sgde-t tbody td:first-child{font-variant-numeric:tabular-nums}
.sgde-t th:first-child,.sgde-t td:first-child{position:sticky;left:0;z-index:1}
.sgde-t th:nth-child(2),.sgde-t td:nth-child(2){position:sticky;left:68px;z-index:1}
.sgde table.g.sgde-t tbody tr td:nth-child(-n+2){background:#fff}
html[data-visuel="mac"] .sgde table.g.sgde-t tbody tr:nth-child(even) td:nth-child(-n+2){background:var(--p-zb,#fff)}
.sgde-t tr.sgde-nc td.r{font-style:italic}
.sgde-t thead th:nth-child(-n+2){z-index:3}
.sgde-t tbody td span[style*="background"]{background:transparent!important;padding:0!important}
.sgde-t tr.sgde-n1 td{height:32px}
.sgde table.g.sgde-t tbody tr.sgde-n1:nth-child(n) td:nth-child(n){background:var(--s-nuit3)}
.sgde-t tbody tr td:nth-child(2){padding-left:8px!important}   /* tous les textes de la désignation au même bord, celui du titre de la colonne (Paulo, 07.11.2026 : « aligner à Déblaiement… », puis « aligner à Désignation ») : plus de retrait par niveau */
.sgde-t tr.sgde-zero td{color:var(--s-gris)}
.sgde-t tr.sgde-det td{font-size:12px;height:26px;color:var(--s-gris)}
.sgde-t tr.sgde-det td.sgde-dd{white-space:normal;padding-top:4px!important;padding-bottom:4px!important}
.sgde-ddv{display:block;font-style:italic}
.sgde-ddv .t,.sgde-ddv .f{display:block;color:inherit;overflow-wrap:anywhere}
.sgde-ddv .f{margin-top:1px;font-variant-numeric:tabular-nums}
.sgde-t tr.sgde-det td.r{font-variant-numeric:tabular-nums}
.sgde-t tr.sgde-det td.sgde-dsc{line-height:1.45;padding-top:5px!important;padding-bottom:7px!important}
.sgde-t tr.sgde-det td.sgde-dsc i{color:inherit!important}
.sgde-t tr.sgde-ldsc td{vertical-align:top}
/* montant saisi, modifiable (07.11.2026, Paulo, d'après l'écran de l'ancien logiciel : un rectangle pour le montant HT uniquement) : cadre au filet bleu nuit sur fond bleu nuit pâle */
.sgde table.g tbody td.sgde-saisi{position:relative;z-index:0}
.sgde table.g tbody td.sgde-saisi::before{content:'';position:absolute;inset:4px 2px;border:1px solid rgba(0,51,70,.35);background:rgba(0,51,70,.07);z-index:-1;pointer-events:none}
.sgde-leg{display:inline-flex;align-items:center;gap:7px;margin-left:auto;margin-right:18px;font-size:12px;color:var(--s-gris)}
.sgde-leg i{display:inline-block;width:22px;height:11px;border:1px solid rgba(0,51,70,.35);background:rgba(0,51,70,.07)}
.sgde-t tr.sgde-ldsc td:first-child{text-align:right;padding-top:5px!important;padding-right:3px!important}
.sgde-t tr.sgde-ldsc td:first-child .sgde-dlab{font-style:italic;color:var(--s-gris);line-height:1.45}
.sgde-t tr.sgde-cache{display:none}
.sgde-t tbody td.c{text-align:center}
.sgde-vide{padding:18px 8px;font-size:13px;line-height:1.5;color:var(--s-gris);max-width:560px}
.sgde-vide b{display:block;color:var(--s-noir);margin-bottom:2px}
.sgde-docs{display:none;flex:1 1 auto;min-height:0;overflow:auto;padding:0 24px 16px}
.sgde.docs .sgde-docs{display:block}
.sgde.docs>.cols,.sgde.docs>.sgde-bar,.sgde.docs .sgde-niv{display:none}
.sgde .sgde-docs .ch02-dpane{display:block!important;width:auto!important;flex:none!important;border:0;background:#fff;overflow:visible}
.sgde-dl{margin:14px 0 22px;border-top:2px solid var(--s-noir)}
.sgde-dc{display:grid;grid-template-columns:minmax(180px,1fr) auto;gap:6px 18px;align-items:center;padding:10px 0;border-bottom:1px solid var(--s-filet)}
.sgde-dc .t b{display:block;font-size:13.5px}
.sgde-dc .t span{display:block;font-size:12px;color:var(--s-gris);margin-top:1px}
.sgde-dc .a{display:flex;flex-wrap:wrap;gap:2px;align-items:center;justify-content:flex-end}
.sgde-dc .a .ib{border:0;background:transparent;height:30px;padding:0 9px;font-size:12.5px;font-weight:700;color:var(--s-noir)}
.sgde-dc .a .ib:hover{background:var(--s-jaune3)}
.sgde-dc .a .ib:disabled{color:#b9b9b6;opacity:1}
.sgde-docs .ch02-dpane>.ph2{min-height:0;padding:0 0 8px;border:0!important;background:transparent}
.sgde-docs .ch02-dpane>.ph2>b{font-size:14px}
.sgde-docs .ch02-dpane .ib{border:0;background:transparent}
.sgde-docs .ch02-dpane>.ph2{border-top:2px solid var(--s-noir)!important;padding-top:8px}
.sgde-docs .ch02-dpane>.sgde-dh{margin-top:14px}
.sgde-docs .ch02-dpane>.sgde-dh+.sgde-dl{margin-top:0;border-top:0}
.sgde-docs .ch02-dpane>div:not(.ph2):not(.sgde-dl){border:0!important;height:auto!important;min-height:96px}
/* onglet Paramètres (07.11.2026) : catégories l'une sous l'autre, titre puis champs, comme l'onglet Documents */
.sgde-par{display:none;flex:1 1 auto;min-height:0;overflow:auto;padding:0 24px 24px}
.sgde.par .sgde-par{display:block}
.sgde.par>.cols,.sgde.par>.sgde-bar,.sgde.par .sgde-niv{display:none}
/* plein écran dans Documents et Paramètres : la barre garde le seul bouton pour sortir */
.sgde.sgde-plein:is(.par,.docs)>.sgde-bar{display:flex!important}
.sgde.sgde-plein:is(.par,.docs)>.sgde-bar>:not(.sgde-pl):not(.sgde-fin){display:none!important}
.sgde-ps{max-width:980px;margin:14px 0 8px}
.sgde-ps>h3{margin:0;padding:8px 0;border-top:2px solid var(--s-noir);font-size:14px;font-weight:700;display:flex;align-items:baseline;gap:12px}
.sgde-ps>h3 small{font-size:12px;font-weight:400;color:var(--s-gris)}
.sgde-pg{display:grid;grid-template-columns:230px minmax(0,1fr);gap:0 18px;align-items:start}
.sgde-pg>label{padding:15px 0 9px;font-size:13px;color:var(--s-gris);border-bottom:1px solid var(--s-filet)}
.sgde-pg>div{padding:8px 0;border-bottom:1px solid var(--s-filet);min-width:0}
.sgde-pg .inp{width:100%;max-width:520px;box-sizing:border-box}
.sgde-pg .inp.c{max-width:180px}
.sgde-pg select.inp{max-width:520px;height:34px}
.sgde-pg textarea.inp{min-height:96px;resize:vertical}
.sgde-pg .sgde-pr{display:block;margin:5px 0 3px;font-size:13px}
.sgde-pg .sgde-ph{display:block;font-size:12px;color:var(--s-gris);margin-top:3px;line-height:1.4;max-width:620px}
.sgde-pi{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;padding-top:4px}
.sgde-pi b{font-size:22px;font-weight:700;color:var(--s-nuit)}
.sgde-pi span{font-size:13px}
.sgde-par .inp:disabled,.sgde-par input:disabled{background:#fafafa;color:var(--s-noir);opacity:1}
.sgde-pl0{font-size:12px;color:var(--s-gris);margin:10px 0 0}
/* Information : remarques au graphisme des autres sections de la page (champs encadrés, filets entre les lignes, fond blanc ; pas le graphisme du PDF, Paulo, 07.11.2026) */
.sgde-rmr{display:grid;grid-template-columns:230px minmax(0,1fr) 84px;gap:0 18px;align-items:start;padding:8px 0;border-bottom:1px solid var(--s-filet)}
.sgde-rmr .inp{width:100%;max-width:none;box-sizing:border-box}
.sgde-rmr textarea.inp{resize:none;overflow:hidden;line-height:1.45;min-height:34px}
.sgde-rmr .inp.sgde-rmn{border-color:transparent;background:transparent;color:var(--s-gris);font-size:13px;padding-left:0}   /* libellé comme ceux des autres sections ; cadre au survol et en saisie */
.sgde-rmr .inp.sgde-rmn:hover:not(:disabled),.sgde-rmr .inp.sgde-rmn:focus{border-color:var(--s-gris3,#c8c8c8);background:#fff;color:var(--s-noir);padding-left:6px}
.sgde-rmr .sgde-rma{display:flex;gap:2px;justify-content:flex-end;padding-top:4px;opacity:0;transition:opacity .1s}
.sgde-rmr:hover .sgde-rma,.sgde-rmr:focus-within .sgde-rma{opacity:1}
.sgde-rma button{border:0;background:transparent;width:24px;height:24px;cursor:pointer;font-size:14px;color:var(--s-noir)}
.sgde-rma button:hover{background:var(--s-jaune3)}
.sgde-rma button[data-rm="suppr"]:hover{color:var(--s-rouge,#bd1e42)}
.sgde-rmo{color:var(--s-gris)}
.sgde-rml{padding:7px 0;font-size:13px;color:var(--s-gris)}
.sgde-rmc{display:flex;flex-direction:column;gap:4px;min-width:0}
.sgde-rmf{padding:7px 10px 6px;font-size:13px;line-height:1.45;color:var(--s-noir);font-weight:400;border-bottom:1px solid var(--s-noir);margin-bottom:4px}   /* trait sous le titre du projet ; nom au même texte que les cellules (Paulo, 07.11.2026), aligné sur leur texte (filet 1 px + 9 px) */
.sgde-rmo>span{padding:7px 0;font-size:13px}
.sgde-rmp{display:flex;gap:14px;align-items:baseline;flex-wrap:wrap;margin:10px 0 0;font-size:12px;color:var(--s-gris)}
.sgde-rmp .sgde-hreg{font-size:13px}
/* fenêtre « Calcul de la position » = proposition 2 « Tableur » (Paulo, 07.11.2026 : « applique proposition 2 » ; maquette subgestion3/_backup_20261107_maquette_calcul/) :
   bandeau jaune avec le total TTC en grand, réglages de la position dans une bande grise, grille de tableur (numéros de ligne, colonnes groupées Quantité / Prix,
   cellule active encadrée de bleu nuit, cellules calculées sur fond gris), totaux HT / TVA / TTC en pied du tableau, descriptif, aide au clavier dans le pied */
.dlg.sgdc-dlg{width:min(1180px,96vw)!important;max-width:96vw!important;max-height:94vh}
.ov:has(>.dlg.sgdc-dlg){padding-top:3vh}
.dlg.sgdc-dlg>.tt{display:none}
.dlg.sgdc-dlg>.bd{padding:0}
.sgdc-dlg .sgfh-tete{margin:0;border-top:0;padding:14px 24px}
.sgdc-dlg .sgfh-ini{font-size:26px;white-space:nowrap}
.sgdc-dlg .sgfh-nm{min-width:0}
.sgdc-dlg .sgfh-nm h2{font-size:20px}
.sgdc-tot{margin-left:auto;text-align:right;white-space:nowrap}
.sgdc-tot>div:not(.sgdc-ttc){display:none!important}
.sgdc-ttc .l{font-size:11px;font-weight:700;color:var(--s-gris)}
.sgdc-ttc .v{font-size:24px;font-weight:700;color:var(--s-nuit);line-height:1.1;font-variant-numeric:tabular-nums}
.sgdc-ttc .s{margin-top:3px;font-size:11.5px;color:var(--s-gris);font-variant-numeric:tabular-nums}
.sgdc-ttc .s b{color:var(--s-noir);font-weight:700}
.sgdc{padding:0}
.sgdc>div:not(.sgdc-host){padding:10px 24px 0}
.sgdc .seg{margin-bottom:6px}
.sgdc-opts{display:grid!important;grid-template-columns:minmax(0,1fr) 150px 220px auto!important;gap:6px 20px!important;align-items:end!important;margin:0!important;padding:10px 24px 12px;background:var(--s-fond);border-top:1px solid var(--s-noir);border-bottom:1px solid var(--s-filet)}
.sgdc-opts .f{display:flex;flex-direction:column;gap:4px;min-width:0}
.sgdc-opts .f>label,.sgdc-desc>div:first-child{font-size:11px;font-weight:700;color:var(--s-gris);white-space:nowrap}
.sgdc-opts .f input.inp,.sgdc-opts .f select.inp{height:32px;box-sizing:border-box;border:1px solid var(--s-gris3);border-radius:0;width:100%;background:#fff;font-size:13px}
.sgdc-opts .f>div{display:flex;align-items:center;gap:8px;white-space:nowrap;font-size:13px}
.sgdc-opts .f>div input.inp{width:76px!important;text-align:right}
.sgdc-opts .f>div .ib{border:0;background:transparent;height:30px;min-width:26px;padding:0 5px;color:var(--s-nuit)}
.sgdc-opts .f>div .ib:hover{background:var(--s-jaune)}
.sgdc-opts .f>div .ib svg{width:12px;height:12px}
.sgdc-opts>label{height:32px;display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap}
.sgdc-outils{display:flex!important;flex-wrap:nowrap;align-items:center;gap:0!important;margin:0!important;padding:6px 24px 6px;min-height:42px}
.sgdc-outils .ib{border:0;border-radius:0;background:transparent;height:30px;padding:0 8px;font-size:12px;font-weight:700;color:var(--s-noir);gap:5px}
.sgdc-outils .ib:first-child{padding-left:0}
.sgdc-outils .ib:hover{background:var(--s-jaune3)}
.sgdc-outils .ib svg{width:16px;height:16px;flex:none}
.sgdc-sep{width:1px;height:18px;background:var(--s-gris3);margin:0 8px;flex:none}
.sgdc-ref{display:flex;align-items:stretch;flex:0 1 240px;min-width:0;height:28px;border:1px solid var(--s-gris3);font-size:12px;white-space:nowrap;overflow:hidden}
.sgdc-ref:empty{display:none}
.sgdc-ref b{display:flex;align-items:center;padding:0 9px;background:var(--s-nuit);color:#fff;font-weight:700}
.sgdc-ref span{display:flex;align-items:center;flex:none;padding:0 10px;color:var(--s-gris);font-weight:700;border-right:1px solid var(--s-filet)}
.sgdc-ref i{display:block;flex:1 1 auto;line-height:26px;min-width:0;padding:0 10px;font-style:normal;font-variant-numeric:tabular-nums;overflow:hidden;text-overflow:ellipsis}
.sgdc-tab{margin:0 24px;border:0!important;max-height:42vh!important}
.sgdc table.g{table-layout:fixed!important;min-width:900px;width:100%;border-collapse:separate!important;border-spacing:0;font-variant-numeric:tabular-nums}
.sgdc table.g thead th{position:sticky;top:0;z-index:2;background:var(--s-fond)!important;border:0!important;border-right:1px solid var(--s-filet)!important;border-bottom:1px solid var(--s-filet)!important;font-size:11px;font-weight:700;color:var(--s-gris)!important;padding:0 9px!important;height:26px!important;white-space:nowrap;text-align:left;text-transform:none!important;letter-spacing:0!important;font-family:inherit!important}
.sgdc table.g thead tr:first-child th{border-top:2px solid var(--s-noir)!important}
.sgdc table.g thead th:first-child,.sgdc table.g tbody td:first-child{border-left:1px solid var(--s-filet)!important}
.sgdc table.g thead tr.sgdc-grp th{color:var(--s-noir)!important;font-size:11.5px;text-align:center!important;border-bottom-color:var(--s-gris3)!important}
.sgdc table.g thead tr.sgdc-grp th small{font-weight:400;color:var(--s-gris);font-size:11px;margin-left:4px}
.sgdc table.g thead tr:not(.sgdc-grp) th{border-bottom:1px solid var(--s-noir)!important}
.sgdc table.g thead tr:not(.sgdc-grp) th:first-child,.sgdc table.g thead tr.sgdc-grp th:first-child{padding-left:43px!important}
.sgdc table.g tbody{counter-reset:sgdcl}
.sgdc table.g tbody tr{counter-increment:sgdcl}
.sgdc table.g tbody td{border:0!important;border-right:1px solid var(--s-filet)!important;border-bottom:1px solid var(--s-filet)!important;padding:0!important;height:34px;overflow:hidden;font-size:13px;background:#fff}
.sgdc table.g tbody td:first-child{position:relative;padding-left:34px!important}
.sgdc table.g tbody td:first-child::before{content:counter(sgdcl);position:absolute;left:0;top:0;bottom:0;width:34px;display:flex;align-items:center;justify-content:center;background:var(--s-fond);color:var(--s-gris);font-size:11.5px;font-weight:700;border-right:1px solid var(--s-filet)}
.sgdc table.g tbody tr:hover td{background:var(--s-jaune3)}
.sgdc table.g tbody tr:has(>td[style*="background"]) td{background:var(--s-jaune3)!important}
.sgdc table.g tbody tr:has(>td[style*="background"]) td:first-child::before{background:var(--s-nuit);color:#fff}
.sgdc table.g tbody td.sgdc-k{background:var(--s-fond)!important;color:var(--s-gris);padding:0 9px!important}
.sgdc table.g tbody td.sgdc-mt{background:var(--s-fond)!important;font-weight:700;white-space:nowrap;padding:0 9px!important}
.sgdc table.g tbody tr:has(>td[style*="background"]) td.sgdc-k,.sgdc table.g tbody tr:has(>td[style*="background"]) td.sgdc-mt{background:color-mix(in srgb,var(--s-jaune3),var(--s-noir) 5%)!important}
.sgdc table.g tbody tr:has(>td:last-child input:checked) td{color:var(--s-gris)}
.sgdc table.g tbody tr:has(>td:last-child input:checked) td.sgdc-mt{text-decoration:line-through}
.sgdc table.g input.inp,.sgdc table.g select.inp{width:100%!important;height:33px!important;box-sizing:border-box;border:0!important;border-radius:0;background:transparent!important;font-size:13px;padding:0 9px;color:inherit}
.sgdc table.g select.inp{padding-right:4px}
.sgdc table.g input[list]{padding-right:2px}
.sgdc table.g input[list]::-webkit-calendar-picker-indicator{margin:0;opacity:0}
.sgdc table.g input[list]:hover::-webkit-calendar-picker-indicator,.sgdc table.g input[list]:focus::-webkit-calendar-picker-indicator{opacity:.6}
.sgdc table.g thead th:nth-child(10){padding:0 4px!important}
.sgdc table.g input.inp:focus,.sgdc table.g select.inp:focus{outline:2px solid var(--s-nuit);outline-offset:-2px;background:#fff!important}
.sgdc table.g th:nth-child(4),.sgdc table.g th:nth-child(6),.sgdc table.g th:nth-child(7),.sgdc table.g th:nth-child(8),.sgdc table.g th:nth-child(9),.sgdc table.g td:nth-child(4),.sgdc table.g td:nth-child(6) input,.sgdc table.g td:nth-child(7) input,.sgdc table.g td:nth-child(8) input,.sgdc table.g td:nth-child(4) input,.sgdc table.g td:nth-child(9){text-align:right}
.sgdc table.g th:nth-child(10),.sgdc table.g td:nth-child(10){text-align:center}
.sgdc table.g tfoot td{border:0;border-bottom:1px solid var(--s-filet);height:28px;font-size:12.5px;padding:0 9px;background:#fff}
.sgdc table.g tfoot tr:first-child td{border-top:1px solid var(--s-noir)}
.sgdc table.g tfoot tr.fixe td.v{color:var(--s-nuit)}
.sgdc table.g tfoot td.inf{color:var(--s-gris);font-size:12px}
.sgdc table.g tfoot td.lbl{text-align:right;font-weight:700;color:var(--s-gris)}
.sgdc table.g tfoot td.v{text-align:right;font-weight:700;white-space:nowrap}
.sgdc table.g tfoot tr.ttc td{border-top:2px solid var(--s-noir);border-bottom:0;height:34px;font-size:14px}
.sgdc table.g tfoot tr.ttc td.lbl{color:var(--s-noir)}
.sgdc table.g tfoot tr.ttc td.v{color:var(--s-nuit);background:var(--s-jaune2)}
.sgdc-vide{font-size:12.5px;color:var(--s-gris);padding:12px 0}
.sgdc-desc{margin:0!important;padding:14px 24px 4px}
.sgdc-desc>div:first-child{margin-bottom:4px}
.sgdc-desc textarea{width:100%;box-sizing:border-box;border:1px solid var(--s-gris3);border-radius:0;min-height:76px;font-size:13px;line-height:1.5;padding:9px 10px}
.sgdc-dlg>.ft{align-items:center}
.sgdc-aide{margin-right:auto;display:flex;align-items:center;gap:16px;flex-wrap:wrap;font-size:11.5px;color:var(--s-gris)}
.sgdc-aide kbd{display:inline-block;min-width:20px;padding:1px 5px;margin-right:4px;border:1px solid var(--s-gris3);background:#fff;font:inherit;font-size:11px;font-weight:700;color:var(--s-noir);text-align:center}
.sgdc-aide i{display:inline-block;width:14px;height:14px;margin-right:5px;vertical-align:-3px;border:1px solid var(--s-gris3);background:#fff}
.sgdc-aide i.k{background:var(--s-fond)}
.sgdc-aide i.a{border:2px solid var(--s-nuit)}
/* listes « Fichiers PDF » : commentaire, groupes par document (devis) */
.sgpdf .sgpdf-com{color:var(--s-noir);white-space:normal}
/* groupes : intertitre comme les sections de l'app (bleu nuit, filet noir au-dessus), nombre ou « aucun PDF » à côté */
.sgpdf table.g tbody tr.sgpdf-g td{background:#fff!important;color:var(--s-nuit)!important;font-weight:700;font-size:12.5px;height:auto;padding:16px 12px 6px!important;border-top:1px solid var(--s-noir)!important;border-bottom:1px solid var(--s-filet)!important}
.sgpdf table.g tbody tr.sgpdf-g:first-child td{border-top:0!important;padding-top:12px!important}
.sgpdf table.g tbody tr.sgpdf-g td small{font-weight:400;color:var(--s-gris);margin-left:10px;font-size:11.5px}
.sgpdf table.g tbody tr.sgpdf-g.vide td{border-bottom:0!important}
.sgpdf tr.sgpdf-g{pointer-events:none}
/* lignes : icône, nom, commentaire juste à côté, date à droite */
.sgpdf table.g tbody tr:not(.sgpdf-g) td{height:36px;font-size:13px}
.sgpdf table.g tbody tr:not(.sgpdf-g) td:first-child{padding-left:12px!important}
.sgpdf .sgpdf-nom{display:inline-flex;align-items:center;gap:8px;max-width:100%}
.sgpdf .sgpdf-nom svg{width:15px;height:15px;flex:none;color:var(--s-gris)}
.sgpdf table.g tbody tr.on .sgpdf-nom svg{color:var(--s-nuit)}
.sgpdf table.g td.r,.sgpdf table.g th.r{text-align:right;font-variant-numeric:tabular-nums;color:var(--s-gris)}
.sgpdf table.g thead th:first-child{padding-left:12px!important}
.sgde .sgpdf.sgpdf-dv{height:auto!important;min-height:150px;max-height:none!important}
.sgpdf-ta{width:100%;min-width:340px;box-sizing:border-box;resize:vertical;font:inherit;font-size:13px;line-height:1.45;padding:7px 9px}
/* fenêtre d'aperçu des documents du devis (proposition 2, état comme la proposition 1) */
.dlg.sgdv-dlg{width:min(1240px,96vw)!important;max-width:96vw!important;height:92vh;max-height:94vh!important;display:flex;flex-direction:column}
.ov:has(>.dlg.sgdv-dlg){padding-top:3vh!important}
.dlg.sgdv-dlg>.tt,.dlg.sgdv-dlg>.ft{display:none!important}
.dlg.sgdv-dlg>.bd{flex:1;min-height:0;padding:0!important;overflow:hidden!important;display:flex}
.sgdv-garde{display:none}
.sgdv{flex:1;min-width:0;display:flex;flex-direction:column;font-size:13px;color:var(--s-noir)}
.sgdv-tete{flex:none;display:flex;align-items:center;gap:22px;background:var(--s-jaune2);padding:12px 18px 12px 24px;border-bottom:1px solid var(--s-noir)}
.sgdv-ini{align-self:stretch;display:flex;align-items:center;padding-right:18px;border-right:2px solid var(--s-noir);font-size:28px;font-weight:700;color:var(--s-nuit);line-height:1;white-space:nowrap}
.sgdv-nm{flex:1;min-width:0}
.sgdv-nm .lb{font-size:11px;font-weight:700;color:var(--s-gris);margin-bottom:2px}
.sgdv-nm h3{margin:0;font-size:21px;font-weight:700;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgdv-nm .mt{font-size:12px;color:var(--s-gris);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgdv-fig{flex:none;display:flex;flex-direction:column;align-items:flex-start;padding-left:16px;border-left:1px solid var(--s-gris3)}
.sgdv-fig .l{font-size:11px;font-weight:700;color:var(--s-gris)}
.sgdv-fig .v{font-size:22px;font-weight:700;line-height:1.15;font-variant-numeric:tabular-nums}
.sgdv-fig .v.et{display:flex;align-items:center;gap:7px;font-size:15px;height:25px}
.sgdv-fig .v.et i{width:9px;height:9px;background:var(--s-nuit);flex:none}
.sgdv-act{flex:none;display:flex;align-items:center;gap:2px;margin-left:6px}
.sgdv-ib,.sgdv-act .ib.sgdv-moteur{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 10px;border:0!important;border-bottom:2px solid transparent!important;border-radius:0!important;background:none!important;font:inherit;font-size:12.5px;font-weight:700;color:var(--s-noir);cursor:pointer;white-space:nowrap}
.sgdv-ib svg,.sgdv-act .ib svg{width:16px;height:16px;flex:none}
.sgdv-tete .sgdv-ib:hover,.sgdv-act .ib.sgdv-moteur:hover{background:var(--s-jaune)!important}
.sgdv-corps{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 300px}
.sgdv-doc{display:flex;flex-direction:column;min-width:0;min-height:0}
.sgdv-msg{margin:40px auto;color:var(--s-gris);font-size:13px}
.sgdv-seg.dis b{opacity:.45;cursor:default}
.sgdv-reg{display:flex;flex-direction:column;min-height:0;border-left:2px solid var(--s-noir);background:#fff}
.sgdv-rh{flex:none;display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:12px 18px 9px;border-bottom:1px solid var(--s-noir)}
.sgdv-rh h4{margin:0;font-size:15px;font-weight:700}
.sgdv-rh span{font-size:11.5px;color:var(--s-gris);white-space:nowrap}
.sgdv-rb{flex:1;min-height:0;overflow:auto;padding:0 18px 6px}
.sgdv-gt{display:flex;align-items:flex-end;height:26px;padding-bottom:4px;margin-top:4px;border-top:1px solid var(--s-filet);font-size:11px;font-weight:700;color:var(--s-gris)}
.sgdv-gt:first-child{margin-top:0;border-top:0}
.sgdv-ck{display:flex;align-items:flex-start;gap:9px;margin:0 -8px;padding:3px 8px;font-size:12.5px;line-height:16px;cursor:pointer;outline:none}
.sgdv-ck:hover,.sgdv-ck:focus-visible{background:var(--s-jaune3)}
.sgdv-ck.ind{padding-left:31px}
.sgdv-ck.dis{opacity:.45;cursor:default}
.sgdv-ck>span:not(.sgdv-cb){flex:1;min-width:0}
.sgdv-cb{flex:none;width:14px;height:14px;margin-top:1px;display:grid;place-items:center;border:1.5px solid var(--s-noir);background:#fff}
.sgdv-cb svg{display:none;width:11px;height:11px;color:#fff}
.sgdv-ck.on .sgdv-cb{background:var(--s-nuit);border-color:var(--s-nuit)}
.sgdv-ck.on .sgdv-cb svg{display:block}
.sgdv-ck.vient{background:var(--s-jaune2);box-shadow:inset 3px 0 0 var(--s-nuit)}
.sgdv-ck em{flex:none;font-style:normal;font-size:11px;font-weight:700;color:var(--s-nuit)}
.sgdv-sg{display:flex;align-items:center;gap:10px;padding:3px 0;font-size:12.5px}
.sgdv-sg>span{flex:none;width:66px}
.sgdv-seg{flex:1;display:flex;flex-wrap:wrap;border:1px solid var(--s-gris3)}
.sgdv-seg b{flex:1 1 auto;height:24px;display:grid;place-items:center;padding:0 8px;border-left:1px solid var(--s-gris3);background:#fff;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;outline:none}
.sgdv-seg b:first-child{border-left:0}
.sgdv-seg b:hover,.sgdv-seg b:focus-visible{background:var(--s-jaune3)}
.sgdv-seg b.on{background:var(--s-nuit);color:#fff;cursor:default}
.sgdv-rf{flex:none;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 18px;border-top:1px solid var(--s-filet);background:var(--s-fond)}
.sgdv-rf span{font-size:11.5px;color:var(--s-gris)}
.sgdv-btn{height:34px;min-width:96px;padding:0 18px;border:2px solid var(--s-nuit);background:var(--s-nuit);font:inherit;font-size:13px;font-weight:700;color:#fff;cursor:pointer;border-radius:0}
.sgdv-btn:hover{background:var(--s-nuit2);border-color:var(--s-nuit2)}
@media (max-width:980px){.sgdv-corps{grid-template-columns:minmax(0,1fr) 250px}.sgdv-fig{display:none}}
@media (max-height:860px){.sgdc-opts{padding:8px 24px 10px}.sgdc-desc{padding-top:10px}.sgdc-desc textarea{min-height:52px}.sgdc-ttc .v{font-size:21px}}
@media (max-height:860px){.sgde-tete .sgfh-meta{display:none}.sgde-tete .sgfh-tete{padding:6px 14px}.sgde-tete .sgfh-ini{font-size:22px}.sgde-tete .sgfh-nm h2{font-size:17px}.sgde-tete .sgfh-nm .lb{margin:0}.sgde-kp .nx-kpi{padding:6px 12px 6px 0}.sgde-kp .nx-kpi .v{font-size:clamp(11px,calc(2.4cqi - 5.6px),18px);margin-top:3px}.sgde-kp .nx-kpi .s{display:none}.sgdc-dlg .sgfh-tete{padding:8px 24px}.sgdc-tab{max-height:36vh!important}}
@media (max-width:980px){.sgde-cfc{flex-basis:260px!important;width:260px!important}.sgde-dc{grid-template-columns:1fr}.sgde-dc .a{justify-content:flex-start}.sgdc-opts{grid-template-columns:1fr 1fr!important}}
`;
const cssD=()=>{ css(); if(!document.getElementById('sgde-css')){ const s=document.createElement('style'); s.id='sgde-css'; s.textContent=CSS; document.head.appendChild(s); } };
const el=(t,c,x)=>{ const e=document.createElement(t); if(c) e.className=c; if(x!=null) e.innerHTML=x; return e; };
const num2=n=>{ try{ return num(n); }catch(_){ return String(n); } };
const ecrit=()=>{ try{ return !!sgDroit('chantier','ecriture'); }catch(_){ return true; } };
const prj=d=>DS.get('project',d.PROJECT_ID)||{};
const BESOIN=['costestimate','costestimatedocument','project'];
const ouvrir=d=>ch02dOpen(d,VIEW&&VIEW.id!=='devis'?{view:VIEW.id,arg:VIEW.arg}:null);
const nouveau=q=>ch02dEditDoc(q,null,x=>{ if(x) ouvrir(x); });
/* colonnes de l'export de la liste : mêmes colonnes que le tableau */
const colsListe=G=>[...(G?[{k:'pn',t:'N° d’affaire',f:d=>E(prj(d).NUMBER||'')}]:[]),{k:'VERSION',t:'Version'},{k:'VERSIONNUMBER',t:'N° de version'},{k:'st',t:'Statut',f:d=>E(DV_STATE[d.STATECODE]||'')},{k:'NOTE',t:'Note'},{k:'tot',t:'Total TTC',f:d=>{ const v=ch02dTot(d.ID); return v==null?'':E(num2(v)); }},{k:'dt',t:'Modifié',f:d=>E(dfr(d.CHANGEDDATE))},{k:'USERID',t:'Par'}];
const DEVI={
  rendre(I){ cssD(); const p=I.p, u=I.u, G=!!p.GLOBAL, tous=(G?DS.all('costestimatedocument'):DS.by('costestimatedocument','PROJECT_ID',p.ID)).filter(d=>!G||!u.mine||d.USERID===ME.id), vivant=tous.filter(d=>!+d.ISMARKEDASDELETED), base=u.supp?tous:vivant, parSt=[...new Set(base.map(d=>+d.STATECODE||0))].sort(), ec=ecrit();
    if(u.statut!=null&&!parSt.includes(u.statut)) u.statut=null;   /* statut disparu de la liste : ses boutons aussi, le filtre ne reste pas actif */
    const st=u.statut??null;
    const R=base.filter(d=>(st==null||+d.STATECODE===st)&&trouve(u.q,d.VERSION,d.NOTE,d.USERID,d.VERSIONNUMBER,DV_STATE[d.STATECODE],G?prj(d).NUMBER:'',G?prj(d).TITLE:'')).sort((a,b)=>cmp(b.CHANGEDDATE,a.CHANGEDDATE)||(+b.ID-+a.ID)); I.R=R;
    const nV=vivant.filter(d=>+d.STATECODE===2).length, nP=vivant.filter(d=>[0,1].includes(+d.STATECODE||0)).length, dern=vivant.slice().sort((a,b)=>cmp(b.CHANGEDDATE,a.CHANGEDDATE)||(+b.ID-+a.ID))[0]||null, totD=dern?ch02dTot(dern.ID):null, mo=moT(p);
    const acts=(ec?btn('new','Nouveau devis','plus',1):'')+'<button class="nx-btn" data-a="menu" title="Autres actions" aria-label="Autres actions">⋯</button>';
    const teteP=G?tete('DG','Devis généraux','Descriptifs & devis',pl(vivant.length,'devis','devis')+' · tous les projets',acts):tete(p.NUMBER||'','Devis généraux',p.TITLE||'',[mo?'Maître de l’ouvrage : '+mo:'',pl(vivant.length,'devis','devis')].filter(Boolean).join(' · '),acts);
    if(!vivant.length&&!u.supp&&!(G&&u.mine)) return '<div class="sgsv">'+teteP+'<div class="sgsv-vide"><b>'+(G?'Aucun devis.':'Aucun devis pour ce projet.')+'</b><br>Un devis général chiffre l’ouvrage par CFC : positions, quantités, prix, puis documents et impressions.'+(ec?'<div class="acts">'+btn('new','Nouveau devis','plus',1)+'</div>':'')+'</div></div>';
    return '<div class="sgsv">'+teteP
      +'<div class="nx-kpis sgsv-kp">'+kpi('Devis',String(vivant.length),G?'tous les projets':'versions du projet')+kpi('Validés',String(nV),'')+kpi('En préparation',String(nP),'brouillons et provisoires')+(G?kpi('Projets',String(new Set(vivant.map(d=>d.PROJECT_ID)).size),'avec un devis'):kpi('Dernier devis',totD==null?'—':num2(totD)+'<small>CHF TTC</small>',dern?E(dern.VERSION||''):''))+kpi('Dernière modification',dern&&dern.CHANGEDDATE?dfr(dern.CHANGEDDATE):'—',dern&&dern.USERID?'par '+E(dern.USERID):'')+'</div>'
      +'<div class="sgsv-fil">'+(G?[['0','Tous'],['1','Mes devis']].map(([v,t])=>'<button data-a="mine" data-v="'+v+'" class="'+((+v===1)===!!u.mine?'on':'')+'">'+t+'</button>').join('')+'<span style="width:10px"></span>':'')
      +(parSt.length>1?[['','Tous les statuts'],...parSt.map(c=>[c,DV_STATE[c]||String(c)])].map(([c,t])=>{ const v=c===''?null:+c; return '<button data-a="statut" data-c="'+c+'" class="'+(v===st?'on':'')+'" aria-pressed="'+(v===st)+'">'+E(t)+'</button>'; }).join(''):'')
      +'<span class="dr"><input class="inp" data-q type="search" style="width:240px" placeholder="Rechercher un devis" aria-label="Rechercher un devis" value="'+E(u.q||'')+'"></span></div>'
      +(R.length?'<table class="nx-tbl sgsv-tb sgde-lt"><thead><tr>'+(G?'<th>Projet</th>':'')+'<th>Version</th><th class="r">N°</th><th>Statut</th><th>Note</th><th class="r">Total TTC</th><th>Modifié</th><th>Par</th></tr></thead><tbody>'
        +R.map(d=>{ const v=ch02dTot(d.ID), nt=d.NOTE||''; return '<tr data-a="open" data-d="'+d.ID+'"'+(+d.ISMARKEDASDELETED?' class="supp"':'')+'>'+(G?'<td class="nw" title="'+E(prj(d).TITLE||'')+'">'+E(prj(d).NUMBER||'')+'</td>':'')+'<td><b>'+E(d.VERSION||'(sans titre)')+'</b>'+(+d.ISAPPLYSUBPROJECTS?'<span class="sgde-tag">subdivisions</span>':'')+(+d.ISMARKEDASDELETED?'<span class="sgde-tag">supprimé</span>':'')+'</td><td class="r">'+E(d.VERSIONNUMBER??'')+'</td><td class="nw">'+E(DV_STATE[d.STATECODE]||'')+'</td><td class="note" title="'+E(nt)+'">'+E(nt)+'</td><td class="r nw">'+(v==null?'—':E(num2(v)))+'</td><td class="nw">'+E(dfr(d.CHANGEDDATE))+'</td><td class="nw">'+E(d.USERID||'')+'</td></tr>'; }).join('')+'</tbody></table>'
        :'<p class="sgsv-rien">Aucun devis trouvé.</p>')+'</div>'; },
  action(I,a,t,e){ const p=I.p, u=I.u, d=t.dataset.d?DS.get('costestimatedocument',t.dataset.d):null;
    if(a==='new'){ if(p.GLOBAL) pickProject(CH02D_L.pickP,q=>nouveau(q)); else nouveau(p); }
    else if(a==='open'){ if(d&&!(e&&e.detail>1)) ouvrir(d); }
    else if(a==='mine'){ u.mine=t.dataset.v==='1'; u.statut=null; I.dessiner(); }
    else if(a==='statut'){ u.statut=t.dataset.c===''?null:+t.dataset.c; I.dessiner(); }
    else if(a==='menu'){ const g=()=>({cols:colsListe(!!p.GLOBAL),view:I.R||[]}), ec=ecrit();
      menuSous(t,[{t:CH02D_L.delShown,chk:!!u.supp,fn:()=>{ u.supp=!u.supp; I.dessiner(); }},...(ec?['-',{t:CH02D_L.impInt,fn:()=>{ if(p.GLOBAL) pickProject(CH02D_L.pickP,q=>ch02dImportFromProject(q)); else ch02dImportFromProject(p); }}]:[]),'-',{t:CH02D_L.tblCopy,fn:()=>copyTable(g())},{t:CH02D_L.tblCsv,fn:()=>csvTable(g(),'Devis')}]); } },
  ctx(I,t,e){ if(t.dataset.a!=='open') return false; const d=DS.get('costestimatedocument',t.dataset.d); if(!d) return false; const def=!!+d.ISMARKEDASDELETED;
    sgMenuAt(e.clientX,e.clientY,[{t:'Ouvrir le devis',fn:()=>ouvrir(d)},...(ecrit()?[{t:'Modifier l’en-tête…',fn:()=>ch02dEditDoc(prj(d),d)},{t:'Dupliquer…',fn:()=>ch02dDuplicate(d)},...(ch02dSps(d.PROJECT_ID).length?[{t:CH02D_L.match+' …',fn:()=>ch02dMatchStructure(d)}]:[]),'-',{t:def?'Supprimer définitivement…':'Supprimer…',danger:true,fn:()=>ch02dDelete(d)}]:[])]); return true; } };
ch02dDomain=function(C,top,pane,p){ monter(C,p,'devis',BESOIN,DEVI); };
{ const V=VIEWS.devis, r0=V.render; V.render=function(m,arg){ if(!DS.loaded.has('costestimate')||DV.open) return r0.call(this,m,arg); this.list=null; monter(m,{ID:'tous',GLOBAL:1,NUMBER:'',TITLE:''},'devisg',BESOIN,DEVI); }; }

/* ── devis ouvert : éléments du moteur déplacés tels quels, ses gestionnaires restent ── */
const lib=(b,t)=>{ const s=b.querySelector('.lb'); if(s) s.textContent=t; else b.querySelector('.dd')?b.querySelector('.dd').insertAdjacentHTML('beforebegin','<span class="lb">'+E(t)+'</span>'):b.insertAdjacentHTML('beforeend','<span class="lb">'+E(t)+'</span>'); return b; };
const niv0=()=>{ try{ const v=+localStorage.getItem('sg3_devis_niv'); return [1,2,3].includes(v)?v:0; }catch(_){ return 0; } };
const LARG_POS={cfc:68,ht:108,tva:94,ttc:116,pct:52};
/* tableau des positions après chaque dessin du moteur : largeurs, niveaux CFC, détail choisi */
function deco(X){ const S=X.sgde, rp=X.rp, t=rp&&rp.querySelector('table.g'); if(!S||!t) return; t.classList.add('sgde-t');
  const cols=X.R2.cols||[], cg=[...t.querySelectorAll('colgroup col')], th=t.querySelectorAll('thead th'); let mini=0;
  cols.forEach((c,i)=>{ const w=c.k==='d'?0:LARG_POS[c.k]||+c.w||0; if(cg[i]) cg[i].style.width=w?w+'px':''; mini+=w||(S.cfc?170:340); if(c.k==='pct'&&th[i]) th[i].textContent='%'; if(c.k==='hon'&&th[i]) th[i].textContent='Montant soumis HT'; });   /* soumis aux honoraires = hors taxe (Paulo, 07.11.2026 : « indiquer si HT ou TTC ») */
  t.style.minWidth=mini+'px';
  const V=new Map((X.R2.view||[]).map(r=>[String(r.det?r.k:r.p.cfc),r]));
  /* lignes de calcul (Présentation ▸ avec les lignes de calcul, 07.11.2026, Paulo : « le calcul des prix ne s'affiche pas ») : le moteur les écrit dans les colonnes Commentaire et
     Descriptif, tout à droite, hors de l'écran ; elles sont montrées sous leur position — texte et quantité × prix unitaire dans la désignation, montants dans leurs colonnes */
  const ix={}; cols.forEach((c,i)=>{ ix[c.k]=i; }); const sep=ch02aSep(X), arr=ch02aRnd(X.E), f=x=>num(ch02aR(x,arr)), modif=ecrit()&&ch02aCanEdit(ch02aHdr(X));
  /* contenu écrit par les colonnes (ligneCalc, enveloppe de ch02aDraw) : ici seulement la présentation, l'infobulle et la couleur des chiffres saisis */
  const calc=(tr,r)=>{ const L=ligneCalc(X,r), d=ix.d!=null?tr.cells[ix.d]:null; if(d){ d.classList.add('sgde-dd'); d.title=[L.txt,L.note,L.form?L.form+' = '+f(L.v.ht)+(sep?' HT':''):''].filter(Boolean).join('\n'); }
    if(!L.compte) tr.classList.add('sgde-nc'); };
  t.querySelectorAll('tbody tr[data-k]').forEach(tr=>{ const r=V.get(tr.dataset.k); if(!r) return; const n=r.det?r.n:r, lv=cfcLevel(n.p.cfc);
    tr.classList.add('sgde-n'+lv); tr.classList.toggle('sgde-det',!!r.det); tr.classList.toggle('sgde-cache',!!S.niv&&lv>S.niv); tr.classList.toggle('sgde-zero',!r.det&&!n.ttc&&!n.opt);
    if(r.det) try{ if(r.dsc){ const d=ix.d!=null?tr.cells[ix.d]:null; if(d) d.classList.add('sgde-dd','sgde-dsc'); tr.classList.add('sgde-ldsc'); } else calc(tr,r); }catch(e){ console.error(e); }
    /* montant saisi, modifiable dans la fenêtre de calcul (Paulo, 07.11.2026 : d'abord « une couleur différente », puis « un rectangle pour le montant HT uniquement », comme
       l'ancien logiciel) : positions qui ont un calcul ; seulement avec le droit d'écrire */
    if(modif&&!r.det&&n.leaf){ const c=tr.cells[ix.ht!=null?ix.ht:ix.ttc]; if(c&&c.textContent.trim()){ c.classList.add('sgde-saisi'); c.title='Montant saisi : double-cliquez sur la position pour le modifier'; } }   /* montant HT des positions qui ont un calcul (sans colonne HT : le montant TTC) */
  });
  const cachee=t.querySelector('tbody tr.on.sgde-cache');
  if(cachee){ if(S.vu!==X.st.sel){ S.niv=0; if(S.dessNiv) S.dessNiv(); t.querySelectorAll('.sgde-cache').forEach(x=>x.classList.remove('sgde-cache')); cachee.scrollIntoView({block:'nearest'}); }   /* position ajoutée ou choisie dans le plan CFC : le détail s'ouvre pour la montrer */
    else { X.st.sel=null; X.R2.sel=null; cachee.classList.remove('on'); ch02aUpd(X); } }   /* sinon elle n'est plus choisie : rien n'agit sur une ligne invisible */
  S.vu=X.st.sel;
  const vide=!(X.E.positions||[]).length, msg=rp.querySelector('.sgde-vide');
  if(vide&&!msg) rp.append(el('div','sgde-vide','<b>Ce devis n’a pas encore de position.</b>Choisissez un CFC dans le plan à gauche et double-cliquez dessus pour l’ajouter.')); else if(!vide&&msg) msg.remove(); }
/* colonnes fixes N° et Désignation (07.11.2026) : fond opaque sur toutes les lignes — la règle des lignes alternées de sg3.css (fond transparent) passait avant elles, les
   montants se voyaient au travers en faisant défiler le tableau. Présentations « Toutes les colonnes » et « … avec le calcul de prix » sans la colonne Descriptif (Paulo,
   même jour) : elle reste dans « Avec le descriptif » ; copie et CSV suivent les colonnes affichées */
/* « Avec le descriptif » (07.11.2026, Paulo : « le descriptif sera indiqué sous le CFC concerné, et pas dans une colonne ») : une ligne sous chaque position qui a un descriptif,
   texte dans la désignation (copie et CSV le gardent) ; ordre fixe, comme les lignes de calcul (pas de tri par colonne) */
/* « Avec le descriptif et le calcul de prix » (Paulo, 07.11.2026 : « ajoute avec le descriptif avec le calcul de prix ») : colonnes de « Avec le descriptif » (sans les colonnes
   d'honoraires), sous chaque position son descriptif puis ses lignes de calcul, comme « Toutes les colonnes avec le calcul de prix ». Présentation propre à SUBGestion 3 :
   displayMode 4 du moteur + reglages.affichage.sgCalc (DeltaSub.html seul : « Avec le descriptif ») */
const calcDesc=E=>ch02aMode(E)===4&&!!((((E||{}).reglages||{}).affichage||{}).sgCalc);
{ const cd0=ch02aDraw; ch02aDraw=function(X){ const m=X&&X.E?ch02aMode(X.E):-1; if(m!==1&&m!==3&&m!==4) return cd0.apply(this,arguments); const c4=calcDesc(X.E);
    const g0=grid; grid=function(el,o){ if(el===X.rp&&o&&Array.isArray(o.cols)){ o.cols=o.cols.filter(c=>c.k!=='desc'&&c.k!=='com');   /* colonne Commentaire retirée aussi (Paulo, 07.11.2026) */
        if(Array.isArray(o.rows)){   /* descriptif sous le CFC dans les trois présentations qui le montraient en colonne (Paulo, 07.11.2026 : « ajoute le descriptif sous le CFC ») : juste sous la position, avant ses lignes de calcul */ const cd=o.cols.find(c=>c.k==='d'); if(cd&&!cd._sgde){ const f0=cd.f; cd.f=r=>r&&r.dsc?'<i style="color:#666">'+esc(r.txt).replace(/\n/g,' <br>')+'</i>':f0(r); cd._sgde=1; }
          const cn=o.cols.find(c=>c.k==='cfc'); if(cn&&!cn._sgde){ const f1=cn.f; cn.f=r=>r&&r.dsc?'<i class="sgde-dlab">Desc.</i>':f1(r); cn._sgde=1; }   /* « Desc. » dans la colonne N°, à gauche du texte (Paulo, 07.11.2026) */
          if(m===3||c4){ const det=r=>r&&r.det&&!r.dsc, cdd=o.cols.find(c=>c.k==='d');   /* lignes de calcul : texte et montants dans les colonnes elles-mêmes (affichage, copie, CSV) */
            if(cdd&&!cdd._sgdc){ const f2=cdd.f; cdd.f=r=>{ if(!det(r)) return f2(r); const L=ligneCalc(X,r); return '<div class="sgde-ddv"><span class="t">'+esc(L.txt||'Ligne de calcul')+(L.note?' ('+esc(L.note)+')':'')+'</span> '+(L.form?'<span class="f">'+esc(L.form)+'</span>':'')+'</div>'; }; cdd._sgdc=1; }
            ['ht','tva','ttc'].forEach(k=>{ const c=o.cols.find(x=>x.k===k); if(!c||c._sgdc) return; const f3=c.f; c.f=r=>det(r)?ligneCalc(X,r).mt(ligneCalc(X,r).v[k]):f3(r); c._sgdc=1; }); }
          const R=[]; o.rows.forEach(r=>{ R.push(r); if(r&&!r.det&&r.p){ const t=String(ch02aDesc(r.p)||'').trim(); if(t) R.push({det:true,dsc:true,n:r,pt:{},l:{},txt:t,k:'x|'+r.p.cfc});
            if(c4&&r.leaf) (r.p.parts||[]).forEach((pt,pi)=>(pt.lignes||[]).forEach((l,li)=>R.push({det:true,n:r,pt,l,k:'d|'+r.p.cfc+'|'+pi+'|'+li}))); } });   /* lignes de calcul, comme le moteur en mode 3 */
          o.rows=R; o.sort=null; if(o.state) o.state.sort=null; } }
      return g0.apply(this,arguments); };
    try{ const r=cd0.apply(this,arguments); if(X.rp) X.rp.querySelectorAll('thead th').forEach(th=>{ th.onclick=null; th.classList.remove('sort'); }); return r; }finally{ grid=g0; } }; }
/* ligne de calcul (présentation « … avec le calcul de prix ») : texte, quantité × prix unitaire, montants comme dvCompute — facteur du filtre d'ouvrage appliqué ; variante et partie
   « Exclure » non comptées (montants entre parenthèses) ; partie à coût fixé signalée (le coût fixé remplace la somme de ses lignes) */
function ligneCalc(X,r){ const l=r.l||{}, pt=r.pt||{}, q=+l.qte||0, F=X.filter, ouv=(r.n.p.parts||[]).length>1&&pt.ouv?String(pt.ouv):'';
  const k=(()=>{ if(!F||!F.length||pt.ouv==null) return 1; const x=F.find(y=>y.ouv===pt.ouv); if(!x||!x.actif) return 0; return x.facteur==null||x.facteur===''||!isFinite(+x.facteur)?1:+x.facteur; })();
  const v0=dvLine(l), v={ht:v0.ht*k,ttc:v0.ttc*k,tva:v0.tva*k}, compte=!l.var&&pt.mode!=='exclure', arr=ch02aRnd(X.E), fx=x=>num(ch02aR(x,arr));
  const note=[l.var?'variante, non comptée':'',pt.mode==='exclure'?'partie exclue du total':'',pt.fixe&&pt.fixe.ttc!=null?'coût fixé de la partie : '+fx(+pt.fixe.ttc)+' TTC':'',k!==1?'filtre des ouvrages × '+num(k,2):''].filter(Boolean).join(' · ');
  return {txt:[ouv,String(l.commentaire||'').trim()].filter(Boolean).join(' · '),form:Math.abs(q)<5e-10?'':ch02aJd(q)+' '+(l.unite||'')+' × '+num(+l.prixHT||0),v,compte,note,fx,
    mt:x=>compte?fx(x):'('+fx(x)+')'}; }
/* plan CFC : niveaux, coche sur les CFC déjà dans le devis */
function decoCat(X){ const L=X.L, t=L&&L.pane.querySelector('table.g'); if(!t) return; const cs=new Set((X.E.positions||[]).map(p=>String(p.cfc))), byId=new Map((X.catPos||[]).map(c=>[String(c.ID),String(c.CODE)]));
  t.querySelectorAll('tbody tr[data-k]').forEach(tr=>{ const c=byId.get(tr.dataset.k); tr.classList.toggle('sgde-dans',c!=null&&cs.has(c)); tr.classList.toggle('sgde-g1',c!=null&&cfcLevel(c)===1); });
  if(L.pane._sgdeX) t.querySelectorAll('thead th').forEach(th=>{ th.onclick=null; th.classList.remove('sort'); }); }   /* plan en groupes : ordre du plan CFC, pas de tri par colonne */
/* plan CFC en groupes de CFC à 1 chiffre (07.11.2026, Paulo : « créer des groupes de CFC à 1 chiffre, permettre de réduire ou agrandir ») : ordre du plan CFC (0, 00, 000, 001, 01…, 1, 10…),
   flèche sur chaque CFC à 1 chiffre, groupes réduits d'office, ouverts gardés (sg3_devis_cfc_ouv) ; une recherche montre tous les CFC trouvés ; double-clic inchangé (ajoute le CFC) */
const CFC_OUV='sg3_devis_cfc_ouv';
const ouvertsCfc=()=>{ try{ const v=JSON.parse(localStorage.getItem(CFC_OUV)||'[]'); return new Set(Array.isArray(v)?v.map(String):[]); }catch(_){ return new Set(); } };
const garderOuverts=S=>{ try{ localStorage.setItem(CFC_OUV,JSON.stringify([...S])); }catch(_){ } };
const grpCfc=c=>String(c==null?'':c).trim().charAt(0);
function planGroupes(X,o){ if(o.rows&&o.rows._sgde) return o;   /* déjà traité (même o redonné à grid) */
  const q=String((X.L&&X.L.q)||'').trim(), R=o.rows.slice().sort((a,b)=>cfcCmp(a.CODE,b.CODE)), nb={}, tete={};
  R.forEach(c=>{ const g=grpCfc(c.CODE); nb[g]=(nb[g]||0)+1; if(cfcLevel(c.CODE)===1) tete[g]=true; });
  const ouv=ouvertsCfc(), vu=c=>{ const g=grpCfc(c.CODE); return !!q||cfcLevel(c.CODE)===1||!tete[g]||ouv.has(g); };   /* groupe sans CFC à 1 chiffre dans le plan : toujours ouvert (rien pour le replier) */
  const cols=(o.cols||[]).map(c=>Object.assign({},c)), c0=cols[0], c1=cols[1];
  if(c0&&!q){ const f0=c0.f; c0.f=c=>{ const g=grpCfc(c.CODE); return cfcLevel(c.CODE)===1&&nb[g]>1?'<span class="sgde-tg'+(ouv.has(g)?' ouv':'')+'" data-g="'+E(g)+'" title="'+(ouv.has(g)?'Réduire':'Agrandir')+' le groupe '+E(g)+'" role="button" aria-expanded="'+ouv.has(g)+'"></span>'+f0(c):f0(c); }; }
  if(c1&&!q){ const f1=c1.f; c1.f=c=>{ const g=grpCfc(c.CODE); return cfcLevel(c.CODE)===1&&nb[g]>1?f1(c)+'<span class="sgde-nbg">'+(nb[g]-1)+'</span>':f1(c); }; }
  const rows=R.filter(vu); rows._sgde=1; if(o.sel!=null&&!rows.some(c=>String(c.ID)===String(o.sel))) o.sel=null;   /* CFC choisi puis groupe réduit : plus choisi (« + » n'ajoute pas une ligne invisible) */
  if(o.state) o.state.sort=null; return Object.assign(o,{rows,cols,sort:null}); }
{ const gP=grid; grid=function(el,o){ const X=el&&el._sgdeX; if(X&&o&&Array.isArray(o.rows)) try{ o=planGroupes(X,o); }catch(e){ console.error(e); } return gP.call(this,el,o); }; }
/* Soumis aux honoraires, règle du bureau (Paulo, 07.11.2026 : « définir tous les postes à 100 % pour les honoraires, hormis le CFC 5 et les honoraires ; doit être compris dans
   le montant le CFC 583 ») : 100 % partout ; 0 % pour le CFC 5 (frais secondaires et comptes d'attente) et les honoraires (CFC 09, 19, 29, 39, 49, 99 ; le 59 est dans le 5) ;
   le CFC 583 (réserves pour imprévus) compris à 100 %. Appliquée d'office aux positions ajoutées depuis la liste CFC (dvNewParts enveloppé, CODE_NEUF), et sur demande à tout
   le devis (Fonctions ▸ Modifier les montants, ou le lien sous « Soumis aux honoraires » quand des positions s'en écartent). */
const honRegle=cfc=>{ const c=String(cfc==null?'':cfc).replace(/[^0-9]/g,''); if(c.startsWith('583')) return 100; if(c.startsWith('5')) return 0; if(c.length>=2&&c[1]==='9') return 0; return 100; };
const horsRegle=E=>(E&&E.positions||[]).filter(p=>!p.genere&&(p.parts||[]).some(pt=>(+pt.honorPct||0)!==honRegle(p.cfc)));
let CODE_NEUF=null;
{ const nP0=dvNewParts; dvNewParts=function(E){ const r=nP0.apply(this,arguments); if(CODE_NEUF!=null&&Array.isArray(r)) r.forEach(pt=>{ if(pt) pt.honorPct=honRegle(CODE_NEUF); }); return r; }; }
const regleHon=X=>{ if(!ch02aCan(X)) return; const E=X.E, L=horsRegle(E);
  if(!L.length){ toast('Toutes les positions suivent déjà la règle des honoraires.'); return; }
  let av=0, ap=0; try{ av=dvCompute(E,X.filter).T.hon; const C=ch02aClone(E); (C.positions||[]).forEach(p=>{ if(!p.genere) (p.parts||[]).forEach(pt=>{ pt.honorPct=honRegle(p.cfc); }); }); ap=dvCompute(C,X.filter).T.hon; }catch(e){ console.error(e); }
  sgConfirm('Soumis aux honoraires selon la règle du bureau : 100 % pour tous les CFC, 0 % pour le CFC 5 (frais secondaires) et les honoraires (CFC 09, 19, 29, 39, 49, 99), le CFC 583 (réserves pour imprévus) compris à 100 %.\n\n'
    +L.length+(L.length>1?' positions changent':' position change')+' de pourcentage.\nMontant soumis : '+num2(av)+' → '+num2(ap)+' CHF HT'+(X.filter&&X.filter.length?' (filtre actif)':'')+'.',
    ()=>{ if(!ch02aCan(X)) return; const n=horsRegle(X.E); n.forEach(p=>(p.parts||[]).forEach(pt=>{ pt.honorPct=honRegle(p.cfc); })); X.touch(); toast('Règle des honoraires appliquée à '+n.length+(n.length>1?' positions.':' position.')); },
    {title:'Soumis aux honoraires',yesText:'Appliquer'}); };
/* Honoraires d'architecte repris du contrat signé (Paulo, 07.11.2026 : « reprends le principe que l'on avait travaillé sur le devis classé dans archives », choix « tout le principe ») —
   même règle que le devis de Facturation (Archives ▸ Devis : dvHonContrat, dvHonSync, dvHonReinit, dvValideTog) : contrats d'honoraires de l'affaire non annulés (sgContratsDuProjet),
   montants de la version courante si elle est signée, sinon de la dernière version signée ; contrat partiel (somme des % des phases entre 0 et 100) → montant extrapolé à 100 % et arrondi
   au franc. Position CFC 291 tenue à jour d'office par UNE ligne de calcul marquée (l.sgHon = {v: TTC repris}) à l'ouverture du devis : créée si la position manque ou n'a aucune ligne,
   mise à jour si la ligne n'a pas été changée. Pas de mise à jour : devis validé ou annulé (figé), montant modifié à la main (ligne changée, autres lignes ou coût fixé dans la position),
   devis à ouvrages, position 291 à sous-positions ; « Reprendre le contrat » (chiffre « Honoraires HT », clic droit sur la position) remet le montant du contrat. Plus de contrat signé :
   la ligne reprise disparaît si personne ne l'a changée (et la position créée par l'app si elle est vide). */
const HON_CFC='291';
/* contrats lisibles (administrateur ou « contrats : lecture ») et finances non verrouillées : sinon ni montant de contrat affiché, ni reprise */
const honOk=()=>{ try{ return !!((sgAdmin()||sgDroit('contrats','lecture'))&&!sgFinVerrou()); }catch(_){ return false; } };
/* projet modifiable par ce profil (même règle que le planning et le permis) : sinon aucune écriture d'office */
const honPeut=p=>{ try{ return !!(p&&(sgAdmin()||sgDroit('projets_modifier','tous')||(sgDroit('projets_modifier','siens')&&sgMesProjets().has(String(p.ID))))); }catch(_){ return false; } };
const honPh=(c,src)=>{ const o=src.phases||c.phases||{}, k=Object.keys(o).filter(x=>(parseFloat(o[x])||0)>0); return {p:k.reduce((t,x)=>t+(parseFloat(o[x])||0),0),k}; };
/* montants pour 100 % des prestations (relecture du 07.11.2026 : extrapoler chaque contrat puis additionner doublait les honoraires d'un mandat partagé entre plusieurs contrats,
   p. ex. 17QUE : 431–433 et 441–453) : contrats aux phases SIA toutes distinctes = un seul mandat → somme ÷ somme des % ; une phase commune à deux contrats = mandats distincts
   (p. ex. 20MMA, trois contrats aux mêmes phases) → chaque contrat ramené à 100 % comme dans Facturation ; contrat sans phase (faisabilité, expertise) : tel quel. Arrondi au franc
   s'il y a extrapolation, sinon au centime. */
const honExtra=L=>{ const av=L.filter(x=>x.p>0.01), sans=L.filter(x=>!(x.p>0.01)), vus=new Set(); let mt=sans.reduce((t,x)=>t+x.mt,0), mh=sans.reduce((t,x)=>t+x.mh,0), ext=false, recoup=false;
  av.forEach(x=>x.k.forEach(k=>{ if(vus.has(k)) recoup=true; vus.add(k); }));
  const un=(a,b,q)=>{ if(q<99.995){ ext=true; return [a/(q/100),b/(q/100)]; } return [a,b]; };
  if(av.length&&!recoup){ const r=un(av.reduce((t,x)=>t+x.mt,0),av.reduce((t,x)=>t+x.mh,0),Math.min(100,av.reduce((t,x)=>t+x.p,0))); mt+=r[0]; mh+=r[1]; }
  else av.forEach(x=>{ const r=un(x.mt,x.mh,x.p); mt+=r[0]; mh+=r[1]; });
  return ext?{ttc:Math.round(mt),ht:Math.round(mh),ext,recoup}:{ttc:Math.round(mt*100)/100,ht:Math.round(mh*100)/100,ext,recoup}; };
/* null = contrats non disponibles (droits, code d'accès, Facturation pas chargée) — jamais lu comme « aucun contrat » ; {cs:[]} = aucun contrat relié */
const honContrat=p=>{ if(!p||!honOk()) return null; const D=typeof fxData==='function'?fxData():null; if(!D) return null;
  const cs=sgContratsDuProjet(p,D).filter(c=>!c.annule);
  const L=cs.map(c=>{ const src=c.signe?c:(c.signedV||c), h=honPh(c,src); return {s:!!(c.signe||c.signedV),mt:parseFloat(src.httc)||0,mh:parseFloat(src.hht)||0,p:h.p,k:h.k}; });
  const tout=honExtra(L), sig=honExtra(L.filter(x=>x.s));
  return {cs,ss:cs.filter(c=>c.signe||c.signedV),signe:L.some(x=>x.s),pct:L.reduce((t,x)=>t+x.p,0),m100ht:tout.ht,partiel:tout.ext,recoup:tout.recoup,tot:sig.ttc,part2:sig.ext}; };
const honPos=E=>(E&&E.positions||[]).find(p=>String(p.cfc)===HON_CFC);
const honLigne=p=>{ const pt=p&&!p.genere&&(p.parts||[]).length===1?p.parts[0]:null; return pt?{pt,l:(pt.lignes||[]).find(l=>l&&l.sgHon)}:null; };
const honAuto=l=>!!(l&&l.sgHon&&!l.var&&Math.abs((+l.ttc||0)-(+l.sgHon.v||0))<0.06);   /* ligne inchangée depuis la dernière reprise (arrondi du moteur toléré) */
const honAutres=h=>!!(h&&((h.pt.lignes||[]).some(l=>l!==h.l&&!ch02aEmptyLine(l))||h.pt.fixe));   /* autres lignes chiffrées ou coût fixé dans la position */
const honFige=X=>{ const d=ch02aHdr(X)||{}; return +d.STATECODE===2?'valide':+d.STATECODE===3?'annule':''; };
/* honoraires saisis dans un CFC parent (29 ou 2 chiffrés) : une 291 en dessous les compterait deux fois */
const honAnc=E=>{ for(let a=cfcParent(HON_CFC);a;a=cfcParent(a)){ const q=(E.positions||[]).find(x=>String(x.cfc)===a); if(q&&!q.genere&&(q.parts||[]).length) return a; } return null; };
const honLib=K=>'Contrat d’honoraires signé'+(K.part2?', extrapolé à 100 % des prestations':'');
const honMaj=(l,K,X)=>{ const sep=ch02aSep(X), v=sep?ch02aVat():0, R=ch02aRnd(X.E), ht=sep?ch02aR(K.tot/(1+v/100),R):ch02aR(K.tot,R), ttc=sep?K.tot:ht;
  Object.assign(l,{commentaire:honLib(K),base:null,formule:'',qte:0,unite:'',prixHT:ht,tva:v,var:false,ttc,sgHon:{v:ttc,k:K.tot}}); return l; };
const honCreer=X=>{ const E=X.E, has=c=>E.positions.some(x=>String(x.cfc)===c), cat=c=>(X.catPos||[]).find(x=>String(x.CODE)===c);
  const ens=c=>{ if(!c||has(c)) return; ens(cfcParent(c)); const cp=cat(c); E.positions.push({cfc:c,texte:cp?cp.TEXT1:'',texte2:cp?cp.TEXT2:'',genere:true,descriptif:null,descriptifFormat:null,parts:[]}); };
  ens(cfcParent(HON_CFC)); const cp=cat(HON_CFC); let parts; CODE_NEUF=HON_CFC; try{ parts=dvNewParts(E); }finally{ CODE_NEUF=null; }
  E.positions.push({cfc:HON_CFC,texte:cp?cp.TEXT1:'Architecte',texte2:cp?cp.TEXT2:'',genere:false,descriptif:null,descriptifFormat:null,parts,sgHon:true}); E.positions.sort((a,b)=>cfcCmp(a.cfc,b.cfc)); };
/* état affiché sous « Honoraires HT » : '' | 'valide' | 'annule' | 'ouvrages' | 'parent' | 'sous' | 'parties' | 'retire' (retirée à la main) | 'manuel' | 'auto' */
const honEtat=(X,K)=>{ if(!K||!K.ss.length) return ''; const f=honFige(X); if(f) return f; const E=X.E; if(dvOuvCodes(E).length) return 'ouvrages';
  const p=honPos(E); if(honAnc(E)) return 'parent'; if(!p) return E.sgHon&&E.sgHon.pose?'retire':'manuel';
  if(p.genere||ch02aKids(E,HON_CFC).length) return 'sous'; const h=honLigne(p); if(!h) return 'parties';
  if(!h.l) return h.pt.sgHonPose?'retire':'manuel';
  return !honAuto(h.l)||honAutres(h)||Math.abs((+h.l.sgHon.k||+h.l.sgHon.v||0)-K.tot)>=0.005?'manuel':'auto'; };
const honSync=async X=>{ const maj=()=>{ if(SGDE.X===X&&X.sgdeMaj) X.sgdeMaj(); };
  if(!X||!X.p||!honOk()) return;
  X._honCh='lecture'; try{ if(typeof fxEnsure==='function') await fxEnsure(); X._honCh='ok'; }catch(_){ X._honCh='echec'; return maj(); }
  if(SGDE.X!==X||!X.rp||!X.rp.isConnected) return;
  const K=honContrat(X.p); if(!K){ X._honCh='echec'; return maj(); }
  if(!ecrit()||!ch02aCanEdit(ch02aHdr(X))||!honPeut(X.p)||honFige(X)) return maj();   /* consultation seulement : rien n'est écrit */
  const E=X.E; let p=honPos(E), ch=false;
  if(!K.ss.length){   /* contrat visible mais plus signé : la ligne reprise disparaît si personne ne l'a changée (jamais sur une simple absence de données) */
    const h=honLigne(p); if(K.cs.length&&h&&h.l&&honAuto(h.l)&&!honAutres(h)){ h.pt.lignes=h.pt.lignes.filter(l=>l!==h.l); delete h.pt.sgHonPose; ch=true;
      if(p.sgHon&&!h.pt.lignes.some(l=>!ch02aEmptyLine(l))&&!String(p.descriptif||'').trim()&&!String(h.pt.descriptif||'').trim()&&!String(h.pt.commentaire||'').trim()&&!ch02aKids(E,HON_CFC).length){ ch02aDelPosCalc(E,HON_CFC); delete E.sgHon; } }
    return ch?X.touch():maj(); }
  if(dvOuvCodes(E).length||honAnc(E)) return maj();
  if(!p){ if(E.sgHon&&E.sgHon.pose) return maj();   /* position retirée par l'utilisateur : pas recréée (lien « reprendre le contrat ») */
    honCreer(X); p=honPos(E); ch=true; }
  if(p.genere||ch02aKids(E,HON_CFC).length) return ch?X.touch():maj();
  const h=honLigne(p); if(!h) return ch?X.touch():maj();
  if(h.l){ if(honAuto(h.l)&&!honAutres(h)&&Math.abs((+h.l.sgHon.k||+h.l.sgHon.v||0)-K.tot)>=0.005){ honMaj(h.l,K,X); ch=true; } }
  else if(!honAutres(h)&&!h.pt.sgHonPose){ h.pt.lignes=[honMaj({},K,X)]; h.pt.sgHonPose=true; E.sgHon={pose:true}; ch=true; }
  return ch?X.touch():maj(); };
const honReprendre=X=>{ if(!ch02aCan(X)) return; if(!honPeut(X.p)){ toast('Projet en lecture seule pour votre profil : les honoraires ne peuvent pas être repris.'); return; }
  const f=honFige(X); if(f){ toast(f==='annule'?'Devis annulé : les honoraires ne suivent plus le contrat.':'Devis validé : les honoraires ne suivent plus le contrat. Repassez-le en brouillon ou en provisoire (en-tête du devis) pour les mettre à jour.'); return; }
  const K=honContrat(X.p); if(!K){ toast('Contrats d’honoraires non disponibles (droits, code d’accès ou chargement de Facturation).'); return; }
  if(!K.ss.length){ toast('Aucun contrat d’honoraires signé pour ce projet.'); return; }
  const E=X.E; if(dvOuvCodes(E).length){ toast('Devis à ouvrages : répartissez les honoraires entre les ouvrages dans la fenêtre de calcul de la position 291.'); return; }
  const an=honAnc(E); if(an){ toast('Les honoraires sont saisis dans le CFC '+an+' : le contrat ne peut pas être repris en 291 sans les compter deux fois.'); return; }
  const p0=honPos(E); if(p0&&(p0.genere||ch02aKids(E,HON_CFC).length)){ toast('La position 291 est détaillée en sous-positions : le contrat ne peut pas y être repris.'); return; }
  const h0=honLigne(p0); if(p0&&!h0){ toast('La position 291 a plusieurs parties : répartissez le montant dans sa fenêtre de calcul.'); return; }
  const faire=()=>{ let q=honPos(X.E); if(!q){ honCreer(X); q=honPos(X.E); } const g=honLigne(q); if(!g) return;
    g.pt.lignes=[honMaj({},K,X)]; g.pt.fixe=null; g.pt.sgHonPose=true; X.E.sgHon={pose:true}; X.touch(); toast('Position 291 : montant du contrat signé repris ('+num2(K.tot)+' CHF TTC).'); };
  const perdu=h0&&((h0.pt.lignes||[]).some(l=>!ch02aEmptyLine(l)&&!(l===h0.l&&honAuto(l)))||h0.pt.fixe);
  if(!perdu) return faire();
  sgConfirm('Remplacer le montant de la position 291 par celui du contrat d’honoraires signé : '+num2(K.tot)+' CHF TTC'+(K.part2?' (extrapolé à 100 % des prestations)':'')+' ?\nLes lignes de calcul saisies à la main dans cette position seront remplacées.',faire,{title:'Honoraires du contrat',yesText:'Reprendre le contrat',yesColor:'#bd1e42'}); };
function brancherGroupes(X){ const pane=X.L&&X.L.pane; if(!pane||pane._sgdeX) return; pane._sgdeX=X;
  const cible=e=>e.target&&e.target.closest&&e.target.closest('.sgde-tg');
  ['mousedown','dblclick'].forEach(t=>pane.addEventListener(t,e=>{ if(cible(e)){ e.stopPropagation(); e.preventDefault(); } },true));   /* la flèche ne choisit ni n'ajoute le CFC */
  pane.addEventListener('click',e=>{ const b=cible(e); if(!b) return; e.stopPropagation(); e.preventDefault(); const S=ouvertsCfc(), g=b.dataset.g; if(S.has(g)) S.delete(g); else S.add(g); garderOuverts(S); const y=pane.scrollTop; X.drawCat(); pane.scrollTop=y; },true);
  /* double-clic dans la liste CFC (Paulo, 07.11.2026 : « si je clique deux fois dans la liste des CFC je ne veux pas que cette fenêtre s'affiche, il faut uniquement copier dans le
     devis ou supprimer du devis ») : CFC absent → ajouté (parents manquants compris, règles du moteur), SANS ouvrir la fenêtre de calcul ; CFC présent → retiré du devis
     (ch02aDelPosCalc, comme « Supprimer la position ») : tout de suite si rien ne serait perdu, après confirmation s'il y a des lignes de calcul, un coût fixé, un descriptif,
     un commentaire ou des sous-positions. Double-clic reconnu par l'app (deux clics sur le même CFC en moins de 500 ms, même si la ligne a été redessinée entre les deux) ;
     le double-clic du navigateur est neutralisé (sinon le moteur ajouterait aussi la position et ouvrirait sa fenêtre). « + » du plan : ajoute ou choisit, sans fenêtre. */
  const codeDe=id=>{ const c=(X.catPos||[]).find(x=>String(x.ID)===String(id)); return c?String(c.CODE):''; };
  const ajouter=c=>{ SANS_CALC=true; CODE_NEUF=String(c.CODE); try{ X.dvAdd(c.CODE,c.TEXT1,c.TEXT2); }finally{ SANS_CALC=false; CODE_NEUF=null; } };
  const pleine=p=>!!(String(p.descriptif||'').trim()||String(p.commentaire||'').trim()||(p.parts||[]).some(pt=>(pt.lignes||[]).length||pt.fixe||String(pt.descriptif||'').trim()||String(pt.commentaire||'').trim()));
  const basculer=c=>{ if(!c||!ch02aCan(X)) return; const code=String(c.CODE), nom=code+' '+[c.TEXT1,c.TEXT2].filter(Boolean).join(' ');
    const P=X.E.positions||[]; if(!P.some(p=>String(p.cfc)===code)){ ajouter(c); toast('Position '+nom+' ajoutée au devis.'); return; }
    const kids=ch02aKids(X.E,code), avec=ch02aDelPosKind(X.E,code)==='msg2'&&!code.includes('.'), gone=P.filter(p=>String(p.cfc)===code||(avec&&kids.includes(p)));
    const retirer=()=>{ const g=ch02aDelPosCalc(X.E,code); if(!g.length) return; X.st.sel=null; X.touch(); toast('Position '+nom+' retirée du devis'+(g.length>1?' ('+g.length+' positions).':'.')); };
    if(gone.length===1&&!gone.some(pleine)){ retirer(); return; }   /* sous-positions retirées avec elle : toujours demandé (relecture du 07.11.2026) */
    const ttc=gone.reduce((a,p)=>a+(p.parts||[]).reduce((b,pt)=>b+(+ch02aPartTTC(pt)||0),0),0), n=gone.length-1;
    sgConfirm('Retirer « '+nom+' » du devis'+(n?', avec '+(n>1?'ses '+n+' positions subordonnées':'sa position subordonnée'):'')+' ?'+(gone.some(pleine)?'\n'+(ttc?'Montant retiré : '+num2(ttc)+' CHF TTC. ':'')+'Les lignes de calcul, le descriptif et le commentaire seront perdus.':''),retirer,{title:'Retirer du devis',yesText:'Retirer du devis'}); };
  let dern=null;
  pane.addEventListener('click',e=>{ if(cible(e)) return; const tr=e.target.closest&&e.target.closest('tbody tr[data-k]'); if(!tr){ dern=null; return; } const k=tr.dataset.k, t=Date.now();
    if(dern&&dern.k===k&&t-dern.t<500){ dern=null; const c=(X.catPos||[]).find(x=>String(x.ID)===String(k)); if(c) setTimeout(()=>basculer(c),0); }
    else dern={k,t}; });
  pane.addEventListener('dblclick',e=>{ if(cible(e)) return; if(e.target.closest&&e.target.closest('tbody tr[data-k]')){ e.stopPropagation(); e.preventDefault(); } },true);
  /* clic droit sur un CFC : Ajouter au devis / Retirer du devis (le menu commun des listes proposait « Ouvrir », sans effet ici) ; le détecteur de double-clic est remis à zéro */
  pane.addEventListener('contextmenu',e=>{ if(cible(e)||e.altKey) return; const tr=e.target.closest&&e.target.closest('tbody tr[data-k]'); if(!tr) return; dern=null;
    const c=(X.catPos||[]).find(x=>String(x.ID)===String(tr.dataset.k)); if(!c) return; e.preventDefault(); e.stopPropagation(); const la=(X.E.positions||[]).some(p=>String(p.cfc)===String(c.CODE));
    sgMenuAt(e.clientX,e.clientY,[{t:la?'Retirer du devis':'Ajouter au devis',danger:la,fn:()=>basculer(c)}]); });
  const plus=X.L.el.querySelector('.ph2 .ib'); if(plus) plus.addEventListener('click',()=>{ SANS_CALC=true; CODE_NEUF=codeDe(X.L.o&&X.L.o.sel)||null; setTimeout(()=>{ SANS_CALC=false; CODE_NEUF=null; },0); },true);   /* avant le clic du moteur (capture) */
  X.drawCat(); }
const toutCfc=(X,ouvrir)=>{ const S=new Set(); if(ouvrir) (X.catPos||[]).forEach(c=>{ if(cfcLevel(c.CODE)===1) S.add(grpCfc(c.CODE)); }); garderOuverts(S); X.drawCat(); };
/* plein écran (07.11.2026, Paulo : « ajouter un bouton comme dans soumission permettant de passer en plein écran ») : le devis couvre toute la fenêtre, menu et en-tête masqués,
   bandeau retiré, chiffres réduits ; gardé pour la séance, comme celui de la soumission (SVD_UI.full) ; Échap ou le même bouton pour revenir */
let PLEIN=false, BOXP=null;
addEventListener('keydown',e=>{ if(e.key!=='Escape'||!PLEIN||!BOXP||!BOXP.isConnected||e.defaultPrevented||document.querySelector('.ov,.sg-visu,.menu')) return; const a=document.activeElement;
  if(a&&a.classList&&a.classList.contains('psearch')&&BOXP.contains(a)){ e.preventDefault(); if(a.value){ a.value=''; a.dispatchEvent(new Event('input',{bubbles:true})); } else { a.blur(); if(BOXP._plein) BOXP._plein(false); } return; }   /* recherche du plan CFC : Échap la vide, puis quitte le plein écran */
  if(a&&(a.isContentEditable||/INPUT|TEXTAREA|SELECT/.test(a.tagName))) return; e.preventDefault(); if(BOXP._plein) BOXP._plein(false); },true);   /* capture : vu avant que le moteur ferme sa fenêtre — Échap dans une fenêtre la ferme sans quitter le plein écran */
/* ── onglet « Paramètres » (Paulo, 07.11.2026 : « glisser Paramètres après Documents, sous forme de page comme Documents, pas une fenêtre ; l'ensemble des éléments par
   catégorie, le titre, dessous les éléments ») : les catégories de la fenêtre « Paramètres » du moteur (Information, Affichage, Commentaire, Titres), mêmes champs, mêmes
   valeurs (ch02aPrefInit) et même enregistrement (ch02aPrefApply puis X.touch, à chaque champ modifié) ; Indice des prix de la construction : lecture seule (bloc 47, SGICC) ;
   sans droit d'écriture : champs grisés. ── */
/* phases SIA 102 (phases partielles) pour « Phase du devis » ; noms des phases 3 à 5 comme le reste de l'app (SG_PH_FICH) */
const PH_SIA=[['1 Définition des objectifs',[['11','Énoncé des besoins, approche méthodologique']]],['2 Études préliminaires',[['21','Définition du projet de construction, étude de faisabilité'],['22','Procédure de choix de mandataires']]],
  ['3 Étude du projet',[['31','Avant-projet'],['32','Projet de l’ouvrage'],['33','Procédure de demande d’autorisation']]],['4 Appel d’offres',[['41','Appel d’offres, comparaison des offres et propositions d’adjudication']]],
  ['5 Réalisation',[['51','Projet d’exécution'],['52','Exécution de l’ouvrage'],['53','Mise en service, achèvement']]]];
const phNom=c=>{ for(const [,L] of PH_SIA) for(const [k,n] of L) if(k===String(c)) return n; return ''; };
const phDe=R=>{ const c=String((R||{}).phaseSia||''); if(phNom(c)) return c; const t=normTxt((R||{}).etatProjet); for(const [,L] of PH_SIA) for(const [k,n] of L) if(t&&normTxt(n)===t) return k; return ''; };   /* « Projet de l'ouvrage » (apostrophe droite, espace finale) des anciens devis = 32 */
const PAR_AIDE={plans:'Date des plans sur lesquels repose le devis, écrite dans la page Information (« Ce DG correspond aux plans datés du … »).',phase:'Phase SIA 102 du devis ; son nom est repris sur la page de garde du devis général (« Devis général - <phase> »).',etatProjet:'Repris sur la page de garde du devis général (« Devis général - <état> »).',
  marge:'Degré de précision du devis, affiché devant le total TTC et sur la page de garde.',date:'Date du devis, en tête des documents.'};
/* texte type de la page Information (Paulo, 07.11.2026, choix « texte type des nouveaux devis ») : texte du bureau, une ligne par entrée comme dans l'ancien logiciel (une ligne
   sans libellé continue la précédente) ; {ouvrage} = description du projet (sinon son titre, comme « Ouvrage » de la page de garde), {tva} = taux de TVA par défaut,
   date des plans à compléter */
const REM_TYPE=[['',['Ce devis est estimatif et reste sous réserve des points suivants:',
    '-évolution des prix des matières premières','-inflation','-exigences supplémentaires des autorités / MO','-imprévus durant la phase d\'exécution',
    '-estimation basées sur l\'expérience Substances','Ce DG correspond aux plans datés du [date à compléter]','(TVA {tva}%)'].join('\n')],
  ['Réserve','CFC 583 Réserve pour divers et imprévus (env. 10%)'],
  ['Subventions',['Les subventions ne sont pas affichées dans ce document.','Ces montants ne sont pas acquis d\'office.',
    'Pour obtenir ces montants, AUCUN travaux ne doit commencer (yc travaux préparatoires) sans validation par les autorités.'].join('\n')]];   /* une cellule par libellé */
function remType(pid){ let t=8.1; try{ const v=+ch02aVat(); if(isFinite(v)&&v>0) t=v; }catch(_){ }
  return REM_TYPE.map(([n,x])=>({nom:n,texte:x.replace('{tva}',String(Math.round(t*100)/100))})); }
/* « Devis général | <nom de l'affaire> » en tête de la page Information (Paulo, 07.11.2026 : « ce texte est automatique car il s'agit du nom de l'affaire ») : jamais saisi ;
   reglages.infoAffaire = vrai → ajouté à l'impression (PDF du devis général, ancien livret, documents) et en tête de la section Information des Paramètres, en lecture seule ;
   les remarques enregistrées commencent après lui. Devis plus ancien dont la 1re remarque est « Devis général » suivie du nom (ou de la description) de l'affaire : reconnu de
   même (remAuto), converti à la première modification. */
const nomAffaire=p=>String((p||{}).TITLE||(p||{}).DESCRIPTION||'').trim();
const normTxt=v=>String(v||'').normalize('NFC').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim().toLowerCase();
/* trait sous le titre du projet (Paulo, 07.11.2026 : « ajouter un trait sous le titre du projet ») : automatique comme le nom — filet dans la page, ligne de tirets dans le PDF
   (celle du modèle 24PRC) ; une ligne de tirets saisie juste après le nom est retirée du texte modifiable */
const TRAIT='-----------------------------------------------------------', RX_TRAIT=/^[\s\-–—_]*[-–—_]{3,}[\s\-–—_]*$/;
const sansTrait=L=>{ const f=L[0]; if(!f||String(f.nom||'').trim()) return L; const lg=String(f.texte||'').split('\n'); if(!RX_TRAIT.test(lg[0]||'')) return L;
  return lg.length>1?[{nom:'',texte:lg.slice(1).join('\n')},...L.slice(1)]:L.slice(1); };
function remAuto(E,p){ const R=(E&&E.reglages)||{}, L=((E&&E.remarques)||[]).map(r=>({nom:String((r||{}).nom||''),texte:String((r||{}).texte||'')}));
  if(R.infoAffaire) return {auto:true,rest:sansTrait(L)};
  const f=L[0]; if(f&&/^devis général$/i.test(f.nom.trim())){ const lg=f.texte.split('\n'); if(lg[0].trim()&&[p&&p.TITLE,p&&p.DESCRIPTION].some(v=>v&&normTxt(v)===normTxt(lg[0])))
    return {auto:true,detecte:true,rest:sansTrait([...(lg.length>1?[{nom:'',texte:lg.slice(1).join('\n')}]:[]),...L.slice(1)])}; }
  return {auto:false,rest:L}; }
/* remarques telles qu'imprimées : nom de l'affaire et trait en tête si automatique (déclaré ou reconnu : même texte que la page Paramètres) */
const remImpr=(E,p)=>{ const A=remAuto(E,p); return A.auto?[{nom:'Devis général',texte:nomAffaire(p)+'\n'+TRAIT},...A.rest]:((E&&E.remarques)||[]); };
{ const b0=ch02bBook; ch02bBook=function(E,doc,p){ if(!E||!remAuto(E,p).auto) return b0.apply(this,arguments); const o=E.remarques; E.remarques=remImpr(E,p); try{ return b0.apply(this,arguments); } finally{ E.remarques=o; } }; }
/* texte Information d'un nouveau devis repris du projet (Paulo, 07.11.2026 : « conserver ce texte type pour tous les projets, celui-ci peut être modifié par projet », choix
   « repris du projet ») : celui du dernier devis du même projet qui en a un (date de modification, puis numéro ; corbeille exclue), nom de l'affaire automatique compris ;
   sinon le texte type du bureau. Chaque devis reste modifiable pour lui seul ; un devis existant (validé ou non) n'est jamais modifié.
   Texte de base (Paulo, 07.11.2026 : « voici le texte que le devis doit avoir à la création de devis ; ce texte peut être adapté pour chaque devis et projet, mais c'est le
   texte de base ») : seul un texte tenu dans SUBGestion est repris (remSg : devis créé dans l'app, ou texte Information modifié, complété ou daté dans ses Paramètres) ; les
   textes des devis repris de l'ancien logiciel (lignes modèles « [...] … », listes propres à une variante, phrases d'un ancien devis…) ne le sont jamais : texte de base.
   remSg = reglages.infoSg (posé à la création, et quand le TEXTE change dans les Paramètres : saisie, ligne retirée ou déplacée, texte type inséré, date écrite dans le texte —
   pas pour une ligne vide ajoutée puis retirée, ni pour la seule date des plans), ou devis créé dans l'app avant ce drapeau (infoAffaire + indiceIcc, posés à la création).
   « Dernier » = texte adapté le plus récemment (reglages.infoSgLe), sinon date du devis ; un texte vidé n'est pas repris (devis suivant, sinon texte de base). */
const remSg=E=>{ const R=(E&&E.reglages)||{}; return !!(R.infoSg||(R.infoAffaire&&R.indiceIcc)); };
const remMarquer=R=>{ R.infoSg=true; R.infoSgLe=new Date().toISOString(); };
const remModele=r=>/^\[\.\.\.\]/.test(String((r||{}).texte||'').trim());
/* texte tel qu'affiché dans les Paramètres (une cellule par libellé, cellules vides omises) : sert à savoir si le texte a vraiment changé */
const remCanon=L=>JSON.stringify(remGroupes((L||[]).map(r=>({nom:String((r||{}).nom||''),texte:String((r||{}).texte||'')}))).filter(([n,t])=>n.trim()||t.trim()));
function remProjet(pid,sauf){ if(pid==null) return null; const p=DS.get('project',pid)||{};
  const L=DS.all('costestimatedocument').filter(d=>String(d.PROJECT_ID)===String(pid)&&String(d.ID)!==String(sauf)&&!d.ISMARKEDASDELETED)
    .map(d=>({d,E:DS.get('costestimate',d.ID)})).filter(x=>x.E&&remSg(x.E))
    .map(x=>Object.assign(x,{k:String((x.E.reglages||{}).infoSgLe||x.d.CHANGEDDATE||'')}))
    .sort((a,b)=>b.k.localeCompare(a.k)||(+b.d.ID||0)-(+a.d.ID||0));
  for(const {d,E} of L){ const A=remAuto({reglages:E.reglages,remarques:(E.remarques||[]).filter(r=>!remModele(r))},p), rest=(A.rest||[]).filter(r=>r.nom.trim()||r.texte.trim());
    if(rest.length) return {rem:rest.map(r=>({nom:r.nom,texte:r.texte})),auto:A.auto,de:d,datePlans:String((E.reglages||{}).datePlans||'')}; }
  return null; }
/* « Pourcentage sur le total général » = réglage de base de tout nouveau devis (Paulo, 08.11.2026 : « définir en standard pour tous les devis », « comme base de tout
   devis, comme discuté plus haut » — même principe que le texte de base de la page Information) : posé à la création (ch02dNewContent : nouveau devis), modifiable ensuite
   dans Paramètres ▸ Affichage ; une copie garde le réglage de l'original ; les devis existants gardent le leur */
{ const nc0=ch02dNewContent; ch02dNewContent=function(){ const C=nc0.apply(this,arguments); try{ if(C&&typeof C==='object'){ const R=C.reglages||(C.reglages={}); R.pourcentageSur='total'; } }catch(e){ console.error(e); } return C; }; }
/* titres des documents (page de garde, devis à 1 et 2 chiffres, document principal) = nom de la version du devis, à la création (Paulo, 07.11.2026) : enregistrement qui crée
   un en-tête (bseq 0) et son contenu (bseq 0) — nouveau devis, Dupliquer, Dupliquer et modifier, import ; nom vide : titres inchangés (« Devis général » par défaut) */
{ const k0=ch02dCommit; ch02dCommit=function(ops){ try{ (Array.isArray(ops)?ops:[]).forEach(o=>{ if(!o||o.t!=='costestimatedocument'||+o.bseq!==0||!o.val) return; const V=String(o.val.VERSION||'').trim(); if(!V) return;
      const c=ops.find(x=>x&&x.t==='costestimate'&&String(x.id)===String(o.id)&&+x.bseq===0&&x.val&&typeof x.val==='object'); if(!c) return;
      const R=c.val.reglages||(c.val.reglages={}); R.titres=Object.assign({},R.titres||{},{garde:V,unChiffre:V,deuxChiffres:V,document:V}); }); }catch(e){ console.error(e); }
    /* page Information : texte type quand le nouveau devis n'en a pas (nouveau devis ; une copie garde les remarques de l'original) */
    try{ (Array.isArray(ops)?ops:[]).forEach(o=>{ if(!o||o.t!=='costestimatedocument'||+o.bseq!==0||!o.val) return; const c=ops.find(x=>x&&x.t==='costestimate'&&String(x.id)===String(o.id)&&+x.bseq===0&&x.val&&typeof x.val==='object');
      if(c&&!((c.val.remarques||[]).some(r=>String((r||{}).nom||'').trim()||String((r||{}).texte||'').trim()))){ const pid=o.val.PROJECT_ID||c.val.PROJECT_ID, P=remProjet(pid,o.id), R=c.val.reglages||(c.val.reglages={});
        if(P){ c.val.remarques=P.rem; if(P.auto) R.infoAffaire=true; if(P.datePlans) R.datePlans=P.datePlans; } else { c.val.remarques=remType(pid); R.infoAffaire=true; } remMarquer(R); } }); }catch(e){ console.error(e); }
    return k0.apply(this,arguments); }; }
/* menu « Présentation » : présentations du moteur + « Avec le descriptif et le calcul de prix » entre « Toutes les colonnes avec le calcul de prix » et « Avec le descriptif » */
function presMenu(X){ const L=ch02aPresMenu(X).filter(x=>x==='-'||x.t!=='Seulement positions de 1 à 3 chiffres'), c4=calcDesc(X.E), m=ch02aMode(X.E);
  const poser=v=>{ const R=X.E.reglages||(X.E.reglages={}), A=R.affichage||(R.affichage={}); if(+A.displayMode===4&&!!A.sgCalc===v) return; A.displayMode=4; if(v) A.sgCalc=true; else delete A.sgCalc; X.touch(); };
  const i4=L.findIndex(x=>x&&x.t===(CH02A_MODES.find(q=>q[0]===4)||[])[1]);
  if(i4<0) return L;
  L[i4]=Object.assign({},L[i4],{chk:m===4&&!c4,fn:()=>poser(false)});
  L.splice(i4,0,{t:'Avec le descriptif et le calcul de prix',chk:c4,fn:()=>poser(true)});
  return L; }
{ const sm0=ch02aSetMode; ch02aSetMode=function(X,k){ const A=(((X||{}).E||{}).reglages||{}).affichage; if(A&&A.sgCalc&&+k!==4) delete A.sgCalc; return sm0.apply(this,arguments); }; }
/* redessin : seulement si les valeurs enregistrées diffèrent de celles affichées (signature) — un champ modifié ici ne redessine pas la page (le curseur et le clic suivant
   restent), un conflit ou une modification d'un autre poste la redessine (le champ qui avait le curseur le garde) */
const remDe=X=>(X.E.remarques||[]).map(r=>[String((r||{}).nom||''),String((r||{}).texte||'')]);
/* une cellule par libellé (Paulo, 07.11.2026 : « regrouper dans une cellule ») : un libellé et les lignes sans libellé qui le suivent = un seul texte de plusieurs lignes ;
   le PDF imprime chaque ligne d'un texte sur sa propre rangée, libellé sur la première (ch02bIntro) : même page Information qu'avec une entrée par ligne */
const remGroupes=L=>{ const G=[]; L.forEach(r=>{ const n=String(r.nom||''), t=String(r.texte||''); if(!n.trim()&&G.length) G[G.length-1][1]+='\n'+t; else G.push([n,t]); }); return G; };
function parSig(X){ const v=ch02aPrefInit(X.E,ch02aHdr(X)), R1=X.E.reglages||{};
  return JSON.stringify([v.date,phDe(R1),String(R1.etatProjet||''),v.marge,v.pourcentageSur,!!v.arrondi5ct,remDe(X),!!R1.infoAffaire,nomAffaire(X.p),String(R1.datePlans||''),ecrit()&&ch02aCanEdit(ch02aHdr(X))]); }
function parPage(X,par,force){ if(!par) return; const act=document.activeElement;
  const P=CH02A_PREF, v=ch02aPrefInit(X.E,ch02aHdr(X)), peut=ecrit()&&ch02aCanEdit(ch02aHdr(X)), dis=peut?'':' disabled', y=par.scrollTop, sig=parSig(X);
  if(!force&&par._sig===sig){ parIndice(X,par); return; }
  const fk=act&&act!==par&&par.contains(act)&&act.dataset?act.dataset.k:null, fval=act&&act.type==='radio'?act.value:null;
  const ligne=(l,ctl,aide)=>'<label>'+E(l)+'</label><div>'+ctl+(aide?'<span class="sgde-ph">'+E(aide)+'</span>':'')+'</div>';
  const txt=(k,val,c)=>'<input class="inp'+(c?' c':'')+'" data-k="'+k+'" value="'+E(val==null?'':val)+'"'+dis+'>';
  const sec=(t,n,corps)=>'<section class="sgde-ps"><h3>'+E(t)+(n?'<small>'+E(n)+'</small>':'')+'</h3><div class="sgde-pg">'+corps+'</div></section>';
  /* « Phase du devis » (Paulo, 07.11.2026 : « définir la phase du devis au lieu de état du projet ; à droite liste de sélection de la phase de projet SIA ») : reglages.phaseSia,
     son nom écrit dans l'état du projet (page de garde « Devis général - <phase> », anciens modèles) ; un état saisi avant qui n'est pas une phase n'est plus proposé dans la liste
     (Paulo, 07.11.2026 : « supprimer ») : « — à définir — » jusqu'au choix d'une phase (le texte reste dans le devis et ses anciens documents tant qu'aucune phase n'est choisie) */
  const R0=(X.E.reglages||{}), ph=phDe(R0);
  const selPh='<select class="inp" data-k="phaseSia"'+dis+'><option value="">— à définir —</option>'
    +PH_SIA.map(([g,L])=>'<optgroup label="'+E(g)+'">'+L.map(([k,n])=>'<option value="'+k+'"'+(k===ph?' selected':'')+'>'+E(k+' '+n)+'</option>').join('')+'</optgroup>').join('')+'</select>';
  let h=sec('Générale' /* titre de la première section (Paulo, 07.11.2026 : « générale ») */,'',/* « Etat de planification » retiré (Paulo, 07.11.2026 : « supprimer ») : valeur gardée dans le devis ; « Date » en tête (Paulo, même jour : « déplacer la date ici ») */
      ligne(P.date,'<input class="inp c" type="date" data-k="date" value="'+E(v.date||'')+'"'+dis+'>',PAR_AIDE.date)
      +ligne('Phase du devis',selPh,PAR_AIDE.phase)
      +ligne(P.prec,'<input class="inp c" data-k="marge" list="sgde-dl-mg" value="'+E(v.marge)+'"'+dis+'><datalist id="sgde-dl-mg">'+P.marges.map(x=>'<option value="'+E(x)+'">').join('')+'</datalist>',PAR_AIDE.marge)
      +ligne(P.index,'<div class="sgde-pidx"></div>')
      /* « Date des plans » (Paulo, 07.11.2026 : « ajoute une cellule date des plans ») : reglages.datePlans ; écrite dans le texte Information (« … plans datés du <date> ») */
      +ligne('Date des plans','<input class="inp c" type="date" data-k="datePlans" value="'+E(String((X.E.reglages||{}).datePlans||''))+'"'+dis+'>',PAR_AIDE.plans))
    +sec(P.disp,'',ligne('Pourcentage','<label class="sgde-pr"><input type="radio" name="sgde-pct" data-k="pourcentageSur" value="groupe"'+(v.pourcentageSur!=='total'?' checked':'')+dis+'> '+E(P.procGrp)+'</label>'
        +'<label class="sgde-pr"><input type="radio" name="sgde-pct" data-k="pourcentageSur" value="total"'+(v.pourcentageSur==='total'?' checked':'')+dis+'> '+E(P.procTot)+'</label>','Colonne « % » du devis et des documents.')
      +ligne(P.round,'<label class="sgde-pr"><input type="checkbox" data-k="arrondi5ct"'+(v.arrondi5ct?' checked':'')+dis+'> Arrondir les montants des lignes</label>'));   /* phrase d'aide retirée (Paulo, 07.11.2026 : « supprimer ») */
  /* « Information » (Paulo, 07.11.2026 : « voici ce que je souhaiterais écrire dans Information », page Information du devis général 24PRC) : remarques préliminaires du devis
     (E.remarques {nom, texte}, mêmes données que Fonctions ▸ Remarques préliminaires), une ligne par remarque — libellé à gauche, texte à droite, graphisme de la page —,
     puis les ouvrages ajoutés d'office par le PDF (lecture seule). Remplace le texte libre 1 (« Commentaire », valeurs des textes libres gardées dans le devis). */
  const RA=remAuto(X.E,X.p), G0=remGroupes(RA.rest), A0=RA.auto?(G0.length&&!G0[0][0].trim()?G0.shift()[1]:''):null, RM=G0, OV=(()=>{ try{ return dgOuvInfo(X); }catch(_){ return []; } })();
  /* nom de l'affaire : première ligne fixe de la cellule « Devis général », le texte qui le suit reste modifiable */
  const lgAuto=A0==null?'':'<div class="sgde-rmr sgde-rmauto"><span class="sgde-rml">Devis général</span><div class="sgde-rmc"><div class="sgde-rmf" title="Nom de l’affaire et trait, repris automatiquement">'+E(nomAffaire(X.p)||'(affaire sans nom)')+'</div>'
    +'<textarea class="inp sgde-rmt" rows="1" data-k="rem.a.t" placeholder="Texte"'+dis+'>'+E(A0)+'</textarea></div><span></span></div>';
  const lgRm=(r,i)=>'<div class="sgde-rmr" data-i="'+i+'"><input class="inp sgde-rmn" data-k="rem.'+i+'.n" value="'+E(r[0])+'"'+dis+'><textarea class="inp sgde-rmt" rows="1" data-k="rem.'+i+'.t" placeholder="Texte"'+dis+'>'+E(r[1])+'</textarea>'
    +(peut?'<span class="sgde-rma"><button data-rm="haut" title="Monter">↑</button><button data-rm="bas" title="Descendre">↓</button><button data-rm="suppr" title="Supprimer la ligne">×</button></span>':'<span></span>')+'</div>';
  h+='<section class="sgde-ps sgde-rms"><h3>'+E(P.info)+'<small>Page « Information » du devis général</small></h3><div class="sgde-rm">'+lgAuto+RM.map(lgRm).join('')
    +(OV.length?OV.map(s=>'<div class="sgde-rmr sgde-rmo" title="Ouvrage du devis : ajouté d’office à la fin de la page Information"><span>'+E([s.CODE,s.LOCATIONCODE].filter(Boolean).join(' | '))+'</span><span>'+E([s.DESCRIPTION,s.LOCATIONDESCRIPTION].filter(Boolean).join(' | '))+'</span><span></span></div>').join(''):'')+'</div>'
    +(peut?'<p class="sgde-rmp"><button class="sgde-hreg" data-rm="plus">+ Ajouter une ligne</button></p>':'')   /* texte d'aide retiré (Paulo, 07.11.2026 : « supprimer ») */+'</section>';
  /* « Titres » retiré (Paulo, 07.11.2026 : « supprimer et utiliser le nom de la version du devis lors de la création d'un devis ») : titres posés à la création (ch02dCommit) */
  if(!peut) h+='<p class="sgde-pl0">Lecture seule : vous n’avez pas le droit de modifier ce devis.</p>';
  par.innerHTML=h; par._sig=sig; par.scrollTop=y; parIndice(X,par); par.querySelectorAll('.sgde-rmt').forEach(remHaut);
  if(fk){ const f=par.querySelector('[data-k="'+fk+'"]'+(fval!=null?'[value="'+fval+'"]':'')); if(f&&!f.disabled) try{ f.focus({preventScroll:true}); }catch(_){ } } }
/* indice des prix de la construction (bloc 47) : valeur, série, période et base ; jamais saisi */
function parIndice(X,par){ const b=par&&par.querySelector('.sgde-pidx'); if(!b) return; const I=window.SGICC; let x=null; try{ x=I?I.devis(X.E,ch02aHdr(X)):null; }catch(e){ console.error(e); }
  b.innerHTML=x?'<div class="sgde-pi"><b>'+E(I.val(x))+'</b><span>'+E(I.periode(x)+', '+I.base(x))+'</span></div><span class="sgde-ph">'+E(I.serie)+'. '+E(I.origine(x))+' Source : '+E(I.source(x))+'. Mis à jour automatiquement, sans saisie.</span>'
    :'<span class="sgde-ph">Indice indisponible.</span>'; }
/* hauteur d'un texte de remarque : selon son contenu */
const remHaut=t=>{ t.style.height='auto'; t.style.height=Math.max(30,t.scrollHeight+2)+'px'; };
/* remarques : relues dans l'ordre affiché, lignes vides retirées (comme la fenêtre du moteur), enregistrées */
function remEnregistrer(X,par){ if(!ch02aCan(X)){ parPage(X,par,true); return; }
  const auto=!!par.querySelector('.sgde-rmauto'), L=[...par.querySelectorAll('.sgde-rmr:not(.sgde-rmo)')].map(d=>({nom:d.classList.contains('sgde-rmauto')?'':(d.querySelector('.sgde-rmn')||{}).value||'',texte:(d.querySelector('.sgde-rmt')||{}).value||''})).filter(r=>r.nom.trim()||r.texte.trim());
  const R=X.E.reglages||(X.E.reglages={}), s0=JSON.stringify([X.E.remarques||[],!!R.infoAffaire]), c0=remCanon(remAuto(X.E,X.p).rest); X.E.remarques=L; if(auto) R.infoAffaire=true;
  if(JSON.stringify([L,!!R.infoAffaire])!==s0){ if(remCanon(L)!==c0) remMarquer(R); par._sig=parSig(X); X.touch(); } }
/* bouton « Insérer le texte type » retiré (Paulo, 07.11.2026 : « supprimer ») : la branche 'type' ci-dessous n'est plus appelée, gardée pour mémoire */
function remAction(X,par,b){ const a=b.dataset.rm, rw=b.closest('.sgde-rmr'), box=par.querySelector('.sgde-rm');
  if(a==='plus'){ const i=par.querySelectorAll('.sgde-rmr:not(.sgde-rmo)').length, d=document.createElement('div'); d.innerHTML='<div class="sgde-rmr" data-i="'+i+'"><input class="inp sgde-rmn" data-k="rem.'+i+'.n" placeholder="Titre"><textarea class="inp sgde-rmt" rows="1" data-k="rem.'+i+'.t" placeholder="Texte"></textarea><span class="sgde-rma"><button data-rm="haut" title="Monter">↑</button><button data-rm="bas" title="Descendre">↓</button><button data-rm="suppr" title="Supprimer la ligne">×</button></span></div>';
    const n=d.firstChild, o=box.querySelector('.sgde-rmo'); if(o) box.insertBefore(n,o); else box.append(n); remHaut(n.querySelector('.sgde-rmt')); n.querySelector('.sgde-rmn').focus(); return; }
  if(a==='type'){ const go2=()=>{ remEnregistrer(X,par); if(!ch02aCanEdit(ch02aHdr(X))) return; const R=X.E.reglages||(X.E.reglages={}), vide=!(X.E.remarques||[]).length;
      /* devis sans lignes : nom de l'affaire automatique + texte type ; sinon le texte type à la suite, précédé de « Devis général | <nom de l'affaire> » s'il n'est pas déjà en tête */
      if(vide||R.infoAffaire){ if(vide) R.infoAffaire=true; X.E.remarques=[...(X.E.remarques||[]),...remType(X.p&&X.p.ID)]; }
      else { const T=remType(X.p&&X.p.ID); T[0]={nom:'Devis général',texte:[nomAffaire(X.p),T[0].texte].filter(Boolean).join('\n')}; X.E.remarques=[...(X.E.remarques||[]),...T]; }
      remMarquer(R); par._sig=parSig(X); X.touch(); parPage(X,par,true); };
    const deja=[...par.querySelectorAll('.sgde-rmr:not(.sgde-rmo)')].some(d=>((d.querySelector('.sgde-rmn')||{}).value||'').trim()||((d.querySelector('.sgde-rmt')||{}).value||'').trim());
    if(deja) sgConfirm('Ajouter le texte type à la suite des lignes existantes de la page Information ?',go2,{title:'Information',yesText:'Ajouter'}); else go2(); return; }
  if(!rw) return;
  if(a==='haut'&&rw.previousElementSibling&&!rw.previousElementSibling.matches('.sgde-rmo,.sgde-rmauto')) rw.parentNode.insertBefore(rw,rw.previousElementSibling);
  else if(a==='bas'&&rw.nextElementSibling&&!rw.nextElementSibling.classList.contains('sgde-rmo')) rw.parentNode.insertBefore(rw.nextElementSibling,rw);
  else if(a==='suppr'){ const vide=!((rw.querySelector('.sgde-rmn')||{}).value||'').trim()&&!((rw.querySelector('.sgde-rmt')||{}).value||'').trim();
    if(!vide){ sgConfirm('Supprimer cette ligne de la page Information ?',()=>{ rw.remove(); remEnregistrer(X,par); parPage(X,par,true); },{title:'Information',yesText:'Supprimer',yesColor:'#bd1e42'}); return; } rw.remove(); }
  else return;
  remEnregistrer(X,par); }
/* enregistrement d'un champ : valeurs à jour du devis, le champ changé, puis l'enregistrement du moteur (un seul X.touch) ; la signature est posée avant : la page ne se redessine pas */
/* date en toutes lettres, comme la page Information de l'ancien logiciel : « 26 février 2026 », « 1er mars 2026 » */
const MOIS_L=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const dateLongue=iso=>{ const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso||'')); if(!m) return ''; const j=+m[3]; return (j===1?'1er':String(j))+' '+MOIS_L[+m[2]-1]+' '+m[1]; };
const A_COMPLETER='[date à compléter]';
/* date des plans changée : elle remplace dans le texte Information « [date à compléter] » et l'ancienne date des plans (en toutes lettres) ; effacée → « [date à compléter] » */
function datePlansChange(X,par,v){ const R=X.E.reglages||(X.E.reglages={}), avant=dateLongue(R.datePlans), apres=dateLongue(v)||A_COMPLETER, s0=JSON.stringify([X.E.remarques||[],R.datePlans||'']), r0=JSON.stringify(X.E.remarques||[]);
  if(v) R.datePlans=v; else delete R.datePlans; let vu=false;
  X.E.remarques=(X.E.remarques||[]).map(r=>{ let t=String((r||{}).texte||''); const t0=t; t=t.split(A_COMPLETER).join(apres); if(avant&&avant!==apres) t=t.split(avant).join(apres); if(t!==t0||t.includes(apres)) vu=true; return t===t0?r:Object.assign({},r,{texte:t}); });
  if(JSON.stringify([X.E.remarques,R.datePlans||''])!==s0){ if(JSON.stringify(X.E.remarques)!==r0) remMarquer(R); par._sig=parSig(X); X.touch(); parPage(X,par,true); }   /* drapeau : seulement si la date a été écrite dans le texte */
  if(v&&!vu) toast('Date des plans enregistrée. Elle n’apparaît pas dans le texte Information : ajoutez-la à la phrase « Ce DG correspond aux plans datés du … ».'); }
function parChange(X,par,t){ if(String(t.dataset.k||'').startsWith('rem.')){ remEnregistrer(X,par); return; }
  if(!ch02aCan(X)){ parPage(X,par,true); return; }
  if(t.dataset.k==='datePlans'){ datePlansChange(X,par,t.value); return; }
  /* arrondi : recalcule les montants de toutes les lignes de calcul (un clic de trop, puis son annulation, changerait des montants) → confirmation d'abord */
  if(t.dataset.k==='arrondi5ct'&&!t._ok){ const on=t.checked, n=(X.E.positions||[]).reduce((a,q)=>a+(q.genere?0:(q.parts||[]).reduce((b,pt)=>b+(pt.lignes||[]).length,0)),0); t.checked=!on;
    sgConfirm((on?'Arrondir':'Ne plus arrondir')+' les montants des lignes : le montant TTC de '+n+(n>1?' lignes de calcul sera recalculé':' ligne de calcul sera recalculé')+' (quantité × prix). Continuer ?',
      ()=>{ const f=par.querySelector('[data-k="arrondi5ct"]'); if(!f) return; f.checked=on; f._ok=true; try{ parChange(X,par,f); } finally{ f._ok=false; } },{title:'Arrondi',yesText:on?'Arrondir':'Ne plus arrondir'}); return; }
  const v=ch02aPrefInit(X.E,ch02aHdr(X)), k=t.dataset.k; v.titres=Object.assign({},((X.E.reglages||{}).titres)||{});   /* titres tels qu'enregistrés (ch02aPrefInit met « Devis général » à la place d'un titre vide) */
  let ph=null; if(k==='phaseSia'){ if(t.value==='__txt') return; ph=phNom(t.value)?t.value:''; v.etatProjet=ph?phNom(ph):''; }
  else if(k==='pourcentageSur'){ if(!t.checked) return; v.pourcentageSur=t.value==='total'?'total':'groupe'; } else if(k==='arrondi5ct') v.arrondi5ct=t.checked;
  else if(/^tl[0-4]$/.test(k)) v.textesLibres[+k.slice(2)]=t.value; else if(k.startsWith('titre.')) v.titres[k.slice(6)]=t.value; else v[k]=t.value;
  const s0=JSON.stringify(X.E), n=ch02aPrefApply(X.E,v); if(ph!=null){ const R=X.E.reglages||(X.E.reglages={}); if(ph) R.phaseSia=ph; else delete R.phaseSia; } if(JSON.stringify(X.E)!==s0){ par._sig=parSig(X); X.touch(); if(n) toast(n+(n>1?' lignes recalculées':' ligne recalculée')+' (arrondi).'); }
  parIndice(X,par); }
function habiller(m,X){ cssD();
  const B=[...X.bar.children], bListe=B[0], bEd=B[3], bPar=B[4];
  if(!bListe||!/Liste/.test(bListe.textContent)||!bEd||!bEd._sgB||!bPar||!bPar._sgB||!X.bDel||!X.bFil||!X.bDoc||!X.bWh||!X.bWh._sgB) return;   /* barre inattendue : l'écran du moteur reste tel quel */
  const S=X.sgde={ong:'pos',cfc:!(X.E.positions||[]).length,niv:niv0(),vu:X.st.sel};
  const box=el('div','sgde'), hd=el('div','sgde-tete'), kp=el('div','nx-kpis sgde-kp'), ong=el('div','sgde-ong'), ongL=el('div','sg-onglets'), niv=el('div','sgde-niv'), bar=el('div','ph2 sgde-bar'), docs=el('div','sgde-docs'), par=el('div','sgde-par');
  const mEd=bEd._sgB.menu, mPar=bPar._sgB.menu, mWh=X.bWh._sgB.menu, ec=ecrit();
  const fonctions=()=>{ const ed=mEd().slice(), dern=Object.assign(ch02aExt(X,'ch02dLastVersion',4,CH02A_L.last),{dis:ch02dLastDis(X)}), pr=mPar().filter(x=>x!=='-'&&x.t!==CH02A_L.prefs), vis=()=>Object.assign({},X.R2,{view:(X.R2.view||[]).filter(r=>!S.niv||cfcLevel((r.det?r.n:r).p.cfc)<=S.niv)}), wh=mWh().filter(x=>x==='-'||!String(x.t).startsWith(CH02A_L.docs)).map(x=>x==='-'?x:x.t===CH02A_L.copy?{t:x.t,fn:()=>{ const g=vis(); ctCopy(tableText(g,'\t'),'Tableau copié ('+g.view.length+' lignes).'); }}:x.t===CH02A_L.csv?{t:x.t,fn:()=>csvTable(vis(),'Devis_'+(X.p?X.p.NUMBER:''))}:x), rows=!!((X.R2||{}).view||[]).length;
    const fil=dvOuvCodes(X.E).length?[{t:'Filtre des ouvrages',sub:()=>ch02aSps(X).length?ch02aFilterMenu(X):[{t:'Filtre…',fn:()=>ch02aFilterDialog(X)}]},'-']:[];   /* bouton « Filtre » retiré de la barre (Paulo, 07.11.2026) : ici, seulement si le devis a des ouvrages */
    /* « Informations pour le devis » retiré du menu (Paulo, 07.11.2026 : « supprimer ») : la page Information est dans l'onglet Paramètres */
    /* « Soumis aux honoraires selon la règle du bureau … » retiré de « Modifier les montants » (même soir, « supprimer ») : la règle reste par le lien « appliquer la règle » sous le chiffre Montant soumis HT */
    return [...(ec?[{t:'Modifier les montants',sub:()=>[...ed,'-',dern]},...pr,{t:'Modifier l’en-tête du devis …',fn:()=>ch02dEditDoc(X.p,ch02aHdr(X))},'-']:[]),...fil,{t:'Exporter',dis:!rows,sub:()=>wh}]; };
  const sep=()=>el('span','sgde-sep'), fin=el('span','sgde-fin');
  const bAdd=lib(ibtn({i:'grille',t:'Liste CFC',fn:()=>plan(!S.cfc)}),'Liste CFC'); bAdd.title='Liste CFC : double-cliquez sur un CFC pour l’ajouter au devis ou l’en retirer';   /* menu du clic droit : « Liste CFC » (_sgB.t) */   /* « Liste CFC » (Paulo, 07.11.2026) */
  X.bModif=ibtn({i:'edit',t:'Editer la position',fn:()=>X.dvCalc()});
  const bPres=ibtn({i:'list',t:'Présentation',menu:()=>presMenu(X)});
  const bFon=ibtn({i:'gear',t:'Fonctions',fn:()=>menuSous(bFon,fonctions())}); bFon.insertAdjacentHTML('beforeend','<span class="dd">▼</span>'); X.bWh=bFon;
  lib(X.bDoc,'Imprimer'); X.bDoc.title='Imprimer le devis'; if(X.bDoc._sgB) X.bDoc._sgB.t='Imprimer'; if(X.bDoc._sgB&&X.bDoc._sgB.menu){ const mD=X.bDoc._sgB.menu; X.bDoc._sgB.menu=()=>[{t:'Devis général (PDF)',fn:()=>dgPdf(X)},'-',...mD().map(x=>x&&x.t?Object.assign({},x,{t:String(x.t).replace(CH02B_L.legacy,'')}):x)]; }   /* devis général au papier des contrats en premier (bloc 46) */
  const bPlein=ibtn({i:'plein',t:'Plein écran',fn:()=>box._plein(!PLEIN)}); bPlein.classList.add('sgde-pl');   /* icône seule, comme dans la soumission : coins de cadrage (07.11.2026) */
  box._plein=v=>{ PLEIN=!!v; BOXP=box; box.classList.toggle('sgde-plein',PLEIN); bPlein.classList.toggle('on',PLEIN); const svP=bPlein.querySelector('svg'); if(svP) svP.outerHTML=nxSvg(PLEIN?'pleinq':'plein'); bPlein.title=PLEIN?'Quitter le plein écran (Échap)':'Plein écran'; bPlein.setAttribute('aria-label',bPlein.title); };
  bar.append(...(ec?[bAdd,sep()]:[]),bPres,sep(),X.bDoc,fin,bFon,bPlein);   /* « Paramètres » : onglet après Documents (07.11.2026) */   /* « Modifier », « Supprimer » et « Filtre » retirés de la barre (Paulo, 07.11.2026) : double-clic, clic droit, Fonctions ▸ Filtre des ouvrages ; X.bFil reste hors de la page (le moteur le tient à jour) */
  /* clic droit sur une position (ou une de ses lignes) : ouvrir le calcul, supprimer la position (confirmation du moteur), liste CFC */
  X.rp.addEventListener('contextmenu',e=>{ const tr=e.target.closest&&e.target.closest('tbody tr[data-k]'); if(!tr||e.altKey||String(getSelection()).trim()) return; const r=(X.R2.view||[]).find(x=>String(x.det?x.k:x.p.cfc)===tr.dataset.k); if(!r) return;
    e.preventDefault(); const code=String((r.det?r.n:r).p.cfc), sel=()=>{ if(String(X.st.sel)!==code){ X.st.sel=code; X.R2.sel=code; X.draw(); } }; sel();
    const peut=ec&&ch02aCanEdit(ch02aHdr(X));
    const kH=code===HON_CFC&&peut&&honPeut(X.p)?honContrat(X.p):null;
    sgMenuAt(e.clientX,e.clientY,[{t:'Ouvrir le calcul',fn:()=>{ sel(); X.dvCalc(); }},...(kH&&kH.ss.length?[{t:'Reprendre le montant du contrat signé…',fn:()=>honReprendre(X)}]:[]),...(peut?[{t:'Supprimer la position…',danger:true,fn:()=>{ sel(); ch02aDelPos(X); }},'-',{t:'Liste CFC',fn:()=>plan(true)}]:[])]); });
  const plan=on=>{ S.cfc=on; X.L.el.classList.toggle('sgde-ferme',!on); bAdd.classList.toggle('on',on); deco(X); if(on){ const q=X.L.el.querySelector('.psearch'); if(q) q.focus(); } };
  const cT=el('div','sgde-cfc-t','<b>Plan CFC</b><span class="sgde-cfc-g"><button data-tout="1" title="Agrandir tous les groupes">Tout agrandir</button><button data-tout="0" title="Réduire tous les groupes">Tout réduire</button></span><button class="sgde-x" title="Fermer le plan CFC" aria-label="Fermer le plan CFC">×</button>'); cT.querySelector('.sgde-x').onclick=()=>plan(false);
  cT.querySelectorAll('[data-tout]').forEach(b=>{ b.onclick=()=>toutCfc(X,b.dataset.tout==='1'); });
  X.L.el.classList.add('sgde-cfc'); X.L.el.prepend(cT); /* texte d'aide sous la recherche retiré (Paulo, 07.11.2026 : « supprimer ») : l'infobulle du bouton « Liste CFC » le dit */
  const dessOng=()=>{ ongL.innerHTML=[['pos','Devis'],['docs','Documents'],['par','Paramètres']].map(([k,t])=>'<button data-o="'+k+'" class="'+(S.ong===k?'on':'')+'">'+t+'</button>').join('');
    box.classList.toggle('docs',S.ong==='docs'); box.classList.toggle('par',S.ong==='par'); if(S.ong==='par') parPage(X,par,true); };
  S.par=par; S.ouvrirPar=k=>{ S.ong='par'; dessOng(); const f=k&&par.querySelector('[data-k="'+k+'"]'); if(f&&!f.disabled){ f.focus(); f.scrollIntoView({block:'nearest'}); } };
  par.addEventListener('change',e=>{ const t=e.target.closest&&e.target.closest('[data-k]'); if(t) parChange(X,par,t); });
  par.addEventListener('keydown',e=>{ if(e.key==='Enter'&&e.target.matches('input.inp:not([type=date])')){ e.preventDefault(); e.target.blur(); } });
  par.addEventListener('input',e=>{ if(e.target.classList&&e.target.classList.contains('sgde-rmt')) remHaut(e.target); });
  par.addEventListener('click',e=>{ const b=e.target.closest&&e.target.closest('[data-rm]'); if(b){ e.preventDefault(); remAction(X,par,b); } });
  const dessNiv=()=>{ niv.innerHTML='<span title="Niveau de CFC affiché">CFC</span>'+[[0,'Tout','Tous les CFC'],[3,'3','CFC de 1 à 3 chiffres'],[2,'2','CFC de 1 et 2 chiffres'],[1,'1','CFC à 1 chiffre']].map(([v,t,ti])=>'<button data-v="'+v+'" title="'+E(ti)+'" aria-label="'+E(ti)+'" class="'+(S.niv===v?'on':'')+'">'+t+'</button>').join(''); };
  ongL.onclick=e=>{ const b=e.target.closest('[data-o]'); if(b){ S.ong=b.dataset.o; dessOng(); } };
  S.dessNiv=dessNiv;
  niv.onclick=e=>{ const b=e.target.closest('[data-v]'); if(!b) return; S.niv=+b.dataset.v; try{ localStorage.setItem('sg3_devis_niv',String(S.niv)); }catch(_){} const q=ch02aSelPos(X); if(S.niv&&q&&cfcLevel(q.cfc)>S.niv){ X.st.sel=null; X.R2.sel=null; } S.vu=X.st.sel; dessNiv(); X.draw(); };
  hd.onclick=e=>{ if(e.target.closest('[data-a="liste"]')) ch02aClose(X); };
  X.sgdeMaj=()=>{ const d=ch02aHdr(X)||{}, p=X.p||{}, {T,M}=dvCompute(X.E,X.filter), sepV=ch02aSep(X), fe=[...M.values()].filter(n=>n.leaf), nC=fe.filter(n=>n.ttc||n.opt).length, mo=moT(p), et=DV_STATE[d.STATECODE]||'', ff=X.filter&&X.filter.length?'filtre actif':''; const hR=ec&&ch02aCanEdit(ch02aHdr(X))?horsRegle(X.E).length:0;
    /* taux de TVA du document (Paulo, 07.11.2026 : « affiche la TVA du document ») : taux des lignes chiffrées et des coûts fixés (variantes et parties « Exclure » non comptées) ;
       plusieurs taux → tous, du plus bas au plus haut ; lignes à 0 % hors du libellé ; devis encore vide → taux par défaut des réglages (ch02aVat) */
    const tauxL=new Set(); (X.E.positions||[]).forEach(q=>{ if(q.genere) return; (q.parts||[]).forEach(pt=>{ if(pt.mode==='exclure') return;
      if(pt.fixe&&pt.fixe.ttc!=null&&+pt.fixe.ttc){ tauxL.add(Math.round((+pt.fixe.tva||0)*100)/100); return; }
      (pt.lignes||[]).forEach(l=>{ if(!l||l.var) return; const v=dvLine(l); if(v.ht||v.ttc) tauxL.add(Math.round((+l.tva||0)*100)/100); }); }); });
    /* lignes à 0 % (taxes, émoluments : CFC 51…) = exonérées, pas un autre taux : hors du libellé, signalées dans l'infobulle */
    const pos=[...tauxL].filter(t=>t>0).sort((a,b)=>a-b), exo=tauxL.has(0), tf=t=>String(t);
    const taux=pos.length?pos:tauxL.size?[0]:[Math.round((+ch02aVat()||0)*100)/100];
    const tvaLib=taux.map(tf).join(' · ')+' %', tvaTip=(taux.length>1?'Plusieurs taux de TVA dans le document : '+taux.map(t=>tf(t)+' %').join(', '):tauxL.size?'Taux de TVA du document':'Taux de TVA par défaut (aucune ligne chiffrée)')+(exo&&pos.length?' ; lignes sans TVA (taxes, émoluments) comprises dans le total':'');
    const honKpi=()=>{ const ok=honOk(), K=ok?honContrat(X.p):null, eH=honEtat(X,K), peut=ec&&ch02aCanEdit(ch02aHdr(X))&&honPeut(X.p); let hh=0;
      M.forEach((n,c)=>{ if(n.leaf&&/^\d9/.test(String(c).replace(/[^0-9]/g,''))) hh+=n.ht-(n.children||[]).reduce((t,k)=>t+((M.get(String(k))||{}).ht||0),0); });   /* montant propre de chaque position (sans ses enfants) */
      const avec=K&&K.cs.length, pc=avec&&K.partiel&&!K.recoup&&K.pct<=100?' · '+(Math.round(K.pct*10)/10).toFixed(1).replace('.0','')+' % → 100 %':'';
      const lien=t=>'<button class="sgde-hreg" data-a="hcont" title="'+t+'">reprendre le contrat</button>';   /* lien seul : la ligne tient dans la colonne */
      const etat={valide:'',annule:'',   /* « figé » retiré (Paulo, 07.11.2026 : « supprimer ») : l'infobulle du chiffre le dit */
        ouvrages:' · à répartir entre les ouvrages',parent:' · saisis dans le CFC '+(honAnc(X.E)||'29'),sous:' · 291 détaillée en sous-positions',parties:' · 291 en plusieurs parties'}[eH]||'';
      const sub=(eH==='manuel'||eH==='retire')&&peut?(eH==='manuel'?lien('La position 291 ne correspond pas au contrat signé ('+num2(K.tot)+' CHF TTC)'):lien('Position 291 retirée du devis : la reprendre au montant du contrat signé ('+num2(K.tot)+' CHF TTC)'))
        :(avec?(K.signe?'contrat signé':'contrat non signé')+pc:ok&&!K?(X._honCh==='echec'?'contrats non disponibles':'lecture des contrats…'):'chapitres d’honoraires du devis')+etat;   /* « CHF » retiré des chiffres (Paulo, 07.11.2026) */
      return kpi('Honoraires HT',num2(avec?K.m100ht:hh),sub,'','Montant HT pour 100 % des prestations : contrats d’honoraires de l’affaire (signés ou non), extrapolés si le contrat ne couvre qu’une partie des phases ; sans contrat : chapitres d’honoraires du devis (09, 19, 29, 39, 49, 99). La position 291 suit d’office le contrat signé, sauf devis validé ou annulé et montant modifié ou retiré à la main.'+(eH==='valide'?' Ce devis est validé : la position 291 ne suit plus le contrat.':eH==='annule'?' Ce devis est annulé : la position 291 ne suit plus le contrat.':'')); };
    hd.innerHTML=tete(p.NUMBER||'','Devis général'+(et?' · '+et:''),d.VERSION||'(sans titre)',[p.TITLE,mo?'Maître de l’ouvrage : '+mo:'',d.VERSIONNUMBER!=null?'version '+d.VERSIONNUMBER:'',d.CHANGEDDATE?'modifié le '+dfr(d.CHANGEDDATE)+(d.USERID?' par '+d.USERID:''):''].filter(Boolean).join(' · '),'<button class="nx-btn" data-a="liste" title="Retour à la page des devis du projet">‹ Devis du projet</button>');
    /* degré de précision du devis (Paulo, 07.11.2026 : « ajoute le degré de précision du devis devant le total TTC ») = « Marge d'approximation du DG » des Paramètres
       (E.reglages.marge) ; textes modèles « [...] » de l'ancien logiciel ignorés ; vide → « — » et lien « définir » (Paramètres) pour qui peut écrire */
    const mg=(()=>{ const m=String(((X.E||{}).reglages||{}).marge||'').trim(); return !m||/^\[.*\]/.test(m)?'':m.replace(/^±\s*/,'±').replace(/\s*%$/,' %'); })();
    const precK='<div class="nx-kpi sgde-prec" title="Degré de précision du devis : marge d’approximation (Paramètres ▸ Information)"><div class="l">Précision</div><div class="v">'+(mg?esc(mg):'—')+'</div>'
      +(mg?'':ec&&ch02aCanEdit(ch02aHdr(X))?'<div class="s"><button class="sgde-hreg" data-a="prec" title="Définir la marge d’approximation (onglet Paramètres)">définir</button></div>':'')+'</div>';
    kp.innerHTML=precK+kpi('Total TTC',num2(T.ttc),ff||(T.opt?'+ '+num2(T.opt)+' exclus':''),'','Total du devis, TVA comprise')+(sepV?kpi('Total HT',num2(T.ht),'')+kpi('TVA '+tvaLib,num2(T.tva),'','',tvaTip):'')+kpi('Montant soumis HT',num2(T.hon),(hR?'<button class="sgde-hreg" data-a="hreg" title="'+hR+(hR>1?' positions ne suivent pas':' position ne suit pas')+' la règle du bureau : 100 %, sauf CFC 5 et honoraires (583 compris)">appliquer la règle</button>':''),'','Montant hors taxe soumis aux honoraires, selon le pourcentage de chaque position (libellé court : une seule ligne, comme la colonne « Montant soumis HT »)')+honKpi()+kpi('Positions',String(nC),'<span class="sgde-npos">sur '+fe.length+'</span>','',nC+(nC>1?' positions chiffrées':' position chiffrée')+' sur '+fe.length+' ; '+(fe.length-nC)+((fe.length-nC)>1?' positions sans montant':' position sans montant')); };
  kp.addEventListener('click',e=>{ const a=e.target.closest&&e.target.closest('[data-a]'); if(!a) return; if(a.dataset.a==='hreg') regleHon(X); else if(a.dataset.a==='hcont') honReprendre(X); else if(a.dataset.a==='prec') S.ouvrirPar('marge'); });
  dessOng(); dessNiv(); ong.append(ongL,niv);   /* légende du montant saisi retirée (Paulo, 07.11.2026) : l'infobulle du cadre le dit */ X.sgdeMaj();
  box.append(hd,kp,ong,bar,X.body,docs,par); if(X.dpane) docs.append(X.dpane); m.replaceChildren(box); box._plein(PLEIN); setTimeout(()=>honSync(X).catch(e=>console.error(e)),0);   /* honoraires du contrat signé (position 291) */   /* plein écran gardé d'un devis à l'autre pendant la séance */
  plan(S.cfc&&ec); if(!ec) S.cfc=false;
  const ouvertA=performance.now(); box.addEventListener('dblclick',e=>{ if(performance.now()-ouvertA<450){ e.stopPropagation(); e.preventDefault(); } },true);   /* double-clic d'habitude sur la liste : le 2e clic n'agit pas dans le devis */
  new MutationObserver(()=>deco(X)).observe(X.rp,{childList:true}); new MutationObserver(()=>decoCat(X)).observe(X.L.pane,{childList:true}); brancherGroupes(X);
  X.rp.addEventListener('keydown',e=>{ if(e.target.closest('input,textarea,select')) return;
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){ const L=[...X.rp.querySelectorAll('tbody tr:not(.sgde-cache)')], i=L.findIndex(t=>t.classList.contains('on')), n=L[i<0?0:i+(e.key==='ArrowDown'?1:-1)]; if(n){ e.preventDefault(); n.click(); n.scrollIntoView({block:'nearest'}); } }
    else if(e.key==='Enter'){ const t=X.rp.querySelector('tbody tr.on'); if(t){ e.preventDefault(); t.dispatchEvent(new MouseEvent('dblclick',{bubbles:true})); } } });
  deco(X); decoCat(X); ch02aUpd(X);
  if(typeof VIEW==='object'&&VIEW) VIEW.nxTitle=[X.p&&X.p.NUMBER,(ch02aHdr(X)||{}).VERSION].filter(Boolean).join(' · '); }
const cx0=ch02aCtx; ch02aCtx=function(o){ const X=cx0(o); SGDE.X=X; return X; };
/* fermer un devis = page des devis de son projet (Paulo, 07.11.2026 : « retour à la page des devis du projet »), d'où qu'il ait été ouvert (liste de tous les devis, recherche,
   reprise de session…) : page du projet ▸ Devis général ; sans projet connu, le retour du moteur (DV.back, sinon la liste des devis) */
{ const cl0=ch02aClose; ch02aClose=function(X){ const pid=X&&X.p&&X.p.ID; if(pid!=null&&typeof NX_VIEW!=='undefined'&&NX_VIEW['nx-pdom']&&(typeof sgProjetPermis!=='function'||sgProjetPermis(pid))) DV.back=()=>go('nx-pdom',pid+'|Devis général'); return cl0.apply(this,arguments); }; }
const ed0=dvEditor; dvEditor=function(m,id){ ed0(m,id); const X=SGDE.X; if(X&&X.m===m&&+X.id===+id) try{ habiller(m,X); }catch(e){ console.error(e); } };
const u0=ch02aUpd; ch02aUpd=function(X){ u0(X); if(X.sgde&&X.bWh) X.bWh.disabled=false; if(X.bModif){ const q=ch02aSelPos(X); X.bModif.disabled=!(q&&!q.genere); } };   /* Fonctions regroupe aussi ce qui reste utile sur un devis vide : seul Exporter y est grisé */
const t0=ch02aTotals; ch02aTotals=function(X){ t0(X); if(X.sgdeMaj) X.sgdeMaj(); if(X.sgde&&X.sgde.ong==='par'&&X.sgde.par) parPage(X,X.sgde.par,false); };
const dr0=ch02aDraw; ch02aDraw=function(X){ dr0(X); if(X.sgde) decoCat(X); };
/* documents : une ligne par document, ses actions à côté ; les fichiers PDF du moteur suivent */
const ETAT_DOC=(d,f,pdf)=>[d?'Document créé':'Pas encore créé',...(pdf?[f?'PDF créé : '+f.NOM:'sans PDF']:[])].join(' · ');
/* PDF d'une ligne : le moteur ne connaît que le PDF officiel (documents/<genre>.pdf) ; « Créer le PDF » écrit dans documents/archive, sous le nom proposé. Sans ceci, la ligne restait « sans PDF » juste après sa création. Affichage seulement : les règles du moteur (ch02cPdfHas : effacer, avertir à l'ouverture) ne changent pas. Un PDF renommé reste dans la liste Fichiers PDF. */
const pdfLigne=(X,r)=>{ try{ return ch03aTrouve(ch02cDos(X),r.g+'.pdf')||ch03aTrouve(ch02cDos(X,'archive'),ch03aNomPdf(r.pdf))||null; }catch(_){ return null; } };
/* ordre des documents du devis (Paulo, 08.11.2026 : « modifier l'ordre, et même ordre dans la liste des fichiers PDF ») : Devis général, Devis descriptif,
   Honoraires — indices du moteur (CH02C_ROWS) gardés */
const ORDRE_DOCS=[0,2,1];
function docsLignes(X){ const dp=X.dpane, K=dp?[...dp.children]:[]; if(K.length<2||!K[1].classList.contains('pane')) return; const pdf=ch02cPdfOn(), L=el('div','sgde-dl');
  ORDRE_DOCS.forEach(i=>{ const r=CH02C_ROWS[i]; if(!r) return; const d=ch02cHas(X,i), f=ch02cPdfHas(X,i), fl=pdfLigne(X,r), it=ch02cNewItems(X,i).filter(x=>x!=='-'), gen=it[2], c=el('div','sgde-dc','<div class="t"><b>'+E(r.t)+'</b><span>'+E(i===0?['Modèle du bureau (ancien logiciel)',...(pdf?[fl?'PDF créé : '+fl.NOM:'sans PDF']:[])].join(' · '):ETAT_DOC(d,fl,pdf))+'</span></div><div class="a"></div>'), a=c.querySelector('.a');   /* ligne 0 : devis général au modèle du bureau (bloc 46), toujours prêt */
    a.append(ibtn({label:d||i===0?'Ouvrir':'Créer le document',fn:()=>ch02cOpen(X,i)}),...(pdf?[ibtn({label:'Créer le PDF',dis:gen?!!gen.dis:true,fn:()=>gen&&gen.fn&&gen.fn()}),ibtn({label:'Ouvrir le PDF',dis:!fl,fn:()=>{ const x=pdfLigne(X,r); if(x) ch03aOuvrir(x); }})]:[]),ibtn({label:CH02C_L.prefs,menu:()=>ch02cPrefItems(X,i)}),ibtn({label:CH02C_L.suppr,dis:!d&&!f,menu:()=>ch02cDelItems(X,i)})); L.append(c); });
  K[0].remove(); K[1].replaceWith(L); dp.querySelectorAll(':scope>.sgde-dh').forEach(x=>x.remove()); L.before(el('div','ph2 sgde-dh','<b>Devis</b>'));   /* titre de la section, comme « Fichiers PDF » (Paulo, 07.11.2026 : « ajouter ici Devis ») */
  const bz=K[2]&&K[2].querySelector('.ib'); if(bz) bz.style.display='none';   /* « Fonctions » retiré (Paulo, 08.11.2026 : « supprimer et ajouter la fonction au bouton de droite ») : même menu au clic droit sur la liste */
}
const dp0=ch02cDocPane; ch02cDocPane=function(X){ dp0(X); if(X.sgde) try{ docsLignes(X); }catch(e){ console.error(e); } };
/* fenêtre des documents du devis (Devis général, Honoraires, Devis descriptif) : sans « Modifier les textes… » (Paulo, 07.11.2026 : « supprimer ») ; les « Réglages » restent dans la barre.
   Les autres visionneuses (contrôle des coûts, soumission…) gardent le bouton. */
{ let sansTextes=false; const v0=ch02cView, a0=ch01aView;
  ch02cView=function(){ sansTextes=true; try{ return v0.apply(this,arguments); } finally{ sansTextes=false; } };
  ch01aView=function(t,R,o){ if(sansTextes&&o&&o.edit){ o=Object.assign({},o); delete o.edit; } return a0.call(this,t,R,o); }; }

/* ═══ Fenêtre d'aperçu des documents du devis (Devis général, Devis descriptif, Honoraires) = proposition 2 « Réglages en panneau », état présenté
   comme dans la proposition 1 (08.11.2026, Paulo : « je vais choisir la variante 2 mais je souhaite la représentation de l'état de la version 1 » ;
   maquettes : subgestion3/_backup_20261108_maquette_apercu/). La fenêtre du moteur (ch03bView) est gardée dessous : PDF ▾ et Partager ▾ sont ses
   boutons, déplacés tels quels ; le document est affiché par le lecteur de l'app (pdf.js du cadre Facturation, pages l'une sous l'autre, rendues à la
   demande) et un réglage coché le refait SANS revenir à la page 1 (même page, même position ; demande de Paulo : « ne pas redémarrer l'aperçu et
   laisser sur la page sur laquelle je me situe »). Réglages = ch02cPrefItems (mêmes cases que le menu), rangés en groupes, appliqués aussitôt. ═══ */
const ICV=d=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" aria-hidden="true">'+d+'</svg>';
const VUE_GROUPES=['Format','Positions','Calcul','Montants','Affichage','Sauts de page','Autres'];
const VUE_ORDRE=['Seulement positions de 1 à 3 chiffres','Afficher les positions saisies et les totalisateurs','Afficher les positions sans montant','Afficher les subdivisions',
  'Afficher le calcul','Quantités et prix','Quantités','Prix HT','Prix TTC','Commentaire du calcul','Bases de prix','Variantes',
  'Afficher les montants','Tous les montants détaillés','Uniquement les montants avec calculs et remarque','Masquer les décimales','Pourcentages sur le total général',
  'Descriptif','Assembler les descriptifs des ouvrages','Commentaire dans colonne séparée','Base et commentaire de la position','Base et commentaire dans colonne séparée'];
const VUE_RETRAIT=new Set(['Quantités et prix','Quantités','Prix HT','Prix TTC','Commentaire du calcul','Bases de prix','Base et commentaire dans colonne séparée','Assembler les descriptifs des ouvrages']);
const vueGroupe=t=>/^format\s*:/i.test(t)?'Format':/sauts? de page/i.test(t)?'Sauts de page':/^uniquement les montants|^arrondir à|montants|décimales|pourcentages/i.test(t)?'Montants'
  :/calcul|quantités|prix ht|prix ttc|bases de prix|variantes/i.test(t)?'Calcul':/positions|chiffres|subdivisions/i.test(t)?'Positions':/descriptif|commentaire/i.test(t)?'Affichage':'Autres';
function vueDoc(D,X,i,rec){ const dlg=D&&D.bd&&D.bd.parentNode, ifr=D&&D.iframe; if(!dlg||!ifr||typeof sgLecteurPdf!=='function') return; cssD();
  const bar=D.bd.querySelector('.ph2'), btn=re=>bar?[...bar.querySelectorAll('button,.ib')].find(b=>re.test((b.textContent||'').trim())):null;
  const pdfB=btn(/^PDF/), partB=btn(/^Partager/), hdr=ch02aHdr(X)||{}, etat=DV_STATE[hdr.STATECODE]||'', p=X.p||{};
  /* relecture du 08.11.2026 : en lecture seule (profil sans « chantier : écriture » ou devis verrouillé), le panneau ne change rien */
  const peut=()=>{ try{ return ecrit()&&ch02aCanEdit(ch02aHdr(X)); }catch(_){ return true; } };
  dlg.classList.add('sgdv-dlg');
  const R=el('div','sgdv','<div class="sgdv-tete"><div class="sgdv-ini">'+E(p.NUMBER||'')+'</div><div class="sgdv-nm"><div class="lb">Descriptifs &amp; devis · Documents</div><h3>'
      +E((rec&&rec.doc&&rec.doc.nom)||(CH02C_ROWS[i]||{}).t||'Document')+'</h3><div class="mt"></div></div>'
      +'<div class="sgdv-fig"><span class="l">Pages</span><span class="v sgdv-np">—</span></div><div class="sgdv-fig"><span class="l">État</span><span class="v et"><i></i>'+E(etat||'—')+'</span></div>'
      +'<div class="sgdv-act"><button class="sgdv-ib sgdv-imp" type="button" title="Imprimer le document">'+ICV('<path d="M7 9V4h10v5M7 17H4V9h16v8h-3M7 14h10v6H7z"/>')+'Imprimer</button></div></div>'
    +'<div class="sgdv-corps"><div class="sgdv-doc"></div>'
    +'<aside class="sgdv-reg" aria-label="Réglages du document"><div class="sgdv-rh"><h4>Réglages</h4><span>appliqués aussitôt</span></div><div class="sgdv-rb"></div>'
      +'<div class="sgdv-rf"><span class="pied"></span><button class="sgdv-btn" type="button">Fermer</button></div></aside></div>');
  const act=R.querySelector('.sgdv-act'); [pdfB,partB].forEach(b=>{ if(b){ b.classList.add('sgdv-moteur'); act.append(b); } });
  const garde=el('div','sgdv-garde'); garde.append(...D.bd.childNodes); D.bd.replaceChildren(R,garde);
  /* lecteur commun de l'app (sg3_lecteur.js, bloc 48) : pages, zoom, page gardée à la mise à jour, attente de la dernière version, erreurs signalées */
  const rb=R.querySelector('.sgdv-rb'); let dernier='';
  const tete=inf=>{ const n=inf?inf.n:L.n; R.querySelector('.sgdv-np').textContent=n||'—';
    R.querySelector('.sgdv-nm .mt').textContent=[p.TITLE||p.DESCRIPTION||'',n?n+(n>1?' pages':' page'):'',sglpFormat(inf?inf.page:L.premiere)].filter(Boolean).join(' · '); };
  const L=sgLecteurPdf({surInfo:inf=>tete(inf),surEchec:()=>{ dernier=''; panneau(); }});   /* mise à jour échouée : plus de mention « appliqué » */
  R.querySelector('.sgdv-doc').append(L.el);
  ifr._sgVue=blob=>L.charger(blob); ifr._sgVuePrep=()=>L.attendre(); ifr._sgVueErr=e=>L.echec(e);
  if(ifr._sgblob) L.charger(ifr._sgblob);
  /* réglages en panneau */
  const appliquer=it=>{ if(!it||it.dis||!peut()) return; try{ it.fn(); }catch(e){ console.error(e); } dernier=it.t; panneau();
    try{ D.maj(ch02cRender(X,i,DS.get(CH02C_T,rec&&rec.ID)||rec)); }catch(e){ console.error(e); L.echec(e); } };
  const panneau=()=>{ const ok=peut(), a=document.activeElement, kf=a&&rb.contains(a)&&a.dataset?a.dataset.k:null;
    const L0=(ch02cPrefItems(X,i)||[]).filter(x=>x&&x!=='-'&&x.t), G={}; VUE_GROUPES.forEach(g=>{ G[g]=[]; });
    L0.forEach(it=>{ G[vueGroupe(it.t)].push(it); });
    const rang=t=>{ const k=VUE_ORDRE.indexOf(t); return k<0?999:k; }, M=[]; let h='';
    const ck=it=>{ M.push(it); const dis=it.dis||!ok; return '<div class="sgdv-ck'+(it.chk?' on':'')+(dis?' dis':'')+(VUE_RETRAIT.has(it.t)&&(it.t!=='Base et commentaire dans colonne séparée'||L0.some(x=>x.t==='Base et commentaire de la position'))?' ind':'')+(it.t===dernier?' vient':'')+'" role="checkbox" aria-checked="'+(it.chk?'true':'false')+'"'+(dis?' aria-disabled="true"':'')+' tabindex="0" data-n="'+(M.length-1)+'" data-k="'+E(it.t)+'"><span class="sgdv-cb">'+ICV('<path d="m5 12 4.5 4.5L19 7"/>')+'</span><span>'+E(it.t)+'</span>'+(it.t===dernier?'<em>appliqué</em>':'')+'</div>'; };
    const seg=(lib,opts)=>'<div class="sgdv-sg">'+(lib?'<span>'+E(lib)+'</span>':'')+'<div class="sgdv-seg'+(ok?'':' dis')+'" role="radiogroup"'+(lib?' aria-label="'+E(lib)+'"':'')+'>'+opts.map(o=>{ M.push(o.it); return '<b class="'+(o.on?'on':'')+'" role="radio" aria-checked="'+(o.on?'true':'false')+'" tabindex="0" title="'+E(o.ti||o.l)+'" data-n="'+(M.length-1)+'" data-k="'+E('seg:'+lib+':'+o.l)+'">'+E(o.l)+'</b>'; }).join('')+'</div></div>';
    VUE_GROUPES.forEach(g=>{ let A=G[g].slice().sort((a,b)=>rang(a.t)-rang(b.t)); if(!A.length) return; let corps='';
      if(g==='Montants'){ const ar=A.filter(x=>/^arrondir à/i.test(x.t)); A=A.filter(x=>!/^arrondir à/i.test(x.t)); const sp=A.findIndex(x=>/pourcentages/i.test(x.t)), av=sp<0?A:A.slice(0,sp), ap=sp<0?[]:A.slice(sp);
        corps=av.map(ck).join('')+(ar.length?seg('Arrondir à',[{l:'aucun',ti:'Sans arrondi',on:!ar.some(x=>x.chk),it:ar.find(x=>x.chk)?Object.assign({},ar.find(x=>x.chk),{chk:false}):null},...ar.map(x=>({l:x.t.replace(/^arrondir à\s*/i,''),on:x.chk,it:x.chk?null:x}))]):'')+ap.map(ck).join(''); }
      else if(g==='Sauts de page') corps=seg('',A.map(x=>({l:/^sans/i.test(x.t)?'Sans sauts de page':x.t.replace(/^sauts de page\s*:\s*/i,''),ti:x.t,on:x.chk,it:x.chk?null:x})));
      else if(g==='Format') corps=seg('',A.map(x=>({l:x.t.replace(/^format\s*:\s*/i,''),ti:'Document en '+x.t.replace(/^format\s*:\s*/i,'').toLowerCase(),on:x.chk,it:x.chk?null:x})));   /* paysage ou portrait (08.11.2026) */
      else corps=A.map(ck).join('');
      h+='<div class="sgdv-gt">'+E(g)+'</div>'+corps; });
    rb.innerHTML=h||'<div class="sgdv-msg">Aucun réglage pour ce document.</div>'; rb._M=M;
    R.querySelector('.sgdv-rf .pied').textContent=ok?'Enregistrés dans le devis':'Lecture seule : réglages non modifiables';
    /* relecture : le panneau est redessiné à chaque réglage ; le focus revient sur le même réglage (Échap ferme encore la fenêtre, Tab ne repart pas du début) */
    if(kf!=null){ const x=[...rb.querySelectorAll('[data-k]')].find(e=>e.dataset.k===kf); try{ (x||L.vue).focus({preventScroll:true}); }catch(_){} } };
  rb.addEventListener('click',e=>{ const x=e.target.closest&&e.target.closest('[data-n]'); if(!x) return; appliquer((rb._M||[])[+x.dataset.n]); });
  rb.addEventListener('keydown',e=>{ if(e.key!==' '&&e.key!=='Enter') return; const x=e.target.closest&&e.target.closest('[data-n]'); if(!x) return; e.preventDefault(); appliquer((rb._M||[])[+x.dataset.n]); });
  panneau();
  R.querySelector('.sgdv-imp').addEventListener('click',()=>L.imprimer());
  const ov=dlg.closest('.ov')||dlg;
  /* Échap quand le focus est sorti de la fenêtre (cadre d'impression, clic hors champ) : la fenêtre du dessus se ferme quand même */
  const escDoc=e=>{ if(e.key!=='Escape'||!dlg.isConnected||e.defaultPrevented||ov.contains(document.activeElement)||document.querySelector('.menu,.sg-visu')) return;
    const ovs=[...document.querySelectorAll('.ov')]; if(ovs[ovs.length-1]!==ov) return; e.preventDefault(); e.stopPropagation(); D.close(); };
  document.addEventListener('keydown',escDoc,true);
  let vivant=true; const fini=()=>{ if(!vivant) return; vivant=false; document.removeEventListener('keydown',escDoc,true); try{ L.fini(); }catch(_){} ifr._sgVue=ifr._sgVuePrep=ifr._sgVueErr=null; };
  R.querySelector('.sgdv-btn').addEventListener('click',()=>{ D.close(); });
  const mo=new MutationObserver(()=>{ if(!dlg.isConnected){ fini(); mo.disconnect(); } }); mo.observe(ov.parentNode||document.body,{childList:true});
  const c0=D.close; D.close=function(){ fini(); return c0.apply(this,arguments); };
  setTimeout(()=>L.focus(),0); tete(); }
{ const v1=ch02cView; ch02cView=function(X,i,rec,R){ const D=v1.apply(this,arguments); if(X&&X.sgde&&D&&D.bd) try{ vueDoc(D,X,+i,rec); }catch(e){ console.error(e); } return D; }; }

/* ═══ Fichiers PDF : commentaire, groupes par document, menu au clic droit (08.11.2026, Paulo : « lorsque je crée le PDF, ajouter une cellule
   commentaire ; ajouter commentaire dans la liste des PDF », « créer des groupes de type de fichier : Devis, Honoraires, Descriptif ») ═══
   - fenêtre « Nom du fichier » de « Créer le PDF » (ch03bNouveauPdfDlg, toutes les listes de PDF) : champ « Commentaire », prérempli avec celui du
     fichier du même nom ; enregistré dans le fichier (depotfichier.COMMENTAIRE) avec le document d'origine (GENRE_DOC : devis | honoraires |
     descriptif, posé par « Créer le PDF » des documents du devis) ; un PDF remplacé autrement garde son commentaire et son document ;
   - listes « Fichiers PDF » (ch03cPdfZone) : colonne « Commentaire » ; double-clic sur le commentaire ou clic droit ▸ « Modifier le commentaire… » ;
   - devis : liste rangée en groupes Devis · Descriptif · Honoraires (+ Autres : PDF importés, fusionnés…) ; PDF créés avant : document reconnu au
     nom par défaut (« Devis général », « Montant soumis », « Devis descriptif »). */
const SGPDF={attente:null,genre:null,ctx:null};
const GENRE_LIGNE=['devis','honoraires','descriptif'];   /* document d'origine par indice du moteur (CH02C_ROWS) */
const PDF_GENRES=[['devis','Devis'],['descriptif','Descriptif'],['honoraires','Honoraires']];   /* ordre des groupes = ordre des documents (ORDRE_DOCS) */
const pdfCle=v=>String(v==null?'':v).normalize('NFC').trim().toLowerCase();
const pdfGenre=r=>{ if(r&&r.GENRE_DOC) return r.GENRE_DOC; const n=pdfCle(r&&r.NOM);
  for(let i=0;i<CH02C_ROWS.length&&i<GENRE_LIGNE.length;i++){ const p=pdfCle(CH02C_ROWS[i].pdf); if(p&&n.startsWith(p)) return GENRE_LIGNE[i]; } return 'autres'; };
const ICO_PDF='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/></svg>';
const pdfPeut=M=>!(M&&M.ro&&M.ro())&&(typeof sgDroit!=='function'||!!sgDroit('documents','depot'));
{ const nd0=ch03bNouveauPdfDlg; ch03bNouveauPdfDlg=function(nom,dossier,o){ const n0=document.querySelectorAll('.dlg').length, p=nd0.apply(this,arguments), L=document.querySelectorAll('.dlg'), dlg=L.length>n0?L[L.length-1]:null;
    let ta=null; try{ const f=dlg&&dlg.querySelector('.form'), inp=f&&f.querySelector('input.inp');
      if(f&&inp){ ta=document.createElement('textarea'); ta.className='inp sgpdf-ta'; ta.rows=3; ta.placeholder='Facultatif'; let touche=false;
        const pre=()=>{ if(touche) return; const ex=ch03aNomPdf(inp.value)?ch03aTrouve(dossier,ch03aNomPdf(inp.value)):null; ta.value=ex&&ex.COMMENTAIRE?String(ex.COMMENTAIRE):''; };
        ta.addEventListener('input',()=>{ touche=true; }); inp.addEventListener('input',pre);
        const lb=document.createElement('label'); lb.textContent='Commentaire'; f.append(lb,ta); pre(); } }catch(e){ console.error(e); }
    const g=SGPDF.genre;
    return Promise.resolve(p).then(n=>{ if(n!=null) SGPDF.attente={dos:ch03aDos(dossier),nom:pdfCle(n),com:ta?ta.value.trim():null,genre:g||null}; return n; }); }; }
/* enregistrement : commentaire et document d'origine posés dans le même DS.commit que le fichier ; gardés quand un PDF est remplacé sans la fenêtre */
{ const en0=ch03aEnregistrer; ch03aEnregistrer=async function(dossier,nom,r,o){ const dos=ch03aDos(dossier), cle=pdfCle(nom), A0=SGPDF.attente;
    const A=A0&&A0.dos===dos&&A0.nom===cle?A0:null; if(A) SGPDF.attente=null;
    const ex=ch03aTrouve(dos,nom), garde={}; if(ex){ if(ex.COMMENTAIRE) garde.COMMENTAIRE=ex.COMMENTAIRE; if(ex.GENRE_DOC) garde.GENRE_DOC=ex.GENRE_DOC; }
    if(A){ if(A.com!=null){ if(A.com) garde.COMMENTAIRE=A.com; else delete garde.COMMENTAIRE; } if(A.genre) garde.GENRE_DOC=A.genre; }
    if(!Object.keys(garde).length) return en0.apply(this,arguments);
    const dc0=DS.commit; DS.commit=function(ops){ (Array.isArray(ops)?ops:[]).forEach(op=>{ if(op&&op.t===CH03A_T&&op.val&&op.val.DOSSIER===dos&&pdfCle(op.val.NOM)===cle) Object.assign(op.val,garde); }); return dc0.apply(this,arguments); };
    try{ return await en0.apply(this,arguments); } finally{ DS.commit=dc0; } }; }
function pdfCommentaire(M,id){ const rec=DS.get(CH03A_T,id); if(!rec) return; if(!pdfPeut(M)){ toast('Commentaire en lecture seule.',true); return; }
  const ta=h('textarea',{class:'inp sgpdf-ta',rows:4}); ta.value=rec.COMMENTAIRE||'';
  dialog({title:'Commentaire du PDF',body:formRows([['Fichier',h('div',{style:{paddingTop:'6px'}},rec.NOM)],['Commentaire',ta]],460),buttons:[{t:'Annuler'},{t:'OK',pri:true,fn:()=>{
    const v=ta.value.trim(), cur=DS.get(CH03A_T,id)||rec; if(String(cur.COMMENTAIRE||'')===v) return; const val=Object.assign({},cur); if(v) val.COMMENTAIRE=v; else delete val.COMMENTAIRE;
    DS.commit([{t:CH03A_T,id,val,bseq:ctBseq(CH03A_T,id)}]).catch(e=>{ if(!(e&&e.conflict)) toast((e&&e.message)||String(e),true); }); }}]});
  setTimeout(()=>{ ta.focus(); ta.setSelectionRange(ta.value.length,ta.value.length); },0); }
function pdfGroupes(el,o){ const tb=el.querySelector('tbody'); if(!tb) return; const nc=(o.cols||[]).length||3, cle=o.key||(r=>r.ID), par=new Map((o.rows||[]).map(r=>[String(cle(r)),r]));
  const trs=[...tb.rows].filter(t=>t.dataset&&t.dataset.k), ordre=[...PDF_GENRES,['autres','Autres']], gi=t=>{ const r=par.get(t.dataset.k); const k=ordre.findIndex(x=>x[0]===pdfGenre(r)); return k<0?ordre.length-1:k; };
  ordre.forEach(([k,lib],i)=>{ const L=trs.filter(t=>gi(t)===i); if(!L.length&&k==='autres') return;
    const hd=document.createElement('tr'); hd.className='sgpdf-g'+(L.length?'':' vide'); hd.innerHTML='<td colspan="'+nc+'">'+E(lib)+(L.length?'<small>'+L.length+(L.length>1?' fichiers':' fichier')+'</small>':'')   /* « aucun PDF » retiré (Paulo, 08.11.2026 : « supprimer ») */+'</td>';
    tb.insertBefore(hd,L.length?L[0]:(trs.find(t=>gi(t)>i)||null)); }); }
{ const g0=grid; grid=function(el,o){ const M=el&&el._sgPdf; if(!M||!o||!Array.isArray(o.cols)) return g0.apply(this,arguments);
    o.cols.forEach(c=>{ if(c._sgpdf) return; c._sgpdf=true;
      if(c.k==='NOM'){ c.w=c.w||300; if(!c.f) c.f=r=>'<span class="sgpdf-nom">'+ICO_PDF+E(r.NOM||'')+'</span>'; }
      else if(c.k==='MODIFIED'){ c.w=170; c.t='Dernière modification'; c.cls=((c.cls||'')+' r').trim(); } });
    if(!o.cols.some(c=>c.k==='COMMENTAIRE')){ const i=o.cols.findIndex(c=>c.k==='NOM');
      o.cols.splice(i<0?1:i+1,0,{k:'COMMENTAIRE',t:'Commentaire',f:r=>'<span class="sgpdf-com" title="'+E(r.COMMENTAIRE?'Double-cliquez pour modifier le commentaire':'Double-cliquez pour ajouter un commentaire')+'">'+E(r.COMMENTAIRE||'')+'</span>'}); }
    const dv=M.devis(); if(dv&&Array.isArray(o.rows)){ const ordre=PDF_GENRES.map(x=>x[0]), rg=r=>{ const k=ordre.indexOf(pdfGenre(r)); return k<0?ordre.length:k; };
      o.rows=o.rows.map((r,i)=>({r,i,g:rg(r)})).sort((a,b)=>a.g-b.g||a.i-b.i).map(x=>x.r); }
    const res=g0.apply(this,arguments); el.classList.toggle('sgpdf-dv',!!dv); if(dv) try{ pdfGroupes(el,o); }catch(e){ console.error(e); } return res; }; }
{ const pm0=popMenu; popMenu=function(at,items){ const C=SGPDF.ctx; if(C){ SGPDF.ctx=null; const L=typeof items==='function'?items():items;
      if(Array.isArray(L)) items=[...L,...(L.length?['-']:[]),{t:'Modifier le commentaire…',dis:!C.id||!pdfPeut(C.M),fn:()=>pdfCommentaire(C.M,C.id)}]; }
    return pm0.apply(this,[at,items,...[].slice.call(arguments,2)]); }; }
{ const z0=ch03cPdfZone; ch03cPdfZone=function(o){ const z=z0.apply(this,arguments); try{ if(z&&z.el){
      const val=v=>typeof v==='function'?v():v, M={dos:()=>val(o&&o.dossier), ro:()=>!!val(o&&o.lectureSeule), devis:()=>/(^|\/)Costestimate\/.+\/archive$/i.test(String(val(o&&o.dossier)||''))};
      z.el._sgPdf=M; z.el.classList.add('sgpdf');
      z.el.addEventListener('dblclick',e=>{ const td=e.target.closest&&e.target.closest('td'), tr=td&&td.parentNode; if(!tr||!tr.dataset||!tr.dataset.k||!td.querySelector('.sgpdf-com')) return;
        e.stopPropagation(); e.preventDefault(); pdfCommentaire(M,tr.dataset.k); },true);
      z.el.addEventListener('contextmenu',e=>{ const tr=e.target.closest&&e.target.closest('tr[data-k]'); SGPDF.ctx={M,id:tr?tr.dataset.k:null}; setTimeout(()=>{ SGPDF.ctx=null; },0); },true);
      if(z.redraw) z.redraw(); } }catch(e){ console.error(e); } return z; }; }

/* ── fenêtre « Calcul pour <CFC> » ── */
const TH_CALC={'Calcul de quantités':['Formule','Calcul des quantités : formule, par exemple 12.5*3'],Base:['Base','Base du prix'],'Quantité':['Résultat','Quantité : résultat de la formule, ou saisie s’il n’y a pas de formule'],
  'Unité':['Unité','Unité de la quantité'],'Prix HT':['HT','Prix unitaire hors TVA'],'Prix TTC':['TTC','Prix unitaire TVA comprise'],TVA:['TVA %','Taux de TVA de la ligne'],Montant:['Montant TTC','Montant de la ligne, TVA comprise'],
  Var:['Var.','Variante : la ligne n’est pas comptée dans le total']};
const COLS_CALC=[0,104,100,92,64,80,80,56,104,40];
/* icônes de la barre (proposition 2 « Tableur ») et libellés courts ; ancien titre du moteur → [icône, libellé] */
const IC_CALC=(d)=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" aria-hidden="true">'+d+'</svg>';
const OUT_CALC={'Insérer une ligne':[IC_CALC('<path d="M12 5v14M5 12h14"/>'),'Insérer'],'Effacer la ligne':[IC_CALC('<path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/>'),'Effacer'],
  'Déplacer au début':[IC_CALC('<path d="M5 4h14M12 20V9M7 13l5-5 5 5"/>'),'Haut'],'Déplacer vers le haut':[IC_CALC('<path d="M12 19V6M6 11l6-6 6 6"/>'),'Monter'],
  'Déplacer vers le bas':[IC_CALC('<path d="M12 5v13M6 13l6 6 6-6"/>'),'Descendre'],'Déplacer à la fin':[IC_CALC('<path d="M5 20h14M12 4v11M7 11l5 5 5-5"/>'),'Bas']};
const COLN_CALC=['Commentaire','Base','Formule','Résultat','Unité','Prix HT','Prix TTC','TVA %','Montant TTC','Variante'];
const nCalc=t=>{ const v=parseFloat(String(t||'').replace(/['’\s]/g,'').replace(/[^0-9.\-]/g,'')); return isFinite(v)?v:null; };
function habCalc(dlg,X){ const bd=dlg.querySelector('.bd'), body=bd&&bd.firstElementChild, host=body&&body.lastElementChild, pos=(X.E.positions||[]).find(x=>String(x.cfc)===String(X.st.sel)); if(!host||!pos) return; cssD();
  dlg.classList.add('sgdc-dlg'); dlg.style.width=''; body.classList.add('sgdc'); host.classList.add('sgdc-host');
  const ft=dlg.querySelector('.ft'); if(ft&&!ft.querySelector('.sgdc-aide')) ft.prepend(el('div','sgdc-aide','<span><kbd>Tab</kbd>ou <kbd>Entrée</kbd> cellule suivante</span><span><i></i>saisie</span><span><i class="k"></i>calculé</span><span><i class="a"></i>cellule active</span>'));
  /* cellule active (proposition 2) : n° de ligne, colonne et contenu, à droite de la barre */
  const majRef=c=>{ const ref=host.querySelector('.sgdc-ref'), td=c&&c.isConnected&&c.closest&&c.closest('tbody td'); if(!ref||!td) return; const tr=td.parentNode;   /* champ détaché (ancienne grille, après un redessin) : ignoré */
    const v=c.tagName==='SELECT'?((c.options[c.selectedIndex]||{}).text||''):c.type==='checkbox'?(c.checked?'oui':'non'):c.value;
    ref.innerHTML='<b>L'+(tr.sectionRowIndex+1)+'</b><span>'+E(COLN_CALC[td.cellIndex]||'')+'</span><i>'+E(v)+'</i>'; ref.title='Cellule active'; };
  host.addEventListener('focusin',e=>majRef(e.target)); host.addEventListener('input',e=>majRef(e.target)); host.addEventListener('change',e=>majRef(e.target));
  const t=el('div','sgfh-tete','<div class="sgfh-id"><div class="sgfh-ini">'+E(pos.cfc)+'</div><div class="sgfh-nm"><div class="lb">'+E(['Calcul de la position',(ch02aHdr(X)||{}).VERSION].filter(Boolean).join(' · '))+'</div><h2>'+E([pos.texte,pos.texte2].filter(Boolean).join(' '))+'</h2></div></div><div class="sgdc-tot"></div>'), slot=t.querySelector('.sgdc-tot'); bd.prepend(t);
  host.tabIndex=-1; host.style.outline='none'; let rep=null, ajout=null; const ctl=(tr,c)=>{ const td=tr&&tr.cells[c]; return td?td.querySelector('input,select'):null; };
  const poser=()=>{ const K=[...host.children]; if(K.length<5||K[0].classList.contains('sgdc-outils')) return; const actif=document.activeElement, [out,tab,opts,desc,bas]=K, sp=[...out.children].find(x=>x.style&&x.style.flex), tb=tab.querySelector('table'), bdy=tb&&tb.tBodies[0];
    out.classList.add('sgdc-outils'); tab.classList.add('sgdc-tab'); opts.classList.add('sgdc-opts'); desc.classList.add('sgdc-desc');
    const totB=sp&&sp.nextElementSibling; if(totB) slot.replaceChildren(totB); if(sp) sp.before(...bas.children); else out.append(...bas.children); bas.remove();
    [...out.children].forEach(b=>{ const m=OUT_CALC[b.title||'']; if(m) b.innerHTML=m[0]+'<span class="lb">'+E(m[1])+'</span>'; });
    const fx=[...out.children].find(b=>/Fixer/.test(b.title||'')); if(fx) lib(fx,'Fixer le coût');
    const bt=t0=>[...out.children].find(b=>b.title===t0); [bt('Effacer la ligne'),bt('Déplacer à la fin')].forEach(b=>{ if(b) b.after(el('span','sgdc-sep')); });
    if(sp) sp.after(el('div','sgdc-ref')); else out.append(el('div','sgdc-ref'));
    /* totaux : lus dans la boîte du moteur (cachée), affichés dans le bandeau et en pied du tableau */
    const T={}; if(totB){ const k=[...totB.children]; k.forEach((x,i)=>{ if(x.tagName!=='SPAN'||!k[i+1]) return; const lb=x.textContent.trim(), v=nCalc(k[i+1].textContent); if(lb==='Total TTC') T.ttc=v; else if(lb==='Total HT') T.ht=v; else if(/fix/i.test(lb)) T.fixe=v; }); }
    const lignes=bdy?[...bdy.rows]:[], varL=r=>{ const c=r.cells[9]&&r.cells[9].querySelector('input'); return !!(c&&c.checked); };
    const taux=[...new Set(lignes.filter(r=>!varL(r)).map(r=>{ const c=ctl(r,7); return c?nCalc(c.value):null; }).filter(v=>v!=null))];
    const tvaLb='TVA'+(taux.length===1?' '+String(taux[0])+' %':''), tva=T.ht!=null&&T.ttc!=null?T.ttc-T.ht:null;
    /* coût fixé : c'est le montant de la position (il remplace les lignes) → en grand ; plusieurs ouvrages : total de l'ouvrage affiché, nommé */
    const ouvOn=body.querySelector('.seg .on'), ouv=ouvOn&&body.querySelector('.seg').children.length>1?ouvOn.textContent.trim():'';
    if(T.ttc!=null){ const fx0=T.fixe!=null, lgn=fx0?'Lignes TTC <b>'+num2(T.ttc)+'</b>':'', s0=[lgn,tva!=null?'HT <b>'+num2(T.ht)+'</b> · '+E(tvaLb)+' <b>'+num2(tva)+'</b>':''].filter(Boolean).join(' · ');
      slot.append(el('div','sgdc-ttc','<div class="l">'+(fx0?'Coût fixé TTC':'Total TTC')+(ouv?' · '+E(ouv):'')+'</div><div class="v">'+num2(fx0?T.fixe:T.ttc)+'</div>'+(s0?'<div class="s">'+s0+'</div>':''))); }
    if(tb&&tb.tHead&&!tb.tHead.querySelector('.sgdc-grp')){ const g=document.createElement('tr'); g.className='sgdc-grp'; g.innerHTML='<th colspan="2"></th><th colspan="3">Quantité<small>formule → résultat · unité</small></th><th colspan="3">Prix<small>HT · TTC · TVA</small></th><th colspan="2"></th>'; tb.tHead.prepend(g); }
    if(tb&&tb.tHead&&tb.tHead.rows.length>1){ const h0=tb.tHead.rows[0].getBoundingClientRect().height; if(h0) [...tb.tHead.rows[1].cells].forEach(th=>{ th.style.top=h0+'px'; }); }   /* 2e rangée de titres figée sous la 1re */
    lignes.forEach(r=>{ if(r.cells[3]&&!ctl(r,3)) r.cells[3].classList.add('sgdc-k'); if(r.cells[8]) r.cells[8].classList.add('sgdc-mt'); });
    if(tb&&lignes.length&&T.ttc!=null){ const nV=lignes.filter(varL).length, nL=lignes.length, inf=nL+(nL>1?' lignes':' ligne')+' · '+(nV?nV+(nV>1?' en variante, non comptées':' en variante, non comptée'):'aucune en variante');
      const lg=(a,b,v,c)=>'<tr'+(c?' class="'+c+'"':'')+'><td colspan="3" class="inf">'+a+'</td><td colspan="5" class="lbl">'+E(b)+'</td><td class="v">'+num2(v)+'</td><td></td></tr>';
      const fx0=T.fixe!=null, tf=document.createElement('tfoot');
      tf.innerHTML=(tva!=null?lg(E(inf),'Total HT',T.ht)+lg('',tvaLb,tva):'')+lg(tva!=null?'':E(inf),fx0?'Total des lignes TTC':'Total TTC',T.ttc,fx0?'':'ttc')+(fx0?lg('','Coût fixé TTC',T.fixe,'ttc fixe'):''); tb.append(tf); }
    if(tb&&!tb.querySelector('colgroup')){ const cg=document.createElement('colgroup'); COLS_CALC.forEach(w=>{ const c=document.createElement('col'); if(w) c.style.width=w+'px'; cg.append(c); }); tb.prepend(cg); }
    if(tb) tb.querySelectorAll('thead th').forEach(th=>{ const m=TH_CALC[th.textContent.trim()]; if(m){ th.textContent=m[0]; th.title=m[1]; } });
    const f=[...opts.children]; if(f.length>=8){ const pa=(l,x,c)=>{ const w=el('div','f'+(c?' '+c:'')); w.append(l,x); return w; }; opts.replaceChildren(pa(f[0],f[1]),pa(f[2],f[3]),pa(f[4],f[5]),f[7]); }
    host.insertBefore(opts,out);   /* réglages au-dessus de la barre, aussi dans l'ordre du clavier (Tab), pas seulement à l'affichage */
    const hb=opts.querySelector('.f>div .ib'); if(hb){ hb.innerHTML=IC_CALC('<path d="m6 9 6 6 6-6"/>'); hb.title='Pourcentages usuels : 100, 90, 50 ou 0 %'; }
    if(bdy&&!bdy.rows.length) tab.append(el('div','sgdc-vide','Aucune ligne de calcul. Cliquez sur « Insérer » pour commencer.'));
    let n=null; if(rep&&bdy){ let [r,k,pas]=rep, q=bdy.rows[r]; rep=null; while(q&&!(n=ctl(q,k))){ k+=pas; if(k<0||k>=q.cells.length){ r+=pas; q=bdy.rows[r]; if(q) k=pas>0?0:q.cells.length-1; } } }   /* la quantité calculée n'a pas de champ : cellule suivante */
    else if(ajout&&bdy&&bdy.rows.length>ajout.n){ const tr=[...bdy.rows].find(r=>r.cells[0]&&r.cells[0].style.background); n=ctl(tr,0); ajout=null; }
    if(n){ n.focus(); if(n.select&&n.type!=='checkbox') n.select(); }
    else if(bdy&&!bdy.rows.length&&out.firstElementChild) out.firstElementChild.focus();   /* position vide : Espace insère la première ligne, Échap ferme */
    else if(actif===document.body){ const tr=bdy?[...bdy.rows].find(r=>r.cells[0]&&r.cells[0].style.background):null, c=ctl(tr,0); (c||host).focus({preventScroll:true}); }   /* champ détruit par le redessin : le clavier et Échap restent dans la fenêtre */
    else if(actif&&actif.isConnected&&dlg.contains(actif)) actif.focus();
    majRef(document.activeElement); };
  host.addEventListener('keydown',e=>{ const c=e.target; if((e.key!=='Tab'&&e.key!=='Enter')||!c.closest||!c.closest('tbody')||c.tagName==='TEXTAREA') return; const td=c.closest('td'), tr=td&&td.parentNode, tb=tr&&tr.parentNode; if(!tb) return; const pas=e.shiftKey?-1:1; let r=tr.sectionRowIndex, k=td.cellIndex, q=tr;
    for(;;){ k+=pas; if(k<0||k>=q.cells.length){ r+=pas; q=tb.rows[r]; if(!q) break; k=pas>0?0:q.cells.length-1; } if(ctl(q,k)) break; }
    rep=q?[r,k,pas]:null; setTimeout(()=>{ rep=null; },0);
    if(e.key==='Enter'&&c.type!=='checkbox'){ e.preventDefault(); c.blur(); const n=q&&ctl(q,k); if(n&&n.isConnected){ n.focus(); if(n.select) n.select(); } } });
  host.addEventListener('mousedown',e=>{ const c=e.target.closest&&e.target.closest('tbody input,tbody select'); if(!c||c===document.activeElement) return; const td=c.closest('td'); rep=[td.parentNode.sectionRowIndex,td.cellIndex,1]; setTimeout(()=>{ rep=null; },0); },true);
  /* outils : la saisie en cours est validée d'abord, sans perdre le clic (le moteur redessine tout à la modification) */
  host.addEventListener('mousedown',e=>{ if(e.target.closest&&e.target.closest('.sgdc-outils .ib')) e.preventDefault(); },true);
  host.addEventListener('click',e=>{ const b=e.target.closest&&e.target.closest('.sgdc-outils .ib'); if(!b) return; if(b===b.parentNode.firstElementChild){ const q=host.querySelector('tbody'); ajout={n:q?q.rows.length:0}; } const a=document.activeElement; if(a&&host.contains(a)&&a.closest('tbody')) a.blur(); },true);
  host.addEventListener('change',e=>{ const c=e.target; if(rep||!c.closest||!c.closest('tbody')||(c.tagName!=='SELECT'&&c.type!=='checkbox')) return; const td=c.closest('td'); rep=[td.parentNode.sectionRowIndex,td.cellIndex,1]; setTimeout(()=>{ rep=null; },0); },true);
  /* la ligne choisie suit le curseur : « Effacer la ligne » agit sur la ligne où l'on est */
  host.addEventListener('focusin',e=>{ const tr=e.target.closest&&e.target.closest('tbody tr'); if(tr&&tr.cells[0]&&!tr.cells[0].style.background) tr.click(); });
  new MutationObserver(poser).observe(host,{childList:true}); poser(); }
let SANS_CALC=false;   /* vrai pendant un ajout depuis la liste CFC : le moteur ouvrirait sa fenêtre de calcul (dvAdd → dvCalc) */
const ca0=ch02aCalc; ch02aCalc=function(X){ if(SANS_CALC) return; const n0=document.querySelectorAll('.dlg').length, r=ca0.apply(this,arguments), L=document.querySelectorAll('.dlg'); if(L.length>n0&&X.sgde) try{ habCalc(L[L.length-1],X); }catch(e){ console.error(e); } return r; };
/* ═══ DEVIS GÉNÉRAL EN PDF (bloc 46, 07.11.2026 ; Paulo : « voici à quoi devrait ressembler le DG pdf », 23JOG-DG_TRAVAIL_20260417.pdf de l'ancien logiciel) ═══
   Imprimer ▸ Devis général (PDF) : le livret du moteur (ch02bBook : mêmes règles que l'ancien logiciel) avec la présentation de la référence — page de garde, Information
   (remarques préliminaires, s'il y en a), récapitulatif à 2 chiffres, document principal (colonnes à 4, 3, 2, 1 chiffres TTC et [%], commentaire en colonne, lignes de
   calcul « Quantité … Prix … », descriptif, une rangée sur deux grisée), total — mis en pages pour le papier des contrats en paysage (gabarits de pages fournis ici : tableau
   de 728 pt, rangées de 15 pt) et dessiné par sgDsPdf (o.livretDG, sg3_docsub.js). Les sauts de page et le filtre (ouvrages) de la présentation favorite sont repris ;
   ses autres options sont remplacées par celles de la référence (DG_PRESET). Aucune donnée n'est écrite. */
const DG_PRESET={includeKvCover:true,includeKvOneDigit:false,includeKvTwoDigit:true,includeDocument:true,hierarchicalAdjust:true,lightHierarchicalAdjust:false,commentInColumn:false,displaySubprojectNames:true,displayComment:true,
  displayDescription:true,compactDescription:false,displayQuanPriceValue:true,displayDetailComment:true,displayDetailValues:true,dispalyCalcualtion:true,displayPriceBase:false,displayDetailOptions:true,
  displayDeviation:true,zebra:true,grayDetails:false,dispalyAfterComma:false,separateVat:false,displayValuesPositions:true,displayNoTitlePositions:true,displayPosOptions:true,onlyThreeDigits:false,
  titleFontSize:10,posFontSize:9,detailFontSize:8,rowHeigth:15,titlePosBold:true,detailItalic:false,specialRound:false,coverKvEmptyPages:0,kvOneDigitEmptyPages:0,kvTwoDigitEmptyPages:0,infoKvEmptyPages:0,
  titleFontName:'',standardFontName:'',detailFontName:'',kagNumberColTitle:'CFC',kagTextColTitle:'Texte',commentColTitle:'Commentaire',value4ColTitle:'à 4 chiffres TTC',value3ColTitle:'à 3 chiffres TTC',
  value2ColTitle:'à 2 chiffres TTC',value1ColTitle:'à 1 chiffre TTC',devColTitle:'[%]',infoNameColTitle:'',infoDescColTitle:''};
const DG_W=728, DG_RH=15, DG_HT=388, DG_HI=388, DG_X0T=85.04, DG_CFC=40.68, DG_WL=674.25, DG_WP=427.64, DG_WIL=730.94, DG_WIP=484.33, DG_HP=630;   /* « déplacer les numéros de CFC » (08.11.2026) : numéros CFC dans la marge à x 85.04 (comme les numéros de chapitre des contrats), texte à x 125.72 (2e colonne du pied) — colonne CFC de 40.68 pt */   /* (08.11.2026, Paulo) tableaux de x 125.72 (2e colonne du pied) jusqu'à 2 pt après la barre verticale du numéro de page (largeur − 84.6 : paysage 757.29, portrait 510.68), de sorte que la dernière colonne, alignée à droite avec 2 pt de retrait, finisse sur cette barre ; Information dès 28.35 jusqu'au même bord ; portrait : rangées de 122 à 752 pt */   /* Information : rangées dès 121 pt, sous un filet (modèle 24PRC) */   /* largeur du tableau (zone du papier en paysage : 28.35 → 756.85), hauteur des rangées ; hauteurs utiles (dès 122 et 108 pt du haut jusqu'au pied) */
let DG_COURS=null;
function dgPdf(X){ if(DG_COURS){ toast('Le PDF est en cours de création…'); return DG_COURS; } DG_COURS=dgCreer(X).finally(()=>{ DG_COURS=null; }); return DG_COURS; }
/* ventilation par ouvrage des positions totalisatrices (modèle 24PRC de l'ancien logiciel : 10, 101… montrent AP1, AP2… COM ; les positions à 1 chiffre, non) : le moteur ne la
   calcule que pour les positions saisies (« la reprise ne garde pas leurs caches ») ; pendant la création du PDF, somme des ouvrages des sous-positions, dans l'ordre des
   ouvrages du devis, pourcentages comme la position */
let DG_AGREGE=null;   /* pendant la création : { tot (pourcentages sur le total général), compact (« Assembler les descriptifs des ouvrages ») } */
function dgAgreger(r){ const M=r&&r.M; if(!M) return; const ord=((r.T||{}).subs||[]).map(s=>s.ouv+'\u0001'+(s.lg||'')), vu=new Map(), A=DG_AGREGE||{};
  /* base des pourcentages = celle du moteur (ch02bCalc) : total général, sinon la position à 1 chiffre du groupe (un total nul ne met plus les ouvrages à 0 %) */
  const pere=new Map(); M.forEach((n,c)=>(n.kids||[]).forEach(k=>pere.set(k,c))); const haut=c=>{ let x=c, i=0; while(pere.has(x)&&i++<50) x=pere.get(x); return x; };
  const base=c=>A.tot?(+((r.T||{}).ttc)||0):(+((M.get(haut(c))||{}).ttc)||0);
  const agg=c=>{ if(vu.has(c)) return vu.get(c); const n=M.get(c); if(!n) return []; vu.set(c,n.subs);
    /* « Assembler les descriptifs » : le moteur remplace le descriptif d'une position à ouvrages par ceux de ses ouvrages ; une totalisatrice qui a son propre descriptif garde
       donc son affichage d'origine (pas de ventilation), sinon son descriptif serait perdu ou mal placé */
    if(!(n.p.parts||[]).length&&(n.kids||[]).length&&String(c).length>1&&!(A.compact&&n.desc!=null&&String(n.desc).trim())){ const acc=new Map();
      n.kids.forEach(k=>agg(k).forEach(x=>{ const key=x.ouv+'\u0001'+(x.lg||''); let a=acc.get(key); if(!a){ a={ouv:x.ouv,lg:x.lg||'',ttc:0,ht:0,ott:0,oht:0,hon:0,pct:0,honorPct:0,option:false,com:'',desc:null,calc:[]}; acc.set(key,a); }
        a.ttc+=x.ttc; a.ht+=x.ht; a.ott+=x.ott; a.oht+=x.oht; a.hon+=x.hon; }));
      if(acc.size){ const L=[...acc.values()].sort((a,b)=>{ const ia=ord.indexOf(a.ouv+'\u0001'+a.lg), ib=ord.indexOf(b.ouv+'\u0001'+b.lg); return (ia<0?1e9:ia)-(ib<0?1e9:ib); }), b=base(c);
        L.forEach(x=>{ x.pct=b?x.ttc/b*100:0; });
        n.subs=L; vu.set(c,L); } }
    return vu.get(c); };
  M.forEach((n,c)=>agg(c)); }
let DG_ACTIF=false;
/* textes des positions : « - » final du 1er libellé = césure (ch01bDbl, createDoubleText de l'ancien logiciel : « con- duites » → « conduites », comme le modèle 24PRC) */
const dgTexte=p=>{ const a=String(p.texte||'').trim(), b=p.texte2==null?'':String(p.texte2); return a?(b?ch01bDbl(a,b):a):b.trim(); };
{ const c0=ch02bCalc; ch02bCalc=function(){ const r=c0.apply(this,arguments); if(DG_ACTIF) try{ (r.list||[]).forEach(n=>{ if(n&&n.p) n.texte=dgTexte(n.p); }); if(DG_AGREGE) dgAgreger(r); }catch(e){ console.error(e); } return r; }; }
async function dgOctets(X){ { await DS.need(['subproject','contact','projectmember','contactowner','setting']).catch(()=>{});
    const {w,R,fn}=await SGDS.ressources(), E=X.E, doc=ch02aHdr(X)||{}, p=X.p||{}, sel=dgPresSel(E), fav=sel.pres||{};
    /* mesure du texte aux vraies polices (coupure du descriptif et des remarques comme à l'impression) */
    const pd=await w.PDFLib.PDFDocument.create(); pd.registerFontkit(w.fontkit); const fL=await pd.embedFont(R.polices.light), fB=await pd.embedFont(R.polices.bold);
    const meas=(s,name,size)=>{ try{ return (/bold/i.test(String(name||''))?fB:fL).widthOfTextAtSize(String(s),+size||9); }catch(_){ return String(s).length*(+size||9)*0.5; } };
    const tab=h=>({orientation:'paysage',elements:[{t:'tableau',champ:'constructionEstimateTable',l:DG_W,h}]});
    /* ouvrages : affichés dès que le devis en a (sinon les lignes de leurs parties manqueraient), jamais sinon (colonne OUV vide) ; devis vide : pas de document principal (un seul total) */
    const pres={nom:fav.nom||'',options:dgOptions(X),sautsDePage:sel.sauts};
    const tabI=h=>({orientation:'paysage',elements:[{t:'tableau',champ:'constructionEstimateTable',l:298,h}]});   /* Information : textes coupés comme le modèle 24PRC (298 − 15 % = 254 pt, moins les 25 pt de ch02bWrap = 229 pt) ; dessin sur toute la largeur */
    const portrait=dgChoix(E).format==='portrait', HT=portrait?DG_HP:DG_HT, HI=portrait?DG_HP:DG_HI, WI=portrait?DG_WIP:DG_WIL;   /* format choisi dans les Réglages (paysage par défaut) */
    const env={pages:{cover:{orientation:'paysage',elements:[]},page1:tab(HT),pageN:tab(HT),pageToc1:tabI(HI),pageTocN:tabI(HI)},sps:DS.by('subproject','PROJECT_ID',p.ID).slice().sort((a,b)=>cmp(a.SORTORDER,b.SORTORDER)),measure:meas};
    let B; DG_ACTIF=true; DG_AGREGE=pres.options.displaySubprojects?{tot:(E.reglages||{}).pourcentageSur==='total',compact:!!(pres.options.displayDescription&&pres.options.compactDescription)}:null;
    try{ B=ch02bBook(E,doc,p,pres,X.filter,env); } finally{ DG_ACTIF=false; DG_AGREGE=null; } if(B.err) throw new Error('mise en pages impossible ('+B.err+')');
    const o=B.o, C=ch02bCols(o,B.loc,DG_W), cols=C.cols.map(c=>({t:c.t,w:+c.w||0,r:!!c.r})),
      /* colonnes repérées par leur POSITION (ordre de ch02bCols : CFC, Texte, [Commentaire], [OUV], [Localisation], montants, [%]) et non par leur titre, que la présentation peut changer (relecture du 08.11.2026) */
      K=(()=>{ let k=2; const iC=o.displayComment&&o.commentInColumn?k++:-1, iO=o.displaySubprojects?k++:-1, iL=o.displaySubprojects&&B.loc?k++:-1, h=!!o.hierarchicalAdjust, fv=k;
        return {iC,iO,iL,h,i4:h?fv:-1,i3:h?fv+1:-1,i2:h?fv+2:-1,i1:h?fv+3:fv,ip:o.displayDeviation?(h?fv+4:fv+1):-1}; })(), iDx=97.37, iA=97.26, colsI=[{t:'',w:iA,r:false},{t:'',w:WI-iDx-iA,r:false}];   /* page Information, décalée de iDx : libellés à l'aplomb de la 2e colonne du pied (x 125.72), texte de la 3e (x 222.98) — demandes de Paulo, 08.11.2026 (« déplacer le tout ») */
    /* « les CFC doivent être alignés à la colonne info@substances » (Paulo, 08.11.2026, portrait et paysage) : les tableaux commencent à x 125.72 (2e colonne du
       pied, livretDG.x0Tab) et gardent leur bord droit ; en paysage la largeur (630.63 pt au lieu de 728) est reprise sur les colonnes de montants (pas sous 66 pt),
       la colonne [%] (32 pt), puis Commentaire (90 pt), enfin Texte */
    if(K.ip>=0&&cols[K.ip]) cols[K.ip].pct=true;   /* colonne [%] (pourcentages en bleu nuit) */
    if(!portrait&&cols[0]) cols[0].w=DG_CFC;   /* numéros CFC de x 85.04 à 125.72 */
    if(!portrait){ let manque=cols.reduce((t,c)=>t+(+c.w||0),0)-DG_WL; const prendre=(c,min)=>{ if(manque>0&&c&&c.w>min){ const q=Math.min(manque,c.w-min); c.w-=q; manque-=q; } };
      [K.i4,K.i3,K.i2,K.i1].forEach(i=>{ if(i>=0&&cols[i]&&cols[i].w) prendre(cols[i],66); }); if(K.ip>=0) prendre(cols[K.ip],32); if(K.iC>=0) prendre(cols[K.iC],90);
      if(manque>0&&cols[1]) cols[1].w-=manque; }
    const F=X.filter, filtre=Array.isArray(F)&&F.length&&F.some(f=>!f.actif||(f.facteur!=null&&f.facteur!==''&&isFinite(+f.facteur)&&+f.facteur!==1))?'Filtre : '+(ch02bFilterText(F)||'aucun ouvrage'):'';   /* montants partiels : toujours signalés */
    const dz=+o.detailFontSize||8, wT=(cols[1]||{}).w||0;
    const G=E.reglages||{}, ti=G.titres||{}, mod=v=>/^\[\.\.\.\]/.test(String(v||'').trim()), tt=k=>{ const v=String(ti[k]==null?'':ti[k]).trim(); return v&&!mod(v)?v:'Devis général'; }, etat=String(G.etatProjet||'').trim(), etatOk=etat&&!mod(etat);   /* « [...] … » : texte modèle de l'ancien logiciel, ignoré */
    const titrePage=pg=>pg.type===0?(tt('garde')+(etatOk?' - '+etat:'')):(pg.type===1||pg.type===2)?(pg.digit===0?tt('unChiffre'):pg.digit===1?tt('deuxChiffres'):tt('document')):tt('document');
    const un=Lx=>Lx.map(x=>String(x==null?'':x).trim()).filter(Boolean).join(', ');
    let A=null; try{ A=sgAdressesAffaire(p,typeof fxData==='function'?fxData():null); }catch(_){ }
    const bur=typeof sgBureauAdresse==='function'?sgBureauAdresse():{nom:'Substances Architectes Sàrl',lignes:[]}, burT=un([bur.nom,...(bur.lignes||[])]);
    const m2=typeof svMember==='function'?svMember(p,2):null, c2=m2&&DS.get('contact',m2.CONTACT_ID), dt=c2&&!/^substances architectes/i.test(contactName(c2)||'')?un(adrLines(c2)):burT;
    const couverture={titre:titrePage({type:0}).toUpperCase(),marge:mod(G.marge)?'':String(G.marge||'').trim(),filtre,
      rub:[['OUVRAGE',String(p.DESCRIPTION||p.TITLE||'').trim()],['MAÎTRE DE L’OUVRAGE',A&&A.mo?un(A.mo.lignes||[]):''],['ARCHITECTE',burT],['DIRECTION DES TRAVAUX',dt]],sig:['Le maître de l’ouvrage :','L’architecte :']};
    /* textes jamais coupés (Paulo, 08.11.2026 : « toujours écrire complet, ne pas couper les textes ») : un texte plus large que sa colonne déborde sur les colonnes de
       texte vides à sa droite (comme le dessin, livretDG.deborde) ; s'il ne tient toujours pas, il passe à la ligne sur des rangées de suite (k:1, même style, sans
       filet entre elles), avant le calcul des pages (la suite passe à la page suivante comme toute rangée). Mot plus large que la colonne : coupé à la lettre. */
    const bT=o.titlePosBold!==false, zT=DG_TXT, zP=DG_TXT, zD=DG_TXT;
    const stDe=x=>(x==='T'||x==='O'||x==='W'||x==='F')?{b:bT,z:zT}:(x==='D'||x==='X')?{b:false,z:zD}:{b:false,z:zP};
    const larg=(t,b,z)=>meas(t,b?'bold':'',z);
    const couperMots=(t,b,z,wd)=>{ const s0=String(t); if(larg(s0,b,z)<=wd) return [s0]; const L=[]; let cur='';
      s0.split(' ').forEach(m=>{ const e=cur?cur+' '+m:m; if(larg(e,b,z)<=wd){ cur=e; return; } if(cur.trim()) L.push(cur);
        if(larg(m,b,z)<=wd){ cur=m; return; } let x=''; for(const ch of m){ if(x&&larg(x+ch,b,z)>wd){ L.push(x); x=ch; } else x+=ch; } cur=x; });
      if(cur.trim()) L.push(cur); return L.length?L:[s0]; };
    const placeDe=(cols,c,j)=>{ let wd=(+cols[j].w||0)-4; for(let k=j+1;k<cols.length&&cols[k]&&!cols[k].r&&+cols[k].w&&!String(c[k]==null?'':c[k]).trim();k++) wd+=+cols[k].w; return wd-1.5; };   /* marge de 1,5 pt : mesure du dessin un peu différente (glyphes de secours) */
    const etaler=(rows,cols,info)=>{ const out=[]; rows.forEach(r=>{ const c=Array.from(r.c||[]), sty=stDe(r.s);
        const L=c.map((v,j)=>{ const col=cols[j]; if(!col||col.r||!(+col.w)||!String(v==null?'':v).trim()) return [v]; return couperMots(v,(info&&j===0)||sty.b,sty.z,placeDe(cols,c,j)); });
        const n=Math.max(1,...L.map(x=>x.length));
        if(n===1){ out.push(r); return; }
        if(info){ /* Information : la suite du libellé va sur les rangées suivantes de la même remarque (libellé vide), sinon sur une rangée de suite */
          out.push(Object.assign({},r,{c:L.map(x=>x[0]==null?'':x[0])})); r._suite=L[0].slice(1); return; }
        for(let i=0;i<n;i++) out.push(i===0?Object.assign({},r,{c:L.map(x=>x[0]==null?'':x[0])}):{c:L.map(x=>x[i]==null?'':x[i]),s:r.s,k:1}); });
      if(info){ const R2=[]; let reste=[]; out.forEach(r=>{ const c=Array.from(r.c||[]);
          if(reste.length&&!String(c[0]||'').trim()&&String(c[1]||'').trim()){ R2.push(Object.assign({},r,{c:[reste.shift(),...c.slice(1)]})); return; }
          while(reste.length) R2.push({c:[reste.shift(),''],s:'S',k:1});
          R2.push(r); if(r._suite){ reste=r._suite; delete r._suite; } });
        while(reste.length) R2.push({c:[reste.shift(),''],s:'S',k:1}); return R2; }
      return out; };
    const pleine=pg=>pg.type===0||(pg.rows||[]).some(r=>(r.c||[]).some(v=>String(v==null?'':v).trim()));   /* pages vides (saut posé pour une autre mise en page) retirées */
    const pages=B.pages.filter(pleine).map(pg=>({type:pg.type,titre:pg.type===0?tt('document'):titrePage(pg),digit:pg.digit,lpp:pg.lpp,cols:pg.type===3||pg.type===4?colsI:cols,rows:(pg.rows||[]).map(r=>{ const c0=Array.from(r.c||[]).map(v=>v==null?'':String(v));
      return {c:c0,s:String(r.s||'S')}; })}));   /* textes complets, ligne de calcul comprise (08.11.2026 : plus de formule retirée ; le texte passe à la ligne, voir etaler) */
    /* PORTRAIT (Paulo, 08.11.2026 : « conserver la possibilité de créer une version verticale ou horizontale du devis ») — les quatre colonnes de montants du paysage
       deviennent deux : Montant (positions à 3 et 4 chiffres, lignes de calcul) et Total (CFC à 1 et 2 chiffres) ; colonnes CFC, Texte, Commentaire, OUV, [%]
       gardées ; colonne sans aucune valeur dans sa série (récapitulatif, document principal) retirée ; lignes d'un descriptif réunies en un paragraphe, repassé à la
       ligne à la largeur du portrait par etaler (ci-dessous). Largeur 490 pt (DG_WP), hauteur 630 pt (DG_HP), même papier, logo et pied que le paysage. */
    if(portrait){ const ser={}; pages.forEach(pg=>{ if(pg.type===1||pg.type===2) (ser[pg.digit]=ser[pg.digit]||[]).push(pg); });
      const v=(c,i)=>i>=0?String(c[i]==null?'':c[i]):'', T0=i=>i>=0&&cols[i]?cols[i].t:'', suf=((/(TTC|HT)\s*$/.exec(T0(K.i1)||T0(K.i2))||[])[1])||'TTC';
      Object.values(ser).forEach(S=>{ const tous=S.flatMap(pg=>pg.rows), aCom=K.iC>=0&&tous.some(r=>v(r.c,K.iC).trim()), aOuv=K.iO>=0&&tous.some(r=>v(r.c,K.iO).trim()),
          aLoc=K.iL>=0&&tous.some(r=>v(r.c,K.iL).trim()), aMt=K.h&&tous.some(r=>(v(r.c,K.i4)||v(r.c,K.i3)).trim());
        const fixe=DG_CFC+(aCom?84:0)+(aOuv?30:0)+(aLoc?30:0)+(aMt?56:0)+60+(K.ip>=0?26:0);   /* tableau de x 85.04 à 512.68 (427.64 pt) */
        const cols2=[{t:T0(0)||'CFC',w:DG_CFC,r:false},{t:T0(1)||'Texte',w:DG_WP-fixe,r:false}].concat(aCom?[{t:T0(K.iC),w:84,r:false}]:[],aOuv?[{t:T0(K.iO),w:30,r:false}]:[],aLoc?[{t:T0(K.iL),w:30,r:false}]:[],
          aMt?[{t:'Montant '+suf,w:56,r:true}]:[],[{t:K.h?'Total '+suf:T0(K.i1),w:60,r:true}],K.ip>=0?[{t:T0(K.ip),w:26,r:true,pct:true}]:[]);
        const jM=2+(aCom?1:0)+(aOuv?1:0)+(aLoc?1:0), jT=jM+(aMt?1:0);
        S.forEach(pg=>{ pg.rows=pg.rows.map(r=>{ const c=Array.from(r.c||[]), m4=v(c,K.i4), m3=v(c,K.i3), t2=v(c,K.i2), t1=v(c,K.i1);
            const n=[v(c,0),v(c,1)].concat(aCom?[v(c,K.iC)]:[],aOuv?[v(c,K.iO)]:[],aLoc?[v(c,K.iL)]:[],aMt?[m4||m3]:[],[K.h?(t2||t1):t1],K.ip>=0?[v(c,K.ip)]:[]);
            /* niveau lisible à la graisse (relecture : un sous-total et ses sous-positions se suivaient dans la même colonne) : Montant — position à 4 chiffres Light,
               sous-total à 3 chiffres Regular ; Total — CFC à 2 chiffres Regular, CFC à 1 chiffre gras */
            const cf={}, det=r.s==='D'||r.s==='X';   /* lignes de calcul et descriptif : Light gris, quelle que soit leur colonne */
            if(!det){ if(aMt&&!m4.trim()&&m3.trim()) cf[jM]='r'; if(K.h&&t2.trim()) cf[jT]='r'; else if(t1.trim()&&(r.s==='O'||r.s==='F'||r.s==='T')) cf[jT]='b'; }
            return Object.assign({c:n,s:String(r.s||'S')},Object.keys(cf).length?{cf}:{}); }); pg.cols=cols2; }); }); }
    /* Information (modèle 24PRC) : rangées refaites depuis les remarques et les ouvrages, coupées comme le moteur (ch02bIntro) — rangée vide avant chaque remarque nommée et avant la
       liste des ouvrages (pas entre deux ouvrages ; une entrée sans nom continue la précédente, comme dans les données de l'ancien logiciel), lignes vides d'une remarque écrite en
       paragraphes gardées —, puis réparties sur les pages d'Information (23 rangées par page : règle du moteur rows > lpp − 3, comme le modèle ; pas de rangée vide en tête de page) */
    { const iI=pages.map((pg,i)=>pg.type===3||pg.type===4?i:-1).filter(i=>i>=0);
      if(iI.length){ const tw=298-Math.floor(298*0.15), fsz=+o.posFontSize||9, fnm=o.standardFontName, R0=[]; let prev=null;
        const ent=remImpr(E,p).map(r=>({name:r.nom||'',desc:r.texte||'',o:false}));
        if(o.displaySubprojectNames) dgOuvInfo(X).forEach(s=>{ const c=String(s.CODE||''), lc=String(s.LOCATIONCODE||'');
          ent.push(lc?{name:c+' | '+lc,desc:String(s.DESCRIPTION||'')+' | '+String(s.LOCATIONDESCRIPTION||''),o:true}:{name:c,desc:String(s.DESCRIPTION||''),o:true}); });
        ent.forEach(d=>{ const nm=String(d.name||'').trim(); if(nm&&R0.length&&!(d.o&&prev==='o')) R0.push({c:['',''],s:'S'});
          ch02bIntro(d,tw,fsz,meas,fnm).forEach(c=>R0.push({c:Array.from(c).map(v=>v==null?'':String(v)),s:'S'})); if(nm) prev=d.o?'o':'r'; });
        R0.splice(0,R0.length,...etaler(R0,pages[iI[0]].cols,true));   /* libellés jamais coupés (08.11.2026) */
        const cap=Math.max(1,Math.floor(HI/DG_RH)-2), P2=[], vide=r=>!r.c.some(v=>String(v).trim()); let cur=null;
        R0.forEach(r=>{ if(!cur||cur.rows.length>=cap){ if(cur&&vide(r)) return; cur={type:P2.length?4:3,titre:pages[iI[0]].titre,cols:pages[iI[0]].cols,rows:[]}; P2.push(cur); } cur.rows.push(r); });
        pages.splice(iI[0],iI.length,...P2); } }
    /* pages de tableau : jamais plus de rangées que la page n'en tient (avec un filtre d'ouvrages, ch02bSumFill ne garde pas une position et ses ouvrages ensemble et les rangées en
       trop passaient sur le pied). Rangées de remplissage en trop retirées ; coupure de préférence avant le début d'une position ; la suite passe en tête de la page suivante de la
       même série (même récapitulatif ou document principal, page du total comprise), sinon sur une page insérée ; pages complétées jusqu'en bas (zébrage), comme ch02bFinish */
    /* lignes de calcul et descriptif dans la colonne Texte, à x 125.72 comme les désignations (les numéros CFC sont dans la marge, 08.11.2026) */
    pages.forEach(pg=>{ if(pg.type===1||pg.type===2) pg.rows=etaler(pg.rows,pg.cols,false); });   /* textes jamais coupés (08.11.2026) */
    { const capT=Math.max(1,Math.floor(HT/DG_RH)), vide=r=>!(r.c||[]).some(v=>String(v==null?'':v).trim()), tab=pg=>!!pg&&(pg.type===1||pg.type===2);
      for(let i=0;i<pages.length;i++){ const pg=pages[i]; if(!tab(pg)) continue; const R=pg.rows, cap=Math.max(1,Math.min(capT,+pg.lpp||capT));
        while(R.length>cap&&vide(R[R.length-1])) R.pop();
        if(R.length>cap){ let k=cap; for(let j=cap;j>cap-8&&j>0;j--){ if(String((R[j].c||[])[0]||'').trim()){ k=j; break; } }
          const reste=R.splice(k); while(reste.length&&vide(reste[0])) reste.shift();
          if(reste.length){ const nx=pages[i+1]; if(tab(nx)&&nx.digit===pg.digit) nx.rows=reste.concat(nx.rows); else pages.splice(i+1,0,{type:2,titre:pg.titre,digit:pg.digit,lpp:capT,cols:pg.cols,rows:reste}); } }
        while(R.length<cap) R.push({c:[],s:'E'}); } }
    const sT={b:o.titlePosBold!==false,z:DG_TXT}, st={T:sT,O:sT,W:sT,F:sT,S:{b:false,z:DG_TXT},D:{b:false,z:DG_TXT},X:{b:false,z:DG_TXT},E:{b:false,z:DG_TXT}};   /* texte à la taille de l'en-tête (7,5 pt, Akkurat Light ; Paulo, 08.11.2026) ; titres des CFC à 1 et 2 chiffres et total gardés */
    const titre=tt('document')+' '+[p.NUMBER,p.TITLE].filter(Boolean).join(' ')+(filtre?' (filtre)':'');
    const opt=w.JSON.parse(JSON.stringify({titre:tt('document'),sousTitre:[p.NUMBER,p.TITLE].filter(Boolean).join(' - ')+(filtre?' · '+filtre:''),date:ch02aDate(E,doc)||today(),type:'Devis général',description:titre,
      livretDG:{couverture,pages,st,zebra:false,style:'nuit',deborde:true,rh:DG_RH,infoTitre:'Information',infoDx:iDx,orientation:portrait?'portrait':'paysage',x0:28.35,x0Tab:DG_X0T,aligne:true,corpsTitres:DG_TXT}})), j=new w.Array(); opt.journal=j;
    const oct=await fn(R,null,opt); if(j.length) console.info('Devis général :',Array.from(j));
    return {oct,nom:titre.replace(/[\\/:*?"<>|]+/g,'-')+'.pdf'}; } }
async function dgCreer(X){ try{ toast('Création du PDF…'); const r=await dgOctets(X); sgVisionneuse(new Blob([r.oct],{type:'application/pdf'}),r.nom); }
  catch(e){ console.error(e); toast('Le PDF du devis général n’a pas pu être créé : '+(e&&e.message||e),true); } }
/* ── Documents ▸ Devis général = ce modèle (Paulo, 07.11.2026 : « modifier cette page par ce modèle », 24PRC-DG_TRAVAIL_20260216.pdf de l'ancien logiciel, même mise en pages que
   le 23JOG) : « Ouvrir », la fenêtre (Imprimer, PDF, Partager, Réglages) et « Créer le PDF » montrent et enregistrent ce PDF au lieu du document portrait du modèle .dpdoc.
   Le moteur garde ses chemins : ch02cRender rend, pour la ligne 0, une page repérée dont le PDF est déjà fait (SGIMP.memo, pdf = promesse de dgOctets), que la visionneuse et
   l'enregistrement (ch03aApi, bloc 31) servent tels quels. Honoraires et Devis descriptif : inchangés. ── */
/* « Réglages » du devis général : les cases du menu de la ligne (mêmes libellés que le moteur) sur les options du livret de l'ancien logiciel (ch02b, libellés identiques dans sa
   fenêtre « Paramètres ») ; valeurs de la référence (DG_PRESET) tant que rien n'est choisi ; choix enregistrés dans le devis (E.reglages.dgPdf), mêmes dépendances que la fenêtre
   du moteur (commentaire en colonne ⇒ commentaire, variantes ⇒ montants détaillés, calcul ⇒ quantités et prix, 1 à 3 chiffres ⇒ totalisateurs) ; arrondis exclusifs. */
const DG_TXT=8;   /* corps de TOUT le texte du tableau du devis général en PDF — titres des colonnes, CFC à 1 et 2 chiffres, positions, calculs, descriptif, total, Information (Paulo, 08.11.2026 : « taille des textes 8 pt, mais ne pas changer les en-têtes et les pieds de page ») */
const DG_MENU=[['displaySubprojects','Afficher les subdivisions','sub'],['onlyThreeDigits','Seulement positions de 1 à 3 chiffres'],['displayNoTitlePositions','Afficher les positions saisies et les totalisateurs'],
  ['commentInColumn','Commentaire dans colonne séparée'],'-',   /* libellé sans « Base et » (Paulo, 08.11.2026) */   /* « Base et commentaire de la position » retiré (Paulo, 08.11.2026) : base et commentaire toujours imprimés, dans leur colonne ou sous la position */['*tous','Tous les montants détaillés'],'-',
  ['displayDetailComment','Commentaire du calcul'],['displayPriceBase','Bases de prix'],['dispalyCalcualtion','Afficher le calcul'],['displayQuanPriceValue','Quantités et prix'],
  ['displayDetailValues','Afficher les montants'],['displayDetailOptions','Variantes'],'-',['dispalyAfterComma','Masquer les décimales'],['dispalyRound10','Arrondir à 10'],['dispalyRound100','Arrondir à 100'],
  ['dispalyRound1000','Arrondir à 1000'],'-',['dispalyEmptyPositions','Afficher les positions sans montant'],['displayDescription','Descriptif'],['compactDescription','Assembler les descriptifs des ouvrages','sub']];
const DG_TOUS=['displayDetailComment','dispalyCalcualtion','displayQuanPriceValue','displayDetailValues','displayDetailOptions'], DG_RONDS=['dispalyRound10','dispalyRound100','dispalyRound1000'];
const dgChoix=E=>{ const v=((E||{}).reglages||{}).dgPdf; return v&&typeof v==='object'?v:{}; };
/* présentation dont les sauts de page et les options de base sont repris : choix du menu (« Sauts de page : … » : rang et nom, une présentation sans nom comprise), sinon la favorite,
   sinon la première ; « Sans sauts de page » (sansSauts) garde les options de base de celle-ci, sans ses sauts. presNom '' sans rang = ancien « Sans sauts de page » du 07.11.2026. */
function dgPresSel(E){ const L=(E&&E.presentations)||[], c=dgChoix(E), def=L.find(q=>q.favori)||L[0]||null, nm=q=>String((q&&q.nom)||'');
  if(c.sansSauts===true||(c.presNom===''&&!Number.isInteger(c.presIdx))) return {pres:def,sauts:[],aucune:true};
  if(typeof c.presNom==='string'){ const q=Number.isInteger(c.presIdx)&&L[c.presIdx]&&nm(L[c.presIdx])===c.presNom?L[c.presIdx]:L.find(x=>nm(x)===c.presNom); if(q) return {pres:q,sauts:q.sautsDePage||[],aucune:false}; }
  return {pres:def,sauts:(def&&def.sautsDePage)||[],aucune:false}; }
const dgPres=E=>dgPresSel(E).pres;
/* ouvrages listés sur la page Information (même règle que ch02bBook : utilisés par une position et dans le filtre) */
function dgOuvInfo(X){ const E=X.E||{}, p=X.p||{}, F=X.filter&&X.filter.length?X.filter:null; if(!ch02bHasSub(E)) return [];
  return DS.by('subproject','PROJECT_ID',p.ID).slice().sort((a,b)=>cmp(a.SORTORDER,b.SORTORDER)).filter(s=>{ const c=String(s.CODE||''); return (E.positions||[]).some(q=>(q.parts||[]).some(pt=>pt.ouv===c))&&ch02bInF(F,c); }); }
function dgOptions(X){ const E=X.E||{}, fav=dgPres(E)||{}, sub=ch02bHasSub(E), c=dgChoix(E);
  const o=Object.assign({},fav.options||{},DG_PRESET,{includeKvInformation:remImpr(E,X.p).some(r=>String(r.nom||'').trim()||String(r.texte||'').trim())||dgOuvInfo(X).length>0,dispalyEmptyPositions:((fav.options||{}).dispalyEmptyPositions)!==false,
    displaySubprojects:sub,includeDocument:(E.positions||[]).length>0});
  if(!o.specialRound) DG_RONDS.forEach(k=>{ o[k]=false; });
  o.displayComment=true;   /* plus d'option « Base et commentaire de la position » (08.11.2026) : toujours affichés ; « … dans colonne séparée » choisit leur place */   /* « Arrondir à … » des présentations ne vaut qu'avec l'arrondi spécial (éteint dans la référence) : jamais d'arrondi sans choix */
  DG_MENU.forEach(m=>{ if(Array.isArray(m)&&m[0][0]!=='*'&&typeof c[m[0]]==='boolean') o[m[0]]=c[m[0]]; });
  if(!sub){ o.displaySubprojects=false; o.compactDescription=false; o.displaySubprojectNames=false; }   /* affaire sans ouvrage : colonne OUV vide (comme la fenêtre du moteur) */
  o.specialRound=DG_RONDS.some(k=>o[k]); return o; }
function dgBasculer(X,k){ if(!ch02aCan(X)) return; const E=X.E, o=dgOptions(X), c=Object.assign({},dgChoix(E));
  if(k.startsWith('pres:')||k==='*sans'){ if(k==='*sans'){ c.sansSauts=true; } else { const i=+k.slice(5), q=(E.presentations||[])[i]; if(!q) return; c.presNom=String(q.nom||''); c.presIdx=i; delete c.sansSauts; }
    const R=E.reglages||(E.reglages={}); R.dgPdf=c; X.touch(); return; }
  if(k==='*total'){ const R=E.reglages||(E.reglages={}); R.pourcentageSur=R.pourcentageSur==='total'?'groupe':'total'; X.touch(); return; }
  if(k==='*paysage'||k==='*portrait'){ c.format=k.slice(1); const R=E.reglages||(E.reglages={}); R.dgPdf=c; X.touch(); return; }   /* format du PDF (08.11.2026) */   /* réglage du devis (Paramètres ▸ Affichage), aussi pour l'écran */
  if(k==='*tous'){ const tout=DG_TOUS.every(x=>o[x]); DG_TOUS.forEach(x=>{ c[x]=!tout; }); }
  else { const v=!o[k]; c[k]=v; if(DG_RONDS.includes(k)&&v) DG_RONDS.forEach(x=>{ if(x!==k) c[x]=false; });
    if(k==='dispalyCalcualtion'){ c.displayQuanPriceValue=v; c.displayDetailComment=v; }   /* « Afficher le calcul » coche ou décoche aussi « Quantités et prix » et « Commentaire du calcul » (Paulo, 08.11.2026) */
    if(k==='displayComment'&&!v) c.commentInColumn=false; if(k==='displayDetailValues'&&!v) c.displayDetailOptions=false; if(k==='displayQuanPriceValue'&&!v) c.dispalyCalcualtion=false;
    if(k==='displayNoTitlePositions'&&!v) c.onlyThreeDigits=false; if(k==='onlyThreeDigits'&&v) c.displayNoTitlePositions=true; }
  const R=E.reglages||(E.reglages={}); R.dgPdf=c; X.touch(); }
function dgPrefItems(X){ const o=dgOptions(X), sub=ch02bHasSub(X.E||{});
  const dis=k=>(k==='displayDetailOptions'&&!o.displayDetailValues);   /* « Afficher le calcul » toujours cliquable : il commande ses deux cases (08.11.2026) */
  const pt=dgChoix(X.E).format==='portrait';
  const L=[{t:'Format : Paysage',chk:!pt,fn:()=>dgBasculer(X,'*paysage')},{t:'Format : Portrait',chk:pt,fn:()=>dgBasculer(X,'*portrait')},'-'].concat(DG_MENU.filter(m=>m==='-'||sub||m[2]!=='sub').map(m=>m==='-'?m:{t:m[1],chk:m[0]==='*tous'?DG_TOUS.every(x=>o[x]):!!o[m[0]],dis:dis(m[0]),fn:()=>dgBasculer(X,m[0])}));
  const E=X.E||{}, P=E.presentations||[], sel=dgPresSel(E);
  L.push('-',{t:'Pourcentages sur le total général',chk:(E.reglages||{}).pourcentageSur==='total',fn:()=>dgBasculer(X,'*total')});
  if(P.length) L.push('-',...P.map((q,i)=>({t:'Sauts de page : '+(q.nom||'présentation sans nom'),chk:!sel.aucune&&sel.pres===q,fn:()=>dgBasculer(X,'pres:'+i)})),{t:'Sans sauts de page',chk:sel.aucune,fn:()=>dgBasculer(X,'*sans')});
  return L.filter((x,i,a)=>!(x==='-'&&(i===0||a[i-1]==='-'))); }
/* page repérée dont le PDF est celui du modèle (préparé tout de suite, servi par sgImpPdf) */
function dgRendu(X){ const S=window.SGIMP, id=(++S.n).toString(36)+'g'+Date.now().toString(36), pdf=dgOctets(X).then(r=>new Blob([r.oct],{type:'application/pdf'}));
  pdf.catch(()=>{}); S.memo.set(id,{pdf,titre:'Devis général',o:{}}); while(S.memo.size>40) S.memo.delete(S.memo.keys().next().value);
  return {title:'Devis général',css:'/*sgimp:'+id+'*/',html:''}; }
/* « Ouvrir » et « Créer le PDF » de la ligne 0 : le PDF du modèle ne demande aucun enregistrement du document (costestimatedpdoc) — rien n'est écrit dans la base (profil en
   lecture seule, double-clic, autres apps sur la même base). Mêmes étapes que le moteur (ch02cOpen0, ch02cGenPdf) : PDF officiel existant, mode filtre, arrondi — ici selon les
   réglages du modèle (dgOptions). */
async function dgOuvrir(X){ if(X.dBusy) return; X.dBusy=true;
  try{ if(ch02cPdfHas(X,0)&&(await ivAsk('Avertissement',CH02C_MSG.pdfAvail))===true) return;
    await ch02aFilterMsg(X); if(dgOptions(X).specialRound) await ch02aInfo('Information',CH02C_MSG.round);
    const rec=ch02cRec(X,0), R=dgRendu(X); return ch02cView(X,0,{ID:ch02cId(X,0),doc:{nom:(rec&&rec.doc&&rec.doc.nom)||CH02C_ROWS[0].t}},R); }
  finally{ X.dBusy=false; } }
async function dgGenPdf(X){ const dos=ch02cDos(X,'archive'); if(!dos) return;
  await ch02aFilterMsg(X); if(dgOptions(X).specialRound) await ch02aInfo('Information',CH02C_MSG.round);
  const o={}, nom=await ch03bNouveauPdfDlg(CH02C_ROWS[0].pdf,dos,o); if(nom==null) return;
  await ch03bProduire(dos,nom,()=>svDpDocHTML(dgRendu(X)),{projet:X.p.ID,origine:'pdf',bseq:o.bseq}); ch02cDocPane(X); }
{ const r0=ch02cRender; ch02cRender=function(X,i,rec){ if(+i===0&&X&&X.sgde) return dgRendu(X); const E0=X&&X.E; if(!E0||!remAuto(E0,X.p).auto) return r0.apply(this,arguments);
    const o=E0.remarques; E0.remarques=remImpr(E0,X.p); try{ return r0.apply(this,arguments); } finally{ E0.remarques=o; } }; }
{ const p0=ch02cPrefItems; ch02cPrefItems=function(X,i){ return +i===0&&X&&X.sgde?dgPrefItems(X):p0.apply(this,arguments); }; }
/* « Bases de prix » retiré des réglages des documents (Paulo, 08.11.2026 : « supprimer ») : panneau de la fenêtre d'aperçu et menu « Réglages » de la ligne ;
   gardé seulement s'il est déjà coché (pour pouvoir le décocher) ; option inchangée dans le devis */
{ const p1=ch02cPrefItems; ch02cPrefItems=function(X,i){ const L=p1.apply(this,arguments); if(!X||!X.sgde||!Array.isArray(L)) return L;
    return L.filter(x=>!(x&&x!=='-'&&x.t==='Bases de prix'&&!x.chk)).filter((x,k,a)=>!(x==='-'&&(k===0||a[k-1]==='-'||k===a.length-1))); }; }
{ const o0=ch02cOpen; ch02cOpen=function(X,i){ return +i===0&&X&&X.sgde?dgOuvrir(X):o0.apply(this,arguments); }; }
{ const g0=ch02cGenPdf; ch02cGenPdf=function(X,i){ return +i===0&&X&&X.sgde?dgGenPdf(X):g0.apply(this,arguments); }; }
{ const n0=ch02cNewItems; ch02cNewItems=function(X,i){ const L=n0.apply(this,arguments); if(+i!==0||!X||!X.sgde) return L;
    const ok=typeof ch03bNouveauPdfDlg==='function'&&typeof ch03bProduire==='function'; return L.map(x=>x&&x.t===CH02C_L.genPdf?Object.assign({},x,{dis:!ok}):x); }; }
/* document d'origine des PDF créés (« Créer le PDF » des documents du devis) : enveloppe posée en dernier, au-dessus de celle du devis général (dgGenPdf) */
{ const g1=ch02cGenPdf; ch02cGenPdf=function(X,i){ SGPDF.genre=GENRE_LIGNE[+i]||null; let r;
    try{ r=g1.apply(this,arguments); }catch(e){ SGPDF.genre=null; throw e; }
    Promise.resolve(r).catch(()=>{}).then(()=>{ SGPDF.genre=null; }); return r; }; }
const SGDE=window.SGDE={X:null,deco,decoCat,habiller,DEVI,dgPdf,ligneCalc,honContrat,honEtat,honRegle};
})();

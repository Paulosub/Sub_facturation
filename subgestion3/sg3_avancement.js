/* ═══ 31. AVANCEMENT DES PRESTATIONS — proposition D « Proposé par les heures » (30.10.2026, demande de Paulo : « applique la proposition D ») ═══
   Page du projet ▸ domaine « Avancement des prestations » : remplace l'écran du moteur (imDomain : journal daté, pourcentages tapés dans une
   fenêtre, graphique de points). Variante D choisie parmi quatre propositions : subgestion3/_backup_20261030_maquette_avancement/ (pav_D.js).
   – L'app PROPOSE l'avancement de chaque phase partielle SIA comprise au contrat : heures saisies ÷ heures du contrat, par crans de 5 %, au plus
     95 % (les heures ne disent pas si une phase est finie : 100 % = « terminée » se règle à la main) ; heures du contrat épuisées → pas de
     proposition, « à juger ». Heures comptées jusqu'à la fin du mois de la date de l'état.
   – Tableau à trois colonnes : heures consommées (rouge au-delà du contrat), avancement proposé (hachuré), avancement retenu (curseur à poignée :
     glisser ou cliquer par crans de 5 %, flèches ±5, Début / Fin, − / +, touche P ou bouton « Reprendre » = la proposition, quand elle est
     reprenable : ni phase terminée, ni heures épuisées, ni proposition « à confirmer ») ; « Reprendre toutes les propositions » ; prévu par − / +.
   – Alertes : risque de dépassement (projection à l'achèvement), heures du contrat dépassées (même pour une phase terminée), à confirmer.
   – Historique : courbe heures consommées % / avancement effectif % / prévu % ; journal des états, une ligne par date (ancien journal compris,
     valeurs de l'ensemble du mandat seulement) ; un clic = consultation en lecture seule ; « Rouvrir pour modifier », « Supprimer l'état ».
   Enregistrement, en UN seul DS.commit :
   – collection propre « sgavancement », un enregistrement par (projet, date) : {ID, PROJECT_ID, DATE 'AAAA-MM-JJ', NOM, REMARQUE, EFF:{31:%…},
     PREV:{31:%…}, PROP:{31:%…} (proposition des heures à cette date), GLOBAL_EFF, GLOBAL_PREV (1 décimale, pondérés par les parts SIA comprises),
     IMPL_ID, PAR (ME.id), MODIFIE (ISO)} ; même date = mise à jour (question « Remplacer l'état du … ? ») ;
   – la ligne du journal d'origine « projectimplementation » du même projet et de la même date (celle d'IMPL_ID, sinon la dernière par ID, sinon
     créée) : IMPLEMENTATIONDATE, NAME, SCHEDULEDVALUE / CURRENTVALUE = % globaux entiers 0–100 (lus par le Management du moteur),
     SCHEDULEDUSERID / CURRENTUSERID = ME.id, CURRENTREMARK = remarque.
   Une seule ligne par (projet, date) : les états en double et les autres lignes « projectimplementation » de cette date sont supprimés dans le
   même commit (la question « Remplacer » les annonce).
   « Supprimer l'état » : les enregistrements « sgavancement » de cette date et les lignes « projectimplementation » de cette date. Les lignes
   anciennes sans détail des autres dates restent dans le journal et la courbe.
   Parts SIA : celles des contrats reliés (phases partielles 31 à 53) ; parts SIA 102 standard sans contrat relié, ou quand les contrats reliés
   n'ont aucune part 31–53 (expertises, anciens contrats), ce que dit l'en-tête. Contrats pas encore lus (cadre Facturation en chargement) :
   parts standard provisoires et « Enregistrer l'état » désactivé jusqu'au redessin ; cadre en échec : enregistrement après confirmation.
   Un seul enregistrement à la fois (u.enCours) ; état et contrats relus juste avant l'écriture (changés entre-temps → rien n'est écrit).
   Glisser un curseur : la piste est relue à chaque mouvement, fin du glisser sur la fenêtre ; les redessins attendent la fin du glisser ;
   le focus n'est rendu au curseur que s'il a été perdu par un redessin.
   Ouverture : date du jour, effectif et prévu du dernier état détaillé (date la plus récente ; sans état : 0 %). Base modifiée (autre poste,
   sauvegarde…) : l'écran est redessiné sur place (même conteneur : défilement, champs et saisie en cours gardés ; saisie non enregistrée gardée
   aussi en revenant sur le projet pendant la session).
   Droits : modification = administrateur, « Projets modifiables : tous », ou « ses projets » pour un projet attribué (sgMesProjets) ; sinon
   lecture seule. Honoraires HT de l'en-tête : administrateur et chef de projet, finances non verrouillées (règle de « Phases contrat »).
   Archives ▸ Honoraires (ancien) ▸ Avancement des prestations (vue « anc-avancement ») garde l'écran d'origine (imDomain du moteur).
   Le serveur du bureau rattache « sgavancement » au projet par PROJECT_ID (droits d'écriture du projet) ; collection propre à l'app, gardée par
   les reprises ; « projectimplementation » est protégée (PROTECTED). Débogage : window.SGAV. Styles : <style id="sgav-css">, classes sgav-*. */
(function(){
if(typeof imDomain!=='function') return;

const NOMS={3:'Étude du projet',4:'Appel d’offres',5:'Réalisation',31:'Avant-projet',32:'Projet de l’ouvrage',33:'Procédure de demande d’autorisation',
  41:'Appel d’offres, comparaison des offres, adjudication',51:'Projet d’exécution',52:'Exécution de l’ouvrage',53:'Mise en service, achèvement'};
const PARTS_STD={31:9,32:21,33:2.5,41:18,51:16,52:29,53:4.5};   /* parts SIA 102 standard des phases partielles (q = 100 %), comme FE_PARTS */
const T_AV='sgavancement', T_IM='projectimplementation';
const SURV=['*',T_AV,T_IM,'timelog','projectphase','projectsubphase','project','appuser'];

const CSS=`
.sgav-box{flex:1 1 auto;min-height:0;overflow:auto}
.sgav-charge{padding:24px;color:var(--s-gris)}
.sgav-err{padding:20px 24px;color:var(--s-rouge)}
.sgav{container:sgav/inline-size;padding:16px 24px 28px;max-width:1400px;box-sizing:border-box}
.sgav .sgfh-tete{margin:0}
.sgav-hact{display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap;margin-left:auto}
.sgav-date{display:flex;flex-direction:column;gap:3px;font-size:11px;font-weight:700;color:var(--s-gris)}
.sgav-date input{height:36px;border:2px solid var(--s-noir);border-radius:0;background:#fff;padding:0 8px;font:inherit;font-size:13px;font-weight:700;color:var(--s-noir)}
.sgav .nx-btn:disabled{opacity:.35;cursor:default;background:#fff}
.sgav .nx-btn[hidden]{display:none}
.sgav-enrp{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr) auto;gap:8px 14px;align-items:end;padding:12px 22px 14px;background:var(--s-jaune2);border-top:1px solid var(--s-gris3)}
.sgav-enrp[hidden]{display:none}
@container sgav (max-width:860px){.sgav-enrp{grid-template-columns:minmax(0,1fr)}}
.sgav-f{display:flex;flex-direction:column;gap:3px;font-size:11px;font-weight:700;color:var(--s-gris);min-width:0}
.sgav-f i{font-style:normal;font-weight:400}
.sgav-f input,.sgav-f textarea{width:100%;height:34px;box-sizing:border-box;border:1.5px solid var(--s-noir);border-radius:0;background:#fff;padding:6px 8px;font:inherit;font-size:13px;color:var(--s-noir)}
.sgav-f textarea{resize:vertical;min-height:34px;line-height:1.35}
.sgav-f .inv{border-color:var(--s-rouge);outline:1px solid var(--s-rouge)}
.sgav-fb{display:flex;gap:8px}
.sgav-fi{grid-column:1/-1;font-size:11.5px;color:var(--s-gris);line-height:1.45}
.sgav-fi b{color:var(--s-noir)}
.sgav-rempl{display:flex;align-items:center;flex-wrap:wrap;gap:6px 14px;margin:12px 0 0;padding:7px 10px;border-left:3px solid var(--s-noir);background:var(--s-jaune3);font-size:12px;line-height:1.4}
.sgav-rempl[hidden]{display:none}
.sgav-rempl>b{white-space:nowrap}
.sgav-rempl .nx-btn{margin-left:auto}
.sgav-kp{margin:14px 0 26px;grid-template-columns:repeat(5,minmax(0,1fr))}
@container sgav (max-width:860px){.sgav-kp{grid-template-columns:repeat(3,minmax(0,1fr))}}
.sgav-g{position:relative;height:6px;background:var(--s-nuit3);margin-top:10px}
.sgav-g>i{position:absolute;left:0;top:0;bottom:0;background:var(--s-nuit)}
.sgav-g>i.dp{background:var(--s-rouge)}
.sgav-g>b{position:absolute;top:-4px;bottom:-4px;width:2px;margin-left:-1px;background:var(--s-noir)}
.sgav-neg{color:var(--s-rouge)}.sgav-pos{color:#5d7a10}
.sgav-sec{border-top:2px solid var(--s-noir);margin:0 0 30px}
.sgav-sech{display:flex;align-items:center;gap:8px 14px;flex-wrap:wrap;padding:10px 0 8px}
.sgav-sech h3{margin:0;font-size:15px;font-weight:700}
.sgav-sech .n{font-size:12px;color:var(--s-gris)}
.sgav-sech .act{margin-left:auto;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.sgav-modn{font-size:11.5px;font-weight:700;background:var(--s-jaune);padding:4px 8px}
.sgav-aide{margin:0 0 6px;font-size:12.5px;color:var(--s-noir)}
.sgav-aide.ro{color:var(--s-gris)}
.sgav-avis{margin:0 0 8px;padding:6px 10px;border-left:3px solid var(--s-gris2);font-size:12px;line-height:1.45;color:var(--s-noir)}
.sgav-avis.sgav-at{border-left-color:var(--s-noir);background:var(--s-jaune3)}
.sgav-t{width:100%;border-collapse:collapse;table-layout:fixed;font-variant-numeric:tabular-nums;font-size:12.5px}
.sgav-t col.c1{width:200px}.sgav-t col.c2{width:17%}.sgav-t col.c3{width:15%}.sgav-t col.c4{width:112px}
.sgav-t th{font-size:11.5px;font-weight:700;text-align:left;padding:6px 8px 7px;border-bottom:1.5px solid var(--s-noir);vertical-align:bottom;line-height:1.25}
.sgav-t th span{display:block;font-weight:400;font-size:11px;color:var(--s-gris)}
.sgav-t td{padding:9px 8px;border-bottom:1px solid var(--s-filet);vertical-align:middle}
.sgav-t tr.sgav-ph td{background:var(--s-nuit3);font-weight:700;padding-top:6px;padding-bottom:6px;border-bottom:0}
.sgav-t tr.sgav-ph .sgav-b{background:#fff}
.sgav-t tr.sgav-ph td:first-child b{color:var(--s-nuit);margin-right:6px}
.sgav-t tr.pt.a td{border-bottom:0}
.sgav-t tr.pt:focus-within td,.sgav-t tr.pt:focus-within+tr.al td{background:var(--s-jaune3)}
.sgav-t tr.al td{padding:0 8px 10px}
.sgav-t tr.nc td{color:var(--s-gris2)}
.sgav-t tr.tot td{border-top:2px solid var(--s-noir);border-bottom:0;padding-top:12px;font-weight:700}
@container sgav (max-width:1000px){
  .sgav-t col.c1{width:180px}.sgav-t col.c2{width:96px}.sgav-t col.c3{width:92px}
  .sgav-t td:nth-child(2) .sgav-bw,.sgav-t td:nth-child(3) .sgav-bw{flex-direction:column-reverse;align-items:stretch;gap:5px}
  .sgav-t td:nth-child(2) .sgav-b,.sgav-t td:nth-child(3) .sgav-b{flex:none;width:100%;min-width:0}
  .sgav-t td:nth-child(2) .sgav-v,.sgav-t td:nth-child(3) .sgav-v{flex:none;text-align:left}
  .sgav-t .sgav-sub{white-space:normal}
}
.sgav-nm{display:flex;gap:10px;align-items:baseline;cursor:default}
.sgav-nm>b{flex:0 0 22px;font-size:15px;color:var(--s-nuit)}
.sgav-t tr.nc .sgav-nm>b{color:var(--s-gris2)}
.sgav-nm>span{min-width:0;line-height:1.3}
.sgav-nm em{display:block;font-style:normal;font-weight:400;font-size:11.5px;color:var(--s-gris);margin-top:2px}
.sgav-sub{font-size:11.5px;color:var(--s-gris);margin-top:4px;white-space:nowrap}
.sgav-vide{font-size:11.5px;color:var(--s-gris2)}
.sgav-ep{display:inline-block;font-size:11.5px;font-weight:700;color:var(--s-noir);line-height:1.3;border-left:3px solid var(--s-gris2);padding:1px 0 1px 7px}
.sgav-bw{display:flex;align-items:center;gap:12px}
.sgav-b{position:relative;flex:1 1 auto;min-width:36px;height:10px;background:var(--s-nuit3)}
.sgav-b.mn{height:6px}
.sgav-b>i{position:absolute;left:0;top:0;bottom:0;display:block}
.sgav-b.h>i{background:var(--s-gris)}
.sgav-b.h.dp>i{background:var(--s-rouge)}
.sgav-b.h.dp::after{content:'';position:absolute;left:100%;top:50%;margin:-5px 0 0 2px;border-style:solid;border-width:5px 0 5px 6px;border-color:transparent transparent transparent var(--s-rouge)}
.sgav-b.p>i{background:repeating-linear-gradient(135deg,var(--s-nuit) 0 1.5px,transparent 1.5px 4.5px);box-shadow:inset 0 0 0 1px var(--s-nuit)}
.sgav-b.r>i{background:var(--s-nuit)}
.sgav-pc{cursor:pointer}.sgav-pc:hover .sgav-b{outline:2px solid var(--s-jaune);outline-offset:2px}
.sgav-b em,.sgav-slt em{position:absolute;display:block;pointer-events:none}
.sgav-b em.pv,.sgav-slt em.pv{top:-5px;bottom:-5px;width:2px;margin-left:-1px;background:var(--s-noir);box-shadow:0 0 0 1px #fff}
.sgav-b em.pp,.sgav-slt em.pp{bottom:-7px;width:9px;height:9px;margin-left:-4.5px;background:var(--s-jaune);border:1.5px solid var(--s-noir);transform:rotate(45deg);box-sizing:border-box}
.sgav-v{flex:0 0 46px;text-align:right;font-weight:700;font-size:13px;white-space:nowrap}
.sgav-rw{display:flex;align-items:center;gap:10px}
.sgav-sl{flex:1 1 auto;min-width:160px;padding:10px 0 13px;cursor:ew-resize;outline:none;touch-action:none;user-select:none;-webkit-user-select:none}
.sgav-slt{position:relative;height:14px;background:var(--s-nuit3)}
.sgav-slt>i{position:absolute;display:block;pointer-events:none}
.sgav-slt>i.f{left:0;top:0;bottom:0;background:var(--s-nuit)}
.sgav-slt>i.cr{top:100%;height:5px;width:1px;margin:2px 0 0 -.5px;background:var(--s-gris2)}
.sgav-slt>i.pg{top:-6px;bottom:-6px;width:10px;margin-left:-5px;background:#fff;border:2px solid var(--s-nuit);box-sizing:border-box}
.sgav-sl:hover .sgav-slt{background:#d3dde2}
.sgav-sl:hover .sgav-slt>i.pg{background:var(--s-jaune)}
.sgav-sl:focus-visible .sgav-slt>i.pg{background:var(--s-jaune);border-color:var(--s-noir)}
.sgav-sl:focus-visible .sgav-slt{outline:2px solid var(--s-noir);outline-offset:8px}
.sgav-st{display:inline-flex;flex:none}
.sgav-st button,.sgav-pst button{width:24px;height:24px;border:1px solid var(--s-noir);border-radius:0;background:#fff;cursor:pointer;font-weight:700;padding:0;line-height:1;font-size:14px;color:var(--s-noir)}
.sgav-st button+button,.sgav-pst button+button{border-left:0}
.sgav-st button:hover,.sgav-pst button:hover{background:var(--s-jaune)}
.sgav-prv{display:flex;align-items:center;flex-wrap:wrap;gap:3px 7px;font-size:11.5px;color:var(--s-gris);margin-top:1px}
.sgav-prv>b{color:var(--s-noir)}
.sgav-pst{display:inline-flex}
.sgav-pst button{width:19px;height:19px;font-size:12px;border-color:var(--s-gris3)}
.sgav-rp{height:26px;padding:0 8px;border:1px solid var(--s-nuit);border-radius:0;background:#fff;color:var(--s-nuit);font-weight:700;font-size:11.5px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
.sgav-rp:hover{background:var(--s-jaune);color:var(--s-noir);border-color:var(--s-noir)}
.sgav-rp svg,.sgav-ok svg{width:12px;height:12px;flex:none}
.sgav-ok{display:inline-flex;align-items:center;gap:4px;font-size:11.5px;color:var(--s-gris)}
.sgav-nc{font-size:12px;color:var(--s-gris2)}
.sgav-al{display:flex;gap:6px 12px;align-items:baseline;flex-wrap:wrap;padding:6px 10px;border-left:3px solid var(--s-rouge);font-size:12px;line-height:1.4}
.sgav-al>b{color:var(--s-rouge);white-space:nowrap}
.sgav-al.n{border-left-color:var(--s-gris2)}.sgav-al.n>b{color:var(--s-noir)}
.sgav-leg{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:11.5px;color:var(--s-gris);padding:10px 0 0;border-top:1px solid var(--s-filet)}
.sgav-leg>span{display:inline-flex;align-items:center;gap:6px}
.sgav-leg i{display:inline-block;flex:none}
.sgav-leg i.h{width:18px;height:8px;background:var(--s-gris)}
.sgav-leg i.hd{width:18px;height:8px;background:var(--s-rouge)}
.sgav-leg i.p{width:18px;height:8px;background:repeating-linear-gradient(135deg,var(--s-nuit) 0 1.5px,transparent 1.5px 4.5px);box-shadow:inset 0 0 0 1px var(--s-nuit)}
.sgav-leg i.r{width:18px;height:8px;background:var(--s-nuit)}
.sgav-leg i.pv{width:2px;height:13px;background:var(--s-noir)}
.sgav-leg i.pp{width:9px;height:9px;background:var(--s-jaune);border:1.5px solid var(--s-noir);transform:rotate(45deg);box-sizing:border-box}
.sgav-leg i.pg{width:8px;height:14px;background:#fff;border:2px solid var(--s-nuit);box-sizing:border-box}
.sgav-leg i.lh{width:18px;height:2px;background:var(--s-gris)}
.sgav-leg i.le{width:18px;height:3px;background:var(--s-nuit)}
.sgav-leg i.lp{width:18px;height:0;border-top:1.5px dashed var(--s-noir)}
.sgav-leg i.lz{width:14px;height:10px;background:rgba(189,30,66,.16)}
.sgav-leg i.ll{width:10px;height:10px;border-radius:50%;background:var(--s-jaune);border:2px solid var(--s-nuit);box-sizing:border-box}
.sgav-leg .k{display:block;flex-basis:100%;color:var(--s-noir);line-height:1.9}
.sgav-leg .kc{white-space:nowrap}
.sgav-leg kbd{font:inherit;font-size:10.5px;font-weight:700;border:1px solid var(--s-gris3);padding:0 4px;margin:0 1px;background:#fff}
.sgav-bas{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(320px,1fr);gap:0 32px;align-items:start}
@container sgav (max-width:1080px){.sgav-bas{grid-template-columns:minmax(0,1fr)}}
.sgav-gr{min-height:240px}
.sgav-svg{display:block;width:100%;height:auto;overflow:visible;cursor:crosshair}
.sgav-svg text{font-size:11px;fill:var(--s-gris)}
.sgav-svg .gl{stroke:var(--s-filet);stroke-width:1}
.sgav-svg .g100{stroke:var(--s-gris3);stroke-width:1}
.sgav-svg .ax{stroke:var(--s-noir);stroke-width:1}
.sgav-svg .zr{fill:#bd1e42;fill-opacity:.16;stroke:none}
.sgav-svg .lh{fill:none;stroke:var(--s-gris);stroke-width:1.6}
.sgav-svg .lp{fill:none;stroke:var(--s-noir);stroke-width:1.2;stroke-dasharray:5 4}
.sgav-svg .le{fill:none;stroke:var(--s-nuit);stroke-width:2.5}
.sgav-svg .pe{fill:var(--s-nuit)}
.sgav-svg .pp{fill:#fff;stroke:var(--s-noir);stroke-width:1.2}
.sgav-svg .live{fill:var(--s-jaune);stroke:var(--s-nuit);stroke-width:2}
.sgav-svg .sel{fill:var(--s-jaune2)}
.sgav-svg .hv{stroke:var(--s-noir);stroke-width:1;stroke-dasharray:2 3}
.sgav-lec{font-size:12px;min-height:18px;padding:6px 0 2px;color:var(--s-gris)}
.sgav-lec b{color:var(--s-noir)}
.sgav-j{width:100%;border-collapse:collapse;font-size:12.5px;font-variant-numeric:tabular-nums}
.sgav-j th{font-size:11.5px;font-weight:700;text-align:left;padding:7px 6px;border-bottom:1.5px solid var(--s-noir);white-space:nowrap}
.sgav-j td{padding:7px 6px;border-bottom:1px solid var(--s-filet);cursor:pointer;vertical-align:top}
.sgav-j .r{text-align:right;white-space:nowrap}
.sgav-j tr:hover td{background:var(--s-jaune3)}
.sgav-j tr.sel td{background:var(--s-jaune2)}
.sgav-j tr.cur td{font-weight:700}
.sgav-jd{white-space:nowrap}
.sgav-jn{font-size:11px;font-weight:400;color:var(--s-gris);line-height:1.3;margin-top:2px}
.sgav-tag{display:inline-block;margin-left:6px;font-size:10.5px;font-weight:700;padding:1px 6px;background:var(--s-jaune);white-space:nowrap}
.sgav-tag.ok{background:var(--s-nuit3);color:var(--s-nuit)}
.sgav-old{font-size:11px;color:var(--s-gris2);white-space:nowrap}
.sgav-j .sgav-rp{height:24px}
.sgav-cons{margin:12px 0 0;border-top:2px solid var(--s-noir);background:var(--s-jaune3);padding:10px 12px 12px}
.sgav-consh{display:flex;align-items:center;gap:6px 12px;flex-wrap:wrap;margin:0 0 8px}
.sgav-consh>b{font-size:13px}
.sgav-consh>span{font-size:12px;color:var(--s-gris)}
.sgav-consh>.sgav-cact{margin-left:auto;display:flex;flex-wrap:wrap;gap:6px;color:inherit}
.sgav-cv,.sgav-cp{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}
.sgav-cv th,.sgav-cv td,.sgav-cp th,.sgav-cp td{padding:4px 6px;border-bottom:1px solid var(--s-filet);text-align:left;vertical-align:top}
.sgav-cv th{width:72px;font-size:11.5px}
.sgav-cp{margin-top:8px}
.sgav-cp th{font-size:11px;border-bottom:1.5px solid var(--s-noir)}
.sgav-cv .r,.sgav-cp .r{text-align:right;white-space:nowrap}
.sgav-cp td b{color:var(--s-nuit);margin-right:4px}
.sgav-note{font-size:11.5px;color:var(--s-gris);line-height:1.45;margin:10px 0 0}
`;
const css=()=>{ if(!document.getElementById('sgav-css')){ const s=document.createElement('style'); s.id='sgav-css'; s.textContent=CSS; document.head.appendChild(s); } };

/* ── petits outils ── */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const NB=' ';
const fmt=v=>(Math.round((+v||0)*10)/10).toLocaleString('fr-CH');
const mil=n=>{ const v=Math.round(+n||0); return (v<0?'−':'')+String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g,"'"); };
const pcE=v=>Math.round(+v||0)+NB+'%';
const pcD=v=>fmt(v)+NB+'%';
const pcJ=v=>v==null?'—':pcE(v);
const sg=v=>{ const r=Math.round((+v||0)*10)/10; return (r>0?'+':r<0?'−':'±')+fmt(Math.abs(r)); };
const sgE=v=>{ const r=Math.round(+v||0); return (r>0?'+':r<0?'−':'±')+Math.abs(r); };
const dfr=s=>{ const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||''); return m?m[3]+'.'+m[2]+'.'+m[1]:String(s||''); };
const d10=s=>String(s==null?'':s).slice(0,10);
const borne=v=>Math.max(0,Math.min(100,Math.round(+v||0)));
const cran=v=>Math.max(0,Math.min(100,Math.round((+v||0)/5)*5));
const pas=(v,s)=>s>0?Math.min(100,Math.floor(v/5)*5+5):Math.max(0,Math.ceil(v/5)*5-5);
const MOIS=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
const moisLib=s=>{ const m=/^(\d{4})-(\d{2})/.exec(s||''); return m?MOIS[+m[2]-1]+' '+m[1]:''; };
const RISQUE=15, NOTE=30, PLAF=95;
const DATE_OK=/^(199\d|20\d\d)-\d{2}-\d{2}$/;
const SVG_FL='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><path d="M2 8h11M9 4l4 4-4 4"/></svg>';
const SVG_OK='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><path d="M3 8.5l3.2 3L13 4.5"/></svg>';
const fige=st=>JSON.stringify({date:st.date,eff:st.eff,prev:st.prev});
const dire=(m,err)=>{ if(typeof toast==='function') toast(m,err); };
const copie=o=>Object.assign({},o||{});
const jour=()=>{ try{ if(typeof today==='function') return today(); }catch(_){} const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
/* % entier du journal (projectimplementation : entiers 0–100, −1 = vide → null) ; nombre décimal (sgavancement) */
const ent=v=>v==null||v===''||!isFinite(+v)||+v<0?null:Math.round(+v);
const dec=v=>v==null||v===''||!isFinite(+v)||+v<0?null:+v;
const ver=(t,id)=>{ try{ return ((DS.S&&DS.S[t])||{})[String(id)]||0; }catch(_){ return 0; } };
const moi=()=>{ try{ return typeof ME==='object'&&ME&&ME.id?String(ME.id):''; }catch(_){ return ''; } };
/* nom d'un utilisateur d'après son identifiant de connexion (ME.id = USERID) */
const nomU=id=>{ if(!id) return ''; try{ const r=(DS.by('appuser','USERID',String(id))[0])||DS.get('appuser',id); return r&&r.NAME?String(r.NAME):String(id); }catch(_){ return String(id); } };
const quand=s=>{ const d=new Date(s||''); if(isNaN(d)) return ''; const z=n=>String(n).padStart(2,'0'); return z(d.getDate())+'.'+z(d.getMonth()+1)+'.'+d.getFullYear()+' '+z(d.getHours())+':'+z(d.getMinutes()); };
const comprises=d=>{ const L=[]; d.phases.forEach(ph=>ph.parts.forEach(x=>{ if(x.comprise) L.push(x); })); return L; };
const confirmer=(m,f,o)=>{ if(typeof sgConfirm==='function') sgConfirm(m,f,o); else if(typeof confirmDlg==='function') confirmDlg(m,o&&o.yesText).then(r=>{ if(r) f(); }); };   /* jamais confirm() natif */

/* droits : modification de l'avancement = droit de modifier le projet ; montants = règle de « Phases contrat » */
function peut(p){ try{
    if(typeof sgAdmin!=='function'||typeof sgDroit!=='function') return true;
    if(sgAdmin()||sgDroit('projets_modifier','tous')) return true;
    return sgDroit('projets_modifier','siens')&&typeof sgMesProjets==='function'&&sgMesProjets().has(String(p.ID));
  }catch(e){ console.error(e); return false; } }
function montants(){ try{
    if(typeof sgAdmin!=='function') return true;
    const prof=typeof SG_ACC==='object'&&SG_ACC?SG_ACC.profil:'';
    return (sgAdmin()||prof==='cdp')&&!(typeof sgFinVerrou==='function'&&sgFinVerrou());
  }catch(_){ return false; } }

/* ── données d'un projet ──
   { p, contrats:[{id, nom, date, hht, statut}], hht, phases:[{n:3, nom, parts:[{n:31, nom, sia (part SIA du contrat en % du mandat, 0 si non
   comprise), siaStd, comprise, budget (heures au contrat), heures (heures saisies), det:[{k:'431a', nom, sia, siaStd}] }]}], totalSia,
   heuresParMois:{'2026-10':h}, mode } — contrats et parts SIA du cadre Facturation (sgContratsDuProjet). mode : « contrat » (parts des contrats
   reliés), « sans » (aucun contrat relié), « sansparts » (contrats reliés sans aucune part 31–53 : expertises, anciens contrats), « nonlus »
   (contrats pas encore lus : cadre Facturation en chargement ou en échec) — dans les trois derniers cas, parts SIA 102 standard */
function donnees(p){
  let cs=[], lus=false;
  try{ const D=typeof fxData==='function'?fxData():null; lus=!!D&&typeof sgContratsDuProjet==='function'; cs=lus?sgContratsDuProjet(p,D).filter(c=>!c.annule):[]; }catch(e){ console.error(e); cs=[]; lus=false; }
  const det={}; cs.forEach(c=>Object.entries(c.phases||{}).forEach(([k,v])=>{ det[k]=(det[k]||0)+(+v||0); }));
  const sub={}; DS.by('projectphase','PROJECT_ID',p.ID).forEach(ph=>DS.by('projectsubphase','PROJECTPHASE_ID',ph.ID).forEach(s=>{ sub[+s.NUMBER]={rec:s,budget:+s.TIMEBUDGET||0,heures:0}; }));
  const subById={}; Object.values(sub).forEach(x=>{ subById[x.rec.ID]=x; });
  const parMois={};
  DS.by('timelog','PROJECT_ID',p.ID).forEach(r=>{ const h=+r.TIMEPERIOD||0; const x=subById[r.SUBPHASE_ID]; if(x) x.heures+=h;
    const m=r.TIMEYEAR!=null?r.TIMEYEAR+'-'+String((+r.TIMEMONTH||0)+1).padStart(2,'0'):''; if(m) parMois[m]=(parMois[m]||0)+h; });
  const DET=typeof FE_DET==='object'&&FE_DET?FE_DET:{};
  const phases=[3,4,5].map(n=>({n,nom:NOMS[n],parts:Object.keys(PARTS_STD).map(Number).filter(k=>Math.floor(k/10)===n).map(k=>{
    const L=DET[k]||[], d=L.map(([key,nom,std])=>({k:key,nom,siaStd:std,sia:+det[key]||0}));
    const sia=d.length?d.reduce((s,x)=>s+x.sia,0):0, s=sub[k]||{};
    return {n:k,nom:s.rec&&typeof nm==='function'?(nm(s.rec)||NOMS[k]):NOMS[k],sia,siaStd:PARTS_STD[k],comprise:sia>0,budget:s.budget||0,heures:s.heures||0,det:d}; })}));
  const siaC=phases.reduce((s,ph)=>s+ph.parts.reduce((a,x)=>a+(x.sia>0?x.sia:0),0),0);
  const mode=!lus?'nonlus':!cs.length?'sans':siaC>0?'contrat':'sansparts';
  if(mode!=='contrat') phases.forEach(ph=>ph.parts.forEach(x=>{ x.sia=x.siaStd; x.comprise=true; x.det.forEach(y=>{ y.sia=y.siaStd; }); }));
  const totalSia=phases.reduce((s,ph)=>s+ph.parts.reduce((a,x)=>a+(x.comprise?x.sia:0),0),0);
  return {p,mode,contrats:cs.map(c=>({id:c.id,nom:c.nom,date:c.date,hht:+c.hht||0,statut:c.statutContrat||''})),hht:cs.reduce((s,c)=>s+(+c.hht||0),0),phases,totalSia,heuresParMois:parMois}; }
/* empreinte des parts SIA retenues (contrats relus juste avant l'écriture : changées → rien n'est écrit) */
const sigD=d=>d.mode+'|'+comprises(d).map(x=>x.n+':'+Math.round(x.sia*1000)).join(',');
/* avancement global pondéré par les parts SIA comprises (0 à 100) */
function global(d,vals){ const T=d.totalSia||1; return d.phases.reduce((s,ph)=>s+ph.parts.reduce((a,x)=>a+(x.comprise?x.sia*(+vals[x.n]||0):0),0),0)/T; }

/* heures saisies par phase partielle et par mois (une sous-phase par numéro) ; M = phases comprises */
function heures(p,d){ const R={ok:false,M:{},P:{}};
  try{
    const cmp={}; d.phases.forEach(ph=>ph.parts.forEach(x=>{ if(x.comprise) cmp[x.n]=1; }));
    const sub={}; DS.by('projectphase','PROJECT_ID',p.ID).forEach(ph=>DS.by('projectsubphase','PROJECTPHASE_ID',ph.ID).forEach(s=>{ sub[+s.NUMBER]=s.ID; }));
    const num={}; Object.keys(sub).forEach(k=>{ num[sub[k]]=+k; });
    DS.by('timelog','PROJECT_ID',p.ID).forEach(r=>{ const n=num[r.SUBPHASE_ID]; if(n==null||r.TIMEYEAR==null) return;
      const m=r.TIMEYEAR+'-'+String((+r.TIMEMONTH||0)+1).padStart(2,'0'), h=+r.TIMEPERIOD||0;
      const P=R.P[n]=R.P[n]||{}; P[m]=(P[m]||0)+h; if(cmp[n]) R.M[m]=(R.M[m]||0)+h; });
    R.ok=true;
  }catch(e){ R.ok=false; }
  return R; }
/* heures d'une phase partielle jusqu'au mois de la date (mois compris) */
function hA(u,x,date){ if(!u.H.ok) return x.heures; const L=u.H.P[x.n]||{}, lim=String(date||'').slice(0,7); let s=0;
  Object.keys(L).forEach(m=>{ if(!lim||m<=lim) s+=L[m]; }); return s; }
function moisH(u,d){ return u.H.ok?u.H.M:(d.heuresParMois||{}); }
function cumA(u,d,date){ const M=moisH(u,d), lim=String(date||'').slice(0,7); let s=0; Object.keys(M).forEach(m=>{ if(m<=lim) s+=M[m]; }); return s; }

/* alertes d'une phase partielle comprise : « fin » = phase terminée au-delà des heures, « conf » = proposition à confirmer (pas de reprise) */
function alerte(o){ const h=o.h, b=o.b, ret=o.ret, conso=o.conso;
  if(conso!=null&&(conso>100||(ret<100&&conso-ret>=RISQUE))){
    const dep=conso>100?'Heures du contrat dépassées de '+mil(h-b)+' h ('+mil(h)+' h pour '+mil(b)+' h)':'';
    if(ret>=100) return {k:'r',fin:true,t:'Heures du contrat dépassées',x:dep+' ; phase terminée.'};
    let t;
    if(ret<=0) t=dep?'Aucun avancement retenu.':mil(h)+' h saisies ('+pcE(conso)+' des heures du contrat) et aucun avancement retenu.';
    else { const pj=h*100/ret; t='Au rythme actuel, environ '+mil(pj)+' h à l’achèvement pour '+mil(b)+' h au contrat (+'+mil(pj-b)+' h).'; }
    return {k:'r',t:'Risque de dépassement',x:(dep?dep+(ret>0?' pour un avancement de '+ret+' %':'')+'. ':'')+t}; }
  if(conso!=null&&ret-conso>=NOTE) return {k:'n',conf:true,t:'À confirmer',x:'Avancement retenu ('+ret+' %) bien au-dessus des heures consommées ('+pcE(conso)+') : heures imputées à une autre phase ? La proposition ('+o.pr+' %) n’est pas reprise d’office.'};
  if(conso==null&&h>0) return {k:'n',t:'Sans heures au contrat',x:mil(h)+' h saisies, aucune heure prévue au contrat pour cette phase partielle : pas de proposition.'};
  return null; }

/* proposition = heures ÷ contrat par 5 %, au plus 95 % ; heures épuisées (≥ 100 %) = pas de proposition. « ok » = reprenable : la même règle
   sert au bouton « Reprendre », à la touche P, à « Tout reprendre » et au chiffre « Proposé par les heures » (prop). */
function calcul(u,d,st){ const L=[], prop={}; let sh=0, sb=0;
  const phases=d.phases.map(ph=>{
    const rows=ph.parts.map(x=>{
      const h=hA(u,x,st.date), b=+x.budget||0, ret=borne(st.eff[x.n]), prv=borne(st.prev[x.n]);
      const conso=b>0?h/b*100:null, ep=conso!=null&&conso>=100, pr=conso==null||ep?null:Math.min(PLAF,cran(conso));
      if(x.comprise){ sh+=h; sb+=b; }
      const o={x,h,b,ret,prv,conso,ep,pr,al:null,ok:false};
      if(x.comprise){ o.al=alerte(o); o.ok=pr!=null&&ret<100&&!(o.al&&o.al.conf); }
      prop[x.n]=o.ok?pr:ret;
      L.push(o); return o; });
    return {ph,rows}; });
  phases.forEach(P=>{ const c=P.rows.filter(o=>o.x.comprise), S=c.reduce((s,o)=>s+o.x.sia,0);
    const moy=f=>S>0?c.reduce((s,o)=>s+o.x.sia*f(o),0)/S:0;
    P.n=c.length; P.h=c.reduce((s,o)=>s+o.h,0); P.b=c.reduce((s,o)=>s+o.b,0); P.conso=P.b>0?P.h/P.b*100:null;
    P.eff=moy(o=>o.ret); P.prev=moy(o=>o.prv); P.prop=moy(o=>prop[o.x.n]); P.nProp=c.filter(o=>o.ok).length; P.sia=S; });
  const G={eff:global(d,st.eff),prev:global(d,st.prev),prop:global(d,prop),h:sh,b:sb,conso:sb>0?sh/sb*100:null};
  const tout=L.filter(o=>o.x.comprise&&o.ok&&o.pr!==o.ret);
  return {L,phases,G,prop,tout,diff:tout.length,nProp:L.filter(o=>o.ok).length}; }

/* modifications par rapport à l'état ouvert (u.base) */
function modifs(u,st){ const B=JSON.parse(u.base), ks={}; let k=0;
  [B.eff,st.eff,B.prev,st.prev].forEach(o=>Object.keys(o||{}).forEach(n=>{ ks[n]=1; }));
  Object.keys(ks).forEach(n=>{ if(borne(B.eff[n])!==borne(st.eff[n])||borne(B.prev[n])!==borne(st.prev[n])) k++; });
  return {n:k,date:B.date!==st.date}; }
const modifie=u=>{ if(!u.st||!u.base) return false; const M=modifs(u,u.st); return M.n>0||M.date; };
/* détail d'un état enregistré identique à l'état en cours ? */
function memes(d,parts,st){ if(!parts) return false; let ok=true;
  d.phases.forEach(ph=>ph.parts.forEach(x=>{ if(borne(parts.eff[x.n])!==borne(st.eff[x.n])||borne(parts.prev[x.n])!==borne(st.prev[x.n])) ok=false; })); return ok; }

/* désignation proposée à l'enregistrement (NAME, 64 caractères au plus) */
function designation(d,eff){ const L=comprises(d), c=L.find(x=>{ const v=borne(eff[x.n]); return v>0&&v<100; }), f=L.filter(x=>borne(eff[x.n])>=100);
  const t=c?c.n+' '+c.nom+' en cours':L.length&&f.length===L.length?'Prestations achevées':f.length?'Phase '+f[f.length-1].n+' terminée':'Début des prestations';
  return t.length>64?t.slice(0,63)+'…':t; }

/* ── journal des états : ancien journal du projet (projectimplementation) + états détaillés (sgavancement), une ligne par date ── */
const triDate=(a,b,ka)=>String(a[ka]||'').localeCompare(String(b[ka]||''))||((+a.ID||0)-(+b.ID||0))||String(a.ID).localeCompare(String(b.ID));
function recsDe(p){ return DS.all(T_AV).filter(r=>r&&String(r.PROJECT_ID)===String(p.ID)&&DATE_OK.test(d10(r.DATE))).sort((a,b)=>triDate(a,b,'DATE')); }
function implsDe(p){ return DS.by(T_IM,'PROJECT_ID',p.ID).slice().sort((a,b)=>triDate(a,b,'IMPLEMENTATIONDATE')); }
function implDe(p,r){ if(!r||r.IMPL_ID==null) return null; const i=DS.get(T_IM,r.IMPL_ID); return i&&String(i.PROJECT_ID)===String(p.ID)?i:null; }
function jPose(J,x){ if(!/^\d{4}-\d{2}-\d{2}$/.test(x.date)) return; const y=J.find(z=>z.date===x.date);
  if(!y){ J.push(x); return; }
  Object.keys(x).forEach(k=>{ const v=x[k]; if(v!=null&&v!==''&&v!==false) y[k]=v; }); }
function journal(p){ const J=[], R=recsDe(p), I=implsDe(p), lies=new Set(), parJour={};
  I.forEach(r=>{ const k=d10(r.IMPLEMENTATIONDATE); (parJour[k]=parJour[k]||[]).push(r); });
  R.forEach(r=>{ const i=implDe(p,r); if(i&&d10(i.IMPLEMENTATIONDATE)===d10(r.DATE)) lies.add(String(i.ID)); });
  I.forEach(r=>{ if(lies.has(String(r.ID))) return;
    jPose(J,{date:d10(r.IMPLEMENTATIONDATE),prev:ent(r.SCHEDULEDVALUE),eff:ent(r.CURRENTVALUE),nom:String(r.NAME||''),remP:String(r.SCHEDULEDREMARK||''),remE:String(r.CURRENTREMARK||''),
      userP:String(r.SCHEDULEDUSERID||''),userE:String(r.CURRENTUSERID||''),parts:null,base:true,impl:r}); });
  /* état détaillé : remplace la ligne de sa date (le dernier par ID si deux postes ont enregistré la même date) */
  const parDate={};
  R.forEach(r=>{ const k=d10(r.DATE); (parDate[k]=parDate[k]||[]).push(r); });
  Object.keys(parDate).forEach(k=>{ const L=parDate[k], r=L[L.length-1];
    const x={date:k,prev:dec(r.GLOBAL_PREV),eff:dec(r.GLOBAL_EFF),nom:String(r.NOM||''),remP:'',remE:String(r.REMARQUE||''),userP:String(r.PAR||''),userE:String(r.PAR||''),
      parts:{eff:copie(r.EFF),prev:copie(r.PREV)},prop:copie(r.PROP),base:false,rec:r,impl:implDe(p,r),dups:L.slice(0,-1),modifie:r.MODIFIE||''};
    const i=J.findIndex(y=>y.date===k); if(i>=0) J[i]=x; else J.push(x); });
  J.forEach(x=>{ x.lignes=parJour[x.date]||[]; });   /* toutes les lignes « projectimplementation » de la date (liées ou non) */
  J.sort((a,b)=>a.date.localeCompare(b.date)); return J; }
/* description d'un état du journal pour les questions et les avis (lignes de l'ancien journal listées une à une, jamais fusionnées) */
function descEtat(x){ const v=(pv,ef,nom)=>'prévu '+pcJ(pv)+', effectif '+pcJ(ef)+(nom?' (« '+nom+' »)':'');
  const L=x.parts?null:(x.lignes||[]);
  if(L&&L.length>1) return L.length+' lignes de l’ancien journal à cette date — '+L.map(r=>v(ent(r.SCHEDULEDVALUE),ent(r.CURRENTVALUE),String(r.NAME||''))).join(' ; ');
  return (x.parts?'':'ancien journal, sans détail — ')+v(x.prev,x.eff,x.nom); }
/* enregistrements d'une date, relus dans la base : états détaillés R (le dernier par ID = rec), lignes du journal d'origine I, ligne gardée
   impl (celle de rec si elle est à cette date, sinon la dernière par ID) ; sig = identifiants et versions (changés entre la question et
   l'écriture → rien n'est écrit) */
function cible(p,date){ const R=recsDe(p).filter(r=>d10(r.DATE)===date), rec=R.length?R[R.length-1]:null;
  const I=implsDe(p).filter(r=>d10(r.IMPLEMENTATIONDATE)===date);
  let impl=implDe(p,rec); if(impl&&d10(impl.IMPLEMENTATIONDATE)!==date) impl=null;
  if(!impl) impl=I.length?I[I.length-1]:null;
  const sig=R.map(r=>'a'+r.ID+':'+ver(T_AV,r.ID)).concat(I.map(r=>'i'+r.ID+':'+ver(T_IM,r.ID))).join(',');
  return {R,rec,I,impl,sig}; }
/* état ouvert : à une date donnée, l'état détaillé de cette date ; sinon le dernier état détaillé (date la plus récente) ; sans état : 0 % */
function etatA(u,date){ const det=u.J.filter(x=>x.parts), dt=date||jour();
  const x=(date?det.find(y=>y.date===date):null)||det[det.length-1]||null;
  return {date:dt,eff:x?copie(x.parts.eff):{},prev:x?copie(x.parts.prev):{}}; }

function consulter(u,d,x){
  const qui=(us,r)=>{ const t=[]; if(us) t.push('par '+esc(nomU(us))); if(r) t.push(esc(r)); return t.join(' · ')||'<span class="sgav-vide">—</span>'; };
  let s='<div class="sgav-cons"><div class="sgav-consh"><b>État du '+dfr(x.date)+'</b>'+(x.nom?'<span>'+esc(x.nom)+'</span>':'')
    +'<span class="sgav-cact">'+(x.parts?'<button class="nx-btn sm" data-a="ouvrir" data-j="'+esc(x.date)+'" title="'+(u.peut?'Reprend cet état (date et détail des phases) dans le tableau, pour le corriger':'Affiche cet état (date et détail des phases) dans le tableau')+'">'+(u.peut?'Rouvrir pour modifier':'Afficher dans le tableau')+'</button>':'')
    +(x.parts&&x.rec&&u.peut?'<button class="nx-btn sm danger" data-a="suppr" data-j="'+esc(x.date)+'" title="Supprime cet état et sa ligne du journal du projet">Supprimer l’état</button>':'')
    +'<button class="nx-btn sm" data-a="fermer">Fermer</button></span></div>'
    +'<table class="sgav-cv"><tbody><tr><th>Prévu</th><td class="r"><b>'+pcJ(x.prev)+'</b></td><td>'+qui(x.userP,x.remP)+'</td></tr>'
    +'<tr><th>Effectif</th><td class="r"><b>'+pcJ(x.eff)+'</b></td><td>'+qui(x.userE,x.remE)+'</td></tr></tbody></table>';
  if(x.parts) s+='<table class="sgav-cp"><thead><tr><th>Phase partielle</th><th class="r">Prévu</th><th class="r">Effectif</th><th class="r">Proposé</th></tr></thead><tbody>'
    +comprises(d).map(y=>'<tr><td><b>'+y.n+'</b>'+esc(y.nom)+'</td><td class="r">'+pcE(borne(x.parts.prev[y.n]))+'</td><td class="r">'+pcE(borne(x.parts.eff[y.n]))+'</td><td class="r">'+(x.prop&&x.prop[y.n]!=null?pcE(x.prop[y.n]):'—')+'</td></tr>').join('')+'</tbody></table>';
  else if((x.lignes||[]).length>1) s+='<table class="sgav-cp"><thead><tr><th>'+x.lignes.length+' lignes de l’ancien journal à cette date</th><th class="r">Prévu</th><th class="r">Effectif</th></tr></thead><tbody>'
    +x.lignes.map(r=>'<tr><td>'+(r.NAME?esc(r.NAME):'<span class="sgav-vide">sans désignation</span>')+'</td><td class="r">'+pcJ(ent(r.SCHEDULEDVALUE))+'</td><td class="r">'+pcJ(ent(r.CURRENTVALUE))+'</td></tr>').join('')+'</tbody></table>';
  s+='<p class="sgav-note">'+(x.parts?'Lecture seule'+(x.modifie?' · enregistré le '+esc(quand(x.modifie)):'')+'. '
      +(u.peut?'« Rouvrir pour modifier » reprend cet état dans le tableau des phases.':'« Afficher dans le tableau » montre cet état dans le tableau des phases.')
    :(x.base?'Ancien journal du projet':'État enregistré sans détail')+' : valeurs de l’ensemble du mandat seulement, sans détail par phase. Lecture seule.')+'</p></div>';
  return s; }

/* ── barres ── */
function barH(v,mince,dc){ if(v==null) return '<span class="sgav-vide">pas d’heures au contrat</span>';
  const dp=v>100;
  return '<div class="sgav-bw"><div class="sgav-b h'+(dp?' dp':'')+(mince?' mn':'')+'"><i style="width:'+Math.min(100,v)+'%"></i></div><b class="sgav-v'+(dp?' sgav-neg':'')+'">'+(dc?pcD(v):pcE(v))+'</b></div>'; }
function barP(v,o){ o=o||{}; if(v==null) return '<span class="sgav-vide">—</span>';
  const t=o.n!=null?'Cliquer pour reprendre la proposition ('+v+' %)':o.titre||'';
  return '<div class="sgav-bw'+(o.n!=null?' sgav-pc" data-a="rp" data-n="'+o.n:'')+'"'+(t?' title="'+esc(t)+'"':'')+'><div class="sgav-b p'+(o.mince?' mn':'')+'"><i style="width:'+v+'%"></i></div><b class="sgav-v">'+(o.dec?pcD(v):pcE(v))+'</b></div>'; }
function barR(v,prv,pr,mince){ return '<div class="sgav-bw"><div class="sgav-b r'+(mince?' mn':'')+'"><i style="width:'+v+'%"></i>'
  +(prv!=null?'<em class="pv" style="left:'+prv+'%"></em>':'')+(pr!=null?'<em class="pp" style="left:'+pr+'%"></em>':'')+'</div><b class="sgav-v">'+pcD(v)+'</b></div>'; }
function curseur(o){ const n=o.x.n;
  return '<div class="sgav-rw"><div class="sgav-sl" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+o.ret+'" aria-valuetext="'+o.ret+' %" aria-label="Avancement retenu, phase partielle '+n+'" data-sl="'+n+'" title="Glisser la barre bleue (ou cliquer) : avancement retenu par crans de 5 %">'
    +'<div class="sgav-slt"><i class="f" style="width:'+o.ret+'%"></i><i class="cr" style="left:25%"></i><i class="cr" style="left:50%"></i><i class="cr" style="left:75%"></i>'
    +'<em class="pv" style="left:'+o.prv+'%"></em>'+(o.pr!=null?'<em class="pp" style="left:'+o.pr+'%"></em>':'')+'<i class="pg" style="left:'+o.ret+'%"></i></div></div>'
    +'<b class="sgav-v" data-v="'+n+'">'+o.ret+NB+'%</b>'
    +'<span class="sgav-st"><button data-a="st" data-n="'+n+'" data-d="-5" tabindex="-1" title="Avancement retenu −5 %">−</button><button data-a="st" data-n="'+n+'" data-d="5" tabindex="-1" title="Avancement retenu +5 %">+</button></span></div>'; }

function nomCell(o){ const x=o.x;
  return '<div class="sgav-nm"><b>'+x.n+'</b><span>'+esc(x.nom)+'<em>'+(x.comprise?fmt(x.sia)+' % du mandat':'non comprise au contrat')+'</em></span></div>'; }

function ligne(o,ok){ const x=o.x;
  if(!x.comprise) return '<tr class="pt nc"><td>'+nomCell(o)+'</td><td colspan="4"><span class="sgav-nc">Hors contrat : pas d’avancement à suivre'+(o.h>0?' · '+mil(o.h)+' h saisies':'')+'</span></td></tr>';
  const sub=o.b>0?'<div class="sgav-sub">'+mil(o.h)+NB+'h / '+mil(o.b)+NB+'h'+(o.h>o.b?' <b class="sgav-neg">+'+mil(o.h-o.b)+NB+'h</b>':'')+'</div>':(o.h>0?'<div class="sgav-sub">'+mil(o.h)+NB+'h saisies</div>':'');
  let rp='';
  if(o.pr!=null&&o.pr===o.ret) rp='<span class="sgav-ok" title="L’avancement retenu est celui proposé par les heures">'+SVG_OK+'repris</span>';
  else if(o.ok&&ok) rp='<button class="sgav-rp" data-a="rp" data-n="'+x.n+'" tabindex="-1" title="Reprendre la proposition : '+o.pr+' % (touche P)">'+SVG_FL+'Reprendre</button>';
  else if(o.pr!=null&&o.ret>=100) rp='<span class="sgav-ok" title="Phase terminée : les heures ne disent pas si une phase est finie, la proposition ('+o.pr+' %) n’est pas reprise.'+(ok?' Pour rouvrir la phase, glisser la barre.':'')+'">terminée</span>';
  else if(o.pr!=null&&o.al&&o.al.conf) rp='<span class="sgav-ok" title="Proposition à confirmer : voir la remarque sous la ligne">à confirmer</span>';
  const prC=o.ep?'<span class="sgav-ep" title="Les heures du contrat sont toutes consommées : elles ne disent plus où en est la phase.'+(ok?' Réglez l’avancement retenu vous-même.':'')+'">heures épuisées · à juger</span>'
    :barP(o.pr,{n:ok&&o.ok&&o.pr!==o.ret?x.n:null,titre:o.pr!=null&&!o.ok?'Proposition des heures, non reprise d’office':''});
  const ec=o.ret-o.prv;
  return '<tr class="pt'+(o.al?' a':'')+'" data-n="'+x.n+'"><td>'+nomCell(o)+'</td><td>'+barH(o.conso)+sub+'</td><td>'+prC+'</td>'
    +'<td>'+rp+'</td><td>'+(ok?curseur(o):barR(o.ret,o.prv,o.pr,false))
    +'<div class="sgav-prv">prévu <b>'+o.prv+NB+'%</b>'+(ok?'<span class="sgav-pst"><button data-a="pv" data-n="'+x.n+'" data-d="-5" tabindex="-1" title="Prévu −5 %">−</button><button data-a="pv" data-n="'+x.n+'" data-d="5" tabindex="-1" title="Prévu +5 %">+</button></span>':'')
    +(ec?'<span class="'+(ec<0?'sgav-neg':'sgav-pos')+'">'+sg(ec)+' pts '+(ec<0?'de retard':'d’avance')+'</span>':'')+'</div></td></tr>'
    +(o.al?'<tr class="al"><td></td><td colspan="4"><div class="sgav-al '+o.al.k+'"><b>'+esc(o.al.t)+'</b><span>'+esc(o.al.x)+'</span></div></td></tr>':''); }

/* ── historique : courbe heures consommées % / avancement effectif % / prévu % ── */
function graphe(u,d,st,G,W){
  const M=moisH(u,d), H=250, ml=44, mr=16, mt=14, mb=28;
  const pts=u.J.filter(e=>e.date!==st.date&&(e.eff!=null||e.prev!=null)).map(e=>({date:e.date,prev:e.prev,eff:e.eff}))
    .concat([{date:st.date,prev:G.prev,eff:G.eff,live:true}]).sort((a,b)=>a.date.localeCompare(b.date));
  pts.forEach(o=>{ o.t=Date.parse(o.date); });
  const PE=pts.filter(o=>o.eff!=null), PP=pts.filter(o=>o.prev!=null);
  const fin=pts[pts.length-1].date, ms=Object.keys(M).filter(m=>M[m]>0&&m<=fin.slice(0,7)).sort();
  let deb=ms[0]||pts[0].date.slice(0,7); if(pts[0].date.slice(0,7)<deb) deb=pts[0].date.slice(0,7);
  const t0=Date.parse(deb+'-01'), t1=Math.max(Date.parse(fin),t0+31*864e5);
  const X=t=>ml+(t-t0)/(t1-t0)*(W-ml-mr);
  const hs=[{t:t0,v:0,h:0}]; let cum=0, y=+deb.slice(0,4), m=+deb.slice(5,7), garde=0;
  const yf=+fin.slice(0,4), mf=+fin.slice(5,7);
  while(y*12+m<=yf*12+mf&&garde++<900){ cum+=M[y+'-'+String(m).padStart(2,'0')]||0;
    hs.push({t:Math.min(Date.UTC(y,m,0),t1),v:G.b>0?cum/G.b*100:0,h:cum}); m++; if(m>12){ m=1; y++; } }
  const vmax=Math.max(100,...hs.map(o=>o.v),...pts.map(o=>Math.max(o.prev||0,o.eff||0)));
  const top=Math.ceil(vmax/25)*25, Y=v=>mt+(1-v/top)*(H-mt-mb);
  const iv=(A,t,k)=>{ if(t<=A[0].t) return A[0][k]; for(let i=1;i<A.length;i++) if(t<=A[i].t){ const a=A[i-1], b=A[i], r=(t-a.t)/((b.t-a.t)||1); return a[k]+(b[k]-a[k])*r; } return A[A.length-1][k]; };
  const xy=(t,v)=>X(t).toFixed(1)+','+Y(v).toFixed(1);
  const pc=v=>v==null?'—':fmt(v)+' %';
  let s='<svg class="sgav-svg" viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'">';
  if(u.sel){ const e=pts.find(o=>o.date===u.sel); if(e) s+='<rect class="sel" x="'+(X(e.t)-7).toFixed(1)+'" y="'+mt+'" width="14" height="'+(H-mt-mb)+'"/>'; }
  for(let v=0;v<=top;v+=25) s+='<line class="'+(v===100?'g100':'gl')+'" x1="'+ml+'" x2="'+(W-mr)+'" y1="'+Y(v).toFixed(1)+'" y2="'+Y(v).toFixed(1)+'"/><text x="'+(ml-8)+'" y="'+(Y(v)+4).toFixed(1)+'" text-anchor="end">'+v+' %</text>';
  s+='<line class="ax" x1="'+ml+'" x2="'+(W-mr)+'" y1="'+Y(0)+'" y2="'+Y(0)+'"/>';
  const y0=new Date(t0).getUTCFullYear(), y1=new Date(t1).getUTCFullYear(); let dernier=-99;
  if(X(Date.UTC(y0+1,0,1))-ml>46||y0===y1){ s+='<text x="'+(ml+3)+'" y="'+(H-8)+'">'+y0+'</text>'; dernier=ml; }
  for(let a=y0+1;a<=y1;a++){ const x=X(Date.UTC(a,0,1)); if(x>W-mr) break; s+='<line class="ax" x1="'+x.toFixed(1)+'" x2="'+x.toFixed(1)+'" y1="'+Y(0)+'" y2="'+(Y(0)+5)+'"/>';
    if(x-dernier>36&&x<W-mr-20){ s+='<text x="'+(x+3).toFixed(1)+'" y="'+(H-8)+'">'+a+'</text>'; dernier=x; } }
  /* zone rouge : heures consommées au-dessus de l'avancement effectif */
  const e0=PE[0].t, e1=PE[PE.length-1].t, T=[];
  PE.forEach(o=>T.push(o.t)); hs.forEach(o=>{ if(o.t>e0&&o.t<e1) T.push(o.t); });
  T.sort((a,b)=>a-b); let z='';
  for(let i=0;i<T.length-1;i++){ const a=T[i], b=T[i+1]; if(b<=a) continue;
    const h1=iv(hs,a,'v'), h2=iv(hs,b,'v'), f1=iv(PE,a,'eff'), f2=iv(PE,b,'eff'), d1=h1-f1, d2=h2-f2;
    if(d1<=0&&d2<=0) continue;
    if(d1>=0&&d2>=0){ z+='<polygon class="zr" points="'+[xy(a,h1),xy(b,h2),xy(b,f2),xy(a,f1)].join(' ')+'"/>'; continue; }
    const r=d1/(d1-d2), tc=a+(b-a)*r, vc=f1+(f2-f1)*r;
    z+=d1>0?'<polygon class="zr" points="'+[xy(a,h1),xy(tc,vc),xy(a,f1)].join(' ')+'"/>':'<polygon class="zr" points="'+[xy(tc,vc),xy(b,h2),xy(b,f2)].join(' ')+'"/>'; }
  s+=z;
  s+='<polyline class="lh" points="'+hs.map(o=>xy(o.t,o.v)).join(' ')+'"/>';
  s+='<polyline class="lp" points="'+PP.map(o=>xy(o.t,o.prev)).join(' ')+'"/>';
  s+='<polyline class="le" points="'+PE.map(o=>xy(o.t,o.eff)).join(' ')+'"/>';
  pts.forEach(o=>{ const hh=iv(hs,o.t,'v'), tt='<title>'+esc(dfr(o.date)+(o.live?' (état en cours)':'')+' — effectif '+pc(o.eff)+', prévu '+pc(o.prev)+', heures consommées '+Math.round(hh)+' %')+'</title>';
    if(o.prev!=null) s+='<rect class="pp" x="'+(X(o.t)-2.5).toFixed(1)+'" y="'+(Y(o.prev)-2.5).toFixed(1)+'" width="5" height="5">'+(o.eff==null?tt:'')+'</rect>';
    if(o.eff!=null) s+='<circle class="'+(o.live?'live':'pe')+'" cx="'+X(o.t).toFixed(1)+'" cy="'+Y(o.eff).toFixed(1)+'" r="'+(o.live?5.5:3.6)+'">'+tt+'</circle>'; });
  s+='<line class="hv" x1="0" x2="0" y1="'+mt+'" y2="'+Y(0)+'" visibility="hidden"/></svg>';
  return {svg:s,g:{t0,t1,ml,mr,W,hs,pts,PE,PP,iv,X}}; }

function lecture(g,t,st,G){ const iv=g.iv;
  if(t==null) return 'État du <b>'+dfr(st.date)+'</b> — heures consommées <b>'+(G.conso==null?'—':pcE(G.conso))+'</b> · effectif <b>'+pcD(G.eff)+'</b> · prévu <b>'+pcD(G.prev)+'</b>';
  const dt=new Date(t), h=iv(g.hs,t,'v'), E=g.PE, P=g.PP, dE=t>=E[0].t&&t<=E[E.length-1].t, dP=t>=P[0].t&&t<=P[P.length-1].t;
  return '<b>'+MOIS[dt.getUTCMonth()]+' '+dt.getUTCFullYear()+'</b> — heures consommées <b>'+pcE(h)+'</b>'
    +(dE?' · effectif <b>'+pcE(iv(E,t,'eff'))+'</b>':'')+(dP?' · prévu <b>'+pcE(iv(P,t,'prev'))+'</b>':'')+(!dE&&!dP?' · pas d’état enregistré':''); }

/* ── en-tête (créé une fois par écran : le champ « État du » et le panneau d'enregistrement ne sont jamais recréés pendant la saisie) ── */
function metaTxt(u){ const d=u.d, nC=d.contrats.length, ctr=nC+' contrat'+(nC>1?'s':'')+(d.hht&&u.argent?' · '+mil(d.hht)+' CHF HT':'');
  const t=d.mode==='contrat'?ctr:d.mode==='sansparts'?ctr+' · '+(nC>1?'contrats':'contrat')+' sans parts SIA 31–53 : parts SIA standard'
    :d.mode==='nonlus'?(u.fx==='attente'?'Contrats en cours de lecture : parts SIA standard provisoires':'Contrats non lus : parts SIA standard provisoires')
    :'Aucun contrat relié : parts SIA standard';
  return t+' · phases comprises : '+fmt(d.totalSia)+' % du mandat'; }
/* « Enregistrer l'état » possible ? (droit, pas d'écriture en cours, au moins une phase comprise, contrats lus ou cadre Facturation en échec) */
function peutEnr(u){ return !!(u.peut&&!u.enCours&&u.d&&comprises(u.d).length&&!(u.d.mode==='nonlus'&&u.fx==='attente')); }
const T_ENR='Ajoute (ou remplace) la ligne datée du journal, avec une désignation et une remarque';
function majBoutons(u){ const R=u.R; if(!R) return; const en=peutEnr(u);
  const t=en?T_ENR:u.enCours?'Enregistrement en cours…':u.d&&u.d.mode==='nonlus'?'Contrats d’honoraires en cours de lecture : enregistrement possible dans un instant':T_ENR;
  R.querySelectorAll('[data-a="enr"],[data-a="enrok"]').forEach(b=>{ b.disabled=!en; if(b.dataset.a==='enr') b.title=t; });
  R.querySelectorAll('[data-a="suppr"]').forEach(b=>{ b.disabled=!!u.enCours; }); }
function tete(u){ const p=u.p, d=u.d, st=u.st;
  return '<div class="sgfh-tete"><div class="sgfh-id"><div class="sgfh-ini">'+esc(p.NUMBER||'')+'</div><div class="sgfh-nm"><div class="lb">Avancement des prestations</div><h2>'+esc(p.TITLE||'')+'</h2>'
    +'<div class="sgfh-meta" data-meta title="'+esc(d.contrats.map(c=>c.nom+(c.date?' ('+dfr(c.date)+')':'')).join(' · '))+'">'+esc(metaTxt(u))+'</div></div></div>'
    +'<div class="sgav-hact"><label class="sgav-date"><span>État du</span><input type="date" data-a="date" value="'+esc(st.date)+'" title="Date de l’état : appliquée après une courte pause, sur Entrée ou en quittant le champ"></label>'
    +'<button class="nx-btn pri" data-a="enr"'+(u.peut?'':' hidden')+' title="'+esc(T_ENR)+'">Enregistrer l’état</button></div></div>'; }
function brancherDate(u,R){ const inp=R.querySelector('input[data-a="date"]'); if(!inp) return;
  const appliquer=ms=>{ const ui=R._ui; clearTimeout(ui.tDate); ui.tDate=null; const v=inp.value; if(!DATE_OK.test(v)) return;
    let k=0;
    const f=()=>{ ui.tDate=null; if(u.R!==R||u.st.date===v) return;
      if(ui.drag||!R.isConnected){ if(++k<200) ui.tDate=setTimeout(f,300); return; }   /* glisser en cours, ou écran repris par un redessin */
      u.st.date=v; u.sel=null; dessiner(u,null); };
    if(ms) ui.tDate=setTimeout(f,ms); else f(); };
  inp.addEventListener('input',()=>appliquer(600)); inp.addEventListener('change',()=>appliquer(600));
  inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); appliquer(0); } });
  inp.addEventListener('blur',()=>appliquer(0)); }

/* ── enregistrement : opérations (un seul DS.commit) ── */
/* c = cible(p, date) relue juste avant l'écriture ; st = copie de l'état au moment de la demande. Une seule ligne par (projet, date) : les états
   en double et les autres lignes « projectimplementation » de la date sont supprimés dans le même commit. */
function operations(u,p,o,c,st){ const d=u.d, date=st.date, K=calcul(u,d,st), G=K.G, me=moi()||null;
  const rec=c.rec, impl=c.impl;
  const eff={}, prev={}, prop={};
  d.phases.forEach(ph=>ph.parts.forEach(x=>{ eff[x.n]=borne(st.eff[x.n]); prev[x.n]=borne(st.prev[x.n]); }));
  K.L.forEach(q=>{ if(q.x.comprise&&q.pr!=null) prop[q.x.n]=q.pr; });
  const nom=String(o.nom||'').trim().slice(0,64), rem=String(o.rem||'').trim().slice(0,1024);
  const gE=Math.round(G.eff*10)/10, gP=Math.round(G.prev*10)/10;   /* % entiers du journal d'origine = arrondi des valeurs à une décimale */
  const iId=impl?impl.ID:DS.newIds(T_IM)[0], aId=rec?rec.ID:DS.newIds(T_AV)[0];
  const iv=Object.assign(impl?Object.assign({},impl):{ID:iId,PROJECT_ID:p.ID,SCHEDULEDREMARK:null},
    {IMPLEMENTATIONDATE:date,NAME:nom,SCHEDULEDVALUE:borne(gP),SCHEDULEDUSERID:me,CURRENTVALUE:borne(gE),CURRENTUSERID:me,CURRENTREMARK:rem||null});
  const av=Object.assign(rec?Object.assign({},rec):{},{ID:aId,PROJECT_ID:p.ID,DATE:date,NOM:nom,REMARQUE:rem||null,EFF:eff,PREV:prev,PROP:prop,
    GLOBAL_EFF:gE,GLOBAL_PREV:gP,IMPL_ID:iId,PAR:me,MODIFIE:new Date().toISOString()});
  const ops=[{t:T_AV,id:aId,val:av,bseq:rec?ver(T_AV,aId):0},{t:T_IM,id:iId,val:iv,bseq:impl?ver(T_IM,iId):0}];
  c.R.forEach(r=>{ if(String(r.ID)!==String(aId)) ops.push({t:T_AV,id:r.ID,val:null,bseq:ver(T_AV,r.ID)}); });
  c.I.forEach(r=>{ if(String(r.ID)!==String(iId)) ops.push({t:T_IM,id:r.ID,val:null,bseq:ver(T_IM,r.ID)}); });
  return {ops,G}; }
/* autres enregistrements de la date supprimés par l'enregistrement (états en double, autres lignes du journal d'origine) */
const enTrop=c=>(c.R.length>1?c.R.length-1:0)+(c.I.length>1?c.I.length-1:0);
function sauver(u,o,apres){ const p=DS.get('project',u.pid)||u.p, date=u.st.date;
  if(u.enCours||document.querySelector('.ov')) return;   /* écriture en cours, ou question déjà posée */
  if(!u.peut){ dire('Lecture seule : votre profil ne permet pas de modifier l’avancement de ce projet.',true); return; }
  if(!DATE_OK.test(date)){ dire('Date de l’état invalide.',true); return; }
  if(!peutEnr(u)){ dire(u.d&&u.d.mode==='nonlus'?'Contrats d’honoraires en cours de lecture : réessayez dans un instant.':'Aucune phase partielle à suivre : rien à enregistrer.',true); return; }
  if(sigD(donnees(p))!==sigD(u.d)){ dire('Les contrats d’honoraires viennent d’être lus ou ont changé : l’écran est mis à jour, vérifiez puis enregistrez.',true); rafraichir(u); return; }
  const st={date,eff:copie(u.st.eff),prev:copie(u.st.prev)}, snap=fige(st), G=calcul(u,u.d,st).G;
  const c0=cible(p,date), exist=journal(p).find(x=>x.date===date), nT=enTrop(c0);
  const faire=async()=>{
    if(u.enCours) return;
    const p2=DS.get('project',u.pid)||p, c=cible(p2,date);
    if(c.sig!==c0.sig||sigD(donnees(p2))!==sigD(u.d)){ dire('L’état du '+dfr(date)+' ou les contrats ont changé entre-temps : rien n’est enregistré, l’écran est mis à jour.',true); rafraichir(u); return; }
    u.enCours=true; majBoutons(u);
    let ok=false;
    try{
      let X=null;
      try{ X=operations(u,p2,o,c,st); }catch(e){ console.error(e); dire('✗ Enregistrement impossible : '+(e&&e.message||e),true); }
      if(X){ await DS.commit(X.ops); ok=true; } }
    catch(e){ console.error(e); }   /* message déjà affiché par la base (conflit, session, serveur) ; saisie gardée */
    finally{ u.enCours=false; }
    majBoutons(u);
    if(!ok){ rafraichir(u); return; }
    if(apres) apres();
    u.sel=null; rafraichir(u,{date,snap}); dire('État du '+dfr(date)+' enregistré.'); };
  const nouv='Nouvel état : prévu '+pcE(G.prev)+', effectif '+pcE(G.eff)+' (« '+String(o.nom||'').trim()+' »).';
  const trop=nT?'\nLe journal du projet ne garde qu’une ligne par date : '+(nT>1?nT+' autres enregistrements de cette date sont supprimés.':'un autre enregistrement de cette date est supprimé.'):'';
  const avis=u.d.mode==='nonlus'?'\n\nLes contrats d’honoraires n’ont pas pu être lus : l’avancement de l’ensemble du mandat (lu par le Management) est pondéré par les parts SIA 102 standard, peut-être autrement que par le contrat.':'';
  if(exist) confirmer('Remplacer l’état du '+dfr(date)+' ?\n\nÉtat enregistré : '+descEtat(exist)+'.\n'+nouv+trop+avis,faire,{title:'Remplacer l’état',yesText:'Remplacer'});
  else if(avis) confirmer('Enregistrer l’état du '+dfr(date)+' ?\n\n'+nouv+avis,faire,{title:'Enregistrer l’état',yesText:'Enregistrer'});
  else faire(); }
function supprimer(u,x){ const p=DS.get('project',u.pid)||u.p;
  if(!u.peut||!x||!x.rec||u.enCours||document.querySelector('.ov')) return;
  const c0=cible(p,x.date), nA=c0.R.length, nI=c0.I.length;
  const qui=nA>1?'Les '+nA+' états détaillés de cette date':'Le détail des phases partielles';
  const quoi=nI>1?qui+' et les '+nI+' lignes du journal du projet à cette date (lues par le Management) sont supprimés.'
    :nI?qui+' et la ligne du journal du projet (lue par le Management) sont supprimés.'
    :qui+(nA>1?' sont supprimés':' est supprimé')+' (aucune ligne du journal du projet à cette date).';
  confirmer('Supprimer l’état du '+dfr(x.date)+' ?\n\nAvancement prévu '+pcJ(x.prev)+', effectif '+pcJ(x.eff)+(x.nom?' (« '+x.nom+' »)':'')+'.\n'+quoi,async()=>{
    if(u.enCours) return;
    const p2=DS.get('project',u.pid)||p, c=cible(p2,x.date);
    if(c.sig!==c0.sig||!c.R.length){ dire('L’état du '+dfr(x.date)+' a changé entre-temps : rien n’est supprimé, l’écran est mis à jour.',true); rafraichir(u); return; }
    const ops=c.R.map(r=>({t:T_AV,id:r.ID,val:null,bseq:ver(T_AV,r.ID)})).concat(c.I.map(r=>({t:T_IM,id:r.ID,val:null,bseq:ver(T_IM,r.ID)})));
    u.enCours=true; majBoutons(u);
    let ok=false;
    try{ await DS.commit(ops); ok=true; }
    catch(e){ console.error(e); }
    finally{ u.enCours=false; }
    majBoutons(u);
    if(!ok){ rafraichir(u); return; }
    u.sel=null; rafraichir(u,{dernier:true}); dire('État du '+dfr(x.date)+' supprimé.'); }); }

/* ── écran ── */
/* u.redessin : nos propres redessins (le focus perdu par le remplacement du corps est rendu ensuite, il n'est pas « parti ailleurs ») */
function dessiner(u,foc){ u.redessin=(u.redessin||0)+1; try{ dessiner0(u,foc); } finally{ u.redessin--; } }
function dessiner0(u,foc){
  css();
  const p=u.p, C=u.box, d=u.d, st=u.st, ok=u.peut;
  const K=calcul(u,d,st), G=K.G, J=u.J, MO=modifs(u,st), B=JSON.parse(u.base);
  const nbR=K.L.filter(o=>o.al&&o.al.k==='r'&&!o.al.fin).length, nbF=K.L.filter(o=>o.al&&o.al.fin).length;
  const ec=G.eff-G.prev, ecC=ec<-0.05?'sgav-neg':ec>0.05?'sgav-pos':'';
  const jauge=(v,mk)=>'<div class="sgav-g"><i'+(v>100?' class="dp"':'')+' style="width:'+Math.min(100,Math.max(0,v))+'%"></i>'+(mk!=null?'<b style="left:'+Math.min(100,mk)+'%"></b>':'')+'</div>';
  const redraw=n=>{ dessiner(u,n); };

  /* cadre : en-tête et panneau d'enregistrement gardés d'un dessin à l'autre, seul le corps est redessiné */
  let R=u.R;
  if(!R||R.parentNode!==C){
    R=document.createElement('div'); R.className='sgav'; R._ui={drag:null,tDate:null};
    R.innerHTML=tete(u)+'<div class="sgav-enrp" hidden></div><div class="sgav-corps"></div>';
    C.innerHTML=''; C.appendChild(R); u.R=R; brancherDate(u,R);
    R.addEventListener('focusin',e=>{ u.focEl=e.target; });
    /* focus parti ailleurs (palette ⌘K, recherche, menu, clic hors de l'écran) : oublié. Chrome envoie aussi « focusout » (sans destinataire,
       élément encore relié) quand la page retire l'écran pour le redessiner : focPerdu le garde un instant, ouvrir() le reprend si l'écran
       est rattaché dans la même tâche ; pendant nos redessins (u.redessin) il est gardé */
    R.addEventListener('focusout',e=>{ const to=e.relatedTarget; if(to&&R.contains(to)) return;
      if(u.redessin) return;
      if(!to&&!document.hasFocus()) return;   /* fenêtre quittée : le navigateur rendra le focus lui-même */
      u.focPerdu=to?null:{el:e.target,t:Date.now()}; u.focEl=null; }); }
  const ui=R._ui;
  const inp=R.querySelector('input[data-a="date"]'); if(inp&&document.activeElement!==inp&&inp.value!==st.date) inp.value=st.date;
  const mt=R.querySelector('[data-meta]'); if(mt){ mt.textContent=metaTxt(u); mt.title=d.contrats.map(c=>c.nom+(c.date?' ('+dfr(c.date)+')':'')).join(' · '); }
  const bE=R.querySelector('.sgfh-tete [data-a="enr"]'); if(bE) bE.hidden=!ok;

  const tProp='Avancement global si l’on reprend toutes les propositions des heures (bouton « Reprendre toutes les propositions ») : heures saisies ÷ heures du contrat, par 5 %, au plus 95 %. '
    +'Les phases partielles terminées, aux heures épuisées, à confirmer ou sans heures au contrat gardent leur avancement retenu. '+(K.diff?K.diff+' proposition'+(K.diff>1?'s':'')+' à reprendre.':'Aucune proposition à reprendre.');
  const kp='<div class="nx-kpis sgav-kp">'
    +'<div class="nx-kpi" title="Moyenne des phases partielles comprises, pondérée par leur part SIA du contrat ; repère noir = prévu"><div class="l">Avancement effectif</div><div class="v">'+fmt(G.eff)+'<small>%</small></div>'+jauge(G.eff,G.prev)+'</div>'
    +'<div class="nx-kpi" title="Avancement prévu à la date de l’état (planning)"><div class="l">Avancement prévu</div><div class="v">'+fmt(G.prev)+'<small>%</small></div></div>'
    +'<div class="nx-kpi" title="Effectif − prévu"><div class="l">Écart</div><div class="v '+ecC+'">'+sg(ec)+'<small>pts · '+(ecC==='sgav-neg'?'en retard':ecC?'en avance':'conforme')+'</small></div></div>'
    +'<div class="nx-kpi" title="'+esc(tProp)+'"><div class="l">Proposé par les heures</div><div class="v">'+(K.nProp?fmt(G.prop)+'<small>%</small>':'—')+'</div></div>'
    +'<div class="nx-kpi" title="Heures saisies sur les phases partielles comprises, jusqu’à fin '+moisLib(st.date)+'"><div class="l">Heures saisies</div><div class="v'+(G.conso>100?' sgav-neg':'')+'">'+mil(G.h)+'<small>h / '+mil(G.b)+' h</small></div>'+jauge(G.conso||0)+'</div>'
    +'</div>';
  let rows='';
  const tPh='Avancement de la phase si l’on reprend ses propositions ; les phases partielles sans proposition à reprendre gardent leur avancement retenu';
  K.phases.forEach(P=>{
    rows+='<tr class="sgav-ph"><td><b>'+P.ph.n+'</b>'+esc(P.ph.nom)+'</td>'
      +(P.n?'<td>'+barH(P.conso,true,false)+'</td><td>'+(P.nProp?barP(Math.round(P.prop),{mince:true,titre:tPh}):'<span class="sgav-vide" title="Aucune proposition des heures à reprendre dans cette phase">—</span>')+'</td><td></td><td>'+barR(P.eff,P.prev,null,true)+'</td>'
        :'<td colspan="4"><span class="sgav-nc">non comprise au contrat</span></td>')+'</tr>';
    P.rows.forEach(o=>{ rows+=ligne(o,ok); }); });
  rows+='<tr class="tot"><td><div class="sgav-nm"><span>Ensemble du mandat<em>pondéré par les parts SIA</em></span></div></td>'
    +'<td>'+barH(G.conso,false,false)+'<div class="sgav-sub">'+mil(G.h)+NB+'h / '+mil(G.b)+NB+'h</div></td><td>'+(K.nProp?barP(G.prop,{dec:true,titre:tProp}):'<span class="sgav-vide" title="Aucune proposition des heures à reprendre">—</span>')+'</td>'
    +'<td>'+(ok&&K.diff?'<button class="sgav-rp" data-a="tout" tabindex="-1" title="Reprendre toutes les propositions reprenables">'+SVG_FL+'Tout</button>':'')+'</td>'
    +'<td>'+barR(G.eff,G.prev,null,false)+'<div class="sgav-prv">prévu <b>'+pcD(G.prev)+'</b></div></td></tr>';
  const der=J.filter(x=>x.parts).slice(-1)[0];
  /* parts SIA standard faute de parts au contrat, ou contrats pas encore lus */
  const nC=d.contrats.length;
  const avis=d.mode==='sansparts'?'<p class="sgav-avis">'+(nC>1?'Les contrats reliés n’ont':'Le contrat relié n’a')+' pas de parts SIA pour les phases partielles 31 à 53 (expertise, ancien contrat…) : l’avancement de l’ensemble du mandat est pondéré par les parts SIA 102 standard.</p>'
    :d.mode==='nonlus'?(u.fx==='attente'?'<p class="sgav-avis sgav-at">Contrats d’honoraires en cours de lecture : parts SIA 102 standard provisoires'+(ok?' ; « Enregistrer l’état » sera possible dans un instant.':'.')+'</p>'
      :'<p class="sgav-avis sgav-at">Les contrats d’honoraires n’ont pas pu être lus : parts SIA 102 standard provisoires'+(ok?' ; l’enregistrement demande une confirmation.':'.')+'</p>'):'';
  const tab='<section class="sgav-sec"><div class="sgav-sech"><h3>Phases partielles</h3><span class="n">'
    +(nbR?'<b class="sgav-neg">'+nbR+' risque'+(nbR>1?'s':'')+' de dépassement</b> · ':'')
    +(nbF?'<b class="sgav-neg">'+nbF+' phase'+(nbF>1?'s':'')+' terminée'+(nbF>1?'s':'')+' au-delà des heures</b> · ':'')+'heures saisies jusqu’à fin '+moisLib(st.date)+'</span>'
    +'<div class="act">'+(MO.n||MO.date?'<span class="sgav-modn">'+(MO.n?MO.n+' phase'+(MO.n>1?'s':'')+' modifiée'+(MO.n>1?'s':'')+(MO.date?' · date modifiée':''):'date modifiée')+'</span><button class="nx-btn sm" data-a="annuler" title="Revenir à l’état ouvert du '+dfr(B.date)+'">Annuler les modifications</button>':'')
    +(der&&st.date<der.date?'<button class="nx-btn sm" data-a="ouvrir" data-j="'+esc(der.date)+'" title="Rouvrir l’état enregistré le plus récent">Revenir au dernier état ('+dfr(der.date)+')</button>':'')
    +(ok?'<button class="nx-btn sm" data-a="tout" title="Reprend la proposition des heures pour les phases en cours ; ne touche ni aux phases terminées (100 %), ni aux heures épuisées, ni aux propositions à confirmer"'+(K.diff?'':' disabled')+'>Reprendre toutes les propositions'+(K.diff?' ('+K.diff+')':'')+'</button>':'')+'</div></div>'
    +(ok?'<p class="sgav-aide">Réglez l’avancement retenu en glissant la barre bleue (crans de 5 %), ou reprenez la proposition des heures (« Reprendre »).</p>'
      :'<p class="sgav-aide ro">Lecture seule : votre profil ne permet pas de modifier l’avancement de ce projet.</p>')
    +avis
    +'<table class="sgav-t"><colgroup><col class="c1"><col class="c2"><col class="c3"><col class="c4"><col class="c5"></colgroup>'
    +'<thead><tr><th>Phase partielle</th><th>Heures consommées<span>saisies ÷ heures du contrat</span></th><th>Avancement proposé<span>d’après les heures, par 5 %</span></th><th></th><th>Avancement retenu<span>'+(ok?'glisser la barre bleue · flèches ← →':'état à la date')+'</span></th></tr></thead>'
    +'<tbody>'+rows+'</tbody></table>'
    +'<div class="sgav-leg"><span><i class="h"></i>Heures consommées</span><span><i class="hd"></i>Au-delà des heures du contrat</span><span><i class="p"></i>Proposé (au plus 95 % ; heures épuisées : à juger)</span>'
    +'<span><i class="r"></i>Avancement retenu</span>'+(ok?'<span><i class="pg"></i>Poignée à glisser</span>':'')+'<span><i class="pv"></i>Prévu</span><span><i class="pp"></i>Proposé</span>'
    +(ok?'<span class="k"><span class="kc">Barre retenue : glisser la poignée ou cliquer (crans de 5 %)</span> · <span class="kc"><kbd>←</kbd><kbd>→</kbd> −5 / +5 %</span> · <span class="kc"><kbd>Début</kbd><kbd>Fin</kbd> 0 / 100 %</span> · '
      +'<span class="kc"><kbd>P</kbd> reprendre la proposition</span> · <span class="kc"><kbd>Tab</kbd> phase suivante</span> · <span class="kc">clic sur la barre hachurée = reprendre</span></span>':'')+'</div></section>';

  /* journal des états : une ligne par date ; l'état en cours remplace la ligne enregistrée du même jour */
  const exist=J.find(x=>x.date===st.date), egal=!!(exist&&memes(d,exist.parts,st));
  const tag=!exist?'à enregistrer':egal?'enregistré':'modifié';
  const tagT=tag==='enregistré'?'Identique à l’état enregistré à cette date':tag==='modifié'?'« Enregistrer l’état » remplacera l’état enregistré à cette date : '+descEtat(exist):'Aucun état enregistré à cette date';
  const rempl=ok&&exist&&!egal?'<div class="sgav-rempl"><b>Remplacer l’état du '+dfr(st.date)+'</b><span>Un état est déjà enregistré à cette date : '+esc(descEtat(exist))
    +'. « Enregistrer l’état » le remplacera'+((exist.lignes||[]).length>1||(exist.dups||[]).length?' par une seule ligne':'')+'.</span>'+(exist.parts?'<button class="nx-btn sm" data-a="ouvrir" data-j="'+esc(exist.date)+'" title="Reprend l’état enregistré à cette date dans le tableau (les modifications en cours sont abandonnées)">Rouvrir l’état du '+dfr(exist.date)+'</button>':'')+'</div>':'';
  const hpc=date=>G.b>0?pcE(cumA(u,d,date)/G.b*100):'—';
  const ecJ=(e,pv)=>{ if(e==null||pv==null) return '—'; const v=Math.round(e)-Math.round(pv); return '<span class="'+(v<0?'sgav-neg':v>0?'sgav-pos':'')+'">'+sgE(v)+'</span>'; };
  let jr='<tr class="cur'+(u.sel==null?' sel':'')+'" data-j="live"><td><div class="sgav-jd">'+dfr(st.date)+'<span class="sgav-tag'+(tag==='enregistré'?' ok':'')+'" title="'+esc(tagT)+'">'+tag+'</span></div><div class="sgav-jn">'+esc(exist&&exist.nom?exist.nom:'état en cours')+'</div></td>'
    +'<td class="r">'+pcE(G.prev)+'</td><td class="r">'+pcE(G.eff)+'</td><td class="r">'+ecJ(G.eff,G.prev)+'</td><td class="r">'+(G.conso==null?'—':pcE(G.conso))+'</td><td></td></tr>';
  J.filter(x=>x.date!==st.date).reverse().forEach(x=>{
    jr+='<tr class="'+(u.sel===x.date?'sel':'')+'" data-j="'+esc(x.date)+'"><td><div class="sgav-jd">'+dfr(x.date)+'</div>'+(x.nom?'<div class="sgav-jn">'+esc(x.nom)+'</div>':'')+'</td>'
      +'<td class="r">'+pcJ(x.prev)+'</td><td class="r">'+pcJ(x.eff)+'</td><td class="r">'+ecJ(x.eff,x.prev)+'</td><td class="r">'+hpc(x.date)+'</td>'
      +'<td class="r">'+(x.parts?'<button class="sgav-rp" data-a="ouvrir" data-j="'+esc(x.date)+'" tabindex="-1" title="'+(ok?'Rouvrir cet état (date et détail des phases) pour le modifier':'Afficher cet état (date et détail des phases) dans le tableau')+'">'+(ok?'Rouvrir':'Afficher')+'</button>'
        :'<span class="sgav-old" title="'+(x.base?'Ancien journal du projet':'État enregistré')+' : valeurs de l’ensemble du mandat seulement, sans détail par phase. Cliquer sur la ligne pour le consulter.">global</span>')+'</td></tr>'; });
  const vu=u.sel?J.find(x=>x.date===u.sel):null;
  const nJ=J.length;
  const bas='<div class="sgav-bas"><section class="sgav-sec"><div class="sgav-sech"><h3>Historique</h3><span class="n">heures consommées et avancement de l’ensemble du mandat</span></div>'
    +'<div class="sgav-gr" data-gr></div><div class="sgav-lec"></div>'
    +'<div class="sgav-leg"><span><i class="lh"></i>Heures consommées (cumul ÷ heures du contrat)</span><span><i class="le"></i>Avancement effectif</span><span><i class="lp"></i>Avancement prévu</span>'
    +'<span><i class="lz"></i>Heures en avance sur l’avancement</span><span><i class="ll"></i>État en cours</span></div></section>'
    +'<section class="sgav-sec"><div class="sgav-sech"><h3>Journal des états</h3><span class="n">'+(nJ?nJ+' état'+(nJ>1?'s':'')+' enregistré'+(nJ>1?'s':''):'aucun état enregistré')+'</span></div>'
    +'<table class="sgav-j"><thead><tr><th>Date</th><th class="r">Prévu</th><th class="r">Effectif</th><th class="r">Écart</th><th class="r">Heures</th><th></th></tr></thead><tbody>'+jr+'</tbody></table>'
    +(vu?consulter(u,d,vu):'')
    +'<p class="sgav-note">« Enregistrer l’état » ajoute au journal du projet une ligne datée (ou remplace celle de la même date) : désignation, avancement prévu et effectif de l’ensemble du mandat en % entiers '
    +'— ceux que lit le Management —, utilisateur et remarque, avec le détail des phases partielles et la proposition des heures à cette date. '
    +'Les lignes « global » (ancien journal) n’ont que les valeurs de l’ensemble du mandat : un clic les affiche, en lecture seule. '
    +'Un clic sur une ligne la repère aussi sur la courbe.</p></section></div>';

  const corps=R.querySelector('.sgav-corps'), sy=C.scrollTop;
  corps.innerHTML=rempl+kp+tab+bas;
  C.scrollTop=sy;
  u.dessineAt=Date.now();

  /* courbe : dessinée à la largeur réelle */
  const box=R.querySelector('[data-gr]'), W=Math.max(420,Math.round(box.clientWidth||0)||700);
  const GR=graphe(u,d,st,G,W); box.innerHTML=GR.svg;
  const lec=R.querySelector('.sgav-lec'); lec.innerHTML=lecture(GR.g,null,st,G);
  const sv=box.querySelector('svg'), hv=sv.querySelector('.hv');
  const tDe=e=>{ const rc=sv.getBoundingClientRect(), g=GR.g, x=(e.clientX-rc.left)*g.W/(rc.width||g.W); return {x,t:g.t0+(x-g.ml)/(g.W-g.ml-g.mr)*(g.t1-g.t0)}; };
  sv.onpointermove=e=>{ const q=tDe(e), g=GR.g; if(q.t<g.t0||q.t>g.t1){ hv.setAttribute('visibility','hidden'); lec.innerHTML=lecture(g,null,st,G); return; }
    hv.setAttribute('x1',q.x.toFixed(1)); hv.setAttribute('x2',q.x.toFixed(1)); hv.setAttribute('visibility','visible'); lec.innerHTML=lecture(g,q.t,st,G); };
  sv.onpointerleave=()=>{ hv.setAttribute('visibility','hidden'); lec.innerHTML=lecture(GR.g,null,st,G); };
  sv.onclick=e=>{ const q=tDe(e), g=GR.g; let best=null, bd=16; g.pts.forEach(o=>{ const dd=Math.abs(g.X(o.t)-q.x); if(dd<bd){ bd=dd; best=o; } });
    if(best){ u.sel=best.live?null:best.date; redraw(); } };

  /* panneau d'enregistrement : désignation (proposée d'office, obligatoire) et remarque facultative */
  const PE=R.querySelector('.sgav-enrp');
  if(!ok&&!PE.hidden){ PE.hidden=true; PE.innerHTML=''; }
  const infoEnr=()=>{ if(PE.hidden) return; const fi=PE.querySelector('[data-fi]'); if(!fi) return;
    fi.innerHTML='Ligne du <b>'+dfr(st.date)+'</b> au journal : avancement prévu <b>'+pcE(G.prev)+'</b> et effectif <b>'+pcE(G.eff)+'</b> de l’ensemble du mandat (% entiers, lus par le Management), '
      +'détail des '+comprises(d).length+' phases partielles'+(moi()?', utilisateur '+esc(nomU(moi())):'')+'.'
      +(exist?' <b>Remplace</b> l’état enregistré à cette date ('+esc(descEtat(exist))+').':'')
      +(d.mode==='nonlus'?' <b>Contrats non lus</b> : parts SIA standard provisoires.':''); };
  const fermerEnr=()=>{ PE.hidden=true; PE.innerHTML=''; };
  const ouvrirEnr=()=>{ if(!ok) return;
    if(PE.hidden){
      PE.innerHTML='<label class="sgav-f"><span>Désignation</span><input data-f="nom" maxlength="64" value="'+esc(exist&&exist.nom?exist.nom:designation(d,st.eff))+'"></label>'
        +'<label class="sgav-f"><span>Remarque <i>(facultative)</i></span><textarea data-f="rem" rows="1" maxlength="1024">'+esc(exist&&exist.remE?exist.remE:'')+'</textarea></label>'
        +'<div class="sgav-fb"><button class="nx-btn pri" data-a="enrok">Enregistrer</button><button class="nx-btn" data-a="enrno">Annuler</button></div><div class="sgav-fi" data-fi></div>';
      PE.hidden=false; infoEnr(); majBoutons(u); }
    const i=PE.querySelector('[data-f="nom"]'); if(i){ i.focus(); i.select(); } };
  const enregistrer=()=>{ if(!ok) return; const i=PE.querySelector('[data-f="nom"]'), r=PE.querySelector('[data-f="rem"]'), nom=i?i.value.trim():'';
    if(!nom){ if(i){ i.classList.add('inv'); i.focus(); } dire('La désignation est obligatoire.'); return; }
    sauver(u,{nom,rem:r?r.value.trim():''},()=>{ if(u.R===R) fermerEnr(); }); };
  infoEnr();

  /* glisser : la piste de la phase est relue à chaque mouvement (un redessin a pu la remplacer) ; piste absente ou sans largeur → mouvement
     ignoré (jamais 100 % d'office) ; fin du glisser sur la fenêtre (bouton relâché, annulé, bouton plus enfoncé, fenêtre quittée) */
  const majDrag=e=>{ const D=ui.drag; if(!D) return;
    if(u.R!==R||!R.isConnected){ D.fin(false); return; }
    const s=R.querySelector('[data-sl="'+D.n+'"]'), tr=s&&s.querySelector('.sgav-slt'); if(!tr||!tr.isConnected) return;
    const r=tr.getBoundingClientRect(); if(!(r.width>0)) return;
    const v=cran((e.clientX-r.left)/r.width*100);
    if(borne(u.st.eff[D.n])===v) return; u.st.eff[D.n]=v;
    tr.querySelector('.f').style.width=v+'%'; const pg=tr.querySelector('.pg'); if(pg) pg.style.left=v+'%';
    s.setAttribute('aria-valuenow',v); s.setAttribute('aria-valuetext',v+' %');
    const lb=R.querySelector('[data-v="'+D.n+'"]'); if(lb) lb.textContent=v+NB+'%'; };
  R.onpointerdown=e=>{ const s=e.target.closest&&e.target.closest('.sgav-sl'); if(!s||e.button!==0||!u.peut) return;
    e.preventDefault(); s.focus({preventScroll:true});
    if(ui.drag) ui.drag.fin(false);
    const D={n:s.dataset.sl,pid:e.pointerId,t0:Date.now()};
    const mv=ev=>{ if(ev.pointerId!==D.pid) return; if(ev.buttons!=null&&!(ev.buttons&1)){ fin(true); return; } majDrag(ev); };
    const up=ev=>{ if(ev.pointerId===D.pid) fin(true); };
    const bl=()=>fin(true);
    const fin=re=>{ window.removeEventListener('pointermove',mv,true); window.removeEventListener('pointerup',up,true); window.removeEventListener('pointercancel',up,true); window.removeEventListener('blur',bl);
      if(ui.drag!==D) return; ui.drag=null;
      if(re&&u.R===R&&R.isConnected){ if(u.rafT) rafraichir(u,{foc:D.n}); else redraw(D.n); } };   /* redessin mis en attente pendant le glisser : fait maintenant */
    D.fin=fin; ui.drag=D;
    window.addEventListener('pointermove',mv,true); window.addEventListener('pointerup',up,true); window.addEventListener('pointercancel',up,true); window.addEventListener('blur',bl);
    try{ s.setPointerCapture(e.pointerId); }catch(_){} majDrag(e); };
  R.onpointermove=R.onpointerup=R.onpointercancel=null;
  R.oninput=e=>{ if(e.target&&e.target.dataset&&e.target.dataset.f==='nom') e.target.classList.remove('inv'); };
  R.onkeydown=e=>{
    const f=e.target.closest&&e.target.closest('.sgav-enrp');
    if(f){ if(e.key==='Escape'){ e.preventDefault(); fermerEnr(); const b=R.querySelector('[data-a="enr"]'); if(b) b.focus(); }
      else if(e.key==='Enter'&&(e.target.dataset.f==='nom'||e.metaKey||e.ctrlKey)){ e.preventDefault(); enregistrer(); }
      return; }
    const s=e.target.closest&&e.target.closest('.sgav-sl'); if(!s||!u.peut||e.altKey||e.metaKey||e.ctrlKey) return;
    const n=s.dataset.sl, v=borne(u.st.eff[n]); let w=null;
    if(e.key==='ArrowRight'||e.key==='ArrowUp') w=pas(v,1);
    else if(e.key==='ArrowLeft'||e.key==='ArrowDown') w=pas(v,-1);
    else if(e.key==='Home') w=0; else if(e.key==='End') w=100;
    else if(e.key==='p'||e.key==='P'){ const o=K.L.find(o=>String(o.x.n)===String(n)); if(o&&o.ok) w=o.pr; }
    if(w==null) return; e.preventDefault(); e.stopPropagation();
    if(w!==v){ u.st.eff[n]=w; redraw(n); } };
  R.onclick=e=>{ const b=e.target.closest&&e.target.closest('[data-a]');
    if(b&&R.contains(b)&&b.tagName!=='INPUT'){ const a=b.dataset.a, n=b.dataset.n, S=u.st;
      if(a==='enr'){ ouvrirEnr(); return; }
      if(a==='enrok'){ enregistrer(); return; }
      if(a==='enrno'){ fermerEnr(); return; }
      if(a==='rp'){ if(!ok) return; const o=K.L.find(o=>String(o.x.n)===String(n)); if(o&&o.ok){ S.eff[o.x.n]=o.pr; redraw(String(o.x.n)); } return; }
      if(a==='tout'){ if(!ok) return; let k=0; K.tout.forEach(o=>{ S.eff[o.x.n]=o.pr; k++; });
        if(k){ redraw(); dire(k+' phase'+(k>1?'s':'')+' reprise'+(k>1?'s':'')+' d’après les heures — « Annuler les modifications » pour revenir.'); } return; }
      if(a==='st'||a==='pv'){ if(!ok) return; const tg=a==='st'?S.eff:S.prev, v=borne(tg[n]), w=pas(v,+b.dataset.d); if(w!==v){ tg[n]=w; redraw(a==='st'?n:null); } return; }
      if(a==='annuler'){ clearTimeout(ui.tDate); ui.tDate=null; S.date=B.date; S.eff=copie(B.eff); S.prev=copie(B.prev); if(inp) inp.value=S.date; u.sel=null; redraw(); return; }
      if(a==='ouvrir'){ const x=J.find(o=>o.date===b.dataset.j); if(!x||!x.parts) return; const perdu=MO.n||MO.date;
        clearTimeout(ui.tDate); ui.tDate=null; u.st={date:x.date,eff:copie(x.parts.eff),prev:copie(x.parts.prev)}; if(inp) inp.value=x.date; u.base=fige(u.st); u.sel=null; redraw();
        dire('État du '+dfr(x.date)+(ok?' rouvert':' affiché')+(perdu?' (modifications non enregistrées abandonnées)':'')+(ok?' : modifiez-le puis « Enregistrer l’état ».':'.')); return; }
      if(a==='suppr'){ const x=J.find(o=>o.date===b.dataset.j); if(x) supprimer(u,x); return; }
      if(a==='fermer'){ u.sel=null; redraw(); return; }
      return; }
    const j=e.target.closest&&e.target.closest('tr[data-j]'); if(j){ u.sel=j.dataset.j==='live'?null:j.dataset.j; redraw(); return; }
    const nm=e.target.closest&&e.target.closest('tr.pt[data-n] td:first-child'); if(nm){ const s=R.querySelector('[data-sl="'+nm.parentNode.dataset.n+'"]'); if(s) s.focus({preventScroll:true}); } };

  if(foc!=null){ const s=R.querySelector('[data-sl="'+foc+'"]'); if(s) s.focus({preventScroll:true}); }
  majBoutons(u);
}

/* ── chargement depuis la base ── */
/* o.date : ouvrir l'état de cette date (après un enregistrement ; o.snap = état enregistré : modifié depuis pendant l'écriture → la saisie est
   gardée, seule la référence « état ouvert » est mise à jour) ; o.dernier : après une suppression, retour au dernier état enregistré si l'état
   ouvert n'est pas modifié ; sinon : état en cours gardé s'il est modifié, sinon relu (même date) */
function charger(u,p,o){ o=o||{};
  u.p=p; u.peut=peut(p); u.argent=montants(); u.d=donnees(p); u.H=heures(p,u.d); u.J=journal(p);
  if(o.dernier&&u.st&&!modifie(u)) u.st=null;
  if(o.date){ const s=etatA(u,o.date), garder=!!(o.snap&&u.st&&fige(u.st)!==o.snap);
    if(!garder){ u.st=s; u.base=fige(s); }
    else if(u.base&&JSON.parse(u.base).date===o.date) u.base=fige(s); }
  else if(!u.st||!modifie(u)){ u.st=etatA(u,u.st?u.st.date:null); u.base=fige(u.st); }
  if(u.sel&&!u.J.some(x=>x.date===u.sel)) u.sel=null;
  u.chargeAt=Date.now(); }
/* redessin depuis la base ; pendant un glisser il est mis en attente (options réunies) et fait à la fin du glisser, au plus tard après 60 s ;
   o.foc : curseur à focaliser, o.refocus : rendre le focus perdu par le redessin */
function rafraichir(u,o){ if(!u) return;
  o=Object.assign({},u.rafO||{},o||{}); u.rafO=null; clearTimeout(u.rafT); u.rafT=null;
  const ui=u.R&&u.R._ui;
  if(ui&&ui.drag){
    if(u.R.isConnected&&Date.now()-(ui.drag.t0||0)<60000){ u.rafO=o; u.rafT=setTimeout(()=>{ u.rafT=null; rafraichir(u); },300); return; }
    ui.drag.fin(false); }
  if(!u.box||!u.box.isConnected) return;
  const p=DS.get('project',u.pid); if(!p) return;
  try{ charger(u,p,o); dessiner(u,o.foc!=null?o.foc:null); if(o.refocus) refocus(u); }
  catch(e){ console.error(e); u.R=null; u.box.innerHTML='<p class="sgav-err">Avancement des prestations : erreur — '+esc(String(e&&e.message||e))+'</p>'; } }
/* rend le focus au même élément (curseur de la même phase s'il a été redessiné) — seulement s'il a été perdu par le redessin : personne
   d'autre ne l'a (palette ⌘K, recherche, menu, fenêtre…) */
function refocus(u){ let el=u.focEl; if(!el||!u.box||!u.box.isConnected) return;
  const a=document.activeElement;
  if(a&&a!==document.body&&a!==document.documentElement) return;
  if(document.querySelector('.ov')) return;
  if(!el.isConnected&&el.dataset&&el.dataset.sl&&u.R) el=u.R.querySelector('[data-sl="'+el.dataset.sl+'"]');
  if(!el||!el.isConnected||!u.box.contains(el)) return;
  try{ el.focus({preventScroll:true}); }catch(_){} }

/* prêt : collections chargées (une fois) et cadre Facturation (contrats, parts SIA ; au plus 10 s, sinon parts standard provisoires et
   enregistrement désactivé, puis redessin quand le cadre répond) ; fx : « ok », « echec » ou « attente » */
let NEED=null;
function preparer(){
  if(!NEED) NEED=Promise.resolve().then(()=>typeof DS.need==='function'?DS.need([T_AV,T_IM]):null).catch(e=>console.error(e));
  const fx=Promise.resolve().then(()=>typeof fxEnsure==='function'?fxEnsure():null).then(()=>true,()=>false);
  const delai=new Promise(r=>setTimeout(()=>r('delai'),10000));
  return Promise.all([NEED,Promise.race([fx,delai])]).then(([,x])=>({fx:x==='delai'?'attente':x?'ok':'echec',tard:x==='delai'?fx:null})); }

const E={};
function ouvrir(C,p){ css();
  const pid=String(p.ID); let u=E[pid];
  if(!u) u=E[pid]={pid,st:null,base:null,sel:null,box:null,C:null,R:null,sy:0,focEl:null,fx:'attente',enCours:false,rafO:null,rafT:null};
  u.p=p;
  /* même conteneur vidé (ou gardé) par le redessin de la page quand la base change : l'écran est repris tel quel puis relu */
  const reprise=!!(u.box&&u.C===C&&(!u.box.isConnected||u.box.parentNode===C)), detache=!!(u.box&&!u.box.isConnected);
  /* écran retiré puis rattaché par le redessin de la page (même tâche) : le focus perdu au retrait est à rendre */
  if(reprise&&detache&&u.focPerdu&&Date.now()-u.focPerdu.t<250) u.focEl=u.focPerdu.el;
  u.focPerdu=null;
  if(!reprise){
    if(u.R&&u.R._ui&&u.R._ui.drag) u.R._ui.drag.fin(false);
    if(u.st&&!modifie(u)){ u.st=null; u.base=null; }   /* ouverture : dernier état enregistré (une saisie non enregistrée est gardée) */
    u.sel=null; u.R=null; u.focEl=null; u.sy=0; u.C=C;
    const box=document.createElement('div'); box.className='sgav-box'; u.box=box;
    box.addEventListener('scroll',()=>{ if(box.isConnected) u.sy=box.scrollTop; },{passive:true});
    box.innerHTML='<div class="sgav-charge">Chargement de l’avancement des prestations…</div>'; }
  C.append(u.box); if(reprise&&u.sy) u.box.scrollTop=u.sy;
  SGAV.cur=u;
  preparer().then(r=>{
    u.fx=r.fx;
    if(SGAV.cur!==u||!u.box.isConnected) return;
    rafraichir(u,{refocus:reprise});   /* glisser en cours : attendu (rafraichir) */
    if(r.tard) r.tard.then(okFx=>{ u.fx=okFx?'ok':'echec'; if(SGAV.cur===u&&u.box.isConnected) rafraichir(u); }); }); }

/* remplacement de l'écran du moteur ; Archives ▸ Honoraires (ancien) garde l'écran d'origine */
const im0=imDomain;
imDomain=function(C,top,pane,p){
  let vid=''; try{ vid=typeof VIEW!=='undefined'&&VIEW?String(VIEW.id||''):''; }catch(_){}
  if(vid==='anc-avancement'||!p) return im0.apply(this,arguments);
  try{ ouvrir(C,p); }
  catch(e){ console.error(e); const d=document.createElement('p'); d.className='sgav-err'; d.textContent='Avancement des prestations : erreur — '+String(e&&e.message||e); C.append(d); } };

/* base modifiée (autre poste, autre écran) : redessin sur place, sauf si la page l'a déjà fait (vue du projet) ; saisie en cours gardée */
if(typeof DS==='object'&&DS&&typeof DS.on==='function') DS.on(ts=>{ const u=SGAV.cur; if(!u||!u.box||!u.box.isConnected) return;
  if(!(ts||[]).some(t=>SURV.includes(t))) return;
  const t0=Date.now();
  const essai=k=>setTimeout(()=>{ if(SGAV.cur!==u||!u.box.isConnected||(u.chargeAt||0)>=t0) return;
    if(document.querySelector('.ov')){ if(k<120) essai(k+1); return; }   /* fenêtre ouverte : la page redessine à sa fermeture */
    rafraichir(u,{refocus:true}); },k?500:80);   /* glisser en cours : redessin à la fin du glisser (rafraichir) */
  essai(0); });

const SGAV=window.SGAV={version:'30.10.2026',E,cur:null,im0,donnees,calcul,journal,global,
  rafraichir:()=>{ if(SGAV.cur) rafraichir(SGAV.cur); }};
})();

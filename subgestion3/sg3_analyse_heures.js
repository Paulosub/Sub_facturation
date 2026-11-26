/* ═══ 55. Heures ▸ Analyse des heures et ses quatre modules (15.11.2026, concaténé en dernier) ═══
   Demande de Paulo : « faire 5 propositions d'adaptation de l'analyse des heures, ainsi que les 4 modules dans la fenêtre, adapte le tout pour correspondre au reste de
   l'app ; je souhaite pouvoir dès sélection d'une version l'intégrer dans Heures », « sous forme de modules » ; proposition 1 « Modules au menu » choisie sur maquette
   (cinq organisations : subgestion3/_backup_20261115_maquette_analyse_heures/). Départ : Archives ▸ Suivi & écarts (liste des affaires + quatre tuiles qui ouvrent des
   fenêtres) et ses quatre entrées recopiées dans Administration (adm-ctl-heures, adm-ana-heures, adm-ctl-frais, adm-ana-frais : retirées, go les renvoie ici).
   Cinq pages pleines du chapitre Heures (entrées du menu dans SG_DOM, sg3.js ; droits dans SG_VUE_DROIT, sg3_plus.js) :
     nx-ah / nx-af  Analyse des heures (chapitre Heures) / Analyse des frais (chapitre Notes de frais, 25.11.2026) : bandeau des listes (sgTete), chiffres de la
                  période, affaires actives ; un clic sur une affaire = même écran, arg = identifiant de
                  l'affaire : page « Analyse des heures » de cette affaire (bandeau, chiffres de la période, les quatre modules en tuiles ; 25.11.2026)
     nx-ah-ctlh   Contrôle des heures d'affaires : colonne des affaires | semaine de l'affaire en grille collaborateurs × jours, inscriptions, approuver / refuser / réinitialiser
     nx-ah-anah   Critères d'analyse des heures : six listes de critères (ouvrage, groupe d'activités, activité, phase, phase partielle, collaborateur), période,
                  Facturable / Facturé, détail ou regroupement, fonctions, documents et rapports du moteur
     nx-ah-ctlf   Contrôle des frais : notes de frais de l'affaire, par mois ou par année (choix Mois · Année, 16.11.2026) ;  nx-ah-anaf  Critères d'analyse des frais (mêmes outils, genres de frais)
   Paramètre des quatre modules = identifiant de l'affaire (go('nx-ah-ctlh', id) ; rouvert au démarrage). Réglages par poste : sg3_ah {mode, etat}.
   Écritures (un seul DS.commit par geste, redessin sur place) : état des inscriptions (TIMELOGSTATECODE) et des notes de frais (PROJECTCOSTSTATECODE) — 0 saisi,
   1 refusé, 3 approuvé — comme sgcFenetre et ctlCostCheck : ✓ et ! sur chaque ligne (second clic = réinitialiser), sélection par cases (Maj + clic = plage) puis
   Approuver / Refuser / Réinitialiser, « Approuver la semaine » / « le mois » et « Approuver » d'un collaborateur après confirmation (sgConfirm). EN PLUS (choix de
   l'intégration : ces deux fenêtres ne le contrôlent pas) : une inscription en période bloquée (« saisie bloquée jusqu'au … » du collaborateur, règle de hsFrozen)
   n'est jamais approuvée, refusée ni réinitialisée ici — étiquette « bloquée », boutons grisés, comptée à part. Statut Facturable / Facturé et commentaire : fenêtres
   du moteur (ctlFlag sans le transfert vers les factures de l'ancien logiciel, ctlComment) ; double-clic = modifier (hsEdit, editCost) ; documents et rapports :
   ctlPrint, ctlReport, ctlSummary, ctlStaffReport du moteur (papier des contrats par le bloc 31, fenêtre de document du moteur) ; copie et CSV : copyTable /
   csvTable du moteur, sur TOUTES les positions des critères (le tableau n'en montre que 1'000). Colonnes des documents = celles de la fenêtre d'analyse du moteur,
   avec Oui / Non à la place des signes ✔ ✕ (absents de la police des documents) et sans les colonnes vides sur toutes les lignes.
   Droits = ceux du Controlling : jamais le profil collaborateur ; heures (ou notes de frais) « de ses projets » au moins ; périmètre = sgProjetsVisibles() sauf
   « toutes les heures » / « tous les frais » et l'administrateur (appliqué aux listes, aux chiffres et aux écritures) ; contrôle et modification seulement avec le
   droit d'origine (ctlCan : projectTime, projectCosts) — sinon lecture seule (ni cases, ni boutons, ni double-clic) ; coût de revient et document d'analyse des
   collaborateurs seulement si sgTauxVisibles(). Pas de colonne Honoraires, pas de « tout approuver jusqu'au … » (questions restées sans réponse le 15.11.2026).
   Chapitre Heures : pas protégé par le code d'accès (comme la Feuille d'heures).
   Styles <style id="sgah-css">, classes sgah-*. Débogage : window.SGAH. ═══ */
(function(){
if(typeof go!=='function'||typeof VIEWS==='undefined'||typeof NX_VIEW==='undefined'||typeof nxPage!=='function'||typeof DS==='undefined'||typeof sgDroit!=='function') return;
const VE='nx-ah', VF='nx-af', VC='nx-ahc', VM={ctlh:'nx-ah-ctlh',anah:'nx-ah-anah',ctlf:'nx-ah-ctlf',anaf:'nx-ah-anaf'}, DOM={ctlh:'h',anah:'h',ctlf:'f',anaf:'f'};
const REDIR={'adm-ctl-heures':VM.ctlh,'adm-ana-heures':VM.anah,'adm-ctl-frais':VM.ctlf,'adm-ana-frais':VM.anaf};
const CSS=`
.sgah{container-type:inline-size;padding-bottom:40px}
.sgah .sgfh-tete{margin:0}.sgah .sgfh-ini{white-space:nowrap}
.sgah-hact{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.sg-tete .sgfh-tete>.sgah-hact{margin-left:auto;padding-left:16px;flex:none}
.sgah-kp{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);margin:0 0 4px;border-top:0}
.sgah-kp .nx-kpi{padding:12px 12px 12px 0;margin-right:12px;min-width:0}
.sgah-kp .nx-kpi .v{font-size:clamp(14px,calc(2.3cqi - 2px),24px);white-space:nowrap;margin-top:6px}
.sgah-kp .nx-kpi .l,.sgah-kp .nx-kpi .s{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgah-kp .v.neg{color:var(--s-rouge)}.sgah-kp .v.pos{color:#4E6B0F}.sgah-kp .v small{font-size:11.5px}
.sgah-bar{display:flex;align-items:center;gap:2px;flex-wrap:wrap;min-height:40px;padding:6px 0;margin:0}
.sgah-bar2{min-height:32px;padding:0 0 8px}
.sgah-bar2>.sgah-gl:first-child{margin-left:0}
.sgah-b{border:0;background:none;font:inherit;font-size:12.5px;font-weight:700;color:var(--s-noir);height:32px;padding:0 9px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.sgah-bar>.sgah-b:first-child{padding-left:0}
.sgah-b:hover{background:var(--s-jaune3)}.sgah-b.on{box-shadow:inset 0 -2px 0 var(--s-nuit)}
.sgah-b svg{width:15px;height:15px}
.sgah-b:disabled{color:#b9b9b6;cursor:default;background:none}
.sgah-b.rg{color:var(--s-rouge)}.sgah-b.rg:disabled{color:#b9b9b6}
.sgah-sep{flex:none;width:1px;height:18px;background:var(--s-filet);margin:0 6px}
.sgah-dr{margin-left:auto;display:inline-flex;align-items:center;gap:2px;flex-wrap:wrap;justify-content:flex-end}
.sgah-lbl{font-size:12.5px;font-weight:700;min-width:118px;text-align:center;white-space:nowrap}
.sgah-gl{font-size:12px;color:var(--s-gris);margin:0 4px 0 6px;white-space:nowrap}
.sgah-t{font-size:13px;font-weight:700;margin:22px 0 8px;padding-bottom:5px;border-bottom:2px solid var(--s-noir);display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}
.sgah-t small{font-size:12px;font-weight:400;color:var(--s-gris)}
.sgah-t .sgah-b{height:24px}
.sgah-par{display:flex;align-items:baseline;gap:2px;flex-wrap:wrap}.sgah-par .sgah-b{font-size:13px}.sgah-par .sgah-b:first-child{padding-left:0}
.sgah-par .sgah-gl{margin-left:10px}
.sgah-tr{display:flex;align-items:baseline;gap:12px}.sgah-tr .sgah-b{font-weight:400;font-size:12px;color:var(--s-gris)}.sgah-tr .sgah-b:hover{color:var(--s-noir)}
.sgah-tb tr.sgah-cg td{background:var(--s-nuit3);font-weight:700;cursor:pointer;vertical-align:middle}
.sgah-tb tr.sgah-cg:hover td{background:var(--s-jaune3)}
.sgah-cgn{display:flex;align-items:center;gap:8px;min-width:0}
.sgah-cgn small{font-weight:400;font-size:12px;color:var(--s-gris)}
.sgah-cv{display:inline-grid;place-items:center;width:14px;height:14px;flex:none}.sgah-cv svg{width:12px;height:12px;transform:rotate(90deg);transition:transform .12s}
.sgah-tb tr.sgah-cg.pl .sgah-cv svg{transform:none}
.sgah-b.sgah-cnf{height:22px;margin-left:auto;font-size:11.5px;font-weight:700;color:var(--s-nuit);padding:0 6px}
.sgah-tb tr.sgah-ca td:first-child{padding-left:30px}
.sgah-tb tr.sgah-ca.ferme{display:none}
.sgah-note{font-size:12px;color:var(--s-gris);margin:8px 0}
.sgah-vide{padding:26px 4px;color:var(--s-gris);font-size:12.5px}
.sgah-m{min-width:0}
.sgah-x{max-width:100%}
.sgah-bar2{margin-top:18px}
.sgah-bar2 .sgah-dr .sgah-b{padding:0 6px}.sgah-emb .sgah-bar2 .sgah-lbl{min-width:0;padding:0 10px}.sgah-bar2 .sgah-dr .sgah-b svg{width:14px;height:14px}
.sgah-xs{max-height:300px;overflow:auto;border-bottom:2px solid var(--s-noir)}.sgah-xs thead th{position:sticky;top:0;z-index:1;background:#fff}
.sgah-tb tbody tr.on td{background:var(--s-jaune2)}.sgah-tb tbody tr.on td:first-child{box-shadow:inset 3px 0 0 var(--s-nuit)}
@container (max-width:1150px){.sgah-x{overflow-x:auto}}
.sgah-tb{border-top:2px solid var(--s-noir)}
.sgah-tb th{font-size:11px;color:var(--s-gris);white-space:nowrap;border-bottom:1px solid var(--s-noir)}
.sgah-tb td{vertical-align:top;height:20px}
.sgah-tb tr.clic{cursor:pointer}
.sgah-tb tbody tr[data-id]:hover td,.sgah-tb tr.clic:hover td{background:var(--s-jaune3)}
.sgah-tb tr.on td{background:var(--s-jaune2)}
.sgah-tb tr.tot td{font-weight:700;border-top:2px solid var(--s-noir);border-bottom:0}
.sgah-tb td.nw,.sgah-tb th.nw{white-space:nowrap}
.sgah-tb td.gr{color:var(--s-gris)}
.sgah-tb td.com{color:var(--s-gris);max-width:340px}
.sgah-tb .ck{width:22px}
.sgah-tb input[type=checkbox]{accent-color:var(--s-nuit);width:14px;height:14px;margin:0;vertical-align:-2px}
.sgah-tb .blo{font-size:10.5px;font-weight:700;color:var(--s-gris);border:1px solid var(--s-gris3,#c4c4c0);padding:0 4px;margin-left:6px;white-space:nowrap}
.sgah-st0{background:#fff!important;box-shadow:inset 0 0 0 1.5px var(--s-gris)}
.sgah-ini{flex:none;display:inline-grid;place-items:center;min-width:34px;height:22px;padding:0 4px;box-sizing:border-box;background:var(--s-nuit);color:#fff;font-size:10.5px;font-weight:700;letter-spacing:.02em}
.sgah-act{display:inline-flex;gap:2px;white-space:nowrap}
.sgah-a{width:24px;height:24px;border:1.5px solid var(--s-noir);background:#fff;cursor:pointer;display:inline-grid;place-items:center;padding:0;font:inherit;font-weight:700;font-size:12px;color:var(--s-noir)}
.sgah-a svg{width:13px;height:13px;stroke-width:2.6}
.sgah-a:hover{background:var(--s-jaune)}
.sgah-a.ok.on{background:#5d7a10;border-color:#5d7a10;color:#fff}
.sgah-a.ref.on{background:var(--s-rouge);border-color:var(--s-rouge);color:#fff}
.sgah-a:disabled{border-color:#c4c4c0;color:#c4c4c0;cursor:default;background:#fff}
.sgah-jg{display:inline-block;width:90px;height:5px;background:var(--s-nuit3);vertical-align:middle;position:relative}
.sgah-jg i{position:absolute;left:0;top:0;bottom:0;background:var(--s-nuit)}
.sgah-jg.dp i{background:var(--s-rouge)}
.sgah-jg u{position:absolute;top:-3px;bottom:-3px;width:2px;background:var(--s-noir)}
.sgah-2c{display:grid;grid-template-columns:300px minmax(0,1fr);gap:26px;align-items:start}
.sgah-col{position:sticky;top:-28px;border-top:2px solid var(--s-noir);max-height:calc(100vh - 150px);display:flex;flex-direction:column;min-height:0}
.sgah-col .ct{flex:none;display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:11px 0 9px;border-bottom:2px solid var(--s-noir)}
.sgah-col .ct b{font-size:13px;font-weight:700}
.sgah-col .ct .sgah-b{height:20px;padding:0;font-weight:400;font-size:11px}
.sgah-col .q{flex:none;padding:8px 0 6px;border-bottom:1px solid var(--s-filet)}
.sgah-col .q span{display:block;font-size:11px;color:var(--s-gris);margin-top:5px}
.sgah-col .l{flex:1;min-height:0;overflow-y:auto}
.sgah-it{display:flex;align-items:center;gap:10px;min-height:46px;padding:6px 10px 6px 8px;border-bottom:1px solid var(--s-filet);cursor:pointer}
.sgah-it:hover{background:var(--s-jaune3)}
.sgah-it.on{background:var(--s-jaune2);box-shadow:inset 3px 0 0 var(--s-nuit)}
.sgah-it .tx{flex:1;min-width:0}
.sgah-it .tx b{display:block;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgah-it .tx span{display:block;font-size:11.5px;color:var(--s-gris);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgah-it .v{font-size:11.5px;font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}
.sgah-it .v.z{color:var(--s-gris);font-weight:400}
@container (max-width:900px){.sgah-2c{grid-template-columns:minmax(0,1fr)}.sgah-col{position:static;max-height:260px}}
.sgah-sem{width:100%;border-collapse:collapse;border-top:2px solid var(--s-noir);font-variant-numeric:tabular-nums;font-size:12.5px}
.sgah-sem th{font-size:11px;font-weight:700;color:var(--s-gris);padding:7px 6px;border-bottom:1px solid var(--s-noir);text-align:right;white-space:nowrap}
.sgah-sem th:first-child,.sgah-sem td:first-child{text-align:left}
.sgah-sem th .n{display:block;font-size:15px;color:var(--s-noir)}
.sgah-sem td{padding:0 6px;height:38px;border-bottom:1px solid var(--s-filet);text-align:right;white-space:nowrap}
.sgah-sem td.j{cursor:pointer;min-width:58px}
.sgah-sem td.j:hover{background:var(--s-jaune3)}
.sgah-sem td.j.on{background:var(--s-jaune2);box-shadow:inset 0 -2px 0 var(--s-nuit)}
.sgah-sem .off{background:var(--s-fond,#f4f4f2)}
.sgah-sem .auj{background:var(--s-jaune3)}
.sgah-sem td .sgfh-st{margin-left:5px;vertical-align:-2px}
.sgah-sem td.nom{display:flex;align-items:center;gap:10px;min-height:38px}
.sgah-sem td.nom b{font-weight:700}
.sgah-sem td.nom small{font-size:11px;color:var(--s-gris);font-weight:400}
.sgah-sem tr.on td.nom b{color:var(--s-nuit)}
.sgah-sem tr.tot td{font-weight:700;border-top:2px solid var(--s-noir);border-bottom:0}
.sgah-sem td.z{color:#c4c4c0}
.sgah-crit{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:14px;margin:4px 0 10px}
@container (max-width:1050px){.sgah-crit{grid-template-columns:repeat(3,minmax(0,1fr))}}
.sgah-cl.s2{grid-column:span 2}.sgah-crit.n3{grid-template-columns:repeat(3,minmax(0,1fr))}.sgah-crit.n4{grid-template-columns:repeat(4,minmax(0,1fr))}.sgah-crit.n5{grid-template-columns:repeat(5,minmax(0,1fr))}.sgah-crit+.sgah-crit{margin-top:18px}
@container (max-width:900px){.sgah-crit.n5{grid-template-columns:repeat(3,minmax(0,1fr));row-gap:18px}.sgah-crit.n5>.sgah-cl.s2{grid-column:auto}}
.sgah-crit.n3{row-gap:18px}
@container (max-width:700px){.sgah-crit.n4,.sgah-crit.n3{grid-template-columns:repeat(2,minmax(0,1fr));row-gap:18px}.sgah-crit.n4>.sgah-cl.s2,.sgah-crit.n3>.sgah-cl.s2{grid-column:auto}}
.sgah-bcr>.sgah-b:first-child{padding-left:0}.sgah-sp{min-height:4px;padding:0}
.sgah-pp{display:grid;grid-template-columns:auto minmax(0,1fr);gap:6px 8px;align-items:center;padding:8px 2px 10px;border-bottom:1px solid var(--s-filet);background:var(--s-jaune3);font-size:12px}
.sgah-pp label{color:var(--s-gris)}.sgah-pp .inp{height:28px;font-size:12px;min-width:0;width:100%}.sgah-pp .bb{display:flex;gap:2px;margin-left:-9px}.sgah-pp .sgah-b{height:26px}
.sgah-per h4 .tg{display:inline-flex;gap:8px}.sgah-per h4 .tg button{color:var(--s-gris)}.sgah-per h4 .tg button.on{color:var(--s-nuit);font-weight:700;text-decoration:underline;text-underline-offset:3px}
.sgah-cl{border-top:2px solid var(--s-noir);min-width:0;display:flex;flex-direction:column}
.sgah-pile{display:flex;flex-direction:column;gap:14px;min-width:0}.sgah-pile>.sgah-cl>.l{height:auto;flex:none}
.sgah-cl h4{margin:0;padding:8px 0 6px;font-size:11.5px;font-weight:700;display:flex;justify-content:space-between;gap:6px;border-bottom:1px solid var(--s-filet)}
.sgah-cl h4 button{border:0;background:none;font:inherit;font-size:11px;font-weight:400;color:var(--s-nuit);cursor:pointer;padding:0}
.sgah-cl .l{height:132px;flex:1 0 auto;overflow-y:auto}
.sgah-cl .i{display:flex;align-items:center;gap:6px;padding:4px 2px;font-size:12px;cursor:pointer;border-bottom:1px solid var(--s-filet)}
.sgah-cl .i:hover{background:var(--s-jaune3)}
.sgah-cl .i.on{background:var(--s-jaune2);font-weight:700}
.sgah-cl .i span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgah-cl .i em{font-style:normal;color:var(--s-gris);font-size:11px;font-variant-numeric:tabular-nums;font-weight:400}
.sgah-cl .i.z span,.sgah-cl .i.z em{color:#b9b9b6}
.sgah-bar .inp{height:28px;width:230px;max-width:100%;margin:0 6px 0 0;box-sizing:border-box}
.sgah-col .q .inp{width:100%;height:28px;box-sizing:border-box}
.sgah-selz{display:inline-flex;align-items:center;gap:2px;flex-wrap:wrap;justify-content:flex-end}
.sgah-selz small{margin-right:10px}
.sgah-t #sgah-qn{font-size:12px;font-weight:400;color:var(--s-gris)}
.sgah-lect{font-size:12px;color:var(--s-gris);border-left:3px solid var(--s-gris);padding:6px 10px;margin:10px 0 2px;background:var(--s-fond,#f4f4f2)}
.sgah .sg-split{display:block}
.sgah-tuiles{margin:6px 0 6px;grid-template-columns:repeat(2,minmax(0,1fr))}
@container (max-width:620px){.sgah-tuiles{grid-template-columns:minmax(0,1fr)}}
.sgah-tuiles .sg-tile{min-height:112px}
.sgah-tuiles .sg-tile .ft{color:var(--s-nuit)}
.sgah-tuiles .sg-tile.on{background:linear-gradient(var(--s-jaune2,#FEF6B0),var(--s-jaune2,#FEF6B0)) no-repeat;border-top-color:var(--s-nuit)}
.sgah-tuiles .sg-tile.on .ft .go{transform:rotate(90deg)}
.sgah-emb{margin-top:30px}
.sgah-et{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;padding:0 0 8px;border-bottom:2px solid var(--s-noir);margin:0 0 2px}
.sgah-et b{font-size:16px;font-weight:700}.sgah-et .sgah-etn{color:var(--s-nuit)}.sgah-et small{display:block;font-size:12px;color:var(--s-gris);margin-top:4px}
`;
const css=()=>{ if(!document.getElementById('sgah-css')){ const s=document.createElement('style'); s.id='sgah-css'; s.textContent=CSS; document.head.appendChild(s); } };

/* ── outils et données ── */
const E=s=>nxE(s==null?'':String(s)), Hh=v=>nxH(v), F0=v=>nxCHF(v), F2=v=>num(Math.round((+v||0)*100)/100,2);
const auj=()=>{ const d=new Date(); d.setHours(0,0,0,0); return d; };
const jplus=(d,n)=>{ const x=new Date(d.getFullYear(),d.getMonth(),d.getDate()); x.setDate(x.getDate()+n); return x; };
const K=d=>dayKey(d), kC=r=>(+r.DATEYEAR)*10000+(+r.DATEMONTH)*100+(+r.DATEDAY), dK=k=>new Date(Math.floor(k/10000),Math.floor(k/100)%100,k%100);
const fK=k=>k?dfr(diso(dK(k))):'—', fD=d=>dfr(diso(d)), fC=d=>String(d.getDate()).padStart(2,'0')+'.'+String(d.getMonth()+1).padStart(2,'0');
const etT=r=>+r.TIMELOGSTATECODE||0, etC=r=>+r.PROJECTCOSTSTATECODE||0, aC=e=>e===0||e===2, hh=r=>+r.TIMEPERIOD||0;
const Pj=id=>id==null?null:DS.get('project',id);
const sN=id=>{ const s=DS.get('staff',id); return s?staffName(s):'—'; };
const sI=id=>{ const s=DS.get('staff',id); if(!s) return '?'; if(s.INITIALS) return String(s.INITIALS); const m=String(staffName(s)||'').trim().split(/\s+/); return ((m[0]||'').charAt(0)+(m.length>1?m[m.length-1].slice(0,2):'')).toUpperCase(); };
const lb=(tb,id,f)=>{ const x=id!=null&&id!==''?DS.get(tb,id):null; return x?String(f(x)||''):''; };
const phL=id=>lb('projectphase',id,ctlPhLbl), spL=id=>lb('projectsubphase',id,ctlPhLbl), acL=id=>lb('projectactivity',id,nm), agL=id=>lb('projectactivitygroup',id,nm);
const ccL=id=>lb('projectcostcategory',id,nm), cgL=id=>lb('projectcostcategorygroup',id,nm), suL=id=>lb('subproject',id,ctlSub);
const cmpN=(a,b)=>String(a).localeCompare(String(b),'fr',{numeric:true});
/* droits : périmètre (null = tout), contrôle possible, frais visibles */
const peutVoir=dom=>{ try{ return sgAdmin()||(SG_ACC.profil!=='collab'&&sgDroit(dom==='h'?'heures':'frais','projets')); }catch(_){ return false; } };
const perim=dom=>{ try{ if(sgAdmin()||sgDroit(dom==='h'?'heures':'frais',dom==='h'?'toutes':'tous')) return null; return new Set(sgProjetsVisibles().map(p=>String(p.ID))); }catch(_){ return new Set(); } };
const dansP=(V,id)=>!V||V.has(String(id));
const ecrit=dom=>{ try{ return peutVoir(dom)&&(typeof ctlCan!=='function'||ctlCan(dom==='h'?'projectTime':'projectCosts')); }catch(_){ return false; } };
/* période bloquée = règle de hsFrozen du moteur (collaborateur « saisie bloquée jusqu'au … », date de l'inscription ≤ cette date), lue sur une table par collaborateur */
const gelMap=()=>memo('gel',()=>{ const M=new Map(); DS.all('staff').forEach(s=>{ if(!s.ISTIMELOGFROZEN||!s.TIMELOGFREEZINGDATE) return; const x=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(s.TIMELOGFREEZINGDATE)); if(x) M.set(String(s.ID),(+x[1])*10000+(+x[2]-1)*100+(+x[3])); }); return M; });
const bloquee=r=>{ const g=gelMap().get(String(r.STAFF_ID)); return !!g&&tlKey(r)<=g; };
let VER=0; try{ DS.on(()=>{ VER++; }); }catch(_){ }
/* calculs gardés tant que la base, le profil et ses droits sur les heures et les frais ne changent pas */
let MV=-1, MQ=''; const MEMO=new Map(), memo=(k,f)=>{ let q=''; try{ q=SG_ACC.profil+'|'+SG_ACC.droits.heures+'|'+SG_ACC.droits.frais+'|'+SG_ACC.droits.projets_voir; }catch(_){ }
  if(MV!==VER||MQ!==q){ MEMO.clear(); MV=VER; MQ=q; } let v=MEMO.get(k); if(v===undefined){ v=f(); MEMO.set(k,v); } return v; };
const TL=()=>memo('tl',()=>{ const V=perim('h'); return DS.all('timelog').filter(r=>!r.ISHOLIDAY&&r.PROJECT_ID!=null&&dansP(V,r.PROJECT_ID)); });
const PC=()=>memo('pc',()=>{ const V=perim('f'); return DS.all('projectcost').filter(r=>r.PROJECT_ID!=null&&dansP(V,r.PROJECT_ID)); });
const permisP=(dom,pid)=>dansP(perim(dom),pid);
/* sujet « c:<id> » = toutes les positions d'un collaborateur sur les affaires du périmètre (Analyse des heures des collaborateurs, 26.11.2026) */
const estC=pid=>typeof pid==='string'&&pid.slice(0,2)==='c:';
const base=(dom,pid)=>memo('b'+dom+pid,()=>estC(pid)?(dom==='h'?TL():PC()).filter(r=>String(r.STAFF_ID)===pid.slice(2)):!permisP(dom,pid)?[]:dom==='h'?DS.by('timelog','PROJECT_ID',pid).filter(r=>!r.ISHOLIDAY):DS.by('projectcost','PROJECT_ID',pid).slice());
const taux=(sid,iso)=>{ const L=memo('tx'+sid,()=>DS.by('staffrate','STAFF_ID',sid).filter(x=>x.VALIDFROM).map(x=>[String(x.VALIDFROM).slice(0,10),+x.RATE||0]).sort((a,b)=>a[0]<b[0]?1:-1)); for(const x of L) if(x[0]<=iso) return x[1]; return 0; };
const coutOk=()=>{ try{ return typeof sgTauxVisibles==='function'&&sgTauxVisibles(); }catch(_){ return false; } };
const cout=L=>{ let s=0; try{ L.forEach(r=>{ s+=hh(r)*taux(r.STAFF_ID,diso(tlDate(r))); }); }catch(_){ } return s; };

/* ── état de la page ── */
const LS0=(()=>{ try{ return nxLS.get('sg3_ah',{})||{}; }catch(_){ return {}; } })();
const ST={pid:null,sid:null,aff:null,amod:null,per:{mode:['mois','annee','12m','tout'].includes(LS0.mode)?LS0.mode:'annee',d:null,a:null,b:null},ppOuvert:false,etat:LS0.etat==null?2:+LS0.etat,fmo:LS0.fmo==='annee'?'annee':'mois',par:{h:LS0.par&&LS0.par.h==='col'?'col':'aff',f:LS0.par&&(LS0.par.f==='col'||LS0.par==='col')?'col':'aff'},plie:new Set(),sem:null,fm:null,col:null,jour:null,q:'',sel:new Set(),dern:null,ycol:0,
  crit:{h:{},f:{}},perL:null,fa:{h:null,f:null},fd:{h:null,f:null},grp:{h:'',f:''}};
const garder=()=>{ try{ nxLS.set('sg3_ah',{mode:ST.per.mode,etat:ST.etat,fmo:ST.fmo,par:ST.par}); }catch(_){ } };
const PMODES=[['mois','Mois'],['annee','Année'],['12m','12 mois'],['tout','Tout']];
const periode=()=>{ const m=ST.per.mode, d=ST.per.d||auj();
  /* période personnalisée (26.11.2026, Paulo : « ajouter une option personnalisée de la période ») : du … au …, l'une des deux dates peut manquer */
  if(m==='perso'){ const a=ST.per.a, b=ST.per.b; return {a,b,lib:a&&b?'du '+fD(a)+' au '+fD(b):a?'dès le '+fD(a):b?'jusqu’au '+fD(b):'Toutes les années',court:'Perso'}; }
  if(m==='mois'){ const a=new Date(d.getFullYear(),d.getMonth(),1), b=new Date(d.getFullYear(),d.getMonth()+1,0); return {a,b,lib:MOISL[a.getMonth()]+' '+a.getFullYear(),court:(x=>x.charAt(0).toLocaleUpperCase('fr')+x.slice(1))(MOIS[a.getMonth()].replace('.',''))}; }
  if(m==='annee') return {a:new Date(d.getFullYear(),0,1),b:new Date(d.getFullYear(),11,31),lib:String(d.getFullYear()),court:String(d.getFullYear())};
  if(m==='12m'){ const b=new Date(d.getFullYear(),d.getMonth()+1,0), a=new Date(b.getFullYear(),b.getMonth()-11,1); return {a,b,lib:MOIS[a.getMonth()]+' '+a.getFullYear()+' – '+MOIS[b.getMonth()]+' '+b.getFullYear(),court:'12 m'}; }
  return {a:null,b:null,lib:'Toutes les années',court:'Tout'}; };
const dans=(k,Pr)=>(!Pr.a||k>=K(Pr.a))&&(!Pr.b||k<=K(Pr.b));
const perDec=n=>{ const d=ST.per.d||auj(); ST.per.d=ST.per.mode==='annee'?new Date(d.getFullYear()+n,d.getMonth(),1):new Date(d.getFullYear(),d.getMonth()+n,1); };
const VIDE={h:0,n:0,ctl:0,hctl:0,blo:0,ref:0,ok:0,fa:0,fd:0,af:0,der:0,f:0,fn:0,fctl:0,fref:0,fder:0,ffa:0,faf:0,frb:0};
const statsAff=Pr=>memo('sa'+(Pr.a?K(Pr.a):0)+'-'+(Pr.b?K(Pr.b):0),()=>{ const M=new Map(), get=id=>{ let x=M.get(id); if(!x) M.set(id,x=Object.assign({},VIDE)); return x; };
  TL().forEach(r=>{ const k=tlKey(r); if(!dans(k,Pr)) return; const x=get(r.PROJECT_ID), t=hh(r), e=etT(r); x.h+=t; x.n++; if(aC(e)){ if(bloquee(r)) x.blo++; else { x.ctl++; x.hctl+=t; } } else if(e===1) x.ref++; else x.ok++; if(r.ISCHARGEABLE){ x.fa+=t; if(!r.ISCHARGED) x.af+=t; } if(r.ISCHARGED) x.fd+=t; if(k>x.der) x.der=k; });
  if(peutVoir('f')) PC().forEach(r=>{ const k=kC(r); if(!dans(k,Pr)) return; const x=get(r.PROJECT_ID), e=etC(r); const a=pcAmount(r); x.f+=a; x.fn++; if(aC(e)) x.fctl++; else if(e===1) x.fref++; if(r.ISCHARGEABLE){ x.ffa+=a; if(!r.ISCHARGED) x.faf+=a; } if(r.ISREFUNDABLE) x.frb+=a; if(k>x.fder) x.fder=k; });
  return M; });
const affaires=dom=>{ const V=dom==='hf'?null:perim(dom), Vh=dom==='hf'?perim('h'):null, Vf=dom==='hf'&&peutVoir('f')?perim('f'):undefined;
  return DS.all('project').filter(p=>(!ST.etat||+p.PROJECTSTATECODE===ST.etat)&&(dom==='hf'?(dansP(Vh,p.ID)||(Vf!==undefined&&dansP(Vf,p.ID))):dansP(V,p.ID))); };
const etatLib=()=>ST.etat?((CTL_ETATS.find(e=>e[0]===ST.etat)||[])[1]||''):'Toutes';
/* critères : clé d'une position (libellé pour les phases, activités et genres) et libellé d'une clé */
const PRESTA={1:'Projet',2:'Images 3D',3:'Maquette'};
const DIM={st:{t:'Collaborateur',k:r=>String(r.STAFF_ID==null?'':r.STAFF_ID),l:k=>k===''?'(sans collaborateur)':sN(isNaN(+k)?k:+k)},
  ph:{t:'Phase',k:r=>phL(r.PHASE_ID),l:k=>k||'(sans phase)',num:1}, sp:{t:'Phase partielle',k:r=>spL(r.SUBPHASE_ID),l:k=>k||'(sans phase partielle)',num:1},
  ag:{t:'Groupe d’activités',k:r=>agL(r.ACTIVITYGROUP_ID),l:k=>k||'(sans groupe)'}, act:{t:'Activité',k:r=>acL(r.ACTIVITY_ID),l:k=>k||'(sans activité)'},
  sub:{t:'Ouvrage',k:r=>suL(r.SUBPROJECT_ID),l:k=>k||'(sans ouvrage)',num:1},
  /* Prestations : trois seulement, dans cet ordre — Projet, Images 3D, Maquette (26.11.2026, Paulo : « ajouter avant phase, les prestations », puis « les prestations
     sont : projet, images 3D, maquette ») ; d'après l'activité de l'inscription : « Maquette » → Maquette, « Image de synthèse » (image, 3D, rendu, visualisation) →
     Images 3D, toute autre activité (ou aucune) → Projet */
  pre:{t:'Prestations',k:r=>{ const a=acL(r.ACTIVITY_ID)||''; return /maquette/i.test(a)?'3':/image|\b3\s?d\b|synth[eè]se|rendu|visualis/i.test(a)?'2':'1'; },l:k=>PRESTA[k]||'Projet',num:1},
  pr:{t:'Affaire',k:r=>String(r.PROJECT_ID==null?'':r.PROJECT_ID),l:k=>{ const p=k===''?null:Pj(isNaN(+k)?k:+k); return p?[p.NUMBER,p.TITLE].filter(Boolean).join(' '):'(sans affaire)'; },lab:1},
  cg:{t:'Groupe de frais',k:r=>cgL(r.COSTCATEGORYGROUP_ID),l:k=>k||'(sans groupe)'}, cat:{t:'Genre de frais',k:r=>ccL(r.COSTCATEGORY_ID),l:k=>k||'(sans genre)'},
  mois:{t:'Mois',k:(r,tl)=>String(tl?r.TIMEYEAR*100+r.TIMEMONTH:(+r.DATEYEAR)*100+(+r.DATEMONTH)),l:k=>MOISL[(+k)%100]+' '+Math.floor((+k)/100),desc:1,num:1}};
/* prestation d'une inscription : Projet, Images 3D ou Maquette, la règle de la liste « Prestations » ; colonne « Prestation » du tableau des inscriptions et des
   documents au lieu de « Activité » (26.11.2026, Paulo : « remplacer par prestation ») — l'activité elle-même reste dans Présentation ▸ Personnalisé */
const prestaL=r=>PRESTA[DIM.pre.k(r)]||'Projet';
/* deux rangées : l'affaire (ouvrage, phases…), puis toujours dessous, à partir d'Ouvrage, période, collaborateur, statuts et affichage (26.11.2026, Paulo : « toujours en dessous de ouvrage ») */
/* liste « Afficher » retirée (même jour, Paulo : « supprimer tri ») : le tableau est toujours le détail des positions ; les regroupements restent dans Rapports ▸ Grouper */
/* Facturé sous Facturable, dans la même colonne (même jour, Paulo : « déplacer ») */
/* liste Facturable retirée (même jour, Paulo : « supprimer facturable ») : il reste Facturé, sous la forme d'une liste simple ; plus aucun filtre Facturable */
const CRIT2=['per','st','fd'], CRIT={h:[['sub','pre','ph','sp'],CRIT2],f:[['sub','cg','cat','ph','sp'],CRIT2]};
/* listes d'un collaborateur : l'affaire remplace le collaborateur (26.11.2026) */
const CRITC=[['pr','sub','pre','ph','sp'],['per','fd']];
const GRP={h:[['','Détail'],['ph','Phase'],['sp','Phase partielle'],['act','Activité'],['st','Collaborateur'],['mois','Mois']],f:[['','Détail'],['cat','Genre de frais'],['cg','Groupe de frais'],['st','Collaborateur'],['ph','Phase'],['mois','Mois']]};
const kR=(r,tl)=>tl?tlKey(r):kC(r), vR=(r,tl)=>tl?hh(r):pcAmount(r);
const filtrer=(dom,pid,o)=>{ o=o||{}; const tl=dom==='h', Pr=periode(), C=ST.crit[dom], ks=Object.keys(C).filter(k=>k!==o.sauf&&C[k]&&C[k].size), fa=null, fd=o.sauf==='fd'||ST.fd[dom]!==0?null:0;
  return base(dom,pid).filter(r=>{ if(!o.sansPer&&!dans(kR(r,tl),Pr)) return false; for(const k of ks) if(!C[k].has(DIM[k].k(r,tl))) return false;
    if(fa!=null&&(+!!r.ISCHARGEABLE)!==fa) return false; if(fd!=null&&(+!!r.ISCHARGED)!==fd) return false; return true; }); };
const grouper=(dom,rows,dim)=>{ const tl=dom==='h', D=DIM[dim], M=new Map(); rows.forEach(r=>{ const k=D.k(r,tl); let g=M.get(k); if(!g) M.set(k,g={k,v:0,n:0,ctl:0,fa:0,fd:0,rb:0}); const v=vR(r,tl); g.v+=v; g.n++; if(aC(tl?etT(r):etC(r))) g.ctl++; if(r.ISCHARGEABLE) g.fa+=v; if(r.ISCHARGED) g.fd+=v; if(!tl&&r.ISREFUNDABLE) g.rb+=v; });
  const G=[...M.values()]; G.sort((a,b)=>(a.k===''?1:0)-(b.k===''?1:0)||(D.lab?cmpN(D.l(a.k),D.l(b.k)):D.num?(D.desc?cmpN(b.k,a.k):cmpN(a.k,b.k)):b.v-a.v)); return G; };
const prevuPh=pid=>memo('bud'+pid,()=>{ const M=new Map(); DS.by('projectphase','PROJECT_ID',pid).forEach(x=>{ const k=ctlPhLbl(x), b=+x.TIMEBUDGET||0; if(b) M.set(k,(M.get(k)||0)+b); }); return M; });
/* filtre décrit comme le moteur l'attend (ctlFiltreTxt : documents et rapports) */
const filtreMoteur=dom=>{ const Pr=periode(), F={dOn:!!(Pr.a||Pr.b),dMode:ST.per.mode==='mois'?'mois':'per',m:(ST.per.d||auj()).getMonth(),y:(ST.per.d||auj()).getFullYear(),d1:Pr.a?diso(Pr.a):'',d2:Pr.b?diso(Pr.b):'',
  faOn:false,fa:0,fdOn:ST.fd[dom]===0,fd:0}; return F; };
/* colonnes des documents, de la copie et du CSV : celles de la fenêtre d'analyse du moteur (+ Remboursable pour les frais) ; Facturable / Facturé / Remboursable écrits
   Oui / Non : les signes ✔ ✕ du moteur ne sont pas dans la police des documents (colonnes vides dans le PDF) */
const ON=v=>v?'Oui':'Non';
const COLS={h:()=>[{k:'d',t:'Date',f:r=>dfr(diso(tlDate(r)))},{k:'h1',t:'Début',f:r=>hm(r.TIMEHOUR1||0,r.TIMEMINUTE1||0)},{k:'h2',t:'Fin',f:r=>{ const e=tlT2(r); return hm(Math.floor(e/60),e%60); }},{k:'TIMEPERIOD',t:'Durée',f:r=>hrs(r.TIMEPERIOD)},
    {k:'st',t:'Statut',f:r=>TSTATE[r.TIMELOGSTATECODE||0]},{k:'fa',t:'Facturable',f:r=>ON(r.ISCHARGEABLE)},{k:'fd',t:'Facturé',f:r=>ON(r.ISCHARGED)},{k:'s',t:'Personne',f:r=>esc(sN(r.STAFF_ID))},
    {k:'ag',t:'Groupe d’activités',f:r=>esc(agL(r.ACTIVITYGROUP_ID))},{k:'a',t:'Prestation',f:r=>esc(prestaL(r))},{k:'o',t:'Ouvrage',f:r=>esc((DS.get('subproject',r.SUBPROJECT_ID)||{}).CODE||'')},
    {k:'ph',t:'Phase',f:r=>esc(lb('projectphase',r.PHASE_ID,nm))},{k:'sp',t:'Phase partielle',f:r=>esc(lb('projectsubphase',r.SUBPHASE_ID,nm))},{k:'DESCRIPTION',t:'Commentaire'}],
  f:()=>[...COSTCOLS.map(c=>c.k==='fa'?{...c,f:r=>ON(r.ISCHARGEABLE)}:c.k==='fd'?{...c,f:r=>ON(r.ISCHARGED)}:c),{k:'rb',t:'Remboursable',f:r=>ON(r.ISREFUNDABLE)},{k:'pe',t:'Collaborateur',f:r=>esc(sN(r.STAFF_ID))},{k:'o',t:'Ouvrage',f:r=>esc((DS.get('subproject',r.SUBPROJECT_ID)||{}).CODE||'')},
    {k:'ph',t:'Phase',f:r=>esc(lb('projectphase',r.PHASE_ID,nm))},{k:'sp',t:'Phase partielle',f:r=>esc(lb('projectsubphase',r.SUBPHASE_ID,nm))}]};
const grille=(dom,L)=>({cols:COLS[dom](),view:dom==='h'?L.slice().sort((a,b)=>tlKey(a)-tlKey(b)||tlT1(a)-tlT1(b)):L.slice().sort((a,b)=>kC(a)-kC(b))});
/* documents : sans les colonnes vides sur toutes les lignes (ouvrage, phase… d'une affaire qui n'en a pas) — le moteur donne la même largeur à chaque colonne */
const grilleDoc=(dom,L)=>{ const g=grille(dom,L), tx=(c,r)=>{ const v=c.f?c.f(r):r[c.k]; return v==null?'':String(v).trim(); }; g.cols=g.cols.filter(c=>g.view.some(r=>tx(c,r)!=='')); return g; };

/* ── composants ── */
const tete=(g,lbT,t,meta,act)=>'<div class="sgfh-tete"><div class="sgfh-id"><div class="sgfh-ini">'+E(g)+'</div><div class="sgfh-nm"><div class="lb">'+E(lbT)+'</div><h2>'+E(t)+'</h2>'+(meta?'<div class="sgfh-meta">'+meta+'</div>':'')+'</div></div>'+(act?'<div class="sgah-hact">'+act+'</div>':'')+'</div>';
const kpi=(l,v,s,c,ti)=>'<div class="nx-kpi"'+(ti?' title="'+E(ti)+'"':'')+'><div class="l">'+E(l)+'</div><div class="v'+(c?' '+c:'')+'">'+v+'</div>'+(s?'<div class="s">'+s+'</div>':'')+'</div>';
const kpis=L=>'<div class="nx-kpis sgah-kp">'+L.filter(Boolean).join('')+'</div>';
const bt=(fn,t,ic,x,cls)=>'<button type="button" class="sgah-b'+(cls?' '+cls:'')+'" data-fn="'+fn+'"'+(x||'')+'>'+(ic?nxSvg(ic):'')+E(t)+'</button>';
const SEP='<span class="sgah-sep"></span>', DR=h=>'<span class="sgah-dr">'+h+'</span>';
const txs=(fn,L,cur,x)=>L.map(([k,t])=>bt(fn,t,'',' data-k="'+E(k)+'"'+(x||''),String(cur)===String(k)?'on':'')).join('');
const pill=e=>e===3?'<span class="sgfh-st ok" title="Approuvée">'+nxSvg('check')+'</span>':e===1?'<span class="sgfh-st ref" title="Refusée">!</span>':e===2?'<span class="sgfh-st cor" title="Corrigée">↺</span>':'<span class="sgfh-st sgah-st0" title="Saisie, à contrôler"></span>';
const pillL=L=>{ if(!L.length) return ''; return L.some(e=>e===1)?pill(1):L.some(aC)?pill(L.some(e=>e===2)?2:0):pill(3); };
const jauge=(v,max,cls,rep)=>'<span class="sgah-jg'+(cls?' '+cls:'')+'"><i style="width:'+(max>0?Math.max(0,Math.min(100,v/max*100)):0).toFixed(1)+'%"></i>'+(rep!=null&&max>0?'<u style="left:'+Math.max(0,Math.min(100,rep/max*100)).toFixed(1)+'%"></u>':'')+'</span>';
const ini=sid=>'<span class="sgah-ini" title="'+E(sN(sid))+'">'+E(sI(sid))+'</span>';
const oui=v=>v?'<span title="Oui">✓</span>':'<span style="color:#b9b9b6" title="Non">–</span>';
const acts=(dom,r,e,ro,pq)=>{ const d=ro?' disabled':''; return '<span class="sgah-act"><button type="button" class="sgah-a ok'+(e===3?' on':'')+'" data-fn="ap1" data-dom="'+dom+'" data-id="'+E(r.ID)+'" title="'+E(ro&&pq?pq:e===3?'Approuvée : cliquer pour réinitialiser':'Approuver')+'"'+d+'>'+nxSvg('check')+'</button>'
  +'<button type="button" class="sgah-a ref'+(e===1?' on':'')+'" data-fn="rf1" data-dom="'+dom+'" data-id="'+E(r.ID)+'" title="'+E(ro&&pq?pq:e===1?'Refusée : cliquer pour réinitialiser':'Refuser')+'"'+d+'>!</button></span>'; };
const barPer=Pr=>txs('pmode',PMODES,ST.per.mode)+SEP+(ST.per.mode==='tout'||ST.per.mode==='perso'?'':bt('pdec','','prev',' data-n="-1" title="Période précédente"'))+'<span class="sgah-lbl">'+E(Pr.lib)+'</span>'+(ST.per.mode==='tout'||ST.per.mode==='perso'?'':bt('pdec','','next',' data-n="1" title="Période suivante"'));
const MAXL=1000;
/* inscriptions d'heures : o.ck (cases), o.act (approuver / refuser), o.sansSt ; tri commun des tableaux (clé de tri de la date), double-clic = modifier */
/* colonnes des inscriptions et des notes de frais (bloc 57, catalogues « ahh » et « ahf », 15.11.2026) : champs d'une inscription d'heures et d'une note de frais
   de l'ancien logiciel ; la case à cocher (choix) et les boutons Approuver / Refuser restent avant et après les colonnes choisies ; total sous la durée / le montant */
const catAh=()=>{ if(SGTAB.def.ahh) return; const ouiT=v=>v?'Oui':'Non';
  const etatH=r=>{ const e=etT(r), bl=bloquee(r); return pill(e)+' <span class="gr" style="font-size:11.5px;color:var(--s-gris)">'+E(TSTATE[e]||'')+'</span>'+(bl?'<span class="blo" title="Période bloquée pour ce collaborateur : l’état n’est plus modifiable">bloquée</span>':''); };
  /* Standard : Phase puis Phase partielle, en deux colonnes (26.11.2026, Paulo : « ajouter phase partiel ») ; avant : une colonne « Phase » = phase partielle, sinon phase */
  /* colonnes non cochées retirées du catalogue (26.11.2026, Paulo, sur la fenêtre « Présentation personnalisée » : « supprimer les éléments non sélectionnés ») :
     Initiales, Vacances, Groupe d'activité, Prestation, Phase partielle sinon phase, Facturé le ; restent les douze de sa présentation, « Activité » (activité de
     l'inscription) au lieu de « Prestation » dans le Standard. Le tableau des collaborateurs (ahc) reprend ce catalogue. */
  sgtabDef('ahh',{titre:'Inscriptions d’heures',std:['date','coll','duree','activ','phaseg','sphase','com','fact','facture','etat'],cat:{
    date:{t:'Date',cat:'Inscription',nw:1,v:r=>{ const d=tlDate(r); return JOURS[d.getDay()]+' '+fD(d); }},
    horaire:{t:'Horaire',l:'Heure de début et de fin',cat:'Inscription',nw:1,v:r=>hm(r.TIMEHOUR1||0,r.TIMEMINUTE1||0)+' – '+hm(r.TIMEHOUR2||0,r.TIMEMINUTE2||0)},
    coll:{t:'Collaborateur',cat:'Inscription',nw:1,v:r=>sN(r.STAFF_ID),sum:L=>num(L.length,0)+' inscription'+(L.length>1?'s':'')},
    duree:{t:'Durée',l:'Durée (heures)',cat:'Inscription',r:1,nw:1,f:r=>'<b>'+Hh(hh(r))+'</b> h',v:r=>Hh(hh(r))+' h',sum:L=>Hh(L.reduce((t,r)=>t+hh(r),0))+' h'},
    activ:{t:'Activité',cat:'Activité',v:r=>acL(r.ACTIVITY_ID)},
    phaseg:{t:'Phase',l:'Phase (principale)',cat:'Phase',v:r=>phL(r.PHASE_ID)},sphase:{t:'Phase partielle',cat:'Phase',v:r=>spL(r.SUBPHASE_ID)},
    ouv:{t:'Ouvrage',cat:'Phase',v:r=>suL(r.SUBPROJECT_ID)},
    com:{t:'Commentaire',cat:'Inscription',cl:()=>'com',v:r=>r.DESCRIPTION||''},
    fact:{t:'Fact.',l:'Facturable',cat:'Facturation',c:1,f:r=>oui(r.ISCHARGEABLE),v:r=>ouiT(r.ISCHARGEABLE)},
    facture:{t:'Facturé',cat:'Facturation',c:1,f:r=>oui(r.ISCHARGED),v:r=>ouiT(r.ISCHARGED)},
    etat:{t:'État',cat:'Contrôle',nw:1,f:etatH,v:r=>(TSTATE[etT(r)]||'')+(bloquee(r)?' (bloquée)':'')}}});
  /* inscriptions d'un collaborateur (26.11.2026) : mêmes colonnes, l'affaire à la place du collaborateur */
  sgtabDef('ahc',{titre:'Inscriptions d’heures d’un collaborateur',std:['date','aff','duree','activ','phaseg','sphase','com','fact','facture','etat'],cat:Object.assign({aff:{t:'Affaire',cat:'Inscription',f:r=>{ const p=Pj(r.PROJECT_ID); return p?'<b>'+E(p.NUMBER||'')+'</b> '+E(p.TITLE||''):''; },v:r=>{ const p=Pj(r.PROJECT_ID); return p?[p.NUMBER,p.TITLE].filter(Boolean).join(' '):''; }}},SGTAB.def.ahh.cat)});
  sgtabDef('ahf',{titre:'Notes de frais',std:['date','coll','genre','desc','qte','montant','fact','facture','remb','etat'],cat:{
    date:{t:'Date',cat:'Note de frais',nw:1,v:r=>fD(pcDate(r))},coll:{t:'Collaborateur',cat:'Note de frais',nw:1,v:r=>sN(r.STAFF_ID),sum:L=>num(L.length,0)+' note'+(L.length>1?'s':'')},
    grp:{t:'Groupe de frais',cat:'Note de frais',v:r=>cgL(r.COSTCATEGORYGROUP_ID)},genre:{t:'Genre de frais',cat:'Note de frais',v:r=>ccL(r.COSTCATEGORY_ID)},
    desc:{t:'Désignation',cat:'Note de frais',cl:()=>'com',v:r=>r.DESCRIPTION||''},piece:{t:'N° pièce',cat:'Note de frais',nw:1,v:r=>r.DOCUMENTNUMBER||''},
    qte:{t:'Quantité',cat:'Montants',r:1,nw:1,v:r=>{ const q=+r.QUANTITY||0; return num(q,q%1?2:0)+(r.UNIT?' '+r.UNIT:''); }},
    pu:{t:'Prix unitaire',cat:'Montants',r:1,nw:1,v:r=>r.UNITPRICE==null||r.UNITPRICE===''?'':F2(+r.UNITPRICE)},
    montant:{t:'Montant CHF',cat:'Montants',r:1,nw:1,f:r=>'<b>'+F2(pcAmount(r))+'</b>',v:r=>F2(pcAmount(r)),sum:L=>F2(L.reduce((t,r)=>t+pcAmount(r),0))},
    tva:{t:'TVA %',cat:'Montants',r:1,nw:1,v:r=>r.VATRATE==null||r.VATRATE===''?'':String(r.VATRATE)},
    phase:{t:'Phase',cat:'Phase',v:r=>spL(r.SUBPHASE_ID)||phL(r.PHASE_ID)},ouv:{t:'Ouvrage',cat:'Phase',v:r=>suL(r.SUBPROJECT_ID)},
    fact:{t:'Fact.',l:'Facturable',cat:'Facturation',c:1,f:r=>oui(r.ISCHARGEABLE),v:r=>ouiT(r.ISCHARGEABLE)},facture:{t:'Facturé',cat:'Facturation',c:1,f:r=>oui(r.ISCHARGED),v:r=>ouiT(r.ISCHARGED)},
    remb:{t:'Remb.',l:'Remboursable au collaborateur',cat:'Remboursement',c:1,f:r=>oui(r.ISREFUNDABLE),v:r=>ouiT(r.ISREFUNDABLE)},rembo:{t:'Remboursé',cat:'Remboursement',c:1,f:r=>oui(r.ISREFUNDED),v:r=>ouiT(r.ISREFUNDED)},
    etat:{t:'État',cat:'Contrôle',nw:1,f:r=>{ const e=etC(r); return pill(e)+' <span style="font-size:11.5px;color:var(--s-gris)">'+E(TSTATE[e]||'')+'</span>'; },v:r=>TSTATE[etC(r)]||''}}}); };
const tabHeures=(L,o)=>{ o=o||{}; catAh(); const n=L.length, V=L.slice().sort((a,b)=>tlKey(b)-tlKey(a)||tlT1(b)-tlT1(a)).slice(0,MAXL), ec=ecrit('h'); if(!n) return '<div class="sgah-vide">'+E(o.vide||'Aucune inscription.')+'</div>';
  return '<div class="sgah-x">'+sgtabTableauX(o.cle||'ahh',V,null,{cls:'sgah-tb',attr:' data-dom="h"',tot:{lib:'Total'},totLignes:L,
      tr:r=>{ const id=String(r.ID); return ' data-id="'+E(id)+'" class="'+(ST.sel.has(id)?'on':'')+'" '+(ec?' title="Double-clic : modifier l’inscription"':''); },
      avant:o.ck?{th:'<th class="ck"></th>',tot:'<td></td>',td:r=>{ const id=String(r.ID); return '<td class="ck"><input type="checkbox" data-ck="'+E(id)+'"'+(ST.sel.has(id)?' checked':'')+' aria-label="Choisir"></td>'; }}:null,
      apres:o.act?{th:'<th></th>',tot:'<td></td>',td:r=>{ const e=etT(r), bl=bloquee(r); return '<td class="r">'+acts('h',r,e,!ec||bl,bl?'Période bloquée pour ce collaborateur : l’état n’est plus modifiable':'')+'</td>'; }}:null})+'</div>'
    +(n>MAXL?'<div class="sgah-note">'+num(MAXL,0)+' inscriptions affichées sur '+num(n,0)+' (les plus récentes) ; les documents, la copie et le CSV les contiennent toutes.</div>':''); };
const tabFrais=(L,o)=>{ o=o||{}; catAh(); const n=L.length, V=L.slice().sort((a,b)=>kC(b)-kC(a)).slice(0,MAXL), ec=ecrit('f'); if(!n) return '<div class="sgah-vide">'+E(o.vide||'Aucune note de frais.')+'</div>';
  return '<div class="sgah-x">'+sgtabTableauX('ahf',V,null,{cls:'sgah-tb',attr:' data-dom="f"',tot:{lib:'Total'},totLignes:L,
      tr:r=>{ const id=String(r.ID); return ' data-id="'+E(id)+'" class="'+(ST.sel.has(id)?'on':'')+'" '+(ec?' title="Double-clic : modifier la note de frais"':''); },
      avant:o.ck?{th:'<th class="ck"></th>',tot:'<td></td>',td:r=>{ const id=String(r.ID); return '<td class="ck"><input type="checkbox" data-ck="'+E(id)+'"'+(ST.sel.has(id)?' checked':'')+' aria-label="Choisir"></td>'; }}:null,
      apres:o.act?{th:'<th></th>',tot:'<td></td>',td:r=>'<td class="r">'+acts('f',r,etC(r),!ec)+'</td>'}:null})+'</div>'
    +(n>MAXL?'<div class="sgah-note">'+num(MAXL,0)+' notes de frais affichées sur '+num(n,0)+' (les plus récentes) ; les documents, la copie et le CSV les contiennent toutes.</div>':''); };
/* semaine de l'affaire : collaborateurs × jours */
const semaine=(L,lun,o)=>{ o=o||{}; const J=[...Array(7)].map((_,i)=>jplus(lun,i)), ka=K(auj()), M=new Map(), ec=ecrit('h'); L.forEach(r=>{ let x=M.get(r.STAFF_ID); if(!x) M.set(r.STAFF_ID,x={j:new Map(),h:0,L:[]}); const k=tlKey(r); if(!x.j.has(k)) x.j.set(k,[]); x.j.get(k).push(r); x.h+=hh(r); x.L.push(r); });
  const S=[...M.keys()].sort((a,b)=>cmpN(sN(a),sN(b))); if(!S.length) return '<div class="sgah-vide">Aucune inscription cette semaine pour cette affaire.</div>'; const tj=J.map(()=>0); let th=0;
  return '<div class="sgah-x"><table class="sgah-sem"><thead><tr><th>Collaborateur</th>'+J.map(d=>'<th class="'+(d.getDay()%6?'':'off')+(K(d)===ka?' auj':'')+'">'+JOURS[d.getDay()]+'<span class="n">'+d.getDate()+'</span></th>').join('')+'<th>Total</th><th>État</th><th></th></tr></thead><tbody>'
    +S.map(sid=>{ const x=M.get(sid), s=DS.get('staff',sid), gel=s&&s.ISTIMELOGFROZEN&&s.TIMELOGFREEZINGDATE?String(s.TIMELOGFREEZINGDATE).slice(0,10):'', aAp=x.L.some(r=>aC(etT(r))&&!bloquee(r)); th+=x.h;
      return '<tr class="'+(String(o.sid)===String(sid)?'on':'')+'"><td class="nom">'+ini(sid)+'<span><b>'+E(sN(sid))+'</b>'+(gel&&gel>=diso(lun)?'<br><small>saisie bloquée jusqu’au '+dfr(gel)+'</small>':'')+'</span></td>'
      +J.map((d,i)=>{ const Lj=x.j.get(K(d))||[], h=Lj.reduce((t,r)=>t+hh(r),0); tj[i]+=h; return '<td class="j'+(d.getDay()%6?'':' off')+(Lj.length?'':' z')+(String(o.sid)===String(sid)&&o.jour===K(d)?' on':'')+'" data-fn="cel" data-s="'+E(sid)+'" data-k="'+K(d)+'"'+(Lj.length?' title="'+E(Lj.length+' inscription'+(Lj.length>1?'s':'')+' : cliquer pour les afficher seules')+'"':'')+'>'+(Lj.length?Hh(h)+pillL(Lj.map(etT)):'·')+'</td>'; }).join('')
      +'<td><b>'+Hh(x.h)+'</b> h</td><td>'+pillL(x.L.map(etT))+'</td><td>'+(ec&&aAp?bt('apS','Approuver','check',' data-s="'+E(sid)+'" title="Approuver ses inscriptions à contrôler de la semaine"'):'')+'</td></tr>'; }).join('')
    +'<tr class="tot"><td>Total</td>'+tj.map(h=>'<td>'+(h?Hh(h):'')+'</td>').join('')+'<td>'+Hh(th)+' h</td><td></td><td></td></tr></tbody></table></div>'; };
/* tableau regroupé (Phase, Activité, Collaborateur, Mois…) */
const pivot=(dom,rows,d1,o)=>{ o=o||{}; const tl=dom==='h', G=grouper(dom,rows,d1), T=rows.reduce((s,r)=>s+vR(r,tl),0), mx=Math.max(1,...G.map(g=>g.v)), u=tl?' h':'', f=tl?Hh:F2; if(!G.length) return '<div class="sgah-vide">Aucune position pour ces critères.</div>';
  const Tg={fa:0,fd:0,rb:0,ctl:0,n:0}; G.forEach(g=>{ Tg.fa+=g.fa; Tg.fd+=g.fd; Tg.rb+=g.rb; Tg.ctl+=g.ctl; Tg.n+=g.n; });
  return '<div class="sgah-x"><table class="nx-tbl sgah-tb"><thead><tr><th>'+E(DIM[d1].t)+'</th><th class="r">'+(tl?'Heures':'Montant CHF')+'</th>'+(o.prevu?'<th class="r">Prévu</th><th class="r">Écart</th>':'')+'<th>Part</th><th class="r">Facturable</th><th class="r">Facturé</th>'+(tl?'':'<th class="r">Remboursable</th>')+'<th class="r">À contrôler</th><th class="r">Positions</th></tr></thead><tbody>'
    +G.map(g=>{ const pv=o.prevu?o.prevu.get(g.k)||0:0; return '<tr><td'+(DIM[d1].num?' data-tri="'+E(d1==='mois'?g.k:(g.k||'~'))+'"':'')+'>'+E(DIM[d1].l(g.k))+'</td><td class="r nw"><b>'+f(g.v)+'</b>'+u+'</td>'+(o.prevu?'<td class="r nw gr">'+(pv?Hh(pv)+' h':'')+'</td><td class="r nw"'+(pv&&g.v>pv?' style="color:var(--s-rouge)"':'')+'>'+(pv?(g.v>pv?'+':'')+Hh(g.v-pv)+' h':'')+'</td>':'')
      +'<td class="nw" data-tri="'+String(Math.round((T?g.v/T:0)*1e6)+1e9)+'">'+jauge(g.v,mx,pv&&g.v>pv?'dp':'',pv||null)+' <span style="color:var(--s-gris)">'+(T?Math.round(g.v/T*100):0)+' %</span></td><td class="r nw">'+(tl?Hh(g.fa)+' h':F2(g.fa))+'</td><td class="r nw">'+(tl?Hh(g.fd)+' h':F2(g.fd))+'</td>'+(tl?'':'<td class="r nw">'+F2(g.rb)+'</td>')
      +'<td class="r nw">'+num(g.ctl,0)+'</td><td class="r nw gr">'+num(g.n,0)+'</td></tr>'; }).join('')
    +'<tr class="tot"><td>Total</td><td class="r nw">'+f(T)+u+'</td>'+(o.prevu?'<td></td><td></td>':'')+'<td></td><td class="r nw">'+(tl?Hh(Tg.fa)+' h':F2(Tg.fa))+'</td><td class="r nw">'+(tl?Hh(Tg.fd)+' h':F2(Tg.fd))+'</td>'+(tl?'':'<td class="r nw">'+F2(Tg.rb)+'</td>')+'<td class="r nw">'+num(Tg.ctl,0)+'</td><td class="r nw">'+num(Tg.n,0)+'</td></tr></tbody></table></div>'; };
/* listes de critères (heures : ouvrage, phase, phase partielle, collaborateur ; frais : six) : la valeur d'une ligne = heures ou montant avec les AUTRES critères appliqués ; cocher filtre aussitôt */
/* liste « Période » (26.11.2026, Paulo : la barre Mois · Année · 12 mois · Tout « ajouter comme tri et supprimer en bas ») : une seule période choisie à la fois ;
   Toutes les années (« 12 derniers mois » retiré le 26.11.2026, montré seulement quand cette période est choisie dans la barre de la page), puis les années ou les mois (choix « années · mois » du titre) qui ont des positions ; valeur = avec les autres critères */
const listePer=(dom,pid)=>{ const tl=dom==='h', m=ST.per.mode, d=ST.per.d||auj(), vue=ST.perL||(m==='mois'?'mois':'an'), R=filtrer(dom,pid,{sansPer:1}), f=v=>tl?Hh(v):F0(v);
  const M=new Map(); let tot=0; R.forEach(r=>{ const k=kR(r,tl), v=vR(r,tl), c=vue==='mois'?Math.floor(k/100):Math.floor(k/10000); tot+=v; M.set(c,(M.get(c)||0)+v); });
  const cur=m==='annee'&&vue==='an'?d.getFullYear():m==='mois'&&vue==='mois'?d.getFullYear()*100+d.getMonth():null; if(cur!=null&&!M.has(cur)) M.set(cur,0);
  const d12=m==='12m'?d:auj(), b12=new Date(d12.getFullYear(),d12.getMonth()+1,0), a12=new Date(b12.getFullYear(),b12.getMonth()-11,1), P12={a:a12,b:b12}, v12=R.reduce((t,r)=>t+(dans(kR(r,tl),P12)?vR(r,tl):0),0),
    l12=m==='12m'&&ST.per.d&&K(new Date(d.getFullYear(),d.getMonth(),1))!==K(new Date(auj().getFullYear(),auj().getMonth(),1))?'12 mois jusqu’à '+MOISL[d.getMonth()].toLowerCase()+' '+d.getFullYear():'12 derniers mois';
  const it=(k,lib,v,on,ti)=>!v&&!on&&k!=='tout'?'':'<div class="i'+(on?' on':'')+(v?'':' z')+'" data-fn="perk" data-k="'+E(k)+'"'+(ti?' title="'+E(ti)+'"':'')+'><span title="'+E(lib)+'">'+E(lib)+'</span></div>';
  const tg=(k,t)=>'<button type="button" data-fn="perl" data-k="'+k+'"'+(vue===k?' class="on"':'')+' title="'+(k==='an'?'Lister les années':'Lister les mois')+'">'+t+'</button>';
  const P=m==='perso'?periode():null, iso=x=>x?diso(x):'';
  const pp='<div class="i'+(P?' on':'')+'" data-fn="ppo" title="Choisir une période : du … au …"><span>'+E(P?P.lib.charAt(0).toUpperCase()+P.lib.slice(1):'Personnalisée…')+'</span></div>'
    +(ST.ppOuvert?'<div class="sgah-pp"><label>Du</label><input type="date" class="inp" data-pp="a" value="'+iso(ST.per.a)+'"><label>Au</label><input type="date" class="inp" data-pp="b" value="'+iso(ST.per.b)+'">'
      +'<span></span><span class="bb">'+bt('ppok','Appliquer','',' title="Appliquer la période (Entrée)"')+bt('ppx','Annuler','',' title="Fermer sans changer (Échap)"')+'</span></div>':'');
  return '<div class="sgah-cl sgah-per"><h4><span>Période</span><span class="tg">'+tg('an','années')+tg('mois','mois')+'</span></h4><div class="l">'
    +it('tout','Toutes les années',tot,m==='tout')+pp+(m!=='12m'?'':it('12m',l12,v12,true,MOIS[a12.getMonth()]+' '+a12.getFullYear()+' – '+MOIS[b12.getMonth()]+' '+b12.getFullYear()))
    +[...M.keys()].sort((a,b)=>b-a).map(c=>vue==='mois'?it('m'+c,MOISL[c%100]+' '+Math.floor(c/100),M.get(c),c===cur):it('a'+c,String(c),M.get(c),c===cur)).join('')+'</div></div>'; };
/* Facturable, Facturé et Afficher en listes de critères (26.11.2026, Paulo : « ajouter au critère de tri ») : un seul choix par liste */
/* plus de valeur (heures, montant, nombre de lignes) à droite des lignes des listes (même jour, Paulo : « supprimer info ») ; choix vides masqués (même jour, Paulo :
   « afficher uniquement les données en lien avec l'affaire » → « masquer les choix vides ») : une ligne qui ne donnerait aucune position avec les autres critères n'est
   plus affichée, sauf si elle est cochée (alors en gris, pour pouvoir la décocher) ; « Tous » et « Toutes les années » restent */
const listeOui=(dom,pid,c)=>{ const tl=dom==='h', R=filtrer(dom,pid,{sauf:c}), F=c==='fa'?'ISCHARGEABLE':'ISCHARGED', cur=ST[c][dom], v=x=>R.reduce((t,r)=>t+(x==null||(+!!r[F])===x?vR(r,tl):0),0), f=x=>tl?Hh(x):F0(x);
  /* Facturé : une seule ligne « Non » à activer ou désactiver ; non activée = toutes les positions (26.11.2026, Paulo : « supprimer tous et permettre d'activer
     uniquement non, lorsque non n'est pas activé tu affiches toutes les heures ») ; toujours affichée, en gris quand aucune position n'est non facturée */
  if(c==='fd'){ const on=cur===0, w=v(0); return '<div class="sgah-cl"><h4><span>Facturé</span></h4><div class="l"><div class="i'+(on?' on':'')+(w?'':' z')+'" data-fn="trs" data-dom="'+dom+'" data-c="fd" data-k="'+(on?'':'0')+'" title="'+(on?'Afficher toutes les positions':'Afficher seulement les positions non facturées')+'"><span>Non</span></div></div></div>'; }
  return '<div class="sgah-cl"><h4><span>'+(c==='fa'?'Facturable':'Facturé')+'</span></h4><div class="l">'+TRI.map(([k,t])=>{ const x=k===''?null:+k, w=v(x), on=(cur==null?'':String(cur))===k; if(k!==''&&!w&&!on) return ''; return '<div class="i'+((cur==null?'':String(cur))===k?' on':'')+(w?'':' z')+'" data-fn="trs" data-dom="'+dom+'" data-c="'+c+'" data-k="'+k+'"><span>'+E(t.charAt(0).toUpperCase()+t.slice(1))+'</span></div>'; }).join('')+'</div></div>'; };
const listeAff=(dom,pid)=>{ const L=filtrer(dom,pid), g=ST.grp[dom], tl=dom==='h';
  return '<div class="sgah-cl"><h4><span>Afficher</span></h4><div class="l">'+GRP[dom].map(([k,t])=>{ const n=k?grouper(dom,L,k).length:L.length; return '<div class="i'+(g===k?' on':'')+'" data-fn="grp" data-dom="'+dom+'" data-k="'+E(k)+'" title="'+E(num(n,0)+(k?' ligne'+(n>1?'s':''):tl?' inscription'+(n>1?'s':''):' note'+(n>1?'s':'')+' de frais'))+'"><span>'+E(t)+'</span></div>'; }).join('')+'</div></div>'; };
const listes=(dom,pid)=>{ const tl=dom==='h', C=ST.crit[dom];
  /* liste Ouvrage seulement pour une affaire qui a des ouvrages (26.11.2026, Paulo : « afficher uniquement pour les projets qui comportent des ouvrages, sinon masqué ») */
  const ouv=pid!=null&&(DS.by('subproject','PROJECT_ID',pid).length>0||base(dom,pid).some(r=>r.SUBPROJECT_ID!=null&&r.SUBPROJECT_ID!==''));
  if(!ouv&&C.sub) delete C.sub;
  /* largeurs (même jour, Paulo : « largeur des éléments du dessus, au maximum deux éléments du dessous ») : les deux rangées sur la même grille de cinq colonnes ; une liste
     du dessus prend une colonne, et les colonnes libres vont à Phase partielle puis à Phase, deux colonnes au plus (`s2`) */
  /* toutes les listes ont la même largeur, un tiers de la zone (même jour, Paulo : « la largeur des colonnes sera toujours identique à celle de Phase ») :
     grille de trois colonnes, une liste par colonne, une rangée trop longue passe à la ligne */
  const RG=(estC(pid)?CRITC:CRIT[dom]).map(rg=>rg.filter(k=>k!=='sub'||ouv));
  return RG.map(rg=>{ const s2=new Set();
    return '<div class="sgah-crit n3">'+rg.map(k=>{ const h=(()=>{ if(k==='per') return listePer(dom,pid); if(k==='fd') return listeOui(dom,pid,'fd'); if(k==='aff') return listeAff(dom,pid); const G=grouper(dom,filtrer(dom,pid,{sauf:k}),k), s=C[k]||new Set(), abs=[...s].filter(x=>!G.some(g=>g.k===x)).map(x=>({k:x,v:0}));
    return '<div class="sgah-cl"><h4><span>'+E(DIM[k].t)+(s.size?' · '+s.size:'')+'</span>'+(s.size?'<button type="button" data-fn="razd" data-dom="'+dom+'" data-d="'+k+'" title="Annuler la sélection">✕ effacer</button>':'')+'</h4><div class="l">'
      +[...G,...abs].filter(g=>g.v||s.has(g.k)).map(g=>'<div class="i'+(s.has(g.k)?' on':'')+(g.v?'':' z')+'" data-fn="crit" data-dom="'+dom+'" data-d="'+k+'" data-k="'+E(g.k)+'"><span title="'+E(DIM[k].l(g.k))+'">'+E(DIM[k].l(g.k))+'</span></div>').join('')+'</div></div>'; })(); return s2.has(k)?h.replace('<div class="sgah-cl','<div class="sgah-cl s2'):h; }).join('')+'</div>'; }).join(''); };

/* ── écritures : état des inscriptions et des notes de frais (un seul DS.commit), jamais en période bloquée, jamais hors du périmètre ── */
const SV={cours:false};
async function etat(dom,rows,v){ const tl=dom==='h', T=tl?'timelog':'projectcost', F=tl?'TIMELOGSTATECODE':'PROJECTCOSTSTATECODE', Vp=perim(dom), quoi=n=>tl?(n>1?'inscriptions':'inscription'):(n>1?'notes de frais':'note de frais');
  if(!ecrit(dom)){ toast('Lecture seule : votre profil ne permet pas de contrôler '+(tl?'les heures':'les frais')+'.',true); return false; }
  const L0=[...new Set(rows.map(r=>r&&String(r.ID)))].map(id=>id==null?null:DS.get(T,id)).filter(r=>r&&dansP(Vp,r.PROJECT_ID)), blo=new Set(tl?L0.filter(bloquee):[]), L=L0.filter(r=>!blo.has(r)&&(+r[F]||0)!==v);
  if(!L0.length){ toast('Ces positions ne font pas partie de vos affaires : elles ne sont pas modifiées.',true); return false; }
  if(!L.length){ toast(blo.size?(blo.size>1?blo.size+' inscriptions en période bloquée : elles ne sont pas modifiées.':'Inscription en période bloquée : elle n’est pas modifiée.'):'Rien à modifier : '+(L0.length>1?'elles sont':'elle est')+' déjà « '+String(TSTATE[v]||'').toLowerCase()+' ».',!!blo.size); return false; }
  if(SV.cours) return false; SV.cours=true;
  try{ await DS.commit(L.map(r=>({t:T,id:r.ID,val:{...r,[F]:v}}))); }catch(e){ if(!(e&&e.conflict)) console.error(e); redess(); return false; } finally{ SV.cours=false; }
  toast(L.length+' '+quoi(L.length)+' '+(v===3?'approuvée':v===1?'refusée':'réinitialisée')+(L.length>1?'s':'')+'.'+(blo.size?' '+blo.size+' en période bloquée, non modifiée'+(blo.size>1?'s':'')+'.':''));
  ST.sel.clear(); redess(); return true; }
/* approbation en lot : confirmée (une inscription approuvée n'est plus modifiable par le collaborateur) */
const approuverLot=(dom,rows,qui)=>{ const tl=dom==='h', L=rows.filter(r=>aC(tl?etT(r):etC(r))&&!(tl&&bloquee(r))); if(!L.length){ toast('Rien à approuver.'); return; } const v=L.reduce((s,r)=>s+vR(r,tl),0);
  sgConfirm('Approuver '+L.length+' '+(tl?'inscription'+(L.length>1?'s':'')+' à contrôler ('+Hh(v)+' h)':'note'+(L.length>1?'s':'')+' de frais à contrôler ('+F2(v)+' CHF)')+' — '+qui+' ?\n\n'+(tl?'Une inscription approuvée n’est plus modifiable par le collaborateur. ':'')+'« Réinitialiser » permet de revenir en arrière.',()=>etat(dom,L,3),{title:tl?'Approuver les heures':'Approuver les frais',yesText:'Approuver'}); };
const rec=(dom,id)=>DS.get(dom==='h'?'timelog':'projectcost',id);
const selRows=dom=>[...ST.sel].map(id=>rec(dom,id)).filter(Boolean);

/* ── cadre des pages : dessin, redessin sur place (défilements, recherche et sélection gardés) ── */
const IDS={[VC]:'centree',[VE]:'entree',[VF]:'fentree',[VM.ctlh]:'ctlh',[VM.anah]:'anah',[VM.ctlf]:'ctlf',[VM.anaf]:'anaf'};
const CUR={m:null,mod:'entree',ver:-1}, CTX={h:[],f:[],hs:[],aff:[]};   /* CTX : positions affichées (sélection, documents, copie, CSV) ; hs = toute la semaine */
const razSel=()=>{ ST.sel.clear(); ST.dern=null; };
const garderSel=L=>{ if(!ST.sel.size) return; const ok=new Set(L.map(r=>String(r.ID))); [...ST.sel].forEach(i=>{ if(!ok.has(i)) ST.sel.delete(i); }); };
const semDe=()=>ST.sem||(ST.sem=mondayOf(auj())), semLib=l=>'Semaine '+isoWeek(l)[1], semPer=l=>'du '+fC(l)+' au '+fD(jplus(l,6));
const rowsSem=(pid,l)=>{ const a=K(l), b=K(jplus(l,6)); return base('h',pid).filter(r=>{ const k=tlKey(r); return k>=a&&k<=b; }); };
const fmDe=()=>ST.fm||(ST.fm={y:auj().getFullYear(),m:auj().getMonth()}), fmAn=()=>ST.fmo==='annee', fmLib=f=>fmAn()?String(f.y):MOISL[f.m]+' '+f.y, rowsFm=(pid,f)=>base('f',pid).filter(r=>+r.DATEYEAR===f.y&&(fmAn()||+r.DATEMONTH===f.m));
const FMO=[['mois','Mois'],['annee','Année']];   /* contrôle des frais : un mois, ou toute l'année (16.11.2026) */
const cptH=L=>{ const c={h:0,n:L.length,ctl:0,hctl:0,blo:0,ref:0,ok:0,fa:0,fd:0,af:0,st:new Set()}; L.forEach(r=>{ const t=hh(r), e=etT(r); c.h+=t; if(aC(e)){ if(bloquee(r)) c.blo++; else { c.ctl++; c.hctl+=t; } } else if(e===1) c.ref++; else c.ok++;
  if(r.ISCHARGEABLE){ c.fa+=t; if(!r.ISCHARGED) c.af+=t; } if(r.ISCHARGED) c.fd+=t; c.st.add(r.STAFF_ID); }); return c; };
const cptF=L=>{ const c={v:0,n:L.length,ctl:0,ref:0,ok:0,fa:0,fd:0,rb:0,st:new Set()}; L.forEach(r=>{ const a=pcAmount(r), e=etC(r); c.v+=a; if(aC(e)) c.ctl++; else if(e===1) c.ref++; else c.ok++; if(r.ISCHARGEABLE) c.fa+=a; if(r.ISCHARGED) c.fd+=a; if(r.ISREFUNDABLE) c.rb+=a; c.st.add(r.STAFF_ID); }); return c; };
const derSem=pid=>{ let k=0; const lim=K(auj()); base('h',pid).forEach(r=>{ const x=tlKey(r); if(x<=lim&&x>k) k=x; }); return k?mondayOf(dK(k)):mondayOf(auj()); };
const derFm=pid=>{ let k=0; base('f',pid).forEach(r=>{ const x=kC(r); if(x>k) k=x; }); return k?{y:Math.floor(k/10000),m:Math.floor(k/100)%100}:{y:auj().getFullYear(),m:auj().getMonth()}; };
const aCtlH=pid=>memo('pa'+pid,()=>base('h',pid).filter(r=>aC(etT(r))&&!bloquee(r)));
const aCtlF=pid=>memo('pf'+pid,()=>base('f',pid).filter(r=>aC(etC(r))));
const choisir=pid=>{ const p=Pj(pid); ST.pid=p?p.ID:null; razSel(); ST.col=null; ST.jour=null; ST.crit={h:{},f:{}}; ST.fa={h:null,f:null}; ST.fd={h:null,f:null}; ST.sem=p?derSem(p.ID):null; ST.fm=p?derFm(p.ID):null; };
/* sujet des modules : l'affaire (ST.pid) ou, dans l'Analyse des heures des collaborateurs, le collaborateur (ST.sid, clé « c:<id> ») ; SP = objet « projet »
   pour les en-têtes des documents et rapports du moteur (« Collaborateur : <nom> ») */
const SK=()=>CUR.mod==='centree'?(ST.sid!=null?'c:'+ST.sid:null):ST.pid;
const SP=()=>{ if(CUR.mod!=='centree') return Pj(ST.pid); const s=ST.sid!=null?DS.get('staff',ST.sid):null; return s?{ID:null,NUMBER:'',TITLE:'Collaborateur : '+staffName(s),_sid:s.ID}:null; };
const choisirC=sid=>{ ST.sid=sid; razSel(); ST.col=null; ST.jour=null; ST.crit={h:{},f:{}}; ST.fd={h:null,f:null}; ST.sem=sid!=null?derSem('c:'+sid):null; };
const nomF=p=>p?(p.NUMBER||(p._sid!=null?sI(p._sid):p.ID)):'';
/* le paramètre de l'écran suit l'affaire choisie (reprise de session, historique) sans repasser par go */
const majArg=()=>{ try{ if(typeof VIEW==='undefined'||!VIEW||!IDS[VIEW.id]) return; const pe=VIEW.id===VE||VIEW.id===VF||VIEW.id===VC, e0=CUR.mod==='entree'||CUR.mod==='fentree'||CUR.mod==='centree'; if(pe&&!e0&&CUR.mod!=='affaire'&&CUR.mod!=='faffaire') return; const sj=CUR.mod==='centree'?ST.sid:ST.pid; const a=pe?(e0?(sj!=null||ST.amod?(sj!=null?String(sj):'')+(ST.amod?'|'+ST.amod:''):null):String(ST.aff)+(ST.amod?'|'+ST.amod:'')):ST.pid==null?null:String(ST.pid); VIEW.arg=a; nxLS.set('sg3_vue_arg',{id:VIEW.id,arg:a}); const t=NX.hist[NX.pos]; if(t&&t.id===VIEW.id) t.arg=a==null?undefined:a; }catch(_){ } };
const selZone=(dom,mode)=>{ const n=ST.sel.size, T=CTX[dom].length, ec=ecrit(dom), d=(n&&ec)?'':' disabled';
  return '<small>'+(n?num(n,0)+' choisie'+(n>1?'s':''):(mode==='ctl'?'cochez des lignes pour les traiter ensemble':'cochez des positions : « Fonctions » agit sur elles'))+'</small>'
    +bt('selTout',n&&n>=T?'Tout désélectionner':'Tout sélectionner','',' data-dom="'+dom+'"'+(T?'':' disabled'))
    +(mode==='ctl'?bt('apSel','Approuver','check',' data-dom="'+dom+'"'+d)+bt('rfSel','Refuser','',' data-dom="'+dom+'"'+d,'rg')+bt('rzSel','Réinitialiser','',' data-dom="'+dom+'"'+d):''); };
const selz=(dom,mode)=>'<span class="sgah-selz" data-selz="'+dom+'" data-mode="'+mode+'">'+selZone(dom,mode)+'</span>';
const majSel=pg=>pg.querySelectorAll('[data-selz]').forEach(z=>{ z.innerHTML=selZone(z.dataset.selz,z.dataset.mode); });
const titreSel=(t,dom,mode,avec)=>'<div class="sgah-t"><span>'+E(t)+'</span>'+(avec?selz(dom,mode):'')+'</div>';
const lecture=dom=>ecrit(dom)?'':'<div class="sgah-lect">Lecture seule : votre profil ne permet pas de contrôler ni de modifier '+(dom==='h'?'les heures':'les frais')+' des affaires.</div>';
/* case d'une ligne : la sélection se met à jour sur place (Maj + clic = de la dernière case à celle-ci) */
const coche=(pg,c,maj)=>{ const tb=c.closest('table'), B=[...tb.querySelectorAll('input[data-ck]')], i=B.indexOf(c), on=c.checked; let lot=[c];
  if(maj&&ST.dern!=null){ const j=B.findIndex(x=>x.dataset.ck===ST.dern); if(j>=0) lot=B.slice(Math.min(i,j),Math.max(i,j)+1); }
  lot.forEach(x=>{ x.checked=on; if(on) ST.sel.add(x.dataset.ck); else ST.sel.delete(x.dataset.ck); const tr=x.closest('tr'); if(tr) tr.classList.toggle('on',on); });
  ST.dern=c.dataset.ck; majSel(pg); };
function dessiner(m){ let R; try{ R=PAGES[CUR.mod](); }catch(e){ console.error(e); R='<div class="sgah-vide">Affichage impossible : '+E(e&&e.message||e)+'</div>'; }
  const pg=nxPage(m,'<div class="sgah">'+R+'</div>'); CUR.ver=VER; Object.assign(pg._fn,FN);
  pg.addEventListener('click',e=>{ const c=e.target.closest('input[data-ck]'); if(c&&pg.contains(c)) coche(pg,c,e.shiftKey); });
  pg.addEventListener('keydown',e=>{ const i=e.target.closest&&e.target.closest('input[data-pp]'); if(!i) return; if(e.key==='Enter'){ e.preventDefault(); FN.ppok(i); } else if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); FN.ppx(i); } });
  /* clic droit sur une position (inscriptions / notes de frais à cocher des critères) : « Modifier le statut « Facturable » … » et « … « Facturé » … » en tête du menu
     (26.11.2026, Paulo : « ajouter à la fonction bouton de droite ») — mêmes fenêtres que Fonctions ; position non cochée : elle seule est choisie, sinon la sélection
     reste ; plus de copie dans ce menu (même jour, Paulo : « supprimer » sur Copier les 2 lignes sélectionnées / Copier le tableau) */
  pg.addEventListener('contextmenu',e=>{ if(e.altKey||e.defaultPrevented) return; const tr=e.target.closest&&e.target.closest('tr[data-id]'), tb=tr&&tr.closest('table[data-dom]');
    if(!tb||!pg.contains(tb)||!tr.querySelector('input[data-ck]')) return; const d=tb.dataset.dom, id=String(tr.dataset.id);
    if(!ST.sel.has(id)){ ST.sel.clear(); ST.sel.add(id); ST.dern=id; tb.querySelectorAll('input[data-ck]').forEach(c=>{ const on=c.dataset.ck===id; c.checked=on; const r=c.closest('tr'); if(r) r.classList.toggle('on',on); }); majSel(pg); }
    const T=d==='h'?'timelog':'projectcost', S=selRows(d), n=S.length, ec=ecrit(d), o={selSet:new Set(S.map(r=>r.ID))};
    e.preventDefault(); sgMenuAt(e.clientX,e.clientY,[{t:'Modifier le statut « Facturable » …',dis:!n||!ec,fn:()=>ctlFlag(T,o,'ISCHARGEABLE')},{t:'Modifier le statut « Facturé » …',dis:!n||!ec,fn:()=>ctlFlag(T,o,'ISCHARGED')}],tr); });
  pg.addEventListener('dblclick',e=>{ const t=e.target.closest&&e.target.closest('tr[data-dbl]'); if(!t||!pg.contains(t)) return; e.preventDefault(); try{ const s=window.getSelection&&window.getSelection(); if(s) s.removeAllRanges(); }catch(_){ } ouvrirAna(t.dataset.id); });
  pg.addEventListener('dblclick',e=>{ if(e.target.closest('button,input,a,select,label')) return; const tr=e.target.closest('tr[data-id]'), tb=tr&&tr.closest('table[data-dom]'); if(!tb) return; const dom=tb.dataset.dom, r=rec(dom,tr.dataset.id); if(!r) return;
    try{ const s=window.getSelection&&window.getSelection(); if(s) s.removeAllRanges(); }catch(_){ }
    if(!ecrit(dom)){ toast('Lecture seule : votre profil ne permet pas de modifier '+(dom==='h'?'les heures':'les frais')+' des affaires.',true); return; }
    if(dom==='h') hsEdit(r); else editCost(r,{staff:r.STAFF_ID}); });
  const q=pg.querySelector('#sgah-q'); if(q){ const fl=()=>{ const s=q.value.trim().toLowerCase(); let n=0; const qc=!!pg.querySelector('[data-qc]'); pg.querySelectorAll('[data-q]').forEach(x=>{ const ok=!s||x.dataset.q.includes(s); x.style.display=ok?'':'none'; if(ok&&(!qc||x.dataset.qc)) n++; }); const c=pg.querySelector('#sgah-qn'); if(c) c.textContent=n+(qc?' collaborateur':' affaire')+(n>1?'s':''); };
    q.oninput=()=>{ ST.q=q.value; fl(); }; fl(); } }
const redess=()=>{ const m=CUR.m; if(!m||!m.isConnected||typeof VIEW==='undefined'||!VIEW||!IDS[VIEW.id]) return;
  const sc=[m,...m.querySelectorAll('.nx-page,.sgah-col .l,.sgah-cl .l,.sgah-x')].map(x=>[x.scrollTop,x.scrollLeft]), a=document.activeElement, q=a&&a.id==='sgah-q'?[a.selectionStart,a.selectionEnd]:null;
  m.innerHTML=''; dessiner(m); [m,...m.querySelectorAll('.nx-page,.sgah-col .l,.sgah-cl .l,.sgah-x')].forEach((x,i)=>{ const s=sc[i]; if(s){ if(s[0]) x.scrollTop=s[0]; if(s[1]) x.scrollLeft=s[1]; } });
  if(q){ const i=m.querySelector('#sgah-q'); if(i){ i.focus({preventScroll:true}); try{ i.setSelectionRange(q[0],q[1]); }catch(_){ } } } };

/* ── colonne des affaires (modules) : contrôle = à contrôler sur toute l'affaire ; analyse = heures ou montant de la période ── */
const colL=mod=>{ const dom=DOM[mod], tl=dom==='h', M=statsAff(mod==='ctlh'||mod==='ctlf'?{a:null,b:null}:periode());
  return affaires(dom).map(p=>({p,x:M.get(p.ID)||VIDE})).sort((a,b)=>(tl?b.x.der-a.x.der:b.x.fder-a.x.fder)||cmpN(b.p.NUMBER||'',a.p.NUMBER||'')); };
const colAff=(mod,sansQ)=>{ const tl=DOM[mod]==='h', L=colL(mod);
  const val=x=>mod==='ctlh'?(x.ctl?num(x.ctl,0)+' à contrôler':x.n?'contrôlé':'—'):mod==='anah'?(x.h?Hh(x.h)+' h':'—'):mod==='ctlf'?(x.fctl?num(x.fctl,0)+' à contrôler':x.fn?'contrôlé':'—'):(x.f?F0(x.f)+' CHF':'—');
  return '<div class="sgah-col"><div class="ct"><b>Affaires</b>'+bt('etatm',etatLib()+' ▾','',' title="État des affaires affichées"')+'</div>'+(sansQ?'':'<div class="q"><input class="inp" id="sgah-q" placeholder="Rechercher une affaire…" value="'+E(ST.q)+'" autocomplete="off"><span id="sgah-qn"></span></div>')+'<div class="l">'
    +L.map(({p,x})=>'<div class="sgah-it'+(String(p.ID)===String(ST.pid)?' on':'')+'" data-fn="aff" data-id="'+E(p.ID)+'" data-q="'+E(((p.NUMBER||'')+' '+(p.TITLE||'')).toLowerCase())+'" title="'+E([p.NUMBER,p.TITLE].filter(Boolean).join(' · '))+'"><span class="tx"><b>'+E(p.NUMBER||'')+'</b><span>'+E(p.TITLE||'')+'</span></span><span class="v'+((tl?x.n:x.fn)?'':' z')+'">'+E(val(x))+'</span></div>').join('')
    +(L.length?'':'<div class="sgah-vide">Aucune affaire « '+E(etatLib().toLowerCase())+' ».</div>')+'</div></div>'; };
const deux=(mod,html)=>'<div class="sgah-2c">'+colAff(mod)+'<div class="sgah-m">'+(Pj(ST.pid)?html():'<div class="sgah-vide">Choisissez une affaire dans la liste.</div>')+'</div></div>';

/* en-tête d'un module : bandeau de sa page, ou titre de section quand il est ouvert sous les tuiles de la page de l'affaire (emb, 25.11.2026) */
const ent=(emb,p,lb,meta)=>emb?(e0=>'<div class="sgah-et"><div><b>'+E(lb)+'</b>'+(meta?'<small>'+meta+'</small>':'')+'</div>'
      +bt('amodx',e0?(CUR.mod==='centree'?'Fermer · changer de collaborateur':'Fermer · changer d’affaire'):'Fermer','',' title="Refermer le module'+(e0?(CUR.mod==='centree'?' : la liste des collaborateurs revient pour en choisir un autre':' : la liste des affaires revient pour en choisir une autre'):'')+'"')+'</div>')(CUR.mod==='entree'||CUR.mod==='fentree'||CUR.mod==='centree')
  :tete(p.NUMBER||'',lb,p.TITLE||'',meta,bt('retaff','Analyse de l’affaire','prev',' title="Retour à la page « Analyse des heures » de l’affaire : chiffres et modules"'));

/* ── Contrôle des heures d'affaires ── */
const corpsCtlh=emb=>{ const p=Pj(ST.pid), lun=semDe(), L=rowsSem(ST.pid,lun), c=cptH(L), ec=ecrit('h'), pa=aCtlH(ST.pid).length; CTX.hs=L;
  if(ST.col!=null&&!L.some(r=>String(r.STAFF_ID)===String(ST.col))){ ST.col=null; ST.jour=null; }
  const Ld=L.filter(r=>(ST.col==null||String(r.STAFF_ID)===String(ST.col))&&(ST.jour==null||tlKey(r)===ST.jour)); CTX.h=Ld; garderSel(Ld);
  return ent(emb,p,'Contrôle des heures d’affaires · '+semLib(lun),E(semPer(lun)+(pa?' · '+num(pa,0)+' inscription'+(pa>1?'s':'')+' à contrôler sur l’affaire':' · tout est contrôlé sur cette affaire')))
    +kpis([kpi('Heures saisies',Hh(c.h)+'<small>h</small>',num(c.n,0)+' inscription'+(c.n>1?'s':'')),kpi('À contrôler',num(c.ctl,0),Hh(c.hctl)+' h'+(c.blo?' · '+c.blo+' en période bloquée':''),c.ctl?'':'pos'),kpi('Approuvées',num(c.ok,0),''),
      kpi('Refusées',num(c.ref,0),c.ref?'à corriger':'',c.ref?'neg':'','Inscriptions refusées : à corriger par le collaborateur'),kpi('Collaborateurs',String(c.st.size),'')])
    +lecture('h')
    +'<div class="sgah-bar">'+bt('sdec','','prev',' data-n="-1" title="Semaine précédente"')+'<span class="sgah-lbl">'+E(semLib(lun))+'</span>'+bt('sdec','','next',' data-n="1" title="Semaine suivante"')
      +bt('sder','Dernière saisie','today',' title="Semaine de la dernière inscription de l’affaire"')+bt('sctl','À contrôler','urgent',' title="Semaine précédente qui a des inscriptions à contrôler"'+(pa?'':' disabled'))
      +(ec?SEP+bt('apTout','Approuver la semaine','check',' data-dom="h" title="Approuver toutes les inscriptions à contrôler de la semaine"'+(c.ctl?'':' disabled')):'')
      +DR(bt('pres','Présentation ▾','list',' data-dom="h" title="Colonnes du tableau des inscriptions"')+bt('impr','Imprimer','print',' data-dom="h" title="Document des inscriptions de la semaine"'+(L.length?'':' disabled'))+bt('csv','CSV','export',' data-dom="h" title="Inscriptions de la semaine dans un fichier CSV"'+(L.length?'':' disabled')))+'</div>'
    +semaine(L,lun,{sid:ST.col,jour:ST.jour})
    +titreSel(ST.col!=null?'Inscriptions de '+sN(ST.col)+(ST.jour?' · '+fK(ST.jour):''):'Inscriptions de la semaine','h','ctl',ec&&Ld.length)
    +tabHeures(Ld,{ck:ec,act:ec,vide:L.length?'Aucune inscription pour ce choix.':'Aucune inscription cette semaine pour cette affaire.'}); };
const pageCtlh=()=>deux('ctlh',()=>corpsCtlh(false));
/* ── Contrôle des heures d'un collaborateur (Analyse des heures des collaborateurs, 26.11.2026) : sa semaine, affaire par affaire ; mêmes gestes ── */
const pLib=id=>{ const p=Pj(id); return p?[p.NUMBER,p.TITLE].filter(Boolean).join(' · '):'(sans affaire)'; };
const semaineC=(L,lun,o)=>{ o=o||{}; const J=[...Array(7)].map((_,i)=>jplus(lun,i)), ka=K(auj()), M=new Map(), ec=ecrit('h'); L.forEach(r=>{ const id=r.PROJECT_ID; let x=M.get(id); if(!x) M.set(id,x={j:new Map(),h:0,L:[]}); const k=tlKey(r); if(!x.j.has(k)) x.j.set(k,[]); x.j.get(k).push(r); x.h+=hh(r); x.L.push(r); });
  const P=[...M.keys()].sort((a,b)=>cmpN((Pj(a)||{}).NUMBER||'',(Pj(b)||{}).NUMBER||'')); if(!P.length) return '<div class="sgah-vide">Aucune inscription cette semaine pour ce collaborateur.</div>'; const tj=J.map(()=>0); let th=0;
  return '<div class="sgah-x"><table class="sgah-sem"><thead><tr><th>Affaire</th>'+J.map(d=>'<th class="'+(d.getDay()%6?'':'off')+(K(d)===ka?' auj':'')+'">'+JOURS[d.getDay()]+'<span class="n">'+d.getDate()+'</span></th>').join('')+'<th>Total</th><th>État</th><th></th></tr></thead><tbody>'
    +P.map(id=>{ const x=M.get(id), p=Pj(id)||{}, aAp=x.L.some(r=>aC(etT(r))&&!bloquee(r)); th+=x.h;
      return '<tr class="'+(String(o.pid)===String(id)?'on':'')+'"><td class="nom"><span><b>'+E(p.NUMBER||'')+'</b><br><small>'+E(p.TITLE||'')+'</small></span></td>'
      +J.map((d,i)=>{ const Lj=x.j.get(K(d))||[], h=Lj.reduce((t,r)=>t+hh(r),0); tj[i]+=h; return '<td class="j'+(d.getDay()%6?'':' off')+(Lj.length?'':' z')+(String(o.pid)===String(id)&&o.jour===K(d)?' on':'')+'" data-fn="cel" data-s="'+E(id)+'" data-k="'+K(d)+'"'+(Lj.length?' title="'+E(Lj.length+' inscription'+(Lj.length>1?'s':'')+' : cliquer pour les afficher seules')+'"':'')+'>'+(Lj.length?Hh(h)+pillL(Lj.map(etT)):'·')+'</td>'; }).join('')
      +'<td><b>'+Hh(x.h)+'</b> h</td><td>'+pillL(x.L.map(etT))+'</td><td>'+(ec&&aAp?bt('apP','Approuver','check',' data-p="'+E(id)+'" title="Approuver les inscriptions à contrôler de la semaine sur cette affaire"'):'')+'</td></tr>'; }).join('')
    +'<tr class="tot"><td>Total</td>'+tj.map(h=>'<td>'+(h?Hh(h):'')+'</td>').join('')+'<td>'+Hh(th)+' h</td><td></td><td></td></tr></tbody></table></div>'; };
const corpsCtlhC=emb=>{ const sk=SK(), lun=semDe(), L=rowsSem(sk,lun), c=cptH(L), ec=ecrit('h'), pa=aCtlH(sk).length, nP=new Set(L.map(r=>String(r.PROJECT_ID))).size; CTX.hs=L;
  if(ST.col!=null&&!L.some(r=>String(r.PROJECT_ID)===String(ST.col))){ ST.col=null; ST.jour=null; }
  const Ld=L.filter(r=>(ST.col==null||String(r.PROJECT_ID)===String(ST.col))&&(ST.jour==null||tlKey(r)===ST.jour)); CTX.h=Ld; garderSel(Ld);
  return ent(emb,SP(),'Contrôle des heures · '+semLib(lun),E(semPer(lun)+(pa?' · '+num(pa,0)+' inscription'+(pa>1?'s':'')+' à contrôler pour ce collaborateur':' · tout est contrôlé pour ce collaborateur')))
    +kpis([kpi('Heures saisies',Hh(c.h)+'<small>h</small>',num(c.n,0)+' inscription'+(c.n>1?'s':'')),kpi('À contrôler',num(c.ctl,0),Hh(c.hctl)+' h'+(c.blo?' · '+c.blo+' en période bloquée':''),c.ctl?'':'pos'),kpi('Approuvées',num(c.ok,0),''),
      kpi('Refusées',num(c.ref,0),c.ref?'à corriger':'',c.ref?'neg':'','Inscriptions refusées : à corriger par le collaborateur'),kpi('Affaires',String(nP),'')])
    +lecture('h')
    +'<div class="sgah-bar">'+bt('sdec','','prev',' data-n="-1" title="Semaine précédente"')+'<span class="sgah-lbl">'+E(semLib(lun))+'</span>'+bt('sdec','','next',' data-n="1" title="Semaine suivante"')
      +bt('sder','Dernière saisie','today',' title="Semaine de la dernière inscription du collaborateur"')+bt('sctl','À contrôler','urgent',' title="Semaine précédente qui a des inscriptions à contrôler"'+(pa?'':' disabled'))
      +(ec?SEP+bt('apTout','Approuver la semaine','check',' data-dom="h" title="Approuver toutes les inscriptions à contrôler de la semaine"'+(c.ctl?'':' disabled')):'')
      +DR(bt('pres','Présentation ▾','list',' data-dom="h" title="Colonnes du tableau des inscriptions"')+bt('impr','Imprimer','print',' data-dom="h" title="Document des inscriptions de la semaine"'+(L.length?'':' disabled'))+bt('csv','CSV','export',' data-dom="h" title="Inscriptions de la semaine dans un fichier CSV"'+(L.length?'':' disabled')))+'</div>'
    +semaineC(L,lun,{pid:ST.col,jour:ST.jour})
    +titreSel(ST.col!=null?'Inscriptions · '+pLib(ST.col)+(ST.jour?' · '+fK(ST.jour):''):'Inscriptions de la semaine','h','ctl',ec&&Ld.length)
    +tabHeures(Ld,{ck:ec,act:ec,cle:'ahc',vide:L.length?'Aucune inscription pour ce choix.':'Aucune inscription cette semaine pour ce collaborateur.'}); };

/* ── Critères d'analyse des heures / des frais ── */
const TRI=[['','tous'],['1','oui'],['0','non']];
const kpAnaH=L=>{ const c=cptH(L); return kpis([kpi('Heures',Hh(c.h)+'<small>h</small>',num(c.n,0)+' position'+(c.n>1?'s':'')),kpi('Facturables',Hh(c.fa)+'<small>h</small>',c.h?Math.round(c.fa/c.h*100)+' % des heures':''),kpi('Facturées',Hh(c.fd)+'<small>h</small>',c.fa?Math.round(c.fd/c.fa*100)+' % du facturable':''),
  kpi('À facturer',Hh(c.af)+'<small>h</small>','facturables non facturées'),coutOk()?kpi('Coût de revient',F0(cout(L))+'<small>CHF</small>','heures × taux internes'):'',kpi('À contrôler',num(c.ctl,0),c.blo?c.blo+' en période bloquée':'',c.ctl?'':'pos')]); };
const kpAnaF=L=>{ const c=cptF(L); return kpis([kpi('Frais',F0(c.v)+'<small>CHF</small>',num(c.n,0)+' note'+(c.n>1?'s':'')),kpi('Facturables',F0(c.fa)+'<small>CHF</small>',c.v?Math.round(c.fa/c.v*100)+' % du montant':''),kpi('Facturés',F0(c.fd)+'<small>CHF</small>',c.fa?Math.round(c.fd/c.fa*100)+' % du facturable':''),
  kpi('Remboursables',F0(c.rb)+'<small>CHF</small>','aux collaborateurs'),kpi('À contrôler',num(c.ctl,0),'',c.ctl?'':'pos')]); };
const corpsAna=(dom,emb)=>{ const sk=SK(), p=SP(), Pr=periode(), tl=dom==='h', L=filtrer(dom,sk), nT=base(dom,sk).length, g=''; CTX[dom]=L; garderSel(L);
  const nc=Object.values(ST.crit[dom]).reduce((s,x)=>s+(x?x.size:0),0)+(ST.fa[dom]!=null?1:0)+(ST.fd[dom]===0?1:0);
  /* ouvert sous les tuiles de la page d'entrée : ni titre ni chiffres du module, doublons du bandeau de l'affaire (25.11.2026, Paulo : « à supprimer car doublon avec
     l'en-tête ») — le module se referme par un second clic sur sa tuile */
  const e0=emb&&(CUR.mod==='entree'||CUR.mod==='fentree'||CUR.mod==='centree');
  const btns=DR(bt('pres','Présentation ▾','list',' data-dom="'+dom+'" title="Colonnes du tableau"')+bt('fonc','Fonctions ▾','gear',' data-dom="'+dom+'"')+bt('docs','Documents ▾','doc',' data-dom="'+dom+'"')+bt('rap','Rapports ▾','analyse',' data-dom="'+dom+'"'));
  return (e0?'':ent(emb,p,(tl?'Critères d’analyse des heures · ':'Critères d’analyse des frais · ')+Pr.lib,E(num(L.length,0)+' position'+(L.length>1?'s':'')+' sur '+num(nT,0)+(nc?' · '+nc+' critère'+(nc>1?'s':''):' · cochez des critères : les chiffres et le tableau suivent aussitôt')))
    +(tl?kpAnaH(L):kpAnaF(L)))+lecture(dom)
    +(e0?'':'<div class="sgah-bar sgah-sp"></div>')
    /* page d'entrée : sous les listes, une seule barre = la période à gauche, Présentation · Fonctions · Documents · Rapports à droite (25.11.2026, Paulo : « déplacer »
       les boutons à la place de la recherche ; la recherche, l'état des affaires et le CSV de la liste ne servent pas avec un module ouvert) */
    +listes(dom,sk)
    +'<div class="sgah-bar sgah-bar2 sgah-bcr">'+bt('raz','Effacer les critères','',' data-dom="'+dom+'" title="Effacer les critères choisis : listes, Facturable, Facturé (la période et l’affichage restent)"'+(nc?'':' disabled'))+btns+'</div>'
    +(g?pivot(dom,L,g,{prevu:tl&&g==='ph'?prevuPh(ST.pid):null})
       :titreSel(tl?'Inscriptions':'Notes de frais',dom,'ana',L.length>0)+(tl?tabHeures(L,{ck:1,cle:CUR.mod==='centree'?'ahc':'ahh',vide:'Aucune inscription pour ces critères.'}):tabFrais(L,{ck:1,vide:'Aucune note de frais pour ces critères.'}))); };
const pageAna=dom=>deux(dom==='h'?'anah':'anaf',()=>corpsAna(dom,false));

/* ── Contrôle des frais ── */
const corpsCtlf=emb=>{ const p=Pj(ST.pid), f=fmDe(), L0=rowsFm(ST.pid,f), S=[...new Set(L0.map(r=>r.STAFF_ID))].sort((a,b)=>cmpN(sN(a),sN(b))), c=cptF(L0), ec=ecrit('f'), pa=aCtlF(ST.pid).length;
  if(ST.col!=null&&!S.some(s=>String(s)===String(ST.col))) ST.col=null;
  const L=L0.filter(r=>ST.col==null||String(r.STAFF_ID)===String(ST.col)); CTX.f=L; garderSel(L);
  return ent(emb,p,'Contrôle des frais · '+fmLib(f),E('Notes de frais de l’affaire, '+(fmAn()?'année par année':'mois par mois')+(pa?' · '+num(pa,0)+' note'+(pa>1?'s':'')+' à contrôler sur l’affaire':' · tout est contrôlé sur cette affaire')))
    +kpis([kpi(fmAn()?'Frais de l’année':'Frais du mois',F0(c.v)+'<small>CHF</small>',num(c.n,0)+' note'+(c.n>1?'s':'')),kpi('Facturables',F0(c.fa)+'<small>CHF</small>',''),kpi('Remboursables',F0(c.rb)+'<small>CHF</small>','aux collaborateurs'),kpi('À contrôler',num(c.ctl,0),'',c.ctl?'':'pos'),kpi('Refusées',num(c.ref,0),'',c.ref?'neg':'')])
    +lecture('f')
    +'<div class="sgah-bar">'+txs('fmo',FMO,ST.fmo)+SEP+bt('fdec','','prev',' data-n="-1" title="'+(fmAn()?'Année précédente':'Mois précédent')+'"')+'<span class="sgah-lbl">'+E(fmLib(f))+'</span>'+bt('fdec','','next',' data-n="1" title="'+(fmAn()?'Année suivante':'Mois suivant')+'"')
      +bt('fder','Dernière note','today',' title="'+(fmAn()?'Année':'Mois')+' de la dernière note de frais de l’affaire"')+bt('fctl','À contrôler','urgent',' title="'+(fmAn()?'Année précédente':'Mois précédent')+' qui a des notes de frais à contrôler"'+(pa?'':' disabled'))
      +(S.length>1?SEP+'<span class="sgah-gl">Collaborateur</span>'+bt('col','tous','',' data-k=""',ST.col==null?'on':'')+S.map(s=>bt('col',sI(s),'',' data-k="'+E(s)+'" title="'+E(sN(s))+'"',String(ST.col)===String(s)?'on':'')).join(''):'')
      +(ec?SEP+bt('apTout',fmAn()?'Approuver l’année':'Approuver le mois','check',' data-dom="f" title="Approuver les notes de frais à contrôler affichées"'+(L.some(r=>aC(etC(r)))?'':' disabled')):'')
      +DR(bt('pres','Présentation ▾','list',' data-dom="f" title="Colonnes du tableau des notes de frais"')+bt('impr','Imprimer','print',' data-dom="f" title="Document des notes de frais affichées"'+(L.length?'':' disabled'))+bt('csv','CSV','export',' data-dom="f" title="Notes de frais affichées dans un fichier CSV"'+(L.length?'':' disabled')))+'</div>'
    +titreSel('Notes de frais · '+fmLib(f)+(ST.col!=null?' · '+sN(ST.col):''),'f','ctl',ec&&L.length)
    +tabFrais(L,{ck:ec,act:ec,vide:fmAn()?'Aucune note de frais cette année pour cette affaire.':'Aucune note de frais ce mois-ci pour cette affaire.'}); };
const pageCtlf=()=>deux('ctlf',()=>corpsCtlf(false));

/* ── page d'entrée : chiffres de la période, les affaires actives (un clic = page de l'affaire, ci-dessous) ; k = 'h' (Analyse des heures) ou 'f' (Analyse des frais,
   chapitre Notes de frais, 25.11.2026 : les frais ne sont plus dans l'Analyse des heures) ── */
/* heures : plus de tuile « Contrôle des heures d'affaires » (26.11.2026, Paulo : « et supprimer ») — « ID|ctlh » n'ouvre plus rien ici ; la page pleine
   nx-ah-ctlh reste (renvois d'Administration) */
const KND={h:{v:VE,ch:'Heures',t:'Analyse des heures d’affaires',mods:['anah']},f:{v:VF,ch:'Notes de frais',t:'Analyse des frais',mods:['ctlf','anaf']}};
/* liste des affaires tant qu'aucun module n'est ouvert (25.11.2026, Paulo : « affiche la liste des affaires, pas les frais, tant que je n'ai pas sélectionné
   critère ou contrôle ») : numéro, désignation, maître de l'ouvrage, statut, dernière saisie / note — les chiffres sont dans le bandeau et dans les modules ;
   un clic = page de l'affaire (ses chiffres et ses modules). Ancienne liste chiffrée : copie subgestion3/_backup_20261125_*_avant_liste_affaires_simple/. */
const tabAff=(L,k,sel,lim)=>{ const tl=k==='h'; if(!L.length) return '<div class="sgah-vide">Aucune affaire « '+E(etatLib().toLowerCase())+' » avec des '+(tl?'heures':'notes de frais')+' sur la période.</div>';
  /* liste des affaires des heures : clic droit sans « Copier la ligne » ni « Copier le tableau » (26.11.2026, Paulo : « supprimer ») */
  return '<div class="sgah-x'+(lim?' sgah-xs':'')+'"><table class="nx-tbl sgah-tb"'+(tl?' data-sans-copie="1"':'')+'><thead><tr><th>N°</th><th>Affaire</th><th>Maître de l’ouvrage</th><th>Statut</th><th>'+(tl?'Dernière saisie':'Dernière note')+'</th></tr></thead><tbody>'
    +L.map(({p,x,t})=>{ const m=mo(p), d=tl?(t||x).der:x.fder;
      const on=sel&&String(p.ID)===String(ST.pid), dbl=sel&&tl;
      /* heures : un double-clic ouvre les critères d'analyse de l'affaire (26.11.2026, Paulo : « lorsque je double clique sur l'affaire, j'entre directement dans
         les critères d'analyse ») ; data-dbl = la ligne s'ouvre par double-clic (« Ouvrir » du clic droit, sg3_plus.js) */
      return '<tr class="clic'+(on?' on':'')+'" data-fn="'+(sel?'affsel':'affp')+'"'+(dbl?' data-dbl="1"':'')+' data-id="'+E(p.ID)+'" data-q="'+E(((p.NUMBER||'')+' '+(p.TITLE||'')+' '+m).toLowerCase())+'" title="'+(dbl?'Double-clic : critères d’analyse des heures de l’affaire':sel?'Choisir cette affaire pour les modules':(tl?'Analyse des heures':'Analyse des frais')+' de l’affaire : ses chiffres et ses modules')+'">'
        +'<td class="nw"><b>'+E(p.NUMBER||'')+'</b></td><td>'+E(p.TITLE||'')+'</td><td>'+E(m)+'</td><td class="nw">'+(typeof nxStateTag==='function'?nxStateTag(p):E(projState(p)))+'</td><td class="nw">'+(d?fK(d):'')+'</td></tr>'; }).join('')+'</tbody></table></div>'; };
/* par collaborateur (25.11.2026, Paulo, page Analyse des frais : « trier par collaborateur ») : choix « Par affaire · Par collaborateur » dans le titre du
   tableau ; par collaborateur = une ligne par collaborateur (ses totaux, sur la trame bleu nuit pâle), ses affaires dessous (un clic = page de l'affaire,
   comme par affaire) ; un clic sur le collaborateur replie / déplie ses affaires ; mêmes affaires (état, périmètre) et même période que par affaire */
const statsCol=(Pr,k,ids)=>{ const tl=k==='h', M=new Map(), get=(sid,pid)=>{ const c0=String(sid); let c=M.get(c0); if(!c) M.set(c0,c={sid,x:Object.assign({},VIDE),A:new Map()});
    let a=c.A.get(pid); if(!a) c.A.set(pid,a=Object.assign({},VIDE)); return [c.x,a]; };
  if(tl) TL().forEach(r=>{ if(!ids.has(String(r.PROJECT_ID))) return; const kk=tlKey(r); if(!dans(kk,Pr)) return; const t=hh(r), e=etT(r), b=aC(e)&&bloquee(r);
    get(r.STAFF_ID,r.PROJECT_ID).forEach(x=>{ x.h+=t; x.n++; if(aC(e)){ if(b) x.blo++; else { x.ctl++; x.hctl+=t; } } else if(e===1) x.ref++; else x.ok++; if(r.ISCHARGEABLE){ x.fa+=t; if(!r.ISCHARGED) x.af+=t; } if(r.ISCHARGED) x.fd+=t; if(kk>x.der) x.der=kk; }); });
  else PC().forEach(r=>{ if(!ids.has(String(r.PROJECT_ID))) return; const kk=kC(r); if(!dans(kk,Pr)) return; const a=pcAmount(r), e=etC(r);
    get(r.STAFF_ID,r.PROJECT_ID).forEach(x=>{ x.f+=a; x.fn++; if(aC(e)) x.fctl++; else if(e===1) x.fref++; if(r.ISCHARGEABLE){ x.ffa+=a; if(!r.ISCHARGED) x.faf+=a; } if(r.ISREFUNDABLE) x.frb+=a; if(kk>x.fder) x.fder=kk; }); });
  const sans=c=>DS.get('staff',c.sid)?0:1;   /* saisies sans collaborateur : à la fin */
  return [...M.values()].sort((a,b)=>sans(a)-sans(b)||(tl?b.x.h-a.x.h:b.x.f-a.x.f)||cmp(sN(a.sid),sN(b.sid))); };
const cellsX=(x,tl)=>{ const td=v=>'<td class="r nw">'+v+'</td>', z=(n,s)=>n?num(n,0):s;
  return tl?td('<b>'+Hh(x.h)+'</b> h')+td(z(x.ctl,'<span style="color:var(--s-gris)">0</span>'))+td(x.ref?'<span style="color:var(--s-rouge)">'+num(x.ref,0)+'</span>':'')+td(x.af>0?Hh(x.af)+' h':'')+'<td class="nw">'+(x.der?fK(x.der):'')+'</td>'
    :td('<b>'+F0(x.f)+'</b>')+td(num(x.fn,0))+td(z(x.fctl,'<span style="color:var(--s-gris)">0</span>'))+td(x.fref?'<span style="color:var(--s-rouge)">'+num(x.fref,0)+'</span>':'')+td(x.faf>0?F0(x.faf):'')+td(x.frb>0?F0(x.frb):'')+'<td class="nw">'+(x.fder?fK(x.fder):'')+'</td>'; };
const nfPermis=sid=>{ try{ return ch08bMyStaffs().some(s=>String(s.ID)===String(sid)); }catch(_){ return false; } };
const tabCol=(G,k)=>{ const tl=k==='h'; if(!G.length) return '<div class="sgah-vide">Aucune affaire « '+E(etatLib().toLowerCase())+' » avec des '+(tl?'heures':'notes de frais')+' sur la période.</div>';
  return '<div class="sgah-x"><table class="nx-tbl sgah-tb sgah-tc"><thead><tr><th>Collaborateur · N°</th><th>Affaire</th>'+(tl?'<th class="r">Heures</th><th class="r">À contrôler</th><th class="r">Refusées</th><th class="r">À facturer</th><th>Dernière saisie</th>'
      :'<th class="r">Frais CHF</th><th class="r">Notes</th><th class="r">À contrôler</th><th class="r">Refusées</th><th class="r">À facturer CHF</th><th class="r">Remboursables CHF</th><th>Dernière note</th>')+'</tr></thead><tbody>'
    +G.map(c=>{ const sid=String(c.sid), pl=ST.plie.has(sid), conn=!!DS.get('staff',c.sid), nom=conn?sN(c.sid):'(sans collaborateur)', A=[...c.A].map(([pid,x])=>({p:Pj(pid)||{ID:pid},x})).sort((a,b)=>(tl?b.x.der-a.x.der:b.x.fder-a.x.fder)||cmpN(b.p.NUMBER||'',a.p.NUMBER||''));
      const qa=o=>((o.p.NUMBER||'')+' '+(o.p.TITLE||'')).toLowerCase(), qn=nom.toLowerCase();
      return '<tr class="sgah-cg'+(pl?' pl':'')+'" data-fn="colpl" data-sid="'+E(sid)+'" data-qc="1" data-q="'+E(qn+' '+A.map(qa).join(' '))+'" title="'+E((pl?'Déplier':'Replier')+' les affaires de '+nom)+'"><td colspan="2"><span class="sgah-cgn">'
          +'<span class="sgah-cv">'+nxSvg('next')+'</span>'+(conn?ini(c.sid):'')+'<b>'+E(nom)+'</b><small>'+A.length+' affaire'+(A.length>1?'s':'')+'</small>'
          +(!tl&&nfPermis(c.sid)?bt('colnf','Notes de frais','',' data-sid="'+E(sid)+'" title="Ouvrir les notes de frais de '+E(nom)+' (mois de la dernière note)"','sgah-cnf'):'')+'</span></td>'+cellsX(c.x,tl)+'</tr>'
        +A.map(o=>'<tr class="clic sgah-ca'+(pl?' ferme':'')+'" data-fn="affp" data-id="'+E(o.p.ID)+'" data-q="'+E(qa(o)+' '+qn)+'" title="'+(tl?'Analyse des heures':'Analyse des frais')+' de l’affaire : ses chiffres et ses modules"><td class="nw"><b>'+E(o.p.NUMBER||'')+'</b></td><td>'+E(o.p.TITLE||'')+'</td>'+cellsX(o.x,tl)+'</tr>').join(''); }).join('')
    +'</tbody></table></div>'; };
/* page d'entrée : uniquement les affaires « en cours » (26.11.2026, Paulo : liste « Statut des affaires » « supprimer, afficher dans la liste uniquement les affaires
   en cours ») ; le choix d'état des pages pleines des modules (colonne des affaires) n'est pas touché */
const pageEntree=k=>{ const e0=ST.etat; ST.etat=2; try{ return pageEntree0(k); } finally{ ST.etat=e0; } };
const pageEntree0=k=>{ const tl=k==='h', Pr=periode(), M=statsAff(Pr);
  /* heures : TOUTES les affaires « en cours » du périmètre, avec ou sans heures sur la période (26.11.2026, Paulo : « charge toutes les affaires ») ; dernière
     saisie et ordre d'après toutes les heures (t), les chiffres de l'affaire choisie restent ceux de la période (x) ; frais : affaires avec des notes sur la période */
  const Mt=tl?statsAff({a:null,b:null}):M;
  const A=affaires(k).map(p=>({p,x:M.get(p.ID)||VIDE,t:Mt.get(p.ID)||VIDE})).filter(o=>tl||o.x.fn).sort((a,b)=>(tl?b.t.der-a.t.der:b.x.fder-a.x.fder)||cmpN(b.p.NUMBER||'',a.p.NUMBER||'')); CTX.aff=A; CTX.affK=k; const em=ST.amod&&KND[k].mods.includes(ST.amod)?ST.amod:null, col=false, G=col?statsCol(Pr,k,new Set(A.map(o=>String(o.p.ID)))):null; CTX.col=G; CTX.par=ST.par[k];
  const T=Object.assign({},VIDE); A.forEach(o=>{ for(const q in T) if(q!=='der'&&q!=='fder') T[q]+=o.x[q]||0; });
  /* module ouvert : le bandeau porte l'affaire choisie — numéro en grand, désignation en titre ; chiffres et tuiles de cette affaire (25.11.2026, Paulo : « afficher ici le nom de l'affaire avec le numéro ») */
  if(em) selEntree(A,k); const pE=em?Pj(ST.pid):null, xE=pE?(M.get(pE.ID)||VIDE):null, dE=xE?(tl?xE.der:xE.fder):0, moE=pE?mo(pE):'';
  const U=xE||T;
  /* plus de choix de la période dans cette barre (26.11.2026, Paulo : « supprimer ») : la période se choisit dans la liste Période des Critères */
  const qE='<input class="inp" id="sgah-q" placeholder="'+(col?'Rechercher une affaire ou un collaborateur…':'Rechercher une affaire…')+'" value="'+E(ST.q)+'" autocomplete="off">', csvE=bt('csva','CSV','export',' title="'+(col?'Collaborateurs et leurs affaires':'Liste des affaires')+' dans un fichier CSV"'+(A.length?'':' disabled'));
  /* heures : CSV à gauche, recherche à droite (26.11.2026, Paulo : « inverser ») ; frais : recherche à gauche, CSV à droite */
  const barE='<div class="sgah-bar sgah-bar2'+(tl?' sgah-inv':'')+'">'+(tl?csvE+DR(qE):qE+DR(csvE))+'</div>', anaE=em==='anah'||em==='anaf';
  const figs='<div class="nx-kpis sg-tkp">'+(tl?kpi('Heures saisies',Hh(U.h)+'<small>h</small>',num(U.n,0)+' inscription'+(U.n>1?'s':''))+kpi('À contrôler',num(U.ctl,0),Hh(U.hctl)+' h'+(U.blo?' · '+num(U.blo,0)+' en période bloquée':''),U.ctl?'':'pos')
      +kpi('Refusées',num(U.ref,0),U.ref?'à corriger':'',U.ref?'neg':'','Inscriptions refusées : à corriger par les collaborateurs')+kpi('À facturer',Hh(U.af)+'<small>h</small>','facturables non facturées')
    :kpi('Frais',F0(U.f)+'<small>CHF</small>',num(U.fn,0)+' note'+(U.fn>1?'s':''))+kpi('À contrôler',num(U.fctl,0),U.fctl?(U.fctl>1?'notes de frais':'note de frais'):'',U.fctl?'':'pos')
      +kpi('Refusées',num(U.fref,0),U.fref?'à corriger':'',U.fref?'neg':'','Notes de frais refusées : à corriger par les collaborateurs')+kpi('À facturer',F0(U.faf)+'<small>CHF</small>','facturables non facturés'))
    +(pE?(tl?kpi('Facturées',Hh(U.fd)+'<small>h</small>','déjà facturées'):kpi('Remboursables',F0(U.frb)+'<small>CHF</small>','aux collaborateurs')):col?kpi('Collaborateurs',String(G.length),'avec des '+(tl?'heures':'notes de frais')+' sur la période'):kpi('Affaires',String(A.length),'avec des '+(tl?'heures':'notes de frais')+' sur la période'))+'</div>';
  /* sans affaire choisie (aucun module ouvert) : plus de chiffres sous le bandeau (26.11.2026, Paulo : « supprimer ») ; avec un module ouvert, ceux de l'affaire restent */
  /* bouton « ‹ Liste des affaires » dans le bandeau (heures) : juste avant la fermeture du bandeau, c.-à-d. le dernier </div> avant les chiffres */
  const retL=h=>{ if(!tl) return h; const i0=h.indexOf('<div class="nx-kpis'), j=h.lastIndexOf('</div>',(i0>=0?i0:h.lastIndexOf('</header>'))-1); if(j<0) return h;
    return h.slice(0,j)+'<div class="sgah-hact">'+bt('lista','Liste des affaires','prev',' title="Retour à la liste des affaires"')+'</div>'+h.slice(j); };
  return '<div class="sg-split">'+(pE?retL(sgTete(KND[k].t+' · '+Pr.lib,E(pE.TITLE||''),[moE?'Maître de l’ouvrage : '+E(moE):'',dE?(tl?'dernière saisie le ':'dernière note le ')+fK(dE):''].filter(Boolean).join(' · '),figs,pE.NUMBER||'')):(tl?sgTete(KND[k].ch,KND[k].t,'Analyser les heures des affaires, critère par critère. '+A.length+' affaire'+(A.length>1?'s':'')+' « '+E(etatLib().toLowerCase())+' ».','')
      :sgTete(KND[k].ch,KND[k].t,'Contrôler et analyser les notes de frais des affaires, mois par mois et critère par critère. <b>'+E(Pr.lib)+'</b> · '+A.length+' affaire'+(A.length>1?'s':'')+' « '+E(etatLib().toLowerCase())+' » avec des saisies.','',Pr.court)))
    /* les modules sont dans la page de l'affaire, ouverte par un clic sur sa ligne (25.11.2026, Paulo : « lorsque je clique sur une affaire, tu ouvres une page
       analyse de l'heure de cette affaire et tu appliques la possibilité de sélectionner les tuiles » ; ni fiche flottante ni tuiles dans la page du projet) */
    /* tuiles des deux modules (25.11.2026, Paulo : « rajoute les tuiles d'analyse dans l'analyse des heures également », « comme pour les heures les tuiles en
       lien avec frais », puis « lorsque je clique sur la tuile, ajouter les données en dessous sans changer de page ») : un clic affiche le module sous les
       tuiles, avec la colonne des affaires (une affaire choisie d'office) ; le tableau des affaires revient quand le module est refermé (second clic, « Fermer ») */
    /* heures : plus de tuiles (la tuile Critères seule, sans chiffre, puis plus de tuile du tout), la liste seule ; un double-clic sur une affaire ouvre ses critères
       d'analyse (26.11.2026, Paulo : « supprimer » sur « 6'423.5 h · 2026 », puis « supprimer les modules dans la page ») */
    +(tl?'':'<div class="sgah-t"><span>Modules</span><small>un clic affiche le module juste en dessous ; un second clic le referme</small></div><div class="sg-tiles sgah-tuiles">'
      /* critères d'analyse avant le contrôle (25.11.2026, Paulo : « déplacer, également pour les frais, les critères devant ») */
      +tuileE('anaf',F0(U.f)+' CHF · '+Pr.lib)+tuileE('ctlf',U.fctl?num(U.fctl,0)+' note'+(U.fctl>1?'s':'')+' à contrôler · '+Pr.lib:'tout est contrôlé · '+Pr.lib)+'</div>')
    /* barre de la période et des affaires sous les tuiles (25.11.2026, Paulo : « déplacer sous les critères ») ; critères ouverts : plus bas, entre les listes de
       critères et « Afficher », Présentation · Fonctions · Documents · Rapports à sa droite (même jour, Paulo : « déplacer ») — dessinée par corpsAna */
    +(anaE?'':barE)
    /* titre du tableau : « Affaires » seul (25.11.2026, Paulo : « supprimer » sur « Par collaborateur · 2026 » ; le code par collaborateur — statsCol, tabCol —
       reste, plus appelé) */
    /* module ouvert (25.11.2026, Paulo : « supprimer la liste, l'affaire doit être sélectionnée dans la liste des affaires dans analyse ») : la liste des affaires de
       la page reste (hauteur limitée, défilement) et choisit l'affaire du module, affiché dessous ; plus de colonne des affaires propre au module */
    /* puis (même jour, Paulo : « supprimer la liste dans critère ») : plus de liste sous les tuiles quand un module est ouvert — l'affaire se choisit dans la
       liste avant d'ouvrir le module (son numéro est dans le titre du module) ; « Fermer » ramène la liste */
    /* module ouvert : plus de ligne de l'affaire au-dessus du module — l'affaire est dans le bandeau (25.11.2026, Paulo : « ne plus afficher ici l'affaire ») */
    +(em?(selEntree(A,k),'<div class="sgah-emb" id="sgah-emb">'+(Pj(ST.pid)?CORPS[em](true):'<div class="sgah-vide">Choisissez une affaire dans la liste.</div>')+'</div>')
      /* sans module, un clic choisit l'affaire (25.11.2026, Paulo : « lorsque je clique, juste sélectionner ») — les tuiles ouvrent ensuite le module pour elle */
      :'<div class="sgah-t"><span>Affaires</span><span class="sgah-tr"><small>'+(()=>{ const o=A.find(o=>String(o.p.ID)===String(ST.pid)); return tl?'un double-clic ouvre les critères d’analyse de l’affaire':o?'affaire choisie : '+E(o.p.NUMBER||'')+' — ouvrez un module ci-dessus':'un clic choisit l’affaire des modules'; })()+'</small>'
      +(col&&G.length>1?(t=>bt('plt',t?'Tout déplier':'Tout replier','',' data-k="'+(t?0:1)+'"'))(G.every(c=>ST.plie.has(String(c.sid)))):'')+'<small id="sgah-qn"></small></span></div>'+(col?tabCol(G,k):tabAff(A,k,true,false)))+'</div>'; };
/* ── Analyse des heures des collaborateurs (nx-ahc, 26.11.2026, Paulo : « ajoute ici analyse des heures collaborateurs », choix « même principe, par collaborateur »,
   accès comme l'Analyse des heures d'affaires) : liste des collaborateurs qui ont des heures sur la période (affaires du périmètre) ; un clic le choisit ; tuiles
   Critères d'analyse (listes Affaire, Ouvrage, Phase, Phase partielle, Période, Facturé) et Contrôle des heures (sa semaine, affaire par affaire), affichés dessous ── */
const statsSt=Pr=>memo('ss'+(Pr.a?K(Pr.a):0)+'-'+(Pr.b?K(Pr.b):0),()=>{ const M=new Map(); TL().forEach(r=>{ const k=tlKey(r); if(!dans(k,Pr)||r.STAFF_ID==null) return; const s=String(r.STAFF_ID); let x=M.get(s); if(!x) M.set(s,x=Object.assign({},VIDE,{A:new Set()}));
  const t=hh(r), e=etT(r); x.h+=t; x.n++; x.A.add(String(r.PROJECT_ID)); if(aC(e)){ if(bloquee(r)) x.blo++; else { x.ctl++; x.hctl+=t; } } else if(e===1) x.ref++; else x.ok++; if(r.ISCHARGEABLE){ x.fa+=t; if(!r.ISCHARGED) x.af+=t; } if(r.ISCHARGED) x.fd+=t; if(k>x.der) x.der=k; }); return M; });
const parti=s=>+s.ISACTIVE===0||(!!s.QUITTINGDATE&&String(s.QUITTINGDATE).slice(0,10)<diso(auj()));
const tabSt=S=>{ if(!S.length) return '<div class="sgah-vide">Aucun collaborateur avec des heures sur la période.</div>';
  return '<div class="sgah-x"><table class="nx-tbl sgah-tb"><thead><tr><th>Collaborateur</th><th>Statut</th><th>Dernière saisie</th></tr></thead><tbody>'
    +S.map(({sid,s,x})=>'<tr class="clic'+(String(sid)===String(ST.sid)?' on':'')+'" data-fn="colsel" data-sid="'+E(sid)+'" data-qc="1" data-q="'+E((staffName(s)+' '+(s.INITIALS||'')).toLowerCase())+'" title="Choisir ce collaborateur pour les modules"><td>'+ini(s.ID)+' <b>'+E(staffName(s))+'</b></td><td class="nw">'+(parti(s)?'<span style="color:var(--s-gris)">a quitté le bureau</span>':'au bureau')+'</td><td class="nw">'+(x.der?fK(x.der):'')+'</td></tr>').join('')+'</tbody></table></div>'; };
const MOD_C={anah:['Critères d’analyse des heures','Les heures du collaborateur par affaire, ouvrage, phase et période ; statut Facturé, documents et rapports.','filter'],
  ctlh:['Contrôle des heures','La semaine du collaborateur, affaire par affaire : approuver, refuser, réinitialiser les inscriptions.','check']};
const tuileC=(mod,ft)=>{ const t=MOD_C[mod], on=ST.amod===mod; return '<div class="sg-tile'+(on?' on':'')+'" data-fn="amod" data-k="'+mod+'" aria-expanded="'+on+'" title="'+(on?'Refermer':'Afficher')+' « '+E(t[0])+' » sous les tuiles"><div class="ti">'+nxSvg(t[2])+'<h3>'+E(t[0])+'</h3></div><p>'+E(t[1])+'</p><div class="ft">'+E(ft)+nxSvg('arrow','go')+'</div></div>'; };
const CORPSC={anah:e=>corpsAna('h',e),ctlh:e=>corpsCtlhC(e)};
const selEntreeC=S=>{ if((ST.sid==null||!S.some(o=>String(o.sid)===String(ST.sid)))&&S.length) choisirC(S[0].s.ID); };
const pageEntreeC=()=>{ const Pr=periode(), M=statsSt(Pr), S=[...M.entries()].map(([sid,x])=>({sid,x,s:DS.get('staff',nId(sid))})).filter(o=>o.s).sort((a,b)=>cmpN(staffName(a.s),staffName(b.s))); CTX.st=S;
  const em=ST.amod&&MOD_C[ST.amod]?ST.amod:null; if(em) selEntreeC(S);
  const sE=em&&ST.sid!=null?DS.get('staff',ST.sid):null, xE=sE?(M.get(String(sE.ID))||Object.assign({},VIDE,{A:new Set()})):null;
  const T=Object.assign({},VIDE); S.forEach(o=>{ for(const q in T) if(q!=='der'&&q!=='fder') T[q]+=o.x[q]||0; }); const U=xE||T;
  const gel=sE&&sE.ISTIMELOGFROZEN&&sE.TIMELOGFREEZINGDATE?String(sE.TIMELOGFREEZINGDATE).slice(0,10):'';
  const figs=sE?'<div class="nx-kpis sg-tkp">'+kpi('Heures saisies',Hh(U.h)+'<small>h</small>',num(U.n,0)+' inscription'+(U.n>1?'s':''))+kpi('À contrôler',num(U.ctl,0),Hh(U.hctl)+' h'+(U.blo?' · '+num(U.blo,0)+' en période bloquée':''),U.ctl?'':'pos')
      +kpi('Refusées',num(U.ref,0),U.ref?'à corriger':'',U.ref?'neg':'','Inscriptions refusées : à corriger par le collaborateur')+kpi('À facturer',Hh(U.af)+'<small>h</small>','facturables non facturées')+kpi('Affaires',String(xE.A.size),'avec des heures sur la période')+'</div>':'';
  const barE='<div class="sgah-bar sgah-bar2"><input class="inp" id="sgah-q" placeholder="Rechercher un collaborateur…" value="'+E(ST.q)+'" autocomplete="off">'+DR(bt('csvc','CSV','export',' title="Liste des collaborateurs dans un fichier CSV"'+(S.length?'':' disabled')))+'</div>';
  return '<div class="sg-split">'+(sE?sgTete('Analyse des heures des collaborateurs · '+Pr.lib,E(staffName(sE)),[parti(sE)?'a quitté le bureau':(sE.JOININGDATE?'au bureau depuis le '+dfr(String(sE.JOININGDATE).slice(0,10)):''),xE.der?'dernière saisie le '+fK(xE.der):'',gel?'saisie bloquée jusqu’au '+dfr(gel):''].filter(Boolean).join(' · '),figs,sI(sE.ID))
      :sgTete('Heures','Analyse des heures des collaborateurs','Contrôler et analyser les heures des collaborateurs, semaine par semaine et critère par critère. <b>'+E(Pr.lib)+'</b> · '+S.length+' collaborateur'+(S.length>1?'s':'')+' avec des saisies.','',Pr.court))
    +'<div class="sgah-t"><span>Modules</span><small>un clic affiche le module juste en dessous ; un second clic le referme</small></div><div class="sg-tiles sgah-tuiles">'
      +tuileC('anah',Hh(U.h)+' h · '+Pr.lib)+tuileC('ctlh',U.ctl?num(U.ctl,0)+' inscription'+(U.ctl>1?'s':'')+' à contrôler · '+Pr.lib:'tout est contrôlé · '+Pr.lib)+'</div>'
    +(em?'<div class="sgah-emb" id="sgah-emb">'+(sE?CORPSC[em](true):'<div class="sgah-vide">Choisissez un collaborateur dans la liste.</div>')+'</div>'
      :barE+'<div class="sgah-t"><span>Collaborateurs</span><span class="sgah-tr"><small>'+(()=>{ const o=S.find(o=>String(o.sid)===String(ST.sid)); return o?'collaborateur choisi : '+E(staffName(o.s))+' — ouvrez un module ci-dessus':'un clic choisit le collaborateur des modules'; })()+'</small><small id="sgah-qn"></small></span></div>'+tabSt(S))+'</div>'; };
/* affaire du module ouvert sur la page d'entrée : celle choisie, sinon la première de la liste */
const selEntree=(A,k)=>{ if((ST.pid==null||!Pj(ST.pid)||!permisP(k,ST.pid))&&A.length) choisir(A[0].p.ID); };
/* ancienne présentation (colonne des affaires propre au module), plus appelée depuis le 25.11.2026 */
const embEntree=(k,em)=>{ const L=colL(em); if(!L.some(o=>String(o.p.ID)===String(ST.pid))){ const o=L.find(o=>k==='h'?o.x.n:o.x.fn)||L[0]; if(o) choisir(o.p.ID); }
  return '<div class="sgah-emb" id="sgah-emb"><div class="sgah-2c">'+colAff(em,true)+'<div class="sgah-m">'+(Pj(ST.pid)?CORPS[em](true):'<div class="sgah-vide">Choisissez une affaire dans la liste.</div>')+'</div></div></div>'; };
/* ── page de l'affaire (nx-ah / nx-af, arg = identifiant de l'affaire) : bandeau, chiffres de la période, les deux modules en tuiles, le module choisi affiché dessous ── */
const MOD_T={ctlh:['Contrôle des heures d’affaires','La semaine de l’affaire, collaborateur par collaborateur : approuver, refuser, réinitialiser les inscriptions.','check'],
  anah:['Critères d’analyse des heures','Les heures de l’affaire par ouvrage, prestation, phase et collaborateur ; statut Facturable / Facturé, documents et rapports.','filter'],
  ctlf:['Contrôle des frais','Les notes de frais de l’affaire, par mois ou par année : approuver, refuser, réinitialiser.','receipt'],
  anaf:['Critères d’analyse des frais','Les frais de l’affaire par genre de frais, phase et collaborateur ; statut Facturable / Facturé, documents et rapports.','coins']};
const tuile=(mod,ft,id)=>{ const t=MOD_T[mod], on=ST.amod===mod; return '<div class="sg-tile'+(on?' on':'')+'" data-fn="amod" data-k="'+mod+'" aria-expanded="'+on+'" title="'+(on?'Refermer':'Afficher')+' « '+E(t[0])+' » sous les tuiles"><div class="ti">'+nxSvg(t[2])+'<h3>'+E(t[0])+'</h3></div><p>'+E(t[1])+'</p><div class="ft">'+ft+nxSvg('arrow','go')+'</div></div>'; };
const tuileE=(mod,ft)=>{ const t=MOD_T[mod], on=ST.amod===mod; return '<div class="sg-tile'+(on?' on':'')+'" data-fn="amod" data-k="'+mod+'" aria-expanded="'+on+'" title="'+(on?'Refermer':'Afficher')+' « '+E(t[0])+' » sous les tuiles"><div class="ti">'+nxSvg(t[2])+'<h3>'+E(t[0])+'</h3></div><p>'+E(t[1].replace(/ de l’affaire/,' des affaires'))+'</p><div class="ft">'+E(ft)+nxSvg('arrow','go')+'</div></div>'; };
const mo=p=>{ try{ return [...new Set(DS.by('projectmember','PROJECT_ID',p.ID).filter(x=>x.TEAMROLECODE===8&&x.CONTACT_ID!=null).map(x=>contactName(DS.get('contact',x.CONTACT_ID))).filter(Boolean))].join(', '); }catch(_){ return ''; } };   /* maître de l'ouvrage : même règle que l'en-tête du tableau de bord du projet */
const CORPS={ctlh:e=>corpsCtlh(e),anah:e=>corpsAna('h',e),ctlf:e=>corpsCtlf(e),anaf:e=>corpsAna('f',e)};
const pageAff=k=>{ const tl=k==='h', p=Pj(ST.aff), Pr=periode(), x=statsAff(Pr).get(p.ID)||VIDE, t=statsAff({a:null,b:null}).get(p.ID)||VIDE, m=mo(p), der=tl?t.der:t.fder, nc=tl?t.ctl:t.fctl;
  return tete(p.NUMBER||'',KND[k].t+' · '+Pr.lib,p.TITLE||'',E([m,der?(tl?'dernière saisie le ':'dernière note le ')+fK(der):(tl?'aucune saisie':'aucune note de frais'),nc?num(nc,0)+' '+(tl?'inscription':'note')+(nc>1?'s':'')+(tl?'':' de frais')+' à contrôler sur l’affaire':'tout est contrôlé sur l’affaire'].filter(Boolean).join(' · ')),
      bt('entree','Toutes les affaires','prev',' title="Retour à la liste des affaires de l’'+E(KND[k].t)+'"'))
    +kpis(tl?[kpi('Heures saisies',Hh(x.h)+'<small>h</small>',num(x.n,0)+' inscription'+(x.n>1?'s':'')),kpi('À contrôler',num(x.ctl,0),Hh(x.hctl)+' h'+(x.blo?' · '+num(x.blo,0)+' en période bloquée':''),x.ctl?'':'pos'),
      kpi('Refusées',num(x.ref,0),x.ref?'à corriger':'',x.ref?'neg':'','Inscriptions refusées : à corriger par les collaborateurs'),kpi('À facturer',Hh(x.af)+'<small>h</small>','facturables non facturées'),kpi('Facturées',Hh(x.fd)+'<small>h</small>','déjà facturées')]
     :[kpi('Frais',F0(x.f)+'<small>CHF</small>',num(x.fn,0)+' note'+(x.fn>1?'s':'')),kpi('À contrôler',num(x.fctl,0),'',x.fctl?'':'pos'),kpi('Refusées',num(x.fref,0),x.fref?'à corriger':'',x.fref?'neg':'','Notes de frais refusées : à corriger par les collaborateurs'),
      kpi('À facturer',F0(x.faf)+'<small>CHF</small>','facturables non facturés'),kpi('Remboursables',F0(x.frb)+'<small>CHF</small>','aux collaborateurs')])
    +'<div class="sgah-bar">'+barPer(Pr)+'</div>'
    +'<div class="sgah-t"><span>Modules</span><small>un clic affiche le module juste en dessous ; un second clic le referme</small></div>'
    +'<div class="sg-tiles sgah-tuiles">'
      +(tl?tuile('anah',Hh(x.h)+' h · '+Pr.lib,p.ID)+tuile('ctlh',t.ctl?num(t.ctl,0)+' inscription'+(t.ctl>1?'s':'')+' à contrôler':'tout est contrôlé',p.ID)
          :tuile('anaf',F0(x.f)+' CHF · '+Pr.lib,p.ID)+tuile('ctlf',t.fctl?num(t.fctl,0)+' note'+(t.fctl>1?'s':'')+' à contrôler':'tout est contrôlé',p.ID))+'</div>'
    +(ST.amod&&KND[k].mods.includes(ST.amod)?'<div class="sgah-emb" id="sgah-emb">'+CORPS[ST.amod](true)+'</div>':''); };
const PAGES={centree:()=>pageEntreeC(),entree:()=>pageEntree('h'),fentree:()=>pageEntree('f'),affaire:()=>pageAff('h'),faffaire:()=>pageAff('f'),ctlh:pageCtlh,anah:()=>pageAna('h'),ctlf:pageCtlf,anaf:()=>pageAna('f')};

/* ── gestes ── */
/* module ouvert sous les tuiles : défilement seulement s'il commence trop bas pour être vu */
const ouvrirAna=id=>{ const p=Pj(id); if(!p||!permisP('h',p.ID)) return;
  /* affaire sans heure sur la période choisie (la liste les montre toutes depuis le 26.11.2026) : critères ouverts sur « Toutes les années » plutôt que vides */
  const x=statsAff(periode()).get(p.ID); if(!x||!x.n){ ST.per.mode='tout'; ST.per.d=null; garder(); }
  go(VE,String(p.ID)+'|anah'); };
const voirEmb=()=>{ try{ const e=CUR.m&&CUR.m.querySelector('#sgah-emb'); if(!e) return; const r=e.getBoundingClientRect(); if(r.top>window.innerHeight-160) e.scrollIntoView({block:'start',behavior:'smooth'}); }catch(_){ } };
const nId=s=>s===''||s==null?null:(isNaN(+s)?s:+s);
const moisCle=r=>(+r.DATEYEAR)*100+(+r.DATEMONTH);
const ctxDoc=p=>{ try{ if(p&&p.ID!=null&&typeof ch11dCtlCtx==='function') ch11dCtlCtx(p); }catch(_){ } };
const FN={
  pres:b=>{ catAh(); sgtabMenu(b.dataset.dom==='f'?'ahf':CUR.mod==='centree'?'ahc':'ahh',b,redess); },
  colsel:b=>{ const s=nId(b.dataset.sid); if(String(s)===String(ST.sid)) return; choisirC(s); razSel(); majArg(); redess(); },
  apP:b=>{ const p=b.dataset.p; approuverLot('h',CTX.hs.filter(r=>String(r.PROJECT_ID)===String(p)),pLib(nId(p))+', '+semLib(semDe()).toLowerCase()); },
  pmode:b=>{ ST.per.mode=b.dataset.k; garder(); razSel(); redess(); },
  perk:b=>{ const k=b.dataset.k; ST.ppOuvert=false; if(k==='tout'||k==='12m'){ ST.per.mode=k; ST.per.d=null; } else if(k[0]==='a'){ ST.per.mode='annee'; ST.per.d=new Date(+k.slice(1),0,1); } else { const c=+k.slice(1); ST.per.mode='mois'; ST.per.d=new Date(Math.floor(c/100),c%100,1); } garder(); razSel(); redess(); },
  perl:b=>{ ST.perL=b.dataset.k; redess(); },
  ppo:b=>{ ST.ppOuvert=!ST.ppOuvert; redess(); if(ST.ppOuvert) setTimeout(()=>{ const i=CUR.m&&CUR.m.querySelector('input[data-pp="a"]'); if(i) i.focus(); },0); },
  ppx:b=>{ ST.ppOuvert=false; redess(); },
  ppok:b=>{ const z=b.closest('.sgah-pp')||(CUR.m&&CUR.m.querySelector('.sgah-pp')); if(!z) return; const v=k=>{ const x=z.querySelector('input[data-pp="'+k+'"]').value; return x?new Date(x+'T00:00:00'):null; };
    let a=v('a'), c=v('b'); if(a&&c&&a>c) [a,c]=[c,a]; ST.per.a=a; ST.per.b=c; ST.per.d=null; ST.per.mode=a||c?'perso':'tout'; ST.ppOuvert=false; garder(); razSel(); redess(); }, pdec:b=>{ perDec(+b.dataset.n); razSel(); redess(); },
  aff:b=>{ if(String(b.dataset.id)===String(ST.pid)) return; choisir(b.dataset.id); majArg(); redess(); },
  affsel:b=>{ if(String(b.dataset.id)===String(ST.pid)) return; choisir(b.dataset.id); razSel(); majArg();
    if(b.dataset.dbl!=null){ const tb=b.closest('tbody'); if(tb) tb.querySelectorAll('tr.on').forEach(x=>x.classList.remove('on')); b.classList.add('on'); return; } redess(); },
  /* retour du module à la liste des affaires (heures) */
  lista:()=>go(VE,ST.pid!=null?String(ST.pid):undefined),
  mod:b=>{ go(VM[b.dataset.k],b.dataset.id!=null&&b.dataset.id!==''?b.dataset.id:undefined); },
  affp:b=>go(CUR.mod==='fentree'?VF:VE,String(b.dataset.id)), entree:()=>go(CUR.mod==='faffaire'?VF:VE), retaff:()=>{ if(ST.pid!=null) go(DOM[CUR.mod]==='f'?VF:VE,String(ST.pid)+'|'+CUR.mod); },
  amod:b=>{ const k=b.dataset.k, ouvre=ST.amod!==k; ST.amod=ouvre?k:null; razSel(); ST.col=null; ST.jour=null; majArg(); redess(); if(ouvre) voirEmb(); },
  amodx:()=>{ ST.amod=null; razSel(); majArg(); redess(); },
  modgo:b=>{ if(VM[b.dataset.k]) go(VM[b.dataset.k]); },
  par:b=>{ ST.par[CUR.mod==='fentree'?'f':'h']=b.dataset.k==='col'?'col':'aff'; garder(); redess(); },
  colpl:b=>{ const sid=String(b.dataset.sid); if(ST.plie.has(sid)) ST.plie.delete(sid); else ST.plie.add(sid); redess(); },
  plt:b=>{ if(b.dataset.k==='1') (CTX.col||[]).forEach(c=>ST.plie.add(String(c.sid))); else ST.plie.clear(); redess(); },
  colnf:b=>{ const c=(CTX.col||[]).find(x=>String(x.sid)===String(b.dataset.sid)); if(!c||typeof NF==='undefined') return; const d=c.x.fder?dK(c.x.fder):new Date();
    NF.staff=c.sid; NF.y=d.getFullYear(); NF.m=d.getMonth(); go('frais'); },
  etatm:b=>popMenu(b,[{t:'Toutes',chk:!ST.etat,fn:()=>{ ST.etat=0; garder(); redess(); }},...CTL_ETATS.map(([e,t])=>({t,chk:ST.etat===e,fn:()=>{ ST.etat=e; garder(); redess(); }}))]),
  /* semaine (heures) et mois (frais) */
  sdec:b=>{ ST.sem=jplus(semDe(),7*(+b.dataset.n)); ST.col=null; ST.jour=null; razSel(); redess(); },
  sder:()=>{ ST.sem=derSem(SK()); ST.col=null; ST.jour=null; razSel(); redess(); },
  sctl:()=>{ const cur=K(semDe()), W=[...new Set(aCtlH(SK()).map(r=>K(mondayOf(tlDate(r)))))].sort((a,b)=>a-b); if(!W.length){ toast(CUR.mod==='centree'?'Aucune inscription à contrôler pour ce collaborateur.':'Aucune inscription à contrôler pour cette affaire.'); return; }
    const av=W.filter(k=>k<cur); ST.sem=dK(av.length?av[av.length-1]:W[W.length-1]); ST.col=null; ST.jour=null; razSel(); redess(); },
  fmo:b=>{ ST.fmo=b.dataset.k==='annee'?'annee':'mois'; garder(); razSel(); redess(); },
  fdec:b=>{ const f=fmDe(), d=fmAn()?new Date(f.y+(+b.dataset.n),f.m,1):new Date(f.y,f.m+(+b.dataset.n),1); ST.fm={y:d.getFullYear(),m:d.getMonth()}; razSel(); redess(); },
  fder:()=>{ ST.fm=derFm(ST.pid); razSel(); redess(); },
  fctl:()=>{ const f=fmDe(), an=fmAn(), cur=an?f.y:f.y*100+f.m, W=[...new Set(aCtlF(ST.pid).map(r=>an?+r.DATEYEAR:moisCle(r)))].sort((a,b)=>a-b); if(!W.length){ toast('Aucune note de frais à contrôler pour cette affaire.'); return; }
    const av=W.filter(k=>k<cur), k=av.length?av[av.length-1]:W[W.length-1]; ST.fm=an?{y:k,m:(ST.fm||{m:0}).m}:{y:Math.floor(k/100),m:k%100}; razSel(); redess(); },
  cel:b=>{ const s=nId(b.dataset.s), k=+b.dataset.k; if(String(ST.col)===String(s)&&ST.jour===k){ ST.col=null; ST.jour=null; } else { ST.col=s; ST.jour=k; } razSel(); redess(); },
  col:b=>{ ST.col=nId(b.dataset.k); ST.jour=null; razSel(); redess(); },
  /* état des inscriptions et des notes de frais */
  ap1:b=>{ const d=b.dataset.dom, r=rec(d,b.dataset.id); if(r) etat(d,[r],(d==='h'?etT(r):etC(r))===3?0:3); },
  rf1:b=>{ const d=b.dataset.dom, r=rec(d,b.dataset.id); if(r) etat(d,[r],(d==='h'?etT(r):etC(r))===1?0:1); },
  apSel:b=>etat(b.dataset.dom,selRows(b.dataset.dom),3), rfSel:b=>etat(b.dataset.dom,selRows(b.dataset.dom),1), rzSel:b=>etat(b.dataset.dom,selRows(b.dataset.dom),0),
  apS:b=>{ const s=b.dataset.s; approuverLot('h',CTX.hs.filter(r=>String(r.STAFF_ID)===String(s)),sN(nId(s))+', '+semLib(semDe()).toLowerCase()); },
  apTout:b=>{ const d=b.dataset.dom, p=SP(); approuverLot(d,d==='h'?CTX.hs:CTX.f,(p&&(p.NUMBER||p.TITLE)?(p.NUMBER||p.TITLE)+', ':'')+(d==='h'?semLib(semDe()).toLowerCase():fmLib(fmDe()).toLowerCase()+(ST.col!=null?', '+sN(ST.col):''))); },
  selTout:b=>{ const L=CTX[b.dataset.dom]||[]; if(L.length&&ST.sel.size>=L.length) razSel(); else L.forEach(r=>ST.sel.add(String(r.ID))); redess(); },
  /* critères d'analyse */
  crit:b=>{ const C=ST.crit[b.dataset.dom], k=b.dataset.d, s=C[k]||(C[k]=new Set()); if(s.has(b.dataset.k)) s.delete(b.dataset.k); else s.add(b.dataset.k); if(!s.size) delete C[k]; razSel(); redess(); },
  razd:b=>{ delete ST.crit[b.dataset.dom][b.dataset.d]; razSel(); redess(); },
  raz:b=>{ const d=b.dataset.dom; ST.crit[d]={}; ST.fa[d]=null; ST.fd[d]=null; razSel(); redess(); },
  trs:b=>{ ST[b.dataset.c][b.dataset.dom]=b.dataset.k===''?null:+b.dataset.k; razSel(); redess(); },
  grp:b=>{ ST.grp[b.dataset.dom]=b.dataset.k; razSel(); redess(); },
  /* fonctions, documents et rapports : fenêtres et impressions du moteur */
  /* Fonctions : copie et CSV seulement — « Modifier le statut « Facturable » / « Facturé » … » et « Modifier le commentaire … » retirés (26.11.2026, Paulo : « supprimer » ;
     les statuts restent au clic droit sur une position, le commentaire dans la fenêtre de l'inscription, double-clic) ; heures et frais */
  fonc:b=>{ const d=b.dataset.dom, p=SP(), L=CTX[d]; if(!p) return;
    popMenu(b,[
      {t:'Copier les positions dans le presse-papier',dis:!L.length,fn:()=>copyTable(grille(d,L))},{t:'Exporter les positions en CSV …',dis:!L.length,fn:()=>csvTable(grille(d,L),(d==='h'?'Analyse_heures_':'Analyse_frais_')+nomF(p))}]); },
  docs:b=>{ const d=b.dataset.dom, tl=d==='h', T=tl?'timelog':'projectcost', p=SP(), L=CTX[d], S=selRows(d), F=filtreMoteur(d); if(!p) return;
    popMenu(b,[{t:'Établir le document d’analyse …',dis:!L.length,fn:()=>{ ctxDoc(p); ctlPrint(p,T,grilleDoc(d,L)); }},{t:'Document des positions choisies …',dis:!S.length,fn:()=>{ ctxDoc(p); ctlPrint(p,T,grilleDoc(d,S)); }},
      ...(tl&&coutOk()?['-',{t:'Établir le document d’analyse des collaborateurs …',dis:!L.length,fn:()=>ctlStaffReport(p,grille(d,L).view,F)},{t:'Document des collaborateurs pour les positions choisies …',dis:!S.length,fn:()=>ctlStaffReport(p,grille(d,S).view,F)}]:[])]); },
  rap:b=>{ const d=b.dataset.dom, T=d==='h'?'timelog':'projectcost', p=SP(), L=CTX[d], S=selRows(d), F=filtreMoteur(d); if(!p) return;
    popMenu(b,[{t:'Afficher le rapport …',dis:!L.length,fn:()=>ctlReport(p,T,grille(d,L).view,F)},{t:'Rapport des positions choisies …',dis:!S.length,fn:()=>ctlReport(p,T,grille(d,S).view,F)},'-',
      {t:'Grouper …',dis:!L.length,fn:()=>ctlSummary(p,T,grille(d,L).view,F)},{t:'Grouper les positions choisies …',dis:!S.length,fn:()=>ctlSummary(p,T,grille(d,S).view,F)}]); },
  impr:b=>{ const d=b.dataset.dom, p=SP(), L=d==='h'?CTX.hs:CTX.f; if(!p||!L.length) return; ctxDoc(p); ctlPrint(p,d==='h'?'timelog':'projectcost',grilleDoc(d,L)); },
  csv:b=>{ const d=b.dataset.dom, p=SP(), L=d==='h'?CTX.hs:CTX.f; if(!p||!L.length) return; const f=fmDe();
    csvTable(grille(d,L),(d==='h'?'Controle_heures_':'Controle_frais_')+nomF(p)+'_'+(d==='h'?'S'+isoWeek(semDe())[1]+'_'+isoWeek(semDe())[0]:(fmAn()?String(f.y):f.y+'-'+String(f.m+1).padStart(2,'0')))); },
  csvc:()=>{ const L=CTX.st||[]; if(!L.length) return; const n2=v=>(Math.round((+v||0)*100)/100).toFixed(2);
    csvTable({cols:[{k:'c',t:'Collaborateur',f:o=>esc(staffName(o.s))},{k:'i',t:'Initiales',f:o=>esc(o.s.INITIALS||'')},{k:'h',t:'Heures',f:o=>n2(o.x.h)},{k:'a',t:'Affaires',f:o=>String(o.x.A.size)},{k:'c2',t:'Inscriptions à contrôler',f:o=>String(o.x.ctl)},
      {k:'r',t:'Refusées',f:o=>String(o.x.ref)},{k:'fa',t:'Heures facturables',f:o=>n2(o.x.fa)},{k:'fd',t:'Heures facturées',f:o=>n2(o.x.fd)},{k:'af',t:'Heures à facturer',f:o=>n2(o.x.af)},{k:'d',t:'Dernière saisie',f:o=>o.x.der?fK(o.x.der):''}],view:L},'Analyse_heures_collaborateurs'); },
  csva:()=>{ let L=CTX.aff||[]; if(!L.length) return; const n2=v=>(Math.round((+v||0)*100)/100).toFixed(2), N={k:'n',t:'N°',f:o=>esc(o.p.NUMBER||'')}, T={k:'t',t:'Affaire',f:o=>esc(o.p.TITLE||'')};
    const parC=CTX.par==='col'&&CTX.col, C0={k:'c0',t:'Collaborateur',f:o=>esc(o.s)};
    if(parC){ L=[]; CTX.col.forEach(c=>{ const s=sN(c.sid); L.push({s,p:{NUMBER:'',TITLE:'Total du collaborateur'},x:c.x}); [...c.A].forEach(([pid,x])=>L.push({s,p:Pj(pid)||{},x})); }); }
    const pre=parC?[C0]:[], nomF=parC?'_par_collaborateur':'';
    if(CTX.affK==='f') return csvTable({cols:[...pre,N,T,{k:'f',t:'Frais CHF',f:o=>n2(o.x.f)},{k:'fn',t:'Notes de frais',f:o=>String(o.x.fn)},{k:'c',t:'Notes à contrôler',f:o=>String(o.x.fctl)},{k:'r',t:'Refusées',f:o=>String(o.x.fref)},
      {k:'fa',t:'Facturables CHF',f:o=>n2(o.x.ffa)},{k:'af',t:'À facturer CHF',f:o=>n2(o.x.faf)},{k:'rb',t:'Remboursables CHF',f:o=>n2(o.x.frb)},{k:'d',t:'Dernière note',f:o=>o.x.fder?fK(o.x.fder):''}],view:L},'Analyse_des_frais'+nomF);
    csvTable({cols:[...pre,N,T,{k:'h',t:'Heures',f:o=>n2(o.x.h)},{k:'c',t:'Inscriptions à contrôler',f:o=>String(o.x.ctl)},{k:'r',t:'Refusées',f:o=>String(o.x.ref)},
      {k:'fa',t:'Heures facturables',f:o=>n2(o.x.fa)},{k:'fd',t:'Heures facturées',f:o=>n2(o.x.fd)},{k:'af',t:'Heures à facturer',f:o=>n2(o.x.af)},{k:'d',t:'Dernière saisie',f:o=>o.x.der?fK(o.x.der):''}],view:L},'Analyse_des_heures'+nomF); } };

/* ── écrans ── */
const TABLES=['timelog','projectcost','project','staff','staffrate','projectphase','projectsubphase','projectactivity','projectactivitygroup','projectcostcategory','projectcostcategorygroup','subproject','contact'];
const vue=mod0=>({ render(m,arg){ css(); CUR.m=m; let mod=mod0;
    if(mod0==='entree'||mod0==='fentree'){ const k=mod0==='fentree'?'f':'h', a=String(arg==null?'':arg).split('|'), p=a[0]!==''?Pj(a[0]):null; ST.amod=KND[k].mods.includes(a[1])?a[1]:null;
      /* plus de page propre à l'affaire (25.11.2026, Paulo : « afficher la liste lorsque les tuiles ne sont pas sélectionnées ; je sélectionne l'affaire, je clique
         sur la tuile, tu ouvres les critères sans la liste des affaires mais uniquement l'affaire sélectionnée ») : « ID » ou « ID|module » = cette affaire choisie
         dans la page d'entrée (reprise de session, « ‹ Analyse de l'affaire » des pages pleines) ; pageAff reste, plus appelée */
      ST.aff=null; if(p&&peutVoir(k)&&permisP(k,p.ID)&&String(p.ID)!==String(ST.pid)) choisir(p.ID); }
    if(mod0==='centree'){ const a=String(arg==null?'':arg).split('|'), s=a[0]!==''?DS.get('staff',nId(a[0])):null; ST.amod=MOD_C[a[1]]?a[1]:null; if(s&&String(s.ID)!==String(ST.sid)) choisirC(s.ID); }
    if(CUR.mod!==mod){ razSel(); ST.col=null; ST.jour=null;
      /* passage entre les affaires et les collaborateurs : critères et semaine propres à chacun */
      if(mod==='centree'||CUR.mod==='centree'){ ST.crit={h:{},f:{}}; ST.fd={h:null,f:null}; const k=mod==='centree'?(ST.sid!=null?'c:'+ST.sid:null):ST.pid; ST.sem=k!=null?derSem(k):null; } } CUR.mod=mod;
    if(DOM[mod]){ const dom=DOM[mod];
      if(arg!=null&&arg!==''){ const p=Pj(arg); if(p&&permisP(dom,p.ID)&&String(p.ID)!==String(ST.pid)) choisir(p.ID); }
      if(ST.pid!=null&&(!Pj(ST.pid)||!permisP(dom,ST.pid))) ST.pid=null;
      if(ST.pid==null){ const L=colL(mod); if(L.length) choisir(L[0].p.ID); }
      setTimeout(majArg,0); }
    dessiner(m); const on=m.querySelector('.sgah-it.on'); if(on&&on.scrollIntoView) try{ on.scrollIntoView({block:'nearest'}); }catch(_){ } },
  tools(){ return []; },
  refresh(ts){ if(hit(ts,...TABLES)&&CUR.ver!==VER) redess(); } });
VIEWS[VE]=vue('entree'); VIEWS[VF]=vue('fentree'); VIEWS[VC]=vue('centree'); Object.keys(VM).forEach(k=>{ VIEWS[VM[k]]=vue(k); });
/* les quatre anciennes entrées d'Administration (session, historique, liens) mènent aux modules */
{ const g0=go; go=function(v,arg){ if(REDIR[v]){ v=REDIR[v]; arg=undefined; } return g0.call(this,v,arg); }; }
window.SGAH={ST,CUR,CTX,VE,VF,VC,VM,REDIR,IDS,etat,approuverLot,filtrer,grouper,statsAff,periode,perim,peutVoir,ecrit,bloquee,grille,choisir,redess,colL,presta:prestaL};
})();

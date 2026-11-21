/* ═══ Bloc 58 — chapitre « Proposition » : carte des projets (21.11.2026) ═══
   Paulo, 21.11.2026 : « je valide la proposition 1, mais en attendant ne pas l'intégrer dans le cockpit, enregistre cette proposition dans un nouvel
   onglet Proposition, pour que je puisse travailler dedans avant de l'appliquer à l'app ». Le chapitre « Proposition » du menu (SG_DOM de sg3.js ;
   administrateur seulement : sgVueOk de sg3_plus.js) garde les propositions validées tant qu'elles ne sont pas reportées dans l'app.

   Carte des projets (écran nx-carte) = proposition 1 « Carte et panneau » des cinq maquettes du 20.11.2026 (demande de Paulo : « ajoute une carte avec
   la position des projets, les projets seront sélectionnables sur la carte […] ça ouvrira une fenêtre avec des informations pertinentes, notamment le
   planning, la situation des heures ») ; les cinq maquettes : subgestion3/_backup_20261120_maquette_carte/proposition_carte.js.
   - Fond : swisstopo (WMS de SG_FZ_GEO, coordonnées LV95), carte nationale grise ou photo aérienne, comme la fenêtre « Recherche de parcelle ».
   - Projets : ceux que l'utilisateur voit (sgProjetsVisibles), sans les projets internes ; « En cours » (états 1, 2, 3) ou « Tous » (choix gardé sur le poste).
   - Position : parcelle de Faisabilité (sgfaisa ▸ PARCELLE E / N) ; sinon adresse du projet du contrat d'honoraires (padr, ploc), adresse d'affaire
     (CONTACT1_ID), adresse écrite dans la désignation (« Immeuble | Meillerie 6 | Lausanne »), enfin la localité — cherchées par le géoportail fédéral
     (sgFzChercherAdresse, comme Faisabilité) et gardées sur le poste (localStorage « sg3_carte_geo » : une adresse trouvée n'est plus redemandée, une
     adresse introuvable l'est après 7 jours, une erreur de réseau n'est pas gardée). Affaire d'essai 99TST (commune fictive) : position fictive à Lausanne.
   - Couleur d'une épingle = avancement (phase actuelle, sgPhaseActuelle) ; épingles proches regroupées (chiffre : un clic agrandit la carte).
   - Un clic sur un projet : résumé à droite de la carte — chiffres (heures saisies / prévues, ces 30 jours, dernière saisie, prochaine échéance du planning,
     permis, facturé si sgMargeVisible), planning (sgplanning du projet et du chantier), heures par phase, équipe ; Page du projet, Tableau de bord,
     « Ouvrir la fenêtre » (onglets Vue d'ensemble, Planning, Heures, Équipe, Facturation).
   RIEN n'est écrit dans la base. Rien dans le Cockpit (nx-home) tant que Paulo ne le demande pas : sgCarteZone(el) se pose dans n'importe quelle page.
   Styles #sgcarte-css, classes sgcarte-*, débogage window.SGCARTE. */
(()=>{
'use strict';
if(typeof VIEWS==='undefined'||typeof nxPage!=='function'||window.SGCARTE) return;

/* ── 1. styles ── */
const CSS=`
.sgcarte-zone{margin:0 0 30px;container-type:inline-size}
.sgcarte-card{border-top:2px solid var(--s-noir,#1d1d1b);background:#fff}
.sgcarte-hd{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;padding:10px 0 8px}
.sgcarte-hd h4{margin:0;font-size:15px;font-weight:700}
.sgcarte-hd .sub{color:var(--s-gris,#706F6F);font-size:12.5px}
.sgcarte-hd .dr{margin-left:auto;display:flex;gap:18px;align-items:center;flex-wrap:wrap}
.sgcarte-seg{display:flex;gap:12px;align-items:baseline}
.sgcarte-seg .l{font-size:12px;color:var(--s-gris,#706F6F)}
.sgcarte-seg button{border:0;background:none;padding:2px 0;font:inherit;font-size:12.5px;color:var(--s-gris,#706F6F);cursor:pointer;border-bottom:2px solid transparent}
.sgcarte-seg button:hover{color:var(--s-noir,#1d1d1b)}
.sgcarte-seg button.on{color:var(--s-noir,#1d1d1b);font-weight:700;border-bottom-color:var(--s-nuit,#003346)}
.sgcarte-map{position:relative;overflow:hidden;background:#ecebe6;cursor:grab;user-select:none;touch-action:none;outline:none}
.sgcarte-map:focus-visible{box-shadow:inset 0 0 0 2px var(--s-nuit,#003346)}
.sgcarte-map.drag{cursor:grabbing}
.sgcarte-img{position:absolute;left:0;top:0;transform-origin:0 0;pointer-events:none;max-width:none}
.sgcarte-pins{position:absolute;inset:0;pointer-events:none}
.sgcarte-pin{position:absolute;pointer-events:auto;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4);background:var(--c);padding:0;cursor:pointer;transition:transform .12s}
.sgcarte-pin:hover,.sgcarte-pin.hl{transform:scale(1.3);z-index:3}
.sgcarte-pin.on{box-shadow:0 0 0 3px var(--s-noir,#1d1d1b),0 0 0 5px #fff;z-index:4}
.sgcarte-pin .n{position:absolute;left:calc(100% + 6px);top:50%;transform:translateY(-50%);background:#fff;padding:1px 5px;font-size:11px;font-weight:700;white-space:nowrap;display:none;border:1px solid var(--s-noir,#1d1d1b);color:var(--s-noir,#1d1d1b)}
.sgcarte-pin.on .n,.sgcarte-pin.hl .n{display:block}
.sgcarte-clu{position:absolute;pointer-events:auto;transform:translate(-50%,-50%);min-width:28px;height:28px;border-radius:14px;background:var(--s-nuit,#003346);color:#fff;font:inherit;font-size:12px;font-weight:700;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4);cursor:pointer;padding:0 7px}
.sgcarte-clu:hover{background:var(--s-noir,#1d1d1b)}
.sgcarte-tip{position:absolute;z-index:6;pointer-events:none;background:var(--s-noir,#1d1d1b);color:#fff;font-size:12px;padding:5px 8px;max-width:280px;display:none;line-height:1.35}
.sgcarte-tip b{display:block}
.sgcarte-ctl{position:absolute;right:10px;top:10px;display:flex;flex-direction:column;gap:6px;z-index:5}
.sgcarte-ctl button{width:30px;height:30px;border:1px solid var(--s-noir,#1d1d1b);background:#fff;line-height:1;cursor:pointer;padding:0;display:grid;place-items:center;color:var(--s-noir,#1d1d1b)}
.sgcarte-ctl button:hover{background:var(--s-jaune2,#FEF6B0)}
.sgcarte-ctl svg{width:16px;height:16px}
.sgcarte-fond{position:absolute;left:10px;bottom:10px;z-index:5;display:flex;background:#fff;border:1px solid var(--s-noir,#1d1d1b)}
.sgcarte-fond button{border:0;background:#fff;font:inherit;font-size:12px;padding:4px 9px;cursor:pointer;color:var(--s-noir,#1d1d1b)}
.sgcarte-fond button.on{background:var(--s-nuit,#003346);color:#fff}
.sgcarte-att{position:absolute;right:6px;bottom:3px;font-size:10px;color:#444;background:rgba(255,255,255,.75);padding:0 4px;z-index:5;pointer-events:none}
.sgcarte-msg{position:absolute;left:50%;top:12px;transform:translateX(-50%);background:#fff;border:1px solid var(--s-noir,#1d1d1b);padding:5px 10px;font-size:12px;z-index:6;white-space:nowrap}
.sgcarte-leg{display:flex;gap:16px;flex-wrap:wrap;font-size:12px;padding:8px 0 2px;align-items:center}
.sgcarte-leg span{display:inline-flex;align-items:center;gap:6px}
.sgcarte-leg i{width:10px;height:10px;border-radius:50%;background:var(--c);display:inline-block;flex:none}
.sgcarte-sans{font-size:12px;color:var(--s-gris,#706F6F);padding:7px 0 0;line-height:1.55}
.sgcarte-sans button{border:0;background:none;padding:0;font:inherit;font-weight:700;color:var(--s-nuit,#003346);cursor:pointer}
.sgcarte-sans button:hover{text-decoration:underline}
/* fiche du projet */
.sgcarte-f-tete{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:0 14px;align-items:start;background:var(--s-jaune2,#FEF6B0);border-top:2px solid var(--s-noir,#1d1d1b);padding:12px 14px}
.sgcarte-f-num{font-size:24px;font-weight:700;color:var(--s-nuit,#003346);line-height:1.05;padding-right:14px;border-right:2px solid var(--s-noir,#1d1d1b);white-space:nowrap;align-self:stretch}
.sgcarte-f-t{font-size:15px;font-weight:700;line-height:1.25}
.sgcarte-f-s{font-size:12px;color:#3d3d3b;margin-top:4px;line-height:1.45}
.sgcarte-f-x{border:0;background:none;font-size:20px;line-height:1;cursor:pointer;padding:0 2px;color:var(--s-noir,#1d1d1b)}
.sgcarte-chip{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;padding:1px 8px 1px 6px;border:1px solid var(--c);background:#fff;white-space:nowrap}
.sgcarte-chip i{width:8px;height:8px;border-radius:50%;background:var(--c)}
.sgcarte-kp{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));border-bottom:1px solid var(--s-filet,#e3e3e0)}
.sgcarte-kp>div{padding:9px 10px 9px 0;min-width:0}
.sgcarte-kp .l{font-size:11.5px;color:var(--s-gris,#706F6F);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgcarte-kp .v{display:block;font-size:18px;font-weight:700;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgcarte-kp .v.t{font-size:13.5px;line-height:1.5}
.sgcarte-kp .v small{font-size:11.5px;font-weight:400;color:var(--s-gris,#706F6F)}
.sgcarte-kp .v.r{color:var(--s-rouge,#BD1E42)}
.sgcarte-kp .v.ok{color:#4E6B0F}
.sgcarte-jg{height:4px;background:#e4e4e0;margin-top:4px;position:relative;overflow:hidden}
.sgcarte-jg b{position:absolute;left:0;top:0;bottom:0;background:var(--s-nuit,#003346)}
.sgcarte-jg b.r{background:var(--s-rouge,#BD1E42)}
.sgcarte-sec{padding:12px 0 2px}
.sgcarte-sec h5{margin:0 0 8px;font-size:12px;font-weight:700;border-bottom:1px solid var(--s-noir,#1d1d1b);padding-bottom:4px;display:flex;gap:8px;align-items:baseline}
.sgcarte-sec h5 .dr{margin-left:auto;font-weight:400;color:var(--s-gris,#706F6F);font-size:11.5px}
.sgcarte-vide{font-size:12px;color:var(--s-gris,#706F6F);padding:4px 0 6px}
/* planning */
.sgcarte-g{display:grid;grid-template-columns:minmax(80px,36%) minmax(0,1fr);font-size:11.5px;row-gap:2px}
.sgcarte-g .lb{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:8px;line-height:17px}
.sgcarte-g .lb.t{font-weight:700;padding-top:4px}
.sgcarte-g .tr{position:relative;height:17px}
.sgcarte-g .tr.t{height:21px}
.sgcarte-g .tr::before{content:"";position:absolute;left:0;right:0;top:8px;border-top:1px dotted #d6d6d2}
.sgcarte-g .b{position:absolute;top:4px;height:9px;background:var(--s-nuit,#003346);min-width:2px}
.sgcarte-g .b.r{background:var(--s-rouge,#BD1E42)}
.sgcarte-g .b.fait{background:#7d94a0}
.sgcarte-g .j{position:absolute;top:3px;width:10px;height:10px;margin-left:-5px;transform:rotate(45deg);background:var(--s-nuit,#003346)}
.sgcarte-g .j.r{background:var(--s-rouge,#BD1E42)}
.sgcarte-g .auj{position:absolute;top:-2px;bottom:-2px;border-left:2px solid var(--s-rouge,#BD1E42);z-index:2}
.sgcarte-g .ax{position:relative;height:16px;font-size:10.5px;color:var(--s-gris,#706F6F);border-top:1px solid var(--s-noir,#1d1d1b);margin-top:3px}
.sgcarte-g .ax span{position:absolute;top:2px;transform:translateX(-50%);white-space:nowrap}
.sgcarte-g .plus{grid-column:1/-1;font-size:11.5px;color:var(--s-gris,#706F6F);padding-top:3px}
/* heures par phase, par mois, équipe */
.sgcarte-ph{display:grid;grid-template-columns:minmax(80px,36%) minmax(0,1fr) auto;gap:4px 8px;font-size:11.5px;align-items:center}
.sgcarte-ph .lb{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgcarte-ph .lb.on{font-weight:700}
.sgcarte-ph .tr{height:9px;background:#e4e4e0;position:relative}
.sgcarte-ph .tr b{position:absolute;left:0;top:0;bottom:0;background:var(--s-nuit,#003346)}
.sgcarte-ph .tr b.d{background:var(--s-rouge,#BD1E42)}
.sgcarte-ph .tr i{position:absolute;top:-3px;bottom:-3px;border-left:2px solid var(--s-noir,#1d1d1b)}
.sgcarte-ph .h{white-space:nowrap;color:#3d3d3b;font-variant-numeric:tabular-nums}
.sgcarte-mo{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:3px;align-items:end;height:70px;border-bottom:1px solid var(--s-noir,#1d1d1b)}
.sgcarte-mo div{background:var(--s-nuit,#003346);min-height:0}
.sgcarte-mo div.c{background:repeating-linear-gradient(135deg,var(--s-nuit,#003346) 0 3px,#6f8a97 3px 6px)}
.sgcarte-mo-l{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:3px;font-size:10px;color:var(--s-gris,#706F6F);text-align:center;padding-top:3px}
.sgcarte-eq{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:3px 10px;font-size:12px}
.sgcarte-eq .tr{grid-column:1/-1;height:3px;background:#e4e4e0;margin:-1px 0 4px}
.sgcarte-eq .tr b{display:block;height:100%;background:var(--s-nuit,#003346)}
.sgcarte-act{display:flex;gap:8px;flex-wrap:wrap;padding:12px 0 4px}
.sgcarte-cols{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0 26px}
@container (max-width:900px){ .sgcarte-cols{grid-template-columns:minmax(0,1fr)} }
/* carte et panneau (proposition 1) */
.sgcarte-p1{display:grid;grid-template-columns:minmax(0,1fr) 400px;height:590px;border-bottom:1px solid var(--s-noir,#1d1d1b)}
.sgcarte-p1 .sgcarte-map{height:100%}
.sgcarte-p1 aside{overflow:auto;padding:0 0 0 18px;border-left:2px solid var(--s-noir,#1d1d1b)}
@container (max-width:860px){ .sgcarte-p1{grid-template-columns:minmax(0,1fr);height:auto} .sgcarte-p1 .sgcarte-map{height:420px}
  .sgcarte-p1 aside{border-left:0;border-top:2px solid var(--s-noir,#1d1d1b);padding:0;overflow:visible} }
.sgcarte-acc{padding:14px 0}
.sgcarte-acc h5{margin:0 0 8px;font-size:13px}
.sgcarte-acc p{font-size:12.5px;color:#3d3d3b;margin:0 0 12px;line-height:1.5}
.sgcarte-rep{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:6px 10px;font-size:12.5px;align-items:center}
.sgcarte-rep i{width:10px;height:10px;border-radius:50%;background:var(--c)}
/* fenêtre du projet */
.sgcarte-voile{position:fixed;inset:0;background:rgba(29,29,27,.38);z-index:870;display:grid;place-items:center}
.sgcarte-win{width:min(1040px,94vw);max-height:90vh;display:flex;flex-direction:column;background:#fff;box-shadow:0 18px 50px rgba(0,0,0,.3)}
.sgcarte-win .corps{overflow:auto;padding:0 18px 16px;container-type:inline-size}
.sgcarte-tabs{display:flex;gap:22px;padding:10px 18px 0;border-bottom:1px solid var(--s-filet,#e3e3e0)}
.sgcarte-tabs button{border:0;background:none;font:inherit;font-size:13px;padding:6px 0;cursor:pointer;border-bottom:2px solid transparent;color:var(--s-gris,#706F6F)}
.sgcarte-tabs button.on{color:var(--s-noir,#1d1d1b);font-weight:700;border-bottom-color:var(--s-nuit,#003346)}
`;
const st=document.createElement('style'); st.id='sgcarte-css'; st.textContent=CSS; document.head.append(st);

/* ── 2. outils ── */
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N0=v=>(typeof num==='function'?num(Math.round(+v||0),0):String(Math.round(+v||0)));
const HR=v=>{ v=+v||0; return v>0&&v<1?(Math.round(v*10)/10).toFixed(1):N0(v); };
const MOIS=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
const MOIS1=['J','F','M','A','M','J','J','A','S','O','N','D'];
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const jma=s=>{ if(!s) return ''; const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s); return m?m[3]+'.'+m[2]+'.'+m[1]:String(s); };
const dOf=s=>{ const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||''); return m?new Date(+m[1],+m[2]-1,+m[3]):null; };
let AUJ=new Date(); const aujourdhui=()=>{ const d=new Date(); d.setHours(0,0,0,0); AUJ=d; return d; }; aujourdhui();
const kOf=d=>d.getFullYear()*10000+d.getMonth()*100+d.getDate();   /* même clé que tlKey (mois 0 à 11) */
const SVG={plus:'<svg viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>',
  moins:'<svg viewBox="0 0 16 16"><path d="M3 8h10" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>',
  tout:'<svg viewBox="0 0 16 16"><path d="M2 5.5V2h3.5M10.5 2H14v3.5M14 10.5V14h-3.5M5.5 14H2v-3.5" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>'};
/* état de la carte : projet choisi et vue gardés pendant la séance ; filtre et fond gardés sur le poste */
const ST=window.SGCARTE={sel:null,vue:null,auto:true,filtre:nxLS.get('sg3_carte_filtre','encours')==='tous'?'tous':'encours',fond:nxLS.get('sg3_carte_fond','plan')==='ortho'?'ortho':'plan',
  pret:false,pos:new Map(),prog:'',D:null};

/* catégories d'avancement (couleurs de la charte : bleu, bleu nuit, turquoise, orange, vert ; gris pour l'attente et les projets terminés) */
const PH={fz:['Faisabilité, relevé','#3F4193'],etu:['Étude du projet','#003346'],enq:['Enquête, permis','#4CBAB5'],ao:['Appel d’offres','#D7860D'],
  rea:['Réalisation','#98C21F'],exp:['Expertise, conseil','#636E7E'],att:['En attente','#A3A3A0'],fin:['Terminé','#C9C9C4']};
const PH_ORD=['fz','etu','enq','ao','rea','exp','att','fin'];

/* ── 3. données d'un projet (gardées jusqu'au prochain changement de la base ou à la prochaine ouverture de la page) ── */
const INF=new Map();
function moNoms(p){ try{ return [...new Set(DS.by('projectmember','PROJECT_ID',p.ID).filter(x=>+x.TEAMROLECODE===8&&x.CONTACT_ID!=null).map(x=>contactName(DS.get('contact',x.CONTACT_ID))).filter(Boolean))]; }catch(_){ return []; } }
function classe(p,pa){ if(typeof sgTermine==='function'&&sgTermine(p)) return 'fin'; if(+p.PROJECTSTATECODE===3) return 'att';
  const ph=pa&&pa.ph, sp=pa&&pa.sp, n=String((ph&&ph.NUMBER)||'').trim(), ns=String((sp&&sp.NUMBER)||'').trim(), t=((ph?nm(ph):'')+' '+(sp?nm(sp):'')).toLowerCase();
  if(/^33|autoris|enqu[eê]te|permis/.test(ns)||/autoris|enqu[eê]te|permis/.test(t)) return 'enq';
  if(/^5/.test(n)||/r[ée]alis|ex[ée]cution|chantier/.test(t)) return 'rea';
  if(/^4/.test(n)||/appel d|soumission/.test(t)) return 'ao';
  if(/^3/.test(n)||/[ée]tude|projet|avant-projet/.test(t)) return 'etu';
  if(/^[12]/.test(n)||/faisab|relev/.test(t)) return 'fz';
  const cat=typeof sgCatProjet==='function'?sgCatProjet(p):''; if(cat==='faisabilite') return 'fz'; if(cat==='expertise') return 'exp';
  return pa?'etu':'exp'; }
function info(p){ if(INF.has(p.ID)) return INF.get(p.ID);
  const T=DS.by('timelog','PROJECT_ID',p.ID), k30=kOf(new Date(AUJ.getFullYear(),AUJ.getMonth(),AUJ.getDate()-30));
  let htot=0,h30=0,lastK=0,last=null; const bySt={}, byPh={}, byM={};
  T.forEach(r=>{ const h=+r.TIMEPERIOD||0, k=tlKey(r); htot+=h; if(k>=k30) h30+=h; if(k>lastK){ lastK=k; last=r; }
    bySt[r.STAFF_ID]=(bySt[r.STAFF_ID]||0)+h; if(r.PHASE_ID!=null) byPh[r.PHASE_ID]=(byPh[r.PHASE_ID]||0)+h; const mk=(+r.TIMEYEAR)*12+(+r.TIMEMONTH); byM[mk]=(byM[mk]||0)+h; });
  const phases=DS.by('projectphase','PROJECT_ID',p.ID).sort((a,b)=>cmp(a.NUMBER,b.NUMBER)).map(f=>{ const sub=DS.by('projectsubphase','PROJECTPHASE_ID',f.ID);
    const bud=(+f.TIMEBUDGET||0)||sub.reduce((s,x)=>s+(+x.TIMEBUDGET||0),0); return {f,lib:(typeof sgPhNom==='function'?sgPhNom(f):nm(f)),n:f.NUMBER,bud,h:byPh[f.ID]||0}; });
  const hprev=phases.reduce((s,x)=>s+x.bud,0);
  let pa=null; try{ pa=typeof sgPhaseActuelle==='function'?sgPhaseActuelle(p):null; }catch(_){}
  const cl=classe(p,pa);
  const plan=['projet','chantier'].map(s=>({s,r:DS.get('sgplanning',p.ID+':'+s)})).filter(x=>x.r&&(x.r.LIGNES||[]).length);
  const L=[]; plan.forEach(x=>(x.r.LIGNES||[]).forEach(l=>L.push(Object.assign({sorte:x.s},l))));
  const dates=L.filter(l=>l.t!=='titre').flatMap(l=>[l.d,l.f].filter(Boolean)).sort();
  const proch=L.filter(l=>l.t!=='titre').map(l=>({l,d:l.t==='jalon'?l.d:(l.f||l.d)})).filter(x=>x.d&&x.d>=iso(AUJ)).sort((a,b)=>a.d<b.d?-1:1)[0]||null;
  let permis=null; try{ const P=DS.by('sgpermis','PROJECT_ID',p.ID).sort((a,b)=>(+b.N||0)-(+a.N||0))[0]; if(P&&window.SGPC&&SGPC.etat) permis=Object.assign({r:P},SGPC.etat(P)); }catch(_){}
  const equipe=Object.entries(bySt).map(([id,h])=>({s:DS.get('staff',id),h})).filter(x=>x.h>0).sort((a,b)=>b.h-a.h);
  const I={p,htot,h30,last,phases,hprev,pa,cl,L,debut:dates[0]||null,finPrev:dates[dates.length-1]||null,proch,permis,equipe,byM,mo:moNoms(p)};
  INF.set(p.ID,I); return I; }
function finances(p){ const D=ST.D; if(!D||typeof sgRenta!=='function'||typeof sgMargeVisible!=='function'||!sgMargeVisible()) return null;
  try{ const R=sgRenta(p,D); return R&&(R.contratTTC||R.factTTC)?R:null; }catch(_){ return null; } }

/* ── 4. positions des projets ── */
const GK='sg3_carte_geo', JOUR=864e5; let GC=nxLS.get(GK,{}); if(!GC||typeof GC!=='object') GC={};
let tGC=0; const gcSave=()=>{ clearTimeout(tGC); tGC=setTimeout(()=>nxLS.set(GK,GC),600); };
async function chercher(q){ q=String(q||'').replace(/\s+/g,' ').trim(); if(q.length<3) return null;
  const c=GC[q]; if(c&&c.E) return c; if(c&&Date.now()-(+c.t||0)<7*JOUR) return null;   /* introuvable il y a moins de 7 jours : pas redemandé */
  let r=null; try{ const R=await sgFzChercherAdresse(q); if(R&&R[0]&&R[0].E&&R[0].N) r={E:+R[0].E,N:+R[0].N,lab:String(R[0].label||'').replace(/<[^>]+>/g,''),t:Date.now()}; }
  catch(_){ return null; }   /* erreur de réseau : rien n'est gardé, nouvel essai à la prochaine ouverture */
  GC[q]=r||{t:Date.now()}; gcSave(); return r; }
const RUE=/\b(rue|ruelle|ch\.?|chemin|av\.?|avenue|route|rte|place|pl\.|quai|bd|boulevard|all[ée]e|impasse|sentier|passage|promenade|esplanade|clos|crêt|cret|montée|mont[ée]e)\b/i;
function candidats(p){ const L=[], fz=DS.get('sgfaisa',p.ID), P=fz&&fz.PARCELLE;
  if(P&&P.E&&P.N){ if(String(P.BFS)==='9999'||/exempleville/i.test(P.COMMUNE||'')) L.push({fictif:true}); else L.push({E:+P.E,N:+P.N,src:'parcelle'}); }
  if(ST.D) try{ sgContratsDuProjet(p,ST.D).forEach(c=>{ const a=[c.padr,c.ploc].filter(Boolean).join(' '); if(a&&/\d/.test(a)&&!/exempleville/i.test(a)) L.push({q:a,src:'contrat'}); }); }catch(_){}
  const c=p.CONTACT1_ID?DS.get('contact',p.CONTACT1_ID):null;
  if(c&&c.STREET&&!/exempleville/i.test(c.LOCATION||'')) L.push({q:[c.STREET,c.POSTALCODE,c.LOCATION].filter(Boolean).join(' '),src:'adresse'});
  const parts=String(p.TITLE||'').split(/\s*[|,;–]\s*/).map(s=>s.trim()).filter(Boolean);
  parts.forEach((s,i)=>{ if(/\d/.test(s)&&(RUE.test(s)||/^[A-ZÀ-Ý][\wÀ-ÿ'’\- ]+ \d+[a-z]?$/.test(s))){ const loc=parts[i+1]&&!/\d/.test(parts[i+1])?' '+parts[i+1]:''; L.push({q:s+loc,src:'titre'}); } });
  if(c&&c.LOCATION&&!/exempleville/i.test(c.LOCATION)) L.push({q:[c.POSTALCODE,c.LOCATION].filter(Boolean).join(' '),src:'commune'});
  if(p.LOCATION&&!/exempleville/i.test(p.LOCATION)) L.push({q:p.LOCATION,src:'commune'});
  return L; }
const SRC={parcelle:'parcelle (Faisabilité)',contrat:'adresse du contrat',adresse:'adresse de l’affaire',titre:'adresse lue dans la désignation',commune:'centre de la commune',fictif:'position fictive (affaire d’essai)'};
const enSuisse=r=>r&&r.E>2480000&&r.E<2840000&&r.N>1070000&&r.N<1300000;
async function placer(p,refaire){ if(!refaire&&ST.pos.has(p.ID)) return ST.pos.get(p.ID);
  for(const c of candidats(p)){ if(c.fictif){ const v={E:2538150,N:1152950,src:'fictif'}; ST.pos.set(p.ID,v); return v; }
    if(c.E){ const v={E:c.E,N:c.N,src:c.src}; ST.pos.set(p.ID,v); return v; }
    const r=await chercher(c.q); if(enSuisse(r)){ const v={E:r.E,N:r.N,src:c.src,lab:r.lab}; ST.pos.set(p.ID,v); return v; } }
  ST.pos.set(p.ID,null); return null; }
function projets(){ let L=typeof sgProjetsVisibles==='function'?sgProjetsVisibles():DS.all('project'); L=L.filter(p=>!(typeof sgInterne==='function'&&sgInterne(p)));
  return ST.filtre==='tous'?L:L.filter(p=>[1,2,3].includes(+p.PROJECTSTATECODE)); }
/* localisation des projets (4 recherches à la fois) ; refaire = positions recalculées (adresses changées), celles déjà connues restent affichées entre-temps */
let ENC=null, RUN=0;
function preparer(refaire){ if(ENC&&!refaire) return ENC; const tok=++RUN;
  ENC=(async()=>{ try{ await Promise.race([fxEnsure(),new Promise(r=>setTimeout(r,8000))]); ST.D=fxData(); }catch(_){}
    const L=projets(), file=L.filter(p=>refaire||!ST.pos.has(p.ID)); let n=L.length-file.length;
    const tour=async()=>{ while(file.length){ const p=file.shift(); try{ await placer(p,refaire); }catch(_){} n++; if(tok===RUN&&!refaire) ST.prog='Localisation des projets… '+n+' / '+L.length; maj(); } };
    await Promise.all([tour(),tour(),tour(),tour()]); if(tok===RUN){ ST.prog=''; ST.pret=true; } maj(); })();
  return ENC; }
let tMaj=0; function maj(force){ clearTimeout(tMaj); tMaj=setTimeout(()=>{ if(CUR&&ZONE&&document.body.contains(ZONE)) CUR.maj(force); chiffres(); },force?0:250); }
function items(){ return projets().map(p=>{ const v=ST.pos.get(p.ID); if(!v) return null; const I=info(p); return {id:p.ID,p,I,E:v.E,N:v.N,src:v.src,cl:I.cl,c:PH[I.cl][1]}; }).filter(Boolean); }
function sansPos(){ return projets().filter(p=>ST.pos.has(p.ID)&&!ST.pos.get(p.ID)); }

/* ── 5. la carte ── */
function Carte(el,o){ o=o||{}; el.classList.add('sgcarte-map'); el.tabIndex=0; el.setAttribute('aria-label','Carte des projets : glisser pour déplacer, + / − ou molette pour zoomer, flèches du clavier pour déplacer');
  const img=document.createElement('img'); img.className='sgcarte-img'; img.alt=''; img.draggable=false;
  const pins=document.createElement('div'); pins.className='sgcarte-pins';
  const tip=document.createElement('div'); tip.className='sgcarte-tip';
  const ctl=document.createElement('div'); ctl.className='sgcarte-ctl';
  ctl.innerHTML='<button type="button" data-z="in" title="Zoom avant">'+SVG.plus+'</button><button type="button" data-z="out" title="Zoom arrière">'+SVG.moins+'</button><button type="button" data-z="fit" title="Voir tous les projets">'+SVG.tout+'</button>';
  const fond=document.createElement('div'); fond.className='sgcarte-fond'; fond.innerHTML='<button type="button" data-f="plan">Carte</button><button type="button" data-f="ortho">Photo aérienne</button>';
  const att=document.createElement('div'); att.className='sgcarte-att'; att.textContent='© swisstopo';
  const msg=document.createElement('div'); msg.className='sgcarte-msg'; msg.style.display='none';
  el.append(img,pins,tip,ctl,fond,att,msg);
  const S={E:2538000,N:1152000,res:120}; let imgV=null, its=[], sel=ST.sel, hl=null, tImg=0, cbVue=null, ouv=false, msgT='', errImg=false;
  const W=()=>el.clientWidth||800, H=()=>el.clientHeight||500;
  const px=(e,n)=>[(e-S.E)/S.res+W()/2,H()/2-(n-S.N)/S.res];
  const url=()=>{ const w=W(),h=H(),r=Math.min(2,window.devicePixelRatio||1), L=ST.fond==='ortho'?'ch.swisstopo.swissimage-product':'ch.swisstopo.pixelkarte-grau';
    return {u:SG_FZ_GEO.wms+'?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS='+L+'&STYLES=&CRS=EPSG:2056&BBOX='+[S.E-w/2*S.res,S.N-h/2*S.res,S.E+w/2*S.res,S.N+h/2*S.res].map(v=>v.toFixed(1)).join(',')
      +'&WIDTH='+Math.round(w*r)+'&HEIGHT='+Math.round(h*r)+'&FORMAT=image/'+(ST.fond==='ortho'?'jpeg':'png'),v:{E:S.E,N:S.N,res:S.res,w,h}}; };
  const placeImg=()=>{ if(!imgV) return; const s=imgV.res/S.res, x=(imgV.E-imgV.w/2*imgV.res-S.E)/S.res+W()/2, y=H()/2-(imgV.N+imgV.h/2*imgV.res-S.N)/S.res;
    img.style.width=imgV.w+'px'; img.style.height=imgV.h+'px'; img.style.transform='translate('+x+'px,'+y+'px) scale('+s+')'; };
  const montrerMsg=()=>{ const t=msgT||(errImg?'Fond de carte indisponible (connexion à swisstopo ?)':''); msg.textContent=t; msg.style.display=t?'block':'none'; };
  const charger=()=>{ clearTimeout(tImg); tImg=setTimeout(()=>{ const U=url(), im=new Image(); im.onload=()=>{ errImg=false; img.src=U.u; imgV=U.v; placeImg(); montrerMsg(); }; im.onerror=()=>{ errImg=true; montrerMsg(); }; im.src=U.u; },160); };
  const dessinerPins=()=>{ const w=W(),h=H(), P=its.map(x=>{ const [a,b]=px(x.E,x.N); return {x,a,b}; }).filter(q=>q.a>-40&&q.a<w+40&&q.b>-40&&q.b<h+40);
    /* regroupement des épingles trop proches (les projets les plus actifs restent seuls ; le projet choisi n'est jamais regroupé) */
    const G=[]; P.sort((m,n)=>(n.x.I.h30-m.x.I.h30)||(n.x.I.htot-m.x.I.htot));
    P.forEach(q=>{ if(q.x.id===sel){ G.push({m:[q],a:q.a,b:q.b}); return; } const g=G.find(g=>!g.m.some(z=>z.x.id===sel)&&Math.hypot(g.a-q.a,g.b-q.b)<22); if(g) g.m.push(q); else G.push({m:[q],a:q.a,b:q.b}); });
    pins.innerHTML=''; G.forEach(g=>{ if(g.m.length===1){ const q=g.m[0], x=q.x, bt=document.createElement('button'); bt.type='button'; bt.className='sgcarte-pin'+(x.id===sel?' on':'')+(x.id===hl?' hl':'');
        bt.style.cssText='left:'+q.a+'px;top:'+q.b+'px;--c:'+x.c; bt.dataset.id=x.id; bt.setAttribute('aria-label',x.p.NUMBER+' '+(x.p.TITLE||'')); bt.innerHTML='<span class="n">'+E(x.p.NUMBER)+'</span>'; pins.append(bt); }
      else { const bt=document.createElement('button'); bt.type='button'; bt.className='sgcarte-clu'; bt.style.cssText='left:'+g.a+'px;top:'+g.b+'px'; bt.textContent=g.m.length;
        bt.title=g.m.map(q=>q.x.p.NUMBER).join(', ')+' — cliquer pour agrandir'; bt._m=g.m.map(q=>q.x); pins.append(bt); } }); };
  const dessiner=()=>{ placeImg(); dessinerPins(); };
  const vue=()=>{ dessiner(); charger(); ST.vue={E:S.E,N:S.N,res:S.res}; clearTimeout(vue.t); vue.t=setTimeout(()=>{ if(cbVue) cbVue(); },200); };
  const ajuster=L=>{ L=(L||its); if(!L.length){ vue(); return; } let e0=Infinity,e1=-Infinity,n0=Infinity,n1=-Infinity; L.forEach(x=>{ e0=Math.min(e0,x.E); e1=Math.max(e1,x.E); n0=Math.min(n0,x.N); n1=Math.max(n1,x.N); });
    S.E=(e0+e1)/2; S.N=(n0+n1)/2; S.res=Math.min(900,Math.max(2.5,Math.max((e1-e0)/Math.max(80,W()-110),(n1-n0)/Math.max(80,H()-110)))); vue(); };
  const zoom=(f,mx,my)=>{ const nr=Math.min(900,Math.max(0.6,S.res*f)); if(mx!=null){ const ec=S.E+(mx-W()/2)*S.res, nc=S.N-(my-H()/2)*S.res; S.E=ec-(mx-W()/2)*nr; S.N=nc+(my-H()/2)*nr; } S.res=nr; vue(); };
  ctl.onclick=e=>{ const b=e.target.closest('button'); if(!b) return; e.stopPropagation(); const z=b.dataset.z; if(z==='in'){ ST.auto=false; zoom(1/1.6); } else if(z==='out'){ ST.auto=false; zoom(1.6); } else { ST.auto=true; ajuster(); } };
  const majFond=()=>fond.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.f===ST.fond)); majFond();
  fond.onclick=e=>{ const b=e.target.closest('button'); if(!b) return; e.stopPropagation(); ST.fond=b.dataset.f; nxLS.set('sg3_carte_fond',ST.fond); majFond(); charger(); };
  /* glisser, molette, clic, survol */
  let dr=null;
  el.addEventListener('pointerdown',e=>{ if(e.button!==0||e.target.closest('.sgcarte-ctl,.sgcarte-fond')) return; dr={x:e.clientX,y:e.clientY,E:S.E,N:S.N,m:false,t:e.target}; try{ el.setPointerCapture(e.pointerId); }catch(_){} });
  el.addEventListener('pointermove',e=>{ if(dr){ const dx=e.clientX-dr.x, dy=e.clientY-dr.y; if(!dr.m&&Math.abs(dx)+Math.abs(dy)>4){ dr.m=true; ST.auto=false; el.classList.add('drag'); tip.style.display='none'; }
      if(dr.m){ S.E=dr.E-dx*S.res; S.N=dr.N+dy*S.res; dessiner(); } return; }
    const pin=e.target.closest('.sgcarte-pin'); if(pin){ const x=its.find(z=>String(z.id)===pin.dataset.id); if(x){ const b=el.getBoundingClientRect();
        tip.innerHTML='<b>'+E(x.p.NUMBER)+' · '+E(x.p.TITLE||'')+'</b>'+E(PH[x.cl][0])+(x.I.h30?' · '+HR(x.I.h30)+' h ces 30 jours':'');
        tip.style.display='block'; tip.style.left=Math.min(W()-290,e.clientX-b.left+14)+'px'; tip.style.top=(e.clientY-b.top+14)+'px'; return; } }
    tip.style.display='none'; });
  const fin=e=>{ if(!dr) return; const d=dr; dr=null; el.classList.remove('drag'); try{ el.releasePointerCapture(e.pointerId); }catch(_){}
    if(d.m){ vue(); return; }
    const t=document.elementFromPoint(e.clientX,e.clientY)||d.t, pin=t&&t.closest&&t.closest('.sgcarte-pin'), clu=t&&t.closest&&t.closest('.sgcarte-clu');
    if(pin){ if(o.choisir) o.choisir(isNaN(+pin.dataset.id)?pin.dataset.id:+pin.dataset.id); return; }
    if(clu&&clu._m){ ST.auto=false; ajuster(clu._m); return; }
    if(o.vide) o.vide(); };
  el.addEventListener('pointerup',fin); el.addEventListener('pointercancel',fin);
  el.addEventListener('pointerleave',()=>{ if(!dr) tip.style.display='none'; });
  el.addEventListener('wheel',e=>{ e.preventDefault(); ST.auto=false; const b=el.getBoundingClientRect(); zoom(e.deltaY>0?1.35:1/1.35,e.clientX-b.left,e.clientY-b.top); },{passive:false});
  el.addEventListener('keydown',e=>{ if(e.target!==el) return; const pas=80*S.res;
    if(e.key==='+'||e.key==='=') zoom(1/1.6); else if(e.key==='-') zoom(1.6); else if(e.key==='ArrowLeft'){ S.E-=pas; vue(); } else if(e.key==='ArrowRight'){ S.E+=pas; vue(); }
    else if(e.key==='ArrowUp'){ S.N+=pas; vue(); } else if(e.key==='ArrowDown'){ S.N-=pas; vue(); } else return; ST.auto=false; e.preventDefault(); });
  const ro=new ResizeObserver(()=>{ if(!document.body.contains(el)){ ro.disconnect(); return; } if(ouv) vue(); }); ro.observe(el);
  let nAj=-1;
  return {
    /* tant que personne n'a déplacé ni zoomé la carte (ST.auto), elle s'ajuste à tous les projets placés ; ensuite la vue est gardée pendant la séance */
    set(L){ its=L; if(ST.auto){ if(!ouv||L.length!==nAj){ ouv=true; nAj=L.length; ajuster(); } else dessiner(); return; }
      if(!ouv){ ouv=true; if(ST.vue){ Object.assign(S,ST.vue); vue(); } else ajuster(); } else dessiner(); },
    choisir(id){ sel=id; dessinerPins(); },
    hl(id){ if(hl===id) return; hl=id; pins.querySelectorAll('.sgcarte-pin').forEach(b=>b.classList.toggle('hl',b.dataset.id===String(id))); },
    ajuster, px, visibles(){ const w=W(),h=H(); return its.filter(x=>{ const [a,b]=px(x.E,x.N); return a>=0&&a<=w&&b>=0&&b<=h; }); },
    message(t){ msgT=t||''; montrerMsg(); }, surVue(f){ cbVue=f; }, detruire(){ ro.disconnect(); clearTimeout(tImg); }, S }; }

/* ── 6. fiche du projet : morceaux ── */
const chip=cl=>'<span class="sgcarte-chip" style="--c:'+PH[cl][1]+'"><i></i>'+E(PH[cl][0])+'</span>';
function tete(I,{fermer}={}){ const p=I.p, v=ST.pos.get(p.ID), pa=I.pa, lib=typeof sgPhaseLib==='function'&&pa?sgPhaseLib(pa):'';
  return '<div class="sgcarte-f-tete"><div class="sgcarte-f-num">'+E(p.NUMBER)+'</div><div><div class="sgcarte-f-t">'+E(p.TITLE||'')+'</div>'
    +'<div class="sgcarte-f-s">'+(I.mo.length?'Maître de l’ouvrage : <b>'+E(I.mo.join(', '))+'</b><br>':'')+chip(I.cl)+(lib&&I.cl!=='fin'?' <span style="margin-left:6px">'+E(lib)+'</span>':'')
    +(v?'<br><span style="color:var(--s-gris,#706F6F)">Position : '+E(SRC[v.src]||v.src)+(v.lab?' · '+E(v.lab):'')+'</span>':'')+'</div></div>'
    +(fermer?'<button type="button" class="sgcarte-f-x" data-sgcarte="fermer" title="Fermer (Échap)">×</button>':'')+'</div>'; }
function kpis(I,o){ o=o||{}; const pct=I.hprev?Math.round(I.htot/I.hprev*100):null, R=o.fin?finances(I.p):null;
  const k=[['Heures saisies','<span class="v">'+HR(I.htot)+'<small> h'+(I.hprev?' / '+HR(I.hprev):'')+'</small></span>'+(I.hprev?'<div class="sgcarte-jg"><b class="'+(pct>100?'r':'')+'" style="width:'+Math.min(100,pct)+'%"></b></div>':'')],
    ['Ces 30 jours','<span class="v">'+HR(I.h30)+'<small> h</small></span>'],
    ['Dernière saisie','<span class="v t">'+(I.last?E(jma(iso(tlDate(I.last)))):'—')+'</span>'],
    ['Prochaine échéance','<span class="v t'+(I.proch&&I.proch.l.rouge?' r':'')+'" title="'+E(I.proch?I.proch.l.lib:'')+'">'+(I.proch?E(jma(I.proch.d))+' <small>'+E(I.proch.l.lib)+'</small>':'—')+'</span>']];
  if(o.permis!==false&&I.permis) k.push(['Permis de construire','<span class="v t '+(I.permis.cl==='err'?'r':I.permis.cl==='ok'?'ok':'')+'">'+E(I.permis.lib)+'</span>']);
  if(R) k.push(['Facturé TTC','<span class="v">'+N0(R.factTTC)+'</span><div class="sgcarte-jg"><b style="width:'+Math.min(100,R.contratTTC?R.factTTC/R.contratTTC*100:0)+'%"></b></div>']);
  return '<div class="sgcarte-kp">'+k.map(([l,v])=>'<div><div class="l">'+E(l)+'</div>'+v+'</div>').join('')+'</div>'; }
function planning(I,o){ o=o||{}; const L=I.L.filter(l=>(l.t==='titre')||(l.d||l.f)); if(!L.length) return '<div class="sgcarte-vide">Pas encore de planning pour ce projet (page du projet ▸ Planning).</div>';
  const ds=L.filter(l=>l.t!=='titre').flatMap(l=>[l.d,l.f].filter(Boolean)).map(dOf).filter(Boolean); if(!ds.length) return '<div class="sgcarte-vide">Planning sans dates.</div>';
  let a=new Date(Math.min(...ds)), b=new Date(Math.max(...ds));
  if(o.autour){ a=new Date(Math.min(a,new Date(AUJ.getFullYear(),AUJ.getMonth()-6,1))); }
  a=new Date(a.getFullYear(),a.getMonth(),1); b=new Date(b.getFullYear(),b.getMonth()+1,1); const T=b-a||1, X=d=>Math.max(0,Math.min(100,(d-a)/T*100));
  const max=o.max||99; let rows=L, plus=0; if(rows.length>max){ plus=rows.length-max; rows=rows.slice(0,max); }
  const ans=[]; for(let y=a.getFullYear();y<=b.getFullYear();y++){ const d=new Date(y,0,1); if(d>a&&d<b) ans.push([X(d),y]); }
  if(ans.length<2){ const mois=(b.getFullYear()-a.getFullYear())*12+b.getMonth()-a.getMonth(), pas=mois>14?6:mois>6?3:1; ans.length=0;
    for(let i=pas;i<mois;i+=pas){ const d=new Date(a.getFullYear(),a.getMonth()+i,1); ans.push([X(d),MOIS[d.getMonth()]+(d.getMonth()===0||i===pas?' '+String(d.getFullYear()).slice(2):'')]); } }
  const auj=AUJ>=a&&AUJ<=b?'<div class="auj" style="left:'+X(AUJ)+'%" title="Aujourd’hui"></div>':'';
  return '<div class="sgcarte-g">'+rows.map(l=>{ if(l.t==='titre') return '<div class="lb t" title="'+E(l.lib)+'">'+E(l.lib)+'</div><div class="tr t">'+auj+'</div>';
      const d=dOf(l.d)||dOf(l.f), f=dOf(l.f)||d, fait=f&&f<AUJ; if(!d) return '';
      const mark=l.t==='jalon'?'<div class="j'+(l.rouge?' r':'')+'" style="left:'+X(d)+'%" title="'+E(l.lib+' · '+jma(l.d))+'"></div>'
        :'<div class="b'+(l.rouge?' r':fait?' fait':'')+'" style="left:'+X(d)+'%;width:'+Math.max(0.6,X(f)-X(d))+'%" title="'+E(l.lib+' · '+jma(l.d)+' – '+jma(l.f))+'"></div>';
      return '<div class="lb" title="'+E(l.lib)+'">'+E(l.lib)+'</div><div class="tr">'+mark+auj+'</div>'; }).join('')
    +'<div></div><div class="ax">'+ans.map(([x,y])=>'<span style="left:'+x+'%">'+y+'</span>').join('')+'</div>'
    +(plus?'<div class="plus">+ '+plus+' étape'+(plus>1?'s':'')+' — planning complet dans la page du projet</div>':'')+'</div>'; }
function heuresPhases(I,o){ o=o||{}; const L=I.phases.filter(x=>x.bud||x.h); if(!L.length) return '<div class="sgcarte-vide">Aucune heure saisie par phase.</div>';
  const M=Math.max(...L.map(x=>Math.max(x.bud,x.h)),1), act=I.pa&&I.pa.ph?I.pa.ph.ID:null;
  return '<div class="sgcarte-ph">'+L.slice(0,o.max||20).map(x=>{ const dep=x.bud&&x.h>x.bud; return '<div class="lb'+(x.f.ID===act&&I.cl!=='fin'?' on':'')+'" title="'+E(x.lib)+'">'+E(x.lib)+'</div>'
    +'<div class="tr"><b class="'+(dep?'d':'')+'" style="width:'+(x.h/M*100)+'%"></b>'+(x.bud?'<i style="left:'+(x.bud/M*100)+'%" title="Heures au contrat : '+HR(x.bud)+' h"></i>':'')+'</div>'
    +'<div class="h">'+HR(x.h)+(x.bud?' / '+HR(x.bud):'')+' h</div>'; }).join('')+'</div>'; }
function heuresMois(I){ const m0=AUJ.getFullYear()*12+AUJ.getMonth(), V=[]; for(let i=11;i>=0;i--){ const k=m0-i; V.push({k,h:I.byM[k]||0,m:k%12}); }
  const M=Math.max(...V.map(v=>v.h),1); if(!V.some(v=>v.h)) return '<div class="sgcarte-vide">Aucune heure ces 12 derniers mois.</div>';
  return '<div class="sgcarte-mo">'+V.map((v,i)=>'<div class="'+(i===11?'c':'')+'" style="height:'+(v.h/M*100)+'%" title="'+E(MOIS[v.m]+' '+Math.floor(v.k/12)+' : '+HR(v.h)+' h')+'"></div>').join('')+'</div>'
    +'<div class="sgcarte-mo-l">'+V.map(v=>'<span>'+MOIS1[v.m]+'</span>').join('')+'</div>'; }
function equipe(I,o){ o=o||{}; const L=I.equipe.slice(0,o.max||6); if(!L.length) return '<div class="sgcarte-vide">Aucune heure saisie.</div>'; const M=L[0].h||1;
  return '<div class="sgcarte-eq">'+L.map(x=>'<span>'+E(x.s?staffName(x.s):'—')+'</span><span>'+HR(x.h)+' h</span><div class="tr"><b style="width:'+(x.h/M*100)+'%"></b></div>').join('')
    +(I.equipe.length>L.length?'<span style="color:var(--s-gris,#706F6F)">+ '+(I.equipe.length-L.length)+' autre'+(I.equipe.length-L.length>1?'s':'')+'</span><span></span>':'')+'</div>'; }
function financesHtml(I){ const R=finances(I.p); if(!R) return '<div class="sgcarte-vide">'+(typeof sgMargeVisible==='function'&&!sgMargeVisible()?'Montants masqués pour votre profil ou finances verrouillées.':'Aucun contrat d’honoraires relié.')+'</div>';
  const pf=R.contratTTC?Math.round(R.factTTC/R.contratTTC*100):0;
  return '<div class="sgcarte-kp">'+[['Honoraires TTC',N0(R.contratTTC)],['Facturé TTC',N0(R.factTTC)+'<small> · '+pf+' %</small>'],['Encaissé TTC',N0(R.encTTC)],['Reste à facturer TTC',N0(Math.max(0,R.contratTTC-R.factTTC))]]
    .map(([l,v])=>'<div><div class="l">'+E(l)+'</div><span class="v">'+v+'</span></div>').join('')+'</div>'; }
const sec=(t,html,dr)=>'<div class="sgcarte-sec"><h5>'+E(t)+(dr?'<span class="dr">'+dr+'</span>':'')+'</h5>'+html+'</div>';
const actions=(I,o)=>'<div class="sgcarte-act"><button type="button" class="nx-btn pri" data-sgcarte="page">Page du projet</button><button type="button" class="nx-btn" data-sgcarte="tdb">Tableau de bord</button>'
  +((o&&o.fenetre)?'<button type="button" class="nx-btn" data-sgcarte="fenetre">Ouvrir la fenêtre</button>':'')+'</div>';
function brancherActions(box,I,fermer){ box.addEventListener('click',e=>{ const b=e.target.closest('[data-sgcarte]'); if(!b) return; const k=b.dataset.sgcarte, p=I.p; if(k!=='fermer'&&!p) return;
  if(k==='fermer'){ if(fermer) fermer(); }
  else if(k==='page'){ fermerFenetre(); go('nx-pdom',String(p.ID)); }
  else if(k==='tdb'){ fermerFenetre(); go('nx-projet',p.ID); }
  else if(k==='fenetre') ouvrirFenetre(p.ID); }); }
const repartition=L=>{ const c={}; L.forEach(x=>{ c[x.cl]=(c[x.cl]||0)+1; }); return '<div class="sgcarte-rep">'+PH_ORD.filter(k=>c[k]).map(k=>'<i style="--c:'+PH[k][1]+'"></i><span>'+E(PH[k][0])+'</span><b>'+c[k]+'</b>').join('')+'</div>'; };
const legende=()=>'<div class="sgcarte-leg">'+PH_ORD.map(k=>'<span style="--c:'+PH[k][1]+'"><i></i>'+E(PH[k][0])+'</span>').join('')+'</div>';
function sansHtml(){ if(!ST.pret) return ''; const L=sansPos(); if(!L.length) return '';
  return '<div class="sgcarte-sans">'+L.length+' projet'+(L.length>1?'s':'')+' sans position : '+L.slice(0,40).map(p=>'<button type="button" data-sgcarte-p="'+E(p.ID)+'" title="'+E(p.TITLE||'')+' — ouvrir la page du projet">'+E(p.NUMBER)+'</button>').join(', ')+(L.length>40?', …':'')
    +'. Pour les placer : l’adresse de l’affaire (Liste des affaires ▸ Éditer ▸ Adresses), l’adresse du projet dans le contrat d’honoraires ou la parcelle (Faisabilité ▸ Parcelle & règlements).</div>'; }
const enTete=(titre,sous)=>'<div class="sgcarte-hd"><h4>'+E(titre)+'</h4><span class="sub">'+E(sous||'')+'</span><span class="dr"><span class="sgcarte-seg"><span class="l">Projets</span>'
  +'<button type="button" data-flt="encours" class="'+(ST.filtre==='encours'?'on':'')+'">En cours</button><button type="button" data-flt="tous" class="'+(ST.filtre==='tous'?'on':'')+'">Tous</button></span></span></div>';
function brancherFiltre(box){ box.querySelectorAll('[data-flt]').forEach(b=>b.onclick=()=>{ if(ST.filtre===b.dataset.flt) return; ST.filtre=b.dataset.flt; nxLS.set('sg3_carte_filtre',ST.filtre); ENC=null; ST.pret=false; dessinerZone(); }); }

/* ── 7. la fenêtre du projet (« Ouvrir la fenêtre ») ── */
let FEN=null;
function fermerFenetre(){ if(FEN){ FEN.remove(); FEN=null; document.removeEventListener('keydown',escFen,true); } }
function escFen(e){ if(e.key==='Escape'&&FEN){ e.preventDefault(); e.stopPropagation(); fermerFenetre(); } }
function ouvrirFenetre(id,onglet){ fermerFenetre(); const p=DS.get('project',id); if(!p) return; const I=info(p); let tab=onglet||sessionStorage.getItem('sg3_carte_onglet')||'vue';
  const v=document.createElement('div'); v.className='sgcarte-voile'; FEN=v; const w=document.createElement('div'); w.className='sgcarte-win'; w.setAttribute('role','dialog'); w.setAttribute('aria-label',p.NUMBER+' '+(p.TITLE||'')); v.append(w); document.body.append(v);
  const TABS=[['vue','Vue d’ensemble'],['plan','Planning'],['heures','Heures'],['equipe','Équipe'],['fin','Facturation']];
  const corps=()=>{ if(tab==='vue') return kpis(I,{fin:true})+'<div class="sgcarte-cols">'+sec('Planning',planning(I,{max:9}),I.finPrev?'fin prévue '+jma(I.finPrev):'')+sec('Heures par phase',heuresPhases(I,{max:8}))+sec('Heures par mois',heuresMois(I),'12 derniers mois')+'</div>'+actions(I);
    if(tab==='plan') return sec('Planning du projet et du chantier',planning(I,{autour:true}),I.debut?jma(I.debut)+' → '+jma(I.finPrev):'')+actions(I);
    if(tab==='heures') return kpis(I,{permis:false})+'<div class="sgcarte-cols" style="grid-template-columns:minmax(0,1.4fr) minmax(0,1fr)">'+sec('Heures par phase (saisies / au contrat)',heuresPhases(I))+sec('Heures par mois',heuresMois(I),'12 derniers mois')+'</div>'+actions(I);
    if(tab==='equipe') return sec('Collaborateurs qui ont saisi des heures',equipe(I,{max:20}),HR(I.htot)+' h au total')+actions(I);
    return sec('Honoraires et facturation',financesHtml(I))+actions(I); };
  const rendre=()=>{ w.innerHTML=tete(I,{fermer:true})+'<div class="sgcarte-tabs" role="tablist">'+TABS.map(([k,t])=>'<button type="button" role="tab" aria-selected="'+(k===tab)+'" data-tab="'+k+'" class="'+(k===tab?'on':'')+'">'+E(t)+'</button>').join('')+'</div><div class="corps">'+corps()+'</div>';
    w.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{ tab=b.dataset.tab; try{ sessionStorage.setItem('sg3_carte_onglet',tab); }catch(_){} rendre(); }); };
  rendre(); brancherActions(w,I,fermerFenetre);
  v.addEventListener('pointerdown',e=>{ if(e.target===v) fermerFenetre(); }); document.addEventListener('keydown',escFen,true); }

/* ── 8. la carte et son panneau (proposition 1), posée dans une page ── */
function sgCarteZone(z){ z.classList.add('sgcarte-zone');
  z.innerHTML='<div class="sgcarte-card">'+enTete('Carte des projets','Cliquez sur un projet pour voir son résumé')+'<div class="sgcarte-p1"><div class="m"></div><aside aria-live="polite"></aside></div>'+legende()+'<div class="sans"></div></div>';
  brancherFiltre(z); const aside=z.querySelector('aside'), C=Carte(z.querySelector('.m'),{choisir:id=>choisir(id),vide:()=>choisir(null)});
  let vu;
  const panneau=force=>{ const id=ST.sel, p=id!=null&&DS.get('project',id), L=items();
    if(p&&vu===id&&!force) return; vu=p?id:undefined;
    if(!p){ aside.innerHTML='<div class="sgcarte-acc"><h5>'+L.length+' projet'+(L.length>1?'s':'')+' sur la carte</h5><p>Cliquez sur une épingle pour voir le résumé du projet ici. Glisser pour déplacer la carte, molette ou + / − pour zoomer ; un chiffre regroupe plusieurs projets proches (un clic agrandit la carte).</p>'+repartition(L)+'</div>'; return; }
    const I=info(p); aside.innerHTML=tete(I,{fermer:true})+kpis(I,{fin:true})+sec('Planning',planning(I,{max:8}),I.finPrev?'fin prévue '+jma(I.finPrev):'')+sec('Heures par phase',heuresPhases(I,{max:7}))+sec('Équipe',equipe(I,{max:4}))+actions(I,{fenetre:true}); };
  brancherActions(aside,{get p(){ return DS.get('project',ST.sel); }},()=>choisir(null));
  z.addEventListener('click',e=>{ const b=e.target.closest('[data-sgcarte-p]'); if(b) go('nx-pdom',String(b.dataset.sgcarteP)); });   /* projet sans position : sa page */
  const choisir=id=>{ ST.sel=id; C.choisir(id); panneau(); aside.scrollTop=0; };
  return {maj(force){ C.set(items()); C.message(ST.prog); panneau(force); z.querySelector('.sans').innerHTML=sansHtml(); },C}; }

/* ── 9. la page : Proposition ▸ Carte des projets ── */
let CUR=null, ZONE=null;
function dessinerZone(){ if(!ZONE||!document.body.contains(ZONE)) return; fermerFenetre(); if(CUR&&CUR.C) CUR.C.detruire(); CUR=sgCarteZone(ZONE); preparer(); CUR.maj(); chiffres(); }
const KP=[['pl','Projets sur la carte'],['sp','Sans position'],['ac','Actifs ces 30 jours'],['h30','Heures ces 30 jours'],['pe','Prochaine échéance']];
const chiffresHtml=()=>'<div class="nx-kpis sg-tkp">'+KP.map(([k,l])=>'<div class="nx-kpi" data-sgcarte-k="'+k+'"><div class="l">'+E(l)+'</div><div class="v">…</div><div class="s"></div></div>').join('')+'</div>';
function chiffres(){ const t=document.querySelector('#main .sg-tete'); if(!t||!ZONE) return;
  const set=(k,v,s,ti)=>{ const d=t.querySelector('[data-sgcarte-k="'+k+'"]'); if(!d) return; d.querySelector('.v').innerHTML=v; d.querySelector('.s').innerHTML=s||''; d.title=ti||''; };
  const P=projets(), L=items(), enc=ST.filtre==='encours', Is=P.map(info), nS=sansPos().length;
  set('pl',String(L.length),'sur '+P.length+' projet'+(P.length>1?'s':'')+(enc?' en cours':''));
  set('sp',ST.pret?String(nS):'…',ST.pret?(nS?'aucune adresse trouvée':'tous les projets sont placés'):'localisation en cours');
  const ac=Is.filter(I=>I.h30>0).length, h=Is.reduce((s,I)=>s+I.h30,0);
  set('ac',String(ac),'projets avec des heures saisies');
  set('h30',HR(h)+'<small>h</small>',enc?'projets en cours':'tous les projets');
  const pe=Is.filter(I=>I.proch).sort((a,b)=>a.proch.d<b.proch.d?-1:1)[0], lib=pe?String(pe.proch.l.lib||''):'';
  set('pe',pe?E(jma(pe.proch.d)):'—',pe?E(pe.p.NUMBER+' · '+(lib.length>34?lib.slice(0,33)+'…':lib)):'aucun planning à venir',pe?pe.p.NUMBER+' · '+(pe.p.TITLE||'')+' — '+lib:''); }
const TABLES=['timelog','project','projectphase','projectsubphase','projectmember','sgplanning','sgpermis','sgfaisa','contact','staff'];
VIEWS['nx-carte']={
  render(m){ aujourdhui(); INF.clear(); ENC=null; ST.pret=false; ST.prog='';
    for(const [k,v] of ST.pos) if(!v) ST.pos.delete(k);   /* projets sans position : cherchés de nouveau (une adresse a pu être ajoutée) */
    const pg=nxPage(m,'<div class="sg-split">'+sgTete('Proposition','Carte des projets','Proposition 1 « Carte et panneau » pour le Cockpit, validée le 21.11.2026 : à travailler ici avant son ajout au Cockpit. Un clic sur un projet ouvre son résumé à droite de la carte.',chiffresHtml())
      +'<div class="sgcarte-zone"></div></div>');
    ZONE=pg.querySelector('.sgcarte-zone'); dessinerZone(); },
  /* modifications de la base (saisies, plannings, adresses…) : la carte et le résumé suivent, sans perdre la vue */
  refresh(ts){ if(!CUR||!ZONE||!document.body.contains(ZONE)) return; ts=ts||['*']; const a=x=>ts.includes('*')||ts.includes(x);
    if(!TABLES.some(a)) return; aujourdhui(); INF.clear(); if(a('project')||a('contact')||a('sgfaisa')) preparer(true); maj(true); },
  leave(){ fermerFenetre(); if(CUR&&CUR.C) CUR.C.detruire(); CUR=null; ZONE=null; } };

Object.assign(ST,{zone:sgCarteZone,ouvrirFenetre,info,placer,candidats});   /* débogage, et pour poser la carte ailleurs (Cockpit) le moment venu */
})();

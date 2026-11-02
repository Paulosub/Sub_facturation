/* ═══ PLANNING DU PROJET ET DU CHANTIER (02.11.2026, bloc 33 ; demandes de Paulo : « dans mes projets, projet ajoute planning »,
   « dans chantier aussi ») ═══
   Page du projet (nx-pdom) : tuile « Planning » dans le groupe Projet (« Planning du projet ») et dans le groupe Chantier (« Planning du
   chantier ») ; SG_PLAN_PAGES, tuiles et compteurs dans sg3_plus.js. Le moteur n'a pas de planning de projet (seulement la planification RH)
   et les contrats de Facturation n'ont qu'un planning d'intention en texte (detail.planDelais) ou en mois (detail.planGantt) : planning neuf,
   un par projet et par sorte.
   Données : collection propre « sgplanning » (gardée par les reprises), un enregistrement par projet et par sorte :
     {ID '<projet>:projet' | '<projet>:chantier', PROJECT_ID, TYPE, LIGNES:[{id, t 'tache' | 'jalon' | 'titre', lib, d, f (dates ISO ;
      jalon : d seule), pp (phase partielle SIA liée → heures réelles), ent (entreprise / intervenant), rouge (échéance importante), rem}],
      MODIFIE, PAR}.
   Écran : bandeau jaune, chiffres (début, fin prévue, durée, en cours, prochaine échéance), barre (échelle Semaines · Mois · Trimestres,
   Aujourd'hui, heures réelles ; Tâche, Jalon, Titre, Créer ▾, Imprimer), diagramme (étapes à gauche, barres à droite, ligne d'aujourd'hui).
   Glisser une barre = la déplacer, ses bords = début / fin ; clic = modifier ; clic droit = menu (modifier, insérer, monter, descendre,
   dupliquer, supprimer). Créer : phases SIA du projet (phases déjà travaillées : dates réelles de la feuille d'heures ; les autres à la suite,
   durées types DUREE), planning d'intention du contrat (planGantt), entreprises du projet (chantier). Délais du contrat (planDelais) rappelés
   en bas. Imprimer : tableau des étapes + diagramme SVG (sgImprimer → papier des contrats).
   Droits : lecture = qui voit le projet ; écriture = projet modifiable (administrateur, « projets modifiables : tous », ou « ses projets »
   pour un projet attribué — serveur du NAS : règle « projet modifiable » des collections rattachées par PROJECT_ID, rien à changer).
   Débogage : window.SGPL. Styles <style id="sgpl-css">, classes sgpl-*. */
(function(){
if(typeof VIEWS!=='object'||!VIEWS['nx-pdom']) return;

const T='sgplanning';
const PP={21:'Définition du projet, étude de faisabilité',22:'Procédure de choix de mandataires',31:'Avant-projet',32:'Projet de l’ouvrage',
  33:'Procédure de demande d’autorisation',41:'Appels d’offres, comparaison des offres, adjudication',51:'Projet d’exécution',52:'Exécution de l’ouvrage',
  53:'Mise en service, achèvement'};
const DUREE={21:42,22:42,31:42,32:70,33:98,41:70,51:84,52:364,53:42};   /* durées types (jours) des phases pas encore travaillées */
const SORTES={projet:{lib:'Planning du projet',pp:[21,31,32,33]},chantier:{lib:'Planning du chantier',pp:[41,51,52,53]}};
const ECH={tout:{lib:'Tout'},sem:{lib:'Semaines',ppd:18},mois:{lib:'Mois',ppd:4},trim:{lib:'Trimestres',ppd:1.4}};   /* Tout : ajusté à la largeur (d'office) */
const MOIS=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'], MOIS3=['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'];
const MOISL=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const H_LIG=38, H_TIT=30;

const CSS=`
.sgpl-box{flex:1 1 auto;min-height:0;overflow:auto}
.sgpl{container:sgpl/inline-size;padding:16px 24px 28px;box-sizing:border-box}
.sgpl .sgfh-tete{margin:0}
.sgpl-hact{display:flex;gap:8px;flex-wrap:wrap;margin-left:auto}
.sgpl-kp{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));margin:14px 0 22px}
@container sgpl (max-width:900px){.sgpl-kp{grid-template-columns:repeat(3,minmax(0,1fr))}}
.sgpl-kp .nx-kpi .s{white-space:normal}
.sgpl-bar{display:flex;align-items:center;gap:8px 18px;flex-wrap:wrap;padding:8px 0 10px;border-top:2px solid var(--s-noir)}
.sgpl-fil{display:inline-flex;align-items:baseline;gap:2px 14px;flex-wrap:wrap}
.sgpl-fil .lb{font-size:11px;font-weight:700;color:var(--s-gris);margin-right:2px}
.sgpl-fil button{border:0;background:none;padding:2px 0 3px;font:inherit;font-size:12.5px;color:var(--s-gris);cursor:pointer;white-space:nowrap}
.sgpl-fil button:hover{color:var(--s-noir)}
.sgpl-fil button.on{color:var(--s-noir);font-weight:700;box-shadow:inset 0 -2px 0 var(--s-nuit)}
.sgpl-bar .dr{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap}
.sgpl-g{display:grid;grid-template-columns:minmax(220px,300px) minmax(0,1fr);border-top:1px solid var(--s-noir);border-bottom:1px solid var(--s-noir);user-select:none}
.sgpl-gl{border-right:1px solid var(--s-noir);min-width:0}
.sgpl-gr{overflow-x:auto;overflow-y:hidden;min-width:0}
.sgpl-gt{position:relative}
.sgpl-h{height:46px;box-sizing:border-box;border-bottom:1px solid var(--s-noir);position:relative}
.sgpl-gl .sgpl-h{display:flex;align-items:flex-end;padding:0 10px 6px;font-size:11px;font-weight:700;color:var(--s-gris)}
.sgpl-h .a,.sgpl-h .b{position:absolute;left:0;right:0;height:22px}
.sgpl-h .a{top:0;border-bottom:1px solid var(--s-gris3)}.sgpl-h .b{top:23px}
.sgpl-h span{position:absolute;top:0;height:22px;line-height:22px;padding-left:5px;font-size:10.5px;white-space:nowrap;overflow:hidden;box-sizing:border-box;border-left:1px solid var(--s-gris3);color:var(--s-noir)}
.sgpl-h .a span{font-weight:700}
.sgpl-gb{position:relative}
.sgpl-v{position:absolute;top:0;bottom:0;width:0;border-left:1px solid #ececec;pointer-events:none}
.sgpl-v.m{border-left-color:#d6d6d6}
.sgpl-auj{position:absolute;top:-46px;bottom:0;width:0;border-left:1px dashed var(--s-noir);pointer-events:none;z-index:2}
.sgpl-auj b{position:absolute;top:2px;left:3px;font-size:9.5px;font-weight:700;background:var(--s-noir);color:#fff;padding:1px 4px;white-space:nowrap}
.sgpl-r{height:${H_LIG}px;box-sizing:border-box;border-bottom:1px solid #ececec;padding:4px 10px;display:flex;flex-direction:column;justify-content:center;min-width:0;cursor:default}
.sgpl-r.ed{cursor:pointer}
.sgpl-r.ed:hover,.sgpl-r.hov{background:var(--s-jaune3)}
.sgpl-r .l{font-size:12.5px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgpl-r .l .pp{color:var(--s-nuit);font-weight:700;margin-right:5px}
.sgpl-r .l .jl{display:inline-block;width:7px;height:7px;background:var(--s-nuit);transform:rotate(45deg);margin:0 7px 1px 1px}
.sgpl-r.rouge .l .jl{background:var(--s-rouge)}
.sgpl-r .dt{font-size:10.5px;color:var(--s-gris);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.sgpl-r.t-titre{height:${H_TIT}px;background:var(--s-nuit3);border-bottom-color:#fff}
.sgpl-r.t-titre .l{font-weight:700}
.sgpl-rr{position:relative;height:${H_LIG}px;box-sizing:border-box;border-bottom:1px solid #ececec}
.sgpl-rr.t-titre{height:${H_TIT}px;background:rgba(229,235,238,.55);border-bottom-color:#fff}
.sgpl-rr.hov{background:rgba(255,251,220,.8)}
.sgpl-b{position:absolute;top:11px;height:14px;background:var(--s-nuit);box-sizing:border-box;z-index:1}
.sgpl-b.rouge{background:var(--s-rouge)}
.sgpl-b.ed{cursor:grab}.sgpl-b.ed:active{cursor:grabbing}
.sgpl-b .g,.sgpl-b .dr{position:absolute;top:0;bottom:0;width:7px}
.sgpl-b .g{left:-2px}.sgpl-b .dr{right:-2px}
.sgpl-b.ed .g,.sgpl-b.ed .dr{cursor:ew-resize}
.sgpl-b.j{width:13px;height:13px;top:12px;transform:rotate(45deg);background:var(--s-nuit)}
.sgpl-b.j.rouge{background:var(--s-rouge)}
.sgpl-b.t{top:12px;height:5px;background:var(--s-noir)}
.sgpl-b.t::before,.sgpl-b.t::after{content:'';position:absolute;top:0;width:0;height:0;border-top:6px solid var(--s-noir)}
.sgpl-b.t::before{left:0;border-right:5px solid transparent}.sgpl-b.t::after{right:0;border-left:5px solid transparent}
.sgpl-re{position:absolute;bottom:5px;height:4px;background:var(--s-gris);pointer-events:none}
.sgpl-bl{position:absolute;top:10px;font-size:10.5px;color:var(--s-gris);white-space:nowrap;pointer-events:none}
.sgpl-tip{position:fixed;z-index:9999;background:var(--s-noir);color:#fff;font-size:11px;font-weight:700;padding:3px 7px;pointer-events:none;white-space:nowrap}
.sgpl-leg{margin:10px 0 24px;font-size:11.5px;line-height:1.5;color:var(--s-gris);display:flex;gap:6px 18px;flex-wrap:wrap;align-items:center}
.sgpl-leg i{display:inline-block;vertical-align:middle;margin-right:6px}
.sgpl-leg .b1{width:22px;height:9px;background:var(--s-nuit)}.sgpl-leg .b2{width:9px;height:9px;background:var(--s-nuit);transform:rotate(45deg)}
.sgpl-leg .b3{width:22px;height:9px;background:var(--s-rouge)}.sgpl-leg .b4{width:22px;height:4px;background:var(--s-gris)}
.sgpl-leg .b5{width:0;height:12px;border-left:1px dashed var(--s-noir)}
.sgpl-vide{padding:22px 0 8px;font-size:13px;line-height:1.55;max-width:760px}
.sgpl-vide .acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.sgpl-sec{border-top:2px solid var(--s-noir);margin-top:8px}
.sgpl-sec h3{margin:0;padding:10px 0 8px;font-size:15px;font-weight:700}
.sgpl-del{display:grid;grid-template-columns:minmax(160px,max-content) 1fr;gap:4px 22px;font-size:12.5px;margin:0 0 14px}
.sgpl-del dt{font-weight:700}.sgpl-del dd{margin:0}
.sgpl-del .c{grid-column:1/-1;font-size:11px;font-weight:700;color:var(--s-gris);margin-top:6px}
.sgpl-err{padding:20px 24px;color:var(--s-rouge)}
.sgpl-dlg{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px 14px;min-width:min(520px,80vw)}
.sgpl-dlg label{display:flex;flex-direction:column;gap:4px;font-size:11px;font-weight:700;color:var(--s-gris)}
.sgpl-dlg label.w{grid-column:1/-1}
.sgpl-dlg input:not([type=checkbox]):not([type=radio]),.sgpl-dlg select,.sgpl-dlg textarea{height:34px;border:1.5px solid var(--s-noir);border-radius:0;background:#fff;padding:0 8px;font:inherit;font-size:13px;color:var(--s-noir);box-sizing:border-box;width:100%}
.sgpl-dlg textarea{height:62px;padding:6px 8px;resize:vertical}
.sgpl-dlg .seg{grid-column:1/-1;display:flex;gap:0}
.sgpl-dlg .seg button{flex:1;height:32px;border:1.5px solid var(--s-noir);background:#fff;font:inherit;font-size:12.5px;cursor:pointer;margin-left:-1.5px}
.sgpl-dlg .seg button:first-child{margin-left:0}
.sgpl-dlg .seg button.on{background:var(--s-nuit);border-color:var(--s-nuit);color:#fff;font-weight:700;position:relative}
.sgpl-dlg .chk{grid-column:1/-1;flex-direction:row;align-items:center;gap:8px;font-size:12.5px;font-weight:400;color:var(--s-noir);cursor:pointer}
.sgpl-dlg [hidden]{display:none}
`;
const css=()=>{ if(!document.getElementById('sgpl-css')){ const s=document.createElement('style'); s.id='sgpl-css'; s.textContent=CSS; document.head.appendChild(s); } };

/* ── outils ── */
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=s=>{ const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(s||'')); return m?Math.round(Date.UTC(+m[1],+m[2]-1,+m[3])/864e5):null; };   /* date ISO → numéro de jour */
const ISO=n=>new Date(n*864e5).toISOString().slice(0,10);
const AUJ=()=>J(diso(new Date()));
const dmy=n=>n==null?'—':dfr(ISO(n));
const ymd=n=>{ const x=new Date(n*864e5); return [x.getUTCFullYear(),x.getUTCMonth(),x.getUTCDate()]; };
const debMois=(y,m)=>Math.round(Date.UTC(y,m,1)/864e5);
const dow=n=>(new Date(n*864e5).getUTCDay()+6)%7;   /* 0 = lundi */
const semISO=n=>{ const t=n-dow(n)+3, y=ymd(t)[0], j4=Math.round(Date.UTC(y,0,4)/864e5); return 1+Math.round((t-(j4-dow(j4)+3))/7); };
const nouvId=()=>Math.random().toString(36).slice(2,10);
const ver=id=>{ try{ return ((DS.S&&DS.S[T])||{})[String(id)]||0; }catch(_){ return 0; } };
const moi=()=>{ try{ return typeof ME==='object'&&ME&&ME.id?String(ME.id):''; }catch(_){ return ''; } };
const dire=(m,err)=>{ if(typeof toast==='function') toast(m,err); };
const confirmer=(m,f,o)=>{ if(typeof sgConfirm==='function') sgConfirm(m,f,o); else if(typeof confirmDlg==='function') confirmDlg(m,o&&o.yesText).then(r=>{ if(r) f(); }); };
/* durée lisible : jours, semaines, mois */
function duree(n){ if(n==null||n<1) return ''; if(n<14) return n+' j'; if(n<=120) return (Math.round(n/7*2)/2).toLocaleString('fr-CH')+' sem.';
  const m=Math.round(n/30.44); if(m<24) return m+' mois'; const a=Math.floor(m/12), r=m%12; return a+' ans'+(r?' '+r+' mois':''); }
const fx=()=>{ try{ return typeof fxData==='function'?fxData():null; }catch(_){ return null; } };
const contratsOk=()=>typeof sgAdmin==='function'&&(sgAdmin()||(typeof sgDroit==='function'&&sgDroit('contrats','lecture')));
const peut=p=>{ try{ return !!(sgAdmin()||sgDroit('projets_modifier','tous')||(sgDroit('projets_modifier','siens')&&sgMesProjets().has(String(p.ID)))); }catch(_){ return false; } };
const recDe=(pid,type)=>DS.get(T,pid+':'+type)||null;
const etiq=c=>{ let et=''; try{ et=typeof sgContratEtendue==='function'?(sgContratEtendue(c).lib||''):''; }catch(_){} return (et||'Contrat')+(c.date?' · '+String(c.date).slice(0,4):''); };

/* heures réelles par phase partielle (feuille d'heures du projet) : période principale a → b (de 5 % à 95 % des heures, pour écarter les
   heures isolées, p. ex. une séance un an après la phase), première et dernière heure a0 / b0, total h */
function reel(p){ const num={}, X={}, R={};
  DS.by('projectphase','PROJECT_ID',p.ID).forEach(ph=>DS.by('projectsubphase','PROJECTPHASE_ID',ph.ID).forEach(s=>{ const n=+s.NUMBER; if(n) num[String(s.ID)]=n; }));
  DS.by('timelog','PROJECT_ID',p.ID).forEach(r=>{ const n=num[String(r.SUBPHASE_ID)]; if(!n) return; const j=J(diso(tlDate(r))), h=+r.TIMEPERIOD||0; if(j==null||h<=0) return;
    (X[n]||(X[n]=[])).push([j,h]); });
  Object.entries(X).forEach(([n,L])=>{ L.sort((u,v)=>u[0]-v[0]); const H=L.reduce((s0,x)=>s0+x[1],0); let c=0, a=null, b=null;
    L.forEach(([j,h])=>{ c+=h; if(a==null&&c>=H*.05) a=j; if(b==null&&c>=H*.95) b=j; });
    R[n]={a,b:b??L[L.length-1][0],a0:L[0][0],b0:L[L.length-1][0],h:H}; });
  return R; }
/* phases partielles des contrats d'honoraires de l'affaire (null : Facturation pas lue ou pas permise) */
function phasesContrat(p){ const D=contratsOk()?fx():null; if(!D||typeof sgContratsDuProjet!=='function') return null; const s=new Set();
  sgContratsDuProjet(p,D).filter(c=>!c.annule).forEach(c=>Object.entries(c.phases||{}).forEach(([k,v])=>{ const m=/^4(\d)(\d)/.exec(k); if(m&&+v>0) s.add(+(m[1]+m[2])); }));
  return s; }
/* planning d'intention graphique d'un contrat de l'affaire (le plus récent qui en a un) */
function ganttContrat(p){ const D=contratsOk()?fx():null; if(!D||typeof sgContratsDuProjet!=='function') return null;
  return sgContratsDuProjet(p,D).filter(c=>{ const g=!c.annule&&c.detail&&c.detail.planGantt; return !!g&&/^\d{4}-\d{2}$/.test(g.m0||'')&&(g.rows||[]).some(r=>r&&r.t==='bar'); })
    .sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0]||null; }
/* délais du planning d'intention (texte) des contrats de l'affaire */
function delaisContrats(p){ const D=contratsOk()?fx():null; if(!D||typeof sgContratsDuProjet!=='function') return [];
  return sgContratsDuProjet(p,D).filter(c=>!c.annule&&c.detail&&Array.isArray(c.detail.planDelais)&&c.detail.planDelais.some(x=>x&&(String(x[0]||'').trim()||String(x[1]||'').trim())))
    .sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))); }

/* ── géométrie du diagramme ── */
function geo(u){ const L=u.L, auj=AUJ(), dates=[];
  L.forEach(x=>{ const d=J(x.d); if(d==null) return; dates.push(d); if(x.t==='tache'){ const f=J(x.f); if(f!=null) dates.push(f); } });
  if(!dates.length) return null;
  const pa=Math.min(...dates), pb=Math.max(...dates); let a=pa, b=pb;   /* pa / pb : dates du planning ; a / b : étendue affichée (heures réelles, aujourd'hui) */
  if(u.reel) L.forEach(x=>{ const r=x.pp&&u.R[x.pp]; if(r){ a=Math.min(a,r.a); b=Math.max(b,r.b); } });
  if(auj>=a-120&&auj<=b+120){ a=Math.min(a,auj); b=Math.max(b,auj); }
  const span=b-a+1, ech=ECH[u.ech]?u.ech:'tout', larg=Math.max(320,(u.box&&u.box.clientWidth||1000)-48-302);
  /* Tout : jours par pixel calculés pour la largeur disponible, en-tête en semaines, mois ou trimestres selon la place */
  let ppd=ech==='tout'?Math.max(.5,Math.min(24,larg/(span+14))):ECH[ech].ppd;
  const hdr=ech!=='tout'?ech:ppd>=10?'sem':ppd>=2.5?'mois':'trim';
  let a0, b0;
  if(hdr==='sem'){ a0=a-3; a0-=dow(a0); b0=b+3; b0+=6-dow(b0); }
  else { const [ya,ma]=ymd(a-7), [yb,mb]=ymd(b+7); a0=debMois(ya,ma); b0=debMois(yb,mb+1)-1; }
  if(ech==='tout') ppd=Math.max(.5,Math.min(24,larg/(b0-a0+1)));
  /* titres : étendue des étapes qui les suivent */
  const span2=L.map((x,i)=>{ if(x.t!=='titre') return null; let lo=null, hi=null;
    for(let k=i+1;k<L.length&&L[k].t!=='titre';k++){ const d=J(L[k].d); if(d==null) continue; const f=L[k].t==='tache'?(J(L[k].f)??d):d; lo=lo==null?d:Math.min(lo,d); hi=hi==null?f:Math.max(hi,f); }
    return lo==null?null:{a:lo,b:hi}; });
  return {a:a0,b:b0,ppd,ech,hdr,W:Math.round((b0-a0+1)*ppd),auj,span2,debut:pa,fin:pb}; }
/* en-tête (deux rangées) et lignes verticales */
function entete(G){ const A=[], B=[], V=[], x=n=>Math.round((n-G.a)*G.ppd);
  const seg=(arr,n0,n1,t,cls)=>{ const l=x(n0), w=x(n1+1)-l; if(w<=0) return; arr.push('<span'+(cls?' class="'+cls+'"':'')+' style="left:'+l+'px;width:'+w+'px" title="'+E(t)+'">'+(w>=14?E(t):'')+'</span>'); };
  if(G.hdr==='sem'){
    for(let n=G.a;n<=G.b;){ const [y,m]=ymd(n), fin=Math.min(G.b,debMois(y,m+1)-1); seg(A,n,fin,MOISL[m]+' '+y); if(n>G.a) V.push('<i class="sgpl-v m" style="left:'+x(n)+'px"></i>'); n=fin+1; }
    for(let n=G.a;n<=G.b;n+=7){ const w=7*G.ppd; seg(B,n,Math.min(G.b,n+6),'S'+semISO(n)+(w>=90?' · '+dfr(ISO(n)).slice(0,5):'')); V.push('<i class="sgpl-v" style="left:'+x(n)+'px"></i>'); }
  } else {
    for(let n=G.a;n<=G.b;){ const [y]=ymd(n), fin=Math.min(G.b,Math.round(Date.UTC(y+1,0,1)/864e5)-1); seg(A,n,fin,String(y)); n=fin+1; }
    for(let n=G.a;n<=G.b;){ const [y,m]=ymd(n), fin=Math.min(G.b,debMois(y,m+1)-1); seg(B,n,fin,G.hdr==='mois'&&G.ppd>=3.2?MOIS[m]:MOIS3[m]); V.push('<i class="sgpl-v'+(m===0?' m':'')+'" style="left:'+x(n)+'px"></i>'); n=fin+1; }
  }
  return {h:'<div class="a">'+A.join('')+'</div><div class="b">'+B.join('')+'</div>',v:V.join('')}; }

/* ── écran ── */
const ETAT={};   /* par projet et sorte : échelle, heures réelles, défilement */
function ouvrir(C,p,type){ css(); const k=p.ID+':'+type, u=ETAT[k]||(ETAT[k]={ech:'',reel:true,sx:null});
  u.pid=String(p.ID); u.type=type; u.p=p;
  const box=document.createElement('div'); box.className='sgpl-box'; box.innerHTML='<div class="sgpl" style="color:var(--s-gris)">Chargement du planning…</div>'; C.append(box); u.box=box;
  const besoin=[T,'timelog','projectphase','projectsubphase','projectmember'];
  Promise.resolve().then(()=>DS.need?DS.need(besoin):null).catch(()=>null).then(()=>{ if(u.box!==box||!box.isConnected) return; dessiner(u);
    if(contratsOk()&&!fx()&&typeof fxEnsure==='function'&&!u.fxAttente){ u.fxAttente=true;
      fxEnsure().catch(()=>null).then(()=>{ u.fxAttente=false; if(u.box&&u.box.isConnected) dessiner(u); }); } }); }
function dessiner(u){ const box=u.box; if(!box||!box.isConnected) return;
  try{ dessiner0(u); }
  catch(e){ console.error(e); box.innerHTML='<p class="sgpl-err">Planning : erreur — '+E(e&&e.message||e)+'</p>'; } }
function dessiner0(u){ const box=u.box, p=DS.get('project',u.pid)||u.p, S=SORTES[u.type], rec=recDe(u.pid,u.type);
  const gr0=box.querySelector('.sgpl-gr'); if(gr0) u.sx=gr0.scrollLeft;
  u.p=p; u.rec=rec; u.L=((rec&&rec.LIGNES)||[]).map(x=>Object.assign({},x)); u.peut=peut(p); u.R=reel(p);
  const L=u.L, auj=AUJ(), mo=typeof projMO==='function'?projMO(p):'', G=geo(u);
  const aPP=L.some(x=>x.pp&&u.R[x.pp]);
  let html='<div class="sgpl"><div class="sgfh-tete"><div class="sgfh-id"><div class="sgfh-ini">'+E(p.NUMBER||'')+'</div><div class="sgfh-nm"><div class="lb">'+E(S.lib)+'</div><h2>'+E(p.TITLE||p.NUMBER||'')+'</h2>'
    +'<div class="sgfh-meta">'+E([mo?'Maître de l’ouvrage : '+mo:'',G?'du '+dmy(G.debut)+' au '+dmy(G.fin):'',rec&&rec.MODIFIE?'modifié le '+dfr(String(rec.MODIFIE).slice(0,10)):''].filter(Boolean).join(' · '))+'</div></div></div>'
    +'<div class="sgpl-hact">'+(L.length?'<button class="nx-btn" data-a="imprimer" title="Imprimer le planning (tableau des étapes et diagramme)">'+nxSvg('print')+'Imprimer</button>':'')+'</div></div>';
  if(!L.length){ html+=vide(u)+delais(u)+'</div>'; box.innerHTML=html; brancher(u,null); return; }
  html+=chiffres(u,G);
  const libE=k=>ECH[k].lib;
  html+='<div class="sgpl-bar"><span class="sgpl-fil" role="group" aria-label="Échelle"><span class="lb">Échelle</span>'
      +Object.keys(ECH).map(k=>'<button data-ech="'+k+'" class="'+(k===G.ech?'on':'')+'" aria-pressed="'+(k===G.ech)+'">'+libE(k)+'</button>').join('')+'</span>'
    +'<span class="sgpl-fil"><button data-a="auj" title="Faire défiler jusqu’à aujourd’hui">Aujourd’hui</button>'
      +(aPP?'<button data-a="reel" class="'+(u.reel?'on':'')+'" aria-pressed="'+!!u.reel+'" title="Barre fine grise : période principale des heures saisies sur la phase partielle liée (de 5 % à 95 % des heures)">Heures réelles</button>':'')+'</span>'
    +(u.peut?'<span class="dr"><button class="nx-btn" data-a="add" data-t="tache" title="Ajouter une tâche (une période)">'+nxSvg('plus')+'Tâche</button><button class="nx-btn" data-a="add" data-t="jalon" title="Ajouter un jalon (une date)">'+nxSvg('plus')+'Jalon</button>'
      +'<button class="nx-btn" data-a="add" data-t="titre" title="Ajouter un titre qui regroupe les étapes suivantes">'+nxSvg('plus')+'Titre</button><button class="nx-btn" data-a="creer" title="Ajouter les phases SIA, le planning d’intention du contrat'+(u.type==='chantier'?', les entreprises':'')+'…">Créer ▾</button></span>':'')
    +'</div>';
  html+=diagramme(u,G);
  html+='<div class="sgpl-leg"><span><i class="b1"></i>tâche</span><span><i class="b2"></i>jalon</span><span><i class="b3"></i>échéance importante</span>'
    +(u.reel&&aPP?'<span><i class="b4"></i>heures saisies sur la phase partielle (période principale, de 5 % à 95 % des heures)</span>':'')
    +'<span><i class="b5"></i>aujourd’hui</span>'+(u.peut?'<span>Glisser une barre pour la déplacer, ses bords pour changer le début ou la fin ; clic pour modifier ; clic droit pour le menu.</span>':'')+'</div>';
  html+=delais(u)+'</div>';
  box.innerHTML=html; brancher(u,G); }
function vide(u){ const S=SORTES[u.type], gc=ganttContrat(u.p);
  return '<div class="sgpl-vide"><b>Aucun planning pour ce projet.</b><br>'+(u.peut
      ?(u.type==='projet'?'Commencez par les phases d’étude du contrat (avant-projet, projet, demande d’autorisation) : les phases déjà travaillées reprennent les dates de la feuille d’heures, les autres suivent avec des durées types, à ajuster.'
        :'Commencez par les phases du chantier (appels d’offres, projet d’exécution, exécution, mise en service) et les jalons « Début des travaux » et « Réception de l’ouvrage », puis ajoutez les entreprises.')
      +'<div class="acts"><button class="nx-btn pri" data-a="phases">'+nxSvg('gantt')+'Créer depuis les phases SIA</button>'
      +(gc?'<button class="nx-btn" data-a="intention" title="'+E('Planning d’intention du contrat '+(gc.id||'')+' (chapitre 4 du contrat)')+'">Reprendre le planning d’intention du contrat</button>':'')
      +'<button class="nx-btn" data-a="add" data-t="tache">'+nxSvg('plus')+'Commencer avec une tâche</button></div>'
    :'Votre profil ne permet pas de le créer.')+'</div>'; }
function chiffres(u,G){ const L=u.L, auj=G.auj, kpi=(l,v,s,ti)=>'<div class="nx-kpi"'+(ti?' title="'+E(ti)+'"':'')+'><div class="l">'+E(l)+'</div><div class="v'+(/^\d\d\./.test(v)?' dt':'')+'">'+v+'</div>'+(s?'<div class="s">'+s+'</div>':'')+'</div>';
  const enC=L.filter(x=>x.t==='tache'&&J(x.d)!=null&&J(x.d)<=auj&&(J(x.f)??J(x.d))>=auj);
  const ech=L.filter(x=>x.t!=='titre'&&J(x.d)!=null).map(x=>({x,j:x.t==='jalon'?J(x.d):(J(x.f)??J(x.d))})).filter(o=>o.j>=auj).sort((a,b)=>(a.j-b.j)||((b.x.t==='jalon')-(a.x.t==='jalon')))[0];
  const nT=L.filter(x=>x.t==='tache').length, nJ=L.filter(x=>x.t==='jalon').length;
  const dans=n=>{ const d=n-auj; return d===0?'aujourd’hui':d<14?'dans '+d+' j':d<=120?'dans '+Math.round(d/7)+' sem.':'dans '+Math.round(d/30.44)+' mois'; };
  return '<div class="nx-kpis sgpl-kp">'
    +kpi('Début',dmy(G.debut),G.debut>auj?dans(G.debut):'','Date de la première étape du planning')
    +kpi('Fin prévue',dmy(G.fin),G.fin>=auj?dans(G.fin):'terminé','Date de la dernière étape du planning')
    +kpi('Durée',(n=>n<14?n+'<small>j</small>':n<=120?Math.round(n/7)+'<small>sem.</small>':Math.round(n/30.44)+'<small>mois</small>')(G.fin-G.debut+1),
      E(duree(G.fin-G.debut+1))+' · '+nT+' tâche'+(nT>1?'s':'')+' · '+nJ+' jalon'+(nJ>1?'s':''),'Du début à la fin du planning')
    +kpi('En cours',enC.length?String(enC.length):'—',enC.length?E(enC.slice(0,3).map(x=>x.lib).join(' · '))+(enC.length>3?' …':''):'aucune tâche aujourd’hui','Tâches dont la période comprend aujourd’hui')
    +kpi('Prochaine échéance',ech?dmy(ech.j):'—',ech?E(ech.x.lib)+' · '+dans(ech.j):'aucune','Prochain jalon ou prochaine fin de tâche')
    +'</div>'; }
function diagramme(u,G){ const L=u.L, x=n=>Math.round((n-G.a)*G.ppd), en=entete(G), auj=G.auj;
  const gauche=L.map((l,i)=>{ const d=J(l.d), f=l.t==='tache'?(J(l.f)??d):d, sp=G.span2[i];
    const dt=l.t==='titre'?'':l.t==='jalon'?dmy(d):(dmy(d)+' – '+dmy(f)+(d!=null&&f!=null?' · '+duree(f-d+1):''));
    const ti=[l.lib,l.pp?'Phase '+l.pp+' — '+(PP[l.pp]||''):'',l.t==='titre'&&sp?dmy(sp.a)+' – '+dmy(sp.b):dt,l.ent?'Intervenant : '+l.ent:'',l.rem||'',l.pp&&u.R[l.pp]?'Heures saisies : '+nxH(u.R[l.pp].h)+' h, surtout du '+dmy(u.R[l.pp].a)+' au '+dmy(u.R[l.pp].b)+' (première heure le '+dmy(u.R[l.pp].a0)+', dernière le '+dmy(u.R[l.pp].b0)+')':''].filter(Boolean).join('\n');
    return '<div class="sgpl-r t-'+l.t+(l.rouge?' rouge':'')+(u.peut?' ed':'')+'" data-i="'+i+'" title="'+E(ti)+'"><div class="l">'+(l.t==='jalon'?'<i class="jl"></i>':'')+(l.pp?'<span class="pp">'+l.pp+'</span>':'')+E(l.lib||'(sans nom)')+'</div>'
      +(l.t!=='titre'?'<div class="dt" data-dt="'+i+'">'+E([dt,l.ent!==l.lib?l.ent:''].filter(Boolean).join(' · '))+'</div>':'')+'</div>'; }).join('');
  const droite=L.map((l,i)=>{ const d=J(l.d); let b='';
    if(l.t==='titre'){ const sp=G.span2[i]; if(sp) b='<div class="sgpl-b t" style="left:'+x(sp.a)+'px;width:'+Math.max(6,x(sp.b+1)-x(sp.a))+'px"></div>'; }
    else if(d!=null&&l.t==='jalon') b='<div class="sgpl-b j'+(l.rouge?' rouge':'')+(u.peut?' ed':'')+'" data-i="'+i+'" style="left:'+(Math.round((d-G.a+.5)*G.ppd)-7)+'px"></div>'
      +'<span class="sgpl-bl" style="left:'+(Math.round((d-G.a+.5)*G.ppd)+11)+'px">'+E(dmy(d).slice(0,5))+'</span>';
    else if(d!=null){ const f=J(l.f)??d, w=Math.max(3,x(f+1)-x(d));
      b='<div class="sgpl-b'+(l.rouge?' rouge':'')+(u.peut?' ed':'')+'" data-i="'+i+'" style="left:'+x(d)+'px;width:'+w+'px">'+(u.peut?'<i class="g"></i><i class="dr"></i>':'')+'</div>'; }
    const r=u.reel&&l.pp&&u.R[l.pp];
    if(r&&l.t!=='titre') b+='<div class="sgpl-re" style="left:'+x(r.a)+'px;width:'+Math.max(3,x(r.b+1)-x(r.a))+'px"></div>';
    return '<div class="sgpl-rr t-'+l.t+'" data-i="'+i+'">'+b+'</div>'; }).join('');
  const aujL=auj>=G.a&&auj<=G.b?'<div class="sgpl-auj" style="left:'+Math.round((auj-G.a+.5)*G.ppd)+'px"><b>'+E(dfr(ISO(auj)).slice(0,5))+'</b></div>':'';
  return '<div class="sgpl-g"><div class="sgpl-gl"><div class="sgpl-h">Étapes</div>'+gauche+'</div>'
    +'<div class="sgpl-gr"><div class="sgpl-gt" style="width:'+G.W+'px"><div class="sgpl-h">'+en.h+'</div><div class="sgpl-gb">'+en.v+aujL+droite+'</div></div></div></div>'; }
/* rappel des délais du planning d'intention des contrats (texte du contrat) */
function delais(u){ const cs=delaisContrats(u.p); if(!cs.length) return '';
  return '<section class="sgpl-sec"><h3>Planning d’intention du contrat</h3><dl class="sgpl-del">'
    +cs.map(c=>(cs.length>1?'<div class="c">'+E(etiq(c))+'</div>':'')+c.detail.planDelais.filter(x=>x&&(String(x[0]||'').trim()||String(x[1]||'').trim()))
      .map(x=>'<dt>'+E(x[0]||'')+'</dt><dd>'+E(x[1]||'')+'</dd>').join('')).join('')+'</dl></section>'; }

/* ── actions ── */
function brancher(u,G){ const box=u.box;
  box.onclick=e=>{ const t=e.target.closest('[data-a],[data-ech]'); if(!t||!box.contains(t)) return;
    if(t.dataset.ech){ u.ech=t.dataset.ech; u.sx=null; dessiner(u); return; }
    const a=t.dataset.a;
    if(a==='reel'){ u.reel=!u.reel; dessiner(u); }
    else if(a==='auj'){ allerAuj(u,G,true); }
    else if(a==='add') ajouter(u,t.dataset.t,u.L.length-1);
    else if(a==='phases') creerPhases(u);
    else if(a==='intention') reprendreIntention(u);
    else if(a==='creer'){ const r=t.getBoundingClientRect(); menuCreer(u,r.left,r.bottom+2); }
    else if(a==='imprimer') imprimer(u,G); };
  if(!G) return;
  const gl=box.querySelector('.sgpl-gl'), gr=box.querySelector('.sgpl-gr');
  if(u.sx!=null) gr.scrollLeft=u.sx; else allerAuj(u,G,false);
  gr.addEventListener('scroll',()=>{ u.sx=gr.scrollLeft; },{passive:true});
  const ligne=el=>{ const r=el&&el.closest('[data-i]'); return r&&box.contains(r)?+r.dataset.i:null; };
  const survol=i=>box.querySelectorAll('.sgpl-r,.sgpl-rr').forEach(r=>r.classList.toggle('hov',i!=null&&+r.dataset.i===i));
  [gl,gr].forEach(z=>{ z.addEventListener('mouseover',e=>survol(ligne(e.target))); z.addEventListener('mouseleave',()=>survol(null));
    z.addEventListener('contextmenu',e=>{ const i=ligne(e.target); if(i==null||!u.peut||e.altKey) return; e.preventDefault(); menuLigne(u,i,e.clientX,e.clientY); }); });
  gl.addEventListener('click',e=>{ const i=ligne(e.target); if(i!=null&&u.peut) editer(u,i); });
  if(u.peut) gr.addEventListener('pointerdown',e=>glisser(u,G,e)); }
function allerAuj(u,G,doux){ const gr=u.box.querySelector('.sgpl-gr'); if(!gr||!G) return;
  const cible=G.auj>=G.a&&G.auj<=G.b?G.auj:G.debut, x=Math.max(0,Math.round((cible-G.a)*G.ppd)-Math.min(160,gr.clientWidth/4));
  if(doux) gr.scrollTo({left:x,behavior:'smooth'}); else gr.scrollLeft=x; u.sx=x; }
/* glisser une barre : déplacer (milieu), début (bord gauche), fin (bord droit) ; sans mouvement = modifier */
function glisser(u,G,e){ if(e.button!==0) return; const b=e.target.closest('.sgpl-b.ed'); if(!b) return; const i=+b.dataset.i, l=u.L[i]; if(!l) return;
  const mode=l.t==='jalon'?'m':e.target.classList.contains('g')?'g':e.target.classList.contains('dr')?'f':'m';
  const d0=J(l.d), f0=l.t==='tache'?(J(l.f)??d0):d0, X0=e.clientX, dt=u.box.querySelector('[data-dt="'+i+'"]'), lb=b.nextElementSibling&&b.nextElementSibling.classList.contains('sgpl-bl')?b.nextElementSibling:null;
  let d=d0, f=f0, bouge=false; const tip=document.createElement('div'); tip.className='sgpl-tip';
  e.preventDefault(); try{ b.setPointerCapture(e.pointerId); }catch(_){}
  const mv=ev=>{ if(!bouge&&Math.abs(ev.clientX-X0)<4) return; if(!bouge){ bouge=true; document.body.append(tip); }
    const pas=G.ppd<3?7:1, n=Math.round((ev.clientX-X0)/G.ppd/pas)*pas; d=d0; f=f0;   /* petite échelle : par semaines entières */
    if(mode==='m'){ d=d0+n; f=f0+n; } else if(mode==='g') d=Math.min(f0,d0+n); else f=Math.max(d0,f0+n);
    if(l.t==='jalon'){ const px=Math.round((d-G.a+.5)*G.ppd); b.style.left=(px-7)+'px'; if(lb){ lb.style.left=(px+11)+'px'; lb.textContent=dmy(d).slice(0,5); } }
    else { b.style.left=Math.round((d-G.a)*G.ppd)+'px'; b.style.width=Math.max(3,Math.round((f+1-G.a)*G.ppd)-Math.round((d-G.a)*G.ppd))+'px'; }
    const txt=l.t==='jalon'?dmy(d):dmy(d)+' – '+dmy(f)+' · '+duree(f-d+1);
    tip.textContent=txt; tip.style.left=(ev.clientX+12)+'px'; tip.style.top=(ev.clientY-28)+'px'; if(dt) dt.textContent=[txt,l.ent!==l.lib?l.ent:''].filter(Boolean).join(' · '); };
  const fin=ev=>{ b.removeEventListener('pointermove',mv); b.removeEventListener('pointerup',fin); b.removeEventListener('pointercancel',fin); tip.remove();
    if(!bouge){ if(ev.type==='pointerup') editer(u,i); return; }
    if(d===d0&&f===f0) return;
    const L=u.L.map(x=>Object.assign({},x)); L[i].d=ISO(d); if(l.t==='tache') L[i].f=ISO(f);
    sauver(u,L,null); };
  b.addEventListener('pointermove',mv); b.addEventListener('pointerup',fin); b.addEventListener('pointercancel',fin); }
/* enregistrement : un seul enregistrement par projet et par sorte */
const propre=x=>{ const o={id:x.id||nouvId(),t:['tache','jalon','titre'].includes(x.t)?x.t:'tache',lib:String(x.lib||'').trim().slice(0,160)};
  if(o.t!=='titre'){ if(J(x.d)!=null) o.d=ISO(J(x.d)); if(o.t==='tache'&&J(x.f)!=null) o.f=ISO(Math.max(J(x.f),J(x.d)??J(x.f))); }
  if(+x.pp&&PP[+x.pp]) o.pp=+x.pp; if(String(x.ent||'').trim()) o.ent=String(x.ent).trim().slice(0,160);
  if(x.rouge&&o.t!=='titre') o.rouge=true; if(String(x.rem||'').trim()) o.rem=String(x.rem).trim().slice(0,1000); return o; };
async function sauver(u,L,msg){ if(!u.peut){ dire('Lecture seule : votre profil ne permet pas de modifier le planning de ce projet.',true); return false; }
  if(u.enCours) return false;
  const id=u.pid+':'+u.type, r0=DS.get(T,id);
  const val=Object.assign(r0?Object.assign({},r0):{ID:id,PROJECT_ID:u.p.ID,TYPE:u.type},{LIGNES:L.map(propre),MODIFIE:new Date().toISOString(),PAR:moi()||null});
  u.enCours=true; let ok=false;
  try{ await DS.commit([{t:T,id,val,bseq:r0?ver(id):0}]); ok=true; }
  catch(e){ if(!e||!e.conflict) console.error(e); }   /* message déjà affiché par la base (conflit, droits, serveur) */
  finally{ u.enCours=false; }
  if(ok&&msg) dire(msg);
  dessiner(u); return ok; }
/* nouvelle ligne après la ligne i : à la suite de la dernière étape datée qui précède, sinon aujourd'hui */
function ajouter(u,t,i){ let ref=null; for(let k=Math.min(i,u.L.length-1);k>=0;k--){ const l=u.L[k]; if(l.t==='titre') continue; const d=J(l.d); if(d==null) continue; ref=l.t==='tache'?(J(l.f)??d):d; break; }
  const d=ref!=null?(t==='jalon'?ref:ref+1):AUJ();
  const l={id:nouvId(),t,lib:'',d:t==='titre'?undefined:ISO(d),f:t==='tache'?ISO(d+27):undefined};
  editer(u,i+1,l); }
/* fenêtre « Modifier l'étape » / « Nouvelle étape » ; neuf = ligne à insérer à l'index i */
function editer(u,i,neuf){ if(!u.peut) return; const l0=neuf||u.L[i]; if(!l0) return; const l=Object.assign({},l0);
  const membres=[...new Set(DS.by('projectmember','PROJECT_ID',u.p.ID).filter(m=>!m.ISHIDDEN).map(m=>{ try{ return contactName(DS.get('contact',m.CONTACT_ID)); }catch(_){ return ''; } }).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr'));
  const dl='sgpl-ent-'+nouvId(), body=document.createElement('div'); body.className='sgpl-dlg';
  body.innerHTML='<div class="seg" role="group" aria-label="Sorte">'+[['tache','Tâche'],['jalon','Jalon'],['titre','Titre']].map(([k,t])=>'<button type="button" data-t="'+k+'">'+t+'</button>').join('')+'</div>'
    +'<label class="w">Libellé<input data-k="lib" maxlength="160" value="'+E(l.lib||'')+'" placeholder="Ex. Projet de l’ouvrage, Gros œuvre, Réception de l’ouvrage"></label>'
    +'<label class="w" data-x="pp">Phase partielle SIA liée (heures réelles)<select data-k="pp"><option value="">Aucune</option>'+Object.keys(PP).map(n=>'<option value="'+n+'"'+(+l.pp===+n?' selected':'')+'>'+n+' '+E(PP[n])+'</option>').join('')+'</select></label>'
    +'<label data-x="d"><span data-lbd>Début</span><input type="date" data-k="d" value="'+E(l.d||'')+'"></label>'
    +'<label data-x="sem">Durée (semaines)<input type="number" data-k="sem" min="0.1" step="0.5"></label>'
    +'<label data-x="f">Fin<input type="date" data-k="f" value="'+E(l.f||'')+'"></label>'
    +'<label class="w" data-x="ent">Entreprise / intervenant<input data-k="ent" list="'+dl+'" maxlength="160" value="'+E(l.ent||'')+'"><datalist id="'+dl+'">'+membres.map(n=>'<option value="'+E(n)+'">').join('')+'</datalist></label>'
    +'<label class="chk" data-x="rouge"><input type="checkbox" data-k="rouge"'+(l.rouge?' checked':'')+'>Échéance importante (en rouge)</label>'
    +'<label class="w">Remarque<textarea data-k="rem" maxlength="1000">'+E(l.rem||'')+'</textarea></label>';
  const q=k=>body.querySelector('[data-k="'+k+'"]'), sem=q('sem');
  const majSem=()=>{ const d=J(q('d').value), f=J(q('f').value); sem.value=d!=null&&f!=null&&f>=d?String(Math.round((f-d+1)/7*10)/10):''; };
  const majType=()=>{ body.querySelectorAll('.seg button').forEach(b=>b.classList.toggle('on',b.dataset.t===l.t));
    ['pp','d','ent','rouge'].forEach(k=>{ body.querySelector('[data-x="'+k+'"]').hidden=l.t==='titre'; });
    ['sem','f'].forEach(k=>{ body.querySelector('[data-x="'+k+'"]').hidden=l.t!=='tache'; });
    body.querySelector('[data-lbd]').textContent=l.t==='jalon'?'Date':'Début'; };
  body.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{ l.t=b.dataset.t; if(l.t==='tache'&&!q('f').value&&J(q('d').value)!=null){ q('f').value=ISO(J(q('d').value)+27); majSem(); } majType(); });
  q('d').addEventListener('change',()=>{ const d=J(q('d').value), s=parseFloat(sem.value); if(d!=null&&l.t==='tache'&&s>0) q('f').value=ISO(d+Math.max(1,Math.round(s*7))-1); majSem(); });
  q('f').addEventListener('change',majSem);
  sem.addEventListener('input',()=>{ const d=J(q('d').value), s=parseFloat(sem.value); if(d!=null&&s>0) q('f').value=ISO(d+Math.max(1,Math.round(s*7))-1); });
  q('pp').addEventListener('change',()=>{ const n=+q('pp').value; if(n&&!q('lib').value.trim()) q('lib').value=PP[n]; });
  majSem(); majType();
  const lire=()=>{ const o=Object.assign({},l,{lib:q('lib').value.trim(),pp:+q('pp').value||null,d:q('d').value,f:q('f').value,ent:q('ent').value.trim(),rouge:q('rouge').checked,rem:q('rem').value.trim()});
    if(!o.lib&&o.pp) o.lib=PP[o.pp];
    if(!o.lib){ dire('Donnez un libellé à l’étape.',true); q('lib').focus(); return null; }
    if(o.t!=='titre'&&J(o.d)==null){ dire(o.t==='jalon'?'Indiquez la date du jalon.':'Indiquez la date de début.',true); q('d').focus(); return null; }
    if(o.t==='tache'){ if(J(o.f)==null) o.f=o.d; if(J(o.f)<J(o.d)){ dire('La fin est avant le début.',true); q('f').focus(); return null; } }
    if(o.t!=='tache') delete o.f; if(o.t==='titre'){ delete o.d; delete o.pp; delete o.ent; delete o.rouge; }
    return o; };
  const boutons=[];
  if(!neuf) boutons.push({t:'Supprimer',fn:()=>{ supprimer(u,i); }});
  boutons.push({t:'Annuler'},{t:neuf?'Ajouter':'OK',pri:true,fn:()=>{ const o=lire(); if(!o) return false; const L=u.L.map(x=>Object.assign({},x)); if(neuf) L.splice(i,0,o); else L[i]=o;
    sauver(u,L,neuf?'Étape ajoutée au planning.':null); }});
  dialog({title:neuf?'Nouvelle étape':'Modifier l’étape',width:'560px',body,buttons:boutons});
  setTimeout(()=>{ const f=q('lib'); if(f){ f.focus(); f.select(); } },0); }
function supprimer(u,i){ const l=u.L[i]; if(!l) return;
  confirmer('Supprimer « '+(l.lib||'(sans nom)')+' » du planning ?'+(l.t==='titre'?'\n\nSeul le titre est supprimé : les étapes qui le suivent restent.':''),()=>{ const L=u.L.map(x=>Object.assign({},x)); L.splice(i,1); sauver(u,L,'Étape supprimée.'); },{title:'Supprimer l’étape',yesText:'Supprimer'}); }
function menuLigne(u,i,x,y){ const L=u.L, l=L[i], dep=(k)=>{ const M=L.map(z=>Object.assign({},z)); const j=i+k; if(j<0||j>=M.length) return; [M[i],M[j]]=[M[j],M[i]]; sauver(u,M,null); };
  sgMenuAt(x,y,[{t:'Modifier…',fn:()=>editer(u,i)},'-',{t:'Insérer une tâche dessous',fn:()=>ajouter(u,'tache',i)},{t:'Insérer un jalon dessous',fn:()=>ajouter(u,'jalon',i)},{t:'Insérer un titre dessous',fn:()=>ajouter(u,'titre',i)},'-',
    {t:'Monter',dis:i===0,fn:()=>dep(-1)},{t:'Descendre',dis:i===L.length-1,fn:()=>dep(1)},{t:'Dupliquer',fn:()=>{ const M=L.map(z=>Object.assign({},z)); M.splice(i+1,0,Object.assign({},l,{id:nouvId(),lib:(l.lib||'')+' (copie)'})); sauver(u,M,null); }},'-',
    {t:'Supprimer…',danger:true,fn:()=>supprimer(u,i)}]); }
function menuCreer(u,x,y){ const gc=ganttContrat(u.p), ent=u.type==='chantier'?entreprises(u.p):[];
  sgMenuAt(x,y,[{t:'Ajouter les phases SIA',fn:()=>creerPhases(u)},{t:'Reprendre le planning d’intention du contrat',dis:!gc,fn:()=>reprendreIntention(u)},
    ...(u.type==='chantier'?[{t:'Ajouter les entreprises du projet ('+ent.length+')',dis:!ent.length,fn:()=>ajouterEntreprises(u)}]:[]),'-',
    {t:'Effacer tout le planning…',danger:true,dis:!u.L.length,fn:()=>confirmer('Effacer tout le '+SORTES[u.type].lib.toLowerCase()+' de '+(u.p.NUMBER||'ce projet')+' ?\n\n'+u.L.length+' étape'+(u.L.length>1?'s':'')+' supprimée'+(u.L.length>1?'s':'')+'.',()=>sauver(u,[],'Planning effacé.'),{title:'Effacer le planning',yesText:'Effacer'})}]); }

/* ── création ── */
/* phases SIA de la sorte (celles des contrats de l'affaire, sinon les phases types) : phases déjà travaillées aux dates de la feuille d'heures,
   les autres à la suite (durées types DUREE) ; jalons aux limites (dépôt de la demande, permis ; début des travaux, réception) ; seules les
   phases et les jalons absents du planning sont ajoutés */
function creerPhases(u){ const p=u.p, S=SORTES[u.type], cs=phasesContrat(p), R=u.R, auj=AUJ();
  let ns=S.pp.filter(n=>cs&&cs.size&&S.pp.some(m=>cs.has(m))?cs.has(n):n!==21);
  const deja=new Set(u.L.map(x=>+x.pp).filter(Boolean)); ns=ns.filter(n=>!deja.has(n));
  const libs=new Set(u.L.map(x=>String(x.lib||'').toLowerCase()));
  /* jalons : [phase, limite, libellé, rouge] ; dépôt de la demande = début de la procédure (sinon fin du projet de l'ouvrage) */
  const jal=u.type==='projet'?[[[[33,'d'],[32,'f']],'Dépôt de la demande de permis de construire',false],[[[33,'f']],'Permis de construire',true]]
    :[[[[52,'d']],'Début des travaux',false],[[[52,'f']],'Réception de l’ouvrage',true]];
  if(!ns.length&&jal.every(j=>libs.has(j[1].toLowerCase()))){ dire('Les phases SIA sont déjà dans le planning.'); return; }
  /* point de départ : fin des étapes déjà planifiées ; chantier : sinon fin du planning du projet */
  let cur=null; u.L.forEach(x=>{ const d=J(x.d); if(d==null) return; const f=x.t==='tache'?(J(x.f)??d):d; cur=cur==null?f+1:Math.max(cur,f+1); });
  if(cur==null&&u.type==='chantier'){ const rp=recDe(u.pid,'projet'); ((rp&&rp.LIGNES)||[]).forEach(x=>{ const d=J(x.d); if(d==null) return; const f=x.t==='tache'?(J(x.f)??d):d; cur=cur==null?f+1:Math.max(cur,f+1); }); }
  const tous=Object.keys(R).map(Number), dates={}, nouv=[];
  ns.forEach((n,k)=>{ const r=R[n]; let d, f;
    if(r){ const fini=r.b<auj-30||tous.some(m=>m>n&&R[m]); d=r.a; f=fini?r.b:Math.max(r.b,r.a+DUREE[n]-1); }
    else { const nx=ns.slice(k+1).find(m=>R[m]);
      if(nx){ f=R[nx].a-1; d=cur!=null?Math.min(cur,f):f-DUREE[n]+1; if(d>f) d=f; }
      else { d=Math.max(cur??auj,auj); f=d+DUREE[n]-1; } }
    dates[n]={d,f}; cur=f+1; nouv.push({id:nouvId(),t:'tache',lib:PP[n],pp:n,d:ISO(d),f:ISO(f)}); });
  /* jalons : après la phase concernée (phase déjà au planning ou ajoutée) */
  const datesDe=n=>{ if(dates[n]) return dates[n]; const l=u.L.find(x=>+x.pp===n&&x.t==='tache'&&J(x.d)!=null); return l?{d:J(l.d),f:J(l.f)??J(l.d)}:null; };
  const L=u.L.map(x=>Object.assign({},x)).concat(nouv);
  jal.forEach(([cands,lib,rouge])=>{ if(libs.has(lib.toLowerCase())) return; const k=cands.find(([n])=>datesDe(n)); if(!k) return; const [n,c]=k, ds=datesDe(n);
    const j={id:nouvId(),t:'jalon',lib,d:ISO(ds[c]),rouge:rouge||undefined};
    const idx=L.findIndex(x=>+x.pp===n&&x.t==='tache'); if(idx<0){ L.push(j); return; } L.splice(c==='d'?idx:idx+1,0,j); });
  const nb=L.length-u.L.length;
  sauver(u,L,nb+' étape'+(nb>1?'s':'')+' ajoutée'+(nb>1?'s':'')+(cs&&cs.size?' (phases du contrat)':'')+' : vérifiez les dates.'); }
/* planning d'intention graphique du contrat (mois) → titres et tâches datées */
function reprendreIntention(u){ const c=ganttContrat(u.p); if(!c){ dire('Aucun contrat de l’affaire n’a de planning d’intention graphique (chapitre 4, planning en mois).',true); return; }
  const g=c.detail.planGantt, [y0,m0]=g.m0.split('-').map(Number), deb=k=>debMois(y0,m0-1+k-1), fin=k=>debMois(y0,m0-1+k)-1;
  const nouv=(g.rows||[]).map((r,k)=>r&&r.t==='sec'?{id:nouvId(),t:'titre',lib:String(r.lbl||'').trim()||'Étape '+(k+1)}
    :r&&r.t==='bar'?{id:nouvId(),t:'tache',lib:String(r.lbl||'').trim()||'Étape '+(k+1),d:ISO(deb(Math.max(1,+r.a||1))),f:ISO(fin(Math.max(+r.a||1,+r.b||+r.a||1))),rouge:!!r.red||undefined}:null).filter(Boolean);
  const faire=()=>sauver(u,u.L.map(x=>Object.assign({},x)).concat(nouv),nouv.length+' étape'+(nouv.length>1?'s':'')+' reprise'+(nouv.length>1?'s':'')+' du contrat '+(c.id||'')+'.');
  if(u.L.length) confirmer('Ajouter les '+nouv.length+' étapes du planning d’intention du contrat '+(c.id||'')+' à la suite du planning ?',faire,{title:'Planning d’intention',yesText:'Ajouter'}); else faire(); }
/* entreprises du projet (intervenants « Entreprises », rôle 19) */
function entreprises(p){ return [...new Set(DS.by('projectmember','PROJECT_ID',p.ID).filter(m=>+m.TEAMROLECODE===19&&!m.ISHIDDEN).sort((a,b)=>cmp(a.SORTORDER,b.SORTORDER))
  .map(m=>{ try{ return contactName(DS.get('contact',m.CONTACT_ID)); }catch(_){ return ''; } }).filter(Boolean))]; }
function ajouterEntreprises(u){ const E0=entreprises(u.p), deja=new Set(u.L.map(x=>String(x.ent||x.lib||'').toLowerCase())), N=E0.filter(n=>!deja.has(n.toLowerCase()));
  if(!N.length){ dire('Toutes les entreprises du projet sont déjà dans le planning.'); return; }
  const ex=u.L.find(x=>+x.pp===52&&x.t==='tache'&&J(x.d)!=null), d=ex?J(ex.d):AUJ(), f=ex?(J(ex.f)??d):d+27;
  const L=u.L.map(x=>Object.assign({},x)); if(!L.some(x=>x.t==='titre'&&/travaux/i.test(x.lib||''))) L.push({id:nouvId(),t:'titre',lib:'Travaux par entreprise'});
  N.forEach(n=>L.push({id:nouvId(),t:'tache',lib:n,ent:n,d:ISO(d),f:ISO(f)}));
  sauver(u,L,N.length+' entreprise'+(N.length>1?'s':'')+' ajoutée'+(N.length>1?'s':'')+' : ajustez leurs dates.'); }

/* ── impression : tableau des étapes et diagramme (SVG), au papier des contrats (sgImprimer) ── */
function imprimer(u,G){ if(!G||typeof sgImprimer!=='function') return; const p=u.p, L=u.L, S=SORTES[u.type];
  const W=760, LW=250, CW=W-LW-6, top=34, rh=20, Hh=top+L.length*rh+6, a=G.debut, b=Math.max(G.fin,a+1), sx=n=>LW+(n-a)/(b-a+1)*CW;
  const t=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const [ya,ma]=ymd(a), nM=(ymd(b)[0]-ya)*12+ymd(b)[1]-ma+1, pas=nM<=14?1:nM<=30?2:nM<=60?3:6;
  let s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+Hh+'" width="'+W+'" height="'+Hh+'" style="width:100%;height:auto;font-family:inherit">';
  for(let k=0;k<=nM;k++){ const n=debMois(ya,ma+k); if(n>b+1) break; const xx=Math.max(LW,sx(n));
    s+='<line x1="'+xx.toFixed(1)+'" y1="'+(top-8)+'" x2="'+xx.toFixed(1)+'" y2="'+(Hh-4)+'" stroke="#d6d6d6" stroke-width="0.6"/>';
    if(k%pas===0&&n<=b){ const [yy,mm]=ymd(n); s+='<text x="'+(xx+2).toFixed(1)+'" y="'+(top-12)+'" font-size="10" fill="#1d1d1b">'+t(MOIS3[mm]+(mm===0||k===0?' '+yy:''))+'</text>'; } }
  L.forEach((l,i)=>{ const y=top+i*rh, d=J(l.d);
    s+='<text x="0" y="'+(y+14)+'" font-size="11"'+(l.t==='titre'?' font-weight="700"':'')+' fill="#1d1d1b">'+t((l.pp?l.pp+' ':'')+String(l.lib||'').slice(0,38))+'</text>';
    if(l.t==='titre'){ const sp=G.span2[i]; if(sp) s+='<rect x="'+sx(sp.a).toFixed(1)+'" y="'+(y+7)+'" width="'+Math.max(2,sx(sp.b+1)-sx(sp.a)).toFixed(1)+'" height="3" fill="#1d1d1b"/>'; }
    else if(d!=null&&l.t==='jalon'){ const cx=sx(d+.5); s+='<polygon points="'+cx.toFixed(1)+','+(y+3)+' '+(cx+6).toFixed(1)+','+(y+9)+' '+cx.toFixed(1)+','+(y+15)+' '+(cx-6).toFixed(1)+','+(y+9)+'" fill="'+(l.rouge?'#bd1e42':'#003346')+'"/>'
      +'<text x="'+(cx+9).toFixed(1)+'" y="'+(y+13)+'" font-size="9.5" fill="#706f6f">'+t(dmy(d))+'</text>'; }
    else if(d!=null){ const f=J(l.f)??d; s+='<rect x="'+sx(d).toFixed(1)+'" y="'+(y+4)+'" width="'+Math.max(2,sx(f+1)-sx(d)).toFixed(1)+'" height="10" fill="'+(l.rouge?'#bd1e42':'#003346')+'"/>'; } });
  if(G.auj>=a&&G.auj<=b){ const xx=sx(G.auj+.5); s+='<line x1="'+xx.toFixed(1)+'" y1="'+(top-6)+'" x2="'+xx.toFixed(1)+'" y2="'+(Hh-4)+'" stroke="#1d1d1b" stroke-width="0.8" stroke-dasharray="3 2"/>'; }
  s+='</svg>';
  const ent=L.some(l=>l.ent&&l.ent!==l.lib), rows=L.map(l=>{ const d=J(l.d), f=l.t==='tache'?(J(l.f)??d):d;
    return l.t==='titre'?'<tr><td colspan="'+(ent?5:4)+'"><b>'+t(l.lib)+'</b></td></tr>'
      :'<tr><td>'+t((l.pp?l.pp+' ':'')+(l.lib||''))+(l.t==='jalon'?' (jalon)':'')+'</td><td>'+dmy(d)+'</td><td>'+(l.t==='tache'?dmy(f):'')+'</td><td>'+(l.t==='tache'&&d!=null?t(duree(f-d+1)):'')+'</td>'+(ent?'<td>'+t(l.ent!==l.lib?l.ent||'':'')+'</td>':'')+'</tr>'; }).join('');
  sgImprimer(S.lib+' — '+(p.NUMBER||'')+' '+(p.TITLE||''),'<p>'+t('Du '+dmy(G.debut)+' au '+dmy(G.fin)+' · '+duree(G.fin-G.debut+1)+' · état au '+dmy(G.auj))+'</p>'+s
    +'<table><tr><th>Étape</th><th>Début</th><th>Fin</th><th>Durée</th>'+(ent?'<th>Entreprise / intervenant</th>':'')+'</tr>'+rows+'</table>'); }

/* compteur de la tuile de la page du projet */
function compte(p,type){ const r=recDe(p.ID,type), L=(r&&r.LIGNES)||[], n=L.filter(x=>x.t!=='titre').length; if(!n) return 'à créer';
  let fin=null; L.forEach(x=>{ const d=J(x.d); if(d==null) return; const f=x.t==='tache'?(J(x.f)??d):d; fin=fin==null?f:Math.max(fin,f); });
  return n+' étape'+(n>1?'s':'')+(fin!=null?' · fin '+dfr(ISO(fin)).slice(3):''); }

window.sgPlanningModule=function(C,p,type){ try{ ouvrir(C,p,SORTES[type]?type:'projet'); }
  catch(e){ console.error(e); const d=document.createElement('p'); d.className='sgpl-err'; d.textContent='Planning : erreur — '+String(e&&e.message||e); C.append(d); } };
window.sgPlanningCompte=(p,type)=>{ try{ return compte(p,type); }catch(_){ return ''; } };
window.SGPL={version:'02.11.2026',ETAT,PP,DUREE,reel,geo,creerPhases,ganttContrat,delaisContrats};
})();

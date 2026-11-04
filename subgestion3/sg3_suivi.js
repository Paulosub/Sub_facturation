/* ═══ SUIVI DU PROJET : SÉANCES, NOTES, TÂCHES, FRAIS (04.11.2026, bloc 35 ; demandes de Paulo : « proposer une autre mise en page des modules
   séances, plus proche du design du reste de l'app », « applique la version B », « adapte notes également à l'app », « idem pour tâches »,
   « idem pour note frais ») ═══
   Page du projet ▸ Suivi du projet : mêmes données et mêmes fenêtres que le moteur, autre présentation (DeltaSub.html seul garde les écrans
   d'origine ; maquette des variantes A, B, C : subgestion3/_backup_20261104_maquette_seances/).
   Séances (mtDomain remplacé, variante B) : colonne des séries et procès-verbaux (classes .sgd-* de Listes de diffusion), à droite le
   procès-verbal choisi — bandeau jaune, chiffres, vues Procès-verbal · Points ouverts de la série · Présences. Sélection dans MT.seq / MT.mtg,
   comme le moteur : ses fenêtres y posent ce qu'elles créent. État d'un procès-verbal : Diffusé (pas brouillon), Prévue (brouillon à venir),
   Brouillon. Point ouvert : non réglé, et Tâche, Point ouvert ou délai ; dans la série, l'occurrence la plus récente d'un point fait foi (les
   points sont copiés d'un procès-verbal au suivant, sans lien : reconnus par leur titre, sinon leur texte).
   Notes (branche « Notes » de domainView remplacée) : colonne par année + recherche, note à droite. Tâches (ptDomain remplacé) : colonne par
   état + recherche, chiffres du projet, fiche de la tâche et ses notes. Frais (sgFraisModule) : bandeau, chiffres, années, tableau.
   PV MO (Projet ▸ PV MO, 04.11.2026, Paulo : « reproduit séance dans pv MO, la structure de présentation mais pour des question de MO et décision ») :
   même présentation que Séances, mêmes tables du moteur (meetingsequence, meeting, meetingparticipant, meetingitem) ; séries du genre « PV MO »
   (RX_MO : aussi « Maître de l'ouvrage » ; créé à la première séance), une série par phase SIA (NUMBER = 31, 32…) ; ces séries ne sont plus dans Séances.
   Point : Question = catégorie 4 (TITLE = question, TEXT = réponse, réglé = répondu), Décision = catégorie 2, le reste = Information. Vues Procès-verbal ·
   Questions ouvertes (toutes phases, la dernière occurrence fait foi) · Décisions (registre du projet) · Fichiers (dossiers « PV MO » des phases, déjà déposés).
   Droits : modifier = projet modifiable, comme le Planning (Frais : règles de editCost / delCost, comme avant) ; imprimer et lire : qui voit le projet.
   La page se redessine à chaque changement de la base (drawC) : état par projet dans ETAT, défilement et focus de la recherche rétablis.
   Débogage : window.SGSV. Styles <style id="sgsv-css">, classes sgsv-*. */
(function(){
if(typeof VIEWS!=='object'||typeof mtDomain!=='function'||typeof ptDomain!=='function'||typeof domainView!=='function') return;

const CSS=`
.sgsv-box{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;overflow:hidden}
.sgsv-charge{padding:20px 24px;color:var(--s-gris);font-size:13px}
.sgsv-err{padding:20px 24px;color:var(--s-rouge)}
.sgsv{flex:1 1 auto;min-height:0;overflow:auto;padding:16px 24px 28px;box-sizing:border-box;container:sgsv/inline-size}
.sgsv .sgfh-tete,.sgsv-b .sgfh-tete{margin:0}
.sgsv-hact{display:flex;gap:8px;flex-wrap:wrap;margin-left:auto}
.sgsv-b .sgfh-nm h2{font-size:22px}
.sgsv-b .sgfh-ini{font-size:30px}
.sgsv-kp{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));margin:14px 0 20px}
.sgsv-kp .nx-kpi .s{white-space:normal}
.sgsv-kp .nx-kpi .v.ret{color:var(--s-rouge)}
.sgsv-fil{display:flex;align-items:center;gap:4px 18px;flex-wrap:wrap;padding:8px 0 10px;border-top:2px solid var(--s-noir)}
.sgsv-fil>button:not(.nx-btn){border:0;background:none;padding:2px 0 3px;font:inherit;font-size:12.5px;color:var(--s-gris);cursor:pointer;white-space:nowrap}
.sgsv-fil>button:not(.nx-btn):hover{color:var(--s-noir)}
.sgsv-fil>button.on:not(.nx-btn){color:var(--s-noir);font-weight:700;box-shadow:inset 0 -2px 0 var(--s-nuit)}
.sgsv-fil>button small{font-size:11px;font-weight:400;color:var(--s-gris);margin-left:3px}
.sgsv-fil .dr{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.sgsv-sec{margin:0 0 22px}
.sgsv-sec.fl{border-top:2px solid var(--s-noir)}
.sgsv-sec>h3{margin:0;padding:10px 0 8px;font-size:15px;font-weight:700;display:flex;align-items:baseline;gap:10px}
.sgsv-sec>h3 span{font-size:11.5px;font-weight:400;color:var(--s-gris)}
.sgsv-sec>h3 .dr{margin-left:auto;display:flex;gap:14px}
.sgsv-lien{border:0;background:none;font:inherit;font-size:12px;font-weight:700;color:var(--s-nuit);cursor:pointer;padding:0}
.sgsv-lien:hover{text-decoration:underline}
.sgsv-pts{width:100%;border-collapse:collapse;font-size:12.5px}
.sgsv-pts th{text-align:left;font-size:11px;font-weight:700;color:var(--s-gris);padding:6px 8px;border-bottom:2px solid var(--s-noir);white-space:nowrap}
.sgsv-pts td{padding:7px 8px;border-bottom:1px solid var(--s-filet);vertical-align:top}
.sgsv-pts tr.l0 td{background:var(--s-nuit3);font-weight:700;padding-top:6px;padding-bottom:6px}
.sgsv-pts tr.ed{cursor:pointer}.sgsv-pts tr.ed:hover td{background:var(--s-jaune3)}
.sgsv-pts .nn{white-space:nowrap;color:var(--s-nuit);font-weight:700;width:40px}
.sgsv-pts .tt b{display:block;font-weight:700}
.sgsv-pts .tt span{color:var(--s-gris);white-space:pre-wrap}
.sgsv-pts tr.ok .tt b{color:var(--s-gris)}
.sgsv-pts tr.n2 .tt{padding-left:22px}.sgsv-pts tr.n3 .tt{padding-left:22px}
.sgsv-pts .ct,.sgsv-pts .ck{width:26px;text-align:center}
.sgsv-pts .dl,.sgsv-tb .dl{white-space:nowrap;font-variant-numeric:tabular-nums}
.sgsv-cat{display:inline-grid;place-items:center;width:20px;height:20px;font-size:10.5px;font-weight:700;border:1.5px solid var(--s-nuit);color:var(--s-nuit);box-sizing:border-box}
.sgsv-cat.c1{border-color:#b9b9b6;color:var(--s-gris)}.sgsv-cat.c2{background:var(--s-nuit);color:#fff}.sgsv-cat.c4{background:var(--s-jaune);border-color:var(--s-noir);color:var(--s-noir)}
.sgsv-ret{color:var(--s-rouge);font-weight:700}
.sgsv-ck{display:inline-block;width:14px;height:14px;padding:0;border:1.5px solid var(--s-noir);background:#fff;box-sizing:border-box;vertical-align:-2px;position:relative;cursor:pointer}
span.sgsv-ck{cursor:default}
.sgsv-ck.on{background:var(--s-nuit);border-color:var(--s-nuit)}
.sgsv-ck.on:after{content:'✓';position:absolute;inset:-3px 0 0;text-align:center;color:#fff;font-size:11px;font-weight:700}
.sgsv-ps{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:0 24px}
.sgsv-p{display:flex;align-items:center;gap:10px;padding:7px 0;border:0;border-bottom:1px solid var(--s-filet);background:none;width:100%;font:inherit;font-size:12.5px;text-align:left;color:inherit;min-width:0}
button.sgsv-p{cursor:pointer}button.sgsv-p:hover{background:var(--s-jaune3)}
.sgsv-ini{flex:none;display:inline-grid;place-items:center;min-width:32px;height:22px;padding:0 4px;box-sizing:border-box;background:var(--s-nuit);color:#fff;font-size:10px;font-weight:700}
.sgsv-p.abs .sgsv-ini{background:#fff;color:var(--s-gris);box-shadow:inset 0 0 0 1.5px #b9b9b6}
.sgsv-p .m{min-width:0;flex:1}
.sgsv-p .m b,.sgsv-p .m span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgsv-p .m span{font-size:11px;color:var(--s-gris)}
.sgsv-p .e{flex:none;font-size:11px;color:var(--s-gris)}
.sgsv-tb{width:100%;border-collapse:collapse;font-size:12.5px;font-variant-numeric:tabular-nums}
.sgsv-tb th{text-align:left;font-size:11px;font-weight:700;color:var(--s-gris);padding:8px;border-bottom:2px solid var(--s-noir);white-space:nowrap}
.sgsv-tb td{padding:6px 8px;height:24px;border-bottom:1px solid var(--s-filet)}
.sgsv-tb td.nw{white-space:nowrap}
.sgsv-tb tr[data-a]{cursor:pointer}.sgsv-tb tr[data-a]:hover td{background:var(--s-jaune3)}
.sgsv-tb td.r,.sgsv-tb th.r{text-align:right}.sgsv-tb td.c,.sgsv-tb th.c{text-align:center}
.sgsv-tb tr.tot td{font-weight:700;border-top:2px solid var(--s-noir);border-bottom:0}
.sgsv-tb .gr{color:var(--s-gris)}
.sgsv-et{font-size:11px;font-weight:700}
.sgsv-et.prevue{color:var(--s-nuit)}.sgsv-et.brouillon{color:var(--s-orange)}.sgsv-et.diffuse{color:var(--s-gris);font-weight:400}
.sgsv-leg{margin:8px 0 0;font-size:11.5px;color:var(--s-gris);display:flex;gap:4px 16px;flex-wrap:wrap;align-items:center}
.sgsv-leg .sgsv-cat{transform:scale(.85);margin-right:3px}
.sgsv-vide{padding:22px 0 8px;font-size:13px;line-height:1.55;max-width:640px}
.sgsv-vide .acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.sgsv-rien{font-size:12.5px;color:var(--s-gris);padding:8px 0 14px}
.sgsv-texte{font-size:14px;line-height:1.6;white-space:pre-wrap;max-width:78ch;overflow-wrap:anywhere;padding:4px 0 8px}
.sgsv-fiche{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px 24px;font-size:13px;padding:12px 0 18px;margin-top:0}
.sgsv-fiche div b{display:block;font-size:11px;font-weight:700;color:var(--s-gris);margin-bottom:2px}
.sgsv-note{padding:9px 0;border-bottom:1px solid var(--s-filet);font-size:12.5px}
.sgsv-note .q{font-size:11px;color:var(--s-gris);margin-bottom:2px}
.sgsv-note b{font-weight:700}.sgsv-note p{margin:2px 0 0;white-space:pre-wrap}
.sgsv-mini{border:0;background:none;font:inherit;font-size:15px;line-height:1;font-weight:700;color:var(--s-nuit);cursor:pointer;padding:0 3px}
.sgsv-mini:hover{color:var(--s-noir)}
.sgd.sgsv-b{padding-bottom:14px}
.sgsv-b .sgd-ct .dr{display:flex;align-items:center;gap:8px}
.sgsv-b .sgsv-q{padding:8px 12px;border-bottom:1px solid var(--s-filet)}
.sgsv-b .sgsv-q input{width:100%;box-sizing:border-box}
.sgsv-b .sgd-gt{display:flex;justify-content:space-between;gap:8px;align-items:baseline;width:100%;box-sizing:border-box;border-left:0;border-right:0;border-top:0;background:#fff;font-family:inherit;text-align:left;cursor:pointer}
.sgsv-b .sgd-gt:hover{color:var(--s-noir)}
.sgsv-b .sgd-gt.sel{color:var(--s-noir)}
.sgsv-b .sgd-gt .t{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sgsv-b .sgd-gt .n{flex:none}
.sgsv-b .sgd-gt.fixe{cursor:default}
.sgsv-b .sgd-it .m{flex:1;min-width:0}
.sgsv-b .sgd-it .m b{display:block;font-size:12.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgsv-b .sgd-it .m span{display:block;font-size:11px;color:var(--s-gris);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgsv-b .sgd-it .m span.sgsv-ret{color:var(--s-rouge)}
.sgsv-b .sgd-m{overflow-y:auto;display:block}
.sgsv-dlg{display:grid;grid-template-columns:1fr 1fr;gap:12px 14px;min-width:min(520px,80vw)}
.sgsv-dlg label{display:flex;flex-direction:column;gap:4px;font-size:11px;font-weight:700;color:var(--s-gris)}
.sgsv-dlg label.w{grid-column:1/-1}
.sgsv-dlg input,.sgsv-dlg select,.sgsv-dlg textarea{height:34px;border:1.5px solid var(--s-noir);border-radius:0;background:#fff;padding:0 8px;font:inherit;font-size:13px;color:var(--s-noir);box-sizing:border-box;width:100%}
.sgsv-dlg textarea{height:240px;padding:8px;resize:vertical;line-height:1.5}
.sgsv-dlg .q{grid-column:1/-1;font-size:11.5px;color:var(--s-gris)}
.sgsv-dlg .w{grid-column:1/-1}
.sgsv-dlg .seg{display:flex;gap:0}
.sgsv-dlg .seg button{flex:1;height:32px;border:1.5px solid var(--s-noir);background:#fff;font:inherit;font-size:12.5px;cursor:pointer;margin-left:-1.5px}
.sgsv-dlg .seg button:first-child{margin-left:0}
.sgsv-dlg .seg button.on{background:var(--s-nuit);border-color:var(--s-nuit);color:#fff;font-weight:700;position:relative}
.sgsv-dlg label.ck{flex-direction:row;align-items:center;gap:8px;font-size:12.5px;font-weight:400;color:var(--s-noir);cursor:pointer}
.sgsv-dlg label.ck input{width:auto;height:auto}
.sgsv-dlg [hidden]{display:none}
@container sgsv (max-width:760px){.sgsv-kp{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:820px){.sgd.sgsv-b{flex-direction:column;overflow:auto;height:auto}.sgsv-b .sgd-col{flex:none;width:auto;max-height:40vh}.sgsv-b .sgd-m{overflow:visible}.sgsv-fiche{grid-template-columns:1fr 1fr}.sgsv-kp{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;
const css=()=>{ if(!document.getElementById('sgsv-css')){ const s=document.createElement('style'); s.id='sgsv-css'; s.textContent=CSS; document.head.appendChild(s); } };

/* ── outils communs ── */
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const IC=n=>{ try{ return nxSvg(n)||''; }catch(_){ return ''; } };
const dmy=d=>d?dfr(d):'';
const inis=n=>String(n||'').trim().split(/\s+/).map(w=>w[0]||'').join('').slice(0,3).toUpperCase();
const peut=p=>{ try{ return !!(sgAdmin()||sgDroit('projets_modifier','tous')||(sgDroit('projets_modifier','siens')&&sgMesProjets().has(String(p.ID)))); }catch(_){ return false; } };
const moT=p=>typeof projMO==='function'?projMO(p):'';
const tete=(g,lb,t,meta,act)=>'<div class="sgfh-tete"><div class="sgfh-id"><div class="sgfh-ini">'+E(g)+'</div><div class="sgfh-nm"><div class="lb">'+E(lb)+'</div><h2>'+E(t)+'</h2>'+(meta?'<div class="sgfh-meta">'+E(meta)+'</div>':'')+'</div></div><div class="sgsv-hact">'+(act||'')+'</div></div>';
const kpi=(l,v,s,c,ti)=>'<div class="nx-kpi"'+(ti?' title="'+E(ti)+'"':'')+'><div class="l">'+E(l)+'</div><div class="v'+(/^\d\d\.\d\d\.\d{4}/.test(v)?' dt':'')+(c?' '+c:'')+'">'+v+'</div>'+(s?'<div class="s">'+s+'</div>':'')+'</div>';
const btn=(a,t,ic,pri,ti,x)=>'<button class="nx-btn'+(pri?' pri':'')+'" data-a="'+a+'"'+(ti?' title="'+E(ti)+'"':'')+(x||'')+'>'+(ic?IC(ic):'')+E(t)+'</button>';
const lien=(a,t,ti)=>'<button class="sgsv-lien" data-a="'+a+'"'+(ti?' title="'+E(ti)+'"':'')+'>'+E(t)+'</button>';
const menuSous=(el,items)=>{ const r=el.getBoundingClientRect(); sgMenuAt(r.left,r.bottom+2,items); };
const pl=(n,s,p)=>n+' '+(n>1?(p||s+'s'):s);

/* une instance par écran ouvert : dessin, défilement, focus de la recherche, clics délégués */
const ETAT={}; let ACTIF=null;
function monter(C,p,cle,besoin,M){ css(); const k=cle+':'+p.ID, u=ETAT[k]||(ETAT[k]={sL:0,sM:0});
  const box=document.createElement('div'); box.className='sgsv-box'; box.innerHTML='<div class="sgsv-charge">Chargement…</div>'; C.append(box);
  const I={box,u,p,besoin,dessiner(){ if(!box.isConnected) return;
    I.p=DS.get('project',p.ID)||p; u.peut=peut(I.p);
    try{ box.innerHTML=M.rendre(I); }catch(e){ console.error(e); box.innerHTML='<p class="sgsv-err">Erreur — '+E(e&&e.message||e)+'</p>'; return; }
    const l=box.querySelector('.sgd-l'), m=box.querySelector('.sgd-m,.sgsv'), q=box.querySelector('input[data-q]');
    if(l){ l.scrollTop=u.sL; l.addEventListener('scroll',()=>{ u.sL=l.scrollTop; },{passive:true}); }
    if(m){ m.scrollTop=u.sM; m.addEventListener('scroll',()=>{ u.sM=m.scrollTop; },{passive:true}); }
    if(q){ q.addEventListener('focus',()=>{ u.qF=true; }); q.addEventListener('blur',()=>setTimeout(()=>{ if(q.isConnected) u.qF=false; },0));
      q.addEventListener('input',()=>{ u.q=q.value; u.qC=q.selectionStart; u.qF=true; u.sL=0; I.dessiner(); });
      if(u.qF){ q.focus(); const c=u.qC??q.value.length; q.setSelectionRange(c,c); } }
    if(u.focL){ const f=box.querySelector(u.focL); u.focL=null; if(f) f.focus({preventScroll:true}); }
    if(M.apres) M.apres(I); }};
  box.onclick=e=>{ const t=e.target.closest('[data-a]'); if(t&&box.contains(t)) M.action(I,t.dataset.a,t,e); };
  box.oncontextmenu=e=>{ if(e.altKey||!M.ctx) return; const t=e.target.closest('[data-a]'); if(t&&box.contains(t)&&M.ctx(I,t,e)) e.preventDefault(); };
  box.onkeydown=e=>{ if(e.key!=='ArrowDown'&&e.key!=='ArrowUp') return; const a=document.activeElement, l=box.querySelector('.sgd-l'); if(!l||!a||!l.contains(a)||!a.matches('.sgd-it')) return;
    const L=[...l.querySelectorAll('.sgd-it')], n=L[L.indexOf(a)+(e.key==='ArrowDown'?1:-1)]; if(n){ e.preventDefault(); n.click(); } };
  ACTIF=I; Promise.resolve(DS.need?DS.need(besoin):0).catch(()=>0).then(()=>I.dessiner()); }
DS.on(ts=>{ const I=ACTIF; if(I&&I.box.isConnected&&hit(ts,...I.besoin)) setTimeout(()=>{ if(I.box.isConnected) I.dessiner(); },0); });

/* ── SÉANCES ── */
const ETATS_PV={prevue:'Prévue',brouillon:'Brouillon',diffuse:'Diffusé'};
const etatPV=m=>+m.ISDRAFT?(m.MEETINGDATE&&m.MEETINGDATE>today()?'prevue':'brouillon'):'diffuse';
const cat=x=>+x.ITEMCATEGORYCODE||0;
const aSuivre=x=>cat(x)===3||cat(x)===4||!!x.DEADLINE;
const ouvert=x=>!+x.ISDONE&&aSuivre(x), retard=x=>ouvert(x)&&!!x.DEADLINE&&x.DEADLINE<today();
const RX_MO=/ma[iî]tre\s+d|\bPV\s*MO\b|\bMO\b/i, estMO=s=>RX_MO.test(mtTypeName(s.PROJECTMEETINGTYPE_ID)||'');
const seriesDe=(p,mo)=>DS.by('meetingsequence','PROJECT_ID',p.ID).filter(s=>mo?estMO(s):!estMO(s)&&(!MT.type||s.PROJECTMEETINGTYPE_ID===MT.type)).sort((a,b)=>(+a.ISCLOSED||0)-(+b.ISCLOSED||0)||cmp(+a.NUMBER||0,+b.NUMBER||0)||cmp(a.SUBJECT,b.SUBJECT));
/* série et procès-verbal en cours : ceux que le moteur a choisis, sinon le dernier procès-verbal tenu d'une série ouverte */
function choixPV(p,L){ let s=DS.get('meetingsequence',MT.seq.sel); if(!s||!L.some(x=>x.ID===s.ID)) s=L.find(x=>!+x.ISCLOSED&&mtMeetings(x).length)||L.find(x=>mtMeetings(x).length)||L[0]||null;
  MT.seq.sel=s?String(s.ID):null; const ms=s?mtMeetings(s):[]; let m=DS.get('meeting',MT.mtg.sel);
  if(!m||!s||String(m.MEETINGSEQUENCE_ID)!==String(s.ID)){ const aj=today(), tenus=ms.filter(x=>!x.MEETINGDATE||x.MEETINGDATE<=aj); m=tenus[tenus.length-1]||ms[0]||null; }
  MT.mtg.sel=m?String(m.ID):null; return {s,m}; }
/* points ouverts de la série : la dernière occurrence d'un point fait foi ; depuis = le procès-verbal le plus ancien qui le contient */
function ouvertsSerie(s){ const V=new Map(), cle=x=>String(x.TITLE||x.TEXT||'').trim().toLowerCase();
  mtMeetings(s).slice().reverse().forEach(m=>mtItems(m).forEach(x=>{ const k=cle(x); if(!k) return; const o=V.get(k); if(o) o.de=m; else V.set(k,{x,m,de:m}); }));
  return [...V.values()].filter(o=>ouvert(o.x)).sort((a,b)=>cmp(a.x.DEADLINE||'9',b.x.DEADLINE||'9')); }
const respI=x=>x.USERNAME||'';
const colSeances=(I,L,sel,m,o)=>{ const u=I.u, ouv=u.ouv||(u.ouv={}), ty=!o&&MT.type?mtTypeName(MT.type):'';
  return '<div class="sgd-col"><div class="sgd-ct"><b>'+(o?o.t:'Séances')+'</b><span class="dr"><span>'+(o?E(o.n):(ty?E(ty)+' · ':'')+pl(L.length,'série'))+'</span>'
      +(u.peut?'<button class="sgsv-mini" data-a="'+(o?o.plus:'nserie')+'" title="'+(o?E(o.plusT):'Nouvelle série de séances')+'" aria-label="'+(o?E(o.plusT):'Nouvelle série de séances')+'">+</button>':'')+(o?'':'<button class="sgsv-mini" data-a="colmenu" title="Filtre par genre, configuration" aria-label="Filtre par genre, configuration">⋯</button>')+'</span></div><div class="sgd-l">'
    +L.map(s=>{ const ms=mtMeetings(s).slice().reverse(), on=sel&&s.ID===sel.ID, de=ouv[s.ID]??(on&&!+s.ISCLOSED);
      return '<button class="sgd-gt'+(on?' sel':'')+'" data-a="serie" data-s="'+s.ID+'" title="'+E([s.NUMBER,s.SUBJECT,mtTypeName(s.PROJECTMEETINGTYPE_ID)].filter(Boolean).join(' · '))+'"><span class="t">'+(de?'▾ ':'▸ ')+E((o&&s.NUMBER?s.NUMBER+' ':'')+(s.SUBJECT||mtSeqLabel(s)||'(sans sujet)'))+'</span><span class="n">'+ms.length+(+s.ISCLOSED?' · terminée':'')+'</span></button>'
        +(de?ms.map(x=>{ const nO=mtItems(x).filter(o?y=>cat(y)===4&&!+y.ISDONE:ouvert).length; return '<button class="sgd-it'+(m&&x.ID===m.ID?' on':'')+'" data-a="pv" data-m="'+x.ID+'"><span class="sgsv-ini">'+E(x.MEETINGNUMBER||'—')+'</span><span class="m"><b>'+E(dmy(x.MEETINGDATE)||'Sans date')+'</b><span>'+ETATS_PV[etatPV(x)]+(nO?' · '+pl(nO,o?'ouverte':'ouvert'):'')+'</span></span></button>'; }).join(''):''); }).join('')+'</div></div>'; };
const tabPoints=(I,m)=>{ const L=mtItems(m), ed=I.u.peut; if(!L.length) return '<p class="sgsv-rien">Aucun point à l’ordre du jour.</p>';
  return '<table class="sgsv-pts"><thead><tr><th>N°</th><th></th><th>Point</th><th>Resp.</th><th>Délai</th><th title="Réglé"></th></tr></thead><tbody>'+L.map(x=>{ const lv=+x.STRUCTURINGLEVEL||0, c=cat(x), n=x.NUMBER||'', a=ed?' data-a="pt" data-p="'+x.ID+'"':'';
      if(lv===0&&!c&&!x.TEXT&&!x.DEADLINE&&!x.USERNAME) return '<tr class="l0'+(ed?' ed':'')+'"'+a+'><td class="nn">'+E(n)+'</td><td colspan="5">'+E(x.TITLE||'')+'</td></tr>';
      const ck=aSuivre(x)||+x.ISDONE?(ed?'<button class="sgsv-ck'+(+x.ISDONE?' on':'')+'" data-a="regle" data-p="'+x.ID+'" title="Réglé" aria-label="Réglé" aria-pressed="'+!!+x.ISDONE+'"></button>':'<span class="sgsv-ck'+(+x.ISDONE?' on':'')+'" title="Réglé"></span>'):'';
      return '<tr class="n'+lv+(+x.ISDONE?' ok':'')+(ed?' ed':'')+'"'+a+'><td class="nn">'+E(n)+'</td><td class="ct">'+(c?'<span class="sgsv-cat c'+c+'" title="'+E(mtCatName(c))+'">'+E(mtCatSym(c))+'</span>':'')+'</td>'
        +'<td class="tt">'+(x.TITLE?'<b>'+E(x.TITLE)+'</b>':'')+(x.TEXT?'<span>'+E(x.TEXT)+'</span>':'')+'</td><td>'+(x.USERNAME?'<span class="sgsv-ini" title="'+E(x.USERNAME)+'">'+E(String(x.USERNAME).slice(0,4))+'</span>':'')+'</td>'
        +'<td class="dl'+(retard(x)?' sgsv-ret':'')+'">'+E(dmy(x.DEADLINE))+'</td><td class="ck">'+ck+'</td></tr>'; }).join('')+'</tbody></table>'
    +'<div class="sgsv-leg">'+MT_CAT.filter(c=>c[2]).map(c=>'<span><span class="sgsv-cat c'+c[0]+'">'+E(c[2])+'</span>'+E(c[1])+'</span>').join('')+(ed?'<span>Un clic sur un point pour le modifier ; carré = réglé.</span>':'')+'</div>'; };
const blocParts=(I,m)=>{ const P=mtParts(m); if(!P.length) return '<p class="sgsv-rien">Aucun participant.</p>';
  return '<div class="sgsv-ps">'+P.map(x=>{ const c=mtPartContact(x), n=mtPartName(x), ab=!+x.ISPRESENT, e=+x.ISLEADER?'animation':+x.ISRECORDINGSECRETARY?'auteur':ab?(x.ATTENDANCENOTE||''):'', t=I.u.peut?'button':'div';
      return '<'+t+' class="sgsv-p'+(ab?' abs':'')+'"'+(I.u.peut?' type="button" data-a="part" data-p="'+x.ID+'"':'')+'><span class="sgsv-ini">'+E(x.INITIALS||inis(n))+'</span><span class="m"><b>'+E(n)+'</b><span>'+E([x.PROJECTROLE,mtCompany(c)].filter(Boolean).join(' · '))+'</span></span><span class="e">'+E(e.toLowerCase())+'</span></'+t+'>'; }).join('')+'</div>'; };
const vueOuverts=(I,s,T)=>{ if(!T.length) return '<p class="sgsv-rien">Aucun point ouvert dans cette série.</p>';
  return '<table class="sgsv-tb"><thead><tr><th>Délai</th><th>Resp.</th><th>Point</th><th>Catégorie</th><th>Dernier procès-verbal</th><th>Depuis</th><th class="c">Réglé</th></tr></thead><tbody>'+T.map(o=>{ const x=o.x, c=cat(x);
      return '<tr><td class="dl'+(retard(x)?' sgsv-ret':'')+'">'+E(dmy(x.DEADLINE)||'—')+'</td><td>'+(x.USERNAME?'<span class="sgsv-ini">'+E(String(x.USERNAME).slice(0,4))+'</span>':'')+'</td><td>'+E(x.TITLE||x.TEXT||'')+'</td><td class="nw">'+E(c?mtCatName(c):'—')+'</td>'
        +'<td class="nw"><button class="sgsv-lien" data-a="pv" data-m="'+o.m.ID+'">n° '+E(o.m.MEETINGNUMBER||'—')+'</button></td><td class="nw">n° '+E(o.de.MEETINGNUMBER||'—')+'</td><td class="c">'+(I.u.peut?'<button class="sgsv-ck" data-a="regle" data-p="'+x.ID+'" title="Réglé" aria-label="Réglé"></button>':'')+'</td></tr>'; }).join('')+'</tbody></table>'; };
const vuePresences=(s)=>{ const L=mtMeetings(s).filter(x=>etatPV(x)!=='prevue').slice(-8).reverse(), V=new Map(); L.forEach(m=>mtParts(m).forEach(x=>{ if(!V.has(x.CONTACT_ID)) V.set(x.CONTACT_ID,x); }));
  if(!V.size) return '<p class="sgsv-rien">Aucune présence à afficher.</p>';
  return '<table class="sgsv-tb"><thead><tr><th>Participant</th>'+L.map(m=>'<th class="c" title="'+E(dmy(m.MEETINGDATE))+'">n° '+E(m.MEETINGNUMBER||'—')+'</th>').join('')+'<th class="r">Présence</th></tr></thead><tbody>'
    +[...V.values()].sort((a,b)=>cmp(mtPartName(a),mtPartName(b))).map(x=>{ let conv=0, pres=0; const cs=L.map(m=>{ const y=mtParts(m).find(z=>z.CONTACT_ID===x.CONTACT_ID); if(!y) return '<td class="c gr">—</td>'; conv++; if(+y.ISPRESENT){ pres++; return '<td class="c">✓</td>'; } return '<td class="c gr" title="'+E(y.ATTENDANCENOTE||'Absent')+'">abs.</td>'; }).join('');
      return '<tr><td class="nw"><span class="sgsv-ini" style="margin-right:10px">'+E(x.INITIALS||inis(mtPartName(x)))+'</span>'+E(mtPartName(x))+'</td>'+cs+'<td class="r">'+(conv?Math.round(pres/conv*100)+' %':'—')+'</td></tr>'; }).join('')+'</tbody></table>'; };
const SEANCES={
  rendre(I){ const p=I.p, u=I.u, L=seriesDe(p);
    if(!L.length) return '<div class="sgsv">'+tete(p.NUMBER||'','Séances',p.TITLE||'',moT(p)?'Maître de l’ouvrage : '+moT(p):'','')+'<div class="sgsv-vide"><b>'+(MT.type?'Aucune série de ce genre.':'Aucune séance pour ce projet.')+'</b><br>Une série regroupe les séances d’un même genre (chantier, maître de l’ouvrage, mandataires…), chacune avec ses participants, ses points et son procès-verbal.'
      +'<div class="acts">'+(MT.type?btn('tous','Afficher tous les genres'):'')+(u.peut?btn('nserie','Créer une série de séances','plus',1)+btn('types','Configurer les séances'):'')+'</div></div></div>';
    const {s,m}=choixPV(p,L), T=s?ouvertsSerie(s):[], col=colSeances(I,L,s,m);
    if(!m) return '<div class="sgd sgsv-b">'+col+'<div class="sgd-m">'+tete(s.NUMBER||'—',mtTypeName(s.PROJECTMEETINGTYPE_ID)||'Série de séances',s.SUBJECT||'(sans sujet)','Aucun procès-verbal',(u.peut?btn('npv','Ajouter un procès-verbal','plus',1):''))+(s.NOTE?'<div class="sgsv-texte" style="padding-top:14px">'+E(s.NOTE)+'</div>':'')+'</div></div>';
    const e=etatPV(m), P=mtParts(m), It=mtItems(m), pres=P.filter(x=>+x.ISPRESENT).length, o=It.filter(ouvert), rt=o.filter(retard).length, nP=It.filter(x=>(+x.STRUCTURINGLEVEL||0)>0||cat(x)).length, an=mtLeader(m);
    const ong=u.onglet||'pv', heure=m.TIMEFROM?mtTime(m.TIMEFROM)+(m.TIMETO?' – '+mtTime(m.TIMETO):''):'';
    const meta=[[dmy(m.MEETINGDATE),heure].filter(Boolean).join(', '),m.LOCATION,an?'animation '+an:'',m.GOAL].filter(Boolean).join(' · ');
    const act=(e==='prevue'?btn('convoc','Convocation','print',1)+btn('imppv','Procès-verbal','print'):btn('imppv','Procès-verbal','print',1)+btn('convoc','Convocation','print'))+(u.peut?btn('modpv','Modifier','edit'):'')+'<button class="nx-btn" data-a="pvmenu" title="Autres actions" aria-label="Autres actions">⋯</button>';
    const corps=ong==='ouverts'?'<section class="sgsv-sec"><h3>Points ouverts de la série<span>'+pl(T.length,'point')+', '+T.filter(x=>retard(x.x)).length+' en retard</span></h3>'+vueOuverts(I,s,T)+'</section>'
      :ong==='pres'?'<section class="sgsv-sec"><h3>Présences<span>8 dernières séances</span></h3>'+vuePresences(s)+'</section>'
      :'<section class="sgsv-sec" style="margin-bottom:18px"><h3>Participants<span class="dr">'+(u.peut?lien('parts','Modifier','Ajouter, retirer ou modifier les participants'):'')+lien('partsmenu','Fonctions ▾','Présences, distribution, courriels, invitation')+'</span></h3>'+blocParts(I,m)+'</section>'
        +'<section class="sgsv-sec fl"><h3>Points de l’ordre du jour'+(u.peut?'<span class="dr">'+lien('pts','Modifier tous les points')+'</span>':'')+'</h3>'+tabPoints(I,m)+'</section>'+(m.NOTE?'<section class="sgsv-sec fl"><h3>Notes</h3><div class="sgsv-texte">'+E(m.NOTE)+'</div></section>':'');
    return '<div class="sgd sgsv-b">'+col+'<div class="sgd-m">'+tete(m.MEETINGNUMBER||'—',(s.SUBJECT||mtTypeName(s.PROJECTMEETINGTYPE_ID)||'Séance')+' · '+ETATS_PV[e],m.SUBJECT||s.SUBJECT||'Séance',meta,act)
      +'<div class="nx-kpis sgsv-kp">'+kpi('Participants',pres+'<small>/'+P.length+'</small>','présents')+kpi('Points',String(nP),'à l’ordre du jour')+kpi('Décisions',String(It.filter(x=>cat(x)===2).length),'')+kpi('Ouverts',String(o.length),'tâches et points à suivre','','Tâches, points ouverts et points avec un délai, non réglés')+kpi('En retard',String(rt),rt?'délai dépassé':'aucun',rt?'ret':'')+'</div>'
      +'<div class="sgsv-fil">'+[['pv','Procès-verbal'],['ouverts','Points ouverts de la série'],['pres','Présences']].map(([k,t])=>'<button data-a="ong" data-o="'+k+'" class="'+(k===ong?'on':'')+'">'+t+(k==='ouverts'&&T.length?'<small>'+T.length+'</small>':'')+'</button>').join('')
      +'<span class="dr">'+btn('chercher','Rechercher dans les points','','', 'Rechercher dans tous les points de la série')+(u.peut?btn('npv','Nouveau procès-verbal','plus'):'')+'</span></div>'+corps+'</div></div>'; },
  action(I,a,t){ const p=I.p, u=I.u, s=DS.get('meetingsequence',MT.seq.sel), m=DS.get('meeting',MT.mtg.sel), r=()=>I.dessiner(), it=()=>DS.get('meetingitem',t.dataset.p);
    if(a==='serie'){ const id=t.dataset.s, ouv=u.ouv||(u.ouv={}), on=String(MT.seq.sel)===id, sr=DS.get('meetingsequence',id), de=ouv[id]??(on&&!+sr.ISCLOSED);
      if(on) ouv[id]=!de; else { ouv[id]=true; MT.seq.sel=id; MT.mtg.sel=null; u.sM=0; } r(); }
    else if(a==='pv'){ const x=DS.get('meeting',t.dataset.m); if(!x) return; MT.seq.sel=String(x.MEETINGSEQUENCE_ID); MT.mtg.sel=String(x.ID); u.sM=0; if(t.classList.contains('sgsv-lien')) u.onglet='pv'; u.focL='.sgd-it.on'; r(); }
    else if(a==='ong'){ u.onglet=t.dataset.o; u.sM=0; r(); }
    else if(a==='nserie') mtSeqDialog(p); else if(a==='types') mtTypesDialog(p); else if(a==='tous'){ MT.type=null; r(); }
    else if(a==='npv'){ if(s) mtMeetingDialog(s); }
    else if(a==='modpv'){ if(s&&m) mtMeetingDialog(s,m); } else if(a==='imppv'){ if(m) mtPrint(p,s,m,'minutes'); } else if(a==='convoc'){ if(m) mtPrint(p,s,m,'agenda'); }
    else if(a==='parts'){ if(m) mtPartsDialog(m); } else if(a==='pts'){ if(m) mtItemsDialog(m); } else if(a==='chercher'){ if(s) mtSearch(s); }
    else if(a==='part'){ const x=DS.get('meetingparticipant',t.dataset.p); if(x) mtPartDialog(x,r); }
    else if(a==='pt'){ const x=it(); if(x&&m) mtItemDialog(DS.get('meeting',x.MEETING_ID)||m,x,r); }
    else if(a==='regle'){ const x=it(); if(x) DS.save('meetingitem',{...x,ISDONE:+x.ISDONE?0:1}).then(r); }
    else if(a==='partsmenu'){ if(m) menuSous(t,mtPartsMenu(m)); }
    else if(a==='pvmenu'){ if(m) menuSous(t,menuPV(u,p,s,m)); }
    else if(a==='colmenu') menuSous(t,[...(u.peut?[{t:'Nouvelle série…',fn:()=>mtSeqDialog(p)},{t:'Configurer les séances…',fn:()=>mtTypesDialog(p)},'-']:[]),{t:'Tous les genres',chk:!MT.type,fn:()=>{ MT.type=null; r(); }},
      ...DS.by('projectmeetingtype','PROJECT_ID',p.ID).sort((x,y)=>cmp(+x.SORTORDER||0,+y.SORTORDER||0)).map(x=>({t:nm(x),chk:MT.type===x.ID,fn:()=>{ MT.type=x.ID; MT.seq.sel=null; r(); }}))]); },
  ctx(I,t,e){ const a=t.dataset.a, p=I.p, u=I.u;
    if(a==='serie'){ const s=DS.get('meetingsequence',t.dataset.s); if(!s) return false; sgMenuAt(e.clientX,e.clientY,menuSerie(u,p,s)); return true; }
    if(a==='pv'){ const m=DS.get('meeting',t.dataset.m), s=m&&DS.get('meetingsequence',m.MEETINGSEQUENCE_ID); if(!m) return false; sgMenuAt(e.clientX,e.clientY,[...(u.peut?[{t:'Modifier le procès-verbal…',fn:()=>mtMeetingDialog(s,m)}]:[]),...menuPV(u,p,s,m)]); return true; }
    return false; } };
const menuPV=(u,p,s,m)=>[...(u.peut?[{t:'Participants…',fn:()=>mtPartsDialog(m)},{t:'Tous les points…',fn:()=>mtItemsDialog(m)},{t:'Dupliquer le procès-verbal…',fn:()=>mtDuplicate(m)},'-']:[]),
  {t:'Procès-verbal',fn:()=>mtPrint(p,s,m,'minutes')},{t:'Convocation',fn:()=>mtPrint(p,s,m,'agenda')},{t:'Envoi courriel',dis:!mtParts(m).length,fn:()=>mtInvite(m)},...(u.peut?['-',{t:'Supprimer le procès-verbal…',danger:true,fn:()=>mtMeetingDelete(m)}]:[])];
const menuSerie=(u,p,s)=>[...(u.peut?[{t:'Nouveau procès-verbal…',fn:()=>mtMeetingDialog(s)},{t:'Modifier la série…',fn:()=>mtSeqDialog(p,s)}]:[]),{t:'Rechercher dans les points…',fn:()=>mtSearch(s)},...(u.peut?['-',{t:'Supprimer la série…',danger:true,fn:()=>mtSeqDelete(s)}]:[])];
mtDomain=function(C,top,pane,p){ monter(C,p,'seances',['meetingsequence','meeting','meetingitem','meetingparticipant','projectmeetingtype'],SEANCES); };

/* ── PV MO : questions du maître de l'ouvrage et décisions ── */
const estQ=x=>cat(x)===4, estD=x=>cat(x)===2, cleP=x=>String(x.TITLE||x.TEXT||'').trim().toLowerCase();
const pvsMO=L=>L.flatMap(s=>mtMeetings(s).map(m=>({s,m}))).sort((a,b)=>cmp(a.m.MEETINGDATE,b.m.MEETINGDATE)||cmp(+a.m.MEETINGNUMBER||0,+b.m.MEETINGNUMBER||0));
/* questions ouvertes : la dernière occurrence d'une question fait foi ; depuis = le procès-verbal le plus ancien qui la pose */
function questionsMO(L){ const V=new Map(); pvsMO(L).reverse().forEach(({s,m})=>mtItems(m).filter(estQ).forEach(x=>{ const k=cleP(x); if(!k) return; const o=V.get(k); if(o) o.de=m; else V.set(k,{x,m,s,de:m}); }));
  return [...V.values()].filter(o=>!+o.x.ISDONE).sort((a,b)=>cmp(a.x.DEADLINE||'9',b.x.DEADLINE||'9')); }
const decisionsMO=L=>pvsMO(L).reverse().flatMap(({s,m})=>mtItems(m).filter(estD).map(x=>({x,m,s})));
const retQ=x=>!+x.ISDONE&&!!x.DEADLINE&&x.DEADLINE<today();
const numP=(It,f,pre)=>{ const M=new Map(); It.filter(f).forEach((x,i)=>M.set(x.ID,pre+(i+1))); return M; };
const iniR=x=>x.USERNAME?'<span class="sgsv-ini" title="'+E(x.USERNAME)+'">'+E(String(x.USERNAME).slice(0,4))+'</span>':'';
const lignesPt=(I,L,N,ck)=>'<table class="sgsv-pts"><thead><tr><th>N°</th><th>'+(ck?'Question et réponse':'Texte')+'</th><th>Resp.</th><th>Délai</th>'+(ck?'<th title="Répondu"></th>':'')+'</tr></thead><tbody>'
  +L.map(x=>'<tr class="n1'+(+x.ISDONE?' ok':'')+(I.u.peut?' ed':'')+'"'+(I.u.peut?' data-a="ptmo" data-p="'+x.ID+'"':'')+'><td class="nn">'+E(N.get(x.ID)||'')+'</td><td class="tt">'+(x.TITLE?'<b>'+E(x.TITLE)+'</b>':'')+(x.TEXT?'<span>'+E(x.TEXT)+'</span>':ck?'<span style="font-style:italic">Sans réponse pour le moment.</span>':'')+'</td><td>'+iniR(x)+'</td>'
    +'<td class="dl'+(ck&&retQ(x)?' sgsv-ret':'')+'">'+E(dmy(x.DEADLINE))+'</td>'+(ck?'<td class="ck">'+(I.u.peut?'<button class="sgsv-ck'+(+x.ISDONE?' on':'')+'" data-a="regle" data-p="'+x.ID+'" title="Répondu, réglé" aria-label="Répondu, réglé" aria-pressed="'+!!+x.ISDONE+'"></button>':'<span class="sgsv-ck'+(+x.ISDONE?' on':'')+'"></span>')+'</td>':'')+'</tr>').join('')+'</tbody></table>';
const SORTES_PT=[[4,'Question','Question du maître de l’ouvrage','Réponse'],[2,'Décision','Décision','Précisions'],[1,'Information','Information','Précisions']];
/* fenêtre d'une question, d'une décision ou d'une information */
function pmPoint(I,m,x,c0){ const its=mtItems(m), v=x?{...x}:{ID:null,MEETING_ID:m.ID,STRUCTURINGLEVEL:0,TITLE:'',TEXT:null,ITEMCATEGORYCODE:c0,ITEMID:null,USERNAME:null,DEADLINE:null,ISDONE:0,ISPAGEBREAKBEFORE:0,PAGEBREAKBEFORECODES:null,NUMBER:null,SORTORDER:its.length,PROJECTTASK_ID:null};
  let c=[4,2].includes(cat(v))?cat(v):1; const k='sgsv-r-'+Math.random().toString(36).slice(2,9), b=document.createElement('div'); b.className='sgsv-dlg';
  const us=[...new Set(mtParts(m).map(y=>y.INITIALS||inis(mtPartName(y))).filter(Boolean))];
  b.innerHTML='<div class="seg w" role="group" aria-label="Sorte">'+SORTES_PT.map(([n,t])=>'<button type="button" data-c="'+n+'">'+t+'</button>').join('')+'</div>'
    +'<label class="w"><span data-l1></span><textarea data-k="t" style="height:64px" maxlength="500">'+E(v.TITLE||'')+'</textarea></label><label class="w"><span data-l2></span><textarea data-k="x" style="height:120px" maxlength="4096">'+E(v.TEXT||'')+'</textarea></label>'
    +'<label>Responsable<input data-k="r" list="'+k+'" maxlength="64" value="'+E(v.USERNAME||'')+'"><datalist id="'+k+'">'+us.map(y=>'<option value="'+E(y)+'">').join('')+'</datalist></label><label>Délai<input type="date" data-k="d" value="'+E(v.DEADLINE||'')+'"></label>'
    +'<label class="ck w" data-q2><input type="checkbox" data-k="f"'+(+v.ISDONE?' checked':'')+'>Répondu, réglé</label>';
  const q=n=>b.querySelector('[data-k="'+n+'"]'), maj=()=>{ const S=SORTES_PT.find(y=>y[0]===c); b.querySelectorAll('[data-c]').forEach(y=>y.classList.toggle('on',+y.dataset.c===c)); b.querySelector('[data-l1]').textContent=S[2]; b.querySelector('[data-l2]').textContent=S[3]; b.querySelector('[data-q2]').hidden=c!==4; };
  b.querySelectorAll('[data-c]').forEach(y=>y.onclick=()=>{ c=+y.dataset.c; maj(); }); maj();
  const bt=[{t:'Annuler'},{t:'OK',pri:true,fn:async()=>{ const t=q('t').value.trim(), tx=q('x').value.trim(); if(!t&&!tx){ toast('Écrivez le texte.',true); q('t').focus(); return false; }
    Object.assign(v,{TITLE:t||null,TEXT:tx||null,ITEMCATEGORYCODE:c,USERNAME:q('r').value.trim()||null,DEADLINE:q('d').value||null,ISDONE:c===4&&q('f').checked?1:0}); const neuf=v.ID==null; if(neuf) v.ID=DS.newIds('meetingitem')[0];
    const list=its.filter(y=>y.ID!==v.ID), at=neuf?list.length:its.findIndex(y=>y.ID===v.ID); list.splice(at<0?list.length:at,0,v); const ops=mtRenumber(list); if(!ops.some(o=>o.id===v.ID)) ops.push({t:'meetingitem',id:v.ID,val:list.find(y=>y.ID===v.ID)}); await DS.commit(ops); }}];
  if(x) bt.unshift({t:'Supprimer',fn:async()=>{ if(!await confirmDlg('Supprimer ce point ?','Supprimer')) return false; await DS.del('meetingitem',x.ID); }});
  dialog({title:x?'Modifier le point':'Nouveau point',width:'620px',body:b,buttons:bt}); setTimeout(()=>q('t').focus(),0); }
/* nouvelle séance : genre « PV MO » et série de la phase créés au besoin ; participants et questions ouvertes repris du dernier procès-verbal */
function pmNouveau(I){ const p=I.p, L=seriesDe(p,true), T=pvsMO(L), der=T[T.length-1]||null, Qo=questionsMO(L), cur=DS.get('meetingsequence',MT.seq.sel), ph0=cur&&L.some(x=>x.ID===cur.ID)&&+cur.NUMBER||31;
  const b=document.createElement('div'); b.className='sgsv-dlg';
  b.innerHTML='<label class="w">Phase<select data-k="ph">'+SG_PH_FICH.map(([n,l])=>'<option value="'+n+'"'+(n===+ph0?' selected':'')+'>'+n+' '+E(l)+'</option>').join('')+'</select></label>'
    +'<label class="w">Titre<input data-k="s" maxlength="128" value="Séance avec le maître de l’ouvrage"></label><label>Date<input type="date" data-k="d" value="'+E(today())+'"></label><label>Lieu<input data-k="l" maxlength="128" value="'+E(der&&der.m.LOCATION||'')+'"></label>'
    +'<label>De<input type="time" data-k="f"></label><label>À<input type="time" data-k="t"></label>'
    +(der?'<label class="ck w"><input type="checkbox" data-k="cp" checked>Reprendre les participants du procès-verbal n° '+E(der.m.MEETINGNUMBER||'')+'</label>':'')+(Qo.length?'<label class="ck w"><input type="checkbox" data-k="cq" checked>Reprendre les questions ouvertes ('+Qo.length+')</label>':'');
  const q=n=>b.querySelector('[data-k="'+n+'"]');
  dialog({title:'Nouveau PV MO',width:'560px',body:b,buttons:[{t:'Annuler'},{t:'OK',pri:true,fn:async()=>{ const ph=+q('ph').value, lib=(SG_PH_FICH.find(x=>x[0]===ph)||[])[1]||'', ops=[];
    let s=L.find(x=>+x.NUMBER===ph), ty=DS.by('projectmeetingtype','PROJECT_ID',p.ID).find(x=>RX_MO.test(nm(x)||''));
    if(!ty){ const id=DS.newIds('projectmeetingtype')[0]; ty={ID:id,PROJECT_ID:p.ID,SORTORDER:DS.by('projectmeetingtype','PROJECT_ID',p.ID).length,NAMEFR:'PV MO'}; ops.push({t:'projectmeetingtype',id,val:ty}); }
    if(!s){ const id=DS.newIds('meetingsequence')[0]; s={ID:id,PROJECT_ID:p.ID,NUMBER:String(ph),SUBJECT:lib,ISCLOSED:0,NOTE:null,PROJECTMEETINGTYPE_ID:ty.ID,SUBPROJECT_ID:null,TEMPLATEPROPERTIES:null,DOCUMENTLOCK_ID:null}; ops.push({t:'meetingsequence',id,val:s}); }
    const id=DS.newIds('meeting')[0], num=T.reduce((n,x)=>Math.max(n,parseInt(x.m.MEETINGNUMBER,10)||0),0)+1, tm=n=>q(n).value?q(n).value+':00':null;
    ops.push({t:'meeting',id,val:{ID:id,MEETINGSEQUENCE_ID:s.ID,MEETINGNUMBER:String(num),SUBJECT:q('s').value.trim()||null,GOAL:null,MEETINGDATE:q('d').value||null,TIMEFROM:tm('f'),TIMETO:tm('t'),LOCATION:q('l').value.trim()||null,MINUTESDATE:null,ISDRAFT:1,NOTE:null,ATTACHEMENTFOLDER:null}});
    if(der&&q('cp')&&q('cp').checked){ const P=mtParts(der.m), ids=P.length?DS.newIds('meetingparticipant',P.length):[]; P.forEach((x,i)=>ops.push({t:'meetingparticipant',id:ids[i],val:{...x,ID:ids[i],MEETING_ID:id}})); }
    if(Qo.length&&q('cq')&&q('cq').checked){ const ids=DS.newIds('meetingitem',Qo.length); Qo.forEach((o,i)=>ops.push({t:'meetingitem',id:ids[i],val:{...o.x,ID:ids[i],MEETING_ID:id,PROJECTTASK_ID:null,NUMBER:String(i+1),SORTORDER:i}})); }
    await DS.commit(ops); MT.seq.sel=String(s.ID); MT.mtg.sel=String(id); const ou=I.u.ouv||(I.u.ouv={}); ou[s.ID]=true; I.u.sM=0; }}]}); }
/* impression : procès-verbal ou convocation, registre des décisions (papier des contrats) */
function pmImprimer(I,s,m,conv){ const p=I.p, P=mtParts(m), It=mtItems(m), Q=It.filter(estQ), D=It.filter(estD), A=It.filter(x=>!estQ(x)&&!estD(x)), t=E, heure=m.TIMEFROM?mtTime(m.TIMEFROM)+(m.TIMETO?' – '+mtTime(m.TIMETO):''):'';
  const tb=(L,pre,ck)=>'<table><tr><th>N°</th><th>'+(ck?'Question et réponse':'Texte')+'</th><th>Resp.</th><th>Délai</th>'+(ck?'<th>Réglé</th>':'')+'</tr>'+L.map((x,i)=>'<tr><td>'+pre+(i+1)+'</td><td>'+t(x.TITLE||'')+(x.TITLE&&x.TEXT?'<br>':'')+t(x.TEXT||'')+'</td><td>'+t(x.USERNAME||'')+'</td><td>'+t(dmy(x.DEADLINE))+'</td>'+(ck?'<td>'+(+x.ISDONE?'oui':'')+'</td>':'')+'</tr>').join('')+'</table>';
  sgImprimer((conv?'Convocation':'Procès-verbal')+' MO n° '+(m.MEETINGNUMBER||'')+' — '+(p.NUMBER||'')+' '+(p.TITLE||''),'<p><b>'+t(m.SUBJECT||'Séance avec le maître de l’ouvrage')+'</b><br>'+t([[dmy(m.MEETINGDATE),heure].filter(Boolean).join(', '),m.LOCATION,(s.NUMBER?s.NUMBER+' ':'')+(s.SUBJECT||'')].filter(Boolean).join(' · '))+'</p>'
    +(P.length?'<h2>Participants</h2><table><tr><th>Participant</th><th>Société</th><th>Fonction</th>'+(conv?'':'<th>Présence</th>')+'</tr>'+P.map(x=>'<tr><td>'+t(mtPartName(x))+'</td><td>'+t(mtCompany(mtPartContact(x)))+'</td><td>'+t(x.PROJECTROLE||'')+'</td>'+(conv?'':'<td>'+(+x.ISPRESENT?'présent':t(x.ATTENDANCENOTE||'absent'))+'</td>')+'</tr>').join('')+'</table>':'')
    +(Q.length?'<h2>Questions du maître de l’ouvrage</h2>'+tb(Q,'Q',true):'')+(D.length&&!conv?'<h2>Décisions</h2>'+tb(D,'D',false):'')+(A.length?'<h2>Informations</h2>'+tb(A,'I',false):'')); }
function pmRegistre(I,T){ const p=I.p, t=E; sgImprimer('Registre des décisions — '+(p.NUMBER||'')+' '+(p.TITLE||''),'<table><tr><th>Date</th><th>PV</th><th>Phase</th><th>Décision</th></tr>'+T.map(o=>'<tr><td>'+t(dmy(o.m.MEETINGDATE))+'</td><td>n° '+t(o.m.MEETINGNUMBER||'')+'</td><td>'+t(o.s.NUMBER||'')+'</td><td>'+t(o.x.TITLE||'')+(o.x.TITLE&&o.x.TEXT?'<br>':'')+t(o.x.TEXT||'')+'</td></tr>').join('')+'</table>'); }
const docsMO=p=>{ const pr=sgDosNfc(p,'Projet'); return {fil:d=>!!pr&&d.startsWith(pr+'/')&&/^\/[^/]+\/PV MO(\/|$)/.test(d.slice(pr.length)),dos:()=>ch03aDossier('document',p.ID,'Projet'),vide:'Aucun fichier de PV MO.',ajout:'Ajouter des PV MO',
  phaseDlg:{titre:'Ajouter des PV MO',phases:SG_PH_FICH.map(x=>x[0]),phase:31,rubriques:[['PV MO','PV']],rubrique:'PV MO',sansPhase:'',enquete:false}}; };
const PVMO={
  rendre(I){ const p=I.p, u=I.u, L=seriesDe(p,true), T=pvsMO(L), plus={t:'PV MO',n:pl(T.length,'procès-verbal','procès-verbaux'),plus:'npm',plusT:'Nouveau PV MO'};
    const ong=u.onglet||'pv', Q=questionsMO(L), Dc=decisionsMO(L), fil=(sans)=>'<div class="sgsv-fil">'+[['pv','Procès-verbal'],['q','Questions ouvertes',Q.length],['d','Décisions',Dc.length],['f','Fichiers']].map(([k,t,n])=>'<button data-a="ong" data-o="'+k+'" class="'+(k===ong?'on':'')+'">'+t+(n?'<small>'+n+'</small>':'')+'</button>').join('')+'<span class="dr">'+(ong==='d'&&Dc.length?btn('impreg','Imprimer le registre','print'):'')+(u.peut&&!sans?btn('npm','Nouveau PV MO','plus'):'')+'</span></div>';
    const vQ=()=>'<section class="sgsv-sec"><h3>Questions ouvertes du maître de l’ouvrage<span>'+pl(Q.length,'question')+', '+Q.filter(o=>retQ(o.x)).length+' en retard</span></h3>'+(Q.length?'<table class="sgsv-tb"><thead><tr><th>Délai</th><th>Resp.</th><th>Question</th><th>Phase</th><th>Dernier PV</th><th>Depuis</th><th class="c">Réglé</th></tr></thead><tbody>'
        +Q.map(o=>'<tr><td class="dl'+(retQ(o.x)?' sgsv-ret':'')+'">'+E(dmy(o.x.DEADLINE)||'—')+'</td><td>'+iniR(o.x)+'</td><td>'+E(o.x.TITLE||o.x.TEXT||'')+'</td><td class="nw">'+E(o.s.NUMBER||'')+'</td><td class="nw"><button class="sgsv-lien" data-a="pv" data-m="'+o.m.ID+'">n° '+E(o.m.MEETINGNUMBER||'—')+'</button></td><td class="nw">n° '+E(o.de.MEETINGNUMBER||'—')+'</td><td class="c">'+(u.peut?'<button class="sgsv-ck" data-a="regle" data-p="'+o.x.ID+'" title="Répondu, réglé" aria-label="Répondu, réglé"></button>':'')+'</td></tr>').join('')+'</tbody></table>':'<p class="sgsv-rien">Aucune question ouverte.</p>')+'</section>';
    const vD=()=>'<section class="sgsv-sec"><h3>Registre des décisions<span>'+pl(Dc.length,'décision')+', de la plus récente à la plus ancienne</span></h3>'+(Dc.length?'<table class="sgsv-tb"><thead><tr><th>Date</th><th>PV</th><th>Phase</th><th>Décision</th></tr></thead><tbody>'
        +Dc.map(o=>'<tr><td class="dl">'+E(dmy(o.m.MEETINGDATE))+'</td><td class="nw"><button class="sgsv-lien" data-a="pv" data-m="'+o.m.ID+'">n° '+E(o.m.MEETINGNUMBER||'—')+'</button></td><td class="nw">'+E(o.s.NUMBER||'')+'</td><td>'+(o.x.TITLE?'<b>'+E(o.x.TITLE)+'</b>':'')+(o.x.TITLE&&o.x.TEXT?'<br>':'')+(o.x.TEXT?'<span class="gr">'+E(o.x.TEXT)+'</span>':'')+'</td></tr>').join('')+'</tbody></table>':'<p class="sgsv-rien">Aucune décision.</p>')+'</section>';
    const vF='<section class="sgsv-sec"><div class="sgsv-docs"></div></section>';
    if(!T.length) return '<div class="sgsv">'+tete(p.NUMBER||'','PV MO',p.TITLE||'',moT(p)?'Maître de l’ouvrage : '+moT(p):'',u.peut?btn('npm','Nouveau PV MO','plus',1):'')
      +'<div style="height:14px"></div>'+fil(true)+(ong==='f'?vF:'<div class="sgsv-vide"><b>Aucun procès-verbal avec le maître de l’ouvrage.</b><br>Chaque séance réunit ses participants, les questions du maître de l’ouvrage avec leurs réponses, et les décisions prises. Les questions restées ouvertes se reprennent d’une séance à l’autre ; les décisions forment le registre du projet.</div>')+'</div>';
    const {s,m}=choixPV(p,L), col=colSeances(I,L,s,m,plus);
    if(!m) return '<div class="sgd sgsv-b">'+col+'<div class="sgd-m">'+tete(s.NUMBER||'—','PV MO',s.SUBJECT||'','Aucun procès-verbal dans cette phase',u.peut?btn('npm','Nouveau PV MO','plus',1):'')+'</div></div>';
    const e=etatPV(m), P=mtParts(m), It=mtItems(m), Qp=It.filter(estQ), Dp=It.filter(estD), Ap=It.filter(x=>!estQ(x)&&!estD(x)), oQ=Qp.filter(x=>!+x.ISDONE), rt=oQ.filter(retQ).length, pres=P.filter(x=>+x.ISPRESENT).length, heure=m.TIMEFROM?mtTime(m.TIMEFROM)+(m.TIMETO?' – '+mtTime(m.TIMETO):''):'';
    const act=(e==='prevue'?btn('convmo','Convocation','print',1)+btn('impmo','Procès-verbal','print'):btn('impmo','Procès-verbal','print',1)+btn('convmo','Convocation','print'))+(u.peut?btn('modpv','Modifier','edit'):'')+'<button class="nx-btn" data-a="pvmenu" title="Autres actions" aria-label="Autres actions">⋯</button>';
    const corps=ong==='q'?vQ():ong==='d'?vD():ong==='f'?vF:'<section class="sgsv-sec" style="margin-bottom:18px"><h3>Participants<span class="dr">'+(u.peut?lien('parts','Modifier','Ajouter, retirer ou modifier les participants'):'')+lien('partsmenu','Fonctions ▾','Présences, distribution, courriels, invitation')+'</span></h3>'+blocParts(I,m)+'</section>'
      +'<section class="sgsv-sec fl"><h3>Questions du maître de l’ouvrage<span>'+(oQ.length?pl(oQ.length,'ouverte'):Qp.length?'toutes réglées':'')+'</span>'+(u.peut?'<span class="dr">'+lien('addq','+ Question')+'</span>':'')+'</h3>'+(Qp.length?lignesPt(I,Qp,numP(It,estQ,'Q'),true):'<p class="sgsv-rien">Aucune question.</p>')+'</section>'
      +'<section class="sgsv-sec fl"><h3>Décisions'+(u.peut?'<span class="dr">'+lien('addd','+ Décision')+'</span>':'')+'</h3>'+(Dp.length?lignesPt(I,Dp,numP(It,estD,'D'),false):'<p class="sgsv-rien">Aucune décision.</p>')+'</section>'
      +((Ap.length||u.peut)?'<section class="sgsv-sec fl"><h3>Informations'+(u.peut?'<span class="dr">'+lien('addi','+ Information')+'</span>':'')+'</h3>'+(Ap.length?lignesPt(I,Ap,numP(It,x=>!estQ(x)&&!estD(x),'I'),false):'<p class="sgsv-rien">Aucune information.</p>')+'</section>':'')+(m.NOTE?'<section class="sgsv-sec fl"><h3>Notes</h3><div class="sgsv-texte">'+E(m.NOTE)+'</div></section>':'');
    return '<div class="sgd sgsv-b">'+col+'<div class="sgd-m">'+tete(m.MEETINGNUMBER||'—','PV MO · '+[s.NUMBER,s.SUBJECT].filter(Boolean).join(' ')+' · '+ETATS_PV[e],m.SUBJECT||'Séance avec le maître de l’ouvrage',[[dmy(m.MEETINGDATE),heure].filter(Boolean).join(', '),m.LOCATION,m.GOAL].filter(Boolean).join(' · '),act)
      +'<div class="nx-kpis sgsv-kp">'+kpi('Participants',pres+'<small>/'+P.length+'</small>','présents')+kpi('Questions',String(Qp.length),'dans ce procès-verbal')+kpi('Ouvertes',String(oQ.length),'sans réponse réglée')+kpi('Décisions',String(Dp.length),'prises à cette séance')+kpi('En retard',String(rt),rt?'délai dépassé':'aucune',rt?'ret':'')+'</div>'+fil(false)+corps+'</div></div>'; },
  apres(I){ const dz=I.box.querySelector('.sgsv-docs'); if(dz&&typeof sgDocsModule==='function'){ try{ sgDocsModule(dz,I.p,docsMO(I.p)); }catch(e){ console.error(e); } } },
  action(I,a,t){ const p=I.p, u=I.u, s=DS.get('meetingsequence',MT.seq.sel), m=DS.get('meeting',MT.mtg.sel), r=()=>I.dessiner(), it=()=>DS.get('meetingitem',t.dataset.p);
    if(a==='npm') pmNouveau(I); else if(a==='impmo'){ if(m) pmImprimer(I,s,m,false); } else if(a==='convmo'){ if(m) pmImprimer(I,s,m,true); } else if(a==='impreg') pmRegistre(I,decisionsMO(seriesDe(p,true)));
    else if(a==='addq'||a==='addd'||a==='addi'){ if(m) pmPoint(I,m,null,{addq:4,addd:2,addi:1}[a]); }
    else if(a==='ptmo'){ const x=it(); if(x) pmPoint(I,DS.get('meeting',x.MEETING_ID)||m,x); }
    else if(a==='pvmenu'){ if(m) menuSous(t,menuMO(u,p,s,m)); } else SEANCES.action(I,a,t); },
  ctx(I,t,e){ const a=t.dataset.a, p=I.p, u=I.u;
    if(a==='serie'){ const s=DS.get('meetingsequence',t.dataset.s); if(!s) return false; sgMenuAt(e.clientX,e.clientY,[...(u.peut?[{t:'Modifier la série…',fn:()=>mtSeqDialog(p,s)},'-',{t:'Supprimer la série…',danger:true,fn:()=>mtSeqDelete(s)}]:[])]); return u.peut; }
    if(a==='pv'){ const m=DS.get('meeting',t.dataset.m), s=m&&DS.get('meetingsequence',m.MEETINGSEQUENCE_ID); if(!m) return false; sgMenuAt(e.clientX,e.clientY,[...(u.peut?[{t:'Modifier le procès-verbal…',fn:()=>mtMeetingDialog(s,m)}]:[]),...menuMO(u,p,s,m)]); return true; }
    return false; } };
const menuMO=(u,p,s,m)=>[...(u.peut?[{t:'Participants…',fn:()=>mtPartsDialog(m)},{t:'Tous les points…',fn:()=>mtItemsDialog(m)},'-']:[]),{t:'Envoi courriel',dis:!mtParts(m).length,fn:()=>mtInvite(m)},...(u.peut?['-',{t:'Supprimer le procès-verbal…',danger:true,fn:()=>mtMeetingDelete(m)}]:[])];
window.sgPvMoModule=(C,p)=>monter(C,p,'pvmo',['meetingsequence','meeting','meetingitem','meetingparticipant','projectmeetingtype','depotfichier'],PVMO);
window.sgPvMoCompte=p=>{ try{ const L=seriesDe(p,true), n=pvsMO(L).length, q=questionsMO(L).length; return n?pl(n,'PV','PV')+(q?' · '+pl(q,'question ouverte','questions ouvertes'):''):'à commencer'; }catch(_){ return ''; } };
window.sgEstSerieMO=estMO;

/* ── NOTES ── */
const auteur=o=>{ if(o==null||o==='') return ''; try{ const a=DS.all('appuser').find(x=>String(x.USERID)===String(o)||String(x.ID)===String(o)); return (a&&a.NAME)||String(o); }catch(_){ return String(o); } };
const sousProjet=id=>{ const s=id&&DS.get('subproject',id); return s?[s.CODE,s.DESCRIPTION].filter(Boolean).join(' '):''; };
const rechercheH=(u,ph)=>'<div class="sgsv-q"><input class="inp" data-q type="search" placeholder="'+E(ph)+'" aria-label="'+E(ph)+'" value="'+E(u.q||'')+'"></div>';
const trouve=(q,...v)=>{ const c=String(q||'').trim().toLowerCase(); return !c||v.some(x=>String(x==null?'':x).toLowerCase().includes(c)); };
const notesDe=(p,q)=>DS.by('projectnote','PROJECT_ID',p.ID).filter(n=>trouve(q,n.SUBJECT,n.CONTENT,auteur(n.OWNER))).sort((a,b)=>cmp(b.CHANGEDDATE,a.CHANGEDDATE)||cmp(b.ID,a.ID));
function noteEd(I,x){ const p=I.p, v=x?{...x}:{ID:null,PROJECT_ID:p.ID,OWNER:ME.id,CHANGEDDATE:today()}, sp=DS.by('subproject','PROJECT_ID',p.ID), b=document.createElement('div'); b.className='sgsv-dlg';
  b.innerHTML='<label class="w">Concerne<input data-k="SUBJECT" maxlength="255" value="'+E(v.SUBJECT||'')+'"></label><label>Date<input type="date" data-k="CHANGEDDATE" value="'+E(v.CHANGEDDATE||'')+'"></label>'
    +(sp.length?'<label>Ouvrage<select data-k="SUBPROJECT_ID"><option value=""></option>'+sp.map(s=>'<option value="'+s.ID+'"'+(s.ID===v.SUBPROJECT_ID?' selected':'')+'>'+E([s.CODE,s.DESCRIPTION].filter(Boolean).join(' '))+'</option>').join('')+'</select></label>':'<span></span>')
    +'<label class="w">Texte<textarea data-k="CONTENT">'+E(v.CONTENT||'')+'</textarea></label><div class="q">Utilisateur : '+E(auteur(v.OWNER))+'</div>';
  const q=k=>b.querySelector('[data-k="'+k+'"]');
  dialog({title:x?'Modifier la note':'Nouvelle note',width:'640px',body:b,buttons:[{t:'Annuler'},{t:'OK',pri:true,fn:async()=>{ const su=q('SUBJECT').value.trim(), co=q('CONTENT').value.trim();
    if(!su&&!co){ toast('Écrivez un sujet ou un texte.',true); q('SUBJECT').focus(); return false; }
    Object.assign(v,{SUBJECT:su||null,CONTENT:co||null,CHANGEDDATE:q('CHANGEDDATE').value||today()}); if(sp.length) v.SUBPROJECT_ID=q('SUBPROJECT_ID').value?+q('SUBPROJECT_ID').value:null;
    await DS.save('projectnote',v); I.u.sel=String(v.ID); I.u.sM=0; }}]});
  setTimeout(()=>q(x?'CONTENT':'SUBJECT').focus(),0); }
const NOTES={
  rendre(I){ const p=I.p, u=I.u, tout=DS.by('projectnote','PROJECT_ID',p.ID);
    if(!tout.length) return '<div class="sgsv">'+tete(p.NUMBER||'','Notes',p.TITLE||'',moT(p)?'Maître de l’ouvrage : '+moT(p):'','')+'<div class="sgsv-vide"><b>Aucune note pour ce projet.</b>'+(u.peut?'<div class="acts">'+btn('nnote','Nouvelle note','plus',1)+'</div>':'')+'</div></div>';
    const L=notesDe(p,u.q); let n=L.find(x=>String(x.ID)===String(u.sel))||L[0]||null; u.sel=n?String(n.ID):null; let an='';
    const col='<div class="sgd-col"><div class="sgd-ct"><b>Notes</b><span class="dr"><span>'+pl(tout.length,'note')+'</span>'+(u.peut?'<button class="sgsv-mini" data-a="nnote" title="Nouvelle note" aria-label="Nouvelle note">+</button>':'')+'</span></div>'+rechercheH(u,'Rechercher dans les notes')+'<div class="sgd-l">'
      +(L.length?L.map(x=>{ const y=String(x.CHANGEDDATE||'').slice(0,4)||'Sans date', g=y!==an?'<div class="sgd-gt fixe"><span class="t">'+E(y)+'</span></div>':''; an=y;
        return g+'<button class="sgd-it'+(n&&x.ID===n.ID?' on':'')+'" data-a="note" data-n="'+x.ID+'"><span class="sgsv-ini">'+E(dmy(x.CHANGEDDATE).slice(0,5)||'—')+'</span><span class="m"><b>'+E(x.SUBJECT||String(x.CONTENT||'').split('\n')[0]||'(sans sujet)')+'</b><span>'+E(auteur(x.OWNER))+'</span></span></button>'; }).join(''):'<p class="sgsv-rien" style="padding:12px">Aucune note trouvée.</p>')+'</div></div>';
    const droite=n?tete(dmy(n.CHANGEDDATE).slice(0,5)||'—','Note · '+(dmy(n.CHANGEDDATE)||'sans date'),n.SUBJECT||'(sans sujet)',[auteur(n.OWNER)?'par '+auteur(n.OWNER):'',sousProjet(n.SUBPROJECT_ID)].filter(Boolean).join(' · '),u.peut?btn('modn','Modifier','edit',1)+'<button class="nx-btn" data-a="supn">Supprimer</button>':'')
      +'<div class="sgsv-texte" style="padding-top:18px">'+(n.CONTENT?E(n.CONTENT):'<span style="color:var(--s-gris)">Note sans texte.</span>')+'</div>':'';
    return '<div class="sgd sgsv-b">'+col+'<div class="sgd-m">'+droite+'</div></div>'; },
  async action(I,a,t){ const u=I.u, n=DS.get('projectnote',u.sel);
    if(a==='nnote') noteEd(I,null); else if(a==='note'){ u.sel=t.dataset.n; u.sM=0; u.focL='.sgd-it.on'; I.dessiner(); } else if(a==='modn'){ if(n) noteEd(I,n); }
    else if(a==='supn'){ if(n&&await confirmDlg('Supprimer cette note ?','Supprimer')){ await DS.del('projectnote',n.ID); u.sel=null; } } },
  ctx(I,t,e){ if(t.dataset.a!=='note'||!I.u.peut) return false; const n=DS.get('projectnote',t.dataset.n); if(!n) return false;
    sgMenuAt(e.clientX,e.clientY,[{t:'Modifier…',fn:()=>noteEd(I,n)},'-',{t:'Supprimer…',danger:true,fn:async()=>{ if(await confirmDlg('Supprimer cette note ?','Supprimer')){ await DS.del('projectnote',n.ID); if(String(I.u.sel)===String(n.ID)) I.u.sel=null; } }}]); return true; } };
const dv0=domainView;
domainView=function(C,p,d){ if(d==='Notes'){ monter(C,p,'notes',['projectnote','subproject'],NOTES); return; } return dv0(C,p,d); };

/* ── TÂCHES ── */
const GR_T=[[1,'En traitement'],[0,'Brouillons'],[3,'Réglées'],[2,'Annulées']];
const finieT=t=>+t.PROJECTTASKSTATECODE===3||+t.PROJECTTASKSTATECODE===2;
const retT=t=>!finieT(t)&&!!t.DEADLINE&&t.DEADLINE<today();
const respT=t=>staffName(DS.get('staff',t.STAFF_ID))||'';
const tachesDe=(p,q)=>DS.by('projecttask','PROJECT_ID',p.ID).filter(t=>trouve(q,...ptText(t))).sort((a,b)=>(b.ISURGENT?1:0)-(a.ISURGENT?1:0)||cmp(a.DEADLINE||'9',b.DEADLINE||'9')||cmp(b.STARTDATE,a.STARTDATE));
const TACHES={
  rendre(I){ const p=I.p, u=I.u, tout=DS.by('projecttask','PROJECT_ID',p.ID);
    if(!tout.length) return '<div class="sgsv">'+tete(p.NUMBER||'','Tâches',p.TITLE||'',moT(p)?'Maître de l’ouvrage : '+moT(p):'','')+'<div class="sgsv-vide"><b>Aucune tâche pour ce projet.</b>'+(u.peut?'<div class="acts">'+btn('nt','Nouvelle tâche','plus',1)+'</div>':'')+'</div></div>';
    const L=tachesDe(p,u.q), ouv=u.ouvT||(u.ouvT={1:true,0:true}); let t=L.find(x=>String(x.ID)===String(u.sel))||L.find(x=>!finieT(x))||L[0]||null; u.sel=t?String(t.ID):null;
    const nb=k=>tout.filter(x=>+x.PROJECTTASKSTATECODE===k).length;
    const grp=GR_T.map(([k,lib])=>{ const G=L.filter(x=>+x.PROJECTTASKSTATECODE===k); if(!G.length) return ''; const de=(u.q?true:ouv[k])||(t&&+t.PROJECTTASKSTATECODE===k&&String(u.sel)===String(t.ID)&&u.forceG===k);
      return '<button class="sgd-gt" data-a="grp" data-k="'+k+'"><span class="t">'+(de?'▾ ':'▸ ')+E(lib)+'</span><span class="n">'+G.length+'</span></button>'
        +(de?G.map(x=>{ const r=respT(x), ro=x.ISURGENT?'urgente':'', dl=x.DEADLINE?'délai '+dmy(x.DEADLINE):''; return '<button class="sgd-it'+(t&&x.ID===t.ID?' on':'')+'" data-a="t" data-t="'+x.ID+'"><span class="sgsv-ini" title="'+E(r)+'">'+E(inis(r)||'—')+'</span><span class="m"><b>'+E(x.SUBJECT||'(sans objet)')+'</b><span'+(retT(x)||x.ISURGENT?' class="sgsv-ret"':'')+'>'+E([ro,dl].filter(Boolean).join(' · ')||(+x.PROJECTTASKSTATECODE===3&&x.DONEDATE?'réglée le '+dmy(x.DONEDATE):'sans délai'))+'</span></span></button>'; }).join(''):''); }).join('');
    const col='<div class="sgd-col"><div class="sgd-ct"><b>Tâches</b><span class="dr"><span>'+pl(tout.length,'tâche')+'</span>'+(u.peut?'<button class="sgsv-mini" data-a="nt" title="Nouvelle tâche" aria-label="Nouvelle tâche">+</button>':'')+'<button class="sgsv-mini" data-a="tmenu" title="Imprimer, copier, exporter" aria-label="Imprimer, copier, exporter">⋯</button></span></div>'+rechercheH(u,'Rechercher dans les tâches')+'<div class="sgd-l">'+(L.length?grp:'<p class="sgsv-rien" style="padding:12px">Aucune tâche trouvée.</p>')+'</div></div>';
    const nR=tout.filter(retT).length, nU=tout.filter(x=>x.ISURGENT&&!finieT(x)).length, chiffres='<div class="nx-kpis sgsv-kp">'+kpi('En traitement',String(nb(1)),'')+kpi('Urgentes',String(nU),'',nU?'ret':'')+kpi('En retard',String(nR),nR?'délai dépassé':'aucune',nR?'ret':'')+kpi('Brouillons',String(nb(0)),'')+kpi('Réglées',String(nb(3)),'')+'</div>';
    if(!t) return '<div class="sgd sgsv-b">'+col+'<div class="sgd-m">'+chiffres+'</div></div>';
    const r=respT(t), N=DS.by('projecttasknote','PROJECTTASK_ID',t.ID).slice().sort((a,b)=>cmp(b.CHANGEDDATE,a.CHANGEDDATE)), ent=ptContact(DS.get('contact',t.CONTACT_ID)), ou=ptSub(DS.get('subproject',t.SUBPROJECT_ID));
    const champ=(l,v,c)=>v?'<div><b>'+E(l)+'</b><span'+(c?' class="'+c+'"':'')+'>'+E(v)+'</span></div>':'';
    return '<div class="sgd sgsv-b">'+col+'<div class="sgd-m">'+tete(inis(r)||'—','Tâche · '+(PT_STATE[t.PROJECTTASKSTATECODE]||'Nouvelle')+(t.ISURGENT?' · urgente':''),t.SUBJECT||'(sans objet)',[r?'responsable '+r:'',t.USERNAME?'créée par '+t.USERNAME+(t.STARTDATE?' le '+dmy(t.STARTDATE):''):''].filter(Boolean).join(' · '),
        (u.peut?btn('modt','Modifier','edit',1):'')+btn('impt','Imprimer','print')+(u.peut?'<button class="nx-btn" data-a="supt">Supprimer</button>':''))+chiffres
      +'<section class="sgsv-sec fl"><h3>Fiche</h3><div class="sgsv-fiche" style="padding-top:0">'+champ('Responsable',r)+champ('Entité',ent)+champ('Ouvrage',ou)+champ('Priorité',+t.PROJECTTASKPRIORITYCODE?PT_PRIO[t.PROJECTTASKPRIORITYCODE]:'')+champ('Début',dmy(t.STARTDATE))+champ('Délai',dmy(t.DEADLINE),retT(t)?'sgsv-ret':'')+champ('Réglée le',dmy(t.DONEDATE))+'</div></section>'
      +'<section class="sgsv-sec fl"><h3>Description</h3><div class="sgsv-texte">'+(t.DESCRIPTION?E(t.DESCRIPTION):'<span style="color:var(--s-gris)">Aucune description.</span>')+'</div></section>'
      +(N.length?'<section class="sgsv-sec fl"><h3>Notes de la tâche<span>'+N.length+'</span></h3>'+N.map(x=>'<div class="sgsv-note"><div class="q">'+E([dmy(x.CHANGEDDATE),auteur(x.OWNER)].filter(Boolean).join(' · '))+'</div>'+(x.SUBJECT?'<b>'+E(x.SUBJECT)+'</b>':'')+(x.CONTENT?'<p>'+E(x.CONTENT)+'</p>':'')+'</div>').join('')+'</section>':'')+'</div></div>'; },
  action(I,a,tg){ const p=I.p, u=I.u, t=DS.get('projecttask',u.sel);
    if(a==='nt') ptPickCatalog(p); else if(a==='t'){ u.sel=tg.dataset.t; u.sM=0; u.focL='.sgd-it.on'; I.dessiner(); }
    else if(a==='grp'){ const k=tg.dataset.k, o=u.ouvT||(u.ouvT={1:true,0:true}); o[k]=!o[k]; I.dessiner(); }
    else if(a==='modt'){ if(t) ptEditFull(t,p); } else if(a==='impt'){ if(t) ptPrintTask(t); } else if(a==='supt'){ if(t) ptDelete(t); }
    else if(a==='tmenu'){ const L=tachesDe(p,u.q), g={view:L,cols:PT_DCOLS}; menuSous(tg,[{t:'Liste des tâches…',dis:!L.length,fn:()=>ptPrintList(L,p,null)},'-',...ptExport(g,'Taches_'+(p.NUMBER||p.ID))]); } },
  ctx(I,tg,e){ if(tg.dataset.a!=='t') return false; const p=I.p, u=I.u, t=DS.get('projecttask',tg.dataset.t); if(!t) return false;
    sgMenuAt(e.clientX,e.clientY,[...(u.peut?[{t:'Modifier…',fn:()=>ptEditFull(t,p)}]:[]),{t:'Imprimer',fn:()=>ptPrintTask(t)},...(u.peut?['-',{t:'Supprimer…',danger:true,fn:()=>ptDelete(t)}]:[])]); return true; } };
ptDomain=function(C,top,pane,p){ monter(C,p,'taches',['projecttask','projecttasknote','subproject','staff','contact'],TACHES); };

/* ── FRAIS ── */
const moisAn=r=>String(r.DATEYEAR||'');
const nomC=(t,id)=>{ try{ return nm(DS.get(t,id))||''; }catch(_){ return ''; } };
const etatF=r=>r.ISCHARGED?'Facturé':(typeof TSTATE!=='undefined'&&TSTATE[r.PROJECTCOSTSTATECODE])||'';
const fmt=n=>num(n);
const FRAIS={
  rendre(I){ const p=I.p, u=I.u, tous=DS.by('projectcost','PROJECT_ID',p.ID), A=[...new Set(tous.map(moisAn).filter(y=>/^\d{4}$/.test(y)))].sort().reverse(), s0=String(nxLS.get('sg3_frais_an','')||''), y=A.length>1&&A.includes(s0)?s0:'';
    const R=tous.filter(r=>(!y||moisAn(r)===y)&&trouve(u.q,r.DESCRIPTION,r.DOCUMENTNUMBER,nomC('projectcostcategorygroup',r.COSTCATEGORYGROUP_ID),nomC('projectcostcategory',r.COSTCATEGORY_ID),staffName(DS.get('staff',r.STAFF_ID)))).sort((a,b)=>pcDate(b)-pcDate(a)||cmp(b.ID,a.ID));
    const somme=f=>R.filter(f).reduce((s,r)=>s+pcAmount(r),0), tot=somme(()=>true), fa=somme(r=>r.ISCHARGEABLE), fd=somme(r=>r.ISCHARGED), af=somme(r=>r.ISCHARGEABLE&&!r.ISCHARGED), ar=somme(r=>r.ISREFUNDABLE&&!r.ISREFUNDED), mo=moT(p);
    return '<div class="sgsv">'+tete(p.NUMBER||'','Frais du projet',p.TITLE||'',[mo?'Maître de l’ouvrage : '+mo:'',pl(tous.length,'frais','frais')].filter(Boolean).join(' · '),btn('nf','Nouveau frais','plus',1))
      +'<div class="nx-kpis sgsv-kp">'+kpi(y?'Total '+y:'Total',fmt(tot)+'<small>CHF</small>',pl(R.length,'frais','frais'))+kpi('Facturables',fmt(fa)+'<small>CHF</small>','')+kpi('À facturer',fmt(af)+'<small>CHF</small>','facturables, pas encore facturés')+kpi('Facturés',fmt(fd)+'<small>CHF</small>','')+kpi('À rembourser',fmt(ar)+'<small>CHF</small>','aux collaborateurs')+'</div>'
      +'<div class="sgsv-fil">'+(A.length>1?[['','Toutes'],...A.map(a=>[a,a])].map(([v,t])=>'<button data-a="an" data-y="'+v+'" class="'+(v===y?'on':'')+'" aria-pressed="'+(v===y)+'">'+t+'</button>').join(''):'')+'<span class="dr"><input class="inp" data-q type="search" style="width:240px" placeholder="Rechercher dans les frais" aria-label="Rechercher dans les frais" value="'+E(u.q||'')+'"></span></div>'
      +(R.length?'<table class="nx-tbl sgsv-tb"><thead><tr><th>Date</th><th>Collaborateur</th><th>Groupe de frais</th><th>Genre de frais</th><th>Désignation</th><th>N° pièce</th><th class="r">Quantité</th><th class="r">Montant CHF</th><th>Phase</th><th>État</th><th class="c">Facturable</th></tr></thead><tbody>'
        +R.map(r=>'<tr data-a="f" data-f="'+r.ID+'"><td class="nw">'+E(dfr(diso(pcDate(r))))+'</td><td class="nw">'+E(staffName(DS.get('staff',r.STAFF_ID)))+'</td><td>'+E(nomC('projectcostcategorygroup',r.COSTCATEGORYGROUP_ID))+'</td><td>'+E(nomC('projectcostcategory',r.COSTCATEGORY_ID))+'</td><td>'+E(r.DESCRIPTION||'')+'</td><td class="nw">'+E(r.DOCUMENTNUMBER||'')+'</td>'
          +'<td class="r nw">'+E(num(r.QUANTITY))+(r.UNIT?' '+E(r.UNIT):'')+'</td><td class="r nw"'+(r.FOREIGNCURRENCYCODE?' title="'+E(r.FOREIGNCURRENCYCODE)+'"':'')+'>'+E(fmt(pcAmount(r)))+'</td><td>'+E(nomC('projectphase',r.PHASE_ID))+'</td><td class="nw">'+E(etatF(r))+'</td><td class="c">'+(r.ISCHARGEABLE?'✓':'')+'</td></tr>').join('')
        +'<tr class="tot"><td class="nw">Total'+(y?' '+y:'')+'</td><td></td><td></td><td></td><td></td><td></td><td></td><td class="r nw">'+E(fmt(tot))+'</td><td></td><td></td><td></td></tr></tbody></table>'
        :'<p class="sgsv-rien">'+(u.q?'Aucun frais trouvé.':y?'Aucun frais en '+y+'.':'Aucun frais pour ce projet.')+'</p>')+'</div>'; },
  action(I,a,t){ if(a==='nf') editCost(null,{project:I.p.ID,date:new Date()}); else if(a==='f'){ const r=DS.get('projectcost',t.dataset.f); if(r) editCost(r); } else if(a==='an'){ nxLS.set('sg3_frais_an',t.dataset.y); I.u.sM=0; I.dessiner(); } },
  ctx(I,t,e){ if(t.dataset.a!=='f') return false; const r=DS.get('projectcost',t.dataset.f); if(!r) return false; sgMenuAt(e.clientX,e.clientY,[{t:'Modifier…',fn:()=>editCost(r)},'-',{t:'Supprimer…',danger:true,fn:()=>delCost(r)}]); return true; } };
sgFraisModule=function(C,p){ monter(C,p,'frais',['projectcost','projectcostcategory','projectcostcategorygroup','projectphase','staff'],FRAIS); };

if(typeof SG_PDOM_T!=='undefined') SG_PDOM_T.push('meetingitem','meetingparticipant','projecttasknote');
window.SGSV={version:'04.11.2026',ETAT,ouvertsSerie,etatPV,tachesDe,notesDe};
})();

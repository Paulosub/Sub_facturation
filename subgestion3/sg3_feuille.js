/* ═══ 27. Temps ▸ Feuille d'heures : nouvelle présentation (24.10.2026) ═══════════════════════════════════════════════════════════════════
   Demande de Paulo : « améliore la feuille d'heures, plus graphique ; la colonne collaborateur n'est pas nécessaire ; le nom du collaborateur en
   haut puis la feuille d'heures ; avant de modifier, fais une copie dans Réglages ». Cinq variantes maquettées (A Agenda, B Grille, C Frise,
   D Mois, E Journal), charte seulement ; choix de Paulo : A, « pouvoir glisser les heures, qu'elles ne se superposent surtout pas, les mêmes
   fonctions que la version actuelle (option-clic pour copier…), pas de nouvelle fonctionnalité », et garder le Journal « pour information au
   collaborateur ».
   - Mêmes fonctions : la semaine est dessinée par hsWeek du moteur, puis seulement habillée ici (glisser sur une plage libre = nouvelle saisie,
     ⌥ + glisser = copie de la saisie choisie, glisser une saisie = la déplacer d'un jour ou d'une heure à l'autre, bord inférieur = sa fin,
     Cmd / Maj = sélection multiple, double-clic = modifier, clic droit = menu, Suppr, Cmd-A, Échap, contrôle des chevauchements hsOverlap,
     réglages personnels) ; Mois = hsMonth ; barre d'outils inchangée (VIEWS['h-saisie'].tools du moteur), placée sous les chiffres (même jour,
     demande de Paulo : l'élément #tools est déplacé dans la page, la barre du haut est masquée — html.sgfh-on — et #tools revient à sa place
     avant tout changement d'écran, sgfhOutilsRendre dans l'enveloppe de go).
   - Présentation : en-tête au nom du collaborateur (initiales, nom, ▾ pour changer de collaborateur à la place de la colonne, depuis quand il est
     au bureau, heures taguées, saisie bloquée), période ; chiffres de la période (heures saisies et jauge, prévues, écart à ce jour, vacances
     restantes, projets) ; jours (nom, date, total / prévues, jauge, férié) ; une couleur par projet, gardée d'une semaine à l'autre (bureau en
     gris), état en pastille (✓ approuvée, ! refusée, ↺ corrigée), vacances hachurées ; saisies qui se chevauchent (anciennes données) côte à côte,
     jamais l'une sur l'autre ; répartition par projet à droite.
   - Journal (semaine, bouton de l'en-tête) : une carte par jour avec ses saisies, pour l'information du collaborateur ; un clic ouvre la fenêtre de
     saisie habituelle (hsEdit). Choix gardé : sg3_fh_vue.
   - L'ancienne feuille d'heures reste dans Réglages ▸ Archives · Ancienne feuille d'heures (h-saisie-archive : le rendu d'origine du moteur ; ses
     boutons et menus restent dans l'archive). « Archives · Feuille d'heures » marqué F = l'ancien registre de Facturation, autre chose. ═══ */
const SGFH_PAL=['#003346','#4CBAB5','#3F4193','#98C21F','#D7860D','#636E7E','#8C6D4F','#B5446E'], SGFH_COL=new Map();
const SGFH={vue:nxLS.get('sg3_fh_vue','agenda'),redir:false};
const sgfhEtat=r=>{ const v=+r.TIMELOGSTATECODE||0; return v===3?'ok':v===1?'ref':v===2?'cor':''; };
const sgfhBadge=r=>{ const e=sgfhEtat(r); return e==='ok'?'<span class="sgfh-st ok" title="Approuvée">'+nxSvg('check')+'</span>':e==='ref'?'<span class="sgfh-st ref" title="Refusée : à corriger">!</span>'
  :e==='cor'?'<span class="sgfh-st cor" title="Corrigée, à contrôler">↺</span>':''; };
const sgfhTxt=x=>String(x||'').replace(/\s+/g,' ').trim();
const sgfhPhase=r=>{ const f=x=>sgfhTxt(x&&typeof sgPhNom==='function'?sgPhNom(x):x), a=f(nm(DS.get('projectphase',r.PHASE_ID))), b=f(nm(DS.get('projectsubphase',r.SUBPHASE_ID))); return [a,b&&b!==a?b:''].filter(Boolean).join(' · '); };
const sgfhAct=r=>sgfhTxt(nm(DS.get('projectactivity',r.ACTIVITY_ID)));
const sgfhPhAct=r=>{ const p=sgfhPhase(r), a=sgfhAct(r); return [p,a&&a!==p?a:''].filter(Boolean).join(' · '); };
const sgfhHeures=r=>hm(r.TIMEHOUR1||0,r.TIMEMINUTE1||0)+' – '+hm(Math.floor(tlT2(r)/60),tlT2(r)%60);
const sgfhNum=id=>{ const p=DS.get('project',id); return p?sgfhTxt(p.NUMBER):''; }, sgfhTit=id=>{ const p=DS.get('project',id); return p?sgfhTxt(p.TITLE):''; };
const sgfhTeinte=(c,p)=>'color-mix(in srgb,'+c+' '+(p||20)+'%,#fff)';
const sgfhSomme=L=>L.reduce((t,r)=>t+(+r.TIMEPERIOD||0),0);
/* une couleur par projet, gardée d'une période à l'autre (une autre si elle est déjà prise dans la période) ; bureau (projet interne) en gris */
function sgfhCouleurs(L){ const hp=new Map(); L.forEach(r=>{ if(!r.ISHOLIDAY) hp.set(r.PROJECT_ID,(hp.get(r.PROJECT_ID)||0)+(+r.TIMEPERIOD||0)); });
  const ids=[...hp.keys()].sort((a,b)=>hp.get(b)-hp.get(a)), pris=new Set(), m=new Map();
  ids.forEach((id,i)=>{ const p=DS.get('project',id); if(p&&typeof sgInterne==='function'&&sgInterne(p)){ m.set(id,'#9d9d9c'); return; }
    let c=SGFH_COL.get(id); if(!c||pris.has(c)) c=SGFH_PAL.find(x=>!pris.has(x))||SGFH_PAL[i%SGFH_PAL.length]; SGFH_COL.set(id,c); pris.add(c); m.set(id,c); });
  return {c:id=>m.get(id)||'#9d9d9c',h:hp,ids}; }
/* saisies qui se chevauchent (hauteur minimale d'un quart d'heure comprise) : côte à côte en couloirs → Map ID → [couloir, nombre de couloirs] */
function sgfhCouloirs(L){ const res=new Map(); let grp=[], fin=-1, lanes=[];
  const clore=()=>{ const n=lanes.length||1; grp.forEach(([r,i])=>res.set(r.ID,[i,n])); grp=[]; lanes=[]; };
  L.forEach(r=>{ const a=tlT1(r), b=Math.max(tlT2(r),a+15); if(a>=fin){ clore(); fin=-1; }
    let i=lanes.findIndex(e=>e<=a); if(i<0){ i=lanes.length; lanes.push(b); } else lanes[i]=b; grp.push([r,i]); fin=Math.max(fin,b); });
  clore(); return res; }
function sgfhJauge(v,du){ if(!du) return '<div class="sgfh-g"></div>'; const p=Math.min(100,v/du*100), dp=v>du?Math.min(100,(v-du)/du*100):0;
  return '<div class="sgfh-g" title="'+nxE(nxH(v)+' h sur '+nxH(du)+' h prévues')+'"><i style="width:'+p+'%"></i>'+(dp?'<i class="dp" style="left:'+(100-dp)+'%;width:'+dp+'%"></i>':'')+'</div>'; }
function sgfhAnneau(v,du,t){ const r=17, c=2*Math.PI*r, p=du?Math.min(1,v/du):(v?1:0), o=du&&v>du?Math.min(1,(v-du)/du):0;
  return '<svg width="'+(t||44)+'" height="'+(t||44)+'" viewBox="0 0 44 44" style="flex:none"><title>'+nxE(nxH(v)+' h'+(du?' sur '+nxH(du)+' h prévues':''))+'</title><circle cx="22" cy="22" r="'+r+'" fill="none" stroke="var(--s-nuit3)" stroke-width="5"/>'
    +(p?'<circle cx="22" cy="22" r="'+r+'" fill="none" stroke="var(--s-nuit)" stroke-width="5" stroke-dasharray="'+(c*p)+' '+c+'" transform="rotate(-90 22 22)"/>':'')
    +(o?'<circle cx="22" cy="22" r="'+r+'" fill="none" stroke="var(--s-rouge)" stroke-width="5" stroke-dasharray="'+(c*o)+' '+c+'" transform="rotate(-90 22 22)"/>':'')+'</svg>'; }
/* période affichée (hsRange du moteur : semaine ou mois), jours, heures prévues (comme les Rapports de temps), écart jusqu'à hier, vacances */
function sgfhDonnees(){ const s=DS.get('staff',HS.staff), [a,b]=hsRange(), mois=HS.mode!=='sem', L=s?hsEntries(a,b):[];
  const [,w]=isoWeek(a), lib=mois?MOISL[a.getMonth()]+' '+a.getFullYear():'Semaine '+w+' · '+a.getDate()+(a.getMonth()!==b.getMonth()?' '+MOIS[a.getMonth()]:'')+' – '+b.getDate()+' '+MOIS[b.getMonth()]+' '+b.getFullYear();
  const PH=new Map([...pubHolidays(a.getFullYear()),...pubHolidays(b.getFullYear())]), auj=dayKey(new Date()), M=s?hrMaps(s.ID,a,b):null, J=[];
  for(let x=new Date(a);x<=b;x.setDate(x.getDate()+1)){ const d=new Date(x), k=dayKey(d), Lj=L.filter(r=>tlKey(r)===k).sort((p,q)=>tlT1(p)-tlT1(q));
    J.push({d,k,iso:diso(d),L:Lj,h:sgfhSomme(Lj),du:M?M.sum(d,d).P:0,ouvre:isWorkDay(d,PH),fer:PH.get(diso(d))||'',passe:k<auj,auj:k===auj}); }
  const lim=new Date(); lim.setHours(0,0,0,0); const fin=b<lim?b:new Date(lim.getTime()-864e5);
  return {s,a,b,mois,lib,L,J,PH,tot:sgfhSomme(L),du:M&&fin>=a?M.sum(a,fin).P:0,duP:M?M.sum(a,b).P:0,hfin:J.filter(j=>j.d<=fin).reduce((t,j)=>t+j.h,0),
    vac:s&&typeof hrHoliday==='function'?hrHoliday(s,new Date(b.getFullYear(),0,1),b):null,co:sgfhCouleurs(L)}; }
const sgfhManque=(D,j)=>j.ouvre&&j.passe&&!j.L.length&&D.s&&(!D.s.JOININGDATE||String(D.s.JOININGDATE).slice(0,10)<=j.iso)&&!(D.s.QUITTINGDATE&&String(D.s.QUITTINGDATE).slice(0,10)<j.iso);
/* en-tête : le nom du collaborateur, puis la période ; chiffres de la période */
function sgfhTete(D){ const s=D.s, sl=ch08bMyStaffs(), dt=x=>dfr(String(x).slice(0,10));
  const meta=[s&&s.JOININGDATE?'Au bureau depuis le '+dt(s.JOININGDATE):'',s&&s.TIMELOGCOMPLETEDDATE?'heures complètes jusqu’au '+dt(s.TIMELOGCOMPLETEDDATE):'heures pas encore taguées',
    s&&s.ISTIMELOGFROZEN&&s.TIMELOGFREEZINGDATE?'saisie bloquée jusqu’au '+dt(s.TIMELOGFREEZINGDATE):''].filter(Boolean).join(' · ');
  return '<div class="sgfh-tete"><div class="sgfh-id"><span class="sgfh-ini">'+nxE(s?sgtIni(s):'—')+'</span><div class="sgfh-nm"><div class="lb">Feuille d’heures</div><h2>'+nxE(s?staffName(s):'Aucun collaborateur')
      +(sl.length>1?'<button class="sgfh-chg" data-fh="chg" title="Changer de collaborateur">'+nxSvg('fwd')+'</button>':'')+'</h2><div class="sgfh-meta">'+nxE(meta)+'</div></div></div>'
    +'<div class="sgfh-per"><span class="lbl">'+nxE(D.lib)+'</span>'+(D.mois?'':'<div class="seg sgfh-vues">'+[['agenda','Agenda'],['journal','Journal']].map(([k,t])=>'<button data-fh="vue" data-k="'+k+'" class="'+(SGFH.vue===k?'on':'')+'">'+t+'</button>').join('')+'</div>')+'</div></div>'; }
function sgfhKpis(D){ const ec=D.hfin-D.du, vac=D.vac?D.vac.saldo:null, per=D.mois?'du mois':'de la semaine';
  return '<div class="nx-kpis sgfh-kp">'
    +'<div class="nx-kpi" title="'+nxE('Heures saisies '+per+' : '+nxH(D.tot)+' h sur '+nxH(D.duP)+' h prévues')+'"><div class="l">'+nxSvg('clock')+'Heures saisies</div><div class="v">'+nxH(D.tot)+'<small>h</small></div>'+sgfhJauge(D.tot,D.duP)+'</div>'
    +'<div class="nx-kpi" title="Heures prévues de la période : heures prévues du mois réparties sur ses jours ouvrés"><div class="l">'+nxSvg('cal')+'Heures prévues</div><div class="v">'+nxH(D.duP)+'<small>h</small></div></div>'
    +'<div class="nx-kpi" title="Heures saisies jusqu’à hier − heures prévues jusqu’à hier"><div class="l">'+nxSvg('trend')+'Écart à ce jour</div><div class="v '+(ec<-.25?'sgfh-neg':ec>.25?'sgfh-pos':'')+'">'+(D.du?(ec>0?'+':'')+nxH(ec)+'<small>h</small>':'—')+'</div></div>'
    +'<div class="nx-kpi" title="Solde de vacances de l’année (droit, report, vacances saisies)"><div class="l">'+nxSvg('cal')+'Vacances restantes</div><div class="v">'+(vac!=null?nxH(vac)+'<small>h</small>':'—')+'</div></div>'
    +'<div class="nx-kpi" title="Projets sur lesquels des heures sont saisies dans la période"><div class="l">'+nxSvg('folder')+'Projets</div><div class="v">'+D.co.ids.length+'</div></div></div>'; }
function sgfhRepartition(D,titre){ const ids=D.co.ids, mx=Math.max(1,...ids.map(id=>D.co.h.get(id))), vac=sgfhSomme(D.L.filter(r=>r.ISHOLIDAY));
  return '<div class="sgfh-h4">'+nxE(titre)+'</div><div class="sgfh-proj">'+(ids.length||vac?ids.map(id=>{ const c=D.co.c(id), hh=D.co.h.get(id);
      return '<div class="r" title="'+nxE(sgfhNum(id)+' '+sgfhTit(id))+'"><i class="sgfh-dot" style="background:'+c+'"></i><span class="t"><b>'+nxE(sgfhNum(id))+'</b> '+nxE(sgfhTit(id))+'</span><b>'+nxH(hh)+' h</b><div class="bar"><i style="width:'+(hh/mx*100)+'%;background:'+c+'"></i></div></div>'; }).join('')
    +(vac?'<div class="r"><i class="sgfh-dot sgfh-vac"></i><span class="t">Vacances</span><b>'+nxH(vac)+' h</b></div>':''):'<div class="nx-empty">Aucune saisie.</div>')+'</div>'; }
const sgfhLegende=extra=>'<div class="sgfh-leg"><span><span class="sgfh-st ok">'+nxSvg('check')+'</span>approuvée</span><span><span class="sgfh-st ref">!</span>refusée</span><span><span class="sgfh-st cor">↺</span>corrigée</span>'
  +'<span><i class="sgfh-dot sgfh-vac"></i>vacances</span>'+(extra||'')+'</div>';
const SGFH_GESTES='<span class="g">Glisser sur une plage libre : nouvelle saisie · ⌥ + glisser : copier la saisie choisie · glisser une saisie : la déplacer · bord inférieur : sa fin · double-clic : modifier · clic droit : menu</span>';
/* habillage de la semaine dessinée par hsWeek : en-tête des jours, fonds, ligne de l'heure, saisies (couleurs, texte, couloirs) */
function sgfhHabiller(cal,D){ const head=cal.firstElementChild, sc=head&&head.nextElementSibling, grid=sc&&sc.firstElementChild; if(!grid) return;
  const cols=[...grid.children].filter(c=>c._d), byId=new Map(D.L.map(r=>[String(r.ID),r])), O=HS.o, PX=O.zoom?84:48, done=D.s&&D.s.TIMELOGCOMPLETEDDATE, auj=dayKey(new Date());
  const off=d=>(O.pub&&D.PH.has(diso(d)))||(O.sat&&d.getDay()===6)||(O.sun&&d.getDay()===0);
  const nh=h('div',{class:'sgfh-jours',style:{gridTemplateColumns:head.style.gridTemplateColumns}});
  nh.innerHTML='<div class="sgfh-sem"><b>S'+isoWeek(D.a)[1]+'</b><span>'+nxH(D.tot)+' h</span></div>'+cols.map(c=>{ const d=c._d, j=D.J.find(x=>x.k===dayKey(d))||{h:0,du:0,L:[]}, tag=done&&diso(d)<=String(done).slice(0,10), m=sgfhManque(D,j);
      return '<div class="'+(off(d)?'off ':'')+(j.auj?'auj':'')+'" title="'+nxE([dfr(diso(d)),j.fer,nxH(j.h)+' h saisies'+(j.du?' sur '+nxH(j.du)+' h prévues':''),tag?'Heures taguées (complètes)':''].filter(Boolean).join('\n'))+'">'
        +'<div class="j">'+JOURS[d.getDay()]+(tag?'<span class="sgfh-tag">'+nxSvg('check')+'</span>':'')+'</div><div class="n">'+d.getDate()+'</div>'
        +'<div class="h"><b>'+(j.h?nxH(j.h)+' h':m?'<span class="sgfh-neg">aucune</span>':'')+'</b><span>'+(j.du?'/ '+nxH(j.du):'')+'</span></div>'+sgfhJauge(j.h,j.du)
        +(j.fer&&O.pub?'<div class="fer">'+nxE(j.fer)+'</div>':'')+'</div>'; }).join('');
  head.replaceWith(nh); requestAnimationFrame(()=>{ nh.style.paddingRight=Math.max(0,sc.offsetWidth-sc.clientWidth)+'px'; });
  cols.forEach(c=>{ const d=c._d, k=dayKey(d); c.style.backgroundColor=k===auj?'#fffdf0':off(d)?'#f7f7f5':'#fff';
    if(k===auj){ const n=new Date(); c.append(h('div',{class:'sgfh-now',style:{top:((n.getHours()*60+n.getMinutes())*PX/60)+'px'}})); }
    const bl=[...c.children].filter(x=>x.classList.contains('tlb')), recs=bl.map(b=>byId.get(String(b.dataset.id))).filter(Boolean).sort((x,y)=>tlT1(x)-tlT1(y)), K=sgfhCouloirs(recs);
    bl.forEach(b=>{ const r=byId.get(String(b.dataset.id)); if(r) sgfhBloc(b,r,D,K.get(r.ID)||[0,1]); }); }); }
function sgfhBloc(b,r,D,[i,n]){ const O=HS.o, hol=!!r.ISHOLIDAY, c=hol?'#d7a13a':D.co.c(r.PROJECT_ID), ht=parseFloat(b.style.height)||0;
  b.classList.add('sgfh-b'); b.classList.toggle('sgfh-vac',hol); b.classList.toggle('verr',tlLocked(r)); b.classList.toggle('mini',ht<22);
  b.style.background=hol?'':sgfhTeinte(c); b.style.borderLeftColor=c;
  if(n>1){ b.style.left='calc('+(i/n*100)+'% + 1px)'; b.style.right='auto'; b.style.width='calc('+(100/n)+'% - 2px)'; }
  const rs=b.querySelector('.tlrs'); [...b.children].forEach(x=>{ if(x!==rs) x.remove(); });
  const num=hol?'Vacances':sgfhNum(r.PROJECT_ID), tit=hol?'':sgfhTit(r.PROJECT_ID), tps=sgfhHeures(r);
  const l1=O.projFirst?num:tps, l2=O.projFirst?tps:(hol?'':num+(tit?' '+tit:'')), l3=hol?'':[O.ph?sgfhPhase(r):'',O.act?sgfhAct(r):''].filter(Boolean).join(' · '), l4=O.com&&r.DESCRIPTION?sgfhTxt(r.DESCRIPTION):'';
  const box=h('div',{class:'sgfh-bc'}); box.innerHTML='<div class="t1"><b>'+nxE(l1)+'</b>'+sgfhBadge(r)+'<span class="d">'+nxH(r.TIMEPERIOD)+' h</span></div>'+[l2,l3,l4].filter(Boolean).map(x=>'<div class="tx">'+nxE(x)+'</div>').join('');
  b.insertBefore(box,rs||null); }
/* Journal : une carte par jour, pour l'information du collaborateur */
function sgfhEntree(D,r){ const c=r.ISHOLIDAY?'#d7a13a':D.co.c(r.PROJECT_ID);
  return '<div class="sgfh-ent" data-fh="ed" data-id="'+r.ID+'" title="Modifier la saisie"><i class="k'+(r.ISHOLIDAY?' sgfh-vac':'')+'" style="background:'+c+'"></i><div class="a">'+(r.ISHOLIDAY?'Vacances':nxE(sgfhNum(r.PROJECT_ID))+'<span>'+nxE(sgfhTit(r.PROJECT_ID))+'</span>')+sgfhBadge(r)+'</div>'
    +'<div class="du">'+nxH(r.TIMEPERIOD)+' h<small>'+sgfhHeures(r)+'</small></div><div class="b">'+nxE(sgfhPhAct(r))+'</div>'+(r.DESCRIPTION?'<div class="c">'+nxE(r.DESCRIPTION)+'</div>':'')+'</div>'; }
function sgfhJournal(D){ const nomJ=d=>JOURS_L[d.getDay()].replace(/^./,x=>x.toUpperCase())+' '+d.getDate()+' '+MOISL[d.getMonth()].toLowerCase();
  return '<div class="sgfh-jr">'+D.J.filter(j=>HS.wk||j.ouvre||j.L.length).map(j=>{ const vide=!j.ouvre&&!j.L.length, m=sgfhManque(D,j);
    return '<div class="sgfh-jc'+(vide?' off':'')+(j.auj?' auj':'')+'"><div class="sgfh-jh">'+(vide?'':sgfhAnneau(j.h,j.du,40))+'<div><h3>'+nxE(nomJ(j.d))+'</h3><div class="s">'+nxE(j.fer||(j.auj?'aujourd’hui':vide?'week-end':''))+'</div></div>'
      +'<div class="r">'+(j.h||j.du?'<b>'+nxH(j.h)+' h</b><span class="s">/ '+nxH(j.du)+' h</span>':'')+'<button class="nx-btn sm" data-fh="new" data-d="'+j.iso+'" title="Nouvelle saisie ce jour">'+nxSvg('plus')+'</button></div></div>'
      +(m?'<div class="sgfh-man">Aucune saisie ce jour ouvré.</div>':'')+j.L.map(r=>sgfhEntree(D,r)).join('')+'</div>'; }).join('')+'</div>'; }
function sgfhResume(D){ const mx=Math.max(8.5,...D.J.map(j=>Math.max(j.h,j.du)));
  return '<div class="sgfh-big">'+sgfhAnneau(D.tot,D.duP,64)+'<div><div class="v">'+nxH(D.tot)+'<small> / '+nxH(D.duP)+' h</small></div><div class="t">'+nxE(D.duP?Math.round(D.tot/D.duP*100)+' % des heures prévues de la semaine':'')+'</div></div></div>'
    +'<div class="sgfh-h4">La semaine</div><div class="sgfh-wk">'+D.J.map(j=>{ const v=sgfhSomme(j.L.filter(r=>r.ISHOLIDAY));
        return '<div title="'+nxE(dfr(j.iso)+' : '+nxH(j.h)+' h')+'"><i style="height:'+((j.h-v)/mx*52)+'px"></i>'+(v?'<i class="v" style="height:'+(v/mx*52)+'px"></i>':'')+JOURS[j.d.getDay()]+'</div>'; }).join('')+'</div>'
    +sgfhRepartition(D,'Répartition de la semaine')+sgfhLegende(); }
/* la barre d'outils (#tools) revient à sa place, dans la barre du haut, avant tout changement d'écran */
function sgfhOutilsRendre(){ const tl=document.getElementById('tools'), bar=document.getElementById('bar'); document.documentElement.classList.remove('sgfh-on');
  if(tl&&bar&&tl.parentNode!==bar) bar.insertBefore(tl,bar.firstChild); }
/* la feuille d'heures : même vue du moteur (outils, rafraîchissement), nouveau rendu */
{ const V=VIEWS['h-saisie'], FH0={render:V.render,draw:V.draw,refresh:V.refresh,tools:V.tools};
  /* barre d'outils (24.10.2026, demande de Paulo) : sans Nouvelle saisie, Modifier, Supprimer, Approuver, Refuser, Réinitialiser — restent les gestes
     (glisser, double-clic, clic droit, Suppr) ; Fonctions tout à droite (CSS) ; l'archive garde la barre d'origine */
  V.tools=function(){ const G=FH0.tools.call(this)||[], obj=x=>x&&typeof x==='object'&&!(x instanceof Node);
    return G.filter(g=>!(Array.isArray(g)&&g.some(x=>obj(x)&&(x.i==='plus'||x.label==='Approuver')))); };
  V.render=function(m){ const sl=ch08bMyStaffs(); if(!ch08bIn(sl,HS.staff)) HS.staff=null; if(!HS.staff||!DS.get('staff',HS.staff)) HS.staff=(ME.staff||sl[0]||{}).ID;
    const w=h('div',{class:'sgfh'}); m.append(w); this._w=w;
    w.addEventListener('click',e=>{ const t=e.target.closest('[data-fh]'); if(!t||!w.contains(t)) return; const f=t.dataset.fh;
      if(f==='chg') popMenu(t,ch08bMyStaffs().map(s=>({t:staffName(s),chk:s.ID===HS.staff,fn:()=>{ HS.staff=s.ID; HS.sel=null; HS.selSet.clear(); try{ localStorage.setItem('ds_h_staff',s.ID); }catch(_){} setTools(this.tools()); this.draw(); }})));
      else if(f==='vue'){ SGFH.vue=t.dataset.k; nxLS.set('sg3_fh_vue',SGFH.vue); this.draw(); }
      else if(f==='ed'){ const r=DS.get('timelog',t.dataset.id); if(r) hsEdit(r); }
      else if(f==='new') hsEdit(null,{date:new Date(t.dataset.d+'T00:00')}); });
    this.draw(); };
  V.draw=function(){ const w=this._w; if(!w||!w.isConnected){ if(VIEW&&VIEW.id==='h-saisie-archive') VIEWS['h-saisie-archive'].draw(); return; }
    const D=sgfhDonnees(), jr=HS.mode==='sem'&&SGFH.vue==='journal', cal=h('div',{class:'sgfh-cal'+(jr?' jr':'')}), side=h('aside',{class:'sgfh-side'}), haut=h('div',{class:'sgfh-haut'});
    const tl=document.getElementById('tools'), ou=h('div',{class:'sgfh-outils'});
    haut.innerHTML=sgfhTete(D)+sgfhKpis(D); haut.append(ou); w.replaceChildren(haut,h('div',{class:'sgfh-corps'},cal,side));
    /* barre d'outils du moteur sous les chiffres (demande de Paulo) : l'élément #tools lui-même, rendu à la barre du haut en quittant l'écran */
    if(tl){ ou.append(tl); document.documentElement.classList.add('sgfh-on'); }
    if(jr) cal.innerHTML=sgfhJournal(D); else if(HS.mode==='sem'){ hsWeek(cal); sgfhHabiller(cal,D); } else hsMonth(cal);
    side.innerHTML=jr?sgfhResume(D):sgfhRepartition(D,D.mois?'Répartition du mois':'Répartition de la semaine')+sgfhLegende(D.mois?'':SGFH_GESTES); };
  /* Réglages ▸ Archives · Ancienne feuille d'heures : telle quelle (rendu d'origine du moteur) */
  VIEWS['h-saisie-archive']={tools(){ return FH0.tools.call(this); },render(m){ return FH0.render.call(this,m); },draw(){ return FH0.draw.call(this); },refresh(ts){ return FH0.refresh.call(this,ts); }};
  const R=SG_D.reglages; if(R&&!R.items.some(x=>x.v==='h-saisie-archive')){ const it={v:'h-saisie-archive',t:'Archives · Ancienne feuille d’heures',ico:'clock',d:'L’ancienne feuille d’heures (colonne des collaborateurs, agenda de 24 h, couleurs selon l’état), gardée pour un usage ultérieur.'};
    const i=R.items.findIndex(x=>x.v==='affd-controlling'); R.items.splice(i<0?R.items.length:i+1,0,it); NX_VIEW['h-saisie-archive']={d:R,t:it.t,it}; }
  /* dans l'archive, les boutons et menus du moteur qui rouvrent « h-saisie » restent dans l'archive ; sélection et clavier comme à l'origine */
  const g0=go; go=function(v,...a){ sgfhOutilsRendre(); return g0.call(this,SGFH.redir&&v==='h-saisie'&&VIEW&&VIEW.id==='h-saisie-archive'?'h-saisie-archive':v,...a); };
  document.addEventListener('click',e=>{ if(VIEW&&VIEW.id==='h-saisie-archive'&&e.target.closest('#tools,.menu')){ SGFH.redir=true; setTimeout(()=>{ SGFH.redir=false; },0); } },true);
  const hm0=hsMark; hsMark=function(){ hm0.apply(this,arguments); if(VIEW&&VIEW.id==='h-saisie-archive') setTools(VIEWS['h-saisie-archive'].tools()); };
  document.addEventListener('keydown',e=>{ if(!VIEW||VIEW.id!=='h-saisie-archive'||$('.ov')||e.target.closest('input,textarea,select')) return;
    if(e.key==='Delete'||e.key==='Backspace'){ if(HS.selSet.size){ e.preventDefault(); hsDelete(); } }
    else if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='a'){ e.preventDefault(); const [a,b]=hsRange(); hsSelect(hsEntries(a,b).map(r=>r.ID)); }
    else if(e.key==='Escape') hsSelect([]); }); }

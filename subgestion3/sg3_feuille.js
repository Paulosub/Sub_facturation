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
     jamais l'une sur l'autre ; répartition par projet à droite. Contenu d'une saisie dans un ordre fixe (même jour, demande de Paulo) : l'affaire
     en tête et en entier, puis les heures, la phase et les remarques (sgfhLignes) ; les réglages « Afficher les activités / phases /
     commentaires » et « Titre : … » ne s'appliquent plus et sont retirés du menu Fonctions.
   - Journal (semaine) : une carte par jour avec ses saisies, pour l'information du collaborateur ; un clic ouvre la fenêtre de saisie habituelle
     (hsEdit). Depuis le 24.10.2026 au soir (demande de Paulo « déplace le journal dans le menu de gauche ») : entrée Heures ▸ Journal, vue propre
     h-journal (la feuille d'heures n'a plus le choix Agenda | Journal) ; icônes des chiffres retirées (« supprime les logos de la feuille d'heures »).
   - L'ancienne feuille d'heures (Réglages ▸ Archives · Ancienne feuille d'heures, h-saisie-archive) a été supprimée définitivement le même soir
     (demande de Paulo) ; une session restée dessus rouvre la feuille d'heures. « Archives · Feuille d'heures » marqué F = l'ancien registre de
     Facturation, autre chose (gardé). ═══ */
const SGFH_PAL=['#003346','#4CBAB5','#3F4193','#98C21F','#D7860D','#636E7E','#8C6D4F','#B5446E'], SGFH_COL=new Map();
const SGFH={j:false};   /* j : clic dans la barre ou un menu du Journal — ses go('h-saisie') restent dans le Journal */
const sgfhEtat=r=>{ const v=+r.TIMELOGSTATECODE||0; return v===3?'ok':v===1?'ref':v===2?'cor':''; };
const sgfhBadge=r=>{ const e=sgfhEtat(r); return e==='ok'?'<span class="sgfh-st ok" title="Approuvée">'+nxSvg('check')+'</span>':e==='ref'?'<span class="sgfh-st ref" title="Refusée : à corriger">!</span>'
  :e==='cor'?'<span class="sgfh-st cor" title="Corrigée, à contrôler">↺</span>':''; };
const sgfhTxt=x=>String(x||'').replace(/\s+/g,' ').trim();
/* phase · phase partielle ; sgPhNom reçoit l'enregistrement (avec un simple nom, il rendait « Phase ») */
const sgfhPhase=r=>{ const f=o=>o?sgfhTxt(typeof sgPhNom==='function'?sgPhNom(o):nm(o)):'', a=f(DS.get('projectphase',r.PHASE_ID)), b=f(DS.get('projectsubphase',r.SUBPHASE_ID)); return [a,b&&b!==a?b:''].filter(Boolean).join(' · '); };
const sgfhAct=r=>sgfhTxt(nm(DS.get('projectactivity',r.ACTIVITY_ID)));
const sgfhPhAct=r=>{ const p=sgfhPhase(r), a=sgfhAct(r); return [p,a&&a!==p?a:''].filter(Boolean).join(' · '); };
const sgfhHeures=r=>hm(r.TIMEHOUR1||0,r.TIMEMINUTE1||0)+' – '+hm(Math.floor(tlT2(r)/60),tlT2(r)%60);
const sgfhNum=id=>{ const p=DS.get('project',id); return p?sgfhTxt(p.NUMBER):''; }, sgfhTit=id=>{ const p=DS.get('project',id); return p?sgfhTxt(p.TITLE):''; };
/* contenu d'une saisie, toujours dans cet ordre (demande de Paulo, 24.10.2026) : l'affaire en tête, les heures (de – à, durée), la phase, les
   remarques ; l'activité et l'état restent dans l'infobulle. Sert aussi à la fenêtre « Contrôler » (sg3_controle.js), par sgfhBloc. */
const sgfhLignes=r=>{ const hol=!!r.ISHOLIDAY, num=hol?'Vacances':sgfhNum(r.PROJECT_ID), tit=hol?'':sgfhTit(r.PROJECT_ID), tps=sgfhHeures(r), du=nxH(r.TIMEPERIOD)+' h',
    ph=hol?'':sgfhPhase(r), rq=sgfhTxt(r.DESCRIPTION);
  return {num,tit,tps,du,ph,rq,titre:[[num,tit].filter(Boolean).join(' '),tps+' · '+du,ph,hol?'':sgfhAct(r),rq,TSTATE[r.TIMELOGSTATECODE||0]].filter(Boolean).join('\n')}; };
/* réglages d'affichage qui ne s'appliquent plus (ordre fixe ci-dessus), retirés du menu Fonctions ; séparateurs en double retirés */
const SGFH_SANS=/^(Afficher les (activités|phases|commentaires)|Titre\s*:)/;
const sgfhMenuSans=L=>L.filter(x=>!(x&&typeof x==='object'&&SGFH_SANS.test(x.t||''))).filter((x,i,a)=>x!=='-'||(i>0&&i<a.length-1&&a[i-1]!=='-'));
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
/* saisies d'un collaborateur entre deux dates incluses (hsEntries du moteur, pour un autre collaborateur que celui de la feuille) */
const sgfhEntrees=(sid,a,b)=>{ const ka=dayKey(a), kb=dayKey(b); return DS.by('timelog','STAFF_ID',sid).filter(r=>{ const k=tlKey(r); return k>=ka&&k<=kb; }); };
/* période affichée (hsRange du moteur : semaine ou mois), jours, heures prévues (comme les Rapports de temps), écart jusqu'à hier, vacances ;
   o = fenêtre « Contrôler » (sg3_controle.js) : {staff, a, b, filtre (inscriptions retenues), O (réglages), prevues:false (ni heures prévues
   ni jours sans saisie signalés)} */
function sgfhDonnees(o){ o=o||{}; const s=DS.get('staff',o.a?o.staff:HS.staff), [a,b]=o.a?[o.a,o.b]:hsRange(), mois=!o.a&&HS.mode!=='sem';
  const L=!s?[]:o.a?sgfhEntrees(s.ID,a,b).filter(o.filtre||Boolean):hsEntries(a,b);
  const [,w]=isoWeek(a), lib=mois?MOISL[a.getMonth()]+' '+a.getFullYear():'Semaine '+w+' · '+a.getDate()+(a.getMonth()!==b.getMonth()?' '+MOIS[a.getMonth()]:'')+' – '+b.getDate()+' '+MOIS[b.getMonth()]+' '+b.getFullYear();
  const PH=new Map([...pubHolidays(a.getFullYear()),...pubHolidays(b.getFullYear())]), auj=dayKey(new Date()), M=s&&o.prevues!==false?hrMaps(s.ID,a,b):null, J=[];
  for(let x=new Date(a);x<=b;x.setDate(x.getDate()+1)){ const d=new Date(x), k=dayKey(d), Lj=L.filter(r=>tlKey(r)===k).sort((p,q)=>tlT1(p)-tlT1(q));
    J.push({d,k,iso:diso(d),L:Lj,h:sgfhSomme(Lj),du:M?M.sum(d,d).P:0,ouvre:isWorkDay(d,PH),fer:PH.get(diso(d))||'',passe:k<auj,auj:k===auj}); }
  const lim=new Date(); lim.setHours(0,0,0,0); const fin=b<lim?b:new Date(lim.getTime()-864e5);
  return {s,a,b,mois,lib,L,J,PH,tot:sgfhSomme(L),du:M&&fin>=a?M.sum(a,fin).P:0,duP:M?M.sum(a,b).P:0,hfin:J.filter(j=>j.d<=fin).reduce((t,j)=>t+j.h,0),
    vac:s&&typeof hrHoliday==='function'?hrHoliday(s,new Date(b.getFullYear(),0,1),b):null,co:sgfhCouleurs(L),O:o.O||HS.o,sansManque:o.prevues===false}; }
const sgfhManque=(D,j)=>!D.sansManque&&j.ouvre&&j.passe&&!j.L.length&&D.s&&(!D.s.JOININGDATE||String(D.s.JOININGDATE).slice(0,10)<=j.iso)&&!(D.s.QUITTINGDATE&&String(D.s.QUITTINGDATE).slice(0,10)<j.iso);
/* en-tête : le nom du collaborateur, puis la période ; chiffres de la période */
function sgfhTete(D,lb){ const s=D.s, sl=ch08bMyStaffs(), dt=x=>dfr(String(x).slice(0,10));
  const meta=[s&&s.JOININGDATE?'Au bureau depuis le '+dt(s.JOININGDATE):'',s&&s.TIMELOGCOMPLETEDDATE?'heures complètes jusqu’au '+dt(s.TIMELOGCOMPLETEDDATE):'heures pas encore taguées',
    s&&s.ISTIMELOGFROZEN&&s.TIMELOGFREEZINGDATE?'saisie bloquée jusqu’au '+dt(s.TIMELOGFREEZINGDATE):''].filter(Boolean).join(' · ');
  return '<div class="sgfh-tete"><div class="sgfh-id"><span class="sgfh-ini">'+nxE(s?sgtIni(s):'—')+'</span><div class="sgfh-nm"><div class="lb">'+nxE(lb||'Feuille d’heures')+'</div><h2>'+nxE(s?staffName(s):'Aucun collaborateur')
      +(sl.length>1?'<button class="sgfh-chg" data-fh="chg" title="Changer de collaborateur">'+nxSvg('fwd')+'</button>':'')+'</h2><div class="sgfh-meta">'+nxE(meta)+'</div></div></div>'
    +'<div class="sgfh-per"><span class="lbl">'+nxE(D.lib)+'</span></div></div>'; }
function sgfhKpis(D){ const ec=D.hfin-D.du, vac=D.vac?D.vac.saldo:null, per=D.mois?'du mois':'de la semaine';
  return '<div class="nx-kpis sgfh-kp">'
    +'<div class="nx-kpi" title="'+nxE('Heures saisies '+per+' : '+nxH(D.tot)+' h sur '+nxH(D.duP)+' h prévues')+'"><div class="l">Heures saisies</div><div class="v">'+nxH(D.tot)+'<small>h</small></div>'+sgfhJauge(D.tot,D.duP)+'</div>'
    +'<div class="nx-kpi" title="Heures prévues de la période : heures prévues du mois réparties sur ses jours ouvrés"><div class="l">Heures prévues</div><div class="v">'+nxH(D.duP)+'<small>h</small></div></div>'
    +'<div class="nx-kpi" title="Heures saisies jusqu’à hier − heures prévues jusqu’à hier"><div class="l">Écart à ce jour</div><div class="v '+(ec<-.25?'sgfh-neg':ec>.25?'sgfh-pos':'')+'">'+(D.du?(ec>0?'+':'')+nxH(ec)+'<small>h</small>':'—')+'</div></div>'
    +'<div class="nx-kpi" title="Solde de vacances de l’année (droit, report, vacances saisies)"><div class="l">Vacances restantes</div><div class="v">'+(vac!=null?nxH(vac)+'<small>h</small>':'—')+'</div></div>'
    +'<div class="nx-kpi" title="Projets sur lesquels des heures sont saisies dans la période"><div class="l">Projets</div><div class="v">'+D.co.ids.length+'</div></div></div>'; }
function sgfhRepartition(D,titre){ const ids=D.co.ids, mx=Math.max(1,...ids.map(id=>D.co.h.get(id))), vac=sgfhSomme(D.L.filter(r=>r.ISHOLIDAY));
  return '<div class="sgfh-h4">'+nxE(titre)+'</div><div class="sgfh-proj">'+(ids.length||vac?ids.map(id=>{ const c=D.co.c(id), hh=D.co.h.get(id);
      return '<div class="r" title="'+nxE(sgfhNum(id)+' '+sgfhTit(id))+'"><i class="sgfh-dot" style="background:'+c+'"></i><span class="t"><b>'+nxE(sgfhNum(id))+'</b> '+nxE(sgfhTit(id))+'</span><b>'+nxH(hh)+' h</b><div class="bar"><i style="width:'+(hh/mx*100)+'%;background:'+c+'"></i></div></div>'; }).join('')
    +(vac?'<div class="r"><i class="sgfh-dot sgfh-vac"></i><span class="t">Vacances</span><b>'+nxH(vac)+' h</b></div>':''):'<div class="nx-empty">Aucune saisie.</div>')+'</div>'; }
const sgfhLegende=extra=>'<div class="sgfh-leg"><span><span class="sgfh-st ok">'+nxSvg('check')+'</span>approuvée</span><span><span class="sgfh-st ref">!</span>refusée</span><span><span class="sgfh-st cor">↺</span>corrigée</span>'
  +'<span><i class="sgfh-dot sgfh-vac"></i>vacances</span>'+(extra||'')+'</div>';
const SGFH_GESTES='<span class="g">Glisser sur une plage libre : nouvelle saisie · ⌥ + glisser : copier la saisie choisie · glisser une saisie : la déplacer · bord inférieur : sa fin · double-clic : modifier · clic droit : menu et fonctions</span>';
/* habillage de la semaine dessinée par hsWeek : en-tête des jours, fonds, ligne de l'heure, saisies (couleurs, texte, couloirs) */
function sgfhHabiller(cal,D){ const head=cal.firstElementChild, sc=head&&head.nextElementSibling, grid=sc&&sc.firstElementChild; if(!grid) return;
  const cols=[...grid.children].filter(c=>c._d), byId=new Map(D.L.map(r=>[String(r.ID),r])), O=D.O||HS.o, PX=O.zoom?84:48, done=D.s&&D.s.TIMELOGCOMPLETEDDATE, auj=dayKey(new Date());
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
function sgfhBloc(b,r,D,[i,n]){ const hol=!!r.ISHOLIDAY, c=hol?'#d7a13a':D.co.c(r.PROJECT_ID), ht=parseFloat(b.style.height)||0;
  b.classList.add('sgfh-b'); b.classList.toggle('sgfh-vac',hol); b.classList.toggle('verr',tlLocked(r)); b.classList.toggle('mini',ht<22);
  b.style.background=hol?'':sgfhTeinte(c); b.style.borderLeftColor=c;
  if(n>1){ b.style.left='calc('+(i/n*100)+'% + 1px)'; b.style.right='auto'; b.style.width='calc('+(100/n)+'% - 2px)'; }
  const rs=b.querySelector('.tlrs'); [...b.children].forEach(x=>{ if(x!==rs) x.remove(); });
  /* l'affaire en tête et en entier (à la ligne si besoin, pastille d'état à sa gauche), puis les heures, la phase, les remarques */
  const L=sgfhLignes(r), box=h('div',{class:'sgfh-bc'});
  box.innerHTML='<div class="nom">'+sgfhBadge(r)+'<span class="nt"><b>'+nxE(L.num)+'</b>'+(L.tit?' '+nxE(L.tit):'')+'</span></div>'
    +'<div class="t1"><span>'+nxE(L.tps)+'</span><span class="d">'+nxE(L.du)+'</span></div>'+[L.ph,L.rq].filter(Boolean).map(x=>'<div class="tx">'+nxE(x)+'</div>').join('');
  b.title=L.titre; b.insertBefore(box,rs||null); }
/* Journal : une carte par jour, pour l'information du collaborateur */
function sgfhEntree(D,r){ const c=r.ISHOLIDAY?'#d7a13a':D.co.c(r.PROJECT_ID);
  return '<div class="sgfh-ent" data-fh="ed" data-id="'+r.ID+'" title="Modifier la saisie"><i class="k'+(r.ISHOLIDAY?' sgfh-vac':'')+'" style="background:'+c+'"></i><div class="a">'+sgfhBadge(r)+'<span class="nt">'+(r.ISHOLIDAY?'<b>Vacances</b>':'<b>'+nxE(sgfhNum(r.PROJECT_ID))+'</b> '+nxE(sgfhTit(r.PROJECT_ID)))+'</span></div>'
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
{ const V=VIEWS['h-saisie'], FH0={tools:V.tools};
  /* barre d'outils (24.10.2026, demandes de Paulo) : sans Nouvelle saisie, Modifier, Supprimer, Approuver, Refuser, Réinitialiser — restent les
     gestes (glisser, double-clic, clic droit, Suppr) — ni Fonctions, passé au clic droit (sgfhFonctions) */
  const obj=x=>x&&typeof x==='object'&&!(x instanceof Node);
  V.tools=function(){ const G=FH0.tools.call(this)||[];
    return G.filter(g=>!(Array.isArray(g)&&g.some(x=>obj(x)&&(x.i==='plus'||x.label==='Approuver'||x.i==='gear')))); };
  /* clic droit (même soir, Paulo : « supprimer les Fonctions et les ajouter au clic droit ») : les réglages du menu Fonctions du moteur, sans ceux qui
     ne s'appliquent plus (sgfhMenuSans) — en sous-menu « Fonctions » sur une saisie, tels quels ailleurs dans la feuille */
  const sgfhFonctions=()=>{ const g=(FH0.tools.call(V)||[]).flat().find(x=>obj(x)&&x.i==='gear'&&typeof x.menu==='function'); return g?sgfhMenuSans(g.menu()):[]; };
  const sousMenu={t:'Fonctions',sub:sgfhFonctions};
  V.render=function(m){ const sl=ch08bMyStaffs(); if(!ch08bIn(sl,HS.staff)) HS.staff=null; if(!HS.staff||!DS.get('staff',HS.staff)) HS.staff=(ME.staff||sl[0]||{}).ID;
    const w=h('div',{class:'sgfh'}); m.append(w); this._w=w;
    w.addEventListener('click',e=>{ const t=e.target.closest('[data-fh]'); if(!t||!w.contains(t)) return; const f=t.dataset.fh;
      if(f==='chg') popMenu(t,ch08bMyStaffs().map(s=>({t:staffName(s),chk:s.ID===HS.staff,fn:()=>{ HS.staff=s.ID; HS.sel=null; HS.selSet.clear(); try{ localStorage.setItem('ds_h_staff',s.ID); }catch(_){} setTools(this.tools()); this.draw(); }})));
      else if(f==='ed'){ const r=DS.get('timelog',t.dataset.id); if(r) hsEdit(r); }
      else if(f==='new') hsEdit(null,{date:new Date(t.dataset.d+'T00:00')}); });
    /* clic droit hors d'une saisie de l'agenda (celles-ci : menu du moteur, voir draw) : ligne du mois = mêmes actions qu'une saisie ; carte du
       Journal = modifier ; ailleurs = les fonctions */
    w.addEventListener('contextmenu',e=>{ const t=e.target; if(e.defaultPrevented||e.altKey||!t||t.nodeType!==1||t.closest('input,textarea,select,.tlb')) return;
      const tr=t.closest('table.g tbody tr[data-k]'), en=t.closest('.sgfh-ent[data-id]'); let L, ligne=null;
      if(tr){ if(!tr.classList.contains('on')) tr.click(); const r=DS.get('timelog',tr.dataset.k); ligne=tr.isConnected?tr:null;
        L=r?[{t:'Approuver',fn:()=>hsSetState(3)},{t:'Refuser',fn:()=>hsSetState(1)},{t:'Réinitialiser',fn:()=>hsSetState(0)},'-',
          {t:tlLocked(r)?'Afficher l’inscription':'Editer l’inscription',fn:()=>hsEdit(r)},{t:'Supprimer',fn:()=>hsDelete()},'-',sousMenu]:sgfhFonctions();
        if(ligne) L=[...L,'-',...sgCtxCopie(ligne)]; }
      else if(en){ const r=DS.get('timelog',en.dataset.id); ligne=en; L=r?[{t:tlLocked(r)?'Afficher l’inscription':'Editer l’inscription',fn:()=>hsEdit(r)},'-',sousMenu]:sgfhFonctions(); }
      else L=sgfhFonctions();
      e.preventDefault(); sgMenuAt(e.clientX,e.clientY,L,ligne); });
    this.draw(); };
  V.draw=function(){ const w=this._w; if(!w||!w.isConnected) return; if(this.journal) HS.mode='sem';   /* le Journal est hebdomadaire */
    const D=sgfhDonnees(), jr=!!this.journal, cal=h('div',{class:'sgfh-cal'+(jr?' jr':'')}), side=h('aside',{class:'sgfh-side'}), haut=h('div',{class:'sgfh-haut'});
    const tl=document.getElementById('tools'), ou=h('div',{class:'sgfh-outils'});
    haut.innerHTML=sgfhTete(D,jr?'Journal des heures':'Feuille d’heures')+sgfhKpis(D); haut.append(ou); w.replaceChildren(haut,h('div',{class:'sgfh-corps'},cal,side));
    /* barre d'outils du moteur sous les chiffres (demande de Paulo) : l'élément #tools lui-même, rendu à la barre du haut en quittant l'écran */
    if(tl){ ou.append(tl); document.documentElement.classList.add('sgfh-on'); }
    if(jr) cal.innerHTML=sgfhJournal(D); else if(HS.mode==='sem'){ hsWeek(cal); sgfhHabiller(cal,D);
      /* clic droit sur une saisie : le menu du moteur (sélection, Approuver, Refuser, Réinitialiser, Editer, Supprimer) + « Fonctions » */
      cal.querySelectorAll('.tlb').forEach(b=>{ const c0=b.oncontextmenu; if(typeof c0!=='function') return;
        b.oncontextmenu=e=>{ const p0=popMenu; popMenu=(a,items)=>sgMenuAt(a.x,a.y,[...items,'-',sousMenu]); try{ return c0.call(b,e); } finally{ popMenu=p0; } }; }); }
    else hsMonth(cal);
    side.innerHTML=jr?sgfhResume(D):sgfhRepartition(D,D.mois?'Répartition du mois':'Répartition de la semaine')+sgfhLegende(D.mois?'':SGFH_GESTES); };
  /* Heures ▸ Journal (24.10.2026 au soir, demande de Paulo « déplace le journal dans le menu de gauche ») : même vue que la feuille (rendu, gestes,
     rafraîchissement du moteur, clic droit), en cartes par jour ; barre sans Semaine | Mois (le Journal est hebdomadaire) */
  const J=VIEWS['h-journal']=Object.create(V); J.journal=true;
  J.tools=function(){ return V.tools.call(this).filter(g=>!(Array.isArray(g)&&g.length===1&&g[0]&&g[0].nodeType===1&&/Semaine/.test(g[0].textContent)&&/Mois/.test(g[0].textContent))); };
  J.render=function(m){ HS.mode='sem'; return V.render.call(this,m); };
  /* les boutons de la barre et les menus du moteur rouvrent « h-saisie » (go) : dans le Journal, ils y restent */
  document.addEventListener('click',e=>{ if(VIEW&&VIEW.id==='h-journal'&&e.target.closest('#tools,.menu')){ SGFH.j=true; setTimeout(()=>{ SGFH.j=false; },0); } },true);
  /* avant tout changement d'écran, la barre d'outils revient à sa place ; l'ancienne feuille d'heures (h-saisie-archive), supprimée le 24.10.2026,
     rouvre la feuille d'heures (session, récents) */
  const g0=go; go=function(v,...a){ sgfhOutilsRendre(); return g0.call(this,v==='h-saisie-archive'?'h-saisie':v==='h-saisie'&&SGFH.j&&VIEW&&VIEW.id==='h-journal'?'h-journal':v,...a); }; }

/* ═══ Notes de frais ▸ Notes de frais : choix du collaborateur au graphisme de la feuille d'heures (25.11.2026) ═══
   Demande de Paulo (chapitre Notes de frais, même jour) : « reprends le design du reste de l'app pour la sélection des collaborateurs ». L'écran du moteur
   (VIEWS.frais : barre, tableau, totaux, gestes, droits) est gardé tel quel ; sa colonne des collaborateurs est masquée et remplacée par l'en-tête de la feuille
   d'heures : bandeau jaune au nom du collaborateur (initiales en grand, trait, ▾ = changer de collaborateur parmi ch08bMyStaffs, comme la feuille d'heures),
   au bureau depuis, notes et montant de l'année, mois affiché à droite ; puis les chiffres du mois. Barre du haut (#nx-sub, « Fiche membre ») masquée comme
   dans la feuille d'heures (html.sgfh-on, retiré par l'enveloppe de go ci-dessus). Chiffres tenus à jour à chaque dessin du moteur (changement de mois,
   d'année, de collaborateur, saisie : observateur des totaux).
   Zone de travail redessinée le même jour (proposition 1 « Épurée », voir plus bas). */
{ const V=VIEWS['frais']; if(V&&typeof V.render==='function'&&typeof NF!=='undefined'){ const R0=V.render;
  const ch=v=>num(v)+'<small>CHF</small>', dt=x=>dfr(String(x).slice(0,10));
  const tete=()=>{ const s=DS.get('staff',NF.staff), sl=ch08bMyStaffs(), an=DS.by('projectcost','STAFF_ID',NF.staff).filter(r=>r.DATEYEAR===NF.y), ta=an.reduce((a,r)=>a+pcAmount(r),0);
    const meta=[s&&s.JOININGDATE?'Au bureau depuis le '+dt(s.JOININGDATE):'',s&&s.QUITTINGDATE?'a quitté le bureau le '+dt(s.QUITTINGDATE):'',
      an.length?an.length+' note'+(an.length>1?'s':'')+' · '+num(ta)+' CHF en '+NF.y:'aucune note en '+NF.y].filter(Boolean).join(' · ');
    return '<div class="sgfh-tete"><div class="sgfh-id"><span class="sgfh-ini">'+nxE(s?sgtIni(s):'—')+'</span><div class="sgfh-nm"><div class="lb">Notes de frais</div><h2>'+nxE(s?staffName(s):'Aucun collaborateur')
        +(sl.length>1?'<button class="sgfh-chg" data-nf="chg" title="Changer de collaborateur">'+nxSvg('fwd')+'</button>':'')+'</h2><div class="sgfh-meta">'+nxE(meta)+'</div></div></div>'
      +'<div class="sgfh-per"><span class="lbl">'+nxE(MOISL[NF.m]+' '+NF.y)+'</span></div></div>'; };
  const chiffres=()=>{ const L=DS.by('projectcost','STAFF_ID',NF.staff).filter(r=>r.DATEYEAR===NF.y&&r.DATEMONTH===NF.m), T=nfTotals(L), st=r=>+r.PROJECTCOSTSTATECODE||0;
    const ctl=L.filter(r=>st(r)===0||st(r)===2).length, ref=L.filter(r=>st(r)===1).length, k=(l,v,s,c,ti)=>'<div class="nx-kpi"'+(ti?' title="'+nxE(ti)+'"':'')+'><div class="l">'+l+'</div><div class="v'+(c?' '+c:'')+'">'+v+'</div>'+(s?'<div class="s">'+s+'</div>':'')+'</div>';
    return '<div class="nx-kpis sgfh-kp">'+k('Frais du mois',ch(T.tot),L.length+' note'+(L.length>1?'s':''))+k('Facturables',ch(T.fac),T.tot?Math.round(T.fac/T.tot*100)+' % du montant':'')
      +k('Remboursables',ch(T.rem),T.ris?'dont '+num(T.ris)+' CHF ristournés':'au collaborateur')+k('À contrôler',String(ctl),'','','Notes de frais saisies ou corrigées, pas encore approuvées')
      +k('Refusées',String(ref),ref?'à corriger':'',ref?'sgfh-neg':'')+'</div>'; };
  /* ── zone de travail « épurée » (25.11.2026, proposition 1 choisie par Paulo parmi 5 — maquette subgestion3/_backup_20261125_maquette_notes_de_frais/) :
     présentation du devis et du contrôle des coûts. Une seule barre en texte (mois ‹ ›, actions, Présentation ▾, Imprimer ; Fonctions ▾ à droite), tableau à titres
     gris sur filet noir (affaire et genre de frais en entier, statut en pastille), totaux sous la colonne Montant, le tableau s'arrête à la dernière note.
     L'écran du moteur reste dessiné dessous, masqué (son dessin tient l'en-tête et la zone à jour) ; mêmes actions que lui (editCost, mêmes règles de
     duplication, de suppression et de statut). Colonnes : catalogue « notesfrais » du bloc 57 (Présentation ▾ ; remplace « Colonnes supplémentaires »). ── */
  const U={sel:new Set(),der:null,cle:''}, st=r=>+r.PROJECTCOSTSTATECODE||0, prj=r=>DS.get('project',r.PROJECT_ID)||{};
  const nomT=(t,id)=>{ try{ return nm(DS.get(t,id))||''; }catch(_){ return ''; } };
  const genre=r=>nomT('projectcostcategory',r.COSTCATEGORY_ID), groupe=r=>nomT('projectcostcategorygroup',r.COSTCATEGORYGROUP_ID);
  const pl=(n,x)=>n+' '+x+(n>1?'s':''), E=nxE;
  const pas=r=>{ const s=st(r); return s===3?'<span class="sgfh-st ok">'+nxSvg('check')+'</span>':s===1?'<span class="sgfh-st ref">!</span>':s===2?'<span class="sgfh-st cor">↺</span>':'<span class="sgfh-st sgc-st0"></span>'; };
  const oui=v=>v?'<span class="sgnf-ok">'+nxSvg('check')+'</span>':'<span class="sgnf-non">—</span>';
  const lignes=()=>DS.by('projectcost','STAFF_ID',NF.staff).filter(r=>r.DATEYEAR===NF.y&&r.DATEMONTH===NF.m).sort((a,b)=>pcDate(a)-pcDate(b)||cmp(a.ID,b.ID));
  const choisies=()=>[...U.sel].map(id=>DS.get('projectcost',id)).filter(r=>r&&r.STAFF_ID===NF.staff&&r.DATEYEAR===NF.y&&r.DATEMONTH===NF.m);
  const STD=['date','aff','frais','qte','desc','piece','etat','fact','remb','montant'];
  const CAT={
    date:{t:'Date',cat:'Note de frais',nw:1,v:r=>dfr(diso(pcDate(r)))},
    aff:{t:'Affaire',l:'Affaire (numéro et désignation)',cat:'Affaire',w:210,f:r=>'<b class="n">'+E(prj(r).NUMBER||'')+'</b><small>'+E(prj(r).TITLE||'')+'</small>',v:r=>[prj(r).NUMBER,prj(r).TITLE].filter(Boolean).join(' ')},
    affn:{t:'N° affaire',l:'Numéro de l’affaire',cat:'Affaire',nw:1,v:r=>prj(r).NUMBER||''},
    afft:{t:'Désignation de l’affaire',cat:'Affaire',v:r=>prj(r).TITLE||''},
    ouv:{t:'Ouvrage',cat:'Affaire',nw:1,v:r=>(DS.get('subproject',r.SUBPROJECT_ID)||{}).CODE||''},
    phase:{t:'Phase',cat:'Affaire',v:r=>nomT('projectphase',r.PHASE_ID)},
    sphase:{t:'Phase partielle',cat:'Affaire',v:r=>nomT('projectsubphase',r.SUBPHASE_ID)},
    frais:{t:'Frais',l:'Genre de frais (et son groupe)',cat:'Note de frais',w:175,f:r=>'<b>'+E(genre(r))+'</b><small>'+E(groupe(r))+'</small>',v:r=>[groupe(r),genre(r)].filter(Boolean).join(' › ')},
    genre:{t:'Genre de frais',cat:'Note de frais',v:genre},
    grp:{t:'Groupe de frais',cat:'Note de frais',v:groupe},
    desc:{t:'Désignation',cat:'Note de frais',w:170,v:r=>r.DESCRIPTION||''},
    piece:{t:'N° pièce',cat:'Note de frais',nw:1,v:r=>r.DOCUMENTNUMBER||''},
    qte:{t:'Quantité',cat:'Montants',r:1,nw:1,v:r=>+r.QUANTITY?num(+r.QUANTITY)+(r.UNIT?' '+r.UNIT:''):''},
    unite:{t:'Unité',cat:'Montants',nw:1,v:r=>r.UNIT||''},
    pu:{t:'Prix unitaire',cat:'Montants',r:1,nw:1,v:r=>r.UNITPRICE==null||r.UNITPRICE===''?'':num(+r.UNITPRICE)},
    tva:{t:'Taux TVA',cat:'Montants',r:1,nw:1,v:r=>r.VATRATE==null||r.VATRATE===''?'':num(+r.VATRATE,1)+' %'},
    devise:{t:'Monnaie',l:'Monnaie (étrangère : avec le cours)',cat:'Montants',nw:1,v:r=>r.FOREIGNCURRENCYCODE?r.FOREIGNCURRENCYCODE+(r.FOREIGNCURRENCYRATE?' · cours '+r.FOREIGNCURRENCYRATE:''):'CHF'},
    montant:{t:'Montant CHF',cat:'Montants',r:1,nw:1,f:r=>'<b>'+num(pcAmount(r))+'</b>',v:r=>num(pcAmount(r)),sum:L=>num(L.reduce((a,r)=>a+pcAmount(r),0))},
    etat:{t:'Statut',cat:'Contrôle',nw:1,f:r=>'<span class="sgnf-st s'+st(r)+'">'+pas(r)+'<span>'+E(TSTATE[st(r)]||'')+'</span></span>',v:r=>TSTATE[st(r)]||''},
    fact:{t:'Facturable',cat:'Facturation',c:1,f:r=>oui(r.ISCHARGEABLE),v:r=>r.ISCHARGEABLE?'Oui':'Non'},
    facture:{t:'Facturé',cat:'Facturation',c:1,f:r=>oui(r.ISCHARGED),v:r=>r.ISCHARGED?'Oui':'Non'},
    factle:{t:'Facturé le',cat:'Facturation',nw:1,v:r=>r.CHARGEDDATE?dfr(String(r.CHARGEDDATE).slice(0,10)):''},
    remb:{t:'Remboursable',th:'Rembours.',l:'Remboursable au collaborateur',cat:'Remboursement',c:1,f:r=>oui(r.ISREFUNDABLE)+(r.ISREFUNDABLE&&r.ISREFUNDED?'<small>ristourné</small>':''),v:r=>r.ISREFUNDABLE?(r.ISREFUNDED?'Oui · ristourné':'Oui'):'Non'},
    risto:{t:'Ristourné',l:'Ristourné (remboursé au collaborateur)',cat:'Remboursement',c:1,f:r=>oui(r.ISREFUNDED),v:r=>r.ISREFUNDED?'Oui':'Non'}};
  const catalogue=()=>{ if(typeof SGTAB!=='undefined'&&!SGTAB.def.notesfrais&&typeof sgtabDef==='function') sgtabDef('notesfrais',{titre:'Notes de frais',std:STD,cat:CAT}); };
  const colonnes=()=>{ catalogue(); return typeof SGTAB!=='undefined'&&SGTAB.def.notesfrais?sgtabCols('notesfrais'):STD.map(k=>Object.assign({k},CAT[k])); };
  const cellules=(cols,r)=>typeof sgtabCellules==='function'?sgtabCellules(cols,r,null):cols.map(c=>'<td>'+(c.f?c.f(r):E(c.v(r)))+'</td>').join('');
  const entete=cols=>typeof sgtabEntete==='function'?sgtabEntete(cols):'<tr>'+cols.map(c=>'<th>'+E(c.th||c.t)+'</th>').join('')+'</tr>';
  const bt=(a,t,o)=>'<button class="sgnf-b'+(o&&o.c?' '+o.c:'')+'" data-nfa="'+a+'"'+(o&&o.dis?' disabled':'')+(o&&o.ti?' title="'+E(o.ti)+'"':'')+'>'+(o&&o.i?nxSvg(o.i):'')+(t?'<span>'+t+'</span>':'')+'</button>';
  const sep='<span class="sgnf-sep"></span>';
  const barre=L=>{ const n=choisies().length, pres=typeof SGTAB!=='undefined';
    return '<div class="sgnf-bar">'+bt('prev','',{i:'prev',c:'ic',ti:'Mois précédent'})+bt('mois',E(MOISL[NF.m]+' '+NF.y)+' ▾',{c:'sgnf-per',ti:'Choisir le mois'})+bt('next','',{i:'next',c:'ic',ti:'Mois suivant'})
      +bt('auj','Ce mois',{ti:'Revenir au mois en cours'})+sep+bt('new','Nouvelle note',{i:'plus',ti:'Créer une nouvelle note de frais'})+bt('dup','Dupliquer ▾',{i:'dup',dis:!n})
      +bt('edit','Modifier',{i:'edit',dis:n!==1,ti:'Modifier la note de frais (double-clic)'})+bt('del','Supprimer',{i:'minus',dis:!n,c:'rg'})
      +sep+bt('s3','Approuver',{dis:!n})+bt('s1','Refuser',{dis:!n})+bt('s0','Réinitialiser',{dis:!n})
      +(pres?sep+bt('pres','Présentation ▾',{i:'list',ti:'Colonnes du tableau : Standard, présentations enregistrées, Personnalisé …'})+bt('imp','Imprimer',{i:'print',dis:!L.length,ti:'Notes de frais du mois (PDF)'}):'')
      +'<span class="sgnf-fin"></span><span class="sgnf-nb">'+(n?pl(n,'choisie')+' sur ':'')+pl(L.length,'note')+'</span>'+bt('fn','Fonctions ▾')+'</div>'; };
  const tableau=(L,cols)=>{ const T=nfTotals(L), n=cols.length, iM=cols.findIndex(c=>c.k==='montant');
    const ligne=(cl,lib,v)=>iM<0?'<tr class="'+cl+'"><td colspan="'+n+'" class="lib g">'+lib+' : '+v+' CHF</td></tr>'
      :'<tr class="'+cl+'">'+(iM?'<td colspan="'+iM+'" class="lib">'+lib+'</td>':'')+'<td class="r">'+v+'</td>'+(n-iM-1?'<td colspan="'+(n-iM-1)+'"'+(iM?'':' class="lib g"')+'>'+(iM?'':lib)+'</td>':'')+'</tr>';
    return '<table class="nx-tbl sgtab-t sgnf-t"><thead>'+entete(cols)+'</thead><tbody>'
      +L.map(r=>'<tr data-nfid="'+E(r.ID)+'"'+(U.sel.has(r.ID)?' class="on"':'')+'>'+cellules(cols,r)+'</tr>').join('')+'</tbody><tfoot>'
      +ligne('t','Total du mois · '+pl(L.length,'note'),num(T.tot))+ligne('s','dont facturable',num(T.fac))
      +ligne('s','dont remboursable au collaborateur'+(T.ris?' · '+num(T.ris)+' déjà ristourné':''),num(T.rem))+'</tfoot></table>'; };
  const vide=()=>'<div class="sgnf-vide"><b>Aucune note de frais en '+E(MOISL[NF.m].toLowerCase()+' '+NF.y)+'.</b><span>Les frais du mois s’affichent ici dès la première saisie.</span>'
    +bt('new','Nouvelle note de frais',{i:'plus',c:'pri'})+'</div>';
  const dessinerZone=z=>{ const cle=NF.staff+'|'+NF.y+'|'+NF.m; if(cle!==U.cle){ U.cle=cle; U.sel.clear(); U.der=null; }
    const L=lignes(), ids=new Set(L.map(r=>r.ID)); [...U.sel].forEach(id=>{ if(!ids.has(id)) U.sel.delete(id); });
    const sc=z.scrollTop; z.innerHTML=barre(L)+(L.length?tableau(L,colonnes()):vide()); z.scrollTop=sc; };
  /* actions : celles de l'écran du moteur */
  const actions=(V0,z,maj)=>{
    const aller=(y,m)=>{ NF.y=y; NF.m=m; V0.draw(); maj(); };
    const pas1=k=>{ let m=NF.m+k, y=NF.y; if(m<0){ m=11; y--; } if(m>11){ m=0; y++; } aller(y,m); };
    const nouveau=()=>{ const t=new Date(); editCost(null,{staff:NF.staff,date:new Date(NF.y,NF.m,NF.y===t.getFullYear()&&NF.m===t.getMonth()?t.getDate():1)}); };
    const modifier=r=>{ r=r||(choisies().length===1?choisies()[0]:null); if(r) editCost(r,{staff:NF.staff}); };
    const etat=async v=>{ const rs=choisies(); if(!rs.length){ toast('Choisissez des notes de frais (Cmd-clic, Maj-clic).',true); return; }
      await DS.commit(rs.map(r=>({t:'projectcost',id:r.ID,val:{...r,PROJECTCOSTSTATECODE:v}}))); toast(pl(rs.length,'note')+' de frais : '+TSTATE[v]+'.'); };
    const dupliquer=async k=>{ const rs=choisies(); if(!rs.length) return; const ids=DS.newIds('projectcost',rs.length);
      await DS.commit(rs.map((r,i)=>{ const d=pcDate(r); d.setMonth(d.getMonth()+k); return {t:'projectcost',id:ids[i],val:{...r,ID:ids[i],DATEYEAR:d.getFullYear(),DATEMONTH:d.getMonth(),DATEDAY:d.getDate(),PROJECTCOSTSTATECODE:0,ISCHARGED:0,CHARGEDDATE:null,ISREFUNDED:0}}; }));
      toast(pl(rs.length,'note')+' de frais dupliquée'+(rs.length>1?'s':'')+(k?' dans le mois suivant':'')+'.'); if(k) pas1(1); };
    const supprimer=async()=>{ const rs=choisies(); if(!rs.length) return; if(rs.some(r=>st(r)===3||r.ISCHARGED)){ toast('Frais approuvé ou facturé : suppression impossible.',true); return; }
      if(await confirmDlg(rs.length>1?'Voulez-vous vraiment supprimer ces '+rs.length+' notes de frais ?':'Voulez-vous vraiment supprimer cette note de frais ?','Supprimer')){ await DS.commit(rs.map(r=>({t:'projectcost',id:r.ID,val:null}))); U.sel.clear(); } };
    const nomS=()=>{ const x=DS.get('staff',NF.staff); return x?staffName(x):''; };
    const imprimer=()=>{ const L=lignes(); if(typeof sgtabImprimer!=='function'||!L.length) return; colonnes();
      sgtabImprimer('notesfrais',L,null,{cle:'Liste · Notes de frais',titre:'Notes de frais',lb:'Notes de frais · Documents',type:'Notes de frais',sous:nomS()+' · '+MOISL[NF.m]+' '+NF.y,
        meta:[['Collaborateur',nomS()],['Mois',MOISL[NF.m]+' '+NF.y],['Notes',String(L.length)]],total:{lib:'Total'}}); };
    const fonctions=()=>{ const n=choisies().length; return [
      {t:'Marquer comme ristourné (remboursé)',dis:!n,fn:()=>DS.commit(choisies().filter(r=>r.ISREFUNDABLE).map(r=>({t:'projectcost',id:r.ID,val:{...r,ISREFUNDED:1}})))},
      {t:'Annuler « ristourné »',dis:!n,fn:()=>DS.commit(choisies().map(r=>({t:'projectcost',id:r.ID,val:{...r,ISREFUNDED:0}})))},'-',
      {t:'Copier le tableau dans le presse-papier',fn:()=>typeof sgtabCopie==='function'?sgtabCopie(z):toast('Copie indisponible.',true)},
      {t:'Exporter le tableau dans un fichier CSV …',fn:()=>{ colonnes(); if(typeof sgtabCsv==='function') sgtabCsv('notesfrais',lignes(),null,'Notes_de_frais_'+NF.y+'-'+String(NF.m+1).padStart(2,'0')); }},'-',
      {t:'Rapport mensuel …',fn:()=>{ NFR.staff=NF.staff; NFR.per='Mois'; NFR.y=NF.y; NFR.i=NF.m; go('frais-rapport'); }}]; };
    const ligne=r=>{ if(!U.sel.has(r.ID)){ U.sel.clear(); U.sel.add(r.ID); U.der=r.ID; dessinerZone(z); } const n=choisies().length; return [
      {t:'Modifier la note de frais …',dis:n!==1,fn:()=>modifier(r)},{t:'Dupliquer',fn:()=>dupliquer(0)},{t:'Dupliquer dans le mois suivant',fn:()=>dupliquer(1)},'-',
      {t:'Approuver',fn:()=>etat(3)},{t:'Refuser',fn:()=>etat(1)},{t:'Réinitialiser',fn:()=>etat(0)},'-',
      {t:'Marquer comme ristourné (remboursé)',fn:()=>DS.commit(choisies().filter(x=>x.ISREFUNDABLE).map(x=>({t:'projectcost',id:x.ID,val:{...x,ISREFUNDED:1}})))},'-',
      {t:'Supprimer …',danger:true,fn:supprimer}]; };
    const choisir=(id,ev)=>{ const L=lignes().map(r=>r.ID);
      if(ev&&ev.shiftKey&&U.der!=null&&L.includes(U.der)){ const a=L.indexOf(U.der), b=L.indexOf(id); L.slice(Math.min(a,b),Math.max(a,b)+1).forEach(x=>U.sel.add(x)); }
      else if(ev&&(ev.metaKey||ev.ctrlKey)){ U.sel.has(id)?U.sel.delete(id):U.sel.add(id); U.der=id; }
      else { U.sel.clear(); U.sel.add(id); U.der=id; }
      dessinerZone(z); };
    const idDe=el=>{ const v=el.dataset.nfid; return isNaN(+v)?v:+v; };
    z.addEventListener('click',ev=>{ const a=ev.target.closest('[data-nfa]'); if(a){ if(a.disabled) return; const k=a.dataset.nfa;
        if(k==='prev') pas1(-1); else if(k==='next') pas1(1); else if(k==='auj'){ const t=new Date(); aller(t.getFullYear(),t.getMonth()); }
        else if(k==='mois') popMenu(a,MOISL.map((x,i)=>({t:x+' '+NF.y,chk:i===NF.m,fn:()=>aller(NF.y,i)})));
        else if(k==='new') nouveau(); else if(k==='edit') modifier(); else if(k==='del') supprimer();
        else if(k==='dup') popMenu(a,[{t:'Dupliquer',fn:()=>dupliquer(0)},{t:'Dupliquer dans le mois suivant',fn:()=>dupliquer(1)}]);
        else if(k==='s3') etat(3); else if(k==='s1') etat(1); else if(k==='s0') etat(0);
        else if(k==='pres'&&typeof sgtabMenu==='function'){ colonnes(); sgtabMenu('notesfrais',a,()=>dessinerZone(z)); }
        else if(k==='imp') imprimer(); else if(k==='fn') popMenu(a,fonctions());
        return; }
      const l=ev.target.closest('tr[data-nfid]'); if(l){ choisir(idDe(l),ev); z.focus({preventScroll:true}); } });
    z.addEventListener('dblclick',ev=>{ const l=ev.target.closest('tr[data-nfid]'); if(!l) return; const r=DS.get('projectcost',idDe(l)); if(r) modifier(r); });
    z.addEventListener('contextmenu',ev=>{ const l=ev.target.closest('tr[data-nfid]'); if(!l||ev.altKey) return; const r=DS.get('projectcost',idDe(l)); if(!r) return;
      ev.preventDefault(); ev.stopPropagation(); sgMenuAt(ev.clientX,ev.clientY,ligne(r)); });
    /* clavier (zone active) : ↑ ↓ choisir, Entrée modifier, Suppr supprimer, Cmd-A tout choisir, Échap ne rien choisir */
    z.addEventListener('keydown',ev=>{ if(ev.target.closest('input,textarea,select,[contenteditable]')||document.querySelector('.ov')) return; const L=lignes(); if(!L.length) return;
      if(ev.key==='ArrowDown'||ev.key==='ArrowUp'){ ev.preventDefault(); const ids=L.map(r=>r.ID), i=ids.indexOf(U.der), k=i<0?(ev.key==='ArrowDown'?0:ids.length-1):Math.max(0,Math.min(ids.length-1,i+(ev.key==='ArrowDown'?1:-1)));
        choisir(ids[k],null); const tr=z.querySelector('tr[data-nfid="'+ids[k]+'"]'); if(tr) tr.scrollIntoView({block:'nearest'}); }
      else if(ev.key==='Enter'){ ev.preventDefault(); modifier(); }
      else if(ev.key==='Delete'||ev.key==='Backspace'){ ev.preventDefault(); supprimer(); }
      else if((ev.metaKey||ev.ctrlKey)&&ev.key.toLowerCase()==='a'){ ev.preventDefault(); L.forEach(r=>U.sel.add(r.ID)); dessinerZone(z); }
      else if(ev.key==='Escape'&&U.sel.size){ U.sel.clear(); dessinerZone(z); } }); };
  V.render=function(m){ R0.call(this,m); const cols=m.querySelector(':scope>.cols'); if(!cols) return; const R=cols.children[1];
    cols.style.display='none';   /* écran du moteur gardé dessous (son dessin tient la page à jour), plus affiché */
    const haut=h('div',{class:'sgnf-haut'}), z=h('div',{class:'sgnf-zone',tabindex:'0'}); m.insertBefore(haut,cols); m.append(z); document.documentElement.classList.add('sgfh-on');
    const maj=()=>{ if(haut.isConnected){ haut.innerHTML=tete()+chiffres(); dessinerZone(z); } }; maj();
    actions(this,z,maj);
    haut.addEventListener('click',e=>{ const b=e.target.closest('[data-nf="chg"]'); if(!b) return;
      popMenu(b,ch08bMyStaffs().map(s=>({t:staffName(s),chk:s.ID===NF.staff,fn:()=>{ NF.staff=s.ID; NF.g.selSet=new Set(); NF.g.sel=null; this.draw(); maj(); }}))); });
    /* le moteur redessine le tableau et ses totaux (mois, année, saisie, autre poste) : en-tête, chiffres et zone suivent */
    const foot=R&&R.lastElementChild; if(foot) new MutationObserver(maj).observe(foot,{childList:true,subtree:true}); };
} }

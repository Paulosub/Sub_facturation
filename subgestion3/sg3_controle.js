/* ═══ 26. Temps ▸ Contrôle des heures (24.10.2026) ═══════════════════════════════════════════════════════════════════════════════════════
   Demande de Paulo : « dans Temps, ajoute le contrôle des heures ». L'ancien logiciel contrôlait les heures affaire par affaire (Controlling ▸
   Contrôle des heures d'affaires, archivé le 23.10.2026) ; ici, semaine par semaine ou mois par mois, pour tout le bureau :
   - Par collaborateur : heures par jour (mois : par semaine), jours ouvrés sans saisie en rouge, jours fériés et week-ends sur fond gris,
     total, heures prévues à ce jour (comme les Rapports de temps : heures prévues du mois réparties sur ses jours ouvrés), écart, état des
     inscriptions. « Contrôler » ouvre la fenêtre de contrôle sur la semaine du collaborateur, toutes affaires
     (sgcFenetre, plus bas : choisir les inscriptions — clic, Cmd-clic, Maj-clic — puis Approuver, Refuser ou Réinitialiser ; double-clic =
     modifier l'inscription) ; « Approuver » valide d'un coup ses inscriptions à contrôler de la période (après confirmation).
   - Par projet : projets qui ont des heures dans la période, mêmes états ; « Contrôler » = la même fenêtre, limitée au projet.
   États (TIMELOGSTATECODE, TSTATE du moteur) : 0 Saisi et 2 Corrigé = à contrôler, 1 Refusé, 3 Approuvé (le collaborateur ne peut plus la
   modifier). Droits : comme le Controlling (chef de projet ou administrateur, heures « de ses projets » au moins) ; sans le droit « toutes les
   heures », seules les heures des projets visibles se contrôlent et les jours sans saisie ne sont pas signalés. Réglages de l'écran :
   sg3_controle {mode sem | mois, d date de référence, vue collab | projet}.
   Graphisme de la Feuille d'heures (même jour, demande de Paulo « corriger contrôle des heures pour correspondre à la feuille d'heures
   graphiquement ») : bandeau jaune (semaine ou mois en grand, « Tout le bureau », période, Par collaborateur | Par projet), chiffres de la
   période (heures saisies et jauge, prévues, écart à ce jour, à contrôler, refusées), barre d'outils du moteur sous les chiffres (#tools
   déplacé comme dans la Feuille d'heures, sgfhOutilsRendre ; Semaine | Mois, Aujourd'hui, ‹ période ›, Fonctions à droite : Tout approuver,
   CSV), jours en tête comme l'agenda (nom, date en grand), états en pastilles (✓ approuvée, ! refusée, ↺ corrigée), légende commune.
   Fenêtre « Contrôler » (même jour, demande de Paulo « reproduire le graphisme et l'organisation de la feuille d'heures, améliorer si
   nécessaire ») : sgcFenetre ci-dessous, à la place de la fenêtre du moteur (ctlTimeCheck, gardée telle quelle dans l'archive Controlling). ═══ */
const SGC_ETAT=r=>{ const v=+r.TIMELOGSTATECODE||0; return v===3?'ok':v===1?'ref':'ctl'; };
function sgcPeriode(st){ const d=st.d?new Date(st.d+'T00:00'):new Date(); d.setHours(0,0,0,0);
  if(st.mode==='mois'){ const a=new Date(d.getFullYear(),d.getMonth(),1), b=new Date(d.getFullYear(),d.getMonth()+1,0); return {a,b,lib:MOISL[a.getMonth()]+' '+a.getFullYear()}; }
  const a=mondayOf(d), b=new Date(a); b.setDate(b.getDate()+6); const [,w]=isoWeek(a);
  return {a,b,lib:'Semaine '+w+' · '+a.getDate()+(a.getMonth()!==b.getMonth()?' '+MOIS[a.getMonth()]:'')+' – '+b.getDate()+' '+MOIS[b.getMonth()]+' '+b.getFullYear()}; }
/* collaborateur engagé ce jour-là (date d'engagement et de départ ; sans date d'engagement : collaborateur actif) */
const sgcEngage=(s,iso)=>(s.JOININGDATE?String(s.JOININGDATE).slice(0,10)<=iso:+s.ISACTIVE!==0)&&!(s.QUITTINGDATE&&String(s.QUITTINGDATE).slice(0,10)<iso);
/* jours de la période : clé, date, ouvré (ni week-end ni férié), nom du férié, passé (avant aujourd'hui) */
function sgcJours(a,b){ const PH=new Map([...pubHolidays(a.getFullYear()),...pubHolidays(b.getFullYear())]), auj=dayKey(new Date()), J=[];
  for(let d=new Date(a);d<=b;d.setDate(d.getDate()+1)){ const x=new Date(d), k=dayKey(x); J.push({d:x,k,iso:diso(x),ouvre:isWorkDay(x,PH),ferie:PH.get(diso(x))||'',passe:k<auj,auj:k===auj}); }
  return J; }
const sgcCompte=L=>{ const c={h:0,v:0,n:L.length,ctl:0,ref:0,ok:0,cor:0,hctl:0}; L.forEach(r=>{ const t=+r.TIMEPERIOD||0, e=SGC_ETAT(r); c.h+=t; if(r.ISHOLIDAY) c.v+=t; c[e]++; if(e==='ctl') c.hctl+=t; if(+r.TIMELOGSTATECODE===2) c.cor++; }); return c; };
const SGC_OK='<span class="sgfh-st ok" title="Approuvée">'+nxSvg('check')+'</span>', SGC_REF='<span class="sgfh-st ref" title="Refusée">!</span>', SGC_COR='<span class="sgfh-st cor" title="Corrigée, à contrôler">↺</span>';
function sgcEtatHtml(c){ if(!c.n) return '<span class="sgc-e vide">—</span>';
  const p=[]; if(c.ctl) p.push('<span class="sgc-e ctl" title="Saisies ou corrigées, pas encore approuvées">'+(c.cor?SGC_COR:'')+c.ctl+' à contrôler</span>');
  if(c.ref) p.push('<span class="sgc-e ref" title="Refusées : à corriger par le collaborateur">'+SGC_REF+c.ref+' refusée'+(c.ref>1?'s':'')+'</span>');
  if(!c.ctl&&!c.ref) p.push('<span class="sgc-e ok">'+SGC_OK+'Approuvé</span>');
  return p.join(' '); }
/* ═══ Fenêtre « Contrôler » au graphisme et à l'organisation de la feuille d'heures (24.10.2026) ═══
   À gauche, les collaborateurs (initiales, heures de la semaine, à contrôler, refusées ; ⌥↑ ⌥↓). À droite, comme la feuille d'heures : en-tête
   jaune (collaborateur, semaine, heures saisies / prévues, à contrôler), barre (Aujourd'hui, semaines, année ; nombre choisi, Approuver,
   Refuser, Réinitialiser, Tout sélectionner ; Réglages), semaine habillée comme l'agenda (sgfhHabiller : jours, couleurs par projet, pastilles
   d'état, affaire en entier, heures, phase, remarques). Gestes de la fenêtre d'origine : clic = choisir, Cmd / Maj-clic = ajouter ou retirer,
   clic droit = Approuver / Refuser / Réinitialiser / Tout sélectionner / Modifier, double-clic = modifier (hsEdit), Cmd-A = tout ; seules les
   inscriptions contrôlables se choisissent (les autres, sur option, en gris). Réglages = ceux de la fenêtre d'origine (CTL_W.o, ds_ctw_opts).
   Par projet (p) : inscriptions du projet seulement, sans heures prévues ni jours sans saisie. Tenue à jour par DS.on (SGC_F). */
const SGC_F={cur:null};
DS.on(ts=>{ const F=SGC_F.cur; if(!F) return; if(!F.el.isConnected){ SGC_F.cur=null; return; }
  if(hit(ts,'timelog','staff')) setTimeout(()=>{ if(SGC_F.cur===F&&F.el.isConnected) F.dessiner(); },0); });
function sgcFenetre(p,o){ o=o||{}; const O=CTL_W.o, sl=p?ctlStaffs(p,'timelog'):(o.staffs||[]), own=r=>p?r.PROJECT_ID===p.ID:(!o.peut||o.peut(r)), prevues=!p&&!o.peut;
  if(!sl.length){ toast(p?'Aucun collaborateur n’a d’heures dans ce projet.':'Aucun collaborateur.',true); return; }
  const dd=o.date?String(o.date):'', W={staff:(sl.find(s=>s.ID===+o.staff)||(ME.staff&&sl.find(s=>s.ID===ME.staff.ID))||sl[0]).ID,
    d:dd?new Date(/^\d{4}-\d\d-\d\d$/.test(dd)?dd+'T00:00':dd):new Date(), sel:new Set(), E:[]};
  const lib=p?'Contrôle des heures · '+projLabel(p):(o.titre||'Contrôle des heures');
  const liste=h('div',{class:'sgc-fcols'}), droite=h('div',{class:'sgc-fdr'}), body=h('div',{class:'sgc-fen',tabindex:'-1'},liste,droite), pied=h('div',{class:'sgc-fpied'});
  const Dlg=dialog({title:lib,body,buttons:[{t:'Fermer',pri:true}]}), dlg=Dlg.bd.parentNode, ov=dlg.parentNode;
  dlg.classList.add('sgc-dlg'); dlg.querySelector('.ft').prepend(pied);
  let cal=null, barre=null;
  const marquer=()=>{ if(cal) cal.querySelectorAll('.tlb').forEach(b=>b.classList.toggle('sgc-on',!!b._own&&W.sel.has(String(b._r.ID)))); rendreBarre(); };
  const choisir=L=>{ W.sel.clear(); L.forEach(r=>W.sel.add(String(r.ID))); marquer(); };
  const etat=async v=>{ const rs=[...W.sel].map(id=>DS.get('timelog',id)).filter(r=>r&&own(r)); if(!rs.length){ toast('Choisissez des inscriptions (clic, Cmd-clic, Maj-clic).',true); return; }
    await DS.commit(rs.map(r=>({t:'timelog',id:r.ID,val:{...r,TIMELOGSTATECODE:v}}))); toast(rs.length+' inscription'+(rs.length>1?'s':'')+' : '+TSTATE[v].toLowerCase()+'.'); dessiner(); };
  const aller=d=>{ W.d=d; W.sel.clear(); dessiner(true); };
  const dec=n=>{ const x=new Date(W.d); x.setDate(x.getDate()+7*n); aller(x); }, an=n=>aller(new Date(W.d.getFullYear()+n,W.d.getMonth(),W.d.getDate()));
  const collab=n=>{ const j=sl.findIndex(s=>s.ID===W.staff)+n; if(j<0||j>=sl.length) return; W.staff=sl[j].ID; W.sel.clear(); dessiner(true); };
  const setO=(k,v)=>{ O[k]=v; try{ localStorage.setItem('ds_ctw_opts',JSON.stringify(O)); }catch(_){} dessiner(); };
  const rendreBarre=()=>{ if(!barre) return; const a=mondayOf(W.d), [,w]=isoWeek(a), n=W.sel.size, grp=(cls,...k)=>h('div',{class:'grp'+(cls?' '+cls:'')},...k.map(x=>x.nodeType?x:ibtn(x)));
    barre.replaceChildren(grp('',{i:'today',label:'Aujourd’hui',t:'Semaine en cours',fn:()=>aller(new Date())}),
      grp('',{i:'first',t:'Reculer de 4 semaines',fn:()=>dec(-4)},{i:'prev',t:'Semaine précédente',fn:()=>dec(-1)},h('span',{class:'lbl'},'Semaine '+w),{i:'next',t:'Semaine suivante',fn:()=>dec(1)},{i:'last',t:'Avancer de 4 semaines',fn:()=>dec(4)}),
      grp('',{i:'prev',t:'Année précédente',fn:()=>an(-1)},h('span',{class:'lbl an'},String(a.getFullYear())),{i:'next',t:'Année suivante',fn:()=>an(1)}),
      grp('act',h('span',{class:'nb'},n?n+' choisie'+(n>1?'s':''):'Aucune choisie'),{label:'Approuver',t:'Approuver les inscriptions choisies',dis:!n,fn:()=>etat(3)},
        {label:'Refuser',t:'Refuser les inscriptions choisies : le collaborateur doit les corriger',dis:!n,fn:()=>etat(1)},{label:'Réinitialiser',t:'Remettre les inscriptions choisies à « Saisi »',dis:!n,fn:()=>etat(0)},
        {label:'Tout sélectionner',t:'Choisir toutes les inscriptions contrôlables de la semaine (Cmd-A)',dis:!W.E.length,fn:()=>choisir(W.E)}),
      grp('',{i:'gear',label:'Réglages',t:'Réglages de la fenêtre',menu:()=>[{t:'Afficher les arrêts de travail',chk:O.brk,fn:()=>setO('brk',O.brk?0:1)},'-',
        {t:'Taguer les samedis',chk:O.sat,fn:()=>setO('sat',O.sat?0:1)},{t:'Taguer les dimanches',chk:O.sun,fn:()=>setO('sun',O.sun?0:1)},{t:'Taguer les jours fériés',chk:O.pub,fn:()=>setO('pub',O.pub?0:1)},
        {t:'Agrandir',chk:O.zoom,fn:()=>setO('zoom',O.zoom?0:1)},...(p||o.peut?['-',{t:p?'Afficher les saisies d’heure des autres affaires':'Afficher les saisies que vous ne contrôlez pas',chk:O.autres,fn:()=>setO('autres',O.autres?0:1)}]:[])]})); };
  /* la semaine : même construction que hsWeek du moteur (en-tête, gouttière des heures, colonnes c._d, inscriptions .tlb), puis habillée
     comme la feuille d'heures (sgfhHabiller) ; gestes du contrôle (pas de glisser : rien ne se déplace ici) */
  const dessiner=haut=>{ if(!ov.isConnected) return;
    const s=DS.get('staff',W.staff), a=mondayOf(W.d), b=new Date(a); b.setDate(b.getDate()+6);
    const tous=s?sgfhEntrees(s.ID,a,b):[], E=tous.filter(own), X=O.autres?tous.filter(r=>!own(r)):[], c=sgcCompte(E), PX=O.zoom?84:48, gut=64;
    W.E=E; [...W.sel].forEach(id=>{ if(!E.some(r=>String(r.ID)===id)) W.sel.delete(id); });
    const sc0=cal&&cal.querySelector('.sgc-fsc'), y0=!haut&&sc0?sc0.scrollTop:null, D=sgfhDonnees({staff:W.staff,a,b,filtre:own,O,prevues});
    liste.innerHTML='<div class="sgc-fch">'+nxE(p?'Collaborateurs du projet':'Collaborateurs')+'</div>'+sl.map(x=>{ const k=x.ID===W.staff?c:sgcCompte(sgfhEntrees(x.ID,a,b).filter(own));
      const det=[nxH(k.h)+' h',k.ctl?k.ctl+' à contrôler':'',k.ref?k.ref+' refusée'+(k.ref>1?'s':''):''].filter(Boolean).join(' · ');
      return '<button type="button" class="sgc-fcol'+(x.ID===W.staff?' on':'')+(sgcEngage(x,diso(a))||sgcEngage(x,diso(b))?'':' ancien')+'" data-s="'+x.ID+'" title="'+nxE(staffName(x))+'">'
        +'<span class="ini">'+nxE(sgtIni(x))+'</span><span class="nm"><b>'+nxE(staffName(x))+'</b><small'+(k.ctl?' class="ctl"':'')+'>'+nxE(det)+'</small></span></button>'; }).join('');
    const dt=x=>dfr(String(x).slice(0,10)), meta=s?[s.JOININGDATE?'Au bureau depuis le '+dt(s.JOININGDATE):'',s.TIMELOGCOMPLETEDDATE?'heures complètes jusqu’au '+dt(s.TIMELOGCOMPLETEDDATE):'heures pas encore taguées',
      s.ISTIMELOGFROZEN&&s.TIMELOGFREEZINGDATE?'saisie bloquée jusqu’au '+dt(s.TIMELOGFREEZINGDATE):''].filter(Boolean).join(' · '):'';
    const stat=[nxH(c.h)+' h'+(p?' sur ce projet':' saisies')+(D.duP?' sur '+nxH(D.duP)+' h prévues':''),c.ctl?c.ctl+' à contrôler':c.n?'tout est contrôlé':'',c.ref?c.ref+' refusée'+(c.ref>1?'s':''):''].filter(Boolean).join(' · ');
    const tete=h('div',{class:'sgfh-tete sgc-ftete',html:'<div class="sgfh-id"><span class="sgfh-ini">'+nxE(s?sgtIni(s):'—')+'</span><div class="sgfh-nm"><div class="lb">'+nxE(lib)+'</div><h2>'+nxE(s?staffName(s):'—')+'</h2>'
      +'<div class="sgfh-meta">'+nxE(meta)+'</div></div></div><div class="sgfh-per sgc-fper"><span class="lbl">'+nxE(D.lib)+'</span><span class="st">'+nxE(stat)+'</span></div>'});
    barre=h('div',{class:'sgc-fbarre'}); cal=h('div',{class:'sgfh-cal sgc-fcal'});
    const jours=[...Array(7)].map((_,i)=>{ const x=new Date(a); x.setDate(x.getDate()+i); return x; }), grille=h('div',{style:{display:'grid',gridTemplateColumns:gut+'px repeat(7,1fr)',position:'relative',height:(24*PX)+'px'}});
    const gouttiere=h('div',{style:{position:'relative'}}); for(let i=1;i<24;i++) gouttiere.append(h('div',{style:{position:'absolute',top:(i*PX-8)+'px',right:'8px',color:'#555'}},i+':00')); grille.append(gouttiere);
    const parJour={}; [...E,...X].forEach(r=>(parJour[tlKey(r)]=parJour[tlKey(r)]||[]).push(r));
    jours.forEach(x=>{ const col=h('div',{style:{position:'relative',borderLeft:'1px solid var(--line2)',background:'#fff',backgroundImage:'repeating-linear-gradient(to bottom,transparent 0,transparent '+(PX-1)+'px,#e4e4e4 '+(PX-1)+'px,#e4e4e4 '+PX+'px)'}});
      col._d=x; const Lj=(parJour[dayKey(x)]||[]).sort((q,r)=>tlT1(q)-tlT1(r));
      if(O.brk){ const Lp=Lj.filter(own); Lp.forEach((r,i)=>{ if(!i) return; const e0=tlT2(Lp[i-1]), s1=tlT1(r); if(s1>e0) col.append(h('div',{class:'sgc-brk',title:'Arrêt de travail '+nxH((s1-e0)/60)+' h',style:{top:(e0*PX/60)+'px',height:((s1-e0)*PX/60)+'px'}},'Arrêt '+nxH((s1-e0)/60)+' h')); }); }
      Lj.forEach(r=>{ const t1=tlT1(r), t2=tlT2(r), bl=h('div',{class:'tlb','data-id':r.ID,style:{position:'absolute',left:'1px',right:'1px',top:(t1*PX/60)+'px',height:Math.max(PX/4,(t2-t1)*PX/60-1)+'px',overflow:'hidden',userSelect:'none'}});
        bl._r=r; bl._own=own(r); col.append(bl); });
      col.onmousedown=e=>{ if(e.target===col&&!e.button&&!(e.metaKey||e.ctrlKey||e.shiftKey)){ W.sel.clear(); marquer(); } };
      col.oncontextmenu=e=>{ if(e.target!==col) return; e.preventDefault(); popMenu({x:e.clientX,y:e.clientY},[{t:'Tout sélectionner',dis:!W.E.length,fn:()=>choisir(W.E)}]); };
      grille.append(col); });
    cal.append(h('div',{style:{display:'grid',gridTemplateColumns:gut+'px repeat(7,1fr)'}}),h('div',{class:'sgc-fsc',style:{flex:1,minHeight:0,overflow:'auto',position:'relative'}},grille));
    droite.replaceChildren(tete,barre,cal);
    /* habillage : les inscriptions non contrôlables d'abord (en gris), puis la semaine comme la feuille d'heures */
    cal.querySelectorAll('.tlb').forEach(bl=>{ if(bl._own) return; sgfhBloc(bl,bl._r,{co:{c:()=>'#b9b9b6'}},[0,1]); bl.classList.add('sgc-autre'); bl.title='Non contrôlable ici\n'+bl.title; });
    sgfhHabiller(cal,D);
    cal.querySelectorAll('.tlb').forEach(bl=>{ if(!bl._own) return; const r=bl._r, k=String(r.ID);
      bl.onmousedown=e=>{ if(e.button) return; e.preventDefault(); if(e.metaKey||e.ctrlKey||e.shiftKey){ if(W.sel.has(k)) W.sel.delete(k); else W.sel.add(k); } else { W.sel.clear(); W.sel.add(k); } marquer(); };
      bl.oncontextmenu=e=>{ e.preventDefault(); e.stopPropagation(); if(!W.sel.has(k)){ W.sel.clear(); W.sel.add(k); marquer(); }
        popMenu({x:e.clientX,y:e.clientY},[{t:'Approuver',fn:()=>etat(3)},{t:'Refuser',fn:()=>etat(1)},{t:'Réinitialiser',fn:()=>etat(0)},'-',{t:'Tout sélectionner',fn:()=>choisir(W.E)},'-',{t:'Modifier l’inscription…',fn:()=>hsEdit(r)}]); };
      bl.ondblclick=e=>{ e.stopPropagation(); hsEdit(r); }; });
    marquer();
    pied.innerHTML=sgfhLegende('<span><span class="sgfh-st sgc-st0"></span>sans pastille : à contrôler</span>'+(X.length?'<span><i class="sgfh-dot sgc-dot-autre"></i>non contrôlable ici</span>':''))
      .replace('</div>','<span class="g">Clic : choisir · Cmd / Maj-clic : ajouter · clic droit : approuver, refuser… · double-clic : modifier · Cmd-A : tout · ⌥↑ ⌥↓ : collaborateur</span></div>');
    const sc=cal.querySelector('.sgc-fsc'), y=y0!=null?y0:Math.max(0,Math.min(E.length?Math.min(...E.map(tlT1))/60:7.5,7.5)-.5)*PX;
    sc.scrollTop=y; requestAnimationFrame(()=>{ sc.scrollTop=y; });
    const L=document.querySelectorAll('.ov'); if(L[L.length-1]===ov&&!body.contains(document.activeElement)) body.focus({preventScroll:true});
    const on=liste.querySelector('.on'); if(on) on.scrollIntoView({block:'nearest'}); };
  liste.addEventListener('click',e=>{ const t=e.target.closest('[data-s]'); if(!t) return; W.staff=+t.dataset.s; W.sel.clear(); dessiner(true); });
  body.addEventListener('keydown',e=>{ if(e.target.closest('input,textarea,select')) return;
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='a'){ e.preventDefault(); choisir(W.E); }
    else if(e.altKey&&(e.key==='ArrowUp'||e.key==='ArrowDown')){ e.preventDefault(); collab(e.key==='ArrowUp'?-1:1); } });
  SGC_F.cur={el:ov,dessiner:()=>dessiner()};
  dessiner(true); }
/* cellule d'un jour (ou d'une semaine du mois) : heures, état ; jour ouvré passé sans saisie = tiret rouge */
function sgcCellule(L,o){ const c=sgcCompte(L), cls=['sgc-j']; if(o.off) cls.push('off'); if(o.auj) cls.push('auj');
  if(!c.n){ if(o.man){ cls.push('man'); return '<td class="'+cls.join(' ')+'" title="'+nxE(o.manT||'Aucune saisie')+'"'+(o.go||'')+'>–</td>'; }
    return '<td class="'+cls.join(' ')+'"'+(o.titre?' title="'+nxE(o.titre)+'"':'')+(o.go||'')+'></td>'; }
  const e=c.ref?'ref':!c.ctl?'ok':'', vac=c.v&&c.v===c.h;
  if(e) cls.push(e); if(vac) cls.push('vac'); if(o.man) cls.push('man2');
  const t=[nxH(c.h)+' h'+(c.v&&!vac?' (dont '+nxH(c.v)+' h de vacances)':vac?' de vacances':''),c.ctl?c.ctl+' à contrôler':'',c.ref?c.ref+' refusée(s)':'',c.ok?c.ok+' approuvée(s)':'',o.titre||'',o.manT||''].filter(Boolean).join('\n');
  return '<td class="'+cls.join(' ')+'" title="'+nxE(t)+'"'+(o.go||'')+'>'+(vac?'<small>vac.</small> ':'')+nxH(c.h)+(e==='ok'?SGC_OK:e==='ref'?SGC_REF:c.cor?SGC_COR:'')+'</td>'; }
const sgcSt=()=>Object.assign({mode:'sem',d:'',vue:'collab'},nxLS.get('sg3_controle',{}));
const sgcDec=(st,P,n)=>{ const d=new Date(P.a); if(st.mode!=='mois') d.setDate(d.getDate()+7*n); else d.setMonth(d.getMonth()+n); return diso(d); };
VIEWS['nx-controle']={
  sv(o){ nxLS.set('sg3_controle',Object.assign(sgcSt(),o)); this.dessiner(); },
  /* barre d'outils du moteur (placée sous les chiffres par render) ; Fonctions : Tout approuver, CSV */
  tools(){ const st=sgcSt(), sem=st.mode!=='mois', P=sgcPeriode(st);
    const seg=h('div',{style:{display:'flex'}},ibtn({label:'Semaine',on:sem,fn:()=>this.sv({mode:'sem',d:diso(P.a)})}),ibtn({label:'Mois',on:!sem,fn:()=>this.sv({mode:'mois',d:diso(P.a)})}));
    return [[seg],[{i:'today',label:'Aujourd’hui',t:sem?'Cette semaine':'Ce mois',fn:()=>this.sv({d:''})}],
      [{i:'prev',t:sem?'Semaine précédente':'Mois précédent',fn:()=>this.sv({d:sgcDec(st,P,-1)})},h('span',{style:{alignSelf:'center',minWidth:'92px',textAlign:'center'}},sem?'Semaine '+isoWeek(P.a)[1]:MOISL[P.a.getMonth()]+' '+P.a.getFullYear()),
        {i:'next',t:sem?'Semaine suivante':'Mois suivant',fn:()=>this.sv({d:sgcDec(st,P,1)})}],
      [{i:'gear',label:'Fonctions',t:'Fonctions',menu:()=>{ const f=this._fn||{}, C=this._C||{};
        return [{t:'Tout approuver…',dis:!C.ctl,fn:()=>f.tout&&f.tout()},{t:'Exporter en CSV',fn:()=>f.csv&&f.csv()}]; }}]]; },
  render(m){ this._m=m; const st=sgcSt(), P=sgcPeriode(st), J=sgcJours(P.a,P.b), ka=dayKey(P.a), kb=dayKey(P.b);
    const tous=sgAdmin()||sgDroit('heures','toutes'), V=tous?null:new Set(sgProjetsVisibles().map(p=>p.ID)), peut=r=>!V||V.has(r.PROJECT_ID);
    const L=DS.all('timelog').filter(r=>{ const k=tlKey(r); return k>=ka&&k<=kb&&peut(r); }), C=sgcCompte(L); this._C=C;
    const parS=new Map(); L.forEach(r=>{ const k=r.STAFF_ID; if(!parS.has(k)) parS.set(k,[]); parS.get(k).push(r); });
    const S=DS.all('staff').filter(s=>parS.has(s.ID)||(tous&&J.some(j=>sgcEngage(s,j.iso)))).sort((x,y)=>cmp(staffName(x),staffName(y)));
    const auj=new Date(); auj.setHours(0,0,0,0); const fin=P.b<auj?P.b:new Date(auj.getFullYear(),auj.getMonth(),auj.getDate()-1), kf=dayKey(fin);
    const sem=st.mode!=='mois', W=[]; if(!sem){ for(let d=mondayOf(P.a);d<=P.b;d.setDate(d.getDate()+7)){ const x=new Date(d), [,w]=isoWeek(x), y=new Date(x); y.setDate(y.getDate()+6); W.push({a:x,b:y,w,da:x<P.a?new Date(P.a):x,db:y>P.b?new Date(P.b):y}); } }   /* da–db : jours de la semaine compris dans le mois */
    /* par collaborateur : saisies, jours, heures prévues (de la période et jusqu'à hier), saisies jusqu'à hier */
    const SS=new Map(); let pP=0, pT=0, hfT=0;
    S.forEach(s=>{ const Ls=parS.get(s.ID)||[], byK=new Map(); Ls.forEach(r=>{ const k=tlKey(r); if(!byK.has(k)) byK.set(k,[]); byK.get(k).push(r); });
      const M=hrMaps(s.ID,P.a,P.b), prev=fin>=P.a?M.sum(P.a,fin).P:0, pp=M.sum(P.a,P.b).P, hf=Ls.reduce((t,r)=>t+(tlKey(r)<=kf?+r.TIMEPERIOD||0:0),0);
      SS.set(s.ID,{Ls,c:sgcCompte(Ls),byK,prev,pp,hf}); pP+=pp; pT+=prev; hfT+=hf; });
    const ctrl=(sid,d)=>' data-fn="ctl" data-s="'+sid+'" data-d="'+diso(d)+'"';
    let corps='';
    if(st.vue!=='projet'){
      const tete='<tr><th>Collaborateur</th>'+(sem?J.map(j=>'<th class="sgc-j'+(!j.ouvre?' off':'')+(j.auj?' auj':'')+'"'+(j.ferie?' title="'+nxE(j.ferie)+'"':'')+'><span class="j">'+JOURS[j.d.getDay()]+'</span> <span class="n">'+j.d.getDate()+'</span></th>').join('')
          :W.map(x=>'<th class="sgc-j" title="'+nxE('Semaine '+x.w+' : du '+dfr(diso(x.da))+' au '+dfr(diso(x.db)))+'"><span class="j">S'+x.w+'</span> <span class="n s">'+x.da.getDate()+'.'+(x.da.getMonth()+1)+'</span></th>').join(''))
        +'<th class="r">Total</th><th class="r" title="Heures prévues jusqu’à hier (heures prévues du mois réparties sur ses jours ouvrés, comme les Rapports de temps)">Prévues</th>'
        +'<th class="r" title="Heures saisies jusqu’à hier − heures prévues jusqu’à hier">Écart</th><th>État</th><th class="sg-notri"></th></tr>';
      const tot={j:new Map(),h:0,p:0,hf:0}; let lignes='';
      S.forEach(s=>{ const X=SS.get(s.ID), Ls=X.Ls, c=X.c, byK=X.byK, prev=X.prev, hf=X.hf, ec=hf-prev;
        const man=j=>tous&&j.ouvre&&j.passe&&sgcEngage(s,j.iso)&&!byK.has(j.k);
        tot.h+=c.h; tot.p+=prev; tot.hf+=hf;
        const parti=+s.ISACTIVE===0||(s.QUITTINGDATE&&String(s.QUITTINGDATE).slice(0,10)<diso(auj));
        const tag=String(s.TIMELOGCOMPLETEDDATE||'').slice(0,10), gel=s.ISTIMELOGFROZEN?String(s.TIMELOGFREEZINGDATE||'').slice(0,10):'';   /* dates qui touchent la période affichée seulement */
        const info=[tag&&tag>=diso(P.a)?'complètes jusqu’au '+dfr(tag):'',gel&&gel>=diso(P.a)?'bloquées jusqu’au '+dfr(gel):'',parti?'a quitté le bureau':''].filter(Boolean).join(' · ');
        const cells=sem?J.map(j=>{ const Lj=byK.get(j.k)||[]; tot.j.set(j.k,(tot.j.get(j.k)||0)+Lj.reduce((t,r)=>t+(+r.TIMEPERIOD||0),0));
            return sgcCellule(Lj,{off:!j.ouvre,auj:j.auj,man:man(j),titre:j.ferie,go:ctrl(s.ID,j.d)}); }).join('')
          :W.map(x=>{ const ks=J.filter(j=>j.d>=x.a&&j.d<=x.b), Lw=ks.flatMap(j=>byK.get(j.k)||[]), mq=ks.filter(man);
              tot.j.set(x.w,(tot.j.get(x.w)||0)+Lw.reduce((t,r)=>t+(+r.TIMEPERIOD||0),0));
              return sgcCellule(Lw,{man:mq.length>0,manT:mq.length?mq.length+' jour'+(mq.length>1?'s':'')+' sans saisie : '+mq.map(j=>JOURS[j.d.getDay()].toLowerCase()+' '+dfr(j.iso)).join(', '):'',go:ctrl(s.ID,x.da)}); }).join('');
        lignes+='<tr'+(parti?' class="sgt-parti"':'')+'><td class="sgc-n" data-csv="'+nxE(staffName(s))+'"><div class="sgt-row"><span class="sgt-ini">'+nxE(sgtIni(s))+'</span><span class="sgt-nm"><b>'+nxE(staffName(s))+'</b>'+(info?'<small>'+nxE(info)+'</small>':'')+'</span></div></td>'
          +cells+'<td class="r"><b>'+nxH(c.h)+'</b></td><td class="r">'+(prev?nxH(prev):'—')+'</td><td class="r'+(prev&&ec<-.25?' sg-neg':'')+'"'+(prev?' title="'+nxE(nxH(hf)+' h saisies jusqu’à hier − '+nxH(prev)+' h prévues')+'"':'')+'>'+(prev?(ec>0?'+':'')+nxH(ec):'—')+'</td>'
          +'<td class="sgc-et">'+sgcEtatHtml(c)+'</td><td class="sgc-act"><button class="nx-btn sm"'+ctrl(s.ID,P.a)+' title="Ouvrir la semaine de '+nxE(staffName(s))+' pour approuver, refuser ou corriger ses inscriptions">'+nxSvg('cal')+'<span>Contrôler</span></button>'
          +'<button class="nx-btn sm" data-fn="app" data-s="'+s.ID+'"'+(c.ctl?'':' disabled')+' title="Approuver ses '+c.ctl+' inscription(s) à contrôler de la période">'+nxSvg('check')+'<span>Approuver</span></button></td></tr>'; });
      const pied='<tr class="tot"><td>Total</td>'+(sem?J.map(j=>'<td class="sgc-j'+(!j.ouvre?' off':'')+'">'+(tot.j.get(j.k)?nxH(tot.j.get(j.k)):'')+'</td>').join(''):W.map(x=>'<td class="sgc-j">'+(tot.j.get(x.w)?nxH(tot.j.get(x.w)):'')+'</td>').join(''))
        +'<td class="r">'+nxH(tot.h)+'</td><td class="r">'+(tot.p?nxH(tot.p):'—')+'</td><td class="r">'+(tot.p?((tot.hf-tot.p)>0?'+':'')+nxH(tot.hf-tot.p):'—')+'</td><td class="sgc-et">'+sgcEtatHtml(C)+'</td><td class="sgc-act"></td></tr>';
      corps=S.length?'<div class="sgc-tab"><table class="nx-tbl sgc-t" id="sgc-t">'+tete+lignes+pied+'</table></div>'
          +'<div class="sgfh-leg sgc-leg2"><span>'+SGC_OK+'approuvée</span><span>'+SGC_REF+'refusée</span><span>'+SGC_COR+'corrigée</span>'+(tous?'<span><b class="sgc-man">–</b>jour ouvré sans saisie</span>':'')
          +'<span><i class="sgc-pt off"></i>week-end, jour férié</span><span class="g">Un clic sur un jour ouvre la semaine du collaborateur pour approuver, refuser ou corriger ses inscriptions.</span></div>'
        :'<div class="nx-empty">Aucun collaborateur ni aucune heure sur cette période.</div>';
    } else {
      const parP=new Map(); L.forEach(r=>{ const k=r.PROJECT_ID; if(!parP.has(k)) parP.set(k,[]); parP.get(k).push(r); });
      const Ps=[...parP.keys()].map(id=>({p:DS.get('project',id),L:parP.get(id)})).filter(x=>x.p).map(x=>Object.assign(x,{c:sgcCompte(x.L)}))
        .sort((x,y)=>(y.c.ctl+y.c.ref)-(x.c.ctl+x.c.ref)||cmp(String(x.p.NUMBER||''),String(y.p.NUMBER||'')));
      const der=Ls=>Ls.reduce((m2,r)=>Math.max(m2,tlKey(r)),0), kd=k=>dfr(diso(new Date(Math.floor(k/10000),Math.floor(k/100)%100,k%100)));
      corps=Ps.length?'<div class="sgc-tab"><table class="nx-tbl sgc-t" id="sgc-t"><tr><th>Projet</th><th>Collaborateurs</th><th class="r">Heures</th><th>État</th><th class="r">Dernière saisie</th><th class="sg-notri"></th></tr>'
          +Ps.map(x=>{ const ss=[...new Set(x.L.map(r=>r.STAFF_ID))].map(id=>DS.get('staff',id)).filter(Boolean).sort((a2,b2)=>cmp(staffName(a2),staffName(b2)));
            return '<tr><td><b>'+nxE(x.p.NUMBER||'')+'</b> '+nxE(x.p.TITLE||'')+'</td><td class="sgc-ss" data-csv="'+nxE(ss.map(staffName).join(', '))+'">'+ss.map(s=>'<span class="sgt-ini" title="'+nxE(staffName(s))+'">'+nxE(sgtIni(s))+'</span>').join('')+'</td>'
              +'<td class="r"><b>'+nxH(x.c.h)+'</b></td><td class="sgc-et">'+sgcEtatHtml(x.c)+'</td><td class="r">'+kd(der(x.L))+'</td>'
              +'<td class="sgc-act"><button class="nx-btn sm" data-fn="ctlp" data-p="'+x.p.ID+'" title="Fenêtre de contrôle de l’affaire : collaborateurs, semaine à contrôler">'+nxSvg('cal')+'<span>Contrôler</span></button></td></tr>'; }).join('')
          +'<tr class="tot"><td>Total</td><td></td><td class="r">'+nxH(C.h)+'</td><td class="sgc-et">'+sgcEtatHtml(C)+'</td><td></td><td class="sgc-act"></td></tr></table></div>'
          +'<div class="sgfh-leg sgc-leg2"><span>'+SGC_OK+'approuvée</span><span>'+SGC_REF+'refusée</span><span>'+SGC_COR+'corrigée</span><span class="g">« Contrôler » ouvre la fenêtre de contrôle de l’affaire : ses collaborateurs, la semaine à contrôler.</span></div>'
        :'<div class="nx-empty">Aucune heure sur cette période.</div>'; }
    /* bandeau, chiffres, barre d'outils, tableau : la présentation de la Feuille d'heures */
    const ec=hfT-pT, nbS=S.length, gros=sem?'S'+isoWeek(P.a)[1]:MOIS[P.a.getMonth()].replace('.','').replace(/^./,x=>x.toUpperCase());
    const meta=[nbS+' collaborateur'+(nbS>1?'s':''),C.ctl?C.ctl+' inscription'+(C.ctl>1?'s':'')+' à contrôler':'rien à contrôler','une inscription approuvée n’est plus modifiable par le collaborateur'].join(' · ');
    const w=h('div',{class:'sgfh sgc'}); m.append(w);
    w.innerHTML='<div class="sgfh-haut"><div class="sgfh-tete"><div class="sgfh-id"><span class="sgfh-ini">'+nxE(gros)+'</span><div class="sgfh-nm"><div class="lb">Contrôle des heures</div><h2>'+(tous?'Tout le bureau':'Heures de mes projets')+'</h2><div class="sgfh-meta">'+nxE(meta)+'</div></div></div>'
      +'<div class="sgfh-per"><span class="lbl">'+nxE(P.lib)+'</span><div class="seg sgfh-vues">'+[['collab','Par collaborateur'],['projet','Par projet']].map(([k,t])=>'<button data-fn="vue" data-k="'+k+'" class="'+((st.vue||'collab')===k?'on':'')+'">'+t+'</button>').join('')+'</div></div></div>'
      +'<div class="nx-kpis sgfh-kp">'
      +'<div class="nx-kpi" title="'+nxE('Heures saisies '+(sem?'de la semaine':'du mois')+' : '+nxH(C.h)+' h sur '+nxH(pP)+' h prévues')+'"><div class="l">'+nxSvg('clock')+'Heures saisies</div><div class="v">'+nxH(C.h)+'<small>h</small></div>'+sgfhJauge(C.h,pP)+'</div>'
      +'<div class="nx-kpi" title="Heures prévues de la période : heures prévues du mois réparties sur ses jours ouvrés"><div class="l">'+nxSvg('cal')+'Heures prévues</div><div class="v">'+nxH(pP)+'<small>h</small></div></div>'
      +'<div class="nx-kpi" title="Heures saisies jusqu’à hier − heures prévues jusqu’à hier"><div class="l">'+nxSvg('trend')+'Écart à ce jour</div><div class="v '+(ec<-.25?'sgfh-neg':ec>.25?'sgfh-pos':'')+'">'+(pT?(ec>0?'+':'')+nxH(ec)+'<small>h</small>':'—')+'</div></div>'
      +'<div class="nx-kpi" title="'+nxE(C.ctl+' inscription(s) saisie(s) ou corrigée(s), pas encore approuvée(s) : '+nxH(C.hctl)+' h ; '+C.ok+' approuvée(s)')+'"><div class="l">'+nxSvg('check')+'À contrôler</div><div class="v">'+C.ctl+'</div></div>'
      +'<div class="nx-kpi" title="Refusées : à corriger par le collaborateur"><div class="l">'+nxSvg('pv')+'Refusées</div><div class="v'+(C.ref?' sgfh-neg':'')+'">'+C.ref+'</div></div></div>'
      +'<div class="sgfh-outils"></div></div><div class="sgc-corps">'+corps+'</div>';
    const ou=w.querySelector('.sgfh-outils'), tl=document.getElementById('tools'); if(ou&&tl){ ou.append(tl); document.documentElement.classList.add('sgfh-on'); }
    const approuver=(rs,qui)=>{ if(!rs.length) return; const hh=rs.reduce((t,r)=>t+(+r.TIMEPERIOD||0),0);
      sgConfirm('Approuver '+rs.length+' inscription'+(rs.length>1?'s':'')+' à contrôler ('+nxH(hh)+' h) — '+qui+', '+P.lib.toLowerCase()+' ?\n\nUne inscription approuvée n’est plus modifiable par le collaborateur. « Contrôler » permet de revenir en arrière (Réinitialiser).',
        async()=>{ await DS.commit(rs.map(r=>({t:'timelog',id:r.ID,val:{...r,TIMELOGSTATECODE:3}}))); toast(rs.length+' inscription(s) approuvée(s).'); },{title:'Approuver les heures',yesText:'Approuver'}); };
    const f=this._fn={};
    f.vue=b=>this.sv({vue:b.dataset.k});
    f.ctl=b=>sgcFenetre(null,{staffs:S,staff:+b.dataset.s,date:b.dataset.d,titre:'Contrôle des heures',peut:V?peut:null});
    f.ctlp=b=>{ const p=DS.get('project',+b.dataset.p); if(p) sgcFenetre(p,{date:diso(P.a)}); };
    f.app=b=>{ const s=DS.get('staff',+b.dataset.s); approuver((parS.get(+b.dataset.s)||[]).filter(r=>SGC_ETAT(r)==='ctl'),s?staffName(s):'collaborateur'); };
    f.tout=()=>approuver(L.filter(r=>SGC_ETAT(r)==='ctl'),'tous les collaborateurs');
    f.csv=()=>{ const t=w.querySelector('#sgc-t'); if(!t) return; const c=t.cloneNode(true);
      c.querySelectorAll('.sgc-act,th.sg-notri').forEach(x=>x.remove()); c.querySelectorAll('[data-csv]').forEach(x=>{ x.textContent=x.dataset.csv; });
      sgCsvTable(c,'controle_heures_'+(st.vue==='projet'?'projets_':'')+diso(P.a)+'.csv'); };
    w.addEventListener('click',e=>{ const t=e.target.closest('[data-fn]'); if(!t||!w.contains(t)||t.disabled) return; const fn=f[t.dataset.fn]; if(fn) fn(t); }); },
  dessiner(){ const m=this._m; if(!m||!m.isConnected) return; const sc=m.querySelector('.sgc-corps'), y=sc?sc.scrollTop:0;
    if(typeof sgfhOutilsRendre==='function') sgfhOutilsRendre(); setTools(this.tools()); m.innerHTML=''; this.render(m); const s2=m.querySelector('.sgc-corps'); if(s2) s2.scrollTop=y; },
  refresh(ts){ if(hit(ts,'timelog','staff','stafftargettime','targettime','publicholiday','project')) this.dessiner(); } };
/* menu : chapitre Administration, en tête (24.10.2026, demande de Paulo ; avant : Heures, après la Feuille d'heures) ; administrateur seulement
   (sgVueOk : chapitre Administration) */
{ const T=SG_D.administration; if(T&&!T.items.some(x=>x.v==='nx-controle')){ const it={v:'nx-controle',t:'Contrôle des heures',ico:'check',hero:1,d:'Vérifier et valider les heures saisies : semaine par semaine, par collaborateur ou par projet.'};
    T.items.unshift(it); NX_VIEW['nx-controle']={d:T,t:it.t,it}; }
  SG_VUE_DROIT['nx-controle']=()=>sgAdmin(); }
/* ═══ Administration ▸ contrôles et analyses par affaire (24.10.2026) ═══
   Demande de Paulo : « déplacer dans Administration : Contrôle des heures d'affaires, Critères d'analyse des heures, Contrôle des frais, Critères
   d'analyse des frais — copier ces éléments comme éléments cliquables dans le menu de gauche ». Les quatre tuiles du Controlling (Archives ▸ Suivi &
   écarts, qui les garde) deviennent des entrées du menu Administration (administrateur seulement, comme le chapitre). Chaque écran = la liste des
   affaires (état — En cours d'office —, recherche, heures ou frais, à contrôler, refusées, dernière saisie, de la plus récente activité à la plus
   ancienne) ; un clic sur une affaire ouvre sa fenêtre : contrôle des heures = sgcFenetre(p) sur la semaine de sa dernière saisie (graphisme de la
   feuille d'heures), critères d'analyse = ctlAnalyse(p,'timelog'|'projectcost'), contrôle des frais = ctlCostCheck(p) (fenêtres du moteur).
   Choix de l'écran : sg3_adm_ctl {etat, q}, communs aux quatre. */
const sgAdmCle=k=>k?new Date(Math.floor(k/10000),Math.floor(k/100)%100,k%100):null;
const SG_ADM_CTL=[
  {v:'adm-ctl-heures',f:'heures',b:'Contrôler',fen:'la fenêtre de contrôle sur la semaine et le collaborateur de sa dernière saisie',ouvrir:(p,x)=>sgcFenetre(p,x&&x.der?{date:diso(sgAdmCle(x.der)),staff:x.st}:{})},
  {v:'adm-ana-heures',f:'heures',b:'Analyser',fen:'les critères d’analyse de ses heures',ouvrir:p=>ctlAnalyse(p,'timelog')},
  {v:'adm-ctl-frais',f:'frais',b:'Contrôler',fen:'la fenêtre de contrôle de ses frais sur le mois et le collaborateur de la dernière note',
    ouvrir:(p,x)=>{ if(x&&x.der){ CTL_F.y=Math.floor(x.der/10000); CTL_F.m=Math.floor(x.der/100)%100; if(x.st!=null) CTL_F.staff=x.st; } ctlCostCheck(p); }},
  {v:'adm-ana-frais',f:'frais',b:'Analyser',fen:'les critères d’analyse de ses frais',ouvrir:p=>ctlAnalyse(p,'projectcost')}];
SG_ADM_CTL.forEach(c=>{ const tl=c.f==='heures', T=tl?'timelog':'projectcost', it=(NX_VIEW[c.v]||{}).it||{t:c.v,d:''};
  VIEWS[c.v]={ render(m){ this._m=m; const st=Object.assign({etat:2,q:''},nxLS.get('sg3_adm_ctl',{})), P=new Map();
      DS.all(T).forEach(r=>{ if(r.PROJECT_ID==null||(tl&&+r.ISHOLIDAY)) return; let x=P.get(r.PROJECT_ID); if(!x) P.set(r.PROJECT_ID,x={n:0,v:0,ctl:0,ref:0,der:0,st:null});
        x.n++; x.v+=tl?(+r.TIMEPERIOD||0):pcAmount(r); const e=+(tl?r.TIMELOGSTATECODE:r.PROJECTCOSTSTATECODE)||0; if(e===0||e===2) x.ctl++; else if(e===1) x.ref++;
        const k=tl?tlKey(r):(+r.DATEYEAR)*10000+(+r.DATEMONTH)*100+(+r.DATEDAY); if(k>x.der){ x.der=k; x.st=r.STAFF_ID; } });   /* st : auteur de la dernière saisie */
      const vide={n:0,v:0,ctl:0,ref:0,der:0}, lib=st.etat?((CTL_ETATS.find(e=>e[0]===st.etat)||[])[1]||''):'Toutes';
      const L=DS.all('project').filter(p=>!st.etat||+p.PROJECTSTATECODE===st.etat).map(p=>({p,x:P.get(p.ID)||vide}))
        .sort((a,b)=>b.x.der-a.x.der||cmp(String(b.p.NUMBER||''),String(a.p.NUMBER||'')));
      const nCtl=L.reduce((s,o)=>s+o.x.ctl,0), quoi=tl?'inscription':'frais';
      const chip=(e,t)=>'<button data-fn="etat" data-e="'+e+'" class="'+(st.etat===e?'on':'')+'">'+nxE(t)+'</button>';
      const val=x=>x.n?(tl?nxH(x.v)+' h':nxCHF(x.v)+' CHF'):'—';
      const row=({p,x})=>'<tr class="nx-row" data-fn="o" data-id="'+p.ID+'" data-q="'+nxE([p.NUMBER,p.TITLE].filter(Boolean).join(' ').toLowerCase())+'" style="display:table-row" title="'+nxE(c.b+' : '+[p.NUMBER,p.TITLE].filter(Boolean).join(' '))+'">'
        +'<td><span class="nx-tag num">'+nxE(p.NUMBER||'')+'</span></td><td><b>'+nxE(p.TITLE||'')+'</b></td><td class="r">'+val(x)+'</td>'
        +'<td class="r">'+(x.ctl?'<b>'+x.ctl+'</b>':x.n?'<span class="sg-admctl-ok" title="Tout est contrôlé">'+nxSvg('check')+'</span>':'—')+'</td>'
        +'<td class="r">'+(x.ref?'<span class="sgfh-st ref sg-admctl-ref" title="Refusées"></span> '+x.ref:'')+'</td>'   /* « ! » par CSS : la cellule ne contient que le nombre (tri) */
        +'<td>'+(x.der?dfr(diso(sgAdmCle(x.der))):'—')+'</td><td class="r"><span class="nx-btn sm">'+nxE(c.b)+'</span></td></tr>';
      const figs='<div class="sg-figs"><div class="sg-fig"><div class="n">'+L.length+'</div><div class="t">affaires · '+nxE(lib.toLowerCase())+'</div></div>'
        +'<div class="sg-fig"><div class="n">'+nCtl+'</div><div class="t">'+quoi+(nCtl>1&&tl?'s':'')+' à contrôler</div></div></div>';
      const html='<div class="sg-split">'+sgIntro('Administration',nxE(it.t),nxE(it.d)+' Un clic sur une affaire ouvre '+nxE(c.fen)+'.',figs)
        +'<div><div class="sg-mesp-bar"><div class="seg">'+chip(0,'Toutes')+CTL_ETATS.map(([e,t])=>chip(e,t)).join('')+'</div>'
        +'<input class="inp" id="sg-admctl-q" placeholder="Rechercher une affaire…" value="'+nxE(st.q)+'"><span class="n"></span></div>'
        +(L.length?'<table class="nx-tbl sg-mesp sg-admctl"><tr><th>N°</th><th>Affaire</th><th class="r">'+(tl?'Heures':'Frais')+'</th><th class="r">À contrôler</th><th class="r">Refusées</th><th>Dernière saisie</th><th class="sg-notri"></th></tr>'
          +L.map(row).join('')+'</table>':'<div class="nx-empty">Aucune affaire « '+nxE(lib)+' ».</div>')+'</div></div>';
      const pg=nxPage(m,html), inp=pg.querySelector('#sg-admctl-q'), nb=pg.querySelector('.sg-mesp-bar .n');
      const filt=()=>{ const s=inp.value.trim().toLowerCase(); let n=0; pg.querySelectorAll('tr[data-q]').forEach(tr=>{ const ok=!s||tr.dataset.q.includes(s); tr.style.display=ok?'table-row':'none'; if(ok) n++; });
        nb.textContent=n+' affaire'+(n>1?'s':''); };
      inp.oninput=()=>{ st.q=inp.value; nxLS.set('sg3_adm_ctl',st); filt(); }; filt();
      Object.assign(pg._fn,{etat:b=>{ st.etat=+b.dataset.e; nxLS.set('sg3_adm_ctl',st); this.redessiner(); },
        o:tr=>{ const p=DS.get('project',+tr.dataset.id); if(p) c.ouvrir(p,P.get(p.ID)); }}); },
    /* redessin sur place (pas de go : ni entrée d'historique ni retour en haut à chaque saisie reçue du bureau) */
    redessiner(){ const m=this._m; if(!m||!m.isConnected) return; const sc=[m,...m.querySelectorAll('.nx-page')].map(x=>x.scrollTop);
      const q=m.querySelector('#sg-admctl-q'), foc=q&&document.activeElement===q, a=foc?q.selectionStart:0, b=foc?q.selectionEnd:0;   /* recherche en cours de frappe gardée */
      m.innerHTML=''; this.render(m); [m,...m.querySelectorAll('.nx-page')].forEach((x,i)=>{ if(sc[i]) x.scrollTop=sc[i]; });
      const q2=m.querySelector('#sg-admctl-q'); if(foc&&q2){ q2.focus({preventScroll:true}); try{ q2.setSelectionRange(a,b); }catch(_){} } },
    refresh(ts){ if(hit(ts,'project',T)) this.redessiner(); } }; });


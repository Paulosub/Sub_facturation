/* ═══ 26. Temps ▸ Contrôle des heures (24.10.2026) ═══════════════════════════════════════════════════════════════════════════════════════
   Demande de Paulo : « dans Temps, ajoute le contrôle des heures ». L'ancien logiciel contrôlait les heures affaire par affaire (Controlling ▸
   Contrôle des heures d'affaires, archivé le 23.10.2026) ; ici, semaine par semaine ou mois par mois, pour tout le bureau :
   - Par collaborateur : heures par jour (mois : par semaine), jours ouvrés sans saisie en rouge, jours fériés et week-ends sur fond gris,
     total, heures prévues à ce jour (comme les Rapports de temps : heures prévues du mois réparties sur ses jours ouvrés), écart, état des
     inscriptions. « Contrôler » ouvre la fenêtre de contrôle de l'ancien logiciel sur la semaine du collaborateur, toutes affaires
     (ctlTimeCheck sans affaire : choisir les inscriptions — clic, Cmd-clic, Maj-clic — puis Approuver, Refuser ou Réinitialiser ; double-clic =
     modifier l'inscription) ; « Approuver » valide d'un coup ses inscriptions à contrôler de la période (après confirmation).
   - Par projet : projets qui ont des heures dans la période, mêmes états ; « Contrôler » = la fenêtre d'origine, affaire par affaire.
   États (TIMELOGSTATECODE, TSTATE du moteur) : 0 Saisi et 2 Corrigé = à contrôler, 1 Refusé, 3 Approuvé (le collaborateur ne peut plus la
   modifier). Droits : comme le Controlling (chef de projet ou administrateur, heures « de ses projets » au moins) ; sans le droit « toutes les
   heures », seules les heures des projets visibles se contrôlent et les jours sans saisie ne sont pas signalés. Réglages de l'écran :
   sg3_controle {mode sem | mois, d date de référence, vue collab | projet}.
   Graphisme de la Feuille d'heures (même jour, demande de Paulo « corriger contrôle des heures pour correspondre à la feuille d'heures
   graphiquement ») : bandeau jaune (semaine ou mois en grand, « Tout le bureau », période, Par collaborateur | Par projet), chiffres de la
   période (heures saisies et jauge, prévues, écart à ce jour, à contrôler, refusées), barre d'outils du moteur sous les chiffres (#tools
   déplacé comme dans la Feuille d'heures, sgfhOutilsRendre ; Semaine | Mois, Aujourd'hui, ‹ période ›, Fonctions à droite : Tout approuver,
   CSV), jours en tête comme l'agenda (nom, date en grand), états en pastilles (✓ approuvée, ! refusée, ↺ corrigée), légende commune.
   Fenêtre « Contrôler » (même jour, demande de Paulo) : chaque inscription dans l'ordre de la feuille d'heures — l'affaire en tête et en entier,
   puis les heures, la phase, les remarques (sgcBloc, option bloc de ctlTimeCheck) ; couleurs d'état du moteur gardées ; réglages d'affichage
   qui ne s'appliquent plus retirés de son menu (option reglages = sgfhMenuSans). ═══ */
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
/* inscription de la fenêtre « Contrôler » : bandeau à la couleur d'état du moteur avec l'affaire, puis heures, phase, remarques (sgfhLignes) */
function sgcBloc(r,el,autre){ const L=sgfhLignes(r), c1=autre?'#9b9b9b':tlColors(r)[0];
  el.classList.add('sgc-b'); el.classList.toggle('autre',!!autre);
  el.innerHTML='<div class="sgc-bn" style="background:'+c1+'"><b>'+nxE(L.num)+'</b>'+(L.tit?' '+nxE(L.tit):'')+'</div>'
    +'<div class="sgc-bh"><span>'+nxE(L.tps)+'</span><span>'+nxE(L.du)+'</span></div>'+[L.ph,L.rq].filter(Boolean).map(x=>'<div class="sgc-bt">'+nxE(x)+'</div>').join('');
  el.title=L.titre; }
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
    f.ctl=b=>ctlTimeCheck(null,{staffs:S,staff:+b.dataset.s,date:b.dataset.d,titre:'Contrôle des heures',boutons:1,peut:V?peut:null,bloc:sgcBloc,reglages:sgfhMenuSans});
    f.ctlp=b=>{ const p=DS.get('project',+b.dataset.p); if(p) ctlTimeCheck(p,{date:diso(P.a),boutons:1,bloc:sgcBloc,reglages:sgfhMenuSans}); };
    f.app=b=>{ const s=DS.get('staff',+b.dataset.s); approuver((parS.get(+b.dataset.s)||[]).filter(r=>SGC_ETAT(r)==='ctl'),s?staffName(s):'collaborateur'); };
    f.tout=()=>approuver(L.filter(r=>SGC_ETAT(r)==='ctl'),'tous les collaborateurs');
    f.csv=()=>{ const t=w.querySelector('#sgc-t'); if(!t) return; const c=t.cloneNode(true);
      c.querySelectorAll('.sgc-act,th.sg-notri').forEach(x=>x.remove()); c.querySelectorAll('[data-csv]').forEach(x=>{ x.textContent=x.dataset.csv; });
      sgCsvTable(c,'controle_heures_'+(st.vue==='projet'?'projets_':'')+diso(P.a)+'.csv'); };
    w.addEventListener('click',e=>{ const t=e.target.closest('[data-fn]'); if(!t||!w.contains(t)||t.disabled) return; const fn=f[t.dataset.fn]; if(fn) fn(t); }); },
  dessiner(){ const m=this._m; if(!m||!m.isConnected) return; const sc=m.querySelector('.sgc-corps'), y=sc?sc.scrollTop:0;
    if(typeof sgfhOutilsRendre==='function') sgfhOutilsRendre(); setTools(this.tools()); m.innerHTML=''; this.render(m); const s2=m.querySelector('.sgc-corps'); if(s2) s2.scrollTop=y; },
  refresh(ts){ if(hit(ts,'timelog','staff','stafftargettime','targettime','publicholiday','project')) this.dessiner(); } };
/* menu Temps (juste après la Feuille d'heures) et droits : ceux du Controlling */
{ const T=SG_D.temps; if(T&&!T.items.some(x=>x.v==='nx-controle')){ const it={v:'nx-controle',t:'Contrôle des heures',ico:'check',d:'Vérifier et valider les heures saisies : semaine par semaine, par collaborateur ou par projet.'};
    const i=T.items.findIndex(x=>x.v==='h-saisie'); T.items.splice(i<0?0:i+1,0,it); NX_VIEW['nx-controle']={d:T,t:it.t,it}; }
  SG_VUE_DROIT['nx-controle']=()=>SG_ACC.profil!=='collab'&&sgDroit('heures','projets'); }

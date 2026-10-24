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
   sg3_controle {mode sem | mois, d date de référence, vue collab | projet}. ═══ */
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
const sgcCompte=L=>{ const c={h:0,v:0,n:L.length,ctl:0,ref:0,ok:0,hctl:0}; L.forEach(r=>{ const t=+r.TIMEPERIOD||0, e=SGC_ETAT(r); c.h+=t; if(r.ISHOLIDAY) c.v+=t; c[e]++; if(e==='ctl') c.hctl+=t; }); return c; };
function sgcEtatHtml(c){ if(!c.n) return '<span class="sgc-e vide">—</span>';
  const p=[]; if(c.ctl) p.push('<span class="sgc-e ctl" title="Saisies ou corrigées, pas encore approuvées">'+c.ctl+' à contrôler</span>');
  if(c.ref) p.push('<span class="sgc-e ref" title="Refusées : à corriger par le collaborateur">'+c.ref+' refusée'+(c.ref>1?'s':'')+'</span>');
  if(!c.ctl&&!c.ref) p.push('<span class="sgc-e ok">'+nxSvg('check')+'Approuvé</span>');
  return p.join(' '); }
/* cellule d'un jour (ou d'une semaine du mois) : heures, état ; jour ouvré passé sans saisie = tiret rouge */
function sgcCellule(L,o){ const c=sgcCompte(L), cls=['sgc-j']; if(o.off) cls.push('off'); if(o.auj) cls.push('auj');
  if(!c.n){ if(o.man){ cls.push('man'); return '<td class="'+cls.join(' ')+'" title="'+nxE(o.manT||'Aucune saisie')+'"'+(o.go||'')+'>–</td>'; }
    return '<td class="'+cls.join(' ')+'"'+(o.titre?' title="'+nxE(o.titre)+'"':'')+(o.go||'')+'></td>'; }
  const e=c.ref?'ref':!c.ctl?'ok':'', vac=c.v&&c.v===c.h;
  if(e) cls.push(e); if(vac) cls.push('vac'); if(o.man) cls.push('man2');
  const t=[nxH(c.h)+' h'+(c.v&&!vac?' (dont '+nxH(c.v)+' h de vacances)':vac?' de vacances':''),c.ctl?c.ctl+' à contrôler':'',c.ref?c.ref+' refusée(s)':'',c.ok?c.ok+' approuvée(s)':'',o.titre||'',o.manT||''].filter(Boolean).join('\n');
  return '<td class="'+cls.join(' ')+'" title="'+nxE(t)+'"'+(o.go||'')+'>'+(vac?'<small>vac.</small> ':'')+nxH(c.h)+(e==='ok'?'<i class="sgc-ok">'+nxSvg('check')+'</i>':'')+'</td>'; }
VIEWS['nx-controle']={
  render(m){ this._m=m; const st=Object.assign({mode:'sem',d:'',vue:'collab'},nxLS.get('sg3_controle',{})), P=sgcPeriode(st), J=sgcJours(P.a,P.b), ka=dayKey(P.a), kb=dayKey(P.b);
    const tous=sgAdmin()||sgDroit('heures','toutes'), V=tous?null:new Set(sgProjetsVisibles().map(p=>p.ID)), peut=r=>!V||V.has(r.PROJECT_ID);
    const L=DS.all('timelog').filter(r=>{ const k=tlKey(r); return k>=ka&&k<=kb&&peut(r); }), C=sgcCompte(L);
    const parS=new Map(); L.forEach(r=>{ const k=r.STAFF_ID; if(!parS.has(k)) parS.set(k,[]); parS.get(k).push(r); });
    const S=DS.all('staff').filter(s=>parS.has(s.ID)||(tous&&J.some(j=>sgcEngage(s,j.iso)))).sort((x,y)=>cmp(staffName(x),staffName(y)));
    const auj=new Date(); auj.setHours(0,0,0,0); const fin=P.b<auj?P.b:new Date(auj.getFullYear(),auj.getMonth(),auj.getDate()-1), kf=dayKey(fin);
    const sem=st.mode!=='mois', W=[]; if(!sem){ for(let d=mondayOf(P.a);d<=P.b;d.setDate(d.getDate()+7)){ const x=new Date(d), [,w]=isoWeek(x), y=new Date(x); y.setDate(y.getDate()+6); W.push({a:x,b:y,w,da:x<P.a?new Date(P.a):x,db:y>P.b?new Date(P.b):y}); } }   /* da–db : jours de la semaine compris dans le mois */
    const ctrl=(sid,d)=>' data-fn="ctl" data-s="'+sid+'" data-d="'+diso(d)+'"';
    let corps='';
    if(st.vue!=='projet'){
      const tete='<tr><th>Collaborateur</th>'+(sem?J.map(j=>'<th class="sgc-j'+(!j.ouvre?' off':'')+(j.auj?' auj':'')+'"'+(j.ferie?' title="'+nxE(j.ferie)+'"':'')+'>'+JOURS[j.d.getDay()]+' <small>'+j.d.getDate()+'.'+(j.d.getMonth()+1)+'</small></th>').join('')
          :W.map(x=>'<th class="sgc-j" title="'+nxE('Semaine '+x.w+' : du '+dfr(diso(x.da))+' au '+dfr(diso(x.db)))+'">S'+x.w+' <small>'+x.da.getDate()+'.'+(x.da.getMonth()+1)+'</small></th>').join(''))
        +'<th class="r">Total</th><th class="r" title="Heures prévues jusqu’à hier (heures prévues du mois réparties sur ses jours ouvrés, comme les Rapports de temps)">Prévues</th>'
        +'<th class="r" title="Heures saisies jusqu’à hier − heures prévues jusqu’à hier">Écart</th><th>État</th><th class="sg-notri"></th></tr>';
      const tot={j:new Map(),h:0,p:0,hf:0}; let lignes='';
      S.forEach(s=>{ const Ls=parS.get(s.ID)||[], c=sgcCompte(Ls), byK=new Map(); Ls.forEach(r=>{ const k=tlKey(r); if(!byK.has(k)) byK.set(k,[]); byK.get(k).push(r); });
        const man=j=>tous&&j.ouvre&&j.passe&&sgcEngage(s,j.iso)&&!byK.has(j.k);
        const prev=fin>=P.a?hrMaps(s.ID,P.a,fin).sum(P.a,fin).P:0, hf=Ls.reduce((t,r)=>t+(tlKey(r)<=kf?+r.TIMEPERIOD||0:0),0), ec=hf-prev;
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
      corps=nxCard('c12',P.lib+' — par collaborateur',S.length?'<div class="b flush sgc-sc"><table class="nx-tbl sgc-t" id="sgc-t">'+tete+lignes+pied+'</table></div>'
          +'<div class="sgc-leg"><span><i class="sgc-pt"></i>à contrôler</span><span><i class="sgc-pt ref"></i>refusées</span><span><i class="sgc-pt ok"></i>approuvées</span>'+(tous?'<span><b class="sgc-man">–</b>jour ouvré sans saisie</span>':'')
          +'<span><i class="sgc-pt off"></i>week-end, jour férié</span><span>Un clic sur un jour ouvre la semaine à contrôler.</span></div>'
        :'<div class="b"><div class="nx-empty">Aucun collaborateur ni aucune heure sur cette période.</div></div>',
        C.ctl?'<span class="a" data-fn="tout" title="Approuver toutes les inscriptions à contrôler de la période">Tout approuver</span>':'');
    } else {
      const parP=new Map(); L.forEach(r=>{ const k=r.PROJECT_ID; if(!parP.has(k)) parP.set(k,[]); parP.get(k).push(r); });
      const Ps=[...parP.keys()].map(id=>({p:DS.get('project',id),L:parP.get(id)})).filter(x=>x.p).map(x=>Object.assign(x,{c:sgcCompte(x.L)}))
        .sort((x,y)=>(y.c.ctl+y.c.ref)-(x.c.ctl+x.c.ref)||cmp(String(x.p.NUMBER||''),String(y.p.NUMBER||'')));
      const der=Ls=>Ls.reduce((m2,r)=>Math.max(m2,tlKey(r)),0), kd=k=>dfr(diso(new Date(Math.floor(k/10000),Math.floor(k/100)%100,k%100)));
      corps=nxCard('c12',P.lib+' — par projet',Ps.length?'<div class="b flush sgc-sc"><table class="nx-tbl sgc-t" id="sgc-t"><tr><th>Projet</th><th>Collaborateurs</th><th class="r">Heures</th><th>État</th><th class="r">Dernière saisie</th><th class="sg-notri"></th></tr>'
          +Ps.map(x=>{ const ss=[...new Set(x.L.map(r=>r.STAFF_ID))].map(id=>DS.get('staff',id)).filter(Boolean).sort((a2,b2)=>cmp(staffName(a2),staffName(b2)));
            return '<tr><td><b>'+nxE(x.p.NUMBER||'')+'</b> '+nxE(x.p.TITLE||'')+'</td><td class="sgc-ss" data-csv="'+nxE(ss.map(staffName).join(', '))+'">'+ss.map(s=>'<span class="sgt-ini" title="'+nxE(staffName(s))+'">'+nxE(sgtIni(s))+'</span>').join('')+'</td>'
              +'<td class="r"><b>'+nxH(x.c.h)+'</b></td><td class="sgc-et">'+sgcEtatHtml(x.c)+'</td><td class="r">'+kd(der(x.L))+'</td>'
              +'<td class="sgc-act"><button class="nx-btn sm" data-fn="ctlp" data-p="'+x.p.ID+'" title="Fenêtre de contrôle de l’affaire : collaborateurs, semaine à contrôler">'+nxSvg('cal')+'<span>Contrôler</span></button></td></tr>'; }).join('')
          +'<tr class="tot"><td>Total</td><td></td><td class="r">'+nxH(C.h)+'</td><td class="sgc-et">'+sgcEtatHtml(C)+'</td><td></td><td class="sgc-act"></td></tr></table></div>'
        :'<div class="b"><div class="nx-empty">Aucune heure sur cette période.</div></div>'); }
    const fig=(n,t,cl)=>'<div class="sg-fig"><div class="n'+(cl?' '+cl:'')+'">'+n+'</div><div class="t">'+t+'</div></div>';
    const pg=nxPage(m,'<div class="sg-split">'+sgIntro('Temps','Contrôle des heures','Vérifier et valider les heures saisies, semaine par semaine : jours sans saisie, heures prévues, inscriptions à contrôler, refusées ou approuvées. Une inscription approuvée n’est plus modifiable par le collaborateur.',
        '<div class="sg-figs">'+fig(nxH(C.h),'heures saisies')+fig(C.ctl,'à contrôler')+fig(C.ref,'refusées',C.ref?'sg-neg':'')+fig(C.ok,'approuvées')+'</div>')
      +'<div><div class="nx-card c12"><div class="b sg-sit-f sgc-f"><div class="seg">'+[['sem','Semaine'],['mois','Mois']].map(([k,t])=>'<button data-fn="mode" data-k="'+k+'" class="'+(st.mode===k||(k==='sem'&&st.mode!=='mois')?'on':'')+'">'+t+'</button>').join('')+'</div>'
        +'<div class="sgc-nav"><button class="nx-btn sm" data-fn="prec" title="'+(sem?'Semaine précédente':'Mois précédent')+'">'+nxSvg('prev')+'</button><b>'+nxE(P.lib)+'</b><button class="nx-btn sm" data-fn="suiv" title="'+(sem?'Semaine suivante':'Mois suivant')+'">'+nxSvg('next')+'</button>'
        +'<button class="nx-btn sm" data-fn="auj">'+(sem?'Cette semaine':'Ce mois')+'</button></div>'
        +'<div class="seg">'+[['collab','Par collaborateur'],['projet','Par projet']].map(([k,t])=>'<button data-fn="vue" data-k="'+k+'" class="'+((st.vue||'collab')===k?'on':'')+'">'+t+'</button>').join('')+'</div>'
        +'<span style="flex:1"></span><button class="nx-btn" data-fn="csv">'+nxSvg('export')+'CSV</button></div></div>'+corps+'</div></div>');
    const sv=o=>{ nxLS.set('sg3_controle',Object.assign(st,o)); this.dessiner(); };
    const dec=n=>{ const d=new Date(P.a); if(sem) d.setDate(d.getDate()+7*n); else d.setMonth(d.getMonth()+n); return diso(d); };
    pg._fn.mode=b=>sv({mode:b.dataset.k,d:diso(P.a)}); pg._fn.vue=b=>sv({vue:b.dataset.k});
    pg._fn.prec=()=>sv({d:dec(-1)}); pg._fn.suiv=()=>sv({d:dec(1)}); pg._fn.auj=()=>sv({d:''});
    pg._fn.ctl=b=>ctlTimeCheck(null,{staffs:S,staff:+b.dataset.s,date:b.dataset.d,titre:'Contrôle des heures',boutons:1,peut:V?peut:null});
    pg._fn.ctlp=b=>{ const p=DS.get('project',+b.dataset.p); if(p) ctlTimeCheck(p,{date:diso(P.a),boutons:1}); };
    const approuver=(rs,qui)=>{ if(!rs.length) return; const hh=rs.reduce((t,r)=>t+(+r.TIMEPERIOD||0),0);
      sgConfirm('Approuver '+rs.length+' inscription'+(rs.length>1?'s':'')+' à contrôler ('+nxH(hh)+' h) — '+qui+', '+P.lib.toLowerCase()+' ?\n\nUne inscription approuvée n’est plus modifiable par le collaborateur. « Contrôler » permet de revenir en arrière (Réinitialiser).',
        async()=>{ await DS.commit(rs.map(r=>({t:'timelog',id:r.ID,val:{...r,TIMELOGSTATECODE:3}}))); toast(rs.length+' inscription(s) approuvée(s).'); },{title:'Approuver les heures',yesText:'Approuver'}); };
    pg._fn.app=b=>{ const s=DS.get('staff',+b.dataset.s); approuver((parS.get(+b.dataset.s)||[]).filter(r=>SGC_ETAT(r)==='ctl'),s?staffName(s):'collaborateur'); };
    pg._fn.tout=()=>approuver(L.filter(r=>SGC_ETAT(r)==='ctl'),'tous les collaborateurs');
    pg._fn.csv=()=>{ const t=m.querySelector('#sgc-t'); if(!t) return; const c=t.cloneNode(true);
      c.querySelectorAll('.sgc-act,th.sg-notri').forEach(x=>x.remove()); c.querySelectorAll('[data-csv]').forEach(x=>{ x.textContent=x.dataset.csv; });
      sgCsvTable(c,'controle_heures_'+(st.vue==='projet'?'projets_':'')+diso(P.a)+'.csv'); }; },
  dessiner(){ const m=this._m; if(!m||!m.isConnected) return; const pg=m.querySelector('.nx-page'), y=pg?pg.scrollTop:0; m.innerHTML=''; this.render(m); const p2=m.querySelector('.nx-page'); if(p2) p2.scrollTop=y; },
  refresh(ts){ if(hit(ts,'timelog','staff','stafftargettime','targettime','publicholiday','project')) this.dessiner(); } };
/* menu Temps (juste après la Feuille d'heures) et droits : ceux du Controlling */
{ const T=SG_D.temps; if(T&&!T.items.some(x=>x.v==='nx-controle')){ const it={v:'nx-controle',t:'Contrôle des heures',ico:'check',d:'Vérifier et valider les heures saisies : semaine par semaine, par collaborateur ou par projet.'};
    const i=T.items.findIndex(x=>x.v==='h-saisie'); T.items.splice(i<0?0:i+1,0,it); NX_VIEW['nx-controle']={d:T,t:it.t,it}; }
  SG_VUE_DROIT['nx-controle']=()=>SG_ACC.profil!=='collab'&&sgDroit('heures','projets'); }

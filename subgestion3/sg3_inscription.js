/* ═══ 28. Temps ▸ fenêtre « Éditer l'inscription » redessinée (24.10.2026) ════════════════════════════════════════════════════════════════
   Demande de Paulo : « revoir le graphisme de Éditer inscription, améliorer et rendre plus intuitif ». C'est la fenêtre du moteur (hsEdit) :
   mêmes champs, mêmes listes, mêmes règles (affaire, groupe d'activités et activité obligatoires ; phase, ouvrage, commentaire selon l'affaire ;
   chevauchements refusés ; période verrouillée ; phase partielle terminée ; dernière affaire reprise pour une nouvelle saisie), mêmes boutons
   (Supprimer, Annuler, OK & continuer, OK & jour suivant, OK). Elle est seulement réorganisée dans l'ordre de la saisie : 1 Quand (jour ‹ ›, de –
   à, durée), 2 Projet et activité, 3 Phase (phase, phase partielle, ouvrage), 4 Détails (commentaire, facturable, statut). En tête : le
   collaborateur, Temps de travail | Vacances en boutons, et le résumé de la saisie, tenu à jour (jour, heures, durée, projet, activité, phase).
   Au-dessus de chaque liste : le choix en cours (ou « à choisir ») et « obligatoire » selon l'affaire choisie. Les éléments du moteur sont
   déplacés tels quels (leurs gestionnaires restent) ; DeltaSub.html seul garde la fenêtre d'origine. ═══ */
function sgieHabiller(dlg){ const bd=dlg.querySelector('.bd'), body=bd&&bd.firstElementChild; if(!body||body.children.length<6||body.querySelector('.sgie')) return;
  const [rowK,top,,form,,bottom]=body.children, radios=[...rowK.querySelectorAll('input[type=radio]')], work=radios[0], hol=radios[1];
  const g3=top.firstElementChild, b3=bottom.children[0], c3=bottom.children[1]; if(!work||!hol||!g3||!b3||!c3||!form.classList.contains('form')) return;
  const [Lproj,Lag,Lact]=[...g3.children], [Lsub,Lph,Lsp]=[...b3.children], [cSub,cPh,cSp]=[...c3.children], fc=[...form.children];
  const ctl=t=>{ const i=fc.findIndex(x=>x.tagName==='LABEL'&&x.textContent.trim()===t); return i>=0?fc[i+1]:null; };
  const jour=ctl('Jour'), heure=ctl('Heure'), periode=ctl('Période'), desc=ctl('Commentaire'), fact=ctl(''), statut=ctl('Statut');
  if(!jour||!heure||!periode||!desc||!fact||!statut) return;
  const [t1,t2]=[...heure.querySelectorAll('input')], per=periode.querySelector('input'), dLbl=jour.querySelector('span'), ro=!!work.disabled;
  const sid=(()=>{ const n=(rowK.querySelector('span')||{}).textContent||''; const s=DS.all('staff').find(x=>staffName(x)===n.trim()); return s?s.ID:HS.staff; })(), s=DS.get('staff',sid);
  dlg.classList.add('sgie-dlg');
  /* en-tête : collaborateur, type de temps, résumé */
  const bT=h('button',{type:'button'},'Temps de travail'), bV=h('button',{type:'button'},'Vacances'), res=h('div',{class:'sgie-res'}), res2=h('div',{class:'sgie-res2'});
  const pick=x=>{ if(ro) return; x.checked=true; x.dispatchEvent(new Event('change',{bubbles:true})); maj(); };
  bT.onclick=()=>pick(work); bV.onclick=()=>pick(hol); if(ro){ bT.disabled=bV.disabled=true; }
  const ent=h('div',{class:'sgie-ent'},h('span',{class:'sgie-ini'},s?sgtIni(s):'—'),h('div',{class:'sgie-qui'},h('b',{},s?staffName(s):''),res,res2),h('div',{class:'seg sgie-type'},bT,bV));
  /* listes : titre, choix en cours, « obligatoire », bouton pour effacer */
  const lst=(t,box,k,clr)=>{ box.classList.add('sgie-box'); box.style.height='108px'; if(clr){ clr.textContent='Effacer'; clr.classList.add('sgie-clr'); }
    return h('div',{class:'sgie-li','data-k':k},h('div',{class:'sgie-lh'},h('span',{class:'t'},t),h('span',{class:'ob'}),clr||''),h('div',{class:'sgie-v'}),box); };
  const sec=(n,t,cls,...k)=>h('section',{class:'sgie-s '+cls},h('div',{class:'sgie-h'},h('span',{class:'no'},n),h('b',{},t)),...k);
  const row=(...k)=>h('div',{class:'sgie-l'},...k), lab=t=>h('label',{},t);
  jour.classList.add('sgie-jour'); fact.classList.add('sgie-fact'); statut.classList.add('sgie-statut');
  const nb=h('div',{class:'sgie'},ent,h('span',{style:{display:'none'}},...radios.map(x=>x.closest('label')||x)),
    sec('1','Quand','sgie-qd',row(lab('Jour'),jour),row(lab('De'),t1,lab('à'),t2,h('span',{class:'sep'}),lab('Durée'),per,h('span',{class:'u'},'h'))),
    sec('2','Projet et activité','sgie-pa',h('div',{class:'sgie-g3'},lst('Projet',Lproj,'proj'),lst('Groupe d’activités',Lag,'ag'),lst('Activité',Lact,'act'))),
    sec('3','Phase','sgie-ph',h('div',{class:'sgie-g3'},lst('Phase',Lph,'ph',cPh),lst('Phase partielle',Lsp,'sp',cSp),lst('Ouvrage',Lsub,'sub',cSub))),
    sec('4','Détails','sgie-dt',row(lab('Commentaire'),desc),row(fact,h('span',{class:'sep'}),lab('Statut'),statut)));
  body.replaceChildren(nb); body.style.minWidth='0';
  const sup=[...dlg.querySelectorAll('.ft .btn')].find(b=>b.textContent.trim()==='Supprimer'); if(sup) sup.classList.add('sgie-sup');
  /* choix en cours d'une liste (ligne sélectionnée) */
  const choix=box=>{ const tr=box.querySelector('tbody tr.on'); return tr?[...tr.children].map(td=>td.textContent.trim()).filter(Boolean).join(' · '):''; };
  const maj=()=>{ const vac=hol.checked; nb.classList.toggle('vac',vac); bT.classList.toggle('on',!vac); bV.classList.toggle('on',vac);
    const pr=choix(Lproj), num=pr.split(' · ')[0], pj=num?DS.all('project').find(p=>String(p.NUMBER)===num):null;
    const ob={proj:!vac,ag:!vac,act:!vac,ph:!vac&&!!(pj&&pj.ISTIMEPHASEMANDATORY),sp:!vac&&!!(pj&&pj.ISTIMEPHASEMANDATORY)&&Lsp.querySelectorAll('tbody tr').length>0,sub:!vac&&!!(pj&&pj.ISTIMESUBPROJECTMANDATORY)};
    const boxes={proj:Lproj,ag:Lag,act:Lact,ph:Lph,sp:Lsp,sub:Lsub};
    nb.querySelectorAll('.sgie-li').forEach(li=>{ const k=li.dataset.k, v=choix(boxes[k]); li.querySelector('.ob').textContent=ob[k]?'obligatoire':'';
      const e=li.querySelector('.sgie-v'); e.textContent=v||(ob[k]?'à choisir':'—'); e.classList.toggle('manque',!v&&ob[k]); e.title=v; });
    desc.placeholder=!vac&&pj&&pj.ISTIMEDESCMANDATORY?'Commentaire obligatoire pour ce projet':'Ce qui a été fait (facultatif)';
    const tps=t1.value&&t2.value?t1.value+' – '+(t2.value==='23:59'?'24:00':t2.value):'', du=per.value?String(+(+per.value).toFixed(2))+' h':'';
    res.textContent=[(dLbl?dLbl.textContent:'').replace(/\s*\(Semaine \d+\)/,''),tps,du].filter(Boolean).join(' · ');
    res2.textContent=vac?'Vacances':[pr,choix(Lag),choix(Lact),[choix(Lph),choix(Lsp)].filter(Boolean).join(' · ')].filter(Boolean).join(' › ')||'Projet et activité à choisir'; };
  nb.addEventListener('click',()=>setTimeout(maj,0)); nb.addEventListener('keyup',()=>setTimeout(maj,0)); nb.addEventListener('input',maj); nb.addEventListener('change',maj);
  /* chaque liste montre son choix (défilement dans la liste seulement) ; la fenêtre s'ouvre en haut */
  const voir=()=>{ [Lproj,Lag,Lact,Lph,Lsp,Lsub].forEach(b=>{ const tr=b.querySelector('tbody tr.on'); if(tr) b.scrollTop=Math.max(0,tr.offsetTop-b.clientHeight/2+tr.offsetHeight/2); }); bd.scrollTop=0; };
  maj(); voir(); setTimeout(voir,0); }
{ const hsEdit0=hsEdit;
  hsEdit=function(){ const n0=document.querySelectorAll('.dlg').length, res=hsEdit0.apply(this,arguments), L=document.querySelectorAll('.dlg');
    if(L.length>n0) try{ sgieHabiller(L[L.length-1]); }catch(e){ console.error(e); }
    return res; }; }

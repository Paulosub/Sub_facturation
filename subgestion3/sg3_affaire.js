/* ═══ 24. Éditer l'affaire ▸ Phases, Activités, Tarifs (23.10.2026) ═══════════════════════════════════════════════════════════════════════
   Demande de Paulo : « intègre l'organisation des activités dans la fenêtre d'édition de l'affaire, également les tarifs et la configuration des
   phases » ; proposition A choisie sur maquette (« tableaux sur place »). Trois rubriques de « Éditer l'affaire » (sgEditAffaire, bloc 20), à la
   place des fenêtres du moteur cfgPhases / cfgActivities / cfgRates (toujours dans Affaires ▸ Gestion ▸ Configuration). Tout se fait sur un
   brouillon : rien n'est écrit avant « Enregistrer » / « Créer l'affaire », qui ajoute ces opérations aux siennes ; enregistrer sans rien
   changer n'écrit rien. Mêmes tables et mêmes règles que le moteur :
   - Phases : projectphase / projectsubphase (budgets heures, honoraires, frais ; phase partielle verrouillée = ISTERMINATED : plus de saisie).
     Le budget d'une phase suit la somme de ses phases partielles dès qu'on en modifie une (pratique du bureau : 69 phases sur 70 dans la base).
     Suppression refusée si des heures, des frais, des encaissements planifiés, le calcul des honoraires ou la planification RH s'en servent.
     « Reprendre les budgets du contrat » : honoraires HT des contrats d'honoraires reliés, répartis selon leurs % SIA (comme sgContratParPhase) ;
     heures = honoraires ÷ tarif net (tarif horaire moyen du contrat − rabais, modifiable ; sans tarif, les heures ne changent pas).
   - Activités : projectactivitygroup / projectactivity / projectactivity_staff. Collaborateurs de l'affaire (rubrique Collaborateurs) en
     initiales, selon la règle de la feuille d'heures : un collaborateur coché sur au moins une activité d'un groupe ne voit que celles-là ; coché
     sur aucune, il les voit toutes. Les autorisations des autres collaborateurs ne sont pas touchées. Suppression refusée si des heures ou le
     calcul des honoraires s'en servent.
   - Tarifs : projectrategroup / projectrate (taux datés : le taux en vigueur est le dernier dont la date est passée). Niveau utilisé par une
     activité : pas de suppression.
   Nouvelle affaire : dossier standard du bureau d'office (phases et phases partielles, groupe « Affaire » et ses activités, tarifs), comme
   « Insérer les phases standards » / « Importer du dossier standard » du moteur — sans phase ni activité, aucune heure ne peut être saisie.
   Droits du moteur « phases », « activités », « tarifs de facturation » (projectPhases, projectActivities, projectRates) : sans eux, la
   rubrique est en lecture seule.
   ⚠ NON BRANCHÉ depuis le 23.10.2026 : retiré de « Éditer l'affaire » le même jour à la demande de Paulo (« supprimer les phases, les activités,
   les tarifs ; ces éléments seront traités dans d'autres chapitres ; conserve les éléments pour pouvoir les réutiliser plus tard »). Le module
   reste construit dans SUBGestion3.html, testé et prêt à servir ailleurs (styles .sg-epo-* gardés dans sg3.css). Pour le réutiliser :
     const ORG=sgEpOrga(projet|null, {numero:()=>numéro saisi (nouvelle affaire), equipe:()=>[staff de l'affaire]});
     placer <div class="sg-epo" data-epo="phases|activites|tarifs"></div> dans la page, puis ORG.brancher(conteneur, fenêtre {bd}) ;
     à l'enregistrement : if(!ORG.valider()) return false ; ops.push(...ORG.ops(idProjet)) avant DS.commit(ops) ;
     ORG.majEquipe() quand l'équipe change, ORG.majNumero() quand le numéro d'une nouvelle affaire change.
   Essais faits le 23.10.2026 (base de test, 24SLC puis affaire d'essai supprimée) : enregistrer sans rien changer = aucune écriture ; reprise
   du contrat, verrou, suppressions refusées, activités du dossier standard, autorisations, taux datés et création d'une affaire corrects. ═══ */
function sgEpOrga(p,o){ const E=nxE, pid=p?p.ID:null, AUJ=today(), S=x=>String(x), cp=r=>Object.assign({},r);
  let seq=0, repris=false, flash=null, tarifNet=null, corps=null, D=null, foc=null;
  const tmp=()=>'n'+(++seq), estN=x=>S(x).startsWith('n');
  const numv=v=>{ const s=S(v==null?'':v).replace(/['’\s]/g,'').replace(',','.'); return s===''||isNaN(+s)?null:+s; };
  const dec=x=>Number.isInteger(x)?0:Math.abs(Math.round(x*10)-x*10)<1e-9?1:2;
  const fmt=x=>x==null||x===''||isNaN(+x)?'':num(+x,dec(+x));
  const cle=s=>(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const pc=x=>x?String(Math.round(x*10)/10).replace('.',',')+' %':'';
  const ote=(arr,f)=>{ for(let i=arr.length-1;i>=0;i--) if(f(arr[i])) arr.splice(i,1); };
  const somme=(L,k)=>Math.round(L.reduce((a,x)=>a+(+x[k]||0),0)*100)/100;
  const DR={ph:ch08aCan('projectPhases'),ac:ch08aCan('projectActivities'),rg:ch08aCan('projectRates')};
  /* brouillon : copies des enregistrements de l'affaire ; nouveaux = identifiant provisoire « nX » ; O = état d'origine (comparaison à l'enregistrement) */
  const B={ph:[],sp:[],ag:[],ac:[],st:new Set(),rg:[],rt:[]};
  if(pid){ B.ph=DS.by('projectphase','PROJECT_ID',pid).map(cp); B.sp=B.ph.flatMap(f=>DS.by('projectsubphase','PROJECTPHASE_ID',f.ID).map(cp));
    B.ag=DS.by('projectactivitygroup','PROJECT_ID',pid).map(cp); B.ac=B.ag.flatMap(g=>DS.by('projectactivity','PROJECTACTIVITYGROUP_ID',g.ID).map(cp));
    B.ac.forEach(a=>DS.by('projectactivity_staff','PROJECTACTIVITY_ID',a.ID).forEach(l=>B.st.add(a.ID+'-'+l.STAFFS_ID)));
    B.rg=DS.by('projectrategroup','PROJECT_ID',pid).map(cp); B.rt=B.rg.flatMap(g=>DS.by('projectrate','PROJECTRATEGROUP_ID',g.ID).map(cp)); }
  const O={}; ['ph','sp','ag','ac','rg','rt'].forEach(k=>{ O[k]=new Map(B[k].map(x=>[S(x.ID),JSON.stringify(x)])); }); O.st=new Set(B.st);
  const change=(k,x)=>estN(x.ID)||O[k].get(S(x.ID))!==JSON.stringify(x);

  /* ── phases ── */
  const PHK=['TIMEBUDGET','TIMEAMOUNTBUDGET','COSTBUDGET'];
  const phases=()=>B.ph.slice().sort((a,b)=>(+a.NUMBER||0)-(+b.NUMBER||0)||cmp(a.NAMEFR||'',b.NAMEFR||''));
  const sousDe=f=>B.sp.filter(s=>S(s.PROJECTPHASE_ID)===S(f.ID)).sort((a,b)=>(+a.NUMBER||0)-(+b.NUMBER||0)||cmp(a.NAMEFR||'',b.NAMEFR||''));
  const sommePh=f=>{ const L=sousDe(f); PHK.forEach(k=>{ if(L.some(s=>s[k]!=null)) f[k]=somme(L,k); }); };
  const libPh=x=>[x.NUMBER,(x.NAMEFR||'').trim()].filter(v=>v!=null&&v!=='').join(' ');
  const phaseStd=f=>{ let d=B.ph.find(x=>+x.NUMBER===+f.NUMBER&&cle(x.NAMEFR)===cle(f.NAMEFR));
    if(!d){ d={ID:tmp(),TIMEBUDGET:null,NUMBER:f.NUMBER,NAMEFR:f.NAMEFR,PROJECT_ID:pid,TIMEAMOUNTBUDGET:null,COSTBUDGET:null}; B.ph.push(d); } return d; };
  const nouvSous=(f,n,nom)=>{ const s={ID:tmp(),NAMEFR:nom||'',NUMBER:n,TIMEBUDGET:null,PROJECTPHASE_ID:f.ID,TIMEAMOUNTBUDGET:null,COSTBUDGET:null,ISTERMINATED:0}; B.sp.push(s); return s; };
  const SUB_STD=()=>DS.all('subphase').slice().sort((a,b)=>(+a.NUMBER||0)-(+b.NUMBER||0));
  function inserePhases(){ DS.all('phase').slice().sort((a,b)=>(+a.NUMBER||0)-(+b.NUMBER||0)).forEach(f=>{ const d=phaseStd(f);
    SUB_STD().filter(s=>s.PHASE_ID===f.ID).forEach(s=>{ if(!sousDe(d).some(x=>+x.NUMBER===+s.NUMBER)) nouvSous(d,s.NUMBER,s.NAMEFR); }); }); }
  const manquePhases=()=>DS.all('phase').some(f=>{ const d=B.ph.find(x=>+x.NUMBER===+f.NUMBER&&cle(x.NAMEFR)===cle(f.NAMEFR));
    return !d||SUB_STD().some(s=>s.PHASE_ID===f.ID&&!sousDe(d).some(x=>+x.NUMBER===+s.NUMBER)); });
  /* phase partielle SIA n (31, 32…) : celle de l'affaire (sous une phase SIA de même groupe), sinon créée d'après le dossier standard */
  function sousStd(n){ const g=+S(n).charAt(0), L=B.sp.filter(x=>+x.NUMBER===+n);
    const s0=L.find(x=>{ const f=B.ph.find(y=>S(y.ID)===S(x.PROJECTPHASE_ID)); return f&&sgSiaGroupe(f)===g; })||L[0]; if(s0) return s0;
    const st=DS.all('subphase').find(x=>+x.NUMBER===+n), f=st&&DS.get('phase',st.PHASE_ID);
    return st&&f?nouvSous(phaseStd(f),st.NUMBER,st.NAMEFR):null; }
  const PH_USAGE=[['timelog','des heures y sont saisies'],['projectcost','des frais y sont saisis'],['projectscheduledpayment','des encaissements planifiés s’en servent'],
    ['projectfeetimeitem','le calcul des honoraires s’en sert'],['projectfeeadditionalitem','le calcul des honoraires s’en sert'],['projectfeecostitem','le calcul des honoraires s’en sert']];
  function phUsage(t,x){ if(estN(x.ID)) return ''; const f=t==='projectphase'?'PHASE_ID':'SUBPHASE_ID', u=PH_USAGE.find(([c])=>DS.by(c,f,x.ID).length);
    if(u) return u[1]; return typeof plSubPhaseUsed==='function'&&plSubPhaseUsed(t,x.ID)?'la planification RH s’en sert':''; }
  /* contrats d'honoraires de l'affaire (nouvelle affaire : même code d'affaire que le numéro saisi) ; null tant que le cadre Facturation n'est pas chargé */
  function contrats(){ const F0=typeof fxData==='function'?fxData():null; if(!F0) return null;
    if(pid) return sgContratsDuProjet(p,F0).filter(c=>!c.annule);
    const k=sgCle(o.numero?o.numero():''); return k?F0.c.filter(c=>!c.annule&&sgCle(c.affaire)===k):[]; }
  function parPhase(cs){ const sous={}, grp={}; let tot=0, tarif=null, avecPct=false;
    cs.slice().sort((a,b)=>cmp(S(b.date||''),S(a.date||''))).forEach(c=>{ const P=c.phases||{}, Sm=Object.values(P).reduce((a,v)=>a+(+v||0),0), T=+c.httc||0, H=+c.hht||(T/(1+((+c.tva||8.1)/100)));
      const inp=(c.detail&&c.detail.inputs)||{}, t=+inp.ch_h||+inp.ch_tarif_moyen||0, r=+(c.rabais!=null&&c.rabais!==''?c.rabais:inp.ch_rabais)||0;
      if(t>0&&tarif==null) tarif=Math.round(t*(1-r/100)*100)/100;
      tot+=H; if(!Sm||!H) return;
      Object.entries(P).forEach(([k,v])=>{ const m=/^4(\d)(\d)?/.exec(k); if(!m||!+v) return; const b=H*(+v)/Sm; avecPct=true; grp[m[1]]=(grp[m[1]]||0)+b; if(m[2]) sous[m[1]+m[2]]=(sous[m[1]+m[2]]||0)+b; }); });
    return {sous,grp,tot,tarif,avecPct}; }
  function reprendre(){ const R=parPhase(contrats()||[]), t=tarifNet!=null?tarifNet:R.tarif; flash=new Set();
    Object.entries(R.sous).forEach(([k,chf])=>{ if(!(chf>0)) return; const s=sousStd(k); if(!s) return; s.TIMEAMOUNTBUDGET=Math.round(chf); if(t>0) s.TIMEBUDGET=Math.round(chf/t); flash.add(S(s.ID)); });
    B.ph.forEach(f=>{ if(sousDe(f).some(s=>flash.has(S(s.ID)))) sommePh(f); }); repris=true; }

  /* ── activités ── */
  const groupes=()=>B.ag.slice().sort((a,b)=>(+a.SORTORDER||0)-(+b.SORTORDER||0)||cmp(a.NAMEFR||'',b.NAMEFR||''));
  const actsDe=g=>B.ac.filter(a=>S(a.PROJECTACTIVITYGROUP_ID)===S(g.ID)).sort((a,b)=>(+a.SORTORDER||0)-(+b.SORTORDER||0));
  const sommeAg=g=>{ const L=actsDe(g); ['TIMEBUDGET','TIMEAMOUNTBUDGET'].forEach(k=>{ if(L.some(a=>a[k]!=null)) g[k]=somme(L,k); }); };
  const cleSt=(a,sid)=>a.ID+'-'+sid, actDeCle=k=>k.slice(0,k.lastIndexOf('-')), staffDeCle=k=>k.slice(k.lastIndexOf('-')+1);
  const groupeDe=a=>B.ag.find(x=>S(x.ID)===S(a.PROJECTACTIVITYGROUP_ID));
  const lignesG=(g,sid)=>g?actsDe(g).filter(a=>B.st.has(cleSt(a,sid))):[];
  const voit=(a,sid)=>!lignesG(groupeDe(a),sid).length||B.st.has(cleSt(a,sid));   /* règle de la feuille d'heures */
  const otePermis=a=>[...B.st].forEach(c=>{ if(actDeCle(c)===S(a.ID)) B.st.delete(c); });
  function nouvActivite(g,nom,type){ const ids=new Set(actsDe(g).map(x=>S(x.ID))), stf=new Set([...B.st].filter(k=>ids.has(actDeCle(k))).map(staffDeCle));
    const a={ID:tmp(),SORTORDER:actsDe(g).reduce((m,x)=>Math.max(m,(+x.SORTORDER||0)+1),0),TIMEBUDGET:null,NAMEFR:nom||'',PROJECTRATEGROUP_ID:null,PROJECTACTIVITYGROUP_ID:g.ID,TYPECODE:type||0,TIMEAMOUNTBUDGET:null};
    B.ac.push(a); stf.forEach(s=>B.st.add(cleSt(a,s))); return a; }   /* ceux qui ont des activités cochées dans le groupe gardent la nouvelle */
  const nouvGroupe=nom=>{ const g={ID:tmp(),TIMEBUDGET:null,SORTORDER:B.ag.reduce((m,x)=>Math.max(m,(+x.SORTORDER||0)+1),0),NAMEFR:nom||'',PROJECT_ID:pid,TIMEAMOUNTBUDGET:null}; B.ag.push(g); return g; };
  const actsStd=gs=>DS.all('activity').filter(a=>a.ACTIVITYGROUP_ID===gs.ID).sort((a,b)=>(+a.SORTORDER||0)-(+b.SORTORDER||0));
  const groupeStd=gs=>{ const g=nouvGroupe(gs.NAMEFR); actsStd(gs).forEach(a=>nouvActivite(g,a.NAMEFR,a.TYPECODE||0)); return g; };
  const stdDuGroupe=g=>DS.all('activitygroup').find(x=>cle(x.NAMEFR)===cle(g.NAMEFR));
  function acUsage(a){ if(estN(a.ID)) return ''; if(DS.by('timelog','ACTIVITY_ID',a.ID).length) return 'des heures y sont saisies';
    return DS.by('projectfeetimeitem','ACTIVITY_ID',a.ID).length?'le calcul des honoraires s’en sert':''; }
  function agUsage(g){ if(!estN(g.ID)&&DS.by('timelog','ACTIVITYGROUP_ID',g.ID).length) return 'des heures y sont saisies';
    for(const a of actsDe(g)){ const u=acUsage(a); if(u) return 'une de ses activités est utilisée ('+u+')'; } return ''; }
  function bascule(a,sid,nom){ const L=lignesG(groupeDe(a),sid), k=cleSt(a,sid);
    const reste=nom+' garde au moins une activité de ce groupe : sans aucune, la feuille d’heures lui propose toutes les activités du groupe.';
    if(voit(a,sid)){ if(L.length){ if(L.length===1){ toast(reste,true); return; } B.st.delete(k); }
      else { const autres=actsDe(groupeDe(a)).filter(x=>x!==a); if(!autres.length){ toast(reste,true); return; } autres.forEach(x=>B.st.add(cleSt(x,sid))); } }
    else B.st.add(k); }

  /* ── tarifs ── */
  const niveaux=()=>B.rg.slice().sort((a,b)=>(+a.SORTORDER||0)-(+b.SORTORDER||0)||cmp(a.NAMEFR||'',b.NAMEFR||''));
  const tauxDe=g=>B.rt.filter(r=>S(r.PROJECTRATEGROUP_ID)===S(g.ID)).sort((a,b)=>cmp(S(a.VALIDFROM||''),S(b.VALIDFROM||'')));
  const enVigueur=g=>{ const L=tauxDe(g), P=L.filter(r=>!r.VALIDFROM||S(r.VALIDFROM).slice(0,10)<=AUJ); return P[P.length-1]||L[0]||null; };
  function nouvNiveau(nom,taux,des,so){ const g={ID:tmp(),NAMEFR:nom||'',SORTORDER:so!=null?so:B.rg.reduce((m,x)=>Math.max(m,(+x.SORTORDER||0)+1),0),PROJECT_ID:pid}; B.rg.push(g);
    if(taux!=null) B.rt.push({ID:tmp(),RATE:taux,VALIDFROM:des||AUJ,PROJECTRATEGROUP_ID:g.ID}); return g; }
  const tarifsStd=()=>DS.all('rate').slice().sort((a,b)=>(+a.SORTORDER||0)-(+b.SORTORDER||0)).filter(r=>!B.rg.some(g=>cle(g.NAMEFR)===cle(r.NAMEFR)));
  const nbActsTarif=g=>B.ac.filter(a=>S(a.PROJECTRATEGROUP_ID)===S(g.ID)).length;

  /* nouvelle affaire : dossier standard du bureau */
  if(!pid){ if(DR.ph) inserePhases(); if(DR.ac){ const gs=DS.all('activitygroup').find(x=>cle(x.NAMEFR)==='affaire'); if(gs) groupeStd(gs); }
    if(DR.rg) tarifsStd().forEach(r=>nouvNiveau(r.NAMEFR,r.RATE,r.VALIDFROM,r.SORTORDER)); }

  /* ── affichage ── */
  const X='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="square"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const CAD='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="square"><rect x="5" y="11" width="14" height="9"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const CAD_O='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="square"><rect x="5" y="11" width="14" height="9"/><path d="M8 11V8a4 4 0 0 1 7.6-1.7"/></svg>';
  const ic=(a,svg,ti)=>'<button type="button" class="sg-epo-ic" data-oa="'+a+'" title="'+E(ti)+'">'+svg+'</button>';
  const inN=(f,v,ro,cls)=>'<input class="sg-epo-in n'+(cls?' '+cls:'')+'" data-of="'+f+'" value="'+E(+v||/^(rt|rtg|tarifnet)/.test(f)?fmt(v):'')+'" inputmode="decimal"'+(ro?' disabled':'')+'>';   /* budget à 0 : case vide */
  const inT=(f,v,ro,q)=>'<input class="sg-epo-in txt'+(q&&q.b?' b':'')+'" data-of="'+f+'" value="'+E(v||'')+'"'+(v?' title="'+E(v)+'"':'')+(q&&q.ph?' placeholder="'+E(q.ph)+'"':'')+(ro?' disabled':'')+'>';
  const inD=(f,v,ro)=>'<input class="sg-epo-in d" type="date" data-of="'+f+'" value="'+E(v?S(v).slice(0,10):'')+'"'+(ro?' disabled':'')+'>';
  const inNo=(f,v)=>'<input class="sg-epo-in no" data-of="'+f+'" value="'+E(v==null?'':v)+'" inputmode="numeric">';
  const lien=(a,t,ico)=>'<button type="button" class="sg-epo-lien" data-oa="'+a+'">'+(ico?nxSvg(ico):'')+E(t)+'</button>';
  const puce=(a,t,n)=>'<button type="button" class="sg-epo-chip" data-oa="'+a+'">'+nxSvg('plus')+E(t)+(n!=null&&n!==''?' <small>'+E(n)+'</small>':'')+'</button>';
  const vide=(n,t)=>'<tr><td colspan="'+n+'" class="sg-epo-vide">'+t+'</td></tr>';
  const lect=t=>'<p class="aide">Lecture seule : droit « '+t+' » du module Affaires requis.</p>';
  function htmlPhases(){ const ro=!DR.ph, cs=contrats(), R=cs?parPhase(cs):{sous:{},grp:{},tot:0,tarif:null,avecPct:false}, fl=flash||new Set(), t=tarifNet!=null?tarifNet:R.tarif;
    const cP=R.tot>0&&R.avecPct, codes=cs?[...new Set(cs.map(c=>c.affaire).filter(Boolean))].join(', '):'';
    let h='';
    if(cs==null) h+='<p class="aide">Contrats d’honoraires en cours de chargement…</p>';
    else if(!cs.length) h+='<p class="aide">Aucun contrat d’honoraires relié à l’affaire : budgets à saisir ici.</p>';
    else if(!cP) h+='<p class="aide">Contrat d’honoraires '+E(codes)+' sans prestations SIA en % : budgets à saisir ici.</p>';
    else if(!ro) h+='<div class="sg-epo-cta'+(repris?' fait':'')+'">'+nxSvg(repris?'check':'contrat')+'<span>'+(repris?'Budgets repris du contrat d’honoraires ':'Contrat d’honoraires ')+'<b>'+E(codes)+'</b> · '+num(Math.round(R.tot),0)+' CHF HT · heures = honoraires ÷ '
      +'<input class="sg-epo-in n" data-of="tarifnet" value="'+E(fmt(t))+'" inputmode="decimal" placeholder="tarif" title="Tarif horaire net : tarif horaire moyen du contrat − rabais"> CHF/h</span><span class="sp"></span>'
      +(repris?lien('reprendre','Reprendre à nouveau'):'<button type="button" class="btn pri" data-oa="reprendre">Reprendre les budgets du contrat</button>')+'</div>';
    const P=phases(), pctS=n=>R.tot&&R.sous[S(n)]?pc(R.sous[S(n)]/R.tot*100):'', pctG=f=>{ const g=sgSiaGroupe(f); return R.tot&&g&&R.grp[g]?pc(R.grp[g]/R.tot*100):''; };
    let rows='';
    P.forEach(f=>{ rows+='<tr class="g"><td class="no">'+(estN(f.ID)&&!ro?inNo('ph:'+f.ID+':NUMBER',f.NUMBER):E(f.NUMBER==null?'':f.NUMBER))+'</td><td>'+inT('ph:'+f.ID+':NAMEFR',f.NAMEFR,ro,{b:1,ph:'Nom de la phase'})+'</td>'
        +(cP?'<td class="r">'+pctG(f)+'</td>':'')+PHK.map(k=>'<td class="r">'+inN('ph:'+f.ID+':'+k,f[k],ro)+'</td>').join('')
        +'<td></td><td class="act">'+(ro?'':ic('addsp:'+f.ID,nxSvg('plus'),'Ajouter une phase partielle')+ic('delph:'+f.ID,X,'Supprimer la phase et ses phases partielles'))+'</td></tr>';
      sousDe(f).forEach(s=>{ const lk=+s.ISTERMINATED===1;
        rows+='<tr><td class="no">'+(estN(s.ID)&&!ro?inNo('sp:'+s.ID+':NUMBER',s.NUMBER):E(s.NUMBER==null?'':s.NUMBER))+'</td><td>'+inT('sp:'+s.ID+':NAMEFR',s.NAMEFR,ro,{ph:'Nom de la phase partielle'})+'</td>'
          +(cP?'<td class="r">'+pctS(s.NUMBER)+'</td>':'')+PHK.map(k=>'<td class="r">'+inN('sp:'+s.ID+':'+k,s[k],ro,fl.has(S(s.ID))&&k!=='COSTBUDGET'?'flash':'')+'</td>').join('')
          +'<td>'+(ro?(lk?'<span class="sg-epo-ic on" title="Verrouillée : plus de saisie d’heures ni de frais">'+CAD+'</span>':'')
            :'<button type="button" class="sg-epo-ic'+(lk?' on':'')+'" data-oa="lock:'+s.ID+'" title="'+(lk?'Verrouillée : plus de saisie d’heures ni de frais (cliquer pour rouvrir)':'Verrouiller la saisie des heures et des frais')+'">'+(lk?CAD:CAD_O)+'</button>')+'</td>'
          +'<td class="act">'+(ro?'':ic('delsp:'+s.ID,X,'Supprimer la phase partielle'))+'</td></tr>'; }); });
    const tt=k=>somme(P,k), nc=cP?8:7;
    h+='<table class="sg-epo-t"><tr><th>N°</th><th>Phase / phase partielle</th>'+(cP?'<th class="r">% contrat</th>':'')+'<th class="r">Heures prévues</th><th class="r">Honoraires CHF</th><th class="r">Frais CHF</th><th title="Phase partielle verrouillée">'+CAD+'</th><th></th></tr>'
      +(rows||vide(nc,'Aucune phase : les heures ne peuvent pas être saisies si la phase est obligatoire.'))
      +(P.length?'<tr class="tot"><td></td><td>Total</td>'+(cP?'<td></td>':'')+PHK.map(k=>'<td class="r">'+(tt(k)?fmt(tt(k)):'')+'</td>').join('')+'<td></td><td></td></tr>':'')+'</table>';
    return h+(ro?lect('phases'):'<div class="sg-epo-sug">'+lien('addph','Phase','plus')+(manquePhases()?lien('stdph','Insérer les phases du bureau manquantes','import'):'')+'</div>'); }
  const selType=(a,ro)=>'<select class="sg-epo-in" data-of="ac:'+a.ID+':TYPECODE"'+(ro?' disabled':'')+'>'+Object.entries(ACT_T).map(([k,t])=>'<option value="'+k+'"'+(+k===(+a.TYPECODE||0)?' selected':'')+'>'+E(t)+'</option>').join('')+'</select>';
  const selTarif=(a,ro)=>'<select class="sg-epo-in" data-of="ac:'+a.ID+':PROJECTRATEGROUP_ID"'+(ro?' disabled':'')+'><option value="">—</option>'
    +niveaux().map(g=>{ const r=enVigueur(g); return '<option value="'+E(g.ID)+'"'+(S(a.PROJECTRATEGROUP_ID)===S(g.ID)?' selected':'')+'>'+E(g.NAMEFR||'(sans nom)')+(r&&r.RATE!=null?' · '+fmt(r.RATE):'')+'</option>'; }).join('')+'</select>';
  function pastilles(a,eq,ro){ if(!eq.length) return '<span class="sg-epo-eq">aucun collaborateur attribué</span>'; const tous=eq.every(s=>voit(a,s.ID));
    return '<span class="sg-epo-pills">'+eq.map(s=>{ const on=voit(a,s.ID), nom=staffName(s);
      return '<button type="button" class="sg-epo-pill'+(on?' on':'')+'" data-oa="pill:'+a.ID+':'+s.ID+'" title="'+E(nom+(on?' peut saisir ses heures sur cette activité':' ne peut pas saisir sur cette activité'))+'"'+(ro?' disabled':'')+'>'+E(s.INITIALS||'?')+'</button>'; }).join('')+'</span>'
      +(tous?'<span class="sg-epo-eq">toute l’équipe</span>':''); }
  function htmlActivites(){ const ro=!DR.ac, eq=o.equipe?o.equipe():[]; let rows='';
    groupes().forEach(g=>{ const L=actsDe(g);
      rows+='<tr class="g"><td colspan="3">'+inT('ag:'+g.ID+':NAMEFR',g.NAMEFR,ro,{b:1,ph:'Nom du groupe'})+'</td>'+['TIMEBUDGET','TIMEAMOUNTBUDGET'].map(k=>'<td class="r">'+inN('ag:'+g.ID+':'+k,g[k],ro)+'</td>').join('')
        +'<td></td><td class="act">'+(ro?'':ic('delag:'+g.ID,X,'Supprimer le groupe et ses activités'))+'</td></tr>';
      L.forEach(a=>{ rows+='<tr><td>'+inT('ac:'+a.ID+':NAMEFR',a.NAMEFR,ro,{ph:'Nom de l’activité'})+'</td><td>'+selType(a,ro)+'</td><td>'+selTarif(a,ro)+'</td>'
        +['TIMEBUDGET','TIMEAMOUNTBUDGET'].map(k=>'<td class="r">'+inN('ac:'+a.ID+':'+k,a[k],ro)+'</td>').join('')+'<td>'+pastilles(a,eq,ro)+'</td><td class="act">'+(ro?'':ic('delac:'+a.ID,X,'Supprimer l’activité'))+'</td></tr>'; });
      if(!ro){ const gs=stdDuGroupe(g), sug=gs?actsStd(gs).filter(x=>!L.some(a=>cle(a.NAMEFR)===cle(x.NAMEFR))):[];
        rows+='<tr class="add"><td colspan="7"><div class="sg-epo-sug">'+lien('addac:'+g.ID,'Activité','plus')+(sug.length?'<span>dossier standard :</span>'+sug.map(x=>puce('sugac:'+g.ID+':'+x.ID,x.NAMEFR)).join(''):'')+'</div></td></tr>'; } });
    let h='<p class="aide">Initiales : collaborateurs de l’affaire (rubrique Collaborateurs) — en bleu, il peut saisir ses heures sur l’activité ; s’il n’est coché sur aucune activité d’un groupe, il les voit toutes.</p>'
      +'<table class="sg-epo-t"><tr><th>Activité</th><th>Type</th><th>Tarif</th><th class="r">Heures prévues</th><th class="r">CHF prévus</th><th>Collaborateurs</th><th></th></tr>'
      +(rows||vide(7,'Aucune activité : aucune heure ne peut être saisie sur l’affaire.'))+'</table>';
    if(ro) return h+lect('activités');
    const sg=DS.all('activitygroup').slice().sort((a,b)=>(+a.SORTORDER||0)-(+b.SORTORDER||0)).filter(x=>!B.ag.some(g=>cle(g.NAMEFR)===cle(x.NAMEFR)));
    return h+'<div class="sg-epo-sug">'+lien('addag','Groupe d’activités','plus')+(sg.length?'<span>dossier standard :</span>'+sg.map(x=>puce('sugag:'+x.ID,x.NAMEFR,actsStd(x).length)).join(''):'')+'</div>'; }
  function htmlTarifs(){ const ro=!DR.rg; let rows='';
    niveaux().forEach(g=>{ const c=enVigueur(g), n=nbActsTarif(g);
      rows+='<tr><td>'+inT('rg:'+g.ID+':NAMEFR',g.NAMEFR,ro,{ph:'Nom du niveau'})+'</td><td class="r">'+(c?inN('rt:'+c.ID+':RATE',c.RATE,ro):inN('rtg:'+g.ID,null,ro))+'</td><td>'+(c?inD('rt:'+c.ID+':VALIDFROM',c.VALIDFROM,ro):'')+'</td>'
        +'<td class="r">'+(n||'')+'</td><td class="act">'+(ro||!c?'':lien('addrt:'+g.ID,'Taux daté','plus'))+'</td><td class="act">'+(ro?'':ic('delrg:'+g.ID,X,'Supprimer le niveau'))+'</td></tr>';
      tauxDe(g).filter(r=>r!==c).forEach(r=>{ const fut=S(r.VALIDFROM||'').slice(0,10)>AUJ;
        rows+='<tr class="ss"><td><span class="sg-epo-fl'+(fut?'':' passe')+'">↳ '+(fut?'nouveau taux':'ancien taux')+'</span></td><td class="r">'+inN('rt:'+r.ID+':RATE',r.RATE,ro)+'</td><td>'+inD('rt:'+r.ID+':VALIDFROM',r.VALIDFROM,ro)+'</td><td></td><td></td>'
          +'<td class="act">'+(ro?'':ic('delrt:'+r.ID,X,'Supprimer ce taux'))+'</td></tr>'; }); });
    const h='<p class="aide">Tarifs horaires de facturation de l’affaire, par niveau (honoraires selon les activités). Un taux daté remplace le précédent dès sa date, par exemple pour l’indexation.</p>'
      +'<table class="sg-epo-t"><tr><th>Niveau</th><th class="r">Tarif CHF/h</th><th>Valable dès le</th><th class="r">Activités</th><th></th><th></th></tr>'+(rows||vide(6,'Aucun tarif.'))+'</table>';
    if(ro) return h+lect('tarifs de facturation');
    const st=tarifsStd();
    return h+'<div class="sg-epo-sug">'+lien('addrg','Niveau','plus')+(st.length?'<span>dossier standard :</span>'+st.map(r=>puce('sugrg:'+r.ID,r.NAMEFR,fmt(r.RATE))).join('')+(st.length>1?lien('stdrg','Tous les ajouter'):''):'')+'</div>'; }
  const ZONES={phases:htmlPhases,activites:htmlActivites,tarifs:htmlTarifs};
  function rendre(...ks){ if(!corps) return; const af=document.activeElement, fk=af&&corps.contains(af)&&af.dataset?af.dataset.of:null, bd=D&&D.bd, st=bd?bd.scrollTop:0;
    let ss=null; try{ if(fk&&af.selectionStart!=null) ss=[af.selectionStart,af.selectionEnd]; }catch(_){}
    (ks.length?ks:Object.keys(ZONES)).forEach(k=>{ const z=corps.querySelector('[data-epo="'+k+'"]'); if(z) z.innerHTML=ZONES[k](); });
    flash=null; const cible=foc||fk; foc=null;
    if(cible){ const n=corps.querySelector('[data-of="'+cible+'"]'); if(n){ n.focus({preventScroll:true}); if(cible===fk&&ss) try{ n.setSelectionRange(ss[0],ss[1]); }catch(_){} } }
    if(bd) bd.scrollTop=st; }

  /* ── modifications du brouillon ── */
  const NUMS=new Set(['NUMBER','TIMEBUDGET','TIMEAMOUNTBUDGET','COSTBUDGET','RATE','TYPECODE']);
  function maj(f,v){ if(f==='tarifnet'){ tarifNet=numv(v); return ''; }
    const [k,id,ch]=f.split(':');
    if(k==='rtg'){ const g=B.rg.find(x=>S(x.ID)===id), n=numv(v); if(!g||n==null) return ''; const c=enVigueur(g);
      if(c) c.RATE=n; else B.rt.push({ID:tmp(),RATE:n,VALIDFROM:AUJ,PROJECTRATEGROUP_ID:g.ID}); return 'tarifs activites'; }
    const x=(B[k]||[]).find(r=>S(r.ID)===id); if(!x) return '';
    if(ch==='PROJECTRATEGROUP_ID') x[ch]=v===''?null:estN(v)?v:+v;
    else if(NUMS.has(ch)) x[ch]=numv(v);
    else if(ch==='VALIDFROM') x[ch]=v||null;
    else x[ch]=S(v).trim();
    if(k==='sp'&&PHK.includes(ch)){ const f0=B.ph.find(y=>S(y.ID)===S(x.PROJECTPHASE_ID)); if(f0) sommePh(f0); }
    if(k==='ac'&&(ch==='TIMEBUDGET'||ch==='TIMEAMOUNTBUDGET')){ const g=groupeDe(x); if(g) sommeAg(g); }
    return {ph:'phases',sp:'phases',ag:'activites',ac:'activites',rg:'tarifs activites',rt:'tarifs activites'}[k]||''; }
  function action(a){ const [k,x,y]=a.split(':'), trouve=(arr,i)=>arr.find(r=>S(r.ID)===S(i));
    if(k==='reprendre'){ reprendre(); return 'phases'; }
    if(k==='lock'){ const s=trouve(B.sp,x); if(s) s.ISTERMINATED=+s.ISTERMINATED===1?0:1; return 'phases'; }
    if(k==='addph'){ const f={ID:tmp(),TIMEBUDGET:null,NUMBER:B.ph.reduce((m,r)=>Math.max(m,(+r.NUMBER||0)+1),0),NAMEFR:'',PROJECT_ID:pid,TIMEAMOUNTBUDGET:null,COSTBUDGET:null}; B.ph.push(f); foc='ph:'+f.ID+':NAMEFR'; return 'phases'; }
    if(k==='addsp'){ const f=trouve(B.ph,x); if(!f) return ''; const L=sousDe(f), s=nouvSous(f,L.length?Math.max(...L.map(r=>+r.NUMBER||0))+1:(+f.NUMBER||0)*10+1,''); foc='sp:'+s.ID+':NAMEFR'; return 'phases'; }
    if(k==='stdph'){ inserePhases(); return 'phases'; }
    if(k==='delsp'){ const s=trouve(B.sp,x); if(!s) return ''; const u=phUsage('projectsubphase',s); if(u){ toast('« '+libPh(s)+' » ne peut pas être supprimée : '+u+'.',true); return ''; }
      const f=trouve(B.ph,s.PROJECTPHASE_ID); ote(B.sp,r=>r===s); if(f) sommePh(f); return 'phases'; }
    if(k==='delph'){ const f=trouve(B.ph,x); if(!f) return '';
      for(const r of [f,...sousDe(f)]){ const u=phUsage(r===f?'projectphase':'projectsubphase',r); if(u){ toast('« '+libPh(r)+' » ne peut pas être supprimée : '+u+'.',true); return ''; } }
      ote(B.sp,r=>S(r.PROJECTPHASE_ID)===S(f.ID)); ote(B.ph,r=>r===f); return 'phases'; }
    if(k==='addag'){ const g=nouvGroupe(''); foc='ag:'+g.ID+':NAMEFR'; return 'activites'; }
    if(k==='sugag'){ const gs=DS.get('activitygroup',+x); if(gs) groupeStd(gs); return 'activites'; }
    if(k==='addac'){ const g=trouve(B.ag,x); if(!g) return ''; const n=nouvActivite(g,'',0); foc='ac:'+n.ID+':NAMEFR'; return 'activites'; }
    if(k==='sugac'){ const g=trouve(B.ag,x), st=DS.get('activity',+y); if(g&&st) nouvActivite(g,st.NAMEFR,st.TYPECODE||0); return 'activites'; }
    if(k==='delac'){ const n=trouve(B.ac,x); if(!n) return ''; const u=acUsage(n); if(u){ toast('« '+(n.NAMEFR||'Activité')+' » ne peut pas être supprimée : '+u+'.',true); return ''; }
      const g=groupeDe(n); otePermis(n); ote(B.ac,r=>r===n); if(g) sommeAg(g); return 'activites tarifs'; }
    if(k==='delag'){ const g=trouve(B.ag,x); if(!g) return ''; const u=agUsage(g); if(u){ toast('Le groupe « '+(g.NAMEFR||'')+' » ne peut pas être supprimé : '+u+'.',true); return ''; }
      actsDe(g).forEach(otePermis); ote(B.ac,r=>S(r.PROJECTACTIVITYGROUP_ID)===S(g.ID)); ote(B.ag,r=>r===g); return 'activites tarifs'; }
    if(k==='pill'){ const n=trouve(B.ac,x), s=DS.get('staff',+y); if(n&&s) bascule(n,s.ID,staffName(s)); return 'activites'; }
    if(k==='addrg'){ const g=nouvNiveau('',null); foc='rg:'+g.ID+':NAMEFR'; return 'tarifs activites'; }
    if(k==='sugrg'){ const r=DS.get('rate',+x); if(r) nouvNiveau(r.NAMEFR,r.RATE,r.VALIDFROM,r.SORTORDER); return 'tarifs activites'; }
    if(k==='stdrg'){ tarifsStd().forEach(r=>nouvNiveau(r.NAMEFR,r.RATE,r.VALIDFROM,r.SORTORDER)); return 'tarifs activites'; }
    if(k==='addrt'){ const g=trouve(B.rg,x); if(!g) return ''; const c=enVigueur(g), d=(+AUJ.slice(0,4)+1)+'-01-01';
      let r=tauxDe(g).find(t=>S(t.VALIDFROM||'').slice(0,10)===d); if(!r){ r={ID:tmp(),RATE:c?c.RATE:null,VALIDFROM:d,PROJECTRATEGROUP_ID:g.ID}; B.rt.push(r); } foc='rt:'+r.ID+':RATE'; return 'tarifs'; }
    if(k==='delrt'){ ote(B.rt,r=>S(r.ID)===S(x)); return 'tarifs activites'; }
    if(k==='delrg'){ const g=trouve(B.rg,x); if(!g) return ''; const n=nbActsTarif(g);
      if(n){ toast('Le niveau « '+(g.NAMEFR||'')+' » est le tarif de '+n+' activité'+(n>1?'s':'')+' : choisissez d’abord un autre tarif pour '+(n>1?'elles':'elle')+'.',true); return ''; }
      ote(B.rt,r=>S(r.PROJECTRATEGROUP_ID)===S(g.ID)); ote(B.rg,r=>r===g); return 'tarifs activites'; }
    return ''; }
  function brancher(c,d){ corps=c; D=d;
    corps.addEventListener('click',e=>{ const b=e.target.closest('[data-oa]'); if(!b||!corps.contains(b)||b.disabled) return; e.preventDefault(); const z=action(b.dataset.oa); if(z) rendre(...z.split(' ')); });
    corps.addEventListener('change',e=>{ const t=e.target; if(!t.dataset||t.dataset.of==null) return; const z=maj(t.dataset.of,t.value); if(z) setTimeout(()=>rendre(...z.split(' ')),0); });
    corps.addEventListener('keydown',e=>{ if(e.key==='Enter'&&e.target.dataset&&e.target.dataset.of!=null&&e.target.tagName==='INPUT'){ e.preventDefault(); e.target.blur(); } });
    if(typeof fxEnsure==='function') fxEnsure().then(()=>rendre('phases')).catch(()=>null);
    rendre(); }

  /* ── enregistrement : nouvelles lignes vides retirées, noms obligatoires, puis opérations (rien si rien n'a changé) ── */
  function nettoie(){ const sansNom=x=>!S(x.NAMEFR||'').trim();
    ote(B.sp,s=>estN(s.ID)&&sansNom(s)&&PHK.every(k=>s[k]==null));
    ote(B.ph,f=>estN(f.ID)&&sansNom(f)&&PHK.every(k=>f[k]==null)&&!sousDe(f).length);
    B.ac.filter(a=>estN(a.ID)&&sansNom(a)&&a.TIMEBUDGET==null&&a.TIMEAMOUNTBUDGET==null).forEach(a=>{ otePermis(a); ote(B.ac,r=>r===a); });
    ote(B.ag,g=>estN(g.ID)&&sansNom(g)&&!actsDe(g).length);
    ote(B.rt,r=>estN(r.ID)&&r.RATE==null);
    ote(B.rg,g=>estN(g.ID)&&sansNom(g)&&!tauxDe(g).length); }
  function valider(){ nettoie();   /* la saisie en cours est déjà prise : « change » part avant le clic sur Enregistrer */
    const L=[['ph','phases','Une phase'],['sp','phases','Une phase partielle'],['ag','activites','Un groupe d’activités'],['ac','activites','Une activité'],['rg','tarifs','Un niveau de tarif']];
    for(const [k,z,lib] of L){ const x=B[k].find(r=>!S(r.NAMEFR||'').trim()&&change(k,r)); if(!x) continue;
      toast(lib+' n’a pas de nom.',true); foc=k+':'+x.ID+':NAMEFR'; rendre(z); const n=corps.querySelector('[data-of="'+k+':'+x.ID+':NAMEFR"]'); if(n) n.scrollIntoView({block:'center'}); return false; }
    return true; }
  function ops(projetId){ const R=[], id={}, m=x=>x==null?x:id[S(x)]!=null?id[S(x)]:x;
    const alloue=(t,arr)=>{ const L=arr.filter(x=>estN(x.ID)); if(!L.length) return; const ids=DS.newIds(t,L.length); L.forEach((x,i)=>{ id[S(x.ID)]=ids[i]; }); };
    [['projectphase','ph'],['projectsubphase','sp'],['projectrategroup','rg'],['projectrate','rt'],['projectactivitygroup','ag'],['projectactivity','ac']].forEach(([t,k])=>alloue(t,B[k]));
    const ecrit=(t,k,fix)=>B[k].forEach(x=>{ if(!change(k,x)) return; const r=fix(Object.assign({},x,{ID:m(x.ID)})); R.push({t,id:r.ID,val:r}); });
    ecrit('projectphase','ph',r=>Object.assign(r,{PROJECT_ID:projetId}));
    ecrit('projectsubphase','sp',r=>Object.assign(r,{PROJECTPHASE_ID:m(r.PROJECTPHASE_ID)}));
    ecrit('projectrategroup','rg',r=>Object.assign(r,{PROJECT_ID:projetId}));
    ecrit('projectrate','rt',r=>Object.assign(r,{PROJECTRATEGROUP_ID:m(r.PROJECTRATEGROUP_ID)}));
    ecrit('projectactivitygroup','ag',r=>Object.assign(r,{PROJECT_ID:projetId}));
    ecrit('projectactivity','ac',r=>Object.assign(r,{PROJECTACTIVITYGROUP_ID:m(r.PROJECTACTIVITYGROUP_ID),PROJECTRATEGROUP_ID:m(r.PROJECTRATEGROUP_ID)}));
    B.st.forEach(c=>{ if(O.st.has(c)) return; const a=m(actDeCle(c)), s=+staffDeCle(c); R.push({t:'projectactivity_staff',id:a+'-'+s,val:{PROJECTACTIVITY_ID:a,STAFFS_ID:s}}); });
    O.st.forEach(c=>{ if(!B.st.has(c)) R.push({t:'projectactivity_staff',id:c,val:null}); });
    [['projectactivity','ac'],['projectactivitygroup','ag'],['projectrate','rt'],['projectrategroup','rg'],['projectsubphase','sp'],['projectphase','ph']].forEach(([t,k])=>{   /* suppressions : enfants d'abord */
      O[k].forEach((_,i)=>{ if(!B[k].some(x=>S(x.ID)===i)) R.push({t,id:isNaN(+i)?i:+i,val:null}); }); });
    return R; }
  return {brancher,rendre,valider,ops,majEquipe:()=>rendre('activites'),majNumero:()=>{ if(!pid) rendre('phases'); }}; }

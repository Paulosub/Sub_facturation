/* ═══ 54. En-tête de l'app au-dessus des écrans de l'ancien logiciel (refonte d'ensemble, lot 3, 15.11.2026) ═══
   Demande de Paulo du 15.11.2026 : « refonte complète de l'app pour avoir une cohérence des éléments de l'app identique aux éléments définis dans l'app notamment dans
   devis » ; ordre des lots accepté (« Oui, cet ordre ») : après les en-têtes des pages de l'app, les écrans de l'ancien logiciel, chapitre par chapitre.
   Depuis le 15.11.2026 au soir, les trois listes des membres de l'équipe ont leur propre page (fin du fichier) et ne sont plus dans LISTE.
   Première étape, commune à tous : ces écrans (LISTE) reçoivent le bandeau des listes — monogramme, chapitre, titre et présentation repris du menu (SG_DOM : t, d,
   grp), chiffres quand ils sont simples (CHIFFRES) — par sgTete (sg3.js). Le bandeau est posé AU-DESSUS de la barre contextuelle (#sg-mv, avant #nx-sub), hors de
   #main : le moteur vide et redessine #main à sa guise, rien n'y est ajouté ; ordre de la page = bandeau, chiffres, barre d'outils, contenu, comme les listes de l'app.
   Les écrans gardent leurs fonctions et leurs données ; leur contenu (colonnes, tableaux) sera repris chapitre par chapitre. Pas ici : Archives, Estimations
   (liste et document ouvert à refaire ensemble), écrans de Facturation, pages déjà réglées avec Paulo (Mes projets, Liste des affaires, Annuaire, Liste des adresses). */
(function(){
if(typeof go!=='function'||typeof NX_VIEW==='undefined'||typeof sgTete!=='function') return;
const LISTE=new Set(['mg-heures','mg-planning','mg-collab','mg-controlling','mg-contrats','mg-factures','fact-controle','mg-mo','mg-reporting','mg-genres',
  'tpl-documents','tpl-projectTemplates','tpl-staffTemplates','tpl-timeTemplates','tpl-expensesTemplates','tpl-managementTemplates','tpl-addressTemplates','tpl-labelTemplates','config']);
const fig=(v,t)=>'<div class="sg-fig"><div class="n">'+nxE(String(v))+'</div><div class="t">'+nxE(t)+'</div></div>';
const isoJ=v=>{ if(v==null||v==='') return ''; if(typeof v==='number') return new Date(v).toISOString().slice(0,10); return String(v).slice(0,10); };
/* chiffres simples, lus dans la base à chaque dessin */
const modeles=()=>{ let n=0; try{ n=Object.values((DS.T&&DS.T.modeledocument)||{}).filter(v=>v&&(v.langue==='fr'||!v.langue)).length; }catch(_){ } return n?fig(n,'documents types'):''; };
/* chiffres de la sélection en cours (affaire, année, maître de l'ouvrage) : mêmes fonctions que les tableaux du moteur, donc mêmes totaux ; gardés en mémoire jusqu'au
   prochain changement de la base (ver) */
let ver=0; try{ DS.on(()=>{ ver++; }); }catch(_){ }
const MEM=new Map(), memo=(k,fn)=>{ const c=MEM.get(k); if(c&&c[0]===ver) return c[1]; const r=fn(); if(MEM.size>60) MEM.clear(); MEM.set(k,[ver,r]); return r; };
const kp=(l,v,s,c,ti)=>'<div class="nx-kpi"'+(ti?' title="'+nxE(ti)+'"':'')+'><div class="l">'+nxE(l)+'</div><div class="v'+(c?' '+c:'')+'">'+v+'</div>'+(s?'<div class="s">'+nxE(s)+'</div>':'')+'</div>';
const kps=L=>{ const x=L.filter(Boolean); return x.length?'<div class="nx-kpis sg-tkp">'+x.join('')+'</div>':''; };
const hU=v=>v==null||v===''?'—':nxH(v)+'<small>h</small>', cU=v=>v==null||v===''?'—':nxCHF(v)+'<small>CHF</small>', sg=v=>v==null?'':v<-0.004?'neg':v>0.004?'posi':'';
const totalDe=M=>{ const R=(M&&M.rows)||[]; for(let i=R.length-1;i>=0;i--) if(R[i]&&R[i].tot) return R[i].c; return null; };
const chHeures=()=>{ const st=MGH.st, p=MGH.pg.sel!=null?DS.get('project',MGH.pg.sel):null, sub=+MGH.sg.sel||null, F=MGH.rf;
  const n=memo('mgh-n'+st,()=>DS.all('project').filter(x=>x.PROJECTSTATECODE===st).length);
  let c=null; if(p){ try{ c=totalDe(memo(['mgh',p.ID,sub,F.on,F.y1,F.m1,F.y2,F.m2,MGH.all].join('|'),()=>mghModels(p,sub))[MGH.type]); }catch(e){ console.error(e); } }
  const qui=p?String(p.NUMBER||p.TITLE||''):'choisir un projet', st_=MGH.type==='st';
  return kps([kp({2:'Projets en cours',4:'Projets terminés',5:'Projets archivés'}[st]||'Projets',String(n)),
    kp('Heures prévues',hU(c&&!st_?c[1]:null),qui,'',st_?'Le tableau par collaborateur n’a pas d’heures prévues : choisir Activités ou Phases.':MGH.type==='ph'?'Heures au contrat des phases du projet':'Heures prévues des groupes d’activités du projet'),
    kp('Heures saisies',hU(c&&c[2]),F.on?mgRFper(F):''),
    kp('Solde',hU(c&&!st_?c[3]:null),c&&!st_?(c[3]<0?'heures au-delà du prévu':'heures restantes'):'',c&&!st_?sg(c[3]):''),
    kp('Facturable',cU(c&&c[4]),c?'selon les tarifs des activités':'')]); };
const chSuiviRH=()=>{ const y=MGC.y, T=memo('mgc'+y,()=>{ const an=k=>{ const c=totalDe(mgcModel(k)); return c?+c[c.length-1]||0:null; }; let r={}; try{ r={hs:an('hs'),dp:an('dp'),sol:an('sol'),vac:an('vac')}; }catch(e){ console.error(e); } return r; });
  const nA=memo('mgc-n',()=>DS.all('staff').filter(s=>+s.ISACTIVE).length);
  return kps([kp('Membres actuels',String(nA)),kp('Heures saisies '+y,hU(T.hs),'vacances comprises'),kp('Durée prévue '+y,hU(T.dp)),kp('Solde '+y,hU(T.sol),T.sol==null?'':'saisies moins prévues'),kp('Vacances saisies '+y,hU(T.vac))]); };
const chClients=()=>{ const c=MGM.lg.sel!=null?DS.get('contact',MGM.lg.sel):null, n=memo('mgm-n',()=>new Set(DS.all('projectmember').filter(x=>x.TEAMROLECODE===8&&x.CONTACT_ID!=null&&DS.get('contact',x.CONTACT_ID)).map(x=>x.CONTACT_ID)).size);
  let M=null; if(c){ try{ M=memo('mgm|'+c.ID+'|'+MGM.st,()=>mgmModel(c)); }catch(e){ console.error(e); } }
  const T=M?M.rows.filter(r=>r.tot):[], un=T.length===1?T[0].c:null, qui=c?contactName(c):'choisir un maître de l’ouvrage', etat=MGM.st==null?'toutes':String(PSTATE[MGM.st]||'').toLowerCase();
  return kps([kp('Maîtres de l’ouvrage',String(n)),kp('Projets',M?String(M.nb||0):'—',c?qui+' · '+etat:qui),kp('Heures prévues',hU(un&&un[2])),kp('Facturable',cU(un&&un[3]),T.length>1?'plusieurs monnaies : voir le tableau':''),
    (typeof sgTauxVisibles!=='function'||sgTauxVisibles())?kp('Coût de revient',cU(un&&un[5])):'']); };
const chGenres=()=>{ const k=MGK.kg.sel!=null?DS.get('projectkind',MGK.kg.sel):null, N=memo('mgk-n',()=>({g:DS.all('projectgroup').length,k:DS.all('projectkind').length,p:new Set(DS.all('project_projectkind').map(l=>l.PROJECT_ID)).size}));
  let n=null; if(k){ try{ n=mgkModel().list.length; }catch(_){ } }
  return kps([kp('Groupes',String(N.g)),kp('Genres',String(N.k)),kp('Projets classés',String(N.p),'au moins un genre'),kp('Projets du genre',n==null?'—':String(n),k?nm(k):'choisir un genre')]); };
const chFactures=()=>{ const T=memo('fc',()=>{ const r={n:[0,0,0,0],m:[0,0,0,0],tot:0}; FC_CATS.forEach(([c],i)=>{ if(c==='all'){ r.tot=fcRows(c).length; return; } const L=fcRows(c); r.n[i]=L.length; r.m[i]=L.reduce((s,f)=>s+(+f.AMOUNT||0)-(+f.AMOUNTPAID||0),0); }); return r; });
  return kps([kp('Planifiées',String(T.n[0])),kp('Envoyées',String(T.n[1]),T.n[1]?nxCHF(T.m[1])+' à encaisser':''),kp('Rappels envoyés',String(T.n[2]),T.n[2]?nxCHF(T.m[2])+' à encaisser':'',T.n[2]?'neg':''),kp('Payées',String(T.n[3])),kp('Toutes',String(T.tot),T.tot!==T.n[0]+T.n[1]+T.n[2]+T.n[3]?'projets archivés ou en configuration compris':'')]); };
/* ── Finances : Controlling (année affichée), Contrats des projets, Facturation des projets (année affichée) — mêmes filtres et mêmes fonctions que les tableaux du moteur ── */
const chControlling=()=>{ const y=MGT.y, T=memo('mgt'+y,()=>{ const R=mgRates(), S=new Set(), P=new Set(); let tp=0, amt=0, cost=0;
    DS.all('timelog').forEach(t=>{ if(t.PROJECT_ID==null||t.STAFF_ID==null||t.TIMEYEAR!==y||!DS.get('project',t.PROJECT_ID)) return; tp+=+t.TIMEPERIOD||0; if(t.ISCHARGEABLE) amt+=R.fee(t); cost+=R.cost(t); S.add(t.STAFF_ID); P.add(t.PROJECT_ID); });
    return {tp,amt,cost,s:S.size,p:P.size}; });
  return kps([kp('Heures saisies '+y,hU(T.tp)),kp('Facturable '+y,cU(T.amt),'selon les tarifs des activités'),(typeof sgTauxVisibles!=='function'||sgTauxVisibles())?kp('Coût de revient '+y,cU(T.cost)):'',kp('Collaborateurs',String(T.s),'avec des heures en '+y),kp('Projets',String(T.p),'avec des heures en '+y)]); };
const chContratsProjets=()=>{ const T=memo('ctp',()=>{ const C=DS.all('projectcontract'), st=k=>C.filter(c=>(+c.STATECODE||0)===k), mo=st(1).filter(c=>!c.ISSUBCONTRACT);
    return {n:C.length,v:st(1).length,t:st(0).length,r:st(2).length,sub:C.filter(c=>c.ISSUBCONTRACT).length,amt:mo.reduce((a,c)=>a+(+c.CONTRACTAMOUNT||0),0),p:new Set(C.map(c=>c.PROJECT_ID)).size}; });
  return kps([kp('Contrats',String(T.n),T.p+(T.p>1?' projets':' projet')),kp('Validés',String(T.v)),kp('En traitement',String(T.t),T.r?T.r+(T.r>1?' refusés':' refusé'):''),kp('Montant validé',cU(T.amt),'contrats du maître de l’ouvrage'),kp('Sous-traitants',String(T.sub),'contrats de sous-traitance')]); };
const chFacturesProjets=()=>{ const y=CH11B.an.y, T=memo('ch11b'+y,()=>{ let tot=[], n=0; try{ tot=ch11bYear(y).rows.filter(r=>r.k==='tot').map(r=>r.v); n=DS.all('projectinvoice').filter(f=>ch11bD10(f.INVOICEDATE).slice(0,4)===String(y)).length; }catch(e){ console.error(e); } return {tot,n}; });
  const un=T.tot.length===1?T.tot[0]:null, plus=T.tot.length>1?'plusieurs monnaies : voir le tableau':'';
  return kps([kp('Factures '+y,String(T.n)),kp('Facturé '+y,cU(un&&un[2]),plus),kp('Encaissé '+y,cU(un&&un[3])),kp('Solde à encaisser',cU(un&&un[4]),un?'factures de '+y:'',un&&un[4]>0.004?'neg':'')]); };
/* ── Écrans de Facturation (lot 4, 15.11.2026 ; Paulo, à la question posée : « Oui, bandeau seul ») : ses écrans restent tels quels dans leur cadre, le bandeau et les
   chiffres de l'app sont posés au-dessus. Chiffres calculés avec les définitions des cockpits de Facturation elles-mêmes (lues dans le cadre : facture comptée = non
   annulée, montant = honoraires TTC sans les frais, encaissée = « Payée » ou date de paiement, contrat en cours = ni annulé, ni terminé, ni archivé) : ils égalent ceux
   du Cockpit. Saisie de facture et Calcul d'honoraires : bandeau au numéro de l'affaire et chiffres du contrat ENREGISTRÉ (facturé, encaissé, reste à facturer) —
   jamais les valeurs en cours de saisie, que le formulaire montre lui-même. Finances verrouillées par le code d'accès : pas de chiffres. ── */
const verrou=()=>{ try{ return typeof sgFinVerrou==='function'&&sgFinVerrou(); }catch(_){ return false; } };
const fxW=()=>{ try{ return typeof FX!=='undefined'&&FX.ready&&FX.w?FX.w:null; }catch(_){ return null; } };
const fxK=()=>{ const w=fxW(); if(!w) return null; try{ return w.eval('({ckFactOk,ckTTC,ckPayee,ckContratTTC,ckEnCours,ckBase,ckReste})'); }catch(_){ return null; } };
const fxVal=id=>{ const w=fxW(), e=w&&w.document.getElementById(id); return e?String(e.value||''):''; };
const fxC=id=>{ const D=id?fxData():null; return D?D.c.find(c=>String(c.id)===String(id))||null:null; };
const pls=(n,a,b)=>n+' '+(n>1?b:a);
const chFxContrats=()=>{ if(verrou()) return ''; const D=fxData(), K=fxK(); if(!D||!K) return '';
  const C=D.c, cours=C.filter(K.ckEnCours), B=K.ckBase(), R=K.ckReste(B.parC), sig=C.filter(c=>c.signe&&!c.annule), env=C.filter(c=>c.envoye&&!c.signe&&!c.annule&&!c.termine);
  return kps([kp('Contrats en cours',String(cours.length),'sur '+pls(C.length,'contrat','contrats'),'','Contrats ni annulés, ni terminés, ni archivés'),kp('Signés',String(sig.length)),kp('Envoyés, non signés',String(env.length),env.length?'en attente de signature':''),
    kp('Honoraires en cours',cU(cours.reduce((a,c)=>a+K.ckContratTTC(c),0)),'TTC, contrats en cours'),kp('Reste à facturer',cU(R.reduce((a,r)=>a+r.reste,0)),'TTC, contrats en cours','','Contrats en cours : montant du contrat moins ce qui est facturé, si positif — le chiffre du Cockpit')]); };
const chFxFactures=()=>{ if(verrou()) return ''; const D=fxData(), K=fxK(); if(!D||!K) return ''; const F=D.f.filter(K.ckFactOk), y=new Date().getFullYear(), td=today(), an=d=>{ const m=/^(\d{4})/.exec(String(d||'')); return m?+m[1]:null; };
  const fy=F.filter(f=>an(f.date)===y), ey=F.filter(f=>K.ckPayee(f)&&an(f.date_paiement||f.date)===y), ouv=F.filter(f=>!K.ckPayee(f)), ech=ouv.filter(f=>f.ech&&f.ech<td), S=L=>L.reduce((a,f)=>a+K.ckTTC(f),0);
  return kps([kp('Factures',String(F.length),fy.length+' en '+y),kp('Facturé '+y,cU(S(fy)),'honoraires TTC'),kp('Encaissé '+y,cU(S(ey)),'honoraires TTC'),
    kp('Ouvertes',cU(S(ouv)),pls(ouv.length,'facture non payée','factures non payées')),kp('Échues',cU(S(ech)),ech.length?pls(ech.length,'facture à relancer','factures à relancer'):'aucune',ech.length?'neg':'')]); };
const chFxContrat=c=>{ const D=fxData(), K=fxK(); if(!c||!D||!K) return null; const F=D.f.filter(f=>K.ckFactOk(f)&&String(f.contrat_id)===String(c.id)), S=L=>L.reduce((a,f)=>a+K.ckTTC(f),0);
  return {K,F,ctr:K.ckContratTTC(c),fact:S(F),enc:S(F.filter(K.ckPayee)),ouv:F.filter(f=>!K.ckPayee(f)).length}; };
const chFxSaisie=()=>{ if(verrou()) return ''; const X=chFxContrat(fxC(fxVal('f_contrat'))); if(!X) return ''; const r=X.ctr-X.fact;
  return kps([kp('Contrat',cU(X.ctr),'honoraires TTC'),kp('Facturé à ce jour',cU(X.fact),X.ctr>0?Math.round(X.fact/X.ctr*100)+' % du contrat':'','','Factures enregistrées du contrat, honoraires TTC sans les frais'),kp('Encaissé',cU(X.enc)),
    kp('Reste à facturer',cU(r),r<-0.5?'facturé au-delà du contrat':'',r<-0.5?'neg':''),kp('Factures',String(X.F.length),X.ouv?pls(X.ouv,'ouverte','ouvertes'):'toutes payées')]); };
const chFxCalc=()=>{ if(verrou()) return ''; const c=fxC(fxVal('ch_target')), X=chFxContrat(c); if(!X) return ''; let I={}; try{ I=sgContratInfo(c); }catch(_){ }
  return kps([kp('État',nxE(I.etat||'—'),I.nature||'','txt'),kp('Version',String(I.v||1),I.versions>1?'sur '+I.versions:''),kp('Factures',String(X.F.length),X.ouv?pls(X.ouv,'ouverte','ouvertes'):''),
    kp('Facturé à ce jour',cU(X.fact),'honoraires TTC','','Factures enregistrées du contrat, honoraires TTC sans les frais'),kp('Encaissé',cU(X.enc))]); };
const CHIFFRES={'tpl-documents':modeles,'mg-heures':chHeures,'mg-collab':chSuiviRH,'mg-mo':chClients,'mg-genres':chGenres,'fact-controle':chFactures,
  'mg-controlling':chControlling,'mg-contrats':chContratsProjets,'mg-factures':chFacturesProjets,'fx-contrats':chFxContrats,'fx-factures':chFxFactures,'fx-saisie':chFxSaisie,'fx-calchono':chFxCalc};
/* bandeau propre à l'écran (numéro de l'affaire, facture ou contrat ouvert) : {mono, lbl, titre, txt} ; rien = bandeau du menu */
const TETES={
  'fx-saisie':()=>{ const c=fxC(fxVal('f_contrat')); if(!c) return null; const w=fxW(), num=fxVal('f_num'); let enr=true; try{ enr=!!w.eval('typeof faFactureEnregistree==="function"?faFactureEnregistree():true'); }catch(_){ }
    return {mono:String(c.affaire||'').trim()||'SF',lbl:'Administration · Facturation · Saisie de facture',titre:num||'Nouvelle facture',txt:[c.projet,c.nom,enr?'':'facture pas encore enregistrée'].filter(Boolean).join(' · ')}; },
  'fx-calchono':()=>{ const c=fxC(fxVal('ch_target')); if(!c) return null; let I={}; try{ I=sgContratInfo(c); }catch(_){ }
    return {mono:String(c.affaire||'').trim()||'CH',lbl:'Administration · Facturation · Calcul d’honoraires',titre:String(c.projet||'').trim()||'Contrat d’honoraires',txt:[c.nom,I.nature,I.remu].filter(Boolean).join(' · ')}; } };
const COMPACT=new Set(['fx-saisie','fx-calchono']);   /* formulaires : bandeau réduit, la place va à la saisie */
['fx-contrats','fx-calchono','fx-factures','fx-saisie','fx-cockpit','fx-cockpit2','fx-backup'].forEach(v=>{ if(NX_VIEW[v]&&NX_VIEW[v].it) LISTE.add(v); });   /* PV de chantier : pas de bandeau (mode chantier sur tablette) */   /* les trois listes des tâches (sg3_suivi.js) et les trois listes des membres (plus bas) ont leur propre page depuis le 15.11.2026 */
const hote=()=>{ let h=document.getElementById('sg-mv'); if(!h){ const sub=document.getElementById('nx-sub'); if(!sub||!sub.parentNode) return null; h=document.createElement('div'); h.id='sg-mv'; sub.parentNode.insertBefore(h,sub); } return h; };
let cle='';
const maj=()=>{ const h=hote(); if(!h) return; const v=typeof VIEW!=='undefined'&&VIEW?VIEW.id:'', x=LISTE.has(v)?NX_VIEW[v]:null, m=document.getElementById('main'), fx=/^fx-/.test(v);
  const ok=!!(x&&x.it&&m&&!m.querySelector('.sgfh-tete,.sg-tete,.sg-intro'));
  if(!ok){ if(h.firstChild){ h.textContent=''; } cle=''; document.documentElement.removeAttribute('data-vep'); return; }
  if(fx) document.documentElement.removeAttribute('data-vep'); else document.documentElement.setAttribute('data-vep','1');   /* présentation épurée de l'écran (styles html[data-vep] de sg3.css) ; pas pour le cadre Facturation */
  let f=''; try{ f=CHIFFRES[v]?CHIFFRES[v]():''; }catch(e){ console.error(e); }
  let T=null; try{ T=TETES[v]?TETES[v]():null; }catch(e){ console.error(e); }
  const k=v+'|'+f+'|'+(T?JSON.stringify(T):''); if(k===cle&&h.firstChild) return; cle=k;
  h.innerHTML='<div class="sgmv'+(fx?' fx':'')+(COMPACT.has(v)?' compact':'')+'">'+sgTete(T&&T.lbl?T.lbl:[x.d&&x.d.t,x.it.grp].filter(Boolean).join(' · '),nxE(T&&T.titre?T.titre:(x.it.t||'')),nxE(T?(T.txt||''):(x.it.d||'')),
    !f?'':/^<div class="nx-kpis/.test(f)?f:'<div class="sg-figs">'+f+'</div>',T&&T.mono?T.mono:undefined)+'</div>'; };
/* couleurs des graphiques de l'ancien logiciel (MG_COL) → nuancier de la charte, celui du Cockpit de Facturation ; les écrans d'Archives gardent les couleurs d'origine */
const MG0=typeof MG_COL!=='undefined'&&Array.isArray(MG_COL)?MG_COL.slice():null, MG1=['#003346','#4cbab5','#d7860d','#98c21f','#3f4193','#bd1e42','#636e7e','#9d9d9c','#1d1d1b','#c9c9c7','#2e8a85','#7a8fa0'];
const palette=id=>{ if(!MG0) return; let arch=false; try{ const x=NX_VIEW[id]; arch=!!(x&&x.d&&x.d.k==='archives'); }catch(_){ } const P=arch?MG0:MG1; for(let i=0;i<MG0.length;i++) MG_COL[i]=P[i%P.length]; };
{ const g0=go; go=function(){ try{ palette(arguments[0]); }catch(_){ } const r=g0.apply(this,arguments); try{ maj(); }catch(e){ console.error(e); } setTimeout(()=>{ try{ maj(); }catch(_){ } },0); return r; }; }
/* cadre Facturation : ses données changent sans passer par la base du moteur (contrat enregistré, facture payée, autre contrat choisi dans le formulaire) — le bandeau
   est relu toutes les 1,2 s tant qu'un de ses écrans est affiché (rien n'est redessiné si rien n'a changé) */
setInterval(()=>{ try{ const v=typeof VIEW!=='undefined'&&VIEW?VIEW.id:''; if(/^fx-/.test(v)&&LISTE.has(v)&&!document.hidden) maj(); }catch(_){ } },1200);
try{ DS.on(()=>{ setTimeout(()=>{ try{ maj(); }catch(_){ } },0); }); }catch(_){ }
/* ── Lot 3, septième étape (15.11.2026) : les écrans « à catégories » de l'ancien logiciel (liste « Catégorie » ou « Domaine » à gauche) reçoivent des ONGLETS sous le
   bandeau, comme le devis, le contrôle des coûts et la soumission (jamais de menu d'étapes à gauche) : Suivi RH, Controlling, Contrats des projets, Facturation des projets,
   Suivi des factures, Indicateurs, Planification RH, Administration. La liste du moteur reste dessinée, masquée (.sgmv-x) : un onglet clique sa ligne, donc même
   mémoire du dernier choix, mêmes droits (catégories filtrées par le moteur), mêmes fonctions. Écrans à liste de CHOIX (Temps de l'équipe : affaires ; Clients : maîtres
   de l'ouvrage ; Types de projets : genres) : la liste reste à gauche, comme les colonnes de l'app, avec une recherche (lignes masquées à l'écran, sélection inchangée) ;
   Temps de l'équipe : choix du tableau (Activités · Phases · Collaborateurs) en texte à la place de la liste déroulante, liste « Ouvrage » masquée quand l'affaire n'en a
   pas. Rien n'est écrit dans la base ; tout est refait après chaque dessin du moteur (observateur de #main, sans effet hors de ces écrans). ── */
const CATS=new Set(['mg-collab','mg-controlling','mg-contrats','mg-factures','fact-controle','mg-reporting','mg-planning','config']);
const sansAcc=t=>String(t==null?'':t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const QC={};   /* recherche de la colonne de choix, par écran, gardée pendant la séance */
const filtrerCol=(pane,q)=>{ const x=sansAcc(q).trim(); pane.querySelectorAll(':scope>table.g>tbody>tr').forEach(tr=>{ tr.style.display=!x||sansAcc(tr.textContent).includes(x)?'':'none'; }); };
const recherche=(v,L,pane,lib)=>{ if(!L||!pane) return; let bar=L.querySelector(':scope>.ph2'); if(!bar){ bar=document.createElement('div'); bar.className='ph2 sgmv-ph'; L.insertBefore(bar,L.firstChild); }
  let i=bar.querySelector(':scope>.sgmv-q'); if(!i){ i=document.createElement('input'); i.className='psearch sgmv-q'; i.type='search'; i.placeholder='Rechercher'; i.setAttribute('aria-label',lib||'Rechercher dans la liste'); i.value=QC[v]||'';
    i.addEventListener('input',()=>{ QC[v]=i.value; filtrerCol(pane,i.value); }); bar.append(i); }
  if(QC[v]) filtrerCol(pane,QC[v]); };
const enTexte=(sel,court)=>{ if(!sel||sel._sgmv) return; sel._sgmv=1; const g=document.createElement('span'); g.className='sgmv-ch'; g.setAttribute('role','group'); g.setAttribute('aria-label','Tableau affiché');
  [...sel.options].forEach(o=>{ const b=document.createElement('button'); b.type='button'; b.className='ib'+(o.selected?' on':''); b.textContent=court?court(o.textContent):o.textContent; b.title=o.textContent; b.setAttribute('aria-pressed',o.selected?'true':'false');
    b.addEventListener('click',()=>{ if(sel.value===o.value) return; sel.value=o.value; sel.dispatchEvent(new Event('change')); }); g.append(b); });
  sel.classList.add('sgmv-x'); sel.after(g); };
const HAB={
  'mg-heures':cols=>{ const L=cols.firstElementChild, P=L?L.querySelectorAll(':scope>.pane'):[]; recherche('mg-heures',L,P[0],'Rechercher une affaire');
    if(P[1]) P[1].classList.toggle('sgmv-x',!!P[1].querySelector(':scope>.empty'));   /* liste « Ouvrage » : seulement si l'affaire a des ouvrages */
    const sel=[...cols.querySelectorAll('.ph2 select.inp')].find(x=>[...x.options].some(o=>o.value==='ac')&&[...x.options].some(o=>o.value==='st')); enTexte(sel,t=>t.replace(/^Affaires\s*-\s*/,'')); },
  'mg-mo':cols=>{ const L=cols.firstElementChild; recherche('mg-mo',L,L&&L.querySelector(':scope>.pane'),'Rechercher un maître de l’ouvrage'); },
  'mg-genres':cols=>{ const L=cols.firstElementChild; recherche('mg-genres',L,L&&L.querySelector(':scope>.pane'),'Rechercher un genre'); } };
const onglets=(m,cols)=>{ const pr=cols.previousElementSibling; if(pr&&pr.classList.contains('sgmv-ong')) return;
  const L=cols.firstElementChild; if(!L||!L.classList.contains('col')||L===cols.lastElementChild) return;
  const lignes=()=>[...L.querySelectorAll(':scope>.pane>table.g>tbody>tr')], T=lignes(); if(T.length<2) return;
  const bar=document.createElement('div'), g=document.createElement('div'); bar.className='sgmv-ong'; g.className='sg-onglets'; g.setAttribute('role','tablist'); bar.append(g);
  T.forEach((tr,i)=>{ const b=document.createElement('button'), t=tr.textContent.replace(/\s+/g,' ').trim(), on=tr.classList.contains('on'); b.type='button'; b.textContent=t; b.setAttribute('role','tab'); b.setAttribute('aria-selected',on?'true':'false'); if(on) b.className='on';
    b.addEventListener('click',()=>{ const x=lignes()[i]; if(!x) return; [...g.children].forEach((y,j)=>{ y.classList.toggle('on',j===i); y.setAttribute('aria-selected',j===i?'true':'false'); }); x.click(); }); g.append(b); });
  L.classList.add('sgmv-x'); m.insertBefore(bar,cols); };
/* lignes en gras des tableaux Management (tr.mgb) : titre d'un bloc (première cellule seule) → data-sgm="g", total (« Total … », « 2026 Total ») → "t", autre → "b" ;
   la feuille de style leur donne le graphisme de l'app (titre bleu nuit souligné, total sur trame bleu nuit pâle) à la place des bandes grises */
const marquer=m=>{ m.querySelectorAll('table.g tbody tr.mgb:not([data-sgm])').forEach(tr=>{ const c=[...tr.children], t0=(c[0]?c[0].textContent:'').replace(/\s+/g,' ').trim(), seul=t0!==''&&c.slice(1).every(td=>!td.textContent.trim());
    tr.dataset.sgm=/^Total\b|\bTotal$/i.test(t0)?'t':seul?'g':'b'; }); };
let enCours=false;
const habiller=()=>{ if(enCours) return; const v=typeof VIEW!=='undefined'&&VIEW?VIEW.id:''; if(!LISTE.has(v)||!document.documentElement.hasAttribute('data-vep')) return;
  const m=document.getElementById('main'), cols=m&&m.querySelector(':scope>.cols'); if(!cols) return;
  enCours=true; try{ if(CATS.has(v)) onglets(m,cols); if(HAB[v]) HAB[v](cols); marquer(m); if(CHIFFRES[v]) maj(); }catch(e){ console.error(e); } enCours=false; };
{ const g1=go; go=function(){ const r=g1.apply(this,arguments); try{ habiller(); }catch(e){ console.error(e); } return r; }; }
try{ const m0=document.getElementById('main'); if(m0&&typeof MutationObserver==='function') new MutationObserver(()=>{ const v=typeof VIEW!=='undefined'&&VIEW?VIEW.id:''; if(LISTE.has(v)) habiller(); }).observe(m0,{childList:true,subtree:true}); }catch(_){ }
/* ── Page du projet : domaines de l'ancien logiciel encore sans bandeau (Intervenants, Soumissionnaires, Liste d'adresses, Calcul des coûts) — même étape du lot 3 :
   bandeau du projet (numéro, domaine, désignation, maître de l'ouvrage) et chiffres simples au-dessus du domaine, comme les autres modules de la page du projet ; le
   domaine du moteur est dessiné dessous, dans son propre conteneur (.sgmv-corps), avec la présentation épurée. Seulement dans la page du projet (nx-pdom) : le chapitre
   Affaires et les Archives gardent l'écran d'origine. ── */
const DOMS={'Intervenants':p=>{ let M=[]; try{ M=DS.by('projectmember','PROJECT_ID',p.ID); }catch(_){ } return fig(M.length,'intervenants')+fig(M.filter(x=>+x.TEAMROLECODE===19).length,'entreprises'); },
  'Soumissionnaires':p=>{ let n=0; try{ n=DS.by('projecttenderer','PROJECT_ID',p.ID).length; }catch(_){ } return fig(n,'soumissionnaires'); },
  'Liste d’adresses':null};   /* « Calcul des coûts » : liste des estimations au graphisme de l'app depuis le 15.11.2026 (sg3_estimation.js), avec son propre bandeau */
if(typeof domainView==='function'&&window.SGSV&&SGSV.outils){ const dv0=domainView;
  domainView=function(C,p,dom){ let ok=false; try{ ok=!!(C&&p&&Object.prototype.hasOwnProperty.call(DOMS,dom)&&typeof VIEW!=='undefined'&&VIEW&&VIEW.id==='nx-pdom'); }catch(_){ }
    if(!ok) return dv0.apply(this,arguments);
    const {tete,moT,css}=SGSV.outils; try{ css&&css(); }catch(_){ }
    let f=''; try{ f=DOMS[dom]?DOMS[dom](p):''; }catch(e){ console.error(e); }
    C.innerHTML=''; const hd=document.createElement('div'); hd.className='sgmv-dom';
    hd.innerHTML=sgTete(dom,nxE(p.TITLE||p.NUMBER||''),moT(p)?'Maître de l’ouvrage : '+nxE(moT(p)):'',f?'<div class="sg-figs">'+f+'</div>':'',p.NUMBER||'');
    const corps=document.createElement('div'); corps.className='sgmv-corps'; C.append(hd,corps);
    return dv0.call(this,corps,p,dom); }; }

/* ── Équipe ▸ Membres, Tous les membres, Anciens membres (collab-actuels, collab-tous, collab-anciens ; lot 3, 15.11.2026) : la liste du moteur (barre d'icônes + grille)
   devient la page des listes de l'app (SGSV.outils.monter) — bandeau, chiffres (membres actuels, anciens, arrivées et départs de l'année), choix Actuels · Tous · Anciens
   (= les trois entrées du menu, selon les droits), recherche, tableau (initiales, membre et fonction, appartient à, téléphones, courriel, engagement, départ, heures
   bloquées jusqu'au). Un clic = fiche du membre (nx-collab) ; clic droit = les fonctions de la barre du moteur pour ce membre : Modifier, Coût de revient, Durée prévue,
   Vacances, Disponibilité, Verrouillage des heures, Courriel, Supprimer (mêmes fenêtres : editStaff, staffRates, staffTargets, staffHolidays, staffProjectTimes,
   staffFreeze, mailList, delStaff ; mêmes droits de l'ancien logiciel staffNew / staffEdit / staffDelete, et droit « équipe : taux » du profil) ; ⋯ : courriel aux
   membres affichés, copie, CSV. Ordre du moteur (SORTORDER). DeltaSub.html seul garde l'écran d'origine. ── */
if(window.SGSV&&SGSV.outils&&typeof VIEWS!=='undefined'&&VIEWS['collab-actuels']&&typeof editStaff==='function'){
  const {monter,tete,kpi,btn,menuSous,E,pl,trouve}=SGSV.outils;
  const FIL={'collab-actuels':['Actuels','Membres',s=>!!+s.ISACTIVE],'collab-tous':['Tous','Tous les membres',()=>true],'collab-anciens':['Anciens','Anciens membres',s=>!+s.ISACTIVE]};
  const BES=['staff','contact','contactowner','appuser_staff'];
  const pers=s=>DS.get('contact',s.PERSON_ID)||{};
  const peutEq=k=>{ try{ return (sgAdmin()||sgDroit('equipe','taux'))&&(typeof ch08aCan!=='function'||ch08aCan(k)); }catch(_){ return false; } };
  const vueOk=v=>{ try{ return typeof sgVueOk!=='function'||sgVueOk(v); }catch(_){ return true; } };
  const tel=(c,n)=>{ try{ return phone(c,n)||''; }catch(_){ return ''; } }, app=c=>{ try{ return ownerName(relOf(c),true)||''; }catch(_){ return ''; } };
  const colsX=[{k:'n',t:'Collaborateur',f:s=>E(staffName(s))},{k:'fn',t:'Fonction',f:s=>E(pers(s).COMPANYROLE||'')},{k:'INITIALS',t:'Abréviation'},{k:'rel',t:'Appartient à',f:s=>E(app(pers(s)))},
    {k:'tel',t:'Téléphone',f:s=>E(tel(pers(s),1))},{k:'mob',t:'Téléphone mobile',f:s=>E(tel(pers(s),2))},{k:'mail',t:'Courriel',f:s=>E(pers(s).EMAIL1||'')},{k:'JOININGDATE',t:'Engagement',f:s=>E(dfr(s.JOININGDATE))},{k:'QUITTINGDATE',t:'Départ',f:s=>E(dfr(s.QUITTINGDATE))}];
  const EQUIPE={
    rendre(I){ const u=I.u, v=I.p.VUE, f=FIL[v]||FIL['collab-actuels'], A=DS.all('staff'), y=String(new Date().getFullYear());
      const base=A.filter(f[2]).sort((a,b)=>cmp(+a.SORTORDER||0,+b.SORTORDER||0)||cmp(staffName(a),staffName(b)));
      const L=base.filter(s=>{ const c=pers(s); return trouve(u.q,staffName(s),s.INITIALS,c.COMPANYROLE,c.EMAIL1,tel(c,1),tel(c,2),app(c)); }); I.R=L;
      const nA=A.filter(s=>+s.ISACTIVE).length, an=x=>isoJ(x).slice(0,4)===y, dep=v!=='collab-actuels'||L.some(s=>s.QUITTINGDATE), VV=Object.keys(FIL).filter(vueOk);
      const acts=(peutEq('staffNew')?btn('new','Nouveau membre','plus',1):'')+btn('pres','Présentation ▾','list',0,'Colonnes du tableau : Standard, présentations enregistrées, Personnalisé …')+btn('imp','Imprimer','print',0,'Liste affichée (PDF)')
        +'<button class="nx-btn" data-a="menu" title="Courriel, copier, exporter" aria-label="Courriel, copier, exporter">⋯</button>';
      const cols=sgtabCols('membres');   /* colonnes de la présentation (bloc 57, catalogue « membres », 15.11.2026) */
      return '<div class="sgsv">'+tete('ÉQ','Équipe',f[1],pl(base.length,'membre'),acts)
        +'<div class="nx-kpis sgsv-kp">'+kpi('Membres actuels',String(nA),'')+kpi('Anciens membres',String(A.length-nA),'')+kpi('Arrivées '+y,String(A.filter(s=>an(s.JOININGDATE)).length),'')+kpi('Départs '+y,String(A.filter(s=>an(s.QUITTINGDATE)).length),'')+'</div>'
        +'<div class="sgsv-fil">'+(VV.length>1?VV.map(k=>'<button data-a="vue" data-v="'+k+'" class="'+(k===v?'on':'')+'" aria-pressed="'+(k===v)+'">'+E(FIL[k][0])+'</button>').join(''):'')   /* une seule liste permise (collaborateur, chef de projet) : pas de choix */
        +'<span class="dr"><input class="inp" data-q type="search" style="width:240px" placeholder="Rechercher un membre" aria-label="Rechercher un membre" value="'+E(u.q||'')+'"></span></div>'
        +(L.length?'<table class="nx-tbl sgsv-tb sgmv-eq sgtab-t"><thead>'+sgtabEntete(cols)+'</thead><tbody>'
          +L.map(s=>'<tr data-a="open" data-s="'+E(s.ID)+'"'+(+s.ISACTIVE?'':' class="anc"')+'>'+sgtabCellules(cols,s)+'</tr>').join('')+'</tbody></table>'
          :'<p class="sgsv-rien">'+(u.q?'Aucun membre trouvé.':'Aucun membre dans cette liste.')+'</p>')+'</div>'; },
    action(I,a,tg,e){ const s=tg.dataset.s?DS.get('staff',tg.dataset.s):null;
      if(a==='open'){ if(s&&!(e&&e.detail>1)) go('nx-collab',s.ID); }
      else if(a==='new'){ if(peutEq('staffNew')) editStaff(); }
      else if(a==='vue'){ const v=tg.dataset.v; if(FIL[v]&&(typeof VIEW==='undefined'||!VIEW||VIEW.id!==v)) go(v); }
      else if(a==='pres'){ sgtabMenu('membres',tg,()=>I.dessiner()); }
      else if(a==='imp'){ const v=I.p.VUE, f=FIL[v]||FIL['collab-actuels'], q=I.u.q||''; sgtabImprimer('membres',I.R||[],null,{titre:f[1],lb:'Équipe · Documents',type:'Équipe',sous:q?'« '+q+' »':'',meta:[['Liste',f[1]],['Recherche',q?'« '+q+' »':'']]}); }
      else if(a==='menu'){ const L=I.R||[], t=I.box.querySelector('table.sgtab-t');
        menuSous(tg,[{t:'Courriel aux membres affichés …',dis:!L.length,fn:()=>mailList(L.map(pers).filter(c=>c&&c.ID!=null))},'-',{t:'Copier le tableau',dis:!t,fn:()=>ctCopy(sgCtxTexteTableau(t),'Tableau copié (à coller dans un tableur).')},{t:'Exporter le tableau dans un fichier CSV …',dis:!L.length,fn:()=>sgtabCsv('membres',L,null,'membres')}]); } },
    ctx(I,tg,e){ if(tg.dataset.a!=='open') return false; const s=DS.get('staff',tg.dataset.s); if(!s) return false; const ed=peutEq('staffEdit'), c=pers(s);
      sgMenuAt(e.clientX,e.clientY,[{t:'Fiche du membre',fn:()=>go('nx-collab',s.ID)},
        ...(ed?[{t:'Modifier le membre …',fn:()=>editStaff(s)},'-',{t:'Coût de revient …',fn:()=>staffRates(s)},{t:'Durée prévue …',fn:()=>staffTargets(s)},{t:'Vacances …',fn:()=>staffHolidays(s)},{t:'Disponibilité …',fn:()=>staffProjectTimes(s)},{t:'Verrouillage des heures …',fn:()=>staffFreeze([s])}]:[]),
        '-',{t:'Courriel …',dis:!c.EMAIL1,fn:()=>mailList([c])},
        ...(peutEq('staffDelete')?['-',{t:'Supprimer le membre …',danger:true,fn:()=>delStaff(s)}]:[])]); return true; } };
  Object.keys(FIL).forEach(v=>{ VIEWS[v]={render(m){ monter(m,{ID:'equipe',GLOBAL:1,VUE:v,NUMBER:'',TITLE:''},'equipe',BES,EQUIPE); },refresh(){ }}; });
  window.SGMV_EQ=EQUIPE; }
/* ── Bibliothèque ▸ modèles d'impression (lot 3, huitième étape, 15.11.2026) : Projets types, Profils d'équipe, Horaires types, Notes de frais types, Gestion types,
   Formats d'adresse, Étiquettes — les sept écrans à quatre colonnes de l'ancien logiciel (Groupe | Type de modèle | Modèle | aperçu) prennent la présentation de
   « Documents Substances » (mêmes classes sgds-*, sg3_docsub.js) : à gauche la liste des modèles du groupe choisi (groupes en choix de texte, avec leur nombre de
   modèles ; recherche ; ↑ ↓), à droite le bandeau du modèle (groupe, libellé, nom, type), ses actions — Éditer la page, Nouveau (copie), Modifier (noms), Supprimer,
   Groupes ▾, Fonctions ▾ : les fenêtres du moteur (tplOpenEditor, tplNewModel, tplEditModel, tplDelModel, tplNewGroup, tplSetDefaultGroup, tplRenameGroup,
   tplDelGroup, ch10bTplTools) —, les chiffres (pages, format, éléments de la page, groupes, modèles du groupe), le choix de la page (Page de garde · 1ère page · Page
   suivante…) et l'aperçu en grand (tplPageHTML ; double-clic = éditer la page). Même état que le moteur (TP.g.sel, TP.m.sel, TP.p.sel) : ses fenêtres agissent sur
   le modèle affiché. Modifier = profil « bibliothèque : écriture » (administrateur compris) ; sinon consultation seule. Groupe verrouillé : le moteur refuse et le
   dit, comme avant. Redessin sur place quand la base change (pas de go : défilement et recherche gardés). DeltaSub.html seul garde les quatre colonnes. ── */
if(typeof TPL_CATS!=='undefined'&&typeof tplPageHTML==='function'&&typeof tplModelesOf==='function'&&typeof TP!=='undefined'&&typeof tplKey==='function'){
  const E=nxE, QB={}, CADENAS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" aria-hidden="true"><rect x="5.5" y="11" width="13" height="9"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></svg>';
  const ecrit=()=>{ try{ return sgAdmin()||sgDroit('bibliotheque','ecriture'); }catch(_){ return true; } };
  const groupesDe=cat=>DS.all('modelegroupe').filter(g=>g.categorie===cat).sort((a,b)=>cmp(a.ordre,b.ordre)||cmp(a.groupe,b.groupe));
  const gKey=g=>g.categorie+'/'+g.groupe, gLib=g=>String(g.libelle||g.groupe||'');
  const pagesDe=md=>md?Object.entries(md.langues||{}).filter(([lg])=>lg==='fr'||!md.langues.fr).flatMap(([lg,L])=>Object.keys((L&&L.pages)||{}).sort((a,b)=>cmp(Object.keys(TPL_PAGE_L).indexOf(a),Object.keys(TPL_PAGE_L).indexOf(b))).map(pn=>({k:lg+'|'+pn,lg,pn}))):[];
  const formatP=pg=>{ const W=Math.round(pg.largeur||595), H=Math.round(pg.hauteur||842), a4=(Math.abs(W-595)<=2&&Math.abs(H-842)<=2)||(Math.abs(W-842)<=2&&Math.abs(H-595)<=2); return a4?(W<H?'A4 portrait':'A4 paysage'):W+' × '+H+' pt'; };
  const sansAc=t=>String(t==null?'':t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  const btn=(fn,ico,t,cls,tt,dis)=>'<button type="button" class="nx-btn sm'+(cls?' '+cls:'')+'" data-fn="'+fn+'" title="'+E(tt||t)+'"'+(dis?' disabled':'')+'>'+(ico?nxSvg(ico):'')+'<span>'+E(t)+'</span></button>';
  const kpi=(l,v,t,cls)=>'<div class="nx-kpi"'+(t?' title="'+E(t)+'"':'')+'><div class="l">'+E(l)+'</div><div class="v'+(cls?' '+cls:'')+'">'+E(v)+'</div></div>';
  const monter=(m,id,cat,V)=>{ const x=NX_VIEW[id]||{}, titre=(x.it&&x.it.t)||'Modèles', w=h('div',{class:'sgds sgbm'}); m.append(w);
    const etat=()=>{ const G=groupesDe(cat); if(!TP.g.sel||!G.some(g=>gKey(g)===TP.g.sel)){ const d=typeof tplDefaultGroup==='function'?tplDefaultGroup(cat):null; TP.g.sel=(G.find(g=>g.groupe===d)||G[0]||{categorie:cat,groupe:''}).groupe?gKey(G.find(g=>g.groupe===d)||G[0]):null; }
      const g=G.find(z=>gKey(z)===TP.g.sel)||null, M=g?tplModelesOf(cat).filter(z=>z.groupe===g.groupe).sort((a,b)=>cmp(tplLabel(a),tplLabel(b))||cmp(a.nom,b.nom)):[];
      if(!M.some(z=>tplKey(z)===TP.m.sel)) TP.m.sel=M[0]?tplKey(M[0]):null;
      const md=M.find(z=>tplKey(z)===TP.m.sel)||null, P=pagesDe(md); if(!P.some(r=>r.k===TP.p.sel)) TP.p.sel=(P.find(r=>r.lg==='fr'&&r.pn==='page1')||P[0]||{}).k||null;
      const pr=P.find(r=>r.k===TP.p.sel)||null, pg=pr&&md.langues[pr.lg]&&md.langues[pr.lg].pages[pr.pn]||null; return {G,g,M,md,P,pr,pg}; };
    const liste=S=>{ const q=sansAc(QB[cat]||'').trim(), F=S.M.filter(z=>!q||sansAc(tplLabel(z)+' '+z.nom+' '+z.type).includes(q));
      return {F,html:F.map(z=>'<button type="button" class="sgds-it'+(tplKey(z)===TP.m.sel?' on':'')+'" data-id="'+E(tplKey(z))+'" role="option" title="'+E(tplLabel(z)+' — '+z.nom+' ('+z.type+')')+'"><span class="sgt-ini">'+E(sgMono(tplLabel(z)))+'</span><span class="sgt-nm"><b>'+E(tplLabel(z))+'</b><small>'+E(z.nom||'')+'</small></span></button>').join('')
        ||'<div class="sgds-vide">'+(S.M.length?'Aucun modèle ne correspond à « '+E((QB[cat]||'').trim())+' ».':S.g?'Ce groupe n’a pas encore de modèle.':'Aucun groupe de modèles.')+'</div>'}; };
    const droite=S=>{ const md=S.md, g=S.g, ok=ecrit(), def=g&&typeof tplDefaultGroup==='function'&&tplDefaultGroup(cat)===g.groupe;
      if(!md) return '<div class="sgds-haut"><div class="sgfh-tete"><div class="sgfh-id"><span class="sgfh-ini">'+E(sgMono(titre))+'</span><div class="sgfh-nm"><div class="lb">Bibliothèque</div><h2>'+E(titre)+'</h2><div class="sgfh-meta">'+E((x.it&&x.it.d)||'')+'</div></div></div>'
        +'<div class="sgfh-per sgds-btns">'+(ok?btn('nouveau','plus','Nouveau','','Nouveau modèle, copié d’un modèle existant',!g)+btn('groupes','wrench','Groupes','','Groupes de modèles'):'')+'</div></div></div><div class="sgds-ap"><div class="sgds-msg"><b>'+(g?'Aucun modèle dans ce groupe':'Aucun groupe de modèles')+'</b><span>'+(ok?'Créez un modèle par « Nouveau » (copie d’un modèle existant).':'')+'</span></div></div>';
      const meta=['Nom : '+(md.nom||'—'),'Type : '+md.type,g&&g.verrouille?'groupe en lecture seule':'',def?'groupe par défaut':''].filter(Boolean).join(' · ');
      const acts=btn('editer','doc',ok&&!(g&&g.verrouille)?'Éditer la page':'Voir la page','pri','Ouvrir la page dans l’éditeur (double-clic sur l’aperçu)',!S.pg)
        +(ok?btn('nouveau','plus','Nouveau','','Nouveau modèle, copié d’un modèle existant')+btn('modifier','edit','Modifier','','Modifier le libellé du modèle')+btn('supprimer','minus','Supprimer','','Supprimer le modèle')+btn('groupes','wrench','Groupes','','Groupes de modèles : nouveau, par défaut, renommer, supprimer, police de tous les modèles'):'');
      return '<div class="sgds-haut"><div class="sgfh-tete"><div class="sgfh-id"><span class="sgfh-ini">'+E(sgMono(tplLabel(md)))+'</span><div class="sgfh-nm"><div class="lb">'+E('Bibliothèque · '+titre+(g?' · '+gLib(g):''))+'</div><h2>'+E(tplLabel(md))+'</h2><div class="sgfh-meta">'+E(meta)+'</div></div></div>'
        +'<div class="sgfh-per sgds-btns">'+acts+'</div></div>'
        +'<div class="nx-kpis sgfh-kp">'+kpi('Pages',String(S.P.length),'Pages du modèle')+kpi('Format',S.pg?formatP(S.pg):'—','Format de la page affichée','txt')+kpi('Éléments',S.pg?String((S.pg.elements||[]).length):'—','Textes, champs, tableaux, traits et images de la page affichée')
          +kpi('Groupes',String(S.G.length),'Groupes de modèles de cet écran')+kpi('Modèles du groupe',String(S.M.length),g?gLib(g):'')+'</div></div>'
        +'<div class="sgbm-pgs">'+(S.P.length>8?'<label class="sgbm-pl">Page <select class="inp sgbm-psel" aria-label="Page du modèle">'+S.P.map(r=>'<option value="'+E(r.k)+'"'+(r.k===TP.p.sel?' selected':'')+'>'+E(TPL_PAGE_L[r.pn]||r.pn)+'</option>').join('')+'</select></label>'
          :'<div class="sgds-jeux" role="tablist" aria-label="Page du modèle">'+S.P.map(r=>'<button type="button" role="tab" data-pg="'+E(r.k)+'" class="'+(r.k===TP.p.sel?'on':'')+'" aria-selected="'+(r.k===TP.p.sel)+'">'+E(TPL_PAGE_L[r.pn]||r.pn)+'</button>').join('')+'</div>')+'</div>'
        +'<div class="sgds-ap"><div class="sgbm-pv" title="Double-clic : ouvrir la page dans l’éditeur"></div></div>'; };
    const apercu=S=>{ const ap=w.querySelector('.sgds-ap'), pv=w.querySelector('.sgbm-pv'); if(!ap||!pv||!S.pg) return; const k=Math.max(0.3,Math.min(1.2,(ap.clientWidth-56)/(S.pg.largeur||595)));
      try{ pv.innerHTML=tplPageHTML(S.pg,k,{}); }catch(e){ console.error(e); pv.innerHTML='<div class="sgds-msg err"><b>Aperçu impossible</b><span>'+E(String(e&&e.message||e))+'</span></div>'; } };
    const dessiner=()=>{ if(!w.isConnected) return; const S=etat(), l0=w.querySelector('.sgds-l'), y=l0?l0.scrollTop:0, a=document.activeElement, foc=a&&a.classList&&a.classList.contains('sgds-q')?[a.selectionStart,a.selectionEnd]:null, L=liste(S);
      w.innerHTML='<aside class="sgds-col"><div class="sgds-ct"><b>'+E(titre)+'</b><span>'+(L.F.length===S.M.length?S.M.length+(S.M.length>1?' modèles':' modèle'):L.F.length+' sur '+S.M.length)+'</span></div>'
        +'<div class="sgds-flt"><input class="inp sgds-q" type="search" placeholder="Rechercher un modèle" spellcheck="false" aria-label="Rechercher un modèle" value="'+E(QB[cat]||'')+'">'
        +'<div class="sgds-jeux sgbm-grp" role="tablist" aria-label="Groupe de modèles">'+S.G.map(g=>{ const n=tplModelesOf(cat).filter(z=>z.groupe===g.groupe).length, def=typeof tplDefaultGroup==='function'&&tplDefaultGroup(cat)===g.groupe;
            return '<button type="button" role="tab" data-g="'+E(gKey(g))+'" class="'+(gKey(g)===TP.g.sel?'on':'')+'" title="'+E(gLib(g)+(g.verrouille?' — lecture seule':'')+(def?' — groupe par défaut':''))+'">'+E(gLib(g))+(g.verrouille?CADENAS:'')+(def?'<i> par défaut</i>':'')+'<small>'+n+'</small></button>'; }).join('')+'</div></div>'
        +'<div class="sgds-l" role="listbox" aria-label="'+E(titre)+'">'+L.html+'</div></aside><section class="sgds-m">'+droite(S)+'</section>';
      const l1=w.querySelector('.sgds-l'); if(l1) l1.scrollTop=y; if(foc){ const q=w.querySelector('.sgds-q'); if(q){ q.focus(); try{ q.setSelectionRange(foc[0],foc[1]); }catch(_){ } } }
      apercu(S); };
    const menu=(el,L)=>{ const M=L.filter(Boolean); if(window.SGSV&&SGSV.outils&&SGSV.outils.menuSous) SGSV.outils.menuSous(el,M); else if(typeof popMenu==='function') popMenu(el,M); };
    const agir=(fn,el)=>{ const S=etat(), g=S.g;
      if(fn==='editer'){ if(S.pg) tplOpenEditor(); }
      else if(!ecrit()) return;
      else if(fn==='nouveau') tplNewModel(cat);
      else if(fn==='modifier'){ if(S.md) tplEditModel(); }
      else if(fn==='supprimer'){ if(S.md) tplDelModel(); }
      else if(fn==='groupes'){ let F=[]; try{ const T=typeof ch10bTplTools==='function'?ch10bTplTools(cat).flat():[], gear=T.find(b=>b&&typeof b.menu==='function'); F=gear&&!gear.dis?gear.menu():[]; }catch(e){ console.error(e); }   /* « Fonctions » du moteur (police de tous les modèles du groupe) : dans le même menu */
        menu(el,[{t:'Nouveau groupe de modèles …',fn:()=>tplNewGroup(cat)},{t:'Utiliser ce groupe par défaut',chk:!!(g&&tplDefaultGroup(cat)===g.groupe),dis:!g,fn:()=>tplSetDefaultGroup(cat,g.groupe)},{t:'Renommer le groupe …',dis:!g,fn:()=>tplRenameGroup(cat)},...(F.length?['-',...F]:[]),'-',{t:'Supprimer le groupe',dis:!g,danger:true,fn:()=>tplDelGroup(cat)}]); } };
    w.addEventListener('click',e=>{ const gb=e.target.closest('.sgbm-grp button'); if(gb){ if(TP.g.sel!==gb.dataset.g){ TP.g.sel=gb.dataset.g; TP.m.sel=null; TP.p.sel=null; dessiner(); } return; }
      const pb=e.target.closest('.sgbm-pgs button'); if(pb){ TP.p.sel=pb.dataset.pg; dessiner(); return; }
      const it=e.target.closest('.sgds-it'); if(it){ if(TP.m.sel!==it.dataset.id){ TP.m.sel=it.dataset.id; TP.p.sel=null; dessiner(); const n=[...w.querySelectorAll('.sgds-it')].find(z=>z.dataset.id===TP.m.sel); if(n) n.focus({preventScroll:true}); } return; }
      const b=e.target.closest('[data-fn]'); if(b&&!b.disabled) agir(b.dataset.fn,b); });
    w.addEventListener('dblclick',e=>{ if(e.target.closest('.sgbm-pv')){ agir('editer'); return; } const it=e.target.closest('.sgds-it'); if(it&&ecrit()) agir('modifier'); });
    w.addEventListener('input',e=>{ if(e.target.classList&&e.target.classList.contains('sgds-q')){ QB[cat]=e.target.value; dessiner(); } });
    w.addEventListener('change',e=>{ if(e.target.classList&&e.target.classList.contains('sgbm-psel')){ TP.p.sel=e.target.value; dessiner(); const z=w.querySelector('.sgbm-psel'); if(z) z.focus({preventScroll:true}); } });
    w.addEventListener('keydown',e=>{ if(e.key!=='ArrowDown'&&e.key!=='ArrowUp') return; if(!e.target.closest('.sgds-col')) return; const L=[...w.querySelectorAll('.sgds-it')]; if(!L.length) return;
      const i=L.findIndex(z=>z.dataset.id===TP.m.sel), n=L[Math.max(0,Math.min(L.length-1,(i<0?0:i)+(e.key==='ArrowDown'?1:-1)))]; e.preventDefault(); if(n&&n.dataset.id!==TP.m.sel){ TP.m.sel=n.dataset.id; TP.p.sel=null; dessiner(); const z=[...w.querySelectorAll('.sgds-it')].find(q=>q.dataset.id===TP.m.sel); if(z){ z.scrollIntoView({block:'nearest'}); if(!e.target.classList.contains('sgds-q')) z.focus({preventScroll:true}); } } });
    w.addEventListener('contextmenu',e=>{ const it=e.target.closest('.sgds-it'); if(!it||e.altKey||typeof sgMenuAt!=='function') return; e.preventDefault(); if(TP.m.sel!==it.dataset.id){ TP.m.sel=it.dataset.id; TP.p.sel=null; dessiner(); }
      const ok=ecrit(); sgMenuAt(e.clientX,e.clientY,[{t:ok?'Éditer la page …':'Voir la page …',fn:()=>agir('editer')},...(ok?[{t:'Modifier le modèle …',fn:()=>agir('modifier')},'-',{t:'Supprimer le modèle …',danger:true,fn:()=>agir('supprimer')}]:[])]); });
    V._d=dessiner; V.redraw=dessiner; dessiner();
    if(typeof ResizeObserver==='function'){ let t=null, lw=0; new ResizeObserver(()=>{ const ap=w.querySelector('.sgds-ap'), cw=ap?ap.clientWidth:0; if(!cw||Math.abs(cw-lw)<12) return; lw=cw; clearTimeout(t); t=setTimeout(()=>{ if(w.isConnected) apercu(etat()); },120); }).observe(w); } };
  TPL_CATS.forEach(([id,cat])=>{ if(!VIEWS[id]) return;
    VIEWS[id]={ render(m){ if(typeof TPL_TABLES!=='undefined'&&TPL_TABLES.some(t=>!DS.loaded.has(t))){ m.append(h('div',{class:'ph'},'Chargement des modèles…')); tplNeed().then(()=>{ if(typeof VIEW!=='undefined'&&VIEW&&VIEW.v===this) go(VIEW.id); }); return; } monter(m,id,cat,this); },
      refresh(ts){ if(hit(ts,'modele','modelegroupe','setting','arriereplan','image')&&this._d) this._d(); } };
    LISTE.delete(id); });
}
window.SGMV={LISTE,maj,DOMS,CATS,habiller,CHIFFRES};
})();

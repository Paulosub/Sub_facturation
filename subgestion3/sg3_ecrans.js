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
const CHIFFRES={'tpl-documents':modeles,'mg-heures':chHeures,'mg-collab':chSuiviRH,'mg-mo':chClients,'mg-genres':chGenres,'fact-controle':chFactures};   /* les trois listes des tâches (sg3_suivi.js) et les trois listes des membres (plus bas) ont leur propre page depuis le 15.11.2026 */
const hote=()=>{ let h=document.getElementById('sg-mv'); if(!h){ const sub=document.getElementById('nx-sub'); if(!sub||!sub.parentNode) return null; h=document.createElement('div'); h.id='sg-mv'; sub.parentNode.insertBefore(h,sub); } return h; };
let cle='';
const maj=()=>{ const h=hote(); if(!h) return; const v=typeof VIEW!=='undefined'&&VIEW?VIEW.id:'', x=LISTE.has(v)?NX_VIEW[v]:null, m=document.getElementById('main');
  const ok=!!(x&&x.it&&m&&!m.querySelector('.sgfh-tete,.sg-tete,.sg-intro'));
  if(!ok){ if(h.firstChild){ h.textContent=''; } cle=''; document.documentElement.removeAttribute('data-vep'); return; }
  document.documentElement.setAttribute('data-vep','1');   /* présentation épurée de l'écran (styles html[data-vep] de sg3.css) */
  let f=''; try{ f=CHIFFRES[v]?CHIFFRES[v]():''; }catch(e){ console.error(e); }
  const k=v+'|'+f; if(k===cle&&h.firstChild) return; cle=k;
  h.innerHTML='<div class="sgmv">'+sgTete([x.d&&x.d.t,x.it.grp].filter(Boolean).join(' · '),nxE(x.it.t||''),nxE(x.it.d||''),!f?'':/^<div class="nx-kpis/.test(f)?f:'<div class="sg-figs">'+f+'</div>')+'</div>'; };
{ const g0=go; go=function(){ const r=g0.apply(this,arguments); try{ maj(); }catch(e){ console.error(e); } setTimeout(()=>{ try{ maj(); }catch(_){ } },0); return r; }; }
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
let enCours=false;
const habiller=()=>{ if(enCours) return; const v=typeof VIEW!=='undefined'&&VIEW?VIEW.id:''; if(!LISTE.has(v)||!document.documentElement.hasAttribute('data-vep')) return;
  const m=document.getElementById('main'), cols=m&&m.querySelector(':scope>.cols'); if(!cols) return;
  enCours=true; try{ if(CATS.has(v)) onglets(m,cols); if(HAB[v]) HAB[v](cols); if(CHIFFRES[v]) maj(); }catch(e){ console.error(e); } enCours=false; };
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
      const acts=(peutEq('staffNew')?btn('new','Nouveau membre','plus',1):'')+'<button class="nx-btn" data-a="menu" title="Courriel, copier, exporter" aria-label="Courriel, copier, exporter">⋯</button>';
      return '<div class="sgsv">'+tete('ÉQ','Équipe',f[1],pl(base.length,'membre'),acts)
        +'<div class="nx-kpis sgsv-kp">'+kpi('Membres actuels',String(nA),'')+kpi('Anciens membres',String(A.length-nA),'')+kpi('Arrivées '+y,String(A.filter(s=>an(s.JOININGDATE)).length),'')+kpi('Départs '+y,String(A.filter(s=>an(s.QUITTINGDATE)).length),'')+'</div>'
        +'<div class="sgsv-fil">'+(VV.length>1?VV.map(k=>'<button data-a="vue" data-v="'+k+'" class="'+(k===v?'on':'')+'" aria-pressed="'+(k===v)+'">'+E(FIL[k][0])+'</button>').join(''):'')   /* une seule liste permise (collaborateur, chef de projet) : pas de choix */
        +'<span class="dr"><input class="inp" data-q type="search" style="width:240px" placeholder="Rechercher un membre" aria-label="Rechercher un membre" value="'+E(u.q||'')+'"></span></div>'
        +(L.length?'<table class="nx-tbl sgsv-tb sgmv-eq"><thead><tr><th class="sg-notri"></th><th>Membre</th><th>Appartient à</th><th>Téléphone</th><th>Mobile</th><th>Courriel</th><th>Engagement</th>'+(dep?'<th>Départ</th>':'')+'<th>Heures bloquées</th></tr></thead><tbody>'
          +L.map(s=>{ const c=pers(s), fn=c.COMPANYROLE||'';
            return '<tr data-a="open" data-s="'+E(s.ID)+'"'+(+s.ISACTIVE?'':' class="anc"')+'><td><span class="sgsv-ini">'+E(s.INITIALS||'—')+'</span></td><td><b>'+E(staffName(s))+'</b>'+(fn?'<span class="sgsv-sous">'+E(fn)+'</span>':'')+'</td><td class="nw">'+E(app(c))+'</td>'
              +'<td class="nw">'+E(tel(c,1))+'</td><td class="nw">'+E(tel(c,2))+'</td><td>'+E(c.EMAIL1||'')+'</td><td class="nw">'+E(dfr(s.JOININGDATE))+'</td>'+(dep?'<td class="nw">'+E(dfr(s.QUITTINGDATE))+'</td>':'')
              +'<td class="nw">'+(+s.ISTIMELOGFROZEN&&s.TIMELOGFREEZINGDATE?'jusqu’au '+E(dfr(s.TIMELOGFREEZINGDATE)):'')+'</td></tr>'; }).join('')+'</tbody></table>'
          :'<p class="sgsv-rien">'+(u.q?'Aucun membre trouvé.':'Aucun membre dans cette liste.')+'</p>')+'</div>'; },
    action(I,a,tg,e){ const s=tg.dataset.s?DS.get('staff',tg.dataset.s):null;
      if(a==='open'){ if(s&&!(e&&e.detail>1)) go('nx-collab',s.ID); }
      else if(a==='new'){ if(peutEq('staffNew')) editStaff(); }
      else if(a==='vue'){ const v=tg.dataset.v; if(FIL[v]&&(typeof VIEW==='undefined'||!VIEW||VIEW.id!==v)) go(v); }
      else if(a==='menu'){ const L=I.R||[], g=()=>({cols:colsX,view:L});
        menuSous(tg,[{t:'Courriel aux membres affichés …',dis:!L.length,fn:()=>mailList(L.map(pers).filter(c=>c&&c.ID!=null))},'-',{t:'Copier le tableau',dis:!L.length,fn:()=>copyTable(g())},{t:'Exporter le tableau dans un fichier CSV …',dis:!L.length,fn:()=>csvTable(g(),'Collaborateurs')}]); } },
    ctx(I,tg,e){ if(tg.dataset.a!=='open') return false; const s=DS.get('staff',tg.dataset.s); if(!s) return false; const ed=peutEq('staffEdit'), c=pers(s);
      sgMenuAt(e.clientX,e.clientY,[{t:'Fiche du membre',fn:()=>go('nx-collab',s.ID)},
        ...(ed?[{t:'Modifier le membre …',fn:()=>editStaff(s)},'-',{t:'Coût de revient …',fn:()=>staffRates(s)},{t:'Durée prévue …',fn:()=>staffTargets(s)},{t:'Vacances …',fn:()=>staffHolidays(s)},{t:'Disponibilité …',fn:()=>staffProjectTimes(s)},{t:'Verrouillage des heures …',fn:()=>staffFreeze([s])}]:[]),
        '-',{t:'Courriel …',dis:!c.EMAIL1,fn:()=>mailList([c])},
        ...(peutEq('staffDelete')?['-',{t:'Supprimer le membre …',danger:true,fn:()=>delStaff(s)}]:[])]); return true; } };
  Object.keys(FIL).forEach(v=>{ VIEWS[v]={render(m){ monter(m,{ID:'equipe',GLOBAL:1,VUE:v,NUMBER:'',TITLE:''},'equipe',BES,EQUIPE); },refresh(){ }}; });
  window.SGMV_EQ=EQUIPE; }
window.SGMV={LISTE,maj,DOMS,CATS,habiller,CHIFFRES};
})();

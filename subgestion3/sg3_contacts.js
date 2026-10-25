/* ═══ Contacts ▸ Listes de diffusion et Catégories : le graphisme de l'app (bloc 29, sg3_contacts.js, 25.10.2026) ═══
   Demandes de Paulo : « améliorer la liste de diffusion pour avoir le même graphisme que le reste de l'app », « modifier catégorie pour avoir le
   même graphisme que le reste de l'app ». Présentation des pages du chapitre Heures et de la Feuille d'heures : colonne épurée à gauche (pastille,
   nom, nombre d'adresses ; listes rangées par type, catégories par groupe), puis bandeau jaune pâle (monogramme, filet, nom en grand), chiffres,
   barre d'outils en texte et tableau des adresses à filet noir, détail de l'adresse en onglets soulignés.
   Les fonctions restent celles du moteur, inchangées : adrList (sélection multiple, Modifier l'adresse, Prévisualisation, Fonctions — favoris,
   ajout à une liste, retrait de la liste, catégories, courriel, copie, CSV, présentation —, recherche), editSmartGroup / editStaticGroup,
   suppression d'une liste comme le moteur (les adresses ne sont pas supprimées), adrDetail. Le bouton « Retirer la propriété des adresses
   sélectionnées » des Catégories du moteur ne faisait rien : il n'est pas repris (retrait d'une catégorie : détail de l'adresse ▸ Propriétés).
   DeltaSub.html seul garde les écrans d'origine ; Contacts ▸ Liste des adresses et l'Annuaire ne changent pas. */
const SGD={dif:null,cat:null};
try{ SGD.dif=localStorage.getItem('sg3_dif_sel')||null; SGD.cat=localStorage.getItem('sg3_cat_sel')||null; }catch(_){}
const sgdGarder=(k,v)=>{ SGD[k]=v==null?null:String(v); try{ localStorage.setItem('sg3_'+k+'_sel',SGD[k]||''); }catch(_){} };
const sgdN=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'’');
const sgdAdr=n=>sgdN(n)+' adresse'+(n>1?'s':'');
/* chiffres d'un ensemble d'adresses (adresses masquées exclues, comme le tableau) */
function sgdChiffres(rows){ const R=rows.filter(c=>c&&!c.ISHIDDEN), ty=c=>{ const o=ownerOf(c); return o?+o.TYPECODE:-1; };
  return {n:R.length,soc:R.filter(c=>ty(c)===0).length,per:R.filter(c=>ty(c)===1).length,mail:R.filter(c=>c.EMAIL1).length}; }
function sgdKpis(k){ const p=k.n?k.mail/k.n*100:0, kpi=(l,v,t,x)=>'<div class="nx-kpi" title="'+nxE(t)+'"><div class="l">'+l+'</div><div class="v">'+v+'</div>'+(x||'')+'</div>';
  return '<div class="nx-kpis sgfh-kp">'+kpi('Adresses',sgdN(k.n),'Adresses de la liste (adresses masquées exclues)')
    +kpi('Sociétés',sgdN(k.soc),'Adresses de sociétés')+kpi('Personnes',sgdN(k.per),'Adresses de personnes')
    +kpi('Avec courriel',sgdN(k.mail),sgdN(k.mail)+' adresse(s) sur '+sgdN(k.n)+' ont un courriel ('+Math.round(p)+' %)','<div class="sgfh-g"><i style="width:'+p+'%"></i></div>')
    +kpi('Sans courriel',sgdN(k.n-k.mail),'Adresses sans courriel : elles ne reçoivent pas les envois par courriel')+'</div>'; }
/* colonne de gauche : rubriques {t, items:[{id, nom, ini, sous, titre}]} */
function sgdColonne(titre,nb,rubs,sel){ return '<div class="sgd-ct"><b>'+nxE(titre)+'</b><span>'+nxE(nb)+'</span></div><div class="sgd-l">'
  +rubs.filter(r=>r.items.length).map(r=>(r.t?'<div class="sgd-gt">'+nxE(r.t)+'</div>':'')+r.items.map(it=>'<button class="sgd-it'+(String(it.id)===String(sel)?' on':'')+'" data-sgd="'+nxE(it.id)+'" title="'+nxE(it.titre||it.nom)+'">'
    +'<span class="sgt-ini">'+nxE(it.ini)+'</span><span class="sgt-nm"><b>'+nxE(it.nom)+'</b><small>'+nxE(it.sous)+'</small></span></button>').join('')).join('')+'</div>'; }
/* bandeau : monogramme, filet, libellé, nom, informations ; boutons à droite */
const sgdTete=(gros,lb,nom,meta,btns)=>'<div class="sgfh-tete"><div class="sgfh-id"><span class="sgfh-ini">'+nxE(gros)+'</span><div class="sgfh-nm"><div class="lb">'+nxE(lb)+'</div><h2>'+nxE(nom)+'</h2>'
  +(meta?'<div class="sgfh-meta">'+nxE(meta)+'</div>':'')+'</div></div>'+(btns?'<div class="sgfh-per sgd-btns">'+btns+'</div>':'')+'</div>';
const sgdBtn=(fn,ico,t,cls,titre)=>'<button class="nx-btn sm'+(cls?' '+cls:'')+'" data-fn="'+fn+'"'+(titre?' title="'+nxE(titre)+'"':'')+'>'+nxSvg(ico)+'<span>'+nxE(t)+'</span></button>';
const sgdIni=s=>(typeof nxIni==='function'?nxIni(String(s||'').replace(/[«»"'’()]/g,' ')):String(s||'').slice(0,2)).toUpperCase()||'—';
/* page commune : colonne, bandeau + chiffres, tableau du moteur (adrList) ; o = {col(), tete(), rows(), opt(), choisir(id), fn:{…}} */
function sgdPage(V,m,o){ const w=h('div',{class:'sgd'}); m.append(w);
  w.innerHTML='<aside class="sgd-col"></aside><section class="sgd-m"><div class="sgd-haut"></div><div class="sgd-tab"></div></section>';
  const col=w.querySelector('.sgd-col'), haut=w.querySelector('.sgd-haut'), tab=w.querySelector('.sgd-tab');
  V.peindre=()=>{ const y=(col.querySelector('.sgd-l')||{}).scrollTop||0; col.innerHTML=o.col(); const l=col.querySelector('.sgd-l'); if(l) l.scrollTop=y;
    haut.innerHTML=o.tete()+sgdKpis(sgdChiffres(o.rows())); };
  V.tableau=()=>{ tab.innerHTML=''; V.l=adrList(tab,()=>o.rows(),o.opt()); };
  /* sans le droit « Modifier l'adresse » (contactEdit, ou profil sans « contacts : écriture ») : le double-clic de la liste du moteur — et « Ouvrir »
     du clic droit, qui l'envoie — n'ouvre pas la fenêtre de modification ; boutons d'écriture du détail (catégories, notes) masqués */
  if(!sgaPeut('contactEdit')){ tab.classList.add('sgd-lecture');
    tab.addEventListener('dblclick',e=>{ if(e.target.closest('table.g')){ e.stopPropagation(); e.preventDefault(); } },true); }
  V.peindre(); V.tableau();
  const on=col.querySelector('.sgd-it.on'); if(on) on.scrollIntoView({block:'nearest'});
  w.addEventListener('click',e=>{ const it=e.target.closest('[data-sgd]'); if(it&&col.contains(it)){ o.choisir(it.dataset.sgd); V.peindre(); V.tableau(); return; }
    const b=e.target.closest('[data-fn]'); if(b&&haut.contains(b)&&o.fn[b.dataset.fn]) o.fn[b.dataset.fn](b); }); }

/* ── Listes de diffusion (groupes d'adresses du moteur : contactgroup ; « Mes favoris » a son écran, Archives ▸ Favoris) ── */
const SGD_TOUTES={ID:0,NAME:'Toutes les adresses',SORTDATE:null,ISSMART:null};
const sgdListes=()=>DS.all('contactgroup').filter(g=>g.NAME&&g.NAME!=='Mes favoris').sort((a,b)=>cmp(String(a.NAME).toLowerCase(),String(b.NAME).toLowerCase()));
/* critères d'une liste intelligente, en clair (mêmes champs que editSmartGroup) */
function sgdCriteres(g){ const cl=DS.by('contactqueryclause','CONTACTQUERY_ID',g.CONTACTQUERY_ID).filter(x=>+x.ISENABLED).sort((a,b)=>a.POSITION-b.POSITION), q=DS.get('contactquery',g.CONTACTQUERY_ID)||{ISANDOPERATOR:1};
  const v=s=>'« '+(s==null?'':s)+' »', pn=ids=>String(ids||'').split(',').filter(Boolean).map(id=>nm(DS.get('property',+id))).filter(Boolean).join(', ');
  const T=cl.map(x=>{ const P=x.POSITION, op=+x.OP||0;
    if(P<=4) return (SMART_F[x.FIELDID]||'Champ')+' '+(SMART_OP[op]||'')+' '+v(x.PATTERN1);
    if(P===5) return 'CFC '+(SMART_OP[op]||'')+' '+v(x.PATTERN1);
    if(P===6) return 'NPA '+['compris entre '+(x.PATTERN1||'')+' et '+(x.PATTERN2||''),'= '+(x.PATTERN1||''),'> '+(x.PATTERN1||''),'< '+(x.PATTERN1||'')][op];
    if(P===7) return 'Statut '+(op?'n’est pas ':'est ')+v(nm(DS.get('contactstate',x.PATTERN1)));
    if(P===8||P===9) return (P===8?'Dernière modification ':'Création ')+['le '+dfr(x.PATTERN1),'avant le '+dfr(x.PATTERN1),'après le '+dfr(x.PATTERN1),'entre le '+dfr(x.PATTERN1)+' et le '+dfr(x.PATTERN2)][op];
    if(P===10){ const a=pn(x.PATTERN1), b=pn(x.PATTERN2); return [a?(op?'toutes les catégories ':'une des catégories ')+a:'',b?'sans '+b:''].filter(Boolean).join(', '); }
    return ''; }).filter(Boolean);
  return T.length?T.join(q.ISANDOPERATOR?' et ':' ou '):'aucun critère actif'; }
VIEWS['adr-groupes']={
  render(m){ const V=this, cur=()=>SGD.dif&&SGD.dif!=='0'?DS.get('contactgroup',SGD.dif):null;
    if(SGD.dif&&SGD.dif!=='0'&&!cur()) sgdGarder('dif',null);
    const nb=g=>groupMembers(g).filter(c=>c&&!c.ISHIDDEN).length;
    sgdPage(V,m,{
      col:()=>{ const it=g=>({id:g.ID,nom:g.NAME,ini:sgdIni(g.NAME),sous:sgdAdr(nb(g))+(g.SORTDATE?' · '+dfr(g.SORTDATE):'')});
        const Ls=sgdListes();
        return sgdColonne('Listes de diffusion',Ls.length+' liste'+(Ls.length>1?'s':''),[
          {t:'',items:[{id:0,nom:'Toutes les adresses',ini:'TA',sous:sgdAdr(DS.all('contact').filter(c=>!c.ISHIDDEN).length),titre:'Toutes les adresses de l’annuaire : pour les ajouter à une liste statique (Fonctions)'}]},
          {t:'Listes intelligentes',items:Ls.filter(g=>+g.ISSMART).map(it)},{t:'Listes statiques',items:Ls.filter(g=>!+g.ISSMART).map(it)}],SGD.dif||'0'); },
      tete:()=>{ const g=cur();
        /* mêmes droits que les boutons du moteur (CH08B_GUARDS : Nouveau / Modifier le groupe = contactGroupNew, Supprimer le groupe = contactGroupDelete) */
        const nw=sgaPeut('contactGroupNew'), del=sgaPeut('contactGroupDelete');
        const btns=(nw?sgdBtn('nouv','plus','Nouvelle liste',null,'Nouvelle liste intelligente (adresses choisies par critères) ou statique (adresses ajoutées une à une)'):'')
          +(g&&nw?sgdBtn('mod','edit','Modifier la liste'):'')+(g&&del?sgdBtn('sup','minus','Supprimer la liste','danger','Supprimer la liste (les adresses ne sont pas supprimées)'):'');
        if(!g) return sgdTete('TA','Listes de diffusion','Toutes les adresses','Toutes les adresses de l’annuaire · sélectionnez des adresses puis Fonctions ▸ « Ajouter à un groupe d’adresses » pour remplir une liste statique',btns);
        return sgdTete(sgdIni(g.NAME),+g.ISSMART?'Liste intelligente':'Liste statique',g.NAME,
          [+g.ISSMART?'Adresses qui remplissent les critères : '+sgdCriteres(g):'Adresses ajoutées une à une (Fonctions ▸ « Ajouter à un groupe d’adresses », « Retirer du groupe »)',g.SORTDATE?'créée le '+dfr(g.SORTDATE):''].filter(Boolean).join(' · '),btns); },
      rows:()=>groupMembers(cur()),
      opt:()=>({group:cur()||SGD_TOUTES}),
      choisir:id=>sgdGarder('dif',id),
      fn:{
        nouv:b=>sgaPeut('contactGroupNew')&&popMenu(b,[{t:'Nouvelle liste intelligente (par critères) …',fn:()=>editSmartGroup()},{t:'Nouvelle liste statique …',fn:()=>editStaticGroup()}]),
        mod:()=>{ const g=cur(); if(g&&sgaPeut('contactGroupNew')) +g.ISSMART?editSmartGroup(g):editStaticGroup(g); },
        sup:async()=>{ const g=cur(); if(!g||!sgaPeut('contactGroupDelete')||!await confirmDlg(`Supprimer la liste « ${g.NAME||''} » ? (les adresses ne sont pas supprimées)`,'Supprimer')) return;
          const ops=[{t:'contactgroup',id:g.ID,val:null}];
          if(+g.ISSMART){ ops.push({t:'contactquery',id:g.CONTACTQUERY_ID,val:null}); DS.by('contactqueryclause','CONTACTQUERY_ID',g.CONTACTQUERY_ID).forEach(x=>ops.push({t:'contactqueryclause',id:x.ID,val:null})); }
          else DS.by('contactgroup_contact','CONTACTGROUPS_ID',g.ID).forEach(l=>ops.push({t:'contactgroup_contact',id:g.ID+'-'+l.CONTACTS_ID,val:null}));
          sgdGarder('dif',null); await DS.commit(ops); toast('Liste supprimée.'); } } }); },
  refresh(ts){ if(hit(ts,'contactgroup','contactquery','contactqueryclause','contactgroup_contact')){ this.peindre&&this.peindre(); this.tableau&&this.tableau(); }
    else if(hit(ts,'contact','contactowner','contact_property')){ this.peindre&&this.peindre(); this.l&&this.l.draw(); } } };

/* ── Catégories (propriétés d'adresses du moteur : property, rangées par groupe propertygroup) ── */
const sgdCats=()=>DS.all('property').sort((a,b)=>cmp((propGroup(a)||{}).SORTORDER,(propGroup(b)||{}).SORTORDER)||cmp(a.SORTORDER,b.SORTORDER));
const sgdCatAdr=p=>p?DS.by('contact_property','PROPERTIES_ID',p.ID).map(l=>DS.get('contact',l.CONTACT_ID)).filter(Boolean):[];
VIEWS['adr-props']={
  render(m){ const V=this, P=sgdCats();
    if(!SGD.cat||!DS.get('property',SGD.cat)) sgdGarder('cat',(P[0]||{}).ID);
    const cur=()=>DS.get('property',SGD.cat);
    sgdPage(V,m,{
      col:()=>{ const Ps=sgdCats(), G=[];
        Ps.forEach(p=>{ const g=propGroup(p), k=g?g.ID:'-'; let r=G.find(x=>x.k===k); if(!r){ r={k,t:g?nm(g):'Sans groupe',items:[]}; G.push(r); }
          r.items.push({id:p.ID,nom:nm(p),ini:sgdIni(nm(p)),sous:sgdAdr(sgdCatAdr(p).filter(c=>!c.ISHIDDEN).length),titre:(g?nm(g)+' › ':'')+nm(p)}); });
        return sgdColonne('Catégories',Ps.length+' catégorie'+(Ps.length>1?'s':''),G,SGD.cat); },
      tete:()=>{ const p=cur(), g=p&&propGroup(p);
        if(!p) return sgdTete('—','Catégories','Aucune catégorie','Les catégories se créent dans Réglages ▸ Administration (propriétés d’adresses).');
        return sgdTete(sgdIni(nm(p)),'Catégorie'+(g?' · '+nm(g):''),nm(p),'Adresses classées dans cette catégorie · ajouter : sélectionnez des adresses puis Fonctions ▸ « Ajouter des propriétés » ; retirer : détail de l’adresse ▸ Propriétés'); },
      rows:()=>sgdCatAdr(cur()),
      opt:()=>({}),
      choisir:id=>sgdGarder('cat',id),
      fn:{} }); },
  refresh(ts){ if(hit(ts,'property','propertygroup')){ this.peindre&&this.peindre(); this.tableau&&this.tableau(); }
    else if(hit(ts,'contact_property','contact','contactowner')){ this.peindre&&this.peindre(); this.l&&this.l.draw(); } } };

/* ── Liste des adresses : la présentation de Projets ▸ Mes projets (25.10.2026) ──
   Demande de Paulo : « modifier la liste des adresses pour correspondre au graphisme de Mes projets ». Barre de Mes projets (filtre Toutes ·
   Sociétés · Personnes · Autres, recherche, nombre) puis tableau .nx-tbl (titres de colonne cliquables pour trier, tri commun de l'app) :
   une ligne = une adresse, un clic ouvre la fiche du contact (Annuaire). Les fonctions de l'écran d'origine (adrList) sont gardées : à droite
   de la barre Imprimer ▾ (liste d'adresses, par CFC), Courriel …, Exporter CSV — sur les adresses affichées — ; clic droit sur une adresse :
   fiche, Modifier l'adresse, favoris, liste de diffusion, catégories, courriel, copie. Mêmes droits que l'écran d'origine (« Modifier
   l'adresse » = contactEdit, « Fonctions » = contactNew ou contactExport, écritures = profil « contacts : écriture »). La liste du moteur
   (sélection multiple, présentation des colonnes, détail) reste dans Listes de diffusion ▸ Toutes les adresses. */
const SGL_TYPES=[['tous','Toutes',()=>true],['societe','Sociétés',t=>t===0],['personne','Personnes',t=>t===1],['autres','Autres',t=>t>1]];
const sglFonc=()=>{ try{ return typeof ch08aCan!=='function'||ch08aCan('contactNew')||ch08aCan('contactExport'); }catch(_){ return true; } };
const sglEcrit=()=>sglFonc()&&(typeof sgDroit!=='function'||sgDroit('contacts','ecriture'));
function sglMenu(c){ const o=ownerOf(c), F=sglFonc(), E=sglEcrit(), L=[];
  if(o) L.push({t:'Fiche du contact',fn:()=>go('nx-contact',String(o.ID))});
  if(sgaPeut('contactEdit')) L.push({t:'Modifier l’adresse …',fn:()=>editContact(c)});
  if(E) L.push('-',{t:'Ajouter aux favoris',fn:()=>addToGroup(favGroup(true),[c])},{t:'Ajouter à une liste de diffusion …',fn:()=>pickGroup(g=>addToGroup(g,[c]))},
    {t:'Ajouter des catégories …',fn:()=>pickProps(ps=>addProps([c],ps))});
  if(F) L.push('-',{t:'Courriel …',fn:()=>mailList([c])});
  L.push({t:'Copier l’adresse',fn:()=>ctCopy(adrLines(c).join('\n'),'Adresse copiée.')});
  if(c.EMAIL1) L.push({t:'Copier le courriel',fn:()=>ctCopy(c.EMAIL1,'Courriel copié.')});
  const tel=phone(c,1)||phone(c,2); if(tel) L.push({t:'Copier le téléphone',fn:()=>ctCopy(tel,'Téléphone copié.')});
  return L; }
/* position de la liste gardée pour le retour depuis une fiche (session de l'onglet) : défilement et dernière adresse ouverte */
const SGL={y:0,der:null};
VIEWS['adr-liste']={
  render(m){ VIEW.nxTitle='Liste des adresses'; const V=this, ty0=String(nxLS.get('sg3_adrl_type','tous')||'tous'), q0=String(nxLS.get('sg3_adrl_q','')||'');
    const lc=s=>String(s||'').toLowerCase(), L=DS.all('contact').filter(c=>c&&!c.ISHIDDEN).map(c=>{ const o=ownerOf(c);
      return {c,o,nom:(o?ownerName(o,true):'')||[c.NAME1,c.NAME2].filter(Boolean).join(' ')||c.SHORTLABEL||'',rel:ownerName(relOf(c),true),t:o?+o.TYPECODE:0}; })
      .sort((a,b)=>a.nom.localeCompare(b.nom,'fr',{sensitivity:'base'}));
    const row=x=>{ const c=x.c, cats=contactProps(c).map(nm).filter(Boolean), at=+c.ADDRESSTYPECODE?ADR_T[+c.ADDRESSTYPECODE]||'':'', tel=phone(c,1)||phone(c,2);
      const q=lc([x.nom,x.rel,c.NAME1,c.NAME2,c.NAME3,c.STREET,c.POBOX,locality(c),c.EMAIL1,c.BKP,c.SHORTLABEL,phone(c,1),phone(c,2),cats.join(' ')].filter(Boolean).join(' '));
      return '<tr class="nx-row'+(String(c.ID)===String(SGL.der)?' sgl-der':'')+'"'+(x.o?' data-o="'+x.o.ID+'"':'')+' data-c="'+c.ID+'" data-t="'+x.t+'" data-q="'+nxE(q)+'" title="Clic : fiche du contact · clic droit : modifier l’adresse, listes, catégories, courriel">'
        +'<td><b>'+nxE(x.nom)+'</b>'+cats.slice(0,2).map(t=>' <span class="nx-tag">'+nxE(t)+'</span>').join('')+(cats.length>2?' <span class="nx-tag" title="'+nxE(cats.slice(2).join(', '))+'">+'+(cats.length-2)+'</span>':'')+'</td>'
        +'<td>'+nxE(OWNER_T[x.t]||'')+'</td><td>'+nxE(x.rel)+'</td><td>'+nxE([c.STREET,c.POBOX].filter(Boolean).join(', '))+(at?' <span class="sgl-at">'+nxE(at)+'</span>':'')+'</td>'
        +'<td>'+nxE(locality(c))+'</td><td class="sgl-nw">'+nxE(tel)+'</td><td>'+nxE(c.EMAIL1||'')+'</td><td>'+nxE(c.BKP||'')+'</td></tr>'; };
    const F=sglFonc(), html='<div class="sg-mesp-bar"><div class="seg">'+SGL_TYPES.map(([k,t])=>'<button data-fn="type" data-k="'+k+'" class="'+(k===ty0?'on':'')+'">'+t+'</button>').join('')+'</div>'
      +'<input class="inp" id="sgl-q" placeholder="Rechercher une adresse…" value="'+nxE(q0)+'"><span class="n"></span>'
      +'<span class="sgl-act"><button class="nx-btn sm" data-fn="impr" title="Imprimer les adresses affichées">'+nxSvg('print')+'<span>Imprimer</span></button>'
      +(F?'<button class="nx-btn sm" data-fn="mail" title="Courriels des adresses affichées, à copier">'+nxSvg('mail')+'<span>Courriel …</span></button><button class="nx-btn sm" data-fn="csv" title="Exporter les adresses affichées (CSV)">'+nxSvg('export')+'<span>Exporter CSV</span></button>':'')+'</span></div>'
      +(L.length?'<table class="nx-tbl sg-mesp sgl-t sg-sanstot"><tr><th>Nom</th><th>Type</th><th>Appartient à</th><th>Adresse</th><th>Localité</th><th>Téléphone</th><th>Courriel</th><th>CFC</th></tr>'+L.map(row).join('')+'</table>'
        :'<div class="nx-empty">Aucune adresse dans l’annuaire.</div>');
    const pg=nxPage(m,html), inp=pg.querySelector('#sgl-q'), nb=pg.querySelector('.sg-mesp-bar .n');
    let ty=ty0; const visibles=()=>[...pg.querySelectorAll('tr[data-c]')].filter(tr=>tr.style.display!=='none').map(tr=>DS.get('contact',tr.dataset.c)).filter(Boolean);
    const filt=()=>{ const v=inp.value.trim().toLowerCase(), f=(SGL_TYPES.find(x=>x[0]===ty)||SGL_TYPES[0])[2]; nxLS.set('sg3_adrl_q',inp.value); let n=0;
      pg.querySelectorAll('tr[data-c]').forEach(tr=>{ const ok=f(+tr.dataset.t)&&(!v||tr.dataset.q.includes(v)); tr.style.display=ok?'table-row':'none'; if(ok) n++; }); nb.textContent=sgdAdr(n); };
    pg._fn.type=b=>{ ty=b.dataset.k; nxLS.set('sg3_adrl_type',ty); pg.querySelectorAll('.seg [data-fn="type"]').forEach(x=>x.classList.toggle('on',x===b)); filt(); };
    pg._fn.impr=b=>popMenu(b,[{t:'Liste d’adresses',fn:()=>printAdr(visibles(),'Liste d’adresses')},{t:'Liste d’adresses par CFC',fn:()=>printAdr(visibles().sort((a,b2)=>cmp(a.BKP,b2.BKP)),'Liste d’adresses par CFC')}]);
    pg._fn.mail=()=>{ const cs=visibles(); if(cs.length) mailList(cs); };
    /* export : les colonnes de la présentation « Tous » de la liste du moteur (ACOL, PRES), le type de contact et les catégories */
    pg._fn.csv=()=>{ const cs=visibles(), t=h('table'), tr=a=>{ const r=h('tr'); a.forEach(v=>r.append(h('td',{},v==null?'':String(v)))); t.append(r); };
      const cols=PRES['Tous'].filter(k=>k!=='ty').map(k=>ACOL[k]).filter(Boolean), d=document.createElement('div'), txt=(col,c)=>{ if(col.f){ d.innerHTML=col.f(c); return (d.textContent||'').trim(); } return c[col.k]==null?'':String(c[col.k]); };
      tr(['Type',...cols.map(col=>col.t),'Catégories']);
      cs.forEach(c=>{ const o=ownerOf(c); tr([o?OWNER_T[+o.TYPECODE]||'':'',...cols.map(col=>txt(col,c)),contactProps(c).map(nm).join(', ')]); });
      sgCsvTable(t,'adresses_'+diso(new Date())+'.csv'); };
    pg.addEventListener('contextmenu',e=>{ if(e.altKey||(typeof sgCtxSelection==='function'&&sgCtxSelection(e.target,document))) return;
      const tr=e.target.closest('tr'); if(!tr||!pg.contains(tr)||!tr.closest('table.sgl-t')) return;
      if(!tr.dataset.c){ if(!F) e.stopPropagation(); return; }   /* ligne de titres : copie du tableau (menu de l'app) seulement avec le droit « Fonctions » */
      const c=DS.get('contact',tr.dataset.c); if(!c) return;
      const it=sglMenu(c); if(F&&typeof sgCtxCopie==='function') it.push('-',...sgCtxCopie(tr)); e.preventDefault(); sgMenuAt(e.clientX,e.clientY,it,tr); });
    /* clic sur une adresse = sa fiche (Annuaire) ; pas si l'on sélectionne du texte (glisser, double-clic sur un courriel ou un numéro) ;
       adresse sans contact : Modifier l'adresse (avec le droit). Position de la liste gardée pour le retour. */
    const ouvrir=tr=>{ const c=DS.get('contact',tr.dataset.c); if(!c) return; SGL.y=pg.scrollTop; SGL.der=String(c.ID);
      if(tr.dataset.o) go('nx-contact',tr.dataset.o); else if(sgaPeut('contactEdit')) editContact(c); };
    pg.addEventListener('click',e=>{ const tr=e.target.closest('tr[data-c]'); if(!tr||!pg.contains(tr)) return; clearTimeout(V._t); if(e.detail>1) return;
      V._t=setTimeout(()=>{ const s=getSelection(); if(s&&!s.isCollapsed&&String(s).trim()) return; if(tr.isConnected) ouvrir(tr); },250); });
    pg.addEventListener('dblclick',()=>clearTimeout(V._t));
    inp.oninput=filt; filt(); V._pg=pg;
    if(!V._maj&&(SGL.der||SGL.y)){ pg.scrollTop=SGL.y;   /* retour depuis une fiche : même position ; la dernière adresse ouverte reste visible (après le tri) */
      setTimeout(()=>{ if(!pg.isConnected) return; const r=SGL.der&&pg.querySelector('tr[data-c="'+CSS.escape(SGL.der)+'"]');
        if(r&&r.style.display!=='none'){ const a=r.getBoundingClientRect(), b=pg.getBoundingClientRect(); if(a.top<b.top||a.bottom>b.bottom) r.scrollIntoView({block:'center'}); } },60); } },
  refresh(ts){ if(!hit(ts,'contact','contactowner','contact_property','property')) return; const m=this._pg&&this._pg.parentElement; if(!m||!m.isConnected) return;
    const sc=[m.scrollTop,this._pg.scrollTop], a=document.activeElement, foc=!!(a&&a.id==='sgl-q'&&this._pg.contains(a)), s0=foc?a.selectionStart:0, s1=foc?a.selectionEnd:0;
    clearTimeout(this._t); m.innerHTML=''; this._maj=true; try{ this.render(m); } finally{ this._maj=false; }
    m.scrollTop=sc[0]; if(this._pg) this._pg.scrollTop=sc[1];
    const q2=foc&&this._pg&&this._pg.querySelector('#sgl-q'); if(q2){ q2.focus({preventScroll:true}); try{ q2.setSelectionRange(s0,s1); }catch(_){} } } };

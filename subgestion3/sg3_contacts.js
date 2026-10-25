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
        const btns=sgdBtn('nouv','plus','Nouvelle liste',null,'Nouvelle liste intelligente (adresses choisies par critères) ou statique (adresses ajoutées une à une)')
          +(g?sgdBtn('mod','edit','Modifier la liste')+sgdBtn('sup','minus','Supprimer la liste','danger','Supprimer la liste (les adresses ne sont pas supprimées)'):'');
        if(!g) return sgdTete('TA','Listes de diffusion','Toutes les adresses','Toutes les adresses de l’annuaire · sélectionnez des adresses puis Fonctions ▸ « Ajouter à un groupe d’adresses » pour remplir une liste statique',btns);
        return sgdTete(sgdIni(g.NAME),+g.ISSMART?'Liste intelligente':'Liste statique',g.NAME,
          [+g.ISSMART?'Adresses qui remplissent les critères : '+sgdCriteres(g):'Adresses ajoutées une à une (Fonctions ▸ « Ajouter à un groupe d’adresses », « Retirer du groupe »)',g.SORTDATE?'créée le '+dfr(g.SORTDATE):''].filter(Boolean).join(' · '),btns); },
      rows:()=>groupMembers(cur()),
      opt:()=>({group:cur()||SGD_TOUTES}),
      choisir:id=>sgdGarder('dif',id),
      fn:{
        nouv:b=>popMenu(b,[{t:'Nouvelle liste intelligente (par critères) …',fn:()=>editSmartGroup()},{t:'Nouvelle liste statique …',fn:()=>editStaticGroup()}]),
        mod:()=>{ const g=cur(); if(g) +g.ISSMART?editSmartGroup(g):editStaticGroup(g); },
        sup:async()=>{ const g=cur(); if(!g||!await confirmDlg(`Supprimer la liste « ${g.NAME||''} » ? (les adresses ne sont pas supprimées)`,'Supprimer')) return;
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

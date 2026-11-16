/* ═══ 57. TABLEAUX : PRÉSENTATION, SANS TRI PAR LES TITRES, MÊME VISUEL (15.11.2026, sg3_tableaux.js) ═══════════════════════════════════════════════
   Paulo (15.11.2026) : « lorsqu'il s'agit d'un tableau supprimer la possibilité de réorganiser par ordre alphabétique ou tout autre tri directement sur le
   tableau. ajoute l'option présentation et intègre les colonnes liées au tableau, comme pour les autres tableaux devis, etc. […] pour les colonnes des tableaux,
   regarde dans l'app delta project et créer les colonnes pour chaque tableau de l'app, applique à toute l'app comme dans devis et contrôle des coûts » ;
   « ainsi que le visuel des tableaux identique pour toute l'app, graphiquement ».
   1) Plus de tri par les titres de colonnes. Listes du moteur (grid) : ordre par défaut de l'écran, titres inertes (enveloppe ci-dessous) ; tableaux de l'app :
      tri commun retiré (fin de sg3_plus.js) ; listes de Facturation dans leur cadre : titres inertes (fx_theme.css). Les écrans d'Archives ne changent pas.
   2) Menu « Présentation ▾ » d'un tableau, le même que celui des listes du contrôle des coûts : Standard · présentations enregistrées · « Personnalisée (non
      enregistrée) » · Personnalisé … (fenêtre des colonnes du moteur, ccAffichage option liste : colonnes par catégorie, recherche, ordre par glisser) ·
      Enregistrer la présentation … · Gérer les présentations …. Chaque tableau a son catalogue de colonnes (sgtabDef) : colonnes de l'écran, champs des données
      reprises de l'ancien logiciel (même modèle de données ; libellés de ses fiches, déjà repris par le moteur) et colonnes calculées par l'app.
      Présentations enregistrées : collection « sgpresentation » (ID = clé du tableau : {CLE, PRES:[{nom, cols}], MODIFIE, PAR}), communes au bureau ;
      présentation choisie et colonnes « Personnalisée » : par poste (localStorage sg3_tab = {clé: {nom} | {cols}}).
   3) Imprimer et exporter la liste affichée avec les colonnes de la présentation (sgtabImprimer → SGDH.ouvrir : page de garde, tableau bleu nuit, fenêtre
      « Document PDF » ; sgtabCsv).
   4) Écrans d'Archives repérés par l'attribut data-sgarch de <html> (coquille et cadre Facturation) : ils gardent leur tri et leur ancien visuel (sg3.css).
   API : sgtabDef(cle, {titre, cat:{k:{t, l, cat, f(r,ctx), v(r,ctx), r, c, nw, w, nd}}, std:[k]}) ; sgtabCols(cle) ; sgtabEntete(cols) ; sgtabCellules(cols, r, ctx) ;
   sgtabMenu(cle, bouton, apres) ; sgtabTexte(cols, r, ctx) ; sgtabImprimer(cle, lignes, ctx, o) ; sgtabCsv(cle, lignes, ctx, nom). Débogage : window.SGTAB. ═══ */
const SGTAB={def:{},T:'sgpresentation'};
/* écran rangé dans Archives (même règle que sg3_docs_heures.js) */
const sgtabArchive=()=>{ try{ const v=typeof VIEW!=='undefined'&&VIEW?VIEW.id:'', x=typeof NX_VIEW!=='undefined'?NX_VIEW[v]:null; return !!(x&&x.d&&x.d.k==='archives'); }catch(_){ return false; } };
function sgtabMarque(){ const a=sgtabArchive(), mq=el=>{ if(!el) return; if(a) el.setAttribute('data-sgarch',''); else el.removeAttribute('data-sgarch'); };
  mq(document.documentElement); try{ const f=document.getElementById('fx-frame'), d=f&&f.contentDocument; if(d) mq(d.documentElement); }catch(_){}
  try{ sgtabFxBrancher(); }catch(e){ console.error(e); } }   /* listes de Facturation (section 6) */
if(typeof go==='function'){ const g0=go; go=function(){ const r=g0.apply(this,arguments); try{ sgtabMarque(); }catch(_){} return r; }; }
if(typeof fxEnsure==='function'){ const f0=fxEnsure; fxEnsure=function(){ const r=f0.apply(this,arguments); Promise.resolve(r).then(()=>{ try{ sgtabMarque(); }catch(_){} },()=>{}); return r; }; }

/* ── 1. Listes du moteur : plus de tri par les titres ; l'ordre par défaut de l'écran (o.sort) est appliqué aux lignes avant le dessin ── */
if(typeof grid==='function'){ const g0=grid;
  grid=function(el,o){ if(o&&Array.isArray(o.cols)){
      if(sgtabArchive()){ if(o._sgtabNS){ o.noSort=false; delete o._sgtabNS; } }
      else { if(!o.noSort){ o.noSort=true; o._sgtabNS=true; }
        if(o._sgtabNS&&o.sort&&Array.isArray(o.rows)){ const [k,dir]=o.sort, c=(o._sgtab0||o.cols).find(x=>x.k===k)||{}, g=c.v||(r=>r[k]);
          o.rows=o.rows.slice().sort((a,b)=>cmp(g(a),g(b))*(dir<0?-1:1)); } } }
    return g0.apply(this,arguments); }; }

/* ── 2. Présentation d'un tableau ── */
function sgtabDef(cle,d){ SGTAB.def[cle]=d; return d; }
const sgtabLS=()=>{ const o=nxLS.get('sg3_tab',{}); return o&&typeof o==='object'?o:{}; };
const sgtabPoste=(cle,v)=>{ const o=sgtabLS(); if(v&&(v.nom||(v.cols&&v.cols.length))) o[cle]=v; else delete o[cle]; nxLS.set('sg3_tab',o); };
const sgtabEnr=cle=>{ try{ const r=DS.get(SGTAB.T,cle); return ((r&&r.PRES)||[]).filter(p=>p&&p.nom&&Array.isArray(p.cols)); }catch(_){ return []; } };
const sgtabMoi=()=>{ try{ return typeof ME==='object'&&ME&&ME.id?String(ME.id):null; }catch(_){ return null; } };
/* état de la présentation : colonnes affichées, présentation enregistrée choisie, colonnes personnalisées non enregistrées, Standard */
/* colonne proposée : connue, avec des données, permise au profil (c.ok) */
const sgtabOk=(D,k)=>{ const c=D&&D.cat[k]; if(!c||c.nd) return false; try{ return !c.ok||!!c.ok(); }catch(_){ return false; } };
/* présentations proposées d'office (D.pres : celles de l'ancien logiciel), puis celles du bureau ; noms réservés */
const sgtabPre=D=>(D&&D.pres)||{};
const sgtabReserve=(D,v)=>{ const x=String(v||'').trim().toLowerCase(); return x==='standard'||Object.keys(sgtabPre(D)).some(n=>n.toLowerCase()===x); };
function sgtabEtat(cle){ const D=SGTAB.def[cle]; if(!D) return {ids:[],actif:null,perso:false,std:true};
  const ok=k=>sgtabOk(D,k), P=sgtabLS()[cle]||{}, L=sgtabEnr(cle), PD=sgtabPre(D), std=D.std.filter(ok), eg=(a,b)=>a.join(',')===b.join(',');
  if(P.nom){ const c0=PD[P.nom]||(L.find(x=>x.nom===P.nom)||{}).cols; if(c0){ const ids=c0.filter(ok); if(ids.length) return {ids,actif:{nom:P.nom,cols:c0,pre:!!PD[P.nom]},perso:false,std:false}; } }
  if(P.cols&&P.cols.length){ const ids=P.cols.filter(ok); if(ids.length&&!eg(ids,std)){ const nP=Object.keys(PD).find(n=>eg(PD[n].filter(ok),ids)); if(nP) return {ids,actif:{nom:nP,cols:PD[nP],pre:true},perso:false,std:false};
      const p=L.find(x=>eg(x.cols.filter(ok),ids)); return {ids,actif:p||null,perso:!p,std:false}; } }
  return {ids:std,actif:null,perso:false,std:true}; }
const sgtabCols=cle=>{ const D=SGTAB.def[cle]; return D?sgtabEtat(cle).ids.map(k=>Object.assign({k},D.cat[k])):[]; };
const sgtabBrut=h0=>{ if(h0==null) return ''; const d=document.createElement('div'); d.innerHTML=String(h0); return (d.textContent||'').replace(/\s+/g,' ').trim(); };
/* rendu : titres, cellules, texte (impression, CSV) */
const sgtabCl=c=>{ const k=[c.r?'r':c.c?'c':'',c.nw?'nw':''].filter(Boolean).join(' '); return k?' class="'+k+'"':''; };   /* r : à droite, c : centré, nw : sur une ligne */
const sgtabEntete=cols=>'<tr>'+cols.map(c=>'<th'+sgtabCl(c)+(c.w?' style="min-width:'+(+c.w)+'px"':'')+(c.l&&c.l!==c.t?' title="'+nxE(c.l)+'"':'')+'>'+nxE(c.th!=null?c.th:c.t)+'</th>').join('')+'</tr>';
const sgtabCellules=(cols,r,ctx)=>cols.map(c=>{ let v='', k=''; try{ v=c.f?c.f(r,ctx):nxE(c.v?c.v(r,ctx):''); }catch(_){ v=''; } try{ k=c.cl?c.cl(r,ctx)||'':''; }catch(_){ k=''; }   /* c.cl : classe propre à la cellule (couleur d'un écart…) */
  const b=sgtabCl(c); return '<td'+(k?(b?b.replace(/"$/,' '+k+'"'):' class="'+k+'"'):b)+'>'+(v==null?'':v)+'</td>'; }).join('');
const sgtabTexte=(cols,r,ctx)=>cols.map(c=>{ try{ const v=c.v?c.v(r,ctx):sgtabBrut(c.f?c.f(r,ctx):''); return v==null?'':String(v); }catch(_){ return ''; } });
/* enregistrement des présentations du tableau (base commune) ; refus (profil, serveur) : message, rien n'est changé à l'écran */
function sgtabEcrire(cle,L){ const D=SGTAB.def[cle]||{}, r0=(()=>{ try{ return DS.get(SGTAB.T,cle); }catch(_){ return null; } })();
  const val=Object.assign(r0?Object.assign({},r0):{ID:cle,CLE:cle},{TITRE:D.titre||cle,PRES:L,MODIFIE:new Date().toISOString(),PAR:sgtabMoi()});
  return Promise.resolve(DS.save(SGTAB.T,val)).then(()=>true,e=>{ toast('Présentation non enregistrée : '+((e&&e.message)||'refus du serveur')+'.',true); return false; }); }
function sgtabChoisir(cle,apres){ const D=SGTAB.def[cle]; if(!D) return; if(typeof ccAffichage!=='function'){ toast('Fenêtre des colonnes indisponible.',true); return; }
  const cat=[]; Object.entries(D.cat).filter(([k])=>sgtabOk(D,k)).forEach(([k,d])=>{ let g=cat.find(x=>x[0]===d.cat); if(!g){ g=[d.cat,[]]; cat.push(g); } g[1].push([k,d.t,d.l||d.t,{}]); });
  ccAffichage({},{touch:()=>{ if(apres) apres(); },liste:{titre:D.titre,titreDlg:'Présentation personnalisée · '+D.titre,cat,std:D.std.slice(),
    note:'Colonnes du tableau « '+D.titre+' », gardées sur ce poste. « Enregistrer la présentation … » la propose à tout le bureau.',
    def:k=>D.cat[k]?{t:D.cat[k].t,l:D.cat[k].l||D.cat[k].t,cat:D.cat[k].cat,nd:D.cat[k].nd}:null,cols:sgtabEtat(cle).ids.slice(),
    set:ids=>{ const ok=k=>sgtabOk(D,k), I=ids.filter(ok), j=I.join(','), PD=sgtabPre(D), nP=Object.keys(PD).find(n=>PD[n].filter(ok).join(',')===j), p=sgtabEnr(cle).find(x=>x.cols.filter(ok).join(',')===j);
      if(!I.length||j===D.std.filter(ok).join(',')) sgtabPoste(cle,null); else if(nP) sgtabPoste(cle,{nom:nP}); else if(p) sgtabPoste(cle,{nom:p.nom}); else sgtabPoste(cle,{cols:I}); }}}); }
function sgtabEnregistrer(cle,apres){ const D=SGTAB.def[cle]; if(!D) return; const L=sgtabEnr(cle).map(p=>Object.assign({},p)), E=sgtabEtat(cle);
  let n=L.length+1; while(L.some(p=>p.nom==='Présentation '+n)) n++;
  const inp=h('input',{class:'inp',value:E.actif&&!E.actif.pre?E.actif.nom:'Présentation '+n,style:{width:'100%',boxSizing:'border-box'}}), msg=h('div',{style:{fontSize:'12px',color:'var(--s-gris)',marginTop:'6px',minHeight:'16px'}});
  const maj=()=>{ const v=inp.value.trim(); msg.textContent=!v?'Donnez un nom à la présentation.':sgtabReserve(D,v)?'« '+v+' » est une présentation d’origine : choisissez un autre nom.':L.some(p=>p.nom===v)?'« '+v+' » existe déjà : elle sera remplacée.':''; };
  inp.oninput=maj; maj();
  const body=h('div',{style:{width:'460px',maxWidth:'80vw'}},h('div',{style:{fontWeight:700,marginBottom:'6px'}},'Nom de la présentation'),inp,msg,
    h('div',{style:{marginTop:'12px',fontSize:'12.5px',color:'var(--s-gris)'}},'Colonnes affichées ('+E.ids.length+') : '+E.ids.map(k=>D.cat[k].t).join(', ')+'. La présentation est proposée à tout le bureau.'));
  dialog({title:'Enregistrer la présentation · '+D.titre,body,buttons:[{t:'Annuler'},{t:'Enregistrer',pri:true,fn:()=>{ const v=inp.value.trim(); if(!v||sgtabReserve(D,v)){ maj(); inp.focus(); return false; }
    const p={nom:v,cols:E.ids.slice()}, i=L.findIndex(x=>x.nom===v); if(i>=0) L[i]=p; else L.push(p);
    sgtabEcrire(cle,L).then(ok=>{ if(!ok) return; sgtabPoste(cle,{nom:v}); toast('Présentation « '+v+' » enregistrée.'); if(apres) apres(); }); }}]});
  setTimeout(()=>{ inp.focus(); inp.select(); },0); }
function sgtabGerer(cle,apres){ const D=SGTAB.def[cle]; if(!D) return; const L=sgtabEnr(cle).map(p=>Object.assign({},p,{_n:p.nom})), box=h('div',{style:{width:'460px',maxWidth:'80vw'}});
  const draw=()=>{ box.innerHTML=''; if(!L.length){ box.append(h('div',{style:{color:'var(--s-gris)'}},'Aucune présentation enregistrée.')); return; }
    L.forEach((p,i)=>{ const inp=h('input',{class:'inp',value:p.nom,style:{flex:'1'}}); inp.oninput=()=>{ p.nom=inp.value; };
      box.append(h('div',{style:{display:'flex',gap:'8px',alignItems:'center',padding:'4px 0',borderBottom:'1px solid var(--s-filet)'}},inp,h('span',{style:{fontSize:'12px',color:'var(--s-gris)',whiteSpace:'nowrap'}},p.cols.length+' colonnes'),
        h('button',{type:'button',class:'btn',title:'Supprimer la présentation',onclick:()=>{ L.splice(i,1); draw(); }},'✕'))); }); };
  draw();
  dialog({title:'Présentations enregistrées · '+D.titre,body:box,buttons:[{t:'Annuler'},{t:'OK',pri:true,fn:()=>{ const noms=L.map(p=>p.nom.trim());
    if(noms.some(x=>!x)){ toast('Chaque présentation doit avoir un nom.',true); return false; } if(new Set(noms).size!==noms.length){ toast('Deux présentations portent le même nom.',true); return false; }
    if(noms.some(x=>sgtabReserve(D,x))){ toast('Ce nom est celui d’une présentation d’origine.',true); return false; }
    const P=sgtabLS()[cle]||{}, r=P.nom&&L.find(p=>p._n===P.nom), N=L.map(p=>{ const q=Object.assign({},p,{nom:p.nom.trim()}); delete q._n; return q; });
    sgtabEcrire(cle,N).then(ok=>{ if(!ok) return; if(P.nom) sgtabPoste(cle,r?{nom:r.nom.trim()}:null); if(apres) apres(); }); }}]}); }
/* menu « Présentation ▾ » d'un tableau (sous le bouton de la barre) */
function sgtabMenu(cle,el,apres){ const D=SGTAB.def[cle]; if(!D||!el) return; const E=sgtabEtat(cle), L=sgtabEnr(cle), F=()=>{ if(apres) apres(); };
  return sgMenuSous(el,[{t:'Standard',chk:E.std,fn:()=>{ if(!E.std){ sgtabPoste(cle,null); F(); } }},
    ...Object.keys(sgtabPre(D)).map(n=>({t:n,chk:!!E.actif&&E.actif.pre&&E.actif.nom===n,fn:()=>{ sgtabPoste(cle,{nom:n}); F(); }})),
    ...L.map(p=>({t:p.nom,chk:!!E.actif&&!E.actif.pre&&E.actif.nom===p.nom&&!E.perso,fn:()=>{ sgtabPoste(cle,{nom:p.nom}); F(); }})),
    ...(E.perso?[{t:'Personnalisée (non enregistrée)',chk:true,fn:()=>{}}]:[]),'-',
    {t:'Personnalisé …',fn:()=>sgtabChoisir(cle,apres)},{t:'Enregistrer la présentation …',fn:()=>sgtabEnregistrer(cle,apres)},
    ...(L.length?[{t:'Gérer les présentations …',fn:()=>sgtabGerer(cle,apres)}]:[])]); }
/* nom de la présentation affichée (page de garde des impressions) */
const sgtabNom=cle=>{ const E=sgtabEtat(cle); return E.std?'Standard':E.perso?'Personnalisée':E.actif?E.actif.nom:'Standard'; };

/* ── 3. Impression et export de la liste affichée, avec les colonnes de la présentation ── */
function sgtabImprimer(cle,lignes,ctx,o){ o=o||{}; const D=SGTAB.def[cle]; if(!D) return;
  if(!window.SGDH||!SGDH.ouvrir){ toast('Impression indisponible.',true); return; } if(!lignes||!lignes.length){ toast('Rien à imprimer.',true); return; }
  const cols=sgtabCols(cle), meta=(o.meta||[]).filter(x=>x&&x[1]!=null&&x[1]!=='');
  SGDH.ouvrir({cle:o.cle||('Liste · '+D.titre),titre:o.titre||D.titre,p:o.p||null,lb:o.lb||'Documents',type:o.type||'',sous:o.sous||'',
    meta:meta.concat([['Présentation',sgtabNom(cle)]]),cols:cols.map(c=>({t:c.t,r:c.r?1:0})),rows:lignes.map(r=>({c:sgtabTexte(cols,r,ctx),g:''}))
      .concat((()=>{ const T=o.total?sgtabTotal(cols,lignes,ctx,o.total.lib):null; return T?[{c:T,g:'t'}]:[]; })())}); }
function sgtabCsv(cle,lignes,ctx,nom){ const D=SGTAB.def[cle]; if(!D) return; const cols=sgtabCols(cle), t=h('table'), tr=a=>{ const r=h('tr'); a.forEach(v=>r.append(h('td',{},v==null?'':String(v)))); t.append(r); };
  tr(cols.map(c=>c.l||c.t)); (lignes||[]).forEach(r=>tr(sgtabTexte(cols,r,ctx))); sgCsvTable(t,(nom||D.titre.toLowerCase().replace(/[^a-z0-9]+/gi,'_'))+'_'+diso(new Date())+'.csv'); }

/* ── 4. Catalogues de colonnes ──
   « affaires » : Liste des affaires (Affaires ▸ Liste des affaires). Champs d'une affaire dans les données reprises (même modèle de données que l'ancien
   logiciel, libellés de sa fiche « Éditer l'affaire ») et colonnes calculées par l'app (phase actuelle, heures, activité). ctx : {ix, phL, catL, hp}. */
{ const dt=v=>v?dfr(v):'', adr=id=>{ const c=id!=null&&DS.get('contact',id); if(!c) return ''; const n=contactName(c)||'', l=typeof locality==='function'?locality(c):''; return [n,l].filter(Boolean).join(', '); };
  const memb=(p,role)=>[...new Set(DS.by('projectmember','PROJECT_ID',p.ID).filter(m=>+m.TEAMROLECODE===role).map(m=>{ const o=m.RESPCONTACT_ID!=null&&DS.get('contactowner',m.RESPCONTACT_ID);
    return o?ownerName(o,true):contactName(DS.get('contact',m.CONTACT_ID))||''; }).filter(Boolean))].join(', ');
  const nb=(v,d)=>v||v===0?num(+v,d||0):'';
  sgtabDef('affaires',{titre:'Liste des affaires',std:['num','titre','mo','statut','cat','phase','der','h30','act'],cat:{
    num:{t:'Numéro',l:'Numéro de l’affaire',cat:'Affaire',nw:1,v:p=>p.NUMBER||''},
    titre:{t:'Projet',l:'Désignation du projet',cat:'Affaire',w:220,f:p=>'<b>'+nxE(p.TITLE||'')+'</b>',v:p=>p.TITLE||''},
    desc:{t:'Complément',l:'Complément de la désignation',cat:'Affaire',w:180,v:p=>p.DESCRIPTION||''},
    statut:{t:'Statut',l:'Statut de l’affaire',cat:'Affaire',nw:1,f:p=>nxStateTag(p),v:p=>projState(p)},
    type:{t:'Type',l:'Type d’affaire (externe, interne)',cat:'Affaire',nw:1,v:p=>p.ISINTERNAL?'Interne':'Externe'},
    cat:{t:'Catégorie',l:'Catégorie (architecture, expertise, faisabilité, autres)',cat:'Affaire',nw:1,v:(p,x)=>x.catL(p)},
    ext:{t:'N° externe',l:'Numéro d’affaire externe',cat:'Affaire',v:p=>p.EXTERNALNUMBER||''},
    tri:{t:'Tri',l:'Tri',cat:'Affaire',v:p=>p.SORTLABEL||''},
    monnaie:{t:'Monnaie',l:'Monnaie',cat:'Affaire',v:p=>p.CURRENCY||''},
    phase:{t:'Phase actuelle',l:'Phase actuelle (d’après la feuille d’heures)',cat:'Suivi',w:110,v:(p,x)=>x.phL(p)},
    phen:{t:'Phase en cours',l:'Phase en cours (fiche de l’affaire)',cat:'Suivi',v:p=>{ const f=p.CURRENTPROJECTPHASE_ID!=null&&DS.get('projectphase',p.CURRENTPROJECTPHASE_ID); return f?nm(f):''; }},
    der:{t:'Dernière saisie',l:'Date de la dernière heure saisie',cat:'Suivi',nw:1,v:(p,x)=>{ const d=x.ix(p).derD; return d?dfr(diso(d)):''; }},
    h30:{t:'Heures 30 j',l:'Heures saisies ces 30 derniers jours',cat:'Suivi',r:1,v:(p,x)=>x.ix(p).h30?nxH(x.ix(p).h30):''},
    act:{t:'Activité',l:'Activité (heures saisies ces 30 jours)',cat:'Suivi',c:1,f:(p,x)=>x.ix(p).h30?'<i class="sg-ag-pt on" title="Heures saisies ces 30 jours"></i>':'<i class="sg-ag-pt" title="Aucune heure saisie ces 30 jours"></i>',v:(p,x)=>x.ix(p).h30?'oui':''},
    htot:{t:'Heures saisies',l:'Heures saisies depuis le début',cat:'Suivi',r:1,v:(p,x)=>x.ix(p).tot?nxH(x.ix(p).tot):''},
    hprev:{t:'Heures prévues',l:'Heures prévues au contrat des phases',cat:'Suivi',r:1,v:(p,x)=>{ const v=x.hp(p); return v?nxH(v):''; }},
    hpct:{t:'Consommé',l:'Heures saisies en % des heures prévues',cat:'Suivi',r:1,v:(p,x)=>{ const v=x.hp(p); return v?Math.round(x.ix(p).tot/v*100)+' %':''; }},
    coll:{t:'Collaborateurs',l:'Collaborateurs ayant saisi des heures',cat:'Suivi',r:1,v:(p,x)=>{ const n=Object.keys(x.ix(p).st||{}).length; return n?String(n):''; }},
    resp:{t:'Responsable',l:'Responsable de l’affaire (intervenants)',cat:'Suivi',v:p=>memb(p,6)},
    debut:{t:'Début',l:'Début du projet',cat:'Délais',nw:1,v:p=>dt(p.PROJECTSTARTDATE)},
    fin:{t:'Fin',l:'Fin du projet',cat:'Délais',nw:1,v:p=>dt(p.PROJECTENDDATE)},
    dplan:{t:'Début de planification',l:'Début de planification',cat:'Délais',v:p=>p.STARTOFPLANNING||''},
    fplan:{t:'Fin de planification',l:'Fin de planification',cat:'Délais',v:p=>p.ENDOFPLANNING||''},
    dtrav:{t:'Début des travaux',l:'Début des travaux',cat:'Délais',v:p=>p.STARTOFCONSTRUCTION||''},
    ftrav:{t:'Fin des travaux',l:'Fin des travaux',cat:'Délais',v:p=>p.ENDOFCONSTRUCTION||''},
    cles:{t:'Remise des clés',l:'Remise des clés',cat:'Délais',v:p=>p.MOVEINDEADLINE||''},
    mo:{t:'Maître d’ouvrage',l:'Maître d’ouvrage',cat:'Adresses',w:150,v:p=>projMO(p)||''},
    lieu:{t:'Lieu',l:'District (lieu de l’affaire)',cat:'Adresses',v:p=>p.LOCATION||''},
    adr:{t:'Adresse d’affaire',l:'Adresse d’affaire',cat:'Adresses',w:180,v:p=>adr(p.CONTACT1_ID)},
    fact:{t:'Adresse de facturation',l:'Adresse de facturation',cat:'Adresses',w:180,v:p=>adr(p.CONTACT2_ID)},
    livr:{t:'Adresse de livraison',l:'Adresse de livraison',cat:'Adresses',w:180,v:p=>adr(p.CONTACT3_ID)},
    depot:{t:'Retour des offres',l:'Lieu de dépôt des offres',cat:'Adresses',w:180,v:p=>adr(p.CONTACT4_ID)},
    plot:{t:'Zone/quartier',l:'Zone/quartier',cat:'Adresses',v:p=>p.PLOT||''},
    rf:{t:'Registre foncier',l:'Numéro registre foncier',cat:'Adresses',v:p=>p.LANDREGISTERNR||''},
    compta:{t:'Service comptabilité',l:'Service comptabilité',cat:'Adresses',v:p=>p.ACCOUNTINGAREA||''},
    surf:{t:'Surface m²',l:'Surface de plancher (m²)',cat:'Caractéristiques',r:1,v:p=>nb(p.AREA)},
    vol:{t:'Volume m³',l:'Volume construit (m³)',cat:'Caractéristiques',r:1,v:p=>nb(p.VOLUME)},
    vb:{t:'VB SIA 416',l:'Volume bâti SIA 416 (m³, Surfaces et volumes)',cat:'Caractéristiques',r:1,v:p=>{ const v=typeof sgVolumeSIA416==='function'?sgVolumeSIA416(p):0; return v?num(v,0):''; }},
    icc:{t:'Indice ICC',l:'Indice ICC',cat:'Caractéristiques',r:1,v:p=>nb(p.BASISINDEX,1)}}}); }
/* listes des modules (SGSV.outils.monter : devis, contrôles des coûts, estimations, soumissions, frais…) — boutons du bandeau (déplacés dans la barre en
   texte par sgBandeauVersBarre), leurs actions, le tableau et sa copie */
function sgtabBoutons(btn){ return btn('pres','Présentation ▾','list',0,'Colonnes du tableau : Standard, présentations enregistrées, Personnalisé …')+btn('imp','Imprimer','print',0,'Liste affichée (PDF)'); }
function sgtabActionListe(cle,I,a,t,imp){ if(a==='pres'){ sgtabMenu(cle,t,()=>I.dessiner()); return true; }
  if(a==='imp'){ let o={}; try{ o=(typeof imp==='function'?imp():imp)||{}; }catch(_){ o={}; } sgtabImprimer(cle,I.R||[],o.ctx||null,o); return true; } return false; }
/* ligne de total sous les colonnes affichées qui ont une somme (c.sum(lignes, ctx) → texte) ; libellé dans la première colonne */
const sgtabTotal=(cols,rows,ctx,lib)=>cols.some(c=>c.sum)?cols.map((c,i)=>{ let v=''; try{ v=c.sum?c.sum(rows,ctx):''; }catch(_){ v=''; } return i===0&&!c.sum?(lib||'Total'):(v==null?'':String(v)); }):null;
function sgtabTableau(cle,rows,ctx,tr,cls,tot){ const cols=sgtabCols(cle), T=tot&&rows.length?sgtabTotal(cols,rows,ctx,tot.lib):null;
  return '<table class="nx-tbl sgsv-tb sgtab-t'+(cls?' '+cls:'')+'"><thead>'+sgtabEntete(cols)+'</thead><tbody>'+rows.map(r=>'<tr'+(tr?tr(r):'')+'>'+sgtabCellules(cols,r,ctx)+'</tr>').join('')
    +(T?'<tr class="tot">'+T.map((v,i)=>'<td'+sgtabCl(cols[i])+'>'+nxE(v)+'</td>').join('')+'</tr>':'')+'</tbody></table>'; }
/* tableau avec des colonnes fixes autour des colonnes choisies (case à cocher avant, boutons après…) : o = {tr(r), cls, attr, avant:{th, td(r), tot}, apres:{th, td(r), tot},
   tot:{lib} (ligne de total sous les colonnes qui ont une somme), apresTot (html ajouté après la ligne de total)} */
/* lignes de total supplémentaires (o.totaux = [{lib, k, lignes}] : « Effectif », « Équivalents plein temps »…) : chaque colonne donne sa valeur par c.tots[k](lignes, ctx) ;
   libellé dans la première colonne sans valeur ; ligne omise si aucune colonne affichée n'a de valeur pour elle (16.11.2026, tableaux croisés) */
const sgtabTotalK=(cols,rows,ctx,lib,k)=>{ if(!cols.some(c=>c.tots&&c.tots[k])) return null; let pose=false;
  return cols.map(c=>{ const f=c.tots&&c.tots[k]; if(f){ let v=''; try{ v=f(rows,ctx); }catch(_){ v=''; } return v==null?'':String(v); } if(!pose){ pose=true; return lib||'Total'; } return ''; }); };
function sgtabTableauX(cle,rows,ctx,o){ o=o||{}; const cols=sgtabCols(cle), A=o.avant||null, B=o.apres||null, T=o.tot&&rows.length?sgtabTotal(cols,o.totLignes||rows,ctx,o.tot.lib):null;   /* o.totLignes : total sur toutes les lignes quand le tableau n'en montre qu'une partie */
  const TT=rows.length?(o.totaux||[]).map(t=>sgtabTotalK(cols,t.lignes||rows,ctx,t.lib,t.k)).filter(Boolean):[];
  const ligT=V=>'<tr class="tot">'+(A?(A.tot!=null?A.tot:'<td></td>'):'')+V.map((v,i)=>'<td'+sgtabCl(cols[i])+'>'+nxE(v)+'</td>').join('')+(B?(B.tot!=null?B.tot:'<td></td>'):'')+'</tr>';
  return '<table class="nx-tbl sgtab-t'+(o.cls?' '+o.cls:'')+'"'+(o.attr||'')+'><thead><tr>'+(A?A.th:'')+sgtabEntete(cols).replace(/^<tr>|<\/tr>$/g,'')+(B?B.th:'')+'</tr></thead><tbody>'
    +rows.map(r=>'<tr'+(o.tr?o.tr(r):'')+'>'+(A?A.td(r):'')+sgtabCellules(cols,r,ctx)+(B?B.td(r):'')+'</tr>').join('')
    +(T?ligT(T):'')+TT.map(ligT).join('')+'</tbody></table>'; }
function sgtabCopie(box){ const t=box&&box.querySelector('table.sgtab-t'); if(t) ctCopy(sgCtxTexteTableau(t),'Tableau copié (à coller dans un tableur).'); else toast('Rien à copier.',true); }
/* colonnes communes des listes de documents (devis, contrôles des coûts, estimations) : projet, version, numéro, statut, note, modification */
function sgtabColsDoc(o){ const E=nxE, prj=d=>DS.get('project',d.PROJECT_ID)||{};
  return {projet:{t:'Projet',l:'Numéro du projet',cat:'Projet',nw:1,f:d=>'<span title="'+E(prj(d).TITLE||'')+'">'+E(prj(d).NUMBER||'')+'</span>',v:d=>prj(d).NUMBER||''},
    projetd:{t:'Désignation du projet',cat:'Projet',v:d=>prj(d).TITLE||''},mo:{t:'Maître d’ouvrage',cat:'Projet',v:d=>{ try{ return projMO(prj(d))||''; }catch(_){ return ''; } }},
    version:{t:o.version||'Version',l:'Version (titre du document)',cat:'Document',w:160,f:d=>'<b>'+E(d.VERSION||'(sans titre)')+'</b>'+(o.tags?o.tags(d):''),v:d=>d.VERSION||''},
    num:{t:'N°',l:'Numéro de version',cat:'Document',r:1,v:d=>d.VERSIONNUMBER==null?'':String(d.VERSIONNUMBER)},
    statut:{t:'Statut',cat:'Document',nw:1,v:d=>o.statut(d)||''},
    note:{t:o.note||'Note',cat:'Document',f:d=>'<span class="sgtab-note" title="'+E(d.NOTE||'')+'">'+E(d.NOTE||'')+'</span>',v:d=>d.NOTE||''},
    supp:{t:'Supprimé',l:'Document supprimé (corbeille)',cat:'Document',nw:1,v:d=>+d.ISMARKEDASDELETED?'Oui':''},
    modifie:{t:'Modifié',l:'Date de modification',cat:'Suivi',nw:1,v:d=>dfr(d.CHANGEDDATE)},par:{t:'Par',l:'Modifié par (utilisateur)',cat:'Suivi',nw:1,v:d=>d.USERID||''}}; }
/* colonne d'un tableau du moteur ({k,t,cls,f,v} : colonnes de l'ancien logiciel déjà reproduites) → colonne d'un catalogue ; texte = ce qui est affiché */
const sgtabMoteur=(c,cat,o)=>Object.assign({t:c.t,cat,f:r=>c.f?c.f(r):nxE(r[c.k]==null?'':String(r[c.k])),v:r=>c.f?sgtabBrut(c.f(r)):(r[c.k]==null?'':String(r[c.k])),r:c.cls==='r'?1:0,c:c.cls==='c'?1:0},o||{});
/* contexte commun des listes de projets : heures par projet (total, 30 jours, dernière saisie, par collaborateur), phase actuelle, catégorie, heures prévues */
function sgtabCtxProjets(){ const lim=dayKey(new Date(Date.now()-30*864e5)), I={}, PA={}, HP={}, Z={der:0,derD:null,h30:0,tot:0,st:{}};
  DS.all('timelog').forEach(r=>{ const v=+r.TIMEPERIOD||0, k=tlKey(r), x=I[r.PROJECT_ID]||(I[r.PROJECT_ID]={der:0,derD:null,h30:0,tot:0,st:{}}); x.tot+=v; x.st[r.STAFF_ID]=(x.st[r.STAFF_ID]||0)+v; if(k>x.der){ x.der=k; x.derD=tlDate(r); } if(k>=lim) x.h30+=v; });
  const ix=p=>I[p.ID]||Z, phase=p=>PA[p.ID]!==undefined?PA[p.ID]:(PA[p.ID]=sgPhaseActuelle(p));
  return {ix,phase,phL:p=>sgTermine(p)?'Terminé':(sgPhaseLib(phase(p),true)||''),catL:p=>{ const c=sgCatOuInterne(p); return c==='interne'?'Autres':c==='architecture'?'':(SG_CAT_L[c]||''); },
    hp:p=>HP[p.ID]!==undefined?HP[p.ID]:(HP[p.ID]=DS.by('projectphase','PROJECT_ID',p.ID).reduce((t,f)=>t+(+f.TIMEBUDGET||0),0))}; }
/* « projets » (Projets ▸ Liste des projets) et « mesprojets » (Projets ▸ Mes projets) : mêmes colonnes que la Liste des affaires ; Mes projets ajoute mes heures */
{ const A=SGTAB.def.affaires.cat;
  sgtabDef('projets',{titre:'Liste des projets',std:['num','titre','cat','mo','lieu','statut'],cat:A});
  sgtabDef('mesprojets',{titre:'Mes projets',std:['num','titre','cat','mo','lieu','statut','phase','mesh30'],cat:Object.assign({},A,{
    mesh30:{t:'Mes heures (30 j)',l:'Mes heures saisies ces 30 derniers jours',cat:'Suivi',r:1,v:(p,x)=>x.mes&&x.mes[p.ID]?nxH(x.mes[p.ID])+' h':''}})}); }
/* « adresses » (Contacts ▸ Liste des adresses) : lignes {c (adresse), o (entité), nom, rel, t (type de l'entité)}. Colonnes de la liste d'adresses de l'ancien logiciel
   (reproduites par le moteur : ACOL) et ses présentations (PRES : « Standard » de l'ancien logiciel proposée sous le nom « Coordonnées »), plus celles de l'app. */
if(typeof ACOL==='object'&&ACOL){ const C={}, m=(k,cat,o)=>{ if(ACOL[k]) C[k]=Object.assign(sgtabMoteur(ACOL[k],cat),{f:x=>ACOL[k].f?ACOL[k].f(x.c):nxE(x.c[ACOL[k].k]==null?'':String(x.c[ACOL[k].k])),
      v:x=>ACOL[k].f?sgtabBrut(ACOL[k].f(x.c)):(x.c[ACOL[k].k]==null?'':String(x.c[ACOL[k].k]))},o||{}); };
  const cats=x=>{ try{ return contactProps(x.c).map(nm).filter(Boolean); }catch(_){ return []; } };
  C.nom={t:'Nom',l:'Nom (entité ou adresse) et catégories',cat:'Contact',w:180,f:x=>{ const t=cats(x); return '<b>'+nxE(x.nom)+'</b>'+t.slice(0,2).map(v=>' <span class="nx-tag">'+nxE(v)+'</span>').join('')+(t.length>2?' <span class="nx-tag" title="'+nxE(t.slice(2).join(', '))+'">+'+(t.length-2)+'</span>':''); },v:x=>x.nom};
  C.type={t:'Type',l:'Type de contact (société, personne, famille…)',cat:'Contact',nw:1,v:x=>(typeof OWNER_T!=='undefined'&&OWNER_T[x.t])||''};
  m('ent','Contact'); m('rel','Contact',{w:140});
  C.adresse={t:'Adresse',l:'Rue, complément et type d’adresse',cat:'Adresse',w:180,f:x=>{ const at=+x.c.ADDRESSTYPECODE&&typeof ADR_T!=='undefined'?ADR_T[+x.c.ADDRESSTYPECODE]||'':''; return nxE([x.c.STREET,x.c.POBOX].filter(Boolean).join(', '))+(at?' <span class="sgl-at">'+nxE(at)+'</span>':''); },
    v:x=>{ const at=+x.c.ADDRESSTYPECODE&&typeof ADR_T!=='undefined'?ADR_T[+x.c.ADDRESSTYPECODE]||'':''; return [x.c.STREET,x.c.POBOX].filter(Boolean).join(', ')+(at?' ('+at+')':''); }};
  ['atype','n1','n2','n3','street','pobox'].forEach(k=>m(k,'Adresse')); m('loc','Adresse',{nw:1}); m('pays','Adresse',{nw:1});
  m('tel','Communication',{nw:1}); m('mob','Communication',{nw:1}); m('fax','Communication',{nw:1}); m('mail','Communication'); m('web','Communication'); m('skype','Communication');
  m('cfc','Classement',{nw:1}); C.cats={t:'Catégories',cat:'Classement',v:x=>cats(x).join(', ')}; ['abr','stat'].forEach(k=>m(k,'Classement'));
  ['sal','fn','prof','lang','rem'].forEach(k=>m(k,'Divers')); m('cre','Divers',{nw:1}); m('upd','Divers',{nw:1});
  const P={}, tr=L=>L.map(k=>k==='ty'?'type':k).filter(k=>C[k]);
  if(typeof PRES==='object'&&PRES){ Object.entries(PRES).forEach(([n,L])=>{ P[n==='Standard'?'Coordonnées':n]=tr(L); }); }
  sgtabDef('adresses',{titre:'Liste des adresses',std:['nom','type','rel','adresse','loc','tel','mail','cfc'],cat:C,pres:P}); }
/* « membres » (Équipe ▸ Membres) : lignes = collaborateurs (staff) ; adresse de la personne (contact PERSON_ID). Pas de données privées (adresse privée, n° AVS,
   date de naissance) ; vacances et remarque : administrateur ou droit « équipe : taux ». */
{ const pers=s=>DS.get('contact',s.PERSON_ID)||{}, tel=(c,n)=>{ try{ return phone(c,n)||''; }catch(_){ return ''; } }, app=c=>{ try{ return ownerName(relOf(c),true)||''; }catch(_){ return ''; } };
  const rh=()=>{ try{ return sgAdmin()||sgDroit('equipe','taux'); }catch(_){ return false; } };
  sgtabDef('membres',{titre:'Membres de l’équipe',std:['ini','membre','rel','tel','mob','mail','debut','fin','gel'],cat:{
    ini:{t:'Initiales',th:'',cat:'Membre',c:1,f:s=>'<span class="sgsv-ini">'+nxE(s.INITIALS||'—')+'</span>',v:s=>s.INITIALS||''},
    membre:{t:'Membre',l:'Membre et fonction',cat:'Membre',w:170,f:s=>{ const fn=pers(s).COMPANYROLE||''; return '<b>'+nxE(staffName(s))+'</b>'+(fn?'<span class="sgsv-sous">'+nxE(fn)+'</span>':''); },v:s=>{ const fn=pers(s).COMPANYROLE||''; return staffName(s)+(fn?' · '+fn:''); }},
    nom:{t:'Nom',l:'Nom du membre',cat:'Membre',v:s=>staffName(s)},
    fn:{t:'Fonction',cat:'Membre',v:s=>pers(s).COMPANYROLE||''},
    prof:{t:'Profession',cat:'Membre',v:s=>pers(s).PROFESSION||''},
    rel:{t:'Appartient à',cat:'Membre',nw:1,v:s=>app(pers(s))},
    actif:{t:'Actif',l:'Membre actuel',cat:'Membre',nw:1,v:s=>+s.ISACTIVE?'Oui':'Non'},
    interne:{t:'Interne',l:'Collaborateur interne',cat:'Membre',nw:1,v:s=>+s.ISINTERNAL?'Oui':'Non'},
    tri:{t:'Ordre',l:'Ordre dans les listes',cat:'Membre',r:1,v:s=>s.SORTORDER==null?'':String(s.SORTORDER)},
    tel:{t:'Téléphone',cat:'Communication',nw:1,v:s=>tel(pers(s),1)},mob:{t:'Mobile',l:'Téléphone mobile',cat:'Communication',nw:1,v:s=>tel(pers(s),2)},
    mail:{t:'Courriel',cat:'Communication',v:s=>pers(s).EMAIL1||''},
    debut:{t:'Engagement',l:'Date d’engagement',cat:'Engagement',nw:1,v:s=>dfr(s.JOININGDATE)},fin:{t:'Départ',l:'Date de départ',cat:'Engagement',nw:1,v:s=>dfr(s.QUITTINGDATE)},
    gel:{t:'Heures bloquées',l:'Saisie des heures bloquée jusqu’au',cat:'Heures',nw:1,v:s=>+s.ISTIMELOGFROZEN&&s.TIMELOGFREEZINGDATE?'jusqu’au '+dfr(s.TIMELOGFREEZINGDATE):''},
    compl:{t:'Heures complètes',l:'Heures complètes jusqu’au',cat:'Heures',nw:1,v:s=>s.TIMELOGCOMPLETEDDATE?'jusqu’au '+dfr(s.TIMELOGCOMPLETEDDATE):''},
    vac:{t:'Vacances (h)',l:'Droit annuel aux vacances (heures)',cat:'Vacances',r:1,ok:rh,v:s=>s.HOLIDAYS==null||s.HOLIDAYS===''?'':num(+s.HOLIDAYS,1)},
    solde:{t:'Solde de vacances',l:'Solde de vacances reporté (heures)',cat:'Vacances',r:1,ok:rh,v:s=>s.HOLIDAYBALANCE==null||s.HOLIDAYBALANCE===''?'':num(+s.HOLIDAYBALANCE,1)+(s.HOLIDAYBALANCEYEAR?' ('+s.HOLIDAYBALANCEYEAR+')':'')},
    rem:{t:'Remarque',cat:'Divers',ok:rh,v:s=>s.REMARK||''}}}); }
/* « taches » / « tachesreg » (Projets ▸ Tâches : en cours et urgentes / réglées) : lignes = tâches (projecttask). Colonnes de la liste des tâches de l'ancien logiciel
   (reproduites par le moteur : PTC) et colonnes de l'app (projet, tâche avec le début de sa description). */
if(typeof PTC==='object'&&PTC){ const prj=t=>DS.get('project',t.PROJECT_ID)||{}, ret=t=>!t.DONEDATE&&t.DEADLINE&&String(t.DEADLINE).slice(0,10)<diso(new Date());
  const C={
    projet:{t:'Projet',l:'Numéro du projet',cat:'Tâche',nw:1,f:t=>{ const p=prj(t); return '<b title="'+nxE(p.TITLE||'')+'">'+nxE(p.NUMBER||'')+'</b>'; },v:t=>prj(t).NUMBER||''},
    projetd:{t:'Désignation du projet',cat:'Tâche',v:t=>prj(t).TITLE||''},
    tache:{t:'Tâche',l:'Objet, urgence et début de la description',cat:'Tâche',w:220,f:t=>{ const d=String(t.DESCRIPTION||'').split('\n')[0], fait=+t.PROJECTTASKSTATECODE===3;
        return '<b>'+nxE(t.SUBJECT||'(sans objet)')+'</b>'+(t.ISURGENT&&!fait?'<span class="sgsv-tag ret">urgente</span>':'')+(d?'<span class="sgsv-sous">'+nxE(d.length>110?d.slice(0,109)+'…':d)+'</span>':''); },
      v:t=>{ const d=String(t.DESCRIPTION||'').split('\n')[0]; return (t.SUBJECT||'(sans objet)')+(d?' — '+d:''); }}};
  const m=(k,cat,o)=>{ if(PTC[k]) C[k==='d'?'debut':k]=sgtabMoteur(PTC[k],cat,o); };
  m('s','Tâche',{t:'Objet',l:'Objet de la tâche (« Concerne »)'}); m('de','Tâche'); m('st','Tâche',{nw:1}); m('pr','Tâche',{nw:1});
  C.urg={t:'Urgente',cat:'Tâche',nw:1,v:t=>t.ISURGENT?'Oui':''}; C.nonlu={t:'Non lue',l:'Tâche pas encore ouverte',cat:'Tâche',nw:1,v:t=>t.ISUNTOUCHED?'Oui':''};
  m('r','Personnes'); m('c','Personnes'); m('by','Personnes',{t:'Créée par',nw:1}); m('o','Projet');
  m('d','Dates',{t:'Début',nw:1}); C.dl={t:'Délai',cat:'Dates',nw:1,f:t=>{ const v=dfr(t.DEADLINE); return ret(t)?'<span class="sgsv-ret">'+nxE(v)+'</span>':nxE(v); },v:t=>dfr(t.DEADLINE)}; m('dd','Dates',{t:'Réglée le',nw:1});
  sgtabDef('taches',{titre:'Tâches',std:['projet','tache','c','pr','debut','dl','by'],cat:C});
  sgtabDef('tachesreg',{titre:'Tâches réglées',std:['projet','tache','c','pr','debut','dd','by'],cat:C}); }
/* « renta » (Finances ▸ Rentabilité des projets) : lignes = résultat de sgRenta (projet, heures, coût de revient, honoraires, facturé, encaissé, marge, alertes) */
{ const ch=v=>nxCHF(v||0), sm=k=>L=>nxCHF(L.reduce((t,x)=>t+(+x[k]||0),0)), pc=v=>v==null?'':Math.round(v*100)+' %';
  sgtabDef('renta',{titre:'Rentabilité des projets',std:['projet','contrat','cout','conso','facht','fact','enc','marge','al'],cat:{
    projet:{t:'Projet',l:'Numéro et désignation du projet',cat:'Projet',w:220,f:x=>'<span class="nx-tag num">'+nxE(x.p.NUMBER||'')+'</span> '+nxE(x.p.TITLE||''),v:x=>[x.p.NUMBER,x.p.TITLE].filter(Boolean).join(' ')},
    num:{t:'Numéro',cat:'Projet',nw:1,v:x=>x.p.NUMBER||''},titre:{t:'Désignation',cat:'Projet',v:x=>x.p.TITLE||''},
    mo:{t:'Maître d’ouvrage',cat:'Projet',v:x=>{ try{ return projMO(x.p)||''; }catch(_){ return ''; } }},
    statut:{t:'Statut',cat:'Projet',nw:1,v:x=>{ try{ return projState(x.p)||''; }catch(_){ return ''; } }},
    phase:{t:'Phase actuelle',cat:'Projet',v:x=>{ try{ return sgTermine(x.p)?'Terminé':(sgPhaseLib(sgPhaseActuelle(x.p),true)||''); }catch(_){ return ''; } }},
    h:{t:'Heures',l:'Heures saisies',cat:'Heures',r:1,nw:1,v:x=>nxH(x.h||0),sum:L=>nxH(L.reduce((t,x)=>t+(+x.h||0),0))},
    hc:{t:'Heures facturables',cat:'Heures',r:1,nw:1,v:x=>nxH(x.hc||0),sum:L=>nxH(L.reduce((t,x)=>t+(+x.hc||0),0))},
    contrat:{t:'Honoraires HT',l:'Honoraires du contrat HT',cat:'Honoraires',r:1,nw:1,v:x=>x.contratHT?ch(x.contratHT):'—',sum:sm('contratHT')},
    contratttc:{t:'Honoraires TTC',l:'Honoraires du contrat TTC',cat:'Honoraires',r:1,nw:1,v:x=>x.contratTTC?ch(x.contratTTC):'—',sum:sm('contratTTC')},
    cout:{t:'Coût de revient',l:'Coût de revient des heures saisies (taux internes)',cat:'Coût',r:1,nw:1,v:x=>ch(x.cout),sum:sm('cout')},
    conso:{t:'Consommé',l:'Coût de revient en % des honoraires',cat:'Coût',nw:1,f:x=>sgBarre(x.conso,x.conso>1?'var(--s-rouge)':x.conso>=.8?'var(--s-orange)':null)+' '+sgPct(x.conso),v:x=>pc(x.conso),cl:x=>x.conso>1?'sgtab-rouge':''},
    reste:{t:'Honoraires − coût',l:'Honoraires HT moins coût de revient',cat:'Coût',r:1,nw:1,v:x=>ch(x.reste),cl:x=>x.reste<0?'sgtab-rouge':'',sum:sm('reste')},
    facht:{t:'Facturé HT',cat:'Facturation',r:1,nw:1,v:x=>ch(x.factHT),sum:sm('factHT')},
    factttc:{t:'Facturé TTC',cat:'Facturation',r:1,nw:1,v:x=>ch(x.factTTC),sum:sm('factTTC')},
    fact:{t:'Facturé',l:'Facturé en % des honoraires',cat:'Facturation',nw:1,f:x=>sgBarre(x.fact)+' '+sgPct(x.fact),v:x=>pc(x.fact)},
    enc:{t:'Encaissé TTC',cat:'Facturation',r:1,nw:1,v:x=>ch(x.encTTC),sum:sm('encTTC')},
    marge:{t:'Marge',l:'Facturé HT moins coût de revient',cat:'Marge',r:1,nw:1,v:x=>ch(x.marge),cl:x=>x.marge<0?'sgtab-rouge':'',sum:sm('marge')},
    margepct:{t:'Marge %',l:'Marge en % du facturé HT',cat:'Marge',r:1,nw:1,v:x=>x.factHT?Math.round(x.marge/x.factHT*100)+' %':''},
    al:{t:'Alertes',cat:'Marge',f:x=>(x.al||[]).map(sgAlerteTag).join(' '),v:x=>(x.al||[]).map(a=>a[1]).join(' ; ')}}}); }
/* « cct » (Ressources humaines ▸ Heures dues et vacances) : lignes {s, c (calcul CCT de l'année), t (heures dues enregistrées)} ; le taux d'occupation et la date de
   naissance restent des champs de saisie (data-occ, data-nais), le bouton « Appliquer » reste en dernière colonne */
{ const sumT=t=>t?[...Array(12)].reduce((a,_,i)=>a+(+t['TARGETHOURS'+i]||0),0):null, M=(typeof MOIS!=='undefined'&&MOIS)||['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
  const C={coll:{t:'Collaborateur',cat:'Collaborateur',w:150,f:x=>'<b>'+nxE(staffName(x.s))+'</b>',v:x=>staffName(x.s)},
    occ:{t:'Occupation %',l:'Taux d’occupation (saisie)',cat:'Collaborateur',f:x=>'<input class="inp" type="number" step="5" min="0" max="100" data-occ="'+x.s.ID+'" value="'+Math.round(x.c.occ*100)+'" style="width:70px;text-align:right">',v:x=>Math.round(x.c.occ*100)+' %'},
    nais:{t:'Naissance',l:'Date de naissance (saisie)',cat:'Collaborateur',f:x=>'<input class="inp" type="date" data-nais="'+x.s.ID+'" value="'+(x.c.nais||'')+'" style="width:140px">',v:x=>x.c.nais?dfr(x.c.nais):''},
    age:{t:'Âge au 31.12',cat:'Collaborateur',r:1,v:x=>x.c.age==null?'—':String(x.c.age)},
    eng:{t:'Engagement',l:'Période d’engagement',cat:'Collaborateur',nw:1,v:x=>(x.c.deb?dfr(x.c.deb):'')+(x.c.fin?' → '+dfr(x.c.fin):'')},
    du:{t:'Heures dues',l:'Heures dues de l’année',cat:'Heures dues',r:1,nw:1,f:x=>'<b>'+nxH(x.c.an)+'</b>',v:x=>nxH(x.c.an),sum:L=>nxH(L.reduce((a,x)=>a+(+x.c.an||0),0))},
    vj:{t:'Vacances (jours)',cat:'Vacances',r:1,nw:1,v:x=>num(x.c.vacJours,1)},vh:{t:'Vacances (heures)',cat:'Vacances',r:1,nw:1,v:x=>nxH(x.c.vacHeures),sum:L=>nxH(L.reduce((a,x)=>a+(+x.c.vacHeures||0),0))},
    enr:{t:'Enregistré',l:'Heures dues enregistrées (orange : différentes du calcul CCT)',cat:'Heures dues',r:1,nw:1,cl:x=>{ const e=sumT(x.t); return e==null||Math.abs(e-x.c.an)>0.05?'sgtab-orange':''; },v:x=>{ const e=sumT(x.t); return e==null?'—':nxH(e); }}};
  M.forEach((t,i)=>{ C['m'+i]={t,l:'Heures dues · '+t,cat:'Heures dues par mois',r:1,nw:1,v:x=>nxH(x.c.mois[i]),sum:L=>nxH(L.reduce((a,x)=>a+(+x.c.mois[i]||0),0))}; });
  sgtabDef('cct',{titre:'Heures dues et vacances',std:['coll','occ','nais','age','eng','du',...M.map((_,i)=>'m'+i),'vj','vh','enr'],cat:C}); }
/* « bcl » (Ressources humaines ▸ Bouclement annuel) : lignes {s, b (soldes calculés), v (validation enregistrée)} ; Validation et Transfert restent en dernières colonnes */
{ const neg=v=>+v<0?'sgtab-rouge':'';
  sgtabDef('bcl',{titre:'Bouclement annuel',std:['coll','du','fait','solde','rep','hs','vdroit','vpris','vsolde','vjours'],cat:{
    coll:{t:'Collaborateur',cat:'Collaborateur',w:150,f:x=>'<b>'+nxE(staffName(x.s))+'</b>',v:x=>staffName(x.s)},
    du:{t:'Heures dues',cat:'Heures',r:1,nw:1,v:x=>nxH(x.b.du)},fait:{t:'Heures saisies',cat:'Heures',r:1,nw:1,v:x=>nxH(x.b.fait)},
    solde:{t:'Solde de l’année',l:'Heures saisies − heures dues',cat:'Heures',r:1,nw:1,cl:x=>neg(x.b.solde),v:x=>nxH(x.b.solde)},
    rep:{t:'Report',l:'Report de l’année précédente',cat:'Heures',r:1,nw:1,v:x=>nxH(x.b.rep)},
    hs:{t:'Heures sup. à reporter',cat:'Heures',r:1,nw:1,cl:x=>neg(x.b.hs),f:x=>'<b>'+nxH(x.b.hs)+'</b>',v:x=>nxH(x.b.hs)},
    vdroit:{t:'Droit vacances (h)',l:'Droit aux vacances de l’année (heures)',cat:'Vacances',r:1,nw:1,v:x=>x.b.vacDroit==null?'—':nxH(x.b.vacDroit)},
    vpris:{t:'Vacances prises (h)',cat:'Vacances',r:1,nw:1,v:x=>x.b.vacPris==null?'—':nxH(x.b.vacPris)},
    vsolde:{t:'Solde vacances (h)',cat:'Vacances',r:1,nw:1,f:x=>'<b>'+(x.b.vacSolde==null?'—':nxH(x.b.vacSolde))+'</b>',v:x=>x.b.vacSolde==null?'—':nxH(x.b.vacSolde)},
    vjours:{t:'Solde vacances (jours)',cat:'Vacances',r:1,nw:1,v:x=>x.b.vacSolde==null?'':num(x.b.vacSolde/((typeof SG_CCT!=='undefined'&&SG_CCT.hj)||8.5),1)}}}); }
/* « ctr » (Ressources humaines ▸ Contrats de travail) : lignes = collaborateurs ; contrat en vigueur à la date du jour ; Documents et boutons restent en dernières colonnes */
{ const auj=()=>diso(new Date()), cv=s=>{ try{ return sgCtrEnVigueur(s.ID,auj()); }catch(_){ return null; } }, fin=s=>{ try{ return sgCtrFin(s.ID); }catch(_){ return null; } };
  const cat=c=>c?(((typeof SG_GRILLE!=='undefined'&&SG_GRILLE.cat[c.CATEGORIE])||{}).t||''):'';
  sgtabDef('ctr',{titre:'Contrats de travail',std:['coll','fonction','taux','salaire','statut'],cat:{
    coll:{t:'Collaborateur',l:'Collaborateur, entrée et fin',cat:'Collaborateur',w:170,f:s=>{ const f=fin(s); return '<b>'+nxE(staffName(s))+'</b><br><span style="font-size:11.5px;color:var(--s-gris)">'+(s.JOININGDATE?'entrée '+dfr(String(s.JOININGDATE).slice(0,10)):'')+(f&&f.FIN?' · fin '+dfr(f.FIN):'')+'</span>'; },v:s=>staffName(s)},
    nom:{t:'Nom',cat:'Collaborateur',v:s=>staffName(s)},entree:{t:'Entrée',cat:'Collaborateur',nw:1,v:s=>s.JOININGDATE?dfr(String(s.JOININGDATE).slice(0,10)):''},
    fin:{t:'Fin',l:'Fin des rapports de travail',cat:'Collaborateur',nw:1,v:s=>{ const f=fin(s); return f&&f.FIN?dfr(f.FIN):''; }},
    fonction:{t:'Fonction',l:'Fonction et catégorie (contrat en vigueur)',cat:'Contrat',f:s=>{ const c=cv(s); return c?nxE(c.FONCTION||'')+'<br><span style="font-size:11.5px;color:var(--s-gris)">'+nxE(cat(c))+'</span>':'—'; },v:s=>{ const c=cv(s); return c?(c.FONCTION||''):''; }},
    categorie:{t:'Catégorie',l:'Catégorie de la grille CCT',cat:'Contrat',v:s=>cat(cv(s))},
    taux:{t:'Taux',l:'Taux d’activité',cat:'Contrat',r:1,nw:1,v:s=>{ const c=cv(s); return c?num(+c.OCC,0)+' %':'—'; }},
    salaire:{t:'Salaire',l:'Salaire mensuel, nombre de salaires et salaire annuel',cat:'Salaire',r:1,f:s=>{ const c=cv(s); if(!c) return '—'; let m=null; try{ m=sgMinimum(c.CATEGORIE,c.NIVEAU); }catch(_){}
        const sous=m&&(+c.SALAIRE*(+c.MOIS||12))<m*12*(+c.OCC||100)/100; return 'CHF '+sgChf(c.SALAIRE)+' × '+(+c.MOIS||12)+'<br><span style="font-size:11.5px;color:var(--s-gris)">'+sgChf(c.SALAIRE*(+c.MOIS||12))+'/an</span>'+(sous?'<br><span class="nx-tag urg">sous le minimum CCT</span>':''); },
      v:s=>{ const c=cv(s); return c?'CHF '+sgChf(c.SALAIRE)+' × '+(+c.MOIS||12):''; }},
    mensuel:{t:'Salaire mensuel',cat:'Salaire',r:1,nw:1,v:s=>{ const c=cv(s); return c?sgChf(c.SALAIRE):''; }},
    mois:{t:'Salaires par an',cat:'Salaire',r:1,nw:1,v:s=>{ const c=cv(s); return c?String(+c.MOIS||12):''; }},
    annuel:{t:'Salaire annuel',cat:'Salaire',r:1,nw:1,v:s=>{ const c=cv(s); return c?sgChf(c.SALAIRE*(+c.MOIS||12)):''; }},
    statut:{t:'Statut',cat:'Contrat',nw:1,f:s=>{ try{ const [st,cl]=sgCtrStatut(s); return '<span class="nx-tag '+cl+'">'+st+'</span>'; }catch(_){ return ''; } },v:s=>{ try{ return sgCtrStatut(s)[0]; }catch(_){ return ''; } }},
    ndoc:{t:'Documents',l:'Nombre de documents (contrat, avenants, fin)',cat:'Contrat',r:1,v:s=>{ try{ return String(sgCtrAll(s.ID).length||''); }catch(_){ return ''; } }}}}); }
/* « comptes » (Réglages ▸ Gestion des utilisateurs) : comptes de l'app (champs d'un utilisateur de l'ancien logiciel, sans le mot de passe) */
{ const st=u=>DS.by('appuser_staff','APPUSER_ID',u.ID).map(l=>DS.get('staff',l.STAFFS_ID)).filter(Boolean).map(staffName).join(', ');
  sgtabDef('comptes',{titre:'Comptes de l’app',std:['nom','userid','coll','profil','etat'],cat:{
    nom:{t:'Nom',cat:'Compte',f:u=>'<b>'+nxE(u.NAME||'')+'</b>',v:u=>u.NAME||''},userid:{t:'Identifiant',cat:'Compte',nw:1,v:u=>u.USERID||''},
    ini:{t:'Initiales',cat:'Compte',nw:1,v:u=>u.INITIALS||''},coll:{t:'Collaborateur',l:'Collaborateurs liés au compte',cat:'Compte',v:st},
    profil:{t:'Profil',l:'Profil SUBGestion (administrateur, chef de projet, collaborateur)',cat:'Compte',nw:1,v:u=>{ try{ return SG_PROFILS[sgProfilDe(u)]||''; }catch(_){ return ''; } }},
    etat:{t:'État',cat:'Compte',nw:1,f:u=>+u.ISENABLED?'Activé':'<span style="color:var(--s-gris)">Désactivé</span>',v:u=>+u.ISENABLED?'Activé':'Désactivé'},
    mail:{t:'Courriel',cat:'Coordonnées',v:u=>u.EMAIL||''},tel:{t:'Téléphone',cat:'Coordonnées',nw:1,v:u=>u.PHONE||''},
    titre:{t:'Titre',l:'Titre (fonction)',cat:'Fonction',v:u=>u.JOBTITLE||''},fonction:{t:'Fonction',cat:'Fonction',v:u=>u.JOBFUNCTION||''},
    langue:{t:'Langue',cat:'Compte',nw:1,v:u=>(typeof LANG_T!=='undefined'&&LANG_T[u.LANGUAGECODE])||''},
    conn:{t:'Dernière connexion',cat:'Connexion',nw:1,v:u=>u.LOGINTIMESTAMP?dfr(String(u.LOGINTIMESTAMP).slice(0,10))+' '+String(u.LOGINTIMESTAMP).slice(11,16):''},
    poste:{t:'Poste',l:'Poste de la dernière connexion',cat:'Connexion',v:u=>u.LOGINLOCALHOST||''}}}); }
/* ── 5. Écrans repris de l'ancien logiciel (grilles du moteur) : menu Présentation automatique (15.11.2026, lot 5) ──
   Toute grille dessinée dans un écran du moteur habillé (SGMV.LISTE : Équipe ▸ Temps de l'équipe, Ressources humaines ▸ Suivi RH, Finances ▸ Controlling,
   Contrats et Facturation des projets, Suivi des factures, Clients, Indicateurs, Types de projets, Bibliothèque ▸ Documents types, Configuration ▸ Administration…),
   dans un domaine de la page du projet (Intervenants, Soumissionnaires, Liste d'adresses : .sgmv-corps) ou dans les listes d'adresses (Listes de diffusion,
   Catégories) reçoit « Présentation ▾ » dans la barre de son panneau. Ses colonnes sont celles que le moteur reproduit de l'ancien logiciel (Standard = toutes, dans
   leur ordre) ; on peut en masquer, changer l'ordre, enregistrer des présentations. Copie et CSV du moteur suivent les colonnes affichées. Clé du tableau : écran +
   empreinte des titres de colonnes. Pas pour : Archives, fenêtres, tableaux de moins de 3 colonnes, tableaux aux cellules colorées une à une (planification). */
const SGTAB_GR={vues:new Set(['adr-groupes','adr-props'])};
const sgtabEmpreinte=t=>{ let x=5381; for(let i=0;i<t.length;i++) x=((x<<5)+x+t.charCodeAt(i))|0; return (x>>>0).toString(36); };
function sgtabGrilleOk(el,o){ try{ if(!el||!o||!Array.isArray(o.cols)||o.noPres||sgtabArchive()) return false; const orig=o.cols._sgtab?(o._sgtab0||o.cols):o.cols; if(orig.length<3) return false;
    if(!el.closest||!el.closest('#main')||el.closest('.ov,.dlg')) return false; const v=typeof VIEW!=='undefined'&&VIEW?VIEW.id:'', L=window.SGMV&&SGMV.LISTE;
    return !!(L&&L.has&&L.has(v))||SGTAB_GR.vues.has(v)||!!el.closest('.sgmv-corps'); }catch(_){ return false; } }
const sgtabTitreEcran=()=>{ try{ const v=VIEW.id, x=typeof NX_VIEW!=='undefined'&&NX_VIEW[v]; return (VIEW.nxTitle||(x&&x.t)||v); }catch(_){ return 'Tableau'; } };
function sgtabBarreDe(el){ for(let p=el,k=0;p&&k<5;p=p.parentElement,k++){ for(let s=p.previousElementSibling;s;s=s.previousElementSibling){ if(s.classList&&s.classList.contains('ph2')) return s; } } return null; }
function sgtabBouton(el,cle){ const ph=sgtabBarreDe(el)||(el.closest('#main')&&document.getElementById('tools')); if(!ph) return;   /* sans barre propre au panneau : barre de l'écran (#tools) */ let b=ph.querySelector(':scope>.sgtab-gb'); if(b){ b.dataset.cle=cle; return; }
  b=document.createElement('button'); b.type='button'; b.className='ib sgtab-gb'; b.dataset.cle=cle; b.title='Colonnes du tableau : Standard, présentations enregistrées, Personnalisé …';
  b.innerHTML=nxSvg('list')+'<span class="lb">Présentation</span><span class="dd"></span>';
  b.onclick=e=>{ e.stopPropagation(); sgtabMenu(b.dataset.cle,b,()=>{ try{ if(typeof VIEW!=='undefined'&&VIEW) go(VIEW.id,VIEW.arg); }catch(_){} }); };
  const sp=[...ph.children].find(x=>x.tagName==='DIV'&&String(x.style.flex||'').startsWith('1')); if(sp) ph.insertBefore(b,sp); else ph.append(b); }
if(typeof grid==='function'){ const g2=grid;
  grid=function(el,o){ try{ if(sgtabGrilleOk(el,o)&&!(o.rows||[]).some(r=>r&&r.bg)){
      const orig=o.cols._sgtab?(o._sgtab0||o.cols):(o._sgtab0=o.cols), ids=orig.map((c,i)=>String(c.k!=null?c.k:'c'+i));
      if(new Set(ids).size===ids.length){ const tit=c=>sgtabBrut(c.t||c.title||''), cle='g:'+VIEW.id+':'+sgtabEmpreinte(orig.map(tit).join('|')), cat={};
        orig.forEach((c,i)=>{ cat[ids[i]]={t:tit(c)||'(sans titre)',l:tit(c)||'Colonne '+(i+1),cat:'Colonnes',r:/(^|\s)r(\s|$)/.test(c.cls||'')?1:0,
          f:r=>c.f?c.f(r):nxE(r[c.k]==null?'':String(r[c.k])),v:r=>c.f?sgtabBrut(c.f(r)):(r[c.k]==null?'':String(r[c.k]))}; });
        sgtabDef(cle,{titre:sgtabTitreEcran(),std:ids.slice(),cat,auto:1});
        const E=sgtabEtat(cle); if(E.std) o.cols=orig; else { const sel=E.ids.map(k=>orig[ids.indexOf(k)]).filter(Boolean); if(sel.length){ sel._sgtab=1; o.cols=sel; } else o.cols=orig; }
        const r=g2.apply(this,arguments); sgtabBouton(el,cle); return r; } } }catch(e){ console.error(e); }
    return g2.apply(this,arguments); }; }
/* ── 6. Listes de Facturation dans leur cadre : contrats d'honoraires et factures (15.11.2026, lot 6) ──
   Sans toucher à Facturation.html (l'app seule reste telle quelle) : après chaque dessin de la liste (enveloppes de renderContratsTable / renderFacturesList du cadre),
   les colonnes sont masquées et réordonnées selon la présentation (colonnes = celles de la liste, Standard = toutes ; la colonne des boutons reste la dernière) ;
   « Présentation ▾ » et « Imprimer » (liste affichée, au graphisme des documents) sont ajoutés à côté de « + Nouveau contrat » / « + Nouvelle facture ». Les mêmes
   listes posées dans la page du projet (offres et contrats de l'affaire) suivent la même présentation. */
const SGTAB_FX={contrats:{tbl:'tbl-contrats',fn:'renderContratsTable',cle:'fx:contrats',titre:'Contrats d’honoraires',btn:'button[onclick="newContratCalc()"]'},
  factures:{tbl:'tbl-factures',fn:'renderFacturesList',cle:'fx:factures',titre:'Liste des factures',btn:'button[onclick*="newFacture()"]'}};
function sgtabFxCadre(){ try{ const f=document.getElementById('fx-frame'); return f&&f.contentWindow&&f.contentDocument?{w:f.contentWindow,d:f.contentDocument,f}:null; }catch(_){ return null; } }
const sgtabFxTitre=th=>((th.firstChild&&th.firstChild.nodeType===3?th.firstChild.nodeValue:th.textContent)||'').replace(/\s+/g,' ').trim();
function sgtabFxAppliquer(k){ const X=sgtabFxCadre(), S=SGTAB_FX[k]; if(!X||!S) return; const t=X.d.getElementById(S.tbl); if(!t||!t.tHead||!t.tHead.rows[0]) return;
  if(X.d.documentElement.hasAttribute('data-sgarch')) return;
  const hr=t.tHead.rows[0]; if(!hr.dataset.sgi){ [...hr.cells].forEach((th,i)=>{ th.dataset.sgi=i; }); hr.dataset.sgi='1'; }
  const H=[...hr.cells].sort((a,b)=>+a.dataset.sgi-+b.dataset.sgi), n=H.length, der=n-1, ids=[], cat={};
  H.slice(0,der).forEach((th,i)=>{ const id='c'+i, tt=sgtabFxTitre(th); ids.push(id); cat[id]={t:tt||'Colonne '+(i+1),l:th.title?tt+' — '+th.title:tt,cat:'Colonnes'}; });
  sgtabDef(S.cle,{titre:S.titre,std:ids.slice(),cat,auto:1});
  /* Standard : la liste telle que Facturation la dessine (ordre d'origine ; colonnes masquées d'office selon la largeur, règles « nth-child » de Facturation) ;
     présentation choisie : elle seule décide des colonnes (classe sgtab-pres : les règles de largeur ne s'appliquent plus, fx_theme.css) */
  const E=sgtabEtat(S.cle);
  if(E.std){ H.forEach(th=>{ hr.appendChild(th); th.style.display=''; }); t.classList.remove('sgtab-pres'); sgtabFxBoutons(k,X); return; }
  const vis=E.ids.map(id=>+id.slice(1)), cach=ids.map((_,i)=>i).filter(i=>!vis.includes(i)), ordre=[...vis,...cach,der], cache=new Set(cach);
  t.classList.add('sgtab-pres');
  ordre.forEach(i=>{ const th=H[i]; hr.appendChild(th); th.style.display=cache.has(i)?'none':''; });
  [...t.tBodies].forEach(tb=>[...tb.rows].forEach(tr=>{ if(tr.cells.length!==n) return; const C=[...tr.cells]; ordre.forEach(i=>{ tr.appendChild(C[i]); C[i].style.display=cache.has(i)?'none':''; }); }));
  sgtabFxBoutons(k,X); }
function sgtabFxBoutons(k,X){ const S=SGTAB_FX[k], ref=X.d.querySelector(S.btn); if(!ref||ref.parentNode.querySelector('.sg-fxpres')) return;
  const mk=(lib,ti,fn)=>{ const b=X.d.createElement('button'); b.type='button'; b.className='btn btn-sm sg-fxpres'; b.textContent=lib; b.title=ti; b.onclick=e=>{ e.preventDefault(); e.stopPropagation(); fn(b); }; return b; };
  const ici=b=>({getBoundingClientRect:()=>{ const r=b.getBoundingClientRect(), f=X.f.getBoundingClientRect(); return {left:f.left+r.left,right:f.left+r.right,top:f.top+r.top,bottom:f.top+r.bottom,width:r.width,height:r.height}; }});
  ref.parentNode.insertBefore(mk('Présentation ▾','Colonnes de la liste : Standard, présentations enregistrées, Personnalisé …',b=>sgtabMenu(S.cle,ici(b),()=>{ try{ X.w[S.fn](); }catch(_){ } })),ref);
  ref.parentNode.insertBefore(mk('Imprimer','Liste affichée (PDF), avec les colonnes de la présentation',()=>sgtabFxImprimer(k)),ref); }
function sgtabFxImprimer(k){ const X=sgtabFxCadre(), S=SGTAB_FX[k]; if(!X||!S) return; const t=X.d.getElementById(S.tbl); if(!t||!t.tHead) return;
  if(!window.SGDH||!SGDH.ouvrir){ toast('Impression indisponible.',true); return; }
  const hr=t.tHead.rows[0], n=hr.cells.length, vis=c=>{ try{ return X.w.getComputedStyle(c).display!=='none'; }catch(_){ return c.style.display!=='none'; } }, cols=[], idx=[];   /* colonnes visibles à l'écran (largeur comprise) */
  [...hr.cells].forEach((th,i)=>{ if(!vis(th)) return; const tt=sgtabFxTitre(th); if(!tt) return; cols.push({t:tt}); idx.push(i); });
  const L=[...(t.tBodies[0]||{rows:[]}).rows].filter(tr=>tr.cells.length===n&&tr.style.display!=='none');
  if(!L.length){ toast('Rien à imprimer.',true); return; }
  idx.forEach((i,j)=>{ try{ const a=X.w.getComputedStyle(L[0].cells[i]).textAlign; if(a==='right'||a==='end') cols[j].r=1; }catch(_){} });
  const rows=L.map(tr=>({c:idx.map(i=>(tr.cells[i].innerText||'').replace(/\s+/g,' ').trim()),g:''}));
  SGDH.ouvrir({cle:'Liste · '+S.titre,titre:S.titre,p:null,lb:'Facturation · Documents',type:'Facturation',sous:'',meta:[['Présentation',sgtabNom(S.cle)],['Lignes',String(rows.length)]],cols,rows}); }
function sgtabFxBrancher(){ const X=sgtabFxCadre(); if(!X||X.w.__sgtabFx) return; const w=X.w; let ok=false;
  Object.entries(SGTAB_FX).forEach(([k,S])=>{ const o=w[S.fn]; if(typeof o!=='function') return; ok=true;
    w[S.fn]=function(){ const r=o.apply(this,arguments); try{ sgtabFxAppliquer(k); }catch(e){ console.error(e); } return r; }; });
  if(ok){ w.__sgtabFx=1; Object.keys(SGTAB_FX).forEach(k=>{ try{ sgtabFxAppliquer(k); }catch(_){ } }); } }
window.SGTAB=Object.assign(SGTAB,{etat:sgtabEtat,cols:sgtabCols,menu:sgtabMenu,imprimer:sgtabImprimer,csv:sgtabCsv,archive:sgtabArchive,ctxProjets:sgtabCtxProjets,moteur:sgtabMoteur});

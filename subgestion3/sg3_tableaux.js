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
  mq(document.documentElement); try{ const f=document.getElementById('fx-frame'), d=f&&f.contentDocument; if(d) mq(d.documentElement); }catch(_){} }
if(typeof go==='function'){ const g0=go; go=function(){ const r=g0.apply(this,arguments); try{ sgtabMarque(); }catch(_){} return r; }; }
if(typeof fxEnsure==='function'){ const f0=fxEnsure; fxEnsure=function(){ const r=f0.apply(this,arguments); Promise.resolve(r).then(()=>{ try{ sgtabMarque(); }catch(_){} },()=>{}); return r; }; }

/* ── 1. Listes du moteur : plus de tri par les titres ; l'ordre par défaut de l'écran (o.sort) est appliqué aux lignes avant le dessin ── */
if(typeof grid==='function'){ const g0=grid;
  grid=function(el,o){ if(o&&Array.isArray(o.cols)){
      if(sgtabArchive()){ if(o._sgtabNS){ o.noSort=false; delete o._sgtabNS; } }
      else { if(!o.noSort){ o.noSort=true; o._sgtabNS=true; }
        if(o._sgtabNS&&o.sort&&Array.isArray(o.rows)){ const [k,dir]=o.sort, c=o.cols.find(x=>x.k===k)||{}, g=c.v||(r=>r[k]);
          o.rows=o.rows.slice().sort((a,b)=>cmp(g(a),g(b))*(dir<0?-1:1)); } } }
    return g0.apply(this,arguments); }; }

/* ── 2. Présentation d'un tableau ── */
function sgtabDef(cle,d){ SGTAB.def[cle]=d; return d; }
const sgtabLS=()=>{ const o=nxLS.get('sg3_tab',{}); return o&&typeof o==='object'?o:{}; };
const sgtabPoste=(cle,v)=>{ const o=sgtabLS(); if(v&&(v.nom||(v.cols&&v.cols.length))) o[cle]=v; else delete o[cle]; nxLS.set('sg3_tab',o); };
const sgtabEnr=cle=>{ try{ const r=DS.get(SGTAB.T,cle); return ((r&&r.PRES)||[]).filter(p=>p&&p.nom&&Array.isArray(p.cols)); }catch(_){ return []; } };
const sgtabMoi=()=>{ try{ return typeof ME==='object'&&ME&&ME.id?String(ME.id):null; }catch(_){ return null; } };
/* état de la présentation : colonnes affichées, présentation enregistrée choisie, colonnes personnalisées non enregistrées, Standard */
function sgtabEtat(cle){ const D=SGTAB.def[cle]; if(!D) return {ids:[],actif:null,perso:false,std:true};
  const ok=k=>!!D.cat[k]&&!D.cat[k].nd, P=sgtabLS()[cle]||{}, L=sgtabEnr(cle), std=D.std.filter(ok), eg=(a,b)=>a.join(',')===b.join(',');
  if(P.nom){ const p=L.find(x=>x.nom===P.nom); if(p){ const ids=p.cols.filter(ok); if(ids.length) return {ids,actif:p,perso:false,std:false}; } }
  if(P.cols&&P.cols.length){ const ids=P.cols.filter(ok); if(ids.length&&!eg(ids,std)){ const p=L.find(x=>eg(x.cols.filter(ok),ids)); return {ids,actif:p||null,perso:!p,std:false}; } }
  return {ids:std,actif:null,perso:false,std:true}; }
const sgtabCols=cle=>{ const D=SGTAB.def[cle]; return D?sgtabEtat(cle).ids.map(k=>Object.assign({k},D.cat[k])):[]; };
const sgtabBrut=h0=>{ if(h0==null) return ''; const d=document.createElement('div'); d.innerHTML=String(h0); return (d.textContent||'').replace(/\s+/g,' ').trim(); };
/* rendu : titres, cellules, texte (impression, CSV) */
const sgtabCl=c=>{ const k=[c.r?'r':c.c?'c':'',c.nw?'nw':''].filter(Boolean).join(' '); return k?' class="'+k+'"':''; };   /* r : à droite, c : centré, nw : sur une ligne */
const sgtabEntete=cols=>'<tr>'+cols.map(c=>'<th'+sgtabCl(c)+(c.w?' style="min-width:'+(+c.w)+'px"':'')+(c.l&&c.l!==c.t?' title="'+nxE(c.l)+'"':'')+'>'+nxE(c.t)+'</th>').join('')+'</tr>';
const sgtabCellules=(cols,r,ctx)=>cols.map(c=>{ let v=''; try{ v=c.f?c.f(r,ctx):nxE(c.v?c.v(r,ctx):''); }catch(_){ v=''; } return '<td'+sgtabCl(c)+'>'+(v==null?'':v)+'</td>'; }).join('');
const sgtabTexte=(cols,r,ctx)=>cols.map(c=>{ try{ const v=c.v?c.v(r,ctx):sgtabBrut(c.f?c.f(r,ctx):''); return v==null?'':String(v); }catch(_){ return ''; } });
/* enregistrement des présentations du tableau (base commune) ; refus (profil, serveur) : message, rien n'est changé à l'écran */
function sgtabEcrire(cle,L){ const D=SGTAB.def[cle]||{}, r0=(()=>{ try{ return DS.get(SGTAB.T,cle); }catch(_){ return null; } })();
  const val=Object.assign(r0?Object.assign({},r0):{ID:cle,CLE:cle},{TITRE:D.titre||cle,PRES:L,MODIFIE:new Date().toISOString(),PAR:sgtabMoi()});
  return Promise.resolve(DS.save(SGTAB.T,val)).then(()=>true,e=>{ toast('Présentation non enregistrée : '+((e&&e.message)||'refus du serveur')+'.',true); return false; }); }
function sgtabChoisir(cle,apres){ const D=SGTAB.def[cle]; if(!D) return; if(typeof ccAffichage!=='function'){ toast('Fenêtre des colonnes indisponible.',true); return; }
  const cat=[]; Object.entries(D.cat).forEach(([k,d])=>{ let g=cat.find(x=>x[0]===d.cat); if(!g){ g=[d.cat,[]]; cat.push(g); } g[1].push([k,d.t,d.l||d.t,{}]); });
  ccAffichage({},{touch:()=>{ if(apres) apres(); },liste:{titre:D.titre,titreDlg:'Présentation personnalisée · '+D.titre,cat,std:D.std.slice(),
    note:'Colonnes du tableau « '+D.titre+' », gardées sur ce poste. « Enregistrer la présentation … » la propose à tout le bureau.',
    def:k=>D.cat[k]?{t:D.cat[k].t,l:D.cat[k].l||D.cat[k].t,cat:D.cat[k].cat,nd:D.cat[k].nd}:null,cols:sgtabEtat(cle).ids.slice(),
    set:ids=>{ const ok=k=>!!D.cat[k]&&!D.cat[k].nd, I=ids.filter(ok), j=I.join(','), p=sgtabEnr(cle).find(x=>x.cols.filter(ok).join(',')===j);
      if(!I.length||j===D.std.filter(ok).join(',')) sgtabPoste(cle,null); else if(p) sgtabPoste(cle,{nom:p.nom}); else sgtabPoste(cle,{cols:I}); }}}); }
function sgtabEnregistrer(cle,apres){ const D=SGTAB.def[cle]; if(!D) return; const L=sgtabEnr(cle).map(p=>Object.assign({},p)), E=sgtabEtat(cle);
  let n=L.length+1; while(L.some(p=>p.nom==='Présentation '+n)) n++;
  const inp=h('input',{class:'inp',value:E.actif?E.actif.nom:'Présentation '+n,style:{width:'100%',boxSizing:'border-box'}}), msg=h('div',{style:{fontSize:'12px',color:'var(--s-gris)',marginTop:'6px',minHeight:'16px'}});
  const maj=()=>{ const v=inp.value.trim(); msg.textContent=!v?'Donnez un nom à la présentation.':v.toLowerCase()==='standard'?'« Standard » est réservé aux colonnes d’origine.':L.some(p=>p.nom===v)?'« '+v+' » existe déjà : elle sera remplacée.':''; };
  inp.oninput=maj; maj();
  const body=h('div',{style:{width:'460px',maxWidth:'80vw'}},h('div',{style:{fontWeight:700,marginBottom:'6px'}},'Nom de la présentation'),inp,msg,
    h('div',{style:{marginTop:'12px',fontSize:'12.5px',color:'var(--s-gris)'}},'Colonnes affichées ('+E.ids.length+') : '+E.ids.map(k=>D.cat[k].t).join(', ')+'. La présentation est proposée à tout le bureau.'));
  dialog({title:'Enregistrer la présentation · '+D.titre,body,buttons:[{t:'Annuler'},{t:'Enregistrer',pri:true,fn:()=>{ const v=inp.value.trim(); if(!v||v.toLowerCase()==='standard'){ maj(); inp.focus(); return false; }
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
    if(noms.some(x=>x.toLowerCase()==='standard')){ toast('« Standard » est réservé aux colonnes d’origine.',true); return false; }
    const P=sgtabLS()[cle]||{}, r=P.nom&&L.find(p=>p._n===P.nom), N=L.map(p=>{ const q=Object.assign({},p,{nom:p.nom.trim()}); delete q._n; return q; });
    sgtabEcrire(cle,N).then(ok=>{ if(!ok) return; if(P.nom) sgtabPoste(cle,r?{nom:r.nom.trim()}:null); if(apres) apres(); }); }}]}); }
/* menu « Présentation ▾ » d'un tableau (sous le bouton de la barre) */
function sgtabMenu(cle,el,apres){ const D=SGTAB.def[cle]; if(!D||!el) return; const E=sgtabEtat(cle), L=sgtabEnr(cle), F=()=>{ if(apres) apres(); };
  return sgMenuSous(el,[{t:'Standard',chk:E.std,fn:()=>{ if(!E.std){ sgtabPoste(cle,null); F(); } }},
    ...L.map(p=>({t:p.nom,chk:!!E.actif&&E.actif.nom===p.nom&&!E.perso,fn:()=>{ sgtabPoste(cle,{nom:p.nom}); F(); }})),
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
    meta:meta.concat([['Présentation',sgtabNom(cle)]]),cols:cols.map(c=>({t:c.t,r:c.r?1:0})),rows:lignes.map(r=>({c:sgtabTexte(cols,r,ctx),g:''}))}); }
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
window.SGTAB=Object.assign(SGTAB,{etat:sgtabEtat,cols:sgtabCols,menu:sgtabMenu,imprimer:sgtabImprimer,csv:sgtabCsv,archive:sgtabArchive});

/* ═══ SOUMISSION : LISTE DU PROJET, FENÊTRE, EXEMPLE (04.11.2026, bloc 36 ; demande de Paulo : « adapte le module soumission au reste de l'app et
   créer une version de soumission comme exemple pour un cfc pour que je puisse comprendre le fonctionnement […] qu'on puisse travailler ensemble
   comment corriger et adapter à nos besoins ») ═══
   Le moteur reste celui de DeltaSub.html (9 étapes, descriptif, comparatif, impressions) ; DeltaSub.html seul garde ses écrans.
   Page du projet ▸ Chantier ▸ Soumission (svDomain remplacé) : bandeau, chiffres, stades, tableau des soumissions de l'affaire ; clic = ouvrir la
   fenêtre, clic droit = éditer, dupliquer, supprimer. Fenêtre (svEditor enveloppé) : bandeau jaune et parcours Appel d'offres → Soumissionnaires →
   Comparatif → Contrat → Métré au-dessus de l'arbre des 9 étapes ; « ‹ Liste » revient à la page du projet.
   Visuel des appels d'offres (04.11.2026, même bloc ; Paulo : « adapte le visuel des appels d'offre pour correspondre au reste de l'app ») : mêmes menus,
   gestes et données. Descriptif de toutes les étapes (svdBuildRows, svdColumns enveloppés) : lignes de quantité simples fondues dans leur article, numéro de
   chapitre dans la colonne Art., colonnes sans donnée masquées (G et P aussi s'ils ne valent que A), montants nuls masqués hors comparatif, titres de colonnes
   en clair, texte à la largeur de la colonne (les retours à 30 signes restent dans « Editer l'article »), niveaux svd-n1 (X00) et svd-n2 (XY0). Barres en texte,
   tableaux à filet noir et totaux dans toutes les étapes (.sgsm-ed, .sgsm-tot) ; arbre en minuscules (SV_TREE). Appels d'offres (VIEWS.soum) : même page que la
   liste du projet, tous les projets (colonne Projet, Toutes · Mes soumissions).
   Exemple (sgSoumExemple) : vrai document du moteur, CFC 271 Plâtrerie, marqué EXEMPLE : descriptif (6 paragraphes, 9 articles de quantité), conditions
   (rabais, escompte, TVA), 3 entreprises fictives (entités masquées de l'annuaire), prix, critères et notes, comparatif créé par le transfert du moteur
   (svcTransferDoc B → C1), entreprise proposée. Rien n'est livré d'office : créé à la demande depuis la liste. Aucun texte d'origine de catalogue.
   Styles <style id="sgsm-css">, classes sgsm-*. Débogage : window.SGSM. */
(function(){
if(typeof svDomain!=='function'||typeof svEditor!=='function'||!window.SGSV||!window.SGSV.outils) return;
const {monter,tete,kpi,btn,lien,menuSous,E,IC,pl,trouve,moT,peut,css}=SGSV.outils;
const CSS=`
.sgsm-tb tr[data-a]{cursor:pointer}
.sgsm-tb tr.supp td{opacity:.5}
.sgsm-note{font-size:12px;color:var(--s-gris);margin-top:10px}
.sgsm-ed{flex:1 1 auto;display:flex;flex-direction:column;min-height:0;height:100%;overflow:hidden}
.sgsm-tete{flex:none;padding:8px 24px 0}
.sgsm-tete .sgfh-tete{margin:0;padding:10px 18px}
.sgsm-tete .sgfh-ini{font-size:28px}.sgsm-tete .sgfh-nm h2{font-size:20px}
@media (max-height:860px){.sgsm-tete .sgfh-meta,.sgsm-e span{display:none}.sgsm-tete .sgfh-tete{padding:6px 14px}.sgsm-tete .sgfh-ini{font-size:22px}.sgsm-tete .sgfh-nm h2{font-size:17px}.sgsm-tete .sgfh-nm .lb{margin:0}.sgsm-par{padding:6px 0 2px!important}.sgsm-par:before{top:13px!important}.sgsm-e i{margin:0 0 4px}}
.sgsm-par{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));position:relative;padding:12px 0 8px}
.sgsm-par:before{content:'';position:absolute;left:6px;right:6px;top:20px;border-top:2px solid #d6d6d6}
.sgsm-e{position:relative;border:0;background:none;padding:0 8px 2px 0;font:inherit;text-align:left;cursor:pointer;min-width:0}
.sgsm-e i{display:block;width:12px;height:12px;box-sizing:border-box;border:2px solid var(--s-gris);background:#fff;position:relative;margin:2px 0 7px}
.sgsm-e.fait i{background:var(--s-nuit);border-color:var(--s-nuit)}
.sgsm-e.cour i{background:var(--s-jaune);border-color:var(--s-noir)}
.sgsm-e b{display:block;font-size:12px;font-weight:700;color:var(--s-noir)}
.sgsm-e span{display:block;font-size:11px;color:var(--s-gris);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgsm-e:hover b{color:var(--s-nuit);text-decoration:underline}
.sgsm-ed>.ph2{flex:none;margin:0 24px;padding:6px 0;border-top:2px solid var(--s-noir);border-bottom:1px solid var(--s-filet);background:#fff;height:auto;min-height:38px}
.sgsm-ed>.ph2 .ib{border:0!important;background:transparent!important;box-shadow:none!important;font-size:12.5px;font-weight:700;color:var(--s-noir);height:30px}
.sgsm-ed>.ph2 .ib:hover{background:var(--s-jaune3)!important}
.sgsm-ed>.ph2>b{display:none}
.sgsm-ed>.cols{flex:1 1 auto;min-height:0;padding:0 24px 12px;gap:16px}
.sgsm-ed>.cols>.col:first-child{flex:0 0 220px!important;background:#fff!important;border:0!important;border-right:1px solid var(--s-filet)!important;padding:8px 0!important;box-shadow:none!important}
.sgsm-ed>.cols>.col:first-child>div{color:var(--s-noir)}
.sgsm-ed>.cols>.col:first-child>div:not(.item){font-size:11px!important;font-weight:700!important;letter-spacing:0!important;color:var(--s-gris)!important;padding:8px 10px 4px 2px!important;margin-top:2px!important}
.sgsm-ed>.cols>.col:first-child .item{font-size:12.5px!important;padding:6px 10px 6px 14px!important;border:0}
.sgsm-ed>.cols>.col:first-child .item:hover{background:var(--s-jaune3)}
.sgsm-ed>.cols>.col:first-child .item.on{background:var(--s-jaune2)!important;color:var(--s-noir)!important;font-weight:700;box-shadow:inset 3px 0 0 var(--s-nuit)}
.sgsm-ed .col.fill{border:0!important;background:#fff!important;box-shadow:none!important;min-width:0}
.sgsm-ed .pane{border:0!important;background:#fff!important;box-shadow:none!important}
.sgsm-ed .col.fill .ph2,.sgsm-ful .ph2{flex-wrap:wrap;height:auto!important;min-height:40px;row-gap:2px;column-gap:2px;padding:0 0 6px;border:0!important;background:transparent!important}
.sgsm-ed .col.fill .ph2 .ib,.sgsm-ful .ph2 .ib{border:0!important;background:transparent!important;box-shadow:none!important;border-radius:0!important;height:34px;padding:0 9px;font-size:12.5px;font-weight:700;color:var(--s-noir)}
.sgsm-ed .col.fill .ph2 .ib:first-child{padding-left:0}
.sgsm-ed .col.fill .ph2 .ib:hover,.sgsm-ful .ph2 .ib:hover{background:var(--s-jaune3)!important}
.sgsm-ed .col.fill .ph2 .ib:disabled{color:#b9b9b6}
.sgsm-ed .col.fill .ph2 .cnt{font-size:12px;color:var(--s-gris)}
.sgsm-ed table.g thead th{background:#fff!important;border:0!important;border-bottom:2px solid var(--s-noir)!important;font-size:11px;font-weight:700;color:var(--s-gris)!important;padding:8px!important;height:auto!important}
.sgsm-ed table.g tbody td{border:0!important;border-bottom:1px solid var(--s-filet)!important;height:34px;padding:0 8px!important;font-size:12.5px}
.sgsm-ed table.g tbody tr:hover td{background:var(--s-jaune3)!important}
.sgsm-ed table.g tbody tr.on td{background:var(--s-jaune2)!important;color:var(--s-noir)!important}
.sgsm-ed .empty{color:var(--s-gris);text-align:left;padding:18px 0;font-size:12.5px}
.sgsm-tot{background:#fff!important;border:0!important;border-top:2px solid var(--s-noir)!important;padding:10px 0 2px!important;font-size:12.5px;gap:6px 22px!important}
.sgsm-tot b{font-size:15px;font-weight:700;margin-left:2px}
.sgsm-tot .ib{border:0!important;background:transparent!important;box-shadow:none!important;font-weight:700;font-size:12.5px;color:var(--s-nuit);height:28px}
html .svd-tb{width:100%;border-collapse:collapse;font-size:12.5px}
html .svd-tb th{background:#fff;font-size:11px;font-weight:700;color:var(--s-gris);padding:8px;border-bottom:2px solid var(--s-noir);z-index:2}
html .svd-tb td{padding:6px 8px;border-bottom:1px solid var(--s-filet);line-height:1.35}
html .svd-tb tr:nth-child(even) td,html .svd-tb tr:nth-child(odd) td{background:#fff}
html .svd-tb tbody tr:hover td{background:var(--s-jaune3)}
html .svd-tx{white-space:normal;font-family:inherit;font-size:12.5px;line-height:1.4}
html .svd-tb tr.svd-ch td{background:var(--s-nuit3)!important;border-top:0;font-weight:700;font-size:13px}
html .svd-tb tr.svd-g td{background:var(--s-nuit3)!important}
html .svd-tb tr.svd-n1 td{padding-top:12px}
html .svd-tb tr.svd-n1 .svd-tx{font-weight:700;font-size:13px}
html .svd-tb tr.svd-n1 td:first-child{font-weight:700}
html .svd-tb tr.svd-n2 .svd-tx{font-weight:700}
html .svd-tb tr.svd-q td,html .svd-tb tr.svd-sub td{color:var(--s-noir)}
html .svd-tb tr.svd-q td .svd-q{background:none;padding:0}
html .svd-tb .svd-q.svd-qm{background:var(--s-nuit3);padding:0 3px}
html .svd-tb tr.svd-t td{background:#fff!important;color:var(--s-noir);font-weight:700;border-top:2px solid var(--s-noir);border-bottom:0}
html .svd-tb tr.svc-e td{font-size:12px;padding-top:3px;padding-bottom:3px;color:var(--s-gris)}
html .svd-tb tr.on td{background:var(--s-jaune2)!important;color:var(--s-noir)!important}
html .svd-tb tr.on td:first-child{box-shadow:inset 3px 0 0 var(--s-nuit)}
html .svd-tb tr.on td span{color:inherit!important}
.sgsm-ed table.g tbody tr.on td span{color:inherit!important;background:transparent!important}
html .svc-prop{color:#4f7d10!important}
`;
const cssM=()=>{ css(); if(!document.getElementById('sgsm-css')){ const s=document.createElement('style'); s.id='sgsm-css'; s.textContent=CSS; document.head.appendChild(s); } };
const num2=n=>{ try{ return num(n); }catch(_){ return String(n); } };
const contenu=d=>{ const S=DS.get('soumission',d.ID); try{ return S?svNorm(JSON.parse(JSON.stringify(S))):null; }catch(_){ return null; } };
/* fiche d'une soumission pour la liste : entreprises, proposée, offre nette */
function resume(d){ const S=DS.get('soumission',d.ID), L=((S&&S.entreprises)||[]).filter(e=>+e.contactId>0), pr=L.find(e=>e.proposee)||null, net=pr&&pr.detail&&pr.detail.offre?+pr.detail.offre.net||0:0;
  let nomP=''; if(pr){ const c=DS.get('contact',pr.contactId); nomP=pr.abreviation||(c&&c.NAME1)||''; } return {n:L.length,nomP,net,et:(S&&S.etape)||'B'}; }
const SOUM={
  rendre(I){ const p=I.p, u=I.u, G=!!p.GLOBAL, pr=d=>DS.get('project',d.PROJECT_ID)||{}, tous=(G?DS.all('devisdocument'):DS.by('devisdocument','PROJECT_ID',p.ID)).filter(d=>!G||!u.mine||svIsMine(d)), vivant=tous.filter(d=>!+d.ISMARKEDASDELETED), base=u.supp?tous:vivant, st=u.stade??null;
    const R=base.filter(d=>(st==null||+d.DOCUMENTSTATECODE===st)&&trouve(u.q,d.BKP,d.AWARDINGTEXT,d.VERSION,d.NOTE,d.USERID,G?pr(d).NUMBER:'',G?pr(d).TITLE:'')).sort((a,b)=>G?cmp(pr(b).NUMBER,pr(a).NUMBER)||cmp(a.BKP,b.BKP):cmp(a.BKP,b.BKP)||cmp(b.CHANGEDDATE,a.CHANGEDDATE));
    const Rs=new Map(base.map(d=>[d.ID,resume(d)])), stades=SV_STADE.filter(([c])=>base.some(d=>+d.DOCUMENTSTATECODE===c)), adj=[2,3,4,5,6], nAdj=vivant.filter(d=>adj.includes(+d.DOCUMENTSTATECODE)).length, ent=vivant.reduce((n,d)=>n+Rs.get(d.ID).n,0), tot=vivant.reduce((n,d)=>n+Rs.get(d.ID).net,0), mo=moT(p);
    const acts=btn('new','Nouvelle soumission','plus',1)+'<button class="nx-btn" data-a="menu" title="Autres actions" aria-label="Autres actions">⋯</button>';
    const teteP=G?tete('AO','Soumissions','Appels d’offres',pl(vivant.length,'lot')+' · tous les projets',acts):tete(p.NUMBER||'','Soumissions',p.TITLE||'',[mo?'Maître de l’ouvrage : '+mo:'',pl(vivant.length,'lot')].filter(Boolean).join(' · '),acts);
    if(!vivant.length&&!u.supp) return '<div class="sgsv">'+teteP+'<div class="sgsv-vide"><b>Aucune soumission pour ce projet.</b><br>Une soumission suit un lot (CFC) de l’appel d’offres jusqu’au contrat : descriptif, entreprises, offres, comparatif, adjudication.<div class="acts">'+btn('new','Nouvelle soumission','plus',1)+(G?'':btn('ex','Créer un exemple (CFC 271 Plâtrerie)'))+'</div></div></div>';
    return '<div class="sgsv">'+teteP
      +'<div class="nx-kpis sgsv-kp">'+kpi('Soumissions',String(vivant.length),'lots du projet')+kpi('En appel d’offres',String(vivant.filter(d=>[0,11].includes(+d.DOCUMENTSTATECODE)).length),'')+kpi('Proposés ou adjugés',String(nAdj),'')+kpi('Entreprises',String(ent),'consultées')+kpi('Offres proposées',num2(tot)+'<small>CHF</small>','net, entreprises proposées')+'</div>'
      +'<div class="sgsv-fil">'+(G?[['0','Toutes'],['1','Mes soumissions']].map(([v,t])=>'<button data-a="mine" data-v="'+v+'" class="'+((+v===1)===!!u.mine?'on':'')+'">'+t+'</button>').join('')+'<span style="width:10px"></span>':'')+(stades.length>1?[['','Tous'],...stades].map(([c,t])=>{ const v=c===''?null:c; return '<button data-a="stade" data-c="'+c+'" class="'+(v===st?'on':'')+'" aria-pressed="'+(v===st)+'">'+E(t)+'</button>'; }).join(''):'')
      +'<span class="dr"><input class="inp" data-q type="search" style="width:240px" placeholder="Rechercher une soumission" aria-label="Rechercher une soumission" value="'+E(u.q||'')+'"></span></div>'
      +(R.length?'<table class="nx-tbl sgsv-tb sgsm-tb"><thead><tr>'+(G?'<th>Projet</th>':'')+'<th>CFC</th><th>Lot</th><th>Version</th><th>Stade</th><th>Statut</th><th class="r">Entreprises</th><th>Proposée</th><th class="r">Offre nette CHF</th><th>Modifié</th><th>Par</th></tr></thead><tbody>'
        +R.map(d=>{ const r=Rs.get(d.ID); return '<tr data-a="open" data-d="'+d.ID+'"'+(+d.ISMARKEDASDELETED?' class="supp"':'')+'>'+(G?'<td class="nw" title="'+E(pr(d).TITLE||'')+'">'+E(pr(d).NUMBER||'')+'</td>':'')+'<td class="nw"><b>'+E(d.BKP||'—')+'</b></td><td>'+E(d.AWARDINGTEXT||'(sans titre)')+(d.LOCKUSERID?' <span title="'+E('Ouvert par '+d.LOCKUSERID)+'">'+IC('lock')+'</span>':'')+'</td><td class="nw">'+E(d.VERSION||'')+'</td><td class="nw">'+E(SV_STADE_L[d.DOCUMENTSTATECODE]??'')+'</td><td class="nw">'+E(SV_STATE[d.STATECODE]??'')+'</td><td class="r">'+(r.n||'—')+'</td><td class="nw">'+E(r.nomP||'—')+'</td><td class="r nw">'+(r.net?E(num2(r.net)):'—')+'</td><td class="nw">'+E(dfr(d.CHANGEDDATE))+'</td><td class="nw">'+E(d.USERID||'')+'</td></tr>'; }).join('')+'</tbody></table>'
        :'<p class="sgsv-rien">Aucune soumission trouvée.</p>')+'</div>'; },
  action(I,a,t){ const p=I.p, u=I.u, d=t.dataset.d?DS.get('devisdocument',t.dataset.d):null;
    if(a==='new'){ if(p.GLOBAL) pickProject('Choix de l’affaire',q=>svNew(q)); else svNew(p); } else if(a==='ex') sgSoumExemple(p);
    else if(a==='mine'){ u.mine=t.dataset.v==='1'; u.stade=null; I.dessiner(); }
    else if(a==='open'){ if(d) ouvrirDoc(d,p); }
    else if(a==='stade'){ u.stade=t.dataset.c===''?null:+t.dataset.c; I.dessiner(); }
    else if(a==='menu') menuSous(t,[{t:'Afficher les documents supprimés',chk:!!u.supp,fn:()=>{ u.supp=!u.supp; I.dessiner(); }},...(p.GLOBAL?[]:['-',{t:'Créer un exemple (CFC 271 Plâtrerie)',fn:()=>sgSoumExemple(p)}])]); },
  ctx(I,t,e){ if(t.dataset.a!=='open') return false; const d=DS.get('devisdocument',t.dataset.d), p=I.p; if(!d) return false;
    sgMenuAt(e.clientX,e.clientY,[{t:'Ouvrir la soumission',fn:()=>ouvrirDoc(d,p)},{t:'Modifier l’en-tête…',fn:()=>svEditDoc(null,d)},{t:'Dupliquer',fn:()=>svDuplicate(d)},'-',{t:'Supprimer…',danger:true,fn:()=>svDelete(d)}]); return true; } };
/* ouvrir depuis la page du projet : « ‹ Liste » y revient */
const ouvrirDoc=d=>svOpenDoc(d.ID);
const od0=svOpenDoc; svOpenDoc=async function(id){ const v=VIEW&&VIEW.id, a=VIEW&&VIEW.arg; await od0(id); if(v==='nx-pdom'&&SV_UI.open===+id) SV_UI.back={view:v,arg:a}; };
svDomain=function(C,top,pane,p){ monter(C,p,'soumission',[...SV_NEED,'project'],SOUM); };
/* Appels d'offres (vue soum, sans document ouvert) : même page, tous les projets */
if(VIEWS.soum){ const r0=VIEWS.soum.render; VIEWS.soum.render=function(m,arg){ if(SV_NEED.some(t=>!DS.loaded.has(t))||(SV_UI.open!=null&&DS.get('devisdocument',SV_UI.open))) return r0.call(this,m,arg);
  SV_UI.open=null; this.L=null; monter(m,{ID:'tous',GLOBAL:1,NUMBER:'',TITLE:''},'soumg',[...SV_NEED,'project'],SOUM); }; }

/* ── fenêtre : bandeau et parcours au-dessus de l'arbre des étapes ── */
const uni=(S,k)=>(S.unites&&S.unites[k]&&S.unites[k].chapitres)||[];
function parcours(X){ const S=X.S, nE=(S.entreprises||[]).filter(e=>+e.contactId>0).length, nA=uni(S,'B').reduce((n,c)=>n+c.articles.filter(a=>(a.quantites||[]).length).length,0), pr=(S.entreprises||[]).find(e=>e.proposee&&+e.contactId>0), c1=uni(S,'C1').length, ct=uni(S,'D').length, me=uni(S,'I').length;
  const L=[['tenderEdit',"Appel d’offres",nA?pl(nA,'article'):'descriptif à écrire',nA>0],['tenderingEdit','Soumissionnaires',nE?pl(nE,'entreprise'):'entreprises à choisir',nE>0],['priceComparisonEdit','Comparatif',c1?(pr?'proposée : '+(pr.abreviation||''):'offres à saisir'):'à créer depuis l’appel d’offres',c1>0],['contractEdit','Contrat',ct?'créé':'après l’adjudication',ct>0],['measureEdit','Métré',me?'créé':'pendant les travaux',me>0]];
  const cour=SV_UI.node?((svStepOf(SV_UI.node)||{}).k):''; const k2={tender:0,tendering:1,offerOverview:2,priceComparison:2,offer:2,contract:3,measure:4}[cour];
  return L.map(([k,t,s,f],i)=>'<button class="sgsm-e'+(i===k2?' cour':f?' fait':'')+'" data-n="'+k+'"><i></i><b>'+E(t)+'</b><span title="'+E(s)+'">'+E(s)+'</span></button>').join(''); }
function habiller(m,id){ const X=SV_UI.ed&&SV_UI.ed.X, d=DS.get('devisdocument',id); if(!X||!d) return; cssM(); const p=DS.get('project',d.PROJECT_ID)||{}, bar=m.querySelector(':scope>.ph2'); if(!bar) return;
  /* enveloppe : #main sert à tous les écrans, il ne porte jamais la classe ; m.innerHTML='' de go() retire tout */
  const box=document.createElement('div'); box.className='sgsm-ed'; box.append(...m.childNodes); m.append(box);
  const hd=document.createElement('div'); hd.className='sgsm-tete'; box.prepend(hd); hd.onclick=e=>{ const b=e.target.closest('[data-n]'); if(b&&SV_UI.ed) SV_UI.ed.X.go(b.dataset.n); };
  const maj=()=>{ const x=DS.get('devisdocument',id)||d; hd.innerHTML=tete(x.BKP||'—','Soumission · '+(SV_STADE_L[x.DOCUMENTSTATECODE]??'')+' · '+(SV_STATE[x.STATECODE]??''),x.AWARDINGTEXT||'(sans titre)',[[p.NUMBER,p.TITLE].filter(Boolean).join(' · '),x.VERSION?'version '+x.VERSION:'',X.S.appelOffres&&X.S.appelOffres.dateDepot?'dépôt des offres le '+dfr(X.S.appelOffres.dateDepot):''].filter(Boolean).join(' · '),X.ro?'<span class="sgsm-note" style="margin:0">Lecture seule</span>':'')+'<div class="sgsm-par">'+parcours(X)+'</div>'; };
  maj(); SV_UI.ed.majTete=maj; if(typeof VIEW==='object'&&VIEW) VIEW.nxTitle='Soumission · '+[d.BKP,d.AWARDINGTEXT].filter(Boolean).join(' '); }
const ed0=svEditor; svEditor=function(m,id){ ed0(m,id); habiller(m,id); };
const n0=svNodeFn; svNodeFn=function(k){ const f=n0(k); if(typeof f!=='function') return f; return function(X){ const r=f.apply(this,arguments); setTimeout(()=>{ if(SV_UI.ed&&SV_UI.ed.majTete) SV_UI.ed.majTete(); },0);
  if(X&&X.el) X.el.querySelectorAll('div[style*="background"]').forEach(d=>{ if(/245, 245, 245|f5f5f5/.test(d.getAttribute('style')||'')) d.classList.add('sgsm-tot'); }); return r; }; };   /* parcours tenu à jour à chaque étape */

/* ── descriptif : même données, présentation de l'app ── */
const TITRES_COL={p:'Art.',u:'Sous-art.',v:'Var.',s:'R',t:'Description',d:'Pièces',un:'Unité',gq:'Genre Q.',me:'Métré',qt:'Quantité',nc:'N° courant',gp:'Genre P.',pr:'Prix unitaire',mt:'Montant',tva:'TVA',rpa:'RPA',cal:'Cal'};
const LARG_COL={p:62,u:62,un:56,qt:86,pr:96,mt:108,gq:60,gp:60,nc:80,me:52,d:48,tva:48,en:210};
const SANS_ZERO=x=>String(x==null?'':x).replace(/<[^>]*>/g,'').trim().replace(/[()]/g,'')==='0.00';
const br0=svdBuildRows; svdBuildRows=function(ctx){ const R0=br0(ctx), C1=ctx.et==='C1', R=[];
  R0.forEach((r,i)=>{ const c=r.cells||{};
    if(/svd-ch/.test(r.cls||'')&&c.c!=null){ c.p=c.c; delete c.c; }
    if(/svd-a/.test(r.cls||'')){ const m=String(c.p||''), u=String(c.u||''); if(!u&&/^\d00$/.test(m)&&m!=='000') r.cls+=' svd-n1'; else if(!u&&/^\d\d0$/.test(m)&&m!=='000') r.cls+=' svd-n2';
      /* une seule ligne de quantité sans subdivision : sur la ligne de l'article */
      const q=R0[i+1], q2=R0[i+2], seul=q&&/(^| )svd-q( |$)/.test(q.cls||'')&&!/svd-sub/.test(q.cls||'')&&!(q2&&/(^| )svd-q( |$)/.test(q2.cls||'')&&String(q2.k).split('|').slice(0,4).join('|')===String(q.k).split('|').slice(0,4).join('|'));
      if(seul){ const {un,...qc}=q.cells; Object.assign(c,qc,{un:un||c.un}); q._fondue=true; if(SVD_UI.sel[ctx.et]===q.k) SVD_UI.sel[ctx.et]=r.k; } }
    if(!C1||/svd-a/.test(r.cls||'')){ if(SANS_ZERO(c.pr)) c.pr=''; if(SANS_ZERO(c.mt)) c.mt=''; }
    if(!r._fondue&&!(/svd-t/.test(r.cls||'')&&!C1&&!c.mt)) R.push(r); });
  return R; };
const co0=svdColumns; svdColumns=function(ctx){ const L=co0(ctx), R=svdBuildRows(ctx), plein=k=>R.some(r=>{ const v=(r.cells||{})[k]; return v!=null&&String(v)!==''; }), garde=new Set(['p','t']), seulA=k=>!R.some(r=>{ const v=(r.cells||{})[k]; return v&&v!=='A'; });
  return L.filter(c=>c.custom||garde.has(c.k)||(plein(c.k)&&!((c.k==='gq'||c.k==='gp')&&seulA(c.k)))).map(c=>c.k==='t'?{...c,t:TITRES_COL.t,w:''}:{...c,t:TITRES_COL[c.k]||c.t,w:LARG_COL[c.k]||c.w}); };
const SV_LIB={tender:'Appel d’offres',tendering:'Soumissionnaires',offerOverview:'Comparatif bref',priceComparison:'Comparatif',offer:'Offre',contract:'Contrat',measure:'Métré',masterTender:'Descriptif type',costEstimating:'Estimatif'};
SV_TREE.forEach(s=>{ s.t=SV_LIB[s.k]||s.t; s.subs.forEach(x=>{ if(x[1]==='Editer') x[1]='Éditer'; }); });

/* ── exemple complet : CFC 271 Plâtrerie ── */
const EX_ENT=[['Exemple Plâtrerie A SA','Pl. Ex. A','Chemin des Artisans 4','1096','Cully'],['Exemple Plâtrerie B Sàrl','Pl. Ex. B','Route du Lac 18','1095','Lutry'],['Exemple Plâtrerie C SA','Pl. Ex. C','Avenue de la Gare 7','1800','Vevey']];
const EX_ART=[  /* [m, unité, mot-clé, texte, quantité, prix de A, B, C] ; X00 = paragraphe, XY0 = sous-paragraphe */
  ['100','','Installations','Installations de chantier.'],['110','','Protections','Protections et moyens d’accès.'],
  ['111','m2','Protection des sols','Protection des sols finis par panneaux, y compris enlèvement en fin de travaux.',420,6.5,7.2,5.9],
  ['112','gl','Échafaudage roulant','Mise à disposition d’un échafaudage roulant pour toute la durée des travaux.',1,2400,1950,2800],
  ['200','','Cloisons','Cloisons en plaques de plâtre.'],['210','','Cloisons sur ossature','Cloisons sur ossature métallique, plaques de plâtre vissées, joints lissés.'],
  ['211','m2','Cloison simple 100 mm','Cloison simple, ép. 100 mm, une plaque par face, laine minérale 60 mm.',185,78,84,72],
  ['212','m2','Cloison acoustique 150 mm','Cloison double, ép. 150 mm, deux plaques par face, laine minérale 100 mm.',64,118,126,112],
  ['213','m2','Doublage de mur','Doublage de mur sur ossature, plaque hydrofuge dans les locaux humides.',96,62,59,68],
  ['300','','Plafonds','Plafonds.'],['310','','Faux-plafonds','Faux-plafonds suspendus en plaques de plâtre.'],
  ['311','m2','Faux-plafond','Faux-plafond suspendu, hauteur 200 mm, joints lissés.',240,86,92,81],
  ['312','pce','Trappe de visite','Trappe de visite 600 × 600 mm, cadre invisible.',8,185,170,210],
  ['400','','Enduits','Enduits intérieurs.'],['410','','Enduits et lissages','Enduits de fond et lissages, qualité Q3.'],
  ['411','m2','Enduit des murs','Enduit de fond et lissage des murs, y compris préparation du support.',520,34,31,37],
  ['412','m2','Lissage des plafonds','Lissage des plafonds béton, y compris pont d’adhérence.',310,28,30,26]];
const EX_CRIT=[['Prix de l\'offre',60,[5.5,4.5,5.4]],['Expérience',20,[5,4,4.5]],['Calendrier',10,[4.5,4.5,5]],['Qualité de l\'offre',10,[5,4.5,4]]];
async function sgSoumExemple(p){ const dj=DS.by('devisdocument','PROJECT_ID',p.ID).find(d=>!+d.ISMARKEDASDELETED&&/EXEMPLE/i.test(d.VERSION||''));
  if(dj){ toast('L’exemple existe déjà dans ce projet : ouvrez-le dans la liste.',true); return; }
  await DS.need(SV_NEED);
  /* entreprises fictives : entités masquées de l'annuaire (jamais de faux prix sur de vraies entreprises) */
  const ops=[], oids=DS.newIds('contactowner',3), cids=DS.newIds('contact',3), now=today();
  EX_ENT.forEach(([n,ab,rue,npa,loc],i)=>{ ops.push({t:'contactowner',id:oids[i],val:{ID:oids[i],TYPECODE:0,FORMOFADDRESS:'Société',NAME1:n,NAME2:null,ISHIDDEN:1,REMARK:'Entreprise fictive de l’exemple de soumission',CREATED:now,UPDATED:now}});
    ops.push({t:'contact',id:cids[i],val:{ID:cids[i],CONTACTOWNER_ID:oids[i],NAME1:n,SHORTLABEL:ab,STREET:rue,ZIP:npa,LOCATION:loc,LANGUAGECODE:2,CREATED:now,UPDATED:now}}); });
  const did=DS.newIds('devisdocument')[0], doc={...svNewHeader(p),ID:did,BKP:'271',AWARDINGTEXT:'Plâtrerie',VERSION:'EXEMPLE',STATECODE:1,DOCUMENTSTATECODE:2,NOTE:'Exemple créé par SUBGestion pour comprendre le module : prix et entreprises fictifs. Peut être supprimé.'};
  const S=svNewSoum(did,p.ID); Object.assign(S.appelOffres,{procedure:2,dateDepot:'2026-11-27',heureDepot:'12:00',dateOuverture:'2026-11-30',debutPreparation:'01.02.2027',debutTravaux:'15.02.2027',finTravaux:'30.04.2027',montantDG:'60000'});
  const U=S.unites.B, ch=svdNewChapter('271','Plâtrerie','', '2026'); U.date=now; const zero=ch.articles[0]; zero.motCle='Remarques préliminaires'; zero.texte=svdWrap('Les travaux comprennent la fourniture et la pose. Les prix s’entendent hors TVA. Échantillons à remettre avant exécution.');
  EX_ART.forEach(([m,un,mc,tx,qt])=>{ const a=svdNewArticle(m,'',un); a.motCle=mc; a.texte=svdWrap(tx); if(qt!=null){ const q=svdNewQP(); q.quantite=qt; a.quantites.push(q); } ch.articles.push(a); });
  svdSortChapter(ch); U.chapitres.push(ch);
  const cond=(niv,ref,genre,texte,valeur)=>Object.assign(svdCond0(niv),{ref,genre,texte,valeur}); U.conditions=[cond(1,0,1,'Rabais',-2),cond(2,1,3,'Escompte (%)',-2),cond(3,2,2,'TVA',svdVatDefault())];
  svdRecalc(S,'B');
  cids.forEach((c,i)=>{ const e=svNewEnt(c,null,EX_ENT[i][1]); e.situationOffre='Offre reçue'; e.indications.dateOffre='2026-11-26'; e.indications.numeroOffre='OF-'+(101+i); S.entreprises.push(e); });
  S.entreprises[0].proposee=true; S.entreprises.forEach((e,i)=>{ e.rang=i; });
  S.criteres=EX_CRIT.map(([nom,coefficient,N])=>({nom,coefficient,notes:N.map((note,i)=>({contactId:cids[i],note,remarque:''})),sousCriteres:[]}));
  const tr=svcTransferDoc(S,'B','C1'); if(tr.err){ toast(tr.err,true); return; }
  const C=S.unites.C1, pa=new Map(EX_ART.filter(x=>x[4]!=null).map(x=>[x[0],x.slice(5)]));
  C.chapitres.forEach(c=>c.articles.forEach(a=>{ const P=pa.get(a.m); if(!P) return; a.quantites.forEach(q=>(q.prixEntreprises||[]).forEach(x=>{ const i=cids.indexOf(x.contactId); if(i>=0){ x.prix=P[i]; x.gp='A'; } })); }));
  const eA=S.entreprises[0].detail.offre.conditions; if(eA[0]) eA[0].valeur=-3;
  svcRecalcAll(S); S.etape='C1'; S.dernierNoeud='C1';
  ops.push({t:'devisdocument',id:did,val:doc},{t:'soumission',id:did,val:S});
  await DS.commit(ops); toast('Exemple créé : CFC 271 Plâtrerie.'); ouvrirDoc(doc,p); }
window.sgSoumExemple=sgSoumExemple;
window.SGSM={resume,habiller,parcours};
})();

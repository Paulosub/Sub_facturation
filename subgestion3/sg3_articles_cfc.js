/* ═══ SOUMISSION : TABLEAU DES ARTICLES DU CFC À GAUCHE (07.11.2026, bloc 43 ; Paulo : « dans soumission (anciennement éditer) ajoute un tableau à gauche avec les articles qui
   concernent le CFC, pour les sélectionner comme pour devis ; ce tableau à gauche on le remplira un peu plus tard, je te donnerai les articles plus tard », « la numérotation des articles sera
   basée sur le principe de numérotation des articles ») ═══
   Appel d'offres ▸ Soumission (étape B, mode articles) : la place du catalogue « Perso » du moteur (svdPersoPanel, rendu dans body.cols avant le tableau). Source : la bibliothèque d'articles
   du bureau (collection svbiblio : {ID = chapitre, numero, texte1, texte2, version, articles [{m, u, unite, motCle, texte, variables}]}), donc même numérotation que le descriptif : chapitre,
   article, sous-article (svdNum, niveaux svdLevel). Un chapitre concerne le CFC du document si son champ CFC (facultatif : code ou liste, pour l'import à venir) le désigne, sinon par son
   numéro (271 pour le CFC 271 ou 271.1). Vide tant que Paulo n'a pas donné les articles. Gestes du plan CFC des devis : recherche, clic = choisir, double-clic ou Entrée = ajouter (titre ou
   chapitre : avec ses articles), ✓ sur ce qui est déjà dans la soumission, × ferme, bouton « Articles du CFC » rouvre (sg3_soum_art). Insertion : svbInsert du moteur. Importer ▸ Catalogue
   « Perso » garde le catalogue d'origine. Après une insertion depuis la bibliothèque (ce tableau ou Importer ▸ Bibliothèque d'articles), juste avant l'enregistrement (svdTouch) :
   l'article 000 et les titres créés sans mot-clé en reçoivent un (sinon Documents et transferts restent bloqués, svdControls), et un article principal devenu titre reporte ses
   quantités sur son premier nouveau sous-article (comme « Nouvel article »). Le tableau se redessine quand la bibliothèque change (DS.on) ; recherche par document, focus gardé.
   Styles #sgar-css, débogage window.SGAR. */
(function(){
const CLE='sg3_soum_art', E=s=>esc(String(s==null?'':s)), P={ouvert:true,q:{},sel:null,perso:false,haut:{},foc:null,pos:0}; try{ if(localStorage.getItem(CLE)==='0') P.ouvert=false; }catch(_){ }
const estD=S=>!!(S&&S.mode==='descriptif'), cfcDe=X=>String((X.doc||{}).BKP||'').trim();
const concerne=(c,cfc)=>{ if(!cfc) return false; const r=svbChapter(c.numero)||{}, L=[].concat(r.CFC||[]).map(String), b=cfc.split('.')[0], a=String(c.numero); return L.length?L.some(x=>x===cfc||x===b||cfc.startsWith(x)):(a===b||a.startsWith(b)||b.startsWith(a)); };
const niveau=a=>({par:'n1',spar:'n2',main:'n3',grp:'n4',sgrp:'n4',art:'n5'})[svdLevel(a)]||'n5';
const present=(U,c,a)=>{ const x=(U.chapitres||[]).find(y=>y.numero===c.numero); return !!(x&&x.articles.some(b=>b.m===a.m&&(b.u||'')===(a.u||''))); };
function panneau(ctx){ css(); const X=ctx.X, cfc=cfcDe(X), d=X.doc||{}, col=h('div',{class:'col sgar'}), pane=h('div',{class:'sgar-l',tabindex:'0'}); let ok=DS.loaded.has(SVB_T); const pied=h('div',{class:'sgar-p'}); if(!ok) DS.need([SVB_T]).then(()=>{ if(col.isConnected) X.redraw(); }).catch(()=>{});
  const fermer=h('button',{class:'sgar-x',title:'Fermer le tableau des articles','aria-label':'Fermer le tableau des articles'},'×'); fermer.onclick=()=>basculer(X,false);
  const q=h('input',{class:'psearch',placeholder:'Rechercher un article',value:P.q[X.id]||'','aria-label':'Rechercher un article'}); col.append(h('div',{class:'sgar-t',title:'Articles du CFC '+(cfc||'')+(d.AWARDINGTEXT?' · '+d.AWARDINGTEXT:'')},h('b',{},'Articles du CFC'),h('span',{},[cfc,d.AWARDINGTEXT].filter(Boolean).join(' · ')),fermer),h('div',{class:'sgar-s'},q),pane,pied);
  const B=()=>ok?svbUnit():{chapitres:[]}, cles=(U,k)=>{ const s=svdLook(U,k); if(s.a) return svdSubtree(s.ch,s.a).filter(svbHasText).map(a=>svdKa(s.ch,a)); return s.ch&&k.startsWith('c|')?s.ch.articles.filter(svbHasText).map(a=>svdKa(s.ch,a)):[]; };
  const ajouter=async k=>{ if(!svdCan(ctx)) return; const U=B(), L=cles(U,k); if(!L.length){ toast('Cet article n’est plus dans la bibliothèque.',true); dessiner(); return; } if(L.length>30&&!await confirmDlg('Ajouter '+L.length+' articles à la soumission ?','Ajouter')) return; P.haut[X.id]=pane.scrollTop; svbInsert(ctx,U,L); };
  const lignes=()=>{ const U=B(), t=(P.q[X.id]||'').trim().toLowerCase(), R=[]; U.chapitres.filter(c=>concerne(c,cfc)).forEach(c=>{ const lib=[c.texte1,c.texte2].filter(Boolean).join(' '), tous=!t||(c.numero+' '+lib).toLowerCase().includes(t), A=c.articles.filter(a=>svbHasText(a)&&a.m!=='000').filter(a=>tous||(svdNum(c.numero,a.m,a.u)+' '+svdKeyword(a)+' '+(a.texte||[]).join(' ')).toLowerCase().includes(t)); if(!A.length) return; R.push({k:'c|'+c.numero,n:c.numero,x:lib,cl:'n0'}); A.forEach(a=>R.push({k:svdKa(c,a),n:svdNum('',a.m,a.u),x:svdKeyword(a)||svdFirstLine(a.texte),u:a.unite||'',cl:niveau(a),d:present(ctx.U,c,a)})); }); return R; };
  const dessiner=()=>{ const R=lignes(), nA=R.filter(r=>r.cl!=='n0').length; if(!R.length){ pane.innerHTML='<div class="sgar-v">'+(!cfc?'<b>Pas de CFC pour cette soumission.</b>Indiquez-le dans l’en-tête du document.':!ok?'Chargement…':(P.q[X.id]||'').trim()?'Aucun article ne correspond.':'<b>Aucun article pour ce CFC pour le moment.</b>La liste sera ajoutée prochainement.')+'</div>'; pied.textContent=''; return; }
    pane.innerHTML='<table><tbody>'+R.map(r=>'<tr data-k="'+E(r.k)+'" class="'+r.cl+(r.d?' sgar-d':'')+(P.sel===r.k?' on':'')+'"><td class="n">'+E(r.n)+'</td><td class="x" title="'+E(r.x)+(r.d?' — déjà dans la soumission':'')+'">'+E(r.x)+'</td><td class="u">'+E(r.u||'')+'</td><td class="c"></td></tr>').join('')+'</tbody></table>'; pied.textContent=nA+(nA>1?' articles':' article')+' · double-clic : ajouter'; };
  const choisir=tr=>{ P.sel=tr.dataset.k; pane.querySelectorAll('tr.on').forEach(x=>x.classList.remove('on')); tr.classList.add('on'); };
  q.oninput=()=>{ P.q[X.id]=q.value; P.pos=q.selectionStart; dessiner(); };
  col.addEventListener('focusin',e=>{ P.foc=e.target===q?'q':'l'; }); col.addEventListener('focusout',e=>{ if(!col.contains(e.relatedTarget)&&e.relatedTarget) P.foc=null; }); q.addEventListener('keyup',()=>{ P.pos=q.selectionStart; }); col._redessiner=()=>{ ok=DS.loaded.has(SVB_T); dessiner(); };
  pane.addEventListener('click',e=>{ const tr=e.target.closest('tr[data-k]'); if(tr){ choisir(tr); pane.focus({preventScroll:true}); } });
  pane.addEventListener('dblclick',e=>{ const tr=e.target.closest('tr[data-k]'); if(tr) ajouter(tr.dataset.k); });
  pane.addEventListener('keydown',e=>{ const L=[...pane.querySelectorAll('tr[data-k]')], i=L.findIndex(x=>x.classList.contains('on')); if(e.key==='Enter'&&i>=0){ e.preventDefault(); ajouter(L[i].dataset.k); } else if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); const n=L[Math.max(0,Math.min(L.length-1,i+(e.key==='ArrowDown'?1:-1)))]; if(n){ choisir(n); n.scrollIntoView({block:'nearest'}); } } });
  dessiner(); setTimeout(()=>{ pane.scrollTop=P.haut[X.id]||0; if(P.foc&&col.isConnected&&!document.querySelector('.ov')){ if(P.foc==='q'){ q.focus({preventScroll:true}); try{ q.setSelectionRange(P.pos,P.pos); }catch(_){ } } else pane.focus({preventScroll:true}); } },0); pane.addEventListener('scroll',()=>{ P.haut[X.id]=pane.scrollTop; }); return col; }
const basculer=(X,on)=>{ P.ouvert=on; try{ localStorage.setItem(CLE,on?'1':'0'); }catch(_){ } X.redraw(); };
const pp0=svdPersoPanel; svdPersoPanel=function(ctx){ return ctx.et==='B'&&!P.perso?panneau(ctx):pp0(ctx); };
const de2=svdDesc; svdDesc=function(X,et,o){ if(et!=='B'||estD(X.S)) return de2(X,et,o); const C=SVD_UI.perso, av=!!C.open; P.perso=av; C.open=av||P.ouvert; let r; try{ r=de2(X,et,o); }finally{ C.open=av; }
  const bar=X.el.querySelector('.ph2'); if(bar&&!av){ const b=ibtn({i:'list',label:'Articles du CFC',on:P.ouvert,t:'Afficher ou masquer le tableau des articles',fn:()=>basculer(X,!P.ouvert)}); bar.insertBefore(b,bar.children[2]||null); } return r; };
const CSS=`
/* panneau intégré au tableau : en-tête de la même hauteur et du même filet noir que les titres de colonnes, filet gris de séparation, lignes compactes (plan CFC des devis) */
html body .sgar{flex:0 0 300px!important;width:300px!important;min-width:0;min-height:0;display:flex;flex-direction:column;background:#fff;border:0!important;border-right:1px solid var(--s-filet)!important;box-shadow:none!important}
.sgar-t{flex:none;display:flex;align-items:center;gap:6px;height:34px;box-sizing:border-box;padding:0 4px 0 12px;border-bottom:2px solid var(--s-noir);font-size:11px;white-space:nowrap}
.sgar-t b{font-weight:700;color:var(--s-gris)}
.sgar-t span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;color:var(--s-noir);font-weight:700}
.sgar-x{flex:none;border:0;background:none;width:26px;height:26px;font-size:17px;line-height:1;color:var(--s-gris);cursor:pointer}
.sgar-x:hover{color:var(--s-noir);background:var(--s-jaune3)}
.sgar-s{flex:none;padding:8px 10px 8px 12px;border-bottom:1px solid var(--s-filet)}
.sgar-s input{width:100%;box-sizing:border-box;height:30px;border:1.5px solid var(--s-noir)!important;border-radius:0!important;padding:0 8px;font-size:12.5px;background:#fff}
.sgar-l{flex:1;min-height:0;overflow:auto;outline:0}
.sgar-l table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12.5px}
.sgar-l td{height:30px;padding:0 6px;border-bottom:1px solid var(--s-filet);vertical-align:middle;position:relative}
.sgar-l td.n{width:58px;padding-left:12px;white-space:nowrap;font-variant-numeric:tabular-nums}
.sgar-l td.x{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgar-l td.u{width:34px;color:var(--s-gris);font-size:11.5px;text-align:right}
.sgar-l td.c{width:22px;padding:0}
.sgar-l tr.sgar-d td.c::after{content:'';position:absolute;left:5px;top:50%;width:9px;height:5px;margin-top:-5px;border-left:2px solid var(--s-nuit);border-bottom:2px solid var(--s-nuit);transform:rotate(-45deg)}
.sgar-l tr[data-k]{cursor:pointer;user-select:none}
.sgar-l tr:hover td{background:var(--s-jaune3)}
.sgar-l tr.on td{background:var(--s-jaune2)}
.sgar-l tr.on td:first-child{box-shadow:inset 3px 0 0 var(--s-nuit)}
.sgar-l tr.n0 td{background:var(--s-nuit3);font-weight:700;height:32px}
.sgar-l tr.n0.on td{background:var(--s-jaune2)}
.sgar-l tr.n1 td,.sgar-l tr.n2 td{font-weight:700}
.sgar-l tr.n4 td.x,.sgar-l tr.n5 td.x{padding-left:10px}
.sgar-l tr.sgar-d td.n,.sgar-l tr.sgar-d td.x{color:var(--s-gris)}
.sgar-v{padding:28px 18px;font-size:12.5px;line-height:1.5;color:var(--s-gris);text-align:center}
.sgar-v b{display:block;color:var(--s-noir);margin-bottom:2px}
.sgar-p{flex:none;padding:7px 12px;border-top:1px solid var(--s-filet);font-size:11.5px;color:var(--s-gris);min-height:16px}
`;
const css=()=>{ if(!document.getElementById('sgar-css')){ const s=document.createElement('style'); s.id='sgar-css'; s.textContent=CSS; document.head.appendChild(s); } };
/* bibliothèque modifiée (ici ou sur un autre poste) : le tableau se redessine seul */
DS.on(ts=>{ if((ts||[]).includes(SVB_T)) setTimeout(()=>{ const c=document.querySelector('.sgar'); if(c&&c._redessiner) c._redessiner(); },0); });
/* après une insertion depuis la bibliothèque, avant l'enregistrement : mots-clés des titres créés, quantités d'un article devenu titre */
let FIX=null;
const bi0=svbInsert; svbInsert=function(ctx){ FIX={ctx,avant:new Set((ctx.U.chapitres||[]).flatMap(c=>c.articles))}; try{ return bi0.apply(this,arguments); }finally{ FIX=null; } };
const tc0=svdTouch; svdTouch=function(ctx){ if(FIX&&FIX.ctx===ctx) try{ corriger(ctx,FIX.avant); }catch(e){ console.error(e); } return tc0.apply(this,arguments); };
function corriger(ctx,avant){ (ctx.U.chapitres||[]).forEach(ch=>{ ch.articles.forEach(x=>{ if(avant.has(x)||svdKeyword(x).trim()) return; const L=svdLevel(x);
      x.motCleAuto=false; x.motCle=x.m==='000'&&!x.u?'Remarques préliminaires':(L==='par'?'Paragraphe ':L==='spar'?'Sous-paragraphe ':'Article ')+x.m+(x.u?'.'+x.u:''); if(svdIsReserve(ch.numero,x.m,x.u)&&!svbHasText(x)) x.texte=svdWrap(x.motCle); });
    ch.articles.forEach(pa=>{ if(pa.u||!(pa.quantites||[]).length||svdIsQtyArticle(ch,pa)) return; const b=ch.articles.find(y=>!avant.has(y)&&y.m===pa.m&&y.u&&svdIsQtyArticle(ch,y)&&!(y.quantites||[]).some(q=>+q.quantite||(q.metre||[]).length));
      if(b){ b.quantites=pa.quantites; pa.quantites=[]; toast('Quantités de l’article '+pa.m+' reportées sur '+pa.m+'.'+b.u+'.'); } }); }); }
window.SGAR={P,concerne,panneau,corriger};
})();

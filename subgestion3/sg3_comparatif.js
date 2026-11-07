/* ═══ COMPARATIF ▸ ÉDITER : ENTREPRISES EN COLONNES OU EN LIGNES, PRIX SAISIS DANS LE TABLEAU (06.11.2026, bloc 39 ; demandes de Paulo : « dans comparatif
   éditer je souhaite que les entreprises soient indiquées par colonne et par ligne », « les montants des articles je souhaite pouvoir le faire directement
   dans le fichier affiché sans avoir besoin d'entrer les données dans une fenêtre qui s'ouvre ») ═══
   Le moteur reste celui de DeltaSub.html, qui garde ses écrans : svdDesc, svdBuildRows, svdColumns, svdTableHtml, svcRows, svcFooter, svcDescMenus, svEdRefresh, svClose et
   svSaveAll sont enveloppés ici. Choix « Affichage : En colonnes · En lignes » dans la barre (par poste, localStorage sg3_cmp_ent, colonnes d'office).
   En colonnes : un article par ligne, deux colonnes par entreprise (Prix unitaire, Montant), largeur d'après le contenu, en-tête à deux étages, colonnes Art. /
   Description fixes au défilement horizontal ; les lignes d'entreprise du moteur sont fondues dans la ligne de leur article (ou de leur quantité). En lignes :
   présentation du moteur, colonnes Prix unitaire et Montant toujours présentes (un comparatif sans prix doit pouvoir se remplir). Les deux vues : total de chaque
   chapitre par entreprise (le moteur y affichait 0.00, le montant du descriptif n'existant pas au comparatif) ; copie et CSV suivent la vue.
   Prix unitaire = un champ dans chaque case : Tab = entreprise suivante, Entrée ou ↓ = article suivant, ↑ = précédent, Échap = dernière valeur enregistrée,
   I = compris dans l'offre, N = non compris (aussi au clic droit), case vide = pas de prix. Mêmes règles que la fenêtre « Prix » (svcPriceInput) : pas de champ en
   lecture seule, sans le droit de modifier, ni quand le prix est fixé par le concepteur (svcSync le réécrirait) ; « Prix identique » s'applique à toutes les
   quantités de l'article ; 999'999'999 au plus. Plusieurs cellules collées d'un tableur sont refusées (RX_PRIX). Les fenêtres « Prix » et « Prix des entreprises » restent.
   Enregistrement sans redessiner (le curseur reste en place) : mémoire, cases et pied mis à jour sur place (maj, pied), X.commit de tout le contenu, un seul à la
   fois, ce qui arrive pendant un envoi part juste après (enregistrer, envoyer). Les autres écritures de la fenêtre attendent la fin de l'envoi (X.commit, svClose,
   svSaveAll enveloppés) : sinon le serveur répondrait par un faux conflit. svEdRefresh attend aussi : un relevé du serveur rechargerait le contenu pendant la saisie.
   Journal des saisies non confirmées (VOL.jour) : après un conflit, le moteur relit le contenu et les saisies sont reposées dessus puis renvoyées ; session fermée :
   elles restent à l'écran et partent après la reconnexion ; refus de droits : retirées. Un redessin venu d'ailleurs garde le texte et le curseur de la case en
   cours sans rien enregistrer (surRedraw) : le prix n'est écrit qu'à la validation, jamais un nombre à moitié tapé.
   Quantités (06.11.2026, Paulo : « appels d'offres, permettre de modifier les quantités dans le tableau directement sans devoir ouvrir une fenêtre ») : champ dans la colonne
   Quantité aux étapes d'avant le contrat (QTE_ET : descriptif type, estimatif, appel d'offres, comparatif, offre ; Contrat et Métré gardent la fenêtre). Mêmes règles que la fenêtre
   « Quantités » (svdQtyInput) : pas de champ si un métré calcule la quantité ni pour une quantité « par », 3 décimales, 9'999'999'999 au plus ; article sans quantité : la saisie crée sa
   ligne de quantité. Même enregistrement que les prix (saisir, enregistrer, maj) ; toutes les étapes passent donc par svdDesc enveloppé. Au comparatif, Tab saute les quantités (tabindex -1).
   Nouvel article, nouveau chapitre (06.11.2026, Paulo : « impossible d'ajouter de nouvel article… peux-tu corriger, idem pour nouveau chapitre ») : la fenêtre du moteur exigeait une ligne déjà choisie, un
   double-clic dans une liste de 729 numéros et une unité dans un menu caché, OK restant gris sans explication. svdResPos (libre) enveloppé → nouvelArticle : chapitre, numéro proposé (modifiable : 112 ou 112.110),
   description, unité, quantité, message clair ; mêmes règles et mêmes primitives (svdEnsureArticle : titres parents créés, svbFill, svdAutoDivs) ; « Ajouter et continuer » ; « Liste des numéros… » = fenêtre d'origine (groupes,
   variables, bibliothèque). Nouveau chapitre (svdChapterDlg enveloppé) : numéro proposé, curseur sur le titre, ce qui manque est écrit. Sans ligne choisie, le premier chapitre l'est d'office (svdDesc).
   Rang (06.11.2026, Paulo : « pour le rang toujours déplacer le 1 en premier et suivi du 2, 3 et 4 ») : tableau du pied, colonnes, lignes et totaux dans l'ordre du rang, celui des
   documents (svbSorted : tri automatique sur le net, ou ordre manuel de « Affichage et tri ») ; le pied se réordonne aussitôt, les colonnes et les lignes au dessin suivant (ETAT.rendu) : une case ne se déplace pas sous le curseur.
   ⚠ Classes sgcp-* : « sgc- » est pris par le Contrôle des heures et « col » par le moteur (.col = display:flex). Styles <style id="sgcp-css">. Débogage : window.SGCP. */
(function(){
if(typeof svcEdit!=='function'||typeof svdTableHtml!=='function'||typeof svcRows!=='function'||typeof svdColumns!=='function') return;
const CLE='sg3_cmp_ent', E=s=>esc(String(s==null?'':s));
let VUE='col'; try{ if(localStorage.getItem(CLE)==='lig') VUE='lig'; }catch(_){ }
const ETAT={ctx:null,cible:null,bas:false,souris:null,garde:false,ordre:null,fige:null,rendu:null}, VOL={cours:false,encore:false,ts:[],p:null,jour:[],n:0,X:null,att:false};
const estC=ctx=>ctx.et==='C1'&&!!(ctx.o&&ctx.o.rows);
const QTE_ET=new Set(['A','K','B','C1','C']);
const ecriture=X=>!X.ro&&svCanEdit(X.doc);
const qteOk=ctx=>!!ctx.X&&QTE_ET.has(ctx.et)&&!ctx.ro&&!(ctx.o&&ctx.o.ro)&&ecriture(ctx.X);
const SANS0=x=>String(x==null?'':x).replace(/<[^>]*>/g,'').trim().replace(/[()]/g,'')==='0.00';
const prixDe=(q,cid)=>(q.prixEntreprises||[]).find(x=>String(x.contactId)===String(cid))||null;
const ctxDe=(X,et)=>Object.assign(svcCx(X,et),{o:(ETAT.ctx&&ETAT.ctx.et===et&&ETAT.ctx.o)||{}});
const valeur=p=>svdIs('IN',p.gp)?p.gp:(+p.prix?svdFmtAmt(p.prix):'');
/* entreprises retenues dans l'ordre du rang ; sans rang à la fin */
const enOrdre=S=>{ const L=svcRet(S), R=svbRank(svcView(S)), n=e=>R[e.contactId]||1e9; return L.map((e,i)=>({e,i})).sort((a,b)=>n(a.e)-n(b.e)||a.i-b.i).map(x=>x.e); };
const RX_PRIX=/^-?(?:\d+(?:[.,]\d*)?|\d{1,3}(?:[ '’  ]\d{3})+(?:[.,]\d*)?|[.,]\d+)$/;
const CSS=`
html .svd-tb.sgcp-tb{border-collapse:separate;border-spacing:0}
html .svd-tb.sgcp-tb th{top:0}
html .svd-tb.sgcp-tb.sgcp-cl thead th{white-space:normal;vertical-align:bottom;overflow:hidden}
html .svd-tb.sgcp-tb.sgcp-cl tr.sgcp-h1 th{height:38px;box-sizing:border-box;padding:4px 8px;border-bottom:0;line-height:1.25}
html .svd-tb.sgcp-tb.sgcp-cl tr.sgcp-h1 th[rowspan]{height:auto;border-bottom:2px solid var(--s-noir)}
html .svd-tb.sgcp-tb.sgcp-cl tr.sgcp-h2 th{top:38px;padding:2px 4px 5px;text-align:right;font-weight:400;white-space:nowrap}
html .svd-tb.sgcp-tb.sgcp-cl th.sgcp-e{color:var(--s-noir);font-size:12px;text-align:left;border-left:1px solid var(--s-filet);cursor:pointer}
html .svd-tb.sgcp-tb.sgcp-cl th.sgcp-e:hover{background:var(--s-jaune3)}
html .svd-tb.sgcp-tb.sgcp-cl th.sgcp-e.sgcp-cour{box-shadow:inset 0 -3px 0 var(--s-jaune)}
.sgcp-nom{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
html .svd-tb.sgcp-tb.sgcp-cl .sgcp-d{border-left:1px solid var(--s-filet)}
html .svd-tb.sgcp-tb.sgcp-cl td.sgcp-d,html .svd-tb.sgcp-tb.sgcp-cl td.sgcp-m{padding-left:4px;padding-right:4px}
html .svd-tb.sgcp-tb.sgcp-cl td.sgcp-m{color:var(--s-noir)}
html .svd-tb.sgcp-tb .sgcp-fx{position:sticky;z-index:1}
html .svd-tb.sgcp-tb thead .sgcp-fx{z-index:3}
html .svd-tb.sgcp-tb.sgcp-cl tr.svd-t td{white-space:nowrap}
html .svd-tb.sgcp-tb tr.sgcp-tl td{color:var(--s-noir);font-weight:700;border-bottom:0}
html .svd-tb.sgcp-tb td.sgcp-c{padding:3px 2px}
.sgcp-px{display:block;width:100%;box-sizing:border-box;height:22px;margin:0;padding:0 2px;border:0;border-bottom:1px solid var(--s-gris);border-radius:0;background:transparent;font:inherit;font-variant-numeric:tabular-nums;text-align:right;color:var(--s-noir);outline:0}
.sgcp-px:hover{background:var(--s-jaune3)}
.sgcp-px:focus{background:#fff;border-bottom-color:transparent;box-shadow:inset 0 0 0 2px var(--s-nuit)}
.sgcp-gp{font-size:10.5px;color:var(--s-gris);margin-right:4px}
.sgcp-vue{display:inline-flex;align-items:center;gap:2px;margin-left:10px;font-size:12px;color:var(--s-gris)}
.sgcp-vue b{font-weight:400;margin-right:6px}
.sgcp-vue button{border:0;background:none;padding:0 6px;height:30px;font:inherit;font-size:12.5px;color:var(--s-gris);cursor:pointer;border-bottom:3px solid transparent}
.sgcp-vue button:hover{color:var(--s-noir)}
.sgcp-vue button.on{color:var(--s-noir);font-weight:700;border-bottom-color:var(--s-nuit)}
.sgcp-na{display:grid;grid-template-columns:130px minmax(0,1fr) 130px;gap:10px 14px;width:min(560px,78vw)}
.sgcp-na label{display:flex;flex-direction:column;gap:4px;font-size:11px;font-weight:700;color:var(--s-gris);min-width:0}
.sgcp-na .lg{grid-column:1/-1}
.sgcp-na .inp{width:100%!important;box-sizing:border-box;height:34px;border:1.5px solid var(--s-noir)!important;border-radius:0!important;background:#fff;font-size:13px;font-weight:400;color:var(--s-noir)}
.sgcp-na textarea.inp{height:auto;padding:6px 8px;line-height:1.4;resize:vertical;font-family:inherit}
.sgcp-na .inp:disabled{background:var(--s-nuit3);border-color:var(--s-nuit3)!important;color:var(--s-gris)}
.sgcp-note{min-height:17px;margin-top:10px;font-size:12px;color:var(--s-gris)}
.sgcp-note.err{color:var(--s-rouge,#BD1E42);font-weight:700}
.sgcp-aide{flex:1 1 0;text-align:right;font-size:11.5px;color:var(--s-gris);padding-left:12px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
`;
const css=()=>{ if(!document.getElementById('sgcp-css')){ const s=document.createElement('style'); s.id='sgcp-css'; s.textContent=CSS; document.head.appendChild(s); } };

/* ── données des lignes : chaque ligne d'entreprise garde sa quantité, son article et son prix ── */
/* tableau du pied dans l'ordre du rang ; chaque ligne porte son entreprise (data-cid) */
const sf0=svcFooter; svcFooter=function(ctx){ const el=sf0(ctx), b=el.querySelector('table.g tbody'); if(!b) return el; const L=svcRet(ctx.S), T=[...b.rows];
  T.forEach((tr,i)=>{ if(L[i]) tr.dataset.cid=L[i].contactId; }); enOrdre(ctx.S).forEach(e=>{ const tr=T[L.indexOf(e)]; if(tr) b.append(tr); }); return el; };
const sr0=svcRows; svcRows=function(ctx,q,a,ch){ const R=sr0(ctx,q,a,ch), des=+q.prix!==0&&svdIs('RF',q.gp);
  R.forEach(r=>{ const m=String(r.k).split('|'), cid=m.pop(); r._c={cid,base:m.join('|'),q,a,ch,p:prixDe(q,cid),edit:!des&&svdIsQtyArticle(ch,a)}; });
  const O=ETAT.ordre; return O?R.sort((x,y)=>O.indexOf(x._c.cid)-O.indexOf(y._c.cid)):R; };

/* case de quantité : ligne de la quantité, ou article dans lequel elle est fondue ; article de quantité sans ligne de quantité : la saisie la crée */
const marqueQte=(ctx,R)=>{ if(!qteOk(ctx)) return R; const U=ctx.U, C1=ctx.et==='C1';
  R.forEach(r=>{ const k=String(r.k||''); if(r._c||!/^[aq]\|/.test(k)) return; const s=svdLook(U,k); if(!s.a||!svdIsQtyArticle(s.ch,s.a)) return;
    if(k[0]==='a'&&s.a.quantites.length&&r.cells.qt==null) return;   /* quantités sur leurs propres lignes */
    const q=s.q||s.a.quantites[0]||null; if(q&&((q.metre||[]).length||q.gq==='W')) return;
    (r.ed||(r.ed={})).qt={k:q?'q|'+s.ch.numero+'|'+s.a.m+'|'+(s.a.u||'')+'|'+s.a.quantites.indexOf(q):k,c:'',v:q?svdFmtQty(q.quantite):'',t:'',qte:true,saut:C1}; });
  return R; };
const br0=svdBuildRows; svdBuildRows=function(ctx){ if(!estC(ctx)) return marqueQte(ctx,br0(ctx)); const col=VUE==='col', S=ctx.S, ids=ETAT.fige||enOrdre(S).map(e=>String(e.contactId)); let R0;
  ETAT.ordre=ids; try{ R0=br0(ctx); }finally{ ETAT.ordre=null; }
  const U=ctx.U, a5=svcA5(S), ents=svcRet(S).slice().sort((a,b)=>ids.indexOf(String(a.contactId))-ids.indexOf(String(b.contactId))), peut=ecriture(ctx.X), R=[]; let cur=null, tCh={}, tGr={};
  const plus=(T,c,v)=>{ T[c]=(T[c]||0)+v; };
  R0.forEach(r=>{ const c=r._c;
    if(c){ const mt=SANS0(r.cells.mt)?'':r.cells.mt, p=c.p, pr=p&&!+p.prix&&!svdIs('IN',p.gp)?'':r.cells.pr, g=p&&p.gp&&p.gp!=='A'&&!svdIs('IN',p.gp)?'<span class="sgcp-gp" title="'+E(SVD_GP_PI[p.gp]||'')+'">'+E(p.gp)+'</span>':'';
      if(p&&svdCounted(U,c.ch,c.q,p.gp)) plus(tCh,c.cid,+p.montant||0);
      const ed=p&&c.edit&&peut?{k:c.base,c:c.cid,v:valeur(p),t:p.gp&&p.gp!=='A'?SVD_GP_PI[p.gp]||'':''}:null;
      if(col){ if(!cur) return; const kP='e'+c.cid+'_pr', kM='e'+c.cid+'_mt'; cur.cells[kP]=pr; cur.cells[kM]=mt; if(g) (cur.pre||(cur.pre={}))[kM]=g; if(ed) (cur.ed||(cur.ed={}))[kP]=ed; return; }
      r.cells.pr=pr; r.cells.mt=mt; if(ed) r.ed={pr:ed}; R.push(r); return; }
    if(/(^| )svd-t( |$)/.test(r.cls||'')){ const ch=String(r.k).startsWith('t|'), T=ch?tCh:tGr, V={}; ents.forEach(e=>{ V[e.contactId]=svdRnd(T[e.contactId]||0,a5); });
      if(ch){ ents.forEach(e=>plus(tGr,e.contactId,V[e.contactId])); tCh={}; } else tGr={};
      r.cells.mt=''; R.push(r);
      if(col) ents.forEach(e=>{ r.cells['e'+e.contactId+'_mt']='<b>'+svdFmtAmt(V[e.contactId])+'</b>'; });
      else ents.forEach(e=>R.push({k:r.k?r.k+'|'+e.contactId:'',cls:'svc-e sgcp-tl',cells:{en:svcNameHtml(e),mt:svdFmtAmt(V[e.contactId])}}));
      cur=null; return; }
    if(r.cls==='svd-g'&&!r.k) tGr={};
    cur=r; R.push(r); });
  return marqueQte(ctx,R); };

const co0=svdColumns; svdColumns=function(ctx){ let L=co0(ctx);
  if(qteOk(ctx)&&!L.some(c=>c.k==='qt')&&svdBuildRows(ctx).some(r=>r.ed&&r.ed.qt)){ const i=L.findIndex(c=>/^(nc|en|gp|pr|mt|tva)$/.test(c.k)); L=L.slice(); L.splice(i<0?L.length:i,0,{k:'qt',t:'Quantité',w:86}); }
  if(!estC(ctx)) return L;
  if(VUE!=='col'){ const e=L.findIndex(c=>c.k==='en'); if(e<0) return L; const R=L.slice(); let i=e+1; if(R[i]&&R[i].k==='gp') i++;
    [['pr','Prix unitaire',96],['mt','Montant',108]].forEach(([k,t,w])=>{ const j=R.findIndex(c=>c.k===k); if(j<0) R.splice(i,0,{k,t,w}); i=(j<0?i:j)+1; }); return R; }
  const P={p:52,u:52,un:48,qt:72}, cols=L.filter(c=>!/^(en|gp|pr|mt)$/.test(c.k)).map(c=>P[c.k]?{...c,w:P[c.k]}:c), rows=svdBuildRows(ctx);
  const lg=k=>rows.reduce((n,r)=>{ const v=r.ed&&r.ed[k]?r.ed[k].v:r.cells[k]; return Math.max(n,String(v==null?'':v).replace(/<[^>]*>/g,'').length); },0);
  return [...cols,...enOrdre(ctx.S).flatMap(e=>{ const n=svcName(e), kP='e'+e.contactId+'_pr', kM='e'+e.contactId+'_mt';
    return [{k:kP,t:n+' · Prix unitaire',sous:'Prix unitaire',w:Math.max(84,Math.ceil(lg(kP)*6.9)+16),r:true,ent:e},{k:kM,t:n+' · Montant',sous:'Montant',w:Math.max(82,Math.ceil(lg(kM)*7.4)+12),r:true,ent:e,m:true}]; })]; };

const champ=(ed,lib)=>'<input class="sgcp-px" data-k="'+E(ed.k)+'" data-c="'+E(ed.c)+'" value="'+E(ed.v)+'" autocomplete="off" spellcheck="false"'+(ed.qte?' data-q="1"':'')+(ed.saut?' tabindex="-1"':'')+(ed.t?' title="'+E(ed.t)+'"':'')+' aria-label="'+E(lib)+'">';
const contenu=(r,c)=>{ const ed=r.ed&&r.ed[c.k]; return ed?champ(ed,ed.qte?'Quantité':c.ent?'Prix unitaire, '+svcName(c.ent):'Prix unitaire'):((r.pre&&r.pre[c.k])||'')+(r.cells[c.k]??''); };

/* ── tableau : même structure que le moteur (data-i, classes), plus les champs et, en colonnes, l'en-tête à deux étages ── */
const th0=svdTableHtml; svdTableHtml=function(ctx){ const C=estC(ctx); if(!C&&!qteOk(ctx)){ ETAT.ctx=null; return th0(ctx); } const cols=ctx.cols=svdColumns(ctx), rows=ctx.rows=svdBuildRows(ctx); if(!rows.length){ ETAT.ctx=null; return th0(ctx); }
  ETAT.ctx=ctx; ETAT.rendu=C?enOrdre(ctx.S).map(e=>String(e.contactId)):null; const col=C&&VUE==='col', sel=SVD_UI.sel[ctx.et], num_=new Set(['qt','pr','mt','nc','tva']), cour=C?String(SVC_UI.ent[ctx.X.id]||''):'';
  const iT=cols.findIndex(c=>c.k==='t'); let g=0; const fx=cols.map((c,i)=>{ if(!col||i>iT) return null; const l=g; g+=+c.w||0; return l; });
  const fixes=cols.reduce((n,c)=>n+(+c.w||0),0), cl=(c,i)=>[num_.has(c.k)||c.r?'r':'',c.ent&&!c.m?'sgcp-d':'',c.m?'sgcp-m':'',fx[i]!=null?'sgcp-fx':''].filter(Boolean).join(' '), st=i=>fx[i]!=null?' style="left:'+fx[i]+'px"':'';
  let tete; if(col){ const h1=[]; cols.forEach((c,i)=>{ if(c.ent){ if(!c.m) h1.push('<th colspan="2" class="sgcp-e'+(String(c.ent.contactId)===cour?' sgcp-cour':'')+'" data-cid="'+E(c.ent.contactId)+'" title="'+E(svcName(c.ent))+'"><span class="sgcp-nom">'+svcNameHtml(c.ent)+'</span></th>'); }
      else h1.push('<th rowspan="2"'+(fx[i]!=null?' class="sgcp-fx"':'')+st(i)+' title="'+E(c.t)+'">'+E(c.t)+'</th>'); });
    tete='<tr class="sgcp-h1">'+h1.join('')+'</tr><tr class="sgcp-h2">'+cols.filter(c=>c.ent).map(c=>'<th'+(c.m?'':' class="sgcp-d"')+'>'+E(c.sous)+'</th>').join('')+'</tr>'; }
  else tete='<tr>'+cols.map(c=>'<th title="'+E(c.t)+'">'+E(c.t)+'</th>').join('')+'</tr>';
  return '<table class="svd-tb sgcp-tb'+(col?' sgcp-cl':'')+'"'+(col?' style="min-width:'+(fixes+190)+'px"':'')+'><colgroup>'+cols.map(c=>'<col'+(c.w?' style="width:'+c.w+'px"':'')+'>').join('')+'</colgroup><thead>'+tete+'</thead><tbody>'+
    rows.map((r,i)=>'<tr data-i="'+i+'" class="'+(r.cls||'')+(sel&&r.k===sel?' on':'')+'">'+cols.map((c,j)=>{ const a=cl(c,j), ed=r.ed&&r.ed[c.k]; return '<td'+(a||ed?' class="'+a+(ed?' sgcp-c':'')+'"':'')+st(j)+'>'+contenu(r,c)+'</td>'; }).join('')+'</tr>').join('')+'</tbody></table>'; };

/* ── saisie : écrit le prix en mémoire → true (changé), false (rien à faire), null (refusé) ── */
function appliquer(X,k,cid,txt){ const S=X.S, U=svdUnit(S,'C1'), s=svdLook(U,k), e=svcRet(S).find(x=>String(x.contactId)===String(cid)); if(!s.q||!e) return false;
  const a5=svcA5(S), t=String(txt==null?'':txt).trim().toLowerCase(), z0=prixDe(s.q,cid), g0=(z0&&z0.gp)||'A'; let gp, prix;
  if(t==='i'||t==='n'){ gp=t.toUpperCase(); prix=0; }
  else { const v=t===''?0:RX_PRIX.test(t)?svdParseNum(t):null; if(v==null){ toast('Prix non reconnu : saisissez un seul nombre, I (compris dans l’offre) ou N (non compris).',true); return null; }
    if(Math.abs(v)>999999999){ toast('Valeur trop élevée.',true); return null; } gp=svdIs('IN',g0)?'A':g0; prix=v; }
  if(z0&&(z0.gp||'A')===gp&&+z0.prix===prix) return false;
  (s.a.prixIdentique?s.a.quantites:[s.q]).forEach(q=>{ let z=prixDe(q,cid); if(!z){ z={contactId:e.contactId,gp:'A',prix:0,montant:0}; (q.prixEntreprises||(q.prixEntreprises=[])).push(z); } z.gp=gp; z.prix=prix; svdCalcQP(q,a5); });
  svcRecalcAll(S); return true; }
/* quantité : mêmes règles que la fenêtre « Quantités » → true, false, null */
function appliquerQte(X,et,k,txt){ const S=X.S, U=svdUnit(S,et), s=svdLook(U,k); if(!s.a||!svdIsQtyArticle(s.ch,s.a)) return false; let q=s.q||s.a.quantites[0]||null; if(q&&((q.metre||[]).length||q.gq==='W')) return false;
  const t=String(txt==null?'':txt).trim(), v=t===''?0:RX_PRIX.test(t)?svdParseNum(t):null; if(v==null){ toast('Quantité non reconnue : saisissez un seul nombre.',true); return null; }
  if(Math.abs(v)>9999999999){ toast('La valeur est trop élevée.',true); return null; } const n=svdR3(v); if(q&&svdR3(q.quantite)===n) return false;
  if(!q){ if(!n) return false; q=svdNewQP(); s.a.quantites.push(q); if(et==='C1') svcSync(S); } q.quantite=n;
  if(et==='C1') svcRecalcAll(S); else svdRecalc(S,et); return true; }
const ecrire=(X,j)=>{ if(j.desc){ X.S[j.cle]=JSON.parse(JSON.stringify(j.desc)); return true; } const t0=X._tr; if(j.tr!=null) X._tr=j.tr; try{ return j.choix?SGCT.ecrire(X,j):j.qte?appliquerQte(X,j.et,j.k,j.t):appliquer(X,j.k,j.c,j.t); }finally{ X._tr=t0; } };   /* j.tr : saisie du comparatif de travail ou du comparatif des offres (bloc 42) */
/* descriptif (bloc 40) : le journal en garde une copie complète, reposée après un rechargement comme une saisie de prix */
const noterDesc=(X,cle)=>{ if(!X||!X.S||X.S[cle]==null) return; VOL.X=X; VOL.jour=VOL.jour.filter(j=>j.cle!==cle); VOL.jour.push({k:'desc',c:cle,cle,desc:JSON.parse(JSON.stringify(X.S[cle])),s:++VOL.n}); };
/* journal des saisies que le serveur n'a pas encore confirmées */
const saisir=(X,j)=>{ if(j.et==='C1'&&window.SGCT) j.tr=SGCT.actifX(X); const r=ecrire(X,j); if(r){ j.c=String(j.c); VOL.jour=VOL.jour.filter(x=>!(x.k===j.k&&x.c===j.c&&!!x.qte===!!j.qte&&!!x.tr===!!j.tr)); j.s=++VOL.n; VOL.jour.push(j); } return r; };
const reposer=X=>{ VOL.jour=VOL.jour.filter(j=>ecrire(X,j)!==null); };
const coupe=()=>typeof CH08D==='object'&&!!CH08D&&!!CH08D.exp;   /* session fermée, fenêtre de reconnexion ouverte */
const apresReconnexion=X=>{ if(coupe()){ VOL.att=true; setTimeout(()=>apresReconnexion(X),800); return; } VOL.att=false; if(VOL.jour.length&&SV_UI.ed&&SV_UI.ed.X===X){ reposer(X); maj(X); enregistrer(X); } };
/* un seul envoi à la fois : le suivant repart avec tout ce qui a été saisi entre-temps */
function enregistrer(X){ if(VOL.cours){ VOL.encore=true; return VOL.p; } VOL.cours=true; VOL.p=envoyer(X); return VOL.p; }
async function envoyer(X){ let essais=0, relire=false;
  try{ for(;;){ VOL.encore=false; const lim=VOL.n;
      try{ await X._c0(); VOL.jour=VOL.jour.filter(j=>j.s>lim); if(essais) toast('Modifié sur un autre poste : vos saisies ont été reprises sur la version à jour.'); if(!VOL.encore) break; }
      catch(e){ if(!e||!e.conflict){ if(e instanceof SyntaxError) toast('Enregistrement impossible : réponse illisible du serveur. La saisie reste en mémoire et repartira.',true); break; }   /* réseau : le contenu reste en mémoire, il repart à la prochaine saisie ou à la fermeture */
        relire=true; if(e.message==='session'){ if(coupe()){ reposer(X); toast('Session fermée : vos saisies restent à l’écran et seront enregistrées après la reconnexion.',true); if(!VOL.att) apresReconnexion(X); } else VOL.jour=[]; break; }
        reposer(X); if(++essais>=3||!VOL.jour.length) break; } } }
  finally{ VOL.cours=false; VOL.p=null; try{ if(relire) X.redraw(); }catch(e){ console.error(e); } libere(X); } }
const libere=X=>{ VOL.cours=false; VOL.p=null; const ts=VOL.ts; VOL.ts=[]; if(ts.length) svEdRefresh(ts); if(VOL.encore) enregistrer(X); };
const fini=async()=>{ while(VOL.p){ try{ await VOL.p; }catch(_){ } } };
const er0=svEdRefresh; svEdRefresh=function(ts){ if(VOL.cours){ VOL.ts=[...new Set([...VOL.ts,...(ts||[])])]; return; } const X=VOL.X, S0=X&&X.S, r=er0(ts); if(VOL.jour.length&&X&&X.S!==S0&&SV_UI.ed&&SV_UI.ed.X===X){ reposer(X); maj(X); if(!VOL.att) enregistrer(X); } return r; };   /* contenu relu : les saisies non confirmées sont reposées */
/* fermeture : rien ne part tant qu'une saisie n'est pas confirmée (reconnexion attendue, dernier envoi) ; ‹ Liste reste sur le document si le serveur ne répond pas ; le document est celui du clic, même si un autre a été ouvert pendant l'attente */
const sc0=svClose; svClose=async function(o){ o=o||{}; const E0=SV_UI.ed, X=E0&&E0.X, ba=SV_UI.back; if(E0&&E0._sgcpFin) return; if(VOL.p) await fini(); while(coupe()&&VOL.jour.length) await new Promise(r=>setTimeout(r,300));
  if(X&&VOL.X===X&&VOL.jour.length){ reposer(X); enregistrer(X); await fini(); } const a=document.activeElement; if(a&&a.classList&&a.classList.contains('sgcp-px')) a.value=a.defaultValue;
  const reste=X&&VOL.X===X?VOL.jour.length:0, msg=reste?reste+(reste>1?' saisies non enregistrées':' saisie non enregistrée')+' : le serveur ne répond pas.':''; if(reste&&!o.silent&&SV_UI.ed===E0){ toast(msg+' Le document reste ouvert.',true); return; } if(reste) toast(msg,true);
  if(E0) E0._sgcpFin=true; if(E0&&SV_UI.ed!==E0){ const st={ed:SV_UI.ed,open:SV_UI.open,back:SV_UI.back,node:SV_UI.node,ro:SV_UI.ro,roMsg:SV_UI.roMsg}; SV_UI.ed=E0; SV_UI.back=ba; const pr=sc0({silent:true}); Object.assign(SV_UI,st); return pr; } return sc0(o); };
/* ⌘S : la case en cours est validée d'abord, sinon le message annoncerait un enregistrement sans elle */
const sv0=svSaveAll; svSaveAll=async function(X){ const a=document.activeElement; if(a&&a.classList&&a.classList.contains('sgcp-px')&&a.value!==a.defaultValue&&X.el&&X.el.contains(a)) valider(X,a); if(VOL.p) await fini(); return sv0(X); };
/* redessin différé : un clic commencé ne doit pas perdre son bouton */
let BAS=false; addEventListener('pointerdown',()=>{ BAS=true; },true); addEventListener('pointerup',()=>{ BAS=false; },true); addEventListener('pointercancel',()=>{ BAS=false; },true);
const redessiner=X=>{ const r=()=>{ if(SV_UI.ed&&SV_UI.ed.X===X) X.redraw(); }; if(BAS) addEventListener('pointerup',()=>setTimeout(r,0),{once:true,capture:true}); else setTimeout(r,0); };
/* met à jour les cases, les totaux et le pied sur place, sans toucher à ce que l'on est en train de taper ; les colonnes restent celles du dernier dessin */
function maj(X){ const tb=X.el&&X.el.querySelector('table.sgcp-tb'); if(!tb||!tb.isConnected||!ETAT.ctx) return; const et=ETAT.ctx.et, cx=ctxDe(X,et), B=tb.tBodies[0].rows, cols=ETAT.ctx.cols||[]; let rows;
  ETAT.fige=ETAT.rendu; try{ rows=svdBuildRows(cx); }finally{ ETAT.fige=null; }
  if(rows.length!==B.length){ redessiner(X); return; }
  ETAT.ctx.rows=rows; const act=document.activeElement;
  rows.forEach((r,i)=>cols.forEach((c,j)=>{ if(!c.ent&&!/^(pr|mt|gp|qt)$/.test(c.k)) return; const td=B[i]&&B[i].cells[j]; if(!td) return; const inp=td.querySelector('input.sgcp-px'), ed=r.ed&&r.ed[c.k];
    if(inp&&ed){ const av=inp.value, pur=av===inp.defaultValue; if(inp.dataset.k!==ed.k) inp.dataset.k=ed.k; inp.defaultValue=ed.v; if(inp!==act||pur){ inp.value=ed.v; if(inp===act&&av!==ed.v) inp.select(); } if(ed.t) inp.title=ed.t; else inp.removeAttribute('title'); return; }
    const v=contenu(r,c); if(td.innerHTML!==v) td.innerHTML=v; }));
  if(et==='C1') pied(X,cx); else piedDesc(X,et);
  if(cols.some(c=>c.ent)&&[...tb.querySelectorAll('td.sgcp-m,td.sgcp-d')].some(td=>{ const x=td.querySelector('input.sgcp-px')||td; return x.scrollWidth>x.clientWidth+1; })) redessiner(X); }   /* colonne trop étroite pour le nouveau montant : largeur recalculée */
/* pied des autres étapes : mêmes montants, dans le même ordre que le moteur (Brut, conditions, Net) */
function piedDesc(X,et){ const tot=X.el.querySelector('.sgsm-tot'); if(!tot) return; const R=svdTotals(X.S,et), V=[R.brut,...R.rows.map(r=>r.montant),R.net], B=tot.querySelectorAll('b'); if(B.length!==V.length) return; V.forEach((v,i)=>{ const t=svdFmtAmt(v); if(B[i].textContent!==t) B[i].textContent=t; }); }
function pied(X,cx){ const tot=X.el.querySelector('.sgsm-tot'); if(!tot) return; const N=svcFooter(cx), A=[...tot.querySelectorAll('table.g tbody tr')], B=[...N.querySelectorAll('table.g tbody tr')], M=new Map(A.map(t=>[t.dataset.cid,t]));
  if(A.length!==B.length||!A.length||B.some(t=>!M.has(t.dataset.cid))){ tot.replaceChildren(N); return; }   /* sur place : un clic commencé sur le pied ne doit pas perdre son bouton */
  const corps=A[0].parentElement; B.forEach((b,i)=>{ const a=M.get(b.dataset.cid); [...a.cells].forEach((td,j)=>{ const v=b.cells[j]?b.cells[j].innerHTML:''; if(td.innerHTML!==v) td.innerHTML=v; }); if(corps.rows[i]!==a) corps.insertBefore(a,corps.rows[i]); }); }
function valider(X,i){ const q=i.dataset.q==='1', k=i.dataset.k, c=i.dataset.c, et=(ETAT.ctx&&ETAT.ctx.et)||'C1', r=saisir(X,{k,c,t:i.value,et,qte:q}); if(!r){ i.value=i.defaultValue; return; }
  const s=svdLook(svdUnit(X.S,et),k), z=q?(s.q||(s.a&&s.a.quantites[0])):(s.q&&prixDe(s.q,c)), v=z?(q?svdFmtQty(z.quantite):valeur(z)):i.value; i.defaultValue=v; i.value=v; setTimeout(()=>maj(X),0); enregistrer(X); }
const trouve=(tb,k,c)=>[...tb.querySelectorAll('input.sgcp-px')].find(x=>x.dataset.k===k&&x.dataset.c===String(c))||null;
/* redessin : ce qui est en train d'être tapé n'est pas enregistré ; texte et curseur reviennent dans la nouvelle case. Les autres écritures attendent l'envoi en cours */
function surRedraw(X){ if(X._sgcp) return; X._sgcp=true; const r0=X.redraw, c0=X.commit; X._c0=c0; X.commit=async function(...a){ while(VOL.p) await fini(); const lim=VOL.n; VOL.cours=true;   /* même file que les saisies : sinon faux conflit ; le contenu envoyé contient le journal */
    const p=(async()=>{ try{ const r=await c0.apply(X,a); VOL.jour=VOL.jour.filter(j=>j.s>lim); return r; }catch(e){ if(e&&e.conflict&&(e.message!=='session'||coupe())) reposer(X); throw e; }finally{ libere(X); } })(); VOL.p=p; return p; };
  X.redraw=function(){ const a=document.activeElement, i=a&&a.classList&&a.classList.contains('sgcp-px')?a:null, m=i?{k:i.dataset.k,c:i.dataset.c,t:i.value,mod:i.value!==i.defaultValue,d:i.selectionStart,f:i.selectionEnd}:null;
    if(i) i.value=i.defaultValue;   /* sinon la suppression du champ ferait partir un « change » avec un nombre à moitié tapé */
    r0.apply(this,arguments); if(!m) return; const t=X.el&&X.el.querySelector('table.sgcp-tb'), n=t&&trouve(t,m.k,m.c);
    if(!n){ if(m.mod) toast('Cette case n’existe plus : le prix en cours de saisie n’est pas enregistré.',true); return; }
    ETAT.garde=true; try{ n.focus({preventScroll:true}); }finally{ ETAT.garde=false; } if(m.mod){ n.value=m.t; try{ n.setSelectionRange(m.d,m.f); }catch(_){ } } else n.select(); }; }
/* entreprise courante : en-tête, pied, fenêtres du comparatif (svcCurEnt) */
function enteteCour(tb,cid){ tb.querySelectorAll('th.sgcp-e').forEach(t=>t.classList.toggle('sgcp-cour',t.dataset.cid===String(cid))); }
function entreprise(X,tb,cid){ SVC_UI.ent[X.id]=cid; enteteCour(tb,cid);
  const L=[...X.el.querySelectorAll('.sgsm-tot table.g tbody tr')].find(t=>t.dataset.cid===String(cid)); if(L&&!L.classList.contains('on')) L.click(); }
function vue(pane,tb,td){ const P=pane.getBoundingClientRect(), hd=tb.tHead?tb.tHead.getBoundingClientRect().height:0, tr=td.parentElement, fx=[...tr.cells].filter(c=>c.classList.contains('sgcp-fx')).pop(), l=fx?fx.getBoundingClientRect().right-P.left:0, m=td.nextElementSibling&&td.nextElementSibling.classList.contains('sgcp-m')?td.nextElementSibling:td;
  let R=td.getBoundingClientRect(); if(R.top<P.top+hd) pane.scrollTop-=P.top+hd-R.top; else if(R.bottom>P.bottom) pane.scrollTop+=R.bottom-P.bottom;
  R=td.getBoundingClientRect(); if(R.left<P.left+l) pane.scrollLeft-=P.left+l-R.left; else { const D=m.getBoundingClientRect(); if(D.right>P.right) pane.scrollLeft+=D.right-P.right; } }

/* clic droit sur une case de prix : genre de prix, sans fenêtre */
const me0=svcDescMenus; svcDescMenus=function(X,et,name,items){ const L=me0(X,et,name,items), c=ETAT.cible; if(name!=='context'||et!=='C1'||!c) return L; ETAT.cible=null;
  const s=svdLook(svdUnit(X.S,'C1'),c.k), z=s.q&&prixDe(s.q,c.c), g=(z&&z.gp)||'A', fait=t=>()=>{ if(!X.can()) return; if(saisir(X,{k:c.k,c:c.c,t,et:'C1'})){ maj(X); enregistrer(X); } };
  return [{t:'Compris dans l’offre (I)',chk:g==='I',fn:fait('i')},{t:'Non compris dans l’offre (N)',chk:g==='N',fn:fait('n')},{t:'Prix à saisir',chk:!svdIs('IN',g),dis:!svdIs('IN',g),fn:fait('')},'-',...(L||[])]; };

/* ── nouvel article : fenêtre simple, mêmes règles et mêmes primitives que celle du moteur (svdResPos), qui reste accessible ── */
/* sans mot-clé, le moteur bloque Documents et transferts (svdControls) : l'article 000 d'un nouveau chapitre et les titres créés d'office en reçoivent un */
const nc0=svdNewChapter; svdNewChapter=function(){ const c=nc0.apply(this,arguments), z=c.articles&&c.articles[0]; if(z&&!z.motCle){ z.motCle='Remarques préliminaires'; if(svdIsReserve(c.numero,'','')) z.texte=svdWrap('Remarques préliminaires'); } return c; };   /* réserve : un texte est exigé (svdControls) */
const rp0=svdResPos; svdResPos=function(ctx,o){ return o&&o.libre?nouvelArticle(ctx):rp0(ctx,o); };
const proposer=(ch,base)=>{ const z=svdHas0(ch.numero), L=svdFreeMain(ch).filter(m=>m!=='000'&&(z||svdQtyAllowed(ch.numero,m,''))&&(svdIsReserve(ch.numero,'','')||!svdIsReserve('',m,''))); return L.find(m=>m>base)||L[0]||''; };   /* chapitre contenant un 0 : des titres seulement */
function nouvelArticle(ctx){ const X=ctx.X, et=ctx.et, U=svdUnit(X.S,et), L=U.chapitres||[]; if(!L.length){ svdChapterDlg(ctx,null,{libre:true}); return; } DS.need([SVB_T]).catch(()=>{});
  const s0=svdSel(ctx); let ch=s0.ch||L[0], base=s0.a?s0.a.m:(ch.articles[ch.articles.length-1]||{m:''}).m;
  const el=(t,a,...k)=>h(t,a,...k), sel=el('select',{class:'inp'},...L.map(c=>el('option',{value:c.numero,selected:c===ch||null},c.numero+'  '+[c.texte1,c.texte2].filter(Boolean).join(' '))));
  const nr=el('input',{class:'inp',autocomplete:'off',spellcheck:'false',placeholder:'p. ex. 112'}), tx=el('textarea',{class:'inp',rows:4,placeholder:'Texte de l’article'}), un=el('select',{class:'inp'},el('option',{value:''},'Choisir…'),...SVD_UNITS.map(u=>el('option',{value:u},u+'  '+(SVD_UNIT_L[u]||'')))), qt=el('input',{class:'inp',autocomplete:'off',style:{textAlign:'right'}}), note=el('div',{class:'sgcp-note'});
  const champ_=(t,e,c)=>el('label',{class:c||''},t,e), corps=el('div',{},el('div',{class:'sgcp-na'},champ_('Chapitre',sel,'lg'),champ_('Numéro',nr),champ_('Description',tx,'lg'),champ_('Unité',un),champ_('Quantité',qt)),note);
  const lire=()=>{ const t=nr.value.trim().replace(/\s+/g,''), mm=/^(\d{3})(?:\.(\d{3}))?$/.exec(t); if(!mm) return {err:t?'Numéro attendu : 112, ou 112.110 pour un sous-article.':'Indiquez un numéro.'}; const m=mm[1], u=mm[2]||'';
    if(u&&u[0]==='0') return {err:'Le numéro d’un sous-article ne commence pas par 0.'}; if(!svdIsReserve(ch.numero,'','')&&svdIsReserve('',m,u)) return {err:'Numéro de réserve (9 en 2e ou 3e position) : choisissez un autre numéro.'};
    if(u&&u.slice(1)!=='00'&&u[2]!=='0'&&(svdHas0(ch.numero)||svdHas0(m))) return {err:'Sous-article impossible : le chapitre ou l’article principal contient un 0.'};
    if(ch.articles.some(a=>a.m===m&&(a.u||'')===u)) return {err:'Ce numéro existe déjà.'}; return {m,u,titre:!svdQtyAllowed(ch.numero,m,u)}; };
  const dire=(t,e)=>{ note.textContent=t||''; note.classList.toggle('err',!!e); };
  let auto='', uChoisie=false; un.addEventListener('change',()=>{ uChoisie=true; });   /* texte repris de la bibliothèque : remplacé si le numéro change, tant qu'il n'a pas été retouché */
  const suivre=()=>{ const r=lire(); un.disabled=qt.disabled=!!r.titre||null; if(r.err){ dire(r.err,true); return; } dire(r.titre?(svdHas0(ch.numero)?'Le numéro de ce chapitre contient un 0 : il n’accepte que des titres, sans unité ni quantité.':'Titre de paragraphe : sans unité ni quantité.'):'');
    const b=svbFind(ch.numero,r.m,r.u), t=b&&svbHasText(b)?(b.texte||[]).join('\n'):''; if(tx.value===auto){ tx.value=t; auto=t; } if(!r.titre&&!uChoisie) un.value=(b&&b.unite)||ETAT.unite||''; };   /* unité de la bibliothèque d'abord, tant que l'on n'a pas choisi */
  const prochain=()=>{ nr.value=proposer(ch,base); suivre(); };
  sel.onchange=()=>{ ch=L.find(c=>c.numero===sel.value)||ch; base=(ch.articles[ch.articles.length-1]||{m:''}).m; prochain(); }; nr.oninput=suivre;
  const creer=async()=>{ if(!X.can()) return false; const r=lire(); if(r.err){ dire(r.err,true); nr.focus(); return false; } const unite=r.titre?'':un.value; if(!r.titre&&!unite){ dire('Choisissez l’unité.',true); un.focus(); return false; } if(!tx.value.trim()){ dire('Écrivez la description : elle sert de mot-clé à l’article.',true); tx.focus(); return false; }
    const v=qt.value.trim(), q=v===''||r.titre?null:RX_PRIX.test(v)?svdParseNum(v):NaN; if(Number.isNaN(q)||(q!=null&&Math.abs(q)>9999999999)){ dire('Quantité non reconnue : saisissez un seul nombre.',true); qt.focus(); return false; }
    const texte=tx.value.trim(); if(svdWrap(texte).length>SVD_MAXLINES){ dire('Description trop longue : 99 lignes au plus.',true); tx.focus(); return false; }
    const pa=r.u?ch.articles.find(x=>x.m===r.m&&!x.u&&x.quantites.length):null, cx={...ctx,S:X.S,U:svdUnit(X.S,et)}, avant=new Set(ch.articles), a=svdEnsureArticle(ch,r.m,r.u,unite), neufs=ch.articles.filter(x=>!avant.has(x)); if(unite) a.unite=unite; svbFill(ch,neufs); neufs.forEach(x=>{ if(x!==a&&!svdKeyword(x).trim()){ x.motCleAuto=false; x.motCle=(svdLevel(x)==='par'?'Paragraphe ':svdLevel(x)==='spar'?'Sous-paragraphe ':'Article ')+x.m+(x.u?'.'+x.u:''); if(svdIsReserve(ch.numero,x.m,x.u)) x.texte=svdWrap(x.motCle); } });
    if(pa&&!svdIsQtyArticle(ch,pa)&&pa.quantites.length){ a.quantites=pa.quantites; pa.quantites=[]; toast('Quantités de l’article '+r.m+' reportées sur '+r.m+'.'+r.u+'.'); }   /* l'article principal devient un titre : rien ne reste compté sur lui */
    const t=tx.value.trim(); if(t&&t!==auto.trim()){ a.texte=svdWrap(t); a.motCleAuto=true; } else if(t&&!svbHasText(a)){ a.texte=svdWrap(t); a.motCleAuto=true; }
    if(svdIsQtyArticle(ch,a)&&!a.quantites.length) svdAutoDivs(cx,a,ch); if(q!=null&&a.quantites.length) a.quantites[0].quantite=svdR3(q); svdSortChapter(ch);
    SVD_UI.sel[et]=svdKa(ch,a); delete SVD_UI.scroll[X.id+'|'+et]; base=r.m; if(unite) ETAT.unite=unite; await svdTouch(cx); return a; };
  const D=dialog({title:'Nouvel article',width:'620px',body:corps,buttons:[{t:'Liste des numéros…',fn:()=>{ SVD_UI.sel[et]='c|'+ch.numero; rp0(ctx,{libre:true}); }},{t:'Annuler'},
    {t:'Ajouter et continuer',fn:async()=>{ if(await creer()===false) return false; tx.value=''; auto=''; qt.value=''; prochain(); tx.focus(); return false; }},
    {t:'Ajouter',pri:true,fn:async()=>{ const a=await creer(); if(a===false) return false; setTimeout(()=>{ const t=X.el&&X.el.querySelector('table.sgcp-tb'), n=t&&a.quantites.length?trouve(t,'q|'+ch.numero+'|'+a.m+'|'+(a.u||'')+'|0',''):null; if(n&&!n.value.replace(/0/g,'')) n.focus(); },60); }}]});
  corps.addEventListener('keydown',e=>{ if(e.key==='Enter'&&e.target.tagName!=='TEXTAREA'){ e.preventDefault(); e.stopPropagation(); const b=D.bd.parentNode.querySelector('.ft .btn.pri'); if(b) b.click(); } });
  if(ETAT.unite) un.value=ETAT.unite; prochain(); setTimeout(()=>tx.focus(),0); }
/* nouveau chapitre : numéro proposé, curseur sur le titre, ce qui manque est écrit (OK reste gris tant que le moteur le demande) */
const prochainCh=U=>{ const N=(U.chapitres||[]).map(c=>+c.numero).filter(n=>n>0); let n=(N.length?Math.max(...N):210)+1; for(let i=0;i<120&&n<1000;i++,n++){ const t=String(n).padStart(3,'0'); if(svdChapterRuleLibre(t,U,null).ok) return t; } return ''; };
const cd0=svdChapterDlg; svdChapterDlg=function(ctx,ch,o){ const r=cd0(ctx,ch,o); if(ch||ctx.ro||!(o&&o.libre)) return r; const D=[...document.querySelectorAll('.dlg')].pop(), bd=D&&D.querySelector('.bd'); if(!bd) return r; const [nr,t1,,ve]=[...bd.querySelectorAll('input.inp')]; if(!ve) return r;
  css(); const note=h('div',{class:'sgcp-note err'}), ok=D.querySelector('.ft .btn.pri'), dessus=()=>[...document.querySelectorAll('.dlg')].pop()===D, dit=()=>{ note.textContent=!/^\d{3}$/.test(nr.value.trim())?'Il manque le numéro du chapitre (3 chiffres).':!t1.value.trim()?'Il manque le titre du chapitre.':!/^\d{4}$/.test(ve.value.trim())?'Il manque la version (année).':''; };
  bd.append(note); [...bd.querySelectorAll('*')].filter(e=>!e.children.length&&e.textContent==='Texte 1ère ligne').forEach(e=>{ e.textContent='Titre du chapitre'; });
  [nr,t1,ve].forEach(x=>x.addEventListener('input',dit)); const n=prochainCh(ctx.U); if(n){ nr.value=n; nr.dispatchEvent(new Event('input',{bubbles:true})); } dit(); setTimeout(()=>t1.focus(),0);
  bd.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); if(ok&&!ok.disabled&&dessus()) ok.click(); } }); return r; };   /* question ouverte par-dessus : Entrée ne relance pas la création */

/* ── barre et gestes ── */
const de0=svdDesc; svdDesc=function(X,et,o){ css(); surRedraw(X); if(VOL.X!==X){ VOL.X=X; VOL.jour=[]; }
  const U=svdUnit(X.S,et); if((U.chapitres||[]).length&&!svdLook(U,SVD_UI.sel[et]).ch) SVD_UI.sel[et]='c|'+U.chapitres[0].numero;   /* sinon « Nouvel article » reste gris tant qu'aucune ligne n'est choisie */
  if(et==='C1'){ const s=String(SVD_UI.sel.C1||'').split('|'); if(VUE==='col'&&s[0]==='q'&&s[5]){ SVC_UI.ent[X.id]=s[5]; SVD_UI.sel.C1=s.slice(0,5).join('|'); } }   /* ligne d'entreprise choisie dans l'autre vue */
  const r=de0(X,et,o); try{ brancher(X,et); }catch(e){ console.error(e); } return r; };
function brancher(X,et){ const bar=X.el.querySelector('.ph2'), tb=X.el.querySelector('table.sgcp-tb'), peut=ecriture(X), C1=et==='C1'; if(!bar) return;
  if(C1){ const g=document.createElement('div'); g.className='sgcp-vue'; g.innerHTML='<b>Affichage</b>'+[['col','En colonnes'],['lig','En lignes']].map(([v,t])=>'<button type="button" data-v="'+v+'"'+(VUE===v?' class="on"':'')+'>'+t+'</button>').join('');
  g.onclick=e=>{ const b=e.target.closest('[data-v]'); if(!b||b.dataset.v===VUE) return; VUE=b.dataset.v; try{ localStorage.setItem(CLE,VUE); }catch(_){ } delete SVD_UI.scroll[X.id+'|C1']; X.redraw(); const t=X.el.querySelector('table.sgcp-tb'), on=t&&t.querySelector('tr.on'); if(on) vue(t.parentElement,t,on.cells[0]); }; bar.append(g); }
  if(!tb) return; const pane=tb.parentElement, sk=X.id; pane.scrollLeft=ETAT['x'+sk]||0; pane.addEventListener('scroll',()=>{ ETAT['x'+sk]=pane.scrollLeft; });
  if(peut&&tb.querySelector('input.sgcp-px')){ const a=document.createElement('div'); a.className='sgcp-aide'; a.textContent=C1?'Tab : entreprise suivante · Entrée : article suivant · I : inclus · N : pas offert':'Quantités dans le tableau · Entrée : article suivant · Échap : annuler'; a.title=a.textContent; bar.append(a); }
  if(C1){ tb.querySelector('thead').addEventListener('click',e=>{ const t=e.target.closest('th.sgcp-e'); if(t) entreprise(X,tb,t.dataset.cid); });
    X.el.addEventListener('click',e=>{ if(e.target.closest&&e.target.closest('.sgsm-tot table.g tbody tr')) enteteCour(tb,SVC_UI.ent[X.id]); }); }
  const est=x=>x&&x.classList&&x.classList.contains('sgcp-px');
  pane.addEventListener('dblclick',e=>{ if(est(e.target)) e.stopPropagation(); },true);
  pane.addEventListener('contextmenu',e=>{ ETAT.cible=est(e.target)&&e.target.dataset.c?{k:e.target.dataset.k,c:e.target.dataset.c}:null; },true);
  pane.addEventListener('mousedown',e=>{ ETAT.bas=est(e.target)&&document.activeElement!==e.target; },true);
  pane.addEventListener('mouseup',e=>{ if(ETAT.souris===e.target) e.preventDefault(); ETAT.souris=null; ETAT.bas=false; },true);
  pane.addEventListener('focusin',e=>{ const i=e.target; if(!est(i)) return; const tr=i.closest('tr'), r=ETAT.ctx&&ETAT.ctx.rows&&ETAT.ctx.rows[+tr.dataset.i];
    if(r&&r.k&&SVD_UI.sel[et]!==r.k){ SVD_UI.sel[et]=r.k; tb.querySelectorAll('tr.on').forEach(x=>x.classList.remove('on')); tr.classList.add('on'); }
    if(C1&&i.dataset.c) entreprise(X,tb,i.dataset.c); if(ETAT.garde) return; vue(pane,tb,i.closest('td')); i.select(); ETAT.souris=ETAT.bas?i:null; });
  pane.addEventListener('change',e=>{ if(est(e.target)&&!coupe()) valider(X,e.target); });   /* fenêtre de reconnexion : elle prend le focus, un nombre à moitié tapé ne doit pas partir */
  pane.addEventListener('focusout',e=>{ const i=e.target; if(est(i)&&!coupe()&&i.value!==i.defaultValue) valider(X,i); });
  pane.addEventListener('paste',e=>{ if(!est(e.target)) return; const t=((e.clipboardData&&e.clipboardData.getData('text'))||'').replace(/^[\r\n\t ]+|[\r\n\t ]+$/g,''); if(/[\r\n\t]/.test(t)){ e.preventDefault(); toast('Plusieurs cellules collées : collez une seule valeur.',true); } });
  pane.addEventListener('keydown',e=>{ const i=e.target; if(!est(i)) return;
    if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); i.value=i.defaultValue; i.select(); return; }
    if(e.key!=='Enter'&&e.key!=='ArrowDown'&&e.key!=='ArrowUp') return; e.preventDefault();
    const d=e.key==='ArrowUp'||(e.key==='Enter'&&e.shiftKey)?-1:1, L=[...pane.querySelectorAll('input.sgcp-px')].filter(x=>x.dataset.c===i.dataset.c), n=L[L.indexOf(i)+d];
    if(n) n.focus(); else { i.blur(); i.focus(); } }); }
window.SGCP={ETAT,VOL,appliquer,appliquerQte,maj,enregistrer,surRedraw,noterDesc,saisir,enOrdre,get vue(){ return VUE; }};
})();

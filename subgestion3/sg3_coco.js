/* ═══ CONTRÔLE DES COÛTS : LISTE AU GRAPHISME DES DEVIS (09.11.2026, bloc 50 ; Paulo : « corriger le design de la liste, reprend le principe de devis ») ═══
   Page du projet ▸ Contrôle des coûts (ccDomain) et liste de tous les projets (VIEWS.coco sans document ouvert) : même page que la liste des devis (sg3_devis.js,
   SGSV.outils.monter) — bandeau jaune (numéro, « Contrôles des coûts », désignation, maître de l'ouvrage, nombre ; Nouveau contrôle des coûts, ⋯), chiffres (contrôles,
   en cours, coût probable et état du coût du contrôle de référence — le dernier « En cours », sinon le plus récent —, dernière modification), filtres (Tous · Mes
   contrôles pour tous les projets, statuts, recherche), tableau (Variante, N°, Statut, Remarque, Coût probable TTC, État du coût TTC, Modifié, Par). Un clic ouvre le
   contrôle des coûts ; clic droit : ouvrir, modifier l'en-tête, dupliquer (état intermédiaire), supprimer ; ⋯ : copier le tableau, CSV. Mêmes fonctions du moteur
   (ccEditDoc, ccDuplicate, ccOpen, suppression ISMARKEDASDELETED) ; écriture = droit « chantier : écriture » (comme les devis). Montants = ccCalc du moteur (colonnes
   « Coût probable TTC » et « Etat du coût TTC » de l'éditeur). Fermer le contrôle des coûts (« ‹ Liste ») ramène à l'écran d'où il a été ouvert (page du projet…),
   comme les devis. DeltaSub.html seul garde ses écrans. Styles <style id="sgcc-css">, classes sgcc-*. Débogage : window.SGCC. */
(function(){
if(typeof ccDomain!=='function'||typeof ccCalc!=='function'||typeof ccOpen!=='function'||!window.SGSV||!window.SGSV.outils||typeof VIEWS==='undefined'||!VIEWS.coco) return;
const {monter,tete,kpi,btn,menuSous,E,pl,trouve,moT,css}=SGSV.outils;
const CSS=`
.sgcc-lt td.note{max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgcc-lt td.pos{color:var(--s-rouge)}
.sgcc-lt td.neg{color:#4E6B0F}
.sgcc-kp .v.pos{color:var(--s-rouge)}
`;
const cssC=()=>{ css(); if(!document.getElementById('sgcc-css')){ const s=document.createElement('style'); s.id='sgcc-css'; s.textContent=CSS; document.head.appendChild(s); } };
const ecrit=()=>{ try{ return !!sgDroit('chantier','ecriture'); }catch(_){ return true; } };
const prj=d=>DS.get('project',d.PROJECT_ID)||{};
const BESOIN=['costcontrol','costcontroldocument','project'];
const ETATS=typeof CC_STATE!=='undefined'?CC_STATE:{0:'Provisoire',1:'En cours',2:'Etat intermédiaire',3:'Terminé'};
/* totaux d'un contrôle des coûts (ccCalc du moteur), gardés tant que son contenu ne change pas */
const CACHE=new WeakMap();
const totaux=d=>{ const C=DS.get('costcontrol',d.ID); if(!C) return null; if(CACHE.has(C)) return CACHE.get(C); let G=null; try{ G=ccCalc(C).G||null; }catch(e){ console.error(e); } CACHE.set(C,G); return G; };
const z=v=>Math.abs(+v)<0.005?0:+v;   /* reste flottant de ccCalc (-5e-12) : jamais « -0.00 » (relecture du 10.11.2026) */
const mt=v=>v==null||!isFinite(+v)?'—':num(z(v));
const signe=v=>v==null||!isFinite(+v)?'—':(+v>0.005?'+':'')+num(z(v));
const cls=v=>v==null||!isFinite(+v)?'':+v>0.005?'pos':+v<-0.005?'neg':'';
/* retour à l'écran d'où le contrôle des coûts a été ouvert (page du projet, liste…), comme les devis */
const SGCC=window.SGCC={retour:null};
{ const o0=ccOpen; ccOpen=function(id){ if(typeof VIEW!=='undefined'&&VIEW&&!(VIEW.id==='coco'&&CCV.open)) SGCC.retour={view:VIEW.id,arg:VIEW.arg}; return o0.apply(this,arguments); }; }
{ const g0=go; go=function(id,arg){ if(id==='coco'&&arg==null&&!CCV.open&&SGCC.retour&&typeof VIEW!=='undefined'&&VIEW&&VIEW.id==='coco'){ const r=SGCC.retour; SGCC.retour=null; if(r.view&&r.view!=='coco') return g0.call(this,r.view,r.arg); } return g0.apply(this,arguments); }; }
const ouvrir=d=>{ CCV.g.sel=String(d.PROJECT_ID); ccOpen(d.ID); };
const supprimer=async d=>{ if(d&&await confirmDlg('Supprimer le contrôle des coûts « '+(d.VERSION||'(sans titre)')+' » ?','Supprimer')) DS.save('costcontroldocument',{...d,ISMARKEDASDELETED:1}); };
/* colonnes de la copie et de l'export : celles du tableau */
const colsListe=G=>[...(G?[{k:'pn',t:'N° d’affaire',f:d=>E(prj(d).NUMBER||'')}]:[]),{k:'VERSION',t:'Variante'},{k:'VERSIONNUMBER',t:'N°'},{k:'st',t:'Statut',f:d=>E(ETATS[d.STATECODE]||'')},{k:'NOTE',t:'Remarque'},
  {k:'cp',t:'Coût probable TTC',f:d=>{ const g=totaux(d); return g?E(num(z(g.coutProbable))):''; }},{k:'ec',t:'État du coût TTC',f:d=>{ const g=totaux(d); return g?E(num(z(g.etatCout))):''; }},{k:'dt',t:'Modifié',f:d=>E(dfr(d.CHANGEDDATE))},{k:'USERID',t:'Par'}];
const COCO={
  rendre(I){ cssC(); const p=I.p, u=I.u, G=!!p.GLOBAL, ec=ecrit();
    const tous=(G?DS.all('costcontroldocument'):DS.by('costcontroldocument','PROJECT_ID',p.ID)).filter(d=>!+d.ISMARKEDASDELETED&&(!G||!u.mine||d.USERID===ME.id));
    const vivant=G?DS.all('costcontroldocument').filter(d=>!+d.ISMARKEDASDELETED):tous, parSt=[...new Set(tous.map(d=>+d.STATECODE||0))].sort();
    if(u.statut!=null&&!parSt.includes(u.statut)) u.statut=null;   /* statut disparu : son filtre ne reste pas actif */
    const st=u.statut??null, recent=(a,b)=>cmp(b.CHANGEDDATE,a.CHANGEDDATE)||(+b.VERSIONNUMBER||0)-(+a.VERSIONNUMBER||0)||(+b.ID-+a.ID);
    const R=tous.filter(d=>(st==null||+d.STATECODE===st)&&trouve(u.q,d.VERSION,d.NOTE,d.USERID,d.VERSIONNUMBER,ETATS[d.STATECODE],G?prj(d).NUMBER:'',G?prj(d).TITLE:'')).sort(recent); I.R=R;
    const nE=vivant.filter(d=>+d.STATECODE===1).length, dern=vivant.slice().sort(recent)[0]||null, ref=vivant.filter(d=>+d.STATECODE===1).sort(recent)[0]||dern, gR=!G&&ref?totaux(ref):null, mo=moT(p);
    const acts=(ec?btn('new','Nouveau contrôle des coûts','plus',1):'')+'<button class="nx-btn" data-a="menu" title="Autres actions" aria-label="Autres actions">⋯</button>';
    const teteP=G?tete('CC','Contrôles des coûts','Chantier',pl(vivant.length,'contrôle des coûts','contrôles des coûts')+' · tous les projets',acts)
      :tete(p.NUMBER||'','Contrôles des coûts',p.TITLE||'',[mo?'Maître de l’ouvrage : '+mo:'',pl(vivant.length,'contrôle des coûts','contrôles des coûts')].filter(Boolean).join(' · '),acts);
    if(!vivant.length) return '<div class="sgsv">'+teteP+'<div class="sgsv-vide"><b>'+(G?'Aucun contrôle des coûts.':'Aucun contrôle des coûts pour ce projet.')+'</b><br>Le contrôle des coûts suit l’ouvrage pendant le chantier : devis général révisé, contrats, mutations, paiements et coût probable par CFC.'+(ec?'<div class="acts">'+btn('new','Nouveau contrôle des coûts','plus',1)+'</div>':'')+'</div></div>';
    return '<div class="sgsv">'+teteP
      +'<div class="nx-kpis sgsv-kp sgcc-kp">'+kpi('Contrôles des coûts',String(vivant.length),G?'tous les projets':'variantes du projet')+kpi('En cours',String(nE),'')
      +(G?kpi('Projets',String(new Set(vivant.map(d=>d.PROJECT_ID)).size),'avec un contrôle des coûts')
        :kpi('Coût probable',gR?mt(gR.coutProbable)+'<small>CHF TTC</small>':'—',ref?E(ref.VERSION||'(sans titre)'):'','',ref&&+ref.STATECODE===1?'Contrôle des coûts en cours le plus récent':'Contrôle des coûts le plus récent')
         +kpi('État du coût',gR?signe(gR.etatCout)+'<small>CHF TTC</small>':'—',gR?(+gR.etatCout>0.005?'au-dessus du devis général révisé':+gR.etatCout<-0.005?'sous le devis général révisé':'égal au devis général révisé'):'',gR?cls(gR.etatCout):'','Coût probable moins devis général révisé'))
      +kpi('Dernière modification',dern&&dern.CHANGEDDATE?dfr(dern.CHANGEDDATE):'—',dern&&dern.USERID?'par '+E(dern.USERID):'')+'</div>'
      +'<div class="sgsv-fil">'+(G?[['0','Tous'],['1','Mes contrôles']].map(([v,t])=>'<button data-a="mine" data-v="'+v+'" class="'+((+v===1)===!!u.mine?'on':'')+'">'+t+'</button>').join('')+'<span style="width:10px"></span>':'')
      +(parSt.length>1?[['','Tous les statuts'],...parSt.map(c=>[c,ETATS[c]||String(c)])].map(([c,t])=>{ const v=c===''?null:+c; return '<button data-a="statut" data-c="'+c+'" class="'+(v===st?'on':'')+'" aria-pressed="'+(v===st)+'">'+E(t)+'</button>'; }).join(''):'')
      +'<span class="dr"><input class="inp" data-q type="search" style="width:240px" placeholder="Rechercher un contrôle des coûts" aria-label="Rechercher un contrôle des coûts" value="'+E(u.q||'')+'"></span></div>'
      +(R.length?'<table class="nx-tbl sgsv-tb sgcc-lt"><thead><tr>'+(G?'<th>Projet</th>':'')+'<th>Variante</th><th class="r">N°</th><th>Statut</th><th>Remarque</th><th class="r">Coût probable TTC</th><th class="r">État du coût TTC</th><th>Modifié</th><th>Par</th></tr></thead><tbody>'
        +R.map(d=>{ const g=totaux(d), nt=d.NOTE||''; return '<tr data-a="open" data-d="'+E(d.ID)+'">'+(G?'<td class="nw" title="'+E(prj(d).TITLE||'')+'">'+E(prj(d).NUMBER||'')+'</td>':'')
          +'<td><b>'+E(d.VERSION||'(sans titre)')+'</b></td><td class="r">'+E(d.VERSIONNUMBER??'')+'</td><td class="nw">'+E(ETATS[d.STATECODE]||'')+'</td><td class="note" title="'+E(nt)+'">'+E(nt)+'</td>'
          +'<td class="r nw">'+(g?E(mt(g.coutProbable)):'—')+'</td><td class="r nw '+(g?cls(g.etatCout):'')+'" title="Coût probable moins devis général révisé">'+(g?E(signe(g.etatCout)):'—')+'</td>'
          +'<td class="nw">'+E(dfr(d.CHANGEDDATE))+'</td><td class="nw">'+E(d.USERID||'')+'</td></tr>'; }).join('')+'</tbody></table>'
        :'<p class="sgsv-rien">Aucun contrôle des coûts trouvé.</p>')+'</div>'; },
  action(I,a,t,e){ const p=I.p, u=I.u, d=t.dataset.d?DS.get('costcontroldocument',t.dataset.d):null;
    if(a==='new'){ if(!ecrit()) return; if(p.GLOBAL) pickProject('Choix de l’affaire',q=>ccEditDoc(q)); else ccEditDoc(p); }
    else if(a==='open'){ if(d&&!(e&&e.detail>1)) ouvrir(d); }   /* le 2e clic d'un double-clic d'habitude est ignoré */
    else if(a==='mine'){ u.mine=t.dataset.v==='1'; u.statut=null; I.dessiner(); }
    else if(a==='statut'){ u.statut=t.dataset.c===''?null:+t.dataset.c; I.dessiner(); }
    else if(a==='menu'){ const g=()=>({cols:colsListe(!!p.GLOBAL),view:I.R||[]});
      menuSous(t,[{t:'Copier le tableau',fn:()=>copyTable(g())},{t:'Exporter le tableau dans un fichier CSV …',fn:()=>csvTable(g(),'Controles_des_couts')}]); } },
  ctx(I,t,e){ if(t.dataset.a!=='open') return false; const d=DS.get('costcontroldocument',t.dataset.d); if(!d) return false; const ec=ecrit();
    sgMenuAt(e.clientX,e.clientY,[{t:'Ouvrir le contrôle des coûts',fn:()=>ouvrir(d)},...(ec?[{t:'Modifier l’en-tête…',fn:()=>ccEditDoc(prj(d),d)},{t:'Dupliquer (état intermédiaire)',fn:()=>ccDuplicate(d)},'-',{t:'Supprimer…',danger:true,fn:()=>supprimer(d)}]:[])]); return true; } };
ccDomain=function(C,top,pane,p){ monter(C,p,'coco',BESOIN,COCO); };
{ const V=VIEWS.coco, r0=V.render, f0=V.refresh;
  V.render=function(m,arg){ if(CCV.open||!DS.loaded.has('costcontrol')) return r0.call(this,m,arg);   /* costcontroldocument : chargée par monter (DS.need), même vide (relecture du 10.11.2026) */
    const pa=arg&&arg.project?DS.get('project',arg.project):null; if(pa) CCV.g.sel=String(pa.ID);
    monter(m,pa||{ID:'tous',GLOBAL:1,NUMBER:'',TITLE:''},pa?'coco':'cocog',BESOIN,COCO); };
  V.refresh=function(ts){ if(CCV.open) return f0.call(this,ts); };   /* liste : redessinée par monter (DS.on) */ }
/* ═══ CONTRÔLE DES COÛTS OUVERT AU GRAPHISME DU DEVIS (10.11.2026 ; Paulo : « modifier la présentation comme pour le devis, ajouter les documents dans la barre
   du haut, etc. ») ═══
   ccEditor du moteur enveloppé : ses éléments sont déplacés tels quels (gestionnaires, calculs, fenêtres et enregistrement inchangés). Bandeau jaune (numéro,
   statut, variante, désignation, maître de l'ouvrage, version, dernière modification ; « ‹ Contrôles du projet » = page du projet ▸ Contrôle des coûts, comme les
   devis), chiffres (devis général, mutations, DG révisé, contrats + avenants, paiements, coût probable, état du coût), onglets = les sections du moteur (le menu de
   gauche est masqué, ses éléments servent toujours) puis Documents : fichiers déposés et documents imprimés de chaque section, choisis sous les onglets. Barre en
   texte réduite : Nouvelle écriture, Présentation, CFC Tout · 3 · 2 · 1 (remplace « N'afficher que les positions de 1 à 3 chiffres » ; copie, CSV et impression
   ne prennent que les lignes affichées), Imprimer (tableau, documents de la section), Paramètres, Fonctions (éditer, supprimer, copier, exporter, enregistrer),
   plein écran. Tableau au graphisme du devis (CFC à 1 chiffre sur trame bleu nuit pâle, CFC et désignation fixes au défilement horizontal, total encadré) ;
   clic droit sur une ligne : éditer / supprimer l'écriture, nouvelle écriture ; ↑ ↓ Entrée. DeltaSub.html seul garde l'écran d'origine. Classes sgce-*. */
const ED_CSS=`
.sgce{flex:1 1 auto;display:flex;flex-direction:column;min-height:0;height:100%;overflow:hidden;background:#fff}
.sgce.sgce-plein{position:fixed;inset:0;z-index:800;height:auto;padding-top:8px}
.sgce.sgce-plein>.sgce-tete{display:none}
.sgce.sgce-plein .sgce-kp .nx-kpi{padding:4px 12px 6px 0}
.sgce.sgce-plein .sgce-kp .nx-kpi .v{font-size:clamp(11px,calc(2.1cqi - 2px),17px);margin-top:2px}
.sgce.sgce-plein .sgce-kp .nx-kpi .s{display:none}
.sgce-tete{flex:none;padding:8px 24px 0}
.sgce-tete .sgfh-tete{margin:0;padding:10px 18px}
.sgce-tete .sgfh-ini{font-size:28px;white-space:nowrap}
.sgce-tete .sgfh-nm{min-width:0}
.sgce-tete .sgfh-nm h2{font-size:20px}
.sgce-kp{flex:none;margin:0 24px;grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);border-top:0;container-type:inline-size}
.sgce-kp .nx-kpi{padding:10px 12px 10px 0;margin-right:12px;min-width:0}
.sgce-kp .nx-kpi .v{font-size:clamp(11px,calc(2.1cqi - 2px),22px);margin-top:5px;white-space:nowrap;font-variant-numeric:tabular-nums}
.sgce-kp .nx-kpi .l,.sgce-kp .nx-kpi .s{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgce-kp .nx-kpi .s{margin-top:3px}
.sgce-kp .nx-kpi .v.pos{color:var(--s-rouge)}
.sgce-kp .nx-kpi .v.neg{color:#4E6B0F}
.sgce-ong{flex:none;margin:0 24px;border-bottom:1px solid var(--s-filet)}
.sgce-ong .sg-onglets{margin:0;border:0;gap:0 20px;flex-wrap:wrap;overflow:visible}
.sgce-ong .sg-onglets button{font-size:13.5px}
.sgce-osep{flex:none;align-self:center;width:1px;height:16px;background:var(--s-filet)}
.sgce-bar{flex:none;margin:0 24px;padding:4px 0;min-height:40px;height:auto;gap:2px;flex-wrap:wrap;border:0;background:transparent;align-items:center}
.sgce-bar .ib{border:0!important;background:transparent!important;box-shadow:none!important;border-radius:0!important;height:32px;padding:0 9px;font-size:12.5px;font-weight:700;color:var(--s-noir)}
.sgce-bar .ib:first-child{padding-left:0}
.sgce-bar .ib:hover{background:var(--s-jaune3)!important}
.sgce-bar .ib.on{box-shadow:inset 0 -2px 0 var(--s-nuit)!important}
.sgce-bar .ib:disabled{color:#b9b9b6}
.sgce-bar .ib .lb{display:inline!important}
.sgce-sep{flex:none;width:1px;height:18px;background:var(--s-filet);margin:0 6px}
.sgce-fin{flex:1 1 auto}
.sgce-niv{flex:none;display:flex;align-items:center;gap:12px;font-size:12px;color:var(--s-gris);margin:0 6px}
.sgce-niv button{border:0;background:none;padding:2px 0 3px;font:inherit;font-size:12.5px;color:var(--s-gris);cursor:pointer;white-space:nowrap;font-variant-numeric:tabular-nums}
.sgce-niv button:hover{color:var(--s-noir)}
.sgce-niv button.on{color:var(--s-noir);font-weight:700;box-shadow:inset 0 -2px 0 var(--s-nuit)}
.sgce-dsub{flex:none;margin:0 24px;padding:9px 0 8px;flex-wrap:wrap;gap:6px 16px}
.sgce-dsub .sgce-dt{color:var(--s-gris)}
.sgce-leg{flex:none;display:flex;align-items:center;gap:12px;font-size:11.5px;font-style:italic;margin:0 12px 0 6px;white-space:nowrap}
.sgce.dg .sgce-bar .sgce-new,.sgce.dg .sgce-bar .sgce-sep.nw,.sgce.dg .sgce-bar .sgce-fon,.sgce.dg .sgce-bar .sgce-par{display:none!important}   /* Devis général : base du contrôle, affichée seulement — ni « Nouvelle écriture », ni « Paramètres », ni « Fonctions » (Paulo, 11.11.2026) */
.sgce-leg button{border:0;background:none;padding:3px 0;font:inherit;font-size:11.5px;font-style:italic;cursor:pointer;white-space:nowrap}
.sgce-leg button:hover{text-decoration:underline}
.sgce-bar .sgce-x{display:none}
.sgce:not(.cc) .sgce-bar .sgce-niv,.sgce:not(.cc) .sgce-ong>.sgce-niv,.sgce:not(.cc) .sgce-sep.n,.sgce:not(.det) .sgce-leg{display:none}
.sgce-ong{display:flex;align-items:center;gap:12px}
.sgce-ong>.sg-onglets{flex:1 1 auto;min-width:0}
.sgce-ong>.sgce-niv{flex:none;margin:0 0 0 auto}   /* CFC Tout · 3 · 2 · 1 à droite des onglets, comme le devis (11.11.2026) */
.sgce-dgv.sgde{display:block;height:auto;overflow:visible;flex:none;background:transparent}
.sgce-dgv>.pane{overflow:visible;height:auto}
.sgce.docs>.sgce-bar,.sgce:not(.docs)>.sgce-dsub{display:none}
.sgce-dsub .sgce-pl{margin-left:auto}
.sgce>.cols{flex:1 1 auto;min-height:0;padding:0 24px 12px;gap:0}
.sgce>.cols>.col:first-child{display:none!important}
.sgce>.cols>.col{border:0;background:#fff;box-shadow:none;min-width:0}
.sgce .pane{border:0;background:#fff;box-shadow:none;outline:none}
.sgce .pane>.ph2{border:0;background:transparent;padding-left:0;padding-right:0}
.sgce table.g thead th{background:#fff!important;border:0!important;border-bottom:2px solid var(--s-noir)!important;font-size:11px;font-weight:700;color:var(--s-gris)!important;padding:8px!important;height:auto!important;white-space:normal;line-height:1.25;vertical-align:bottom}
.sgce table.g tbody td{border:0!important;border-bottom:1px solid var(--s-filet)!important;height:30px;padding:0 8px!important;font-size:12.5px}
.sgce table.g tbody tr:hover td{background:var(--s-jaune3)!important}
.sgce table.g tbody tr.on td{background:var(--s-jaune2)!important;color:var(--s-noir)!important}
.sgce-t th:first-child,.sgce-t td:first-child{position:sticky;left:0;z-index:1;font-variant-numeric:tabular-nums}
.sgce-t th:nth-child(2),.sgce-t td:nth-child(2){position:sticky;left:var(--sgce-w1,62px);z-index:1}
.sgce table.g.sgce-t tbody tr td:nth-child(-n+2){background:#fff}
.sgce-t thead th:nth-child(-n+2){z-index:3}
.sgce table.g.sgce-t tbody tr.sgce-n1:nth-child(n) td:nth-child(n){background:var(--s-nuit3)}
.sgce-t tr.sgce-n1 td{height:32px}
.sgce-t tr.sgce-ent td{font-size:12px}
.sgce-t tr.sgce-det td{height:24px;font-size:11.5px}
.sgce table.g.sgce-t tbody tr.sgce-tot td{border-top:2px solid var(--s-noir)!important;border-bottom:0!important;height:34px;font-weight:700}
.sgce-t tr.sgce-cache{display:none}
.sgce .pane div[style*="border-radius: 6px"]{border:0!important;border-top:2px solid var(--s-noir)!important;border-radius:0!important;background:#fff!important;padding:0 0 10px!important}
.sgce.docs .pane>div[style*="max-width: 780px"]{max-width:980px!important;padding:14px 0!important}
.sgce-dc{display:grid;grid-template-columns:minmax(180px,1fr) auto;gap:6px 18px;align-items:center;padding:10px 0;border-bottom:1px solid var(--s-filet);margin-bottom:10px}
.sgce-dc .t b{display:block;font-size:13.5px}
.sgce-dc .t span{display:block;font-size:12px;color:var(--s-gris);margin-top:1px}
.sgce-dc .a{display:flex;flex-wrap:wrap;gap:2px;align-items:center;justify-content:flex-end}
.sgce-dc .a .ib{border:0;background:transparent;height:30px;padding:0 9px;font-size:12.5px;font-weight:700;color:var(--s-noir);cursor:pointer}
.sgce-dc .a .ib:hover{background:var(--s-jaune3)}
.sgce-dc .a .ib:disabled{color:#b9b9b6;cursor:default;background:transparent}
.sgce-dpdf{flex-wrap:wrap}
.sgce-dpdf>span:first-child{flex:1 1 100%!important;font-size:12px;color:var(--s-gris)!important}
.sgce-x2{display:none!important}
@media (max-height:860px){.sgce-tete .sgfh-meta{display:none}.sgce-tete .sgfh-tete{padding:6px 14px}.sgce-tete .sgfh-ini{font-size:22px}.sgce-tete .sgfh-nm h2{font-size:17px}.sgce-tete .sgfh-nm .lb{margin:0}.sgce-kp .nx-kpi{padding:6px 12px 6px 0}.sgce-kp .nx-kpi .v{font-size:clamp(11px,calc(2.1cqi - 2px),18px);margin-top:3px}.sgce-kp .nx-kpi .s{display:none}}
`;
const cssE=()=>{ if(!document.getElementById('sgce-css')){ const s=document.createElement('style'); s.id='sgce-css'; s.textContent=ED_CSS; document.head.appendChild(s); } };
const SECS=CC_SECS.filter(s=>s!=='DOCUMENTS').sort((a,b)=>(b==='DEVIS GENERAL')-(a==='DEVIS GENERAL')), SLIB=s=>(typeof CC_SEC_LIB!=='undefined'&&CC_SEC_LIB[s])||s;
const estCC=()=>!CCV.docs&&(CCV.sec==='CONTRÔLE DU COÛT'||CCV.sec==='DEVIS GENERAL');
/* ═══ Onglet Devis général ▸ Imprimer ▸ « Devis général (PDF) » (11.11.2026, Paulo : « identique à devis général avec les mêmes options, vertical, etc. et calcul ») :
   le contrôle des coûts ne garde que les montants du devis attribué ; le document est donc celui du devis général d'origine — même fenêtre, mêmes réglages (format,
   descriptif, lignes de calcul, montants, sauts de page…) et même enregistrement des réglages que Descriptifs & devis ▸ Documents ▸ Devis général (sg3_devis.js : ch02cOpen
   ligne 0 → dgOuvrir). Devis d'origine = celui noté à l'attribution (C.devisSourceId, ccAssignDG depuis le 11.11.2026), sinon le devis général du projet dont le total TTC
   est celui du contrôle (validé et le plus récent d'abord). Contexte de devis réduit (ch02aCtx : E, en-tête, projet, enregistrement ch02aSave) — rien n'est écrit sans
   changement de réglage. */
const devisSource=(C,pid)=>{ const ok=id=>id!=null&&DS.get('costestimate',id)&&!(DS.get('costestimatedocument',id)||{}).ISMARKEDASDELETED; if(ok(C.devisSourceId)) return C.devisSourceId;
  const tot=ccCalc(C).G.dg||0, L=DS.by('costestimatedocument','PROJECT_ID',pid).filter(d=>ok(d.ID)).map(d=>({d,t:dvCompute(DS.get('costestimate',d.ID)).T.ttc}));
  const M=L.filter(x=>Math.abs(x.t-tot)<1).sort((a,b)=>((b.d.STATECODE===2)-(a.d.STATECODE===2))||String(b.d.CHANGEDDATE||'').localeCompare(String(a.d.CHANGEDDATE||'')));
  return M.length?M[0].d.ID:null; };
const DGV=(()=>{ try{ return JSON.parse(localStorage.getItem('sg3_coco_dgv'))||{}; }catch(_){ return {}; } })(), dgvSave=()=>{ try{ localStorage.setItem('sg3_coco_dgv',JSON.stringify(DGV)); }catch(_){} };
let DGX=null;   /* tableau de l'onglet Devis général (contexte réduit du devis d'origine) */
async function dgDuDevis(d){ try{ await DS.need(['costestimate','costestimatedocument','costestimatedpdoc','subproject']); }catch(_){}
  const C=CCV.cur&&CCV.cur.C, p=DS.get('project',d&&d.PROJECT_ID); if(!C||!p) return;
  const sid=devisSource(C,p.ID); if(sid==null){ toast('Aucun devis général ne correspond au devis de ce contrôle des coûts : attribuez le devis général validé (onglet Contrôle du coût ▸ Paramètres ▸ Attribuer le devis général validé).',true); return; }
  if(typeof ch02aCtx!=='function'||typeof ch02cOpen!=='function'||typeof ch02aSave!=='function'){ toast('Document du devis indisponible.',true); return; }
  const X=ch02aCtx({id:sid,doc:DS.get('costestimatedocument',sid),p,E:ch02aClone(DS.get('costestimate',sid)),st:{},dirty:false,draw:()=>{},totals:()=>{},drawCat:()=>{}});
  X.touch=()=>{ X.dirty=true; ch02aSave(X).catch(()=>{}); }; X.sgde={ong:'docs',cfc:false,niv:0,vu:null,cc:true,lb:'Contrôle des coûts · Devis général'};
  try{ await ch02cOpen(X,0); }catch(e){ console.error(e); toast('Document impossible à préparer : '+e.message,true); } }
const ED=SGCC.ed={niv:(()=>{ try{ const v=+localStorage.getItem('sg3_coco_niv'); return [1,2,3].includes(v)?v:0; }catch(_){ return 0; } })(),sub:'fichiers',plein:false,box:null};
/* ligne masquée par le choix du niveau de CFC (k = « cfc|entreprise[|détail] » des sections Contrôle du coût et Devis général ; total toujours affiché) */
const masquee=k=>{ if(!ED.niv||k==null||k==='TOTAL') return false; const c=String(k).split('|')[0]; return !!c&&cfcLevel(c)>ED.niv; };
/* copie, CSV et impression du tableau : seulement les lignes affichées */
const filtrer=fn=>()=>{ if(!estCC()||!ED.niv) return fn(); const t0=tableText; tableText=function(g,sep){ return t0.call(this,Object.assign({},g,{view:(g.view||[]).filter(r=>!masquee(r&&r.k))}),sep); }; try{ return fn(); } finally{ tableText=t0; } };
const lbl=(b,t)=>{ const s=b.querySelector('.lb'); if(s) s.textContent=t; else if(b.querySelector('.dd')) b.querySelector('.dd').insertAdjacentHTML('beforebegin','<span class="lb">'+E(t)+'</span>'); else b.insertAdjacentHTML('beforeend','<span class="lb">'+E(t)+'</span>'); return b; };
const pc=(a,b)=>b?(Math.round(a/b*1000)/10).toFixed(1)+' %':'';
addEventListener('keydown',e=>{ const B=ED.box; if(e.key!=='Escape'||!ED.plein||!B||!B.isConnected||e.defaultPrevented||document.querySelector('.ov,.sg-visu,.menu')) return; const a=document.activeElement;
  if(a&&(a.isContentEditable||/INPUT|TEXTAREA|SELECT/.test(a.tagName))) return; e.preventDefault(); B._plein(false); },true);   /* capture : une fenêtre ouverte se ferme d'abord, sans quitter le plein écran */
function habillerEd(m,id){ cssC(); cssE();
  const kids=[...m.children], bar=kids.find(x=>x.classList&&x.classList.contains('ph2')), body=kids.find(x=>x.classList&&x.classList.contains('cols'));
  if(!bar||!body||body.children.length<2) return;
  const side=body.children[0], pane=body.children[1].querySelector(':scope>.pane'); if(!pane) return;
  const B=[...bar.querySelectorAll(':scope>button.ib')], bt=t=>B.find(b=>b._sgB&&b._sgB.t===t);
  const bNew=bt('Nouvelle écriture'), bEd=bt('Editer l’écriture'), bDel=bt('Supprimer l’écriture'), bPres=bt('Présentation'), bPar=bt('Paramètres'), bFon=bt('Fonctions'), bSave=bt('Enregistrer');
  if(!bNew||!bEd||!bDel||!bPres||!bPar||!bFon||!bSave||!bNew._sgB.menu||!bPres._sgB.menu||!bFon._sgB.menu) return;   /* barre inattendue : l'écran du moteur reste tel quel */
  const its=[...side.children], secIt={}, docIt={};
  CC_SECS.forEach((s,i)=>{ if(its[i]&&its[i].textContent.trim()===s) secIt[s]=its[i]; });
  SECS.forEach((s,j)=>{ const it=its[CC_SECS.length+j]; if(it&&it.textContent.trim()===SLIB(s)) docIt[s]=it; });
  if(CC_SECS.some(s=>!secIt[s])) return;
  CCV.only3=false;   /* remplacé par le choix CFC Tout · 3 · 2 · 1 */
  const el=(t,c,x)=>{ const e=document.createElement(t); if(c) e.className=c; if(x!=null) e.innerHTML=x; return e; };
  const box=el('div','sgce'), hd=el('div','sgce-tete'), kp=el('div','nx-kpis sgce-kp'), ong=el('div','sgce-ong'), ongL=el('div','sg-onglets'), bar2=el('div','ph2 sgce-bar'), dsub=el('div','sgce-niv sgce-dsub'), niv=el('div','sgce-niv');
  const sep=c=>el('span','sgce-sep'+(c?' '+c:'')), fin=el('span','sgce-fin');
  const doc=()=>DS.get('costcontroldocument',id)||{};
  const fermer=()=>{ const pid=doc().PROJECT_ID; CCV.open=null; if(ED.plein) box._plein(false);
    if(pid!=null&&typeof NX_VIEW!=='undefined'&&NX_VIEW['nx-pdom']&&(typeof sgProjetPermis!=='function'||sgProjetPermis(pid))){ SGCC.retour=null; go('nx-pdom',pid+'|Contrôle des coûts'); } else go('coco'); };
  /* barre : éléments du moteur gardés (Nouvelle écriture, Paramètres) ; Présentation sans « 1 à 3 chiffres » ; Imprimer et Fonctions regroupés */
  const mPres=bPres._sgB.menu, mFon=bFon._sgB.menu;
  const fon=t=>(mFon()||[]).filter(x=>x&&x.t&&t.test(x.t)).map(x=>Object.assign({},x,{fn:filtrer(x.fn)}));
  lbl(bNew,'Nouvelle écriture'); lbl(bPar,'Paramètres');
  const bPresN=lbl(ibtn({i:'list',t:'Présentation',menu:()=>!CCV.docs&&CCV.sec==='DEVIS GENERAL'&&DGX?dgPresMenu():(mPres()||[]).filter(x=>!(x&&x.t&&/1 à 3 chiffres/.test(x.t)))}),'Présentation');
  const bImp=lbl(ibtn({i:'print',t:'Imprimer',menu:()=>{ const s=CCV.docs?CCV.sec:CCV.sec==='DOCUMENTS'?null:CCV.sec;
    if(!CCV.docs&&CCV.sec==='DEVIS GENERAL') return [{t:'Devis général (PDF)',fn:()=>dgDuDevis(doc())}];   /* onglet Devis général : seulement le document du devis (11.11.2026) */
    const imp=fon(/^Imprimer/);
    return [...imp,...(s&&docIt[s]?['-',{t:'Documents · '+SLIB(s),fn:()=>docs(s)}]:[]),'-',{t:'Fichiers déposés',fn:()=>docs('fichiers')}]; }}),'Imprimer');
  const bFonN=lbl(ibtn({i:'gear',t:'Fonctions',menu:()=>[{t:'Éditer l’écriture',fn:()=>bEd.click()},{t:'Supprimer l’écriture…',fn:()=>bDel.click()},'-',...fon(/^(Copier|Exporter)/),'-',{t:'Enregistrer',fn:()=>bSave.click()}]}),'Fonctions');
  const bPlein=ibtn({i:'plein',t:'Plein écran',fn:()=>box._plein(!ED.plein)}); bPlein.classList.add('sgce-pl');
  box._plein=v=>{ ED.plein=!!v; ED.box=box; box.classList.toggle('sgce-plein',ED.plein); bPlein.classList.toggle('on',ED.plein); const s=bPlein.querySelector('svg'); if(s&&typeof nxSvg==='function') s.outerHTML=nxSvg(ED.plein?'pleinq':'plein'); bPlein.title=ED.plein?'Quitter le plein écran (Échap)':'Plein écran'; bPlein.setAttribute('aria-label',bPlein.title); };
  /* légende des couleurs des écritures : couleurs du document (Présentation ▸ Affichage ▸ Couleurs des écritures, 11.11.2026) ; un clic ouvre la palette sur l'élément */
  const leg=el('span','sgce-leg'); ED.leg=leg;
  ED.majLeg=()=>{ const K=typeof ccCouleurs==='function'?ccCouleurs(CCV.cur&&CCV.cur.C):{mut:'#993300',ctr:'#FF6633',pay:'#003366',payh:'#003366',prov:'#555555'};
    leg.innerHTML=[['mut','Mutations'],['ctr','Contrats'],['pay','Paiements sur contrat'],['payh','Paiements hors contrat'],['prov','Provisions, coût probable']].map(([k,t])=>'<button type="button" data-k="'+k+'" style="color:'+K[k]+'" title="Changer la couleur : '+t.toLowerCase()+'">'+t+'</button>').join(''); };
  ED.majLeg(); leg.onclick=e=>{ const b=e.target.closest('[data-k]'); if(b&&typeof CCV.affichage==='function') CCV.affichage('couleurs',b.dataset.k); };
  if(!SGCC._legEv){ SGCC._legEv=1; document.addEventListener('cc-affichage',()=>{ if(ED.majLeg) ED.majLeg(); }); }
  const autres=[...bar.children].filter(x=>!B.includes(x)&&x.tagName!=='B');   /* éléments ajoutés à la barre par d'autres blocs : gardés à la fin */
  bNew.classList.add('sgce-new'); bFonN.classList.add('sgce-fon'); bPar.classList.add('sgce-par'); bar2.append(bNew,sep('nw'),bPresN,sep(),bImp,fin,leg,...autres,bPar,bFonN,bPlein);
  /* onglets : les sections, puis Documents (fichiers déposés et documents de chaque section) */
  const docs=k=>{ ED.sub=k; if(k==='fichiers') secIt.DOCUMENTS.click(); else if(docIt[k]) docIt[k].click(); maj(); };
  ongL.onclick=e=>{ const b=e.target.closest('[data-s]'); if(!b) return; if(b.dataset.s==='DOCUMENTS') docs(ED.sub||'fichiers'); else { secIt[b.dataset.s].click(); maj(); } };
  dsub.onclick=e=>{ const b=e.target.closest('[data-d]'); if(b) docs(b.dataset.d); };
  niv.onclick=e=>{ const b=e.target.closest('[data-v]'); if(!b) return; ED.niv=+b.dataset.v; try{ localStorage.setItem('sg3_coco_niv',String(ED.niv)); }catch(_){} maj(); deco(); };
  const maj=()=>{ const actif=CCV.docs||CCV.sec==='DOCUMENTS'?'DOCUMENTS':CCV.sec, sub=CCV.docs?CCV.sec:'fichiers'; if(actif==='DOCUMENTS') ED.sub=sub;
    ongL.innerHTML=SECS.map(s=>'<button data-s="'+E(s)+'" class="'+(actif===s?'on':'')+'">'+E(SLIB(s))+'</button>').join('')+'<span class="sgce-osep"></span><button data-s="DOCUMENTS" class="'+(actif==='DOCUMENTS'?'on':'')+'" title="Fichiers déposés et documents de chaque section">Documents</button>';
    dsub.innerHTML='<span class="sgce-dt">Documents</span>'+[['fichiers','Fichiers déposés'],...SECS.filter(s=>docIt[s]).map(s=>[s,SLIB(s)])].map(([k,t])=>'<button data-d="'+E(k)+'" class="'+(sub===k&&actif==='DOCUMENTS'?'on':'')+'">'+E(t)+'</button>').join('');
    niv.innerHTML='<span title="Niveau de CFC affiché">CFC</span>'+[[0,'Tout','Tous les CFC'],[3,'3','CFC de 1 à 3 chiffres'],[2,'2','CFC de 1 et 2 chiffres'],[1,'1','CFC à 1 chiffre']].map(([v,t,ti])=>'<button data-v="'+v+'" title="'+E(ti)+'" aria-label="'+E(ti)+'" class="'+(ED.niv===v?'on':'')+'">'+t+'</button>').join('');
    (actif==='DOCUMENTS'?dsub:bar2).append(bPlein);   /* Documents : la barre d'outils laisse la place au choix des documents, le bouton du plein écran passe à sa droite */
    box.classList.toggle('docs',actif==='DOCUMENTS'); box.classList.toggle('cc',estCC()); box.classList.toggle('det',CCV.sec==='CONTRÔLE DU COÛT'&&!CCV.docs&&!!CCV.det); box.classList.toggle('dg',CCV.sec==='DEVIS GENERAL'&&!CCV.docs); };
  /* bandeau et chiffres, à chaque dessin du moteur */
  hd.onclick=e=>{ if(e.target.closest('[data-a="liste"]')) fermer(); };
  const entete=()=>{ const d=doc(), p=DS.get('project',d.PROJECT_ID)||{}, mo=moT(p), et=ETATS[d.STATECODE]||'', g=totaux(d)||{};
    hd.innerHTML=tete(p.NUMBER||'','Contrôle des coûts'+(et?' · '+et:''),d.VERSION||'(sans titre)',[p.TITLE,mo?'Maître de l’ouvrage : '+mo:'',d.VERSIONNUMBER!=null&&d.VERSIONNUMBER!==''?'version '+d.VERSIONNUMBER:'',d.CHANGEDDATE?'modifié le '+dfr(d.CHANGEDDATE)+(d.USERID?' par '+d.USERID:''):''].filter(Boolean).join(' · '),
      '<button class="nx-btn" data-a="liste" title="Retour aux contrôles des coûts du projet">‹ Contrôles du projet</button>');
    const v=k=>+g[k]||0;
    kp.innerHTML=kpi('Devis général TTC',mt(v('dg')),'','','Devis général attribué au contrôle des coûts, TVA comprise (Paramètres ▸ Attribuer le devis général validé)')
      +kpi('Mutations TTC',signe(v('mutations')),v('dg')&&v('mutations')?pc(v('mutations'),v('dg'))+' du devis général':'','','Transferts, variations et renchérissement')
      +kpi('DG révisé TTC',mt(v('dgRevise')),'','','Devis général révisé : devis général + mutations')
      +kpi('Contrats + avenants TTC',mt(v('contratsAvenants')),v('avenants')?'dont avenants '+mt(v('avenants')):'','','Contrats d’entreprise et avenants, TVA comprise')
      +kpi('Paiements TTC',mt(v('paiements')),v('contratsAvenants')&&v('paiements')?pc(v('paiements'),v('contratsAvenants'))+' des contrats':'','','Paiements sur contrat et hors contrat, TVA comprise')
      +kpi('Coût probable TTC',mt(v('coutProbable')),v('provisions')?'dont provisions '+mt(v('provisions')):'','','Coût final probable de l’ouvrage')
      +kpi('État du coût TTC',signe(v('etatCout')),v('dgRevise')&&v('etatCout')?pc(v('etatCout'),v('dgRevise'))+' du DG révisé':'',cls(v('etatCout')),'Coût probable moins devis général révisé : positif = dépassement (rouge), négatif = économie (vert)');
    if(typeof VIEW==='object'&&VIEW) VIEW.nxTitle=[p.NUMBER,d.VERSION].filter(Boolean).join(' · '); };
  /* tableau : niveaux de CFC (Contrôle du coût, Devis général), lignes d'entreprise et de détail, total, choix du niveau */
  /* ═══ Onglet Devis général = tableau du devis général d'origine, en lecture seule (11.11.2026, Paulo : « ajoute les options d'affichage comme dans devis général :
     calcul, commentaires, etc. ») : le tableau de Descriptifs & devis (ch02aDraw + habillage SGDE.deco : présentations, descriptifs, lignes de calcul « > », niveaux CFC)
     dessiné à partir du devis d'origine (devisSource) dans un contexte réduit — aucune écriture (pas de double-clic de calcul, pas de « montant saisi »). Présentation
     (Standard, colonnes honoraires, toutes les colonnes, avec le calcul de prix, avec le descriptif…), subdivisions et positions sans montant : choix du poste
     (sg3_coco_dgv) ; sans choix, la présentation enregistrée dans le devis. CFC Tout · 3 · 2 · 1 = niveau du devis (ED.niv). Sans devis d'origine : tableau du moteur. */
  const dgVue=()=>{ if(CCV.docs||CCV.sec!=='DEVIS GENERAL'||!window.SGDE||typeof SGDE.deco!=='function'||typeof ch02aDraw!=='function'){ DGX=null; return false; }
    const C=CCV.cur&&CCV.cur.C, d=doc(), p=DS.get('project',d.PROJECT_ID); if(!C||!p){ DGX=null; return false; }
    const sid=devisSource(C,p.ID), E0=sid!=null?DS.get('costestimate',sid):null; if(!E0){ DGX=null; return false; }
    const w=pane.firstElementChild, cle=JSON.stringify(DGV);
    if(w&&w.classList.contains('sgce-dgv')&&DGX&&DGX.E0===E0&&DGX.cle===cle){ DGX.sgde.niv=ED.niv||0; try{ SGDE.deco(DGX); }catch(e){ console.error(e); } return true; }
    const E=ch02aClone(E0), A=(E.reglages||(E.reglages={})).affichage||(E.reglages.affichage={});
    if(DGV.mode!=null){ A.displayMode=DGV.mode; if(DGV.calc) A.sgCalc=true; else delete A.sgCalc; }
    if(+A.displayMode===2) A.displayMode=0;   /* « Avec colonnes honoraires » : pas dans le contrôle des coûts (11.11.2026) → Standard */
    const wrap=el('div','sgde sgce-dgv'), rp=el('div','pane'); wrap.append(rp);
    const X={id:sid,doc:DS.get('costestimatedocument',sid),p,E,E0,cle,st:{sel:null,ouv:!!DGV.ouv,only3:false,empty:DGV.vides!==false},R2:{},rp,filter:null,OUV:()=>dvOuvCodes(E),
      totals:()=>{},dvCalc:()=>{},draw:()=>{},touch:()=>{},sgde:{niv:ED.niv||0,vu:null,cfc:false,ro:true}};
    if(typeof SGDE.cssD==='function') SGDE.cssD();   /* styles du tableau des devis (aussi sans devis ouvert dans la séance) */
    DGX=X; pane.replaceChildren(wrap);
    /* colonnes d'honoraires (% soumis, Montant soumis HT, Définitif) retirées du tableau du contrôle des coûts seulement (Paulo, 11.11.2026) */
    const g0=grid; grid=function(el2,o){ if(el2===rp&&o&&Array.isArray(o.cols)) o.cols=o.cols.filter(c=>!['hp','hon','def'].includes(c.k)); return g0.apply(this,arguments); };
    try{ ch02aDraw(X); SGDE.deco(X); }catch(e){ console.error(e); DGX=null; return false; } finally{ grid=g0; } return true; };
  const dgPresMenu=()=>{ const E=DGX&&DGX.E, m=ch02aMode(E||{}), c4=m===4&&!!(((E||{}).reglages||{}).affichage||{}).sgCalc;
    const poser=(k,calc)=>{ DGV.mode=k; DGV.calc=!!calc; dgvSave(); DGX=null; deco(); };
    return [...CH02A_MODES.filter(([k])=>k!==2).flatMap(([k,t])=>k===4?[{t:'Avec le descriptif et le calcul de prix',chk:c4,fn:()=>poser(4,true)},{t,chk:m===4&&!c4,fn:()=>poser(4,false)}]:[{t,chk:m===k,fn:()=>poser(k,false)}]),'-',
      ...(E&&dvOuvCodes(E).length?[{t:'Afficher les subdivisions',chk:!!DGV.ouv,fn:()=>{ DGV.ouv=!DGV.ouv; dgvSave(); DGX=null; deco(); }}]:[]),
      {t:'Afficher les positions sans montant',chk:DGV.vides!==false,fn:()=>{ DGV.vides=DGV.vides===false; dgvSave(); DGX=null; deco(); }}]; };
  const deco=()=>{ if(dgVue()) return; const t=pane.querySelector(':scope>table.g'); if(!t) return; const cc=estCC(); t.classList.toggle('sgce-t',cc); if(!cc) return;
    t.querySelectorAll('tbody tr[data-k]').forEach(tr=>{ const k=tr.dataset.k, P=k.split('|'), c=P[0], n=c?cfcLevel(c):0, det=P.length>=3, ent=!det&&P[1]!=='-'&&k!=='TOTAL';
      tr.classList.toggle('sgce-tot',k==='TOTAL'); tr.classList.toggle('sgce-det',det); tr.classList.toggle('sgce-ent',ent);
      tr.classList.toggle('sgce-n1',!det&&!ent&&n===1); tr.classList.toggle('sgce-cache',masquee(k)); });
    /* titres des colonnes : « Contrats + avenants TTC » passe à la ligne avant « avenants » (Paulo, 11.11.2026) — espaces insécables avant « + » et avant l'unité
       (HT, TVA, TTC), affichage seulement (copie et CSV gardent les titres) */
    t.querySelectorAll('thead th').forEach(th=>{ if(th._sgceT) return; th._sgceT=1; const w=document.createTreeWalker(th,NodeFilter.SHOW_TEXT); let n;
      while((n=w.nextNode())){ const x=n.textContent.replace(/ \+ /g,'\u00a0+ ').replace(/ (HT|TVA|TTC)\s*$/,'\u00a0$1'); if(x!==n.textContent) n.textContent=x; } });
    const c1=t.querySelector('thead th'); if(c1) t.style.setProperty('--sgce-w1',c1.offsetWidth+'px'); };
  /* Documents d'une section : chaque document (panneau du moteur) en ligne comme l'onglet Documents du devis — titre, état, actions à droite
     (Ouvrir ou Créer le document, Créer le PDF, Renommer, Supprimer le document : celles du menu « Document » du moteur), puis ses fichiers PDF */
  const decoDocs=()=>{ if(!CCV.docs) return; const t0=pane.firstElementChild; if(t0&&/^Documents · /.test(t0.textContent||'')) t0.classList.add('sgce-x2');   /* titre déjà dit par le choix sous les onglets */
    pane.querySelectorAll('div[style*="border-radius: 6px"]').forEach(P=>{ const main=P.querySelector(':scope>div>button.btn'); if(!main||main._sgce) return;
      const menuB=[...P.querySelectorAll('button.ib')].find(b=>b._sgB&&b._sgB.t==='Document'&&b._sgB.menu); if(!menuB) return; main._sgce=1;
      const rows=[...P.children], nameRow=main.parentElement, pdfRow=rows[rows.length-1], lab=rows.find(r=>r!==nameRow&&r.textContent==='Document');
      const titreEl=rows[0]!==nameRow&&rows[0]!==lab&&rows[0]!==pdfRow?rows[0]:null, txt=main.textContent.trim(), cree=!/^«.*»$/.test(txt), nom=txt.replace(/^«|»$/g,'');
      const titre=titreEl?titreEl.textContent.trim():nom, etat=cree?'Document créé'+(titreEl&&nom!==titre?' : '+nom:''):'Pas encore créé', I=menuB._sgB.menu()||[], f=t=>I.find(x=>x&&x.t&&x.t.startsWith(t)), dis=main.disabled;
      const act=(t,ti,x,d)=>{ const b=document.createElement('button'); b.className='ib'; b.textContent=t; if(ti) b.title=ti; b.disabled=!!d; b.onclick=()=>{ const it=x&&f(x); if(x==null) main.click(); else if(it&&!it.dis) it.fn(); }; return b; };
      const pdf=f('Enregistrer sous forme'), ren=f('Renommer'), sup=f('Supprimer le document');
      const L=el('div','sgce-dc','<div class="t"><b></b><span></span></div><div class="a"></div>'); L.querySelector('b').textContent=titre; L.querySelector('span').textContent=etat;
      L.querySelector('.a').append(act(cree?'Ouvrir':'Créer le document',cree?'Ouvrir le document':'Créer le document à partir d’un modèle',null,dis),act('Créer le PDF','Enregistrer le document sous forme de fichier PDF','Enregistrer sous forme',dis||!pdf||pdf.dis),
        ...(cree?[act('Renommer…','Renommer le document','Renommer',dis||!ren||ren.dis),act('Supprimer le document','Supprimer le document (les fichiers PDF déjà créés sont gardés)','Supprimer le document',dis||!sup||sup.dis)]:[]));
      [titreEl,lab,nameRow].forEach(r=>r&&r.classList.add('sgce-x2')); pdfRow.classList.add('sgce-dpdf'); P.insertBefore(L,P.firstChild); }); };
  new MutationObserver(()=>{ deco(); entete(); maj(); }).observe(pane,{childList:true});
  new MutationObserver(()=>decoDocs()).observe(pane,{childList:true,subtree:true});   /* un panneau du moteur se redessine seul (création, renommage…) */
  /* clic droit sur une ligne : la choisir, puis éditer / supprimer l'écriture, nouvelle écriture */
  pane.addEventListener('contextmenu',e=>{ if(e.defaultPrevented||e.altKey||String(getSelection()).trim()||CCV.docs||CCV.sec==='DOCUMENTS') return;
    const tr=e.target.closest&&e.target.closest('table.g tbody tr[data-k]'); if(!tr||!pane.contains(tr)) return; e.preventDefault(); tr.click();
    if(CCV.sec==='DEVIS GENERAL') return;   /* Devis général : affiché seulement, aucun menu d'écriture (Paulo, 11.11.2026) */
    const ecr=!estCC()||tr.dataset.k.split('|').length>=3;   /* Contrôle du coût : seules les lignes de détail sont des écritures */
    sgMenuAt(e.clientX,e.clientY,[...(ecr?[{t:'Éditer l’écriture',fn:()=>bEd.click()},{t:'Supprimer l’écriture…',danger:true,fn:()=>bDel.click()},'-']:[]),{t:'Nouvelle écriture',sub:()=>bNew._sgB.menu()}],tr); });
  pane.tabIndex=-1;
  pane.addEventListener('keydown',e=>{ if(e.target.closest('input,textarea,select,[contenteditable]')) return;
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){ const L=[...pane.querySelectorAll(':scope>table.g>tbody>tr:not(.sgce-cache)')], i=L.findIndex(t=>t.classList.contains('on')), n=L[i<0?0:i+(e.key==='ArrowDown'?1:-1)]; if(n){ e.preventDefault(); n.click(); n.scrollIntoView({block:'nearest'}); } }
    else if(e.key==='Enter'){ const t=pane.querySelector(':scope>table.g>tbody>tr.on'); if(t){ e.preventDefault(); t.dispatchEvent(new MouseEvent('dblclick',{bubbles:true})); } } });
  const ouvertA=performance.now(); box.addEventListener('dblclick',e=>{ if(performance.now()-ouvertA<450){ e.stopPropagation(); e.preventDefault(); } },true);   /* le 2e clic d'un double-clic d'habitude sur la liste n'ouvre pas une écriture */
  ong.append(ongL,niv); box.append(hd,kp,ong,bar2,dsub,body); m.replaceChildren(box); box._plein(ED.plein);   /* plein écran gardé d'un contrôle des coûts à l'autre pendant la séance */
  maj(); entete(); deco(); decoDocs(); }
{ const e0=ccEditor; ccEditor=function(m,id){ e0.apply(this,arguments); try{ habillerEd(m,id); }catch(e){ console.error(e); } }; }
Object.assign(SGCC,{COCO,totaux});
})();

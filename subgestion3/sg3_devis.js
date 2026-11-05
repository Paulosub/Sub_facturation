/* ═══ DESCRIPTIFS & DEVIS AU GRAPHISME DE L'APP (05.11.2026, bloc 37 ; demande de Paulo : « reproduire graphiquement ce chapitre comme tout le reste
   de l'app, améliore pour rendre plus lisible et simple à utiliser ») ═══
   Le moteur reste celui de DeltaSub.html (positions, calculs, filtre, présentations, impressions, documents) ; DeltaSub.html seul garde ses écrans.
   Liste (VIEWS.devis, ch02dDomain) : page commune de la liste du projet et de tous les projets — bandeau, chiffres, statuts, recherche, tableau ; un clic
   ouvre le devis, clic droit = en-tête, dupliquer, supprimer ; un devis créé s'ouvre aussitôt.
   Devis ouvert (dvEditor enveloppé, éléments du moteur déplacés tels quels) : bandeau jaune, chiffres (totaux), onglets Positions · Documents. Positions : tableau
   sur toute la largeur (les montants ne sortent plus de l'écran), niveaux CFC lisibles, choix du détail (Tout · 3 · 2 · 1 chiffres), barre en texte réduite à
   l'essentiel, le reste dans Fonctions (sous-menus) ; le plan CFC ne s'ouvre que pour ajouter une position (d'office si le devis est vide). Documents : une ligne
   par document (Devis général, Honoraires, Devis descriptif) avec ses actions, puis les fichiers PDF.
   Fenêtre « Calcul pour <CFC> » (ch02aCalc enveloppé) : bandeau jaune, totaux dedans, tableau qui tient dans la fenêtre, options groupées ; après une saisie, le
   curseur reste dans le tableau (Tab, Entrée, clic : le moteur redessine le tableau à chaque modification et perdait le champ suivant).
   Styles <style id="sgde-css">, classes sgde-* et sgdc-*. Débogage : window.SGDE. */
(function(){
if(typeof ch02dList!=='function'||typeof dvEditor!=='function'||typeof ch02aCalc!=='function'||!window.SGSV||!window.SGSV.outils) return;
const {monter,tete,kpi,btn,lien,menuSous,E,IC,pl,trouve,moT,css}=SGSV.outils;
const CSS=`
.sgde-lt tr.supp td{opacity:.5}
.sgde-lt td.note{max-width:320px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgde-tag{display:inline-block;margin-left:8px;font-size:11px;font-weight:400;color:var(--s-gris);white-space:nowrap}
.sgde{flex:1 1 auto;display:flex;flex-direction:column;min-height:0;height:100%;overflow:hidden;background:#fff}
.sgde-tete{flex:none;padding:8px 24px 0}
.sgde-tete .sgfh-tete{margin:0;padding:10px 18px}
.sgde-tete .sgfh-ini{font-size:28px;white-space:nowrap}
.sgde-tete .sgfh-nm{min-width:0}
.sgde-tete .sgfh-nm h2{font-size:20px}
.sgde-kp{flex:none;margin:0 24px;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));border-top:0}
.sgde-kp .nx-kpi{padding:10px 12px 10px 0;margin-right:12px;min-width:0}
.sgde-kp .nx-kpi .v{font-size:22px;margin-top:5px;white-space:nowrap}
.sgde-kp .nx-kpi .s{margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgde-ong{flex:none;display:flex;align-items:center;gap:8px 24px;margin:0 24px;border-bottom:1px solid var(--s-filet)}
.sgde-ong .sg-onglets{flex:1 1 auto;margin:0;border:0}
.sgde-niv{flex:none;display:flex;align-items:center;gap:12px;font-size:12px;color:var(--s-gris)}
.sgde-niv button{border:0;background:none;padding:2px 0 3px;font:inherit;font-size:12.5px;color:var(--s-gris);cursor:pointer;white-space:nowrap;font-variant-numeric:tabular-nums}
.sgde-niv button:hover{color:var(--s-noir)}
.sgde-niv button.on{color:var(--s-noir);font-weight:700;box-shadow:inset 0 -2px 0 var(--s-nuit)}
.sgde-bar{flex:none;margin:0 24px;padding:4px 0;min-height:40px;height:auto;gap:2px;flex-wrap:wrap;border:0;background:transparent}
.sgde-bar .ib{border:0!important;background:transparent!important;box-shadow:none!important;border-radius:0!important;height:32px;padding:0 9px;font-size:12.5px;font-weight:700;color:var(--s-noir)}
.sgde-bar .ib:first-child{padding-left:0}
.sgde-bar .ib:hover{background:var(--s-jaune3)!important}
.sgde-bar .ib.on{box-shadow:inset 0 -2px 0 var(--s-nuit)!important}
.sgde-bar .ib:disabled{color:#b9b9b6}
.sgde-bar .ib .lb{display:inline!important}
.sgde-sep{flex:none;width:1px;height:18px;background:var(--s-filet);margin:0 6px}
.sgde-fin{flex:1 1 auto}
.sgde>.cols{flex:1 1 auto;min-height:0;padding:0 24px 12px;gap:14px}
.sgde>.cols>.col{border:0;background:#fff;box-shadow:none;min-width:0}
.sgde .pane{border:0;background:#fff;box-shadow:none}
.sgde-cfc{flex:0 0 280px!important;width:280px!important;border-right:1px solid var(--s-filet)!important;padding-right:12px}
.sgde-cfc.sgde-ferme{display:none}
.sgde-cfc-t{flex:none;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:4px 0 6px;border-top:2px solid var(--s-noir)}
.sgde-cfc-t b{font-size:13px}
.sgde-x{border:0;background:none;font-size:18px;line-height:1;width:26px;height:26px;cursor:pointer;color:var(--s-gris)}
.sgde-x:hover{color:var(--s-noir);background:var(--s-jaune3)}
.sgde-cfc .ph2{min-height:0;padding:0 0 6px;border:0;background:transparent}
.sgde-cfc .ph2 .ib{height:32px;padding:0 8px 0 0;border:0;background:transparent;font-weight:700}
.sgde-cfc .ph2 .ib:hover{background:var(--s-jaune3)}
.sgde-cfc .ph2 .psearch{flex:1 1 auto;width:auto;min-width:0;height:32px;border:1.5px solid var(--s-noir)}
.sgde-aide{flex:none;font-size:11.5px;color:var(--s-gris);padding:0 0 6px;line-height:1.35}
.sgde-cfc table.g tr.sgde-dans td:last-child::after{content:'';position:absolute;right:6px;top:50%;width:9px;height:5px;margin-top:-5px;border-left:2px solid var(--s-nuit);border-bottom:2px solid var(--s-nuit);transform:rotate(-45deg)}
.sgde-cfc table.g td{position:relative}
.sgde-cfc table.g tr.sgde-dans td:last-child{padding-right:22px}
.sgde .ch02-flab{background:var(--s-jaune3)!important;border:0!important;font-size:12px;padding:4px 8px!important}
.sgde table.g thead th{background:#fff!important;border:0!important;border-bottom:2px solid var(--s-noir)!important;font-size:11px;font-weight:700;color:var(--s-gris)!important;padding:8px!important;height:auto!important}
.sgde table.g tbody td{border:0!important;border-bottom:1px solid var(--s-filet)!important;height:30px;padding:0 8px!important;font-size:12.5px}
.sgde table.g tbody tr:hover td{background:var(--s-jaune3)!important}
.sgde table.g tbody tr.on td{background:var(--s-jaune2)!important;color:var(--s-noir)!important}
.sgde table.g tbody tr.on td span{background:transparent!important;color:inherit!important}
.sgde-t tbody td:first-child{font-variant-numeric:tabular-nums}
.sgde-t th:first-child,.sgde-t td:first-child{position:sticky;left:0;z-index:1}
.sgde-t th:nth-child(2),.sgde-t td:nth-child(2){position:sticky;left:68px;z-index:1}
.sgde-t tbody td:nth-child(-n+2){background:#fff}
.sgde-t thead th:nth-child(-n+2){z-index:3}
.sgde-t tbody td span[style*="background"]{background:transparent!important;padding:0!important}
.sgde-t tr.sgde-n1 td{background:var(--s-nuit3);height:32px}
.sgde-t tr.sgde-n2 td:nth-child(2){padding-left:18px!important}
.sgde-t tr.sgde-n3 td:nth-child(2){padding-left:30px!important}
.sgde-t tr.sgde-n4 td:nth-child(2){padding-left:42px!important}
.sgde-t tr.sgde-zero td{color:var(--s-gris)}
.sgde-t tr.sgde-det td{font-size:12px;height:26px;color:var(--s-gris)}
.sgde-t tr.sgde-cache{display:none}
.sgde-t tbody td.c{text-align:center}
.sgde-vide{padding:18px 8px;font-size:13px;line-height:1.5;color:var(--s-gris);max-width:560px}
.sgde-vide b{display:block;color:var(--s-noir);margin-bottom:2px}
.sgde-docs{display:none;flex:1 1 auto;min-height:0;overflow:auto;padding:0 24px 16px}
.sgde.docs .sgde-docs{display:block}
.sgde.docs>.cols,.sgde.docs>.sgde-bar,.sgde.docs .sgde-niv{display:none}
.sgde .sgde-docs .ch02-dpane{display:block!important;width:auto!important;flex:none!important;border:0;background:#fff;overflow:visible}
.sgde-dl{margin:14px 0 22px;border-top:2px solid var(--s-noir)}
.sgde-dc{display:grid;grid-template-columns:minmax(180px,1fr) auto;gap:6px 18px;align-items:center;padding:10px 0;border-bottom:1px solid var(--s-filet)}
.sgde-dc .t b{display:block;font-size:13.5px}
.sgde-dc .t span{display:block;font-size:12px;color:var(--s-gris);margin-top:1px}
.sgde-dc .a{display:flex;flex-wrap:wrap;gap:2px;align-items:center;justify-content:flex-end}
.sgde-dc .a .ib{border:0;background:transparent;height:30px;padding:0 9px;font-size:12.5px;font-weight:700;color:var(--s-noir)}
.sgde-dc .a .ib:hover{background:var(--s-jaune3)}
.sgde-dc .a .ib:disabled{color:#b9b9b6;opacity:1}
.sgde-docs .ch02-dpane>.ph2{min-height:0;padding:0 0 8px;border:0!important;background:transparent}
.sgde-docs .ch02-dpane>.ph2>b{font-size:14px}
.sgde-docs .ch02-dpane .ib{border:0;background:transparent}
.sgde-docs .ch02-dpane>.ph2{border-top:2px solid var(--s-noir)!important;padding-top:8px}
.sgde-docs .ch02-dpane>div:not(.ph2):not(.sgde-dl){border:0!important;height:auto!important;min-height:96px}
.dlg.sgdc-dlg{width:min(1180px,94vw)!important;max-height:92vh}
.ov:has(>.dlg.sgdc-dlg){padding-top:4vh}
.dlg.sgdc-dlg>.tt{display:none}
.dlg.sgdc-dlg>.bd{padding:0}
.sgdc-dlg .sgfh-tete{margin:0;border-top:0;padding:14px 24px}
.sgdc-dlg .sgfh-ini{font-size:26px;white-space:nowrap}
.sgdc-dlg .sgfh-nm{min-width:0}
.sgdc-dlg .sgfh-nm h2{font-size:20px}
.sgdc-tot{margin-left:auto;font-size:12.5px}
.sgdc-tot>div{gap:6px 14px!important;flex-wrap:wrap;justify-content:flex-end}
.sgdc-tot b{margin-right:0!important;font-size:15px!important}
.sgdc{padding:10px 24px 8px}
.sgdc .seg{margin-bottom:6px}
.sgdc-outils{flex-wrap:wrap;align-items:center;gap:2px!important;margin-bottom:4px!important}
.sgdc-outils .ib{border:0;background:transparent;height:32px;padding:0 8px;font-size:12.5px;font-weight:700;color:var(--s-noir)}
.sgdc-outils .ib:first-child{padding-left:0}
.sgdc-outils .ib:hover{background:var(--s-jaune3)}
.sgdc-tab{border:0!important;border-top:0!important;max-height:42vh!important}
.sgdc table.g{table-layout:fixed!important;min-width:900px}
.sgdc table.g thead th{background:#fff!important;border:0!important;border-bottom:2px solid var(--s-noir)!important;font-size:11px;font-weight:700;color:var(--s-gris)!important;padding:6px 4px!important;height:auto!important;white-space:nowrap}
.sgdc table.g tbody td{border:0!important;border-bottom:1px solid var(--s-filet)!important;padding:3px 4px!important;height:auto;overflow:visible;font-size:12.5px}
.sgdc table.g tbody tr:hover td{background:var(--s-jaune3)}
.sgdc table.g tbody td[style*="background"]{background:var(--s-jaune2)!important}
.sgdc table.g input.inp,.sgdc table.g select.inp{width:100%!important;height:28px!important;box-sizing:border-box;border:1px solid var(--s-gris3);border-radius:0;background:#fff;font-size:12.5px;padding:0 5px}
.sgdc table.g input.inp:focus,.sgdc table.g select.inp:focus{outline:none;border-color:var(--s-nuit);background:var(--s-jaune3)}
.sgdc table.g th:nth-child(4),.sgdc table.g th:nth-child(6),.sgdc table.g th:nth-child(7),.sgdc table.g th:nth-child(8),.sgdc table.g th:nth-child(9),.sgdc table.g td:nth-child(4),.sgdc table.g td:nth-child(6) input,.sgdc table.g td:nth-child(7) input,.sgdc table.g td:nth-child(8) input,.sgdc table.g td:nth-child(4) input{text-align:right}
.sgdc table.g th:nth-child(10),.sgdc table.g td:nth-child(10){text-align:center}
.sgdc table.g td:nth-child(9){font-weight:700;white-space:nowrap}
.sgdc-vide{font-size:12.5px;color:var(--s-gris);padding:12px 0}
.sgdc-opts{display:grid!important;grid-template-columns:minmax(0,1fr) 130px 190px auto!important;gap:8px 16px!important;align-items:end!important;margin-top:12px!important}
.sgdc-opts .f{display:flex;flex-direction:column;gap:4px;min-width:0}
.sgdc-opts .f>label,.sgdc-desc>div:first-child{font-size:11px;font-weight:700;color:var(--s-gris);white-space:nowrap}
.sgdc-opts .f input.inp,.sgdc-opts .f select.inp{height:32px;box-sizing:border-box;border:1px solid var(--s-gris3);border-radius:0;width:100%}
.sgdc-opts .f>div{display:flex;align-items:center;gap:6px;white-space:nowrap}
.sgdc-opts .f>div input.inp{width:78px!important}
.sgdc-opts .f>div .ib{border:0;background:transparent;height:30px;min-width:26px;padding:0 4px}
.sgdc-opts>label{height:32px;display:inline-flex;align-items:center;gap:6px;font-size:12.5px;cursor:pointer;white-space:nowrap}
.sgdc-desc{margin-top:10px!important}
.sgdc-desc>div:first-child{margin-bottom:4px}
.sgdc-desc textarea{width:100%;box-sizing:border-box;border:1px solid var(--s-gris3);border-radius:0}
@media (max-height:860px){.sgde-tete .sgfh-meta{display:none}.sgde-tete .sgfh-tete{padding:6px 14px}.sgde-tete .sgfh-ini{font-size:22px}.sgde-tete .sgfh-nm h2{font-size:17px}.sgde-tete .sgfh-nm .lb{margin:0}.sgde-kp .nx-kpi{padding:6px 12px 6px 0}.sgde-kp .nx-kpi .v{font-size:18px;margin-top:3px}.sgde-kp .nx-kpi .s{display:none}.sgdc-dlg .sgfh-tete{padding:8px 24px}.sgdc-tab{max-height:36vh!important}}
@media (max-width:980px){.sgde-cfc{flex-basis:260px!important;width:260px!important}.sgde-dc{grid-template-columns:1fr}.sgde-dc .a{justify-content:flex-start}.sgdc-opts{grid-template-columns:1fr 1fr!important}}
`;
const cssD=()=>{ css(); if(!document.getElementById('sgde-css')){ const s=document.createElement('style'); s.id='sgde-css'; s.textContent=CSS; document.head.appendChild(s); } };
const el=(t,c,x)=>{ const e=document.createElement(t); if(c) e.className=c; if(x!=null) e.innerHTML=x; return e; };
const num2=n=>{ try{ return num(n); }catch(_){ return String(n); } };
const ecrit=()=>{ try{ return !!sgDroit('chantier','ecriture'); }catch(_){ return true; } };
const prj=d=>DS.get('project',d.PROJECT_ID)||{};
const BESOIN=['costestimate','costestimatedocument','project'];
const ouvrir=d=>ch02dOpen(d,VIEW&&VIEW.id!=='devis'?{view:VIEW.id,arg:VIEW.arg}:null);
const nouveau=q=>ch02dEditDoc(q,null,x=>{ if(x) ouvrir(x); });
/* colonnes de l'export de la liste : mêmes colonnes que le tableau */
const colsListe=G=>[...(G?[{k:'pn',t:'N° d’affaire',f:d=>E(prj(d).NUMBER||'')}]:[]),{k:'VERSION',t:'Version'},{k:'VERSIONNUMBER',t:'N° de version'},{k:'st',t:'Statut',f:d=>E(DV_STATE[d.STATECODE]||'')},{k:'NOTE',t:'Note'},{k:'tot',t:'Total TTC',f:d=>{ const v=ch02dTot(d.ID); return v==null?'':E(num2(v)); }},{k:'dt',t:'Modifié',f:d=>E(dfr(d.CHANGEDDATE))},{k:'USERID',t:'Par'}];
const DEVI={
  rendre(I){ cssD(); const p=I.p, u=I.u, G=!!p.GLOBAL, tous=(G?DS.all('costestimatedocument'):DS.by('costestimatedocument','PROJECT_ID',p.ID)).filter(d=>!G||!u.mine||d.USERID===ME.id), vivant=tous.filter(d=>!+d.ISMARKEDASDELETED), base=u.supp?tous:vivant, parSt=[...new Set(base.map(d=>+d.STATECODE||0))].sort(), ec=ecrit();
    if(u.statut!=null&&!parSt.includes(u.statut)) u.statut=null;   /* statut disparu de la liste : ses boutons aussi, le filtre ne reste pas actif */
    const st=u.statut??null;
    const R=base.filter(d=>(st==null||+d.STATECODE===st)&&trouve(u.q,d.VERSION,d.NOTE,d.USERID,d.VERSIONNUMBER,DV_STATE[d.STATECODE],G?prj(d).NUMBER:'',G?prj(d).TITLE:'')).sort((a,b)=>cmp(b.CHANGEDDATE,a.CHANGEDDATE)||(+b.ID-+a.ID)); I.R=R;
    const nV=vivant.filter(d=>+d.STATECODE===2).length, nP=vivant.filter(d=>[0,1].includes(+d.STATECODE||0)).length, dern=vivant.slice().sort((a,b)=>cmp(b.CHANGEDDATE,a.CHANGEDDATE)||(+b.ID-+a.ID))[0]||null, totD=dern?ch02dTot(dern.ID):null, mo=moT(p);
    const acts=(ec?btn('new','Nouveau devis','plus',1):'')+'<button class="nx-btn" data-a="menu" title="Autres actions" aria-label="Autres actions">⋯</button>';
    const teteP=G?tete('DG','Devis généraux','Descriptifs & devis',pl(vivant.length,'devis','devis')+' · tous les projets',acts):tete(p.NUMBER||'','Devis généraux',p.TITLE||'',[mo?'Maître de l’ouvrage : '+mo:'',pl(vivant.length,'devis','devis')].filter(Boolean).join(' · '),acts);
    if(!vivant.length&&!u.supp&&!(G&&u.mine)) return '<div class="sgsv">'+teteP+'<div class="sgsv-vide"><b>'+(G?'Aucun devis.':'Aucun devis pour ce projet.')+'</b><br>Un devis général chiffre l’ouvrage par CFC : positions, quantités, prix, puis documents et impressions.'+(ec?'<div class="acts">'+btn('new','Nouveau devis','plus',1)+'</div>':'')+'</div></div>';
    return '<div class="sgsv">'+teteP
      +'<div class="nx-kpis sgsv-kp">'+kpi('Devis',String(vivant.length),G?'tous les projets':'versions du projet')+kpi('Validés',String(nV),'')+kpi('En préparation',String(nP),'brouillons et provisoires')+(G?kpi('Projets',String(new Set(vivant.map(d=>d.PROJECT_ID)).size),'avec un devis'):kpi('Dernier devis',totD==null?'—':num2(totD)+'<small>CHF TTC</small>',dern?E(dern.VERSION||''):''))+kpi('Dernière modification',dern&&dern.CHANGEDDATE?dfr(dern.CHANGEDDATE):'—',dern&&dern.USERID?'par '+E(dern.USERID):'')+'</div>'
      +'<div class="sgsv-fil">'+(G?[['0','Tous'],['1','Mes devis']].map(([v,t])=>'<button data-a="mine" data-v="'+v+'" class="'+((+v===1)===!!u.mine?'on':'')+'">'+t+'</button>').join('')+'<span style="width:10px"></span>':'')
      +(parSt.length>1?[['','Tous les statuts'],...parSt.map(c=>[c,DV_STATE[c]||String(c)])].map(([c,t])=>{ const v=c===''?null:+c; return '<button data-a="statut" data-c="'+c+'" class="'+(v===st?'on':'')+'" aria-pressed="'+(v===st)+'">'+E(t)+'</button>'; }).join(''):'')
      +'<span class="dr"><input class="inp" data-q type="search" style="width:240px" placeholder="Rechercher un devis" aria-label="Rechercher un devis" value="'+E(u.q||'')+'"></span></div>'
      +(R.length?'<table class="nx-tbl sgsv-tb sgde-lt"><thead><tr>'+(G?'<th>Projet</th>':'')+'<th>Version</th><th class="r">N°</th><th>Statut</th><th>Note</th><th class="r">Total TTC</th><th>Modifié</th><th>Par</th></tr></thead><tbody>'
        +R.map(d=>{ const v=ch02dTot(d.ID), nt=d.NOTE||''; return '<tr data-a="open" data-d="'+d.ID+'"'+(+d.ISMARKEDASDELETED?' class="supp"':'')+'>'+(G?'<td class="nw" title="'+E(prj(d).TITLE||'')+'">'+E(prj(d).NUMBER||'')+'</td>':'')+'<td><b>'+E(d.VERSION||'(sans titre)')+'</b>'+(+d.ISAPPLYSUBPROJECTS?'<span class="sgde-tag">subdivisions</span>':'')+(+d.ISMARKEDASDELETED?'<span class="sgde-tag">supprimé</span>':'')+'</td><td class="r">'+E(d.VERSIONNUMBER??'')+'</td><td class="nw">'+E(DV_STATE[d.STATECODE]||'')+'</td><td class="note" title="'+E(nt)+'">'+E(nt)+'</td><td class="r nw">'+(v==null?'—':E(num2(v)))+'</td><td class="nw">'+E(dfr(d.CHANGEDDATE))+'</td><td class="nw">'+E(d.USERID||'')+'</td></tr>'; }).join('')+'</tbody></table>'
        :'<p class="sgsv-rien">Aucun devis trouvé.</p>')+'</div>'; },
  action(I,a,t,e){ const p=I.p, u=I.u, d=t.dataset.d?DS.get('costestimatedocument',t.dataset.d):null;
    if(a==='new'){ if(p.GLOBAL) pickProject(CH02D_L.pickP,q=>nouveau(q)); else nouveau(p); }
    else if(a==='open'){ if(d&&!(e&&e.detail>1)) ouvrir(d); }
    else if(a==='mine'){ u.mine=t.dataset.v==='1'; u.statut=null; I.dessiner(); }
    else if(a==='statut'){ u.statut=t.dataset.c===''?null:+t.dataset.c; I.dessiner(); }
    else if(a==='menu'){ const g=()=>({cols:colsListe(!!p.GLOBAL),view:I.R||[]}), ec=ecrit();
      menuSous(t,[{t:CH02D_L.delShown,chk:!!u.supp,fn:()=>{ u.supp=!u.supp; I.dessiner(); }},...(ec?['-',{t:CH02D_L.impInt,fn:()=>{ if(p.GLOBAL) pickProject(CH02D_L.pickP,q=>ch02dImportFromProject(q)); else ch02dImportFromProject(p); }}]:[]),'-',{t:CH02D_L.tblCopy,fn:()=>copyTable(g())},{t:CH02D_L.tblCsv,fn:()=>csvTable(g(),'Devis')}]); } },
  ctx(I,t,e){ if(t.dataset.a!=='open') return false; const d=DS.get('costestimatedocument',t.dataset.d); if(!d) return false; const def=!!+d.ISMARKEDASDELETED;
    sgMenuAt(e.clientX,e.clientY,[{t:'Ouvrir le devis',fn:()=>ouvrir(d)},...(ecrit()?[{t:'Modifier l’en-tête…',fn:()=>ch02dEditDoc(prj(d),d)},{t:'Dupliquer…',fn:()=>ch02dDuplicate(d)},...(ch02dSps(d.PROJECT_ID).length?[{t:CH02D_L.match+' …',fn:()=>ch02dMatchStructure(d)}]:[]),'-',{t:def?'Supprimer définitivement…':'Supprimer…',danger:true,fn:()=>ch02dDelete(d)}]:[])]); return true; } };
ch02dDomain=function(C,top,pane,p){ monter(C,p,'devis',BESOIN,DEVI); };
{ const V=VIEWS.devis, r0=V.render; V.render=function(m,arg){ if(!DS.loaded.has('costestimate')||DV.open) return r0.call(this,m,arg); this.list=null; monter(m,{ID:'tous',GLOBAL:1,NUMBER:'',TITLE:''},'devisg',BESOIN,DEVI); }; }

/* ── devis ouvert : éléments du moteur déplacés tels quels, ses gestionnaires restent ── */
const lib=(b,t)=>{ const s=b.querySelector('.lb'); if(s) s.textContent=t; else b.querySelector('.dd')?b.querySelector('.dd').insertAdjacentHTML('beforebegin','<span class="lb">'+E(t)+'</span>'):b.insertAdjacentHTML('beforeend','<span class="lb">'+E(t)+'</span>'); return b; };
const niv0=()=>{ try{ const v=+localStorage.getItem('sg3_devis_niv'); return [1,2,3].includes(v)?v:0; }catch(_){ return 0; } };
const LARG_POS={cfc:68,ht:108,tva:94,ttc:116,pct:52};
/* tableau des positions après chaque dessin du moteur : largeurs, niveaux CFC, détail choisi */
function deco(X){ const S=X.sgde, rp=X.rp, t=rp&&rp.querySelector('table.g'); if(!S||!t) return; t.classList.add('sgde-t');
  const cols=X.R2.cols||[], cg=[...t.querySelectorAll('colgroup col')], th=t.querySelectorAll('thead th'); let mini=0;
  cols.forEach((c,i)=>{ const w=c.k==='d'?0:LARG_POS[c.k]||+c.w||0; if(cg[i]) cg[i].style.width=w?w+'px':''; mini+=w||(S.cfc?170:340); if(c.k==='pct'&&th[i]) th[i].textContent='%'; });
  t.style.minWidth=mini+'px';
  const V=new Map((X.R2.view||[]).map(r=>[String(r.det?r.k:r.p.cfc),r]));
  t.querySelectorAll('tbody tr[data-k]').forEach(tr=>{ const r=V.get(tr.dataset.k); if(!r) return; const n=r.det?r.n:r, lv=cfcLevel(n.p.cfc);
    tr.classList.add('sgde-n'+lv); tr.classList.toggle('sgde-det',!!r.det); tr.classList.toggle('sgde-cache',!!S.niv&&lv>S.niv); tr.classList.toggle('sgde-zero',!r.det&&!n.ttc&&!n.opt); });
  const cachee=t.querySelector('tbody tr.on.sgde-cache');
  if(cachee){ if(S.vu!==X.st.sel){ S.niv=0; if(S.dessNiv) S.dessNiv(); t.querySelectorAll('.sgde-cache').forEach(x=>x.classList.remove('sgde-cache')); cachee.scrollIntoView({block:'nearest'}); }   /* position ajoutée ou choisie dans le plan CFC : le détail s'ouvre pour la montrer */
    else { X.st.sel=null; X.R2.sel=null; cachee.classList.remove('on'); ch02aUpd(X); } }   /* sinon elle n'est plus choisie : rien n'agit sur une ligne invisible */
  S.vu=X.st.sel;
  const vide=!(X.E.positions||[]).length, msg=rp.querySelector('.sgde-vide');
  if(vide&&!msg) rp.append(el('div','sgde-vide','<b>Ce devis n’a pas encore de position.</b>Choisissez un CFC dans le plan à gauche et double-cliquez dessus pour l’ajouter.')); else if(!vide&&msg) msg.remove(); }
/* plan CFC : niveaux, coche sur les CFC déjà dans le devis */
function decoCat(X){ const L=X.L, t=L&&L.pane.querySelector('table.g'); if(!t) return; const cs=new Set((X.E.positions||[]).map(p=>String(p.cfc))), byId=new Map((X.catPos||[]).map(c=>[String(c.ID),String(c.CODE)]));
  t.querySelectorAll('tbody tr[data-k]').forEach(tr=>{ const c=byId.get(tr.dataset.k); tr.classList.toggle('sgde-dans',c!=null&&cs.has(c)); }); }
function habiller(m,X){ cssD();
  const B=[...X.bar.children], bListe=B[0], bEd=B[3], bPar=B[4];
  if(!bListe||!/Liste/.test(bListe.textContent)||!bEd||!bEd._sgB||!bPar||!bPar._sgB||!X.bDel||!X.bFil||!X.bDoc||!X.bWh||!X.bWh._sgB) return;   /* barre inattendue : l'écran du moteur reste tel quel */
  const S=X.sgde={ong:'pos',cfc:!(X.E.positions||[]).length,niv:niv0(),vu:X.st.sel};
  const box=el('div','sgde'), hd=el('div','sgde-tete'), kp=el('div','nx-kpis sgde-kp'), ong=el('div','sgde-ong'), ongL=el('div','sg-onglets'), niv=el('div','sgde-niv'), bar=el('div','ph2 sgde-bar'), docs=el('div','sgde-docs');
  const mEd=bEd._sgB.menu, mPar=bPar._sgB.menu, mWh=X.bWh._sgB.menu, ec=ecrit();
  const fonctions=()=>{ const ed=mEd().slice(), dern=Object.assign(ch02aExt(X,'ch02dLastVersion',4,CH02A_L.last),{dis:ch02dLastDis(X)}), pr=mPar().filter(x=>x!=='-'&&x.t!==CH02A_L.prefs), vis=()=>Object.assign({},X.R2,{view:(X.R2.view||[]).filter(r=>!S.niv||cfcLevel((r.det?r.n:r).p.cfc)<=S.niv)}), wh=mWh().filter(x=>x==='-'||!String(x.t).startsWith(CH02A_L.docs)).map(x=>x==='-'?x:x.t===CH02A_L.copy?{t:x.t,fn:()=>{ const g=vis(); ctCopy(tableText(g,'\t'),'Tableau copié ('+g.view.length+' lignes).'); }}:x.t===CH02A_L.csv?{t:x.t,fn:()=>csvTable(vis(),'Devis_'+(X.p?X.p.NUMBER:''))}:x), rows=!!((X.R2||{}).view||[]).length;
    return [...(ec?[{t:'Modifier les montants',sub:()=>[...ed,'-',dern]},{t:CH02A_L.intro,fn:()=>X.dvIntro()},...pr,{t:'Modifier l’en-tête du devis …',fn:()=>ch02dEditDoc(X.p,ch02aHdr(X))},'-']:[]),{t:'Exporter',dis:!rows,sub:()=>wh}]; };
  const sep=()=>el('span','sgde-sep'), fin=el('span','sgde-fin');
  const bAdd=lib(ibtn({i:'plus',t:'Ajouter une position',fn:()=>plan(!S.cfc)}),'Ajouter une position');
  X.bModif=ibtn({i:'edit',t:'Editer la position',fn:()=>X.dvCalc()});
  const bPres=ibtn({i:'list',t:'Présentation',menu:()=>ch02aPresMenu(X).filter(x=>x==='-'||x.t!=='Seulement positions de 1 à 3 chiffres')});
  const bReg=ibtn({i:'wrench',t:'Paramètres',fn:()=>ch02aSettings(X)});
  const bFon=ibtn({i:'gear',t:'Fonctions',fn:()=>menuSous(bFon,fonctions())}); bFon.insertAdjacentHTML('beforeend','<span class="dd">▼</span>'); X.bWh=bFon;
  lib(X.bDoc,'Imprimer'); X.bDoc.title='Imprimer le devis'; if(X.bDoc._sgB&&X.bDoc._sgB.menu){ const mD=X.bDoc._sgB.menu; X.bDoc._sgB.menu=()=>mD().map(x=>x&&x.t?Object.assign({},x,{t:String(x.t).replace(CH02B_L.legacy,'')}):x); }
  bar.append(...(ec?[bAdd]:[]),X.bModif,...(ec?[X.bDel]:[]),sep(),bPres,X.bFil,sep(),X.bDoc,...(ec?[bReg]:[]),fin,bFon);
  const plan=on=>{ S.cfc=on; X.L.el.classList.toggle('sgde-ferme',!on); bAdd.classList.toggle('on',on); deco(X); if(on){ const q=X.L.el.querySelector('.psearch'); if(q) q.focus(); } };
  const cT=el('div','sgde-cfc-t','<b>Plan CFC</b><button class="sgde-x" title="Fermer le plan CFC" aria-label="Fermer le plan CFC">×</button>'); cT.querySelector('button').onclick=()=>plan(false);
  X.L.el.classList.add('sgde-cfc'); X.L.el.prepend(cT); const ph=X.L.el.querySelector('.ph2'); if(ph) ph.after(el('div','sgde-aide','Double-cliquez sur un CFC pour l’ajouter au devis. Une coche indique les CFC déjà présents.'));
  const dessOng=()=>{ ongL.innerHTML=[['pos','Positions'],['docs','Documents']].map(([k,t])=>'<button data-o="'+k+'" class="'+(S.ong===k?'on':'')+'">'+t+'</button>').join(''); box.classList.toggle('docs',S.ong==='docs'); };
  const dessNiv=()=>{ niv.innerHTML='<span>Détail</span>'+[[0,'Tout','Toutes les positions'],[3,'3','Positions de 1 à 3 chiffres'],[2,'2','Positions de 1 et 2 chiffres'],[1,'1','Positions à 1 chiffre']].map(([v,t,ti])=>'<button data-v="'+v+'" title="'+E(ti)+'" aria-label="'+E(ti)+'" class="'+(S.niv===v?'on':'')+'">'+t+'</button>').join(''); };
  ongL.onclick=e=>{ const b=e.target.closest('[data-o]'); if(b){ S.ong=b.dataset.o; dessOng(); } };
  S.dessNiv=dessNiv;
  niv.onclick=e=>{ const b=e.target.closest('[data-v]'); if(!b) return; S.niv=+b.dataset.v; try{ localStorage.setItem('sg3_devis_niv',String(S.niv)); }catch(_){} const q=ch02aSelPos(X); if(S.niv&&q&&cfcLevel(q.cfc)>S.niv){ X.st.sel=null; X.R2.sel=null; } S.vu=X.st.sel; dessNiv(); X.draw(); };
  hd.onclick=e=>{ if(e.target.closest('[data-a="liste"]')) ch02aClose(X); };
  X.sgdeMaj=()=>{ const d=ch02aHdr(X)||{}, p=X.p||{}, {T,M}=dvCompute(X.E,X.filter), sepV=ch02aSep(X), fe=[...M.values()].filter(n=>n.leaf), nC=fe.filter(n=>n.ttc||n.opt).length, mo=moT(p), et=DV_STATE[d.STATECODE]||'', ff=X.filter&&X.filter.length?'filtre actif':'';
    hd.innerHTML=tete(p.NUMBER||'','Devis général'+(et?' · '+et:''),d.VERSION||'(sans titre)',[p.TITLE,mo?'Maître de l’ouvrage : '+mo:'',d.VERSIONNUMBER!=null?'version '+d.VERSIONNUMBER:'',d.CHANGEDDATE?'modifié le '+dfr(d.CHANGEDDATE)+(d.USERID?' par '+d.USERID:''):''].filter(Boolean).join(' · '),'<button class="nx-btn" data-a="liste">‹ '+(DV.back?'Retour':'Liste des devis')+'</button>');
    kp.innerHTML=kpi('Total TTC',num2(T.ttc),ff||(T.opt?'+ '+num2(T.opt)+' exclus':'CHF'),'','Total du devis, TVA comprise')+(sepV?kpi('Total HT',num2(T.ht),'CHF')+kpi('TVA',num2(T.tva),'CHF'):'')+kpi('Soumis aux honoraires',num2(T.hon),'CHF HT','','Montant hors taxe soumis aux honoraires, selon le pourcentage de chaque position')+kpi('Positions',String(nC),'chiffrées sur '+fe.length); };
  dessOng(); dessNiv(); ong.append(ongL,niv); X.sgdeMaj();
  box.append(hd,kp,ong,bar,X.body,docs); if(X.dpane) docs.append(X.dpane); m.replaceChildren(box);
  plan(S.cfc&&ec); if(!ec) S.cfc=false;
  const ouvertA=performance.now(); box.addEventListener('dblclick',e=>{ if(performance.now()-ouvertA<450){ e.stopPropagation(); e.preventDefault(); } },true);   /* double-clic d'habitude sur la liste : le 2e clic n'agit pas dans le devis */
  new MutationObserver(()=>deco(X)).observe(X.rp,{childList:true}); new MutationObserver(()=>decoCat(X)).observe(X.L.pane,{childList:true});
  X.rp.addEventListener('keydown',e=>{ if(e.target.closest('input,textarea,select')) return;
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){ const L=[...X.rp.querySelectorAll('tbody tr:not(.sgde-cache)')], i=L.findIndex(t=>t.classList.contains('on')), n=L[i<0?0:i+(e.key==='ArrowDown'?1:-1)]; if(n){ e.preventDefault(); n.click(); n.scrollIntoView({block:'nearest'}); } }
    else if(e.key==='Enter'){ const t=X.rp.querySelector('tbody tr.on'); if(t){ e.preventDefault(); t.dispatchEvent(new MouseEvent('dblclick',{bubbles:true})); } } });
  deco(X); decoCat(X); ch02aUpd(X);
  if(typeof VIEW==='object'&&VIEW) VIEW.nxTitle=[X.p&&X.p.NUMBER,(ch02aHdr(X)||{}).VERSION].filter(Boolean).join(' · '); }
const cx0=ch02aCtx; ch02aCtx=function(o){ const X=cx0(o); SGDE.X=X; return X; };
const ed0=dvEditor; dvEditor=function(m,id){ ed0(m,id); const X=SGDE.X; if(X&&X.m===m&&+X.id===+id) try{ habiller(m,X); }catch(e){ console.error(e); } };
const u0=ch02aUpd; ch02aUpd=function(X){ u0(X); if(X.sgde&&X.bWh) X.bWh.disabled=false; if(X.bModif){ const q=ch02aSelPos(X); X.bModif.disabled=!(q&&!q.genere); } };   /* Fonctions regroupe aussi ce qui reste utile sur un devis vide : seul Exporter y est grisé */
const t0=ch02aTotals; ch02aTotals=function(X){ t0(X); if(X.sgdeMaj) X.sgdeMaj(); };
const dr0=ch02aDraw; ch02aDraw=function(X){ dr0(X); if(X.sgde) decoCat(X); };
/* documents : une ligne par document, ses actions à côté ; les fichiers PDF du moteur suivent */
const ETAT_DOC=(d,f,pdf)=>[d?'Document créé':'Pas encore créé',...(pdf?[f?'PDF créé : '+f.NOM:'sans PDF']:[])].join(' · ');
/* PDF d'une ligne : le moteur ne connaît que le PDF officiel (documents/<genre>.pdf) ; « Créer le PDF » écrit dans documents/archive, sous le nom proposé. Sans ceci, la ligne restait « sans PDF » juste après sa création. Affichage seulement : les règles du moteur (ch02cPdfHas : effacer, avertir à l'ouverture) ne changent pas. Un PDF renommé reste dans la liste Fichiers PDF. */
const pdfLigne=(X,r)=>{ try{ return ch03aTrouve(ch02cDos(X),r.g+'.pdf')||ch03aTrouve(ch02cDos(X,'archive'),ch03aNomPdf(r.pdf))||null; }catch(_){ return null; } };
function docsLignes(X){ const dp=X.dpane, K=dp?[...dp.children]:[]; if(K.length<2||!K[1].classList.contains('pane')) return; const pdf=ch02cPdfOn(), L=el('div','sgde-dl');
  CH02C_ROWS.forEach((r,i)=>{ const d=ch02cHas(X,i), f=ch02cPdfHas(X,i), fl=pdfLigne(X,r), it=ch02cNewItems(X,i).filter(x=>x!=='-'), gen=it[2], c=el('div','sgde-dc','<div class="t"><b>'+E(r.t)+'</b><span>'+E(ETAT_DOC(d,fl,pdf))+'</span></div><div class="a"></div>'), a=c.querySelector('.a');
    a.append(ibtn({label:d?'Ouvrir':'Créer le document',fn:()=>ch02cOpen(X,i)}),...(pdf?[ibtn({label:'Créer le PDF',dis:gen?!!gen.dis:true,fn:()=>gen&&gen.fn&&gen.fn()}),ibtn({label:'Ouvrir le PDF',dis:!fl,fn:()=>{ const x=pdfLigne(X,r); if(x) ch03aOuvrir(x); }})]:[]),ibtn({label:CH02C_L.prefs,menu:()=>ch02cPrefItems(X,i)}),ibtn({label:CH02C_L.suppr,dis:!d&&!f,menu:()=>ch02cDelItems(X,i)})); L.append(c); });
  K[0].remove(); K[1].replaceWith(L); const bz=K[2]&&K[2].querySelector('.ib'); if(bz) lib(bz,'Fonctions'); }
const dp0=ch02cDocPane; ch02cDocPane=function(X){ dp0(X); if(X.sgde) try{ docsLignes(X); }catch(e){ console.error(e); } };

/* ── fenêtre « Calcul pour <CFC> » ── */
const TH_CALC={'Calcul de quantités':['Calcul des quantités','Formule de calcul, par exemple 12.5*3'],Base:['Base','Base du prix'],Var:['Var.','Variante : la ligne n’est pas comptée dans le total']};
const COLS_CALC=[0,112,140,84,62,88,88,54,100,42];
function habCalc(dlg,X){ const bd=dlg.querySelector('.bd'), body=bd&&bd.firstElementChild, host=body&&body.lastElementChild, pos=(X.E.positions||[]).find(x=>String(x.cfc)===String(X.st.sel)); if(!host||!pos) return; cssD();
  dlg.classList.add('sgdc-dlg'); dlg.style.width=''; body.classList.add('sgdc');
  const t=el('div','sgfh-tete','<div class="sgfh-id"><div class="sgfh-ini">'+E(pos.cfc)+'</div><div class="sgfh-nm"><div class="lb">'+E(['Calcul de la position',(ch02aHdr(X)||{}).VERSION].filter(Boolean).join(' · '))+'</div><h2>'+E([pos.texte,pos.texte2].filter(Boolean).join(' '))+'</h2></div></div><div class="sgdc-tot"></div>'), slot=t.querySelector('.sgdc-tot'); bd.prepend(t);
  host.tabIndex=-1; host.style.outline='none'; let rep=null, ajout=null; const ctl=(tr,c)=>{ const td=tr&&tr.cells[c]; return td?td.querySelector('input,select'):null; };
  const poser=()=>{ const K=[...host.children]; if(K.length<5||K[0].classList.contains('sgdc-outils')) return; const actif=document.activeElement, [out,tab,opts,desc,bas]=K, sp=[...out.children].find(x=>x.style&&x.style.flex), tb=tab.querySelector('table'), bdy=tb&&tb.tBodies[0];
    out.classList.add('sgdc-outils'); tab.classList.add('sgdc-tab'); opts.classList.add('sgdc-opts'); desc.classList.add('sgdc-desc');
    const totB=sp&&sp.nextElementSibling; if(totB) slot.replaceChildren(totB); if(sp) sp.before(...bas.children); else out.append(...bas.children); bas.remove();
    if(out.firstElementChild) lib(out.firstElementChild,'Insérer une ligne'); const fx=[...out.children].find(b=>/Fixer/.test(b.title||'')); if(fx) lib(fx,'Fixer le coût');
    if(tb&&!tb.querySelector('colgroup')){ const cg=document.createElement('colgroup'); COLS_CALC.forEach(w=>{ const c=document.createElement('col'); if(w) c.style.width=w+'px'; cg.append(c); }); tb.prepend(cg); }
    if(tb) tb.querySelectorAll('thead th').forEach(th=>{ const m=TH_CALC[th.textContent.trim()]; if(m){ th.textContent=m[0]; th.title=m[1]; } });
    const f=[...opts.children]; if(f.length>=8){ const pa=(l,x,c)=>{ const w=el('div','f'+(c?' '+c:'')); w.append(l,x); return w; }; opts.replaceChildren(pa(f[0],f[1]),pa(f[2],f[3]),pa(f[4],f[5]),f[7]); }
    if(bdy&&!bdy.rows.length) tab.append(el('div','sgdc-vide','Aucune ligne de calcul. Cliquez sur « Insérer une ligne » pour commencer.'));
    let n=null; if(rep&&bdy){ let [r,k,pas]=rep, q=bdy.rows[r]; rep=null; while(q&&!(n=ctl(q,k))){ k+=pas; if(k<0||k>=q.cells.length){ r+=pas; q=bdy.rows[r]; if(q) k=pas>0?0:q.cells.length-1; } } }   /* la quantité calculée n'a pas de champ : cellule suivante */
    else if(ajout&&bdy&&bdy.rows.length>ajout.n){ const tr=[...bdy.rows].find(r=>r.cells[0]&&r.cells[0].style.background); n=ctl(tr,0); ajout=null; }
    if(n){ n.focus(); if(n.select&&n.type!=='checkbox') n.select(); }
    else if(bdy&&!bdy.rows.length&&out.firstElementChild) out.firstElementChild.focus();   /* position vide : Espace insère la première ligne, Échap ferme */
    else if(actif===document.body){ const tr=bdy?[...bdy.rows].find(r=>r.cells[0]&&r.cells[0].style.background):null, c=ctl(tr,0); (c||host).focus({preventScroll:true}); }   /* champ détruit par le redessin : le clavier et Échap restent dans la fenêtre */
    else if(actif&&actif.isConnected&&dlg.contains(actif)) actif.focus(); };
  host.addEventListener('keydown',e=>{ const c=e.target; if((e.key!=='Tab'&&e.key!=='Enter')||!c.closest||!c.closest('tbody')||c.tagName==='TEXTAREA') return; const td=c.closest('td'), tr=td&&td.parentNode, tb=tr&&tr.parentNode; if(!tb) return; const pas=e.shiftKey?-1:1; let r=tr.sectionRowIndex, k=td.cellIndex, q=tr;
    for(;;){ k+=pas; if(k<0||k>=q.cells.length){ r+=pas; q=tb.rows[r]; if(!q) break; k=pas>0?0:q.cells.length-1; } if(ctl(q,k)) break; }
    rep=q?[r,k,pas]:null; setTimeout(()=>{ rep=null; },0);
    if(e.key==='Enter'&&c.type!=='checkbox'){ e.preventDefault(); c.blur(); const n=q&&ctl(q,k); if(n&&n.isConnected){ n.focus(); if(n.select) n.select(); } } });
  host.addEventListener('mousedown',e=>{ const c=e.target.closest&&e.target.closest('tbody input,tbody select'); if(!c||c===document.activeElement) return; const td=c.closest('td'); rep=[td.parentNode.sectionRowIndex,td.cellIndex,1]; setTimeout(()=>{ rep=null; },0); },true);
  /* outils : la saisie en cours est validée d'abord, sans perdre le clic (le moteur redessine tout à la modification) */
  host.addEventListener('mousedown',e=>{ if(e.target.closest&&e.target.closest('.sgdc-outils .ib')) e.preventDefault(); },true);
  host.addEventListener('click',e=>{ const b=e.target.closest&&e.target.closest('.sgdc-outils .ib'); if(!b) return; if(b===b.parentNode.firstElementChild){ const q=host.querySelector('tbody'); ajout={n:q?q.rows.length:0}; } const a=document.activeElement; if(a&&host.contains(a)&&a.closest('tbody')) a.blur(); },true);
  host.addEventListener('change',e=>{ const c=e.target; if(rep||!c.closest||!c.closest('tbody')||(c.tagName!=='SELECT'&&c.type!=='checkbox')) return; const td=c.closest('td'); rep=[td.parentNode.sectionRowIndex,td.cellIndex,1]; setTimeout(()=>{ rep=null; },0); },true);
  /* la ligne choisie suit le curseur : « Effacer la ligne » agit sur la ligne où l'on est */
  host.addEventListener('focusin',e=>{ const tr=e.target.closest&&e.target.closest('tbody tr'); if(tr&&tr.cells[0]&&!tr.cells[0].style.background) tr.click(); });
  new MutationObserver(poser).observe(host,{childList:true}); poser(); }
const ca0=ch02aCalc; ch02aCalc=function(X){ const n0=document.querySelectorAll('.dlg').length, r=ca0.apply(this,arguments), L=document.querySelectorAll('.dlg'); if(L.length>n0&&X.sgde) try{ habCalc(L[L.length-1],X); }catch(e){ console.error(e); } return r; };
const SGDE=window.SGDE={X:null,deco,decoCat,habiller,DEVI};
})();

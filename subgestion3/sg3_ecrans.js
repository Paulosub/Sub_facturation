/* ═══ 54. En-tête de l'app au-dessus des écrans de l'ancien logiciel (refonte d'ensemble, lot 3, 15.11.2026) ═══
   Demande de Paulo du 15.11.2026 : « refonte complète de l'app pour avoir une cohérence des éléments de l'app identique aux éléments définis dans l'app notamment dans
   devis » ; ordre des lots accepté (« Oui, cet ordre ») : après les en-têtes des pages de l'app, les écrans de l'ancien logiciel, chapitre par chapitre.
   Première étape, commune à tous : ces écrans (LISTE) reçoivent le bandeau des listes — monogramme, chapitre, titre et présentation repris du menu (SG_DOM : t, d,
   grp), chiffres quand ils sont simples (CHIFFRES) — par sgTete (sg3.js). Le bandeau est posé AU-DESSUS de la barre contextuelle (#sg-mv, avant #nx-sub), hors de
   #main : le moteur vide et redessine #main à sa guise, rien n'y est ajouté ; ordre de la page = bandeau, chiffres, barre d'outils, contenu, comme les listes de l'app.
   Les écrans gardent leurs fonctions et leurs données ; leur contenu (colonnes, tableaux) sera repris chapitre par chapitre. Pas ici : Archives, Estimations
   (liste et document ouvert à refaire ensemble), écrans de Facturation, pages déjà réglées avec Paulo (Mes projets, Liste des affaires, Annuaire, Liste des adresses). */
(function(){
if(typeof go!=='function'||typeof NX_VIEW==='undefined'||typeof sgTete!=='function') return;
const LISTE=new Set(['collab-actuels','collab-tous','collab-anciens','mg-heures','mg-planning','mg-collab','mg-controlling','mg-contrats','mg-factures','fact-controle','mg-mo','mg-reporting','mg-genres',
  'taches-urgent','taches-encours','taches-regle','tpl-documents','tpl-projectTemplates','tpl-staffTemplates','tpl-timeTemplates','tpl-expensesTemplates','tpl-managementTemplates','tpl-addressTemplates','tpl-labelTemplates','config']);
const fig=(v,t)=>'<div class="sg-fig"><div class="n">'+nxE(String(v))+'</div><div class="t">'+nxE(t)+'</div></div>';
const isoJ=v=>{ if(v==null||v==='') return ''; if(typeof v==='number') return new Date(v).toISOString().slice(0,10); return String(v).slice(0,10); };
/* chiffres simples, lus dans la base à chaque dessin */
const collabs=()=>{ const A=DS.all('staff'), auj=today(), parti=s=>{ const q=isoJ(s.QUITTINGDATE); return !!q&&q<auj; }, act=A.filter(s=>!parti(s)), y=String(new Date().getFullYear());
  return fig(act.length,'membres actuels')+fig(A.length-act.length,'anciens membres')+fig(A.filter(s=>isoJ(s.JOININGDATE).slice(0,4)===y).length,'arrivées '+y)+fig(A.filter(s=>parti(s)&&isoJ(s.QUITTINGDATE).slice(0,4)===y).length,'départs '+y); };
const taches=()=>{ let k={u:0,p:0}; try{ k=sgTachesCompte()||k; }catch(_){ } return fig(k.p||0,'en cours')+fig(k.u||0,'urgentes'); };
const modeles=()=>{ let n=0; try{ n=Object.values((DS.T&&DS.T.modeledocument)||{}).filter(v=>v&&(v.langue==='fr'||!v.langue)).length; }catch(_){ } return n?fig(n,'documents types'):''; };
const CHIFFRES={'collab-actuels':collabs,'collab-tous':collabs,'collab-anciens':collabs,'taches-urgent':taches,'taches-encours':taches,'taches-regle':taches,'tpl-documents':modeles};
const hote=()=>{ let h=document.getElementById('sg-mv'); if(!h){ const sub=document.getElementById('nx-sub'); if(!sub||!sub.parentNode) return null; h=document.createElement('div'); h.id='sg-mv'; sub.parentNode.insertBefore(h,sub); } return h; };
let cle='';
const maj=()=>{ const h=hote(); if(!h) return; const v=typeof VIEW!=='undefined'&&VIEW?VIEW.id:'', x=LISTE.has(v)?NX_VIEW[v]:null, m=document.getElementById('main');
  const ok=!!(x&&x.it&&m&&!m.querySelector('.sgfh-tete,.sg-tete,.sg-intro'));
  if(!ok){ if(h.firstChild){ h.textContent=''; } cle=''; document.documentElement.removeAttribute('data-vep'); return; }
  document.documentElement.setAttribute('data-vep','1');   /* présentation épurée de l'écran (styles html[data-vep] de sg3.css) */
  let f=''; try{ f=CHIFFRES[v]?CHIFFRES[v]():''; }catch(e){ console.error(e); }
  const k=v+'|'+f; if(k===cle&&h.firstChild) return; cle=k;
  h.innerHTML='<div class="sgmv">'+sgTete([x.d&&x.d.t,x.it.grp].filter(Boolean).join(' · '),nxE(x.it.t||''),nxE(x.it.d||''),f?'<div class="sg-figs">'+f+'</div>':'')+'</div>'; };
{ const g0=go; go=function(){ const r=g0.apply(this,arguments); try{ maj(); }catch(e){ console.error(e); } setTimeout(()=>{ try{ maj(); }catch(_){ } },0); return r; }; }
try{ DS.on(()=>{ setTimeout(()=>{ try{ maj(); }catch(_){ } },0); }); }catch(_){ }
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
window.SGMV={LISTE,maj,DOMS};
})();

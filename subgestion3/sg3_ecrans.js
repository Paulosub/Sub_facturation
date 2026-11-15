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
  if(!ok){ if(h.firstChild){ h.textContent=''; } cle=''; return; }
  let f=''; try{ f=CHIFFRES[v]?CHIFFRES[v]():''; }catch(e){ console.error(e); }
  const k=v+'|'+f; if(k===cle&&h.firstChild) return; cle=k;
  h.innerHTML='<div class="sgmv">'+sgTete([x.d&&x.d.t,x.it.grp].filter(Boolean).join(' · '),nxE(x.it.t||''),nxE(x.it.d||''),f?'<div class="sg-figs">'+f+'</div>':'')+'</div>'; };
{ const g0=go; go=function(){ const r=g0.apply(this,arguments); try{ maj(); }catch(e){ console.error(e); } setTimeout(()=>{ try{ maj(); }catch(_){ } },0); return r; }; }
try{ DS.on(()=>{ setTimeout(()=>{ try{ maj(); }catch(_){ } },0); }); }catch(_){ }
window.SGMV={LISTE,maj};
})();

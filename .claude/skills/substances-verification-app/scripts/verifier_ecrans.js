/* Balayage automatique de TOUS les écrans d'une app SUBGestion (v3 : SG_DOM, v2 : NX_NAV) ou de DeltaSub (NAV).
   À exécuter dans l'aperçu avec l'outil JavaScript du navigateur (contenu du fichier tel quel), puis relire le résultat :
     [window.__sgFin, window.__sgRes.length, window.__sgRes.filter(x=>/ERR|NAV |VOILE/.test(x)).join('\n')||'tout OK']
   Chaque écran est ouvert par go(id) ; on note : écran effectivement affiché, titre, erreurs JS (page et cadre Facturation),
   voile modal resté ouvert (.ov). Durée ≈ 0,5 s par écran (≈ 1 min pour SUBGestion 3) : relire par étapes, ne pas
   relancer pendant qu'un balayage tourne (deux balayages simultanés se mélangent). */
(async()=>{
  if(window.__sgEnCours) return 'déjà en cours';
  window.__sgEnCours=true; window.__sgRes=[]; window.__sgFin=false;
  const errs=[], oe=e=>errs.push(e.message||String(e.reason));
  addEventListener('error',oe); addEventListener('unhandledrejection',oe);
  const ce=console.error; console.error=(...a)=>{ errs.push('console: '+a.map(x=>x&&x.message||String(x)).join(' ').slice(0,160)); ce(...a); };
  let fw=null; try{ if(typeof fxEnsure==='function'){ fw=await fxEnsure(); fw.addEventListener('error',e=>errs.push('Facturation: '+e.message)); } }catch(e){ errs.push('cadre Facturation: '+e.message); }
  let ids=[];
  if(typeof SG_DOM!=='undefined') ids=['nx-home',...SG_DOM.filter(d=>d.k!=='accueil').flatMap(d=>['dom-'+d.k,...d.items.filter(i=>!i.hide).map(i=>i.v)])];
  else if(typeof NX_NAV!=='undefined') ids=NX_NAV.flatMap(g=>g.v?[g.v]:g.items.map(i=>i[0]));
  else if(typeof NAV!=='undefined') ids=NAV.flatMap(s=>s.items.map(i=>i[0]));
  const fiches={}; try{
    if(VIEWS['nx-projet']) fiches['nx-projet']=(DS.all('project').find(p=>+p.PROJECTSTATECODE===2)||DS.all('project')[0]||{}).ID;
    if(VIEWS['nx-contact']) fiches['nx-contact']=(DS.all('contactowner')[0]||{}).ID;
    if(VIEWS['nx-collab']) fiches['nx-collab']=(DS.all('staff')[0]||{}).ID;
  }catch(_){}
  for(const id of [...new Set([...ids,...Object.keys(fiches)])]){
    try{ go(id,fiches[id]); }catch(e){ errs.push('go: '+e.message); }
    await new Promise(r=>setTimeout(r,/^(fx-|dom-)/.test(id)?750:400));
    const voile=document.querySelectorAll('.ov').length, t=(document.getElementById('nx-title')||{}).textContent||'';
    let fx=''; const L=document.getElementById('fx-layer'); if(L&&L.classList.contains('on')&&fw){ try{ fx=' · Facturation:'+fw.eval('currentView'); }catch(_){} }
    window.__sgRes.push(id+': '+(VIEW&&VIEW.id===id?'ok':'NAV '+(VIEW&&VIEW.id))+' · '+t.slice(0,40)+fx+(voile?' · VOILE×'+voile:'')+(errs.length?' · ERR '+errs.splice(0).join(' / '):''));
    document.querySelectorAll('.ov').forEach(o=>o.remove());   // une fenêtre ouverte par erreur ne bloque pas la suite
  }
  console.error=ce; removeEventListener('error',oe); removeEventListener('unhandledrejection',oe);
  window.__sgFin=true; window.__sgEnCours=false;
})(); 'balayage lancé'

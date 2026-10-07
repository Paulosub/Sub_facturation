/* ══ SUBGestion — pont entre DeltaSub (dans le cadre) et la coquille ══
   Ajouté après le script de DeltaSub par subgestion/construire.py.
   - chaque navigation (go) est signalée à la coquille : titre et onglets de l'en-tête, Retour, reprise de session ;
   - la barre de menus (Fichier, Edition…) passe dans la barre d'outils (l'en-tête DeltaSub est masqué). */
(function(){
  const P=(window.parent&&window.parent!==window)?window.parent:null;
  document.documentElement.classList.add('sg-embed');
  const _go=window.go;
  if(typeof _go==='function') window.go=function(){
    try{ if(typeof closeMenus==='function') closeMenus(); }catch(_){}   // menu resté ouvert (navigation lancée depuis l'en-tête)
    const r=_go.apply(this,arguments);
    try{ if(P&&P.sgDsOnGo&&typeof VIEW!=='undefined'&&VIEW) P.sgDsOnGo(VIEW.id); }catch(e){ console.error(e); }
    return r; };
  const _init=window.ch10aInit;
  if(typeof _init==='function') window.ch10aInit=function(){
    const r=_init.apply(this,arguments);
    const mb=document.getElementById('ch10a-mb'), bar=document.getElementById('bar');
    if(mb&&bar&&mb.parentNode!==bar) bar.insertBefore(mb,bar.firstChild);
    return r; };
})();

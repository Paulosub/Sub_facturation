/* Sonde du banc : importe la base de test, génère l'affaire, exécute le script « après », balaie les écrans, poste le résultat. */
window.__err=[]; addEventListener('error',e=>__err.push(String(e.message)+' @'+(e.filename||'').slice(-24)+':'+e.lineno)); addEventListener('unhandledrejection',e=>__err.push('rej '+String(e.reason&&(e.reason.message||e.reason))));
(async()=>{ const sleep=ms=>new Promise(r=>setTimeout(r,ms)), post=o=>fetch('/resultat',{method:'POST',body:JSON.stringify(o)});
  const wait=async(f,ms=60000)=>{ const t=Date.now(); while(Date.now()-t<ms){ try{ if(f()) return true; }catch(_){} await sleep(100); } return false; };
  const R={};
  try{ await wait(()=>typeof LDB!=='undefined');
    if(!await LDB.meta('info')){ localStorage.setItem('ds_user','2752'); const b=await (await fetch('/base_test.json.gz')).blob(); await lbImport(new File([b],'base.json.gz')); location.reload(); return; }
    try{ SG_FR.enCours=true; }catch(_){}
    await wait(()=>typeof NX==='object'&&NX.booted&&DS.info); await sleep(1500);
    Object.assign(R,await AT.generer({jusqua:/*JUSQUA*/null}));
    const ap='/*APRES*/'; if(ap){ try{ R.apres=await (new (Object.getPrototypeOf(async function(){}).constructor)('ctx',ap))(AT.ctx); }catch(e){ R.apres={erreur:String(e&&e.stack||e)}; } }
    if(/*ECRANS*/false){ const res=[]; let ids=['nx-home',...SG_DOM.filter(d=>d.k!=='accueil').flatMap(d=>['dom-'+d.k,...d.items.filter(i=>!i.hide).map(i=>i.v)])];
      const p=DS.all('project').find(x=>x.NUMBER===AT.REF.code); const av=__err.length;
      for(const id of [...new Set(ids)]){ try{ go(id); }catch(e){ __err.push('go '+id+': '+e.message); } await sleep(/^(fx-|dom-)/.test(id)?500:220); document.querySelectorAll('.ov').forEach(o=>o.remove()); if(__err.length>av+res.length) res.push(id+' : '+__err[__err.length-1]); }
      R.ecrans={n:ids.length,erreurs:res}; }
    R.erreursPage=window.__err.slice(0,40); await post(R);
  }catch(e){ R.fatal=String(e&&e.stack||e); R.erreursPage=window.__err.slice(0,40); await post(R); } })();

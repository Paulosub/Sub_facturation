/* ═══ AFFAIRE DE TRAVAIL 99TST — SOCLE (04.11.2026) ═══
   Enchaîne les modules m*.js dans l'ordre de leur numéro, dans la page de l'aperçu. Chaque module : AT.mod(<numéro>,'<clé>','<libellé>',async ctx=>{…}).
   ctx : objet partagé, seul moyen de passer des identifiants d'un module à l'autre (voir LISEZMOI.md).
   Tout enregistrement passe par AT.commit : il est noté dans le registre (sg_meta/affaire_travail), ce qui rend le script REJOUABLE : AT.generer() commence par tout retirer.
   Rien n'est écrit ailleurs que dans la base de la page (IndexedDB) et le localStorage de la page. Ne jamais lancer sur la base du bureau. */
(function(){
const A=window.AT=window.AT||{}; A.mods=[]; A.journal=[];
const CLE_REG='affaire_travail';
A.mod=(n,k,lib,fn)=>{ A.mods.push({n,k,lib,fn}); A.mods.sort((a,b)=>a.n-b.n); };
A.log=(...m)=>{ const s=m.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' '); A.journal.push(s); console.log('[AT] '+s); };
A.att=ms=>new Promise(r=>setTimeout(r,ms));

/* ── identifiants et écriture ── */
A.ids=(t,n=1)=>DS.newIds(t,n);
A.id=async t=>{ const r=await DS.newIds(t,1); return r[0]; };
const reg=()=>A.ctx&&A.ctx.registre;
/* ops : [{t,id,val}] ; val:null = suppression. Découpé par lots pour rester rapide. Les enregistrements créés sont notés pour la purge. */
A.commit=async(ops,taille=400)=>{ ops=ops.filter(Boolean);
  for(let i=0;i<ops.length;i+=taille){ const L=ops.slice(i,i+taille).map(o=>Object.assign({bseq:((DS.S&&DS.S[o.t])||{})[String(o.id)]||0},o));
    await DS.commit(L); const R=reg(); if(R) L.forEach(o=>{ if(o.val!=null){ (R[o.t]=R[o.t]||{})[String(o.id)]=1; } else if(R[o.t]) delete R[o.t][String(o.id)]; }); }
  return ops.length; };
A.sauverRegistre=async()=>{ const R=reg(); if(!R) return; const v={ID:CLE_REG,TABLES:Object.fromEntries(Object.entries(R).map(([t,o])=>[t,Object.keys(o)])),DATE:new Date().toISOString()};
  await DS.commit([{t:'sg_meta',id:CLE_REG,val:v,bseq:((DS.S&&DS.S.sg_meta)||{})[CLE_REG]||0}]); };

/* ── dates : texte ISO partout ; jours ouvrés hors fériés vaudois ── */
const J=s=>{ const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(s||'')); return m?Math.round(Date.UTC(+m[1],+m[2]-1,+m[3])/864e5):null; };
const ISO=n=>new Date(n*864e5).toISOString().slice(0,10);
A.jour=J; A.iso=ISO;
A.plus=(iso,n)=>ISO(J(iso)+n);
A.semaine=iso=>(new Date(J(iso)*864e5).getUTCDay()+6)%7;   /* 0 = lundi */
const fer={};
A.ferie=iso=>{ const y=+String(iso).slice(0,4); if(!fer[y]){ try{ fer[y]=pubHolidays(y); }catch(_){ fer[y]=new Map(); } } return fer[y].has(iso); };
A.ouvre=iso=>A.semaine(iso)<5&&!A.ferie(iso);
A.joursOuvres=(du,au)=>{ const L=[]; for(let n=J(du),f=J(au);n<=f;n++){ const d=ISO(n); if(A.ouvre(d)) L.push(d); } return L; };
A.prochainOuvre=iso=>{ let n=J(iso); while(!A.ouvre(ISO(n))) n++; return ISO(n); };
/* générateur pseudo-aléatoire à graine : la même affaire à chaque génération */
A.alea=(graine=7)=>{ let x=graine>>>0||1; return ()=>{ x^=x<<13; x>>>=0; x^=x>>>17; x^=x<<5; x>>>=0; return x/4294967296; }; };
A.arr=(v,d=2)=>Math.round(v*10**d)/10**d;

/* ── cadre Facturation : fonctions évaluées DANS le cadre (elles voient ses let / const) ── */
A.cadre=async()=>{ const w=await fxEnsure(); return w; };
A.appel=async(fn,S)=>{ const w=await A.cadre(); w.__arg=JSON.stringify(S===undefined?null:S); return await w.eval('('+fn.toString()+')(JSON.parse(window.__arg))'); };

/* ── purge : tout ce que le registre connaît, puis les données Facturation de l'affaire ── */
A.purgeurs=[];   /* un module peut ajouter sa propre purge : A.purgeurs.push(async()=>{…}) */
A.purger=async()=>{ const m=DS.get('sg_meta',CLE_REG), T=m&&m.TABLES||{};
  await DS.need(Object.keys(T)).catch(()=>null);   /* tables lourdes : pas chargées sur une page neuve, leurs lignes échapperaient à la purge */
  for(const [t,ids] of Object.entries(T)){ const ops=ids.filter(id=>DS.get(t,/^\d+$/.test(id)?+id:id)||DS.get(t,id)).map(id=>({t,id:/^\d+$/.test(id)?+id:id,val:null}));
    if(ops.length){ A.log('purge',t,ops.length); await A.commit(ops); } }
  for(const f of A.purgeurs){ try{ await f(); }catch(e){ A.log('purge : erreur',String(e&&e.message||e)); } }
  if(m) await DS.commit([{t:'sg_meta',id:CLE_REG,val:null,bseq:((DS.S&&DS.S.sg_meta)||{})[CLE_REG]||0}]); };

/* ── onglet masqué : le navigateur freine setTimeout(0), sur lequel pdf-lib attend à chaque enregistrement. Pendant la génération seulement : file de messages, non freinée. ── */
A.sansFrein=w=>{ const o=w.setTimeout, mc=new w.MessageChannel(), q=[]; mc.port1.onmessage=()=>{ const f=q.shift(); if(f) f(); };
  w.setTimeout=function(f,d,...a){ if(d>1) return o.call(w,f,d,...a); q.push(()=>{ if(typeof f==='function') f(...a); }); mc.port2.postMessage(0); return 0; };
  return ()=>{ w.setTimeout=o; mc.port1.close(); }; };

/* ── génération : o.jusqua = dernier module à exécuter (numéro) ; o.modules = liste de clés à exécuter seules ── */
A.generer=async(o={})=>{ const R={ok:[],err:null,t0:Date.now()}; A.journal.length=0;
  try{ if(typeof SG_FR==='object'&&SG_FR) SG_FR.enCours=true; }catch(_){}
  const reste=11000-(performance.now()); if(reste>0&&!o.sansAttente){ A.log('attente du démarrage de l’app…'); await A.att(reste); }
  await DS.need(['sg_meta']).catch(()=>null);
  await A.purger();
  A.ctx={registre:{},REF:A.REF};
  await A.cadre();
  const lever=[A.sansFrein(window)]; try{ const fx=document.getElementById('fx-frame'); if(fx&&fx.contentWindow) lever.push(A.sansFrein(fx.contentWindow)); }catch(_){}
  try{ for(const m of A.mods){ if(o.jusqua!=null&&m.n>o.jusqua) break; if(o.modules&&!o.modules.includes(m.k)) continue;
    const t=Date.now(); A.log('▶ '+m.n+' '+m.lib);
    try{ await m.fn(A.ctx); await A.sauverRegistre(); R.ok.push(m.k+' ('+Math.round((Date.now()-t)/1000)+' s)'); }
    catch(e){ R.err={module:m.k,message:String(e&&e.message||e),pile:String(e&&e.stack||'').slice(0,1500)}; A.log('✗ '+m.k+' : '+R.err.message); break; } } }
  finally{ lever.forEach(f=>f()); }
  R.duree=Math.round((Date.now()-R.t0)/1000); R.journal=A.journal.slice(-200); return R; };
})();

/* ═══ 48. LECTEUR PDF DE L'APP ET FENÊTRE DES FICHIERS (08.11.2026) ═══════════════════════════════════════════════════════
   Paulo : « améliore la fenêtre PDF lorsque je clique sur PDF, adapte le design au reste de l'app ». Avant : barre blanche au nom du fichier
   (« DeltaSub PDF (08.11.26 17-22-40).pdf ») et lecteur PDF de Chrome. Désormais la fenêtre a le graphisme de la fenêtre d'aperçu des documents du
   devis (sg3_devis.js, vueDoc), choisie par Paulo le 08.11.2026 : bandeau jaune pâle (n° de l'affaire ou type du fichier en grand, filet, titre,
   pages · format · taille), chiffre « Pages », Imprimer, Télécharger, Fermer ; dessous, le lecteur de l'app.
   sgLecteurPdf(o) = lecteur commun (pdf.js du cadre Facturation, comme les aperçus de Documents Substances) : pages l'une sous l'autre, rendues à la
   demande et libérées au loin, « ‹ Page n / N › », zoom, « Ajuster à la largeur » (d'office), texte sélectionnable ; une nouvelle version du
   document (réglage du devis) garde la page affichée. Il sert à sgVisionneuse (ci-dessous) et à vueDoc.
   Corrections de la relecture du 08.11.2026 (fenêtre d'aperçu du devis) : échec d'une mise à jour signalé (message, ancienne version gardée) ;
   indicateur « Mise à jour… » et Imprimer qui attendent la DERNIÈRE version demandée (attendre / charger / echec) ; canevas plafonnés à 16 Mpx
   (forts zooms sur écran Retina) ; focus rendu au lecteur après « Page + Entrée » et après l'impression ; barre réduite à ses icônes quand la
   place manque (requête de conteneur). sgVisionneuse garde ses règles de sécurité : PDF, images, texte brut ; HTML seulement pour les documents
   faits par l'app (o.interne), dans un cadre sans scripts. Un fichier déposé (HTML, SVG, XML…) ne s'exécute jamais dans l'app. ═══ */
const SGLP_ZOOM=[25,33,50,67,75,85,100,110,125,150,175,200,250,300], SGLP_PT=96/72, SGLP_PAD=16, SGLP_GAP=14, SGLP_MPX=16e6;
const sglpIco=d=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" aria-hidden="true">'+d+'</svg>';
const SGLP_I={prec:'<path d="m15 5-7 7 7 7"/>',suiv:'<path d="m9 5 7 7-7 7"/>',moins:'<path d="M5 12h14"/>',plus:'<path d="M12 5v14M5 12h14"/>',
  larg:'<path d="M7.5 5H4v14h3.5M16.5 5H20v14h-3.5"/><path d="M8.5 12h7M10.3 10.2 8.5 12l1.8 1.8M13.7 10.2l1.8 1.8-1.8 1.8"/>',   /* « Ajuster à la largeur » : proposition 3 « Cadrage horizontal » (Paulo, 08.11.2026) — crochets de la famille du plein écran, flèche double */
  tour:'<circle cx="12" cy="12" r="8" stroke="#c9c9c7"/><path d="M12 4a8 8 0 0 1 8 8"/>',
  imp:'<path d="M7 9V4h10v5M7 17H4V9h16v8h-3M7 14h10v6H7z"/>',tel:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'};
const sglpFormat=pg=>{ if(!pg) return ''; const a=Math.max(pg.w,pg.h), b=Math.min(pg.w,pg.h), A4=Math.abs(a-842)<6&&Math.abs(b-595)<6, A3=Math.abs(a-1191)<8&&Math.abs(b-842)<8;
  return (A4?'A4':A3?'A3':Math.round(pg.w/72*25.4)+' × '+Math.round(pg.h/72*25.4)+' mm')+(pg.w>pg.h?' paysage':' portrait'); };
const sglpTaille=n=>!n?'':n>=1048576?(n/1048576).toFixed(1)+' Mo':Math.max(1,Math.round(n/1024))+' Ko';
function sglpCss(){ if(document.getElementById('sglp-css')) return; const st=document.createElement('style'); st.id='sglp-css'; st.textContent=`
.sglp{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;container-type:inline-size;font-size:13px;color:var(--s-noir)}
.sglp-bar{flex:none;height:44px;display:flex;align-items:center;gap:2px;padding:0 16px;border-bottom:1px solid var(--s-filet);background:#fff;overflow:hidden}
.sglp-bt{flex:none;width:28px;height:28px;display:inline-grid;place-items:center;padding:0;border:0;background:none;color:var(--s-noir);cursor:pointer}
.sglp-bt svg{width:16px;height:16px}
.sglp-bt:disabled{opacity:.3;cursor:default}
.sglp-bt:not(:disabled):hover,.sglp-ib:hover{background:var(--s-jaune3)}
.sglp-ib{flex:none;display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 8px;border:0;background:none;font:inherit;font-size:12.5px;font-weight:700;color:var(--s-noir);cursor:pointer;white-space:nowrap}
.sglp-ib svg{width:16px;height:16px;flex:none}
.sglp-ib.on{box-shadow:inset 0 -2px 0 var(--s-nuit)}
.sglp-pg{flex:none;display:inline-flex;align-items:center;gap:6px;margin:0 4px;font-size:12.5px;font-weight:700;white-space:nowrap}
.sglp-in{width:38px;height:26px;border:1px solid var(--s-gris3);background:#fff;font:inherit;font-weight:700;text-align:center;font-variant-numeric:tabular-nums;border-radius:0;padding:0}
.sglp-in:focus{outline:2px solid var(--s-nuit);outline-offset:-2px}
.sglp-pg .tot{font-weight:400;color:var(--s-gris)}
.sglp-sep{flex:none;width:1px;height:18px;background:var(--s-gris3);margin:0 10px}
.sglp-zm{flex:none;min-width:46px;text-align:center;font-size:12.5px;font-weight:700;font-variant-numeric:tabular-nums}
.sglp-maj{margin-left:auto;flex:none;display:inline-flex;align-items:center;gap:7px;font-size:12px;white-space:nowrap;visibility:hidden}
.sglp-maj.on{visibility:visible}
.sglp-maj b{color:var(--s-nuit);font-weight:700}
.sglp-maj svg{width:15px;height:15px;color:var(--s-nuit);animation:sglp-tour 1s linear infinite}
@keyframes sglp-tour{to{transform:rotate(360deg)}}
@container (max-width:600px){.sglp-bar{padding:0 8px}.sglp-ib .lib,.sglp-maj b{display:none}.sglp-sep{margin:0 4px}.sglp-pg{margin:0 2px}}
.sglp-vue{position:relative;flex:1;min-height:0;overflow:auto;background:var(--s-filet);outline:none}
.sglp-vue:focus-visible{box-shadow:inset 0 0 0 2px var(--s-nuit)}
.sglp-pages{position:relative;display:flex;flex-direction:column;align-items:center;gap:14px;padding:16px 24px;box-sizing:border-box;min-width:min-content}
.sglp-p{position:relative;flex:none;background:#fff;box-shadow:0 1px 3px rgba(29,29,27,.18)}
.sglp-p canvas{display:block;width:100%;height:100%}
.sglp-msg{margin:40px auto;color:var(--s-gris);font-size:13px;text-align:center;max-width:520px}
.sglp-msg.err{color:var(--s-rouge,#bd1e42)}
.sglp .textLayer{position:absolute;text-align:initial;inset:0;overflow:hidden;opacity:1;line-height:1;-webkit-text-size-adjust:none;text-size-adjust:none;forced-color-adjust:none;transform-origin:0 0;z-index:2}
.sglp .textLayer :is(span,br){color:transparent;position:absolute;white-space:pre;cursor:text;transform-origin:0% 0%}
.sglp .textLayer span.markedContent{top:0;height:0}
.sglp .textLayer ::selection{background:rgba(0,51,70,.25)}
.sglp .textLayer br::selection{background:transparent}
.sg-visu.sglv-ov{align-items:center;padding:3vh 2vw}
.sglv{width:min(1240px,96vw);height:92vh;max-height:94vh;display:flex;flex-direction:column;background:#fff;border-top:2px solid var(--s-noir);box-shadow:0 18px 50px rgba(0,0,0,.28);font-size:13px;color:var(--s-noir);outline:none}
.sglv-tete{flex:none;display:flex;align-items:center;gap:22px;background:var(--s-jaune2);padding:12px 18px 12px 24px;border-bottom:1px solid var(--s-noir)}
.sglv-ini{align-self:stretch;display:flex;align-items:center;padding-right:18px;border-right:2px solid var(--s-noir);font-size:28px;font-weight:700;color:var(--s-nuit);line-height:1;white-space:nowrap}
.sglv-nm{flex:1;min-width:0}
.sglv-nm .lb{font-size:11px;font-weight:700;color:var(--s-gris);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sglv-nm h3{margin:0;font-size:21px;font-weight:700;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sglv-nm .mt{font-size:12px;color:var(--s-gris);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:15px}
.sglv-fig{flex:none;display:flex;flex-direction:column;align-items:flex-start;padding-left:16px;border-left:1px solid var(--s-gris3)}
.sglv-fig .l{font-size:11px;font-weight:700;color:var(--s-gris)}
.sglv-fig .v{font-size:22px;font-weight:700;line-height:1.15;font-variant-numeric:tabular-nums}
.sglv-act{flex:none;display:flex;align-items:center;gap:2px;margin-left:6px}
.sglv-ib{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 10px;border:0;background:none;font:inherit;font-size:12.5px;font-weight:700;color:var(--s-noir);cursor:pointer;white-space:nowrap}
.sglv-ib svg{width:16px;height:16px;flex:none}
.sglv-ib:hover{background:var(--s-jaune)}
.sglv-btn{height:34px;min-width:96px;margin-left:10px;padding:0 18px;border:2px solid var(--s-nuit);background:var(--s-nuit);font:inherit;font-size:13px;font-weight:700;color:#fff;cursor:pointer;border-radius:0}
.sglv-btn:hover{background:var(--s-nuit2);border-color:var(--s-nuit2)}
.sglv-corps{flex:1;min-height:0;display:flex;flex-direction:column;background:var(--s-filet)}
.sglv-corps>iframe{flex:1;border:0;background:#fff;width:100%}
.sglv-img{flex:1;min-height:0;overflow:auto;display:flex;align-items:center;justify-content:center;padding:16px 24px}
.sglv-img img{max-width:100%;max-height:100%;background:#fff;box-shadow:0 1px 3px rgba(29,29,27,.18)}
.sglv-corps>.nx-empty{flex:1;background:#fff;margin:0}
@media (max-width:820px){.sglv-fig{display:none}.sglv-ib .lib{display:none}.sglv-tete{gap:14px;padding:10px 12px 10px 16px}.sglv-ini{font-size:22px;padding-right:12px}.sglv-btn{min-width:0}}
`; document.head.append(st); }
/* impression d'un PDF (ou d'une image) par un cadre caché ; le focus revient ensuite à « retour » (relecture : il restait dans le cadre caché) */
function sglpImprimer(blob,retour){ if(!blob) return; const u=URL.createObjectURL(blob), f=document.createElement('iframe');
  f.style.cssText='position:fixed;right:0;bottom:0;width:2px;height:2px;border:0;opacity:0;pointer-events:none'; f.src=u;
  const rendre=()=>{ try{ window.focus(); }catch(_){} try{ if(retour&&retour.isConnected) retour.focus({preventScroll:true}); }catch(_){} };
  f.onload=()=>setTimeout(()=>{ try{ f.contentWindow.addEventListener('afterprint',()=>setTimeout(rendre,0),{once:true}); }catch(_){}
    try{ f.contentWindow.focus(); f.contentWindow.print(); }catch(e){ window.open(u,'_blank'); } setTimeout(rendre,0); },250);
  document.body.append(f); setTimeout(()=>{ f.remove(); URL.revokeObjectURL(u); },120000); }
/* impression d'une image : cadre SANS scripts (sandbox sans allow-scripts) qui ne contient qu'un <img> — un SVG déposé n'est jamais chargé comme document,
   ses scripts ne s'exécutent pas (relecture du 08.11.2026) */
function sglpImprimerImage(url,retour){ const f=document.createElement('iframe'); f.setAttribute('sandbox','allow-same-origin allow-modals');
  f.style.cssText='position:fixed;right:0;bottom:0;width:2px;height:2px;border:0;opacity:0;pointer-events:none';
  f.srcdoc='<!doctype html><meta charset="utf-8"><style>@page{margin:10mm}html,body{margin:0;height:100%}img{display:block;max-width:100%;max-height:100%;margin:0 auto;object-fit:contain}</style><img src="'+String(url).replace(/"/g,'&quot;')+'" alt="">';
  const rendre=()=>{ try{ window.focus(); }catch(_){} try{ if(retour&&retour.isConnected) retour.focus({preventScroll:true}); }catch(_){} };
  f.onload=()=>{ const im=f.contentDocument&&f.contentDocument.querySelector('img'), go=()=>setTimeout(()=>{ try{ f.contentWindow.focus(); f.contentWindow.print(); }catch(e){ toast('Impression : utilisez Télécharger puis imprimez.',true); } setTimeout(rendre,0); },150);
    if(im&&!im.complete){ im.onload=go; im.onerror=go; } else go(); };
  document.body.append(f); setTimeout(()=>f.remove(),120000); }
/* message en français pour les erreurs de pdf.js (relecture : « No password given » s'affichait tel quel) */
const sglpErreur=e=>{ const n=String(e&&e.name||''); if(n==='PasswordException') return 'ce PDF est protégé par un mot de passe : utilisez « Télécharger » pour l’ouvrir avec son mot de passe.';
  if(n==='InvalidPDFException'||n==='MissingPDFException') return 'le fichier PDF est illisible ou abîmé.'; return String(e&&e.message||e); };
/* lecteur PDF : o.surInfo({n, page, taille, titre}) à chaque document affiché ; o.surEchec(e) quand une mise à jour échoue */
function sgLecteurPdf(o){ o=o||{}; sglpCss();
  const R=document.createElement('div'); R.className='sglp';
  R.innerHTML='<div class="sglp-bar">'
      +'<button class="sglp-bt" data-a="prec" type="button" title="Page précédente">'+sglpIco(SGLP_I.prec)+'</button>'
      +'<span class="sglp-pg">Page <input class="sglp-in" inputmode="numeric" aria-label="Page"><span class="tot">/ —</span></span>'
      +'<button class="sglp-bt" data-a="suiv" type="button" title="Page suivante">'+sglpIco(SGLP_I.suiv)+'</button><span class="sglp-sep"></span>'
      +'<button class="sglp-bt" data-a="moins" type="button" title="Réduire">'+sglpIco(SGLP_I.moins)+'</button><span class="sglp-zm">—</span>'
      +'<button class="sglp-bt" data-a="plus" type="button" title="Agrandir">'+sglpIco(SGLP_I.plus)+'</button>'
      +'<button class="sglp-ib on" data-a="larg" type="button" title="Ajuster à la largeur">'+sglpIco(SGLP_I.larg)+'<span class="lib">Ajuster à la largeur</span></button>'
      +'<span class="sglp-maj" role="status" title="Le document se met à jour ; la page affichée est gardée">'+sglpIco(SGLP_I.tour)+'<b>Mise à jour…</b></span></div>'
    +'<div class="sglp-vue" tabindex="0" aria-label="Document"><div class="sglp-pages"><div class="sglp-msg">Préparation du document…</div></div></div>';
  const vue=R.querySelector('.sglp-vue'), cont=R.querySelector('.sglp-pages'), maj=R.querySelector('.sglp-maj'), inP=R.querySelector('.sglp-in'),
    totP=R.querySelector('.sglp-pg .tot'), zm=R.querySelector('.sglp-zm'), bLarg=R.querySelector('[data-a="larg"]'), bPrec=R.querySelector('[data-a="prec"]'), bSuiv=R.querySelector('[data-a="suiv"]');
  const V={pdf:null,lib:null,pages:[],geo:[],zoom:'l',s:1,tok:0,rt:0,blob:null,vivant:true,attendu:false,charge:false,apres:[],cible:null,protege:false};
  /* indicateur : allumé tant qu'une version est demandée (attendre) ou en cours d'affichage ; ce qui attend la version à jour (impression) part ensuite */
  const etat=()=>{ const on=V.attendu||V.charge; maj.classList.toggle('on',on);
    if(!on&&V.apres.length){ V.apres.splice(0).forEach(f=>{ try{ f(); }catch(e){ console.error(e); } }); } };
  const echelle=()=>{ const mw=Math.max(1,...V.pages.map(x=>x.w)); return V.zoom==='l'?Math.max(.2,(vue.clientWidth-2*24-12)/mw):V.zoom/100*SGLP_PT; };
  const geometrie=s=>{ let y=SGLP_PAD; return V.pages.map(pg=>{ const g={y,w:Math.round(pg.w*s),h:Math.round(pg.h*s)}; y+=g.h+SGLP_GAP; return g; }); };
  /* mise en page en cours (poser avant fin) : la position demandée fait foi — l'ancien défilement ne correspond plus à la nouvelle géométrie (relecture : deux zooms rapides sautaient de page) */
  const position=()=>{ if(V.cible) return Object.assign({},V.cible); const st=vue.scrollTop; for(let k=V.geo.length-1;k>=0;k--){ const g=V.geo[k]; if(g.y<=st+1) return {k,f:Math.min(1,Math.max(0,(st-g.y)/Math.max(1,g.h+SGLP_GAP)))}; } return {k:0,f:0}; };
  const pageCourante=()=>{ if(V.cible) return Math.min(V.cible.k,Math.max(0,V.geo.length-1)); const st=vue.scrollTop+vue.clientHeight*.3; let k=0; V.geo.forEach((g,j)=>{ if(g.y<=st) k=j; }); return k; };
  const tete=()=>{ const n=V.pages.length, k=n?pageCourante():0; totP.textContent='/ '+(n||'—'); zm.textContent=n?Math.round(V.s/SGLP_PT*100)+' %':'—';
    if(document.activeElement!==inP) inP.value=n?k+1:''; bPrec.disabled=!n||k<=0; bSuiv.disabled=!n||k>=n-1; bLarg.classList.toggle('on',V.zoom==='l'); };
  const vider=div=>{ div.querySelectorAll('canvas,.textLayer').forEach(x=>x.remove()); div._s=null; };
  const rendrePage=async(k,div,t)=>{ const pg=V.pages[k], s=V.s, dpr=Math.min(2,window.devicePixelRatio||1); let sc=s*dpr;
    if(pg.w*pg.h*sc*sc>SGLP_MPX) sc=Math.sqrt(SGLP_MPX/(pg.w*pg.h));   /* canevas plafonné (relecture : ~128 Mo par page à 300 % sur Retina) ; la taille affichée ne change pas */
    const vp=pg.p.getViewport({scale:sc}), cv=document.createElement('canvas'); cv.width=Math.round(vp.width); cv.height=Math.round(vp.height);
    await pg.p.render({canvasContext:cv.getContext('2d'),viewport:vp,intent:'print'}).promise;   /* « print » : sans requestAnimationFrame du cadre Facturation, masqué */
    if(t!==V.rt||!V.vivant) return; vider(div); div.prepend(cv); div._s=s;
    try{ const tl=document.createElement('div'); tl.className='textLayer'; tl.style.setProperty('--scale-factor',String(s));
      V.lib.renderTextLayer({textContentSource:pg.p.streamTextContent(),container:tl,viewport:pg.p.getViewport({scale:s}),textDivs:[]}).promise.then(()=>{ if(div._s===s&&t===V.rt) div.append(tl); },()=>{}); }catch(_){} };
  let file=Promise.resolve();
  const visibles=()=>{ if(!V.pdf||V.cible) return; const t=V.rt, st=vue.scrollTop, vh=vue.clientHeight, divs=cont.children;
    V.geo.forEach((g,k)=>{ const d=divs[k]; if(!d||!d.classList.contains('sglp-p')) return; const pres=g.y+g.h>st-vh&&g.y<st+2*vh, loin=g.y+g.h<st-4*vh||g.y>st+5*vh;
      if(pres&&d._s!==V.s&&!d._file){ d._file=true; file=file.then(()=>t===V.rt?rendrePage(k,d,t):null).catch(e=>console.error(e)).then(()=>{ d._file=false; }); }
      else if(loin&&d._s) vider(d); }); tete(); };
  const poser=(pos,av)=>{ V.s=echelle(); V.geo=geometrie(V.s); V.rt++; V.cible=av?Object.assign({k:0,f:0},pos):null;
    const divs=V.geo.map((g,k)=>{ const d=document.createElement('div'); d.className='sglp-p'; d.style.width=g.w+'px'; d.style.height=g.h+'px'; d.setAttribute('aria-label','Page '+(k+1)+' sur '+V.geo.length); return d; });
    const gk=pos&&V.geo[Math.min(pos.k,V.geo.length-1)], cible=gk?Math.round(gk.y+pos.f*(gk.h+SGLP_GAP)):0;
    const fin=()=>{ if(!V.vivant) return; V.cible=null; cont.replaceChildren(...divs); cont.style.height=(V.geo.length?V.geo[V.geo.length-1].y+V.geo[V.geo.length-1].h+SGLP_PAD:0)+'px'; vue.scrollTop=cible; visibles(); };
    if(!av){ fin(); return Promise.resolve(); }
    /* mise à jour : pages visibles rendues d'abord, puis échange (pas de page blanche, pas de retour en haut) */
    const t=V.rt, vh=vue.clientHeight, ks=V.geo.map((g,k)=>k).filter(k=>V.geo[k].y+V.geo[k].h>cible&&V.geo[k].y<cible+vh);
    return ks.reduce((pr,k)=>pr.then(()=>t===V.rt?rendrePage(k,divs[k],t):null),Promise.resolve()).catch(e=>console.error(e)).then(()=>{ if(t===V.rt) fin(); }); };
  const message=(txt,err)=>{ V.geo=[]; cont.style.height=''; const d=document.createElement('div'); d.className='sglp-msg'+(err?' err':''); d.textContent=txt; cont.replaceChildren(d); };
  const charger=async blob=>{ const t=++V.tok, ancien=V.blob; V.blob=blob; V.attendu=false; V.charge=true; etat(); const av=!!V.pdf;
    try{ const w=await fxEnsure(); await w.offreLoadPdfJs(); const buf=await blob.arrayBuffer(); if(t!==V.tok||!V.vivant) return;
      const pdf=await w.pdfjsLib.getDocument({data:new w.Uint8Array(buf),ownerDocument:document}).promise; if(t!==V.tok||!V.vivant){ pdf.destroy(); return; }
      const pages=[]; for(let n=1;n<=pdf.numPages;n++) pages.push(await pdf.getPage(n)); if(t!==V.tok||!V.vivant){ pdf.destroy(); return; }
      let titre=''; if(!av) try{ const md=await pdf.getMetadata(); titre=String(md&&md.info&&md.info.Title||'').trim(); }catch(_){}
      const pos=av?position():null, old=V.pdf; V.lib=w.pdfjsLib; V.pdf=pdf; V.pages=pages.map(pg=>{ const v=pg.getViewport({scale:1}); return {p:pg,w:v.width,h:v.height}; });
      if(!V.pages.length) throw new Error('document sans page');
      await poser(pos,av); if(old) try{ old.destroy(); }catch(_){}
      if(o.surInfo) try{ o.surInfo({n:V.pages.length,page:V.pages[0],taille:blob.size,titre}); }catch(e){ console.error(e); }
    }catch(e){ console.error(e); if(t===V.tok&&V.vivant){ V.apres=[];
        /* relecture : une mise à jour qui échoue n'est plus muette ; l'ancienne version reste affichée et c'est elle qu'on imprime */
        if(av&&V.pdf){ V.blob=ancien; toast('Le document n’a pas pu être mis à jour : '+sglpErreur(e),true); if(o.surEchec) try{ o.surEchec(e); }catch(_){} }
        else { try{ V.pdf&&V.pdf.destroy(); }catch(_){} V.pdf=null; V.pages=[]; V.protege=String(e&&e.name||'')==='PasswordException'; message('Le document n’a pas pu être affiché : '+sglpErreur(e),true); } } }
    finally{ if(t===V.tok){ V.charge=false; etat(); } tete(); } };
  const allerA=k=>{ k=Math.max(0,Math.min(V.geo.length-1,k)); if(V.geo[k]) vue.scrollTop=V.geo[k].y-SGLP_PAD+2; };
  const zoomer=d=>{ const cur=Math.round(V.s/SGLP_PT*100); let z; if(d>0) z=SGLP_ZOOM.find(x=>x>cur+0.5)||SGLP_ZOOM[SGLP_ZOOM.length-1]; else z=[...SGLP_ZOOM].reverse().find(x=>x<cur-0.5)||SGLP_ZOOM[0]; V.zoom=z; if(V.pdf) poser(position(),true); tete(); };
  R.querySelector('.sglp-bar').addEventListener('click',e=>{ const b=e.target.closest&&e.target.closest('[data-a]'); if(!b||b.disabled) return; const a=b.dataset.a;
    if(a==='prec') allerA(pageCourante()-1); else if(a==='suiv') allerA(pageCourante()+1); else if(a==='moins') zoomer(-1); else if(a==='plus') zoomer(1);
    else if(a==='larg'){ V.zoom='l'; if(V.pdf) poser(position(),true); tete(); } });
  inP.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); const n=parseInt(inP.value,10); if(n) allerA(n-1); try{ vue.focus({preventScroll:true}); }catch(_){} } });   /* relecture : le focus reste dans la fenêtre (Échap la ferme encore) */
  inP.addEventListener('blur',()=>tete());
  let att=null; vue.addEventListener('scroll',()=>{ clearTimeout(att); att=setTimeout(visibles,60); tete(); });
  let ro=null, rt=null; try{ ro=new ResizeObserver(()=>{ clearTimeout(rt); rt=setTimeout(()=>{ if(V.pdf&&V.zoom==='l'&&Math.abs(echelle()-V.s)>.004) poser(position(),true); },150); }); ro.observe(vue); }catch(_){}
  const L={el:R,vue,charger,
    attendre(){ V.attendu=true; etat(); },                                        /* une nouvelle version est demandée (réglage du devis) */
    echec(e){ V.attendu=false; V.apres=[]; etat(); if(V.pdf){ toast('Le document n’a pas pu être mis à jour : '+sglpErreur(e),true); if(o.surEchec) try{ o.surEchec(e); }catch(_){} }
      else message('PDF impossible : '+sglpErreur(e),true); },
    imprimer(){ if(V.protege){ toast('Ce PDF est protégé par un mot de passe : utilisez « Télécharger » pour l’ouvrir et l’imprimer.',true); return; }
      if(V.attendu||V.charge){ if(!V.apres.some(f=>f._imp)){ const f=()=>sglpImprimer(V.blob,vue); f._imp=1; V.apres.push(f); } toast('Impression dès que le document est à jour…'); return; }
      if(!V.blob){ toast('Le document est en préparation.',true); return; } sglpImprimer(V.blob,vue); },
    focus(){ try{ vue.focus({preventScroll:true}); }catch(_){} },
    get blob(){ return V.blob; }, get n(){ return V.pages.length; }, get premiere(){ return V.pages[0]||null; },
    fini(){ if(!V.vivant) return; V.vivant=false; V.tok++; V.rt++; V.apres=[]; try{ ro&&ro.disconnect(); }catch(_){} try{ V.pdf&&V.pdf.destroy(); }catch(_){} V.pdf=null; } };
  tete(); return L; }

/* ── fenêtre des fichiers : PDF (lecteur ci-dessus), images, texte brut, documents HTML de l'app ── */
const SGLV_APERCU=/^\S+ PDF \((\d\d)\.(\d\d)\.(\d\d) (\d\d)-(\d\d)-(\d\d)\)\.pdf$/i;   /* nom des aperçus du moteur (ch03bNomApercu) */
const sglvProjet=txt=>{ try{ if(typeof DS==='undefined'||!txt) return ''; const s=String(txt); let best='';
    DS.all('project').forEach(p=>{ const n=String(p.NUMBER||'').trim(); if(n.length<3||n.length<=best.length) return;
      const i=s.indexOf(n); if(i<0) return; const av=s[i-1], ap=s[i+n.length]; if((av&&/[A-Za-z0-9]/.test(av))||(ap&&/[A-Za-z0-9]/.test(ap))) return; best=n; });
    return best; }catch(_){ return ''; } };
function sgVisionneuse(b,nom,o){ o=o||{}; sglpCss(); const t=String(b.type||'').toLowerCase().split(';')[0].trim();
  const vue=t==='application/pdf'?'pdf':/^image\/(png|jpe?g|gif|webp|bmp|svg\+xml)$/.test(t)?'img':/^text\/(plain|csv|tab-separated-values)$/.test(t)?'txt':t==='text/html'&&o.interne?'html':null;
  nom=String(nom||'fichier'); const ap=SGLV_APERCU.exec(nom), ext=(/\.([a-z0-9]{1,5})$/i.exec(nom)||[])[1]||'';
  let titre=String(o.titre||b._sgTitre||'').trim()||(ap?'':nom.replace(/\.[a-z0-9]{1,5}$/i,''));
  const nomDl=()=>ap?String(titre||'Aperçu').replace(/[\\/:*?"<>|]+/g,'-')+'.pdf':nom;
  const lb=ap?'Aperçu du '+ap[1]+'.'+ap[2]+'.20'+ap[3]+' à '+ap[4]+':'+ap[5]:({pdf:'Document PDF',img:'Image',txt:'Texte',html:'Document'})[vue]||'Fichier';
  const ini=sglvProjet(titre+' '+nom)||(vue==='html'?'DOC':(ext||vue||'?').toUpperCase());
  const u=URL.createObjectURL(vue==='txt'?new Blob([b],{type:'text/plain;charset=utf-8'}):b), avant=document.activeElement;
  const ov=h('div',{class:'sg-visu sglv-ov'}), box=h('div',{class:'sglv',role:'dialog','aria-modal':'true','aria-label':titre||nom,tabindex:'-1'});
  box.innerHTML='<div class="sglv-tete"><div class="sglv-ini">'+nxE(ini)+'</div><div class="sglv-nm"><div class="lb">'+nxE(lb)+'</div><h3></h3><div class="mt"></div></div>'
    +(vue==='pdf'?'<div class="sglv-fig"><span class="l">Pages</span><span class="v sglv-np">—</span></div>':'')
    +'<div class="sglv-act">'+(vue?'<button class="sglv-ib" data-a="imp" type="button" title="Imprimer">'+sglpIco(SGLP_I.imp)+'<span class="lib">Imprimer</span></button>':'')
    +'<button class="sglv-ib" data-a="tel" type="button" title="Télécharger « '+nxE(nomDl())+' »">'+sglpIco(SGLP_I.tel)+'<span class="lib">Télécharger</span></button>'
    +'<button class="sglv-btn" data-a="fermer" type="button">Fermer</button></div></div><div class="sglv-corps"></div>';
  const h3=box.querySelector('h3'), mt=box.querySelector('.mt'), corps=box.querySelector('.sglv-corps');
  const nommer=()=>{ h3.textContent=titre||(ap?'Aperçu PDF':nom); h3.title=h3.textContent; box.setAttribute('aria-label',h3.textContent); };
  nommer(); mt.textContent=sglpTaille(b.size);
  let L=null, ifr=null;
  if(vue==='pdf'){ L=sgLecteurPdf({surInfo:inf=>{ if(!titre&&inf.titre){ titre=inf.titre; nommer(); const bt=box.querySelector('[data-a="tel"]'); if(bt) bt.title='Télécharger « '+nomDl()+' »'; }
      const np=box.querySelector('.sglv-np'); if(np) np.textContent=inf.n; mt.textContent=[inf.n+(inf.n>1?' pages':' page'),sglpFormat(inf.page),sglpTaille(inf.taille)].filter(Boolean).join(' · '); }});
    corps.append(L.el); L.charger(b); }
  else if(vue==='img'){ const im=h('img',{src:u,alt:titre||nom}); im.onload=()=>{ mt.textContent=[im.naturalWidth+' × '+im.naturalHeight+' px',sglpTaille(b.size)].join(' · '); };
    corps.append(h('div',{class:'sglv-img'},im)); }
  else if(vue){ ifr=h('iframe',{src:u,title:titre||nom,sandbox:'allow-same-origin allow-modals'}); corps.append(ifr); }
  else corps.append(h('div',{class:'nx-empty'},'Aperçu impossible pour ce type de fichier : utilisez « Télécharger ».'));
  let ouvert=true;
  const fermer=()=>{ if(!ouvert) return; ouvert=false; try{ L&&L.fini(); }catch(_){} ov.remove(); URL.revokeObjectURL(u); document.removeEventListener('keydown',esc,true);
    try{ if(avant&&avant.isConnected&&avant.focus) avant.focus({preventScroll:true}); }catch(_){} };
  const imprimer=()=>{ if(L) return L.imprimer(); if(vue==='img') return sglpImprimerImage(u,box);
    if(ifr) try{ ifr.contentWindow.focus(); ifr.contentWindow.print(); setTimeout(()=>{ try{ box.focus({preventScroll:true}); }catch(_){} },0); }catch(_){ toast('Impression : utilisez Télécharger puis imprimez.',true); } };
  const telecharger=()=>{ const a=h('a',{href:u,download:nomDl()}); document.body.append(a); a.click(); a.remove(); };
  const esc=e=>{ if(e.key!=='Escape'||!ouvert) return; const tous=[...document.querySelectorAll('.sg-visu')]; if(tous[tous.length-1]!==ov||document.querySelector('.menu')) return;
    e.stopPropagation(); e.preventDefault(); fermer(); };
  box.addEventListener('click',e=>{ const x=e.target.closest&&e.target.closest('[data-a]'); if(!x||!box.querySelector('.sglv-tete').contains(x)) return; const a=x.dataset.a;
    if(a==='fermer') fermer(); else if(a==='tel') telecharger(); else if(a==='imp') imprimer(); });
  ov.append(box); document.body.append(ov); document.addEventListener('keydown',esc,true);
  setTimeout(()=>{ try{ (L?L.vue:box).focus({preventScroll:true}); }catch(_){} },0);
  return {fermer,imprimer,telecharger,lecteur:L}; }

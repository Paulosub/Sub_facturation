/* Bloc 61 — Proposition ▸ Carte · variantes 6 à 10 (23.11.2026), ajoutées aux variantes 1 à 5 du bloc 60 (sg3_carte_variantes.js).
   Paulo : « copier les variantes 6 à 10 dans proposition » (maquette du même jour : subgestion3/_backup_20261123_maquette_carte3/).
   6 Planche · sites (aquarelle verte, une vignette du site par projet) · 7 Chronologie (l'histoire du bureau mois par mois, lecture animée) ·
   8 Relief · colonnes (plan incliné, colonnes = heures ou honoraires) · 9 Réseau · équipe et clients (arcs depuis le bureau, projets d'un même maître
   de l'ouvrage reliés) · 10 Cartogramme · communes (une case par commune, chiffres et finances par district).
   Enregistrées par window.SGCV.ajouter (mêmes outils que le bloc 60 : carte, fonds, données, fiche) ; menu dans SG_DOM (sg3.js). Rien n'est écrit dans la base. */
(()=>{
'use strict';
if(window.__sgcv3||!window.SGCV||!window.SGCV.outils) return; window.__sgcv3=1;
const MK=window.SGCV, T=MK.outils;
const {E,N0,HR,KM,MOIS,AUJ,DIR,ini,PH,PH_ORD,CAT,SC,projets,X,placés,Carte,fond,FONDS,dedans,burSvg,tipP,tipDe,fiche,actions,seg,segs}=T;
Object.assign(FONDS,{
  aqua:{papier:'#DCE8DC',eau:{plein:'#BCD4DB'},bati:['#2C6A4F',.82],ext:['#2C6A4F',.32],route:['#FFFFFF',.95]},     /* 6 : aquarelle verte, rues blanches */
  sable:{papier:'#F2EEE6',eau:{plein:'#C7D1CD'},bati:['#1d1d1b',.12],ext:['#5E6E6B',.34],route:['#4E5E5B',.6]},   /* 7 : papier sable, eau gris-vert */
  maquette:{papier:'#FFFFFF',eau:{plein:'#E3E9EC'},bati:['#1d1d1b',.17],ext:['#1d1d1b',.14],route:['#1d1d1b',.22]}});/* 8 : maquette blanche */
const idDe=v=>isNaN(+v)?v:+v;
const nuance=(hex,f)=>{ const n=parseInt(hex.slice(1),16), c=[n>>16,(n>>8)&255,n&255].map(v=>Math.max(0,Math.min(255,Math.round(f>1?v+(255-v)*(f-1):v*f)))); return '#'+c.map(v=>v.toString(16).padStart(2,'0')).join(''); };
const PLAY='<svg viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>', PAUSE='<svg viewBox="0 0 16 16"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor"/></svg>';

/* ═══ 6. PLANCHE · SITES — aquarelle verte (bâtiments verts, rues blanches), une vignette du site de chaque projet au 1:5000 environ ═══ */
function P6(z){
  z.innerHTML='<div class="sgcv-p6"><div class="sgcv-p6-l"><div class="sgcv-p6-m"></div><div class="sgcv-p6-f"></div></div><div class="sgcv-p6-r"><div class="sgcv-p6-bar"></div><div class="sgcv-p6-g"></div></div></div>';
  const st={tri:sessionStorage.getItem('sgcv6_tri')||'act'}; let its=[], cle='';
  const Fi=z.querySelector('.sgcv-p6-f'), bar=z.querySelector('.sgcv-p6-bar'), G=z.querySelector('.sgcv-p6-g'), RES=1.7;
  const C=Carte(z.querySelector('.sgcv-p6-m'),{fond:FONDS.aqua,pad:50,
    dessus:api=>{ let s=''; its.forEach(x=>{ const [a,b]=api.px(x.E,x.N); if(!dedans(api,a,b)) return; const on=x.id===MK.sel;
      s+='<g data-id="'+E(x.id)+'" transform="translate('+a.toFixed(1)+' '+b.toFixed(1)+')"><circle r="'+(on?8:5)+'" fill="'+(on?'#FFF266':'#BD1E42')+'" stroke="'+(on?'#1d1d1b':'#FFFFFF')+'" stroke-width="'+(on?2:1.6)+'"/>'+(on?'<text x="11" y="4" class="halo">'+E(x.p.NUMBER)+'</text>':'')+'</g>'; });
      return s+burSvg(api); },
    tip:t=>tipDe(t,its), choisir:id=>choisir(id,true), vide:()=>choisir(null) });
  const TRI={act:['Activité',(a,b)=>b.I.h30-a.I.h30||b.I.htot-a.I.htot],ph:['Avancement',(a,b)=>PH_ORD.indexOf(a.cl)-PH_ORD.indexOf(b.cl)||String(a.p.NUMBER).localeCompare(String(b.p.NUMBER))],
    com:['Commune',(a,b)=>String(a.li&&a.li.com||'~').localeCompare(String(b.li&&b.li.com||'~'))],num:['Numéro',(a,b)=>String(a.p.NUMBER).localeCompare(String(b.p.NUMBER))]};
  function choisir(id,defiler){ MK.sel=id; C.redraw(); G.querySelectorAll('.sgcv-vg').forEach(v=>v.classList.toggle('on',v.dataset.id===String(id)));
    if(defiler&&id!=null){ const v=G.querySelector('.sgcv-vg[data-id="'+CSS.escape(String(id))+'"]'); if(v) v.scrollIntoView({behavior:'smooth',block:'nearest'}); }
    const x=its.find(z=>z.id===id); Fi.innerHTML=x?fiche(x,{cls:'p6'}):'<div class="vide">Choisissez un site (carte ou vignette) pour voir sa fiche.</div>'; }
  /* vignettes dessinées quand elles deviennent visibles, trois à la fois */
  const file=[]; let n=0;
  const io=new IntersectionObserver(L=>L.forEach(e=>{ if(e.isIntersecting){ io.unobserve(e.target); file.push(e.target); suite(); } }),{rootMargin:'250px'});
  function suite(){ while(n<3&&file.length){ const el=file.shift(); n++; vignette(el).finally(()=>{ n--; suite(); }); } }
  async function vignette(el){ const x=its.find(z=>String(z.id)===el.dataset.id); if(!x) return; const pl=el.querySelector('.pl'), w=pl.clientWidth||240, hh=pl.clientHeight||160, r=Math.min(1.5,window.devicePixelRatio||1);
    const U={E:x.E,N:x.N,res:RES,w,h:hh,r,pw:Math.round(w*r),ph:Math.round(hh*r),bb:[x.E-w/2*RES,x.N-hh/2*RES,x.E+w/2*RES,x.N+hh/2*RES]};
    try{ const c=await fond(U,FONDS.aqua); c.className='cv'; pl.prepend(c); }catch(_){ pl.classList.add('err'); } }
  function planche(){ const L=its.slice().sort(TRI[st.tri][1]);
    bar.innerHTML='<span class="t">'+L.length+' sites</span><span class="dr"><span class="l">Trier par</span>'+seg('tri',st.tri,Object.entries(TRI).map(([k,v])=>[k,v[0]]))+'</span>';
    segs(bar,(k,v)=>{ st.tri=v; sessionStorage.setItem('sgcv6_tri',v); planche(); });
    G.innerHTML=L.map(x=>{ const I=x.I, pct=I.hprev?Math.min(100,I.htot/I.hprev*100):null;
      return '<button type="button" class="sgcv-vg'+(x.id===MK.sel?' on':'')+'" data-id="'+E(x.id)+'"><span class="pl"><i class="pt"></i><span class="ech"><i style="width:'+(100/RES).toFixed(0)+'px"></i>100 m</span></span>'
        +'<span class="tx"><span class="r1"><b>'+E(x.p.NUMBER)+'</b><span class="ph" style="--c:'+PH[x.cl][1]+'">'+E(PH[x.cl][0])+'</span></span><span class="tt">'+E(x.p.TITLE||'')+'</span>'
        +'<span class="co">'+E(x.li&&x.li.com||'')+(x.km!=null?' · '+KM(x.km)+' '+x.dir:'')+'</span>'
        +'<span class="jg">'+(pct!=null?'<i style="width:'+pct+'%"></i>':'')+'</span><span class="hh">'+HR(I.htot)+' h'+(I.hprev?' / '+HR(I.hprev)+' h prévues':'')+(I.h30?' · '+HR(I.h30)+' h ces 30 j':'')+'</span></span></button>'; }).join('');
    G.querySelectorAll('.sgcv-vg').forEach(v=>{ io.observe(v); v.onclick=()=>{ const id=idDe(v.dataset.id); choisir(id); const x=its.find(z=>z.id===id); if(x) C.centrer(x,Math.min(C.S.res,6)); }; }); }
  actions(Fi);
  return {maj(){ its=placés(projets()); C.set(its); C.message(MK.prog); const k=its.map(x=>x.id).join()+'|'+st.tri; if(k!==cle){ cle=k; planche(); } choisir(MK.sel); },detruire(){ C.detruire(); io.disconnect(); }}; }

/* ═══ 7. CHRONOLOGIE — l'histoire du bureau mois par mois : projets actifs (heures des 3 derniers mois) en rouge, commencés en cercle, finis en gris ═══ */
function P7(z){
  z.innerHTML='<div class="sgcv-p7"><div class="sgcv-p7-g"><div class="sgcv-p7-mw"><div class="sgcv-p7-m"></div><div class="sgcv-p7-d"></div></div><aside class="sgcv-p7-r"></aside></div><div class="sgcv-p7-t"></div></div>';
  const RG='#D2382B'; let its=[], M0=0, M1=0, t=0, jeu=null;
  const D=z.querySelector('.sgcv-p7-d'), R=z.querySelector('aside'), TL=z.querySelector('.sgcv-p7-t');
  const fen=x=>{ let s=0; for(let k=t-2;k<=t;k++) s+=x.I.byM[k]||0; return s; };
  const etat=x=>{ if(x.k0==null||x.k0>t) return 'avant'; if(fen(x)>0) return 'actif'; if(x.k1!=null&&x.k1<t-6) return 'fini'; return 'pause'; };
  const mlib=k=>MOIS[k%12]+' '+Math.floor(k/12);
  const C=Carte(z.querySelector('.sgcv-p7-m'),{fond:FONDS.sable,pad:60,
    dessus:api=>{ let s=''; its.map(x=>({x,e:etat(x)})).filter(o=>o.e!=='avant').sort((a,b)=>(a.e==='actif')-(b.e==='actif')).forEach(({x,e})=>{
        const [a,b]=api.px(x.E,x.N); if(!dedans(api,a,b)) return; const on=x.id===MK.sel, tr='<g data-id="'+E(x.id)+'" transform="translate('+a.toFixed(1)+' '+b.toFixed(1)+')">';
        if(e==='actif'){ const r=Math.min(24,4.5+Math.sqrt(fen(x))*1.15);
          s+=tr+'<circle r="'+r.toFixed(1)+'" fill="'+RG+'" fill-opacity=".88" stroke="'+(on?'#1d1d1b':'#F2EEE6')+'" stroke-width="'+(on?2.5:1)+'"/>'+(x.k0>=t-2?'<circle r="'+(r+5).toFixed(1)+'" fill="none" stroke="'+RG+'" stroke-width="1.3"/>':'')+(on?'<text x="'+(r+6).toFixed(1)+'" y="4" class="halo">'+E(x.p.NUMBER)+'</text>':'')+'</g>'; }
        else s+=tr+'<circle r="'+(on?6:3.3)+'" fill="'+(e==='fini'?'#AAA69C':'#F2EEE6')+'" stroke="'+(on?'#1d1d1b':e==='fini'?'none':RG)+'" stroke-width="1.4"/></g>'; });
      return s+burSvg(api); },
    tip:q=>{ const x=q.dataset.id&&its.find(z=>String(z.id)===q.dataset.id); return x?tipP(x)+'<br>'+(x.k0!=null?'premières heures : '+mlib(x.k0):'')+(fen(x)?' · '+HR(fen(x))+' h sur 3 mois':''):tipDe(q,its); },
    choisir:id=>{ MK.sel=id; C.redraw(); cote(); }, vide:()=>{ MK.sel=null; C.redraw(); cote(); } });
  const tot=k=>its.reduce((s,x)=>s+(x.I.byM[k]||0),0);
  function date(){ const act=its.filter(x=>etat(x)==='actif'), dem=its.filter(x=>x.k0!=null&&x.k0<=t), an=Math.floor(t/12), nv=its.filter(x=>x.k0!=null&&Math.floor(x.k0/12)===an&&x.k0<=t);
    D.innerHTML='<div class="an">'+an+'</div><div class="mo">'+MOIS[t%12].replace('.','').toUpperCase()+'</div><div class="k"><b>'+act.length+'</b> projets actifs<br><b>'+HR(act.reduce((s,x)=>s+fen(x),0))+' h</b> sur 3 mois<br><b>'+dem.length+'</b> projets commencés depuis le début<br><b>'+nv.length+'</b> nouveaux en '+an+'</div>'; }
  function cote(){ const x=MK.sel!=null&&its.find(z=>z.id===MK.sel); if(x){ R.innerHTML=fiche(x,{retour:'Nouveaux projets',cls:'p7'}); return; }
    const an=Math.floor(t/12), nv=its.filter(x=>x.k0!=null&&Math.floor(x.k0/12)===an&&x.k0<=t).sort((a,b)=>b.k0-a.k0);
    R.innerHTML='<h4>Nouveaux projets en '+an+'</h4>'+(nv.length?nv.map(x=>'<button type="button" class="sgcv-li" data-id="'+E(x.id)+'"><b>'+E(x.p.NUMBER)+'</b> '+E(x.p.TITLE||'')+'<small>'+mlib(x.k0)+(x.li&&x.li.com?' · '+E(x.li.com):'')+'</small></button>').join(''):'<div class="vide">Aucun nouveau projet en '+an+' jusqu’à '+mlib(t)+'.</div>')
      +(MK.prog?'<div class="sgcv-prog">'+E(MK.prog)+'</div>':'');
    R.querySelectorAll('.sgcv-li').forEach(b=>b.onclick=()=>{ MK.sel=idDe(b.dataset.id); C.redraw(); cote(); }); }
  function frise(){ const V=[]; for(let k=M0;k<=M1;k++) V.push(tot(k)); const vm=Math.max(1,...V);
    TL.innerHTML='<div class="ctl"><button type="button" class="jouer" title="'+(jeu?'Pause':'Lire l’histoire du bureau')+'">'+(jeu?PAUSE:PLAY)+'</button><span class="l">'+mlib(M0)+' — '+mlib(M1)+'</span><span class="dr">barres : heures saisies par mois · la carte montre les projets actifs sur les 3 derniers mois</span></div>'
      +'<div class="hb">'+V.map((v,i)=>{ const k=M0+i; return '<i class="'+(k<=t?'p':'')+(k===t?' c':'')+(k%12===0?' y':'')+'" style="height:'+Math.max(v?4:1,v/vm*100).toFixed(1)+'%" data-k="'+k+'" title="'+mlib(k)+' · '+HR(v)+' h">'+(k%12===0||i===0?'<span>'+Math.floor(k/12)+'</span>':'')+'</i>'; }).join('')+'</div>'
      +'<input type="range" min="'+M0+'" max="'+M1+'" value="'+t+'" step="1" aria-label="Mois affiché">';
    const rg=TL.querySelector('input'); rg.oninput=()=>aller(+rg.value);
    TL.querySelectorAll('.hb i').forEach(b=>b.onclick=()=>aller(+b.dataset.k));
    TL.querySelector('.jouer').onclick=()=>{ if(jeu){ stop(); return; } if(t>=M1) t=M0; jeu=setInterval(()=>{ if(t>=M1){ stop(); return; } aller(t+1); },170); frise(); }; }
  function stop(){ clearInterval(jeu); jeu=null; frise(); cote(); }
  function aller(k){ t=Math.max(M0,Math.min(M1,k)); C.redraw(); date(); const rg=TL.querySelector('input'); if(rg&&+rg.value!==t) rg.value=t;
    TL.querySelectorAll('.hb i').forEach(b=>{ const kk=+b.dataset.k; b.classList.toggle('p',kk<=t); b.classList.toggle('c',kk===t); }); if(!jeu||t%6===0) cote(); }
  actions(R,()=>{ MK.sel=null; C.redraw(); cote(); });
  return {maj(){ its=placés(projets()); const ks=its.map(x=>x.k0).filter(v=>v!=null); M1=AUJ.getFullYear()*12+AUJ.getMonth(); M0=ks.length?Math.min(...ks):M1-24; if(!t||t>M1||t<M0) t=M1;
      C.set(its); C.message(''); frise(); date(); cote(); },detruire(){ clearInterval(jeu); C.detruire(); }}; }

/* ═══ 8. RELIEF · COLONNES — plan incliné comme une maquette, une colonne par projet (hauteur = heures, heures prévues ou honoraires), couleur = avancement ═══ */
function P8(z){
  z.innerHTML='<div class="sgcv-p8"><div class="sgcv-p8-hd"></div><div class="sgcv-p8-g"><div class="sgcv-p8-m"></div><aside class="sgcv-p8-r"></aside></div></div>';
  const st={mes:sessionStorage.getItem('sgcv8_mes')||'h',vue:sessionStorage.getItem('sgcv8_vue')||'axo',hl:null}; let its=[];
  const hd=z.querySelector('.sgcv-p8-hd'), R=z.querySelector('aside');
  const MES={h:['Heures saisies',x=>x.I.htot,v=>HR(v)+' h'],p:['Heures prévues',x=>x.I.hprev,v=>HR(v)+' h'],h30:['Heures ces 30 jours',x=>x.I.h30,v=>HR(v)+' h'],f:['Honoraires HT',x=>x.R?x.R.contratHT:0,v=>N0(v)]};
  const val=x=>MES[st.mes][1](x)||0;
  const INCL='perspective(1250px) rotateX(55deg) rotateZ(-16deg)';
  const C=Carte(z.querySelector('.sgcv-p8-m'),{fond:FONDS.maquette,pad:80,
    dessus:api=>{ let s=''; its.forEach(x=>{ const [a,b]=api.px(x.E,x.N); if(!dedans(api,a,b,80)) return;
        s+=api.incline?'<ellipse cx="'+a.toFixed(1)+'" cy="'+b.toFixed(1)+'" rx="9" ry="9" fill="#1d1d1b" fill-opacity=".12"/>'
          :'<g data-id="'+E(x.id)+'" transform="translate('+a.toFixed(1)+' '+b.toFixed(1)+')"><circle r="'+Math.min(20,3+Math.sqrt(val(x)/Math.max(1,...its.map(val)))*16).toFixed(1)+'" fill="'+PH[x.cl][1]+'" fill-opacity=".8" stroke="#fff" stroke-width="1.2"/></g>'; });
      return s+burSvg(api); },
    /* colonnes à l'écran : base projetée depuis le plan incliné, de l'arrière vers l'avant */
    ecran:api=>{ if(!api.incline) return ''; const M=Math.max(1,...its.map(val)), w0=api.W(), h0=api.H();
      const L=its.map(x=>{ const [a,b]=api.px(x.E,x.N), [sx,sy]=api.proj(a,b), [sx2,sy2]=api.proj(a+10,b); return {x,sx,sy,k:Math.hypot(sx2-sx,sy2-sy)/10}; })
        .filter(o=>val(o.x)>0&&o.sx>-40&&o.sx<w0+40&&o.sy>-20&&o.sy<h0+60).sort((m,n)=>m.sy-n.sy);
      let s=''; L.forEach(({x,sx,sy,k})=>{ const v=val(x), hh=Math.max(4,v/M*230*Math.max(.55,k)), w=Math.max(5,12*k), d=w*.55, c=PH[x.cl][1], on=x.id===MK.sel||x.id===st.hl;
        s+='<g data-id="'+E(x.id)+'"><path d="M'+(sx-w/2).toFixed(1)+' '+sy.toFixed(1)+'V'+(sy-hh).toFixed(1)+'H'+(sx+w/2).toFixed(1)+'V'+sy.toFixed(1)+'Z" fill="'+c+'"/>'
          +'<path d="M'+(sx+w/2).toFixed(1)+' '+sy.toFixed(1)+'V'+(sy-hh).toFixed(1)+'L'+(sx+w/2+d).toFixed(1)+' '+(sy-hh-d*.6).toFixed(1)+'V'+(sy-d*.6).toFixed(1)+'Z" fill="'+nuance(c,.68)+'"/>'
          +'<path d="M'+(sx-w/2).toFixed(1)+' '+(sy-hh).toFixed(1)+'L'+(sx-w/2+d).toFixed(1)+' '+(sy-hh-d*.6).toFixed(1)+'H'+(sx+w/2+d).toFixed(1)+'L'+(sx+w/2).toFixed(1)+' '+(sy-hh).toFixed(1)+'Z" fill="'+nuance(c,1.45)+'"/>'
          +(on?'<path d="M'+(sx-w/2-2).toFixed(1)+' '+(sy+2).toFixed(1)+'V'+(sy-hh-2).toFixed(1)+'H'+(sx+w/2+2).toFixed(1)+'V'+(sy+2).toFixed(1)+'Z" fill="none" stroke="#1d1d1b" stroke-width="2"/>':'')+'</g>'; });
      L.slice().sort((m,n)=>val(n.x)-val(m.x)).slice(0,8).concat(L.filter(o=>o.x.id===MK.sel)).forEach(({x,sx,sy,k})=>{ const hh=Math.max(4,val(x)/M*230*Math.max(.55,k));
        s+='<text x="'+(sx+2).toFixed(1)+'" y="'+(sy-hh-10).toFixed(1)+'" class="sgcv-t8">'+E(x.p.NUMBER)+'</text>'; });
      const B=SC.bureau; if(B){ const [a,b]=api.px(B.E,B.N), [sx,sy]=api.proj(a,b); if(sx>0&&sx<w0&&sy>0&&sy<h0) s+='<g transform="translate('+sx.toFixed(1)+' '+sy.toFixed(1)+')"><rect x="-6" y="-6" width="12" height="12" fill="#1d1d1b"/><rect x="-3" y="-3" width="6" height="6" fill="#FFF266"/><text x="10" y="4" class="sgcv-t8 b">Bureau</text></g>'; }
      return s; },
    tip:q=>{ const x=q.dataset.id&&its.find(z=>String(z.id)===q.dataset.id); return x?tipP(x)+'<br>'+MES[st.mes][0]+' : '+MES[st.mes][2](val(x)):tipDe(q,its); },
    survol:q=>{ const id=q&&q.dataset.id?idDe(q.dataset.id):null; if(id!==st.hl){ st.hl=id; R.querySelectorAll('.sgcv-rk').forEach(b=>b.classList.toggle('hl',b.dataset.id===String(id))); } },
    choisir:id=>{ MK.sel=id; C.redraw(); cote(); }, vide:()=>{ MK.sel=null; C.redraw(); cote(); } });
  function entete(){ hd.innerHTML='<span class="t">'+(st.vue==='axo'?'Maquette':'Plan')+' · '+MES[st.mes][0].toLowerCase()+'</span>'+seg('vue',st.vue,[['axo','Axonométrie'],['plan','Plan']])
      +'<span class="dr">'+seg('mes',st.mes,Object.entries(MES).filter(([k])=>k!=='f'||its.some(x=>x.R)).map(([k,v])=>[k,v[0]]))+'</span>';
    segs(hd,(k,v)=>{ st[k]=v; sessionStorage.setItem('sgcv8_'+k,v); if(k==='vue') C.incliner(v==='axo'?INCL:''); else C.redraw(); entete(); cote(); }); }
  function cote(){ const x=MK.sel!=null&&its.find(z=>z.id===MK.sel); if(x){ R.innerHTML=fiche(x,{retour:'Classement',cls:'p8'}); return; }
    const L=its.filter(x=>val(x)>0).sort((a,b)=>val(b)-val(a)), M=Math.max(1,...L.map(val)), tot=L.reduce((s,x)=>s+val(x),0);
    R.innerHTML='<h4>Classement · '+E(MES[st.mes][0].toLowerCase())+'</h4><div class="sgcv-p8-tot">'+MES[st.mes][2](tot)+' <small>sur '+L.length+' projets</small></div>'
      +L.slice(0,16).map((x,i)=>'<button type="button" class="sgcv-rk" data-id="'+E(x.id)+'"><span class="no">'+String(i+1).padStart(2,'0')+'</span><span class="nm"><b>'+E(x.p.NUMBER)+'</b> '+E(x.p.TITLE||'')+'</span><span class="v">'+MES[st.mes][2](val(x))+'</span><i style="width:'+(val(x)/M*100).toFixed(1)+'%;background:'+PH[x.cl][1]+'"></i></button>').join('')
      +(L.length>16?'<div class="sgcv-note">… et '+(L.length-16)+' autres.</div>':'')+(MK.prog?'<div class="sgcv-prog">'+E(MK.prog)+'</div>':'');
    R.querySelectorAll('.sgcv-rk').forEach(b=>{ const id=idDe(b.dataset.id); b.onclick=()=>{ MK.sel=id; C.redraw(); cote(); };
      b.onmouseenter=()=>{ st.hl=id; C.redraw(); }; b.onmouseleave=()=>{ st.hl=null; C.redraw(); }; }); }
  actions(R,()=>{ MK.sel=null; C.redraw(); cote(); });
  C.incliner(st.vue==='axo'?INCL:'');
  return {maj(){ its=placés(projets()); C.set(its); C.message(''); entete(); cote(); },detruire(){ C.detruire(); }}; }

/* ═══ 9. RÉSEAU · ÉQUIPE ET CLIENTS — arcs du bureau vers les projets (épaisseur = heures), ou projets d'un même maître de l'ouvrage reliés ═══ */
function P9(z){
  z.innerHTML='<div class="sgcv-p9"><aside class="sgcv-p9-l"></aside><div class="sgcv-p9-c"><div class="sgcv-p9-m"></div><div class="sgcv-p9-b"></div></div></div>';
  const st={mode:sessionStorage.getItem('sgcv9_mode')||'eq',per:sessionStorage.getItem('sgcv9_per')||'12',ent:null,q:''}; let its=[], HS=null, MO=null;
  const Lf=z.querySelector('aside'), B=z.querySelector('.sgcv-p9-b');
  const COUL=['#003346','#BD1E42','#D7860D','#3F4193','#4CBAB5','#98C21F','#636E7E','#7A3E7A'];
  const nomS=s=>s?(typeof staffName==='function'?staffName(s):'')||s.INITIALS||'?':'?';
  /* heures par collaborateur et par projet sur la période */
  function heures(){ const d=new Date(AUJ.getFullYear()-1,AUJ.getMonth(),AUJ.getDate()), k12=d.getFullYear()*10000+d.getMonth()*100+d.getDate(), M=new Map();
    its.forEach(x=>DS.by('timelog','PROJECT_ID',x.p.ID).forEach(r=>{ if(st.per==='12'&&tlKey(r)<k12) return; const v=+r.TIMEPERIOD||0; if(!v) return; let m=M.get(r.STAFF_ID); if(!m){ m=new Map(); M.set(r.STAFF_ID,m); } m.set(x.id,(m.get(x.id)||0)+v); }));
    return M; }
  function clients(){ const M=new Map(); its.forEach(x=>x.I.mo.forEach(n=>{ const g=M.get(n)||{k:n,L:[]}; g.L.push(x); M.set(n,g); })); M.forEach(g=>g.L.sort((a,b)=>(a.k0||0)-(b.k0||0))); return M; }
  const arc=(x0,y0,x1,y1,f)=>{ const mx=(x0+x1)/2, my=(y0+y1)/2, dx=x1-x0, dy=y1-y0; return 'M'+x0.toFixed(1)+' '+y0.toFixed(1)+'Q'+(mx-dy*f).toFixed(1)+' '+(my+dx*f).toFixed(1)+' '+x1.toFixed(1)+' '+y1.toFixed(1); };
  const parProjet=()=>{ const m=new Map(); if(st.mode==='eq'){ if(st.ent!=null){ const s=HS.get(st.ent); if(s) s.forEach((v,k)=>m.set(k,v)); } else HS.forEach(s=>s.forEach((v,k)=>m.set(k,(m.get(k)||0)+v))); } return m; };
  const C=Carte(z.querySelector('.sgcv-p9-m'),{fond:FONDS.gris,pad:60,
    dessus:api=>{ const px=api.px, Bu=SC.bureau; let s='', act=new Set();
      if(st.mode==='eq'&&Bu){ const m=parProjet(), vm=Math.max(1,...m.values()), [bx,by]=px(Bu.E,Bu.N);
        its.filter(x=>m.get(x.id)).sort((a,b)=>m.get(a.id)-m.get(b.id)).forEach(x=>{ const [a,b]=px(x.E,x.N), v=m.get(x.id); act.add(x.id);
          s+='<path d="'+arc(bx,by,a,b,.18)+'" fill="none" stroke="#003346" stroke-opacity="'+(st.ent!=null?.75:.4)+'" stroke-width="'+(1+Math.sqrt(v/vm)*9).toFixed(1)+'" stroke-linecap="round"/>'; }); }
      if(st.mode==='mo'){ const G=[...MO.values()].filter(g=>g.L.length>1&&(st.ent==null||g.k===st.ent)); G.forEach((g,i)=>{ const c=st.ent!=null?'#BD1E42':COUL[i%COUL.length];
          for(let j=1;j<g.L.length;j++){ const [a,b]=px(g.L[j-1].E,g.L[j-1].N), [c2,d]=px(g.L[j].E,g.L[j].N); s+='<path d="'+arc(a,b,c2,d,.25)+'" fill="none" stroke="'+c+'" stroke-opacity="'+(st.ent!=null?.9:.55)+'" stroke-width="'+(st.ent!=null?3:1.8)+'"/>'; }
          g.L.forEach(x=>act.add(x.id)); });
        if(st.ent!=null){ const g=MO.get(st.ent); if(g&&g.L.length===1) act.add(g.L[0].id); } }
      its.forEach(x=>{ const [a,b]=px(x.E,x.N); if(!dedans(api,a,b)) return; const on=x.id===MK.sel, ac=act.has(x.id);
        s+='<g data-id="'+E(x.id)+'" transform="translate('+a.toFixed(1)+' '+b.toFixed(1)+')"><circle r="'+(on?7:ac?4.8:3)+'" fill="'+(ac?'#1d1d1b':'#A3A3A0')+'" stroke="'+(on?'#FFF266':'#FFFFFF')+'" stroke-width="'+(on?3:1.2)+'"/>'+(on||(ac&&st.ent!=null)?'<text x="9" y="4" class="halo">'+E(x.p.NUMBER)+'</text>':'')+'</g>'; });
      return s+burSvg(api); },
    tip:q=>{ const x=q.dataset.id&&its.find(z=>String(z.id)===q.dataset.id); if(!x) return tipDe(q,its); const m=parProjet(); return tipP(x)+(st.mode==='eq'&&m.get(x.id)?'<br>'+HR(m.get(x.id))+' h '+(st.ent!=null?'de '+E(nomS(DS.get('staff',st.ent))):'de l’équipe')+(st.per==='12'?' (12 mois)':''):'')+(x.I.mo.length?'<br>MO : '+E(x.I.mo.join(', ')):''); },
    choisir:id=>{ MK.sel=id; C.redraw(); bas(); }, vide:()=>{ MK.sel=null; C.redraw(); bas(); } });
  function liste(){ let L;
    if(st.mode==='eq') L=[...HS.entries()].map(([id,m])=>{ const s=DS.get('staff',id); return {id,nom:nomS(s),ini:ini(s),h:[...m.values()].reduce((a,b)=>a+b,0),n:m.size,anc:!!(s&&s.QUITTINGDATE&&String(s.QUITTINGDATE)<iso2())}; }).sort((a,b)=>b.h-a.h);
    else L=[...MO.values()].map(g=>({id:g.k,nom:g.k,ini:'',h:g.L.reduce((s,x)=>s+x.I.htot,0),n:g.L.length})).sort((a,b)=>b.n-a.n||b.h-a.h);
    const q=st.q.toLowerCase(); if(q) L=L.filter(e=>e.nom.toLowerCase().includes(q)); const M=Math.max(1,...L.map(e=>e.h));
    Lf.innerHTML='<div class="sgcv-p9-lh">'+seg('mode',st.mode,[['eq','Équipe'],['mo','Maîtres de l’ouvrage']])+(st.mode==='eq'?seg('per',st.per,[['12','12 mois'],['tout','Tout']]):'')+'</div>'
      +'<input type="search" class="sgcv-q" placeholder="Rechercher" value="'+E(st.q)+'">'
      +'<button type="button" class="sgcv-en'+(st.ent==null?' on':'')+'" data-e=""><span class="nm"><b>'+(st.mode==='eq'?'Toute l’équipe':'Tous les clients récurrents')+'</b></span></button>'
      +L.map(e=>'<button type="button" class="sgcv-en'+(String(st.ent)===String(e.id)?' on':'')+(e.anc?' anc':'')+'" data-e="'+E(e.id)+'">'+(e.ini?'<span class="in">'+E(e.ini)+'</span>':'')+'<span class="nm">'+E(e.nom)+'<small>'+e.n+' projet'+(e.n>1?'s':'')+' · '+HR(e.h)+' h</small></span><i style="width:'+(e.h/M*100).toFixed(1)+'%"></i></button>').join('')
      +(MK.prog?'<div class="sgcv-prog">'+E(MK.prog)+'</div>':'');
    segs(Lf,(k,v)=>{ st[k]=v; sessionStorage.setItem('sgcv9_'+k,v); if(k==='mode') st.ent=null; HS=heures(); liste(); C.redraw(); bas(); });
    const qi=Lf.querySelector('.sgcv-q'); qi.oninput=()=>{ st.q=qi.value; const p=qi.selectionStart; liste(); const n=Lf.querySelector('.sgcv-q'); n.focus(); n.setSelectionRange(p,p); };
    Lf.querySelectorAll('.sgcv-en').forEach(b=>b.onclick=()=>{ const v=b.dataset.e; st.ent=v===''?null:(st.mode==='eq'?idDe(v):v); MK.sel=null; liste(); C.redraw(); bas();
      const Lz=act(); if(Lz.length) C.vers(Lz.concat(st.mode==='eq'&&SC.bureau?[SC.bureau]:[]),70); }); }
  const iso2=()=>AUJ.getFullYear()+'-'+String(AUJ.getMonth()+1).padStart(2,'0')+'-'+String(AUJ.getDate()).padStart(2,'0');
  const act=()=>{ if(st.ent==null) return its; if(st.mode==='eq'){ const m=HS.get(st.ent); return m?its.filter(x=>m.has(x.id)):[]; } const g=MO.get(st.ent); return g?g.L:[]; };
  function bas(){ const x=MK.sel!=null&&its.find(z=>z.id===MK.sel); if(x){ B.innerHTML=fiche(x,{retour:'Résumé',cls:'p9'}); return; }
    const L=act(), m=parProjet(), dist=L.filter(x=>x.km!=null), dm=dist.length?dist.reduce((s,x)=>s+x.km,0)/dist.length:null, com={};
    L.forEach(x=>{ const c=x.li&&x.li.com; if(c) com[c]=(com[c]||0)+1; });
    const titre=st.ent==null?(st.mode==='eq'?'Toute l’équipe'+(st.per==='12'?', 12 derniers mois':''):'Clients récurrents'):(st.mode==='eq'?nomS(DS.get('staff',st.ent)):st.ent);
    const Ls=L.slice().sort((a,b)=>(m.get(b.id)||b.I.htot)-(m.get(a.id)||a.I.htot));
    B.innerHTML='<div class="sgcv-p9-bh"><b>'+E(titre)+'</b><span><b>'+L.length+'</b> projets</span>'+(st.mode==='eq'?'<span><b>'+HR([...m.values()].reduce((a,b)=>a+b,0))+' h</b></span>':'')+(dm!=null?'<span>distance moyenne <b>'+KM(dm)+'</b></span>':'')
      +'<span>'+Object.entries(com).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([c,n])=>E(c)+' <b>'+n+'</b>').join(' · ')+'</span></div>'
      +'<table class="sgcv-tb"><thead><tr><th>N°</th><th>Projet</th><th>Commune</th><th>Maître de l’ouvrage</th><th class="r">'+(st.mode==='eq'?'Heures':'Heures (total)')+'</th></tr></thead><tbody>'
      +Ls.slice(0,12).map(x=>'<tr data-id="'+E(x.id)+'"><td><b>'+E(x.p.NUMBER)+'</b></td><td>'+E(x.p.TITLE||'')+'</td><td>'+E(x.li&&x.li.com||'—')+'</td><td>'+E(x.I.mo.join(', ')||'—')+'</td><td class="r">'+HR(st.mode==='eq'?(m.get(x.id)||0):x.I.htot)+'</td></tr>').join('')+'</tbody></table>'
      +(Ls.length>12?'<div class="sgcv-note">… et '+(Ls.length-12)+' autres.</div>':'');
    B.querySelectorAll('tr[data-id]').forEach(r=>r.onclick=()=>{ MK.sel=idDe(r.dataset.id); C.redraw(); bas(); }); }
  actions(B,()=>{ MK.sel=null; C.redraw(); bas(); });
  return {maj(){ its=placés(projets()); HS=heures(); MO=clients(); C.set(its); C.message(''); liste(); bas(); },detruire(){ C.detruire(); }}; }

/* ═══ 10. CARTOGRAMME · COMMUNES — une case par commune (placée près de sa position réelle), chiffre en grand, hachure selon la valeur, filet du district ═══ */
function P10(z){
  z.innerHTML='<div class="sgcv-p10"><div class="sgcv-p10-hd"></div><div class="sgcv-p10-g"><div class="sgcv-p10-c"></div><aside class="sgcv-p10-r"></aside></div></div>';
  const st={mes:sessionStorage.getItem('sgcv10_mes')||'n',com:null,dis:null}; let its=[], G=[], DIS=[];
  const hd=z.querySelector('.sgcv-p10-hd'), Cg=z.querySelector('.sgcv-p10-c'), R=z.querySelector('aside');
  const fin=()=>its.some(x=>x.R);
  const MES={n:['Projets',L=>L.length,v=>String(v)],h:['Heures',L=>L.reduce((s,x)=>s+x.I.htot,0),v=>HR(v)],
    f:['Honoraires HT',L=>L.reduce((s,x)=>s+(x.R?x.R.contratHT:0),0),v=>v>=1e6?(v/1e6).toFixed(1)+' M':v>=1e3?Math.round(v/1e3)+' k':N0(v)],
    r:['Reste à facturer',L=>L.reduce((s,x)=>s+(x.R?Math.max(0,x.R.contratHT-x.R.factHT):0),0),v=>v>=1e6?(v/1e6).toFixed(1)+' M':v>=1e3?Math.round(v/1e3)+' k':N0(v)]};
  const val=L=>MES[st.mes][1](L);
  const COUL=['#003346','#BD1E42','#D7860D','#3F4193','#4CBAB5','#98C21F','#636E7E','#7A3E7A','#A3A3A0'];
  function placer(){ const m=new Map(); its.forEach(x=>{ const k=x.li&&x.li.com; if(!k) return; const g=m.get(k)||{k,bfs:x.li.bfs,dis:x.li.dis||'—',L:[]}; g.L.push(x); m.set(k,g); });
    G=[...m.values()];
    G.forEach(g=>{ const ge=MK.geo.get(g.bfs); let se=0,sn=0,n=0; if(ge){ const P=ge.g.type==='MultiPolygon'?ge.g.coordinates:[ge.g.coordinates]; let best=null; P.forEach(po=>{ if(!best||po[0].length>best.length) best=po[0]; }); best.forEach(c=>{ se+=c[0]; sn+=c[1]; n++; }); }
      if(n){ g.E=se/n; g.N=sn/n; } else { g.E=g.L.reduce((s,x)=>s+x.E,0)/g.L.length; g.N=g.L.reduce((s,x)=>s+x.N,0)/g.L.length; } });
    if(!G.length) return;
    /* pas de la grille : au moins 2,5 km, au plus 16 × 10 cases ; la commune la plus importante d'abord, puis la case libre la plus proche */
    const e0=Math.min(...G.map(g=>g.E)), e1=Math.max(...G.map(g=>g.E)), n0=Math.min(...G.map(g=>g.N)), n1=Math.max(...G.map(g=>g.N)), pas=Math.max(2500,(e1-e0)/15,(n1-n0)/9), occ=new Set();
    G.sort((a,b)=>b.L.length-a.L.length).forEach(g=>{ const i0=Math.round(g.E/pas), j0=Math.round(g.N/pas); let best=null;
      for(let r=0;r<10&&!best;r++) for(let di=-r;di<=r;di++) for(let dj=-r;dj<=r;dj++){ if(Math.max(Math.abs(di),Math.abs(dj))!==r) continue; const k=(i0+di)+':'+(j0+dj); if(occ.has(k)) continue;
        const d=Math.hypot(i0+di-g.E/pas,j0+dj-g.N/pas); if(!best||d<best.d) best={i:i0+di,j:j0+dj,d}; }
      occ.add(best.i+':'+best.j); g.i=best.i; g.j=best.j; });
    /* lignes et colonnes vides resserrées : au plus une case vide entre deux communes (l'ordre géographique est gardé, les distances non) */
    const serre=k=>{ const V=[...new Set(G.map(g=>g[k]))].sort((a,b)=>a-b), M=new Map(); let c=0; V.forEach((v,i)=>{ if(i) c+=Math.min(2,v-V[i-1]); M.set(v,c); }); G.forEach(g=>g[k]=M.get(g[k])); };
    serre('i'); serre('j');
    const dm=new Map(); G.forEach(g=>{ const d=dm.get(g.dis)||{k:g.dis,G:[]}; d.G.push(g); dm.set(g.dis,d); });
    DIS=[...dm.values()].sort((a,b)=>b.G.reduce((s,g)=>s+g.L.length,0)-a.G.reduce((s,g)=>s+g.L.length,0)); DIS.forEach((d,i)=>d.c=COUL[i%COUL.length]); }
  function dessiner(){ if(!G.length){ Cg.innerHTML='<div class="vide">'+(MK.prog||'Aucune commune connue pour ces projets.')+'</div>'; return; }
    const i0=Math.min(...G.map(g=>g.i)), i1=Math.max(...G.map(g=>g.i)), j0=Math.min(...G.map(g=>g.j)), j1=Math.max(...G.map(g=>g.j));
    const w=Cg.clientWidth||800, H=560, ni=i1-i0+1, nj=j1-j0+1, S=Math.max(46,Math.min(96,Math.floor(Math.min((w-20)/ni,(H-20)/nj)))), gap=5, W2=ni*S, H2=nj*S;
    const vm=Math.max(1,...G.map(g=>val(g.L)));
    let s='<defs>'+[10,6,4,2.6].map((p,i)=>'<pattern id="sgcv10-h'+i+'" patternUnits="userSpaceOnUse" width="'+p+'" height="'+p+'" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="'+p+'" stroke="#1d1d1b" stroke-width="'+(i>1?1.2:1)+'"/></pattern>').join('')+'</defs>';
    G.forEach(g=>{ const x=(g.i-i0)*S, y=(j1-g.j)*S, v=val(g.L), lv=v<=0?-1:Math.min(3,Math.floor(v/vm*4)), on=st.com===g.k, dim=st.dis&&g.dis!==st.dis, d=DIS.find(q=>q.k===g.dis), sw=S-gap;
      const nom=g.k.length>(S>70?16:11)?g.k.slice(0,S>70?15:10)+'…':g.k;
      s+='<g data-k="c:'+E(g.k)+'" transform="translate('+x+' '+y+')" opacity="'+(dim?.25:1)+'"><rect width="'+sw+'" height="'+sw+'" fill="#FFFFFF" stroke="#1d1d1b" stroke-width="'+(on?2.4:1)+'"/>'
        +(on?'<rect width="'+sw+'" height="'+sw+'" fill="#1d1d1b"/>':lv>=0?'<rect width="'+sw+'" height="'+sw+'" fill="url(#sgcv10-h'+lv+')" opacity=".55"/>':'')
        +'<rect width="'+sw+'" height="5" fill="'+(d?d.c:'#1d1d1b')+'"/>'
        +'<rect x="4" y="'+(sw-26)+'" width="'+(sw-8)+'" height="22" fill="'+(on?'#1d1d1b':'#FFFFFF')+'"/>'
        +'<text x="6" y="'+(sw-9)+'" class="sgcv-t10 v'+(on?' inv':'')+'">'+E(MES[st.mes][2](val(g.L)))+'</text>'
        +'<text x="6" y="18" class="sgcv-t10'+(on?' inv':' bg')+'">'+E(nom)+'</text></g>'; });
    /* le bureau : coin jaune sur la case de sa commune, sinon case propre */
    if(SC.bureau){ const g=G.slice().sort((a,b)=>Math.hypot(a.E-SC.bureau.E,a.N-SC.bureau.N)-Math.hypot(b.E-SC.bureau.E,b.N-SC.bureau.N))[0];
      if(g&&Math.hypot(g.E-SC.bureau.E,g.N-SC.bureau.N)<4000){ const x=(g.i-i0)*S, y=(j1-g.j)*S, sw=S-gap; s+='<g transform="translate('+(x+sw-16)+' '+(y+9)+')"><rect width="12" height="12" fill="#1d1d1b"/><rect x="3" y="3" width="6" height="6" fill="#FFF266"/></g>'; } }
    Cg.innerHTML='<svg width="'+W2+'" height="'+H2+'" viewBox="-2 -2 '+(W2+4)+' '+(H2+4)+'">'+s+'</svg><div class="sgcv-p10-n">N ↑ · une case par commune, placée au plus près de sa position · coin jaune : bureau</div>';
    Cg.querySelectorAll('[data-k]').forEach(t=>{ t.onclick=()=>{ const k=t.dataset.k.slice(2); st.com=st.com===k?null:k; MK.sel=null; dessiner(); cote(); }; t.onmouseenter=()=>{ const g=G.find(q=>q.k===t.dataset.k.slice(2)); if(g) t.setAttribute('title',g.k+' ('+g.dis+') · '+g.L.length+' projet'+(g.L.length>1?'s':'')+' · '+HR(g.L.reduce((s,x)=>s+x.I.htot,0))+' h'); }; }); }
  function entete(){ hd.innerHTML='<span class="t">'+G.length+' communes · '+DIS.length+' districts</span><span class="dr">'+seg('mes',st.mes,Object.entries(MES).filter(([k])=>(k!=='f'&&k!=='r')||fin()).map(([k,v])=>[k,v[0]]))+'</span>';
    segs(hd,(k,v)=>{ st[k]=v; sessionStorage.setItem('sgcv10_'+k,v); dessiner(); entete(); cote(); }); }
  function cote(){ const x=MK.sel!=null&&its.find(z=>z.id===MK.sel); if(x){ R.innerHTML=fiche(x,{retour:st.com||'Districts',cls:'p10'}); return; }
    if(st.com){ const g=G.find(q=>q.k===st.com); if(g){ R.innerHTML='<button type="button" class="sgcv-ret" data-act="retour">‹ Districts</button><h4>'+E(g.k)+' <small>'+E(g.dis)+'</small></h4>'
        +g.L.slice().sort((a,b)=>b.I.htot-a.I.htot).map(x=>'<button type="button" class="sgcv-li" data-id="'+E(x.id)+'"><b>'+E(x.p.NUMBER)+'</b> '+E(x.p.TITLE||'')+'<small>'+E(PH[x.cl][0])+' · '+HR(x.I.htot)+' h'+(x.R?' · '+N0(x.R.contratHT)+' HT':'')+'</small></button>').join('');
      R.querySelectorAll('.sgcv-li').forEach(b=>b.onclick=()=>{ MK.sel=idDe(b.dataset.id); cote(); }); return; } }
    const tot=G.reduce((s,g)=>s+val(g.L),0);
    R.innerHTML='<h4>Par district</h4><table class="sgcv-tb"><thead><tr><th>District</th><th class="r">Communes</th><th class="r">'+E(MES[st.mes][0])+'</th><th class="r">%</th></tr></thead><tbody>'
      +DIS.map(d=>{ const L=d.G.flatMap(g=>g.L), v=val(L); return '<tr data-d="'+E(d.k)+'" class="'+(st.dis===d.k?'on':'')+'"><td><i class="pt" style="--c:'+d.c+'"></i>'+E(d.k)+'</td><td class="r">'+d.G.length+'</td><td class="r">'+E(MES[st.mes][2](v))+'</td><td class="r">'+(tot?Math.round(v/tot*100):0)+'</td></tr>'; }).join('')
      +'</tbody></table><div class="sgcv-note">Un clic sur un district le met en évidence ; un clic sur une case liste ses projets.</div>'+(MK.prog?'<div class="sgcv-prog">'+E(MK.prog)+'</div>':'');
    R.querySelectorAll('tr[data-d]').forEach(r=>r.onclick=()=>{ st.dis=st.dis===r.dataset.d?null:r.dataset.d; dessiner(); cote(); }); }
  actions(R,()=>{ if(MK.sel!=null) MK.sel=null; else st.com=null; dessiner(); cote(); });
  let rz=null; const ro=new ResizeObserver(()=>{ if(!document.body.contains(Cg)){ ro.disconnect(); return; } clearTimeout(rz); rz=setTimeout(dessiner,120); }); ro.observe(Cg);
  return {maj(){ its=placés(projets()); placer(); entete(); dessiner(); cote(); },detruire(){ ro.disconnect(); }}; }

/* ── les cinq variantes de plus ── */
[{n:6,t:'Planche · sites',f:P6,d:'Aquarelle verte (bâtiments verts, rues blanches) : la carte d’ensemble à gauche avec la fiche, à droite une vignette du site de chaque projet au 1:5000 environ, triée par activité, avancement, commune ou numéro. Données : environnement du site, avancement, heures, commune et distance.'},
 {n:7,t:'Chronologie',f:P7,d:'L’histoire du bureau mois par mois : projets actifs (heures des 3 derniers mois) en rouge, commencés en cercle, finis en gris ; lecture animée et frise des heures par mois en bas, nouveaux projets de l’année à droite. Données : début des projets, activité dans le temps, croissance par région.'},
 {n:8,t:'Relief · colonnes',f:P8,d:'Plan incliné comme une maquette : une colonne par projet, hauteur = heures saisies, heures prévues, heures des 30 jours ou honoraires, couleur = avancement ; classement à droite. Données : poids de chaque projet dans le travail du bureau.'},
 {n:9,t:'Réseau · équipe et clients',f:P9,d:'Arcs du bureau vers les projets, épaisseur = heures de l’équipe ou d’un collaborateur ; ou projets d’un même maître de l’ouvrage reliés dans l’ordre chronologique. Données : où travaille chaque collaborateur, clients récurrents, distances.'},
 {n:10,t:'Cartogramme · communes',f:P10,d:'Une case par commune, placée au plus près de sa position, chiffre en grand, hachure selon la valeur, filet de couleur du district ; tableau par district à droite. Données : projets, heures, honoraires et reste à facturer par commune et district.'}].forEach(v=>MK.ajouter(v));


/* ── styles ── */
const STY=`
.sgcv-ret{border:0;background:none;font:inherit;font-size:12.5px;color:var(--s-nuit,#003346);cursor:pointer;padding:0 0 10px}
.sgcv-li{display:block;width:100%;text-align:left;border:0;border-top:1px solid #e4e4e0;background:none;font:inherit;font-size:12.5px;padding:7px 0;cursor:pointer;color:#1d1d1b}
.sgcv-li small{display:block;color:var(--s-gris,#706F6F)}
.sgcv-li:hover{background:#FEF6B0}
.sgcv-tb{width:100%;border-collapse:collapse;font-size:12.5px}
.sgcv-tb th{text-align:left;font-size:11px;color:#706F6F;font-weight:700;border-bottom:2px solid #1d1d1b;padding:6px 8px 6px 0}
.sgcv-tb td{border-bottom:1px solid #e4e4e0;padding:6px 8px 6px 0}
.sgcv-tb .r{text-align:right;font-variant-numeric:tabular-nums}
.sgcv-tb tr[data-id],.sgcv-tb tr[data-d]{cursor:pointer}.sgcv-tb tr[data-id]:hover td,.sgcv-tb tr[data-d]:hover td,.sgcv-tb tr.on td{background:#FEF6B0}
.sgcv-tb .pt{display:inline-block;width:9px;height:9px;background:var(--c);margin-right:7px}
.sgcv-svg text.halo{paint-order:stroke;stroke:#fff;stroke-width:3.5px;stroke-linejoin:round;font-weight:700}
/* 6 Planche */
.sgcv-p6{display:grid;grid-template-columns:minmax(0,42fr) minmax(0,58fr);gap:24px;align-items:start}
.sgcv-p6-l{position:sticky;top:12px}
.sgcv-p6-m{height:420px;border:2px solid #2C6A4F}
.sgcv-p6-f{margin-top:14px}
.sgcv-p6-bar{display:flex;align-items:baseline;gap:14px;border-top:2px solid #1d1d1b;padding:9px 0 10px;flex-wrap:wrap}
.sgcv-p6-bar .t{font-weight:700;font-size:14px}
.sgcv-p6-bar .dr{margin-left:auto;display:flex;gap:10px;align-items:baseline}.sgcv-p6-bar .l{font-size:12px;color:#706F6F}
.sgcv-p6-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px;max-height:900px;overflow:auto;padding:2px}
.sgcv-vg{display:flex;flex-direction:column;border:0;background:#fff;padding:0;font:inherit;text-align:left;cursor:pointer;outline:1px solid #d6dbd3;color:#1d1d1b}
.sgcv-vg:hover{outline:1px solid #2C6A4F}
.sgcv-vg.on{outline:3px solid #1d1d1b}
.sgcv-vg .pl{position:relative;height:150px;background:#DCE8DC;overflow:hidden}
.sgcv-vg .pl .cv{position:absolute;inset:0;width:100%;height:100%}
.sgcv-vg .pl .pt{position:absolute;left:50%;top:50%;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:#BD1E42;border:2px solid #fff;z-index:2}
.sgcv-vg .pl .pt::after{content:'';position:absolute;inset:-13px;border:1.5px solid #BD1E42;border-radius:50%}
.sgcv-vg .pl .ech{position:absolute;left:8px;bottom:6px;font-size:9.5px;color:#1d1d1b;z-index:2;display:flex;flex-direction:column;gap:2px;background:rgba(255,255,255,.75);padding:2px 4px}
.sgcv-vg .pl .ech i{display:block;height:3px;background:#1d1d1b}
.sgcv-vg .tx{display:flex;flex-direction:column;padding:8px 10px 10px;gap:2px;min-width:0}
.sgcv-vg .r1{display:flex;justify-content:space-between;align-items:baseline;gap:6px}
.sgcv-vg .r1 b{font-size:15px}
.sgcv-vg .ph{font-size:9.5px;text-transform:uppercase;letter-spacing:.05em;padding:2px 5px;background:var(--c);color:#fff;white-space:nowrap}
.sgcv-vg .tt{font-size:12.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgcv-vg .co{font-size:11.5px;color:#706F6F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgcv-vg .jg{height:4px;background:#E4EBE4;margin-top:6px}.sgcv-vg .jg i{display:block;height:100%;background:#2C6A4F}
.sgcv-vg .hh{font-size:11px;color:#706F6F}
/* 7 Chronologie */
.sgcv-p7-g{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:22px}
.sgcv-p7-mw{position:relative;border:1px solid #1d1d1b}
.sgcv-p7-m{height:540px;background:#F2EEE6}
.sgcv-p7-d{position:absolute;left:18px;top:16px;z-index:4;pointer-events:none;background:rgba(242,238,230,.9);padding:10px 16px 12px;border-left:4px solid #D2382B}
.sgcv-p7-d .an{font-size:64px;font-weight:700;line-height:.9;letter-spacing:-.02em;color:#D2382B;font-variant-numeric:tabular-nums}
.sgcv-p7-d .mo{font-size:15px;font-weight:700;letter-spacing:.14em;margin:4px 0 8px}
.sgcv-p7-d .k{font-size:12.5px;line-height:1.55}
.sgcv-p7-r{max-height:544px;overflow:auto}
.sgcv-p7-r h4{margin:0 0 8px;font-size:14px;border-top:2px solid #1d1d1b;padding-top:10px}
.sgcv-p7-t{margin-top:14px;border-top:2px solid #1d1d1b;padding-top:10px}
.sgcv-p7-t .ctl{display:flex;align-items:center;gap:14px;font-size:12.5px}
.sgcv-p7-t .jouer{width:36px;height:36px;border:0;background:#D2382B;color:#fff;cursor:pointer;display:grid;place-items:center;padding:0}
.sgcv-p7-t .jouer svg{width:16px;height:16px}
.sgcv-p7-t .l{font-weight:700}
.sgcv-p7-t .dr{margin-left:auto;color:#706F6F;font-size:11.5px}
.sgcv-p7-t .hb{display:flex;align-items:flex-end;gap:1px;height:92px;margin:12px 0 0;position:relative}
.sgcv-p7-t .hb i{flex:1;background:#D8D2C6;position:relative;cursor:pointer;min-width:1px}
.sgcv-p7-t .hb i.p{background:#D2382B;opacity:.55}
.sgcv-p7-t .hb i.c{opacity:1;background:#D2382B}
.sgcv-p7-t .hb i.y{box-shadow:-1px 0 0 #1d1d1b}
.sgcv-p7-t .hb i span{position:absolute;top:100%;left:2px;font-size:10.5px;margin-top:3px;color:#1d1d1b;font-style:normal;white-space:nowrap}
.sgcv-p7-t input[type=range]{width:100%;margin:20px 0 0;accent-color:#D2382B}
/* 8 Relief */
.sgcv-p8-hd{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 18px;border-top:2px solid #1d1d1b;padding:10px 0}
.sgcv-p8-hd .t{font-weight:700;font-size:15px}
.sgcv-p8-hd .dr{margin-left:auto}
.sgcv-p8-g{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:24px}
.sgcv-p8-m{height:620px;background:linear-gradient(#FFFFFF,#F1F1EE)}
.sgcv-p8-m .sgcv-tw{box-shadow:0 40px 70px rgba(0,0,0,.18)}
.sgcv-svg2 .sgcv-t8{font-size:11px;font-weight:700;fill:#1d1d1b;paint-order:stroke;stroke:#fff;stroke-width:3.5px;stroke-linejoin:round}
.sgcv-p8-r{max-height:624px;overflow:auto}
.sgcv-p8-r h4{margin:0;font-size:14px;border-top:2px solid #1d1d1b;padding-top:10px}
.sgcv-p8-tot{font-size:26px;font-weight:700;margin:4px 0 10px}.sgcv-p8-tot small{font-size:12px;font-weight:400;color:#706F6F}
.sgcv-rk{display:grid;grid-template-columns:24px 1fr auto;gap:6px;align-items:baseline;width:100%;border:0;background:none;font:inherit;font-size:12.5px;text-align:left;padding:6px 0 7px;cursor:pointer;position:relative;border-bottom:1px solid #ecece8;color:#1d1d1b}
.sgcv-rk .no{color:#706F6F;font-variant-numeric:tabular-nums}
.sgcv-rk .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgcv-rk .v{font-variant-numeric:tabular-nums}
.sgcv-rk i{position:absolute;left:30px;bottom:1px;height:3px}
.sgcv-rk:hover,.sgcv-rk.hl{background:#FEF6B0}
/* 9 Réseau */
.sgcv-p9{display:grid;grid-template-columns:270px minmax(0,1fr);gap:22px}
.sgcv-p9-l{max-height:900px;overflow:auto}
.sgcv-p9-lh{display:flex;flex-direction:column;gap:8px;border-top:2px solid #1d1d1b;padding:10px 0}
.sgcv-q{width:100%;box-sizing:border-box;border:0;border-bottom:1px solid #1d1d1b;font:inherit;font-size:12.5px;padding:6px 0;margin-bottom:6px;background:transparent}
.sgcv-en{display:grid;grid-template-columns:auto 1fr;gap:8px;align-items:center;width:100%;border:0;background:none;font:inherit;font-size:12.5px;text-align:left;padding:7px 0 8px;cursor:pointer;position:relative;border-bottom:1px solid #ecece8;color:#1d1d1b}
.sgcv-en .in{width:30px;height:30px;border-radius:50%;background:#EDEDEA;display:grid;place-items:center;font-size:10.5px;font-weight:700}
.sgcv-en .nm small{display:block;color:#706F6F;font-size:11.5px}
.sgcv-en i{position:absolute;left:38px;bottom:2px;height:2px;background:#003346}
.sgcv-en.on{background:#FEF6B0}.sgcv-en.on .in{background:#003346;color:#fff}
.sgcv-en.anc{opacity:.55}
.sgcv-en:hover{background:#FBF7DA}
.sgcv-p9-m{height:540px;border:1px solid #1d1d1b}
.sgcv-p9-b{margin-top:14px}
.sgcv-p9-bh{display:flex;flex-wrap:wrap;gap:6px 20px;align-items:baseline;border-top:2px solid #1d1d1b;padding:10px 0 8px;font-size:12.5px}
.sgcv-p9-bh>b{font-size:15px}
/* 10 Cartogramme */
.sgcv-p10-hd{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 18px;border-top:2px solid #1d1d1b;padding:10px 0}
.sgcv-p10-hd .t{font-weight:700;font-size:15px}
.sgcv-p10-hd .dr{margin-left:auto}
.sgcv-p10-g{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:26px;align-items:start}
.sgcv-p10-c{min-height:420px;overflow:auto}
.sgcv-p10-c svg{display:block}
.sgcv-p10-c [data-k]{cursor:pointer}
.sgcv-t10{font-size:11px;fill:#1d1d1b;font-weight:700}
.sgcv-t10.bg{paint-order:stroke;stroke:#fff;stroke-width:4px;stroke-linejoin:round}
.sgcv-t10.v{font-size:15px}
.sgcv-t10.inv{fill:#fff}
.sgcv-p10-n{font-size:11.5px;color:#706F6F;margin-top:8px}
.sgcv-p10-r h4{margin:0 0 8px;font-size:14px;border-top:2px solid #1d1d1b;padding-top:10px}
.sgcv-p10-r h4 small{font-weight:400;color:#706F6F}
@container (max-width:820px){ .sgcv-p6,.sgcv-p7-g,.sgcv-p8-g,.sgcv-p9,.sgcv-p10-g{grid-template-columns:1fr} .sgcv-p6-l{position:static} }
`;
const sty=document.createElement('style'); sty.id='sgcv3-css'; sty.textContent=STY; document.head.append(sty);

})();

/* ── bloc 60 : Proposition ▸ Carte · variantes (23.11.2026) ──────────────────────────────────────────────────────────────────────────────
   Paulo, après les maquettes du 23.11.2026 (« faire de nouvelles propositions de carte, 5 propositions de carte et d'organisation de la fenêtre ; le but est de
   pouvoir sélectionner les projets et identifier les données, avec visuellement les chantiers en cours, les projets, région, densité des projets, type de
   projets ») puis « trop bien, conserve toutes les propositions dans Proposition, les 5 variantes ».
   Cinq écrans nx-carte-v1 à v5 (menu Proposition ▸ Carte · variantes, onglets pour passer de l'un à l'autre), administrateur seulement comme tout le chapitre :
   1 Atlas des régions · 2 Relevé · densité · 3 Nuit · chantiers en cours · 4 Flux · portefeuille · 5 Billets · fiches.
   Positions : celles de la carte des projets (window.SGCARTE de sg3_proposition.js, bloc 58 : parcelle, adresse du contrat, de l'affaire, désignation,
   commune ; cache du poste sg3_carte_geo). Commune et district : identify de geo.admin.ch (limites swissBOUNDARIES3D 2025, timeInstant=2025), gardés pour
   l'onglet (sessionStorage sgcv_lieux), géométrie des communes en mémoire. Fonds : couches WMS de swisstopo recolorées sur un canevas (méthode du fond
   « Encre »), une palette par variante (FONDS). Rien n'est écrit dans la base. window.SGCV : état, PROPS, ajouter(variante) pour une variante de plus
   (maquettes 6 à 10 : subgestion3/_backup_20261123_maquette_carte3/), outils (Carte, fond, X, fiche…). Maquette d'origine :
   subgestion3/_backup_20261123_maquette_carte2/. */
(()=>{
'use strict';
if(window.SGCV||typeof VIEWS==='undefined'||!window.SGCARTE) return;

/* ── 1. outils ── */
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N0=v=>(typeof num==='function'?num(Math.round(+v||0),0):String(Math.round(+v||0)));
const HR=v=>{ v=+v||0; return v>0&&v<1?(Math.round(v*10)/10).toFixed(1):N0(v); };
const KM=v=>v==null?'—':(v<10?(Math.round(v*10)/10).toFixed(1):String(Math.round(v)))+' km';
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const jma=s=>{ const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||''); return m?m[3]+'.'+m[2]+'.'+m[1]:''; };
const jmc=s=>{ const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||''); return m?m[3]+'.'+m[2]+'.'+m[1].slice(2):''; };
const dOf=s=>{ const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||''); return m?new Date(+m[1],+m[2]-1,+m[3]):null; };
const MOIS=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
const AUJ=(()=>{ const d=new Date(); d.setHours(0,0,0,0); return d; })();
const DIR=['N','NE','E','SE','S','SO','O','NO'];
const ini=s=>s?(s.INITIALS||String(typeof staffName==='function'?staffName(s):'').split(/\s+/).map(w=>w[0]||'').join('').slice(0,3)||'?'):'?';
const h=(t,c,html)=>{ const e=document.createElement(t); if(c) e.className=c; if(html!=null) e.innerHTML=html; return e; };
/* LV95 → degrés (formules approchées de swisstopo, à la seconde près) */
const wgs=(e,n)=>{ const y=(e-2600000)/1e6, x=(n-1200000)/1e6;
  const l=2.6779094+4.728982*y+0.791484*y*x+0.1306*y*x*x-0.0436*y*y*y, p=16.9023892+3.238272*x-0.270978*y*y-0.002528*x*x-0.0447*y*y*x-0.0140*x*x*x;
  const dm=v=>{ const d=Math.floor(v), m=Math.round((v-d)*60); return d+'°'+String(m).padStart(2,'0')+'′'; }; return dm(p*100/36)+' N · '+dm(l*100/36)+' E'; };

/* catégories d'avancement de la carte actuelle (couleurs de la charte) et types de projet */
const PH={fz:['Faisabilité, relevé','#3F4193'],etu:['Étude du projet','#003346'],enq:['Enquête, permis','#4CBAB5'],ao:['Appel d’offres','#D7860D'],
  rea:['Réalisation','#98C21F'],exp:['Expertise, conseil','#636E7E'],att:['En attente','#A3A3A0'],fin:['Terminé','#C9C9C4']};
const PH_ORD=['fz','etu','enq','ao','rea','exp','att','fin'];
const CAT={architecture:['Projets','#003346'],expertise:['Expertises','#D7860D'],faisabilite:['Faisabilités','#4CBAB5'],interne:['Autres','#A3A3A0']};
const CAT_ORD=['architecture','faisabilite','expertise','interne'];

/* ── 2. données ── */
const SC=window.SGCARTE;
const MK=window.SGCV={prop:0,sel:null,F:{1:'encours',2:'tous',3:'encours',4:'tous',5:'encours',6:'encours',7:'tous',8:'encours',9:'encours',10:'tous'},D:null,prog:'',lieux:{},geo:new Map(),cur:null};
try{ Object.assign(MK.lieux,JSON.parse(sessionStorage.getItem('sgcv_lieux')||'{}')); Object.keys(MK.F).forEach(n=>{ const v=sessionStorage.getItem('sgcv_f'+n); if(v==='tous'||v==='encours') MK.F[n]=v; }); }catch(_){}
const enCours=p=>[1,2,3].includes(+p.PROJECTSTATECODE);
function tous(){ const L=typeof sgProjetsVisibles==='function'?sgProjetsVisibles():DS.all('project'); return L.filter(p=>!(typeof sgInterne==='function'&&sgInterne(p))); }
function projets(){ const f=MK.F[MK.prop]; return tous().filter(p=>f==='tous'||enCours(p)); }
async function bureau(){ if(SC.bureau) return SC.bureau; let b=null; try{ b=sgBureauAdresse(); }catch(_){}
  const L=(b&&b.lignes||[]).map(x=>String(x||'').trim()).filter(Boolean), q=L.filter(x=>/\d/.test(x)).join(' ')||'Cully';
  try{ const R=await sgFzChercherAdresse(q); if(R&&R[0]) SC.bureau={E:R[0].E,N:R[0].N,nom:b&&b.nom||'Substances Architectes',adr:L.join(', ')}; }catch(_){} return SC.bureau; }
/* commune (géométrie gardée pour l'Atlas) et district du point */
const LCOM='ch.swisstopo.swissboundaries3d-gemeinde-flaeche.fill', LDIS='ch.swisstopo.swissboundaries3d-bezirk-flaeche.fill';
const LK=v=>Math.round(v.E/20)+':'+Math.round(v.N/20);
const ident=(v,l,g)=>fetch(SG_FZ_GEO.ident+'?geometry='+v.E+','+v.N+'&geometryType=esriGeometryPoint&geometryFormat=geojson&sr=2056&layers=all:'+l+'&tolerance=0&returnGeometry='+(g?'true':'false')+'&timeInstant=2025&lang=fr').then(r=>r.json()).then(j=>(j.results||[])[0]||null);
let tL=0;
async function lieu(v){ const k=LK(v); let r=MK.lieux[k];
  if(r&&(!r.bfs||MK.geo.has(r.bfs))) return r;
  const c=await ident(v,LCOM,true); if(c&&c.geometry&&c.properties) MK.geo.set(c.properties.gde_nr,{nom:c.properties.gemname,g:c.geometry});
  if(!r){ const d=await ident(v,LDIS,false);
    r={com:c?c.properties.gemname:'',bfs:c?c.properties.gde_nr:0,kt:c?c.properties.kanton:'',dis:d?(d.properties.name||d.properties.label||''):''};
    MK.lieux[k]=r; clearTimeout(tL); tL=setTimeout(()=>{ try{ sessionStorage.setItem('sgcv_lieux',JSON.stringify(MK.lieux)); }catch(_){} },800); }
  return r; }
/* tout ce dont les cartes ont besoin pour un projet (gardé jusqu'au prochain changement) */
const XC=new Map();
function X(p){ if(XC.has(p.ID)) return XC.get(p.ID);
  const I=SC.info(p), v=SC.pos.get(p.ID)||null, li=v?MK.lieux[LK(v)]||null:null, B=SC.bureau;
  let km=null,dir=''; if(v&&B){ const dx=v.E-B.E, dy=v.N-B.N; km=Math.hypot(dx,dy)/1000; dir=DIR[Math.round((((Math.atan2(dx,dy)*180/Math.PI)+360)%360)/45)%8]; }
  const cat=typeof sgCatProjet==='function'?(sgCatProjet(p)||'architecture'):'architecture';
  let genres=[]; try{ genres=DS.by('project_projectkind','PROJECT_ID',p.ID).map(x=>DS.get('projectkind',x.PROJECTKINDS_ID)).filter(Boolean).map(k=>nm(k)).filter(Boolean); }catch(_){}
  const ms=Object.keys(I.byM).map(Number).filter(k=>I.byM[k]>0), k0=ms.length?Math.min(...ms):null, k1=ms.length?Math.max(...ms):null;
  const an=k0!=null?Math.floor(k0/12):(+String(p.PROJECTSTARTDATE||'').slice(0,4)||null);
  let av=null; try{ const A=DS.by('sgavancement','PROJECT_ID',p.ID).sort((a,b)=>String(b.DATE).localeCompare(String(a.DATE)))[0]; if(A&&A.GLOBAL_EFF!=null) av=Math.round(+A.GLOBAL_EFF); }catch(_){}
  let R=null; try{ if(MK.D&&typeof sgMargeVisible==='function'&&sgMargeVisible()){ const r=sgRenta(p,MK.D); if(r&&(r.contratHT||r.factHT)) R=r; } }catch(_){}
  const pa=I.pa, code=pa?String((pa.sp&&pa.sp.NUMBER)||(pa.ph&&pa.ph.NUMBER)||'').trim():'';
  const lib=typeof sgPhaseLib==='function'&&pa?sgPhaseLib(pa):'';
  const x={id:p.ID,p,I,v,E:v?v.E:null,N:v?v.N:null,li,km,dir,cat,genres,an,k0,k1,av,R,code,lib,cl:I.cl,ch:I.cl==='rea'&&enCours(p)};
  XC.set(p.ID,x); return x; }
const placés=L=>L.map(X).filter(x=>x.v);
/* localisation : positions (comme la carte actuelle), puis commune et district ; projets en cours d'abord */
let ENC=null;
function preparer(){ if(ENC) return ENC;
  ENC=(async()=>{ try{ await Promise.race([fxEnsure(),new Promise(r=>setTimeout(r,8000))]); MK.D=fxData(); SC.D=MK.D; }catch(_){}
    await bureau().catch(()=>{}); rafraichir(true);
    const L=tous().sort((a,b)=>enCours(b)-enCours(a)), file=L.slice(); let n=0;
    const tour=async()=>{ while(file.length){ const p=file.shift(); let v=null; try{ v=await SC.placer(p); }catch(_){}
      if(v) try{ await lieu(v); }catch(_){}
      n++; MK.prog=n<L.length?'Localisation des projets… '+n+' / '+L.length:''; rafraichir(); } };
    await Promise.all([tour(),tour(),tour(),tour()]); MK.prog=''; rafraichir(true); })();
  return ENC; }
let tR=0; function rafraichir(now){ clearTimeout(tR); tR=setTimeout(()=>{ XC.clear(); if(MK.cur&&MK.cur.maj) MK.cur.maj(); },now?0:450); }

/* ── 3. fonds de carte : couches de swisstopo recolorées sur un canevas (méthode du fond « Encre ») ── */
const K={routes:'ch.swisstopo.swisstlm3d-strassen',routes200:'ch.swisstopo.vec200-transportation-strassennetz',lacs:'ch.bafu.vec25-seen',
  eaux200:'ch.swisstopo.vec200-hydrography',bati:'ch.swisstopo.vec25-gebaeude',relief:'ch.swisstopo.leichte-basiskarte_reliefschattierung'};
const wmsUrl=(l,U)=>SG_FZ_GEO.wms+'?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS='+l+'&STYLES=&CRS=EPSG:2056&BBOX='+U.bb.map(v=>v.toFixed(1)).join(',')
  +'&WIDTH='+U.pw+'&HEIGHT='+U.ph+'&FORMAT=image/png&TRANSPARENT=true';
const couche=(l,U)=>new Promise((ok,ko)=>{ const i=new Image(); i.crossOrigin='anonymous'; i.onload=()=>ok(i); i.onerror=()=>ko(new Error('couche '+l)); i.src=wmsUrl(l,U); });
const toile=U=>{ const c=document.createElement('canvas'); c.width=U.pw; c.height=U.ph; return c; };
const teinte=(U,src,col)=>{ const c=toile(U), x=c.getContext('2d'); x.drawImage(src,0,0,U.pw,U.ph); x.globalCompositeOperation='source-in'; x.fillStyle=col; x.fillRect(0,0,U.pw,U.ph); return c; };
const hachures=(x,col,pas,ep)=>{ const p=document.createElement('canvas'); p.width=p.height=pas; const q=p.getContext('2d'); q.strokeStyle=col; q.lineWidth=ep; q.beginPath();
  q.moveTo(0,pas); q.lineTo(pas,0); q.moveTo(-1,1); q.lineTo(1,-1); q.moveTo(pas-1,pas+1); q.lineTo(pas+1,pas-1); q.stroke(); return x.createPattern(p,'repeat'); };
async function eaux(U){ const I=await Promise.all([couche(K.lacs,U)].concat(U.res>12?[couche(K.eaux200,U)]:[])); const c=toile(U), x=c.getContext('2d'); I.forEach(i=>x.drawImage(i,0,0,U.pw,U.ph)); return c; }
const horsSuisse=(U,src,ch)=>{ const c=toile(U), x=c.getContext('2d'); x.drawImage(src,0,0,U.pw,U.ph); x.globalCompositeOperation='destination-out'; x.drawImage(ch,0,0,U.pw,U.ph); return c; };
/* papier, eau (pleine ou hachurée), bâtiments (vue de ville) ou routes hors de Suisse (vue large), routes — couleur et opacité */
const FONDS={
  trait:{papier:'#FFFFFF',eau:{plein:'#5E6E73'},bati:['#1d1d1b',.18],ext:['#1d1d1b',.32],route:['#1d1d1b',.62]},    /* 1 : affiche de ville, eau ardoise */
  releve:{papier:'#F3F0E7',eau:{hach:'#2338A0'},bati:['#2338A0',.2],ext:['#2338A0',.34],route:['#2338A0',.7]},      /* 2 : relevé bleu sur papier crème */
  nuit:{papier:'#11303D',eau:{plein:'#ECEFEC'},bati:['#FFFFFF',.10],ext:['#FFFFFF',.22],route:['#FFFFFF',.52]},       /* 3 : négatif, terre bleu nuit, eau blanche */
  gris:{papier:'#FBFBF9',eau:{plein:'#DCE3E6'},bati:['#1d1d1b',.09],ext:['#1d1d1b',.18],route:['#1d1d1b',.34]},       /* 4 : fond discret pour les flux */
  rouge:{papier:'#FFFFFF',eau:{plein:'#EEEEEA'},bati:['#1d1d1b',.10],ext:['#C8321E',.26],route:['#C8321E',.48]}};     /* 5 : plan au trait rouge */
async function fond(U,F,sous){ const ville=U.res<=12;
  const [rt,eau,e0,ch]=await Promise.all([couche(K.routes,U),eaux(U),couche(ville?K.bati:K.routes200,U)].concat(ville?[]:[couche(K.relief,U)]));
  const ext=ville?e0:horsSuisse(U,e0,ch), c=toile(U), x=c.getContext('2d');
  x.fillStyle=F.papier; x.fillRect(0,0,U.pw,U.ph);
  if(sous) try{ sous(x,U); }catch(_){}
  if(F.eau.plein) x.drawImage(teinte(U,eau,F.eau.plein),0,0);
  else { const l=teinte(U,eau,'#000'), lx=l.getContext('2d'); lx.globalCompositeOperation='source-in'; lx.fillStyle=hachures(lx,F.eau.hach,Math.max(5,Math.round(6*U.r)),U.r); lx.fillRect(0,0,U.pw,U.ph); x.globalAlpha=.7; x.drawImage(l,0,0); x.globalAlpha=1; }
  const [cb,ab]=ville?F.bati:F.ext; x.globalAlpha=ab; x.drawImage(teinte(U,ext,cb),0,0);
  x.globalAlpha=F.route[1]; x.drawImage(teinte(U,rt,F.route[0]),0,0); x.globalAlpha=1; return c; }

/* ── 4. la carte : fond sur canevas + dessus en SVG redessiné à chaque vue (o.dessus) ── */
const IC={plus:'<svg viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>',
  moins:'<svg viewBox="0 0 16 16"><path d="M3 8h10" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>',
  tout:'<svg viewBox="0 0 16 16"><path d="M2 5.5V2h3.5M10.5 2H14v3.5M14 10.5V14h-3.5M5.5 14H2v-3.5" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>'};
function Carte(el,o){ o=o||{}; el.classList.add('sgcv-map'); if(o.sombre) el.classList.add('sombre'); el.tabIndex=0;
  el.setAttribute('aria-label','Carte : glisser pour déplacer, + / − ou molette pour zoomer');
  const lay=h('div','sgcv-lay'); let base=document.createElement('canvas'); base.className='sgcv-img'; base.width=base.height=0;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('class','sgcv-svg'); lay.append(base,svg);
  /* plan incliné (axonométrie, o.ecran) : le plan est dans tw, incliné en CSS ; svg2 = dessus « à l'écran » (colonnes verticales), points projetés par api.proj */
  const tw=h('div','sgcv-tw'); tw.append(lay); const svg2=document.createElementNS('http://www.w3.org/2000/svg','svg'); svg2.setAttribute('class','sgcv-svg2');
  const tip=h('div','sgcv-tip'), ctl=h('div','sgcv-ctl','<button type="button" data-z="in" title="Zoom avant">'+IC.plus+'</button><button type="button" data-z="out" title="Zoom arrière">'+IC.moins+'</button><button type="button" data-z="fit" title="Voir tous les projets">'+IC.tout+'</button>');
  const att=h('div','sgcv-att','© swisstopo, OFEV'), msg=h('div','sgcv-msg'); msg.style.display='none';
  el.append(tw,svg2,tip,ctl,att,msg);
  const S={E:2540000,N:1150000,res:60}; let imgV=null,tImg=0,tok=0,its=[],ouvert=false,auto=true,nAj=-1,err=false,msgT='';
  const W=()=>el.clientWidth||800, H=()=>el.clientHeight||500;
  const px=(e,n)=>[(e-S.E)/S.res+W()/2,H()/2-(n-S.N)/S.res];
  const vueU=()=>{ const w=W(),hh=H(),r=Math.min(1.5,window.devicePixelRatio||1); return {E:S.E,N:S.N,res:S.res,w,h:hh,r,pw:Math.round(w*r),ph:Math.round(hh*r),bb:[S.E-w/2*S.res,S.N-hh/2*S.res,S.E+w/2*S.res,S.N+hh/2*S.res]}; };
  const placeImg=()=>{ if(!imgV) return; const s=imgV.res/S.res, x=(imgV.E-imgV.w/2*imgV.res-S.E)/S.res+W()/2, y=H()/2-(imgV.N+imgV.h/2*imgV.res-S.N)/S.res;
    base.style.width=imgV.w+'px'; base.style.height=imgV.h+'px'; base.style.transform='translate('+x+'px,'+y+'px) scale('+s+')'; };
  const montrer=()=>{ const t=msgT||(err?'Fond de carte indisponible (connexion à swisstopo ?)':''); msg.textContent=t; msg.style.display=t?'block':'none'; };
  const charger=()=>{ clearTimeout(tImg); tImg=setTimeout(async()=>{ const U=vueU(), t=++tok;
    try{ const c=await fond(U,o.fond,o.sous); if(t===tok&&document.body.contains(el)){ c.className='sgcv-img'; base.replaceWith(c); base=c; imgV=U; err=false; placeImg(); montrer(); } }
    catch(_){ if(t===tok){ err=true; montrer(); } } },150); };
  let MX=null; const OY=.55;
  const proj=(x,y)=>{ if(!MX) return [x,y]; const ox=W()/2, oy=H()*OY, q=MX.transformPoint(new DOMPoint(x-ox,y-oy,0,1)); return [q.x/q.w+ox,q.y/q.w+oy]; };
  const api={px,proj,S,W,H,el,get its(){ return its; },get incline(){ return !!MX; }};
  const dessus=()=>{ const w=W(),hh=H(); svg.setAttribute('width',w); svg.setAttribute('height',hh); svg.setAttribute('viewBox','0 0 '+w+' '+hh); svg.innerHTML=o.dessus?o.dessus(api):'';
    MX=tw.style.transform?new DOMMatrix(getComputedStyle(tw).transform):null;
    svg2.setAttribute('width',w); svg2.setAttribute('height',hh); svg2.setAttribute('viewBox','0 0 '+w+' '+hh); svg2.innerHTML=o.ecran?o.ecran(api):''; svg2.style.visibility=''; };
  const vue=()=>{ placeImg(); dessus(); charger(); if(o.surVue) o.surVue(api); };
  const ajuster=(L,pad)=>{ L=(L||[]).filter(x=>x&&x.E); if(!L.length){ vue(); return; } pad=pad==null?(o.pad||70):pad;
    let e0=Infinity,e1=-Infinity,n0=Infinity,n1=-Infinity; L.forEach(x=>{ e0=Math.min(e0,x.E); e1=Math.max(e1,x.E); n0=Math.min(n0,x.N); n1=Math.max(n1,x.N); });
    S.E=(e0+e1)/2; S.N=(n0+n1)/2; S.res=Math.min(900,Math.max(2,Math.max((e1-e0)/Math.max(60,W()-2*pad),(n1-n0)/Math.max(60,H()-2*pad)))); vue(); };
  /* cadrage à l'ouverture : sans les projets isolés à plus de 35 km du bureau quand ils sont moins d'un sur cinq ; le bouton « tout » les montre tous */
  const proche=L=>{ const B=SC.bureau; if(!B||L.length<5) return L; const P=L.filter(x=>Math.hypot(x.E-B.E,x.N-B.N)<35000); return P.length>=L.length*.8?P:L; };
  const cadre=tout=>{ let L=o.cadre?o.cadre(its):its; if(!tout) L=proche(L); return SC.bureau&&o.bureau!==false?L.concat([SC.bureau]):L; };
  const zoom=(f,mx,my)=>{ auto=false; const nr=Math.min(900,Math.max(0.6,S.res*f)); if(mx!=null){ const ec=S.E+(mx-W()/2)*S.res, nc=S.N-(my-H()/2)*S.res; S.E=ec-(mx-W()/2)*nr; S.N=nc+(my-H()/2)*nr; } S.res=nr; vue(); };
  ctl.onclick=e=>{ const b=e.target.closest('button'); if(!b) return; e.stopPropagation(); const z=b.dataset.z; if(z==='in') zoom(1/1.6); else if(z==='out') zoom(1.6); else { auto=true; ajuster(cadre(true)); } };
  let dr=null;
  el.addEventListener('pointerdown',e=>{ if(e.button!==0||e.target.closest('.sgcv-ctl')) return; dr={x:e.clientX,y:e.clientY,m:false,t:e.target}; try{ el.setPointerCapture(e.pointerId); }catch(_){} });
  el.addEventListener('pointermove',e=>{ if(dr){ const dx=e.clientX-dr.x, dy=e.clientY-dr.y; if(!dr.m&&Math.abs(dx)+Math.abs(dy)>4){ dr.m=true; auto=false; el.classList.add('drag'); tip.style.display='none'; }
      if(dr.m){ lay.style.transform='translate('+dx+'px,'+dy+'px)'; svg2.style.visibility='hidden'; } return; }
    const t=e.target.closest&&e.target.closest('[data-id],[data-k]'), html=t&&o.tip?o.tip(t):'';
    if(html){ const b=el.getBoundingClientRect(); tip.innerHTML=html; tip.style.display='block'; tip.style.left=Math.max(6,Math.min(W()-300,e.clientX-b.left+14))+'px'; tip.style.top=Math.max(6,Math.min(H()-70,e.clientY-b.top+14))+'px'; }
    else tip.style.display='none';
    if(o.survol) o.survol(t||null); });
  const fin=e=>{ if(!dr) return; const d=dr; dr=null; el.classList.remove('drag'); try{ el.releasePointerCapture(e.pointerId); }catch(_){}
    if(d.m){ const dx=e.clientX-d.x, dy=e.clientY-d.y; lay.style.transform=''; S.E-=dx*S.res; S.N+=dy*S.res; vue(); return; }
    const t=document.elementFromPoint(e.clientX,e.clientY)||d.t, a=t&&t.closest&&t.closest('[data-id],[data-k]');
    if(a&&a.dataset.id){ const id=a.dataset.id; if(o.choisir) o.choisir(isNaN(+id)?id:+id); return; }
    if(a&&a.dataset.k){ if(o.clic) o.clic(a.dataset.k,a); return; }
    if(o.vide) o.vide(); };
  el.addEventListener('pointerup',fin); el.addEventListener('pointercancel',fin);
  el.addEventListener('pointerleave',()=>{ if(!dr){ tip.style.display='none'; if(o.survol) o.survol(null); } });
  el.addEventListener('wheel',e=>{ e.preventDefault(); const b=el.getBoundingClientRect(); zoom(e.deltaY>0?1.3:1/1.3,e.clientX-b.left,e.clientY-b.top); },{passive:false});
  el.addEventListener('keydown',e=>{ if(e.target!==el) return; const pas=80*S.res;
    if(e.key==='+'||e.key==='=') zoom(1/1.6); else if(e.key==='-') zoom(1.6); else if(e.key==='ArrowLeft'){ S.E-=pas; vue(); } else if(e.key==='ArrowRight'){ S.E+=pas; vue(); }
    else if(e.key==='ArrowUp'){ S.N+=pas; vue(); } else if(e.key==='ArrowDown'){ S.N-=pas; vue(); } else return; auto=false; e.preventDefault(); });
  const ro=new ResizeObserver(()=>{ if(!document.body.contains(el)){ ro.disconnect(); return; } if(ouvert) vue(); }); ro.observe(el);
  return {
    /* tant que personne n'a déplacé ni zoomé la carte, elle suit tous les projets placés ; ensuite la vue est gardée */
    set(L){ its=L; const k=L.length+(SC.bureau?1:0); if(!ouvert||(auto&&k!==nAj)){ ouvert=true; nAj=k; ajuster(cadre()); } else dessus(); },
    redraw:dessus, recharger:charger, incliner(t){ tw.style.transform=t||''; tw.style.transformOrigin='50% '+(OY*100)+'%'; dessus(); charger(); }, vers(L,pad){ auto=false; ajuster(L,pad); }, tout(){ auto=true; ajuster(cadre(true)); }, centrer(x,res){ auto=false; S.E=x.E; S.N=x.N; if(res) S.res=res; vue(); },
    S, px, message(t){ msgT=t||''; montrer(); }, detruire(){ ro.disconnect(); clearTimeout(tImg); } }; }

/* dessus : morceaux communs */
const pathGeo=(g,px)=>{ const P=g.type==='MultiPolygon'?g.coordinates:g.type==='Polygon'?[g.coordinates]:[]; let d='';
  P.forEach(pl=>pl.forEach(R=>{ let lx=null,ly=null,s=''; R.forEach((c,i)=>{ const [x,y]=px(c[0],c[1]); if(lx!=null&&Math.abs(x-lx)+Math.abs(y-ly)<1.4&&i<R.length-1) return; s+=(s?'L':'M')+x.toFixed(1)+' '+y.toFixed(1); lx=x; ly=y; }); d+=s+'Z'; })); return d; };
const dedans=(api,x,y,m)=>{ m=m||30; return x>-m&&x<api.W()+m&&y>-m&&y<api.H()+m; };
const burSvg=(api,o)=>{ const B=SC.bureau; if(!B) return ''; const [x,y]=api.px(B.E,B.N); if(!dedans(api,x,y,60)) return ''; o=o||{};
  return '<g class="sgcv-bur" data-k="bureau" transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+')"><rect x="-6" y="-6" width="12" height="12" fill="'+(o.fond||'#1d1d1b')+'"/><rect x="-3" y="-3" width="6" height="6" fill="'+(o.coeur||'#FFF266')+'"/>'
    +'<text x="10" y="4" class="'+(o.cls||'')+'">'+(o.lib||'Bureau')+'</text></g>'; };
const tipP=x=>'<b>'+E(x.p.NUMBER)+' · '+E(x.p.TITLE||'')+'</b>'+E(PH[x.cl][0])+(x.li&&x.li.com?' · '+E(x.li.com):'')+(x.I.h30?' · '+HR(x.I.h30)+' h ces 30 jours':'');
const tipBur=()=>SC.bureau?'<b>'+E(SC.bureau.nom||'Bureau')+'</b>'+E(SC.bureau.adr||''):'';
const tipDe=(t,its)=>{ if(t.dataset.id){ const x=its.find(z=>String(z.id)===t.dataset.id); return x?tipP(x):''; } if(t.dataset.k==='bureau') return tipBur(); return ''; };

/* fiche commune à toutes les propositions */
function fiche(x,o){ o=o||{}; const p=x.p, I=x.I, pct=I.hprev?Math.round(I.htot/I.hprev*100):null;
  const kv=[['Avancement',x.lib&&x.cl!=='fin'?x.lib:PH[x.cl][0]],['Heures saisies',HR(I.htot)+' h'+(I.hprev?' sur '+HR(I.hprev)+' h prévues ('+pct+' %)':'')],
    ['Ces 30 jours',HR(I.h30)+' h'],['Dernière saisie',I.last?jma(iso(tlDate(I.last))):'—'],['Prochaine échéance',I.proch?jma(I.proch.d)+' · '+I.proch.l.lib:'—'],
    ['Lieu',(x.li&&x.li.com?x.li.com+(x.li.dis&&x.li.dis!==x.li.com?' ('+x.li.dis+')':''):'—')+(x.km!=null?' · '+KM(x.km)+' '+x.dir+' du bureau':'')]];
  if(x.av!=null) kv.push(['Prestations réalisées',x.av+' %']);
  kv.push(['Type',(CAT[x.cat]||CAT.architecture)[0]+(x.genres.length?' · '+x.genres.join(', '):'')]);
  if(x.R) kv.push(['Honoraires HT',N0(x.R.contratHT)+' · facturé '+N0(x.R.factHT)]);
  if(I.permis) kv.push(['Permis de construire',I.permis.lib]);
  if(I.equipe.length) kv.push(['Équipe',I.equipe.slice(0,6).map(e=>ini(e.s)).join(' · ')]);
  return '<div class="sgcv-fi '+(o.cls||'')+'">'+(o.retour?'<button type="button" class="sgcv-ret" data-act="retour">‹ '+E(o.retour)+'</button>':'')
    +'<div class="hd"><span class="n">'+E(p.NUMBER)+'</span><span class="t">'+E(p.TITLE||'')+'</span>'+(I.mo.length?'<span class="mo">'+E(I.mo.join(', '))+'</span>':'')+'</div>'
    +'<dl>'+kv.map(([k,v])=>'<dt>'+E(k)+'</dt><dd>'+E(v)+'</dd>').join('')+'</dl>'
    +'<div class="act"><button type="button" data-act="page" data-p="'+E(p.ID)+'">Page du projet</button><button type="button" data-act="tdb" data-p="'+E(p.ID)+'">Tableau de bord</button></div></div>'; }
function actions(box,retour){ box.addEventListener('click',e=>{ const b=e.target.closest('[data-act]'); if(!b) return; const a=b.dataset.act, id=isNaN(+b.dataset.p)?b.dataset.p:+b.dataset.p;
  if(a==='page') go('nx-pdom',String(id)); else if(a==='tdb') go('nx-projet',id); else if(a==='retour'&&retour) retour(); }); }
const seg=(cle,val,opts)=>'<span class="sgcv-seg" data-seg="'+cle+'">'+opts.map(([v,l])=>'<button type="button" data-v="'+v+'" class="'+(v===val?'on':'')+'">'+E(l)+'</button>').join('')+'</span>';
function segs(box,f){ box.querySelectorAll('.sgcv-seg').forEach(s=>s.onclick=e=>{ const b=e.target.closest('button'); if(!b) return; f(s.dataset.seg,b.dataset.v); }); }

/* ═══ 1. ATLAS DES RÉGIONS — affiche de ville : plan au trait, eau ardoise, communes hachurées selon la densité, index numéroté par commune ═══ */
function P1(z){
  z.innerHTML='<div class="sgcv-p1"><div class="sgcv-p1-g"><div class="sgcv-p1-m"></div><div class="sgcv-poster"><div class="t"></div><div class="s"></div></div></div><aside class="sgcv-p1-i"></aside></div>';
  const st={grp:sessionStorage.getItem('sgcv1_grp')||'com',mes:sessionStorage.getItem('sgcv1_mes')||'n',zone:null,hl:null};
  const aside=z.querySelector('aside'), poster=z.querySelector('.sgcv-poster');
  let its=[], G=[], num=new Map();
  const cle=x=>st.grp==='dis'?(x.li&&x.li.dis||'Sans district'):(x.li&&x.li.com||'Commune inconnue');
  const val=x=>st.mes==='h'?x.I.htot:st.mes==='f'?(x.R?x.R.contratHT:0):1;
  const C=Carte(z.querySelector('.sgcv-p1-m'),{fond:FONDS.trait,pad:60,
    sous:(x,U)=>{ const P=communes(), vmax=Math.max(1,...[...P.values()].map(g=>g.v));
      P.forEach((g,bfs)=>{ const ge=MK.geo.get(bfs); if(!ge) return; const lvl=g.v/vmax>.5?2:g.v/vmax>.2?1:0, on=st.zone&&st.grp==='com'&&st.zone===ge.nom;
        const pl=ge.g.type==='MultiPolygon'?ge.g.coordinates:ge.g.type==='Polygon'?[ge.g.coordinates]:[];
        x.beginPath(); pl.forEach(po=>po.forEach(R=>{ R.forEach((c,i)=>{ const X=(c[0]-U.bb[0])/U.res*U.r, Y=(U.bb[3]-c[1])/U.res*U.r; i?x.lineTo(X,Y):x.moveTo(X,Y); }); x.closePath(); }));
        x.fillStyle=on?'#1d1d1b':hachures(x,'#1d1d1b',Math.round([9,6,4][lvl]*U.r),(lvl?1.1:.9)*U.r); x.globalAlpha=on?.9:.55; x.fill('evenodd');
        x.globalAlpha=1; x.lineWidth=(on?1.8:.9)*U.r; x.strokeStyle='#1d1d1b'; x.stroke(); }); },
    dessus:api=>{ const px=api.px, S=api.S; let s='';
      communes().forEach((g,bfs)=>{ const ge=MK.geo.get(bfs); if(ge) s+='<path d="'+pathGeo(ge.g,px)+'" data-k="c:'+E(ge.nom)+'" fill="#000" fill-opacity="0" stroke="none" fill-rule="evenodd"/>'; });
      s+=burSvg(api,{fond:'#1d1d1b',coeur:'#FFF266'});
      const lab=S.res<14;
      its.forEach(x=>{ const [a,b]=px(x.E,x.N); if(!dedans(api,a,b)) return; const on=x.id===MK.sel, sur=x.id===st.hl, inv=st.zone&&cle(x)===st.zone&&st.grp==='com';
        const r=on?7.5:sur?6.5:5.5, n=num.get(x.id)||'';
        s+='<g data-id="'+E(x.id)+'" transform="translate('+a.toFixed(1)+' '+b.toFixed(1)+')"><rect x="'+(-r)+'" y="'+(-r)+'" width="'+2*r+'" height="'+2*r+'" fill="'+(on?'#FFF266':inv?'#FFFFFF':'#1d1d1b')+'" stroke="'+(on?'#1d1d1b':inv?'#1d1d1b':'#FFFFFF')+'" stroke-width="'+(on?2:1.8)+'"/>'
          +((lab||on||sur)&&n?'<text x="'+(r+4)+'" y="4" class="sgcv-t1 halo">'+n+'</text>':'')+'</g>'; });
      return s; },
    tip:t=>{ if(t.dataset.k&&t.dataset.k.startsWith('c:')){ const nom=t.dataset.k.slice(2), L=its.filter(x=>x.li&&x.li.com===nom); return '<b>'+E(nom)+'</b>'+L.length+' projet'+(L.length>1?'s':'')+' · '+HR(L.reduce((s,x)=>s+x.I.htot,0))+' h'; } return tipDe(t,its); },
    choisir:id=>choisir(id), clic:k=>{ if(k.startsWith('c:')){ st.grp='com'; zone(k.slice(2)); } }, vide:()=>{ if(MK.sel!=null) choisir(null); else if(st.zone) zone(null); },
    surVue:api=>{ posterMaj(api); } });
  function posterMaj(api){ const vis=its.filter(x=>{ const [a,b]=api.px(x.E,x.N); return dedans(api,a,b,0); }), c={};
    vis.forEach(x=>{ const k=x.li&&x.li.dis||''; if(k) c[k]=(c[k]||0)+1; });
    const titre=st.zone||(Object.entries(c).sort((a,b)=>b[1]-a[1])[0]||[''])[0]||'Vaud';
    poster.querySelector('.t').textContent=titre.toUpperCase();
    poster.querySelector('.s').textContent=(vis.length+' projet'+(vis.length>1?'s':''))+'  ·  '+wgs(api.S.E,api.S.N); }
  function communes(){ const m=new Map(); its.forEach(x=>{ if(!x.li||!x.li.bfs) return; const g=m.get(x.li.bfs)||{v:0,n:0}; g.v+=val(x); g.n++; m.set(x.li.bfs,g); }); return m; }
  function zone(k){ st.zone=k; MK.sel=null; C.recharger(); const L=k?its.filter(x=>cle(x)===k):null; if(L&&L.length) C.vers(L,90); else C.redraw(); index(); }
  function choisir(id){ MK.sel=id; const x=its.find(z=>z.id===id); if(x) C.centrer(x,Math.min(C.S.res,10)); else C.redraw(); index(); }
  function index(){ if(MK.sel!=null){ const x=its.find(z=>z.id===MK.sel); if(x){ aside.innerHTML=fiche(x,{retour:'Index',cls:'p1'}); return; } }
    const tot=its.reduce((s,x)=>s+val(x),0);
    aside.innerHTML='<div class="sgcv-p1-ih"><h4>Index</h4>'+seg('grp',st.grp,[['com','Communes'],['dis','Districts']])+seg('mes',st.mes,[['n','Projets'],['h','Heures']].concat(its.some(x=>x.R)?[['f','Honoraires']]:[]))+'</div>'
      +(st.zone?'<button type="button" class="sgcv-ret" data-act="tout">‹ Toutes les régions</button>':'')
      +G.filter(g=>!st.zone||g.k===st.zone).map(g=>'<div class="sgcv-p1-gr'+(g.k===st.zone?' on':'')+'"><button type="button" class="gh" data-z="'+E(g.k)+'"><span class="nm">'+E(g.k)+'</span><span class="v">'+(st.mes==='n'?g.L.length:st.mes==='h'?HR(g.v)+' h':N0(g.v))+'</span>'
        +'<i style="width:'+(tot?Math.max(2,g.v/tot*100):0)+'%"></i></button>'
        +g.L.map(x=>'<button type="button" class="it" data-id="'+E(x.id)+'"><span class="no">'+num.get(x.id)+'</span><span class="pn">'+E(x.p.NUMBER)+'</span><span class="pt">'+E(x.p.TITLE||'')+'</span><span class="ph" style="--c:'+PH[x.cl][1]+'" title="'+E(PH[x.cl][0])+'"></span></button>').join('')+'</div>').join('')
      +(MK.prog?'<div class="sgcv-prog">'+E(MK.prog)+'</div>':'')+(sans()?'<div class="sgcv-note">'+sans()+' projet'+(sans()>1?'s':'')+' sans position (adresse manquante).</div>':'');
    segs(aside,(k,v)=>{ st[k]=v; sessionStorage.setItem('sgcv1_'+k,v); if(k==='grp') st.zone=null; grouper(); C.redraw(); C.recharger(); index(); });
    aside.querySelectorAll('.gh').forEach(b=>b.onclick=()=>zone(st.zone===b.dataset.z?null:b.dataset.z));
    aside.querySelectorAll('.it').forEach(b=>{ b.onclick=()=>choisir(isNaN(+b.dataset.id)?b.dataset.id:+b.dataset.id); b.onmouseenter=()=>{ st.hl=isNaN(+b.dataset.id)?b.dataset.id:+b.dataset.id; C.redraw(); }; b.onmouseleave=()=>{ st.hl=null; C.redraw(); }; });
    const t=aside.querySelector('[data-act="tout"]'); if(t) t.onclick=()=>{ zone(null); C.tout(); }; }
  const sans=()=>projets().filter(p=>SC.pos.has(p.ID)&&!SC.pos.get(p.ID)).length;
  function grouper(){ const m=new Map(); its.forEach(x=>{ const k=cle(x); const g=m.get(k)||{k,L:[],v:0}; g.L.push(x); g.v+=val(x); m.set(k,g); });
    G=[...m.values()].sort((a,b)=>b.v-a.v||a.k.localeCompare(b.k)); let i=0; num=new Map(); G.forEach(g=>{ g.L.sort((a,b)=>String(a.p.NUMBER).localeCompare(String(b.p.NUMBER))); g.L.forEach(x=>num.set(x.id,String(++i).padStart(2,'0'))); }); }
  actions(aside,()=>{ MK.sel=null; C.redraw(); index(); });
  return {maj(){ its=placés(projets()); grouper(); C.set(its); C.recharger(); C.message(MK.prog); index(); },detruire(){ C.detruire(); }}; }

/* ═══ 2. RELEVÉ — densité : carroyage kilométrique bleu, graduations LV95, petits relevés à côté (années, types, distance, communes) ═══ */
function P2(z){
  /* carte sur toute la largeur (23.11.2026, Paulo : « agrandir la carte jusqu'au bord et mettre les données en dessous ») : relevés en colonnes sous la carte,
     fiche d'un projet ou d'une case dans une carte flottante sur le plan */
  z.innerHTML='<div class="sgcv-p2"><div class="sgcv-p2-l"><div class="sgcv-p2-hd"></div><div class="sgcv-p2-mw"><div class="sgcv-p2-m"></div><div class="sgcv-p2-fl" hidden></div></div></div><div class="sgcv-p2-r"></div></div>';
  const st={mes:sessionStorage.getItem('sgcv2_mes')||'n',ans:new Set(),cat:null,gen:null,dst:null,cell:null,pas:2};
  const hd=z.querySelector('.sgcv-p2-hd'), aside=z.querySelector('.sgcv-p2-r'), fl=z.querySelector('.sgcv-p2-fl'); let base=[], its=[];
  const BL='#2338A0';
  const DST=[[0,2,'0–2'],[2,5,'2–5'],[5,10,'5–10'],[10,20,'10–20'],[20,50,'20–50'],[50,1e9,'50+']];
  const filtre=x=>(!st.ans.size||st.ans.has(x.an))&&(!st.cat||x.cat===st.cat)&&(!st.gen||x.genres.includes(st.gen))&&(st.dst==null||(x.km!=null&&x.km>=DST[st.dst][0]&&x.km<DST[st.dst][1]));
  const pasDe=res=>{ const c=[0.25,0.5,1,2,5,10,20,50]; const want=res*54/1000; return c.reduce((b,v)=>Math.abs(Math.log(v/want))<Math.abs(Math.log(b/want))?v:b,c[0]); };
  const cellK=(x,pas)=>Math.floor(x.E/(pas*1000))+':'+Math.floor(x.N/(pas*1000));
  const C=Carte(z.querySelector('.sgcv-p2-m'),{fond:FONDS.releve,pad:70,
    dessus:api=>{ const px=api.px, S=api.S, w=api.W(), hh=api.H(), pas=st.pas=pasDe(S.res), m=pas*1000;
      let s='';
      /* papier millimétré : lignes du carroyage sur toute la vue */
      const e0=Math.floor((S.E-w/2*S.res)/m)*m, e1=S.E+w/2*S.res, n0=Math.floor((S.N-hh/2*S.res)/m)*m, n1=S.N+hh/2*S.res;
      for(let e=e0;e<=e1;e+=m){ const [x]=px(e,0); s+='<line x1="'+x.toFixed(1)+'" y1="0" x2="'+x.toFixed(1)+'" y2="'+hh+'" class="sgcv-g2"/>'; }
      for(let n=n0;n<=n1;n+=m){ const [,y]=px(0,n); s+='<line x1="0" y1="'+y.toFixed(1)+'" x2="'+w+'" y2="'+y.toFixed(1)+'" class="sgcv-g2"/>'; }
      /* cases occupées : bleu d'autant plus dense qu'il y a de projets (ou d'heures) */
      const parC=new Map(); its.forEach(x=>{ const k=cellK(x,pas), g=parC.get(k)||{n:0,h:0,L:[]}; g.n++; g.h+=x.I.htot; g.L.push(x); parC.set(k,g); });
      const vmax=Math.max(1,...[...parC.values()].map(g=>st.mes==='h'?g.h:g.n));
      parC.forEach((g,k)=>{ const [i,j]=k.split(':').map(Number), [x0,y1]=px(i*m,j*m), [x1,y0]=px((i+1)*m,(j+1)*m), v=(st.mes==='h'?g.h:g.n)/vmax, on=st.cell===k;
        if(x1<-5||x0>w+5||y1<-5||y0>hh+5) return;
        s+='<rect data-k="g:'+k+'" x="'+x0.toFixed(1)+'" y="'+y0.toFixed(1)+'" width="'+(x1-x0).toFixed(1)+'" height="'+(y1-y0).toFixed(1)+'" fill="'+BL+'" fill-opacity="'+(0.12+0.66*Math.sqrt(v)).toFixed(2)+'" stroke="'+(on?'#1d1d1b':BL)+'" stroke-width="'+(on?2.2:.8)+'"/>';
        if(x1-x0>=24) s+='<text x="'+(x0+4).toFixed(1)+'" y="'+(y0+12).toFixed(1)+'" class="sgcv-t2'+(v>.45?' cl':'')+'">'+(st.mes==='h'?HR(g.h):g.n)+'</text>'; });
      /* chaque projet : un point ; le projet choisi : cercle et numéro */
      its.forEach(x=>{ const [a,b]=px(x.E,x.N); if(!dedans(api,a,b)) return; const on=x.id===MK.sel;
        s+='<g data-id="'+E(x.id)+'" transform="translate('+a.toFixed(1)+' '+b.toFixed(1)+')"><circle r="'+(on?6:2.6)+'" fill="'+(on?'#F3F0E7':'#0E1B5C')+'" stroke="'+(on?'#0E1B5C':'none')+'" stroke-width="2"/>'+(on?'<text x="9" y="4" class="sgcv-t2 halo">'+E(x.p.NUMBER)+'</text>':'')+'</g>'; });
      s+=burSvg(api,{fond:BL,coeur:'#F3F0E7',lib:'BUREAU',cls:'sgcv-t2'});
      /* graduations kilométriques (LV95), comme les relevés : en haut et à gauche, une étiquette tous les ≥ 70 px */
      const k=Math.max(1,Math.ceil(70/(m/S.res)));
      for(let e=e0;e<=e1;e+=m*k){ const [x]=px(e,0); if(x<30||x>w-30) continue; s+='<line x1="'+x.toFixed(1)+'" y1="0" x2="'+x.toFixed(1)+'" y2="7" class="sgcv-tk"/><text x="'+(x+3).toFixed(1)+'" y="17" class="sgcv-ax">'+N0(e/1000)+'</text>'; }
      for(let n=n0;n<=n1;n+=m*k){ const [,y]=px(0,n); if(y<30||y>hh-30) continue; s+='<line x1="0" y1="'+y.toFixed(1)+'" x2="7" y2="'+y.toFixed(1)+'" class="sgcv-tk"/><text x="10" y="'+(y-3).toFixed(1)+'" class="sgcv-ax">'+N0(n/1000)+'</text>'; }
      s+='<g class="sgcv-reg"><rect x="4" y="4" width="6" height="6"/><rect x="'+(w-10)+'" y="4" width="6" height="6"/><rect x="4" y="'+(hh-10)+'" width="6" height="6"/><rect x="'+(w-10)+'" y="'+(hh-10)+'" width="6" height="6"/></g>';
      return s; },
    surVue:()=>entete(),
    tip:t=>{ if(t.dataset.k&&t.dataset.k.startsWith('g:')){ const k=t.dataset.k.slice(2), L=its.filter(x=>cellK(x,st.pas)===k); return '<b>Case de '+st.pas+' × '+st.pas+' km</b>'+L.length+' projet'+(L.length>1?'s':'')+' · '+HR(L.reduce((s,x)=>s+x.I.htot,0))+' h'; } return tipDe(t,its); },
    choisir:id=>{ MK.sel=id; C.redraw(); panneau(); },
    clic:k=>{ if(k.startsWith('g:')){ st.cell=st.cell===k.slice(2)?null:k.slice(2); MK.sel=null; C.redraw(); panneau(); } },
    vide:()=>{ MK.sel=null; st.cell=null; C.redraw(); panneau(); } });
  function entete(){ const ans=base.map(x=>x.an).filter(Boolean), a0=ans.length?Math.min(...ans):'', a1=ans.length?Math.max(...ans):'';
    hd.innerHTML='<span>RELEVÉ DES PROJETS</span><span>['+its.length+' / '+base.length+' PROJETS]</span><span>['+a0+'–'+a1+']</span><span>CARROYAGE '+String(st.pas).replace('.',',')+' KM</span>'
      +'<span class="dr">'+seg('mes',st.mes,[['n','Nombre'],['h','Heures']])+'</span>';
    segs(hd,(k,v)=>{ st[k]=v; sessionStorage.setItem('sgcv2_'+k,v); C.redraw(); entete(); }); }
  const barres=(L,o)=>{ const M=Math.max(1,...L.map(r=>r.v)); return '<div class="sgcv-bars'+(o&&o.v?' v':'')+'">'+L.map(r=>'<button type="button" class="'+(r.on?'on':'')+(r.off?' off':'')+'" data-f="'+E(r.f)+'" title="'+E(r.t||r.l)+'"><span class="l">'+E(r.l)+'</span><span class="b"><i style="'+(o&&o.v?'height':'width')+':'+Math.max(r.v?3:0,r.v/M*100)+'%"></i></span><span class="n">'+E(r.n!=null?r.n:r.v)+'</span></button>').join('')+'</div>'; };
  function panneau(){ flot(); releves(); }
  /* carte flottante sur le plan : fiche du projet choisi, sinon projets de la case choisie */
  function flot(){ let h='';
    if(MK.sel!=null){ const x=its.find(z=>z.id===MK.sel)||base.find(z=>z.id===MK.sel); if(x) h=fiche(x,{retour:st.cell?'Case':null,cls:'p2'}); }
    if(!h&&st.cell){ const L=its.filter(x=>cellK(x,st.pas)===st.cell).sort((a,b)=>b.I.htot-a.I.htot);
      h='<h4 class="sgcv-p2-h">Case '+st.cell.replace(':',' · ')+' <small>'+st.pas+' × '+st.pas+' km</small></h4>'
        +L.map(x=>'<button type="button" class="sgcv-li" data-id="'+E(x.id)+'"><b>'+E(x.p.NUMBER)+'</b> '+E(x.p.TITLE||'')+'<small>'+E(PH[x.cl][0])+' · '+HR(x.I.htot)+' h'+(x.an?' · depuis '+x.an:'')+'</small></button>').join(''); }
    fl.hidden=!h; fl.innerHTML=h?'<button type="button" class="sgcv-p2-x" data-act="fermer" title="Fermer (Échap)" aria-label="Fermer">×</button>'+h:'';
    fl.querySelectorAll('.sgcv-li').forEach(b=>b.onclick=()=>{ MK.sel=isNaN(+b.dataset.id)?b.dataset.id:+b.dataset.id; C.redraw(); panneau(); }); }
  function releves(){ const tous_=base;
    /* relevés croisés : chaque relevé est compté sur les projets qui passent les autres filtres */
    const sauf=k=>tous_.filter(x=>(k==='an'||!st.ans.size||st.ans.has(x.an))&&(k==='cat'||!st.cat||x.cat===st.cat)&&(k==='gen'||!st.gen||x.genres.includes(st.gen))&&(k==='dst'||st.dst==null||(x.km!=null&&x.km>=DST[st.dst][0]&&x.km<DST[st.dst][1])));
    const A=sauf('an'), ys=[...new Set(tous_.map(x=>x.an).filter(Boolean))].sort();
    const rA=ys.map(y=>({f:'an:'+y,l:String(y).slice(2),t:String(y),v:A.filter(x=>x.an===y).length,on:st.ans.has(y),off:st.ans.size&&!st.ans.has(y)}));
    const Ct=sauf('cat'), rC=CAT_ORD.filter(k=>tous_.some(x=>x.cat===k)).map(k=>({f:'cat:'+k,l:CAT[k][0],v:Ct.filter(x=>x.cat===k).length,on:st.cat===k,off:st.cat&&st.cat!==k}));
    const Dt=sauf('dst'), rD=DST.map((d,i)=>({f:'dst:'+i,l:d[2]+' km',v:Dt.filter(x=>x.km!=null&&x.km>=d[0]&&x.km<d[1]).length,on:st.dst===i,off:st.dst!=null&&st.dst!==i}));
    const parCom=new Map(); its.forEach(x=>{ const k=x.li&&x.li.com||'—'; const g=parCom.get(k)||{n:0,h:0}; g.n++; g.h+=x.I.htot; parCom.set(k,g); });
    const rM=[...parCom.entries()].sort((a,b)=>(st.mes==='h'?b[1].h-a[1].h:b[1].n-a[1].n)).slice(0,8).map(([k,g])=>({f:'',l:k,v:st.mes==='h'?Math.round(g.h):g.n,n:st.mes==='h'?HR(g.h)+' h':g.n}));
    /* genres d'affaire en graphique (23.11.2026, Paulo : « ajouter graphique ») : barres comme les autres relevés, un clic filtre la carte ;
       un projet peut avoir plusieurs genres */
    const Gt=sauf('gen'), gen=new Map(); tous_.forEach(x=>x.genres.forEach(g=>gen.set(g,0))); Gt.forEach(x=>x.genres.forEach(g=>gen.set(g,gen.get(g)+1)));
    const rG=[...gen.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'fr')).slice(0,8).map(([g,n])=>({f:'gen:'+g,l:g,v:n,on:st.gen===g,off:st.gen&&st.gen!==g}));
    aside.innerHTML='<div class="sgcv-p2-b"><h5>Début du projet <small>année de la première heure</small></h5>'+barres(rA,{v:1})+'</div>'
      +'<div class="sgcv-p2-b"><h5>Type</h5>'+barres(rC)+(rG.length?'<h6 class="sgcv-p2-sh">Genre d’affaire</h6>'+barres(rG).replace('sgcv-bars','sgcv-bars lg'):'')+'</div>'
      +'<div class="sgcv-p2-b"><h5>Distance du bureau <small>à vol d’oiseau</small></h5>'+barres(rD)+'</div>'
      +'<div class="sgcv-p2-b"><h5>Communes <small>'+(st.mes==='h'?'heures':'projets')+'</small></h5>'+barres(rM)+'</div>'
      +((st.ans.size||st.cat||st.gen||st.dst!=null||MK.prog)?'<div class="sgcv-p2-pied">'+((st.ans.size||st.cat||st.gen||st.dst!=null)?'<button type="button" class="sgcv-ret" data-act="raz">× Effacer les filtres</button>':'')
        +(MK.prog?'<div class="sgcv-prog">'+E(MK.prog)+'</div>':'')+'</div>':'');
    aside.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{ const f=b.dataset.f, i=f.indexOf(':'), k=i>0?f.slice(0,i):'', v=f.slice(i+1); if(!k) return;
      if(k==='an'){ const y=+v; st.ans.has(y)?st.ans.delete(y):st.ans.add(y); } else if(k==='cat') st.cat=st.cat===v?null:v; else if(k==='gen') st.gen=st.gen===v?null:v; else if(k==='dst') st.dst=st.dst===+v?null:+v;
      its=base.filter(filtre); st.cell=null; C.redraw(); entete(); panneau(); });
    const r=aside.querySelector('[data-act="raz"]'); if(r) r.onclick=()=>{ st.ans.clear(); st.cat=null; st.gen=null; st.dst=null; its=base.filter(filtre); C.redraw(); entete(); panneau(); }; }
  actions(fl,()=>{ if(MK.sel!=null) MK.sel=null; else st.cell=null; C.redraw(); panneau(); });
  const fermer=()=>{ MK.sel=null; st.cell=null; C.redraw(); panneau(); };
  fl.addEventListener('click',e=>{ if(e.target.closest('[data-act="fermer"]')) fermer(); });
  fl.addEventListener('keydown',e=>{ if(e.key==='Escape'){ e.stopPropagation(); fermer(); } });
  z.querySelector('.sgcv-p2-m').addEventListener('keydown',e=>{ if(e.key==='Escape'&&!fl.hidden){ e.stopPropagation(); fermer(); } });
  return {maj(){ base=placés(projets()); its=base.filter(filtre); C.set(its); C.message(MK.prog); entete(); panneau(); },detruire(){ C.detruire(); }}; }

/* ═══ 3. NUIT — chantiers en cours : carte en négatif, chantiers en jaune (taille = heures des 30 jours), rayons depuis le bureau, cercles de distance,
       planning des chantiers en bas, fiche flottante ═══ */
function P3(z){
  z.innerHTML='<div class="sgcv-p3"><div class="sgcv-p3-w"><div class="sgcv-p3-m"></div><div class="sgcv-p3-t"></div><div class="sgcv-p3-f"></div><div class="sgcv-p3-c"></div></div><div class="sgcv-p3-p"></div></div>';
  const st={mode:sessionStorage.getItem('sgcv3_mode')||'ch',hl:null};
  const T=z.querySelector('.sgcv-p3-t'), F=z.querySelector('.sgcv-p3-f'), Cd=z.querySelector('.sgcv-p3-c'), Pl=z.querySelector('.sgcv-p3-p'); let its=[];
  const JA='#FFF266';
  const vis=x=>st.mode==='tout'?true:st.mode==='ch'?(x.ch||['etu','enq','ao','fz'].includes(x.cl)):x.cl!=='fin';
  const C=Carte(z.querySelector('.sgcv-p3-m'),{fond:FONDS.nuit,sombre:true,pad:90,cadre:L=>L.filter(x=>x.ch).length?L.filter(x=>x.ch):L,
    dessus:api=>{ const px=api.px, S=api.S, B=SC.bureau; let s='';
      if(B){ const [bx,by]=px(B.E,B.N);
        [2,5,10,20,40].forEach(k=>{ const r=k*1000/S.res; if(r<26||r>Math.max(api.W(),api.H())*1.6) return;
          s+='<circle cx="'+bx.toFixed(1)+'" cy="'+by.toFixed(1)+'" r="'+r.toFixed(1)+'" class="sgcv-ring"/><text x="'+(bx+4).toFixed(1)+'" y="'+(by-r-4).toFixed(1)+'" class="sgcv-t3 dim">'+k+' km</text>'; });
        /* rayons vers les chantiers : les déplacements du bureau */
        its.filter(x=>x.ch&&vis(x)).forEach(x=>{ const [a,b]=px(x.E,x.N); s+='<line x1="'+bx.toFixed(1)+'" y1="'+by.toFixed(1)+'" x2="'+a.toFixed(1)+'" y2="'+b.toFixed(1)+'" class="sgcv-ray'+(x.id===MK.sel||x.id===st.hl?' on':'')+'"/>'; }); }
      const L=its.filter(vis).sort((a,b)=>(a.ch-b.ch)||(a.I.h30-b.I.h30));
      L.forEach(x=>{ const [a,b]=px(x.E,x.N); if(!dedans(api,a,b)) return; const on=x.id===MK.sel||x.id===st.hl;
        if(x.ch){ const r=Math.min(24,5+Math.sqrt(x.I.h30||0)*1.7);
          s+='<g data-id="'+E(x.id)+'" transform="translate('+a.toFixed(1)+' '+b.toFixed(1)+')"><circle r="'+(r+5).toFixed(1)+'" fill="'+JA+'" fill-opacity=".18"/><circle r="'+r.toFixed(1)+'" fill="'+JA+'" stroke="'+(on?'#FFFFFF':'#11303D')+'" stroke-width="'+(on?3:1.2)+'"/>'
            +(S.res<60||on?'<text x="'+(r+7).toFixed(1)+'" y="4" class="sgcv-t3">'+E(x.p.NUMBER)+'</text>':'')+'</g>'; }
        else { const c=x.cl==='fin'||x.cl==='att'?'rgba(255,255,255,.35)':'#FFFFFF';
          s+='<g data-id="'+E(x.id)+'" transform="translate('+a.toFixed(1)+' '+b.toFixed(1)+')"><circle r="'+(on?6:3.4)+'" fill="'+(on?'#11303D':c)+'" stroke="'+(on?'#FFFFFF':'none')+'" stroke-width="2"/>'+(on?'<text x="10" y="4" class="sgcv-t3">'+E(x.p.NUMBER)+'</text>':'')+'</g>'; } });
      s+=burSvg(api,{fond:'#FFFFFF',coeur:'#11303D',cls:'sgcv-t3'}); return s; },
    tip:t=>{ const x=t.dataset.id&&its.find(z=>String(z.id)===t.dataset.id); if(x) return tipP(x)+(x.km!=null?'<br>'+KM(x.km)+' '+x.dir+' du bureau':''); return tipDe(t,its); },
    choisir:id=>choisir(id), vide:()=>choisir(null) });
  function choisir(id){ MK.sel=id; C.redraw(); carte(); planning(); }
  function haut(){ const ch=its.filter(x=>x.ch), et=its.filter(x=>!x.ch&&['etu','enq','ao','fz'].includes(x.cl)&&enCours(x.p));
    const h30=ch.reduce((s,x)=>s+x.I.h30,0), loin=ch.filter(x=>x.km!=null).sort((a,b)=>b.km-a.km)[0];
    T.innerHTML='<div class="k"><span class="big">'+String(ch.length).padStart(2,'0')+'</span><span class="l">chantiers<br>en cours</span></div>'
      +'<div class="k2"><b>'+et.length+'</b> études, enquêtes et appels d’offres<br><b>'+HR(h30)+' h</b> sur les chantiers ces 30 jours'+(loin?'<br>le plus loin : <b>'+E(loin.p.NUMBER)+'</b>, '+KM(loin.km)+' '+loin.dir:'')+'</div>';
    F.innerHTML=seg('mode',st.mode,[['ch','Chantiers et études'],['enc','Tout en cours'],['tout','Tout le portefeuille']])+(MK.prog?'<div class="sgcv-prog">'+E(MK.prog)+'</div>':'');
    segs(F,(k,v)=>{ st.mode=v; sessionStorage.setItem('sgcv3_mode',v); if(v==='tout'){ MK.F[3]='tous'; } else MK.F[3]='encours'; rafraichir(true); }); }
  function carte(){ const x=MK.sel!=null&&its.find(z=>z.id===MK.sel); if(!x){ Cd.style.display='none'; Cd.innerHTML=''; return; } Cd.style.display='block';
    Cd.innerHTML='<button type="button" class="x" data-act="retour" title="Fermer">×</button>'+fiche(x,{cls:'p3'}); }
  /* frise : 9 mois en arrière, 15 mois en avant ; barre = premières heures → fin prévue du planning (ou dernière heure) */
  function planning(){ const L=its.filter(x=>x.ch).map(x=>{ const pl=x.I.L.filter(l=>l.sorte==='chantier'&&l.t!=='titre'), d0=pl.map(l=>l.d).filter(Boolean).sort()[0]||x.I.debut, d1=x.I.finPrev;
        const a=d0?dOf(d0):x.k0!=null?new Date(Math.floor(x.k0/12),x.k0%12,1):null, b=d1?dOf(d1):x.k1!=null?new Date(Math.floor(x.k1/12),x.k1%12+1,0):null; return {x,a,b,prev:!!d1}; })
      .sort((m,n)=>((m.b||AUJ)-(n.b||AUJ)));
    if(!L.length){ Pl.innerHTML='<div class="vide">Aucun chantier en cours.</div>'; return; }
    const t0=new Date(AUJ.getFullYear(),AUJ.getMonth()-9,1), t1=new Date(AUJ.getFullYear(),AUJ.getMonth()+15,1), sp=t1-t0, pc=d=>Math.max(0,Math.min(100,(d-t0)/sp*100));
    let mo=''; for(let i=0;i<=24;i+=3){ const d=new Date(t0.getFullYear(),t0.getMonth()+i,1); mo+='<span style="left:'+pc(d)+'%">'+MOIS[d.getMonth()]+(d.getMonth()<3?' '+String(d.getFullYear()).slice(2):'')+'</span>'; }
    Pl.innerHTML='<div class="hd"><b>Planning des chantiers</b><span>barre : premières heures → fin prévue (planning du chantier) · trait jaune : aujourd’hui</span></div><div class="ax">'+mo+'</div>'
      +'<div class="rows">'+L.map(r=>{ const x=r.x, a=r.a?pc(r.a):0, b=r.b?pc(r.b):a, pr=x.I.proch;
        return '<button type="button" class="row'+(x.id===MK.sel?' on':'')+'" data-id="'+E(x.id)+'"><span class="nm"><b>'+E(x.p.NUMBER)+'</b> '+E(x.p.TITLE||'')+'</span><span class="tl"><i class="bar'+(r.prev?'':' sansfin')+'" style="left:'+a+'%;width:'+Math.max(.8,b-a)+'%"></i>'
          +(pr?'<i class="ech" style="left:'+pc(dOf(pr.d))+'%" title="'+E(jma(pr.d)+' · '+pr.l.lib)+'"></i>':'')+'</span><span class="pc" title="'+(x.av!=null?'prestations réalisées':'heures des 30 derniers jours')+'">'+(x.av!=null?x.av+' %':x.I.h30?HR(x.I.h30)+' h':'—')+'</span></button>'; }).join('')+'</div><i class="auj" style="left:calc(282px + (100% - 374px) * '+(pc(AUJ)/100).toFixed(4)+')"></i>';
    Pl.querySelectorAll('.row').forEach(b=>{ const id=isNaN(+b.dataset.id)?b.dataset.id:+b.dataset.id; b.onclick=()=>{ choisir(id); const x=its.find(z=>z.id===id); if(x) C.centrer(x,Math.min(C.S.res,25)); };
      b.onmouseenter=()=>{ st.hl=id; C.redraw(); }; b.onmouseleave=()=>{ st.hl=null; C.redraw(); }; }); }
  actions(Cd,()=>choisir(null));
  return {maj(){ its=placés(projets()); C.set(its); C.message(''); haut(); carte(); planning(); },detruire(){ C.detruire(); }}; }

/* ═══ 4. FLUX — portefeuille : carte discrète à gauche, diagramme de flux Région → Type → Avancement à droite ; survol d'un flux = ses projets sur la carte ═══ */
function P4(z){
  z.innerHTML='<div class="sgcv-p4"><div class="sgcv-p4-hd"></div><div class="sgcv-p4-g"><div class="sgcv-p4-m"></div><div class="sgcv-p4-s"></div></div><div class="sgcv-p4-b"></div></div>';
  const st={mes:sessionStorage.getItem('sgcv4_mes')||'n',hl:null,fixe:null};
  const hd=z.querySelector('.sgcv-p4-hd'), SK=z.querySelector('.sgcv-p4-s'), bas=z.querySelector('.sgcv-p4-b'); let its=[], base=[], ens=null;
  const val=x=>st.mes==='h'?x.I.htot:st.mes==='f'?(x.R?x.R.contratHT:0):1;
  const reg=x=>x.li&&x.li.dis?x.li.dis:x.v?'Hors Suisse romande':'Sans position';
  const C=Carte(z.querySelector('.sgcv-p4-m'),{fond:FONDS.gris,pad:40,
    dessus:api=>{ const px=api.px; let s=''; const H=ens;
      const L=its.slice().sort((a,b)=>((H&&H.has(a.id))-(H&&H.has(b.id))));
      L.forEach(x=>{ const [a,b]=px(x.E,x.N); if(!dedans(api,a,b)) return; const on=x.id===MK.sel, dim=H&&!H.has(x.id);
        s+='<g data-id="'+E(x.id)+'" transform="translate('+a.toFixed(1)+' '+b.toFixed(1)+')" opacity="'+(dim?.16:1)+'"><circle r="'+(on?7:H&&!dim?5.5:4.5)+'" fill="'+(CAT[x.cat]||CAT.architecture)[1]+'" stroke="'+(on?'#1d1d1b':'#FFFFFF')+'" stroke-width="'+(on?2.5:1.2)+'"/></g>'; });
      s+=burSvg(api); return s; },
    tip:t=>tipDe(t,its), choisir:id=>{ MK.sel=id; st.fixe=null; ens=null; C.redraw(); flux(); detail(); }, vide:()=>{ MK.sel=null; st.fixe=null; ens=null; C.redraw(); flux(); detail(); } });
  /* colonnes du diagramme */
  function colonnes(){ const L=base.filter(x=>val(x)>0), cnt=new Map(); L.forEach(x=>{ const r=reg(x); cnt.set(r,(cnt.get(r)||0)+val(x)); });
    const top=[...cnt.entries()].sort((a,b)=>b[1]-a[1]).map(e=>e[0]), garde=new Set(top.slice(0,6)), rg=x=>garde.has(reg(x))?reg(x):'Autres régions';
    const c0=[...new Set(L.map(rg))].sort((a,b)=>(a==='Sans position')-(b==='Sans position')||(a==='Autres régions')-(b==='Autres régions')||(cnt.get(b)||0)-(cnt.get(a)||0));
    const c1=CAT_ORD.filter(k=>L.some(x=>x.cat===k)), c2=PH_ORD.filter(k=>L.some(x=>x.cl===k));
    const N=[c0.map(k=>({k,lib:k,c:k==='Sans position'?'#B9B9B4':'#1d1d1b'})),c1.map(k=>({k,lib:CAT[k][0],c:CAT[k][1]})),c2.map(k=>({k,lib:PH[k][0],c:PH[k][1]}))];
    const kOf=[rg,x=>x.cat,x=>x.cl]; return {L,N,kOf}; }
  function flux(){ const w=SK.clientWidth||600, H=Math.max(360,SK.clientHeight||520), {L,N,kOf}=colonnes(), T=L.reduce((s,x)=>s+val(x),0);
    if(!T){ SK.innerHTML='<div class="vide">'+(st.mes==='f'?'Aucun honoraire relié (ou montants masqués pour votre profil).':'Aucun projet.')+'</div>'; return; }
    const nw=12, gap=12, lw=150, xs=[0,Math.round((w-lw-nw)/2),w-lw-nw], k=Math.min(...N.map(c=>(H-26-gap*(c.length-1))/T));
    N.forEach((col,ci)=>{ let y=22; col.forEach(n=>{ n.v=L.filter(x=>kOf[ci](x)===n.k).reduce((s,x)=>s+val(x),0); n.ids=new Set(L.filter(x=>kOf[ci](x)===n.k).map(x=>x.id)); n.y=y; n.h=Math.max(1.5,n.v*k); n.x=xs[ci]; n.o=0; n.i=0; y+=n.h+gap; }); });
    const Lk=[]; [0,1].forEach(ci=>N[ci].forEach(a=>N[ci+1].forEach(b=>{ const ids=L.filter(x=>kOf[ci](x)===a.k&&kOf[ci+1](x)===b.k); const v=ids.reduce((s,x)=>s+val(x),0); if(v>0) Lk.push({ci,a,b,v,ids:new Set(ids.map(x=>x.id))}); })));
    Lk.sort((m,n)=>m.ci-n.ci||N[m.ci].indexOf(m.a)-N[n.ci].indexOf(n.a)||N[m.ci+1].indexOf(m.b)-N[n.ci+1].indexOf(n.b)).forEach(l=>{ l.y0=l.a.y+l.a.o; l.a.o+=l.v*k; });
    Lk.slice().sort((m,n)=>m.ci-n.ci||N[m.ci+1].indexOf(m.b)-N[n.ci+1].indexOf(n.b)||N[m.ci].indexOf(m.a)-N[n.ci].indexOf(n.a)).forEach(l=>{ l.y1=l.b.y+l.b.i; l.b.i+=l.v*k; });
    const sel=MK.sel!=null&&L.find(x=>x.id===MK.sel), act=ens;
    let s='<text x="0" y="12" class="sgcv-t4 cap">Région (district)</text><text x="'+xs[1]+'" y="12" class="sgcv-t4 cap">Type</text><text x="'+xs[2]+'" y="12" class="sgcv-t4 cap">Avancement</text>';
    Lk.forEach((l,i)=>{ const wl=Math.max(1,l.v*k), x0=l.a.x+nw, x1=l.b.x, m=(x0+x1)/2, y0=l.y0+wl/2, y1=l.y1+wl/2, on=act?[...l.ids].some(id=>act.has(id)):false, mine=sel&&l.ids.has(sel.id);
      s+='<path data-k="l:'+i+'" d="M'+x0+' '+y0.toFixed(1)+'C'+m+' '+y0.toFixed(1)+' '+m+' '+y1.toFixed(1)+' '+x1+' '+y1.toFixed(1)+'" stroke="'+(l.ci?l.b.c:l.b.c)+'" stroke-width="'+wl.toFixed(1)+'" fill="none" opacity="'+(mine?.95:act?(on?.8:.1):.42)+'"/>';
      if(mine){ const ws=Math.max(1.6,val(sel)*k); s+='<path d="M'+x0+' '+y0.toFixed(1)+'C'+m+' '+y0.toFixed(1)+' '+m+' '+y1.toFixed(1)+' '+x1+' '+y1.toFixed(1)+'" stroke="#1d1d1b" stroke-width="'+Math.min(wl,ws).toFixed(1)+'" fill="none"/>'; } });
    N.forEach((col,ci)=>col.forEach(n=>{ const on=act&&[...n.ids].some(id=>act.has(id));
      s+='<g data-k="n:'+ci+':'+E(n.k)+'"><rect x="'+n.x+'" y="'+n.y.toFixed(1)+'" width="'+nw+'" height="'+n.h.toFixed(1)+'" fill="'+n.c+'" opacity="'+(act&&!on?.25:1)+'"/>'
        +'<text x="'+(n.x+nw+6)+'" y="'+(n.y+Math.min(n.h/2,14)+4).toFixed(1)+'" class="sgcv-t4'+(ci<2?' bg':'')+'">'+E(n.lib)+' <tspan class="v">'+(st.mes==='n'?n.v:st.mes==='h'?HR(n.v)+' h':N0(n.v))+'</tspan></text></g>'; }));
    SK.innerHTML='<svg width="'+w+'" height="'+H+'" viewBox="0 0 '+w+' '+H+'">'+s+'</svg>';
    const svg=SK.querySelector('svg'), ids=t=>{ const k=t.dataset.k; if(k.startsWith('l:')) return Lk[+k.slice(2)].ids; const m=/^n:(\d):(.*)$/.exec(k), nn=m&&N[+m[1]]&&N[+m[1]].find(n=>String(n.k)===m[2]); return nn?nn.ids:null; };
    svg.addEventListener('mousemove',e=>{ if(st.fixe) return; const t=e.target.closest('[data-k]'); const s2=t?ids(t):null; if(s2!==ens){ ens=s2; C.redraw(); liste(); } });
    svg.addEventListener('mouseleave',()=>{ if(st.fixe) return; if(ens){ ens=null; C.redraw(); liste(); } });
    svg.addEventListener('click',e=>{ const t=e.target.closest('[data-k]'); if(!t){ st.fixe=null; ens=null; } else { const s2=ids(t); st.fixe=st.fixe===t.dataset.k?null:t.dataset.k; ens=st.fixe?s2:null; MK.sel=null; }
      C.redraw(); flux(); detail(); if(ens){ const Lz=its.filter(x=>ens.has(x.id)); if(Lz.length) C.vers(Lz,50); } }); }
  function entete(){ hd.innerHTML='<span class="t">Région → Type → Avancement</span><span class="sub">Survolez un flux pour voir ses projets sur la carte ; cliquez pour le garder.</span><span class="dr">'
      +seg('mes',st.mes,[['n','Nombre de projets'],['h','Heures saisies']].concat(base.some(x=>x.R)?[['f','Honoraires HT']]:[]))+'</span>';
    segs(hd,(k,v)=>{ st[k]=v; sessionStorage.setItem('sgcv4_'+k,v); st.fixe=null; ens=null; C.redraw(); flux(); liste(); }); }
  function liste(){ if(MK.sel!=null) return; const L=(ens?base.filter(x=>ens.has(x.id)):base).slice().sort((a,b)=>val(b)-val(a)||b.I.htot-a.I.htot);
    bas.innerHTML='<div class="sgcv-p4-lh"><b>'+(ens?L.length+' projet'+(L.length>1?'s':'')+' dans la sélection':'Tous les projets ('+L.length+')')+'</b>'+(MK.prog?'<span class="sgcv-prog">'+E(MK.prog)+'</span>':'')+'</div>'
      +'<table class="sgcv-tb"><thead><tr><th>N°</th><th>Projet</th><th>Région</th><th>Type</th><th>Avancement</th><th class="r">Heures</th><th class="r">30 jours</th></tr></thead><tbody>'
      +L.slice(0,40).map(x=>'<tr data-id="'+E(x.id)+'"><td><b>'+E(x.p.NUMBER)+'</b></td><td>'+E(x.p.TITLE||'')+'</td><td>'+E(x.li&&x.li.com||'—')+'</td><td><i class="pt" style="--c:'+(CAT[x.cat]||CAT.architecture)[1]+'"></i>'+E((CAT[x.cat]||CAT.architecture)[0])+'</td><td><i class="pt" style="--c:'+PH[x.cl][1]+'"></i>'+E(PH[x.cl][0])+'</td><td class="r">'+HR(x.I.htot)+'</td><td class="r">'+HR(x.I.h30)+'</td></tr>').join('')+'</tbody></table>'
      +(L.length>40?'<div class="sgcv-note">… et '+(L.length-40)+' autres.</div>':'');
    bas.querySelectorAll('tr[data-id]').forEach(r=>r.onclick=()=>{ MK.sel=isNaN(+r.dataset.id)?r.dataset.id:+r.dataset.id; const x=its.find(z=>z.id===MK.sel); if(x) C.centrer(x,Math.min(C.S.res,15)); C.redraw(); flux(); detail(); }); }
  function detail(){ const x=MK.sel!=null&&base.find(z=>z.id===MK.sel); if(!x){ liste(); return; } bas.innerHTML=fiche(x,{retour:'Liste',cls:'p4'}); }
  actions(bas,()=>{ MK.sel=null; C.redraw(); flux(); liste(); });
  let rz=null; const ro=new ResizeObserver(()=>{ if(!document.body.contains(SK)){ ro.disconnect(); return; } clearTimeout(rz); rz=setTimeout(flux,120); }); ro.observe(SK);
  return {maj(){ base=projets().map(X); its=base.filter(x=>x.v); C.set(its); C.message(''); entete(); flux(); detail(); },detruire(){ C.detruire(); ro.disconnect(); }}; }

/* ═══ 5. BILLETS — plan au trait rouge cadré (repères de coupe, graduations), un billet par projet (chiffres en grand, chasse fixe),
       parcours des phases du projet choisi en cercles ═══ */
function P5(z){
  z.innerHTML='<div class="sgcv-p5"><div class="sgcv-p5-f"><div class="sgcv-p5-m"></div><i class="cm a"></i><i class="cm b"></i><i class="cm c"></i><i class="cm d"></i></div><div class="sgcv-p5-bar"></div><div class="sgcv-p5-x"></div><div class="sgcv-p5-pc"></div></div>';
  const st={tri:sessionStorage.getItem('sgcv5_tri')||'act',hl:null};
  const bar=z.querySelector('.sgcv-p5-bar'), tix=z.querySelector('.sgcv-p5-x'), pc=z.querySelector('.sgcv-p5-pc'); let its=[], L=[];
  const RG='#C8321E';
  const C=Carte(z.querySelector('.sgcv-p5-m'),{fond:FONDS.rouge,pad:60,
    dessus:api=>{ const px=api.px, S=api.S, w=api.W(), hh=api.H(); let s='';
      /* cadre gradué en kilomètres (LV95) */
      const m=[1,2,5,10,20,50].find(v=>v*1000/S.res>=70)||50, e0=Math.ceil((S.E-w/2*S.res)/(m*1000))*m*1000, n0=Math.ceil((S.N-hh/2*S.res)/(m*1000))*m*1000;
      for(let e=e0;e<S.E+w/2*S.res;e+=m*1000){ const [x]=px(e,0); s+='<line x1="'+x.toFixed(1)+'" y1="'+(hh-8)+'" x2="'+x.toFixed(1)+'" y2="'+hh+'" class="sgcv-tk5"/><text x="'+(x+3).toFixed(1)+'" y="'+(hh-11)+'" class="sgcv-t5 ax">'+N0(e/1000)+'</text>'; }
      for(let n=n0;n<S.N+hh/2*S.res;n+=m*1000){ const [,y]=px(0,n); s+='<line x1="0" y1="'+y.toFixed(1)+'" x2="8" y2="'+y.toFixed(1)+'" class="sgcv-tk5"/><text x="11" y="'+(y+3).toFixed(1)+'" class="sgcv-t5 ax">'+N0(n/1000)+'</text>'; }
      const lab=S.res<35||its.length<=14;
      its.forEach(x=>{ const [a,b]=px(x.E,x.N); if(!dedans(api,a,b)) return; const on=x.id===MK.sel||x.id===st.hl, r=on?7:4.5;
        s+='<g data-id="'+E(x.id)+'" transform="translate('+a.toFixed(1)+' '+b.toFixed(1)+')"><rect x="'+(-r)+'" y="'+(-r)+'" width="'+2*r+'" height="'+2*r+'" fill="'+(on?RG:'#1d1d1b')+'" stroke="#FFFFFF" stroke-width="1.2"/>'
          +(lab||on?'<text x="'+(r+4)+'" y="4" class="sgcv-t5 halo'+(on?' on':'')+'">'+E(x.p.NUMBER)+'</text>':'')+'</g>'; });
      s+=burSvg(api,{cls:'sgcv-t5 halo'}); return s; },
    tip:t=>tipDe(t,its), choisir:id=>choisir(id,true), vide:()=>choisir(null) });
  const TRI={act:['Activité',(a,b)=>b.I.h30-a.I.h30||b.I.htot-a.I.htot],ech:['Échéance',(a,b)=>(a.I.proch?a.I.proch.d:'9')<(b.I.proch?b.I.proch.d:'9')?-1:1],dst:['Distance',(a,b)=>(a.km==null?1e9:a.km)-(b.km==null?1e9:b.km)],num:['Numéro',(a,b)=>String(a.p.NUMBER).localeCompare(String(b.p.NUMBER))]};
  function choisir(id,defiler){ MK.sel=id; C.redraw(); tix.querySelectorAll('.sgcv-tk').forEach(t=>t.classList.toggle('on',t.dataset.id===String(id)));
    if(defiler&&id!=null){ const t=tix.querySelector('.sgcv-tk[data-id="'+CSS.escape(String(id))+'"]'); if(t) t.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'}); }
    parcours(); }
  function billet(x){ const I=x.I, pct=I.hprev?Math.round(I.htot/I.hprev*100):null, M0=AUJ.getFullYear()*12+AUJ.getMonth(), V=[]; for(let i=11;i>=0;i--) V.push(I.byM[M0-i]||0); const vm=Math.max(1,...V);
    return '<button type="button" class="sgcv-tk'+(x.id===MK.sel?' on':'')+(x.ch?' ch':'')+'" data-id="'+E(x.id)+'"><span class="sd"><span>'+(x.ch?'CHANTIER':(CAT[x.cat]||CAT.architecture)[0].toUpperCase())+' / '+E(x.p.NUMBER)+'</span></span>'
      +'<span class="bd"><span class="r1"><span class="no">'+E(x.p.NUMBER)+'</span><span class="ph" style="--c:'+PH[x.cl][1]+'">'+E(PH[x.cl][0])+'</span></span><span class="tt">'+E(x.p.TITLE||'')+'</span>'
      +'<span class="mo">'+E(I.mo.join(', ')||(x.li&&x.li.com)||'')+'</span>'
      +'<span class="cs"><span><small>PHASE</small><b>'+E(x.code||'—')+'</b></span><span><small>30 JOURS</small><b>'+HR(I.h30)+'<sup>H</sup></b></span><span><small>HEURES</small><b>'+(pct!=null?pct+'<sup>%</sup>':HR(I.htot)+'<sup>H</sup>')+'</b></span></span>'
      +'<span class="cs"><span class="w"><small>ÉCHÉANCE</small><b class="'+(I.proch&&I.proch.l.rouge?'r':'')+'">'+(I.proch?jmc(I.proch.d):'—')+'</b></span><span class="w"><small>DU BUREAU</small><b>'+(x.km!=null?(x.km<10?(Math.round(x.km*10)/10).toFixed(1):Math.round(x.km))+'<sup>KM '+x.dir+'</sup>':'—')+'</b></span></span>'
      +'<span class="ft"><span class="bc">'+V.map(v=>'<i style="height:'+(v?Math.max(12,v/vm*100):4)+'%"></i>').join('')+'</span><span class="eq">'+E(I.equipe.slice(0,4).map(e=>ini(e.s)).join(' '))+'</span></span></span></button>'; }
  function billets(){ L=its.concat(projets().map(X).filter(x=>!x.v)).sort(TRI[st.tri][1]);
    bar.innerHTML='<span class="t">'+L.length+' projet'+(L.length>1?'s':'')+'</span><span class="dr"><span class="l">Trier par</span>'+seg('tri',st.tri,Object.entries(TRI).map(([k,v])=>[k,v[0]]))+'</span>'+(MK.prog?'<span class="sgcv-prog">'+E(MK.prog)+'</span>':'');
    segs(bar,(k,v)=>{ st.tri=v; sessionStorage.setItem('sgcv5_tri',v); billets(); });
    tix.innerHTML=L.map(billet).join('');
    tix.querySelectorAll('.sgcv-tk').forEach(t=>{ const id=isNaN(+t.dataset.id)?t.dataset.id:+t.dataset.id;
      t.onclick=()=>{ choisir(id); const x=its.find(z=>z.id===id); if(x) C.centrer(x,Math.min(C.S.res,12)); };
      t.onmouseenter=()=>{ st.hl=id; C.redraw(); }; t.onmouseleave=()=>{ st.hl=null; C.redraw(); }; }); }
  /* parcours des phases : un cercle par phase (taille = heures prévues ou saisies), plein = commencée, contour = à venir ; phase actuelle en noir */
  function parcours(){ const x=MK.sel!=null&&L.find(z=>z.id===MK.sel); if(!x){ pc.innerHTML='<div class="vide">Choisissez un projet sur la carte ou un billet pour voir le parcours de ses phases.</div>'; return; }
    const P=x.I.phases.filter(f=>f.bud||f.h); if(!P.length){ pc.innerHTML='<div class="sgcv-p5-ph"><b>'+E(x.p.NUMBER)+'</b> '+E(x.p.TITLE||'')+'</div><div class="vide">Aucune phase avec des heures prévues ou saisies.</div>'; pc.insertAdjacentHTML('beforeend',fiche(x,{cls:'p5'})); return; }
    const w=Math.max(560,pc.clientWidth-360), M=Math.max(...P.map(f=>Math.max(f.bud,f.h))), act=x.I.pa&&x.I.pa.ph?x.I.pa.ph.ID:null, step=w/P.length;
    let s='<path d="M0 70 H'+w+'" stroke="#8A9A9A" stroke-width="2" fill="none"/>';
    P.forEach((f,i)=>{ const r=14+Math.sqrt(Math.max(f.bud,f.h)/M)*30, cx=step*i+step/2, on=f.f.ID===act, done=f.h>0;
      s+='<circle cx="'+cx.toFixed(1)+'" cy="70" r="'+r.toFixed(1)+'" fill="'+(done?RG:'#FFFFFF')+'" fill-opacity="'+(done?(on?1:.78):1)+'" stroke="'+(on?'#1d1d1b':done?RG:'#8A9A9A')+'" stroke-width="'+(on?3:1.5)+'"/>'
        +'<text x="'+cx.toFixed(1)+'" y="'+(70+r+18).toFixed(1)+'" text-anchor="middle" class="sgcv-t5 b">'+E(String(f.n||'').padStart(2,'0'))+'</text>'
        +'<text x="'+cx.toFixed(1)+'" y="'+(70+r+32).toFixed(1)+'" text-anchor="middle" class="sgcv-t5">'+E(String(f.lib||'').slice(0,22))+'</text>'
        +'<text x="'+cx.toFixed(1)+'" y="'+(70+r+45).toFixed(1)+'" text-anchor="middle" class="sgcv-t5 g">'+HR(f.h)+(f.bud?' / '+HR(f.bud):'')+' h</text>'
        +(on?'<text x="'+cx.toFixed(1)+'" y="'+(70-r-8).toFixed(1)+'" text-anchor="middle" class="sgcv-t5 b">EN COURS</text>':''); });
    pc.innerHTML='<div class="sgcv-p5-pg"><div><div class="sgcv-p5-ph"><b>'+E(x.p.NUMBER)+'</b> '+E(x.p.TITLE||'')+' <small>parcours des phases — cercle plein : heures saisies, taille : heures prévues</small></div><svg width="'+w+'" height="190" viewBox="0 -10 '+w+' 190">'+s+'</svg></div>'+fiche(x,{cls:'p5'})+'</div>'; }
  actions(pc);
  return {maj(){ its=placés(projets()); C.set(its); C.message(''); billets(); parcours(); },detruire(){ C.detruire(); }}; }

/* ── 5. écrans : un par variante (Proposition ▸ Carte · variantes), onglets pour passer de l'une à l'autre ── */
const PROPS=[
  {n:1,t:'Atlas des régions',f:P1,d:'Affiche de ville : plan au trait noir, eau ardoise, communes hachurées selon le nombre de projets (ou les heures), index numéroté par commune ou district à droite, titre de la région au bas de la carte. Données : région, densité par commune, heures, honoraires.'},
  {n:2,t:'Relevé · densité',f:P2,d:'Relevé bleu sur papier crème : carroyage kilométrique (taille selon le zoom) foncé selon le nombre de projets ou les heures, graduations LV95, carte sur toute la largeur et quatre relevés dessous qui filtrent la carte (année de début, type, distance du bureau, communes). Données : densité, historique, type, éloignement.'},
  {n:3,t:'Nuit · chantiers en cours',f:P3,d:'Carte en négatif : chantiers en jaune (taille = heures des 30 derniers jours), rayons depuis le bureau, cercles de 2 à 40 km, planning des chantiers en bas, fiche flottante. Données : chantiers en cours, distance, échéances, avancement des prestations.'},
  {n:4,t:'Flux · portefeuille',f:P4,d:'Carte discrète à gauche, diagramme de flux à droite : district → type → avancement, en nombre de projets, heures ou honoraires ; survoler un flux montre ses projets sur la carte, un clic le garde. Données : portefeuille par région, type et phase.'},
  {n:5,t:'Billets · fiches',f:P5,d:'Plan au trait rouge dans un cadre gradué, un billet par projet en dessous (phase, heures des 30 jours, % des heures prévues, échéance, distance et direction du bureau, 12 mois d’heures, équipe), parcours des phases du projet choisi en cercles. Données : fiche de chaque projet en un coup d’œil.'}];
function rendre(m,n){ XC.clear(); MK.prop=n; const P=PROPS.find(x=>x.n===n), f=MK.F[n]||'encours';
  const pg=nxPage(m,'<div class="sg-split">'+sgTete('Proposition','Carte des projets · '+P.n+' '+P.t,P.d)
    +'<div class="sgcv-nav">'+PROPS.map(x=>'<button type="button" data-p="'+x.n+'" class="'+(x.n===n?'on':'')+'">'+x.n+' '+E(x.t)+'</button>').join('')
    +'<span class="dr"><span class="l">Projets</span>'+seg('flt',f,[['encours','En cours'],['tous','Tous']])+'</span></div><div class="sgcv-zone"></div></div>');
  pg.querySelectorAll('.sgcv-nav [data-p]').forEach(b=>b.onclick=()=>{ if(+b.dataset.p===n) return; MK.sel=null; go('nx-carte-v'+b.dataset.p); });
  segs(pg.querySelector('.sgcv-nav'),(k,v)=>{ MK.F[n]=v; try{ sessionStorage.setItem('sgcv_f'+n,v); if(n===3) sessionStorage.setItem('sgcv3_mode',v==='tous'?'tout':'ch'); }catch(_){} refaire(); });
  MK.cur=P.f(pg.querySelector('.sgcv-zone')); preparer(); MK.cur.maj(); }
function refaire(){ const m=document.getElementById('main'); if(!m||!MK.prop) return; if(MK.cur&&MK.cur.detruire) MK.cur.detruire(); MK.cur=null; m.innerHTML=''; rendre(m,MK.prop); }
const TABLES=['*','timelog','project','projectphase','projectsubphase','projectmember','sgplanning','sgavancement','sgpermis','sgfaisa','contact','staff'];
function ecran(n){ VIEWS['nx-carte-v'+n]={ render(m){ rendre(m,n); },
  refresh(ts){ ts=ts||['*']; if(TABLES.some(t=>ts.includes(t))) rafraichir(); },
  leave(){ if(MK.cur&&MK.cur.detruire) MK.cur.detruire(); MK.cur=null; } }; }
PROPS.forEach(p=>ecran(p.n));
Object.assign(MK,{PROPS,ajouter(v){ const i=PROPS.findIndex(x=>x.n===v.n); if(i>=0) PROPS[i]=v; else PROPS.push(v); PROPS.sort((a,b)=>a.n-b.n); ecran(v.n); },
  outils:{E,N0,HR,KM,iso,jma,jmc,dOf,MOIS,AUJ,DIR,ini,h,wgs,PH,PH_ORD,CAT,CAT_ORD,SC,enCours,tous,projets,X,XC,placés,lieu,LK,preparer,rafraichir,
    Carte,FONDS,fond,couche,toile,teinte,hachures,pathGeo,dedans,burSvg,tipP,tipBur,tipDe,fiche,actions,seg,segs,IC}});

/* ── 6. styles (charte : Akkurat, noir, bleu nuit, jaune ; filets, angles droits) ── */
const STY=`
.sgcv-zone{container-type:inline-size}
.sgcv-nav{display:flex;align-items:flex-end;gap:24px;border-bottom:1px solid #d8d8d4;margin:2px 0 18px;flex-wrap:wrap}
.sgcv-nav>button{border:0;background:none;font:inherit;font-size:14px;padding:9px 0 10px;color:var(--s-gris,#706F6F);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}
.sgcv-nav>button:hover{color:var(--s-noir,#1d1d1b)}
.sgcv-nav>button.on{color:var(--s-noir,#1d1d1b);font-weight:700;border-bottom-color:var(--s-nuit,#003346)}
.sgcv-nav .dr,.sgcv-p2-hd .dr,.sgcv-p4-hd .dr,.sgcv-p5-bar .dr{margin-left:auto;display:flex;gap:10px;align-items:baseline;padding-bottom:10px}
.sgcv-nav .l,.sgcv-p5-bar .l{font-size:12px;color:var(--s-gris,#706F6F)}
.sgcv-seg{display:inline-flex;gap:12px;align-items:baseline}
.sgcv-seg button{border:0;background:none;padding:2px 0;font:inherit;font-size:12.5px;color:var(--s-gris,#706F6F);cursor:pointer;border-bottom:2px solid transparent}
.sgcv-seg button:hover{color:var(--s-noir,#1d1d1b)}
.sgcv-seg button.on{color:var(--s-noir,#1d1d1b);font-weight:700;border-bottom-color:var(--s-nuit,#003346)}
.sgcv-map{position:relative;overflow:hidden;touch-action:none;cursor:grab;outline:none;user-select:none;background:#f4f4f1}
.sgcv-map.drag{cursor:grabbing}
.sgcv-map:focus-visible{box-shadow:inset 0 0 0 2px var(--s-nuit,#003346)}
.sgcv-lay{position:absolute;inset:0}
.sgcv-tw{position:absolute;inset:0;transition:transform .45s ease}
.sgcv-svg2{position:absolute;left:0;top:0;overflow:visible;pointer-events:none;z-index:2}
.sgcv-svg2 [data-id]{pointer-events:auto;cursor:pointer}
.sgcv-img{position:absolute;left:0;top:0;transform-origin:0 0}
.sgcv-svg{position:absolute;left:0;top:0;overflow:visible}
.sgcv-svg [data-id],.sgcv-svg [data-k]{cursor:pointer}
.sgcv-svg text{font-family:inherit;font-size:11px;fill:#1d1d1b}
.sgcv-svg text.halo,.sgcv-svg .sgcv-bur text{paint-order:stroke;stroke:#fff;stroke-width:3.5px;stroke-linejoin:round;font-weight:700}
.sgcv-tip{position:absolute;display:none;z-index:6;background:#fff;border:1px solid #1d1d1b;padding:6px 9px;font-size:12px;max-width:300px;pointer-events:none;line-height:1.4;color:#1d1d1b}
.sgcv-tip b{display:block;font-weight:700}
.sgcv-ctl{position:absolute;right:12px;top:12px;display:flex;flex-direction:column;gap:6px;z-index:5}
.sgcv-ctl button{width:30px;height:30px;border:1px solid #1d1d1b;background:#fff;display:grid;place-items:center;cursor:pointer;padding:0;color:#1d1d1b}
.sgcv-ctl svg{width:14px;height:14px}
.sgcv-att{position:absolute;right:8px;bottom:6px;font-size:10px;color:#706F6F;background:rgba(255,255,255,.78);padding:1px 5px;z-index:4;pointer-events:none}
.sgcv-msg{position:absolute;left:12px;bottom:10px;font-size:12px;background:#fff;border:1px solid #1d1d1b;padding:4px 8px;z-index:5}
.sgcv-map.sombre .sgcv-ctl button{background:#11303D;color:#fff;border-color:rgba(255,255,255,.55)}
.sgcv-map.sombre .sgcv-att{background:rgba(17,48,61,.7);color:rgba(255,255,255,.7)}
.sgcv-prog{font-size:12px;color:var(--s-gris,#706F6F);padding:8px 0}
.sgcv-note{font-size:12px;color:var(--s-gris,#706F6F);padding:10px 0}
.sgcv-ret{border:0;background:none;font:inherit;font-size:12.5px;color:var(--s-nuit,#003346);cursor:pointer;padding:0 0 10px}
.sgcv-ret:hover{text-decoration:underline}
.vide{font-size:12.5px;color:var(--s-gris,#706F6F);padding:16px 0}
/* fiche commune */
.sgcv-fi .hd{display:grid;grid-template-columns:auto 1fr;column-gap:12px;align-items:baseline;border-top:2px solid #1d1d1b;padding-top:10px;margin-bottom:10px}
.sgcv-fi .hd .n{font-size:24px;font-weight:700;color:var(--s-nuit,#003346);grid-row:span 2}
.sgcv-fi .hd .t{font-size:15px;font-weight:700;line-height:1.25}
.sgcv-fi .hd .mo{font-size:12.5px;color:var(--s-gris,#706F6F)}
.sgcv-fi dl{display:grid;grid-template-columns:130px 1fr;margin:0;font-size:12.5px}
.sgcv-fi dt,.sgcv-fi dd{margin:0;padding:6px 0;border-bottom:1px solid #e4e4e0}
.sgcv-fi dt{color:var(--s-gris,#706F6F)}
.sgcv-fi .act{display:flex;gap:16px;padding-top:12px}
.sgcv-fi .act button{border:0;background:none;font:inherit;font-size:12.5px;font-weight:700;color:var(--s-nuit,#003346);cursor:pointer;padding:0;border-bottom:1px solid currentColor}
/* 1 Atlas */
.sgcv-p1{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:24px}
.sgcv-p1-g{position:relative;border:2px solid #1d1d1b}
.sgcv-p1-m{height:640px}
.sgcv-poster{position:absolute;left:22px;bottom:22px;background:#fff;border:2px solid #1d1d1b;padding:12px 18px 10px;pointer-events:none;z-index:3;max-width:70%}
.sgcv-poster .t{font-size:30px;font-weight:700;letter-spacing:.08em;line-height:1.05}
.sgcv-poster .s{font-size:12px;letter-spacing:.06em;margin-top:6px;color:#1d1d1b}
.sgcv-svg .sgcv-t1{font-size:10.5px}
.sgcv-p1-i{max-height:644px;overflow:auto;padding-right:4px}
.sgcv-p1-ih{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 16px;border-top:2px solid #1d1d1b;padding:10px 0 12px}
.sgcv-p1-ih h4{margin:0 auto 0 0;font-size:15px}
.sgcv-p1-gr{margin-bottom:10px}
.sgcv-p1-gr .gh{display:grid;grid-template-columns:1fr auto;width:100%;border:0;background:none;font:inherit;text-align:left;padding:7px 0 5px;cursor:pointer;position:relative;border-bottom:1px solid #1d1d1b}
.sgcv-p1-gr .gh .nm{font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:.05em}
.sgcv-p1-gr .gh .v{font-size:12.5px}
.sgcv-p1-gr .gh i{position:absolute;left:0;bottom:-1px;height:3px;background:#1d1d1b}
.sgcv-p1-gr.on .gh{color:var(--s-nuit,#003346)}
.sgcv-p1-gr .it{display:grid;grid-template-columns:24px 62px 1fr 10px;gap:6px;align-items:baseline;width:100%;border:0;background:none;font:inherit;text-align:left;font-size:12.5px;padding:4px 0;cursor:pointer;border-bottom:1px solid #efefeb}
.sgcv-p1-gr .it:hover{background:#FEF6B0}
.sgcv-p1-gr .it .no{color:var(--s-gris,#706F6F);font-variant-numeric:tabular-nums}
.sgcv-p1-gr .it .pn{font-weight:700}
.sgcv-p1-gr .it .pt{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgcv-p1-gr .it .ph{width:8px;height:8px;background:var(--c);align-self:center}
/* 2 Relevé */
.sgcv-p2{display:block;--bl:#2338A0}
.sgcv-p2-l{border:1.5px solid var(--bl);background:#F3F0E7}
.sgcv-p2-hd{display:flex;flex-wrap:wrap;gap:6px 22px;align-items:baseline;padding:10px 14px 0;color:var(--bl);font-family:'Akkurat Mono','AkkuratMono',ui-monospace,Menlo,monospace;font-size:12px;letter-spacing:.06em;border-bottom:1px solid var(--bl)}
.sgcv-p2-hd .sgcv-seg button{color:#6A77C2;font-family:inherit}
.sgcv-p2-hd .sgcv-seg button.on{color:var(--bl);border-bottom-color:var(--bl)}
.sgcv-p2-mw{position:relative}
.sgcv-p2-m{height:660px;background:#F3F0E7}
.sgcv-p2-fl{position:absolute;top:12px;right:54px;width:340px;max-height:calc(100% - 24px);overflow:auto;z-index:7;background:#fff;border:1.5px solid var(--bl);padding:30px 16px 14px;color:#1d1d1b}
.sgcv-p2-fl[hidden]{display:none}
.sgcv-p2-x{position:absolute;top:4px;right:6px;width:26px;height:26px;border:0;background:none;font:inherit;font-size:20px;line-height:1;color:var(--bl);cursor:pointer;padding:0}
.sgcv-p2-x:hover{color:#1d1d1b}
.sgcv-svg .sgcv-g2{stroke:#2338A0;stroke-opacity:.12;stroke-width:1}
.sgcv-svg .sgcv-t2{fill:#2338A0;font-family:'Akkurat Mono','AkkuratMono',ui-monospace,Menlo,monospace;font-size:10px}
.sgcv-svg .sgcv-t2.cl{fill:#F3F0E7}
.sgcv-svg .sgcv-t2.halo{stroke:#F3F0E7;fill:#0E1B5C}
.sgcv-svg .sgcv-tk{stroke:#2338A0;stroke-width:1.2}
.sgcv-svg .sgcv-ax{fill:#2338A0;font-family:'Akkurat Mono','AkkuratMono',ui-monospace,Menlo,monospace;font-size:9.5px}
.sgcv-svg .sgcv-reg rect{fill:#2338A0}
.sgcv-p2-r{color:var(--bl);display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0 32px;margin-top:22px}
.sgcv-p2-pied{grid-column:1/-1}
.sgcv-p2-fl .sgcv-fi,.sgcv-p2-fl .sgcv-li{color:#1d1d1b}
.sgcv-p2-fl .sgcv-fi .hd{border-top:0;padding-top:0}
.sgcv-p2-b{border-top:1.5px solid var(--bl);padding:8px 0 14px}
.sgcv-p2-b h5{margin:0 0 8px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;font-family:'Akkurat Mono','AkkuratMono',ui-monospace,Menlo,monospace;font-weight:400}
.sgcv-p2-b h5 small{text-transform:none;letter-spacing:0;color:#6A77C2;margin-left:6px}
.sgcv-bars button{display:grid;grid-template-columns:78px 1fr 44px;gap:8px;align-items:center;width:100%;border:0;background:none;font:inherit;font-size:12px;color:var(--bl);padding:2px 0;cursor:pointer;text-align:left}
.sgcv-bars button .l{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgcv-bars button .b{height:10px;background:repeating-linear-gradient(90deg,rgba(35,56,160,.12) 0 1px,transparent 1px 10px)}
.sgcv-bars button .b i{display:block;height:100%;background:var(--bl)}
.sgcv-bars button .n{text-align:right;font-variant-numeric:tabular-nums}
.sgcv-bars button.on .b i{background:#0E1B5C}.sgcv-bars button.on{font-weight:700}
.sgcv-bars button.off{opacity:.4}
.sgcv-bars.v{display:flex;align-items:flex-end;gap:5px;height:118px}
.sgcv-bars.v button{display:flex;flex-direction:column-reverse;align-items:stretch;height:100%;padding:0;flex:1;gap:3px}
.sgcv-bars.v button .b{flex:1;display:flex;align-items:flex-end;background:repeating-linear-gradient(0deg,rgba(35,56,160,.12) 0 1px,transparent 1px 10px)}
.sgcv-bars.v button .b i{width:100%}
.sgcv-bars.v button .l,.sgcv-bars.v button .n{text-align:center;font-size:10.5px}
.sgcv-p2-sh{margin:12px 0 6px;font-size:11px;font-weight:400;letter-spacing:.06em;text-transform:uppercase;color:#6A77C2;font-family:'Akkurat Mono','AkkuratMono',ui-monospace,Menlo,monospace}
.sgcv-bars.lg button{grid-template-columns:minmax(78px,40%) 1fr 36px}
.sgcv-p2-h{margin:0 0 10px;font-size:14px}
.sgcv-p2-h small{font-weight:400;color:#6A77C2}
.sgcv-li{display:block;width:100%;text-align:left;border:0;border-top:1px solid #d9dcea;background:none;font:inherit;font-size:12.5px;padding:7px 0;cursor:pointer}
.sgcv-li small{display:block;color:var(--s-gris,#706F6F)}
.sgcv-li:hover{background:#eef0fa}
/* 3 Nuit */
.sgcv-p3{background:#11303D;color:#fff}
.sgcv-p3-w{position:relative;height:580px}
.sgcv-p3-m{position:absolute;inset:0;background:#11303D}
.sgcv-svg .sgcv-ring{fill:none;stroke:#fff;stroke-opacity:.5;stroke-width:1.2;stroke-dasharray:3 5}
.sgcv-svg .sgcv-ray{stroke:#FFF266;stroke-opacity:.4;stroke-width:1}
.sgcv-svg .sgcv-ray.on{stroke-opacity:.95;stroke-width:1.6}
.sgcv-svg .sgcv-t3{fill:#fff;font-size:11px;font-weight:700;paint-order:stroke;stroke:#11303D;stroke-width:3px}
.sgcv-svg .sgcv-t3.dim{font-weight:400;fill-opacity:.6;font-size:10px}
.sgcv-svg .sgcv-bur .sgcv-t3{stroke:#11303D}
.sgcv-p3-t{position:absolute;left:16px;top:16px;z-index:4;pointer-events:none;display:flex;gap:18px;align-items:flex-end;background:rgba(17,48,61,.82);padding:12px 16px 12px 14px}
.sgcv-p3-t .k{display:flex;align-items:flex-end;gap:10px}
.sgcv-p3-t .big{font-size:84px;line-height:.82;font-weight:700;color:#FFF266;letter-spacing:-.02em}
.sgcv-p3-t .l{font-size:13px;text-transform:uppercase;letter-spacing:.1em;line-height:1.25}
.sgcv-p3-t .k2{font-size:12.5px;line-height:1.5;color:rgba(255,255,255,.8);border-left:2px solid #FFF266;padding-left:12px}
.sgcv-p3-t .k2 b{color:#fff}
.sgcv-p3-f{position:absolute;right:56px;top:18px;z-index:4;background:rgba(17,48,61,.85);padding:6px 12px}
.sgcv-p3-f .sgcv-seg button{color:rgba(255,255,255,.6)}
.sgcv-p3-f .sgcv-seg button.on{color:#fff;border-bottom-color:#FFF266}
.sgcv-p3-f .sgcv-prog{color:rgba(255,255,255,.7);padding:4px 0 0}
.sgcv-p3-c{display:none;position:absolute;right:56px;top:64px;width:330px;max-height:490px;overflow:auto;z-index:5;background:#fff;color:#1d1d1b;padding:6px 16px 14px;border-top:4px solid #FFF266}
.sgcv-p3-c .x{position:absolute;right:8px;top:6px;border:0;background:none;font-size:20px;cursor:pointer;color:#1d1d1b}
.sgcv-p3-p{position:relative;background:#0B2531;padding:12px 22px 14px;border-top:1px solid rgba(255,255,255,.16)}
.sgcv-p3-p .hd{display:flex;gap:14px;align-items:baseline;font-size:12.5px}
.sgcv-p3-p .hd span{color:rgba(255,255,255,.55);font-size:11.5px}
.sgcv-p3-p .ax{position:relative;height:18px;margin:4px 70px 2px 260px;font-size:10.5px;color:rgba(255,255,255,.55)}
.sgcv-p3-p .ax span{position:absolute;top:2px;white-space:nowrap}
.sgcv-p3-p .row{display:grid;grid-template-columns:260px 1fr 70px;align-items:center;width:100%;border:0;background:none;font:inherit;color:#fff;padding:3px 0;cursor:pointer;text-align:left;font-size:12px}
.sgcv-p3-p .row:hover,.sgcv-p3-p .row.on{background:rgba(255,242,102,.12)}
.sgcv-p3-p .row .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:12px}
.sgcv-p3-p .row .tl{position:relative;height:12px;background:linear-gradient(rgba(255,255,255,.14),rgba(255,255,255,.14)) 0 50%/100% 1px no-repeat}
.sgcv-p3-p .row .bar{position:absolute;top:2px;height:8px;background:#FFF266}
.sgcv-p3-p .row .bar.sansfin{background:repeating-linear-gradient(90deg,#FFF266 0 6px,transparent 6px 9px)}
.sgcv-p3-p .row .ech{position:absolute;top:-1px;width:3px;height:14px;background:#fff;margin-left:-1px}
.sgcv-p3-p .row .pc{text-align:right;font-variant-numeric:tabular-nums;color:rgba(255,255,255,.85)}
.sgcv-p3-p .auj{position:absolute;top:40px;bottom:8px;width:1px;background:#FFF266;pointer-events:none}
.sgcv-p3-p .vide{color:rgba(255,255,255,.6)}
/* 4 Flux */
.sgcv-p4-hd{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 16px;border-top:2px solid #1d1d1b;padding:10px 0 10px}
.sgcv-p4-hd .t{font-weight:700;font-size:15px}
.sgcv-p4-hd .sub{font-size:12.5px;color:var(--s-gris,#706F6F)}
.sgcv-p4-hd .dr{padding-bottom:0}
.sgcv-p4-g{display:grid;grid-template-columns:minmax(0,44fr) minmax(0,56fr);gap:26px;height:560px}
.sgcv-p4-m{height:560px;border:1px solid #1d1d1b}
.sgcv-p4-s{height:560px;overflow:hidden}
.sgcv-p4-s svg text{font-family:inherit}
.sgcv-t4{font-size:12px;fill:#1d1d1b}
.sgcv-t4.cap{font-size:11px;fill:#706F6F;text-transform:uppercase;letter-spacing:.06em}
.sgcv-t4.bg{paint-order:stroke;stroke:#fff;stroke-width:4px;stroke-linejoin:round}
.sgcv-t4 .v{font-weight:700}
.sgcv-p4-s [data-k]{cursor:pointer}
.sgcv-p4-b{margin-top:18px}
.sgcv-p4-lh{display:flex;gap:16px;align-items:baseline;border-top:2px solid #1d1d1b;padding:10px 0 6px;font-size:13px}
.sgcv-tb{width:100%;border-collapse:collapse;font-size:12.5px}
.sgcv-tb th{text-align:left;font-size:11px;color:#706F6F;font-weight:700;border-bottom:2px solid #1d1d1b;padding:6px 8px 6px 0}
.sgcv-tb td{border-bottom:1px solid #e4e4e0;padding:6px 8px 6px 0}
.sgcv-tb .r{text-align:right;font-variant-numeric:tabular-nums}
.sgcv-tb tr[data-id]{cursor:pointer}.sgcv-tb tr[data-id]:hover td{background:#FEF6B0}
.sgcv-tb .pt{display:inline-block;width:8px;height:8px;background:var(--c);margin-right:6px}
.sgcv-p4-b .sgcv-fi{max-width:720px}
/* 5 Billets */
.sgcv-p5-f{position:relative;padding:14px}
.sgcv-p5-f .cm{position:absolute;width:22px;height:22px;border:0 solid #1d1d1b}
.sgcv-p5-f .cm.a{left:0;top:0;border-left-width:1.5px;border-top-width:1.5px}.sgcv-p5-f .cm.b{right:0;top:0;border-right-width:1.5px;border-top-width:1.5px}
.sgcv-p5-f .cm.c{left:0;bottom:0;border-left-width:1.5px;border-bottom-width:1.5px}.sgcv-p5-f .cm.d{right:0;bottom:0;border-right-width:1.5px;border-bottom-width:1.5px}
.sgcv-p5-m{height:440px}
.sgcv-svg .sgcv-tk5{stroke:#C8321E;stroke-width:1.2}
.sgcv-svg .sgcv-t5{font-family:'Akkurat Mono','AkkuratMono',ui-monospace,Menlo,monospace;font-size:10.5px;fill:#1d1d1b}
.sgcv-svg .sgcv-t5.ax{fill:#C8321E;font-size:9.5px}
.sgcv-svg .sgcv-t5.on{fill:#C8321E;font-size:12px}
.sgcv-p5-bar{display:flex;align-items:baseline;gap:16px;border-top:2px solid #1d1d1b;margin-top:14px;padding:10px 0 4px}
.sgcv-p5-bar .t{font-weight:700;font-size:14px}
.sgcv-p5-bar .dr{padding-bottom:0}
.sgcv-p5-x{display:flex;gap:14px;overflow-x:auto;padding:10px 2px 16px;scroll-snap-type:x proximity}
.sgcv-tk{flex:0 0 330px;display:grid;grid-template-columns:30px 1fr;border:0;background:#F1F0EC;font:inherit;text-align:left;padding:0;cursor:pointer;scroll-snap-align:start;color:#1d1d1b;font-family:'Akkurat Mono','AkkuratMono',ui-monospace,Menlo,monospace;outline:2px solid transparent;outline-offset:2px}
.sgcv-tk:hover{background:#ECEAE3}
.sgcv-tk.on{outline-color:#C8321E}
.sgcv-tk .sd{background:#1d1d1b;color:#fff;display:flex;align-items:center;justify-content:center}
.sgcv-tk.ch .sd{background:#C8321E}
.sgcv-tk .sd span{writing-mode:vertical-rl;transform:rotate(180deg);font-size:10px;letter-spacing:.12em;white-space:nowrap}
.sgcv-tk .bd{display:flex;flex-direction:column;padding:10px 14px 10px;border-right:1px dashed #b8b6ae;min-width:0}
.sgcv-tk .r1{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.sgcv-tk .no{font-size:24px;font-weight:700;letter-spacing:-.01em}
.sgcv-tk .ph{font-size:9.5px;text-transform:uppercase;letter-spacing:.06em;padding:2px 6px;background:var(--c);color:#fff;white-space:nowrap}
.sgcv-tk .tt{font-family:var(--s-font,inherit);font-size:12.5px;font-weight:700;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgcv-tk .mo{font-family:var(--s-font,inherit);font-size:11.5px;color:#706F6F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:14px}
.sgcv-tk .cs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px}
.sgcv-tk .cs:has(.w){grid-template-columns:1fr 1fr}
.sgcv-tk .cs small{display:block;font-size:9px;letter-spacing:.1em;color:#706F6F}
.sgcv-tk .cs b{font-size:22px;line-height:1.05;font-weight:700}
.sgcv-tk .cs b.r{color:#C8321E}
.sgcv-tk .cs sup{font-size:9px;letter-spacing:.06em;margin-left:2px;vertical-align:top;position:relative;top:3px}
.sgcv-tk .ft{display:flex;justify-content:space-between;align-items:flex-end;margin-top:10px;gap:10px}
.sgcv-tk .bc{display:flex;align-items:flex-end;gap:2px;height:24px;flex:1}
.sgcv-tk .bc i{flex:1;background:#1d1d1b;min-height:2px}
.sgcv-tk.ch .bc i{background:#C8321E}
.sgcv-tk .eq{font-size:10.5px;letter-spacing:.06em;white-space:nowrap}
.sgcv-p5-pc{border-top:2px solid #1d1d1b;padding-top:12px}
.sgcv-p5-pg{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:28px;align-items:start}
.sgcv-p5-ph{font-size:14px;margin-bottom:6px}
.sgcv-p5-ph small{color:#706F6F;font-size:12px;margin-left:8px}
.sgcv-svg .sgcv-t5.b,.sgcv-p5-pc .sgcv-t5.b{font-weight:700}
.sgcv-p5-pc svg text{font-family:'Akkurat Mono','AkkuratMono',ui-monospace,Menlo,monospace;font-size:10.5px;fill:#1d1d1b}
.sgcv-p5-pc svg text.b{font-weight:700}
.sgcv-p5-pc svg text.g{fill:#706F6F}
@container (max-width:1040px){ .sgcv-p2-r{grid-template-columns:repeat(2,minmax(0,1fr))} }
@container (max-width:560px){ .sgcv-p2-r{grid-template-columns:1fr} .sgcv-p2-fl{left:12px;right:12px;width:auto} }
@container (max-width:820px){ .sgcv-p1,.sgcv-p5-pg{grid-template-columns:1fr} .sgcv-p4-g{grid-template-columns:1fr;height:auto} }
`;
const sty=document.createElement('style'); sty.id='sgcv-css'; sty.textContent=STY; document.head.append(sty);

})();

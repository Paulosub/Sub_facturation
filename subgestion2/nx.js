/* ══ SUBGestion 2 — coquille « NX » ═════════════════════════════════════════════════════════════════
   Ajouté après le script de DeltaSub par subgestion2/construire.py (même document : accès direct à DS, go, VIEWS…).
   - navigation par flux de travail (panneau latéral), en-tête (historique, fil d'Ariane, actions), palette ⌘K ;
   - écrans nouveaux : Aujourd'hui (nx-home), fiches Projet / Contact / Membre (nx-projet, nx-contact, nx-collab),
     Données & sauvegarde (nx-data) ;
   - icônes, libellés et mise en forme propres à SUBGestion 2 ; données inchangées (IndexedDB « DeltaSub »). */
'use strict';
const NXI={
  home:'<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2Z"/>',
  folder:'<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/><path d="M8 10v4M12 10v2M16 10v6"/>',
  crane:'<path d="M2 20h20M5 20V8l7-5 7 5v12"/><path d="M9 20v-6h6v6M9 10h6"/>',
  contacts:'<path d="M16 2v2M8 2v2"/><rect x="3" y="4" width="18" height="18" rx="2"/><circle cx="12" cy="11" r="3"/><path d="M7 20.5c.6-2.3 2.6-3.5 5-3.5s4.4 1.2 5 3.5"/>',
  clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  wallet:'<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  library:'<path d="m16 6 4 14M12 6v14M8 8v12M4 4v16"/>',
  settings:'<path d="M20 7h-9M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  chev:'<path d="m9 18 6-6-6-6"/>', back:'<path d="m15 18-6-6 6-6"/>', fwd:'<path d="m9 18 6-6-6-6"/>',
  side:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', more:'<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  pin:'<path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>',
  edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  minus:'<path d="M5 12h14"/>',
  dup:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  doc:'<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5Z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
  print:'<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  filter:'<path d="M22 3H2l8 9.46V19l4 2v-8.54Z"/>',
  wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  person:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  tree:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><path d="M6.5 10v4a2 2 0 0 0 2 2H14"/>',
  gear:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  analyse:'<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
  import:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  export:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
  save:'<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  pdf:'<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5Z"/><path d="M14 2v6h6M9 13h6M9 17h3"/>',
  moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  prev:'<path d="m15 18-6-6 6-6"/>', next:'<path d="m9 18 6-6-6-6"/>',
  first:'<path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/>', last:'<path d="m13 17 5-5-5-5M6 17l5-5-5-5"/>',
  today:'<circle cx="12" cy="12" r="4" fill="currentColor"/>',
  timer:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M10 2h4"/>',
  receipt:'<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 17.5v-11"/>',
  building:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
  phone:'<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  map:'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  cal:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  check:'<path d="M20 6 9 17l-5-5"/>', task:'<rect x="3" y="5" width="6" height="6" rx="1"/><path d="m3 17 2 2 4-4M13 6h8M13 12h8M13 18h8"/>',
  trend:'<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>', cmd:'<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/>',
  db:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
  link:'<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  coins:'<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18M7 6h1v4M16.71 13.88l.7.71-2.82 2.82"/>'
};
const nxSvg=(n,cls)=>'<svg'+(cls?' class="'+cls+'"':'')+' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(NXI[n]||NXI.list)+'</svg>';
/* icônes des barres d'outils : nouveau dessin (ICO d'origine conservé pour les autres usages) */
icon=function(n){ return NXI[n]?nxSvg(n):`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${ICO[n]||''}</svg>`; };
const NX_LOGO='<svg viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="nxg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9a7dff"/><stop offset="1" stop-color="#5a36f0"/></linearGradient></defs>'
  +'<rect width="40" height="40" rx="11" fill="url(#nxg)"/><path d="M11 25.5h10a4.5 4.5 0 0 0 0-9h-2a4.5 4.5 0 0 1 0-9h10" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/><circle cx="29" cy="25.5" r="3.2" fill="#d9ff5c"/></svg>';

/* ── Architecture de navigation (par flux de travail) ── */
const NX_NAV=[
  {k:'home',t:'Aujourd’hui',ico:'home',v:'nx-home'},
  {k:'projets',t:'Projets',ico:'folder',items:[['aff-mes','Mes projets'],['aff-toutes','Tous les projets'],['aff-controlling','Suivi & écarts'],['aff-gestion','Registre des projets'],
    ['taches-urgent','Tâches urgentes'],['taches-encours','Tâches en cours'],['taches-regle','Tâches réglées']]},
  {k:'chantier',t:'Chantier & coûts',ico:'crane',items:[['coplan','Estimations'],['devis','Descriptifs & devis'],['soum','Appels d’offres'],['coco','Contrôle des coûts']]},
  {k:'contacts',t:'Contacts',ico:'contacts',items:[['adr-entites','Annuaire'],['adr-liste','Toutes les adresses'],['adr-favoris','Favoris'],['adr-groupes','Listes de diffusion'],['adr-chercher','Recherche avancée'],['adr-props','Catégories']]},
  {k:'temps',t:'Temps & dépenses',ico:'clock',items:[['h-saisie','Feuille de temps'],['h-rapport','Rapports de temps'],['h-dispo','Disponibilités'],['frais','Dépenses'],['frais-rapport','Rapport des dépenses']]},
  {k:'equipe',t:'Équipe',ico:'users',items:[['collab-actuels','Membres'],['collab-tous','Tous les membres'],['collab-anciens','Anciens membres'],['mg-planning','Planification'],['mg-heures','Temps de l’équipe'],['mg-collab','Suivi RH']]},
  {k:'finances',t:'Finances',ico:'wallet',items:[['mg-contrats','Contrats'],['mg-factures','Facturation'],['fact-controle','Suivi des factures'],['mg-controlling','Rentabilité'],['mg-mo','Clients'],['mg-reporting','Indicateurs'],['mg-genres','Types de projets']]},
  {k:'biblio',t:'Bibliothèque',ico:'library',items:[['tpl-documents','Documents types'],['tpl-projectTemplates','Projets types'],['tpl-staffTemplates','Profils d’équipe'],['tpl-timeTemplates','Horaires types'],
    ['tpl-expensesTemplates','Dépenses types'],['tpl-managementTemplates','Gestion types'],['tpl-addressTemplates','Formats d’adresse'],['tpl-labelTemplates','Étiquettes'],['tpl-images','Images'],['tpl-backgrounds','Fonds de page']]},
  {k:'reglages',t:'Réglages',ico:'settings',items:[['nx-data','Données & sauvegarde'],['config','Administration']]}
];
const NX_VIEW={};   // id de vue → {g: groupe, t: libellé}
NX_NAV.forEach(g=>{ if(g.v) NX_VIEW[g.v]={g,t:g.t}; (g.items||[]).forEach(([id,t])=>{ if(!NX_VIEW[id]) NX_VIEW[id]={g,t}; }); });
NX_VIEW['nx-projet']={g:NX_NAV[1],t:'Fiche projet'}; NX_VIEW['nx-contact']={g:NX_NAV[3],t:'Fiche contact'}; NX_VIEW['nx-collab']={g:NX_NAV[5],t:'Fiche membre'};
const NX_KW={'aff-mes':'affaires','aff-toutes':'affaires liste','aff-controlling':'controlling','aff-gestion':'affaires gestion','coplan':'eccc estimation coût','devis':'devis descriptif cfc','soum':'soumissions offres',
  'coco':'contrôle des coûts budget','adr-entites':'adresses entités sociétés personnes','h-saisie':'heures saisie','h-rapport':'heures rapport','frais':'notes de frais','frais-rapport':'notes de frais',
  'collab-actuels':'collaborateurs','mg-heures':'heures management','mg-collab':'collaborateurs management','mg-contrats':'contrats honoraires','mg-factures':'factures honoraires encaissements qr',
  'fact-controle':'contrôle de factures','mg-mo':'maître d’ouvrage','mg-reporting':'reporting','mg-genres':'genres d’affaires','tpl-documents':'modèles','nx-data':'export import base sauvegarde','config':'administrateur paramètres'};

const NX={hist:[],pos:-1,nav:false,booted:false};
const nxLS={ get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(_){ return d; } }, set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(_){} } };
const nxE=s=>esc(s);
const nxNorm=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const nxH=v=>{ v=Math.round((+v||0)*10)/10; return num(v,v%1?1:0); };
const nxCHF=v=>num(Math.round(+v||0),0);
const nxIni=s=>{ const w=String(s||'').replace(/[^\p{L}\s-]/gu,' ').trim().split(/[\s-]+/).filter(Boolean); return ((w[0]||'?')[0]+(w.length>1?w[w.length-1][0]:(w[0]||'')[1]||'')).toUpperCase(); };
const nxDay=d=>d.toLocaleDateString('fr-CH',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
const nxRel=d=>{ const n=Math.round((dayStart(new Date())-dayStart(d))/864e5); return n<=0?'aujourd’hui':n===1?'hier':n<7?'il y a '+n+' j':n<60?'il y a '+Math.round(n/7)+' sem.':dfr(diso(d)); };
function dayStart(d){ return new Date(d.getFullYear(),d.getMonth(),d.getDate()); }
const nxStateTag=p=>p?'<span class="nx-tag s'+p.PROJECTSTATECODE+'">'+nxE(projState(p))+'</span>':'';
const nxMe=()=>ME.staff;
function nxFirstName(){ const s=nxMe(), c=s&&DS.get('contact',s.PERSON_ID), o=c&&DS.get('contactowner',c.CONTACTOWNER_ID);
  return (o&&o.TYPECODE===1&&o.NAME2)||(ME.u&&ME.u.NAME)||''; }
function nxWorkdays(y,m){ let n=0; const d=new Date(y,m,1); while(d.getMonth()===m){ const w=d.getDay(); if(w&&w<6) n++; d.setDate(d.getDate()+1); } return n; }
function nxTarget(staffId,y,m){ const t=DS.by('stafftargettime','STAFF_ID',staffId).find(x=>+x.TARGETTIMEYEAR===y); const v=t?+t['TARGETHOURS'+m]:NaN; return isFinite(v)&&v>0?v:nxWorkdays(y,m)*8.5; }
function nxRate(staffId,d){ const rs=DS.by('staffrate','STAFF_ID',staffId).filter(r=>r.VALIDFROM).sort((a,b)=>cmp(a.VALIDFROM,b.VALIDFROM)); const k=diso(d); let r=0; for(const x of rs){ if(x.VALIDFROM<=k) r=+x.RATE||0; } return r||(rs[0]?+rs[0].RATE||0:0); }
const nxCan=id=>typeof ch08bViewOk!=='function'||ch08bViewOk(id);

/* ═══ Cadre : panneau latéral ═══ */
function nxSide(){
  const nav=document.getElementById('nx-nav'); if(!nav) return;
  const open=nxLS.get('nx_open',{}), cur=VIEW&&NX_VIEW[VIEW.id], curG=cur&&cur.g.k;
  let h0='';
  NX_NAV.forEach(g=>{
    if(g.v){ h0+='<div class="nx-g'+(curG===g.k?' cur':'')+'"><div class="nx-gt'+(VIEW&&VIEW.id===g.v?' on':'')+'" data-go="'+g.v+'" title="'+nxE(g.t)+'">'+nxSvg(g.ico)+'<span class="lb">'+nxE(g.t)+'</span></div></div>'; return; }
    const its=g.items.filter(([id])=>nxCan(id)); if(!its.length) return;
    const isOpen=open[g.k]!=null?open[g.k]:curG===g.k;
    h0+='<div class="nx-g'+(isOpen?' open':'')+(curG===g.k?' cur':'')+'" data-g="'+g.k+'"><div class="nx-gt" data-tg="'+g.k+'" title="'+nxE(g.t)+'">'+nxSvg(g.ico)+'<span class="lb">'+nxE(g.t)+'</span>'+nxSvg('chev','ch')+'</div><div class="nx-gi">'
      +its.map(([id,t])=>'<div class="nx-it'+(VIEW&&VIEW.id===id?' on':'')+'" data-go="'+id+'">'+nxE(t)+'</div>').join('')+'</div></div>';
  });
  const pins=nxLS.get('nx_pins',[]).map(nxRef).filter(Boolean);
  if(pins.length) h0+='<div class="nx-pins"><div class="nx-sep">Épinglés</div>'+pins.map(r=>'<div class="nx-pin" data-ref="'+r.k+':'+r.id+'" title="'+nxE(r.t)+'">'+(r.tag?'<i>'+nxE(r.tag)+'</i>':'')+'<span>'+nxE(r.t)+'</span></div>').join('')+'</div>';
  nav.innerHTML=h0;
}
function nxSideClick(e){
  const go_=e.target.closest('[data-go]'), tg=e.target.closest('[data-tg]'), pin=e.target.closest('[data-ref]');
  if(go_){ go(go_.dataset.go); return; }
  if(pin){ nxOpenRef(pin.dataset.ref); return; }
  if(tg){ const k=tg.dataset.tg, g=NX_NAV.find(x=>x.k===k);
    if(document.getElementById('app').classList.contains('nx-mini')){ const f=g.items.find(([id])=>nxCan(id)); if(f) go(f[0]); return; }
    const el=tg.parentNode, o=nxLS.get('nx_open',{}); el.classList.toggle('open'); o[k]=el.classList.contains('open'); nxLS.set('nx_open',o); }
}
/* références (épinglés, récents) : p = projet, c = contact (entité), s = membre */
function nxRef(r){ if(!r) return null;
  if(r.k==='p'){ const p=DS.get('project',r.id); return p&&{k:'p',id:r.id,t:p.TITLE||p.NUMBER,tag:p.NUMBER,ico:'folder',sub:projState(p)}; }
  if(r.k==='c'){ const o=DS.get('contactowner',r.id); return o&&{k:'c',id:r.id,t:ownerName(o),ico:o.TYPECODE===1?'person':'building',sub:OWNER_T[o.TYPECODE]||''}; }
  if(r.k==='s'){ const s=DS.get('staff',r.id); return s&&{k:'s',id:r.id,t:staffName(s),tag:s.INITIALS,ico:'users',sub:'Membre de l’équipe'}; }
  return null; }
function nxOpenRef(ref){ const [k,id]=String(ref).split(':'); go(k==='p'?'nx-projet':k==='c'?'nx-contact':'nx-collab',id); }
function nxRecent(k,id){ const a=nxLS.get('nx_recent',[]).filter(x=>!(x.k===k&&String(x.id)===String(id))); a.unshift({k,id:String(id)}); nxLS.set('nx_recent',a.slice(0,10)); }
function nxPinned(k,id){ return nxLS.get('nx_pins',[]).some(x=>x.k===k&&String(x.id)===String(id)); }
function nxTogglePin(k,id){ let a=nxLS.get('nx_pins',[]); const on=a.some(x=>x.k===k&&String(x.id)===String(id));
  a=on?a.filter(x=>!(x.k===k&&String(x.id)===String(id))):[...a,{k,id:String(id)}]; nxLS.set('nx_pins',a); nxSide(); toast(on?'Retiré des épinglés.':'Épinglé dans le panneau latéral.'); return !on; }
function nxFoot(){ const f=document.getElementById('nx-who'); if(!f) return; const s=nxMe(), n=(s&&staffName(s))||(ME.u&&ME.u.NAME)||'Utilisateur';
  f.innerHTML='<div class="nx-av">'+nxE(nxIni(n))+'</div><div class="who"><b>'+nxE(n)+'</b><span>Base locale</span></div>'; }
function nxMini(on){ const a=document.getElementById('app'); a.classList.toggle('nx-mini',on==null?!a.classList.contains('nx-mini'):on); nxLS.set('nx_mini',a.classList.contains('nx-mini')); }

/* ═══ Cadre : en-tête ═══ */
function nxHead(){
  const id=VIEW&&VIEW.id, m=NX_VIEW[id], t=document.getElementById('nx-title'), c=document.getElementById('nx-crumbs');
  let title=m?m.t:'', crumbs=m&&!m.g.v?m.g.t:'';
  if(id==='nx-home'){ title='Aujourd’hui'; crumbs=nxDay(new Date()).replace(/^./,x=>x.toUpperCase()); }
  const ent=VIEW&&VIEW.nxTitle; if(ent){ title=ent; crumbs=(m?m.g.t+' · ':'')+m.t; }
  if(!m&&id){ title=id; }
  if(t) t.textContent=title; if(c) c.textContent=crumbs;
  document.title=(title?title+' — ':'')+'SUBGestion';
  const se=document.getElementById('search'); if(se&&!se.disabled) se.placeholder='Filtrer…  /';
  nxSubSync();
  const b=document.getElementById('nx-back'), f=document.getElementById('nx-fwd'); if(b) b.disabled=NX.pos<=0; if(f) f.disabled=NX.pos>=NX.hist.length-1;
}
/* barre contextuelle (outils et filtre de l'écran) : masquée quand l'écran n'en a pas */
function nxSubSync(){ const tl=document.getElementById('tools'), se=document.getElementById('search'), sub=document.getElementById('nx-sub');
  if(sub) sub.classList.toggle('empty',!(tl&&tl.querySelector('button,input,select,.seg'))&&!(se&&!se.disabled)); }
function nxNewMenu(el){ popMenu(el,[
  {t:'Projet',fn:()=>editProject()},
  {t:'Contact — société',fn:()=>editOwner(null,0)},{t:'Contact — personne',fn:()=>editOwner(null,1)},'-',
  {t:'Saisie de temps',fn:()=>go('h-saisie')},{t:'Dépense',fn:()=>go('frais')}]); }
function nxMenuCmds(){ try{ return ch10aModel(ch10aCtx(false)).filter(m=>m.k!=='Edit'&&m.k!=='menuView')
    .map(m=>({t:m.titre,items:m.items.filter(it=>it!=='-'&&!it.dis).map(it=>({t:String(it.t).replace(/\s*…$/,''),fn:()=>ch10aRun(it.act,it.arg)}))})).filter(m=>m.items.length); }
  catch(e){ console.error(e); return []; } }
function nxMoreMenu(el){ const its=[{t:'Données & sauvegarde',fn:()=>go('nx-data')},{t:'Exporter la base',fn:()=>lbExport()},{t:'Importer une base',fn:()=>lbImportDlg(false)}];
  nxMenuCmds().forEach(m=>{ its.push('-'); m.items.forEach(x=>its.push({t:x.t,fn:x.fn})); });
  its.push('-',{t:'Réduire / déployer le panneau   ⌘\\',fn:()=>nxMini()},{t:'Raccourcis clavier',fn:nxKeysHelp});
  popMenu(el,its); }
function nxKeysHelp(){ dialog({title:'Raccourcis clavier',body:h('div',{html:'<dl class="nx-dl" style="font-size:13px;min-width:360px">'
  +[['⌘ K','Rechercher partout (projets, contacts, écrans, commandes)'],['/','Filtrer la liste de l’écran'],['⌘ \\','Réduire le panneau latéral'],['⌥ ← / ⌥ →','Écran précédent / suivant'],['Échap','Fermer une fenêtre']]
  .map(([k,t])=>'<dt><span class="nx-tag">'+k+'</span></dt><dd>'+t+'</dd>').join('')+'</dl>'})}); }

/* ═══ Navigation : historique, synchronisation ═══ */
const nxGo0=go;
go=function(id,arg){
  const fromHist=NX.nav; NX.nav=false;
  if(arg==null&&/^nx-(projet|contact|collab)$/.test(id)){ const a=nxLS.get('nx_arg',{}); arg=a[id]; }
  nxGo0(id,arg);
  if(!VIEW||VIEW.id!==id) return;
  if(/^nx-(projet|contact|collab)$/.test(id)&&arg!=null){ const a=nxLS.get('nx_arg',{}); a[id]=String(arg); nxLS.set('nx_arg',a); }
  if(!fromHist){ const top=NX.hist[NX.pos]; if(!top||top.id!==id||String(top.arg)!==String(arg)){ NX.hist=NX.hist.slice(0,NX.pos+1); NX.hist.push({id,arg}); if(NX.hist.length>60) NX.hist.shift(); NX.pos=NX.hist.length-1; } }
  NX.booted=true; nxSide(); nxHead(); nxFoot();
  const main=document.getElementById('main'); if(main) main.scrollTop=0;
};
function nxHist(d){ const p=NX.pos+d; if(p<0||p>=NX.hist.length) return; NX.pos=p; NX.nav=true; const x=NX.hist[p]; go(x.id,x.arg); }

/* ═══ Petits graphiques (SVG) ═══ */
function nxBars(data,o){ o=o||{}; const W=o.w||640, H=o.h||170, pl=34, pb=22, pt=10, n=data.length||1, bw=(W-pl-8)/n;
  const max=Math.max(o.min||1,...data.map(d=>(d.a||0)+(d.b||0)),...(data.map(d=>d.t||0)));
  const st0=max/4, p10=Math.pow(10,Math.floor(Math.log10(st0))), step=[1,2,2.5,5,10].map(x=>x*p10).find(x=>x>=st0)||p10*10, nice=step*4;
  const y=v=>pt+(H-pt-pb)*(1-v/nice);
  let s='<svg class="nx-chart" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" style="height:'+H+'px">';
  for(let i=0;i<=4;i++){ const v=nice*i/4, yy=y(v); s+='<line x1="'+pl+'" x2="'+(W-4)+'" y1="'+yy+'" y2="'+yy+'" stroke="#eef0f3"/><text x="'+(pl-6)+'" y="'+(yy+3.5)+'" text-anchor="end">'+Math.round(v)+'</text>'; }
  data.forEach((d,i)=>{ const x=pl+i*bw+bw*.18, w=bw*.64, a=d.a||0, b=d.b||0;
    if(a) s+='<rect x="'+x+'" y="'+y(a)+'" width="'+w+'" height="'+(y(0)-y(a))+'" rx="3" fill="#6c47ff"><title>'+nxE(d.l+' — '+(o.la||'')+' '+nxH(a)+' h')+'</title></rect>';
    if(b) s+='<rect x="'+x+'" y="'+y(a+b)+'" width="'+w+'" height="'+(y(a)-y(a+b))+'" rx="3" fill="#cfc4ff"><title>'+nxE(d.l+' — '+(o.lb||'')+' '+nxH(b)+' h')+'</title></rect>';
    if(d.t) s+='<line x1="'+(x-2)+'" x2="'+(x+w+2)+'" y1="'+y(d.t)+'" y2="'+y(d.t)+'" stroke="#16181d" stroke-width="1.5" stroke-dasharray="3 2"/>';
    if(!o.every||i%o.every===0) s+='<text x="'+(x+w/2)+'" y="'+(H-6)+'" text-anchor="middle">'+nxE(d.s||d.l)+'</text>'; });
  return s+'</svg>'; }
const nxMiniBar=(v,max)=>'<span class="nx-mini-bar"><i style="width:'+Math.max(2,Math.min(100,max?v/max*100:0))+'%"></i></span>';
const nxCard=(cls,title,body,extra)=>'<div class="nx-card '+cls+'"><h4>'+title+(extra||'')+'</h4>'+body+'</div>';
const nxKpi=(ico,l,v,s,bar,go_)=>'<div class="nx-kpi'+(go_?' lnk':'')+'"'+(go_?' data-go="'+go_+'"':'')+'><div class="l">'+nxSvg(ico)+nxE(l)+'</div><div class="v">'+v+'</div>'+(s?'<div class="s">'+s+'</div>':'')+(bar!=null?'<div class="nx-bar"><i style="width:'+Math.max(0,Math.min(100,bar))+'%"></i></div>':'')+'</div>';
function nxPage(m,html){ const p=h('div',{class:'nx-page'}); p.innerHTML='<div class="nx-wrap">'+html+'</div>'; m.append(p);
  p.addEventListener('click',e=>{ const t=e.target.closest('[data-go],[data-ref],[data-fn]'); if(!t||!p.contains(t)) return;
    if(t.dataset.ref) nxOpenRef(t.dataset.ref); else if(t.dataset.go) go(t.dataset.go,t.dataset.arg); else if(t.dataset.fn&&p._fn&&p._fn[t.dataset.fn]) p._fn[t.dataset.fn](t); });
  p._fn={}; return p; }

/* ═══ Écran « Aujourd’hui » ═══ */
VIEWS['nx-home']={
  render(m){ const me=nxMe(), now=new Date(), y=now.getFullYear(), mo=now.getMonth(), mon=mondayOf(now), k0=dayKey(mon), kSun=dayKey(new Date(mon.getFullYear(),mon.getMonth(),mon.getDate()+6));
    const logs=DS.all('timelog'), mine=me?logs.filter(r=>String(r.STAFF_ID)===String(me.ID)):[];
    const sum=(a,f)=>a.reduce((s,r)=>s+(f(r)?+r.TIMEPERIOD||0:0),0);
    const wk=sum(mine,r=>tlKey(r)>=k0&&tlKey(r)<=kSun), mth=sum(mine,r=>+r.TIMEYEAR===y&&+r.TIMEMONTH===mo);
    const tMonth=me?nxTarget(me.ID,y,mo):0, tWeek=tMonth?tMonth/nxWorkdays(y,mo)*5:42.5;
    const teamM=logs.filter(r=>+r.TIMEYEAR===y&&+r.TIMEMONTH===mo), teamH=sum(teamM,()=>1), teamC=sum(teamM,r=>+r.ISCHARGEABLE);
    const projs=DS.all('project'), act=projs.filter(p=>+p.PROJECTSTATECODE===2).length, wait=projs.filter(p=>+p.PROJECTSTATECODE===3).length;
    const exp=me?DS.by('projectcost','STAFF_ID',me.ID).filter(r=>+r.ISREFUNDABLE&&!+r.ISREFUNDED):[], expS=exp.reduce((s,r)=>s+pcAmount(r),0);
    /* mes projets actifs (90 jours) */
    const lim=dayKey(new Date(y,mo,now.getDate()-90)), lim30=dayKey(new Date(y,mo,now.getDate()-30)), per={};
    mine.forEach(r=>{ const k=tlKey(r); if(k<lim) return; const x=per[r.PROJECT_ID]||(per[r.PROJECT_ID]={h30:0,last:0,h:0}); x.h+=+r.TIMEPERIOD||0; if(k>=lim30) x.h30+=+r.TIMEPERIOD||0; if(k>x.last){ x.last=k; x.d=tlDate(r); } });
    let mineOnly=true; if(!Object.keys(per).length){ mineOnly=false;   // aucune saisie personnelle : projets actifs du bureau
      logs.forEach(r=>{ const k=tlKey(r); if(k<lim) return; const x=per[r.PROJECT_ID]||(per[r.PROJECT_ID]={h30:0,last:0,h:0}); x.h+=+r.TIMEPERIOD||0; if(k>=lim30) x.h30+=+r.TIMEPERIOD||0; if(k>x.last){ x.last=k; x.d=tlDate(r); } }); }
    const myP=Object.entries(per).map(([id,x])=>({p:DS.get('project',id),...x})).filter(x=>x.p&&!+x.p.ISINTERNAL).sort((a,b)=>b.h30-a.h30||b.last-a.last).slice(0,8), maxP=Math.max(1,...myP.map(x=>x.h30));
    /* équipe : 12 semaines */
    const weeks=[]; for(let i=11;i>=0;i--){ const d=new Date(mon); d.setDate(d.getDate()-7*i); weeks.push({d,k:dayKey(d),ke:dayKey(new Date(d.getFullYear(),d.getMonth(),d.getDate()+6)),a:0,b:0}); }
    const wk0=weeks[0].k; logs.forEach(r=>{ const k=tlKey(r); if(k<wk0) return; const w=weeks.find(x=>k>=x.k&&k<=x.ke); if(!w) return; if(+r.ISCHARGEABLE) w.a+=+r.TIMEPERIOD||0; else w.b+=+r.TIMEPERIOD||0; });
    weeks.forEach(w=>{ w.l='Semaine '+isoWeek(w.d)[1]; w.s=String(isoWeek(w.d)[1]); });
    /* équipe : cette semaine */
    const team=staffList().map(s=>({s,h:sum(logs.filter(r=>String(r.STAFF_ID)===String(s.ID)),r=>tlKey(r)>=k0&&tlKey(r)<=kSun)})).sort((a,b)=>b.h-a.h);
    /* tâches ouvertes */
    const tasks=DS.all('projecttask').filter(t=>!t.DONEDATE).sort((a,b)=>cmp(a.DEADLINE,b.DEADLINE)).slice(0,7);
    const greet=now.getHours()<12?'Bonjour':now.getHours()<18?'Bon après-midi':'Bonsoir', fn=nxFirstName();
    const html='<div class="nx-hello"><div><h2>'+greet+(fn?' '+nxE(fn):'')+'</h2><p>'+nxE(nxDay(now).replace(/^./,x=>x.toUpperCase()))+' · semaine '+isoWeek(now)[1]+'</p></div>'
      +'<div class="nx-quick"><button class="nx-chip" data-go="h-saisie">'+nxSvg('timer')+'Saisir mon temps</button><button class="nx-chip" data-go="frais">'+nxSvg('receipt')+'Dépense</button>'
      +'<button class="nx-chip" data-fn="np">'+nxSvg('folder')+'Nouveau projet</button><button class="nx-chip" data-fn="pal">'+nxSvg('search')+'Rechercher <span class="nx-tag">⌘K</span></button></div></div>'
      +'<div class="nx-kpis">'
      +nxKpi('timer','Mon temps cette semaine',nxH(wk)+'<small>/ '+nxH(tWeek)+' h</small>',me?Math.round(wk/tWeek*100)+' % de l’objectif hebdomadaire':'Aucun membre lié à cet utilisateur',tWeek?wk/tWeek*100:0,'h-saisie')
      +nxKpi('cal','Mon temps ce mois',nxH(mth)+'<small>/ '+nxH(tMonth)+' h</small>',MOISL[mo]+' '+y,tMonth?mth/tMonth*100:0,'h-rapport')
      +nxKpi('folder','Projets en cours',String(act),wait+' en attente · '+projs.length+' au total',null,'aff-toutes')
      +nxKpi('users','Temps de l’équipe ce mois',nxH(teamH)+'<small>h</small>',(teamH?Math.round(teamC/teamH*100):0)+' % facturable',teamH?teamC/teamH*100:0,'mg-heures')
      +nxKpi('receipt','Mes dépenses à rembourser',nxCHF(expS)+'<small>CHF</small>',exp.length+' dépense'+(exp.length>1?'s':''),null,'frais')
      +'</div><div class="nx-grid">'
      +nxCard('c7',mineOnly?'Mes projets actifs':'Projets actifs du bureau',myP.length?'<div class="b flush">'+myP.map(x=>'<div class="nx-row" data-ref="p:'+x.p.ID+'"><span class="nx-tag num">'+nxE(x.p.NUMBER)+'</span><div class="t"><b>'+nxE(x.p.TITLE)+'</b><span>Dernière saisie '+nxRel(x.d)+'</span></div>'
        +nxMiniBar(x.h30,maxP)+'<span class="m">'+nxH(x.h30)+' h <span style="color:var(--nx-ink4)">/ 30 j</span></span></div>').join('')+'</div>':'<div class="nx-empty">Aucune saisie de temps ces 90 derniers jours.</div>','<span class="n">90 derniers jours</span><span class="a" data-go="aff-mes">Tous mes projets</span>')
      +nxCard('c5','Équipe cette semaine','<div class="b flush">'+(team.length?team.map(x=>'<div class="nx-person" data-ref="s:'+x.s.ID+'"><div class="nx-av">'+nxE(nxIni(staffName(x.s)))+'</div><div class="t"><b>'+nxE(staffName(x.s))+'</b><span>'+nxE(x.s.INITIALS||'')+'</span></div>'+nxMiniBar(x.h,tWeek)+'<span class="m" style="min-width:52px;text-align:right">'+nxH(x.h)+' h</span></div>').join(''):'<div class="nx-empty">Aucun membre actif.</div>')+'</div>','<span class="a" data-go="collab-actuels">Membres</span>')
      +nxCard('c7','Temps de l’équipe — 12 semaines','<div class="b">'+nxBars(weeks,{la:'facturable',lb:'non facturable'})+'</div><div class="nx-legend"><span><i style="background:#6c47ff"></i>Facturable</span><span><i style="background:#cfc4ff"></i>Non facturable</span></div>','<span class="a" data-go="h-rapport">Rapports</span>')
      +nxCard('c5','Tâches ouvertes',tasks.length?'<div class="b flush">'+tasks.map(t=>{ const p=DS.get('project',t.PROJECT_ID), late=t.DEADLINE&&t.DEADLINE<today();
          return '<div class="nx-row" data-go="'+(+t.ISURGENT?'taches-urgent':'taches-encours')+'">'+nxSvg('task')+'<div class="t"><b>'+nxE(t.SUBJECT||'(sans objet)')+'</b><span>'+nxE(p?projLabel(p):'')+'</span></div>'
            +(+t.ISURGENT?'<span class="nx-tag urg">Urgent</span>':'')+'<span class="m"'+(late?' style="color:var(--err)"':'')+'>'+(t.DEADLINE?dfr(t.DEADLINE):'')+'</span></div>'; }).join('')+'</div>':'<div class="nx-empty">Aucune tâche ouverte.</div>','<span class="a" data-go="taches-encours">Toutes les tâches</span>')
      +'</div>';
    const pg=nxPage(m,html); pg._fn.np=()=>editProject(); pg._fn.pal=()=>nxPal();
    pg.querySelectorAll('.nx-kpi.lnk').forEach(k=>k.onclick=()=>go(k.dataset.go)); },
  refresh(ts){ if(hit(ts,'timelog','project','projecttask','projectcost','staff')) go('nx-home'); }
};

/* ═══ Fiche projet ═══ */
VIEWS['nx-projet']={
  render(m,arg){ const p=DS.get('project',arg); if(!p){ nxPage(m,'<div class="nx-empty">Projet introuvable. Choisissez un projet avec ⌘K.</div>'); return; }
    VIEW.nxTitle=(p.NUMBER?p.NUMBER+' · ':'')+(p.TITLE||''); nxRecent('p',p.ID);
    const logs=DS.by('timelog','PROJECT_ID',p.ID), now=new Date(), lim30=dayKey(new Date(now.getFullYear(),now.getMonth(),now.getDate()-30));
    let tot=0, h30=0, chg=0, cost=0; const bySt={}, byPh={}, byM={};
    logs.forEach(r=>{ const v=+r.TIMEPERIOD||0, d=tlDate(r); tot+=v; if(tlKey(r)>=lim30) h30+=v; if(+r.ISCHARGEABLE) chg+=v; cost+=v*nxRate(r.STAFF_ID,d);
      bySt[r.STAFF_ID]=(bySt[r.STAFF_ID]||0)+v; if(r.PHASE_ID!=null) byPh[r.PHASE_ID]=(byPh[r.PHASE_ID]||0)+v; const mk=d.getFullYear()*12+d.getMonth(); byM[mk]=(byM[mk]||0)+v; });
    const costs=DS.by('projectcost','PROJECT_ID',p.ID).reduce((s,r)=>s+pcAmount(r),0);
    const contr=DS.by('projectcontract','PROJECT_ID',p.ID).filter(c=>!+c.ISSUBCONTRACT).reduce((s,c)=>s+(+c.CONTRACTAMOUNT||0),0);
    const mks=Object.keys(byM).map(Number), mEnd=now.getFullYear()*12+now.getMonth(), mStart=Math.max(mks.length?Math.min(...mks):mEnd-11,mEnd-23), months=[];
    for(let k=Math.min(mStart,mEnd-11);k<=mEnd;k++) months.push({l:MOISL[k%12]+' '+Math.floor(k/12),s:MOIS[k%12].replace('.',''),a:byM[k]||0});
    const team=Object.entries(bySt).map(([id,v])=>({s:DS.get('staff',id),v})).filter(x=>x.s).sort((a,b)=>b.v-a.v), tmax=Math.max(1,...team.map(x=>x.v));
    const mem=DS.by('projectmember','PROJECT_ID',p.ID).filter(x=>!+x.ISHIDDEN&&+x.TEAMROLECODE!==12&&+x.TEAMROLECODE!==90).sort((a,b)=>(ROLE_ORD[a.TEAMROLECODE]??99)-(ROLE_ORD[b.TEAMROLECODE]??99)||cmp(a.SORTORDER,b.SORTORDER));
    const phases=DS.by('projectphase','PROJECT_ID',p.ID).sort((a,b)=>cmp(a.NUMBER,b.NUMBER));
    const notes=DS.by('projectnote','PROJECT_ID',p.ID).sort((a,b)=>cmp(b.CHANGEDDATE,a.CHANGEDDATE)), tasks=DS.by('projecttask','PROJECT_ID',p.ID).sort((a,b)=>cmp(a.DEADLINE,b.DEADLINE));
    const last=logs.slice().sort((a,b)=>tlKey(b)-tlKey(a)||cmp(b.TIMEHOUR1,a.TIMEHOUR1)).slice(0,8);
    const mo=projMO(p), pin=nxPinned('p',p.ID);
    const html='<div class="nx-hero"><div class="ic">'+nxE(String(p.NUMBER||'').slice(0,5)||nxIni(p.TITLE))+'</div><div class="tx"><h2>'+nxE(p.TITLE||p.NUMBER)+'</h2><div class="meta"><span class="nx-tag num">'+nxE(p.NUMBER||'')+'</span>'+nxStateTag(p)
      +(mo?'<span>'+nxSvg('person')+nxE(mo)+'</span>':'')+(p.LOCATION?'<span>'+nxSvg('map')+nxE(p.LOCATION)+'</span>':'')+(p.PROJECTSTARTDATE?'<span>'+nxSvg('cal')+dfr(p.PROJECTSTARTDATE)+(p.PROJECTENDDATE?' → '+dfr(p.PROJECTENDDATE):'')+'</span>':'')
      +(+p.ISINTERNAL?'<span class="nx-tag">Interne</span>':'')+'</div></div><div class="nx-acts"><button class="nx-btn'+(pin?' on':'')+'" data-fn="pin">'+nxSvg('pin')+(pin?'Épinglé':'Épingler')+'</button>'
      +'<button class="nx-btn" data-fn="mem">'+nxSvg('users')+'Intervenants</button><button class="nx-btn" data-fn="ph">'+nxSvg('list')+'Phases</button><button class="nx-btn" data-fn="more">'+nxSvg('more')+'</button><button class="nx-btn pri" data-fn="edit">'+nxSvg('edit')+'Modifier</button></div></div>'
      +'<div class="nx-kpis">'+nxKpi('clock','Temps total',nxH(tot)+'<small>h</small>',nxH(h30)+' h ces 30 derniers jours')+nxKpi('trend','Part facturable',(tot?Math.round(chg/tot*100):0)+'<small>%</small>',nxH(chg)+' h facturables',tot?chg/tot*100:0)
      +nxKpi('coins','Coût du temps',nxCHF(cost)+'<small>CHF</small>','au taux de chaque membre')+nxKpi('receipt','Dépenses',nxCHF(costs)+'<small>CHF</small>','frais saisis sur le projet')
      +nxKpi('wallet','Contrats',nxCHF(contr)+'<small>CHF</small>',contr&&cost?'temps consommé : '+Math.round(cost/contr*100)+' % du contrat':'montant des contrats',contr?cost/contr*100:null)+'</div>'
      +'<div class="nx-grid">'+nxCard('c8','Temps par mois','<div class="b">'+nxBars(months,{la:'',every:months.length>14?2:1})+'</div>')
      +nxCard('c4','Équipe','<div class="b flush">'+(team.length?team.slice(0,9).map(x=>'<div class="nx-person" data-ref="s:'+x.s.ID+'"><div class="nx-av">'+nxE(nxIni(staffName(x.s)))+'</div><div class="t"><b>'+nxE(staffName(x.s))+'</b><span>'+Math.round(x.v/tot*100)+' % du temps</span></div><span class="m">'+nxH(x.v)+' h</span></div>').join(''):'<div class="nx-empty">Aucune saisie de temps.</div>')+'</div>')
      +nxCard('c6','Intervenants','<div class="b flush">'+(mem.length?mem.map(x=>{ const c=DS.get('contact',x.CONTACT_ID), o=c&&DS.get('contactowner',c.CONTACTOWNER_ID);
          return '<div class="nx-person"'+(o?' data-ref="c:'+o.ID+'"':'')+'><div class="nx-av ext">'+nxE(nxIni(contactName(c)))+'</div><div class="t"><b>'+nxE(contactName(c)||'—')+'</b><span>'+nxE(teamRole(x.TEAMROLECODE))+(x.BKP?' · CFC '+nxE(x.BKP):'')+'</span></div>'+(c&&c.PHONENUMBER1?'<span class="m">'+nxE([c.PHONEAREA1,c.PHONENUMBER1].filter(Boolean).join(' '))+'</span>':'')+'</div>'; }).join(''):'<div class="nx-empty">Aucun intervenant.</div>')+'</div>','<span class="n">'+mem.length+'</span><span class="a" data-fn="mem">Gérer</span>')
      +nxCard('c6','Phases',phases.length?'<div class="b flush"><table class="nx-tbl"><tr><th>Phase</th><th class="r">Temps</th><th class="r">Budget</th><th></th></tr>'+phases.map(f=>{ const v=byPh[f.ID]||0, b=+f.TIMEBUDGET||0;
          return '<tr><td>'+nxE((f.NUMBER!=null?f.NUMBER+' · ':'')+nm(f))+'</td><td class="r">'+nxH(v)+' h</td><td class="r">'+(b?nxH(b)+' h':'—')+'</td><td style="width:110px">'+(b?nxMiniBar(v,b):'')+'</td></tr>'; }).join('')+'</table></div>':'<div class="nx-empty">Aucune phase configurée.</div>','<span class="a" data-fn="ph">Configurer</span>')
      +nxCard('c7','Dernières saisies',last.length?'<div class="b flush"><table class="nx-tbl"><tr><th>Date</th><th>Membre</th><th>Activité</th><th class="r">Durée</th></tr>'+last.map(r=>{ const s=DS.get('staff',r.STAFF_ID), a=DS.get('projectactivity',r.ACTIVITY_ID)||DS.get('activity',r.ACTIVITY_ID);
          return '<tr><td>'+dfr(diso(tlDate(r)))+'</td><td>'+nxE(s?s.INITIALS||staffName(s):'')+'</td><td style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+nxE([nm(a),r.DESCRIPTION].filter(Boolean).join(' — '))+'</td><td class="r">'+nxH(r.TIMEPERIOD)+' h</td></tr>'; }).join('')+'</table></div>':'<div class="nx-empty">Aucune saisie.</div>','<span class="a" data-go="aff-controlling">Suivi & écarts</span>')
      +nxCard('c5','Notes & tâches','<div class="b flush">'+(notes.length||tasks.length?tasks.map(t=>'<div class="nx-row">'+nxSvg('task')+'<div class="t"><b>'+nxE(t.SUBJECT||'')+'</b><span>'+(t.DONEDATE?'Réglée le '+dfr(t.DONEDATE):t.DEADLINE?'Échéance '+dfr(t.DEADLINE):'')+'</span></div>'+(+t.ISURGENT&&!t.DONEDATE?'<span class="nx-tag urg">Urgent</span>':'')+'</div>').join('')
          +notes.map(n=>'<div class="nx-row" style="cursor:default">'+nxSvg('doc')+'<div class="t"><b>'+nxE(n.SUBJECT||'Note')+'</b><span>'+nxE([n.OWNER,dfr(n.CHANGEDDATE),n.CONTENT].filter(Boolean).join(' · '))+'</span></div></div>').join(''):'<div class="nx-empty">Aucune note ni tâche.</div>')+'</div>')
      +'</div>';
    const pg=nxPage(m,html);
    Object.assign(pg._fn,{edit:()=>editProject(p),mem:()=>cfgMembers(p),ph:()=>cfgPhases(p),pin:b=>{ const on=nxTogglePin('p',p.ID); b.classList.toggle('on',on); b.innerHTML=nxSvg('pin')+(on?'Épinglé':'Épingler'); },
      more:b=>popMenu(b,[{t:'Activités',fn:()=>cfgActivities(p)},{t:'Tarifs de facturation',fn:()=>cfgRates(p)},{t:'Subdivisions',fn:()=>cfgSubprojects(p)},'-',
        {t:'Mes projets',fn:()=>go('aff-mes')},{t:'Suivi & écarts',fn:()=>go('aff-controlling')},{t:'Contrôle des coûts',fn:()=>go('coco')},{t:'Contrats',fn:()=>go('mg-contrats')}])}); },
  refresh(ts){ if(hit(ts,'project','projectmember','projectphase','timelog','projectcost','projectcontract','projectnote','projecttask')) go('nx-projet',VIEW.arg); }
};

/* ═══ Fiche contact (entité) ═══ */
function nxPhone(c,i){ const n=c['PHONENUMBER'+i]; return n?[c['PHONEAREA'+i],n].filter(Boolean).join(' '):''; }
VIEWS['nx-contact']={
  render(m,arg){ const o=DS.get('contactowner',arg); if(!o){ nxPage(m,'<div class="nx-empty">Contact introuvable.</div>'); return; }
    const name=ownerName(o); VIEW.nxTitle=name; nxRecent('c',o.ID);
    const cs=DS.by('contact','CONTACTOWNER_ID',o.ID), ids=new Set(cs.map(c=>String(c.ID)));
    const mem=DS.all('projectmember').filter(x=>ids.has(String(x.CONTACT_ID))), prj={};
    mem.forEach(x=>{ const p=DS.get('project',x.PROJECT_ID); if(!p) return; const e=prj[p.ID]||(prj[p.ID]={p,r:new Set()}); e.r.add(teamRole(x.TEAMROLECODE)); });
    const plist=Object.values(prj).sort((a,b)=>cmp(b.p.PROJECTSTARTDATE,a.p.PROJECTSTARTDATE));
    const props=[...new Set(cs.flatMap(c=>DS.by('contact_property','CONTACT_ID',c.ID).map(x=>nm(DS.get('property',x.PROPERTIES_ID)))).filter(Boolean))];
    const notes=cs.flatMap(c=>DS.by('contactnote','CONTACT_ID',c.ID)).sort((a,b)=>cmp(b.CHANGEDDATE,a.CHANGEDDATE));
    const st=DS.all('staff').find(s=>ids.has(String(s.PERSON_ID))), pin=nxPinned('c',o.ID);
    const adr=cs.map(c=>{ const tel=nxPhone(c,1), mob=nxPhone(c,2), lines=[c.NAME1,c.NAME2,c.NAME3].filter(Boolean).filter(x=>x!==name);
      return '<div class="nx-addr"><div class="h"><b>'+nxE(ADR_T[c.ADDRESSTYPECODE]||'Adresse')+'</b>'+(c.BKP?'<span class="nx-tag">CFC '+nxE(c.BKP)+'</span>':'')+(c.COMPANYROLE||c.PROFESSION?'<span class="nx-tag">'+nxE(c.COMPANYROLE||c.PROFESSION)+'</span>':'')+'</div><dl class="nx-dl">'
        +((lines.length||c.STREET||c.LOCATION)?'<dt>Adresse</dt><dd>'+[...lines,c.STREET,c.POBOX,[c.POSTALCODE,c.LOCATION].filter(Boolean).join(' ')].filter(Boolean).map(nxE).join('<br>')+'</dd>':'')
        +(tel?'<dt>Téléphone</dt><dd><a href="tel:'+nxE((c.PHONECOUNTRY1||'')+tel.replace(/^0/,'').replace(/\s/g,''))+'">'+nxE(tel)+'</a></dd>':'')
        +(mob?'<dt>Mobile</dt><dd><a href="tel:'+nxE((c.PHONECOUNTRY2||'')+mob.replace(/^0/,'').replace(/\s/g,''))+'">'+nxE(mob)+'</a></dd>':'')
        +(c.EMAIL1?'<dt>Courriel</dt><dd><a href="mailto:'+nxE(c.EMAIL1)+'">'+nxE(c.EMAIL1)+'</a></dd>':'')
        +(c.INTERNET?'<dt>Site</dt><dd><a href="'+nxE(/^https?:/i.test(c.INTERNET)?c.INTERNET:'https://'+c.INTERNET)+'" target="_blank" rel="noopener">'+nxE(c.INTERNET)+'</a></dd>':'')
        +(c.REMARK?'<dt>Remarque</dt><dd>'+nxE(c.REMARK)+'</dd>':'')+'</dl></div>'; }).join('');
    const html='<div class="nx-hero"><div class="ic">'+(o.TYPECODE===1?nxE(nxIni(name)):nxSvg('building'))+'</div><div class="tx"><h2>'+nxE(name)+'</h2><div class="meta"><span class="nx-tag">'+nxE(OWNER_T[o.TYPECODE]||'')+'</span>'
      +(o.UID?'<span>IDE '+nxE(o.UID)+'</span>':'')+(o.CREATED?'<span>'+nxSvg('cal')+'Créé le '+dfr(o.CREATED)+'</span>':'')+(st?'<span class="nx-tag num" data-ref="s:'+st.ID+'" style="cursor:pointer">Membre de l’équipe</span>':'')+'</div></div>'
      +'<div class="nx-acts"><button class="nx-btn'+(pin?' on':'')+'" data-fn="pin">'+nxSvg('pin')+(pin?'Épinglé':'Épingler')+'</button><button class="nx-btn" data-fn="adr">'+nxSvg('plus')+'Adresse</button><button class="nx-btn" data-go="adr-entites">'+nxSvg('contacts')+'Annuaire</button><button class="nx-btn pri" data-fn="edit">'+nxSvg('edit')+'Modifier</button></div></div>'
      +'<div class="nx-grid">'+nxCard('c5','Coordonnées','<div class="b flush">'+(adr||'<div class="nx-empty">Aucune adresse.</div>')+'</div>','<span class="n">'+cs.length+'</span>')
      +nxCard('c7','Projets',plist.length?'<div class="b flush">'+plist.map(x=>'<div class="nx-row" data-ref="p:'+x.p.ID+'"><span class="nx-tag num">'+nxE(x.p.NUMBER)+'</span><div class="t"><b>'+nxE(x.p.TITLE)+'</b><span>'+nxE([...x.r].join(', '))+'</span></div>'+nxStateTag(x.p)+'</div>').join('')+'</div>':'<div class="nx-empty">Intervenant d’aucun projet.</div>','<span class="n">'+plist.length+'</span>')
      +(props.length?nxCard('c5','Catégories','<div class="b" style="display:flex;flex-wrap:wrap;gap:6px">'+props.map(x=>'<span class="nx-tag">'+nxE(x)+'</span>').join('')+'</div>'):'')
      +((notes.length||o.REMARK)?nxCard('c7','Notes','<div class="b flush">'+(o.REMARK?'<div class="nx-row" style="cursor:default">'+nxSvg('info')+'<div class="t"><b>Remarque</b><span style="white-space:normal">'+nxE(o.REMARK)+'</span></div></div>':'')
        +notes.map(n=>'<div class="nx-row" style="cursor:default">'+nxSvg('doc')+'<div class="t"><b>'+nxE(n.SUBJECT||'Note')+'</b><span>'+nxE([n.OWNER,dfr(n.CHANGEDDATE),n.CONTENT].filter(Boolean).join(' · '))+'</span></div></div>').join('')+'</div>'):'')
      +'</div>';
    const pg=nxPage(m,html);
    Object.assign(pg._fn,{edit:()=>editOwner(o,o.TYPECODE),adr:()=>editContact(null,o),pin:b=>{ const on=nxTogglePin('c',o.ID); b.classList.toggle('on',on); b.innerHTML=nxSvg('pin')+(on?'Épinglé':'Épingler'); }}); },
  refresh(ts){ if(hit(ts,'contactowner','contact','projectmember','contact_property','contactnote')) go('nx-contact',VIEW.arg); }
};

/* ═══ Fiche membre de l'équipe ═══ */
VIEWS['nx-collab']={
  render(m,arg){ const s=DS.get('staff',arg); if(!s){ nxPage(m,'<div class="nx-empty">Membre introuvable.</div>'); return; }
    const name=staffName(s); VIEW.nxTitle=name; nxRecent('s',s.ID);
    const now=new Date(), y=now.getFullYear(), mo=now.getMonth(), logs=DS.by('timelog','STAFF_ID',s.ID);
    const months=MOIS.map((l,i)=>({l:MOISL[i]+' '+y,s:l.replace('.',''),a:0,b:0,t:nxTarget(s.ID,y,i)})), prj={};
    let yr=0, yrC=0; logs.forEach(r=>{ if(+r.TIMEYEAR!==y) return; const v=+r.TIMEPERIOD||0; yr+=v; if(+r.ISCHARGEABLE){ yrC+=v; months[+r.TIMEMONTH].a+=v; } else months[+r.TIMEMONTH].b+=v; prj[r.PROJECT_ID]=(prj[r.PROJECT_ID]||0)+v; });
    const mth=months[mo].a+months[mo].b, tM=months[mo].t, tY=months.slice(0,mo+1).reduce((a,x)=>a+x.t,0);
    const pl=Object.entries(prj).map(([id,v])=>({p:DS.get('project',id),v})).filter(x=>x.p).sort((a,b)=>b.v-a.v).slice(0,10), pmax=Math.max(1,...pl.map(x=>x.v));
    const c=DS.get('contact',s.PERSON_ID), o=c&&DS.get('contactowner',c.CONTACTOWNER_ID), rate=nxRate(s.ID,now), pin=nxPinned('s',s.ID);
    const html='<div class="nx-hero"><div class="ic">'+nxE(nxIni(name))+'</div><div class="tx"><h2>'+nxE(name)+'</h2><div class="meta">'+(s.INITIALS?'<span class="nx-tag num">'+nxE(s.INITIALS)+'</span>':'')
      +'<span class="nx-tag '+(+s.ISACTIVE?'s2':'s5')+'">'+(+s.ISACTIVE?'Actif':'Ancien membre')+'</span>'+(s.JOININGDATE?'<span>'+nxSvg('cal')+'Depuis le '+dfr(s.JOININGDATE)+(s.QUITTINGDATE?' · jusqu’au '+dfr(s.QUITTINGDATE):'')+'</span>':'')
      +(c&&c.EMAIL1?'<span>'+nxSvg('mail')+'<a href="mailto:'+nxE(c.EMAIL1)+'" style="color:inherit">'+nxE(c.EMAIL1)+'</a></span>':'')+'</div></div>'
      +'<div class="nx-acts"><button class="nx-btn'+(pin?' on':'')+'" data-fn="pin">'+nxSvg('pin')+(pin?'Épinglé':'Épingler')+'</button>'+(o?'<button class="nx-btn" data-ref="c:'+o.ID+'">'+nxSvg('contacts')+'Coordonnées</button>':'')
      +'<button class="nx-btn" data-go="h-rapport">'+nxSvg('analyse')+'Rapports</button><button class="nx-btn pri" data-go="h-saisie">'+nxSvg('timer')+'Feuille de temps</button></div></div>'
      +'<div class="nx-kpis">'+nxKpi('clock','Temps ce mois',nxH(mth)+'<small>/ '+nxH(tM)+' h</small>',MOISL[mo],tM?mth/tM*100:0)+nxKpi('cal','Temps '+y,nxH(yr)+'<small>/ '+nxH(tY)+' h</small>','objectif à fin '+MOISL[mo].toLowerCase(),tY?yr/tY*100:0)
      +nxKpi('trend','Part facturable '+y,(yr?Math.round(yrC/yr*100):0)+'<small>%</small>',nxH(yrC)+' h facturables',yr?yrC/yr*100:0)
      +nxKpi('cal','Solde de vacances',nxH(s.HOLIDAYBALANCE)+'<small>h</small>',s.HOLIDAYBALANCEYEAR?'au '+(s.HOLIDAYBALANCECHANGEDDATE?dfr(s.HOLIDAYBALANCECHANGEDDATE):s.HOLIDAYBALANCEYEAR):'')
      +(rate?nxKpi('coins','Taux horaire',num(rate,0)+'<small>CHF/h</small>','taux interne en vigueur'):'')+'</div>'
      +'<div class="nx-grid">'+nxCard('c8','Temps par mois '+y,'<div class="b">'+nxBars(months,{la:'facturable',lb:'non facturable'})+'</div><div class="nx-legend"><span><i style="background:#6c47ff"></i>Facturable</span><span><i style="background:#cfc4ff"></i>Non facturable</span><span><i style="background:#16181d;height:2px;vertical-align:3px"></i>Objectif</span></div>')
      +nxCard('c4','Projets '+y,pl.length?'<div class="b flush">'+pl.map(x=>'<div class="nx-row" data-ref="p:'+x.p.ID+'"><span class="nx-tag num">'+nxE(x.p.NUMBER)+'</span><div class="t"><b>'+nxE(x.p.TITLE)+'</b></div><span class="m">'+nxH(x.v)+' h</span></div>').join('')+'</div>':'<div class="nx-empty">Aucune saisie cette année.</div>')
      +'</div>';
    const pg=nxPage(m,html); pg._fn.pin=b=>{ const on=nxTogglePin('s',s.ID); b.classList.toggle('on',on); b.innerHTML=nxSvg('pin')+(on?'Épinglé':'Épingler'); }; },
  refresh(ts){ if(hit(ts,'staff','timelog','stafftargettime')) go('nx-collab',VIEW.arg); }
};

/* ═══ Données & sauvegarde ═══ */
VIEWS['nx-data']={
  render(m){ const li=DS.linfo||{}, n=t=>DS.all(t).length;
    const cmds=nxMenuCmds();
    const html='<div class="nx-hello"><div><h2>Données & sauvegarde</h2><p>Toutes les données sont dans ce navigateur (base locale, sans serveur). Exportez-les régulièrement.</p></div></div>'
      +'<div class="nx-kpis">'+nxKpi('folder','Projets',String(n('project')))+nxKpi('contacts','Contacts',String(n('contactowner')),n('contact')+' adresses')+nxKpi('clock','Saisies de temps',num(n('timelog'),0))+nxKpi('users','Membres',String(n('staff')))+'</div>'
      +'<div class="nx-grid">'+nxCard('c6','Sauvegarde','<div class="b"><p style="margin:0 0 12px;color:var(--nx-ink2)">L’export télécharge toute la base (projets, contacts, temps, chantier, finances, bibliothèque) dans un fichier <b>.json.gz</b>. L’import <b>remplace</b> la base de ce navigateur.</p>'
        +'<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="nx-btn pri" data-fn="exp">'+nxSvg('export')+'Exporter la base</button><button class="nx-btn" data-fn="imp">'+nxSvg('import')+'Importer une base</button></div></div>')
      +nxCard('c6','Origine de la base','<div class="b"><dl class="nx-dl"><dt>Source</dt><dd>'+nxE(li.source||'—')+'</dd><dt>Importée le</dt><dd>'+nxE(li.imported?dfr(li.imported.slice(0,10))+' '+li.imported.slice(11,16):'—')+'</dd><dt>Version</dt><dd>'+nxE(String(DS.seq))+'</dd></dl></div>')
      +(cmds.length?nxCard('c12','Outils','<div class="b" style="display:flex;flex-wrap:wrap;gap:8px">'+cmds.flatMap(g=>g.items.map((x,i)=>'<button class="nx-btn" data-fn="c'+g.t+i+'">'+nxE(x.t)+'</button>')).join('')+'</div>'):'')+'</div>';
    const pg=nxPage(m,html); pg._fn.exp=()=>lbExport(); pg._fn.imp=()=>lbImportDlg(false);
    cmds.forEach(g=>g.items.forEach((x,i)=>{ pg._fn['c'+g.t+i]=x.fn; })); }
};

/* ═══ Palette de commandes (⌘K) ═══ */
const PAL={on:false,items:[],sel:0};
function nxPalIndex(){ const it=[];
  NX_NAV.forEach(g=>{ if(g.v) it.push({g:'Écrans',t:g.t,s:'',ico:g.ico,run:()=>go(g.v),q:g.t}); (g.items||[]).filter(([id])=>nxCan(id)).forEach(([id,t])=>it.push({g:'Écrans',t,s:g.t,ico:g.ico,run:()=>go(id),q:t+' '+g.t+' '+(NX_KW[id]||'')})); });
  [['Nouveau projet','plus',()=>editProject()],['Nouveau contact — société','plus',()=>editOwner(null,0)],['Nouveau contact — personne','plus',()=>editOwner(null,1)],['Saisir mon temps','timer',()=>go('h-saisie')],
   ['Nouvelle dépense','receipt',()=>go('frais')],['Exporter la base','export',()=>lbExport()],['Importer une base','import',()=>lbImportDlg(false)],['Réduire / déployer le panneau latéral','side',()=>nxMini()],['Raccourcis clavier','cmd',nxKeysHelp]]
    .forEach(([t,ico,run])=>it.push({g:'Commandes',t,ico,run,q:t}));
  nxMenuCmds().forEach(m=>m.items.forEach(x=>it.push({g:'Commandes',t:x.t,s:m.t,ico:'cmd',run:x.fn,q:x.t+' '+m.t})));
  DS.all('project').forEach(p=>it.push({g:'Projets',t:p.TITLE||p.NUMBER,s:p.NUMBER,tag:projState(p),ico:'folder',run:()=>go('nx-projet',p.ID),q:(p.NUMBER||'')+' '+(p.TITLE||'')+' '+(p.LOCATION||''),w:+p.PROJECTSTATECODE===2?2:+p.PROJECTSTATECODE===5?0:1}));
  DS.all('staff').forEach(s=>it.push({g:'Équipe',t:staffName(s),s:s.INITIALS,ico:'users',run:()=>go('nx-collab',s.ID),q:staffName(s)+' '+(s.INITIALS||''),w:+s.ISACTIVE?2:0}));
  const loc={}; DS.all('contact').forEach(c=>{ if(!loc[c.CONTACTOWNER_ID]) loc[c.CONTACTOWNER_ID]=[c.LOCATION,c.EMAIL1].filter(Boolean).join(' '); });
  DS.all('contactowner').filter(o=>!+o.ISHIDDEN).forEach(o=>{ const n=ownerName(o); it.push({g:'Contacts',t:n,s:(loc[o.ID]||'').split(' ')[0],ico:o.TYPECODE===1?'person':'building',run:()=>go('nx-contact',o.ID),q:n+' '+(loc[o.ID]||''),w:1}); });
  it.forEach(x=>x.n=nxNorm(x.q)); return it; }
function nxPalSearch(q){ const qs=nxNorm(q).split(/\s+/).filter(Boolean);
  if(!qs.length){ const rec=nxLS.get('nx_recent',[]).map(nxRef).filter(Boolean).map(r=>({g:'Récents',t:r.t,s:r.tag||r.sub,ico:r.ico,run:()=>nxOpenRef(r.k+':'+r.id)}));
    return [...rec,...PAL.all.filter(x=>x.g==='Commandes').slice(0,5),...PAL.all.filter(x=>x.g==='Écrans').slice(0,8)]; }
  const out=[]; for(const x of PAL.all){ if(!qs.every(w=>x.n.includes(w))) continue; const t=nxNorm(x.t+' '+(x.s||''));
    const sc=(t.startsWith(qs[0])?40:0)+(nxNorm(x.s||'').startsWith(qs[0])?30:0)+(x.n.split(/\s+/).some(w=>w.startsWith(qs[0]))?15:0)+(x.w||0)*5+({Écrans:12,Commandes:8,Projets:6,Équipe:6,Contacts:0}[x.g]||0)-t.length/40;
    out.push([sc,x]); }
  out.sort((a,b)=>b[0]-a[0]); const per={}, res=[];
  out.forEach(([,x])=>{ per[x.g]=(per[x.g]||0)+1; if(per[x.g]<=(x.g==='Contacts'||x.g==='Projets'?8:6)) res.push(x); });
  const ord=['Récents','Écrans','Projets','Contacts','Équipe','Commandes']; return res.sort((a,b)=>ord.indexOf(a.g)-ord.indexOf(b.g)); }
function nxPalDraw(){ const box=document.getElementById('nx-pres'); let g='', s='';
  PAL.items.forEach((x,i)=>{ if(x.g!==g){ g=x.g; s+='<div class="nx-pg">'+nxE(g)+'</div>'; }
    s+='<div class="nx-po'+(i===PAL.sel?' on':'')+'" data-i="'+i+'"><span class="ic">'+nxSvg(x.ico)+'</span><span class="t">'+nxE(x.t)+(x.s?'<span>'+nxE(x.s)+'</span>':'')+'</span>'+(x.tag?'<span class="k">'+nxE(x.tag)+'</span>':'')+'</div>'; });
  box.innerHTML=s||'<div class="nx-empty">Aucun résultat.</div>'; const on=box.querySelector('.nx-po.on'); if(on) on.scrollIntoView({block:'nearest'}); }
function nxPal(){ const P=document.getElementById('nx-pal'); if(!NX.booted) return; closeMenus();
  PAL.all=nxPalIndex(); P.classList.add('on'); PAL.on=true; const i=document.getElementById('nx-pq'); i.value=''; PAL.items=nxPalSearch(''); PAL.sel=0; nxPalDraw(); setTimeout(()=>i.focus(),0); }
function nxPalClose(){ document.getElementById('nx-pal').classList.remove('on'); PAL.on=false; }
function nxPalRun(i){ const x=PAL.items[i]; if(!x) return; nxPalClose(); try{ x.run(); }catch(e){ console.error(e); toast('✗ '+(e.message||e),true); } }

/* ═══ Démarrage de la coquille ═══ */
(function(){
  const side=document.getElementById('nx-side');
  side.querySelector('.nx-brand').insertAdjacentHTML('afterbegin',NX_LOGO);
  side.querySelector('.nx-brand').onclick=()=>go('nx-home');
  document.getElementById('nx-qbtn').insertAdjacentHTML('afterbegin',nxSvg('search'));
  document.getElementById('nx-qbtn').onclick=()=>nxPal();
  document.getElementById('nx-nav').addEventListener('click',nxSideClick);
  const mb=document.getElementById('nx-minibtn'); mb.innerHTML=nxSvg('side'); mb.onclick=()=>nxMini();
  document.getElementById('nx-back').innerHTML=nxSvg('back'); document.getElementById('nx-fwd').innerHTML=nxSvg('fwd');
  document.getElementById('nx-back').onclick=()=>nxHist(-1); document.getElementById('nx-fwd').onclick=()=>nxHist(1);
  const nb=document.getElementById('nx-new'); nb.innerHTML=nxSvg('plus')+'Nouveau'; nb.onclick=()=>nxNewMenu(nb);
  const mo=document.getElementById('nx-more'); mo.innerHTML=nxSvg('more'); mo.onclick=()=>nxMoreMenu(mo);
  const bl=document.getElementById('boot-logo'); if(bl) bl.innerHTML=NX_LOGO;
  if(nxLS.get('nx_mini',false)) document.getElementById('app').classList.add('nx-mini');
  const pq=document.getElementById('nx-pq'), P=document.getElementById('nx-pal');
  pq.addEventListener('input',()=>{ PAL.items=nxPalSearch(pq.value); PAL.sel=0; nxPalDraw(); });
  pq.addEventListener('keydown',e=>{ if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); const n=PAL.items.length; if(n){ PAL.sel=(PAL.sel+(e.key==='ArrowDown'?1:-1)+n)%n; nxPalDraw(); } }
    else if(e.key==='Enter'){ e.preventDefault(); nxPalRun(PAL.sel); } else if(e.key==='Escape'){ e.preventDefault(); nxPalClose(); } });
  P.addEventListener('mousedown',e=>{ if(e.target===P) nxPalClose(); });
  document.getElementById('nx-pres').addEventListener('click',e=>{ const o=e.target.closest('.nx-po'); if(o) nxPalRun(+o.dataset.i); });
  document.getElementById('nx-pres').addEventListener('mousemove',e=>{ const o=e.target.closest('.nx-po'); if(o&&+o.dataset.i!==PAL.sel){ PAL.sel=+o.dataset.i; document.querySelectorAll('#nx-pres .nx-po').forEach((x,i)=>x.classList.toggle('on',i===PAL.sel)); } });
  document.addEventListener('keydown',e=>{ const mod=e.metaKey||e.ctrlKey, inField=e.target.closest&&e.target.closest('input,textarea,select,[contenteditable]');
    if(mod&&!e.altKey&&(e.key==='k'||e.key==='K')){ e.preventDefault(); e.stopPropagation(); PAL.on?nxPalClose():nxPal(); return; }
    if(PAL.on) return;
    if(mod&&e.key==='\\'){ e.preventDefault(); nxMini(); return; }
    if(e.altKey&&!mod&&(e.key==='ArrowLeft'||e.key==='ArrowRight')&&!inField&&!document.querySelector('.ov')){ e.preventDefault(); nxHist(e.key==='ArrowLeft'?-1:1); return; }
    if(e.key==='/'&&!mod&&!inField&&!document.querySelector('.ov')){ const se=document.getElementById('search'); e.preventDefault(); if(se&&!se.disabled) se.focus(); else nxPal(); } },true);
  /* état de la base : pied du panneau latéral (remplace la pastille de DeltaSub) */
  new MutationObserver(nxSubSync).observe(document.getElementById('tools'),{childList:true,subtree:true});
  const ok0=NET.ok; NET.ok=function(){ try{ ok0.apply(this,arguments); }catch(_){} nxFoot(); };
  const mq=matchMedia('(max-width: 1000px)'); const auto=()=>{ if(mq.matches) document.getElementById('app').classList.add('nx-mini'); else if(!nxLS.get('nx_mini',false)) document.getElementById('app').classList.remove('nx-mini'); };
  mq.addEventListener('change',auto); auto();
})();

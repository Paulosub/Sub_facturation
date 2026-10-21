
/* ═══ 22. Visuel de l'app (21.10.2026, demande de Paulo) ════════════════════════════════════════════════════════════════════════
   Deux visuels, choisis poste par poste : « Charte Substances » (le visuel actuel, par défaut, inchangé) et « Papier et encre »
   (version 3 des propositions de refonte, À L'ESSAI : Paulo choisira ensuite le visuel définitif). Choix gardé dans localStorage
   `sg3_visuel` ; attribut data-visuel="papier" sur <html> de la coquille ET du cadre Facturation (posé avant le premier affichage
   par le petit script VISUEL_SCRIPT de construire.py, puis tenu à jour ici) ; feuilles visuel_papier.css (coquille, moteur) et
   fx_visuel_papier.css (Facturation), dont toutes les règles sont limitées à cet attribut ; icônes au trait de la version 3
   (SG_NXI_PAPIER, mêmes noms que NXI) à la place de celles de la charte. Réglages ▸ Visuel de l'app (nx-visuel), bouton du pied
   du menu (bascule), ⌘K « Visuel : … ». Concaténé après sg3_plus.js par construire.py. */
NXI.visuel='<path d="M3 3H21V21H3Z"/><path d="M12 3V21"/><path d="M12 3H21V21H12Z" fill="currentColor" stroke="none"/>';
const SG_VISUELS=[['charte','Charte Substances','Le visuel actuel : menu bleu nuit, accents jaunes, Akkurat, filets noirs de 2 px.'],
  ['papier','Papier et encre','Version 3 des propositions de refonte : noir et blanc, filets fins, libellés en chasse fixe, une carte noire pour le chiffre clé, boutons en pilule, icônes au trait.']];
const SG_NXI_CHARTE=Object.assign({},NXI);
/* icônes de la version 3 : grille de 24, cercle de construction de 20, trait de 1,5, angles droits ou à 45° (planche « Système ») */
const SG_NXI_PAPIER=(()=>{ const ic={
    accueil:'<path d="M4 13L12 5L20 13"/><path d="M6 11V20"/><path d="M18 11V20"/>',
    projets:'<path d="M4 20V5H10L13 8H20"/><path d="M20 11V20H8"/>',
    heures:'<circle cx="12" cy="12" r="10"/><path d="M12 6V12H17"/>',
    minuteur:'<circle cx="12" cy="13" r="8"/><path d="M10 2H14"/><path d="M12 2V5"/><path d="M12 13L16 9"/>',
    contacts:'<circle cx="12" cy="8" r="4"/><path d="M3 21L8 16H16L21 21"/>',
    equipe:'<circle cx="7" cy="9" r="4"/><circle cx="17" cy="9" r="4"/><path d="M3 20H21"/>',
    chantier:'<path d="M7 21V5"/><path d="M3 6H21"/><path d="M7 12L13 6"/><path d="M18 6V11"/><path d="M3 21H11"/>',
    factures:'<path d="M5 3H19V21H5Z"/><path d="M9 8H15"/><path d="M9 12H15"/><path d="M9 16H13"/>',
    finances:'<path d="M5 19L19 5"/><path d="M9 5H19V15"/>',
    rh:'<path d="M4 4H20V20H4Z"/><circle cx="12" cy="10" r="3"/><path d="M8 17H16"/>',
    reglages:'<path d="M12 3V21"/><path d="M3 12H21"/><path d="M6 6L18 18"/><path d="M18 6L6 18"/>',
    rechercher:'<circle cx="10" cy="10" r="6"/><path d="M14 14L20 20"/>',
    creer:'<path d="M12 4V20"/><path d="M4 12H20"/>',
    pv:'<path d="M3 4H21V16H11L7 20V16H3Z"/>',
    documents:'<path d="M12 3L18 9L12 15L6 9Z"/><path d="M6 12L12 18L18 12"/><path d="M6 15L12 21L18 15"/>',
    coche:'<path d="M4 13L9 18L20 7"/>',
    gauche:'<path d="M15 5L8 12L15 19"/>', droite:'<path d="M9 5L16 12L9 19"/>',
    plus3:'<circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
    fleche:'<path d="M4 12H20"/><path d="M13 5L20 12L13 19"/>',
    page:'<path d="M6 3H15L19 7V21H6Z"/><path d="M15 3V7H19"/>',
    courriel:'<path d="M3 5H21V19H3Z"/><path d="M3 5L12 14L21 5"/>',
    envoyer:'<path d="M12 16V4"/><path d="M6 10L12 4L18 10"/><path d="M4 20H20"/>',
    recevoir:'<path d="M12 4V16"/><path d="M6 10L12 16L18 10"/><path d="M4 20H20"/>',
    filtre:'<path d="M3 6H21"/><path d="M6 12H18"/><path d="M9 18H15"/>',
    calendrier:'<path d="M3 5H21V21H3Z"/><path d="M3 9H21"/><path d="M8 3V7"/><path d="M16 3V7"/>',
    corbeille:'<path d="M4 7H20"/><path d="M6 7V21H18V7"/><path d="M9 3H15V7"/>',
    modifier:'<path d="M4 20H20"/><path d="M6 16L16 6L18 8L8 18Z"/>',
    favori:'<path d="M6 3H18V21L12 15L6 21Z"/>',
    imprimer:'<path d="M6 8V3H18V8"/><path d="M3 8H21V17H3Z"/><path d="M6 13H18V21H6Z"/>',
    telephone:'<path d="M5 3H10L12 9L9 12L12 15L15 12L21 14V19H16L5 8Z"/>',
    liste:'<path d="M4 6H20"/><path d="M4 12H20"/><path d="M4 18H20"/>',
    mallette:'<path d="M3 7H21V20H3Z"/><path d="M8 7V4H16V7"/><path d="M3 12H21"/>' };
  return { home:ic.accueil, folder:ic.projets, clock:ic.heures, timer:ic.minuteur, contacts:ic.contacts, person:ic.contacts, users:ic.equipe,
    group:ic.equipe, crane:ic.chantier, receipt:ic.factures, wallet:ic.finances, trend:ic.finances, rh:ic.rh, settings:ic.reglages, gear:ic.reglages,
    search:ic.rechercher, plus:ic.creer, pv:ic.pv, library:ic.documents, task:ic.coche, check:ic.coche, back:ic.gauche, prev:ic.gauche,
    fwd:ic.droite, next:ic.droite, more:ic.plus3, arrow:ic.fleche, pdf:ic.page, doc:ic.page, mail:ic.courriel, export:ic.envoyer,
    import:ic.recevoir, filter:ic.filtre, cal:ic.calendrier, trash:ic.corbeille, edit:ic.modifier, star:ic.favori, pin:ic.favori,
    print:ic.imprimer, phone:ic.telephone, list:ic.liste, briefcase:ic.mallette }; })();
function sgVisuel(){ const v=nxLS.get('sg3_visuel','charte'); return SG_VISUELS.some(x=>x[0]===v)?v:'charte'; }
function sgVisuelNom(v){ const x=SG_VISUELS.find(y=>y[0]===v); return x?x[1]:v; }
/* attribut du cadre Facturation (document à part, écrit par fxEnsure) */
function sgVisuelCadre(){ const f=document.getElementById('fx-frame'); try{ const e=f&&f.contentDocument&&f.contentDocument.documentElement; if(!e) return;
  if(sgVisuel()==='papier') e.setAttribute('data-visuel','papier'); else e.removeAttribute('data-visuel'); }catch(_){} }
/* jeu d'icônes du visuel + boutons de la coquille dessinés une seule fois au démarrage */
function sgVisuelIcones(){ const p=sgVisuel()==='papier'; Object.keys(SG_NXI_PAPIER).forEach(k=>{ NXI[k]=p?SG_NXI_PAPIER[k]:SG_NXI_CHARTE[k]; });
  const set=(id,ico,txt)=>{ const b=document.getElementById(id); if(b) b.innerHTML=nxSvg(ico)+(txt||''); };
  set('nx-back','back'); set('nx-fwd','fwd'); set('nx-new','plus','Créer'); set('nx-more','more'); set('nx-minibtn','side'); set('sg-visuel','visuel');
  const q=document.querySelector('#nx-qbtn>svg'); if(q) q.outerHTML=nxSvg('search');
  try{ if(typeof sgVerrouAff==='function') sgVerrouAff(); }catch(_){} }
function sgVisuelBouton(){ const b=document.getElementById('sg-visuel'); if(!b) return; const a=sgVisuel(), o=SG_VISUELS.find(x=>x[0]!==a);
  b.title='Visuel de l’app : '+sgVisuelNom(a)+' — passer à « '+o[1]+' »'; b.setAttribute('aria-label',b.title); }
function sgVisuelAppliquer(v,redessiner){ if(!SG_VISUELS.some(x=>x[0]===v)) v='charte'; nxLS.set('sg3_visuel',v);
  const e=document.documentElement; if(v==='papier') e.setAttribute('data-visuel','papier'); else e.removeAttribute('data-visuel');
  sgVisuelCadre(); sgVisuelIcones(); sgVisuelBouton();
  if(redessiner){ try{ sgSide(); }catch(_){} if(VIEW&&!/^fx-/.test(VIEW.id)) go(VIEW.id,VIEW.arg); } }
function sgVisuelBascule(){ const o=SG_VISUELS.find(x=>x[0]!==sgVisuel()); sgVisuelAppliquer(o[0],true); toast('Visuel : '+o[1]+'.'); }
/* aperçus des deux visuels (Réglages) : couleurs et polices propres à chacun, quel que soit le visuel en cours (variable --s-font locale) */
function sgVisuelApercu(k){
  if(k==='charte') return '<div aria-hidden="true" style="--s-font:\'SUB Akkurat\',Akkurat,Arial,sans-serif;display:flex;height:150px;border:1px solid #e3e3e0;background: #ffffff;overflow:hidden">'
    +'<div style="width:78px;background: #003346;padding:12px 9px;display:flex;flex-direction:column;gap:8px"><i style="display:block;height:7px;width:46px;background: #ffffff"></i><i style="display:block;height:5px;width:40px;background: rgba(255,255,255,.4);margin-top:6px"></i><i style="display:block;height:5px;width:50px;background: rgba(255,255,255,.4)"></i><i style="display:block;height:5px;width:36px;background: #fff266"></i><i style="display:block;height:5px;width:44px;background: rgba(255,255,255,.4)"></i></div>'
    +'<div style="flex:1;min-width:0;padding:11px 14px"><div style="font-size:9px;font-weight:700;color: #706f6f">Projets · Fiche projet</div><div style="font-size:14px;font-weight:700;color: #1d1d1b;margin:2px 0 8px">24ABC · Grange</div>'
    +'<div style="height:30px;background: #fef6b0;border-top:2px solid #1d1d1b;display:flex;align-items:center;padding:0 8px;gap:8px"><b style="font-size:13px;color: #003346">24ABC</b><i style="display:block;width:2px;height:16px;background: #1d1d1b"></i><span style="font-size:10px;font-weight:700;color: #1d1d1b">Transformation d’une grange</span></div>'
    +'<div style="display:flex;gap:12px;border-top:2px solid #1d1d1b;margin-top:10px;padding-top:6px"><div><div style="font-size:8.5px;font-weight:700;color: #1d1d1b">Heures saisies</div><div style="font-size:17px;font-weight:700;color: #1d1d1b">1\'842 h</div></div><div><div style="font-size:8.5px;font-weight:700;color: #1d1d1b">Phase actuelle</div><div style="font-size:13px;font-weight:700;color: #1d1d1b;margin-top:3px">Réalisation</div></div></div></div></div>';
  const mono='--s-font:\'Geist Mono\',Menlo,monospace;';
  return '<div aria-hidden="true" style="--s-font:Geist,\'Helvetica Neue\',Arial,sans-serif;display:flex;height:150px;border:1px solid #D9D7D0;background: #ffffff;overflow:hidden">'
    +'<div style="width:78px;border-right:1px solid #D9D7D0;padding:12px 9px;display:flex;flex-direction:column;gap:8px"><i style="display:block;height:7px;width:46px;background: #0B0B0B"></i><i style="display:block;height:5px;width:40px;background: #D9D7D0;margin-top:6px"></i><i style="display:block;height:5px;width:50px;background: #D9D7D0"></i><i style="display:block;height:12px;width:60px;background: #0B0B0B"></i><i style="display:block;height:5px;width:44px;background: #D9D7D0"></i></div>'
    +'<div style="flex:1;min-width:0;padding:11px 14px"><div style="'+mono+'font-size:8px;letter-spacing:.1em;color: #6E6C66">PROJETS · FICHE PROJET</div><div style="font-size:14px;font-weight:600;letter-spacing:-.02em;color: #0B0B0B;margin:2px 0 8px"><span style="'+mono+'font-weight:500">24ABC</span> · Grange</div>'
    +'<div style="height:20px;background: #0B0B0B;display:flex;align-items:center;gap:12px;padding:0 8px;'+mono+'font-size:7.5px;letter-spacing:.1em;color: #BDBBB4"><span style="color: #ffffff;border-bottom:1px solid #ffffff">VUE D’ENSEMBLE</span><span>CONTRAT</span><span>HEURES</span></div>'
    +'<div style="display:flex;gap:8px;margin-top:10px"><div style="flex:1;background: #0B0B0B;padding:6px 8px"><div style="'+mono+'font-size:7px;letter-spacing:.1em;color: #BDBBB4">HEURES SAISIES</div><div style="font-size:16px;font-weight:600;color: #ffffff">1’842 h</div></div><div style="flex:1;border:1px solid #D9D7D0;padding:6px 8px"><div style="'+mono+'font-size:7px;letter-spacing:.1em;color: #6E6C66">PHASE ACTUELLE</div><div style="font-size:12px;font-weight:600;color: #0B0B0B;margin-top:2px">Réalisation</div></div></div></div></div>'; }
/* Réglages ▸ Visuel de l'app : ouvert à tous les profils (c'est un réglage de ce poste) */
{ const R=SG_D.reglages; if(R&&!R.items.some(x=>x.v==='nx-visuel')){ const it={v:'nx-visuel',t:'Visuel de l’app',ico:'visuel',d:'Apparence de l’app sur ce poste : charte Substances ou Papier et encre (à l’essai).'};
    R.items.splice(1,0,it); NX_VIEW['nx-visuel']={d:R,t:it.t,it}; }
  SG_VUE_DROIT['nx-visuel']=()=>true; }
VIEWS['nx-visuel']={ render(m){ const v=sgVisuel();
  const carte=([k,n,d])=>nxCard('c6',nxE(n)+(k===v?' <span class="nx-tag s2" style="margin-left:8px">sur ce poste</span>':''),'<div class="b">'+sgVisuelApercu(k)
    +'<p style="margin:14px 0 16px;line-height:1.5">'+nxE(d)+'</p>'+(k===v?'<button class="nx-btn" disabled>Visuel utilisé</button>':'<button class="nx-btn pri" data-vis="'+k+'">'+nxSvg('visuel')+'Utiliser ce visuel</button>')+'</div>');
  nxPage(m,'<div class="sg-split">'+sgIntro('Réglages','Visuel de l’app','Choisissez l’apparence de SUBGestion sur ce poste. Seul l’affichage change : données, documents PDF et impressions restent les mêmes. Le choix vaut pour ce navigateur ; chaque poste choisit le sien.')
    +'<div><div class="nx-grid">'+SG_VISUELS.map(carte).join('')+'</div><p class="nx-empty" style="padding-top:20px">« Papier et encre » est à l’essai. Pour passer d’un visuel à l’autre : bouton '
    +'<span style="display:inline-flex;vertical-align:-3px;width:16px;height:16px">'+nxSvg('visuel')+'</span> du pied du menu, ou ⌘K « Visuel ».</p></div></div>');
  m.querySelectorAll('[data-vis]').forEach(b=>b.onclick=()=>{ sgVisuelAppliquer(b.dataset.vis,true); toast('Visuel : '+sgVisuelNom(b.dataset.vis)+'.'); }); } };
/* bouton du pied du menu, ⌘K, cadre Facturation, application au démarrage */
{ const mb=document.getElementById('nx-minibtn'); if(mb&&!document.getElementById('sg-visuel')){ const b=h('button',{class:'nx-ico-btn',id:'sg-visuel',onclick:()=>sgVisuelBascule()}); mb.before(b); }
  const fx0=fxEnsure; fxEnsure=function(){ const p=fx0.apply(this,arguments); p.then(()=>sgVisuelCadre()).catch(()=>{}); return p; };
  const pi0=nxPalIndex; nxPalIndex=function(){ const it=pi0.apply(this,arguments);
    SG_VISUELS.forEach(([k,n,d])=>{ const x={g:'Commandes',t:'Visuel : '+n+(k===sgVisuel()?' (actuel)':''),s:'Visuel de l’app',ico:'visuel',run:()=>{ sgVisuelAppliquer(k,true); toast('Visuel : '+n+'.'); },q:'visuel apparence theme graphisme '+n}; x.n=nxNorm(x.q); it.push(x); });
    return it; };
  sgVisuelAppliquer(sgVisuel(),false); }

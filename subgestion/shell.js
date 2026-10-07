/* ══ SUBGestion — coquille unique : Facturation + tous les modules DeltaSub ══════════════════════
   Ajouté à la fin de Facturation.html par subgestion/construire.py (ne pas modifier SUBGestion.html à la main).
   - Accueil réorganisé par domaines (Projets, Équipe, Finances, Système) ; un hub par domaine ;
   - modules Facturation : panneaux d'origine (goTab) ; modules DeltaSub : cadre #sg-ds-frame (document DeltaSub
     embarqué, compressé dans #sg-ds-src, chargé en arrière-plan) piloté par go(id) ;
   - en-tête noir : titre du domaine + onglets de ses modules ; Retour remonte au hub du domaine.
   Données : inchangées et partagées — localStorage sa_* (Facturation) et IndexedDB « DeltaSub ». */
const SG_ICO={
  affaires:'<path d="M5 10h22v16H5z"/><path d="M12 10V7a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3"/><path d="M5 17h22"/>',
  adresses:'<rect x="6" y="4" width="20" height="24" rx="2"/><path d="M6 10h20M12 16a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0M11 23c.8-2.6 7.2-2.6 8 0"/>',
  batiment:'<path d="M6 27V10l10-6 10 6v17"/><path d="M3.5 27h25"/><path d="M11 14h3M18 14h3M11 19h3M18 19h3M14 27v-4h4v4"/>',
  taches:'<rect x="6" y="5" width="20" height="22" rx="1.5"/><path d="M10 11l1.5 1.5L14 10M17 11.5h5M10 17l1.5 1.5L14 16M17 17.5h5M10 22.5h4M17 22.5h5"/>',
  collab:'<circle cx="12" cy="12" r="4"/><path d="M5 25c0-4 3.5-6.5 7-6.5s7 2.5 7 6.5"/><path d="M21 8.6a4 4 0 0 1 0 7.2"/><path d="M22.5 18.8c2.7.7 4.5 2.9 4.5 6.2"/>',
  heures:'<circle cx="16" cy="16" r="12"/><path d="M16 9v7l5 3"/>',
  frais:'<rect x="4" y="8" width="24" height="16" rx="1.5"/><circle cx="16" cy="16" r="3.5"/><path d="M8.5 12v8M23.5 12v8"/>',
  contrat:'<path d="M9 3.75h9l5 5V27a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1z"/><path d="M18 3.75V8.75H23"/><path d="M12.5 13.5h8M12.5 17h8M12.5 20.5h5"/>',
  nouveau:'<path d="M9 3.75h9l5 5V27a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1z"/><path d="M18 3.75V8.75H23"/><path d="M16 14v7M12.5 17.5h7"/>',
  facture:'<path d="M8.5 4h15v23l-2.5-1.7-2.5 1.7-2.5-1.7-2.5 1.7-2.5-1.7L8.5 27z"/><path d="M12 10.5h8M12 14.5h8M12 18.5h5"/>',
  saisie:'<path d="M21 5l4 4-13 13-5 1 1-5z"/><path d="M18.5 7.5l4 4"/>',
  management:'<path d="M5 27V5M5 27h22"/><path d="M10 22v-6M15 22V11M20 22v-8M25 22V8"/>',
  cockpit:'<path d="M5 23a11 11 0 0 1 22 0"/><path d="M16 12.5v2M7.5 16l1.5 1.4M24.5 16l-1.5 1.4"/><path d="M16 23l5.2-4.6"/><circle cx="16" cy="23" r="1.7"/>',
  tableur:'<rect x="5" y="6" width="22" height="20" rx="1.5"/><path d="M5 12h22M13 12v14M5 19h22"/>',
  modeles:'<path d="M16 5 28 11 16 17 4 11z"/><path d="M4 16l12 6 12-6"/><path d="M4 21l12 6 12-6"/>',
  admin:'<path d="M4 8.5h6M15 8.5h13M4 16h15M24 16h4M4 23.5h3M12 23.5h16"/><circle cx="12.5" cy="8.5" r="2.5"/><circle cx="21.5" cy="16" r="2.5"/><circle cx="9.5" cy="23.5" r="2.5"/>',
  donnees:'<path d="M11 7l-4 4 4 4"/><path d="M7 11h14a4 4 0 0 1 0 8h-1"/><path d="M21 25l4-4-4-4"/><path d="M25 21H11a4 4 0 0 1 0-8h1"/>',
  export:'<path d="M16 4v15M10.5 9.5 16 4l5.5 5.5"/><path d="M6 18v8h20v-8"/>',
  import:'<path d="M16 4v15M10.5 13.5 16 19l5.5-5.5"/><path d="M6 18v8h20v-8"/>',
  liste:'<rect x="5" y="6" width="22" height="20" rx="1.5"/><path d="M10 12h12M10 16h12M10 20h8"/>',
  courbe:'<path d="M5 27V9M5 27h22"/><path d="M10 22l5-6 4 3 7-9"/>',
  moi:'<circle cx="16" cy="11" r="5"/><path d="M7 27c0-5 4-8 9-8s9 3 9 8"/>',
  etoile:'<path d="M16 4.5l3.4 7 7.6 1.1-5.5 5.4 1.3 7.6L16 22l-6.8 3.6 1.3-7.6L5 12.6l7.6-1.1z"/>',
  groupe:'<circle cx="11" cy="12" r="3.5"/><circle cx="21" cy="12" r="3.5"/><path d="M4 25c0-3.5 3-5.5 7-5.5s7 2 7 5.5M14 25c0-3.5 3-5.5 7-5.5s7 2 7 5.5"/>',
  etiquette:'<path d="M4 5h11l13 13-10 10L5 15z"/><circle cx="10" cy="10.5" r="2"/>',
  chercher:'<circle cx="14" cy="14" r="8"/><path d="M20 20l7 7"/>',
  calendrier:'<rect x="5" y="7" width="22" height="20" rx="1.5"/><path d="M5 13h22M11 4v6M21 4v6"/><path d="M10 18h3M15 18h3M20 18h3M10 22h3M15 22h3"/>',
  urgent:'<circle cx="16" cy="16" r="12"/><path d="M16 9v9"/><path d="M16 22.2v.6"/>',
  encours:'<path d="M28 16A12 12 0 1 1 16 4"/><path d="M16 9v7l5 3"/>',
  regle:'<circle cx="16" cy="16" r="12"/><path d="M10.5 16.5l4 4 7-8"/>',
  estimation:'<path d="M5 23 23 5l4 4L9 27z"/><path d="M9 19l2 2M12 16l3 3M15 13l2 2M18 10l3 3"/>',
  devis:'<path d="M8 4h12l6 6v18a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M20 4v6h6"/><path d="M12 17h8M12 22h8"/>',
  soumission:'<rect x="4" y="8" width="24" height="17" rx="1.5"/><path d="M4 9.5l12 8 12-8"/>',
  pv:'<path d="M9 5h14a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><path d="M12 3v4M20 3v4"/><path d="M11 13h10M11 18h10M11 23h6"/>',
  image:'<rect x="4" y="6" width="24" height="20" rx="1.5"/><circle cx="11" cy="12.5" r="2.2"/><path d="M4 22l7-6 5 4 4-3 8 6"/>',
  rapport:'<path d="M8 4h12l4 4v20H8z"/><path d="M20 4v4h4"/><path d="M12 14h8M12 18h8M12 22h5"/>',
  genres:'<rect x="5" y="5" width="9" height="9" rx="1"/><rect x="18" y="5" width="9" height="9" rx="1"/><rect x="5" y="18" width="9" height="9" rx="1"/><rect x="18" y="18" width="9" height="9" rx="1"/>',
  mo:'<path d="M5 27V13l11-8 11 8v14"/><circle cx="16" cy="16" r="3.2"/><path d="M10.5 27c.6-3.6 2.8-5.5 5.5-5.5s4.9 1.9 5.5 5.5"/>'
};
/* Domaines (ordre de l'accueil) et modules. ds = vue DeltaSub (go), tab = panneau Facturation (goTab),
   fn = fonction Facturation, act = action SUBGestion ; views = autres panneaux rattachés à l'onglet ;
   tag = mention en coin (registre de données distinct). */
const SG_SECTIONS=['Projets','Équipe','Finances','Système'];
const SG_HUBS=[
  {k:'affaires',sec:'Projets',t:'Affaires',ico:'affaires',d:'Gestion des affaires, controlling et PV de chantier.',items:[
    {ds:'aff-gestion',t:'Gestion',ico:'affaires',d:'Fiches des affaires : données, intervenants, phases, honoraires, documents et séances.'},
    {ds:'aff-controlling',t:'Controlling',ico:'courbe',d:'Heures, coûts et honoraires par affaire : suivi et écarts.'},
    {ds:'aff-mes',t:'Mes affaires',ico:'moi',d:'Les affaires auxquelles vous participez et leurs contrôles des coûts.'},
    {ds:'aff-toutes',t:'Toutes les affaires',ico:'liste',d:'Liste complète des affaires du bureau.'},
    {tab:'pv-chantier',t:'PV de chantier',ico:'pv',d:'Procès-verbaux de chantier par affaire : rédaction, décisions, PDF.'}]},
  {k:'adresses',sec:'Projets',t:'Adresses',ico:'adresses',d:'Entités, adresses, favoris, groupes et propriétés.',items:[
    {ds:'adr-entites',t:'Entités',ico:'adresses',d:'Sociétés, personnes, familles… et leurs adresses.'},
    {ds:'adr-liste',t:'Liste des adresses',ico:'liste',d:'Toutes les adresses, triables et filtrables.'},
    {ds:'adr-favoris',t:'Mes favoris',ico:'etoile',d:'Vos adresses favorites.'},
    {ds:'adr-groupes',t:'Groupes d’adresses',ico:'groupe',d:'Listes d’adresses pour les envois et les étiquettes.'},
    {ds:'adr-props',t:'Propriétés',ico:'etiquette',d:'Propriétés et catégories attribuées aux adresses.'},
    {ds:'adr-chercher',t:'Chercher',ico:'chercher',d:'Recherche d’adresses multicritère.'},
    {tab:'carnet',t:'Carnet des PV',ico:'pv',tag:'Registre Facturation',d:'Carnet d’adresses utilisé par les PV de chantier (entreprises par CFC, MO).'}]},
  {k:'batiment',sec:'Projets',t:'Bâtiment',ico:'batiment',d:'Estimations eCCC, devis, soumissions et contrôle des coûts.',items:[
    {ds:'coplan',t:'Mes estimations eCCC',ico:'estimation',d:'Estimations du coût selon eCCC-Bât.'},
    {ds:'devis',t:'Mes devis',ico:'devis',d:'Devis descriptifs : positions, quantités et prix.'},
    {ds:'soum',t:'Mes soumissions',ico:'soumission',d:'Soumissions aux entreprises, offres et comparatifs.'},
    {ds:'coco',t:'Contrôle des coûts',ico:'courbe',d:'Budget, adjudications, avenants, factures et coût final prévisible.'},
    {tab:'controle-cout',t:'Contrôle du coût',ico:'courbe',tag:'Registre Facturation',d:'Suivi du coût de l’ouvrage par CFC (version Facturation).'},
    {tab:'devis',t:'Devis',ico:'devis',tag:'Registre Facturation',d:'Devis par affaire (version Facturation).'}]},
  {k:'taches',sec:'Projets',t:'Tâches',ico:'taches',d:'Tâches urgentes, en traitement et réglées.',items:[
    {ds:'taches-urgent',t:'Urgent',ico:'urgent',d:'Tâches à traiter en priorité.'},
    {ds:'taches-encours',t:'En traitement',ico:'encours',d:'Tâches en cours.'},
    {ds:'taches-regle',t:'Réglé',ico:'regle',d:'Tâches terminées.'}]},
  {k:'collaborateurs',sec:'Équipe',t:'Collaborateurs',ico:'collab',d:'Fiches des collaborateurs actuels et anciens.',items:[
    {ds:'collab-actuels',t:'Collaborateurs actuels',ico:'collab',d:'L’équipe actuelle du bureau.'},
    {ds:'collab-tous',t:'Tous les collaborateurs',ico:'groupe',d:'Collaborateurs actuels et anciens.'},
    {ds:'collab-anciens',t:'Anciens collaborateurs',ico:'liste',d:'Collaborateurs ayant quitté le bureau.'}]},
  {k:'heures',sec:'Équipe',t:'Heures',ico:'heures',d:'Saisie des heures, rapports et disponibilité.',items:[
    {ds:'h-saisie',t:'Saisie',ico:'heures',d:'Saisie des heures par affaire et par jour.'},
    {ds:'h-rapport',t:'Rapport',ico:'rapport',d:'Rapports hebdomadaires, mensuels, annuels et vacances.'},
    {ds:'h-dispo',t:'Disponibilité',ico:'calendrier',d:'Disponibilité des collaborateurs.'},
    {tab:'feuille-heures',t:'Feuille d’heures',ico:'saisie',tag:'Registre Facturation',d:'Saisie personnelle des heures (version Facturation).'},
    {tab:'rapport',t:'Rapport d’heures',ico:'rapport',tag:'Registre Facturation',d:'Rapports d’heures (version Facturation).'}]},
  {k:'frais',sec:'Équipe',t:'Notes de frais',ico:'frais',d:'Saisie et rapport des notes de frais.',items:[
    {ds:'frais',t:'Saisie',ico:'saisie',d:'Saisie des frais par collaborateur et par affaire.'},
    {ds:'frais-rapport',t:'Rapport',ico:'rapport',d:'Rapport des notes de frais.'}]},
  {k:'contrats',sec:'Finances',t:'Contrats',ico:'contrat',d:'Contrats d’honoraires et calcul selon SIA 102.',items:[
    {tab:'contrats',t:'Liste des contrats',ico:'liste',d:'Consulter, ouvrir et gérer les contrats existants.'},
    {fn:'newContratCalc',views:['calchono'],t:'Nouveau contrat',ico:'nouveau',d:'Créer un contrat et calculer les honoraires selon SIA 102.'},
    {ds:'mg-contrats',t:'Contrats des affaires',ico:'contrat',d:'Contrats honoraires des affaires (Management).'}]},
  {k:'factures',sec:'Finances',t:'Factures',ico:'facture',lock:1,d:'Établir, consulter et contrôler les factures.',items:[
    {tab:'factures',t:'Liste des factures',ico:'facture',d:'Consulter et gérer les factures établies.'},
    {tab:'saisie',t:'Saisie facture',ico:'saisie',d:'Établir une nouvelle facture à partir d’un contrat.'},
    {ds:'fact-controle',t:'Contrôle de factures',ico:'regle',d:'Contrôle des factures reçues des entreprises.'},
    {ds:'mg-factures',t:'Factures des affaires',ico:'liste',d:'Factures d’honoraires des affaires (Management).'}]},
  {k:'management',sec:'Finances',t:'Management',ico:'management',lock:1,d:'Genres d’affaires, heures, controlling, planification RH, reporting.',items:[
    {ds:'mg-genres',t:'Genres d’affaires',ico:'genres',d:'Genres d’affaires et leur paramétrage.'},
    {ds:'mg-heures',t:'Heures',ico:'heures',d:'Heures de tous les collaborateurs.'},
    {ds:'mg-controlling',t:'Controlling',ico:'courbe',d:'Controlling du bureau.'},
    {ds:'mg-contrats',t:'Contrats honoraires',ico:'contrat',d:'Contrats honoraires des affaires.'},
    {ds:'mg-planning',t:'Planification RH',ico:'calendrier',d:'Planification des ressources humaines.'},
    {ds:'mg-factures',t:'Factures',ico:'facture',d:'Factures d’honoraires, encaissements et QR.'},
    {ds:'mg-collab',t:'Collaborateurs',ico:'collab',d:'Gestion des collaborateurs : taux, objectifs, soldes.'},
    {ds:'mg-mo',t:'Maître d’ouvrage',ico:'mo',d:'Suivi par maître d’ouvrage.'},
    {ds:'mg-reporting',t:'Reporting',ico:'rapport',d:'Rapports de gestion.'}]},
  {k:'cockpit',sec:'Finances',t:'Cockpit',ico:'cockpit',lock:1,d:'Tableaux de bord et suivi.',items:[
    {tab:'cockpit',t:'Cockpit Excel',ico:'tableur',d:'Tableau de bord et suivi au format tableur.'},
    {tab:'cockpit2',t:'Cockpit Claude',ico:'cockpit',d:'Tableau de bord et analyses assistées.'}]},
  {k:'modeles',sec:'Système',t:'Modèles',ico:'modeles',d:'Images, arrière-plans et modèles d’adresses, d’affaires, de documents…',items:[
    {ds:'tpl-images',t:'Images',ico:'image',d:'Images utilisées dans les documents.'},
    {ds:'tpl-backgrounds',t:'Arrière-plans',ico:'image',d:'Arrière-plans des documents imprimés.'},
    {ds:'tpl-addressTemplates',t:'Modèles d’adresses',ico:'adresses',d:'Mise en forme des adresses.'},
    {ds:'tpl-labelTemplates',t:'Modèles d’étiquettes',ico:'etiquette',d:'Planches d’étiquettes.'},
    {ds:'tpl-projectTemplates',t:'Modèles d’affaires',ico:'affaires',d:'Modèles pour créer des affaires.'},
    {ds:'tpl-staffTemplates',t:'Modèles de collaborateurs',ico:'collab',d:'Modèles pour créer des collaborateurs.'},
    {ds:'tpl-expensesTemplates',t:'Modèles de frais',ico:'frais',d:'Types de frais.'},
    {ds:'tpl-timeTemplates',t:'Modèles de temps de travail',ico:'heures',d:'Horaires et temps de travail.'},
    {ds:'tpl-managementTemplates',t:'Modèles de management',ico:'management',d:'Modèles de management.'},
    {ds:'tpl-documents',t:'Modèles de documents',ico:'devis',d:'Modèles de lettres, factures et documents.'}]},
  {k:'admin',sec:'Système',t:'Admin',ico:'admin',lock:1,hub:'hub-admin',d:'Registres Facturation : affaires, collaborateurs, heures, import Deltaproject, analyse globale.'},
  {k:'donnees',sec:'Système',t:'Import / Export',ico:'donnees',lock:1,d:'Sauvegardes : données Facturation et base DeltaSub.',items:[
    {tab:'backup',t:'Sauvegarde Facturation',ico:'donnees',d:'Contrats, factures et registres Facturation : export, import, sauvegarde automatique.'},
    {act:'sgDsExport',t:'Exporter la base DeltaSub',ico:'export',d:'Télécharge toute la base DeltaSub (.json.gz) — affaires, adresses, heures, bâtiment…'},
    {act:'sgDsImport',t:'Importer une base DeltaSub',ico:'import',d:'Remplace la base DeltaSub de ce navigateur par un fichier .json.gz.'}]}
];
const SG_HUB={}, SG_DS={}, SG_TAB={};
SG_HUBS.forEach(hb=>{ SG_HUB[hb.k]=hb; (hb.items||[]).forEach((it,i)=>{
  if(it.ds) (SG_DS[it.ds]=SG_DS[it.ds]||[]).push(hb.k);
  [it.tab,...(it.views||[])].filter(Boolean).forEach(v=>{ if(!SG_TAB[v]) SG_TAB[v]={hub:hb.k,i}; }); }); });
const SG={dsCur:null, dsHub:null, dsShown:null, dsBooted:false, dsP:null};
try{ SG.dsHub=localStorage.getItem('sg_ds_hub'); }catch(_){}

const sgEsc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sgSvg=k=>'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+(SG_ICO[k]||SG_ICO.liste)+'</svg>';
function sgCard(onclick,ico,t,d,corner,extra){
  return '<div class="home-card'+(corner&&corner.lock?' locked':'')+'" onclick="'+onclick+'">'
    +(corner?'<span class="'+(corner.lock?'lock':'tag')+'">'+sgEsc(corner.t)+'</span>':'')
    +'<div class="ico">'+sgSvg(ico)+'</div><div class="ct">'+sgEsc(t)+'</div><div class="cd">'+sgEsc(d)+'</div>'+(extra||'')+'</div>'; }

/* ── Accueil : un bloc par domaine ── */
function sgBuildHome(){
  const home=document.getElementById('panel-home'); if(!home) return;
  const t=home.querySelector('.home-title'); if(t) t.textContent='SUBGestion';
  const s=home.querySelector('.home-sub'); if(s) s.textContent='Substances Architectes Sàrl — affaires, adresses, bâtiment, heures, contrats, factures et gestion du bureau';
  const g=home.querySelector('.home-grid'); if(!g) return;
  const html=SG_SECTIONS.map(sec=>'<div class="sg-sec"><div class="sg-sec-t">'+sgEsc(sec)+'</div><div class="home-grid">'
    +SG_HUBS.filter(hb=>hb.sec===sec).map(hb=>sgCard("sgOpenHub('"+hb.k+"')",hb.ico,hb.t,hb.d,hb.lock?{lock:1,t:'Réservé'}:null,
      hb.items?'<div class="cn">'+sgEsc(hb.items.map(i=>i.t).join(' · '))+'</div>':'')).join('')+'</div></div>').join('');
  const wrap=document.createElement('div'); wrap.id='sg-home'; wrap.innerHTML=html; g.replaceWith(wrap);
  const f=home.querySelector('.home-foot');
  if(f) f.textContent='SUBGestion réunit Facturation et DeltaSub dans une seule app ; les sections « Réservé » seront protégées par mot de passe (protection prête, non encore activée). Données de ce navigateur : Facturation (contrats, factures) et base DeltaSub — sauvegardes dans Import / Export.';
}
/* ── Hubs (un panneau par domaine) ── */
function sgBuildHubs(){
  const after=document.getElementById('panel-home'); if(!after) return;
  let ref=after;
  SG_HUBS.filter(hb=>hb.items).forEach(hb=>{
    const p=document.createElement('div'); p.className='panel'; p.id='panel-sg-'+hb.k;
    p.innerHTML='<div class="home-wrap"><div class="home-title" style="margin-top:56px">'+sgEsc(hb.t)+'</div><div class="home-sub">'+sgEsc(hb.d)+'</div><div class="home-grid">'
      +hb.items.map((it,i)=>sgCard("sgItem('"+hb.k+"',"+i+")",it.ico,it.t,it.d,it.tag?{t:it.tag}:null)).join('')+'</div></div>';
    ref.after(p); ref=p;
    VIEW_PARENT['sg-'+hb.k]='home'; VIEW_TITLE['sg-'+hb.k]=hb.t;
    hb.items.forEach(it=>{ if(it.tab) VIEW_PARENT[it.tab]='sg-'+hb.k; });
  });
  const ds=document.createElement('div'); ds.className='panel'; ds.id='panel-ds'; ref.after(ds);
  VIEW_PARENT['hub-admin']='home';
}
/* ── En-tête : onglets du domaine + nom de l'app ── */
function sgBuildHeader(){
  const t=document.getElementById('hdr-title'); if(!t) return;
  const nav=document.createElement('nav'); nav.id='sg-tabs'; t.after(nav);
  const a=document.createElement('span'); a.id='sg-app'; a.textContent='SUBGestion';
  const r=document.getElementById('hdr-right'); if(r) r.before(a); else t.parentNode.append(a);
}
/* domaine et onglet de la vue courante */
function sgCtx(){
  if(currentView==='ds'){ const hs=SG_DS[SG.dsCur]||[], hub=hs.includes(SG.dsHub)?SG.dsHub:(hs[0]||SG.dsHub);
    const hb=SG_HUB[hub]; return hb?{hub,i:hb.items.findIndex(x=>x.ds===SG.dsCur)}:null; }
  let v=currentView;
  for(let n=0;v&&v!=='home'&&n<8;n++){ if(SG_TAB[v]) return {hub:SG_TAB[v].hub,i:v===currentView?SG_TAB[v].i:-1};
    if(/^sg-/.test(v)) return {hub:v.slice(3),i:-1,isHub:v===currentView}; v=VIEW_PARENT[v]; }
  return null; }
function sgSyncHeader(){
  const nav=document.getElementById('sg-tabs'); if(!nav) return;
  const c=sgCtx(), hb=c&&SG_HUB[c.hub];
  if(!hb||!hb.items||c.isHub){ nav.classList.remove('on'); nav.innerHTML=''; return; }
  if(c.i<0&&currentView!=='ds'){ const m=SG_TAB[currentView]; if(m) c.i=m.i; }
  nav.innerHTML=hb.items.map((it,i)=>'<button class="tab-btn'+(i===c.i?' on':'')+'" onclick="sgItem(\''+hb.k+'\','+i+')">'+sgEsc(it.t)+'</button>').join('');
  nav.classList.add('on');
  const t=document.getElementById('hdr-title'); if(t) t.textContent=hb.t;
  const on=nav.querySelector('.on'); if(on) on.scrollIntoView({block:'nearest',inline:'nearest'});
}

/* ── Navigation ── */
function sgOpenHub(k){
  const hb=SG_HUB[k]; if(!hb) return;
  if(hb.lock&&typeof requireAccess==='function'&&!requireAccess(k)) return;
  if(hb.hub){ goTab(hb.hub); return; }
  goTab('sg-'+k);
}
function sgItem(k,i){
  const hb=SG_HUB[k], it=hb&&hb.items&&hb.items[i]; if(!it) return;
  if(it.ds) return sgOpenDs(it.ds,k);
  if(it.tab) return goTab(it.tab);
  if(it.fn&&typeof window[it.fn]==='function') return window[it.fn]();
  if(it.act&&typeof window[it.act]==='function') return window[it.act]();
}
const sgGoTab0=goTab, sgGoBack0=goBack;
goTab=function(name,opts){
  if(name==='ds'){ let id=null; try{ id=localStorage.getItem('ds_view'); }catch(_){} return sgOpenDs(id||'aff-gestion'); }
  if(SG.dsBooted){ const w=sgDsWin(); try{ if(w&&typeof w.closeMenus==='function') w.closeMenus(); }catch(_){} }
  const r=sgGoTab0(name,opts); sgSyncHeader(); return r; };
goBack=function(){
  if(currentView==='ds'){ const c=sgCtx(); goTab(c?'sg-'+c.hub:'home'); return; }
  return sgGoBack0(); };

/* ── Modules DeltaSub : document embarqué dans le cadre ── */
function sgOpenDs(id,hub){
  SG.dsCur=id; if(hub) SG.dsHub=hub; else if(!(SG_DS[id]||[]).includes(SG.dsHub)) SG.dsHub=(SG_DS[id]||[])[0]||SG.dsHub;
  try{ localStorage.setItem('ds_view',id); if(SG.dsHub) localStorage.setItem('sg_ds_hub',SG.dsHub); }catch(_){}
  sgGoTab0('ds'); sgSyncHeader();
  sgDsEnsure().then(w=>{ if(SG.dsBooted&&SG.dsShown!==id&&w&&typeof w.go==='function') w.go(id); }).catch(e=>{ console.error(e); toast('✗ Modules DeltaSub : '+(e&&e.message||e),true); });
}
/* appelé par le cadre à chaque navigation DeltaSub (y compris le démarrage) */
function sgDsOnGo(id){
  const first=!SG.dsBooted; SG.dsBooted=true; SG.dsShown=id;
  if(first&&SG._bootRes) SG._bootRes();
  if(currentView!=='ds') return;
  if(first&&SG.dsCur&&SG.dsCur!==id){ const w=sgDsWin(); if(w) return void setTimeout(()=>w.go(SG.dsCur),0); }
  SG.dsCur=id; if(!(SG_DS[id]||[]).includes(SG.dsHub)&&SG_DS[id]) SG.dsHub=SG_DS[id][0];
  try{ if(SG.dsHub) localStorage.setItem('sg_ds_hub',SG.dsHub); }catch(_){}
  sgSyncHeader(); if(typeof uiSaveState==='function') uiSaveState();
}
function sgDsWin(){ const f=document.getElementById('sg-ds-frame'); return f&&f.contentWindow; }
function sgDsEnsure(){
  if(SG.dsP) return SG.dsP;
  SG.dsBooted=false; SG.dsShown=null; SG.booted=new Promise(r=>SG._bootRes=r);
  SG.dsP=(async()=>{
    const src=document.getElementById('sg-ds-src'); if(!src) throw new Error('modules DeltaSub absents de ce fichier');
    const b=atob(src.textContent.replace(/\s+/g,'')), u=new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i);
    const html=await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    const p=document.getElementById('panel-ds'); let f=document.getElementById('sg-ds-frame'); if(f) f.remove();
    f=document.createElement('iframe'); f.id='sg-ds-frame'; f.title='Modules DeltaSub'; p.append(f);
    const d=f.contentDocument; d.open(); d.write(html); d.close();
    return f.contentWindow; })();
  SG.dsP.catch(()=>{ SG.dsP=null; });
  return SG.dsP;
}
/* rechargement du cadre (après un import de base, demandé par DeltaSub au lieu de location.reload) */
function sgDsReload(){ SG.dsP=null; sgDsEnsure().catch(e=>console.error(e)); }
function sgDsWaitBoot(ms){ return Promise.race([SG.booted,new Promise((_,no)=>setTimeout(()=>no(new Error('base DeltaSub vide ou encore en chargement')),ms||30000))]); }
async function sgDsExport(){
  try{ const w=await sgDsEnsure(); toast('Préparation de l’export de la base DeltaSub…'); await sgDsWaitBoot();
    await w.lbExport(); toast('Base DeltaSub exportée (fichier deltasub_base_….json.gz dans Téléchargements).'); }
  catch(e){ console.error(e); toast('✗ Export impossible : '+(e&&e.message||e),true); } }
function sgDsImport(){
  const inp=document.createElement('input'); inp.type='file'; inp.accept='.gz,.json,application/gzip,application/json';
  inp.onchange=()=>{ const f=inp.files&&inp.files[0]; if(!f) return;
    chConfirm('Importer « '+f.name+' » ?\n\nLa base DeltaSub de ce navigateur (affaires, adresses, heures, frais, bâtiment, management…) sera REMPLACÉE. Exportez-la d’abord si vous voulez la garder.\n\nLes données Facturation (contrats, factures) ne sont pas touchées.',
      async()=>{ try{ const w=await sgDsEnsure(); toast('Import de la base DeltaSub…');
          const n=await w.lbImport(f,k=>toast('Import… '+k+' enregistrements')); toast(n+' enregistrements importés.'); sgDsReload(); }
        catch(e){ console.error(e); toast('✗ Import impossible : '+(e&&e.message||e),true); } },
      {title:'Importer une base DeltaSub',yesText:'Remplacer la base',yesColor:'#b04a4a'}); };
  inp.click(); }

/* ── Démarrage ── */
document.title='SUBGestion — Substances Architectes';
(function(){ const ico=document.createElement('link'); ico.rel='icon';
  ico.href='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#003346"/><path d="M9 21.5c1.4 1.4 3.4 2 5.4 2 3 0 5-1.5 5-3.8 0-5-9.7-2.8-9.7-7.6 0-2 1.8-3.6 4.6-3.6 1.8 0 3.4.6 4.5 1.6" fill="none" stroke="#FFF266" stroke-width="2.4" stroke-linecap="round"/></svg>');
  document.head.appendChild(ico); })();
sgBuildHome(); sgBuildHubs(); sgBuildHeader();
/* modules DeltaSub préparés en arrière-plan : la première ouverture est immédiate */
window.addEventListener('load',()=>setTimeout(()=>{ if(!SG.dsP) sgDsEnsure().catch(e=>console.error(e)); },1500));

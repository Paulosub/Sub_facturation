/* ══ SUBGestion 3 — améliorations 1 à 10 (06.10.2026) ═══════════════════════════════════════════════════
   Concaténé après sg3.js par construire.py (même script). Chaque bloc est indépendant et numéroté comme la liste
   proposée à Paulo : 1 sauvegarde automatique · 2 un seul registre · 3 fiche projet = pilotage · 4 rentabilité ·
   5 à traiter · 6 fichiers joints et PDF · 7 saisie de temps rapide · 8 libellés et icônes · 9 accès protégé ·
   10 PV sur tablette. */

/* ── Petite base IndexedDB propre à SUBGestion (réglages, fichiers joints) — distincte de la base « DeltaSub » ── */
const SGDB={ db:null,
  open(){ if(this.db) return Promise.resolve(this.db);
    return new Promise((res,rej)=>{ const r=indexedDB.open('SUBGestion',1);
      r.onupgradeneeded=()=>{ const d=r.result; if(!d.objectStoreNames.contains('reglages')) d.createObjectStore('reglages'); if(!d.objectStoreNames.contains('fichiers')) d.createObjectStore('fichiers',{keyPath:'sha'}); };
      r.onsuccess=()=>{ this.db=r.result; res(this.db); }; r.onerror=()=>rej(r.error||new Error('stockage local indisponible')); }); },
  async get(st,k){ const d=await this.open(); return new Promise((res,rej)=>{ const q=d.transaction(st).objectStore(st).get(k); q.onsuccess=()=>res(q.result); q.onerror=()=>rej(q.error); }); },
  async put(st,v,k){ const d=await this.open(); return new Promise((res,rej)=>{ const tx=d.transaction(st,'readwrite'); if(k===undefined) tx.objectStore(st).put(v); else tx.objectStore(st).put(v,k); tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error); }); },
  async cles(st){ const d=await this.open(); return new Promise((res,rej)=>{ const q=d.transaction(st).objectStore(st).getAllKeys(); q.onsuccess=()=>res(q.result); q.onerror=()=>rej(q.error); }); }
};
const SG_SRV='http://127.0.0.1:7788';
const sgHorodatage=(d=new Date())=>{ const z=n=>String(n).padStart(2,'0'); return d.getFullYear()+z(d.getMonth()+1)+z(d.getDate())+'_'+z(d.getHours())+z(d.getMinutes()); };
const sgDepuis=t=>{ if(!t) return 'jamais'; const m=Math.round((Date.now()-t)/60000); return m<1?'à l’instant':m<60?'il y a '+m+' min':m<1440?'il y a '+Math.round(m/60)+' h':'il y a '+Math.round(m/1440)+' j'; };

/* ═══ 1. SAUVEGARDE AUTOMATIQUE DE LA BASE DE GESTION ═══════════════════════════════════════════════════
   Après chaque modification (2 min sans nouvelle saisie), à l'ouverture si la dernière date de plus de 12 h, puis toutes les
   30 min s'il reste des modifications. Destination : serveur de sauvegarde (fact_backup_server.py, « Sauvegarde Gestion »,
   rotation 48 h / 60 jours / mensuelle) ; sans serveur : dossier choisi une fois (Chrome) ; sinon rappel dans « À traiter ».
   21.10.2026 : « Sauvegarde en échec » (dernière tentative ratée — aucune destination, refus, erreur — et modifications en attente,
   sgSauvEchec) en rouge au pied du menu (clic : Réglages ▸ Données) et dans À traiter ; nouvel essai toutes les 5 min tant que
   l'échec dure, et dès que Chrome rend l'accès au dossier choisi ; destination vérifiée avant de préparer la copie. */
const SAUV={etat:nxLS.get('sg3_sauvegarde',{}), t:null, enCours:false, srv:null};
async function sgSrv(force){ if(SAUV.srv&&!force&&Date.now()-SAUV.srv.t<60000) return SAUV.srv.ok;
  try{ const r=await fetch(SG_SRV+'/ping',{cache:'no-store'}); const d=await r.json(); SAUV.srv={ok:!!(d.ok&&d.gestion),pdf:!!d.pdf,t:Date.now(),d}; }
  catch(_){ SAUV.srv={ok:false,t:Date.now()}; }
  return SAUV.srv.ok; }
async function sgBaseBlob(){ const parts=['{"format":"deltasub-base","version":1,"source":"SUBGestion (sauvegarde)","exported":'+JSON.stringify(new Date().toISOString().slice(0,19))+',"seq":'+DS.seq+',"ids":'+JSON.stringify(DS.ids)+',"tables":{'];
  let first=true, n=0;
  for(const t of [...DS.tables].sort()){ const rows=await LDB.table(t); if(!rows.length) continue;
    parts.push((first?'':',')+JSON.stringify(t)+':{'+rows.map(r=>JSON.stringify(r.id)+':{"s":'+(r.s||0)+',"v":'+JSON.stringify(r.v)+'}').join(',')+'}'); first=false; n+=rows.length; }
  parts.push('}}');
  return {gz:await new Response(new Blob(parts,{type:'application/json'}).stream().pipeThrough(new CompressionStream('gzip'))).blob(), n}; }
async function sgDossierSauv(){ try{ return await SGDB.get('reglages','dossierSauvegarde'); }catch(_){ return null; } }
async function sgSauver(manuel){
  if(SAUV.enCours) return false; SAUV.enCours=true; sgSauvAff('en cours');
  try{ const nom='deltasub_base_'+sgHorodatage()+'.json.gz'; let etat=null;
    /* destination cherchée AVANT de préparer la copie (21.10.2026) : sans destination, un essai automatique ne coûte qu'un appel */
    const srv=await sgSrv(true), hd=srv?null:await sgDossierSauv(), dir=!!hd&&(await hd.queryPermission({mode:'readwrite'}))==='granted';
    if(!srv&&!dir&&!manuel){ SAUV.etat=Object.assign({},SAUV.etat,{erreur:'Aucune destination : lancez le serveur de sauvegarde ou choisissez un dossier.',essai:Date.now()}); nxLS.set('sg3_sauvegarde',SAUV.etat); return false; }
    const {gz,n}=await sgBaseBlob();
    if(srv){ const r=await fetch(SG_SRV+'/gestion/sauver',{method:'POST',headers:{'Content-Type':'application/gzip'},body:gz}), d=await r.json();
      if(!d.ok) throw new Error(d.error||'refus du serveur');
      etat={ou:'serveur',lieu:d.dossier,nom:d.nom}; }
    else if(dir){
      const fh=await hd.getFileHandle(nom,{create:true}), w=await fh.createWritable(); await w.write(gz); await w.close();
      const noms=[]; for await (const [k] of hd.entries()) if(/^deltasub_base_\d{8}_\d{4}\.json\.gz$/.test(k)) noms.push(k);
      noms.sort().reverse().slice(40).forEach(k=>hd.removeEntry(k).catch(()=>{}));   // les 40 plus récentes
      etat={ou:'dossier',lieu:hd.name,nom}; }
    else { const a=h('a',{href:URL.createObjectURL(gz),download:nom}); document.body.append(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },2000);
      etat={ou:'téléchargement',lieu:'Téléchargements',nom}; }
    SAUV.etat=Object.assign(etat,{quand:Date.now(),taille:gz.size,n,seq:DS.seq,erreur:null}); nxLS.set('sg3_sauvegarde',SAUV.etat);
    if(manuel) toast('Base sauvegardée ('+num(n,0)+' enregistrements) : '+(etat.ou==='serveur'?'Sauvegarde Gestion':etat.lieu)+'.');
    return true; }
  catch(e){ console.error(e); SAUV.etat=Object.assign({},SAUV.etat,{erreur:e.message||String(e),essai:Date.now()}); nxLS.set('sg3_sauvegarde',SAUV.etat);
    if(manuel) toast('✗ Sauvegarde impossible : '+(e.message||e),true); return false; }
  finally{ SAUV.enCours=false; sgSauvAff(); } }
const sgSauvAJour=()=>SAUV.etat.quand&&SAUV.etat.seq===DS.seq;
/* échec : la dernière tentative a échoué et des modifications attendent (jamais pour la base du bureau, sauvegardée par le NAS) */
const sgSauvEchec=()=>!(typeof dsEstBureau==='function'&&dsEstBureau())&&!!SAUV.etat.erreur&&!sgSauvAJour();
function sgSauvPlanifier(){ clearTimeout(SAUV.t); SAUV.t=setTimeout(()=>{ if(!sgSauvAJour()) sgSauver(false); },120000); sgSauvAff(); }
function sgSauvAff(enCours){ const f=document.querySelector('#nx-who .who span'); if(!f) return;
  if(typeof dsEstBureau==='function'&&dsEstBureau()){ f.textContent='Base du bureau (NAS)'; f.className=''; f.title='Sauvegardes faites par le serveur du bureau (toutes les heures) et par Hyper Backup.'; return; }
  const e=SAUV.etat, vieux=!e.quand||Date.now()-e.quand>48*3600e3, ko=!enCours&&sgSauvEchec();
  f.textContent=enCours?'Sauvegarde…':ko?'Sauvegarde en échec':(e.quand?(sgSauvAJour()?'Sauvegardée ':'Modifiée · sauvée ')+sgDepuis(e.quand):'Jamais sauvegardée');
  f.className=ko?'echec':vieux?'alerte':'';
  f.title=ko?'Sauvegarde automatique en échec : '+e.erreur+'\n'+(e.quand?'Dernière sauvegarde réussie : '+new Date(e.quand).toLocaleString('fr-CH')+(e.lieu?' — '+e.lieu:''):'Aucune sauvegarde réussie')+'\nCliquer : Réglages ▸ Données & sauvegarde'
    :e.quand?'Dernière sauvegarde : '+new Date(e.quand).toLocaleString('fr-CH')+(e.lieu?' — '+e.lieu:''):'';
  f.onclick=ko?()=>go('nx-data'):null;
  const w=document.getElementById('nx-who'); if(w) w.classList.toggle('sg-echec',ko);
  /* passage en échec ou retour à la normale : « À traiter » (pastille du menu, carte de l'accueil) mis à jour tout de suite */
  if(!enCours&&ko!==!!SAUV.ko){ SAUV.ko=ko;
    if(NX.booted) sgATraiter().then(A=>{ const at=document.getElementById('sg-at'); if(at) at.innerHTML=sgATraiterHtml(A); }).catch(()=>{}); } }
async function sgChoisirDossier(){ if(!window.showDirectoryPicker){ sgAlert('Le choix d’un dossier demande Google Chrome (ou Edge, Brave, Arc).'); return; }
  try{ const hd=await showDirectoryPicker({id:'sg-sauvegarde',mode:'readwrite'}); await SGDB.put('reglages',hd,'dossierSauvegarde'); toast('Dossier de sauvegarde : '+hd.name+'.'); await sgSauver(true); if(VIEW&&VIEW.id==='nx-data') go('nx-data'); }
  catch(e){ if(e&&e.name!=='AbortError') toast('✗ '+(e.message||e),true); } }
/* dossier choisi : Chrome redemande l'autorisation à chaque session → on la redemande au premier clic dans l'app */
document.addEventListener('pointerdown',async function auto(){ document.removeEventListener('pointerdown',auto,true);
  const hd=await sgDossierSauv(); if(hd&&(await hd.queryPermission({mode:'readwrite'}))==='prompt'){ try{ await hd.requestPermission({mode:'readwrite'}); }catch(_){} }
  /* essai raté faute d'accès au dossier (21.10.2026) : nouvel essai dès que l'accès est rendu */
  try{ if(hd&&sgSauvEchec()&&(await hd.queryPermission({mode:'readwrite'}))==='granted') sgSauver(false); }catch(_){} },true);
DS.on(ts=>{ if(ts.some(t=>t!=='sg_meta')) sgSauvPlanifier(); });
/* toutes les 5 min : sauvegarde si la dernière date de plus de 30 min — ou tout de suite en cas d'échec (21.10.2026) */
setInterval(()=>{ if(NX.booted&&!sgSauvAJour()&&(!SAUV.etat.quand||Date.now()-SAUV.etat.quand>30*60e3||SAUV.etat.erreur)) sgSauver(false); },5*60e3);
setInterval(()=>sgSauvAff(),60e3);
function sgSauvDemarrage(){ if(!SAUV.etat.quand||Date.now()-SAUV.etat.quand>12*3600e3||!sgSauvAJour()) setTimeout(()=>sgSauver(false),20000); }
async function sgRestaurer(nom){ sgConfirm('Restaurer la sauvegarde « '+nom+' » ?\n\nLa base de gestion de ce navigateur sera REMPLACÉE par cette sauvegarde (la base actuelle est d’abord sauvegardée).',async()=>{
  try{ await sgSauver(false); const r=await fetch(SG_SRV+'/gestion/lire?nom='+encodeURIComponent(nom)); if(!r.ok) throw new Error('lecture impossible');
    const n=await lbImport(new File([await r.blob()],nom)); toast(n+' enregistrements restaurés.'); setTimeout(()=>location.reload(),600); }
  catch(e){ toast('✗ Restauration impossible : '+(e.message||e),true); } },{title:'Restaurer une sauvegarde',yesText:'Restaurer',yesColor:'#bd1e42'}); }

/* ═══ 2. UN SEUL REGISTRE PAR DONNÉE ═════════════════════════════════════════════════════════════════════
   Adresses : l'Annuaire est la référence ; le carnet de Facturation (PV, calcul, devis) en est le reflet (+ ses fiches pas
   encore reprises). Heures : la Feuille d’heures est la référence ; « Réunir les registres » y reprend les heures saisies
   dans Facturation. Contrats ↔ affaires : lien par le code d'affaire (exact, puis préfixe « 23KAU.CV » → 23KAU), sinon lien
   manuel (sg3_liens), sans jamais modifier le contrat (son code est imprimé sur les documents). */
const SG_TYPES_ADR=['soc','pers','fam','com','ass'];
const sgCle=s=>nxNorm(s).replace(/[^a-z0-9]+/g,' ').trim();
function sgAnnuaireCarnet(){ const pg={}; DS.all('propertygroup').forEach(g=>pg[g.ID]=nm(g)); const pr={}; DS.all('property').forEach(p=>pr[p.ID]={g:pg[p.PROPERTYGROUP_ID]||'',p:nm(p)});
  const ent=[], adr=[];
  DS.all('contactowner').forEach(o=>{ ent.push({id:'ds'+o.ID,type:SG_TYPES_ADR[o.TYPECODE]||'soc',nom:o.NAME1||'',comp:o.NAME2||'',masque:!!+o.ISHIDDEN,ds:o.ID}); });
  DS.all('contact').forEach(c=>{ adr.push({id:'dc'+c.ID,entId:'ds'+c.CONTACTOWNER_ID,typ:ADR_T[c.ADDRESSTYPECODE]||'Adresse',parent:'',ad1:c.NAME1||'',ad2:c.NAME2||'',ad3:c.NAME3||'',
    rue:c.STREET||'',rue2:c.POBOX||'',npa:c.POSTALCODE||'',loc:c.LOCATION||'',pays:c.COUNTRYCODE==='CH'||!c.COUNTRYCODE?'Suisse':c.COUNTRYCODE,
    tel:[c.PHONEAREA1,c.PHONENUMBER1].filter(Boolean).join(' '),mob:[c.PHONEAREA2,c.PHONENUMBER2].filter(Boolean).join(' '),fax:'',mail:c.EMAIL1||'',skype:c.SKYPE||'',web:c.INTERNET||'',
    desc:c.ADDRESSDESC||'',abrev:c.SHORTLABEL||'',cfc:c.BKP||'',civ:c.SALUTATION1||'',masque:!!+c.ISHIDDEN,rem:c.REMARK||'',fonction:c.COMPANYROLE||'',prof:c.PROFESSION||'',
    langue:'Français',statut:'',props:DS.by('contact_property','CONTACT_ID',c.ID).map(x=>pr[x.PROPERTIES_ID]).filter(Boolean),notes:[],ds:c.ID}); });
  return {ent,adr}; }
function sgCarnetReste(carnet){ const noms=new Set(DS.all('contactowner').map(o=>sgCle([o.NAME1,o.NAME2].filter(Boolean).join(' '))));
  const ent=(carnet&&carnet.ent||[]).filter(e=>!/^ds/.test(e.id)&&!noms.has(sgCle([e.nom,e.comp].filter(Boolean).join(' '))));
  const ids=new Set(ent.map(e=>e.id)); return {ent,adr:(carnet.adr||[]).filter(a=>ids.has(a.entId))}; }
function sgCarnetOriginal(){ try{ const w=FX.w; const s=w&&w.localStorage.getItem('sa_adr'); const d=s?JSON.parse(s):null; return d&&Array.isArray(d.ent)?d:{ent:[],adr:[],seq:1}; }catch(_){ return {ent:[],adr:[],seq:1}; } }
function sgAdrInjecter(){ if(!FX.ready) return; try{ const a=sgAnnuaireCarnet(), r=sgCarnetReste(sgCarnetOriginal());
    FX.w.__sgAdr={ent:a.ent.concat(r.ent),adr:a.adr.concat(r.adr),seq:(sgCarnetOriginal().seq||1)};
    FX.w.eval('adrData=window.__sgAdr; window.adrPersist=function(){}');   // reflet : jamais réécrit dans sa_adr
  }catch(e){ console.error(e); } }
/* contrats ↔ affaires */
function sgLiens(){ return nxLS.get('sg3_liens',{}); }
function sgProjetDuContrat(c){ if(!c) return null; const l=sgLiens()[c.id]; if(l) return DS.get('project',l);
  const k=sgCle(c.affaire); if(!k) return null; const ps=DS.all('project');
  return ps.find(p=>sgCle(p.NUMBER)===k)||ps.filter(p=>p.NUMBER&&k.startsWith(sgCle(p.NUMBER)+' ')).sort((a,b)=>b.NUMBER.length-a.NUMBER.length)[0]||null; }
/* type de rémunération d'un contrat Facturation (detail.inputs.ch_modecalc_type, comme chContratModeCalc) : 'relatif' (Forfait relatif, défaut),
   'forfait', 'unitaire' ; '' si le contrat n'a jamais été enregistré avec le formulaire actuel (19.10.2026) */
const sgRemuType=c=>{ const inp=(c&&c.detail&&c.detail.inputs)||(c&&c.ouvrages&&c.ouvrages[0]&&c.ouvrages[0].detail&&c.ouvrages[0].detail.inputs)||null;
  return !inp?'':inp.ch_modecalc_type==='unitaire'?'unitaire':inp.ch_modecalc_type==='forfait'?'forfait':'relatif'; };
function sgContratsDuProjet(p,D){ return D?D.c.filter(c=>{ const q=sgProjetDuContrat(c); return q&&String(q.ID)===String(p.ID); }):[]; }
/* Facturation : propositions des affaires du moteur dans le champ « Affaire » du calcul d'honoraires */
function sgAffairesListe(){ if(!FX.ready) return; const d=FX.w.document; let dl=d.getElementById('sg-projets');
  if(!dl){ dl=d.createElement('datalist'); dl.id='sg-projets'; d.body.append(dl); }
  dl.innerHTML=DS.all('project').filter(p=>+p.PROJECTSTATECODE!==5).sort((a,b)=>cmp(a.NUMBER,b.NUMBER)).map(p=>'<option value="'+nxE(p.NUMBER)+'">'+nxE(p.TITLE||'')+'</option>').join('');
  const i=d.getElementById('ch_affaire'); if(i&&!i.dataset.sg){ i.dataset.sg=1; i.setAttribute('list','sg-projets');
    i.addEventListener('change',()=>{ const p=DS.all('project').find(x=>sgCle(x.NUMBER)===sgCle(i.value)); if(!p) return;
      const t=d.getElementById('ch_projet'); if(t&&!t.value.trim()){ t.value=p.TITLE||''; t.dispatchEvent(new Event('input',{bubbles:true})); } }); } }
/* reprise des heures saisies dans Facturation (source « fh ») dans la Feuille d’heures */
function sgHeuresAReprendre(){ let hs=[]; try{ hs=JSON.parse(FX.w.localStorage.getItem('sa_heures')||'[]'); }catch(_){}
  let cs=[]; try{ cs=JSON.parse(FX.w.localStorage.getItem('sa_collaborateurs')||'[]'); }catch(_){}
  const faites=new Set(nxLS.get('sg3_heures_reprises',[]));
  return hs.filter(x=>x.source==='fh'&&!faites.has(x.id)).map(x=>{ const out={src:x,ok:false};
    const p=DS.all('project').find(q=>sgCle(q.NUMBER)===sgCle(x.affaire)); if(!p){ out.pb='projet « '+x.affaire+' » inconnu'; return out; }
    const col=cs.find(c=>c.id===x.collab)||{}, nomC=sgCle(col.nom||col.name||''), ini=sgCle(col.initiales||col.ini||'');
    const st=DS.all('staff').find(s=>(ini&&sgCle(s.INITIALS)===ini)||(nomC&&(sgCle(staffName(s))===nomC||sgCle(staffName(s)).split(' ').reverse().join(' ')===nomC)));
    if(!st){ out.pb='collaborateur « '+(col.nom||x.collab)+' » inconnu'; return out; }
    const ags=DS.by('projectactivitygroup','PROJECT_ID',p.ID), ag=ags.find(g=>sgCle(nm(g))===sgCle(x.grpAct))||(ags.length===1?ags[0]:null);
    const acts=ag?DS.by('projectactivity','PROJECTACTIVITYGROUP_ID',ag.ID):[], ac=acts.find(a=>sgCle(nm(a))===sgCle(x.activite))||(acts.length===1?acts[0]:null);
    const last=DS.by('timelog','STAFF_ID',st.ID).filter(r=>String(r.PROJECT_ID)===String(p.ID)).sort((a,b)=>tlKey(b)-tlKey(a))[0];
    const agID=ag?ag.ID:last&&last.ACTIVITYGROUP_ID, acID=ac?ac.ID:last&&last.ACTIVITY_ID;
    if(!agID||!acID){ out.pb='activité « '+[x.grpAct,x.activite].filter(Boolean).join(' / ')+' » introuvable'; return out; }
    const ph=DS.by('projectphase','PROJECT_ID',p.ID).find(f=>sgCle(nm(f))===sgCle(x.phaseGroupe)), sp=ph&&DS.by('projectsubphase','PROJECTPHASE_ID',ph.ID).find(f=>sgCle(nm(f))===sgCle(x.phase));
    const d=new Date(x.date+'T00:00'), [h1,m1]=(x.debut||'08:00').split(':').map(Number), dur=Math.round((+x.heures||0)*60);
    let e1=h1*60+m1, e2=x.fin?(+x.fin.split(':')[0])*60+(+x.fin.split(':')[1]):e1+dur; if(e2<=e1) e2=e1+dur;
    const v={ID:null,STAFF_ID:st.ID,TIMEYEAR:d.getFullYear(),TIMEMONTH:d.getMonth(),TIMEDAY:d.getDate(),TIMEHOUR1:Math.floor(e1/60),TIMEMINUTE1:e1%60,TIMEHOUR2:Math.floor(e2/60),TIMEMINUTE2:e2%60,
      TIMEPERIOD:(e2-e1)/60,PROJECT_ID:p.ID,PHASE_ID:ph?ph.ID:null,SUBPHASE_ID:sp?sp.ID:null,ACTIVITYGROUP_ID:agID,ACTIVITY_ID:acID,SUBPROJECT_ID:null,DESCRIPTION:x.desc||null,
      ISCHARGEABLE:x.facturable===false?0:1,ISCHARGED:0,ISHOLIDAY:0,TIMELOGSTATECODE:0,CHARGEDDATE:null};
    if(+p.ISTIMEPHASEMANDATORY&&!v.PHASE_ID){ out.pb='phase « '+(x.phaseGroupe||'?')+' » introuvable (obligatoire)'; return out; }
    if(typeof hsOverlap==='function'&&hsOverlap(v)){ out.pb='déjà dans la Feuille d’heures (même créneau)'; out.doublon=true; return out; }
    out.ok=true; out.v=v; out.p=p; out.st=st; return out; }); }
async function sgReunirAppliquer(){ await fxEnsure(); const ok=await sgSauver(false);
  const r=sgCarnetReste(sgCarnetOriginal()), ops=[], nO=DS.newIds('contactowner',Math.max(1,r.ent.length)), nC=DS.newIds('contact',Math.max(1,r.adr.length)), idO={};
  r.ent.forEach((e,i)=>{ idO[e.id]=nO[i]; ops.push({t:'contactowner',id:nO[i],val:{ID:nO[i],TYPECODE:Math.max(0,SG_TYPES_ADR.indexOf(e.type)),NAME1:e.nom||'',NAME2:e.comp||null,
    FORMOFADDRESS:e.type==='pers'?null:OWNER_T[Math.max(0,SG_TYPES_ADR.indexOf(e.type))],ISHIDDEN:e.masque?1:0,CREATED:today(),REMARK:'Repris du carnet de Facturation'}}); });
  r.adr.forEach((a,i)=>{ const tel=String(a.tel||'').trim(), mob=String(a.mob||'').trim();
    ops.push({t:'contact',id:nC[i],val:{ID:nC[i],CONTACTOWNER_ID:idO[a.entId],ADDRESSTYPECODE:Math.max(0,ADR_T.indexOf(a.typ)),NAME1:a.ad1||null,NAME2:a.ad2||null,NAME3:a.ad3||null,
      STREET:a.rue||null,POBOX:a.rue2||null,POSTALCODE:a.npa||null,LOCATION:a.loc||null,COUNTRYCODE:(!a.pays||/suisse/i.test(a.pays))?'CH':a.pays,PHONECOUNTRY1:'+41',PHONENUMBER1:tel||null,
      PHONECOUNTRY2:'+41',PHONENUMBER2:mob||null,EMAIL1:a.mail||null,INTERNET:a.web||null,SKYPE:a.skype||null,BKP:a.cfc||null,SALUTATION1:a.civ||null,COMPANYROLE:a.fonction||null,
      PROFESSION:a.prof||null,ADDRESSDESC:a.desc||null,SHORTLABEL:a.abrev||null,ISHIDDEN:a.masque?1:0,CREATED:today(),
      REMARK:[a.rem,(a.props||[]).length?'Propriétés : '+a.props.map(x=>[x.g,x.p].filter(Boolean).join(' / ')).join(', '):''].filter(Boolean).join('\n')||null}}); });
  const hs=sgHeuresAReprendre().filter(x=>x.ok), nT=DS.newIds('timelog',Math.max(1,hs.length));
  hs.forEach((x,i)=>{ x.v.ID=nT[i]; ops.push({t:'timelog',id:nT[i],val:x.v}); });
  if(ops.length) await DS.commit(ops);
  nxLS.set('sg3_heures_reprises',[...new Set([...nxLS.get('sg3_heures_reprises',[]),...hs.map(x=>x.src.id),...sgHeuresAReprendre().filter(x=>x.doublon).map(x=>x.src.id)])]);
  nxLS.set('sg3_reunion',{le:Date.now(),adresses:r.ent.length,contacts:r.adr.length,heures:hs.length,sauvegarde:ok});
  sgAdrInjecter(); toast('Registres réunis : '+r.ent.length+' entités, '+r.adr.length+' adresses, '+hs.length+' saisies de temps.'); go('nx-reunir'); }
VIEWS['nx-reunir']={ render(m){ const pg0=nxPage(m,'<div class="nx-empty">Analyse des registres…</div>');
  fxEnsure().then(()=>{ if(!VIEW||VIEW.id!=='nx-reunir') return; const D=fxData()||{c:[],f:[]};
    const r=sgCarnetReste(sgCarnetOriginal()), hs=sgHeuresAReprendre(), hOk=hs.filter(x=>x.ok), hKo=hs.filter(x=>!x.ok&&!x.doublon), dbl=hs.filter(x=>x.doublon);
    const cs=D.c.filter(c=>!c.annule), sans=cs.filter(c=>!sgProjetDuContrat(c)), avec=cs.length-sans.length, fait=nxLS.get('sg3_reunion',null);
    const projOpts=DS.all('project').sort((a,b)=>cmp(b.NUMBER,a.NUMBER)).map(p=>'<option value="'+p.ID+'">'+nxE(projLabel(p))+'</option>').join('');
    const html='<div class="sg-split">'+sgIntro('Réglages','Réunir les registres','Une seule référence par donnée : l’<b>Annuaire</b> pour les adresses, la <b>Feuille d’heures</b> pour les heures, et chaque contrat relié à son projet. Rien n’est effacé : les anciens registres restent consultables dans Réglages ▸ Archives.'
        ,'<div class="sg-figs"><div class="sg-fig"><div class="n">'+r.ent.length+'</div><div class="t">entités du carnet à reprendre</div></div><div class="sg-fig"><div class="n">'+hOk.length+'</div><div class="t">saisies de temps à reprendre</div></div><div class="sg-fig"><div class="n">'+avec+'/'+cs.length+'</div><div class="t">contrats reliés</div></div>'+(fait?'<div class="sg-fig"><div class="n" style="font-size:16px">'+nxE(new Date(fait.le).toLocaleDateString('fr-CH'))+'</div><div class="t">dernière réunion</div></div>':'')+'</div>')
      +'<div><div class="nx-grid">'
      +nxCard('c12','Reprendre maintenant','<div class="b"><p style="margin:0 0 12px;font-weight:300">La base est d’abord sauvegardée. Seuls les éléments absents de la référence sont ajoutés ; les doublons sont ignorés.</p><button class="nx-btn pri" data-fn="go"'+((r.ent.length||hOk.length)?'':' disabled')+'>'+nxSvg('group')+'Réunir : '+r.ent.length+' entités, '+r.adr.length+' adresses, '+hOk.length+' saisies</button></div>')
      +nxCard('c6','Adresses du carnet absentes de l’Annuaire',r.ent.length?'<div class="b flush">'+r.ent.map(e=>'<div class="nx-row" style="cursor:default">'+nxSvg(e.type==='pers'?'person':'building')+'<div class="t"><b>'+nxE([e.nom,e.comp].filter(Boolean).join(' '))+'</b><span>'+nxE(r.adr.filter(a=>a.entId===e.id).map(a=>[a.loc,a.mail].filter(Boolean).join(' · ')).join(' | '))+'</span></div></div>').join('')+'</div>':'<div class="nx-empty">Toutes les adresses du carnet sont déjà dans l’Annuaire. Le carnet des PV, du calcul et des devis affiche désormais l’Annuaire.</div>','<span class="n">'+r.ent.length+'</span>')
      +nxCard('c6','Heures saisies dans Facturation',(hs.length?'<div class="b flush"><table class="nx-tbl"><tr><th>Date</th><th>Projet</th><th class="r">Durée</th><th>État</th></tr>'+hs.slice(0,60).map(x=>'<tr><td>'+dfr(x.src.date)+'</td><td>'+nxE(x.src.affaire)+'</td><td class="r">'+nxH(x.src.heures)+' h</td><td>'+(x.ok?'<span class="nx-tag s2">à reprendre</span>':x.doublon?'<span class="nx-tag s4">déjà présente</span>':'<span class="nx-tag urg">'+nxE(x.pb)+'</span>')+'</td></tr>').join('')+'</table></div>':'<div class="nx-empty">Aucune heure de Facturation à reprendre.</div>'),'<span class="n">'+hOk.length+' à reprendre · '+dbl.length+' déjà présentes · '+hKo.length+' à vérifier</span>')
      +nxCard('c12','Contrats d’honoraires sans projet relié',sans.length?'<div class="b flush"><table class="nx-tbl"><tr><th>Code</th><th>Projet / client</th><th>Date</th><th>Relier au projet</th></tr>'+sans.map(c=>'<tr><td><b>'+nxE(c.affaire||'—')+'</b></td><td>'+nxE([c.projet,c.nom].filter(Boolean).join(' — '))+'</td><td>'+(c.date?dfr(c.date):'')+'</td><td><select class="inp" data-lien="'+nxE(c.id)+'" style="max-width:340px"><option value="">— choisir —</option>'+projOpts+'</select></td></tr>').join('')+'</table></div>':'<div class="nx-empty">Tous les contrats sont reliés à un projet.</div>','<span class="n">'+sans.length+'</span>')
      +'</div></div></div>';
    const pg=m.querySelector('.nx-page'); pg.querySelector('.nx-wrap').innerHTML=html; pg0._fn.go=()=>sgConfirm('Réunir les registres maintenant ?\n\n'+r.ent.length+' entités et '+r.adr.length+' adresses entrent dans l’Annuaire, '+hOk.length+' saisies de temps dans la Feuille d’heures.',sgReunirAppliquer,{title:'Réunir les registres',yesText:'Réunir'});
    pg.querySelectorAll('[data-lien]').forEach(s=>s.onchange=()=>{ const l=sgLiens(); if(s.value) l[s.dataset.lien]=s.value; else delete l[s.dataset.lien]; nxLS.set('sg3_liens',l); toast('Contrat relié à '+projLabel(DS.get('project',s.value))+'.'); });
  }).catch(e=>toast('✗ '+(e.message||e),true)); } };

/* ── Données & sauvegarde (remplace l'écran de sg3.js) : sauvegarde automatique, restauration, export, outils ── */
VIEWS['nx-data']={ render(m){ const li=DS.linfo||{}, n=t=>DS.all(t).length, cmds=nxMenuCmds(), e=SAUV.etat;
  const pg=nxPage(m,'<div class="sg-split">'+sgIntro('Réglages','Données &amp; sauvegarde','Toutes les données sont dans ce navigateur. La base de gestion est sauvegardée automatiquement après chaque modification ; Facturation a sa propre sauvegarde.')
    +'<div><div class="nx-kpis">'+nxKpi('db','Dernière sauvegarde',e.quand?sgDepuis(e.quand):'jamais',e.quand?(e.ou==='serveur'?'Serveur · Sauvegarde Gestion':e.lieu||''):'à faire',null,null,1)+nxKpi('folder','Projets',String(n('project')))+nxKpi('contacts','Contacts',String(n('contactowner')))+nxKpi('clock','Saisies de temps',num(n('timelog'),0))+'</div>'
    +'<div class="nx-grid">'+nxCard('c6','Sauvegarde automatique','<div class="b"><dl class="nx-dl"><dt>État</dt><dd id="sg-sv-etat">…</dd><dt>Destination</dt><dd id="sg-sv-dest">…</dd>'+(e.erreur?'<dt>Dernier incident</dt><dd style="color:var(--s-rouge)">'+nxE(e.erreur)+'</dd>':'')+'</dl>'
        +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="nx-btn pri" data-fn="now">'+nxSvg('save')+'Sauvegarder maintenant</button><button class="nx-btn" data-fn="dir">'+nxSvg('folder')+'Choisir un dossier</button></div></div>')
    +nxCard('c6','Sauvegardes disponibles','<div class="b flush" id="sg-sv-liste"><div class="nx-empty">Recherche du serveur de sauvegarde…</div></div>')
    +nxCard('c6','Export / import manuel','<div class="b"><p style="margin:0 0 14px;font-weight:300">Fichier <b>.json.gz</b> de toute la base (pour une autre machine). L’import <b>remplace</b> la base de ce navigateur.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="nx-btn" data-fn="exp">'+nxSvg('export')+'Exporter</button><button class="nx-btn" data-fn="imp">'+nxSvg('import')+'Importer</button></div></div>')
    +nxCard('c6','Facturation et registres','<div class="b"><p style="margin:0 0 14px;font-weight:300">Contrats, factures et registres Facturation : sauvegarde automatique propre ; réunir les registres en double.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="nx-btn" data-go="fx-backup">'+nxSvg('save')+'Sauvegarde Facturation</button><button class="nx-btn" data-go="nx-reunir">'+nxSvg('group')+'Réunir les registres</button></div></div>')
    +nxCard('c6','Fichiers joints','<div class="b"><p style="margin:0 0 14px;font-weight:300">Les fichiers joints sont gardés dans ce navigateur, avec une copie sur le serveur de sauvegarde. Ceux de l’ancien dépôt DeltaSub sont lus au besoin sur le serveur ; « Rapatrier » les copie tous ici.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="nx-btn" data-fn="rap">'+nxSvg('import')+'Rapatrier les fichiers</button></div></div>')
    +nxCard('c6','Origine de la base','<div class="b"><dl class="nx-dl"><dt>Source</dt><dd>'+nxE(li.source||'—')+'</dd><dt>Importée le</dt><dd>'+nxE(li.imported?dfr(li.imported.slice(0,10))+' '+li.imported.slice(11,16):'—')+'</dd><dt>Version</dt><dd>'+nxE(String(DS.seq))+'</dd></dl></div>')
    +(cmds.length?nxCard('c6','Outils','<div class="b" style="display:flex;flex-wrap:wrap;gap:8px">'+cmds.flatMap((g,gi)=>g.items.map((x,i)=>'<button class="nx-btn" data-fn="c'+gi+'_'+i+'">'+nxE(x.t)+'</button>')).join('')+'</div>'):'')+'</div></div></div>');
  Object.assign(pg._fn,{now:()=>sgSauver(true).then(()=>go('nx-data')),dir:()=>sgChoisirDossier(),exp:()=>lbExport(),imp:()=>lbImportDlg(false),rap:()=>sgRapatrier()});
  cmds.forEach((g,gi)=>g.items.forEach((x,i)=>{ pg._fn['c'+gi+'_'+i]=x.fn; }));
  (async()=>{ const srv=await sgSrv(true), hd=await sgDossierSauv(), et=document.getElementById('sg-sv-etat'), de=document.getElementById('sg-sv-dest'), li2=document.getElementById('sg-sv-liste'); if(!et) return;
    /* état selon la destination RÉELLE (21.10.2026) : serveur joignable, ou dossier choisi ET autorisé ; avant, « prochaine
       automatiquement » s'affichait même sans aucune destination */
    const perm=hd?await hd.queryPermission({mode:'readwrite'}).catch(()=>'denied'):null, dest=srv||perm==='granted', ko=sgSauvEchec(), aj=sgSauvAJour();
    et.textContent=aj?'À jour'
      :!dest?(e.quand?'Modifications NON sauvegardées : aucune destination disponible':'Aucune sauvegarde : aucune destination disponible')
      :ko?'Échec de la dernière sauvegarde (voir « Dernier incident ») : nouvel essai automatique dans 5 minutes au plus'
      :e.quand?'Modifications depuis la dernière sauvegarde (la prochaine se fera automatiquement)':'Aucune sauvegarde : la première se fera automatiquement';
    if(!aj&&(!dest||ko)) et.style.color='var(--s-rouge)';
    de.textContent=srv?'Serveur de sauvegarde — '+SAUV.srv.d.gestion:hd?'Dossier « '+hd.name+' » (Chrome)'+(perm==='granted'?'':' — accès à autoriser de nouveau : « Choisir un dossier »'):'Aucune : lancez le serveur de sauvegarde (Mac Studio) ou choisissez un dossier';
    if(!dest) de.style.color='var(--s-rouge)';
    if(!srv){ li2.innerHTML='<div class="nx-empty">Serveur de sauvegarde injoignable : les sauvegardes du dossier choisi s’ouvrent depuis le Finder (Importer).</div>'; return; }
    try{ const d=await (await fetch(SG_SRV+'/gestion/liste')).json();
      li2.innerHTML=(d.fichiers||[]).length?'<table class="nx-tbl"><tr><th>Sauvegarde</th><th class="r">Taille</th><th></th></tr>'+d.fichiers.slice(0,15).map(f=>'<tr><td>'+nxE(new Date(f.mtime*1000).toLocaleString('fr-CH'))+'</td><td class="r">'+(f.taille/1e6).toFixed(1)+' Mo</td><td class="r"><button class="nx-btn" style="height:28px" data-nom="'+nxE(f.nom)+'">Restaurer</button></td></tr>').join('')+'</table>':'<div class="nx-empty">Aucune sauvegarde sur le serveur.</div>';
      li2.querySelectorAll('[data-nom]').forEach(b=>b.onclick=()=>sgRestaurer(b.dataset.nom)); }
    catch(_){ li2.innerHTML='<div class="nx-empty">Liste indisponible.</div>'; } })(); } };

/* ═══ Branchements communs ═══════════════════════════════════════════════════════════════════════════════ */
const sgNxFoot0=nxFoot; nxFoot=function(){ sgNxFoot0(); sgSauvAff(); };
const sgFxEnsure0=fxEnsure;
fxEnsure=function(){ const p=sgFxEnsure0(); if(p&&!p._sg){ p._sg=1; p.then(()=>{ sgAdrInjecter(); sgAffairesListe(); },()=>{}); } return p; };
DS.on(ts=>{ if(!FX.ready) return; if(hit(ts,'contactowner','contact','contact_property','property')) sgAdrInjecter(); if(hit(ts,'project')) sgAffairesListe(); });
{ const t=setInterval(()=>{ if(NX.booted){ clearInterval(t); sgSauvAff(); sgSauvDemarrage(); } },1000); }

/* ═══ 4. RENTABILITÉ PAR AFFAIRE (calculs partagés avec la fiche projet) ═══════════════════════════════════
   Honoraires du contrat (HT, contrats Facturation reliés ; sinon contrats du moteur), coût de revient (heures × taux interne
   du membre à la date), facturé (HT, hors frais), encaissé (TTC, factures payées), marge = facturé − coût.
   Alertes : rouge = coût au-delà des honoraires ; orange = coût ≥ 80 % des honoraires, ou facturation en retard de plus de
   25 points sur la consommation, ou phase hors budget. */
/* affaires internes : case « interne » de Deltaproject, ou affaire du bureau / affaire modèle (non cochées dans la base) */
const sgInterne=p=>!!(+p.ISINTERNAL||/^(SUBSTANCES|SUB)$/.test(p.NUMBER||'')||/^affaire (bureau|mod[eè]le)$/i.test((p.TITLE||'').trim()));
function sgTaux(){ const m={}; DS.all('staffrate').filter(r=>r.VALIDFROM).sort((a,b)=>cmp(a.VALIDFROM,b.VALIDFROM)).forEach(r=>(m[r.STAFF_ID]=m[r.STAFF_ID]||[]).push([r.VALIDFROM,+r.RATE||0]));
  return (sid,d)=>{ const a=m[sid]; if(!a) return 0; const k=diso(d); let r=a[0][1]; for(const [f,v] of a){ if(f<=k) r=v; else break; } return r; }; }
function sgRenta(p,D,taux){ taux=taux||sgTaux(); const logs=DS.by('timelog','PROJECT_ID',p.ID); let h=0,hc=0,cout=0; const byPh={};
  logs.forEach(r=>{ const v=+r.TIMEPERIOD||0; h+=v; if(+r.ISCHARGEABLE) hc+=v; cout+=v*taux(r.STAFF_ID,tlDate(r)); if(r.PHASE_ID!=null) byPh[r.PHASE_ID]=(byPh[r.PHASE_ID]||0)+v; });
  const cs=D?sgContratsDuProjet(p,D).filter(c=>!c.annule):[], ids=new Set(cs.map(c=>c.id)), tva=c=>(+c.tva||8.1)/100;
  let contratHT=cs.reduce((s,c)=>s+(+c.hht||(+c.httc||0)/(1+tva(c))),0), src='Facturation';
  let contratTTC=cs.reduce((s,c)=>s+(+c.httc||(+c.hht||0)*(1+tva(c))),0);   // TTC (19.10.2026, Contrats & factures)
  if(!contratHT){ contratHT=DS.by('projectcontract','PROJECT_ID',p.ID).filter(c=>!+c.ISSUBCONTRACT).reduce((s,c)=>s+(+c.CONTRACTAMOUNT||0),0); src=contratHT?'moteur':''; contratTTC=contratHT*1.081; }
  const fs=D?D.f.filter(f=>ids.has(f.contrat_id)&&!/annul/i.test(f.statut||'')):[];
  const tvaF=f=>tva(cs.find(c=>c.id===f.contrat_id)||{}), ttc=f=>+f._ttc||+f.ttc||0;
  const factHT=fs.reduce((s,f)=>s+ttc(f)/(1+tvaF(f)),0), factTTC=fs.reduce((s,f)=>s+ttc(f),0), encTTC=fs.filter(f=>!fxUnpaid(f)).reduce((s,f)=>s+ttc(f),0);
  const ph=DS.by('projectphase','PROJECT_ID',p.ID), hors=ph.filter(f=>+f.TIMEBUDGET>0&&(byPh[f.ID]||0)>+f.TIMEBUDGET);
  const conso=contratHT?cout/contratHT:null, fact=contratHT?factHT/contratHT:null; const al=[];
  if(contratHT&&cout>contratHT) al.push(['r','Coût au-delà des honoraires']);
  else if(contratHT&&conso>=0.8) al.push(['o','Coût à '+Math.round(conso*100)+' % des honoraires']);
  if(contratHT&&conso-fact>0.25) al.push(['o','Facturation en retard ('+Math.round(fact*100)+' % facturé / '+Math.round(conso*100)+' % consommé)']);
  if(hors.length) al.push(['o',hors.length+' phase'+(hors.length>1?'s':'')+' hors budget']);
  if(!contratHT&&h>40&&+p.PROJECTSTATECODE===2&&!sgInterne(p)) al.push(['g','Pas de contrat relié ('+nxH(h)+' h saisies)']);
  return {p,h,hc,cout,contratHT,contratTTC,src,factHT,factTTC,encTTC,marge:factHT-cout,reste:contratHT-cout,conso,fact,cs,fs,byPh,hors,al,niv:al.some(a=>a[0]==='r')?3:al.some(a=>a[0]==='o')?2:al.length?1:0}; }
const sgPct=v=>v==null?'—':Math.round(v*100)+' %';
/* ═══ Phase actuelle, graphique des phases, marge bénéficiaire (19.10.2026) ═══
   Phase actuelle = phase (groupe 0 à 8 de la base : 1 Relevé, 2 Faisabilité, 3 Étude du projet, 4 Appel d'offres, 5 Réalisation…) qui
   totalise le plus d'heures dans les 30 jours qui précèdent la dernière saisie du projet (feuille d'heures), avec sa sous-phase la plus
   saisie ; « recent » = dernière saisie il y a 45 jours au plus. */
function sgPhaseActuelle(p){ const L=DS.by('timelog','PROJECT_ID',p.ID).filter(r=>r.PHASE_ID!=null); if(!L.length) return null;
  let last=0, d=null; L.forEach(r=>{ const k=tlKey(r); if(k>last){ last=k; d=tlDate(r); } });
  const lim=dayKey(new Date(d.getFullYear(),d.getMonth(),d.getDate()-30)), W=L.filter(r=>tlKey(r)>=lim), byP={};
  W.forEach(r=>{ byP[r.PHASE_ID]=(byP[r.PHASE_ID]||0)+(+r.TIMEPERIOD||0); });
  const pid=Object.keys(byP).sort((a,b)=>byP[b]-byP[a])[0], ph=DS.get('projectphase',pid); if(!ph) return null;
  const byS={}; W.filter(r=>String(r.PHASE_ID)===String(pid)&&r.SUBPHASE_ID!=null).forEach(r=>{ byS[r.SUBPHASE_ID]=(byS[r.SUBPHASE_ID]||0)+(+r.TIMEPERIOD||0); });
  const sid=Object.keys(byS).sort((a,b)=>byS[b]-byS[a])[0];
  return {ph,sp:sid?DS.get('projectsubphase',sid)||null:null,date:d,recent:(Date.now()-d.getTime())/864e5<=45}; }
/* Contrat TTC par phase (19.10.2026) : montant TTC des contrats d'honoraires Facturation reliés au projet (non annulés), réparti selon les
   % des prestations SIA du contrat (clés « 431a », « 441b »… : 2e chiffre = phase SIA 1 à 5, 2e et 3e = sous-phase 31, 32…). Phases du
   projet reconnues par leur nom (1 Définition des objectifs, 2 Études préliminaires, 3 Étude du projet, 4 Appel d'offres, 5 Réalisation),
   sinon par leur numéro 3, 4, 5 ; sous-phases par leur numéro. null : aucun contrat relié ou cadre Facturation pas encore chargé. */
const SG_SIA_GRP=[[1,/d[ée]finition des objectifs/i],[2,/[ée]tudes? pr[ée]liminaires/i],[3,/[ée]tude du projet/i],[4,/appel d.offres/i],[5,/r[ée]alisation/i]];
function sgSiaGroupe(f){ const n=nm(f)||'', g=SG_SIA_GRP.find(([,re])=>re.test(n)); return g?g[0]:([3,4,5].includes(+f.NUMBER)?+f.NUMBER:null); }
/* libellé d'un contrat d'après ses phases SIA 102 (clés « 4XY… » de c.phases avec un % > 0, comme sgContratParPhase) : noms des phases et
   numéros des phases partielles, p. ex. « Étude du projet · 31–33 », « Appel d’offres, Réalisation · 41, 51–53 » (20.10.2026) */
const SG_SIA_NOM={1:'Définition des objectifs',2:'Études préliminaires',3:'Étude du projet',4:'Appel d’offres',5:'Réalisation',6:'Exploitation'};
function sgContratPhLib(c){ const G=new Set(), S=new Set(); Object.entries((c&&c.phases)||{}).forEach(([k,v])=>{ const m=/^4(\d)(\d)?/.exec(k); if(!m||!(+v>0)) return; G.add(+m[1]); if(m[2]) S.add(+(m[1]+m[2])); });
  if(!G.size) return ''; const pl=[]; [...S].sort((a,b)=>a-b).forEach(x=>{ const l=pl[pl.length-1]; if(l&&x===l[1]+1) l[1]=x; else pl.push([x,x]); });
  return [...G].sort((a,b)=>a-b).map(g=>SG_SIA_NOM[g]||'Phase '+g).join(', ')+(pl.length?' · '+pl.map(([a,b])=>a===b?a:a+'–'+b).join(', '):''); }
function sgContratParPhase(p){ const D=fxData(); if(!D) return null; const cs=sgContratsDuProjet(p,D).filter(c=>!c.annule); if(!cs.length) return null;
  const grp={}, sous={}, grpHT={}, sousHT={}; let tot=0, totHT=0;   /* TTC (grp, sous, tot) et HT (grpHT, sousHT, totHT) */
  cs.forEach(c=>{ const P=c.phases||{}, S=Object.values(P).reduce((a,v)=>a+(+v||0),0), T=+c.httc||0, H=+c.hht||(T/(1+((+c.tva||8.1)/100))); tot+=T; totHT+=H; if(!S) return;
    Object.entries(P).forEach(([k,v])=>{ const m=/^4(\d)(\d)?/.exec(k); if(!m||!+v) return; const a=T*(+v)/S, b=H*(+v)/S;
      grp[m[1]]=(grp[m[1]]||0)+a; grpHT[m[1]]=(grpHT[m[1]]||0)+b; if(m[2]){ sous[m[1]+m[2]]=(sous[m[1]+m[2]]||0)+a; sousHT[m[1]+m[2]]=(sousHT[m[1]+m[2]]||0)+b; } }); });
  return {grp,sous,tot,grpHT,sousHT,totHT,n:cs.length}; }
const sgPhaseLib=(pa,court)=>pa?nm(pa.ph)+(!court&&pa.sp?' — '+nm(pa.sp):''):'';
/* projet terminé ou archivé (états 4 et 5) : « Terminé » à la place de la phase actuelle, et plus de phase « en cours » surlignée (23.10.2026,
   demande de Paulo) — tableau de bord, page du projet, Mes projets, Affaires ▸ Gestion (liste et fiche) */
const sgTermine=p=>!!p&&(+p.PROJECTSTATECODE===4||+p.PROJECTSTATECODE===5), sgEtatLib=p=>'État du projet : '+((typeof PSTATE!=='undefined'&&PSTATE[p.PROJECTSTATECODE])||'');   // sans le numéro de la phase (19.10.2026)
/* marge bénéficiaire : administrateur et chef de projet (droit « finances »), pas quand les finances sont verrouillées */
const sgMargeVisible=()=>SG_ACC.profil!=='collab'&&!sgFinVerrou()&&(sgAdmin()||sgDroit('finances','projets'));
const sgMargePct=x=>x&&x.factHT>0?Math.round(x.marge/x.factHT*100)+' % du facturé HT':'aucune facture';
/* Vue d'ensemble du projet, graphisme revu (20.10.2026) : heures arrondies à l'heure (détail au dixième dans les infobulles), échelles
   graduées (sgEchelle : pas de 1, 2, 2,5 ou 5 × 10ⁿ), libellés de phase propres (sgPhNom : soulignés retirés, MAJUSCULES → minuscules) */
const sgHr=v=>{ v=+v||0; return v>0&&v<1?nxH(v):num(Math.round(v),0); };   // moins d'une heure : au dixième
const sgPhNom=f=>{ let n=String(nm(f)||'').replace(/_+/g,' ').replace(/\s+/g,' ').trim(); if(n&&n===n.toUpperCase()&&/[A-ZÀ-Ý]/.test(n)) n=n.charAt(0)+n.slice(1).toLowerCase(); return n||'Phase '+(f.NUMBER!=null?f.NUMBER:''); };
const sgEchelle=max=>{ const st0=Math.max(max,1)/4, p10=Math.pow(10,Math.floor(Math.log10(st0))), step=[1,2,2.5,5,10].map(x=>x*p10).find(x=>x>=st0)||p10*10, top=step*Math.max(1,Math.ceil(max/step-1e-9)), t=[]; for(let v=0;v<=top+1e-9;v+=step) t.push(v); return {step,top,t}; };
/* graphique des phases (tableau de bord ▸ Vue d'ensemble) : par phase, bande « prévu » (heures contrat, TIMEBUDGET), barre « effectué » (heures
   saisies) jusqu'à la limite prévue, dépassement en rouge au-delà, repère de la limite ; même échelle graduée pour toutes les phases (axe en
   bas, lignes de repère) ; colonne du numéro, heures effectuées / prévues, pastille du % consommé (rouge au-delà de 100 %) ; phase actuelle surlignée */
function sgPhasesGraph(p){ const ph=DS.by('projectphase','PROJECT_ID',p.ID).sort((a,b)=>cmp(a.NUMBER,b.NUMBER)), by={}; let sans=0;
  DS.by('timelog','PROJECT_ID',p.ID).forEach(r=>{ const v=+r.TIMEPERIOD||0; if(r.PHASE_ID==null) sans+=v; else by[r.PHASE_ID]=(by[r.PHASE_ID]||0)+v; });
  const pa=sgTermine(p)?null:sgPhaseActuelle(p), L=ph.map(f=>({f,pr:+f.TIMEBUDGET||0,ef:by[f.ID]||0})).filter(x=>x.pr||x.ef);
  if(!L.length&&!sans) return '<div class="nx-empty">Aucune phase avec des heures prévues ou saisies.</div>';
  const E=sgEchelle(Math.max(1,sans,...L.map(x=>Math.max(x.pr,x.ef)))), pc=v=>(v/E.top*100).toFixed(2)+'%';
  const gl='<span class="sg-gl">'+E.t.slice(1).map(v=>'<b style="left:'+pc(v)+'"></b>').join('')+'</span>';
  const row=(n,lib,pr,ef,cur)=>{ const dep=pr&&ef>pr, t=pr?(ef<=pr?'reste '+nxH(pr-ef)+' h':'dépassement de '+nxH(ef-pr)+' h'):'non prévu au contrat';
    return '<div class="sg-pg-r'+(cur?' cur':'')+'" title="'+nxE(lib+' — prévu : '+(pr?nxH(pr)+' h':'—')+' · effectué : '+nxH(ef)+' h · '+t)+'"><span class="sg-pg-n">'+(n!=null?nxE(String(n)):'')+'</span>'
      +'<div class="l"><span>'+nxE(lib)+'</span>'+(cur?'<i class="sg-pg-cur">actuelle</i>':'')+'</div>'
      +'<div class="g">'+gl+(pr?'<i class="pr" style="width:'+pc(pr)+'"></i>':'')+'<i class="ef'+(pr?'':' np')+'" style="width:'+pc(pr?Math.min(ef,pr):ef)+'"></i>'
      +(dep?'<i class="dp" style="left:'+pc(pr)+';width:'+pc(ef-pr)+'"></i>':'')+(pr?'<i class="mk" style="left:'+pc(pr)+'"></i>':'')+'</div>'
      +'<div class="v"><b>'+sgHr(ef)+'</b> / '+(pr?sgHr(pr):'—')+' h</div><div class="sg-pg-q">'+(pr?'<span'+(dep?' class="dep"':'')+'>'+Math.round(ef/pr*100)+' %</span>':'')+'</div></div>'; };
  return '<div class="sg-pg">'+L.map(x=>row(x.f.NUMBER,sgPhNom(x.f),x.pr,x.ef,!!pa&&pa.ph.ID===x.f.ID)).join('')+(sans?row(null,'Sans phase',0,sans,false):'')
    +'<div class="sg-pg-ax"><div class="g">'+E.t.map((v,i)=>'<em style="left:'+pc(v)+'">'+sgHr(v)+(i===E.t.length-1?' h':'')+'</em>').join('')+'</div></div></div>'
    +'<div class="sg-pg-leg"><span><i class="ef"></i>Heures effectuées</span><span><i class="pr"></i>Heures prévues (contrat)</span><span><i class="mk"></i>Limite prévue</span><span><i class="dp"></i>Dépassement</span></div>'; }   /* légende sous le tableau (19.10.2026) */   /* ligne « Total : … h effectuées sur … h prévues · phase actuelle … » retirée (19.10.2026) */
/* heures par mois (tableau de bord ▸ Vue d'ensemble, 20.10.2026) : colonnes en HTML (le graphique SVG étiré déformait les textes), échelle graduée,
   ligne de la moyenne des mois saisis, mois en cours marqué, année sous janvier et sous le premier mois ; au-delà de 14 mois, un mois sur deux nommé */
function sgMoisGraph(months){ if(!months.some(m=>m.a>0)) return '<div class="nx-empty">Aucune heure saisie.</div>';
  const E=sgEchelle(Math.max(...months.map(m=>m.a))), pc=v=>(v/E.top*100).toFixed(2)+'%', nz=months.filter(m=>m.a>0), moy=nz.reduce((a,m)=>a+m.a,0)/nz.length, deux=months.length>14;
  return '<div class="sg-mg"><div class="sg-mg-ax">'+E.t.map(v=>'<em style="bottom:'+pc(v)+'">'+sgHr(v)+'</em>').join('')+'</div>'
    +'<div class="sg-mg-pl">'+E.t.map(v=>'<b class="sg-mg-gl'+(v?'':' z')+'" style="bottom:'+pc(v)+'"></b>').join('')
    +'<div class="sg-mg-cols">'+months.map((m,i)=>'<div class="sg-mc'+(i===months.length-1?' cur':'')+'" title="'+nxE(m.l+' : '+nxH(m.a)+' h'+(i===months.length-1?' (mois en cours)':''))+'"><i style="height:'+pc(m.a)+'"></i></div>').join('')+'</div>'
    +'<b class="sg-mg-moy" style="bottom:'+pc(moy)+'"><span>moyenne '+sgHr(moy)+' h</span></b></div>'
    +'<div class="sg-mg-xl">'+months.map((m,i)=>'<span'+(i===months.length-1?' class="cur"':'')+'>'+(!deux||i===0||i===months.length-1||(m.m%2===0&&i!==1&&i!==months.length-2)?nxE(m.s):'')+(m.m===0||i===0?'<b>'+m.y+'</b>':'')+'</span>').join('')+'</div></div>'; }
/* part facturable d'un projet (19.10.2026, fonction depuis le 20.10.2026 — tuile de l'onglet Contrats & factures) : heures cochées « Facturable »
   (ISCHARGEABLE) ÷ heures saisies ; contrat(s) Facturation au forfait ou au forfait relatif (contrat sans mode enregistré = forfait relatif, mode par
   défaut de Facturation) → les heures facturables d'une phase sont plafonnées à ses heures au contrat (TIMEBUDGET) : le dépassement n'est pas
   facturable et fait baisser la part ; contrat unitaire, projet sans contrat relié, phase sans heures au contrat et heures sans phase : inchangé */
function sgPartFacturable(p,D){ let tot=0, chg=0; const byPh={};
  DS.by('timelog','PROJECT_ID',p.ID).forEach(r=>{ const v=+r.TIMEPERIOD||0; tot+=v; if(+r.ISCHARGEABLE){ chg+=v; const k=r.PHASE_ID==null?'':String(r.PHASE_ID); byPh[k]=(byPh[k]||0)+v; } });
  const ty=D?[...new Set(sgContratsDuProjet(p,D).filter(c=>!c.annule).map(c=>sgRemuType(c)||'relatif').filter(t=>t!=='unitaire'))]:[];
  let fact=chg; if(ty.length){ const bud={}; DS.by('projectphase','PROJECT_ID',p.ID).forEach(f=>{ if(+f.TIMEBUDGET>0) bud[f.ID]=+f.TIMEBUDGET; });
    fact=Object.entries(byPh).reduce((a,[id,c])=>a+(bud[id]!=null?Math.min(c,bud[id]):c),0); }
  const dep=Math.max(0,chg-fact); return {tot,chg,fact,dep:dep<0.05?0:dep,ty,pct:tot?fact/tot*100:null}; }
const sgBarre=(v,col)=>v==null?'':'<span class="nx-mini-bar"><i style="width:'+Math.max(2,Math.min(100,v*100))+'%;background:'+(col||'var(--s-nuit)')+'"></i></span>';
const sgAlerteTag=a=>'<span class="nx-tag '+(a[0]==='r'?'urg':a[0]==='o'?'s3':'s4')+'">'+nxE(a[1])+'</span>';
VIEWS['nx-renta']={ render(m){ const pg0=nxPage(m,'<div class="nx-empty">Calcul de la rentabilité…</div>'); const tous=nxLS.get('sg3_renta_tous',false);
  fxEnsure().catch(()=>null).then(()=>{ if(!VIEW||VIEW.id!=='nx-renta') return; const D=fxData(), taux=sgTaux();
    const ps=DS.all('project').filter(p=>!sgInterne(p)&&(tous?+p.PROJECTSTATECODE!==5:+p.PROJECTSTATECODE===2||+p.PROJECTSTATECODE===3));
    const L=ps.map(p=>sgRenta(p,D,taux)).filter(x=>x.h||x.contratHT).sort((a,b)=>b.niv-a.niv||(b.conso||0)-(a.conso||0));
    const T=L.reduce((t,x)=>({c:t.c+x.contratHT,k:t.k+x.cout,f:t.f+x.factHT,e:t.e+x.encTTC}),{c:0,k:0,f:0,e:0}), nAl=L.filter(x=>x.niv>=2).length;
    const html='<div class="sg-split">'+sgIntro('Finances','Rentabilité des projets','Pour chaque projet : honoraires du contrat, coût de revient du temps passé (taux interne de chaque membre), montant facturé et encaissé, marge. Les montants sont hors taxes, sauf l’encaissé (TTC).'
        ,'<div class="sg-figs"><div class="sg-fig"><div class="n">'+nAl+'</div><div class="t">projets en alerte</div></div><div class="sg-fig"><div class="n">'+L.length+'</div><div class="t">projets suivis</div></div></div><div class="acts"><button class="nx-btn" data-fn="tous">'+nxSvg('filter')+(tous?'Projets en cours seulement':'Inclure les projets terminés')+'</button><button class="nx-btn" data-fn="csv">'+nxSvg('export')+'Exporter (CSV)</button></div>')
      +'<div><div class="nx-kpis">'+nxKpi('contrat','Honoraires (HT)',nxCHF(T.c)+'<small>CHF</small>','contrats reliés',null,null,1)+nxKpi('clock','Coût de revient',nxCHF(T.k)+'<small>CHF</small>',T.c?Math.round(T.k/T.c*100)+' % des honoraires':'')+nxKpi('receipt','Facturé (HT)',nxCHF(T.f)+'<small>CHF</small>',T.c?Math.round(T.f/T.c*100)+' % des honoraires':'')+nxKpi('trend','Marge',nxCHF(T.f-T.k)+'<small>CHF</small>','facturé − coût de revient')+'</div>'
      +nxCard('c12','Par projet','<div class="b flush" style="overflow:auto"><table class="nx-tbl"><tr><th>Projet</th><th class="r">Honoraires HT</th><th class="r">Coût de revient</th><th>Consommé</th><th class="r">Facturé HT</th><th>Facturé</th><th class="r">Encaissé TTC</th><th class="r">Marge</th><th>Alertes</th></tr>'
        +L.map(x=>'<tr class="nx-row" data-ref="p:'+x.p.ID+'" style="display:table-row"><td><span class="nx-tag num">'+nxE(x.p.NUMBER)+'</span> '+nxE((x.p.TITLE||'').slice(0,46))+'</td><td class="r">'+(x.contratHT?nxCHF(x.contratHT):'—')+'</td><td class="r">'+nxCHF(x.cout)+'</td><td>'+sgBarre(x.conso,x.conso>1?'var(--s-rouge)':x.conso>=.8?'var(--s-orange)':null)+' '+sgPct(x.conso)+'</td><td class="r">'+nxCHF(x.factHT)+'</td><td>'+sgBarre(x.fact)+' '+sgPct(x.fact)+'</td><td class="r">'+nxCHF(x.encTTC)+'</td><td class="r"'+(x.marge<0?' style="color:var(--s-rouge)"':'')+'>'+nxCHF(x.marge)+'</td><td>'+x.al.map(sgAlerteTag).join(' ')+'</td></tr>').join('')+'</table></div>')+'</div></div>';
    const pg=m.querySelector('.nx-page'); pg.querySelector('.nx-wrap').innerHTML=html;
    pg0._fn.tous=()=>{ nxLS.set('sg3_renta_tous',!tous); go('nx-renta'); };
    pg0._fn.csv=()=>{ const q=v=>'"'+String(v).replace(/"/g,'""')+'"', rows=[['Projet','Titre','Honoraires HT','Coût de revient','Consommé %','Facturé HT','Facturé %','Encaissé TTC','Marge','Heures','Alertes']]
        .concat(L.map(x=>[x.p.NUMBER,x.p.TITLE,Math.round(x.contratHT),Math.round(x.cout),x.conso==null?'':Math.round(x.conso*100),Math.round(x.factHT),x.fact==null?'':Math.round(x.fact*100),Math.round(x.encTTC),Math.round(x.marge),Math.round(x.h*10)/10,x.al.map(a=>a[1]).join(' ; ')]));
      const a=h('a',{href:URL.createObjectURL(new Blob(['﻿'+rows.map(r=>r.map(q).join(';')).join('\n')],{type:'text/csv'})),download:'rentabilite_'+sgHorodatage()+'.csv'}); document.body.append(a); a.click(); setTimeout(()=>a.remove(),1000); };
  }); },
  refresh(ts){ if(hit(ts,'timelog','project','projectcontract','staffrate')) go('nx-renta'); } };

/* ═══ 3. FICHE PROJET = CENTRE DE PILOTAGE ═══════════════════════════════════════════════════════════════
   Onglets : vue d'ensemble · temps · phases & budget · intervenants · contrats & factures · chantier · documents · notes
   & tâches ; actions directes : saisir du temps, facturer, PV de chantier, ouvrir dans Projets. */
/* Projets : « Temps » → « Heures » et « Contrats » → « Contrat » (20.10.2026, à la demande ; clés inchangées) */
/* 20.10.2026 : Vue d'ensemble, Contrat, Faisabilité (si une phase de faisabilité est utilisée), Projet, Chantier, Heures, Factures, Intervenants,
   Documents, Notes & tâches */
const SG_ONGLETS=[['vue','Vue d’ensemble'],['factu','Contrat'],['temps','Heures'],['fact','Factures']];
/* 20.10.2026 (Paulo, pour tous les projets) : « le tableau de bord sert à analyser le projet uniquement, pas à travailler » — onglets Projet,
   Chantier, Faisabilité, Intervenants et Notes & tâches retirés (Documents l'était déjà) ; leur code reste dans sgOnglet (clés projet, chantier,
   faisa, interv, notes) — pour les rétablir, les remettre dans SG_ONGLETS. Documents du projet : page du projet ▸ Documents (sgDocsModule) ;
   intervenants, notes, tâches : domaines de la page du projet. */
/* phases partielles SIA 102 des études (onglet Projet), rubriques du dossier d'enquête (comme le dossier « Att_CO » des affaires) et de l'onglet
   Faisabilité ; dossiers du dépôt : ProjectDocuments/Documents/<projet>/Documents/Projet/<n° nom>/<rubrique> et …/Faisabilité/<rubrique> */
const SG_PROJ_PH=[[31,'Avant-projet'],[32,'Projet de l’ouvrage'],[33,'Procédure de demande d’autorisation'],[41,'Appel d’offres, comparaison des offres et propositions d’adjudication']];
/* phases SIA des fichiers du projet (21.10.2026) : dossiers « Projet/<n° nom>/<rubrique> » ; 41 à 53 = chantier (Chantier ▸ Documents / Présentation) */
const SG_PH_FICH=[...SG_PROJ_PH,[51,'Projet d’exécution'],[52,'Exécution de l’ouvrage'],[53,'Mise en service, achèvement']];
/* types de documents (21.10.2026, demande de Paulo) : sous-dossier de la phase ; « PV MO », « Présentation client », « Documents » = dossiers existants */
const SG_TYPES_FICH=[['Plans','Plans','ruler'],['PV MO','PV','pv'],['Présentation client','Présentation','pdf'],['Offres','Offres','receipt'],['Ingénieur civil','Ingénieur civil','building'],
  ['Ingénieurs CVSE','Ingénieurs CVSE (chauffage, ventilation, sanitaire, électricité)','gear'],['Géomètre','Géomètre','map'],['Physique du bâtiment','Physique du bâtiment, énergie, acoustique','gauge'],
  ['Autorisations','Autorisations','task'],['Correspondance','Correspondance','mail'],['Photos','Photos','image'],['Documents','Autres documents','folder']];
const SG_TYPES_DLG=SG_TYPES_FICH.map(([k,l])=>[k,l]);
function sgPhasesFich(p,nums){ const spN=new Map(); DS.by('projectphase','PROJECT_ID',p.ID).forEach(f=>DS.by('projectsubphase','PROJECTPHASE_ID',f.ID).forEach(x=>{ const n=parseFloat(x.NUMBER); if(isFinite(n)&&nm(x)) spN.set(n,nm(x)); }));
  return SG_PH_FICH.filter(([n])=>!nums||nums.includes(n)).map(([n,lib])=>({n,lib:spN.get(n)||lib,dos:n+' '+lib})); }
/* ═══ Reconnaissance du type et de la phase d'un fichier joint (21.10.2026, demande de Paulo) ═══
   Indices : nom du fichier (poids 3), extension (photos, présentations, DAO), texte des 3 premières pages d'un PDF (pdf.js du cadre Facturation :
   cartouche des plans, en-tête des PV, lettres, offres…). Type = meilleur score de SG_TYPE_MOTS, sinon « Autres documents ». Phase : numéro SIA
   écrit (« phase 32 », « 4.33 »), sinon mots de phase (SG_PHASE_MOTS : enquête → 33, appel d'offres → 41, exécution → 51…), sinon date inscrite
   dans le document comparée à la feuille d'heures du projet (phase la plus saisie dans les 45 jours avant cette date). Proposition seulement :
   chaque fichier garde ses menus Phase et Type dans la fenêtre d'ajout. */
const SG_TYPE_MOTS=[
  ['PV MO',/proc[èe]s[- ]verbal|\bP\.?V\.?\s*(n[°o]|no\.?|de s[ée]ance|de chantier)|s[ée]ance (de chantier|de coordination|avec le ma[îi]tre)|ordre du jour|\bexcus[ée]s?\s*:/i],
  ['Plans',/[ée]chelle\s*:?\s*1\s*[:\/]\s*\d+|\b1\s*:\s*(1|2|5|10|20|25|50|100|200|500|1000|2500)\b|\b(fa[çc]ades?|coupes?|[ée]l[ée]vations?|plan de situation|plan des? (niveaux?|toiture|rez|sous-sol|combles|fondations))\b/i],
  ['Offres',/\boffre\b|\bdevis\b|\bsoumission\b|prix unitaire|montant (total|ht|ttc)|offre d[’']honoraires|conditions de paiement|validit[ée] de l[’']offre|\bTVA\s*\d/i],
  ['Ingénieur civil',/ing[ée]nieurs? civils?|g[ée]nie civil|\bstatique\b|structure porteuse|b[ée]ton arm[ée]|armatures?|dimensionnement|SIA\s*26[0-7]|charpente m[ée]tallique|g[ée]otechni/i],
  ['Ingénieurs CVSE',/\bCVSE?\b|\bchauffage\b|\bventilation\b|\bsanitaires?\b|[ée]lectricit[ée]|\bMCR\b|pompe [àa] chaleur|installations? techniques?/i],
  ['Géomètre',/g[ée]om[èe]tre|abornement|mensuration|plan cadastral|registre foncier|\bservitudes?\b|relev[ée] topographique/i],
  ['Physique du bâtiment',/physique du b[âa]timent|bilan thermique|SIA\s*380|\bCECB\b|minergie|justificatif [ée]nerg[ée]tique|acousti|pont thermique|isolation thermique/i],
  ['Autorisations',/permis de construire|autorisation (de construire|municipale|sp[ée]ciale)|d[ée]cision municipale|\bCAMAC\b|synth[èe]se (CAMAC|des autorisations)|lev[ée]e d[’']opposition|\boppositions?\b/i],
  ['Correspondance',/madame,? monsieur|^\s*concerne\s*:|nous vous prions|veuillez agr[ée]er|meilleures salutations|salutations distingu[ée]es|^\s*objet\s*:/im],
  ['Photos',/\bphotos?\b|\bimg[ _]?\d|\bdsc[ _]?\d/i],
  ['Présentation client',/\bpr[ée]sentation\b|\bvariantes?\b|\besquisses?\b|images? de synth[èe]se|\bperspectives?\b|\brendus?\b/i]];
const SG_PHASE_MOTS=[[33,/mise [àa] l[’']enqu[êe]te|enqu[êe]te publique|dossier d[’']enqu[êe]te|demande de permis|permis de construire|\bCAMAC\b|questionnaire (g[ée]n[ée]ral|particulier)/i],
  [41,/appel d[’']offres|\bsoumissions?\b|adjudication|comparatif des offres|retour des offres|d[ée]lai de remise/i],
  [51,/plans? d[’']ex[ée]cution|projet d[’']ex[ée]cution|d[ée]tails? d[’']ex[ée]cution/i],
  [52,/s[ée]ance de chantier|PV de chantier|direction des travaux|ex[ée]cution de l[’']ouvrage|situation (de|des) travaux|ordre de modification/i],
  [53,/r[ée]ception (de l[’']ouvrage|des travaux)|d[ée]compte final|mise en service|liste des d[ée]fauts|ach[èe]vement/i],
  [32,/projet de l[’']ouvrage|devis g[ée]n[ée]ral|[±+]\s*10\s*%/i],
  [31,/avant[- ]projet|estimation sommaire|[±+]\s*15\s*%/i]];
const SG_MOIS_NUM={janvier:1,'février':2,fevrier:2,mars:3,avril:4,mai:5,juin:6,juillet:7,'août':8,aout:8,septembre:9,octobre:10,novembre:11,'décembre':12,decembre:12};
/* texte des premières pages d'un PDF (léger : n pages, 20'000 caractères au plus) */
async function sgPdfDebut(blob,n){ const w=await fxEnsure(); if(typeof w.offreLoadPdfJs!=='function') return ''; await w.offreLoadPdfJs();
  const pdf=await w.pdfjsLib.getDocument({data:new w.Uint8Array(await blob.arrayBuffer())}).promise; let s='';
  try{ for(let i=1;i<=Math.min(n||3,pdf.numPages);i++){ const pg=await pdf.getPage(i), tc=await pg.getTextContent(); s+=tc.items.map(it=>it.str||'').join(' ')+'\n'; if(pg.cleanup) pg.cleanup(); if(s.length>20000) break; } }
  finally{ try{ pdf.destroy(); }catch(_){} } return s.slice(0,20000); }
function sgDateDans(t){ const auj=new Date(), ok=d=>d&&d.getFullYear()>1990&&d<=new Date(auj.getTime()+30*864e5);
  let m=/\b(\d{1,2})[.\/](\d{1,2})[.\/](\d{4}|\d{2})\b/.exec(t); if(m){ const y=+m[3]<100?2000+ +m[3]:+m[3], d=new Date(y,+m[2]-1,+m[1]); if(ok(d)) return d; }
  m=/\b(\d{1,2})(?:er)?\s+(janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[ûu]t|septembre|octobre|novembre|d[ée]cembre)\s+(\d{4})\b/i.exec(t);
  if(m){ const d=new Date(+m[3],(SG_MOIS_NUM[m[2].toLowerCase()]||SG_MOIS_NUM[m[2].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')]||1)-1,+m[1]); if(ok(d)) return d; } return null; }
/* phase en cours à une date d'après la feuille d'heures : sous-phase (31…53) la plus saisie dans les 45 jours avant la date */
function sgPhaseALaDate(p,d){ const k1=dayKey(new Date(d.getFullYear(),d.getMonth(),d.getDate()-45)), k2=dayKey(new Date(d.getFullYear(),d.getMonth(),d.getDate()+3)), by={};
  DS.by('timelog','PROJECT_ID',p.ID).forEach(r=>{ const k=tlKey(r); if(k<k1||k>k2||r.SUBPHASE_ID==null) return; by[r.SUBPHASE_ID]=(by[r.SUBPHASE_ID]||0)+(+r.TIMEPERIOD||0); });
  const sid=Object.keys(by).sort((a,b)=>by[b]-by[a])[0], sp=sid&&DS.get('projectsubphase',sid), n=sp?parseInt(sp.NUMBER,10):NaN; return SG_PH_FICH.some(([x])=>x===n)?n:null; }
async function sgAnalyserFichier(p,f){ const nom=String(f.name||''), ext=(nom.split('.').pop()||'').toLowerCase(), nomT=nom.replace(/\.[^.]+$/,'').replace(/[_\-.]+/g,' ');
  let txt=''; if(ext==='pdf'||f.type==='application/pdf'){ try{ txt=await sgPdfDebut(f,3); }catch(_){} } else if(/^(txt|csv|md|eml)$/.test(ext)){ try{ txt=(await f.text()).slice(0,20000); }catch(_){} }
  const sc={}, rs={}; SG_TYPE_MOTS.forEach(([t,re])=>{ let s=0; if(re.test(nomT)){ s+=3; rs[t]='nom du fichier'; } const m=txt.match(new RegExp(re.source,re.flags.includes('g')?re.flags:re.flags+'g')); if(m){ s+=Math.min(4,m.length); if(!rs[t]) rs[t]='« '+m[0].trim().slice(0,40)+' »'; } if(s) sc[t]=s; });
  if(/^(jpe?g|png|heic|heif|tiff?|webp)$/.test(ext)&&!/\bplans?\b|[ée]chelle|\b1\s*[:_]\s*\d/i.test(nomT)){ sc.Photos=(sc.Photos||0)+8; rs.Photos='image ('+ext+')'; }   /* image : photo, sauf « plan » ou échelle dans le nom */
  if(/^(pptx?|key)$/.test(ext)){ sc['Présentation client']=(sc['Présentation client']||0)+5; rs['Présentation client']='présentation ('+ext+')'; }
  if(/^(dwg|dxf|ifc|pln|rvt)$/.test(ext)){ sc.Plans=(sc.Plans||0)+5; rs.Plans='fichier de dessin ('+ext+')'; }
  if(sc.Plans&&sc.Offres&&/[ée]chelle|1\s*:\s*\d/.test(txt)) sc.Offres=Math.max(0,sc.Offres-2);   /* un plan contient souvent « TVA » ou « devis » dans le cartouche : l'échelle l'emporte */
  const type=Object.keys(sc).sort((a,b)=>sc[b]-sc[a])[0]||null;
  const tout=nomT+'\n'+txt; let phase=null, rp='';
  const ex=/\b(?:phase|SIA)\s*(31|32|33|41|51|52|53)\b|\b4\.(31|32|33|41|51|52|53)\b/i.exec(tout); if(ex){ phase=+(ex[1]||ex[2]); rp='« '+ex[0]+' »'; }
  if(!phase){ let best=0; SG_PHASE_MOTS.forEach(([n,re])=>{ const m=tout.match(new RegExp(re.source,'gi')); if(m&&m.length>best){ best=m.length; phase=n; rp='« '+m[0].trim().slice(0,40)+' »'; } }); }
  if(!phase){ const d=sgDateDans(txt.slice(0,4000))||sgDateDans(nomT); if(d){ const n=sgPhaseALaDate(p,d); if(n){ phase=n; rp='date '+dfr(diso(d))+' → phase saisie dans la feuille d’heures'; } } }
  return {type,rt:type?rs[type]:'',phase,rp,lu:!!txt}; }
/* fenêtre « Ajouter des fichiers » avec phase et type de document par fichier (21.10.2026) — o : {titre, phases:[n…], phase, rubriques:[[chemin,
   libellé]], rubrique, sansPhase:'libellé', sansDos:()=>dossier, apres(), enquete} ; chaque fichier : phase et type proposés par sgAnalyserFichier
   (repli : phase et type de la fenêtre, p. ex. la rubrique où l'on a cliqué « Ajouter »), modifiables ligne par ligne */
function sgDeposerDlg(p,o){ const PH=sgPhasesFich(p,o.phases), tySans=(o.rubriques||[]).length>1;   /* sans phase : le type reste un sous-dossier (Chantier ▸ Plans…) quand plusieurs types sont proposés */
  const ph0=o.phase!=null&&PH.some(x=>String(x.n)===String(o.phase))?String(o.phase):(o.sansPhase?'':String(PH[0]?PH[0].n:''));
  const rubsDe=ph=>{ const L=(o.rubriques||[]).slice(); if(ph==='33'&&o.enquete!==false) SG_ENQUETE.forEach(([t,,sous])=>L.push(['Dossier d’enquête/'+sous,'Dossier d’enquête · '+t])); return L; };
  const optPh=v=>(o.sansPhase?'<option value="">'+nxE(o.sansPhase)+'</option>':'')+PH.map(x=>'<option value="'+x.n+'"'+(String(x.n)===v?' selected':'')+'>'+x.n+' · '+nxE(x.lib)+'</option>').join('');
  const optTy=(ph,v)=>rubsDe(ph).map(([k,l])=>'<option value="'+nxE(k)+'"'+(k===v?' selected':'')+'>'+nxE(l)+'</option>').join('');
  const inp=h('input',{type:'file',multiple:true,style:'display:none'}), liste=h('div',{class:'sg-dep-l'}); let F=[];   /* F : [{f, ph, ty, raison, touche}] */
  const ligne=x=>{ const r=h('div',{class:'sg-dep-r'}); const s1=h('select',{class:'inp',html:optPh(x.ph)}), s2=h('select',{class:'inp',html:optTy(x.ph,x.ty)}), m=h('small',{},x.raison||'');
    s1.onchange=()=>{ x.ph=s1.value; x.touche=1; s2.innerHTML=optTy(x.ph,x.ty); x.ty=s2.value; s2.style.visibility=x.ph===''&&!tySans?'hidden':''; }; s2.onchange=()=>{ x.ty=s2.value; x.touche=1; };
    s2.style.visibility=x.ph===''&&!tySans?'hidden':''; x.maj=()=>{ s1.innerHTML=optPh(x.ph); s2.innerHTML=optTy(x.ph,x.ty); x.ty=s2.value; s2.style.visibility=x.ph===''&&!tySans?'hidden':''; m.textContent=x.raison||''; };
    r.append(h('b',{title:x.f.name},x.f.name),s1,s2,m); return r; };
  const ajouter=fs=>{ fs.forEach(f=>{ if(F.some(x=>x.f.name===f.name&&x.f.size===f.size)) return; const x={f,ph:ph0,ty:o.rubrique||((o.rubriques||[])[0]||[])[0]||'',raison:'analyse du document…'}; F.push(x); liste.append(ligne(x));
      sgAnalyserFichier(p,f).then(a=>{ if(x.touche) return; const libT=k=>(rubsDe('33').find(([c])=>c===k)||[k,k])[1], ok=a.phase&&PH.some(y=>y.n===a.phase), dans=a.type&&(o.rubriques||[]).some(([c])=>c===a.type);
        if(ok) x.ph=String(a.phase); if(dans) x.ty=a.type;
        x.raison=[dans?'Type : '+libT(a.type)+' ('+a.rt+')':(a.lu?'Type non reconnu':'Type d’après le nom seulement'),ok?'Phase '+a.phase+' ('+a.rp+')':(a.phase?'Phase '+a.phase+' proposée, hors de cette page':'Phase non reconnue')].join(' · ');
        x.maj(); }).catch(()=>{ x.raison='Analyse impossible — phase et type de la fenêtre'; x.maj(); }); });
    vide.style.display=F.length?'none':''; };
  const vide=h('div',{class:'sg-dep-v'},'Aucun fichier choisi. Le type et la phase de chaque fichier sont proposés d’après son nom et son contenu.');
  const zone=h('div',{class:'sg-dep-z'},h('span',{},'Glissez les fichiers ici ou '),h('button',{class:'nx-btn sm',onclick:()=>inp.click()},'Choisir des fichiers…'),inp);
  inp.onchange=()=>{ ajouter([...inp.files]); inp.value=''; };
  zone.ondragover=e=>{ e.preventDefault(); zone.classList.add('on'); }; zone.ondragleave=()=>zone.classList.remove('on');
  zone.ondrop=e=>{ e.preventDefault(); zone.classList.remove('on'); ajouter([...e.dataTransfer.files].filter(f=>f.size||f.type)); };
  dialog({title:o.titre||'Ajouter des fichiers',width:'min(860px,95vw)',body:h('div',{class:'sg-dep'},zone,vide,liste),
    buttons:[{t:'Annuler'},{t:'Ajouter',pri:true,fn:async()=>{ if(!F.length){ toast('Choisissez au moins un fichier.',true); return false; }
      let n=0; for(const x of F){ const ph=PH.find(y=>String(y.n)===x.ph); let d;
        try{ d=x.ph===''||!ph?(o.sansDos?o.sansDos():ch03aDossier('document',p.ID,'Général'))+(tySans&&x.ty&&!/Dossier d’enquête/.test(x.ty)?'/'+x.ty:''):ch03aDossier('document',p.ID,'Projet',ph.dos+(x.ty?'/'+x.ty:'')); }catch(e){ toast('✗ '+x.f.name+' : '+(e.message||e),true); continue; }
        try{ if(!ch03aNomValide(x.f.name)) throw new Error('nom de fichier non valide'); await ch03aDeposer(d,x.f.name,x.f,{projet:p.ID,origine:'import'}); n++; }
        catch(e){ if(e.message==='existe'){ if(await confirmDlg('« '+x.f.name+' » existe déjà. Le remplacer ?','Remplacer')){ await ch03aDeposer(d,x.f.name,x.f,{projet:p.ID,origine:'import',remplacer:true}); n++; } } else toast('✗ '+x.f.name+' : '+e.message,true); } }
      if(n) toast(n+' fichier'+(n>1?'s':'')+' ajouté'+(n>1?'s':'')+'.'); if(o.apres) o.apres(F.length===1?F[0].ph:(F.every(x=>x.ph===F[0].ph)?F[0].ph:'')); }}]}); }
/* reclasser un fichier dans une autre phase (même rubrique) : nouvel enregistrement dans le dossier de la phase, ancien retiré — aucun octet copié */
async function sgFichierPhase(p,f,ph,rub){ const x=sgPhasesFich(p).find(y=>String(y.n)===String(ph)); if(!x) return false;
  const d=ch03aDossier('document',p.ID,'Projet',x.dos+(rub?'/'+rub:'')); if(d===f.DOSSIER) return false;
  if(ch03aTrouve(d,f.NOM)){ toast('« '+f.NOM+' » existe déjà en phase '+x.n+'.',true); return false; }
  await ch03aCopier(f,d,f.NOM,{projet:p.ID}); await ch03aSupprimer(f); toast('« '+f.NOM+' » classé en phase '+x.n+' · '+x.lib+'.'); return true; }
const SG_ENQUETE=[['Formulaire Att_CO','doc','Formulaire Att_CO'],['Questionnaire général','list','Questionnaire général'],['Questionnaire particulier','list','Questionnaire particulier'],['Plan de situation','map','Plan de situation'],['Plans (niveaux, façades, coupes)','ruler','Plans'],['Annexes','folder','Annexes']];
const SG_FAISA_RUB=[['fb','Documents de base','folder'],['fe','Études','doc'],['fv','Variantes','dup'],['fp','Présentation au client','pdf']];
/* module Faisabilité (21.10.2026, demande de Paulo) : UNIQUEMENT pour un projet relié à un contrat d'honoraires de faisabilité (non annulé) —
   type de prestation « Faisabilité » coché dans le calcul d'honoraires (checks.ch_chk_faisa), prestations 4.21 Faisabilité saisies (c.fais), ou
   contrat intitulé « … faisabilité … » ; garde-fou : documents déjà déposés dans Faisabilité (ils restent accessibles). Les contrats vivent
   dans le cadre Facturation : tant qu'il n'est pas chargé, on le charge et la page du projet est redessinée (sgFaisaPlusTard). Remplace les
   règles « projet classé faisabilité » et « phase de faisabilité » du 20–21.10.2026. */
const sgContratFaisa=c=>{ const ck=(c&&c.detail&&c.detail.checks)||(c&&c.ouvrages&&c.ouvrages[0]&&c.ouvrages[0].detail&&c.ouvrages[0].detail.checks)||{};
  return !!ck.ch_chk_faisa||(Array.isArray(c.fais)&&c.fais.some(x=>x&&(+x.amt>0||String(x.lbl||'').trim())))||/faisabilit/i.test(c.projet||''); };
let SG_FZ_ATT=false;
function sgFaisaPlusTard(p){ if(SG_FZ_ATT) return; SG_FZ_ATT=true;
  fxEnsure().then(()=>{ SG_FZ_ATT=false; if(fxData()&&VIEW&&VIEW.id==='nx-pdom'&&String(VIEW.arg||'').split('|')[0]===String(p.ID)) go('nx-pdom',VIEW.arg); }).catch(()=>{ SG_FZ_ATT=false; }); }
function sgFaisaOk(p){ const D=fxData();
  if(D){ if(sgContratsDuProjet(p,D).some(c=>!c.annule&&sgContratFaisa(c))) return true; } else sgFaisaPlusTard(p);
  try{ const d=ch03aDossier('document',p.ID,'Faisabilité'); return DS.all('depotfichier').some(f=>String(f.DOSSIER).startsWith(d)); }catch(_){ return false; } }
function sgOuvrirDomaine(p,dom){ go('nx-pdom',p.ID+'|'+dom); }   // 18.10.2026 : page du projet (domaine en pleine page), « Tous les projets » retiré du menu
VIEWS['nx-projet']={
  render(m,arg){ const p=DS.get('project',arg); if(!p){ nxPage(m,'<div class="nx-empty">Projet introuvable. Choisissez un projet avec ⌘K.</div>'); return; }
    VIEW.nxTitle=(p.NUMBER?p.NUMBER+' · ':'')+(p.TITLE||''); nxRecent('p',p.ID);
    /* projet uniquement de faisabilité (catégorie « faisabilité », sgCatProjet d'après le titre) : ni Projet ni Chantier (20.10.2026) */
    const fSeule=sgCatProjet(p)==='faisabilite', okP=k=>SG_ONGLETS.some(o=>o[0]===k)&&sgOngletOk(k)&&(k!=='faisa'||sgFaisaOk(p))&&!(fSeule&&(k==='projet'||k==='chantier')),   /* onglet retiré de SG_ONGLETS : jamais affiché, même mémorisé */ ong0=(o0=>o0==='phases'?'factu':o0==='docs'?(fSeule?'faisa':'projet'):o0)(nxLS.get('sg3_fiche_onglet','vue')), ong=okP(ong0)?ong0:(SG_ONGLETS.map(o=>o[0]).find(okP)||'vue'), mo=projMO(p), pin=nxPinned('p',p.ID), modif=sgAdmin()||sgDroit('projets_modifier','tous')||(sgDroit('projets_modifier','siens')&&sgMesProjets().has(String(p.ID)));
    const html='<div class="nx-hero"><div class="sg-pnum" title="Numéro du projet">'+(p.NUMBER?nxE(p.NUMBER):'—')+'</div><div class="tx">'   /* grand numéro complet et filet noir (20.10.2026, variante C choisie par Paulo ; avant : pavé bleu nuit tronqué à 5 caractères, puis cartouche D le même jour) */
      +'<h2>'+nxE(p.TITLE||p.NUMBER)+'</h2><div class="meta">'
      /* 20.10.2026 : numéro, état, date et phase actuelle retirés de l'en-tête ; le maître de l'ouvrage (intervenants au rôle 8) nommé comme tel */
      +((L=>'<span class="sg-mo">'+nxSvg('person')+'Maître de l’ouvrage'+(L.length>1?'s':'')+' : <b>'+(L.length?L.map(nxE).join(', '):'—')+'</b></span>')([...new Set(DS.by('projectmember','PROJECT_ID',p.ID).filter(x=>x.TEAMROLECODE===8&&x.CONTACT_ID!=null).map(x=>contactName(DS.get('contact',x.CONTACT_ID))).filter(Boolean))]))
      +(p.LOCATION?'<span>'+nxSvg('map')+nxE(p.LOCATION)+'</span>':'')+(+p.ISINTERNAL?'<span class="nx-tag">Interne</span>':'')+'</div>'
      /* frise du mandat sous le maître de l'ouvrage (20.10.2026, proposition F) : mois de la première et de la dernière heure introduites dans
         l'app, petite frise, durée en mois comptés du premier au dernier mois (« 1 an 11 mois ») ; dates exactes en infobulle ; rien sans heure */
      +sgFriseHeures(DS.by('timelog','PROJECT_ID',p.ID))
      +'</div></div>'   /* indications « Coût au-delà des honoraires », « Facturation en retard », « phases hors budget » retirées de l'en-tête (20.10.2026) */   /* 19.10.2026 : boutons Facturer, PV de chantier, épingle, « … » et Modifier retirés du tableau de bord */
      +'<div class="sg-onglets">'+SG_ONGLETS.filter(o=>okP(o[0])).map(([k,t])=>'<button data-fn="o_'+k+'" class="'+(k===ong?'on':'')+'">'+t+'</button>').join('')+'</div><div id="sg-onglet"><div class="nx-empty">…</div></div>';
    const pg=nxPage(m,html);
    SG_ONGLETS.forEach(([k])=>pg._fn['o_'+k]=()=>{ nxLS.set('sg3_fiche_onglet',k); pg.querySelectorAll('.sg-onglets button').forEach(b=>b.classList.toggle('on',b.dataset.fn==='o_'+k)); sgOnglet(p,k,pg); });
    Object.assign(pg._fn,{edit:()=>editProject(p),temps:()=>sgSaisieRapide({projet:p.ID}),pin:b=>{ const on=nxTogglePin('p',p.ID); b.classList.toggle('on',on); },
      facturer:()=>fxEnsure().then(()=>{ const cs=sgContratsDuProjet(p,fxData()); if(cs.length===1) go('fx-saisie','nf:'+cs[0].id); else if(cs.length>1) popMenu(pg.querySelector('[data-fn=facturer]'),cs.map(c=>({t:'Contrat '+(c.affaire||'')+' — '+(c.nom||c.projet||''),fn:()=>go('fx-saisie','nf:'+c.id)}))); else sgConfirm('Aucun contrat d’honoraires n’est relié à '+p.NUMBER+'.\nCréer un contrat pour ce projet ?',()=>go('fx-calchono','newaff:'+p.NUMBER),{title:'Facturer',yesText:'Nouveau contrat'}); }),
      pv:()=>go('fx-pv-chantier','pv:'+p.NUMBER),
      more:b=>popMenu(b,[{t:'Domaines du projet',fn:()=>go('nx-pdom',String(p.ID))},{t:'Intervenants …',fn:()=>cfgMembers(p)},{t:'Phases …',fn:()=>cfgPhases(p)},{t:'Activités …',fn:()=>cfgActivities(p)},{t:'Tarifs de facturation …',fn:()=>cfgRates(p)},{t:'Subdivisions …',fn:()=>cfgSubprojects(p)},'-',
        {t:'Contrôle des coûts',fn:()=>go('coco',{project:p.ID})},{t:'Rentabilité des projets',fn:()=>go('nx-renta')}])});
    sgOnglet(p,ong,pg);
    },
  refresh(ts){ if(hit(ts,'project','projectmember','projectphase','projectsubphase','timelog','projectcost','projectcontract','projectnote','projecttask','depotfichier')) go('nx-projet',VIEW.arg); }
};
/* fiche d'un contrat d'honoraires Facturation (20.10.2026) : état (Annulé / Terminé / Signé le … / Envoyé / Brouillon, comme les cases de la
   liste des contrats de Facturation), nature (Contrat / Avenant = dernière version créée après une signature — marque
   `avenant` de la version, posée par Facturation depuis le 20.10.2026, sinon signedV antérieur à la dernière version), rémunération (mode du
   chapitre « Mode de calcul » ; non enregistré = forfait relatif, le défaut de Facturation), date du contrat (c.date, sinon date de la dernière
   version), état (Annulé / Signé [le …] / Envoyé, non signé / Non signé) */
function sgContratInfo(c){ const V=Array.isArray(c.versions)&&c.versions.length?c.versions:[{v:1,date:c.date||''}], last=V[V.length-1], n=last.v||V.length, sv=c.signedV&&c.signedV.v;
  const av=!!(last.avenant||(sv&&n>sv)), t=sgRemuType(c), R={relatif:'Forfait relatif',forfait:'Forfait',unitaire:'Unitaire'};
  const signeLe=c.signe?last.signeLe||'':'';
  return {avenant:av, v:n, versions:V.length, nature:av?'Avenant':'Contrat', nTitre:V.length>1?'Version '+n+' sur '+V.length+(av?' — version créée après la signature':''):'',
    remu:R[t||'relatif'], rTitre:t?'':'Mode de rémunération non enregistré dans ce contrat : forfait relatif, le mode par défaut de Facturation',
    date:c.date||last.date||'', dTitre:!c.date&&last.date?'Date de la version '+n:'',
    etat:c.annule?'Annulé':c.termine?'Terminé':c.signe?'Signé'+(signeLe?' le '+dfr(signeLe):''):c.envoye?'Envoyé':'Brouillon',   // états de Facturation (20.10.2026)
    cl:c.annule?'':c.termine||c.signe?'s2':c.envoye?'s3':'', signeLe, com:String(last.comment||'').trim(),   // com : commentaire de la dernière version (20.10.2026)
    ...(()=>{ /* tarif horaire moyen brut (chapitre « Tarifs horaires » du calcul d'honoraires, ch_tarif_moyen, commun aux parties) et rabais % du contrat
                 (c.rabais) ; tarif avec rabais en infobulle (21.10.2026) — contrats de l'ancien formulaire : tarif non enregistré */
      const inp=(c.detail&&c.detail.inputs)||(c.ouvrages&&c.ouvrages[0]&&c.ouvrages[0].detail&&c.ouvrages[0].detail.inputs)||null, tf=inp&&inp.ch_tarif_moyen!=null&&inp.ch_tarif_moyen!==''?+inp.ch_tarif_moyen:null, rb=c.rabais!=null&&c.rabais!==''?+c.rabais:null;
      return {tarif:tf, rabais:rb, tTitre:tf==null?'Tarif horaire non enregistré dans ce contrat (ancien formulaire du calcul d’honoraires)':rb?'Avec rabais : Fr. '+num(tf*(1-rb/100),2)+' / heure':''}; })()}; }
/* onglet Factures ▸ tuiles (20.10.2026, choix de Paulo) : 1re ligne Facturé (TTC, % des honoraires TTC), Encaissé (TTC, factures payées, % du
   facturé), Solde à facturer (TTC, honoraires − facturé ; ces trois tuiles viennent de l'onglet Contrats), Facturé / consommé (les chiffres de
   « Facturation en retard » : facturé HT ÷ honoraires HT et coût de revient ÷ honoraires HT ; jauge : facturé en bleu nuit, repère = consommé) ;
   2e ligne Ouvert (factures non payées), Échu (non payées, échéance passée, en rouge), Dernière facture (date, n°), Délai moyen de paiement
   (date de facture → date de paiement, factures payées qui ont les deux dates) */
/* onglet Factures ▸ « À facturer selon les heures » (20.10.2026) : heures facturables (cochées « Facturable », plafonnées par phase aux heures du
   contrat pour un forfait — même règle que la Part facturable) × tarif horaire du contrat (« Tarif horaire moyen » h de Facturation, moins le
   rabais du contrat), TTC (TVA du contrat), moins le facturé TTC (sans frais, comme sgRenta). Plusieurs contrats : chaque heure va au contrat qui
   couvre sa phase partielle (sinon sa phase), à défaut au dernier contrat qui a un tarif. Contrats de l'ancien formulaire : aucun tarif enregistré
   → null (« — »). */
function sgAFacturerHeures(p,D,x){ const cs=(x.cs||[]).filter(c=>!c.annule);
  const tarif=c=>{ const i=(c.detail&&c.detail.inputs)||{}, h=parseFloat(i.ch_h)||parseFloat(i.ch_tarif_moyen)||0;
    return h?{h,rab:+c.rabais||parseFloat(i.ch_rabais)||0,tva:c.tva!=null&&c.tva!==''&&isFinite(+c.tva)?+c.tva:8.1}:null; };
  const C=cs.map(c=>{ const S=new Set(), G=new Set(); Object.entries(c.phases||{}).forEach(([k,v])=>{ const m=/^4(\d)(\d)?/.exec(k); if(!m||!(+v>0)) return; G.add(+m[1]); if(m[2]) S.add(+(m[1]+m[2])); }); return {c,t:tarif(c),S,G}; });
  const avecT=C.filter(o=>o.t); if(!avecT.length) return null;
  const parDef=avecT.slice().sort((a,b)=>cmp(String(b.c.date||''),String(a.c.date||'')))[0], raw={}, rawPh={};
  DS.by('timelog','PROJECT_ID',p.ID).forEach(r=>{ if(!+r.ISCHARGEABLE) return; const v=+r.TIMEPERIOD||0;
    const sp=r.SUBPHASE_ID!=null?DS.get('projectsubphase',r.SUBPHASE_ID):null, f=r.PHASE_ID!=null?DS.get('projectphase',r.PHASE_ID):null;
    const ns=sp?parseFloat(sp.NUMBER):NaN, ng=f?(parseFloat(f.NUMBER)||sgSiaGroupe(f)):null;
    const o=(isFinite(ns)&&C.find(o=>o.S.has(ns)))||(ng&&C.find(o=>o.G.has(+ng)))||parDef, kp=r.PHASE_ID==null?'':String(r.PHASE_ID);
    const k=C.indexOf(o)+'|'+kp; raw[k]=(raw[k]||0)+v; rawPh[kp]=(rawPh[kp]||0)+v; });
  const forfait=cs.some(c=>(sgRemuType(c)||'relatif')!=='unitaire'), bud={};
  if(forfait) DS.by('projectphase','PROJECT_ID',p.ID).forEach(f=>{ if(+f.TIMEBUDGET>0) bud[f.ID]=+f.TIMEBUDGET; });
  const ratio=kp=>forfait&&bud[kp]!=null&&rawPh[kp]>bud[kp]?bud[kp]/rawPh[kp]:1;
  let h=0, sans=0, ht=0, ttc=0, dep=0; const T=new Map();
  Object.entries(raw).forEach(([k,v])=>{ const [i,kp]=k.split('|'), o=C[+i], hh=v*ratio(kp); dep+=v-hh; if(!o||!o.t){ sans+=hh; return; }
    const r=o.t.h*(1-o.t.rab/100); h+=hh; ht+=hh*r; ttc+=hh*r*(1+o.t.tva/100); T.set(o,(T.get(o)||0)+hh); });
  if(!h) return {h:0,sans,ht:0,ttc:0,diff:-(x.factTTC||0),tarifs:'',dep};
  const tarifs=[...T.keys()].map(o=>(T.size>1?o.c.id+' : ':'')+num(o.t.h,2)+' CHF/h'+(o.t.rab?' − '+num(o.t.rab,0)+' %':'')).join(' ; ');
  return {h,sans,ht,ttc,diff:ttc-(x.factTTC||0),tarifs,dep}; }
function sgFactKpis(x,ah,an){ const ttc=f=>+f._ttc||+f.ttc||0, auj=today();   // TTC comme sgRenta (sans frais) : ouvert + encaissé = facturé
  /* an (20.10.2026) : année choisie dans l'onglet Factures — tuiles des factures (facturé, encaissé, ouvert, échu, dernière facture, délai) sur les
     factures datées de cette année, année ajoutée au libellé ; tuiles du contrat (solde à facturer, à facturer selon les heures, facturé / consommé)
     toujours sur tout le projet */
  const fs=(x.fs||[]).filter(f=>!an||String(f.date||'').slice(0,4)===an), A=an?' '+an:'';
  const fT=an?fs.reduce((s0,f)=>s0+ttc(f),0):x.factTTC, eT=an?fs.filter(f=>!fxUnpaid(f)).reduce((s0,f)=>s0+ttc(f),0):x.encTTC;
  const ouv=fs.filter(fxUnpaid), ech=ouv.filter(f=>f.ech&&f.ech<auj), pay=fs.filter(f=>!fxUnpaid(f)&&f.date&&f.date_paiement);
  const der=fs.filter(f=>f.date).sort((a,b)=>cmp(b.date,a.date))[0], jours=(a,b)=>Math.round((new Date(b)-new Date(a))/864e5);
  const delai=pay.length?pay.reduce((s0,f)=>s0+Math.max(0,jours(f.date,f.date_paiement)),0)/pay.length:null, T=x.contratTTC, sum=L=>L.reduce((s0,f)=>s0+ttc(f),0);
  const pc=(a,b)=>b?Math.round(a/b*100)+' %':'—', retard=x.conso!=null&&x.fact!=null&&x.conso-x.fact>0.25;
  const jauge=(()=>{ if(x.conso==null||x.fact==null) return ''; const m=Math.max(1,x.conso,x.fact); return '<div class="sg-kg"><i class="ef" style="width:'+(x.fact/m*100).toFixed(1)+'%"></i><i class="mk'+(retard?' r':'')+'" style="left:'+(x.conso/m*100).toFixed(1)+'%"></i></div>'; })();
  return '<div class="nx-kpis sg-fkpis">'
    +nxKpi('receipt','Facturé'+A+' (TTC)',nxCHF(fT)+'<small>CHF</small>',pc(fT,T)+' des honoraires',T?fT/T*100:null,null,1)
    +nxKpi('wallet','Encaissé'+A+' (TTC)',nxCHF(eT)+'<small>CHF</small>',pc(eT,fT)+' du facturé',fT?eT/fT*100:null)
    +nxKpi('coins','Solde à facturer (TTC)',T?nxCHF(T-x.factTTC)+'<small>CHF</small>':'—',T?pc(T-x.factTTC,T)+' des honoraires':'aucun contrat relié',T?Math.max(0,(T-x.factTTC)/T*100):null)
    +(ah===undefined?'':nxKpi('timer','À facturer selon les heures',ah?'<span'+(ah.diff<0?' class="sg-pos"':'')+'>'+nxCHF(ah.diff)+'</span><small>CHF</small>':'—',
        ah?(ah.diff>=0?'valeur des heures − facturé':'facturé d’avance sur les heures'):'tarif horaire non enregistré')
      .replace('<div class="nx-kpi','<div title="'+nxE(ah?nxH(ah.h)+' h facturables au tarif du contrat ('+(ah.tarifs||'—')+') = '+nxCHF(ah.ht)+' CHF HT, '+nxCHF(ah.ttc)+' CHF TTC ; facturé '+nxCHF(x.factTTC||0)+' CHF TTC'
          +(ah.dep>0.05?' — '+nxH(ah.dep)+' h au-delà des heures du contrat (forfait) non comptées':'')+(ah.sans>0.05?' — '+nxH(ah.sans)+' h d’un contrat sans tarif horaire non comptées':'')
          :'Le contrat de Facturation relié n’a pas de tarif horaire enregistré (ancien formulaire) : montant impossible à calculer.')+'" class="nx-kpi'))
    +nxKpi('trend','Facturé / consommé',x.fact!=null?Math.round(x.fact*100)+'<small>%</small> / '+Math.round(x.conso*100)+'<small>%</small>':'—',x.fact!=null?'consommé = coût de revient ÷ honoraires HT':'aucun contrat relié').replace(/<\/div>$/,jauge+'</div>')
    +nxKpi('receipt','Ouvert'+A+' (TTC)',nxCHF(sum(ouv))+'<small>CHF</small>',ouv.length?ouv.length+' facture'+(ouv.length>1?'s':'')+' non payée'+(ouv.length>1?'s':''):'tout est payé')
    +nxKpi('clock','Échu'+A+' (TTC)','<span'+(ech.length?' class="sg-neg"':'')+'>'+nxCHF(sum(ech))+'</span><small>CHF</small>',ech.length?ech.length+' facture'+(ech.length>1?'s':'')+' à échéance dépassée':'aucune échéance dépassée')
    +nxKpi('cal','Dernière facture'+A,der?dfr(der.date):'—',der?(der.num||'')+(der.type?' · '+der.type:''):'aucune facture').replace('<div class="v">','<div class="v dt">')
    +nxKpi('clock','Délai moyen de paiement'+A,delai!=null?Math.round(delai)+'<small>jours</small>':'—',pay.length?'sur '+pay.length+' facture'+(pay.length>1?'s':'')+' payée'+(pay.length>1?'s':''):'aucune date de paiement saisie')
    +'</div>'; }
/* « Ouvrir » un contrat depuis le projet (20.10.2026) : le contrat en PDF fidèle (lecture seule, openContratPdf du cadre), DERNIÈRE version
   seulement — le contrat signé ou, s'il y en a une après la signature, le dernier avenant — sans le choix des autres versions ; état de la version à
   la place du commentaire ; en fermant l'aperçu, retour à l'écran d'où l'on venait. Arg de fx-contrats : « cv:<id> ». */
function sgVoirContrat(w,id){ const c=((fxData()||{}).c||[]).find(x=>x.id===id);   /* « contrats » n'est pas une propriété du cadre (let) */
  if(!c){ toast('Contrat introuvable.',true); return; }
  const V=w.chGetVersions(c), i=V.length-1, v=V[i]||{}, n=v.v||i+1, sv=c.signedV&&c.signedV.v;
  const ci=sgContratInfo(c), etat=ci.nature+' — '+ci.etat.toLowerCase()+(sv&&n>sv?' ; la version '+sv+' est signée':'');
  w.openContratPdf(id,i);
  const sel=w.document.getElementById('offre-version'); if(sel){ sel.style.display='none'; sel.innerHTML=''; }
  const cm=w.document.getElementById('offre-version-comment'); if(cm) cm.textContent=etat+(V.length>1?' · version '+n+(v.date?' du '+dfr(v.date):''):'');
  if(!w._sgCloseOffre){ w._sgCloseOffre=w.closeOffre; w.closeOffre=function(){ const r=w._sgCloseOffre.apply(this,arguments); if(w._sgRetour){ w._sgRetour=false; if(VIEW&&VIEW.id==='fx-contrats') nxHist(-1); } return r; }; }
  w._sgRetour=NX.pos>0; }
/* icônes de l'onglet Heures (20.10.2026) : phases = escalier, collaborateur × phase = grille */
Object.assign(NXI,{escalier:'<path d="M3 20.5h5v-5h5v-5h5v-5h3"/>',grille:'<rect x="3" y="4" width="18" height="16"/><path d="M3 9.5h18M3 15h18M9 4v16"/>'});
const SG_CGRP={};   // Chantier : rubriques ouvertes par projet (le temps de la session de l'onglet)
function sgOnglet(p,k,pg,cible){ const box=cible||pg.querySelector('#sg-onglet'); const set=h0=>{ box.innerHTML=h0; };   // cible : partie d'un onglet regroupé (20.10.2026)
  const now=new Date(), taux=sgTaux(), logs=DS.by('timelog','PROJECT_ID',p.ID);
  /* onglet « Contrats & factures » = tuiles financières, « Phases contrat », contrats d'honoraires et factures (regroupés le 20.10.2026) ;
     sans droit de lecture des contrats ni des factures (collaborateur par défaut) : les phases seules, comme l'ancien onglet « Phases contrat » */
  if(k==='factu'&&!cible&&!sgFactuOk()){ sgOnglet(p,'phases',pg); return; }
  /* onglet « Factures » (20.10.2026) : factures du projet (contrats reliés), « Facturation en retard » sous le tableau ; jamais pour le collaborateur
     (SG_ONGLETS_COLLAB), droit « factures : lecture » ; protégé par le code d'accès comme les finances */
  if(k==='fact'){ if(sgFinVerrou()){ set('<div class="nx-empty">'+nxSvg('lock')+'<p>Contrats, factures et rentabilité sont protégés par le code d’accès.</p><button class="nx-btn pri" data-fn="deverr">Déverrouiller</button></div>'); pg._fn.deverr=()=>sgDeverrouiller().then(ok=>{ if(ok) sgOnglet(p,k,pg); }); return; }
    set('<div class="nx-empty">Recherche dans la facturation…</div>');
    fxEnsure().catch(()=>null).then(()=>{ const D=fxData(), x=sgRenta(p,D,taux); if(!box.isConnected) return;
      const ret=x.al.filter(a=>/^Facturation en retard/.test(a[1]));
      /* colonne « Contrat » (20.10.2026) : seulement si les factures relèvent de plusieurs contrats (p. ex. 17QUE : projet et enquête / réalisation) ;
         libellé = phases SIA du contrat (sgContratPhLib), sinon son code ; même libellé pour deux contrats → année du contrat ajoutée */
      const cIds=[...new Set(x.fs.map(f=>String(f.contrat_id||'')))].filter(Boolean), colC=cIds.length>1, cById=new Map(x.cs.map(c=>[String(c.id),c]));
      const libs=new Map(cIds.map(id=>{ const c=cById.get(id); return [id,(c&&sgContratPhLib(c))||id]; })), vus={}; [...libs.values()].forEach(l=>{ vus[l]=(vus[l]||0)+1; });
      cIds.forEach(id=>{ const c=cById.get(id), l=libs.get(id); if(vus[l]>1&&c&&c.date) libs.set(id,l+' · '+String(c.date).slice(0,4)); });
      const libC=f=>{ const id=String(f.contrat_id||''), c=cById.get(id); return '<td title="'+nxE(c?'Contrat '+c.id+(c.date?' du '+dfr(c.date):'')+(c.projet?' — '+c.projet:''):'')+'">'+nxE(libs.get(id)||id)+'</td>'; };
      /* Factures par année (20.10.2026) : « Toutes » puis les années des factures, de la plus récente (même présentation que les années de l'onglet
         Heures, .sg-an) ; une année choisie : tableau « Factures · 2025 » et tuiles des factures de cette année (voir sgFactKpis) ; choix gardé
         (sg3_fact_an), « Toutes » si le projet n'a pas de facture cette année-là ; sans choix si toutes les factures sont de la même année */
      const anF=f=>String(f.date||'').slice(0,4), ansF=[...new Set(x.fs.map(anF).filter(y=>/^\d{4}$/.test(y)))].sort().reverse();
      const fanS=String(nxLS.get('sg3_fact_an','')||''), fan=ansF.length>1&&ansF.includes(fanS)?fanS:'', fsA=fan?x.fs.filter(f=>anF(f)===fan):x.fs;
      const selAnF=ansF.length>1?'<span class="sg-an" role="group" aria-label="Année">'+[['','Toutes']].concat(ansF.map(y=>[y,y])).map(([v,t])=>{ const on=v===fan;
        return '<button data-fan="'+v+'" class="'+(on?'on':'')+'" aria-pressed="'+on+'" title="'+(v?'Factures datées de '+v:'Toutes les factures du projet')+'">'+t+'</button>'; }).join('')+'</span>':'';   // « Facturation en retard » sous le tableau (20.10.2026)
      set(sgFactKpis(x,sgAFacturerHeures(p,D,x),fan)+'<div class="nx-grid">'+nxCard('c12','Factures'+(fan?' · '+fan:''),(fsA.length?'<div class="b flush"><table class="nx-tbl"><tr><th>Numéro de facture</th>'+(colC?'<th>Contrat</th>':'')+'<th>Type</th><th>Date</th><th>Échéance</th><th class="r">TTC</th><th>Statut</th></tr>'+fsA.sort((a,b)=>cmp(b.date,a.date)).map(f=>'<tr class="nx-row" data-go="fx-saisie" data-arg="f:'+nxE(f.id)+'" style="display:table-row"><td><b>'+nxE(f.num||'')+'</b></td>'+(colC?libC(f):'')+'<td>'+nxE(f.type||'')+'</td><td>'+(f.date?dfr(f.date):'')+'</td><td>'+(f.ech?dfr(f.ech):'')+'</td><td class="r">'+nxCHF((+f._ttc||0)+(+f._fttc||0))+'</td><td>'+(fxUnpaid(f)?'<span class="nx-tag '+(f.ech&&f.ech<today()?'urg':'s3')+'">'+nxE(f.statut||'Ouverte')+'</span>':'<span class="nx-tag s2">Payée</span>')+'</td></tr>').join('')+'</table></div>':'<div class="nx-empty">Aucune facture.</div>')+(ret.length?'<div class="sg-fact-ret">'+ret.map(sgAlerteTag).join(' ')+'</div>':''),selAnF)+'</div>');
      box.querySelectorAll('[data-fan]').forEach(b=>b.onclick=()=>{ nxLS.set('sg3_fact_an',b.dataset.fan); sgOnglet(p,'fact',pg); }); }); return; }   /* lien « Toutes les factures » retiré du titre (20.10.2026) */
  if(k==='factu'&&sgFinVerrou()){ set('<div class="nx-empty">'+nxSvg('lock')+'<p>Contrats, factures et rentabilité sont protégés par le code d’accès.</p><button class="nx-btn pri" data-fn="deverr">Déverrouiller</button></div><div class="sg-oc-ph" id="sg-oc-ph"></div>'); pg._fn.deverr=()=>sgDeverrouiller().then(ok=>{ if(ok) sgOnglet(p,k,pg); }); sgOnglet(p,'phases',pg,box.querySelector('#sg-oc-ph')); return; }
  if(k==='vue'){ const lim30=dayKey(new Date(now.getFullYear(),now.getMonth(),now.getDate()-30)); let tot=0,h30=0; const bySt={}, byM={};
    logs.forEach(r=>{ const v=+r.TIMEPERIOD||0, d=tlDate(r); tot+=v; if(tlKey(r)>=lim30) h30+=v; bySt[r.STAFF_ID]=(bySt[r.STAFF_ID]||0)+v; const mk=d.getFullYear()*12+d.getMonth(); byM[mk]=(byM[mk]||0)+v; });
    const mks=Object.keys(byM).map(Number), mEnd=now.getFullYear()*12+now.getMonth(), mStart=Math.max(mks.length?Math.min(...mks):mEnd-11,mEnd-23), months=[];
    for(let i=Math.min(mStart,mEnd-11);i<=mEnd;i++) months.push({l:MOISL[i%12]+' '+Math.floor(i/12),s:MOIS[i%12].replace('.',''),a:byM[i]||0,y:Math.floor(i/12),m:i%12});
    const team=Object.entries(bySt).map(([id,v])=>({s:DS.get('staff',id),v})).filter(x=>x.s).sort((a,b)=>b.v-a.v);
    const hPrev=DS.by('projectphase','PROJECT_ID',p.ID).reduce((a,f)=>a+(+f.TIMEBUDGET||0),0);   // temps contractuel prévu = Σ des heures au contrat des phases (19.10.2026)
    /* tuiles sans texte gris (retiré à la demande le 19.10.2026) : le détail est dans l'infobulle */
    const kpiT=(ico,l,v,det,bar,hero)=>nxKpi(ico,l,v,null,bar,null,hero).replace('<div class="nx-kpi','<div'+(det?' title="'+nxE(det)+'"':'')+' class="nx-kpi');
    /* tuiles revues (20.10.2026) : toutes au même style (plus de tuile foncée), heures entières ; « Heures saisies » porte la jauge saisies / prévues
       (bleu nuit jusqu'à la limite du contrat, rouge au-delà, repère de la limite) et la pastille du % consommé — la barre sous « Heures prévues » est retirée */
    const kpiJauge=(hp,v)=>{ if(!hp) return ''; const m=Math.max(hp,v), a=Math.min(v,hp)/m*100, d=v>hp?(v-hp)/m*100:0; return '<div class="sg-kg"><i class="ef" style="width:'+a.toFixed(2)+'%"></i>'+(d?'<i class="dp" style="left:'+a.toFixed(2)+'%;width:'+d.toFixed(2)+'%"></i>':'')+'<i class="mk" style="left:'+(hp/m*100).toFixed(2)+'%"></i></div>'; };
    const kpiPct=(hp,v)=>hp?'<span class="sg-kq'+(v>hp?' dep':'')+'">'+Math.round(v/hp*100)+' %</span>':'';
    set('<div class="nx-kpis sg-pkpis" id="sg-p-kpis">'+((hp,pc)=>kpiT('contrat','Heures prévues',hp?sgHr(hp)+'<small>h</small>':'—',hp?'Heures au contrat des phases : '+nxH(hp)+' h':'aucune heure prévue au contrat'))(hPrev)+kpiT('clock','Heures saisies',sgHr(tot)+'<small>h</small>',nxH(tot)+' h saisies, dont '+nxH(h30)+' h ces 30 derniers jours'+(hPrev?' — '+(tot>hPrev?'+'+nxH(tot-hPrev)+' h au-delà des heures prévues':nxH(hPrev-tot)+' h restantes')+' ('+Math.round(tot/hPrev*100)+' % des heures prévues)':'')).replace('</div><div class="v">',kpiPct(hPrev,tot)+'</div><div class="v">').replace(/<\/div>$/,kpiJauge(hPrev,tot)+'</div>')/* « Part facturable » déplacée dans l'onglet Contrats & factures (20.10.2026) */+((pa0=>sgTermine(p)?kpiT('gauge','Phase actuelle','Terminé',sgEtatLib(p)):kpiT('gauge','Phase actuelle',pa0?nxE(nm(pa0.ph)):'—',pa0?'D’après les heures saisies : '+sgPhaseLib(pa0)+(pa0.recent?'':' (dernière saisie le '+dfr(diso(pa0.date))+')'):'Aucune heure saisie par phase'))(sgPhaseActuelle(p)).replace('<div class="v">','<div class="v txt">'))+'</div>'   /* coût de revient, facturé et marge bénéficiaire retirés de la vue d'ensemble (19.10.2026) */
      +'<div class="nx-grid"><div class="c8 sg-pcol">'   /* 19.10.2026 : à gauche les phases puis le temps par mois, à droite l'équipe */+nxCard('c12','Phases : heures prévues et effectuées','<div class="b">'+sgPhasesGraph(p)+'</div>')+nxCard('c12','Heures par mois','<div class="b">'+sgMoisGraph(months)+'</div>')+'</div><div class="c4 sg-pcol">'
      +nxCard('c12','Équipe','<div class="b flush">'+(team.length?team.slice(0,9).map(x=>'<div class="nx-person sg-eq" data-ref="s:'+x.s.ID+'" title="'+nxE(staffName(x.s)+' : '+nxH(x.v)+' h, '+Math.round(x.v/tot*100)+' % des heures du projet')+'"><div class="nx-av">'+nxE(nxIni(staffName(x.s)))+'</div><div class="t"><b>'+nxE(staffName(x.s))+'</b><span class="sg-eq-b"><i style="width:'+Math.max(1,x.v/tot*100).toFixed(1)+'%"></i></span></div><span class="m"><b>'+sgHr(x.v)+' h</b><small>'+(x.v/tot<.005?'&lt; 1':Math.round(x.v/tot*100))+' %</small></span></div>').join(''):'<div class="nx-empty">Aucune heure saisie.</div>')+'</div>')+'</div></div>');
    return; }
  /* Heures (20.10.2026) : graphisme de la vue d'ensemble — période sur une règle graduée et affichage en tuiles à icône (variante C6
     choisie par Paulo parmi 12 ; essais avant : texte souligné, puis menus déroulants), tuiles
     sans texte gris (détail en infobulle), CSV et Imprimer dans le titre de la carte, en-tête du tableau fixe ; détail limité à 400 lignes
     à l'écran (signalé), l'export CSV du détail contient toutes les saisies de la période */
  if(k==='temps'){ const per=nxLS.get('sg3_fiche_per','12'), grp=nxLS.get('sg3_fiche_grp','det'), lim=per==='tout'?0:dayKey(new Date(now.getFullYear(),now.getMonth()-(+per),now.getDate()));
    /* Par mois ▸ une année entière (liste des années où des heures ont été saisies, 20.10.2026) : tout l'onglet la suit (tuiles comprises), la règle
       « Période » n'a plus de repère actif ; un clic sur la règle revient à une période */
    const ans=[...new Set(logs.map(r=>+r.TIMEYEAR).filter(Boolean))].sort((a,b)=>b-a), anS=nxLS.get('sg3_fiche_an',''), an=grp==='mois'&&ans.includes(+anS)?+anS:null;
    const L0=logs.filter(r=>an?+r.TIMEYEAR===an:tlKey(r)>=lim).sort((a,b)=>tlKey(b)-tlKey(a)||cmp(b.TIMEHOUR1,a.TIMEHOUR1));
    /* Détail ▸ choix du collaborateur (20.10.2026, même présentation que les années) : « Tous » puis les collaborateurs qui ont des heures sur la
       période, du plus d'heures au moins d'heures ; un collaborateur choisi : le détail et les tuiles ne montrent que ses saisies */
    const hC={}; L0.forEach(r=>{ const k0=String(r.STAFF_ID); hC[k0]=(hC[k0]||0)+(+r.TIMEPERIOD||0); });
    const cols=Object.keys(hC).map(k0=>({k:k0,s:DS.get('staff',k0),h:hC[k0]})).filter(x=>x.s).sort((a,b)=>b.h-a.h);
    const colS=nxLS.get('sg3_fiche_col',''), col=grp==='det'&&cols.some(x=>x.k===colS)?colS:'', colN=col?staffName(DS.get('staff',col)):'';
    const L=col?L0.filter(r=>String(r.STAFF_ID)===col):L0, tot=L.reduce((s,r)=>s+(+r.TIMEPERIOD||0),0);
    const perLib=(an?'l’année '+an:{'1':'le dernier mois','3':'les 3 derniers mois','12':'les 12 derniers mois','tout':'toute la durée du projet'}[per]||'la période')+(col?' ('+colN+')':'');
    /* Période : règle graduée (repère carré par période, trait bleu nuit jusqu'au choix) ; Affichage : tuiles à icône (choix souligné en bleu nuit) */
    const PERS=[['1','1 mois'],['3','3 mois'],['12','12 mois'],['tout','Tout']], iP=an?-1:Math.max(0,PERS.findIndex(x=>x[0]===per));
    const regle='<div class="sg-hrow"><em>Période</em><div class="sg-hreg" role="group" aria-label="Période"><span class="l"></span><span class="f" style="width:calc((100% - var(--w)) * '+(Math.max(0,iP)/(PERS.length-1)).toFixed(4)+')"></span>'
      +PERS.map(([v,t],i)=>'<button data-per="'+v+'" class="'+(i===iP?'on':i<iP?'av':'')+'" aria-pressed="'+(i===iP)+'"><i></i>'+t+'</button>').join('')+'</div></div>';
    const tuiles='<div class="sg-hrow"><em>Affichage</em><div class="sg-htls" role="group" aria-label="Affichage">'
      +[['collab','Collaborateur','users','Par collaborateur'],['det','Détail','list','Détail des saisies'],['phase','Phase','escalier','Par phase'],['mois','Mois','cal','Par mois'],['activite','Activité','tag','Par activité'],['croise','Collab. × phase','grille','Collaborateur × phase']]
        .map(([v,t,ico,tt])=>'<button data-grp="'+v+'" class="'+(v===grp?'on':'')+'" aria-pressed="'+(v===grp)+'" title="'+tt+'">'+nxSvg(ico)+'<span>'+t+'</span></button>').join('')+'</div></div>';
    const kpiT=(ico,l,v,det)=>nxKpi(ico,l,v).replace('<div class="nx-kpi','<div'+(det?' title="'+nxE(det)+'"':'')+' class="nx-kpi');
    const bySt={}; L.forEach(r=>{ bySt[r.STAFF_ID]=(bySt[r.STAFF_ID]||0)+(+r.TIMEPERIOD||0); });
    const eq=Object.entries(bySt).map(([id,v])=>({s:DS.get('staff',id),v})).filter(x=>x.s).sort((a,b)=>b.v-a.v);
    const hf=L.reduce((s,r)=>s+(+r.ISCHARGEABLE?+r.TIMEPERIOD||0:0),0), der=L[0], derS=der&&DS.get('staff',der.STAFF_ID);
    const cout=sgTauxVisibles()?L.reduce((s,r)=>s+(+r.TIMEPERIOD||0)*taux(r.STAFF_ID,tlDate(r)),0):null;
    const ligne=r=>{ const s=DS.get('staff',r.STAFF_ID), f=DS.get('projectphase',r.PHASE_ID), spo=DS.get('projectsubphase',r.SUBPHASE_ID), sp=nm(spo)||'', co=r.DESCRIPTION||'';
      /* tri par Phase / Phase partielle dans l'ordre SIA 102 (clé data-tri : numéro de la phase, puis de la phase partielle), 20.10.2026 */
      const kP=f?sgSiaCle(f,1)+' '+nm(f):'', kS=f?sgSiaCle(f,1)+'.'+(spo?sgSiaCle(spo):'999999999')+' '+sp:'';   // + précision de la phase (sous-phase), 20.10.2026   // colonne « Commentaire » : le commentaire seul, sans l'activité (20.10.2026)
      return '<tr><td>'+dfr(diso(tlDate(r)))+'</td><td class="sg-hnom"><b>'+nxE(s?staffName(s):'')+'</b></td><td data-tri="'+nxE(kP)+'">'+nxE(nm(f))+'</td><td class="sg-hsp" data-tri="'+nxE(kS)+'">'+nxE(sp)+'</td><td class="sg-hact">'+nxE(co)+'</td><td class="r"><b>'+nxH(r.TIMEPERIOD)+' h</b></td></tr>'; };   /* colonnes Facturable et Statut retirées (20.10.2026) */
    const ent='<tr><th>Date</th><th>Collaborateur</th><th>Phase</th><th title="Sous-phase de la saisie">Phase partielle</th><th>Commentaire</th><th class="r">Durée</th></tr>';
    /* Par mois ▸ liste des années où des heures ont été saisies (20.10.2026) : « Période choisie » (la règle) ou une année entière, quelle que soit la période */
    const LT=L;
    const titre={det:'Saisies'+(col?' · '+colN:''),collab:'Heures par collaborateur',phase:'Heures par phase',mois:'Heures par mois'+(an?' · '+an:''),activite:'Heures par activité',croise:'Heures par collaborateur et par phase'}[grp]||'Saisies';
    /* années en texte souligné (variante B, 20.10.2026) : « Période » puis chaque année saisie, l'année choisie en gras soulignée bleu nuit */
    const selAn=grp==='mois'&&ans.length>1?'<span class="sg-an" role="group" aria-label="Année">'+[['','Période']].concat(ans.map(y=>[String(y),String(y)])).map(([v,t])=>{ const on=v===''?!an:+v===an;
      return '<button data-an="'+v+'" class="'+(on?'on':'')+'" aria-pressed="'+on+'" title="'+(v?'Toutes les heures de '+v+' (tuiles comprises)':'Période choisie sur la règle')+'">'+t+'</button>'; }).join('')+'</span>':'';
    const selCol=grp==='det'&&cols.length>1?'<span class="sg-an" role="group" aria-label="Collaborateur">'+[['','Tous']].concat(cols.map(x=>[x.k,staffName(x.s)])).map(([v,t])=>{ const on=v===''?!col:v===col;
      return '<button data-col="'+nxE(v)+'" class="'+(on?'on':'')+'" aria-pressed="'+on+'" title="'+nxE(v?'Saisies de '+t+' seulement (tuiles comprises)':'Les saisies de tous les collaborateurs')+'">'+nxE(t)+'</button>'; }).join('')+'</span>':'';
    const acts=selAn+selCol+(LT.length?'<span class="a sg-ha" data-fn="csvt" title="Exporter le tableau en CSV">'+nxSvg('export')+'CSV</span><span class="a sg-ha" data-fn="prnt" title="Imprimer le tableau">'+nxSvg('print')+'Imprimer</span>':'');
    set('<div class="sg-hbar">'+regle+tuiles+'</div>'
      +'<div class="nx-kpis sg-pkpis">'+kpiT('clock','Heures saisies',sgHr(tot)+'<small>h</small>',nxH(tot)+' h saisies sur '+perLib+(hf?', dont '+nxH(hf)+' h facturables':''))
        /* tuile « Saisies » (nombre de saisies) retirée à la demande (20.10.2026) */
        +(col?'':kpiT('users','Collaborateurs',num(eq.length,0),eq.length?eq.map(x=>staffName(x.s)+' : '+nxH(x.v)+' h').join(' · '):'Aucun collaborateur sur '+perLib))   /* un seul collaborateur choisi (Détail) : tuile sans intérêt, retirée (20.10.2026) */
        +kpiT('cal','Dernière saisie',der?dfr(diso(tlDate(der))):'—',der?'Le '+dfr(diso(tlDate(der)))+(derS?' par '+staffName(derS):'')+' ('+nxH(der.TIMEPERIOD)+' h)':'Aucune saisie sur '+perLib).replace('<div class="v">','<div class="v dt">')   /* date à la taille des autres chiffres (20.10.2026) */
        +(cout!=null?kpiT('coins','Coût de revient',nxCHF(cout)+'<small>CHF</small>','Heures × taux interne de chaque collaborateur à la date de la saisie'):'')+'</div>'
      +nxCard('c12 sg-hcard',titre,'<div class="b flush sg-hscroll" id="sg-fiche-sit">'+(LT.length?(grp==='det'?'<table class="nx-tbl sg-htbl">'+ent+L.slice(0,5000).map(ligne).join('')+'</table>':sgSituationHtml(LT,grp,{hier:1,fact:false})):'<div class="nx-empty">Aucune heure sur cette période.</div>')+'</div>'
        +(grp==='det'&&L.length>5000?'<div class="sg-hplus">5\'000 saisies affichées sur '+num(L.length,0)+' — l’export CSV les contient toutes.</div>':''),acts));
    box.querySelectorAll('[data-grp]').forEach(b=>b.onclick=()=>{ nxLS.set('sg3_fiche_grp',b.dataset.grp); sgOnglet(p,'temps',pg); });
    box.querySelectorAll('[data-col]').forEach(b=>b.onclick=()=>{ nxLS.set('sg3_fiche_col',b.dataset.col); sgOnglet(p,'temps',pg); });
    box.querySelectorAll('tr[data-colgo]').forEach(tr=>tr.onclick=()=>{ nxLS.set('sg3_fiche_grp','det'); nxLS.set('sg3_fiche_col',tr.dataset.colgo); sgOnglet(p,'temps',pg); });   // Collaborateur / Collab. × phase → Détail du collaborateur (20.10.2026)
    box.querySelectorAll('[data-an]').forEach(b=>b.onclick=()=>{ nxLS.set('sg3_fiche_an',b.dataset.an); sgOnglet(p,'temps',pg); });
    box.querySelectorAll('[data-per]').forEach(b=>b.onclick=()=>{ nxLS.set('sg3_fiche_per',b.dataset.per); nxLS.set('sg3_fiche_an',''); sgOnglet(p,'temps',pg); });
    pg._fn.csvt=()=>{ let t=box.querySelector('#sg-fiche-sit table'); if(!t) return; if(grp==='det'){ t=document.createElement('table'); t.innerHTML=ent+L.map(ligne).join(''); }
      sgCsvTable(t,'heures_'+p.NUMBER+'_'+diso(now)+'.csv'); };
    pg._fn.prnt=()=>{ const t=box.querySelector('#sg-fiche-sit table'); if(t) sgImprimer('Heures — '+projLabel(p),'<p>'+dfr(diso(now))+' · '+nxE(titre)+' · '+nxE(an?'année '+an:perLib)+'</p>'+t.outerHTML); }; return; }
  /* Phases contrat (19.10.2026) : heures contrat / saisies / écart ; pour l'administrateur et le chef de projet, en HT (la TVA n'est pas un revenu,
     le coût de revient n'en contient pas) : contrat HT (sgContratParPhase), coût de revient, marge bénéficiaire (contrat HT − coût), taux obtenu
     (contrat HT ÷ heures saisies), coût horaire (coût ÷ heures saisies) et comparaison des deux (points reliés en vert = gain, en rouge = perte ;
     repère = coût horaire moyen des collaborateurs sur tout le projet), par phase, sous-phase et pour le projet. */
  if(k==='phases'){ const ph=DS.by('projectphase','PROJECT_ID',p.ID).sort((a,b)=>cmp(a.NUMBER,b.NUMBER)), bySP={}, bySPC={}, byPhC={}, byPh={};
    logs.forEach(r=>{ const v=+r.TIMEPERIOD||0, c=v*taux(r.STAFF_ID,tlDate(r)); if(r.SUBPHASE_ID!=null){ bySP[r.SUBPHASE_ID]=(bySP[r.SUBPHASE_ID]||0)+v; bySPC[r.SUBPHASE_ID]=(bySPC[r.SUBPHASE_ID]||0)+c; }
      if(r.PHASE_ID!=null){ byPh[r.PHASE_ID]=(byPh[r.PHASE_ID]||0)+v; byPhC[r.PHASE_ID]=(byPhC[r.PHASE_ID]||0)+c; } });
    const tauxOk=DS.all('staffrate').length>0; if(SG_COUTS&&!tauxOk) Object.assign(byPhC,(SG_COUTS[p.ID]||{}).phases||{});
    const sansL=logs.filter(r=>r.PHASE_ID==null), sans=sansL.reduce((s0,r)=>s0+(+r.TIMEPERIOD||0),0), sansC=sansL.reduce((s0,r)=>s0+(+r.TIMEPERIOD||0)*taux(r.STAFF_ID,tlDate(r)),0);
    const fin=(sgAdmin()||SG_ACC.profil==='cdp')&&!sgFinVerrou(), pa=sgTermine(p)?null:sgPhaseActuelle(p); pg._fn.ph=()=>cfgPhases(p);   // montants, marge bénéficiaire, coût de revient moyen, gain / perte par heure : administrateur et chef de projet seulement (20.10.2026) ; finances verrouillées : heures seulement
    if(!ph.length){ set('<div class="nx-empty">Aucune phase configurée. <a href="#" data-fn="ph">Configurer les phases</a></div>'); return; }
    const hT=v=>v?nxH(v)+' h':'—', ec=(hp,hs)=>hp?'<span style="'+(hs>hp?'color:var(--s-rouge)':'')+'">'+(hs>hp?'+':'')+nxH(hs-hp)+' h</span>':'';
    const dessiner=C=>{
      const L=[];   /* lignes : {lib, sub, cur, hp, hs, cout, ctr, ctrT} */
      ph.forEach(f=>{ const g=sgSiaGroupe(f), sp=DS.by('projectsubphase','PROJECTPHASE_ID',f.ID).sort((a,c)=>cmp(a.NUMBER,c.NUMBER));
        L.push({lib:(f.NUMBER!=null?f.NUMBER+' · ':'')+nm(f),cur:!!pa&&pa.ph.ID===f.ID,hp:+f.TIMEBUDGET||0,hs:byPh[f.ID]||0,cout:byPhC[f.ID]||0,ctr:C&&g?C.grpHT[g]||0:0,ctrT:C&&g?C.grp[g]||0:0});
        sp.forEach(x=>{ const k2=String(x.NUMBER==null?'':x.NUMBER); L.push({lib:nm(x)+(x.ISTERMINATED?' 🔒':''),sub:1,cur:!!pa&&!!pa.sp&&pa.sp.ID===x.ID,hp:+x.TIMEBUDGET||0,hs:bySP[x.ID]||0,cout:tauxOk?bySPC[x.ID]||0:null,ctr:C?C.sousHT[k2]||0:0,ctrT:C?C.sous[k2]||0:0}); }); });
      if(sans) L.push({lib:'Sans phase',hp:0,hs:sans,cout:sansC,ctr:0,ctrT:0,gris:1});
      for(let i=L.length-1;i>=0;i--){ const o=L[i]; if(!o.hp&&!o.hs&&!o.ctr&&!o.cout&&!(L[i+1]&&L[i+1].sub&&!o.sub)) L.splice(i,1); }   /* lignes entièrement vides masquées (une phase garde ses sous-phases utiles) */
      const hsT=L.filter(x=>!x.sub).reduce((a,x)=>a+x.hs,0), coutT=L.filter(x=>!x.sub).reduce((a,x)=>a+(x.cout||0),0), moy=hsT?coutT/hsT:null;
      const tot={lib:'Projet',tot:1,hp:ph.reduce((a,f)=>a+(+f.TIMEBUDGET||0),0),hs:hsT,cout:coutT,ctr:C?C.totHT:0,ctrT:C?C.tot:0};
      const tx=o=>({o:o.hs>0?(o.ctr||0)/o.hs:null,c:o.hs>0&&o.cout!=null?o.cout/o.hs:null});
      /* échelle commune : jusqu'à 2,5 × le plus haut coût horaire (un taux obtenu sur très peu d'heures, p. ex. 1,5 h pour 9'000 CHF, ne l'écrase pas) ;
         au-delà, le point est posé au bord avec une flèche */
      const maxC=Math.max(1,moy||0,...[...L,tot].map(o=>tx(o).c||0)), maxR=Math.max(maxC*1.25,Math.min(maxC*2.5,Math.max(...[...L,tot].map(o=>tx(o).o||0)))), X=v=>Math.min(100,v/maxR*100).toFixed(1)+'%';
      const marge=o=>(o.hs>0||o.ctr>0)&&o.cout!=null?(o.ctr||0)-o.cout:null;
      const chf=v=>v==null?'—':nxCHF(v), sig=v=>v==null?'—':'<span style="color:'+(v<0?'var(--s-rouge)':'#5d7a10')+';font-weight:700">'+(v>0?'+':'')+nxCHF(v)+'</span>';
      const comp=o=>{ const t=tx(o); if(t.o==null||t.c==null) return ''; const a=Math.min(t.o,t.c), b=Math.max(t.o,t.c), gain=t.o>=t.c;
        return '<div class="sg-db" title="'+nxE((o.lib||'')+' — honoraires '+num(t.o,0)+' CHF/h, coût de revient '+num(t.c,0)+' CHF/h : '+(gain?'gain':'perte')+' de '+num(Math.abs(t.o-t.c),0)+' CHF par heure'+(moy?' — trait gris : coût de revient moyen du projet, '+num(moy,0)+' CHF/h':''))+'">'
          +(moy?'<i class="moy" style="left:'+X(moy)+'"></i>':'')+'<i class="ln '+(gain?'g':'r')+'" style="left:'+X(a)+';width:calc('+X(b)+' - '+X(a)+')"></i><i class="pc" style="left:'+X(t.c)+'"></i><i class="po'+(t.o>maxR?' hors':'')+'" style="left:'+X(t.o)+'"></i></div>'; };
      const ligne=o=>{ const t=tx(o), m=marge(o);
        return '<tr class="'+(o.sub?'sub':'')+(o.cur?' cur':'')+(o.tot?' tot':'')+'"><td title="'+nxE(o.lib)+'">'+(o.sub||o.gris?'<span>':'<b>')+nxE(o.lib)+(o.sub||o.gris?'</span>':'</b>')+(o.cur?'<i class="sg-pg-cur">en cours</i>':'')+'</td>'
          +'<td class="r">'+hT(o.hp)+'</td><td class="r">'+(o.hs||!o.sub?nxH(o.hs)+' h':'')+'</td><td class="r">'+ec(o.hp,o.hs)+'</td>'
          +(fin?'<td class="r" title="'+(o.ctrT?nxE('TTC : '+nxCHF(o.ctrT)+' CHF'):'')+'">'+(o.ctr?nxCHF(o.ctr):(o.sub?'':'—'))+'</td><td class="r">'+(o.cout==null?'—':o.hs||o.cout?nxCHF(o.cout):(o.sub?'':'0'))+'</td>'
            +'<td class="r">'+(m==null||(o.sub&&!o.hs&&!o.ctr)?'':sig(m))+'</td><td class="r">'+(t.o==null?'':num(t.o,0))+'</td><td class="r">'+(t.c==null?'':num(t.c,0))+'</td><td>'+comp(o)+'</td>'
            :'<td style="width:110px">'+(o.hp?sgBarre(o.hs/o.hp,o.hs>o.hp?'var(--s-rouge)':null):'')+'</td>')+'</tr>'; };
      const tete='<tr><th>Phase</th><th class="r">Heures<br>contrat</th><th class="r">Heures<br>saisies</th><th class="r">Écart</th>'   /* en-têtes sur deux lignes (19.10.2026) */
        +(fin?'<th class="r" title="Montant HT du contrat d’honoraires (Facturation) réparti selon les % des phases SIA ; TTC en infobulle">Contrat<br>HT</th><th class="r" title="Heures saisies × taux interne de chaque collaborateur à la date">Coût de<br>revient</th>'
          +'<th class="r" title="Contrat HT − coût de revient : gain (vert) ou perte (rouge)">Marge<br>bénéficiaire</th><th class="r" title="Contrat HT ÷ heures saisies : ce que le client paie pour chaque heure passée">Honoraires<br>/ h</th>'
          +'<th class="r" title="Coût de revient ÷ heures saisies : ce que chaque heure coûte au bureau (collaborateurs qui y ont travaillé)">Coût de revient<br>/ h</th><th style="min-width:260px">Comparaison</th>':'<th></th>')+'</tr>';
      const leg=fin?'<div class="sg-db-leg"><span><i class="po"></i>Honoraires / h (contrat HT ÷ heures saisies)</span><span><i class="pc"></i>Coût de revient / h (coût de revient ÷ heures saisies)</span>'
        +'<span><i class="ln g"></i>Gain par heure</span><span><i class="ln r"></i>Perte par heure</span>'+'</div>':'';   /* « Coût de revient moyen des collaborateurs du projet » retiré de la légende (19.10.2026) : infobulle de la comparaison */
      /* note sous le tableau retirée (19.10.2026) : seul l'avertissement « aucun contrat relié » reste ; légende tout en bas de la page */
      const note=fin&&!(C&&C.n)?'<div class="sg-ctr-note">Aucun contrat d’honoraires relié à ce projet dans Facturation : marge et honoraires / h calculés sans honoraires.</div>':'';
      /* chiffres clés sous le titre (19.10.2026), des heures vers l'argent : écart des heures, phases hors budget (même règle que l'en-tête :
         phase avec heures au contrat et plus d'heures saisies), marge bénéficiaire, coût de revient moyen, gain (ou perte) par heure */
      const phL=L.filter(o=>!o.sub&&!o.gris), phB=phL.filter(o=>o.hp>0), hors=phB.filter(o=>o.hs>o.hp), dep=hors.reduce((a,o)=>a+(o.hs-o.hp),0);
      const ecH=tot.hs-tot.hp, mT=marge(tot), tT=tx(tot), aC=!!(C&&C.n), gph=aC&&tT.o!=null&&tT.c!=null?tT.o-tT.c:null;
      /* sous chaque chiffre : plus de texte gris (retiré à la demande le 19.10.2026), le détail est dans l'infobulle */
      const kpi=(l,v,s2,cl,ti)=>{ const t=[ti,s2].filter(Boolean).join(' — '); return '<div class="sg-phk"'+(t?' title="'+nxE(t)+'"':'')+'><div class="l">'+nxE(l)+'</div><div class="v'+(cl?' '+cl:'')+'">'+v+'</div></div>'; };
      const kp='<div class="sg-phks">'
        +kpi('Écart des heures',tot.hp?(ecH>0?'+':'')+nxH(ecH)+'<small>h</small>':'—',tot.hp?nxH(tot.hs)+' h saisies sur '+nxH(tot.hp)+' h au contrat ('+Math.round(tot.hs/tot.hp*100)+' %)':'aucune heure prévue au contrat',tot.hp&&ecH>0?'neg':'')
        +kpi('Phases hors budget',String(hors.length)/* « sur n » retiré (20.10.2026), gardé dans l'infobulle */,(hors.length?'+'+nxH(dep)+' h au-delà : '+hors.map(o=>o.lib.replace(/^[^·]*· /,'')).join(', '):'aucune phase au-delà des heures prévues')+' — sur '+phB.length+' phase'+(phB.length>1?'s':'')+' avec heures prévues',hors.length?'neg':(phB.length?'pos':''))
        +(fin?kpi('Marge bénéficiaire',aC&&mT!=null?(mT>0?'+':'')+nxCHF(mT)+'<small>CHF</small>':'—',aC?(tot.ctr?Math.round(mT/tot.ctr*100)+' % du contrat HT ('+nxCHF(tot.ctr)+' CHF)':'')+(pa?' · provisoire, phase en cours':''):'aucun contrat d’honoraires relié',aC&&mT!=null?(mT<0?'neg':'pos'):'','Contrat HT − coût de revient')
          +kpi('Coût de revient moyen',moy?num(moy,0)+'<small>CHF/h</small>':'—',tot.hs?'par heure saisie ('+nxH(tot.hs)+' h, '+nxCHF(tot.cout)+' CHF)':'','','Coût de revient ÷ heures saisies, collaborateurs du projet')
          +kpi(gph!=null&&gph<0?'Perte par heure':'Gain par heure',gph==null?'—':(gph>=0?'+':'')+num(Math.round(tT.o)-Math.round(tT.c),0)+'<small>CHF/h</small>',gph==null?'':'honoraires '+num(tT.o,0)+' CHF/h − coût de revient '+num(tT.c,0)+' CHF/h',gph==null?'':gph<0?'neg':'pos','Honoraires / h − coût de revient / h')
          :'')+'</div>';
      set(nxCard('c12','Phases contrat',kp+'<div class="b flush" style="overflow:auto"><table class="nx-tbl sg-phc">'+tete+L.map(ligne).join('')+(fin?ligne(tot):'')+'</table>'+note+leg+'</div>')); };   /* lien « Configurer » de l'en-tête retiré (19.10.2026) */
    if(!fin){ dessiner(null); return; }
    set('<div class="nx-empty">Calcul des marges…</div>');
    fxEnsure().catch(()=>null).then(()=>{ if(box.isConnected) dessiner(sgContratParPhase(p)); }); return; }
  /* Intervenants (20.10.2026) : « Entreprises » (rôle 19) et « Directeur des travaux » (rôle 2) échangent leur place dans cet onglet ; Gérer les
     intervenants et Liste d'adresses en tuiles à icône, comme les onglets Heures et Contrat */
  if(k==='interv'){ const ordR=c=>+c===2?(ROLE_ORD[19]??99):+c===19?(ROLE_ORD[2]??99):(ROLE_ORD[c]??99);
    const mem=DS.by('projectmember','PROJECT_ID',p.ID).filter(x=>!+x.ISHIDDEN&&+x.TEAMROLECODE!==90).sort((a,b)=>ordR(a.TEAMROLECODE)-ordR(b.TEAMROLECODE)||cmp(a.SORTORDER,b.SORTORDER)), grp={};
    mem.forEach(x=>(grp[teamRole(x.TEAMROLECODE)]=grp[teamRole(x.TEAMROLECODE)]||[]).push(x));
    set('<div class="sg-htls sg-iacts"><button data-fn="mem" title="Ajouter, retirer ou modifier les intervenants du projet">'+nxSvg('users')+'<span>Gérer les intervenants</span></button><button data-fn="dom" data-dom="Liste d’adresses" title="Liste d’adresses du projet">'+nxSvg('list')+'<span>Liste d’adresses</span></button></div><div class="nx-grid">'
      +(Object.keys(grp).length?Object.entries(grp).map(([role,xs])=>nxCard('c6',nxE(role),'<div class="b flush">'+xs.map(x=>{ const c=DS.get('contact',x.CONTACT_ID), o=c&&DS.get('contactowner',c.CONTACTOWNER_ID), tel=c&&[c.PHONEAREA1,c.PHONENUMBER1].filter(Boolean).join(' ');
        return '<div class="nx-person"'+(o?' data-ref="c:'+o.ID+'"':'')+'><div class="nx-av ext">'+nxE(nxIni(contactName(c)))+'</div><div class="t"><b>'+nxE(contactName(c)||'—')+'</b><span>'+nxE([x.BKP?'CFC '+x.BKP:'',c&&c.EMAIL1,tel].filter(Boolean).join(' · '))+'</span></div></div>'; }).join('')+'</div>','<span class="n">'+xs.length+'</span>')).join(''):'<div class="nx-empty">Aucun intervenant.</div>')+'</div>');
    pg._fn.mem=()=>cfgMembers(p); pg._fn.dom=b=>sgOuvrirDomaine(p,b.dataset.dom); return; }
  if(k==='factu'){ set('<div class="nx-empty">Recherche dans la facturation…</div>');
    fxEnsure().catch(()=>null).then(()=>{ const D=fxData(), x=sgRenta(p,D,taux), collab=SG_ACC.profil==='collab'; if(!box.isConnected) return;
      const opts=DS.all('project').length?'':''; const libre=D?D.c.filter(c=>!c.annule&&!sgProjetDuContrat(c)):[];
      set('<div class="nx-kpis">'+nxKpi('contrat','Honoraires (TTC)',x.contratTTC?nxCHF(x.contratTTC)+'<small>CHF</small>':'—',x.src==='moteur'?'contrats des projets':x.cs.length+' contrat(s)',null,null,1)/* « Coût de revient » retiré de Contrats & factures (19.10.2026) *//* Facturé, Encaissé et Solde à facturer déplacés dans l'onglet Factures (20.10.2026) */   /* collaborateur : ni facturé, ni encaissé, ni solde (20.10.2026) */
        +(pf=>nxKpi('trend','Part facturable',pf.pct!=null?Math.round(pf.pct)+'<small>%</small>':'—',pf.tot?sgHr(pf.fact)+' h sur '+sgHr(pf.tot)+' h saisies':'aucune heure saisie',pf.pct).replace('<div class="nx-kpi','<div title="'+nxE(pf.tot?nxH(pf.fact)+' h facturables'+(pf.dep?' · '+nxH(pf.dep)+' h au-delà du contrat ('+pf.ty.map(t=>t==='relatif'?'forfait relatif':'forfait').join(', ')+') — contrat au forfait : les heures d’une phase au-delà de ses heures au contrat ne sont pas facturables':''):'')+'" class="nx-kpi'))(sgPartFacturable(p,D))
        +'</div>'   /* solde à facturer = honoraires TTC − facturé TTC (19.10.2026) ; part facturable déplacée ici depuis la vue d'ensemble (20.10.2026) */
        +((alF=>alF.length?'<div style="margin:-14px 0 20px">'+alF.map(sgAlerteTag).join(' ')+'</div>':'')(collab?[]:x.al.filter(a=>!/hors budget|^Coût |^Facturation en retard/.test(a[1]))))   /* « Coût au-delà des honoraires » et « Coût à n % des honoraires » retirés de l'onglet (20.10.2026) */   /* « phases hors budget » retiré de l'onglet (19.10.2026) */
        +'<div class="nx-grid sg-oc-g">'+nxCard('c12','Contrat(s) d’honoraires',(x.cs.length?'<div class="b flush"><table class="nx-tbl"><tr><th>Document</th><th>Date du contrat</th><th>Commentaire</th><th>Type</th><th class="r">Tarif horaire<br>brut</th><th class="r">Rabais</th><th class="r">HT</th><th class="r">TTC</th><th>État</th><th></th></tr>'+x.cs.map(c=>{ const ci=sgContratInfo(c); return '<tr><td'+(ci.nTitre?' title="'+nxE(ci.nTitre)+'"':'')+'>'+nxE(ci.nature)+'</td>'
          +'<td'+(ci.dTitre?' title="'+nxE(ci.dTitre)+'"':'')+'>'+(ci.date?dfr(ci.date):'—')+'</td>'   /* date du contrat à droite de « Document » (21.10.2026) */
          +'<td class="sg-ccom">'+nxE(ci.com)+'</td>'   /* 20.10.2026 : colonne Contrat (code et description) remplacée par le commentaire de la dernière version ; « Nature » → « Document » (placé avant le commentaire) ; colonne « Type » (rémunération : forfait, forfait relatif, unitaire), nommée « Rémunération » puis de nouveau « Type » le 20.10.2026 */+''   /* colonne Client retirée ; Nature, Type (rémunération), Date du contrat, état signé (20.10.2026) */
          +'<td'+(ci.rTitre?' title="'+nxE(ci.rTitre)+'"':'')+'>'+nxE(ci.remu)+'</td>'
          +'<td class="r"'+(ci.tTitre?' title="'+nxE(ci.tTitre)+'"':'')+'>'+(ci.tarif!=null?num(ci.tarif,2):'—')+'</td><td class="r">'+(ci.rabais!=null?num(ci.rabais,ci.rabais%1?1:0)+' %':'—')+'</td>'   /* tarif horaire brut et rabais (21.10.2026) */
          +'<td class="r">'+nxCHF(c.hht)+'</td><td class="r">'+nxCHF(c.httc)+'</td><td><span class="nx-tag '+ci.cl+'">'+nxE(ci.etat)+'</span></td><td class="r"><div class="sg-htls sg-cacts"><button data-go="fx-contrats" data-arg="cv:'+nxE(c.id)+'" title="Afficher le contrat en PDF : dernière version (contrat signé ou dernier avenant)">'+nxSvg('pdf')+'<span>Ouvrir</span></button>'+(collab?'':c.termine?'<span class="sg-cvide" aria-hidden="true"></span>':'<button data-go="fx-saisie" data-arg="nf:'+nxE(c.id)+'" title="Établir une facture ou un acompte pour ce contrat">'+nxSvg('receipt')+'<span>Facturer</span></button>')+'</div></td></tr>'   /* Ouvrir / Facturer : tuiles à icône comme l'onglet Heures (20.10.2026) ; contrat terminé : plus de « Facturer » (case vide pour l'alignement, 20.10.2026) */; }).join('')+'</table></div>'
            :'<div class="b"><p style="margin:0 0 10px;font-weight:300">Aucun contrat de Facturation relié à ce projet.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="nx-btn pri" data-go="fx-calchono" data-arg="newaff:'+nxE(p.NUMBER)+'">'+nxSvg('contrat')+'Nouveau contrat</button>'+(libre.length?'<select class="inp" id="sg-lier" style="max-width:380px"><option value="">Relier un contrat existant…</option>'+libre.map(c=>'<option value="'+nxE(c.id)+'">'+nxE([c.affaire||'(sans code)',c.projet,c.nom].filter(Boolean).join(' — '))+'</option>').join('')+'</select>':'')+'</div></div>'))   /* lien « Tous les contrats » retiré du titre (20.10.2026) */
        +'</div><div class="sg-oc-ph" id="sg-oc-ph"></div>');   /* ordre (20.10.2026) : contrats d'honoraires, Phases contrat ; factures dans leur onglet (20.10.2026) */
      sgOnglet(p,'phases',pg,box.querySelector('#sg-oc-ph'));
      const s=box.querySelector('#sg-lier'); if(s) s.onchange=()=>{ if(!s.value) return; const l=sgLiens(); l[s.value]=String(p.ID); nxLS.set('sg3_liens',l); toast('Contrat relié à '+p.NUMBER+'.'); sgOnglet(p,'factu',pg); }; }); return; }
  /* ═══ Onglets Projet et Faisabilité (20.10.2026) ═══ Projet : un groupe dépliable par phase partielle SIA des études (SG_PROJ_PH) ; dans chacun
     PV MO (fichiers), Estimations (calcul des coûts du moteur) et Descriptifs & devis (devis du moteur) classés dans la phase choisie (collection
     sgdocphase {ID « <table>:<id> », PROJECT_ID, PHASE}) ; phase 33 : dossier d'enquête (SG_ENQUETE). Estimations et devis sans phase : groupe
     « Estimations et devis à classer ». Faisabilité : documents de base, études, variantes, présentation (SG_FAISA_RUB). Fichiers : dépôt du
     moteur (ch03aDeposer, droit « documents : dépôt »), visibles aussi dans l'onglet Documents ; classement : droit « chantier : écriture ». */
  /* Chantier (20.10.2026) : même code que Projet — phase 41 Appel d'offres (déplacée de Projet), puis Contrôles des coûts et PV de chantier */
  if(k==='projet'||k==='faisa'||k==='chantier'){ set('<div class="nx-empty">Chargement des documents…</div>');
    DS.need(['depotfichier','costestimate','costplanning','costcontrol','sgdocphase']).catch(()=>{}).then(()=>k==='chantier'?fxEnsure().catch(()=>null):null).then(()=>{ if(!box.isConnected) return;
      const depot=sgDroit('documents','depot'), classer=sgDroit('chantier','ecriture'), ouv=SG_CGRP[k+':'+p.ID]||(SG_CGRP[k+':'+p.ID]=new Set());
      const racine=k==='faisa'?'Faisabilité':'Projet', dos=chemin=>ch03aDossier('document',p.ID,racine,chemin);   // phases (Projet et Chantier) : dossier « Projet »
      const fic=d=>DS.all('depotfichier').filter(f=>f.DOSSIER===d).sort((a,b)=>cmp(a.NOM,b.NOM));
      const phSel=(f,chemin)=>{ const m=typeof chemin==='string'&&depot&&(k==='projet'||k==='chantier')?/^(\d{2}) [^/]+\/(.+)$/.exec(chemin):null; if(!m) return '';   /* phase du fichier modifiable (21.10.2026) */
        const T=SG_TYPES_FICH.map(([k,l])=>[k,l]).concat(m[1]==='33'?SG_ENQUETE.map(([t,,sous])=>['Dossier d’enquête/'+sous,'Dossier d’enquête · '+t]):[]); if(!T.some(([k])=>k===m[2])) T.push([m[2],m[2]]);
        return '<select class="sg-phsel sg-fph" data-fid="'+nxE(f.ID)+'" data-rub="'+nxE(m[2])+'" title="Phase du fichier">'+sgPhasesFich(p,k==='chantier'?[41,51,52,53]:[31,32,33]).map(x=>'<option value="'+x.n+'"'+(String(x.n)===m[1]?' selected':'')+'>'+x.n+' '+nxE(x.lib)+'</option>').join('')+'</select>'
          +'<select class="sg-phsel sg-fty" data-fid="'+nxE(f.ID)+'" data-ph="'+nxE(m[1])+'" title="Type de document">'+T.map(([k,l])=>'<option value="'+nxE(k)+'"'+(k===m[2]?' selected':'')+'>'+nxE(l)+'</option>').join('')+'</select>'; };
      const lf=(f,chemin)=>'<div class="nx-row" data-sha="'+nxE(f.ID)+'">'+nxSvg(f.EXT==='pdf'?'pdf':'doc')+'<div class="t"><b>'+nxE(f.NOM)+'</b><span>'+nxE([f.TAILLE?(f.TAILLE/1024).toFixed(0)+' Ko':'',f.PAGES?f.PAGES+' p.':'',f.MODIFIED?dfr(String(f.MODIFIED).slice(0,10)):''].filter(Boolean).join(' · '))+'</span></div>'+phSel(f,chemin)+'</div>';
      const ajout=chemin=>chemin!=null&&depot?'<span class="a" data-fn="pajout" data-dos="'+nxE(chemin)+'" title="Ajouter des fichiers">'+nxSvg('plus')+'Ajouter</span>':'';
      const rub=(titre,ico,lignes,chemin)=>'<div class="sg-rub"><div class="sg-rub-h">'+(titre?nxSvg(ico)+'<b>'+nxE(titre)+'</b><span class="c">'+lignes.length+'</span>':'')+ajout(chemin)+'</div>'+(lignes.length?'<div class="sg-rub-l'+(titre?'':' nu')+'">'+lignes.join('')+'</div>':'')+'</div>';
      const rubF=(titre,ico,chemin)=>{ const L=fic(dos(chemin)); return {n:L.length,h:rub(titre,ico,L.map(f=>lf(f,chemin)),chemin)}; };
      const grp=(c,ico,lib,parts)=>{ const n=parts.reduce((a,x)=>a+x.n,0), on=ouv.has(c);
        return '<section class="sg-pgrp'+(on?' on':'')+'" data-c="'+nxE(c)+'"><button class="sg-pgrp-h" data-fn="cgrp" aria-expanded="'+on+'">'+nxSvg(ico)+'<span class="t"><b>'+nxE(lib)+'</b></span><span class="c">'+n+' élément'+(n>1?'s':'')+'</span>'+nxSvg('next','chev')+'</button><div class="sg-cgrp-b">'+parts.map(x=>x.h).join('')+'</div></section>'; };
      let html='';
      if(k==='projet'||k==='chantier'){
        const spN=new Map(); DS.by('projectphase','PROJECT_ID',p.ID).forEach(f=>DS.by('projectsubphase','PROJECTPHASE_ID',f.ID).forEach(x=>{ const n=parseFloat(x.NUMBER); if(isFinite(n)&&nm(x)) spN.set(n,nm(x)); }));
        const PH=sgPhasesFich(p,k==='projet'?[31,32,33]:[41,51,52,53]);   /* Chantier : 41 à 53 (21.10.2026) */
        const docsM=[['costplanningdocument','Estimations','ruler','Calcul des coûts',[]],['costestimatedocument','Descriptifs & devis','doc','Devis général',[31]]]   /* sans : phases où la rubrique n'existe pas (devis : pas en avant-projet, 20.10.2026) */
          .map(([t,titre,ico,dom,sans])=>({t,titre,ico,dom,sans,L:DS.by(t,'PROJECT_ID',p.ID).filter(d=>!+d.ISMARKEDASDELETED).sort((a,b)=>cmp(b.CHANGEDDATE,a.CHANGEDDATE))}));
        const phaseDe=(t,d)=>{ const r=DS.get('sgdocphase',t+':'+d.ID); return r&&r.PHASE!=null?String(r.PHASE):''; };
        const opts=(v,m)=>'<option value="">À classer</option>'+PH.filter(x=>!m.sans.includes(x.n)).map(x=>'<option value="'+x.n+'"'+(String(x.n)===v?' selected':'')+'>'+x.n+' '+nxE(x.lib)+'</option>').join('');
        const ld=(m,d)=>'<div class="nx-row" data-edom="'+nxE(m.dom)+'">'+nxSvg(m.ico)+'<div class="t"><b>'+nxE(d.NOTE||d.VERSION||('Document '+d.ID))+'</b><span>'+nxE(['version '+(d.VERSIONNUMBER||d.VERSION||''),d.CHANGEDDATE?dfr(String(d.CHANGEDDATE).slice(0,10)):'',d.USERID].filter(Boolean).join(' · '))+'</span></div>'
          +(classer?'<select class="sg-phsel" data-k="'+nxE(m.t+':'+d.ID)+'" title="Phase du document">'+opts(phaseDe(m.t,d),m)+'</select>':'')+'</div>';
        const rubM=(m,ph)=>{ const L=m.L.filter(d=>phaseDe(m.t,d)===ph); return {n:L.length,h:rub(m.titre,m.ico,L.map(d=>ld(m,d)),null)}; };
        const aCl=k==='projet'?docsM.map(m=>rubM(m,'')).filter(x=>x.n):[]; if(aCl.length) html+=grp('acl','task','Estimations et devis à classer',aCl);
        PH.filter(x=>k==='projet'?x.n<40:x.n>=40).forEach(x=>{ /* Projet : 31 à 33 ; Chantier : 41 (20.10.2026) */ const parts=[{n:0,h:depot?'<div class="sg-htls sg-iacts sg-ph-add"><button data-fn="pajout" data-dos="'+nxE(x.dos+'/Documents')+'" title="Ajouter des fichiers à cette phase, en choisissant leur type">'+nxSvg('plus')+'<span>Ajouter des fichiers</span></button></div>':''},
            ...SG_TYPES_FICH.map(([cle,lib,ico])=>({cle,r:rubF(cle==='PV MO'||cle==='Présentation client'?cle:lib,ico,x.dos+'/'+cle)})).filter(y=>['Plans','PV MO','Présentation client'].includes(y.cle)||y.r.n).map(y=>y.r),   /* types de documents (21.10.2026) : Plans, PV, Présentation toujours ; les autres dès qu'ils ont des fichiers */
            ...docsM.filter(m=>!m.sans.includes(x.n)).map(m=>rubM(m,String(x.n)))];   // + présentation client par phase (20.10.2026)
          if(x.n===33) SG_ENQUETE.forEach(([titre,ico,sous])=>parts.push(rubF('Dossier d’enquête · '+titre,ico,x.dos+'/Dossier d’enquête/'+sous)));
          html+=grp('p'+x.n,'folder',x.n+' · '+x.lib,parts); });
      } else html=SG_FAISA_RUB.map(([c,titre,ico])=>grp(c,ico,titre,[rubF(null,ico,titre)])).join('');
      if(k==='chantier'){   // Contrôles des coûts et PV de chantier (repris de l'ancien onglet Chantier, boutons en tuiles à icône)
        const C=DS.by('costcontroldocument','PROJECT_ID',p.ID).filter(d=>!+d.ISMARKEDASDELETED).sort((a,b)=>cmp(b.CHANGEDDATE,a.CHANGEDDATE));
        html+=grp('coco','coins','Contrôles des coûts',[{n:C.length,h:'<div class="sg-htls sg-iacts"><button data-edom="Contrôle des coûts" title="Ouvrir le contrôle des coûts">'+nxSvg('arrow')+'<span>Ouvrir</span></button></div>'
          +(C.length?'<div class="sg-rub-l nu">'+C.map(d=>'<div class="nx-row" data-edom="Contrôle des coûts">'+nxSvg('doc')+'<div class="t"><b>'+nxE(d.NOTE||d.VERSION||('Document '+d.ID))+'</b><span>'+nxE(['version '+(d.VERSIONNUMBER||d.VERSION||''),d.CHANGEDDATE?dfr(String(d.CHANGEDDATE).slice(0,10)):'',d.USERID].filter(Boolean).join(' · '))+'</span></div></div>').join('')+'</div>':'<div class="nx-empty">Aucun document.</div>')}]);
        let pv={}; try{ pv=JSON.parse(FX.w.localStorage.getItem('sa_pv_data')||'{}'); }catch(_){}
        const pk=Object.keys(pv).find(c=>sgCle(c)===sgCle(p.NUMBER)), pvs=pk?(pv[pk].pvs||[]):[];
        html+=grp('pv','pv','PV de chantier',[{n:pvs.length,h:'<div class="sg-htls sg-iacts"><button data-go="fx-pv-chantier" data-arg="pv:'+nxE(pk||p.NUMBER)+'" title="Ouvrir les PV de chantier du projet">'+nxSvg('pv')+'<span>PV de chantier</span></button></div>'
          +(pvs.length?'<div class="sg-rub-l nu">'+pvs.slice().sort((a,b)=>cmp(b.date,a.date)).map(x=>'<div class="nx-row" data-go="fx-pv-chantier" data-arg="pv:'+nxE(pk)+'">'+nxSvg('pv')+'<div class="t"><b>PV n° '+nxE(x.num)+'</b><span>'+nxE([x.date?dfr(x.date):'',x.statut].filter(Boolean).join(' · '))+'</span></div></div>').join('')+'</div>':'<div class="nx-empty">Aucun PV pour ce projet.</div>')}]);
        /* fichiers du chantier hors phase (21.10.2026) : dossier « Chantier » (sans phase, Présentation) et fichiers des documents du moteur
           (contrôles des coûts, devis, calculs des coûts, soumissions), regroupés par dossier */
        let cdos=''; try{ cdos=ch03aDossier('document',p.ID,'Chantier').normalize('NFC'); }catch(_){}
        const Lc=DS.all('depotfichier').filter(f=>{ const d=String(f.DOSSIER||'').normalize('NFC'); return (String(f.PROJECT_ID)===String(p.ID)||d.startsWith('ProjectDocuments/Documents/'+p.ID+'/'))&&((cdos&&(d===cdos||d.startsWith(cdos+'/')))||d.startsWith('Construction/')); }), gC={};
        Lc.forEach(f=>(gC[f.DOSSIER]=gC[f.DOSSIER]||[]).push(f));
        const actC=depot?'<div class="sg-htls sg-iacts"><button data-fn="pajout" data-dos="::general" title="Ajouter des fichiers au chantier (phase et type au choix)">'+nxSvg('plus')+'<span>Ajouter des fichiers</span></button></div>':'';
        html+=grp('chf','folder','Autres fichiers du chantier',[{n:Lc.length,h:actC+(Lc.length?Object.entries(gC).sort((a,b)=>cmp(sgDossierLib(a[0]),sgDossierLib(b[0]))).map(([d,fs])=>rub(sgDossierLib(d),'folder',fs.sort((a,b)=>cmp(a.NOM,b.NOM)).map(f=>lf(f)),null)).join(''):'<div class="nx-empty">Aucun autre fichier.</div>')}]); }
      /* module Documents (20.10.2026, remplace l'onglet Documents) : tous les fichiers du projet par dossier ; à la fin de Projet, ou de Faisabilité
         pour un projet uniquement de faisabilité (sans onglet Projet) */
      if(k==='projet'||(k==='faisa'&&sgCatProjet(p)==='faisabilite')){
        const Ld=DS.all('depotfichier').filter(f=>String(f.PROJECT_ID)===String(p.ID)||String(f.DOSSIER).startsWith('ProjectDocuments/Documents/'+p.ID+'/')).sort((a,b)=>cmp(a.DOSSIER,b.DOSSIER)||cmp(a.NOM,b.NOM)), gD={};
        Ld.forEach(f=>(gD[f.DOSSIER]=gD[f.DOSSIER]||[]).push(f));
        const actD='<div class="sg-htls sg-iacts">'+(depot?'<button data-fn="pajout" data-dos="::general" title="Ajouter des fichiers au projet (dossier Général)">'+nxSvg('plus')+'<span>Ajouter des fichiers</span></button>':'')+'<button data-fn="docdom" title="Ouvrir le domaine Documents du projet">'+nxSvg('folder')+'<span>Domaine Documents</span></button></div>';
        html+=grp('docs','folder','Documents',[{n:Ld.length,h:actD+(Ld.length?Object.entries(gD).map(([d,fs])=>rub(sgDossierLib(d),'folder',fs.map(lf),null)).join(''):'<div class="nx-empty">Aucun fichier joint à ce projet.</div>')}]); }
      set('<div class="sg-pgrps">'+html+'</div>');
      box.querySelectorAll('[data-sha]').forEach(r=>r.onclick=()=>{ const f=DS.get('depotfichier',r.dataset.sha); if(f) ch03aOuvrir(f); });
      box.querySelectorAll('[data-edom]').forEach(r=>r.onclick=e=>{ if(e.target.closest('select')) return; sgOuvrirDomaine(p,r.dataset.edom); });
      box.querySelectorAll('select.sg-fph').forEach(x=>{ x.onclick=e=>e.stopPropagation(); x.onchange=async()=>{ const f=DS.get('depotfichier',x.dataset.fid); if(!f) return;   /* phase d'un fichier (21.10.2026) */
        try{ if(await sgFichierPhase(p,f,x.value,x.dataset.rub)){ ouv.add('p'+x.value); sgOnglet(p,k,pg); } }catch(e){ toast('✗ '+(e.message||e),true); } }; });
      box.querySelectorAll('select.sg-fty').forEach(x=>{ x.onclick=e=>e.stopPropagation(); x.onchange=async()=>{ const f=DS.get('depotfichier',x.dataset.fid); if(!f) return;   /* type d'un fichier (21.10.2026) */
        try{ if(await sgFichierPhase(p,f,x.dataset.ph,x.value)){ ouv.add('p'+x.dataset.ph); sgOnglet(p,k,pg); } }catch(e){ toast('✗ '+(e.message||e),true); } }; });
      box.querySelectorAll('select.sg-phsel:not(.sg-fph):not(.sg-fty)').forEach(x=>x.onchange=async()=>{ try{ await DS.save('sgdocphase',{ID:x.dataset.k,PROJECT_ID:p.ID,PHASE:x.value||null});
          if(x.value) ouv.add('p'+x.value); toast(x.value?'Document classé en phase '+x.value+'.':'Document remis « à classer ».'); sgOnglet(p,k,pg); }catch(e){ toast('✗ '+(e.message||e),true); } });
      Object.assign(pg._fn,{cgrp:b=>{ const x=b.closest('.sg-pgrp'), on=x.classList.toggle('on'); b.setAttribute('aria-expanded',String(on)); ouv[on?'add':'delete'](x.dataset.c); },
        docdom:()=>sgOuvrirDomaine(p,'Documents'),
        pajout:b=>{ const g=b.closest('.sg-pgrp');
          if(k!=='faisa'){ const m=/^(\d{2}) [^/]+\/(.+)$/.exec(b.dataset.dos||'');   /* Projet / Chantier : fenêtre avec choix de la phase et de la rubrique (21.10.2026) */
            sgDeposerDlg(p,{titre:'Ajouter des fichiers au projet',phases:k==='chantier'?[41,51,52,53]:[31,32,33],phase:m?+m[1]:null,rubriques:SG_TYPES_DLG,rubrique:m?m[2]:'Documents',
              sansPhase:b.dataset.dos==='::general'||!m?(k==='chantier'?'Sans phase (dossier Chantier)':'Sans phase (dossier Général)'):null,sansDos:k==='chantier'?()=>ch03aDossier('document',p.ID,'Chantier'):null,apres:ph=>{ if(ph) ouv.add('p'+ph); else if(g) ouv.add(g.dataset.c); sgOnglet(p,k,pg); }}); return; }
          const d=b.dataset.dos==='::general'?ch03aDossier('document',p.ID,'Général'):dos(b.dataset.dos), inp=h('input',{type:'file',multiple:true});
          inp.onchange=async()=>{ let n=0; for(const f of inp.files){ try{ await ch03aDeposer(d,f.name,f,{projet:p.ID,origine:'import'}); n++; }
              catch(e){ if(e.message==='existe'){ if(await confirmDlg('« '+f.name+' » existe déjà. Le remplacer ?','Remplacer')){ await ch03aDeposer(d,f.name,f,{projet:p.ID,origine:'import',remplacer:true}); n++; } } else toast('✗ '+f.name+' : '+e.message,true); } }
            if(n){ toast(n+' fichier'+(n>1?'s':'')+' ajouté'+(n>1?'s':'')+'.'); if(g) ouv.add(g.dataset.c); sgOnglet(p,k,pg); } };
          inp.click(); }}); }); return; }
  if(k==='notes'){ const notes=DS.by('projectnote','PROJECT_ID',p.ID).sort((a,b)=>cmp(b.CHANGEDDATE,a.CHANGEDDATE)), tasks=DS.by('projecttask','PROJECT_ID',p.ID).sort((a,b)=>cmp(!!a.DONEDATE,!!b.DONEDATE)||cmp(a.DEADLINE,b.DEADLINE));
    set('<div class="nx-grid">'+nxCard('c6','Notes',('<div class="b"><div style="display:flex;gap:8px"><input class="inp" id="sg-note-t" placeholder="Nouvelle note : objet…"><button class="nx-btn pri" data-fn="note">Ajouter</button></div><textarea class="inp" id="sg-note-c" placeholder="Contenu (facultatif)" style="margin-top:8px;min-height:60px"></textarea></div>')
        +'<div class="b flush">'+(notes.length?notes.map(n=>'<div class="nx-row" style="cursor:default">'+nxSvg('doc')+'<div class="t"><b>'+nxE(n.SUBJECT||'Note')+'</b><span style="white-space:normal">'+nxE([n.OWNER,dfr(n.CHANGEDDATE),n.CONTENT].filter(Boolean).join(' · '))+'</span></div></div>').join(''):'<div class="nx-empty">Aucune note.</div>')+'</div>','<span class="a" data-fn="dom" data-dom="Notes">Toutes les notes</span>')
      +nxCard('c6','Tâches','<div class="b flush">'+(tasks.length?tasks.map(t=>'<div class="nx-row" style="cursor:default">'+nxSvg(t.DONEDATE?'check':'task')+'<div class="t"><b'+(t.DONEDATE?' style="text-decoration:line-through;color:var(--s-gris)"':'')+'>'+nxE(t.SUBJECT||'')+'</b><span>'+nxE(t.DONEDATE?'Réglée le '+dfr(t.DONEDATE):t.DEADLINE?'Échéance '+dfr(t.DEADLINE):'')+'</span></div>'+(+t.ISURGENT&&!t.DONEDATE?'<span class="nx-tag urg">Urgent</span>':'')+'</div>').join(''):'<div class="nx-empty">Aucune tâche.</div>')+'</div>','<span class="a" data-fn="dom" data-dom="Tâches">Gérer les tâches</span>')+'</div>');
    pg._fn.dom=b=>sgOuvrirDomaine(p,b.dataset.dom);
    pg._fn.note=async()=>{ const t=box.querySelector('#sg-note-t'), c=box.querySelector('#sg-note-c'); if(!t.value.trim()){ toast('Indiquez l’objet de la note.',true); t.focus(); return; }
      await DS.save('projectnote',{ID:null,PROJECT_ID:p.ID,OWNER:ME.id,CHANGEDDATE:today(),SUBJECT:t.value.trim(),CONTENT:c.value.trim()||null}); toast('Note ajoutée.'); }; return; }
}
/* Facturation : arguments supplémentaires des vues fx- (facturer un contrat, nouveau contrat pour une affaire, PV d'une affaire) */
['fx-saisie','fx-calchono','fx-pv-chantier'].forEach(id=>{ const v=VIEWS[id], r0=v.render;
  v.render=function(m,arg){ const a=String(arg||'');
    if(/^(nf:|newaff:|pv:)/.test(a)){ document.getElementById('fx-layer').classList.add('on');
      fxEnsure().then(w=>{ if(!VIEW||VIEW.id!==id) return;
        if(a.startsWith('nf:')){ w.goTab('saisie'); w.newFacture(); const s=w.document.getElementById('f_contrat'); if(s){ s.value=a.slice(3); w.onSelectContrat(); } }
        else if(a.startsWith('newaff:')){ w.newContratCalc(); const i=w.document.getElementById('ch_affaire'); if(i){ i.value=a.slice(7); i.dispatchEvent(new Event('input',{bubbles:true})); i.dispatchEvent(new Event('change',{bubbles:true})); } }
        else { w.goTab('pv-chantier'); const code=a.slice(3); try{ if(w.eval('typeof pvData!=="undefined"&&pvData['+JSON.stringify(code)+']')) w.pvSelAff(code); }catch(_){} } }).catch(e=>toast('✗ '+(e.message||e),true));
      return; }
    return r0.call(this,m,arg); }; });

/* ═══ 5. À TRAITER AUJOURD'HUI (accueil + pastille du menu) ═════════════════════════════════════════════════ */
let SG_AT={n:0,groupes:[]};
async function sgATraiter(){ const G=[], td=today(), me=nxMe(), now=new Date();
  const e=SAUV.etat; if(sgAdmin()&&sgSauvEchec()) G.push({k:'sv',t:'Sauvegarde en échec',ico:'db',go:'nx-data',items:[{t:e.quand?'Dernière sauvegarde réussie '+sgDepuis(e.quand):'Aucune sauvegarde réussie de la base',s:e.erreur}]});   /* 21.10.2026 */
  else if(sgAdmin()&&!(typeof dsEstBureau==='function'&&dsEstBureau())&&(!e.quand||Date.now()-e.quand>48*3600e3)) G.push({k:'sv',t:'Sauvegarde',ico:'db',go:'nx-data',items:[{t:e.quand?'Dernière sauvegarde '+sgDepuis(e.quand):'Base jamais sauvegardée',s:e.erreur||'Sauvegarder maintenant ou choisir un dossier'}]});
  let D=null; try{ await fxEnsure(); D=fxData(); }catch(_){}
  if(D){ const ech=D.f.filter(f=>fxUnpaid(f)&&f.ech&&f.ech<td).sort((a,b)=>cmp(a.ech,b.ech));
    if(ech.length&&sgDroit('factures','lecture')) G.push({k:'fe',t:'Factures échues à relancer',ico:'receipt',go:'fx-factures',items:ech.map(f=>({t:(f.num||'(sans numéro)')+' · '+nxCHF((+f._ttc||0)+(+f._fttc||0))+' CHF',s:[fxClient(D,f),'échue le '+dfr(f.ech)].filter(Boolean).join(' · '),go:'fx-saisie',arg:'f:'+f.id}))});
    const lim=diso(new Date(now.getFullYear(),now.getMonth(),now.getDate()-30)), ns=D.c.filter(c=>c.envoye&&!c.signe&&!c.annule&&!c.termine&&c.date&&c.date<lim);
    if(ns.length&&sgDroit('contrats','lecture')) G.push({k:'cs',t:'Contrats envoyés, non signés depuis 30 jours',ico:'contrat',go:'fx-contrats',items:ns.map(c=>({t:(c.affaire||'')+' · '+(c.projet||c.nom||''),s:'envoyé le '+dfr(c.date),go:'fx-calchono',arg:'c:'+c.id}))}); }
  if(me){ const mine=DS.by('timelog','STAFF_ID',me.ID), parJour={}; mine.forEach(r=>{ const k=tlKey(r); parJour[k]=(parJour[k]||0)+(+r.TIMEPERIOD||0); });
    const manq=[]; for(let i=1,n=0;n<10&&i<30;i++){ const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-i); if(!d.getDay()||d.getDay()===6) continue; n++; if(!(parJour[dayKey(d)]>0)) manq.push(d); }
    if(manq.length&&mine.length) G.push({k:'hm',t:'Jours sans heures saisies',ico:'timer',go:'h-saisie',max:10,items:manq.map(d=>({t:nxCap(JOURS_L[d.getDay()])+' '+dfr(diso(d)),s:'Aucune heure saisie — ouvrir ma feuille d’heures',go:'h-saisie',arg:'jour:'+diso(d)}))}); }
  const tr=DS.all('projecttask').filter(t=>!t.DONEDATE&&t.DEADLINE&&t.DEADLINE<td&&(sgAdmin()||(me&&String(t.STAFF_ID)===String(me.ID))));
  if(tr.length) G.push({k:'tr',t:'Tâches en retard',ico:'task',go:'taches-encours',items:tr.map(t=>{ const p=DS.get('project',t.PROJECT_ID); return {t:t.SUBJECT||'(sans objet)',s:(p?p.NUMBER+' · ':'')+'échéance '+dfr(t.DEADLINE),ref:p?'p:'+p.ID:null}; })});
  if(D&&sgDroit('finances','projets')){ const taux=sgTaux(), al=DS.all('project').filter(p=>+p.PROJECTSTATECODE===2&&!sgInterne(p)).map(p=>sgRenta(p,D,taux)).filter(x=>x.niv>=2).sort((a,b)=>b.niv-a.niv);
    if(al.length) G.push({k:'re',t:'Projets en alerte de rentabilité',ico:'coins',go:'nx-renta',items:al.map(x=>({t:x.p.NUMBER+' · '+(x.p.TITLE||''),s:x.al.map(a=>a[1]).join(' · '),ref:'p:'+x.p.ID}))});
  }
  if(D&&sgAdmin()){ const r=sgCarnetReste(sgCarnetOriginal()), hs=sgHeuresAReprendre().filter(x=>x.ok).length;
    if(r.ent.length||hs) G.push({k:'rg',t:'Registres en double à réunir',ico:'group',go:'nx-reunir',items:[{t:r.ent.length+' adresse(s) du carnet, '+hs+' saisie(s) de temps de Facturation',s:'Réglages ▸ Réunir les registres'}]}); }
  sgValidationsATraiter(G);
  if(sgFinVerrou()) for(let i=G.length-1;i>=0;i--) if(/^(fe|cs|re)$/.test(G[i].k)) G.splice(i,1);
  SG_AT={n:G.reduce((s,g)=>s+(/^(fe|cs|tr|hm|va|vr)$/.test(g.k)?g.items.length:1),0),groupes:G}; sgSide(); return SG_AT; }
const sgSide0=sgSide; sgSide=function(){ sgSide0(); const a=document.querySelector('#nx-nav [data-go="nx-home"] .lb'); if(a&&SG_AT.n) a.insertAdjacentHTML('beforeend',' <i class="sg-badge">'+SG_AT.n+'</i>'); };
function sgATraiterHtml(A){ if(!A.groupes.length) return nxCard('c12','À traiter aujourd’hui','<div class="nx-empty">Rien d’urgent : factures, contrats, heures, tâches, rentabilité et sauvegarde sont à jour.</div>');
  return nxCard('c12','À traiter aujourd’hui','<div class="b flush sg-at">'+A.groupes.map(g=>'<div class="sg-at-g"><div class="sg-at-t" data-go="'+g.go+'">'+nxSvg(g.ico)+'<b>'+nxE(g.t)+'</b><span class="nx-tag '+(g.k==='fe'||g.k==='re'||g.k==='sv'?'urg':'s3')+'">'+(g.n||g.items.length)+'</span></div>'
    +g.items.slice(0,g.max||4).map(x=>'<div class="nx-row" '+(x.go?'data-go="'+x.go+'" data-arg="'+nxE(x.arg||'')+'"':x.ref?'data-ref="'+x.ref+'"':x.fn?'data-fn="'+x.fn+'"':'data-go="'+g.go+'"')+'><div class="t"><b>'+nxE(x.t)+'</b><span>'+nxE(x.s||'')+'</span></div></div>').join('')
    +(g.items.length>(g.max||4)?'<div class="nx-row" data-go="'+g.go+'"><div class="t"><span>… et '+(g.items.length-(g.max||4))+' autre(s)</span></div></div>':'')+'</div>').join('')+'</div>','<span class="n">'+A.n+'</span>'); }
{ const r0=VIEWS['nx-home'].render; VIEWS['nx-home'].render=function(m){ r0.call(this,m); const pg=m.querySelector('.nx-page'), right=pg&&pg.querySelector('.sg-split>div:last-child'); if(!right) return;
    const at=h('div',{id:'sg-at',class:'nx-grid',style:{marginBottom:'30px'},html:SG_AT.groupes.length?sgATraiterHtml(SG_AT):'<div class="nx-card c12"><h4>À traiter aujourd’hui</h4><div class="nx-empty">Vérification…</div></div>'}); right.prepend(at);
    pg._fn.temps=()=>sgSaisieRapide({});
    const b=pg.querySelector('.acts [data-go="h-saisie"]'); if(b){ b.removeAttribute('data-go'); b.dataset.fn='temps'; b.insertAdjacentHTML('afterend','<button class="nx-btn" data-fn="chrono">'+nxSvg('clock')+'Démarrer le minuteur</button>'); pg._fn.chrono=el=>sgMinuteurMenu(el); }
    sgATraiter().then(A=>{ if(at.isConnected) at.innerHTML=sgATraiterHtml(A); }).catch(e=>console.error(e)); }; }
setInterval(()=>{ if(NX.booted) sgATraiter().catch(()=>{}); },10*60e3);

/* ═══ 6. FICHIERS JOINTS ET PDF DANS L'APP ═══════════════════════════════════════════════════════════════════
   Le dépôt du moteur (ch03a…) passait par le serveur DeltaSub. Désormais : contenus dans ce navigateur (IndexedDB
   « SUBGestion », par empreinte SHA-256) + copie disque sur le serveur de sauvegarde ; fichiers de l'ancien dépôt lus au besoin
   sur le serveur ; PDF faits par Chrome via le serveur de sauvegarde ; fusion et superposition de PDF dans l'app (pdf-lib) ;
   ouverture dans une visionneuse intégrée (plus d'onglets bloqués). */
const SG_APERCUS={};
const sgMime=n=>({pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',svg:'image/svg+xml',txt:'text/plain',csv:'text/csv',html:'text/html',json:'application/json'})[ch03aExt(n)]||'application/octet-stream';
/* SHA-256 en JavaScript : repli quand crypto.subtle manque (page en http:// sur le NAS = contexte non sécurisé) */
const SG_K256=new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,
  0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,
  0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,
  0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,
  0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
function sgSha256Js(data){ data=data instanceof Uint8Array?data:new Uint8Array(data);
  const H=new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]), l=data.length, nb=((l+72)>>6)<<6, m=new Uint8Array(nb);
  m.set(data); m[l]=0x80; const dv=new DataView(m.buffer); dv.setUint32(nb-4,(l*8)>>>0); dv.setUint32(nb-8,Math.floor(l/0x20000000)); const W=new Uint32Array(64);
  for(let o=0;o<nb;o+=64){ for(let i=0;i<16;i++) W[i]=dv.getUint32(o+i*4);
    for(let i=16;i<64;i++){ const x=W[i-15], y=W[i-2]; W[i]=(W[i-16]+((x>>>7|x<<25)^(x>>>18|x<<14)^(x>>>3))+W[i-7]+((y>>>17|y<<15)^(y>>>19|y<<13)^(y>>>10)))|0; }
    let a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
    for(let i=0;i<64;i++){ const t1=(h+((e>>>6|e<<26)^(e>>>11|e<<21)^(e>>>25|e<<7))+((e&f)^(~e&g))+SG_K256[i]+W[i])|0, t2=(((a>>>2|a<<30)^(a>>>13|a<<19)^(a>>>22|a<<10))+((a&b)^(a&c)^(b&c)))|0;
      h=g; g=f; f=e; e=(d+t1)|0; d=c; c=b; b=a; a=(t1+t2)|0; }
    H[0]+=a; H[1]+=b; H[2]+=c; H[3]+=d; H[4]+=e; H[5]+=f; H[6]+=g; H[7]+=h; }
  const out=new Uint8Array(32), ov=new DataView(out.buffer); for(let i=0;i<8;i++) ov.setUint32(i*4,H[i]); return out; }
const sgHex=u=>[...u].map(b=>b.toString(16).padStart(2,'0')).join('');
async function sgSha(buf){ if(window.crypto&&crypto.subtle) return sgHex(new Uint8Array(await crypto.subtle.digest('SHA-256',buf))); return sgHex(sgSha256Js(buf)); }
function sgPagesPdf(buf){ try{ const m=new TextDecoder('latin1').decode(buf).match(/\/Type\s*\/Page(?!s)/g); return m?m.length:null; }catch(_){ return null; } }
/* pages d'un PDF : lecture directe, sinon pdf-lib (PDF à flux d'objets compressés) */
async function sgCompterPages(buf){ const n=sgPagesPdf(buf); if(n) return n;
  try{ const w=FX&&FX.w; if(w&&w.PDFLib) return (await w.PDFLib.PDFDocument.load(new w.Uint8Array(buf),{ignoreEncryption:true,updateMetadata:false})).getPageCount(); }catch(_){} return null; }
async function sgFichierRanger(blob,nom){ const buf=await blob.arrayBuffer();
  if(buf.byteLength>CH03A_MAX){ const x=new Error(CH03A_MSG.gros); x.status=413; throw x; }
  const sha=await sgSha(buf); if(!(await SGDB.get('fichiers',sha).catch(()=>null))) await SGDB.put('fichiers',{sha,blob:new Blob([buf],{type:blob.type||sgMime(nom)}),taille:buf.byteLength,nom,ajoute:Date.now()});
  sgSrv().then(ok=>{ if(ok) fetch(SG_SRV+'/fichiers/ranger?sha='+sha,{method:'POST',body:buf}).catch(()=>{}); });
  return {sha,taille:buf.byteLength,pages:(ch03aExt(nom)==='pdf'||blob.type==='application/pdf')?await sgCompterPages(buf):null}; }
async function sgFichierLire(sha){ const r=await SGDB.get('fichiers',sha).catch(()=>null); if(r) return r.blob;
  if(await sgSrv()){ const x=await fetch(SG_SRV+'/fichiers/lire?sha='+encodeURIComponent(sha)).catch(()=>null);
    if(x&&x.ok){ const b=await x.blob(); await SGDB.put('fichiers',{sha,blob:b,taille:b.size,ajoute:Date.now()}).catch(()=>{}); return b; } }
  return null; }
async function sgHtmlPdf(html){ if(!(await sgSrv(true))||!SAUV.srv.pdf){ const x=new Error('Pour créer un PDF, lancez le serveur de sauvegarde (fact_backup_server.py) sur ce Mac.'); x.status=503; throw x; }
  const r=await fetch(SG_SRV+'/html2pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({html})});
  if(!r.ok){ let m=''; try{ m=(await r.json()).error; }catch(_){} const x=new Error(m||'Création du PDF impossible.'); x.status=r.status; throw x; }
  return new Blob([await r.arrayBuffer()],{type:'application/pdf'}); }
async function sgPdfLib(){ const w=await fxEnsure(); if(!w.PDFLib) throw new Error('Bibliothèque PDF non chargée dans le cadre Facturation : rechargez la page.'); return w; }
async function sgPdfOctets(w,sha){ const b=await sgFichierLire(sha); if(!b){ const x=new Error('Fichier absent de ce navigateur.'); x.status=404; throw x; } return new w.Uint8Array(await b.arrayBuffer()); }
ch03aApi=async function(url,o){ o=o||{}; const u=new URL(url,'http://localhost'), q=u.searchParams, meth=String(o.method||'GET').toUpperCase(), corps=()=>JSON.parse(String(o.body||'{}'));
  if(u.pathname==='/api/file'&&meth==='POST'&&q.has('nom')){ const b=o.body instanceof Blob?o.body:new Blob([o.body]); return Object.assign({ok:true},await sgFichierRanger(b,q.get('nom'))); }
  if(u.pathname==='/api/file'&&q.has('version')){   // R9 : version d'un nom supprimé — base du bureau : demandée au serveur (sinon 409 à la recréation du même nom)
    if(dsEstBureau()) try{ const r=await fetch('/api/file?version='+encodeURIComponent(q.get('version')),{cache:'no-store'}), d=await r.json(); if(r.ok&&d&&d.ok!==false) return d; }catch(_){}
    return {ok:true,supprime:false}; }
  if(u.pathname==='/api/pdf'&&meth==='GET'){ await sgSrv(); return {ok:true,chrome:SAUV.srv&&SAUV.srv.pdf?'Chrome (serveur de sauvegarde)':null,outils:true}; }
  if(u.pathname==='/api/pdf'&&meth==='POST'){ const {html,apercu}=corps(), pdf=await sgHtmlPdf(html), buf=await pdf.arrayBuffer();
    if(apercu){ const id='ap'+Date.now().toString(36); SG_APERCUS[id]=pdf; return {ok:true,apercu:id,taille:pdf.size,pages:await sgCompterPages(buf)}; }
    return Object.assign({ok:true},await sgFichierRanger(pdf,'document.pdf')); }
  if(u.pathname==='/api/file/fusion'){ const w=await sgPdfLib(), P=w.PDFLib.PDFDocument, out=await P.create();
    for(const sha of corps().shas||[]){ const src=await P.load(await sgPdfOctets(w,sha)); (await out.copyPages(src,src.getPageIndices())).forEach(pg=>out.addPage(pg)); }
    return Object.assign({ok:true},await sgFichierRanger(new Blob([await out.save()],{type:'application/pdf'}),'fusion.pdf')); }
  if(u.pathname==='/api/file/superposer'){ const w=await sgPdfLib(), P=w.PDFLib.PDFDocument, {base,calque}=corps(), doc=await P.load(await sgPdfOctets(w,base));
    const [pg]=await doc.embedPdf(await sgPdfOctets(w,calque),w.Array.of(0)), last=doc.getPage(doc.getPageCount()-1); last.drawPage(pg,{x:0,y:0,width:last.getWidth(),height:last.getHeight()});
    return Object.assign({ok:true},await sgFichierRanger(new Blob([await doc.save()],{type:'application/pdf'}),'document.pdf')); }
  const x=new Error('Fonction du dépôt indisponible dans SUBGestion ('+u.pathname+').'); x.status=501; throw x; };
window.SG3_FICHIERS=true;   // dépôt de fichiers assuré ici (navigateur + serveur de sauvegarde), même sans serveur : chapitres DOCUMENTS du moteur actifs
const sgUrl0=ch03aUrl;
ch03aUrl=function(x,dl){ x=x||{}; if(x.ref!=null) return sgUrl0(x,dl); const e=encodeURIComponent, nom=e(String((x.NOM!=null?x.NOM:x.nom)||'').normalize('NFC'));
  return x.apercu!=null?'sgf:?apercu='+e(x.apercu)+'&nom='+nom+(dl?'&dl=1':''):'sgf:?sha='+e(x.SHA256||x.sha||'')+'&nom='+nom+(dl?'&dl=1':''); };
const sgLien0=ch03aLien; ch03aLien=function(url){ if(String(url).startsWith('sgf:')) return sgOuvrirUrl(url,true); return sgLien0(url); };
ch03aOnglet=function(){ return { aller(url){ if(String(url).startsWith('sgf:')){ sgOuvrirUrl(url,false); return true; } try{ window.open(url,'_blank'); }catch(_){} return true; }, fermer(){} }; };
async function sgOuvrirUrl(url,telecharger){ const q=new URLSearchParams(String(url).slice(5).replace(/^\?/,'')), nom=q.get('nom')||'fichier';
  let b=q.get('apercu')?SG_APERCUS[q.get('apercu')]:await sgFichierLire(q.get('sha'));
  if(!b){ sgAlert('« '+nom+' » n’est pas disponible dans ce navigateur.\n\nPour le récupérer, lancez le serveur de sauvegarde (il lit aussi l’ancien dépôt DeltaSub), puis réessayez.'); return; }
  if(!b.type||b.type==='application/octet-stream') b=new Blob([b],{type:sgMime(nom)});
  if(telecharger||q.get('dl')==='1'){ const a=h('a',{href:URL.createObjectURL(b),download:nom}); document.body.append(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },3000); return; }
  sgVisionneuse(b,nom); }
/* aperçu d'un fichier : seulement des types sans script — PDF (lecteur du navigateur), images (<img>), texte brut ; HTML seulement pour les
   documents faits par l'app (o.interne), dans un cadre sans scripts. Un fichier déposé (HTML, SVG, XML…) ne s'exécute jamais dans l'app. */
function sgVisionneuse(b,nom,o){ o=o||{}; const t=String(b.type||'').toLowerCase().split(';')[0].trim();
  const vue=t==='application/pdf'?'pdf':/^image\/(png|jpe?g|gif|webp|bmp|svg\+xml)$/.test(t)?'img':/^text\/(plain|csv|tab-separated-values)$/.test(t)?'txt':t==='text/html'&&o.interne?'html':null;
  const u=URL.createObjectURL(vue==='txt'?new Blob([b],{type:'text/plain;charset=utf-8'}):b), ov=h('div',{class:'sg-visu'});
  const fermer=()=>{ ov.remove(); URL.revokeObjectURL(u); document.removeEventListener('keydown',esc,true); }, esc=e=>{ if(e.key==='Escape'){ e.stopPropagation(); fermer(); } };
  const corps=vue==='img'?h('div',{class:'sg-visu-img'},h('img',{src:u,alt:nom})):vue?h('iframe',Object.assign({src:u,title:nom},vue==='pdf'?{}:{sandbox:'allow-same-origin allow-modals'})):h('div',{class:'nx-empty'},'Aperçu impossible pour ce type de fichier : utilisez « Télécharger ».');
  ov.append(h('div',{class:'sg-visu-bar'},h('b',{},nom),h('span',{style:{flex:1}}),
    h('button',{class:'btn',onclick:()=>{ const a=h('a',{href:u,download:nom}); document.body.append(a); a.click(); a.remove(); }},'Télécharger'),
    corps.tagName==='IFRAME'?h('button',{class:'btn',onclick:()=>{ try{ corps.contentWindow.print(); }catch(_){ toast('Impression : utilisez Télécharger puis imprimez.',true); } }},'Imprimer'):'',
    h('button',{class:'btn pri',onclick:fermer},'Fermer')),corps);
  document.body.append(ov); document.addEventListener('keydown',esc,true); }
/* titre lisible d'un dossier du dépôt (fiche projet ▸ Documents) : « Contrôle des coûts › <document> › Adjudications »… */
function sgDossierLib(d){ const s=String(d||'').split('/'), doc=(t,id)=>{ const x=DS.get(t,id); return x?(x.NOTE||x.VERSION||'document '+id):'document '+id; }, reste=a=>a.filter(Boolean).join(' › ');
  const coco=typeof CC_DOC_SOUS!=='undefined'?CC_DOC_SOUS:{'':'Général'};
  if(s[0]==='ProjectDocuments'&&s[1]==='Documents') return reste([{Documents:'Documents',Meetings:'Séances',Invoices:'Factures',FeeCalculations:'Calculs d’honoraires',Contracts:'Contrats'}[s[3]]||s[3]].concat(s.slice(4)))||'Documents';
  if(s[0]==='Construction'&&s[1]==='Costcontrol') return reste(['Contrôle des coûts',doc('costcontroldocument',s[3]),coco[s[5]||'']||s[5]].concat(s.slice(6)));
  if(s[0]==='Construction'&&s[1]==='Costestimate') return reste(['Devis général',doc('costestimatedocument',s[3])].concat(s.slice(5)));
  if(s[0]==='Construction'&&s[1]==='Costplanning') return reste(['Calcul des coûts',doc('costplanningdocument',s[3])].concat(s.slice(5)));
  if(s[0]==='Construction'&&s[1]==='Devis') return reste(['Soumissions','n° '+(s[4]||'')].concat(s.slice(5)));
  return reste(s); }
async function sgAjouterFichiers(p){ const inp=h('input',{type:'file',multiple:true});
  inp.onchange=async()=>{ const fs=[...inp.files]; if(!fs.length) return; let n=0; const dos=ch03aDossier('document',p.ID,'Général');
    for(const f of fs){ try{ await ch03aDeposer(dos,f.name,f,{projet:p.ID,origine:'import'}); n++; }
      catch(e){ if(e.message==='existe'){ if(await confirmDlg('« '+f.name+' » existe déjà. Le remplacer ?','Remplacer')){ await ch03aDeposer(dos,f.name,f,{projet:p.ID,origine:'import',remplacer:true}); n++; } } else toast('✗ '+f.name+' : '+e.message,true); } }
    if(n) toast(n+' fichier'+(n>1?'s':'')+' ajouté'+(n>1?'s':'')+' à '+p.NUMBER+'.'); };
  inp.click(); }
async function sgRapatrier(){ await DS.need(['depotfichier']); const shas=[...new Set(DS.all('depotfichier').map(f=>f.SHA256).filter(Boolean))], ici=new Set(await SGDB.cles('fichiers'));
  const manq=shas.filter(s=>!ici.has(s)); if(!manq.length){ toast('Tous les fichiers du dépôt sont déjà dans ce navigateur.'); return; }
  if(!(await sgSrv(true))){ sgAlert(manq.length+' fichier(s) ne sont pas encore dans ce navigateur. Lancez le serveur de sauvegarde pour les rapatrier.'); return; }
  let ok=0; toast('Rapatriement de '+manq.length+' fichier(s)…'); for(const s of manq){ if(await sgFichierLire(s)) ok++; }
  toast(ok+' fichier(s) rapatrié(s)'+(ok<manq.length?', '+(manq.length-ok)+' introuvable(s)':'')+'.'); }

/* ═══ 7. SAISIE DE TEMPS RAPIDE ET MINUTEUR ═══════════════════════════════════════════════════════════════
   Mêmes règles que la Feuille d’heures (champs obligatoires de l'affaire, périodes verrouillées, chevauchements). */
function sgDerniere(sid,pid){ return DS.by('timelog','STAFF_ID',sid).filter(r=>!+r.ISHOLIDAY&&(pid==null||String(r.PROJECT_ID)===String(pid))).sort((a,b)=>tlKey(b)-tlKey(a)||cmp(b.TIMEHOUR2,a.TIMEHOUR2))[0]; }
/* heure arrondie au quart d'heure (début : vers le bas, fin : vers le haut, au plus 23:59) */
function sgQuart(d,haut){ let m=d.getHours()*60+d.getMinutes(); m=Math.min(1439,(haut?Math.ceil:Math.floor)(m/15)*15); return hm(Math.floor(m/60),m%60); }
function sgSaisieRapide(pre){ pre=pre||{}; const me=nxMe(); if(!me){ toast('Aucun membre de l’équipe n’est lié à cet utilisateur.',true); return; }
  const staffs=staffList(), sel=(opts,v)=>opts.map(([k,t])=>'<option value="'+nxE(k)+'"'+(String(k)===String(v)?' selected':'')+'>'+nxE(t)+'</option>').join('');
  const S=h('select',{class:'inp'}), P=h('select',{class:'inp'}), A=h('select',{class:'inp'}), F=h('select',{class:'inp'}), Dt=h('input',{class:'inp',type:'date'}), T1=h('input',{class:'inp',type:'time',step:900}),
    Du=h('input',{class:'inp',type:'number',step:'0.25',min:'0.25',placeholder:'h'}), T2=h('input',{class:'inp',type:'time',step:900}), De=h('input',{class:'inp',placeholder:'Ce qui a été fait (facultatif sauf exigence du projet)'}), Fa=h('input',{type:'checkbox',checked:true});
  S.innerHTML=sel(staffs.map(s=>[s.ID,staffName(s)]),pre.staff||me.ID);
  const now=new Date(), d0=pre.debut?new Date(pre.debut):now; Dt.value=diso(d0);
  const mins=x=>{ if(!x.value) return null; const [a,b]=x.value.split(':').map(Number); return a*60+b; };
  const fromDur=()=>{ const a=mins(T1), p=Math.round((+Du.value||0)*4)*15; if(a!=null&&p>0){ const e=Math.min(1439,a+p); T2.value=hm(Math.floor(e/60),e%60); } };
  const fromT=()=>{ const a=mins(T1), b=mins(T2); if(a!=null&&b!=null&&b>a) Du.value=+((b-a)/60).toFixed(2); };
  Du.oninput=fromDur; T1.oninput=()=>{ if(Du.value) fromDur(); else fromT(); }; T2.oninput=fromT;
  const remplirP=()=>{ const st=DS.get('staff',S.value); let L=staffProjects(st).filter(p=>+p.PROJECTSTATECODE===2); if(!L.length) L=DS.all('project').filter(p=>+p.PROJECTSTATECODE===2);
    if(pre.projet&&!L.some(p=>String(p.ID)===String(pre.projet))&&DS.get('project',pre.projet)) L.push(DS.get('project',pre.projet));
    const rec={}; DS.by('timelog','STAFF_ID',+S.value).forEach(r=>{ const k=tlKey(r); if(!rec[r.PROJECT_ID]||k>rec[r.PROJECT_ID]) rec[r.PROJECT_ID]=k; });
    L.sort((a,b)=>(rec[b.ID]||0)-(rec[a.ID]||0)||cmp(a.NUMBER,b.NUMBER));
    const cur=P.value||pre.projet||(sgDerniere(+S.value)||{}).PROJECT_ID; P.innerHTML='<option value="">— choisir le projet —</option>'+sel(L.map(p=>[p.ID,projLabel(p)]),cur); remplirA(); };
  const remplirA=()=>{ const pid=+P.value, sid=+S.value, last=pid?sgDerniere(sid,pid):null, ags=DS.by('projectactivitygroup','PROJECT_ID',pid).sort((a,b)=>cmp(a.SORTORDER,b.SORTORDER)), o=[];
    ags.forEach(g=>{ let acts=DS.by('projectactivity','PROJECTACTIVITYGROUP_ID',g.ID).sort((a,b)=>cmp(a.SORTORDER,b.SORTORDER)); const ok=acts.filter(a=>DS.get('projectactivity_staff',a.ID+'-'+sid)); if(ok.length) acts=ok; acts.forEach(a=>o.push([g.ID+'|'+a.ID,nm(g)+' › '+nm(a)])); });
    A.innerHTML=(o.length>1?'<option value="">— activité —</option>':'')+sel(o,last?last.ACTIVITYGROUP_ID+'|'+last.ACTIVITY_ID:(o.length===1?o[0][0]:''));
    const ph=DS.by('projectphase','PROJECT_ID',pid).sort((a,b)=>cmp(a.NUMBER,b.NUMBER)), f=[];
    ph.forEach(x=>{ const sp=DS.by('projectsubphase','PROJECTPHASE_ID',x.ID).filter(s=>!s.ISTERMINATED).sort((a,b)=>cmp(a.NUMBER,b.NUMBER)); if(sp.length) sp.forEach(s=>f.push([x.ID+'|'+s.ID,nm(x)+' › '+nm(s)])); else f.push([x.ID+'|',nm(x)]); });
    const pj=DS.get('project',pid)||{}; De.placeholder=+pj.ISTIMEDESCMANDATORY?'Ce qui a été fait (obligatoire pour ce projet)':'Ce qui a été fait (facultatif)'; F.innerHTML='<option value="">'+(+pj.ISTIMEPHASEMANDATORY?'— phase (obligatoire) —':'— sans phase —')+'</option>'+sel(f,last?last.PHASE_ID+'|'+(last.SUBPHASE_ID||''):'');
    const dj=DS.by('timelog','STAFF_ID',sid).filter(r=>tlKey(r)===dayKey(new Date(Dt.value+'T00:00'))).sort((a,b)=>(b.TIMEHOUR2*60+b.TIMEMINUTE2)-(a.TIMEHOUR2*60+a.TIMEMINUTE2))[0];
    if(!T1.dataset.fixe) T1.value=pre.debut?sgQuart(d0,false):dj?hm(dj.TIMEHOUR2,dj.TIMEMINUTE2):'08:00'; };
  S.onchange=()=>{ P.value=''; remplirP(); }; P.onchange=remplirA; Dt.onchange=remplirA; T1.addEventListener('input',()=>T1.dataset.fixe=1);
  remplirP(); if(pre.fin){ T2.value=sgQuart(new Date(pre.fin),true); fromT(); }
  const L=(t,el)=>[h('label',{},t),el];
  const body=h('div',{class:'form',style:{gridTemplateColumns:'max-content 1fr',minWidth:'520px'}},...L('Membre',S),...L('Projet',P),...L('Activité',A),...L('Phase',F),...L('Jour',Dt),
    ...L('Heure',h('div',{style:{display:'flex',gap:'8px',alignItems:'center'}},T1,'–',T2,h('span',{style:{color:'var(--s-gris)'}},'soit'),Du,'h')),...L('Commentaire',De),...L('',h('label',{style:{textAlign:'left'}},Fa,' Facturable')));
  const save=async encore=>{ const sid=+S.value, pid=+P.value, [ag,ac]=A.value.split('|'), [ph,sp]=F.value.split('|'), a=mins(T1), b=mins(T2), dt=new Date(Dt.value+'T00:00'), pj=DS.get('project',pid)||{};
    if(!pid||!ag||!ac){ toast('Projet et activité sont obligatoires.',true); return false; }
    if(a==null||b==null||b<=a){ toast('Indiquez une heure de début et une durée (ou une heure de fin).',true); return false; }
    if(+pj.ISTIMEPHASEMANDATORY&&(!ph||(!sp&&DS.by('projectsubphase','PROJECTPHASE_ID',+ph).length))){ toast('La phase (et la phase partielle) est obligatoire pour ce projet.',true); return false; }
    if(+pj.ISTIMEDESCMANDATORY&&!De.value.trim()){ toast('Le commentaire est obligatoire pour ce projet.',true); return false; }
    if(typeof hsFrozen==='function'&&hsFrozen(dt,sid)){ toast('Saisie des heures verrouillée pour cette période.',true); return false; }
    const v={ID:null,STAFF_ID:sid,TIMEYEAR:dt.getFullYear(),TIMEMONTH:dt.getMonth(),TIMEDAY:dt.getDate(),TIMEHOUR1:Math.floor(a/60),TIMEMINUTE1:a%60,TIMEHOUR2:Math.floor(b/60),TIMEMINUTE2:b%60,TIMEPERIOD:(b-a)/60,
      PROJECT_ID:pid,ACTIVITYGROUP_ID:+ag,ACTIVITY_ID:+ac,PHASE_ID:ph?+ph:null,SUBPHASE_ID:sp?+sp:null,SUBPROJECT_ID:null,DESCRIPTION:De.value.trim()||null,ISCHARGEABLE:Fa.checked?1:0,ISCHARGED:0,ISHOLIDAY:0,TIMELOGSTATECODE:0,CHARGEDDATE:null};
    if(typeof hsOverlap==='function'&&hsOverlap(v)){ toast('Ce créneau chevauche une autre saisie.',true); return false; }
    await DS.save('timelog',v); toast(nxH(v.TIMEPERIOD)+' h enregistrées sur '+(pj.NUMBER||'')+'.'); if(encore) setTimeout(()=>sgSaisieRapide({projet:pid,staff:sid}),60); };
  const D=dialog({title:'Saisie de temps',body,buttons:[{t:'Feuille complète',fn:()=>{ go('h-saisie'); }},{t:'Annuler'},{t:'Enregistrer et nouvelle',fn:()=>save(true)},{t:'Enregistrer',pri:true,fn:()=>save(false)}]});
  setTimeout(()=>{ (P.value?(Du.value?De:Du):P).focus(); },40); return D; }
/* minuteur : démarré sur une affaire, affiché dans l'en-tête ; à l'arrêt, la saisie rapide s'ouvre pré-remplie */
const sgChrono=()=>nxLS.get('sg3_minuteur',null);
function sgMinuteurMenu(el){ const me=nxMe(); if(!me){ toast('Aucun membre lié à cet utilisateur.',true); return; }
  const rec={}; DS.by('timelog','STAFF_ID',me.ID).forEach(r=>{ const k=tlKey(r); if(!rec[r.PROJECT_ID]||k>rec[r.PROJECT_ID]) rec[r.PROJECT_ID]=k; });
  const L=staffProjects(me).filter(p=>+p.PROJECTSTATECODE===2).sort((a,b)=>(rec[b.ID]||0)-(rec[a.ID]||0)).slice(0,10);
  popMenu(el,(L.length?L:DS.all('project').filter(p=>+p.PROJECTSTATECODE===2).slice(0,10)).map(p=>({t:projLabel(p),fn:()=>sgMinuteurStart(p.ID)}))); }
function sgMinuteurStart(pid){ nxLS.set('sg3_minuteur',{projet:pid,debut:Date.now()}); sgMinuteurAff(); toast('Minuteur démarré sur '+(DS.get('project',pid)||{}).NUMBER+'.'); }
function sgMinuteurStop(){ const c=sgChrono(); if(!c) return; nxLS.set('sg3_minuteur',null); sgMinuteurAff(); sgSaisieRapide({projet:c.projet,debut:c.debut,fin:Date.now()}); }
function sgMinuteurAff(){ let b=document.getElementById('sg-chrono'); const c=sgChrono();
  if(!c){ if(b) b.remove(); return; }
  if(!b){ b=h('button',{id:'sg-chrono',class:'sg-chrono',title:'Arrêter le minuteur et enregistrer le temps',onclick:sgMinuteurStop}); document.getElementById('nx-new').before(b); }
  const s=Math.floor((Date.now()-c.debut)/1000), p=DS.get('project',c.projet)||{};
  b.innerHTML=nxSvg('timer')+'<span>'+nxE(p.NUMBER||'')+'</span><b>'+String(Math.floor(s/3600)).padStart(2,'0')+':'+String(Math.floor(s/60)%60).padStart(2,'0')+'</b><i>■</i>'; }
setInterval(sgMinuteurAff,15000);
{ const t=setInterval(()=>{ if(NX.booted){ clearInterval(t); sgMinuteurAff(); } },1000); }
nxNewMenu=function(el){ popMenu(el,[
  {t:'Saisie de temps',fn:()=>sgSaisieRapide({})},{t:'Démarrer le minuteur …',fn:()=>sgMinuteurMenu(el)},'-',
  {t:'Projet',fn:()=>editProject()},{t:'Contact — société',fn:()=>editOwner(null,0)},{t:'Contact — personne',fn:()=>editOwner(null,1)},'-',
  {t:'Contrat d’honoraires',fn:()=>go('fx-calchono','new')},{t:'Facture ou acompte',fn:()=>go('fx-saisie','new')},{t:'Note de frais',fn:()=>go('frais')}]); };
{ const i0=nxPalIndex; nxPalIndex=function(){ const it=i0(); [['Saisie de temps rapide','timer',()=>sgSaisieRapide({})],['Démarrer le minuteur','clock',()=>sgMinuteurMenu(document.getElementById('nx-new'))],
    ['Sauvegarder la base maintenant','save',()=>sgSauver(true)],['Rentabilité des projets','coins',()=>go('nx-renta')],['Réunir les registres','group',()=>go('nx-reunir')]]
    .forEach(([t,ico,run])=>it.push({g:'Commandes',t,ico,run,q:t,n:nxNorm(t)})); return it; }; }

/* ═══ 8. LIBELLÉS ET ICÔNES HARMONISÉS ═════════════════════════════════════════════════════════════════════
   « Affaire » → « Projet » dans ce qui s'affiche à l'écran du moteur (colonnes, boutons, menus, titres de fenêtres), au
   moment de l'affichage : les impressions et les modèles de documents gardent leurs libellés. Facturation : les émojis
   des boutons et titres deviennent les icônes au trait de la coquille (pas dans les pages de documents ni les PDF). */
const SG_LIB=[[/Toutes les affaires/g,'Tous les projets'],[/toutes les affaires/g,'tous les projets'],[/Nouvelle affaire/g,'Nouveau projet'],
  [/d[’']une affaire existante/g,'d’un projet existant'],[/[Dd]e l[’']affaire/g,'du projet'],[/à l[’']affaire/g,'au projet'],[/L[’']affaire/g,'Le projet'],
  [/l[’']affaire/g,'le projet'],[/d[’']affaires/g,'de projets'],[/d[’']affaire/g,'de projet'],[/cette affaire/g,'ce projet'],[/une affaire/g,'un projet'],
  [/affaires internes/g,'projets internes'],[/affaires externes/g,'projets externes'],[/Affaires/g,'Projets'],[/affaires/g,'projets'],[/Affaire/g,'Projet'],[/affaire/g,'projet']];
function sgLib(t){ if(typeof t!=='string'||t.indexOf('ffaire')<0) return t; for(const [a,b] of SG_LIB) t=t.replace(a,b); return t; }
{ const g0=grid; grid=function(el,o){ if(o&&Array.isArray(o.cols)) o.cols.forEach(c=>{ if(c&&typeof c.t==='string') c.t=sgLib(c.t); }); return g0.apply(this,arguments); }; }
{ const i0=ibtn; ibtn=function(b){ if(b&&typeof b==='object'&&!b.nodeType&&typeof b.t==='string') b.t=sgLib(b.t); return i0.apply(this,arguments); }; }
{ const m0=popMenu; popMenu=function(a,items){ if(Array.isArray(items)) items.forEach(it=>{ if(it&&typeof it==='object'&&typeof it.t==='string') it.t=sgLib(it.t); }); return m0.apply(this,arguments); }; }
{ const d0=dialog; dialog=function(o){ if(o&&typeof o.title==='string') o.title=sgLib(o.title); return d0.apply(this,arguments); }; }
Object.assign(NXI,{trash:'<path d="M4 6.5h16M9 6.5V4h6v2.5M6 6.5l1 14h10l1-14M10 10.5v6M14 10.5v6"/>',lock:'<rect x="5" y="10.5" width="14" height="10"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
  box:'<path d="M3 4.5h18v4H3zM4.5 8.5V20h15V8.5M10 12.5h4"/>',flag:'<path d="M5 21V3.5M5 4h12l-2.5 4.5L17 13H5"/>',window:'<rect x="3" y="4" width="18" height="16"/><path d="M3 8.5h18"/>',
  stop:'<circle cx="12" cy="12" r="9.5"/><path d="M7.5 12h9"/>',eyeoff:'<path d="M3 3l18 18M6.3 7.8C4.6 9 3.3 10.7 2.5 12c1 1.5 4.5 6 9.5 6 1.6 0 3-.4 4.3-1.1M10.6 6.1c.5-.1.9-.1 1.4-.1 5 0 8.5 4.5 9.5 6-.5.8-1.5 2.1-2.9 3.3"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  unlock:'<rect x="5" y="10.5" width="14" height="10"/><path d="M8 10.5V7a4 4 0 0 1 7.7-1.5"/>'});
const SG_EMO={'🗑':'trash','📄':'doc','🖨':'print','📁':'folder','🔍':'search','🔒':'lock','📦':'box','📇':'contacts','🗔':'window','📤':'export','📊':'analyse',
  '✏':'edit','⚙':'gear','✉':'mail','⏱':'timer','✍':'edit','🏁':'flag','⚠':'urgent','🙈':'eyeoff','⛔':'stop'};
const SG_EMO_RE=/(🗑|📄|🖨|📁|🔍|🔒|📦|📇|🗔|📤|📊|✏|⚙|✉|⏱|✍|🏁|⚠|🙈|⛔)️?[  ]?/u, SG_EMO_HORS='.offre-page,script,style,textarea,svg,canvas,[contenteditable="true"],[contenteditable=""],.pdf-page,.no-sg-emo';
function sgEmoTexte(tn,doc){ const p=tn.parentNode; if(!p||p.nodeType!==1||!SG_EMO_RE.test(tn.nodeValue)||p.closest(SG_EMO_HORS)) return;
  if(p.closest('select,option')){ tn.nodeValue=tn.nodeValue.replace(new RegExp(SG_EMO_RE.source,'gu'),''); return; }
  const fr=doc.createDocumentFragment(); let r=tn.nodeValue, m;
  while((m=r.match(SG_EMO_RE))){ if(m.index) fr.append(r.slice(0,m.index)); const s=doc.createElement('span'); s.className='sg-emo'; s.setAttribute('aria-hidden','true'); s.innerHTML=nxSvg(SG_EMO[m[1]]); fr.append(s); r=r.slice(m.index+m[0].length); }
  if(r) fr.append(r); p.replaceChild(fr,tn); }
function sgEmoArbre(n,doc){ if(n.nodeType===3){ sgEmoTexte(n,doc); return; } if(n.nodeType!==1) return;
  n.querySelectorAll('[placeholder]').forEach(i=>{ if(SG_EMO_RE.test(i.placeholder)) i.placeholder=i.placeholder.replace(new RegExp(SG_EMO_RE.source,'gu'),''); });
  const w=doc.createTreeWalker(n,4), L=[]; while(w.nextNode()) if(/[☀-➿\u{1F300}-\u{1FAFF}]/u.test(w.currentNode.nodeValue)) L.push(w.currentNode); L.forEach(t=>sgEmoTexte(t,doc)); }
function sgEmoInstaller(w){ if(!w||w.__sgEmo||!w.document||!w.document.body) return; w.__sgEmo=1; const doc=w.document; sgEmoArbre(doc.body,doc);
  new w.MutationObserver(ms=>{ for(const m of ms){ if(m.type==='characterData') sgEmoTexte(m.target,doc); else m.addedNodes.forEach(n=>sgEmoArbre(n,doc)); } }).observe(doc.body,{childList:true,subtree:true,characterData:true}); }
{ const f0=fxEnsure; fxEnsure=function(){ const p=f0.apply(this,arguments); Promise.resolve(p).then(w=>{ try{ sgEmoInstaller(w||FX.w); }catch(e){ console.error(e); } },()=>{}); return p; }; }

/* ═══ 9. ACCÈS PROTÉGÉ (Facturation, Finances, Réglages) ═══════════════════════════════════════════════════
   Code d'accès propre à ce poste : empreinte PBKDF2-SHA-256 salée (jamais le code lui-même) dans localStorage « sg3_acces ».
   Déverrouillage valable pour l'onglet du navigateur, reverrouillé après N minutes d'inactivité. C'est une protection de
   l'interface (collègue, visiteur) : les données du navigateur et les sauvegardes ne sont pas chiffrées. */
const SG_ACC_DEF={doms:['facturation','finances','reglages','rh','ancien','ancienf'],delai:15};
const sgAcces=()=>{ const s=nxLS.get('sg3_acces',{}), a=Object.assign({},SG_ACC_DEF,s); if(s.doms&&!s.rhVu&&!a.doms.includes('rh')) a.doms=[...a.doms,'rh'];   // « rh » (07.10.2026) : protégé aussi avec des réglages antérieurs, jusqu'au premier choix
  if(s.doms&&!s.ancVu&&(a.doms.includes('facturation')||a.doms.includes('finances'))) ['ancien','ancienf'].forEach(k=>{ if(!a.doms.includes(k)) a.doms=[...a.doms,k]; });   // chapitres provisoires « Honoraires (ancien) » et « Facturation (ancien) » (13.10.2026) : comme Facturation / Finances
  return a; };
const sgAccesSet=o=>{ nxLS.set('sg3_acces',Object.assign(sgAcces(),o)); sgVerrouAff(); };
const sgB64=u=>btoa(String.fromCharCode(...new Uint8Array(u))), sgDe64=t=>Uint8Array.from(atob(t),c=>c.charCodeAt(0));
async function sgHacher(code,sel){ const pw=new TextEncoder().encode(String(code).normalize('NFC'));
  if(!(window.crypto&&crypto.subtle)) return sgB64(sgPbkdf2Js(pw,new Uint8Array(sel),150000));   // http:// sur le NAS : même résultat, calculé en JavaScript
  const k=await crypto.subtle.importKey('raw',pw,'PBKDF2',false,['deriveBits']);
  return sgB64(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:sel,iterations:150000},k,256)); }
/* PBKDF2-HMAC-SHA-256, un bloc de 32 octets (repli sans crypto.subtle) */
function sgPbkdf2Js(pw,salt,n){ let key=pw.length>64?sgSha256Js(pw):pw; const k=new Uint8Array(64); k.set(key);
  const ip=k.map(x=>x^0x36), op=k.map(x=>x^0x5c), cat=(a,b)=>{ const r=new Uint8Array(a.length+b.length); r.set(a); r.set(b,a.length); return r; };
  const hmac=m=>sgSha256Js(cat(op,sgSha256Js(cat(ip,m))));
  let u=hmac(cat(salt,new Uint8Array([0,0,0,1]))); const t=u.slice(); for(let i=1;i<n;i++){ u=hmac(u); for(let j=0;j<32;j++) t[j]^=u[j]; } return t; }
async function sgCodeOk(code){ const a=sgAcces(); if(!a.hash) return true; return (await sgHacher(code,sgDe64(a.sel)))===a.hash; }
async function sgCodeDefinir(code){ const sel=crypto.getRandomValues(new Uint8Array(16)); sgAccesSet({sel:sgB64(sel),hash:await sgHacher(code,sel),depuis:Date.now()}); sgOuvrir(); }
const sgOuvertTs=()=>{ try{ return +sessionStorage.getItem('sg3_ouvert')||0; }catch(_){ return 0; } };
function sgOuvert(){ const a=sgAcces(); if(!a.hash) return true; const t=sgOuvertTs(); return !!t&&(!+a.delai||Date.now()-t<a.delai*60e3); }
function sgOuvrir(){ try{ sessionStorage.setItem('sg3_ouvert',String(Date.now())); }catch(_){} sgVerrouAff(); }
function sgVerrouiller(){ try{ sessionStorage.removeItem('sg3_ouvert'); }catch(_){} sgVerrouAff(); if(VIEW&&sgProtege(sgDomDe(VIEW.id))) go('nx-home'); else if(VIEW&&/^nx-(home|projet)$/.test(VIEW.id)) go(VIEW.id,VIEW.arg); }
const sgDomDe=v=>{ const x=NX_VIEW[v]; return x&&x.d?(x.d.k||x.d):null; };   // NX_VIEW[v].d = objet du domaine
const sgProtege=d=>!!d&&!!sgAcces().hash&&sgAcces().doms.includes(d);
const sgFinVerrou=()=>(!sgOuvert()&&(sgProtege('finances')||sgProtege('facturation')))||(typeof sgDroit==='function'&&!sgDroit('finances','projets')&&!sgDroit('factures','lecture'));
let SG_ESSAIS={n:0,jusqua:0}, SG_DLG_ACC=null;
function sgDeverrouiller(msg){ if(sgOuvert()) return Promise.resolve(true); if(SG_DLG_ACC) return SG_DLG_ACC;
  return SG_DLG_ACC=new Promise(res=>{ const I=h('input',{class:'inp',type:'password',autocomplete:'off',style:{width:'260px'}}), E=h('div',{style:{color:'var(--s-rouge)',minHeight:'18px',marginTop:'8px',fontSize:'12.5px'}});
    let fini=false; const fin=v=>{ if(!fini){ fini=true; SG_DLG_ACC=null; res(v); } };
    const essayer=async()=>{ if(Date.now()<SG_ESSAIS.jusqua){ E.textContent='Trop d’essais : patientez '+Math.ceil((SG_ESSAIS.jusqua-Date.now())/1000)+' s.'; return false; }
      if(await sgCodeOk(I.value)){ SG_ESSAIS.n=0; sgOuvrir(); fin(true); return true; }
      if(++SG_ESSAIS.n>=5){ SG_ESSAIS={n:0,jusqua:Date.now()+30e3}; } E.textContent='Code incorrect.'; I.value=''; I.focus(); return false; };
    const D=dialog({title:'Accès protégé',body:h('div',{},h('p',{style:{margin:'0 0 12px',maxWidth:'360px',fontWeight:300}},msg||'Cette partie de l’app est protégée. Saisissez le code d’accès.'),I,E),
      buttons:[{t:'Annuler',fn:()=>fin(false)},{t:'Déverrouiller',pri:true,fn:()=>essayer()}]});
    I.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); essayer().then(ok=>{ if(ok) D.close(); }); } if(e.key==='Escape') fin(false); });
    const ov=D.bd.closest('.ov'); new MutationObserver((_,o)=>{ if(!ov.isConnected){ o.disconnect(); fin(false); } }).observe(document.body,{childList:true}); setTimeout(()=>I.focus(),30); }); }
{ const g0=go; go=function(v,arg){ const d=sgDomDe(v);
    if(sgProtege(d)&&!sgOuvert()){ const avant=VIEW&&VIEW.id; sgDeverrouiller().then(ok=>{ if(ok) go(v,arg); else if(!avant||sgProtege(sgDomDe(avant))) g0('nx-home'); }); if(!avant) g0('nx-home'); return; }
    return g0.apply(this,arguments); }; }
/* activité (coquille et cadre Facturation) → prolonge le déverrouillage ; inactivité → verrouillage */
let SG_ACT=0; const sgActivite=()=>{ const n=Date.now(); if(n-SG_ACT<5000) return; SG_ACT=n; if(sgAcces().hash&&sgOuvert()) sgOuvrir(); };
['pointerdown','keydown'].forEach(e=>document.addEventListener(e,sgActivite,true));
{ const f0=fxEnsure; fxEnsure=function(){ const p=f0.apply(this,arguments); Promise.resolve(p).then(w=>{ w=w||FX.w; if(w&&!w.__sgAct){ w.__sgAct=1; ['pointerdown','keydown'].forEach(e=>w.document.addEventListener(e,sgActivite,true)); } },()=>{}); return p; }; }
let SG_ETAT_ACC=null;
setInterval(()=>{ const o=sgOuvert(); if(SG_ETAT_ACC===true&&!o){ sgVerrouiller(); toast('Verrouillé après '+sgAcces().delai+' min d’inactivité.'); } SG_ETAT_ACC=o; },20000);
/* bouton cadenas au pied du menu */
function sgVerrouAff(){ const mb=document.getElementById('nx-minibtn'); if(!mb) return; let b=document.getElementById('sg-lock'); const a=sgAcces();
  if(!a.hash){ if(b) b.remove(); return; }
  if(!b){ b=h('button',{class:'nx-ico-btn',id:'sg-lock',onclick:()=>{ if(sgOuvert()){ sgVerrouiller(); toast('Verrouillé.'); } else sgDeverrouiller().then(ok=>{ if(ok&&VIEW) go(VIEW.id,VIEW.arg); }); }}); mb.before(b); }
  const o=sgOuvert(); b.innerHTML=nxSvg(o?'unlock':'lock'); b.title=o?'Verrouiller maintenant':'Déverrouiller (code d’accès)'; b.classList.toggle('on',!o); }
{ const t=setInterval(()=>{ if(NX.booted){ clearInterval(t); sgVerrouAff(); SG_ETAT_ACC=sgOuvert(); } },1000); }
{ const r0=VIEWS['nx-home'].render; VIEWS['nx-home'].render=function(m){ r0.apply(this,arguments); if(sgFinVerrou()){ const c=m.querySelector('#sg-home-fx'); if(c) c.closest('.nx-card').remove(); } }; }
/* écran Réglages ▸ Accès protégé */
async function sgExigerOuvert(){ return sgOuvert()||sgDeverrouiller('Confirmez avec le code d’accès actuel.'); }
function sgCodeDlg(changer){ const I1=h('input',{class:'inp',type:'password',autocomplete:'new-password'}), I2=h('input',{class:'inp',type:'password',autocomplete:'new-password'}), I0=h('input',{class:'inp',type:'password',autocomplete:'off'});
  const body=h('div',{class:'form',style:{gridTemplateColumns:'max-content 240px'}},...(changer?[h('label',{},'Code actuel'),I0]:[]),h('label',{},'Nouveau code'),I1,h('label',{},'Confirmer'),I2,
    h('div',{style:{gridColumn:'1 / -1',fontSize:'12px',color:'var(--s-gris)',maxWidth:'380px'}},'Au moins 4 caractères. Le code n’est pas enregistré : seule son empreinte l’est. Code oublié : voir la note en bas de cet écran.'));
  dialog({title:changer?'Changer le code d’accès':'Définir un code d’accès',body,buttons:[{t:'Annuler'},{t:'Enregistrer',pri:true,fn:async()=>{
    if(changer&&!(await sgCodeOk(I0.value))){ toast('Code actuel incorrect.',true); return false; }
    if(I1.value.length<4){ toast('Le code doit compter au moins 4 caractères.',true); return false; }
    if(I1.value!==I2.value){ toast('Les deux saisies ne correspondent pas.',true); return false; }
    await sgCodeDefinir(I1.value); toast(changer?'Code d’accès changé.':'Code d’accès défini : '+sgAcces().doms.length+' domaine(s) protégé(s).'); go('nx-acces'); }}]}); }
VIEWS['nx-acces']={ render(m){ const a=sgAcces(), doms=SG_DOM.filter(d=>d.k!=='accueil');
  const pg=nxPage(m,'<div class="sg-split">'+sgIntro('Réglages','Accès protégé','Un code d’accès à ce poste pour les parties sensibles : honoraires, factures, rentabilité, réglages. Reverrouillage automatique après une période sans activité.',
      '<div class="sg-figs"><div class="sg-fig"><div class="n">'+(a.hash?(sgOuvert()?'Ouvert':'Verrouillé'):'—')+'</div><div class="t">'+(a.hash?'code défini le '+dfr(diso(new Date(a.depuis||Date.now()))):'aucun code')+'</div></div></div>')
    +'<div><div class="nx-grid">'
    +nxCard('c6','Code d’accès','<div class="b"><p style="margin:0 0 14px;font-weight:300">'+(a.hash?'Un code protège les domaines cochés ci-contre.':'Aucun code : toute l’app est accessible sur ce poste.')+'</p><div style="display:flex;gap:8px;flex-wrap:wrap">'
      +(a.hash?'<button class="nx-btn" data-fn="chg">'+nxSvg('edit')+'Changer le code</button><button class="nx-btn" data-fn="lock">'+nxSvg('lock')+'Verrouiller maintenant</button><button class="nx-btn danger" data-fn="del">'+nxSvg('trash')+'Retirer la protection</button>'
              :'<button class="nx-btn pri" data-fn="def">'+nxSvg('lock')+'Définir un code</button>')+'</div></div>')
    +nxCard('c6','Domaines protégés','<div class="b">'+doms.map(d=>'<label class="sg-dom-chk"><input type="checkbox" data-dom="'+d.k+'"'+(a.doms.includes(d.k)?' checked':'')+'>'+nxSvg(d.ico)+nxE(d.t)+'</label>').join('')+'</div>')
    +nxCard('c6','Verrouillage automatique','<div class="b"><label style="display:flex;gap:10px;align-items:center">Après <select class="inp" id="sg-acc-delai" style="width:auto">'+[[5,'5 minutes'],[15,'15 minutes'],[30,'30 minutes'],[60,'1 heure'],[0,'fermeture de l’onglet seulement']].map(([v,t])=>'<option value="'+v+'"'+(+a.delai===v?' selected':'')+'>'+t+'</option>').join('')+'</select> sans activité</label></div>')
    +nxCard('c6','À savoir','<div class="b" style="font-weight:300;font-size:13px"><p style="margin:0 0 8px">Protection de l’<b>interface</b> sur ce poste : les écrans protégés ne s’ouvrent qu’avec le code, et les montants disparaissent de l’accueil et des fiches projet. Les données du navigateur et les fichiers de sauvegarde ne sont pas chiffrés.</p><p style="margin:0"><b>Code oublié</b> : la protection se retire en effaçant la clé « sg3_acces » du stockage local de Chrome (procédure décrite dans CLAUDE.md) ; aucune donnée n’est perdue.</p></div>')
    +'</div></div></div>');
  Object.assign(pg._fn,{def:()=>sgCodeDlg(false),chg:()=>sgCodeDlg(true),lock:()=>{ sgVerrouiller(); },
    del:async()=>{ if(!(await sgDeverrouiller('Confirmez avec le code d’accès pour retirer la protection.'))) return; const I=h('input',{class:'inp',type:'password',autocomplete:'off'});
      dialog({title:'Retirer la protection',body:h('div',{},h('p',{style:{margin:'0 0 10px',fontWeight:300}},'Code d’accès actuel :'),I),buttons:[{t:'Annuler'},{t:'Retirer',pri:true,fn:async()=>{ if(!(await sgCodeOk(I.value))){ toast('Code incorrect.',true); return false; }
        const x=sgAcces(); delete x.hash; delete x.sel; delete x.depuis; nxLS.set('sg3_acces',x); sgVerrouAff(); toast('Protection retirée.'); go('nx-acces'); }}]}); }});
  m.querySelectorAll('[data-dom]').forEach(c=>c.onchange=async()=>{ if(!(await sgExigerOuvert())){ c.checked=!c.checked; return; } sgAccesSet({doms:[...m.querySelectorAll('[data-dom]:checked')].map(x=>x.dataset.dom),rhVu:1,ancVu:1}); toast('Domaines protégés enregistrés.'); });
  const S=m.querySelector('#sg-acc-delai'); S.onchange=async()=>{ if(!(await sgExigerOuvert())){ S.value=String(sgAcces().delai); return; } sgAccesSet({delai:+S.value}); toast('Délai enregistré.'); }; } };
{ const i0=nxPalIndex; nxPalIndex=function(){ const it=i0(); if(sgAcces().hash) it.push({g:'Commandes',t:'Verrouiller maintenant',ico:'lock',run:()=>sgVerrouiller(),q:'verrouiller code accès',n:nxNorm('Verrouiller maintenant')}); return it; }; }

/* ═══ 10. PV DE CHANTIER SUR TABLETTE ══════════════════════════════════════════════════════════════════════
   « Mode chantier » (bouton d'en-tête de l'écran PV) : menu masqué, plein écran si possible, formulaire sur toute la largeur,
   cibles tactiles agrandies (fx_theme.css ▸ body.sg-tactile), aperçu PDF derrière un bouton. Sur un écran tactile, la
   présentation tactile s'applique d'office au PV. Le document PDF lui-même n'est pas modifié. */
const sgTactile=()=>{ try{ return matchMedia('(pointer:coarse)').matches; }catch(_){ return false; } };
let SG_CHANTIER=false;
const sgPvVue=()=>!!VIEW&&VIEW.id==='fx-pv-chantier';
function sgPvClasses(){ const w=FX.w, b=w&&w.document&&w.document.body; if(!b) return; const t=sgPvVue()&&(SG_CHANTIER||sgTactile());
  b.classList.toggle('sg-tactile',t); if(!t) b.classList.remove('sg-apercu'); }
function sgModeChantier(on){ SG_CHANTIER=!!on; document.getElementById('app').classList.toggle('sg-chantier',SG_CHANTIER);
  try{ const d=document, fs=d.fullscreenElement||d.webkitFullscreenElement;
    if(SG_CHANTIER&&!fs){ const e=d.documentElement; (e.requestFullscreen||e.webkitRequestFullscreen||(()=>{})).call(e); }
    if(!SG_CHANTIER&&fs) (d.exitFullscreen||d.webkitExitFullscreen).call(d); }catch(_){}
  sgPvClasses(); sgChantierBtn(); }
function sgApercuPv(){ const w=FX.w, b=w&&w.document.body; if(!b) return; const on=!b.classList.contains('sg-apercu'); b.classList.toggle('sg-apercu',on);
  if(on&&typeof w.pvPrevRefresh==='function'&&w.document.getElementById('pvf-frame')) try{ w.pvPrevRefresh(); }catch(_){} sgChantierBtn(); }
function sgChantierBtn(){ const nw=document.getElementById('nx-new'); if(!nw) return; const pv=sgPvVue();
  let b=document.getElementById('sg-chantier-btn'), a=document.getElementById('sg-apercu-btn');
  if(!pv){ if(SG_CHANTIER) sgModeChantier(false); if(b) b.remove(); if(a) a.remove(); sgPvClasses(); return; }
  if(!b){ b=h('button',{id:'sg-chantier-btn',class:'nx-btn',onclick:()=>sgModeChantier(!SG_CHANTIER)}); nw.before(b); }
  b.innerHTML=nxSvg(SG_CHANTIER?'back':'crane')+(SG_CHANTIER?'Quitter le mode chantier':'Mode chantier');
  if(!a){ a=h('button',{id:'sg-apercu-btn',class:'nx-btn',onclick:sgApercuPv}); b.before(a); }
  const fb=FX.w&&FX.w.document.body, tac=!!fb&&fb.classList.contains('sg-tactile'), ouv=tac&&fb.classList.contains('sg-apercu'), edit=!!(FX.w&&FX.w.document.getElementById('pvf-frame'));
  a.style.display=tac&&edit?'':'none'; a.innerHTML=nxSvg(ouv?'edit':'pdf')+(ouv?'Retour au formulaire':'Aperçu PDF'); a.classList.toggle('pri',ouv); }
{ const g0=go; go=function(){ const r=g0.apply(this,arguments); setTimeout(()=>{ sgPvClasses(); sgChantierBtn(); },0); return r; }; }
{ const f0=fxEnsure; fxEnsure=function(){ const p=f0.apply(this,arguments); Promise.resolve(p).then(w=>{ w=w||FX.w; if(w&&!w.__sgPv){ w.__sgPv=1; sgPvClasses();
      new w.MutationObserver(()=>{ if(sgPvVue()) sgChantierBtn(); }).observe(w.document.getElementById('pv_out')||w.document.body,{childList:true}); } },()=>{}); return p; }; }
document.addEventListener('fullscreenchange',()=>{ if(!document.fullscreenElement&&SG_CHANTIER&&!sgPvVue()) sgModeChantier(false); });

/* ═══ Base du bureau sur le NAS (07.10.2026) ═══
   Page servie par serveur_deltasub.py (dsEstBureau()) : le moteur lit et écrit la base partagée (DeltaSub.html, DSB). Ici :
   1. données Facturation (localStorage sa_* + sg3_liens / sg3_heures_reprises) synchronisées avec /api/kv : envoi après chaque
      enregistrement (événement « storage » du cadre, setItem de la page), relevé toutes les 5 s ; deux postes qui modifient la même
      clé → fusion par élément (id / num / code) quand ils n'ont pas touché au même contrat / à la même facture, sinon avertissement ;
   2. fichiers joints rangés sur le serveur (/fichiers/ranger, /fichiers/lire) ; 3. sauvegardes : celles du serveur (pas de copie locale). */
const SGKV={on:false,ver:{},base:{},fb:{},t:{},seq:0,applying:false,ready:null,bandeau:null,
  local:new Set(['sa_fact_draft','sa_calc_draft','sa_fsa','sa_backup','sa_autobackup','sa_apercu_opt','sa_ag_mode','sa_fh_opts','sa_dv_share_dest'])};
const sgKvCle=k=>typeof k==='string'&&((/^sa_/.test(k)&&!/^sa_ui_state/.test(k)&&!SGKV.local.has(k))||k==='sg3_liens'||k==='sg3_heures_reprises');
const sgKvCadre=()=>!!(FX&&FX.ready&&document.getElementById('fx-frame'));
function sgKvEcrire(k,v){ SGKV.applying=true; try{ if(v==null) localStorage.removeItem(k); else localStorage.setItem(k,v); }catch(e){ console.error(e); } finally{ SGKV.applying=false; } }
/* fusion à trois : base (ce que le cadre a lu), mine (ce qu'il enregistre), theirs (version du serveur) ; null = fusion impossible */
function sgKvFusion(base,mine,theirs){ let B,M,T; try{ B=JSON.parse(base==null?'null':base); M=JSON.parse(mine==null?'null':mine); T=JSON.parse(theirs==null?'null':theirs); }catch(_){ return null; }
  const s=x=>JSON.stringify(x===undefined?null:x), cle=o=>o&&typeof o==='object'?(o.id??o.num??o.code??o.ID):undefined;
  if(Array.isArray(M)&&Array.isArray(T)&&(B==null||Array.isArray(B))){ const b=B||[]; if([b,M,T].some(a=>a.some(o=>cle(o)==null))) return null;
    const mb=new Map(b.map(o=>[String(cle(o)),o])), mm=new Map(M.map(o=>[String(cle(o)),o])), mt=new Map(T.map(o=>[String(cle(o)),o]));
    const ordre=[...new Set([...T.map(o=>String(cle(o))),...M.map(o=>String(cle(o)))])], out=[];
    for(const k of ordre){ const vb=mb.get(k), vm=mm.get(k), vt=mt.get(k), chM=s(vm)!==s(vb), chT=s(vt)!==s(vb);
      if(chM&&chT&&s(vm)!==s(vt)) return null; const v=chM?vm:vt; if(v!==undefined) out.push(v); }
    return JSON.stringify(out); }
  if(M&&T&&typeof M==='object'&&typeof T==='object'&&!Array.isArray(M)&&!Array.isArray(T)){ const b=B&&typeof B==='object'?B:{}, out={};
    for(const k of new Set([...Object.keys(T),...Object.keys(M)])){ const chM=s(M[k])!==s(b[k]), chT=s(T[k])!==s(b[k]);
      if(chM&&chT&&s(M[k])!==s(T[k])) return null; const v=chM?M[k]:T[k]; if(v!==undefined) out[k]=v; }
    return JSON.stringify(out); }
  return null; }
function sgKvBandeau(msg,err){ let b=SGKV.bandeau; if(!b){ b=SGKV.bandeau=h('div',{style:{position:'fixed',left:'50%',transform:'translateX(-50%)',bottom:'18px',zIndex:9000,background:'#003346',color:'#fff',
      padding:'10px 14px',display:'flex',gap:'12px',alignItems:'center',fontSize:'13px',maxWidth:'720px'}}); document.body.append(b); }
  b.style.background=err?'#BD1E42':'#003346'; b.innerHTML='';
  b.append(h('span',{},msg),h('button',{class:'btn',style:{background:'#FFF266',color:'#1d1d1b',border:0},onclick:()=>{ b.remove(); SGKV.bandeau=null; sgFxReload(); }},'Actualiser'),
    h('button',{class:'btn',style:{background:'transparent',color:'#fff',border:'1px solid #fff'},onclick:()=>{ b.remove(); SGKV.bandeau=null; }},'Plus tard')); }
/* relevé : applique les valeurs du serveur ; first = relevé complet (au démarrage) */
async function sgKvReleve(first){ const r=await fetch('/api/kv?since='+(first?0:SGKV.seq),{cache:'no-store'}); if(!r.ok) throw new Error('relevé '+r.status); const d=await r.json(), ch=[];
  for(const k in d.items){ const it=d.items[k]; if(!sgKvCle(k)) continue; SGKV.ver[k]=it.ver; SGKV.base[k]=it.v;
    if(SGKV.t[k]) continue;   // envoi en attente : il fusionnera
    const cur=localStorage.getItem(k); if(cur!==it.v){ sgKvEcrire(k,it.v); ch.push(k); }
    if(!sgKvCadre()||!/^sa_/.test(k)) SGKV.fb[k]=it.v; }
  if(first) for(let i=localStorage.length-1;i>=0;i--){ const k=localStorage.key(i); if(sgKvCle(k)&&!(k in d.items)){ if(sgAdmin()) sgKvPlan(k,0); else sgKvEcrire(k,null); } }   // clés de ce poste absentes du serveur : envoyées (administrateur) ou retirées (hors du profil)
  SGKV.seq=Math.max(SGKV.seq,d.seq); return ch; }
function sgKvPlan(k,delai){ clearTimeout(SGKV.t[k]); SGKV.t[k]=setTimeout(()=>sgKvEnvoi(k).catch(e=>console.error(e)),delai==null?700:delai); }
async function sgKvEnvoi(k,essai){ SGKV.t[k]=null; let v=localStorage.getItem(k); const sv=SGKV.base[k];
  if(SGKV.ro&&SGKV.ro.has(k)){ if(v!==sv) sgKvEcrire(k,sv===undefined?null:sv); return; }   // lecture seule pour ce profil : valeur du serveur rétablie
  if(v===sv){ SGKV.fb[k]=v; return; }
  const fb=k in SGKV.fb?SGKV.fb[k]:sv; let fusion=false;
  if(k in SGKV.ver&&fb!==sv){ const m=sgKvFusion(fb,v,sv);   // le cadre travaillait sur une version dépassée
    if(m==null){ SGKV.fb[k]=v; sgKvEcrire(k,sv); sgKvBandeau('Conflit : « '+k.replace(/^sa_/,'')+' » a été modifié en même temps sur un autre poste. Votre dernière modification n’a pas été enregistrée : actualisez puis refaites-la.',true); return; }
    fusion=m!==v; SGKV.fb[k]=v; v=m; }
  const r=await fetch('/api/kv',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({k,v,base:k in SGKV.ver?SGKV.ver[k]:null,who:DS.who()})}), d=await r.json().catch(()=>({}));
  if(r.status===403&&d.lecture_seule){ SGKV.ro.add(k); sgKvEcrire(k,sv===undefined?null:sv); SGKV.fb[k]=sv;
    if(!SG_KV_MUETTES.test(k)) toast('✗ '+(d.msg||'Modification non permise par votre profil.'),true); return; }
  if(r.ok&&d.ok&&d.v!=null&&d.v!==v){ SGKV.ver[k]=d.ver; SGKV.base[k]=d.v; SGKV.fb[k]=d.v; sgKvEcrire(k,d.v); NET.ok(); return; }   // le serveur a fusionné / marqué « à valider »
  if(r.ok&&d.ok){ SGKV.ver[k]=d.ver; SGKV.base[k]=v; if(!fusion) SGKV.fb[k]=localStorage.getItem(k)===v?v:SGKV.fb[k];
    if(fusion){ sgKvEcrire(k,v); if(sgKvCadre()) sgKvBandeau('Facturation : les modifications d’un autre poste ont été réunies aux vôtres. Actualisez pour les voir.'); }
    NET.ok(); return; }
  if(r.status===409&&d.conflit&&!essai){ SGKV.ver[k]=d.conflit.ver; SGKV.base[k]=d.conflit.v; if(!fusion) SGKV.fb[k]=fb; return sgKvEnvoi(k,true); }
  if(r.status===401){ ch08dExpired(d); return; }
  NET.fail('données Facturation non enregistrées'); toast('✗ Facturation : enregistrement sur le serveur du bureau impossible ('+(d.error||r.status)+'). Nouvel essai dans 30 s.',true); sgKvPlan(k,30000); }
/* état de départ du cadre Facturation : ce qu'il lit en mémoire */
const sgKvFbTout=()=>{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(sgKvCle(k)) SGKV.fb[k]=localStorage.getItem(k); } };
window.addEventListener('storage',e=>{ if(SGKV.on&&e.storageArea===localStorage&&sgKvCle(e.key)) sgKvPlan(e.key); });   // écritures du cadre Facturation
{ const set0=Storage.prototype.setItem, rem0=Storage.prototype.removeItem;   // écritures de la page (sg3_liens…)
  Storage.prototype.setItem=function(k,v){ set0.call(this,k,v); if(SGKV.on&&!SGKV.applying&&this===localStorage&&sgKvCle(k)) sgKvPlan(k); };
  Storage.prototype.removeItem=function(k){ rem0.call(this,k); if(SGKV.on&&!SGKV.applying&&this===localStorage&&sgKvCle(k)) sgKvPlan(k); }; }
{ const f0=fxEnsure; fxEnsure=function(){ if(FX.p||!dsEstBureau()) return f0.apply(this,arguments);
    const p=(async()=>{ try{ await SGKV.ready; }catch(_){} sgKvFbTout(); FX.p=null; return f0(); })(); FX.p=p; p.catch(()=>{ FX.p=null; }); return p; }; }
async function sgKvTic(){ if(!SGKV.on) return; try{ const ch=await sgKvReleve(false);
    if(ch.some(k=>/^sa_/.test(k))&&FX.p){ if(VIEW&&/^fx-/.test(VIEW.id)) sgKvBandeau('Facturation : des modifications ont été faites sur un autre poste.'); else { FX.p=null; FX.ready=false; const f=document.getElementById('fx-frame'); if(f) f.remove(); } } }
  catch(e){ NET.fail('serveur du bureau injoignable'); } }
SGKV.ready=(async()=>{ for(let i=0;i<900&&!(typeof DS!=='undefined'&&DS.info);i++) await new Promise(r=>setTimeout(r,100));
  if(!dsEstBureau()) return; await sgAccPret(); sgKvPoste(); SGKV.on=true; await sgKvReleve(true); setInterval(sgKvTic,5000); })();
SGKV.ready.catch(e=>{ console.error(e); toast('✗ Données Facturation du bureau illisibles : '+(e.message||e),true); });
/* fichiers joints : sur le serveur du bureau (copie gardée dans ce navigateur) */
{ const r0=sgFichierRanger, l0=sgFichierLire;
  sgFichierRanger=async function(blob,nom){ const res=await r0(blob,nom); if(dsEstBureau()){ const b=await SGDB.get('fichiers',res.sha).catch(()=>null);
      const x=await fetch('/fichiers/ranger?sha='+res.sha,{method:'POST',body:b?b.blob:blob}); if(!x.ok){ let m=''; try{ m=(await x.json()).error; }catch(_){} const e=new Error(m||'Fichier non enregistré sur le serveur du bureau.'); e.status=x.status; throw e; } }
    return res; };
  sgFichierLire=async function(sha){ const b=await SGDB.get('fichiers',sha).catch(()=>null); if(b) return b.blob;
    if(dsEstBureau()){ const x=await fetch('/fichiers/lire?sha='+encodeURIComponent(sha)).catch(()=>null); if(x&&x.ok){ const bl=await x.blob(); await SGDB.put('fichiers',{sha,blob:bl,taille:bl.size,ajoute:Date.now()}).catch(()=>{}); return bl; } }
    return l0(sha); }; }
/* sauvegardes : faites par le serveur du bureau (toutes les heures) et par Hyper Backup sur le NAS */
{ const s0=sgSauver; sgSauver=async function(manuel){ if(!dsEstBureau()) return s0(manuel);
    SAUV.etat=Object.assign({},SAUV.etat,{ou:'serveur du bureau',lieu:'NAS (sauvegarde horaire)',quand:Date.now(),seq:DS.seq,erreur:null}); nxLS.set('sg3_sauvegarde',SAUV.etat); sgSauvAff();
    if(manuel) toast('Base du bureau : sauvegardée automatiquement sur le NAS. Pour une copie sur ce poste : Exporter la base de gestion.');
    return true; }; }

/* ═══ 11. PROFILS D'ACCÈS ET DROITS (07.10.2026) ═════════════════════════════════════════════════════════════════
   Administrateur (tout), chef de projet, collaborateur ; droits des deux derniers réglés par l'administrateur dans Réglages ▸
   Profils et accès (collection « sgacces »). Sur le NAS avec ouverture de session, le SERVEUR applique ces droits aux données
   (chaque poste ne reçoit que son périmètre, écritures refusées, contrats et factures « à valider ») ; ici l'interface suit :
   menu, accueil, fiches, feuille d'heures, validations. Fichier ouvert par double-clic (sans serveur) : seul, administrateur.
   ⚠ SG_DROITS et SG_DEFAUTS identiques à serveur_deltasub.py. */
const SG_DROITS={projets_voir:['siens','tous'],projets_modifier:['aucun','siens','tous'],heures:['siennes','projets','toutes'],frais:['siens','projets','tous'],
  chantier:['aucun','lecture','ecriture'],pv:['aucun','lecture','saisie','validation'],documents:['lecture','depot'],contacts:['lecture','ecriture'],equipe:['liste','taux'],
  contrats:['aucun','lecture','validation','edition'],factures:['aucune','lecture','validation','edition'],finances:['aucune','projets','toutes'],bibliotheque:['lecture','ecriture'],reglages:['non','oui']};
const SG_DEFAUTS={
  cdp:{projets_voir:'siens',projets_modifier:'siens',heures:'projets',frais:'projets',chantier:'ecriture',pv:'validation',documents:'depot',contacts:'ecriture',equipe:'liste',contrats:'validation',factures:'validation',finances:'projets',bibliotheque:'lecture',reglages:'non'},
  collab:{projets_voir:'siens',projets_modifier:'aucun',heures:'siennes',frais:'siens',chantier:'lecture',pv:'saisie',documents:'depot',contacts:'lecture',equipe:'liste',contrats:'aucun',factures:'aucune',finances:'aucune',bibliotheque:'lecture',reglages:'non'}};
const SG_DROITS_LIB=[
  ['projets_voir','Projets visibles','Les autres projets ne s’affichent pas.',{siens:'Ses projets (équipe du projet, heures saisies)',tous:'Tous les projets du bureau'}],
  ['projets_modifier','Projets modifiables','Fiche, phases, équipe, notes et tâches.',{aucun:'Aucun (lecture)',siens:'Ses projets',tous:'Tous, et création de projets'}],
  ['heures','Heures','Ce que la personne voit des heures saisies (elle ne saisit que les siennes).',{siennes:'Les siennes',projets:'Toutes celles de ses projets — situations par collaborateur, par phase',toutes:'Toutes les heures du bureau'}],
  ['frais','Notes de frais','',{siens:'Les siennes',projets:'Celles de ses projets',tous:'Toutes'}],
  ['chantier','Chantier','Estimations, descriptifs et devis, appels d’offres, contrôle des coûts.',{aucun:'Aucun accès',lecture:'Lecture',ecriture:'Lecture et modification'}],
  ['pv','PV de chantier','',{aucun:'Aucun accès',lecture:'Lecture',saisie:'Saisie (ses ajouts sont à valider)',validation:'Saisie, validation et envoi'}],
  ['documents','Documents','Fichiers joints des projets.',{lecture:'Lecture',depot:'Lecture et dépôt'}],
  ['contacts','Contacts','',{lecture:'Lecture',ecriture:'Lecture et modification'}],
  ['equipe','Équipe','',{liste:'Liste des membres',taux:'Avec taux internes et coûts de revient'}],
  ['contrats','Contrats d’honoraires','Sur les projets visibles.',{aucun:'Aucun accès',lecture:'Lecture',validation:'Édition, à valider par l’administrateur',edition:'Édition libre (et validation)'}],
  ['factures','Factures','Sur les projets visibles.',{aucune:'Aucun accès',lecture:'Lecture',validation:'Édition, à valider par l’administrateur',edition:'Édition libre (et validation)'}],
  ['finances','Finances','Rentabilité, cockpits, controlling.',{aucune:'Aucun accès',projets:'Rentabilité de ses projets (sans les taux)',toutes:'Toutes les finances du bureau'}],
  ['bibliotheque','Bibliothèque','Modèles, documents types.',{lecture:'Lecture',ecriture:'Lecture et modification'}],
  ['reglages','Réglages','Comptes, sauvegardes, paramètres du bureau.',{non:'Aucun accès',oui:'Accès complet'}]];
const SG_TOUT=Object.fromEntries(Object.entries(SG_DROITS).map(([k,v])=>[k,v[v.length-1]]));
const SG_PROFILS={admin:'Administrateur',cdp:'Chef de projet',collab:'Collaborateur'};
let SG_ACC={profil:'admin',droits:{...SG_TOUT},staffs:[],projets:null,auth:false};
var SG_ACC_PRET=null, SG_COUTS=null;
const sgAdmin=()=>SG_ACC.profil==='admin';
function sgDroit(k,niv){ const L=SG_DROITS[k]; if(!L) return true; const a=L.indexOf(SG_ACC.droits[k]); return (a<0?L.length-1:a)>=L.indexOf(niv); }
function sgAccPret(){ return SG_ACC_PRET||Promise.resolve(); }
async function sgCoutsCharger(){ try{ const r=await fetch('/api/couts',{cache:'no-store'}), d=await r.json(); if(d&&d.ok) SG_COUTS=d.projets; }catch(_){} }
SG_ACC_PRET=(async()=>{ for(let i=0;i<900&&!(typeof DS!=='undefined'&&DS.info);i++) await new Promise(r=>setTimeout(r,100));
  if(!(typeof dsEstBureau==='function'&&dsEstBureau())) return;
  try{ const r=await fetch('/api/session',{cache:'no-store'}), d=await r.json(); if(d&&d.auth&&d.acces) SG_ACC=Object.assign({auth:true,userid:d.user&&d.user.USERID},d.acces); }catch(_){}
  if(!sgAdmin()&&sgDroit('finances','projets')){ await sgCoutsCharger(); setInterval(sgCoutsCharger,10*60e3); }
  const t=setInterval(()=>{ if(NX.booted){ clearInterval(t); sgAccesAppliquer(); } },150); })();
function sgAccesAppliquer(){ try{ document.body.dataset.profil=SG_ACC.profil; }catch(_){} sgSide(); sgNav();
  if(VIEW&&!sgVueOk(VIEW.id)) go('nx-home'); else if(VIEW&&VIEW.id==='nx-home') go('nx-home');
  if(!sgAdmin()) toast('Connecté·e : profil « '+SG_PROFILS[SG_ACC.profil]+' ».');
  setTimeout(()=>sgATraiter().catch(()=>{}),2500); }
/* écrans permis (menu, vues d'ensemble, palette ⌘K : nxCan) */
const SG_VUE_DROIT={'aff-toutes':()=>sgDroit('projets_voir','tous'),'aff-gestion':()=>SG_ACC.profil!=='collab'&&sgDroit('projets_modifier','tous'),'aff-controlling':()=>SG_ACC.profil!=='collab'&&sgDroit('heures','projets'),   /* collaborateur : ni Registre ni Suivi & écarts (18.10.2026) */
  coplan:()=>sgDroit('chantier','lecture'),devis:()=>sgDroit('chantier','lecture'),soum:()=>sgDroit('chantier','lecture'),coco:()=>sgDroit('chantier','lecture'),
  'fx-pv-chantier':()=>sgDroit('pv','lecture'),'adr-props':()=>sgDroit('contacts','ecriture'),'h-dispo':()=>sgDroit('heures','projets'),
  'collab-tous':()=>sgDroit('equipe','taux'),'collab-anciens':()=>sgDroit('equipe','taux'),'mg-planning':()=>sgDroit('equipe','taux'),'mg-heures':()=>sgDroit('heures','projets'),'mg-collab':()=>sgDroit('equipe','taux'),
  'fx-contrats':()=>sgDroit('contrats','lecture'),'fx-calchono':()=>sgDroit('contrats','validation'),'fx-factures':()=>sgDroit('factures','lecture'),'fx-saisie':()=>sgDroit('factures','validation'),
  'nx-valider':()=>sgDroit('contrats','validation')||sgDroit('factures','validation'),'fx-cockpit':()=>sgDroit('finances','projets'),'fx-cockpit2':()=>sgDroit('finances','projets'),
  'nx-renta':()=>sgDroit('finances','projets'),'nx-profils':()=>sgAdmin()};
function sgVueOk(v){ if(!v||sgAdmin()) return true;
  if(/^dom-/.test(v)){ const d=SG_D[v.slice(4)]; return !!d&&d.items.some(it=>!it.hide&&sgVueOk(it.v)); }
  if(SG_VUE_DROIT[v]) return !!SG_VUE_DROIT[v]();
  const x=NX_VIEW[v], dk=x&&x.d&&x.d.k;
  if(dk==='reglages') return sgDroit('reglages','oui');
  if(dk==='finances'||dk==='facturation') return sgDroit('finances','toutes');
  return true; }
{ const g0=go; go=function(v,arg){
    if(v==='h-saisie'&&typeof arg==='string'&&arg.startsWith('jour:')){ try{ HS.d=new Date(arg.slice(5)+'T00:00'); }catch(_){} arg=undefined; }   // « jour sans heures » de l'accueil
    if(!sgVueOk(v)){ toast('Cet écran n’est pas accessible avec votre profil ('+SG_PROFILS[SG_ACC.profil]+').',true); return VIEW?undefined:g0.call(this,'nx-home'); }
    return g0.call(this,v,arg); }; }
/* projets sur lesquels la personne travaille (même règle que le serveur) : équipe du projet + heures saisies */
function sgMesProjets(){ const st=ME.staff, set=new Set(); if(!st) return set; const pers=String(st.PERSON_ID);
  DS.all('projectmember').forEach(m=>{ if(String(m.RESPCONTACT_ID)===pers||String(m.CONTACT_ID)===pers) set.add(String(m.PROJECT_ID)); });
  DS.by('timelog','STAFF_ID',st.ID).forEach(r=>set.add(String(r.PROJECT_ID))); return set; }
/* feuille d'heures, notes de frais : chef de projet et collaborateur → leur nom seulement ; administrateur → tous les collaborateurs actuels */
{ const f0=ch08bMyStaffs; ch08bMyStaffs=function(u){ if(u!==undefined&&u!==ME.u) return f0.apply(this,arguments);
    if(sgAdmin()) return staffList(); const s=ME.staff; return s?[s]:f0.apply(this,arguments).slice(0,1); }; }
/* libellés : « Feuille d'heures », « Note de frais » (en plus d'« Affaire » → « Projet ») */
SG_LIB.push([/Feuilles? de temps/g,m=>m[0]+'euille'+(m.includes('es ')?'s':'')+' d’heures'],[/feuilles? de temps/g,m=>'feuille'+(m.includes('es ')?'s':'')+' d’heures'],
  [/Dépenses/g,'Notes de frais'],[/Dépense(?![a-zé])/g,'Note de frais'],[/dépenses/g,'notes de frais'],[/dépense(?![a-zé])/g,'note de frais']);
sgLib=function(t){ if(typeof t!=='string'||!/ffaire|euilles? de temps|épense/.test(t)) return t; for(const [a,b] of SG_LIB) t=t.replace(a,b); return t; };
/* rentabilité sans les taux (chef de projet) : coût de revient agrégé calculé par le serveur */
{ const r0=sgRenta; sgRenta=function(p,D,taux){ const x=r0.apply(this,arguments); if(SG_COUTS&&!DS.all('staffrate').length){ const e=SG_COUTS[p.ID]||{}; x.cout=+e.cout||0;
      x.marge=x.factHT-x.cout; x.conso=x.contratHT?x.cout/x.contratHT:null; x.al=x.al.filter(a=>!/^Coût /.test(a[1]));
      if(x.contratHT&&x.cout>x.contratHT) x.al.unshift(['r','Coût au-delà des honoraires']); else if(x.contratHT&&x.conso>=0.8) x.al.unshift(['o','Coût à '+Math.round(x.conso*100)+' % des honoraires']);
      x.niv=x.al.some(a=>a[0]==='r')?3:x.al.some(a=>a[0]==='o')?2:x.al.length?1:0; } return x; }; }
const sgTauxVisibles=()=>DS.all('staffrate').length>0&&!sgFinVerrou();
/* fiche projet : onglets selon les droits */
/* onglets du tableau de bord du projet visibles pour un collaborateur (19.10.2026) : ni Vue d'ensemble ni Temps ; les droits du profil
   s'appliquent en plus (Contrats & factures : lecture des contrats ou des factures ; Chantier : chantier ou PV) */
const SG_ONGLETS_COLLAB=['factu','faisa','projet','interv','chantier','notes'];   // + Faisabilité et Projet (20.10.2026)   // « factu » = Contrats & factures, phases comprises (20.10.2026)
const sgFactuOk=()=>sgDroit('contrats','lecture')||sgDroit('factures','lecture');
const sgOngletOk=k=>(SG_ACC.profil!=='collab'||SG_ONGLETS_COLLAB.includes(k))&&(k==='factu'?true:k==='fact'?sgDroit('factures','lecture'):k==='chantier'?(sgDroit('chantier','lecture')||sgDroit('pv','lecture')):k==='projet'||k==='faisa'?(sgDroit('documents','lecture')||sgDroit('chantier','lecture')):true);

/* ── Données Facturation partagées : profil du poste (clés en lecture seule, poste changé de main) ── */
SGKV.ro=new Set();
const SG_KV_MUETTES=/^sa_(seed_ver|phases_pct_migrated|import_ok|last_tva|cfc_edits|cond_groupes|affaires|affaires_statut|rap_|dv_catoff|banques)/;
function sgKvPoste(){ const u=String(SG_ACC.userid||(ME.u&&ME.u.USERID)||''); let avant=null; try{ avant=localStorage.getItem('sg3_kv_user'); }catch(_){}
  if(avant!==u){ for(let i=localStorage.length-1;i>=0;i--){ const k=localStorage.key(i); if(sgKvCle(k)) sgKvEcrire(k,null); }   // données de l'utilisateur précédent effacées de ce poste
    try{ localStorage.setItem('sg3_kv_user',u); }catch(_){} } }

/* ── Validation des contrats et factures (Facturation ▸ À valider) ── */
function sgListeKV(k){ try{ const v=JSON.parse(localStorage.getItem(k)||'[]'); return Array.isArray(v)?v:[]; }catch(_){ return []; } }
const sgValideur=k=>sgAdmin()||sgDroit(k==='sa_contrats'?'contrats':'factures','edition');
function sgEnAttente(){ const out=[]; [['sa_contrats','Contrat'],['sa_factures5','Facture']].forEach(([k,t])=>sgListeKV(k).forEach(o=>{ const v=o&&o._validation; if(v&&(v.etat==='a_valider'||v.etat==='refuse')) out.push({k,t,o,v}); })); return out; }
const sgValLib=x=>x.k==='sa_contrats'?[(x.o.affaire||''),(x.o.projet||x.o.nom||'')].filter(Boolean).join(' · '):[(x.o.num||'(sans numéro)'),nxCHF((+x.o._ttc||0)+(+x.o._fttc||0))+' CHF'].join(' · ');
function sgValidationsATraiter(G){ const L=sgEnAttente(); if(!L.length) return; const me=String(ME.id||'');
  const av=L.filter(x=>x.v.etat==='a_valider'&&sgValideur(x.k));
  if(av.length) G.unshift({k:'va',t:'Contrats et factures à valider',ico:'check',go:'nx-valider',items:av.map(x=>({t:x.t+' '+sgValLib(x),s:'préparé par '+(x.v.par||'?')+' le '+dfr(String(x.v.le||'').slice(0,10)),go:'nx-valider'}))});
  const rf=L.filter(x=>x.v.etat==='refuse'&&x.v.par===me);
  if(rf.length) G.unshift({k:'vr',t:'Refusés par l’administrateur',ico:'urgent',go:'nx-valider',items:rf.map(x=>({t:x.t+' '+sgValLib(x),s:'motif : '+(x.v.motif||'—'),go:'nx-valider'}))});
  const at=L.filter(x=>x.v.etat==='a_valider'&&x.v.par===me&&!sgValideur(x.k));
  if(at.length) G.push({k:'vp',t:'En attente de validation',ico:'clock',go:'nx-valider',items:at.map(x=>({t:x.t+' '+sgValLib(x),s:'envoyé le '+dfr(String(x.v.le||'').slice(0,10)),go:'nx-valider'}))}); }
async function sgDecider(k,id,decision,motif){ const r=await fetch('/api/valider',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({k,id,decision,motif})}); let d={}; try{ d=await r.json(); }catch(_){}
  if(!r.ok||!d.ok){ toast('✗ '+(d.msg||d.error||('erreur '+r.status)),true); return false; }
  await sgKvTic(); toast(decision==='valide'?'Validé.':'Refusé : la personne qui l’a préparé le verra à l’accueil.'); return true; }
VIEWS['nx-valider']={ render(m){ const L=sgEnAttente().sort((a,b)=>cmp(a.v.etat,b.v.etat)||cmp(b.v.le,a.v.le)), bureau=typeof dsEstBureau==='function'&&dsEstBureau();
    const pg=nxPage(m,'<div class="sg-split">'+sgIntro('Facturation','À valider','Les contrats d’honoraires et les factures préparés ou modifiés par un chef de projet restent « à valider » : le PDF définitif n’est disponible qu’une fois validés. Un refus revient à son auteur avec le motif.'
        ,'<div class="sg-figs"><div class="sg-fig"><div class="n">'+L.filter(x=>x.v.etat==='a_valider').length+'</div><div class="t">à valider</div></div><div class="sg-fig"><div class="n">'+L.filter(x=>x.v.etat==='refuse').length+'</div><div class="t">refusé(s)</div></div></div>')
      +'<div>'+(!bureau?'<div class="nx-card c12"><div class="nx-empty">La validation s’applique sur le serveur du bureau (NAS), quand des chefs de projet préparent des contrats ou des factures. Sur ce poste, vous êtes seul : rien à valider.</div></div>':
        nxCard('c12','Contrats et factures',L.length?'<div class="b flush" style="overflow:auto"><table class="nx-tbl"><tr><th>Type</th><th>Référence</th><th>Préparé par</th><th>Le</th><th>État</th><th></th></tr>'
          +L.map((x,i)=>'<tr><td>'+x.t+(x.v.nouveau?' <span class="nx-tag s3">nouveau</span>':'')+'</td><td><b>'+nxE(sgValLib(x))+'</b>'+(x.k==='sa_factures5'&&x.o.cl_nom?'<br><span style="color:var(--s-gris)">'+nxE(x.o.cl_nom)+'</span>':'')+'</td><td>'+nxE(x.v.par||'')+'</td><td>'+dfr(String(x.v.le||'').slice(0,10))+'</td>'
            +'<td>'+(x.v.etat==='refuse'?'<span class="nx-tag urg">Refusé</span><br><span style="font-size:12px">'+nxE(x.v.motif||'')+'</span>':'<span class="nx-tag s3">À valider</span>')+'</td>'
            +'<td class="r" style="white-space:nowrap"><button class="nx-btn" data-fn="o'+i+'">Ouvrir</button>'+(sgValideur(x.k)&&x.v.etat==='a_valider'?' <button class="nx-btn pri" data-fn="v'+i+'">'+nxSvg('check')+'Valider</button> <button class="nx-btn danger" data-fn="r'+i+'">Refuser</button>':'')+'</td></tr>').join('')+'</table></div>'
          :'<div class="nx-empty">Rien à valider.</div>'))+'</div></div>');
    L.forEach((x,i)=>{ pg._fn['o'+i]=()=>go(x.k==='sa_contrats'?'fx-calchono':'fx-saisie',(x.k==='sa_contrats'?'c:':'f:')+x.o.id);
      pg._fn['v'+i]=async()=>{ if(await sgDecider(x.k,x.o.id,'valide')) go('nx-valider'); };
      pg._fn['r'+i]=()=>{ const T=h('textarea',{class:'inp',rows:4,style:{width:'420px'},placeholder:'Ce qui doit être corrigé'});
        dialog({title:'Refuser — '+x.t+' '+sgValLib(x),body:h('div',{},h('p',{style:{margin:'0 0 8px',fontWeight:300}},'Motif (transmis à '+(x.v.par||'son auteur')+') :'),T),buttons:[{t:'Annuler'},{t:'Refuser',pri:true,fn:async()=>{ if(!T.value.trim()){ toast('Indiquez le motif.',true); return false; } if(await sgDecider(x.k,x.o.id,'refuse',T.value.trim())) go('nx-valider'); }}]}); }; }); } };
/* dans le cadre Facturation : pas de PDF définitif tant que l'élément n'est pas validé (niveau « validation ») ; repères dans les listes */
function sgEmissionOk(k,id){ const droit=k==='sa_contrats'?'contrats':'factures'; if(sgAdmin()||sgDroit(droit,'edition')) return true;
  const o=sgListeKV(k).find(x=>String(x.id)===String(id)), v=o&&o._validation, quoi=k==='sa_contrats'?'Ce contrat':'Cette facture';
  if(!o){ sgAlert(quoi+' n’est pas encore enregistré(e) : enregistrez-le, il sera transmis à l’administrateur pour validation ; le PDF définitif sera disponible une fois validé.'); return false; }
  if(v&&v.etat!=='valide'){ sgAlert(v.etat==='refuse'?quoi+' a été refusé(e) par l’administrateur.\n\nMotif : '+(v.motif||'—')+'\n\nCorrigez puis enregistrez : il repassera à la validation.':quoi+' attend la validation de l’administrateur : le PDF définitif sera disponible une fois validé.'); return false; }
  return true; }
function sgFxValidation(w){ if(!w||w.__sgVal) return; w.__sgVal=1; const ev=x=>{ try{ return w.eval(x); }catch(_){ return null; } };
  const g=w.generateInvoicePDF; if(typeof g==='function') w.generateInvoicePDF=function(rb){ if(!rb&&!sgEmissionOk('sa_factures5',ev('curFid'))) return Promise.resolve(null); return g.apply(this,arguments); };
  const pr=w.printInvoiceFaithful; if(typeof pr==='function') w.printInvoiceFaithful=function(){ if(!sgEmissionOk('sa_factures5',ev('curFid'))) return; return pr.apply(this,arguments); };
  const o=w.generateOffrePDF; if(typeof o==='function') w.generateOffrePDF=function(){ const t=w.document.getElementById('ch_target'); if(!sgEmissionOk('sa_contrats',(t&&t.value)||ev('curCid'))) return; return o.apply(this,arguments); };
  const fl=w.chSetContratFlag; if(typeof fl==='function') w.chSetContratFlag=function(id,f,v){ if((f==='envoye'||f==='signe')&&v&&!sgEmissionOk('sa_contrats',id)) return; return fl.apply(this,arguments); };   // envoi / signature : contrat validé
  const SEL={openContratPdf:'c',editContratCalc:'c',chSetContratFlag:'c',archiveContrat:'c',openFacturePdf:'f',editFactureSaisie:'f'};
  let tm=null; const marquer=()=>{ tm=null; const etat={}; [['sa_contrats','c'],['sa_factures5','f']].forEach(([k,f])=>{ sgListeKV(k).forEach(x=>{ if(x&&x._validation&&x._validation.etat!=='valide') etat[f+':'+x.id]=x._validation.etat; }); });
    const vus=new Set(); w.document.querySelectorAll(Object.keys(SEL).map(f=>'[onclick^="'+f+'("]').join(',')).forEach(b=>{ const m=/^(\w+)\('([^']+)'/.exec(b.getAttribute('onclick')||''); if(!m||!SEL[m[1]]) return;
      const tr=b.closest('tr'); if(!tr||vus.has(tr)) return; vus.add(tr); const td=tr.querySelector('td'); let tag=td&&td.querySelector('.sg-val-tag'); const e=etat[SEL[m[1]]+':'+m[2]];
      if(!e){ if(tag) tag.remove(); return; } if(!tag&&td){ tag=w.document.createElement('span'); tag.className='sg-val-tag'; td.append(tag); }
      if(tag){ tag.textContent=e==='refuse'?'Refusé':'À valider'; tag.classList.toggle('refuse',e==='refuse'); } }); };
  new w.MutationObserver(()=>{ if(!tm) tm=setTimeout(marquer,250); }).observe(w.document.body,{childList:true,subtree:true}); marquer(); }
{ const f0=fxEnsure; fxEnsure=function(){ const p=f0.apply(this,arguments); Promise.resolve(p).then(w=>{ try{ sgFxValidation(w||FX.w); }catch(e){ console.error(e); } },()=>{}); return p; }; }

/* ── Situation des heures (Temps) : par projet, collaborateur, phase, mois ou activité ; tableau croisé ; CSV, impression ── */
function sgGrouper(L,g){ const m=new Map();
  L.forEach(r=>{ let k,t; if(g==='collab'){ const s=DS.get('staff',r.STAFF_ID); k='s'+r.STAFF_ID; t=s?staffName(s):'(inconnu)'; }
    else if(g==='phase'){ const f=DS.get('projectphase',r.PHASE_ID), sp=DS.get('projectsubphase',r.SUBPHASE_ID); k='f'+(r.PHASE_ID||'')+'-'+(r.SUBPHASE_ID||''); t=f?((f.NUMBER!=null?f.NUMBER+' · ':'')+nm(f)+(sp?' › '+nm(sp):'')):'(sans phase)'; }
    else if(g==='mois'){ const d=tlDate(r); k=d.getFullYear()*100+d.getMonth(); t=nxCap(MOISL[d.getMonth()])+' '+d.getFullYear(); }
    else if(g==='activite'){ const a=DS.get('projectactivity',r.ACTIVITY_ID)||DS.get('activity',r.ACTIVITY_ID); k='a'+(r.ACTIVITY_ID||''); t=a?nm(a):'(sans activité)'; }
    else { const p=DS.get('project',r.PROJECT_ID); k='p'+r.PROJECT_ID; t=p?projLabel(p):'(projet non visible)'; }
    const x=m.get(k)||{k,t,h:0,hf:0,n:0,st:new Set()}; x.h+=+r.TIMEPERIOD||0; if(+r.ISCHARGEABLE) x.hf+=+r.TIMEPERIOD||0; x.n++; x.st.add(String(r.STAFF_ID)); m.set(k,x); });
  return [...m.values()].sort((a,b)=>g==='mois'?b.k-a.k:b.h-a.h); }
const SG_GROUPES=[['projet','Par projet'],['collab','Par collaborateur'],['phase','Par phase'],['mois','Par mois'],['activite','Par activité'],['croise','Collaborateur × phase']];
/* o (onglet Heures du projet, 20.10.2026) : o.fact === false → sans la colonne « dont facturables » ; o.hier → « Par phase » en arbre :
   phases dans l'ordre SIA 102 (numéro de la phase, sinon groupe SIA), phases partielles sur les lignes en dessous (numéro 31, 32…),
   « (sans phase partielle) » et « (sans phase) » à la fin. Situation des heures (Temps) appelle sans o : inchangée. */
/* clé de tri SIA 102 d'une phase ou phase partielle : numéro (sinon groupe SIA de la phase), sur 9 chiffres ; sans numéro → en dernier */
const sgSiaCle=(x,sia)=>{ if(!x) return ''; const n=parseFloat(x.NUMBER), o=isFinite(n)?n:((sia&&sgSiaGroupe(x))||Infinity); return isFinite(o)?String(Math.round(o*100)).padStart(9,'0'):'999999999'; };
function sgPhasesHier(L){ const P=new Map(), nb=(x,sia)=>{ const n=parseFloat(x&&x.NUMBER); return isFinite(n)?n:(sia&&sgSiaGroupe(x))||Infinity; };
  const neu=(k,t,ord)=>({k,t,ord,h:0,hf:0,n:0,st:new Set(),subs:new Map()}), add=(o,r)=>{ o.h+=+r.TIMEPERIOD||0; if(+r.ISCHARGEABLE) o.hf+=+r.TIMEPERIOD||0; o.n++; o.st.add(String(r.STAFF_ID)); };
  L.forEach(r=>{ const f=r.PHASE_ID!=null?DS.get('projectphase',r.PHASE_ID):null, kf=f?'f'+f.ID:'f-';
    let x=P.get(kf); if(!x){ x=neu(kf,f?(f.NUMBER!=null?f.NUMBER+' · ':'')+nm(f):'(sans phase)',f?nb(f,1):Infinity); x.sans=!f; P.set(kf,x); }
    add(x,r); if(!f) return;
    const sp=r.SUBPHASE_ID!=null?DS.get('projectsubphase',r.SUBPHASE_ID):null, ks=sp?'s'+sp.ID:'s-';
    let y=x.subs.get(ks); if(!y){ y=neu(ks,sp?nm(sp):'(sans phase partielle)',sp?nb(sp):Infinity); x.subs.set(ks,y); } add(y,r); });
  const tri=(a,b)=>(a.sans?1:0)-(b.sans?1:0)||a.ord-b.ord||cmp(a.t,b.t);
  return [...P.values()].sort(tri).map(x=>Object.assign(x,{subs:[...x.subs.values()].sort(tri)})); }
function sgSituationHtml(L,g,o){ o=o||{}; const tot=L.reduce((s,r)=>s+(+r.TIMEPERIOD||0),0), fact=o.fact!==false;
  const pct=x=>(tot?Math.round(x.h/tot*100):0)+' %';
  if(g==='phase'&&o.hier){ const G=sgPhasesHier(L), pad=v=>isFinite(v)?String(Math.round(v*100)).padStart(9,'0'):'999999999', cle=x=>x.sans||x.k==='s-'?'':pad(x.ord)+' '+x.t,
    lig=(x,sub)=>'<tr'+(sub?' class="sub"':'')+'><td data-tri="'+nxE(cle(x))+'">'+(sub?nxE(x.t):'<b>'+nxE(x.t)+'</b>')+'</td><td class="r">'+nxH(x.h)+'</td>'+(fact?'<td class="r">'+nxH(x.hf)+'</td>':'')
      +'<td style="width:120px">'+sgBarre(tot?x.h/tot:0,sub?'var(--s-nuit2)':null)+' '+pct(x)+'</td><td class="r">'+x.st.size+'</td><td class="r">'+x.n+'</td></tr>';
    return '<table class="nx-tbl sg-sit sg-sit-h"><tr><th>Phase</th><th class="r">Heures</th>'+(fact?'<th class="r">dont facturables</th>':'')+'<th>Part</th><th class="r">Collaborateurs</th><th class="r">Saisies</th></tr>'
      +G.map(x=>lig(x)+(x.subs.length&&!(x.subs.length===1&&(x.subs[0].k==='s-'||x.t.replace(/^[^·]*·\s*/,'')===x.subs[0].t))?x.subs.map(y=>lig(y,1)).join(''):'')).join('')   /* une seule phase partielle, sans nom ou du même nom que la phase : pas de ligne en double */
      +'<tr class="tot"><td>Total</td><td class="r">'+nxH(tot)+'</td>'+(fact?'<td class="r">'+nxH(L.reduce((s,r)=>s+(+r.ISCHARGEABLE?+r.TIMEPERIOD||0:0),0))+'</td>':'')+'<td></td><td class="r">'+new Set(L.map(r=>String(r.STAFF_ID))).size+'</td><td class="r">'+L.length+'</td></tr></table>'; }
  /* Collaborateur × phase en arbre (onglet Heures, 20.10.2026) : chaque collaborateur (trame), du plus d'heures au moins d'heures, puis ses phases en
     lignes dessous (fond blanc) dans l'ordre SIA 102 (sgSiaCle), « (sans phase) » à la fin ; Part = part des heures de la période. Situation des
     heures (sans o.hier) garde le tableau croisé (phases en colonnes). */
  if(g==='croise'&&o.hier){ const S=new Map();
    L.forEach(r=>{ const v=+r.TIMEPERIOD||0, ks=String(r.STAFF_ID); let x=S.get(ks); if(!x){ const st=DS.get('staff',r.STAFF_ID); x={k:ks,t:st?staffName(st):'(inconnu)',h:0,n:0,P:new Map()}; S.set(ks,x); }
      x.h+=v; x.n++; const f=r.PHASE_ID!=null?DS.get('projectphase',r.PHASE_ID):null, kf=f?String(f.ID):''; let y=x.P.get(kf);
      if(!y){ y={t:f?(f.NUMBER!=null?f.NUMBER+' · ':'')+nm(f):'(sans phase)',cle:f?sgSiaCle(f,1)+' '+nm(f):'',sans:!f,h:0,n:0}; x.P.set(kf,y); } y.h+=v; y.n++; });
    const lig=(x,sub)=>'<tr'+(sub?' class="sub"':' data-colgo="'+nxE(x.k)+'" title="'+nxE('Voir le détail des saisies de '+x.t)+'"')+'><td>'+(sub?nxE(x.t):'<b>'+nxE(x.t)+'</b>')+'</td><td class="r">'+nxH(x.h)+'</td><td style="width:120px">'+sgBarre(tot?x.h/tot:0,sub?'var(--s-nuit2)':null)+' '+pct(x)+'</td><td class="r">'+x.n+'</td></tr>';   /* clic sur un collaborateur : Détail filtré (20.10.2026) */
    return '<table class="nx-tbl sg-sit sg-sit-h"><tr><th>Collaborateur · phase</th><th class="r">Heures</th><th>Part</th><th class="r">Saisies</th></tr>'
      +[...S.values()].sort((a,b)=>b.h-a.h||cmp(a.t,b.t)).map(x=>lig(x)+[...x.P.values()].sort((a,b)=>(a.sans?1:0)-(b.sans?1:0)||a.cle.localeCompare(b.cle,'fr',{numeric:true})).map(y=>lig(y,1)).join('')).join('')
      +'<tr class="tot"><td>Total</td><td class="r">'+nxH(tot)+'</td><td></td><td class="r">'+L.length+'</td></tr></table>'; }
  if(g==='croise'){ const cs=sgGrouper(L,'collab'), fs=sgGrouper(L,'phase'), cell={}; L.forEach(r=>{ const a='s'+r.STAFF_ID, b='f'+(r.PHASE_ID||'')+'-'+(r.SUBPHASE_ID||''); cell[a+'|'+b]=(cell[a+'|'+b]||0)+(+r.TIMEPERIOD||0); });
    return '<table class="nx-tbl sg-sit"><tr><th>Collaborateur</th>'+fs.map(f=>'<th class="r" title="'+nxE(f.t)+'">'+nxE(f.t.length>22?f.t.slice(0,21)+'…':f.t)+'</th>').join('')+'<th class="r">Total</th></tr>'
      +cs.map(c=>'<tr><td><b>'+nxE(c.t)+'</b></td>'+fs.map(f=>'<td class="r">'+(cell[c.k+'|'+f.k]?nxH(cell[c.k+'|'+f.k]):'')+'</td>').join('')+'<td class="r"><b>'+nxH(c.h)+'</b></td></tr>').join('')
      +'<tr class="tot"><td>Total</td>'+fs.map(f=>'<td class="r">'+nxH(f.h)+'</td>').join('')+'<td class="r">'+nxH(tot)+'</td></tr></table>'; }
  const cs=!(o.hier&&g==='collab');   /* onglet Heures ▸ Collaborateur : sans les colonnes Collaborateurs et Saisies (20.10.2026) */
  const G=sgGrouper(L,g); return '<table class="nx-tbl sg-sit"><tr><th>'+({projet:'Projet',collab:'Collaborateur',phase:'Phase',mois:'Mois',activite:'Activité'}[g])+'</th><th class="r">Heures</th>'+(fact?'<th class="r">dont facturables</th>':'')+'<th>Part</th>'+(cs?'<th class="r">Collaborateurs</th><th class="r">Saisies</th>':'')+'</tr>'
    +G.map(x=>'<tr'+(o.hier&&g==='collab'?' data-colgo="'+nxE(String(x.k).replace(/^s/,''))+'" title="'+nxE('Voir le détail des saisies de '+x.t)+'"':'')+'><td><b>'+nxE(x.t)+'</b></td><td class="r">'+nxH(x.h)+'</td>'+(fact?'<td class="r">'+nxH(x.hf)+'</td>':'')+'<td style="width:120px">'+sgBarre(tot?x.h/tot:0)+' '+pct(x)+'</td>'+(cs?'<td class="r">'+x.st.size+'</td><td class="r">'+x.n+'</td>':'')+'</tr>').join('')
    +'<tr class="tot"><td>Total</td><td class="r">'+nxH(tot)+'</td>'+(fact?'<td class="r">'+nxH(L.reduce((s,r)=>s+(+r.ISCHARGEABLE?+r.TIMEPERIOD||0:0),0))+'</td>':'')+'<td></td>'+(cs?'<td class="r">'+new Set(L.map(r=>String(r.STAFF_ID))).size+'</td><td class="r">'+L.length+'</td>':'')+'</tr></table>'; }
function sgCsvTable(tbl,nom){ const q=v=>'"'+String(v).replace(/"/g,'""')+'"', rows=[...tbl.querySelectorAll('tr')].map(tr=>[...tr.children].map(c=>q(c.textContent.trim())).join(';'));
  const a=h('a',{href:URL.createObjectURL(new Blob(['﻿'+rows.join('\r\n')],{type:'text/csv;charset=utf-8'})),download:nom}); document.body.append(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },2000); }
function sgImprimer(titre,html){ const f=h('iframe',{style:{position:'fixed',right:0,bottom:0,width:0,height:0,border:0}}); document.body.append(f);
  const d=f.contentDocument; d.open(); d.write('<!doctype html><html><head><meta charset="utf-8"><title>'+nxE(titre)+'</title><style>body{font-family:"SUB Akkurat",Akkurat,Helvetica,Arial,sans-serif;font-size:10pt;margin:14mm}h1{font-size:14pt;margin:0 0 4mm}p{margin:0 0 5mm;color:#706f6f}table{border-collapse:collapse;width:100%}th,td{border-bottom:.25pt solid #999;padding:3px 5px;text-align:left}th{border-bottom:1pt solid #000}.r{text-align:right}tr.tot td{font-weight:700;border-top:1pt solid #000}</style></head><body><h1>'+nxE(titre)+'</h1>'+html+'</body></html>'); d.close();
  setTimeout(()=>{ try{ f.contentWindow.print(); }catch(_){} setTimeout(()=>f.remove(),60000); },300); }
VIEWS['nx-situation']={ render(m){ const st=nxLS.get('sg3_sit',{p:'',per:'12',g:'collab',de:'',a:''}), now=new Date();
    const logs=DS.all('timelog'), pids=[...new Set(logs.map(r=>String(r.PROJECT_ID)))].map(id=>DS.get('project',id)).filter(Boolean).sort((a,b)=>cmp(a.NUMBER,b.NUMBER));
    const lim={'1':new Date(now.getFullYear(),now.getMonth(),1),'3':new Date(now.getFullYear(),now.getMonth()-2,1),'12':new Date(now.getFullYear(),now.getMonth()-11,1),'an':new Date(now.getFullYear(),0,1),'tout':null}[st.per];
    let L=logs.filter(r=>!st.p||String(r.PROJECT_ID)===String(st.p));
    if(st.per==='perso'){ const a=st.de?dayKey(new Date(st.de+'T00:00')):0, b=st.a?dayKey(new Date(st.a+'T00:00')):Infinity; L=L.filter(r=>{ const k=tlKey(r); return k>=a&&k<=b; }); }
    else if(lim) L=L.filter(r=>tlKey(r)>=dayKey(lim));
    const pr=st.p&&DS.get('project',st.p), perLib={'1':'mois en cours','3':'3 derniers mois','12':'12 derniers mois','an':'année '+now.getFullYear(),'tout':'tout','perso':'du '+(st.de?dfr(st.de):'…')+' au '+(st.a?dfr(st.a):'…')}[st.per];
    const portee=sgDroit('heures','toutes')?'toutes les heures du bureau':sgDroit('heures','projets')?'les heures de vos projets, tous collaborateurs':'vos heures';
    const pg=nxPage(m,'<div class="sg-split">'+sgIntro('Temps','Situation des heures','Heures saisies par projet, par collaborateur, par phase, par mois ou par activité — '+portee+'. Export CSV et impression.',
        '<div class="sg-figs"><div class="sg-fig"><div class="n">'+nxH(L.reduce((s,r)=>s+(+r.TIMEPERIOD||0),0))+'</div><div class="t">heures</div></div><div class="sg-fig"><div class="n">'+L.length+'</div><div class="t">saisies</div></div></div>')
      +'<div><div class="nx-card c12"><div class="b sg-sit-f"><label>Projet <select class="inp" id="sit-p"><option value="">Tous '+(sgDroit('projets_voir','tous')?'les projets':'mes projets')+'</option>'+pids.map(p=>'<option value="'+p.ID+'"'+(String(p.ID)===String(st.p)?' selected':'')+'>'+nxE(projLabel(p))+'</option>').join('')+'</select></label>'
        +'<label>Période <select class="inp" id="sit-per">'+[['1','Mois en cours'],['3','3 derniers mois'],['12','12 derniers mois'],['an','Année en cours'],['tout','Tout'],['perso','Dates…']].map(([v,t])=>'<option value="'+v+'"'+(v===st.per?' selected':'')+'>'+t+'</option>').join('')+'</select></label>'
        +(st.per==='perso'?'<label>Du <input class="inp" type="date" id="sit-de" value="'+nxE(st.de)+'"></label><label>au <input class="inp" type="date" id="sit-a" value="'+nxE(st.a)+'"></label>':'')
        +'<div class="seg">'+SG_GROUPES.filter(([g])=>g!=='croise'||st.p).map(([g,t])=>'<button data-g="'+g+'" class="'+(g===st.g?'on':'')+'">'+t+'</button>').join('')+'</div>'
        +'<span style="flex:1"></span><button class="nx-btn" data-fn="csv">'+nxSvg('export')+'CSV</button><button class="nx-btn" data-fn="prn">'+nxSvg('print')+'Imprimer</button></div></div>'
      +nxCard('c12',(pr?projLabel(pr):'Tous les projets visibles')+' — '+perLib,'<div class="b flush" style="overflow:auto" id="sit-t">'+(L.length?sgSituationHtml(L,st.g==='croise'&&!st.p?'collab':st.g):'<div class="nx-empty">Aucune heure sur cette période.</div>')+'</div>')+'</div></div>');
    const sv=o=>{ nxLS.set('sg3_sit',Object.assign(st,o)); go('nx-situation'); };
    m.querySelector('#sit-p').onchange=e=>sv({p:e.target.value,g:(!e.target.value&&st.g==='croise')?'collab':st.g}); m.querySelector('#sit-per').onchange=e=>sv({per:e.target.value});
    const de=m.querySelector('#sit-de'), a=m.querySelector('#sit-a'); if(de) de.onchange=()=>sv({de:de.value}); if(a) a.onchange=()=>sv({a:a.value});
    m.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>sv({g:b.dataset.g}));
    const titre='Situation des heures — '+(pr?projLabel(pr):'tous les projets')+' — '+(SG_GROUPES.find(x=>x[0]===st.g)||['',''])[1].toLowerCase()+' — '+perLib;
    pg._fn.csv=()=>{ const t=m.querySelector('#sit-t table'); if(t) sgCsvTable(t,'situation_heures_'+(pr?pr.NUMBER:'projets')+'_'+diso(now)+'.csv'); };
    pg._fn.prn=()=>{ const t=m.querySelector('#sit-t table'); if(t) sgImprimer(titre,'<p>'+nxE((ME.u?'Établi par '+(ME.u.USERID||'')+' — ':'')+dfr(diso(now)))+'</p>'+t.outerHTML); }; } };

/* ── Fenêtres du moteur dans le menu de gauche (23.10.2026, demandes de Paulo) : Équipe ▸ Gestion des utilisateurs (ch08bUserAdmin, droit
   « gestion des utilisateurs »), Réglages ▸ Paramètres système (ch08aSysPrefs, droit « administrateur ») et Réglages ▸ Préférences
   (ch08cPreferences, tous). Chaque écran dit à quoi sert la fenêtre et l'ouvre — d'office quand on vient du menu, pas à la reprise de
   session au démarrage (sgFenPret) ── */
let sgFenPret=false; setTimeout(()=>{ sgFenPret=true; },4000);
function sgVueFenetre(o){ const ok=()=>!o.droit||ch08aCan(o.droit);
  const dessin=m=>{ if(!ok()){ nxPage(m,'<div class="nx-empty">Droit « '+nxE(o.droitLib)+' » requis.</div>'); return; }
    const pg=nxPage(m,'<div class="sg-split">'+sgIntro(o.lbl,o.t,o.txt,o.figs?o.figs():'')+'<div>'
      +nxCard('c12',o.t,'<div class="b">'+o.aide+'<p style="margin:14px 0 0"><button class="nx-btn pri" data-fen="1">'+nxSvg(o.ico)+nxE(o.bouton)+'</button></p></div>')+(o.corps?o.corps():'')+'</div></div>');
    pg.querySelector('[data-fen]').onclick=()=>o.ouvrir(); };
  return {render(m){ this._m=m; dessin(m); if(sgFenPret&&ok()) setTimeout(()=>o.ouvrir(),0); },
    refresh(ts){ if(o.tables&&this._m&&hit(ts,...o.tables)) dessin(this._m); }}; }
const sgComptes=()=>DS.all('appuser').filter(u=>u.USERID!=='mayday').sort((a,b)=>cmp(a.NAME||a.USERID||'',b.NAME||b.USERID||''));
VIEWS['nx-utilisateurs']=sgVueFenetre({droit:'userAdmin',droitLib:'gestion des utilisateurs',lbl:'Équipe',t:'Gestion des utilisateurs',ico:'users',bouton:'Gérer les comptes…',
  tables:['appuser','appuser_staff','sgacces'],
  txt:'Comptes de l’app : identifiant, mot de passe, fonctions et droits. Le profil SUBGestion de chaque compte (administrateur, chef de projet, collaborateur) se règle dans Réglages ▸ Profils et accès.',
  aide:'Créer ou modifier un compte, l’activer ou le désactiver, changer son mot de passe, lui attribuer des fonctions : dans la fenêtre de gestion des utilisateurs.',
  figs:()=>{ const U=sgComptes(), n=U.filter(u=>+u.ISENABLED).length;
    return '<div class="sg-figs"><div class="sg-fig"><div class="n">'+n+'</div><div class="t">comptes activés</div></div><div class="sg-fig"><div class="n">'+(U.length-n)+'</div><div class="t">désactivés</div></div></div>'; },
  corps:()=>{ const st=u=>DS.by('appuser_staff','APPUSER_ID',u.ID).map(l=>DS.get('staff',l.STAFFS_ID)).filter(Boolean).map(staffName).join(', ');
    return nxCard('c12','Comptes','<div class="b flush"><table class="nx-tbl"><tr><th>Nom</th><th>Identifiant</th><th>Collaborateur</th><th>Profil</th><th>État</th></tr>'
      +sgComptes().map(u=>'<tr><td><b>'+nxE(u.NAME||'')+'</b></td><td>'+nxE(u.USERID||'')+'</td><td>'+nxE(st(u))+'</td><td>'+nxE(SG_PROFILS[sgProfilDe(u)]||'')+'</td><td>'
        +(+u.ISENABLED?'Activé':'<span style="color:var(--s-gris)">Désactivé</span>')+'</td></tr>').join('')+'</table></div>'); },
  ouvrir:()=>ch08bUserAdmin()});
VIEWS['nx-parametres']=sgVueFenetre({droit:'admin',droitLib:'administrateur',lbl:'Réglages',t:'Paramètres système',ico:'settings',bouton:'Ouvrir les paramètres système…',
  txt:'Réglages généraux de l’app, communs à tous les postes : pays, monnaie standard et taux de TVA, présentation des adresses (nom et prénom, téléphone), protection des documents.',
  aide:'Les paramètres système s’ouvrent dans une fenêtre.',ouvrir:()=>ch08aSysPrefs()});
VIEWS['nx-preferences']=sgVueFenetre({lbl:'Réglages',t:'Préférences',ico:'person',bouton:'Ouvrir les préférences…',
  txt:'Réglages personnels de l’utilisateur de ce poste : langue des documents et choix des modèles, initiales, signature (image).',
  aide:'Les préférences s’ouvrent dans une fenêtre.',ouvrir:()=>ch08cPreferences()});
SG_VUE_DROIT['nx-utilisateurs']=()=>ch08aCan('userAdmin'); SG_VUE_DROIT['nx-parametres']=()=>ch08aCan('admin');
/* ── Réglages ▸ Profils et accès (administrateur) ── */
const sgAccRec=id=>DS.get('sgacces',id);
const sgDroitsRole=p=>Object.assign({},SG_DEFAUTS[p],((sgAccRec('role:'+p)||{}).DROITS)||{});
function sgProfilDe(u){ const r=sgAccRec('user:'+u.ID); if(r&&SG_PROFILS[r.PROFIL]) return r.PROFIL;
  try{ return (CH08A_INTERNAL.includes(u.USERID)||ch08aCan('superadmin',u)||ch08aCan('userAdmin',u))?'admin':'collab'; }catch(_){ return 'collab'; } }
VIEWS['nx-profils']={ render(m){ const bureau=typeof dsEstBureau==='function'&&dsEstBureau(), auth=!!(DS.info&&DS.info.auth);
    const users=DS.all('appuser').filter(u=>u.USERID!=='mayday').sort((a,b)=>cmp(a.USERID,b.USERID)), D={cdp:sgDroitsRole('cdp'),collab:sgDroitsRole('collab')};
    const sel=(p,k)=>'<select class="inp" data-role="'+p+'" data-k="'+k+'">'+SG_DROITS[k].map(n=>'<option value="'+n+'"'+(D[p][k]===n?' selected':'')+'>'+nxE(SG_DROITS_LIB.find(x=>x[0]===k)[3][n])+'</option>').join('')+'</select>';
    const staffsDe=u=>DS.by('appuser_staff','APPUSER_ID',u.ID).map(l=>DS.get('staff',l.STAFFS_ID)).filter(Boolean);
    const pg=nxPage(m,'<div class="sg-split">'+sgIntro('Réglages','Profils et accès','Trois profils : <b>Administrateur</b> (tout), <b>Chef de projet</b> et <b>Collaborateur</b>, dont vous réglez ici chaque droit — pour limiter ou élargir l’accès aux informations. Puis le profil de chaque compte.',
        '<div class="sg-figs"><div class="sg-fig"><div class="n">'+users.filter(u=>sgProfilDe(u)==='cdp').length+'</div><div class="t">chefs de projet</div></div><div class="sg-fig"><div class="n">'+users.filter(u=>sgProfilDe(u)==='collab').length+'</div><div class="t">collaborateurs</div></div></div>')
      +'<div>'+(!bureau?'<div class="nx-card c12" style="margin-bottom:24px"><div class="b" style="font-weight:300">Sur ce poste (fichier ouvert par double-clic), vous êtes seul et administrateur : ces réglages s’appliqueront sur le <b>serveur du bureau (NAS)</b>, une fois la base importée.</div></div>'
        :!auth?'<div class="nx-card c12" style="margin-bottom:24px"><div class="b" style="color:var(--s-rouge)">L’ouverture de session par mot de passe n’est pas active sur le serveur du bureau : personne n’est identifié, les profils ne s’appliquent pas encore (Réglages ▸ Administration ▸ Utilisateurs).</div></div>':'')
      +nxCard('c12','Droits de chaque profil','<div class="b flush" style="overflow:auto"><table class="nx-tbl sg-droits"><tr><th>Droit</th><th>Administrateur</th><th>Chef de projet</th><th>Collaborateur</th></tr>'
        +SG_DROITS_LIB.map(([k,t,aide,niv])=>'<tr><td><b>'+nxE(t)+'</b>'+(aide?'<br><span>'+nxE(aide)+'</span>':'')+'</td><td class="adm">'+nxE(niv[SG_TOUT[k]])+'</td><td>'+sel('cdp',k)+'</td><td>'+sel('collab',k)+'</td></tr>').join('')
        +'</table></div>','<span class="a" data-fn="defaut">Rétablir les réglages proposés</span>')
      +nxCard('c12','Profil de chaque compte','<div class="b flush"><table class="nx-tbl"><tr><th>Compte</th><th>Collaborateur lié</th><th>Profil</th></tr>'
        +users.map(u=>{ const p=sgProfilDe(u), ss=staffsDe(u); return '<tr><td><b>'+nxE(u.USERID||'')+'</b>'+(u.NAME&&u.NAME!==u.USERID?' <span style="color:var(--s-gris)">'+nxE(u.NAME)+'</span>':'')+(+u.ISENABLED?'':' <span class="nx-tag">désactivé</span>')+'</td>'
          +'<td>'+(ss.length?nxE(ss.length>2?ss.length+' collaborateurs':ss.map(staffName).join(', ')):'<span style="color:var(--s-rouge)">aucun — à lier (Administration ▸ Utilisateurs)</span>')+'</td>'
          +'<td><select class="inp" data-user="'+u.ID+'"'+(CH08A_INTERNAL.includes(u.USERID)?' disabled title="Compte interne : administrateur"':'')+'>'+Object.entries(SG_PROFILS).map(([k,t])=>'<option value="'+k+'"'+(p===k?' selected':'')+'>'+t+'</option>').join('')+'</select></td></tr>'; }).join('')+'</table></div>')
      +'</div></div>');
    m.querySelectorAll('select[data-role]').forEach(s=>s.onchange=async()=>{ const p=s.dataset.role, d=sgDroitsRole(p); d[s.dataset.k]=s.value;
      await DS.save('sgacces',{ID:'role:'+p,DROITS:d}); toast('Droits « '+SG_PROFILS[p]+' » enregistrés : appliqués à la prochaine ouverture de l’app sur chaque poste.'); });
    m.querySelectorAll('select[data-user]').forEach(s=>s.onchange=async()=>{ const u=DS.get('appuser',s.dataset.user); if(!u) return;
      if(String(u.ID)===String((ME.u||{}).ID)&&s.value!=='admin'&&!(await confirmDlg('Vous retirer le profil Administrateur ? Vous n’aurez plus accès à ces réglages.','Retirer'))){ s.value='admin'; return; }
      await DS.save('sgacces',{ID:'user:'+u.ID,APPUSER_ID:u.ID,PROFIL:s.value}); toast(u.USERID+' : '+SG_PROFILS[s.value]+'.'); });
    pg._fn.defaut=()=>sgConfirm('Rétablir les réglages proposés pour les profils Chef de projet et Collaborateur ?',async()=>{ await DS.commit(['cdp','collab'].map(p=>({t:'sgacces',id:'role:'+p,val:{ID:'role:'+p,DROITS:{...SG_DEFAUTS[p]}}}))); go('nx-profils'); }); } };
/* profils actifs (NAS avec ouverture de session) : ils font foi pour les écrans, à la place des droits d'origine Deltaproject (fonctions) */
{ const v0=ch08bViewOk; ch08bViewOk=function(id,u){ if(SG_ACC.auth&&(u===undefined||u===ME.u)) return sgVueOk(String(id??'')); return v0.apply(this,arguments); }; }

/* ═══ 12. COÛT DE REVIENT DES COLLABORATEURS (07.10.2026) ═══════════════════════════════════════════════════════════
   Ressources humaines ▸ Coût de revient (administrateur : droits « équipe : taux » et « réglages ») — collection « sgcoutrevient » :
   « param » = critères du bureau (charges sociales %, frais généraux annuels par poste, temps de travail, marge) ;
   « staff:<ID> » = salaire, mois, occupation, vacances, absences, part facturable, frais directs.
   Coût annuel = salaire + charges + frais directs + part des frais généraux (au prorata des heures de présence) ;
   taux interne = coût annuel ÷ heures de présence (appliqué aux heures saisies : rentabilité) ; coût de revient par heure
   facturable = coût annuel ÷ heures facturables ; prix de vente conseillé = coût de revient × (1 + marge). « Appliquer »
   enregistre le taux interne (staffrate, valable dès aujourd'hui). Sur le NAS, ces données ne quittent pas le serveur sans ces droits. */
const SG_CR_CHARGES=[['avs','AVS / AI / APG (part employeur)',5.3],['ac','Assurance chômage (AC)',1.1],['lpp','Prévoyance professionnelle (LPP, part employeur)',7.0],
  ['laa','Assurance accidents (LAA)',0.6],['ijm','Perte de gain maladie (IJM)',0.7],['caf','Allocations familiales (CAF)',2.0],['adm','Frais d’administration des caisses',0.3]];
const SG_CR_FG=['Loyer et charges des locaux','Informatique, logiciels, licences','Assurances (RC professionnelle, choses)','Téléphone, internet, poste','Véhicules, déplacements',
  'Formation continue','Fiduciaire, honoraires externes','Fournitures, imprimés, divers','Salaires non productifs (secrétariat, administration)'];
function sgCrParam(){ const r=DS.get('sgcoutrevient','param')||{};
  return {CHARGES:Object.assign(Object.fromEntries(SG_CR_CHARGES.map(([k,,v])=>[k,v])),r.CHARGES||{}),FG:Array.isArray(r.FG)?r.FG:SG_CR_FG.map(l=>({l,m:0})),
    SEMAINES:r.SEMAINES??52,HSEM:r.HSEM??42.5,FERIES:r.FERIES??9,MARGE:r.MARGE??15}; }
/* vacances de la fiche Deltaproject (HOLIDAYS) : en heures par an (212.5 = 5 semaines) ; petite valeur = jours */
const sgCrVacances=s=>{ const v=+s.HOLIDAYS||0, hs=+sgCrParam().HSEM||42.5; return !v?5:Math.round((v>60?v/hs:v/5)*2)/2; };
function sgCrStaff(s){ const r=DS.get('sgcoutrevient','staff:'+s.ID)||{};
  return {SALAIRE:r.SALAIRE??0,MOIS:r.MOIS??13,OCC:r.OCC??100,VAC:r.VAC??sgCrVacances(s),ABS:r.ABS??5,PROD:r.PROD??75,DIRECTS:r.DIRECTS??0}; }
function sgCrCalcul(P,S){ const occ=(+S.OCC||0)/100, hj=(+P.HSEM||0)/5, tch=Object.values(P.CHARGES).reduce((a,b)=>a+(+b||0),0);
  const salaire=(+S.SALAIRE||0)*(+S.MOIS||0), charges=salaire*tch/100, contrat=(+P.SEMAINES||0)*(+P.HSEM||0)*occ;
  const absences=((+S.VAC||0)*(+P.HSEM||0)+((+P.FERIES||0)+(+S.ABS||0))*hj)*occ, presence=Math.max(0,contrat-absences), factu=presence*(+S.PROD||0)/100;
  return {salaire,charges,tch,contrat,absences,presence,factu,directs:+S.DIRECTS||0}; }
function sgCrTout(){ const P=sgCrParam(), fg=P.FG.reduce((a,x)=>a+(+x.m||0),0), L=staffList().map(s=>({s,S:sgCrStaff(s)})).map(x=>({...x,c:sgCrCalcul(P,x.S)}));
  const presTot=L.filter(x=>+x.S.SALAIRE>0).reduce((a,x)=>a+x.c.presence,0);
  L.forEach(x=>{ const c=x.c; c.fg=presTot&&+x.S.SALAIRE>0?fg*c.presence/presTot:0; c.annuel=c.salaire+c.charges+c.directs+c.fg;
    c.taux=c.presence?c.annuel/c.presence:0; c.revient=c.factu?c.annuel/c.factu:0; c.vente=c.revient*(1+(+P.MARGE||0)/100); });
  return {P,fg,L}; }
const sgTauxActuel=sid=>{ const a=DS.by('staffrate','STAFF_ID',sid).filter(r=>r.VALIDFROM&&r.VALIDFROM<=today()).sort((a,b)=>cmp(b.VALIDFROM,a.VALIDFROM)); return a[0]?+a[0].RATE:null; };
async function sgCrAppliquer(xs){ const td=today(), ops=[];
  for(const x of xs){ if(!(x.c.taux>0)) continue; const ex=DS.by('staffrate','STAFF_ID',x.s.ID).find(r=>r.VALIDFROM===td), id=ex?ex.ID:DS.newIds('staffrate')[0];
    ops.push({t:'staffrate',id,val:{ID:id,STAFF_ID:x.s.ID,VALIDFROM:td,RATE:Math.round(x.c.taux*100)/100}}); }
  if(!ops.length){ toast('Aucun taux à appliquer : saisissez d’abord les salaires.',true); return; }
  await DS.commit(ops); toast(ops.length+' taux interne(s) enregistré(s), valables dès aujourd’hui.'); go('nx-coutrevient'); }
VIEWS['nx-coutrevient']={ render(m){ const T=sgCrTout(), P=T.P, f2=v=>num(v,2), f0=v=>nxCHF(v);
    const nb=(k,v,st,w)=>'<input class="inp" type="number" step="'+(st||'0.1')+'" data-'+k+' value="'+(v??'')+'" style="width:'+(w||'84px')+';text-align:right">';
    const lignes=T.L.map((x,i)=>{ const S=x.S, c=x.c, act=sgTauxActuel(x.s.ID);
      return '<tr data-i="'+i+'"><td><b class="sg-cr-nom" data-fn="d'+i+'" style="cursor:pointer">'+nxE(staffName(x.s))+'</b></td>'
        +['SALAIRE','MOIS','OCC','VAC','ABS','PROD','DIRECTS'].map(k=>'<td>'+nb('s="'+x.s.ID+'" data-k="'+k+'"',S[k],k==='SALAIRE'||k==='DIRECTS'?'50':k==='MOIS'?'1':'0.5',k==='SALAIRE'||k==='DIRECTS'?'96px':'64px')+'</td>').join('')
        +'<td class="r">'+f0(c.annuel)+'</td><td class="r">'+nxH(c.presence)+'</td><td class="r">'+nxH(c.factu)+'</td><td class="r"><b>'+f2(c.taux)+'</b></td><td class="r">'+f2(c.revient)+'</td><td class="r">'+f2(c.vente)+'</td>'
        +'<td class="r">'+(act!=null?f2(act):'—')+'</td><td><button class="nx-btn" data-fn="a'+i+'"'+(c.taux>0?'':' disabled')+'>Appliquer</button></td></tr>'; }).join('');
    const pg=nxPage(m,'<div class="sg-split">'+sgIntro('Ressources humaines','Coût de revient','Coût horaire de chaque collaborateur à partir de son salaire, des charges sociales, de sa part des frais généraux du bureau et de ses heures productives. Le taux interne obtenu sert au coût de revient (rentabilité des projets).',
        '<div class="sg-figs"><div class="sg-fig"><div class="n">'+f0(T.fg)+'</div><div class="t">frais généraux / an</div></div><div class="sg-fig"><div class="n">'+num(Object.values(P.CHARGES).reduce((a,b)=>a+(+b||0),0),1)+' %</div><div class="t">charges sociales</div></div></div>'
        +'<div class="acts"><button class="nx-btn pri" data-fn="tous">'+nxSvg('check')+'Appliquer tous les taux</button></div>')
      +'<div><div class="nx-grid">'
      +nxCard('c6','Charges sociales (part employeur)','<div class="b"><table class="nx-tbl">'+SG_CR_CHARGES.map(([k,t])=>'<tr><td>'+nxE(t)+'</td><td class="r">'+nb('ch="'+k+'"',P.CHARGES[k],'0.05','74px')+' %</td></tr>').join('')+'</table></div>')
      +nxCard('c6','Frais généraux du bureau (par an)','<div class="b"><table class="nx-tbl">'+P.FG.map((x,i)=>'<tr><td><input class="inp" data-fgl="'+i+'" value="'+nxE(x.l)+'" style="width:100%"></td><td class="r">'+nb('fg="'+i+'"',x.m,'100','110px')+' CHF</td></tr>').join('')
        +'<tr><td><button class="nx-btn" data-fn="fgplus">'+nxSvg('plus')+'Ajouter un poste</button></td><td class="r"><b>'+f0(T.fg)+' CHF</b></td></tr></table></div>')
      +nxCard('c12','Temps de travail et marge','<div class="b sg-sit-f"><label>Semaines par an '+nb('p="SEMAINES"',P.SEMAINES,'1')+'</label><label>Heures par semaine '+nb('p="HSEM"',P.HSEM,'0.25')+'</label><label>Jours fériés par an '+nb('p="FERIES"',P.FERIES,'0.5')+'</label><label>Marge sur le prix de vente '+nb('p="MARGE"',P.MARGE,'1')+' %</label></div>')
      +nxCard('c12','Collaborateurs actuels','<div class="b flush" style="overflow:auto"><table class="nx-tbl sg-cr"><tr><th>Collaborateur</th><th>Salaire mensuel brut</th><th>Mois</th><th>Occupation %</th><th>Vacances (sem.)</th><th>Autres absences (j)</th><th>Part facturable %</th><th>Frais directs / an</th>'
        +'<th class="r">Coût annuel</th><th class="r">Heures de présence</th><th class="r">Heures facturables</th><th class="r">Taux interne / h</th><th class="r">Coût de revient / h fact.</th><th class="r">Prix de vente conseillé</th><th class="r">Taux actuel</th><th></th></tr>'+lignes+'</table></div>'
        +'<div class="b" style="font-size:12px;color:var(--s-gris);font-weight:300">Taux interne = coût annuel ÷ heures de présence (appliqué à toutes les heures saisies). Coût de revient = coût annuel ÷ heures facturables (base du prix de vente). Frais généraux répartis au prorata des heures de présence des collaborateurs dont le salaire est saisi. Cliquer sur un nom : détail du calcul.</div>')
      +'</div></div></div>');
    const sauverP=async o=>{ const r=Object.assign({ID:'param'},DS.get('sgcoutrevient','param')||{},o); await DS.save('sgcoutrevient',r); go('nx-coutrevient'); };
    m.querySelectorAll('[data-ch]').forEach(e=>e.onchange=()=>sauverP({CHARGES:Object.assign({},P.CHARGES,{[e.dataset.ch]:+e.value||0})}));
    m.querySelectorAll('[data-fg]').forEach(e=>e.onchange=()=>{ const FG=P.FG.map(x=>({...x})); FG[+e.dataset.fg].m=+e.value||0; sauverP({FG}); });
    m.querySelectorAll('[data-fgl]').forEach(e=>e.onchange=()=>{ const FG=P.FG.map(x=>({...x})); FG[+e.dataset.fgl].l=e.value.trim(); sauverP({FG}); });
    m.querySelectorAll('[data-p]').forEach(e=>e.onchange=()=>sauverP({[e.dataset.p]:+e.value||0}));
    m.querySelectorAll('[data-s]').forEach(e=>e.onchange=async()=>{ const sid=e.dataset.s, r=Object.assign({ID:'staff:'+sid,STAFF_ID:+sid},DS.get('sgcoutrevient','staff:'+sid)||sgCrStaff(DS.get('staff',sid)));
      r[e.dataset.k]=+e.value||0; await DS.save('sgcoutrevient',r); go('nx-coutrevient'); });
    pg._fn.fgplus=()=>sauverP({FG:[...P.FG,{l:'Nouveau poste',m:0}]});
    pg._fn.tous=()=>sgConfirm('Enregistrer le taux interne calculé de chaque collaborateur, valable dès aujourd’hui ?',()=>sgCrAppliquer(T.L));
    T.L.forEach((x,i)=>{ pg._fn['a'+i]=()=>sgCrAppliquer([x]);
      pg._fn['d'+i]=()=>{ const c=x.c, l=(t,v)=>'<tr><td>'+t+'</td><td class="r">'+v+'</td></tr>';
        dialog({title:'Coût de revient — '+staffName(x.s),body:h('div',{style:{minWidth:'440px'},html:'<table class="nx-tbl">'
          +l('Salaire annuel ('+num(x.S.MOIS,0)+' × '+f0(x.S.SALAIRE)+')',f0(c.salaire)+' CHF')+l('Charges sociales ('+num(c.tch,1)+' %)',f0(c.charges)+' CHF')+l('Frais directs',f0(c.directs)+' CHF')+l('Part des frais généraux',f0(c.fg)+' CHF')+l('<b>Coût annuel</b>','<b>'+f0(c.annuel)+' CHF</b>')
          +l('Heures contractuelles ('+num(P.SEMAINES,0)+' sem. × '+num(P.HSEM,2)+' h × '+num(x.S.OCC,0)+' %)',nxH(c.contrat)+' h')+l('− vacances, jours fériés, absences',nxH(c.absences)+' h')+l('Heures de présence',nxH(c.presence)+' h')+l('Heures facturables ('+num(x.S.PROD,0)+' %)',nxH(c.factu)+' h')
          +l('<b>Taux interne</b> (coût ÷ présence)','<b>'+f2(c.taux)+' CHF/h</b>')+l('<b>Coût de revient</b> (coût ÷ heures facturables)','<b>'+f2(c.revient)+' CHF/h</b>')+l('Prix de vente conseillé (+ '+num(P.MARGE,0)+' %)',f2(c.vente)+' CHF/h')+'</table>'})}); }; }); } };
SG_VUE_DROIT['nx-coutrevient']=()=>sgDroit('equipe','taux')&&sgDroit('reglages','oui');

/* ── PV de chantier : auteur et couleur de chaque collaborateur (suivi des modifications du module PV, Facturation.html) ── */
const SG_PALETTE=['#4cbab5','#d7860d','#98c21f','#3f4193','#bd1e42','#8e5ea2','#2b9348','#c06c84','#636e7e','#e0a100'];
function sgCouleur(uid){ const r=DS.get('sgacces','couleurs'), c=r&&r.C&&r.C[uid]; if(c) return c;
  const us=DS.all('appuser').map(u=>String(u.USERID)).sort(), i=Math.max(0,us.indexOf(String(uid))); return SG_PALETTE[i%SG_PALETTE.length]; }
function sgPvAuteur(){ const u=ME.u; if(!u) return null; return {u:String(u.USERID),n:ME.staff?staffName(ME.staff):String(u.USERID),valideur:sgAdmin()||sgDroit('pv','validation')}; }
{ const r0=VIEWS['nx-profils'].render; VIEWS['nx-profils'].render=function(m){ r0.apply(this,arguments);
    const tb=[...m.querySelectorAll('table.nx-tbl')].pop(); if(!tb) return; const hr=tb.querySelector('tr'); if(hr) hr.insertAdjacentHTML('beforeend','<th>Couleur PV</th>');
    tb.querySelectorAll('select[data-user]').forEach(sel=>{ const u=DS.get('appuser',sel.dataset.user); if(!u) return;
      const td=h('td',{}), inp=h('input',{type:'color',value:sgCouleur(u.USERID),title:'Couleur des ajouts de '+u.USERID+' dans les PV de chantier (avant validation)',style:{width:'46px',height:'30px',padding:0,border:'1px solid var(--s-filet)'}});
      inp.onchange=async()=>{ const r=Object.assign({ID:'couleurs',C:{}},DS.get('sgacces','couleurs')||{}); r.C=Object.assign({},r.C,{[u.USERID]:inp.value}); await DS.save('sgacces',r); toast('Couleur de '+u.USERID+' enregistrée.'); };
      td.append(inp); sel.closest('tr').append(td); }); }; }

/* ═══ 13. HEURES DUES, VACANCES ET BOUCLEMENT ANNUEL — CCT VAUDOISE (07.10.2026) ═════════════════════════════════════
   CCT des bureaux d'architectes et ingénieurs vaudois du 1er janvier 2023 (force obligatoire dès le 1.12.2023) :
   art. 13 : 42,5 h effectives par semaine sur 5 jours (8,5 h/j) ; art. 17 : 9 jours fériés payés (VD) ; art. 24 : 5 semaines de
   vacances (25 j), 6 semaines (30 j) dès 50 ans révolus et avant 20 ans révolus, prorata temporis ; férié pendant les vacances = pas
   un jour de vacances. Heures dues (stafftargettime) = jours ouvrés (hors week-ends et fériés vaudois, période d'engagement) × 8,5 h ×
   taux d'occupation ; droit aux vacances (staff.HOLIDAYS, en heures) = jours CCT au prorata × 8,5 h × taux. Le taux d'occupation est
   celui du coût de revient (sgcoutrevient). Bouclement : heures supplémentaires (solde + report) → report de l'année suivante
   (TARGETTIMEREDUCTION) ; solde de vacances → droit de l'année suivante (HOLIDAYBALANCE) ; validation obligatoire (sgbouclement). */
const SG_CCT={nom:'CCT des bureaux d’architectes et ingénieurs vaudois (1er janvier 2023)',hsem:42.5,hj:8.5,vac:25,vac6:30};
const SG_FERIES_VD=[['Nouvel an',0,{DATEDAY:1,DATEMONTH:0}],['2 janvier (Saint-Berchtold)',0,{DATEDAY:2,DATEMONTH:0}],['Vendredi saint',1,{NOFDAYSEASTERSUNDAY:-2}],
  ['Lundi de Pâques',1,{NOFDAYSEASTERSUNDAY:1}],['Ascension',1,{NOFDAYSEASTERSUNDAY:39}],['Lundi de Pentecôte',1,{NOFDAYSEASTERSUNDAY:50}],
  ['Fête nationale (1er août)',0,{DATEDAY:1,DATEMONTH:7}],['Lundi du Jeûne fédéral',3,{}],['Noël',0,{DATEDAY:25,DATEMONTH:11}]];
const sgFerieCle=x=>x.TYPECODE===1?'p'+x.NOFDAYSEASTERSUNDAY:x.TYPECODE===3||/je[uû]ne/i.test(nm(x))?'jeune':x.TYPECODE===0?'f'+x.DATEDAY+'-'+x.DATEMONTH:'u'+x.ID;
const sgFerieCleR=([,t,v])=>t===1?'p'+v.NOFDAYSEASTERSUNDAY:t===3?'jeune':'f'+v.DATEDAY+'-'+v.DATEMONTH;
function sgFeriesVdOps(){ const L=DS.all('publicholiday'), vd=new Map(SG_FERIES_VD.map(r=>[sgFerieCleR(r),r])), ops=[], vus=new Set();
  L.forEach(x=>{ const k=sgFerieCle(x), r=vd.get(k); vus.add(k);
    const v=r?{...x,ISON:1,OFFTYPECODE:0,...(k==='jeune'?{TYPECODE:3,DATEDAY:null,DATEMONTH:null,NOFDAYSEASTERSUNDAY:-1}:{})}:{...x,ISON:0};
    if(v.ISON!==x.ISON||v.TYPECODE!==x.TYPECODE||v.OFFTYPECODE!==x.OFFTYPECODE) ops.push({t:'publicholiday',id:x.ID,val:v}); });
  const manq=SG_FERIES_VD.filter(r=>!vus.has(sgFerieCleR(r))), ids=manq.length?DS.newIds('publicholiday',manq.length):[];
  manq.forEach(([n,t,v],i)=>ops.push({t:'publicholiday',id:ids[i],val:{ID:ids[i],NAMEFR:n,TYPECODE:t,DATEDAY:v.DATEDAY??-1,DATEMONTH:v.DATEMONTH??-1,NOFDAYSEASTERSUNDAY:v.NOFDAYSEASTERSUNDAY??-1,DATEYEAR:-1,ISON:1,OFFTYPECODE:0,SORTORDER:100+i}}));
  return ops; }
async function sgFeriesVd(silencieux){ const ops=sgFeriesVdOps(); if(!ops.length){ if(!silencieux) toast('Les jours fériés vaudois sont déjà en place.'); return 0; }
  await DS.commit(ops); if(!silencieux) toast('Jours fériés du canton de Vaud appliqués (CCT, art. 17).'); return ops.length; }
/* collaborateur : naissance (fiche personne), taux d'occupation (coût de revient) */
function sgNaissance(s){ const c=DS.get('contact',s.PERSON_ID), o=c?DS.get('contactowner',c.CONTACTOWNER_ID):DS.get('contactowner',s.PERSON_ID); return o&&o.BIRTHDAY?String(o.BIRTHDAY).slice(0,10):null; }
const sgOcc=s=>(+sgCrStaff(s).OCC||0)/100;
const sgAge=(nais,d)=>{ if(!nais) return null; const b=new Date(nais+'T00:00'); let a=d.getFullYear()-b.getFullYear(); if(d.getMonth()<b.getMonth()||(d.getMonth()===b.getMonth()&&d.getDate()<b.getDate())) a--; return a; };
function sgCctAnnee(s,y){ const occ=sgOcc(s), PH=pubHolidays(y), nais=sgNaissance(s), deb=s.JOININGDATE?String(s.JOININGDATE).slice(0,10):null, fin=s.QUITTINGDATE?String(s.QUITTINGDATE).slice(0,10):null;
  const mois=Array(12).fill(0), nj=(y%4===0&&y%100!==0)||y%400===0?366:365; let vacJ=0, joursEng=0;
  for(let d=new Date(y,0,1);d.getFullYear()===y;d.setDate(d.getDate()+1)){ const k=diso(d); if((deb&&k<deb)||(fin&&k>fin)) continue; joursEng++;
    const a=sgAge(nais,d); vacJ+=((a!=null&&(a>=50||a<20))?SG_CCT.vac6:SG_CCT.vac)/nj;
    if(d.getDay()%6&&!PH.has(k)) mois[d.getMonth()]+=SG_CCT.hj*occ; }
  const vacJours=Math.round(vacJ*occ*2)/2;
  return {occ,nais,age:sgAge(nais,new Date(y,11,31)),deb,fin,joursEng,mois:mois.map(v=>Math.round(v*100)/100),an:Math.round(mois.reduce((a,b)=>a+b,0)*100)/100,vacJours,vacHeures:Math.round(vacJours*SG_CCT.hj*100)/100}; }
async function sgCctAppliquer(xs,y,silencieux){ const ops=[];
  for(const {s,c} of xs){ const ex=DS.by('stafftargettime','STAFF_ID',s.ID).find(t=>+t.TARGETTIMEYEAR===y), id=ex?ex.ID:DS.newIds('stafftargettime')[0];
    const v={...(ex||{ID:id,STAFF_ID:s.ID,TARGETTIMEYEAR:y,TARGETTIMEREDUCTION:0,REMARK:null,...Object.fromEntries([...Array(12)].map((_,i)=>['OVERTIME'+i,0]))}),ID:id};
    c.mois.forEach((h,i)=>v['TARGETHOURS'+i]=h); ops.push({t:'stafftargettime',id,val:v});
    if(y===new Date().getFullYear()&&+s.HOLIDAYS!==c.vacHeures) ops.push({t:'staff',id:s.ID,val:{...s,HOLIDAYS:c.vacHeures}}); }
  if(ops.length) await DS.commit(ops); if(!silencieux) toast(xs.length+' collaborateur(s) : heures dues '+y+(y===new Date().getFullYear()?' et droit aux vacances':'')+' enregistrés.'); }
/* automatique (administrateur) : fériés vaudois, heures dues de l'année en cours et de la suivante pour qui n'en a pas encore */
async function sgCctAuto(){ if(!sgAdmin()) return; try{ await DS.need(['publicholiday','stafftargettime']); await sgFeriesVd(true);
    const y=new Date().getFullYear(); for(const yy of [y,y+1]){ const xs=staffList().filter(s=>!DS.by('stafftargettime','STAFF_ID',s.ID).some(t=>+t.TARGETTIMEYEAR===yy)).map(s=>({s,c:sgCctAnnee(s,yy)}));
      if(xs.length) await sgCctAppliquer(xs,yy,true); } }catch(e){ console.error(e); } }
{ const t=setInterval(()=>{ if(NX.booted&&DS.info){ clearInterval(t); sgAccPret().then(()=>setTimeout(sgCctAuto,4000)); } },1000); }
VIEWS['nx-cct']={ render(m){ const y=nxLS.get('sg3_cct_an',new Date().getFullYear()), PH=pubHolidays(y), L=staffList().map(s=>({s,c:sgCctAnnee(s,y),t:DS.by('stafftargettime','STAFF_ID',s.ID).find(x=>+x.TARGETTIMEYEAR===y)}));
    const fer=[...PH.entries()].sort().map(([k,n])=>'<tr><td>'+dfr(k)+'</td><td>'+nxCap(JOURS_L[new Date(k+'T00:00').getDay()])+'</td><td>'+nxE(n)+'</td></tr>').join(''), manqFer=sgFeriesVdOps().length;
    const sumT=t=>t?[...Array(12)].reduce((a,_,i)=>a+(+t['TARGETHOURS'+i]||0),0):null;
    const pg=nxPage(m,'<div class="sg-split">'+sgIntro('Ressources humaines','Heures dues et vacances','Calcul automatique selon la '+SG_CCT.nom+' : 42,5 h par semaine, 9 jours fériés vaudois non travaillés, 5 semaines de vacances (6 dès 50 ans et avant 20 ans), au prorata du taux d’occupation et de la période d’engagement.',
        '<div class="sg-figs"><div class="sg-fig"><div class="n">'+y+'</div><div class="t">année</div></div><div class="sg-fig"><div class="n">'+PH.size+'</div><div class="t">jours fériés</div></div></div>'
        +'<div class="acts"><button class="nx-btn" data-fn="prec">'+nxSvg('prev')+(y-1)+'</button><button class="nx-btn" data-fn="suiv">'+(y+1)+nxSvg('next')+'</button><button class="nx-btn pri" data-fn="tous">'+nxSvg('check')+'Appliquer à tous ('+y+')</button></div>')
      +'<div><div class="nx-grid">'
      +nxCard('c12','Collaborateurs actuels — '+y,'<div class="b flush" style="overflow:auto"><table class="nx-tbl sg-cr"><tr><th>Collaborateur</th><th>Occupation %</th><th>Naissance</th><th>Âge au 31.12</th><th>Engagement</th><th class="r">Heures dues '+y+'</th>'+MOIS.map(x=>'<th class="r">'+x+'</th>').join('')+'<th class="r">Vacances (jours)</th><th class="r">Vacances (heures)</th><th class="r">Enregistré</th><th></th></tr>'
        +L.map((x,i)=>{ const c=x.c, enr=sumT(x.t), diff=enr==null||Math.abs(enr-c.an)>0.05;
          return '<tr><td><b>'+nxE(staffName(x.s))+'</b></td><td><input class="inp" type="number" step="5" min="0" max="100" data-occ="'+x.s.ID+'" value="'+Math.round(c.occ*100)+'" style="width:70px;text-align:right"></td>'
            +'<td><input class="inp" type="date" data-nais="'+x.s.ID+'" value="'+(c.nais||'')+'" style="width:140px"></td><td>'+(c.age??'—')+'</td><td>'+(c.deb?dfr(c.deb):'')+(c.fin?' → '+dfr(c.fin):'')+'</td>'
            +'<td class="r"><b>'+nxH(c.an)+'</b></td>'+c.mois.map(v=>'<td class="r">'+nxH(v)+'</td>').join('')+'<td class="r">'+num(c.vacJours,1)+'</td><td class="r">'+nxH(c.vacHeures)+'</td>'
            +'<td class="r"'+(diff?' style="color:var(--s-orange)" title="Différent du calcul CCT"':'')+'>'+(enr==null?'—':nxH(enr))+'</td><td><button class="nx-btn" data-fn="a'+i+'">Appliquer</button></td></tr>'; }).join('')+'</table></div>'
        +'<div class="b" style="font-size:12px;color:var(--s-gris);font-weight:300">Le taux d’occupation est aussi celui du coût de revient. Date de naissance : nécessaire pour les 6 semaines de vacances (dès 50 ans, avant 20 ans). « Appliquer » enregistre les heures dues de '+y+(y===new Date().getFullYear()?' et le droit annuel aux vacances':'')+' ; les heures dues de l’année en cours et de la suivante sont créées automatiquement pour les nouveaux collaborateurs.</div>')
      +nxCard('c6','Jours fériés '+y+' (canton de Vaud)','<div class="b flush"><table class="nx-tbl">'+fer+'</table></div>'+(manqFer?'<div class="b"><button class="nx-btn pri" data-fn="fer">Appliquer les jours fériés vaudois (CCT, art. 17)</button></div>':''))
      +nxCard('c6','Rappel de la CCT','<div class="b" style="font-weight:300;font-size:13px">Art. 13 : 42,5 heures effectives par semaine, sur 5 jours.<br>Art. 17 : 1er et 2 janvier, Vendredi saint, Lundi de Pâques, Ascension, Lundi de Pentecôte, 1er août, Lundi du Jeûne fédéral, Noël.<br>Art. 24 : 5 semaines de vacances (25 jours), 6 semaines dès 50 ans révolus et pour les moins de 20 ans ; prorata temporis ; un jour férié pendant les vacances n’est pas un jour de vacances.<br>Un collaborateur peut saisir des heures un jour férié : elles s’ajoutent à son solde.</div>')
      +'</div></div></div>');
    const re=()=>go('nx-cct'); pg._fn.prec=()=>{ nxLS.set('sg3_cct_an',y-1); re(); }; pg._fn.suiv=()=>{ nxLS.set('sg3_cct_an',y+1); re(); };
    pg._fn.tous=()=>sgConfirm('Enregistrer les heures dues '+y+(y===new Date().getFullYear()?' et le droit aux vacances':'')+' de tous les collaborateurs actuels, selon la CCT ?',async()=>{ await sgCctAppliquer(L,y); re(); });
    pg._fn.fer=async()=>{ await sgFeriesVd(false); re(); };
    L.forEach((x,i)=>{ pg._fn['a'+i]=async()=>{ await sgCctAppliquer([x],y); re(); }; });
    m.querySelectorAll('[data-occ]').forEach(e=>e.onchange=async()=>{ const sid=e.dataset.occ, r=Object.assign({ID:'staff:'+sid,STAFF_ID:+sid},DS.get('sgcoutrevient','staff:'+sid)||sgCrStaff(DS.get('staff',sid))); r.OCC=Math.max(0,Math.min(100,+e.value||0)); await DS.save('sgcoutrevient',r); re(); });
    m.querySelectorAll('[data-nais]').forEach(e=>e.onchange=async()=>{ const s=DS.get('staff',e.dataset.nais), c=s&&DS.get('contact',s.PERSON_ID), o=c?DS.get('contactowner',c.CONTACTOWNER_ID):s&&DS.get('contactowner',s.PERSON_ID);
      if(!o){ toast('Fiche personne introuvable pour ce collaborateur.',true); return; } await DS.save('contactowner',{...o,BIRTHDAY:e.value||null}); re(); }); } };
/* bouclement annuel : heures supplémentaires et vacances, validation puis report sur l'année suivante */
function sgBoucler(s,y){ const a=new Date(y,0,1), b=new Date(y,11,31), M=hrMaps(s.ID,a,b).sum(a,b), tg=targetFor(s.ID,y), rep=tg&&tg.STAFF_ID?(+tg.TARGETTIMEREDUCTION||0):0;
  const H=hrHoliday(s,a,b), solde=Math.round((M.E-M.P)*100)/100;
  return {du:Math.round(M.P*100)/100,fait:Math.round(M.E*100)/100,solde,rep,hs:Math.round((solde+rep)*100)/100,vacDroit:H?Math.round(H.start*100)/100:null,vacPris:H?Math.round(H.spentY*100)/100:null,vacSolde:H?Math.round(H.saldo*100)/100:null}; }
VIEWS['nx-bouclement']={ async render(m){ await DS.need(['sgbouclement']); const y=nxLS.get('sg3_bcl_an',new Date().getFullYear()), enCours=y>=new Date().getFullYear();
    const L=staffList().map(s=>{ const b=sgBoucler(s,y), v=DS.get('sgbouclement',y+':'+s.ID); return {s,b,v,chg:v&&(Math.abs((+v.HS||0)-b.hs)>0.05||Math.abs((+v.VAC||0)-(b.vacSolde||0))>0.05)}; });
    const nV=L.filter(x=>x.v&&x.v.VALIDE).length, nT=L.filter(x=>x.v&&x.v.TRANSFERE).length;
    const pg=nxPage(m,'<div class="sg-split">'+sgIntro('Ressources humaines','Bouclement annuel','Chaque année : heures supplémentaires (solde de l’année + report) et solde des vacances par collaborateur. Vous validez les heures, puis elles sont transférées sur '+(y+1)+' (report des heures supplémentaires et droit aux vacances).',
        '<div class="sg-figs"><div class="sg-fig"><div class="n">'+nV+'/'+L.length+'</div><div class="t">validés</div></div><div class="sg-fig"><div class="n">'+nT+'</div><div class="t">transférés sur '+(y+1)+'</div></div></div>'
        +'<div class="acts"><button class="nx-btn" data-fn="prec">'+nxSvg('prev')+(y-1)+'</button><button class="nx-btn" data-fn="suiv">'+(y+1)+nxSvg('next')+'</button><button class="nx-btn" data-fn="vtous">'+nxSvg('check')+'Tout valider</button><button class="nx-btn pri" data-fn="transf"'+(nV?'':' disabled')+'>Transférer sur '+(y+1)+'</button><button class="nx-btn" data-fn="csv">'+nxSvg('export')+'CSV</button></div>')
      +'<div>'+(enCours?'<div class="nx-card c12" style="margin-bottom:22px"><div class="b" style="color:var(--s-orange)">Année '+y+' en cours : les soldes sont calculés au 31 décembre '+y+' avec les heures saisies à ce jour (heures dues de toute l’année). Validez-les en fin d’année, une fois les feuilles d’heures complètes.</div></div>':'')
      +nxCard('c12','Heures supplémentaires et vacances — '+y,'<div class="b flush" style="overflow:auto"><table class="nx-tbl sg-cr" id="bcl-t"><tr><th>Collaborateur</th><th class="r">Heures dues</th><th class="r">Heures saisies</th><th class="r">Solde '+y+'</th><th class="r">Report '+(y-1)+'</th><th class="r">Heures sup. à reporter</th><th class="r">Droit vacances '+y+' (h)</th><th class="r">Vacances prises (h)</th><th class="r">Solde vacances (h)</th><th class="r">(jours)</th><th>Validation</th><th>Transfert</th></tr>'
        +L.map((x,i)=>{ const b={...x.b}, v=x.v||{}; if(b.vacSolde==null&&v.VAC!=null) b.vacSolde=+v.VAC;   // année déjà reportée : solde validé
          return '<tr><td><b>'+nxE(staffName(x.s))+'</b></td><td class="r">'+nxH(b.du)+'</td><td class="r">'+nxH(b.fait)+'</td><td class="r"'+(b.solde<0?' style="color:var(--s-rouge)"':'')+'>'+nxH(b.solde)+'</td><td class="r">'+nxH(b.rep)+'</td>'
            +'<td class="r"><b'+(b.hs<0?' style="color:var(--s-rouge)"':'')+'>'+nxH(b.hs)+'</b></td><td class="r">'+(b.vacDroit==null?'—':nxH(b.vacDroit))+'</td><td class="r">'+(b.vacPris==null?'—':nxH(b.vacPris))+'</td><td class="r"><b>'+(b.vacSolde==null?'—':nxH(b.vacSolde))+'</b></td><td class="r">'+(b.vacSolde==null?'':num(b.vacSolde/SG_CCT.hj,1))+'</td>'
            +'<td>'+(v.VALIDE?'<span class="nx-tag s3">validé</span> <span style="font-size:11px;color:var(--s-gris)">'+nxE(v.PAR||'')+' '+dfr(String(v.LE||'').slice(0,10))+'</span>'+(x.chg?' <span class="nx-tag urg" title="Les heures ont changé depuis la validation">modifié</span>':'')+' <button class="nx-btn" style="height:26px" data-fn="d'+i+'">Annuler</button>'
              :'<button class="nx-btn pri" style="height:28px" data-fn="v'+i+'">Valider</button>')+'</td>'
            +'<td>'+(v.TRANSFERE?'<span class="nx-tag s3">transféré</span> <span style="font-size:11px;color:var(--s-gris)">'+dfr(String(v.TRANSFERE_LE||'').slice(0,10))+'</span>':'—')+'</td></tr>'; }).join('')+'</table></div>'
        +'<div class="b" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><b>Heures sup. positives au 31.12 :</b><label><input type="radio" name="bclm" data-bclm="vacances"'+(nxLS.get('sg3_bcl_mode','vacances')==='vacances'?' checked':'')+'> compensées en vacances (contrat du bureau)</label><label><input type="radio" name="bclm" data-bclm="report"'+(nxLS.get('sg3_bcl_mode','vacances')==='report'?' checked':'')+'> reportées en heures</label></div>'
        +'<div class="b" style="font-size:12px;color:var(--s-gris);font-weight:300">Transfert : le report d’heures supplémentaires de '+(y+1)+' reçoit les « heures sup. à reporter » (un solde positif va en vacances si l’option ci-dessus est choisie) ; le droit aux vacances de '+(y+1)+' = solde des vacances + droit annuel (CCT). Seules les lignes validées sont transférées ; un nouveau transfert remplace le précédent (pas de cumul).</div>')
      +'</div></div>');
    const re=()=>go('nx-bouclement'), qui=String((ME.u&&ME.u.USERID)||''), maint=()=>new Date().toISOString().slice(0,16);
    const valider=x=>({t:'sgbouclement',id:y+':'+x.s.ID,val:{ID:y+':'+x.s.ID,ANNEE:y,STAFF_ID:x.s.ID,VALIDE:1,PAR:qui,LE:maint(),HS:x.b.hs,VAC:x.b.vacSolde,TRANSFERE:x.v&&x.v.TRANSFERE||0,TRANSFERE_LE:x.v&&x.v.TRANSFERE_LE||null}});
    pg._fn.prec=()=>{ nxLS.set('sg3_bcl_an',y-1); re(); }; pg._fn.suiv=()=>{ nxLS.set('sg3_bcl_an',y+1); re(); };
    L.forEach((x,i)=>{ pg._fn['v'+i]=async()=>{ await DS.commit([valider(x)]); re(); }; pg._fn['d'+i]=async()=>{ await DS.commit([{t:'sgbouclement',id:y+':'+x.s.ID,val:{...x.v,VALIDE:0}}]); re(); }; });
    pg._fn.vtous=()=>sgConfirm('Valider les heures supplémentaires et les soldes de vacances '+y+' de tous les collaborateurs ?',async()=>{ await DS.commit(L.map(valider)); re(); });
    pg._fn.transf=()=>{ const V=L.filter(x=>x.v&&x.v.VALIDE);
      sgConfirm('Transférer sur '+(y+1)+' les heures supplémentaires et les soldes de vacances VALIDÉS ('+V.length+' collaborateur'+(V.length>1?'s':'')+') ?'+(V.some(x=>x.chg)?'\n\n⚠ Certaines heures ont changé depuis leur validation : ce sont les valeurs validées qui seront transférées.':''),async()=>{
        const ops=[]; for(const x of V){ const y1=y+1, c1=sgCctAnnee(x.s,y1), ex=DS.by('stafftargettime','STAFF_ID',x.s.ID).find(t=>+t.TARGETTIMEYEAR===y1), id=ex?ex.ID:DS.newIds('stafftargettime')[0];
          const tv=ex?{...ex}:{ID:id,STAFF_ID:x.s.ID,TARGETTIMEYEAR:y1,REMARK:null,...Object.fromEntries([...Array(12)].flatMap((_,i)=>[['TARGETHOURS'+i,c1.mois[i]],['OVERTIME'+i,0]]))};
          const hs=+x.v.HS||0, enVac=nxLS.get('sg3_bcl_mode','vacances')==='vacances'&&hs>0;   // contrat du bureau : solde positif au 31.12 compensé en vacances (1 h = 1 h)
          tv.TARGETTIMEREDUCTION=enVac?0:hs; ops.push({t:'stafftargettime',id,val:tv});
          if(x.v.VAC!=null||enVac) ops.push({t:'staff',id:x.s.ID,val:{...DS.get('staff',x.s.ID),HOLIDAYS:c1.vacHeures,HOLIDAYBALANCE:Math.round(((+x.v.VAC||0)+(enVac?hs:0)+c1.vacHeures)*100)/100,HOLIDAYBALANCEYEAR:y1,HOLIDAYBALANCECHANGEDDATE:today()}});
          ops.push({t:'sgbouclement',id:y+':'+x.s.ID,val:{...x.v,TRANSFERE:1,TRANSFERE_LE:maint(),TRANSFERE_PAR:qui}}); }
        await DS.commit(ops); toast(V.length+' collaborateur(s) transféré(s) sur '+(y+1)+'.'); re(); }); };
    pg._fn.csv=()=>{ const t=m.querySelector('#bcl-t'); if(t) sgCsvTable(t,'bouclement_'+y+'.csv'); };
    m.querySelectorAll('[data-bclm]').forEach(r=>r.onchange=()=>{ nxLS.set('sg3_bcl_mode',r.dataset.bclm); toast(r.dataset.bclm==='vacances'?'Les heures sup. positives seront converties en vacances au transfert.':'Les heures sup. seront reportées en heures.'); }); } };
Object.assign(SG_VUE_DROIT,{'nx-cct':()=>sgDroit('equipe','taux')&&sgDroit('reglages','oui'),'nx-bouclement':()=>sgDroit('equipe','taux')&&sgDroit('reglages','oui')});

/* ═══ 14. CONTRATS DE TRAVAIL (07.10.2026) ═════════════════════════════════════════════════════════════════════════
   Ressources humaines ▸ Contrats de travail (administrateur) — collection « sgcontrattravail » (réservée sur le NAS) :
   « contrat » (engagement : fonction, catégorie CCT, début, durée, taux, salaire × mois, temps d'essai, clauses, coordonnées) ;
   « avenant » (nouvelles conditions dès une date d'effet) ; « fin » (résiliation : reçue le, par qui, fin légale, départ effectif).
   Conditions en vigueur à une date = contrat + avenants → taux d'occupation (heures dues CCT), salaire et mois (coût de revient).
   Délais : CCT art. 10 (essai 3 mois, congé 7 jours ; puis 1 mois la 1re année, 2 mois dès la 2e, 3 mois dès la 10e, pour la
   fin d'un mois). Décompte de sortie : vacances au prorata, heures sup., jours ouvrés jusqu'à la fin, dernier jour conseillé,
   solde à payer (salaire horaire = salaire annuel ÷ (heures hebdomadaires × 52,14), CCT art. 25). Documents au modèle du bureau
   (contrat, avenant, confirmation de fin, décompte) : texte du « 19_Contrat employé » ; impression / PDF depuis la visionneuse. */
const SG_BUREAU={nom:'substances architectes sàrl',siege:'Cully',rep:'Monsieur Paulo Meireles',titre:'Directeur',signataire:'Paulo Meireles',
  rue:'RUE DE LA GARE 12',lieu:'CH – 1096 CULLY',tel:'+41 21 711 50 50',mail:'INFO@SUBSTANCES.CH',ide:'CHE-403.117.623',rc:'CH-550.1.175.460-8',ville:'Cully'};
/* grille des salaires minimaux CCT (12 mois, 42,5 h/sem.) — avenant du 26.11.2025, dès le 1er janvier 2026 */
const SG_GRILLE={annee:2026,source:'CCT AIVD — grille des salaires du 1er janvier 2026',cat:{
  dessinateur:{t:'Dessinateur·trice CFC',n:[['0-1','0-1 an',4485],['1-2','1-2 ans',4700],['2-3','2-3 ans',4910],['3','plus de 3 ans',5115],['7','plus de 7 ans',5860]]},
  technicien:{t:'Technicien·ne ES',n:[['0-1','0-1 an',4940],['1-2','1-2 ans',5150],['2-3','2-3 ans',5355],['3','plus de 3 ans',5575],['7','plus de 7 ans',6315]]},
  bachelor:{t:'Architecte Bachelor professionnalisant',n:[['0-1','0-1 an',5045],['1-2','1-2 ans',5355],['2-3','2-3 ans',5675],['regB','REG B obtention',6100],['regB3','REG B plus de 3 ans',6730]]},
  master:{t:'Architecte Master',n:[['0-1','0-1 an',5255],['1-2','1-2 ans',5675],['2-3','2-3 ans',6100],['regA','REG A obtention',6730],['regA3','REG A plus de 3 ans',7575]]},
  admin:{t:'Personnel administratif',n:[['0-1','0-1 an',4485],['1-2','1-2 ans',4700],['2-3','2-3 ans',4910],['3','plus de 3 ans',5115],['6','plus de 6 ans',5755]]},
  apprenti:{t:'Apprenti·e',n:[['1','1re année',850],['2','2e année',1200],['3','3e année',1400],['4','4e année',1600]]}}};
const sgMinimum=(cat,niv)=>{ const c=SG_GRILLE.cat[cat]; const x=c&&c.n.find(n=>n[0]===niv); return x?x[2]:null; };
const sgCtrAll=sid=>DS.all('sgcontrattravail').filter(x=>String(x.STAFF_ID)===String(sid)).sort((a,b)=>cmp(a.TYPE==='fin'?'z':a.EFFET||a.DEBUT||a.DATE,b.TYPE==='fin'?'z':b.EFFET||b.DEBUT||b.DATE));
function sgCtrEnVigueur(sid,d){ const k=typeof d==='string'?d:diso(d), L=sgCtrAll(sid), c=L.filter(x=>x.TYPE==='contrat'&&x.DEBUT&&x.DEBUT<=k).sort((a,b)=>cmp(b.DEBUT,a.DEBUT))[0]; if(!c) return null;
  const r={...c}; L.filter(x=>x.TYPE==='avenant'&&x.EFFET&&x.EFFET<=k&&x.EFFET>=c.DEBUT).sort((a,b)=>cmp(a.EFFET,b.EFFET)).forEach(a=>{ ['OCC','SALAIRE','MOIS','FONCTION','CATEGORIE','NIVEAU'].forEach(f=>{ if(a[f]!=null&&a[f]!=='') r[f]=a[f]; }); r._avenant=a; });
  const f=L.find(x=>x.TYPE==='fin'); if(f&&f.FIN&&k>f.FIN) return null; r._fin=f||null; return r; }
const sgCtrFin=sid=>sgCtrAll(sid).find(x=>x.TYPE==='fin')||null;
/* taux d'occupation à une date : contrat en vigueur ; avant le premier contrat enregistré, celui-ci (conditions connues les plus anciennes) ; sinon coût de revient */
const sgOccAu=(s,d)=>{ const c=sgCtrEnVigueur(s.ID,d); if(c) return (+c.OCC||0)/100;
  const k=typeof d==='string'?d:diso(d), p=sgCtrAll(s.ID).filter(x=>x.TYPE==='contrat'&&x.DEBUT&&x.DEBUT>k).sort((a,b)=>cmp(a.DEBUT,b.DEBUT))[0]; return p?(+p.OCC||0)/100:sgOcc(s); };
/* contrat → coût de revient (salaire, mois, taux) */
{ const f0=sgCrStaff; sgCrStaff=function(s){ const r=f0.apply(this,arguments); const c=s&&sgCtrEnVigueur(s.ID,today()); if(c) Object.assign(r,{SALAIRE:+c.SALAIRE||0,MOIS:+c.MOIS||12,OCC:+c.OCC||0,_contrat:1}); return r; }; }
/* heures dues : taux par jour (avenants en cours d'année) ; vacances : 6 semaines dès le 1er janvier de l'année des 50 ans (contrat du bureau, plus favorable que la CCT) et avant 20 ans révolus (CCT) */
sgCctAnnee=function(s,y){ const PH=pubHolidays(y), nais=sgNaissance(s), deb=s.JOININGDATE?String(s.JOININGDATE).slice(0,10):null, finS=s.QUITTINGDATE?String(s.QUITTINGDATE).slice(0,10):null;
  const mois=Array(12).fill(0), nj=(y%4===0&&y%100!==0)||y%400===0?366:365, a50=sgAge(nais,new Date(y,11,31)); let vacJ=0, joursEng=0, occMoy=0;
  for(let d=new Date(y,0,1);d.getFullYear()===y;d.setDate(d.getDate()+1)){ const k=diso(d); if((deb&&k<deb)||(finS&&k>finS)) continue; joursEng++;
    const occ=sgOccAu(s,d), a=sgAge(nais,d); occMoy+=occ; vacJ+=((a50!=null&&a50>=50)||(a!=null&&a<20)?SG_CCT.vac6:SG_CCT.vac)/nj*occ;
    if(d.getDay()%6&&!PH.has(k)) mois[d.getMonth()]+=SG_CCT.hj*occ; }
  const vacJours=Math.round(vacJ*2)/2;
  return {occ:joursEng?occMoy/joursEng:sgOcc(s),nais,age:sgAge(nais,new Date(y,11,31)),deb,fin:finS,joursEng,mois:mois.map(v=>Math.round(v*100)/100),an:Math.round(mois.reduce((a,b)=>a+b,0)*100)/100,vacJours,vacHeures:Math.round(vacJours*SG_CCT.hj*100)/100}; };
/* délai de congé (CCT art. 10) : reçue le → fin du contrat */
const sgFinMois=(d,n)=>new Date(d.getFullYear(),d.getMonth()+n+1,0);
function sgPreavis(debut,recu){ const r=new Date(recu+'T00:00'), dEb=new Date(debut+'T00:00'), finEssai=new Date(dEb.getFullYear(),dEb.getMonth()+3,dEb.getDate()-1);
  if(r<=finEssai){ const f=new Date(r); f.setDate(f.getDate()+7); return {essai:true,delai:'7 jours (temps d’essai)',fin:f}; }
  const ans=(r-dEb)/(365.25*864e5), n=ans<1?1:ans<9?2:3;   // 1re année : 1 mois ; dès la 2e : 2 mois ; dès la 10e : 3 mois
  return {essai:false,delai:n+' mois pour la fin d’un mois ('+(n===1?'1re année de service':n===2?'de la 2e à la 9e année':'dès la 10e année')+')',fin:sgFinMois(r,n),annees:ans}; }
/* jours ouvrés (hors week-ends et fériés vaudois) entre deux dates incluses */
function sgJoursOuvres(a,b){ let n=0; const PH=new Map(); for(let y=a.getFullYear();y<=b.getFullYear();y++) pubHolidays(y).forEach((v,k)=>PH.set(k,v));
  for(let d=new Date(a);d<=b;d.setDate(d.getDate()+1)) if(d.getDay()%6&&!PH.has(diso(d))) n++; return n; }
/* décompte de sortie */
function sgDecompteSortie(s,fin){ const F=new Date(fin+'T00:00'), y=F.getFullYear(), auj=new Date(today()+'T00:00'), c=sgCtrEnVigueur(s.ID,fin)||sgCtrEnVigueur(s.ID,today())||{};
  const occ=(+c.OCC||sgOcc(s)*100)/100, hj=SG_CCT.hj*occ, a=new Date(y,0,1), cy=sgCctAnnee(s,y);
  const vacAnnee=cy.vacHeures; const H=hrHoliday(s,a,new Date(y,11,31)), report=H?H.start-(+s.HOLIDAYS||0):0, pris=H?H.spentY:0;
  const vacSolde=Math.round((report+vacAnnee-pris)*100)/100;
  const borne=auj<F?auj:F, M=hrMaps(s.ID,a,borne).sum(a,borne), tg=targetFor(s.ID,y), rep=tg&&tg.STAFF_ID?(+tg.TARGETTIMEREDUCTION||0):0;
  const hsSolde=Math.round((M.E-M.P+rep)*100)/100;
  const deb=auj>F?F:new Date(auj.getTime()+864e5), jours=auj>=F?0:sgJoursOuvres(deb,F), heuresDispo=Math.round(jours*hj*100)/100;
  const aCompenser=Math.max(0,vacSolde)+Math.max(0,hsSolde), joursComp=hj?Math.ceil(aCompenser/hj*2)/2:0;
  let dernier=new Date(F), r=Math.floor(joursComp); const PH=new Map(); for(let yy=y-1;yy<=y;yy++) pubHolidays(yy).forEach((v,k)=>PH.set(k,v));
  while(r>0&&dernier>auj){ if(dernier.getDay()%6&&!PH.has(diso(dernier))) r--; dernier.setDate(dernier.getDate()-1); }
  while(!(dernier.getDay()%6)||PH.has(diso(dernier))) dernier.setDate(dernier.getDate()-1);
  const annuel=(+c.SALAIRE||0)*(+c.MOIS||12), horaire=annuel&&occ?annuel/(SG_CCT.hsem*occ*52.14):0, aPayer=Math.max(0,aCompenser-heuresDispo);
  return {fin:F,occ,hj,vacAnnee,report:Math.round(report*100)/100,pris,vacSolde,hsSolde,jours,heuresDispo,aCompenser,joursComp,dernier,horaire,aPayer,aPayerCHF:aPayer*horaire,annuel,
    negatif:Math.min(0,vacSolde)+Math.min(0,hsSolde)}; }
/* nombres en lettres (montants) */
function sgEnLettres(n){ n=Math.round(Math.abs(+n||0)); if(!n) return 'zéro';
  const U=['','un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix','onze','douze','treize','quatorze','quinze','seize'], D=['','dix','vingt','trente','quarante','cinquante','soixante','soixante','quatre-vingt','quatre-vingt'];
  const m100=x=>{ if(x<17) return U[x]; if(x<20) return 'dix-'+U[x-10]; const d=Math.floor(x/10), u=x%10;
    if(d===7||d===9) return D[d]+(d===7&&u===1?' et ':'-')+(u+10<17?U[u+10]:'dix-'+U[u]);
    return D[d]+(u===1&&d<8?' et un':u?'-'+U[u]:(d===8?'s':'')); };
  const m1000=x=>{ const c=Math.floor(x/100), r=x%100; return (c?(c>1?U[c]+' cent'+(r?'':'s'):'cent'):'')+(c&&r?' ':'')+(r?m100(r):''); };
  const parts=[]; const mi=Math.floor(n/1e6), k=Math.floor(n%1e6/1000), r=n%1000;
  if(mi) parts.push(m1000(mi)+' million'+(mi>1?'s':'')); if(k) parts.push(k===1?'mille':m1000(k).replace(/cents$/,'cent')+' mille'); if(r) parts.push(m1000(r)); return parts.join(' '); }
const SG_MOIS_L=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const sgDateL=k=>{ if(!k) return '…'; const d=new Date(String(k).slice(0,10)+'T00:00'); return (d.getDate()===1?'1er':d.getDate())+' '+SG_MOIS_L[d.getMonth()]+' '+d.getFullYear(); };
const sgChf=v=>(Math.round(+v||0)).toString().replace(/\B(?=(\d{3})+(?!\d))/g,'’');
/* ── documents au modèle du bureau ── */
const SG_DOC_CSS='@page{size:A4;margin:22mm 20mm 26mm}body{font-family:"SUB Akkurat",Akkurat,"Akkurat Pro",Helvetica,Arial,sans-serif;font-size:9.5pt;line-height:1.45;color:#1d1d1b;margin:0;font-weight:300}b,strong,h1,h2{font-weight:700}'
  +'h1{font-size:15pt;letter-spacing:.06em;margin:0 0 2mm;font-weight:700}.date{font-size:9pt;letter-spacing:.08em;margin:0 0 9mm}.sous{font-size:12pt;font-weight:300;margin:0 0 9mm}'
  +'h2{font-size:8.5pt;letter-spacing:.08em;margin:6mm 0 1.5mm;font-weight:700;break-after:avoid}p{margin:0 0 2mm}.parties{display:grid;grid-template-columns:1fr 1fr;gap:10mm;margin:0 0 8mm}'
  +'.parties h2{margin-top:0}.cols{column-count:2;column-gap:10mm}.cols h2:first-child{margin-top:0}ul{margin:0 0 2mm;padding-left:5mm}li{margin:0 0 1mm}'
  +'.sign{display:grid;grid-template-columns:1fr 1fr;gap:12mm;margin-top:14mm;break-inside:avoid}.sign div{border-top:.25pt solid #1d1d1b;padding-top:2mm;min-height:22mm}'
  +'.pied{position:fixed;bottom:-16mm;left:0;right:0;font-size:7pt;letter-spacing:.05em;color:#706f6f;display:flex;justify-content:space-between}'
  +'table{border-collapse:collapse;width:100%;margin:2mm 0 4mm}td,th{border-bottom:.25pt solid #9d9d9c;padding:1.5mm 2mm;text-align:left;vertical-align:top}td.r,th.r{text-align:right}tr.tot td{font-weight:700;border-top:.6pt solid #1d1d1b}';
const sgPiedDoc=()=>'<div class="pied"><span>'+SG_BUREAU.rue+' · '+SG_BUREAU.lieu+'</span><span>'+SG_BUREAU.tel+' · '+SG_BUREAU.mail+'</span><span>'+SG_BUREAU.ide+' · '+SG_BUREAU.rc+'</span></div>';
const sgPolicesDoc=()=>[...document.styleSheets].flatMap(ss=>{ try{ return [...ss.cssRules]; }catch(_){ return []; } }).filter(r=>r.type===5&&/SUB Akkurat/.test(r.cssText)).map(r=>r.cssText).join('');   // @font-face Akkurat (local) de l'app
function sgDocOuvrir(titre,corps,nom){ const html='<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>'+nxE(titre)+'</title><style>'+sgPolicesDoc()+SG_DOC_CSS+'</style></head><body>'+sgPiedDoc()+corps+'</body></html>';
  sgVisionneuse(new Blob([html],{type:'text/html'}),nom||(titre+'.html'),{interne:true}); }
const sgE=s=>nxE(s==null?'':String(s));
function sgDocContrat(c){ const E=c.EMPLOYE||{}, fem=E.civ==='Madame', ee=fem?'e':'', occ=+c.OCC||100, hs=Math.round(SG_CCT.hsem*occ)/100, annuel=(+c.SALAIRE||0)*(+c.MOIS||12);
  const corps='<h1>CONTRAT DE TRAVAIL</h1><div class="date">'+SG_BUREAU.ville.toUpperCase()+' – '+sgDateL(c.DATE).toUpperCase()+'</div><div class="sous">Confirmation<br>&amp; conditions d’engagement</div>'
   +'<div class="parties"><div><h2>L’EMPLOYEUR</h2><p>'+SG_BUREAU.nom+'<br>sise à '+SG_BUREAU.siege+'<br>représentée par '+SG_BUREAU.rep+'<br>'+SG_BUREAU.titre+'</p></div>'
   +'<div><h2>L’EMPLOYÉ'+(fem?'E':'')+'</h2><p>'+sgE(E.civ)+' '+sgE(E.prenom)+' '+sgE(E.nom)+'<br>'+sgE(E.rue)+'<br>'+sgE(E.npa)+' '+sgE(E.localite)+'<br>'+(E.naissance?'Date de naissance le '+sgDateL(E.naissance)+'<br>':'')+(E.etatcivil?'État civil: '+sgE(E.etatcivil)+'<br>':'')+(E.origine?'Lieu d’origine: '+sgE(E.origine)+'<br>':'')+(E.tel?'Tél.: '+sgE(E.tel):'')+'</p></div></div>'
   +'<div class="cols"><h2>FONCTION</h2><p>Vous êtes engagé'+ee+' en qualité '+sgE(c.FONCTION)+'.<br>L’employé(e) s’engage à assumer les responsabilités relatives à un poste '+sgE(c.POSTE||'d’architecte')+'.</p>'
   +'<h2>DÉBUT DU CONTRAT</h2><p>Ce contrat entre en vigueur le '+sgDateL(c.DEBUT)+'.</p>'
   +'<h2>DURÉE DU CONTRAT</h2><p>'+(c.DUREE==='determinee'?'Cet engagement est conclu pour une durée déterminée, jusqu’au '+sgDateL(c.FIN_PREVUE)+'.':'Cet engagement est conclu pour une durée indéterminée.')+'</p>'
   +'<h2>RÉMUNÉRATION</h2><p>Votre salaire mensuel brut s’élèvera à CHF '+sgChf(c.SALAIRE)+'.- ('+sgEnLettres(c.SALAIRE)+') x '+(+c.MOIS||12)+' mensualités soit '+sgChf(annuel)+'.-/an.</p>'
   +'<p>Toute somme versée en sus de la rémunération, notamment à titre de gratification, aura et conservera le caractère d’une prestation volontaire, sans engagement de l’employeur, et ne donnera lieu à aucune prétention de la part du travailleur, même si elle a été versée pendant plusieurs années consécutives.</p>'
   +'<h2>TAUX D’ACTIVITÉ</h2><p>'+num(occ,0)+'% soit '+num(hs,2).replace(/\.?0+$/,'')+' h par semaine</p>'
   +'<h2>DURÉE DU TRAVAIL</h2><p>La durée hebdomadaire de travail s’entend comme le temps pendant lequel l’employé(e) est à la disposition de l’employeur pour l’exécution de ses tâches.</p><p>La durée hebdomadaire de travail pour un plein temps est de 42.5 heures, réparties sur 5 jours, pause (15 minutes/jour) comprise. L’employé(e) peut aménager son horaire de travail, d’entente avec l’employeur, en tenant compte des besoins du bureau.</p><p>En cas de taux d’activité inférieur à 100%, l’employé(e) devra définir, en accord avec l’employeur, les jours d’absence. Ceux-ci devront être exclusivement pris sur des jours pleins.</p><p>L’employé(e) doit assurer une présence minimale de 8h30 à 12h00 et de 13h30 à 17h00.</p>'
   +'<h2>DÉDUCTION</h2><p>Les cotisations AVS/AI/APG et chômage sont déduites de votre salaire brut.</p><p>Nous vous assurons contre les risques d’accident professionnels et non professionnels par l’intermédiaire de la '+sgE(c.LAA||'SUVA')+'. La prime d’assurance pour les accidents professionnels est prise en charge par notre établissement. La cotisation de l’assurance accident non professionnelle à charge de l’employé(e).</p><p>En cas de maladie ou d’accident, la perte de salaire est couverte par «'+sgE(c.IJM||'La Vaudoise')+'» assurances. La participation à l’assurance perte de gain à charge de l’employé(e).</p><p>Vous êtes affilié'+ee+' à un fonds de prévoyance professionnelle, conformément aux dispositions légales, auprès de '+sgE(c.LPP||'Swisslife')+' pour les prestations de vieillesse, d’invalidité et de décès.</p><p>Ces montants peuvent être modifiés en fonction des nouvelles dispositions légales ou de changement des conditions d’assurance applicables au personnel.</p>'
   +'<h2>DISPOSITIONS GÉNÉRALES</h2><p>Une période d’essai de '+(+c.ESSAI===3||!c.ESSAI?'trois':sgEnLettres(c.ESSAI))+' mois dès la date d’engagement est prévue.</p><p><b>Résiliation des rapports de travail</b><br>Les rapports de travail pourront être résiliés par les deux parties de la manière suivante:</p><ul><li>durant le temps d’essai avec un préavis de 7 jours suivant la résiliation écrite et recommandée</li><li>après le temps d’essai, le contrat peut être résilié pour la fin d’un mois moyennant un délai de congé :<br>- d’un mois pendant la première année de service,<br>- de deux mois de la deuxième à la neuvième année de service,<br>- de trois mois ultérieurement.</li></ul>'
   +'<p>L’employé(e) est tenu de remplir ses obligations avec fidélité et conscience. Il fera preuve de ponctualité, d’assiduité, d’ordre et de propreté. Il respectera les convenances, la morale et les bonnes moeurs.</p><p>L’employé(e) doit en toute circonstance agir conformément aux intérêts des clients et du bureau, ainsi que s’abstenir de tout ce qui pourrait leur porter préjudice.</p><p>L’employé(e) doit se conformer aux habitudes et méthodes de travail en usage dans le bureau. À ce titre, il adopte une tenue de travail correcte et conforme aux modalités en vigueur.</p><p>Il est interdit de fumer dans les bureaux.</p>'
   +(c.VOITURE?'<h2>VOITURE DE FONCTION</h2><p>L’employeur peut fournir à ses frais une voiture de fonction à l’employé(e) ayant un poste à responsabilité. La voiture de fonction peut également être utilisée à des fins privées. Le certificat de salaire doit signaler cet élément.</p><p>L’employeur prend à sa charge la totalité des frais d’entretien, d’assurances, etc..., l’employé(e) ne réglant que les frais de carburant pour ses longs trajets privés le week-end ou durant les vacances.</p><p>Une participation annuelle de 9.6% du prix d’achat du véhicule (hors TVA) sera prise en charge par l’employé(e) pour son utilisation privée.</p>':'')
   +'<h2>INDEMNITÉS DE DÉPLACEMENT</h2><p>Les déplacements effectués pour le travail par l’employé(e) sont exclusivement effectués avec les véhicules mis à disposition par l’employeur.</p><p>Tout déplacement professionnel en voiture d’entente avec l’employeur donne droit à un dédommagement couvrant les frais nécessaires. Il se monte à CHF '+sgE(c.KM||'0.70')+'/km, selon détail à mentionner sur fiche séparée (ce même montant est refacturé au client).</p><p>Les frais de déplacement professionnel par un autre moyen de transport sont remboursés uniquement sur présentation de justificatifs acquittés. En règle générale les frais de repas ne sont pas remboursés.</p>'
   +'<h2>INDEMNITÉS DE COMMUNICATION</h2><p>Selon la fonction de l’employé(e), un téléphone mobile peut être mis à disposition aux frais de l’employeur</p>'
   +'<h2>ABSENCES POUR MALADIE – VISITES MÉDICALES, ETC</h2><p>Les absences pour maladie seront signalées personnellement à l’employeur.</p><p>Les rendez-vous chez les médecins, dentistes, coiffeur, etc se prendront en principe en dehors des heures de bureau. Dans le cas contraire, le temps d’absence sera rattrapé au plus tard le mois suivant l’absence.</p>'
   +'<h2>HEURES SUPPLÉMENTAIRES</h2><p>Si des heures supplémentaires devaient être effectuées, l’employé(e) informera l’employeur de sa surcharge de travail, et ceci avant d’effectuer des heures supplémentaires.</p><p>Les heures supplémentaires seront compensées en vacances à raison d’une heure de vacance par heure supplémentaire. Les heures effectuées lors de concours seront comptabilisées pour moitié.</p><p>En principe les heures supplémentaires effectuées durant un mois seront compensées le mois suivant de manière à limiter l’accumulation d’heures supplémentaires.</p><p>Un décompte final sera effectué au 31 décembre de chaque année. Si le décompte présente un solde positif, les heures restantes seront compensées en vacances.</p>'
   +'<h2>VACANCES</h2><p>Les vacances sont de 5 semaines (25 jours ouvrables) pour les personnes jusqu’à 49 ans et de 6 semaines dès le 1er janvier du cinquantième anniversaire, ainsi que pour les personnes de moins de 20 ans révolus (CCT).</p>'
   +'<h2>ÉVALUATIONS DU TRAVAIL DE L’EMPLOYÉ</h2><p>Une évaluation du travail fourni par l’employé(e) sera effectuée à la fin du temps d’essai.</p><p>Deux évaluations auront lieu chaque année, la première fin juin et la deuxième fin décembre.</p>'
   +'<h2>DEVOIRS DE L’EMPLOYÉ</h2><p>L’employé(e) observe selon les règles de la bonne foi les directives générales de l’employeur et les instructions particulières qui lui ont été données.</p><p>L’employé(e) aura soin du matériel mis à sa disposition.</p><p>L’employé(e) doit observer la plus grande discrétion sur toutes les affaires concernant '+SG_BUREAU.nom+'. Il s’engage à ne pas utiliser en faveur des tiers, ni à montrer, ni à céder à des tiers les documents, dessins ou reproductions exécutés par lui ou parvenus à sa connaissance, sans l’autorisation de l’employeur. Tous les travaux exécutés par lui dans l’exercice de ses fonctions deviennent la propriété de '+SG_BUREAU.nom+'.</p>'
   +'<h2>CONDITIONS DE TRAVAIL</h2><p>L’employé(e) a pris connaissance des conditions de travail, espace de travail, matériel à disposition, programmes informatiques utilisés et les accepte.</p>'
   +'<h2>COMMUNICATIONS PRIVÉES</h2><p>Les communications privées (téléphone, mails, sms,…) ainsi que l’utilisation d’internet à des fins privées se font exclusivement en dehors des heures de travail. Dans le cas contraire, les heures effectives seront déduites du décompte horaire journalier.</p>'
   +'<h2>TRAVAUX PRIVÉS</h2><p>L’employé(e) n’a pas le droit d’exécuter à son compte ou pour celui de tiers des travaux entrant dans le cadre de la profession, tels que concours, sans l’autorisation expresse de '+SG_BUREAU.nom+'.</p><p>Les travaux privés accordés par '+SG_BUREAU.nom+' seront effectués exclusivement en dehors des heures de travail.</p><p>L’employé(e) peut avec l’accord de '+SG_BUREAU.nom+' utiliser le matériel du bureau, les copies et impressions plotter seront facturées selon les tarifs du bureau.</p>'
   +'<h2>AUTRES DISPOSITIONS</h2><p>Pour toutes les dispositions n’étant pas mentionnées dans le présent contrat, le code des obligations fera foi ainsi que la convention collective de travail des bureaux d’architectes et ingénieurs vaudois en vigueur.</p>'
   +(c.COMMISSION?'<h2>CONDITIONS PARTICULIÈRES</h2><p>Dans le cas où l’employé(e) apporte un mandat au bureau '+SG_BUREAU.nom+', les conditions suivantes sont définies:</p><p>Commission de '+sgDocPc(c,'COMM_T1')+'% à '+sgDocPc(c,'COMM_T3')+'% du montant hors taxe des honoraires facturés, versé au décompte final, une fois la totalité des honoraires encaissés. Les conditions restent valables au départ anticipé du collaborateur.</p><p>Base de calcul du pourcentage de commission :</p><ul><li>'+sgDocPc(c,'COMM_T1')+'% si montant des travaux &lt; '+sgDocMt(c,'COMM_S1')+' TTC</li><li>'+sgDocPc(c,'COMM_T2')+'% si montant des travaux &gt;= '+sgDocMt(c,'COMM_S1')+' TTC</li><li>'+sgDocPc(c,'COMM_T3')+'% si montant des travaux &gt; '+sgDocMt(c,'COMM_S2')+' TTC</li></ul><p>L’étude et la conception du projet sont réservées à l’employé(e), pour autant que son emploi du temps le lui permette. L’apport d’un mandat ne le libère pas des tâches qui lui ont été confiées.</p><p>Le contrat d’architecte sera établi au nom du bureau '+SG_BUREAU.nom+'.</p><p>En cas de rupture du présent contrat, les mandats amenés ne pourront en aucun cas être emportés. Toute violation de cette clause donne à l’employeur le droit d’exiger une indemnité équitable.</p>':'')
   +(c.CLAUSES?'<h2>'+(c.COMMISSION?'':'CONDITIONS PARTICULIÈRES')+'</h2><p>'+sgE(c.CLAUSES).replace(/\n/g,'<br>')+'</p>':'')
   +'</div><p style="margin-top:8mm">Fait en deux exemplaires à '+SG_BUREAU.ville+', le '+sgDateL(c.DATE)+'</p>'
   +'<div class="sign"><div>'+SG_BUREAU.nom+'<br>'+SG_BUREAU.signataire+'</div><div>'+sgE(E.prenom)+' '+sgE(E.nom)+'</div></div>';
  sgDocOuvrir('Contrat de travail — '+(E.prenom||'')+' '+(E.nom||''),corps,'Contrat_'+(E.nom||'')+'_'+String(c.DATE||'').slice(0,10)+'.html'); }
function sgDocAvenant(a){ const s=DS.get('staff',a.STAFF_ID), prev=sgCtrEnVigueur(a.STAFF_ID,new Date(new Date(a.EFFET+'T00:00').getTime()-864e5))||{}, base=sgCtrAll(a.STAFF_ID).find(x=>x.TYPE==='contrat')||{}, E=base.EMPLOYE||{};
  const corps='<h1>AVENANT AU CONTRAT DE TRAVAIL</h1><div class="date">'+SG_BUREAU.ville.toUpperCase()+' – '+sgDateL(a.DATE).toUpperCase()+'</div><div class="sous">'+sgE(a.OBJET||'Vos nouvelles conditions salariales au '+sgDateL(a.EFFET))+'</div>'
   +'<p>'+(E.civ==='Madame'?'Chère':'Cher')+' '+sgE(E.prenom||(s?staffName(s):''))+',</p><p>'+sgE(a.TEXTE||'Tenant compte de votre engagement, ce dont je vous remercie, j’ai le plaisir de vous communiquer ci-après les nouvelles conditions salariales au '+sgDateL(a.EFFET)+', soit:')+'</p>'
   +(prev.SALAIRE&&a.SALAIRE?'<p>Salaire mensuel '+(new Date(a.EFFET+'T00:00').getFullYear()-1)+' : CHF '+sgChf(prev.SALAIRE)+'.- x '+(+prev.MOIS||12)+' mensualités</p>':'')
   +(a.SALAIRE?'<p><b>Nouveau salaire mensuel brut : CHF '+sgChf(a.SALAIRE)+'.- x '+(+(a.MOIS||prev.MOIS)||12)+' mensualités soit '+sgChf((+a.SALAIRE)*(+(a.MOIS||prev.MOIS)||12))+'.-/an.</b></p>':'')
   +(a.OCC&&+a.OCC!==+prev.OCC?'<p><b>Nouveau taux d’activité : '+num(+a.OCC,0)+'% soit '+num(SG_CCT.hsem*a.OCC/100,2)+' h par semaine.</b></p>':'')
   +(a.FONCTION&&a.FONCTION!==prev.FONCTION?'<p><b>Nouvelle fonction : '+sgE(a.FONCTION)+'.</b></p>':'')
   +'<p>Les autres conditions d’engagement du contrat de travail du '+sgDateL(base.DEBUT)+' restent valables.</p><p>Je vous remercie pour votre précieuse collaboration.</p><p style="margin-top:8mm">Fait en deux exemplaires à '+SG_BUREAU.ville+', le '+sgDateL(a.DATE)+'</p>'
   +'<div class="sign"><div>'+sgE(E.prenom)+' '+sgE(E.nom)+'</div><div>'+SG_BUREAU.nom+'<br>'+SG_BUREAU.signataire+'</div></div>';
  sgDocOuvrir('Avenant au contrat — '+(E.prenom||'')+' '+(E.nom||''),corps,'Avenant_'+(E.nom||'')+'_'+String(a.DATE||'').slice(0,10)+'.html'); }
function sgDocFin(f){ const s=DS.get('staff',f.STAFF_ID), base=sgCtrAll(f.STAFF_ID).find(x=>x.TYPE==='contrat')||{}, E=base.EMPLOYE||{}, D=sgDecompteSortie(s,f.FIN), parEmp=f.PAR==='employeur';
  const corps='<h1>FIN DES RAPPORTS DE TRAVAIL</h1><div class="date">'+SG_BUREAU.ville.toUpperCase()+' – '+sgDateL(f.DATE||today()).toUpperCase()+'</div><div class="sous">Confirmation de la fin du contrat de travail</div>'
   +'<div class="parties"><div><h2>L’EMPLOYEUR</h2><p>'+SG_BUREAU.nom+'<br>'+SG_BUREAU.rue.toLowerCase().replace(/(^|\s)\S/g,x=>x.toUpperCase())+'<br>1096 Cully</p></div><div><h2>'+(E.civ==='Madame'?'L’EMPLOYÉE':'L’EMPLOYÉ')+'</h2><p>'+sgE(E.civ)+' '+sgE(E.prenom)+' '+sgE(E.nom)+'<br>'+sgE(E.rue)+'<br>'+sgE(E.npa)+' '+sgE(E.localite)+'</p></div></div>'
   +'<p>'+(E.civ==='Madame'?'Madame':'Monsieur')+',</p>'
   +'<p>'+(f.PAR==='accord'?'D’un commun accord, les parties mettent fin au contrat de travail du '+sgDateL(base.DEBUT)+'.':parEmp?'Nous vous confirmons la résiliation de votre contrat de travail du '+sgDateL(base.DEBUT)+', notifiée le '+sgDateL(f.RECU)+'.':'Nous accusons réception de votre lettre de démission, reçue le '+sgDateL(f.RECU)+', concernant votre contrat de travail du '+sgDateL(base.DEBUT)+'.')+'</p>'
   +'<p>Compte tenu du délai de congé ('+sgE(f.DELAI||'')+', CCT des bureaux d’architectes et ingénieurs vaudois, art. 10), les rapports de travail prendront fin le <b>'+sgDateL(f.FIN)+'</b>.'+(f.DEPART&&f.DEPART<f.FIN?' Votre dernier jour de travail sera le <b>'+sgDateL(f.DEPART)+'</b>, le solde de vos vacances et heures supplémentaires étant compensé jusqu’à la fin du contrat.':'')+(parEmp&&f.MOTIF_ECO?' Le congé est donné pour des raisons économiques.':'')+'</p>'
   +(parEmp?'<p>Conformément à l’article 10 de la CCT, le temps libre nécessaire et justifié pour chercher un autre emploi vous sera accordé, sans retenue sur le salaire ni diminution du droit aux vacances.</p>':'')
   +'<p>Le décompte final des heures et des vacances est joint à la présente. Un certificat de travail vous sera remis à la fin des rapports de travail.</p><p>Nous vous remercions pour votre collaboration et vous adressons nos meilleurs vœux pour la suite.</p>'
   +'<p style="margin-top:8mm">Fait en deux exemplaires à '+SG_BUREAU.ville+', le '+sgDateL(f.DATE||today())+'</p><div class="sign"><div>'+SG_BUREAU.nom+'<br>'+SG_BUREAU.signataire+'</div><div>'+sgE(E.prenom)+' '+sgE(E.nom)+'<br>(pris connaissance)</div></div>'
   +'<div style="break-before:page"></div>'+sgDecompteHtml(s,f,D);
  sgDocOuvrir('Fin du contrat — '+(E.prenom||'')+' '+(E.nom||''),corps,'Fin_contrat_'+(E.nom||'')+'.html'); }
function sgDecompteHtml(s,f,D){ const l=(t,v,cl)=>'<tr'+(cl?' class="'+cl+'"':'')+'><td>'+t+'</td><td class="r">'+v+'</td></tr>', h2=v=>num(v,2)+' h';
  return '<h1 style="font-size:12pt">DÉCOMPTE DE SORTIE</h1><div class="date">'+sgE(staffName(s)).toUpperCase()+' — FIN DU CONTRAT LE '+sgDateL(f.FIN).toUpperCase()+'</div>'
    +'<table>'+l('Taux d’activité',num(D.occ*100,0)+' % ('+num(D.hj,2)+' h/jour)')+l('Vacances : report de l’année précédente',h2(D.report))+l('Vacances : droit '+D.fin.getFullYear()+' au prorata jusqu’à la fin du contrat',h2(D.vacAnnee))+l('Vacances prises en '+D.fin.getFullYear(),'− '+h2(D.pris))+l('Solde des vacances',h2(D.vacSolde),'tot')
    +l('Heures supplémentaires (report + solde de l’année, à ce jour)',h2(D.hsSolde),'tot')+l('Jours ouvrés restants jusqu’à la fin du contrat',num(D.jours,0)+' j ('+h2(D.heuresDispo)+')')+l('Heures à compenser (vacances + heures sup.)',h2(D.aCompenser)+' ≈ '+num(D.joursComp,1)+' j')
    +l('Dernier jour de travail conseillé',sgDateL(diso(D.dernier)))+l('Solde à payer avec le dernier salaire',D.aPayer?h2(D.aPayer)+' × CHF '+num(D.horaire,2)+' = CHF '+sgChf(D.aPayerCHF):'—','tot')
    +(D.negatif?l('Solde négatif (heures ou vacances en moins)',h2(D.negatif)):'')+'</table><p style="font-size:8pt;color:#706f6f">Salaire horaire selon la CCT (art. 25) : salaire annuel ÷ (heures hebdomadaires × 52,14). Les jours fériés vaudois et les week-ends ne sont pas des jours ouvrés. Décompte établi le '+sgDateL(today())+' avec les heures saisies à ce jour.</p>'; }

/* ── écran ── */
function sgCtrStatut(s){ const f=sgCtrFin(s.ID), c=sgCtrEnVigueur(s.ID,today()); if(f&&f.FIN&&f.FIN<today()) return ['Parti·e le '+dfr(f.FIN),'']; if(f&&f.FIN) return ['Préavis jusqu’au '+dfr(f.FIN),'urg']; if(c) return ['Sous contrat','s3']; return ['Sans contrat','']; }
function sgCtrDlg(type,s,x){ const old=x||{}, base=sgCtrAll(s?s.ID:null).find(y=>y.TYPE==='contrat')||{}, cur=s?sgCtrEnVigueur(s.ID,today())||base:{}, E=Object.assign({},base.EMPLOYE||{},old.EMPLOYE||{});
  if(type==='contrat'&&s&&!E.nom){ const c=DS.get('contact',s.PERSON_ID), o=c?DS.get('contactowner',c.CONTACTOWNER_ID):null, hc=DS.get('contact',s.HOMECONTACT_ID);
    Object.assign(E,{nom:o?o.NAME1:'',prenom:o?o.NAME2:'',naissance:sgNaissance(s)||'',rue:(hc&&hc.STREET)||'',npa:(hc&&hc.POSTALCODE)||'',localite:(hc&&hc.LOCATION)||''}); }
  const I=(k,v,o)=>h('input',Object.assign({class:'inp',value:v??'','data-k':k},o||{})), S=(k,opts,v)=>{ const e=h('select',{class:'inp','data-k':k}); opts.forEach(([a,b])=>e.append(h('option',{value:a,selected:String(a)===String(v)||null},b))); return e; };
  const rows=[], L=(t,e)=>rows.push([t,e]);
  if(type==='contrat'){ const cats=Object.entries(SG_GRILLE.cat).map(([k,c])=>[k,c.t]);
    if(!s){ L('Civilité',S('civ',[['Madame','Madame'],['Monsieur','Monsieur']],E.civ||'Madame')); L('Prénom',I('prenom',E.prenom)); L('Nom',I('nom',E.nom)); L('Initiales',I('ini','',{style:{width:'80px'}})); }
    else L('Civilité',S('civ',[['Madame','Madame'],['Monsieur','Monsieur']],E.civ||'Madame'));
    if(s){ L('Prénom',I('prenom',E.prenom)); L('Nom',I('nom',E.nom)); }
    L('Rue',I('rue',E.rue)); L('NPA / localité',h('div',{style:{display:'flex',gap:'6px'}},I('npa',E.npa,{style:{width:'90px'}}),I('localite',E.localite)));
    L('Date de naissance',I('naissance',E.naissance,{type:'date'})); L('État civil',I('etatcivil',E.etatcivil)); L('Lieu d’origine',I('origine',E.origine)); L('Téléphone',I('tel',E.tel));
    L(h('b',{},'Contrat du'),I('DATE',old.DATE||today(),{type:'date'})); L('Début (entrée)',I('DEBUT',old.DEBUT||(s&&s.JOININGDATE)||'',{type:'date'}));
    L('Durée',S('DUREE',[['indeterminee','indéterminée'],['determinee','déterminée']],old.DUREE||'indeterminee')); L('Fin prévue (si déterminée)',I('FIN_PREVUE',old.FIN_PREVUE,{type:'date'}));
    L('Fonction (« en qualité … »)',I('FONCTION',old.FONCTION||cur.FONCTION||'d’architecte Master HES')); L('Poste (« un poste … »)',I('POSTE',old.POSTE||cur.POSTE||'d’architecte'));
    L('Catégorie CCT',S('CATEGORIE',cats,old.CATEGORIE||cur.CATEGORIE||'master')); L('Niveau (grille '+SG_GRILLE.annee+')',S('NIVEAU',[],''));
    L('Taux d’activité %',I('OCC',old.OCC??cur.OCC??100,{type:'number',step:'5',min:'10',max:'100',style:{width:'90px'}})); L('Salaire mensuel brut CHF',I('SALAIRE',old.SALAIRE??cur.SALAIRE??'',{type:'number',step:'50',style:{width:'120px'}}));
    L('Mensualités',S('MOIS',[[12,'12'],[13,'13']],old.MOIS??cur.MOIS??13)); L('Temps d’essai (mois)',I('ESSAI',old.ESSAI??3,{type:'number',min:'0',max:'3',style:{width:'70px'}}));
    L('Assurances',h('div',{style:{display:'flex',gap:'6px'}},I('LAA',old.LAA||cur.LAA||'SUVA',{placeholder:'LAA'}),I('IJM',old.IJM||cur.IJM||'La Vaudoise',{placeholder:'IJM'}),I('LPP',old.LPP||cur.LPP||'Swisslife',{placeholder:'LPP'})));
    L('Indemnité km CHF',I('KM',old.KM||'0.70',{style:{width:'80px'}}));
    L('',h('label',{style:{textAlign:'left'}},h('input',{type:'checkbox','data-k':'VOITURE',checked:!!old.VOITURE||null}),' Voiture de fonction'));
    L('',h('label',{style:{textAlign:'left'}},h('input',{type:'checkbox','data-k':'COMMISSION',checked:old.COMMISSION==null?true:!!old.COMMISSION||null}),' Commission sur mandats apportés (conditions particulières)'));
    { const K=sgCommDe(Object.keys(SG_COMM_DEF).some(k=>old[k]!=null)?old:cur), N=(k,st,w)=>I(k,K[k],{type:'number',step:st,min:'0',style:{width:w}});   // paliers (Finances ▸ Apports de projets)
      L('Paliers de commission',h('div',{style:{display:'flex',flexWrap:'wrap',gap:'6px',alignItems:'center',fontSize:'12.5px'}},N('COMM_T1','0.5','62px'),'% sous CHF',N('COMM_S1','100000','112px'),'·',
        N('COMM_T2','0.5','62px'),'% jusqu’à CHF',N('COMM_S2','100000','112px'),'·',N('COMM_T3','0.5','62px'),'% au-delà (montant des travaux TTC)')); }
    L('Autres clauses',h('textarea',{class:'inp','data-k':'CLAUSES',rows:3},old.CLAUSES||'')); }
  if(type==='avenant'){ L('Avenant du',I('DATE',old.DATE||today(),{type:'date'})); L(h('b',{},'Prend effet le'),I('EFFET',old.EFFET||diso(new Date(new Date().getFullYear()+1,0,1)),{type:'date'}));
    L('Objet',I('OBJET',old.OBJET||'')); L('Salaire mensuel brut CHF',I('SALAIRE',old.SALAIRE??cur.SALAIRE??'',{type:'number',step:'50',style:{width:'120px'}})); L('Mensualités',S('MOIS',[[12,'12'],[13,'13']],old.MOIS??cur.MOIS??13));
    L('Taux d’activité %',I('OCC',old.OCC??cur.OCC??100,{type:'number',step:'5',min:'10',max:'100',style:{width:'90px'}})); L('Fonction',I('FONCTION',old.FONCTION||cur.FONCTION||''));
    L('Catégorie CCT',S('CATEGORIE',Object.entries(SG_GRILLE.cat).map(([k,c])=>[k,c.t]),old.CATEGORIE||cur.CATEGORIE||'master')); L('Niveau (grille '+SG_GRILLE.annee+')',S('NIVEAU',[],''));
    L('Texte (facultatif)',h('textarea',{class:'inp','data-k':'TEXTE',rows:3},old.TEXTE||'')); }
  if(type==='fin'){ L('Résiliation par',S('PAR',[['collaborateur','le collaborateur (démission)'],['employeur','l’employeur'],['accord','d’un commun accord']],old.PAR||'collaborateur'));
    L(h('b',{},'Reçue / notifiée le'),I('RECU',old.RECU||today(),{type:'date'})); L('Fin légale du contrat',h('b',{id:'sg-fin-calc'},'—')); L('Fin retenue',I('FIN',old.FIN||'',{type:'date'}));
    L('Dernier jour de travail',I('DEPART',old.DEPART||'',{type:'date'})); L('',h('label',{style:{textAlign:'left'}},h('input',{type:'checkbox','data-k':'MOTIF_ECO',checked:!!old.MOTIF_ECO||null}),' Raisons économiques (employeur)'));
    L('Lettre datée du',I('DATE',old.DATE||today(),{type:'date'})); L('Remarque',h('textarea',{class:'inp','data-k':'REMARQUE',rows:2},old.REMARQUE||'')); }
  const avert=h('div',{style:{gridColumn:'1 / -1',fontSize:'12.5px',minHeight:'18px'}});
  const body=h('div',{class:'form',style:{gridTemplateColumns:'max-content 1fr',minWidth:'560px',maxHeight:'70vh',overflow:'auto'}},...rows.flatMap(([t,e])=>[h('label',{},t),e]),avert);
  const get=k=>{ const e=body.querySelector('[data-k="'+k+'"]'); return e?(e.type==='checkbox'?(e.checked?1:0):e.value):undefined; };
  const majNiv=()=>{ const n=body.querySelector('[data-k="NIVEAU"]'), c=get('CATEGORIE'); if(!n) return; const v=n.value||old.NIVEAU||cur.NIVEAU; n.innerHTML='';
    ((SG_GRILLE.cat[c]||{}).n||[]).forEach(([k,t,m])=>n.append(h('option',{value:k,selected:k===v||null},t+' — min. CHF '+sgChf(m)+' (12 mois)'))); };
  const verif=()=>{ if(type==='fin'){ const deb=(base.DEBUT||(s&&s.JOININGDATE)||''), r=get('RECU'); if(deb&&r){ const p=sgPreavis(deb,r); body.querySelector('#sg-fin-calc').textContent=dfr(diso(p.fin))+' — '+p.delai;
        const F=body.querySelector('[data-k="FIN"]'); if(!F.value||F.dataset.auto) { F.value=diso(p.fin); F.dataset.auto=1; } body._delai=p.delai; } return; }
    const m=sgMinimum(get('CATEGORIE'),get('NIVEAU')), occ=(+get('OCC')||0)/100, an=(+get('SALAIRE')||0)*(+get('MOIS')||12);
    if(m&&an){ const min=m*12*occ; avert.innerHTML=an<min?'<span style="color:var(--s-rouge)">⚠ Salaire annuel CHF '+sgChf(an)+' inférieur au minimum CCT CHF '+sgChf(min)+' ('+num(occ*100,0)+' %, grille '+SG_GRILLE.annee+').</span>':'<span style="color:var(--s-vert)">✓ Conforme au salaire minimum CCT (CHF '+sgChf(min)+'/an à '+num(occ*100,0)+' %).</span>'; } };
  body.addEventListener('change',()=>{ majNiv(); verif(); }); body.addEventListener('input',e=>{ if(e.target.dataset.k==='FIN') delete e.target.dataset.auto; verif(); }); majNiv(); setTimeout(verif,0);
  const titre={contrat:x?'Modifier le contrat':'Nouveau contrat de travail',avenant:x?'Modifier l’avenant':'Nouvel avenant',fin:'Fin des rapports de travail'}[type]+(s?' — '+staffName(s):'');
  dialog({title:titre,body,buttons:[{t:'Annuler'},{t:'Enregistrer',pri:true,fn:async()=>{
    const v={...old,TYPE:type,STAFF_ID:s?s.ID:null}; body.querySelectorAll('[data-k]').forEach(e=>{ const k=e.dataset.k; if(['civ','prenom','nom','ini','rue','npa','localite','naissance','etatcivil','origine','tel'].includes(k)) return; v[k]=e.type==='checkbox'?(e.checked?1:0):e.type==='number'?(e.value===''?null:+e.value):(e.value||null); });
    if(type==='contrat'){ v.EMPLOYE={civ:get('civ'),prenom:get('prenom'),nom:get('nom'),rue:get('rue'),npa:get('npa'),localite:get('localite'),naissance:get('naissance')||null,etatcivil:get('etatcivil'),origine:get('origine'),tel:get('tel')};
      if(!v.DEBUT||!v.SALAIRE||!v.EMPLOYE.nom){ toast('Nom, date de début et salaire sont obligatoires.',true); return false; } }
    if(type==='avenant'&&!v.EFFET){ toast('Indiquez la date d’effet.',true); return false; }
    if(type==='fin'){ if(!v.RECU||!v.FIN){ toast('Indiquez la date de réception et la fin du contrat.',true); return false; } v.DELAI=body._delai||old.DELAI||''; if(!v.DEPART) v.DEPART=null; }
    const ops=[]; let sid=s?s.ID:null;
    if(type==='contrat'&&!s){ const day=today(), [oid]=DS.newIds('contactowner'), [cid,hid]=DS.newIds('contact',2), [nsid]=DS.newIds('staff'), co=DS.all('staff').map(x=>DS.get('contact',x.COMPANYCONTACT_ID)).find(Boolean);
      const n1=v.EMPLOYE.nom, n2=v.EMPLOYE.prenom, base0={ADDRESSTYPECODE:0,LANGUAGECODE:2,ISHIDDEN:0,CREATED:day};
      ops.push({t:'contactowner',id:oid,val:{ID:oid,TYPECODE:1,NAME1:n1,NAME2:n2,FORMOFADDRESS:null,ISHIDDEN:0,CREATED:day,BIRTHDAY:v.EMPLOYE.naissance||null}},
        {t:'contact',id:cid,val:{ID:cid,CONTACTOWNER_ID:oid,CONTACTRELATION_ID:co?co.CONTACTOWNER_ID:null,...base0,NAME1:co?co.NAME1:SG_BUREAU.nom,NAME2:n2+' '+n1}},
        {t:'contact',id:hid,val:{ID:hid,CONTACTOWNER_ID:oid,CONTACTRELATION_ID:null,...base0,NAME1:n1,NAME2:n2,STREET:v.EMPLOYE.rue||null,POSTALCODE:v.EMPLOYE.npa||null,LOCATION:v.EMPLOYE.localite||null,PHONE1:v.EMPLOYE.tel||null}},
        {t:'staff',id:nsid,val:{ID:nsid,PERSON_ID:cid,COMPANYCONTACT_ID:co?co.ID:null,HOMECONTACT_ID:hid,INITIALS:get('ini')||null,JOININGDATE:v.DEBUT,QUITTINGDATE:null,ISACTIVE:1,ISINTERNAL:1,ISTIMELOGFROZEN:0,HOLIDAYS:0,HOLIDAYBALANCE:0,SORTORDER:DS.all('staff').length}});
      sid=nsid; v.STAFF_ID=nsid; }
    if(!v.ID) v.ID=type+':'+sid+':'+Date.now().toString(36);
    ops.push({t:'sgcontrattravail',id:v.ID,val:v});
    const st=DS.get('staff',sid);
    if(st&&type==='contrat'&&v.DEBUT&&(!st.JOININGDATE||v.DEBUT<String(st.JOININGDATE).slice(0,10))) ops.push({t:'staff',id:sid,val:{...st,JOININGDATE:v.DEBUT}});
    if(st&&type==='fin') ops.push({t:'staff',id:sid,val:{...st,QUITTINGDATE:v.FIN}});
    if(type==='contrat'&&v.EMPLOYE.naissance&&st){ const c=DS.get('contact',st.PERSON_ID), o=c&&DS.get('contactowner',c.CONTACTOWNER_ID); if(o&&o.BIRTHDAY!==v.EMPLOYE.naissance) ops.push({t:'contactowner',id:o.ID,val:{...o,BIRTHDAY:v.EMPLOYE.naissance}}); }
    await DS.commit(ops); toast({contrat:'Contrat enregistré.',avenant:'Avenant enregistré.',fin:'Fin des rapports de travail enregistrée.'}[type]); go('nx-contrats-travail'); }}]}); }
VIEWS['nx-contrats-travail']={ async render(m){ await DS.need(['sgcontrattravail']); const tous=nxLS.get('sg3_ctr_tous',false), auj=today();
    const L=DS.all('staff').filter(s=>tous||+s.ISACTIVE||sgCtrAll(s.ID).length).sort((a,b)=>cmp(staffName(a),staffName(b)));
    const ligne=(s,i)=>{ const c=sgCtrEnVigueur(s.ID,auj), f=sgCtrFin(s.ID), [st,cl]=sgCtrStatut(s), docs=sgCtrAll(s.ID), m=c&&sgMinimum(c.CATEGORIE,c.NIVEAU), sousMin=m&&c&&(+c.SALAIRE*(+c.MOIS||12))<m*12*(+c.OCC||100)/100;
      return '<tr><td><b>'+nxE(staffName(s))+'</b><br><span style="font-size:11.5px;color:var(--s-gris)">'+(s.JOININGDATE?'entrée '+dfr(String(s.JOININGDATE).slice(0,10)):'')+(f&&f.FIN?' · fin '+dfr(f.FIN):'')+'</span></td>'
        +'<td>'+(c?nxE(c.FONCTION||'')+'<br><span style="font-size:11.5px;color:var(--s-gris)">'+nxE(((SG_GRILLE.cat[c.CATEGORIE]||{}).t)||'')+'</span>':'—')+'</td><td class="r">'+(c?num(+c.OCC,0)+' %':'—')+'</td>'
        +'<td class="r">'+(c?'CHF '+sgChf(c.SALAIRE)+' × '+(+c.MOIS||12)+'<br><span style="font-size:11.5px;color:var(--s-gris)">'+sgChf(c.SALAIRE*(+c.MOIS||12))+'/an</span>':'—')+(sousMin?'<br><span class="nx-tag urg">sous le minimum CCT</span>':'')+'</td>'
        +'<td><span class="nx-tag '+cl+'">'+st+'</span></td>'
        +'<td>'+docs.map((d,j)=>'<div style="white-space:nowrap;font-size:12px">'+({contrat:'Contrat',avenant:'Avenant',fin:'Fin'}[d.TYPE])+' '+dfr(d.EFFET||d.DEBUT||d.FIN||d.DATE)+' <a data-fn="p'+i+'_'+j+'" style="cursor:pointer;text-decoration:underline">document</a> · <a data-fn="e'+i+'_'+j+'" style="cursor:pointer;text-decoration:underline">modifier</a></div>').join('')+'</td>'
        +'<td style="white-space:nowrap">'+(c||!docs.length?'':'')+(!docs.some(d=>d.TYPE==='contrat')?'<button class="nx-btn pri" data-fn="c'+i+'">Contrat</button> ':'<button class="nx-btn" data-fn="a'+i+'">Avenant</button> ')
        +(docs.some(d=>d.TYPE==='contrat')&&!f?'<button class="nx-btn" data-fn="f'+i+'">Fin</button> ':'')+(f?'<button class="nx-btn" data-fn="d'+i+'">Décompte</button>':'')+'</td></tr>'; };
    const pg=nxPage(m,'<div class="sg-split">'+sgIntro('Ressources humaines','Contrats de travail','Engagements, avenants annuels et fins de contrat, au modèle du bureau et selon la CCT des bureaux d’architectes et ingénieurs vaudois. Le contrat en vigueur alimente le coût de revient et les heures dues.',
        '<div class="sg-figs"><div class="sg-fig"><div class="n">'+L.filter(s=>sgCtrEnVigueur(s.ID,auj)).length+'</div><div class="t">sous contrat</div></div><div class="sg-fig"><div class="n">'+L.filter(s=>{ const f=sgCtrFin(s.ID); return f&&f.FIN>=auj; }).length+'</div><div class="t">en préavis</div></div></div>'
        +'<div class="acts"><button class="nx-btn pri" data-fn="nouveau">'+nxSvg('plus')+'Nouvel engagement</button><button class="nx-btn" data-fn="tous">'+nxSvg('filter')+(tous?'Collaborateurs actuels':'Inclure les anciens')+'</button><button class="nx-btn" data-fn="grille">'+nxSvg('analyse')+'Salaires minimaux CCT</button></div>')
      +'<div>'+nxCard('c12','Collaborateurs','<div class="b flush" style="overflow:auto"><table class="nx-tbl"><tr><th>Collaborateur</th><th>Fonction</th><th class="r">Taux</th><th class="r">Salaire</th><th>Statut</th><th>Documents</th><th></th></tr>'+L.map(ligne).join('')+'</table></div>')+'</div></div>');
    pg._fn.nouveau=()=>sgCtrDlg('contrat',null,null); pg._fn.tous=()=>{ nxLS.set('sg3_ctr_tous',!tous); go('nx-contrats-travail'); };
    pg._fn.grille=()=>dialog({title:'Salaires minimaux CCT — '+SG_GRILLE.source,body:h('div',{style:{maxWidth:'640px'},html:Object.values(SG_GRILLE.cat).map(c=>'<p style="margin:10px 0 4px"><b>'+nxE(c.t)+'</b></p><table class="nx-tbl">'+c.n.map(n=>'<tr><td>'+nxE(n[1])+'</td><td class="r">CHF '+sgChf(n[2])+' / mois (×12)</td></tr>').join('')+'</table>').join('')+'<p style="font-size:12px;color:var(--s-gris)">Salaires mensuels minimaux bruts à 100 % (42,5 h/sem.), payables 12 fois ; au prorata du taux d’activité. Apprentis : dès le 01.08.2026.</p>'})});
    L.forEach((s,i)=>{ const docs=sgCtrAll(s.ID); pg._fn['c'+i]=()=>sgCtrDlg('contrat',s,null); pg._fn['a'+i]=()=>sgCtrDlg('avenant',s,null); pg._fn['f'+i]=()=>sgCtrDlg('fin',s,null);
      pg._fn['d'+i]=()=>{ const f=sgCtrFin(s.ID), D=sgDecompteSortie(s,f.FIN); sgDocOuvrir('Décompte de sortie — '+staffName(s),sgDecompteHtml(s,f,D),'Decompte_sortie_'+staffName(s)+'.html'); };
      docs.forEach((d,j)=>{ pg._fn['p'+i+'_'+j]=()=>d.TYPE==='contrat'?sgDocContrat(d):d.TYPE==='avenant'?sgDocAvenant(d):sgDocFin(d); pg._fn['e'+i+'_'+j]=()=>sgCtrDlg(d.TYPE,s,d); }); }); } };
SG_VUE_DROIT['nx-contrats-travail']=()=>sgDroit('equipe','taux')&&sgDroit('reglages','oui');
/* collaborateurs partis : inactifs après la fin du contrat (administrateur, au démarrage) */
{ const t=setInterval(()=>{ if(NX.booted&&DS.info){ clearInterval(t); sgAccPret().then(()=>setTimeout(async()=>{ if(!sgAdmin()) return; try{ await DS.need(['sgcontrattravail']);
      const ops=DS.all('staff').filter(s=>+s.ISACTIVE&&s.QUITTINGDATE&&String(s.QUITTINGDATE).slice(0,10)<today()&&sgCtrFin(s.ID)).map(s=>({t:'staff',id:s.ID,val:{...s,ISACTIVE:0}}));
      if(ops.length) await DS.commit(ops); }catch(e){ console.error(e); } },6000)); } },1000); }

/* salaire, mois, taux : saisis dans le contrat de travail → lecture seule dans le coût de revient et les heures dues */
{ const r0=VIEWS['nx-coutrevient'].render; VIEWS['nx-coutrevient'].render=function(m){ r0.apply(this,arguments);
    staffList().forEach(s=>{ if(!sgCtrEnVigueur(s.ID,today())) return; ['SALAIRE','MOIS','OCC'].forEach(k=>{ const e=m.querySelector('[data-s="'+s.ID+'"][data-k="'+k+'"]'); if(e){ e.disabled=true; e.title='Selon le contrat de travail (Ressources humaines ▸ Contrats de travail)'; } }); }); }; }
{ const r0=VIEWS['nx-cct'].render; VIEWS['nx-cct'].render=function(m){ r0.apply(this,arguments);
    staffList().forEach(s=>{ if(!sgCtrEnVigueur(s.ID,today())) return; const e=m.querySelector('[data-occ="'+s.ID+'"]'); if(e){ e.disabled=true; e.title='Selon le contrat de travail (avenants compris)'; } }); }; }

/* ═══ 15. RESSOURCES HUMAINES — OCCUPATION ET EFFECTIF (07.10.2026) ═════════════════════════════════════════════════
   Domaine « Ressources humaines » (sg3.js, SG_DOM « rh ») : occupation et effectif, contrats de travail, heures dues et vacances,
   bouclement annuel, coût de revient, planification RH (moteur), suivi RH. Réservé à l'administrateur (droits « équipe : taux » et
   « réglages ») et protégé par le code d'accès (« rh » ajouté aux domaines protégés, aussi aux réglages existants).
   Occupation et effectif : taux d'occupation de chacun mois par mois (contrat et avenants en vigueur au 15 du mois, borné aux dates
   d'engagement ; fiche du coût de revient à défaut de contrat), effectif et équivalents plein temps (ETP) ; charge du mois : heures dues
   (CCT), saisies, disponibles et attribuées (planification RH) ; échéances RH : fin du temps d'essai, fin d'un contrat à durée
   déterminée, fin des rapports de travail et départ, année des 50 ans (6 semaines de vacances), sans contrat, avenant de l'année,
   salaire sous le minimum CCT. */
/* dates d'engagement : fiche (entrée / sortie), sinon contrats (premier début ; fin, ou fin prévue d'un contrat à durée déterminée) */
function sgEngagement(s){ const L=sgCtrAll(s.ID), cs=L.filter(x=>x.TYPE==='contrat'&&x.DEBUT).sort((a,b)=>cmp(a.DEBUT,b.DEBUT)), f=L.find(x=>x.TYPE==='fin')||null, der=cs[cs.length-1]||null;
  const deb=(s.JOININGDATE?String(s.JOININGDATE).slice(0,10):'')||(cs[0]&&cs[0].DEBUT)||null;
  const fin=(s.QUITTINGDATE?String(s.QUITTINGDATE).slice(0,10):'')||(f&&f.FIN)||(der&&der.DUREE==='determinee'&&!f&&der.FIN_PREVUE)||null;
  return {deb,fin,dernier:der,finRec:f}; }
const sgEngageAu=(s,k)=>{ const g=sgEngagement(s); return (!g.deb||g.deb<=k)&&(g.fin?g.fin>=k:+s.ISACTIVE===1); };
/* taux d'occupation (%) des 12 mois de l'année : null hors engagement ; ancien membre sans date de sortie : ignoré */
function sgOccMois(s,y){ const g=sgEngagement(s), M=[];
  for(let m=0;m<12;m++){ const a=diso(new Date(y,m,1)), b=diso(new Date(y,m+1,0));
    if((g.deb&&g.deb>b)||(g.fin&&g.fin<a)||(!g.fin&&!+s.ISACTIVE)){ M.push(null); continue; }
    let r=y+'-'+String(m+1).padStart(2,'0')+'-15'; if(g.deb&&r<g.deb) r=g.deb; if(g.fin&&r>g.fin) r=g.fin;
    M.push(Math.round(sgOccAu(s,r)*1000)/10); }
  return {g,M}; }
/* échéances RH : 30 jours en arrière, 120 jours en avant (et les rappels de l'année) */
function sgRhEcheances(){ const auj=today(), t0=new Date(auj+'T00:00'), y=t0.getFullYear(), E=[];
  const dep=diso(new Date(y,t0.getMonth(),t0.getDate()-30)), lim=diso(new Date(y,t0.getMonth(),t0.getDate()+120)), dans=d=>d&&d>=dep&&d<=lim;
  const add=(d,s,t,cl,v)=>E.push({d,s,t,cl:cl||'',v:v||'nx-contrats-travail'});
  DS.all('staff').forEach(s=>{ const g=sgEngagement(s), actif=sgEngageAu(s,auj); if(!actif&&!dans(g.fin)) return;
    const der=g.dernier, f=g.finRec;
    if(der&&der.DEBUT){ const d0=new Date(der.DEBUT+'T00:00'), n=der.ESSAI==null||der.ESSAI===''?3:+der.ESSAI;
      if(n>0){ const fe=diso(new Date(d0.getFullYear(),d0.getMonth()+n,d0.getDate()-1)); if(dans(fe)) add(fe,s,'Fin du temps d’essai ('+n+' mois) : évaluation du travail','s3'); } }
    if(der&&der.DUREE==='determinee'&&der.FIN_PREVUE&&!f&&dans(der.FIN_PREVUE)) add(der.FIN_PREVUE,s,'Fin du contrat à durée déterminée : prolonger, engager ou laisser finir','urg');
    if(f&&dans(f.FIN)) add(f.FIN,s,'Fin des rapports de travail'+(f.RECU?' (congé reçu le '+dfr(f.RECU)+')':'')+' : décompte de sortie','urg');
    if(f&&f.DEPART&&f.DEPART!==f.FIN&&dans(f.DEPART)) add(f.DEPART,s,'Départ effectif : dernier jour de travail','s3');
    if(!actif) return;
    if(!sgCtrAll(s.ID).some(x=>x.TYPE==='contrat')) add(auj,s,'Aucun contrat de travail enregistré','urg');
    else { const cv=sgCtrEnVigueur(s.ID,auj);
      if(cv){ const eff=(cv._avenant&&cv._avenant.EFFET)||cv.DEBUT; if(eff<y+'-01-01'&&!f) add(y+'-01-01',s,'Avenant '+y+' à établir (conditions du '+dfr(eff)+')');
        const mn=sgMinimum(cv.CATEGORIE,cv.NIVEAU); if(mn&&(+cv.SALAIRE*(+cv.MOIS||12))<mn*12*(+cv.OCC||100)/100) add(auj,s,'Salaire sous le minimum CCT '+SG_GRILLE.annee+' (CHF '+sgChf(mn)+' × 12 à 100 %)','urg'); } }
    const nais=sgNaissance(s), a50=nais?+String(nais).slice(0,4)+50:0;
    if(a50===y||a50===y+1) add(a50+'-01-01',s,'Année des 50 ans : 6 semaines de vacances dès le 1er janvier '+a50,'','nx-cct'); });
  return E.sort((a,b)=>cmp(a.d,b.d)||cmp(staffName(a.s),staffName(b.s))); }
/* chiffres de la vue d'ensemble « Ressources humaines » */
async function sgRhChiffres(f){ await DS.need(['sgcontrattravail']); const auj=today(), A=DS.all('staff').filter(s=>sgEngageAu(s,auj));
  return [f(A.length,'collaborateurs'),f(num(A.reduce((a,s)=>a+sgOccAu(s,auj),0),2),'équivalents plein temps'),f(A.filter(s=>sgCtrEnVigueur(s.ID,auj)).length,'sous contrat'),
    f(sgRhEcheances().filter(e=>e.d>=auj).length,'échéances à venir')]; }
VIEWS['nx-occupation']={ async render(m){ await DS.need(['sgcontrattravail','sgcoutrevient']);
    const now=new Date(), auj=today(), y=+nxLS.get('sg3_occ_an',now.getFullYear()), mo=Math.max(0,Math.min(11,+nxLS.get('sg3_occ_mois',now.getMonth())));
    const R=DS.all('staff').map(s=>({s,...sgOccMois(s,y)})).filter(r=>r.M.some(v=>v!=null)).sort((a,b)=>cmp(a.s.SORTORDER,b.s.SORTORDER)||cmp(staffName(a.s),staffName(b.s)));
    const eff=Array(12).fill(0), etp=Array(12).fill(0); R.forEach(r=>r.M.forEach((v,i)=>{ if(v!=null){ eff[i]++; etp[i]+=v/100; } }));
    const MC=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'], pc=v=>num(v,v%1?1:0);
    const cel=(v,p)=>v==null?'<td class="r" style="color:var(--s-gris3)">—</td>':'<td class="r"'+(p!=null&&p!==v?' style="background:var(--s-jaune2)" title="Changement de taux"':'')+'>'+pc(v)+'</td>';
    const moy=M=>{ const L=M.filter(v=>v!=null); return L.length?L.reduce((a,b)=>a+b,0)/L.length:null; };
    const tabOcc='<table class="nx-tbl" id="sg-occ-t"><tr><th>Collaborateur</th><th>Entrée</th><th>Sortie</th>'+MC.map(x=>'<th class="r">'+x+'</th>').join('')+'<th class="r">Moyenne</th></tr>'
      +R.map(r=>{ const mm=moy(r.M); return '<tr><td><b>'+nxE(staffName(r.s))+'</b></td><td style="white-space:nowrap">'+(r.g.deb?dfr(r.g.deb):'')+'</td><td style="white-space:nowrap">'+(r.g.fin?dfr(r.g.fin):'')+'</td>'
        +r.M.map((v,i)=>cel(v,i?r.M[i-1]:null)).join('')+'<td class="r"><b>'+(mm==null?'':num(mm,1))+'</b></td></tr>'; }).join('')
      +'<tr class="tot"><td>Effectif</td><td></td><td></td>'+eff.map(v=>'<td class="r">'+v+'</td>').join('')+'<td></td></tr>'
      +'<tr class="tot"><td>Équivalents plein temps</td><td></td><td></td>'+etp.map(v=>'<td class="r">'+num(v,2)+'</td>').join('')+'<td class="r">'+num(etp.reduce((a,b)=>a+b,0)/12,2)+'</td></tr></table>';
    const C=R.filter(r=>r.M[mo]!=null).map(r=>{ const s=r.s, du=(sgCctAnnee(s,y).mois||[])[mo]||0, sa=DS.by('timelog','STAFF_ID',s.ID).filter(t=>+t.TIMEYEAR===y&&+t.TIMEMONTH===mo).reduce((a,t)=>a+(+t.TIMEPERIOD||0),0);
      const spt=typeof plSptOf==='function'?plSptOf(s.ID,y,mo):null, di=spt?plN(spt.TIMEBUDGET):null, at=spt?sptAttribue(spt):null; return {s,occ:r.M[mo],du,sa,di,at}; });
    const sg=v=>(v>0.05?'+':'')+nxH(v), tot=k=>C.reduce((a,c)=>a+(+c[k]||0),0), encours=y===now.getFullYear()&&mo===now.getMonth();
    const tabCh='<table class="nx-tbl"><tr><th>Collaborateur</th><th class="r">Taux</th><th class="r">Heures dues</th><th class="r">Saisies'+(encours?' à ce jour':'')+'</th><th class="r">Écart</th><th class="r">Disponibles (planif.)</th><th class="r">Attribuées</th><th>Charge planifiée</th></tr>'
      +C.map(c=>{ const ec=c.sa-c.du, ch=c.di?c.at/c.di:null;
        return '<tr><td><b>'+nxE(staffName(c.s))+'</b></td><td class="r">'+pc(c.occ)+' %</td><td class="r">'+nxH(c.du)+'</td><td class="r">'+nxH(c.sa)+'</td>'
          +'<td class="r" style="color:'+(encours?'inherit':ec<-0.05?'var(--s-rouge)':ec>0.05?'var(--s-vert)':'inherit')+'">'+sg(ec)+'</td><td class="r">'+(c.di==null?'—':nxH(c.di))+'</td><td class="r">'+(c.at==null?'—':nxH(c.at))+'</td>'
          +'<td style="width:160px;white-space:nowrap">'+(ch==null?'<span style="color:var(--s-gris)">non planifié</span>':sgBarre(Math.min(1,ch),ch>1?'var(--s-rouge)':ch>0.9?'var(--s-orange)':'var(--s-nuit)')+' '+Math.round(ch*100)+' %')+'</td></tr>'; }).join('')
      +'<tr class="tot"><td>Total</td><td></td><td class="r">'+nxH(tot('du'))+'</td><td class="r">'+nxH(tot('sa'))+'</td><td class="r">'+sg(tot('sa')-tot('du'))+'</td><td class="r">'+nxH(tot('di'))+'</td><td class="r">'+nxH(tot('at'))+'</td><td></td></tr></table>';
    const E=sgRhEcheances(), tabE=E.length?'<table class="nx-tbl"><tr><th>Date</th><th>Collaborateur</th><th>Échéance</th><th></th></tr>'
      +E.map(e=>'<tr><td style="white-space:nowrap">'+dfr(e.d)+(e.d<auj?' <span class="nx-tag">passée</span>':'')+'</td><td><b>'+nxE(staffName(e.s))+'</b></td><td>'+(e.cl?'<span class="nx-tag '+e.cl+'">'+nxE(e.t)+'</span>':nxE(e.t))+'</td><td style="text-align:right"><button class="nx-btn" data-go="'+e.v+'">Ouvrir</button></td></tr>').join('')+'</table>'
      :'<div class="nx-empty">Aucune échéance dans les 120 prochains jours.</div>';
    const A=DS.all('staff').filter(s=>sgEngageAu(s,auj)), etpA=A.reduce((a,s)=>a+sgOccAu(s,auj),0), an=k=>DS.all('staff').filter(s=>{ const d=sgEngagement(s)[k]; return d&&d.slice(0,4)===String(y); }).length;
    const pg=nxPage(m,'<div class="sg-split">'+sgIntro('Ressources humaines','Occupation et effectif','Taux d’occupation de chaque collaborateur mois par mois, selon le contrat de travail et ses avenants (au 15 du mois) ; effectif, équivalents plein temps, charge de travail du mois et échéances RH.',
        '<div class="sg-figs"><div class="sg-fig"><div class="n">'+A.length+'</div><div class="t">collaborateurs aujourd’hui</div></div><div class="sg-fig"><div class="n">'+num(etpA,2)+'</div><div class="t">équivalents plein temps</div></div>'
        +'<div class="sg-fig"><div class="n">'+an('deb')+' / '+an('fin')+'</div><div class="t">arrivées / départs '+y+'</div></div></div>'
        +'<div class="acts"><button class="nx-btn" data-fn="prev">'+nxSvg('prev')+(y-1)+'</button><button class="nx-btn" data-fn="next">'+(y+1)+nxSvg('next')+'</button><button class="nx-btn" data-fn="csv">'+nxSvg('export')+'Exporter (CSV)</button><button class="nx-btn" data-go="nx-contrats-travail">'+nxSvg('contrat')+'Contrats de travail</button></div>')
      +'<div><div class="nx-grid">'+nxCard('c12','Taux d’occupation '+y+' (%)','<div class="b flush" style="overflow:auto">'+(R.length?tabOcc:'<div class="nx-empty">Aucun collaborateur engagé en '+y+'.</div>')+'</div>')
      +nxCard('c12','Charge de travail — '+SG_MOIS_L[mo]+' '+y,'<div class="b flush" style="overflow:auto">'+(C.length?tabCh:'<div class="nx-empty">Personne n’est engagé ce mois-là.</div>')+'</div>',
        '<select class="inp" data-mois style="margin-left:auto;font-size:12px;font-weight:400;width:auto">'+SG_MOIS_L.map((x,i)=>'<option value="'+i+'"'+(i===mo?' selected':'')+'>'+x+'</option>').join('')+'</select>')
      +nxCard('c12','Échéances RH — 30 derniers jours et 120 prochains','<div class="b flush" style="overflow:auto">'+tabE+'</div>')+'</div></div></div>');
    pg._fn.prev=()=>{ nxLS.set('sg3_occ_an',y-1); go('nx-occupation'); }; pg._fn.next=()=>{ nxLS.set('sg3_occ_an',y+1); go('nx-occupation'); };
    pg._fn.csv=()=>{ const t=m.querySelector('#sg-occ-t'); if(t) sgCsvTable(t,'occupation_'+y+'.csv'); else toast('Rien à exporter.',true); };
    const se=m.querySelector('[data-mois]'); if(se) se.onchange=()=>{ nxLS.set('sg3_occ_mois',+se.value); go('nx-occupation'); }; } };
SG_VUE_DROIT['nx-occupation']=()=>sgDroit('equipe','taux')&&sgDroit('reglages','oui');

/* ═══ 16. FRANÇAIS SEULEMENT (07.10.2026) ═══════════════════════════════════════════════════════════════════════════
   La base ne garde que le français (moteur : frSeulOps / frSeul) : libellés allemands, italiens et anglais, modèles, documents types,
   gabarits et catalogues étrangers ; un texte sans version française est traduit (19.10.2026 : textes, noms et arrière-plans des modèles). Fait d'office
   pour l'administrateur au démarrage dès qu'il reste une autre langue (après une reprise Deltaproject, par ex.), sans confirmation depuis le
   19.10.2026, et dans Réglages ▸ Données & sauvegarde ; base sauvegardée juste avant (sinon rien n'est modifié). Marque « sg_meta/francais » {DATE, N}. */
const SG_FR={enCours:false};
const SG_FR_LIB=[['libelles','libellé : allemand, italien et anglais retirés','libellés : allemand, italien et anglais retirés'],['modeles','modèle réduit au français','modèles réduits au français'],
  ['documents','document type en langue étrangère supprimé','documents types en langue étrangère supprimés'],['gabarits','gabarit en langue étrangère supprimé','gabarits en langue étrangère supprimés'],
  ['catalogues','catalogue en langue étrangère supprimé','catalogues en langue étrangère supprimés'],['positions','position de ces catalogues supprimée','positions de ces catalogues supprimées'],
  ['catTraduits','catalogue sans version française traduit provisoirement','catalogues sans version française traduits provisoirement'],
  ['posTraduites','position traduite provisoirement','positions traduites provisoirement'],['langues','compte ou adresse passé en français','comptes et adresses passés en français'],
  ['textes','texte corrigé ou traduit','textes corrigés ou traduits'],['traces','libellé d’origine renommé','libellés d’origine renommés'],
  ['textesModeles','texte allemand des modèles traduit','textes allemands des modèles traduits'],['nomsModeles','modèle nommé en français','modèles nommés en français'],
  ['fonds','arrière-plan allemand ou italien renommé ou supprimé','arrière-plans allemands ou italiens renommés ou supprimés']];   // 19.10.2026
/* comptes et fonctions : droit Deltaproject « gestion des utilisateurs » exigé par le serveur (CH08_ADMIN_T) ; sans lui, laissés tels quels */
const SG_FR_ADM_T=['appuser','appuser_appcompanyrole','appuser_staff','appcompanyrole','appcompanyrole_approle','approle'];
const sgFrPeutAdm=()=>!(typeof dsEstBureau==='function'&&dsEstBureau())||typeof ch08aCan!=='function'||ch08aCan('userAdmin');   // base locale : aucune règle du serveur
/* reste-t-il des libellés étrangers (après une reprise Deltaproject, par ex.) ? tables déjà chargées seulement */
const sgFrReste=()=>Object.entries(DS.T).some(([t,T])=>!HEAVY.includes(t)&&(sgFrPeutAdm()||!SG_FR_ADM_T.includes(t))&&Object.values(T).some(v=>v&&typeof v==='object'&&('NAMEGE' in v||'NAMEIT' in v||'NAMEEN' in v)))
  ||DS.all('catalog').some(c=>c.LANGUAGECODE!=null&&+c.LANGUAGECODE!==2)
  ||['catalog','projectcatalog'].some(t=>DS.all(t).some(c=>/^e[C]CC-/.test(c.NAME||'')))||DS.all('defaultpath').some(x=>/^DELTA /.test(x.NAMEFR||''))||DS.all('formtemplategroup').some(x=>/^DELTA /.test(x.NAMEFR||''))
  ||(typeof frFondEtranger==='function'&&Object.keys(DS.T.arriereplan||{}).some(k=>DS.T.arriereplan[k]&&frFondEtranger(k)))   // arrière-plans allemands ou italiens (19.10.2026)
  ||(typeof frModeleLibelle==='function'&&DS.all('modele').some(m=>!(m.libelle&&String(m.libelle.fr||'').trim())&&frModeleLibelle(m)));   // modèles sans nom français
const sgFrResume=n=>SG_FR_LIB.filter(([k])=>n&&n[k]).map(([k,t1,t2])=>'• '+num(n[k],0)+' '+(+n[k]===1?t1:t2)).join('\n');
/* sauvegarde avant une opération de masse : base du bureau → copie immédiate sur le serveur (« avant_<motif>_<date>.sqlite ») ;
   base locale → sauvegarde habituelle (serveur de sauvegarde du Mac, dossier choisi, sinon téléchargement) */
async function sgSauverAvant(motif){ if(!(typeof dsEstBureau==='function'&&dsEstBureau())) return sgSauver(true);
  try{ const r=await fetch('/api/sauvegarder',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({motif})}), d=await r.json().catch(()=>({}));
    if(r.ok&&d.ok){ toast('Base sauvegardée sur le serveur du bureau : '+d.nom+'.'); return true; }
    sgAlert(r.status===404?'Le serveur du bureau doit d’abord être mis à jour (nas/preparer.sh, puis redémarrer le conteneur) : la sauvegarde immédiate n’existe pas encore.':'Sauvegarde refusée par le serveur : '+(d.error||d.msg||r.status)+'.'); return false; }
  catch(e){ console.error(e); return false; } }
async function sgFrSeul(mode){ if(!sgAdmin()||SG_FR.enCours) return; SG_FR.enCours=true; let R;
  let saut=0;
  try{ await DS.need(['sg_meta']); R=await frSeulOps(); if(!sgFrPeutAdm()){ const sk=R.ops.filter(o=>SG_FR_ADM_T.includes(o.t)); R.ops=R.ops.filter(o=>!SG_FR_ADM_T.includes(o.t)); saut=sk.length;
      sk.forEach(o=>{ const k=o.t==='appuser'?'langues':'libelles'; if(R.n[k]) R.n[k]--; }); }   // bilan : seulement ce qui est modifié
    else R.ops.sort((a,b)=>SG_FR_ADM_T.includes(a.t)-SG_FR_ADM_T.includes(b.t)); }   // comptes et fonctions en dernier
  catch(e){ console.error(e); if(mode==='manuel') toast('✗ '+(e.message||e),true); SG_FR.enCours=false; return; }
  SG_FR.enCours=false;
  if(!R.ops.length){ if(!DS.get('sg_meta','francais')) await DS.commit([{t:'sg_meta',id:'francais',val:{ID:'francais',DATE:today(),N:{}}}]).catch(e=>console.error(e));
    if(mode==='manuel'){ toast('La base ne contient que le français.'); go('nx-data'); } return; }
  /* 19.10.2026 : plus de fenêtre de confirmation (demande de Paulo) — au démarrage comme depuis Réglages, la base est sauvegardée puis
     remise en français ; bilan dans un message et dans Réglages ▸ Données & sauvegarde */
  if(SG_FR.enCours) return; SG_FR.enCours=true;
  try{ if(!(await sgSauverAvant('francais'))){ toast('✗ Français seulement : sauvegarde impossible, rien n’a été modifié.',true); return; }
    toast('Français seulement : mise à jour de '+num(R.ops.length,0)+' enregistrements…'); await frSeul(R.ops);
    const N0=(DS.get('sg_meta','francais')||{}).N||{}, N={}; SG_FR_LIB.forEach(([k])=>{ N[k]=(+N0[k]||0)+(+R.n[k]||0); });   // bilan cumulé des passages
    await DS.commit([{t:'sg_meta',id:'francais',val:{ID:'francais',DATE:today(),N}}]);
    toast('La base ne contient plus que le français ('+num(R.ops.length,0)+' enregistrements mis à jour'+(saut?' ; '+num(saut,0)+' des comptes et fonctions laissés tels quels, droit « gestion des utilisateurs » requis':'')+').');
    if(VIEW&&VIEW.id==='nx-data') go('nx-data'); }
  catch(e){ console.error(e); toast('✗ Français seulement interrompu : '+(e.message||e),true); }
  finally{ SG_FR.enCours=false; } }
{ const t=setInterval(()=>{ if(NX.booted&&DS.info){ clearInterval(t); sgAccPret().then(()=>setTimeout(async()=>{ if(!sgAdmin()) return;
      try{ await DS.need(['sg_meta']); if(!DS.get('sg_meta','francais')||sgFrReste()) sgFrSeul('auto'); }catch(e){ console.error(e); } },9000)); } },1000); }
/* Réglages ▸ Données & sauvegarde : état « français seulement » */
{ const r0=VIEWS['nx-data'].render; VIEWS['nx-data'].render=function(m){ r0.apply(this,arguments); const g=m.querySelector('.nx-grid'); if(!g||!sgAdmin()) return;
    const mk=DS.get('sg_meta','francais'), N=mk&&mk.N||{}, res=sgFrResume(N);
    g.insertAdjacentHTML('beforeend',nxCard('c6','Français seulement','<div class="b"><p style="margin:0 0 14px;font-weight:300">'+(mk?'Base nettoyée (dernier passage le '+nxE(dfr(mk.DATE))+')'+(res?' :<br>'+nxE(res).replace(/\n/g,'<br>'):' (rien à retirer).'):'La base contient encore des libellés, modèles ou catalogues en allemand, en italien ou en anglais.')+'</p>'
      +'<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="nx-btn'+(mk?'':' pri')+'" data-fr="1">'+nxSvg('search')+(mk?'Vérifier et nettoyer à nouveau':'Ne garder que le français')+'</button></div></div>'));
    const b=g.querySelector('[data-fr]'); if(b) b.onclick=()=>sgFrSeul('manuel'); }; }


/* ═══ 17. APPORTS DE PROJETS (08.10.2026) ══════════════════════════════════════════════════════════════════════════
   Finances ▸ Apports de projets (administrateur ; collection « sgapport », réservée sur le NAS comme les salaires) :
   « apport » {STAFF_ID, PROJECT_ID, DATE, TRAVAUX (montant des travaux TTC saisi ; vide = selon les contrats d'honoraires),
   TAUX (taux convenu % ; vide = selon les paliers du contrat de travail), FINAL (décompte final établi le), REMARQUE} ;
   « versement » {STAFF_ID, PROJECT_ID (facultatif : vide = acompte sur l'ensemble), DATE, MONTANT, REMARQUE}.
   Clause du contrat de travail (conditions particulières) : commission de x % du montant HT des honoraires facturés, versée au
   décompte final une fois tous les honoraires encaissés, valable aussi après le départ ; x selon le montant des travaux TTC
   (paliers du contrat : COMM_T1 % sous COMM_S1, COMM_T2 % jusqu'à COMM_S2, COMM_T3 % au-delà ; modèle 3 / 4 / 5 %, 2 et 8 mio).
   Honoraires facturés (HT, hors frais, acomptes déduits) et encaissés : contrats Facturation reliés au projet (sgRenta).
   Montant des travaux : CFC 1, 2, 4, 5 et 9 du calcul d'honoraires (inclus + non inclus, TTC), par contrat et partie d'ouvrage.
   Acquise = facturé HT × taux ; exigible au décompte final (date saisie) ou quand tout est facturé (ou l'affaire terminée) et
   encaissé ; solde = acquise − versé. Évolution : cumuls mois par mois (factures datées, versements). */
const SG_COMM_DEF={COMM_T1:3,COMM_S1:2000000,COMM_T2:4,COMM_S2:8000000,COMM_T3:5};
const sgCommDe=c=>{ const r={}; Object.keys(SG_COMM_DEF).forEach(k=>{ r[k]=c&&c[k]!=null&&c[k]!==''?+c[k]:SG_COMM_DEF[k]; }); return r; };
const sgNum=v=>{ const n=+String(v??'').replace(/[’'\s]/g,'').replace(',','.'); return isFinite(n)?n:0; };
/* montant des travaux TTC de contrats Facturation : coût de construction complet du calcul d'honoraires */
function sgTravauxTTC(cs){ const K=['ch_cfc1','ch_cfc2','ch_cfc4','ch_cfc5','ch_cfc9'], sd=d=>{ const i=(d&&d.inputs)||{}; return K.reduce((s,k)=>s+sgNum(i[k]),0); };
  return (cs||[]).reduce((s,c)=>s+(Array.isArray(c.ouvrages)&&c.ouvrages.length?c.ouvrages.reduce((t,o)=>t+(sd(o.detail)||sgNum(o.cfcTot)),0):sd(c.detail)),0); }
/* conditions de commission : contrat de travail en vigueur à la date de l'apport, sinon le plus récent ; sans contrat : le modèle */
function sgCommCond(sid,d){ const L=sgCtrAll(sid).filter(x=>x.TYPE==='contrat'&&x.DEBUT).sort((a,b)=>cmp(b.DEBUT,a.DEBUT)), k=d||today(), c=L.find(x=>x.DEBUT<=k)||L[0]||null;
  return Object.assign(sgCommDe(c),{actif:!c||c.COMMISSION==null||!!+c.COMMISSION,src:c?'contrat de travail du '+dfr(c.DATE||c.DEBUT):'modèle du contrat de travail — aucun contrat enregistré pour ce collaborateur'}); }
const sgCommTaux=(C,trav)=>!C.actif?0:trav<C.COMM_S1?C.COMM_T1:trav<=C.COMM_S2?C.COMM_T2:C.COMM_T3;
const sgPcT=v=>num(+v||0,(+v||0)%1?1:0);
/* texte du contrat : « 3 », « 2 000 000.00 » (comme le modèle du bureau) */
const sgDocPc=(c,k)=>String(sgCommDe(c)[k]), sgDocMt=(c,k)=>Math.round(sgCommDe(c)[k]).toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ')+'.00';
const sgCommTexte=C=>C.actif?sgPcT(C.COMM_T1)+' % sous CHF '+nxCHF(C.COMM_S1)+' · '+sgPcT(C.COMM_T2)+' % jusqu’à CHF '+nxCHF(C.COMM_S2)+' · '+sgPcT(C.COMM_T3)+' % au-delà (montant des travaux TTC)':'aucune commission prévue au contrat de travail';
const sgApports=()=>DS.all('sgapport').filter(x=>x.TYPE==='apport');
const sgVersements=sid=>DS.all('sgapport').filter(x=>x.TYPE==='versement'&&(sid==null||String(x.STAFF_ID)===String(sid))).sort((a,b)=>cmp(a.DATE,b.DATE));
function sgApportCalc(a,D,taux){ const p=DS.get('project',a.PROJECT_ID), R=p?sgRenta(p,D,taux):null, C=sgCommCond(a.STAFF_ID,a.DATE);
  const travAuto=R?sgTravauxTTC(R.cs):0, travSaisi=a.TRAVAUX!=null&&a.TRAVAUX!=='', trav=travSaisi?+a.TRAVAUX:travAuto;
  const tauxSaisi=a.TAUX!=null&&a.TAUX!=='', t=tauxSaisi?+a.TAUX:sgCommTaux(C,trav);
  const fHT=R?R.factHT:0, contratHT=R?R.contratHT:0, acquise=fHT*t/100, prevue=Math.max(contratHT,fHT)*t/100;
  const verse=sgVersements(a.STAFF_ID).filter(v=>String(v.PROJECT_ID)===String(a.PROJECT_ID)).reduce((s,v)=>s+(+v.MONTANT||0),0);
  const ouvertes=R?R.fs.filter(fxUnpaid).length:0, toutFacture=contratHT>0&&fHT>=contratHT*0.995, termine=!!(R&&R.cs.length&&R.cs.every(c=>c.termine));
  const exigible=!!a.FINAL||!!(R&&R.fs.length&&!ouvertes&&(toutFacture||termine)), solde=acquise-verse;
  const statut=!exigible?['En cours','']:solde>0.5?['À verser','urg']:['Soldé','s2'];
  return {a,p,R,C,trav,travAuto,travSaisi,t,tauxSaisi,fHT,contratHT,encTTC:R?R.encTTC:0,acquise,prevue,verse,solde,exigible,ouvertes,statut}; }
/* par collaborateur : apports, versements (y compris ceux sans projet), soldes */
function sgApportsParStaff(X){ const som=(L,f)=>L.reduce((t,x)=>t+(+f(x)||0),0), ids=[...new Set([...X.map(x=>String(x.a.STAFF_ID)),...sgVersements().map(v=>String(v.STAFF_ID))])];
  return ids.map(id=>{ const s=DS.get('staff',id), xs=X.filter(x=>String(x.a.STAFF_ID)===id), vs=sgVersements(id), acq=som(xs,x=>x.acquise), ver=som(vs,v=>v.MONTANT);
    return {id,s,xs,vs,acq,ver,solde:acq-ver,exi:Math.min(Math.max(0,acq-ver),som(xs.filter(x=>x.exigible),x=>Math.max(0,x.solde))),prev:som(xs,x=>x.prevue),fHT:som(xs,x=>x.fHT)}; })
    .sort((a,b)=>cmp(staffName(a.s),staffName(b.s))); }
/* cumuls mois par mois : commission acquise (factures datées × taux du projet) et versements */
function sgApportSerie(X,vs){ const ev=[];
  X.forEach(x=>{ if(!x.R) return; const tva=f=>(+((x.R.cs.find(c=>c.id===f.contrat_id)||{}).tva)||8.1)/100;
    x.R.fs.forEach(f=>{ const d=String(f.date||'').slice(0,10); if(/^\d{4}-\d{2}/.test(d)) ev.push([d,((+f._ttc||+f.ttc||0)/(1+tva(f)))*x.t/100,0]); }); });
  (vs||[]).forEach(v=>{ if(v.DATE) ev.push([String(v.DATE).slice(0,10),0,+v.MONTANT||0]); });
  if(!ev.length) return [];
  ev.sort((a,b)=>cmp(a[0],b[0])); const fin=today().slice(0,7), M=[]; let a=0,v=0,i=0,y=+ev[0][0].slice(0,4),mo=+ev[0][0].slice(5,7)-1;
  while(M.length<600){ const k=y+'-'+String(mo+1).padStart(2,'0'); let da=0,dv=0;
    while(i<ev.length&&ev[i][0].slice(0,7)<=k){ da+=ev[i][1]; dv+=ev[i][2]; i++; }
    a+=da; v+=dv; M.push({k,a,v,da,dv}); if(k>=fin&&i>=ev.length) break; if(++mo>11){ mo=0; y++; } }
  return M; }
/* courbe en CHF : commission acquise et versements cumulés, solde à verser entre les deux */
function sgCourbeCHF(M){ if(!M.length) return '<div class="nx-empty">Pas encore de facturation ni de versement.</div>';
  const W=680,H=200,pl=70,pr=10,pb=24,pt=12,n=M.length, max=Math.max(1,...M.map(x=>Math.max(x.a,x.v)));
  const st0=max/4, p10=Math.pow(10,Math.floor(Math.log10(st0))), step=[1,2,2.5,5,10].map(x=>x*p10).find(x=>x>=st0)||p10*10, nice=step*4;
  const X=i=>pl+(n===1?(W-pl-pr)/2:i*(W-pl-pr)/(n-1)), Y=v=>pt+(H-pt-pb)*(1-v/nice), mm=k=>k.slice(5,7)+'.'+k.slice(2,4);
  let s='<svg class="nx-chart" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" style="height:'+H+'px">';
  for(let i=0;i<=4;i++){ const v=nice*i/4, yy=Y(v); s+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+yy+'" y2="'+yy+'" stroke="'+(i?'#ececea':'#1d1d1b')+'" stroke-width="'+(i?1:1.5)+'"/><text x="'+(pl-6)+'" y="'+(yy+3.5)+'" text-anchor="end">'+sgChf(v)+'</text>'; }
  const pa=M.map((x,i)=>X(i).toFixed(1)+','+Y(x.a).toFixed(1)), pv=M.map((x,i)=>X(i).toFixed(1)+','+Y(x.v).toFixed(1));
  s+='<polygon points="'+pa.concat(pv.slice().reverse()).join(' ')+'" fill="#fef6b0" opacity=".9"/>';
  s+='<polyline points="'+pv.join(' ')+'" fill="none" stroke="#98c21f" stroke-width="2"/><polyline points="'+pa.join(' ')+'" fill="none" stroke="#003346" stroke-width="2"/>';
  const pas=Math.max(1,Math.ceil(n/9)); M.forEach((x,i)=>{ if(i===n-1||(i%pas===0&&n-1-i>=pas*0.7)) s+='<text x="'+X(i).toFixed(1)+'" y="'+(H-6)+'" text-anchor="middle">'+mm(x.k)+'</text>'; });   // pas de chevauchement à droite
  M.forEach((x,i)=>{ if(!x.da&&!x.dv&&i!==n-1) return; s+='<circle cx="'+X(i).toFixed(1)+'" cy="'+Y(x.a).toFixed(1)+'" r="2.4" fill="#003346"><title>'+nxE(mm(x.k)+' — acquise CHF '+sgChf(x.a)+' · versé CHF '+sgChf(x.v)+' · solde CHF '+sgChf(x.a-x.v))+'</title></circle>'; });
  const pt_=(c,t,hh)=>'<span style="display:inline-flex;align-items:center;gap:6px"><i style="display:inline-block;width:16px;height:'+hh+'px;background:'+c+'"></i>'+t+'</span>';
  return s+'</svg><div style="display:flex;gap:18px;flex-wrap:wrap;font-size:12px;margin-top:6px">'+pt_('#003346','Commission acquise (cumul)',3)+pt_('#98c21f','Versé (cumul)',3)+pt_('#fef6b0','Solde à verser',10)+'</div>'; }
VIEWS['nx-apports']={ render(m){ const pg0=nxPage(m,'<div class="nx-empty">Calcul des apports…</div>');
  Promise.all([DS.need(['sgapport','sgcontrattravail']),fxEnsure().catch(()=>null)]).then(()=>{ if(!VIEW||VIEW.id!=='nx-apports') return;
    const D=fxData(), taux=sgTaux(), X=sgApports().map(a=>sgApportCalc(a,D,taux)), S=sgApportsParStaff(X), sel=String(nxLS.get('sg3_apport_staff','')||'');
    const cur=S.find(x=>x.id===sel)||null, XS=cur?cur.xs:X, VS=cur?cur.vs:sgVersements(), som=(L,f)=>L.reduce((t,x)=>t+(+f(x)||0),0);
    const T={acq:som(S,x=>x.acq),ver:som(S,x=>x.ver),exi:som(S,x=>x.exi),prev:som(S,x=>x.prev),fHT:som(S,x=>x.fHT)}, M=sgApportSerie(XS,VS), ans={};
    M.forEach(x=>{ const y=x.k.slice(0,4), r=ans[y]||(ans[y]={y,da:0,dv:0,sol:0}); r.da+=x.da; r.dv+=x.dv; r.sol=x.a-x.v; });
    const nomS=sid=>staffName(DS.get('staff',sid))||'#'+sid, projet=p=>p?'<span class="nx-tag num">'+nxE(p.NUMBER||'')+'</span> '+nxE((p.TITLE||'').slice(0,40)):'<i>projet supprimé</i>';
    const tabS=S.length?'<table class="nx-tbl sg-apports"><tr><th>Collaborateur</th><th class="r">Projets</th><th class="r">Facturé HT</th><th class="r">Commission acquise</th><th class="r">Versé</th><th class="r">Solde</th><th class="r">dont exigible</th><th class="r">Prévue (contrats entiers)</th></tr>'
      +S.map(x=>'<tr class="'+(x.id===sel?'sel':'')+'" data-fn="s_'+x.id+'" title="'+(x.id===sel?'Afficher tous les collaborateurs':'Afficher le détail')+'" style="cursor:pointer"><td><b>'+nxE(staffName(x.s)||'#'+x.id)+'</b>'+(x.s&&!+x.s.ISACTIVE?' <span class="nx-tag s4">ancien</span>':'')+'</td><td class="r">'+x.xs.length+'</td><td class="r">'+nxCHF(x.fHT)+'</td><td class="r">'+nxCHF(x.acq)+'</td><td class="r">'+nxCHF(x.ver)+'</td><td class="r"><b>'+nxCHF(x.solde)+'</b></td><td class="r">'+(x.exi>0.5?'<span class="nx-tag urg">'+nxCHF(x.exi)+'</span>':'—')+'</td><td class="r">'+nxCHF(x.prev)+'</td></tr>').join('')
      +'<tr class="tot"><td>Total</td><td class="r">'+X.length+'</td><td class="r">'+nxCHF(T.fHT)+'</td><td class="r">'+nxCHF(T.acq)+'</td><td class="r">'+nxCHF(T.ver)+'</td><td class="r">'+nxCHF(T.acq-T.ver)+'</td><td class="r">'+nxCHF(T.exi)+'</td><td class="r">'+nxCHF(T.prev)+'</td></tr></table>'
      :'<div class="nx-empty">Aucun apport enregistré. « Nouvel apport » : choisissez le collaborateur et le projet qu’il a apporté.</div>';
    const tabA=XS.length?'<table class="nx-tbl"><tr><th>Projet</th>'+(cur?'':'<th>Collaborateur</th>')+'<th>Apporté le</th><th class="r">Travaux TTC</th><th class="r">Taux</th><th class="r">Honoraires HT</th><th>Facturé HT</th><th class="r">Encaissé TTC</th><th class="r">Acquise</th><th class="r">Versé</th><th class="r">Solde</th><th>Statut</th><th></th></tr>'
      +XS.map(x=>{ const i=x.a.ID, f=x.contratHT?x.fHT/x.contratHT:null;
        return '<tr><td'+(x.p?' data-ref="p:'+x.p.ID+'" style="cursor:pointer"':'')+'>'+projet(x.p)+'</td>'+(cur?'':'<td>'+nxE(nomS(x.a.STAFF_ID))+'</td>')
          +'<td style="white-space:nowrap">'+(x.a.DATE?dfr(x.a.DATE):'—')+(x.a.FINAL?'<br><small>décompte final '+dfr(x.a.FINAL)+'</small>':'')+'</td>'
          +'<td class="r" title="'+(x.travSaisi?'Montant saisi':'Selon les contrats d’honoraires (CFC 1, 2, 4, 5 et 9, TTC)')+'">'+(x.trav?nxCHF(x.trav):'<span style="color:var(--s-orange)">à saisir</span>')+(x.travSaisi?' <small>saisi</small>':'')+'</td>'
          +'<td class="r" title="'+nxE(x.tauxSaisi?'Taux convenu pour ce projet':sgCommTexte(x.C)+' — selon le '+x.C.src)+'">'+sgPcT(x.t)+' %'+(x.tauxSaisi?' <small>convenu</small>':'')+'</td>'
          +'<td class="r">'+(x.contratHT?nxCHF(x.contratHT):'—')+'</td>'
          +'<td style="white-space:nowrap">'+nxCHF(x.fHT)+(f!=null?' '+sgBarre(Math.min(1,f))+' '+sgPct(f):'')+'</td>'
          +'<td class="r">'+nxCHF(x.encTTC)+(x.ouvertes?'<br><small style="color:var(--s-orange)">'+x.ouvertes+' facture'+(x.ouvertes>1?'s':'')+' ouverte'+(x.ouvertes>1?'s':'')+'</small>':'')+'</td>'
          +'<td class="r">'+nxCHF(x.acquise)+'</td><td class="r">'+nxCHF(x.verse)+'</td><td class="r"><b>'+nxCHF(x.solde)+'</b></td>'
          +'<td><span class="nx-tag '+x.statut[1]+'">'+x.statut[0]+'</span></td>'
          +'<td style="white-space:nowrap;text-align:right"><button class="nx-btn" data-fn="v_'+i+'">Versement</button> <button class="nx-btn" data-fn="e_'+i+'">Modifier</button></td></tr>'; }).join('')+'</table>'
      :'<div class="nx-empty">Aucun projet apporté'+(cur?' par '+nxE(staffName(cur.s)):'')+'.</div>';
    const tabV=VS.length?'<table class="nx-tbl"><tr><th>Versé le</th>'+(cur?'':'<th>Collaborateur</th>')+'<th>Projet</th><th class="r">Montant</th><th>Remarque</th><th></th></tr>'
      +VS.slice().reverse().map(v=>{ const p=DS.get('project',v.PROJECT_ID); return '<tr><td style="white-space:nowrap">'+dfr(v.DATE)+'</td>'+(cur?'':'<td>'+nxE(nomS(v.STAFF_ID))+'</td>')
        +'<td>'+(p?projet(p):'<span style="color:var(--s-gris)">acompte sur l’ensemble</span>')+'</td><td class="r">'+nxCHF(v.MONTANT)+'</td><td>'+nxE(v.REMARQUE||'')+'</td><td style="text-align:right"><button class="nx-btn" data-fn="w_'+v.ID+'">Modifier</button></td></tr>'; }).join('')
      +'<tr class="tot"><td>Total</td>'+(cur?'':'<td></td>')+'<td></td><td class="r">'+nxCHF(som(VS,v=>v.MONTANT))+'</td><td></td><td></td></tr></table>'
      :'<div class="nx-empty">Aucun versement enregistré.</div>';
    const Y=Object.values(ans).sort((a,b)=>cmp(b.y,a.y)), tabY=Y.length?'<table class="nx-tbl"><tr><th>Année</th><th class="r">Commission acquise</th><th class="r">Versé</th><th class="r">Solde à verser en fin d’année</th></tr>'
      +Y.map(r=>'<tr><td>'+r.y+'</td><td class="r">'+nxCHF(r.da)+'</td><td class="r">'+nxCHF(r.dv)+'</td><td class="r"><b>'+nxCHF(r.sol)+'</b></td></tr>').join('')+'</table>':'';
    const titreSel=cur?staffName(cur.s):'tous les collaborateurs', C0=cur?sgCommCond(cur.id):null;
    const html='<div class="sg-split">'+sgIntro('Finances','Apports de projets','Commission des collaborateurs sur les mandats qu’ils apportent au bureau (contrat de travail, conditions particulières) : un pourcentage des honoraires facturés HT, selon le montant des travaux, versé au décompte final une fois tous les honoraires encaissés.',
        '<div class="sg-figs"><div class="sg-fig"><div class="n">'+nxCHF(T.acq)+'</div><div class="t">commission acquise (CHF)</div></div><div class="sg-fig"><div class="n">'+nxCHF(T.ver)+'</div><div class="t">versé (CHF)</div></div>'
        +'<div class="sg-fig"><div class="n">'+nxCHF(T.acq-T.ver)+'</div><div class="t">solde à verser (CHF)</div></div><div class="sg-fig"><div class="n">'+nxCHF(T.exi)+'</div><div class="t">dont exigible (CHF)</div></div></div>'
        +'<div class="acts"><button class="nx-btn pri" data-fn="nouveau">'+nxSvg('plus')+'Nouvel apport</button><button class="nx-btn" data-fn="versement">'+nxSvg('plus')+'Nouveau versement</button>'
        +(cur?'<button class="nx-btn" data-fn="tous">'+nxSvg('users')+'Tous les collaborateurs</button>':'')+'<button class="nx-btn" data-fn="csv">'+nxSvg('export')+'Exporter (CSV)</button></div>')
      +'<div><div class="nx-grid">'+nxCard('c12','Par collaborateur','<div class="b flush" style="overflow:auto">'+tabS+'</div>')
      +(C0?nxCard('c12','Conditions — '+nxE(titreSel),'<div class="b"><p style="margin:0;font-size:13.5px">'+nxE(sgCommTexte(C0))+'</p><p style="margin:6px 0 0;font-size:12px;color:var(--s-gris);font-weight:300">Selon le '+nxE(C0.src)+' (Ressources humaines ▸ Contrats de travail). Le taux de chaque projet suit le montant des travaux TTC ; un taux convenu peut être saisi par projet. Commission versée au décompte final, une fois tous les honoraires encaissés ; due aussi après le départ du collaborateur.</p></div>'):'')
      +nxCard('c12','Projets apportés — '+nxE(titreSel),'<div class="b flush" style="overflow:auto">'+tabA+'</div>')
      +nxCard('c12','Évolution du montant à verser — '+nxE(titreSel),'<div class="b">'+sgCourbeCHF(M)+(tabY?'<div style="margin-top:14px;overflow:auto">'+tabY+'</div>':'')+'</div>')
      +nxCard('c12','Versements — '+nxE(titreSel),'<div class="b flush" style="overflow:auto">'+tabV+'</div>')+'</div></div></div>';
    pg0.querySelector('.nx-wrap').innerHTML=html;
    Object.assign(pg0._fn,{nouveau:()=>sgApportDlg(null,cur?cur.id:null),versement:()=>sgVersementDlg(null,cur?cur.id:null,null,null),tous:()=>{ nxLS.set('sg3_apport_staff',''); go('nx-apports'); },
      csv:()=>{ const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"', r0=n=>Math.round(+n||0), rows=[['Collaborateur','Projet','Titre','Apporté le','Décompte final','Travaux TTC','Taux %','Honoraires HT','Facturé HT','Encaissé TTC','Commission prévue','Commission acquise','Versé','Solde','Statut']]
        .concat(XS.map(x=>[nomS(x.a.STAFF_ID),x.p?x.p.NUMBER:'',x.p?x.p.TITLE:'',x.a.DATE||'',x.a.FINAL||'',r0(x.trav),x.t,r0(x.contratHT),r0(x.fHT),r0(x.encTTC),r0(x.prevue),r0(x.acquise),r0(x.verse),r0(x.solde),x.statut[0]]),
          [[]],[['Versements']],[['Versé le','Collaborateur','Projet','Montant','Remarque']],VS.map(v=>[v.DATE||'',nomS(v.STAFF_ID),(DS.get('project',v.PROJECT_ID)||{}).NUMBER||'',v.MONTANT,v.REMARQUE||'']));
        const a=h('a',{href:URL.createObjectURL(new Blob(['﻿'+rows.map(r=>r.map(q).join(';')).join('\n')],{type:'text/csv'})),download:'apports_'+sgHorodatage()+'.csv'}); document.body.append(a); a.click(); setTimeout(()=>a.remove(),1000); }});
    S.forEach(x=>{ pg0._fn['s_'+x.id]=()=>{ nxLS.set('sg3_apport_staff',x.id===sel?'':x.id); go('nx-apports'); }; });
    XS.forEach(x=>{ pg0._fn['e_'+x.a.ID]=()=>sgApportDlg(x.a); pg0._fn['v_'+x.a.ID]=()=>sgVersementDlg(null,x.a.STAFF_ID,x.a.PROJECT_ID,x.exigible?x.solde:null); });
    VS.forEach(v=>{ pg0._fn['w_'+v.ID]=()=>sgVersementDlg(v); });
  }).catch(e=>{ console.error(e); const w=m.querySelector('.nx-wrap'); if(w) w.innerHTML='<div class="nx-empty">✗ '+nxE(e.message||e)+'</div>'; }); },
  refresh(ts){ if(hit(ts,'sgapport','sgcontrattravail','project')) go('nx-apports'); } };
SG_VUE_DROIT['nx-apports']=()=>sgDroit('equipe','taux')&&sgDroit('reglages','oui');
/* liste des collaborateurs (actuels d'abord, anciens ensuite : la commission reste due après le départ) */
function sgStaffSelect(k,v){ const e=h('select',{class:'inp','data-k':k}); e.append(h('option',{value:''},'— choisir —'));
  DS.all('staff').slice().sort((a,b)=>(+b.ISACTIVE-+a.ISACTIVE)||cmp(staffName(a),staffName(b))).forEach(s=>e.append(h('option',{value:s.ID,selected:String(s.ID)===String(v??'')||null},staffName(s)+(+s.ISACTIVE?'':' (ancien)'))));
  return e; }
function sgApportDlg(a,sid){ const old=a||{}, I=(k,v,o)=>h('input',Object.assign({class:'inp',value:v??'','data-k':k},o||{}));
  const pr=h('select',{class:'inp','data-k':'PROJECT_ID'}); pr.append(h('option',{value:''},'— choisir le projet —'));
  DS.all('project').filter(p=>!sgInterne(p)).sort((x,y)=>cmp(y.NUMBER,x.NUMBER)).forEach(p=>pr.append(h('option',{value:p.ID,selected:String(p.ID)===String(old.PROJECT_ID??'')||null},(p.NUMBER||'')+' — '+(p.TITLE||''))));
  const info=h('div',{style:{gridColumn:'1 / -1',fontSize:'12.5px',lineHeight:'1.5',minHeight:'54px',fontWeight:300}});
  const body=h('div',{class:'form',style:{gridTemplateColumns:'max-content 1fr',minWidth:'560px',maxWidth:'720px'}},
    h('label',{},h('b',{},'Collaborateur')),sgStaffSelect('STAFF_ID',old.STAFF_ID??sid),h('label',{},h('b',{},'Projet apporté')),pr,
    h('label',{},'Apporté le'),I('DATE',old.DATE||today(),{type:'date'}),
    h('label',{},'Montant des travaux TTC'),I('TRAVAUX',old.TRAVAUX,{type:'number',step:'1000',min:'0',placeholder:'selon les contrats d’honoraires',style:{width:'220px'}}),
    h('label',{},'Taux convenu %'),I('TAUX',old.TAUX,{type:'number',step:'0.5',min:'0',max:'20',placeholder:'selon le contrat',style:{width:'140px'}}),
    h('label',{},'Décompte final établi le'),I('FINAL',old.FINAL,{type:'date'}),
    h('label',{},'Remarque'),h('textarea',{class:'inp','data-k':'REMARQUE',rows:2},old.REMARQUE||''),info);
  const get=k=>{ const e=body.querySelector('[data-k="'+k+'"]'); return e?e.value:''; };
  const maj=()=>{ const s=get('STAFF_ID'), p=DS.get('project',get('PROJECT_ID')); if(!s){ info.textContent='Choisissez le collaborateur : ses conditions de commission viennent de son contrat de travail.'; return; }
    const C=sgCommCond(s,get('DATE')), L=['Conditions : '+sgCommTexte(C)+' — selon le '+C.src+'.'].map(nxE);
    if(p){ const R=sgRenta(p,fxData()), ta=sgTravauxTTC(R.cs), trav=get('TRAVAUX')!==''?+get('TRAVAUX'):ta, t=get('TAUX')!==''?+get('TAUX'):sgCommTaux(C,trav), dbl=sgApports().filter(x=>String(x.PROJECT_ID)===String(p.ID)&&String(x.ID)!==String(old.ID));
      L.push(R.cs.length?nxE('Contrats d’honoraires reliés : '+R.cs.length+' · honoraires CHF '+sgChf(R.contratHT)+' HT · facturé CHF '+sgChf(R.factHT)+' HT'+(ta?' · travaux CHF '+sgChf(ta)+' TTC selon le calcul d’honoraires':' · montant des travaux absent du calcul d’honoraires : à saisir ci-dessus')+'.')
        :'<span style="color:var(--s-orange)">Aucun contrat Facturation relié à ce projet : honoraires et facturé à zéro (Réglages ▸ Réunir les registres).</span>');
      L.push('<b>Taux appliqué : '+sgPcT(t)+' %</b> — commission prévue CHF '+sgChf(Math.max(R.contratHT,R.factHT)*t/100)+', acquise à ce jour CHF '+sgChf(R.factHT*t/100)+'.');
      if(dbl.length) L.push('<span style="color:var(--s-orange)">⚠ Projet déjà enregistré comme apport de '+nxE(dbl.map(x=>staffName(DS.get('staff',x.STAFF_ID))).join(', '))+'.</span>'); }
    info.innerHTML=L.join('<br>'); };
  body.addEventListener('change',maj); body.addEventListener('input',maj); setTimeout(maj,0);
  const bt=[{t:'Annuler'},{t:'Enregistrer',pri:true,fn:async()=>{
    const v={...old,TYPE:'apport',STAFF_ID:+get('STAFF_ID')||null,PROJECT_ID:+get('PROJECT_ID')||null,DATE:get('DATE')||null,TRAVAUX:get('TRAVAUX')===''?null:+get('TRAVAUX'),
      TAUX:get('TAUX')===''?null:+get('TAUX'),FINAL:get('FINAL')||null,REMARQUE:get('REMARQUE').trim()||null};
    if(!v.STAFF_ID||!v.PROJECT_ID){ toast('Choisissez le collaborateur et le projet.',true); return false; }
    if(sgApports().some(x=>String(x.ID)!==String(v.ID)&&String(x.STAFF_ID)===String(v.STAFF_ID)&&String(x.PROJECT_ID)===String(v.PROJECT_ID))){ toast('Ce projet est déjà enregistré pour ce collaborateur.',true); return false; }
    if(v.ID==null) v.ID=DS.newIds('sgapport')[0];
    nxLS.set('sg3_apport_staff',String(v.STAFF_ID)); await DS.commit([{t:'sgapport',id:v.ID,val:v}]); toast('Apport enregistré.'); }}];
  if(a) bt.unshift({t:'Supprimer',fn:()=>{ sgConfirm('Supprimer l’apport de ce projet ?\n\nLes versements déjà enregistrés sont gardés.',async()=>{ await DS.commit([{t:'sgapport',id:a.ID,val:null}]); toast('Apport supprimé.'); }); }});
  dialog({title:a?'Modifier l’apport — '+staffName(DS.get('staff',a.STAFF_ID)):'Nouvel apport de projet',body,buttons:bt}); }
function sgVersementDlg(v,sid,pid,suggestion){ const old=v||{}, I=(k,val,o)=>h('input',Object.assign({class:'inp',value:val??'','data-k':k},o||{})), st=sgStaffSelect('STAFF_ID',old.STAFF_ID??sid);
  const pr=h('select',{class:'inp','data-k':'PROJECT_ID'}), majP=()=>{ const c=pr.value||String(old.PROJECT_ID??pid??''); pr.innerHTML=''; pr.append(h('option',{value:''},'— acompte sur l’ensemble des apports —'));
    sgApports().filter(a=>String(a.STAFF_ID)===String(st.value)).forEach(a=>{ const p=DS.get('project',a.PROJECT_ID); if(p) pr.append(h('option',{value:p.ID,selected:String(p.ID)===c||null},(p.NUMBER||'')+' — '+(p.TITLE||''))); }); };
  st.addEventListener('change',majP); majP();
  const body=h('div',{class:'form',style:{gridTemplateColumns:'max-content 1fr',minWidth:'500px'}},
    h('label',{},h('b',{},'Collaborateur')),st,h('label',{},'Projet'),pr,h('label',{},'Versé le'),I('DATE',old.DATE||today(),{type:'date'}),
    h('label',{},h('b',{},'Montant CHF')),I('MONTANT',old.MONTANT??(suggestion>0.5?Math.round(suggestion*20)/20:''),{type:'number',step:'0.05',style:{width:'160px'}}),
    h('label',{},'Remarque'),I('REMARQUE',old.REMARQUE||'',{placeholder:'p. ex. versé avec le salaire de décembre'}));
  const get=k=>{ const e=body.querySelector('[data-k="'+k+'"]'); return e?e.value:''; };
  const bt=[{t:'Annuler'},{t:'Enregistrer',pri:true,fn:async()=>{
    const r={...old,TYPE:'versement',STAFF_ID:+get('STAFF_ID')||null,PROJECT_ID:+get('PROJECT_ID')||null,DATE:get('DATE')||null,MONTANT:get('MONTANT')===''?null:Math.round(+get('MONTANT')*100)/100,REMARQUE:get('REMARQUE').trim()||null};
    if(!r.STAFF_ID||!r.DATE||!r.MONTANT){ toast('Collaborateur, date et montant sont obligatoires.',true); return false; }
    if(r.ID==null) r.ID=DS.newIds('sgapport')[0];
    nxLS.set('sg3_apport_staff',String(r.STAFF_ID)); await DS.commit([{t:'sgapport',id:r.ID,val:r}]); toast('Versement de CHF '+sgChf(r.MONTANT)+' enregistré.'); }}];
  if(v) bt.unshift({t:'Supprimer',fn:()=>{ sgConfirm('Supprimer ce versement de CHF '+sgChf(v.MONTANT)+' du '+dfr(v.DATE)+' ?',async()=>{ await DS.commit([{t:'sgapport',id:v.ID,val:null}]); toast('Versement supprimé.'); }); }});
  dialog({title:v?'Modifier le versement':'Nouveau versement d’une commission d’apport',body,buttons:bt}); }
/* Accueil ▸ À traiter : commissions d'apport exigibles (décompte final) non encore versées — administrateur */
{ const a0=sgATraiter; sgATraiter=async function(){ const A=await a0.apply(this,arguments);
    try{ if(A&&sgAdmin()&&!sgFinVerrou()&&DS.all('sgapport').length){ const D=fxData(); if(D){ const taux=sgTaux(), L=sgApports().map(a=>sgApportCalc(a,D,taux)).filter(x=>x.exigible&&x.solde>0.5);
        if(L.length&&!A.groupes.some(g=>g.k==='ap')){ A.groupes.push({k:'ap',t:'Commissions d’apport à verser',ico:'coins',go:'nx-apports',items:L.map(x=>({t:staffName(DS.get('staff',x.a.STAFF_ID))+' · '+nxCHF(x.solde)+' CHF',s:(x.p?x.p.NUMBER+' · '+(x.p.TITLE||'')+' — ':'')+'décompte final',ref:x.p?'p:'+x.p.ID:null}))}); A.n+=1; sgSide(); } } } }
    catch(e){ console.error(e); }
    return A; }; }

/* ═══ 18. CHAPITRES PROVISOIRES « HONORAIRES (ANCIEN) » ET « FACTURATION (ANCIEN) » (13.10.2026) ══════════════════
   Les deux modules de l'ancien logiciel du bureau tels que le moteur les reproduit, chacun dans un chapitre du menu, pour les comparer
   avec le chapitre Facturation : honoraires (domaine « ancien » : domaines d'affaire « Offres d'honoraires », « Contrats honoraires »,
   « Avancement des prestations », vue mg-contrats) et facturation (domaine « ancienf » : domaine d'affaire « Factures », vues
   fact-controle, aff-controlling, mg-factures, Administrateur ▸ tarifs, gabarits, comptes QR). Bandeau en tête de chaque écran :
   équivalent actuel + « Noter une remarque ». « Comparer et noter » (une page par chapitre) : correspondances, écarts relevés dans le
   code (13.10.2026), notes d'analyse dans la collection « sganalyse » (base partagée du NAS).
   Provisoire : pour les retirer, supprimer les domaines « ancien » et « ancienf » de SG_DOM (sg3.js) et ce bloc ; les notes restent. */
const SG_ANC={sel:nxLS.get('sg3_anc_projet',null),g:{},q:'',tous:false,reg:'Tarifs de facturation'};
/* chapitre → page de comparaison et note de synthèse */
const SG_ANC_CH={h:{dom:'ancien',vue:'anc-comparer',syn:'synthese',t:'Honoraires'},f:{dom:'ancienf',vue:'ancf-comparer',syn:'synthese-fact',t:'Facturation'}};
/* thèmes de la comparaison : ch = chapitre (h honoraires, f facturation), anc = écrans de l'ancien logiciel, act = [écran actuel, libellé], c = constat */
const SG_ANC_THEMES=[
  {ch:'h',k:'calcul',t:'Calcul des honoraires',anc:['anc-offres'],act:[['fx-calchono','Calcul d’honoraires']],
   c:'Ancien : 5 modes de calcul (global, forfaitaire, coût de l’ouvrage, temps employé effectif par activités et tarifs, autre), variantes Offre / Contrat / Avenant, Z1 et Z2 modifiables (SIA 102, 103, 105, 108), facteurs i, h, s par phase partielle, coût de l’ouvrage en 3 parts, escompte, transfert vers les prévisions du projet. Actuel : un calcul par contrat (parties d’ouvrage), Z1 et Z2 fixes (SIA 102), un seul jeu de facteurs, coût déterminant B calculé depuis les CFC.'},
  {ch:'h',k:'offre',t:'Document d’offre',anc:['anc-offres'],act:[['fx-contrats','Contrats d’honoraires']],
   c:'Ancien : documents récapitulatifs simples (phases, activités, frais). Actuel : offre complète rédigée (chapitres, conditions, planning, annexes, PDF fidèle aux documents du bureau) — point fort à garder.'},
  {ch:'h',k:'contrats',t:'Contrats d’honoraires',anc:['anc-contrats'],act:[['fx-contrats','Contrats d’honoraires']],
   c:'Ancien : plusieurs contrats par projet, contrats avec sous-traitants (mandant / mandataire), contrat lié à une variante du calcul, statut En traitement / Validé / Refusé. Actuel : un contrat par projet, versions commentées, états envoyé / signé (verrouillé) / annulé / terminé / archivé.'},
  {ch:'h',k:'echeancier',t:'Échéancier d’encaissements',anc:['anc-contrats','anc-mg-contrats'],act:[],
   c:'Ancien : encaissements planifiés par contrat (dates de facture, d’échéance et d’encaissement, montant, phase), proposés ensuite dans la facture ; situation planifié / facturé / encaissé. Actuel : absent.'},
  {ch:'h',k:'avancement',t:'Avancement des prestations',anc:['anc-avancement'],act:[['fx-saisie','Saisie de facture'],['nx-renta','Rentabilité des projets']],
   c:'Ancien : journal daté du projet (% prévu / % effectif, graphique), sans détail par phase. Actuel : % réalisé par sous-phase SIA, saisi dans chaque facture. Aucun des deux n’a un vrai suivi par phase.'},
  {ch:'h',k:'mgcontrat',t:'Rapports sur les contrats',anc:['anc-mg-contrats'],act:[['nx-renta','Rentabilité des projets']],
   c:'Ancien : contrats et sous-traitants, échéancier, encaissements planifiés et reçus, situation avec diagramme, avancement. Actuel : rentabilité par projet (honoraires, coût de revient, facturé, encaissé, marge, alertes).'},
  {ch:'f',k:'types',t:'Acomptes et factures finales',anc:['anc-factures'],act:[['fx-saisie','Saisie de facture']],
   c:'Ancien : désignation libre (Facture, Facture d’acompte, Facture finale) ou reprise d’un encaissement planifié du contrat. Actuel : acomptes AC01, AC02…, facture F, facture finale FF ; types Honoraires / Non ordinaire / Expertise ; facture sans contrat possible.'},
  {ch:'f',k:'positions',t:'Contenu de la facture',anc:['anc-factures'],act:[['fx-saisie','Saisie de facture'],['fx-factures','Factures']],
   c:'Ancien : positions libres (groupe, position, sous-total, %, TVA…), gabarits, import depuis le calcul ou une autre facture ; factures antérieures déduites à la main. Actuel : structure fixe (% réalisé × honoraires + heures + frais), acomptes versés déduits automatiquement.'},
  {ch:'f',k:'numero',t:'Numérotation et échéance',anc:['anc-factures'],act:[['fx-saisie','Saisie de facture']],
   c:'Ancien : numéro libre, aucune échéance calculée. Actuel : numéro automatique FAaa.nn_PROJET.ACnn / F / FF (ou manuel), échéance à 10, 20 ou 30 jours.'},
  {ch:'f',k:'pdf',t:'Document de facture',anc:['anc-factures'],act:[['fx-saisie','Saisie de facture']],
   c:'Ancien : ancien document HTML ou document sur modèle, PDF enregistrés avec la facture, QR-facture ajoutée au PDF. Actuel : « PDF fidèle » sur le gabarit du bureau, avec aperçu ; pas de PDF enregistré avec la facture.'},
  {ch:'f',k:'encaisse',t:'Encaissements',anc:['anc-factures','anc-mg-factures'],act:[['fx-factures','Factures']],
   c:'Ancien : encaissements partiels (montant, date), solde à encaisser par facture et par contrat. Actuel : une date de paiement, qui passe la facture en « Payée » pour son total.'},
  {ch:'f',k:'qr',t:'QR-facture',anc:['anc-factures','anc-reglages'],act:[],
   c:'Ancien : comptes QR, édition et validation de la QR-facture, génération et ajout au PDF. Actuel : seul l’IBAN est imprimé en texte.'},
  {ch:'f',k:'suivi',t:'Suivi des factures et rappels',anc:['anc-controle'],act:[['fx-factures','Factures'],['nx-home','Cockpit ▸ À traiter']],
   c:'Ancien : Planifiée / Envoyée / Rappel envoyé / Payée, nombre de rappels saisi à la main, pas de document de rappel. Actuel : jours de retard, « Impayée » posé automatiquement après l’échéance, factures échues à relancer sur l’accueil ; pas de rappel non plus.'},
  {ch:'f',k:'heures',t:'Heures et frais facturés',anc:['anc-heures','anc-controle'],act:[['nx-situation','Situation des heures']],
   c:'Ancien : heures et frais marqués « facturés » dans le controlling et transférés en positions d’une facture planifiée ; tarifs horaires datés. Actuel : les heures servent à l’analyse et au coût de revient, pas à la facture.'},
  {ch:'f',k:'mgfact',t:'Rapports sur les factures',anc:['anc-mg-factures'],act:[['fx-cockpit2','Cockpit analytique'],['fx-cockpit','Cockpit']],
   c:'Ancien : rapports imprimables (année par mois et trimestres, selon statut, par date de facture / d’échéance / d’encaissement, honoraires et frais). Actuel : cockpit analytique sur les données réelles ; le cockpit simple affiche encore des données d’exemple.'},
  {ch:'f',k:'reglages',t:'Réglages de facturation',anc:['anc-reglages'],act:[],
   c:'Ancien : tarifs horaires datés, gabarits de positions, comptes QR. Actuel : TVA par contrat et par facture (8,1 % par défaut), tarifs écrits dans le texte de l’offre.'}];
/* équivalents actuels de chaque écran des chapitres (bandeau) */
const SG_ANC_EQ={};
SG_ANC_THEMES.forEach(x=>x.anc.forEach(v=>{ const L=SG_ANC_EQ[v]||(SG_ANC_EQ[v]=[]); x.act.forEach(a=>{ if(!L.some(y=>y[0]===a[0])) L.push(a); }); }));
const sgAncChDe=v=>sgDomDe(v)==='ancienf'?'f':'h';   /* chapitre d'un écran */
function sgAncBandeau(m,v){ const eq=(SG_ANC_EQ[v]||[]).filter(([g])=>nxCan(g)), lien=(t,fn,cls)=>h('a',{href:'#',class:cls||null,onclick:e=>{ e.preventDefault(); fn(); }},t);
  m.append(h('div',{class:'sg-anc-bar'},h('b',{},'Ancien logiciel · provisoire'),h('span',{},eq.length?'Équivalent actuel :':'Pas d’équivalent direct dans l’app actuelle.'),
    ...eq.map(([g,t])=>lien(t,()=>go(g))),lien('Noter une remarque',()=>go(SG_ANC_CH[sgAncChDe(v)].vue,v),'r'))); }
/* écrans « par projet » : liste des projets | domaine d'affaire de l'ancien logiciel */
function sgAncProjet(dom){ return {
  render(m,arg,id){ sgAncBandeau(m,id); if(arg&&arg.project) SG_ANC.sel=String(arg.project);
    const cols=h('div',{class:'cols'}); m.append(cols);
    const A=col(300), C=h('div',{class:'col fill'}); cols.append(A.el,C);
    const head=phead([{i:'filter',t:SG_ANC.tous?'Projets en cours seulement':'Afficher aussi les projets terminés et archivés',on:SG_ANC.tous,fn:()=>{ SG_ANC.tous=!SG_ANC.tous; go(VIEW.id); }}],{count:1,search:q=>{ SG_ANC.q=q; drawA(); }});
    A.el.prepend(head);
    const liste=()=>DS.all('project').filter(p=>SG_ANC.tous||[1,2,3].includes(+p.PROJECTSTATECODE)||String(p.ID)===String(SG_ANC.sel));
    const drawA=()=>{ const L=liste().filter(p=>matchQ(SG_ANC.q,p.NUMBER,p.TITLE));
      grid(A.pane,Object.assign(SG_ANC.g,{cols:[{k:'NUMBER',t:'Numéro',w:84},{k:'TITLE',t:'Projet'}],rows:L,sel:SG_ANC.sel,sort:['NUMBER',-1],empty:'Aucun projet.',
        onSel:p=>{ SG_ANC.sel=String(p.ID); nxLS.set('sg3_anc_projet',SG_ANC.sel); drawC(); },onDbl:p=>editProject(p)}));
      head.setCount(L.length+' projets'); };
    const drawC=()=>{ C.innerHTML=''; const p=DS.get('project',SG_ANC.sel);
      if(!p){ C.append(h('div',{class:'ph'},'Choisissez un projet dans la liste.')); return; } domainView(C,p,dom); };
    this.drawA=drawA; this.drawC=drawC; drawA(); drawC(); },
  refresh(ts){ if(hit(ts,'project')&&this.drawA) this.drawA(); if(this.drawC) this.drawC(); } }; }
VIEWS['anc-offres']=sgAncProjet('Offres d’honoraires');
VIEWS['anc-contrats']=sgAncProjet('Contrats honoraires');
VIEWS['anc-avancement']=sgAncProjet('Avancement des prestations');
VIEWS['anc-factures']=sgAncProjet('Factures');
/* écrans généraux : les vues du moteur, avec le bandeau (état propre à chaque écran : Object.create) */
[['anc-controle','fact-controle'],['anc-heures','aff-controlling'],['anc-mg-contrats','mg-contrats'],['anc-mg-factures','mg-factures']].forEach(([a,b])=>{ const v0=VIEWS[b]; if(!v0) return;
  const v=VIEWS[a]=Object.create(v0); v.render=function(m,arg,id){ sgAncBandeau(m,id); return v0.render.call(this,m,arg,id); }; });
/* réglages : les catégories de facturation de l'Administrateur */
VIEWS['anc-reglages']={ render(m,arg,id){ sgAncBandeau(m,id);
    const cols=h('div',{class:'cols'}); m.append(cols); const L=col(230), R=h('div',{class:'col fill'}); cols.append(L.el,R);
    const cats=typeof ch08aAdmCats==='function'?ch08aAdmCats(['Tarifs de facturation','Gabarits de facturation','Comptes pour QR-facture']):['Tarifs de facturation','Gabarits de facturation','Comptes pour QR-facture'];
    if(!cats.includes(SG_ANC.reg)) SG_ANC.reg=cats[0];
    grid(L.pane,{key:c=>c,cols:[{k:'c',t:'Catégorie',f:c=>esc(c)}],rows:cats,sel:SG_ANC.reg,sort:null,onSel:c=>{ SG_ANC.reg=c; draw(); }});
    const draw=()=>{ R.innerHTML=''; if(SG_ANC.reg) admPane(R,SG_ANC.reg); else R.append(h('div',{class:'ph'},'Aucune catégorie accessible avec vos droits.')); };
    this.draw=draw; draw(); },
  refresh(){ if(this.draw) this.draw(); } };
/* « Comparer et noter » : une page par chapitre */
function sgAncNote(k){ return DS.get('sganalyse',k)||null; }
async function sgAncNoter(k,texte){ const r=Object.assign({ID:k},sgAncNote(k)||{},{TEXTE:texte,MODIFIE:today(),PAR:(typeof ME!=='undefined'&&ME.id)||''}); await DS.save('sganalyse',r); }
function sgAncComparer(ch){ const C=SG_ANC_CH[ch], TH=SG_ANC_THEMES.filter(x=>x.ch===ch); return {
  render(m,arg){ const btn=(v,t)=>nxCan(v)?'<button class="nx-btn" data-go="'+nxE(v)+'">'+nxE(t||(NX_VIEW[v]&&NX_VIEW[v].t)||v)+'</button>':'';
    const note=k=>{ const n=sgAncNote(k)||{}; return '<textarea class="inp" data-note="'+nxE(k)+'" rows="3" placeholder="Vos remarques, ce qu’il faudrait reprendre ou améliorer…">'+nxE(n.TEXTE||'')+'</textarea>'
      +'<div class="sg-anc-m">'+(n.MODIFIE?'Noté le '+nxE(dfr(n.MODIFIE))+(n.PAR?' par '+nxE(n.PAR):''):'')+'</div>'; };
    const nb=TH.filter(x=>((sgAncNote(x.k)||{}).TEXTE||'').trim()).length, autre=SG_ANC_CH[ch==='h'?'f':'h'];
    nxPage(m,'<div class="sg-split">'+sgIntro('Chapitre provisoire','Comparer et noter · '+C.t.toLowerCase(),C.t+' de l’ancien logiciel, thème par thème, face à l’app actuelle : ouvrez les deux côtés, lisez le constat, notez ce qu’il faut reprendre ou améliorer. Les notes sont enregistrées dans la base (partagées avec le bureau sur le NAS).',
        '<div class="sg-figs"><div class="sg-fig"><div class="n">'+TH.length+'</div><div class="t">thèmes</div></div><div class="sg-fig"><div class="n">'+nb+'</div><div class="t">avec une note</div></div></div>')
      +'<div><div class="nx-grid">'
      +nxCard('c12','Synthèse et priorités','<div class="b">'+note(C.syn)+'<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="nx-btn" data-fn="copier">'+nxSvg('dup')+'Copier toutes les notes</button>'
        +(nxCan(autre.vue)?'<button class="nx-btn" data-go="'+autre.vue+'">'+nxSvg('arrow')+'Comparer et noter · '+nxE(autre.t.toLowerCase())+'</button>':'')+'</div></div>')
      +nxCard('c12','Thème par thème','<div class="b flush"><table class="nx-tbl sg-anc-t"><thead><tr><th>Thème</th><th>Ancien logiciel</th><th>App actuelle</th><th>Constat (relevé dans le code le 13.10.2026)</th><th>Vos notes</th></tr></thead><tbody>'
        +TH.map(x=>'<tr data-theme="'+nxE(x.k)+'"><td><b>'+nxE(x.t)+'</b></td><td>'+x.anc.map(v=>btn(v)).join('')+'</td><td>'+(x.act.map(([v,t])=>btn(v,t)).join('')||'<span class="sg-anc-no">absent</span>')+'</td><td class="c">'+nxE(x.c)+'</td><td>'+note(x.k)+'</td></tr>').join('')
        +'</tbody></table></div>')
      +'</div></div></div>');
    const pg=m.querySelector('.nx-page');
    pg._fn.copier=()=>{ const L=[[C.syn,'Synthèse et priorités'],...TH.map(x=>[x.k,x.t])].map(([k,t])=>{ const n=sgAncNote(k); return n&&String(n.TEXTE||'').trim()?t+'\n'+n.TEXTE.trim():''; }).filter(Boolean);
      if(!L.length){ toast('Aucune note pour l’instant.'); return; } ctCopy(C.t+' — notes d’analyse ('+dfr(today())+')\n\n'+L.join('\n\n'),'Notes copiées.'); };
    pg.querySelectorAll('textarea[data-note]').forEach(t=>t.addEventListener('change',async()=>{ try{ await sgAncNoter(t.dataset.note,t.value); const d=t.nextElementSibling; if(d) d.textContent='Noté le '+dfr(today())+((typeof ME!=='undefined'&&ME.id)?' par '+ME.id:''); toast('Note enregistrée.'); }
      catch(e){ if(!e||!e.conflict) toast('✗ Note non enregistrée : '+((e&&e.message)||e),true); } }));
    if(typeof arg==='string'&&/^anc-/.test(arg)){ const x=TH.find(y=>y.anc.includes(arg)); const tr=x&&pg.querySelector('tr[data-theme="'+x.k+'"]');
      if(tr) setTimeout(()=>{ tr.scrollIntoView({block:'center'}); tr.classList.add('sel'); const ta=tr.querySelector('textarea'); if(ta) ta.focus(); },60); } },
  refresh(ts){ if(hit(ts,'sganalyse')&&!(document.activeElement&&document.activeElement.matches&&document.activeElement.matches('textarea[data-note]'))) go(C.vue); } }; }
VIEWS['anc-comparer']=sgAncComparer('h');
VIEWS['ancf-comparer']=sgAncComparer('f');
['anc-comparer','ancf-comparer'].forEach(v=>{ SG_VUE_DROIT[v]=()=>sgDroit('finances','toutes'); });
['anc-offres','anc-contrats','anc-avancement','anc-factures','anc-controle','anc-heures','anc-mg-contrats','anc-mg-factures','anc-reglages'].forEach(v=>{ SG_VUE_DROIT[v]=()=>sgDroit('finances','toutes')&&sgDroit('contrats','lecture')&&sgDroit('factures','lecture'); });
/* chiffres des vues d'ensemble des deux chapitres */
{ const f0=sgFigs; sgFigs=async function(k){ if(k!=='ancien'&&k!=='ancienf') return f0.apply(this,arguments);
    const n=t=>DS.all(t).length, notes=ch=>{ const ks=new Set([SG_ANC_CH[ch].syn,...SG_ANC_THEMES.filter(x=>x.ch===ch).map(x=>x.k)]); return DS.all('sganalyse').filter(x=>ks.has(String(x.ID))&&String(x.TEXTE||'').trim()).length; };
    if(k==='ancien') return [{v:n('projectfee'),t:'offres d’honoraires'},{v:n('projectfeecalculation'),t:'variantes de calcul'},{v:n('projectcontract'),t:'contrats'},{v:notes('h'),t:'notes d’analyse'}];
    const F=DS.all('projectinvoice'); return [{v:F.length,t:'factures'},{v:F.filter(x=>+x.PROJECTINVOICESTATECODE===3).length,t:'payées'},{v:n('projectpayment'),t:'encaissements'},{v:notes('f'),t:'notes d’analyse'}]; }; }

/* ═══ 19. CLIC DROIT : MENU CONTEXTUEL DANS LES TABLEAUX (13.10.2026) ═════════════════════════════════════
   Comme dans l'ancien logiciel : un clic droit sur une ligne de tableau la sélectionne et ouvre, à l'endroit du clic, le menu de ses
   actions — Ouvrir, fiche (projet, contact, membre), boutons de la barre du tableau (Nouveau, Modifier, Supprimer… ; un bouton à liste
   devient un sous-menu : Documents ▸, Fonctions ▸…), copie de la ligne ou du tableau. Sur une zone vide d'une liste : les actions de sa
   barre (Nouveau…). Partout : grilles du moteur (fenêtres comprises), écrans de la coquille, modules Facturation (cadre : actions de la
   ligne). Un écran qui a déjà son propre menu (devis, contrôle des coûts, feuille d'heures…) le garde (event.defaultPrevented).
   Menu habituel du navigateur : ⌥ + clic droit, et toujours dans un champ de saisie ou sur un texte sélectionné. */
{ const i0=ibtn; ibtn=function(b){ const el=i0.apply(this,arguments); try{ if(el&&el.nodeType===1&&b&&typeof b==='object'&&!b.nodeType) el._sgB=b; }catch(_){} return el; }; }
let SG_CTX_LIGNE=null;   /* ligne mise en évidence tant que le menu est ouvert */
function sgCtxMarquer(el){ if(!el||!el.style) return; SG_CTX_LIGNE={el,o:el.style.outline,oo:el.style.outlineOffset}; el.style.outline='2px solid #003346'; el.style.outlineOffset='-2px'; }
{ const c0=closeMenus; closeMenus=function(){ if(SG_CTX_LIGNE){ try{ SG_CTX_LIGNE.el.style.outline=SG_CTX_LIGNE.o; SG_CTX_LIGNE.el.style.outlineOffset=SG_CTX_LIGNE.oo; }catch(_){} SG_CTX_LIGNE=null; } return c0.apply(this,arguments); }; }
function sgMenuNettoyer(L){ const o=[]; L.forEach(x=>{ if(x==='-'){ if(o.length&&o[o.length-1]!=='-') o.push(x); } else if(x&&typeof x==='object'&&String(x.t==null?'':x.t).trim()) o.push(x); });
  while(o.length&&o[o.length-1]==='-') o.pop(); return o; }
function sgMenuPlacer(el,x,y,xg){ const w=el.offsetWidth, hh=el.offsetHeight; let l=x, t=y;
  if(l+w>innerWidth-8) l=xg!=null?Math.max(8,xg-w):Math.max(8,innerWidth-w-8); if(t+hh>innerHeight-8) t=Math.max(8,innerHeight-hh-8);
  el.style.left=l+'px'; el.style.top=t+'px'; }
/* panneau de menu : items = [{t, fn, dis, chk, danger, sub:()=>items} | '-'] (mêmes filtres de droits et libellés que popMenu) */
function sgMenuPanneau(items,anc){ let L=[]; try{ L=(typeof items==='function'?items():items)||[]; }catch(e){ console.error(e); }
  if(!Array.isArray(L)) return null; if(typeof ch08bGuardItems==='function') L=ch08bGuardItems(L,anc||null);
  L=sgMenuNettoyer(L.map(x=>x&&typeof x==='object'?Object.assign({},x,{t:sgLib(String(x.t==null?'':x.t))}):x)); if(!L.length) return null;
  const m=h('div',{class:'menu sg-cmenu',role:'menu'});
  const fermerEnfant=()=>{ let c=m._enfant; while(c){ const n=c._enfant; c.remove(); c=n; } m._enfant=null; m.querySelectorAll(':scope>div.open').forEach(x=>x.classList.remove('open')); };
  L.forEach(it=>{ if(it==='-'){ m.append(h('hr')); return; }
    const d=h('div',{class:[it.chk?'chk':'',it.dis?'dis':'',it.sub?'sub':'',it.danger?'danger':''].filter(Boolean).join(' ')||null,role:'menuitem'},it.t);
    if(it.sub&&!it.dis){ const ouvrir=()=>{ if(d.classList.contains('open')&&m._enfant) return; fermerEnfant(); const s=sgMenuPanneau(it.sub,d); if(!s){ d.classList.add('dis'); return; }
        d.classList.add('open'); m._enfant=s; const r=d.getBoundingClientRect(); sgMenuPlacer(s,r.right-3,r.top-6,r.left+3); };
      d.onmouseenter=()=>{ clearTimeout(m._t); m._t=setTimeout(ouvrir,110); }; d.onclick=e=>{ e.stopPropagation(); clearTimeout(m._t); ouvrir(); }; }
    else { d.onmouseenter=()=>{ clearTimeout(m._t); if(m._enfant) m._t=setTimeout(fermerEnfant,180); };
      if(!it.dis) d.onclick=()=>{ closeMenus(); try{ const r=it.fn&&it.fn(); if(r&&typeof r.catch==='function') r.catch(e=>{ if(!e||!e.conflict){ console.error(e); toast('✗ '+((e&&e.message)||e),true); } }); }
        catch(e){ console.error(e); toast('✗ '+((e&&e.message)||e),true); } }; }
    m.append(d); });
  document.body.append(m); return m; }
function sgMenuAt(x,y,items,ligne){ closeMenus(); const m=sgMenuPanneau(items,null); if(!m) return null; if(ligne) sgCtxMarquer(ligne);
  sgMenuPlacer(m,x,y); setTimeout(()=>document.addEventListener('mousedown',_mclose),0); return m; }
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&document.querySelector('.sg-cmenu')){ e.preventDefault(); e.stopPropagation(); closeMenus(); } },true);
window.addEventListener('resize',()=>{ if(document.querySelector('.sg-cmenu')) closeMenus(); });
document.addEventListener('scroll',e=>{ const t=e.target; if(t&&t.nodeType===1&&t.closest('.menu')) return; if(document.querySelector('.sg-cmenu')) closeMenus(); },true);
/* libellé d'un élément cliquable d'une ligne : son infobulle (« Supprimer définitivement ce contrat (…) » → « Supprimer définitivement ce
   contrat » ; « SIGNÉ — … ; cliquer pour retirer l'état » → « Retirer l'état « SIGNÉ » »), sinon son texte */
function sgCtxLib(el){ const cap=x=>x.charAt(0).toUpperCase()+x.slice(1), court=x=>x.length>54?x.slice(0,52).trim()+'…':x;
  const ti=String(el.getAttribute('title')||el.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim(), tx=String(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim();
  if(ti){ const pre=ti.split(/\s[—–]\s|\s*\(|\s*;\s*/)[0].replace(/[.…:\s]+$/,'').trim(), c=ti.match(/cliquer pour ([^;.(—–]+)/i);
    if(c&&pre&&!/^(clic|cliquer)\b/i.test(pre)) return court(cap(c[1].trim())+' « '+pre+' »');
    if(pre&&!/^(clic|cliquer)\b/i.test(pre)) return court(pre); }
  return /[A-Za-zÀ-ÿ]{2}/.test(tx)?court(tx.replace(/[.…:\s]+$/,'')):''; }
const SG_CTX_CLIC='button,a[href],[onclick],[data-fn],[data-go],[data-ref]';
/* actions d'une ligne (tableaux simples, cadre Facturation, écrans de la coquille) : ses boutons et liens, destructifs à la fin */
function sgCtxActionsLigne(row){ const out=[], vus=new Set();
  row.querySelectorAll(SG_CTX_CLIC).forEach(el=>{ if(el===row||el.disabled) return;
    const par=el.parentElement&&el.parentElement.closest(SG_CTX_CLIC); if(par&&par!==row&&row.contains(par)) return;   /* élément dans un bouton : le bouton suffit */
    if(el.closest('tr,.nx-row')!==row&&row.matches('tr,.nx-row')) return;                                         /* ligne d'un tableau imbriqué */
    if(!el.getClientRects().length) return;
    const t=sgCtxLib(el); if(!t||vus.has(t)) return; vus.add(t);
    out.push({t,fn:()=>el.click(),danger:/^(supprimer|effacer)/i.test(t)}); });
  const a=out.filter(x=>!x.danger), d=out.filter(x=>x.danger); return d.length?[...a,'-',...d]:a; }
function sgCtxTexteLigne(tr){ return [...(tr.cells||[])].map(td=>String(td.innerText||'').replace(/\s+/g,' ').trim()).join('\t'); }
function sgCtxTexteTableau(table){ return [...table.rows].filter(r=>r.getClientRects().length).map(sgCtxTexteLigne).join('\n'); }
function sgCtxCopie(tr){ const table=tr.closest('table'), sel=[...tr.parentElement.querySelectorAll(':scope>tr.on')], L=[];
  if(sel.length>1&&sel.includes(tr)) L.push({t:'Copier les '+sel.length+' lignes sélectionnées',fn:()=>ctCopy(sel.map(sgCtxTexteLigne).join('\n'),sel.length+' lignes copiées.')});
  else L.push({t:'Copier la ligne',fn:()=>ctCopy(sgCtxTexteLigne(tr),'Ligne copiée.')});
  if(table) L.push({t:'Copier le tableau',fn:()=>ctCopy(sgCtxTexteTableau(table),'Tableau copié (à coller dans un tableur).')});
  return L; }
/* barre d'outils d'un tableau du moteur : l'en-tête de son panneau (phead), sinon la barre de l'écran (#tools) */
function sgCtxBarre(n){ for(let x=n; x&&x!==document.body; x=x.parentElement){
    for(const c of x.children){ if(c.classList&&c.classList.contains('ph2')&&c.querySelector('button.ib')) return c; }
    if(x.id==='main'||x.classList.contains('dlg')) break; }
  const tl=document.getElementById('tools'); return n.closest&&n.closest('#main')&&tl&&tl.querySelector('button.ib')?tl:null; }
function sgCtxBoutons(barre){ const out=[], vus=new Set();
  barre.querySelectorAll('button.ib').forEach(b=>{ if(!b.getClientRects().length) return; const s=b._sgB||{};
    if(s.i&&/^(prev|next|first|last|today)$/.test(s.i)) return;   /* navigation de période */
    const t=String(s.t||(s.i&&SG_LBL[s.i])||b.title||((b.querySelector('.lb')||{}).textContent)||'').replace(/\s*…$/,'').trim(); if(!t||vus.has(t)) return; vus.add(t);
    if(s.menu&&!b.disabled) out.push({t,sub:()=>s.menu()});
    else out.push({t,dis:b.disabled,fn:()=>b.click(),danger:s.i==='minus'||/^supprimer/i.test(t)}); });
  return out; }
/* actions d'un projet, d'un contact ou d'un membre (lignes data-ref des écrans de la coquille) */
function sgCtxRef(ref){ const [k,id]=String(ref).split(':'), L=[];
  if(k==='p'){ const p=DS.get('project',id); if(!p) return L; L.push({t:'Fiche projet',fn:()=>nxOpenRef(ref)});
    if(typeof sgAdmin!=='function'||sgAdmin()||sgVueOk('aff-gestion')) L.push({t:'Modifier le projet …',fn:()=>editProject(p)});
    L.push({t:'Saisir des heures …',fn:()=>sgSaisieRapide({projet:p.ID})},{t:'Domaines du projet',fn:()=>go('nx-pdom',String(p.ID))}); }
  else if(k==='c'){ const o=DS.get('contactowner',id); if(!o) return L; L.push({t:'Fiche contact',fn:()=>nxOpenRef(ref)},{t:'Modifier …',fn:()=>editOwner(o)}); }
  else if(k==='s'&&DS.get('staff',id)) L.push({t:'Fiche membre',fn:()=>nxOpenRef(ref)});
  return L; }
const sgCtxSaisie=t=>!!t.closest('input,textarea,select,[contenteditable=""],[contenteditable="true"]');
function sgCtxSelection(t,doc){ try{ const s=doc.getSelection(); if(!s||s.isCollapsed||!String(s).trim()) return false; return s.getRangeAt(0).intersectsNode(t); }catch(_){ return false; } }
/* → {items, ligne} pour un clic droit dans la coquille ou le moteur, ou null (menu habituel) */
function sgCtxMenuDe(t){
  if(t.closest('.menu,#nx-side,#nx-head,.sg-visu')) return null;
  const zone=t.closest('#main,.dlg'); if(!zone) return null;
  const tr=t.closest('tr'); if(tr&&tr.closest('thead')) return null;
  const table=tr&&tr.closest('table');
  if(table&&table.classList.contains('g')&&tr.dataset.k!=null){   /* grille du moteur : sélection, puis Ouvrir, fiche, barre, copie */
    const pane=table.parentElement, k=tr.dataset.k;
    if(!tr.classList.contains('on')) tr.click();
    const r=tr.isConnected?tr:(pane&&pane.querySelector('tr[data-k="'+CSS.escape(k)+'"]'));
    if(!r) return null;
    const L=[]; if(typeof r.ondblclick==='function') L.push({t:'Ouvrir',fn:()=>r.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}))});
    const ref=typeof sgLigneRef==='function'&&sgLigneRef(r); if(ref) L.push({t:ref.t,fn:()=>nxOpenRef(ref.ref)});
    const b=sgCtxBarre(r.isConnected?r:pane); if(b) L.push('-',...sgCtxBoutons(b));
    L.push('-',...sgCtxCopie(r)); return {items:L,ligne:r}; }
  if(!tr){ const pane=t.closest('.pane'); if(pane&&pane.querySelector(':scope>table.g')){ const b=sgCtxBarre(pane), L=b?sgCtxBoutons(b):[]; return L.length?{items:L}:null; } }
  const row=t.closest('tr,.nx-row,[data-ref]'); if(!row||!zone.contains(row)||row.closest('#nx-side')) return null;   /* écrans de la coquille, tableaux simples */
  const L=[], ref=row.dataset&&row.dataset.ref;
  if(ref) L.push(...sgCtxRef(ref));
  else if(row.matches('[data-go],[data-fn]')||typeof row.onclick==='function'||row.hasAttribute('onclick')) L.push({t:'Ouvrir',fn:()=>row.click()});
  const A=sgCtxActionsLigne(row); if(A.length) L.push('-',...A);
  if(row.tagName==='TR'&&row.cells&&row.cells.length) L.push('-',...sgCtxCopie(row));
  return {items:L,ligne:row}; }
document.addEventListener('contextmenu',e=>{ if(e.defaultPrevented||e.altKey) return; const t=e.target; if(!t||t.nodeType!==1) return;
  if(sgCtxSaisie(t)||sgCtxSelection(t,document)) return;
  let r=null; try{ r=sgCtxMenuDe(t); }catch(err){ console.error(err); return; }
  if(!r||!r.items||!sgMenuNettoyer(r.items).length) return;
  e.preventDefault(); sgMenuAt(e.clientX,e.clientY,r.items,r.ligne); });
/* modules Facturation (cadre) : clic droit sur une ligne de tableau → ses actions (boutons, états), Ouvrir, copie */
function sgCtxCadre(w){ if(!w||!w.document||w.__sgCtx) return; w.__sgCtx=1; const doc=w.document;
  doc.addEventListener('contextmenu',e=>{ if(e.defaultPrevented||e.altKey) return; const t=e.target; if(!t||t.nodeType!==1) return;
    if(sgCtxSaisie(t)||sgCtxSelection(t,doc)) return;
    const tr=t.closest('tr'); if(!tr||tr.closest('thead')||!tr.closest('table')||!tr.cells||!tr.cells.length) return;
    if(!tr.querySelector('td')) return;
    const oc=String(tr.getAttribute('onclick')||''), L=[];
    const dbl=tr.hasAttribute('ondblclick')||typeof tr.ondblclick==='function';
    if(dbl){ if(oc||typeof tr.onclick==='function') tr.click(); L.push({t:'Ouvrir',fn:()=>tr.dispatchEvent(new w.MouseEvent('dblclick',{bubbles:true,cancelable:true}))}); }
    else if(oc&&/sel|pick/i.test(oc)) tr.click();                                   /* ligne à sélectionner (devis, contrôle du coût…) */
    else if(oc||typeof tr.onclick==='function') L.push({t:'Ouvrir',fn:()=>tr.click()});
    const A=sgCtxActionsLigne(tr); if(A.length) L.push('-',...A);
    L.push('-',...sgCtxCopie(tr));
    if(!sgMenuNettoyer(L).length) return;
    e.preventDefault(); const f=w.frameElement||document.getElementById('fx-frame'), R=f?f.getBoundingClientRect():{left:0,top:0};
    sgMenuAt(R.left+e.clientX,R.top+e.clientY,L,tr); });
  const fermer=()=>{ if(document.querySelector('.sg-cmenu')) closeMenus(); };
  doc.addEventListener('mousedown',fermer,true); doc.addEventListener('scroll',fermer,true);
  doc.addEventListener('keydown',e=>{ if(e.key==='Escape') fermer(); },true); }
{ const f0=fxEnsure; fxEnsure=function(){ const p=f0.apply(this,arguments); Promise.resolve(p).then(w=>{ try{ sgCtxCadre(w||FX.w); }catch(e){ console.error(e); } },()=>{}); return p; }; }

/* ═══ 20. MES PROJETS (LISTE) · PAGE DES DOMAINES DU PROJET · CHAPITRE AFFAIRES (18.10.2026) ═══════════════════════════════════
   Projets ▸ Mes projets (nx-mesprojets) : la liste seule de ses projets (« ses projets » = sgMesProjets : équipe du projet + heures
   saisies) ; un clic ouvre nx-pdom : la page du projet et ses domaines d'affaire en tuiles avec compteurs ; une tuile = le domaine en
   pleine page (domainView du moteur), avec la barre des domaines pour passer de l'un à l'autre. Chapitre Affaires (sg3.js, SG_DOM) :
   les écrans du moteur aff-gestion, aff-controlling, aff-mes, aff-toutes repris par Object.create sous affd-* (droits identiques). */
/* projets attribués (18.10.2026) : l'équipe du projet (Intervenants) contient la personne de l'utilisateur — sans les projets où il a
   seulement saisi des heures. « Mes projets » ; accès d'un collaborateur (profil collab, droit « ses projets ») limité à ceux-ci. */
function sgProjetsAssignes(){ const st=ME.staff, set=new Set(); if(!st) return set; const pers=String(st.PERSON_ID);
  DS.all('projectmember').forEach(x=>{ if(String(x.RESPCONTACT_ID)===pers||String(x.CONTACT_ID)===pers) set.add(String(x.PROJECT_ID)); }); return set; }
const sgProjetPermis=id=>sgAdmin()||SG_ACC.profil!=='collab'||sgDroit('projets_voir','tous')||sgProjetsAssignes().has(String(id));
/* collaborateur (19.10.2026) : seulement ses projets « en cours » — mêmes états que le filtre « En cours » de Mes projets (configuration,
   en cours, en attente) —, sans « Tous mes projets » ; vaut aussi pour la vue d'ensemble et les listes de Projets (sgProjetsVisibles) */
const SG_ETATS_COLLAB=[1,2,3], sgCollabSeul=()=>SG_ACC.profil==='collab'&&!sgDroit('projets_voir','tous');
const SG_NON_ATTRIBUE='<div class="nx-empty">Ce projet ne vous est pas attribué : seuls les projets dont vous faites partie de l’équipe sont accessibles. <a href="#" data-go="nx-mesprojets">Mes projets</a></div>';
VIEWS['nx-mesprojets']={
  render(m){ VIEW.nxTitle='Mes projets'; const adm=sgAdmin(), ids=adm?new Set(DS.all('project').map(p=>String(p.ID))):sgProjetsAssignes(), collab=sgCollabSeul(),   /* administrateur : tous les projets (21.10.2026) */ tous=!collab&&!!nxLS.get('sg3_mesp_tous',false), q=String(nxLS.get('sg3_mesp_q','')||'');
    const rang=p=>{ const i=[2,3,1,4,5].indexOf(+p.PROJECTSTATECODE); return i<0?9:i; };                           // en cours, en attente, … ; projets internes à la fin
    const L=DS.all('project').filter(p=>ids.has(String(p.ID))&&(tous||SG_ETATS_COLLAB.includes(+p.PROJECTSTATECODE)))
      .sort((a,b)=>(+sgInterne(a)-+sgInterne(b))||(rang(a)-rang(b))||cmp(String(b.NUMBER||''),String(a.NUMBER||'')));
    const me=nxMe(), lim30=dayKey(new Date(Date.now()-30*864e5)), h30={};
    if(me) DS.by('timelog','STAFF_ID',me.ID).forEach(r=>{ if(tlKey(r)>=lim30) h30[r.PROJECT_ID]=(h30[r.PROJECT_ID]||0)+(+r.TIMEPERIOD||0); });
    const row=p=>{ const c=sgCatProjet(p), mo=projMO(p);
      return '<tr class="nx-row" data-go="nx-pdom" data-arg="'+p.ID+'" data-q="'+nxE([p.NUMBER,p.TITLE,mo,p.LOCATION].filter(Boolean).join(' ').toLowerCase())+'" style="display:table-row">'
        +'<td><span class="nx-tag num">'+nxE(p.NUMBER||'')+'</span></td><td><b>'+nxE(p.TITLE||'')+'</b>'+(c!=='architecture'?' <span class="nx-tag">'+SG_CAT_L[c]+'</span>':'')+'</td>'
        +'<td>'+nxE(mo)+'</td><td>'+nxE(p.LOCATION||'')+'</td><td>'+nxStateTag(p)+'</td><td>'+nxE(sgTermine(p)?'Terminé':sgPhaseLib(sgPhaseActuelle(p),true))+'</td><td class="r">'+(h30[p.ID]?nxH(h30[p.ID])+' h':'')+'</td></tr>'; };
    const html='<div class="sg-mesp-bar">'+(collab?'':'<div class="seg"><button data-fn="encours" class="'+(tous?'':'on')+'">En cours</button><button data-fn="tous" class="'+(tous?'on':'')+'">'+(adm?'Tous les projets':'Tous mes projets')+'</button></div>')
      +'<input class="inp" id="sg-mesp-q" placeholder="Rechercher un projet…" value="'+nxE(q)+'"><span class="n"></span></div>'
      +(L.length?'<table class="nx-tbl sg-mesp"><tr><th>N°</th><th>Projet</th><th>Maître d’ouvrage</th><th>Lieu</th><th>État</th><th>Phase actuelle</th><th class="r">Mes heures (30 j)</th></tr>'+L.map(row).join('')+'</table>'
        :'<div class="nx-empty">'+(me?'Vous ne faites partie de l’équipe d’aucun projet'+(tous?'':' en cours')+' (Intervenants du projet).':'Votre compte n’est relié à aucun membre de l’équipe.')+(collab?'':' <a href="#" data-go="nx-listeprojets" data-arg="tous">Liste des projets</a>')+'</div>');
    const pg=nxPage(m,html), inp=pg.querySelector('#sg-mesp-q'), nb=pg.querySelector('.sg-mesp-bar .n');
    pg._fn.encours=()=>{ nxLS.set('sg3_mesp_tous',false); go('nx-mesprojets'); }; pg._fn.tous=()=>{ nxLS.set('sg3_mesp_tous',true); go('nx-mesprojets'); };
    const filt=()=>{ const v=inp.value.trim().toLowerCase(); nxLS.set('sg3_mesp_q',inp.value); let n=0;
      pg.querySelectorAll('tr[data-q]').forEach(tr=>{ const ok=!v||tr.dataset.q.includes(v); tr.style.display=ok?'table-row':'none'; if(ok) n++; }); nb.textContent=n+' projet'+(n>1?'s':''); };
    inp.oninput=filt; filt(); },
  refresh(ts){ if(hit(ts,'project','projectmember')) go('nx-mesprojets'); } };
/* domaines d'affaire en tuiles : groupes, icône, texte ; compteurs (tables chargées à la demande) */
const SG_PDOM_G=[['Équipe et adresses',['Intervenants','Soumissionnaires','Liste d’adresses']],['Suivi du projet',['Documents','Séances','Notes','Tâches','Frais']],
  ['Honoraires et facturation',['Offres d’honoraires','Contrats honoraires','Avancement des prestations','Factures']],   /* groupe « Planification » (Planification RH, Analyse de planification RH) retiré de la page du projet (21.10.2026) : Ressources humaines ▸ Planification RH */
  ['Chantier',['Calcul des coûts','Devis général','Soumission','Contrôle des coûts','Présentation du chantier','Documents du chantier']]];   /* Présentation et Documents ajoutés (21.10.2026) */
const SG_PDOM_GI={'Équipe et adresses':'users','Suivi du projet':'task','Honoraires et facturation':'receipt','Planification':'cal','Chantier':'crane'};
const SG_PDOM={'Présentation du chantier':['pdf','Les documents de présentation du chantier.'],'Documents du chantier':['folder','Les fichiers du chantier : contrôles des coûts, devis, soumissions, appels d’offres et réalisation.'],'Intervenants':['users','Les intervenants du projet et leur rôle.'],'Soumissionnaires':['group','Les entreprises invitées aux appels d’offres.'],
  'Liste d’adresses':['contacts','Les adresses des intervenants, à copier ou exporter.'],'Documents':['folder','Les fichiers joints du projet.'],
  'Séances':['cal','Séances, convocations et procès-verbaux.'],'Notes':['edit','Les notes du projet.'],'Tâches':['task','À faire, en cours, réglées.'],'Frais':['receipt','Frais et dépenses imputés au projet.'],
  'Offres d’honoraires':['calc','Calculs et offres d’honoraires.'],'Contrats honoraires':['contrat','Contrats, sous-traitants et échéancier.'],
  'Avancement des prestations':['gauge','Avancement des prestations par phase.'],'Factures':['receipt','Factures d’honoraires et encaissements.'],
  'Planification RH':['cal','Ressources prévues pour le projet.'],'Analyse de planification RH':['analyse','Prévu et réalisé.'],
  'Calcul des coûts':['ruler','Estimations du coût par éléments.'],'Devis général':['doc','Devis descriptifs par CFC.'],'Soumission':['mail','Appels d’offres aux entreprises.'],
  'Contrôle des coûts':['coins','Budget, adjudications et décomptes.']};
const SG_PDOM_T=['projectmember','projecttenderer','depotfichier','meetingsequence','meeting','projectnote','projecttask','projectcost','projectfee','projectcontract','projectinvoice',
  'costplanningdocument','costestimatedocument','devisdocument','costcontroldocument'];
function sgPdomCompte(p,d){ const by=t=>DS.by(t,'PROJECT_ID',p.ID), viv=L=>L.filter(x=>!+x.ISMARKEDASDELETED), pl=(n,s,s2)=>n+' '+(n>1?(s2||s+'s'):s);
  if(SG_DOCS_PAGES[d]) return pl(sgDocsCompte(p,d),'fichier');   // Documents / Présentation de Faisabilité et Chantier (21.10.2026)
  switch(d){
    case 'Intervenants': case 'Liste d’adresses': return pl(by('projectmember').length,'intervenant');
    case 'Soumissionnaires': return pl(by('projecttenderer').length,'entreprise');
    case 'Documents': return pl(DS.all('depotfichier').filter(f=>String(f.PROJECT_ID)===String(p.ID)||String(f.DOSSIER||'').startsWith('ProjectDocuments/Documents/'+p.ID+'/')).length,'fichier');
    case 'Séances': return pl(by('meetingsequence').reduce((s,x)=>s+DS.by('meeting','MEETINGSEQUENCE_ID',x.ID).length,0),'séance');
    case 'Notes': return pl(by('projectnote').length,'note');
    case 'Tâches': { const L=by('projecttask'), o=L.filter(t=>!t.DONEDATE).length; return o+' ouverte'+(o>1?'s':'')+' sur '+L.length; }
    case 'Frais': return pl(by('projectcost').length,'dépense');
    case 'Offres d’honoraires': return pl(by('projectfee').length,'offre');
    case 'Contrats honoraires': return pl(by('projectcontract').length,'contrat');
    case 'Factures': return pl(by('projectinvoice').length,'facture');
    case 'Calcul des coûts': return pl(viv(by('costplanningdocument')).length,'estimation');
    case 'Devis général': return pl(viv(by('costestimatedocument')).length,'devis','devis');
    case 'Soumission': return pl(viv(by('devisdocument')).length,'appel d’offres','appels d’offres');
    case 'Contrôle des coûts': return pl(viv(by('costcontroldocument')).length,'contrôle des coûts','contrôles des coûts');
  } return typeof sgPdomModuleCompte==='function'?sgPdomModuleCompte(p,d):''; }   /* tuiles des modules Projet / Faisabilité (bloc 21) */
/* domaines permis : droits de l'ancien logiciel (ch08bDomains), domaines utilisés au bureau, puis profil (honoraires, factures, chantier) */
function sgPdomListe(){ const ok=new Set(ch08bDomains(DOMAINS)), adm=sgAdmin();
  const hon=['Offres d’honoraires','Contrats honoraires','Avancement des prestations'], cha=['Calcul des coûts','Devis général','Soumission','Contrôle des coûts'];
  const prof=d=>adm||(hon.includes(d)?sgDroit('contrats','lecture'):d==='Factures'?sgDroit('factures','lecture'):cha.includes(d)?sgDroit('chantier','lecture'):d==='Documents'||SG_DOCS_PAGES[d]?sgDroit('documents','lecture'):true);
  return SG_PDOM_G.map(([g,L])=>[g,L.filter(d=>(d==='Documents'||SG_DOCS_PAGES[d]||(ok.has(d)&&domainUsed(d)))&&prof(d))]).filter(([,L])=>L.length); }
/* Frais d'un projet en pleine page (page du projet ▸ Suivi du projet ▸ Frais, 21.10.2026) : TOUS les frais du projet (le domaine du moteur n'en
   montrait qu'un mois), choix de l'année comme les Factures et les Heures (« Toutes · 2026 · 2025… », .sg-an, choix gardé sg3_frais_an, « Toutes »
   si le projet n'a pas de frais cette année-là, sans choix s'ils sont tous de la même année) ; mêmes colonnes et mêmes actions que le domaine du
   moteur (ajouter, modifier, supprimer : editCost / delCost), tri par date, la plus récente en tête, total. Le chapitre Affaires garde le domaine
   d'origine (mois par mois). */
function sgFraisModule(C,p){ const top=h('div',{class:'col',style:{flex:1,border:0}}), pane=h('div',{class:'pane'}), o={};
  const tous=()=>DS.by('projectcost','PROJECT_ID',p.ID), sel=h('span',{class:'sg-an sg-fr-an',role:'group','aria-label':'Année'});
  const draw=()=>{ const A=[...new Set(tous().map(r=>String(r.DATEYEAR||'')).filter(y=>/^\d{4}$/.test(y)))].sort().reverse(), s0=String(nxLS.get('sg3_frais_an','')||''), y=A.length>1&&A.includes(s0)?s0:'';
    const rows=tous().filter(r=>!y||String(r.DATEYEAR)===y);
    sel.replaceChildren(...(A.length>1?[['','Toutes'],...A.map(a=>[a,a])]:[]).map(([v,t])=>h('button',{class:v===y?'on':'','aria-pressed':String(v===y),title:v?'Frais de '+v:'Tous les frais du projet',onclick:()=>{ nxLS.set('sg3_frais_an',v); draw(); }},t)));
    grid(pane,Object.assign(o,{cols:[...COSTCOLS,{k:'col',t:'Collaborateur',w:140,f:r=>esc(staffName(DS.get('staff',r.STAFF_ID)))},{k:'ph',t:'Phase',w:140,f:r=>esc(nm(DS.get('projectphase',r.PHASE_ID)))}],
      rows,sort:['d',-1],onDbl:r=>editCost(r),empty:y?'Aucun frais en '+y+'.':'Aucun frais pour ce projet.'}));
    head.setCount((y?y+' · ':'Toutes les années · ')+rows.length+' frais · total '+num(rows.reduce((s0,r)=>s0+pcAmount(r),0))+' CHF'); };
  const head=phead([{i:'plus',fn:()=>editCost(null,{project:p.ID,date:new Date()})},{i:'edit',fn:()=>o.sel&&editCost(DS.get('projectcost',o.sel))},{i:'minus',fn:()=>o.sel&&delCost(DS.get('projectcost',o.sel))},sel],{count:1});
  top.append(head,pane); C.append(top); draw(); }
/* Documents et Présentation de Faisabilité et de Chantier (21.10.2026, demande de Paulo) : pages pleines (sgDocsModule avec filtre de dossier) —
   « Documents de la faisabilité » = tout le dossier Faisabilité (dépôt dans sa racine) ; « Documents du chantier » = contrôles des coûts, devis,
   calculs des coûts, soumissions (dossiers Construction/…), dossier Chantier et phases 41 à 53 du dossier Projet (dépôt dans Chantier) ;
   « Présentation du chantier » = dossier Chantier ▸ Présentation. Tuiles nommées « Documents » / « Présentation » dans leur groupe
   (SG_TUILE_LIB), comme « Présentation au client » (Faisabilité) et « Présentation client » (Projet) : mêmes dossiers, nom affiché seul. */
const SG_TUILE_LIB={'Documents de la faisabilité':'Documents','Documents du chantier':'Documents','Présentation du chantier':'Présentation','Présentation au client':'Présentation','Présentation client':'Présentation'};
const sgDosNfc=(p,...a)=>{ try{ return ch03aDossier('document',p.ID,...a).normalize('NFC'); }catch(_){ return null; } };
const SG_DOCS_PAGES={
  'Documents de la faisabilité':p=>{ const b=sgDosNfc(p,'Faisabilité'); return {fil:d=>!!b&&(d===b||d.startsWith(b+'/')),dos:()=>ch03aDossier('document',p.ID,'Faisabilité'),vide:'Aucun fichier dans la faisabilité.',ajout:'Ajouter des fichiers à la faisabilité'}; },
  'Documents du chantier':p=>{ const c=sgDosNfc(p,'Chantier'), pr=sgDosNfc(p,'Projet'); return {fil:d=>d.startsWith('Construction/')||(!!c&&(d===c||d.startsWith(c+'/')))||(!!pr&&/^\/[45]/.test(d.slice(pr.length))&&d.startsWith(pr+'/')),dos:()=>ch03aDossier('document',p.ID,'Chantier'),vide:'Aucun fichier du chantier.',ajout:'Ajouter des fichiers au chantier',
    phaseDlg:{titre:'Ajouter des fichiers au chantier',phases:[41,51,52,53],phase:41,rubriques:SG_TYPES_DLG,sansPhase:'Sans phase (dossier Chantier)',sansDos:()=>ch03aDossier('document',p.ID,'Chantier')}}; },
  'Présentation du chantier':p=>{ const c=sgDosNfc(p,'Chantier','Présentation'), pr=sgDosNfc(p,'Projet'); return {fil:d=>(!!c&&(d===c||d.startsWith(c+'/')))||(!!pr&&d.startsWith(pr+'/')&&/^\/[45]\d [^/]+\/Présentation client(\/|$)/.test(d.slice(pr.length))),dos:()=>ch03aDossier('document',p.ID,'Chantier','Présentation'),vide:'Aucune présentation du chantier.',ajout:'Ajouter des documents de présentation du chantier',
    phaseDlg:{titre:'Ajouter une présentation du chantier',phases:[41,51,52,53],phase:41,rubriques:[['Présentation client','Présentation']],rubrique:'Présentation client',sansPhase:'Sans phase (Chantier ▸ Présentation)',sansDos:()=>ch03aDossier('document',p.ID,'Chantier','Présentation')}}; }};   /* présentations par phase 41 à 53 (21.10.2026) */
const sgDocsCompte=(p,d)=>{ const o=SG_DOCS_PAGES[d](p); return DS.all('depotfichier').filter(f=>(String(f.PROJECT_ID)===String(p.ID)||String(f.DOSSIER).startsWith('ProjectDocuments/Documents/'+p.ID+'/'))&&o.fil(String(f.DOSSIER||'').normalize('NFC'))).length; };
/* Documents d'un projet en pleine page (page du projet ▸ Documents, 20.10.2026) : le moteur n'a pas de domaine Documents ; tous les fichiers du
   dépôt du projet par dossier (sgDossierLib), ajout de fichiers dans le dossier Général (droit « documents : dépôt ») */
function sgDocsModule(C,p,o){ DS.need(['depotfichier']).catch(()=>{}).then(()=>{ if(!C.isConnected) return;   /* o (21.10.2026) : {fil(dossier), dos(), vide, ajout} — Documents de la faisabilité, du chantier, Présentation du chantier */
  const L=DS.all('depotfichier').filter(f=>(String(f.PROJECT_ID)===String(p.ID)||String(f.DOSSIER).startsWith('ProjectDocuments/Documents/'+p.ID+'/'))&&(!o||o.fil(String(f.DOSSIER||'').normalize('NFC')))).sort((a,b)=>cmp(a.DOSSIER,b.DOSSIER)||cmp(a.NOM,b.NOM)), g={};
  L.forEach(f=>(g[f.DOSSIER]=g[f.DOSSIER]||[]).push(f));
  const lf=f=>'<div class="nx-row" data-sha="'+nxE(f.ID)+'">'+nxSvg(f.EXT==='pdf'?'pdf':'doc')+'<div class="t"><b>'+nxE(f.NOM)+'</b><span>'+nxE([f.TAILLE?(f.TAILLE/1024).toFixed(0)+' Ko':'',f.PAGES?f.PAGES+' p.':'',f.MODIFIED?dfr(String(f.MODIFIED).slice(0,10)):''].filter(Boolean).join(' · '))+'</span></div></div>';
  C.innerHTML='<div class="sg-docs-page"><div class="sg-htls sg-iacts">'+(sgDroit('documents','depot')?'<button data-act="ajout" title="'+nxE(o&&o.ajout||'Ajouter des fichiers au projet (dossier Général)')+'">'+nxSvg('plus')+'<span>Ajouter des fichiers</span></button>':'')+'</div>'
    +(L.length?Object.entries(g).map(([d,fs])=>'<div class="sg-rub"><div class="sg-rub-h">'+nxSvg('folder')+'<b>'+nxE(sgDossierLib(d))+'</b><span class="c">'+fs.length+'</span></div><div class="sg-rub-l">'+fs.map(lf).join('')+'</div></div>').join('')
      :'<div class="nx-empty">'+nxE(o&&o.vide||'Aucun fichier joint à ce projet.')+'</div>')+'</div>';
  C.querySelectorAll('[data-sha]').forEach(r=>r.onclick=()=>{ const f=DS.get('depotfichier',r.dataset.sha); if(f) ch03aOuvrir(f); });
  const b=C.querySelector('[data-act="ajout"]'); if(b&&(!o||o.phaseDlg)){ b.onclick=()=>sgDeposerDlg(p,Object.assign({titre:'Ajouter des fichiers',phases:[31,32,33,41,51,52,53],rubriques:SG_TYPES_DLG,rubrique:'Documents',sansPhase:'Sans phase (dossier Général)'},o&&o.phaseDlg||{},{apres:()=>sgDocsModule(C,p,o)})); }   /* choix de la phase (21.10.2026) */
  else if(b) b.onclick=()=>{ const d=o&&o.dos?o.dos():ch03aDossier('document',p.ID,'Général'), inp=h('input',{type:'file',multiple:true});
    inp.onchange=async()=>{ let n=0; for(const f of inp.files){ try{ await ch03aDeposer(d,f.name,f,{projet:p.ID,origine:'import'}); n++; }
        catch(e){ if(e.message==='existe'){ if(await confirmDlg('« '+f.name+' » existe déjà. Le remplacer ?','Remplacer')){ await ch03aDeposer(d,f.name,f,{projet:p.ID,origine:'import',remplacer:true}); n++; } } else toast('✗ '+f.name+' : '+e.message,true); } }
      if(n){ toast(n+' fichier'+(n>1?'s':'')+' ajouté'+(n>1?'s':'')+' à '+p.NUMBER+'.'); sgDocsModule(C,p,o); } };
    inp.click(); }; }); }
VIEWS['nx-pdom']={
  render(m,arg){ const [pid,dom,foc]=String(arg||'').split('|'), p=DS.get('project',pid); this.drawC=null;   /* foc : rubrique du module à montrer (bloc 21) */
    if(!p){ nxPage(m,'<div class="nx-empty">Projet introuvable. <a href="#" data-go="nx-mesprojets">Mes projets</a></div>'); return; }
    if(!sgProjetPermis(p.ID)){ VIEW.nxTitle='Projet non attribué'; nxPage(m,SG_NON_ATTRIBUE); return; }
    nxRecent('p',p.ID); const G0=sgPdomListe(), M=sgPdomModules(p), mods=M.map(([g])=>g), pick=n=>G0.filter(([g])=>g===n), G=[...pick('Honoraires et facturation'),...pick('Suivi du projet'),...M,...pick('Chantier'),...G0.filter(([g])=>!['Honoraires et facturation','Suivi du projet','Chantier'].includes(g))], doms=G0.flatMap(([,L])=>L);   /* ordre (21.10.2026) : Honoraires et facturation, Suivi du projet, Faisabilité, Projet, Chantier, puis les autres groupes */   /* M : modules Projet / Faisabilité en tête (bloc 21, 20.10.2026) */
    if(dom&&(mods.includes(dom)||doms.includes(dom)||(dom==='Documents de la faisabilité'&&mods.includes('Faisabilité')))){   /* + Documents de la faisabilité (21.10.2026) */                                              /* un domaine en pleine page (Documents : sgDocsModule, 20.10.2026) */
      VIEW.nxTitle=dom+' · '+(p.NUMBER||p.TITLE||'');
      const chips=h('div',{class:'sg-pdom-chips'},...[...mods,...doms].map(d=>h('button',{class:[d===dom?'on':'',mods.includes(d)?'mod':''].filter(Boolean).join(' ')||null,title:SG_PDOM[d]?SG_PDOM[d][1]:d,onclick:()=>go('nx-pdom',p.ID+'|'+d)},d)));
      const bar=h('div',{class:'sg-pdom-bar'},h('button',{class:'nx-btn',html:nxSvg('back')+'Domaines',onclick:()=>go('nx-pdom',p.ID+'|#'+G.findIndex(([g,L])=>g===dom||L.includes(dom)))}),
        h('b',{},(p.NUMBER?p.NUMBER+' · ':'')+(p.TITLE||'')),chips);
      const cols=h('div',{class:'cols'}), C=h('div',{class:'col fill'}); cols.append(C); m.append(bar,cols);
      const on=chips.querySelector('.on'); if(on) setTimeout(()=>on.scrollIntoView({block:'nearest',inline:'center'}),0);
      this.drawC=()=>{ C.innerHTML=''; const p2=DS.get('project',pid); if(p2){ if(mods.includes(dom)) sgPdomModulePage(C,p2,dom,foc); else if(dom==='Documents') sgDocsModule(C,p2); else if(dom==='Documents du chantier') sgPdomModulePage(C,p2,dom,foc); else if(SG_DOCS_PAGES[dom]) sgDocsModule(C,p2,SG_DOCS_PAGES[dom](p2));   /* Documents du chantier : phases 41 à 53 et types (21.10.2026) */ else if(dom==='Frais') sgFraisModule(C,p2); else domainView(C,p2,dom); } }; this.drawC(); return; }
    VIEW.nxTitle=(p.NUMBER?p.NUMBER+' · ':'')+(p.TITLE||'');                                        /* page du projet : groupes repliables de domaines */
    const ouvert=/^#\d+$/.test(dom||'')?+dom.slice(1):-1;                                            // 18.10.2026 : tout replié à l'arrivée ; au retour d'un domaine, son groupe ouvert
    const logs=DS.by('timelog','PROJECT_ID',p.ID), lim30=dayKey(new Date(Date.now()-30*864e5)), tot=logs.reduce((s,r)=>s+(+r.TIMEPERIOD||0),0),
      h30=logs.filter(r=>tlKey(r)>=lim30).reduce((s,r)=>s+(+r.TIMEPERIOD||0),0), mo=projMO(p), cat=sgCatProjet(p);
    const tuile=(d,g)=>{ const mod=mods.includes(g), x=(mod?SG_PMOD[d]:SG_PDOM[d])||['doc',''], fn=!mod||x[2]==='dom'?'dom':x[2]==='fz'?'fz':x[2]==='fiche'?'fzfiche':'mod';   /* tuiles des modules Projet / Faisabilité (bloc 21) */
      return '<div class="sg-tile" data-fn="'+fn+'" data-dom="'+nxE(d)+'"'+(fn==='mod'?' data-mod="'+nxE(x[2])+'"':'')+'><div class="ti">'+nxSvg(x[0])+'<h3>'+nxE(SG_TUILE_LIB[d]||d)+'</h3></div><div class="nb" data-nb="'+nxE(d)+'">…</div><p>'+nxE(x[1])+'</p><div class="ft">'+nxSvg('arrow','go')+'</div></div>'; };
    const info=[mo,p.LOCATION,p.PROJECTSTARTDATE?dfr(p.PROJECTSTARTDATE)+(p.PROJECTENDDATE?' → '+dfr(p.PROJECTENDDATE):''):''].filter(Boolean).map(nxE).join(' · ');
    const html='<div class="sg-split">'+sgIntro('Projet '+(p.NUMBER||''),nxE(p.TITLE||p.NUMBER||''),info,
        '<div class="sg-pdom-tags">'+nxStateTag(p)+(cat!=='architecture'?' <span class="nx-tag">'+SG_CAT_L[cat]+'</span>':'')+'</div>'
        +'<div class="acts"><button class="nx-btn pri" data-fn="fiche">'+nxSvg('gauge')+'Tableau de bord du projet</button><button class="nx-btn" data-fn="temps">'+nxSvg('timer')+'Saisir des heures</button>'
        +'<button class="nx-btn" data-go="nx-mesprojets">'+nxSvg('back')+'Mes projets</button></div>'   /* « Modifier le projet » retiré de la page du projet (19.10.2026) */
        +'<div class="sg-figs"><div class="sg-fig"><div class="n">'+nxH(tot)+'</div><div class="t">heures au total</div></div><div class="sg-fig"><div class="n">'+nxH(h30)+'</div><div class="t">heures, 30 derniers jours</div></div>'
          +((pa0=>sgTermine(p)?'<div class="sg-fig" title="'+nxE(sgEtatLib(p))+'"><div class="n txt">Terminé</div><div class="t">phase actuelle</div></div>':'<div class="sg-fig" title="D’après les heures saisies dans la feuille d’heures"><div class="n txt">'+(pa0?nxE(nm(pa0.ph)):'—')+'</div><div class="t">'+(pa0?'phase actuelle'+(pa0.sp?' : '+nxE(nm(pa0.sp)):'')+(pa0.recent?'':' (dernière saisie le '+dfr(diso(pa0.date))+')'):'phase actuelle : aucune heure saisie par phase')+'</div></div>')(sgPhaseActuelle(p)))
          +'</div>')   /* marge bénéficiaire retirée de la page du projet (19.10.2026, à la demande ; elle reste au tableau de bord) */
      +'<div class="sg-pgrps">'+(G.length?G.map(([g,L],i)=>'<section class="sg-pgrp'+(i===ouvert?' on':'')+'"><button class="sg-pgrp-h" data-fn="grp" aria-expanded="'+(i===ouvert)+'">'
          +nxSvg(SG_PDOM_GI[g]||'folder')+'<span class="t"><b>'+nxE(g)+'</b><small>'+L.map(d=>nxE(SG_TUILE_LIB[d]||d)).join(' · ')+'</small></span>'   /* nombre de domaines / modules retiré du titre du groupe (21.10.2026) */+nxSvg('next','chev')+'</button>'
          +'<div class="sg-tiles">'+L.map(d=>tuile(d,g)).join('')+'</div></section>').join(''):'<div class="nx-empty">Aucun domaine accessible avec votre profil.</div>')+'</div></div>';
    const pg=nxPage(m,html);
    Object.assign(pg._fn,{grp:b=>{ const x=b.closest('.sg-pgrp'), on=x.classList.toggle('on'); b.setAttribute('aria-expanded',String(on)); },dom:b=>{ const d=b.dataset.dom; /* Documents : page pleine (sgDocsModule) comme les autres domaines, depuis le retrait des onglets Documents et Projet (20.10.2026) */ go('nx-pdom',p.ID+'|'+d); },
      fiche:()=>go('nx-projet',p.ID),temps:()=>sgSaisieRapide({projet:p.ID}),
      mod:b=>go('nx-pdom',p.ID+'|'+b.dataset.mod+'|'+b.dataset.dom),fz:()=>go('nx-faisa',p.ID),fzfiche:()=>sgFaisaFiche(p)});   /* modules Projet / Faisabilité, Parcelle & règlements, fiche (bloc 21) */
    DS.need(SG_PDOM_T).catch(()=>{}).then(()=>{ if(!pg.isConnected) return; pg.querySelectorAll('[data-nb]').forEach(e=>{ const t=sgPdomCompte(p,e.dataset.nb)||'', x=/^(\d[\d']*)\s*(.*)$/.exec(t);
      e.innerHTML=x?'<span class="v">'+nxE(x[1])+'</span><small>'+nxE(x[2])+'</small>':nxE(t); }); }); },   // chiffre en grand, libellé en petit
  refresh(ts){ if(this.drawC){ this.drawC(); return; } if(hit(ts,'project','timelog',...SG_PDOM_T)) go('nx-pdom',VIEW.arg); } };
/* chapitre Affaires : écrans du moteur sous d'autres identifiants (état propre à chaque écran : Object.create), mêmes droits */
[['affd-gestion','aff-gestion'],['affd-controlling','aff-controlling'],['affd-mes','aff-mes'],['affd-toutes','aff-toutes']].forEach(([a,b])=>{ if(VIEWS[b]) VIEWS[a]=Object.create(VIEWS[b]); });
/* Affaires ▸ Gestion amélioré (22.10.2026, choix de Paulo : « colonnes utiles » et « fiche à droite ») — mêmes outils que l'écran de l'ancien
   logiciel (aff-gestion, barre reprise telle quelle : nouvelle affaire, éditer, intervenants, configuration, subdivisions, modèles, documents,
   fonctions, filtre) ; colonnes Catégorie, Phase actuelle (feuille d'heures, sgPhaseActuelle), Dernière saisie, Heures 30 j et point d'activité
   (heures saisies ces 30 jours, au lieu de « Actif ») ; fiche de l'affaire sélectionnée à droite (état, maître d'ouvrage, dates, phase, heures,
   équipe, contrats reliés, actions). Projets ▸ Registre garde l'écran d'origine. */
/* « Fiche projet » de l'en-tête dans Affaires ▸ Gestion : ouvre la fenêtre à droite au lieu de quitter la liste (22.10.2026) */
/* frise des heures (20.10.2026, proposition F) : mois de la première et de la dernière heure introduites dans l'app, petite frise, durée
   comptée du premier au dernier mois (« 1 an 11 mois ») ; dates exactes en infobulle ; rien sans heure — tableau de bord du projet et fiche
   de l'affaire (Affaires ▸ Gestion, 23.10.2026) */
function sgFriseHeures(T){ if(!T.length) return ''; let a=T[0], b=T[0]; T.forEach(r=>{ const k=tlKey(r); if(k<tlKey(a)) a=r; if(k>tlKey(b)) b=r; });
          const mm=r=>String(+r.TIMEMONTH+1).padStart(2,'0')+'.'+r.TIMEYEAR, d1=mm(a), d2=mm(b), n=(+b.TIMEYEAR*12+ +b.TIMEMONTH)-(+a.TIMEYEAR*12+ +a.TIMEMONTH)+1;
          const an=Math.floor(n/12), mo=n%12, duree=(an?an+' an'+(an>1?'s':''):'')+(an&&mo?' ':'')+(mo||!an?mo+' mois':'');
          return '<div class="sg-mandat" title="'+nxE('Première heure saisie le '+dfr(diso(tlDate(a)))+', dernière le '+dfr(diso(tlDate(b)))+' — '+n+' mois')+'"><b>'+d1+'</b>'   /* 20.10.2026 : sans le libellé « Mandat », durée centrée sous la frise */
            +(d1===d2?'<span class="d">'+duree+'</span>':'<span class="sg-frise"><em>'+duree+'</em></span><b>'+d2+'</b>')+'</div>'; }
/* adresses d'une affaire (23.10.2026, demande de Paulo) — d'abord le contrat (ou l'offre) d'honoraires Facturation le plus récent qui les donne :
   adresse d'affaire = adresse du projet (padr, ploc), maître de l'ouvrage = client (nom, adr, loc) ; sans contrat : adresse d'affaire choisie
   (CONTACT1_ID) et maître de l'ouvrage = intervenant « Maître d'ouvrage » (rôle 8, o.moId = choix en cours) ; adresse de facturation AUTOMATIQUE =
   nom du maître de l'ouvrage + « p.a. Substances Architectes Sàrl » + adresse du bureau (sans maître de l'ouvrage : adresse enregistrée
   CONTACT2_ID) ; lieu de dépôt des offres = CONTACT4_ID ; l'adresse de livraison (CONTACT3_ID) n'est plus affichée : c'est l'adresse d'affaire */
function sgBureauAdresse(){ const c=DS.all('contact').filter(x=>/^substances architectes/i.test(contactName(x))).sort((a,b)=>(!b.STREET)-(!a.STREET))[0];
  if(!c) return {nom:'Substances Architectes Sàrl',lignes:['Rue de la Gare 12','1096 Cully']};
  return {nom:contactName(c),lignes:adrLines(c).filter(x=>x!==c.NAME1&&x!==c.NAME2&&x!==c.NAME3)}; }
/* nom d'une adresse tel qu'il y est écrit (« Famille Queloz », « Marianne Converset »), sans les formules de politesse seules sur leur ligne */
const SG_SALUT=/^(madame|monsieur|mesdames|messieurs|madame,? monsieur|madame et monsieur|monsieur et madame|mme|m\.|mm\.)$/i;
const sgNomAdresse=c=>c?([c.NAME1,c.NAME2,c.NAME3].map(x=>String(x||'').trim()).filter(x=>x&&!SG_SALUT.test(x)).join(' ')||contactName(c)):'';
const sgLocMaj=v=>String(v||'').trim().replace(/^(\d{4}\s+)(\p{Ll})/u,(m,a,b)=>a+b.toUpperCase());
function sgAdressesAffaire(p,D,o){ o=o||{}; const t=v=>String(v||'').trim(), ctc=id=>id!=null?DS.get('contact',id):null, R={};
  const cs=D&&p?sgContratsDuProjet(p,D).filter(c=>!c.annule).map(c=>({c,d:String(sgContratInfo(c).date||'')})).sort((a,b)=>cmp(b.d,a.d)).map(x=>x.c):[];
  const ca=cs.find(c=>t(c.padr)||t(c.ploc)), c1=ctc(p&&p.CONTACT1_ID);
  R.affaire=ca?{lignes:[t(ca.padr),sgLocMaj(ca.ploc)].filter(Boolean),src:'contrat',ctr:ca.id}:c1?{lignes:adrLines(c1),src:'choisie',id:c1.ID}:{lignes:[],src:''};
  const cm=cs.find(c=>t(c.nom)), m8=p&&p.ID!=null?svMember(p,8):null, c8=ctc(o.moId!=null?o.moId:m8&&m8.CONTACT_ID);
  R.mo=cm?{nom:t(cm.nom),lignes:[t(cm.nom),t(cm.adr),sgLocMaj(cm.loc)].filter(Boolean),src:'contrat',ctr:cm.id}
    :c8?{nom:sgNomAdresse(c8),lignes:adrLines(c8),src:o.moId!=null?'choisie':'intervenant',id:c8.ID}:{nom:'',lignes:[],src:''};
  const b=sgBureauAdresse(), c2=ctc(p&&p.CONTACT2_ID);
  R.fact=R.mo.nom?{lignes:[R.mo.nom,'p.a. '+b.nom,...b.lignes],src:'auto'}:c2?{lignes:adrLines(c2),src:'choisie',id:c2.ID}:{lignes:[],src:''};
  /* adresse retour des offres (ex-« lieu de dépôt des offres », renommée le 23.10.2026) = Substances Architectes, identique à l'adresse de facturation (23.10.2026, demande de Paulo) ; sans maître de
     l'ouvrage : l'adresse du bureau ; CONTACT4_ID n'est plus utilisé (gardé tel quel) */
  R.depot=R.fact.src==='auto'?{lignes:R.fact.lignes.slice(),src:'auto'}:{lignes:[b.nom,...b.lignes],src:'auto'};
  R.contrats=cs.length; return R; }
const SG_ADR_SRC=x=>x.src==='contrat'?'contrat '+x.ctr:x.src==='auto'?'automatique':x.src==='intervenant'?'intervenant de l’affaire':'';
/* fiche de l'affaire ▸ Adresses (lecture) : mêmes règles ; redessinée quand la Facturation est chargée (#sg-ag-adr) */
function sgFicheAdresses(p,D){ const E=nxE, A=sgAdressesAffaire(p,D), L=[['Adresse d’affaire',A.affaire],['Maître de l’ouvrage',A.mo],['Adresse de facturation',A.fact],['Adresse retour des offres',A.depot]].filter(([,x])=>x.lignes.length);
  return '<div class="sg-ag-sec" id="sg-ag-adr"><h5>Adresses</h5>'+(L.length?'<dl>'+L.map(([l,x])=>'<dt>'+E(l)+(SG_ADR_SRC(x)?'<small>'+E(SG_ADR_SRC(x))+'</small>':'')+'</dt><dd>'+x.lignes.map(E).join('<br>')+'</dd>').join('')+'</dl>':'<p class="sg-ag-vide">Aucune adresse.</p>')+'</div>'; }
/* fiche complète d'une affaire en lecture (22.10.2026, demande de Paulo) : rubriques de la fenêtre « Éditer l'affaire » de l'ancien logiciel —
   Affaire, Genres d'affaire, Délais, Adresses, Références, Paramètres de saisie. 23.10.2026 : placée juste sous le titre de l'affaire ; numéro,
   désignation et statut retirés (ils sont dans l'en-tête) ; rubriques vides omises ; adresse identique à l'adresse d'affaire signalée comme
   telle ; paramètres de saisie en petit tableau (heures / frais × phase, subdivision, description) ; modification par « Éditer » */
function sgFicheAffaire(p){ const E=nxE, d=v=>v?dfr(v):'', t=v=>v==null?'':String(v).trim();
  const sec=(titre,L)=>{ const R=L.filter(([,v])=>t(v)!==''); return R.length?'<div class="sg-ag-sec"><h5>'+E(titre)+'</h5><dl>'+R.map(([l,v,html])=>'<dt>'+E(l)+'</dt><dd>'+(html?v:E(v))+'</dd>').join('')+'</dl></div>':''; };
  const ph=p.CURRENTPROJECTPHASE_ID?DS.get('projectphase',p.CURRENTPROJECTPHASE_ID):null, kinds=DS.by('project_projectkind','PROJECT_ID',p.ID).map(l=>DS.get('projectkind',l.PROJECTKINDS_ID)).filter(Boolean);
  const ok=v=>+v?'<span class="sg-ag-oui" title="Obligatoire">'+nxSvg('check')+'</span>':'<span class="sg-ag-non" title="Facultatif">–</span>';
  return '<section class="sg-ag-bloc"><h4>Fiche de l’affaire</h4>'
    +sec('Affaire',[['Complément',p.DESCRIPTION],/* « Type d'affaire » (interne / externe) retiré à la demande (23.10.2026) */['Phase en cours (affaire)',ph?(ph.NUMBER!=null?ph.NUMBER+' ':'')+nm(ph):''],['Tri',p.SORTLABEL],
      ['Indice ICC',+p.BASISINDEX?num(+p.BASISINDEX,1):''],['Volume construit',+p.VOLUME?num(+p.VOLUME,0)+' m³':''],['Surface de plancher',+p.AREA?num(+p.AREA,0)+' m²':'']])
    +(kinds.length?'<div class="sg-ag-sec"><h5>Genres d’affaire</h5><div class="sg-ag-chips">'+kinds.map(k=>'<span class="nx-tag">'+E(nm(k))+'</span>').join('')+'</div></div>':'')
    /* rubrique « Délais » retirée à la demande (23.10.2026) */
    +sgFicheAdresses(p,typeof fxData==='function'?fxData():null)   /* adresses d'après le contrat, MO, facturation automatique (23.10.2026) */
    +sec('Références',[['N° d’affaire externe',p.EXTERNALNUMBER],['District',p.LOCATION],['Zone / quartier',p.PLOT],['N° registre foncier',p.LANDREGISTERNR],['Service comptabilité',p.ACCOUNTINGAREA],['Dossier d’affaire',p.PROJECTFOLDER]])
    +'<div class="sg-ag-sec"><h5>Paramètres de saisie</h5>'+(t(p.CURRENCY)?'<dl><dt>Monnaie</dt><dd>'+E(p.CURRENCY)+'</dd></dl>':'')
    +'<table class="sg-ag-par"><tr><th>Obligatoire</th><th>Phase</th><th>Subdivision</th><th>Description</th></tr><tr><td>Heures</td><td>'+ok(p.ISTIMEPHASEMANDATORY)+'</td><td>'+ok(p.ISTIMESUBPROJECTMANDATORY)+'</td><td>'+ok(p.ISTIMEDESCMANDATORY)+'</td></tr>'
    +'<tr><td>Frais</td><td>'+ok(p.ISEXPENSESPHASEMANDATORY)+'</td><td></td><td>'+ok(p.ISEXPENSESDESCMANDATORY)+'</td></tr></table></div></section>'; }
/* équipe d'une affaire (23.10.2026, demande de Paulo) : TOUS les collaborateurs attribués à l'affaire (intervenants dont la personne de contact
   est un collaborateur du bureau, comme « Mes projets »), même sans heure saisie, + ceux qui ont saisi des heures sans être attribués (« hors
   équipe ») ; fonction de l'intervenant (PROJECTROLE) ; collaborateur parti signalé ; du plus d'heures au moins d'heures, puis par nom */
function sgEquipeAffaire(p,st){ st=st||{}; const parP={}, M=new Map(), auj=new Date().toISOString().slice(0,10);
  DS.all('staff').forEach(s=>{ if(s.PERSON_ID!=null) parP[String(s.PERSON_ID)]=s; });
  DS.by('projectmember','PROJECT_ID',p.ID).forEach(x=>{ const s=parP[String(x.RESPCONTACT_ID)]||parP[String(x.CONTACT_ID)]; if(!s) return; const e=M.get(String(s.ID))||{s,att:true,fn:''}; if(!e.fn&&x.PROJECTROLE) e.fn=String(x.PROJECTROLE).trim(); M.set(String(s.ID),e); });
  Object.keys(st).forEach(id=>{ if(!M.has(String(id))){ const s=DS.get('staff',id); if(s) M.set(String(id),{s,att:false,fn:''}); } });
  return [...M.values()].map(e=>Object.assign(e,{h:+st[e.s.ID]||+st[String(e.s.ID)]||0,parti:+e.s.ISACTIVE===0||(!!e.s.QUITTINGDATE&&String(e.s.QUITTINGDATE).slice(0,10)<auj)}))
    .sort((a,b)=>b.h-a.h||cmp(staffName(a.s),staffName(b.s))); }
/* rapport des heures d'un collaborateur sur une affaire (23.10.2026, demande de Paulo : clic sur une personne de l'équipe de la fiche affaire) :
   fenêtre au graphisme de l'onglet Heures du projet — tuiles (heures saisies, dont facturables, ces 30 jours, première et dernière saisie),
   affichage Par phase (ordre SIA 102, phases partielles dessous) · Par mois · Détail des saisies (choix mémorisé sg3_rap_vue), années
   « Toutes · 2026 · 2025… » (tuiles comprises) ; CSV et Imprimer du tableau affiché ; « Fiche du collaborateur » */
function sgRapportHeuresCollab(p,sid){ const s=DS.get('staff',sid); if(!p||!s) return; const E=nxE, nom=staffName(s);
  const T=DS.by('timelog','PROJECT_ID',p.ID).filter(r=>String(r.STAFF_ID)===String(s.ID)).sort((a,b)=>cmp(tlKey(b),tlKey(a)));
  const ans=[...new Set(T.map(r=>tlDate(r).getFullYear()))].sort((a,b)=>b-a);
  let an='', vue=nxLS.get('sg3_rap_vue','phase'); if(!['phase','mois','det'].includes(vue)) vue='phase';
  const VUES=[['phase','Phase','escalier','Par phase'],['mois','Mois','cal','Par mois'],['det','Détail','list','Détail des saisies']];
  const kt=(ico,l,v,ti,cls)=>nxKpi(ico,l,v).replace('<div class="nx-kpi"','<div class="nx-kpi" title="'+E(ti||'')+'"').replace('<div class="v">','<div class="v'+(cls?' '+cls:'')+'">');
  const body=h('div',{class:'sg-rap'});
  const dessiner=()=>{ const L=an?T.filter(r=>tlDate(r).getFullYear()===+an):T, H=r=>+r.TIMEPERIOD||0, tot=L.reduce((a,r)=>a+H(r),0), hf=L.reduce((a,r)=>a+(+r.ISCHARGEABLE?H(r):0),0);
    const lim=dayKey(new Date(Date.now()-30*864e5)), h30=L.filter(r=>tlKey(r)>=lim).reduce((a,r)=>a+H(r),0), pct=v=>tot?(v>0&&v/tot<.005?'&lt; 1':Math.round(v/tot*100))+' %':'';
    const d1=L.length?dfr(diso(tlDate(L[L.length-1]))):'', d2=L.length?dfr(diso(tlDate(L[0]))):'';
    let tab;
    if(!L.length) tab='<div class="nx-empty">Aucune heure saisie'+(an?' en '+an:'')+' sur cette affaire.</div>';
    else if(vue==='phase'){ const G=sgPhasesHier(L), lig=(x,sub)=>'<tr'+(sub?' class="sub"':'')+'><td>'+(sub?E(x.t):'<b>'+E(x.t)+'</b>')+'</td><td class="r">'+nxH(x.h)+'</td><td class="r">'+nxH(x.hf)+'</td><td style="width:130px">'+sgBarre(tot?x.h/tot:0,sub?'var(--s-nuit2)':null)+' '+pct(x.h)+'</td><td class="r">'+x.n+'</td></tr>';
      tab='<table class="nx-tbl sg-sit sg-sit-h"><tr><th>Phase</th><th class="r">Heures</th><th class="r">dont facturables</th><th>Part</th><th class="r">Saisies</th></tr>'
        +G.map(x=>lig(x)+(x.subs.length&&!(x.subs.length===1&&(x.subs[0].k==='s-'||x.t.replace(/^[^·]*·\s*/,'')===x.subs[0].t))?x.subs.map(y=>lig(y,1)).join(''):'')).join('')
        +'<tr class="tot"><td>Total</td><td class="r">'+nxH(tot)+'</td><td class="r">'+nxH(hf)+'</td><td></td><td class="r">'+L.length+'</td></tr></table>'; }
    else if(vue==='mois') tab='<table class="nx-tbl sg-sit"><tr><th>Mois</th><th class="r">Heures</th><th class="r">dont facturables</th><th>Part</th><th class="r">Saisies</th></tr>'
        +sgGrouper(L,'mois').map(x=>'<tr><td><b>'+E(x.t)+'</b></td><td class="r">'+nxH(x.h)+'</td><td class="r">'+nxH(x.hf)+'</td><td style="width:130px">'+sgBarre(tot?x.h/tot:0)+' '+pct(x.h)+'</td><td class="r">'+x.n+'</td></tr>').join('')
        +'<tr class="tot"><td>Total</td><td class="r">'+nxH(tot)+'</td><td class="r">'+nxH(hf)+'</td><td></td><td class="r">'+L.length+'</td></tr></table>';
    else tab='<table class="nx-tbl sg-htbl"><tr><th>Date</th><th>Phase</th><th>Phase partielle</th><th>Commentaire</th><th class="r">Durée</th></tr>'
        +L.map(r=>{ const f=r.PHASE_ID!=null?DS.get('projectphase',r.PHASE_ID):null, sp=r.SUBPHASE_ID!=null?DS.get('projectsubphase',r.SUBPHASE_ID):null;
          return '<tr><td>'+dfr(diso(tlDate(r)))+'</td><td>'+E(f?nm(f):'')+'</td><td class="sg-hsp">'+E(sp?nm(sp):'')+'</td><td class="sg-hact">'+E(String(r.DESCRIPTION||'').trim())+'</td><td class="r"><b>'+nxH(r.TIMEPERIOD)+' h</b></td></tr>'; }).join('')
        +'<tr class="tot"><td>Total</td><td></td><td></td><td></td><td class="r">'+nxH(tot)+' h</td></tr></table>';
    const titre={phase:'Heures par phase',mois:'Heures par mois',det:'Saisies'}[vue]+(an?' · '+an:'');
    const selAn=ans.length>1?'<span class="sg-an" role="group" aria-label="Année">'+[['','Toutes']].concat(ans.map(y=>[String(y),String(y)])).map(([v,t])=>{ const on=v===an; return '<button data-an="'+v+'" class="'+(on?'on':'')+'" aria-pressed="'+on+'" title="'+(v?'Heures de '+v+' (tuiles comprises)':'Toutes les heures')+'">'+t+'</button>'; }).join('')+'</span>':'';
    const acts=selAn+(L.length?'<span class="a sg-ha" data-rf="csv" title="Exporter le tableau en CSV">'+nxSvg('export')+'CSV</span><span class="a sg-ha" data-rf="prn" title="Imprimer le rapport">'+nxSvg('print')+'Imprimer</span>':'');
    body.innerHTML='<div class="sg-rap-h"><span class="nx-av">'+E(nxIni(nom))+'</span><div><b>'+E(nom)+'</b><span>'+E(p.NUMBER||'')+' · '+E(p.TITLE||'')+'</span></div></div>'
      +'<div class="nx-kpis sg-pkpis sg-rap-k">'+kt('clock','Heures saisies',sgHr(tot)+'<small>h</small>',nxH(tot)+' h saisies'+(an?' en '+an:''))
        +kt('contrat','Dont facturables',sgHr(hf)+'<small>h</small>',tot?Math.round(hf/tot*100)+' % des heures saisies':'')
        +kt('cal','Ces 30 jours',sgHr(h30)+'<small>h</small>','Heures saisies ces 30 derniers jours')
        +kt('clock','Première saisie',d1||'—','','dt')+kt('clock','Dernière saisie',d2||'—','','dt')+'</div>'
      +'<div class="sg-htls sg-rap-v">'+VUES.map(([k,t,ic,ti])=>'<button data-vue="'+k+'" class="'+(k===vue?'on':'')+'" title="'+E(ti)+'">'+nxSvg(ic)+'<span>'+t+'</span></button>').join('')+'</div>'
      +nxCard('c12 sg-hcard',E(titre),'<div class="b flush sg-hscroll">'+tab+'</div>',acts);
    body.querySelectorAll('[data-an]').forEach(b=>b.onclick=()=>{ an=b.dataset.an; dessiner(); });
    body.querySelectorAll('[data-vue]').forEach(b=>b.onclick=()=>{ vue=b.dataset.vue; nxLS.set('sg3_rap_vue',vue); dessiner(); });
    const tb=()=>body.querySelector('.sg-hscroll table'), c=body.querySelector('[data-rf="csv"]'), pr=body.querySelector('[data-rf="prn"]');
    if(c) c.onclick=()=>{ const t=tb(); if(t) sgCsvTable(t,'Heures_'+(p.NUMBER||'')+'_'+nom.replace(/\s+/g,'_')+(an?'_'+an:'')+'.csv'); };
    if(pr) pr.onclick=()=>{ const t=tb(); if(t) sgImprimer('Heures de '+nom+' — '+(p.NUMBER||'')+' '+(p.TITLE||''),'<p>'+E(titre)+' · '+nxH(tot)+' h, dont '+nxH(hf)+' h facturables'+(L.length?' · du '+d1+' au '+d2:'')+'</p>'+t.outerHTML); }; };
  dessiner();
  dialog({title:'Rapport des heures',width:'min(940px,95vw)',body,buttons:[{t:'Fiche du collaborateur',fn:()=>{ nxOpenRef('s:'+s.ID); }},{t:'Fermer',pri:true}]}); }
/* étendue d'un contrat d'honoraires (23.10.2026, demande de Paulo : « devant Contrat, indiquer enquête, exécution, faisabilité… ; pas besoin de toutes
   les phases : signé jusqu'au projet → Projet, jusqu'à l'enquête → Enquête ») = DERNIÈRE phase partielle SIA 102 du contrat (prestations > 0 %) ;
   sans phase : Faisabilité si c'est un contrat de faisabilité (sgContratFaisa), sinon rien ; liste des phases en infobulle */
const SG_ETENDUE={11:'Besoins',21:'Faisabilité',22:'Concours',31:'Avant-projet',32:'Projet',33:'Enquête',41:'Appel d’offres',51:'Exécution',52:'Exécution',53:'Exécution'};
/* 23.10.2026 (« lorsque le mandat est à 100 %, indiquer Mandat complet ») : 1) « Statut du contrat » saisi dans Facturation (c.statutContrat :
   Faisabilité, Expertise, Avant-projet, Projet, Enquête, Appels d'offre, Exécution, DA, Mandat complet) — le choix du bureau prime ; 2) prestations
   SIA à 100 % (somme des % des phases ≥ 99,5) → « Mandat complet » ; 3) dernière phase partielle ; 4) faisabilité ; 5) mots de l'intitulé */
function sgContratEtendue(c){ let mx=0, som=0; Object.entries((c&&c.phases)||{}).forEach(([k,v])=>{ som+=+v||0; const m=/^4(\d)(\d)/.exec(k); if(m&&+v>0) mx=Math.max(mx,+(m[1]+m[2])); });
  const ph=sgContratPhLib(c), st=String((c&&c.statutContrat)||'').trim();
  if(st) return {lib:st, titre:'Statut du contrat (Facturation)'+(ph?' — '+ph:'')};
  if(som>=99.5) return {lib:'Mandat complet', titre:'Prestations SIA 102 à '+num(som,som%1?1:0)+' %'+(ph?' — '+ph:'')};
  if(mx) return {lib:SG_ETENDUE[mx]||SG_SIA_NOM[Math.floor(mx/10)]||'Phase '+mx, titre:'Contrat jusqu’à la phase '+mx+' — '+ph};
  if(sgContratFaisa(c)) return {lib:'Faisabilité',titre:'Contrat de faisabilité'};
  /* contrats de l'ancien formulaire (aucune phase enregistrée) : mots de l'intitulé ou du code, signalé en infobulle (23.10.2026) */
  const t=String(c.projet||'')+' '+String(c.id||''), r=SG_ETENDUE_MOTS.find(([re])=>re.test(t));
  return r?{lib:r[1],titre:'D’après l’intitulé du contrat (aucune phase enregistrée)'}:{lib:'',titre:''}; }
const SG_ETENDUE_MOTS=[[/expertise/i,'Expertise'],[/demande d.autorisation|mise à l.enqu[eê]te|\benqu[eê]te\b/i,'Enquête'],[/appel d.offres|soumission/i,'Appel d’offres'],
  [/concours/i,'Concours'],[/avant[- ]projet/i,'Avant-projet'],[/direction des travaux|\.DT\b/i,'Exécution']];
/* contrats d'honoraires d'une affaire pour sa fiche (23.10.2026, demande de Paulo) : par contrat — document (contrat / avenant), état
   (Brouillon / Envoyé / Signé le … / Terminé / Annulé), date du contrat, date de signature, type de rémunération (forfait relatif / forfait /
   unitaire), phases SIA, honoraires HT et TTC, tarif horaire brut, rabais, facturé (TTC sans frais, % du contrat), versions ; « Ouvrir » = PDF
   de la dernière version (comme l'onglet Contrat du projet) ; montants masqués si les finances sont verrouillées ; annulés à la fin */
function sgAgContrats(p,D){ const E=nxE, fin=!sgFinVerrou();
  if(!D) return '<p class="sg-ag-vide">Contrats indisponibles : la Facturation n’est pas chargée.</p>';
  /* ordre chronologique : premier contrat, puis le 2e, etc. (date du contrat, annulés compris ; 23.10.2026, demande de Paulo — avant : du plus récent
     au plus ancien, annulés à la fin) ; sans date : à la fin, puis par code */
  const cs=sgContratsDuProjet(p,D).map(c=>({c,ci:sgContratInfo(c)})).sort((a,b)=>(!a.ci.date-!b.ci.date)||cmp(String(a.ci.date||''),String(b.ci.date||''))||cmp(String(a.c.id),String(b.c.id)));
  if(!cs.length) return '<p class="sg-ag-vide">Aucun contrat d’honoraires relié à cette affaire.</p>';
  const tva=c=>(+c.tva||8.1)/100, ttcF=f=>+f._ttc||+f.ttc||0, fraisF=f=>'_fttc' in f?+f._fttc||0:+f.fttc||0, li=(l,v,ti)=>v?'<dt>'+E(l)+'</dt><dd'+(ti?' title="'+E(ti)+'"':'')+'>'+v+'</dd>':'';
  return cs.map(({c,ci})=>{ const ht=+c.hht||(+c.httc||0)/(1+tva(c)), tt=+c.httc||(+c.hht||0)*(1+tva(c)), fs=D.f.filter(f=>f.contrat_id===c.id&&!/annul/i.test(f.statut||'')), fa=fs.reduce((s0,f)=>s0+ttcF(f),0), fr=fs.reduce((s0,f)=>s0+fraisF(f),0);
    /* contrat repliable (23.10.2026, demande de Paulo « permettre de réduire les contrats ») : clic sur l'en-tête ; réduit = une ligne de résumé
       (date, type, honoraires TTC) ; contrats réduits mémorisés (sg3_ag_ctr_red, identifiants des contrats) */
    /* réduit : résumé type · honoraires TTC, sans la date (23.10.2026, demande de Paulo) ; devant « Contrat » / « Avenant » : l'étendue du contrat */
    const red=SG_AG.reduits().has(String(c.id)), res=[ci.remu,fin&&tt?nxCHF(tt)+' TTC':''].filter(Boolean).join(' · '), et=sgContratEtendue(c);
    return '<div class="sg-ag-ct'+(c.annule?' ann':'')+(red?' red':'')+'" data-ct="'+E(c.id)+'"><div class="h" data-ctr="'+E(c.id)+'" role="button" tabindex="0" aria-expanded="'+!red+'" title="'+(red?'Déplier':'Réduire')+' ce contrat">'+nxSvg('next','chev')
      /* étendue seule (« Enquête », « Exécution »…) : le mot « Contrat » après l'étendue est retiré (23.10.2026, demande de Paulo) ; « Avenant » reste affiché */
      +(et.lib?'<b class="et" title="'+E(et.titre)+'">'+E(et.lib)+'</b>'+(ci.avenant?'<span class="nat"'+(ci.nTitre?' title="'+E(ci.nTitre)+'"':'')+'>Avenant</span>':''):'<b'+(ci.nTitre?' title="'+E(ci.nTitre)+'"':'')+'>'+E(ci.nature)+'</b>')
      +'<span class="nx-tag '+ci.cl+'">'+E(ci.etat)+'</span><span class="res">'+E(res)+'</span>'
      +'<button class="sg-ag-ouv" data-go="fx-contrats" data-arg="cv:'+E(c.id)+'" title="Afficher le contrat en PDF : dernière version (contrat signé ou dernier avenant)">'+nxSvg('pdf')+'<span>Ouvrir</span></button></div>'
      +(ci.com?'<div class="com">'+E(ci.com)+'</div>':'')
      +'<dl>'+li('Date du contrat',ci.date?dfr(ci.date):'—',ci.dTitre)+li('Signé le',ci.signeLe?dfr(ci.signeLe):c.signe?'signé, date non enregistrée':'non signé')
      +li('Type',E(ci.remu),ci.rTitre)   /* ligne « Phases » retirée (23.10.2026) : l'étendue est devant « Contrat », la liste des phases en infobulle */
      +(fin?li('Honoraires',ht||tt?nxCHF(ht)+' HT · <b>'+nxCHF(tt)+'</b> TTC':'—')+li('Tarif horaire brut',ci.tarif!=null?'Fr. '+num(ci.tarif,2)+' / h':'—',ci.tTitre)+li('Rabais',ci.rabais!=null?num(ci.rabais,ci.rabais%1?1:0)+' %':'—')
        /* facturé : honoraires et frais séparés (23.10.2026, demande de Paulo) — honoraires = _ttc (comme le cockpit et sgRenta), frais = _fttc
           (montant net de la facture), sinon fttc ; % = honoraires facturés / honoraires TTC du contrat */
        +(fs.length?li('Honoraires facturés','<b>'+nxCHF(fa)+'</b> TTC'+(tt?' · '+Math.round(fa/tt*100)+' %':''),tt?'Honoraires facturés (sans les frais) : '+Math.round(fa/tt*100)+' % des honoraires TTC du contrat':'')
          +li('Frais facturés',fr?'<b>'+nxCHF(fr)+'</b> TTC':'aucun frais')+li('Factures',fs.length+' facture'+(fs.length>1?'s':''),'Total facturé : '+nxCHF(fa+fr)+' TTC (honoraires et frais)'):li('Facturé','aucune facture')):'')
      +li('Versions',ci.versions>1?E(ci.nTitre):'')+'</dl></div>'; }).join('')
    +(fin?'':'<p class="sg-ag-vide">Montants masqués : finances verrouillées.</p>'); }
const SG_AG={ouvrir:null,aller:null,reduits:()=>new Set((nxLS.get('sg3_ag_ctr_red',[])||[]).map(String))};
/* bouton « Fiche projet … » de l'en-tête retiré de la liste des affaires (23.10.2026, demande de Paulo) : la fiche s'ouvre en choisissant une affaire,
   et un clic sur l'affaire déjà choisie la rouvre si elle a été fermée */
{ const s0=sgCtxSync; sgCtxSync=function(){ s0.apply(this,arguments); const b=document.getElementById('sg-ctx'); if(b&&b.innerHTML&&VIEW&&VIEW.id==='affd-gestion'){ b.innerHTML=''; nxSubSync(); } }; }
/* ⌥↑ / ⌥↓ : affaire précédente / suivante de la liste, fiche ouverte (23.10.2026) */
window.addEventListener('keydown',e=>{ if(!e.altKey||(e.key!=='ArrowUp'&&e.key!=='ArrowDown')||!VIEW||VIEW.id!=='affd-gestion'||!SG_AG.aller||document.querySelector('.ov')) return;
  if(e.target&&/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return; e.preventDefault(); SG_AG.aller(e.key==='ArrowUp'?-1:1); });
VIEWS['affd-gestion']={
  render(m){ const cur=()=>DS.get('project',AF.g.sel), need=f=>()=>{ const p=cur(); if(!p){ toast('Sélectionnez une affaire.',true); return; } f(p); };
    const R=h('div',{class:'col fill sg-ag',style:{margin:'6px'}}), pane=h('div',{class:'pane'}), fiche=h('aside',{class:'sg-ag-fiche'});
    const head=phead([
      {i:'plus',t:'Nouvelle affaire',fn:()=>editProject()},{i:'edit',t:'Editer l’affaire',fn:need(editProject)},{i:'minus',t:'Supprimer l’affaire',fn:need(delProject)},
      /* Intervenants, Configuration, Subdivisions, Modèles, Documents et Fonctions retirés de la barre (23.10.2026, demande de Paulo) : les fenêtres
         du moteur restent (cfgMembers, cfgActivities, cfgRates, cfgPhases, cfgSubprojects, defineTemplates, printProjects, copyTable, csvTable…) */
      {i:'filter',t:'Filtre',menu:()=>[{t:'Tous les statuts',chk:!AF.filt.s,fn:()=>{ AF.filt.s=null; draw(); }},...Object.entries(PSTATE).map(([k,t])=>({t,chk:AF.filt.s==k,fn:()=>{ AF.filt.s=k; draw(); }})),'-',
        {t:'Affaires internes',chk:AF.filt.i===1,fn:()=>{ AF.filt.i=AF.filt.i===1?null:1; draw(); }},{t:'Affaires externes',chk:AF.filt.i===0,fn:()=>{ AF.filt.i=AF.filt.i===0?null:0; draw(); }}]}
    ],{count:1,search:q=>{ AF.q=q; draw(); }});
    R.append(head,h('div',{class:'sg-ag-corps'},h('div',{class:'sg-ag-liste'},pane),fiche)); m.append(R);
    let I={}, PA={}; const index=()=>{ const lim=dayKey(new Date(Date.now()-30*864e5)); I={}; PA={};
      DS.all('timelog').forEach(r=>{ const v=+r.TIMEPERIOD||0, k=tlKey(r), x=I[r.PROJECT_ID]||(I[r.PROJECT_ID]={der:0,derD:null,h30:0,tot:0,st:{}}); x.tot+=v; x.st[r.STAFF_ID]=(x.st[r.STAFF_ID]||0)+v; if(k>x.der){ x.der=k; x.derD=tlDate(r); } if(k>=lim) x.h30+=v; }); };
    const ix=p=>I[p.ID]||{der:0,derD:null,h30:0,tot:0,st:{}}, phase=p=>PA[p.ID]!==undefined?PA[p.ID]:(PA[p.ID]=sgPhaseActuelle(p)), phL=p=>sgTermine(p)?'Terminé':(sgPhaseLib(phase(p),true)||'');
    const catL=p=>{ const c=sgCatOuInterne(p); return c==='interne'?'Autres':c==='architecture'?'':(SG_CAT_L[c]||''); }, E=nxE;
    let ferme=false, dernier=null; SG_AG.ouvrir=()=>{ ferme=false; dessinerFiche(); };   /* fiche projet = fenêtre à droite, fermable (22.10.2026) */
    const aller=d=>{ const V=AF.g.view||[], i=V.findIndex(r=>String(r.ID)===String(AF.g.sel)), r=V[i+d]; if(i<0||!r) return; const tr=pane.querySelector('tr[data-k="'+CSS.escape(String(r.ID))+'"]'); if(tr){ tr.click(); tr.scrollIntoView({block:'nearest'}); } };
    SG_AG.aller=aller;
    const majTout=()=>{ const b=fiche.querySelector('#sg-ag-ctt'), K=[...fiche.querySelectorAll('.sg-ag-ct')]; if(!b) return; b.hidden=K.length<2; b.textContent=K.length&&K.every(k=>k.classList.contains('red'))?'Tout déplier':'Tout réduire'; };
    const reduire=(K,red)=>{ const S=SG_AG.reduits(); K.forEach(k=>{ k.classList.toggle('red',red); const hd=k.querySelector('[data-ctr]'); if(hd){ hd.setAttribute('aria-expanded',String(!red)); hd.title=(red?'Déplier':'Réduire')+' ce contrat'; } red?S.add(k.dataset.ct):S.delete(k.dataset.ct); });
      nxLS.set('sg3_ag_ctr_red',[...S].slice(-500)); majTout(); };
    fiche.addEventListener('keydown',e=>{ const t=e.target.closest&&e.target.closest('[data-ctr],.sg-ag-lien'); if(t&&(e.key==='Enter'||e.key===' ')){ e.preventDefault(); t.click(); } });
    fiche.addEventListener('click',e=>{ const t=e.target.closest('[data-a],[data-go],[data-ref],[data-rap],[data-ctr]'); if(!t||!fiche.contains(t)) return; const p=cur(); if(!p) return;
      if(t.dataset.rap){ sgRapportHeuresCollab(p,t.dataset.rap); return; }   /* clic sur une personne de l'équipe : son rapport des heures sur l'affaire (23.10.2026) */
      if(t.dataset.ctr!=null){ const k=t.closest('.sg-ag-ct'); if(k) reduire([k],!k.classList.contains('red')); return; }   /* contrat replié / déplié (23.10.2026) */
      if(t.dataset.a){ const a=t.dataset.a; if(a==='fermer'){ ferme=true; dessinerFiche(); } else if(a==='ctrtout'){ const K=[...fiche.querySelectorAll('.sg-ag-ct')]; reduire(K,!K.every(k=>k.classList.contains('red'))); } else if(a==='prec'||a==='suiv') aller(a==='prec'?-1:1); else if(a==='edit') editProject(p); else if(a==='page') go('nx-pdom',p.ID); else if(a==='tdb') go('nx-projet',p.ID); }
      else if(t.dataset.ref) nxOpenRef(t.dataset.ref); else if(t.dataset.go) go(t.dataset.go,t.dataset.arg); });
    /* fiche refaite le 23.10.2026 (demande de Paulo « améliorer la fiche affaire ») : barre bleu nuit (affaire précédente /
       suivante, Éditer, Intervenants, Page du projet, Tableau de bord, fermer) ; en-tête jaune pâle comme le tableau de bord du projet (grand numéro,
       filet, titre, statut, catégorie, maître de l'ouvrage, frise des heures) ; puis, dans l'ordre : fiche de l'affaire (juste sous le titre),
       contrats d'honoraires détaillés, heures (tuiles), équipe (tous les collaborateurs attribués, même sans heure) */
    const dessinerFiche=()=>{ const p=cur(); R.classList.toggle('fiche-on',!!p&&!ferme); if(!p||ferme){ fiche.innerHTML=''; dernier=null; return; }
      const x=ix(p), pa=phase(p);
      const hp=DS.by('projectphase','PROJECT_ID',p.ID).reduce((a,f)=>a+(+f.TIMEBUDGET||0),0);
      const bt=(a,ti,c,dis)=>'<button data-a="'+a+'" title="'+E(ti)+'"'+(dis?' disabled':'')+'>'+c+'</button>';
      const mo=[...new Set(DS.by('projectmember','PROJECT_ID',p.ID).filter(m0=>m0.TEAMROLECODE===8&&m0.CONTACT_ID!=null).map(m0=>contactName(DS.get('contact',m0.CONTACT_ID))).filter(Boolean))], moL=mo.length?mo:(projMO(p)?[projMO(p)]:[]);
      const kt=(ico,l,v,ti,cls)=>nxKpi(ico,l,v).replace('<div class="nx-kpi"','<div class="nx-kpi" title="'+E(ti||'')+'"').replace('<div class="v">','<div class="v'+(cls?' '+cls:'')+'">');
      const jauge=hp?(()=>{ const m0=Math.max(hp,x.tot), a0=Math.min(x.tot,hp)/m0*100, d0=x.tot>hp?(x.tot-hp)/m0*100:0; return '<div class="sg-kg"><i class="ef" style="width:'+a0.toFixed(2)+'%"></i>'+(d0?'<i class="dp" style="left:'+a0.toFixed(2)+'%;width:'+d0.toFixed(2)+'%"></i>':'')+'<i class="mk" style="left:'+(hp/m0*100).toFixed(2)+'%"></i></div>'; })():'';
      const eq=sgEquipeAffaire(p,x.st), tot=x.tot||1;
      fiche.innerHTML='<div class="sg-ag-wh"><b>Fiche projet</b><span class="sg-ag-wb">'   /* sans numérotation « 84 / 87 » (23.10.2026, demande de Paulo) */
          /* flèches ‹ › (affaire précédente / suivante) retirées à la demande (23.10.2026) : ⌥↑ ⌥↓ restent au clavier */
          +bt('edit','Éditer l’affaire',nxSvg('edit'))/* bouton « Attribuer les intervenants » retiré à la demande (23.10.2026) : barre de la liste ▸ Intervenants */+bt('page','Page du projet',nxSvg('folder'))+bt('tdb','Tableau de bord du projet',nxSvg('gauge'))
          +'<button class="sg-ag-x" data-a="fermer" title="Fermer la fiche">×</button></span></div>'
        +'<div class="sg-ag-id"><div class="sg-ag-idt sg-ag-lien" data-a="page" role="link" tabindex="0" title="Ouvrir le projet (Mes projets ▸ page du projet)"><div class="sg-ag-num">'+E(p.NUMBER||'')+'</div><div><h3>'+E(p.TITLE||p.NUMBER||'')+'</h3><div class="sg-ag-tags">'+nxStateTag(p)+(catL(p)?'<span class="nx-tag">'+E(catL(p))+'</span>':'')+'</div></div></div>'
        +'<div class="sg-ag-mo">'+nxSvg('person')+'<span>Maître de l’ouvrage'+(moL.length>1?'s':'')+' : <b>'+(moL.length?moL.map(E).join(', '):'—')+'</b></span></div>'
        +sgFriseHeures(DS.by('timelog','PROJECT_ID',p.ID))+'</div>'
        +'<div class="sg-ag-wc">'+sgFicheAffaire(p)
        +'<section class="sg-ag-bloc"><h4>Contrats d’honoraires<span class="n" id="sg-ag-ctn"></span><button class="sg-ag-tout" id="sg-ag-ctt" data-a="ctrtout" hidden></button></h4><div id="sg-ag-ctr"><p class="sg-ag-vide">…</p></div></section>'
        +'<section class="sg-ag-bloc"><h4>Heures</h4><div class="nx-kpis sg-ag-kpis">'
          +kt('clock','Heures saisies',sgHr(x.tot)+'<small>h</small>',nxH(x.tot)+' h saisies'+(hp?' — '+nxH(hp)+' h prévues au contrat des phases, '+(x.tot>hp?'+'+nxH(x.tot-hp)+' h au-delà':nxH(hp-x.tot)+' h restantes'):' — aucune heure prévue au contrat des phases')).replace('</div><div class="v">',(hp?'<span class="sg-kq'+(x.tot>hp?' dep':'')+'">'+Math.round(x.tot/hp*100)+' %</span>':'')+'</div><div class="v">').replace(/<\/div>$/,jauge+'</div>')
          +kt('cal','Ces 30 jours',sgHr(x.h30)+'<small>h</small>',x.h30?'Heures saisies ces 30 derniers jours':'Aucune heure saisie ces 30 derniers jours')
          +(sgTermine(p)?kt('gauge','Phase actuelle','Terminé',sgEtatLib(p),'txt'):kt('gauge','Phase actuelle',pa?E(nm(pa.ph)):'—',pa?'D’après les heures saisies : '+sgPhaseLib(pa)+(pa.recent?'':' (dernière saisie le '+dfr(diso(pa.date))+')'):'Aucune heure saisie par phase','txt'))
          +kt('clock','Dernière saisie',x.derD?dfr(diso(x.derD)):'—','','dt')+'</div></section>'
        +'<section class="sg-ag-bloc sg-ag-eq"><h4>Équipe<span class="n">'+eq.length+'</span></h4>'+(eq.length?eq.map(q=>'<div class="nx-person sg-eq'+(q.h?'':' zero')+'" data-rap="'+E(q.s.ID)+'" title="'+E('Rapport des heures — '+staffName(q.s)+(q.att?' — attribué à l’affaire':' — a saisi des heures sans être dans l’équipe de l’affaire')+' : '+nxH(q.h)+' h'+(q.parti?' — a quitté le bureau':''))+'">'
          +'<div class="nx-av">'+E(nxIni(staffName(q.s)))+'</div><div class="t"><div class="nl"><b>'+E(staffName(q.s))+'</b>'+(q.fn?'<small>'+E(q.fn)+'</small>':'')+(q.att?'':'<span class="nx-tag">hors équipe</span>')+(q.parti?'<span class="nx-tag">a quitté le bureau</span>':'')+'</div>'
          +'<span class="sg-eq-b"><i style="width:'+(q.h?Math.max(1,q.h/tot*100).toFixed(1):0)+'%"></i></span></div><span class="m"><b>'+sgHr(q.h)+' h</b><small>'+(q.h?(q.h/tot<.005?'&lt; 1':Math.round(q.h/tot*100))+' %':'aucune heure')+'</small></span></div>').join('')
          :'<p class="sg-ag-vide">Aucun collaborateur attribué ni aucune heure saisie.</p>')+'</section></div>';
      if(dernier!==p.ID){ fiche.scrollTop=0; dernier=p.ID; }
      fxEnsure().catch(()=>null).then(()=>{ const c=fiche.querySelector('#sg-ag-ctr'); if(!c||cur()!==p) return; const D=fxData(), n=D?sgContratsDuProjet(p,D).length:0;
        c.innerHTML=sgAgContrats(p,D); const ad=fiche.querySelector('#sg-ag-adr'); if(ad) ad.outerHTML=sgFicheAdresses(p,D); const cn=fiche.querySelector('#sg-ag-ctn'); if(cn) cn.textContent=n?String(n):''; majTout(); }); };
    const draw=()=>{ const rows=DS.all('project').filter(p=>(AF.arch||p.PROJECTSTATECODE!==5)&&(!AF.filt.s||p.PROJECTSTATECODE==AF.filt.s)&&(AF.filt.i==null||(+!!p.ISINTERNAL)===AF.filt.i)&&matchQ(AF.q,p.NUMBER,p.TITLE,p.DESCRIPTION));
      grid(pane,Object.assign(AF.g,{cols:[{k:'NUMBER',t:'Numéro',w:92},{k:'TITLE',t:'Affaire',w:300},{k:'st',t:'Statut',w:96,f:projState,v:p=>p.PROJECTSTATECODE},
        {k:'cat',t:'Catégorie',w:90,f:p=>E(catL(p)),v:catL},{k:'ph',t:'Phase actuelle',w:150,f:p=>E(phL(p)),v:phL},
        {k:'der',t:'Dernière saisie',w:100,f:p=>ix(p).derD?dfr(diso(ix(p).derD)):'',v:p=>ix(p).der},{k:'h30',t:'Heures 30 j',w:84,cls:'r',f:p=>ix(p).h30?nxH(ix(p).h30):'',v:p=>ix(p).h30},
        {k:'act',t:'Activité',w:62,cls:'c',f:p=>ix(p).h30?'<i class="sg-ag-pt on" title="Heures saisies ces 30 jours"></i>':'<i class="sg-ag-pt" title="Aucune heure saisie ces 30 jours"></i>',v:p=>ix(p).h30},
        {k:'PROJECTSTARTDATE',t:'Début',w:90,f:p=>dfr(p.PROJECTSTARTDATE)},{k:'PROJECTENDDATE',t:'Fin',w:90,f:p=>dfr(p.PROJECTENDDATE)},{k:'mo',t:'Maître d’ouvrage',w:200,f:p=>E(projMO(p)),v:projMO}],
        rows,sort:AF.g.sort||['NUMBER',-1],onDbl:p=>editProject(p),onSel:()=>{ ferme=false; dessinerFiche(); }}));
      if(!pane._sgRouvre){ pane._sgRouvre=1; pane.addEventListener('click',e=>{ const tr=e.target.closest('tr[data-k]'); if(tr&&ferme&&tr.dataset.k===String(AF.g.sel)){ ferme=false; dessinerFiche(); } }); }
      head.setCount(rows.length+' Affaires'); dessinerFiche(); };
    this.draw=()=>{ index(); draw(); }; this.draw(); },
  refresh(ts){ if(hit(ts,'project','projectmember','projectphase','projectsubphase','timelog')&&this.draw) this.draw(); } };

/* ═══ Choix d'une adresse pour une affaire (23.10.2026, demande de Paulo « améliorer la fenêtre adresse de projet dans Éditer le projet ») — remplace,
   dans Éditer l'affaire, le navigateur d'adresses du moteur (pickContact) : recherche immédiate (nom, société, rue, localité), filtre Tous /
   Sociétés / Personnes, suggestions sans recherche (adresses déjà utilisées dans l'affaire, intervenants de l'affaire avec leur rôle), une ligne
   par adresse avec l'adresse complète, aperçu à droite, ↑ ↓ / Entrée / double-clic ; o = {courant, p, deja:[[libellé, ID contact]…]} ═══ */
function sgChoisirAdresse(titre,cb,o){ o=o||{}; const E=nxE; let q='', ty='', sel=o.courant!=null?String(o.courant):null, vue=[];
  const ROLE_L=Object.fromEntries((typeof ROLES!=='undefined'?ROLES:[]).map(r=>[r[0],r[1]]));
  const ligne1=c=>ownerName(ownerOf(c),true)||[c.NAME1,c.NAME2].filter(Boolean).join(' ')||'(sans nom)';
  const adrTxt=c=>{ const L=adrLines(c); return L.filter(x=>x!==c.NAME1&&x!==c.NAME2&&x!==c.NAME3).join(' · '); };
  const tous=DS.all('contact').filter(c=>!c.ISHIDDEN), cle=new Map(tous.map(c=>[c.ID,(ligne1(c)+' '+ownerName(relOf(c),true)+' '+adrLines(c).join(' ')).toLowerCase()]));
  /* suggestions : adresses déjà choisies dans l'affaire, puis intervenants (maître d'ouvrage d'abord) */
  const sugg=[], vus=new Set(); (o.deja||[]).forEach(([l,id])=>{ const c=id!=null&&DS.get('contact',id); if(c&&!vus.has(c.ID)){ vus.add(c.ID); sugg.push({c,tag:l}); } });
  if(o.p) DS.by('projectmember','PROJECT_ID',o.p.ID).filter(m=>m.CONTACT_ID!=null).sort((a,b)=>cmp(ROLE_ORD[a.TEAMROLECODE]??99,ROLE_ORD[b.TEAMROLECODE]??99)).forEach(m=>{ const c=DS.get('contact',m.CONTACT_ID); if(c&&!c.ISHIDDEN&&!vus.has(c.ID)){ vus.add(c.ID); sugg.push({c,tag:ROLE_L[m.TEAMROLECODE]||'Intervenant'}); } });
  const corps=h('div',{class:'sg-ca'});
  corps.innerHTML='<div class="sg-ca-haut"><input class="inp sg-ca-q" type="search" placeholder="Rechercher : nom, société, rue, localité…" autocomplete="off"><span class="sg-an sg-ca-ty" role="group" aria-label="Type">'
    +[['','Tous'],['s','Sociétés'],['p','Personnes']].map(([k,t])=>'<button type="button" data-ty="'+k+'" class="'+(k===ty?'on':'')+'">'+t+'</button>').join('')+'</span></div>'
    +'<div class="sg-ca-corps"><div class="sg-ca-liste" role="listbox" tabindex="-1"></div><aside class="sg-ca-ap"><span class="l">Adresse choisie</span><div class="a"></div></aside></div>';
  const liste=corps.querySelector('.sg-ca-liste'), ap=corps.querySelector('.sg-ca-ap .a'), qi=corps.querySelector('.sg-ca-q');
  const rang=x=>'<div class="sg-ca-r'+(String(x.c.ID)===sel?' on':'')+'" data-id="'+E(x.c.ID)+'" role="option" aria-selected="'+(String(x.c.ID)===sel)+'">'+tyIcon((ownerOf(x.c)||{}).TYPECODE||0)
    +'<div class="t"><b>'+E(ligne1(x.c))+'</b>'+(relOf(x.c)?'<small>'+E(ownerName(relOf(x.c),true))+'</small>':'')+'<span class="a">'+E(adrTxt(x.c)||'—')+'</span></div>'+(x.tag?'<span class="nx-tag">'+E(x.tag)+'</span>':'')+'</div>';
  const okTy=c=>{ const t=(ownerOf(c)||{}).TYPECODE; return !ty||(ty==='p'?t===1:t!==1); };
  const dessiner=()=>{ let html='';
    if(!q){ const S=sugg.filter(x=>okTy(x.c)); vue=S.map(x=>x.c);
      html=(S.length?'<div class="gr">Suggestions pour cette affaire</div>'+S.map(rang).join(''):'')+'<div class="sg-ca-aide">Tapez un nom, une société, une rue ou une localité pour chercher parmi les '+num(tous.length,0)+' adresses de l’annuaire.</div>'; }
    else { const R=tous.filter(c=>okTy(c)&&cle.get(c.ID).includes(q)).sort((a,b)=>cmp(ligne1(a).toLowerCase(),ligne1(b).toLowerCase())), N=R.length, L=R.slice(0,200); vue=L;
      if(L.length&&!L.some(c=>String(c.ID)===sel)) sel=String(L[0].ID);   /* recherche : le premier résultat est surligné (aperçu cohérent avec la liste) */
      html='<div class="gr">'+num(N,0)+' adresse'+(N>1?'s':'')+(N>200?' — 200 premières affichées, précisez la recherche':'')+'</div>'+(L.length?L.map(c=>rang({c,tag:(sugg.find(x=>x.c.ID===c.ID)||{}).tag})).join(''):'<div class="sg-ca-aide">Aucune adresse ne correspond.</div>'); }
    liste.innerHTML=html; apercu(); const r=liste.querySelector('.sg-ca-r.on'); if(r) r.scrollIntoView({block:'nearest'}); };
  const apercu=()=>{ const c=sel!=null?DS.get('contact',sel):null; ap.innerHTML=c?adrLines(c).map(E).join('<br>')+(relOf(c)?'<small>Rattachée à '+E(ownerName(relOf(c),true))+'</small>':''):'<span class="vide">Aucune adresse choisie</span>'; };
  const choisir=id=>{ sel=String(id); liste.querySelectorAll('.sg-ca-r').forEach(r=>{ const on=r.dataset.id===sel; r.classList.toggle('on',on); r.setAttribute('aria-selected',String(on)); }); apercu(); const r=liste.querySelector('.sg-ca-r.on'); if(r) r.scrollIntoView({block:'nearest'}); };
  let D=null; const valider=()=>{ const c=sel!=null?DS.get('contact',sel):null; if(!c){ toast('Choisissez une adresse dans la liste.',true); return false; } cb(c); return true; };
  liste.addEventListener('click',e=>{ const r=e.target.closest('.sg-ca-r'); if(r) choisir(r.dataset.id); });
  liste.addEventListener('dblclick',e=>{ const r=e.target.closest('.sg-ca-r'); if(r){ choisir(r.dataset.id); if(valider()&&D) D.close(); } });
  corps.querySelectorAll('[data-ty]').forEach(b=>b.onclick=()=>{ ty=b.dataset.ty; corps.querySelectorAll('[data-ty]').forEach(x=>x.classList.toggle('on',x===b)); dessiner(); qi.focus(); });
  qi.oninput=()=>{ q=qi.value.trim().toLowerCase(); dessiner(); };
  qi.addEventListener('keydown',e=>{ if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); if(!vue.length) return; const i=vue.findIndex(c=>String(c.ID)===sel), n=e.key==='ArrowDown'?Math.min(vue.length-1,i+1):Math.max(0,i<0?0:i-1); choisir(vue[n].ID); }
    else if(e.key==='Enter'){ e.preventDefault(); if(vue.length&&!vue.some(c=>String(c.ID)===sel)) choisir(vue[0].ID); if(valider()&&D) D.close(); } });   /* Entrée : l'adresse surlignée, sinon la première de la liste affichée */
  dessiner();
  D=dialog({title:titre||'Choisir une adresse',width:'min(860px,95vw)',body:corps,buttons:[{t:'Annuler'},{t:'Choisir cette adresse',pri:true,fn:()=>valider()?undefined:false}]});
  setTimeout(()=>qi.focus(),0); return D; }
/* rubriques retirées de « Éditer l'affaire » à la demande de Paulo (23.10.2026 : « pas nécessaire à la création de l'affaire, peut-être des
   éléments traités plus tard dans l'affaire ») — leurs champs restent dans la base tels quels : une affaire existante les garde (readK ne lit
   que les champs affichés), une nouvelle affaire les reçoit vides, comme avant. Liste gardée pour les réutiliser ailleurs dans l'app ; Délais :
   à remplacer un jour par les éléments du planning du projet (planning intentionnel par phase). Encore affichés (non modifiables) : District
   (LOCATION = lieu de l'affaire : Mes projets, page du projet, en-tête du tableau de bord), début / fin du projet, Tri, Caractéristiques et
   Références dans la fiche de l'affaire (sgFicheAffaire) */
const SG_EP_RETIRES={
  'Délais':[['PROJECTSTARTDATE','Début du projet'],['PROJECTENDDATE','Fin du projet'],['STARTOFPLANNING','Début de planification'],['ENDOFPLANNING','Fin de planification'],
    ['STARTOFCONSTRUCTION','Début des travaux'],['ENDOFCONSTRUCTION','Fin des travaux'],['MOVEINDEADLINE','Remise des clés']],
  'Caractéristiques':[['VOLUME','Volume construit (m³)'],['AREA','Surface de plancher (m²)'],['BASISINDEX','Indice ICC']],
  'Références':[['EXTERNALNUMBER','Numéro d’affaire externe'],['LOCATION','District'],['PLOT','Zone / quartier'],['LANDREGISTERNR','Numéro registre foncier'],['ACCOUNTINGAREA','Service comptabilité']],
  'Autres réglages':[['SORTLABEL','Tri'],['NEXTUNIQUEPLANID','Prochain plan-ID'],['ISUNIQUEPLANIDLOCKED','Créer automatiquement les plan-ID'],['PROJECTFOLDER','Emplacement du dossier d’affaire'],['MAILBOXURL','URL de la messagerie']]};
/* ═══ Éditer l'affaire, version SUBGestion 3 (23.10.2026, demande de Paulo « modifier le panneau Éditer projet dans Affaires, optimiser pour
   clarifier ») — remplace editProject du moteur dans SUBGestion 3 seulement (DeltaSub.html seul garde la fenêtre d'origine). Mêmes valeurs par
   défaut, mêmes contrôles et même enregistrement (project + project_projectkind) ; présentation : un seul formulaire avec un sommaire à gauche
   (au lieu de 6 onglets), libellés au-dessus des champs, rubriques Identification, Statut, Collaborateurs, Adresses, Genres d'affaire, Saisie des
   heures et des frais ; collaborateurs du bureau à cocher (intervenants « Collaborateurs ») ; adresses en cartes (Choisir / Retirer) ; genres
   d'affaire en deux temps (groupe, puis genre) ; obligations de saisie en petit tableau ; numéro obligatoire signalé dans le champ. Retirés à la
   demande le même jour : type Interne / Externe, phase en cours, puis les rubriques Délais, Caractéristiques, Références et Autres réglages
   (SG_EP_RETIRES). Rubriques Phases, Activités et Tarifs ajoutées puis retirées le même jour (« ces éléments seront traités dans d'autres
   chapitres ») : module gardé pour être réutilisé, sgEpOrga (bloc 24, sg3_affaire.js) ═══ */
function sgEditAffaire(p){ const E=nxE, isNew=!p;
  const v=p?{...p}:{ID:null,PROJECTSTATECODE:1,CURRENCY:'CHF',ISINTERNAL:0,ISTIMEPHASEMANDATORY:1,ISTIMEDESCMANDATORY:1,ISEXPENSESDESCMANDATORY:1,ISTIMESUBPROJECTMANDATORY:0,ISEXPENSESPHASEMANDATORY:0,NEXTUNIQUEPLANID:1,ISPATHTOPROJECTDOCUMENTSRELATIVE:1};
  if(isNew) Object.values(SG_EP_RETIRES).flat().forEach(([k])=>{ if(!(k in v)) v[k]=k==='ISUNIQUEPLANIDLOCKED'?0:null; });   /* champs des rubriques retirées : vides, comme avant */
  const kinds=new Set(v.ID?DS.by('project_projectkind','PROJECT_ID',v.ID).map(l=>l.PROJECTKINDS_ID):[]);
  const adr={}; ['CONTACT1_ID','CONTACT2_ID','CONTACT3_ID','CONTACT4_ID'].forEach(k=>adr[k]=v[k]);
  const val=k=>v[k]==null?'':String(v[k]);
  const champ=(l,html,o)=>{ const g=o&&o.div?'div':'label'; return '<'+g+' class="sg-ep-c'+(o&&o.large?' large':'')+'"><span>'+E(l)+(o&&o.req?' <i class="req" title="Obligatoire">*</i>':'')+'</span>'+html+(o&&o.aide?'<small>'+o.aide+'</small>':'')+'</'+g+'>'; };
  const txt=(k,o)=>'<input class="inp" data-k="'+k+'" value="'+E(val(k))+'"'+(o&&o.ph?' placeholder="'+E(o.ph)+'"':'')+(o&&o.w?' style="max-width:'+o.w+'"':'')+'>';
  const ck=(k,ti)=>'<input type="checkbox" data-k="'+k+'"'+(+v[k]?' checked':'')+' title="'+E(ti)+'">';
  const SECS=[['ident','Identification'],['statut','Statut'],['collab','Collaborateurs'],['adr','Adresses'],['genres','Genres d’affaire'],['saisie','Saisie des heures et des frais']];
  const sec=(k,t,html,o)=>'<section class="sg-ep-s'+(o&&o.repli?' repli':'')+'" data-sec="'+k+'"><h4'+(o&&o.repli?' data-repli="1" role="button" tabindex="0" title="Afficher / masquer"':'')+'>'+(o&&o.repli?nxSvg('next','chev'):'')+E(t)+'</h4><div class="sg-ep-g">'+html+'</div></section>';
  const CARTES=[['affaire','Adresse d’affaire'],['mo','Maître de l’ouvrage'],['fact','Adresse de facturation'],['depot','Adresse retour des offres']];   /* adresse de livraison retirée (23.10.2026) */
  let moChoisi=null;   /* maître de l'ouvrage choisi (sans contrat) : enregistré comme intervenant « Maître d'ouvrage » (rôle 8) */
  const corps=h('div',{class:'sg-ep'}); let liens=[], fige=0;   /* fige : rubrique choisie dans le sommaire, gardée surlignée pendant le saut */
  corps.innerHTML='<nav class="sg-ep-nav">'+SECS.map(([k,t],i)=>'<a data-go-sec="'+k+'" class="'+(i?'':'on')+'">'+E(t)+'</a>').join('')+'</nav><div class="sg-ep-f">'
    +'<div class="sg-ep-tete"><b data-tete="n">'+E(val('NUMBER')||'Nouvelle affaire')+'</b><span data-tete="t">'+E(val('TITLE'))+'</span></div>'
    +sec('ident','Identification',champ('Numéro d’affaire',txt('NUMBER',{w:'200px',ph:'ex. 26ABC'}),{req:1})+champ('Désignation de l’affaire',txt('TITLE',{ph:'ex. Transformation d’une maison familiale'}),{large:1})
      +champ('Complément',' <textarea class="inp" rows="3" data-k="DESCRIPTION" placeholder="Adresse du chantier, précisions…">'+E(val('DESCRIPTION'))+'</textarea>',{large:1}))
    +sec('statut','Statut',champ('Statut de l’affaire','<select class="inp" data-k="PROJECTSTATECODE" style="max-width:220px">'+Object.entries(PSTATE).map(([k,t])=>'<option value="'+k+'"'+(+k===+v.PROJECTSTATECODE?' selected':'')+'>'+E(t)+'</option>').join('')+'</select>')
      /* « Type d'affaire » (Externe / Interne) retiré à la demande (23.10.2026) : ISINTERNAL gardé tel quel (nouvelle affaire : externe) */
      /* « Phase en cours » retirée à la demande (23.10.2026) : la phase actuelle est dans la fiche projet ; CURRENTPROJECTPHASE_ID gardé tel quel */)
    +sec('collab','Collaborateurs','<div class="sg-ep-col"><p class="aide">Les collaborateurs attribués voient l’affaire dans « Mes projets ». Les autres intervenants (ingénieurs, entreprises…) s’ajouteront plus tard, dans le projet.</p><div class="sg-ep-coln"></div><div class="sg-ep-cols"></div></div>')
    +sec('adr','Adresses','<div class="sg-ep-adrs">'+CARTES.map(([k,l])=>'<div class="sg-ep-adr" data-adrk="'+k+'"><span class="l">'+E(l)+'</span><div class="a"></div><div class="b"></div><small class="n"></small></div>').join('')+'</div>')
    +sec('genres','Genres d’affaire','<div class="sg-ep-genres"><div class="sg-ep-chips"></div><div class="sg-ep-gg"><div class="sg-ep-c"><span>1. Groupe d’affaire</span><div class="sg-ep-grp" role="listbox" aria-label="Groupe d’affaire"></div></div><div class="sg-ep-c"><span class="sg-ep-gt">2. Genre</span><div class="sg-ep-gen"></div></div></div></div>')
    /* rubriques « Délais », « Caractéristiques », « Références » et « Autres réglages » retirées à la demande (23.10.2026) : SG_EP_RETIRES ;
       « Phases », « Activités », « Tarifs » retirées le même jour (traitées dans d'autres chapitres) : module sgEpOrga gardé (bloc 24) */
    +sec('saisie','Saisie des heures et des frais','<div class="sg-ep-c large"><span>Champs obligatoires lors de la saisie</span><table class="sg-ep-par"><tr><th></th><th>Phase</th><th>Subdivision</th><th>Commentaire / description</th></tr>'
      +'<tr><td>Heures</td><td>'+ck('ISTIMEPHASEMANDATORY','Phase obligatoire')+'</td><td>'+ck('ISTIMESUBPROJECTMANDATORY','Subdivision obligatoire')+'</td><td>'+ck('ISTIMEDESCMANDATORY','Commentaire obligatoire')+'</td></tr>'
      +'<tr><td>Frais</td><td>'+ck('ISEXPENSESPHASEMANDATORY','Phase obligatoire')+'</td><td></td><td>'+ck('ISEXPENSESDESCMANDATORY','Description obligatoire')+'</td></tr></table></div>'+champ('Monnaie',txt('CURRENCY',{w:'90px'})))
    +'</div>';
  /* adresses (23.10.2026) : adresse d'affaire et maître de l'ouvrage repris du contrat (ou de l'offre) quand il les donne — sinon à choisir ;
     adresse de facturation automatique (MO p.a. Substances Architectes) ; lieu de dépôt des offres à choisir ; règles : sgAdressesAffaire */
  const majAdrs=()=>{ const pv=p?Object.assign({},p,{CONTACT1_ID:adr.CONTACT1_ID,CONTACT2_ID:adr.CONTACT2_ID,CONTACT4_ID:adr.CONTACT4_ID}):{ID:null,CONTACT1_ID:adr.CONTACT1_ID,CONTACT4_ID:adr.CONTACT4_ID};
    const A=sgAdressesAffaire(pv,typeof fxData==='function'?fxData():null,{moId:moChoisi});
    CARTES.forEach(([k])=>{ const x=A[k], box=corps.querySelector('[data-adrk="'+k+'"]'), auto=x.src==='contrat'||x.src==='auto';
      box.querySelector('.a').innerHTML=x.lignes.length?x.lignes.map(E).join('<br>'):'<span class="vide">'+(k==='fact'?'Indiquez d’abord le maître de l’ouvrage.':'Aucune adresse')+'</span>';
      /* étiquettes de provenance (« contrat … », « automatique ») retirées des cartes à la demande (23.10.2026) : la note sous l'adresse l'indique */
      box.classList.toggle('auto',auto); box.classList.toggle('vide',!x.lignes.length);
      box.querySelector('.b').innerHTML=auto||k==='fact'||k==='depot'?'':'<button type="button" class="btn" data-adr-choisir="'+k+'">Choisir…</button>'+(k!=='mo'&&x.lignes.length?'<button type="button" class="btn" data-adr-retirer="'+k+'">Retirer</button>':'');
      box.querySelector('.n').innerHTML=x.src==='contrat'?'Reprise du contrat d’honoraires '+E(x.ctr)+' : à modifier dans le contrat.':x.src==='auto'?(k==='depot'?'Substances Architectes : identique à l’adresse de facturation.':'Nom du maître de l’ouvrage, p.a. Substances Architectes et adresse du bureau.')
        :k==='mo'?(x.src==='choisie'?'Sera enregistré comme intervenant « Maître d’ouvrage ».':'Pas de contrat : choisissez dans l’annuaire (intervenant « Maître d’ouvrage »).'):k==='affaire'?'Pas d’adresse dans un contrat : choisissez dans l’annuaire.':''; }); };
  majAdrs(); if(typeof fxEnsure==='function') fxEnsure().then(majAdrs).catch(()=>null);
  corps.querySelector('.sg-ep-adrs').addEventListener('click',e=>{ const ch=e.target.closest('[data-adr-choisir]'), rt=e.target.closest('[data-adr-retirer]');
    if(ch){ const k=ch.dataset.adrChoisir, l=(CARTES.find(x=>x[0]===k)||[])[1], cle=k==='affaire'?'CONTACT1_ID':k==='depot'?'CONTACT4_ID':null;
      const cur=k==='mo'?(moChoisi!=null?moChoisi:(m=>m&&m.CONTACT_ID)(p?svMember(p,8):null)):adr[cle];
      sgChoisirAdresse(l,c=>{ if(k==='mo') moChoisi=c.ID; else adr[cle]=c.ID; majAdrs(); },{courant:cur,p,deja:[['Adresse d’affaire',adr.CONTACT1_ID]].filter(x=>x[1]&&k!=='affaire')}); }
    if(rt){ const k=rt.dataset.adrRetirer; adr[k==='affaire'?'CONTACT1_ID':'CONTACT4_ID']=null; majAdrs(); } });
  /* collaborateurs du bureau attribués à l'affaire (23.10.2026, demande de Paulo « attribuer les collaborateurs à l'affaire ») = intervenants
     « Collaborateurs » (rôle 12 : RESPCONTACT_ID = personne du collaborateur, CONTACT_ID = Substances Architectes), ce que lisent Mes projets,
     l'équipe de la fiche affaire, le Controlling et le serveur du NAS ; collaborateurs à cocher (heures déjà saisies sur l'affaire à droite) :
     affaire existante = tous, actuels et anciens, en une seule liste par nom (ancien : « A quitté le bureau » en infobulle) ; nouvelle affaire =
     collaborateurs actuels seulement (demande de Paulo, même jour) ; lié par un autre rôle (Directeur d'affaire…) : coché, à modifier dans les
     intervenants du projet. Les autres intervenants s'ajoutent plus tard, dans le projet (demande de Paulo, même jour) */
  const auj=new Date().toISOString().slice(0,10), MBR=v.ID?DS.by('projectmember','PROJECT_ID',v.ID):[], HRS={};
  const estDe=(x,s)=>String(x.RESPCONTACT_ID)===String(s.PERSON_ID)||String(x.CONTACT_ID)===String(s.PERSON_ID);
  if(v.ID) DS.by('timelog','PROJECT_ID',v.ID).forEach(r=>{ HRS[r.STAFF_ID]=(HRS[r.STAFF_ID]||0)+(+r.TIMEPERIOD||0); });
  const COL=DS.all('staff').filter(s=>s.PERSON_ID!=null).map(s=>{ const L=MBR.filter(x=>estDe(x,s)), aut=[...new Set(L.filter(x=>+x.TEAMROLECODE!==12).map(x=>ROLE[x.TEAMROLECODE]||'rôle '+x.TEAMROLECODE))];
      return {s,a12:L.some(x=>+x.TEAMROLECODE===12),aut,parti:+s.ISACTIVE===0||(!!s.QUITTINGDATE&&String(s.QUITTINGDATE).slice(0,10)<auj),h:HRS[s.ID]||0}; })
    .filter(c=>!isNew||!c.parti).sort((a,b)=>cmp(staffName(a.s),staffName(b.s)));
  const att=new Set(COL.filter(c=>c.a12).map(c=>String(c.s.ID)));   /* cochés : intervenant « Collaborateurs » */
  const colBox=corps.querySelector('.sg-ep-cols'), colN=corps.querySelector('.sg-ep-coln');
  const majColN=()=>{ const n=COL.filter(c=>att.has(String(c.s.ID))||c.aut.length).length; colN.textContent=n?n+' collaborateur'+(n>1?'s':'')+' attribué'+(n>1?'s':''):'Aucun collaborateur attribué'; };
  const ligCol=c=>{ const id=String(c.s.ID), seul=c.aut.length>0&&!c.a12, ok=seul||att.has(id);
    const ti=[c.parti?'A quitté le bureau'+(c.s.QUITTINGDATE?' le '+dfr(String(c.s.QUITTINGDATE).slice(0,10)):''):'',
      c.aut.length?'Attribué'+(c.a12?' aussi':'')+' comme intervenant « '+c.aut.join(' », « ')+' » : à modifier dans les intervenants du projet':''].filter(Boolean).join(' · ');
    return '<label class="'+(ok||c.aut.length?'on':'')+(seul?' dis':'')+'"'+(ti?' title="'+E(ti)+'"':'')+'><input type="checkbox" data-collab="'+E(id)+'"'+(ok?' checked':'')+(seul?' disabled':'')+'>'
      +'<span class="ini">'+E(c.s.INITIALS||'')+'</span><span class="nm">'+E(staffName(c.s))+'</span>'+(c.h?'<span class="h" title="Heures déjà saisies sur l’affaire">'+nxH(c.h)+' h</span>':'')+'</label>'; };
  colBox.innerHTML=COL.map(ligCol).join('')||'<span class="vide">Aucun collaborateur dans l’équipe du bureau.</span>';
  majColN();
  colBox.addEventListener('change',e=>{ const id=e.target.dataset.collab; if(id==null) return; if(e.target.checked) att.add(id); else att.delete(id);
    const c=COL.find(x=>String(x.s.ID)===id); e.target.closest('label').classList.toggle('on',e.target.checked||!!(c&&c.aut.length)); majColN(); });
  /* genres d'affaire, en deux temps comme dans l'ancien logiciel (23.10.2026, demande de Paulo) : 1) choisir le groupe d'affaire (Habitat individuel,
     Habitat collectif…, avec le nombre de genres cochés), 2) cocher le genre (Nouvelle construction, Transformation…) ; genres cochés en étiquettes
     « groupe · genre » au-dessus (× pour retirer, clic = ouvre son groupe) ; plusieurs genres possibles, comme avant (project_projectkind) */
  const GR=DS.all('projectkind').sort((a,b)=>cmp((DS.get('projectgroup',a.PROJECTGROUP_ID)||{}).SORTORDER,(DS.get('projectgroup',b.PROJECTGROUP_ID)||{}).SORTORDER)||cmp(a.SORTORDER,b.SORTORDER));
  const GRP=[...new Set(GR.map(k=>k.PROJECTGROUP_ID))], grpNom=g=>nm(DS.get('projectgroup',g))||'Sans groupe';
  const chips=corps.querySelector('.sg-ep-chips'), lGrp=corps.querySelector('.sg-ep-grp'), lGen=corps.querySelector('.sg-ep-gen');
  let gSel=(GR.find(k=>kinds.has(k.ID))||GR[0]||{}).PROJECTGROUP_ID;
  const majGenres=()=>{ const sel=GR.filter(k=>kinds.has(k.ID));
    chips.innerHTML=sel.length?sel.map(k=>'<span class="nx-tag sg-ep-chip" data-chip-grp="'+E(k.PROJECTGROUP_ID)+'" title="Ouvrir le groupe">'+E(grpNom(k.PROJECTGROUP_ID)+' · '+nm(k))+'<button type="button" data-kind-x="'+k.ID+'" title="Retirer">×</button></span>').join(''):'<span class="vide">Aucun genre d’affaire choisi</span>';
    lGrp.innerHTML=GRP.map(g=>{ const n=GR.filter(k=>k.PROJECTGROUP_ID===g&&kinds.has(k.ID)).length;
      return '<button type="button" role="option" data-grp="'+E(g)+'" class="'+(g===gSel?'on':'')+'" aria-selected="'+(g===gSel)+'">'+E(grpNom(g))+(n?'<span class="n">'+n+'</span>':'')+'</button>'; }).join('');
    corps.querySelector('.sg-ep-gt').textContent='2. Genre — '+grpNom(gSel);
    lGen.innerHTML=GR.filter(k=>k.PROJECTGROUP_ID===gSel).map(k=>'<label><input type="checkbox" data-kind="'+k.ID+'"'+(kinds.has(k.ID)?' checked':'')+'> '+E(nm(k))+'</label>').join('')||'<span class="vide">Aucun genre dans ce groupe.</span>'; };
  majGenres();
  lGrp.addEventListener('click',e=>{ const b=e.target.closest('[data-grp]'); if(!b) return; gSel=GRP.find(g=>String(g)===b.dataset.grp); majGenres(); });
  chips.addEventListener('click',e=>{ if(e.target.closest('[data-kind-x]')) return; const c=e.target.closest('[data-chip-grp]'); if(c){ gSel=GRP.find(g=>String(g)===c.dataset.chipGrp); majGenres(); } });
  corps.addEventListener('change',e=>{ const id=e.target.dataset&&e.target.dataset.kind; if(id!=null){ const n=+id; if(e.target.checked) kinds.add(n); else kinds.delete(n); majGenres(); } });
  corps.addEventListener('click',e=>{ const x=e.target.closest('[data-kind-x]'); if(x){ kinds.delete(+x.dataset.kindX); majGenres(); return; }
    const a=e.target.closest('[data-go-sec]'); if(a){ const s0=corps.querySelector('[data-sec="'+a.dataset.goSec+'"]'); if(s0){ s0.classList.remove('repli'); fige=Date.now(); s0.scrollIntoView({block:'start'}); liens.forEach(l=>l.classList.toggle('on',l===a)); } return; }
    const r=e.target.closest('[data-repli]'); if(r) r.parentElement.classList.toggle('repli'); });
  corps.addEventListener('keydown',e=>{ const r=e.target.closest&&e.target.closest('[data-repli]'); if(r&&(e.key==='Enter'||e.key===' ')){ e.preventDefault(); r.click(); } });
  /* en-tête : numéro et désignation en direct */
  corps.querySelector('[data-k="NUMBER"]').addEventListener('input',e=>{ corps.querySelector('[data-tete="n"]').textContent=e.target.value||'Nouvelle affaire'; e.target.classList.remove('err'); });
  corps.querySelector('[data-k="TITLE"]').addEventListener('input',e=>{ corps.querySelector('[data-tete="t"]').textContent=e.target.value; });
  const D=dialog({title:isNew?'Nouvelle affaire':'Éditer l’affaire',width:'min(980px,95vw)',body:corps,buttons:[{t:'Annuler'},{t:isNew?'Créer l’affaire':'Enregistrer',pri:true,fn:async bd=>{
    readK(bd,v,['PROJECTSTATECODE']); Object.assign(v,adr);
    const num=bd.querySelector('[data-k="NUMBER"]');
    if(!v.NUMBER){ toast('Le numéro d’affaire est obligatoire.',true); num.classList.add('err'); num.scrollIntoView({block:'center'}); num.focus(); return false; }
    if(DS.all('project').some(x=>x.NUMBER===v.NUMBER&&x.ID!==v.ID)){ toast('Ce numéro d’affaire existe déjà.',true); num.classList.add('err'); num.scrollIntoView({block:'center'}); num.focus(); return false; }
    if(v.ID==null) v.ID=DS.newIds('project')[0];
    const ops=[{t:'project',id:v.ID,val:v}], old=new Set(DS.by('project_projectkind','PROJECT_ID',v.ID).map(l=>l.PROJECTKINDS_ID));
    kinds.forEach(k=>{ if(!old.has(k)) ops.push({t:'project_projectkind',id:k+'-'+v.ID,val:{PROJECT_ID:v.ID,PROJECTKINDS_ID:k}}); });
    old.forEach(k=>{ if(!kinds.has(k)) ops.push({t:'project_projectkind',id:k+'-'+v.ID,val:null}); });
    let so=DS.by('projectmember','PROJECT_ID',v.ID).reduce((a,x)=>Math.max(a,+x.SORTORDER||0),0);   /* nouveaux intervenants : à la suite */
    if(moChoisi!=null){ const m8=svMember(v,8);   /* maître de l'ouvrage choisi : intervenant « Maître d'ouvrage » (rôle 8) mis à jour ou créé */
      if(m8){ if(String(m8.CONTACT_ID)!==String(moChoisi)) ops.push({t:'projectmember',id:m8.ID,val:{...m8,CONTACT_ID:moChoisi}}); }
      else { const id=DS.newIds('projectmember')[0];
        ops.push({t:'projectmember',id,val:{ID:id,PROJECTDIVISION:null,PROJECTROLE:null,TEAMROLECODE:8,PROJECT_ID:v.ID,CONTACT_ID:moChoisi,BKP:null,NOTE:null,ISHIDDEN:0,RESPCONTACT_ID:null,SORTORDER:++so}}); } }
    /* collaborateurs : intervenant « Collaborateurs » (rôle 12) créé pour chaque collaborateur coché, retiré pour chaque collaborateur décoché
       (ses seuls enregistrements rôle 12 sur l'affaire) ; CONTACT_ID = société du collaborateur, sinon celle des autres collaborateurs */
    const ajouts=COL.filter(c=>att.has(String(c.s.ID))&&!c.a12), retraits=COL.filter(c=>c.a12&&!att.has(String(c.s.ID)));
    if(ajouts.length){ const ids=DS.newIds('projectmember',ajouts.length), soc=(DS.all('staff').find(s=>s.COMPANYCONTACT_ID!=null)||{}).COMPANYCONTACT_ID??null;
      ajouts.forEach((c,i)=>ops.push({t:'projectmember',id:ids[i],val:{ID:ids[i],PROJECTDIVISION:null,PROJECTROLE:null,TEAMROLECODE:12,PROJECT_ID:v.ID,CONTACT_ID:c.s.COMPANYCONTACT_ID??soc,BKP:null,NOTE:null,ISHIDDEN:0,RESPCONTACT_ID:c.s.PERSON_ID,SORTORDER:++so}})); }
    retraits.forEach(c=>MBR.filter(x=>+x.TEAMROLECODE===12&&estDe(x,c.s)).forEach(x=>ops.push({t:'projectmember',id:x.ID,val:null})));
    await DS.commit(ops); AF.g.sel=String(v.ID); toast('Affaire enregistrée.'); }}]});
  /* sommaire : rubrique visible surlignée */
  const bd=D.bd; liens=[...corps.querySelectorAll('[data-go-sec]')];
  bd.addEventListener('scroll',()=>{ if(Date.now()-fige<500) return; const r=bd.getBoundingClientRect(), S=[...corps.querySelectorAll('[data-sec]')];
    let cur=S[0].dataset.sec; S.forEach(x=>{ if(x.getBoundingClientRect().top<=r.top+40) cur=x.dataset.sec; });
    /* tout en bas : les dernières rubriques ne peuvent pas monter en haut — la rubrique surlignée le reste si elle est visible, sinon la dernière visible */
    if(bd.scrollTop+bd.clientHeight>=bd.scrollHeight-4){ const on=liens.find(a=>a.classList.contains('on')), vis=S.filter(x=>{ const b=x.getBoundingClientRect(); return b.bottom>r.top+10&&b.top<r.bottom-10; }).map(x=>x.dataset.sec);
      if(on&&vis.includes(on.dataset.goSec)) return; cur=vis[vis.length-1]||cur; }
    liens.forEach(a=>a.classList.toggle('on',a.dataset.goSec===cur)); });
  setTimeout(()=>{ const n=corps.querySelector(isNew?'[data-k="NUMBER"]':'[data-k="TITLE"]'); if(n) n.focus(); },0);
  return D; }
editProject=sgEditAffaire;
/* chapitre Affaires : administrateur et chef de projet seulement (18.10.2026), avec les droits de l'écran d'origine */
['gestion','controlling','mes','toutes'].forEach(k=>{ const r=SG_VUE_DROIT['aff-'+k]; SG_VUE_DROIT['affd-'+k]=()=>(sgAdmin()||SG_ACC.profil==='cdp')&&(!r||!!r()); });
/* fiche projet : même limite d'accès que la page du projet */
{ const r0=VIEWS['nx-projet'].render; VIEWS['nx-projet'].render=function(m,arg){ if(arg!=null&&DS.get('project',arg)&&!sgProjetPermis(arg)){ VIEW.nxTitle='Projet non attribué'; nxPage(m,SG_NON_ATTRIBUE); return; } return r0.apply(this,arguments); }; }
/* ═══ Vue d'ensemble Projets (18.10.2026, refaite) : chiffre total, une tuile par catégorie (nombre + jauge « en cours ») ; chaque
   élément ouvre la liste filtrée nx-listeprojets ; tâches ouvertes (carré vert) et urgentes (carré rouge) ; puis les modules du domaine
   (données par état retirées à la demande).
   Projets comptés = projets visibles (administrateur ou droit « tous » : tous ; collaborateur : attribués ; chef de projet : les siens). */
const SG_ETATS=[[1,'Configuration','#d9d9d5'],[2,'En cours','#003346'],[3,'En attente','#FFF266'],[4,'Terminés','#636E7E'],[5,'Archivés','#b4b7bb']];   // couleurs validées (écart daltonisme ≥ 24)
const SG_CATS=[['architecture','Projets','building'],   /* « Architecture » renommé « Projets » (18.10.2026) */['expertise','Expertises','search'],['faisabilite','Faisabilités','ruler'],['interne','Autres','home']   /* « Internes » renommé « Autres » (19.10.2026) */];
const sgCatOuInterne=p=>sgInterne(p)?'interne':sgCatProjet(p);
function sgProjetsVisibles(){ const ps=DS.all('project'); if(sgAdmin()||sgDroit('projets_voir','tous')) return ps;
  const ids=SG_ACC.profil==='collab'?sgProjetsAssignes():sgMesProjets(); return ps.filter(p=>ids.has(String(p.ID))&&(!sgCollabSeul()||SG_ETATS_COLLAB.includes(+p.PROJECTSTATECODE))); }
VIEWS['dom-projets']={
  render(m){ const collab=SG_ACC.profil==='collab'&&!sgDroit('projets_voir','tous');   /* collaborateur : ses projets attribués et ses tâches (18.10.2026) */
    const d=SG_D.projets, ps=sgProjetsVisibles(), tot=ps.length, enc=L=>L.filter(p=>+p.PROJECTSTATECODE===2).length, pl=(n,s)=>n+' '+s+(n>1?'s':'');
    const kpi=([k,t,ico])=>{ const L=ps.filter(p=>sgCatOuInterne(p)===k), n=L.length, e=enc(L), pc=n?Math.round(e/n*100):0;
      return '<div class="sg-pv-k" data-go="nx-listeprojets" data-arg="cat:'+k+'" title="'+nxE(t)+' : '+pl(n,'projet')+', '+e+' en cours"><div class="l">'+nxSvg(ico)+nxE(t)+'</div>'
        +'<div class="v">'+n+'</div><div class="nx-bar"><i style="width:'+pc+'%"></i></div><div class="s"><b>'+e+'</b> en cours'+(n?' · '+pc+' %':'')+'</div></div>'; };
    /* tâches (18.10.2026) : ouvertes = ni réglées ni annulées, d'un projet visible en cours (comme les listes Tâches) ; collaborateur : les siennes
       (sgTachesCompte : « en cours » comprend les urgentes) ; tk.p = ouvertes, tk.u = urgentes */
    /* 19.10.2026 : comme les trois listes de l'ancien logiciel — En traitement (état 1), Urgent (état 1 et marquée urgente), Réglé (état 3) —,
       tâches des projets visibles en cours ; collaborateur : les siennes (ptModuleRows, comme les listes) ; tk.p / tk.u / tk.r */
    const vis=new Set(ps.map(p=>String(p.ID))), enCoursP=t=>vis.has(String(t.PROJECT_ID))&&+(DS.get('project',t.PROJECT_ID)||{}).PROJECTSTATECODE===2;
    const me=ME.staff, TT=collab?[]:DS.all('projecttask').filter(enCoursP), nbM=k=>me&&typeof ptModuleRows==='function'?ptModuleRows(k,me.ID).length:0;
    const tk=collab?{p:nbM('pending'),u:nbM('urgent'),r:nbM('done')}
      :{p:TT.filter(t=>+t.PROJECTTASKSTATECODE===1).length,u:TT.filter(t=>+t.PROJECTTASKSTATECODE===1&&t.ISURGENT).length,r:TT.filter(t=>+t.PROJECTTASKSTATECODE===3).length};
    const pastille=(n,cl,t)=>'<i class="sg-pt '+cl+(n?'':' zero')+'" title="'+nxE(t)+'">'+n+'</i>';
    const LT=[['taches-encours','En cours','task','v',tk.p,collab?'Mes tâches en cours':'Tâches en cours des projets actifs'],   /* « En traitement » de l'ancien logiciel, affiché « En cours » (19.10.2026) */
      ['taches-urgent','Urgent','urgent','r',tk.u,collab?'Mes tâches urgentes':'Tâches urgentes des projets actifs'],
      ['taches-regle','Réglé','check','g',tk.r,collab?'Mes tâches réglées':'Tâches réglées des projets actifs']].filter(x=>nxCan(x[0]));
    const its=d.items.filter(it=>!it.hide&&nxCan(it.v)&&!it.grp),   /* modules du menu sans « Tous les projets » ni le groupe « Tâches » (retirés de la vue d'ensemble le 18.10.2026 ; Tâches reste au menu) */
      tuiles=()=>{ let s=''; for(let i=0;i<its.length;i++){ const it=its[i]; if(!it.grp){ s+=tuile(it); continue; }      /* groupe (« Tâches ») : une tuile, ses modules en liens */
          const g=it.grp, L=[]; while(i<its.length&&its[i].grp===g) L.push(its[i++]); i--;
          const tk=g==='Tâches'?sgTachesCompte():{u:0,p:0}, pt=x=>x.v==='taches-urgent'?sgPastille(tk.u,'r',tk.u+' tâche(s) urgente(s)'):x.v==='taches-encours'?sgPastille(tk.p,'v',tk.p+' tâche(s) en cours'):'';
          const pg0=g==='Tâches'?(tk.u?sgPastille(tk.u,'r',tk.u+' tâche(s) urgente(s)'):sgPastille(tk.p,'v',tk.p+' tâche(s) en cours')):'';   /* menu déroulant, replié (18.10.2026) */
          s+='<div class="sg-tile sg-tile-grp"><button class="sg-tgh" data-fn="tgrp" aria-expanded="false"><span class="ti">'+nxSvg('task')+'<h3>'+nxE(g)+'</h3>'+pg0+'</span>'+nxSvg('next','chev')+'</button>'
            +'<p>'+L.map(x=>nxE(x.st||x.t)).join(' · ')+'</p><div class="sg-tl">'+L.map(x=>'<button data-go="'+x.v+'">'+nxSvg(x.ico)+nxE(x.st||x.t)+pt(x)+nxSvg('arrow','go')+'</button>').join('')+'</div></div>'; }
        return s; },
      tuile=it=>'<div class="sg-tile'+(it.hero?' hero':'')+'" data-go="'+it.v+'"><div class="ti">'+nxSvg(it.ico)+'<h3>'+nxE(it.t)+'</h3></div><p>'+nxE(it.d||'')+'</p><div class="ft">'+nxSvg('arrow','go')+'</div></div>';
    const html='<div class="sg-pv"><div class="sg-pv-h"><div><div class="sg-lbl">Projets</div><h2>Vue d’ensemble</h2><p>'+nxE(d.d||'')+'</p></div>'
      +'<div class="sg-pv-hero" data-go="nx-listeprojets" data-arg="tous"><b>'+tot+'</b><span>'+(collab?(tot>1?'mes projets':'mon projet'):(tot>1?'projets':'projet')+(sgAdmin()||sgDroit('projets_voir','tous')?' au total':' accessibles'))+'<br><em>'+enc(ps)+' en cours</em></span></div></div>'
      +'<div class="sg-pv-t">Par catégorie</div><div class="sg-pv-kpis">'+SG_CATS.map(kpi).join('')+'</div>'
      /* Tâches (19.10.2026) : menu déroulant, fermé à l'arrivée — intertitre comme « Modules » + pastilles verte (en cours) et rouge (urgent) ;
         ouvert : les trois listes en tuiles, comme les modules */
      +(LT.length?'<section class="sg-pv-tk"><button class="sg-pv-t sg-pv-tkh" data-fn="taches" aria-expanded="false" title="Afficher les listes de tâches">'+nxSvg('next','chev')+'Tâches'
        +'<span class="pts">'+LT.filter(x=>x[3]!=='g').map(x=>pastille(x[4],x[3],x[4]+' · '+x[1].toLowerCase()+' — '+x[5])).join('')+'</span></button>'
        +'<div class="sg-tiles sg-pv-tkl">'+LT.map(([v,t,ico,cl,n,dsc])=>'<div class="sg-tile" data-go="'+v+'" title="'+nxE(dsc)+'"><div class="ti">'+nxSvg(ico)+'<h3>'+nxE(t)+'</h3>'+pastille(n,cl,n+' · '+dsc)+'</div>'
          +'<p>'+nxE(dsc)+'.</p><div class="ft">'+nxSvg('arrow','go')+'</div></div>').join('')+'</div></section>':'')
      +'<div class="sg-pv-t">Modules</div><div class="sg-tiles">'+tuiles()+'</div></div>';
    const pg=nxPage(m,html); pg._fn.tgrp=b=>{ const t=b.closest('.sg-tile-grp'), on=t.classList.toggle('on'); b.setAttribute('aria-expanded',String(on)); };
    pg._fn.taches=b=>{ const t=b.closest('.sg-pv-tk'), on=t.classList.toggle('on'); b.setAttribute('aria-expanded',String(on)); b.title=on?'Replier les listes de tâches':'Afficher les listes de tâches'; }; },
  refresh(ts){ if(hit(ts,'project','projecttask','projectmember')) go('dom-projets'); } };
/* Affaires ▸ vue d'ensemble (22.10.2026, demande de Paulo) : même présentation que la vue d'ensemble Projets — en-tête et total en grand,
   « Par état » (en cours, en attente, terminées, archivées : jauge = part du total, nombre d'affaires actives ces 30 jours), « Activité »
   (affaires actives, heures du mois, de l'année, part facturable de l'année ; tout le bureau), puis les modules du chapitre */
VIEWS['dom-affaires']={
  render(m){ const d=SG_D.affaires, ps=sgProjetsVisibles(), tot=ps.length, now=new Date(), y=now.getFullYear(), mo=now.getMonth(), lim=dayKey(new Date(y,mo,now.getDate()-30)), act=new Set();
    let hM=0, hA=0, hAF=0; DS.all('timelog').forEach(r=>{ const v=+r.TIMEPERIOD||0; if(tlKey(r)>=lim) act.add(String(r.PROJECT_ID)); if(+r.TIMEYEAR===y){ hA+=v; if(+r.ISCHARGEABLE) hAF+=v; if(+r.TIMEMONTH===mo) hM+=v; } });
    const pl=(n,s1,s2)=>num(n,0)+' '+(n>1?s2:s1), actifs=L=>L.filter(p=>act.has(String(p.ID))).length, E=nxE;
    const etat=([st,t,ico])=>{ const L=ps.filter(p=>+p.PROJECTSTATECODE===st), n=L.length, pc=tot?Math.round(n/tot*100):0, a=actifs(L);
      return '<div class="sg-pv-k" data-go="nx-listeprojets" data-arg="etat:'+st+'" title="'+E(t)+' : '+pl(n,'affaire','affaires')+', '+a+' active'+(a>1?'s':'')+' ces 30 jours"><div class="l">'+nxSvg(ico)+E(t)+'</div>'
        +'<div class="v">'+n+'</div><div class="nx-bar"><i style="width:'+pc+'%"></i></div><div class="s"><b>'+a+'</b> active'+(a>1?'s':'')+' ces 30 jours · '+pc+' %</div></div>'; };
    const kpi=(t,ico,v,s2,bar,go,arg)=>'<div class="sg-pv-k"'+(go?' data-go="'+go+'"'+(arg?' data-arg="'+arg+'"':''):'')+'><div class="l">'+nxSvg(ico)+E(t)+'</div><div class="v">'+v+'</div>'+(bar!=null?'<div class="nx-bar"><i style="width:'+Math.max(0,Math.min(100,bar))+'%"></i></div>':'<div class="nx-bar vide"></div>')+'<div class="s">'+s2+'</div></div>';
    const enc=ps.filter(p=>+p.PROJECTSTATECODE===2), aE=actifs(enc), moisL=MOISL[mo].toLowerCase();
    const its=d.items.filter(it=>!it.hide&&nxCan(it.v)), tuile=it=>'<div class="sg-tile'+(it.hero?' hero':'')+'" data-go="'+it.v+'"><div class="ti">'+nxSvg(it.ico)+'<h3>'+E(it.t)+'</h3></div><p>'+E(it.d||'')+'</p><div class="ft">'+nxSvg('arrow','go')+'</div></div>';
    const html='<div class="sg-pv"><div class="sg-pv-h"><div><h2>Vue d’ensemble</h2><p>'+E(d.d||'')+'</p></div>'   /* libellé « Affaires » et son filet retirés (23.10.2026, demande de Paulo) */
      +'<div class="sg-pv-hero" data-go="nx-listeprojets" data-arg="tous"><b>'+tot+'</b><span>'+(tot>1?'affaires au total':'affaire au total')+'<br><em>'+enc.length+' en cours</em></span></div></div>'
      +'<div class="sg-pv-t">Par état</div><div class="sg-pv-kpis">'+[[2,'En cours','task'],[3,'En attente','clock'],[4,'Terminées','star'],[5,'Archivées','db']].map(etat).join('')+'</div>'
      +'<div class="sg-pv-t">Activité</div><div class="sg-pv-kpis">'
        +kpi('Affaires actives','trend',act.size?ps.filter(p=>act.has(String(p.ID))).length:0,'heures saisies ces 30 jours · <b>'+aE+'</b> sur '+enc.length+' en cours',enc.length?aE/enc.length*100:null,'affd-gestion')   /* Controlling archivé dans Réglages (23.10.2026) : la tuile ouvre Gestion */
        +kpi('Heures du mois','clock',num(Math.round(hM),0)+'<small>h</small>','saisies en '+moisL+' · tout le bureau',null)
        +kpi('Heures de l’année','cal',num(Math.round(hA),0)+'<small>h</small>','saisies en '+y+' · tout le bureau',null)
        +kpi('Part facturable','receipt',(hA?Math.round(hAF/hA*100):0)+'<small>%</small>','<b>'+num(Math.round(hAF),0)+' h</b> facturables en '+y,hA?hAF/hA*100:null)+'</div>'
      +'<div class="sg-pv-t">Modules</div><div class="sg-tiles">'+its.map(tuile).join('')+'</div></div>';
    nxPage(m,html); },
  refresh(ts){ if(hit(ts,'project','timelog')) go('dom-affaires'); } };
/* liste des projets visibles, filtrée par catégorie (cat:…) ou par état (etat:…) ; un clic ouvre la page du projet */
VIEWS['nx-listeprojets']={
  render(m,arg){ const a=String(arg||'tous'), [k,v]=a.split(':'), cat=k==='cat'?v:null, etat=k==='etat'?+v:null, q=String(nxLS.get('sg3_listep_q','')||'');
    const C=SG_CATS.find(x=>x[0]===cat), E=SG_ETATS.find(x=>x[0]===etat);
    VIEW.nxTitle=C?C[1]:E?'Projets · '+E[1].toLowerCase():'Tous les projets';
    const rang=p=>{ const i=[2,3,1,4,5].indexOf(+p.PROJECTSTATECODE); return i<0?9:i; };
    const L=sgProjetsVisibles().filter(p=>C?sgCatOuInterne(p)===cat:E?+p.PROJECTSTATECODE===etat:true).sort((x,y)=>(+sgInterne(x)-+sgInterne(y))||(rang(x)-rang(y))||cmp(String(y.NUMBER||''),String(x.NUMBER||'')));
    const chip=(ar,t)=>'<button data-go="nx-listeprojets" data-arg="'+ar+'" class="'+(ar===a?'on':'')+'">'+nxE(t)+'</button>';
    const row=p=>{ const c=sgCatProjet(p), mo=projMO(p);
      return '<tr class="nx-row" data-go="nx-pdom" data-arg="'+p.ID+'" data-q="'+nxE([p.NUMBER,p.TITLE,mo,p.LOCATION].filter(Boolean).join(' ').toLowerCase())+'" style="display:table-row">'
        +'<td><span class="nx-tag num">'+nxE(p.NUMBER||'')+'</span></td><td><b>'+nxE(p.TITLE||'')+'</b>'+(!sgInterne(p)&&c!=='architecture'?' <span class="nx-tag">'+SG_CAT_L[c]+'</span>':'')+'</td>'
        +'<td>'+nxE(mo)+'</td><td>'+nxE(p.LOCATION||'')+'</td><td>'+nxStateTag(p)+'</td></tr>'; };
    const html='<div class="sg-mesp-bar"><div class="seg">'+chip('tous','Tous')+SG_CATS.map(([kk,t])=>chip('cat:'+kk,t)).join('')+'</div>'
      +'<div class="seg">'+SG_ETATS.filter(([c])=>!sgCollabSeul()||SG_ETATS_COLLAB.includes(c)).map(([c,t])=>chip('etat:'+c,t)).join('')+'</div>'
      +'<input class="inp" id="sg-listep-q" placeholder="Rechercher un projet…" value="'+nxE(q)+'"><span class="n"></span></div>'
      +(L.length?'<table class="nx-tbl sg-mesp"><tr><th>N°</th><th>Projet</th><th>Maître d’ouvrage</th><th>Lieu</th><th>État</th></tr>'+L.map(row).join('')+'</table>':'<div class="nx-empty">Aucun projet.</div>');
    const pg=nxPage(m,html), inp=pg.querySelector('#sg-listep-q'), nb=pg.querySelector('.sg-mesp-bar .n');
    const filt=()=>{ const s=inp.value.trim().toLowerCase(); nxLS.set('sg3_listep_q',inp.value); let n=0;
      pg.querySelectorAll('tr[data-q]').forEach(tr=>{ const ok=!s||tr.dataset.q.includes(s); tr.style.display=ok?'table-row':'none'; if(ok) n++; }); nb.textContent=n+' projet'+(n>1?'s':''); };
    inp.oninput=filt; filt(); },
  refresh(ts){ if(hit(ts,'project','projectmember')) go('nx-listeprojets',VIEW.arg); } };
NX_VIEW['nx-listeprojets']={d:SG_D.projets,t:'Liste des projets',fiche:1};
/* écrans du moteur hors du menu Projets (liens internes du moteur) : rattachés au chapitre Affaires pour l'en-tête et le menu */
[['aff-toutes','Toutes les affaires'],['aff-mes','Mes affaires']].forEach(([v,t])=>{ if(!NX_VIEW[v]) NX_VIEW[v]={d:SG_D.affaires,t,fiche:1}; });

/* ═══ Tri des tableaux (20.10.2026) : un clic sur le titre d'une colonne d'un tableau .nx-tbl de la coquille trie les lignes ; un
   2e clic inverse. Premier clic : texte de A à Z, nombres du plus grand au plus petit, dates de la plus récente à la plus ancienne
   (jj.mm.aaaa, « Septembre 2026 »). Cellules vides en bas ; lignes « Total » (tr.tot ou texte « Total… ») gardées à leur place
   (en tête ou en pied) ; sous-lignes (tr.sub : phases partielles, sous-phases) triées avec leur ligne parente. Tri retenu pour la
   session, par écran et par jeu de colonnes, et réappliqué quand l'écran se redessine (MutationObserver). Pas de tri : plusieurs
   lignes de titres, cellules fusionnées (colspan) ou titre contenant un contrôle. Les listes du moteur (grid) ont leur propre tri. ═══ */
const SG_TRI=new Map();
const SG_MOIS_FR=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const SG_TRI_MOIS=new RegExp('^('+SG_MOIS_FR.join('|')+')\\s+(\\d{4})$','i');
function sgTriVal(td){ if(!td) return null; if(td.dataset&&td.dataset.tri!=null) return td.dataset.tri?{k:'t',v:td.dataset.tri}:null;   // clé de tri fournie (ordre SIA)
  const c=td.querySelector('input,select,textarea'); const t=(c?c.value:td.textContent).replace(/\s+/g,' ').trim();
  if(!t||/^[—–-]$/.test(t)||/^\(.*\)$/.test(t)) return null;   // vide, tiret, « (sans phase) »… : toujours en bas
  let m=/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(t); if(m) return {k:'d',v:+m[3]*10000+ +m[2]*100+ +m[1]};
  m=SG_TRI_MOIS.exec(t); if(m) return {k:'d',v:+m[2]*100+SG_MOIS_FR.indexOf(m[1].toLowerCase())};
  const n=t.replace(/[’'   ]/g,'').replace(/[−–]/g,'-').replace(/(CHF|h|%|j|\/h)+$/i,'').replace(/^\+/,'');
  if(/^-?\d+(\.\d+)?$/.test(n)) return {k:'n',v:parseFloat(n)};
  return {k:'t',v:t}; }
function sgTriTable(tb){ if(tb.closest('#sg-onglet')) return null;   // tableau de bord d'un projet (onglets Heures, Contrat, Factures…) : pas de tri, à la demande (20.10.2026)
  const rows=[...tb.rows], H=rows.filter(r=>r.querySelector('th')); if(H.length!==1) return null;
  const hr=H[0]; if([...hr.cells].some(c=>c.colSpan>1||c.querySelector('input,select,button,a'))) return null;
  const data=rows.slice(rows.indexOf(hr)+1); if(data.length<2||data.some(r=>[...r.cells].some(c=>c.colSpan>1))) return null;
  return {hr,data}; }
const sgTriSig=hr=>((window.VIEW&&VIEW.id)||'')+'|'+[...hr.cells].map(c=>c.textContent.trim()).join('|');
const sgTriNum=V=>{ const k=V.filter(Boolean).map(v=>v.k); return k.length>0&&k.filter(x=>x!=='t').length>=k.length*0.8; };
function sgTriAppliquer(tb,i,sens){ const T=sgTriTable(tb); if(!T) return; const par=T.data[0].parentNode, L=T.data.filter(r=>r.parentNode===par);
  const tot=r=>r.classList.contains('tot')||/^total\b/i.test(((r.cells[0]&&r.cells[0].textContent)||'').trim());
  const tete=[], pied=[], blocs=[]; L.forEach(r=>{ if(tot(r)){ (blocs.length?pied:tete).push(r); return; }
    if(r.classList.contains('sub')&&blocs.length) blocs[blocs.length-1].subs.push(r); else blocs.push({r,subs:[]}); });
  const num=sgTriNum(blocs.map(b=>sgTriVal(b.r.cells[i]))), val=r=>{ const v=sgTriVal(r.cells[i]); return v&&num&&v.k==='t'?null:v; };
  const cmpV=(a,b)=>{ if(!a&&!b) return 0; if(!a) return 1; if(!b) return -1;
    const d=num?a.v-b.v:String(a.v).localeCompare(String(b.v),'fr',{numeric:true,sensitivity:'base'}); return sens==='asc'?d:-d; };
  const trier=X=>X.map((r,j)=>({r,j,v:val(r)})).sort((a,b)=>cmpV(a.v,b.v)||a.j-b.j).map(x=>x.r);
  const ordre=trier(blocs.map(b=>b.r)), sousDe=new Map(blocs.map(b=>[b.r,trier(b.subs)]));
  [...tete,...ordre.flatMap(r=>[r,...sousDe.get(r)]),...pied].forEach(r=>par.appendChild(r));
  [...T.hr.cells].forEach((c,j)=>{ c.classList.toggle('sg-tri',j===i); c.classList.toggle('asc',j===i&&sens==='asc'); c.classList.toggle('desc',j===i&&sens==='desc');
    if(j===i) c.setAttribute('aria-sort',sens==='asc'?'ascending':'descending'); else c.removeAttribute('aria-sort'); }); }
document.addEventListener('click',e=>{ const th=e.target.closest&&e.target.closest('table.nx-tbl th'); if(!th||e.defaultPrevented) return;
  const tb=th.closest('table'), T=sgTriTable(tb); if(!T||th.parentNode!==T.hr||!th.textContent.trim()) return;
  const i=[...T.hr.cells].indexOf(th), sig=sgTriSig(T.hr), cur=SG_TRI.get(sig);
  const sens=cur&&cur.i===i?(cur.sens==='asc'?'desc':'asc'):(sgTriNum(T.data.map(r=>sgTriVal(r.cells[i])))?'desc':'asc');
  SG_TRI.set(sig,{i,sens}); sgTriAppliquer(tb,i,sens); });
{ let f=0; const scan=()=>{ f=0; document.querySelectorAll('table.nx-tbl:not([data-tri])').forEach(tb=>{ const T=sgTriTable(tb); tb.dataset.tri=T?'1':'0'; if(!T) return;
      T.hr.classList.add('sg-triable'); [...T.hr.cells].forEach(c=>{ if(!c.textContent.trim()) c.classList.add('sg-notri'); else if(!c.title) c.title='Trier'; });
      const cur=SG_TRI.get(sgTriSig(T.hr)); if(cur&&cur.i<T.hr.cells.length) sgTriAppliquer(tb,cur.i,cur.sens); }); };
  const go0=()=>{ new MutationObserver(()=>{ if(!f) f=requestAnimationFrame(scan); }).observe(document.body,{childList:true,subtree:true}); scan(); };
  if(document.body) go0(); else document.addEventListener('DOMContentLoaded',go0); }

/* ═══ 21. MODULES « PROJET » ET « FAISABILITÉ » DE LA PAGE DU PROJET · PARCELLE & RÈGLEMENTS (20.10.2026) ═══════════════════════════
   Page du projet (nx-pdom) : deux groupes de TRAVAIL en tête — « Projet » (PV MO, Présentation client, Estimations, Descriptifs & devis,
   Dossier d’enquête, Documents : le code de l'ancien onglet Projet, sgOnglet(p,'projet')) et « Faisabilité » (seulement si le projet a une
   phase de faisabilité, sgFaisaOk : Parcelle & règlements, Documents de base, Études, Variantes, Présentation au client, Fiche de
   faisabilité ; sgOnglet(p,'faisa')). Une tuile ouvre le module en pleine page (nx-pdom, arg « <id>|Projet|<rubrique> »), la rubrique visée
   dépliée et mise en évidence (sgPdomModulePage). Le tableau de bord (nx-projet) reste un écran d'analyse : rien n'y est remis.
   Parcelle & règlements (nx-faisa, arg = ID du projet) : collection sgfaisa (un enregistrement par projet : PARCELLE, SOURCES, CONTRAINTES,
   CONCLUSION) + sgfaisatexte (texte extrait d'un règlement, un enregistrement par source, chargé à la demande) — collections propres à
   l'app, gardées par les reprises. Recherche automatique : geo.admin.ch (recherche d'adresse, identify sur les couches fédérales
   SG_FZ_COUCHES, vignettes WMS — appels directs, CORS), cadastre RDPPF du canton (service web OeREB 2.0 lu dans la couche
   ch.swisstopo-vd.stand-oerebkataster, Vaud : www.rdppf.vd.ch — getegrid puis extract/xml), règlements (PDF des dispositions juridiques
   de l'extrait, téléchargés par le relais, déposés dans Faisabilité ▸ Règlements, texte lu par pdf.js du cadre Facturation).
   Relais internet (CORS) : /api/proxy du serveur du NAS en mode bureau, sinon http://127.0.0.1:7788/proxy du serveur de sauvegarde
   (sgFzRelais) ; sans relais : message clair et saisie manuelle. Contraintes pré-remplies : couches fédérales, restrictions RDPPF, repérage
   par mots-clés et articles dans les règlements (SG_FZ_MOTS — pas d'IA pour l'instant). Fiche de faisabilité : document HTML
   (sgDocOuvrir → visionneuse, Imprimer → PDF). Droits : lecture pour qui voit le projet (sgProjetPermis), écriture « documents : dépôt »
   (serveur du NAS : même règle pour sgfaisa / sgfaisatexte). */
const SG_PMOD={'PV MO':['pv','Procès-verbaux des séances avec le maître de l’ouvrage, classés par phase (31 à 33).','Projet'],
  'Présentation client':['pdf','Documents présentés au client, par phase.','Projet'],
  'Estimations':['ruler','Calculs du coût, classés par phase.','Projet'],
  'Descriptifs & devis':['doc','Devis descriptifs par CFC, classés par phase (32, 33).','Projet'],
  'Dossier d’enquête':['list','Formulaire, questionnaires, plans et annexes de la demande d’autorisation (33).','Projet'],
  'Documents':['folder','Tous les fichiers du projet, par dossier.','Projet'],
  'Parcelle & règlements':['map','Parcelle, recherche automatique (geo.admin.ch, cadastre RDPPF), règlements, contraintes et réponses du projet.','fz'],
  'Documents de base':['folder','Plans, extraits et photos : les pièces de départ de l’étude.','Faisabilité'],
  'Études':['doc','Études et calculs de la faisabilité.','Faisabilité'],
  'Variantes':['dup','Les variantes étudiées.','Faisabilité'],
  'Présentation au client':['pdf','Les documents remis au client.','Faisabilité'],
  'Documents de la faisabilité':['folder','Tous les fichiers de la faisabilité, par dossier.','dom'],
  'Fiche de faisabilité':['print','Le document de synthèse : parcelle, sources, règlements, contraintes et réponses, variantes, conclusion.','fiche']};
const SG_PMOD_G=[['Faisabilité',['Parcelle & règlements','Documents de base','Études','Variantes','Présentation au client','Fiche de faisabilité','Documents de la faisabilité']],   // Faisabilité avant Projet (21.10.2026)
  ['Projet',['PV MO','Présentation client','Estimations','Descriptifs & devis','Dossier d’enquête','Documents']]];
Object.assign(SG_PDOM_GI,{'Projet':'building','Faisabilité':'ruler'});
SG_PDOM_T.push('sgfaisa','sgdocphase');
/* faisabilité aussi dès qu'une analyse de parcelle existe pour le projet */
{ const f0=sgFaisaOk; sgFaisaOk=function(p){ return f0(p)||!!DS.get('sgfaisa',String(p.ID)); }; }
/* groupes de modules de la page du projet : Projet (sauf projet uniquement de faisabilité), Faisabilité (phase de faisabilité) */
function sgPdomModules(p){ const fS=sgCatProjet(p)==='faisabilite'; return SG_PMOD_G.filter(([g])=>g==='Faisabilité'?sgFaisaOk(p):!fS); }
/* compteurs des tuiles des modules (appelés par sgPdomCompte quand le domaine n'est pas un domaine du moteur) */
function sgPdomModuleCompte(p,d){ const pl=(n,s,s2)=>n+' '+(n>1?(s2||s+'s'):s), F=DS.all('depotfichier'), nfc=s=>String(s||'').normalize('NFC');
  let base='', baseF=''; try{ base=ch03aDossier('document',p.ID,'Projet')+'/'; baseF=ch03aDossier('document',p.ID,'Faisabilité')+'/'; }catch(_){ return ''; }
  const sousPhase=sous=>F.filter(f=>{ const s=nfc(f.DOSSIER); return s.startsWith(base)&&s.slice(base.length).split('/')[1]===nfc(sous); }).length;
  const viv=t=>DS.by(t,'PROJECT_ID',p.ID).filter(x=>!+x.ISMARKEDASDELETED).length;
  switch(d){
    case 'PV MO': return pl(sousPhase('PV MO'),'PV','PV');
    case 'Présentation client': return pl(sousPhase('Présentation client'),'fichier');
    case 'Estimations': return pl(viv('costplanningdocument'),'estimation');
    case 'Descriptifs & devis': return pl(viv('costestimatedocument'),'devis','devis');
    case 'Dossier d’enquête': return pl(F.filter(f=>{ const s=nfc(f.DOSSIER); return s.startsWith(base)&&s.includes('/'+nfc('Dossier d’enquête')+'/'); }).length,'pièce');
    case 'Documents de base': case 'Études': case 'Variantes': case 'Présentation au client': return pl(F.filter(f=>nfc(f.DOSSIER)===baseF+nfc(d)).length,'fichier');
    case 'Parcelle & règlements': { const r=DS.get('sgfaisa',String(p.ID)); if(!r) return 'à commencer'; const n=(r.CONTRAINTES||[]).length, s=(r.SOURCES||[]).length;
      return n?pl(n,'contrainte')+(s?' · '+pl(s,'source'):''):s?pl(s,'source'):(r.PARCELLE&&(r.PARCELLE.EGRID||r.PARCELLE.ADRESSE)?'parcelle saisie':'à commencer'); }
    case 'Fiche de faisabilité': { const r=DS.get('sgfaisa',String(p.ID)); return r&&String(r.CONCLUSION||'').trim()?'conclusion rédigée':'conclusion à rédiger'; }
  } return ''; }
/* module en pleine page dans la page du projet : l'ancien code des onglets (sgOnglet 'projet' / 'faisa') ; foc = rubrique à montrer */
function sgPdomFocusCodes(k,foc){ if(!foc) return []; if(k==='faisa'){ const r=SG_FAISA_RUB.find(x=>x[1]===foc); return r?[r[0]]:[]; }
  if(foc==='Documents') return ['docs']; if(foc==='Dossier d’enquête') return ['p33']; return ['p31','p32','p33','acl']; }
function sgPdomModulePage(C,p,dom,foc){ const k=dom==='Faisabilité'?'faisa':dom==='Documents du chantier'?'chantier':'projet', cle=k+':'+p.ID, ouv=SG_CGRP[cle]||(SG_CGRP[cle]=new Set());
  sgPdomFocusCodes(k,foc).forEach(c=>ouv.add(c));
  const pg=nxPage(C,(k==='faisa'?'<div class="sg-htls sg-iacts sg-fz-acts"><button data-fn="fz" title="Parcelle, recherche automatique, règlements, contraintes et réponses">'+nxSvg('map')+'<span>Parcelle & règlements</span></button>'
    +'<button data-fn="fzfiche" title="Fiche de faisabilité : le document de synthèse">'+nxSvg('print')+'<span>Fiche de faisabilité</span></button></div>':'')+'<div id="sg-onglet"></div>');
  pg._fn.fz=()=>go('nx-faisa',p.ID); pg._fn.fzfiche=()=>sgFaisaFiche(p);
  sgOnglet(p,k,pg);
  if(foc){ let n=0; const t=setInterval(()=>{ const b=[...pg.querySelectorAll('.sg-rub-h b, .sg-pgrp-h .t b')].find(x=>x.textContent.trim().startsWith(foc)); if(b||++n>40){ clearInterval(t); if(!b) return;
      const el=b.closest('.sg-rub')||b.closest('.sg-pgrp'); if(!el) return; el.classList.add('sg-foc'); el.scrollIntoView({block:'center'}); setTimeout(()=>el.classList.remove('sg-foc'),2500); } },100); } }

/* ── Parcelle & règlements (nx-faisa) ─────────────────────────────────────────────────────────────────────────────────────────── */
const SG_FZ_T='sgfaisa', SG_FZ_TX='sgfaisatexte', SG_FZ={sauve:0,tx:{}};
if(typeof HEAVY!=='undefined'&&Array.isArray(HEAVY)&&!HEAVY.includes(SG_FZ_TX)) HEAVY.push(SG_FZ_TX);   /* textes des règlements : chargés à la demande (DS.need) */
const SG_FZ_THEMES=[['zone','Zone et affectation'],['indice','Indice d’utilisation (IUS, COS, CUS)'],['emprise','Emprise au sol'],['hauteur','Hauteur et niveaux'],
  ['distances','Distances aux limites et entre bâtiments'],['toiture','Toiture et pente'],['stationnement','Stationnement et places de parc'],['verts','Espaces verts et plantations'],
  ['dangers','Dangers naturels'],['bruit','Bruit (degré de sensibilité)'],['pollues','Sites pollués'],['patrimoine','Patrimoine (recensement architectural, ISOS)'],['foret','Forêt (lisière)'],
  ['eaux','Eaux'],['energie','Énergie'],['acces','Accès'],['autres','Autres']], SG_FZ_TH_L=Object.fromEntries(SG_FZ_THEMES);
const SG_FZ_STATUTS=[['a_traiter','À traiter'],['a_verifier','À vérifier'],['conforme','Conforme'],['non_conforme','Non conforme']], SG_FZ_ST_L=Object.fromEntries(SG_FZ_STATUTS);
const SG_FZ_GEO={search:'https://api3.geo.admin.ch/rest/services/api/SearchServer',ident:'https://api3.geo.admin.ch/rest/services/all/MapServer/identify',
  wms:'https://wms.geo.admin.ch/',carte:'https://map.geo.admin.ch/',rdppf:{VD:'https://www.rdppf.vd.ch/ws/RdppfSVC.svc'}};
/* couches fédérales interrogées au point de la parcelle : [couche, libellé, thème, tolérance (px ; 0 = surfaces), fn(propriétés) → {t titre, v valeur, r règle}]
   (identifiants vérifiés le 20.10.2026 ; les couches raster — bruit routier / ferroviaire, dangers, forêt swissTLM3D — ne répondent pas à identify :
   le degré de sensibilité au bruit, les distances à la forêt, les eaux et les sites pollués cantonaux viennent de l'extrait RDPPF) */
const SG_FZ_COUCHES=[
  ['ch.are.bauzonen','Zones à bâtir harmonisées (ARE)','zone',0,P=>({t:'Zone à bâtir (statistique fédérale) : '+P.ch_bez_f,v:P.ch_bez_f,r:'Statistique suisse des zones à bâtir (ARE), commune de '+P.name+' : '+P.ch_bez_f+' (code '+P.ch_code_hn+'). La zone exacte et son règlement sont ceux du plan d’affectation communal (extrait RDPPF).'})],
  ['ch.bag.radonkarte','Carte du radon (OFSP)','dangers',0,P=>({t:'Radon : probabilité de dépassement '+P.probability_prozent+' %',v:P.probability_prozent+' %',r:'Carte du radon de l’OFSP : '+P.probability_prozent+' % de probabilité qu’un bâtiment dépasse la valeur de référence de 300 Bq/m³. Prévoir les mesures de protection nécessaires (ORaP).'})],
  ['ch.bafu.gefahren-baugrundklassen','Classes de sols de fondation (SIA 261)','dangers',0,P=>({t:'Sol de fondation : classe '+P.bgk,v:'classe '+P.bgk,r:'Classe de sol de fondation '+P.bgk+' ('+(P.referenz||'SIA 261')+') pour le dimensionnement parasismique.'})],
  ['ch.swisstopo.geologie-hydrogeologische_karte-grundwasservorkommen','Réservoirs aquifères (carte hydrogéologique)','eaux',0,P=>({t:'Réservoir aquifère : '+(P.type_fr||P.label),v:P.type_fr||P.label,r:'Carte hydrogéologique de la Suisse 1:500 000 : '+(P.type_fr||P.label)+'. Les zones et périmètres de protection des eaux souterraines figurent dans l’extrait RDPPF.'})],
  ['ch.bak.bundesinventar-schuetzenswerte-ortsbilder','ISOS — sites construits d’importance nationale','patrimoine',0,P=>({t:'ISOS : '+(P.label||''),v:'',r:'Site construit d’importance nationale (ISOS) : '+(P.label||'')+'. Vérifier l’objectif de sauvegarde du périmètre et les exigences cantonales et communales.'})],
  ['ch.bafu.bundesinventare-bln','IFP — paysages, sites et monuments naturels','patrimoine',0,P=>({t:'IFP : '+(P.bln_name||P.label),v:P.bln_obj?'objet '+P.bln_obj:'',r:'Inventaire fédéral des paysages, sites et monuments naturels d’importance nationale : objet n° '+(P.bln_obj||'')+' « '+(P.bln_name||P.label)+' ». Objectifs de protection à respecter'+(P.linkurldescription?' (fiche : '+P.linkurldescription+')':'')+'.'})],
  ['ch.bak.schutzgebiete-unesco_weltkulturerbe','Patrimoine mondial de l’UNESCO','patrimoine',0,P=>({t:'UNESCO : '+(P.name_fr||P.label),v:'',r:(P.type_fr||'Bien du patrimoine mondial')+' « '+(P.name_fr||P.label)+' » : exigences particulières d’intégration (plan de gestion, commission).'})],
  ['ch.babs.kulturgueter','Inventaire PBC des biens culturels','patrimoine',10,P=>({t:'Bien culturel PBC : '+(P.label||''),v:'',r:'Objet de l’inventaire suisse des biens culturels d’importance nationale ou régionale (PBC) sur la parcelle ou à proximité : '+(P.label||'')+'.'})],
  ['ch.astra.ivs-nat','IVS — voies de communication historiques (national)','patrimoine',10,P=>({t:'IVS national : '+(P.label||''),v:'',r:'Voie de communication historique d’importance nationale à proximité (IVS) : '+(P.label||'')+'. Substance à préserver.'})],
  ['ch.astra.ivs-reg_loc','IVS — voies historiques (régional, local)','patrimoine',10,P=>({t:'IVS régional / local : '+(P.label||''),v:'',r:'Voie de communication historique régionale ou locale à proximité (IVS) : '+(P.label||'')+'.'})],
  ['ch.bafu.bundesinventare-flachmoore','Bas-marais d’importance nationale','autres',0,P=>({t:'Inventaire fédéral — bas-marais : '+(P.label||''),v:'',r:'Objet de l’inventaire fédéral des bas-marais d’importance nationale : protection intégrale (LPN).'})],
  ['ch.bafu.bundesinventare-hochmoore','Hauts-marais d’importance nationale','autres',0,P=>({t:'Inventaire fédéral — hauts-marais : '+(P.label||''),v:'',r:'Objet de l’inventaire fédéral des hauts-marais : protection intégrale (LPN).'})],
  ['ch.bafu.bundesinventare-auen','Zones alluviales d’importance nationale','autres',0,P=>({t:'Inventaire fédéral — zone alluviale : '+(P.label||''),v:'',r:'Objet de l’inventaire fédéral des zones alluviales d’importance nationale.'})],
  ['ch.bafu.bundesinventare-trockenwiesen_trockenweiden','Prairies et pâturages secs','autres',0,P=>({t:'Inventaire fédéral — prairie ou pâturage sec : '+(P.label||''),v:'',r:'Objet de l’inventaire fédéral des prairies et pâturages secs d’importance nationale.'})],
  ['ch.bafu.bundesinventare-amphibien','Sites de reproduction de batraciens','autres',0,P=>({t:'Inventaire fédéral — site de reproduction de batraciens : '+(P.label||''),v:'',r:'Objet de l’inventaire fédéral des sites de reproduction de batraciens d’importance nationale.'})],
  ['ch.bafu.bundesinventare-moorlandschaften','Sites marécageux','autres',0,P=>({t:'Inventaire fédéral — site marécageux : '+(P.label||''),v:'',r:'Site marécageux d’une beauté particulière et d’importance nationale (art. 78 al. 5 Cst.).'})],
  ['ch.bav.kataster-belasteter-standorte-oev','Sites pollués — transports publics','pollues',0,P=>({t:'Site pollué (transports publics) : '+(P.label||''),v:'',r:'Inscrit au cadastre des sites pollués du domaine des transports publics (OFT) : '+(P.label||'')+'.'})],
  ['ch.bazl.kataster-belasteter-standorte-zivilflugplaetze','Sites pollués — aérodromes civils','pollues',0,P=>({t:'Site pollué (aérodromes civils) : '+(P.label||''),v:'',r:'Inscrit au cadastre des sites pollués du domaine des aérodromes civils (OFAC).'})],
  ['ch.vbs.kataster-belasteter-standorte-militaer','Sites pollués — domaine militaire','pollues',0,P=>({t:'Site pollué (domaine militaire) : '+(P.label||''),v:'',r:'Inscrit au cadastre des sites pollués du domaine militaire (DDPS).'})],
  ['ch.bfe.elektrische-anlagen_ueber_36','Installations électriques > 36 kV','autres',10,P=>({t:'Installation électrique à haute tension à proximité : '+(P.label||''),v:'',r:'Ligne ou installation électrique de plus de 36 kV à moins de 25 m environ ('+(P.label||'')+') : vérifier les distances et le rayonnement non ionisant (ORNI).'})],
  ['ch.swisstopo.swisstlm3d-gewaessernetz','Cours d’eau (swissTLM3D)','eaux',10,P=>({t:'Cours d’eau à proximité : '+(P.name||P.label||''),v:'',r:'Cours d’eau « '+(P.name||'')+' » (n° '+(P.gwl_nr||'')+') à moins de 25 m environ : vérifier l’espace réservé aux eaux et les distances (extrait RDPPF, thème « Espace réservé aux eaux »).'})],
  ['ch.bfs.gebaeude_wohnungs_register','Registre des bâtiments et logements (RegBL)','existant',10,null]];
const SG_FZ_GKLAS={1110:'Maison individuelle',1121:'Maison à deux logements',1122:'Immeuble à trois logements ou plus',1130:'Habitat communautaire',1211:'Hôtel',1212:'Autre hébergement',1220:'Bureaux',1230:'Commerce',1231:'Restaurant, bar',1241:'Gare, aérogare, transports',1242:'Garage',1251:'Industrie',1252:'Réservoir, silo',1261:'Culture, loisirs',1262:'Musée, bibliothèque',1263:'École, recherche',1264:'Hôpital, soins',1265:'Sport',1271:'Bâtiment agricole',1272:'Lieu de culte',1273:'Monument historique',1274:'Autre bâtiment'};
const SG_FZ_GBAUP={8011:'avant 1919',8012:'1919–1945',8013:'1946–1960',8014:'1961–1970',8015:'1971–1980',8016:'1981–1985',8017:'1986–1990',8018:'1991–1995',8019:'1996–2000',8020:'2001–2005',8021:'2006–2010',8022:'2011–2015',8023:'après 2015'};
/* thèmes du cadastre RDPPF → thèmes des contraintes */
const SG_FZ_RDPPF_TH={'ch.Nutzungsplanung':'zone','ch.Laermempfindlichkeitsstufen':'bruit','ch.BelasteteStandorte':'pollues','ch.Grundwasserschutzzonen':'eaux','ch.Grundwasserschutzareale':'eaux','ch.Gewaesserraum':'eaux','ch.StatischeWaldgrenzen':'foret','ch.Waldabstandslinien':'foret','ch.Waldreservate':'foret','ch.Planungszonen':'zone','ch.Sicherheitszonenplan':'autres'};
const sgFzRdppfTheme=code=>SG_FZ_RDPPF_TH[code]||(/Baulinien/.test(code)?'distances':/BelasteteStandorte/.test(code)?'pollues':/Projektierungszonen/.test(code)?'zone':/Wald/.test(code)?'foret':/Grundwasser|Gewaesser/.test(code)?'eaux':'autres');
/* mots-clés par thème (repérage dans les règlements, sans IA) */
const SG_FZ_MOTS={indice:/\b(indices?|coefficients?|ius|cus|cos|ibus|densit[ée])\b|d[’']?(utilisation|occupation) du sol/i,emprise:/\bemprises?\b|surface b[âa]tie|taux d[’']occupation/i,
  hauteur:/\bhauteurs?\b|\bniveaux?\b|\b[ée]tages?\b|gabarits?|corniche|fa[îi]te|acrot[èe]re|attique/i,distances:/\bdistances?\b|limites? (de|des) propri[ée]t[ée]s?|mitoyen|alignements?|\breculs?\b|limites? des constructions|entre b[âa]timents/i,
  toiture:/\btoitures?\b|\btoits?\b|\bpentes?\b|combles|lucarnes?|superstructures?/i,stationnement:/stationnement|places? de parc|parkings?|\bgarages?\b|\bv[ée]los?\b/i,
  verts:/espaces? verts?|plantations?|\barbres?\b|arborisation|pleine terre|\bjardins?\b/i,dangers:/dangers? naturels?|inondations?|glissements?|\bcrues?\b|avalanches?|ruissellement|\bradon\b/i,
  bruit:/\bbruits?\b|sensibilit[ée] au bruit|degr[ée]s? de sensibilit[ée]|\bOPB\b/i,pollues:/sites? pollu[ée]s?|amiante|polluants?|assainissement des sites/i,
  patrimoine:/patrimoine|recensement architectural|monuments? historiques?|\bISOS\b|inventaire (f[ée]d[ée]ral|cantonal|des monuments)|\bnote \*?[1-4]\b|(b[âa]timents?|objets?|immeubles?) (prot[ée]g[ée]s?|class[ée]s?|recens[ée]s?)|int[ée]r[êe]t (national|r[ée]gional|local)|site construit/i,foret:/\bfor[êe]ts?\b|lisi[èe]res?|\bbois[ée]e?s\b|\bbois[ée]e?\b/i,
  eaux:/cours d[’']eau|\brives?\b|\bnappe\b|protection des eaux|r[ée]tention|infiltration|eaux (claires|us[ée]es|pluviales)/i,energie:/[ée]nergie|solaire|photovolta[ïi]que|isolation thermique|chauffage|minergie|renouvelable/i,
  acces:/\bacc[èe]s (pour|des|aux?|[àa] la) (v[ée]hicules|parcelles?|b[âa]timents?|garages?|places)|desserte|\bvoirie\b|(voie|chemin|rampe) d[’']acc[èe]s/i,zone:/\bzones?\b.*\b(destin[ée]e|affect[ée]e|r[ée]serv[ée]e)|affectation/i};
/* relais internet : /api/proxy du serveur du NAS (mode bureau) ou /proxy du serveur de sauvegarde ; geo.admin.ch répond avec CORS : appel direct */
function sgFzRelais(url){ return (typeof dsEstBureau==='function'&&dsEstBureau())?'/api/proxy?url='+encodeURIComponent(url):SG_SRV+'/proxy?url='+encodeURIComponent(url); }
const sgFzDirect=url=>/^https:\/\/[a-z0-9.-]*\.geo\.admin\.ch\//i.test(url);
const SG_FZ_SANS_RELAIS='Relais internet injoignable : lancez le serveur de sauvegarde (fact_backup_server.py) sur ce Mac, ou saisissez les données à la main.';
async function sgFzFetch(url,o){ o=o||{}; const direct=sgFzDirect(url); let r, hote=''; try{ hote=new URL(url).host; }catch(_){}
  try{ r=await fetch(direct?url:sgFzRelais(url),{cache:'no-store',signal:o.signal}); }
  catch(e){ const x=new Error(direct?'Pas de connexion à '+hote+'.':SG_FZ_SANS_RELAIS); x.relais=!direct; throw x; }
  if(!r.ok){ let m=''; try{ m=(await r.clone().json()).error||''; }catch(_){} const x=new Error(m||('Réponse '+r.status+' de '+(direct?hote:'l’hôte distant'))); x.status=r.status; throw x; }
  return r; }
const sgFzJson=async(url,o)=>(await sgFzFetch(url,o)).json(), sgFzTexte=async(url,o)=>(await sgFzFetch(url,o)).text();
/* enregistrement du projet (copie de travail) et sauvegarde */
function sgFzRec(p){ const r=DS.get(SG_FZ_T,String(p.ID)), x=r?JSON.parse(JSON.stringify(r)):{ID:String(p.ID),PROJECT_ID:p.ID};
  x.PARCELLE=x.PARCELLE||{}; x.SOURCES=x.SOURCES||[]; x.CONTRAINTES=x.CONTRAINTES||[]; x.CONCLUSION=x.CONCLUSION||''; return x; }
async function sgFzSave(rec){ rec.MODIFIE=new Date().toISOString().slice(0,19); const me=nxMe(); rec.PAR=(me&&staffName(me))||(ME.u&&ME.u.NAME)||null; SG_FZ.sauve=Date.now(); await DS.save(SG_FZ_T,rec); }
const sgFzId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
async function sgFzTexteDe(rec,s){ const k=rec.ID+':'+s.ID; if(SG_FZ.tx[k]!=null) return SG_FZ.tx[k]; await DS.need([SG_FZ_TX]).catch(()=>{}); const r=DS.get(SG_FZ_TX,k); return (SG_FZ.tx[k]=r?String(r.TEXTE||''):''); }
/* geo.admin.ch : adresse → coordonnées LV95 (x = nord, y = est dans cette API), identify, vignettes WMS */
async function sgFzChercherAdresse(q){ const d=await sgFzJson(SG_FZ_GEO.search+'?searchText='+encodeURIComponent(q)+'&type=locations&origins=address,parcel,gg25&sr=2056&lang=fr&limit=8');
  return (d.results||[]).map(r=>{ const a=r.attrs||{}, E=Math.max(+a.x||0,+a.y||0), N=Math.min(+a.x||0,+a.y||0);
    return {label:String(a.label||'').replace(/<[^>]+>/g,''),E:Math.round(E*10)/10,N:Math.round(N*10)/10,origin:a.origin}; }).filter(x=>x.E>2000000&&x.N>1000000); }
async function sgFzIdentify(E,N,layers,tol){ if(!layers.length) return [];
  const u=SG_FZ_GEO.ident+'?geometry='+E+','+N+'&geometryType=esriGeometryPoint&geometryFormat=geojson&sr=2056&layers=all:'+layers.join(',')+'&tolerance='+(tol||0)
    +(tol?'&mapExtent='+(E-250)+','+(N-250)+','+(E+250)+','+(N+250)+'&imageDisplay=200,200,96':'')+'&returnGeometry=false&lang=fr';
  return (await sgFzJson(u)).results||[]; }
/* vignettes WMS (swisstopo) : le plan cadastral (ch.kantone.cadastralwebmap-farbe, fond opaque) et l'orthophoto (ch.swisstopo.swissimage-product, jpeg) */
const sgFzWms=(E,N,r,layers,w,hh,fmt)=>SG_FZ_GEO.wms+'?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS='+layers+'&STYLES='+layers.split(',').map(()=>'').join(',')+'&CRS=EPSG:2056&BBOX='+(E-r)+','+(N-r*hh/w)+','+(E+r)+','+(N+r*hh/w)+'&WIDTH='+w+'&HEIGHT='+hh+'&FORMAT=image/'+(fmt||'png');
const SG_FZ_PLAN='ch.kantone.cadastralwebmap-farbe', SG_FZ_ORTHO='ch.swisstopo.swissimage-product';
async function sgFzParcelle(E,N){ const R=await sgFzIdentify(E,N,['ch.kantone.cadastralwebmap-farbe','ch.swisstopo.swissboundaries3d-gemeinde-flaeche.fill','ch.swisstopo-vd.stand-oerebkataster','ch.are.bauzonen'],0), by=l=>R.filter(r=>r.layerBodId===l).map(r=>r.properties||{});
  const par=by('ch.kantone.cadastralwebmap-farbe')[0]||{}, coms=by('ch.swisstopo.swissboundaries3d-gemeinde-flaeche.fill'), com=coms.find(c=>c.is_current_jahr)||coms[0]||{}, oers=by('ch.swisstopo-vd.stand-oerebkataster'), oer=oers.find(o=>o.oereb_webservice)||oers[0]||{}, bz=by('ch.are.bauzonen')[0]||{};
  return {NUMERO:par.number||oer.number||'',EGRID:par.egris_egrid||oer.egris_egrid||'',IDENTDN:par.identnd||'',CANTON:par.ak||com.kanton||'',COMMUNE:com.gemname||oer.gemeindename||bz.name||'',BFS:String(com.gde_nr||oer.bfs_nr||bz.bfs_no||''),ZONE_FED:bz.ch_bez_f||'',RDPPF_ETAT:oer.oereb_status_fr||'',RDPPF_SERVICE:oer.oereb_webservice||''}; }
/* fenêtre « Recherche de parcelle » (21.10.2026, demande de Paulo — choix « carte intégrée ») : recherche de rue / adresse / n° de parcelle
   (geo.admin.ch), carte du plan cadastral officiel (WMS swisstopo ch.kantone.cadastralwebmap-farbe, le même plan que geo.vd.ch) ou orthophoto ;
   glisser = déplacer, molette ou + / − = zoom ; clic = la parcelle est identifiée (sgFzParcelle) et surlignée (géométrie identify), ses données
   affichées ; « Valider » (actif seulement avec une parcelle) copie n°, EGRID, commune, canton, zone fédérale, service RDPPF, coordonnées du clic,
   adresse trouvée et surface calculée sur la géométrie (si la surface est vide). « Voir sur geo.vd.ch » ouvre le guichet cantonal au même endroit
   (le site externe ne peut pas renvoyer la parcelle choisie à l'app). */
async function sgFzParcelleGeom(E,N){ const u=SG_FZ_GEO.ident+'?geometry='+E+','+N+'&geometryType=esriGeometryPoint&geometryFormat=geojson&sr=2056&layers=all:'+SG_FZ_PLAN+'&tolerance=0&returnGeometry=true&lang=fr';
  const r=((await sgFzJson(u)).results||[])[0]; return r&&r.geometry||null; }
const sgFzAire=g=>{ if(!g) return 0; const P=g.type==='MultiPolygon'?g.coordinates:g.type==='Polygon'?[g.coordinates]:[], ring=R=>{ let a=0; for(let i=0,j=R.length-1;i<R.length;j=i++) a+=(R[j][0]+R[i][0])*(R[j][1]-R[i][1]); return Math.abs(a/2); };
  return P.reduce((s0,pl)=>s0+(pl.length?ring(pl[0])-pl.slice(1).reduce((t,R)=>t+ring(R),0):0),0); };
function sgFzCarteDlg(P,q0,onOk){ const st={E:+P.E||2545500,N:+P.N||1148500,res:P.E&&P.N?0.3:4,fond:'plan',sel:null,geom:null,lab:''};
  const img=h('img',{class:'sg-fzm-img',alt:'',draggable:'false'}), svg=document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('class','sg-fzm-svg');
  const plan=h('button',{class:'on',onclick:()=>fond('plan')},'Plan cadastral'), ortho=h('button',{onclick:()=>fond('ortho')},'Orthophoto');
  const map=h('div',{class:'sg-fzm-map',title:'Cliquez sur une parcelle · glisser pour déplacer · molette pour zoomer'},img,svg,
    h('div',{class:'sg-fzm-zoom'},h('button',{title:'Zoom avant',onclick:e=>{ e.stopPropagation(); zoom(0.5); }},'+'),h('button',{title:'Zoom arrière',onclick:e=>{ e.stopPropagation(); zoom(2); }},'−')),
    h('div',{class:'sg-fzm-fond'},plan,ortho));
  const q=h('input',{class:'inp',placeholder:'Rue et numéro, localité — ou n° de parcelle et commune'}); q.value=q0||P.ADRESSE||'';
  const res=h('div',{class:'sg-fzm-res'}), info=h('div',{class:'sg-fzm-info'}), msg=h('div',{class:'sg-fzm-msg'});
  const body=h('div',{class:'sg-fzm'},h('div',{class:'sg-fzm-q'},q,h('button',{class:'nx-btn pri',html:nxSvg('search')+'Rechercher',onclick:()=>chercher()}),
      h('button',{class:'nx-btn',title:'Ouvrir le guichet cartographique cantonal (geo.vd.ch) au même endroit',html:nxSvg('map')+'Voir sur geo.vd.ch',onclick:()=>{ try{ window.open('https://www.geo.vd.ch/?center='+Math.round(st.E)+','+Math.round(st.N)+'&scale='+Math.max(500,Math.round(st.res*3780))+'&wkid=2056','_blank'); }catch(_){} }})),
    res,h('div',{class:'sg-fzm-corps'},map,h('div',{class:'sg-fzm-cote'},info,msg)));
  const D=dialog({title:'Recherche de parcelle',width:'min(1180px,95vw)',body,buttons:[{t:'Annuler'},{t:'Valider',pri:true,fn:()=>{ if(!st.sel){ toast('Cliquez d’abord une parcelle sur la carte.',true); return false; } onOk(st.sel,st.lab,st.geom); }}]});
  const bv=D.bd.parentElement.querySelector('.ft .btn.pri'); if(bv) bv.disabled=true;
  const W=()=>map.clientWidth||900, Hh=()=>map.clientHeight||520, E=v=>nxE(String(v==null?'':v));
  const px=(e,n)=>[(e-st.E)/st.res+W()/2,Hh()/2-(n-st.N)/st.res];
  const dessinerSel=()=>{ svg.setAttribute('width',W()); svg.setAttribute('height',Hh()); svg.setAttribute('viewBox','0 0 '+W()+' '+Hh()); if(!st.geom){ svg.innerHTML=''; return; }
    const pl=st.geom.type==='MultiPolygon'?st.geom.coordinates:st.geom.type==='Polygon'?[st.geom.coordinates]:[];
    svg.innerHTML='<path d="'+pl.map(rs=>rs.map(R=>'M'+R.map(([e,n])=>px(e,n).map(v=>v.toFixed(1)).join(',')).join('L')+'Z').join('')).join('')+'" fill="rgba(255,242,102,.38)" stroke="#BD1E42" stroke-width="3" fill-rule="evenodd"/>'; };
  const draw=()=>{ const w=W(), hh=Hh(), L=st.fond==='ortho'?SG_FZ_ORTHO:SG_FZ_PLAN; img.style.transform=''; svg.style.transform='';
    img.src=SG_FZ_GEO.wms+'?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS='+L+'&STYLES=&CRS=EPSG:2056&BBOX='+[st.E-w/2*st.res,st.N-hh/2*st.res,st.E+w/2*st.res,st.N+hh/2*st.res].map(v=>v.toFixed(2)).join(',')+'&WIDTH='+w+'&HEIGHT='+hh+'&FORMAT=image/'+(st.fond==='ortho'?'jpeg':'png');
    dessinerSel(); };
  const montrer=()=>{ const x=st.sel; if(!x){ info.innerHTML='<p class="sg-fz-hint">Cliquez sur une parcelle de la carte pour la sélectionner.</p>'; return; }
    info.innerHTML='<h4>Parcelle '+E(x.NUMERO||'—')+'</h4><dl>'+[['Commune',x.COMMUNE],['EGRID',x.EGRID],['Canton',x.CANTON],['Surface (calculée)',x.SURFACE_C?num(x.SURFACE_C,0)+' m²':''],['Zone (statistique fédérale)',x.ZONE_FED],['Cadastre RDPPF',x.RDPPF_ETAT],['Coordonnées',num(x.E,0)+' / '+num(x.N,0)],['Adresse',st.lab]].filter(([,v])=>v).map(([l,v])=>'<dt>'+E(l)+'</dt><dd>'+E(v)+'</dd>').join('')+'</dl>'; };
  const choisirPoint=async(e0,n0)=>{ msg.textContent='Identification de la parcelle…'; try{ const [x,g]=await Promise.all([sgFzParcelle(e0,n0),sgFzParcelleGeom(e0,n0).catch(()=>null)]);
      if(!x.NUMERO&&!x.EGRID){ msg.textContent='Aucune parcelle à cet endroit.'; return; }
      st.sel=Object.assign({},x,{E:Math.round(e0*10)/10,N:Math.round(n0*10)/10,SURFACE_C:Math.round(sgFzAire(g))}); st.geom=g; msg.textContent=''; if(bv) bv.disabled=false; dessinerSel(); montrer(); }
    catch(e){ msg.textContent='✗ '+(e.message||e); } };
  const zoom=(f,mx,my)=>{ const nr=Math.min(20,Math.max(0.04,st.res*f)); if(mx!=null){ const ec=st.E+(mx-W()/2)*st.res, nc=st.N-(my-Hh()/2)*st.res; st.E=ec-(mx-W()/2)*nr; st.N=nc+(my-Hh()/2)*nr; } st.res=nr; draw(); };
  const fond=f=>{ st.fond=f; plan.classList.toggle('on',f==='plan'); ortho.classList.toggle('on',f==='ortho'); draw(); };
  const chercher=async()=>{ const t=q.value.trim(); if(!t){ toast('Indiquez une rue, une adresse ou un n° de parcelle.',true); return; } res.textContent='Recherche…';
    try{ const R=await sgFzChercherAdresse(t); res.innerHTML=''; if(!R.length){ res.textContent='Aucun résultat pour « '+t+' ».'; return; }
      const aller=r=>{ st.E=r.E; st.N=r.N; st.res=0.3; st.lab=r.label; draw(); choisirPoint(r.E,r.N); [...res.children].forEach(b=>b.classList.toggle('on',b._r===r)); };
      R.forEach(r=>{ const b=h('button',{onclick:()=>aller(r)},r.label); b._r=r; res.append(b); }); if(R.length===1||!st.sel) aller(R[0]); }
    catch(e){ res.textContent='✗ '+(e.message||e); } };
  q.onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); chercher(); } };
  let dr=null; map.onmousedown=e=>{ if(e.button!==0||e.target.closest('button')) return; e.preventDefault(); dr={x:e.clientX,y:e.clientY,dx:0,dy:0}; };
  const mv=e=>{ if(!dr) return; dr.dx=e.clientX-dr.x; dr.dy=e.clientY-dr.y; img.style.transform=svg.style.transform='translate('+dr.dx+'px,'+dr.dy+'px)'; };
  const up=e=>{ if(!dr) return; const d0=dr; dr=null; if(Math.abs(d0.dx)+Math.abs(d0.dy)>4){ st.E-=d0.dx*st.res; st.N+=d0.dy*st.res; draw(); return; }
    const b=map.getBoundingClientRect(), mx=e.clientX-b.left, my=e.clientY-b.top; choisirPoint(st.E+(mx-W()/2)*st.res,st.N-(my-Hh()/2)*st.res); };
  window.addEventListener('mousemove',mv); window.addEventListener('mouseup',up);
  const fin=new MutationObserver(()=>{ if(!document.body.contains(map)){ window.removeEventListener('mousemove',mv); window.removeEventListener('mouseup',up); fin.disconnect(); } }); fin.observe(document.body,{childList:true});
  map.addEventListener('wheel',e=>{ e.preventDefault(); const b=map.getBoundingClientRect(); zoom(e.deltaY>0?1.5:1/1.5,e.clientX-b.left,e.clientY-b.top); },{passive:false});
  montrer(); setTimeout(()=>{ draw(); if(P.E&&P.N&&(P.EGRID||P.NUMERO)) choisirPoint(+P.E,+P.N); else if(q.value.trim()) chercher(); },0); }
function sgFzProps(pr){ return Object.entries(pr||{}).filter(([k,v])=>v!=null&&v!==''&&!/^(label|objectid|fid|id|geom.*|is_current_jahr|gde_hist_id)$/i.test(k)&&!/^(bgdi_|link|url)/i.test(k)&&(typeof v==='string'||typeof v==='number')&&String(v).length<80).slice(0,8).map(([k,v])=>k+' : '+v).join(' · '); }
/* source « geo.admin.ch » : couches fédérales au point de la parcelle (+ bâtiments du RegBL sur la parcelle) */
async function sgFzGeoAdmin(rec,p,prog){ const P=rec.PARCELLE; if(!(P.E&&P.N)) throw new Error('Indiquez d’abord la parcelle (adresse ou coordonnées).'); const E=+P.E, N=+P.N;
  prog('Interrogation de geo.admin.ch (couches fédérales)…'); const R=[...await sgFzIdentify(E,N,SG_FZ_COUCHES.filter(c=>!c[3]).map(c=>c[0]),0),...await sgFzIdentify(E,N,SG_FZ_COUCHES.filter(c=>c[3]).map(c=>c[0]),10)];
  const hits=[], bats=[], vus=new Set();
  R.forEach(r=>{ const c=SG_FZ_COUCHES.find(x=>x[0]===r.layerBodId); if(!c) return; const pr=r.properties||{};
    if(c[0]==='ch.bfs.gebaeude_wohnungs_register'){ if(P.EGRID&&pr.egrid&&pr.egrid!==P.EGRID) return; if(vus.has('b'+pr.egid)) return; vus.add('b'+pr.egid);
      bats.push({egid:pr.egid,adresse:pr.strname_deinr,annee:pr.gbauj,periode:pr.gbaup,categorie:pr.gkat,classe:pr.gklas,surface:pr.garea,volume:pr.gvol,niveaux:pr.gastw,logements:pr.ganzwhg,statut:pr.gstat,parcelle:pr.lparz,egrid:pr.egrid}); return; }
    const k=c[0]+'|'+(pr.label!=null?pr.label:r.featureId); if(vus.has(k)) return; vus.add(k); let f=null; try{ f=c[4]?c[4](pr):null; }catch(_){} hits.push({couche:c[0],lib:c[1],theme:c[2],props:sgFzProps(pr),f}); });
  const src={ID:sgFzId(),TYPE:'geoadmin',TITRE:'geo.admin.ch — couches fédérales au point de la parcelle',URL:SG_FZ_GEO.carte+'?lang=fr&center='+Math.round(E)+','+Math.round(N)+'&z=11&layers=ch.kantone.cadastralwebmap-farbe',DATE:today(),
    RESUME:(hits.length?hits.map(x=>x.lib).filter((v,i,a)=>a.indexOf(v)===i).join(' · '):'aucune couche fédérale concernée au point')+(bats.length?' · '+bats.length+' bâtiment'+(bats.length>1?'s':'')+' (RegBL)':''),DONNEES:{hits,bats,couches:SG_FZ_COUCHES.length}};
  rec.SOURCES=rec.SOURCES.filter(s=>s.TYPE!=='geoadmin'); rec.SOURCES.push(src); return src; }
/* cadastre RDPPF (service web OeREB 2.0 du canton) : getegrid puis extract/xml */
const sgFzXml=s=>{ const d=new DOMParser().parseFromString(s,'application/xml'); if(d.getElementsByTagName('parsererror').length) throw new Error('Réponse XML illisible du service RDPPF.'); return d; };
function sgFzXe(e,n){ return e?[...e.getElementsByTagNameNS('*',n)][0]||null:null; }
function sgFzXc(e,n){ return e&&e.children?[...e.children].find(c=>c.localName===n)||null:null; }
function sgFzXt(e){ return e?(e.textContent||'').trim():''; }
function sgFzLt(e,n){ const x=n?sgFzXc(e,n):e; if(!x) return ''; const L=[...x.getElementsByTagNameNS('*','LocalisedText')]; if(!L.length) return sgFzXt(x);
  const fr=L.find(l=>sgFzXt(sgFzXc(l,'Language'))==='fr')||L[0], t=sgFzXc(fr,'Text'); return sgFzXt(t||fr); }
function sgFzRdppfService(rec){ const P=rec.PARCELLE, s=String(P.RDPPF_SERVICE||'').trim(); return (/^https:\/\//.test(s)?s:(SG_FZ_GEO.rdppf[String(P.CANTON||'VD').toUpperCase()]||'')).replace(/\/+$/,''); }
async function sgFzRdppf(rec,p,prog){ const P=rec.PARCELLE, svc=sgFzRdppfService(rec); if(!svc) throw new Error('Service web RDPPF inconnu pour ce canton : indiquez son adresse dans « Service RDPPF (web) ».');
  let egrid=String(P.EGRID||'').trim();
  if(!egrid){ if(!(P.E&&P.N)) throw new Error('Indiquez la parcelle (adresse, coordonnées ou EGRID).'); prog('Recherche de l’EGRID (cadastre RDPPF)…'); const x=sgFzXml(await sgFzTexte(svc+'/getegrid/xml/?EN='+P.E+','+P.N));
    egrid=sgFzXt(sgFzXe(x,'egrid')); if(!egrid) throw new Error('Aucune parcelle à ces coordonnées dans le cadastre RDPPF.'); P.EGRID=egrid; if(!P.NUMERO) P.NUMERO=sgFzXt(sgFzXe(x,'number')); }
  prog('Extrait RDPPF de la parcelle '+egrid+'…'); const x=sgFzXml(await sgFzTexte(svc+'/extract/xml/?EGRID='+encodeURIComponent(egrid))), re=sgFzXe(x,'RealEstate'); if(!re) throw new Error('Extrait RDPPF sans bien-fonds (EGRID inconnu ?).');
  const c=n=>sgFzXt(sgFzXc(re,n)); if(c('MunicipalityName')) P.COMMUNE=c('MunicipalityName'); if(c('MunicipalityCode')) P.BFS=c('MunicipalityCode'); if(c('Number')) P.NUMERO=c('Number'); if(c('IdentDN')) P.IDENTDN=c('IdentDN'); if(c('Canton')) P.CANTON=c('Canton'); if(+c('LandRegistryArea')) P.SURFACE=+c('LandRegistryArea');
  const restrictions=[...re.children].filter(e=>e.localName==='RestrictionOnLandownership').map(r=>{ const th=sgFzXc(r,'Theme');
    return {theme:sgFzLt(th),code:sgFzXt(sgFzXc(th,'Code')),sous:sgFzXt(sgFzXc(th,'SubCode')),legende:sgFzLt(r,'LegendText'),type:sgFzXt(sgFzXc(r,'TypeCode')),statut:sgFzLt(r,'Lawstatus'),surface:sgFzXt(sgFzXc(r,'AreaShare')),part:sgFzXt(sgFzXc(r,'PartInPercent')),longueur:sgFzXt(sgFzXc(r,'LengthShare')),points:sgFzXt(sgFzXc(r,'NrOfPoints')),office:sgFzLt(sgFzXc(r,'ResponsibleOffice'),'Name'),
      docs:[...r.children].filter(e=>e.localName==='LegalProvisions').map(d=>({titre:sgFzLt(d,'Title'),url:sgFzLt(d,'TextAtWeb'),type:sgFzLt(d,'Type'),abr:sgFzLt(d,'Abbreviation'),art:sgFzXt(sgFzXc(d,'ArticleNumber')),num:sgFzXt(sgFzXc(d,'OfficialNumber'))}))}; });
  const liste=n=>[...x.getElementsByTagNameNS('*',n)].map(e=>sgFzLt(e,'Text')).filter((v,i,a)=>v&&a.indexOf(v)===i), nonConcernes=liste('NotConcernedTheme'), sansDonnees=liste('ThemeWithoutData');
  const zone=restrictions.find(r=>r.code==='ch.Nutzungsplanung'&&/zone/i.test(r.legende)&&!/p[ée]rim[èe]tre/i.test(r.legende)); if(zone) P.ZONE=zone.legende;
  const themes=restrictions.map(r=>r.theme).filter((v,i,a)=>a.indexOf(v)===i);
  const src={ID:sgFzId(),TYPE:'rdppf',TITRE:'Extrait du cadastre RDPPF — parcelle '+(P.NUMERO||'')+' ('+egrid+')',URL:svc+'/extract/pdf/?EGRID='+encodeURIComponent(egrid),DATE:today(),
    RESUME:restrictions.length+' restriction'+(restrictions.length>1?'s':'')+(themes.length?' · '+themes.join(', '):'')+(nonConcernes.length?' · '+nonConcernes.length+' thème'+(nonConcernes.length>1?'s':'')+' non concerné'+(nonConcernes.length>1?'s':''):''),
    DONNEES:{egrid,service:svc,restrictions,nonConcernes,sansDonnees,themes,date:sgFzXt(sgFzXe(x,'CreationDate'))}};
  rec.SOURCES=rec.SOURCES.filter(s=>s.TYPE!=='rdppf'); rec.SOURCES.push(src); return src; }
/* documents (dispositions juridiques) liés dans l'extrait RDPPF, dédoublonnés par adresse */
function sgFzDocsRdppf(rec){ const s=rec.SOURCES.find(x=>x.TYPE==='rdppf'); if(!s||!s.DONNEES) return []; const m=new Map();
  (s.DONNEES.restrictions||[]).forEach(r=>(r.docs||[]).forEach(d=>{ if(!d.url) return; if(!m.has(d.url)) m.set(d.url,Object.assign({themes:[]},d)); const x=m.get(d.url); if(!x.themes.includes(r.theme)) x.themes.push(r.theme); }));
  return [...m.values()]; }
/* texte d'un PDF par pdf.js du cadre Facturation (worker partagé, sans eval) : une chaîne par page */
async function sgFzPdfTexte(blob,onProg){ const w=await fxEnsure(); if(typeof w.offreLoadPdfJs!=='function') throw new Error('pdf.js indisponible dans le cadre Facturation.'); await w.offreLoadPdfJs();
  const pdf=await w.pdfjsLib.getDocument({data:new w.Uint8Array(await blob.arrayBuffer())}).promise, out=[];
  try{ for(let i=1;i<=pdf.numPages;i++){ const pg=await pdf.getPage(i), tc=await pg.getTextContent(); let s='', y=null, fin=null;
      tc.items.forEach(it=>{ if(it.str==null) return; const tr=it.transform||[], ty=tr[5], tx=tr[4];
        if(y!==null&&ty!=null&&Math.abs(ty-y)>2.5) s+='\n'; else if(s&&!/\s$/.test(s)&&it.str&&!/^\s/.test(it.str)&&fin!=null&&tx!=null&&tx-fin>1.2) s+=' ';
        s+=it.str; if(it.hasEOL) s+='\n'; y=ty; fin=tx!=null?tx+(+it.width||0):null; });
      out.push(s); if(pg.cleanup) pg.cleanup(); if(onProg&&(i%4===0||i===pdf.numPages)) onProg(i,pdf.numPages); } }
  finally{ try{ pdf.destroy(); }catch(_){} }
  return out; }
/* articles d'un règlement : « Art. 12 », « Article 12 bis », « ART. 3 » en début de ligne */
function sgFzArticles(txt){ const t=String(txt||'').replace(/\r/g,''), re=/(?:^|\n)[ \t]*((?:Art(?:icle|\.)|ART(?:ICLE|\.))\s*(\d{1,4}\s*(?:[a-z]\b|bis|ter|quater)?)\.?)[ \t]*[-–—:.]?[ \t]*([^\n]{0,140})/g, A=[]; let m, last=null;
  while((m=re.exec(t))){ if(last) last.texte=t.slice(last.fin,m.index).trim(); last={num:m[2].replace(/\s+/g,''),art:'Art. '+m[2].replace(/\s+/g,''),titre:m[3].trim(),pos:m.index,fin:m.index+m[0].length,texte:''}; A.push(last); }
  if(last) last.texte=t.slice(last.fin).trim();
  const parNum=new Map(); A.filter(a=>a.texte.length>60&&!/\bArt(?:icle|\.)\s*\d/i.test(a.titre)).forEach(a=>{ const x=parNum.get(a.num); if(!x||a.texte.length>x.texte.length) parNum.set(a.num,a); });   /* table des matières : entrées courtes ou doublons écartés */
  return A.filter(a=>parNum.get(a.num)===a); }
function sgFzValeurs(s){ const m=String(s||'').match(/\d+(?:[.,]\d+)?\s*(?:m[²2]|m(?:[èe]tres?)?\b|cm\b|%|niveaux?|[ée]tages?|places?)/gi)||[]; return m.map(x=>x.replace(/\s+/g,' ').trim()).filter((v,i,a)=>a.indexOf(v)===i).slice(0,4).join(' · '); }
const sgFzNorm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
function sgFzThemeDe(s){ for(const [th,re] of Object.entries(SG_FZ_MOTS)){ if(th!=='zone'&&re.test(String(s||''))) return th; } return 'autres'; }
/* repérage par thème dans un règlement : d'abord le chapitre de la zone de la parcelle (titre d'article contenant ses mots), puis le reste */
function sgFzScanner(txt,s,zone){ const A=sgFzArticles(txt); if(!A.length) return [];
  const mots=sgFzNorm(zone).split(/[^a-z0-9]+/).filter(w=>w.length>3&&!/^(zone|zones|forte|faible|moyenne|avec|sans|pour|dans|selon|plans?|zones?)$/.test(w));
  let cand=A; if(mots.length){ const i0=A.findIndex(a=>{ const t=sgFzNorm(a.titre+' '+a.texte.slice(0,160)); return mots.every(w=>t.includes(w)); });
    if(i0>=0){ let i1=A.findIndex((a,i)=>i>i0&&/^zones?\b/i.test(a.titre)&&!mots.every(w=>sgFzNorm(a.titre).includes(w))); if(i1<0) i1=Math.min(A.length,i0+40); cand=A.slice(i0,i1); } }
  const out=[], vus=new Set();
  /* score d'un article pour un thème : 3 si son titre contient un mot du thème, + 1 par phrase qui en contient (3 au plus) ; dans le chapitre de la
     zone tout score compte (6 articles par thème au plus), ailleurs seulement les articles dont le titre parle du thème (2 au plus) */
  const scan=(liste,max,min)=>{ const parTheme={}, cands=[];
    for(const a of liste){ const t=a.texte.normalize('NFC'), phrases=t.split(/(?<=[.;])\s+(?=[A-ZÀ-Ý0-9«])/);
      for(const [th,re] of Object.entries(SG_FZ_MOTS)){ if(th==='zone') continue; const titre=re.test(a.titre||''), phr=phrases.filter(x=>re.test(x)); if(!titre&&!phr.length) continue;
        const score=(titre?3:0)+Math.min(3,phr.length); if(score<min) continue; cands.push({th,a,score,phr}); } }
    cands.sort((x,y)=>y.score-x.score||x.a.pos-y.a.pos).forEach(x=>{ const k=x.th+'|'+x.a.art; if(vus.has(k)||(parTheme[x.th]||0)>=max) return; vus.add(k); parTheme[x.th]=(parTheme[x.th]||0)+1;
      const regle=(x.phr.length?x.phr.slice(0,2).join(' '):x.a.texte.slice(0,300)).replace(/\s+/g,' ').slice(0,360);
      out.push({THEME:x.th,TITRE:(x.a.titre||SG_FZ_TH_L[x.th]).slice(0,80)+' — '+x.a.art,REGLE:regle,SOURCE:s.TITRE,ARTICLE:x.a.art,VALEUR:sgFzValeurs(regle)}); }); };
  scan(cand,6,1); if(cand!==A) scan(A.filter(a=>!cand.includes(a)),2,3); return out; }
/* pré-remplissage des contraintes depuis les sources (clé thème | titre | article | source : rien en double) */
async function sgFzPreRemplir(rec,p){ const P=rec.PARCELLE, C=rec.CONTRAINTES, cle=c=>[c.THEME,c.TITRE,c.ARTICLE,c.SOURCE].map(x=>sgFzNorm(x).trim()).join('|'), vus=new Set(C.map(cle)); let n=0;
  const add=c=>{ if(!c||!c.TITRE) return; if(vus.has(cle(c))) return; vus.add(cle(c)); C.push(Object.assign({ID:sgFzId(),STATUT:'a_traiter',REPONSE:'',NOTE:'',AUTO:1},c)); n++; };
  const g=rec.SOURCES.find(s=>s.TYPE==='geoadmin'); if(g&&g.DONNEES) (g.DONNEES.hits||[]).forEach(x=>{ if(x.f) add({THEME:x.theme,TITRE:x.f.t,REGLE:x.f.r,SOURCE:'geo.admin.ch — '+x.lib,ARTICLE:'',VALEUR:x.f.v||''}); });
  const r=rec.SOURCES.find(s=>s.TYPE==='rdppf'); if(r&&r.DONNEES) (r.DONNEES.restrictions||[]).forEach(x=>{ const th=sgFzRdppfTheme(x.code), dj=(x.docs||[]).find(d=>/disposition/i.test(d.type))||(x.docs||[])[0];
    const bases=(x.docs||[]).filter(d=>d.abr).map(d=>d.abr+(d.art?' '+d.art:'')).filter((v,i,a)=>a.indexOf(v)===i).slice(0,3).join(' ; '), part=x.part!==''&&+x.part<100?' — '+x.part+' % de la parcelle'+(x.surface?' ('+x.surface+' m²)':''):'';
    add({THEME:th,TITRE:x.legende||x.theme,REGLE:x.theme+(x.legende?' : '+x.legende:'')+(x.statut?' ('+x.statut.toLowerCase()+')':'')+part+'.'+(x.office?' Office responsable : '+x.office+'.':''),SOURCE:dj?dj.titre:'Extrait RDPPF',ARTICLE:bases,VALEUR:(th==='bruit'||th==='zone')?x.legende:(x.part!==''&&+x.part<100?x.part+' %':'')}); });
  for(const s of rec.SOURCES.filter(s=>s.TYPE==='reglement'&&s.TEXTE)){ const txt=await sgFzTexteDe(rec,s); if(txt) sgFzScanner(txt,s,P.ZONE||P.ZONE_FED||'').forEach(add); }
  return n; }
/* recherche d'un mot dans les textes des règlements : extraits avec l'article */
async function sgFzRechercher(rec,mot){ mot=String(mot||'').trim(); if(mot.length<2) return []; const m=sgFzNorm(mot), hits=[];
  for(const s of rec.SOURCES.filter(s=>s.TYPE==='reglement'&&s.TEXTE)){ const txt=await sgFzTexteDe(rec,s); if(!txt) continue; const A=sgFzArticles(txt), liste=A.length?A:[{art:'',titre:'',texte:txt}];
    for(const a of liste){ const t=a.texte.normalize('NFC'), n=sgFzNorm(t); let i=n.indexOf(m), k=0;
      while(i>=0&&k<3){ const d=Math.max(0,i-150), f=Math.min(t.length,i+m.length+200); hits.push({src:s,art:a.art,titre:a.titre,extrait:(d?'… ':'')+t.slice(d,f).replace(/\s+/g,' ')+(f<t.length?' …':''),mot}); k++; i=n.indexOf(m,i+m.length); if(hits.length>=80) return hits; } } }
  return hits; }
/* nom du fichier déposé pour un règlement téléchargé */
function sgFzNomFichier(titre,url){ let f=''; try{ const u=new URL(url); f=u.searchParams.get('nom')||decodeURIComponent(u.pathname.split('/').pop()||''); }catch(_){}
  let nom=(String(titre||'').replace(/[\/\\\u0000-\u001f\u007f-\u009f]/g,' ').replace(/\s+/g,' ').trim().slice(0,80)+(f?' — '+f.replace(/\.pdf$/i,'').slice(0,30):'')).trim().replace(/^\.+/,''); if(!nom) nom='reglement_'+sgFzId(); return nom+'.pdf'; }
/* un PDF de règlement : dépôt dans Faisabilité ▸ Règlements, texte extrait → source « reglement » + enregistrement sgfaisatexte */
async function sgFzTraiterPdf(p,rec,b,titre,url,prog,extra){ const nom=sgFzNomFichier(titre,url); let fid=null;
  try{ const dos=ch03aDossier('document',p.ID,'Faisabilité','Règlements'), ex=ch03aTrouve(dos,nom), rF=ex||await ch03aDeposer(dos,nom,b,{projet:p.ID,origine:'faisabilite'}); fid=rF?rF.ID:null; }
  catch(e){ toast('Dépôt du fichier impossible ('+(e.message||e)+') : texte extrait seulement.',true); }
  prog('Lecture du texte : '+titre+'…'); let pages=[]; try{ pages=await sgFzPdfTexte(b,(i,m)=>prog('Lecture du texte : '+titre+' — page '+i+' / '+m)); }catch(e){ toast('Texte illisible pour « '+titre+' » : '+(e.message||e),true); }
  const txt=pages.join('\n\f\n'), nA=sgFzArticles(txt).length, sid=sgFzId();
  const anciens=rec.SOURCES.filter(s=>s.TYPE==='reglement'&&((url&&s.URL===url)||(!url&&s.TITRE===titre))); for(const a of anciens){ try{ await DS.del(SG_FZ_TX,rec.ID+':'+a.ID); }catch(_){} delete SG_FZ.tx[rec.ID+':'+a.ID]; }
  rec.SOURCES=rec.SOURCES.filter(s=>!anciens.includes(s));
  rec.SOURCES.push(Object.assign({ID:sid,TYPE:'reglement',TITRE:titre,URL:url||'',DATE:today(),FICHIER:fid,PAGES:pages.length,ARTICLES:nA,TEXTE:!!txt.trim(),
    RESUME:[pages.length?pages.length+' page'+(pages.length>1?'s':''):'',nA?nA+' articles':'',txt.trim()?'':'aucun texte lisible (document numérisé ?)'].filter(Boolean).join(' · ')},extra||{}));
  if(txt.trim()){ const T=txt.slice(0,1500000); await DS.save(SG_FZ_TX,{ID:rec.ID+':'+sid,PROJECT_ID:p.ID,SOURCE_ID:sid,TEXTE:T}); SG_FZ.tx[rec.ID+':'+sid]=T; }
  return sid; }
async function sgFzTelecharger(p,rec,docs,prog,redraw){ let n=0;
  for(const d of docs){ try{ prog('Téléchargement : '+d.titre+'…'); const r=await sgFzFetch(d.url), ct=(r.headers.get('Content-Type')||'').toLowerCase(), b=await r.blob();
      if(!/pdf/.test(ct)&&!/pdf/.test(b.type||'')){ rec.SOURCES=rec.SOURCES.filter(s=>!(s.TYPE==='lien'&&s.URL===d.url)); rec.SOURCES.push({ID:sgFzId(),TYPE:'lien',TITRE:d.titre,URL:d.url,DATE:today(),RESUME:'Page web (pas un PDF) : à consulter par le lien.'+(d.abr?' '+d.abr+(d.art?' '+d.art:''):'')}); }
      else await sgFzTraiterPdf(p,rec,b,d.titre,d.url,prog,{THEMES:d.themes||[],ABR:d.abr||''});
      await sgFzSave(rec); n++; }
    catch(e){ toast('✗ '+d.titre+' : '+(e.message||e),true); if(e.relais) break; } }
  prog(''); if(n) toast(n+' document'+(n>1?'s':'')+' traité'+(n>1?'s':'')+'.'); redraw(); return n; }
function sgFzTelechargerDlg(p,rec,prog,redraw){ const docs=sgFzDocsRdppf(rec); if(!docs.length){ sgAlert('L’extrait RDPPF ne contient aucun document lié. Faites d’abord « Extrait RDPPF ».'); return; }
  const deja=new Set(rec.SOURCES.filter(s=>s.TYPE==='reglement'||s.TYPE==='lien').map(s=>s.URL)), box=h('div',{class:'sg-fz-dl'});
  docs.forEach((d,i)=>{ const pdf=/\.pdf(\?|$)|GetDocuments|Rechtsvorschriften/i.test(d.url), cb=h('input',{type:'checkbox',checked:(pdf&&/r[èe]glement/i.test(d.titre)&&!deja.has(d.url))||null}); d._cb=cb;
    box.append(h('label',{},cb,h('span',{},(deja.has(d.url)?'✓ ':'')+d.titre+(d.type?' — '+d.type:'')+(d.abr?' ('+d.abr+(d.art?' '+d.art:'')+')':'')+(pdf?'':' · page web')),h('small',{},d.url))); });
  dialog({title:'Télécharger les règlements et plans de l’extrait RDPPF',body:h('div',{},h('p',{class:'sg-fz-hint'},'Les documents cochés sont téléchargés par le relais internet et déposés dans Faisabilité ▸ Règlements ; le texte des PDF est lu pour la recherche par mot et le pré-remplissage des contraintes (PDF avec texte seulement, pas de reconnaissance de caractères). Les pages web (lois) sont gardées comme liens.'),box),
    buttons:[{t:'Annuler'},{t:'Télécharger',pri:true,fn:()=>{ const sel=docs.filter(d=>d._cb.checked); if(!sel.length){ toast('Cochez au moins un document.',true); return false; } sgFzTelecharger(p,rec,sel,prog,redraw); }}]}); }
/* fenêtre d'une contrainte (ajout ou modification) */
function sgFzContrainteDlg(rec,c,onOk){ const n=!c; c=c||{ID:sgFzId(),THEME:'zone',TITRE:'',REGLE:'',SOURCE:'',ARTICLE:'',VALEUR:'',REPONSE:'',STATUT:'a_traiter',NOTE:''}; const f={};
  const inp=(k,ph,ta)=>{ const e=ta?h('textarea',{class:'inp',placeholder:ph||''}):h('input',{class:'inp',placeholder:ph||''}); e.value=c[k]||''; f[k]=e; return e; };
  f.THEME=h('select',{class:'inp'},...SG_FZ_THEMES.map(([k,l])=>h('option',{value:k,selected:k===(c.THEME||'autres')||null},l)));
  f.STATUT=h('select',{class:'inp'},...SG_FZ_STATUTS.map(([k,l])=>h('option',{value:k,selected:k===(c.STATUT||'a_traiter')||null},l)));
  const src=inp('SOURCE','Règlement, extrait RDPPF, couche geo.admin.ch…'); src.setAttribute('list','sg-fz-srcs');
  const body=h('div',{class:'sg-fz-dlg'},h('label',{},'Thème'),f.THEME,h('label',{},'Contrainte'),inp('TITRE','Titre court de la contrainte'),h('label',{},'Règle'),inp('REGLE','Texte de la règle (article, extrait du règlement)',true),
    h('label',{},'Source'),src,h('datalist',{id:'sg-fz-srcs'},...rec.SOURCES.map(s=>h('option',{value:s.TITRE}))),h('label',{},'Article'),inp('ARTICLE','Art. 12'),h('label',{},'Valeur'),inp('VALEUR','12 m · 3 niveaux · 0.5'),
    h('label',{},'Réponse du projet'),inp('REPONSE','Ce que le projet prévoit pour répondre à la contrainte',true),h('label',{},'Statut'),f.STATUT,h('label',{},'Note'),inp('NOTE','Remarque interne (ne figure pas en évidence dans la fiche)',true));
  dialog({title:n?'Nouvelle contrainte':'Modifier la contrainte',body,buttons:[{t:'Annuler'},{t:n?'Ajouter':'Enregistrer',pri:true,fn:()=>{ if(!f.TITRE.value.trim()){ toast('Indiquez le titre de la contrainte.',true); f.TITRE.focus(); return false; }
    Object.keys(f).forEach(k=>c[k]=String(f[k].value||'').trim()); delete c.AUTO; onOk(c); }}]}); }
function sgFzLienDlg(rec,onOk){ const t=h('input',{class:'inp',placeholder:'Titre (règlement communal, directive, décision…)'}), u=h('input',{class:'inp',placeholder:'adresse web (https) du document ou de la page'}), r=h('textarea',{class:'inp',placeholder:'Résumé, remarque'});
  dialog({title:'Ajouter une source (lien)',body:h('div',{class:'sg-fz-dlg'},h('label',{},'Titre'),t,h('label',{},'Adresse'),u,h('label',{},'Résumé'),r),buttons:[{t:'Annuler'},{t:'Ajouter',pri:true,fn:()=>{ if(!t.value.trim()){ toast('Indiquez le titre.',true); return false; }
    onOk({ID:sgFzId(),TYPE:'manuel',TITRE:t.value.trim(),URL:u.value.trim(),DATE:today(),RESUME:r.value.trim()}); }}]}); }
/* écran */
function sgFzDessiner(C,p,st){ const rec=st.rec=sgFzRec(p), P=rec.PARCELLE, ecrit=sgDroit('documents','depot'), E=nxE, v=k=>E(P[k]==null?'':P[k]);
  const champ=(k,lib,ph,w)=>'<label'+(w?' class="w2"':'')+'>'+lib+'<input class="inp" data-p="'+k+'" value="'+v(k)+'" placeholder="'+E(ph||'')+'"'+(ecrit?'':' readonly')+'></label>';
  const cartes=P.E&&P.N?'<div class="sg-fz-maps"><div class="sg-fz-map"><img src="'+sgFzWms(+P.E,+P.N,110,SG_FZ_PLAN,640,480)+'" alt="Plan cadastral"><small>Plan cadastral · swisstopo, cantons</small></div>'
    +'<div class="sg-fz-map"><img src="'+sgFzWms(+P.E,+P.N,110,SG_FZ_ORTHO,640,480,'jpeg')+'" alt="Orthophoto"><small>Orthophoto · swisstopo</small></div></div>':'';
  const tag=t=>'<span class="sg-fz-tag '+E(t)+'">'+({geoadmin:'geo.admin.ch',rdppf:'RDPPF',reglement:'Règlement',manuel:'Manuel',lien:'Lien'}[t]||E(t))+'</span>';
  const srcRow=s=>'<tr><td class="r">'+E(s.DATE?dfr(s.DATE):'')+'</td><td>'+tag(s.TYPE)+'</td><td><b>'+E(s.TITRE)+'</b>'+(s.RESUME?'<br><span class="sg-fz-res-t">'+E(s.RESUME)+'</span>':'')+'</td>'
    +'<td class="r sg-fz-sa">'+(s.URL?'<button class="nx-btn sm" data-fn="ouvrirUrl" data-url="'+E(s.URL)+'" title="Ouvrir le lien dans le navigateur">'+nxSvg('share')+'Lien</button>':'')+(s.FICHIER?'<button class="nx-btn sm" data-fn="ouvrirFichier" data-fid="'+E(s.FICHIER)+'" title="Ouvrir le PDF déposé">'+nxSvg('pdf')+'PDF</button>':'')
    +(s.TEXTE?'<button class="nx-btn sm" data-fn="voirTexte" data-sid="'+E(s.ID)+'" title="Afficher le texte extrait du document">'+nxSvg('doc')+'Texte</button>':'')+(ecrit?'<button class="nx-btn sm" data-fn="supprSource" data-sid="'+E(s.ID)+'" title="Retirer cette source">'+nxSvg('minus')+'</button>':'')+'</td></tr>';
  const ctRow=c=>{ const stt=c.STATUT||'a_traiter'; return '<tr class="'+E(stt)+'" data-cid="'+E(c.ID)+'"><td class="c1"><b>'+E(c.TITRE)+'</b>'+(c.REGLE?'<span>'+E(c.REGLE)+'</span>':'')+'</td><td class="c2">'+(c.SOURCE?'<b>'+E(c.SOURCE)+'</b><br>':'')+E(c.ARTICLE||'')+'</td><td class="c3">'+E(c.VALEUR||'')+'</td>'
    +'<td class="c4">'+(ecrit?'<textarea data-cid="'+E(c.ID)+'" data-k="REPONSE" placeholder="Réponse du projet…">'+E(c.REPONSE||'')+'</textarea>':'<div class="sg-fz-rep">'+E(c.REPONSE||'—')+'</div>')+(c.NOTE?'<div class="sg-fz-note">'+E(c.NOTE)+'</div>':'')+'</td>'
    +'<td class="c5">'+(ecrit?'<select data-cid="'+E(c.ID)+'" data-k="STATUT">'+SG_FZ_STATUTS.map(([k,l])=>'<option value="'+k+'"'+(k===stt?' selected':'')+'>'+l+'</option>').join('')+'</select>':'<i class="sg-fz-st '+E(stt)+'"></i>'+E(SG_FZ_ST_L[stt]||''))+'</td>'
    +'<td class="c6">'+(ecrit?'<button data-fn="editCt" data-cid="'+E(c.ID)+'" title="Modifier la contrainte">'+nxSvg('edit')+'</button><button data-fn="supprCt" data-cid="'+E(c.ID)+'" title="Supprimer la contrainte">'+nxSvg('minus')+'</button>':'')+'</td></tr>'; };
  const regl=rec.SOURCES.filter(s=>s.TYPE==='reglement'&&s.TEXTE), nSt=k=>rec.CONTRAINTES.filter(c=>(c.STATUT||'a_traiter')===k).length;
  const L=rec.CONTRAINTES.filter(c=>!st.filtre||(c.STATUT||'a_traiter')===st.filtre), parTheme=SG_FZ_THEMES.map(([k,l])=>[k,l,L.filter(c=>(c.THEME||'autres')===k)]).filter(x=>x[2].length);
  const html='<div class="sg-fz">'
    +nxCard('c12','Parcelle','<div class="b">'+(ecrit?'<div class="sg-fz-adr"><label>Adresse ou lieu<input class="inp" id="sg-fz-q" placeholder="Rue et numéro, NPA localité — ou n° de parcelle et commune" value="'+v('ADRESSE')+'"></label><button class="nx-btn pri" data-fn="chercher">'+nxSvg('search')+'Rechercher la parcelle</button></div><div class="sg-fz-res" id="sg-fz-res"></div>':(P.ADRESSE?'<p class="sg-fz-hint">'+v('ADRESSE')+'</p>':''))
      +'<div class="sg-fz-form">'+champ('COMMUNE','Commune')+champ('NUMERO','N° de parcelle')+champ('EGRID','EGRID','CH…')+champ('SURFACE','Surface (m²)')+champ('E','Coordonnée E (LV95)','2 5xx xxx')+champ('N','Coordonnée N (LV95)','1 1xx xxx')+champ('ZONE','Zone d’affectation',P.ZONE_FED?'statistique fédérale : '+P.ZONE_FED:'',true)+champ('CANTON','Canton','VD')+champ('RDPPF_SERVICE','Service RDPPF (web)','adresse du service web cantonal, trouvée automatiquement',true)+'</div>'
      +cartes+'</div>',(P.E&&P.N?'<span class="a" data-fn="carte">Carte fédérale</span>':''))
    +nxCard('c12','Recherche automatique','<div class="b"><p class="sg-fz-hint">geo.admin.ch (couches fédérales : zones à bâtir, radon, inventaires, patrimoine, eaux, sites pollués fédéraux…), cadastre RDPPF du canton (restrictions de droit public et dispositions juridiques), puis téléchargement des règlements liés. Chaque résultat devient une source datée ; les contraintes se pré-remplissent depuis ces sources.</p>'
      +(ecrit?'<div class="sg-fz-btns"><button class="nx-btn pri" data-fn="tout">'+nxSvg('search')+'Tout rechercher</button><button class="nx-btn" data-fn="geo">geo.admin.ch</button><button class="nx-btn" data-fn="rdppf">Extrait RDPPF</button><button class="nx-btn" data-fn="dl">Télécharger les règlements</button><button class="nx-btn" data-fn="ajoutPdf">'+nxSvg('import')+'Règlement (fichier PDF)</button><button class="nx-btn" data-fn="ajoutLien">'+nxSvg('plus')+'Source (lien)</button></div>':'')
      +'<div class="sg-fz-prog" id="sg-fz-prog"></div>'
      +(rec.SOURCES.length?'<table class="nx-tbl sg-fz-src"><tr><th class="r">Date</th><th>Type</th><th>Source</th><th></th></tr>'+rec.SOURCES.slice().sort((a,b)=>cmp(b.DATE,a.DATE)).map(srcRow).join('')+'</table>':'<div class="nx-empty">Aucune source pour l’instant.</div>')+'</div>')
    +nxCard('c12','Règlements','<div class="b">'+(regl.length?'<p class="sg-fz-hint">'+regl.map(s=>E(s.TITRE)+(s.PAGES?' ('+s.PAGES+' p.'+(s.ARTICLES?', '+s.ARTICLES+' articles':'')+')':'')).join(' · ')+'</p><div class="sg-fz-rech"><input class="inp" id="sg-fz-mot" placeholder="Mot à chercher dans les règlements : hauteur, niveaux, distance, stationnement…" value="'+E(st.mot||'')+'"><button class="nx-btn" data-fn="rech">'+nxSvg('search')+'Rechercher</button><span class="n" id="sg-fz-nb"></span></div><div id="sg-fz-hits"></div>'
      :'<div class="nx-empty">Aucun règlement lu. Faites « Extrait RDPPF » puis « Télécharger les règlements », ou ajoutez un règlement (fichier PDF).</div>')+'</div>')
    +nxCard('c12','Contraintes et réponses','<div class="b"><div class="sg-fz-kpis"><span><b>'+rec.CONTRAINTES.length+'</b> contrainte'+(rec.CONTRAINTES.length>1?'s':'')+'</span>'+SG_FZ_STATUTS.map(([k,l])=>'<span><i class="sg-fz-st '+k+'"></i><b>'+nSt(k)+'</b> '+l.toLowerCase()+'</span>').join('')
      +'<span class="seg sg-fz-filtre"><button data-fn="filtre" data-st="" class="'+(st.filtre?'':'on')+'">Toutes</button>'+SG_FZ_STATUTS.map(([k,l])=>'<button data-fn="filtre" data-st="'+k+'" class="'+(st.filtre===k?'on':'')+'">'+l+'</button>').join('')+'</span></div>'
      +(parTheme.length?'<table class="nx-tbl sg-fz-ct"><tr><th>Contrainte et règle</th><th>Source · article</th><th>Valeur</th><th>Réponse du projet</th><th>Statut</th><th></th></tr>'+parTheme.map(([k,l,cs])=>'<tr class="grp"><td colspan="6">'+E(l)+' <small>('+cs.length+')</small></td></tr>'+cs.map(ctRow).join('')).join('')+'</table>'
        :'<div class="nx-empty">'+(rec.CONTRAINTES.length?'Aucune contrainte avec ce statut.':'Aucune contrainte. Lancez les recherches puis « Pré-remplir depuis les sources », ou ajoutez une contrainte à la main.')+'</div>')+'</div>',
      ecrit?'<span class="a" data-fn="prefill">Pré-remplir depuis les sources</span><span class="a" data-fn="ajoutCt">Ajouter une contrainte</span>':'')
    +sgFzVolCarte(rec,st,ecrit)   /* application des règles, volumétrie, plan, 3D, coupe (21.10.2026) */
    +nxCard('c12','Conclusion','<div class="b sg-fz-conc">'+(ecrit?'<textarea id="sg-fz-conc" placeholder="Conclusion de l’étude : faisabilité, potentiel constructible, risques et points à vérifier, suite à donner…">'+E(rec.CONCLUSION||'')+'</textarea>':'<div class="sg-fz-rep">'+E(rec.CONCLUSION||'—')+'</div>')
      +'<div class="sg-fz-btns" style="margin-top:12px"><button class="nx-btn pri" data-fn="fiche">'+nxSvg('print')+'Fiche de faisabilité</button>'+(rec.MODIFIE?'<span class="sg-fz-hint" style="margin:0">Modifié le '+E(dfr(String(rec.MODIFIE).slice(0,10)))+(rec.PAR?' par '+E(rec.PAR):'')+'</span>':'')+'</div></div>')
    +'</div>';
  const pg=nxPage(C,html), prog=t=>{ const e=pg.querySelector('#sg-fz-prog'); if(e) e.textContent=t||''; };
  const redraw=()=>{ if(!C.isConnected) return; const mi=pg.querySelector('#sg-fz-mot'); if(mi) st.mot=mi.value; C.innerHTML=''; sgFzDessiner(C,p,st); };
  const save=async()=>{ try{ await sgFzSave(rec); return true; }catch(e){ toast('✗ Enregistrement : '+(e.message||e),true); return false; } };
  pg.querySelectorAll('input[data-p]').forEach(i=>i.onchange=async()=>{ let val=i.value.trim(); if(/^(E|N|SURFACE)$/.test(i.dataset.p)){ val=val.replace(/[’'\s]/g,'').replace(',','.'); if(val!==''&&!isFinite(+val)){ toast('Nombre attendu.',true); return; } if(val!=='') val=+val; }
    P[i.dataset.p]=val; await save(); if(/^(E|N)$/.test(i.dataset.p)) redraw(); });
  pg.querySelectorAll('textarea[data-cid],select[data-cid]').forEach(x=>x.onchange=async()=>{ const c=rec.CONTRAINTES.find(c=>c.ID===x.dataset.cid); if(!c) return; c[x.dataset.k]=x.value; await save(); if(x.dataset.k==='STATUT') redraw(); });
  const conc=pg.querySelector('#sg-fz-conc'); if(conc) conc.onchange=async()=>{ rec.CONCLUSION=conc.value; await save(); };
  const choisir=async r=>{ P.ADRESSE=r.label; P.E=r.E; P.N=r.N; prog('Identification de la parcelle (geo.admin.ch)…');
    try{ const x=await sgFzParcelle(r.E,r.N); ['NUMERO','EGRID','IDENTDN','CANTON','COMMUNE','BFS','RDPPF_ETAT','RDPPF_SERVICE','ZONE_FED'].forEach(k=>{ if(x[k]) P[k]=x[k]; }); }catch(e){ toast('Parcelle non identifiée : '+(e.message||e),true); }
    prog(''); await save(); redraw(); };
  const essayer=async(fn,lib)=>{ try{ const s=await fn(rec,p,prog); await save(); prog(''); toast(lib+' : '+s.RESUME); redraw(); }catch(e){ prog(''); toast('✗ '+lib+' : '+(e.message||e),true); } };
  const montrerHits=hits=>{ const box=pg.querySelector('#sg-fz-hits'), nb=pg.querySelector('#sg-fz-nb'); if(!box) return; nb.textContent=hits.length?hits.length+' extrait'+(hits.length>1?'s':'')+(hits.length>=80?' (80 premiers)':''):'aucun extrait';
    const re=new RegExp(st.mot.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'ig');
    box.innerHTML=hits.map((x,i)=>'<div class="sg-fz-hit"><div class="t"><b>'+E(x.src.TITRE)+(x.art?' · '+E(x.art):'')+(x.titre?' — '+E(x.titre):'')+'</b>'+E(x.extrait).replace(re,m=>'<mark>'+m+'</mark>')+'</div>'+(ecrit?'<button class="nx-btn sm" data-fn="hitCt" data-i="'+i+'" title="Créer une contrainte à partir de cet extrait">'+nxSvg('plus')+'Contrainte</button>':'')+'</div>').join('');
    st.hits=hits; };
  const chercherMot=async()=>{ const mi=pg.querySelector('#sg-fz-mot'); if(!mi) return; st.mot=mi.value.trim(); if(st.mot.length<2){ toast('Indiquez au moins deux caractères.',true); return; } montrerHits(await sgFzRechercher(rec,st.mot)); };
  const mi=pg.querySelector('#sg-fz-mot'); if(mi){ mi.onkeydown=e=>{ if(e.key==='Enter') chercherMot(); }; if(st.mot&&st.mot.length>=2) chercherMot(); }
  const qi=pg.querySelector('#sg-fz-q'); if(qi) qi.onkeydown=e=>{ if(e.key==='Enter') pg._fn.chercher(); };
  Object.assign(pg._fn,{
    chercher:()=>sgFzCarteDlg(P,(qi&&qi.value.trim())||'',async(x,lab,g)=>{
      if(g){ const pl=g.type==='MultiPolygon'?g.coordinates:g.type==='Polygon'?[g.coordinates]:[], ext=pl.map(r=>r[0]).sort((a,b)=>sgFzAireRing(b)-sgFzAireRing(a))[0]; if(ext) P.GEOM=ext.map(q=>[Math.round(q[0]*100)/100,Math.round(q[1]*100)/100]); }   /* forme de la parcelle (volumétrie) */   /* fenêtre « Recherche de parcelle » (carte intégrée, 21.10.2026) */
      const autre=!!(x.EGRID&&P.EGRID&&x.EGRID!==P.EGRID);   /* autre parcelle : surface, zone et forme de l'ancienne ne valent plus */
      if(lab) P.ADRESSE=lab; P.E=x.E; P.N=x.N; ['NUMERO','EGRID','IDENTDN','CANTON','COMMUNE','BFS','RDPPF_ETAT','RDPPF_SERVICE','ZONE_FED'].forEach(k=>{ if(x[k]) P[k]=x[k]; });
      if(autre){ delete P.ZONE; if(!g) delete P.GEOM; }
      if(x.SURFACE_C&&(autre||!(+P.SURFACE>0))) P.SURFACE=x.SURFACE_C; await save(); toast('Parcelle '+(P.NUMERO||'')+(P.COMMUNE?' ('+P.COMMUNE+')':'')+' reprise.'); redraw(); }),
    chercherListe:async()=>{   /* ancienne recherche en liste sous le champ (gardée, plus reliée au bouton) */ const q=(qi&&qi.value.trim())||''; if(!q){ toast('Indiquez une adresse ou un lieu.',true); return; } prog('Recherche de l’adresse (geo.admin.ch)…');
      try{ const R=await sgFzChercherAdresse(q); prog(''); const box=pg.querySelector('#sg-fz-res'); box.innerHTML=''; if(!R.length){ box.textContent='Aucun résultat sur geo.admin.ch pour « '+q+' ».'; return; }
        if(R.length===1){ choisir(R[0]); return; } R.forEach(r=>box.append(h('button',{onclick:()=>choisir(r)},r.label+'  —  E '+num(r.E,0)+' · N '+num(r.N,0)))); }
      catch(e){ prog(''); toast('✗ '+(e.message||e),true); } },
    carte:()=>{ try{ window.open(SG_FZ_GEO.carte+'?lang=fr&center='+Math.round(+P.E)+','+Math.round(+P.N)+'&z=11&layers=ch.kantone.cadastralwebmap-farbe','_blank'); }catch(_){} },
    tout:async()=>{ if(!(P.E&&P.N)){ toast('Indiquez d’abord la parcelle (adresse ou coordonnées).',true); return; }
      try{ await sgFzGeoAdmin(rec,p,prog); await save(); }catch(e){ toast('✗ geo.admin.ch : '+(e.message||e),true); }
      let relais=true; try{ await sgFzRdppf(rec,p,prog); await save(); }catch(e){ toast('✗ RDPPF : '+(e.message||e),true); relais=!e.relais; }
      if(relais){ const docs=sgFzDocsRdppf(rec).filter(d=>/r[èe]glement/i.test(d.titre)&&/\.pdf(\?|$)|GetDocuments|Rechtsvorschriften/i.test(d.url)&&!rec.SOURCES.some(s=>s.TYPE==='reglement'&&s.URL===d.url)); if(docs.length) await sgFzTelecharger(p,rec,docs,prog,()=>{}); }
      const n=await sgFzPreRemplir(rec,p); await save(); prog(''); toast(n?n+' contrainte'+(n>1?'s':'')+' pré-remplie'+(n>1?'s':'')+'.':'Recherches terminées : aucune nouvelle contrainte.'); redraw(); },
    geo:()=>essayer(sgFzGeoAdmin,'geo.admin.ch'), rdppf:()=>essayer(sgFzRdppf,'Extrait RDPPF'),
    dl:()=>sgFzTelechargerDlg(p,rec,prog,redraw),
    ajoutPdf:()=>{ const inp=h('input',{type:'file',accept:'application/pdf,.pdf',multiple:true}); inp.onchange=async()=>{ let n=0; for(const f of inp.files){ try{ await sgFzTraiterPdf(p,rec,f,f.name.replace(/\.pdf$/i,''),'',prog); n++; }catch(e){ toast('✗ '+f.name+' : '+(e.message||e),true); } }
        prog(''); if(n){ await save(); toast(n+' règlement'+(n>1?'s':'')+' ajouté'+(n>1?'s':'')+'.'); redraw(); } }; inp.click(); },
    ajoutLien:()=>sgFzLienDlg(rec,async s=>{ rec.SOURCES.push(s); await save(); redraw(); }),
    ouvrirUrl:b=>{ try{ window.open(b.dataset.url,'_blank'); }catch(_){} },
    ouvrirFichier:b=>{ const f=DS.get('depotfichier',b.dataset.fid); if(f) ch03aOuvrir(f); else toast('Fichier introuvable dans le dépôt du projet.',true); },
    voirTexte:async b=>{ const s=rec.SOURCES.find(x=>x.ID===b.dataset.sid); if(!s) return; const t=await sgFzTexteDe(rec,s); if(!t){ toast('Aucun texte pour cette source.',true); return; } sgVisionneuse(new Blob([t],{type:'text/plain;charset=utf-8'}),s.TITRE+'.txt'); },
    supprSource:b=>{ const s=rec.SOURCES.find(x=>x.ID===b.dataset.sid); if(!s) return; sgConfirm('Retirer la source « '+s.TITRE+' » ?\n\nLes contraintes déjà créées sont gardées ; le fichier déposé reste dans les documents du projet.',async()=>{ rec.SOURCES=rec.SOURCES.filter(x=>x!==s); if(s.TEXTE){ try{ await DS.del(SG_FZ_TX,rec.ID+':'+s.ID); }catch(_){} delete SG_FZ.tx[rec.ID+':'+s.ID]; } await save(); redraw(); }); },
    rech:chercherMot,
    hitCt:b=>{ const x=(st.hits||[])[+b.dataset.i]; if(!x) return; sgFzContrainteDlg(rec,{ID:sgFzId(),THEME:sgFzThemeDe(x.mot+' '+x.extrait),TITRE:(x.titre||SG_FZ_TH_L[sgFzThemeDe(x.mot)]||'').slice(0,80)+(x.art?' — '+x.art:''),REGLE:x.extrait.replace(/^… |\s…$/g,''),SOURCE:x.src.TITRE,ARTICLE:x.art,VALEUR:sgFzValeurs(x.extrait),REPONSE:'',STATUT:'a_traiter',NOTE:''},async c=>{ rec.CONTRAINTES.push(c); await save(); redraw(); }); },
    filtre:b=>{ st.filtre=b.dataset.st||''; redraw(); },
    prefill:async()=>{ prog('Pré-remplissage depuis les sources…'); const n=await sgFzPreRemplir(rec,p); await save(); prog(''); toast(n?n+' contrainte'+(n>1?'s':'')+' ajoutée'+(n>1?'s':'')+'.':'Rien de nouveau : les sources sont déjà reportées dans les contraintes.'); redraw(); },
    ajoutCt:()=>sgFzContrainteDlg(rec,null,async c=>{ rec.CONTRAINTES.push(c); await save(); redraw(); }),
    editCt:b=>{ const c=rec.CONTRAINTES.find(x=>x.ID===b.dataset.cid); if(c) sgFzContrainteDlg(rec,c,async()=>{ await save(); redraw(); }); },
    supprCt:b=>{ const c=rec.CONTRAINTES.find(x=>x.ID===b.dataset.cid); if(!c) return; sgConfirm('Supprimer la contrainte « '+c.TITRE+' » ?',async()=>{ rec.CONTRAINTES=rec.CONTRAINTES.filter(x=>x!==c); await save(); redraw(); }); },
    fiche:()=>sgFaisaFiche(p)}); sgFzVolBrancher(pg,rec,st,save,redraw,prog); }
/* ═══ Faisabilité ▸ application des règles à la parcelle : volumétrie maximale, plan, modèle 3D, coupe (21.10.2026, demande de Paulo) ═══
   Règles : lues dans les contraintes (texte des articles repris des règlements, extrait RDPPF…) par SG_FZ_RE, ou saisies à la main
   (rec.REGLES, prioritaires) — distance aux limites, entre bâtiments, hauteurs à la corniche / au faîte, niveaux, COS, IUS, IM, espaces verts.
   Parcelle : géométrie du plan cadastral (identify geo.admin.ch, rec.PARCELLE.GEOM, anneau extérieur en LV95). Aire d'implantation = points de
   la parcelle à au moins la distance aux limites (grille fine, contour tracé puis simplifié) ; emprise max = COS × surface (bornée par l'aire
   d'implantation) ; SPd max = IUS × surface ; volume enveloppe = aire d'implantation × hauteur à la corniche (+ moitié de la tranche jusqu'au
   faîte) ; espaces verts min = % × surface. Dessins SVG : plan (parcelle, bande non constructible hachurée, aire d'implantation, distances,
   contraintes en légende), modèle 3D axonométrique orientable (enveloppe maximale, faîte en pointillé), coupe longitudinale ou transversale
   sur le profil du terrain (profile.json de geo.admin.ch, swissALTI3D), hauteurs mesurées depuis le terrain. Résultat indicatif : à vérifier
   sur le règlement (mesure des hauteurs, dérogations, alignements, distances entre bâtiments, servitudes). */
const SG_FZ_PARAMS=[['DIST','Distance aux limites de propriété','m',1,40],['DIST_BAT','Distance entre bâtiments','m',2,60],['H_CORN','Hauteur à la corniche','m',2,60],
  ['H_FAITE','Hauteur au faîte','m',2,80],['NIV','Nombre de niveaux','',1,20],['COS','Coefficient d’occupation du sol (COS)','',0.03,1],['IUS','Indice d’utilisation du sol (IUS)','',0.03,6],
  ['IM','Indice de masse (IM)','m³/m²',0.3,20],['VERTS','Espaces verts minimum','%',3,95]];
const SG_FZ_RE={
  DIST:[/distances?[^.;]{0,120}?(?:limites?|propri[ée]t[ée]s?|fonds voisins?|bien-fonds voisins?)[^.;]{0,90}?(\d+(?:[.,]\d+)?)\s*m(?![²2a-zà-ü])/i,/limites? (?:de|des) propri[ée]t[ée]s?[^.;]{0,90}?(\d+(?:[.,]\d+)?)\s*m(?![²2a-zà-ü])/i],
  DIST_BAT:[/entre (?:deux |les )?(?:b[âa]timents|constructions)[^.;]{0,90}?(\d+(?:[.,]\d+)?)\s*m(?![²2a-zà-ü])/i],
  H_CORN:[/corniche[^.;]{0,70}?(\d+(?:[.,]\d+)?)\s*m(?![²2a-zà-ü])/i],
  H_FAITE:[/fa[îi]te[^.;]{0,70}?(\d+(?:[.,]\d+)?)\s*m(?![²2a-zà-ü])/i],
  H:[/hauteur[^.;]{0,90}?(\d+(?:[.,]\d+)?)\s*m(?![²2a-zà-ü])/i],
  NIV:[/rez(?:-de-chauss[ée]e)?\s*\+\s*(\d)\b/i,/(\d{1,2})\s*niveaux?\b/i],
  COS:[/\b(?:COS|IOS)\b[^.;\d]{0,40}?(\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?)\s*(%)?/,/(?:coefficient|indice|taux) d['’]occupation(?: du sol)?[^.;\d]{0,40}?(\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?)\s*(%)?/i,/surface b[âa]tie[^.;]{0,80}?(\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?)\s*(%)?/i],
  IUS:[/\b(?:IUS|IBUS|CUS|IU)\b[^.;\d]{0,40}?(\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?)/,/(?:indice|coefficient) d['’]utilisation(?: du sol)?[^.;\d]{0,40}?(\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?)/i],
  IM:[/\b(?:IM|IBM)\b[^.;\d]{0,30}?(\d+(?:[.,]\d+)?)/,/indice de masse[^.;\d]{0,30}?(\d+(?:[.,]\d+)?)/i],
  VERTS:[/(\d+(?:[.,]\d+)?)\s*%[^.;]{0,100}?(?:espaces? verts?|pleine terre|surfaces? (?:vertes?|plant[ée]es?|engazonn[ée]es?|perm[ée]ables?))/i,/(?:espaces? verts?|pleine terre)[^.;]{0,90}?(\d+(?:[.,]\d+)?)\s*%/i]};
/* erreurs de reconnaissance des PDF numérisés : « 6 rn », « 8 ni », « 800 ni2 » → m, m² (règlement de Grandvaux 1985, vérifié le 21.10.2026) */
const sgFzOcr=t=>String(t||'').replace(/(\d)\s*(?:rn|ni|rri|rrn)(?=\s*[2²]|\b)/g,'$1 m');
const sgFzNum=s=>{ s=String(s||'').replace(/\s+/g,''); const f=/^(\d+)\/(\d+)$/.exec(s); return f?(+f[2]?+f[1]/+f[2]:NaN):parseFloat(s.replace(',','.')); };
/* règles détectées dans les contraintes : {k:{v, src, cid}} (première valeur plausible, dans l'ordre des contraintes) */
function sgFzDetecter(rec){ const out={}, lim=Object.fromEntries(SG_FZ_PARAMS.map(x=>[x[0],x])); lim.H=['H','',' m',2,60];
  for(const c of rec.CONTRAINTES||[]){ const t=sgFzOcr([c.REGLE,c.VALEUR,c.TITRE].filter(Boolean).join(' . ').replace(/[  ]/g,' '));
    for(const [k,L] of Object.entries(SG_FZ_RE)){ if(out[k]) continue;
      for(const re of L){ const m=re.exec(t); if(!m) continue; let v=sgFzNum(m[1]); if(m[2]==='%'||(k==='COS'&&v>1&&v<=100)) v=v/100; if(k==='NIV'&&/rez/i.test(m[0])) v=v+1;
        const [, , , a, b]=lim[k]; if(!(v>=a&&v<=b)) continue; out[k]={v,src:[c.ARTICLE,c.SOURCE].filter(Boolean).join(' — ')||c.TITRE||'contrainte',cid:c.ID}; break; } } }
  if(!out.H_CORN&&out.H) out.H_CORN=out.H; delete out.H; return out; }
/* valeurs retenues : saisie (rec.REGLES) sinon détection */
function sgFzRegles(rec){ const det=sgFzDetecter(rec), man=rec.REGLES||{}, R={};
  SG_FZ_PARAMS.forEach(([k])=>{ const m=man[k]; if(m!=null&&m!==''&&isFinite(+m)) R[k]={v:+m,src:'saisie',man:1}; else if(det[k]) R[k]=det[k]; }); return {R,det}; }
/* anneau de la parcelle en coordonnées locales (mètres, origine au centre de la boîte) */
function sgFzAnneau(P){ let g=P.GEOM; if(!Array.isArray(g)||g.length<3) return null; g=g.map(p=>[+p[0],+p[1]]).filter(p=>isFinite(p[0])&&isFinite(p[1]));
  if(g.length>3&&g[0][0]===g[g.length-1][0]&&g[0][1]===g[g.length-1][1]) g=g.slice(0,-1); if(g.length<3) return null;
  const xs=g.map(p=>p[0]), ys=g.map(p=>p[1]), E0=(Math.min(...xs)+Math.max(...xs))/2, N0=(Math.min(...ys)+Math.max(...ys))/2;
  return {E0,N0,ring:g.map(([e,n])=>[e-E0,n-N0])}; }
const sgFzAireRing=R=>{ let a=0; for(let i=0,j=R.length-1;i<R.length;j=i++) a+=(R[j][0]+R[i][0])*(R[j][1]-R[i][1]); return Math.abs(a/2); };
/* aire d'implantation : grille (≈ 260 cases sur le grand côté), cases dont le centre est à ≥ d des limites, contour des cases puis simplification */
function sgFzInset(ring,d){ const xs=ring.map(p=>p[0]), ys=ring.map(p=>p[1]), x0=Math.min(...xs), x1=Math.max(...xs), y0=Math.min(...ys), y1=Math.max(...ys);
  const c=Math.max(0.12,Math.max(x1-x0,y1-y0)/260), nx=Math.ceil((x1-x0)/c)+1, ny=Math.ceil((y1-y0)/c)+1, M=new Uint8Array(nx*ny), n0=ring.length;
  const dans=(x,y)=>{ let ins=false; for(let i=0,j=n0-1;i<n0;j=i++){ const a=ring[i], b=ring[j]; if(((a[1]>y)!==(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])) ins=!ins; } return ins; };
  const dseg=(x,y,a,b)=>{ const dx=b[0]-a[0], dy=b[1]-a[1], L=dx*dx+dy*dy; let t=L?((x-a[0])*dx+(y-a[1])*dy)/L:0; t=t<0?0:t>1?1:t; const px=a[0]+t*dx-x, py=a[1]+t*dy-y; return Math.sqrt(px*px+py*py); };
  let n=0; for(let j=0;j<ny;j++) for(let i=0;i<nx;i++){ const x=x0+(i+0.5)*c, y=y0+(j+0.5)*c; if(!dans(x,y)) continue; let ok=true;
    if(d>0) for(let k=0,l=n0-1;k<n0;l=k++){ if(dseg(x,y,ring[l],ring[k])<d){ ok=false; break; } } if(ok){ M[j*nx+i]=1; n++; } }
  const on=(i,j)=>i>=0&&j>=0&&i<nx&&j<ny&&M[j*nx+i]===1, E=new Map(), add=(a,b)=>{ const k=a[0]+','+a[1]; (E.get(k)||E.set(k,[]).get(k)).push(b); };
  for(let j=0;j<ny;j++) for(let i=0;i<nx;i++){ if(!on(i,j)) continue;
    if(!on(i,j-1)) add([i,j],[i+1,j]); if(!on(i+1,j)) add([i+1,j],[i+1,j+1]); if(!on(i,j+1)) add([i+1,j+1],[i,j+1]); if(!on(i-1,j)) add([i,j+1],[i,j]); }
  const polys=[]; for(const [k0,L0] of E){ while(L0.length){ const loop=[k0.split(',').map(Number)]; let cur=L0.pop(), garde=0;
      while(cur&&garde++<200000){ const kk=cur[0]+','+cur[1]; if(kk===k0) break; loop.push(cur); const L=E.get(kk); cur=L&&L.length?L.pop():null; }
      if(loop.length>=4) polys.push(sgFzLisser(sgFzSimplifier(loop.map(([i,j])=>[x0+i*c,y0+j*c]),c*1.5))); } }
  return {polys:polys.filter(p=>p.length>=3),aire:n*c*c,cell:c}; }
/* points presque alignés retirés (angle < 7°) : murs sans rayures dans le modèle 3D */
function sgFzLisser(R){ let P=R.slice(), ch=true; while(ch&&P.length>4){ ch=false; for(let i=0;i<P.length;i++){ const a=P[(i+P.length-1)%P.length], b=P[i], c=P[(i+1)%P.length];
      const u=Math.atan2(b[1]-a[1],b[0]-a[0]), v=Math.atan2(c[1]-b[1],c[0]-b[0]); let d=Math.abs(u-v); if(d>Math.PI) d=2*Math.PI-d; if(d<7*Math.PI/180){ P.splice(i,1); ch=true; break; } } } return P; }
function sgFzSimplifier(R,tol){ if(R.length<5) return R; const dp=(pts)=>{ if(pts.length<3) return pts; const a=pts[0], b=pts[pts.length-1]; let im=0, dm=0;
    for(let i=1;i<pts.length-1;i++){ const p=pts[i], dx=b[0]-a[0], dy=b[1]-a[1], L=Math.hypot(dx,dy)||1e-9, dd=Math.abs(dy*p[0]-dx*p[1]+b[0]*a[1]-b[1]*a[0])/L; if(dd>dm){ dm=dd; im=i; } }
    return dm>tol?dp(pts.slice(0,im+1)).slice(0,-1).concat(dp(pts.slice(im))):[a,b]; };
  let far=0, fd=0; R.forEach((p,i)=>{ const dd=Math.hypot(p[0]-R[0][0],p[1]-R[0][1]); if(dd>fd){ fd=dd; far=i; } });
  return dp(R.slice(0,far+1)).slice(0,-1).concat(dp(R.slice(far).concat([R[0]])).slice(0,-1)); }
/* calcul complet (synchrone) : null sans géométrie */
function sgFzVolumetrie(rec){ const A=sgFzAnneau(rec.PARCELLE||{}); if(!A) return null; const {R}=sgFzRegles(rec), v=k=>R[k]?R[k].v:null;
  const Sg=sgFzAireRing(A.ring), Sf=+rec.PARCELLE.SURFACE||0, Sok=Sf>0&&Math.abs(Sf-Sg)/Sg<=0.1, S=Sok?Sf:Sg, d=v('DIST')||0, I=sgFzInset(A.ring,d);   /* surface de la fiche si elle correspond au plan (±10 %), sinon celle du plan */
  const hc=v('H_CORN'), hf=v('H_FAITE'), Hc=hc||(hf&&!hc?hf:null), cos=v('COS'), ius=v('IUS'), im=v('IM'), niv=v('NIV')||(Hc?Math.max(1,Math.floor(Hc/3)):null);
  const emp=cos?Math.min(cos*S,I.aire):I.aire, spd=ius?ius*S:(niv?emp*niv:null), vol=Hc?I.aire*Hc+(hf&&hf>Hc?I.aire*(hf-Hc)/2:0):null;
  return {A,R,S,Sg,Sdiff:Sf>0&&!Sok?Sf:null,d,I,Hc,Hf:hf&&Hc&&hf>Hc?hf:null,cos,ius,im,niv,emp,spd,vol,volIM:im?im*S:null,verts:v('VERTS')?v('VERTS')/100*S:null}; }
/* ── dessins SVG ── */
const sgFzM2=v=>num(Math.round(v),0)+' m²', sgFzM=v=>num(Math.round(v*100)/100,2)+' m';
function sgFzPlanSvg(V,rec){ const ring=V.A.ring, xs=ring.map(p=>p[0]), ys=ring.map(p=>p[1]), mg=Math.max(6,V.d+4), x0=Math.min(...xs)-mg, x1=Math.max(...xs)+mg, y0=Math.min(...ys)-mg, y1=Math.max(...ys)+mg;
  const W=600, k=W/(x1-x0), H=Math.max(260,(y1-y0)*k), X=x=>((x-x0)*k).toFixed(1), Y=y=>((y1-y)*k).toFixed(1), pts=R=>R.map(p=>X(p[0])+','+Y(p[1])).join(' ');
  const pathR=Rs=>Rs.map(R=>'M'+R.map(p=>X(p[0])+','+Y(p[1])).join('L')+'Z').join('');
  let s='<svg xmlns="http://www.w3.org/2000/svg" class="sg-fzv-svg" viewBox="0 0 '+(W+300)+' '+Math.round(H)+'" font-family="Akkurat, Helvetica, Arial, sans-serif">'
    +'<defs><pattern id="sgfzh" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="#BD1E42" stroke-width="1.2" opacity=".55"/></pattern></defs>'
    +'<rect x="0" y="0" width="'+W+'" height="'+Math.round(H)+'" fill="#fff"/>'
    +'<polygon points="'+pts(ring)+'" fill="url(#sgfzh)" stroke="none"/>'
    +(V.I.polys.length?'<path d="'+pathR(V.I.polys)+'" fill="#FFF266" fill-opacity=".85" fill-rule="evenodd" stroke="#003346" stroke-width="1.4" stroke-dasharray="6 3"/>':'')
    +'<polygon points="'+pts(ring)+'" fill="none" stroke="#1d1d1b" stroke-width="2.2"/>';
  /* longueurs des côtés et distances aux limites (sur les 4 plus longs côtés) */
  const cotes=ring.map((a,i)=>{ const b=ring[(i+1)%ring.length]; return {a,b,L:Math.hypot(b[0]-a[0],b[1]-a[1])}; });
  const sens=sgFzAireSigne(ring)>0?1:-1;
  cotes.forEach(c=>{ if(c.L*k<34) return; const mx=(c.a[0]+c.b[0])/2, my=(c.a[1]+c.b[1])/2, ang=Math.atan2(c.b[1]-c.a[1],c.b[0]-c.a[0]), nx=-Math.sin(ang)*sens, ny=Math.cos(ang)*sens;
    const tx=mx-nx*2.2, ty=my-ny*2.2; let deg=-ang*180/Math.PI; if(deg>90) deg-=180; if(deg<-90) deg+=180;
    s+='<text x="'+X(tx)+'" y="'+Y(ty)+'" font-size="10" fill="#706f6f" text-anchor="middle" dominant-baseline="middle" transform="rotate('+deg.toFixed(1)+' '+X(tx)+' '+Y(ty)+')">'+num(Math.round(c.L*10)/10,1)+' m</text>'; });
  if(V.d>0) cotes.slice().sort((p,q)=>q.L-p.L).slice(0,4).forEach(c=>{ const mx=(c.a[0]+c.b[0])/2, my=(c.a[1]+c.b[1])/2, ang=Math.atan2(c.b[1]-c.a[1],c.b[0]-c.a[0]), nx=-Math.sin(ang)*sens, ny=Math.cos(ang)*sens, ex=mx+nx*V.d, ey=my+ny*V.d;
    s+='<line x1="'+X(mx)+'" y1="'+Y(my)+'" x2="'+X(ex)+'" y2="'+Y(ey)+'" stroke="#BD1E42" stroke-width="1.3" marker-end="url(#sgfza)" marker-start="url(#sgfza)"/>'
      +'<text x="'+X(ex+nx*1.2)+'" y="'+Y(ey+ny*1.2)+'" font-size="10.5" font-weight="700" fill="#BD1E42" text-anchor="middle" dominant-baseline="middle">'+num(V.d,V.d%1?2:0)+' m</text>'; });
  s=s.replace('</defs>','<marker id="sgfza" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,1 L7,4 L0,7 z" fill="#BD1E42"/></marker></defs>');
  /* étiquette de l'aire d'implantation (au plus grand contour) */
  const P0=V.I.polys.slice().sort((p,q)=>sgFzAireRing(q)-sgFzAireRing(p))[0];
  if(P0){ const cx=P0.reduce((a,p)=>a+p[0],0)/P0.length, cy=P0.reduce((a,p)=>a+p[1],0)/P0.length;
    s+='<text x="'+X(cx)+'" y="'+Y(cy)+'" font-size="11.5" font-weight="700" fill="#003346" text-anchor="middle">Aire d’implantation</text><text x="'+X(cx)+'" y="'+(+Y(cy)+15)+'" font-size="11.5" fill="#003346" text-anchor="middle">'+sgFzM2(V.I.aire)+'</text>'; }
  /* nord et échelle */
  s+='<g transform="translate('+(W-28)+',30)"><path d="M0,-18 L7,6 L0,1 L-7,6 Z" fill="#1d1d1b"/><text x="0" y="20" font-size="11" font-weight="700" text-anchor="middle">N</text></g>';
  const pas=[2,5,10,20,50,100].find(p=>p*k>=60)||100; s+='<g transform="translate(14,'+(Math.round(H)-16)+')"><rect x="0" y="-5" width="'+(pas*k).toFixed(1)+'" height="5" fill="#1d1d1b"/><rect x="'+(pas*k/2).toFixed(1)+'" y="-5" width="'+(pas*k/2).toFixed(1)+'" height="5" fill="#fff" stroke="#1d1d1b" stroke-width=".8"/><text x="0" y="10" font-size="9.5">0</text><text x="'+(pas*k).toFixed(1)+'" y="10" font-size="9.5" text-anchor="middle">'+pas+' m</text></g>';
  /* légende et contraintes */
  const P=rec.PARCELLE, L=[]; const li=(t,v,cl)=>L.push([t,v,cl]);
  li('Parcelle',(P.NUMERO?'n° '+P.NUMERO:'')+(P.COMMUNE?' · '+P.COMMUNE:'')); li('Surface de la parcelle',sgFzM2(V.S)); if(P.ZONE||P.ZONE_FED) li('Zone',P.ZONE||P.ZONE_FED);
  if(V.d) li('Distance aux limites',sgFzM(V.d),'r'); li('Aire d’implantation',sgFzM2(V.I.aire),'j');
  if(V.cos) li('Emprise max (COS '+num(V.cos,2)+')',sgFzM2(V.emp)); if(V.ius) li('SPd max (IUS '+num(V.ius,2)+')',sgFzM2(V.spd));
  if(V.Hc) li('Hauteur à la corniche',sgFzM(V.Hc)); if(V.Hf) li('Hauteur au faîte',sgFzM(V.Hf)); if(V.niv) li('Niveaux',String(V.niv)); if(V.verts) li('Espaces verts min',sgFzM2(V.verts));
  const autres=(rec.CONTRAINTES||[]).filter(c=>/bruit|dangers|patrimoine|foret|eaux|pollues/.test(c.THEME||'')).map(c=>(SG_FZ_TH_L[c.THEME]||'')+' : '+(c.VALEUR||c.TITRE||'')).filter((x,i,a)=>a.indexOf(x)===i).slice(0,6);
  let y=26; s+='<g font-size="11"><text x="'+(W+18)+'" y="'+y+'" font-size="13" font-weight="700">Plan des contraintes</text>';
  s+='<rect x="'+(W+18)+'" y="'+(y+=12)+'" width="16" height="11" fill="url(#sgfzh)" stroke="#1d1d1b" stroke-width=".6"/><text x="'+(W+40)+'" y="'+(y+9)+'">Bande non constructible</text>';
  s+='<rect x="'+(W+18)+'" y="'+(y+=18)+'" width="16" height="11" fill="#FFF266" stroke="#003346" stroke-dasharray="3 2"/><text x="'+(W+40)+'" y="'+(y+9)+'">Aire d’implantation</text>'; y+=16;
  L.forEach(([t,v])=>{ y+=17; s+='<text x="'+(W+18)+'" y="'+y+'" fill="#706f6f">'+nxE(t)+'</text><text x="'+(W+290)+'" y="'+y+'" text-anchor="end" font-weight="700">'+nxE(String(v||'—').slice(0,30))+'</text>'; });
  if(autres.length){ y+=24; s+='<text x="'+(W+18)+'" y="'+y+'" font-weight="700">Autres contraintes</text>'; autres.forEach(t=>{ y+=15; s+='<text x="'+(W+18)+'" y="'+y+'" font-size="10" fill="#1d1d1b">'+nxE(t.slice(0,48))+'</text>'; }); }
  return s+'</g></svg>'; }
const sgFzAireSigne=R=>{ let a=0; for(let i=0,j=R.length-1;i<R.length;j=i++) a+=(R[j][0]*R[i][1]-R[i][0]*R[j][1]); return a/2; };
/* modèle 3D axonométrique : az = orientation (degrés, 0 = vu du sud), el = élévation (degrés) */
function sgFzModeleSvg(V,az,el){ const a=az*Math.PI/180, e=el*Math.PI/180, ca=Math.cos(a), sa=Math.sin(a), se=Math.sin(e), ce=Math.cos(e);
  const pr=(x,y,z)=>{ const xr=x*ca-y*sa, yr=x*sa+y*ca; return [xr,-yr*se-z*ce,yr]; };
  const Hc=V.Hc||0, faces=[], ring=V.A.ring;
  faces.push({pts:ring.map(p=>pr(p[0],p[1],0)),fill:'#eef0ee',stroke:'#1d1d1b',sw:1.6,z:-1e9});
  V.I.polys.forEach(R=>faces.push({pts:R.map(p=>pr(p[0],p[1],0)),fill:'#FFF266',op:.55,stroke:'#003346',sw:1,dash:'4 2',z:-1e9+1}));
  if(Hc>0){ const lum=[0.4,-0.6,0.7]; V.I.polys.forEach(R=>{ const sg=sgFzAireSigne(R)>0?1:-1;
      R.forEach((p,i)=>{ const q=R[(i+1)%R.length], nx=(q[1]-p[1])*sg, ny=-(q[0]-p[0])*sg, L=Math.hypot(nx,ny)||1, sh=Math.max(0,(nx*lum[0]+ny*lum[1])/L), g=Math.round(200+45*sh);
        const P4=[pr(p[0],p[1],0),pr(q[0],q[1],0),pr(q[0],q[1],Hc),pr(p[0],p[1],Hc)]; faces.push({pts:P4,fill:'rgb('+g+','+g+','+(g+4)+')',stroke:'#003346',sw:.8,z:-(P4.reduce((s0,x)=>s0+x[2],0)/4)}); }); });
    V.I.polys.forEach(R=>faces.push({pts:R.map(p=>pr(p[0],p[1],Hc)),fill:'#d9dde0',stroke:'#003346',sw:1.2,z:1e9}));
    if(V.Hf) V.I.polys.forEach(R=>faces.push({pts:R.map(p=>pr(p[0],p[1],V.Hf)),fill:'none',stroke:'#BD1E42',sw:1,dash:'5 3',z:1e9+1})); }
  faces.sort((p,q)=>p.z-q.z);
  const all=faces.flatMap(f=>f.pts), xs=all.map(p=>p[0]), ys=all.map(p=>p[1]), mg=8, x0=Math.min(...xs)-mg, y0=Math.min(...ys)-mg, w=Math.max(...xs)-x0+mg, hh=Math.max(...ys)-y0+mg, k=640/w;
  const P=p=>((p[0]-x0)*k).toFixed(1)+','+((p[1]-y0)*k).toFixed(1);
  let s='<svg xmlns="http://www.w3.org/2000/svg" class="sg-fzv-svg" viewBox="0 0 640 '+Math.round(hh*k+30)+'" font-family="Akkurat, Helvetica, Arial, sans-serif"><rect width="640" height="'+Math.round(hh*k+30)+'" fill="#fff"/>';
  faces.forEach(f=>{ s+='<polygon points="'+f.pts.map(P).join(' ')+'" fill="'+f.fill+'"'+(f.op?' fill-opacity="'+f.op+'"':'')+' stroke="'+f.stroke+'" stroke-width="'+f.sw+'"'+(f.dash?' stroke-dasharray="'+f.dash+'"':'')+' stroke-linejoin="round"/>'; });
  if(Hc>0&&V.I.polys.length){ const R=V.I.polys[0], p=R.reduce((m,x)=>{ const a1=pr(x[0],x[1],0), a2=pr(m[0],m[1],0); return a1[0]<a2[0]?x:m; },R[0]), b=pr(p[0],p[1],0), t=pr(p[0],p[1],Hc);
    s+='<line x1="'+((b[0]-x0)*k-10).toFixed(1)+'" y1="'+((b[1]-y0)*k).toFixed(1)+'" x2="'+((t[0]-x0)*k-10).toFixed(1)+'" y2="'+((t[1]-y0)*k).toFixed(1)+'" stroke="#1d1d1b" stroke-width="1"/><text x="'+((t[0]-x0)*k-14).toFixed(1)+'" y="'+(((b[1]+t[1])/2-y0)*k).toFixed(1)+'" font-size="11" font-weight="700" text-anchor="end">'+sgFzM(Hc)+'</text>'; }
  s+='<text x="10" y="'+Math.round(hh*k+20)+'" font-size="8.5" fill="#706f6f">Enveloppe maximale : aire d’implantation × '+(Hc?sgFzM(Hc)+' (corniche)':'hauteur non définie')+(V.Hf?' · faîte '+sgFzM(V.Hf)+' en pointillé rouge':'')+' · terrain supposé plat dans cette vue</text>';
  return s+'</svg>'; }
/* coupe : axe principal de la parcelle (« long ») ou perpendiculaire (« trans ») passant par son centre ; prof = [{t, alt}] ou null (terrain plat) */
function sgFzAxeCoupe(V,axe){ const R=V.A.ring, cx=R.reduce((a,p)=>a+p[0],0)/R.length, cy=R.reduce((a,p)=>a+p[1],0)/R.length; let sxx=0,syy=0,sxy=0;
  R.forEach(p=>{ const dx=p[0]-cx, dy=p[1]-cy; sxx+=dx*dx; syy+=dy*dy; sxy+=dx*dy; }); let th=0.5*Math.atan2(2*sxy,sxx-syy); if(axe==='trans') th+=Math.PI/2;
  const u=[Math.cos(th),Math.sin(th)], inter=Rs=>{ const T=[]; Rs.forEach(Q=>Q.forEach((a,i)=>{ const b=Q[(i+1)%Q.length], ex=b[0]-a[0], ey=b[1]-a[1], den=u[0]*ey-u[1]*ex; if(Math.abs(den)<1e-12) return;
      const t=((a[0]-cx)*ey-(a[1]-cy)*ex)/den, s0=((a[0]-cx)*u[1]-(a[1]-cy)*u[0])/den; if(s0>=0&&s0<=1) T.push(t); })); return T.sort((p,q)=>p-q); };
  const tp=inter([R]), ti=inter(V.I.polys), seg=[]; for(let i=0;i+1<ti.length;i+=2) if(ti[i+1]-ti[i]>0.05) seg.push([ti[i],ti[i+1]]);
  return {cx,cy,u,t0:tp[0],t1:tp[tp.length-1],seg}; }
async function sgFzProfil(V,ax){ const m=6, a=[V.A.E0+ax.cx+ax.u[0]*(ax.t0-m),V.A.N0+ax.cy+ax.u[1]*(ax.t0-m)], b=[V.A.E0+ax.cx+ax.u[0]*(ax.t1+m),V.A.N0+ax.cy+ax.u[1]*(ax.t1+m)];
  const geom=JSON.stringify({type:'LineString',coordinates:[a.map(x=>Math.round(x*10)/10),b.map(x=>Math.round(x*10)/10)]});
  const d=await sgFzJson('https://api3.geo.admin.ch/rest/services/profile.json?geom='+encodeURIComponent(geom)+'&sr=2056&nb_points=80&distinct_points=true');
  return (Array.isArray(d)?d:[]).map(x=>({t:ax.t0-m+(+x.dist||0),alt:+((x.alts||{}).COMB||(x.alts||{}).DTM2||(x.alts||{}).DTM25)})).filter(x=>isFinite(x.alt)); }
function sgFzCoupeSvg(V,ax,prof,axe){ if(!(ax.t1>ax.t0)) return '<div class="nx-empty">Coupe impossible : l’axe ne traverse pas la parcelle.</div>';
  const plat=!prof||prof.length<2, alt=t=>{ if(plat) return 0; if(t<=prof[0].t) return prof[0].alt; for(let i=1;i<prof.length;i++) if(t<=prof[i].t){ const p=prof[i-1], q=prof[i]; return p.alt+(q.alt-p.alt)*(t-p.t)/((q.t-p.t)||1); } return prof[prof.length-1].alt; };
  const m=6, ta=ax.t0-m, tb=ax.t1+m, Hmax=Math.max(V.Hf||0,V.Hc||0,3), as=[];
  for(let t=ta;t<=tb+1e-6;t+=(tb-ta)/120) as.push(alt(t)); const zmin=Math.min(...as)-2, zmax=Math.max(...as)+Hmax+3, W=860, k=W/(tb-ta), H=Math.max(200,(zmax-zmin)*k+40);
  const X=t=>((t-ta)*k).toFixed(1), Y=z=>(H-28-(z-zmin)*k).toFixed(1);
  let s='<svg xmlns="http://www.w3.org/2000/svg" class="sg-fzv-svg" viewBox="0 0 '+W+' '+Math.round(H)+'" font-family="Akkurat, Helvetica, Arial, sans-serif"><rect width="'+W+'" height="'+Math.round(H)+'" fill="#fff"/>'
    +'<defs><marker id="sgfzc" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,1 L7,4 L0,7 z" fill="#BD1E42"/></marker></defs>';
  /* enveloppes (hauteur mesurée depuis le terrain) */
  ax.seg.forEach(([a,b])=>{ const n=Math.max(2,Math.round((b-a)/((tb-ta)/120))), top=[], bas=[]; for(let i=0;i<=n;i++){ const t=a+(b-a)*i/n; bas.push(X(t)+','+Y(alt(t))); top.push(X(t)+','+Y(alt(t)+(V.Hc||0))); }
    if(V.Hc) s+='<polygon points="'+bas.concat(top.reverse()).join(' ')+'" fill="#FFF266" fill-opacity=".8" stroke="#003346" stroke-width="1.4"/>';
    if(V.Hf){ const f=[]; for(let i=0;i<=n;i++){ const t=a+(b-a)*i/n; f.push(X(t)+','+Y(alt(t)+V.Hf)); } s+='<polyline points="'+f.join(' ')+'" fill="none" stroke="#BD1E42" stroke-width="1.2" stroke-dasharray="6 3"/>'; }
    if(V.Hc){ const tm=a+0.6; s+='<line x1="'+X(tm)+'" y1="'+Y(alt(tm))+'" x2="'+X(tm)+'" y2="'+Y(alt(tm)+V.Hc)+'" stroke="#003346" stroke-width="1" marker-start="url(#sgfzc)" marker-end="url(#sgfzc)"/><text x="'+(+X(tm)+5)+'" y="'+((+Y(alt(tm))+ +Y(alt(tm)+V.Hc))/2)+'" font-size="11" font-weight="700" fill="#003346">'+sgFzM(V.Hc)+'</text>'; } });
  /* terrain */
  const terr=[]; for(let i=0;i<=120;i++){ const t=ta+(tb-ta)*i/120; terr.push(X(t)+','+Y(alt(t))); }
  s+='<polyline points="'+terr.join(' ')+'" fill="none" stroke="#1d1d1b" stroke-width="2"/>';
  /* limites et distances */
  [ax.t0,ax.t1].forEach((t,i)=>{ s+='<line x1="'+X(t)+'" y1="'+Y(alt(t)-1.5)+'" x2="'+X(t)+'" y2="'+Y(alt(t)+Hmax+1.5)+'" stroke="#1d1d1b" stroke-width="1.2" stroke-dasharray="8 3 2 3"/><text x="'+X(t)+'" y="'+(+Y(alt(t)+Hmax+1.5)-5)+'" font-size="10.5" text-anchor="middle">Limite</text>'
    +(plat?'':'<text x="'+X(t)+'" y="'+(+Y(alt(t))+16)+'" font-size="9.5" fill="#706f6f" text-anchor="middle">'+num(alt(t),1)+'</text>'); });
  const dl=v=>v<V.d&&V.d-v<2.5*V.I.cell?V.d:v;   /* écart de grille (≈ 2 cases) : valeur réglementaire */
  if(ax.seg.length&&V.d>0){ const s0=ax.seg[0][0], s1=ax.seg[ax.seg.length-1][1], z0=alt(ax.t0)+0.8, z1=alt(ax.t1)+0.8;
    s+='<line x1="'+X(ax.t0)+'" y1="'+Y(z0)+'" x2="'+X(s0)+'" y2="'+Y(z0)+'" stroke="#BD1E42" stroke-width="1.2" marker-start="url(#sgfzc)" marker-end="url(#sgfzc)"/><text x="'+((+X(ax.t0)+ +X(s0))/2)+'" y="'+(+Y(z0)-5)+'" font-size="10.5" font-weight="700" fill="#BD1E42" text-anchor="middle">'+sgFzM(dl(s0-ax.t0))+'</text>'
      +'<line x1="'+X(s1)+'" y1="'+Y(z1)+'" x2="'+X(ax.t1)+'" y2="'+Y(z1)+'" stroke="#BD1E42" stroke-width="1.2" marker-start="url(#sgfzc)" marker-end="url(#sgfzc)"/><text x="'+((+X(s1)+ +X(ax.t1))/2)+'" y="'+(+Y(z1)-5)+'" font-size="10.5" font-weight="700" fill="#BD1E42" text-anchor="middle">'+sgFzM(dl(ax.t1-s1))+'</text>'; }
  s+='<text x="10" y="'+(Math.round(H)-8)+'" font-size="10.5" fill="#706f6f">Coupe '+(axe==='trans'?'transversale':'longitudinale')+' par le centre de la parcelle'+(plat?' · terrain supposé plat (profil indisponible)':' · terrain : swissALTI3D (geo.admin.ch), altitudes en m s. m.')+(V.Hc?' · hauteurs mesurées depuis le terrain naturel':'')+(V.Hf?' · faîte en pointillé rouge':'')+'</text>';
  return s+'</svg>'; }
/* carte de la page « Parcelle & règlements » */
function sgFzVolCarte(rec,st,ecrit){ const {R,det}=sgFzRegles(rec), V=sgFzVolumetrie(rec), E=nxE, man=rec.REGLES||{};
  const ligne=([k,lib,u])=>{ const r=R[k], d=det[k];
    return '<tr><td>'+E(lib)+'</td><td class="sg-fzv-in">'+(ecrit?'<input class="inp" data-regle="'+k+'" value="'+E(man[k]!=null?man[k]:'')+'" placeholder="'+E(d?num(d.v,d.v%1?2:0):'—')+'">':'<b>'+E(r?num(r.v,r.v%1?2:0):'—')+'</b>')+'<span>'+E(u)+'</span></td>'
      +'<td class="sg-fzv-src">'+(r?(r.man?'saisie'+(d?' (détecté : '+num(d.v,d.v%1?2:0)+', '+E(d.src)+')':''):'détecté · '+E(r.src)):'<span class="sg-fz-hint" style="margin:0">non trouvé — saisissez la valeur</span>')+'</td></tr>'; };
  const kp=(l,v,cl)=>'<div class="sg-phk"><div class="l">'+E(l)+'</div><div class="v'+(cl?' '+cl:'')+'">'+v+'</div></div>';
  let h='<div class="sg-fzv"><table class="nx-tbl sg-fzv-par"><tr><th>Règle</th><th>Valeur retenue</th><th>Origine</th></tr>'+SG_FZ_PARAMS.map(ligne).join('')+'</table>';
  if(V&&V.Sdiff) h+='<p class="sg-fzv-alerte">La surface de la fiche ('+num(Math.round(V.Sdiff),0)+' m²) ne correspond pas à la parcelle du plan cadastral ('+num(Math.round(V.Sg),0)+' m²) : le calcul prend celle du plan. Vérifiez la parcelle ou corrigez la surface.</p>';
  if(V) h+='<div class="sg-phks">'+kp('Surface de la parcelle',num(Math.round(V.S),0)+'<small>m²</small>')+kp('Aire d’implantation',num(Math.round(V.I.aire),0)+'<small>m²</small>')
      +kp('Emprise max',num(Math.round(V.emp),0)+'<small>m²</small>')+kp('SPd max',V.spd?num(Math.round(V.spd),0)+'<small>m²</small>':'—')
      +kp('Volume enveloppe',V.vol?num(Math.round(V.vol),0)+'<small>m³</small>':'—')+kp('Espaces verts min',V.verts?num(Math.round(V.verts),0)+'<small>m²</small>':'—')+'</div>'
      +'<div class="sg-fzv-bar"><span class="seg">'+[['plan','Plan'],['3d','Modèle 3D'],['coupe','Coupe']].map(([k,l])=>'<button data-fn="fzvVue" data-v="'+k+'" class="'+((st.fzv||'plan')===k?'on':'')+'">'+l+'</button>').join('')+'</span>'
      +((st.fzv||'plan')==='3d'?'<label class="sg-fzv-sl">Orientation<input type="range" min="0" max="355" step="5" id="sg-fzv-az" value="'+(st.fzAz==null?30:st.fzAz)+'"></label><label class="sg-fzv-sl">Élévation<input type="range" min="10" max="80" step="5" id="sg-fzv-el" value="'+(st.fzEl==null?35:st.fzEl)+'"></label>':'')
      +((st.fzv||'plan')==='coupe'?'<span class="seg">'+[['long','Longitudinale'],['trans','Transversale']].map(([k,l])=>'<button data-fn="fzvAxe" data-v="'+k+'" class="'+((st.fzAxe||'long')===k?'on':'')+'">'+l+'</button>').join('')+'</span>':'')
      +'</div><div class="sg-fzv-dessin" id="sg-fzv-dessin"></div>';
  else h+='<div class="nx-empty">'+(rec.PARCELLE.E&&rec.PARCELLE.N?'Forme de la parcelle pas encore lue : cliquez « Appliquer à la parcelle ».':'Indiquez d’abord la parcelle (Rechercher la parcelle).')+'</div>';
  h+='<p class="sg-fz-hint">Valeurs lues dans les contraintes (articles des règlements, extrait RDPPF) ; une valeur saisie remplace la valeur détectée. Résultat indicatif, à vérifier sur le règlement : mesure des hauteurs, dérogations, alignements, distances entre bâtiments, servitudes.</p></div>';
  return nxCard('c12','Application des règles à la parcelle',h,ecrit&&rec.PARCELLE.E&&rec.PARCELLE.N?'<span class="a" data-fn="fzvAppliquer">Appliquer à la parcelle</span>':''); }
/* branchement (dans sgFzDessiner) : dessin courant, saisies, application */
function sgFzVolBrancher(pg,rec,st,save,redraw,prog){ const box=pg.querySelector('#sg-fzv-dessin'), V=sgFzVolumetrie(rec);
  const dessiner=async()=>{ if(!box||!V) return; const vue=st.fzv||'plan';
    if(vue==='plan') box.innerHTML=sgFzPlanSvg(V,rec);
    else if(vue==='3d') box.innerHTML=sgFzModeleSvg(V,st.fzAz==null?30:st.fzAz,st.fzEl==null?35:st.fzEl);
    else { const axe=st.fzAxe||'long', ax=sgFzAxeCoupe(V,axe), cle=rec.PARCELLE.EGRID+'|'+axe+'|'+(rec.PARCELLE.GEOM||[]).length; box.innerHTML=sgFzCoupeSvg(V,ax,(st.fzProf||{})[cle]||null,axe);
      if(!(st.fzProf||{})[cle]){ try{ const pr=await sgFzProfil(V,ax); st.fzProf=Object.assign(st.fzProf||{},{[cle]:pr}); if(box.isConnected&&(st.fzv||'plan')==='coupe') box.innerHTML=sgFzCoupeSvg(V,ax,pr,axe); }catch(e){ st.fzProf=Object.assign(st.fzProf||{},{[cle]:[]}); } } } };
  dessiner();
  const az=pg.querySelector('#sg-fzv-az'), el=pg.querySelector('#sg-fzv-el'); if(az) az.oninput=()=>{ st.fzAz=+az.value; dessiner(); }; if(el) el.oninput=()=>{ st.fzEl=+el.value; dessiner(); };
  pg.querySelectorAll('input[data-regle]').forEach(i=>i.onchange=async()=>{ const k=i.dataset.regle, t=i.value.trim().replace(',','.'); rec.REGLES=rec.REGLES||{};
    if(t===''){ delete rec.REGLES[k]; } else { const v=sgFzNum(t); if(!isFinite(v)){ toast('Nombre attendu (ex. 0.5, 1/3, 6).',true); return; } rec.REGLES[k]=v; } await save(); redraw(); });
  Object.assign(pg._fn,{ fzvVue:b=>{ st.fzv=b.dataset.v; redraw(); }, fzvAxe:b=>{ st.fzAxe=b.dataset.v; redraw(); },
    fzvAppliquer:async()=>{ const P=rec.PARCELLE; if(!(P.E&&P.N)){ toast('Indiquez d’abord la parcelle.',true); return; }
      prog('Forme de la parcelle (plan cadastral, geo.admin.ch)…');
      try{ const g=await sgFzParcelleGeom(+P.E,+P.N); const pl=g?(g.type==='MultiPolygon'?g.coordinates:g.type==='Polygon'?[g.coordinates]:[]):[];
        const ext=pl.map(x=>x[0]).sort((p,q)=>sgFzAireRing(q)-sgFzAireRing(p))[0]; if(!ext) throw new Error('géométrie de la parcelle introuvable à ces coordonnées');
        P.GEOM=ext.map(p=>[Math.round(p[0]*100)/100,Math.round(p[1]*100)/100]); if(!(+P.SURFACE>0)) P.SURFACE=Math.round(sgFzAireRing(ext)); }
      catch(e){ prog(''); toast('✗ Parcelle : '+(e.message||e),true); return; }
      const W=sgFzVolumetrie(rec); prog(''); if(!W){ toast('Calcul impossible.',true); return; } const {R}=sgFzRegles(rec); let n=0;
      const rep=(k,t)=>{ const r=R[k]; if(!r||!r.cid) return; const c=rec.CONTRAINTES.find(x=>x.ID===r.cid); if(!c||String(c.REPONSE||'').trim()) return; c.REPONSE=t; if((c.STATUT||'a_traiter')==='a_traiter') c.STATUT='a_verifier'; n++; };
      rep('DIST','Aire d’implantation possible : '+sgFzM2(W.I.aire)+' sur '+sgFzM2(W.S)+' (distance de '+sgFzM(W.d)+' aux limites).');
      if(W.cos) rep('COS','Emprise au sol max : '+sgFzM2(W.emp)+' (COS '+num(W.cos,2)+' × '+sgFzM2(W.S)+(W.cos*W.S>W.I.aire?', limitée par l’aire d’implantation':'')+').');
      if(W.ius) rep('IUS','SPd max : '+sgFzM2(W.spd)+' (IUS '+num(W.ius,2)+' × '+sgFzM2(W.S)+').');
      if(W.Hc) rep('H_CORN','Enveloppe : '+sgFzM(W.Hc)+' à la corniche'+(W.Hf?', '+sgFzM(W.Hf)+' au faîte':'')+' — volume enveloppe '+num(Math.round(W.vol),0)+' m³.');
      if(W.Hf) rep('H_FAITE','Faîte max à '+sgFzM(W.Hf)+' du terrain naturel.');
      if(W.verts) rep('VERTS','Espaces verts min : '+sgFzM2(W.verts)+'.');
      if(W.niv&&R.NIV) rep('NIV',W.niv+' niveaux'+(W.spd&&W.emp?' — SPd max / emprise max : '+num(W.spd/W.emp,1)+' niveaux pleins.':'.'));
      rec.VOLUMETRIE={DATE:today(),S:Math.round(W.S),AIRE:Math.round(W.I.aire),EMPRISE:Math.round(W.emp),SPD:W.spd?Math.round(W.spd):null,VOLUME:W.vol?Math.round(W.vol):null,VERTS:W.verts?Math.round(W.verts):null,REGLES:Object.fromEntries(Object.entries(R).map(([k,r])=>[k,r.v]))};
      await save(); toast('Règles appliquées à la parcelle'+(n?' : '+n+' réponse'+(n>1?'s':'')+' de contrainte remplie'+(n>1?'s':''):'')+'.'); redraw(); } }); }
VIEWS['nx-faisa']={
  render(m,arg){ const [pid,mode]=String(arg||'').split('|'), p=DS.get('project',pid); this.draw=null;
    if(!p){ nxPage(m,'<div class="nx-empty">Projet introuvable. <a href="#" data-go="nx-mesprojets">Mes projets</a></div>'); return; }
    if(!sgProjetPermis(p.ID)){ VIEW.nxTitle='Projet non attribué'; nxPage(m,SG_NON_ATTRIBUE); return; }
    VIEW.nxTitle='Parcelle & règlements · '+(p.NUMBER||p.TITLE||''); nxRecent('p',p.ID);
    const bar=h('div',{class:'sg-pdom-bar'},h('button',{class:'nx-btn',html:nxSvg('back')+'Projet',onclick:()=>go('nx-pdom',p.ID+'|Faisabilité')}),h('b',{},(p.NUMBER?p.NUMBER+' · ':'')+(p.TITLE||'')),h('span',{class:'sg-fz-sp'}),
      h('button',{class:'nx-btn',html:nxSvg('gauge')+'Tableau de bord',onclick:()=>go('nx-projet',p.ID)}),h('button',{class:'nx-btn pri',html:nxSvg('print')+'Fiche de faisabilité',onclick:()=>sgFaisaFiche(p)}));
    const cols=h('div',{class:'cols'}), C=h('div',{class:'col fill'}); cols.append(C); m.append(bar,cols);
    const st=this.st=(this.st&&this.st.pid===pid)?this.st:{pid,filtre:'',mot:''};
    this.draw=()=>{ if(!C.isConnected) return; C.innerHTML=''; sgFzDessiner(C,p,st); };
    DS.need([SG_FZ_T,'depotfichier']).catch(()=>{}).then(()=>{ if(C.isConnected) this.draw(); });
    if(mode==='fiche') setTimeout(()=>sgFaisaFiche(p),400); },
  refresh(ts){ if(!this.draw||!hit(ts,SG_FZ_T,'depotfichier')) return; if(Date.now()-SG_FZ.sauve<1500) return;   /* sa propre sauvegarde : l'écran est déjà redessiné */
    const a=document.activeElement; if(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.closest('.sg-fz')) return; this.draw(); } };
NX_VIEW['nx-faisa']={d:SG_D.projets,t:'Parcelle & règlements',fiche:1};
SG_VUE_DROIT['nx-faisa']=()=>true;
/* fiche de faisabilité : document HTML (visionneuse → Imprimer / PDF), structure du dossier type du bureau */
const SG_FZ_DOC_CSS='h3{font-size:9pt;margin:4mm 0 1.5mm;font-weight:700;break-after:avoid}table.fz-kv{width:auto;min-width:90mm}table.fz-kv th{width:38mm;color:#706f6f;font-weight:300;border-bottom:.25pt solid #9d9d9c}'
  +'.fz-cartes{display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin:3mm 0 4mm;break-inside:avoid}.fz-cartes figure{margin:0}.fz-cartes img{width:100%;display:block;border:.25pt solid #1d1d1b}.fz-cartes figcaption{font-size:7pt;color:#706f6f;margin-top:1mm}'
  +'.fz-vide{color:#706f6f;font-style:italic}ul.fz-cit li{margin-bottom:1.5mm}table.fz-ct td{font-size:8.5pt}td.st-conforme{color:#4e6b0b;font-weight:700}td.st-non_conforme{color:#bd1e42;font-weight:700}td.st-a_verifier{color:#3f4193}td.st-a_traiter{color:#9a5d05}'
  +'.fz-conc{white-space:pre-line}.fz-sign{margin-top:10mm;font-size:8pt;color:#706f6f}small{font-size:7.5pt;color:#706f6f}tr{break-inside:avoid}';
async function sgFaisaFiche(p){ await DS.need([SG_FZ_T,'depotfichier']).catch(()=>{}); const rec=sgFzRec(p), P=rec.PARCELLE, E=nxE, mo=projMO(p);
  const rub=titre=>{ try{ const d=ch03aDossier('document',p.ID,'Faisabilité',titre); return DS.all('depotfichier').filter(f=>String(f.DOSSIER).normalize('NFC')===d).sort((a,b)=>cmp(a.NOM,b.NOM)); }catch(_){ return []; } };
  const fichiers=L=>L.length?'<ul>'+L.map(f=>'<li>'+E(f.NOM)+(f.MODIFIED?' <small>('+E(dfr(String(f.MODIFIED).slice(0,10)))+')</small>':'')+'</li>').join('')+'</ul>':'<p class="fz-vide">Aucun document déposé.</p>';
  /* application des règles à la parcelle : tableau, plan des contraintes, modèle 3D, coupe sur le terrain (21.10.2026) */
  let vol=''; const V=sgFzVolumetrie(rec);
  if(V){ const {R}=sgFzRegles(rec), ax=sgFzAxeCoupe(V,'long'); let prof=null; try{ prof=await sgFzProfil(V,ax); }catch(_){}
    const svg=x=>'<div style="margin:6px 0 14px;page-break-inside:avoid">'+String(x).replace('class="sg-fzv-svg"','style="width:100%;height:auto;display:block"')+'</div>', m2=v=>v?E(num(Math.round(v),0))+' m²':'—';
    vol='<h3>Application des règles à la parcelle</h3><table><tr><th>Règle</th><th class="r">Valeur</th><th>Origine</th></tr>'+SG_FZ_PARAMS.filter(([k])=>R[k]).map(([k,l,u])=>'<tr><td>'+E(l)+'</td><td class="r">'+E(num(R[k].v,R[k].v%1?2:0)+(u?' '+u:''))+'</td><td>'+E(R[k].man?'saisie':R[k].src)+'</td></tr>').join('')+'</table>'
      +'<table><tr><th>Surface de la parcelle</th><th>Aire d’implantation</th><th>Emprise max</th><th>SPd max</th><th>Volume enveloppe</th><th>Espaces verts min</th></tr><tr><td>'+m2(V.S)+'</td><td>'+m2(V.I.aire)+'</td><td>'+m2(V.emp)+'</td><td>'+m2(V.spd)+'</td><td>'+(V.vol?E(num(Math.round(V.vol),0))+' m³':'—')+'</td><td>'+m2(V.verts)+'</td></tr></table>'
      +'<h3>Plan des contraintes</h3>'+svg(sgFzPlanSvg(V,rec))+'<h3>Modèle 3D de la volumétrie maximale</h3>'+svg(sgFzModeleSvg(V,30,35))+'<h3>Coupe longitudinale</h3>'+svg(sgFzCoupeSvg(V,ax,prof,'long'))
      +'<p class="fz-vide">Résultat indicatif, à vérifier sur le règlement : mesure des hauteurs, dérogations, alignements, distances entre bâtiments, servitudes.</p>'; }
  const g=rec.SOURCES.find(s=>s.TYPE==='geoadmin'), r=rec.SOURCES.find(s=>s.TYPE==='rdppf'), bats=(g&&g.DONNEES&&g.DONNEES.bats)||[], restr=(r&&r.DONNEES&&r.DONNEES.restrictions)||[], nonC=(r&&r.DONNEES&&r.DONNEES.nonConcernes)||[];
  const C=rec.CONTRAINTES, parTheme=SG_FZ_THEMES.map(([k,l])=>[k,l,C.filter(c=>(c.THEME||'autres')===k)]).filter(x=>x[2].length);
  const regl=rec.SOURCES.filter(s=>s.TYPE==='reglement'), cit=regl.map(s=>[s,C.filter(c=>c.SOURCE===s.TITRE&&c.REGLE)]).filter(x=>x[1].length);
  const kv=[['Commune',P.COMMUNE],['N° de parcelle',P.NUMERO],['EGRID',P.EGRID],['Adresse',P.ADRESSE],['Surface',P.SURFACE?num(P.SURFACE,0)+' m²':''],['Coordonnées (LV95)',P.E&&P.N?'E '+num(P.E,0)+' · N '+num(P.N,0):''],['Zone d’affectation',P.ZONE||P.ZONE_FED],['Cadastre RDPPF',P.RDPPF_ETAT]].filter(x=>x[1]);
  const pol=C.filter(c=>c.THEME==='pollues'), nonPol=nonC.some(t=>/sites pollu/i.test(t));
  const corps='<style>'+SG_FZ_DOC_CSS+'</style><h1>ÉTUDE DE FAISABILITÉ</h1><div class="date">'+E(dfr(today()))+'</div><div class="sous">'+E((p.NUMBER?p.NUMBER+' · ':'')+(p.TITLE||''))+(mo?'<br>Maître de l’ouvrage : '+E(mo):'')+(P.ADRESSE?'<br>'+E(P.ADRESSE):'')+'</div>'
    +'<h2>1. Fiche de la parcelle</h2>'+(kv.length?'<table class="fz-kv">'+kv.map(([k,v])=>'<tr><th>'+E(k)+'</th><td>'+E(v)+'</td></tr>').join('')+'</table>':'<p class="fz-vide">Parcelle non renseignée.</p>')
    +(P.E&&P.N?'<div class="fz-cartes"><figure><img src="'+sgFzWms(+P.E,+P.N,110,SG_FZ_PLAN,800,600)+'" alt="Plan"><figcaption>Plan cadastral (mensuration officielle, geo.admin.ch)</figcaption></figure><figure><img src="'+sgFzWms(+P.E,+P.N,110,SG_FZ_ORTHO,800,600,'jpeg')+'" alt="Orthophoto"><figcaption>Orthophoto (swisstopo)</figcaption></figure></div>':'')
    +'<h2>2. Sources consultées</h2>'+(rec.SOURCES.length?'<table><tr><th>Date</th><th>Source</th><th>Contenu</th></tr>'+rec.SOURCES.slice().sort((a,b)=>cmp(a.DATE,b.DATE)).map(s=>'<tr><td>'+E(s.DATE?dfr(s.DATE):'')+'</td><td><b>'+E(s.TITRE)+'</b>'+(s.URL?'<br><small>'+E(s.URL)+'</small>':'')+'</td><td>'+E(s.RESUME||'')+'</td></tr>').join('')+'</table>':'<p class="fz-vide">Aucune source consultée.</p>')
    +'<h2>3. Règlements et restrictions de droit public</h2>'+(restr.length?'<table><tr><th>Thème (cadastre RDPPF)</th><th>Restriction</th><th class="r">Part</th><th>Dispositions juridiques</th></tr>'+restr.map(x=>'<tr><td>'+E(x.theme)+'</td><td>'+E(x.legende)+(x.statut?' <small>('+E(x.statut)+')</small>':'')+'</td><td class="r">'+(x.part!==''?E(x.part)+' %':'')+'</td><td>'+(x.docs||[]).filter(d=>/disposition/i.test(d.type)).map(d=>E(d.titre)).filter((v,i,a)=>a.indexOf(v)===i).slice(0,4).join('<br>')+'</td></tr>').join('')+'</table>':'<p class="fz-vide">Extrait RDPPF non consulté.</p>')
    +(nonC.length?'<p><b>Thèmes non concernés (cadastre RDPPF) :</b> '+E(nonC.join(', '))+'.</p>':'')
    +(cit.length?'<h3>Extraits cités des règlements</h3>'+cit.map(([s,cs])=>'<p><b>'+E(s.TITRE)+'</b></p><ul class="fz-cit">'+cs.map(c=>'<li>'+(c.ARTICLE?'<b>'+E(c.ARTICLE)+'</b> — ':'')+E(c.REGLE)+'</li>').join('')+'</ul>').join(''):'')
    +'<h2>4. Contraintes et réponses du projet</h2>'+(parTheme.length?parTheme.map(([k,l,cs])=>'<h3>'+E(l)+'</h3><table class="fz-ct"><tr><th style="width:34%">Contrainte · règle</th><th style="width:20%">Source · article · valeur</th><th>Réponse du projet</th><th style="width:12%">Statut</th></tr>'
        +cs.map(c=>'<tr><td><b>'+E(c.TITRE)+'</b>'+(c.REGLE?'<br>'+E(c.REGLE):'')+'</td><td>'+E([c.SOURCE,c.ARTICLE].filter(Boolean).join(' · '))+(c.VALEUR?'<br><b>'+E(c.VALEUR)+'</b>':'')+'</td><td>'+E(c.REPONSE||'—')+(c.NOTE?'<br><small>'+E(c.NOTE)+'</small>':'')+'</td><td class="st-'+E(c.STATUT||'a_traiter')+'">'+E(SG_FZ_ST_L[c.STATUT||'a_traiter']||'')+'</td></tr>').join('')+'</table>').join(''):'<p class="fz-vide">Aucune contrainte relevée.</p>')
    +'<h2>5. Potentiel constructible et variantes</h2>'+vol+'<h3>Études</h3>'+fichiers(rub('Études'))+'<h3>Variantes</h3>'+fichiers(rub('Variantes'))+'<h3>Présentation au client</h3>'+fichiers(rub('Présentation au client'))
    +'<h2>6. État existant et polluants</h2><h3>Bâtiments recensés (RegBL)</h3>'+(bats.length?'<table><tr><th>EGID</th><th>Adresse</th><th>Construction</th><th>Affectation</th><th class="r">Surface</th><th class="r">Niveaux</th><th class="r">Logements</th></tr>'
        +bats.map(b=>'<tr><td>'+E(b.egid)+'</td><td>'+E(b.adresse||'')+'</td><td>'+E(b.annee||SG_FZ_GBAUP[b.periode]||'')+'</td><td>'+E(SG_FZ_GKLAS[b.classe]||b.classe||'')+'</td><td class="r">'+(b.surface?E(num(b.surface,0))+' m²':'')+'</td><td class="r">'+E(b.niveaux||'')+'</td><td class="r">'+E(b.logements||'')+'</td></tr>').join('')+'</table>':'<p class="fz-vide">Aucun bâtiment recensé sur la parcelle, ou recherche geo.admin.ch non faite.</p>')
    +'<h3>Sites pollués</h3>'+(pol.length?'<ul>'+pol.map(c=>'<li><b>'+E(c.TITRE)+'</b>'+(c.REGLE?' — '+E(c.REGLE):'')+(c.REPONSE?'<br>Réponse : '+E(c.REPONSE):'')+'</li>').join('')+'</ul>':nonPol?'<p>La parcelle n’est pas inscrite au cadastre des sites pollués (cadastre RDPPF).</p>':'<p class="fz-vide">Non vérifié.</p>')
    +'<h3>Documents de base</h3>'+fichiers(rub('Documents de base'))
    +'<h2>7. Conclusion</h2>'+(String(rec.CONCLUSION||'').trim()?'<p class="fz-conc">'+E(rec.CONCLUSION)+'</p>':'<p class="fz-vide">Conclusion à rédiger.</p>')
    +'<p class="fz-sign">'+E(SG_BUREAU.nom)+' · '+E(dfr(today()))+(rec.PAR?' · '+E(rec.PAR):'')+'</p>';
  sgDocOuvrir('Fiche de faisabilité — '+(p.NUMBER||p.TITLE||''),corps,'Faisabilite_'+String(p.NUMBER||p.ID).replace(/[^\w.-]+/g,'_')+'.html'); }

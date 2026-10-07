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
   rotation 48 h / 60 jours / mensuelle) ; sans serveur : dossier choisi une fois (Chrome) ; sinon rappel dans « À traiter ». */
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
  try{ const {gz,n}=await sgBaseBlob(), nom='deltasub_base_'+sgHorodatage()+'.json.gz'; let etat=null;
    if(await sgSrv(true)){ const r=await fetch(SG_SRV+'/gestion/sauver',{method:'POST',headers:{'Content-Type':'application/gzip'},body:gz}), d=await r.json();
      if(!d.ok) throw new Error(d.error||'refus du serveur');
      etat={ou:'serveur',lieu:d.dossier,nom:d.nom}; }
    else{ const hd=await sgDossierSauv();
      if(hd&&(await hd.queryPermission({mode:'readwrite'}))==='granted'){
        const fh=await hd.getFileHandle(nom,{create:true}), w=await fh.createWritable(); await w.write(gz); await w.close();
        const noms=[]; for await (const [k] of hd.entries()) if(/^deltasub_base_\d{8}_\d{4}\.json\.gz$/.test(k)) noms.push(k);
        noms.sort().reverse().slice(40).forEach(k=>hd.removeEntry(k).catch(()=>{}));   // les 40 plus récentes
        etat={ou:'dossier',lieu:hd.name,nom}; }
      else if(manuel){ const a=h('a',{href:URL.createObjectURL(gz),download:nom}); document.body.append(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },2000);
        etat={ou:'téléchargement',lieu:'Téléchargements',nom}; }
      else { SAUV.etat=Object.assign({},SAUV.etat,{erreur:'Aucune destination : lancez le serveur de sauvegarde ou choisissez un dossier.',essai:Date.now()}); nxLS.set('sg3_sauvegarde',SAUV.etat); return false; } }
    SAUV.etat=Object.assign(etat,{quand:Date.now(),taille:gz.size,n,seq:DS.seq,erreur:null}); nxLS.set('sg3_sauvegarde',SAUV.etat);
    if(manuel) toast('Base sauvegardée ('+num(n,0)+' enregistrements) : '+(etat.ou==='serveur'?'Sauvegarde Gestion':etat.lieu)+'.');
    return true; }
  catch(e){ console.error(e); SAUV.etat=Object.assign({},SAUV.etat,{erreur:e.message||String(e),essai:Date.now()}); nxLS.set('sg3_sauvegarde',SAUV.etat);
    if(manuel) toast('✗ Sauvegarde impossible : '+(e.message||e),true); return false; }
  finally{ SAUV.enCours=false; sgSauvAff(); } }
const sgSauvAJour=()=>SAUV.etat.quand&&SAUV.etat.seq===DS.seq;
function sgSauvPlanifier(){ clearTimeout(SAUV.t); SAUV.t=setTimeout(()=>{ if(!sgSauvAJour()) sgSauver(false); },120000); sgSauvAff(); }
function sgSauvAff(enCours){ const f=document.querySelector('#nx-who .who span'); if(!f) return;
  const e=SAUV.etat, vieux=!e.quand||Date.now()-e.quand>48*3600e3;
  f.textContent=enCours?'Sauvegarde…':(e.quand?(sgSauvAJour()?'Sauvegardée ':'Modifiée · sauvée ')+sgDepuis(e.quand):'Jamais sauvegardée');
  f.className=vieux||e.erreur&&!sgSauvAJour()?'alerte':''; f.title=e.quand?'Dernière sauvegarde : '+new Date(e.quand).toLocaleString('fr-CH')+(e.lieu?' — '+e.lieu:''):''; }
async function sgChoisirDossier(){ if(!window.showDirectoryPicker){ sgAlert('Le choix d’un dossier demande Google Chrome (ou Edge, Brave, Arc).'); return; }
  try{ const hd=await showDirectoryPicker({id:'sg-sauvegarde',mode:'readwrite'}); await SGDB.put('reglages',hd,'dossierSauvegarde'); toast('Dossier de sauvegarde : '+hd.name+'.'); await sgSauver(true); if(VIEW&&VIEW.id==='nx-data') go('nx-data'); }
  catch(e){ if(e&&e.name!=='AbortError') toast('✗ '+(e.message||e),true); } }
/* dossier choisi : Chrome redemande l'autorisation à chaque session → on la redemande au premier clic dans l'app */
document.addEventListener('pointerdown',async function auto(){ document.removeEventListener('pointerdown',auto,true);
  const hd=await sgDossierSauv(); if(hd&&(await hd.queryPermission({mode:'readwrite'}))==='prompt'){ try{ await hd.requestPermission({mode:'readwrite'}); }catch(_){} } },true);
DS.on(ts=>{ if(ts.some(t=>t!=='sg_meta')) sgSauvPlanifier(); });
setInterval(()=>{ if(NX.booted&&!sgSauvAJour()&&(!SAUV.etat.quand||Date.now()-SAUV.etat.quand>30*60e3)) sgSauver(false); },5*60e3);
setInterval(()=>sgSauvAff(),60e3);
function sgSauvDemarrage(){ if(!SAUV.etat.quand||Date.now()-SAUV.etat.quand>12*3600e3||!sgSauvAJour()) setTimeout(()=>sgSauver(false),20000); }
async function sgRestaurer(nom){ sgConfirm('Restaurer la sauvegarde « '+nom+' » ?\n\nLa base de gestion de ce navigateur sera REMPLACÉE par cette sauvegarde (la base actuelle est d’abord sauvegardée).',async()=>{
  try{ await sgSauver(false); const r=await fetch(SG_SRV+'/gestion/lire?nom='+encodeURIComponent(nom)); if(!r.ok) throw new Error('lecture impossible');
    const n=await lbImport(new File([await r.blob()],nom)); toast(n+' enregistrements restaurés.'); setTimeout(()=>location.reload(),600); }
  catch(e){ toast('✗ Restauration impossible : '+(e.message||e),true); } },{title:'Restaurer une sauvegarde',yesText:'Restaurer',yesColor:'#bd1e42'}); }

/* ═══ 2. UN SEUL REGISTRE PAR DONNÉE ═════════════════════════════════════════════════════════════════════
   Adresses : l'Annuaire est la référence ; le carnet de Facturation (PV, calcul, devis) en est le reflet (+ ses fiches pas
   encore reprises). Heures : la Feuille de temps est la référence ; « Réunir les registres » y reprend les heures saisies
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
function sgContratsDuProjet(p,D){ return D?D.c.filter(c=>{ const q=sgProjetDuContrat(c); return q&&String(q.ID)===String(p.ID); }):[]; }
/* Facturation : propositions des affaires du moteur dans le champ « Affaire » du calcul d'honoraires */
function sgAffairesListe(){ if(!FX.ready) return; const d=FX.w.document; let dl=d.getElementById('sg-projets');
  if(!dl){ dl=d.createElement('datalist'); dl.id='sg-projets'; d.body.append(dl); }
  dl.innerHTML=DS.all('project').filter(p=>+p.PROJECTSTATECODE!==5).sort((a,b)=>cmp(a.NUMBER,b.NUMBER)).map(p=>'<option value="'+nxE(p.NUMBER)+'">'+nxE(p.TITLE||'')+'</option>').join('');
  const i=d.getElementById('ch_affaire'); if(i&&!i.dataset.sg){ i.dataset.sg=1; i.setAttribute('list','sg-projets');
    i.addEventListener('change',()=>{ const p=DS.all('project').find(x=>sgCle(x.NUMBER)===sgCle(i.value)); if(!p) return;
      const t=d.getElementById('ch_projet'); if(t&&!t.value.trim()){ t.value=p.TITLE||''; t.dispatchEvent(new Event('input',{bubbles:true})); } }); } }
/* reprise des heures saisies dans Facturation (source « fh ») dans la Feuille de temps */
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
    if(typeof hsOverlap==='function'&&hsOverlap(v)){ out.pb='déjà dans la Feuille de temps (même créneau)'; out.doublon=true; return out; }
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
    const html='<div class="sg-split">'+sgIntro('Réglages','Réunir les registres','Une seule référence par donnée : l’<b>Annuaire</b> pour les adresses, la <b>Feuille de temps</b> pour les heures, et chaque contrat relié à son projet. Rien n’est effacé : les anciens registres restent consultables dans Réglages ▸ Archives.'
        ,'<div class="sg-figs"><div class="sg-fig"><div class="n">'+r.ent.length+'</div><div class="t">entités du carnet à reprendre</div></div><div class="sg-fig"><div class="n">'+hOk.length+'</div><div class="t">saisies de temps à reprendre</div></div><div class="sg-fig"><div class="n">'+avec+'/'+cs.length+'</div><div class="t">contrats reliés</div></div>'+(fait?'<div class="sg-fig"><div class="n" style="font-size:16px">'+nxE(new Date(fait.le).toLocaleDateString('fr-CH'))+'</div><div class="t">dernière réunion</div></div>':'')+'</div>')
      +'<div><div class="nx-grid">'
      +nxCard('c12','Reprendre maintenant','<div class="b"><p style="margin:0 0 12px;font-weight:300">La base est d’abord sauvegardée. Seuls les éléments absents de la référence sont ajoutés ; les doublons sont ignorés.</p><button class="nx-btn pri" data-fn="go"'+((r.ent.length||hOk.length)?'':' disabled')+'>'+nxSvg('group')+'Réunir : '+r.ent.length+' entités, '+r.adr.length+' adresses, '+hOk.length+' saisies</button></div>')
      +nxCard('c6','Adresses du carnet absentes de l’Annuaire',r.ent.length?'<div class="b flush">'+r.ent.map(e=>'<div class="nx-row" style="cursor:default">'+nxSvg(e.type==='pers'?'person':'building')+'<div class="t"><b>'+nxE([e.nom,e.comp].filter(Boolean).join(' '))+'</b><span>'+nxE(r.adr.filter(a=>a.entId===e.id).map(a=>[a.loc,a.mail].filter(Boolean).join(' · ')).join(' | '))+'</span></div></div>').join('')+'</div>':'<div class="nx-empty">Toutes les adresses du carnet sont déjà dans l’Annuaire. Le carnet des PV, du calcul et des devis affiche désormais l’Annuaire.</div>','<span class="n">'+r.ent.length+'</span>')
      +nxCard('c6','Heures saisies dans Facturation',(hs.length?'<div class="b flush"><table class="nx-tbl"><tr><th>Date</th><th>Projet</th><th class="r">Durée</th><th>État</th></tr>'+hs.slice(0,60).map(x=>'<tr><td>'+dfr(x.src.date)+'</td><td>'+nxE(x.src.affaire)+'</td><td class="r">'+nxH(x.src.heures)+' h</td><td>'+(x.ok?'<span class="nx-tag s2">à reprendre</span>':x.doublon?'<span class="nx-tag s4">déjà présente</span>':'<span class="nx-tag urg">'+nxE(x.pb)+'</span>')+'</td></tr>').join('')+'</table></div>':'<div class="nx-empty">Aucune heure de Facturation à reprendre.</div>'),'<span class="n">'+hOk.length+' à reprendre · '+dbl.length+' déjà présentes · '+hKo.length+' à vérifier</span>')
      +nxCard('c12','Contrats d’honoraires sans projet relié',sans.length?'<div class="b flush"><table class="nx-tbl"><tr><th>Code</th><th>Projet / client</th><th>Date</th><th>Relier au projet</th></tr>'+sans.map(c=>'<tr><td><b>'+nxE(c.affaire||'—')+'</b></td><td>'+nxE([c.projet,c.nom].filter(Boolean).join(' — '))+'</td><td>'+(c.date?dfr(c.date):'')+'</td><td><select class="inp" data-lien="'+nxE(c.id)+'" style="max-width:340px"><option value="">— choisir —</option>'+projOpts+'</select></td></tr>').join('')+'</table></div>':'<div class="nx-empty">Tous les contrats sont reliés à un projet.</div>','<span class="n">'+sans.length+'</span>')
      +'</div></div></div>';
    const pg=m.querySelector('.nx-page'); pg.querySelector('.nx-wrap').innerHTML=html; pg0._fn.go=()=>sgConfirm('Réunir les registres maintenant ?\n\n'+r.ent.length+' entités et '+r.adr.length+' adresses entrent dans l’Annuaire, '+hOk.length+' saisies de temps dans la Feuille de temps.',sgReunirAppliquer,{title:'Réunir les registres',yesText:'Réunir'});
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
    et.textContent=sgSauvAJour()?'À jour':(e.quand?'Modifications depuis la dernière sauvegarde (prochaine automatiquement)':'Aucune sauvegarde');
    de.textContent=srv?'Serveur de sauvegarde — '+SAUV.srv.d.gestion:hd?'Dossier « '+hd.name+' » (Chrome)':'Aucune : lancez le serveur de sauvegarde (Mac Studio) ou choisissez un dossier';
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
   Honoraires du contrat (HT, contrats Facturation reliés ; sinon contrats du moteur), coût du temps (heures × taux interne
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
  if(!contratHT){ contratHT=DS.by('projectcontract','PROJECT_ID',p.ID).filter(c=>!+c.ISSUBCONTRACT).reduce((s,c)=>s+(+c.CONTRACTAMOUNT||0),0); src=contratHT?'moteur':''; }
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
  return {p,h,hc,cout,contratHT,src,factHT,factTTC,encTTC,marge:factHT-cout,reste:contratHT-cout,conso,fact,cs,fs,byPh,hors,al,niv:al.some(a=>a[0]==='r')?3:al.some(a=>a[0]==='o')?2:al.length?1:0}; }
const sgPct=v=>v==null?'—':Math.round(v*100)+' %';
const sgBarre=(v,col)=>v==null?'':'<span class="nx-mini-bar"><i style="width:'+Math.max(2,Math.min(100,v*100))+'%;background:'+(col||'var(--s-nuit)')+'"></i></span>';
const sgAlerteTag=a=>'<span class="nx-tag '+(a[0]==='r'?'urg':a[0]==='o'?'s3':'s4')+'">'+nxE(a[1])+'</span>';
VIEWS['nx-renta']={ render(m){ const pg0=nxPage(m,'<div class="nx-empty">Calcul de la rentabilité…</div>'); const tous=nxLS.get('sg3_renta_tous',false);
  fxEnsure().catch(()=>null).then(()=>{ if(!VIEW||VIEW.id!=='nx-renta') return; const D=fxData(), taux=sgTaux();
    const ps=DS.all('project').filter(p=>!sgInterne(p)&&(tous?+p.PROJECTSTATECODE!==5:+p.PROJECTSTATECODE===2||+p.PROJECTSTATECODE===3));
    const L=ps.map(p=>sgRenta(p,D,taux)).filter(x=>x.h||x.contratHT).sort((a,b)=>b.niv-a.niv||(b.conso||0)-(a.conso||0));
    const T=L.reduce((t,x)=>({c:t.c+x.contratHT,k:t.k+x.cout,f:t.f+x.factHT,e:t.e+x.encTTC}),{c:0,k:0,f:0,e:0}), nAl=L.filter(x=>x.niv>=2).length;
    const html='<div class="sg-split">'+sgIntro('Finances','Rentabilité des projets','Pour chaque projet : honoraires du contrat, coût du temps passé (taux interne de chaque membre), montant facturé et encaissé, marge. Les montants sont hors taxes, sauf l’encaissé (TTC).'
        ,'<div class="sg-figs"><div class="sg-fig"><div class="n">'+nAl+'</div><div class="t">projets en alerte</div></div><div class="sg-fig"><div class="n">'+L.length+'</div><div class="t">projets suivis</div></div></div><div class="acts"><button class="nx-btn" data-fn="tous">'+nxSvg('filter')+(tous?'Projets en cours seulement':'Inclure les projets terminés')+'</button><button class="nx-btn" data-fn="csv">'+nxSvg('export')+'Exporter (CSV)</button></div>')
      +'<div><div class="nx-kpis">'+nxKpi('contrat','Honoraires (HT)',nxCHF(T.c)+'<small>CHF</small>','contrats reliés',null,null,1)+nxKpi('clock','Coût du temps',nxCHF(T.k)+'<small>CHF</small>',T.c?Math.round(T.k/T.c*100)+' % des honoraires':'')+nxKpi('receipt','Facturé (HT)',nxCHF(T.f)+'<small>CHF</small>',T.c?Math.round(T.f/T.c*100)+' % des honoraires':'')+nxKpi('trend','Marge',nxCHF(T.f-T.k)+'<small>CHF</small>','facturé − coût du temps')+'</div>'
      +nxCard('c12','Par projet','<div class="b flush" style="overflow:auto"><table class="nx-tbl"><tr><th>Projet</th><th class="r">Honoraires HT</th><th class="r">Coût du temps</th><th>Consommé</th><th class="r">Facturé HT</th><th>Facturé</th><th class="r">Encaissé TTC</th><th class="r">Marge</th><th>Alertes</th></tr>'
        +L.map(x=>'<tr class="nx-row" data-ref="p:'+x.p.ID+'" style="display:table-row"><td><span class="nx-tag num">'+nxE(x.p.NUMBER)+'</span> '+nxE((x.p.TITLE||'').slice(0,46))+'</td><td class="r">'+(x.contratHT?nxCHF(x.contratHT):'—')+'</td><td class="r">'+nxCHF(x.cout)+'</td><td>'+sgBarre(x.conso,x.conso>1?'var(--s-rouge)':x.conso>=.8?'var(--s-orange)':null)+' '+sgPct(x.conso)+'</td><td class="r">'+nxCHF(x.factHT)+'</td><td>'+sgBarre(x.fact)+' '+sgPct(x.fact)+'</td><td class="r">'+nxCHF(x.encTTC)+'</td><td class="r"'+(x.marge<0?' style="color:var(--s-rouge)"':'')+'>'+nxCHF(x.marge)+'</td><td>'+x.al.map(sgAlerteTag).join(' ')+'</td></tr>').join('')+'</table></div>')+'</div></div>';
    const pg=m.querySelector('.nx-page'); pg.querySelector('.nx-wrap').innerHTML=html;
    pg0._fn.tous=()=>{ nxLS.set('sg3_renta_tous',!tous); go('nx-renta'); };
    pg0._fn.csv=()=>{ const q=v=>'"'+String(v).replace(/"/g,'""')+'"', rows=[['Projet','Titre','Honoraires HT','Coût du temps','Consommé %','Facturé HT','Facturé %','Encaissé TTC','Marge','Heures','Alertes']]
        .concat(L.map(x=>[x.p.NUMBER,x.p.TITLE,Math.round(x.contratHT),Math.round(x.cout),x.conso==null?'':Math.round(x.conso*100),Math.round(x.factHT),x.fact==null?'':Math.round(x.fact*100),Math.round(x.encTTC),Math.round(x.marge),Math.round(x.h*10)/10,x.al.map(a=>a[1]).join(' ; ')]));
      const a=h('a',{href:URL.createObjectURL(new Blob(['﻿'+rows.map(r=>r.map(q).join(';')).join('\n')],{type:'text/csv'})),download:'rentabilite_'+sgHorodatage()+'.csv'}); document.body.append(a); a.click(); setTimeout(()=>a.remove(),1000); };
  }); },
  refresh(ts){ if(hit(ts,'timelog','project','projectcontract','staffrate')) go('nx-renta'); } };

/* ═══ 3. FICHE PROJET = CENTRE DE PILOTAGE ═══════════════════════════════════════════════════════════════
   Onglets : vue d'ensemble · temps · phases & budget · intervenants · contrats & factures · chantier · documents · notes
   & tâches ; actions directes : saisir du temps, facturer, PV de chantier, ouvrir dans Projets. */
const SG_ONGLETS=[['vue','Vue d’ensemble'],['temps','Temps'],['phases','Phases & budget'],['interv','Intervenants'],['factu','Contrats & factures'],['chantier','Chantier'],['docs','Documents'],['notes','Notes & tâches']];
function sgOuvrirDomaine(p,dom){ try{ AM.dom=dom; localStorage.setItem('ds_am_dom',dom); }catch(_){} go('aff-toutes',{project:p.ID}); }
VIEWS['nx-projet']={
  render(m,arg){ const p=DS.get('project',arg); if(!p){ nxPage(m,'<div class="nx-empty">Projet introuvable. Choisissez un projet avec ⌘K.</div>'); return; }
    VIEW.nxTitle=(p.NUMBER?p.NUMBER+' · ':'')+(p.TITLE||''); nxRecent('p',p.ID);
    const ong=nxLS.get('sg3_fiche_onglet','vue'), mo=projMO(p), pin=nxPinned('p',p.ID);
    const html='<div class="nx-hero"><div class="ic">'+nxE(String(p.NUMBER||'').slice(0,5)||nxIni(p.TITLE))+'</div><div class="tx"><h2>'+nxE(p.TITLE||p.NUMBER)+'</h2><div class="meta"><span class="nx-tag num">'+nxE(p.NUMBER||'')+'</span>'+nxStateTag(p)
      +(mo?'<span>'+nxSvg('person')+nxE(mo)+'</span>':'')+(p.LOCATION?'<span>'+nxSvg('map')+nxE(p.LOCATION)+'</span>':'')+(p.PROJECTSTARTDATE?'<span>'+nxSvg('cal')+dfr(p.PROJECTSTARTDATE)+(p.PROJECTENDDATE?' → '+dfr(p.PROJECTENDDATE):'')+'</span>':'')
      +(+p.ISINTERNAL?'<span class="nx-tag">Interne</span>':'')+'<span id="sg-p-al"></span></div></div><div class="nx-acts">'
      +'<button class="nx-btn pri" data-fn="temps">'+nxSvg('timer')+'Saisir du temps</button><button class="nx-btn" data-fn="facturer">'+nxSvg('receipt')+'Facturer</button><button class="nx-btn" data-fn="pv">'+nxSvg('pv')+'PV de chantier</button>'
      +'<button class="nx-btn'+(pin?' on':'')+'" data-fn="pin" title="Favori">'+nxSvg('pin')+'</button><button class="nx-btn" data-fn="more" title="Plus">'+nxSvg('more')+'</button><button class="nx-btn" data-fn="edit">'+nxSvg('edit')+'Modifier</button></div></div>'
      +'<div class="sg-onglets">'+SG_ONGLETS.map(([k,t])=>'<button data-fn="o_'+k+'" class="'+(k===ong?'on':'')+'">'+t+'</button>').join('')+'</div><div id="sg-onglet"><div class="nx-empty">…</div></div>';
    const pg=nxPage(m,html);
    SG_ONGLETS.forEach(([k])=>pg._fn['o_'+k]=()=>{ nxLS.set('sg3_fiche_onglet',k); pg.querySelectorAll('.sg-onglets button').forEach(b=>b.classList.toggle('on',b.dataset.fn==='o_'+k)); sgOnglet(p,k,pg); });
    Object.assign(pg._fn,{edit:()=>editProject(p),temps:()=>sgSaisieRapide({projet:p.ID}),pin:b=>{ const on=nxTogglePin('p',p.ID); b.classList.toggle('on',on); },
      facturer:()=>fxEnsure().then(()=>{ const cs=sgContratsDuProjet(p,fxData()); if(cs.length===1) go('fx-saisie','nf:'+cs[0].id); else if(cs.length>1) popMenu(pg.querySelector('[data-fn=facturer]'),cs.map(c=>({t:'Contrat '+(c.affaire||'')+' — '+(c.nom||c.projet||''),fn:()=>go('fx-saisie','nf:'+c.id)}))); else sgConfirm('Aucun contrat d’honoraires n’est relié à '+p.NUMBER+'.\nCréer un contrat pour ce projet ?',()=>go('fx-calchono','newaff:'+p.NUMBER),{title:'Facturer',yesText:'Nouveau contrat'}); }),
      pv:()=>go('fx-pv-chantier','pv:'+p.NUMBER),
      more:b=>popMenu(b,[{t:'Ouvrir dans Tous les projets',fn:()=>go('aff-toutes',{project:p.ID})},{t:'Intervenants …',fn:()=>cfgMembers(p)},{t:'Phases …',fn:()=>cfgPhases(p)},{t:'Activités …',fn:()=>cfgActivities(p)},{t:'Tarifs de facturation …',fn:()=>cfgRates(p)},{t:'Subdivisions …',fn:()=>cfgSubprojects(p)},'-',
        {t:'Contrôle des coûts',fn:()=>go('coco',{project:p.ID})},{t:'Rentabilité des projets',fn:()=>go('nx-renta')}])});
    sgOnglet(p,ong,pg);
    if(!sgFinVerrou()) fxEnsure().then(()=>{ const x=sgRenta(p,fxData()), b=document.getElementById('sg-p-al'); if(b&&x.al.length) b.innerHTML=x.al.map(sgAlerteTag).join(' '); }).catch(()=>{}); },
  refresh(ts){ if(hit(ts,'project','projectmember','projectphase','projectsubphase','timelog','projectcost','projectcontract','projectnote','projecttask','depotfichier')) go('nx-projet',VIEW.arg); }
};
function sgOnglet(p,k,pg){ const box=pg.querySelector('#sg-onglet'); const set=h0=>{ box.innerHTML=h0; };
  const now=new Date(), taux=sgTaux(), logs=DS.by('timelog','PROJECT_ID',p.ID);
  if(k==='factu'&&sgFinVerrou()){ set('<div class="nx-empty">'+nxSvg('lock')+'<p>Contrats, factures et rentabilité sont protégés par le code d’accès.</p><button class="nx-btn pri" data-fn="deverr">Déverrouiller</button></div>'); pg._fn.deverr=()=>sgDeverrouiller().then(ok=>{ if(ok) sgOnglet(p,k,pg); }); return; }
  if(k==='vue'){ const lim30=dayKey(new Date(now.getFullYear(),now.getMonth(),now.getDate()-30)); let tot=0,h30=0,chg=0; const bySt={}, byM={};
    logs.forEach(r=>{ const v=+r.TIMEPERIOD||0, d=tlDate(r); tot+=v; if(tlKey(r)>=lim30) h30+=v; if(+r.ISCHARGEABLE) chg+=v; bySt[r.STAFF_ID]=(bySt[r.STAFF_ID]||0)+v; const mk=d.getFullYear()*12+d.getMonth(); byM[mk]=(byM[mk]||0)+v; });
    const mks=Object.keys(byM).map(Number), mEnd=now.getFullYear()*12+now.getMonth(), mStart=Math.max(mks.length?Math.min(...mks):mEnd-11,mEnd-23), months=[];
    for(let i=Math.min(mStart,mEnd-11);i<=mEnd;i++) months.push({l:MOISL[i%12]+' '+Math.floor(i/12),s:MOIS[i%12].replace('.',''),a:byM[i]||0});
    const team=Object.entries(bySt).map(([id,v])=>({s:DS.get('staff',id),v})).filter(x=>x.s).sort((a,b)=>b.v-a.v);
    set('<div class="nx-kpis" id="sg-p-kpis">'+nxKpi('clock','Temps total',nxH(tot)+'<small>h</small>',nxH(h30)+' h ces 30 derniers jours',null,null,1)+nxKpi('trend','Part facturable',(tot?Math.round(chg/tot*100):0)+'<small>%</small>',nxH(chg)+' h facturables',tot?chg/tot*100:0)+'<div class="nx-kpi"><div class="l">Rentabilité</div><div class="v">…</div></div></div>'
      +'<div class="nx-grid">'+nxCard('c8','Temps par mois','<div class="b">'+nxBars(months,{every:months.length>14?2:1})+'</div>')
      +nxCard('c4','Équipe','<div class="b flush">'+(team.length?team.slice(0,9).map(x=>'<div class="nx-person" data-ref="s:'+x.s.ID+'"><div class="nx-av">'+nxE(nxIni(staffName(x.s)))+'</div><div class="t"><b>'+nxE(staffName(x.s))+'</b><span>'+Math.round(x.v/tot*100)+' % du temps</span></div><span class="m">'+nxH(x.v)+' h</span></div>').join(''):'<div class="nx-empty">Aucune saisie de temps.</div>')+'</div>')+'</div>');
    if(sgFinVerrou()){ const K=document.getElementById('sg-p-kpis'); K.lastElementChild.outerHTML='<div class="nx-kpi" data-fn="deverr" style="cursor:pointer"><div class="l">'+nxSvg('lock')+'Finances</div><div class="v" style="font-size:15px">Verrouillées</div><div class="s">Cliquer pour saisir le code</div></div>'; pg._fn.deverr=()=>sgDeverrouiller().then(ok=>{ if(ok) sgOnglet(p,k,pg); }); return; }
    fxEnsure().catch(()=>null).then(()=>{ const x=sgRenta(p,fxData(),taux), K=document.getElementById('sg-p-kpis'); if(!K) return;
      K.innerHTML=K.innerHTML.replace(/<div class="nx-kpi"><div class="l">Rentabilité<\/div><div class="v">…<\/div><\/div>/,
        nxKpi('coins','Coût du temps',nxCHF(x.cout)+'<small>CHF</small>',x.contratHT?Math.round(x.conso*100)+' % des honoraires ('+nxCHF(x.contratHT)+' HT)':'aucun contrat relié',x.conso==null?null:x.conso*100)
        +nxKpi('receipt','Facturé (HT)',nxCHF(x.factHT)+'<small>CHF</small>',x.contratHT?Math.round(x.fact*100)+' % des honoraires · encaissé '+nxCHF(x.encTTC)+' TTC':'encaissé '+nxCHF(x.encTTC)+' TTC',x.fact==null?null:x.fact*100)
        +nxKpi('wallet','Marge',nxCHF(x.marge)+'<small>CHF</small>','facturé − coût du temps')); }); return; }
  if(k==='temps'){ const per=nxLS.get('sg3_fiche_per','12'), lim=per==='tout'?0:dayKey(new Date(now.getFullYear(),now.getMonth()-(+per),now.getDate()));
    const L=logs.filter(r=>tlKey(r)>=lim).sort((a,b)=>tlKey(b)-tlKey(a)||cmp(b.TIMEHOUR1,a.TIMEHOUR1)), tot=L.reduce((s,r)=>s+(+r.TIMEPERIOD||0),0);
    set('<div style="display:flex;gap:8px;align-items:center;margin:0 0 14px;flex-wrap:wrap"><div class="seg">'+[['1','1 mois'],['3','3 mois'],['12','12 mois'],['tout','Tout']].map(([v,t])=>'<button data-per="'+v+'" class="'+(v===per?'on':'')+'">'+t+'</button>').join('')+'</div><span style="margin-left:auto;color:var(--s-gris)">'+L.length+' saisies · '+nxH(tot)+' h'+(sgFinVerrou()?'':' · coût '+nxCHF(L.reduce((s,r)=>s+(+r.TIMEPERIOD||0)*taux(r.STAFF_ID,tlDate(r)),0))+' CHF')+'</span><button class="nx-btn pri" data-fn="temps">'+nxSvg('timer')+'Saisir du temps</button><button class="nx-btn" data-go="h-saisie">Feuille de temps</button></div>'
      +nxCard('c12','Saisies','<div class="b flush" style="max-height:60vh;overflow:auto"><table class="nx-tbl"><tr><th>Date</th><th>Membre</th><th>Activité</th><th>Phase</th><th class="r">Durée</th><th>Fact.</th><th>Statut</th></tr>'
        +L.slice(0,400).map(r=>{ const s=DS.get('staff',r.STAFF_ID), a=DS.get('projectactivity',r.ACTIVITY_ID)||DS.get('activity',r.ACTIVITY_ID), f=DS.get('projectphase',r.PHASE_ID);
          return '<tr><td>'+dfr(diso(tlDate(r)))+'</td><td>'+nxE(s?s.INITIALS||staffName(s):'')+'</td><td style="max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+nxE([nm(a),r.DESCRIPTION].filter(Boolean).join(' — '))+'</td><td>'+nxE(nm(f))+'</td><td class="r">'+nxH(r.TIMEPERIOD)+' h</td><td>'+(+r.ISCHARGEABLE?'oui':'non')+'</td><td>'+nxE(TSTATE[r.TIMELOGSTATECODE||0]||'')+'</td></tr>'; }).join('')+'</table></div>'));
    box.querySelectorAll('[data-per]').forEach(b=>b.onclick=()=>{ nxLS.set('sg3_fiche_per',b.dataset.per); sgOnglet(p,'temps',pg); }); return; }
  if(k==='phases'){ const ph=DS.by('projectphase','PROJECT_ID',p.ID).sort((a,b)=>cmp(a.NUMBER,b.NUMBER)), bySP={}, byPhC={}, byPh={};
    logs.forEach(r=>{ const v=+r.TIMEPERIOD||0; if(r.SUBPHASE_ID!=null) bySP[r.SUBPHASE_ID]=(bySP[r.SUBPHASE_ID]||0)+v; if(r.PHASE_ID!=null){ byPh[r.PHASE_ID]=(byPh[r.PHASE_ID]||0)+v; byPhC[r.PHASE_ID]=(byPhC[r.PHASE_ID]||0)+v*taux(r.STAFF_ID,tlDate(r)); } });
    const sans=logs.filter(r=>r.PHASE_ID==null).reduce((s,r)=>s+(+r.TIMEPERIOD||0),0);
    set(ph.length?nxCard('c12','Phases et budget','<div class="b flush"><table class="nx-tbl"><tr><th>Phase</th><th class="r">Budget</th><th class="r">Réel</th><th class="r">Écart</th><th></th><th class="r">Coût du temps</th><th class="r">Budget CHF</th></tr>'
      +ph.map(f=>{ const v=byPh[f.ID]||0, b=+f.TIMEBUDGET||0, sp=DS.by('projectsubphase','PROJECTPHASE_ID',f.ID).sort((a,c)=>cmp(a.NUMBER,c.NUMBER));
        return '<tr><td><b>'+nxE((f.NUMBER!=null?f.NUMBER+' · ':'')+nm(f))+'</b></td><td class="r">'+(b?nxH(b)+' h':'—')+'</td><td class="r">'+nxH(v)+' h</td><td class="r"'+(b&&v>b?' style="color:var(--s-rouge)"':'')+'>'+(b?(v>b?'+':'')+nxH(v-b)+' h':'')+'</td><td style="width:110px">'+(b?sgBarre(v/b,v>b?'var(--s-rouge)':null):'')+'</td><td class="r">'+nxCHF(byPhC[f.ID]||0)+'</td><td class="r">'+(+f.TIMEAMOUNTBUDGET?nxCHF(f.TIMEAMOUNTBUDGET):'—')+'</td></tr>'
          +sp.map(s=>'<tr><td style="padding-left:26px;color:var(--s-gris)">'+nxE(nm(s))+(s.ISTERMINATED?' 🔒':'')+'</td><td></td><td class="r" style="color:var(--s-gris)">'+nxH(bySP[s.ID]||0)+' h</td><td colspan="4"></td></tr>').join(''); }).join('')
      +(sans?'<tr><td style="color:var(--s-gris)">Sans phase</td><td></td><td class="r">'+nxH(sans)+' h</td><td colspan="4"></td></tr>':'')+'</table></div>','<span class="a" data-fn="ph">Configurer</span>'):'<div class="nx-empty">Aucune phase configurée. <a href="#" data-fn="ph">Configurer les phases</a></div>');
    pg._fn.ph=()=>cfgPhases(p); return; }
  if(k==='interv'){ const mem=DS.by('projectmember','PROJECT_ID',p.ID).filter(x=>!+x.ISHIDDEN&&+x.TEAMROLECODE!==90).sort((a,b)=>(ROLE_ORD[a.TEAMROLECODE]??99)-(ROLE_ORD[b.TEAMROLECODE]??99)||cmp(a.SORTORDER,b.SORTORDER)), grp={};
    mem.forEach(x=>(grp[teamRole(x.TEAMROLECODE)]=grp[teamRole(x.TEAMROLECODE)]||[]).push(x));
    set('<div style="display:flex;justify-content:flex-end;gap:8px;margin:0 0 14px"><button class="nx-btn" data-fn="mem">'+nxSvg('users')+'Gérer les intervenants</button><button class="nx-btn" data-fn="dom" data-dom="Liste d’adresses">'+nxSvg('list')+'Liste d’adresses</button></div><div class="nx-grid">'
      +(Object.keys(grp).length?Object.entries(grp).map(([role,xs])=>nxCard('c6',nxE(role),'<div class="b flush">'+xs.map(x=>{ const c=DS.get('contact',x.CONTACT_ID), o=c&&DS.get('contactowner',c.CONTACTOWNER_ID), tel=c&&[c.PHONEAREA1,c.PHONENUMBER1].filter(Boolean).join(' ');
        return '<div class="nx-person"'+(o?' data-ref="c:'+o.ID+'"':'')+'><div class="nx-av ext">'+nxE(nxIni(contactName(c)))+'</div><div class="t"><b>'+nxE(contactName(c)||'—')+'</b><span>'+nxE([x.BKP?'CFC '+x.BKP:'',c&&c.EMAIL1,tel].filter(Boolean).join(' · '))+'</span></div></div>'; }).join('')+'</div>','<span class="n">'+xs.length+'</span>')).join(''):'<div class="nx-empty">Aucun intervenant.</div>')+'</div>');
    pg._fn.mem=()=>cfgMembers(p); pg._fn.dom=b=>sgOuvrirDomaine(p,b.dataset.dom); return; }
  if(k==='factu'){ set('<div class="nx-empty">Recherche dans la facturation…</div>');
    fxEnsure().catch(()=>null).then(()=>{ const D=fxData(), x=sgRenta(p,D,taux); if(!box.isConnected) return;
      const opts=DS.all('project').length?'':''; const libre=D?D.c.filter(c=>!c.annule&&!sgProjetDuContrat(c)):[];
      set('<div class="nx-kpis">'+nxKpi('contrat','Honoraires (HT)',x.contratHT?nxCHF(x.contratHT)+'<small>CHF</small>':'—',x.src==='moteur'?'contrats des projets':x.cs.length+' contrat(s)',null,null,1)+nxKpi('coins','Coût du temps',nxCHF(x.cout)+'<small>CHF</small>',sgPct(x.conso)+' des honoraires',x.conso==null?null:x.conso*100)+nxKpi('receipt','Facturé (HT)',nxCHF(x.factHT)+'<small>CHF</small>',sgPct(x.fact)+' des honoraires',x.fact==null?null:x.fact*100)+nxKpi('wallet','Encaissé (TTC)',nxCHF(x.encTTC)+'<small>CHF</small>','marge '+nxCHF(x.marge)+' CHF')+'</div>'
        +(x.al.length?'<div style="margin:-14px 0 20px">'+x.al.map(sgAlerteTag).join(' ')+'</div>':'')
        +'<div class="nx-grid">'+nxCard('c12','Contrats d’honoraires',(x.cs.length?'<div class="b flush"><table class="nx-tbl"><tr><th>Contrat</th><th>Client</th><th>Date</th><th class="r">HT</th><th class="r">TTC</th><th>État</th><th></th></tr>'+x.cs.map(c=>'<tr><td><b>'+nxE(c.affaire||'')+'</b> '+nxE(c.projet||'')+'</td><td>'+nxE(c.nom||'')+'</td><td>'+(c.date?dfr(c.date):'')+'</td><td class="r">'+nxCHF(c.hht)+'</td><td class="r">'+nxCHF(c.httc)+'</td><td>'+(c.signe?'<span class="nx-tag s2">Signé</span>':c.envoye?'<span class="nx-tag s3">Envoyé</span>':'<span class="nx-tag">Brouillon</span>')+'</td><td class="r"><button class="nx-btn" style="height:28px" data-go="fx-calchono" data-arg="c:'+nxE(c.id)+'">Ouvrir</button> <button class="nx-btn" style="height:28px" data-go="fx-saisie" data-arg="nf:'+nxE(c.id)+'">Facturer</button></td></tr>').join('')+'</table></div>'
            :'<div class="b"><p style="margin:0 0 10px;font-weight:300">Aucun contrat de Facturation relié à ce projet.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="nx-btn pri" data-go="fx-calchono" data-arg="newaff:'+nxE(p.NUMBER)+'">'+nxSvg('contrat')+'Nouveau contrat</button>'+(libre.length?'<select class="inp" id="sg-lier" style="max-width:380px"><option value="">Relier un contrat existant…</option>'+libre.map(c=>'<option value="'+nxE(c.id)+'">'+nxE([c.affaire||'(sans code)',c.projet,c.nom].filter(Boolean).join(' — '))+'</option>').join('')+'</select>':'')+'</div></div>'),'<span class="a" data-go="fx-contrats">Tous les contrats</span>')
        +nxCard('c12','Factures',x.fs.length?'<div class="b flush"><table class="nx-tbl"><tr><th>Facture</th><th>Type</th><th>Date</th><th>Échéance</th><th class="r">TTC</th><th>Statut</th></tr>'+x.fs.sort((a,b)=>cmp(b.date,a.date)).map(f=>'<tr class="nx-row" data-go="fx-saisie" data-arg="f:'+nxE(f.id)+'" style="display:table-row"><td><b>'+nxE(f.num||'')+'</b></td><td>'+nxE(f.type||'')+'</td><td>'+(f.date?dfr(f.date):'')+'</td><td>'+(f.ech?dfr(f.ech):'')+'</td><td class="r">'+nxCHF((+f._ttc||0)+(+f._fttc||0))+'</td><td>'+(fxUnpaid(f)?'<span class="nx-tag '+(f.ech&&f.ech<today()?'urg':'s3')+'">'+nxE(f.statut||'Ouverte')+'</span>':'<span class="nx-tag s2">Payée</span>')+'</td></tr>').join('')+'</table></div>':'<div class="nx-empty">Aucune facture.</div>')
        +'</div>');
      const s=box.querySelector('#sg-lier'); if(s) s.onchange=()=>{ if(!s.value) return; const l=sgLiens(); l[s.value]=String(p.ID); nxLS.set('sg3_liens',l); toast('Contrat relié à '+p.NUMBER+'.'); sgOnglet(p,'factu',pg); }; }); return; }
  if(k==='chantier'){ set('<div class="nx-empty">Chargement des documents…</div>');
    DS.need(['costestimate','costcontrol','costplanning']).then(()=>fxEnsure().catch(()=>null)).then(()=>{ if(!box.isConnected) return;
      const docs=(t,lbl,dom,go_)=>{ const L=DS.by(t,'PROJECT_ID',p.ID).filter(d=>!+d.ISMARKEDASDELETED).sort((a,b)=>cmp(b.CHANGEDDATE,a.CHANGEDDATE));
        return nxCard('c6',lbl,L.length?'<div class="b flush">'+L.map(d=>'<div class="nx-row" data-fn="dom" data-dom="'+nxE(dom)+'">'+nxSvg('doc')+'<div class="t"><b>'+nxE(d.NOTE||d.VERSION||('Document '+d.ID))+'</b><span>'+nxE(['version '+(d.VERSIONNUMBER||d.VERSION||''),d.CHANGEDDATE?dfr(String(d.CHANGEDDATE).slice(0,10)):'',d.USERID].filter(Boolean).join(' · '))+'</span></div></div>').join('')+'</div>':'<div class="nx-empty">Aucun document.</div>','<span class="n">'+L.length+'</span><span class="a" data-fn="dom" data-dom="'+nxE(dom)+'">Ouvrir</span>'); };
      let pv={}; try{ pv=JSON.parse(FX.w.localStorage.getItem('sa_pv_data')||'{}'); }catch(_){}
      const pk=Object.keys(pv).find(c=>sgCle(c)===sgCle(p.NUMBER)), pvs=pk?(pv[pk].pvs||[]):[];
      set('<div class="nx-grid">'+docs('costestimatedocument','Descriptifs & devis','Devis général')+docs('costcontroldocument','Contrôles des coûts','Contrôle des coûts')+docs('costplanningdocument','Estimations eCCC','Calcul des coûts')
        +nxCard('c6','PV de chantier',pvs.length?'<div class="b flush">'+pvs.slice().sort((a,b)=>cmp(b.date,a.date)).map(x=>'<div class="nx-row" data-go="fx-pv-chantier" data-arg="pv:'+nxE(pk)+'">'+nxSvg('pv')+'<div class="t"><b>PV n° '+nxE(x.num)+'</b><span>'+nxE([x.date?dfr(x.date):'',x.statut].filter(Boolean).join(' · '))+'</span></div></div>').join('')+'</div>':'<div class="b"><p style="margin:0 0 10px;font-weight:300">Aucun PV pour ce projet.</p><button class="nx-btn" data-go="fx-pv-chantier" data-arg="pv:'+nxE(p.NUMBER)+'">'+nxSvg('pv')+'PV de chantier</button></div>','<span class="n">'+pvs.length+'</span>')+'</div>');
      pg._fn.dom=b=>sgOuvrirDomaine(p,b.dataset.dom); }); return; }
  if(k==='docs'){ DS.need(['depotfichier']).then(()=>{ if(!box.isConnected) return;
    const L=DS.all('depotfichier').filter(f=>String(f.PROJECT_ID)===String(p.ID)||String(f.DOSSIER).startsWith('ProjectDocuments/Documents/'+p.ID+'/')).sort((a,b)=>cmp(a.DOSSIER,b.DOSSIER)||cmp(a.NOM,b.NOM)), grp={};
    L.forEach(f=>(grp[f.DOSSIER]=grp[f.DOSSIER]||[]).push(f));
    set('<div style="display:flex;gap:8px;align-items:center;margin:0 0 14px"><span style="color:var(--s-gris)">'+L.length+' fichier'+(L.length>1?'s':'')+'</span><span style="flex:1"></span><button class="nx-btn pri" data-fn="ajout">'+nxSvg('plus')+'Ajouter des fichiers</button><button class="nx-btn" data-fn="dom" data-dom="Documents">'+nxSvg('folder')+'Domaine Documents</button></div>'
      +(L.length?Object.entries(grp).map(([d,fs])=>nxCard('c12',nxE(d.replace(/^ProjectDocuments\/Documents\/\d+\/?/,'Documents / ').replace(/^Construction\//,'Chantier / ')),'<div class="b flush">'+fs.map(f=>'<div class="nx-row" data-sha="'+nxE(f.ID)+'">'+nxSvg(f.EXT==='pdf'?'pdf':'doc')+'<div class="t"><b>'+nxE(f.NOM)+'</b><span>'+nxE([(f.TAILLE?(f.TAILLE/1024).toFixed(0)+' Ko':''),f.PAGES?f.PAGES+' p.':'',f.MODIFIED?String(f.MODIFIED).slice(0,10).split('-').reverse().join('.'):''].filter(Boolean).join(' · '))+'</span></div></div>').join('')+'</div>')).join(''):'<div class="nx-empty">Aucun fichier joint à cette affaire.</div>'));
    box.querySelectorAll('[data-sha]').forEach(r=>r.onclick=()=>{ const f=DS.get('depotfichier',r.dataset.sha); if(f) ch03aOuvrir(f); });
    pg._fn.dom=b=>sgOuvrirDomaine(p,b.dataset.dom); pg._fn.ajout=()=>sgAjouterFichiers(p); }); return; }
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
  const e=SAUV.etat; if(!e.quand||Date.now()-e.quand>48*3600e3) G.push({k:'sv',t:'Sauvegarde',ico:'db',go:'nx-data',items:[{t:e.quand?'Dernière sauvegarde '+sgDepuis(e.quand):'Base jamais sauvegardée',s:e.erreur||'Sauvegarder maintenant ou choisir un dossier'}]});
  let D=null; try{ await fxEnsure(); D=fxData(); }catch(_){}
  if(D){ const ech=D.f.filter(f=>fxUnpaid(f)&&f.ech&&f.ech<td).sort((a,b)=>cmp(a.ech,b.ech));
    if(ech.length) G.push({k:'fe',t:'Factures échues à relancer',ico:'receipt',go:'fx-factures',items:ech.map(f=>({t:(f.num||'(sans numéro)')+' · '+nxCHF((+f._ttc||0)+(+f._fttc||0))+' CHF',s:[fxClient(D,f),'échue le '+dfr(f.ech)].filter(Boolean).join(' · '),go:'fx-saisie',arg:'f:'+f.id}))});
    const lim=diso(new Date(now.getFullYear(),now.getMonth(),now.getDate()-30)), ns=D.c.filter(c=>c.envoye&&!c.signe&&!c.annule&&!c.termine&&c.date&&c.date<lim);
    if(ns.length) G.push({k:'cs',t:'Contrats envoyés, non signés depuis 30 jours',ico:'contrat',go:'fx-contrats',items:ns.map(c=>({t:(c.affaire||'')+' · '+(c.projet||c.nom||''),s:'envoyé le '+dfr(c.date),go:'fx-calchono',arg:'c:'+c.id}))}); }
  if(me){ const mine=DS.by('timelog','STAFF_ID',me.ID), parJour={}; mine.forEach(r=>{ const k=tlKey(r); parJour[k]=(parJour[k]||0)+(+r.TIMEPERIOD||0); });
    const manq=[]; for(let i=1,n=0;n<10&&i<30;i++){ const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-i); if(!d.getDay()||d.getDay()===6) continue; n++; if(!(parJour[dayKey(d)]>0)) manq.push(d); }
    if(manq.length&&mine.length) G.push({k:'hm',t:'Jours sans saisie de temps (10 derniers jours ouvrés)',ico:'timer',go:'h-saisie',n:manq.length+' j.',items:[{t:'Compléter ma feuille de temps',s:manq.map(d=>JOURS[d.getDay()]+' '+dfr(diso(d)).slice(0,5)).join(' · '),fn:'temps'}]}); }
  const tr=DS.all('projecttask').filter(t=>!t.DONEDATE&&t.DEADLINE&&t.DEADLINE<td);
  if(tr.length) G.push({k:'tr',t:'Tâches en retard',ico:'task',go:'taches-encours',items:tr.map(t=>{ const p=DS.get('project',t.PROJECT_ID); return {t:t.SUBJECT||'(sans objet)',s:(p?p.NUMBER+' · ':'')+'échéance '+dfr(t.DEADLINE),ref:p?'p:'+p.ID:null}; })});
  if(D){ const taux=sgTaux(), al=DS.all('project').filter(p=>+p.PROJECTSTATECODE===2&&!sgInterne(p)).map(p=>sgRenta(p,D,taux)).filter(x=>x.niv>=2).sort((a,b)=>b.niv-a.niv);
    if(al.length) G.push({k:'re',t:'Projets en alerte de rentabilité',ico:'coins',go:'nx-renta',items:al.map(x=>({t:x.p.NUMBER+' · '+(x.p.TITLE||''),s:x.al.map(a=>a[1]).join(' · '),ref:'p:'+x.p.ID}))});
    const r=sgCarnetReste(sgCarnetOriginal()), hs=sgHeuresAReprendre().filter(x=>x.ok).length;
    if(r.ent.length||hs) G.push({k:'rg',t:'Registres en double à réunir',ico:'group',go:'nx-reunir',items:[{t:r.ent.length+' adresse(s) du carnet, '+hs+' saisie(s) de temps de Facturation',s:'Réglages ▸ Réunir les registres'}]}); }
  if(sgFinVerrou()) for(let i=G.length-1;i>=0;i--) if(/^(fe|cs|re)$/.test(G[i].k)) G.splice(i,1);
  SG_AT={n:G.reduce((s,g)=>s+(/^(fe|cs|tr)$/.test(g.k)?g.items.length:1),0),groupes:G}; sgSide(); return SG_AT; }
const sgSide0=sgSide; sgSide=function(){ sgSide0(); const a=document.querySelector('#nx-nav [data-go="nx-home"] .lb'); if(a&&SG_AT.n) a.insertAdjacentHTML('beforeend',' <i class="sg-badge">'+SG_AT.n+'</i>'); };
function sgATraiterHtml(A){ if(!A.groupes.length) return nxCard('c12','À traiter aujourd’hui','<div class="nx-empty">Rien d’urgent : factures, contrats, heures, tâches, rentabilité et sauvegarde sont à jour.</div>');
  return nxCard('c12','À traiter aujourd’hui','<div class="b flush sg-at">'+A.groupes.map(g=>'<div class="sg-at-g"><div class="sg-at-t" data-go="'+g.go+'">'+nxSvg(g.ico)+'<b>'+nxE(g.t)+'</b><span class="nx-tag '+(g.k==='fe'||g.k==='re'||g.k==='sv'?'urg':'s3')+'">'+(g.n||g.items.length)+'</span></div>'
    +g.items.slice(0,4).map(x=>'<div class="nx-row" '+(x.go?'data-go="'+x.go+'" data-arg="'+nxE(x.arg||'')+'"':x.ref?'data-ref="'+x.ref+'"':x.fn?'data-fn="'+x.fn+'"':'data-go="'+g.go+'"')+'><div class="t"><b>'+nxE(x.t)+'</b><span>'+nxE(x.s||'')+'</span></div></div>').join('')
    +(g.items.length>4?'<div class="nx-row" data-go="'+g.go+'"><div class="t"><span>… et '+(g.items.length-4)+' autre(s)</span></div></div>':'')+'</div>').join('')+'</div>','<span class="n">'+A.n+'</span>'); }
{ const r0=VIEWS['nx-home'].render; VIEWS['nx-home'].render=function(m){ r0.call(this,m); const pg=m.querySelector('.nx-page'), right=pg&&pg.querySelector('.sg-split>div:last-child'); if(!right) return;
    const at=h('div',{class:'nx-grid',style:{marginBottom:'30px'},html:SG_AT.groupes.length?sgATraiterHtml(SG_AT):'<div class="nx-card c12"><h4>À traiter aujourd’hui</h4><div class="nx-empty">Vérification…</div></div>'}); right.prepend(at);
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
async function sgSha(buf){ const d=await crypto.subtle.digest('SHA-256',buf); return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join(''); }
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
async function sgPdfLib(){ const w=await fxEnsure(); if(!w.PDFLib) throw new Error('Bibliothèque PDF indisponible (connexion internet nécessaire au premier chargement).'); return w; }
async function sgPdfOctets(w,sha){ const b=await sgFichierLire(sha); if(!b){ const x=new Error('Fichier absent de ce navigateur.'); x.status=404; throw x; } return new w.Uint8Array(await b.arrayBuffer()); }
ch03aApi=async function(url,o){ o=o||{}; const u=new URL(url,'http://local'), q=u.searchParams, meth=String(o.method||'GET').toUpperCase(), corps=()=>JSON.parse(String(o.body||'{}'));
  if(u.pathname==='/api/file'&&meth==='POST'&&q.has('nom')){ const b=o.body instanceof Blob?o.body:new Blob([o.body]); return Object.assign({ok:true},await sgFichierRanger(b,q.get('nom'))); }
  if(u.pathname==='/api/file'&&q.has('version')) return {ok:true,supprime:false};
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
function sgVisionneuse(b,nom){ const u=URL.createObjectURL(b), ov=h('div',{class:'sg-visu'});
  const fermer=()=>{ ov.remove(); URL.revokeObjectURL(u); document.removeEventListener('keydown',esc,true); }, esc=e=>{ if(e.key==='Escape'){ e.stopPropagation(); fermer(); } };
  const corps=/^image\//.test(b.type)?h('div',{class:'sg-visu-img'},h('img',{src:u,alt:nom})):/pdf|^text\/|html/.test(b.type)?h('iframe',{src:u,title:nom}):h('div',{class:'nx-empty'},'Aperçu impossible pour ce type de fichier : utilisez « Télécharger ».');
  ov.append(h('div',{class:'sg-visu-bar'},h('b',{},nom),h('span',{style:{flex:1}}),
    h('button',{class:'btn',onclick:()=>{ const a=h('a',{href:u,download:nom}); document.body.append(a); a.click(); a.remove(); }},'Télécharger'),
    corps.tagName==='IFRAME'?h('button',{class:'btn',onclick:()=>{ try{ corps.contentWindow.print(); }catch(_){ toast('Impression : utilisez Télécharger puis imprimez.',true); } }},'Imprimer'):'',
    h('button',{class:'btn pri',onclick:fermer},'Fermer')),corps);
  document.body.append(ov); document.addEventListener('keydown',esc,true); }
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
   Mêmes règles que la Feuille de temps (champs obligatoires de l'affaire, périodes verrouillées, chevauchements). */
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
  {t:'Contrat d’honoraires',fn:()=>go('fx-calchono','new')},{t:'Facture ou acompte',fn:()=>go('fx-saisie','new')},{t:'Dépense',fn:()=>go('frais')}]); };
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
const SG_ACC_DEF={doms:['facturation','finances','reglages'],delai:15};
const sgAcces=()=>Object.assign({},SG_ACC_DEF,nxLS.get('sg3_acces',{}));
const sgAccesSet=o=>{ nxLS.set('sg3_acces',Object.assign(sgAcces(),o)); sgVerrouAff(); };
const sgB64=u=>btoa(String.fromCharCode(...new Uint8Array(u))), sgDe64=t=>Uint8Array.from(atob(t),c=>c.charCodeAt(0));
async function sgHacher(code,sel){ const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(String(code).normalize('NFC')),'PBKDF2',false,['deriveBits']);
  return sgB64(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:sel,iterations:150000},k,256)); }
async function sgCodeOk(code){ const a=sgAcces(); if(!a.hash) return true; return (await sgHacher(code,sgDe64(a.sel)))===a.hash; }
async function sgCodeDefinir(code){ const sel=crypto.getRandomValues(new Uint8Array(16)); sgAccesSet({sel:sgB64(sel),hash:await sgHacher(code,sel),depuis:Date.now()}); sgOuvrir(); }
const sgOuvertTs=()=>{ try{ return +sessionStorage.getItem('sg3_ouvert')||0; }catch(_){ return 0; } };
function sgOuvert(){ const a=sgAcces(); if(!a.hash) return true; const t=sgOuvertTs(); return !!t&&(!+a.delai||Date.now()-t<a.delai*60e3); }
function sgOuvrir(){ try{ sessionStorage.setItem('sg3_ouvert',String(Date.now())); }catch(_){} sgVerrouAff(); }
function sgVerrouiller(){ try{ sessionStorage.removeItem('sg3_ouvert'); }catch(_){} sgVerrouAff(); if(VIEW&&sgProtege(sgDomDe(VIEW.id))) go('nx-home'); else if(VIEW&&/^nx-(home|projet)$/.test(VIEW.id)) go(VIEW.id,VIEW.arg); }
const sgDomDe=v=>{ const x=NX_VIEW[v]; return x&&x.d?(x.d.k||x.d):null; };   // NX_VIEW[v].d = objet du domaine
const sgProtege=d=>!!d&&!!sgAcces().hash&&sgAcces().doms.includes(d);
const sgFinVerrou=()=>!sgOuvert()&&(sgProtege('finances')||sgProtege('facturation'));
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
  m.querySelectorAll('[data-dom]').forEach(c=>c.onchange=async()=>{ if(!(await sgExigerOuvert())){ c.checked=!c.checked; return; } sgAccesSet({doms:[...m.querySelectorAll('[data-dom]:checked')].map(x=>x.dataset.dom)}); toast('Domaines protégés enregistrés.'); });
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
  if(first) for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(sgKvCle(k)&&!(k in d.items)) sgKvPlan(k,0); }   // clés de ce poste absentes du serveur
  SGKV.seq=Math.max(SGKV.seq,d.seq); return ch; }
function sgKvPlan(k,delai){ clearTimeout(SGKV.t[k]); SGKV.t[k]=setTimeout(()=>sgKvEnvoi(k).catch(e=>console.error(e)),delai==null?700:delai); }
async function sgKvEnvoi(k,essai){ SGKV.t[k]=null; let v=localStorage.getItem(k); const sv=SGKV.base[k];
  if(v===sv){ SGKV.fb[k]=v; return; }
  const fb=k in SGKV.fb?SGKV.fb[k]:sv; let fusion=false;
  if(k in SGKV.ver&&fb!==sv){ const m=sgKvFusion(fb,v,sv);   // le cadre travaillait sur une version dépassée
    if(m==null){ SGKV.fb[k]=v; sgKvEcrire(k,sv); sgKvBandeau('Conflit : « '+k.replace(/^sa_/,'')+' » a été modifié en même temps sur un autre poste. Votre dernière modification n’a pas été enregistrée : actualisez puis refaites-la.',true); return; }
    fusion=m!==v; SGKV.fb[k]=v; v=m; }
  const r=await fetch('/api/kv',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({k,v,base:k in SGKV.ver?SGKV.ver[k]:null,who:DS.who()})}), d=await r.json().catch(()=>({}));
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
  if(!dsEstBureau()) return; SGKV.on=true; await sgKvReleve(true); setInterval(sgKvTic,5000); })();
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

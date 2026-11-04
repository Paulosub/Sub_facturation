/* ═══ AFFAIRE DE TRAVAIL 99TST — MODULE 99 : CONTRÔLE DE CONCORDANCE (04.11.2026) ═══
   Exécuté en dernier : relit dans la page tout ce que les modules ont écrit et contrôle les concordances du rapport 9 § 4 (identité, factures, heures, budgets, recopie
   moteur, lots du contrôle des coûts, permis et jalons, commission). Ne crée ni ne modifie rien. Reprend 9_verif_affaire.js, essayé avec un jeu volontairement incohérent ; deux corrections : compte courant (vrai collaborateur) contrôlé sur ses années d'heures de l'affaire, jalons du planning comparés au permis principal (N = 1).
   Ajoute à ctx :
   ctx.verif  {n, erreurs:[…], infos:[…]} (aussi dans le journal). Un écart ne fait pas échouer la génération : à lire dans R.ok / ctx.verif, ou par await AT.verifAffaire('99TST'). */
(function(){
const A=window.AT;
A.verifAffaire=async function(N){
  await DS.need(['costcontrol','costestimate','costplanning','sgdocphase','sgplanning','sgplanningarch','sgpermis','sgavancement','sgapport','sgcontrattravail']).catch(()=>{});
  const w=await fxEnsure(), D=fxData(), E=[], I=[], err=m=>{ if(E.length<300) E.push(m); }, ok=(c,m)=>{ if(!c) err(m); }, proche=(a,b,t)=>Math.abs((+a||0)-(+b||0))<=(t==null?0.51:t);
  const p=DS.all('project').find(x=>x.NUMBER===N); if(!p) return {n:1,erreurs:['Affaire '+N+' absente'],infos:[]};
  const pid=p.ID, iso=/^\d{4}-\d{2}-\d{2}$/, auj=today(), ent=(t,r,ch)=>ch.forEach(k=>{ if(r[k]!=null&&!Number.isInteger(r[k])) err(t+' '+r.ID+' : '+k+' n’est pas un entier'); });
  /* A. identité */
  const titre=String(p.TITLE||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
  ok(typeof pid==='number','project.ID non numérique'); ok(!/\bexpert|faisabilit/.test(titre),'project.TITLE contient expert… ou faisabilité : groupes Projet et Enquête perdus'); ok(+p.PROJECTSTATECODE===2,'PROJECTSTATECODE ≠ 2 : tâches et saisie masquées');
  ok(!!p.LOCATION,'project.LOCATION vide'); ok(p.CONTACT1_ID!=null,'project.CONTACT1_ID vide'); ok(/^\d{2}[A-Za-z][A-Za-z0-9]*$/.test(N),'code d’affaire : 2 chiffres puis une lettre (numAff)');
  const cs=sgContratsDuProjet(p,D), csV=cs.filter(c=>!c.annule), fs=D.f.filter(f=>(cs.some(c=>c.id===f.contrat_id))||String(f.cl_affaire||'')===N||String(f.num||'').includes('_'+N+'.'));
  ok(cs.length>0,'aucun contrat relié'); cs.forEach(c=>{ ok(c.affaire===N,'contrat '+c.id+' : affaire ≠ '+N); ok(iso.test(c.date||''),'contrat '+c.id+' : date'); ok(!!(c.detail&&c.detail.inputs&&c.detail.conditions),'contrat '+c.id+' : detail incomplet (PDF faux)'); ok(+c.rabais===0||c.annule,'contrat '+c.id+' : rabais ≠ 0 (appliqué deux fois par la facture)'); });
  ok(new Set(fs.map(f=>f.id)).size===fs.length,'deux factures de l’affaire ont le même id');
  fs.forEach(f=>{ const m=/^FA(\d\d)\.\d\d_([0-9A-Za-z]+)\.(AC\d\d|FF?|NFF?\d*)$/.exec(f.num||''); ok(!!m,'facture '+f.num+' : numéro'); if(m){ ok(m[2]===N,'facture '+f.num+' : code'); ok(m[1]===String(f.date||'').slice(2,4),'facture '+f.num+' : année ≠ date'); }
    ok(iso.test(f.date||''),'facture '+f.num+' : date'); if(!/annul/i.test(f.statut||'')&&f.ech&&f.ech_j){ const d=new Date(f.date+'T00:00'); d.setDate(d.getDate()+ +f.ech_j); ok(diso(d)===f.ech,'facture '+f.num+' : échéance ≠ date + délai'); }
    if(/note de frais/i.test(f.type||'')) ok(!(+f._ttc||+f.ttc),'facture '+f.num+' : note de frais avec honoraires (_ttc / ttc ≠ 0)'); else if(+f.ttc&&!+f._ttc) err('facture '+f.num+' : _ttc = 0 et ttc ≠ 0 : sgRenta et le cockpit liraient le cumul'); });
  const pv=w.eval('pvData')[N]; ok(!!pv,'PV de chantier : clé '+N+' absente de sa_pv_data'); if(pv) pv.pvs.forEach((x,i)=>{ if(i) ok(x.date>=pv.pvs[i-1].date,'PV '+x.num+' : ordre chronologique'); ok(iso.test(x.date),'PV '+x.num+' : date'); if(x.statut==='definitif') ok(!w.eval('pvMarques')(x).length,'PV '+x.num+' définitif avec marques'); });
  /* B. phases, heures */
  const ph=DS.by('projectphase','PROJECT_ID',pid), sub=ph.flatMap(f=>DS.by('projectsubphase','PROJECTPHASE_ID',f.ID)), subOf=new Map(sub.map(s=>[s.ID,s])), phOf=new Map(ph.map(f=>[f.ID,f]));
  const grp=DS.by('projectactivitygroup','PROJECT_ID',pid), act=new Map(grp.flatMap(g=>DS.by('projectactivity','PROJECTACTIVITYGROUP_ID',g.ID)).map(a=>[a.ID,a]));
  ph.forEach(f=>{ const L=sub.filter(s=>s.PROJECTPHASE_ID===f.ID); if(L.length) ok(proche(f.TIMEBUDGET,L.reduce((a,s)=>a+(+s.TIMEBUDGET||0),0)),'phase '+f.NUMBER+' : TIMEBUDGET ≠ somme des sous-phases'); });
  const T=DS.by('timelog','PROJECT_ID',pid), staffs=new Set(), jour={};
  T.forEach(r=>{ ent('timelog',r,['STAFF_ID','PROJECT_ID','PHASE_ID','SUBPHASE_ID','ACTIVITY_ID','ACTIVITYGROUP_ID','TIMEMONTH']); const s=DS.get('staff',r.STAFF_ID), d=tlDate(r), k=diso(d); staffs.add(r.STAFF_ID);
    ok(!!s,'timelog '+r.ID+' : collaborateur absent'); ok(k<=auj,'timelog '+r.ID+' : date future'); ok(d.getDay()!==0&&d.getDay()!==6,'timelog '+r.ID+' : week-end'); ok(proche(r.TIMEPERIOD,((r.TIMEHOUR2*60+r.TIMEMINUTE2)-(r.TIMEHOUR1*60+r.TIMEMINUTE1))/60,0.001),'timelog '+r.ID+' : TIMEPERIOD ≠ fin − début');
    if(s){ ok(!s.JOININGDATE||k>=s.JOININGDATE,'timelog '+r.ID+' : avant l’entrée'); ok(!s.QUITTINGDATE||k<=s.QUITTINGDATE,'timelog '+r.ID+' : après le départ'); }
    ok(phOf.has(r.PHASE_ID),'timelog '+r.ID+' : phase hors affaire'); if(r.SUBPHASE_ID!=null) ok(subOf.has(r.SUBPHASE_ID)&&subOf.get(r.SUBPHASE_ID).PROJECTPHASE_ID===r.PHASE_ID,'timelog '+r.ID+' : sous-phase ≠ phase'); ok(act.has(r.ACTIVITY_ID),'timelog '+r.ID+' : activité hors affaire');
    (jour[r.STAFF_ID+'|'+k]=jour[r.STAFF_ID+'|'+k]||[]).push([r.TIMEHOUR1*60+r.TIMEMINUTE1,r.TIMEHOUR2*60+r.TIMEMINUTE2,r.ID]); });
  Object.values(jour).forEach(L=>{ L.sort((a,b)=>a[0]-b[0]); L.forEach((x,i)=>{ if(i&&x[0]<L[i-1][1]) err('timelog '+x[2]+' : chevauchement'); }); });
  const eq=DS.by('projectmember','PROJECT_ID',pid); ok(eq.some(m=>m.TEAMROLECODE===8),'pas d’intervenant rôle 8'); staffs.forEach(id=>{ const s=DS.get('staff',id); if(!s) return; ok(eq.some(m=>m.TEAMROLECODE===12&&m.RESPCONTACT_ID===s.PERSON_ID),'collaborateur '+s.INITIALS+' : pas de rôle 12');
    /* compte courant : vrai collaborateur de la base, l'affaire ne touche pas à ses années passées ; contrôle limité aux années où il a des heures sur l'affaire */
    const moi=A.ctx&&A.ctx.staff&&A.ctx.staff.me&&A.ctx.staff.me.id===id, sesH=T.filter(r=>r.STAFF_ID===id), y1=sesH.reduce((a,r)=>Math.min(a,+r.TIMEYEAR),9999);
    const y0=moi?y1:+String(s.JOININGDATE||'').slice(0,4); for(let y=y0;y&&y<=new Date().getFullYear();y++) if(!s.QUITTINGDATE||y<=+s.QUITTINGDATE.slice(0,4)) ok(DS.by('stafftargettime','STAFF_ID',id).some(x=>x.TARGETTIMEYEAR===y),'collaborateur '+s.INITIALS+' : stafftargettime '+y+' manquant');
    const R=DS.by('staffrate','STAFF_ID',id).map(x=>x.VALIDFROM).sort()[0]; const debut=moi?sesH.map(r=>diso(tlDate(r))).sort()[0]:s.JOININGDATE; ok(!!R&&(!debut||R<=debut),'collaborateur '+s.INITIALS+' : premier staffrate après '+(moi?'sa première heure sur l’affaire':'l’entrée')); });
  ok(proche(grp.reduce((a,g)=>a+(+g.TIMEBUDGET||0),0),ph.reduce((a,f)=>a+(+f.TIMEBUDGET||0),0),1),'Σ TIMEBUDGET des groupes d’activités ≠ Σ des phases (Clients, Temps de l’équipe)');
  /* C. contrat ↔ phases */
  const M=csV.filter(c=>Object.values(c.phases||{}).some(v=>+v>0)).sort((a,b)=>(+b.hht||0)-(+a.hht||0))[0];
  if(M){ const K=M.phases, totC=Object.values(K).reduce((a,v)=>a+(+v||0),0), tar=(parseFloat((M.detail.inputs||{}).ch_h)||135)*(1-(+M.rabais||0)/100);
    sub.filter(s=>[31,32,33,41,51,52,53].includes(+s.NUMBER)).forEach(s=>{ const cP=Object.entries(K).filter(([k])=>k.slice(1,3)===String(s.NUMBER)).reduce((a,[,v])=>a+(+v||0),0), hon=M.hht*cP/totC; if(cP){ ok(proche(s.TIMEBUDGET,hon/tar,2),'sous-phase '+s.NUMBER+' : TIMEBUDGET ≠ honoraires ÷ tarif ('+Math.round(hon/tar)+' h)'); ok(proche(s.TIMEAMOUNTBUDGET,hon,50),'sous-phase '+s.NUMBER+' : TIMEAMOUNTBUDGET ≠ honoraires'); } });
    const av=DS.by('sgavancement','PROJECT_ID',pid).sort((a,b)=>cmp(b.DATE,a.DATE))[0], fM=fs.filter(f=>f.contrat_id===M.id&&!/annul/i.test(f.statut||'')&&!/note de frais/i.test(f.type||'')).sort((a,b)=>cmp(b.date,a.date))[0];
    if(fM) Object.entries(fM.phases||{}).forEach(([k,v])=>ok(+v<=(+K[k]||0)+1e-6,'facture '+fM.num+' : '+k+' au-delà du contrat'));
    if(av&&fM) [31,32,33,41,51,52,53].forEach(n=>{ const ks=Object.keys(K).filter(k=>k.slice(1,3)===String(n)), cP=ks.reduce((a,k)=>a+(+K[k]||0),0), fP=ks.reduce((a,k)=>a+(+(fM.phases||{})[k]||0),0); if(cP&&fP/cP*100>(+av.EFF[n]||0)+1) err('phase '+n+' : facturé '+Math.round(fP/cP*100)+' % > avancement '+(+av.EFF[n]||0)+' % au '+av.DATE); }); }
  DS.by('sgavancement','PROJECT_ID',pid).forEach(a=>{ const r=DS.get('projectimplementation',a.IMPL_ID); ok(!!r&&r.IMPLEMENTATIONDATE===a.DATE,'sgavancement '+a.DATE+' : ligne projectimplementation'); });
  /* D. Facturation ↔ tables du moteur (Management) */
  const PC=DS.by('projectcontract','PROJECT_ID',pid), PI=DS.by('projectinvoice','PROJECT_ID',pid), ST={'Payée':3,'Envoyée':1,'Impayée':2,'En attente':0};
  if(!PC.length) I.push('projectcontract vide : Finances ▸ Contrats des projets sans cette affaire'); if(!PI.length) I.push('projectinvoice vide : Facturation des projets et Suivi des factures sans cette affaire');
  if(PC.length) csV.filter(c=>c.signe||c.termine).forEach(c=>ok(PC.some(x=>proche(x.CONTRACTAMOUNT,(+c.httc||0)*(1+(+c.frais||0)/100),1)),'contrat '+c.id+' : aucun projectcontract de ce montant'));
  if(PI.length) fs.filter(f=>!/annul/i.test(f.statut||'')).forEach(f=>{ const x=PI.find(y=>y.NUMBER===f.num); ok(!!x,'facture '+f.num+' : pas de projectinvoice'); if(x){ ok(proche(x.AMOUNT,(+f._ttc||0)+(+f._fttc||0),0.06),'facture '+f.num+' : AMOUNT ≠ _ttc + _fttc'); ok(x.INVOICEDATE===f.date,'facture '+f.num+' : INVOICEDATE'); ok(+x.PROJECTINVOICESTATECODE===ST[f.statut],'facture '+f.num+' : statut'); ok((x.PAYMENTDATE||'')===(f.date_paiement||''),'facture '+f.num+' : PAYMENTDATE'); } });
  /* E. coûts */
  const docs=DS.by('costcontroldocument','PROJECT_ID',pid).filter(d=>!+d.ISMARKEDASDELETED), dv=DS.by('costestimatedocument','PROJECT_ID',pid).filter(d=>+d.STATECODE===2&&!+d.ISMARKEDASDELETED);
  docs.forEach(d=>{ const C=DS.get('costcontrol',d.ID); ok(!!C,'costcontrol '+d.ID+' absent (même ID que le document)'); if(!C) return; const pos=new Set((C.positions||[]).map(x=>String(x.cfc))), en=new Set((C.entreprises||[]).map(x=>x.contactId));
    (C.contrats||[]).forEach(k=>{ ok(pos.has(String(k.lot&&k.lot.numero)),'contrat '+k.numero+' : lot '+(k.lot&&k.lot.numero)+' hors des positions'); ok(en.has(k.contactId),'contrat '+k.numero+' : entreprise absente de C.entreprises'); ok(!!DS.get('contact',k.contactId),'contrat '+k.numero+' : contactId n’est pas un contact'); });
    new Set((C.contrats||[]).map(k=>k.id)).size===(C.contrats||[]).length||err('contrôle des coûts : id de contrat en double');
    const E0=dv[0]&&DS.get('costestimate',dv[0].ID); if(E0&&!docs.some(x=>+x.STATECODE===2&&x.ID===d.ID)) ok(proche((C.positions||[]).reduce((a,x)=>a+(+x.dgTTC||0),0),dvCompute(E0).T.ttc,1),'contrôle des coûts : Σ dgTTC ≠ total du devis validé');
    DS.by('devisdocument','PROJECT_ID',pid).filter(x=>!+x.ISMARKEDASDELETED).forEach(x=>ok(pos.has(String(x.BKP)),'soumission CFC '+x.BKP+' absente des positions')); });
  /* F. permis ↔ planning */
  const per=DS.all('sgpermis').filter(x=>x.PROJECT_ID===pid), plan=DS.get('sgplanning',pid+':projet'), L=plan?plan.LIGNES:[], jal=re=>(L.find(x=>x.t==='jalon'&&re.test(x.lib))||{}).d;
  if(per.length&&plan){ const D0=per.slice().sort((a,b)=>a.N-b.N)[0].DATES||{}; /* les jalons suivent le permis principal (N = 1), pas la demande complémentaire */ ok(!jal(/^Dépôt/)||jal(/^Dépôt/)===D0.depot,'jalon Dépôt ≠ permis'); ok(!jal(/^Permis de construire/)||jal(/^Permis de construire/)===D0.decision,'jalon Permis ≠ décision'); per.forEach(x=>{ const d=x.DATES||{}; ok(!d.decision||!!d.recours,'permis '+x.N+' : DATES.recours manquant (« délai échu ? »)'); }); }
  /* G. apports */
  DS.all('sgapport').filter(a=>a.PROJECT_ID===pid&&a.TYPE==='apport').forEach(a=>{ ok(!!DS.get('staff',a.STAFF_ID),'apport : STAFF_ID n’est pas un collaborateur'); const C=sgCommCond(a.STAFF_ID,a.DATE); ok(C.actif,'apport : contrat de travail sans COMMISSION:1 → 0 %'); });
  return {n:E.length,erreurs:E,infos:I}; };

A.mod(99,'controle_final','Contrôle de concordance',async ctx=>{
  ctx.verif=await A.verifAffaire(A.REF.code);
  A.log('contrôle : '+ctx.verif.n+' écart(s)'+(ctx.verif.infos.length?', '+ctx.verif.infos.length+' remarque(s)':''));
  ctx.verif.erreurs.slice(0,40).forEach(e=>A.log('  écart : '+e)); ctx.verif.infos.forEach(e=>A.log('  remarque : '+e)); });
})();

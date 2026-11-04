/* ═══ AFFAIRE DE TRAVAIL 99TST — MODULE 80 : TABLES DU MOTEUR, FINANCES ET PLANIFICATION RH (04.11.2026) ═══
   Management lit ses propres tables, sans aucun lien avec Facturation (rapport 9 § 0). Ce module y recopie ce que les modules 30, 50 et 70 ont RÉELLEMENT créé :
   montants, dates et états sont relus dans sa_contrats et sa_factures5, jamais recalculés. Tout passe par AT.commit, la purge est celle du registre.

   Finances (§ 3.1 T1) :
   - projectcontract avec son calcul de base (projectfeecalculation + 2 projectfeecalculationamount, honoraires et frais) : faisabilité et mandat Validés, le mandat au montant
     de sa dernière version, expertise En traitement (envoyée, non signée, non facturable). La variante annulée n'est PAS recopiée, comme une facture annulée :
     Avancement additionne les contrats de tous statuts, 150 000 de plus y fausseraient les pourcentages d'encaissement ;
   - contrat de sous-traitant de l'ingénieur civil (§ 3.1) : honoraires = ch_ing du mandat, sans calcul, notes d'honoraires aux dates et montants du module 47 (règle recopiée, le module 47 peut être absent) ;
   - projectinvoice et ses positions (position HT, frais, sous-total, TVA, total : invCheck rend AMOUNT au centime), une par facture de REF.factures, même la facture hors contrat, plus la facture finale planifiée du solde du mandat (état Planifiée, sans numéro) ;
   - projectpayment pour chaque facture payée sur contrat (AMOUNTPAID sur la facture : les deux sont lus), projectscheduledpayment pour chaque facture émise, plus le solde à venir du mandat et de l'ingénieur civil : Σ échéances = montant du contrat.
   Planification RH (§ 3.2 T2) :
   - planningcostfactor si la base n'en a aucun (table globale), une planification par affaire, 5 catégories d'honoraires ;
   - staffprojecttime de tous les collaborateurs fictifs et du compte courant, de l'année du début de l'affaire à l'an prochain : heures dues − vacances réelles de la feuille d'heures
     (mois futurs : douzième du droit annuel), cours de l'apprenti, quelques absences, travail interne ;
   - planningmonth par phase partielle et par mois du calendrier (phase 53 prolongée de 2 mois) : Σ CONTRACTAMOUNT = honoraires HT, encaissements planifiés et reçus au mois de la facture et du paiement,
     taux de réalisation d'après les heures saisies ; planningtime (Σ parts = 100 %) ; planningassignment par REF.repartition jusqu'au mois prochain : le dernier mois reste à attribuer, exprès.

   Ajoute à ctx :
   ctx.moteur  {contrats:{faisa, mandat, expertise, ing} = projectcontract.ID, factures:{'<numéro>':projectinvoice.ID}, planification:planningsubproject.ID, roles:{'<nom>':planningrole.ID}} */
(function(){
const A=window.AT;
const FRAIS_INTERNES=25;   /* % de frais internes du bureau, facteur de la planification */
const MOIS_FUTURS=2;       /* mois planifiés après le mois en cours (les domaines de Planification RH montrent 4 mois depuis le mois de référence) */
/* catégories d'honoraires ; st = clés de REF.equipe, me = compte courant */
const ROLES=[{nom:'Direction de projet',st:['cdp','me']},{nom:'Architecte',st:['arch','anc']},{nom:'Direction des travaux',st:['dt']},{nom:'Technicien',st:['tech']},{nom:'Dessin',st:['dess','appr']}];
const INTERNE={cdp:.12,arch:.10,dess:.10,dt:.08,tech:.10,appr:.05,anc:.10,me:.35};   /* part du temps en travail interne : séances de bureau, administration */
const ABSENCES=[{cle:'dt',mois:'2024-02',champ:'EDUCATION',h:17,rem:'Formation continue : gestion des délais de chantier'},
  {cle:'tech',mois:'2024-05',champ:'OFFICIALABSENCE',h:85,rem:'Cours de répétition, deux semaines'},
  {cle:'dess',mois:'2025-09',champ:'OTHERABSENCE',h:34,rem:'Absence pour maladie'},
  {cle:'arch',mois:'2025-11',champ:'EDUCATION',h:17,rem:'Formation continue : normes SIA 180 et 181'},
  {cle:'cdp',mois:'2026-01',champ:'EDUCATION',h:8.5,rem:'Formation continue : droit de la construction'}];

const repartir=(tot,poids)=>{ const s=poids.reduce((a,b)=>a+b,0)||1, ex=poids.map(p=>tot*p/s), L=ex.map(Math.floor); let r=Math.round(tot-L.reduce((a,b)=>a+b,0));
  ex.map((v,i)=>[v-L[i],i]).sort((a,b)=>b[0]-a[0]).slice(0,r).forEach(([,i])=>L[i]++); return L; };
const som=o=>Object.values(o).reduce((a,v)=>a+(+v||0),0);
const fr=iso=>iso.split('-').reverse().join('.');
const nb=v=>String(A.arr(+v)).replace('.',',');
const minus=t=>t.charAt(0).toLowerCase()+t.slice(1);
const quart=v=>Math.round(v*4)/4;
const mois=iso=>plKey(+iso.slice(0,4),+iso.slice(5,7)-1);
/* phases partielles facturées par une facture : Δ des % cumulés, par numéro de phase partielle */
const facture=(ph,prec)=>{ const D={}; Object.entries(ph).forEach(([k,v])=>{ const d=(+v||0)-(+prec[k]||0); if(Math.abs(d)>1e-9){ const n=+k.slice(1,3); D[n]=A.arr((D[n]||0)+d); } }); return D; };
const dominante=D=>{ const L=Object.entries(D).sort((a,b)=>b[1]-a[1]); return L.length?+L[0][0]:null; };

/* filet : génération interrompue entre deux écritures. Le registre est sauvé après chaque lot, ce filet ne sert qu'en cas d'arrêt pendant un lot ; avant celui du module 20, qui retire l'affaire */
A.purgeurs.unshift(async()=>{ const p=DS.all('project').find(x=>x.NUMBER===A.REF.code); if(!p) return; const sup=[], del=(t,r)=>sup.push({t,id:r.ID,val:null});
  DS.by('planningsubproject','PROJECT_ID',p.ID).forEach(s=>{ DS.by('planningrole','PLANNINGSUBPROJECT_ID',s.ID).forEach(r=>del('planningrole',r)); del('planningsubproject',s); });
  DS.by('planningmonth','PROJECT_ID',p.ID).forEach(m=>{ DS.by('planningtime','PLANNINGMONTH_ID',m.ID).forEach(t=>{ DS.by('planningassignment','PLANNINGTIME_ID',t.ID).forEach(a=>del('planningassignment',a)); del('planningtime',t); }); del('planningmonth',m); });
  DS.by('projectinvoice','PROJECT_ID',p.ID).forEach(f=>{ DS.by('projectinvoicepos','PROJECTINVOICE_ID',f.ID).forEach(x=>del('projectinvoicepos',x)); del('projectinvoice',f); });
  DS.by('projectcontract','PROJECT_ID',p.ID).forEach(c=>{ ['projectscheduledpayment','projectpayment'].forEach(t=>DS.by(t,'PROJECTCONTRACT_ID',c.ID).forEach(x=>del(t,x)));
    const f=DS.get('projectfeecalculation',c.PROJECTFEECALCULATION_ID); if(f){ [f.TIMECALCULATIONAMOUNT_ID,f.COSTCALCULATIONAMOUNT_ID].forEach(id=>{ if(DS.get('projectfeecalculationamount',id)) sup.push({t:'projectfeecalculationamount',id,val:null}); }); del('projectfeecalculation',f); }
    del('projectcontract',c); });
  if(sup.length){ A.log('purge : tables du moteur hors registre retirées,',sup.length,'enregistrements'); await DS.commit(sup); } });

/* ── contrats : calcul de base + contrat, recette du § 3.1 ; ne pas confondre SUPPLIERCONTACT (mandataire = le bureau) et CONTACT (mandant = le maître de l'ouvrage) ── */
function recopierContrats(ctx,D){ const R=A.REF, K=R.contrats, ops=[], res={};
  const heures={faisa:R.faisabilite.h,mandat:R.phases.reduce((a,x)=>a+x.h,0),expertise:K.expertise.lignes.reduce((a,l)=>a+l.heures,0)};
  [['faisa',1,1],['mandat',1,1],['expertise',0,0]].forEach(([cle,etat,facturable],i)=>{ const c=D.c.find(x=>x.id===ctx.contrats[cle]); if(!c) throw new Error('contrat Facturation '+cle+' absent');
    const [ta,ca]=A.ids('projectfeecalculationamount',2), [fc]=A.ids('projectfeecalculation'), [ct]=A.ids('projectcontract'), hF=A.arr(c.hht*c.frais/100), tF=A.arr(c.httc*c.frais/100), H=heures[cle], total=A.arr(c.httc+tF);
    const am=(id,ht,ttc)=>({t:'projectfeecalculationamount',id,val:{ID:id,AMOUNT1:ht,SALESDISCOUNT:0,CASHDISCOUNT:0,ROUNDING:0,ISMERCANTILEROUNDING:0,VATRATE:c.tva,AMOUNT2:ttc}});
    ops.push(am(ta,c.hht,c.httc),am(ca,hF,tF),
      {t:'projectfeecalculation',id:fc,val:{ID:fc,CALCULATIONDETAILS:null,CHANGEDDATE:c.date,NAME:null,NUMBER:null,REMARK:null,TITLE:null,VERSION:null,PROJECTFEE_ID:null,TIMEHOUR:H,
        TIMEAMOUNTPART1:0,TIMEAMOUNTPART2:0,TIMEAMOUNTPART3:0,TIMEHOURPART1:0,TIMEHOURPART2:0,TIMEHOURPART3:0,TIMECALCULATIONAMOUNT_ID:ta,COSTCALCULATIONAMOUNT_ID:ca}},
      {t:'projectcontract',id:ct,val:{ID:ct,PROJECT_ID:ctx.pid,NUMBER:String(i+1),NAME:sgContratEtendue(c).lib,CONTRACTDATE:c.date,SORTORDER:i+1,SUPPLIERDESC:'Prestations de l’architecte',ISSUBCONTRACT:0,USERID:ctx.me.user,STATECODE:etat,
        REMARK:sgContratInfo(c).com||null,CONTRACTFOLDER:null,TIMEAMOUNT1:c.hht,TIMEAMOUNT2:c.httc,TIMEHOUR:H,COSTAMOUNT1:hF,COSTAMOUNT2:tF,CONTRACTAMOUNT:total,ISINVOICEABLE:facturable,
        CONTACT_ID:ctx.mo.contact,SUPPLIERCONTACT_ID:ctx.bureau.contact,SUBPROJECT_ID:null,PROJECTFEECALCULATION_ID:fc}});
    res[cle]={id:ct,c,total}; });
  return {ops,res}; }

/* ── positions d'une facture : le total doit rendre AMOUNT au centime (invCheck) ; la TVA est arrondie, certains totaux sont donc inatteignables : d'abord ±1 ou 2 centimes sur le HT, sinon ligne d'arrondi ── */
function positions(iv,r,f,inc){ const R=A.REF, t=+f.tva, ht=v=>A.arr(v/(1+t/100)), hon=+f._ttc||0, fra=+f._fttc||0, cible=A.arr(hon+fra);
  const src=r.sansContrat?r.lignes:r.contrat==='faisa'?R.contrats.faisa.lignes:null, lib=n=>R.phases.find(x=>x.n===+n).lib;
  const base=src?src.map(l=>({NAME:l.lbl,QUANTITY:l.heures,UNIT:l.hUnit||'h',PRICE:l.prix}))
    :r.noteFrais?[{NAME:'Frais facturés, '+minus(r.type),QUANTITY:1,UNIT:null,PRICE:ht(fra)}]
    :[{NAME:'Honoraires, '+Object.entries(inc).map(([n,v])=>lib(n)+' : '+nb(v)+' % du mandat').join(' ; '),QUANTITY:1,UNIT:null,PRICE:ht(hon)},
      ...(fra?[{NAME:fra>0?'Frais accessoires, '+nb(f.frais)+' % des honoraires':'Frais accessoires : notes de frais déjà facturées, déduites',QUANTITY:1,UNIT:null,PRICE:ht(fra)}]:[])];
  const queue=[{TYPECODE:2,NAME:'Total HT',QUANTITY:0,UNIT:null,PRICE:0},{TYPECODE:4,NAME:'TVA',QUANTITY:0,UNIT:null,PRICE:t},{TYPECODE:6,NAME:'Total TTC',QUANTITY:0,UNIT:null,PRICE:0}];
  const faire=(d,arr)=>{ const P=[...base.map((p,i)=>({TYPECODE:1,...p,PRICE:i?p.PRICE:A.arr(p.PRICE+d)})),...queue.map(q=>({...q}))]; if(arr) P.splice(P.length-1,0,{TYPECODE:1,NAME:'Arrondi',QUANTITY:1,UNIT:null,PRICE:arr}); P.forEach((p,i)=>{ p.SORTORDER=i+1; }); return P; };
  let P=faire(0), T=invCalc(P,false,false);
  if(!src) for(const d of [.01,-.01,.02,-.02]){ if(ivSame(T.total,cible)) break; P=faire(d); T=invCalc(P,false,false); }
  if(!ivSame(T.total,cible)){ P=faire(0,dpRound(cible-invCalc(faire(0),false,false).total)); T=invCalc(P,false,false); }
  T.amounts.forEach((a,i)=>{ P[i].AMOUNT=a; });
  if(!ivSame(invCheck(P,false),cible)) throw new Error('facture '+r.num+' : positions '+invCheck(P,false)+' ≠ '+cible);
  const ids=A.ids('projectinvoicepos',P.length);
  return P.map((p,i)=>({t:'projectinvoicepos',id:ids[i],val:{ID:ids[i],ISVISIBLE:1,PROJECTINVOICE_ID:iv,...p}})); }

/* ── factures : statut, montants et dates tels que Facturation les a enregistrés ── */
function recopierFactures(ctx,D,ctr){ const R=A.REF, ST={'En attente':0,'Envoyée':1,'Impayée':2,'Payée':3}, ops=[], emis=[], ids={}, rang={}, nPaye={}; let prec={};
  const ech=(ct,o)=>{ const n=rang[ct]=(rang[ct]||0)+1, [id]=A.ids('projectscheduledpayment'); ops.push({t:'projectscheduledpayment',id,val:{ID:id,NAME:o.NAME,INVOICEDATE:o.d,DUEDATE:o.ech,PAYMENTDATE:null,AMOUNT:o.m,REMARK:o.rem||null,SORTORDER:n,PROJECTCONTRACT_ID:ct,PHASE_ID:o.ph??null,SUBPHASE_ID:o.sub??null}}); };
  for(const r of R.factures){ const f=D.f.find(x=>x.id===ctx.factures[r.num]); if(!f) throw new Error('facture Facturation '+r.num+' absente'); if(!(f.statut in ST)) throw new Error('facture '+r.num+' : statut « '+f.statut+' » inconnu');
    const c=r.contrat?ctr[r.contrat]:null, m=A.arr((+f._ttc||0)+(+f._fttc||0)), paye=f.statut==='Payée', inc=r.phases?facture(r.phases,prec):{}, n=dominante(inc); if(r.phases) prec=r.phases;
    const [iv]=A.ids('projectinvoice'), pay=paye&&c?A.ids('projectpayment')[0]:null; ids[r.num]=iv;
    ops.push({t:'projectinvoice',id:iv,val:{ID:iv,PROJECT_ID:ctx.pid,CONTACT_ID:ctx.mo.contact,NUMBER:f.num,NAME:f.type,INVOICEDATE:f.date,DUEDATE:f.ech,PROJECTINVOICESTATECODE:ST[f.statut],AMOUNT:m,AMOUNTPAID:paye?m:0,PAYMENTDATE:paye?f.date_paiement:null,
      DUNNINGLEVEL:ST[f.statut]===2?1:0,PROJECTCONTRACT_ID:c?c.id:null,PROJECTPAYMENT_ID:pay,TERMSOFPAYMENT:null,ACCOUNTINGPERIOD:null,NOTE:null,TEMPLATEPROPERTIES:null,QRBILL_ID:null}},...positions(iv,r,f,inc));
    if(c){ ech(c.id,{NAME:f.type,d:f.date,ech:f.ech,m,rem:f.num,ph:n?ctx.phaseDeSub[n]:r.contrat==='faisa'?ctx.phases[R.faisabilite.groupe]:null,sub:n?ctx.sub[n]:null});
      if(pay) ops.push({t:'projectpayment',id:pay,val:{ID:pay,NAME:f.type,INVOICEDATE:f.date,PAYMENTDATE:f.date_paiement,AMOUNT:m,REMARK:null,SORTORDER:(nPaye[c.id]=(nPaye[c.id]||0)+1),PROJECTCONTRACT_ID:c.id,PROJECTINVOICE_ID:iv}}); }
    emis.push({r,f,c,m,n,paye}); }
  /* solde du mandat : une échéance future, sans laquelle la Situation des encaissements s'arrête au dernier encaissement */
  const M=ctr.mandat, reste=A.arr(M.total-emis.filter(e=>e.c===M).reduce((a,e)=>a+e.m,0)), fin=A.prochainOuvre(A.plus(R.calendrier.decompteFinal,45)), n53=R.phases[R.phases.length-1].n;
  if(reste>0){ const rem='Solde du mandat, après le dossier de l’ouvrage et le décompte final'; ech(M.id,{NAME:'Facture finale',d:fin,ech:A.plus(fin,30),m:reste,rem,ph:ctx.phaseDeSub[n53],sub:ctx.sub[n53]});
    /* la même facture, planifiée : remplit l'état « Planifiée » du Suivi des factures et de Facturation des projets. Pas encore émise : aucun numéro, rien dans Facturation (rapport 9 § 3.1) */
    const dern=R.factures.filter(x=>x.contrat==='mandat'&&x.phases).slice(-1)[0], [iv]=A.ids('projectinvoice');
    ops.push({t:'projectinvoice',id:iv,val:{ID:iv,PROJECT_ID:ctx.pid,CONTACT_ID:ctx.mo.contact,NUMBER:null,NAME:'Facture finale',INVOICEDATE:fin,DUEDATE:A.plus(fin,30),PROJECTINVOICESTATECODE:0,AMOUNT:reste,AMOUNTPAID:0,PAYMENTDATE:null,
      DUNNINGLEVEL:0,PROJECTCONTRACT_ID:M.id,PROJECTPAYMENT_ID:null,TERMSOFPAYMENT:null,ACCOUNTINGPERIOD:null,NOTE:rem,TEMPLATEPROPERTIES:null,QRBILL_ID:null}},
      ...positions(iv,{type:'Facture finale'},{tva:R.tva,_ttc:reste,_fttc:0,frais:0},{[n53]:A.arr(som(R.sia)-som(dern.phases))})); }
  return {ops,emis,ids,fin,reste}; }

/* ── ingénieur civil : les notes d'honoraires du module 47 (mêmes dates, mêmes cumuls), sans le lire : il peut ne pas avoir tourné. Pas de calcul (§ 3.1) ; ni honoraires ni heures comptés ailleurs ── */
function sousTraitant(ctx,ctr,fin){ const R=A.REF, pos=R.autresPositions.find(x=>x.cfc===R.mandataires.find(m=>m.cle==='ing').cfc), ht=pos.ht, t=R.tva, m=ctr.mandat.c, total=hfNum(((m.detail||{}).inputs||{}).ch_ing)||A.arr(ht*(1+t/100));   /* ch_ing est du texte mis en forme : « 106 616.00 » */
  const [id]=A.ids('projectcontract'), auj=R.aujourdhui, ops=[{t:'projectcontract',id,val:{ID:id,PROJECT_ID:ctx.pid,NUMBER:'4',NAME:pos.lib,CONTRACTDATE:A.plus(R.calendrier.mandat.signe,7),SORTORDER:4,SUPPLIERDESC:'Prestations de l’ingénieur civil',ISSUBCONTRACT:1,USERID:ctx.me.user,STATECODE:1,
    REMARK:'Honoraires de l’ingénieur civil, CFC '+pos.cfc+' du devis général, suivis avec le mandat de l’architecte',CONTRACTFOLDER:null,TIMEAMOUNT1:ht,TIMEAMOUNT2:total,TIMEHOUR:0,COSTAMOUNT1:0,COSTAMOUNT2:0,CONTRACTAMOUNT:total,ISINVOICEABLE:0,
    CONTACT_ID:ctx.bureau.contact,SUPPLIERCONTACT_ID:ctx.mand.ing.contact,SUBPROJECT_ID:null,PROJECTFEECALCULATION_ID:null}}];
  const L=R.factures.filter(f=>f.contrat==='mandat'&&f.phases), tot=som(R.sia); let cum=0, sch=0, nPay=0; const ligne=(nom,d,mt,rem)=>{ const [s]=A.ids('projectscheduledpayment'); sch++; ops.push({t:'projectscheduledpayment',id:s,val:{ID:s,NAME:nom,INVOICEDATE:d,DUEDATE:A.plus(d,30),PAYMENTDATE:null,AMOUNT:mt,REMARK:rem||null,SORTORDER:sch,PROJECTCONTRACT_ID:id,PHASE_ID:null,SUBPHASE_ID:null}}); };
  L.forEach((f,i)=>{ const pct=som(f.phases)/tot, jf=A.prochainOuvre(A.plus(f.date,7)), dp=A.prochainOuvre(A.plus(jf,30)), c=Math.round(ht*pct*20)/20, mt=A.arr((c-cum)*(1+t/100)), nom='Note d’honoraires n° '+(i+1); cum=c; ligne(nom,jf,mt);
    if(dp<=auj){ const [p]=A.ids('projectpayment'); ops.push({t:'projectpayment',id:p,val:{ID:p,NAME:nom,INVOICEDATE:jf,PAYMENTDATE:dp,AMOUNT:mt,REMARK:null,SORTORDER:++nPay,PROJECTCONTRACT_ID:id,PROJECTINVOICE_ID:null}}); } });
  const reste=A.arr(total-ops.filter(o=>o.t==='projectscheduledpayment').reduce((a,o)=>a+o.val.AMOUNT,0)); if(reste>0) ligne('Note d’honoraires finale',A.prochainOuvre(A.plus(fin,7)),reste,'Après la fin de la phase '+R.phases[R.phases.length-1].lib.toLowerCase());
  return {ops,id,total}; }

/* ── disponibilité : prévues − déductions = TIMEBUDGET, même calcul que dpCalc ; une ligne déjà dans la base (compte courant) est gardée telle quelle ── */
function disponibilites(ctx){ const R=A.REF, ops=[], spt=new Map(), y0=+R.calendrier.debutAffaire.slice(0,4), y1=+R.aujourdhui.slice(0,4)+1, kAuj=mois(R.aujourdhui);
  const qui=[...R.equipe.map(e=>({cle:e.cle,id:ctx.staff[e.cle].id})),...(ctx.staff.me?[{cle:'me',id:ctx.staff.me.id}]:[])];
  for(const q of qui){ const s=DS.get('staff',q.id), vac={}; DS.by('timelog','STAFF_ID',q.id).filter(t=>+t.ISHOLIDAY).forEach(t=>{ const k=plKey(t.TIMEYEAR,t.TIMEMONTH); vac[k]=(vac[k]||0)+(+t.TIMEPERIOD||0); });
    for(let y=y0;y<=y1;y++) for(let m=0;m<12;m++){ const k=plKey(y,m), ex=plSptOf(q.id,y,m); if(ex){ spt.set(q.id+'|'+k,ex); continue; }
      const prev=dpTarget(q.id,y,m); if(!(prev>0)) continue;   /* pas encore là, ou parti */
      const a=ABSENCES.find(x=>x.cle===q.cle&&mois(x.mois+'-01')===k), v={ID:null,STAFF_ID:q.id,TIMEYEAR:y,TIMEMONTH:m,DEVIATION:0,HOLIDAY:0,EDUCATION:0,OFFICIALABSENCE:0,OTHERABSENCE:0,INTERNALTIME:0,TIMEBUDGET:0,REMARK:a?a.rem:null};
      v.HOLIDAY=Math.min(prev,quart(k>=kAuj?(+s.HOLIDAYS||0)/12:vac[k]||0));
      if(q.cle==='appr'&&m!==6&&m!==7){ v.EDUCATION=quart(prev*.2); v.REMARK=v.REMARK||'Cours professionnels, un jour par semaine'; }
      if(a) v[a.champ]=A.arr(v[a.champ]+a.h);
      const libre=prev-v.HOLIDAY-v.EDUCATION-v.OFFICIALABSENCE-v.OTHERABSENCE;
      v.INTERNALTIME=Math.max(0,Math.min(libre,quart(prev*(INTERNE[q.cle]||0)))); v.TIMEBUDGET=A.arr(Math.max(0,libre-v.INTERNALTIME));
      const [id]=A.ids('staffprojecttime'); v.ID=id; spt.set(q.id+'|'+k,v); ops.push({t:'staffprojecttime',id,val:v}); } }
  return {ops,spt,n:ops.length}; }

/* ── mois de planification : une ligne par phase partielle et par mois, la dernière phase prolongée de MOIS_FUTURS ── */
function moisPlan(){ const R=A.REF, kAuj=mois(R.aujourdhui), L=[], der=R.phases[R.phases.length-1];
  R.phases.forEach(x=>{ const a=mois(x.du), b=x===der?Math.max(mois(x.au),kAuj+MOIS_FUTURS):mois(x.au), K=Array.from({length:b-a+1},(_,i)=>a+i), parts=repartir(x.ht,K.map(()=>1)); K.forEach((k,i)=>L.push({n:x.n,k,part:parts[i],SCHED:0,SETT:0,nS:[],nP:[],note:[]})); });
  return L.sort((a,b)=>a.k-b.k||a.n-b.n); }
/* taux de réalisation : phases achevées d'après les heures saisies (100 % au dernier mois) ; phase en cours d'après les heures au budget et le facturé, puis jusqu'à 100 % au dernier mois */
function tauxPhases(ctx,L){ const R=A.REF, kAuj=mois(R.aujourdhui), parSub=new Map(Object.entries(ctx.sub).map(([n,id])=>[id,+n])), H={}, T={}, der=R.phases[R.phases.length-1], factureAu={};
  DS.by('timelog','PROJECT_ID',ctx.pid).forEach(t=>{ const n=parSub.get(t.SUBPHASE_ID); if(n==null) return; const k=n+'|'+plKey(t.TIMEYEAR,t.TIMEMONTH), h=+t.TIMEPERIOD||0; H[k]=(H[k]||0)+h; T[n]=(T[n]||0)+h; });
  const cles=k=>Object.keys(R.sia).filter(x=>+x.slice(1,3)===k), part=n=>cles(n).reduce((a,x)=>a+R.sia[x],0);
  R.factures.filter(f=>f.phases).forEach(f=>R.phases.forEach(x=>{ (factureAu[x.n]=factureAu[x.n]||[]).push([mois(f.date),cles(x.n).reduce((a,k)=>a+(+f.phases[k]||0),0)/part(x.n)*100]); }));
  R.phases.forEach(x=>{ const P=L.filter(l=>l.n===x.n); let c=0, v=0;
    P.forEach((l,i)=>{ c+=H[x.n+'|'+l.k]||0;
      if(x!==der) v=(T[x.n]?c/T[x.n]:(i+1)/P.length)*100;
      else if(l.k<kAuj) v=Math.max(v,c/x.h*100,...(factureAu[x.n]||[]).filter(y=>y[0]<=l.k).map(y=>y[1]));
      else { const restants=P.length-i; v+=(100-v)/restants; }
      l.taux=Math.min(100,(x===der?Math.ceil:Math.round)(v/5)*5); }); });   /* phase en cours arrondie vers le haut : jamais sous le facturé */
  L.forEach((l,i)=>{ const av=[...L.slice(0,i)].reverse().find(y=>y.n===l.n); if(av&&l.taux<av.taux) l.taux=av.taux; }); }

/* ── planification ── */
async function planifier(ctx,ctr,E,S){ const R=A.REF, kAuj=mois(R.aujourdhui), pid=ctx.pid, tarif=R.tarifHoraire, L=moisPlan(), libP=n=>R.phases.find(x=>x.n===n);
  if(!DS.all('planningcostfactor').length){ const [cf]=A.ids('planningcostfactor'); await A.commit([{t:'planningcostfactor',id:cf,val:{ID:cf,VALIDFROMYEAR:+R.calendrier.debutAffaire.slice(0,4),VALIDFROMMONTH:0,INTERNALCOSTFACTOR:FRAIS_INTERNES}}]); await A.sauverRegistre(); }
  /* encaissements planifiés et reçus : au mois de la facture et du paiement, sur la phase facturée si elle a ce mois, sinon sur la dernière phase du mois */
  const ligneDe=(iso,n)=>{ const k=mois(iso), C=L.filter(l=>l.k===k); if(!C.length) throw new Error('planification : aucun mois pour '+iso); return C.find(l=>l.n===n)||C[C.length-1]; };
  E.emis.filter(e=>e.c===ctr.mandat).forEach(e=>{ const a=ligneDe(e.f.date,e.n); a.SCHED+=e.m; a.nS.push(e.f.num); if(e.paye){ const b=ligneDe(e.f.date_paiement,e.n); b.SETT+=e.m; b.nP.push(e.f.num+' payée le '+fr(e.f.date_paiement)); } });
  if(E.reste>0){ const a=ligneDe(E.fin,R.phases[R.phases.length-1].n); a.SCHED+=E.reste; a.nS.push('Facture finale prévue le '+fr(E.fin)); }
  R.recit.filter(x=>x.d>=R.phases[0].du).forEach(x=>{ const ph=R.phases.find(y=>x.d>=y.du&&x.d<=y.au); ligneDe(x.d,ph?ph.n:null).note.push(x.t); });
  tauxPhases(ctx,L);

  /* catégories : part et coût horaire moyens, pondérés par les heures de chaque phase */
  const avecMe=!!ctx.staff.me, inter=Object.fromEntries(R.equipe.map(e=>[e.cle,e.interne])); inter.me=inter.cdp;
  const partRole=(ro,n)=>ro.st.filter(c=>c!=='me'||avecMe).reduce((a,c)=>a+(R.repartition[n][c]||0),0);
  const poids=ROLES.map(ro=>R.phases.reduce((a,x)=>a+x.h*partRole(ro,x.n),0)), parts=repartir(1000,poids);
  const roles=ROLES.map((ro,i)=>{ let hh=0, cout=0; R.phases.forEach(x=>ro.st.forEach(c=>{ const w=x.h*((c==='me'&&!avecMe)?0:R.repartition[x.n][c]||0); hh+=w; cout+=w*(inter[c]||0); })); const [id]=A.ids('planningrole'); return {...ro,id,taux:parts[i]/10,interne:Math.round(hh?cout/hh:0)}; });
  const [ps]=A.ids('planningsubproject'), ops=[{t:'planningsubproject',id:ps,val:{ID:ps,PROJECT_ID:pid,SUBPROJECT_ID:null,PROJECTCONTRACT_ID:ctr.mandat.id,EXTERNALRATE:tarif,NOTE:'Mandat complet, budget d’honoraires selon l’avenant n° 1',USERID:ctx.me.user}},
    ...roles.map((r,i)=>({t:'planningrole',id:r.id,val:{ID:r.id,PLANNINGSUBPROJECT_ID:ps,NAME:r.nom,SORTORDER:i+1,TIMERATE:r.taux,INTERNALRATE:r.interne}}))];

  /* un mois par phase partielle, ses parts, ses attributions ; TIMEBUDGET du collaborateur jamais dépassé. Le dernier mois n'est pas attribué : c'est le travail du prochain mois */
  const ded=Object.fromEntries(PL_DED.map(f=>[f,0])), reste=new Map(), plafonne=[]; let nA=0;
  for(const l of L){ const [y,m]=plYM(l.k), [pm]=A.ids('planningmonth'), x=libP(l.n), fin=l.k===mois(x.au)&&x!==R.phases[R.phases.length-1];
    const v={ID:pm,PROJECT_ID:pid,SUBPROJECT_ID:null,SUBPHASE_ID:ctx.sub[l.n],TIMEYEAR:y,TIMEMONTH:m,CONTRACTAMOUNT:l.part,CONTRACTAMOUNTADDITION:0,INTERNALCOSTFACTOR:plFacteur(y,m),EXTERNALRATE:tarif,TIMEHOUR:0,NOTE:l.note.join(' ')||null,
      IMPLEMENTATIONRATE:l.taux,IMPLEMENTATIONNOTE:fin?'Phase achevée le '+fr(x.au)+'.':null,SCHEDULEDAMOUNT:A.arr(l.SCHED),SUBPLANNERAMOUNT:0,SUBCONTRACTORAMOUNT:0,AMENDEDAMOUNT:0,SCHEDULEDAMOUNTNOTE:l.nS.join(', ')||null,
      SETTLEDAMOUNT:A.arr(l.SETT),SETTLEDAMOUNTNOTE:l.nP.join(', ')||null,...ded};
    v.TIMEHOUR=A.arr(plTimeHourCalc(v)); ops.push({t:'planningmonth',id:pm,val:v});
    const presents=roles.map(r=>({r,w:partRole(r,l.n)})).filter(z=>z.w>0), tx=repartir(1000,presents.map(z=>z.w));
    presents.forEach((z,i)=>{ const [pt]=A.ids('planningtime'), rate=tx[i]/10; ops.push({t:'planningtime',id:pt,val:{ID:pt,PLANNINGMONTH_ID:pm,PLANNINGROLE_ID:z.r.id,TIMERATE:rate,INTERNALRATE:z.r.interne,NOTE:null}});
      if(l.k>kAuj+1) return;
      const heures=v.TIMEHOUR*rate/100, Q=z.r.st.map(c=>({c,sid:c==='me'?(avecMe?ctx.staff.me.id:null):ctx.staff[c].id,w:R.repartition[l.n][c]||0})).filter(q=>q.w>0&&q.sid!=null&&S.spt.has(q.sid+'|'+l.k)), tw=Q.reduce((a,q)=>a+q.w,0);
      Q.forEach(q=>{ const sp=S.spt.get(q.sid+'|'+l.k), dispo=reste.has(sp.ID)?reste.get(sp.ID):(+sp.TIMEBUDGET||0)-sptAttribue(sp), voulu=Math.round(heures*q.w/tw*2)/2, h=Math.max(0,Math.min(voulu,Math.floor(dispo*2)/2));
        if(h<voulu) plafonne.push(q.c+' '+y+'-'+(m+1)); if(!h) return; const [a]=A.ids('planningassignment'); reste.set(sp.ID,dispo-h); nA++;
        ops.push({t:'planningassignment',id:a,val:{ID:a,PLANNINGTIME_ID:pt,STAFFPROJECTTIME_ID:sp.ID,TIMEPERIOD:h,NOTE:null}}); }); }); }
  await A.commit(ops); await A.sauverRegistre();
  if(plafonne.length) A.log('planification : heures plafonnées à la disponibilité,',plafonne.join(', '));
  return {ps,roles:Object.fromEntries(roles.map(r=>[r.nom,r.id])),mois:L.length,attributions:nA}; }

A.mod(80,'moteur','Tables du moteur : Finances et planification RH',async ctx=>{
  const R=A.REF, D=fxData(); if(!D||!ctx.contrats||!ctx.contrats.mandat||!ctx.factures||!Object.keys(ctx.factures).length) throw new Error('module 80 : contrats et factures de Facturation absents (modules 30, 50, 70)');
  /* contrats et factures */
  const C=recopierContrats(ctx,D), E=recopierFactures(ctx,D,C.res), ST=sousTraitant(ctx,C.res,E.fin);
  await A.commit([...C.ops,...E.ops,...ST.ops]); await A.sauverRegistre();
  /* disponibilités, puis planification */
  const S=disponibilites(ctx); await A.commit(S.ops); await A.sauverRegistre();
  const P=await planifier(ctx,C.res,E,S);
  ctx.moteur={contrats:{faisa:C.res.faisa.id,mandat:C.res.mandat.id,expertise:C.res.expertise.id,ing:ST.id},factures:E.ids,planification:P.ps,roles:P.roles};
  A.log('moteur : 4 contrats, '+R.factures.length+' factures et 1 planifiée, solde du mandat '+E.reste+' prévu le '+E.fin+' ; '+S.n+' disponibilités, '+P.mois+' mois planifiés, '+P.attributions+' attributions'); });
})();

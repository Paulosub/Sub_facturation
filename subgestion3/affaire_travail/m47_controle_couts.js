/* ═══ AFFAIRE DE TRAVAIL 99TST — MODULE 47 : CONTRÔLE DES COÛTS (04.11.2026) ═══
   Crée le contrôle des coûts complet de l'affaire (costcontroldocument + costcontrol, statut En cours) :
   - budget : positions attribuées depuis le devis général validé (m40) ;
   - contrats : architecte (contrat et avenant n° 1 aux honoraires), ingénieur civil, CVSE, géomètre, puis chaque lot transféré depuis sa soumission (m45), comme « Transférer vers le contrôle des coûts » ;
   - 10 avenants d'entreprises ; mutations T1, M2, M3, M4, M5, M6, T7, T8, C9 (l'app n'a pas de code M1 : son premier genre est T1 Transfert) ; provisions, provision de régies soldée, coût probable personnalisé sur 583 ;
   - situations mensuelles avec retenue, renchérissement, régie, paiements hors contrat (taxes, géotechnique, nettoyage), paiements de l'architecte = factures de REF.factures, ordres de paiement par mois ;
   - arrêtés de compte et paiements finaux, garanties banque 2 ans, assurance 5 ans, sans garantie ; deux entreprises à solder (sols, jardinage) ; position 531 sans contrat ni paiement ;
   - un état intermédiaire au 31.12.2025 (statut État intermédiaire), copie filtrée par date.
   Contrôle : arrêt si le budget s'écarte du devis général.

   Ajoute à ctx.couts :  cc (ID du contrôle des coûts en cours), ccInter (ID de l'état intermédiaire), soldes (lots soldés, lots à solder) */
(function(){
const A=window.AT;
const fr=iso=>iso?iso.split('-').reverse().join('.'):'';
const ST_PAY={receptionne:1,libere:2,transmis:3,debite:4}, ST_ORD={enTraitement:0,controle:1,transmis:2,debite:3}, ST_MUT={brouillon:1,provisoire:2,demandeTransmise:3,acceptee:4,rejetee:5};

/* avenants d'entreprises : k = lot, l = brut par CFC */
const AVENANTS=[
  {k:'201',date:'2025-04-07',des:'Avenant 1 : brise-roche, fouille nord',l:{'201.1':24000},txt:'Rocher plus dur que prévu dans la fouille nord, minage interdit : brise-roche et évacuation en plus.'},
  {k:'211',date:'2025-06-30',des:'Avenant 1 : drainage et fondations du mur nord',l:{'211.5':18000},txt:'Drainage complémentaire et fondations du mur nord adaptées au rocher.'},
  {k:'211',date:'2025-09-15',des:'Avenant 2 : renchérissement de l’acier d’armature',l:{'211.5':6200},txt:'Renchérissement de l’acier d’armature selon la clause du contrat.',rench:true},
  {k:'244',date:'2025-10-06',des:'Avenant 1 : clapets coupe-feu et désenfumage',l:{'244':5500},txt:'Charges ECA de la synthèse CAMAC : clapets coupe-feu et désenfumage de la cage d’escalier.'},
  {k:'221',date:'2025-11-24',des:'Avenant 1 : livraison décalée de deux étages',l:{'221.1':8000},txt:'Livraison décalée de deux étages, stockage et pose en deux étapes.'},
  {k:'232',date:'2025-12-15',des:'Avenant 1 : bornes de recharge du parking',l:{'232':9500},txt:'Bornes de recharge et 2 places supplémentaires du parking.'},
  {k:'228',date:'2026-02-02',des:'Avenant 1 : suppression des stores du local à vélos',l:{'228.2':-2800},txt:'Stores du local à vélos supprimés à la demande du maître de l’ouvrage.'},
  {k:'258',date:'2026-02-23',des:'Avenant 1 : choix du maître de l’ouvrage',l:{'258':6800},txt:'Plans de travail et appareils selon le choix du maître de l’ouvrage.'},
  {k:'281',date:'2026-02-23',des:'Avenant 1 : parquet chêne',l:{'281.7':16200},txt:'Parquet chêne plus cher choisi par le maître de l’ouvrage.'},
  {k:'273',date:'2026-03-16',des:'Avenant 1 : portes EI30 des locaux communs',l:{'273.0':3400},txt:'Portes EI30 supplémentaires des locaux communs.'}];
/* décomptes : d = écart du brut final (sans métré) ; g = garantie ; st = statut du paiement final */
const DECOMPTES={'112':{d:-1350,g:'sans',date:'2026-09-07'},'201':{g:'sans',date:'2026-09-07'},'211':{g:'banque',date:'2026-09-14',com:'Reprise de l’étanchéité du saut-de-loup après l’infiltration, exécutée aux frais de l’entreprise, sans incidence sur le décompte.'},
  '221':{d:1200,g:'banque',date:'2026-09-14'},'224':{d:-900,g:'assurance',date:'2026-09-21'},'226':{g:'assurance',date:'2026-09-21'},'228':{d:300,g:'banque',date:'2026-09-28'},'232':{d:-1200,g:'banque',date:'2026-09-28'},
  '242':{d:850,g:'banque',date:'2026-10-05'},'244':{d:900,g:'banque',date:'2026-10-05'},'251':{d:-2400,g:'banque',date:'2026-10-12'},'258':{d:0,g:'banque',date:'2026-10-12'},
  '261':{d:0,g:'banque',date:'2026-10-19',st:'transmis'},'271':{d:1650,g:'banque',date:'2026-10-19',st:'transmis'},'273':{d:-500,g:'banque',date:'2026-10-26',st:'libere'},'285':{d:300,g:'banque',date:'2026-10-26',st:'receptionne'}};

A.mod(47,'controle','Contrôle des coûts',async ctx=>{
  const R=A.REF, pid=ctx.pid, K=R.calendrier, M=R.contrats.mandat, E=ctx.couts.E, usager=ctx.staff.dt.user, auj=R.aujourdhui;
  await DS.need(['costcontrol','bankaccount']);

  /* ── aides (rapport 5 § 8) ── */
  const cd=(niv,kind,val,o)=>Object.assign({niveau:niv,reference:niv-1,kind,genre:COND[kind][0],libelle:COND[kind][2],refCond:'',valeur:val,appliquee:true},o||{});
  const totaux=x=>{ x.totauxDelta={brut:r2(docBrut(x)),net:r2(docNet(x)),tva:r2(docTva(x))}; return x; };
  const nouv=()=>ch01cRef(C);
  const ligne=(l,i)=>({cfc:l.cfc,ouvrage:'',localisation:'',refCond:'',brut:l.brut,refNum:i+1});
  const r=A.alea(4700), noFact=()=>String(200000+Math.floor(r()*699999));
  const dernierOuvre=iso=>{ let d=iso; while(!A.ouvre(d)) d=A.plus(d,-1); return d; };
  const finMois=iso=>{ const [y,m]=iso.split('-').map(Number); return A.iso(Math.round(Date.UTC(y,m,0)/864e5)); };
  const finsDeMois=(d0,d1)=>{ const L=[], f=finMois(d1); let x=finMois(d0); for(;;){ L.push(x); if(x>=f) break; x=finMois(A.plus(x,1)); } return L; };
  const moisApres=iso=>A.prochainOuvre(A.plus(finMois(iso),1).slice(0,8)+'25');
  const ansPlus=(iso,n)=>A.plus(String(+iso.slice(0,4)+n)+iso.slice(4),-1);

  /* ── document et budget ── */
  const [cid,cidI]=A.ids('costcontroldocument',2), C=ccEmpty(cid,pid), src=DS.all('costcontrol').find(c=>(c.presentations||{}).adjudications);
  if(src){ C.presentations=Object.fromEntries(Object.entries(src.presentations).map(([k,L])=>[k,L.filter(x=>x.nom==='Standard').map(x=>({...JSON.parse(JSON.stringify(x)),favori:true}))]));
    C.titresColonnes=JSON.parse(JSON.stringify(src.titresColonnes||{})); C.catalogueConditions=JSON.parse(JSON.stringify(src.catalogueConditions||[])); }
  const cptMO=DS.by('bankaccount','CONTACTOWNER_ID',ctx.mo.owner)[0];
  if(cptMO) C.comptesMO=[{banque:cptMO.NAME,clearing:cptMO.CLEARINGNR||'',compte:'',compte2:'',contact:'',iban:cptMO.IBAN,lieu:cptMO.LOCATION||'',localisation:'',npa:cptMO.POSTALCODE||'',ouvrage:'',rue:cptMO.STREET||'',swift:''}];
  /* attribution du devis : copie sans fenêtre de ccAssignDG */
  { const {M:N,T}=dvCompute(E), map=new Map();
    E.positions.forEach(x=>{ const n=N.get(String(x.cfc)), c=String(x.cfc), po={cfc:c,libelle:x.texte||'',libelle2:x.texte2||'',genere:!n||!n.leaf,positionCout:false,commentaire:'',lignesCalcul:[],parOuvrage:[]};
      if(n&&n.leaf){ const l0=(((x.parts||[])[0]||{}).lignes||[])[0]; po.tauxTVA=l0?l0.tva:R.tva; po.dgTTC=r2(n.ttc); po.dgHT=r2(n.ht); po.dgTVA=r2(n.ttc-n.ht); } else { po.tauxTVA=null; po.dgTTC=0; po.dgHT=0; po.dgTVA=0; }
      map.set(c,po); });
    C.positions=[...map.values()].sort((a,b)=>cfcCmp(a.cfc,b.cfc)); C.ouvragesProjet=[];
    if(Math.abs(C.positions.reduce((a,x)=>a+x.dgTTC,0)-T.ttc)>.01) throw new Error('budget ≠ total du devis général'); }
  const libPos=c=>(C.positions.find(x=>x.cfc===c)||{}).libelle||'';

  const entreprise=id=>{ if(id!=null&&!C.entreprises.some(e=>e.contactId===id)){ const c=DS.get('contact',id); C.entreprises.push({contactId:id,nomCourt:c?contactName(c)+(c.LOCATION?', '+c.LOCATION:''):''}); } };
  const banqueDe=id=>{ const c=DS.get('contact',id), b=c&&DS.by('bankaccount','CONTACTOWNER_ID',c.CONTACTOWNER_ID)[0], t=(C.parametres||{}).texteCompte||''; return b?{nom:contactName(c),rue:c.STREET||'',npa:c.POSTALCODE||'',lieu:c.LOCATION||'',compte:'',texteCompte:t,swift:'',clearing:b.CLEARINGNR||'',iban:b.IBAN||'',compteMO:''}:{texteCompte:t}; };

  /* ── contrats ── */
  const contrat=o=>{ const rn=nouv(), x={id:'c'+rn,refNum:rn,type:'contrat',contratParentId:null,lieAuContrat:true,numero:String(o.numero),designation:'Contrat',date:o.date,statut:'definitif',statutCode:5,contactId:o.contactId,
      lot:{numero:o.lot,texte:o.lotTexte||''},prioritaireSurDevis:true,saisie:'brut',paiementsAvecDetails:true,niveauPrestations:o.niveau||0,delaiGarantie:'',description:o.description||'',annexes:[],lignes:o.lignes.map(ligne),conditions:[cd(1,6,o.tva||R.tva)]};
    ccApply(x); totaux(x); C.contrats.push(x); entreprise(o.contactId); return x; };
  const avenant=(par,o)=>{ const rn=nouv(), n=C.contrats.filter(a=>a.contratParentId===par.id).length+1, x={...JSON.parse(JSON.stringify(par)),id:'a'+rn,refNum:rn,type:'avenant',contratParentId:par.id,numero:String(n),designation:o.designation||'Avenant',date:o.date,description:o.description||'',lignes:o.lignes.map(ligne)};
    delete x.totauxDelta; delete x.origineSoumission; ccApply(x); totaux(x); C.contrats.push(x); return x; };
  /* contrats par CFC : mandat, mandataires, puis lots dans l'ordre des dates */
  const cMandat=contrat({numero:1,date:K.mandat.signe,contactId:ctx.bureau.contact,lot:'291',lotTexte:libPos('291'),lignes:[{cfc:'291',brut:r2(M.v1.hht*(1+M.frais/100))}],description:'Mandat complet SIA 102, honoraires et frais accessoires de '+M.frais+' %.'});
  avenant(cMandat,{date:K.mandat.avenantSigne,designation:'Avenant n° 1 aux honoraires',description:'Nouveau coût de l’ouvrage selon le devis général du '+fr(K.devisValide)+'.',lignes:[{cfc:'291',brut:r2((M.v2.hht-M.v1.hht)*(1+M.frais/100))}]});
  const mand=[['ing','292','2024-02-05',2],['cvse','294','2024-02-12',3],['geom','296.0','2024-03-04',4]].map(([c,cfc,date,n])=>({cle:c,cfc,x:contrat({numero:n,date,contactId:ctx.mand[c].contact,lot:cfc,lotTexte:libPos(cfc),lignes:[{cfc,brut:R.autresPositions.find(y=>y.cfc===cfc).ht}],description:'Mandat de '+ctx.mand[c].metier.toLowerCase()+'.'})}));
  const lots=R.lots.filter(l=>l.contrat!=null), parK={};
  lots.slice().sort((a,b)=>+ctx.soum[a.k].numero-+ctx.soum[b.k].numero).forEach(l=>{ const s=ctx.soum[l.k], so=svcCostSource(s.S,'D'); if(so.err) throw new Error('lot '+l.k+' : '+so.err); const er=svcCondRefErr(so.conds); if(er) throw new Error(er);
    const c=svcCostContract(s.S,s.doc,'D',so,{C,numero:s.numero,commentaire:'',prio:true,kag:s.kag,to:false}); if(c.err) throw new Error('lot '+l.k+' : '+c.err);
    const rn=nouv(); c.refNum=rn; c.id='c'+rn; c.delaiGarantie=(DECOMPTES[l.k]||{}).g==='assurance'?'5 ans':(DECOMPTES[l.k]||{}).g==='sans'?'':'2 ans'; C.contrats.push(c); entreprise(c.contactId); parK[l.k]=c; });
  AVENANTS.forEach(a=>{ a.x=avenant(parK[a.k],{date:a.date,designation:a.des,description:a.txt,lignes:Object.entries(a.l).map(([cfc,brut])=>({cfc,brut}))}); });

  /* ── mutations, provisions : les montants T7, T8 et les dates viennent du récit ── */
  const recit=re=>R.recit.find(x=>re.test(x.t)), ttc=(ht,t=R.tva)=>r2(ht*(1+t/100)), cont=k=>ctx.ent[k][0].contact;
  const mutation=o=>{ const rn=nouv(), g=C.genresMutation.find(z=>z.code===o.code), t=o.tva??R.tva, h=r2(o.ttc/(1+t/100)), st=o.statut||'acceptee';
    C.mutations.push({id:'m'+rn,refNum:rn,centre:1,numero:+ccNextNum(C.mutations,'numero'),code:o.code,genre:g.genre,genreTexte:g.texte,date:o.date,statut:st,statutCode:ST_MUT[st],remarque:o.remarque||'',commentaire:o.commentaire||'',
      origine:o.de?{cfc:o.de,contactId:null,ouvrage:'',localisation:''}:null,destination:{cfc:o.vers,contactId:o.contactId??null,ouvrage:'',localisation:''},ht:h,tauxTVA:t,tva:r2(o.ttc-h),ttc:o.ttc}); };
  const ecriture=o=>{ const rn=nouv(), t=o.tva??R.tva, h=r2(o.ttc/(1+t/100)); C.ecritures.push({id:'e'+rn,refNum:rn,type:o.type||'provision',cfc:o.cfc,contactId:o.contactId??null,ouvrage:'',localisation:'',date:o.date,remarque:o.remarque||'',ht:h,tauxTVA:t,tva:r2(o.ttc-h),ttc:o.ttc,coutProbableZero:!!o.zero}); };
  const fF=R.factures.find(f=>f.contrat==='faisa'), fS=R.factures.find(f=>f.sansContrat), htF=R.contrats.faisa.lignes.reduce((a,l)=>a+l.amt,0), htS=fS.lignes.reduce((a,l)=>a+l.amt,0), rT7=recit(/\(T7\)/), rT8=recit(/\(T8\)/), rM4=recit(/mutation M4/);
  const htT7=AVENANTS.find(a=>a.k==='201').l['201.1'], htT8=+/([\d\s]+)\sHT\s\(T8\)/.exec(rT8.t)[1].replace(/\s/g,'');
  [{code:'T1',date:'2024-12-02',de:'583',vers:'291',ttc:r2(M.v2.httc*M.frais/100),remarque:'Frais accessoires de '+M.frais+' % du mandat, non compris au devis général',contactId:ctx.bureau.contact},
   {code:'M6',date:'2024-12-16',vers:'244',ttc:ttc(5500),remarque:'Charges ECA de la synthèse CAMAC : clapets coupe-feu et désenfumage',contactId:cont('244')},
   {code:'T1',date:'2025-03-17',de:'583',vers:'291',ttc:r2(ttc(htF,R.tvaAvant2024)+ttc(htS)),remarque:'Étude de faisabilité 2023 et relevé du bâtiment voisin, facturés hors contrat',contactId:ctx.bureau.contact},
   {code:'T7',date:rT7.d,de:'583',vers:'201.1',ttc:ttc(htT7),remarque:'Rocher plus dur que prévu dans la fouille nord, brise-roche, pris sur les réserves',contactId:cont('201')},
   {code:'M2',date:'2025-06-30',vers:'211.5',ttc:ttc(18000),remarque:'Drainage complémentaire et fondations du mur nord',contactId:cont('211')},
   {code:'C9',date:'2025-09-15',vers:'211.5',ttc:ttc(6200),remarque:'Renchérissement de l’acier d’armature',contactId:cont('211')},
   {code:'M2',date:'2025-11-03',vers:'232',ttc:ttc(9500),remarque:'Bornes de recharge et 2 places supplémentaires du parking',contactId:cont('232')},
   {code:'T8',date:rT8.d,de:'583',vers:'221.1',ttc:ttc(htT8),remarque:'Livraison décalée de deux étages, plus-value validée par la direction des travaux',contactId:cont('221')},
   {code:'M3',date:'2026-01-26',vers:'228.2',ttc:ttc(-2800),remarque:'Suppression des stores du local à vélos',contactId:cont('228')},
   {code:'M4',date:rM4.d,vers:'258',ttc:ttc(6800),remarque:'Choix du maître de l’ouvrage : plans de travail et appareils des cuisines',contactId:cont('258')},
   {code:'M4',date:rM4.d,vers:'281.7',ttc:ttc(16200),remarque:'Choix du maître de l’ouvrage : parquet chêne',contactId:cont('281')},
   {code:'M5',date:'2026-03-09',vers:'273.0',ttc:ttc(3400),remarque:'Décision de la direction des travaux : portes EI30 des locaux communs',contactId:cont('273')},
   {code:'M2',date:'2026-10-12',vers:'421',ttc:ttc(1600),remarque:'Clôture complémentaire côté voisin, en attente de l’accord du maître de l’ouvrage',statut:'demandeTransmise',contactId:cont('421')}].forEach(mutation);
  ecriture({cfc:'251',contactId:cont('251'),date:'2026-01-15',ttc:6000,remarque:'Régies de mise en service à venir'});
  ecriture({cfc:'251',contactId:cont('251'),date:'2026-06-30',ttc:-6000,remarque:'Régies facturées, provision soldée'});
  ecriture({cfc:'281.7',contactId:cont('281'),date:'2026-10-01',ttc:1800,remarque:'Retouches du parquet de l’attique, à régler avec le décompte'});
  ecriture({cfc:'421',contactId:cont('421'),date:'2026-10-15',ttc:2500,remarque:'Regarnissage des plantations au printemps, garantie de reprise'});
  ecriture({type:'coutProbablePerso',cfc:'583',date:K.decompteFinal,ttc:20000,remarque:'Réserve maintenue jusqu’à la levée des réserves de la réception'});

  /* ── paiements ── */
  const situation=(ctr,o)=>{ const av=C.contrats.filter(a=>a.contratParentId===ctr.id&&a.lieAuContrat!==false), ids=new Set([ctr.id,...av.map(a=>a.id)]), prev=C.paiements.filter(y=>ids.has(y.contratId));
    const si=r2(prev.reduce((a,y)=>a+docNet(y)-docTva(y),0)), cs=JSON.parse(JSON.stringify(ctr.conditions)).filter(c=>c.kind!==6).map(c=>{ delete c.montant; return c; }); let n=Math.max(0,...cs.map(c=>c.niveau));
    if(o.rg) cs.push(cd(++n,4,-o.rg)); cs.push(cd(++n,20,si)); const tv=ctr.conditions.find(c=>c.kind===6); cs.push(cd(++n,6,tv?tv.valeur:R.tva));
    const rn=nouv(), g=C.genresPaiement.find(z=>z.genre===(o.genre||'surContrat')), st=o.statut||'debite';
    const x={id:'p'+rn,refNum:rn,contratId:ctr.id,genre:o.genre||'surContrat',genreCode:o.genre==='rencherissement'?2:1,genreTexte:g.texte,dernier:false,numero:ccNextNum(C.paiements,'numero'),numeroFacture:o.facture||noFact(),dateFacture:o.dateFacture,datePaiement:o.datePaiement,
      statut:st,statutCode:ST_PAY[st],commentaire:g.texte,description:o.description||'',contactId:ctr.contactId,lot:{...ctr.lot},numeroOrdre:'',saisie:'brut',lignes:Object.entries(o.cumul).map(([cfc,brut],i)=>ligne({cfc,brut},i)),conditions:cs,banque:banqueDe(ctr.contactId),annexes:[]};
    ccApply(x); totaux(x); C.paiements.push(x); return x; };
  const horsContrat=o=>{ const rn=nouv(), g=C.genresPaiement.find(z=>z.genre==='horsContrat'), t=o.tva??R.tva, st=o.statut||'debite'; entreprise(o.contactId);
    const x={id:'p'+rn,refNum:rn,contratId:null,genre:o.genre||'horsContrat',genreCode:o.genre==='regie'?7:3,genreTexte:o.genre==='regie'?'Régie':g.texte,dernier:!!o.dernier,numero:ccNextNum(C.paiements,'numero'),numeroFacture:o.facture||noFact(),dateFacture:o.dateFacture,datePaiement:o.datePaiement,
      statut:st,statutCode:ST_PAY[st],commentaire:o.genre==='regie'?'Régie':g.texte,description:o.description||'',contactId:o.contactId,lot:{numero:o.cfc,texte:libPos(o.cfc)},numeroOrdre:'',saisie:'net',lignes:[ligne({cfc:o.cfc,brut:o.brut},0)],
      conditions:[cd(1,3,0,{appliquee:false}),cd(2,6,t)],banque:banqueDe(o.contactId),annexes:[]}; ccApply(x); totaux(x); C.paiements.push(x); return x; };
  const arrete=(ctr,o)=>{ const a=ch01cInit(C,ctr,o.date); a.lignes.forEach(l=>{ l.brut=r2(o.brut[l.cfc]??l.adjudicationBrut); }); ccApply(a); Object.assign(a,ch01cTotaux(a));
    const rn=nouv(), st=o.statut||'definitif'; Object.assign(a,{id:'d'+rn,refNum:rn,statut:st,statutCode:{etabli:1,pourSignature:2,definitif:3}[st],garantie:o.garantie,commentaire:o.commentaire||'',totauxDelta:{ht:a.ht,tva:a.tva,net:a.net}}); C.arretes.push(a); return a; };
  const paiementFinal=(a,o)=>{ const rn=nouv(), f=ch01cFinalPrefill(C,a,{jour:o.date,id:'p'+rn}); ccApply(f); f.refNum=rn; f.statut=o.statut||'debite'; f.statutCode=ST_PAY[f.statut]; f.numeroFacture=o.facture||noFact(); f.datePaiement=o.datePaiement; f.banque=banqueDe(a.contactId); f.description=o.description||''; totaux(f); C.paiements.push(f); return f; };
  const garantie=(g,net)=>g==='sans'?{genre:'sansGarantie',genreCode:4,montant:0,debut:K.reception,fin:K.reception}:g==='assurance'?{genre:'assurance',genreCode:2,montant:Math.round(net/10/100)*100,debut:K.reception,fin:ansPlus(K.reception,5)}:{genre:'banque',genreCode:1,montant:Math.round(net/10/100)*100,debut:K.reception,fin:ansPlus(K.reception,2)};

  /* brut adjugé par CFC d'un contrat à une date, avenants compris */
  const adjudic=(c,d)=>{ const o={}; [c,...C.contrats.filter(a=>a.contratParentId===c.id&&(!d||a.date<=d))].forEach(x=>x.lignes.forEach(l=>{ o[l.cfc]=(o[l.cfc]||0)+l.brut; })); return o; };
  const parPct=(o,p)=>Object.fromEntries(Object.entries(o).map(([c,v])=>[c,Math.round(v*p/10)*10]));
  /* événements, triés par date de facture : les numéros suivent le calendrier */
  const ev=[], planifier=(d,f)=>ev.push({d,n:ev.length,f});

  /* situations mensuelles par lot */
  lots.forEach(l=>{ const c=parK[l.k], fins=finsDeMois(l.trav[0],l.trav[1]), dec=DECOMPTES[l.k], n=fins.length+(dec?0:1);   /* lot à solder : une situation de plus, plus tard */
    fins.forEach((f,i)=>{ const jf=dernierOuvre(f), p=.92*Math.pow((i+1)/n,1.1), av=+(i+1); planifier(jf,()=>situation(c,{rg:10,dateFacture:jf,datePaiement:moisApres(f),cumul:parPct(adjudic(c,jf),p),description:'Situation n° '+av+', travaux à fin '+fr(f).slice(3)+'.'})); });
    if(dec){ const ad=()=>adjudic(c), date=dec.date, jf=A.prochainOuvre(A.plus(date,1)), dp=A.prochainOuvre(A.plus(jf,21)), st=dec.st||'debite', s=ctx.soum[l.k];
      planifier(jf,()=>{ const b=ad(), brut={...b}; if(s.metre) Object.keys(b).forEach(cfc=>{ brut[cfc]=s.metre[cfc]+(b[cfc]-parK[l.k].lignes.find(x=>x.cfc===cfc).brut); });
        else brut[Object.keys(b)[0]]+=dec.d||0;
        const a0=ch01cInit(C,c,date); a0.lignes.forEach(x=>{ x.brut=r2(brut[x.cfc]); }); ccApply(a0); const net=ch01cTotaux(a0).net;
        const a=arrete(c,{date,brut,garantie:garantie(dec.g,net),commentaire:dec.com}); paiementFinal(a,{date:jf,datePaiement:dp,statut:st,description:'Décompte final, garantie '+(dec.g==='sans'?'non demandée':dec.g==='assurance'?'d’assurance reçue':'bancaire reçue')+'.'}); c.niveauPrestations=100; }); } });
  /* renchérissement payé sur le gros œuvre, après la situation de septembre */
  { const c=parK['211'], a=AVENANTS.find(x=>x.rench), jf='2025-10-02'; planifier(jf,()=>{ const prev=[...C.paiements].reverse().find(y=>y.contratId===c.id), cumul=Object.fromEntries(prev.lignes.map(l=>[l.cfc,l.brut])); cumul['211.5']+=a.l['211.5'];
      situation(c,{rg:10,genre:'rencherissement',dateFacture:jf,datePaiement:moisApres(jf),cumul,description:'Renchérissement de l’acier d’armature, avenant 2.'}); }); }
  /* lots à solder : une situation de plus, 281 sans arrêté, 421 avec arrêté à signer */
  { const c=parK['281'], jf='2026-09-30'; planifier(jf,()=>situation(c,{rg:10,dateFacture:jf,datePaiement:'2026-11-09',statut:'libere',cumul:parPct(adjudic(c),.95),description:'Situation n° 4, après métré contradictoire. Plinthes de l’attique à reprendre avant le décompte.'})); c.niveauPrestations=95; }
  { const c=parK['421'], jf='2026-09-30', s=ctx.soum['421']; planifier(jf,()=>situation(c,{rg:10,dateFacture:jf,datePaiement:'2026-11-02',statut:'transmis',cumul:parPct(adjudic(c),.9),description:'Situation n° 2, plantations terminées.'}));
    planifier('2026-10-26',()=>{ const a0=ch01cInit(C,c,'2026-10-26'); a0.lignes.forEach(x=>{ x.brut=r2(s.metre[x.cfc]); }); ccApply(a0); arrete(c,{date:'2026-10-26',statut:'pourSignature',brut:{'421':s.metre['421']},garantie:garantie('banque',ch01cTotaux(a0).net),commentaire:'Décompte transmis à l’entreprise, en attente de sa signature.'}); }); c.niveauPrestations=90; }

  /* architecte : factures de REF.factures (honoraires + frais du contrat), cumul HT arrondi comme la saisie de facture */
  { const som=p=>Object.values(p||{}).reduce((a,v)=>a+v,0), tot=som(M.v2.hht?R.sia:{}), htC=f=>{ const ht=M.v2.hht*som(f.phases)/tot; return Math.round(ht*20)/20+Math.round(ht*M.frais/100*20)/20; };
    R.factures.forEach(f=>{ const paye=!!f.paye, dp=f.paye||A.plus(f.date,f.ech_j||30), st=paye?'debite':f.statut==='Impayée'?'libere':'receptionne';
      if(f.phases) planifier(f.date,()=>situation(cMandat,{dateFacture:f.date,datePaiement:dp,statut:st,facture:f.num,cumul:{'291':r2(htC(f))},description:f.type}));
      else if(f.noteFrais) planifier(f.date,()=>{ const prev=[...C.paiements].reverse().find(y=>y.contratId===cMandat.id); situation(cMandat,{dateFacture:f.date,datePaiement:dp,statut:st,facture:f.num,cumul:{'291':prev.lignes[0].brut+f.montant/(1+R.tva/100)},description:f.type}); });   /* comme calcF : les frais déjà facturés sont déduits de la facture suivante */
      else if(f.sansContrat) planifier(f.date,()=>horsContrat({cfc:'291',contactId:ctx.bureau.contact,brut:htS,dateFacture:f.date,datePaiement:dp,facture:f.num,description:f.lignes[0].lbl}));
      else if(f===fF) planifier(f.date,()=>horsContrat({cfc:'291',contactId:ctx.bureau.contact,brut:htF,tva:R.tvaAvant2024,dateFacture:f.date,datePaiement:dp,facture:f.num,description:R.contrats.faisa.projet})); });
    /* mandataires : leurs notes d'honoraires suivent les acomptes de l'architecte */
    R.factures.filter(f=>f.contrat==='mandat'&&f.phases).forEach((f,i)=>{ const pct=som(f.phases)/tot, jf=A.prochainOuvre(A.plus(f.date,7)); if(jf>auj) return; const dp=A.prochainOuvre(A.plus(jf,30));
      mand.filter(m=>m.cle!=='geom').forEach(m=>planifier(jf,()=>situation(m.x,{dateFacture:jf,datePaiement:dp,statut:dp<=auj?'debite':'libere',cumul:{[m.cfc]:r2(Math.round(m.x.lignes[0].brut*pct*20)/20)},description:'Note d’honoraires n° '+(i+1)+'.'}))); });
    { const f=R.factures.filter(x=>x.contrat==='mandat'&&x.phases).pop(), pc=A.arr(som(f.phases)/tot*100,1); cMandat.niveauPrestations=pc; mand.filter(m=>m.cle!=='geom').forEach(m=>{ m.x.niveauPrestations=pc; }); }
    const g=mand.find(m=>m.cle==='geom'), brutG=g.x.lignes[0].brut;
    [['2024-04-30',.4],['2025-03-31',.7],['2026-03-31',.9]].forEach(([d,p],i)=>{ const dp=moisApres(d); planifier(d,()=>situation(g.x,{dateFacture:d,datePaiement:dp,cumul:{'296.0':r2(Math.round(brutG*p*20)/20)},description:'Note d’honoraires n° '+(i+1)+'.'})); });
    planifier('2026-09-22',()=>{ const a=arrete(g.x,{date:'2026-09-21',brut:{'296.0':brutG},garantie:garantie('sans',0),commentaire:'Mise à jour du cadastre terminée.'}); paiementFinal(a,{date:'2026-09-22',datePaiement:'2026-10-13',description:'Solde après la mise à jour du cadastre.'}); g.x.niveauPrestations=100; }); }

  /* hors contrat */
  const geol=ctx.mand.geol, com=ctx.commune.contact, nett=ctx.ent['287'][0];
  [{cfc:'102',contactId:geol.contact,brut:11800,dateFacture:'2024-04-15',datePaiement:'2024-05-10',dernier:true,description:'Sondages et rapport géotechnique.'},
   {cfc:'511',contactId:com,brut:12400,tva:0,dateFacture:'2024-12-10',datePaiement:'2025-01-08',description:'Émolument du permis de construire.'},
   {cfc:'512',contactId:com,brut:14650,tva:0,dateFacture:'2025-02-20',datePaiement:'2025-03-20',description:'Taxe de raccordement aux eaux et aux égouts.'},
   {cfc:'512',contactId:com,brut:8800,tva:0,dateFacture:'2025-09-15',datePaiement:'2025-10-14',dernier:true,description:'Raccordement électrique et téléréseau.'},
   {cfc:'251',contactId:cont('251'),genre:'regie',brut:5200,dateFacture:'2026-06-30',datePaiement:'2026-07-27',description:'Régies de mise en service.'},
   {cfc:'287',contactId:nett.contact,brut:6850,dateFacture:'2026-08-31',datePaiement:'2026-09-25',dernier:true,description:'Nettoyage de fin de chantier.'},
   {cfc:'511',contactId:com,brut:5200,tva:0,dateFacture:'2026-09-21',datePaiement:'2026-10-20',dernier:true,description:'Permis d’habiter et gabarits.'}].forEach(o=>planifier(o.dateFacture,()=>horsContrat(o)));

  ev.sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:a.n-b.n).forEach(e=>e.f());

  /* ordres de paiement : un ordre débité par mois de paiement depuis janvier 2025, puis l'ordre transmis et l'ordre à contrôler en cours */
  { const banqueMO=C.comptesMO[0]?{nom:C.comptesMO[0].banque,rue:C.comptesMO[0].rue,npa:C.comptesMO[0].npa,lieu:C.comptesMO[0].lieu,clearing:C.comptesMO[0].clearing,iban:C.comptesMO[0].iban}:{};
    const ordre=(date,dv,st,L)=>{ const rn=nouv(), x={id:'o'+rn,refId:rn,numero:ccNextNum(C.ordresPaiement,'numero'),date,dateValeur:dv,maitreOuvrageContactId:ctx.mo.contact,statut:st,statutCode:ST_ORD[st],banque:Object.assign({nom:'',rue:'',npa:'',lieu:'',compte:'',texteCompte:'',swift:'',clearing:'',iban:'',contact:''},banqueMO),paiementIds:L.map(p=>p.id)};
      L.forEach(p=>{ p.ordreId=x.id; p.numeroOrdre=x.numero; }); C.ordresPaiement.push(x); };
    const parMois=new Map(); C.paiements.filter(p=>p.statut==='debite'&&p.datePaiement>='2025-01-01').forEach(p=>{ const m=p.datePaiement.slice(0,7); if(!parMois.has(m)) parMois.set(m,[]); parMois.get(m).push(p); });
    [...parMois.entries()].sort((a,b)=>a[0]<b[0]?-1:1).forEach(([m,L])=>{ const D=L.map(p=>p.datePaiement).sort(); ordre(dernierOuvre(A.plus(D[0],-3)),D[D.length-1],'debite',L); });
    const tr=C.paiements.filter(p=>p.statut==='transmis'), li=C.paiements.filter(p=>p.statut==='libere');
    if(tr.length) ordre(K.decompteFinal,tr.map(p=>p.datePaiement).sort().pop(),'transmis',tr);
    if(li.length) ordre(A.plus(auj,-1),li.map(p=>p.datePaiement).sort().pop(),'controle',li); }

  /* ── contrôle, enregistrement, état intermédiaire ── */
  C.paiements.forEach(p=>{ if(p.contratId&&!C.contrats.some(c=>c.id===p.contratId)) throw new Error('paiement sans contrat'); });
  const G=ccCalc(C).G, dgT=dvCompute(E).T.ttc; if(Math.abs(G.dg-dgT)>.01) throw new Error('ccCalc : DG '+G.dg+' ≠ '+dgT);
  const head={ID:cid,PROJECT_ID:pid,VERSION:'Contrôle des coûts',VERSIONNUMBER:2,STATECODE:1,CHANGEDDATE:K.decompteFinal,USERID:usager,ISMARKEDASDELETED:0,NOTE:'',DOCUMENTLOCK_ID:null};
  const JI='2025-12-31', I=JSON.parse(JSON.stringify(C)); I.id=cidI;
  I.contrats=I.contrats.filter(x=>x.date<=JI); I.paiements=I.paiements.filter(x=>x.dateFacture<=JI); I.mutations=I.mutations.filter(x=>x.date<=JI); I.ecritures=I.ecritures.filter(x=>x.date<=JI); I.arretes=I.arretes.filter(x=>x.date<=JI);
  { const ids=new Set(I.paiements.map(x=>x.id)); I.ordresPaiement=I.ordresPaiement.filter(o=>o.date<=JI).map(o=>({...o,paiementIds:o.paiementIds.filter(x=>ids.has(x))})).filter(o=>o.paiementIds.length);
    I.paiements.forEach(x=>{ if(x.datePaiement>JI){ x.statut='transmis'; x.statutCode=ST_PAY.transmis; } if(x.ordreId&&!I.ordresPaiement.some(o=>o.id===x.ordreId)){ delete x.ordreId; x.numeroOrdre=''; } }); }
  const headI={...head,ID:cidI,VERSION:'Contrôle des coûts (état intermédiaire au '+fr(JI)+')',VERSIONNUMBER:1,STATECODE:2,CHANGEDDATE:'2026-01-12'};
  await A.commit([{t:'costcontroldocument',id:cid,val:head},{t:'costcontrol',id:cid,val:C},{t:'costcontroldocument',id:cidI,val:headI},{t:'costcontrol',id:cidI,val:I}]);
  Object.assign(ctx.couts,{cc:cid,ccInter:cidI,soldes:{soldes:Object.keys(DECOMPTES),aSolder:['281','421']}});
  A.log('contrôle des coûts :',C.contrats.length,'contrats et avenants,',C.mutations.length,'mutations,',C.paiements.length,'paiements,',C.ordresPaiement.length,'ordres,',C.arretes.length,'arrêtés ; DG',r2(G.dg),'révisé',r2(G.dgRevise),'coût probable',r2(G.coutProbable),'état',r2(G.etatCout));
});
})();

/* ═══ AFFAIRE DE TRAVAIL 99TST — MODULE 96 : REGISTRES D'ARCHIVES DE FACTURATION (04.11.2026) ═══
   Anciens modules de Facturation, remplacés par Contrôle des coûts et Descriptifs & devis, encore ouverts dans Archives ▸ Contrôle du coût et Devis (rapport 9 § 3.4, T4, facultatif).
   Crée, d'après AT.REF (positions du devis général validé) :
   - sa_cout['99TST'] : le budget par CFC et l'entreprise adjudicataire de chaque lot, sans écritures (les contrats et les paiements vivent dans le contrôle des coûts, module 47) ;
   - sa_devis['99TST'] : le devis général validé, au TTC.
   Rien dans DS : mémoire du cadre puis localStorage, retirés par le purgeur de ce fichier. N'ajoute rien à ctx. */
(function(){
const A=window.AT;
const FX_ECRIRE=function(S){ const C={tva:S.tva,user:S.user,version:'Contrôle du coût',nver:1,etat:'Brouillon',notes:S.notes,date:S.date,rows:S.pos.map(p=>({id:pvId(),cfc:p.cfc,lbl:p.lib,ent:p.ent,dg:p.ttc})),ecr:[],dgImporte:true};
  ccData[S.code]=C; const ok1=ccPersist();
  dvData[S.code]={aff:S.code,user:S.user,version:'Devis général',nver:2,etat:'Validé',notes:S.notes,tva:S.tva,date:S.date,statut:'en cours',valide:true,pos:S.pos.map(p=>({id:pvId(),cfc:p.cfc,lbl:p.lib,ttc:p.ttc}))};
  const ok2=dvPersist(); return ok1&&ok2; };
A.purgeurs.push(async()=>{ await A.appel(S=>{ if(S.code in ccData){ delete ccData[S.code]; ccPersist(); } if(S.code in dvData){ delete dvData[S.code]; dvPersist(); } return 1; },{code:A.REF.code}); });

A.mod(96,'archives','Registres d’archives de Facturation',async ctx=>{
  const R=A.REF, ttc=(ht,t)=>A.arr(ht*(1+(t==null?R.tva:t)/100));
  const pos=[...R.lots.flatMap(l=>l.dg.map(d=>({cfc:d.cfc,lib:d.lib,ent:(l.ent[0]||{}).n||'',ttc:ttc(d.ht)}))),...R.autresPositions.map(p=>({cfc:p.cfc,lib:p.lib,ent:'',ttc:ttc(p.ht,p.tva)}))]
    .sort((a,b)=>a.cfc.replace(/\./g,'').localeCompare(b.cfc.replace(/\./g,'')));
  const ok=await A.appel(FX_ECRIRE,{code:R.code,tva:R.tva,user:R.equipe.find(e=>e.cle==='cdp').prenom,date:R.calendrier.devisValide,pos,
    notes:'Repris du devis général validé le '+R.calendrier.devisValide.split('-').reverse().join('.')+'. Suivi réel : Chantier ▸ Contrôle des coûts.'});
  if(!ok) throw new Error('module 96 : stockage du cadre refusé');
  A.log('archives : '+pos.length+' positions dans les registres Contrôle du coût et Devis'); });
})();

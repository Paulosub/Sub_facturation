/* ═══ CONTRATS D'ENTREPRISE (06.11.2026, bloc 41 ; demande de Paulo : « dans chantier ajouter un module contrat d'entreprise ») ═══
   Page du projet ▸ Chantier ▸ Contrats d'entreprise. Collection propre sgcontratent (gardée par les reprises ; serveur du NAS : règle « projet modifiable » par PROJECT_ID) :
   {ID <projet>:<aléatoire>, PROJECT_ID, N, DOC_ID (soumission d'origine ou null), CFC, LOT, CONTACT_ID, ETAT brouillon|envoye|signe|resilie, DATE, SIGNE_LE, GENRE, HT, TVA, DEBUT, FIN, RETENUE, REMARQUE,
   AVENANTS:[{id, n, date, objet, ht, signe}], TEXTE:[blocs de la feuille, sg3_descriptif.js], MODIFIE, PAR}.
   Liste : chiffres, lots adjugés sans contrat (entreprise proposée d'une soumission, par articles ou en descriptif ; montant repris de son offre, négociée si elle existe), tableau des contrats ; clic = fiche.
   Fiche, tout sur place et sans fenêtre : bandeau, état, données, montants, avenants, clauses (feuille commune avec les descriptifs). Signé ou résilié : données et clauses verrouillées, les avenants restent ;
   repasser en brouillon demande confirmation. Enregistrement 500 ms après la dernière modification (planif, envoi : un seul à la fois, version vérifiée). Redessin venu d'ailleurs seulement si l'on n'est pas en train de saisir.
   PDF (ouvrirPdf) : papier des contrats, partie données toujours à jour (blocsAuto), puis clauses, puis signatures (sgDsPdf, o.descriptif). Clauses de départ (CLAUSES) : ébauche à faire valider par Paulo, à remplacer par le modèle du bureau.
   Droits : lecture « chantier : lecture » (sgPdomListe) ; modifier = projet modifiable et « chantier : écriture ». Styles <style id="sgce-css">, classes sgce-*. Débogage : window.SGCE. */
(function(){
if(!window.SGDP||!window.SGSV||typeof sgDroit!=='function') return;
const {tete,kpi,btn,E,IC,pl,moT,css:cssSv}=SGSV.outils, T='sgcontratent', ETATS=[['brouillon','Brouillon'],['envoye','Envoyé'],['signe','Signé'],['resilie','Résilié']], ELIB=Object.fromEntries(ETATS), GENRES=['Prix unitaires','Forfait','Prix global'];
const TYPES=[['sou','Rubrique'],['pu','Tiret'],['txt','Texte']];
const ETAT={sel:{},rec:null,cour:null}, SV={t:null,cours:false,encore:false};
const peut=p=>{ try{ return !!((sgAdmin()||sgDroit('projets_modifier','tous')||(sgDroit('projets_modifier','siens')&&sgMesProjets().has(String(p.ID))))&&(sgAdmin()||sgDroit('chantier','ecriture'))); }catch(_){ return false; } };
const num2=n=>svdFmtAmt(+n||0), dmy=d=>d?dfr(d):'', sn=v=>{ const x=parseFloat(String(v==null?'':v).replace(/['’\s]/g,'').replace(',','.')); return isFinite(x)?x:0; };
const CSS=`
.sgce{container-type:inline-size}
.sgce-kp{grid-template-columns:repeat(5,minmax(0,1fr))}
.sgce-t{font-size:13px;font-weight:700;margin:20px 0 8px;padding-bottom:4px;border-bottom:2px solid var(--s-noir);display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.sgce-t small{font-size:12px;font-weight:400;color:var(--s-gris)}
.sgce tr[data-id]{cursor:pointer}
.sgce-etats{display:flex;gap:2px;flex-wrap:wrap}
.sgce-etats button{border:0;background:none;font:inherit;font-size:12.5px;color:var(--s-gris);padding:4px 8px;cursor:pointer;border-bottom:3px solid transparent}
.sgce-etats button:hover{color:var(--s-noir)}
.sgce-etats button.on{color:var(--s-noir);font-weight:700;border-bottom-color:var(--s-nuit)}
.sgce-g{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px 14px}
.sgce-g label{display:flex;flex-direction:column;gap:4px;font-size:11px;font-weight:700;color:var(--s-gris);min-width:0}
.sgce-g .lg{grid-column:span 2}
.sgce-g .tt{grid-column:1/-1}
.sgce .inp{width:100%;box-sizing:border-box;height:34px;border:1.5px solid var(--s-noir);border-radius:0;background:#fff;font-size:13px;font-weight:400;color:var(--s-noir)}
.sgce .inp:disabled{background:var(--s-nuit3);border-color:var(--s-nuit3);color:var(--s-noir);-webkit-text-fill-color:var(--s-noir)}
.sgce textarea.inp{height:auto;padding:6px 8px;font-family:inherit;line-height:1.4;resize:vertical}
.sgce .inp.r{text-align:right;font-variant-numeric:tabular-nums}
.sgce-ent{height:34px;border:1.5px solid var(--s-noir);background:#fff;font:inherit;font-size:13px;font-weight:400;color:var(--s-noir);text-align:left;padding:0 8px;cursor:pointer;width:100%;box-sizing:border-box;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgce-ent:hover{background:var(--s-jaune3)}
.sgce-ent:disabled{background:var(--s-nuit3);border-color:var(--s-nuit3);cursor:default}
.sgce-av td{vertical-align:middle}
.sgce-av .inp{height:28px;font-size:12.5px}
.sgce-x{border:0;background:none;color:var(--s-gris);font-size:16px;line-height:1;cursor:pointer;padding:2px 6px}
.sgce-x:hover{color:var(--s-rouge,#BD1E42)}
.sgce-note{font-size:12px;color:var(--s-gris);margin:6px 0}
.sgce-clauses .sgdp-l{margin-left:0}
.sgce-clauses .sgdp-l[data-t=pu]{margin-left:18px}
.sgce-clauses .sgdp-l[data-t=pu]::before{left:-14px}
.sgce-bar{display:flex;gap:2px;flex-wrap:wrap;align-items:center;margin-bottom:6px}
.sgce-bar .ib{border:0!important;background:transparent!important;box-shadow:none!important;height:30px;font-size:12.5px;font-weight:700;color:var(--s-noir)}
.sgce-bar .ib:hover{background:var(--s-jaune3)!important}
.sgce-bar .ib.on{box-shadow:inset 0 -3px 0 var(--s-nuit)!important}
@container (max-width:760px){.sgce-kp{grid-template-columns:repeat(2,minmax(0,1fr))}.sgce-g{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;
const css=()=>{ if(!document.getElementById('sgce-css')){ const s=document.createElement('style'); s.id='sgce-css'; s.textContent=CSS; document.head.appendChild(s); } if(cssSv) cssSv(); SGDP.css&&SGDP.css(); };

/* ── données ── */
const contrats=p=>DS.all(T).filter(c=>String(c.PROJECT_ID)===String(p.ID)).sort((a,b)=>String(a.CFC||'').localeCompare(String(b.CFC||''),'fr',{numeric:true})||(+a.N||0)-(+b.N||0));
const ttc=(ht,tva)=>svdRnd((+ht||0)*(1+(+tva||0)/100),true);   /* arrondi aux 5 centimes, comme les offres */
const avHT=c=>(c.AVENANTS||[]).reduce((s,a)=>s+(+a.ht||0),0);
const totalTTC=c=>ttc((+c.HT||0)+avHT(c),c.TVA);
const entNom=c=>{ const x=c.CONTACT_ID?DS.get('contact',c.CONTACT_ID):null; return x?contactName(x):''; };
/* offre de l'entreprise proposée : négociée si elle existe (comparatif détaillé, sinon comparatif bref) */
const offre=(S,e)=>{ const c1=((S.unites||{}).C1||{}).chapitres||[], tr=S.travail&&S.travail.modifie&&(S.travail.detail||{})[e.contactId], src=tr||(c1.length?e.detail:e.bref)||{}, O=src.offre||{}, N=src.negociee||{}, x=(+N.net||0)!==0?N:O, net=+x.net||0, tva=+x.tva||0; return {ht:net-tva,net,tva}; };
const lots=p=>{ const R=[], faits=new Set(contrats(p).filter(c=>c.ETAT!=='resilie').map(c=>String(c.DOC_ID||'')));   /* contrat résilié : le lot peut être rétabli */ DS.by('devisdocument','PROJECT_ID',p.ID).filter(d=>!+d.ISMARKEDASDELETED).forEach(d=>{ const S=DS.get('soumission',d.ID), e=S&&(S.entreprises||[]).find(x=>x.proposee&&+x.contactId>0); if(e&&!faits.has(String(d.ID))) R.push({d,S,e,o:offre(S,e)}); }); return R.sort((a,b)=>String(a.d.BKP||'').localeCompare(String(b.d.BKP||''),'fr',{numeric:true})); };
const CLAUSES=[['sou','Objet'],['txt','L’entreprise s’engage à exécuter les travaux du lot désigné ci-dessus, conformément aux pièces contractuelles et aux règles de l’art.'],
  ['sou','Pièces contractuelles'],['txt','Font partie du contrat, dans l’ordre de priorité suivant :'],['pu','Le présent contrat'],['pu','Le descriptif ou la soumission, avec l’offre de l’entreprise'],['pu','Les conditions générales signées par l’entreprise'],['pu','Les plans du dossier d’exécution'],['pu','La norme SIA 118'],
  ['sou','Prix'],['pu','Aucune plus-value ne sera acceptée durant le chantier sans validation préalable par la direction des travaux.'],['pu','Les prix comprennent toutes les prestations nécessaires à la bonne exécution de l’ouvrage.'],
  ['sou','Délais'],['pu','L’entreprise respecte le planning établi par la direction des travaux.'],
  ['sou','Paiements'],['pu','Les situations et la facture finale sont adressées à la direction des travaux pour contrôle.'],
  ['sou','Garanties'],['pu','Les délais de garantie et de dénonciation des défauts sont ceux de la norme SIA 118.'],
  ['sou','Droit applicable'],['pu','Le droit suisse est applicable. Le for est au lieu de l’ouvrage.']];
const clauses=()=>CLAUSES.map(([t,x])=>SGDP.nouv(t,x));
async function creer(p,lot){ const N=contrats(p).reduce((m,c)=>Math.max(m,+c.N||0),0)+1, id=p.ID+':'+Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36), d=lot&&lot.d, S=lot&&lot.S, ao=(S&&S.appelOffres)||{};
  const rec={ID:id,PROJECT_ID:p.ID,N,DOC_ID:d?d.ID:null,CFC:d?d.BKP||'':'',LOT:d?d.AWARDINGTEXT||'':'',CONTACT_ID:lot?lot.e.contactId:null,ETAT:'brouillon',DATE:today(),SIGNE_LE:'',GENRE:'Prix unitaires',HT:lot?Math.round(lot.o.ht*100)/100:0,TVA:svdVatDefault(),DEBUT:ao.debutTravaux&&/^\d{4}-/.test(ao.debutTravaux)?ao.debutTravaux:'',FIN:ao.finTravaux&&/^\d{4}-/.test(ao.finTravaux)?ao.finTravaux:'',RETENUE:'',REMARQUE:'',AVENANTS:[],TEXTE:clauses(),MODIFIE:today(),PAR:ME.id};
  await DS.commit([{t:T,id,val:rec}]); ETAT.sel[p.ID]=id; ETAT.rec=null; }

/* ── enregistrement ── */
const seq=id=>(DS.S[T]||{})[id]||0;
async function envoi(rec){ if(SV.cours){ SV.encore=true; return; } SV.cours=true; SV.echec=false; try{ do{ SV.encore=false; await DS.commit([{t:T,id:rec.ID,val:JSON.parse(JSON.stringify(rec)),bseq:seq(rec.ID)}]); }while(SV.encore); }catch(e){ SV.echec=true; if(e&&e.conflict){ ETAT.rec=null; if(ETAT.cour&&ETAT.cour.box.isConnected) ETAT.cour.dessiner(); } } finally{ SV.cours=false; } }
const vider=async rec=>{ if(SV.t){ clearTimeout(SV.t); SV.t=null; await envoi(rec); } while(SV.cours) await new Promise(r=>setTimeout(r,60)); return !SV.echec; };
const planif=rec=>{ rec.MODIFIE=today(); rec.PAR=ME.id; clearTimeout(SV.t); SV.t=setTimeout(()=>{ SV.t=null; envoi(rec); },500); };

/* ── PDF : données à jour, clauses, signatures ── */
function blocsAuto(p,c){ const kv=(x,v)=>({t:'kv',x,v:String(v==null?'':v)}), txt=x=>({t:'txt',x}), sou=x=>({t:'sou',x}), ad=x=>{ if(!x) return []; const L=adrLines(x); return x.NAME1||x.NAME2||x.NAME3?L:[contactName(x),...L].filter(Boolean); }; const e=c.CONTACT_ID?DS.get('contact',c.CONTACT_ID):null, m=DS.by('projectmember','PROJECT_ID',p.ID).find(x=>x.TEAMROLECODE===8), mo=m?DS.get('contact',m.CONTACT_ID):null, af=p.CONTACT1_ID?DS.get('contact',p.CONTACT1_ID):null, R=[];
  R.push({t:'sec',x:[c.CFC?'CFC '+c.CFC:'',c.LOT].filter(Boolean).join(' – ')||'Contrat'});
  R.push(sou('Maître de l’ouvrage'),...(mo?ad(mo):[moT(p)||'à compléter']).map(txt),sou('Direction des travaux'),txt('Substances Architectes Sàrl'),txt('Rue de la Gare 12, 1096 Cully'),sou('Entreprise'),...(e?ad(e):['à compléter']).map(txt));
  R.push(sou('Ouvrage'),txt(p.TITLE||''),...(af?[txt([af.STREET,locality(af)].filter(Boolean).join(', '))]:[]));
  R.push(sou('Montant du contrat'),kv('Genre de contrat',c.GENRE||''),kv('Montant HT','CHF '+num2(c.HT)),...(c.AVENANTS||[]).map(a=>kv('Avenant '+a.n+(a.objet?' – '+a.objet:''),'CHF '+num2(a.ht))),kv('TVA '+num(+c.TVA||0,1)+' %','CHF '+num2(ttc((+c.HT||0)+avHT(c),c.TVA)-((+c.HT||0)+avHT(c)))),kv('Montant TTC','CHF '+num2(totalTTC(c))));
  if(c.DEBUT||c.FIN) R.push(sou('Délais d’exécution'),...(c.DEBUT?[kv('Début des travaux',dmy(c.DEBUT))]:[]),...(c.FIN?[kv('Fin des travaux',dmy(c.FIN))]:[]));
  if(+c.RETENUE) R.push(sou('Retenue de garantie'),txt(num(+c.RETENUE,1)+' % du montant des travaux.'));
  return R; }
async function ouvrirPdf(p,c){ try{ const af=p.CONTACT1_ID?DS.get('contact',p.CONTACT1_ID):null, nom=entNom(c), m=DS.by('projectmember','PROJECT_ID',p.ID).find(x=>x.TEAMROLECODE===8), mo=m?contactName(DS.get('contact',m.CONTACT_ID)):moT(p);
    const b=await SGDP.pdfDoc({titre:'Contrat d’entreprise '+[c.CFC,c.LOT].filter(Boolean).join(' '),type:'Contrat d’entreprise',description:'Contrat d’entreprise',entete:{g1:p.NUMBER||'',g2:[p.TITLE,dmy(c.DATE)].filter(Boolean).join(' – '),d1:(af&&af.STREET)||'',d2:af?locality(af):(p.LOCATION||'')},lettre:'',bande:'Contrat d’entreprise',
      blocs:[...blocsAuto(p,c),...(c.TEXTE||[]).map(b=>({t:b.t,x:b.x,b:!!b.b}))],signatures:[{t:'Le maître de l’ouvrage',n:mo||''},{t:'L’entreprise',n:nom||''}]});
    sgVisionneuse(b,'Contrat '+[p.NUMBER,c.CFC,c.LOT].filter(Boolean).join(' ')+'.pdf'); }catch(e){ console.error(e); toast('Le PDF n’a pas pu être créé : '+(e&&e.message||e),true); } }

/* ── écran ── */
const lignesTableau=L=>L.map(c=>{ const a=avHT(c); return '<tr data-id="'+E(c.ID)+'"><td class="nw"><b>'+E(c.CFC||'—')+'</b></td><td>'+E(c.LOT||'(sans lot)')+'</td><td>'+E(entNom(c)||'—')+'</td><td class="nw">'+E(c.GENRE||'')+'</td><td class="nw">'+E(dmy(c.DATE))+'</td><td class="r nw">'+num2(ttc(c.HT,c.TVA))+'</td><td class="r nw">'+(a?num2(ttc(a,c.TVA)):'')+'</td><td class="r nw"><b>'+num2(totalTTC(c))+'</b></td><td class="nw">'+E(ELIB[c.ETAT]||'')+(c.ETAT==='signe'&&c.SIGNE_LE?' '+E(dmy(c.SIGNE_LE)):'')+'</td></tr>'; }).join('');
function liste(p){ const L=contrats(p), A=lots(p), sign=L.filter(c=>c.ETAT==='signe'), vivants=L.filter(c=>c.ETAT!=='resilie'), tot=vivants.reduce((s,c)=>s+ttc(c.HT,c.TVA),0), av=vivants.reduce((s,c)=>s+ttc(avHT(c),c.TVA),0), ec=peut(p);
  return '<div class="sgsv sgce">'+tete(p.NUMBER||'','Contrats d’entreprise',p.TITLE||'',[moT(p)?'Maître de l’ouvrage : '+moT(p):'',pl(L.length,'contrat')].filter(Boolean).join(' · '),ec?btn('new','Nouveau contrat','plus',1):'')
    +'<div class="nx-kpis sgsv-kp sgce-kp">'+kpi('Contrats',String(L.length),'')+kpi('Signés',String(sign.length),'')+kpi('À établir',String(A.length),'lots adjugés')+kpi('Montant des contrats',num2(tot)+'<small>CHF</small>','TTC')+kpi('Avenants',num2(av)+'<small>CHF</small>','TTC')+'</div>'
    +(A.length?'<div class="sgce-t">Lots adjugés sans contrat <small>entreprise proposée dans la soumission</small></div><table class="nx-tbl"><thead><tr><th>CFC</th><th>Lot</th><th>Entreprise proposée</th><th class="r">Offre TTC</th><th></th></tr></thead><tbody>'+A.map(x=>'<tr><td class="nw"><b>'+E(x.d.BKP||'—')+'</b></td><td>'+E(x.d.AWARDINGTEXT||'')+'</td><td>'+E(svcName(x.e))+'</td><td class="r nw">'+num2(x.o.net)+'</td><td class="r">'+(ec?btn('lot','Établir le contrat','',0,'',' data-d="'+x.d.ID+'"'):'')+'</td></tr>').join('')+'</tbody></table>':'')
    +'<div class="sgce-t">Contrats</div>'+(L.length?'<table class="nx-tbl"><thead><tr><th>CFC</th><th>Lot</th><th>Entreprise</th><th>Genre</th><th>Date</th><th class="r">Contrat TTC</th><th class="r">Avenants TTC</th><th class="r">Total TTC</th><th>État</th></tr></thead><tbody>'+lignesTableau(L)+'</tbody></table>':'<p class="sgce-note">Aucun contrat pour ce projet. Choisissez l’entreprise dans le comparatif de la soumission : le lot apparaît ici, prêt à être établi.</p>')+'</div>'; }
function fiche(C,p,c,I){ const ec=peut(p), v=c.ETAT==='signe'||c.ETAT==='resilie', ro=!ec||v, ds=ro?' disabled':'', fld=(l,k,typ,cl)=>'<label class="'+(cl||'')+'">'+E(l)+'<input class="inp'+(typ==='num'?' r':'')+'" data-f="'+k+'" type="'+(typ==='date'?'date':'text')+'" value="'+E(typ==='num'?(k==='HT'?num2(c[k]):(c[k]==null?'':c[k])):(c[k]||''))+'"'+ds+'></label>';
  C.innerHTML='<div class="sgsv sgce">'+tete(c.CFC||'—','Contrat d’entreprise · '+(ELIB[c.ETAT]||''),c.LOT||'(sans lot)',[entNom(c),p.NUMBER].filter(Boolean).join(' · '),(ec&&c.ETAT==='brouillon'?btn('suppr','Supprimer le contrat',''):'')+btn('liste','Contrats','')+btn('pdf','Ouvrir en PDF','pdf',1))
    +'<div class="sgce-etats" role="group" aria-label="État du contrat">'+ETATS.map(([k,t])=>'<button type="button" data-etat="'+k+'" class="'+(c.ETAT===k?'on':'')+'"'+(ec?'':' disabled')+'>'+E(t)+'</button>').join('')+'</div>'
    +'<div class="sgce-t">Données du contrat'+(v?' <small>verrouillé : repassez en brouillon pour modifier</small>':'')+'</div><div class="sgce-g"><label class="lg">Entreprise<button type="button" class="sgce-ent" data-a="ent"'+ds+'>'+E(entNom(c)||'Choisir…')+'</button></label>'+fld('CFC','CFC')+fld('Lot','LOT')+'<label>Genre de contrat<select class="inp" data-f="GENRE"'+ds+'>'+GENRES.map(g=>'<option'+(c.GENRE===g?' selected':'')+'>'+E(g)+'</option>').join('')+'</select></label>'+fld('Date du contrat','DATE','date')+fld('Début des travaux','DEBUT','date')+fld('Fin des travaux','FIN','date')+fld('Montant HT','HT','num')+fld('TVA %','TVA','num')+'<label>Montant TTC<input class="inp r" data-ttc value="'+num2(ttc(c.HT,c.TVA))+'" disabled></label>'+fld('Retenue de garantie %','RETENUE','num')+(c.ETAT==='signe'?fld('Signé le','SIGNE_LE','date','lg').replace(' disabled',ec?'':' disabled'):'')+'<label class="tt">Remarque<textarea class="inp" rows="2" data-f="REMARQUE"'+ds+'>'+E(c.REMARQUE||'')+'</textarea></label></div>'
    +'<div class="sgce-t">Avenants <small data-tot>'+'</small></div><table class="nx-tbl sgce-av"><thead><tr><th style="width:44px">N°</th><th style="width:150px">Date</th><th>Objet</th><th class="r" style="width:130px">Montant HT</th><th style="width:70px">Signé</th><th style="width:34px"></th></tr></thead><tbody>'+(c.AVENANTS||[]).map(a=>'<tr data-av="'+E(a.id)+'"><td>'+E(a.n)+'</td><td><input class="inp" type="date" data-v="date" value="'+E(a.date||'')+'"'+(ec?'':' disabled')+'></td><td><input class="inp" data-v="objet" value="'+E(a.objet||'')+'"'+(ec?'':' disabled')+'></td><td><input class="inp r" data-v="ht" value="'+num2(a.ht)+'"'+(ec?'':' disabled')+'></td><td><input type="checkbox" data-v="signe"'+(a.signe?' checked':'')+(ec?'':' disabled')+'></td><td>'+(ec?'<button type="button" class="sgce-x" data-a="avsup" aria-label="Supprimer l’avenant" title="Supprimer l’avenant">×</button>':'')+'</td></tr>').join('')+'</tbody></table>'+(ec?'<div style="margin-top:6px">'+btn('avplus','Ajouter un avenant','plus')+'</div>':'')
    +'<div class="sgce-t">Clauses du contrat <small>les données ci-dessus s’ajoutent d’office en tête du PDF</small></div><div class="sgce-bar"></div><div class="sgce-clauses"></div></div>';
  const bandeau=()=>{ const t=C.querySelector('.sgfh-tete'); if(!t) return; const g=t.querySelector('.sgfh-ini'), h2=t.querySelector('h2'), m=t.querySelector('.sgfh-meta'); if(g) g.textContent=c.CFC||'—'; if(h2) h2.textContent=c.LOT||'(sans lot)'; if(m) m.textContent=[entNom(c),p.NUMBER].filter(Boolean).join(' · '); };
  const tot=()=>{ const t=C.querySelector('[data-tot]'); if(t) t.textContent=(c.AVENANTS||[]).length?'Total du contrat avec avenants : CHF '+num2(totalTTC(c))+' TTC':''; const x=C.querySelector('[data-ttc]'); if(x) x.value=num2(ttc(c.HT,c.TVA)); }; tot();
  const host=C.querySelector('.sgce-clauses'), bar=C.querySelector('.sgce-bar'); const F=SGDP.feuille(host,{blocs:()=>c.TEXTE||(c.TEXTE=[]),modifie:()=>planif(c),ce:!ro,bar:()=>bar}); if(!ro){ bar.append(...SGDP.outils(F,TYPES)); bar.addEventListener('mousedown',e=>{ if(e.target.closest('.ib')) e.preventDefault(); }); } else bar.remove();
  const box=C.firstElementChild; box.addEventListener('change',e=>{ const t=e.target, k=t.dataset&&t.dataset.f, av=t.closest&&t.closest('tr[data-av]'); if(k){ c[k]=k==='HT'||k==='TVA'||k==='RETENUE'?sn(t.value):t.value; if(k==='HT') t.value=num2(c.HT); planif(c); tot(); bandeau(); } else if(av&&t.dataset.v){ const a=(c.AVENANTS||[]).find(x=>x.id===av.dataset.av); if(!a) return; if(t.dataset.v==='signe') a.signe=t.checked; else if(t.dataset.v==='ht'){ a.ht=sn(t.value); t.value=num2(a.ht); } else a[t.dataset.v]=t.value; planif(c); tot(); } });
  box.addEventListener('click',e=>{ const b=e.target.closest('[data-a],[data-etat]'); if(!b) return; const a=b.dataset.a, et=b.dataset.etat;
    if(a==='liste'){ vider(c).then(ok=>{ if(!ok){ toast('Contrat non enregistré : le serveur ne répond pas. La fiche reste ouverte.',true); return; } ETAT.sel[p.ID]=null; ETAT.rec=null; I.dessiner(); }); } else if(a==='pdf') ouvrirPdf(p,c);
    else if(a==='suppr') sgConfirm('Supprimer ce contrat ? Cette action est irréversible.',async()=>{ clearTimeout(SV.t); SV.t=null; while(SV.cours) await new Promise(r=>setTimeout(r,60)); try{ await DS.commit([{t:T,id:c.ID,val:null,bseq:seq(c.ID)}]); }catch(_){ return; } ETAT.sel[p.ID]=null; ETAT.rec=null; I.dessiner(); });
    else if(a==='ent') pickContact('Entreprise du contrat',x=>{ if(!x) return; c.CONTACT_ID=x.ID; planif(c); b.textContent=entNom(c)||'Choisir…'; bandeau(); });
    else if(a==='avplus'){ const L=c.AVENANTS||(c.AVENANTS=[]); L.push({id:Date.now().toString(36)+L.length,n:L.reduce((m,x)=>Math.max(m,+x.n||0),0)+1,date:today(),objet:'',ht:0,signe:false}); planif(c); I.garder=true; I.dessiner(); }
    else if(a==='avsup'){ const id=b.closest('tr').dataset.av; sgConfirm('Supprimer cet avenant ?',()=>{ c.AVENANTS=(c.AVENANTS||[]).filter(x=>x.id!==id); planif(c); I.garder=true; I.dessiner(); }); }
    else if(et&&et!==c.ETAT){ const faire=()=>{ c.ETAT=et; if(et==='signe'&&!c.SIGNE_LE) c.SIGNE_LE=today(); planif(c); I.garder=true; I.dessiner(); }; if(v&&et==='brouillon'||v&&et==='envoye') sgConfirm('Ce contrat est verrouillé. Le rouvrir pour le modifier ?',faire); else faire(); } }); }
function ouvrir(C,p){ css(); const I={box:null,garder:false,dessiner:null}; ETAT.cour=I;
  I.dessiner=()=>{ const id=ETAT.sel[p.ID], d=id?DS.get(T,id):null; if(id&&d){ const c=I.garder&&ETAT.rec&&ETAT.rec.ID===id?ETAT.rec:(ETAT.rec=JSON.parse(JSON.stringify(d))); I.garder=false; fiche(C,p,c,I); } else { ETAT.rec=null; C.innerHTML=liste(p); } I.box=C.firstElementChild; };
  C.onclick=e=>{ if(ETAT.sel[p.ID]) return; const b=e.target.closest('[data-a]'), tr=e.target.closest('tr[data-id]'); const cree=l=>{ if(I.cree) return; I.cree=true; creer(p,l).then(I.dessiner).finally(()=>{ I.cree=false; }); }; if(b&&b.dataset.a==='new'){ cree(null); return; } if(b&&b.dataset.a==='lot'){ const L=lots(p).find(x=>String(x.d.ID)===b.dataset.d); if(L) cree(L); return; } if(tr){ ETAT.sel[p.ID]=tr.dataset.id; I.dessiner(); } };
  C.innerHTML='<p class="sgce-note">Chargement…</p>'; DS.need([...SV_NEED,T]).then(I.dessiner).catch(e=>{ console.error(e); C.innerHTML='<p class="sgce-note">Lecture impossible.</p>'; }); }
DS.on(ts=>{ const I=ETAT.cour; if(!I||!I.box||!I.box.isConnected||!hit(ts,T,'devisdocument','soumission','contact','contactowner')) return; if(I.box.contains(document.activeElement)||SV.t||SV.cours) return; setTimeout(()=>{ if(I.box&&I.box.isConnected&&!I.box.contains(document.activeElement)) I.dessiner(); },0); });
window.sgContratsEntModule=function(C,p){ try{ ouvrir(C,p); }catch(e){ console.error(e); C.textContent='Contrats d’entreprise : erreur — '+String(e&&e.message||e); } };
window.sgContratsEntCompte=p=>{ try{ const n=contrats(p).length, a=DS.loaded.has('soumission')?lots(p).length:0; return (n?n+' contrat'+(n>1?'s':''):'aucun contrat')+(a?' · '+a+' à établir':''); }catch(_){ return ''; } };
window.SGCE={ETAT,contrats,lots,offre,blocsAuto,CLAUSES};
})();

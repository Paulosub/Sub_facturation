/* ═══ 32. OFFRES, CONTRATS ET FACTURES DE L'AFFAIRE (01.11.2026, demandes de Paulo : « dans projets, offre d'honoraires : créer une liste
   des offres d'honoraires pour l'affaire, designer selon le reste de l'app ; mettre la version actuelle dans archives, ne pas effacer ; lorsque
   je crée un contrat, ajouter la version que j'avais développée et pas la version de Delta », puis « toutes les offres sont dans Offres et
   comprennent la liste de toutes les offres retenues, annulées, etc. ; dans Contrats honoraires uniquement les contrats signés ; les versions
   signées restent également dans Offres d'honoraires ; sous le titre, le nombre d'offres et le nombre d'offres annulées ou refusées ») ═══
   Page du projet ▸ Honoraires et facturation : trois domaines du moteur (feDomain : calculs d'honoraires de l'ancien logiciel ; ctDomain :
   contrats de l'ancien logiciel ; ivDomain : factures de l'ancien logiciel, voir « FACTURES DE L'AFFAIRE » plus bas) sont remplacés par les offres et contrats du CALCUL D'HONORAIRES DU BUREAU (Facturation) reliés à l'affaire
   (sgContratsDuProjet : code d'affaire, sinon lien manuel sg3_liens) — même page pour les deux (dessiner) :
   – « Offres d'honoraires » : TOUTES les offres (en cours = brouillon ou envoyée, retenues = signées ou terminées, annulées ou refusées —
     Facturation n'a qu'un état « annulé » pour une offre non retenue) ; filtre, chiffres, tableau ; Ouvrir (PDF de la dernière version),
     Modifier (calcul d'honoraires) ; « Nouvelle offre d'honoraires » ; « Relier une offre… » (offre sans affaire) ;
   – « Contrats honoraires » : les contrats SIGNÉS seulement (signé ou terminé, jamais annulé) ; Ouvrir, Facturer, Modifier (un contrat
     signé est verrouillé : Facturation crée une nouvelle version, l'avenant) ; « Nouveau contrat d'honoraires ».
   Créer une offre ou un contrat = calcul d'honoraires de Facturation pour l'affaire, jamais le contrat du moteur ; depuis le 01.11.2026 le calcul,
   les PDF et la saisie des factures s'ouvrent DANS la page du projet, et « Offres d'honoraires » / « Contrats honoraires » montrent la liste
   « Contrats d'honoraires » de Facturation elle-même, limitée aux offres / aux contrats signés de l'affaire (voir « FACTURATION DANS LA PAGE
   DU PROJET » plus bas).
   Tuiles de la page du projet : « n offres · x annulées ou refusées », « n contrats signés » (sgPdomCompte enveloppé ; Facturation lue à la
   demande, chiffres mis à jour quand elle est chargée).
   Archives ▸ Honoraires (ancien) ▸ Offres d'honoraires et Contrats honoraires (anc-offres, anc-contrats) gardent les écrans d'origine ; rien
   n'est effacé (calculs « projectfee » et contrats « projectcontract » restent dans la base).
   Droits : les tuiles suivent sgPdomListe (contrats : lecture) ; créer / modifier / relier = SG_VUE_DROIT['fx-calchono'] ; Facturer =
   SG_VUE_DROIT['fx-saisie'], jamais pour le profil collaborateur (ni facturé ni solde) ; montants masqués si sgFinVerrou() (« Déverrouiller »
   si c'est le code d'accès). Styles : <style id="sgof-css">, classes sgof-*. Débogage : window.SGOF. */
(function(){
if(typeof feDomain!=='function'||typeof ctDomain!=='function'||typeof ivDomain!=='function'||typeof sgContratsDuProjet!=='function') return;

const E=s=>nxE(s==null?'':String(s));
const ANCIEN={'Offres d’honoraires':'anc-offres','Contrats honoraires':'anc-contrats','Factures':'anc-factures'};
const vueId=()=>{ try{ return typeof VIEW!=='undefined'&&VIEW?String(VIEW.id||''):''; }catch(_){ return ''; } };
const vueOk=v=>typeof sgVueOk!=='function'||sgVueOk(v);
const collab=()=>typeof SG_ACC!=='undefined'&&SG_ACC&&SG_ACC.profil==='collab';
const verrouCode=()=>typeof sgOuvert==='function'&&!sgOuvert()&&typeof sgProtege==='function'&&(sgProtege('finances')||sgProtege('facturation'));
const pl=(n,s,p)=>n+' '+(n>1?(p||s+'s'):s);
const frl=(l,v)=>l+' : <b>'+nxCHF(v)+'</b> CHF';   /* ligne des frais sous un montant d'honoraires (01.11.2026) */

/* état d'une offre : en cours (brouillon, envoyée), retenue (signée ou terminée), annulée ou refusée */
const cle=c=>c.annule?'ann':c.signe||c.termine?'ret':'cours';
const signe=c=>!c.annule&&!!(c.signe||c.termine);
const ETAT_OF={cours:'En cours',ret:'Retenue',ann:'Annulée ou refusée'};
const MODES={
  offres:{dom:'Offres d’honoraires',lb:'Offres d’honoraires',ls:'sg3_offres_filtre',garde:()=>true,
    filtres:[['','Toutes'],['cours','En cours'],['ret','Retenues'],['ann','Annulées ou refusées']],fil:(x,f)=>x.k===f,
    nouv:'Nouvelle offre d’honoraires',nouvT:'Calcul d’honoraires du bureau (Facturation) pour cette affaire : l’offre figure ici dès qu’elle est enregistrée',
    vide:'Aucune offre d’honoraires pour cette affaire.',titre:'Offres'},
  contrats:{dom:'Contrats honoraires',lb:'Contrats d’honoraires',ls:'sg3_contrats_filtre',garde:signe,
    filtres:[['','Tous'],['cours','En cours'],['ter','Terminés']],fil:(x,f)=>f==='ter'?!!x.c.termine:!x.c.termine,
    nouv:'Nouveau contrat d’honoraires',nouvT:'Calcul d’honoraires du bureau (Facturation) pour cette affaire : l’offre devient un contrat quand elle est marquée « signé » (Facturation ▸ Contrats)',
    vide:'Aucun contrat signé pour cette affaire. Une offre devient un contrat quand elle est marquée « signé » dans Facturation ▸ Contrats ; toutes les offres sont dans « Offres d’honoraires ».',titre:'Contrats signés'},
  factures:{dom:'Factures',lb:'Factures'}};

/* offres de l'affaire, dans l'ordre chronologique (date du contrat ; sans date à la fin, puis par code), comme la fiche de l'affaire */
function lignes(p,D){ const tva=c=>(c.tva!=null&&c.tva!==''&&isFinite(+c.tva)?+c.tva:8.1)/100;   /* honoraires / frais d'une facture : ttcF, fraisF (plus bas) */
  return sgContratsDuProjet(p,D).map(c=>{ const ci=sgContratInfo(c), ht=+c.hht||(+c.httc||0)/(1+tva(c)), tt=+c.httc||(+c.hht||0)*(1+tva(c));
      const fs=(D.f||[]).filter(f=>f.contrat_id===c.id&&!/annul/i.test(f.statut||''));
      /* frais contractuels (01.11.2026, demande de Paulo « séparer les honoraires contractuels des frais ») : % du contrat (c.frais) sur ses
         honoraires TTC, comme Facturation (frais % appliqué aux honoraires) ; frais facturés = _fttc des factures (sinon fttc) */
      const fp=+c.frais||0;
      return {c,ci,et:sgContratEtendue(c),ht,tt,fp,fr:tt*fp/100,fs,fa:fs.reduce((s0,f)=>s0+ttcF(f),0),ffa:fs.reduce((s0,f)=>s0+fraisF(f),0),k:cle(c)}; })
    .sort((a,b)=>(!a.ci.date-!b.ci.date)||cmp(String(a.ci.date||''),String(b.ci.date||''))||cmp(String(a.c.id),String(b.c.id))); }
const compte=(p,D)=>{ const L=lignes(p,D); return {n:L.length,ann:L.filter(x=>x.k==='ann').length,sig:L.filter(x=>signe(x.c)).length}; };

const CSS=`
.sgof-box{flex:1 1 auto;min-height:0;overflow:auto}
.sgof-charge{padding:24px;color:var(--s-gris)}
.sgof-err{padding:20px 24px;color:var(--s-rouge)}
.sgof{container:sgof/inline-size;padding:16px 24px 28px;max-width:1400px;box-sizing:border-box}
.sgof .sgfh-tete{margin:0}
.sgof-hact{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-left:auto}
.sgof-hact .inp{max-width:300px;height:36px}
.sgof-kp{margin:14px 0 26px;grid-template-columns:repeat(5,minmax(0,1fr))}
@container sgof (max-width:860px){.sgof-kp{grid-template-columns:repeat(3,minmax(0,1fr))}}
.sgof-kp.sgof-kp6{grid-template-columns:repeat(6,minmax(0,1fr))}
@container sgof (max-width:1100px){.sgof-kp.sgof-kp6{grid-template-columns:repeat(3,minmax(0,1fr))}}
.sgof-kp .nx-kpi.on{box-shadow:inset 0 -3px 0 var(--s-nuit)}
.sgof-neg{color:var(--s-rouge)}
.sgof-verr{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 18px;padding:8px 12px;border-left:3px solid var(--s-noir);background:var(--s-jaune3);font-size:12.5px}
.sgof-verr svg{width:16px;height:16px}
.sgof-sec{border-top:2px solid var(--s-noir)}
.sgof-sech{display:flex;align-items:center;gap:8px 14px;flex-wrap:wrap;padding:10px 0 8px}
.sgof-sech h3{margin:0;font-size:15px;font-weight:700}
.sgof-sech .n{font-size:12px;color:var(--s-gris)}
.sgof-fil{margin-left:auto;display:inline-flex;align-items:baseline;flex-wrap:wrap;gap:2px 14px}
.sgof-fil button{border:0;background:none;padding:2px 0 3px;font:inherit;font-size:12.5px;font-weight:400;color:var(--s-gris);cursor:pointer;white-space:nowrap}
.sgof-fil button:hover{color:var(--s-noir)}
.sgof-fil button.on{color:var(--s-noir);font-weight:700;box-shadow:inset 0 -2px 0 var(--s-nuit)}
.sgof-fil button:focus-visible{outline:2px solid var(--s-nuit);outline-offset:2px}
.sgof-fil button i{font-style:normal;font-size:11px;margin-left:4px;color:var(--s-gris)}
.sgof-t{width:100%}
.sgof-t td{vertical-align:middle}
.sgof-t td.of b{font-weight:700}
.sgof-t td.of .nat{display:inline-block;margin-left:6px;font-size:11px;font-weight:700;padding:1px 6px;border:1px solid var(--s-noir)}
.sgof-t td.of small{display:block;font-size:11px;color:var(--s-gris);margin-top:2px}
.sgof-t td.com{min-width:160px}
.sgof-t td .pc{display:block;font-size:11px;color:var(--s-gris)}
.sgof-t tr.ann td{color:var(--s-gris)}
.sgof-t tr.ann td.of b{color:var(--s-gris);text-decoration:line-through;text-decoration-thickness:1px}
.sgof-t tr.tot td{border-top:2px solid var(--s-noir);border-bottom:0;font-weight:700}
.sgof-vide{padding:18px 0 6px;font-size:13px;line-height:1.5;max-width:760px}
.sgof-vide .nx-btn{margin-top:12px}
.sgof-pos{color:#5d7a10}
.sgof-info{margin:0 0 10px;font-size:12.5px;line-height:1.5}
.sgof-sit td{vertical-align:middle}
.sgof-sit .pp{color:var(--s-nuit);margin-right:4px}
.sgof-sit tr.ch td{background:var(--s-jaune3)}
.sgof-g{position:relative;height:6px;background:var(--s-nuit3);min-width:90px;margin:2px 0 4px}
.sgof-g>i{position:absolute;left:0;top:0;bottom:0;background:var(--s-nuit)}
.sgof-g.dp>i{background:var(--s-rouge)}
.sgof-av{display:inline-flex;align-items:center;gap:4px;white-space:nowrap}
.sgof-av input{width:58px;height:30px;box-sizing:border-box;border:1.5px solid var(--s-noir);border-radius:0;background:#fff;padding:0 6px;font:inherit;font-size:13px;font-weight:700;text-align:right}
.sgof-av input:disabled{border-color:var(--s-gris3);background:transparent}
.sgof-av button{width:26px;height:30px;border:1.5px solid var(--s-noir);background:#fff;font:inherit;font-size:15px;font-weight:700;cursor:pointer;padding:0;color:var(--s-noir)}
.sgof-av button:hover{background:var(--s-jaune)}
.sgof-av button:disabled{opacity:.3;cursor:default;background:#fff}
.sgof-res{display:flex;justify-content:space-between;align-items:flex-end;gap:16px 30px;flex-wrap:wrap;margin:14px 0 30px;padding:14px 0 0;border-top:1px solid var(--s-filet)}
.sgof-res dl{display:grid;grid-template-columns:auto auto;gap:4px 28px;margin:0;font-size:13px;font-variant-numeric:tabular-nums}
.sgof-res dt{color:var(--s-gris)}
.sgof-res dd{margin:0;text-align:right}
.sgof-res .t{font-weight:700;color:var(--s-noir);border-top:1.5px solid var(--s-noir);padding-top:5px}
.sgof-resb{display:flex;gap:8px;flex-wrap:wrap}
.sgof-sec+.sgof-sec{margin-top:8px}
.sgof-pied{margin-top:22px;font-size:12px;color:var(--s-gris)}
.sgof-pied a{color:var(--s-nuit);font-weight:700;text-decoration:underline;text-underline-offset:2px;cursor:pointer}
.sgof-etat{cursor:pointer;font-family:inherit;line-height:inherit;white-space:nowrap}
.sgof-etat i{font-style:normal;font-size:9px;margin-left:5px}
.sgof-box.emb{overflow:hidden;display:flex;flex-direction:column}
.sgof-emb{flex:1 1 auto;min-height:0;display:flex;flex-direction:column}
.sgof-emb-bar{flex:none;display:flex;align-items:center;gap:14px;min-height:54px;box-sizing:border-box;padding:8px 16px 8px 24px;background:var(--s-jaune2);border-top:2px solid var(--s-noir);border-bottom:1px solid var(--s-noir)}
.sgof-emb-bar .no{font-size:20px;font-weight:700;line-height:1.2;color:var(--s-nuit);white-space:nowrap;padding-right:14px;border-right:2px solid var(--s-noir)}
.sgof-emb-bar .tx{display:flex;flex-direction:column;gap:1px;min-width:0}
.sgof-emb-bar .lb{font-size:11.5px;color:var(--s-gris);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgof-emb-bar .ti{font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgof-emb-bar .ac{margin-left:auto;display:flex;gap:8px;flex:none}
.sgof-emb-bar .ac select.inp{max-width:300px;height:36px}
.sgof-emb-zone{flex:1 1 auto;min-height:0}
`;
function css(){ if(document.getElementById('sgof-css')) return; const s=document.createElement('style'); s.id='sgof-css'; s.textContent=CSS; document.head.append(s); }

const ETAT={};   /* par affaire et par page : défilement gardé quand la page est redessinée (base modifiée) */
function ouvrir(C,p,mode){ css(); const M=MODES[mode], key=mode+':'+p.ID, u=ETAT[key]||(ETAT[key]={sy:0});
  const box=document.createElement('div'); box.className='sgof-box'; C.append(box);
  box.addEventListener('scroll',()=>{ if(box.isConnected&&!box.classList.contains('emb')) u.sy=box.scrollTop; },{passive:true});
  const faire=()=>{ if(!box.isConnected) return; try{ const q=DS.get('project',p.ID)||p;
      if((mode==='offres'||mode==='contrats')&&listeDansProjet()){ dans(box,q,mode,{k:'liste'}); return; }   /* liste « Contrats d'honoraires » de l'app (01.11.2026) */
      if(mode==='factures') dessinerF(box,q); else dessiner(box,q,mode); if(u.sy) box.scrollTop=u.sy; }
    catch(e){ console.error(e); box.innerHTML='<p class="sgof-err">'+E(M.lb)+' : erreur — '+E(e&&e.message||e)+'</p>'; } };
  box._sgofFaire=faire;
  /* Facturation déjà posée sur cette page (page redessinée : base modifiée) : on la repose dans la nouvelle page */
  if(EMB&&String(EMB.p.ID)===String(p.ID)&&EMB.page===mode){ poser(box); return; }
  if(EMB) fermer(false);
  const avc=mode!=='factures'||!DS.need?null:Promise.resolve().then(()=>DS.need(['sgavancement'])).catch(()=>null);   /* dernier état de l'avancement des prestations (situation des factures) */
  if(typeof fxData==='function'&&fxData()&&!avc){ faire(); return; }
  box.innerHTML='<div class="sgof-charge">Lecture des '+(mode==='offres'?'offres d’honoraires':mode==='factures'?'factures':'contrats d’honoraires')+'…</div>';
  Promise.all([Promise.resolve().then(()=>fxEnsure()),avc]).then(faire,e=>{ if(box.isConnected) box.innerHTML='<p class="sgof-err">La Facturation n’a pas pu être chargée : '+E(e&&e.message||e)+'</p>'; }); }

function dessiner(box,p,mode){ const M=MODES[mode], D=fxData();
  if(!D){ box.innerHTML='<p class="sgof-err">La Facturation n’est pas chargée.</p>'; return; }
  const fin=!sgFinVerrou(), col=collab(), creer=vueOk('fx-calchono'), fact=!col&&vueOk('fx-saisie'), offres=mode==='offres', etats=offres&&creer&&vueOk('fx-contrats');
  const T=lignes(p,D), L=T.filter(x=>M.garde(x.c)), nb=f=>f?L.filter(x=>M.fil(x,f)).length:L.length;
  let f=String(nxLS.get(M.ls,'')||''); if(f&&!nb(f)) f='';
  const V=L.filter(x=>!f||M.fil(x,f)), mo=typeof projMO==='function'?projMO(p):'';
  const nAnn=T.filter(x=>x.k==='ann').length, nCours=T.filter(x=>x.k==='cours').length, nRet=T.filter(x=>x.k==='ret').length;
  const libre=offres&&creer?D.c.filter(c=>!c.annule&&!sgProjetDuContrat(c)):[];
  /* bandeau : numéro, désignation ; sous le titre le nombre d'offres et d'offres annulées ou refusées (demande de Paulo, 01.11.2026) */
  const meta=offres?[mo?'Maître de l’ouvrage : '+mo:'',pl(T.length,'offre')+' · '+pl(nAnn,'annulée ou refusée','annulées ou refusées')].filter(Boolean).join(' · ')
    :[mo?'Maître de l’ouvrage : '+mo:'',pl(L.length,'contrat signé','contrats signés')+(T.length>L.length?' · '+pl(T.length,'offre')+' en tout':'')].filter(Boolean).join(' · ');
  let html='<div class="sgof"><div class="sgfh-tete"><div class="sgfh-id"><div class="sgfh-ini">'+E(p.NUMBER||'')+'</div><div class="sgfh-nm"><div class="lb">'+E(M.lb)+'</div><h2>'+E(p.TITLE||p.NUMBER||'')+'</h2>'
    +'<div class="sgfh-meta">'+E(meta)+'</div></div></div>'
    +'<div class="sgof-hact">'+(creer?'<button class="nx-btn pri" data-a="nouv" title="'+E(M.nouvT)+'">'+nxSvg('plus')+E(M.nouv)+'</button>':'')
    +(libre.length?'<select class="inp" data-a="lier" title="Relier à cette affaire une offre de Facturation qui n’est reliée à aucune affaire"><option value="">Relier une offre…</option>'
      +libre.map(c=>'<option value="'+E(c.id)+'">'+E([c.affaire||'(sans code)',c.projet,c.nom].filter(Boolean).join(' — '))+'</option>').join('')+'</select>':'')+'</div></div>';
  /* chiffres (sans icônes, comme la feuille d'heures et l'avancement) ; un clic sur un nombre = filtre */
  const kpi=(l,v,s,ti,fk)=>'<div class="nx-kpi'+(fk!=null?' lnk'+(fk===f&&fk?' on':''):'')+'"'+(fk!=null?' data-f="'+E(fk)+'" role="button" tabindex="0"':'')+(ti?' title="'+E(ti)+'"':'')+'><div class="l">'+E(l)+'</div><div class="v">'+v+'</div>'+(s?'<div class="s">'+s+'</div>':'')+'</div>';
  const chf=v=>fin?nxCHF(v)+'<small>CHF</small>':'—';
  const sm=(X,k)=>X.reduce((s0,x)=>s0+x[k],0), retL=T.filter(x=>x.k==='ret'), retTT=sm(retL,'tt'), sigL=L, sigTT=sm(sigL,'tt'), sigFa=sm(sigL,'fa'), sigFr=sm(sigL,'fr'), sigFfa=sm(sigL,'ffa');
  const env=T.filter(x=>x.k==='cours'&&x.c.envoye), decides=nRet+nAnn;
  if(offres) html+='<div class="nx-kpis sgof-kp">'
    +kpi('Offres',String(T.length),'',pl(T.length,'offre')+' de Facturation reliée'+(T.length>1?'s':'')+' à cette affaire','')
    +kpi('En cours',String(nCours),env.length?pl(env.length,'envoyée')+', non signée'+(env.length>1?'s':''):'','Brouillons et offres envoyées, pas encore signées','cours')
    +kpi('Retenues',String(nRet),decides?Math.round(nRet/decides*100)+' % des offres décidées':'','Offres signées (contrats), terminées comprises','ret')
    +kpi('Annulées ou refusées',String(nAnn),'','Offres marquées « annulé » dans Facturation','ann')
    +kpi('Honoraires retenus (TTC)',chf(retTT),fin?frl('Frais',sm(retL,'fr')):'',fin?'Honoraires TTC des offres retenues (signées ou terminées), sans les frais ; frais = % de frais du contrat':'Montants masqués')+'</div>';
  else html+='<div class="nx-kpis sgof-kp">'
    +kpi('Contrats signés',String(L.length),'',pl(L.length,'contrat signé','contrats signés')+(L.some(x=>x.c.termine)?', terminés compris':''),'')
    +kpi('En cours',String(nb('cours')),'','Contrats signés pas encore terminés','cours')
    +kpi('Honoraires (TTC)',chf(sigTT),fin?frl('Frais contractuels',sigFr):'','Honoraires TTC des contrats signés, sans les frais ; frais contractuels = % de frais du contrat')
    +(col?'':kpi('Honoraires facturés (TTC)',chf(sigFa),fin?frl('Frais facturés',sigFfa)+(sigTT?'<br>'+Math.round(sigFa/sigTT*100)+' % des honoraires':''):'','Honoraires facturés TTC, sans les frais (factures non annulées des contrats signés) ; frais facturés à part')
      +kpi('Solde à facturer (TTC)',fin?'<span'+(sigTT-sigFa<0?' class="sgof-neg"':'')+'>'+nxCHF(sigTT-sigFa)+'</span><small>CHF</small>':'—',fin?frl('Frais restants',sigFr-sigFfa):'','Honoraires TTC − honoraires facturés TTC ; frais restants = frais contractuels − frais facturés'))+'</div>';
  if(!fin) html+='<div class="sgof-verr">'+nxSvg('lock')+'<span>Montants masqués : finances protégées.</span>'+(verrouCode()?'<button class="nx-btn" data-a="deverr">Déverrouiller</button>':'')+'</div>';
  /* tableau */
  const fil=nb(f)&&M.filtres.filter(([k])=>!k||nb(k)).length>2?'<span class="sgof-fil" role="group" aria-label="Filtre">'+M.filtres.filter(([k])=>!k||nb(k)).map(([k,t])=>'<button data-f="'+E(k)+'" class="'+(k===f?'on':'')+'" aria-pressed="'+(k===f)+'">'+E(t)+'<i>'+nb(k)+'</i></button>').join('')+'</span>':'';
  html+='<section class="sgof-sec"><div class="sgof-sech"><h3>'+E(M.titre)+'</h3><span class="n">'+(f?nb(f)+' sur '+L.length:String(L.length))+'</span>'+fil+'</div>';
  if(!V.length) html+='<div class="sgof-vide">'+E(M.vide)+(creer?'<br><button class="nx-btn pri" data-a="nouv" title="'+E(M.nouvT)+'">'+nxSvg('plus')+E(M.nouv)+'</button>':'')+'</div>';
  else { const mt=fin, fa=!offres&&!col&&fin;
    html+='<div style="overflow:auto"><table class="nx-tbl sgof-t"><tr><th>'+(offres?'Offre':'Contrat')+'</th><th>Date</th>'+(offres?'':'<th>Signé le</th>')+'<th>Commentaire</th><th>Type</th><th class="r">Version</th>'
      +(mt?'<th class="r">Honoraires<br>HT</th><th class="r">Honoraires<br>TTC</th><th class="r">Frais<br>TTC</th>':'')+(fa?'<th class="r">Honoraires<br>facturés TTC</th>':'')+'<th>État</th><th class="sg-notri"></th></tr>'
      +V.map(x=>{ const c=x.c, ci=x.ci, et=x.et, ph=typeof sgContratPhLib==='function'?sgContratPhLib(c):'';
        const titre=[c.id?'Code : '+c.id:'',c.projet||'',et.titre||ph||''].filter(Boolean).join(' · ');
        const etat=offres&&x.k==='ann'?'Annulée ou refusée':ci.etat;
        return '<tr'+(x.k==='ann'?' class="ann"':'')+'>'
          +'<td class="of" title="'+E(titre)+'"><b>'+E(et.lib||ci.nature)+'</b>'+(et.lib&&ci.avenant?'<span class="nat"'+(ci.nTitre?' title="'+E(ci.nTitre)+'"':'')+'>Avenant</span>':'')+(c.projet?'<small>'+E(c.projet)+'</small>':'')+'</td>'
          +'<td'+(ci.dTitre?' title="'+E(ci.dTitre)+'"':'')+'>'+(ci.date?dfr(ci.date):'—')+'</td>'
          +(offres?'':'<td>'+(ci.signeLe?dfr(ci.signeLe):c.signe?'<span title="Signé, date non enregistrée">signé</span>':'—')+'</td>')
          +'<td class="com">'+E(ci.com)+'</td>'
          +'<td'+(ci.rTitre?' title="'+E(ci.rTitre)+'"':'')+'>'+E(ci.remu)+'</td>'
          +'<td class="r"'+(ci.nTitre?' title="'+E(ci.nTitre)+'"':'')+'>'+(ci.versions>1?ci.v+' / '+ci.versions:'1')+'</td>'
          +(mt?'<td class="r">'+(x.ht?nxCHF(x.ht):'—')+'</td><td class="r"><b>'+(x.tt?nxCHF(x.tt):'—')+'</b></td>'
            +'<td class="r" title="'+E(x.fp?'Frais du contrat : '+num(x.fp,2)+' % des honoraires':'Aucun frais au contrat')+'">'+(x.fr?nxCHF(x.fr)+'<span class="pc">'+num(x.fp,x.fp%1?2:0)+' %'+(fa&&x.ffa?' · facturés '+nxCHF(x.ffa):'')+'</span>':'—')+'</td>':'')
          +(fa?'<td class="r">'+(x.fs.length?nxCHF(x.fa)+(x.tt?'<span class="pc">'+Math.round(x.fa/x.tt*100)+' %</span>':''):'—')+'</td>':'')
          +'<td>'+(etats?'<button class="nx-tag sgof-etat '+(offres&&x.k==='ann'?'':ci.cl)+'" data-etat="'+E(c.id)+'" title="Changer l’état : envoyée, signée (elle devient un contrat), annulée ou refusée, terminée">'+E(etat)+'<i aria-hidden="true">▾</i></button>'
            :'<span class="nx-tag '+(offres&&x.k==='ann'?'':ci.cl)+'">'+E(etat)+'</span>')+'</td>'
          +'<td class="r"><div class="sg-htls sg-cacts"><button data-go="fx-contrats" data-arg="cv:'+E(c.id)+'" title="Afficher en PDF la dernière version (contrat signé ou dernier avenant)">'+nxSvg('pdf')+'<span>Ouvrir</span></button>'
          +(creer?'<button data-go="fx-calchono" data-arg="c:'+E(c.id)+'" title="'+E(signe(c)?'Modifier le calcul d’honoraires : un contrat signé est verrouillé, la modification crée une nouvelle version (avenant)':'Modifier l’offre dans le calcul d’honoraires')+'">'+nxSvg('edit')+'<span>Modifier</span></button>':'')
          +(!offres&&fact?(c.termine?'<span class="sg-cvide" aria-hidden="true"></span>':'<button data-go="fx-saisie" data-arg="nf:'+E(c.id)+'" title="Établir une facture ou un acompte pour ce contrat">'+nxSvg('receipt')+'<span>Facturer</span></button>'):'')
          +'</div></td></tr>'; }).join('')
      +(!offres&&mt&&V.length>1?'<tr class="tot"><td>Total</td><td></td>'+(offres?'':'<td></td>')+'<td></td><td></td><td></td><td class="r">'+nxCHF(V.reduce((s0,x)=>s0+x.ht,0))+'</td><td class="r">'+nxCHF(V.reduce((s0,x)=>s0+x.tt,0))+'</td><td class="r">'+nxCHF(V.reduce((s0,x)=>s0+x.fr,0))+'</td>'
        +(fa?'<td class="r">'+nxCHF(V.reduce((s0,x)=>s0+x.fa,0))+'</td>':'')+'<td></td><td></td></tr>':'')
      +'</table></div>'; }
  html+='</section>';
  const anc=ANCIEN[M.dom];
  if(anc&&vueOk(anc)) html+='<div class="sgof-pied">Ancienne version ('+(offres?'calculs':'contrats')+' de l’ancien logiciel) : <a data-a="ancien" tabindex="0">Archives ▸ Honoraires (ancien) ▸ '+E(M.dom)+'</a></div>';
  box.innerHTML=html+'</div>'; LISTE=box;
  /* actions */
  const filtrer=k=>{ nxLS.set(M.ls,k===f?'':k); dessiner(box,p,mode); };
  box.onclick=e=>{ const t=e.target.closest('[data-go],[data-a],[data-f],[data-etat]'); if(!t||!box.contains(t)) return;
    if(t.dataset.go){ allerFx(box,p,mode,t.dataset.go,t.dataset.arg); return; }
    if(t.dataset.etat){ menuEtat(t,t.dataset.etat); return; }
    if(t.dataset.f!=null){ filtrer(t.dataset.f); return; }
    const a=t.dataset.a;
    if(a==='nouv') allerFx(box,p,mode,'fx-calchono','newaff:'+(p.NUMBER||''));
    else if(a==='deverr') sgDeverrouiller().then(ok=>{ if(ok&&box.isConnected) (box._sgofFaire||(()=>dessiner(box,DS.get('project',p.ID)||p,mode)))(); });
    else if(a==='ancien'){ try{ SG_ANC.sel=String(p.ID); nxLS.set('sg3_anc_projet',SG_ANC.sel); }catch(_){} go(anc); } };
  box.onkeydown=e=>{ const t=e.target.closest&&e.target.closest('[data-f][role=button],[data-a="ancien"]'); if(t&&(e.key==='Enter'||e.key===' ')){ e.preventDefault(); t.click(); } };
  const s=box.querySelector('select[data-a="lier"]');
  if(s) s.onchange=()=>{ const c=D.c.find(x=>x.id===s.value); if(!c) return;
    const l=sgLiens(); l[c.id]=String(p.ID); nxLS.set('sg3_liens',l); toast('Offre '+(c.affaire||c.id)+' reliée à '+(p.NUMBER||'l’affaire')+'.'); dessiner(box,DS.get('project',p.ID)||p,mode); }; }

/* ═══ FACTURES DE L'AFFAIRE (01.11.2026, demande de Paulo : « dans factures, ajoute le module de l'ancienne version que j'avais développée et
   conserve la version Delta dans archives ; dans chaque affaire, uniquement les factures qui concernent l'affaire ; dans la partie supérieure des
   stats : factures ouvertes, contrat, hors contrat, reste à facturer, situation par rapport aux heures — définir les pourcentages en analysant
   les heures depuis la dernière facturation, pour déterminer les honoraires à facturer à la prochaine facture ») ═══
   Page du projet ▸ Factures (ivDomain du moteur remplacé ; Archives ▸ Facturation (ancien) ▸ Factures garde l'écran d'origine) :
   – factures de Facturation de l'affaire seulement : celles des contrats reliés à l'affaire, et les factures sans contrat (non ordinaires) dont
     le code d'affaire (cl_affaire, sinon « _<code>. » du numéro) est celui de l'affaire ;
   – chiffres : factures ouvertes (TTC, échues), contrat (honoraires TTC des contrats non annulés, facturé, %), hors contrat (factures sans
     contrat), total reçu (factures payées, honoraires et frais), reste à facturer (contrat − facturé sur contrat), selon les heures (prochaine facture : somme de la situation ci-dessous) ;
   – « Situation par rapport aux heures — prochaine facture », par contrat (ni annulé ni terminé, avec des prestations SIA) : par phase partielle,
     part du contrat, facturé à ce jour (pourcentages cumulés de la dernière facture du contrat), heures depuis la dernière facture, heures saisies
     / heures du contrat (TIMEBUDGET de la phase partielle du projet), avancement PROPOSÉ (heures ÷ heures du contrat, crans de 5 %, au plus 95 %,
     comme l'Avancement des prestations ; sans heures au contrat : dernier état de l'avancement des prestations ; jamais en dessous du facturé),
     avancement À FACTURER modifiable (− / +, saisie, « Reprendre les propositions »), cumul et honoraires de la phase ; pied : honoraires HT
     cumulés, rabais, TTC, moins le déjà facturé = honoraires à facturer, frais, total — même calcul que la saisie de facture de Facturation
     (calcF : hht × Σ % ÷ Σ % du contrat, rabais, arrondi à 5 ct, TVA ; acomptes = factures précédentes du contrat) ;
     « Préparer la facture » = nouvelle facture de Facturation pour ce contrat (fx-saisie « nfp:<contrat> »), pourcentages cumulés reportés
     prestation par prestation (ff_<k>, répartis dans l'ordre SIA à partir de la facture précédente) : à vérifier puis enregistrer dans Facturation ;
   – tableau des factures (années, n°, date, type, contrat ou « hors contrat », honoraires, frais, total TTC, échéance, état ; Ouvrir = PDF de la
     facture, fx-factures « fv:<id> » ; Modifier = saisie, « f:<id> »).
   Droits : la tuile suit sgPdomListe (factures : lecture) ; finances verrouillées → « Déverrouiller » ; Préparer la facture = fx-saisie, jamais
   pour le profil collaborateur. Pourcentages choisis gardés le temps de la session (par contrat). */
const PP_NOM={31:'Avant-projet',32:'Projet de l’ouvrage',33:'Procédure de demande d’autorisation',41:'Appels d’offres',51:'Projet d’exécution',52:'Exécution de l’ouvrage',53:'Mise en service, achèvement'};
const ppDe=k=>{ const m=/^4(\d)(\d)/.exec(String(k)); return m?+(m[1]+m[2]):null; };
const cran5=v=>Math.max(0,Math.min(100,Math.round((+v||0)/5)*5));
/* honoraires et frais TTC d'une facture (01.11.2026, « séparer les honoraires des frais ») : honoraires = _ttc (sinon ttc), frais = _fttc (sinon
   fttc) ; une NOTE DE FRAIS (type « Note de frais… », numéro …NF01 / …NFF) garde son montant dans _ttc : il compte en frais, pas en honoraires */
const estNF=f=>/note de frais/i.test(f.type||'')||/\.NFF?\d*$/i.test(String(f.num||''));
const ttcBrut=f=>+f._ttc||+f.ttc||0, ttcF=f=>estNF(f)?0:ttcBrut(f), fraisF=f=>(estNF(f)?ttcBrut(f):0)+('_fttc' in f?+f._fttc||0:+f.fttc||0);
const isoJ=d=>{ const x=d instanceof Date?d:new Date(d); return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0'); };
const numAff=n=>{ const m=/_(\d{2}[A-Za-z][A-Za-z0-9]*)/.exec(String(n||'')); return m?m[1]:''; };
const fxAnnulee=f=>/annul/i.test(f.statut||'');
/* factures de l'affaire : contrats reliés, et factures sans contrat au code de l'affaire */
function facturesDe(p,D){ const cs=sgContratsDuProjet(p,D), ids=new Set(cs.map(c=>String(c.id)));
  const fs=(D.f||[]).filter(f=>{ if(f.contrat_id&&!f.sansContrat) return ids.has(String(f.contrat_id));
    const q=sgProjetDuContrat({id:'facture:'+f.id,affaire:f.cl_affaire||numAff(f.num)}); return !!q&&String(q.ID)===String(p.ID); });
  return {cs,fs}; }
const horsC=f=>!!f.sansContrat||!f.contrat_id;
/* dernier état de l'avancement des prestations (sgavancement : EFF par phase partielle) */
function avEff(p){ try{ const R=DS.by('sgavancement','PROJECT_ID',p.ID).filter(r=>r&&r.EFF).sort((a,b)=>cmp(String(b.DATE||''),String(a.DATE||''))); return R[0]?{date:R[0].DATE,eff:R[0].EFF}:null; }catch(_){ return null; } }
/* situation d'un contrat : proposition d'après les heures, avancement choisi (ch[n]), pourcentages cumulés par prestation et montants */
function situation(p,D,c,fsC,ch){ ch=ch||{};
  const auj=isoJ(new Date()), K=c.phases||{}, totC=Object.values(K).reduce((s0,v)=>s0+(+v||0),0);
  const prevs=fsC.filter(f=>String(f.contrat_id)===String(c.id)&&f.phases&&!fxAnnulee(f)&&String(f.date||'')<=auj)
    .sort((a,b)=>cmp(String(b.date||''),String(a.date||''))||cmp(String(b.num||''),String(a.num||'')));
  /* dernière facture d'honoraires (une note de frais ne porte pas l'avancement) ; déjà facturé = honoraires seuls, frais à part */
  const der=prevs.find(f=>!estNF(f))||null, acc=prevs.reduce((s0,f)=>s0+ttcF(f),0), facc=prevs.reduce((s0,f)=>s0+fraisF(f),0), prevK=(der&&der.phases)||{};
  const sansPct=!!der&&acc>0&&!Object.values(prevK).some(v=>+v>0), dl=der&&der.date||'';
  const sub={}, num={}; DS.by('projectphase','PROJECT_ID',p.ID).forEach(ph=>DS.by('projectsubphase','PROJECTPHASE_ID',ph.ID).forEach(s=>{ const n=+s.NUMBER; if(!n) return;
    const x=sub[n]||(sub[n]={rec:s,b:0,h:0,hd:0}); x.b+=+s.TIMEBUDGET||0; num[String(s.ID)]=n; }));
  let hdTot=0; DS.by('timelog','PROJECT_ID',p.ID).forEach(r=>{ const n=num[String(r.SUBPHASE_ID)], h=+r.TIMEPERIOD||0; const ap=!dl||isoJ(tlDate(r))>dl; if(ap) hdTot+=h; if(n==null) return; sub[n].h+=h; if(ap) sub[n].hd+=h; });
  const ae=avEff(p), DET=typeof FE_DET==='object'&&FE_DET?FE_DET:{};
  const ff={}; Object.keys(K).forEach(k=>{ ff[k]=Math.min(+prevK[k]||0,+K[k]||0); });
  const L=[...new Set(Object.keys(K).filter(k=>+K[k]>0).map(ppDe).filter(Boolean))].sort((a,b)=>a-b).map(n=>{
    const det=(DET[n]||[]).map(x=>x[0]).filter(k=>+K[k]>0), keys=det.length?det:Object.keys(K).filter(k=>ppDe(k)===n&&+K[k]>0).sort();
    const cP=keys.reduce((s0,k)=>s0+(+K[k]||0),0), fP=keys.reduce((s0,k)=>s0+ff[k],0), avF=cP?Math.min(100,fP/cP*100):0, s=sub[n]||{b:0,h:0,hd:0};
    const conso=s.b?s.h/s.b*100:null; let prop=null, src='';
    if(conso!=null){ prop=Math.min(95,cran5(conso)); src='heures'; }
    else if(ae&&ae.eff&&ae.eff[n]!=null){ prop=cran5(ae.eff[n]); src='avancement'; }
    const propA=Math.max(avF,prop==null?avF:prop), choisi=ch[n]!=null, av=Math.max(avF,Math.min(100,choisi?+ch[n]:propA));
    let reste=cP*av/100-fP; keys.forEach(k=>{ if(reste<=1e-9) return; const a=Math.min(reste,(+K[k]||0)-ff[k]); if(a>0){ ff[k]+=a; reste-=a; } });
    const cum=keys.reduce((s0,k)=>s0+ff[k],0);
    return {n,nom:(s.rec&&typeof nm==='function'&&nm(s.rec))||PP_NOM[n]||('Phase '+n),keys,cP,fP,avF,h:s.h,hd:s.hd,b:s.b,conso,prop,src,propA,av,choisi,cum,
      dHT:totC?base(c)*(cum-fP)/totC:0}; });
  Object.keys(ff).forEach(k=>{ ff[k]=Math.round(ff[k]*100)/100; });
  /* montants : honoraires HT du contrat (rabais et arrondi déjà compris : TTC du contrat = HT × TVA) × Σ % ÷ Σ % du contrat, arrondi à 5 ct, TVA ;
     frais = % du contrat sur les honoraires HT ; à facturer = cumul − factures précédentes du contrat (comme les acomptes de la saisie) */
  const sf=Object.values(ff).reduce((s0,v)=>s0+v,0), ht=totC?base(c)*sf/totC:0, htra=Math.round(ht*20)/20;
  const tp=tauxTva(c), ttc=htra*(1+tp/100), fp=+c.frais||0, fht=ht*fp/100, fttc=Math.round(fht*20)/20*(1+tp/100);
  return {c,L,ff,totC,sf,der,dl,acc,facc,sansPct,hdTot,ae,ht,htra,tp,ttc,aF:ttc-acc,fttc,aFr:fttc-facc,
    pctF:totC?prevs.length&&!sansPct?L.reduce((s0,x)=>s0+x.fP,0)/totC*100:null:null}; }
const tauxTva=c=>c.tva!=null&&c.tva!==''&&isFinite(+c.tva)?+c.tva:8.1;
const base=c=>+c.hht||(+c.httc||0)/(1+tauxTva(c)/100);   /* honoraires HT du contrat (rabais compris) */
const situables=(cs)=>cs.filter(c=>!c.annule&&!c.termine&&Object.values(c.phases||{}).some(v=>+v>0)&&base(c)>0);

const ETAT_F={};   /* par affaire : contrat choisi, avancements choisis par contrat, année */
function dessinerF(box,p){ const D=fxData();
  if(!D){ box.innerHTML='<p class="sgof-err">La Facturation n’est pas chargée.</p>'; return; }
  const u=ETAT_F[p.ID]||(ETAT_F[p.ID]={cid:null,ch:{},an:''}), mo=typeof projMO==='function'?projMO(p):'';
  if(sgFinVerrou()){ box.innerHTML='<div class="sgof"><div class="sgfh-tete"><div class="sgfh-id"><div class="sgfh-ini">'+E(p.NUMBER||'')+'</div><div class="sgfh-nm"><div class="lb">Factures</div><h2>'+E(p.TITLE||p.NUMBER||'')+'</h2></div></div></div>'
      +'<div class="sgof-verr" style="margin-top:18px">'+nxSvg('lock')+'<span>Factures, contrats et montants sont protégés.</span>'+(verrouCode()?'<button class="nx-btn" data-a="deverr">Déverrouiller</button>':'')+'</div></div>';
    box.onclick=e=>{ if(e.target.closest('[data-a="deverr"]')) sgDeverrouiller().then(ok=>{ if(ok&&box.isConnected) dessinerF(box,DS.get('project',p.ID)||p); }); }; return; }
  const col=collab(), prep=!col&&vueOk('fx-saisie'), {cs,fs:F}=facturesDe(p,D), fs=F.filter(f=>!fxAnnulee(f)), auj=isoJ(new Date());
  const csV=cs.filter(c=>!c.annule), tva=c=>(c.tva!=null&&c.tva!==''&&isFinite(+c.tva)?+c.tva:8.1)/100, cTT=c=>+c.httc||(+c.hht||0)*(1+tva(c));
  const contrat=csV.reduce((s0,c)=>s0+cTT(c),0), fsC=fs.filter(f=>!horsC(f)), fsH=fs.filter(horsC);
  const factC=fsC.reduce((s0,f)=>s0+ttcF(f),0), factH=fsH.reduce((s0,f)=>s0+ttcF(f),0), ouv=fs.filter(fxUnpaid), ech=ouv.filter(f=>f.ech&&f.ech<auj);
  const sum=L=>L.reduce((s0,f)=>s0+ttcF(f)+fraisF(f),0);
  const S=situables(cs), sits=S.map(c=>situation(p,D,c,F,u.ch[c.id])), aHeures=sits.reduce((s0,x)=>s0+Math.max(0,x.aF),0);
  if(!S.some(c=>String(c.id)===String(u.cid))) u.cid=S.length?S[S.length-1].id:null;
  const sit=sits.find(x=>String(x.c.id)===String(u.cid))||null;
  const etiq=c=>{ const et=sgContratEtendue(c); return (et.lib||'Contrat')+(c.date?' · '+String(c.date).slice(0,4):''); };
  const libC=new Map(cs.map(c=>[String(c.id),etiq(c)]));
  let html='<div class="sgof"><div class="sgfh-tete"><div class="sgfh-id"><div class="sgfh-ini">'+E(p.NUMBER||'')+'</div><div class="sgfh-nm"><div class="lb">Factures</div><h2>'+E(p.TITLE||p.NUMBER||'')+'</h2>'
    +'<div class="sgfh-meta">'+E([mo?'Maître de l’ouvrage : '+mo:'',pl(fs.length,'facture'),pl(csV.length,'contrat')+(fsH.length?' · '+pl(fsH.length,'facture')+' hors contrat':'')].filter(Boolean).join(' · '))+'</div></div></div>'
    +'<div class="sgof-hact">'+(prep&&S.length?'<button class="nx-btn pri" data-a="nf" title="Nouvelle facture ou demande d’acompte dans Facturation">'+nxSvg('plus')+'Nouvelle facture</button>':'')+'</div></div>';
  const kpi=(l,v,s,ti,a)=>'<div class="nx-kpi'+(a?' lnk':'')+'"'+(a?' data-a="'+a+'" role="button" tabindex="0"':'')+(ti?' title="'+E(ti)+'"':'')+'><div class="l">'+E(l)+'</div><div class="v">'+v+'</div>'+(s?'<div class="s">'+s+'</div>':'')+'</div>';
  const chf=v=>(v<-0.5?'− '+nxCHF(-v):nxCHF(v))+'<small>CHF</small>';   /* négatif : facturé au-delà du contrat (dit en dessous) */
  /* honoraires TTC sans les frais en grand, frais à part (01.11.2026, demande de Paulo « séparer les honoraires contractuels des frais, idem pour
     les factures ; voir le montant des honoraires TTC sans les frais ») ; total reçu = factures payées (même jour) */
  const hon=L=>L.reduce((s0,f)=>s0+ttcF(f),0), fra=L=>L.reduce((s0,f)=>s0+fraisF(f),0), pay=fs.filter(f=>!fxUnpaid(f));
  const contratFr=csV.reduce((s0,c)=>s0+cTT(c)*(+c.frais||0)/100,0), fpC=[...new Set(csV.map(c=>+c.frais||0))], aFrais=sits.reduce((s0,x)=>s0+Math.max(0,x.aFr),0);
  html+='<div class="nx-kpis sgof-kp sgof-kp6">'
    +kpi('Factures ouvertes · honoraires TTC','<span'+(ech.length?' class="sgof-neg"':'')+'>'+nxCHF(hon(ouv))+'</span><small>CHF</small>',frl('Frais',fra(ouv))+'<br>'+(ouv.length?pl(ouv.length,'facture')+' non payée'+(ouv.length>1?'s':'')+(ech.length?' · <span class="sgof-neg">'+ech.length+' échue'+(ech.length>1?'s':'')+'</span>':''):'tout est payé'),'Factures non payées : honoraires TTC sans les frais ; frais TTC à part ; échue = échéance dépassée')
    +kpi('Total reçu · honoraires TTC',nxCHF(hon(pay))+'<small>CHF</small>',frl('Frais',fra(pay))+'<br>'+(fs.length?pl(pay.length,'facture')+' payée'+(pay.length>1?'s':'')+(hon(fs)?' · '+Math.round(hon(pay)/hon(fs)*100)+' % des honoraires facturés':''):'aucune facture'),'Factures payées (statut « Payée » ou date de paiement) : honoraires TTC sans les frais, sur '+nxCHF(hon(fs))+' CHF d’honoraires TTC facturés ; frais TTC à part')
    +kpi('Contrat · honoraires TTC',contrat?nxCHF(contrat)+'<small>CHF</small>':'—',contrat?frl('Frais contractuels',contratFr)+(fpC.length===1&&fpC[0]?' ('+num(fpC[0],fpC[0]%1?2:0)+' %)':'')+'<br>facturé '+nxCHF(factC)+' · '+Math.round(factC/contrat*100)+' %':'aucun contrat relié','Honoraires TTC des contrats non annulés de l’affaire, sans les frais ; frais contractuels = % de frais du contrat sur ses honoraires ; facturé = honoraires TTC des factures de ces contrats')
    +kpi('Hors contrat · honoraires TTC',nxCHF(factH)+'<small>CHF</small>',frl('Frais',fra(fsH))+'<br>'+(fsH.length?pl(fsH.length,'facture'):'aucune facture'),'Factures sans contrat (non ordinaires) au code de l’affaire : honoraires TTC sans les frais ; frais TTC à part')
    +kpi('Reste à facturer · honoraires TTC',contrat?chf(contrat-factC):'—',contrat?frl('Frais restants',contratFr-fra(fsC))+'<br>'+(contrat-factC<-0.5?'facturé au-delà du contrat':Math.round(Math.max(0,contrat-factC)/contrat*100)+' % du contrat'):'','Honoraires TTC du contrat − honoraires facturés sur contrat ; frais restants = frais contractuels − frais facturés sur contrat')
    +kpi('Selon les heures · honoraires TTC',S.length?nxCHF(aHeures)+'<small>CHF</small>':'—',S.length?frl('Frais',aFrais)+'<br>à la prochaine facture':'aucun contrat à facturer par phases','Honoraires TTC à facturer à la prochaine facture d’après la situation par rapport aux heures (ci-dessous), sans les frais ; frais TTC à part'+(S.length>1?' ; tous contrats':''),S.length?'sit':'')+'</div>';
  /* tableau des factures */
  const anF=f=>String(f.date||'').slice(0,4), ans=[...new Set(F.map(anF).filter(y=>/^\d{4}$/.test(y)))].sort().reverse(), an=ans.length>1&&ans.includes(u.an)?u.an:'';
  const V=F.filter(f=>!an||anF(f)===an).sort((a,b)=>cmp(String(b.date||''),String(a.date||''))||cmp(String(b.num||''),String(a.num||''))), colC=cs.length>1||fsH.length>0;
  html+='<section class="sgof-sec"><div class="sgof-sech"><h3>Factures'+(an?' · '+an:'')+'</h3><span class="n">'+V.length+'</span>'
    +(ans.length>1?'<span class="sgof-fil" role="group" aria-label="Année">'+[['','Toutes'],...ans.map(y=>[y,y])].map(([v,t])=>'<button data-an="'+v+'" class="'+(v===an?'on':'')+'" aria-pressed="'+(v===an)+'">'+t+'</button>').join('')+'</span>':'')+'</div>';
  if(!V.length) html+='<p class="sgof-vide">Aucune facture pour cette affaire.</p>';
  else html+='<div style="overflow:auto"><table class="nx-tbl sgof-t"><tr><th>Numéro</th><th>Date</th><th>Type</th>'+(colC?'<th>Contrat</th>':'')+'<th class="r">Honoraires<br>TTC</th><th class="r">Frais<br>TTC</th><th class="r">Total<br>TTC</th><th>Échéance</th><th>État</th><th class="sg-notri"></th></tr>'
    +V.map(f=>{ const ann=fxAnnulee(f), o=!ann&&fxUnpaid(f), e=o&&f.ech&&f.ech<auj, c=cs.find(k=>String(k.id)===String(f.contrat_id));
      return '<tr'+(ann?' class="ann"':'')+'><td class="of"><b>'+E(f.num||f.id)+'</b></td><td>'+(f.date?dfr(f.date):'—')+'</td><td>'+E(f.type||'')+'</td>'
        +(colC?'<td'+(c?' title="'+E('Contrat '+c.id+(c.projet?' — '+c.projet:''))+'"':'')+'>'+(horsC(f)?'Hors contrat':E(libC.get(String(f.contrat_id))||f.contrat_id||''))+'</td>':'')
        +'<td class="r"'+(estNF(f)?' title="Note de frais : montant compté en frais"':'')+'><b>'+(ttcF(f)?nxCHF(ttcF(f)):'—')+'</b></td><td class="r">'+(fraisF(f)?nxCHF(fraisF(f)):'—')+'</td><td class="r">'+nxCHF(ttcF(f)+fraisF(f))+'</td>'
        +'<td'+(e?' class="sgof-neg"':'')+'>'+(f.ech?dfr(f.ech):'—')+'</td>'
        +'<td><span class="nx-tag '+(ann?'':o?(e?'urg':'s3'):'s2')+'">'+(ann?'Annulée':o?(e?'Échue':'Ouverte'):'Payée'+(f.date_paiement?' le '+dfr(f.date_paiement):''))+'</span></td>'
        +'<td class="r"><div class="sg-htls sg-cacts"><button data-go="fx-factures" data-arg="fv:'+E(f.id)+'" title="Afficher la facture en PDF">'+nxSvg('pdf')+'<span>Ouvrir</span></button>'
        +(prep?'<button data-go="fx-saisie" data-arg="f:'+E(f.id)+'" title="Modifier la facture dans la saisie de Facturation">'+nxSvg('edit')+'<span>Modifier</span></button>':'')+'</div></td></tr>'; }).join('')
    +(V.length>1?'<tr class="tot"><td>Total</td><td></td><td></td>'+(colC?'<td></td>':'')+'<td class="r">'+nxCHF(V.filter(f=>!fxAnnulee(f)).reduce((s0,f)=>s0+ttcF(f),0))+'</td><td class="r">'+nxCHF(V.filter(f=>!fxAnnulee(f)).reduce((s0,f)=>s0+fraisF(f),0))+'</td><td class="r">'+nxCHF(sum(V.filter(f=>!fxAnnulee(f))))+'</td><td></td><td></td><td></td></tr>':'')
    +'</table></div>';
  html+='</section>';
  /* situation par rapport aux heures — après le tableau des factures (01.11.2026, demande de Paulo « situations après les factures ») */
  if(sit){ const x=sit, c=x.c;
    html+='<section class="sgof-sec" id="sgof-sit"><div class="sgof-sech"><h3>Situation par rapport aux heures</h3><span class="n">prochaine facture</span>'
      +(S.length>1?'<span class="sgof-fil" role="group" aria-label="Contrat">'+S.map(k=>'<button data-cid="'+E(k.id)+'" class="'+(String(k.id)===String(u.cid)?'on':'')+'" title="'+E('Contrat '+k.id+(k.projet?' — '+k.projet:''))+'">'+E(etiq(k))+'</button>').join('')+'</span>':'')+'</div>'
      +'<p class="sgof-info">'+(x.der?'Dernière facture : <b>'+E(x.der.num||x.der.id)+'</b>'+(x.der.date?' du '+dfr(x.der.date):'')+' · facturé à ce jour '+nxCHF(x.acc)+' CHF TTC'+(x.pctF!=null?' ('+num(x.pctF,0)+' % du mandat)':''):'Aucune facture pour ce contrat')
        +' · <b>'+nxH(x.hdTot)+' h</b> saisies '+(x.der?'depuis cette facture':'sur l’affaire')+'.'+(x.sansPct?' <span class="sgof-neg">La dernière facture n’a pas de pourcentages (ancienne facture) : le facturé par phase est inconnu, les montants tiennent compte du déjà facturé.</span>':'')+'</p>'
      +'<div style="overflow:auto"><table class="nx-tbl sgof-t sgof-sit"><tr><th>Phase partielle</th><th class="r">Part du<br>contrat</th><th class="r">Facturé<br>à ce jour</th><th class="r">Heures depuis la<br>dernière facture</th><th>Heures saisies / contrat</th><th class="r">Proposé<br>par les heures</th><th class="sg-notri">Avancement<br>à facturer</th><th class="r">Cumul<br>% du mandat</th><th class="r">Honoraires HT<br>de la phase</th></tr>'
      +x.L.map(r=>{ const g=r.b?Math.min(100,r.h/r.b*100):0, dp=r.b&&r.h>r.b;
        return '<tr'+(r.choisi?' class="ch"':'')+'><td><b class="pp">'+r.n+'</b> '+E(r.nom)+'</td><td class="r">'+num(r.cP,r.cP%1?1:0)+' %</td>'
          +'<td class="r">'+num(r.avF,0)+' %<span class="pc">'+num(r.fP,r.fP%1?2:0)+' % du mandat</span></td>'
          +'<td class="r">'+(r.hd?nxH(r.hd)+' h':'—')+'</td>'
          +'<td>'+(r.b?'<div class="sgof-g'+(dp?' dp':'')+'" title="'+E(nxH(r.h)+' h saisies pour '+nxH(r.b)+' h au contrat')+'"><i style="width:'+g.toFixed(1)+'%"></i></div><span class="pc'+(dp?' sgof-neg':'')+'">'+nxH(r.h)+' h / '+nxH(r.b)+' h'+(r.conso!=null?' · '+Math.round(r.conso)+' %':'')+'</span>':'<span class="pc">'+(r.h?nxH(r.h)+' h · ':'')+'pas d’heures au contrat</span>')+'</td>'
          +'<td class="r" title="'+E(r.src==='heures'?'Heures saisies ÷ heures du contrat, par crans de 5 %, au plus 95 %':r.src==='avancement'?'Dernier état de l’avancement des prestations'+(x.ae&&x.ae.date?' ('+dfr(x.ae.date)+')':''):'Ni heures au contrat ni état d’avancement : à définir')+'">'+(r.prop!=null?num(r.prop,0)+' %'+(r.src==='avancement'?'<span class="pc">avancement</span>':''):'<span class="pc">à définir</span>')+'</td>'
          +'<td><div class="sgof-av"><button data-a="moins" data-n="'+r.n+'" title="− 5 %"'+(r.av<=r.avF?' disabled':'')+'>−</button><input type="number" min="'+num(r.avF,0).replace(/'/g,'')+'" max="100" step="5" value="'+Math.round(r.av*100)/100+'" data-n="'+r.n+'" aria-label="Avancement à facturer, '+E(r.nom)+'"'+(prep?'':' disabled')+'><span>%</span><button data-a="plus" data-n="'+r.n+'" title="+ 5 %"'+(r.av>=100?' disabled':'')+'>+</button></div></td>'
          +'<td class="r">'+num(r.cum,r.cum%1?2:0)+' %</td><td class="r">'+(r.dHT>0.5?nxCHF(r.dHT):'—')+'</td></tr>'; }).join('')
      +'</table></div>'
      +'<div class="sgof-res"><dl>'
        +'<dt title="Honoraires HT du contrat (rabais compris) × cumul ÷ prestations du contrat ('+num(x.totC,x.totC%1?2:0)+' %)">Honoraires HT cumulés · '+num(x.sf,x.sf%1?2:0)+' % du mandat</dt><dd>'+nxCHF(x.ht)+'</dd>'
        +'<dt>Honoraires TTC cumulés (TVA '+num(x.tp,1)+' %)</dt><dd>'+nxCHF(x.ttc)+'</dd><dt>Déjà facturé (TTC)</dt><dd>− '+nxCHF(x.acc)+'</dd>'
        +(x.aF<-0.5?'<dt class="t" title="Les factures du contrat dépassent les honoraires correspondant à l’avancement choisi">Facturé d’avance (TTC)</dt><dd class="t">'+nxCHF(-x.aF)+'</dd>':'<dt class="t">Honoraires à facturer (TTC)</dt><dd class="t">'+nxCHF(x.aF)+'</dd>')
        +(x.fttc||x.facc?'<dt>Frais à facturer (TTC, '+num(+x.c.frais||0,2)+' %)</dt><dd>'+nxCHF(x.aFr)+'</dd><dt class="t">Total de la prochaine facture (TTC)</dt><dd class="t">'+nxCHF(Math.max(0,x.aF)+x.aFr)+'</dd>':'')+'</dl>'
        +'<div class="sgof-resb">'+(x.L.some(r=>r.choisi)?'<button class="nx-btn" data-a="reprendre" title="Revenir aux avancements proposés par les heures">Reprendre les propositions</button>':'')
        +(prep?'<button class="nx-btn pri" data-a="prep" title="Nouvelle facture de Facturation pour ce contrat, pourcentages reportés : à vérifier puis enregistrer">'+nxSvg('receipt')+'Préparer la facture</button>':'')+'</div></div></section>'; }
  else if(cs.length) html+='<section class="sgof-sec"><div class="sgof-sech"><h3>Situation par rapport aux heures</h3></div><p class="sgof-vide">Aucun contrat en cours avec des prestations SIA à facturer par phases (contrat terminé, annulé, sans phases ou sans montant).</p></section>';
  if(vueOk('anc-factures')) html+='<div class="sgof-pied">Ancienne version (factures de l’ancien logiciel) : <a data-a="ancien" tabindex="0">Archives ▸ Facturation (ancien) ▸ Factures</a></div>';
  const foc=document.activeElement&&box.contains(document.activeElement)&&document.activeElement.matches('input[data-n]')?document.activeElement.dataset.n:null;
  box.innerHTML=html+'</div>';
  if(foc){ const i=box.querySelector('input[data-n="'+foc+'"]'); if(i){ i.focus(); try{ i.select(); }catch(_){} } }
  /* actions */
  const redess=()=>dessinerF(box,DS.get('project',p.ID)||p), chx=()=>(u.ch[u.cid]||(u.ch[u.cid]={}));
  const regler=(n,v)=>{ const r=sit&&sit.L.find(r=>String(r.n)===String(n)); if(!r) return; v=Math.max(r.avF,Math.min(100,+v)); if(!isFinite(v)) return; chx()[n]=v; redess(); };
  box.onclick=e=>{ const t=e.target.closest('[data-go],[data-a],[data-cid],[data-an]'); if(!t||!box.contains(t)||t.disabled) return;
    if(t.dataset.go){ allerFx(box,p,'factures',t.dataset.go,t.dataset.arg); return; }
    if(t.dataset.cid!=null){ u.cid=t.dataset.cid; redess(); return; }
    if(t.dataset.an!=null){ u.an=t.dataset.an; redess(); return; }
    const a=t.dataset.a, r=sit&&t.dataset.n&&sit.L.find(r=>String(r.n)===t.dataset.n);
    if(a==='moins'&&r) regler(r.n,Math.ceil(r.av/5)*5-5<r.avF?r.avF:Math.ceil(r.av/5)*5-5);
    else if(a==='plus'&&r) regler(r.n,Math.floor(r.av/5)*5+5);
    else if(a==='reprendre'){ delete u.ch[u.cid]; redess(); }
    else if(a==='sit'){ const s=box.querySelector('#sgof-sit'); if(s) s.scrollIntoView({behavior:'smooth',block:'start'}); }
    else if(a==='prep'&&sit) preparer(sit,box,p);
    else if(a==='nf'){ const nf=c=>allerFx(box,p,'factures','fx-saisie','nf:'+c.id); if(S.length===1){ nf(S[0]); return; } popMenu(t,S.map(c=>({t:etiq(c)+(c.projet?' — '+c.projet:''),fn:()=>nf(c)}))); }
    else if(a==='deverr') sgDeverrouiller().then(ok=>{ if(ok&&box.isConnected) redess(); });
    else if(a==='ancien'){ try{ SG_ANC.sel=String(p.ID); nxLS.set('sg3_anc_projet',SG_ANC.sel); }catch(_){} go('anc-factures'); } };
  box.onkeydown=e=>{ const i=e.target.closest&&e.target.closest('input[data-n]');
    if(i&&e.key==='Enter'){ e.preventDefault(); regler(i.dataset.n,i.value); return; }
    const t=e.target.closest&&e.target.closest('[data-a][role=button],[data-a="ancien"]'); if(t&&(e.key==='Enter'||e.key===' ')){ e.preventDefault(); t.click(); } };
  box.onchange=e=>{ const i=e.target.closest&&e.target.closest('input[data-n]'); if(i) regler(i.dataset.n,i.value); }; }
/* « Préparer la facture » : nouvelle facture de Facturation pour le contrat, pourcentages cumulés reportés (ff_<k>) */
const PREP={};
function preparer(x,box,p){ const c=x.c;
  if(x.aF<0.5&&x.aFr<0.5){ toast('Rien à facturer : l’avancement choisi ne dépasse pas ce qui est déjà facturé.',true); return; }
  PREP[c.id]={ff:Object.assign({},x.ff),aF:x.aF}; if(box) allerFx(box,p,'factures','fx-saisie','nfp:'+c.id); else go('fx-saisie','nfp:'+c.id); }
/* nouvelle facture du contrat, pourcentages de la situation reportés (écran fx-saisie « nfp: » ou Facturation posée dans le projet) */
function remplirNfp(w,id){ const P=PREP[id];
  w.goTab('saisie'); w.newFacture(); try{ w.updateContratSelect(id); }catch(_){}
  const s=w.document.getElementById('f_contrat'); if(!s) return; s.value=id; w.onSelectContrat();
  if(s.value!==id){ toast('✗ Contrat '+id+' introuvable dans la saisie des factures.',true); return; }
  if(P){ Object.entries(P.ff).forEach(([k,val])=>{ const e=w.document.getElementById('ff_'+k); if(e) e.value=(+val||0).toFixed(2); }); w.upd_f(); delete PREP[id];
    /* Facturation applique le rabais du contrat aux honoraires du contrat, qui le comprennent déjà : écart signalé, rien n'est corrigé ici */
    let r=null; try{ r=w.calcF(); }catch(_){}
    const ecart=r&&isFinite(r.sol)&&Math.abs(r.sol-P.aF)>1;
    if(ecart) sgAlert('Pourcentages reportés d’après la situation par rapport aux heures.\n\nMontant de la situation : '+nxCHF(P.aF)+' CHF TTC.\nMontant calculé par la saisie de Facturation : '+nxCHF(r.sol)+' CHF TTC'+(r.rp?' — la saisie applique encore le rabais du contrat ('+num(r.rp,r.rp%1?2:0)+' %), déjà compris dans ses honoraires.':'.')+'\n\nVérifiez le rabais et le montant avant d’enregistrer.');
    else toast('Facture préparée d’après les heures : vérifiez les pourcentages et les montants, puis enregistrez.'); } }
if(VIEWS['fx-saisie']){ const v=VIEWS['fx-saisie'], r0=v.render;
  v.render=function(m,arg){ const a=String(arg||''); if(!a.startsWith('nfp:')) return r0.apply(this,arguments);
    const id=a.slice(4); document.getElementById('fx-layer').classList.add('on');
    fxEnsure().then(w=>{ if(!VIEW||VIEW.id!=='fx-saisie') return; remplirNfp(w,id); })
      .catch(e=>toast('✗ '+(e&&e.message||e),true)); }; }
/* « Ouvrir » une facture : PDF de Facturation ; en fermant l'aperçu, retour à l'écran d'où l'on venait */
if(VIEWS['fx-factures']){ const v=VIEWS['fx-factures'], r0=v.render;
  v.render=function(m,arg){ const a=String(arg||''); if(!a.startsWith('fv:')) return r0.apply(this,arguments);
    document.getElementById('fx-layer').classList.add('on');
    fxEnsure().then(w=>{ if(!VIEW||VIEW.id!=='fx-factures') return; w.goTab('factures'); w.openFacturePdf(a.slice(3));
      if(!w._sgofClose){ w._sgofClose=w.closeOffre; w.closeOffre=function(){ const r=w._sgofClose.apply(this,arguments); if(w._sgofRetour){ w._sgofRetour=false; if(VIEW&&VIEW.id==='fx-factures') nxHist(-1); } return r; }; }
      w._sgofRetour=NX.pos>0; }).catch(e=>toast('✗ '+(e&&e.message||e),true)); }; }

/* ═══ FACTURATION DANS LA PAGE DU PROJET (01.11.2026, demande de Paulo : « ce n'est pas la bonne version pour la création des offres ; charge
   la méthode de calcul d'honoraires de l'app actuelle, puis crée la liste des contrats de l'affaire comme Contrats d'honoraires de l'app ;
   charge tout ça dans projet » — choix : la liste des offres reste et le calcul s'ouvre dans le projet ; Contrats honoraires = la liste de
   l'app, contrats signés de l'affaire ; Archives ▸ Honoraires (ancien) inchangé) ═══
   Le cadre Facturation (#fx-layer) est posé SUR la page du projet, sous la barre des domaines et une barre de titre (sgof-emb-bar : numéro,
   rubrique, « Fermer » / « Retour à la liste »), au lieu d'ouvrir le module Facturation du chapitre Administration : menu, en-tête et barre des
   domaines restent sur le projet. Position recalculée à chaque changement de taille (ResizeObserver).
   – Offres d'honoraires (précision de Paulo, même soir : « une liste identique à Contrats d'honoraires, uniquement les offres en lien avec
     l'affaire, la même mise en page avec les icônes ») : la liste « Contrats d'honoraires » de Facturation elle-même, limitée à TOUTES les
     offres de l'affaire (archivées comprises : annulées et terminées le sont d'office) ; « + Nouveau contrat » = nouvelle offre pour l'affaire
     (newContratCalc enveloppé : code d'affaire repris) ; cases Envoyé / Signé / Annulé / Terminé, Ouvrir, Modifier (calcul dans le projet,
     « Retour à la liste »), Archiver, Supprimer ; barre : nombre d'offres et d'offres annulées ou refusées, « Relier une offre… ».
     Sans droit ou finances verrouillées : l'ancienne liste en lecture (dessiner, avec le bouton d'état → chSetContratFlag).
   – Contrats honoraires : la liste « Contrats d'honoraires » de Facturation elle-même (mêmes colonnes, cases, Ouvrir, Modifier, Archiver,
     Supprimer), limitée aux contrats SIGNÉS de l'affaire (terminés compris) par le filtre window.SG_CONTRATS_FILTRE {f, vide} que
     renderContratsTable de Facturation.html respecte (il remplace le filtre des archivés) ; « Afficher archivés » et « Nouveau contrat » masqués
     (html.sgof-liste du cadre ; les offres se créent dans Offres d'honoraires). « Modifier » ouvre le calcul dans le projet (« Retour à la
     liste »). Sans droit sur fx-contrats ou finances verrouillées : la liste en lecture (dessiner).
   – Factures : Ouvrir (PDF), Modifier, Facturer, Préparer la facture = Facturation dans le projet ; retour aux factures de l'affaire, redessinées :
     « Fermer », facture enregistrée ou supprimée (Facturation passe à sa liste des factures), PDF fermé.
   Domaine protégé par le code d'accès : déverrouillage demandé comme par go ; verrouillage (sgVerrouiller) → le cadre est retiré.
   Toute navigation (go) retire le cadre posé ; un écran fx-* le rouvre ensuite en plein, sans filtre. */
let EMB=null, LISTE=null;
const TABS_OK={offres:['contrats','calchono'],contrats:['contrats','calchono'],factures:['saisie']};
const ACT={'fx-contrats:cv':'voir','fx-calchono:c':'modif','fx-calchono:newaff':'nouv','fx-saisie:nf':'nf','fx-saisie:nfp':'nfp','fx-saisie:f':'fmod','fx-factures:fv':'fvoir'};
const listeDansProjet=()=>vueOk('fx-contrats')&&!sgFinVerrou();
const proteger=v=>{ const d=typeof sgDomDe==='function'?sgDomDe(v):''; return typeof sgProtege==='function'&&typeof sgOuvert==='function'&&sgProtege(d)&&!sgOuvert(); };
/* une action d'une page de l'affaire vers Facturation : posée dans le projet si elle s'y prête, sinon l'écran fx-* habituel */
function allerFx(box,p,mode,vue,arg){ const a=String(arg||''), m=/^([a-z]+):(.*)$/.exec(a), k=m&&ACT[vue+':'+m[1]];
  if(!k||!box||!box.isConnected||!vueOk(vue)){ go(vue,arg); return; }
  /* page des contrats en lecture (droits, finances verrouillées) : ses actions se comportent comme celles des offres ou des factures */
  const act={k,id:m[2],page:mode}, md=mode==='contrats'?(/^(nf|nfp|fmod|fvoir)$/.test(k)?'factures':'offres'):mode;
  if(proteger(vue)){ sgDeverrouiller().then(ok=>{ if(ok&&box.isConnected) dans(box,DS.get('project',p.ID)||p,md,act); }); return; }
  dans(box,p,md,act); }
function dans(box,p,mode,act){ css(); if(EMB) fermer(false);
  EMB={p,mode,page:act.page||mode,act,tab:null,retour:false,silence:0,box:null,zone:null,bar:null,ro:null};
  poser(box);
  const L=document.getElementById('fx-layer'); if(L) L.classList.add('on','sgof-dans'); placer();
  const x=EMB;
  Promise.resolve().then(()=>fxEnsure()).then(w=>{ if(EMB!==x||!box.isConnected) return; brancher(w); cadre(w); executer(w,x); majBar(); })
    .catch(e=>{ console.error(e); if(EMB!==x) return; fermer(false); if(box.isConnected) box.innerHTML='<p class="sgof-err">La Facturation n’a pas pu être chargée : '+E(e&&e.message||e)+'</p>'; }); }
/* barre de titre et zone sous laquelle le cadre est posé (aussi quand la page du projet est redessinée) */
function poser(box){ const x=EMB; if(!x) return; x.box=box; box.classList.add('emb');
  box.innerHTML='<div class="sgof-emb"><div class="sgof-emb-bar"></div><div class="sgof-emb-zone"></div></div>';
  x.bar=box.querySelector('.sgof-emb-bar'); x.zone=box.querySelector('.sgof-emb-zone');
  if(x.ro) x.ro.disconnect(); if(typeof ResizeObserver==='function'){ x.ro=new ResizeObserver(placer); x.ro.observe(x.zone); }
  x.bar.onclick=e=>{ const t=e.target.closest('[data-a]'); if(!t||EMB!==x) return; const a=t.dataset.a;
    if(a==='fermer') fermer(true);
    else if(a==='liste'){ const w=FX.ready&&FX.w; if(w){ w.goTab('contrats'); w.renderContratsTable(); } }
    else if(a==='offres') go('nx-pdom',x.p.ID+'|Offres d’honoraires'); };
  /* « Relier une offre… » : offre de Facturation reliée à aucune affaire → reliée à celle-ci (liens manuels sg3_liens) */
  x.bar.onchange=e=>{ const s=e.target.closest('select[data-a="lier"]'), D=fxData(); if(!s||EMB!==x||!D) return; const c=D.c.find(y=>y.id===s.value); if(!c) return;
    const l=sgLiens(); l[c.id]=String(x.p.ID); nxLS.set('sg3_liens',l); toast('Offre '+(c.affaire||c.id)+' reliée à '+(x.p.NUMBER||'l’affaire')+'.');
    const w=FX.ready&&FX.w; if(w) w.renderContratsTable(); majBar(); };
  majBar(); placer(); }
function placer(){ const x=EMB, L=document.getElementById('fx-layer'), B=document.getElementById('body'); if(!x||!L||!B||!x.zone||!x.zone.isConnected) return;
  const r=x.zone.getBoundingClientRect(), b=B.getBoundingClientRect();
  Object.assign(L.style,{top:(r.top-b.top)+'px',left:(r.left-b.left)+'px',width:r.width+'px',height:r.height+'px',right:'auto',bottom:'auto'}); }
function majBar(){ const x=EMB; if(!x||!x.bar) return; const p=x.p, k=x.act.k, t=x.tab;
  const R={offres:'Offres d’honoraires',contrats:'Contrats d’honoraires',factures:'Factures'}[x.page];
  const D=fxData(), k0=D&&x.mode==='offres'?compte(p,D):null;   /* sous le titre : nombre d'offres et d'offres annulées ou refusées */
  const sous=k==='voir'?'Contrat en PDF':k==='fvoir'?'Facture en PDF':t==='calchono'?(k==='nouv'?'Nouvelle offre · calcul d’honoraires':'Calcul d’honoraires')
    :t==='saisie'?(k==='fmod'?'Modifier la facture':'Nouvelle facture')
    :t==='contrats'?(x.mode==='offres'?(k0?pl(k0.n,'offre')+' · '+pl(k0.ann,'annulée ou refusée','annulées ou refusées'):'Offres de l’affaire'):'Contrats signés de l’affaire'):'';
  let btn;
  if((x.mode==='contrats'||x.mode==='offres')&&t&&t!=='contrats') btn='<button class="nx-btn" data-a="liste" title="Revenir à la liste '+(x.mode==='offres'?'des offres':'des contrats signés')+' de l’affaire">'+nxSvg('back')+'Retour à la liste</button>';
  else if(x.mode==='contrats') btn='<button class="nx-btn" data-a="offres" title="Toutes les offres de l’affaire : en cours, retenues, annulées ou refusées">'+nxSvg('calc')+'Offres d’honoraires</button>';
  else if(x.mode==='offres'){ const libre=D&&vueOk('fx-calchono')?D.c.filter(c=>!c.annule&&!sgProjetDuContrat(c)):[];
    btn=libre.length?'<select class="inp" data-a="lier" title="Relier à cette affaire une offre de Facturation qui n’est reliée à aucune affaire"><option value="">Relier une offre…</option>'
      +libre.map(c=>'<option value="'+E(c.id)+'">'+E([c.affaire||'(sans code)',c.projet,c.nom].filter(Boolean).join(' — '))+'</option>').join('')+'</select>':''; }
  else btn='<button class="nx-btn" data-a="fermer" title="Revenir '+({offres:'à la liste des offres',contrats:'à la liste des contrats',factures:'aux factures de l’affaire'})[x.page]+'">'+nxSvg('back')+'Fermer</button>';
  x.bar.innerHTML='<b class="no">'+E(p.NUMBER||'')+'</b><div class="tx"><span class="lb">'+E(R+(sous?' · '+sous:''))+'</span><span class="ti">'+E(p.TITLE||'')+'</span></div><div class="ac">'+btn+'</div>'; }
function fermer(redess){ const x=EMB; if(!x) return; x.retour=false; if(x.ro) x.ro.disconnect();
  const w=FX.ready&&FX.w;   /* cadre remis en état AVANT de libérer EMB : ni retour du PDF, ni redessin de la liste en double */
  if(w){ try{ const ov=w.document.getElementById('offre-overlay'); if(ov&&ov.classList.contains('on')) w.closeOffre(); }catch(_){}
    try{ w.SG_CONTRATS_FILTRE=null; w.document.documentElement.classList.remove('sgof-liste','sgof-signes'); w.renderContratsTable(); }catch(_){} }
  EMB=null;
  const L=document.getElementById('fx-layer');
  if(L){ L.classList.remove('sgof-dans'); ['top','left','width','height','right','bottom'].forEach(k=>L.style.removeProperty(k)); if(!/^fx-/.test(vueId())) L.classList.remove('on'); }
  if(x.box){ x.box.classList.remove('emb'); if(redess&&x.box.isConnected&&x.box._sgofFaire) x.box._sgofFaire(); } }
/* enveloppes installées une fois dans le cadre : code d'affaire d'une nouvelle offre, retour après le PDF, liste des offres tenue à jour */
function brancher(w){ if(w._sgofDans) return; w._sgofDans=1;
  const d=w.document, st=d.createElement('style'); st.id='sgof-dans-css';
  st.textContent='html.sgof-signes #panel-contrats .card-hd button[onclick*="newContratCalc"],html.sgof-liste #panel-contrats .card-hd label:has(#show-archived){display:none!important}';
  d.head.append(st);
  const n0=w.newContratCalc; if(typeof n0==='function') w.newContratCalc=function(){ const r=n0.apply(this,arguments); if(EMB&&EMB.p&&EMB.p.NUMBER) affaireCalc(w,EMB.p.NUMBER); return r; };
  const c0=w.closeOffre; if(typeof c0==='function') w.closeOffre=function(){ const r=c0.apply(this,arguments); if(EMB&&EMB.retour){ EMB.retour=false; setTimeout(()=>fermer(true),0); } return r; };
  const r0=w.renderContratsTable; if(typeof r0==='function') w.renderContratsTable=function(){ const r=r0.apply(this,arguments);
    if(!EMB&&LISTE&&LISTE.isConnected&&!LISTE._sgofAttente){ const b=LISTE; b._sgofAttente=1; setTimeout(()=>{ b._sgofAttente=0; if(!EMB&&b.isConnected&&b._sgofFaire) b._sgofFaire(); },0); }
    return r; }; }
function affaireCalc(w,num){ const i=w.document.getElementById('ch_affaire'); if(!i) return; i.value=num; i.dispatchEvent(new Event('input',{bubbles:true})); i.dispatchEvent(new Event('change',{bubbles:true})); }
/* liste « Contrats d'honoraires » de Facturation limitée à l'affaire : toutes ses offres (Offres d'honoraires, archivées comprises) ou ses
   contrats signés (Contrats honoraires, sans « Nouveau contrat ») ; « Afficher archivés » masqué (le filtre les comprend) */
function cadre(w){ const x=EMB, sig=x.mode==='contrats', liste=sig||x.mode==='offres', pid=String(x.p.ID), h=w.document.documentElement;
  h.classList.toggle('sgof-liste',liste); h.classList.toggle('sgof-signes',sig);
  const aff=c=>{ const q=sgProjetDuContrat(c); return !!q&&String(q.ID)===pid; };
  w.SG_CONTRATS_FILTRE=!liste?null:sig?{f:c=>signe(c)&&aff(c),vide:'Aucun contrat signé pour cette affaire. Une offre devient un contrat quand elle est marquée « signé » dans la liste des offres d’honoraires.'}
    :{f:aff,vide:'Aucune offre d’honoraires pour cette affaire. « + Nouveau contrat » crée une offre pour cette affaire.'}; }
function executer(w,x){ const a=x.act, id=a.id;
  if(a.k==='liste'){ x.silence++; try{ w.goTab('contrats'); }finally{ x.silence--; } x.tab='contrats'; w.renderContratsTable(); }
  else if(a.k==='nouv') w.newContratCalc();
  else if(a.k==='modif') w.editContratCalc(id);
  else if(a.k==='voir'){ sgVoirContrat(w,id); w._sgRetour=false; x.retour=true; }
  else if(a.k==='nf'){ w.goTab('saisie'); w.newFacture(); try{ w.updateContratSelect(id); }catch(_){} const s=w.document.getElementById('f_contrat'); if(s){ s.value=id; w.onSelectContrat(); } }
  else if(a.k==='nfp') remplirNfp(w,id);
  else if(a.k==='fmod') w.editFactureSaisie(id);
  else if(a.k==='fvoir'){ x.retour=true; Promise.resolve(w.openFacturePdf(id)).catch(e=>toast('✗ '+(e&&e.message||e),true)); } }
/* Facturation change d'onglet : barre de titre mise à jour, ou retour à la page de l'affaire (enregistrement, suppression, accueil) */
function surTab(tab){ const x=EMB; if(!x||x.silence) return; x.tab=tab; if(TABS_OK[x.mode].includes(tab)) majBar(); else setTimeout(()=>{ if(EMB===x) fermer(true); },0); }
/* état d'une offre depuis sa liste (mêmes règles que les cases de Facturation ▸ Contrats d'honoraires) */
function menuEtat(t,id){ const w=FX.ready&&FX.w, c=((fxData()||{}).c||[]).find(x=>x.id===id); if(!w||!c) return; brancher(w);
  const f=(k,v)=>()=>{ try{ w.chSetContratFlag(id,k,v); }catch(e){ toast('✗ '+(e&&e.message||e),true); } };
  popMenu(t,[{t:'Envoyée au maître de l’ouvrage',chk:!!c.envoye,fn:f('envoye',!c.envoye)},
    {t:'Signée — devient un contrat (verrouillée)',chk:!!c.signe,fn:f('signe',!c.signe)},
    {t:'Annulée ou refusée',chk:!!c.annule,fn:f('annule',!c.annule)},
    {t:'Terminée — plus de nouvelle facture',chk:!!c.termine,fn:f('termine',!c.termine)}]); }
if(typeof go==='function'){ const go0=go; go=function(){ if(EMB) fermer(false); return go0.apply(this,arguments); }; }
if(typeof sgFxOnTab==='function'){ const t0=sgFxOnTab; sgFxOnTab=function(tab){ if(EMB){ surTab(tab); return; } return t0.apply(this,arguments); }; }
if(typeof sgFxHome==='function'){ const h0=sgFxHome; sgFxHome=function(){ if(EMB){ setTimeout(()=>{ if(EMB) fermer(true); },0); return; } return h0.apply(this,arguments); }; }
if(typeof sgVerrouiller==='function'){ const v0=sgVerrouiller; sgVerrouiller=function(){ const r=v0.apply(this,arguments); if(EMB&&sgFinVerrou()) fermer(true); return r; }; }

/* remplacement des trois domaines du moteur ; Archives ▸ Honoraires (ancien) et Facturation (ancien) gardent les écrans d'origine */
const fe0=feDomain, ct0=ctDomain, iv0=ivDomain;
const remplacer=(f0,mode)=>function(C,top,pane,p){ const anc=ANCIEN[MODES[mode].dom];
  if(!p||vueId()===anc) return f0.apply(this,arguments);
  try{ ouvrir(C,p,mode); }
  catch(e){ console.error(e); const d=document.createElement('p'); d.className='sgof-err'; d.textContent=MODES[mode].lb+' : erreur — '+String(e&&e.message||e); C.append(d); } };
feDomain=remplacer(fe0,'offres');
ctDomain=remplacer(ct0,'contrats');
ivDomain=remplacer(iv0,'factures');

/* tuiles de la page du projet : « n offres · x annulées ou refusées », « n contrats signés » (Facturation lue à la demande) */
if(typeof SG_PDOM==='object'&&SG_PDOM){
  if(SG_PDOM['Offres d’honoraires']) SG_PDOM['Offres d’honoraires']=['calc','Toutes les offres de l’affaire : en cours, retenues, annulées ou refusées.'];
  if(SG_PDOM['Contrats honoraires']) SG_PDOM['Contrats honoraires']=['contrat','Les contrats d’honoraires signés.'];
  if(SG_PDOM['Factures']) SG_PDOM['Factures']=['receipt','Les factures de l’affaire, le reste à facturer et la prochaine facture selon les heures.']; }
let attente=null;
const tuileTxt=(p,d,D)=>{ if(d==='Factures'){ const fs=facturesDe(p,D).fs.filter(f=>!fxAnnulee(f)), o=fs.filter(fxUnpaid).length; return pl(fs.length,'facture')+' · '+pl(o,'ouverte'); }
  const k=compte(p,D);
  return d==='Offres d’honoraires'?pl(k.n,'offre')+' · '+pl(k.ann,'annulée ou refusée','annulées ou refusées'):pl(k.sig,'contrat signé','contrats signés'); };
function majTuiles(p){ const D=fxData(); if(!D) return;
  document.querySelectorAll('[data-nb]').forEach(e=>{ const d=e.dataset.nb; if(!ANCIEN[d]) return;
    const x=/^(\d[\d']*)\s*(.*)$/.exec(tuileTxt(p,d,D)); if(x) e.innerHTML='<span class="v">'+E(x[1])+'</span><small>'+E(x[2])+'</small>'; }); }
if(typeof sgPdomCompte==='function'){ const cpt0=sgPdomCompte;
  sgPdomCompte=function(p,d){ if(!ANCIEN[d]||!p) return cpt0.apply(this,arguments);
    const D=typeof fxData==='function'?fxData():null; if(D) return tuileTxt(p,d,D);
    if(!attente&&typeof fxEnsure==='function') attente=Promise.resolve().then(()=>fxEnsure()).catch(()=>null).then(()=>{ attente=null; const q=DS.get('project',String(VIEW&&VIEW.arg||'').split('|')[0]); if(q&&vueId()==='nx-pdom') majTuiles(q); });
    return '…'; }; }

window.SGOF={version:'01.11.2026',lignes,compte,MODES,fe0,ct0,iv0,dessiner,dessinerF,facturesDe,situation,PREP,allerFx,fermer,etat:()=>EMB};
})();

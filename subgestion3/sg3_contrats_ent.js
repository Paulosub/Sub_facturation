/* ═══ CONTRATS D'ENTREPRISE (06.11.2026, bloc 41 ; demande de Paulo : « dans chantier ajouter un module contrat d'entreprise ») — refait le 15.11.2026
   (Paulo, fiche d'un contrat annotée et contrat du bureau joint : « corriger et adapter selon la présentation des autres pages déjà créées. ajoute également la mise en
   page des contrats d'entreprises ») ═══
   Page du projet ▸ Chantier ▸ Contrats d'entreprise. Collection propre sgcontratent (gardée par les reprises ; serveur du NAS : règle « projet modifiable » par PROJECT_ID) :
   {ID <projet>:<aléatoire>, PROJECT_ID, N, DOC_ID (soumission d'origine ou null), CFC, LOT, CONTACT_ID, ETAT brouillon|envoye|signe|resilie, DATE, SIGNE_LE, GENRE,
    POSITIONS:[{id, cfc, lib, ouv, brut}] (montants bruts HT), CONDITIONS:[{id, lib, pct (taux signé, appliqué sur le montant restant) | '' et m (montant fixe)}], TVA,
    HT (total HT après conditions, tenu à jour : liste, tuile, anciens écrans), OFFRE_DU, CONFIRME, DEBUT, DEBUT_TXT, FIN, FIN_TXT, RETENUE, REMARQUE,
    AVENANTS:[{id, n, date, objet, ht, signe}], TEXTE:[blocs de la feuille, sg3_descriptif.js : clauses particulières], MODIFIE, PAR}.
   Contrat d'avant le 15.11.2026 (ni positions ni conditions) : une position au CFC et au lot du contrat, pour son montant HT — écrite à la première modification.
   Liste : chiffres, lots adjugés sans contrat (entreprise proposée d'une soumission ; positions, conditions et TVA reprises de son offre, négociée si elle existe),
   tableau des contrats ; clic = fiche.
   Fiche = présentation des documents de l'app (devis général, contrôle des coûts) : bandeau au numéro du projet, chiffres, onglets Contrat · Positions et conditions ·
   Avenants · Clauses, barre Imprimer / Fonctions ; tout sur place, sans fenêtre. Signé ou résilié : données et clauses verrouillées, les avenants restent ; repasser en
   brouillon demande confirmation. Enregistrement 500 ms après la dernière modification (planif, envoi : un seul à la fois, version vérifiée). Redessin venu d'ailleurs
   seulement si l'on n'est pas en train de saisir.
   PDF (ouvrirPdf) : mise en page du contrat du bureau (sgDsPdf, o.contratEnt, sg3_docsub.js) — 1re page : ouvrage, maître de l'ouvrage, architecte, direction des
   travaux, lot, montants, adjudicataire, offre et délais, signatures ; 2e page : positions, conditions, totaux, avenants, remarque ; clauses particulières à la suite
   s'il y en a. L'ébauche de clauses du 06.11.2026 (jamais validée) n'est plus posée ; restée telle quelle dans un contrat, elle n'est ni affichée ni imprimée.
   Droits : lecture « chantier : lecture » (sgPdomListe) ; modifier = projet modifiable et « chantier : écriture ».
   Dossier du contrat à imprimer (15.11.2026, Paulo, fenêtre du PDF annotée : « ajoute une fenêtre d'option pour imprimer la page de garde, contrat, soumission,
   conditions générales, PV de préadjudication ») : Imprimer ouvre la fenêtre des documents (SGDE.vue, barre « Document PDF ») avec le volet « Pièces du dossier » —
   Page de garde (1re page du contrat), Contrat (positions, conditions, totaux, avenants, remarque, clauses), Soumission (contrat lié à une soumission : son descriptif —
   par articles : étape Contrat de la soumission, sinon les prix de l'entreprise du contrat repris du comparatif en mémoire, à défaut le cahier de l'appel d'offres ;
   sous forme de descriptif : le descriptif), Conditions générales (celles du CFC, sinon celles du projet), PV de préadjudication. Pièces assemblées dans cet ordre par
   pdf-lib, chacune avec sa numérotation ; choix gardé dans le contrat (IMPRESSION {garde, contrat, soumission, cg, preadj} ; contrat verrouillé ou lecture seule : pour
   la séance), au moins une pièce reste cochée. Soumission et conditions générales ne sont fabriquées qu'une fois par ouverture de la fenêtre.
   PV de préadjudication = le formulaire « Séance pré-adjudication » du bureau (PA : une seule description pour l'onglet Préadjudication et pour le PDF, o.preadj de
   sgDsPdf) : données générales, participants, entreprise, planning et effectifs, projet, prix et validités, conditions de paiements, garanties, divers (questions Oui /
   Non, précisions), questions et précisions sur l'offre, documents de la séance, récapitulatif de l'offre (offre reçue et dernières conditions de la soumission, montant
   final du contrat), déclaration et signatures. Saisie dans PREADJ {clé: valeur} du contrat ; ce qui n'est pas saisi s'imprime en pointillés et cases vides (formulaire
   à remplir en séance). Entreprise, travaux et date de l'offre viennent de l'onglet Contrat.
   Styles <style id="sgcn-css">, classes sgcn-* (jusqu'au 15.11.2026 : sgce-*, le même identifiant et les mêmes classes que l'éditeur du contrôle des coûts — le premier
   des deux écrans ouvert privait l'autre de ses styles). Débogage : window.SGCE. */
(function(){
if(!window.SGDP||!window.SGSV||typeof sgDroit!=='function') return;
const {tete,kpi,btn,E,IC,pl,moT,css:cssSv}=SGSV.outils, T='sgcontratent';
const ETATS=[['brouillon','Brouillon'],['envoye','Envoyé'],['signe','Signé'],['resilie','Résilié']], ELIB=Object.fromEntries(ETATS);
const GENRES=['Prix unitaires','Forfait','Prix global'], GENRE_DOC={'Prix unitaires':'A prix unitaires','Forfait':'A prix forfaitaire','Prix global':'A prix global'};
const ONG=[['contrat','Contrat'],['positions','Positions et conditions'],['avenants','Avenants'],['clauses','Clauses'],['preadj','Préadjudication']], TYPES=[['sou','Rubrique'],['pu','Tiret'],['txt','Texte']];
const COND_TYPES=['Rabais','Escompte','Prorata (%)'];
const ETAT={sel:{},ong:{},rec:null,cour:null,imp:{}}, SV={t:null,cours:false,encore:false};
const PIECES=[['garde','Page de garde'],['contrat','Contrat'],['soumission','Soumission'],['cg','Conditions générales'],['preadj','PV de préadjudication']], IMP_DEF={garde:true,contrat:true,soumission:false,cg:false,preadj:false};
const peut=p=>{ try{ return !!((sgAdmin()||sgDroit('projets_modifier','tous')||(sgDroit('projets_modifier','siens')&&sgMesProjets().has(String(p.ID))))&&(sgAdmin()||sgDroit('chantier','ecriture'))); }catch(_){ return false; } };
const num2=n=>svdFmtAmt(+n||0), dmy=d=>d?dfr(d):'', sn=v=>{ const x=parseFloat(String(v==null?'':v).replace(/['’\s]/g,'').replace(',','.')); return isFinite(x)?x:0; };
const r2=x=>Math.round((+x||0)*100)/100, r5=x=>svdRnd(x,true), uid=()=>Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36);
const isoDe=t=>{ const s=String(t==null?'':t).trim(), m=/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s); return m?m[3]+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[1]).slice(-2):(/^\d{4}-\d{2}-\d{2}/.test(s)?s.slice(0,10):''); };
const pct2=x=>num(+x||0,2)+' %';
const CSS=`
.sgcn{container-type:inline-size}
.sgcn .sgfh-ini{white-space:nowrap}
.sgcn-kp{grid-template-columns:repeat(5,minmax(0,1fr))}
.sgcn-kp7{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);border-top:0;container-type:inline-size;margin-bottom:0}
.sgcn-kp7 .nx-kpi{padding:10px 12px 10px 0;margin-right:12px;min-width:0}
.sgcn-kp7 .nx-kpi .v{font-size:clamp(11px,calc(2.1cqi - 2px),22px);margin-top:5px;white-space:nowrap;font-variant-numeric:tabular-nums}
.sgcn-kp7 .nx-kpi .l,.sgcn-kp7 .nx-kpi .s{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgcn-kp7 .nx-kpi .s{margin-top:3px}
.sgcn-ong{border-bottom:1px solid var(--s-filet);margin-top:6px}
.sgcn-ong .sg-onglets{margin:0;border:0;gap:0 20px;flex-wrap:wrap;overflow:visible}
.sgcn-ong .sg-onglets button{font-size:13.5px}
.sgcn-ong .sg-onglets button small{font-size:11px;font-weight:400;color:var(--s-gris);margin-left:4px}
.sgcn-bar{display:flex;gap:2px;flex-wrap:wrap;align-items:center;padding:4px 0;min-height:40px}
.sgcn-bar .ib{border:0!important;background:transparent!important;box-shadow:none!important;border-radius:0!important;height:32px;padding:0 9px;font-size:12.5px;font-weight:700;color:var(--s-noir)}
.sgcn-bar .ib:first-child{padding-left:0}
.sgcn-bar .ib:hover{background:var(--s-jaune3)!important}
.sgcn-bar .ib.on{box-shadow:inset 0 -2px 0 var(--s-nuit)!important}
.sgcn-bar .ib .lb{display:inline!important}
.sgcn-fin{flex:1 1 auto}
.sgcn-ro{font-size:12px;color:var(--s-gris);padding:0 2px}
.sgcn-t{font-size:13px;font-weight:700;margin:20px 0 8px;padding-bottom:4px;border-bottom:2px solid var(--s-noir);display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.sgcn-corps>.sgcn-t:first-child{margin-top:10px}
.sgcn-t small{font-size:12px;font-weight:400;color:var(--s-gris)}
.sgcn tr[data-id]{cursor:pointer}
.sgcn-etats{display:flex;gap:2px 14px;flex-wrap:wrap;align-items:center}
.sgcn-etats button{border:0;background:none;font:inherit;font-size:13px;color:var(--s-gris);padding:4px 0;cursor:pointer;border-bottom:3px solid transparent}
.sgcn-etats button:hover{color:var(--s-noir)}
.sgcn-etats button.on{color:var(--s-noir);font-weight:700;border-bottom-color:var(--s-nuit)}
.sgcn-etats button:disabled{cursor:default}
.sgcn-etats label{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--s-gris);margin-left:10px}
.sgcn-etats label .inp{width:150px}
.sgcn-g{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px 14px}
.sgcn-g label{display:flex;flex-direction:column;gap:4px;font-size:11px;font-weight:700;color:var(--s-gris);min-width:0}
.sgcn-g label small{font-weight:400}
.sgcn-g .lg{grid-column:span 2}
.sgcn-g .tt{grid-column:1/-1}
.sgcn .inp{width:100%;box-sizing:border-box;height:34px;border:1.5px solid var(--s-noir);border-radius:0;background:#fff;font-size:13px;font-weight:400;color:var(--s-noir)}
.sgcn .inp:disabled{background:var(--s-nuit3);border-color:var(--s-nuit3);color:var(--s-noir);-webkit-text-fill-color:var(--s-noir)}
.sgcn textarea.inp{height:auto;padding:6px 8px;font-family:inherit;line-height:1.4;resize:vertical}
.sgcn .inp.r{text-align:right;font-variant-numeric:tabular-nums}
.sgcn-ent{height:34px;border:1.5px solid var(--s-noir);background:#fff;font:inherit;font-size:13px;font-weight:400;color:var(--s-noir);text-align:left;padding:0 8px;cursor:pointer;width:100%;box-sizing:border-box;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sgcn-ent:hover{background:var(--s-jaune3)}
.sgcn-ent:disabled{background:var(--s-nuit3);border-color:var(--s-nuit3);cursor:default}
.sgcn-tab td{vertical-align:middle}
.sgcn-tab .inp{height:28px;font-size:12.5px}
.sgcn-tab tfoot td{font-weight:700;border-top:2px solid var(--s-noir)}
.sgcn-tab td.calc{color:var(--s-gris);font-variant-numeric:tabular-nums}
.sgcn-x{border:0;background:none;color:var(--s-gris);font-size:16px;line-height:1;cursor:pointer;padding:2px 6px}
.sgcn-x:hover{color:var(--s-rouge,#BD1E42)}
.sgcn-plus{margin-top:6px;display:flex;gap:6px;flex-wrap:wrap}
.sgcn-note{font-size:12px;color:var(--s-gris);margin:6px 0}
.sgcn-tot{display:grid;grid-template-columns:minmax(0,1fr) 150px;gap:0 14px;max-width:520px;margin-left:auto;font-size:13px}
.sgcn-tot>div{padding:6px 0;border-bottom:1px solid var(--s-filet);display:contents}
.sgcn-tot span,.sgcn-tot b,.sgcn-tot label{padding:7px 0;border-bottom:1px solid var(--s-filet)}
.sgcn-tot .v{text-align:right;font-variant-numeric:tabular-nums}
.sgcn-tot .fort{font-weight:700;border-bottom:2px solid var(--s-noir)}
.sgcn-tot label{display:flex;align-items:center;gap:8px}
.sgcn-tot label .inp{width:70px;height:26px;font-size:12.5px}
.sgcn-clauses .sgdp-l{margin-left:0}
.sgcn-clauses .sgdp-l[data-t=pu]{margin-left:18px}
.sgcn-clauses .sgdp-l[data-t=pu]::before{left:-14px}
.sgcn-cbar{display:flex;gap:2px;flex-wrap:wrap;align-items:center;margin-bottom:6px}
.sgcn-cbar .ib{border:0!important;background:transparent!important;box-shadow:none!important;height:30px;font-size:12.5px;font-weight:700;color:var(--s-noir)}
.sgcn-cbar .ib:hover{background:var(--s-jaune3)!important}
.sgcn-cbar .ib.on{box-shadow:inset 0 -3px 0 var(--s-nuit)!important}
.sgcn-pa{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:0 28px}
.sgcn-pl{display:grid;grid-template-columns:minmax(110px,40%) minmax(0,1fr);gap:10px;align-items:center;padding:5px 0;border-bottom:1px solid var(--s-filet);font-size:12.5px;min-width:0}
.sgcn-pl>span{min-width:0;overflow-wrap:anywhere}
.sgcn-pl.q{grid-column:1/-1;grid-template-columns:minmax(0,1fr) auto}
.sgcn-pl.l,.sgcn-pl.x,.sgcn-pl.d{grid-column:1/-1;grid-template-columns:minmax(110px,19.2%) minmax(0,1fr)}
.sgcn-pl.x>span{color:var(--s-gris);padding-left:14px}
.sgcn-pd{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.sgcn-pd label{display:flex;flex-direction:column;gap:2px;font-size:11px;font-weight:700;color:var(--s-gris);min-width:0}
.sgcn-pn{grid-column:1/-1;margin:7px 0 5px;font-size:12px;line-height:1.4;color:var(--s-gris)}
.sgcn-on{display:inline-flex}
.sgcn-on button{height:30px;min-width:54px;padding:0 10px;border:1.5px solid var(--s-noir);border-radius:0;background:#fff;font:inherit;font-size:12.5px;color:var(--s-noir);cursor:pointer}
.sgcn-on button+button{border-left:0}
.sgcn-on button:hover:not(:disabled){background:var(--s-jaune3)}
.sgcn-on button.on{background:var(--s-nuit);border-color:var(--s-nuit);color:#fff;font-weight:700}
.sgcn-on button:disabled{cursor:default;opacity:.55}
.sgcn-rc td.r,.sgcn-rc th.r{text-align:right;font-variant-numeric:tabular-nums}
.sgcn-rc tr.t td{font-weight:700;border-top:2px solid var(--s-noir)}
@container (max-width:900px){.sgcn-kp7{grid-auto-flow:row;grid-template-columns:repeat(4,minmax(0,1fr))}.sgcn-kp7 .nx-kpi .v{font-size:18px}}
@container (max-width:760px){.sgcn-pa{grid-template-columns:minmax(0,1fr)}.sgcn-kp{grid-template-columns:repeat(2,minmax(0,1fr))}.sgcn-g{grid-template-columns:repeat(2,minmax(0,1fr))}.sgcn-kp7{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;
const css=()=>{ if(!document.getElementById('sgcn-css')){ const s=document.createElement('style'); s.id='sgcn-css'; s.textContent=CSS; document.head.appendChild(s); } if(cssSv) cssSv(); SGDP.css&&SGDP.css(); };

/* ── données et calcul ── */
const contrats=p=>DS.all(T).filter(c=>String(c.PROJECT_ID)===String(p.ID)).sort((a,b)=>String(a.CFC||'').localeCompare(String(b.CFC||''),'fr',{numeric:true})||(+a.N||0)-(+b.N||0));
const ttc=(ht,tva)=>svdRnd((+ht||0)*(1+(+tva||0)/100),true);   /* arrondi aux 5 centimes, comme les offres */
const avHT=c=>(c.AVENANTS||[]).reduce((s,a)=>s+(+a.ht||0),0);
const totalTTC=c=>ttc((+c.HT||0)+avHT(c),c.TVA);
const entNom=c=>{ const x=c.CONTACT_ID?DS.get('contact',c.CONTACT_ID):null; return x?contactName(x):''; };
/* positions (montants bruts HT), conditions appliquées l'une après l'autre sur le montant restant (taux) ou en montant fixe, total HT, TVA, TTC ; net de chaque position =
   sa part du TTC. Contrat sans positions (avant le 15.11.2026) : une position pour son montant HT. Arrondis aux 5 centimes, comme les offres. */
const calc=c=>{ const P=Array.isArray(c.POSITIONS)&&c.POSITIONS.length?c.POSITIONS:[{id:'0',cfc:c.CFC||'',lib:c.LOT||'',ouv:'',brut:+c.HT||0}], tvaP=+c.TVA||0;
  const brut=r2(P.reduce((s,x)=>s+(+x.brut||0),0)); let st=brut;
  const conds=(Array.isArray(c.CONDITIONS)?c.CONDITIONS:[]).map(k=>{ const fixe=k.pct===''||k.pct==null, m=fixe?r2(+k.m||0):r5(st*(+k.pct||0)/100); st=r2(st+m); return {id:k.id,lib:k.lib||'',pct:fixe?null:+k.pct||0,m,st}; });
  const ht=st, tt=ttc(ht,tvaP), f=brut?tt/brut:0;
  return {brut,conds,cond:r2(ht-brut),ht,tvaP,tva:r2(tt-ht),ttc:tt,lignes:P.map(x=>({id:x.id,cfc:x.cfc||'',lib:x.lib||'',ouv:x.ouv||'',brut:+x.brut||0,net:r5((+x.brut||0)*f)}))}; };
const initPos=c=>{ if(!Array.isArray(c.POSITIONS)||!c.POSITIONS.length) c.POSITIONS=[{id:uid(),cfc:c.CFC||'',lib:c.LOT||'',ouv:'',brut:+c.HT||0}]; if(!Array.isArray(c.CONDITIONS)) c.CONDITIONS=[]; if(!Array.isArray(c.AVENANTS)) c.AVENANTS=[]; };
/* ébauche de clauses posée d'office du 06.11 au 15.11.2026 (jamais validée par Paulo ; le contrat du bureau n'a pas de clauses) : restée telle quelle, elle est ignorée */
const EBAUCHE=[['sou','Objet'],['txt','L’entreprise s’engage à exécuter les travaux du lot désigné ci-dessus, conformément aux pièces contractuelles et aux règles de l’art.'],
  ['sou','Pièces contractuelles'],['txt','Font partie du contrat, dans l’ordre de priorité suivant :'],['pu','Le présent contrat'],['pu','Le descriptif ou la soumission, avec l’offre de l’entreprise'],['pu','Les conditions générales signées par l’entreprise'],['pu','Les plans du dossier d’exécution'],['pu','La norme SIA 118'],
  ['sou','Prix'],['pu','Aucune plus-value ne sera acceptée durant le chantier sans validation préalable par la direction des travaux.'],['pu','Les prix comprennent toutes les prestations nécessaires à la bonne exécution de l’ouvrage.'],
  ['sou','Délais'],['pu','L’entreprise respecte le planning établi par la direction des travaux.'],
  ['sou','Paiements'],['pu','Les situations et la facture finale sont adressées à la direction des travaux pour contrôle.'],
  ['sou','Garanties'],['pu','Les délais de garantie et de dénonciation des défauts sont ceux de la norme SIA 118.'],
  ['sou','Droit applicable'],['pu','Le droit suisse est applicable. Le for est au lieu de l’ouvrage.']];
const estEbauche=L=>Array.isArray(L)&&L.length===EBAUCHE.length&&L.every((b,i)=>b&&b.t===EBAUCHE[i][0]&&String(b.x||'')===EBAUCHE[i][1]);
/* offre de l'entreprise proposée : négociée si elle existe (comparatif détaillé, sinon comparatif bref) ; brut, conditions (sans la TVA) et taux de TVA pour le contrat */
const offre=(S,e)=>{ const c1=((S.unites||{}).C1||{}).chapitres||[], tr=S.travail&&S.travail.modifie&&(S.travail.detail||{})[e.contactId], src=tr||(c1.length?e.detail:e.bref)||{}, O=src.offre||{}, N=src.negociee||{}, x=(+N.net||0)!==0?N:O, net=+x.net||0, tva=+x.tva||0;
  const cs=Array.isArray(x.conditions)?x.conditions:[], tv=cs.find(k=>+k.genre===2), forf=k=>{ try{ return typeof SVD_FORF!=='undefined'&&SVD_FORF.has(+k.genre); }catch(_){ return false; } };
  return {ht:net-tva,net,tva,brut:+x.brut||0,tvaP:tv&&(+tv.valeur||0)?+tv.valeur:null,conds:cs.filter(k=>+k.genre!==2&&(+k.montant||0)!==0).map(k=>({lib:String(k.texte||''),pct:forf(k)?'':+k.valeur||0,m:r2(+k.montant||0)}))}; };
const lots=p=>{ const R=[], faits=new Set(contrats(p).filter(c=>c.ETAT!=='resilie').map(c=>String(c.DOC_ID||'')));   /* contrat résilié : le lot peut être rétabli */ DS.by('devisdocument','PROJECT_ID',p.ID).filter(d=>!+d.ISMARKEDASDELETED).forEach(d=>{ const S=DS.get('soumission',d.ID), e=S&&(S.entreprises||[]).find(x=>x.proposee&&+x.contactId>0); if(e&&!faits.has(String(d.ID))) R.push({d,S,e,o:offre(S,e)}); }); return R.sort((a,b)=>String(a.d.BKP||'').localeCompare(String(b.d.BKP||''),'fr',{numeric:true})); };
async function creer(p,lot){ const N=contrats(p).reduce((m,c)=>Math.max(m,+c.N||0),0)+1, id=p.ID+':'+uid(), d=lot&&lot.d, S=lot&&lot.S, ao=(S&&S.appelOffres)||{}, o=lot&&lot.o, ht=o?r2(o.ht):0;
  const rec={ID:id,PROJECT_ID:p.ID,N,DOC_ID:d?d.ID:null,CFC:d?d.BKP||'':'',LOT:d?d.AWARDINGTEXT||'':'',CONTACT_ID:lot?lot.e.contactId:null,ETAT:'brouillon',DATE:today(),SIGNE_LE:'',GENRE:'Prix unitaires',
    POSITIONS:[{id:uid(),cfc:d?d.BKP||'':'',lib:d?d.AWARDINGTEXT||'':'',ouv:'',brut:o&&o.brut?r2(o.brut):ht}],CONDITIONS:o&&o.brut?o.conds.map(k=>({id:uid(),lib:k.lib,pct:k.pct,m:k.m})):[],
    HT:ht,TVA:o&&o.tvaP!=null?o.tvaP:svdVatDefault(),OFFRE_DU:(/(\d{1,2}\.\d{1,2}\.\d{4})/.exec(String((lot&&lot.e.situationOffre)||''))||[])[1]||'',CONFIRME:'',
    DEBUT:isoDe(ao.debutTravaux),DEBUT_TXT:'',FIN:isoDe(ao.finTravaux),FIN_TXT:'',RETENUE:'',REMARQUE:'',AVENANTS:[],TEXTE:[],MODIFIE:today(),PAR:ME.id};
  /* le total recalculé doit être celui de l'offre : sinon (conditions à références particulières) les conditions sont reprises en montants fixes */
  if(o&&o.brut&&Math.abs(calc(rec).ht-ht)>0.051) rec.CONDITIONS=o.conds.map(k=>({id:uid(),lib:k.lib,pct:'',m:k.m}));
  if(o&&o.brut&&Math.abs(calc(rec).ht-ht)>0.051){ rec.POSITIONS[0].brut=ht; rec.CONDITIONS=[]; }
  rec.HT=calc(rec).ht;
  await DS.commit([{t:T,id,val:rec}]); ETAT.sel[p.ID]=id; ETAT.ong[p.ID]='contrat'; ETAT.rec=null; }

/* ── enregistrement ── */
const seq=id=>(DS.S[T]||{})[id]||0;
async function envoi(rec){ if(SV.cours){ SV.encore=true; return; } SV.cours=true; SV.echec=false; try{ do{ SV.encore=false; await DS.commit([{t:T,id:rec.ID,val:JSON.parse(JSON.stringify(rec)),bseq:seq(rec.ID)}]); }while(SV.encore); }catch(e){ SV.echec=true; if(e&&e.conflict){ ETAT.rec=null; if(ETAT.cour&&ETAT.cour.box.isConnected) ETAT.cour.dessiner(); } } finally{ SV.cours=false; } }
const vider=async rec=>{ if(SV.t){ clearTimeout(SV.t); SV.t=null; await envoi(rec); } while(SV.cours) await new Promise(r=>setTimeout(r,60)); return !SV.echec; };
const planif=rec=>{ rec.MODIFIE=today(); rec.PAR=ME.id; rec.HT=calc(rec).ht; clearTimeout(SV.t); SV.t=setTimeout(()=>{ SV.t=null; envoi(rec); },500); };

/* ── PDF : mise en page du contrat du bureau (sgDsPdf, o.contratEnt) ── */
function donneesPdf(p,c){ const K=calc(c), g=c.GENRE||'Prix unitaires', mt=x=>num2(x);
  let rub=[]; try{ rub=((window.SGDE&&SGDE.livret&&SGDE.livret.deGardeRub(p,{filter:null}))||[]).map(r=>({lib:r.lib,val:[r.nom,r.adr].map(x=>String(x||'').trim()).filter(Boolean).join(', ')})).filter(r=>r.val); }catch(e){ console.error(e); }
  if(!rub.length) rub=[{lib:'Ouvrage',val:p.TITLE||''},{lib:'Maître de l’ouvrage',val:moT(p)||''},{lib:'Architecte',val:'Substances Architectes Sàrl, Rue de la Gare 12, 1096 Cully'},{lib:'Direction des travaux',val:'Substances Architectes Sàrl, Rue de la Gare 12, 1096 Cully'}].filter(r=>r.val);
  const montants=[{lib:'Montant total brut (après rabais)',mid:'HT (après rabais)',val:mt(K.ht)},{lib:'Montant total net',mid:'TVA incl.',val:mt(K.ttc)},{lib:GENRE_DOC[g]||g,mid:'TVA incl.',val:mt(K.ttc),gras:true}];
  const infos=[{lib:'Adjudicataire',val:entNom(c),gras:true},{lib:'Selon offre du',val:c.OFFRE_DU||''},{lib:'Confirmation du mandat le',val:c.CONFIRME||''},{lib:'Début des travaux',val:c.DEBUT_TXT||dmy(c.DEBUT)}];
  if(c.FIN_TXT||c.FIN) infos.push({lib:'Fin des travaux',val:c.FIN_TXT||dmy(c.FIN)});
  if(+c.RETENUE) infos.push({lib:'Retenue de garantie',val:num(+c.RETENUE,1)+' %'});
  const rows=K.lignes.map(l=>({c:[[l.cfc,l.lib].map(x=>String(x||'').trim()).filter(Boolean).join(' '),l.ouv,mt(l.brut),mt(l.net)],s:''}));
  rows.push({c:[],s:'v'},{c:['Contrat brut','',mt(K.brut),''],s:''});
  K.conds.forEach(k=>rows.push({c:[k.lib,k.pct==null?'':pct2(k.pct),mt(k.m),''],d1:true,s:''}));
  rows.push({c:['Total HT','','',mt(K.ht)],s:'p'},{c:['TVA',pct2(K.tvaP),'',mt(K.tva)],d1:true,s:''},{c:['Total TTC','','',mt(K.ttc)],s:'t'});
  const AV=c.AVENANTS||[];
  if(AV.length){ rows.push({c:[],s:'v'},{c:['Avenants'],s:'h'}); AV.forEach(a=>rows.push({c:['Avenant n° '+a.n+(a.date?' du '+dmy(a.date):'')+(a.objet?' – '+a.objet:''),'',mt(a.ht),mt(ttc(a.ht,c.TVA))],l2:true,s:''})); rows.push({c:['Total avec avenants','','',mt(totalTTC(c))],s:'t'}); }
  return {rubriques:rub,cfc:c.CFC||'',lot:c.LOT||'',montants,infos,signatures:['L’entreprise','L’architecte','Le maître de l’ouvrage'],signaturesTitre:'Signature et tampons',
    positions:{tit:['CFC','Ouvrage','Contrat brut','Contrat net'],rows},remarque:c.REMARQUE||'',clauses:(estEbauche(c.TEXTE)?[]:(c.TEXTE||[])).map(b=>({t:b.t,x:b.x,b:!!b.b})),clausesTitre:'Conditions particulières'}; }
async function pdfOctets(p,c,parties){ const {w,R,fn}=await SGDS.ressources(), j=new w.Array(), D=donneesPdf(p,c); if(parties) D.parties={garde:parties.garde!==false,contrat:parties.contrat!==false};
  const o=w.JSON.parse(JSON.stringify({titre:'Contrat d’entreprise',sousTitre:[p.NUMBER,p.TITLE].filter(Boolean).join(' '),date:isoDe(c.DATE)||today(),type:'Contrat d’entreprise',description:'Contrat d’entreprise '+[p.NUMBER,c.CFC,c.LOT].filter(Boolean).join(' '),contratEnt:D})); o.journal=j;
  const oct=await fn(R,null,o); if(j.length) console.info('Contrat d’entreprise :',Array.from(j)); return oct; }
async function ouvrirPdf(p,c){ try{ const oct=await pdfOctets(p,c); sgVisionneuse(new Blob([oct],{type:'application/pdf'}),'Contrat '+[p.NUMBER,c.CFC,c.LOT].filter(Boolean).join(' ')+'.pdf'); }
  catch(e){ console.error(e); toast('Le PDF n’a pas pu être créé : '+(e&&e.message||e),true); } }

/* ── procès-verbal de préadjudication : le formulaire « Séance pré-adjudication » du bureau, libellés et phrases tels quels — une seule description pour l'onglet et le PDF.
   Champ : {k clé, l libellé, ty 'date' | 'on' (Oui / Non) | 'long' (texte libre), def (valeur proposée tant que rien n'est saisi), x (clé d'une précision)},
   {l, auto} (valeur du contrat, non saisie ici), {l, duo:[[clé, libellé, def]…]} (deux valeurs côte à côte), {note} (phrase du formulaire) ── */
const PA=[
  {t:'Données générales',ch:[{k:'date',l:'Date',ty:'date'},{k:'lieu',l:'Lieu'},{l:'Entreprise',auto:c=>entNom(c)},{l:'Travaux de (CFC)',auto:c=>[c.CFC,c.LOT].map(x=>String(x||'').trim()).filter(Boolean).join(' ')},{l:'Offre / soumission du',auto:c=>c.OFFRE_DU||''}]},
  {t:'Participants',ch:[{k:'pEnt',l:'Entreprise'},{k:'pArch',l:'Architecte / DT'},{k:'pIng',l:'Ingénieur spécialisé'},{k:'pMo',l:'Maître de l’ouvrage',def:(c,p)=>moT(p)||''}]},
  {t:'Entreprise',ch:[{k:'ass',l:'Assurance'},{l:'Montant assuré',duo:[['assCas','Par cas'],['assPers','Par personne']]},{k:'assoc',l:'Association',ty:'on'},{k:'assocNom',l:'Entreprise associée'},{k:'st',l:'Sous-traitants',ty:'on'},{k:'stNom',l:'Sous-traitants'},
    {k:'legal',l:'L’entreprise est à jour avec les obligations légales',ty:'on'},{note:'En cas d’adjudication les attestations valables seront transmises à la DT pour l’établissement du contrat.'}]},
  {t:'Planning & effectifs',ch:[{l:'Programme travaux de l’ensemble',duo:[['ensD','Début'],['ensF','Fin']]},{l:'Programme prévisionnel des travaux adjugés',duo:[['adjD','Début',c=>c.DEBUT_TXT||dmy(c.DEBUT)],['adjF','Fin',c=>c.FIN_TXT||dmy(c.FIN)]]},
    {k:'duree',l:'Durée des travaux adjugés (semaines)'},{l:'Effectif prévu pour les travaux',duo:[['effChef','Chef équipes'],['effOuv','Ouvrier / Appr.']]},{l:'Vacances estivales',duo:[['veD','du'],['veF','au']]},{l:'Vacances hivernales',duo:[['vhD','du'],['vhF','au']]},{k:'planPrec',l:'Précisions',ty:'long'}]},
  {t:'Projet',ch:[{k:'prPlace',l:'L’entrepreneur s’est rendu sur place et a pris connaissance de la situation locale',ty:'on'},{k:'prSoum',l:'L’entrepreneur a compris la soumission et validé les quantités',ty:'on'},
    {k:'prProjet',l:'L’entrepreneur a compris le projet, validé les détails et les principes techniques',ty:'on'},{k:'prRes',l:'L’entrepreneur a fait des réserves sur des articles de la soumission ou identifié des prestations nécessaires qui n’apparaissent pas dans la soumission',ty:'on'},{k:'prPrec',l:'Précisions / compléments',ty:'long'}]},
  {t:'Prix et validités',ch:[{k:'pxExact',l:'L’entreprise confirme l’exactitude des prix HT de son offre',ty:'on'},{k:'pxMat',l:'Prix matériaux bloqués jusqu’à la fin des travaux',ty:'on',x:'pxMatX'},{k:'pxMo',l:'Prix main d’œuvre bloqués jusqu’à la fin des travaux',ty:'on'},
    {k:'pxForf',l:'L’entreprise est favorable à un contrat forfaitaire',ty:'on'},{k:'pxPrec',l:'Précisions / conditions',ty:'long'}]},
  {t:'Conditions de paiements',ch:[{k:'paAc',l:'Acompte à la commande',ty:'on'},{note:'En cas d’acompte à la commande, une garantie de restitution sera transmise à la DT.'},{k:'paSit',l:'Situations et factures',def:()=>'Selon cond. gén. architecte'},
    {note:'Mémo : les situations intermédiaires ainsi que les factures seront libellées par CFC et par parties d’ouvrages séparément selon structure du contrat. Le non-respect de cette directive rendra nulle la facture ou la situation intermédiaire.'},{k:'paPrec',l:'Précisions / compléments',ty:'long'}]},
  {t:'Garanties',ch:[{k:'gaFin',l:'Garantie bancaire, ou d’assurance, de fin de travaux (min. 10%)',ty:'on'},{k:'gaPrec',l:'Précisions / compléments',ty:'long'}]},
  {t:'Divers',ch:[{k:'diCg',l:'L’entreprise accepte les conditions générales architecte',ty:'on'},{k:'diPrec',l:'Précisions / compléments',ty:'long'}]}];
const PA_DOCS='Plans\nOffre de l’entreprise\nDétails\nVisite sur place', PA_QT='Questions & précisions sur offre', PA_DT='Documents pour séance de préadjudication';
const PA_DECL='Par sa signature sur le présent document, l’entrepreneur reconnaît avoir eu connaissance de tous les éléments et documents nécessaires et utiles (plans, descriptifs, situation, etc.) pour l’établissement de son prix.';
const paVal=(c,p,k,def)=>{ const v=(c.PREADJ||{})[k]; return String(v!=null?v:(def?def(c,p)||'':'')); };
/* soumission liée au contrat et offre de son entreprise (l'entreprise du contrat, sinon l'entreprise proposée) */
const soumDe=c=>{ const d=c.DOC_ID!=null&&c.DOC_ID!==''?DS.get('devisdocument',c.DOC_ID):null, S=d&&!+d.ISMARKEDASDELETED?DS.get('soumission',d.ID):null; return d&&S?{d,S}:null; };
const offresDe=c=>{ const L=soumDe(c); if(!L) return {O:null,N:null}; const S=L.S, E0=S.entreprises||[], e=E0.find(x=>String(x.contactId)===String(c.CONTACT_ID))||E0.find(x=>x.proposee); if(!e) return {O:null,N:null};
  const c1=((S.unites||{}).C1||{}).chapitres||[], tr=S.travail&&S.travail.modifie&&(S.travail.detail||{})[e.contactId], src=tr||(c1.length?e.detail:e.bref)||{}; return {O:src.offre||null,N:src.negociee&&(+src.negociee.net||0)!==0?src.negociee:null}; };
/* récapitulatif de l'offre : offre reçue et dernières conditions (soumission liée), montant final (contrat) ; une ligne par condition du contrat */
function recapPa(p,c){ const K=calc(c), {O,N}=offresDe(c), m=(B,k)=>B&&(+B[k]||0)?num2(B[k]):'', ht=B=>B&&(+B.net||0)?num2((+B.net||0)-(+B.tva||0)):'';
  const cond=(B,lib)=>{ const k=B&&(B.conditions||[]).find(x=>+x.genre!==2&&String(x.texte||'').trim().toLowerCase()===String(lib||'').trim().toLowerCase()); return k&&(+k.montant||0)?num2(k.montant):''; };
  const rows=[{c:['Total brut',m(O,'brut'),m(N,'brut'),num2(K.brut)],s:''}];
  K.conds.forEach(k=>rows.push({c:[[k.lib,k.pct!=null?pct2(k.pct):''].filter(Boolean).join(' '),cond(O,k.lib),cond(N,k.lib),num2(k.m)],s:''}));
  rows.push({c:['Total net HT',ht(O),ht(N),num2(K.ht)],s:'t'},{c:['TVA '+pct2(K.tvaP),m(O,'tva'),m(N,'tva'),num2(K.tva)],s:''},{c:['Total net TTC',m(O,'net'),m(N,'net'),num2(K.ttc)],s:'t'});
  return {t:'Récapitulatif offre',tit:['Offre','Offre reçue','Dernières conditions','Montant final'],rows,libre:paVal(c,p,'recapLibre').trim()}; }
const paQuestions=t=>String(t||'').replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean).map(x=>/^[-–—•]\s*/.test(x)?{k:'q',x:x.replace(/^[-–—•]\s*/,'')}:(x.length>2&&x===x.toUpperCase()&&/[A-ZÀ-Ý]/.test(x)?{k:'h',x}:{k:'r',x}));
function preadjDonnees(p,c){ const A=c.PREADJ||{}, v=(k,def)=>paVal(c,p,k,def).trim(), on=k=>A[k]==='o'?true:A[k]==='n'?false:null;
  const sections=PA.map(S=>({t:S.t,rows:S.ch.map(f=>f.note?{note:f.note}:f.auto?{lib:f.l,val:String(f.auto(c,p)||'')}:f.duo?{lib:f.l,duo:f.duo.map(([k,l,def])=>[l,v(k,def)])}
    :f.ty==='on'?{lib:f.l,on:on(f.k),val:f.x?v(f.x):''}:f.ty==='long'?{long:f.l,val:v(f.k,f.def)}:{lib:f.l,val:f.ty==='date'?(dmy(isoDe(v(f.k)))||v(f.k)):v(f.k,f.def)})}));
  return {cfc:c.CFC||'',lot:c.LOT||'',sections,questions:{t:PA_QT,lignes:paQuestions(A.questions)},documents:{t:PA_DT,lignes:String(A.docs!=null?A.docs:PA_DOCS).split('\n').map(x=>x.replace(/^[-–—•]\s*/,'').trim()).filter(Boolean)},
    recap:recapPa(p,c),declaration:PA_DECL,lieu:'',date:'',signatures:['Entreprise','Architecte','Ingénieur spécialisé']}; }
async function preadjOctets(p,c){ const {w,R,fn}=await SGDS.ressources(), j=new w.Array();
  const o=w.JSON.parse(JSON.stringify({titre:'Séance de préadjudication',sousTitre:[p.NUMBER,p.TITLE].filter(Boolean).join(' '),date:isoDe(paVal(c,p,'date'))||today(),type:'Procès-verbal de préadjudication',description:'Séance de préadjudication '+[p.NUMBER,c.CFC,c.LOT].filter(Boolean).join(' '),preadj:preadjDonnees(p,c)})); o.journal=j;
  const oct=await fn(R,null,o); if(j.length) console.info('PV de préadjudication :',Array.from(j)); return oct; }

/* ── dossier du contrat : pièces au choix, assemblées dans l'ordre (page de garde, contrat, soumission, conditions générales, PV de préadjudication) ── */
const impDe=c=>Object.assign({},IMP_DEF,ETAT.imp[c.ID]||c.IMPRESSION||{});
/* contexte de lecture d'une soumission qui n'est pas ouverte (copie de travail : rien n'est enregistré) */
const ctxSoum=(p,L)=>{ const S=svNorm(JSON.parse(JSON.stringify(L.S))), id=L.d.ID; return {id,p,ro:true,node:null,el:null,get doc(){ return DS.get('devisdocument',id)||L.d; },get S(){ return S; },get etape(){ return S.etape||'B'; },can:()=>false,commit:async()=>{},touch:async()=>{},redraw(){},go(){},reload(){}}; };
const enOctets=async b=>b&&typeof b.arrayBuffer==='function'?await b.arrayBuffer():b;
async function soumissionOctets(p,c){ const L=soumDe(c); if(!L) return null; const X=ctxSoum(p,L), S=X.S;
  if(SGDP.estD&&SGDP.estD(S)) return enOctets(await SGDP.pdfDe(X,'descriptif'));   /* soumission sous forme de descriptif : le descriptif */
  if(typeof SGDP.pdfArticles!=='function') return null;
  const U=S.unites||{}, a=k=>((U[k]||{}).chapitres||[]).length; let et=a('D')?'D':null;
  /* pas d'étape Contrat dans la soumission : prix et conditions de l'entreprise du contrat repris du comparatif, en mémoire (transfert du moteur sur la copie) */
  if(!et&&a('C1')&&typeof svcTransferDoc==='function'){ const E0=S.entreprises||[], e=E0.find(x=>String(x.contactId)===String(c.CONTACT_ID));
    if(e){ E0.forEach(x=>{ x.proposee=x===e; }); try{ delete U.D; const r=svcTransferDoc(S,'C1','D'); if(r&&r.ok&&a('D')) et='D'; }catch(err){ console.error(err); } } }
  if(!et){ et='B'; toast('Soumission : aucune offre chiffrée de cette entreprise, le cahier de l’appel d’offres est imprimé sans prix.',true); }
  return enOctets(await SGDP.pdfArticles(X,null,et)); }
async function cgOctets(p,c){ if(typeof SGDP.cahierOctets!=='function') return null; const L=soumDe(c); return enOctets(await (L?SGDP.cahierOctets(ctxSoum(p,L),{seul:true}):SGDP.cahierOctets(null,{seul:true,projet:p}))); }
async function fusion(w,L,titre){ const P=w.PDFLib, doc=await P.PDFDocument.create(); for(const by of L){ const src=await P.PDFDocument.load(new w.Uint8Array(by)); (await doc.copyPages(src,src.getPageIndices())).forEach(x=>doc.addPage(x)); }
  doc.setTitle(titre); doc.setAuthor('Substances Architectes'); doc.setProducer('SUBGestion'); return await doc.save(); }
/* cache : soumission et conditions générales ne sont fabriquées qu'une fois par ouverture de la fenêtre (la fenêtre est modale, le contrat ne change pas dessous) */
async function dossierOctets(p,c,sel,cache){ cache=cache||{}; const {w}=await SGDS.ressources(), L=[], une=(k,f,nom)=>{ if(!cache[k]) cache[k]=f().catch(e=>{ console.error(e); return null; }); return cache[k].then(by=>{ if(by) L.push(by); else toast(nom+' : cette pièce n’a pas pu être ajoutée au PDF.',true); }); };
  if(sel.garde||sel.contrat) L.push(await pdfOctets(p,c,{garde:!!sel.garde,contrat:!!sel.contrat}));
  if(sel.soumission) await une('soum',()=>soumissionOctets(p,c),'Soumission');
  if(sel.cg) await une('cg',()=>cgOctets(p,c),'Conditions générales');
  if(sel.preadj) L.push(await preadjOctets(p,c));
  if(!L.length) throw new Error('Aucune pièce à imprimer.');
  return L.length===1?L[0]:await fusion(w,L,'Contrat '+[p.NUMBER,c.CFC,c.LOT].filter(Boolean).join(' ')); }
/* fenêtre des documents de l'app (lecteur, barre « Document PDF ») avec le volet des pièces à imprimer ; seul = une seule pièce pour cette ouverture (choix non gardé) */
function ouvrirDossier(p,c,seul){ if(!window.SGDE||typeof SGDE.vue!=='function') return ouvrirPdf(p,c);
  const sel=seul?Object.assign({garde:false,contrat:false,soumission:false,cg:false,preadj:false},{[seul]:true}):impDe(c), cache={}, lie=!!soumDe(c), verrou=c.ETAT==='signe'||c.ETAT==='resilie';
  if(!lie) sel.soumission=false; if(!PIECES.some(([k])=>sel[k])) sel.contrat=true;
  const titre=(seul==='preadj'?'PV de préadjudication ':'Contrat ')+[c.CFC,c.LOT].map(x=>String(x||'').trim()).filter(Boolean).join(' ');
  const dg=dialog({title:titre,body:h('div'),buttons:[]}), ifr={};
  const D={bd:dg.bd,iframe:ifr,close:dg.close,maj:r=>{ try{ if(ifr._sgVuePrep) ifr._sgVuePrep(); }catch(_){ }
    return Promise.resolve(r).then(oct=>{ if(ifr._sgVue) ifr._sgVue(new Blob([oct],{type:'application/pdf'})); },e=>{ console.error(e); if(ifr._sgVueErr) ifr._sgVueErr(e); }); }};
  const rendre=()=>dossierOctets(p,c,sel,cache);
  const poser=k=>{ const n=Object.assign({},sel,{[k]:!sel[k]}); if(!PIECES.some(([x])=>n[x])){ toast('Au moins une pièce reste cochée.'); return false; }
    sel[k]=n[k]; if(!seul){ ETAT.imp[c.ID]=Object.assign({},sel); if(peut(p)&&!verrou){ c.IMPRESSION=Object.assign({},sel); planif(c); } } };
  const items=()=>PIECES.map(([k,t])=>({t:t+(k==='soumission'&&!lie?' (aucune soumission liée)':''),chk:!!sel[k],dis:k==='soumission'&&!lie,asy:true,grp:'Pièces du dossier',fn:()=>poser(k)}));
  SGDE.vue(D,{barre:'pdf',p,lb:'Contrats d’entreprise',titre,etat:ELIB[c.ETAT]||'',peut:()=>true,items,rendre,pied:seul?'Choix pour cette impression':peut(p)&&!verrou?'Choix gardé dans le contrat':'Choix gardé pour la séance',
    groupes:['Pièces du dossier'],groupe:()=>'Pièces du dossier',rang:()=>0,retrait:()=>false});
  D.maj(rendre()); }

/* ── écran : liste ── */
const lignesTableau=L=>L.map(c=>{ const a=avHT(c); return '<tr data-id="'+E(c.ID)+'"><td class="nw"><b>'+E(c.CFC||'—')+'</b></td><td>'+E(c.LOT||'(sans lot)')+'</td><td>'+E(entNom(c)||'—')+'</td><td class="nw">'+E(c.GENRE||'')+'</td><td class="nw">'+E(dmy(c.DATE))+'</td><td class="r nw">'+num2(ttc(c.HT,c.TVA))+'</td><td class="r nw">'+(a?num2(ttc(a,c.TVA)):'')+'</td><td class="r nw"><b>'+num2(totalTTC(c))+'</b></td><td class="nw">'+E(ELIB[c.ETAT]||'')+(c.ETAT==='signe'&&c.SIGNE_LE?' '+E(dmy(c.SIGNE_LE)):'')+'</td></tr>'; }).join('');
function liste(p){ const L=contrats(p), A=lots(p), sign=L.filter(c=>c.ETAT==='signe'), vivants=L.filter(c=>c.ETAT!=='resilie'), tot=vivants.reduce((s,c)=>s+ttc(c.HT,c.TVA),0), av=vivants.reduce((s,c)=>s+ttc(avHT(c),c.TVA),0), ec=peut(p);
  return '<div class="sgsv sgcn">'+tete(p.NUMBER||'','Contrats d’entreprise',p.TITLE||'',[moT(p)?'Maître de l’ouvrage : '+moT(p):'',pl(L.length,'contrat')].filter(Boolean).join(' · '),ec?btn('new','Nouveau contrat','plus',1):'')
    +'<div class="nx-kpis sgsv-kp sgcn-kp">'+kpi('Contrats',String(L.length),'')+kpi('Signés',String(sign.length),'')+kpi('À établir',String(A.length),'lots adjugés')+kpi('Montant des contrats',num2(tot),'TTC')+kpi('Avenants',num2(av),'TTC')+'</div>'
    +(A.length?'<div class="sgcn-t">Lots adjugés sans contrat <small>entreprise proposée dans la soumission</small></div><table class="nx-tbl"><thead><tr><th>CFC</th><th>Lot</th><th>Entreprise proposée</th><th class="r">Offre TTC</th><th></th></tr></thead><tbody>'+A.map(x=>'<tr><td class="nw"><b>'+E(x.d.BKP||'—')+'</b></td><td>'+E(x.d.AWARDINGTEXT||'')+'</td><td>'+E(svcName(x.e))+'</td><td class="r nw">'+num2(x.o.net)+'</td><td class="r">'+(ec?btn('lot','Établir le contrat','',0,'',' data-d="'+x.d.ID+'"'):'')+'</td></tr>').join('')+'</tbody></table>':'')
    +'<div class="sgcn-t">Contrats</div>'+(L.length?'<table class="nx-tbl"><thead><tr><th>CFC</th><th>Lot</th><th>Entreprise</th><th>Genre</th><th>Date</th><th class="r">Contrat TTC</th><th class="r">Avenants TTC</th><th class="r">Total TTC</th><th>État</th></tr></thead><tbody>'+lignesTableau(L)+'</tbody></table>':'<p class="sgcn-note">Aucun contrat pour ce projet. Choisissez l’entreprise dans le comparatif de la soumission : le lot apparaît ici, prêt à être établi.</p>')+'</div>'; }

/* ── écran : fiche d'un contrat (présentation des documents de l'app) ── */
function fiche(C,p,c,I){ const ec=peut(p), v=c.ETAT==='signe'||c.ETAT==='resilie', ro=!ec||v, ds=ro?' disabled':'', da=ec?'':' disabled';
  initPos(c); if(estEbauche(c.TEXTE)) c.TEXTE=[];
  const og=()=>ETAT.ong[p.ID]||'contrat', titre=()=>[c.CFC,c.LOT].map(x=>String(x||'').trim()).filter(Boolean).join(' ')||'(sans lot)';
  const meta=()=>[p.TITLE,moT(p)?'Maître de l’ouvrage : '+moT(p):'',entNom(c)||'entreprise à choisir',c.MODIFIE?'modifié le '+dmy(c.MODIFIE):''].filter(Boolean).join(' · ');
  const txt=(l,k,cl,ph,x)=>'<label class="'+(cl||'')+'">'+E(l)+(x?' <small>'+E(x)+'</small>':'')+'<input class="inp" data-f="'+k+'" type="text" value="'+E(c[k]==null?'':c[k])+'"'+(ph&&!ro?' placeholder="'+E(ph)+'"':'')+ds+'></label>';
  const kpis=()=>{ const K=calc(c), a=avHT(c), n=(c.AVENANTS||[]).length;
    return kpi('Contrat brut HT',num2(K.brut),pl(K.lignes.length,'position'))+kpi('Conditions',num2(K.cond),K.conds.length?pl(K.conds.length,'condition'):'aucune')+kpi('Contrat HT',num2(K.ht),'après conditions')
      +kpi('TVA '+pct2(K.tvaP),num2(K.tva),'')+kpi('Contrat TTC',num2(K.ttc),GENRE_DOC[c.GENRE]||c.GENRE||'')+kpi('Avenants TTC',num2(ttc(a,c.TVA)),n?pl(n,'avenant'):'aucun')+kpi('Total TTC',num2(totalTTC(c)),'contrat et avenants'); };
  /* onglet Contrat */
  const oContrat=()=>'<div class="sgcn-t">État du contrat'+(v?' <small>verrouillé : repassez en brouillon pour le modifier</small>':'')+'</div><div class="sgcn-etats" role="group" aria-label="État du contrat">'
      +ETATS.map(([k,t])=>'<button type="button" data-etat="'+k+'" class="'+(c.ETAT===k?'on':'')+'"'+da+'>'+E(t)+'</button>').join('')
      +(c.ETAT==='signe'?'<label>Signé le<input class="inp" type="date" data-f="SIGNE_LE" value="'+E(c.SIGNE_LE||'')+'"'+da+'></label>':'')+'</div>'
    +'<div class="sgcn-t">Parties et objet</div><div class="sgcn-g"><label class="lg">Entreprise (adjudicataire)<button type="button" class="sgcn-ent" data-a="ent"'+ds+'>'+E(entNom(c)||'Choisir…')+'</button></label>'+txt('CFC','CFC')+txt('Lot','LOT')
      +'<label>Genre de contrat<select class="inp" data-f="GENRE"'+ds+'>'+GENRES.map(g=>'<option'+(c.GENRE===g?' selected':'')+'>'+E(g)+'</option>').join('')+'</select></label>'
      +'<label>Date du contrat<input class="inp" data-f="DATE" type="date" value="'+E(isoDe(c.DATE))+'"'+ds+'></label></div>'
    +'<div class="sgcn-t">Offre et délais <small>repris sur la première page du contrat</small></div><div class="sgcn-g">'+txt('Selon offre du','OFFRE_DU','lg','date de l’offre')+txt('Confirmation du mandat le','CONFIRME','lg','date, par courriel ou par courrier')
      +'<label>Début des travaux<input class="inp" data-f="DEBUT_TXT" type="text" value="'+E(c.DEBUT_TXT||dmy(c.DEBUT))+'"'+(ro?'':' placeholder="De suite, ou une date"')+ds+'></label>'
      +'<label>Fin des travaux<input class="inp" data-f="FIN_TXT" type="text" value="'+E(c.FIN_TXT||dmy(c.FIN))+'"'+(ro?'':' placeholder="date ou texte"')+ds+'></label>'
      +'<label>Retenue de garantie %<input class="inp r" data-f="RETENUE" type="text" value="'+E(c.RETENUE==null||c.RETENUE===''?'':c.RETENUE)+'"'+ds+'></label></div>'
    +'<div class="sgcn-t">Remarque <small>imprimée au bas de la deuxième page</small></div><div class="sgcn-g"><label class="tt"><textarea class="inp" rows="3" data-f="REMARQUE"'+ds+'>'+E(c.REMARQUE||'')+'</textarea></label></div>';
  /* onglet Positions et conditions */
  const oPositions=()=>{ const K=calc(c), net=id=>(K.lignes.find(l=>l.id===id)||{}).net||0, kc=id=>K.conds.find(k=>k.id===id)||{m:0,st:0};
    return '<div class="sgcn-t">Positions du contrat <small>montants bruts HT ; le net TTC de chaque position est calculé</small></div>'
      +'<table class="nx-tbl sgcn-tab"><thead><tr><th style="width:110px">CFC</th><th>Désignation</th><th style="width:140px">Ouvrage</th><th class="r" style="width:150px">Contrat brut HT</th><th class="r" style="width:140px">Contrat net TTC</th><th style="width:34px"></th></tr></thead><tbody>'
      +c.POSITIONS.map(x=>'<tr data-pos="'+E(x.id)+'"><td><input class="inp" data-pp="cfc" value="'+E(x.cfc||'')+'"'+ds+'></td><td><input class="inp" data-pp="lib" value="'+E(x.lib||'')+'"'+ds+'></td><td><input class="inp" data-pp="ouv" value="'+E(x.ouv||'')+'"'+ds+'></td><td><input class="inp r" data-pp="brut" value="'+num2(x.brut)+'"'+ds+'></td><td class="r nw calc" data-net="'+E(x.id)+'">'+num2(net(x.id))+'</td><td>'+(ro||c.POSITIONS.length<2?'':'<button type="button" class="sgcn-x" data-a="possup" aria-label="Supprimer la position" title="Supprimer la position">×</button>')+'</td></tr>').join('')
      +'</tbody><tfoot><tr><td></td><td>Contrat brut</td><td></td><td class="r nw" data-tot="brut">'+num2(K.brut)+'</td><td class="r nw" data-tot="ttc2">'+num2(K.ttc)+'</td><td></td></tr></tfoot></table>'+(ro?'':'<div class="sgcn-plus">'+btn('posplus','Ajouter une position','plus')+'</div>')
      +'<div class="sgcn-t">Conditions <small>appliquées l’une après l’autre sur le montant restant ; taux négatif = déduction ; sans taux : montant fixe</small></div>'
      +(c.CONDITIONS.length?'<table class="nx-tbl sgcn-tab"><thead><tr><th>Désignation</th><th class="r" style="width:120px">Taux %</th><th class="r" style="width:150px">Montant HT</th><th class="r" style="width:150px">Sous-total HT</th><th style="width:34px"></th></tr></thead><tbody>'
        +c.CONDITIONS.map(x=>{ const fixe=x.pct===''||x.pct==null, k=kc(x.id); return '<tr data-cond="'+E(x.id)+'"><td><input class="inp" data-cc="lib" value="'+E(x.lib||'')+'"'+ds+'></td><td><input class="inp r" data-cc="pct" value="'+E(fixe?'':num(+x.pct||0,2))+'"'+ds+'></td><td>'+(fixe?'<input class="inp r" data-cc="m" value="'+num2(x.m)+'"'+ds+'>':'<div class="r nw calc" data-cm="'+E(x.id)+'">'+num2(k.m)+'</div>')+'</td><td class="r nw calc" data-cst="'+E(x.id)+'">'+num2(k.st)+'</td><td>'+(ro?'':'<button type="button" class="sgcn-x" data-a="condsup" aria-label="Supprimer la condition" title="Supprimer la condition">×</button>')+'</td></tr>'; }).join('')+'</tbody></table>':'<p class="sgcn-note">Aucune condition : le total HT est le contrat brut.</p>')
      +(ro?'':'<div class="sgcn-plus">'+COND_TYPES.map(t=>btn('condplus',t,'plus',0,'',' data-l="'+E(t)+'"')).join('')+btn('condplus','Autre condition','plus',0,'',' data-l=""')+'</div>')
      +'<div class="sgcn-t">Totaux</div><div class="sgcn-tot"><span>Contrat brut HT</span><span class="v" data-tot="brut">'+num2(K.brut)+'</span><span>Conditions</span><span class="v" data-tot="cond">'+num2(K.cond)+'</span><b>Total HT</b><b class="v" data-tot="ht">'+num2(K.ht)+'</b>'
        +'<label>TVA<input class="inp r" data-f="TVA" type="text" value="'+E(c.TVA==null?'':c.TVA)+'"'+ds+'>%</label><span class="v" data-tot="tva">'+num2(K.tva)+'</span><b class="fort">Total TTC</b><b class="v fort" data-tot="ttc">'+num2(K.ttc)+'</b></div>'; };
  /* onglet Avenants */
  const oAvenants=()=>'<div class="sgcn-t">Avenants <small data-avtot></small></div>'+((c.AVENANTS||[]).length?'<table class="nx-tbl sgcn-tab"><thead><tr><th style="width:44px">N°</th><th style="width:150px">Date</th><th>Objet</th><th class="r" style="width:140px">Montant HT</th><th class="r" style="width:130px">Montant TTC</th><th style="width:70px">Signé</th><th style="width:34px"></th></tr></thead><tbody>'
      +(c.AVENANTS||[]).map(a=>'<tr data-av="'+E(a.id)+'"><td>'+E(a.n)+'</td><td><input class="inp" type="date" data-v="date" value="'+E(a.date||'')+'"'+da+'></td><td><input class="inp" data-v="objet" value="'+E(a.objet||'')+'"'+da+'></td><td><input class="inp r" data-v="ht" value="'+num2(a.ht)+'"'+da+'></td><td class="r nw calc" data-avttc="'+E(a.id)+'">'+num2(ttc(a.ht,c.TVA))+'</td><td><input type="checkbox" data-v="signe"'+(a.signe?' checked':'')+da+'></td><td>'+(ec?'<button type="button" class="sgcn-x" data-a="avsup" aria-label="Supprimer l’avenant" title="Supprimer l’avenant">×</button>':'')+'</td></tr>').join('')+'</tbody></table>':'<p class="sgcn-note">Aucun avenant.</p>')
    +(ec?'<div class="sgcn-plus">'+btn('avplus','Ajouter un avenant','plus')+'</div>':'');
  /* onglet Préadjudication : le formulaire de la séance (PA), saisi dans c.PREADJ */
  const oPreadj=()=>{ const A=c.PREADJ||{}, val=(k,def)=>paVal(c,p,k,def);
    const inp=(k,def,ty)=>'<input class="inp" data-pa="'+k+'" type="'+(ty==='date'?'date':'text')+'" value="'+E(ty==='date'?isoDe(val(k,def)):val(k,def))+'"'+ds+'>';
    const on=k=>'<span class="sgcn-on" role="group">'+[['o','Oui'],['n','Non']].map(([v,t])=>'<button type="button" data-pon="'+k+'" data-v="'+v+'" class="'+(A[k]===v?'on':'')+'" aria-pressed="'+(A[k]===v?'true':'false')+'"'+ds+'>'+t+'</button>').join('')+'</span>';
    const champ=f=>f.note?'<p class="sgcn-pn">'+E(f.note)+'</p>'
      :f.auto?'<div class="sgcn-pl"><span>'+E(f.l)+'</span><input class="inp" value="'+E(f.auto(c,p)||'')+'" disabled title="Repris de l’onglet Contrat"></div>'
      :f.duo?'<div class="sgcn-pl d"><span>'+E(f.l)+'</span><div class="sgcn-pd">'+f.duo.map(([k,l,def])=>'<label>'+E(l)+inp(k,def)+'</label>').join('')+'</div></div>'
      :f.ty==='on'?'<div class="sgcn-pl q"><span>'+E(f.l)+'</span>'+on(f.k)+'</div>'+(f.x?'<div class="sgcn-pl x"><span>Précision</span>'+inp(f.x)+'</div>':'')
      :f.ty==='long'?'<div class="sgcn-pl l"><span>'+E(f.l)+'</span><textarea class="inp" rows="2" data-pa="'+f.k+'"'+ds+'>'+E(val(f.k,f.def))+'</textarea></div>'
      :'<div class="sgcn-pl"><span>'+E(f.l)+'</span>'+inp(f.k,f.def,f.ty)+'</div>';
    const R=recapPa(p,c);
    return '<p class="sgcn-note">Formulaire de la séance de préadjudication. Ce qui n’est pas rempli s’imprime en pointillés et en cases vides, pour être complété en séance : Imprimer ▸ PV de préadjudication (PDF).</p>'
      +PA.map(S=>'<div class="sgcn-t">'+E(S.t)+'</div><div class="sgcn-pa">'+S.ch.map(champ).join('')+'</div>').join('')
      +'<div class="sgcn-t">'+E(PA_QT)+' <small>une ligne commençant par un tiret = une question, la ligne suivante = sa réponse, une ligne en MAJUSCULES = un intertitre</small></div><div class="sgcn-g"><label class="tt"><textarea class="inp" rows="6" data-pa="questions"'+ds+'>'+E(A.questions||'')+'</textarea></label></div>'
      +'<div class="sgcn-t">'+E(PA_DT)+' <small>un document par ligne</small></div><div class="sgcn-g"><label class="tt"><textarea class="inp" rows="4" data-pa="docs"'+ds+'>'+E(A.docs!=null?A.docs:PA_DOCS)+'</textarea></label></div>'
      +'<div class="sgcn-t">'+E(R.t)+' <small>offre reçue et dernières conditions : soumission liée ; montant final : ce contrat</small></div>'
      +'<table class="nx-tbl sgcn-rc"><thead><tr>'+R.tit.map((t,i)=>'<th'+(i?' class="r"':'')+'>'+E(t)+'</th>').join('')+'</tr></thead><tbody>'+R.rows.map(r=>'<tr class="'+(r.s||'')+'">'+r.c.map((x,i)=>'<td'+(i?' class="r nw"':'')+'>'+E(x||(i?'—':''))+'</td>').join('')+'</tr>').join('')+'</tbody></table>'
      +'<div class="sgcn-g" style="margin-top:10px"><label class="tt">Ligne libre sous le récapitulatif<input class="inp" data-pa="recapLibre" type="text" value="'+E(A.recapLibre||'')+'"'+ds+'></label></div>'; };
  /* onglet Clauses */
  const oClauses=()=>'<div class="sgcn-t">Clauses particulières <small>imprimées à la suite du contrat ; sans clause, rien n’est ajouté</small></div><div class="sgcn-cbar"></div><div class="sgcn-clauses"></div>';
  C.innerHTML='<div class="sgsv sgcn sgcn-f">'+tete(p.NUMBER||'','Contrat d’entreprise · '+(ELIB[c.ETAT]||''),titre(),meta(),btn('liste','‹ Contrats du projet',''))
    +'<div class="nx-kpis sgsv-kp sgcn-kp7" data-kp>'+kpis()+'</div>'
    +'<div class="sgcn-ong"><div class="sg-onglets" role="tablist">'+ONG.map(([k,t])=>'<button type="button" role="tab" data-o="'+k+'"></button>').join('')+'</div></div>'
    +'<div class="sgcn-bar" data-bar></div><div class="sgcn-corps" data-corps></div></div>';
  const box=C.firstElementChild, corpsEl=box.querySelector('[data-corps]'), bar=box.querySelector('[data-bar]');
  const onglets=()=>box.querySelectorAll('.sgcn-ong [data-o]').forEach(b=>{ const k=b.dataset.o, n=k==='avenants'?(c.AVENANTS||[]).length:k==='clauses'?(c.TEXTE||[]).filter(x=>x&&String(x.x||'').trim()).length:k==='positions'?c.POSITIONS.length:0; b.innerHTML=E((ONG.find(x=>x[0]===k)||[])[1]||'')+(n?' <small>'+n+'</small>':''); b.classList.toggle('on',og()===k); b.setAttribute('aria-selected',og()===k?'true':'false'); });
  const bandeau=()=>{ const t=box.querySelector('.sgfh-tete'); if(!t) return; const h2=t.querySelector('h2'), m=t.querySelector('.sgfh-meta'); if(h2) h2.textContent=titre(); if(m) m.textContent=meta(); };
  const maj=()=>{ const K=calc(c), kp=box.querySelector('[data-kp]'); if(kp) kp.innerHTML=kpis();
    const set=(sel,v)=>box.querySelectorAll(sel).forEach(x=>{ x.textContent=v; });
    K.lignes.forEach(l=>set('[data-net="'+l.id+'"]',num2(l.net))); K.conds.forEach(k=>{ set('[data-cm="'+k.id+'"]',num2(k.m)); set('[data-cst="'+k.id+'"]',num2(k.st)); });
    set('[data-tot="brut"]',num2(K.brut)); set('[data-tot="cond"]',num2(K.cond)); set('[data-tot="ht"]',num2(K.ht)); set('[data-tot="tva"]',num2(K.tva)); set('[data-tot="ttc"]',num2(K.ttc)); set('[data-tot="ttc2"]',num2(K.ttc));
    (c.AVENANTS||[]).forEach(a=>set('[data-avttc="'+a.id+'"]',num2(ttc(a.ht,c.TVA))));
    set('[data-avtot]',(c.AVENANTS||[]).length?'Total du contrat avec avenants : CHF '+num2(totalTTC(c))+' TTC':''); bandeau(); onglets(); };
  const corps=()=>{ const k=og(); corpsEl.innerHTML=k==='positions'?oPositions():k==='avenants'?oAvenants():k==='clauses'?oClauses():k==='preadj'?oPreadj():oContrat();
    if(k==='clauses'){ const host=corpsEl.querySelector('.sgcn-clauses'), cb=corpsEl.querySelector('.sgcn-cbar'); const F=SGDP.feuille(host,{blocs:()=>c.TEXTE||(c.TEXTE=[]),modifie:()=>{ planif(c); onglets(); },ce:!ro,bar:()=>cb});
      if(!ro){ cb.append(...SGDP.outils(F,TYPES)); cb.addEventListener('mousedown',e=>{ if(e.target.closest('.ib')) e.preventDefault(); }); } else cb.remove(); }
    maj(); };
  /* barre : Imprimer, Fonctions (comme les autres documents de l'app) */
  const supprimer=()=>sgConfirm('Supprimer ce contrat ? Cette action est irréversible.',async()=>{ clearTimeout(SV.t); SV.t=null; while(SV.cours) await new Promise(r=>setTimeout(r,60)); try{ await DS.commit([{t:T,id:c.ID,val:null,bseq:seq(c.ID)}]); }catch(_){ return; } ETAT.sel[p.ID]=null; ETAT.rec=null; I.dessiner(); });
  bar.append(ibtn({i:'print',label:'Imprimer',t:'Imprimer',menu:()=>[{t:'Contrat d’entreprise (PDF)',fn:()=>ouvrirDossier(p,c)},{t:'PV de préadjudication (PDF)',fn:()=>ouvrirDossier(p,c,'preadj')}]}),
    ibtn({i:'gear',label:'Fonctions',t:'Fonctions',menu:()=>[{t:'Supprimer le contrat…',dis:!(ec&&c.ETAT==='brouillon'),fn:supprimer}]}));
  { const fin=document.createElement('span'); fin.className='sgcn-fin'; bar.append(fin); if(ro){ const s=document.createElement('span'); s.className='sgcn-ro'; s.textContent=!ec?'Lecture seule':c.ETAT==='signe'?'Contrat signé : verrouillé':'Contrat résilié : verrouillé'; bar.append(s); } }
  corps();
  box.addEventListener('change',e=>{ const t=e.target; if(t.dataset&&t.dataset.pa){ if(ro) return; (c.PREADJ||(c.PREADJ={}))[t.dataset.pa]=t.value; planif(c); return; }
    const k=t.dataset&&t.dataset.f, trp=t.closest&&t.closest('tr[data-pos]'), trc=t.closest&&t.closest('tr[data-cond]'), av=t.closest&&t.closest('tr[data-av]');
    if(k){ const seule=c.POSITIONS.length===1?c.POSITIONS[0]:null, suit=seule&&String(seule.cfc||'')===String(c.CFC||'')&&String(seule.lib||'')===String(c.LOT||'');
      if(k==='TVA'||k==='RETENUE'){ const vide=t.value.trim()===''; c[k]=k==='RETENUE'&&vide?'':sn(t.value); }
      else if(k==='DEBUT_TXT'||k==='FIN_TXT'){ c[k]=t.value.trim(); c[k==='DEBUT_TXT'?'DEBUT':'FIN']=isoDe(t.value); }
      else c[k]=t.value;
      if((k==='CFC'||k==='LOT')&&suit){ seule.cfc=c.CFC||''; seule.lib=c.LOT||''; }   /* une seule position, jamais changée : elle suit le CFC et le lot du contrat */
      planif(c); maj(); }
    else if(trp&&t.dataset.pp){ const x=c.POSITIONS.find(y=>y.id===trp.dataset.pos); if(!x) return; if(t.dataset.pp==='brut'){ x.brut=sn(t.value); t.value=num2(x.brut); } else x[t.dataset.pp]=t.value; planif(c); maj(); }
    else if(trc&&t.dataset.cc){ const x=c.CONDITIONS.find(y=>y.id===trc.dataset.cond); if(!x) return; const f=t.dataset.cc;
      if(f==='lib') x.lib=t.value; else if(f==='m'){ x.m=sn(t.value); t.value=num2(x.m); }
      else if(f==='pct'){ const avant=x.pct===''||x.pct==null, vide=t.value.trim()===''; if(vide){ if(!avant) x.m=(calc(c).conds.find(k=>k.id===x.id)||{m:0}).m; x.pct=''; } else x.pct=sn(t.value); planif(c); if(avant!==vide){ corps(); return; } t.value=num(+x.pct||0,2); }
      planif(c); maj(); }
    else if(av&&t.dataset.v){ const a=(c.AVENANTS||[]).find(x=>x.id===av.dataset.av); if(!a) return; if(t.dataset.v==='signe') a.signe=t.checked; else if(t.dataset.v==='ht'){ a.ht=sn(t.value); t.value=num2(a.ht); } else a[t.dataset.v]=t.value; planif(c); maj(); } });
  box.addEventListener('click',e=>{ const pn=e.target.closest('[data-pon]'); if(pn&&box.contains(pn)){ if(ro) return; const A=c.PREADJ||(c.PREADJ={}), k=pn.dataset.pon; A[k]=A[k]===pn.dataset.v?'':pn.dataset.v; planif(c);
      pn.parentNode.querySelectorAll('[data-pon]').forEach(x=>{ const on=A[k]===x.dataset.v; x.classList.toggle('on',on); x.setAttribute('aria-pressed',on?'true':'false'); }); return; }
    const b=e.target.closest('[data-a],[data-etat],[data-o]'); if(!b||!box.contains(b)) return; const a=b.dataset.a, et=b.dataset.etat, o=b.dataset.o;
    if(o){ if(o!==og()){ ETAT.ong[p.ID]=o; corps(); } return; }
    if(a==='liste'){ vider(c).then(ok=>{ if(!ok){ toast('Contrat non enregistré : le serveur ne répond pas. La fiche reste ouverte.',true); return; } ETAT.sel[p.ID]=null; ETAT.rec=null; I.dessiner(); }); }
    else if(a==='ent') pickContact('Entreprise du contrat',x=>{ if(!x) return; c.CONTACT_ID=x.ID; planif(c); b.textContent=entNom(c)||'Choisir…'; maj(); });
    else if(a==='posplus'){ c.POSITIONS.push({id:uid(),cfc:c.CFC||'',lib:'',ouv:'',brut:0}); planif(c); corps(); const L=corpsEl.querySelectorAll('tr[data-pos]'), i=L.length&&L[L.length-1].querySelector('[data-pp="lib"]'); if(i) i.focus(); }
    else if(a==='possup'){ const id=b.closest('tr').dataset.pos, x=c.POSITIONS.find(y=>y.id===id), faire=()=>{ c.POSITIONS=c.POSITIONS.filter(y=>y.id!==id); planif(c); corps(); }; if(x&&(+x.brut||0)) sgConfirm('Supprimer cette position et son montant ?',faire); else faire(); }
    else if(a==='condplus'){ c.CONDITIONS.push({id:uid(),lib:b.dataset.l||'',pct:0,m:0}); planif(c); corps(); const L=corpsEl.querySelectorAll('tr[data-cond]'), i=L.length&&L[L.length-1].querySelector(b.dataset.l?'[data-cc="pct"]':'[data-cc="lib"]'); if(i){ i.focus(); i.select&&i.select(); } }
    else if(a==='condsup'){ const id=b.closest('tr').dataset.cond; c.CONDITIONS=c.CONDITIONS.filter(y=>y.id!==id); planif(c); corps(); }
    else if(a==='avplus'){ const L=c.AVENANTS||(c.AVENANTS=[]); L.push({id:uid(),n:L.reduce((m,x)=>Math.max(m,+x.n||0),0)+1,date:today(),objet:'',ht:0,signe:false}); planif(c); corps(); const R=corpsEl.querySelectorAll('tr[data-av]'), i=R.length&&R[R.length-1].querySelector('[data-v="objet"]'); if(i) i.focus(); }
    else if(a==='avsup'){ const id=b.closest('tr').dataset.av; sgConfirm('Supprimer cet avenant ?',()=>{ c.AVENANTS=(c.AVENANTS||[]).filter(x=>x.id!==id); planif(c); corps(); }); }
    else if(et&&et!==c.ETAT){ const faire=()=>{ c.ETAT=et; if(et==='signe'&&!c.SIGNE_LE) c.SIGNE_LE=today(); planif(c); I.garder=true; I.dessiner(); }; if(v&&(et==='brouillon'||et==='envoye')) sgConfirm('Ce contrat est verrouillé. Le rouvrir pour le modifier ?',faire); else faire(); } }); }
function ouvrir(C,p){ css(); const I={box:null,garder:false,dessiner:null}; ETAT.cour=I;
  I.dessiner=()=>{ const id=ETAT.sel[p.ID], d=id?DS.get(T,id):null; if(id&&d){ const c=I.garder&&ETAT.rec&&ETAT.rec.ID===id?ETAT.rec:(ETAT.rec=JSON.parse(JSON.stringify(d))); I.garder=false; fiche(C,p,c,I); } else { ETAT.rec=null; C.innerHTML=liste(p); } I.box=C.firstElementChild; };
  C.onclick=e=>{ if(ETAT.sel[p.ID]) return; const b=e.target.closest('[data-a]'), tr=e.target.closest('tr[data-id]'); const cree=l=>{ if(I.cree) return; I.cree=true; creer(p,l).then(I.dessiner).finally(()=>{ I.cree=false; }); }; if(b&&b.dataset.a==='new'){ cree(null); return; } if(b&&b.dataset.a==='lot'){ const L=lots(p).find(x=>String(x.d.ID)===b.dataset.d); if(L) cree(L); return; } if(tr){ ETAT.sel[p.ID]=tr.dataset.id; ETAT.ong[p.ID]='contrat'; I.dessiner(); } };
  C.innerHTML='<p class="sgcn-note">Chargement…</p>'; DS.need([...SV_NEED,T]).then(I.dessiner).catch(e=>{ console.error(e); C.innerHTML='<p class="sgcn-note">Lecture impossible.</p>'; }); }
DS.on(ts=>{ const I=ETAT.cour; if(!I||!I.box||!I.box.isConnected||!hit(ts,T,'devisdocument','soumission','contact','contactowner')) return; if(I.box.contains(document.activeElement)||SV.t||SV.cours) return; setTimeout(()=>{ if(I.box&&I.box.isConnected&&!I.box.contains(document.activeElement)) I.dessiner(); },0); });
window.sgContratsEntModule=function(C,p){ try{ ouvrir(C,p); }catch(e){ console.error(e); C.textContent='Contrats d’entreprise : erreur — '+String(e&&e.message||e); } };
window.sgContratsEntCompte=p=>{ try{ const n=contrats(p).length, a=DS.loaded.has('soumission')?lots(p).length:0; return (n?n+' contrat'+(n>1?'s':''):'aucun contrat')+(a?' · '+a+' à établir':''); }catch(_){ return ''; } };
window.SGCE={ETAT,contrats,lots,offre,calc,donneesPdf,pdfOctets,estEbauche,PA,preadjDonnees,preadjOctets,dossierOctets,soumissionOctets,cgOctets,ouvrirDossier,impDe};
})();

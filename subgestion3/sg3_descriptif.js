/* ═══ SOUMISSION SOUS FORME DE DESCRIPTIF (06.11.2026, bloc 40 ; demande de Paulo : « créer la possibilité de créer une soumission sur la base d'articles de soumission et la
   possibilité de créer une soumission sous forme de descriptif ; voici un descriptif possible que je souhaiterais éditer ici pour le sanitaire », fichier 23JOG_descriptif_250 sanitaire.pdf) ═══
   « Nouvelle soumission » (svNew enveloppé) : choix Par articles (le moteur, inchangé) ou Sous forme de descriptif. Mode dans le contenu : S.mode='descriptif', S.descriptif =
   {entete:{g1,g2,d1,d2}, lettre, titre, blocs:[{id, t, x, b}]} ; t = sec (titre du lot), sou (rubrique soulignée), gr (groupe), txt (texte), pu (tiret), pjt (petit titre), pj (petit tiret) ; b = emphase.
   Éditeur (svNodeFn('tenderEdit') enveloppé) : la feuille elle-même, sans fenêtre, comme le document : Entrée = ligne suivante, Retour arrière en début de ligne = fusion, ↑ ↓ passent d'une ligne à l'autre,
   Cmd-B emphase, Cmd-↑ ↓ déplace, collage de plusieurs lignes (classer), clic droit ; barre : styles, Gras, Monter, Descendre, Supprimer, Importer, PDF. Nouveau descriptif : préambule type du bureau (modele).
   Importer ▾ : PDF (lirePdf, pdf.js du cadre Facturation : position, corps et police de chaque ligne) ou autre descriptif de la base. Enregistrement : le contenu complet, 600 ms après la dernière frappe (planifier,
   SGCP.enregistrer du bloc 39 : un seul envoi à la fois).
   PDF (ouvrirPdf ; svdPrint enveloppé : Appel d'offres ▸ Documents ▸ Descriptif et Descriptif en PDF) : sgDsPdf, options o.enteteLibre et o.descriptif (papier des contrats, en-tête à quatre champs, bande noire, mesures
   relevées sur le PDF de Paulo).
   Étapes (SV_TREE réduit à l'ouverture, svEditor enveloppé) : Descriptif, Soumissionnaires, Comparatif bref (offres globales ; une ligne pour le CFC du lot d'office). Les étapes par article n'ont pas d'objet ici.
   Styles <style id="sgdp-css">, classes sgdp-*. Débogage : window.SGDP. */
(function(){
if(typeof svEditor!=='function'||typeof sgDsPdf!=='function'||!window.SGCP||typeof svNodeFn!=='function') return;
const E=s=>esc(String(s==null?'':s));
const TYPES=[['sec','Titre du lot'],['sou','Rubrique'],['gr','Groupe'],['pu','Tiret'],['txt','Texte'],['pjt','Petit titre'],['pj','Petit tiret']], LIB=Object.fromEntries(TYPES);
const SUITE={sec:'sou',sou:'pu',gr:'sou',pu:'pu',txt:'txt',pjt:'pj',pj:'pj'}, PH={sec:'Titre du lot',sou:'Rubrique',gr:'Groupe',pu:'Texte du tiret',txt:'Texte',pjt:'Petit titre',pj:'Petit tiret'};
const ETAT={ov:null,cour:null,t:null,t0:0,mem:null,cle:'descriptif'}; let N=0;
const CG='conditionsGenerales';
const nouv=(t,x,b)=>({id:'b'+(++N).toString(36)+Date.now().toString(36),t,x:x||'',b:!!b});
const estD=S=>!!S&&S.mode==='descriptif';
const CSS=`
.sgdp-bar{flex-wrap:wrap}
.sgdp-bar .ib.on{box-shadow:inset 0 -3px 0 var(--s-nuit)!important}
.sgdp-sep{width:1px;height:20px;background:var(--s-filet);margin:0 6px}
.sgdp-zone{flex:1 1 auto;min-height:0;overflow:auto;background:var(--s-nuit3);padding:16px 0}
.sgdp-feuille{width:min(780px,calc(100% - 32px));box-sizing:border-box;margin:0 auto;background:#fff;padding:22px 44px 80px 24px;font-size:13px;line-height:1.42;color:var(--s-noir);box-shadow:0 0 0 1px var(--s-filet)}
.sgdp-ent{display:flex;justify-content:space-between;gap:24px;font-size:11px;line-height:1.3;border-bottom:1px solid var(--s-noir);padding-bottom:3px;margin-bottom:44px}
.sgdp-ent .dr{text-align:right}
.sgdp-ent b{font-weight:700;display:block}
.sgdp-ent [data-e]{min-width:150px;min-height:1.3em}
.sgdp-ent [data-e]:empty::before{content:attr(data-ph);color:var(--s-gris)}
.sgdp-bande{display:flex;gap:12px;background:#000;color:#fff;font-size:16px;font-weight:700;padding:3px 6px;margin-bottom:40px}
.sgdp-bande [data-c=lettre]{min-width:12px}
.sgdp-bande [data-c=titre]{flex:1}
.sgdp-ce{outline:0}
.sgdp-ent .sgdp-ce:focus{background:var(--s-jaune3)}
.sgdp-bande .sgdp-ce:focus{box-shadow:0 1px 0 #fff}
.sgdp-l{position:relative;margin-left:74px;padding:1px 4px;min-height:1.42em;outline:0;white-space:pre-wrap;overflow-wrap:anywhere}
.sgdp-l:hover{background:var(--s-jaune3)}
.sgdp-l:focus{background:var(--s-jaune2)}
.sgdp-l.vide::after{content:attr(data-ph);color:var(--s-gris)}
.sgdp-l.sel{background:var(--s-jaune2);box-shadow:inset 3px 0 0 var(--s-nuit)}
.sgdp-l[data-t=pu]{margin-top:1px}
.sgdp-l[data-t=pu]::before{content:'-';position:absolute;left:-22px}
.sgdp-l[data-t=pj]{font-size:11px;padding-left:12px}
.sgdp-l[data-t=pj]::before{content:'-';position:absolute;left:4px}
.sgdp-l[data-t=pjt]{font-size:11px;text-decoration:underline;margin-top:6px}
.sgdp-l[data-t=sec]{font-size:11px;font-weight:700;text-decoration:underline;margin-top:30px}
.sgdp-l[data-t=sou]{text-decoration:underline;margin-top:22px}
.sgdp-l[data-t=gr]{margin-top:24px}
.sgdp-l[data-b="1"]{font-weight:700}
.sgdp-l[data-r="1"]{margin-left:110px}
.sgdp-l[data-t=ban]{background:#000;color:#fff;font-weight:700;font-size:15px;margin:38px 0 16px 0;padding:3px 8px}
.sgdp-l[data-t=ban]:hover,.sgdp-l[data-t=ban]:focus{background:#000;box-shadow:0 0 0 2px var(--s-jaune)}
.sgdp-l[data-t=ban].vide::after{color:#999}
.sgdp-l[data-t=fl]{padding-right:130px}
.sgdp-l[data-t=fl]::before{content:'';position:absolute;right:4px;bottom:5px;width:110px;border-bottom:1px solid var(--s-noir)}
.sgdp-l[data-t=cad]{border:1px solid var(--s-noir);padding:6px 8px;margin-top:14px;margin-left:110px}
.sgdp-l[data-t=kv]{margin-top:2px}
.sgdp-obj{display:flex;flex-wrap:wrap;gap:3px 10px;align-items:baseline;background:var(--s-nuit3);border:1px dashed var(--s-gris);padding:7px 10px;margin-top:10px;cursor:default;white-space:normal}
.sgdp-obj:hover{background:var(--s-nuit3)}
.sgdp-obj:focus{box-shadow:0 0 0 2px var(--s-jaune)}
.sgdp-obj b{font-size:12px}
.sgdp-obj span{flex:1 1 300px;font-size:12px;color:var(--s-gris)}
.sgdp-obj button{font:inherit;font-size:12px;border:0;background:none;color:var(--s-nuit);text-decoration:underline;cursor:pointer;padding:0}
.sgdp-obj[data-t=saut]{background:none;border:0;border-top:1px dashed var(--s-gris);justify-content:center;padding:2px 0;color:var(--s-gris)}
.sgdp-obj[data-t=saut] b{font-weight:400}
.ov.sgdp-cap{opacity:0!important;pointer-events:none!important}
.sgdp-l[data-loc="1"]{box-shadow:inset 3px 0 0 var(--s-jaune);background:var(--s-jaune3)}
.sgdp-obj[data-loc="1"]{border-color:var(--s-jaune)}
.sgdp-cgb{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;padding:7px 12px;background:#fff;border-bottom:1px solid var(--s-filet);font-size:12.5px;line-height:1.35}
.sgdp-cgb.loc{background:var(--s-jaune2)}
.sgdp-cgb b{font-weight:700;white-space:nowrap}
.sgdp-cgb span{flex:1 1 320px}
.sgdp-cgb button{border:0;background:none;padding:0;font:inherit;color:var(--s-nuit);text-decoration:underline;cursor:pointer;white-space:nowrap}
.sgcgm-aide{font-size:12.5px;color:var(--s-gris);margin:10px 0 12px;max-width:900px}
.sgcgm-tb{margin-bottom:16px}
.sgcgm-tb tr[data-d]{cursor:pointer}
.sgcgm-loc{background:var(--s-jaune2);padding:1px 6px;font-size:12px}
.sgcgm-ed{border-top:2px solid var(--s-noir);display:flex;flex-direction:column;min-height:420px}
.sgcgm-ed .sgdp-zone{flex:1 1 auto;overflow:visible}
.sgdp-choix{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:min(560px,80vw)}
.sgdp-choix button{display:block;text-align:left;font:inherit;background:#fff;border:1.5px solid var(--s-noir);padding:14px 16px;cursor:pointer;color:var(--s-noir)}
.sgdp-choix button:hover{background:var(--s-jaune3)}
.sgdp-choix b{display:block;font-size:14px;margin-bottom:6px}
.sgdp-choix span{display:block;font-size:12px;line-height:1.4;color:var(--s-gris)}
.sgdp-liste{width:min(520px,78vw);max-height:360px;overflow:auto}
.sgdp-liste button{display:block;width:100%;text-align:left;font:inherit;background:none;border:0;border-bottom:1px solid var(--s-filet);padding:8px 4px;cursor:pointer;color:var(--s-noir)}
.sgdp-liste button:hover{background:var(--s-jaune3)}
`;
const css=()=>{ if(!document.getElementById('sgdp-css')){ const s=document.createElement('style'); s.id='sgdp-css'; s.textContent=CSS; document.head.appendChild(s); } };

/* ── contenu : préambule type du bureau, repris du descriptif de Paulo ── */
function modele(X){ const d=X.doc||{}, c=String(d.BKP||'').trim(), t=[c?(/\./.test(c)?c:c+'.0'):'',String(d.AWARDINGTEXT||'').toUpperCase()].filter(Boolean).join(' ');
  return [nouv('pjt','Fait partie de la présente demande d’offre :'),...['Conditions générales à signer par l’entreprise','Présent descriptif','Dossier de plan général du ','Dossier de plan technique du '].map(x=>nouv('pj',x)),
    nouv('sec',t),nouv('sou','Préambule'),...[['Tous les travaux listés ci-dessous doivent être inclus dans l’offre de base de l’entreprise.'],['Si des travaux listés ci-dessous ne sont pas jugés nécessaires, l’offre doit préciser que ces prestations ne sont pas intégrées dans l’offre.'],
      ['Sauf changement, l’adjudication sera faite à prix unitaire, c’est-à-dire que la facturation finale se fera selon un décompte précis des travaux effectués et sur la base des prix unitaires dans l’offre.'],['Aucune plus-value ne sera acceptée durant le chantier sans validation préalable par la DT.'],
      ['Les conditions générales (jointes à ce document) doivent être signées et approuvées par l’entreprise pour que son offre soit valable.',1],['Les conditions générales de l’entreprise ne sont pas prises en considération.',1],['Ce document fait partie de l’adjudication.',1],
      ['Une séance de pré adjudication sera possiblement sollicitée par la DT. Le PV de cette séance fera partie de l’adjudication.']].map(([x,b])=>nouv('pu',x,b)),nouv('sou','Général'),nouv('pu','')]; }
/* ── conditions de l'appel d'offres : modèle du bureau (07.11.2026, repris du cahier 23JOG 250 Sanitaire du 06.11.2026, Paulo : « toutes les soumissions ») ──
   [type, texte, options] ; types : auto (pièce remplie d'office : garde, entreprise, resume, orga), ban (section : lettre, chiffre, titre), sec (à remplir / à signer), sou (rubrique),
   gr (titre), txt (texte ; « 1. » en tête = numéroté), pu (tiret), kv (« libellé : valeur »), fl (ligne à remplir), cad (encadré), sig (signature), saut (saut de page),
   annexe (plan joint) ; r = retrait (sous un titre numéroté). Jetons remplacés à l'impression : {commune}, {rue}, {parcelle}, {bureau}, {dt}, {mo}, {ouvrage}, {projet}, {cfc}, {lot}.
   Ce que le cahier 23JOG avait de propre à l'affaire (description du projet, valeurs du site) est laissé à compléter ou rempli d'office. */
const MODELE_CG=[
 ['auto','garde'],
 ['txt','L’offre et ses annexes, dûment remplie et signée, sera déposée ou envoyée à l’adresse de retour mentionnée et dans les délais prescrits. Le timbre postal ne fait pas foi.'],
 ['txt','Un prix doit être déposé pour toutes les prestations décrites. Des propositions ou remarques sont possibles, mais uniquement en sus et sur un document séparé.'],
 ['txt','L’adjudication de ces travaux est liée à l’acceptation du permis de construire et à l’octroi du crédit de construction. Aucune indemnisation ne pourra être demandée en cas d’interruption de la procédure.'],
 ['auto','entreprise'],
 ['ban','A Résumé de l’offre'],
 ['sec','A REMPLIR PAR LE SOUMISSIONNAIRE'],
 ['auto','resume'],
 ['saut',''],
 ['sec','A SIGNER PAR LE SOUMISSIONNAIRE'],
 ['sou','Généralités :'],
 ['txt','1. Le terme « le soumissionnaire » désigne dans la présente offre aussi bien le soumissionnaire que la soumissionnaire.'],
 ['txt','2. L’entrepreneur (le soumissionnaire) est lié par son offre pendant douze mois à compter de l’expiration du délai fixé pour le dépôt de l’offre.'],
 ['txt','3. Les offres doivent être remises sous pli fermé. Le projet, le n° du CFC et la catégorie de travaux seront mentionnés sur l’enveloppe.'],
 ['txt','4. Pour les prestations fournies en Suisse, le soumissionnaire s’engage à observer les dispositions relatives à la protection des travailleurs et des travailleuses et les conditions de travail en vigueur au lieu où la prestation est fournie.'],
 ['txt','Le soumissionnaire s’engage également à respecter l’égalité de traitement entre hommes et femmes, et particulièrement le principe des salaires égaux pour les prestations fournies en Suisse.',{r:1}],
 ['txt','5. Le soumissionnaire qui fait appel à des sous-traitants de manière générale ou pour un travail déterminé est tenu de stipuler dans les contrats qu’il établit avec ces tiers que ceux-ci doivent également respecter les obligations mentionnées à l’article 4 ci-dessus.'],
 ['txt','6. L’adjudicateur est en droit de contrôler ou de faire contrôler l’observation des dispositions relatives à la protection des travailleurs, aux conditions de travail et à l’égalité de traitement entre hommes et femmes.'],
 ['txt','Sur demande, le soumissionnaire doit apporter la preuve qu’il les observe.',{r:1}],
 ['txt','7. Les prix offerts comprennent l’ensemble des coûts de prestations correspondantes, et donc entre autres les coûts de transport et d’inspection, les primes d’assurances, les charges fiscales, les droits de douane et autres taxes d’importation.'],
 ['txt','8. Le paiement sera effectué en francs suisses (CHF).'],
 ['txt','9. Le soumissionnaire consent le rabais et l’escompte sur les travaux en régie également (en plus du rabais de quantité), ainsi que sur l’éventuelle compensation du renchérissement dans la mesure où celui-ci n’est pas calculé sur la base de montants nets et sur tous les travaux complémentaires demandés.'],
 ['txt','10. L’adjudicataire se réserve le droit de demander les garanties utiles dans le cadre de l’exécution des travaux.'],
 ['cad','Le soumissionnaire soussigné a pris connaissance de l’ensemble des données, des conditions, des descriptifs des prestations et du projet ainsi que des annexes éventuelles contenues dans la présente offre, et tout particulièrement de la convention concernant le calcul du renchérissement pour les travaux de construction ainsi que des conditions générales de l’adjudicateur. Il les accepte par sa signature.'],
 ['sig',''],
 ['ban','B Organisation du projet'],
 ['auto','orga'],
 ['ban','C 1 Descriptif général du projet'],
 ['gr','SITUATION'],
 ['txt',''],
 ['gr','PROJET'],
 ['txt',''],
 ['ban','C 2 Informations concernant le site du chantier'],
 ['kv','Commune : {commune}'],
 ['kv','Rue : {rue}'],
 ['kv','Parcelle n° : {parcelle}'],
 ['kv','Accès / réglementation : -'],
 ['kv','Surveillance : DT {bureau}'],
 ['kv','Secteur de protection des eaux : '],
 ['kv','Note de recensement architectural : -'],
 ['kv','Degré de sensibilité au bruit : '],
 ['kv','Protections des arbres : -'],
 ['kv','Installations de chantier : compris dans le prix (si non spécifié)'],
 ['kv','Espaces pour entreposer des matériaux : sur l’aire du chantier et en accord avec la DT'],
 ['kv','Places de stationnement : disponibles sur la parcelle, à convenir'],
 ['kv','Utilisation des toilettes : dans l’aire du chantier'],
 ['kv','Utilisation de cantines : néant'],
 ['kv','Horaires de travail : 7 h 00 - 12 h 00, 13 h 00 - 17 h 00'],
 ['kv','Dispositions de sécurité : selon normes en vigueur'],
 ['kv','Prévention contre l’incendie : selon normes en vigueur'],
 ['kv','Entraves à la navigation aérienne : néant'],
 ['kv','Panneaux publicitaires : aucune publicité n’est acceptée (bâches, etc.)'],
 ['kv','Evacuation des déchets : par l’entreprise (tri des déchets)'],
 ['kv','Bennes à disposition sur le chantier : aucune'],
 ['kv','Divers : respect de la propreté des lieux'],
 ['ban','C 3 Travaux en régie ne figurant pas dans le descriptif des prestations (tous travaux, à l’exception des travaux d’installations du bâtiment)'],
 ['sec','A REMPLIR PAR LE SOUMISSIONNAIRE'],
 ['txt','Les travaux en régie ne seront acceptés que s’ils ont été commandés préalablement et par écrit par le maître de l’ouvrage. Les rapports de régie seront présentés au fur et à mesure de leur exécution, mais au plus tard dans un délai d’une semaine, pour signature au maître de l’ouvrage (cf. les articles 44 et 47 de la norme SIA 118). Les divergences éventuelles seront réglées dans les plus brefs délais.'],
 ['gr','TARIFS DE REGIE'],
 ['txt','comprenant tous suppléments et frais de déplacement, mais sans la TVA, ni le matériel'],
 ['kv','Chef d’équipe : CHF .................../heure'],
 ['kv','Ouvrier spécialisé : CHF .................../heure'],
 ['kv','Manœuvre : CHF .................../heure'],
 ['kv','Apprenti en .......année d’apprentissage : CHF .................../heure'],
 ['kv','Apprenti en .......année d’apprentissage : CHF .................../heure'],
 ['kv','Apprenti en .......année d’apprentissage : CHF .................../heure'],
 ['txt','Professions spécialisées du métier'],
 ['kv','........................................... : CHF .................../heure'],
 ['kv','........................................... : CHF .................../heure'],
 ['kv','........................................... : CHF .................../heure'],
 ['kv','........................................... : CHF .................../heure'],
 ['txt','Ces tarifs de régie ne sont pas applicables lorsque des travaux en régie sont prévus séparément dans le descriptif des prestations.'],
 ['txt','L’engagement du contremaître ou du monteur en chef ne sera rémunéré que s’il est indispensable à l’exécution des travaux et pour autant seulement qu’il ait été ordonné expressément et par écrit par le maître de l’ouvrage.'],
 ['kv','Contremaître / monteur en chef : CHF .................../heure'],
 ['ban','D Conditions techniques'],
 ['gr','1. MODIFICATION DU TEXTE DE LA SOUMISSION'],
 ['txt','Aucune modification du texte ci-après n’est admise, faute de quoi la soumission sera annulée.',{r:1}],
 ['txt','Les conditions générales de l’entrepreneur ne sont pas prises en considération.',{r:1,b:1}],
 ['txt','Si l’entrepreneur a d’autres propositions à formuler, des variantes à proposer, il doit le faire par écrit, en dehors de la formule de soumission et dans le même délai.',{r:1}],
 ['gr','2. INSTALLATIONS'],
 ['txt','Eau et électricité : raccordement dans l’aire de chantier.',{r:1}],
 ['gr','3. NETTOYAGE DU CHANTIER'],
 ['txt','L’ordre et la propreté devront régner tant sur le chantier que sur ses abords.',{r:1}],
 ['txt','Les accès devront rester libres dans toute la mesure du possible.',{r:1}],
 ['txt','Si l’entrepreneur n’observe pas l’article 118 de la norme SIA 118 (ordre sur le chantier et ses accès), il en supportera les frais.',{r:1}],
 ['gr','4. COMPTE PRORATA'],
 ['txt','Les frais suivants seront pris en charge par les entrepreneurs au taux appliqué sur le montant total net de la facture finale comprenant les compléments et la régie :',{r:1}],
 ['pu','Installation de chantier en commun',{r:1}],
 ['pu','Consommation d’électricité, d’eau, etc.',{r:1}],
 ['pu','Installation sanitaire de chantier, éclairage du chantier',{r:1}],
 ['pu','Nettoyage et enlèvement de gravats de provenance indéterminée',{r:1}],
 ['pu','Réparation des dégâts dont les auteurs resteraient inconnus',{r:1}],
 ['pu','Gestion des déchets (si déchetterie commune)',{r:1}],
 ['gr','5. PUBLICATIONS, PHOTOS, RESEAUX SOCIAUX'],
 ['txt','Elles ne sont autorisées qu’avec l’accord écrit du maître de l’ouvrage.',{r:1}],
 ['gr','6. NUISANCES'],
 ['txt','Les nuisances (bruit, vibrations, poussière) occasionnées par le chantier devront être limitées au maximum.',{r:1}],
 ['txt','Les ouvriers seront rendus attentifs au fait que leur activité se déroule à proximité de lieux d’habitation et de travail et qu’en conséquence, ils éviteront toute émission de bruit autre que celle strictement nécessaire à l’exécution d’une tâche. L’utilisation de cornes d’appels téléphoniques est proscrite.',{r:1}],
 ['txt','L’entrepreneur utilisera un matériel en parfait état permettant à la fois de limiter l’intensité des émissions de bruit et de respecter le planning des travaux. Les machines et équipements seront de préférence actionnés par des moteurs électriques.',{r:1}],
 ['txt','L’entrepreneur instruira aussi son personnel afin que celui-ci utilise les équipements et machines avec un maximum de précaution, il prendra toutes les dispositions nécessaires et utilisera des équipements permettant d’éviter les bruits de chocs et d’à-coups violents (p. ex. lors du déchargement de matériaux dans une benne, lors de la vidange des grappins, etc.).',{r:1}],
 ['txt','L’entrepreneur informe la DT et l’utilisateur avant de commencer des travaux particulièrement bruyants.',{r:1}],
 ['ban','E 1 Annexe 1 : organisation pour l’exécution du marché'],
 ['gr','TEMPS NECESSAIRE POUR L’EXECUTION DU MARCHE'],
 ['fl','Durée totale des travaux, en semaines, compte tenu de l’équipe à disposition',{r:1}],
 ['fl','Durée des travaux, en semaines, en atelier (si activité en atelier)',{r:1}],
 ['fl','Durée des travaux, en semaines, sur le chantier',{r:1}],
 ['gr','DISPONIBILITE DES MOYENS ET DES RESSOURCES POUR L’EXECUTION DU MARCHE'],
 ['txt','Nombre de collaborateurs mis à disposition pour l’exécution du marché',{r:1}],
 ['fl','Secteur administratif',{r:1}],
 ['fl','Secteur atelier (si activité en atelier)',{r:1}],
 ['fl','Sur le chantier',{r:1}],
 ['ban','E 2 Annexe 2 : Situation générale, échelle 1/10’000'],
 ['annexe',''],
 ['ban','E 3 Annexe 3 : Situation, échelle 1/200'],
 ['annexe','']
];
/* éléments propres aux conditions : pièces remplies d'office, signature, saut de page, plan joint (lignes non éditables de la feuille) ; styles des conditions */
const OBJ=new Set(['auto','sig','saut','annexe']), MOD_T='sgcgmodele';
const TYPES_CG=[['ban','Section'],['sou','Rubrique'],['gr','Titre'],['txt','Texte'],['pu','Tiret'],['kv','Libellé : valeur']], TYPES_CG2=[['sec','À remplir / à signer'],['fl','Ligne à remplir'],['cad','Encadré']];
Object.assign(LIB,{ban:'Section',kv:'Libellé : valeur',fl:'Ligne à remplir',cad:'Encadré'}); Object.assign(SUITE,{ban:'txt',kv:'kv',fl:'fl',cad:'txt'});
Object.assign(PH,{ban:'Lettre et titre de la section (ex. C 2 Informations concernant le site du chantier)',kv:'Libellé : valeur',fl:'Ligne à remplir par l’entreprise',cad:'Texte encadré'});
/* modèle du bureau : collection sgcgmodele (ID « bureau »), sinon le modèle livré ci-dessus */
const modeleCG=()=>{ const r=DS.loaded.has(MOD_T)?DS.get(MOD_T,'bureau'):null, src=r&&Array.isArray(r.blocs)&&r.blocs.length?r.blocs:MODELE_CG.map(([t,x,o])=>Object.assign({t,x},o||{}));
  return src.map(b=>Object.assign(nouv(b.t,b.x,b.b),b.r?{r:1}:{})); };
/* plan vide de la première version (titres et tirets vides) : remplacé par le modèle */
const ANCIEN=new Set(['Généralités','Organisation du chantier','Délais','Prix et paiements','Assurances','Garanties']);
const ancienPlan=L=>Array.isArray(L)&&L.length>0&&L.every(b=>(b.t==='sou'&&ANCIEN.has(b.x))||(b.t==='pu'&&!String(b.x||'').trim()));
/* tant que rien n'est saisi, la feuille est un brouillon hors du contenu : consulter ou ouvrir le PDF n'écrit rien (ni plan type, ni date) ; attacher() l'y met à la première modification */
const BR={}, attacher=(X,cle)=>{ const k=X.id+'|'+cle; if(!X.S[cle]&&BR[k]){ X.S[cle]=BR[k]; delete BR[k]; } return X.S[cle]; };
function preparer(X,cle){ const S=X.S, k=X.id+'|'+cle, D=S[cle]||BR[k]||(BR[k]={}), p=X.p||{};
  if(!D.entete){ const a=adrAffaire(p); D.entete={g1:p.NUMBER||'',g2:[p.TITLE,dfr(today())].filter(Boolean).join(' – '),d1:a.rue,d2:a.loc||p.LOCATION||''}; }
  const cg=cle===CG; if(D.lettre==null) D.lettre=cg?'':'F'; if(D.titre==null) D.titre=cg?'Conditions générales':'Descriptif des prestations'; if(!Array.isArray(D.blocs)||!D.blocs.length||(cg&&ancienPlan(D.blocs))) D.blocs=cg?modeleCG():modele(X);
  return D; }
const peut=X=>!X.ro&&svCanEdit(X.doc);
const envoyerD=X=>{ clearTimeout(ETAT.t); ETAT.t=null; ETAT.t0=0; SGCP.noterDesc(X,ETAT.cle); return SGCP.enregistrer(X); };
/* 600 ms après la dernière frappe, au plus tard toutes les 5 s pendant une frappe continue ; onglet fermé entre-temps : copie de secours reprise à la réouverture */
const planifier=(X,cle)=>{ attacher(X,cle); if(ETAT.t&&ETAT.cle!==cle) envoyerD(X); SGCP.noterDesc(X,cle); ETAT.cle=cle; const n=Date.now(); if(!ETAT.t0) ETAT.t0=n; clearTimeout(ETAT.t); if(n-ETAT.t0>5000){ envoyerD(X); return; } ETAT.t=setTimeout(()=>envoyerD(X),600); };
/* copie de secours : frappes en attente (délai) ou non confirmées par le serveur (journal) ; avec la version du document pour la reprise */
const SEC=(X,cle)=>'sg3_desc_sec:'+X.id+':'+cle;
addEventListener('pagehide',()=>{ const X=SV_UI.ed&&SV_UI.ed.X; if(!X||X.ro) return; const cles=new Set([...(ETAT.t?[ETAT.cle]:[]),...SGCP.VOL.jour.filter(j=>j.desc&&SGCP.VOL.X===X).map(j=>j.cle)]);
  cles.forEach(cle=>{ if(X.S[cle]) try{ localStorage.setItem(SEC(X,cle),JSON.stringify({v:X._seq,t:Date.now(),d:X.S[cle]})); }catch(_){ } }); });
async function reprendreSecours(X){ if(!X||!peut(X)) return; for(const cle of ['descriptif',CG]){ let o=null; try{ o=JSON.parse(localStorage.getItem(SEC(X,cle))||'null'); }catch(_){ } if(!o) continue; if(!(typeof o==='object'&&'d' in o&&('v' in o||'t' in o))) o={d:o}; if(!o.d||typeof o.d!=='object'){ try{ localStorage.removeItem(SEC(X,cle)); }catch(_){ } continue; }
    const nom=cle===CG?'des conditions générales':'du descriptif', quand=o.t?' du '+new Date(o.t).toLocaleString('fr-CH'):'';
    const ok=o.v!=null&&o.v===X._seq?true:await confirmDlg('Des frappes'+quand+' '+nom+' n’ont pas été enregistrées (onglet fermé). Le document a été modifié depuis. Les reprendre ? Elles remplacent la version actuelle '+nom+'.','Reprendre');
    try{ localStorage.removeItem(SEC(X,cle)); }catch(_){ } if(!ok||!SV_UI.ed||SV_UI.ed.X!==X) continue; X.S[cle]=o.d; planifier(X,cle); toast('Dernières frappes '+nom+' reprises.'); if(X.node==='tenderConditions'||(cle==='descriptif'&&X.node==='tenderEdit')) X.redraw(); } }

/* ── curseur dans une ligne (texte seul) ── */
const bornes=el=>{ const s=getSelection(); if(!s.rangeCount||!el.contains(s.anchorNode)) return {a:0,z:0}; const r=s.getRangeAt(0), m=(c,o)=>{ const x=document.createRange(); x.selectNodeContents(el); try{ x.setEnd(c,o); }catch(_){ return el.textContent.length; } return x.toString().length; }; return {a:m(r.startContainer,r.startOffset),z:m(r.endContainer,r.endOffset)}; };
const curseur=el=>bornes(el).a;
const poserCurseur=(el,pos)=>{ el.focus(); const n=el.firstChild, s=getSelection(), r=document.createRange(); if(n&&n.nodeType===3){ r.setStart(n,Math.min(pos,n.length)); } else r.setStart(el,0); r.collapse(true); s.removeAllRanges(); s.addRange(r); };
const texteDe=el=>el.textContent.replace(/\s*\n\s*/g,' ');
const auBord=(el,haut)=>{ const s=getSelection(); if(!s.rangeCount) return true; const R=s.getRangeAt(0).getClientRects()[0], B=el.getBoundingClientRect(); if(!R) return true; const lh=parseFloat(getComputedStyle(el).lineHeight)||18; return haut?R.top-B.top<lh*.9:B.bottom-R.bottom<lh*.9; };

/* ── lignes collées ou importées ── */
const classerCG=l=>{ const t=String(l||'').trim(); return /^[^:\-–—•·*][^:]{1,58}\s:\s\S/.test(t)?nouv('kv',t):classer(t); };
function classer(l){ const t=l.trim(), m=/^[-–—•·*]\s*(.*)$/.exec(t); if(m) return nouv('pu',m[1]); if(t===t.toUpperCase()&&/[A-ZÉÈÀ]/.test(t)) return nouv('gr',t); if(t.length<70&&!/[.;:,]$/.test(t)) return nouv('sou',t); return nouv('txt',t); }
/* lecture d'un PDF : corps et interligne dominants mesurés sur le document, en-têtes et pieds repérés par répétition, colonnes, exposants, pages tournées */
function analyser(P){ const D={lettre:'',titre:'',blocs:[]}, lumiere=P.some(p=>p.it.some(i=>/Light/i.test(i.f))), hist=new Map(); P.forEach(p=>p.it.forEach(i=>{ const k=Math.round(i.sz*10)/10; hist.set(k,(hist.get(k)||0)+i.s.length); }));
  const corps=([...hist].sort((a,b)=>b[1]-a[1])[0]||[10])[0], maxS=l=>Math.max(...l.it.map(i=>i.sz));
  const texteL=l=>{ let t='', fin=null; l.it.slice().sort((a,b)=>a.x-b.x).forEach(i=>{ if(fin!=null&&i.x-fin>i.sz*.12&&!/\s$/.test(t)&&!/^\s/.test(i.s)) t+=' '; t+=i.s; fin=i.x+i.w; }); return t.replace(/\s+/g,' ').trim(); };
  const lignes=p=>{ const L=[]; p.it.slice().sort((a,b)=>b.y-a.y||a.x-b.x).forEach(i=>{ const l=L[L.length-1]; if(l&&Math.abs(l.y-i.y)<2) l.it.push(i); else L.push({y:i.y,it:[i],h:p.h}); });
    for(let k=0;k<L.length;k++){ const l=L[k], v=L[k+1], u=L[k-1]; if(maxS(l)>=corps*.8) continue; if(v&&l.y-v.y<corps*.7&&maxS(v)>=corps*.9){ v.it.push(...l.it); L.splice(k--,1); } else if(u&&u.y-l.y<corps*.6&&maxS(u)>=corps*.9){ u.it.push(...l.it); L.splice(k--,1); } } return L; };
  const P2=P.map(lignes), cle=l=>texteL(l).replace(/\d+/g,'#'), bord=l=>l.y>l.h*.88||l.y<l.h*.12, vus=new Map(); if(P.length>1) P2.forEach(L=>{ new Set(L.filter(bord).map(cle)).forEach(k=>vus.set(k,(vus.get(k)||0)+1)); });
  const garde=l=>P.length>1?!(bord(l)&&(vus.get(cle(l))||0)>1):!((l.y>l.h-60||l.y<62)&&maxS(l)<corps*.9);
  const colonnes=L=>{ const G=[]; L.forEach(l=>{ const I=l.it.slice().sort((a,b)=>a.x-b.x); let g=0,at=0; for(let j=1;j<I.length;j++){ const e=I[j].x-(I[j-1].x+I[j-1].w); if(e>g){ g=e; at=I[j-1].x+I[j-1].w+e/2; } } if(g>28) G.push(at); }); if(L.length<4||G.length<L.length*.5) return [L]; G.sort((a,b)=>a-b); const m=G[G.length>>1]; if(G.filter(x=>Math.abs(x-m)<20).length<G.length*.7) return [L];
    const A=[],B=[]; L.forEach(l=>{ const a=l.it.filter(i=>i.x<m), b=l.it.filter(i=>i.x>=m); if(a.length) A.push({...l,it:a}); if(b.length) B.push({...l,it:b}); }); return [A,B]; };
  const Z=P2.map(L=>colonnes(L.filter(garde))), ec=new Map(); let maxFin=0; Z.forEach(C=>C.forEach(L=>L.forEach((l,k)=>{ maxFin=Math.max(maxFin,...l.it.map(i=>i.x+i.w)); if(k){ const g=L[k-1].y-l.y; if(g<corps*2.2){ const r=Math.round(g*2)/2; ec.set(r,(ec.get(r)||0)+1); } } })));
  const ld=([...ec].sort((a,b)=>b[1]-a[1])[0]||[corps*1.3])[0]; let prev=null, finPrev=0;
  Z.forEach((C,ip)=>C.forEach(L=>{ let yPrev=null; L.forEach(l=>{ const t=texteL(l); if(!t) return; const dash=/^[-–—•·]\s*/.test(t), I=l.it.slice().sort((a,b)=>a.x-b.x), corpsL=I.filter(i=>i.s.trim().length>1), sz=Math.max(...(corpsL.length?corpsL:I).map(i=>i.sz)), gras=!!corpsL.length&&corpsL.every(i=>/Bold|Medium/i.test(i.f)||(lumiere&&/Regular/i.test(i.f))), ecart=yPrev==null?null:yPrev-l.y, fin=Math.max(...I.map(i=>i.x+i.w)), txt=t.replace(/^[-–—•·]\s*/,''), grand=sz>=corps*1.18, petit=sz<corps*.9; yPrev=l.y;
      if(grand&&ip===0&&!D.titre&&!D.blocs.length){ const m=/^(\S)\s+(.+)$/.exec(t); D.lettre=m?m[1]:''; D.titre=m?m[2]:t; prev=null; return; }
      const plein=finPrev>=maxFin*.72, suite=!dash&&!grand&&prev&&(prev.t==='pu'||prev.t==='txt'||prev.t==='pj')&&plein&&!(gras&&!prev.b)&&(ecart==null?!/[.;:]$/.test(prev.x):ecart<=ld*1.3); if(suite){ prev.x+=' '+t; finPrev=fin; return; }
      const b=petit?(dash?nouv('pj',txt):gras?nouv('sec',t):nouv('pjt',t)):dash?nouv('pu',txt,gras):grand?(t===t.toUpperCase()?nouv('gr',t):nouv('sou',t)):classer(t); if(b.t==='txt') b.b=!!gras; D.blocs.push(b); prev=b; finPrev=fin; }); }));
  return D; }
async function lirePdf(file){ const w=await fxEnsure(); await w.offreLoadPdfJs(); const pdf=await w.pdfjsLib.getDocument({data:new w.Uint8Array(await file.arrayBuffer()),ownerDocument:document}).promise, P=[];
  try{ for(let n=1;n<=pdf.numPages;n++){ const pg=await pdf.getPage(n), vp=pg.getViewport({scale:1}), c=await pg.getTextContent(); await pg.getOperatorList(); const nomDe=i=>{ try{ return (pg.commonObjs.get(i.fontName)||{}).name||''; }catch(_){ return ''; } };
      P.push({h:vp.height,it:c.items.filter(i=>i.str&&i.str.trim()).map(i=>{ const T=w.pdfjsLib.Util.transform(vp.transform,i.transform); return {s:i.str,x:T[4],y:vp.height-T[5],sz:Math.hypot(i.transform[0],i.transform[1])||9,w:i.width,f:nomDe(i)}; })}); } }
  finally{ await pdf.destroy(); }
  return analyser(P); }

/* ── PDF : papier des contrats, en-tête à quatre champs ── */
const SIGNES={'≥':'min.','≤':'max.','≠':'différent de','≈':'env.','∅':'diam.','Δ':'delta','Ω':'ohm','∞':'infini','√':'racine de','→':'-','←':'-','↑':'-','↓':'-','✓':'x','✗':'non','✔':'x','✘':'non','⌀':'Ø','\u2010':'-','\u2011':'-','′':"'",'″':'"'}, RX_SI=new RegExp('['+Object.keys(SIGNES).join('')+']','g');
const signes=c=>{ const vus=new Set(), f=x=>String(x==null?'':x).replace(RX_SI,m=>{ vus.add(m); return SIGNES[m]; }); c.blocs=(c.blocs||[]).map(b=>b.v!=null?{...b,x:f(b.x),v:f(b.v)}:{...b,x:f(b.x)}); if(vus.size) toast('Signes absents de la police, remplacés dans le PDF : '+[...vus].map(m=>m+' → '+SIGNES[m]).join(', '),true); };
async function pdfDoc(c){ signes(c); const {w,R,fn}=await SGDS.ressources(), j=new w.Array(); const o=w.JSON.parse(JSON.stringify({titre:c.titre,date:today(),type:c.type||'',description:c.description||'',enteteLibre:c.entete,descriptif:{lettre:c.lettre,titre:c.bande,blocs:c.blocs,signatures:c.signatures||[]}})); o.journal=j;
  const oct=await fn(R,null,o); signaler(j,c.type||'Document'); return new Blob([oct],{type:'application/pdf'}); }
/* journal du PDF : caractères invisibles et plans illisibles signalés à l'écran (pas seulement dans la console) */
const signaler=(j,nom)=>{ const L=Array.from(j||[]).map(String); if(!L.length) return; console.info(nom||'PDF',':',L); const gl=[...new Set(L.filter(x=>/absent des quatre polices/.test(x)).map(x=>(/Glyphe « (.+?) » \(U\+/.exec(x)||[])[1]).filter(Boolean))];
  if(gl.length) toast('Caractères absents des polices, invisibles dans le PDF : '+gl.join(' '),true); if(L.some(x=>/Plan joint illisible/.test(x))) toast('Un plan joint n’a pas pu être intégré au PDF.',true); };
async function pdfDe(X,cle){ const D=preparer(X,cle), d=X.doc||{}, cg=cle===CG; return pdfDoc({titre:[cg?'Conditions générales':'',d.BKP,d.AWARDINGTEXT].filter(Boolean).join(' ')||'Descriptif',type:cg?'Conditions générales':'Descriptif',description:cg?'Conditions générales':'Descriptif des prestations',entete:D.entete,lettre:D.lettre,bande:D.titre,blocs:D.blocs.map(b=>({t:b.t,x:b.x,b:!!b.b})),signatures:cg?[{t:'Lu et approuvé, l’entreprise',n:''}]:[]}); }
/* ── cahier de soumission (bloc 44, 07.11.2026) : conditions (modèle du bureau, pièces remplies d'office) puis cahier des charges, en un seul PDF ── */
const un=L=>L.map(x=>String(x==null?'':x).trim()).filter(Boolean).join(', ');
const fxD=()=>{ try{ return typeof fxData==='function'?fxData():null; }catch(_){ return null; } };
const adresses=X=>{ try{ return sgAdressesAffaire(X.p||{},fxD()); }catch(_){ return {affaire:{lignes:[]},mo:{lignes:[],nom:''},fact:{lignes:[]},depot:{lignes:[]}}; } };
const dateLongue=v=>{ const d=v?new Date(String(v).slice(0,10)+'T12:00:00'):null; return d&&!isNaN(d)?d.toLocaleDateString('fr-CH',{day:'numeric',month:'long',year:'numeric'}):''; };
const nomC=c=>c?(sgNomAdresse(c)||contactName(c)):'';
/* personne : « Prénom Nom » de son entité (contactowner), sinon le nom de l'adresse */
const nomP=c=>{ if(!c) return ''; let o=null; try{ o=typeof ownerOf==='function'?ownerOf(c):null; }catch(_){ } const n=o?[o.NAME2,o.NAME1].map(x=>String(x||'').trim()).filter(Boolean).join(' '):''; return n||nomC(c); };
const membres=p=>p&&p.ID!=null?DS.by('projectmember','PROJECT_ID',p.ID).filter(x=>!x.ISHIDDEN).sort((a,b)=>cmp(a.SORTORDER,b.SORTORDER)):[];
/* adresse d'affaire : celle du contrat (Facturation), sinon l'adresse choisie dans l'affaire (CONTACT1_ID) — comme la page de garde */
const npa=l=>/^\s*(?:[A-Z]{1,3}-)?\d{4,5}\s/.test(String(l||''));
function adrAffaire(p,A){ if(!A){ try{ A=sgAdressesAffaire(p||{},fxD()); }catch(_){ A=null; } } const af=(A&&A.affaire)||{lignes:[]}, c1=p&&p.CONTACT1_ID!=null?DS.get('contact',p.CONTACT1_ID):null; let rue='', loc='';
  if(af.src==='contrat') (af.lignes||[]).forEach(l=>{ if(npa(l)) loc=String(l).trim(); else if(!rue) rue=String(l).trim(); });
  else if(c1){ rue=String(c1.STREET||'').trim(); loc=String(locality(c1)||'').trim(); }
  return {rue,loc}; }
/* responsables de l'affaire : rôle 6, sinon collaborateurs (rôle 12) ; personnes qui ont quitté le bureau écartées (staff.QUITTINGDATE passée) */
const parti=id=>{ const st=id!=null&&DS.loaded.has('staff')?DS.by('staff','PERSON_ID',id)[0]:null; return !!(st&&st.QUITTINGDATE&&String(st.QUITTINGDATE).slice(0,10)<today()); };
const responsables=p=>{ for(const r of [6,12]){ const L=membres(p).filter(x=>+x.TEAMROLECODE===r).map(x=>x.RESPCONTACT_ID!=null?x.RESPCONTACT_ID:x.CONTACT_ID).filter(id=>id!=null&&!parti(id)).map(id=>DS.get('contact',id)).filter(Boolean); if(L.length) return L; } return []; };
const contactBureau=()=>DS.all('contact').filter(x=>/^substances architectes/i.test(contactName(x))).sort((a,b)=>(!b.STREET)-(!a.STREET))[0]||null;
function calcGarde(X){ const S=X.S, p=X.p||{}, d=X.doc||{}, ao=S.appelOffres||{}, A=adresses(X), b=sgBureauAdresse(), bur=un([b.nom,...b.lignes]);
  const m2=svMember(p,2), c2=m2&&DS.get('contact',m2.CONTACT_ID), bc=contactBureau(), dt=c2&&(!bc||c2.ID!==bc.ID)?un(adrLines(c2)):bur;
  const resp=responsables(p);
  const ld=ao.lieuDepot, lc=ld&&(DS.get('contact',ld.contactId)||DS.get('contact',ld.personId)||DS.get('contact',ld.CONTACT_ID));
  return {ouvrage:un([p.TITLE,...A.affaire.lignes]),mo:un(A.mo.lignes),archi:bur,dt,cfc:String(d.BKP||'').trim(),titre:String(d.AWARDINGTEXT||'').toUpperCase(),
    debut:String(ao.debutTravaux||'').trim(),retour:dateLongue(ao.dateDepot),adresse:lc?un(adrLines(lc)):bur,collab:[...new Set(resp.map(nomP).filter(Boolean))].slice(0,2).join(' / ')}; }
function calcResume(X){ const S=X.S, d=X.doc||{}, U=(S.unites||{}).B, C=((U&&U.conditions)||[]).filter(c=>c.m!==false&&!SVD_FORF.has(+c.genre));
  const lib=c=>String(c.texte||(SVD_KIND[c.genre]&&SVD_KIND[c.genre][1])||'').replace(/\s*\(%\)\s*$/,'').trim()||'Condition', pc=v=>v?String(Math.round(Math.abs(v)*100)/100)+' %':'', taux=c=>pc(+c.valeur||0);
  const tvaD=pc(typeof svdVatDefault==='function'?svdVatDefault():8.1);
  let L=C.map(c=>+c.genre===2?{lib:'Taxe à la valeur ajoutée',taux:taux(c),tva:1}:{lib:lib(c),taux:taux(c),tva:0,signe:(+c.valeur||0)>0?'+':''});   /* valeur positive = supplément (+), sinon déduction (./.) */
  if(!L.length) L=[{lib:'Rabais'},{lib:'Escompte'},{lib:'Prorata'}];
  if(!L.some(x=>x.tva)) L.push({lib:'Taxe à la valeur ajoutée',taux:tvaD,tva:1});
  return {cfc:String(d.BKP||'').trim(),titre:String(d.AWARDINGTEXT||'').toUpperCase(),lignes:[...L.filter(x=>!x.tva),...L.filter(x=>x.tva)]}; }
/* mandataires : ingénieurs, spécialistes, experts, planificateurs, économiste, garant, paysagiste, BIM / ICT (pas les autorités, locataires, voisins, assurances, clients…) */
const ROLES_MANDAT=new Set([3,10,11,21,26,32,33,35,36,37,38,39]);
function calcOrga(X){ const p=X.p||{}, A=adresses(X), b=sgBureauAdresse(), bc=contactBureau(), tel=c=>c&&(c.PHONEAREA1||c.PHONENUMBER1)?'Tél. n° '+[c.PHONEAREA1,c.PHONENUMBER1].filter(Boolean).join(' / '):'', mail=c=>c&&c.EMAIL1?String(c.EMAIL1):'';
  const M=membres(p), pers=x=>x.RESPCONTACT_ID&&x.RESPCONTACT_ID!==x.CONTACT_ID?nomP(DS.get('contact',x.RESPCONTACT_ID)):'', resp=[...new Set(responsables(p).map(nomP).filter(Boolean))];
  const R=[{lib:'Projet :',sou:1,val:[[p.NUMBER,p.TITLE].filter(Boolean).join(' – '),A.affaire.lignes.join(' – ')].filter(Boolean)},
    {lib:'L’adjudicateur :',sou:1,val:(A.fact.lignes.length?A.fact.lignes:A.mo.lignes).slice()},{lib:'Les mandataires :',sou:1,titre:1,val:[]},
    {lib:'Architectes',val:[b.nom,...b.lignes,...resp.slice(0,2).map(n=>'Resp. '+n)],val2:[tel(bc),mail(bc)].filter(Boolean)}];
  const m2=svMember(p,2), c2=m2&&DS.get('contact',m2.CONTACT_ID); if(c2&&(!bc||c2.ID!==bc.ID)) R.push({lib:'Direction des travaux',val:[...adrLines(c2),...(pers(m2)?['Resp. '+pers(m2)]:[])],val2:[tel(c2),mail(c2)].filter(Boolean)});
  M.filter(x=>ROLES_MANDAT.has(+x.TEAMROLECODE)).forEach(x=>{ const c=DS.get('contact',x.CONTACT_ID); if(!c) return; R.push({lib:((ROLES.find(r=>r[0]===+x.TEAMROLECODE)||[])[1])||'Mandataire',val:[...adrLines(c),...(pers(x)?['Resp. '+pers(x)]:[])],val2:[tel(c),mail(c)].filter(Boolean)}); });
  return {lignes:R}; }
function jetons(X){ const g=calcGarde(X), p=X.p||{}, A=adresses(X), b=sgBureauAdresse(); let fz=null; try{ fz=DS.loaded.has('sgfaisa')?DS.get('sgfaisa',p.ID):null; }catch(_){ } const P=(fz&&fz.PARCELLE)||{};
  const ad=adrAffaire(p,A), loc=ad.loc, com=String(P.COMMUNE||'').trim(), rueP=String(P.ADRESSE||'').replace(/,?\s*(?:[A-Z]{1,3}-)?\d{4}\s+\S.*$/,'').trim();   /* adresse d'affaire : rue et localité ; commune politique entre parenthèses si elle diffère */
  return {ouvrage:g.ouvrage,mo:g.mo,dt:g.dt,bureau:b.nom,cfc:g.cfc,lot:String((X.doc||{}).AWARDINGTEXT||''),projet:[p.NUMBER,p.TITLE].filter(Boolean).join(' – '),commune:loc?(com&&!loc.includes(com)?loc+' ('+com+')':loc):(com||String(p.LOCATION||'').trim()),rue:ad.rue||rueP,parcelle:String(P.NUMERO||'').trim()}; }
const remplir=(t,J)=>String(t==null?'':t).replace(/\{([a-z]+)\}/g,(m,k)=>k in J?J[k]:m);
/* blocs à imprimer : jetons remplacés, lignes vides, titres sans texte et sections sans contenu retirés (une annexe sans fichier n'imprime pas sa section) */
function blocsPdf(D,J,ann){ const TX=['txt','pu','kv','fl','cad','pj','pjt'], L=(D.blocs||[]).map(b=>({t:b.t,x:remplir(b.x,J),b:b.b?1:0,r:b.r?1:0,sha:(b.f&&b.f.sha)||''}));
  const imp=b=>b.t==='auto'||b.t==='sig'||(b.t==='annexe'&&!!ann[b.sha])||(TX.includes(b.t)&&!!String(b.x||'').trim());
  const out=[]; let sec=null; const vider=()=>{ if(sec&&sec.blocs.some(imp)) out.push(sec.ban,...sec.blocs); sec=null; };
  L.forEach(b=>{ if(b.t==='ban'){ vider(); sec={ban:b,blocs:[]}; } else if(sec) sec.blocs.push(b); else out.push(b); }); vider();
  return out.filter((b,i)=>{ if(TX.includes(b.t)) return !!String(b.x||'').trim(); if(b.t==='annexe') return !!ann[b.sha];
    if(b.t==='gr'||b.t==='sou'){ const fin=b.t==='gr'?['ban','gr','saut']:['ban','gr','sou','sec','saut']; for(let j=i+1;j<out.length;j++){ const c=out[j]; if(fin.includes(c.t)) break; if(imp(c)) return true; } return false; } return true; }); }
/* page de garde : textes proposés, ou ceux saisis dans « Modifier… » */
function gardeDlg(X,b,apres,o){ o=o||{}; const g=calcGarde(X), v=b.v||{}, ch=k=>h('input',{class:'inp',value:v[k]||'',placeholder:g[k]||'',style:{width:'100%'}}), C=o.projet?{adresse:ch('adresse'),collab:ch('collab')}:{titre:ch('titre'),debut:ch('debut'),retour:ch('retour'),adresse:ch('adresse'),collab:ch('collab')};
  const LIB={titre:'Titre du lot',debut:'Début des travaux',retour:'Retour de soumission',adresse:'Adresse de retour',collab:'Collaborateur'};
  dialog({title:'Page de garde',width:'680px',body:h('div',{},h('p',{style:{margin:'0 0 10px',fontSize:'12.5px',color:'var(--s-gris)'}},o.projet?'Pour toutes les soumissions du projet. Le titre du lot, le début des travaux et la date de retour sont propres à chaque soumission (Appel d’offres ▸ Conditions générales ▸ Modifier pour ce CFC). Champ vide : le texte proposé (en gris).':'Champ vide : le texte proposé (en gris), tiré de l’affaire et de l’appel d’offres (Paramètres ▸ Informations d’appel d’offres).'),
    formRows(Object.keys(C).map(k=>[LIB[k],C[k]]),640)),
    buttons:[{t:'Annuler'},{t:'OK',pri:true,fn:()=>{ const n={}; Object.keys(C).forEach(k=>{ const x=C[k].value.trim(); if(x) n[k]=x; }); if(JSON.stringify(n)===JSON.stringify(b.v||{})) return; if(o.avant) o.avant(); b.v=n; apres(); }}]}); }
/* plan joint : PDF (première page) ou image, rangé dans le dépôt de fichiers de l'app (sgFichierRanger) */
function choisirAnnexe(b,apres,avant){ const i=h('input',{type:'file',accept:'application/pdf,.pdf,image/png,image/jpeg,.png,.jpg,.jpeg',style:{display:'none'}}); document.body.append(i);
  i.onchange=async()=>{ const f=i.files[0]; i.remove(); if(!f) return; try{ const r=await sgFichierRanger(f,f.name); if(avant) avant(); b.f={sha:r.sha,nom:f.name,type:f.type||sgMime(f.name)}; apres(); toast('Plan joint : '+f.name+'.'); }catch(e){ toast('Fichier non enregistré : '+(e&&e.message||e),true); } };
  i.click(); }
const retirerPlan=(b,fn)=>confirmDlg('Retirer le plan joint « '+((b.f&&b.f.nom)||'')+' » ? La section n’est plus imprimée tant qu’aucun plan n’est choisi.','Retirer').then(ok=>{ if(ok) fn(); });
async function reprendreModele(X){ if(!peut(X)) return; await DS.need([MOD_T]).catch(()=>{}); if(!await confirmDlg('Remplacer les conditions de cette soumission par le modèle du bureau ?','Remplacer')) return; const D=preparer(X,CG); D.blocs=modeleCG(); planifier(X,CG); X.redraw(); }
async function enregistrerModele(X){ if(!peut(X)) return; const D=X.S[CG]||preparer(X,CG); if(!await confirmDlg('Enregistrer ces conditions comme modèle du bureau ? Toute nouvelle soumission partira de ce modèle ; les soumissions existantes ne changent pas. Les plans joints et la page de garde modifiée ne sont pas repris.','Enregistrer')) return;
  try{ await DS.commit([{t:MOD_T,id:'bureau',val:{ID:'bureau',blocs:D.blocs.map(b=>Object.assign({t:b.t,x:String(b.x||'')},b.b?{b:1}:{},b.r?{r:1}:{})),MODIFIE:new Date().toISOString().slice(0,16).replace('T',' '),PAR:(typeof ME!=='undefined'&&ME&&ME.id)||''}}]); if(typeof oublierModele==='function') oublierModele(); toast('Modèle du bureau enregistré.'); }
  catch(e){ toast('Modèle non enregistré : '+(e&&e.message||e),true); } }
/* cahier des charges par articles : l'impression du moteur (Documents ▸ Descriptif), mise au papier des contrats par le bloc 31, récupérée sans l'afficher */
const fermerOv=ov=>{ const b=[...ov.querySelectorAll('button')].find(x=>/^\s*Fermer\s*$/.test(x.textContent)); if(b) b.click(); else ov.remove(); };
async function pdfArticles(X,plus){ const U=(X.S.unites||{}).B; if(!U||!(U.chapitres||[]).length) return null; const r=svdControls(svdNormUnit(JSON.parse(JSON.stringify(U)),'B')); if(r){ toast('Cahier des charges : '+r.msg,true); return null; }
  let ov=null; const mo=new MutationObserver(M=>{ if(ov) return; for(const m of M) for(const n of m.addedNodes) if(!ov&&n.nodeType===1&&n.classList&&n.classList.contains('ov')){ ov=n; n.classList.add('sgdp-cap'); } });
  mo.observe(document.documentElement,{childList:true,subtree:true}); const Fi=U.filtre, filtre=!!(Fi&&Fi.actif);
  window.SGIMP_PLUS=plus||null;   /* lu par le bloc 31 au moment de faire le PDF : en-tête du cahier, logo gris, numérotation à la suite des conditions */
  try{ if(filtre) Fi.actif=false; try{ svdPrint(svcCx(X,'B'),'desc'); }finally{ if(filtre) Fi.actif=true; }   /* le cahier envoyé aux entreprises contient tous les articles : le filtre de l'écran est ignoré le temps de l'impression */
    if(filtre) toast('Filtre de la soumission ignoré : le cahier des charges contient tous les articles.');
    for(let i=0;i<120;i++){ await new Promise(z=>setTimeout(z,250)); const f=ov&&ov.querySelector('iframe'); if(f&&f._sgimp&&String(f.src||'').startsWith('blob:')){ const by=await (await fetch(f.src)).arrayBuffer(); return new TextDecoder('latin1').decode(by.slice(0,5))==='%PDF-'?by:null; } }
    return null; }
  finally{ window.SGIMP_PLUS=null; mo.disconnect(); if(ov&&ov.isConnected) fermerOv(ov); } }
const nbPages=async(w,by)=>(await w.PDFLib.PDFDocument.load(new w.Uint8Array(by instanceof ArrayBuffer?by.slice(0):by.slice()))).getPageCount();
/* plans joints : PDF lisible tel quel, sinon (chiffré, abîmé) sa première page rendue en image par pdf.js ; PNG et JPEG tels quels, autre image convertie en PNG ; rien si illisible */
const sorte=by=>{ const t=new TextDecoder('latin1').decode(by.slice(0,1024)), u=new Uint8Array(by.slice(0,4)); return t.includes('%PDF-')?'application/pdf':u[0]===0x89&&u[1]===0x50&&u[2]===0x4E&&u[3]===0x47?'image/png':u[0]===0xFF&&u[1]===0xD8?'image/jpeg':''; };
const enPng=c=>new Promise((ok,ko)=>c.toBlob(b=>b?b.arrayBuffer().then(ok,ko):ko(new Error('image')),'image/png'));
async function pdfEnImage(w,by){ await w.offreLoadPdfJs(); const pdf=await w.pdfjsLib.getDocument({data:new w.Uint8Array(by.slice(0)),ownerDocument:document}).promise;
  try{ const pg=await pdf.getPage(1), v1=pg.getViewport({scale:1}), vp=pg.getViewport({scale:Math.min(3,2400/Math.max(v1.width,v1.height))}), c=document.createElement('canvas'); c.width=Math.ceil(vp.width); c.height=Math.ceil(vp.height);
    const g=c.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,c.width,c.height); await pg.render({canvasContext:g,viewport:vp,intent:'print'}).promise; return await enPng(c); }
  finally{ await pdf.destroy(); } }
async function annexePrete(w,by){ const ty=sorte(by);
  if(ty==='application/pdf'){ try{ await w.PDFLib.PDFDocument.load(new w.Uint8Array(by.slice(0))); return {by,ty}; }catch(_){ const png=await pdfEnImage(w,by).catch(()=>null); return png?{by:png,ty:'image/png'}:null; } }
  if(ty) return {by,ty};
  try{ const im=await createImageBitmap(new Blob([by])), c=document.createElement('canvas'); c.width=im.width; c.height=im.height; c.getContext('2d').drawImage(im,0,0); return {by:await enPng(c),ty:'image/png'}; }catch(_){ return null; } }
async function fusionner(w,L,titre){ const P=w.PDFLib, doc=await P.PDFDocument.create(); for(const by of L){ const src=await P.PDFDocument.load(new w.Uint8Array(by)); (await doc.copyPages(src,src.getPageIndices())).forEach(x=>doc.addPage(x)); } doc.setTitle(titre); doc.setAuthor('Substances Architectes'); doc.setProducer('SUBGestion'); return await doc.save(); }
let CAHIER=null;
function ouvrirCahier(X,opt){ if(CAHIER){ toast('Le PDF est en cours de création…'); return CAHIER; } CAHIER=creerCahier(X,opt||{}).finally(()=>{ CAHIER=null; }); return CAHIER; }
async function creerCahier(X,opt){ try{ if(ETAT.t) envoyerD(X); toast('Création du PDF…'); await DS.need([MOD_T,CGP_T,'sgfaisa','projectmember','contact','staff']).catch(()=>{});
    const {w,R,fn}=await SGDS.ressources();   /* cadre Facturation chargé d'abord : adresses et maître de l'ouvrage repris des contrats, comme l'organisation */
    const S=X.S, des=!opt.base&&estD(S), Dc=opt.base?{blocs:opt.base.blocs,entete:opt.base.entete}:cgSoumission(X), J=jetons(X), d=X.doc||{}, p=X.p||{}, fich={}, ann={};
    for(const b of (Dc.blocs||[])) if(b.t==='annexe'&&b.f&&b.f.sha&&!fich[b.f.sha]){ const bl=await sgFichierLire(b.f.sha); if(!bl){ toast('Plan joint introuvable : '+(b.f.nom||''),true); continue; }
      const a=await annexePrete(w,await bl.arrayBuffer()); if(a){ fich[b.f.sha]=a.by; ann[b.f.sha]={type:a.ty}; } else toast('Plan joint illisible, non imprimé : '+(b.f.nom||''),true); }
    /* page de garde : titre du lot, début des travaux et date de retour seulement s'ils ont été saisis pour ce CFC (la ligne du projet n'en porte pas) */
    const g=calcGarde(X), gb=(Dc.blocs||[]).find(b=>b.t==='auto'&&b.x==='garde')||{}, v0=gb.v||{}, gv=gb.loc?v0:{adresse:v0.adresse,collab:v0.collab}, lot=gv.titre||String(d.AWARDINGTEXT||'');
    if(gv.titre) J.lot=gv.titre;
    const garde={rub:[['OUVRAGE',g.ouvrage],['MAÎTRE DE L’OUVRAGE',g.mo],['ARCHITECTE',g.archi],['DIRECTION DES TRAVAUX',g.dt]],cfc:g.cfc,titre:gv.titre||g.titre,infos:[['Début des travaux :',gv.debut||g.debut],['Retour de soumission :',gv.retour||g.retour],['Adresse de retour :',gv.adresse||g.adresse],['Collaborateur',gv.collab||g.collab]]};
    const cb={blocs:blocsPdf(Dc,J,ann)}; signes(cb);
    const Dd=des?preparer(X,'descriptif'):null, dd=Dd?{blocs:(Dd.blocs||[]).map(b=>({t:b.t,x:b.x,b:!!b.b}))}:null; if(dd) signes(dd);
    const titre=(opt.seul?'Conditions générales ':'Cahier de soumission ')+[d.BKP,lot].filter(Boolean).join(' '), j=new w.Array(), res=calcResume(X); if(gv.titre) res.titre=String(gv.titre);
    const base={titre,date:today(),type:opt.seul?'Conditions générales':'Cahier de soumission',description:titre,enteteLibre:(Dd||Dc).entete,cahier:{blocs:cb.blocs,auto:{garde,resume:res,orga:calcOrga(X)},annexes:ann}};
    if(!opt.seul&&dd) base.descriptif={lettre:Dd.lettre,titre:Dd.titre,blocs:dd.blocs,signatures:[]};
    const o=w.JSON.parse(JSON.stringify(base)); o.journal=j; if(Object.keys(fich).length){ o.cahierFichiers={}; Object.keys(fich).forEach(k=>{ o.cahierFichiers[k]=new w.Uint8Array(fich[k]); }); }
    let oct=await fn(R,null,o); signaler(j,'Cahier de soumission');
    /* par articles : l'impression « Descriptif » du moteur à la suite, même en-tête, logo gris, pages numérotées à la suite ; les conditions sont refaites avec le total */
    if(!opt.seul&&!des){ const N=await nbPages(w,oct), art=await pdfArticles(X,{enteteLibre:base.enteteLibre,logoGris:true,numDebut:N,numTotalPlus:N});
      if(art){ const o2=w.JSON.parse(JSON.stringify(base)); o2.journal=new w.Array(); o2.numTotal=N+await nbPages(w,art); if(o.cahierFichiers){ o2.cahierFichiers={}; Object.keys(fich).forEach(k=>{ o2.cahierFichiers[k]=new w.Uint8Array(fich[k]); }); } oct=await fusionner(w,[await fn(R,null,o2),art],titre); }
      else toast('Cahier des charges par articles non ajouté : seules les conditions sont dans ce PDF.',true); }
    sgVisionneuse(new Blob([oct],{type:'application/pdf'}),titre+' '+(p.NUMBER||'')+'.pdf'); }
  catch(e){ console.error(e); toast('Le PDF n’a pas pu être créé : '+(e&&e.message||e),true); } }
async function ouvrirPdf(X,cle){ cle=cle||'descriptif'; if(cle===CG) return ouvrirCahier(X,{seul:true}); try{ const D0=preparer(X,cle); if(!(D0.blocs||[]).some(b=>['pu','txt','pj','kv'].includes(b.t)&&String(b.x||'').trim())) toast((cle===CG?'Les conditions générales n’ont':'Le descriptif n’a')+' pas encore de texte : seuls les titres apparaissent.',true); const b=await pdfDe(X,cle), d=X.doc||{}, nom=(cle===CG?'Conditions générales ':'Descriptif ')+[(X.p||{}).NUMBER,d.BKP,d.AWARDINGTEXT].filter(Boolean).join(' ')+'.pdf'; sgVisionneuse(b,nom); }catch(e){ console.error(e); toast('Le PDF n’a pas pu être créé : '+(e&&e.message||e),true); } }

/* ── éditeur ── */
function ligneHtml(b,ce){ if(OBJ.has(b.t)) return '<div class="sgdp-l sgdp-obj" data-id="'+E(b.id)+'" data-t="'+E(b.t)+'" tabindex="0" contenteditable="false">'+objHtml(b,ce)+'</div>';
  return '<div class="sgdp-l'+(b.x?'':' vide')+'" data-id="'+E(b.id)+'" data-t="'+E(b.t)+'"'+(b.b?' data-b="1"':'')+(b.r?' data-r="1"':'')+(b.loc?' data-loc="1"':'')+' data-ph="'+E(PH[b.t]||'')+'"'+(ce?' contenteditable="plaintext-only" spellcheck="true"':'')+'>'+E(b.x)+'</div>'; }
const OBJ_L={garde:['Page de garde','Remplie d’office : ouvrage, maître de l’ouvrage, architecte, direction des travaux, CFC et titre du lot, montants à remplir par l’entreprise, début des travaux, retour de soumission, adresse de retour, collaborateur.'],
  entreprise:['Coordonnées de l’entreprise','Lignes à remplir : nom, rue, NPA et lieu, téléphone, fax, responsable, lieu et date, timbre et signature.'],
  resume:['Résumé de l’offre','Rempli d’office avec les conditions de l’appel d’offres (rabais, escompte, prorata, TVA) ; colonnes « déposée » et « contrôlée » à remplir.'],
  orga:['Organisation du projet','Remplie d’office : projet, adjudicateur, mandataires (intervenants de l’affaire).']};
function objHtml(b,ce){ const bt=(a,t)=>ce?'<button type="button" data-act="'+a+'">'+t+'</button>':'';
  if(b.t==='auto'){ const l=OBJ_L[b.x]||[b.x,'']; return '<b>'+E(l[0])+'</b><span>'+E(l[1])+'</span>'+(b.x==='garde'?bt('garde','Modifier…'):''); }
  if(b.t==='sig') return '<b>Signature</b><span>Date · '+E(b.x||'Le soumissionnaire (timbre et signature)')+'</span>';
  if(b.t==='saut') return '<b>Saut de page</b>';
  if(b.t==='annexe') return '<b>Plan joint</b><span>'+(b.f?E(b.f.nom||'fichier'):'Aucun fichier : la section n’est pas imprimée.')+'</span>'+bt('annexe',b.f?'Remplacer…':'Choisir un fichier…')+(b.f?bt('annexe-x','Retirer'):'');
  return ''; }
/* feuille de lignes, commune aux descriptifs et aux contrats d'entreprise : C = {blocs:()=>tableau, modifie:()=>…, ce:écriture, bar:()=>barre ou null} */
let PRESSE=null;   /* dernière plage copiée ou coupée dans une feuille (Maj + clic) : recollée telle quelle */
function feuille(hote,C){ const TY=C.types||TYPES, suiteDe=C.suite||(b=>({t:SUITE[b.t]||'pu',r:b.r})), cls=C.classer||classer, B=C.blocs, ec=C.ce, cour=()=>B().find(b=>b.id===ETAT.cour)||null, ligne=id=>hote.querySelector('.sgdp-l[data-id="'+id+'"]');
  const barre=()=>{ const bar=C.bar&&C.bar(); if(!bar) return; const b=cour(); bar.querySelectorAll('[data-sty]').forEach(x=>x.classList.toggle('on',!!b&&x.dataset.sty===b.t)); const g=bar.querySelector('[data-gras]'); if(g) g.classList.toggle('on',!!(b&&b.b)); const rt=bar.querySelector('[data-retrait]'); if(rt) rt.classList.toggle('on',!!(b&&b.r)); };
  let plage=null, ancre=null, frappe=false; const P=[], pile=()=>{ P.push(JSON.stringify(B())); if(P.length>50) P.shift(); frappe=false; };   /* annulation (⌘Z) des opérations sur les lignes ; la frappe dans une ligne garde l'annulation du navigateur */
  const dessiner=()=>{ hote.innerHTML=B().map(b=>ligneHtml(b,ec)).join(''); plage=null; };
  const changer=()=>{ C.modifie(); barre(); };
  const marquer=()=>{ hote.querySelectorAll('.sgdp-l').forEach((l,i)=>l.classList.toggle('sel',!!plage&&i>=plage[0]&&i<=plage[1])); };
  const texteLignes=()=>B().slice(plage[0],plage[1]+1).map(b=>(b.t==='pu'||b.t==='pj'?'- ':'')+b.x).join('\n');
  const retirerPlage=()=>{ pile(); const L=B(), [a,z]=plage; L.splice(a,z-a+1); if(!L.length) L.push(nouv('pu','')); dessiner(); const n=L[Math.min(a,L.length-1)]; poserCurseur(ligne(n.id),n.x.length); changer(); };
  const styler=t=>{ const b=cour(); if(!b||OBJ.has(b.t)) return; pile(); b.t=t; const l=ligne(b.id); if(l){ l.dataset.t=t; l.dataset.ph=PH[t]||''; } changer(); };
  const gras=()=>{ const b=cour(); if(!b||OBJ.has(b.t)) return; pile(); b.b=!b.b; const l=ligne(b.id); if(l){ if(b.b) l.dataset.b='1'; else delete l.dataset.b; } changer(); };
  const deplacer=d=>{ const L=B(), i=L.findIndex(b=>b.id===ETAT.cour), j=i+d; if(i<0||j<0||j>=L.length) return; pile(); const l=ligne(L[i].id), pos=l?curseur(l):0; [L[i],L[j]]=[L[j],L[i]]; dessiner(); poserCurseur(ligne(L[j].id),pos); changer(); };
  const ajouter=(t,apres)=>{ pile(); const L=B(), i=L.findIndex(b=>b.id===ETAT.cour), c0=L[i], b=Object.assign(nouv(t||'pu',''),c0&&c0.r&&!OBJ.has(c0.t)?{r:1}:{}); L.splice(i<0?L.length:i+(apres===false?0:1),0,b); dessiner(); poserCurseur(ligne(b.id),0); changer(); };
  const supprimer=(debut)=>{ if(plage){ retirerPlage(); return; } const L=B(), i=L.findIndex(b=>b.id===ETAT.cour); if(i<0) return; pile(); L.splice(i,1); if(!L.length) L.push(nouv('pu','')); dessiner(); const n=L[Math.min(i,L.length-1)], nl=ligne(n.id); if(OBJ.has(n.t)){ if(nl) nl.focus(); } else poserCurseur(nl,debut===true?0:n.x.length); changer(); };
  const retrait=()=>{ const b=cour(); if(!b||OBJ.has(b.t)) return; pile(); b.r=b.r?0:1; const l=ligne(b.id); if(l){ if(b.r) l.dataset.r='1'; else delete l.dataset.r; } changer(); };
  const ajouterObj=(t,x)=>{ pile(); const L=B(), i=L.findIndex(b=>b.id===ETAT.cour), b=nouv(t,x||''); L.splice(i<0?L.length:i+1,0,b); dessiner(); ETAT.cour=b.id; const l=ligne(b.id); if(l) l.focus(); changer(); };
  dessiner(); const F={dessiner,styler,gras,retrait,ajouterObj,deplacer,ajouter,supprimer,barre,ligne,pile}; if(!ec) return F;
  const blocDe=l=>B().find(b=>b.id===l.dataset.id)||null, lig=t=>t&&t.closest?t.closest('.sgdp-l'):null;
  hote.addEventListener('focusin',e=>{ const l=lig(e.target); if(l){ ETAT.cour=l.dataset.id; barre(); } });
  /* Maj + clic : plage de lignes, à copier, couper ou supprimer ; chaque ligne étant éditable à part, le glissé reste dans une ligne */
  hote.addEventListener('mousedown',e=>{ const l=lig(e.target); if(!l) return; const L=[...hote.querySelectorAll('.sgdp-l')], i=L.indexOf(l); if(e.shiftKey&&ancre!=null&&i!==ancre){ e.preventDefault(); plage=[Math.min(ancre,i),Math.max(ancre,i)]; marquer(); } else { if(!e.shiftKey) ancre=i; if(plage){ plage=null; marquer(); } } });   /* Maj + clic dans la même ligne : sélection de texte ordinaire */
  const presse=()=>{ PRESSE={t:texteLignes(),blocs:B().slice(plage[0],plage[1]+1).map(b=>JSON.parse(JSON.stringify(b)))}; return PRESSE.t; };
  hote.addEventListener('copy',e=>{ if(!plage) return; e.preventDefault(); e.clipboardData.setData('text/plain',presse()); });
  hote.addEventListener('cut',e=>{ if(!plage) return; e.preventDefault(); e.clipboardData.setData('text/plain',presse()); retirerPlage(); });
  hote.addEventListener('input',e=>{ const l=lig(e.target); if(!l) return; frappe=true; if(plage){ plage=null; marquer(); } const b=blocDe(l); if(b){ b.x=texteDe(l); l.classList.toggle('vide',!b.x); C.modifie(); } });
  hote.addEventListener('keydown',e=>{ if(e.isComposing||e.keyCode===229) return; const l=lig(e.target); if(!l) return; const L=B(), i=L.findIndex(b=>b.id===l.dataset.id), b=L[i], cmd=e.metaKey||e.ctrlKey; if(!b) return;
    if(plage&&!['Shift','Meta','Control','Alt','Backspace','Delete','Escape'].includes(e.key)&&!(cmd&&/^[cxv]$/i.test(e.key))){ plage=null; marquer(); }   /* frappe ou flèche : la plage est abandonnée */
    /* ligne non éditable (pièce remplie d'office, signature, saut de page, plan joint) : Entrée = ligne de texte dessous, Retour arrière / Suppr = la retirer, flèches = ligne voisine */
    if(OBJ.has(b.t)){ if(e.target!==l) return; const voisin=q=>{ const n=q&&ligne(q.id); if(n){ if(OBJ.has(q.t)) n.focus(); else poserCurseur(n,e.key==='ArrowUp'?q.x.length:0); } };
      if(cmd&&e.key==='ArrowUp'){ e.preventDefault(); ETAT.cour=b.id; deplacer(-1); const n=ligne(b.id); if(n) n.focus(); return; } if(cmd&&e.key==='ArrowDown'){ e.preventDefault(); ETAT.cour=b.id; deplacer(1); const n=ligne(b.id); if(n) n.focus(); return; }
      if(e.key==='Enter'){ e.preventDefault(); ETAT.cour=b.id; ajouter('txt'); return; }
      if(e.key==='Backspace'||e.key==='Delete'){ e.preventDefault(); if(e.repeat) return; ETAT.cour=b.id;   /* touche maintenue : rien (un appui distinct retire l'élément) ; plan choisi ou page de garde modifiée : confirmation */
        if(b.f||(b.v&&Object.keys(b.v).length)){ confirmDlg('Retirer « '+((b.t==='annexe'?'Plan joint '+((b.f&&b.f.nom)||''):(OBJ_L[b.x]||[b.x])[0])||'cet élément').trim()+' » ?','Retirer').then(ok=>{ if(ok){ ETAT.cour=b.id; supprimer(true); } }); return; }
        supprimer(true); return; }
      if(e.key==='ArrowUp'&&i>0){ e.preventDefault(); voisin(L[i-1]); return; } if(e.key==='ArrowDown'&&i<L.length-1){ e.preventDefault(); voisin(L[i+1]); return; } return; }
    if(plage&&(e.key==='Backspace'||e.key==='Delete')){ e.preventDefault(); retirerPlage(); return; } if(plage&&e.key==='Escape'){ plage=null; marquer(); return; }
    if(cmd&&!e.shiftKey&&(e.key==='z'||e.key==='Z')&&P.length&&!frappe){ e.preventDefault(); L.splice(0,L.length,...JSON.parse(P.pop())); dessiner(); const n=ligne(ETAT.cour)||hote.querySelector('.sgdp-l'); if(n) poserCurseur(n,n.textContent.length); changer(); return; }
    if(cmd&&(e.key==='b'||e.key==='B')){ e.preventDefault(); ETAT.cour=b.id; gras(); return; } if(cmd&&e.key==='ArrowUp'){ e.preventDefault(); ETAT.cour=b.id; deplacer(-1); return; } if(cmd&&e.key==='ArrowDown'){ e.preventDefault(); ETAT.cour=b.id; deplacer(1); return; }
    if(e.key==='Enter'){ e.preventDefault(); b.x=texteDe(l); const {a,z}=bornes(l); if(!b.x&&b.t==='pu'){ ETAT.cour=b.id; styler('sou'); return; } pile(); if(a===0&&z===0&&b.x){ L.splice(i,0,Object.assign(nouv(b.t,''),b.r?{r:1}:{})); dessiner(); poserCurseur(ligne(b.id),0); changer(); return; }   /* en début de ligne : une ligne vide au-dessus, le titre garde son style */
      const av=b.x.slice(0,a), ap=b.x.slice(z), su=suiteDe(b), n=Object.assign(nouv(su.t,ap,su.t===b.t&&b.b),su.r?{r:1}:{}); b.x=av; L.splice(i+1,0,n); dessiner(); poserCurseur(ligne(n.id),0); changer(); return; }
    const sv=getSelection().isCollapsed, p=curseur(l), lon=texteDe(l).length;
    if(e.key==='Backspace'&&sv&&p===0){ if(i>0&&OBJ.has(L[i-1].t)){ e.preventDefault(); if(e.repeat) return; const q=L[i-1]; if(!lon){ pile(); L.splice(i,1); dessiner(); changer(); } const n=ligne(q.id); if(n) n.focus(); return; } if(i>0){ e.preventDefault(); pile(); const q=L[i-1], o=q.x.length; q.x+=texteDe(l); L.splice(i,1); dessiner(); poserCurseur(ligne(q.id),o); changer(); } else if(!lon&&L.length>1){ e.preventDefault(); pile(); L.splice(0,1); dessiner(); poserCurseur(ligne(L[0].id),0); changer(); } return; }
    if(e.key==='Delete'&&sv&&p===lon&&i<L.length-1&&!OBJ.has(L[i+1].t)){ e.preventDefault(); pile(); b.x=texteDe(l)+L[i+1].x; L.splice(i+1,1); dessiner(); poserCurseur(ligne(b.id),lon); changer(); return; }
    if(e.shiftKey||e.altKey||cmd) return;
    if(e.key==='ArrowUp'&&i>0&&auBord(l,true)){ e.preventDefault(); const q=L[i-1], n=ligne(q.id); if(OBJ.has(q.t)) n.focus(); else poserCurseur(n,q.x.length); return; }
    if(e.key==='ArrowDown'&&i<L.length-1&&auBord(l,false)){ e.preventDefault(); const q=L[i+1], n=ligne(q.id); if(OBJ.has(q.t)) n.focus(); else poserCurseur(n,0); return; }
    if(e.key==='ArrowLeft'&&sv&&p===0&&i>0){ e.preventDefault(); const q=L[i-1]; poserCurseur(ligne(q.id),q.x.length); return; }
    if(e.key==='ArrowRight'&&sv&&p===lon&&i<L.length-1){ e.preventDefault(); poserCurseur(ligne(L[i+1].id),0); } });
  hote.addEventListener('paste',e=>{ const l=lig(e.target), t0=((e.clipboardData&&e.clipboardData.getData('text/plain'))||'').replace(/\r/g,''), R=t0.split('\n').map(x=>x.trim()).filter(Boolean); e.preventDefault();
    const b0=l?blocDe(l):null, L0=B();
    /* plage copiée dans une feuille : recollée telle quelle (styles, retraits, pièces, signatures, sauts, plans) ; une ligne de texte vide est remplacée */
    if(b0&&PRESSE&&PRESSE.blocs.length&&t0===PRESSE.t){ pile(); const n=PRESSE.blocs.map(x=>{ const c=JSON.parse(JSON.stringify(x)); delete c.loc; c.id=nouv(c.t,'').id; return c; }), i=L0.indexOf(b0), vide=!OBJ.has(b0.t)&&!texteDe(l).trim(); L0.splice(vide?i:i+1,vide?1:0,...n); dessiner(); const y=n[n.length-1], ny=ligne(y.id); if(ny){ if(OBJ.has(y.t)) ny.focus(); else poserCurseur(ny,y.x.length); } changer(); return; }
    if(!R.length) return;
    /* collage sur une pièce non éditable : les lignes vont dessous, l'élément reste */
    if(b0&&OBJ.has(b0.t)){ pile(); const n=R.length<2?[nouv('txt',R[0])]:R.map(cls), i=L0.indexOf(b0); L0.splice(i+1,0,...n); dessiner(); const y=n[n.length-1]; poserCurseur(ligne(y.id),y.x.length); changer(); return; }
    if(!l||R.length<2){ document.execCommand('insertText',false,R.join(' ')); return; }
    pile(); const L=B(), i=L.findIndex(b=>b.id===l.dataset.id), b=L[i]; b.x=texteDe(l); const {a,z}=bornes(l), av=b.x.slice(0,a), ap=b.x.slice(z), lib=['pu','pj','txt','kv'].includes(b.t), cl=x=>{ const c=/^[-–—•·*]\s*/.test(x)||!lib?cls(x):nouv(b.t,x,b.b); if(b.r&&['txt','pu','kv','pj'].includes(c.t)) c.r=1; return c; }, n=R.map(cl), y=n[n.length-1], fin=y.x.length; y.x+=ap; if(av.trim()) b.x=av; else Object.assign(b,{t:n[0].t,x:n[0].x,b:n[0].b}); L.splice(i+1,0,...(av.trim()?n:n.slice(1))); dessiner(); poserCurseur(ligne((av.trim()||n.length>1?y:b).id),fin); changer(); });   /* ligne vide : le premier élément la remplit ; lignes sans tiret : style de la ligne où l'on colle */
  hote.addEventListener('contextmenu',e=>{ const l=lig(e.target); if(!l||e.altKey||String(getSelection()).trim()) return; e.preventDefault(); ETAT.cour=l.dataset.id; barre(); const c0=cour()||{}, obj=OBJ.has(c0.t), tIns=obj?'txt':c0.t;   /* sur une pièce : ni style ni gras ; les lignes insérées sont du texte */
    sgMenuAt(e.clientX,e.clientY,[...(obj?[]:[...TY.map(([t,lib])=>({t:lib,chk:c0.t===t,fn:()=>styler(t)})),'-',{t:'Gras',chk:!!c0.b,fn:gras},'-']),{t:'Insérer une ligne au-dessus',fn:()=>ajouter(tIns,false)},{t:'Insérer une ligne en dessous',fn:()=>ajouter(tIns,true)},{t:'Monter',fn:()=>deplacer(-1)},{t:'Descendre',fn:()=>deplacer(1)},'-',{t:'Supprimer la ligne',danger:true,fn:supprimer}]); });
  return F; }
const SUITE_CG={ban:'txt',sec:'txt',sou:'txt',gr:'txt',txt:'txt',pu:'pu',kv:'kv',fl:'fl',cad:'txt',pj:'pj',pjt:'pj'};
const OPT_CG={types:[...TYPES_CG,...TYPES_CG2],suite:b=>({t:SUITE_CG[b.t]||'txt',r:b.t==='gr'?(/^\d+[.)]\s/.test(String(b.x||''))?1:0):(['ban','sec','sou'].includes(b.t)?0:b.r)}),classer:classerCG};
const outilsCG=F=>{ const L=outils(F,TYPES_CG), i=L.findIndex(x=>x.classList&&x.classList.contains('sgdp-sep')), r=ibtn({label:'Retrait',t:'Décaler la ligne sous un titre numéroté',fn:F.retrait}); r.dataset.retrait='1';
  const plus=ibtn({label:'Plus',t:'Autres styles et éléments',menu:()=>[...TYPES_CG2.map(([t,l])=>({t:l,fn:()=>F.styler(t)})),'-',{t:'Insérer : page de garde',fn:()=>F.ajouterObj('auto','garde')},{t:'Insérer : coordonnées de l’entreprise',fn:()=>F.ajouterObj('auto','entreprise')},
    {t:'Insérer : résumé de l’offre',fn:()=>F.ajouterObj('auto','resume')},{t:'Insérer : organisation du projet',fn:()=>F.ajouterObj('auto','orga')},{t:'Insérer : signature',fn:()=>F.ajouterObj('sig','')},{t:'Insérer : saut de page',fn:()=>F.ajouterObj('saut','')},{t:'Insérer : plan joint',fn:()=>F.ajouterObj('annexe','')}]});
  L.splice(i,0,plus); const g=L.findIndex(x=>x.dataset&&x.dataset.gras); L.splice(g+1,0,r); return L; };
const outils=(F,types)=>[...types.map(([t,lib])=>{ const x=ibtn({label:lib,fn:()=>F.styler(t)}); x.dataset.sty=t; return x; }),h('span',{class:'sgdp-sep'}),(()=>{ const x=ibtn({label:'Gras',fn:F.gras}); x.dataset.gras='1'; return x; })(),ibtn({label:'Monter',fn:()=>F.deplacer(-1)}),ibtn({label:'Descendre',fn:()=>F.deplacer(1)}),ibtn({label:'Supprimer la ligne',fn:F.supprimer})];
/* redessin : position dans la feuille, ligne et curseur gardés (⌘S, changement venu d'un autre poste) */
function surRedrawD(X){ if(X._sgdp) return; X._sgdp=true; const r0=X.redraw; X.redraw=function(){ const z=X.el&&X.el.querySelector('.sgdp-zone'), a=document.activeElement; ETAT.mem=z?{y:z.scrollTop,id:a&&z.contains(a)&&a.dataset?a.dataset.id:null,e:a&&z.contains(a)&&a.dataset?a.dataset.e:null,c:a&&z.contains(a)&&a.dataset?a.dataset.c:null,...(a&&z.contains(a)&&a.dataset&&(a.dataset.id||a.dataset.e||a.dataset.c)?bornes(a):{})}:null; return r0.apply(this,arguments); }; }
function rendre(X,cle){ cle=cle||'descriptif'; const nomDoc=cle===CG?'ces conditions générales':'ce descriptif', autre=cle===CG?'une autre soumission':'un autre descriptif'; css(); SGCP.surRedraw(X); surRedrawD(X); const D=preparer(X,cle), ec=peut(X), ce=ec?' class="sgdp-ce" contenteditable="plaintext-only"':'', el=X.el; el.innerHTML=''; let bar=null;
  const zone=h('div',{class:'sgdp-zone'}), page=h('div',{class:'sgdp-feuille'}), lignes=h('div',{class:'sgdp-lignes'}), ent=D.entete; zone.append(page);
  page.innerHTML='<div class="sgdp-ent"><div><div><b data-e="g1" data-ph="Numéro"'+ce+'>'+E(ent.g1)+'</b></div><div data-e="g2" data-ph="Titre et date"'+ce+'>'+E(ent.g2)+'</div></div><div class="dr"><div data-e="d1" data-ph="Rue"'+ce+'>'+E(ent.d1)+'</div><div data-e="d2" data-ph="Localité"'+ce+'>'+E(ent.d2)+'</div></div></div>'+(cle===CG?'':'<div class="sgdp-bande"><span data-c="lettre"'+ce+'>'+E(D.lettre)+'</span><span data-c="titre"'+ce+'>'+E(D.titre)+'</span></div>');
  page.append(lignes);
  const F=feuille(lignes,Object.assign({blocs:()=>(X.S[cle]||D).blocs,modifie:()=>planifier(X,cle),ce:ec,bar:()=>bar},cle===CG?OPT_CG:{}));
  if(cle===CG&&!DS.loaded.has(MOD_T)) DS.need([MOD_T]).then(()=>{ const k=X.id+'|'+CG; if(!X.S[CG]&&BR[k]) delete BR[k]; if(SV_UI.ed&&SV_UI.ed.X===X&&X.node==='tenderConditions'&&DS.get(MOD_T,'bureau')) X.redraw(); }).catch(()=>{});   /* modèle du bureau enregistré : il remplace le modèle livré tant que rien n'est saisi */
  lignes.addEventListener('click',e=>{ const bt=e.target.closest('[data-act]'); if(!bt||!ec) return; const l=bt.closest('.sgdp-l'), b=l&&(X.S[cle]||D).blocs.find(x=>x.id===l.dataset.id); if(!b) return;
    if(bt.dataset.act==='garde') gardeDlg(X,b,()=>planifier(X,cle),{avant:F.pile}); else if(bt.dataset.act==='annexe') choisirAnnexe(b,()=>{ planifier(X,cle); F.dessiner(); },F.pile); else if(bt.dataset.act==='annexe-x') retirerPlan(b,()=>{ F.pile(); delete b.f; planifier(X,cle); F.dessiner(); }); });
  const importer=async f=>{ if(!f) return; try{ const R=await lirePdf(f); if(!R.blocs.length){ toast('Aucun texte trouvé dans ce PDF (document scanné ?).',true); return; } if(!await confirmDlg('Remplacer le contenu de '+nomDoc+' par les '+R.blocs.length+' lignes du PDF ?','Remplacer')) return;
      const Dx=attacher(X,cle)||D; if(!X.S[cle]) X.S[cle]=Dx; Dx.blocs=R.blocs; if(R.titre){ Dx.lettre=R.lettre; Dx.titre=R.titre; } X.redraw(); planifier(X,cle); toast(R.blocs.length+' lignes importées du PDF.'); }catch(e){ console.error(e); toast('Lecture du PDF impossible : '+(e&&e.message||e),true); } };
  const depuis=()=>{ const pid=(X.doc||{}).PROJECT_ID, L=DS.all('devisdocument').filter(d=>{ if(d.ID===X.id||+d.ISMARKEDASDELETED) return false; const s=DS.get('soumission',d.ID); return !!(s&&s[cle]&&(s[cle].blocs||[]).some(b=>['pu','txt','pj','kv'].includes(b.t)&&String(b.x||'').trim())); }).sort((a,b)=>(+(b.PROJECT_ID===pid))-(+(a.PROJECT_ID===pid))); if(!L.length){ toast('Rien à reprendre : aucune autre soumission n’a ce document.',true); return; }
    const liste=h('div',{class:'sgdp-liste'},...L.map(d=>{ const p=DS.get('project',d.PROJECT_ID)||{}; return h('button',{type:'button',onclick:async()=>{ D0.close(); if(!await confirmDlg('Remplacer le contenu de '+nomDoc+' par celui de « '+[p.NUMBER,d.BKP,d.AWARDINGTEXT].filter(Boolean).join(' ')+' » ?','Remplacer')) return; const s=DS.get('soumission',d.ID)[cle]||{}; if(!X.S[cle]) X.S[cle]=attacher(X,cle)||D; X.S[cle].blocs=(s.blocs||[]).map(b=>nouv(b.t,b.x,b.b)); if(s.titre!=null){ X.S[cle].lettre=s.lettre; X.S[cle].titre=s.titre; } X.redraw(); planifier(X,cle); }},[p.NUMBER,d.BKP,d.AWARDINGTEXT].filter(Boolean).join(' · ')); }));
    const D0=dialog({title:cle===CG?'Reprendre les conditions d’une autre soumission':'Reprendre un autre descriptif',body:liste,buttons:[{t:'Annuler'}]}); };
  const fich=h('input',{type:'file',accept:'application/pdf,.pdf',style:{display:'none'},onchange:()=>{ const f=fich.files[0]; fich.value=''; importer(f); }});
  bar=phead([...(ec?[...(cle===CG?outilsCG(F):outils(F,TYPES)),h('span',{class:'sgdp-sep'}),ibtn({i:'import',t:'Importer',label:'Importer',menu:()=>[{t:'Depuis un PDF…',fn:()=>fich.click()},{t:'Depuis '+autre+'…',fn:depuis},...(cle===CG?['-',{t:'Reprendre le modèle du bureau…',fn:()=>reprendreModele(X)},{t:'Enregistrer comme modèle du bureau…',fn:()=>enregistrerModele(X)}]:[])]}),...(cle===CG?[]:[ibtn({label:'Date des lettres',t:'Titre et date du document',fn:()=>svDlgTitleDate(X,'B')})])]:[]),
    ibtn({i:'doc',label:cle===CG?'Conditions en PDF':'Ouvrir en PDF',fn:async()=>{ if(ETAT.t) envoyerD(X); ouvrirPdf(X,cle); }}),ibtn({i:'doc',label:'Cahier complet',t:'Conditions puis cahier des charges, en un seul PDF',fn:()=>ouvrirCahier(X)}),fich]);
  bar.classList.add('sgdp-bar'); bar.addEventListener('mousedown',e=>{ if(e.target.closest('.ib')) e.preventDefault(); });
  el.append(bar,zone); if(!ec) return;
  page.addEventListener('keydown',e=>{ if(e.key==='Enter'&&e.target.isContentEditable&&!e.target.closest('.sgdp-l')) e.preventDefault(); });
  page.addEventListener('input',e=>{ const t=e.target, Dx=X.S[cle]||D; if(t.dataset&&t.dataset.e) Dx.entete[t.dataset.e]=texteDe(t); else if(t.dataset&&t.dataset.c) Dx[t.dataset.c]=texteDe(t); else return; planifier(X,cle); });
  const m=ETAT.mem; ETAT.mem=null; if(m){ zone.scrollTop=m.y; const f=m.id?F.ligne(m.id):m.e?page.querySelector('[data-e="'+m.e+'"]'):m.c?page.querySelector('[data-c="'+m.c+'"]'):null; if(f&&!document.querySelector('.ov')){ poserCurseur(f,m.a||0); zone.scrollTop=m.y; } } F.barre(); }

/* ── branchement dans la soumission ── */
const nf0=svNodeFn; svNodeFn=function(k){ if(k==='offerOverviewDocTransfer'&&SV_UI.ed&&estD(SV_UI.ed.X.S)) return null;   /* contrat d'un descriptif : module Contrats d'entreprise */
  const tete=()=>setTimeout(()=>{ if(SV_UI.ed&&SV_UI.ed.majTete) SV_UI.ed.majTete(); },0);
  if(k==='tenderConditions') return function(X){ rendreCG(X); tete(); };   /* Appel d'offres ▸ Conditions générales : le cahier qui accompagne le cahier de soumission */
  const f=nf0(k); if(k!=='tenderEdit'||typeof f!=='function') return f; return function(X){ if(!estD(X&&X.S)) return f.apply(this,arguments); rendre(X); tete(); }; };
const TOUS=SV_TREE.slice();
const ev0=svEditor; svEditor=function(m,id){ const des=estD(DS.get('soumission',id)), ao=s=>s.k==='tender'?{...s,subs:[['tenderConditions','Conditions générales',3],['tenderEdit',des?'Descriptif':'Soumission',3],['tenderDocuments','Documents',3]]}:s; SV_TREE.length=0; SV_TREE.push(...(des?TOUS.filter(s=>['tender','tendering','offerOverview'].includes(s.k)):TOUS).map(ao)); const r=ev0(m,id); setTimeout(()=>{ const X=SV_UI.ed&&SV_UI.ed.X; if(X&&X.id===+id) reprendreSecours(X).catch(e=>console.error(e)); },0); return r; };
/* Appel d'offres ▸ Documents : le PDF des conditions générales à côté de celui du descriptif */
const rw0=svcStepRows; svcStepRows=function(et){ const L=rw0(et); if(et==='B') L.splice(0,0,{k:'cahier|doc',g:'cahier',kind:'doc',t:'Cahier complet (conditions et cahier des charges)'},{k:'cg|doc',g:'cg',kind:'doc',t:'Conditions générales'},{k:'cg|pdf',g:'cg',kind:'pdf',t:'Conditions générales en PDF'}); return L; };

/* ═══ CONDITIONS GÉNÉRALES DU PROJET ET PAR CFC (07.11.2026, bloc 45 ; Paulo : « ajouter le module conditions générales des soumissions pour créer le cahier de base à mettre dans
   toutes les soumissions ; déplace les conditions générales éditables dans le module, dans Chantier ; dans la soumission affiche uniquement les conditions générales ; ajouter la possibilité
   de modifier les conditions générales par CFC, mais uniquement dans le CFC où la modification a eu lieu, et reproduire dans tous les CFC les conditions générales éditées dans le module ») ═══
   Page du projet ▸ Chantier ▸ Conditions générales (sgCgModule) : la base du projet, collection sgcgprojet {ID = projet, PROJECT_ID, entete, blocs, MODIFIE, PAR} ; tant qu'elle n'est pas
   enregistrée, brouillon du modèle du bureau (BRP). Une soumission (Appel d'offres ▸ Conditions générales, rendreCG) affiche la base en lecture ; « Modifier pour ce CFC » enregistre la base si
   besoin (les lignes gardent leur identifiant) puis l'écart dans S.conditionsGenerales = {v:2, modifs {id: ligne}, suppr [id], ajouts {id d'ancrage ('' = en tête): [lignes]}} (diffCG) :
   une modification de la base s'applique à toutes les soumissions, sauf sur les lignes modifiées, retirées ou déplacées dans un CFC (resoudreCG). Ancien format (feuille complète, première
   version du 07.11.2026) : gardé comme conditions propres au CFC. Lignes propres au CFC surlignées ; « Rétablir la ligne du projet », « Revenir aux conditions du projet ». */
const CGP_T='sgcgprojet', BRP={}, ETB={rec:{},t:{},cours:{},encore:{},ed:new Set()};
const peutP=p=>{ try{ return !!p&&!!((sgAdmin()||sgDroit('projets_modifier','tous')||(sgDroit('projets_modifier','siens')&&sgMesProjets().has(String(p.ID))))&&(sgAdmin()||sgDroit('chantier','ecriture'))); }catch(_){ return false; } };
const enteteProjet=p=>{ const a=adrAffaire(p); return {g1:(p&&p.NUMBER)||'',g2:[p&&p.TITLE,dfr(today())].filter(Boolean).join(' – '),d1:a.rue,d2:a.loc||((p&&p.LOCATION)||'')}; };
const baseRec=p=>p&&p.ID!=null&&DS.loaded.has(CGP_T)?DS.get(CGP_T,String(p.ID)):null;
function baseCG(p){ const r=ETB.rec[p.ID]||baseRec(p); if(r&&Array.isArray(r.blocs)) return r; return BRP[p.ID]||(BRP[p.ID]={ID:String(p.ID),PROJECT_ID:p.ID,blocs:modeleCG(),entete:enteteProjet(p),brouillon:1}); }
const seqB=id=>(DS.S[CGP_T]||{})[id]||0;
/* modèle du bureau changé : les brouillons qui le reprenaient (projets consultés sans être modifiés) sont oubliés, ils seront refaits du nouveau modèle */
const oublierModele=sauf=>{ Object.keys(BRP).forEach(k=>delete BRP[k]); Object.keys(ETB.rec).forEach(k=>{ const r=ETB.rec[k]; if(r&&r.brouillon&&String(k)!==String(sauf)&&!ETB.t[k]&&!ETB.cours[String(k)]) delete ETB.rec[k]; }); };
async function envoiBase(p){ const id=String(p.ID); if(ETB.cours[id]){ ETB.encore[id]=true; return; } ETB.cours[id]=true;
  try{ do{ ETB.encore[id]=false; const r=ETB.rec[p.ID]; if(!r) break; const val=JSON.parse(JSON.stringify(r)); delete val.brouillon; await DS.commit([{t:CGP_T,id,val,bseq:seqB(id)}]); delete r.brouillon; delete BRP[p.ID]; }while(ETB.encore[id]); }
  catch(e){ if(e&&e.conflict){ ETB.rec[p.ID]=null; toast('Conditions du projet modifiées sur un autre poste : la version à jour est affichée.',true); const m=document.querySelector('.sgcgm'); if(m&&m._redessiner) m._redessiner(); } else toast('Conditions du projet non enregistrées : '+(e&&e.message||e),true); }
  finally{ ETB.cours[id]=false; } }
const planifBase=p=>{ const r=ETB.rec[p.ID]; if(!r) return; r.MODIFIE=new Date().toISOString().slice(0,16).replace('T',' '); r.PAR=(typeof ME!=='undefined'&&ME&&ME.id)||''; clearTimeout(ETB.t[p.ID]); ETB.t[p.ID]=setTimeout(()=>{ ETB.t[p.ID]=null; envoiBase(p); },600); };
const viderBase=async p=>{ if(ETB.t[p.ID]){ clearTimeout(ETB.t[p.ID]); ETB.t[p.ID]=null; await envoiBase(p); } while(ETB.cours[String(p.ID)]) await new Promise(z=>setTimeout(z,60)); };
const enAttente=p=>!!(ETB.t[p.ID]||ETB.cours[String(p.ID)]);
async function assurerBase(p){ await DS.need([CGP_T,MOD_T]).catch(()=>{}); if(baseRec(p)&&!enAttente(p)) return true; if(!ETB.rec[p.ID]) ETB.rec[p.ID]=JSON.parse(JSON.stringify(baseCG(p))); planifBase(p); await viderBase(p); return !!baseRec(p); }
/* écart d'un CFC : lignes comparées sans leur marque d'affichage */
const pur=b=>{ const o={t:b.t,x:String(b.x==null?'':b.x)}; if(b.b) o.b=1; if(b.r) o.r=1; if(b.v&&Object.keys(b.v).length) o.v=JSON.parse(JSON.stringify(b.v)); if(b.f) o.f=JSON.parse(JSON.stringify(b.f)); return o; };
function resoudreCG(base,ov){ ov=ov||{}; const sup=new Set(ov.suppr||[]), M=ov.modifs||{}, A=ov.ajouts||{}, ids=new Set(base.map(b=>b.id)), out=[], loc=b=>Object.assign({},b,{loc:1});
  (A['']||[]).forEach(b=>out.push(loc(b)));
  base.forEach(b=>{ if(!sup.has(b.id)) out.push(M[b.id]?Object.assign(loc(M[b.id]),{id:b.id}):b); (A[b.id]||[]).forEach(x=>out.push(loc(x))); });
  Object.keys(A).forEach(k=>{ if(k&&!ids.has(k)) A[k].forEach(x=>out.push(loc(x))); });   /* ancre retirée du projet : ajouts du CFC à la fin */
  return out; }
function diffCG(base,W){ const idx=new Map(base.map((b,i)=>[b.id,i])), modifs={}, ajouts={}, gardes=new Set(); let last=-1, ancre='';
  W.forEach(b=>{ const k=idx.get(b.id);
    if(k!=null&&k>last&&!gardes.has(b.id)){ gardes.add(b.id); last=k; ancre=b.id; if(JSON.stringify(pur(b))!==JSON.stringify(pur(base[k]))) modifs[b.id]=pur(b); }
    else (ajouts[ancre]||(ajouts[ancre]=[])).push(Object.assign({id:k!=null?b.id+'~m':b.id},pur(b))); });   /* ligne du projet déplacée : copie propre au CFC */
  return {modifs,suppr:base.filter(b=>!gardes.has(b.id)).map(b=>b.id),ajouts}; }
const nbLoc=ov=>ov?Object.keys(ov.modifs||{}).length+(ov.suppr||[]).length+Object.values(ov.ajouts||{}).reduce((n,L)=>n+L.length,0):0;
const ancienCG=o=>!!o&&o.v!==2&&Array.isArray(o.blocs)&&o.blocs.length>0&&!ancienPlan(o.blocs);
function cgSoumission(X){ const p=X.p||{}, B=baseCG(p), o=X.S&&X.S[CG];
  if(ancienCG(o)) return {blocs:o.blocs.map(b=>Object.assign({},b,{loc:1})),entete:B.entete,ancien:1,nloc:o.blocs.length};
  const ov=o&&o.v===2?o:null; return {blocs:resoudreCG(B.blocs,ov),entete:B.entete,nloc:nbLoc(ov)}; }
const etatCfc=d=>{ const o=(DS.get('soumission',d.ID)||{})[CG]; return ancienCG(o)?-1:(o&&o.v===2?nbLoc(o):0); };
/* page de la feuille (en-tête et lignes), commune à la soumission et au module */
function pageCG(D,ec){ const ce=ec?' class="sgdp-ce" contenteditable="plaintext-only"':'', ent=D.entete||{}, zone=h('div',{class:'sgdp-zone'}), page=h('div',{class:'sgdp-feuille'}), lignes=h('div',{class:'sgdp-lignes'}); zone.append(page);
  page.innerHTML='<div class="sgdp-ent"><div><div><b data-e="g1" data-ph="Numéro"'+ce+'>'+E(ent.g1)+'</b></div><div data-e="g2" data-ph="Titre et date"'+ce+'>'+E(ent.g2)+'</div></div><div class="dr"><div data-e="d1" data-ph="Rue"'+ce+'>'+E(ent.d1)+'</div><div data-e="d2" data-ph="Localité"'+ce+'>'+E(ent.d2)+'</div></div></div>';
  page.append(lignes); return {zone,page,lignes}; }
/* Appel d'offres ▸ Conditions générales : celles du projet, en lecture ; modifications propres au CFC sur demande */
function rendreCG(X){ css(); SGCP.surRedraw(X); surRedrawD(X); const p=X.p||{}, el=X.el; el.innerHTML='';
  if(!DS.loaded.has(CGP_T)||!DS.loaded.has(MOD_T)){ el.append(h('p',{class:'sgdp-cgb'},'Chargement des conditions du projet…')); DS.need([CGP_T,MOD_T]).then(()=>{ if(SV_UI.ed&&SV_UI.ed.X===X&&X.node==='tenderConditions') X.redraw(); }).catch(()=>{}); return; }
  const B=baseCG(p), R=cgSoumission(X), ecS=peut(X), ed=ecS&&ETB.ed.has(X.id), W=R.blocs.map(b=>JSON.parse(JSON.stringify(b))), {zone,page,lignes}=pageCG(R,false);
  let bar=null; const ban=h('div',{class:'sgdp-cgb'+(R.nloc?' loc':'')});
  const texte=()=>{ const o=X.S[CG], n=ancienCG(o)?-1:nbLoc(o&&o.v===2?o:null); return n<0?'Ce CFC a ses propres conditions générales (copie complète, faite avant le module du projet). Les modifications du projet ne s’y appliquent pas.':n?n+(n>1?' modifications propres à ce CFC (surlignées) ; le reste suit les conditions du projet.':' modification propre à ce CFC (surlignée) ; le reste suit les conditions du projet.'):'Conditions générales du projet, communes à toutes ses soumissions.'+(B.brouillon?' Elles reprennent le modèle du bureau.':''); };
  const majLoc=()=>{ const o=X.S[CG], ov=o&&o.v===2?o:null, L=new Set(ov?[...Object.keys(ov.modifs||{}),...Object.values(ov.ajouts||{}).flat().map(b=>b.id)]:[]);
    if(ov) lignes.querySelectorAll('.sgdp-l').forEach(l=>{ if(L.has(l.dataset.id)||L.has(l.dataset.id+'~m')) l.dataset.loc='1'; else delete l.dataset.loc; }); const t=ban.querySelector('span'); if(t) t.textContent=texte(); ban.classList.toggle('loc',!!(ov&&nbLoc(ov))||ancienCG(o)); };
  const modifie=()=>{ X.S[CG]=Object.assign({v:2},diffCG(B.blocs,W)); planifier(X,CG); majLoc(); };
  const F=feuille(lignes,Object.assign({blocs:()=>W,modifie,ce:ed,bar:()=>bar},OPT_CG));
  const bt=(a,t)=>'<button type="button" data-a="'+a+'">'+E(t)+'</button>', o0=X.S[CG];
  ban.innerHTML='<b>Conditions générales</b><span></span>'+(ecS?(ed?bt('fin','Terminer'):bt('cfc','Modifier pour ce CFC')):'')+(ecS&&(nbLoc(o0&&o0.v===2?o0:null)||ancienCG(o0))?bt('rev','Revenir aux conditions du projet'):'')+bt('mod','Conditions du projet (toutes les soumissions)');
  ban.onclick=async e=>{ const a=(e.target.closest('[data-a]')||{}).dataset; if(!a||!a.a) return;
    if(a.a==='cfc'){ if(!X.can()) return; if(!await assurerBase(p)){ toast('Conditions du projet non enregistrées : impossible de les modifier pour ce CFC.',true); return; } ETB.ed.add(X.id); X.redraw(); }
    else if(a.a==='fin'){ if(ETAT.t) envoyerD(X); ETB.ed.delete(X.id); X.redraw(); }
    else if(a.a==='rev'){ if(!X.can()||!await confirmDlg('Revenir aux conditions du projet ? Les modifications propres à ce CFC seront perdues.','Revenir')) return; X.S[CG]={v:2,modifs:{},suppr:[],ajouts:{}}; planifier(X,CG); X.redraw(); }
    else if(a.a==='mod'){ if(ETAT.t) envoyerD(X); await svClose({silent:true}); go('nx-pdom',p.ID+'|Conditions générales'); } };
  lignes.addEventListener('click',e=>{ const b0=e.target.closest('[data-act]'); if(!b0||!ed) return; const l=b0.closest('.sgdp-l'), b=l&&W.find(x=>x.id===l.dataset.id); if(!b) return;
    if(b0.dataset.act==='garde') gardeDlg(X,b,modifie,{avant:F.pile}); else if(b0.dataset.act==='annexe') choisirAnnexe(b,()=>{ modifie(); F.dessiner(); majLoc(); },F.pile); else if(b0.dataset.act==='annexe-x') retirerPlan(b,()=>{ F.pile(); delete b.f; modifie(); F.dessiner(); majLoc(); }); });
  const retablir=()=>{ const id=ETAT.cour, o=X.S[CG]; if(!id||!o||o.v!==2) return; let ch=false; if(o.modifs&&o.modifs[id]){ delete o.modifs[id]; ch=true; } Object.keys(o.ajouts||{}).forEach(k=>{ const L=o.ajouts[k], i=L.findIndex(x=>x.id===id||x.id===id+'~m'); if(i>=0){ L.splice(i,1); ch=true; } }); if(ch){ planifier(X,CG); X.redraw(); } else toast('Cette ligne est déjà celle du projet.'); };
  bar=phead([...(ed?[...outilsCG(F),h('span',{class:'sgdp-sep'}),ibtn({label:'Rétablir la ligne du projet',t:'La ligne choisie reprend la version des conditions du projet',fn:retablir})]:[]),ibtn({i:'doc',label:'Conditions en PDF',fn:()=>{ if(ETAT.t) envoyerD(X); ouvrirCahier(X,{seul:true}); }}),ibtn({i:'doc',label:'Cahier complet',t:'Conditions puis cahier des charges, en un seul PDF',fn:()=>ouvrirCahier(X)})]);
  bar.classList.add('sgdp-bar'); bar.addEventListener('mousedown',e=>{ if(e.target.closest('.ib')) e.preventDefault(); });
  el.append(ban,bar,zone); majLoc();
  const m=ETAT.mem; ETAT.mem=null; if(m){ zone.scrollTop=m.y; const f=m.id&&F.ligne(m.id); if(f&&ed&&!document.querySelector('.ov')){ poserCurseur(f,m.a||0); zone.scrollTop=m.y; } } F.barre(); }
/* Page du projet ▸ Chantier ▸ Conditions générales : la base du projet */
function moduleCG(C,p){ const O=window.SGSV&&SGSV.outils, ec=peutP(p); if(!ETB.rec[p.ID]||(!enAttente(p)&&!(C.contains(document.activeElement)))){ ETB.rec[p.ID]=null; ETB.rec[p.ID]=JSON.parse(JSON.stringify(baseCG(p))); } const rec=ETB.rec[p.ID];   /* rien en attente : relu de la base (ou du modèle du bureau à jour) */
  const docs=DS.by('devisdocument','PROJECT_ID',p.ID).filter(d=>!+d.ISMARKEDASDELETED).sort((a,b)=>String(a.BKP||'').localeCompare(String(b.BKP||''),'fr',{numeric:true})), nb=new Map(docs.map(d=>[d.ID,etatCfc(d)])), nLoc=[...nb.values()].filter(x=>x!==0).length;
  const sous=[O.pl(docs.length,'soumission'),nLoc?nLoc+' avec des modifications propres':'',rec.brouillon?'modèle du bureau, pas encore adapté au projet':(rec.MODIFIE?'modifiées le '+dfr(String(rec.MODIFIE).slice(0,10))+(rec.PAR?' par '+rec.PAR:''):'')].filter(Boolean).join(' · ');
  C.innerHTML='<div class="sgsv sgcgm">'+O.tete(p.NUMBER||'','Conditions générales',p.TITLE||'',sous,'')
    +'<p class="sgcgm-aide">Cahier de base de toutes les soumissions du projet : ce qui est modifié ici s’applique à chaque CFC, sauf aux lignes modifiées dans un CFC (Appel d’offres ▸ Conditions générales ▸ Modifier pour ce CFC).</p>'
    +(docs.length?'<table class="nx-tbl sgcgm-tb"><thead><tr><th>CFC</th><th>Lot</th><th>Conditions générales</th></tr></thead><tbody>'+docs.map(d=>{ const n=nb.get(d.ID); return '<tr data-d="'+E(d.ID)+'"><td class="nw"><b>'+E(d.BKP||'—')+'</b></td><td>'+E(d.AWARDINGTEXT||'')+'</td><td>'+(n<0?'<span class="sgcgm-loc">copie propre au CFC</span>':n?'<span class="sgcgm-loc">'+n+(n>1?' modifications propres':' modification propre')+'</span>':'celles du projet')+'</td></tr>'; }).join('')+'</tbody></table>':'')
    +'<div class="sgcgm-ed"></div></div>';
  const box=C.firstElementChild; box._redessiner=()=>moduleCG(C,p);
  const PX={p,S:{appelOffres:{},unites:{}},doc:{BKP:'',AWARDINGTEXT:''},id:null};
  const {zone,page,lignes}=pageCG(rec,ec); let bar=null;
  const F=feuille(lignes,Object.assign({blocs:()=>rec.blocs,modifie:()=>planifBase(p),ce:ec,bar:()=>bar},OPT_CG));
  /* remplacement de la base : les lignes identiques (même style, même texte) gardent leur identifiant, les modifications des CFC continuent de s'y appliquer ; celles dont la ligne disparaît sont annoncées */
  const garderIds=L=>{ const M=new Map(); rec.blocs.forEach(b=>{ const k=b.t+'\u0001'+String(b.x||''); if(!M.has(k)) M.set(k,[]); M.get(k).push(b.id); }); L.forEach(b=>{ const q=M.get(b.t+'\u0001'+String(b.x||'')); if(q&&q.length) b.id=q.shift(); }); return L; };
  const perdues=L=>{ const ids=new Set(L.map(b=>b.id)); let n=0; docs.forEach(d=>{ const o=(DS.get('soumission',d.ID)||{})[CG]; if(!o||o.v!==2) return; n+=Object.keys(o.modifs||{}).filter(k=>!ids.has(k)).length+(o.suppr||[]).filter(k=>!ids.has(k)).length+Object.keys(o.ajouts||{}).filter(k=>k&&!ids.has(k)).reduce((s,k)=>s+o.ajouts[k].length,0); }); return n; };
  const avisPerdues=n=>n?' '+n+(n>1?' modifications propres aux CFC portent':' modification propre à un CFC porte')+' sur des lignes qui disparaissent : '+(n>1?'elles ne s’appliqueront plus (les lignes ajoutées passent en fin de cahier).':'elle ne s’appliquera plus (une ligne ajoutée passe en fin de cahier).'):'';
  const importer=async f=>{ if(!f) return; try{ const R2=await lirePdf(f); if(!R2.blocs.length){ toast('Aucun texte trouvé dans ce PDF (document scanné ?).',true); return; }
      const L=garderIds([...(R2.titre?[nouv(R2.lettre?'ban':'gr',[R2.lettre,R2.titre].filter(Boolean).join(' '))]:[]),...R2.blocs]);   /* titre en grand corps de la première page : gardé en tête (section ou titre) */
      if(!await confirmDlg('Remplacer les conditions du projet par les '+L.length+' lignes du PDF ?'+avisPerdues(perdues(L)),'Remplacer')) return; rec.blocs=L; planifBase(p); moduleCG(C,p); toast(L.length+' lignes importées du PDF.'); }catch(e){ console.error(e); toast('Lecture du PDF impossible : '+(e&&e.message||e),true); } };
  const fich=h('input',{type:'file',accept:'application/pdf,.pdf',style:{display:'none'},onchange:()=>{ const f=fich.files[0]; fich.value=''; importer(f); }});
  const reprendre=async()=>{ await DS.need([MOD_T]).catch(()=>{}); const L=garderIds(modeleCG()); if(!await confirmDlg('Remplacer les conditions du projet par le modèle du bureau ?'+avisPerdues(perdues(L)),'Remplacer')) return; rec.blocs=L; planifBase(p); moduleCG(C,p); };
  const enregistrer=async()=>{ if(!await confirmDlg('Enregistrer ces conditions comme modèle du bureau ? Les nouveaux projets partiront de ce modèle ; les projets existants ne changent pas. Les plans joints et la page de garde modifiée ne sont pas repris.','Enregistrer')) return;
    try{ await DS.commit([{t:MOD_T,id:'bureau',val:{ID:'bureau',blocs:rec.blocs.map(b=>Object.assign({t:b.t,x:String(b.x||'')},b.b?{b:1}:{},b.r?{r:1}:{})),MODIFIE:new Date().toISOString().slice(0,16).replace('T',' '),PAR:(typeof ME!=='undefined'&&ME&&ME.id)||''}}]); oublierModele(p.ID); toast('Modèle du bureau enregistré.'); }catch(e){ toast('Modèle non enregistré : '+(e&&e.message||e),true); } };
  bar=phead([...(ec?[...outilsCG(F),h('span',{class:'sgdp-sep'}),ibtn({i:'import',t:'Importer',label:'Importer',menu:()=>[{t:'Depuis un PDF…',fn:()=>fich.click()},'-',{t:'Reprendre le modèle du bureau…',fn:reprendre},{t:'Enregistrer comme modèle du bureau…',fn:enregistrer}]})]:[]),ibtn({i:'doc',label:'Aperçu en PDF',t:'Conditions du projet, sans les données d’un CFC',fn:async()=>{ await viderBase(p); ouvrirCahier(PX,{seul:true,base:rec}); }}),fich]);
  bar.classList.add('sgdp-bar'); bar.addEventListener('mousedown',e=>{ if(e.target.closest('.ib')) e.preventDefault(); });
  box.querySelector('.sgcgm-ed').append(bar,zone); F.barre();
  if(ec) page.addEventListener('input',e=>{ const t=e.target; if(t.dataset&&t.dataset.e){ rec.entete=rec.entete||{}; rec.entete[t.dataset.e]=texteDe(t); planifBase(p); } });
  lignes.addEventListener('click',e=>{ const b0=e.target.closest('[data-act]'); if(!b0||!ec) return; const l=b0.closest('.sgdp-l'), b=l&&rec.blocs.find(x=>x.id===l.dataset.id); if(!b) return;
    if(b0.dataset.act==='garde') gardeDlg(PX,b,()=>planifBase(p),{projet:true,avant:F.pile}); else if(b0.dataset.act==='annexe') choisirAnnexe(b,()=>{ planifBase(p); F.dessiner(); },F.pile); else if(b0.dataset.act==='annexe-x') retirerPlan(b,()=>{ F.pile(); delete b.f; planifBase(p); F.dessiner(); }); });
  box.querySelector('.sgcgm-tb')&&box.querySelector('.sgcgm-tb').addEventListener('click',async e=>{ const tr=e.target.closest('tr[data-d]'); if(!tr) return; await viderBase(p); await svOpenDoc(+tr.dataset.d); setTimeout(()=>{ if(SV_UI.ed&&SV_UI.ed.X) SV_UI.ed.X.go('tenderConditions'); },300); }); }
DS.on(ts=>{ if(!(ts||[]).some(t=>t===CGP_T||t==='soumission'||t==='devisdocument'||t===MOD_T)) return; setTimeout(()=>{ const m=document.querySelector('.sgcgm'); if(!m||!m._redessiner||m.contains(document.activeElement)) return; const pid=Object.keys(ETB.rec).find(k=>m.isConnected); if(document.querySelector('.ov')) return; if(Object.keys(ETB.t).some(k=>ETB.t[k])||Object.values(ETB.cours).some(Boolean)) return; m._redessiner(); },0); });
window.sgCgModule=function(C,p){ try{ css(); C.innerHTML='<p class="sgce-note">Chargement…</p>'; DS.need([CGP_T,MOD_T,...SV_NEED,'sgfaisa']).then(()=>moduleCG(C,p)).catch(e=>{ console.error(e); C.textContent='Conditions générales : lecture impossible.'; }); }catch(e){ console.error(e); C.textContent='Conditions générales : erreur — '+String(e&&e.message||e); } };
window.sgCgCompte=p=>{ try{ if(!DS.loaded.has(CGP_T)) return ''; const r=baseRec(p), n=DS.loaded.has('soumission')?DS.by('devisdocument','PROJECT_ID',p.ID).filter(d=>!+d.ISMARKEDASDELETED&&etatCfc(d)!==0).length:0; return n?n+' CFC modifié'+(n>1?'s':'')+(r?'':' · modèle du bureau'):(r?'conditions du projet':'modèle du bureau'); }catch(_){ return ''; } };

window.sgCgPdf=(X,g)=>g==='cahier'?ouvrirCahier(X):ouvrirCahier(X,{seul:true});
window.sgCahierPdf=X=>ouvrirCahier(X);
/* Conditions générales en tête de l'étape (07.11.2026, Paulo : « mettre les conditions générales avant la soumission ») : le garde-fou du moteur (svdCheck, mot-clé manquant…) renvoie à la
   première entrée de l'étape ; il doit renvoyer à la Soumission, où l'article fautif est choisi */
const ck0=svdCheck; svdCheck=function(X,k){ const r=ck0.apply(this,arguments); if(r===false&&k==='tenderDocuments') setTimeout(()=>{ if(SV_UI.ed&&SV_UI.ed.X===X&&X.node!=='tenderEdit') X.go('tenderEdit'); },0); return r; };
/* Appel d'offres ▸ Documents : « Document disponible » des conditions générales = elles ont un texte (svcStepDocs de DeltaSub.html) */
window.sgCgDoc=(X,g)=>{ const D=X&&X.S&&X.S[CG], De=g==='cahier'&&X&&X.S&&X.S.descriptif, txt=L=>(L||[]).some(b=>['pu','txt','pj','kv','cad','fl'].includes(b.t)&&String(b.x||'').trim()); return baseRec(X&&X.p)||D||(De&&txt(De.blocs))?{pdf:null}:null; };   /* conditions : celles du projet (module) ou du CFC */
const pr0=svdPrint; svdPrint=function(ctx,kind){ if(estD(ctx&&ctx.S)&&ctx.et==='B') return ouvrirPdf(ctx.X); return pr0(ctx,kind); };
const be0=svbEdit; svbEdit=function(X){ if(estD(X.S)&&peut(X)){ svbNormBref(X.S); const d=X.doc||{}; if(!X.S.bref.structure.length&&d.BKP&&X.p&&svbAddCfc(X.S,X.p,d.BKP,d.AWARDINGTEXT||'')) X.commit().catch(()=>{}); } return be0(X); };
const sc0=svClose; svClose=async function(o){ const X=SV_UI.ed&&SV_UI.ed.X; if(ETAT.t&&X) envoyerD(X); else if(ETAT.t){ clearTimeout(ETAT.t); ETAT.t=null; } return sc0(o); };
/* le mode ne vaut que pour la fenêtre « Nouveau document » ouverte par ce choix : annulée, elle n'a plus d'effet */
const ss0=svNewSoum; svNewSoum=function(id,pid){ const S=ss0(id,pid); if(ETAT.ov&&ETAT.ov.isConnected){ S.mode='descriptif'; ETAT.ov=null; } return S; };
const sn0=svNew; svNew=function(p){ css(); const fin=m=>{ D.close(); ETAT.ov=null; sn0(p); if(m==='descriptif') ETAT.ov=[...document.querySelectorAll('.ov')].pop()||null; };
  const corps=h('div',{class:'sgdp-choix'},h('button',{type:'button',onclick:()=>fin(null)},h('b',{},'Par articles'),h('span',{},'Articles de soumission avec quantités et prix, comparatif détaillé article par article.')),h('button',{type:'button',onclick:()=>fin('descriptif')},h('b',{},'Sous forme de descriptif'),h('span',{},'Texte par rubriques et tirets, comme un descriptif Word ; les entreprises répondent par une offre, à reporter au comparatif bref.')));
  const D=dialog({title:'Nouvelle soumission',body:corps,buttons:[{t:'Annuler'}]}); };
window.SGDP={ETAT,lirePdf,analyser,classer,modele,ouvrirPdf,pdfDe,pdfDoc,feuille,outils,nouv,css,annexePrete,ouvrirCahier,calcResume,calcGarde,calcOrga,jetons,adrAffaire};
})();

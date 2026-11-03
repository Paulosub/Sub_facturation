/* ═══ PERMIS DE CONSTRUIRE (02.11.2026, bloc 34 ; demande de Paulo : « dans enquête ajouter un module permis de construire ») ═══
   Page du projet (nx-pdom) ▸ groupe Enquête ▸ tuile « Permis de construire » (après « Dossier d'enquête ») ; SG_PMOD, SG_PMOD_G, compteur et
   page pleine branchés dans sg3_plus.js. Le moteur n'a rien de tel : suivi neuf de la procédure d'autorisation, du dépôt au permis d'habiter.
   Données : collection propre « sgpermis » (gardée par les reprises ; serveur du NAS : règle « projet modifiable » des collections rattachées
   par PROJECT_ID, rien à changer), une demande par enregistrement :
     {ID '<projet>:<identifiant unique>' (jamais réutilisé : la base du bureau garde la trace d'un identifiant supprimé et refuserait sa
      recréation), PROJECT_ID, N (numéro d'ordre), LIB (Permis de construire, Demande complémentaire…), PROC 'enquete' | 'dispense' | 'autre',
      AUTORITE, NUM_COMMUNE, NUM_CANTON (n° CAMAC), PARCELLES, FAO (publication), OBJET, REM,
      DATES {depot, enq_d, enq_f, synthese, decision, notif, recours, debut, habiter, peremption} (ISO ; enq_f, recours, peremption : proposées
        si vides), DECISION '' | 'delivre' | 'refuse', RECOURS {etat '' | 'depose' | 'retire' | 'rejete' | 'admis', date, fin, rem},
      VALIDITE (années, 2 par défaut), PROLONG (mois),
      OPPOSITIONS [{id, date, sorte 'opposition' | 'observation', auteur, motifs, suite 'suspens' | 'reponse' | 'levee' | 'retiree' | 'maintenue', rem}],
      CONDITIONS [{id, num, source, texte, quand 'avant' | 'pendant' | 'habiter' | 'autre', resp, etat 'regler' | 'cours' | 'reglee', le, rem}],
      MODIFIE, PAR}.
   Écran : bandeau jaune (demande, autorité, numéros), choix de la demande (+ Nouvelle demande), chiffres (état, enquête publique,
   oppositions, conditions à régler, validité du permis), frise de la procédure, fiche de la demande, oppositions et observations, conditions et
   charges du permis (« Coller une liste… » avec aperçu : une condition par élément numéroté — 1. / 1.1 / a) / tiret, les sous-éléments
   numérotés 1a, 1b… —, sinon par paragraphe), documents du permis (dossier « Projet/33 …/Autorisations » du dépôt, comme le module Projet).
   Dates proposées si non saisies (indicatives, à vérifier sur l'avis d'enquête et sur le permis) : fin de l'enquête = début + 29 j ; fin du
   délai de recours = 30 jours dès la notification (sinon la décision), féries non comptées (Pâques ± 7 j, 15.07–15.08, 18.12–02.01) et
   report au premier jour ouvrable (samedi, dimanche, fériés vaudois) ; péremption = décision (après un recours rejeté ou retiré : décision
   sur recours) + validité + prolongation ; aucune pendant un recours ni après un recours admis. Une fin de délai de recours seulement
   proposée et passée donne « Délai de recours échu ? » : la saisir (bouton « reprendre ») pour « Permis en force ». Dates prévues : jalons du
   planning du projet / du chantier.
   Imprimer : fiche, procédure, oppositions et conditions (sgImprimer → papier des contrats).
   Droits : lecture = qui voit le projet ; écriture = projet modifiable (administrateur, « projets modifiables : tous », ou « ses projets »
   pour un projet attribué) ; documents : droits du dépôt (« documents : dépôt »). Les fenêtres restent ouvertes si l'enregistrement échoue.
   Débogage : window.SGPC. Styles <style id="sgpc-css">, classes sgpc-*. */
(function(){
if(typeof VIEWS!=='object'||!VIEWS['nx-pdom']) return;

const T='sgpermis';
const PROC={enquete:'Permis de construire avec enquête publique',dispense:'Dispense d’enquête publique (travaux de minime importance)',autre:'Autre autorisation'};
const SORTE={opposition:'Opposition',observation:'Observation'};
const SUITE={suspens:'En suspens',reponse:'Réponse envoyée',levee:'Levée',retiree:'Retirée',maintenue:'Maintenue'};
const SUITE_CL={suspens:'att',reponse:'att',levee:'ok',retiree:'ok',maintenue:'err'};
const QUAND={avant:'Avant le début des travaux',pendant:'Pendant les travaux',habiter:'Avant le permis d’habiter',autre:'Autre'};
const QUAND_C={avant:'Avant travaux',pendant:'Pendant',habiter:'Avant permis d’habiter',autre:'Autre'};
const ETAT_C={regler:'À régler',cours:'En cours',reglee:'Réglée'};
const ETAT_CL={regler:'err',cours:'att',reglee:'ok'};
const RECOURS={'':'Aucun recours',depose:'Recours déposé',retire:'Recours retiré',rejete:'Recours rejeté',admis:'Recours admis'};
const SOURCES=['Municipalité','Synthèse CAMAC','DGE (environnement)','DGIP (patrimoine)','DGMR (mobilité et routes)','ECA (incendie)','Service des eaux','Police du feu','Voirie'];
/* étapes de la procédure : clé de DATES, libellé, procédures où elle figure */
const ETAPES=[['depot','Dépôt de la demande','*'],['enq_d','Début de l’enquête publique','enquete'],['enq_f','Fin de l’enquête publique','enquete'],
  ['synthese','Synthèse cantonale (CAMAC)','enquete autre'],['decision','Décision','*'],['notif','Notification','*'],['recours','Fin du délai de recours','*'],
  ['debut','Début des travaux','*'],['habiter','Permis d’habiter / d’utiliser','*']];
const CLES_DATES=['depot','enq_d','enq_f','synthese','decision','notif','recours','debut','habiter','peremption'];

const CSS=`
.sgpc-box{flex:1 1 auto;min-height:0;overflow:auto}
.sgpc{container:sgpc/inline-size;padding:16px 24px 28px;box-sizing:border-box}
.sgpc .sgfh-tete{margin:0}
.sgpc-hact{display:flex;gap:8px;flex-wrap:wrap;margin-left:auto}
.sgpc-dem{display:flex;align-items:baseline;gap:4px 16px;flex-wrap:wrap;padding:10px 0 0}
.sgpc-dem .lb{font-size:11px;font-weight:700;color:var(--s-gris)}
.sgpc-dem button{border:0;background:none;padding:2px 0 3px;font:inherit;font-size:12.5px;color:var(--s-gris);cursor:pointer;white-space:nowrap}
.sgpc-dem button:hover{color:var(--s-noir)}
.sgpc-dem button.on{color:var(--s-noir);font-weight:700;box-shadow:inset 0 -2px 0 var(--s-nuit)}
.sgpc-kp{display:grid;grid-template-columns:repeat(var(--n,5),minmax(0,1fr));margin:14px 0 22px}
@container sgpc (max-width:900px){.sgpc .sgpc-kp{grid-template-columns:repeat(2,minmax(0,1fr))}}
.sgpc-kp .nx-kpi .s{white-space:normal}
.sgpc-kp .nx-kpi{min-width:0}.sgpc-kp .nx-kpi .v{overflow:hidden;text-overflow:ellipsis}
.sgpc-kp .nx-kpi .v.txt{white-space:normal;font-size:20px;line-height:1.2}
.sgpc-kp .nx-kpi.al .v,.sgpc-kp .nx-kpi.al .s b{color:var(--s-rouge)}
.sgpc-sec{border-top:2px solid var(--s-noir);margin:0 0 26px}
.sgpc-sh{display:flex;align-items:center;gap:8px 16px;flex-wrap:wrap;padding:9px 0 10px}
.sgpc-sh h3{margin:0;font-size:15px;font-weight:700;color:var(--s-noir)}
.sgpc-sh .nb{font-size:12px;color:var(--s-gris)}
.sgpc-sh .dr{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.sgpc-fil{display:inline-flex;gap:2px 14px}
.sgpc-fil button{border:0;background:none;padding:2px 0 3px;font:inherit;font-size:12.5px;color:var(--s-gris);cursor:pointer}
.sgpc-fil button.on{color:var(--s-noir);font-weight:700;box-shadow:inset 0 -2px 0 var(--s-nuit)}
.sgpc-frise{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));position:relative;padding:4px 0 6px}
.sgpc-frise:before{content:'';position:absolute;left:6px;right:6px;top:10px;border-top:2px solid #d6d6d6}
.sgpc-et{position:relative;padding:0 10px 0 0;cursor:default;min-width:0}
.sgpc-et.ed{cursor:pointer}
.sgpc-et.ed:hover .lb{color:var(--s-noir)}
.sgpc-et i{display:block;width:12px;height:12px;box-sizing:border-box;border:2px solid var(--s-gris);background:#fff;position:relative;margin:4px 0 9px}
.sgpc-et.fait i{background:var(--s-nuit);border-color:var(--s-nuit)}
.sgpc-et.fait.prop i{background:var(--s-gris);border-color:var(--s-gris)}
.sgpc-et.cour i{background:var(--s-jaune);border-color:var(--s-noir)}
.sgpc-et.err i{background:var(--s-rouge);border-color:var(--s-rouge)}
.sgpc-et .lb{font-size:11px;font-weight:700;color:var(--s-gris);line-height:1.3;hyphens:auto}
.sgpc-et .dt{font-size:14px;color:var(--s-noir);margin-top:3px;font-variant-numeric:tabular-nums}
.sgpc-et .dt.prop{color:var(--s-gris);font-style:italic}
.sgpc-et .sm{font-size:11px;color:var(--s-gris);margin-top:2px;line-height:1.3}
.sgpc-et.err .dt,.sgpc-et .sm.err{color:var(--s-rouge)}
@container sgpc (max-width:900px){.sgpc-frise{grid-template-columns:1fr;gap:10px}.sgpc-frise:before{left:5px;right:auto;top:6px;bottom:6px;border-top:0;border-left:2px solid #d6d6d6}
  .sgpc-et{display:grid;grid-template-columns:24px 1fr;column-gap:8px}.sgpc-et i{grid-row:1/4;margin:2px 0 0}}
.sgpc-leg{margin:8px 0 0;font-size:11.5px;color:var(--s-gris);display:flex;gap:4px 18px;flex-wrap:wrap;align-items:center}
.sgpc-leg i{display:inline-block;width:10px;height:10px;box-sizing:border-box;border:2px solid var(--s-gris);vertical-align:-1px;margin-right:6px;background:#fff}
.sgpc-leg i.sgpc-lf{background:var(--s-nuit);border-color:var(--s-nuit)}.sgpc-leg i.sgpc-lp{background:var(--s-gris)}.sgpc-leg i.sgpc-lc{background:var(--s-jaune);border-color:var(--s-noir)}
.sgpc-leg .al{color:var(--s-rouge)}
.sgpc-fiche{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 24px;font-size:13px}
@container sgpc (max-width:900px){.sgpc-fiche{grid-template-columns:1fr 1fr}}
.sgpc-fiche div{min-width:0}
.sgpc-fiche .w{grid-column:1/-1}
.sgpc-fiche b{display:block;font-size:11px;color:var(--s-gris);margin-bottom:2px}
.sgpc-fiche span{white-space:pre-wrap;overflow-wrap:anywhere}
.sgpc-fiche .vide{color:var(--s-gris)}
.sgpc .nx-tbl tr[data-i]{cursor:pointer}
.sgpc .nx-tbl td.tx{white-space:pre-wrap;overflow-wrap:anywhere;min-width:220px}
.sgpc-st{white-space:nowrap}
.sgpc-st:before{content:'';display:inline-block;width:8px;height:8px;margin-right:6px;background:var(--s-gris)}
.sgpc-st.ok:before{background:#98C21F}.sgpc-st.att:before{background:#D7860D}.sgpc-st.err:before{background:var(--s-rouge)}
.sgpc-vide{padding:6px 0 4px;font-size:13px;color:var(--s-gris)}
.sgpc-err{padding:20px 24px;color:var(--s-rouge)}
.sgpc-docs .sg-docs-page{padding:0}
.sgpc-dlg{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px 14px;min-width:min(560px,80vw)}
.sgpc-dlg.d2{grid-template-columns:1fr 1fr}
.sgpc-dlg label{display:flex;flex-direction:column;gap:4px;font-size:11px;font-weight:700;color:var(--s-gris);min-width:0}
.sgpc-dlg label.w{grid-column:1/-1}
.sgpc-dlg input:not([type=checkbox]):not([type=radio]),.sgpc-dlg select,.sgpc-dlg textarea{height:34px;border:1.5px solid var(--s-noir);border-radius:0;background:#fff;padding:0 8px;font:inherit;font-size:13px;color:var(--s-noir);box-sizing:border-box;width:100%}
.sgpc-dlg textarea{height:72px;padding:6px 8px;resize:vertical}
.sgpc-dlg textarea.grand{height:180px}
.sgpc-dlg .pr{font-weight:400;font-size:11px;color:var(--s-gris);min-height:14px}
.sgpc-dlg .pr button{border:0;background:none;padding:0;font:inherit;color:var(--s-nuit);text-decoration:underline;cursor:pointer}
.sgpc-dlg .h{grid-column:1/-1;font-size:12px;font-weight:700;color:var(--s-noir);border-top:2px solid var(--s-noir);padding-top:8px;margin-top:4px}
.sgpc-dlg .h:first-child{border-top:0;padding-top:0;margin-top:0}
.sgpc-dlg p{grid-column:1/-1;margin:0;font-size:12px;line-height:1.45;color:var(--s-gris)}
.sgpc-dlg [hidden]{display:none}
.sgpc-ap{grid-column:1/-1;max-height:200px;overflow:auto;border-top:1px solid #d6d6d6;font-size:12px;line-height:1.4}
.sgpc-ap div{display:grid;grid-template-columns:42px 1fr;gap:8px;padding:4px 0;border-bottom:1px solid #ececec}
.sgpc-ap b{color:var(--s-nuit)}
`;
const css=()=>{ if(!document.getElementById('sgpc-css')){ const s=document.createElement('style'); s.id='sgpc-css'; s.textContent=CSS; document.head.appendChild(s); } };

/* ── outils ── */
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=s=>{ const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(s||'')); return m?Math.round(Date.UTC(+m[1],+m[2]-1,+m[3])/864e5):null; };   /* date ISO → numéro de jour */
const ISO=n=>new Date(n*864e5).toISOString().slice(0,10);
const AUJ=()=>J(diso(new Date()));
const dmy=n=>n==null?'—':dfr(ISO(n));
const dow=n=>(new Date(n*864e5).getUTCDay()+6)%7;   /* 0 = lundi */
const plusMois=(n,mo)=>{ const x=new Date(n*864e5), y=x.getUTCFullYear(), m=x.getUTCMonth()+mo, d=x.getUTCDate(), dern=new Date(Date.UTC(y,m+1,0)).getUTCDate();
  return Math.round(Date.UTC(y,m,Math.min(d,dern))/864e5); };
const nouvId=()=>Math.random().toString(36).slice(2,10)+Math.random().toString(36).slice(2,6);
const ver=id=>{ try{ return ((DS.S&&DS.S[T])||{})[String(id)]||0; }catch(_){ return 0; } };
const moi=()=>{ try{ return typeof ME==='object'&&ME&&ME.id?String(ME.id):''; }catch(_){ return ''; } };
const dire=(m,err)=>{ if(typeof toast==='function') toast(m,err); };
const confirmer=(m,f,o)=>{ if(typeof sgConfirm==='function') sgConfirm(m,f,o); else if(typeof confirmDlg==='function') confirmDlg(m,o&&o.yesText).then(r=>{ if(r) f(); }); };
const peut=p=>{ try{ return !!(sgAdmin()||sgDroit('projets_modifier','tous')||(sgDroit('projets_modifier','siens')&&sgMesProjets().has(String(p.ID)))); }catch(_){ return false; } };
const pl=(n,s,s2)=>n+' '+(n>1?(s2||s+'s'):s);
const jourLoc=iso=>{ try{ return iso?diso(new Date(iso)):''; }catch(_){ return ''; } };
const numN=r=>{ const n=+r.N; return Number.isInteger(n)&&n>0?n:0; };
const libDe=r=>String(r.LIB||'').trim()||'Demande '+(numN(r)||'');
const demandes=pid=>DS.all(T).filter(r=>r&&typeof r.ID==='string'&&String(r.PROJECT_ID)===String(pid)).sort((a,b)=>numN(a)-numN(b)||a.ID.localeCompare(b.ID));
const etapesDe=r=>ETAPES.filter(([,,pr])=>pr==='*'||pr.split(' ').includes(r.PROC||'enquete'));
const avecEnquete=r=>(r.PROC||'enquete')==='enquete';
const commence=r=>{ const D=r.DATES||{}, a=AUJ(), d=J(D.debut), h=J(D.habiter); return (d!=null&&d<=a)||(h!=null&&h<=a); };   /* travaux commencés (le permis d'habiter le suppose) */
const prochainNum=L=>L.reduce((m,x)=>Math.max(m,parseInt(x.num,10)||0),0)+1;

/* jours fériés vaudois (table des fériés du bureau si elle est chargée, sinon liste vaudoise) et féries des délais de recours */
function paques(y){ const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,
  i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1; return Math.round(Date.UTC(y,mo-1,da)/864e5); }
const FER={};
function feries(y){ if(FER[y]) return FER[y]; const s=new Set();
  try{ if(typeof pubHolidays==='function') pubHolidays(y).forEach((_,iso)=>{ const n=J(iso); if(n!=null) s.add(n); }); }catch(_){}
  if(!s.size){ const P=paques(y), j=(m,d)=>Math.round(Date.UTC(y,m-1,d)/864e5), sep1=j(9,1), dim3=sep1+((6-dow(sep1)+7)%7)+14;
    [j(1,1),j(1,2),P-2,P+1,P+39,P+50,j(8,1),dim3+1,j(12,25)].forEach(n=>s.add(n)); }
  return (FER[y]=s); }
const anDe=n=>new Date(n*864e5).getUTCFullYear();
const ouvrable=n=>dow(n)<5&&!feries(anDe(n)).has(n);
function suspendu(n){ const y=anDe(n), P=paques(y), j=(m,d)=>Math.round(Date.UTC(y,m-1,d)/864e5);
  return (n>=P-7&&n<=P+7)||(n>=j(7,15)&&n<=j(8,15))||n>=j(12,18)||n<=j(1,2); }
function finDelai(n0,jours){ let n=n0, k=0; while(k<jours){ n++; if(!suspendu(n)) k++; } while(!ouvrable(n)) n++; return n; }

/* commune et parcelle du projet : analyse de la parcelle (Faisabilité) si elle existe, sinon lieu de l'affaire */
function parcelle(p){ const f=DS.get('sgfaisa',String(p.ID)), P=f&&f.PARCELLE||{};
  return {commune:String(P.COMMUNE||p.LOCATION||'').trim(),numero:String(P.NUMERO||'').trim()}; }
function neuve(p,id,n){ const pc=parcelle(p);
  return {ID:id,PROJECT_ID:p.ID,N:n,LIB:n===1?'Permis de construire':'Demande complémentaire '+(n-1),PROC:'enquete',
    AUTORITE:pc.commune?'Municipalité de '+pc.commune:'',NUM_COMMUNE:'',NUM_CANTON:'',PARCELLES:pc.numero?'Parcelle n° '+pc.numero:'',FAO:'',OBJET:'',REM:'',
    DATES:{},DECISION:'',RECOURS:{etat:''},VALIDITE:2,PROLONG:0,OPPOSITIONS:[],CONDITIONS:[]}; }

/* recours qui vise la décision actuelle ; '' si aucun, ou s'il visait une décision précédente (décision actuelle postérieure à la décision sur
   recours, sinon au dépôt du recours : nouvelle décision après un recours admis) */
function recEff(r){ const rc=r.RECOURS||{}, e=rc.etat||'', dc=J((r.DATES||{}).decision), ref=J(rc.fin)??J(rc.date); return e&&!(dc!=null&&ref!=null&&(e==='admis'?dc>=ref:dc>ref))?e:''; }
/* dates proposées (si la date n'est pas saisie) : indicatives, à vérifier sur l'avis d'enquête et sur le permis */
function proposees(r){ const D=r.DATES||{}, o={}, ed=J(D.enq_d), nt=J(D.notif), dc=J(D.decision), base=nt??dc, rc=Object.assign({},r.RECOURS||{},{etat:recEff(r)});
  if(ed!=null&&avecEnquete(r)) o.enq_f={n:ed+29,pq:'30 jours dès le début de l’enquête (à vérifier sur l’avis d’enquête)'};
  if(base!=null&&r.DECISION) o.recours={n:finDelai(base,30),pq:'30 jours dès la '+(nt!=null?'notification':'décision (date de notification inconnue)')
    +', sans les féries (Pâques ± 7 jours, 15 juillet au 15 août, 18 décembre au 2 janvier), reporté au premier jour ouvrable (à vérifier sur le permis)'};
  const sansFin=(rc.etat==='rejete'||rc.etat==='retire')&&J(rc.fin)==null;   /* recours rejeté / retiré sans date de la décision sur recours : pas de validité devinée */
  if(dc!=null&&r.DECISION==='delivre'&&rc.etat!=='admis'&&rc.etat!=='depose'&&!sansFin){ const ans=+r.VALIDITE>0?+r.VALIDITE:2, mo=+r.PROLONG>0?+r.PROLONG:0, fr=J(rc.fin), dep=rc.etat&&fr!=null?fr:dc;
    o.peremption={n:plusMois(dep,ans*12+mo)-1,pq:ans+' an'+(ans>1?'s':'')+(mo?' et '+mo+' mois de prolongation':'')+' dès '+(dep===dc?'la décision':'la décision sur recours')
      +', si les travaux n’ont pas commencé (à vérifier sur le permis)'}; }
  return o; }
const dateDe=(r,k)=>{ const s=J((r.DATES||{})[k]); if(s!=null) return {n:s,saisie:true}; const p=proposees(r)[k]; return p?{n:p.n,prop:true,pq:p.pq}:null; };

/* dates prévues au planning du projet / du chantier (jalons) */
function prevues(p){ const o={}, L=[].concat(((DS.get('sgplanning',p.ID+':projet')||{}).LIGNES)||[],((DS.get('sgplanning',p.ID+':chantier')||{}).LIGNES)||[]);
  const pr=(k,re)=>{ const l=L.find(x=>x&&x.t==='jalon'&&re.test(String(x.lib||''))&&J(x.d)!=null); if(l&&o[k]==null) o[k]=J(l.d); };
  pr('depot',/d[ée]p[ôo]t\b.*(demande|permis|autorisation)/i); pr('decision',/^permis de construire|permis.*(d[ée]livr|obtenu|accord)/i);
  pr('debut',/d[ée]but des travaux/i); pr('habiter',/permis d.(habiter|utiliser)/i); return o; }

/* état de la demande, d'après les dates : {lib, cl ('' | 'ok' | 'att' | 'err'), k (étape en cours)} */
function etat(r){ const D=r.DATES||{}, auj=AUJ(), d=k=>J(D[k]), rc=recEff(r), pro=proposees(r);
  const fe=d('enq_f')??(pro.enq_f&&pro.enq_f.n), frS=d('recours'), fr=frS??(pro.recours&&pro.recours.n), pe=d('peremption')??(pro.peremption&&pro.peremption.n);
  if(d('habiter')!=null&&d('habiter')<=auj) return {lib:'Permis d’habiter délivré',cl:'ok',k:''};
  const deb=commence(r);
  if(r.DECISION==='refuse'){
    if(rc==='depose') return {lib:'Recours contre le refus en cours',cl:'att',k:'recours'};
    if(rc==='admis') return {lib:'Refus annulé par le recours : nouvelle décision attendue',cl:'att',k:'decision'};
    if(!rc&&fr!=null&&fr>=auj) return {lib:'Permis refusé · délai de recours',cl:'err',k:'recours'};
    return {lib:'Permis refusé',cl:'err',k:''}; }
  if(r.DECISION==='delivre'){
    if(rc==='admis') return {lib:'Recours admis : permis annulé',cl:'err',k:''};
    if(deb) return pe!=null&&d('debut')!=null&&d('debut')>pe?{lib:'Travaux commencés après la fin de validité ?',cl:'err',k:'habiter'}:{lib:'Travaux commencés',cl:'ok',k:'habiter'};
    if(rc==='depose') return {lib:'Recours en cours',cl:'att',k:'recours'};
    if(pe!=null&&pe<auj) return {lib:'Permis périmé ?',cl:'err',k:'debut'};
    if((rc==='rejete'||rc==='retire')&&J((r.RECOURS||{}).fin)==null&&d('peremption')==null) return {lib:'Permis en force ? (date de la décision sur recours à saisir)',cl:'att',k:'recours'};
    if(!rc&&fr!=null&&fr>=auj) return {lib:'Délai de recours',cl:'att',k:'recours'};
    if(!rc&&frS==null) return {lib:'Délai de recours échu ? (à vérifier)',cl:'att',k:'recours'};
    return {lib:'Permis en force',cl:'ok',k:'debut'}; }
  if(deb) return {lib:'Travaux commencés',cl:'ok',k:'habiter'};
  if(avecEnquete(r)&&d('enq_d')!=null){ if(d('enq_d')>auj) return {lib:'Enquête annoncée',cl:'att',k:'enq_d'};
    if(fe==null||fe>=auj) return {lib:'Enquête publique en cours',cl:'att',k:'enq_f'};
    return {lib:'En attente de la décision',cl:'att',k:'decision'}; }
  if(d('depot')!=null&&d('depot')<=auj) return {lib:avecEnquete(r)?'Demande déposée':'En attente de la décision',cl:'att',k:avecEnquete(r)?'enq_d':'decision'};
  return {lib:'En préparation',cl:'',k:'depot'}; }

/* ── page ── */
const ETAT={};   /* par projet : demande choisie (sel), identifiant de la demande neuve, filtre des conditions, défilement */
function ouvrir(C,p){ css(); const k=String(p.ID), u=ETAT[k]||(ETAT[k]={sel:null,idNeuf:null,filtre:'regler',st:0}); u.pid=k; u.p=p;
  const box=document.createElement('div'); box.className='sgpc-box'; box.innerHTML='<div class="sgpc" style="color:var(--s-gris)">Chargement du permis de construire…</div>'; C.append(box); u.box=box;
  box.addEventListener('scroll',()=>{ if(u.box===box&&u.ecoute) u.st=box.scrollTop; },{passive:true});
  const besoin=[T,'sgfaisa','sgplanning','projectmember','depotfichier','projectphase','projectsubphase','publicholiday'];
  Promise.resolve().then(()=>DS.need?DS.need(besoin):null).catch(()=>null).then(()=>{ if(u.box!==box||!box.isConnected) return; dessiner(u); }); }
function dessiner(u){ const box=u.box; if(!box||!box.isConnected) return;
  try{ dessiner0(u); }
  catch(e){ console.error(e); box.innerHTML='<p class="sgpc-err">Permis de construire : erreur — '+E(e&&e.message||e)+'</p>'; } }
function dessiner0(u){ const box=u.box, p=DS.get('project',u.pid)||u.p; u.p=p; u.peut=peut(p); u.ecoute=false;
  const Ls=demandes(u.pid); if(!u.sel||!Ls.some(r=>r.ID===u.sel)) u.sel=Ls.length?Ls[Ls.length-1].ID:null;
  if(!u.idNeuf||DS.get(T,u.idNeuf)) u.idNeuf=u.pid+':'+nouvId();
  const r=Ls.find(x=>x.ID===u.sel)||neuve(p,u.idNeuf,1); u.r=r; u.neuf=!Ls.some(x=>x.ID===r.ID);
  const mo=typeof projMO==='function'?projMO(p):'', et=etat(r);
  const meta=[r.AUTORITE,r.NUM_COMMUNE?'Dossier n° '+r.NUM_COMMUNE:'',r.NUM_CANTON?'CAMAC n° '+r.NUM_CANTON:'',mo?'Maître de l’ouvrage : '+mo:'',
    !u.neuf&&r.MODIFIE?'modifié le '+dfr(jourLoc(r.MODIFIE)):''].filter(Boolean).join(' · ');
  let html='<div class="sgpc"><div class="sgfh-tete"><div class="sgfh-id"><div class="sgfh-ini">'+E(p.NUMBER||'')+'</div><div class="sgfh-nm"><div class="lb">'+E(libDe(r)+' · '+et.lib)+'</div><h2>'+E(p.TITLE||p.NUMBER||'')+'</h2>'
    +'<div class="sgfh-meta">'+E(meta||PROC[r.PROC]||'')+'</div></div></div>'
    +'<div class="sgpc-hact">'+(u.peut?'<button class="nx-btn" data-a="fiche" title="Intitulé, procédure, autorité, numéros, parcelle, objet de la demande">'+nxSvg('edit')+'Modifier la demande</button>'
      +'<button class="nx-btn" data-a="dates" title="Dates de la procédure, décision, recours et validité du permis">'+nxSvg('cal')+'Dates et décision</button>':'')
    +(!u.neuf?'<button class="nx-btn" data-a="imprimer" title="Imprimer la fiche, la procédure, les oppositions et les conditions">'+nxSvg('print')+'Imprimer</button>':'')+'</div></div>';
  if(Ls.length>1||(u.peut&&Ls.length)) html+='<div class="sgpc-dem" role="group" aria-label="Demande"><span class="lb">Demande</span>'
    +Ls.map(x=>'<button data-id="'+E(x.ID)+'" class="'+(x.ID===u.sel?'on':'')+'" aria-pressed="'+(x.ID===u.sel)+'">'+E(libDe(x))+'</button>').join('')
    +(u.peut?'<button data-a="nouvelle" title="Demande complémentaire, modification du projet en cours de travaux…">+ Nouvelle demande</button>':'')+'</div>';
  if(u.neuf&&!u.peut){ html+='<div class="sgpc-sec" style="margin-top:18px"><p class="sgpc-vide" style="padding-top:12px">Aucune demande de permis enregistrée pour ce projet.</p></div>'+docs0()+'</div>'; box.innerHTML=html; brancher(u); return; }
  html+=chiffres(u,r,et)+frise(u,r,et)+fiche(u,r);
  if(avecEnquete(r)||(r.OPPOSITIONS||[]).length) html+=oppositions(u,r);
  html+=conditions(u,r)+docs0()+'</div>';
  box.innerHTML=html; brancher(u); }

function chiffres(u,r,et){ const D=r.DATES||{}, auj=AUJ(), rc=recEff(r), kpi=(l,v,s,o)=>'<div class="nx-kpi'+(o&&o.al?' al':'')+'"'+(o&&o.ti?' title="'+E(o.ti)+'"':'')+'><div class="l">'+E(l)+'</div><div class="v'+(o&&o.cl?' '+o.cl:'')+'">'+v+'</div>'+(s?'<div class="s">'+s+'</div>':'')+'</div>';
  const out=[kpi('État',E(et.lib),E(PROC[r.PROC]||''),{cl:'txt',al:et.cl==='err'})];
  if(!avecEnquete(r)) out.push(kpi('Enquête publique','—',r.PROC==='dispense'?'dispense d’enquête':'sans enquête publique'));
  else { const a=J(D.enq_d), f=dateDe(r,'enq_f'), fn=f&&f.n;
    const an=n=>dmy(n).slice(6), ans=fn!=null&&an(fn)!==an(a)?an(a)+'–'+an(fn):an(a);   /* jours et mois en grand, année(s) dessous : la tuile reste lisible */
    out.push(a==null?kpi('Enquête publique','—','pas encore publiée'):kpi('Enquête publique',dmy(a).slice(0,5)+' → '+(fn!=null?dmy(fn).slice(0,5):'?'),
      ans+' · '+(a>auj?'commence dans '+pl(a-auj,'jour'):fn!=null&&fn>=auj?'en cours · '+pl(fn-auj+1,'jour')+' restant'+(fn-auj+1>1?'s':''):'terminée')+(f&&f.prop?' · fin proposée':''),{cl:'txt',ti:f&&f.prop?'Fin proposée : '+f.pq:''})); }
  const O=r.OPPOSITIONS||[];
  if(avecEnquete(r)||O.length){ const op=O.filter(x=>x.sorte!=='observation'), ob=O.length-op.length, su=op.filter(x=>['suspens','reponse','maintenue'].includes(x.suite||'suspens')).length;
    out.push(kpi('Oppositions',String(op.length),(op.length?(su?'<b>'+su+' en suspens</b>':'toutes réglées'):'aucune')+(ob?' · '+pl(ob,'observation'):''))); }
  const deb=J(D.debut), comm=commence(r), annule=rc==='admis'&&r.DECISION==='delivre';
  const C=r.CONDITIONS||[], ar=C.filter(x=>(x.etat||'regler')!=='reglee'), av=ar.filter(x=>x.quand==='avant').length;
  out.push(kpi('Conditions à régler',String(ar.length),C.length?'sur '+C.length+(av?' · <b>'+av+' avant le début des travaux</b>':''):'aucune condition saisie',{al:av>0&&!comm&&r.DECISION==='delivre'&&!annule}));
  const pe=dateDe(r,'peremption');
  if(r.DECISION==='refuse') out.push(kpi('Validité du permis','—',rc==='admis'?'refus annulé : nouvelle décision attendue':'permis refusé'));
  else if(annule) out.push(kpi('Validité du permis','—','permis annulé par le recours'));
  else if(comm){ const tard=pe&&deb!=null&&deb>pe.n;
    out.push(kpi('Validité du permis','—',deb==null?'permis d’habiter délivré':tard?'<b>travaux commencés le '+dmy(deb)+', après le '+dmy(pe.n)+'</b>':'travaux commencés le '+dmy(deb),{al:tard})); }
  else if(r.DECISION==='delivre'&&rc==='depose') out.push(kpi('Validité du permis','—','en suspens pendant le recours'+(pe&&pe.saisie?' (date saisie : '+dmy(pe.n)+')':'')));
  else if(r.DECISION==='delivre'&&(rc==='rejete'||rc==='retire')&&!pe) out.push(kpi('Validité du permis','—','<b>date de la décision sur recours à saisir</b>',{al:false}));
  else if(pe){ const reste=pe.n-auj, tard=deb!=null&&deb>pe.n;
    out.push(kpi('Validité du permis',dmy(pe.n),reste<0?'<b>délai dépassé</b>':tard?'<b>début des travaux prévu le '+dmy(deb)+', après cette date</b>':pl(reste,'jour')+' restant'+(reste>1?'s':'')+' pour commencer'+(deb!=null?' · début prévu le '+dmy(deb):''),
      {cl:'dt',al:reste<90||tard,ti:pe.prop?'Proposée : '+pe.pq:'Date saisie'})); }
  else out.push(kpi('Validité du permis','—','dès la décision'));
  return '<div class="nx-kpis sgpc-kp" style="--n:'+Math.min(out.length,5)+'">'+out.join('')+'</div>'; }

function frise(u,r,et){ const L=etapesDe(r), auj=AUJ(), pv=prevues(u.p), rc=recEff(r), rcx=r.RECOURS||{}, iCour=L.findIndex(([k])=>k===et.k);
  const dateK=k=>k==='decision'&&!r.DECISION?null:dateDe(r,k);   /* décision « en attente » : sa date n'est qu'une prévision */
  let dern=-1; L.forEach(([k],i)=>{ const x=dateK(k); if(x&&x.n<=auj) dern=i; });
  const lim=iCour>=0?iCour:dern;   /* étapes sans date avant l'étape en cours (état final : avant la dernière étape passée) = passées */
  const lib=k=>{ if(k==='decision') return r.DECISION==='refuse'?'Décision : permis refusé':r.DECISION==='delivre'?'Décision : permis délivré':'Décision'; if(k==='recours'&&rc) return RECOURS[rc]; return (ETAPES.find(x=>x[0]===k)||[])[1]||k; };
  let avecProp=false;
  const cases=L.map(([k],i)=>{ const jugeR=k==='recours'&&!!rc&&rc!=='depose', fR=jugeR?J(rcx.fin):null, cour=i===iCour;
    const x=jugeR?(fR!=null?{n:fR,saisie:true}:null):k==='decision'&&!r.DECISION?dateDe(r,k):dateK(k);
    let fait=!cour&&(x?x.n<=auj&&(x.saisie||i<lim)&&!(k==='decision'&&!r.DECISION):(i<lim||jugeR));
    if(k==='recours'&&rc==='depose') fait=false;
    const passe=fait&&!(x&&x.saisie), err=!cour&&((k==='decision'&&r.DECISION==='refuse'&&rc!=='admis')||(k==='recours'&&rc==='admis'&&r.DECISION==='delivre'));
    if(passe) avecProp=true;
    let dt='', sm='';
    if(x) dt='<div class="dt'+(x.prop?' prop':'')+'"'+(x.prop?' title="'+E('Proposée : '+x.pq)+'"':'')+'>'+dmy(x.n)+'</div>'
      +(jugeR?'<div class="sm">décision sur recours</div>':x.prop?'<div class="sm">proposée</div>':x.n>auj||(k==='decision'&&!r.DECISION)?'<div class="sm">prévue</div>':'');
    else if(pv[k]!=null&&!fait){ dt='<div class="dt prop" title="Jalon du planning">'+dmy(pv[k])+'</div>'; sm='<div class="sm">prévue au planning</div>'; }
    else dt='<div class="dt prop">—</div>'+(fait?'<div class="sm">date non saisie</div>':'');
    if(k==='recours'&&rc==='depose'){ const rd=J(rcx.date); sm+='<div class="sm err">déposé'+(rd!=null?' le '+dmy(rd):'')+'</div>'; }
    return '<div class="sgpc-et'+(fait?' fait'+(passe?' prop':''):'')+(cour?' cour':'')+(err?' err':'')+(u.peut?' ed':'')+'" data-k="'+k+'"'+(u.peut?' title="Modifier les dates"':'')+'><i></i><div class="lb">'+E(lib(k))+'</div>'+dt+sm+'</div>'; }).join('');
  const pe=dateDe(r,'peremption'), valide=pe&&r.DECISION==='delivre'&&rc!=='admis'&&rc!=='depose'&&!commence(r);
  return '<div class="sgpc-sec"><div class="sgpc-sh"><h3>Procédure</h3><span class="nb">'+E(PROC[r.PROC]||'')+'</span>'
    +(u.peut?'<span class="dr"><button class="nx-btn" data-a="dates">'+nxSvg('cal')+'Dates et décision</button></span>':'')+'</div>'
    +'<div class="sgpc-frise" style="--n:'+L.length+'">'+cases+'</div>'
    +'<div class="sgpc-leg"><span><i class="sgpc-lf"></i>étape faite</span>'+(avecProp?'<span><i class="sgpc-lp"></i>étape passée (date proposée ou non saisie)</span>':'')+'<span><i class="sgpc-lc"></i>étape en cours</span><span><i></i>à venir</span>'
      +'<span>En gris italique : date proposée (délais usuels) ou prévue au planning — à vérifier sur l’avis d’enquête et sur le permis.</span>'
      +(valide?'<span'+(pe.n-auj<90?' class="al"':'')+'>Validité : travaux à commencer avant le '+dmy(pe.n)+(pe.prop?' (proposé)':'')+'.</span>':'')+'</div></div>'; }

function fiche(u,r){ const v=(l,x,w)=>'<div'+(w?' class="w"':'')+'><b>'+E(l)+'</b>'+(String(x||'').trim()?'<span>'+E(x)+'</span>':'<span class="vide">—</span>')+'</div>', rc=r.RECOURS||{};
  return '<div class="sgpc-sec"><div class="sgpc-sh"><h3>Demande</h3>'+(u.peut?'<span class="dr"><button class="nx-btn" data-a="fiche">'+nxSvg('edit')+'Modifier</button></span>':'')+'</div>'
    +'<div class="sgpc-fiche">'+v('Procédure',PROC[r.PROC])+v('Autorité',r.AUTORITE)+v('Parcelle(s)',r.PARCELLES)
      +v('N° de dossier communal',r.NUM_COMMUNE)+v('N° CAMAC (dossier cantonal)',r.NUM_CANTON)+v('Publication (FAO)',r.FAO)
      +v('Objet de la demande',r.OBJET,1)
      +(rc.etat?v('Recours',recoursTexte(r),1):'')
      +(String(r.REM||'').trim()?v('Remarques',r.REM,1):'')+'</div></div>'; }
const recoursTexte=r=>{ const rc=r.RECOURS||{}; if(!rc.etat) return ''; return RECOURS[rc.etat]+(!recEff(r)?' (contre la décision précédente)':r.DECISION==='refuse'?' (contre le refus)':'')+(J(rc.date)!=null?', déposé le '+dmy(J(rc.date)):'')
  +(J(rc.fin)!=null?', décision sur recours du '+dmy(J(rc.fin)):'')+(rc.rem?' — '+rc.rem:''); };

function oppositions(u,r){ const O=r.OPPOSITIONS||[];
  return '<div class="sgpc-sec"><div class="sgpc-sh"><h3>Oppositions et observations</h3><span class="nb">'+(O.length?pl(O.length,'pièce'):'')+'</span>'
    +(u.peut?'<span class="dr"><button class="nx-btn" data-a="opp" title="Opposition ou observation reçue pendant l’enquête publique">'+nxSvg('plus')+'Ajouter</button></span>':'')+'</div>'
    +(O.length?'<table class="nx-tbl"><thead><tr><th>N°</th><th>Reçue le</th><th>Sorte</th><th>Auteur</th><th>Motifs</th><th>Suite</th></tr></thead><tbody>'
      +O.map((x,i)=>'<tr data-i="'+i+'" data-l="opp"'+(u.peut?' title="Modifier"':'')+'><td>'+(i+1)+'</td><td data-tri="'+E(x.date||'')+'">'+(J(x.date)!=null?dmy(J(x.date)):'—')+'</td><td>'+E(SORTE[x.sorte]||SORTE.opposition)+'</td><td>'+E(x.auteur||'')+'</td>'
        +'<td class="tx">'+E(x.motifs||'')+(x.rem?'<br><small style="color:var(--s-gris)">'+E(x.rem)+'</small>':'')+'</td><td><span class="sgpc-st '+(SUITE_CL[x.suite]||'att')+'">'+E(SUITE[x.suite]||SUITE.suspens)+'</span></td></tr>').join('')+'</tbody></table>'
      :'<p class="sgpc-vide">Aucune opposition ni observation saisie.</p>')+'</div>'; }

function conditions(u,r){ const C=(r.CONDITIONS||[]).map((x,i)=>Object.assign({_i:i},x)), f=u.filtre==='toutes'?'toutes':'regler', V=f==='toutes'?C:C.filter(x=>(x.etat||'regler')!=='reglee');
  return '<div class="sgpc-sec"><div class="sgpc-sh"><h3>Conditions et charges du permis</h3>'
    +(C.length?'<span class="sgpc-fil" role="group" aria-label="Filtre"><button data-f="regler" class="'+(f==='regler'?'on':'')+'" aria-pressed="'+(f==='regler')+'">À régler ('+C.filter(x=>(x.etat||'regler')!=='reglee').length+')</button><button data-f="toutes" class="'+(f==='toutes'?'on':'')+'" aria-pressed="'+(f==='toutes')+'">Toutes ('+C.length+')</button></span>':'')
    +(u.peut?'<span class="dr"><button class="nx-btn" data-a="cond">'+nxSvg('plus')+'Ajouter</button><button class="nx-btn" data-a="coller" title="Coller le texte des conditions du permis : une condition par élément numéroté ou par paragraphe">'+nxSvg('list')+'Coller une liste…</button></span>':'')+'</div>'
    +(V.length?'<table class="nx-tbl"><thead><tr><th>N°</th><th>Source</th><th>Condition</th><th>À régler</th><th>Responsable</th><th>État</th></tr></thead><tbody>'
      +V.map(x=>'<tr data-i="'+x._i+'" data-l="cond"'+(u.peut?' title="Modifier"':'')+'><td>'+E(x.num||String(x._i+1))+'</td><td>'+E(x.source||'')+'</td><td class="tx">'+E(x.texte||'')+(x.rem?'<br><small style="color:var(--s-gris)">'+E(x.rem)+'</small>':'')+'</td>'
        +'<td>'+E(QUAND_C[x.quand]||'')+'</td><td>'+E(x.resp||'')+'</td><td><span class="sgpc-st '+(ETAT_CL[x.etat]||'err')+'">'+E(ETAT_C[x.etat]||ETAT_C.regler)+(x.etat==='reglee'&&J(x.le)!=null?' le '+dmy(J(x.le)):'')+'</span></td></tr>').join('')+'</tbody></table>'
      :'<p class="sgpc-vide">'+(C.length?'Toutes les conditions sont réglées.':'Aucune condition saisie. Les conditions et charges figurent dans le permis et dans la synthèse cantonale.')+'</p>')+'</div>'; }

const docs0=()=>'<div class="sgpc-sec"><div class="sgpc-sh"><h3>Documents du permis</h3><span class="nb">Phase 33 ▸ Autorisations</span></div><div class="sgpc-docs"></div></div>';
function docsOpts(p){ const pr=sgDosNfc(p,'Projet');
  return {fil:d=>!!pr&&d.startsWith(pr+'/')&&/^\/33 [^/]+\/Autorisations(\/|$)/.test(d.slice(pr.length)),
    vide:'Aucun document : permis, décision, synthèse cantonale, oppositions et réponses, avis d’enquête…',ajout:'Ajouter des documents du permis (phase 33 ▸ Autorisations)',
    phaseDlg:{titre:'Ajouter des documents du permis',phases:[33],phase:33,rubriques:[['Autorisations','Autorisations']],rubrique:'Autorisations',sansPhase:'',enquete:false}}; }

function brancher(u){ const box=u.box;
  box.querySelectorAll('[data-a]').forEach(b=>b.onclick=e=>{ e.stopPropagation(); const a=b.dataset.a;
    if(a==='fiche') editerFiche(u); else if(a==='dates') editerDates(u); else if(a==='imprimer') imprimer(u);
    else if(a==='nouvelle') nouvelle(u); else if(a==='opp') editerOpp(u,-1); else if(a==='cond') editerCond(u,-1); else if(a==='coller') coller(u); });
  box.querySelectorAll('.sgpc-dem button[data-id]').forEach(b=>b.onclick=()=>{ u.sel=b.dataset.id; u.st=0; dessiner(u); });
  box.querySelectorAll('.sgpc-fil button[data-f]').forEach(b=>b.onclick=()=>{ u.filtre=b.dataset.f; dessiner(u); });
  if(u.peut){ box.querySelectorAll('.sgpc-et.ed').forEach(x=>x.onclick=()=>editerDates(u,x.dataset.k));
    box.querySelectorAll('tr[data-l]').forEach(tr=>tr.onclick=()=>{ if(String(getSelection()||'')) return; tr.dataset.l==='opp'?editerOpp(u,+tr.dataset.i):editerCond(u,+tr.dataset.i); }); }
  /* défilement rétabli une fois la liste des documents dessinée (elle arrive après coup : sinon la page remonte à chaque redessin) */
  let fini=false; const fin=()=>{ if(fini||u.box!==box) return; fini=true; box.scrollTop=u.st||0; u.ecoute=true; };
  const dz=box.querySelector('.sgpc-docs');
  if(dz&&typeof sgDocsModule==='function'&&typeof sgDosNfc==='function'){
    const mo=new MutationObserver(()=>{ if(dz.firstChild){ mo.disconnect(); setTimeout(fin,0); } }); mo.observe(dz,{childList:true});
    setTimeout(()=>{ mo.disconnect(); fin(); },2000);
    try{ sgDocsModule(dz,u.p,docsOpts(u.p)); }catch(e){ console.error(e); mo.disconnect(); fin(); } }
  else fin(); }

/* ── enregistrement : la modification fn(copie) s'applique à la version la plus récente de la base ; renvoie true si enregistré
   (les fenêtres renvoient cette promesse : elles restent ouvertes si l'enregistrement échoue) ;
   o.existait : la demande existait à l'ouverture de la fenêtre (supprimée entre-temps → pas de recréation) ; o.n : numéro d'une demande neuve ;
   o.siOk() : avant le redessin, si l'enregistrement a réussi. Les fenêtres n'écrivent que les champs que l'utilisateur a changés (valeurs lues
   à l'ouverture, « modifs ») : une modification faite entre-temps sur un autre poste n'est pas écrasée, même après un conflit (409) ── */
const modifs=(a,b)=>Object.keys(b).filter(k=>String(a[k]??'')!==String(b[k]??''));
async function sauver(u,id,fn,msg,o){ o=o||{};
  if(!u.peut){ dire('Lecture seule : votre profil ne permet pas de modifier le permis de construire de ce projet.',true); return false; }
  if(u.enCours){ dire('Enregistrement en cours, un instant…'); return false; }
  const r0=DS.get(T,id);
  if(!r0&&o.existait){ dire('Cette demande a été supprimée entre-temps sur un autre poste.',true); dessiner(u); return true; }
  const base=r0?JSON.parse(JSON.stringify(r0)):neuve(u.p,id,o.n||1), rf=fn(base);
  if(rf===false) return false;
  if(rf==='abandon'){ dessiner(u); return true; }   /* rien à enregistrer (élément supprimé entre-temps : message déjà donné) */
  base.ID=id; base.PROJECT_ID=u.p.ID; base.MODIFIE=new Date().toISOString(); base.PAR=moi()||null;
  u.enCours=true; let ok=false;
  try{ await DS.commit([{t:T,id,val:base,bseq:ver(id)}]); ok=true; }
  catch(e){ if(!e||!e.conflict) console.error(e); }   /* message déjà affiché par la base (conflit, droits, serveur) */
  finally{ u.enCours=false; }
  if(ok){ if(o.siOk) o.siOk(); if(msg) dire(msg); }
  dessiner(u); return ok; }

const champ=(body,k)=>body.querySelector('[data-k="'+k+'"]');
/* champ date incomplet (segment vidé) ou année hors 4 chiffres : refusé avec message au lieu d'effacer la date */
function dateInvalide(body){ const i=[...body.querySelectorAll('input[type=date]')].find(i=>!i.closest('[hidden]')&&((i.validity&&i.validity.badInput)||(i.value&&J(i.value)==null)));
  if(i){ dire('Date incomplète ou invalide : corrigez-la ou videz le champ.',true); i.focus(); return true; } return false; }
const opts=(O,v)=>Object.entries(O).map(([k,t])=>'<option value="'+E(k)+'"'+(k===(v||'')?' selected':'')+'>'+E(t)+'</option>').join('');
function boite(cls,html){ const b=document.createElement('div'); b.className='sgpc-dlg'+(cls?' '+cls:''); b.innerHTML=html; return b; }
/* contexte d'une fenêtre : demande visée, figée à l'ouverture */
const cible=u=>({id:u.r.ID,existait:!u.neuf,n:numN(u.r)||1});

function editerFiche(u){ if(!u.peut) return; const r=u.r, c=cible(u), id=c.id;
  const body=boite('d2','<label class="w">Intitulé<input data-k="LIB" maxlength="120" value="'+E(r.LIB||'')+'" placeholder="Permis de construire, Demande complémentaire…"></label>'
    +'<label class="w">Procédure<select data-k="PROC">'+opts(PROC,r.PROC||'enquete')+'</select></label>'
    +'<label class="w">Autorité<input data-k="AUTORITE" maxlength="160" value="'+E(r.AUTORITE||'')+'" placeholder="Municipalité de …"></label>'
    +'<label>N° de dossier communal<input data-k="NUM_COMMUNE" maxlength="60" value="'+E(r.NUM_COMMUNE||'')+'"></label>'
    +'<label>N° CAMAC (dossier cantonal)<input data-k="NUM_CANTON" maxlength="60" value="'+E(r.NUM_CANTON||'')+'"></label>'
    +'<label>Parcelle(s)<input data-k="PARCELLES" maxlength="160" value="'+E(r.PARCELLES||'')+'"></label>'
    +'<label>Publication (FAO)<input data-k="FAO" maxlength="160" value="'+E(r.FAO||'')+'" placeholder="N° et date de parution"></label>'
    +'<label class="w">Objet de la demande<textarea data-k="OBJET" maxlength="2000" placeholder="Texte de l’avis d’enquête : transformation, agrandissement…">'+E(r.OBJET||'')+'</textarea></label>'
    +'<label class="w">Remarques<textarea data-k="REM" maxlength="2000">'+E(r.REM||'')+'</textarea></label>'
    +'<p>Changer de procédure ne supprime aucune date : celles des étapes absentes de la nouvelle procédure sont gardées.</p>');
  const boutons=[]; let D=null;
  if(c.existait) boutons.push({t:'Supprimer la demande',fn:()=>{ supprimerDemande(u,id,()=>{ if(D) D.close(); }); return false; }});   /* fenêtre gardée si la suppression est annulée */
  const CH=['LIB','PROC','AUTORITE','NUM_COMMUNE','NUM_CANTON','PARCELLES','FAO','OBJET','REM'], v0={}; CH.forEach(k=>v0[k]=String(champ(body,k).value||'').trim());
  boutons.push({t:'Annuler'},{t:'OK',pri:true,fn:()=>{ const v={}; CH.forEach(k=>v[k]=String(champ(body,k).value||'').trim());
    if(!v.LIB){ dire('Donnez un intitulé à la demande.',true); champ(body,'LIB').focus(); return false; }
    const M=c.existait?modifs(v0,v):CH; if(!M.length) return true;
    return sauver(u,id,x=>{ M.forEach(k=>{ x[k]=v[k]; }); },c.existait?null:'Demande de permis enregistrée.',{existait:c.existait,n:c.n,siOk:()=>{ u.sel=id; }}); }});
  D=dialog({title:c.existait?'Modifier la demande':'Demande de permis de construire',width:'600px',body,buttons:boutons}); }

function supprimerDemande(u,id,apres){ const r0=DS.get(T,id); if(!r0) return;
  const O=(r0.OPPOSITIONS||[]).length, C=(r0.CONDITIONS||[]).length;
  confirmer('Supprimer la demande « '+libDe(r0)+' » ?'+(O||C?'\n\nSes '+[O?pl(O,'opposition ou observation','oppositions et observations'):'',C?pl(C,'condition'):''].filter(Boolean).join(' et ')+' seront supprimées.':'')
      +'\n\nLes documents du permis restent dans le dossier du projet. Suppression définitive.',
    async()=>{ if(u.enCours){ dire('Enregistrement en cours, un instant…'); return; } u.enCours=true; let ok=false;
      try{ await DS.commit([{t:T,id,val:null,bseq:ver(id)}]); ok=true; }catch(e){ if(!e||!e.conflict) console.error(e); }
      finally{ u.enCours=false; }
      if(ok){ dire('Demande supprimée.'); if(u.sel===id) u.sel=null; if(apres) apres(); } dessiner(u); },{title:'Supprimer la demande',yesText:'Supprimer'}); }

function nouvelle(u){ if(!u.peut) return; const Ls=demandes(u.pid), n=Ls.reduce((m,r)=>Math.max(m,numN(r)),0)+1, prec=Ls[Ls.length-1], id=u.pid+':'+nouvId();
  const body=boite('d2','<label class="w">Intitulé<input data-k="LIB" maxlength="120" value="'+E('Demande complémentaire '+(n-1))+'"></label>'
    +'<label class="w">Procédure<select data-k="PROC">'+opts(PROC,'enquete')+'</select></label>'
    +'<p>'+(prec?'Autorité, numéros et parcelle sont repris de la demande « '+E(libDe(prec))+' ». ':'')+'Dates, oppositions et conditions commencent vides.</p>');
  dialog({title:'Nouvelle demande',width:'520px',body,buttons:[{t:'Annuler'},{t:'Créer',pri:true,fn:()=>{ const lib=String(champ(body,'LIB').value||'').trim(), proc=champ(body,'PROC').value;
    if(!lib){ dire('Donnez un intitulé à la demande.',true); return false; }
    return sauver(u,id,x=>{ x.N=n; x.LIB=lib; x.PROC=proc; if(prec) ['AUTORITE','NUM_COMMUNE','NUM_CANTON','PARCELLES'].forEach(k=>{ if(prec[k]) x[k]=prec[k]; }); },'Demande « '+lib+' » créée.',
      {n,siOk:()=>{ u.sel=id; u.st=0; }}); }}]}); }

function editerDates(u,foc){ if(!u.peut) return; const r=u.r, c=cible(u), id=c.id, D=r.DATES||{}, rc=r.RECOURS||{}, L=etapesDe(r), pv=prevues(u.p);
  const lig=([k,l])=>'<label>'+E(k==='decision'?'Date de la décision':k==='recours'?'Fin du délai de recours':l)+'<input type="date" max="9999-12-31" data-k="'+k+'" value="'+E(D[k]||'')+'"><span class="pr" data-pr="'+k+'"></span></label>';
  const body=boite('','<div class="h">Procédure</div>'+L.filter(([k])=>!['decision','notif','recours','debut','habiter'].includes(k)).map(lig).join('')
    +'<div class="h">Décision</div><label>Décision<select data-k="DECISION">'+opts({'':'En attente',delivre:'Permis délivré',refuse:'Permis refusé'},r.DECISION||'')+'</select></label>'
    +lig(['decision',''])+lig(['notif','Notification (réception de la décision)'])
    +'<div class="h">Recours</div><label>Recours<select data-k="R_etat">'+opts(RECOURS,rc.etat||'')+'</select></label>'
    +'<label data-x="rec">Déposé le<input type="date" max="9999-12-31" data-k="R_date" value="'+E(rc.date||'')+'"></label><label data-x="rec">Décision sur recours (ou retrait)<input type="date" max="9999-12-31" data-k="R_fin" value="'+E(rc.fin||'')+'"></label>'
    +lig(['recours',''])+'<label class="w" data-x="rec">Remarque sur le recours<input data-k="R_rem" maxlength="300" value="'+E(rc.rem||'')+'"></label>'
    +'<div class="h">Validité et travaux</div><label>Validité (années)<input type="number" min="1" max="10" step="1" data-k="VALIDITE" value="'+E(+r.VALIDITE>0?r.VALIDITE:2)+'"></label>'
    +'<label>Prolongation (mois)<input type="number" min="0" max="60" step="1" data-k="PROLONG" value="'+E(+r.PROLONG>0?r.PROLONG:0)+'"></label>'+lig(['peremption','Travaux à commencer avant le'])
    +lig(['debut','Début des travaux'])+lig(['habiter','Permis d’habiter / d’utiliser'])
    +'<p>Dates proposées selon les délais usuels (enquête de 30 jours ; recours dans les 30 jours, sans les féries, reporté au jour ouvrable ; validité de 2 ans) : à vérifier sur l’avis d’enquête et sur le permis. '
    +'Saisir la fin du délai de recours (« reprendre ») confirme que le permis est en force.</p>');
  const majRec=()=>{ const v=champ(body,'R_etat').value; body.querySelectorAll('[data-x="rec"]').forEach(x=>x.hidden=!v); };
  /* dates proposées tenues à jour pendant la saisie (fin de l'enquête, fin du délai de recours, validité) */
  const lireRec=()=>{ const re=champ(body,'R_etat').value; return re?{etat:re,date:champ(body,'R_date').value||'',fin:champ(body,'R_fin').value||'',rem:String(champ(body,'R_rem').value||'').trim()}:{etat:''}; };
  const majPr=()=>{ const t={PROC:r.PROC,DATES:{},DECISION:champ(body,'DECISION').value,RECOURS:lireRec(),VALIDITE:+champ(body,'VALIDITE').value||2,PROLONG:+champ(body,'PROLONG').value||0};
    body.querySelectorAll('input[type=date][data-k]').forEach(i=>{ if(J(i.value)!=null) t.DATES[i.dataset.k]=i.value; });
    const P=proposees(t);
    body.querySelectorAll('[data-pr]').forEach(sp=>{ const k=sp.dataset.pr, i=champ(body,k), p=P[k];
      sp.innerHTML=i&&J(i.value)==null?(p?'proposée : '+dmy(p.n)+' <button type="button" data-pk="'+k+'" data-pv="'+ISO(p.n)+'" title="'+E(p.pq)+'">reprendre</button>':pv[k]!=null?'prévue au planning : '+dmy(pv[k]):''):''; }); };
  champ(body,'R_etat').addEventListener('change',majRec); majRec();
  body.addEventListener('input',majPr); body.addEventListener('change',majPr); majPr();
  body.addEventListener('click',e=>{ const b=e.target.closest('[data-pk]'); if(!b) return; e.preventDefault(); const i=champ(body,b.dataset.pk); if(i){ i.value=b.dataset.pv; majPr(); } });
  const montres=CLES_DATES.filter(k=>champ(body,k));   /* dates présentes dans la fenêtre : les autres (étapes d'une autre procédure) sont gardées */
  const D0={}; montres.forEach(k=>{ D0[k]=champ(body,k).value||''; }); const R0=lireRec(), A0={DECISION:champ(body,'DECISION').value,VALIDITE:+champ(body,'VALIDITE').value||2,PROLONG:+champ(body,'PROLONG').value||0};
  const lire=()=>{ if(dateInvalide(body)) return null;
    const va=String(champ(body,'VALIDITE').value).trim(), pr=String(champ(body,'PROLONG').value).trim()||'0';
    if(!/^\d+$/.test(va)||+va<1||+va>10){ dire('Validité : un nombre entier d’années, de 1 à 10.',true); champ(body,'VALIDITE').focus(); return null; }
    if(!/^\d+$/.test(pr)||+pr>60){ dire('Prolongation : un nombre entier de mois, de 0 à 60.',true); champ(body,'PROLONG').focus(); return null; }
    const o={DATES:{}}; montres.forEach(k=>{ const v=champ(body,k).value; if(J(v)!=null) o.DATES[k]=v; });
    o.DECISION=champ(body,'DECISION').value; o.RECOURS=lireRec(); o.VALIDITE=+va; o.PROLONG=+pr;
    if(['admis','rejete','retire'].includes(o.RECOURS.etat)&&J(o.RECOURS.fin)==null){ dire('Indiquez la date de la décision sur recours (ou du retrait).',true); champ(body,'R_fin').focus(); return null; }
    const d=k=>J(o.DATES[k]);
    if(d('enq_d')!=null&&d('enq_f')!=null&&d('enq_f')<d('enq_d')){ dire('La fin de l’enquête est avant son début.',true); champ(body,'enq_f').focus(); return null; }
    if(d('depot')!=null&&d('decision')!=null&&d('decision')<d('depot')){ dire('La décision est avant le dépôt de la demande.',true); champ(body,'decision').focus(); return null; }
    if(d('decision')!=null&&d('notif')!=null&&d('notif')<d('decision')){ dire('La notification est avant la décision.',true); champ(body,'notif').focus(); return null; }
    if(o.DECISION&&d('decision')==null){ dire('Indiquez la date de la décision.',true); champ(body,'decision').focus(); return null; }
    return o; };
  dialog({title:'Dates et décision · '+libDe(r),width:'720px',body,buttons:[{t:'Annuler'},{t:'OK',pri:true,fn:()=>{ const o=lire(); if(!o) return false;
    const Dm=montres.filter(k=>(o.DATES[k]||'')!==D0[k]), Am=modifs(A0,{DECISION:o.DECISION,VALIDITE:o.VALIDITE,PROLONG:o.PROLONG}), Rm=modifs(R0,o.RECOURS);
    if(c.existait&&!Dm.length&&!Am.length&&!Rm.length) return true;
    return sauver(u,id,x=>{ const DD=Object.assign({},x.DATES||{}); Dm.forEach(k=>{ if(o.DATES[k]) DD[k]=o.DATES[k]; else delete DD[k]; }); x.DATES=DD;
      Am.forEach(k=>{ x[k]=o[k]; });
      if(Rm.includes('etat')) x.RECOURS=o.RECOURS; else if(Rm.length){ x.RECOURS=Object.assign({},x.RECOURS||{}); Rm.forEach(k=>{ x.RECOURS[k]=o.RECOURS[k]; }); } },c.existait?null:'Demande de permis enregistrée.',{existait:c.existait,n:c.n,siOk:()=>{ u.sel=id; }}); }}]});
  setTimeout(()=>{ const f=foc&&champ(body,foc==='decision'?'DECISION':foc); if(f){ f.focus(); f.scrollIntoView({block:'nearest'}); } },0); }

function editerOpp(u,i){ if(!u.peut) return; const c=cible(u), id=c.id, O=u.r.OPPOSITIONS||[], neuf=i<0, x=neuf?{sorte:'opposition',suite:'suspens',date:diso(new Date())}:Object.assign({},O[i]); if(!neuf&&!O[i]) return;
  const body=boite('','<label>Sorte<select data-k="sorte">'+opts(SORTE,x.sorte||'opposition')+'</select></label><label>Reçue le<input type="date" max="9999-12-31" data-k="date" value="'+E(x.date||'')+'"></label>'
    +'<label>Suite<select data-k="suite">'+opts(SUITE,x.suite||'suspens')+'</select></label>'
    +'<label class="w">Auteur<input data-k="auteur" maxlength="200" value="'+E(x.auteur||'')+'" placeholder="Nom, adresse, avocat…"></label>'
    +'<label class="w">Motifs<textarea data-k="motifs" maxlength="3000">'+E(x.motifs||'')+'</textarea></label>'
    +'<label class="w">Remarque (réponse, séance de conciliation…)<textarea data-k="rem" maxlength="2000">'+E(x.rem||'')+'</textarea></label>');
  const boutons=[], so={existait:c.existait,n:c.n,siOk:()=>{ u.sel=id; }};
  let D=null;
  if(!neuf) boutons.push({t:'Supprimer',fn:()=>{ confirmer('Supprimer '+(x.sorte==='observation'?'l’observation':'l’opposition')+(x.auteur?' de « '+x.auteur+' »':'')+' ?',()=>sauver(u,id,y=>{ const k=(y.OPPOSITIONS||[]).findIndex(z=>z.id===x.id); if(k<0) return 'abandon'; y.OPPOSITIONS.splice(k,1); },'Supprimée.',so).then(ok=>{ if(ok&&D) D.close(); }),{title:'Supprimer',yesText:'Supprimer'}); return false; }});
  const CO=['sorte','date','suite','auteur','motifs','rem'], lireO=()=>{ const v={}; CO.forEach(k=>v[k]=String(champ(body,k).value||'').trim()); return v; }, v0=lireO();
  boutons.push({t:'Annuler'},{t:neuf?'Ajouter':'OK',pri:true,fn:()=>{ if(dateInvalide(body)) return false; const v=lireO(); v.id=x.id||nouvId();
    if(!v.auteur&&!v.motifs){ dire('Indiquez l’auteur ou les motifs.',true); champ(body,'auteur').focus(); return false; }
    const M=modifs(v0,v).filter(k=>k!=='id'); if(!neuf&&!M.length) return true;
    return sauver(u,id,y=>{ y.OPPOSITIONS=y.OPPOSITIONS||[]; const k=y.OPPOSITIONS.findIndex(z=>z.id===v.id);
      if(neuf){ if(k<0) y.OPPOSITIONS.push(v); return; }
      if(k<0){ dire('Cette opposition a été supprimée entre-temps sur un autre poste.',true); return 'abandon'; }
      const z=Object.assign({},y.OPPOSITIONS[k]); M.forEach(q=>{ z[q]=v[q]; }); y.OPPOSITIONS[k]=z; },neuf?(v.sorte==='observation'?'Observation ajoutée.':'Opposition ajoutée.'):null,so); }});
  D=dialog({title:neuf?'Nouvelle opposition ou observation':'Modifier '+(x.sorte==='observation'?'l’observation':'l’opposition'),width:'640px',body,buttons:boutons}); }

function membres(p){ return [...new Set(DS.by('projectmember','PROJECT_ID',p.ID).filter(m=>!m.ISHIDDEN).map(m=>{ try{ return contactName(DS.get('contact',m.CONTACT_ID)); }catch(_){ return ''; } }).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr')); }
function editerCond(u,i){ if(!u.peut) return; const c=cible(u), id=c.id, C=u.r.CONDITIONS||[], neuf=i<0, x=neuf?{quand:'avant',etat:'regler',num:String(prochainNum(C))}:Object.assign({},C[i]); if(!neuf&&!C[i]) return;
  const dS='sgpc-src-'+nouvId(), dR='sgpc-resp-'+nouvId(), so={existait:c.existait,n:c.n,siOk:()=>{ u.sel=id; }};
  const body=boite('','<label>N°<input data-k="num" maxlength="20" value="'+E(x.num||'')+'"></label>'
    +'<label>Source<input data-k="source" list="'+dS+'" maxlength="120" value="'+E(x.source||'')+'"><datalist id="'+dS+'">'+SOURCES.map(s=>'<option value="'+E(s)+'">').join('')+'</datalist></label>'
    +'<label>À régler<select data-k="quand">'+opts(QUAND,x.quand||'avant')+'</select></label>'
    +'<label class="w">Condition<textarea data-k="texte" maxlength="4000">'+E(x.texte||'')+'</textarea></label>'
    +'<label>Responsable<input data-k="resp" list="'+dR+'" maxlength="160" value="'+E(x.resp||'')+'"><datalist id="'+dR+'">'+membres(u.p).map(s=>'<option value="'+E(s)+'">').join('')+'</datalist></label>'
    +'<label>État<select data-k="etat">'+opts(ETAT_C,x.etat||'regler')+'</select></label>'
    +'<label>Réglée le<input type="date" max="9999-12-31" data-k="le" value="'+E(x.le||'')+'"></label>'
    +'<label class="w">Remarque (justificatif, envoi…)<textarea data-k="rem" maxlength="2000">'+E(x.rem||'')+'</textarea></label>');
  champ(body,'etat').addEventListener('change',()=>{ if(champ(body,'etat').value==='reglee'&&!champ(body,'le').value) champ(body,'le').value=diso(new Date()); });
  champ(body,'le').addEventListener('change',()=>{ if(J(champ(body,'le').value)!=null) champ(body,'etat').value='reglee'; });   /* une date de règlement marque la condition réglée */
  const boutons=[]; let D=null;
  if(!neuf) boutons.push({t:'Supprimer',fn:()=>{ confirmer('Supprimer la condition '+(x.num?'n° '+x.num:'')+' ?',()=>sauver(u,id,y=>{ const k=(y.CONDITIONS||[]).findIndex(z=>z.id===x.id); if(k<0) return 'abandon'; y.CONDITIONS.splice(k,1); },'Condition supprimée.',so).then(ok=>{ if(ok&&D) D.close(); }),{title:'Supprimer la condition',yesText:'Supprimer'}); return false; }});
  const CC=['num','source','quand','texte','resp','etat','le','rem'], lireC=()=>{ const v={}; CC.forEach(k=>v[k]=String(champ(body,k).value||'').trim()); if(v.etat!=='reglee') v.le=''; return v; }, v0=lireC();
  boutons.push({t:'Annuler'},{t:neuf?'Ajouter':'OK',pri:true,fn:()=>{ if(dateInvalide(body)) return false; const v=lireC(); v.id=x.id||nouvId();
    if(!v.texte){ dire('Saisissez le texte de la condition.',true); champ(body,'texte').focus(); return false; }
    const M=modifs(v0,v).filter(k=>k!=='id'); if(!neuf&&!M.length) return true;
    return sauver(u,id,y=>{ y.CONDITIONS=y.CONDITIONS||[]; const k=y.CONDITIONS.findIndex(z=>z.id===v.id);
      if(neuf){ if(k<0){ if(y.CONDITIONS.some(z=>z.num===v.num)&&v.num===x.num) v.num=String(prochainNum(y.CONDITIONS)); y.CONDITIONS.push(v); } return; }
      if(k<0){ dire('Cette condition a été supprimée entre-temps sur un autre poste.',true); return 'abandon'; }
      const z=Object.assign({},y.CONDITIONS[k]); M.forEach(q=>{ z[q]=v[q]; }); y.CONDITIONS[k]=z; },neuf?'Condition ajoutée.':null,so); }});
  D=dialog({title:neuf?'Nouvelle condition':'Modifier la condition',width:'680px',body,buttons:boutons});
  setTimeout(()=>{ const f=champ(body,'texte'); if(f&&neuf) f.focus(); },0); }

/* « Coller une liste… » : une condition par élément numéroté (1. / 1) / 1.1 / a) / tiret ou puce, numéro seul sur sa ligne compris) ; une
   ligne vide termine l'élément ; le texte hors élément forme une condition par paragraphe. Un numéro n'est reconnu que s'il suit la
   numérotation (1.1 après 1, 1.2 après 1.1, 3 après 2, 1 pour une nouvelle liste ; 2.1 ouvre une sous-liste) : une ligne repliée qui commence
   par une mesure ou une date (« 2.5 m », « 15.07 au 15.08 ») reste dans la condition. Mot coupé en fin de ligne (« rac- / cordé ») recollé.
   Sous-éléments (a), b), tirets) d'un élément numéroté : numéros 1a, 1b… ; les autres reçoivent le numéro suivant.
   Intitulés : « II. … », « B) … », intitulé court sans ponctuation suivi d'une liste (« ECA », « DGMR »), élément numéroté sans point final
   suivi de sous-numéros (« 1. Généralités » puis 1.1) — retirés, leur texte précède celui des conditions qui suivent (« ECA : … ») sauf s'il
   ne fait que nommer la liste (« Conditions particulières », « … aux conditions suivantes : », « La Municipalité impose : ») ; élément qui
   finit par « : » : titre de ses sous-éléments, sinon joint au paragraphe qui suit. Sans aucun repère ni ligne vide, une condition par phrase
   terminée en fin de ligne (« . », « ; », « : », sauf abréviation : art., al., ch., let., cf., n°…). */
function decouper(t){ const L=String(t||'').replace(/\r/g,'').split('\n'), out=[];
  const RE=/^\s*(?:(\d{1,3}(?:\.\d{1,3})+)\.?|(\d{1,3})[.)]|([a-z])\)|([-–—•·*▪◦○➢►\uF0B7\uF0A7]))(?:\s+|$)/;
  const SEC=/^\s*(?:[IVX]{1,5}|[A-Z])[.)]\s+(?=\S)/;   /* intitulé de section : « II. », « B) » */
  const ABR=/\b(art|al|ch|let|cf|n°|no|p|pp|ss|resp|min|max|env|chap|réf|ref|cat|lit)\.$/i;
  const deuxPts=x=>/:\s*$/.test(x), sans=x=>String(x).replace(/\s*:\s*$/,'').trim(), mots=x=>sans(x).split(/\s+/).length;
  const generique=x=>/\b(conditions?|charges?|r[ée]serves?|prescriptions?)(\s+(suivantes?|ci-apr[èe]s|particuli[èe]res?|g[ée]n[ée]rales?|sp[ée]ciales?))?$|\b(suivant(e)?s|ci-apr[èe]s|impose(nt)?|exige(nt)?|prescri(t|vent))$/i.test(sans(x));
  const joindre=(a,b)=>/[a-zà-öø-ÿ]-$/i.test(a)&&/^[a-zà-öø-ÿ]/.test(b)?a.slice(0,-1)+b:(a?a+' ':'')+b;
  let cur=null, parent=null, sous=0, haut=null, marques=0, vides=0, vus=new Set(), dern={};
  L.forEach(l=>{ if(!l.trim()){ vides++; if(cur&&!cur.num&&!cur.par) parent=null; cur=null; return; }
    let m=RE.exec(l);
    if(m&&m[1]){ const p=m[1].split('.'), pre=p.slice(0,-1).join('.'), k=+p[p.length-1]; if(vus.has(pre)?(dern[pre]||0)+1!==k:k!==1) m=null; else vus.add(pre); }
    else if(m&&m[2]){ const n=+m[2]; if(!(haut==null||n===1||(n>haut&&n<=haut+5))) m=null; else if(n===1&&haut!=null){ vus=new Set(); dern={}; } }
    if(!m&&SEC.test(l)){ cur={num:'',texte:l.replace(SEC,'').trim(),enf:[],sec:true}; out.push(cur); parent=cur; sous=0; return; }
    if(m){ marques++; const txt=l.slice(m[0].length).trim();
      if(m[1]||m[2]){ const num=m[1]||m[2]; Object.keys(dern).forEach(k=>{ if(k===num||k.startsWith(num+'.')) delete dern[k]; });
        if(m[1]){ const p=num.split('.'); dern[p.slice(0,-1).join('.')]=+p[p.length-1]; } else haut=+num; vus.add(num);
        cur={num,texte:txt,enf:[]}; out.push(cur); parent=cur; sous=0; }
      else { sous++; const lettre=m[3]||String.fromCharCode(96+Math.min(sous,26));
        cur={num:parent&&parent.num?parent.num+lettre:'',texte:txt,par:parent}; if(parent) parent.enf.push(cur); out.push(cur); }
      return; }
    if(cur) cur.texte=joindre(cur.texte,l.trim());
    else { cur={num:'',texte:l.trim(),enf:[]}; out.push(cur); parent=cur; sous=0; } });   /* paragraphe : titre possible des tirets qui suivent */
  if(!marques&&!vides&&out.length===1&&!out[0].sec&&L.filter(x=>x.trim()).length>1){ out.length=0; let acc='';
    L.forEach(l=>{ const x=l.trim(); if(!x) return; acc=joindre(acc,x); if(/[.;:!?]$/.test(x)&&!ABR.test(x)){ out.push({num:'',texte:acc}); acc=''; } });
    if(acc) out.push({num:'',texte:acc}); }
  /* intitulés */
  const sousNum=x=>/^\d/.test(x.num||'')?out.filter(y=>y!==x&&String(y.num||'').startsWith(x.num+'.')):[];
  out.forEach((x,i)=>{ const nx=out[i+1], tx=String(x.texte||'').trim();
    if(x.sec||(!x.num&&!x.par&&!/[.;!?:]$/.test(tx)&&mots(tx)<=6&&nx&&(nx.num||nx.par))) x.titre=true;
    const K=sousNum(x); if(K.length&&!/[.;!?]$/.test(tx)){ x.titre=true; x.titreNum=true; K.forEach(y=>{ if(!y.par2||y.par2.num.length<x.num.length) y.par2=x; }); } });
  /* élément qui finit par « : » sans sous-élément : introduction qui nomme la liste retirée, sinon jointe au paragraphe qui suit */
  out.forEach((x,i)=>{ if(x.titre||!deuxPts(x.texte||'')||(x.enf&&x.enf.length)) return;
    if(generique(x.texte)){ x.titre=true; x.generique=true; return; }
    const nx=out[i+1]; if(nx&&!nx.num&&!nx.par&&!nx.titre){ nx.texte=x.texte+' '+nx.texte; nx.num=x.num||nx.num; x.titre=true; x.joint=true; } else x.garde=true; });
  const res=[]; let sect=null;
  out.forEach(x=>{ if(x.titre){ if(!x.num&&!x.titreNum&&!x.joint) sect=x.generique||generique(x.texte)?null:sans(x.texte); return; }
    if(!x.num&&!x.par) sect=null;   /* un paragraphe ordinaire termine la section */
    if(deuxPts(x.texte||'')&&!x.garde&&x.enf&&x.enf.length) return;   /* titre « … : » de ses sous-éléments */
    const pa=x.par&&deuxPts(x.par.texte)&&!generique(x.par.texte)?x.par:x.par2&&!generique(x.par2.texte)?x.par2:null;
    const pre=[sect,pa?sans(pa.texte):''].filter(Boolean).join(' : ');
    if(String(x.texte||'').trim()) res.push({num:x.num,texte:((pre?pre+' : ':'')+x.texte).trim()}); });
  return res; }
/* numéros des conditions collées : ceux du texte, sinon le suivant libre ; si un numéro du texte est déjà pris dans la liste, toutes les
   conditions collées sont numérotées à la suite (jamais deux fois le même numéro) */
function numeroter(N,C){ const pris=new Set(C.map(x=>String(x.num||'')).filter(Boolean)), vus=new Set(), conflit=N.some(x=>x.num&&(pris.has(x.num)||vus.has(x.num)||!vus.add(x.num)));
  let k=prochainNum(conflit?C:C.concat(N.filter(x=>x.num)));
  return N.map(x=>{ let num=conflit?'':x.num; if(!num||pris.has(num)) num=String(k++); pris.add(num); return {num,texte:x.texte}; }); }
function coller(u){ if(!u.peut) return; const c=cible(u), id=c.id;
  const body=boite('d2','<label class="w">Texte des conditions<textarea class="grand" data-k="t" placeholder="Collez ici les conditions du permis ou de la synthèse cantonale…"></textarea></label>'
    +'<label>Source<input data-k="source" list="sgpc-src-col" maxlength="120" value="Municipalité"><datalist id="sgpc-src-col">'+SOURCES.map(s=>'<option value="'+E(s)+'">').join('')+'</datalist></label>'
    +'<label>À régler<select data-k="quand">'+opts(QUAND,'avant')+'</select></label>'
    +'<p data-k="ap">Une condition par élément numéroté (1. 2. 3., 1.1, a) b), tirets) ; sinon une par paragraphe. Aperçu ci-dessous avant l’ajout.</p><div class="sgpc-ap" data-k="liste"></div>');
  const ap=champ(body,'ap'), liste=champ(body,'liste'), maj=()=>{ const N=numeroter(decouper(champ(body,'t').value),(u.r.CONDITIONS||[]));
    ap.textContent=N.length?pl(N.length,'condition')+' reconnue'+(N.length>1?'s':'')+' — vérifiez l’aperçu ; vous pourrez les modifier une à une.':'Une condition par élément numéroté (1. 2. 3., 1.1, a) b), tirets) ; sinon une par paragraphe. Aperçu ci-dessous avant l’ajout.';
    liste.innerHTML=N.map(x=>'<div><b>'+E(x.num)+'</b><span>'+E(x.texte.length>220?x.texte.slice(0,220)+'…':x.texte)+'</span></div>').join(''); };
  champ(body,'t').addEventListener('input',maj);
  dialog({title:'Coller une liste de conditions',width:'720px',body,buttons:[{t:'Annuler'},{t:'Ajouter',pri:true,fn:()=>{ const N0=decouper(champ(body,'t').value);
    if(!N0.length){ dire('Aucune condition reconnue dans le texte.',true); return false; }
    const src=String(champ(body,'source').value||'').trim(), q=champ(body,'quand').value;
    return sauver(u,id,y=>{ y.CONDITIONS=y.CONDITIONS||[]; numeroter(N0,y.CONDITIONS).forEach(x=>y.CONDITIONS.push({id:nouvId(),num:x.num,source:src,texte:x.texte.slice(0,4000),quand:q,resp:'',etat:'regler',le:'',rem:''})); },
      pl(N0.length,'condition')+' ajoutée'+(N0.length>1?'s':'')+'.',{existait:c.existait,n:c.n,siOk:()=>{ u.sel=id; }}); }}]});
  setTimeout(()=>{ const f=champ(body,'t'); if(f) f.focus(); },0); }

/* ── impression : fiche, procédure, oppositions et conditions, au papier des contrats (sgImprimer) ── */
function imprimer(u){ if(typeof sgImprimer!=='function') return; const p=u.p, r=u.r, et=etat(r), t=E;
  const kv=(l,v)=>String(v||'').trim()?'<tr><td>'+t(l)+'</td><td>'+t(v)+'</td></tr>':'';
  const fic='<table>'+kv('Procédure',PROC[r.PROC])+kv('Autorité',r.AUTORITE)+kv('Parcelle(s)',r.PARCELLES)+kv('N° de dossier communal',r.NUM_COMMUNE)+kv('N° CAMAC',r.NUM_CANTON)
    +kv('Publication (FAO)',r.FAO)+kv('Objet de la demande',r.OBJET)+kv('Recours',recoursTexte(r))+kv('Remarques',r.REM)+'</table>';
  const rc=recEff(r);
  const pro=etapesDe(r).concat(r.DECISION==='delivre'&&rc!=='admis'&&rc!=='depose'?[['peremption','Travaux à commencer avant le']]:[]).map(([k,l])=>{ const x=dateDe(r,k);
    const lib=k==='decision'?(r.DECISION==='refuse'?'Décision : permis refusé':r.DECISION==='delivre'?'Décision : permis délivré':'Décision'):k==='recours'&&rc?RECOURS[rc]+' · fin du délai':l;
    return '<tr><td>'+t(lib)+'</td><td>'+(x?dmy(x.n):'—')+'</td><td>'+(x&&x.prop?'proposée (à vérifier)':x&&x.n>AUJ()?'prévue':'')+'</td></tr>'; }).join('');
  const O=r.OPPOSITIONS||[], C=r.CONDITIONS||[];
  sgImprimer(libDe(r)+' — '+(p.NUMBER||'')+' '+(p.TITLE||''),'<p><b>'+t(et.lib)+'</b><br>'+t('État au '+dmy(AUJ()))+'</p>'
    +'<h2>Demande</h2>'+fic
    +'<h2>Procédure</h2><table><tr><th>Étape</th><th>Date</th><th>Remarque</th></tr>'+pro+'</table>'
    +(avecEnquete(r)||O.length?'<h2>Oppositions et observations</h2>'+(O.length?'<table><tr><th>N°</th><th>Reçue le</th><th>Sorte</th><th>Auteur</th><th>Motifs</th><th>Suite</th></tr>'
      +O.map((x,i)=>'<tr><td>'+(i+1)+'</td><td>'+(J(x.date)!=null?dmy(J(x.date)):'')+'</td><td>'+t(SORTE[x.sorte]||SORTE.opposition)+'</td><td>'+t(x.auteur)+'</td><td>'+t(x.motifs)+'</td><td>'+t(SUITE[x.suite]||SUITE.suspens)+'</td></tr>').join('')+'</table>':'<p>Aucune.</p>'):'')
    +'<h2>Conditions et charges du permis</h2>'+(C.length?'<table><tr><th>N°</th><th>Source</th><th>Condition</th><th>À régler</th><th>Responsable</th><th>État</th></tr>'
      +C.map((x,i)=>'<tr><td>'+t(x.num||String(i+1))+'</td><td>'+t(x.source)+'</td><td>'+t(x.texte)+'</td><td>'+t(QUAND_C[x.quand]||'')+'</td><td>'+t(x.resp)+'</td><td>'+t(ETAT_C[x.etat]||ETAT_C.regler)+(x.etat==='reglee'&&J(x.le)!=null?' le '+dmy(J(x.le)):'')+'</td></tr>').join('')+'</table>':'<p>Aucune.</p>')); }

/* compteur de la tuile de la page du projet : état de la dernière demande (nommée s'il y en a plusieurs), conditions à régler */
function compte(p){ const Ls=demandes(p.ID); if(!Ls.length) return 'à commencer'; const r=Ls[Ls.length-1], et=etat(r), C=(r.CONDITIONS||[]).filter(x=>(x.etat||'regler')!=='reglee').length;
  return (Ls.length>1?libDe(r)+' : ':'')+et.lib+(C?' · '+pl(C,'condition')+' à régler':'')+(Ls.length>1?' · '+Ls.length+' demandes':''); }

window.sgPermisModule=function(C,p){ try{ ouvrir(C,p); }
  catch(e){ console.error(e); const d=document.createElement('p'); d.className='sgpc-err'; d.textContent='Permis de construire : erreur — '+String(e&&e.message||e); C.append(d); } };
window.sgPermisCompte=p=>{ try{ return compte(p); }catch(_){ return ''; } };
window.SGPC={version:'02.11.2026',ETAT,ETAPES,PROC,etat,proposees,prevues,decouper,numeroter,demandes,finDelai,feries,suspendu};
})();

/* ═══ 56. Documents des heures et des frais au graphisme des documents du devis général et du contrôle des coûts (15.11.2026) ═══
   Demande de Paulo du 15.11.2026 : « pour tous les documents des heures, etc. recréer le design des documents de contrôle du coût et devis général, même graphisme pour
   tous les documents de l'app du chapitre heures ».
   Tous les documents du chapitre Heures (Contrôle des heures d'affaires, Critères d'analyse des heures, Contrôle des frais, Critères d'analyse des frais) passent par
   deux fonctions du moteur : ctlPrint (« Rapport d'heures », « Rapport de frais » : la liste des positions) et ctlDocHTML (« Journal des heures », « Rapport des
   frais », « Récapitulatif des heures / des frais », « Rapport heures - facturation - coût de revient »). Elles sont enveloppées ici : mêmes données, mêmes colonnes,
   mêmes totaux, mais le document est dessiné comme les listes du contrôle des coûts — page de garde éditoriale (numéro du projet, titre du document, ouvrage, maître de
   l'ouvrage, période et filtre, totaux), tableau « Bleu nuit » (titres des colonnes en blanc sur bande bleu nuit, groupes en bleu nuit soulignés, sous-totaux en gras,
   total sur bande bleu nuit, filets gris, texte jamais coupé : il passe à la ligne), papier des contrats — et s'ouvre dans la fenêtre des documents de l'app (barre
   « Document PDF » : pages, Imprimer, Télécharger, Fermer ; volet Réglages : Format Paysage | Portrait, Page de garde ; choix gardés sur ce poste, par document :
   localStorage sg3_docs_heures). Montants en noir, comme dans le devis. Rien n'est écrit dans la base.
   Aussi, hors du chapitre Heures (sgDocTableau, appelé par sg3_plus.js) : tableau de bord du projet ▸ Heures ▸ Imprimer, Administration ▸ Situation des heures ▸
   Imprimer, rapport des heures d'un collaborateur sur un projet — le tableau affiché est repris tel quel (titres, lignes, totaux, sous-lignes).
   Pas ici : les écrans d'Archives (Suivi & écarts, Controlling, Rapports de temps…) gardent leurs documents — l'enveloppe ne s'applique pas quand l'écran ouvert est
   rangé dans Archives. DeltaSub.html seul : documents d'origine. Outils de mise en page repris de sg3_coco_docs.js (SGCD.outils : mesure, etaler).
   Débogage : window.SGDH. ═══ */
(function(){
if(typeof ctlDocHTML!=='function'||typeof ctlPrint!=='function'||typeof dialog!=='function'||!window.SGDE||!SGDE.vue||!SGDE.livret||!window.SGDS||!SGDS.ressources||!window.SGCD||!SGCD.outils) return;
const {DG_RH,DG_HP,DG_HT,DG_TXT,deGardeRub}=SGDE.livret, {mesure,etaler}=SGCD.outils;
const MARGE=28.35, X0T=SGDE.livret.DG_X0T+SGDE.livret.DG_CFC, WL=SGDE.livret.DG_WL-SGDE.livret.DG_CFC, WP=SGDE.livret.DG_WP-SGDE.livret.DG_CFC;   /* tableau de la colonne « +41 … / info@ » du pied (x 125.72) à la barre du numéro de page, comme les listes sans CFC du contrôle des coûts (Paulo, 26.11.2026 : « aligner date à info ») ; avant : dès la marge (x 28.35) */
const sv=x=>String(x==null?'':x), un=t=>sv(t).replace(/\s+/g,' ').trim();
/* ── réglages gardés sur ce poste, par document (clé = nom du document) ── */
const LS='sg3_docs_heures';
const regs=()=>{ try{ const r=JSON.parse(localStorage.getItem(LS)||'{}'); return r&&typeof r==='object'?r:{}; }catch(_){ return {}; } };
const regDe=cle=>Object.assign({},regs()[cle]||{});
const regSet=(cle,patch)=>{ const R=regs(); R[cle]=Object.assign({},R[cle]||{},patch); try{ localStorage.setItem(LS,JSON.stringify(R)); }catch(_){ } };
const formatDe=Dc=>{ const f=regDe(Dc.cle).format; return f==='portrait'||f==='paysage'?f:(Dc.format||(Dc.cols.length>6?'paysage':'portrait')); };
/* titres abrégés quand le tableau est trop large pour la page (titres du moteur) */
const ABR={'Heures prévues':'H. prévues','Honoraires prévus':'Hon. prévus','Honoraires prévus-Honoraires':'Hon. prévus − hon.','Taux horaire du collaborateur':'Taux collab.','Frais des collaborateurs':'Frais collab.',
  'Honoraires-Coûts des collaborateurs':'Hon. − coûts collab.','Budget-Durée':'Budget − durée','Phase partielle':'Phase part.','Groupe d’activités':'Groupe','Facturable':'Fact.','Remboursable':'Remb.','Collaborateur':'Collab.','Quantité':'Qté',
  /* Ressources humaines (heures dues, bouclement, coût de revient) */
  'Heures dues':'H. dues','Heures saisies':'H. saisies','Heures sup. à reporter':'H. sup. à reporter','Droit vacances (h)':'Droit vac. (h)','Vacances prises (h)':'Vac. prises (h)','Solde vacances (h)':'Solde vac. (h)',
  'Vacances (jours)':'Vac. (j)','Vacances (heures)':'Vac. (h)','Âge au 31.12':'Âge','Occupation':'Occup.','Occupation %':'Occup. %','Salaire mensuel brut':'Salaire mens.','Vacances (sem.)':'Vac. (sem.)','Autres absences (j)':'Abs. (j)',
  'Part facturable %':'Part fact. %','Frais directs / an':'Frais directs','Heures de présence':'H. présence','Heures facturables':'H. fact.','Taux interne / h':'Taux interne','Coût de revient / h fact.':'Revient / h fact.','Prix de vente conseillé':'Prix de vente'};
/* ── pages : jamais de titre de groupe seul en bas de page, ni de sous-total ou de total seul en haut ; pas de coupure dans un texte passé à la ligne ── */
const paginer=(rows,cols,cap,titre)=>{ const P=[]; let i=0;
  while(i<rows.length){ let k=Math.min(rows.length,i+cap);
    if(k<rows.length){ const mauvaise=j=>!!rows[j].k||rows[j].g==='x'||rows[j-1].g==='g'||rows[j].g==='s'||rows[j].g==='t'; let j=k; while(j>i+1&&j>k-12&&mauvaise(j)) j--; if(j>i&&!mauvaise(j)) k=j; }
    const rr=rows.slice(i,k); while(rr.length<cap) rr.push({c:[],s:'E'}); P.push({type:2,titre,digit:2,lpp:cap,cols,rows:rr}); i=k; }
  return P; };
/* ── page de garde : ouvrage et maître de l'ouvrage du projet, puis ce que dit le document (période, filtre, regroupement, totaux) ── */
const rubriques=Dc=>{ const p=Dc.p, R=[]; if(p){ try{ (deGardeRub(p,{filter:null})||[]).filter(x=>/ouvrage/i.test(sv(x.lib))).forEach(x=>R.push(x)); }catch(e){ console.error(e); } }
  const M=(Dc.meta||[]).filter(m=>m&&un(m[1])&&!(p&&/^(affaire|projet)$/i.test(un(m[0])))), per=M.find(m=>/^(filtre par date|p[ée]riode)$/i.test(un(m[0]))), fil=M.find(m=>/^filtre$/i.test(un(m[0])));
  if(per||fil) R.push({lib:'Période',nom:per?un(per[1]):'Toutes les dates',adr:fil?'Filtre : '+un(fil[1]):''});
  const tot=M.filter(m=>/^total/i.test(un(m[0]))), aut=M.filter(m=>m!==per&&m!==fil&&!tot.includes(m)&&!/^monnaie$/i.test(un(m[0])));
  aut.forEach(m=>R.push({lib:un(m[0]),nom:un(m[1]),adr:''}));
  if(tot.length){ const tx=m=>{ const l=un(m[0]).replace(/^total\s*/i,''); return (l?l.charAt(0).toLocaleUpperCase('fr')+l.slice(1)+' ':'')+un(m[1]); }; R.push({lib:tot.length>1?'Totaux':'Total',nom:tx(tot[0]),adr:tot.slice(1).map(tx).join('\n')}); }
  return R; };
/* ── le PDF ── */
async function octets(Dc){ const rg0=regDe(Dc.cle); if(Dc.grouper&&rg0.parCol===true) Dc=parCollaborateur(Dc); const M=await mesure(), {w,R,fn}=await SGDS.ressources(), rg=rg0, ori=formatDe(Dc), W=ori==='portrait'?WP:WL, cap=Math.max(1,Math.floor((ori==='portrait'?DG_HP:DG_HT)/DG_RH)), p=Dc.p||{};
  /* un tableau → ses pages ; un document peut en avoir plusieurs (Dc.suite), chacun commence sur une nouvelle page avec ses propres colonnes */
  const pagesDe=Tb=>{
  const ST={g:'O',s:'W',t:'T','1':'S',x:'X',b:'W','':Tb.hier?'W':'S'}, nC=Tb.cols.length;   /* x : commentaire ou désignation sous sa ligne, en gris italique (comme le descriptif d'une position du devis) ; b : ligne en gras */
  let rows=(Tb.rows||[]).map(r=>{ const c=Tb.cols.map((_,j)=>sv((r.c||[])[j])), seul=un(c[0])!==''&&c.slice(1).every(x=>!un(x)); return Object.assign({c,s:ST[r.g||'']||'S',g:r.g||''},r.saut?{saut:r.saut}:{},seul||r.debR?{debR:1}:{},Array.isArray(r.cc)&&r.cc.some(Boolean)?{cc:Tb.cols.map((_,j)=>r.cc[j]||'')}:{}); });
  if(!rows.length) rows=[{c:Tb.cols.map((_,j)=>j===0?'Aucune ligne.':''),s:'S',g:'',debR:1}];
  /* largeurs : chaque colonne à la mesure de son titre et de son contenu. Trop large pour la page : une colonne de texte d'un long tableau prend la largeur qui suffit à
     neuf lignes sur dix (les rares textes plus longs passent à la ligne) ; puis les colonnes de nombres gardent leur largeur et les colonnes de texte les plus longues sont
     ramenées à une même largeur (commentaire, désignation : leur texte passe à la ligne), les colonnes courtes ne changent pas ; encore trop large : tout est réduit.
     De la place en trop : à la colonne de texte la plus longue. Une colonne de nombres suivie d'une colonne de texte en est séparée par une gouttière de 8 pt (colonne
     vide), sinon le montant touche le texte. Une cellule de texte suivie d'une colonne de texte vide déborde dessus (titre d'un groupe, libellé d'un sous-total) : elle
     ne compte pas dans la largeur de sa colonne. */
  const gras=r=>r.s!=='S', deb=(r,j)=>j<nC-1&&!Tb.cols[j].r&&!un(r.c[j+1])&&(!Tb.cols[j+1].r||r.debR);
  /* largeur du contenu de chaque colonne : la plus grande (maxi) tant que le tableau tient dans la page ; sinon, pour une colonne de texte d'un long tableau, celle
     qui suffit à neuf lignes sur dix (p90 : les rares textes plus longs passent à la ligne) */
  const largs=Tb.cols.map((c,j)=>rows.filter(r=>!deb(r,j)&&un(r.c[j])!=='').map(r=>Math.max(0,...sv(r.c[j]).split('\n').map(l=>M.larg(l,gras(r))))).sort((a,b)=>a-b));
  const maxi=largs.map(L=>L.length?L[L.length-1]:0), p90=largs.map((L,j)=>!L.length?0:(Tb.cols[j].r||L.length<12)?L[L.length-1]:L[Math.floor(0.9*(L.length-1))]);
  let contenu=maxi;
  const GOUT=8, sp=Tb.cols.map((c,j)=>!!(c.r&&Tb.cols[j+1]&&!Tb.cols[j+1].r)), Wd=W-sp.filter(Boolean).length*GOUT, PL=64, txt=Tb.cols.map((c,j)=>j).filter(j=>!Tb.cols[j].r);
  /* titres : en entier quand le tableau tient dans la page ; sinon un titre plus large que le contenu de sa colonne est abrégé (ABR), comme dans le contrôle des coûts */
  let TT=Tb.cols.map(c=>sv(c.t)), padN=9; const natDe=()=>Tb.cols.map((c,j)=>Math.max(M.larg(TT[j],true),contenu[j])+(c.r?padN:9)), trop=()=>nat.reduce((a,b)=>a+b,0)>Wd; let nat=natDe();
  if(trop()){ contenu=p90; nat=natDe(); }   /* 1. trop large : colonnes de texte à la largeur de neuf lignes sur dix */
  if(trop()){ TT=TT.map((t,j)=>ABR[un(t)]&&M.larg(t,true)>contenu[j]?ABR[un(t)]:t); padN=5; nat=natDe(); }   /* 2. encore trop large : titres abrégés, colonnes de nombres resserrées (tableaux à 18 colonnes du Suivi RH) */
  let wd=nat.slice(); const som=()=>wd.reduce((a,b)=>a+b,0);
  if(som()>Wd){ let reste=Wd-Tb.cols.reduce((a,c,j)=>a+(c.r?nat[j]:0),0), n=txt.length; const T=txt.slice().sort((a,b)=>nat[a]-nat[b]);   /* des plus courtes aux plus longues */
    for(const j of T){ const part=reste/n; if(nat[j]<=part){ wd[j]=nat[j]; reste-=nat[j]; n--; } else { T.slice(T.indexOf(j)).forEach(k=>{ wd[k]=Math.max(part,Math.min(nat[k],PL)); }); break; } }
    if(som()>Wd+0.5){ const f=Wd/som(); wd=wd.map(x=>x*f); } }
  else { const jl=txt.length?txt.reduce((a,j)=>maxi[j]>maxi[a]?j:a,txt[0]):0; wd[jl]+=Wd-som(); }   /* place en trop : à la colonne de texte au contenu le plus long (pas au titre le plus long) */
  const cols=[]; Tb.cols.forEach((c,j)=>{ cols.push({t:TT[j],w:Math.round(wd[j]*100)/100,r:!!c.r}); if(sp[j]) cols.push({t:'',w:GOUT,r:false}); });
  if(sp.some(Boolean)) rows.forEach(r=>{ const c=[], k=[]; r.c.forEach((x,j)=>{ c.push(x); if(r.cc) k.push(r.cc[j]||''); if(sp[j]){ c.push(''); if(r.cc) k.push(''); } }); r.c=c; if(r.cc) r.cc=k; });
  const R=etaler(rows,cols,M);
  if(!R.some(r=>r.saut)) return paginer(R,cols,cap,Dc.titre);
  /* groupé (par collaborateur) : un segment paginé par groupe, chacun sur une nouvelle page, son titre au-dessus du tableau (e.forme : chap, fiche) avec le tableau
     descendu de e.dy rangées ; e.tete : rangée de titre répétée en tête de chacune de ses pages (« suite ») */
  const segs=[]; R.forEach(r=>{ if(r.saut||!segs.length) segs.push({e:r.saut||null,rows:[]}); segs[segs.length-1].rows.push(r); });
  return segs.flatMap(sg=>{ const e=sg.e; if(!e) return paginer(sg.rows,cols,cap,Dc.titre);
    const tr=e.tete?sg.rows[0]:null, body=tr?sg.rows.slice(1):sg.rows, dyN=+e.dy||0;
    const P=paginer(body.length?body:[{c:[],s:'E'}],cols,Math.max(1,cap-dyN-(tr?1:0)),Dc.titre);
    P.forEach((pg,i)=>{ if(dyN) pg.dy=dyN*DG_RH; if(e.forme) pg.entete=Object.assign({},e,{suite:i>0});
      if(tr) pg.rows.unshift(i?Object.assign({},tr,{saut:null,c:tr.c.map(x=>x===e.nom?x+' (suite)':x)}):tr); });
    return P; }); };
  const pages=[...(Dc.avant||[]),Dc,...(Dc.suite||[])].flatMap(pagesDe);   /* Dc.avant : tableaux placés avant (récapitulatif par collaborateur) */
  const couverture=rg.garde===false?null:{edito:true,statut:'',num:un(p.NUMBER),titre:sv(Dc.titre).toLocaleUpperCase('fr'),sous:'',info:'',marge:'',filtre:'',rub:rubriques(Dc),sig:[]};
  if(couverture) pages.unshift({type:0,titre:Dc.titre,rows:[]}); else if(pages[0]) pages[0].type=1;
  const sT={b:true,z:DG_TXT}, sL={b:false,z:DG_TXT}, st={T:sT,O:sT,W:sT,F:sT,S:sL,D:sL,X:sL,E:sL}, qui=[p.NUMBER,p.TITLE].filter(Boolean).join(' - ');
  const opt=w.JSON.parse(JSON.stringify({titre:Dc.titre,sousTitre:[qui,Dc.sous].filter(Boolean).join(' · '),date:today(),type:Dc.type||'Heures',description:[Dc.titre,p.NUMBER,p.TITLE].filter(Boolean).join(' '),
    livretDG:{couverture:couverture||{},pages,st,zebra:false,style:'nuit',deborde:true,rh:DG_RH,orientation:ori,x0:MARGE,x0Tab:X0T,aligne:true,corpsTitres:DG_TXT,calRetrait:7}})), j=new w.Array(); opt.journal=j;
  const oct=await fn(R,null,opt); if(j.length) console.info(Dc.titre+' :',Array.from(j)); return oct; }
/* ── la fenêtre du document : barre « Document PDF », lecteur, volet Réglages ── */
const reglages=Dc=>{ const rg=regDe(Dc.cle), f=formatDe(Dc);
  return [{t:'Format : Paysage',chk:f==='paysage',grp:'Format',fn:()=>regSet(Dc.cle,{format:'paysage'})},{t:'Format : Portrait',chk:f==='portrait',grp:'Format',fn:()=>regSet(Dc.cle,{format:'portrait'})},
    {t:'Page de garde',chk:rg.garde!==false,grp:'Affichage',fn:()=>regSet(Dc.cle,{garde:regDe(Dc.cle).garde===false})}]
    .concat(Dc.grouper&&colDe(Dc)>=0?[{t:'Grouper par collaborateur',chk:rg.parCol===true,grp:'Affichage',fn:()=>regSet(Dc.cle,{parCol:regDe(Dc.cle).parCol!==true})}]:[]); };
/* ── « Grouper par collaborateur » (Paulo, 26.11.2026 : « ajouter une option permettant de grouper les heures par collaborateur ») : rapport d'heures et rapport de
   frais. Présentation choisie par Paulo le même jour parmi 5 essais (« garde la variante 4 et crée le récapitulatif des heures collaborateur comme variante 5 ») :
   — d'abord le RÉCAPITULATIF PAR COLLABORATEUR (variante 5 « Fiche ») : au-dessus du tableau « Récapitulatif par collaborateur » en grand (gras 18 bleu nuit) et
     quatre chiffres (collaborateurs, heures ou montant, inscriptions ou notes de frais, période) ; tableau Collaborateur · Période · Inscriptions · Part du total ·
     Heures, total général sur bande ;
   — puis un CHAPITRE PAR COLLABORATEUR (variante 4 « Chapitres », comme les contrats), chacun sur une nouvelle page : au-dessus du tableau « n | NOM » en capitales
     grasses entre deux filets noirs, puis « heures · inscriptions · période » ; sur ses pages suivantes « (SUITE) » ; ses positions dans leur ordre, colonne
     Collaborateur retirée ; « Total <nom> » en gras à la fin.
   Collaborateurs du plus d'heures (ou de frais) au moins, « (sans collaborateur) » à la fin. Les autres essais : subgestion3/_backup_20261126_avant_variante4/. ── */
const colDe=Dc=>(Dc.cols||[]).findIndex(c=>un(c.t)==='Collaborateur');
const parCollaborateur=Dc=>{ const j=colDe(Dc), jT0=Dc.cols.findIndex(c=>/^(dur[ée]e|montant)$/i.test(un(c.t))); if(j<0||jT0<0) return Dc;
  const tl=!!(Dc.grouper&&Dc.grouper.tl), fmt=n=>tl?hrs(n):num(n), unite=tl?' h':' CHF', nC=Dc.cols.length-1, jT=jT0>j?jT0-1:jT0, sans=c=>c.filter((_,i)=>i!==j), vide=()=>Array.from({length:nC},()=>'');
  const G=new Map(); let cur=null;
  (Dc.rows||[]).forEach(r=>{ if(r.g==='t') return;
    if(r.g===''||!cur){ const k=un(r._k||r.c[j]).replace(/^[—–-]$/,''); if(!G.has(k)) G.set(k,{k,n:0,np:0,d:[],rows:[]}); cur=G.get(k); cur.n+=+r._n||0; cur.np++; if(r._d) cur.d.push(r._d); cur.rows.push(Object.assign({},r,{c:sans(r.c)})); return; }
    if(r.g==='x'){ const t=(r.c||[]).map(un).find(Boolean)||'', c=vide(); c[Math.min(1,nC-1)]=t; cur.rows.push(Object.assign({},r,{c})); return; }
    cur.rows.push(Object.assign({},r,{c:sans(r.c)})); });
  const L=[...G.values()].filter(g=>g.rows.length).sort((a,b)=>(!a.k)-(!b.k)||b.n-a.n||a.k.localeCompare(b.k,'fr'));
  const tot=L.reduce((a,g)=>a+g.n,0), totNp=L.reduce((a,g)=>a+g.np,0), perAll=dates(L.flatMap(g=>g.d));
  const nomDe=g=>g.k||'(sans collaborateur)', court=per=>sv(per).replace(/^du /,'').replace(' au ',' – '), pct=n=>tot?(Math.round(1000*n/tot)/10).toFixed(1)+' %':'';
  const lPos=tl?'Inscriptions':'Notes de frais', lVal=tl?'Heures':'Montant';
  /* chapitres : un par collaborateur, chacun sur une nouvelle page */
  const rows=[];
  L.forEach((g,i)=>{ const nom=nomDe(g), s=vide(); s[0]='Total '+nom; s[jT]=fmt(g.n);
    const e={forme:'chap',dy:2,num:String(i+1),nom,sous:[dates(g.d).replace(/^du /,'Du '),fmt(g.n)+unite].filter(Boolean).join(' · ')   /* sans le nombre d'inscriptions (26.11.2026, « supprimer ») ; période puis heures (même jour, « inverser ») */};
    rows.push(Object.assign({},g.rows[0],{saut:e}),...g.rows.slice(1),{c:s,g:'s'}); });
  /* récapitulatif par collaborateur, avant les chapitres (nombre d'inscriptions — tableau, chiffres, chapitres — et nombre de collaborateurs retirés le 26.11.2026 à la demande ; chiffres : période, heures ou montant) */
  const avant=L.length?[{cols:[{t:'Collaborateur'},{t:'Période'},{t:'Part du total',r:true},{t:lVal,r:true}],
    rows:L.map(g=>({c:[nomDe(g),court(dates(g.d)),pct(g.n),fmt(g.n)],g:''})).concat([{c:['Total','','100.0 %',fmt(tot)],g:'t'}])}]:[];
  if(avant.length) avant[0].rows[0].saut={forme:'fiche',dy:3,nom:'Récapitulatif par collaborateur',nc:3,chif:[['Période',court(perAll)],[lVal,fmt(tot)+unite]]};
  const meta=(Dc.meta||[]).slice();   /* plus de rubrique « Regroupement » sur la page de garde (26.11.2026, à la demande) */
  return Object.assign({},Dc,{cols:sans(Dc.cols),rows,meta,avant}); };
/* tableau prêt à être mis en page : colonnes de nombres à droite (T.droite), colonnes vides retirées — les couleurs de cellule (cc) suivent leurs colonnes */
const normaliser=T=>{ T.cols=(T.cols||[]).filter(Boolean); T.rows=T.rows||[]; const prendre=ord=>{ T.cols=ord.map(j=>T.cols[j]); T.rows=T.rows.map(r=>Object.assign({},r,{c:ord.map(j=>(r.c||[])[j])},Array.isArray(r.cc)?{cc:ord.map(j=>r.cc[j])}:{})); };
  /* T.droite : colonnes de nombres rangées à droite, dans leur ordre, chacune avec son unité (« Unité », « Monnaie ») — comme les montants du devis général et du
     contrôle des coûts ; le libellé d'un sous-total ou d'un total s'étend alors sur les colonnes de texte, à gauche des nombres */
  if(T.droite&&T.cols.length>2){ const N=T.cols.map((c,j)=>!!c.r||(j>0&&!!T.cols[j-1].r&&/^(unit[ée]|monnaie)$/i.test(un(c.t)))), ord=[...T.cols.map((c,j)=>j).filter(j=>!N[j]),...T.cols.map((c,j)=>j).filter(j=>N[j])];
    if(ord.some((j,i)=>j!==i)&&!N[0]) prendre(ord); }
  /* colonnes vides sur toutes les lignes (ouvrage, phase partielle… d'un projet qui n'en a pas) : retirées, la place va aux autres */
  if(T.rows.length){ const g=T.cols.map((c,j)=>j===0||T.rows.some(r=>un((r.c||[])[j])!=='')); if(g.some(x=>!x)) prendre(T.cols.map((c,j)=>j).filter(j=>g[j])); }
  return T; };
function ouvrir(Dc){ Dc=normaliser(Object.assign({},Dc)); Dc.titre=un(Dc.titre)||'Document'; Dc.cle=Dc.cle||Dc.titre; if(!Dc.cols.length) return false;
  Dc.suite=(Dc.suite||[]).map(t=>normaliser(Object.assign({},t))).filter(t=>t.cols.length);
  const dg=dialog({title:Dc.titre,body:h('div'),buttons:[]}), ifr={};
  const D={bd:dg.bd,iframe:ifr,close:dg.close,maj:r=>{ try{ if(ifr._sgVuePrep) ifr._sgVuePrep(); }catch(_){ }
    return Promise.resolve(r).then(oct=>{ if(ifr._sgVue) ifr._sgVue(new Blob([oct],{type:'application/pdf'})); },e=>{ console.error(e); if(ifr._sgVueErr) ifr._sgVueErr(e); }); }};
  SGDE.vue(D,{barre:'pdf',p:Dc.p||{},lb:Dc.lb||'Heures · Documents',titre:Dc.titre,etat:'',peut:()=>true,items:()=>reglages(Dc),rendre:()=>octets(Dc),pied:'Choix gardés sur ce poste',
    groupes:['Format','Affichage','Autres'],groupe:(x,G)=>x.grp&&G[x.grp]?x.grp:'Autres',rang:()=>0,retrait:x=>!!x.ind});
  D.maj(octets(Dc)); return true; }
/* ── l'écran ouvert est-il rangé dans Archives ? (ses documents ne changent pas) ── */
const archives=()=>{ try{ const v=typeof VIEW!=='undefined'&&VIEW?VIEW.id:'', x=typeof NX_VIEW!=='undefined'?NX_VIEW[v]:null; return !!(x&&x.d&&x.d.k==='archives'); }catch(_){ return false; } };
const cellule=(c,r)=>{ const d=document.createElement('div'); d.innerHTML=c.f?c.f(r):esc(r[c.k]); return un(d.textContent); };
const NUMT=/^(dur[ée]e|heures?|h\.|montant|quantit[ée]|prix|tarif|honoraires|co[uû]ts?|total|frais des|taux)/i;
const dates=L=>{ let a=null, b=null; L.forEach(d=>{ if(!d||isNaN(+d)) return; if(!a||d<a) a=d; if(!b||d>b) b=d; }); return a?(+a===+b?dfr(diso(a)):'du '+dfr(diso(a))+' au '+dfr(diso(b))):''; };
/* ── ctlPrint : « Rapport d'heures », « Rapport de frais » (liste des positions affichées ou choisies). La liste de l'écran a jusqu'à 14 colonnes (17 pour les frais) :
   telle quelle, le commentaire n'aurait que 64 pt et chaque position prendrait cinq lignes (193 pages pour les inscriptions de 99TST). Le document est composé comme
   une position du devis : une ligne par inscription — date, personne, prestation (colonne « Prestation » au lieu de « Activité » le 26.11.2026, à la demande de
   Paulo : « remplacer activité par prestation », puis « elle est censée montrer projet, maquette, image 3D » : l'ACTIVITÉ SEULE — Projet, Maquette, Image de
   synthèse, DT, Expertise… —, sans son groupe, « Affaire » pour les deux tiers des heures du bureau ; le groupe seulement s'il n'y a pas d'activité), ouvrage, phase, phase partielle,
   facturable, facturé, durée (sans l'horaire ni le statut, retirés le 26.11.2026 à la demande) — et son commentaire dessous, en gris italique, sur toute la largeur ; frais : date, collaborateur, genre de frais (groupe ›
   genre), n° de pièce, ouvrage, phase, phase partielle, statut, facturable, facturé, remboursable, quantité, unité, montant, monnaie, et la désignation dessous. Mêmes informations
   que la liste ; les colonnes vides sont retirées. Liste d'une autre forme (clés inconnues) : colonnes reprises telles quelles. ── */
const joint=(a,b)=>a&&b&&a!==b?a+' › '+b:(b||a||'');
const composer=(tl,C,V)=>{ const K=new Map(C.map(c=>[c.k,c])), a=k=>K.has(k), v=(k,r)=>a(k)?cellule(K.get(k),r):'';
  if(!a('d')||!a(tl?'TIMEPERIOD':'a')) return null;
  const D=tl?[['Date',r=>v('d',r),a('d')],['Collaborateur',r=>v('s',r),a('s')],['Prestation',r=>v('a',r)||v('ag',r),a('a')||a('ag')],
      ['Ouvrage',r=>v('o',r),a('o')],['Phase',r=>v('ph',r),a('ph')],['Phase partielle',r=>v('sp',r),a('sp')],['Facturable',r=>v('fa',r),a('fa')],['Facturé',r=>v('fd',r),a('fd')],['Durée',r=>v('TIMEPERIOD',r),true,1]]
    :[['Date',r=>v('d',r),a('d')],['Collaborateur',r=>v('pe',r),a('pe')],['Genre de frais',r=>joint(v('g',r),v('c',r)),a('g')||a('c')],['N° pièce',r=>v('DOCUMENTNUMBER',r),a('DOCUMENTNUMBER')],['Ouvrage',r=>v('o',r),a('o')],
      ['Phase',r=>v('ph',r),a('ph')],['Phase partielle',r=>v('sp',r),a('sp')],['Statut',r=>v('s',r),a('s')],['Facturable',r=>v('fa',r),a('fa')],['Facturé',r=>v('fd',r),a('fd')],['Remboursable',r=>v('rb',r),a('rb')],
      ['Quantité',r=>v('QUANTITY',r),a('QUANTITY'),1],['Unité',r=>v('UNIT',r),a('UNIT')],['Montant',r=>v('a',r),true,1],['Monnaie',r=>v('m',r),a('m')]];
  const U=D.filter(x=>x[2]), cols=U.map(x=>({t:x[0],r:!!x[3]})), rows=[], jT=U.findIndex(x=>x[0]===(tl?'Durée':'Montant'));
  V.forEach(r=>{ rows.push({c:U.map(x=>x[1](r)),g:'',_k:tl?v('s',r):v('pe',r),_n:tl?(+r.TIMEPERIOD||0):pcAmount(r),_d:(()=>{ try{ return tl?tlDate(r):pcDate(r); }catch(_){ return null; } })()}); const d=a('DESCRIPTION')?cellule(K.get('DESCRIPTION'),r):''; if(d&&cols.length>1){ const c=U.map(()=>''); c[1]='> '+d; rows.push({c,g:'x',debR:1});   /* « > » devant le commentaire (26.11.2026), comme les écritures du contrôle des coûts */ } });
  return {cols,rows,jT}; };
{ const p0=ctlPrint;
  ctlPrint=function(p,t,o){ if(archives()||!o||!Array.isArray(o.cols)||!Array.isArray(o.view)) return p0.apply(this,arguments);
    try{ const tl=t==='timelog', C=o.cols.filter(c=>c&&c.k!=='ty'), V=o.view, tot=V.reduce((a,r)=>a+(tl?+r.TIMEPERIOD||0:pcAmount(r)),0), val=tl?hrs(tot):num(tot);
      let X=composer(tl,C,V);
      if(!X){ const cols=C.map(c=>({t:sv(c.t),r:/(^|\s)r(\s|$)/.test(sv(c.cls))||NUMT.test(sv(c.t))})), jT=C.findIndex(c=>tl?c.k==='TIMEPERIOD'||/^dur[ée]e$/i.test(sv(c.t)):/^montant/i.test(sv(c.t))); X={cols,rows:V.map(r=>({c:C.map(c=>cellule(c,r)),g:''})),jT}; }
      if(V.length&&X.jT>0){ const c=X.cols.map(()=>''); c[0]='Total'; c[X.jT]=val; X.rows.push({c,g:'t'}); }
      const per=dates(V.map(r=>{ try{ return tl?tlDate(r):pcDate(r); }catch(_){ return null; } }));
      const meta=[['Période',per],[tl?'Total heures':'Total',V.length?val+(tl?' h':' CHF'):'']];
      if(ouvrir({cle:tl?'Rapport d’heures':'Rapport de frais',titre:tl?'Rapport d’heures':'Rapport de frais',p,meta,cols:X.cols,rows:X.rows,sous:per,format:'paysage',grouper:X.rows.some(r=>'_n' in r)?{tl}:null})) return; }catch(e){ console.error(e); }
    return p0.apply(this,arguments); }; }
/* ── ctlDocHTML : journal des heures, rapport des frais, récapitulatifs, rapport heures - facturation - coût de revient ── */
{ const d0=ctlDocHTML;
  ctlDocHTML=function(title,p,meta,cols,rows){ if(archives()||!Array.isArray(cols)||!Array.isArray(rows)) return d0.apply(this,arguments);
    try{ const hier=rows.some(r=>r&&r.k==='1')&&!rows.some(r=>r&&r.k==='g'), per=(meta||[]).find(m=>m&&/^filtre par date$/i.test(un(m[0])));
      if(ouvrir({cle:un(title),titre:un(title),p,meta:meta||[],cols:cols.map(c=>({t:sv(c.t),r:!!c.r})),rows:rows.map(r=>({c:(r.c||[]).map(v=>sv(v)),g:r.k||''})),hier,droite:true,sous:per?un(per[1]):''})) return; }catch(e){ console.error(e); }
    return d0.apply(this,arguments); }; }
/* ── mgPrint : « Rapports ▸ Afficher le rapport … » des écrans d'Administration (Temps de l'équipe, Suivi RH, Controlling, Clients, Types de projets, Indicateurs,
   Planification RH) — le tableau de l'écran (M : colonnes et lignes du moteur, mêmes nombres num(rJ)) au même graphisme : titre d'un bloc en bleu nuit, lignes
   en gras du moteur en gras, sous-lignes, « Total <nom> » en sous-total, dernier total sur bande bleu nuit, soldes en vert / rouge comme à l'écran ; champs du
   rapport (année, période, filtre, maître de l'ouvrage…) sur la page de garde. Temps de l'équipe : les trois tableaux du rapport d'origine (activités, phases,
   collaborateurs), l'un après l'autre. Modèle d'une autre forme : rapport d'avant. ── */
const CHAMPS={reportYear:'Année',year:'Année',timeFilter:'Période',filterDesc:'Filtre',project:'Projet',subProject:'Ouvrage',builderContact:'Maître de l’ouvrage',person:'Collaborateur',projectStateFilter:'Statut des projets',
  chargeableFilter:'Facturable',chargedFilter:'Facturé',referenceMonth:'Mois de référence',subProjectFilterDesc:'Ouvrages',subPhaseFilterDesc:'Phases'};
const mgTable=Mo=>{ const C=Mo.cols||[], vide=r=>!(r.c||[]).some(v=>v!=null&&String(v).trim()!==''), R=(Array.isArray(Mo.full)?Mo.full:Mo.rows).filter(r=>r&&!r.sp&&!vide(r)), dern=R.length-1;
  const rows=R.map((r,i)=>{ const brut=j=>(r.c||[])[j], c=C.map((col,j)=>{ const v=brut(j); if(typeof v==='number'&&!r.txt){ const x=rJ(v); return x==null||(col.zb&&!x)?'':num(x); } return v==null?'':sv(v); });
    const seul=un(c[0])!==''&&c.slice(1).every(x=>!un(x));   /* ligne en gras dont seule la première cellule est remplie = titre d'un bloc, comme à l'écran */
    const g=r.title||(r.b&&seul&&!r.tot)?'g':r.tot?((i===dern||/^Total(\s+[A-Z]{3})?$/.test(un(c[0])))?'t':'s'):r.lv2?'1':r.b?'b':'';
    const cc=C.map((col,j)=>{ const v=brut(j); if(typeof v!=='number'||r.txt||!col.col) return ''; const k=mgColor(col,rJ(v)); return k==='#008F00'?'vert':k==='#FF0000'?'rouge':k==='#FF9000'?'#D7860D':''; });
    return Object.assign({c,g},g!=='t'&&cc.some(Boolean)?{cc}:{}); }).filter(r=>r.c.some(x=>un(x)!==''));   /* lignes d'espacement du moteur (vides) : pas imprimées */
  return {cols:C.map(c=>({t:sv(c.t),r:!!c.r})),rows}; };
if(typeof mgPrint==='function'&&typeof mgColor==='function'){ const m0=mgPrint;
  mgPrint=function(type,title,fields,tables,Mo){ if(archives()||!Mo||!Array.isArray(Mo.cols)||!Mo.cols.length||!Array.isArray(Mo.rows)) return m0.apply(this,arguments);
    try{ const v=typeof VIEW!=='undefined'&&VIEW?VIEW.id:'', x=typeof NX_VIEW!=='undefined'?NX_VIEW[v]:null, ong=document.querySelector('#main>.sgmv-ong button.on');
      const titre=un(title)||(ong?un(ong.textContent):'')||(x&&x.it?un(x.it.t):'')||'Rapport';
      let p=null, T=mgTable(Mo), suite=[];
      if(type==='managementProjectTimeReport'&&typeof mghModels==='function'&&typeof MGH!=='undefined'){ p=MGH.pg.sel!=null?DS.get('project',MGH.pg.sel):null;
        if(p){ const MS=mghModels(p,+MGH.sg.sel||null); T=mgTable(MS.ac); suite=[mgTable(MS.ph),mgTable(MS.st)]; } }
      const meta=Object.entries(fields||{}).filter(([k,val])=>un(val)!=='').map(([k,val])=>[CHAMPS[k]||k,un(val)]), per=meta.find(m=>m[0]==='Période'||m[0]==='Année');
      if(ouvrir({cle:'rapport:'+type,titre,p,meta,cols:T.cols,rows:T.rows,suite,sous:per?per[1]:'',lb:((x&&x.d&&x.d.t)||'Administration')+' · Documents',type:'Rapport'})) return; }catch(e){ console.error(e); }
    return m0.apply(this,arguments); }; }
/* ── ch11aReport : « Rapports ▸ Afficher le rapport … » de Finances ▸ Contrats des projets (contrats, sous-traitants, échéancier, encaissements planifiés et reçus,
   situation) et Facturation des projets (vue d'ensemble de l'année, selon statut, par date, honoraires et frais) — demande de Paulo du 15.11.2026 : « adopter le même
   graphisme pour la section finances et ressources humaines ». Le tableau de l'écran (o.M : colonnes visibles, mêmes nombres num(rJ), dates déjà en clair) au
   graphisme des documents : ligne de titre d'un projet ou d'un contrat (k « info », première cellule seule) en bleu nuit, sous-totaux (k « sub », « tot ») en gras,
   dernier total sur bande bleu nuit ; période, année, jour de référence et contrat sur la page de garde ; projet du contrat choisi en tête. Plus de choix du modèle.
   Les entrées « … [Ancien document] » ne changent pas. ── */
if(typeof ch11aReport==='function'){ const r0=ch11aReport;
  ch11aReport=function(type,job,o){ const Mo=o&&o.M; if(archives()||!Mo||!Array.isArray(Mo.cols)||!Mo.cols.length||!Array.isArray(Mo.rows)) return r0.apply(this,arguments);
    try{ const C=Mo.cols, R=Mo.rows.filter(r=>r&&!r.sp&&r.k!=='vide'), dern=R.length-1, F=(job&&job.F)||{}, p=F.project&&F.project.p?F.project.p:null;
      const rows=R.map((r,i)=>{ const c=C.map((col,j)=>{ const v=(r.c||[])[j]; return typeof v==='number'?num(rJ(v)):v==null?'':sv(v); }), seul=un(c[0])!==''&&c.slice(1).every(x=>!un(x));
        return {c,g:r.k==='info'?(seul?'g':'b'):r.k==='sub'?'s':r.k==='tot'?(i===dern?'t':'s'):(r.b||r.lv)?'b':''}; });
      const meta=[], d=x=>x&&typeof x==='object'?x.v:x;
      if(un(F.filterDesc)) meta.push(['Période',un(F.filterDesc)]);
      if(un(F.year)) meta.push(['Année',un(F.year)]);
      if(d(F.reportingDate)) meta.push(['Jour de référence',dfr(d(F.reportingDate))]);
      if(un(F.projectContract)) meta.push(['Contrat',[un(F['projectContract~projectContractNumber']),un(F.projectContract)].filter(Boolean).join(' · ')+(un(F['projectContract~projectContractDate'])?' du '+un(F['projectContract~projectContractDate']):'')]);
      const per=meta.find(m=>m[0]==='Période'||m[0]==='Année');
      if(ouvrir({cle:'rapport:'+type,titre:un(o.titre)||'Rapport',p,meta,cols:C.map(c=>({t:sv(c.t),r:!!c.r})),rows,sous:per?per[1]:'',lb:'Finances · Documents',type:'Rapport'})) return Promise.resolve(null); }catch(e){ console.error(e); }
    return r0.apply(this,arguments); }; }
/* ── sgDocTableau : un tableau affiché (table.nx-tbl) repris tel quel dans un document — titres, lignes, totaux (tr.tot ou « Total… » : le dernier sur bande bleu
   nuit, les précédents en gras), sous-lignes (tr.sub), colonnes de boutons écartées. o.titreTable : intertitre en tête du tableau ; o.suite = [{table, titre}] :
   autres tableaux de la page, chacun sur une nouvelle page avec ses colonnes et son intertitre (Occupation et effectif : taux d'occupation, charge du mois,
   échéances). ── */
const lireTable=(tb,titre)=>{ if(!tb||!tb.querySelector) return null;
  const TH=[...tb.querySelectorAll('thead tr')].pop()||[...tb.querySelectorAll('tr')].find(tr=>tr.querySelector('th')), H=TH?[...TH.children]:[]; if(!H.length||H.some(x=>x.colSpan>1)) return null;
  const txt=td=>{ if(!td) return ''; const k=td.cloneNode(true); k.querySelectorAll('.nx-mini-bar,svg,button,.sg-noimp').forEach(x=>x.remove()); k.querySelectorAll('br').forEach(x=>x.replaceWith(' · ')); return un(k.textContent); };
  const TR=[...tb.querySelectorAll('tr')].filter(tr=>tr!==TH&&!tr.closest('thead')&&tr.children.length>=H.length-1&&getComputedStyle(tr).display!=='none');
  /* colonnes sans titre et sans texte (boutons, barres) : écartées */
  const garde=H.map((x,j)=>j).filter(j=>!H[j].classList.contains('sg-noimp')&&!(un(H[j].textContent)===''&&!TR.some(tr=>txt(tr.children[j]))));
  const droite=j=>{ const a=getComputedStyle(H[j]).textAlign; if(a==='right'||a==='end') return true; const c=TR.map(tr=>tr.children[j]).filter(Boolean)[0]; if(!c) return false; const b2=getComputedStyle(c).textAlign; return b2==='right'||b2==='end'; };
  const cols=garde.map(j=>({t:un(H[j].textContent),r:droite(j)}));
  const rows=TR.map(tr=>{ const c=garde.map(j=>txt(tr.children[j])), tot=tr.classList.contains('tot')||/^total\b/i.test(c[0]||''); return {c,g:tot?'t':tr.classList.contains('sub')?'1':''}; });
  const T=rows.filter(r=>r.g==='t'); T.slice(0,-1).forEach(r=>{ r.g='s'; });   /* plusieurs lignes de total (« Effectif », « Équivalents plein temps ») : la dernière seule sur bande */
  if(un(titre)) rows.unshift({c:cols.map((_,k)=>k?'':un(titre)),g:'g'});
  return {cols,rows,hier:rows.some(r=>r.g==='1')}; };
function sgDocTableau(o){ try{ const T=lireTable(o&&o.table,o&&o.titreTable); if(!T) return false;
    const suite=((o&&o.suite)||[]).map(x=>lireTable(x&&x.table,x&&x.titre)).filter(Boolean);
    return ouvrir({cle:o.cle||un(o.titre),titre:o.titre,p:o.p||null,meta:o.meta||[],cols:T.cols,rows:T.rows,hier:T.hier,suite,sous:o.sous||'',lb:o.lb||'Heures · Documents',format:o.format,type:o.type});
  }catch(e){ console.error(e); return false; } }
window.sgDocTableau=sgDocTableau;
window.SGDH={octets,ouvrir,reglages,rubriques,regDe,regSet,sgDocTableau};
})();

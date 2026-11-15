/* ═══ 54. En-tête de l'app au-dessus des écrans de l'ancien logiciel (refonte d'ensemble, lot 3, 15.11.2026) ═══
   Demande de Paulo du 15.11.2026 : « refonte complète de l'app pour avoir une cohérence des éléments de l'app identique aux éléments définis dans l'app notamment dans
   devis » ; ordre des lots accepté (« Oui, cet ordre ») : après les en-têtes des pages de l'app, les écrans de l'ancien logiciel, chapitre par chapitre.
   Depuis le 15.11.2026 au soir, les trois listes des membres de l'équipe ont leur propre page (fin du fichier) et ne sont plus dans LISTE.
   Première étape, commune à tous : ces écrans (LISTE) reçoivent le bandeau des listes — monogramme, chapitre, titre et présentation repris du menu (SG_DOM : t, d,
   grp), chiffres quand ils sont simples (CHIFFRES) — par sgTete (sg3.js). Le bandeau est posé AU-DESSUS de la barre contextuelle (#sg-mv, avant #nx-sub), hors de
   #main : le moteur vide et redessine #main à sa guise, rien n'y est ajouté ; ordre de la page = bandeau, chiffres, barre d'outils, contenu, comme les listes de l'app.
   Les écrans gardent leurs fonctions et leurs données ; leur contenu (colonnes, tableaux) sera repris chapitre par chapitre. Pas ici : Archives, Estimations
   (liste et document ouvert à refaire ensemble), écrans de Facturation, pages déjà réglées avec Paulo (Mes projets, Liste des affaires, Annuaire, Liste des adresses). */
(function(){
if(typeof go!=='function'||typeof NX_VIEW==='undefined'||typeof sgTete!=='function') return;
const LISTE=new Set(['mg-heures','mg-planning','mg-collab','mg-controlling','mg-contrats','mg-factures','fact-controle','mg-mo','mg-reporting','mg-genres',
  'tpl-documents','tpl-projectTemplates','tpl-staffTemplates','tpl-timeTemplates','tpl-expensesTemplates','tpl-managementTemplates','tpl-addressTemplates','tpl-labelTemplates','config']);
const fig=(v,t)=>'<div class="sg-fig"><div class="n">'+nxE(String(v))+'</div><div class="t">'+nxE(t)+'</div></div>';
const isoJ=v=>{ if(v==null||v==='') return ''; if(typeof v==='number') return new Date(v).toISOString().slice(0,10); return String(v).slice(0,10); };
/* chiffres simples, lus dans la base à chaque dessin */
const modeles=()=>{ let n=0; try{ n=Object.values((DS.T&&DS.T.modeledocument)||{}).filter(v=>v&&(v.langue==='fr'||!v.langue)).length; }catch(_){ } return n?fig(n,'documents types'):''; };
const CHIFFRES={'tpl-documents':modeles};   /* les trois listes des tâches (sg3_suivi.js) et les trois listes des membres (plus bas) ont leur propre page depuis le 15.11.2026 */
const hote=()=>{ let h=document.getElementById('sg-mv'); if(!h){ const sub=document.getElementById('nx-sub'); if(!sub||!sub.parentNode) return null; h=document.createElement('div'); h.id='sg-mv'; sub.parentNode.insertBefore(h,sub); } return h; };
let cle='';
const maj=()=>{ const h=hote(); if(!h) return; const v=typeof VIEW!=='undefined'&&VIEW?VIEW.id:'', x=LISTE.has(v)?NX_VIEW[v]:null, m=document.getElementById('main');
  const ok=!!(x&&x.it&&m&&!m.querySelector('.sgfh-tete,.sg-tete,.sg-intro'));
  if(!ok){ if(h.firstChild){ h.textContent=''; } cle=''; document.documentElement.removeAttribute('data-vep'); return; }
  document.documentElement.setAttribute('data-vep','1');   /* présentation épurée de l'écran (styles html[data-vep] de sg3.css) */
  let f=''; try{ f=CHIFFRES[v]?CHIFFRES[v]():''; }catch(e){ console.error(e); }
  const k=v+'|'+f; if(k===cle&&h.firstChild) return; cle=k;
  h.innerHTML='<div class="sgmv">'+sgTete([x.d&&x.d.t,x.it.grp].filter(Boolean).join(' · '),nxE(x.it.t||''),nxE(x.it.d||''),f?'<div class="sg-figs">'+f+'</div>':'')+'</div>'; };
{ const g0=go; go=function(){ const r=g0.apply(this,arguments); try{ maj(); }catch(e){ console.error(e); } setTimeout(()=>{ try{ maj(); }catch(_){ } },0); return r; }; }
try{ DS.on(()=>{ setTimeout(()=>{ try{ maj(); }catch(_){ } },0); }); }catch(_){ }
/* ── Page du projet : domaines de l'ancien logiciel encore sans bandeau (Intervenants, Soumissionnaires, Liste d'adresses, Calcul des coûts) — même étape du lot 3 :
   bandeau du projet (numéro, domaine, désignation, maître de l'ouvrage) et chiffres simples au-dessus du domaine, comme les autres modules de la page du projet ; le
   domaine du moteur est dessiné dessous, dans son propre conteneur (.sgmv-corps), avec la présentation épurée. Seulement dans la page du projet (nx-pdom) : le chapitre
   Affaires et les Archives gardent l'écran d'origine. ── */
const DOMS={'Intervenants':p=>{ let M=[]; try{ M=DS.by('projectmember','PROJECT_ID',p.ID); }catch(_){ } return fig(M.length,'intervenants')+fig(M.filter(x=>+x.TEAMROLECODE===19).length,'entreprises'); },
  'Soumissionnaires':p=>{ let n=0; try{ n=DS.by('projecttenderer','PROJECT_ID',p.ID).length; }catch(_){ } return fig(n,'soumissionnaires'); },
  'Liste d’adresses':null};   /* « Calcul des coûts » : liste des estimations au graphisme de l'app depuis le 15.11.2026 (sg3_estimation.js), avec son propre bandeau */
if(typeof domainView==='function'&&window.SGSV&&SGSV.outils){ const dv0=domainView;
  domainView=function(C,p,dom){ let ok=false; try{ ok=!!(C&&p&&Object.prototype.hasOwnProperty.call(DOMS,dom)&&typeof VIEW!=='undefined'&&VIEW&&VIEW.id==='nx-pdom'); }catch(_){ }
    if(!ok) return dv0.apply(this,arguments);
    const {tete,moT,css}=SGSV.outils; try{ css&&css(); }catch(_){ }
    let f=''; try{ f=DOMS[dom]?DOMS[dom](p):''; }catch(e){ console.error(e); }
    C.innerHTML=''; const hd=document.createElement('div'); hd.className='sgmv-dom';
    hd.innerHTML=sgTete(dom,nxE(p.TITLE||p.NUMBER||''),moT(p)?'Maître de l’ouvrage : '+nxE(moT(p)):'',f?'<div class="sg-figs">'+f+'</div>':'',p.NUMBER||'');
    const corps=document.createElement('div'); corps.className='sgmv-corps'; C.append(hd,corps);
    return dv0.call(this,corps,p,dom); }; }

/* ── Équipe ▸ Membres, Tous les membres, Anciens membres (collab-actuels, collab-tous, collab-anciens ; lot 3, 15.11.2026) : la liste du moteur (barre d'icônes + grille)
   devient la page des listes de l'app (SGSV.outils.monter) — bandeau, chiffres (membres actuels, anciens, arrivées et départs de l'année), choix Actuels · Tous · Anciens
   (= les trois entrées du menu, selon les droits), recherche, tableau (initiales, membre et fonction, appartient à, téléphones, courriel, engagement, départ, heures
   bloquées jusqu'au). Un clic = fiche du membre (nx-collab) ; clic droit = les fonctions de la barre du moteur pour ce membre : Modifier, Coût de revient, Durée prévue,
   Vacances, Disponibilité, Verrouillage des heures, Courriel, Supprimer (mêmes fenêtres : editStaff, staffRates, staffTargets, staffHolidays, staffProjectTimes,
   staffFreeze, mailList, delStaff ; mêmes droits de l'ancien logiciel staffNew / staffEdit / staffDelete, et droit « équipe : taux » du profil) ; ⋯ : courriel aux
   membres affichés, copie, CSV. Ordre du moteur (SORTORDER). DeltaSub.html seul garde l'écran d'origine. ── */
if(window.SGSV&&SGSV.outils&&typeof VIEWS!=='undefined'&&VIEWS['collab-actuels']&&typeof editStaff==='function'){
  const {monter,tete,kpi,btn,menuSous,E,pl,trouve}=SGSV.outils;
  const FIL={'collab-actuels':['Actuels','Membres',s=>!!+s.ISACTIVE],'collab-tous':['Tous','Tous les membres',()=>true],'collab-anciens':['Anciens','Anciens membres',s=>!+s.ISACTIVE]};
  const BES=['staff','contact','contactowner','appuser_staff'];
  const pers=s=>DS.get('contact',s.PERSON_ID)||{};
  const peutEq=k=>{ try{ return (sgAdmin()||sgDroit('equipe','taux'))&&(typeof ch08aCan!=='function'||ch08aCan(k)); }catch(_){ return false; } };
  const vueOk=v=>{ try{ return typeof sgVueOk!=='function'||sgVueOk(v); }catch(_){ return true; } };
  const tel=(c,n)=>{ try{ return phone(c,n)||''; }catch(_){ return ''; } }, app=c=>{ try{ return ownerName(relOf(c),true)||''; }catch(_){ return ''; } };
  const colsX=[{k:'n',t:'Collaborateur',f:s=>E(staffName(s))},{k:'fn',t:'Fonction',f:s=>E(pers(s).COMPANYROLE||'')},{k:'INITIALS',t:'Abréviation'},{k:'rel',t:'Appartient à',f:s=>E(app(pers(s)))},
    {k:'tel',t:'Téléphone',f:s=>E(tel(pers(s),1))},{k:'mob',t:'Téléphone mobile',f:s=>E(tel(pers(s),2))},{k:'mail',t:'Courriel',f:s=>E(pers(s).EMAIL1||'')},{k:'JOININGDATE',t:'Engagement',f:s=>E(dfr(s.JOININGDATE))},{k:'QUITTINGDATE',t:'Départ',f:s=>E(dfr(s.QUITTINGDATE))}];
  const EQUIPE={
    rendre(I){ const u=I.u, v=I.p.VUE, f=FIL[v]||FIL['collab-actuels'], A=DS.all('staff'), y=String(new Date().getFullYear());
      const base=A.filter(f[2]).sort((a,b)=>cmp(+a.SORTORDER||0,+b.SORTORDER||0)||cmp(staffName(a),staffName(b)));
      const L=base.filter(s=>{ const c=pers(s); return trouve(u.q,staffName(s),s.INITIALS,c.COMPANYROLE,c.EMAIL1,tel(c,1),tel(c,2),app(c)); }); I.R=L;
      const nA=A.filter(s=>+s.ISACTIVE).length, an=x=>isoJ(x).slice(0,4)===y, dep=v!=='collab-actuels'||L.some(s=>s.QUITTINGDATE), VV=Object.keys(FIL).filter(vueOk);
      const acts=(peutEq('staffNew')?btn('new','Nouveau membre','plus',1):'')+'<button class="nx-btn" data-a="menu" title="Courriel, copier, exporter" aria-label="Courriel, copier, exporter">⋯</button>';
      return '<div class="sgsv">'+tete('ÉQ','Équipe',f[1],pl(base.length,'membre'),acts)
        +'<div class="nx-kpis sgsv-kp">'+kpi('Membres actuels',String(nA),'')+kpi('Anciens membres',String(A.length-nA),'')+kpi('Arrivées '+y,String(A.filter(s=>an(s.JOININGDATE)).length),'')+kpi('Départs '+y,String(A.filter(s=>an(s.QUITTINGDATE)).length),'')+'</div>'
        +'<div class="sgsv-fil">'+(VV.length>1?VV.map(k=>'<button data-a="vue" data-v="'+k+'" class="'+(k===v?'on':'')+'" aria-pressed="'+(k===v)+'">'+E(FIL[k][0])+'</button>').join(''):'')   /* une seule liste permise (collaborateur, chef de projet) : pas de choix */
        +'<span class="dr"><input class="inp" data-q type="search" style="width:240px" placeholder="Rechercher un membre" aria-label="Rechercher un membre" value="'+E(u.q||'')+'"></span></div>'
        +(L.length?'<table class="nx-tbl sgsv-tb sgmv-eq"><thead><tr><th class="sg-notri"></th><th>Membre</th><th>Appartient à</th><th>Téléphone</th><th>Mobile</th><th>Courriel</th><th>Engagement</th>'+(dep?'<th>Départ</th>':'')+'<th>Heures bloquées</th></tr></thead><tbody>'
          +L.map(s=>{ const c=pers(s), fn=c.COMPANYROLE||'';
            return '<tr data-a="open" data-s="'+E(s.ID)+'"'+(+s.ISACTIVE?'':' class="anc"')+'><td><span class="sgsv-ini">'+E(s.INITIALS||'—')+'</span></td><td><b>'+E(staffName(s))+'</b>'+(fn?'<span class="sgsv-sous">'+E(fn)+'</span>':'')+'</td><td class="nw">'+E(app(c))+'</td>'
              +'<td class="nw">'+E(tel(c,1))+'</td><td class="nw">'+E(tel(c,2))+'</td><td>'+E(c.EMAIL1||'')+'</td><td class="nw">'+E(dfr(s.JOININGDATE))+'</td>'+(dep?'<td class="nw">'+E(dfr(s.QUITTINGDATE))+'</td>':'')
              +'<td class="nw">'+(+s.ISTIMELOGFROZEN&&s.TIMELOGFREEZINGDATE?'jusqu’au '+E(dfr(s.TIMELOGFREEZINGDATE)):'')+'</td></tr>'; }).join('')+'</tbody></table>'
          :'<p class="sgsv-rien">'+(u.q?'Aucun membre trouvé.':'Aucun membre dans cette liste.')+'</p>')+'</div>'; },
    action(I,a,tg,e){ const s=tg.dataset.s?DS.get('staff',tg.dataset.s):null;
      if(a==='open'){ if(s&&!(e&&e.detail>1)) go('nx-collab',s.ID); }
      else if(a==='new'){ if(peutEq('staffNew')) editStaff(); }
      else if(a==='vue'){ const v=tg.dataset.v; if(FIL[v]&&(typeof VIEW==='undefined'||!VIEW||VIEW.id!==v)) go(v); }
      else if(a==='menu'){ const L=I.R||[], g=()=>({cols:colsX,view:L});
        menuSous(tg,[{t:'Courriel aux membres affichés …',dis:!L.length,fn:()=>mailList(L.map(pers).filter(c=>c&&c.ID!=null))},'-',{t:'Copier le tableau',dis:!L.length,fn:()=>copyTable(g())},{t:'Exporter le tableau dans un fichier CSV …',dis:!L.length,fn:()=>csvTable(g(),'Collaborateurs')}]); } },
    ctx(I,tg,e){ if(tg.dataset.a!=='open') return false; const s=DS.get('staff',tg.dataset.s); if(!s) return false; const ed=peutEq('staffEdit'), c=pers(s);
      sgMenuAt(e.clientX,e.clientY,[{t:'Fiche du membre',fn:()=>go('nx-collab',s.ID)},
        ...(ed?[{t:'Modifier le membre …',fn:()=>editStaff(s)},'-',{t:'Coût de revient …',fn:()=>staffRates(s)},{t:'Durée prévue …',fn:()=>staffTargets(s)},{t:'Vacances …',fn:()=>staffHolidays(s)},{t:'Disponibilité …',fn:()=>staffProjectTimes(s)},{t:'Verrouillage des heures …',fn:()=>staffFreeze([s])}]:[]),
        '-',{t:'Courriel …',dis:!c.EMAIL1,fn:()=>mailList([c])},
        ...(peutEq('staffDelete')?['-',{t:'Supprimer le membre …',danger:true,fn:()=>delStaff(s)}]:[])]); return true; } };
  Object.keys(FIL).forEach(v=>{ VIEWS[v]={render(m){ monter(m,{ID:'equipe',GLOBAL:1,VUE:v,NUMBER:'',TITLE:''},'equipe',BES,EQUIPE); },refresh(){ }}; });
  window.SGMV_EQ=EQUIPE; }
window.SGMV={LISTE,maj,DOMS};
})();


/* ═══ 23. Annuaire : fiche pleine page et liste escamotable (proposition D, choisie par Paulo le 21.10.2026) ═══════════════════════════
   Contacts ▸ Annuaire (adr-entites) et Fiche contact (nx-contact) : la fiche du contact en pleine page, au graphisme du tableau de bord du
   projet (en-tête jaune pâle au grand monogramme, actions en tuiles à icône, onglets soulignés, tuiles, cartes). La liste des contacts
   s'ouvre par-dessus (bouton « Contacts », touche /) et se referme après le choix ; ‹ › (⌥↑ ⌥↓) passent au contact précédent / suivant de
   la liste filtrée. Menus : « Nouveau contact » (Société, Personne…), « Plus » classé par sujet ; clic droit sur un contact de la liste :
   le même menu. Mêmes fonctions et mêmes droits que l'écran d'origine du moteur (editOwner, editContact, bankDlg, delOwner, delContact,
   ownerInfo, pickOwner, addToGroup, pickProps… ; ch08aCan contactNew / contactEdit / contactDelete / contactExport et profil « contacts :
   écriture »). État : SGA (contact, onglet, filtres de la liste), gardé dans sg3_annu_*. */
const SGA={id:nxLS.get('sg3_annu_id',null),onglet:nxLS.get('sg3_annu_onglet','vue'),type:nxLS.get('sg3_annu_type','tous'),role:nxLS.get('sg3_annu_role','tous'),q:'',hid:false,tiroir:false,scroll:0};
const SGA_TYPES=[['tous','Tous','contacts',()=>true],['societe','Sociétés','building',o=>+o.TYPECODE===0],['personne','Personnes','person',o=>+o.TYPECODE===1],['autres','Autres','users',o=>+o.TYPECODE>1]];
const SGA_ROLES=[['tous','Tous',null],['mo','Maître d’ouvrage',/ma[iî]tre d.?ouvrage/i],['ent','Entreprise',/entreprise/i],['arch','Architecte',/architecte/i],['dt','Direction des travaux',/direct(eur|ion) des travaux/i]];
const SGA_ICO_T=['building','person','home','group','users'];   /* icônes de OWNER_T : Société, Personne, Famille, Communauté, Association */
const sgaNorm=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
function sgaPeut(k){ try{ if(typeof ch08aCan==='function'&&!ch08aCan(k)) return false; }catch(_){}
  try{ if(k!=='contactExport'&&typeof sgDroit==='function'&&!sgDroit('contacts','ecriture')) return false; }catch(_){} return true; }
/* index de la base : adresses par entité, adresses rattachées à une entité (personnes d'une société…), rôles et projets par entité */
function sgaIndex(){ const byO=new Map(), byC=new Map(), rel=new Map(), roles=new Map(), prj=new Map(), hay=new Map(), push=(m,k,v)=>(m.get(k)||m.set(k,[]).get(k)).push(v), add=(m,k,v)=>(m.get(k)||m.set(k,new Set()).get(k)).add(v);
  DS.all('contact').forEach(c=>{ const k=String(c.CONTACTOWNER_ID); byC.set(String(c.ID),c); push(byO,k,c); if(c.CONTACTRELATION_ID!=null&&String(c.CONTACTRELATION_ID)!==k) push(rel,String(c.CONTACTRELATION_ID),c); });
  DS.all('projectmember').forEach(m=>{ const c=byC.get(String(m.CONTACT_ID)); if(!c) return; const r=teamRole(m.TEAMROLECODE);
    [String(c.CONTACTOWNER_ID),...(c.CONTACTRELATION_ID!=null?[String(c.CONTACTRELATION_ID)]:[])].forEach(k=>{ if(r) add(roles,k,r); add(prj,k,String(m.PROJECT_ID)); }); });
  return {byO,byC,rel,roles,prj,hay}; }
const sgaNom=o=>ownerName(o)||'(sans nom)';
const sgaTri=o=>sgaNorm(+o.TYPECODE===1?[o.NAME1,o.NAME2].filter(Boolean).join(' '):ownerName(o)).replace(/^[^a-z0-9]+/,'');
const sgaLettre=o=>{ const c=sgaTri(o).charAt(0).toUpperCase(); return /[A-Z]/.test(c)?c:'#'; };
const sgaMono=o=>{ if(+o.TYPECODE===1) return nxIni([o.NAME2,o.NAME1].filter(Boolean).join(' '));
  const w=String(ownerName(o)).split(/[\s\-–/&,.()']+/).filter(x=>x&&/^[\p{L}\d]/u.test(x)&&!/^(sa|sàrl|sarl|ag|gmbh|de|du|des|la|le|les|l|d|et|und|en|à)$/i.test(x));
  return (w.length?w[0][0]+(w[1]?w[1][0]:(w[0][1]||'')):'?').toUpperCase(); };
/* adresses d'une entité : visibles d'abord, propres avant rattachées, principale (type 0) en tête */
const sgaAdrs=(ix,o)=>(ix.byO.get(String(o.ID))||[]).slice().sort((a,b)=>(+a.ISHIDDEN||0)-(+b.ISHIDDEN||0)||(a.CONTACTRELATION_ID!=null?1:0)-(b.CONTACTRELATION_ID!=null?1:0)||(+a.ADDRESSTYPECODE||0)-(+b.ADDRESSTYPECODE||0)||cmp(a.ID,b.ID));
const sgaCfc=(ix,o)=>[...new Set((ix.byO.get(String(o.ID))||[]).map(c=>c.BKP).filter(Boolean))];
const sgaRoles=(ix,o)=>[...(ix.roles.get(String(o.ID))||[])];
function sgaHay(ix,o){ const k=String(o.ID); let s=ix.hay.get(k); if(s!=null) return s; const cs=ix.byO.get(k)||[];
  s=sgaNorm([ownerName(o),o.NAME1,o.NAME2,o.UID,...cs.flatMap(c=>[c.NAME1,c.NAME2,c.NAME3,c.STREET,c.POSTALCODE,c.LOCATION,c.BKP,c.EMAIL1,c.COMPANYROLE,c.PROFESSION]),
    ...(ix.rel.get(k)||[]).map(c=>ownerName(DS.get('contactowner',c.CONTACTOWNER_ID)))].filter(Boolean).join(' ')); ix.hay.set(k,s); return s; }
/* liste filtrée (type, rôle, recherche, masqués) et triée */
function sgaListe(ix,type){ const ty=(SGA_TYPES.find(t=>t[0]===(type||SGA.type))||SGA_TYPES[0])[3], ro=(SGA_ROLES.find(r=>r[0]===SGA.role)||SGA_ROLES[0])[2], q=sgaNorm(SGA.q).trim().split(/\s+/).filter(Boolean);
  return DS.all('contactowner').filter(o=>(SGA.hid||!+o.ISHIDDEN)&&ty(o)&&(!ro||sgaRoles(ix,o).some(r=>ro.test(r)))&&(!q.length||(t=>q.every(w=>t.includes(w)))(sgaHay(ix,o))))
    .sort((a,b)=>sgaTri(a).localeCompare(sgaTri(b),'fr')); }
function sgaFiltreLib(){ const t=SGA_TYPES.find(x=>x[0]===SGA.type), r=SGA_ROLES.find(x=>x[0]===SGA.role);
  return [SGA.type!=='tous'&&t?t[1]:'',SGA.role!=='tous'&&r?'rôle : '+r[1]:'',SGA.q.trim()?'« '+SGA.q.trim()+' »':'',SGA.hid?'masqués compris':''].filter(Boolean).join(' · ')||'ordre alphabétique'; }
/* ce que montre la fiche */
const sgaPersonnes=(ix,o)=>(ix.rel.get(String(o.ID))||[]).map(c=>({c,o:DS.get('contactowner',c.CONTACTOWNER_ID)})).filter(x=>x.o&&(SGA.hid||!+x.o.ISHIDDEN)).sort((a,b)=>sgaTri(a.o).localeCompare(sgaTri(b.o),'fr'));
function sgaProjets(ix,o){ const own=new Set((ix.byO.get(String(o.ID))||[]).map(c=>String(c.ID))), via=new Map((ix.rel.get(String(o.ID))||[]).map(c=>[String(c.ID),c])), out=new Map();
  DS.all('projectmember').forEach(m=>{ const k=String(m.CONTACT_ID); if(!own.has(k)&&!via.has(k)) return; const p=DS.get('project',m.PROJECT_ID); if(!p) return;
    const e=out.get(String(p.ID))||{p,r:new Set(),bkp:new Set(),fn:new Set(),via:new Set()}; out.set(String(p.ID),e); const r=teamRole(m.TEAMROLECODE);
    if(r) e.r.add(r); if(m.BKP) e.bkp.add(m.BKP); if(m.PROJECTROLE) e.fn.add(m.PROJECTROLE); if(m.PROJECTDIVISION) e.fn.add(m.PROJECTDIVISION);
    if(via.has(k)) e.via.add(ownerName(DS.get('contactowner',via.get(k).CONTACTOWNER_ID))); });
  return [...out.values()].sort((a,b)=>String(b.p.NUMBER||'').localeCompare(String(a.p.NUMBER||''),'fr',{numeric:true})); }
const sgaSoum=cs=>cs.flatMap(c=>DS.by('projecttenderer','CONTACT_ID',c.ID)).map(t=>({t,p:DS.get('project',t.PROJECT_ID)})).filter(x=>x.p).sort((a,b)=>String(b.p.NUMBER||'').localeCompare(String(a.p.NUMBER||''),'fr',{numeric:true}));
const sgaNotes=cs=>cs.flatMap(c=>DS.by('contactnote','CONTACT_ID',c.ID).filter(n=>+n.ISPUBLIC||n.OWNER===ME.id).map(n=>({n,c}))).sort((a,b)=>cmp(b.n.CHANGEDDATE,a.n.CHANGEDDATE));
const sgaProps=cs=>cs.flatMap(c=>contactProps(c).map(p=>({p,c})));
const sgaAdrLib=c=>(ADR_T[c.ADDRESSTYPECODE]||'Adresse')+(c.LOCATION?' · '+c.LOCATION:'');
function sgaTelHref(c,i){ const n=nxPhone(c,i); if(!n) return ''; const d=n.replace(/[^\d+]/g,''), cc=String(c['PHONECOUNTRY'+i]||'').replace(/\D/g,''); return 'tel:'+(cc&&!d.startsWith('+')?'+'+cc+d.replace(/^0/,''):d); }
const sgaCarte=c=>'https://map.search.ch/'+encodeURIComponent([c.STREET,locality(c)].filter(Boolean).join(', '));
const sgaWeb=u=>/^https?:/i.test(u)?u:'https://'+u;
const sgaAv=o=>+o.TYPECODE===1?'<span class="sga-av p">'+nxE(sgaMono(o))+'</span>':'<span class="sga-av">'+nxE(sgaMono(o))+'</span>';
const sgaTuile=(fn,ico,l,v,ti)=>'<div class="nx-kpi'+(fn?' lnk':'')+'"'+(fn?' data-fn="'+fn+'"':'')+(ti?' title="'+nxE(ti)+'"':'')+'><div class="l">'+nxSvg(ico)+nxE(l)+'</div><div class="v">'+v+'</div></div>';
const sgaBtn=(fn,ico,t,ti,data)=>'<button data-fn="'+fn+'"'+(data||'')+(ti?' title="'+nxE(ti)+'"':'')+'>'+nxSvg(ico)+'<span>'+nxE(t)+'</span></button>';
/* ── en-tête de la fiche ── */
function sgaEntete(ix,o,c0,prj){ const cs=ix.byO.get(String(o.ID))||[], ids=new Set(cs.map(c=>String(c.ID))), st=DS.all('staff').find(s=>ids.has(String(s.PERSON_ID)));
  const rel=c0&&c0.CONTACTRELATION_ID!=null&&String(c0.CONTACTRELATION_ID)!==String(o.ID)?DS.get('contactowner',c0.CONTACTRELATION_ID):null;
  const R=sgaRoles(ix,o).filter(r=>!/collaborateur/i.test(r)), cfc=sgaCfc(ix,o), der=prj[0], tel=c0&&(sgaTelHref(c0,1)||sgaTelHref(c0,2)), mail=c0&&c0.EMAIL1, adr=c0&&(c0.STREET||c0.LOCATION);
  const l2=[R.length?nxE(R.join(', ')):'',cfc.length?'<b>CFC '+cfc.map(nxE).join(', ')+'</b>':'',st?'<span class="nx-tag num sga-lien" data-ref="s:'+st.ID+'">Membre de l’équipe</span>':'',der?'Dernier projet : <b>'+nxE(der.p.NUMBER||der.p.TITLE||'')+'</b>':''].filter(Boolean);
  return '<div class="nx-hero sga-hero"><div class="sg-pnum" title="'+nxE(OWNER_T[o.TYPECODE]||'Contact')+'">'+nxE(sgaMono(o))+'</div><div class="tx"><h2>'+nxE(sgaNom(o))+'</h2>'
    +'<div class="meta"><span class="nx-tag">'+nxE(OWNER_T[o.TYPECODE]||'Contact')+'</span>'+(+o.ISHIDDEN?'<span class="nx-tag urg">Masqué dans les listes</span>':'')
    +(c0&&c0.LOCATION?'<span>'+nxSvg('map')+nxE(c0.LOCATION)+'</span>':'')+(rel?'<span class="sga-lien" data-ref="c:'+rel.ID+'" title="Ouvrir la fiche">'+nxSvg('building')+nxE(ownerName(rel))+'</span>':'')
    +(o.UID?'<span>IDE '+nxE(o.UID)+'</span>':'')+(o.CREATED?'<span>'+nxSvg('cal')+'Dans l’annuaire depuis '+nxE(String(o.CREATED).slice(0,4))+'</span>':'')+'</div>'
    +(l2.length?'<div class="sga-meta2">'+l2.join('<span class="sga-pt">·</span>')+'</div>':'')+'</div>'
    +'<div class="sg-htls sg-cacts sga-acts" role="group" aria-label="Actions">'
    +(tel?sgaBtn('lien','phone','Appeler','Appeler '+(nxPhone(c0,1)||nxPhone(c0,2)),' data-href="'+nxE(tel)+'"'):'<button disabled title="Aucun numéro">'+nxSvg('phone')+'<span>Appeler</span></button>')
    +(mail?sgaBtn('lien','mail','Courriel','Écrire à '+mail,' data-href="mailto:'+nxE(mail)+'"'):'<button disabled title="Aucune adresse électronique">'+nxSvg('mail')+'<span>Courriel</span></button>')
    +(adr?sgaBtn('lien','map','Carte','Voir l’adresse sur la carte',' data-href="'+nxE(sgaCarte(c0))+'"'):'<button disabled title="Aucune adresse">'+nxSvg('map')+'<span>Carte</span></button>')
    +'<button data-fn="pin" class="'+(nxPinned('c',o.ID)?'on':'')+'" title="Épingler dans les favoris du menu">'+nxSvg('star')+'<span>Favori</span></button>'
    +(sgaPeut('contactEdit')?sgaBtn('modifier','edit','Modifier','Modifier l’entité (nom, type, IDE…)'):'')
    +sgaBtn('plus','more','Plus','Autres actions')+'</div></div>'; }
/* ── onglets ── */
function sgaCoord(c,o,court){ if(!c) return '<div class="nx-empty">Aucune adresse.'+(sgaPeut('contactNew')?' <a class="sga-lien" data-fn="nadr">Ajouter une adresse</a>':'')+'</div>';
  const rel=c.CONTACTRELATION_ID!=null&&String(c.CONTACTRELATION_ID)!==String(c.CONTACTOWNER_ID)?DS.get('contactowner',c.CONTACTRELATION_ID):null, L=adrLines(c);
  const lignes=[['phone','Téléphone',nxPhone(c,1),sgaTelHref(c,1)],['phone','Mobile',nxPhone(c,2),sgaTelHref(c,2)],['print','Fax',nxPhone(c,3),''],['mail','Courriel',c.EMAIL1,c.EMAIL1?'mailto:'+c.EMAIL1:''],
    ['share','Site internet',c.INTERNET,c.INTERNET?sgaWeb(c.INTERNET):''],['person','Fonction',c.COMPANYROLE||c.PROFESSION,''],['ruler','CFC',c.BKP,''],['info','Remarque',court?'':c.REMARK,'']].filter(x=>x[2]);
  return '<div class="sga-adr"><span class="h">'+nxE(ADR_T[c.ADDRESSTYPECODE]||'Adresse')+(rel?' · rattachée à <a class="sga-lien" data-ref="c:'+rel.ID+'">'+nxE(ownerName(rel))+'</a>':'')+(+c.ISHIDDEN?' · <span class="nx-tag urg">masquée</span>':'')+'</span>'
    +'<div class="a">'+(L.length?L.map((x,i)=>i===0?'<b>'+nxE(x)+'</b>':nxE(x)).join('<br>'):'—')+'</div>'+(c.STREET||c.LOCATION?'<button class="sga-c" data-fn="lien" data-href="'+nxE(sgaCarte(c))+'">'+nxSvg('map')+'Voir sur la carte</button>':'')+'</div>'
    +lignes.map(([i,t,v,href])=>'<div class="sga-co">'+nxSvg(i)+'<em>'+nxE(t)+'</em>'+(href?'<a data-fn="lien" data-href="'+nxE(href)+'">'+nxE(v)+'</a>':'<span>'+nxE(v)+'</span>')+'</div>').join(''); }
/* liste compacte (vue d'ensemble) : nom, fonction, téléphone ; appeler / écrire */
function sgaPersListe(pers){ if(!pers.length) return '<div class="nx-empty">Aucune personne rattachée.</div>';
  return pers.map(({c,o})=>{ const tel=nxPhone(c,1)||nxPhone(c,2), th=sgaTelHref(c,1)||sgaTelHref(c,2);
    return '<div class="nx-row sga-pers" data-ref="c:'+o.ID+'">'+sgaAv(o)+'<div class="t"><b>'+nxE(sgaNom(o))+'</b><span>'+nxE([c.COMPANYROLE||c.PROFESSION,tel].filter(Boolean).join(' · '))+'</span></div>'
      +'<span class="sga-ic">'+(th?'<button data-fn="lien" data-href="'+nxE(th)+'" title="Appeler '+nxE(tel)+'">'+nxSvg('phone')+'</button>':'')+(c.EMAIL1?'<button data-fn="lien" data-href="mailto:'+nxE(c.EMAIL1)+'" title="'+nxE(c.EMAIL1)+'">'+nxSvg('mail')+'</button>':'')+'</span></div>'; }).join(''); }
function sgaPersTable(ix,pers){ if(!pers.length) return '<div class="nx-empty">Aucune personne rattachée.</div>';
  return '<table class="nx-tbl sga-tbl"><thead><tr><th>Nom</th><th>Fonction</th><th>Téléphone</th><th>Courriel</th><th class="r">Projets</th><th class="sg-notri"></th></tr></thead><tbody>'
    +pers.map(({c,o})=>{ const tel=nxPhone(c,1)||nxPhone(c,2), th=sgaTelHref(c,1)||sgaTelHref(c,2), np=(ix.prj.get(String(o.ID))||new Set()).size;
      return '<tr data-ref="c:'+o.ID+'"><td><span class="sga-nm">'+sgaAv(o)+'<b>'+nxE(sgaNom(o))+'</b></span></td><td>'+nxE(c.COMPANYROLE||c.PROFESSION||'')+'</td><td>'+nxE(tel||'')+'</td><td>'+nxE(c.EMAIL1||'')+'</td><td class="r">'+(np||'—')+'</td>'
        +'<td class="r"><span class="sga-ic">'+(th?'<button data-fn="lien" data-href="'+nxE(th)+'" title="Appeler">'+nxSvg('phone')+'</button>':'')+(c.EMAIL1?'<button data-fn="lien" data-href="mailto:'+nxE(c.EMAIL1)+'" title="Écrire">'+nxSvg('mail')+'</button>':'')+'</span></td></tr>'; }).join('')+'</tbody></table>'; }
function sgaProjTable(prj,max){ const L=max?prj.slice(0,max):prj; if(!L.length) return '<div class="nx-empty">Intervenant d’aucun projet.</div>';
  return '<table class="nx-tbl sga-tbl"><thead><tr><th>N°</th><th>Projet</th><th>Rôle</th><th>Fonction</th><th class="r">CFC</th><th>État</th></tr></thead><tbody>'
    +L.map(x=>'<tr data-ref="p:'+x.p.ID+'"><td><span class="nx-tag num">'+nxE(x.p.NUMBER||'—')+'</span></td><td><b>'+nxE(x.p.TITLE||'')+'</b>'+(x.via.size?'<br><small class="sga-via">par '+nxE([...x.via].join(', '))+'</small>':'')+'</td>'
      +'<td>'+nxE([...x.r].join(', '))+'</td><td>'+nxE([...x.fn].join(', '))+'</td><td class="r">'+nxE([...x.bkp].join(', '))+'</td><td>'+nxStateTag(x.p)+'</td></tr>').join('')+'</tbody></table>'; }
function sgaNotesHtml(notes,max){ const L=max?notes.slice(0,max):notes; if(!L.length) return '<div class="nx-empty">Aucune note.</div>'; const ed=sgaPeut('contactEdit');
  return L.map(({n,c})=>'<div class="sga-note"><div><b>'+nxE(n.SUBJECT||'Note')+'</b>'+(n.CONTENT?'<br>'+nxE(n.CONTENT).replace(/\n/g,'<br>'):'')+'</div>'
    +(ed&&!max?'<span class="sga-ic"><button data-fn="note-mod" data-id="'+n.ID+'" title="Modifier la note">'+nxSvg('edit')+'</button><button data-fn="note-sup" data-id="'+n.ID+'" title="Supprimer la note">'+nxSvg('trash')+'</button></span>':'<span></span>')
    +'<small>'+nxE([n.OWNER,dfr(n.CHANGEDDATE),+n.ISPUBLIC?'':'privée',sgaAdrLib(c)].filter(Boolean).join(' · '))+'</small></div>').join(''); }
function sgaTagsHtml(props,modif){ if(!props.length) return '<div class="nx-empty">Aucune catégorie.</div>'; const G=new Map();
  props.forEach(({p,c})=>{ const g=nm(propGroup(p))||'Catégories'; (G.get(g)||G.set(g,[]).get(g)).push({p,c}); });
  return [...G].map(([g,L])=>'<div class="sga-grp">'+nxE(g)+'</div><div class="sga-tags">'+L.map(({p,c})=>'<span class="nx-tag" title="'+nxE(sgaAdrLib(c))+'">'+nxE(nm(p))
    +(modif?'<button data-fn="cat-sup" data-id="'+c.ID+'" data-p="'+p.ID+'" title="Retirer la catégorie">×</button>':'')+'</span>').join('')+'</div>').join(''); }
function sgaOnglet(ong,ix,o,D){ const {cs,c0,pers,prj,soum,notes,props}=D, nw=sgaPeut('contactNew'), ed=sgaPeut('contactEdit'), del=sgaPeut('contactDelete'), soc=+o.TYPECODE!==1;
  if(ong==='vue'){ const enCours=prj.filter(x=>[1,2,3].includes(+x.p.PROJECTSTATECODE)).length, autres=cs.slice(1);
    return '<div class="nx-kpis sg-pkpis">'+sgaTuile(prj.length?'o_proj':'','folder','Projets',String(prj.length),enCours+' en cours')
      +(soc?sgaTuile('o_pers','person','Personnes',String(pers.length)):sgaTuile('o_adr','map','Adresses',String(cs.length)))
      +sgaTuile('','cal','Dernier projet',prj[0]?nxE(prj[0].p.NUMBER||'—'):'—',prj[0]?prj[0].p.TITLE:'')
      +(soum.length?sgaTuile('o_soum','doc','Soumissions',String(soum.length)):sgaTuile('o_notes','doc','Notes',String(notes.length)))+'</div>'
      +'<div class="sga-cols"><div class="sg-pcol">'+nxCard('','Coordonnées','<div class="b">'+sgaCoord(c0,o,1)
        +(autres.length?'<div class="sga-autres">'+autres.map(c=>'<div class="sga-co" data-fn="o_adr" style="cursor:pointer">'+nxSvg('map')+'<em>'+nxE(ADR_T[c.ADDRESSTYPECODE]||'Adresse')+'</em><span>'+nxE(adrLines(c).slice(1).join(', ')||adrLines(c).join(', '))+'</span></div>').join('')+'</div>':'')+'</div>',
        cs.length>1?'<a class="a" data-fn="o_adr">'+cs.length+' adresses</a>':'')
      +(props.length?nxCard('','Catégories','<div class="b">'+sgaTagsHtml(props,false)+'</div>'):'')+'</div><div class="sg-pcol">'
      +(soc||pers.length?nxCard('','Personnes','<div class="b flush">'+sgaPersListe(pers.slice(0,6))+'</div>','<span class="n">'+pers.length+'</span>'+(pers.length>6?'<a class="a" data-fn="o_pers">Toutes</a>':'')):'')
      +nxCard('','Notes','<div class="b">'+sgaNotesHtml(notes,3)+'</div>','<span class="n">'+notes.length+'</span>'+(ed&&c0?'<a class="a" data-fn="note-nouv">Nouvelle note</a>':''))+'</div></div>'
      +(prj.length?'<div class="sga-bloc">'+nxCard('','Projets','<div class="b flush">'+sgaProjTable(prj,8)+'</div>','<span class="n">'+prj.length+'</span>'+(prj.length>8?'<a class="a" data-fn="o_proj">Tous les projets</a>':''))+'</div>':''); }
  if(ong==='adr') return '<div class="sg-htls sg-iacts sga-barre-ong">'+(nw?sgaBtn('nadr','plus','Nouvelle adresse','Ajouter une adresse à cette entité'):'')+(nw?sgaBtn('lier','person','Rattacher…','Rattacher une personne ou une entité à celle-ci'):'')+'</div>'
    +'<div class="sga-grille">'+(cs.length?cs.map(c=>nxCard('',nxE(ADR_T[c.ADDRESSTYPECODE]||'Adresse'),'<div class="b">'+sgaCoord(c,o)+'</div><div class="sg-htls sg-iacts sga-adr-acts">'
      +(ed?sgaBtn('adr-mod','edit','Modifier','Modifier l’adresse',' data-id="'+c.ID+'"'):'')+sgaBtn('adr-copie','dup','Copier','Copier l’adresse',' data-id="'+c.ID+'"')
      +sgaBtn('adr-fav','star','Mes favoris','Ajouter l’adresse à « Mes favoris »',' data-id="'+c.ID+'"')+sgaBtn('adr-liste','mail','Liste…','Ajouter à une liste de diffusion',' data-id="'+c.ID+'"')
      +(del?sgaBtn('adr-sup','trash','Supprimer','Supprimer l’adresse',' data-id="'+c.ID+'"'):'')+'</div>')).join(''):'<div class="nx-empty">Aucune adresse.</div>')+'</div>';
  if(ong==='pers') return (nw?'<div class="sg-htls sg-iacts sga-barre-ong">'+sgaBtn('lier','person','Rattacher…','Rattacher une personne ou une entité à celle-ci')+'</div>':'')+nxCard('','Personnes rattachées','<div class="b flush">'+sgaPersTable(ix,pers)+'</div>','<span class="n">'+pers.length+'</span>');
  if(ong==='proj') return nxCard('','Projets','<div class="b flush">'+sgaProjTable(prj)+'</div>','<span class="n">'+prj.length+'</span>');
  if(ong==='cat') return (ed&&c0?'<div class="sg-htls sg-iacts sga-barre-ong">'+sgaBtn('cat-ajout','tag','Ajouter…','Ajouter des catégories à une adresse')+'</div>':'')+nxCard('','Catégories','<div class="b">'+sgaTagsHtml(props,ed)+'</div>','<span class="n">'+props.length+'</span>');
  if(ong==='notes') return (ed&&c0?'<div class="sg-htls sg-iacts sga-barre-ong">'+sgaBtn('note-nouv','plus','Nouvelle note','Ajouter une note')+'</div>':'')+nxCard('','Notes','<div class="b">'+sgaNotesHtml(notes)+'</div>','<span class="n">'+notes.length+'</span>');
  if(ong==='soum') return nxCard('','Soumissions','<div class="b flush">'+(soum.length?'<table class="nx-tbl sga-tbl"><thead><tr><th>N°</th><th>Projet</th><th>État</th><th class="r">CFC</th><th>Responsable</th></tr></thead><tbody>'
    +soum.map(({t,p})=>'<tr data-ref="p:'+p.ID+'"><td><span class="nx-tag num">'+nxE(p.NUMBER||'—')+'</span></td><td><b>'+nxE(p.TITLE||'')+'</b></td><td>'+nxStateTag(p)+'</td><td class="r">'+nxE(t.BKP||'')+'</td><td>'+nxE(contactName(DS.get('contact',t.RESPCONTACT_ID)))+'</td></tr>').join('')+'</tbody></table>':'<div class="nx-empty">Aucune soumission.</div>')+'</div>','<span class="n">'+soum.length+'</span>');
  return ''; }
function sgaFiche(ix,o){ const cs=sgaAdrs(ix,o), c0=cs[0]||null, pers=sgaPersonnes(ix,o), prj=sgaProjets(ix,o), soum=sgaSoum(cs), notes=sgaNotes(cs), props=sgaProps(cs), soc=+o.TYPECODE!==1;
  const T=[['vue','Vue d’ensemble'],['adr','Adresses',cs.length],...(soc||pers.length?[['pers','Personnes',pers.length]]:[]),...(prj.length?[['proj','Projets',prj.length]]:[]),['cat','Catégories',props.length],['notes','Notes',notes.length],...(soum.length?[['soum','Soumissions',soum.length]]:[])];
  const ong=T.some(t=>t[0]===SGA.onglet)?SGA.onglet:'vue';
  return sgaEntete(ix,o,c0,prj)+'<div class="sg-onglets">'+T.map(([k,t,n])=>'<button data-fn="o_'+k+'" class="'+(k===ong?'on':'')+'">'+t+(n!=null?'<i class="sga-cnt">'+n+'</i>':'')+'</button>').join('')+'</div>'
    +'<div class="sga-onglet">'+sgaOnglet(ong,ix,o,{cs,c0,pers,prj,soum,notes,props})+'</div>'; }
/* ── barre du haut : liste, précédent / suivant, nouveau contact ── */
function sgaBarre(o,L){ const i=o?L.findIndex(x=>String(x.ID)===String(o.ID)):-1;
  return '<div class="sga-barre"><button class="nx-btn" data-fn="tiroir" title="Liste des contacts (/)">'+nxSvg('list')+'Contacts<kbd>/</kbd></button>'
    +'<span class="sga-nav"><button class="nx-hb" data-fn="prec" title="Contact précédent (⌥↑)"'+(i>0?'':' disabled')+'>'+nxSvg('prev')+'</button><button class="nx-hb" data-fn="suiv" title="Contact suivant (⌥↓)"'+(i>=0&&i<L.length-1?'':' disabled')+'>'+nxSvg('next')+'</button>'
    +'<span>'+(i>=0?(i+1)+' sur '+L.length:L.length+' contact'+(L.length>1?'s':''))+' · '+nxE(sgaFiltreLib())+'</span></span><span class="sga-sp"></span>'
    +(sgaPeut('contactNew')?'<button class="nx-btn pri sga-dd" data-fn="nouveau">'+nxSvg('plus')+'Nouveau contact'+nxSvg('next')+'</button>':'')+'</div>'; }
/* ── menus : sections, icônes, raccourcis ; mêmes fermetures que les autres menus (clic dehors, Échap, défilement) ── */
function sgaMenu(anc,sections,pos){ closeMenus(); const m=h('div',{class:'menu sg-cmenu sga-menu',role:'menu'}); let dernier=null;
  sections.filter(Boolean).forEach(s=>{ if(s==='-'){ if(dernier&&dernier!=='-'){ m.append(h('hr')); dernier='-'; } return; } const L=(s.items||[]).filter(Boolean); if(!L.length) return;
    if(s.s) m.append(h('div',{class:'s'},s.s));
    L.forEach(it=>{ const d=h('div',{class:'i'+(it.danger?' d':'')+(it.dis?' dis':''),role:'menuitem'}); d.innerHTML=nxSvg(it.ico||'arrow')+'<span>'+nxE(it.t)+'</span><kbd>'+nxE(it.k||'')+'</kbd>';
      if(!it.dis) d.onclick=()=>{ closeMenus(); try{ const r=it.fn&&it.fn(); if(r&&typeof r.catch==='function') r.catch(e=>{ console.error(e); toast('✗ '+((e&&e.message)||e),true); }); }catch(e){ console.error(e); toast('✗ '+((e&&e.message)||e),true); } };
      m.append(d); }); dernier='i'; });
  if(m.lastChild&&m.lastChild.tagName==='HR') m.lastChild.remove(); if(!m.children.length) return null; document.body.append(m);
  if(pos) sgMenuPlacer(m,pos.x,pos.y); else { const r=anc.getBoundingClientRect(); sgMenuPlacer(m,Math.max(8,r.right-m.offsetWidth),r.bottom+4); }
  setTimeout(()=>document.addEventListener('mousedown',_mclose),0); return m; }
function sgaSections(o,ix,ouvrir){ const cs=sgaAdrs(ix,o), c0=cs[0]||null, nw=sgaPeut('contactNew'), ed=sgaPeut('contactEdit'), del=sgaPeut('contactDelete');
  return [ouvrir?{items:[{ico:'arrow',t:'Ouvrir la fiche',fn:()=>sgaOuvrir(o.ID)},ed&&{ico:'edit',t:'Modifier l’entité…',fn:()=>editOwner(o,o.TYPECODE)}]}:null,ouvrir?'-':null,
    {s:'Coordonnées',items:[nw&&{ico:'plus',t:'Nouvelle adresse',fn:()=>editContact(null,o,null)},nw&&{ico:'person',t:'Rattacher une personne ou une entité',fn:()=>sgaRattacher(o)},
      ed&&{ico:'wallet',t:'Coordonnées bancaires…',fn:()=>bankDlg(o)},c0&&{ico:'dup',t:'Copier l’adresse',fn:()=>ctCopy(adrLines(c0).join('\n'),'Adresse copiée.')}]},
    {s:'Classer',items:[c0&&{ico:'star',t:'Ajouter l’adresse à « Mes favoris »',fn:()=>addToGroup(favGroup(true),[c0])},c0&&{ico:'mail',t:'Ajouter à une liste de diffusion…',fn:()=>pickGroup(g=>addToGroup(g,[c0]))},
      c0&&ed&&{ico:'tag',t:'Catégories…',fn:()=>sgaChoisirAdr(cs,'Catégories : adresse',c=>pickProps(ps=>addProps([c],ps)))}]},
    {s:'Afficher',items:[{ico:'ruler',t:'CFC de toutes les adresses',fn:()=>ownerInfo(o,'CFC')},{ico:'list',t:'Propriétés de toutes les adresses',fn:()=>ownerInfo(o,'Propriétés')},
      {ico:'folder',t:'Projets comme intervenant',fn:()=>ownerInfo(o,'Intervenants')}]},
    '-',{items:[{ico:'print',t:'Imprimer la fiche',fn:()=>sgaImprimer(o)}]},'-',
    {items:[ed&&{ico:'eyeoff',t:+o.ISHIDDEN?'Réafficher dans les listes':'Masquer dans les listes',fn:()=>DS.save('contactowner',{...o,ISHIDDEN:+o.ISHIDDEN?0:1})},
      del&&{ico:'trash',t:'Supprimer l’entité…',danger:1,fn:()=>delOwner(o)}]}]; }
const sgaNouveau=anc=>sgaMenu(anc,[{s:'Nouveau contact',items:OWNER_T.map((t,i)=>({ico:SGA_ICO_T[i]||'plus',t,fn:()=>editOwner(null,i,(e,isNew)=>{ SGA.id=String(e.ID); if(isNew) editContact(null,e,null); sgaOuvrir(e.ID); })}))}]);
function sgaMenuListe(anc){ sgaMenu(anc,[{s:'Liste',items:[{ico:'eyeoff',t:SGA.hid?'Ne plus montrer les entités masquées':'Montrer les entités masquées',fn:()=>{ SGA.hid=!SGA.hid; sgaMajListe(); }},
  sgaPeut('contactExport')&&{ico:'export',t:'Exporter la liste (CSV)',fn:()=>sgaCsv()},{ico:'list',t:'Toutes les adresses',fn:()=>go('adr-liste')},{ico:'search',t:'Recherche avancée…',fn:()=>go('adr-chercher')}]}]); }
/* actions de la fiche */
function sgaRattacher(o){ pickOwner(ownerName(o,true)+' : rattacher une personne ou une entité',e=>editContact(null,e,o)); }
function sgaChoisirAdr(cs,titre,fn){ if(cs.length<2){ if(cs[0]) fn(cs[0]); return; } const s=h('select',{class:'inp'},...cs.map((c,i)=>h('option',{value:i},sgaAdrLib(c)+(adrLines(c)[1]?' — '+adrLines(c)[1]:''))));
  dialog({title:titre,body:h('div',{class:'form',style:{gridTemplateColumns:'max-content 1fr',minWidth:'420px'}},h('label',{},'Adresse'),s),buttons:[{t:'Annuler'},{t:'OK',pri:true,fn:()=>{ fn(cs[+s.value]); }}]}); }
function sgaNote(n,c){ const v=n?{...n}:{ID:null,CONTACT_ID:c.ID,OWNER:ME.id,ISPUBLIC:1,CHANGEDDATE:today()};
  const s=h('input',{class:'inp',value:v.SUBJECT||''}), t=h('textarea',{class:'inp',rows:8},v.CONTENT||''), pub=h('input',{type:'checkbox',checked:!!+v.ISPUBLIC||null});
  dialog({title:n?'Modifier la note':'Nouvelle note',body:h('div',{class:'form',style:{gridTemplateColumns:'max-content 1fr',minWidth:'520px'}},h('label',{},'Concerne'),s,h('label',{},'Texte'),t,h('label',{},'Publique'),h('label',{style:{textAlign:'left'}},pub,' visible par tous')),
    buttons:[{t:'Annuler'},{t:'OK',pri:true,fn:()=>{ Object.assign(v,{SUBJECT:s.value.trim(),CONTENT:t.value,ISPUBLIC:pub.checked?1:0,CHANGEDDATE:today()}); return DS.save('contactnote',v); }}]}); }
function sgaImprimer(o){ const ix=sgaIndex(), cs=sgaAdrs(ix,o), pers=sgaPersonnes(ix,o), prj=sgaProjets(ix,o), E=nxE;
  const adr=c=>'<p><b>'+E(ADR_T[c.ADDRESSTYPECODE]||'Adresse')+'</b><br>'+adrLines(c).map(E).join('<br>')+[['Tél.',nxPhone(c,1)],['Mobile',nxPhone(c,2)],['Courriel',c.EMAIL1],['Site',c.INTERNET],['CFC',c.BKP]].filter(x=>x[1]).map(x=>'<br>'+x[0]+' '+E(x[1])).join('')+'</p>';
  const corps='<h1>'+E(sgaNom(o).toUpperCase())+'</h1><div class="date">'+E([OWNER_T[o.TYPECODE],o.UID?'IDE '+o.UID:''].filter(Boolean).join(' · ').toUpperCase())+'</div>'
    +'<h2>COORDONNÉES</h2>'+(cs.map(adr).join('')||'<p>—</p>')
    +(pers.length?'<h2>PERSONNES</h2><table><tr><th>Nom</th><th>Fonction</th><th>Téléphone</th><th>Courriel</th></tr>'+pers.map(x=>'<tr><td>'+E(sgaNom(x.o))+'</td><td>'+E(x.c.COMPANYROLE||x.c.PROFESSION||'')+'</td><td>'+E(nxPhone(x.c,1)||nxPhone(x.c,2))+'</td><td>'+E(x.c.EMAIL1||'')+'</td></tr>').join('')+'</table>':'')
    +(prj.length?'<h2>PROJETS</h2><table><tr><th>N°</th><th>Projet</th><th>Rôle</th><th>État</th></tr>'+prj.map(x=>'<tr><td>'+E(x.p.NUMBER||'')+'</td><td>'+E(x.p.TITLE||'')+'</td><td>'+E([...x.r].join(', '))+'</td><td>'+E(projState(x.p))+'</td></tr>').join('')+'</table>':'');
  sgDocOuvrir('Fiche contact — '+sgaNom(o),corps,'Fiche contact '+sgaNom(o)+'.html'); }
function sgaCsv(){ const ix=sgaIndex(), L=sgaListe(ix), q=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';
  const rows=[['Nom','Type','Rue','NPA','Localité','Téléphone','Mobile','Courriel','Site internet','CFC','Rôles','Projets']].concat(L.map(o=>{ const c=sgaAdrs(ix,o)[0]||{};
    return [sgaNom(o),OWNER_T[o.TYPECODE]||'',c.STREET,c.POSTALCODE,c.LOCATION,nxPhone(c,1),nxPhone(c,2),c.EMAIL1,c.INTERNET,sgaCfc(ix,o).join(' '),sgaRoles(ix,o).join(', '),(ix.prj.get(String(o.ID))||new Set()).size]; }));
  const b=new Blob(['﻿'+rows.map(r=>r.map(q).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}), a=h('a',{href:URL.createObjectURL(b),download:'Annuaire_'+today()+'.csv'});
  document.body.append(a); a.click(); a.remove(); toast(L.length+' contacts exportés.'); }
/* ── liste escamotable ── */
function sgaOuvrir(id){ SGA.id=String(id); nxLS.set('sg3_annu_id',SGA.id); SGA.tiroir=false; go(VIEW&&VIEW.id==='nx-contact'?'nx-contact':'adr-entites',String(id)); }
function sgaVoisin(d){ const ix=sgaIndex(), L=sgaListe(ix), i=L.findIndex(x=>String(x.ID)===String(SGA.id)), n=L[i+d]; if(i>=0&&n) sgaOuvrir(n.ID); }
function sgaTiroir(w,ouvrir){ w=w||document.querySelector('.sga-vue'); if(!w) return; const ex=w.querySelector('.sga-tiroir');
  if(!ouvrir){ if(ex){ const lb=ex.querySelector('.sga-lbody'); SGA.scroll=lb?lb.scrollTop:0; ex.remove(); } const v=w.querySelector('.sga-voile'); if(v) v.remove(); SGA.tiroir=false; return; }
  SGA.tiroir=true; if(!ex){ const ix=sgaIndex();
    w.insertAdjacentHTML('beforeend','<div class="sga-voile"></div><aside class="sga-tiroir" role="dialog" aria-label="Contacts"><div class="sga-th"><div class="sga-tt"><b>Contacts<span class="sga-nb"></span></b>'
      +(sgaPeut('contactNew')?'<button class="nx-btn pri" data-t="nouveau">'+nxSvg('plus')+'Nouveau</button>':'')+'<button class="nx-hb" data-t="liste" title="Liste : masqués, export, toutes les adresses">'+nxSvg('more')+'</button>'
      +'<button class="nx-hb" data-t="fermer" title="Fermer la liste (Échap)">'+nxSvg('stop')+'</button></div>'
      +'<label class="sga-q">'+nxSvg('search')+'<input type="search" placeholder="Nom, localité, CFC, personne…" aria-label="Rechercher un contact"></label>'
      +'<div class="sga-types"><div class="sg-htls" role="group" aria-label="Type"></div></div><div class="sga-roles" role="group" aria-label="Rôle"></div></div>'
      +'<div class="sga-lbody" tabindex="-1"></div><nav class="sga-az" aria-label="Aller à la lettre"></nav></aside>');
    const t=w.querySelector('.sga-tiroir'), q=t.querySelector('.sga-q input'); q.value=SGA.q; let tm=0;
    q.oninput=()=>{ clearTimeout(tm); tm=setTimeout(()=>{ SGA.q=q.value; sgaMajListe(t); },110); };
    w.querySelector('.sga-voile').onclick=()=>sgaTiroir(w,false);
    t.addEventListener('click',e=>{ const b=e.target.closest('[data-t],[data-ty],[data-ro],[data-az],.sga-row'); if(!b) return;
      if(b.dataset.t==='fermer') sgaTiroir(w,false); else if(b.dataset.t==='nouveau') sgaNouveau(b); else if(b.dataset.t==='liste') sgaMenuListe(b);
      else if(b.dataset.ty){ SGA.type=b.dataset.ty; nxLS.set('sg3_annu_type',SGA.type); sgaMajListe(t); }
      else if(b.dataset.ro){ SGA.role=b.dataset.ro; nxLS.set('sg3_annu_role',SGA.role); sgaMajListe(t); }
      else if(b.dataset.az){ const L=t.querySelector('.sga-let[data-l="'+b.dataset.az+'"]'), lb=t.querySelector('.sga-lbody'); if(L) lb.scrollTop=L.offsetTop; }
      else if(b.classList.contains('sga-row')) sgaOuvrir(b.dataset.id); });
    t.addEventListener('contextmenu',e=>{ const r=e.target.closest('.sga-row'); if(!r||e.altKey) return; e.preventDefault(); const o=DS.get('contactowner',r.dataset.id); if(!o) return;
      t.querySelectorAll('.sga-row.k').forEach(x=>x.classList.remove('k')); r.classList.add('k'); sgaMenu(null,sgaSections(o,sgaIndex(),true),{x:e.clientX,y:e.clientY}); });
    sgaMajListe(t,ix,true); if(!document.querySelector('.ov')) setTimeout(()=>q.focus(),0); } }
function sgaMajListe(t,ix,premier){ t=t||document.querySelector('.sga-tiroir'); if(!t) return; ix=ix||sgaIndex(); const L=sgaListe(ix);
  t.querySelector('.sga-nb').textContent=L.length;
  t.querySelector('.sga-types .sg-htls').innerHTML=SGA_TYPES.map(([k,l,ico])=>'<button data-ty="'+k+'" class="'+(k===SGA.type?'on':'')+'">'+nxSvg(ico)+'<span>'+l+'</span><i>'+sgaListe(ix,k).length+'</i></button>').join('');
  t.querySelector('.sga-roles').innerHTML='<em>Rôle</em>'+SGA_ROLES.map(([k,l])=>'<button data-ro="'+k+'" class="'+(k===SGA.role?'on':'')+'">'+nxE(l)+'</button>').join('');
  const lb=t.querySelector('.sga-lbody'); let lettre='', html='';
  L.forEach(o=>{ const l=sgaLettre(o); if(l!==lettre){ lettre=l; html+='<div class="sga-let" data-l="'+l+'">'+l+'</div>'; } const k=String(o.ID), c=sgaAdrs(ix,o)[0], np=(ix.prj.get(k)||new Set()).size;
    const rel=c&&c.CONTACTRELATION_ID!=null&&String(c.CONTACTRELATION_ID)!==k?ownerName(DS.get('contactowner',c.CONTACTRELATION_ID)):'', cfc=sgaCfc(ix,o)[0], R=sgaRoles(ix,o).filter(r=>!/collaborateur/i.test(r));
    const sous=[c&&c.LOCATION,rel||(cfc?'CFC '+cfc:'')||R[0]||''].filter(Boolean).join(' · ');
    html+='<div class="sga-row'+(k===String(SGA.id)?' on':'')+(+o.ISHIDDEN?' cache':'')+'" data-id="'+k+'">'+sgaAv(o)+'<div class="t"><b>'+(+o.TYPECODE===1&&o.NAME2?nxE(o.NAME1)+' <small>'+nxE(o.NAME2)+'</small>':nxE(sgaNom(o)))+'</b>'
      +(sous?'<span>'+nxE(sous)+'</span>':'')+'</div>'+(np?'<span class="n" title="Projets">'+np+'</span>':'')+'</div>'; });
  lb.innerHTML=html||'<div class="sga-vide">Aucun contact ne correspond.'+(SGA.q||SGA.type!=='tous'||SGA.role!=='tous'?' <a class="sga-lien" data-ty="tous" data-ro="tous">Tout afficher</a>':'')+'</div>';
  const vide=lb.querySelector('.sga-vide [data-ty]'); if(vide) vide.onclick=e=>{ e.stopPropagation(); SGA.type='tous'; SGA.role='tous'; SGA.q=''; t.querySelector('.sga-q input').value=''; sgaMajListe(t); };
  const az=t.querySelector('.sga-az'), pres=new Set(L.map(sgaLettre)); az.style.top=lb.offsetTop+6+'px';
  az.innerHTML='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').concat(pres.has('#')?['#']:[]).map(a=>'<button data-az="'+a+'" class="'+(pres.has(a)?'ok':'')+'"'+(pres.has(a)?'':' disabled')+'>'+a+'</button>').join('');
  if(premier){ const on=lb.querySelector('.sga-row.on'); if(SGA.scroll&&!on) lb.scrollTop=SGA.scroll; else if(on) lb.scrollTop=on.offsetTop-lb.clientHeight/3; } }
function sgaDeplacer(t,d){ const R=[...t.querySelectorAll('.sga-row')]; if(!R.length) return; let i=R.findIndex(r=>r.classList.contains('k')); if(i<0) i=R.findIndex(r=>r.classList.contains('on'));
  R.forEach(r=>r.classList.remove('k')); i=Math.max(0,Math.min(R.length-1,i+d)); R[i].classList.add('k'); R[i].scrollIntoView({block:'nearest'}); }
/* ── écran ── */
function sgaRendre(m,arg,vue,garder){ const ix=sgaIndex(); let o=arg!=null&&arg!==''?DS.get('contactowner',arg):null; if(o&&!garder) SGA.tiroir=false; if(!o&&SGA.id!=null) o=DS.get('contactowner',SGA.id);
  if(o){ SGA.id=String(o.ID); nxLS.set('sg3_annu_id',SGA.id); nxRecent('c',o.ID); if(vue==='nx-contact') VIEW.nxTitle=sgaNom(o); }
  const w=h('div',{class:'sga-vue'}), pg=h('div',{class:'nx-page sga-page'}); w.append(pg); m.append(w);
  pg.innerHTML='<div class="nx-wrap">'+sgaBarre(o,sgaListe(ix))+(o?sgaFiche(ix,o):'<div class="nx-empty sga-vide">Choisissez un contact dans la liste.</div>')+'</div>';
  pg.addEventListener('click',e=>sgaClic(e,w,o));
  if(!o||SGA.tiroir) sgaTiroir(w,true); }
function sgaClic(e,w,o){ const b=e.target.closest('[data-fn],[data-ref]'); if(!b||b.disabled) return; const f=b.dataset.fn, ix=()=>sgaIndex(), cs=()=>o?sgaAdrs(ix(),o):[], adr=()=>DS.get('contact',b.dataset.id);
  if(!f&&b.dataset.ref){ const [k,id]=String(b.dataset.ref).split(':'); if(k==='c') sgaOuvrir(id); else nxOpenRef(b.dataset.ref); return; }
  if(f==='tiroir') sgaTiroir(w,true); else if(f==='prec') sgaVoisin(-1); else if(f==='suiv') sgaVoisin(1); else if(f==='nouveau') sgaNouveau(b);
  else if(f==='lien'){ e.preventDefault(); const u=b.dataset.href; if(/^https?:/i.test(u)) window.open(u,'_blank','noopener'); else location.href=u; }
  else if(!o) return;
  else if(f.startsWith('o_')){ SGA.onglet=f.slice(2); nxLS.set('sg3_annu_onglet',SGA.onglet); sgaRedessiner(); }
  else if(f==='pin'){ const on=nxTogglePin('c',o.ID); b.classList.toggle('on',on); try{ sgSide(); }catch(_){} }
  else if(f==='modifier') editOwner(o,o.TYPECODE); else if(f==='plus') sgaMenu(b,sgaSections(o,ix()));
  else if(f==='nadr') editContact(null,o,null); else if(f==='lier') sgaRattacher(o);
  else if(f==='adr-mod'&&adr()) editContact(adr()); else if(f==='adr-sup'&&adr()) delContact(adr());
  else if(f==='adr-copie'&&adr()) ctCopy(adrLines(adr()).join('\n'),'Adresse copiée.'); else if(f==='adr-fav'&&adr()) addToGroup(favGroup(true),[adr()]);
  else if(f==='adr-liste'&&adr()) pickGroup(g=>addToGroup(g,[adr()]));
  else if(f==='cat-ajout') sgaChoisirAdr(cs(),'Catégories : adresse',c=>pickProps(ps=>addProps([c],ps)));
  else if(f==='cat-sup') DS.commit([{t:'contact_property',id:b.dataset.id+'-'+b.dataset.p,val:null}]);
  else if(f==='note-nouv') sgaChoisirAdr(cs(),'Nouvelle note : adresse',c=>sgaNote(null,c));
  else if(f==='note-mod'){ const n=DS.get('contactnote',b.dataset.id); if(n) sgaNote(n,DS.get('contact',n.CONTACT_ID)); }
  else if(f==='note-sup'){ const n=DS.get('contactnote',b.dataset.id); if(n) confirmDlg('Supprimer cette note ?','Supprimer').then(ok=>{ if(ok) DS.del('contactnote',n.ID); }); } }
/* redessin sur place (onglet, données modifiées) : sans nouvelle entrée d'historique, liste ouverte et défilement gardés */
function sgaRedessiner(){ const w=document.querySelector('.sga-vue'); if(!w||!VIEW) return; const m=w.parentNode, p=w.querySelector('.sga-page'), sc=p?p.scrollTop:0, lb=w.querySelector('.sga-lbody'); if(lb) SGA.scroll=lb.scrollTop;
  w.remove(); sgaRendre(m,VIEW.arg,VIEW.id,1); const p2=m.querySelector('.sga-page'); if(p2) p2.scrollTop=sc; }
const SGA_TABLES=['contactowner','contact','projectmember','contact_property','contactnote','projecttenderer','property','staff'];
VIEWS['adr-entites']={ render(m,arg){ sgaRendre(m,arg,'adr-entites'); }, refresh(ts){ if(hit(ts,...SGA_TABLES)) sgaRedessiner(); } };
VIEWS['nx-contact']={ render(m,arg){ sgaRendre(m,arg,'nx-contact'); }, refresh(ts){ if(hit(ts,...SGA_TABLES)) sgaRedessiner(); } };
/* clavier (sur window, avant les raccourcis généraux de document : « / » ouvre ici la liste, pas la palette) : / ouvre la liste ; dans la liste
   ↑ ↓ Entrée Échap ; sur la fiche ⌥↑ ⌥↓ = contact précédent / suivant */
window.addEventListener('keydown',e=>{ if(typeof VIEW==='undefined'||!VIEW||!['adr-entites','nx-contact'].includes(VIEW.id)||document.querySelector('.ov')||(typeof PAL!=='undefined'&&PAL.on)) return;
  const w=document.querySelector('.sga-vue'); if(!w) return; const t=w.querySelector('.sga-tiroir'), cible=e.target||{}, champ=/^(INPUT|TEXTAREA|SELECT)$/.test(cible.tagName)||cible.isContentEditable;
  const stop=()=>{ e.preventDefault(); e.stopImmediatePropagation(); };
  if(t&&!document.querySelector('.menu')){ if(e.key==='Escape'){ stop(); sgaTiroir(w,false); return; }
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){ stop(); sgaDeplacer(t,e.key==='ArrowDown'?1:-1); return; }
    if(e.key==='Enter'){ const k=t.querySelector('.sga-row.k')||(SGA.q?t.querySelector('.sga-row'):null); if(k){ stop(); sgaOuvrir(k.dataset.id); } return; } return; }
  if(champ||e.metaKey||e.ctrlKey||document.querySelector('.menu')) return;
  if(e.key==='/'&&!e.altKey){ stop(); sgaTiroir(w,true); return; }
  if(e.altKey&&(e.key==='ArrowDown'||e.key==='ArrowUp')){ stop(); sgaVoisin(e.key==='ArrowDown'?1:-1); } },true);

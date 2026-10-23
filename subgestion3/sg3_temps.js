/* ═══ 25. Chapitre Temps : visuel « épuré » (23.10.2026) ════════════════════════════════════════════════════════════════════════════════
   Demande de Paulo : « dans le menu Temps revoir le visuel de toutes les pages » ; proposition A (« épuré ») choisie sur maquette parmi 3
   (A épuré, B fiche du collaborateur, C pleine largeur), avec « améliore la colonne collaborateur ». Pages : Feuille d'heures, Rapports de
   temps, Disponibilités, Notes de frais, Rapport des notes de frais (écrans du moteur) et Situation des heures. Styles dans sg3.css, limités au
   chapitre (html[data-vdom="temps"], classes .sgt-*) : barre d'outils en texte (choix souligné en bleu nuit, plus de chevauchement dans Notes
   de frais), tableaux à filet noir, trimestres et totaux sur trame bleu nuit pâle (.sgt-tot), résumé du rapport en tuiles.
   Ici, la colonne des collaborateurs : initiales en pastille, nom, et sur une 2e ligne les heures de l'année et la dernière saisie (pages de
   frais : nombre de notes et montant de l'année) ; ancien collaborateur en gris (« a quitté le bureau le … »). Le contenu des cellules est refait
   après chaque dessin du moteur (MutationObserver sur #main) ; la sélection, le tri et les données ne changent pas. L'agenda de la feuille
   d'heures n'est pas touché. ═══ */
const SGT_FRAIS=['frais','frais-rapport'];
let sgtCache={t:0,m:new Map()};
function sgtStats(s){ const v=(VIEW&&VIEW.id)||'', k=s.ID+'|'+(SGT_FRAIS.includes(v)?'f':'h'), y=new Date().getFullYear();
  if(Date.now()-sgtCache.t>5000) sgtCache={t:Date.now(),m:new Map()};
  if(sgtCache.m.has(k)) return sgtCache.m.get(k); let r;
  if(SGT_FRAIS.includes(v)){ const C=DS.by('projectcost','STAFF_ID',s.ID).filter(x=>+x.DATEYEAR===y), mt=C.reduce((a,x)=>a+(+x.QUANTITY||0)*(+x.UNITPRICE||0)*(+x.EXTERNALRATE||1),0);
    r=C.length?C.length+' note'+(C.length>1?'s':'')+' · '+num(mt,2)+' CHF en '+y:'aucune note en '+y; }
  else { let h=0, der=null; DS.by('timelog','STAFF_ID',s.ID).forEach(x=>{ const d=tlDate(x); if(d.getFullYear()===y) h+=+x.TIMEPERIOD||0; if(!der||d>der) der=d; });
    r=(h?num(Math.round(h),0)+' h en '+y:'aucune heure en '+y)+(der?' · dernière '+dfr(diso(der)).replace(/\.\d{2}(\d{2})$/,'.$1'):''); }   /* heures arrondies, date courte : la ligne tient dans la colonne */
  sgtCache.m.set(k,r); return r; }
/* initiales du collaborateur ; vides dans la base : celles du bureau (1re lettre du prénom + 2 premières du nom, ex. GVE) */
const sgtIni=s=>{ if(s.INITIALS) return s.INITIALS; const m=String(staffName(s)||'').trim().split(/\s+/), pr=m[0]||'', no=m.length>1?m[m.length-1]:''; return (pr.charAt(0)+no.slice(0,2)).toUpperCase(); };
function sgtDecorer(){ if(document.documentElement.dataset.vdom!=='temps') return;
  const left=document.querySelector('#main .cols>.col:first-child');
  if(left){ const parNom=new Map(DS.all('staff').map(s=>[staffName(s),s])), auj=today();
    left.querySelectorAll('table.g tbody tr').forEach(tr=>{ const td=tr.querySelector('td'); if(!td||td.dataset.sgt) return; const nom=td.textContent.trim(), s=parNom.get(nom); if(!s) return;
      const parti=+s.ISACTIVE===0||(!!s.QUITTINGDATE&&String(s.QUITTINGDATE).slice(0,10)<auj);
      const info=parti?'a quitté le bureau'+(s.QUITTINGDATE?' le '+dfr(String(s.QUITTINGDATE).slice(0,10)):''):sgtStats(s);
      td.dataset.sgt='1'; td.dataset.nm=nom; tr.classList.toggle('sgt-parti',parti); td.title=nom+' — '+info;
      td.innerHTML='<div class="sgt-row"><span class="sgt-ini">'+nxE(sgtIni(s))+'</span><span class="sgt-nm"><b>'+nxE(nom)+'</b><small>'
        +nxE(info)+'</small></span></div>'; }); }
  document.querySelectorAll('#main .col.fill table.g tbody tr').forEach(tr=>{ const t=((tr.firstElementChild||{}).textContent||'').trim(), tot=/trimestre|semestre|^total|^disponibilit|^solde du temps/i.test(t);
    if(tr.classList.contains('sgt-tot')!==tot) tr.classList.toggle('sgt-tot',tot); }); }
{ let tm=null; const lance=()=>{ const m=document.getElementById('main'); if(!m) return void setTimeout(lance,500);
    new MutationObserver(()=>{ if(document.documentElement.dataset.vdom!=='temps') return; clearTimeout(tm); tm=setTimeout(sgtDecorer,30); }).observe(m,{childList:true,subtree:true}); };
  lance(); }

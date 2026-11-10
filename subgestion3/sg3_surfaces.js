/* ═══ SURFACES ET VOLUMES (10.11.2026, bloc 49 ; Paulo : « le volume doit être entré quelque part dans le logiciel dans un module de calcul de
   surface et volume, ajoute ce module dans Projet et ajoute uniquement le volume pour l'affaire 99TST ; on regardera ensemble comment créer le
   module de calcul de surface et volume, pour réaliser des métrés etc. ») ═══
   Page du projet (nx-pdom) ▸ groupe Projet ▸ tuile « Surfaces et volumes » (première de la 2e ligne, avant Estimations) ; SG_PMOD, SG_PMOD_G,
   compteur et page pleine branchés dans sg3_plus.js. Première étape : le volume bâti (VB) selon SIA 416 seulement ; surfaces SIA 416, calcul
   des volumes et métrés : à concevoir avec Paulo.
   Données : collection propre « sgsurfaces » (gardée par les reprises ; serveur du NAS : règle « projet modifiable » des collections rattachées
   par PROJECT_ID, rien à changer), un enregistrement par projet : {ID = ID du projet, PROJECT_ID, VB (m³), MODIFIE, PAR}. Sans valeur saisie ici,
   le volume des caractéristiques de l'affaire (project.VOLUME, venu de l'ancien logiciel) est repris et signalé comme tel (il serait remplacé à
   la prochaine reprise : c'est pourquoi la saisie se fait ici, pas dans project).
   Utilisé par : devis général ▸ récapitulatifs (prix au m³ SIA 416, sg3_devis.js), via window.sgVolumeSIA416(p).
   Droits : lecture = qui voit le projet ; écriture = projet modifiable (comme le planning et le permis). Styles #sgsf-css, classes sgsf-*. */
(function(){
const T='sgsurfaces';
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const moi=()=>{ try{ return typeof ME==='object'&&ME&&ME.id?String(ME.id):''; }catch(_){ return ''; } };
const dire=(m,err)=>{ if(typeof toast==='function') toast(m,err); };
const ver=id=>{ try{ return ((DS.S&&DS.S[T])||{})[String(id)]||0; }catch(_){ return 0; } };
const peut=p=>{ try{ return !!(sgAdmin()||sgDroit('projets_modifier','tous')||(sgDroit('projets_modifier','siens')&&sgMesProjets().has(String(p.ID)))); }catch(_){ return false; } };
const mille=n=>{ const v=Math.round(+n*10)/10, e=Math.trunc(Math.abs(v)), d=Math.round((Math.abs(v)-e)*10); return (v<0?'−':'')+String(e).replace(/\B(?=(\d{3})+(?!\d))/g,'\'')+(d?'.'+d:''); };
const lireNb=s=>{ const t=String(s==null?'':s).replace(/[’'\s ]/g,'').replace(',','.').replace(/m³|m3/gi,''); if(!t) return null; const v=+t; return isFinite(v)&&v>0?v:NaN; };
const dfr=iso=>{ const d=new Date(iso); return isNaN(d)?'':String(d.getDate()).padStart(2,'0')+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+d.getFullYear(); };

/* volume bâti du projet : saisi ici, sinon caractéristiques de l'affaire */
function val(p){ if(!p) return {vb:0,src:''}; const r=DS.get(T,String(p.ID)); if(r&&+r.VB>0) return {vb:+r.VB,src:'module',r};
  if(+p.VOLUME>0) return {vb:+p.VOLUME,src:'affaire'}; return {vb:0,src:''}; }
window.sgVolumeSIA416=p=>{ try{ return val(p).vb||0; }catch(_){ return 0; } };
window.sgSurfacesCompte=p=>{ try{ const v=val(p); return v.vb?'VB '+mille(v.vb)+' m³':'Volume à saisir'; }catch(_){ return ''; } };

function css(){ if(document.getElementById('sgsf-css')) return; const s=document.createElement('style'); s.id='sgsf-css'; s.textContent=`
.sgsf-box{flex:1 1 auto;min-height:0;overflow:auto}
.sgsf{padding:16px 24px 28px;box-sizing:border-box;max-width:1100px}
.sgsf .sgfh-tete{margin:0 0 22px}
.sgsf-sec{border-top:2px solid var(--s-noir);margin:0 0 26px}
.sgsf-sh{display:flex;align-items:baseline;gap:8px 16px;padding:9px 0 12px}
.sgsf-sh h3{margin:0;font-size:15px;font-weight:700;color:var(--s-noir)}
.sgsf-sh .nb{font-size:12px;color:var(--s-gris)}
.sgsf-l{display:grid;grid-template-columns:minmax(220px,320px) minmax(0,1fr);gap:6px 24px;align-items:center;padding:4px 0 10px}
.sgsf-l .lb{font-size:13px;color:var(--s-noir)}
.sgsf-l .lb small{display:block;font-size:11.5px;color:var(--s-gris);margin-top:2px}
.sgsf-v{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.sgsf-v input{width:140px;font:inherit;font-size:15px;padding:6px 8px;border:1px solid var(--s-gris3,#c8c8c4);text-align:right;background:#fff;color:var(--s-noir)}
.sgsf-v input:focus{outline:2px solid var(--s-nuit);outline-offset:-1px}
.sgsf-v .u{font-size:14px;color:var(--s-noir)}
.sgsf-v .grand{font-size:28px;font-weight:700;color:var(--s-noir)}
.sgsf-note{font-size:12px;color:var(--s-gris);margin:2px 0 0}
.sgsf-note.av{color:var(--s-orange,#D7860D)}
.sgsf-ul{margin:0;padding:0 0 0 18px;font-size:13px;color:var(--s-noir);line-height:1.6}
.sgsf-ul li span{color:var(--s-gris)}`; document.head.append(s); }

function dessiner(u){ const p=DS.get('project',u.p.ID)||u.p, v=val(p), ok=peut(p), r=v.r, vu=p&&p.VOLUME>0?+p.VOLUME:0;
  const meta=['Volume bâti selon SIA 416',r&&r.MODIFIE?'modifié le '+dfr(r.MODIFIE):''].filter(Boolean).join(' · ');
  let h='<div class="sgsf"><div class="sgfh-tete"><div class="sgfh-id"><div class="sgfh-ini">'+E(p.NUMBER||'')+'</div><div class="sgfh-nm"><div class="lb">Surfaces et volumes</div><h2>'+E(p.TITLE||p.NUMBER||'')+'</h2>'
    +'<div class="sgfh-meta">'+E(meta)+'</div></div></div></div>';
  h+='<section class="sgsf-sec"><div class="sgsf-sh"><h3>Volume</h3><span class="nb">SIA 416</span></div>'
    +'<div class="sgsf-l"><div class="lb">Volume bâti (VB)<small>Volume de l’ouvrage selon la norme SIA 416, en m³</small></div><div class="sgsf-v">'
    +(ok?'<input type="text" inputmode="decimal" data-k="vb" value="'+E(v.src==='module'?mille(v.vb):'')+'" placeholder="'+E(v.src==='affaire'?mille(v.vb):'')+'" aria-label="Volume bâti SIA 416, en mètres cubes"><span class="u">m³</span><button class="nx-btn" data-a="ok">Enregistrer</button>'
        :'<span class="grand">'+(v.vb?E(mille(v.vb)):'—')+'</span><span class="u">'+(v.vb?'m³':'')+'</span>')
    +'</div></div>'
    +(v.src==='affaire'?'<p class="sgsf-note av">Valeur reprise des caractéristiques de l’affaire (ancien logiciel) : '+E(mille(vu))+' m³. Enregistrez-la ici pour la garder.</p>':'')
    +(!v.vb?'<p class="sgsf-note">Aucun volume pour ce projet.</p>':'')
    +(v.src==='module'&&vu&&Math.abs(vu-v.vb)>0.5?'<p class="sgsf-note">Caractéristiques de l’affaire (ancien logiciel) : '+E(mille(vu))+' m³.</p>':'')
    +'</section>';
  h+='<section class="sgsf-sec"><div class="sgsf-sh"><h3>Utilisé par</h3></div><ul class="sgsf-ul"><li>Devis général : prix au m³ SIA 416 des récapitulatifs <span>(CFC 2 et CFC 1 à 9)</span></li></ul></section>';
  h+='<section class="sgsf-sec"><div class="sgsf-sh"><h3>À venir</h3></div><p class="sgsf-note" style="font-size:13px">Surfaces SIA 416, calcul des volumes et métrés : ce module sera complété.</p></section></div>';
  u.box.innerHTML=h;
  const inp=u.box.querySelector('[data-k="vb"]'), go=()=>enregistrer(u,inp);
  if(inp){ inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); go(); } }); }
  const b=u.box.querySelector('[data-a="ok"]'); if(b) b.addEventListener('click',go); }

async function enregistrer(u,inp){ const p=DS.get('project',u.p.ID)||u.p; if(!peut(p)){ dire('Lecture seule : votre profil ne permet pas de modifier ce projet.',true); return; }
  if(u.enCours) return; const vb=lireNb(inp.value); if(Number.isNaN(vb)){ dire('Volume non valable : indiquez un nombre de m³, par exemple 12000.',true); inp.focus(); return; }
  const id=String(p.ID), r0=DS.get(T,id);
  if(vb==null&&!r0){ dessiner(u); return; }
  if(r0&&vb!=null&&Math.abs(+r0.VB-vb)<1e-9){ dire('Volume inchangé.'); return; }
  const val0=vb==null?null:Object.assign({},r0||{},{ID:id,PROJECT_ID:p.ID,VB:vb,MODIFIE:new Date().toISOString(),PAR:moi()||null});
  u.enCours=true; let ok=false;
  try{ await DS.commit([{t:T,id,val:val0,bseq:ver(id)}]); ok=true; }catch(e){ if(!e||!e.conflict) console.error(e); }
  finally{ u.enCours=false; }
  if(ok) dire(vb==null?'Volume retiré du module.':'Volume enregistré : '+mille(vb)+' m³.'); dessiner(u); }

window.sgSurfacesModule=function(C,p){ try{ css(); C.innerHTML=''; const box=document.createElement('div'); box.className='sgsf-box'; C.append(box);
    DS.need([T]).catch(()=>{}).then(()=>dessiner({p,box})); }
  catch(e){ console.error(e); C.innerHTML='<p style="padding:20px">Le module Surfaces et volumes n’a pas pu s’afficher.</p>'; } };
window.SGSF={val,T};
})();

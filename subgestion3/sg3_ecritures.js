/* ═══ CONTRÔLE DES COÛTS : FENÊTRES DES ÉCRITURES = PROPOSITION B « LISTE DES POSITIONS » (11.11.2026, bloc 51) ═══
   Paulo : « fais-moi de nouvelles propositions de design des fenêtres mutations, paiement, contrat, etc. ; reprends les éléments des fenêtres de l'ancien logiciel »,
   puis « variante B, ajoute la version A dans archives pour plus tard » ; maquettes : subgestion3/_backup_20261111_maquette_ecritures2/ (A avant / après, B liste des
   positions, C le document, D saisie express, E cascade). Remplace la version « Tableur » du 10.11.2026 (copie : _backup_20261111_avant_ecritures_liste/).
   Organisation de l'ancien logiciel, épurée : à gauche la liste des CFC du contrôle des coûts (recherche, « Seulement les positions comptabilisées », montants :
   adjugé / payé pour un paiement, devis révisé / adjugé pour un contrat, devis révisé / mutations pour une mutation, devis révisé / coût probable pour une provision) —
   double-clic ou Entrée = ajouter la position au paiement ou au contrat (déjà présente : curseur sur son montant) ; mutation : clic = CFC du cadre encadré
   (origine, puis destination ; ⌥ + clic = destination) ; provision : clic = CFC. À droite la fiche dans l'ordre d'origine : bandeau jaune (numéro, genre · statut,
   entreprise, lot / contrat / facture, total), entreprise et lot, « Positions du … » (saisie du brut | du net, ajouter), « Conditions du … » (condition, TVA, arrondi,
   paiements à ce jour ; colonne Sous-total), numéros et dates groupés, description et totaux. Mutation : cadres « Origine de la mutation » / « Mutation » /
   « Destination de la mutation » (avant / après · TTC du devis révisé de la position). Fenêtres du moteur (DeltaSub.html) enveloppées — mêmes champs, mêmes contrôles,
   même enregistrement ; éléments déplacés tels quels (gestionnaires gardés). Le moteur redessine ses tableaux à chaque modification : Tab, Entrée, ↑ ↓ et le clic
   gardent la cellule visée ; Échap rétablit la saisie en cours (sinon ferme la fenêtre comme avant). DeltaSub.html seul garde ses fenêtres.
   Styles <style id="sgew-css">, classes sgew-*. Débogage : window.SGEW. Fin du fichier : Archives ▸ Maquettes ▸ « Fenêtres des écritures · Avant / après » (mq-ecritures-a). */
(function(){
if(typeof ccPayment!=='function'||typeof ccContract!=='function'||typeof ccMut!=='function'||typeof ccEntry!=='function'||typeof linesGrid!=='function'||typeof condTable!=='function'||typeof ccCond!=='function'||typeof ccCalc!=='function') return;
const E=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const el=(t,c,html)=>{ const e=document.createElement(t); if(c) e.className=c; if(html!=null) e.innerHTML=html; return e; };
const mt=v=>{ const s=num(+v||0); return s===''?'0.00':s; };
const dd=s=>typeof dfr==='function'?dfr(s):(s||'');
const txtSel=s=>s&&s.options&&s.selectedIndex>=0&&s.options[s.selectedIndex]?(s.options[s.selectedIndex].text||'').trim():'';
const IC={plus:'<path d="M12 5v14M5 12h14"/>',pct:'<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  rond:'<path d="M4 10c2.5-2.5 5-2.5 8 0s5.5 2.5 8 0M4 15c2.5-2.5 5-2.5 8 0s5.5 2.5 8 0"/>',rec:'<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v5h5"/>',
  suiv:'<path d="M15 6 9 12l6 6"/>',srch:'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',x:'<path d="M7 7l10 10M17 7 7 17"/>'};
const svg=n=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="square" aria-hidden="true">'+(IC[n]||'')+'</svg>';
const CSS=`
.ov:has(>.dlg.sgew-dlg){padding-top:3vh}
.dlg.sgew-dlg{width:min(1280px,97vw)!important;max-width:97vw!important;max-height:94vh}
.dlg.sgew-dlg.sgew-dm{width:min(1220px,97vw)!important}
.dlg.sgew-dlg.sgew-de{width:min(1100px,97vw)!important}
.dlg.sgew-dlg>.tt{display:none}
.dlg.sgew-dlg>.bd{padding:0!important;overflow:hidden!important;display:grid!important;grid-template-columns:340px minmax(0,1fr);grid-template-rows:minmax(0,1fr);flex:1 1 auto;min-height:0}
.sgew-cache{display:none!important}
.sgew-nav{position:relative;min-height:460px;border-right:1px solid var(--s-filet);background:var(--s-fond);min-width:0}
.sgew-nin{position:absolute;inset:0;display:flex;flex-direction:column;gap:8px;padding:12px 12px 10px}
.sgew-sr{flex:none;display:flex;align-items:center;gap:8px;height:32px;padding:0 9px;border:1px solid var(--s-noir);background:#fff;cursor:text}
.sgew-sr svg{width:15px;height:15px;flex:none;color:var(--s-gris)}
.sgew-sr input{flex:1;min-width:0;height:30px;border:0;outline:0;background:transparent;font:inherit;font-size:13px;padding:0}
.sgew-nck{flex:none;display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer}
.sgew-nck input{margin:0}
.sgew-nh,.sgew-nr{display:grid;grid-template-columns:minmax(0,1fr) 82px 82px;gap:6px;align-items:center}
.sgew-nh{flex:none;font-size:11px;color:var(--s-gris);padding:6px 6px 5px;border-bottom:2px solid var(--s-noir)}
.sgew-nl{flex:1 1 auto;min-height:0;overflow:auto;outline:none;margin-top:-8px;background:#fff}
.sgew-nr{padding:5px 6px;border-bottom:1px solid var(--s-filet);font-size:12px;cursor:pointer;font-variant-numeric:tabular-nums;user-select:none}
.sgew-nr:hover{background:var(--s-jaune3)}
.sgew-nr.on{background:var(--s-jaune2)}
.sgew-nr.on2{background:var(--s-nuit3)}
.sgew-nr.sel{box-shadow:inset 3px 0 0 var(--s-nuit)}
.sgew-nl:focus-visible .sgew-nr.sel{outline:1px solid var(--s-nuit);outline-offset:-1px}
.sgew-nr .c{min-width:0}
.sgew-nr .c b{font-weight:700}
.sgew-nr .c i{font-style:normal;font-size:10px;padding:0 5px;margin-left:6px;background:var(--s-nuit);color:#fff;vertical-align:1px;white-space:nowrap}
.sgew-nr .c em{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;font-style:normal;font-size:11px;line-height:1.25;color:var(--s-gris);overflow:hidden;overflow-wrap:anywhere}
.sgew-nr.ti .c em{color:var(--s-noir);font-weight:700}
.sgew-nr .r,.sgew-nh .r{text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgew-nr .r{font-size:11.5px}
.sgew-nr .r.z{color:var(--s-gris2)}
.sgew-nv{padding:12px 6px;color:var(--s-gris);font-size:12px}
.sgew-nhint{flex:none;font-size:11.5px;color:var(--s-gris);border-top:1px solid var(--s-filet);padding-top:7px;line-height:1.35}
.sgew-main{display:flex;flex-direction:column;min-width:0;min-height:0}
.sgew-tete{flex:none;display:flex;align-items:center;gap:16px;background:var(--s-jaune2);padding:14px 22px}
.sgew-big{flex:none;font-size:30px;font-weight:700;color:var(--s-nuit);white-space:nowrap;font-variant-numeric:tabular-nums;line-height:1.1}
.sgew-fil{flex:none;align-self:stretch;width:2px;background:var(--s-noir)}
.sgew-id{flex:1 1 auto;min-width:0}
.sgew-id .lb{font-size:11.5px;color:var(--s-gris);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgew-id h3{font-size:19px;font-weight:700;margin:2px 0 3px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgew-id .meta{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgew-tot{flex:none;text-align:right;white-space:nowrap;padding-left:12px}
.sgew-tot span{display:block;font-size:11px;font-weight:700;color:var(--s-gris)}
.sgew-tot b{display:block;font-size:26px;font-weight:700;color:var(--s-nuit);line-height:1.15;font-variant-numeric:tabular-nums}
.sgew-tot em{display:block;font-style:normal;font-size:11.5px;color:var(--s-gris);font-variant-numeric:tabular-nums}
.sgew-note{flex:none;background:var(--s-jaune3)!important;border:0!important;border-top:1px solid var(--s-filet)!important;border-radius:0!important;margin:0!important;padding:7px 22px!important;font-size:12px}
.sgew-corps{flex:1 1 auto;min-height:0;overflow:auto;padding:14px 22px 18px;outline:none;border-top:1px solid var(--s-noir)}
.sgew-rg{display:grid;gap:10px 14px;align-items:end}
.sgew-rg+.sgew-rg{margin-top:10px}
.sgew-r2{grid-template-columns:minmax(0,1.5fr) minmax(0,1fr)}
.sgew-r4{grid-template-columns:repeat(4,minmax(0,1fr))}
.sgew-g4{grid-template-columns:repeat(4,minmax(0,1fr));margin-top:16px;padding-top:12px;border-top:1px solid var(--s-filet)}
.sgew-g2{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
.sgew-f{display:flex;flex-direction:column;gap:4px;min-width:0}
.sgew-f>.l{font-size:11px;font-weight:700;color:var(--s-gris);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:14px}
.sgew-f input.inp,.sgew-f select.inp,.sgew-f textarea.inp{height:32px;box-sizing:border-box;border:1px solid var(--s-gris3)!important;border-radius:0!important;width:100%!important;background:#fff;font-size:13px;margin:0}
.sgew-f input[type=number]{text-align:right;font-variant-numeric:tabular-nums}
.sgew-f textarea.inp{height:auto;min-height:54px;resize:vertical;padding:6px 9px;font-family:inherit;line-height:1.35}
.sgew-f input.inp:focus,.sgew-f select.inp:focus,.sgew-f textarea.inp:focus{outline:2px solid var(--s-nuit);outline-offset:-2px}
.sgew-f.ck{justify-content:flex-end}
.sgew-f.ck>label{min-height:32px;display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;cursor:pointer;line-height:1.2;text-align:left!important}
.sgew-ro{display:block!important;height:32px;box-sizing:border-box;padding:0 10px;line-height:30px;border:1px solid var(--s-filet);background:var(--s-fond);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:13px}
.sgew-lot{display:grid!important;grid-template-columns:90px minmax(0,1fr);gap:6px!important}
.sgew-nm{display:flex!important;align-items:center;gap:0}
.sgew-nm .inp{flex:1}
.sgew-nm .ib{flex:none;height:32px;min-width:32px;padding:0!important;border:1px solid var(--s-gris3)!important;border-left:0!important;border-radius:0!important;background:#fff!important;color:var(--s-nuit);justify-content:center}
.sgew-nm .ib:hover{background:var(--s-jaune3)!important}
.sgew-nm .ib svg{width:15px;height:15px}
.sgew-ent{display:flex!important;align-items:stretch!important;gap:0!important;height:32px;box-sizing:border-box;border:1px solid var(--s-gris3);background:#fff;min-width:0}
.sgew-ent>span{display:block;flex:1 1 auto!important;min-width:0;padding:0 10px;line-height:30px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:13px}
.sgew-ent .ib{flex:none;border:0!important;border-left:1px solid var(--s-filet)!important;border-radius:0!important;height:30px!important;min-width:32px;background:transparent!important;padding:0 9px!important;font-size:12px;color:var(--s-gris);gap:4px}
.sgew-ent .ib:hover{background:var(--s-jaune3)!important;color:var(--s-noir)}
.sgew-ent .ib svg{width:15px;height:15px;flex:0 0 15px}
.sgew-ent .ib.sgew-ico>span:not(.dd){display:none}
.sgew-h4{display:flex;align-items:center;gap:10px;margin:18px 0 4px;font-size:12.5px;font-weight:700;min-height:30px}
.sgew-ha{margin-left:auto;display:flex;align-items:center;gap:4px;font-weight:400;flex-wrap:wrap;justify-content:flex-end}
.sgew-lk{display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 8px;border:0;background:transparent;font:inherit;font-size:12.5px;color:var(--s-nuit);cursor:pointer;white-space:nowrap}
.sgew-lk:hover{background:var(--s-jaune3)}
.sgew-lk svg{width:15px;height:15px;flex:none}
.sgew-seg{display:inline-flex;border:1px solid var(--s-gris3);margin-left:6px}
.sgew-seg button{border:0;background:#fff;height:26px;padding:0 10px;font:inherit;font-size:12px;color:var(--s-gris);cursor:pointer;white-space:nowrap}
.sgew-seg button+button{border-left:1px solid var(--s-gris3)}
.sgew-seg button.on{background:var(--s-nuit);color:#fff}
.sgew-prio{display:flex!important;align-items:center;gap:6px;font-size:12px;cursor:pointer;margin-right:8px;white-space:nowrap}
.sgew-box{max-height:none!important;overflow:visible!important;border:0!important;background:transparent!important}
.sgew-box table{table-layout:fixed!important;width:100%!important;min-width:760px;border-collapse:collapse!important;font-variant-numeric:tabular-nums;margin:0}
.sgew-box thead th{position:static;background:#fff!important;border:0!important;border-bottom:2px solid var(--s-noir)!important;font-size:11.5px;font-weight:400;color:var(--s-gris)!important;padding:0 6px!important;height:28px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left;text-transform:none!important;letter-spacing:0!important;font-family:inherit!important}
.sgew-box th.r{text-align:right}
.sgew-box th.c{text-align:center}
.sgew-box tbody td{border:0!important;border-bottom:1px solid var(--s-filet)!important;padding:3px 6px!important;height:36px;overflow:hidden;font-size:13px;background:#fff;white-space:nowrap;text-overflow:ellipsis}
.sgew-box tbody tr.sgew-on td{background:var(--s-jaune3)}
.sgew-box td.r{text-align:right}
.sgew-box td.c{text-align:center}
.sgew-box td.sgew-k{color:var(--s-noir)}
.sgew-box td.st{color:var(--s-gris)}
.sgew-box input.inp,.sgew-box select.inp{width:100%!important;height:28px!important;box-sizing:border-box;border:1px solid var(--s-gris3)!important;border-radius:0!important;background:#fff!important;font-size:13px;padding:0 7px;color:inherit;margin:0;vertical-align:middle}
.sgew-box td.r input.inp,.sgew-box input[type=number]{text-align:right}
.sgew-box input[type=number],.sgew-f input[type=number]{-moz-appearance:textfield}
.sgew-box input[type=number]::-webkit-inner-spin-button,.sgew-box input[type=number]::-webkit-outer-spin-button,.sgew-f input[type=number]::-webkit-inner-spin-button,.sgew-f input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
.sgew-box input.inp:disabled{border-color:transparent!important;background:transparent!important;color:var(--s-noir);-webkit-text-fill-color:var(--s-noir);opacity:1;cursor:default}
.sgew-box input.inp:focus,.sgew-box select.inp:focus{outline:2px solid var(--s-nuit);outline-offset:-2px}
.sgew-box input[type=checkbox]{margin:0;vertical-align:middle;cursor:pointer}
.sgew-u{display:inline-block;width:20px;padding-left:4px;color:var(--s-gris);font-size:12px;vertical-align:middle}
.sgew-box td:has(>.sgew-u) input.inp{width:calc(100% - 20px)!important;display:inline-block}
.sgew-box td.x{padding:0!important;text-align:center}
.sgew-box td.x .ib{border:0!important;background:transparent!important;color:var(--s-gris);min-width:28px;height:28px;padding:0!important;justify-content:center}
.sgew-box td.x .ib:hover{color:var(--s-rouge);background:var(--s-jaune3)!important}
.sgew-box tfoot td{border:0!important;border-top:1px solid var(--s-noir)!important;height:32px;padding:0 6px!important;font-weight:700;font-size:13px;background:#fff;white-space:nowrap}
.sgew-vide{padding:10px 6px 2px;color:var(--s-gris);font-size:12.5px}
.sgew-pied{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:26px;margin-top:14px;align-items:start}
.sgew-pg{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}
.sgew-pg.p{grid-template-columns:minmax(0,1fr) minmax(0,1.6fr)}
.sgew-ann{display:flex!important;align-items:center;gap:8px;min-height:32px;font-size:13px}
.sgew-ann .ib{border:1px solid var(--s-gris3)!important;background:#fff!important;height:30px;border-radius:0!important}
.sgew-tots>div{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid var(--s-filet);font-size:13px;font-variant-numeric:tabular-nums;white-space:nowrap}
.sgew-tots>div>span{color:var(--s-gris)}
.sgew-tots>div.net{border-top:2px solid var(--s-noir);border-bottom:0;padding-top:8px;align-items:baseline}
.sgew-tots>div.net>span{color:var(--s-noir);font-weight:700}
.sgew-tots>div.net>b{font-size:20px;color:var(--s-nuit)}
.sgew-tots>div.stk{border:0;padding-top:0;font-size:11.5px}
.sgew-frs{display:grid;grid-template-columns:minmax(0,1fr) 220px minmax(0,1fr);gap:12px;margin-top:16px}
.sgew-frs.v{grid-template-columns:minmax(0,1fr) 240px}
.sgew-fr{border:1px solid var(--s-gris3);padding:10px 12px 12px;display:flex;flex-direction:column;gap:9px;min-width:0;background:#fff}
.sgew-fr.m{background:var(--s-nuit3);border-color:var(--s-nuit3)}
.sgew-fr.act{border:2px solid var(--s-nuit);padding:9px 11px 11px}
.sgew-frt{display:flex;justify-content:space-between;gap:8px;font-weight:700;font-size:12.5px}
.sgew-frt em{font-style:normal;font-weight:400;font-size:11px;color:var(--s-nuit);white-space:nowrap}
.sgew-kv{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;font-size:12px;margin-top:2px;font-variant-numeric:tabular-nums}
.sgew-kv span{color:var(--s-gris)}
.sgew-kv b{text-align:right;font-weight:400}
.sgew-kv b.ap{font-weight:700}
.sgew-tva{display:flex;align-items:center;gap:0;min-width:0}
.sgew-tva input.inp{width:72px!important;flex:none}
.sgew-tvm{margin-left:auto;font-variant-numeric:tabular-nums;font-size:13px}
.sgew-eff{margin-top:10px;font-size:12.5px;color:var(--s-gris)}
.sgew-eff b{color:var(--s-noir);font-variant-numeric:tabular-nums}
.dlg.sgew-dlg .ft .sgew-aide{margin-right:auto;align-self:center;font-size:11.5px;color:var(--s-gris);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.sgew-aide b{color:var(--s-noir);font-weight:700}
@media (max-width:1100px){.dlg.sgew-dlg>.bd{grid-template-columns:260px minmax(0,1fr)}.sgew-nh,.sgew-nr{grid-template-columns:minmax(0,1fr) 74px}.sgew-nh>.r:last-child,.sgew-nr>.r:last-child{display:none}}
`;
const cssE=()=>{ if(!document.getElementById('sgew-css')){ const s=document.createElement('style'); s.id='sgew-css'; s.textContent=CSS; document.head.appendChild(s); } };
/* champs des formulaires du moteur (formRows : libellé, champ) ; sec = titre (h3) qui précède le formulaire */
const champs=body=>{ const L=[]; body.querySelectorAll('.form').forEach(f=>{ const p=f.previousElementSibling, sec=p&&p.tagName==='H3'?p.textContent.trim():''; const k=[...f.children];
    for(let i=0;i+1<k.length;i+=2) L.push({l:k[i].textContent.trim(),c:k[i+1],sec}); });
  return (l,sec)=>{ const x=L.find(z=>z.l===l&&(sec==null||z.sec.startsWith(sec))); return x?x.c:null; }; };
const champ=(lb,c,cls)=>{ const f=el('div','sgew-f'+(cls?' '+cls:'')); f.append(el('div','l',E(lb||''))); if(c) f.append(c); return f; };
const rang=(cls,kids)=>{ const r=el('div','sgew-rg '+cls); kids.forEach(k=>{ if(k) r.append(k); }); return r; };
const lien=(ic,lb,t,fn)=>{ const b=el('button','sgew-lk',svg(ic)+'<span>'+E(lb)+'</span>'); b.type='button'; b.title=t||lb; b.addEventListener('mousedown',e=>e.preventDefault()); b.addEventListener('click',fn); return b; };
const h4=(t,kids)=>{ const d=el('div','sgew-h4','<span>'+E(t)+'</span>'), a=el('div','sgew-ha'); (kids||[]).forEach(k=>{ if(k) a.append(k); }); d.append(a); return d; };
const tete=()=>el('div','sgew-tete','<div class="sgew-big"></div><i class="sgew-fil"></i><div class="sgew-id"><div class="lb"></div><h3></h3><div class="meta"></div></div><div class="sgew-tot"><span></span><b></b><em></em></div>');
const remplir=(T,o)=>{ const q=s=>T.querySelector(s); q('.sgew-big').textContent=o.big||'—'; q('.lb').textContent=o.lb||''; q('h3').textContent=o.h3||''; q('h3').title=o.h3t||o.h3||'';
  q('.meta').textContent=o.meta||''; q('.meta').title=o.meta||''; q('.sgew-tot span').textContent=o.tl||''; q('.sgew-tot b').textContent=o.tv||''; q('.sgew-tot em').textContent=o.ts||''; };
const nomEnt=p=>{ const s=p&&p.querySelector('span'); return s?s.textContent.trim():''; };
const aide=(dlg,html)=>{ const ft=dlg.querySelector('.ft'); if(ft&&!ft.querySelector('.sgew-aide')) ft.prepend(el('div','sgew-aide',html)); };
const numero=numW=>{ numW.classList.add('sgew-nm'); [...numW.childNodes].forEach(n=>{ if(n.nodeType===3) n.remove(); }); const b=numW.querySelector('.ib'); if(b){ b.innerHTML=svg('suiv'); b.title='Prochain numéro libre'; } };
/* Échap : la saisie en cours est rétablie (valeur à l'entrée dans le champ) ; sans saisie en cours, la fenêtre se ferme comme avant */
const echap=dlg=>{ const VAL=new WeakMap(), txt=c=>c&&c.matches&&c.matches('input:not([type=checkbox]):not([type=radio]),textarea');
  dlg.addEventListener('focusin',e=>{ if(txt(e.target)) VAL.set(e.target,e.target.value); },true);
  dlg.addEventListener('keydown',e=>{ if(e.key!=='Escape') return; const c=e.target; if(!txt(c)||!VAL.has(c)||c.value===VAL.get(c)) return;
    c.value=VAL.get(c); c.dispatchEvent(new Event('input',{bubbles:true})); try{ c.select(); }catch(_){} e.preventDefault(); e.stopPropagation(); }); };
const choisir=(s,c)=>{ if(!s||s.value===c) return; if(![...s.options].some(o=>o.value===c)) return; s.value=c; s.dispatchEvent(new Event('change',{bubbles:true})); };

/* ══ Liste des positions (colonne de gauche) : CFC du contrôle des coûts, montants avant cette écriture (ccCalc) ══ */
const COMPTA_K='sg3_ew_compta';
function navPos(C,o){
  const R=ccCalc(C), titre=new Set(); R.codes.forEach(c=>{ const p=R.par(c); if(p) titre.add(p); });
  const sous=(x,c)=>{ for(let y=String(x||''),g=0;y&&g<20;y=R.par(y),g++) if(y===c) return true; return false; };
  const codes=R.codes.filter(c=>R.lbl.has(c)||(R.tot.get(c)&&R.tot.get(c).dg));   /* mêmes CFC que les listes déroulantes du moteur (ccPosSelect) */
  const compta=c=>{ const v=R.tot.get(c)||{}; return ['dg','dgRevise','contratsAvenants','paiements','provisions','coutProbable','mutations'].some(k=>Math.abs(v[k]||0)>0.004); };
  const nav=el('aside','sgew-nav'), inn=el('div','sgew-nin'), sr=el('label','sgew-sr',svg('srch')), q=document.createElement('input');
  q.type='search'; q.placeholder='Rechercher un CFC'; q.setAttribute('aria-label','Rechercher un CFC'); sr.append(q);
  const ck=el('label','sgew-nck'), cb=document.createElement('input'); cb.type='checkbox'; try{ cb.checked=localStorage.getItem(COMPTA_K)!=='0'; }catch(_){ cb.checked=true; }
  ck.append(cb,document.createTextNode('Seulement les positions comptabilisées'));
  const hd=el('div','sgew-nh','<span>CFC</span>'+o.cols.map(c=>'<span class="r">'+E(c[0])+'</span>').join('')), list=el('div','sgew-nl'), hint=el('div','sgew-nhint',o.hint||'');
  list.tabIndex=0; list.setAttribute('role','listbox'); list.setAttribute('aria-label','Positions du contrôle des coûts');
  inn.append(sr,ck,hd,list,hint); nav.append(inn);
  let sel=null;
  const render=()=>{ const t=q.value.trim().toLowerCase(), only=cb.checked, sc=list.scrollTop;
    const L=codes.filter(c=>{ const m=o.marque&&o.marque(c); if(only&&!compta(c)&&!m) return false; return !t||c.toLowerCase().startsWith(t)||(R.lbl.get(c)||'').toLowerCase().includes(t); });
    list.innerHTML=L.map(c=>{ const v=R.tot.get(c)||{}, m=(o.marque&&o.marque(c))||{}, lb=R.lbl.get(c)||'';
      return '<div class="sgew-nr'+(titre.has(c)?' ti':'')+(m.cls?' '+m.cls:'')+(c===sel?' sel':'')+'" role="option" data-c="'+E(c)+'" title="'+E(c+' '+lb+(m.title?' — '+m.title:''))+'">'
        +'<span class="c"><b>'+E(c)+'</b>'+(m.tag?'<i>'+E(m.tag)+'</i>':'')+'<em>'+E(lb)+'</em></span>'
        +o.cols.map(k=>{ const x=+k[1](v)||0; return Math.abs(x)>0.004?'<span class="r">'+E(num(x))+'</span>':'<span class="r z">—</span>'; }).join('')+'</div>'; }).join('')
      ||'<div class="sgew-nv">Aucune position'+(t?' pour « '+E(q.value.trim())+' »':'')+'.</div>';
    list.scrollTop=sc; };
  const choisirLigne=r=>{ sel=r.dataset.c; list.querySelectorAll('.sgew-nr.sel').forEach(x=>x.classList.remove('sel')); r.classList.add('sel'); };
  q.addEventListener('input',render);
  q.addEventListener('keydown',e=>{ if(e.key==='ArrowDown'){ e.preventDefault(); const r=list.querySelector('.sgew-nr'); if(r){ choisirLigne(r); list.focus(); } } else if(e.key==='Enter'){ e.preventDefault(); const r=list.querySelector('.sgew-nr'); if(r){ choisirLigne(r); o.pick(sel,e,true); } } });
  cb.addEventListener('change',()=>{ try{ localStorage.setItem(COMPTA_K,cb.checked?'1':'0'); }catch(_){} render(); });
  list.addEventListener('mousedown',e=>{ if(e.detail>1) e.preventDefault(); });
  list.addEventListener('click',e=>{ const r=e.target.closest('.sgew-nr'); if(!r) return; choisirLigne(r); o.pick(sel,e,false); });
  list.addEventListener('dblclick',e=>{ const r=e.target.closest('.sgew-nr'); if(!r) return; choisirLigne(r); o.pick(sel,e,true); });
  list.addEventListener('keydown',e=>{ const L=[...list.querySelectorAll('.sgew-nr')]; if(!L.length) return;
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); let i=L.findIndex(x=>x.dataset.c===sel); i=i<0?0:Math.max(0,Math.min(L.length-1,i+(e.key==='ArrowDown'?1:-1))); choisirLigne(L[i]); L[i].scrollIntoView({block:'nearest'}); }
    else if(e.key==='Enter'&&sel){ e.preventDefault(); o.pick(sel,e,true); } });
  render();
  return {nav,render,R,sous}; }

/* ══ Paiement (situation, hors contrat) et contrat / avenant : tableaux du moteur (linesGrid, condTable) ══ */
const TH={'NIV':['Niv.','Niveau : ordre du calcul des conditions'],'REF':['Réf.','Référence : niveau dont le résultat sert de base à la condition'],
  'Conditions':['Taux','Taux en % ou montant forfaitaire'],'M':['Appl.','Condition appliquée'],'Cumul acptes bruts':['Cumul brut','Montant brut cumulé des travaux exécutés à ce jour (situation)'],
  'Réf. cond.':['Réf. cond.','Référence de condition : la condition ne s’applique qu’aux positions qui ont la même référence'],'Genre':['Genre','Genre de la condition']};
const W_POS={'CFC':190,'Réf. cond.':80,'Adjudication brute':118,'Adjudication nette':118,'Cumul brut':130,'Brut':140,'Net':130,'':36};
const W_CND={'Niv.':50,'Réf.':48,'Genre':190,'Réf. cond.':80,'Taux':100,'Montant':106,'Sous-total':106,'Appl.':46,'':36};
const TH_R=new Set(['Adjudication brute','Adjudication nette','Cumul brut','Brut','Net','Taux','Montant','Sous-total']);
function habDoc(kind,dlg,args,cap){
  const lg=cap.find(x=>x.t==='lg'), ct=cap.find(x=>x.t==='ct'); if(!lg||!ct||!lg.o||!ct.o) return; const doc=lg.doc;
  const bd=dlg.querySelector('.bd'), body=bd&&bd.firstElementChild; if(!body) return;
  const get=champs(body), kids=[...body.children];
  const titre=re=>kids.find(k=>{ const b=k.querySelector&&k.querySelector(':scope>b'); return b&&re.test(b.textContent); });
  const hPos=titre(/^Positions/), hCnd=titre(/^Conditions/); if(!hPos||!hCnd) return;
  const pay=kind==='pay', C=args[0], ctr=pay?args[2]:null, typ=pay?null:args[2], par=pay?null:(args[5]||(args[1]&&(C.contrats||[]).find(x=>x.id===args[1].contratParentId))||null);
  const ent=get('Entreprise'), lot=get('Lot d’adjudication'), dsc=get('Description'), st=get('Statut');
  const f=pay?{com:get('Commentaire'),code:get('Genre de paiement'),der:get(''),num:get('N° pmt'),df:get('Date fact.'),nf:get('N° fact'),dp:get('Date pmt')}
    :{des:get('Désignation'),num:get('Numéro'),dt:get('Date'),gar:get('Délai de garantie'),ann:get('')};
  if(!ent||!lot||!st||!f.num||(pay&&(!f.code||!f.df||!f.nf||!f.dp))||(!pay&&(!f.des||!f.dt))) return;
  cssE();
  const saisie=hPos.querySelector('select'), bPos=[...hPos.querySelectorAll('.ib')].pop()||null, prio=pay?null:hPos.querySelector('label');
  const totB=[...hCnd.children].filter(x=>x.tagName==='B').pop()||null, bSI=[...hCnd.querySelectorAll('.ib')].find(b=>/Paiements/.test(b.textContent))||null;
  const [bCnd,bTva,bArr]=[...ct.o.bar.querySelectorAll('.ib')];
  const note=kids.find(k=>k.tagName==='DIV'&&!k.classList.contains('form')&&!k.querySelector('.form,table,select,input')&&/soumission/i.test(k.textContent))||null;
  const capT=b=>b?b.textContent.replace(/\s*:\s*$/,'').trim():'';
  const boxes=[lg.o.box,ct.o.box]; boxes.forEach(b=>b.classList.add('sgew-box'));
  /* ─ mise en page ─ */
  dlg.classList.add('sgew-dlg'); dlg.style.width='';
  const T=tete(), main=el('div','sgew-main'), corps=el('div','sgew-corps'), cache=el('div','sgew-cache');
  ent.classList.add('sgew-ent'); if(note) note.classList.add('sgew-note');
  if(pay){ lot.classList.add('sgew-ro'); lot.title=lot.textContent.trim(); } else lot.classList.add('sgew-lot');
  const seg=saisie?el('div','sgew-seg'):null;
  if(seg){ [['brut','Saisie du brut'],['net','Saisie du net']].forEach(([v,l])=>{ const b=el('button','',E(l)); b.type='button'; b.dataset.v=v; b.title=l+' des positions';
      b.addEventListener('mousedown',e=>e.preventDefault()); b.onclick=()=>{ if(saisie.value===v) return; act(()=>{ saisie.value=v; saisie.dispatchEvent(new Event('change')); }); majSeg(); }; seg.append(b); }); }
  if(prio) prio.classList.add('sgew-prio');
  const hP=h4(capT(hPos.querySelector(':scope>b'))||'Positions',[prio,bPos?lien('plus','Ajouter une position','Ajouter une ligne vide (ou double-clic sur un CFC de la liste à gauche)',()=>ajouter(null)):null,seg]);
  const hC=h4(capT(hCnd.querySelector(':scope>b'))||'Conditions',[bCnd?lien('plus','Condition','Ajouter une condition (rabais, escompte, retenue…)',()=>act(()=>bCnd.click(),{bi:1,r:'last',k:0})):null,
    bTva?lien('pct','TVA','Ajouter la TVA',()=>act(()=>bTva.click(),{bi:1,r:'last',k:0})):null,bArr?lien('rond','Arrondi','Ajouter un arrondi',()=>act(()=>bArr.click(),{bi:1,r:'last',k:0})):null,
    bSI?lien('rec','Paiements à ce jour','Recalculer « Paiements à ce jour » : somme des paiements antérieurs du contrat et de ses avenants (sans la TVA)',()=>act(()=>bSI.click())):null]);
  const haut=rang('sgew-r2',[champ('Entreprise',ent),champ('Lot d’adjudication',lot)]);
  const nW=f.num;
  const g=pay?rang('sgew-g4',[champ('Commentaire',f.com),champ('Genre de paiement',f.code),champ('Statut',st),f.der?champ('',f.der,'ck'):el('div'),
      champ('N° de paiement',nW),champ('Date de facture',f.df),champ('N° de facture',f.nf),champ('Date de paiement',f.dp)])
    :rang('sgew-g4',[champ('Désignation',f.des),champ('Numéro',nW),champ('Date',f.dt),champ('Statut',st)]);
  const tots=el('div','sgew-tots'), pied=el('div','sgew-pied'), pg=el('div','sgew-pg');
  pg.append(champ('Description',dsc)); if(!pay){ if(f.gar) pg.append(champ('Délai de garantie',f.gar)); if(f.ann){ f.ann.classList.add('sgew-ann'); pg.append(champ('Annexes',f.ann)); } }
  pied.append(pg,tots);
  corps.tabIndex=-1;
  corps.append(haut,hP,lg.o.box,hC,ct.o.box,g,pied);
  main.append(T,...(note?[note]:[]),corps);
  /* liste des positions : CFC du paiement / du contrat marqués ; double-clic = ajouter */
  const lignesCfc=()=>new Set((doc.lignes||[]).map(l=>String(l.cfc||'')).filter(Boolean));
  const refCfc=new Set((pay?(ctr?[ctr,...(C.contrats||[]).filter(a=>a.contratParentId===ctr.id&&a.lieAuContrat!==false)]:[]):(par?[par]:[])).flatMap(c=>(c.lignes||[]).map(l=>String(l.cfc))));
  const N=navPos(C,{cols:pay?[['Adjugé',v=>v.contratsAvenants],['Payé',v=>v.paiements]]:[['Devis révisé',v=>v.dgRevise],['Adjugé',v=>v.contratsAvenants]],
    hint:'<b>Double-clic</b> ou <b>Entrée</b> : ajouter la position '+(pay?'au paiement':typ==='avenant'?'à l’avenant':'au contrat')+' · position déjà présente : curseur sur son montant',
    marque:c=>{ const L=lignesCfc(); if(L.has(c)) return {cls:'on',tag:'✓',title:pay?'dans ce paiement':'dans '+(typ==='avenant'?'cet avenant':'ce contrat')};
      if(refCfc.has(c)) return {cls:'on2',tag:pay?'contrat':'contrat',title:pay?'position du contrat':'position du contrat principal'}; return null; },
    pick:(c,e,dbl)=>{ const rows=lignesRows(), i=(doc.lignes||[]).findIndex(l=>String(l.cfc)===c); if(i>=0){ const n=rows[i]&&rows[i].querySelector('input[type=number]:not([disabled])'); if(n){ n.focus(); try{ n.select(); }catch(_){} } return; }
      if(dbl) ajouter(c); }});
  cache.append(hPos,hCnd,ct.o.bar,...kids.filter(k=>k.isConnected&&k.parentNode===body));
  bd.replaceChildren(N.nav,main,cache);
  aide(dlg,'<b>Tab</b> champ suivant · <b>Entrée</b> ligne suivante · <b>↑ ↓</b> lignes · <b>Échap</b> annule la saisie');
  /* ─ tableaux : habillage après chaque dessin du moteur ─ */
  const deco=t=>{ if(!t||t._sgew) return; t._sgew=1; const cnd=t.parentNode===ct.o.box;
    const hr=t.tHead&&t.tHead.rows[0], tb=t.tBodies[0]; if(!hr||!tb) return;
    [...hr.cells].forEach(th=>{ const m=TH[th.textContent.trim()]; if(m){ th.textContent=m[0]; th.title=m[1]; } });
    const tot=[...tb.rows].find(tr=>tr.style.fontWeight); if(tot){ tot.style.fontWeight=''; t.createTFoot().append(tot); }
    if(cnd){ const r=ccCond(doc.lignes||[],doc.conditions||[]), lv=[...new Set((doc.conditions||[]).map(c=>c.niveau))].sort((a,b)=>a-b), sub=n=>r.T.brut+lv.filter(x=>x<=n).reduce((a,x)=>a+(r.par[x]||0),0);
      const th=document.createElement('th'); th.textContent='Sous-total'; th.title='Montant après ce niveau : brut des positions et conditions jusqu’à ce niveau'; hr.insertBefore(th,hr.cells[7]||null);
      [...tb.rows].forEach((tr,i)=>{ const c=(doc.conditions||[])[i], td=el('td','r st'); td.textContent=c?num(sub(c.niveau)):''; tr.insertBefore(td,tr.cells[7]||null);
        const g=tr.cells[3]; if(g) [...g.childNodes].forEach(nd=>{ if(nd.nodeType===3) nd.remove(); });   /* lettre de l'ancien logiciel (M, SI, S, G, %) : le genre la donne */
        const x=tr.cells[5]; if(x) [...x.childNodes].forEach(nd=>{ if(nd.nodeType===3&&nd.textContent.trim()) nd.replaceWith(el('span','sgew-u',E(nd.textContent.trim()))); else if(nd.nodeType===3) nd.remove(); }); }); }
    [...hr.cells].forEach(th=>{ const k=th.textContent.trim(); if(TH_R.has(k)) th.classList.add('r'); if(k==='Appl.') th.classList.add('c'); });
    [...tb.rows].forEach(tr=>{ const l=tr.lastElementChild; if(l&&l.querySelector('.ib')){ l.classList.add('x'); const b=l.querySelector('.ib'); b.innerHTML=svg('x'); b.title=cnd?'Supprimer la condition':'Supprimer la position'; }
      [...tr.cells].forEach(td=>{ const c=td.querySelector('input,select'); if(c&&c.type==='checkbox') td.classList.add('c'); else if(!c&&!td.classList.contains('x')) td.classList.add('sgew-k'); }); });
    const W=cnd?W_CND:W_POS, cg=document.createElement('colgroup'); [...hr.cells].forEach(th=>{ const col=document.createElement('col'), w=W[th.textContent.trim()]; if(w) col.style.width=w+'px'; cg.append(col); }); t.prepend(cg);
    if(!tb.rows.length) t.after(el('div','sgew-vide',cnd?'Aucune condition. « Condition » ou « TVA » pour en ajouter une.':'Aucune position. Double-clic sur un CFC de la liste à gauche, ou « Ajouter une position ».')); };
  const decoTout=()=>boxes.forEach(b=>deco(b.querySelector('table')));
  const tbd=i=>{ const t=boxes[i]&&boxes[i].querySelector('table'); return t?t.tBodies[0]:null; };
  const lignesRows=()=>{ const b=tbd(0); return b?[...b.rows].filter(r=>r.cells[0]&&r.cells[0].querySelector('select')):[]; };
  const ctl=(tr,k)=>{ const td=tr&&tr.cells[k]; return td?td.querySelector('input:not([disabled]),select:not([disabled])'):null; };
  const pos=c=>{ const td=c&&c.closest&&c.closest('tbody td'); if(!td) return null; const tr=td.parentNode, bi=boxes.findIndex(b=>b.contains(tr)); return bi<0?null:{bi,r:tr.sectionRowIndex,k:td.cellIndex}; };
  const suivant=(p,pas)=>{ let bi=p.bi, r=p.r, k=p.k;
    for(let g2=0;g2<4000;g2++){ k+=pas; let b=tbd(bi), q=b&&b.rows[r];
      if(!q||k<0||k>=q.cells.length){ r+=pas; q=b&&b.rows[r];
        while(!q){ bi+=pas; if(bi<0||bi>=boxes.length) return null; b=tbd(bi); if(!b) continue; r=pas>0?0:b.rows.length-1; q=b.rows[r]; }
        k=pas>0?-1:q.cells.length; continue; }
      if(ctl(q,k)) return {bi,r,k}; }
    return null; };
  const vertical=(p,pas)=>{ const b=tbd(p.bi); let r=p.r+pas; while(b&&b.rows[r]){ if(ctl(b.rows[r],p.k)) return {bi:p.bi,r,k:p.k}; r+=pas; } return null; };
  let rep=null, ACT=null;
  const surligner=()=>{ corps.querySelectorAll('tr.sgew-on').forEach(tr=>tr.classList.remove('sgew-on')); if(!ACT) return; const b=tbd(ACT.bi), tr=b&&b.rows[ACT.r]; if(tr) tr.classList.add('sgew-on'); else ACT=null; };
  const majSeg=()=>{ if(seg) seg.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===(saisie.value==='net'?'net':'brut'))); };
  const majTots=r=>{ const tv=[...new Set((doc.conditions||[]).filter(c=>c.kind===6&&c.appliquee!==false).map(c=>+c.valeur||0))], stk=/stocké\s+(\S+)/.exec(totB?totB.textContent:'');
    const L=[['Brut des positions',r.T.brut],['Conditions hors TVA',r.T.ht-r.T.brut],['Net HT',r.T.ht],['TVA'+(tv.length===1?' '+tv[0]+' %':''),r.T.tva]];
    tots.innerHTML=L.map(([a,b])=>'<div><span>'+E(a)+'</span><b>'+mt(b)+'</b></div>').join('')+'<div class="net"><span>'+(pay?'Paiement net TTC':'Montant net TTC')+'</span><b>'+mt(r.T.net)+'</b></div>'
      +(stk?'<div class="stk" title="Montant enregistré du document, avant toute modification"><span>Montant enregistré</span><b>'+E(stk[1])+'</b></div>':''); };
  const majTete=()=>{ const r=ccCond(doc.lignes||[],doc.conditions||[]), n=(f.num.value||'').trim()||'—';
    if(pay){ const lo=lot.textContent.trim();
      remplir(T,{big:n,lb:['Paiement n° '+n,txtSel(f.code)||(ctr?'Situation':'Paiement'),txtSel(st)].filter(Boolean).join(' · '),h3:nomEnt(ent),
        meta:[lo?'Lot '+lo:'',ctr?'contrat n° '+(ctr.numero||'—')+(ctr.date?' du '+dd(ctr.date):''):'hors contrat',f.nf.value.trim()?'facture '+f.nf.value.trim()+(f.df.value?' du '+dd(f.df.value):''):''].filter(Boolean).join(' · '),
        tl:'Paiement net TTC',tv:mt(r.T.net),ts:'dont TVA '+mt(r.T.tva)}); }
    else { const av=typ==='avenant', lo=[...lot.querySelectorAll('input')].map(i=>i.value.trim()).filter(Boolean).join(' ');
      remplir(T,{big:n,lb:[av?'Avenant n° '+n+(par?' au contrat n° '+(par.numero||'—'):''):'Contrat n° '+n,txtSel(st)].filter(Boolean).join(' · '),h3:nomEnt(ent),
        meta:[lo?'Lot '+lo:'',f.des.value.trim(),f.dt.value?'du '+dd(f.dt.value):''].filter(Boolean).join(' · '),tl:'Montant net TTC',tv:mt(r.T.net),ts:'dont TVA '+mt(r.T.tva)}); }
    majTots(r); };
  const appliquer=()=>{ decoTout(); let n=null;
    if(rep){ const R=rep; rep=null; const b=tbd(R.bi); if(b&&b.rows.length){ const r=R.r==='last'?b.rows.length-1:Math.max(0,Math.min(R.r,b.rows.length-1)), q=b.rows[r];
        if(R.k==='num') n=q.querySelector('input[type=number]:not([disabled])'); else n=ctl(q,R.k); if(!n) for(let k=0;k<q.cells.length&&!n;k++) n=ctl(q,k); } }
    if(n){ n.focus(); if(n.select&&n.tagName!=='SELECT'&&n.type!=='checkbox') try{ n.select(); }catch(_){} const p=pos(n); if(p) ACT=p; }   /* ligne active posée aussi sans événement focusin */
    else if(!dlg.contains(document.activeElement)) corps.focus({preventScroll:true});   /* champ détruit par le redessin : le clavier et Échap restent dans la fenêtre */
    surligner(); majSeg(); majTete(); N.render(); };
  /* outils : la saisie en cours est validée d'abord (le moteur redessine tout à la modification), puis l'action ; le curseur va à la cellule visée */
  const act=(fn,cible)=>{ const a=document.activeElement; if(a&&corps.contains(a)&&a.closest('tbody')){ a.blur(); decoTout(); } rep=cible||(ACT?{...ACT}:null); fn(); setTimeout(()=>{ rep=null; },0); };
  const ajouter=c=>{ if(!bPos) return; act(()=>{ bPos.click(); if(c){ const L=lignesRows(), tr=L[L.length-1], s=tr&&tr.cells[0].querySelector('select'); if(s) choisir(s,c); } },{bi:0,r:'last',k:c?'num':0}); };
  corps.addEventListener('focusin',e=>{ const p=pos(e.target); if(p){ ACT=p; surligner(); } });
  corps.addEventListener('mousedown',e=>{ const td=e.target.closest&&e.target.closest('tbody td'); if(!td) return; const p=pos(td); if(!p) return; ACT=p; const c=e.target.closest('input,select');
    if(c&&c!==document.activeElement){ rep={...p}; setTimeout(()=>{ rep=null; },0); } else if(!c) surligner(); },true);
  corps.addEventListener('change',e=>{ const c=e.target; if(rep||!c.closest||!c.closest('tbody')||(c.tagName!=='SELECT'&&c.type!=='checkbox')) return; const p=pos(c); if(p){ rep=p; setTimeout(()=>{ rep=null; },0); } },true);
  corps.addEventListener('keydown',e=>{ const c=e.target; if(!c.closest||!c.closest('tbody')||c.tagName==='TEXTAREA') return; const p=pos(c); if(!p) return;
    if(e.key==='Tab'){ rep=suivant(p,e.shiftKey?-1:1); setTimeout(()=>{ rep=null; },0); return; }
    if(e.key!=='Enter'&&e.key!=='ArrowDown'&&e.key!=='ArrowUp') return; if(c.tagName==='SELECT'&&e.key!=='Enter') return;
    const q=vertical(p,e.key==='ArrowUp'?-1:1)||(e.key==='Enter'?suivant(p,1):null); e.preventDefault(); if(!q) return;
    rep=q; c.blur(); const b=tbd(q.bi), n=b&&b.rows[q.r]&&ctl(b.rows[q.r],q.k); if(rep&&n&&n.isConnected){ rep=null; n.focus(); if(n.select&&n.tagName!=='SELECT'&&n.type!=='checkbox') try{ n.select(); }catch(_){} } setTimeout(()=>{ rep=null; },0); });
  [haut,g,pied].forEach(x=>{ x.addEventListener('input',majTete); x.addEventListener('change',majTete); });
  new MutationObserver(majTete).observe(ent,{subtree:true,childList:true,characterData:true});
  const mo=new MutationObserver(appliquer); boxes.forEach(b=>mo.observe(b,{childList:true}));
  echap(dlg);
  /* premier curseur : lot à saisir (contrat), sinon le premier montant à saisir, sinon la recherche des positions */
  const lotN=pay?null:lot.querySelector('input');
  appliquer();
  let f0=lotN&&!lotN.value.trim()?lotN:null; if(!f0){ const b=tbd(0); if(b) for(const tr of b.rows){ for(const td of tr.cells){ const c=td.querySelector('input[type=number]:not([disabled])'); if(c){ f0=c; break; } } if(f0) break; } }
  if(!f0) f0=N.nav.querySelector('.sgew-sr input'); if(f0){ f0.focus(); if(f0.select) try{ f0.select(); }catch(_){} const p=pos(f0); if(p){ ACT=p; surligner(); } }
  window.SGEW.dernier={kind,dlg,doc,appliquer,nav:N};
}

/* ══ Mutation (transfert, variation, renchérissement) et provision / coût probable : cadres de l'ancien logiciel, champs HT / TVA / TTC du moteur (htTtc) ══ */
const cadre=(t,cls,kids)=>{ const d=el('div','sgew-fr'+(cls?' '+cls:'')); d.append(el('div','sgew-frt','<span>'+E(t)+'</span><em></em>')); kids.forEach(k=>{ if(k) d.append(k); }); return d; };
const tvaBloc=(tva,tvm)=>{ const w=el('div','sgew-tva'); w.append(tva,el('span','sgew-u','%'),tvm); return w; };
function habMut(dlg,args){ const C=args[0], genre=args[1], m0=args[2]||null, tr0=genre==='transfert';
  const bd=dlg.querySelector('.bd'), body=bd&&bd.firstElementChild; if(!body) return; const get=champs(body);
  const gen=get('Genre de mutation'), st=get('Statut'), oP=tr0?get('CFC','Origine'):null, oE=tr0?get('Entreprise','Origine'):null, dP=get('CFC',tr0?'Destination':'Position'), dE=get('Entreprise',tr0?'Destination':'Position');
  const ht=get('Total HT'), tvaW=get('TVA'), ttc=get('Total TVA incl.'), numW=get('Numéro de mutation'), rem=get('Remarque'), dt=get('Date'), com=get('Commentaire');
  const tva=tvaW&&tvaW.querySelector('input'), num2=numW&&numW.querySelector('input');
  if(!gen||!st||!dP||!dE||!ht||!tva||!ttc||!num2||!dt||(tr0&&(!oP||!oE))) return; cssE();
  dlg.classList.add('sgew-dlg','sgew-dm'); dlg.style.width='';
  const T=tete(), main=el('div','sgew-main'), corps=el('div','sgew-corps'), cache=el('div','sgew-cache');
  numero(numW); [oE,dE].forEach(p=>{ if(p){ p.classList.add('sgew-ent'); const b=p.querySelector('.ib'); if(b) b.classList.add('sgew-ico'); } });   /* cadres étroits : « Intervenants » en icône seule */
  const kvO=el('div','sgew-kv'), kvD=el('div','sgew-kv'), tvm=el('span','sgew-tvm');
  const fO=tr0?cadre('Origine de la mutation','o',[champ('CFC',oP),champ('Entreprise',oE),kvO]):null;
  const fM=cadre('Mutation','m',[champ('Total HT',ht),champ('TVA',tvaBloc(tva,tvm)),champ('Total TVA incl.',ttc)]);
  const fD=cadre(tr0?'Destination de la mutation':(genre==='rencherissement'?'Position renchérie':'Position'),'d',[champ('CFC',dP),champ('Entreprise',dE),kvD]);
  const frs=el('div','sgew-frs'+(tr0?'':' v')); frs.append(...(tr0?[fO,fM,fD]:[fD,fM]));
  const eff=el('div','sgew-eff');
  corps.tabIndex=-1;
  corps.append(rang('sgew-r4',[champ('Genre de mutation',gen),champ('Statut',st),champ('N° de mutation',numW),champ('Date',dt)]),frs,eff,
    rang('sgew-g2',[rem?champ('Remarque (affichée dans le contrôle du coût)',rem):null,com?champ('Commentaire',com):null]));
  main.append(T,corps);
  /* cadre visé par un clic dans la liste : origine tant qu'elle est vide, puis destination ; ⌥ + clic = destination */
  let vise=tr0&&!oP.value?'o':'d';
  const viser=k=>{ vise=tr0?k:'d'; if(fO) fO.classList.toggle('act',vise==='o'); fD.classList.toggle('act',vise==='d'||!tr0); if(fO) fO.querySelector('.sgew-frt em').textContent=vise==='o'?'clic dans la liste':''; fD.querySelector('.sgew-frt em').textContent=vise==='d'||!tr0?'clic dans la liste':''; };
  if(fO) fO.addEventListener('focusin',()=>viser('o')); fD.addEventListener('focusin',()=>viser('d'));
  const N=navPos(C,{cols:[['Devis révisé',v=>v.dgRevise],['Mutations',v=>v.mutations]],
    hint:tr0?'<b>Clic</b> : CFC du cadre encadré (l’origine, puis la destination) · <b>⌥ + clic</b> : destination':'<b>Clic</b> : CFC de la position',
    marque:c=>tr0&&oP.value===c?{cls:'on',tag:'origine'}:dP.value===c?{cls:'on2',tag:tr0?'destination':'position'}:null,
    pick:(c,e)=>{ const k=!tr0||e.altKey?'d':vise; choisir(k==='o'?oP:dP,c); if(k==='o'&&!dP.value) viser('d'); maj(); }});
  cache.append(...[...body.children]); bd.replaceChildren(N.nav,main,cache);
  aide(dlg,'<b>Tab</b> champ suivant · <b>Échap</b> annule la saisie');
  /* devis révisé TTC de la position avant cette mutation (une mutation déjà enregistrée en est retirée) et après */
  const effet=(x,c)=>{ if(!x||!c) return 0; let e=0; if(x.destination&&x.destination.cfc&&N.sous(x.destination.cfc,c)) e+=+x.ttc||0; if(x.origine&&x.origine.cfc&&N.sous(x.origine.cfc,c)) e-=+x.ttc||0; return e; };
  const avant=c=>((N.R.tot.get(c)||{}).dgRevise||0)-effet(m0,c);
  const kv=(box,c,sgn)=>{ if(!c){ box.innerHTML='<span>Devis révisé · TTC</span><b>—</b>'; return; } const a=avant(c), x=sgn*(+ttc.value||0);
    box.innerHTML='<span>Avant · TTC</span><b>'+mt(a)+'</b><span>Mutation</span><b>'+(x>0?'+ ':'')+mt(x)+'</b><span>Après · TTC</span><b class="ap">'+mt(a+x)+'</b>'; };
  const code=s=>s.value||'—';
  const maj=()=>{ const h=+ht.value||0, x=tva.value===''?'':tva.value, c=+ttc.value||0;
    tvm.textContent=mt(c-h); if(tr0) kv(kvO,oP.value,-1); kv(kvD,dP.value,1);
    eff.innerHTML='Effet sur le devis général révisé : <b>'+(tr0?'0.00':(c>0?'+ ':'')+mt(c))+'</b>'+(tr0?' (un transfert déplace le montant d’un CFC à l’autre)':'');
    remplir(T,{big:(num2.value||'').trim()||'—',lb:['Mutation n° '+((num2.value||'').trim()||'—'),txtSel(gen),txtSel(st)].filter(Boolean).join(' · '),
      h3:tr0?code(oP)+' → '+code(dP):(txtSel(dP)||'Position à choisir'),h3t:tr0?txtSel(oP)+' → '+txtSel(dP):'',
      meta:[tr0?nomEnt(oE)+' → '+nomEnt(dE):nomEnt(dE),dt.value?dd(dt.value):''].filter(Boolean).join(' · '),tl:'Montant TTC',tv:mt(c),ts:'HT '+mt(h)+' · TVA '+(x===''?'0':x)+' %'});
    N.render(); };
  dlg.addEventListener('input',maj); dlg.addEventListener('change',maj); [oE,dE].forEach(p=>{ if(p) new MutationObserver(maj).observe(p,{subtree:true,childList:true,characterData:true}); });
  echap(dlg); viser(vise); maj();
  const f0=tr0&&!oP.value?N.nav.querySelector('.sgew-sr input'):!dP.value?N.nav.querySelector('.sgew-sr input'):ht; f0.focus(); if(f0.select) try{ f0.select(); }catch(_){}
  window.SGEW.dernier={kind:'mut',dlg,nav:N}; }
function habEntry(dlg,args){ const C=args[0], type=args[1];
  const bd=dlg.querySelector('.bd'), body=bd&&bd.firstElementChild; if(!body) return; const get=champs(body);
  const P=get('CFC'), En=get('Entreprise'), rem=get('Remarque'), dt=get('Date'), ht=get('Total HT'), tvaW=get('TVA'), ttc=get('Total TVA incl.'), tva=tvaW&&tvaW.querySelector('input');
  const z=[...body.querySelectorAll('label')].find(l=>l.querySelector('input[type=checkbox]'))||null;
  if(!P||!En||!rem||!dt||!ht||!tva||!ttc) return; cssE();
  dlg.classList.add('sgew-dlg','sgew-de'); dlg.style.width='';
  const T=tete(), main=el('div','sgew-main'), corps=el('div','sgew-corps'), cache=el('div','sgew-cache'), kvP=el('div','sgew-kv'), tvm=el('span','sgew-tvm');
  const nom=type==='provision'?'Provision':'Coût probable perso'; En.classList.add('sgew-ent'); { const b=En.querySelector('.ib'); if(b) b.classList.add('sgew-ico'); }
  const fP=cadre('Position','d act',[champ('CFC',P),champ('Entreprise',En),kvP]), fM=cadre(nom,'m',[champ('Total HT',ht),champ('TVA',tvaBloc(tva,tvm)),champ('Total TVA incl.',ttc),z?champ('',z,'ck'):null]);
  fP.querySelector('.sgew-frt em').textContent='clic dans la liste';
  const frs=el('div','sgew-frs v'); frs.append(fP,fM);
  corps.tabIndex=-1; corps.append(rang('sgew-g2',[champ('Date',dt),champ('Remarque (affichée dans le contrôle du coût)',rem)]),frs);
  main.append(T,corps);
  const N=navPos(C,{cols:[['Devis révisé',v=>v.dgRevise],['Coût probable',v=>v.coutProbable]],hint:'<b>Clic</b> : CFC de l’écriture',
    marque:c=>P.value===c?{cls:'on',tag:'✓'}:null,pick:c=>{ choisir(P,c); maj(); }});
  cache.append(...[...body.children]); bd.replaceChildren(N.nav,main,cache);
  aide(dlg,'<b>Tab</b> champ suivant · <b>Échap</b> annule la saisie');
  const maj=()=>{ const h=+ht.value||0, x=tva.value===''?'0':tva.value, c=+ttc.value||0, lib=txtSel(P), v=N.R.tot.get(P.value)||{}; tvm.textContent=mt(c-h);
    kvP.innerHTML=P.value?'<span>Devis révisé · TTC</span><b>'+mt(v.dgRevise)+'</b><span>Coût probable · TTC</span><b>'+mt(v.coutProbable)+'</b>'+(type==='provision'?'<span>Provisions · TTC</span><b>'+mt(v.provisions)+'</b>':''):'<span>Devis révisé · TTC</span><b>—</b>';
    remplir(T,{big:P.value||'—',lb:[nom,dt.value?dd(dt.value):''].filter(Boolean).join(' · '),h3:P.value?lib.replace(/^\S+\s*/,'')||lib:'Position à choisir',meta:[nomEnt(En),rem.value.trim()].filter(Boolean).join(' · '),
      tl:'Montant TTC',tv:mt(c),ts:'HT '+mt(h)+' · TVA '+x+' %'}); N.render(); };
  dlg.addEventListener('input',maj); dlg.addEventListener('change',maj); new MutationObserver(maj).observe(En,{subtree:true,childList:true,characterData:true});
  echap(dlg); maj();
  const f0=P.value?ht:N.nav.querySelector('.sgew-sr input'); f0.focus(); if(f0.select) try{ f0.select(); }catch(_){}
  window.SGEW.dernier={kind:'entry',dlg,nav:N}; }

/* ══ Enveloppes : la fenêtre du moteur est créée, puis habillée (les tableaux du moteur sont repérés pendant sa construction) ══ */
const envelopper=(f0,kind)=>function(){ const n0=document.querySelectorAll('.dlg').length, cap=[], lg0=linesGrid, ct0=condTable; let r;
  if(kind==='pay'||kind==='ctr'){ linesGrid=function(C,doc){ const o=lg0.apply(this,arguments); cap.push({t:'lg',doc,o}); return o; }; condTable=function(doc){ const o=ct0.apply(this,arguments); cap.push({t:'ct',doc,o}); return o; }; }
  try{ r=f0.apply(this,arguments); } finally { linesGrid=lg0; condTable=ct0; }
  const L=document.querySelectorAll('.dlg'); if(L.length>n0){ const d=L[L.length-1], a=[...arguments];
    try{ if(kind==='mut') habMut(d,a); else if(kind==='entry') habEntry(d,a); else habDoc(kind,d,a,cap); }catch(e){ console.error(e); } }
  return r; };
window.SGEW={dernier:null,habDoc,habMut,habEntry,navPos};
ccPayment=envelopper(ccPayment,'pay'); ccContract=envelopper(ccContract,'ctr'); ccMut=envelopper(ccMut,'mut'); ccEntry=envelopper(ccEntry,'entry');
})();

/* ═══ Archives ▸ Maquettes ▸ Fenêtres des écritures · Avant / après (11.11.2026, Paulo : « variante B, ajoute la version A dans archives pour plus tard ») ═══
   Proposition A des 5 maquettes du 11.11.2026 (subgestion3/_backup_20261111_maquette_ecritures2/) : en haut, l'effet de l'écriture sur le CFC (avant, l'écriture,
   après), la saisie à gauche, le calcul des conditions à droite ; mutation : cadres Origine / Destination avec avant / mutation / après. Maquette seulement :
   données d'exemple de 99TST, aucune action, rien n'est lu ni écrit. Dessinée dans une racine fantôme (shadow DOM) : ses classes ne touchent pas l'app. */
(function(){ if(typeof VIEWS==='undefined'||typeof nxPage!=='function'||typeof sgIntro!=='function') return;
VIEWS['mq-ecritures-a']={ render(m){
const E=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const IC={plus:'<path d="M12 5v14M5 12h14"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>',prev:'<path d="M15 6 9 12l6 6"/>',chev:'<path d="m9 6 6 6-6 6"/>',down:'<path d="m6 9 6 6 6-6"/>',
  arr:'<path d="M3 12h17M14 6l6 6-6 6"/>',srch:'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  clip:'<path d="M20 11.5 12.2 19.3a5 5 0 0 1-7-7l8-8a3.3 3.3 0 0 1 4.7 4.7l-8 8a1.7 1.7 0 0 1-2.4-2.4L15 7.1"/>',
  bank:'<path d="M3 9.5 12 4l9 5.5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',pdf:'<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/>',
  print:'<path d="M7 9V3h10v6M7 17H4V9h16v8h-3M7 14h10v7H7z"/>',pct:'<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  rond:'<path d="M4 10c2.5-2.5 5-2.5 8 0s5.5 2.5 8 0M4 15c2.5-2.5 5-2.5 8 0s5.5 2.5 8 0"/>',copy:'<path d="M8 8h12v12H8z"/><path d="M16 8V4H4v12h4"/>',
  pers:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',chk:'<path d="m5 12 4.5 4.5L19 7"/>'};
const svg=n=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="square" aria-hidden="true">'+(IC[n]||'')+'</svg>';
const IN=(v,c)=>`<span class="in ${c||''}">${E(v)}</span>`, SEL=(v,c)=>IN(v,'sel '+(c||'')), DT=(v,c)=>IN(v,'dt '+(c||'')), NUM=(v,c)=>IN(v,'num '+(c||''));
const F=(l,ctl,c)=>`<div class="f ${c||''}"><span class="l">${E(l)}</span>${ctl}</div>`;
const NX=v=>`<span class="ig">${IN(v)}<span class="nx" title="Prochain numéro libre">${svg('prev')}</span></span>`;
const CK=(on,l,s)=>`<span class="ck"><i class="${on?'on':''}"></i><span>${E(l)}${s?`<em>${E(s)}</em>`:''}</span></span>`;
const BT=(t,c)=>`<span class="bt ${c||''}">${E(t)}</span>`, LK=(t,ic)=>`<span class="lk">${ic?svg(ic):''}${E(t)}</span>`;
const SEG=(a,on,c)=>`<span class="seg ${c||''}">${a.map((x,i)=>`<span class="${i===on?'on':''}">${E(x)}</span>`).join('')}</span>`;
const SL=p=>`<span class="slw"><span class="sl"><i style="width:${p}%"></i><b style="left:${p}%"></b></span><span class="slv">${p} %</span></span>`;
const FT=(g,ok)=>`<div class="ft">${g||''}<span class="sp"></span>${BT('Annuler')}${BT(ok||'OK','pri')}</div>`;
const H4=(t,a)=>`<div class="h4"><span>${E(t)}</span>${a?`<span class="ha">${a}</span>`:''}</div>`;
const K=(l,v,s,c)=>`<div class="k ${c||''}"><span>${E(l)}</span><b>${E(v)}</b>${s?`<em>${E(s)}</em>`:''}</div>`;
const HD=(big,lb,h,meta,tl,tv,ts)=>`<div class="hd"><div class="big">${E(big)}</div><i class="fil"></i><div class="id"><div class="lb">${E(lb)}</div><h3>${E(h)}</h3><div class="meta">${E(meta)}</div></div>`
  +(tl?`<div class="tot"><span>${E(tl)}</span><b>${E(tv)}</b>${ts?`<em>${E(ts)}</em>`:''}</div>`:'')+'</div>';
const ANN=(n,t)=>LK(`Annexes : ${n}`+(t?` (${t})`:''),'clip');
const BANK=LK('UBS SA · CH93 0076 2011 6238 5295 7','bank');
/* données (99TST, fictives) */
const PC=[['Rabais','Rabais','−2 %','−644.00',"31'556.00"],['Escompte','Escompte','−2 %','−631.12',"30'924.88"],['Retenue de garantie','Garantie','−10 %',"−3'092.49","27'832.39"],
  ['Paiements à ce jour','Situation','','0.00',"27'832.39"],['TVA','TVA','8.1 %',"2'254.42","30'086.82"]];
const CC=[['Rabais','Rabais','−2 %','−700.00',"34'300.00"],['Escompte','Escompte','−2 %','−686.00',"33'614.00"],['TVA','TVA','8.1 %',"2'722.75","36'336.75"]];
const NAV=[['102','Études géotechniques',"12'972.00",'',"12'755.80",''],['112','Démolitions',"41'078.00","36'336.75",'0.00',''],
  ['201.1','Fouilles en pleine masse',"155'664.00","139'753.42","137'786.74","25'944.00"],['211.5','Béton et béton armé',"631'520.20","575'338.60","573'243.36",''],
  ['214','Charpente',"98'400.00",'','',''],['221.1','Fenêtres bois-métal',"212'580.00","204'115.30",'',''],['226.2','Isolation extérieure crépie',"185'340.00","176'890.00",'',''],
  ['228.2','Stores à lamelles',"64'860.00",'','','']];
const MO=[['HT',"171'452.36","−2'800.00","168'652.36"],['TVA 8.1 %',"13'887.64","−226.80","13'660.84"],['TTC',"185'340.00","−3'026.80","182'313.20"]];
const MD=[['HT',"60'000.00","+2'800.00","62'800.00"],['TVA 8.1 %',"4'860.00","+226.80","5'086.80"],['TTC',"64'860.00","+3'026.80","67'886.80"]];
const ST_P=['réceptionné','libéré','transmis','débité'], ST_M=['Brouillon','Provisoire','Demande transmise','Acceptée','Rejetée'], ST_C=['Brouillon','En traitement','Pour signature','Définitif'];
const hdP=()=>HD('19','Paiement n° 19 · Situation sur contrat · débité','Démolition Exemple SA','Lot 112 Démolitions · contrat n° 5 du 10.02.2025 · facture 276788 du 31.03.2025','À payer TTC',"30'086.82","dont TVA 2'254.42");
const hdC=()=>HD('5','Contrat n° 5 · Définitif','Démolition Exemple SA','Lot 112 Démolitions · du 10.02.2025 · désignation « Contrat »','Contrat TTC',"36'336.75","brut HT 35'000.00 · TVA 2'722.75");
const hdM=()=>HD('14','Mutation n° 14 · Transfert · Acceptée','226.2 → 228.2','Isolation extérieure crépie → Stores à lamelles · 10.11.2026','Montant TTC',"3'026.80","HT 2'800.00 · TVA 8.1 %");
const mtab=rows=>`<table class="tb mt"><thead><tr><th></th><th class="r">Avant</th><th class="r">Mutation</th><th class="r">Après</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r[0]}</td><td class="r">${r[1]}</td><td class="r n">${r[2]}</td><td class="r b">${r[3]}</td></tr>`).join('')}</tbody></table>`;
const calc=(base,bv,rows,rl,rv)=>`<div class="cl"><div class="cr hh"><span></span><span>Taux</span><span class="r">Montant</span><span class="r">Sous-total</span></div><div class="cr base"><span>${E(base)}</span><span></span><span class="r">${bv}</span><span class="r st">${bv}</span></div>`
  +rows.map(c=>`<div class="cr"><span>${E(c[0])}</span><span>${c[2]?IN(c[2],'tx'):''}</span><span class="r">${c[3]}</span><span class="r st">${c[4]}</span></div>`).join('')
  +`<div class="cr res"><span>${E(rl)}</span><span></span><span class="r">${rv}</span><span></span></div></div>`;
const condLk=x=>`<div class="lks">${LK('Condition','plus')}${LK(x||'Conditions du contrat','copy')}${LK('Arrondi','rond')}${LK('Calculer le rabais','pct')}</div>`;
const SUP=BT('Supprimer','dan');

/* ───────────── A · Avant / après ───────────── */
const A_mut=`<div class="w">${hdM()}
  <div class="rw pad">${F('Genre de mutation',SEL('Transfert'),'w2')}${F('Statut',SEL('Acceptée'),'w2')}${F('N° de mutation',NX('14'),'w1')}${F('Date',DT('10.11.2026'),'w1')}
    ${F('Montant de la mutation',`<span class="ig">${NUM("2'800.00",'foc big')}</span>`,'w2')}<div class="f w2"><span class="l">&nbsp;</span>${SEG(['HT','TTC'],0)}</div></div>
  <div class="mc"><div class="card"><div class="ct"><b>Origine</b><em class="cneg">− 3'026.80</em></div><div class="r2">${F('CFC',SEL('226.2 Isolation extérieure crépie'))}${F('Entreprise',SEL('Façades Témoin SA'))}</div>${mtab(MO)}</div>
    <div class="arr">${svg('arr')}</div>
    <div class="card"><div class="ct"><b>Destination</b><em class="cpos">+ 3'026.80</em></div><div class="r2">${F('CFC',SEL('228.2 Stores à lamelles'))}${F('Entreprise',SEL('Stores Exemple SA'))}</div>${mtab(MD)}</div></div>
  <div class="efx pad">Devis général révisé : <b>inchangé</b> (un transfert déplace le montant d'un CFC à l'autre)</div>
  <div class="r2 pad">${F('Remarque (affichée dans le contrôle du coût)',IN("Report d'une économie de la façade sur les stores"))}${F('Commentaire',IN('Décision de la séance de chantier n° 12','ta1'))}</div>
  ${FT(SUP+LK('Feuille de mutation','pdf'))}</div>`;
const A_pay=`<div class="w">${hdP()}
  <div class="ef"><div class="eft">Effet sur le lot 112 Démolitions</div><div class="efk c5">${K('Contrat + avenants',"36'336.75")}${K('Payé avant',"0.00",'0 % du contrat')}${K('Ce paiement',"+ 30'086.82",'','n')}${K('Payé après',"30'086.82",'82.8 % du contrat')}${K('Reste à payer',"6'249.93","dont garantie retenue 3'092.49 HT")}</div>
    <div class="efb"><i class="b2" style="width:82.8%"></i><i class="b3" style="width:17.2%"></i></div><div class="efl"><span><i class="b1"></i>Payé avant</span><span><i class="b2"></i>Ce paiement</span><span><i class="b3"></i>Reste à payer</span></div></div>
  <div class="g2"><div class="col">${H4('Facture de l’entreprise')}<div class="r3">${F('N° de facture',IN('276788'))}${F('Date de facture',DT('31.03.2025'))}<div class="f"><span class="l">Saisie</span>${SEG(['du brut','du net'],0)}</div></div>
      <div class="r1">${F('Cumul des travaux, brut HT',NUM("32'200.00",'foc big'))}</div>
      ${H4('Paiement')}<div class="r4">${F('N° de paiement',NX('19'))}${F('Date de paiement',DT('25.04.2025'))}${F('Genre',SEL('Situation'))}${F('Statut',SEL('débité'))}</div>
      <div class="rw2">${F('Niveau des prestations',SL(85))}${CK(false,'Dernier paiement','libère la retenue de garantie')}</div>
      ${H4('Description')}${IN('Situation n° 1, travaux à fin 03.2025.','ta')}<div class="lks">${BANK}${ANN(1,'facture 276788.pdf')}</div></div>
    <div class="col">${H4('Calcul du paiement')}${calc('Cumul brut HT',"32'200.00",PC,'À payer TTC',"30'086.82")}${condLk('Conditions du dernier paiement')}</div></div>
  ${FT(SUP+LK('Bon de paiement','pdf'))}</div>`;
const A_ctr=`<div class="w">${hdC()}
  <div class="ef"><div class="eft">Effet sur le lot 112 Démolitions</div><div class="efk c4">${K('Devis général révisé',"41'078.00")}${K('Ce contrat',"36'336.75",'','n')}${K('Écart',"− 4'741.25",'économie de 11.5 %','v')}${K('Coût probable',"36'336.75",'repris du contrat (prioritaire)')}</div>
    <div class="efc"><div><span>Devis révisé</span><i style="width:100%"></i></div><div><span>Contrat</span><i class="n" style="width:88.5%"></i></div></div></div>
  <div class="g2"><div class="col">${H4('Positions du contrat',LK('Ajouter une position','plus'))}
      <table class="tb"><thead><tr><th>CFC</th><th>Texte</th><th class="r">Devis révisé</th><th class="r" style="width:130px">Brut HT</th><th class="r">Net TTC</th></tr></thead><tbody>
      <tr><td>112</td><td>Démolitions</td><td class="r">41'078.00</td><td>${NUM("35'000.00",'foc')}</td><td class="r">36'336.75</td></tr><tr class="tot"><td colspan="3">Total</td><td class="r">35'000.00</td><td class="r">36'336.75</td></tr></tbody></table>
      ${H4('Contrat')}<div class="r4">${F('Désignation',IN('Contrat'))}${F('Numéro',NX('5'))}${F('Date',DT('10.02.2025'))}${F('Statut',SEL('Définitif'))}</div>
      <div class="r2">${F('Délai de garantie',IN('2 ans dès la réception'))}${F('Niveau des prestations',SL(100))}</div>
      <div class="rw2">${CK(true,'Contrat prioritaire sur le devis pour le coût probable','le coût probable reprend le contrat même s’il est inférieur au devis')}</div>
      ${H4('Description')}${IN('Déconstruction du hangar et des dépendances, tri et évacuation des matériaux, protections.','ta')}<div class="lks">${ANN(2,'offre du 28.01.2025, conditions')}</div></div>
    <div class="col">${H4('Calcul du contrat')}${calc('Brut HT',"35'000.00",CC,'Contrat TTC',"36'336.75")}${condLk('Conditions du dernier contrat')}</div></div>
  ${FT(SUP+LK('Avenant','plus')+LK('Contrat','pdf'))}</div>`;

const css=`.mq{background:#e7e7e4;padding:16px 18px 26px;font-family:var(--s-font);color:var(--s-noir);font-size:13px;line-height:1.35}
.mq *{box-sizing:border-box}.mq svg{width:16px;height:16px;flex:0 0 auto}
.mq .tt{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:4px;flex-wrap:wrap;background:#fff;border-bottom:2px solid var(--s-noir);padding:10px 24px}
.mq .tt h1{font-size:15px;margin:0 14px 0 0}.mq .tt a{cursor:pointer;padding:4px 7px;color:var(--s-nuit)}.mq .tt a:hover{text-decoration:underline}
.mq .tt .sep{width:1px;height:20px;background:var(--s-gris3);margin:0 10px}.mq .tt .flt span{cursor:pointer;padding:4px 7px;color:var(--s-gris)}
.mq .tt .flt span.on{color:var(--s-noir);font-weight:700;box-shadow:inset 0 -2px var(--s-nuit)}.mq .tt .sp{flex:1}
.mq .tt button{font:inherit;padding:6px 14px;border:1.5px solid var(--s-noir);background:#fff;cursor:pointer}
.mq .var{max-width:1180px;margin:30px auto 60px;padding:0 24px}
.mq .vh{display:flex;align-items:baseline;gap:14px;border-top:2px solid var(--s-noir);padding-top:12px}.mq .vh b{font-size:40px;color:var(--s-nuit);line-height:1}.mq .vh h2{font-size:22px;margin:0}
.mq .vd{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin:10px 0 6px;font-size:12.5px}.mq .vd b{display:block;font-size:11px;color:var(--s-gris);font-weight:400;margin-bottom:3px}
.mq .cap{font-size:12px;color:var(--s-gris);margin:22px 0 6px}
.mq[data-show="mut"] .blk:not(.k-mut),.mq[data-show="pay"] .blk:not(.k-pay),.mq[data-show="ctr"] .blk:not(.k-ctr){display:none}
.mq .w{background:#fff;box-shadow:0 10px 34px rgba(0,0,0,.18);border:1px solid var(--s-gris3)}
.mq .hd{display:flex;align-items:center;gap:16px;background:var(--s-jaune2);border-top:2px solid var(--s-noir);padding:12px 20px}
.mq .hd .big{font-size:32px;font-weight:700;color:var(--s-nuit);line-height:1;font-variant-numeric:tabular-nums}.mq .hd .fil{width:2px;align-self:stretch;background:var(--s-noir)}
.mq .hd .id{min-width:0}.mq .hd .lb{font-size:11px;color:var(--s-gris)}.mq .hd h3{font-size:18px;margin:1px 0}.mq .hd .meta{font-size:12px;color:var(--s-gris)}
.mq .hd .tot{margin-left:auto;text-align:right;white-space:nowrap}.mq .hd .tot span{display:block;font-size:11px;color:var(--s-gris)}.mq .hd .tot b{display:block;font-size:26px;font-variant-numeric:tabular-nums}.mq .hd .tot em{font-style:normal;font-size:11px;color:var(--s-gris)}
.mq .f{display:flex;flex-direction:column;gap:4px;min-width:0}.mq .f .l{font-size:11.5px;color:var(--s-gris);white-space:nowrap}
.mq .in{position:relative;display:flex;align-items:center;height:30px;padding:0 9px;border:1px solid var(--s-gris3);background:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.mq .in.num{justify-content:flex-end;font-variant-numeric:tabular-nums}.mq .in.sel{padding-right:26px}
.mq .in.sel::after{content:'';position:absolute;right:10px;top:13px;border:4px solid transparent;border-top:5px solid var(--s-gris);border-bottom:0}
.mq .in.ro{background:var(--s-fond);color:var(--s-gris)}.mq .in.foc{border:2px solid var(--s-nuit);padding:0 8px}.mq .in.big{height:40px;font-size:18px;font-weight:700}
.mq .in.ta{height:auto;min-height:52px;align-items:flex-start;padding:7px 9px;white-space:normal}.mq .in.ta1{white-space:normal}
.mq .in.tx{height:24px;width:64px;justify-content:flex-end;font-size:12px;color:var(--s-nuit)}.mq .in.w60{width:64px;flex:0 0 64px}
.mq .ig{display:flex;min-width:0}.mq .ig>.in{flex:1}.mq .ig>.in+.in{border-left:0}
.mq .nx{width:30px;height:30px;flex:0 0 30px;border:1px solid var(--s-gris3);border-left:0;display:flex;align-items:center;justify-content:center;color:var(--s-nuit)}
.mq .ck{display:inline-flex;align-items:flex-start;gap:8px}.mq .ck i{width:15px;height:15px;flex:0 0 15px;border:1.5px solid var(--s-noir);margin-top:1px}
.mq .ck i.on{background:var(--s-nuit);border-color:var(--s-nuit)}.mq .ck i.on::after{content:'';display:block;width:4px;height:8px;border:solid #fff;border-width:0 2px 2px 0;transform:translate(4px,1px) rotate(45deg)}
.mq .ck em{display:block;font-style:normal;font-size:11.5px;color:var(--s-gris)}
.mq .seg{display:inline-flex;border:1px solid var(--s-gris3);flex:0 0 auto}.mq .seg span{padding:5px 10px;font-size:12px;color:var(--s-gris);white-space:nowrap}.mq .seg span+span{border-left:1px solid var(--s-gris3)}
.mq .seg .on{background:var(--s-nuit);color:#fff}.mq .seg.big span{padding:7px 16px;font-size:13.5px}
.mq .slw{display:flex;align-items:center;gap:12px;height:30px;max-width:220px;min-width:170px}.mq .sl{position:relative;display:block;flex:1;min-width:60px;height:4px;background:var(--s-gris3)}.mq .sl i{position:absolute;left:0;top:0;bottom:0;background:var(--s-nuit)}
.mq .sl b{position:absolute;top:-6px;width:12px;height:16px;margin-left:-6px;background:#fff;border:2px solid var(--s-nuit)}.mq .slv{font-variant-numeric:tabular-nums;white-space:nowrap}
.mq .bt{display:inline-flex;align-items:center;height:32px;padding:0 16px;border:1.5px solid var(--s-noir);white-space:nowrap}.mq .bt.pri{background:var(--s-nuit);border-color:var(--s-nuit);color:#fff}
.mq .bt.dan{border-color:transparent;color:var(--s-rouge);padding:0 8px}
.mq .lk{display:inline-flex;align-items:center;gap:6px;color:var(--s-nuit);font-size:12.5px;padding:4px 8px;white-space:nowrap}
.mq .lks{display:flex;flex-wrap:wrap;margin:8px 0 0 -8px}.mq .lks.v{flex-direction:column;align-items:flex-start}
.mq .ft{display:flex;align-items:center;gap:8px;padding:12px 20px;border-top:1px solid var(--s-filet);background:#fafaf8}.mq .ft .sp,.mq .rw2 .sp,.mq .dres .sp{flex:1}
.mq .h4{display:flex;align-items:center;gap:10px;font-size:12.5px;font-weight:700;margin:14px 0 8px;padding-top:9px;border-top:1px solid var(--s-filet)}.mq .h4 .ha{margin-left:auto;display:flex;align-items:center;gap:10px;font-weight:400}
.mq .col>.h4:first-child{border-top:0;margin-top:6px}
.mq .r1,.mq .r2,.mq .r3,.mq .r4,.mq .g4{display:grid;gap:10px 12px;margin-bottom:10px}.mq .r2{grid-template-columns:repeat(2,minmax(0,1fr))}.mq .r3{grid-template-columns:1fr 1fr auto}
.mq .r4,.mq .g4{grid-template-columns:repeat(4,minmax(0,1fr))}.mq .s3{grid-column:span 3}
.mq .rw{display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap}.mq .rw .w1{width:110px}.mq .rw .w2{width:170px}
.mq .rw2{display:flex;gap:24px;align-items:center;margin:4px 0 10px}.mq .pad{padding:14px 20px 0}.mq .mt12{margin-top:12px}
.mq .tb{width:100%;border-collapse:collapse;font-size:12.5px}.mq .tb th{font-weight:400;color:var(--s-gris);font-size:11.5px;text-align:left;padding:5px 8px;border-bottom:2px solid var(--s-noir);white-space:nowrap}
.mq .tb td{padding:3px 8px;border-bottom:1px solid var(--s-filet);height:32px}.mq .tb .r{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.mq .tb tr.tot td{font-weight:700;border-top:1px solid var(--s-noir);border-bottom:0}.mq .tb .in{height:26px}.mq .tb .st{color:var(--s-gris)}
/* A */
.mq .ef{margin:0 20px;padding:12px 0 12px;border-bottom:1px solid var(--s-filet)}.mq .eft{font-size:11.5px;color:var(--s-gris);margin-bottom:6px}
.mq .efk{display:grid;gap:12px}.mq .efk.c5{grid-template-columns:repeat(5,minmax(0,1fr))}.mq .efk.c4{grid-template-columns:repeat(4,minmax(0,1fr))}
.mq .k span{display:block;font-size:11.5px;color:var(--s-gris)}.mq .k b{display:block;font-size:20px;margin-top:2px;font-variant-numeric:tabular-nums;white-space:nowrap}.mq .k em{font-style:normal;font-size:11.5px;color:var(--s-gris)}
.mq .k.n b{color:var(--s-nuit)}.mq .k.v b,.mq .vt{color:#4e6b0f}
.mq .efb{display:flex;height:10px;margin-top:10px;background:var(--s-filet)}.mq .efb i{display:block;height:100%}
.mq .b1,.mq .efl .b1{background:var(--s-nuit2)}.mq .b2,.mq .efl .b2{background:var(--s-nuit)}.mq .b3,.mq .efl .b3{background:repeating-linear-gradient(45deg,var(--s-gris3) 0 3px,#fff 3px 6px)}
.mq .efl{display:flex;gap:18px;margin-top:6px;font-size:11.5px;color:var(--s-gris)}.mq .efl i{display:inline-block;width:10px;height:10px;margin-right:6px;vertical-align:-1px;border:1px solid var(--s-gris3)}
.mq .efc{margin-top:10px;display:grid;gap:4px}.mq .efc div{display:grid;grid-template-columns:100px 1fr;align-items:center;font-size:11.5px;color:var(--s-gris)}.mq .efc i{height:9px;background:var(--s-gris3)}.mq .efc i.n{background:var(--s-nuit)}
.mq .g2{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr)}.mq .g2>.col{padding:4px 20px 16px}.mq .g2>.col+.col{border-left:1px solid var(--s-filet);background:#fbfbf9}
.mq .cl .cr{display:grid;grid-template-columns:minmax(0,1fr) 74px 96px 96px;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--s-filet)}
.mq .cl .cr.hh{font-size:11px;color:var(--s-gris);padding:0 0 4px;border-bottom:2px solid var(--s-noir)}.mq .cl .r{text-align:right;font-variant-numeric:tabular-nums}.mq .cl .st{color:var(--s-gris)}
.mq .cl .base{font-weight:700}.mq .cl .res{font-weight:700;font-size:16px;border-top:2px solid var(--s-noir);border-bottom:0;padding-top:9px}
.mq .mc{display:grid;grid-template-columns:minmax(0,1fr) 40px minmax(0,1fr);margin:14px 20px 0}.mq .card{border:1px solid var(--s-gris3);padding:12px 14px}
.mq .card .ct{display:flex;justify-content:space-between;margin-bottom:10px}.mq .card .ct em{font-style:normal;font-weight:700;font-variant-numeric:tabular-nums}
.mq .cneg{color:var(--s-rouge)}.mq .cpos{color:var(--s-nuit)}.mq .arr{display:flex;align-items:center;justify-content:center;color:var(--s-nuit)}.mq .arr svg{width:24px;height:24px}
.mq .mt td{height:28px}.mq .mt .n{color:var(--s-nuit)}.mq .mt .b{font-weight:700}
.mq .efx{font-size:12.5px;color:var(--s-gris);padding-bottom:10px}.mq .efx b{color:var(--s-noir)}
`;
  nxPage(m,'<div class="sg-split">'+sgIntro('Archives · Maquettes','Fenêtres des écritures · Avant / après','Proposition A des maquettes du 11.11.2026 pour les fenêtres de mutation, de paiement et de contrat du contrôle des coûts, gardée pour plus tard. Maquette avec des données d’exemple : rien n’est lu ni enregistré. La proposition en place est la B, « Liste des positions ».')+'<div id="sgmqa-h"></div></div>');
  const host=m.querySelector('#sgmqa-h'); if(!host||!host.attachShadow) return; const sh=host.attachShadow({mode:'open'});
  sh.innerHTML='<style>'+css+'</style><div class="mq">'+[['Mutation · transfert n° 14',A_mut],['Paiement · situation n° 19 sur contrat',A_pay],['Contrat n° 5',A_ctr]].map(([t,w])=>'<div class="cap">'+E(t)+'</div>'+w).join('')+'</div>'; } };
})();

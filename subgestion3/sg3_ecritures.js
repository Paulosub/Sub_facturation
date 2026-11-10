/* ═══ CONTRÔLE DES COÛTS : FENÊTRES DES ÉCRITURES = PROPOSITION B « TABLEUR » (10.11.2026, bloc 51) ═══
   Paulo : « proposer un autre graphisme pour correspondre à la section devis, fais 5 propositions » (paiement, situation sur contrat, mutation), puis
   « version B » ; maquettes : subgestion3/_backup_20261110_maquette_ecritures/ (A étapes, B tableur, C décompte, D rubriques, E chiffres et onglets).
   Fenêtres du moteur (DeltaSub.html) enveloppées — mêmes champs, mêmes contrôles, même enregistrement : ccPayment (situation = paiement sur contrat, paiement
   hors contrat), ccContract (contrat, avenant), ccMut (transfert, variation, renchérissement), ccEntry (provision, coût probable perso). Les éléments du moteur
   sont déplacés tels quels (gestionnaires gardés) dans la mise en page de la fenêtre « Calcul pour <CFC> » du devis : bandeau jaune (numéro en grand, filet,
   genre · statut, entreprise, lot / contrat / facture, total en grand à droite), réglages dans une bande grise (libellés au-dessus des champs), une seule barre
   d'outils (Position, Condition, TVA, Arrondi, Paiements à ce jour, Effacer la ligne, Saisie du brut | du net) et la cellule active à droite (L<n> · colonne ·
   contenu), tableaux de tableur (lignes numérotées à la suite, cellule active encadrée de bleu nuit, cases calculées sur fond gris, total au pied ; conditions :
   colonne « Sous-total » = brut des positions + conditions jusqu'à ce niveau), pied (commentaire, description, annexes ; brut, conditions hors TVA, net HT,
   TVA, net TTC), aide au clavier. Mutation : origine (−) et destination (+) sur deux lignes, « Effet sur le devis général révisé » au pied.
   Le moteur redessine ses tableaux à chaque modification : Tab, Entrée, ↑ ↓ et le clic gardent la cellule visée ; Échap rétablit la saisie en cours (sinon,
   ferme la fenêtre comme avant). DeltaSub.html seul garde ses fenêtres. Styles <style id="sgew-css">, classes sgew-*. Débogage : window.SGEW. */
(function(){
if(typeof ccPayment!=='function'||typeof ccContract!=='function'||typeof ccMut!=='function'||typeof ccEntry!=='function'||typeof linesGrid!=='function'||typeof condTable!=='function'||typeof ccCond!=='function') return;
const E=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const el=(t,c,html)=>{ const e=document.createElement(t); if(c) e.className=c; if(html!=null) e.innerHTML=html; return e; };
const mt=v=>{ const s=num(+v||0); return s===''?'0.00':s; };
const dd=s=>typeof dfr==='function'?dfr(s):(s||'');
const txtSel=s=>s&&s.options&&s.selectedIndex>=0&&s.options[s.selectedIndex]?(s.options[s.selectedIndex].text||'').trim():'';
const IC={plus:'<path d="M12 5v14M5 12h14"/>',pct:'<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  rond:'<path d="M4 10c2.5-2.5 5-2.5 8 0s5.5 2.5 8 0M4 15c2.5-2.5 5-2.5 8 0s5.5 2.5 8 0"/>',rec:'<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v5h5"/>',
  del:'<path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/>',pers:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  aucun:'<circle cx="12" cy="12" r="8.5"/><path d="M6 18 18 6"/>',suiv:'<path d="M9 6l6 6-6 6"/>'};
const svg=n=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="square" aria-hidden="true">'+(IC[n]||'')+'</svg>';
const CSS=`
.ov:has(>.dlg.sgew-dlg){padding-top:3vh}
.dlg.sgew-dlg{width:min(1160px,96vw)!important;max-width:96vw!important;max-height:94vh}
.dlg.sgew-dlg.sgew-dm{width:min(1080px,96vw)!important}
.dlg.sgew-dlg.sgew-de{width:min(1000px,96vw)!important}
.dlg.sgew-dlg>.tt{display:none}
.dlg.sgew-dlg>.bd{padding:0!important;overflow:hidden!important;display:flex;flex-direction:column;flex:1 1 auto;min-height:0}
.sgew-cache{display:none!important}
.sgew-tete{flex:none;display:flex;align-items:center;gap:16px;background:var(--s-jaune2);padding:14px 24px}
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
.sgew-note{flex:none;background:var(--s-jaune3)!important;border:0!important;border-top:1px solid var(--s-filet)!important;border-radius:0!important;margin:0!important;padding:7px 24px!important;font-size:12px}
.sgew-regs{flex:none;background:var(--s-fond);border-top:1px solid var(--s-noir);border-bottom:1px solid var(--s-filet);padding:10px 24px 12px}
.sgew-rg{display:grid;gap:8px 14px;align-items:end}
.sgew-rg+.sgew-rg{margin-top:10px}
.sgew-r-p1{grid-template-columns:minmax(0,2.4fr) minmax(0,1.4fr) minmax(0,.62fr) minmax(0,1fr) minmax(0,1fr)}
.sgew-r-p2{grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,2.95fr)}
.sgew-r-c1{grid-template-columns:minmax(0,2.2fr) minmax(0,2fr) minmax(0,.62fr) minmax(0,1fr)}
.sgew-r-c2{grid-template-columns:minmax(0,2.2fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1.62fr)}
.sgew-r-m{grid-template-columns:minmax(0,1.3fr) minmax(0,1.3fr) minmax(0,.8fr) minmax(0,1fr)}
.sgew-r-e{grid-template-columns:minmax(0,1fr) minmax(0,3fr) minmax(0,1.4fr)}
.sgew-f{display:flex;flex-direction:column;gap:4px;min-width:0}
.sgew-f>.l{font-size:11px;font-weight:700;color:var(--s-gris);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:14px}
.sgew-f input.inp,.sgew-f select.inp,.sgew-f textarea.inp{height:32px;box-sizing:border-box;border:1px solid var(--s-gris3)!important;border-radius:0!important;width:100%!important;background:#fff;font-size:13px;margin:0}
.sgew-f textarea.inp{height:auto;min-height:54px;resize:vertical;padding:6px 9px;font-family:inherit;line-height:1.35}
.sgew-f input.inp:focus,.sgew-f select.inp:focus,.sgew-f textarea.inp:focus{outline:2px solid var(--s-nuit);outline-offset:-2px}
.sgew-f.ck{justify-content:flex-end}
.sgew-f.ck>label{min-height:32px;display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;cursor:pointer;line-height:1.2;text-align:left!important}
.sgew-ro{display:block!important;height:32px;box-sizing:border-box;padding:0 10px;line-height:30px;border:1px solid var(--s-filet);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:13px}
.sgew-lot{display:grid!important;grid-template-columns:90px minmax(0,1fr);gap:6px!important}
.sgew-nm{display:flex!important;align-items:center;gap:2px}
.sgew-nm .ib{flex:none;border:0!important;background:transparent!important;height:30px;min-width:28px;padding:0 6px;color:var(--s-nuit);font-weight:700}
.sgew-nm .ib:hover{background:var(--s-jaune3)!important}
.sgew-ent{display:flex!important;align-items:stretch!important;gap:0!important;height:32px;box-sizing:border-box;border:1px solid var(--s-gris3);background:#fff;min-width:0}
.sgew-ent>span{display:block;flex:1 1 auto!important;min-width:0;padding:0 10px;line-height:30px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:13px}
.sgew-ent .ib{flex:none;border:0!important;border-left:1px solid var(--s-filet)!important;border-radius:0!important;height:30px!important;min-width:32px;background:transparent!important;padding:0 9px!important;font-size:12px;color:var(--s-gris);gap:4px}
.sgew-ent .ib:hover{background:var(--s-jaune3)!important;color:var(--s-noir)}
.sgew-ent .ib svg{width:15px;height:15px;flex:0 0 15px}
.sgew-box .sgew-ent{height:33px;border:0;background:transparent}
.sgew-box .sgew-ent>span{line-height:33px;padding:0 9px}
.sgew-box .sgew-ent .ib{height:33px!important}
.sgew-box .sgew-ent .ib+.ib{display:none!important}
.sgew-box .sgew-ent .ib>span:not(.dd){display:none}
.sgew-bar{flex:none;display:flex;align-items:center;flex-wrap:nowrap;gap:0;padding:6px 24px;min-height:42px;border-bottom:1px solid var(--s-filet);background:#fff;container-type:inline-size}
.sgew-b{display:inline-flex;align-items:center;gap:5px;height:30px;padding:0 8px;border:0;background:transparent;font:inherit;font-size:12px;font-weight:700;color:var(--s-noir);cursor:pointer;white-space:nowrap;flex:none}
.sgew-bar>.sgew-b:first-child{padding-left:0}
.sgew-b:hover{background:var(--s-jaune3)}
.sgew-b:disabled{opacity:.35;cursor:default;background:transparent}
.sgew-b svg{width:16px;height:16px;flex:none}
.sgew-sep{width:1px;height:18px;background:var(--s-gris3);margin:0 8px;flex:none}
.sgew-seg{display:inline-flex;align-items:center;gap:12px;font-size:12px;color:var(--s-gris);flex:none}
.sgew-seg .l{font-weight:700}
.sgew-seg button{border:0;background:transparent;padding:4px 0;font:inherit;font-size:12px;color:var(--s-gris);cursor:pointer}
.sgew-seg button:hover{color:var(--s-noir)}
.sgew-seg button.on{color:var(--s-noir);font-weight:700;box-shadow:inset 0 -2px 0 var(--s-nuit)}
.sgew-ref{margin-left:auto;display:flex;align-items:stretch;flex:0 1 270px;min-width:0;height:28px;border:1px solid var(--s-gris3);font-size:12px;white-space:nowrap;overflow:hidden}
.sgew-ref:empty{display:none}
.sgew-ref b{display:flex;align-items:center;padding:0 9px;background:var(--s-nuit);color:#fff;font-weight:700}
.sgew-ref span{display:flex;align-items:center;flex:none;padding:0 10px;color:var(--s-gris);font-weight:700;border-right:1px solid var(--s-filet)}
.sgew-ref i{display:block;flex:1 1 auto;line-height:26px;min-width:0;padding:0 10px;font-style:normal;font-variant-numeric:tabular-nums;overflow:hidden;text-overflow:ellipsis}
@container (max-width:900px){.sgew-b span{display:none}.sgew-b{padding:0 7px}}
.sgew-corps{flex:1 1 auto;min-height:0;overflow:auto;padding:2px 24px 18px;counter-reset:sgewl;outline:none}
.sgew-cap{font-size:12px;font-weight:700;margin:14px 0 6px}
.sgew-box{max-height:none!important;overflow:visible!important;border:0!important;background:transparent!important}
.sgew-box table{table-layout:fixed!important;width:100%!important;min-width:860px;border-collapse:separate!important;border-spacing:0;font-variant-numeric:tabular-nums;margin:0}
.sgew-box thead th{position:sticky;top:0;z-index:2;background:var(--s-fond)!important;border:0!important;border-top:2px solid var(--s-noir)!important;border-right:1px solid var(--s-filet)!important;border-bottom:1px solid var(--s-noir)!important;font-size:11px;font-weight:700;color:var(--s-gris)!important;padding:0 9px!important;height:28px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left;text-transform:none!important;letter-spacing:0!important;font-family:inherit!important}
.sgew-box thead th:first-child{padding-left:43px!important;border-left:1px solid var(--s-filet)!important}
.sgew-box th.r{text-align:right}
.sgew-box th.c{text-align:center;padding:0 4px!important}
.sgew-box tbody tr{counter-increment:sgewl}
.sgew-box tbody td{border:0!important;border-right:1px solid var(--s-filet)!important;border-bottom:1px solid var(--s-filet)!important;padding:0!important;height:34px;overflow:hidden;font-size:13px;background:#fff;white-space:nowrap;text-overflow:ellipsis}
.sgew-box tbody td:first-child{position:relative;padding-left:34px!important;border-left:1px solid var(--s-filet)!important}
.sgew-box tbody td:first-child::before{content:counter(sgewl);position:absolute;left:0;top:0;bottom:0;width:34px;display:flex;align-items:center;justify-content:center;background:var(--s-fond);color:var(--s-gris);font-size:11.5px;font-weight:700;border-right:1px solid var(--s-filet)}
.sgew-box tbody tr:hover td{background:var(--s-jaune3)}
.sgew-box tbody tr.sgew-on td{background:var(--s-jaune2)}
.sgew-box tbody tr.sgew-on td:first-child::before{background:var(--s-nuit);color:#fff}
.sgew-box tbody td.sgew-k{background:var(--s-fond);padding:0 9px!important}
.sgew-box tbody td.sgew-k:first-child{padding-left:43px!important}
.sgew-box tbody tr:hover td.sgew-k{background:color-mix(in srgb,var(--s-jaune3),var(--s-noir) 4%)}
.sgew-box tbody tr.sgew-on td.sgew-k{background:color-mix(in srgb,var(--s-jaune2),var(--s-noir) 5%)}
.sgew-box td.r{text-align:right}
.sgew-box td.c{text-align:center}
.sgew-box input.inp,.sgew-box select.inp{width:100%!important;height:33px!important;box-sizing:border-box;border:0!important;border-radius:0!important;background:transparent!important;font-size:13px;padding:0 9px;color:inherit;margin:0;vertical-align:middle}
.sgew-box select.inp{padding-right:4px}
.sgew-box td.r input.inp,.sgew-box input[type=number]{text-align:right}
.sgew-box input[type=number]{-moz-appearance:textfield}
.sgew-box input[type=number]::-webkit-inner-spin-button,.sgew-box input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
.sgew-box input.inp:disabled{color:var(--s-noir);-webkit-text-fill-color:var(--s-noir);opacity:1;cursor:default}
.sgew-box input.inp:focus,.sgew-box select.inp:focus{outline:2px solid var(--s-nuit);outline-offset:-2px;background:#fff!important}
.sgew-box input[type=checkbox]{margin:0;vertical-align:middle;cursor:pointer}
.sgew-box input[type=checkbox]:focus-visible{outline:2px solid var(--s-nuit);outline-offset:3px}
.sgew-u{display:inline-block;width:20px;color:var(--s-gris);font-size:12px;vertical-align:middle}
.sgew-box td:has(>.sgew-u) input.inp{width:calc(100% - 20px)!important;display:inline-block}
.sgew-sens b{font-weight:700}
.sgew-sens i{font-style:normal;color:var(--s-gris);margin-left:4px}
.sgew-box tfoot td{border:0!important;border-top:2px solid var(--s-noir)!important;height:34px;padding:0 9px!important;font-weight:700;font-size:13px;background:#fff;white-space:nowrap}
.sgew-box tfoot td:first-child{padding-left:43px!important}
.sgew-vide{padding:10px 0 2px 43px;color:var(--s-gris);font-size:12.5px}
.sgew-pied{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:28px;margin-top:18px;align-items:start}
.sgew-pied.m{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px 16px}
.sgew-pg{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.6fr);gap:10px 16px;align-items:start}
.sgew-pg.c{grid-template-columns:minmax(0,1fr)}
.sgew-ann{display:flex!important;align-items:center;gap:8px;min-height:32px;font-size:13px}
.sgew-ann .ib{border:1px solid var(--s-gris3)!important;background:#fff!important;height:30px;border-radius:0!important}
.sgew-tots>div{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid var(--s-filet);font-size:13px;font-variant-numeric:tabular-nums;white-space:nowrap}
.sgew-tots>div>span{color:var(--s-gris)}
.sgew-tots>div.net{border-top:2px solid var(--s-noir);border-bottom:0;padding-top:8px;align-items:baseline}
.sgew-tots>div.net>span{color:var(--s-noir);font-weight:700}
.sgew-tots>div.net>b{font-size:20px;color:var(--s-nuit)}
.sgew-tots>div.stk{border:0;padding-top:0;font-size:11.5px}
.dlg.sgew-dlg .ft .sgew-aide{margin-right:auto;align-self:center;font-size:11.5px;color:var(--s-gris);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.sgew-aide b{color:var(--s-noir);font-weight:700}
`;
const cssE=()=>{ if(!document.getElementById('sgew-css')){ const s=document.createElement('style'); s.id='sgew-css'; s.textContent=CSS; document.head.appendChild(s); } };
/* champs des formulaires du moteur (formRows : libellé, champ) ; sec = titre (h3) qui précède le formulaire */
const champs=body=>{ const L=[]; body.querySelectorAll('.form').forEach(f=>{ const p=f.previousElementSibling, sec=p&&p.tagName==='H3'?p.textContent.trim():''; const k=[...f.children];
    for(let i=0;i+1<k.length;i+=2) L.push({l:k[i].textContent.trim(),c:k[i+1],sec}); });
  return (l,sec)=>{ const x=L.find(z=>z.l===l&&(sec==null||z.sec.startsWith(sec))); return x?x.c:null; }; };
const champ=(lb,c,cls)=>{ const f=el('div','sgew-f'+(cls?' '+cls:'')); f.append(el('div','l',E(lb||''))); if(c) f.append(c); return f; };
const rang=(cls,kids)=>{ const r=el('div','sgew-rg '+cls); kids.forEach(k=>{ if(k) r.append(k); }); return r; };
const outil=(ic,lb,t,fn)=>{ const b=el('button','sgew-b',svg(ic)+'<span>'+E(lb)+'</span>'); b.type='button'; b.title=t||lb; b.addEventListener('mousedown',e=>e.preventDefault()); b.addEventListener('click',fn); return b; };
const sep=()=>el('i','sgew-sep');
const tete=()=>el('div','sgew-tete','<div class="sgew-big"></div><i class="sgew-fil"></i><div class="sgew-id"><div class="lb"></div><h3></h3><div class="meta"></div></div><div class="sgew-tot"><span></span><b></b><em></em></div>');
const remplir=(T,o)=>{ const q=s=>T.querySelector(s); q('.sgew-big').textContent=o.big||'—'; q('.lb').textContent=o.lb||''; q('h3').textContent=o.h3||''; q('h3').title=o.h3t||o.h3||'';
  q('.meta').textContent=o.meta||''; q('.meta').title=o.meta||''; q('.sgew-tot span').textContent=o.tl||''; q('.sgew-tot b').textContent=o.tv||''; q('.sgew-tot em').textContent=o.ts||''; };
const nomEnt=p=>{ const s=p&&p.querySelector('span'); return s?s.textContent.trim():''; };
const aide=(dlg,html)=>{ const ft=dlg.querySelector('.ft'); if(ft&&!ft.querySelector('.sgew-aide')) ft.prepend(el('div','sgew-aide',html)); };
/* cellule active : n° de ligne (à la suite d'un tableau à l'autre), colonne, contenu */
const majRef=(ref,corps,c)=>{ const td=c&&c.isConnected&&c.closest&&c.closest('tbody td'); if(!ref||!td||!corps.contains(td)) return; const tr=td.parentNode, t=tr.closest('table'), hr=t&&t.tHead&&t.tHead.rows[0], th=hr&&hr.cells[td.cellIndex];
  const n=[...corps.querySelectorAll('.sgew-box tbody tr')].indexOf(tr)+1, pk=c.closest('.sgew-ent');
  const v=pk?nomEnt(pk):c.tagName==='SELECT'?txtSel(c):c.type==='checkbox'?(c.checked?'oui':'non'):(c.value!=null?c.value:'');
  ref.innerHTML='<b>L'+n+'</b><span>'+E(th?th.textContent.trim():'')+'</span><i>'+E(v)+'</i>'; ref.title='Cellule active'; };
/* Échap : la saisie en cours est rétablie (valeur à l'entrée dans le champ) ; sans saisie en cours, la fenêtre se ferme comme avant */
const echap=dlg=>{ const VAL=new WeakMap(), txt=c=>c&&c.matches&&c.matches('input:not([type=checkbox]):not([type=radio]),textarea');
  dlg.addEventListener('focusin',e=>{ if(txt(e.target)) VAL.set(e.target,e.target.value); },true);
  dlg.addEventListener('keydown',e=>{ if(e.key!=='Escape') return; const c=e.target; if(!txt(c)||!VAL.has(c)||c.value===VAL.get(c)) return;
    c.value=VAL.get(c); c.dispatchEvent(new Event('input',{bubbles:true})); try{ c.select(); }catch(_){} e.preventDefault(); e.stopPropagation(); }); };

/* ══ Paiement (situation, hors contrat) et contrat / avenant : tableaux du moteur (linesGrid, condTable) ══ */
const TH={'NIV':['Niv.','Niveau : ordre du calcul des conditions'],'REF':['Réf.','Référence : niveau dont le résultat sert de base à la condition'],
  'Conditions':['Taux','Taux en % ou montant forfaitaire'],'M':['Appl.','Condition appliquée'],'Cumul acptes bruts':['Cumul des acomptes bruts','Montant brut cumulé des travaux exécutés à ce jour (situation)'],
  'Réf. cond.':['Réf. cond.','Référence de condition : la condition ne s’applique qu’aux positions qui ont la même référence'],'Genre':['Genre','Genre de la condition']};
const W_POS={'CFC':200,'Réf. cond.':76,'Adjudication brute':124,'Adjudication nette':124,'Cumul des acomptes bruts':156,'Brut':140,'Net':140};
const W_CND={'Niv.':56,'Réf.':52,'Genre':200,'Réf. cond.':76,'Taux':104,'Montant':112,'Sous-total':112,'Appl.':52};
const TH_R=new Set(['Adjudication brute','Adjudication nette','Cumul des acomptes bruts','Brut','Net','Taux','Montant','Sous-total']);
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
  const T=tete(), regs=el('div','sgew-regs'), bar=el('div','sgew-bar'), corps=el('div','sgew-corps'), cache=el('div','sgew-cache');
  ent.classList.add('sgew-ent'); if(note) note.classList.add('sgew-note');
  if(pay){ lot.classList.add('sgew-ro'); lot.title=lot.textContent.trim();
    regs.append(rang('sgew-r-p1',[champ('Entreprise',ent),champ('Lot d’adjudication',lot),champ('N° paiement',f.num),champ('Genre de paiement',f.code),champ('Statut',st)]),
      rang('sgew-r-p2',[champ('N° de facture',f.nf),champ('Date de facture',f.df),champ('Date de paiement',f.dp),f.der?champ('',f.der,'ck'):null])); }
  else { lot.classList.add('sgew-lot');
    regs.append(rang('sgew-r-c1',[champ('Entreprise',ent),champ('Lot d’adjudication',lot),champ('Numéro',f.num),champ('Statut',st)]),
      rang('sgew-r-c2',[champ('Désignation',f.des),champ('Date',f.dt),f.gar?champ('Délai de garantie',f.gar):el('div'),prio?champ('',prio,'ck'):el('div')])); }
  const ref=el('div','sgew-ref');
  if(bPos) bar.append(outil('plus','Position','Ajouter une position',()=>act(()=>bPos.click(),{bi:0,r:'last',k:0})));
  if(bCnd) bar.append(outil('plus','Condition','Ajouter une condition (rabais, escompte, retenue…)',()=>act(()=>bCnd.click(),{bi:1,r:'last',k:0})));
  if(bTva) bar.append(outil('pct','TVA','Ajouter la TVA',()=>act(()=>bTva.click(),{bi:1,r:'last',k:0})));
  if(bArr) bar.append(outil('rond','Arrondi','Ajouter un arrondi',()=>act(()=>bArr.click(),{bi:1,r:'last',k:0})));
  if(bSI) bar.append(outil('rec','Paiements à ce jour','Recalculer « Paiements à ce jour » : somme des paiements antérieurs du contrat et de ses avenants (sans la TVA)',()=>act(()=>bSI.click())));
  const bDel=outil('del','Effacer la ligne','Effacer la ligne où se trouve le curseur',()=>effacer()); bar.append(sep(),bDel);
  const seg=saisie?el('div','sgew-seg','<span class="l">Saisie</span>'):null;
  if(seg){ [['brut','du brut'],['net','du net']].forEach(([v,l])=>{ const b=el('button','',E(l)); b.type='button'; b.dataset.v=v; b.title='Saisie '+l+' des positions';
      b.addEventListener('mousedown',e=>e.preventDefault()); b.onclick=()=>{ if(saisie.value===v) return; act(()=>{ saisie.value=v; saisie.dispatchEvent(new Event('change')); }); majSeg(); }; seg.append(b); });
    bar.append(sep(),seg); }
  bar.append(ref);
  const tots=el('div','sgew-tots'), pied=el('div','sgew-pied'), pg=el('div','sgew-pg'+(pay?'':' c'));
  if(pay) pg.append(champ('Commentaire',f.com),champ('Description',dsc));
  else { pg.append(champ('Description',dsc)); if(f.ann){ f.ann.classList.add('sgew-ann'); pg.append(champ('Annexes',f.ann)); } }
  pied.append(pg,tots);
  corps.tabIndex=-1;
  corps.append(el('div','sgew-cap',E(capT(hPos.querySelector(':scope>b'))||'Positions')),lg.o.box,el('div','sgew-cap',E(capT(hCnd.querySelector(':scope>b'))||'Conditions')),ct.o.box,pied);
  cache.append(hPos,hCnd,ct.o.bar,...kids.filter(k=>k.isConnected&&k.parentNode===body));
  bd.replaceChildren(T,...(note?[note]:[]),regs,bar,corps,cache);
  aide(dlg,'<b>Tab</b> cellule suivante · <b>Entrée</b> ligne suivante · <b>↑ ↓</b> lignes · <b>Échap</b> annule la saisie');
  /* ─ tableaux : habillage après chaque dessin du moteur ─ */
  const BTN=new WeakMap();
  const deco=t=>{ if(!t||t._sgew) return; t._sgew=1; const cnd=t.parentNode===ct.o.box;
    [...t.querySelectorAll('tr')].forEach(tr=>{ const last=tr.lastElementChild; if(!last) return; const b=last.querySelector('.ib'); if(b) BTN.set(tr,b); last.remove(); });   /* bouton « − » de la ligne : gardé pour « Effacer la ligne » */
    const hr=t.tHead&&t.tHead.rows[0], tb=t.tBodies[0]; if(!hr||!tb) return;
    [...hr.cells].forEach(th=>{ const m=TH[th.textContent.trim()]; if(m){ th.textContent=m[0]; th.title=m[1]; } });
    const tot=[...tb.rows].find(tr=>tr.style.fontWeight); if(tot){ tot.style.fontWeight=''; t.createTFoot().append(tot); }
    if(cnd){ const r=ccCond(doc.lignes||[],doc.conditions||[]), lv=[...new Set((doc.conditions||[]).map(c=>c.niveau))].sort((a,b)=>a-b), sub=n=>r.T.brut+lv.filter(x=>x<=n).reduce((a,x)=>a+(r.par[x]||0),0);
      const th=document.createElement('th'); th.textContent='Sous-total'; th.title='Montant après ce niveau : brut des positions et conditions jusqu’à ce niveau'; hr.insertBefore(th,hr.cells[7]||null);
      [...tb.rows].forEach((tr,i)=>{ const c=(doc.conditions||[])[i], td=el('td','r'); td.textContent=c?num(sub(c.niveau)):''; tr.insertBefore(td,tr.cells[7]||null);
        const g=tr.cells[3]; if(g) [...g.childNodes].forEach(nd=>{ if(nd.nodeType===3) nd.remove(); });   /* lettre de l'ancien logiciel (M, SI, S, G, %) : le genre la donne */
        const x=tr.cells[5]; if(x) [...x.childNodes].forEach(nd=>{ if(nd.nodeType===3&&nd.textContent.trim()) nd.replaceWith(el('span','sgew-u',E(nd.textContent.trim()))); else if(nd.nodeType===3) nd.remove(); }); }); }
    [...hr.cells].forEach(th=>{ const k=th.textContent.trim(); if(TH_R.has(k)) th.classList.add('r'); if(k==='Appl.') th.classList.add('c'); });
    [...tb.rows].forEach(tr=>[...tr.cells].forEach(td=>{ const c=td.querySelector('input,select'); if(!c||c.disabled) td.classList.add('sgew-k'); if(c&&c.type==='checkbox'){ td.classList.remove('sgew-k'); td.classList.add('c'); } }));
    const W=cnd?W_CND:W_POS, cg=document.createElement('colgroup'); [...hr.cells].forEach((th,i)=>{ const col=document.createElement('col'), w=W[th.textContent.trim()]; if(w) col.style.width=(w+(i===0?34:0))+'px'; cg.append(col); }); t.prepend(cg);
    if(!tb.rows.length) t.after(el('div','sgew-vide',cnd?'Aucune condition. « Condition » ou « TVA » pour en ajouter une.':'Aucune position. « Position » pour en ajouter une.')); };
  const decoTout=()=>boxes.forEach(b=>deco(b.querySelector('table')));
  const tbd=i=>{ const t=boxes[i]&&boxes[i].querySelector('table'); return t?t.tBodies[0]:null; };
  const ctl=(tr,k)=>{ const td=tr&&tr.cells[k]; return td?td.querySelector('input:not([disabled]),select:not([disabled])'):null; };
  const pos=c=>{ const td=c&&c.closest&&c.closest('tbody td'); if(!td) return null; const tr=td.parentNode, bi=boxes.findIndex(b=>b.contains(tr)); return bi<0?null:{bi,r:tr.sectionRowIndex,k:td.cellIndex}; };
  const suivant=(p,pas)=>{ let bi=p.bi, r=p.r, k=p.k;
    for(let g=0;g<4000;g++){ k+=pas; let b=tbd(bi), q=b&&b.rows[r];
      if(!q||k<0||k>=q.cells.length){ r+=pas; q=b&&b.rows[r];
        while(!q){ bi+=pas; if(bi<0||bi>=boxes.length) return null; b=tbd(bi); if(!b) continue; r=pas>0?0:b.rows.length-1; q=b.rows[r]; }
        k=pas>0?-1:q.cells.length; continue; }
      if(ctl(q,k)) return {bi,r,k}; }
    return null; };
  const vertical=(p,pas)=>{ const b=tbd(p.bi); let r=p.r+pas; while(b&&b.rows[r]){ if(ctl(b.rows[r],p.k)) return {bi:p.bi,r,k:p.k}; r+=pas; } return null; };
  let rep=null, ACT=null;
  const surligner=()=>{ corps.querySelectorAll('tr.sgew-on').forEach(tr=>tr.classList.remove('sgew-on')); if(!ACT) return; const b=tbd(ACT.bi), tr=b&&b.rows[ACT.r]; if(tr) tr.classList.add('sgew-on'); else ACT=null; };
  const majBar=()=>{ const b=ACT&&tbd(ACT.bi), tr=b&&b.rows[ACT.r]; bDel.disabled=!(tr&&BTN.get(tr)); };
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
    if(rep){ const R=rep; rep=null; const b=tbd(R.bi); if(b&&b.rows.length){ const r=R.r==='last'?b.rows.length-1:Math.max(0,Math.min(R.r,b.rows.length-1)), q=b.rows[r]; n=ctl(q,R.k); if(!n) for(let k=0;k<q.cells.length&&!n;k++) n=ctl(q,k); } }
    if(n){ n.focus(); if(n.select&&n.tagName!=='SELECT'&&n.type!=='checkbox') try{ n.select(); }catch(_){} const p=pos(n); if(p) ACT=p; }   /* ligne active posée aussi sans événement focusin (fenêtre de l'app sans le focus du système) */
    else if(!dlg.contains(document.activeElement)) corps.focus({preventScroll:true});   /* champ détruit par le redessin : le clavier et Échap restent dans la fenêtre */
    surligner(); majBar(); majSeg(); majTete(); majRef(ref,corps,document.activeElement); };
  /* outils : la saisie en cours est validée d'abord (le moteur redessine tout à la modification), puis l'action ; le curseur va à la cellule visée */
  const act=(fn,cible)=>{ const a=document.activeElement; if(a&&corps.contains(a)&&a.closest('tbody')){ a.blur(); decoTout(); } rep=cible||(ACT?{...ACT}:null); fn(); setTimeout(()=>{ rep=null; },0); };
  const effacer=()=>{ if(!ACT) return; const A={...ACT}; act(()=>{ const b=tbd(A.bi), tr=b&&b.rows[A.r], x=tr&&BTN.get(tr); if(x) x.click(); },{bi:A.bi,r:A.r,k:0}); };
  corps.addEventListener('focusin',e=>{ const p=pos(e.target); if(p){ ACT=p; surligner(); majBar(); } majRef(ref,corps,e.target); });
  corps.addEventListener('input',e=>majRef(ref,corps,e.target)); corps.addEventListener('change',e=>majRef(ref,corps,e.target));
  corps.addEventListener('mousedown',e=>{ const td=e.target.closest&&e.target.closest('tbody td'); if(!td) return; const p=pos(td); if(!p) return; ACT=p; const c=e.target.closest('input,select');
    if(c&&c!==document.activeElement){ rep={...p}; setTimeout(()=>{ rep=null; },0); } else if(!c){ surligner(); majBar(); } },true);
  corps.addEventListener('change',e=>{ const c=e.target; if(rep||!c.closest||!c.closest('tbody')||(c.tagName!=='SELECT'&&c.type!=='checkbox')) return; const p=pos(c); if(p){ rep=p; setTimeout(()=>{ rep=null; },0); } },true);
  corps.addEventListener('keydown',e=>{ const c=e.target; if(!c.closest||!c.closest('tbody')||c.tagName==='TEXTAREA') return; const p=pos(c); if(!p) return;
    if(e.key==='Tab'){ rep=suivant(p,e.shiftKey?-1:1); setTimeout(()=>{ rep=null; },0); return; }
    if(e.key!=='Enter'&&e.key!=='ArrowDown'&&e.key!=='ArrowUp') return; if(c.tagName==='SELECT'&&e.key!=='Enter') return;
    const q=vertical(p,e.key==='ArrowUp'?-1:1)||(e.key==='Enter'?suivant(p,1):null); e.preventDefault(); if(!q) return;
    rep=q; c.blur(); const b=tbd(q.bi), n=b&&b.rows[q.r]&&ctl(b.rows[q.r],q.k); if(rep&&n&&n.isConnected){ rep=null; n.focus(); if(n.select&&n.tagName!=='SELECT'&&n.type!=='checkbox') try{ n.select(); }catch(_){} } setTimeout(()=>{ rep=null; },0); });
  regs.addEventListener('input',majTete); regs.addEventListener('change',majTete); pied.addEventListener('input',majTete);
  new MutationObserver(majTete).observe(ent,{subtree:true,childList:true,characterData:true});
  const mo=new MutationObserver(appliquer); boxes.forEach(b=>mo.observe(b,{childList:true}));
  echap(dlg);
  /* premier curseur : lot à saisir (contrat), sinon le premier montant à saisir */
  const lotN=pay?null:lot.querySelector('input');
  appliquer();
  let f0=lotN&&!lotN.value.trim()?lotN:null; if(!f0){ const b=tbd(0); if(b) for(const tr of b.rows){ for(const td of tr.cells){ const c=td.querySelector('input[type=number]:not([disabled])'); if(c){ f0=c; break; } } if(f0) break; } }
  if(!f0) f0=bar.querySelector('.sgew-b'); if(f0){ f0.focus(); if(f0.select) try{ f0.select(); }catch(_){} const p=pos(f0); if(p){ ACT=p; surligner(); majBar(); } majRef(ref,corps,f0); }
  window.SGEW.dernier={kind,dlg,doc,appliquer};
}

/* ══ Mutation (transfert, variation, renchérissement) et provision / coût probable : champs HT / TVA / TTC du moteur (htTtc) dans une petite grille ══ */
function grille(T0,lignes,foot){ const t=el('table'); t.innerHTML='<colgroup><col style="width:144px"><col><col><col style="width:124px"><col style="width:80px"><col style="width:108px"><col style="width:128px"></colgroup>'
    +'<thead><tr><th>'+E(T0)+'</th><th>CFC</th><th>Entreprise</th><th class="r">Montant HT</th><th class="r">TVA</th><th class="r">Montant TVA</th><th class="r">Montant TTC</th></tr></thead><tbody></tbody>'+(foot?'<tfoot><tr><td colspan="3"></td><td class="r"></td><td></td><td class="r"></td><td class="r"></td></tr></tfoot>':'');
  const cell=(cls,x)=>{ const td=el('td',cls||''); (Array.isArray(x)?x:[x]).forEach(y=>{ if(y==null) return; if(y.nodeType) td.append(y); else td.insertAdjacentHTML('beforeend',y); }); return td; };
  lignes.forEach(L=>{ const tr=document.createElement('tr'); L.forEach(([cls,x])=>tr.append(cell(cls,x))); t.tBodies[0].append(tr); }); const box=el('div','sgew-box'); box.append(t); return {box,t}; }
function brancherGrille(dlg,corps,ref,pickers){ let actif=null;
  const surligner=tr=>{ corps.querySelectorAll('tr.sgew-on').forEach(x=>x.classList.remove('sgew-on')); if(tr) tr.classList.add('sgew-on'); };
  corps.addEventListener('focusin',e=>{ const tr=e.target.closest&&e.target.closest('tbody tr'); if(tr){ actif=tr; surligner(tr); } majRef(ref,corps,e.target); });
  corps.addEventListener('mousedown',e=>{ const tr=e.target.closest&&e.target.closest('tbody tr'); if(tr){ actif=tr; surligner(tr); } });
  corps.addEventListener('input',e=>majRef(ref,corps,e.target));
  return { picker:()=>{ const tr=actif||pickers.defaut; return pickers.de(tr); }, poser:c=>{ const tr=c&&c.closest&&c.closest('tbody tr'); if(tr){ actif=tr; surligner(tr); } majRef(ref,corps,c); } }; }
function habMut(dlg,args){ const genre=args[1], tr0=genre==='transfert';
  const bd=dlg.querySelector('.bd'), body=bd&&bd.firstElementChild; if(!body) return; const get=champs(body);
  const gen=get('Genre de mutation'), st=get('Statut'), oP=tr0?get('CFC','Origine'):null, oE=tr0?get('Entreprise','Origine'):null, dP=get('CFC',tr0?'Destination':'Position'), dE=get('Entreprise',tr0?'Destination':'Position');
  const ht=get('Total HT'), tvaW=get('TVA'), ttc=get('Total TVA incl.'), numW=get('Numéro de mutation'), rem=get('Remarque'), dt=get('Date'), com=get('Commentaire');
  const tva=tvaW&&tvaW.querySelector('input'), num2=numW&&numW.querySelector('input');
  if(!gen||!st||!dP||!dE||!ht||!tva||!ttc||!num2||!dt||(tr0&&(!oP||!oE))) return; cssE();
  dlg.classList.add('sgew-dlg','sgew-dm'); dlg.style.width='';
  const T=tete(), regs=el('div','sgew-regs'), bar=el('div','sgew-bar'), corps=el('div','sgew-corps'), cache=el('div','sgew-cache'), ref=el('div','sgew-ref');
  numW.classList.add('sgew-nm'); [...numW.childNodes].forEach(n=>{ if(n.nodeType===3) n.remove(); }); const bN=numW.querySelector('.ib'); if(bN){ bN.innerHTML=svg('suiv'); bN.title='Prochain numéro libre'; }
  regs.append(rang('sgew-r-m',[champ('Genre de mutation',gen),champ('Statut',st),champ('N° de mutation',numW),champ('Date',dt)]));
  [oE,dE].forEach(p=>{ if(p) p.classList.add('sgew-ent'); });
  const u=()=>el('span','sgew-u','%');
  const L=[]; if(tr0) L.push([['sgew-k sgew-sens','<b>Origine</b><i>−</i>'],['',oP],['',oE],['sgew-k r',null],['sgew-k r',null],['sgew-k r',null],['sgew-k r',null]]);
  L.push([['sgew-k sgew-sens','<b>'+(tr0?'Destination':'Position')+'</b>'+(tr0?'<i>+</i>':'')],['',dP],['',dE],['r',ht],['r',[tva,u()]],['sgew-k r',null],['r',ttc]]);
  const G=grille(tr0?'Sens':'Mutation',L,true), rO=tr0?G.t.tBodies[0].rows[0]:null, rD=G.t.tBodies[0].rows[tr0?1:0], fo=G.t.tFoot.rows[0].cells;
  fo[0].textContent='Effet sur le devis général révisé'; fo[0].title=tr0?'Transfert : l’origine diminue de ce que la destination reçoit':'La mutation s’ajoute au devis général révisé';
  const B=brancherGrille(dlg,corps,ref,{defaut:rD,de:tr=>tr===rO?oE:dE});
  bar.append(outil('pers','Choisir l’entreprise','Choisir l’entreprise de la ligne où se trouve le curseur',()=>{ const p=B.picker(), b=p&&p.querySelectorAll('.ib')[0]; if(b) b.click(); }),
    outil('aucun','Aucune entreprise','Retirer l’entreprise de la ligne où se trouve le curseur',()=>{ const p=B.picker(), b=p&&p.querySelectorAll('.ib')[1]; if(b) b.click(); }),ref);
  const pied=el('div','sgew-pied m'); if(rem) pied.append(champ('Remarque',rem)); if(com) pied.append(champ('Commentaire',com));
  corps.tabIndex=-1; corps.append(el('div','sgew-cap',tr0?'Origine et destination du transfert':'Position de la mutation'),G.box,pied);
  cache.append(...[...body.children]); bd.replaceChildren(T,regs,bar,corps,cache);
  aide(dlg,'<b>Tab</b> cellule suivante · <b>Échap</b> annule la saisie');
  const code=s=>s.value||'—';
  const maj=()=>{ const h=+ht.value||0, x=tva.value===''?'':tva.value, c=+ttc.value||0, v=c-h, k=tr0?0:1;
    if(rO){ rO.cells[3].textContent=mt(-h); rO.cells[4].textContent=x===''?'':x+' %'; rO.cells[5].textContent=mt(-v); rO.cells[6].textContent=mt(-c); }
    rD.cells[5].textContent=mt(v); fo[1].textContent=mt(h*k); fo[3].textContent=mt(v*k); fo[4].textContent=mt(c*k);
    remplir(T,{big:(num2.value||'').trim()||'—',lb:['Mutation n° '+((num2.value||'').trim()||'—'),txtSel(gen),txtSel(st)].filter(Boolean).join(' · '),
      h3:tr0?code(oP)+' → '+code(dP):(txtSel(dP)||'Position à choisir'),h3t:tr0?txtSel(oP)+' → '+txtSel(dP):'',
      meta:[tr0?nomEnt(oE)+' → '+nomEnt(dE):nomEnt(dE),dt.value?dd(dt.value):''].filter(Boolean).join(' · '),tl:'Montant TTC',tv:mt(c),ts:'HT '+mt(h)+' · TVA '+(x===''?'0':x)+' %'}); };
  dlg.addEventListener('input',maj); dlg.addEventListener('change',maj); [oE,dE].forEach(p=>{ if(p) new MutationObserver(maj).observe(p,{subtree:true,childList:true,characterData:true}); });
  echap(dlg); maj();
  const f0=!dP.value?dP:ht; f0.focus(); if(f0.select) try{ f0.select(); }catch(_){} B.poser(f0);
  window.SGEW.dernier={kind:'mut',dlg}; }
function habEntry(dlg,args){ const type=args[1];
  const bd=dlg.querySelector('.bd'), body=bd&&bd.firstElementChild; if(!body) return; const get=champs(body);
  const P=get('CFC'), En=get('Entreprise'), rem=get('Remarque'), dt=get('Date'), ht=get('Total HT'), tvaW=get('TVA'), ttc=get('Total TVA incl.'), tva=tvaW&&tvaW.querySelector('input');
  const z=[...body.querySelectorAll('label')].find(l=>l.querySelector('input[type=checkbox]'))||null;
  if(!P||!En||!rem||!dt||!ht||!tva||!ttc) return; cssE();
  dlg.classList.add('sgew-dlg','sgew-de'); dlg.style.width='';
  const T=tete(), regs=el('div','sgew-regs'), bar=el('div','sgew-bar'), corps=el('div','sgew-corps'), cache=el('div','sgew-cache'), ref=el('div','sgew-ref');
  const nom=type==='provision'?'Provision':'Coût probable perso';
  regs.append(rang('sgew-r-e',[champ('Date',dt),champ('Remarque',rem),z?champ('',z,'ck'):el('div')])); En.classList.add('sgew-ent');
  const G=grille('Écriture',[[['sgew-k sgew-sens','<b>'+E(nom)+'</b>'],['',P],['',En],['r',ht],['r',[tva,el('span','sgew-u','%')]],['sgew-k r',null],['r',ttc]]],false), rD=G.t.tBodies[0].rows[0];
  const B=brancherGrille(dlg,corps,ref,{defaut:rD,de:()=>En});
  bar.append(outil('pers','Choisir l’entreprise','Choisir l’entreprise',()=>{ const b=En.querySelectorAll('.ib')[0]; if(b) b.click(); }),
    outil('aucun','Aucune entreprise','Retirer l’entreprise',()=>{ const b=En.querySelectorAll('.ib')[1]; if(b) b.click(); }),ref);
  corps.tabIndex=-1; corps.append(el('div','sgew-cap',type==='provision'?'Provision':'Coût probable'),G.box);
  cache.append(...[...body.children]); bd.replaceChildren(T,regs,bar,corps,cache);
  aide(dlg,'<b>Tab</b> cellule suivante · <b>Échap</b> annule la saisie');
  const maj=()=>{ const h=+ht.value||0, x=tva.value===''?'0':tva.value, c=+ttc.value||0; rD.cells[5].textContent=mt(c-h); const lib=txtSel(P);
    remplir(T,{big:P.value||'—',lb:[nom,dt.value?dd(dt.value):''].filter(Boolean).join(' · '),h3:P.value?lib.replace(/^\S+\s*/,'')||lib:'Position à choisir',meta:[nomEnt(En),rem.value.trim()].filter(Boolean).join(' · '),
      tl:'Montant TTC',tv:mt(c),ts:'HT '+mt(h)+' · TVA '+x+' %'}); };
  dlg.addEventListener('input',maj); dlg.addEventListener('change',maj); new MutationObserver(maj).observe(En,{subtree:true,childList:true,characterData:true});
  echap(dlg); maj();
  const f0=P.value?ht:P; f0.focus(); if(f0.select) try{ f0.select(); }catch(_){} B.poser(f0);
  window.SGEW.dernier={kind:'entry',dlg}; }

/* ══ Enveloppes : la fenêtre du moteur est créée, puis habillée (les tableaux du moteur sont repérés pendant sa construction) ══ */
const envelopper=(f0,kind)=>function(){ const n0=document.querySelectorAll('.dlg').length, cap=[], lg0=linesGrid, ct0=condTable; let r;
  if(kind==='pay'||kind==='ctr'){ linesGrid=function(C,doc){ const o=lg0.apply(this,arguments); cap.push({t:'lg',doc,o}); return o; }; condTable=function(doc){ const o=ct0.apply(this,arguments); cap.push({t:'ct',doc,o}); return o; }; }
  try{ r=f0.apply(this,arguments); } finally { linesGrid=lg0; condTable=ct0; }
  const L=document.querySelectorAll('.dlg'); if(L.length>n0){ const d=L[L.length-1], a=[...arguments];
    try{ if(kind==='mut') habMut(d,a); else if(kind==='entry') habEntry(d,a); else habDoc(kind,d,a,cap); }catch(e){ console.error(e); } }
  return r; };
window.SGEW={dernier:null,habDoc,habMut,habEntry};
ccPayment=envelopper(ccPayment,'pay'); ccContract=envelopper(ccContract,'ctr'); ccMut=envelopper(ccMut,'mut'); ccEntry=envelopper(ccEntry,'entry');
})();

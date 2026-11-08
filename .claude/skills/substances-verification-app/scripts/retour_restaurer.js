/* À exécuter dans l'onglet de Paulo APRÈS le rechargement : rouvre la fenêtre du document et revient à la même page. */
(async () => {
  const st = JSON.parse(sessionStorage.getItem('__retour') || 'null'); if (!st) return 'rien à restaurer';
  const dodo = ms => new Promise(r => setTimeout(r, ms));
  for (let i = 0; i < 40 && (typeof VIEW === 'undefined' || !VIEW); i++) await dodo(250);
  await dodo(1200);
  /* devis ouvert avant : le rouvrir (l'app revient sinon à la liste) */
  if (st.devisId && !document.querySelector('#main .sgde')) { const d = DS.get('costestimatedocument', st.devisId); if (d) { await ch02dOpen(d); await dodo(1500); } }
  else if (st.vue && st.vue !== VIEW.id) { try { go(st.vue, st.vueArg); await dodo(900); } catch (_) {} }
  if (st.docOuvert && !document.querySelector('.sgdv')) {
    const tb = [...document.querySelectorAll('#main button, #main a, #main [role=tab], #main span')].find(b => b.textContent.trim() === 'Documents'); if (tb) { tb.click(); await dodo(800); }
    /* ligne du document ouvert (Devis général, Devis descriptif, Honoraires) puis « Ouvrir » */
    const lignes = [...document.querySelectorAll('#main .sgde-dl, #main tr, #main .sgde-doc')];
    const ligne = lignes.find(l => st.docTitre && l.textContent.includes(st.docTitre)) || null;
    const ob = (ligne ? [...ligne.querySelectorAll('button')] : [...document.querySelectorAll('#main button')]).find(b => b.textContent.trim() === 'Ouvrir');
    if (ob) ob.click();
  }
  if (st.page) { for (let i = 0; i < 80 && !document.querySelector('.sglp-p canvas'); i++) await dodo(250);
    const inp = document.querySelector('.sglp-in'); if (inp) { inp.value = st.page; inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); } }
  else if (st.mainDefil && document.querySelector('#main')) document.querySelector('#main').scrollTop = st.mainDefil;
  sessionStorage.removeItem('__retour');
  return { vue: (typeof VIEW !== 'undefined' && VIEW) ? VIEW.id : null, fenetre: !!document.querySelector('.sgdv'), page: (document.querySelector('.sglp-in') || {}).value };
})();

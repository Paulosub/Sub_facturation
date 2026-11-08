/* À exécuter dans l'onglet de Paulo JUSTE AVANT de le recharger : note où il se trouve (sessionStorage survit au rechargement de l'onglet). */
(() => {
  const q = s => document.querySelector(s);
  const st = {
    vue: (typeof VIEW !== 'undefined' && VIEW) ? VIEW.id : null,
    titre: document.title,
    docOuvert: !!q('.sgdv'),                                           /* fenêtre d'aperçu des documents du devis */
    docTitre: q('.sgdv h3') ? q('.sgdv h3').textContent.trim() : null,
    visuOuvert: !!q('.sglv'),                                          /* fenêtre des fichiers (PDF) */
    page: q('.sglp-in') ? q('.sglp-in').value : null,
    defil: q('.sglp-vue') ? q('.sglp-vue').scrollTop : null,
    onglet: (() => { const b = [...document.querySelectorAll('#main .sgde-tabs .on, #main [aria-selected="true"]')][0]; return b ? b.textContent.trim() : null; })(),
    mainDefil: q('#main') ? q('#main').scrollTop : 0,
    devisId: (() => { try { const X = window.SGDE && SGDE.X; const h = X && ch02aHdr(X); return h && document.querySelector('#main .sgde') ? h.ID : null; } catch (_) { return null; } })(),
    vueArg: (typeof VIEW !== 'undefined' && VIEW) ? VIEW.arg : null
  };
  sessionStorage.setItem('__retour', JSON.stringify(st));
  return st;
})();

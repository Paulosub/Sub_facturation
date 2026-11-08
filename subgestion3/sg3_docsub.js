/* ═══ 30. Documents Substances — moteur PDF des documents types au graphisme des contrats et factures (sg3_docsub.js, 25.10.2026) ═══
   Demande de Paulo : « reproduire tous les documents types avec la mise en forme de contrat et facture que j'ai créée moi-même avec
   l'entête, le pied de page etc. […] titre en haut à gauche avec la date, le pied de page avec l'adresse du bureau etc., à droite le
   logo de Substances Architectes noir pour la première page et gris pour les pages suivantes ».

   MODE D'EMPLOI
   - Une seule fonction, autonome : `async function sgDsPdf(R, rep, o)` → Uint8Array (octets du PDF, pdf-lib).
     · R = ressources { PDFLib, fontkit, polices:{light, regular, bold, lightItalic}, gabarits:{offre, facture},
       styles:{textstyleset, rowstyleset} } ; polices et gabarits : Uint8Array, ArrayBuffer ou chaîne « data:…;base64,… »
       (dans l'app : w.eval('AKKU_LIGHT'), w.eval('OFFRE_TMPL'), w.eval('FA_TMPL') du cadre Facturation) ;
     · rep = `report` d'un document type (reportTitle, pageTemplates, sections) — peut être null (épreuve) ;
     · o = { titre, date (Date | 'AAAA-MM-JJ'), jeu, type, description, lieu ('CULLY'), sousTitre (2e ligne grise facultative :
       la date passe alors en 3e ligne, comme les pages courantes des contrats), epreuve (liste d'orientations
       ['portrait','paysage',…] : pages d'essai avec la zone utile tracée), zones (true : trace la zone utile sur chaque page),
       subset (false : polices non sous-ensemblées), journal (tableau : reçoit les alertes) }.
     · o.jobs (bloc 31, impressions au papier des contrats) : exemplaires avec DONNÉES, préparés par l'app (sg3_impressions.js,
       sgImpPreparer) — valeurs des champs, tableaux et signatures déjà mises en texte ; détail en B7. Sans o.jobs : repères (inchangé).
   - AUCUNE variable extérieure : tout (constantes comprises) est DANS la fonction, pour qu'elle puisse être recréée dans le domaine
     du cadre Facturation : `w.Function('return ('+sgDsPdf.toString()+')')()` (sinon pdf-lib refuse les tableaux d'un autre domaine).
     Pas de DOM, pas de `DS`, aucune écriture de données.
   - La fonction est en deux parties :
     A. le PAPIER Substances (constantes figées `PAP`, création d'une page portrait / paysage avec en-tête, pied du bureau, logo noir
        sur la 1re page et gris ensuite, numérotation « n | total » posée à la fin) — relevé dans Facturation.html (offrePDFBytes :
        runHdr, stampLogo, LOGO_BB, renumérotation ; generateInvoicePDF : hdrContrat, piedContrat) et dans les gabarits ;
     B. le CONTENU (agent 2) : toutes les bandes du document type (GridBand, TableBand, WrappingTextBand, TextBand, LineBand,
        PageBreakBand, images) remises au graphisme des contrats et factures, texte identique ; champs = repères « ‹ libellé › »
        (dictionnaire SG_DS_CHAMPS) ; pagination automatique. S'appuie sur l'objet `ctx` du papier (section « Objet ctx »).
        Système graphique détaillé : SYSTEME_GRAPHIQUE.md de l'atelier (docsub/sorties/2_graphiste).
   - Banc d'essai hors de l'app : dossier docsub/harness de l'atelier (rendre.sh, LISEZMOI.md).
   - Fichiers des gabarits : on travaille sur des COPIES chargées en mémoire (PDFDocument.load) ; les octets reçus ne sont jamais
     modifiés. Le logo et le pied sont repris en vectoriel par embedPage, après avoir retiré de ces copies tout ce qui n'est pas le
     logo ou le pied (textes et données des documents d'origine) : aucun texte caché d'un contrat ou d'une facture dans le PDF. */

async function sgDsPdf(R, rep, o){
  'use strict';
  o = o || {};
  const PDFLib = R.PDFLib;
  const { PDFDocument, rgb, PDFName, PDFArray, PDFRawStream, PDFDict } = PDFLib;

  /* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
     A. PAPIER SUBSTANCES
     ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

  /* ── A1. Constantes figées (points pdf-lib, origine en bas à gauche) ──
     Portrait = sortie réelle des contrats (offrePDFBytes, pages courantes). Paysage = page 10 du gabarit de l'offre (annexe
     « tableau détaillé ») telle que le contrat l'imprime : en-tête et logo du gabarit, numérotation redessinée comme en portrait.
     En-tête : y donnés depuis le HAUT de la page (dh = hauteur − y). Pied et numérotation : depuis le BAS ; numérotation et logo
     paysage : depuis la DROITE (dx = largeur − x). */
  const MM = 595.276/210;
  const PAP = {
    mm: MM,
    format: { portrait:{ w:595.276, h:841.89 }, paysage:{ w:841.89, h:595.276 } },
    filet: 0.25,                       /* épaisseur unique de tous les traits (thinStrokes des contrats et factures) */
    taille: 7.5,                       /* corps de l'en-tête, du pied et de la numérotation */
    entete: {
      /* titre Bold cN ; trait 1 ; ligne 2 Light cG (date, ou sous-titre) ; trait 2 et ligne 3 (date) si sous-titre */
      portrait: { titre:{ x:28.4, dh:36.29 }, trait1:{ x0:28.35, x1:36.5, dh:39.79 }, l2:{ x:28.3, dh:50.29 },
                  trait2:{ x0:28.35, x1:36.5, dh:53.99 }, l3:{ x:28.4, dh:63.39 } },
      paysage:  { titre:{ x:28.3839, dh:34.5093 }, trait1:{ x0:28.3464, x1:36.8504, dh:39.2435 }, l2:{ x:28.3465, dh:48.5093 },
                  trait2:{ x0:28.3464, x1:36.8504, dh:52.5663 }, l3:{ x:28.3839, dh:62.5093 } }
    },
    pied: {
      /* adresse, téléphone / courriel, IDE / registre : repris en vectoriel du gabarit de l'offre (lignes de base 41.958 et
         27.958, x 28.38 / 125.72 / 222.98), bande posée à l'origine de la page (le pied se mesure depuis le bas à gauche).
         Portrait : page courante (3e page du gabarit), petits traits redessinés à y 37.8 comme le contrat (piedContrat,
         renumérotation d'offrePDFBytes). Paysage : page 10 du gabarit (annexe), traits du gabarit gardés (y 38.08) — le contrat
         ne les redessine pas en paysage, et le texte de cette page est un peu plus serré (fin de la 3e colonne 1 pt plus à gauche). */
      bande: { left:0, bottom:20, right:300, top:50 },
      portrait: { gabaritPage:2, traitsGabarit:false, traits:{ y:37.8, x:[[28.35,36.5],[125.85,134.3],[222.95,231.4]] } },
      paysage:  { gabaritPage:9, traitsGabarit:true,  traits:null }
    },
    numero: {
      /* « n | total » Light 7,5 cN : n fer à droite à largeur − 87.6, total à largeur − 82.2, base 28.0, trait vertical */
      dxN:87.6, dxT:82.2, y:28.0, trait:{ dx:84.6, y0:26.55, y1:35.05 }
    },
    logo: {
      /* bande du logo vertical des gabarits FACTURE : page 1 = noir, page 2 = gris (LOGO_BB d'offrePDFBytes) */
      bb: { left:541, bottom:83.5, right:568.5, top:236 },
      portrait: { x:541, y:83.5 },     /* = position de la facture et des pages portrait du contrat */
      paysage:  { dx:49.965, y:80.155 } /* x = largeur − 49.965 : logo de la page paysage du contrat (encre 793.9–817.9 / 85.9–229.6) */
    },
    /* Zone utile du contenu : marges de 30 mm (portrait), mesurées sur les gabarits (texte des contrats et factures x 85.04 → 510.24,
       bande des chapitres à 756.85, encre la plus basse ~85) ; paysage : tableau de l'annexe (x 28.35 → 756.85). basMin = limite
       absolue au-dessus du pied (haut du pied ~47.4) si le graphiste doit gagner de la place. */
    zone: {
      portrait: { x0:30*MM, x1:595.276-30*MM, haut:841.89-30*MM, bas:30*MM, basMin:56 },
      paysage:  { x0:10*MM, x1:841.89-30*MM, haut:595.276-30*MM, bas:30*MM, basMin:56 }
    },
    /* Repères relevés sur la page 3 du gabarit de l'offre (pour le graphiste ; portrait) : chapitre = numéro Bold 8 à x 85.04,
       trait vertical à x 121.89, TITRE Bold 8 capitales à x 130.39, ligne de base à haut − 9.78, filet à haut − 14.17 ;
       corps Light 8 pt, interligne 10 pt ; texte des chapitres à x 130.39 (L des contrats). */
    reperes: { chapitre:{ num_x:85.0394, trait_x:121.8898, texte_x:130.3937, base_dh:9.7818, filet_dh:14.1734, taille:8 },
               corps:{ taille:8, interligne:10 } },
    lieu: 'CULLY',
    mois: ['JANVIER','FÉVRIER','MARS','AVRIL','MAI','JUIN','JUILLET','AOÛT','SEPTEMBRE','OCTOBRE','NOVEMBRE','DÉCEMBRE']
  };
  const C = {
    N: rgb(0.08,0.07,0.07),            /* texte (cN des contrats) */
    G: rgb(0.4,0.4,0.4),               /* gris de l'en-tête (cG) */
    B: rgb(1,1,1),                     /* blanc */
    R: rgb(0.886,0,0.102),             /* rouge des contrats (cRed) — réservé aux montants avec rabais des annexes */
    repere: rgb(0.55,0.55,0.55)        /* gris des repères de champs (proposition, à figer par le graphiste) */
  };

  /* ── A2. Utilitaires d'octets et de texte ── */
  const octets = (x) => {
    /* copie dans le domaine de CETTE fonction (pdf-lib vérifie instanceof Uint8Array) */
    if(x == null) throw new Error('Ressource manquante');
    if(typeof x === 'string'){
      const b64 = x.indexOf(',') >= 0 && /^data:/.test(x) ? x.slice(x.indexOf(',')+1) : x;
      const bin = atob(b64); const a = new Uint8Array(bin.length);
      for(let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
      return a;
    }
    return new Uint8Array(x);
  };
  const versOctets = (s) => { const a = new Uint8Array(s.length); for(let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) & 0xff; return a; };
  /* sauts de ligne unifiés (\r\n, \r, U+2028/2029 → \n), espaces typographiques sans glyphe dans Akkurat (U+2002, U+2003,
     U+2009) → espace, tabulation → espace, autres caractères de contrôle retirés */
  const nettoyer = (s) => String(s == null ? '' : s).replace(/\r\n?|[\u2028\u2029]/g,'\n').replace(/[\t\u2002\u2003\u2009]/g,' ')
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g,'');
  const maj = (s) => nettoyer(s).toUpperCase();
  const laDate = (d) => {
    /* Date (de ce domaine ou d'un autre), 'AAAA-MM-JJ' ou nombre ; date invalide ou absente → aujourd'hui */
    let r = null;
    if(typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)){ const p = d.split('-'); r = new Date(+p[0], +p[1]-1, +p[2].slice(0,2)); }
    else if(typeof d === 'number') r = new Date(d);
    else if(d && typeof d.getTime === 'function') r = new Date(d.getTime());
    return (r && !isNaN(r.getTime())) ? r : new Date();
  };
  const dateFR = (d) => { d = laDate(d); return d.getDate()+' '+PAP.mois[d.getMonth()]+' '+d.getFullYear(); };
  const journal = Array.isArray(o.journal) ? o.journal : [];
  const alerte = (m) => { journal.push(String(m)); };

  /* ── A3. Gabarits : copies réduites au logo et au pied (aucun texte des documents d'origine) ── */
  const lireFlux = (ctxPdf, ref) => {
    const st = ctxPdf.lookup(ref);
    if(!(st instanceof PDFRawStream)) return null;
    const b = PDFLib.decodePDFRawStream(st).decode();
    let t = ''; for(let i = 0; i < b.length; i++) t += String.fromCharCode(b[i]);
    return t;
  };
  /* retire d'un flux de contenu : les blocs de texte (BT…ET), les traits simples (« q … cm 0 0 m x y l S Q »), les appels de formes */
  const filtrerFlux = (t, garder) => {
    const ch = [];
    let m = t.replace(/\((?:[^()\\]|\\[\s\S])*\)/g, s => { ch.push(s); return '\u0001'+(ch.length-1)+'\u0002'; })
             .replace(/<[0-9A-Fa-f\s]*>/g, s => { ch.push(s); return '\u0001'+(ch.length-1)+'\u0002'; });
    if(!garder.texte) m = m.replace(/\bBT\b[\s\S]*?\bET\b/g, '');
    if(!garder.traits) m = m.replace(/\bq\s+1 0 0 1 [-\d.]+ [-\d.]+ cm\s+0 0 m\s+[-\d.]+ [-\d.]+ l\s+S\s+Q\b/g, '');
    if(!garder.formes) m = m.replace(/\bq\b[^qQ]*?\/[A-Za-z0-9_.]+\s+Do\s*\bQ\b/g, '').replace(/\/[A-Za-z0-9_.]+\s+Do\b/g, '');
    return m.replace(/\u0001(\d+)\u0002/g, (s, i) => ch[+i]);
  };
  /* page d'un gabarit réduite à UNE forme (« /Nom Do ») ; la forme elle-même filtrée selon `garder` */
  const reduirePage = (gdoc, page, nomForme, garder) => {
    const cx = gdoc.context;
    const cont = page.node.get(PDFName.of('Contents'));
    const lu = cx.lookup(cont);
    const refs = (lu instanceof PDFArray) ? lu.asArray() : [cont];
    let src = ''; refs.forEach(r => { const t = lireFlux(cx, r); if(t) src += t + '\n'; });
    const re = new RegExp('\\bq\\b[^qQ]*?\\/' + nomForme + '\\s+Do\\s*\\bQ\\b');
    const g = src.match(re);
    if(!g) throw new Error('Gabarit : forme ' + nomForme + ' introuvable');
    page.node.set(PDFName.of('Contents'), cx.register(cx.stream(versOctets(g[0]))));
    const res = page.node.Resources();   /* ressources de la page (héritées du nœud Pages au besoin) */
    const xo = res instanceof PDFDict ? cx.lookup(res.get(PDFName.of('XObject'))) : null;
    const fref = xo instanceof PDFDict ? xo.get(PDFName.of(nomForme)) : null;
    if(!fref) throw new Error('Gabarit : ressource ' + nomForme + ' introuvable');
    /* ressources de la page réduites à l'état graphique et à la seule forme gardée (pas de polices du corps) */
    const nres = cx.obj({});
    const eg = res.get(PDFName.of('ExtGState')); if(eg) nres.set(PDFName.of('ExtGState'), eg);
    const nxo = cx.obj({}); nxo.set(PDFName.of(nomForme), fref); nres.set(PDFName.of('XObject'), nxo);
    page.node.set(PDFName.of('Resources'), nres);
    /* la forme : nouveau flux filtré, même dictionnaire (BBox, Matrix, Resources…) */
    const st = cx.lookup(fref);
    const t = filtrerFlux(lireFlux(cx, fref), garder);
    const ns = cx.flateStream(versOctets(t));
    ['Type','Subtype','BBox','Matrix','Resources','Group','FormType'].forEach(k => { const v = st.dict.get(PDFName.of(k)); if(v !== undefined) ns.dict.set(PDFName.of(k), v); });
    /* ressources de la forme : sans les formes retirées, et sans les polices quand le texte est retiré (agent 4 : sinon les
       polices de la facture d'origine restaient incorporées, inutilisées, dans chaque PDF — environ 23 Ko) */
    if(!garder.formes || !garder.texte){
      const fr = cx.lookup(ns.dict.get(PDFName.of('Resources')));
      const retirer = (k) => (k === PDFName.of('XObject') && !garder.formes) || (k === PDFName.of('Font') && !garder.texte);
      if(fr instanceof PDFDict){ const fr2 = cx.obj({}); fr.entries().forEach(([k, v]) => { if(!retirer(k)) fr2.set(k, v); }); ns.dict.set(PDFName.of('Resources'), fr2); }
    }
    cx.assign(fref, ns);
  };

  /* ── A4. Document, polices, logo et pied ── */
  const doc = await PDFDocument.create();
  doc.registerFontkit(R.fontkit);
  const SUB = { subset: o.subset !== false };
  const P = R.polices || {};
  const F = {
    light:       await doc.embedFont(octets(P.light),       SUB),   /* Akkurat LL TT Light — texte courant, en-tête gris, numéros */
    regular:     await doc.embedFont(octets(P.regular),     SUB),   /* Regular — emphase, totaux */
    bold:        await doc.embedFont(octets(P.bold),        SUB),   /* Bold — titres, titre de l'en-tête */
    lightItalic: await doc.embedFont(octets(P.lightItalic), SUB)    /* Light Italic */
  };
  const gabF = await PDFDocument.load(octets(R.gabarits.facture));
  const gabO = await PDFDocument.load(octets(R.gabarits.offre));
  const sansTexte = { texte:false, traits:false, formes:false };
  reduirePage(gabF, gabF.getPage(0), 'Fm0', sansTexte);                       /* logo NOIR (1re page de la facture) */
  reduirePage(gabF, gabF.getPage(1), 'Fm0', sansTexte);                       /* logo GRIS (2e page de la facture) */
  ['portrait','paysage'].forEach(ori => { const pp = PAP.pied[ori];   /* pied : textes (+ traits du gabarit en paysage) */
    reduirePage(gabO, gabO.getPage(pp.gabaritPage), 'Fm0', { texte:true, traits:pp.traitsGabarit, formes:false }); });
  const LBB = PAP.logo.bb;
  /* embedPages en un seul appel par gabarit : les ressources communes (police du pied) ne sont copiées qu'une fois */
  const [logoNoir, logoGris] = await doc.embedPages([gabF.getPage(0), gabF.getPage(1)], [LBB, LBB]);
  const [piedPortrait, piedPaysage] = await doc.embedPages(
    [gabO.getPage(PAP.pied.portrait.gabaritPage), gabO.getPage(PAP.pied.paysage.gabaritPage)], [PAP.pied.bande, PAP.pied.bande]);
  const piedBande = { portrait:piedPortrait, paysage:piedPaysage };

  /* ── A5. Dessin de base ──
     Repli de glyphes : les polices Light et Bold des contrats sont des sous-ensembles SANS « | @ _ " ² º · » ni espace insécable
     (relevé sur les 163 documents types, 25.10.2026 ; aucune police n'a U+2002 ni U+2028, ramenés par nettoyer()) ; Regular et
     Light Italic ont les autres. Chaque caractère absent de la police
     demandée est dessiné dans la première police de REPLI qui l'a (sinon il resterait invisible). largeur() et couper() en tiennent
     compte. */
  const jeux = new Map(), signales = new Set();
  const aGlyphe = (f, cp) => { let s = jeux.get(f); if(!s){ s = new Set(f.getCharacterSet()); jeux.set(f, s); } return s.has(cp); };
  const REPLI = [F.regular, F.light, F.lightItalic, F.bold];
  const morceaux = (t, f) => {
    const out = [];
    for(const c of t){
      const cp = c.codePointAt(0);
      const g = aGlyphe(f, cp) ? f : (REPLI.find(x => aGlyphe(x, cp)) || f);
      if(g !== f && !/\s/.test(c) && cp !== 0xA0 && !signales.has(c) && signales.add(c)) alerte('Glyphe « ' + c + ' » (U+' + cp.toString(16).toUpperCase().padStart(4,'0') + ') pris dans une police de repli');
      if(out.length && out[out.length-1].f === g) out[out.length-1].t += c; else out.push({ t:c, f:g });
    }
    return out;
  };
  const largeur = (t, f, sz) => { f = f || F.light; sz = sz || PAP.taille;
    return morceaux(nettoyer(t).replace(/\n/g,' '), f).reduce((s, m) => s + m.f.widthOfTextAtSize(m.t, sz), 0); };
  const texte = (pg, t, x, y, op) => {
    /* une ligne (les sauts de ligne deviennent des espaces : utiliser couper() pour un texte sur plusieurs lignes) */
    op = op || {}; t = nettoyer(t).replace(/\n/g,' '); if(t === '') return 0;
    const f = op.police || F.light, sz = op.taille || 8, ms = morceaux(t, f);
    const w = ms.reduce((s, m) => s + m.f.widthOfTextAtSize(m.t, sz), 0);
    let xx = op.align === 'd' ? x - w : (op.align === 'c' ? x - w/2 : x);
    ms.forEach(m => { pg.drawText(m.t, { x:xx, y, font:m.f, size:sz, color:op.couleur || C.N }); xx += m.f.widthOfTextAtSize(m.t, sz); });
    return w;
  };
  const ligne = (pg, x0, y0, x1, y1, op) => { op = op || {};
    pg.drawLine({ start:{ x:x0, y:y0 }, end:{ x:x1, y:y1 }, thickness:Math.min(op.ep || PAP.filet, PAP.filet), color:op.couleur || C.N,
      dashArray:op.tirets || undefined }); };
  const rect = (pg, x, y, w, h, op) => { op = op || {};
    pg.drawRectangle({ x, y, width:w, height:h, color:op.fond || undefined, borderColor:op.bord || undefined,
      borderWidth:op.bord ? Math.min(op.ep || PAP.filet, PAP.filet) : 0, borderDashArray:op.tirets || undefined }); };
  const couper = (t, f, sz, maxW) => {
    /* retour au mot (espaces ordinaires seulement : l'espace insécable ne coupe pas), sauts de ligne d'origine respectés
       (une ligne vide reste une ligne vide) ; un mot plus long que la ligne est coupé à la lettre */
    f = f || F.light; sz = sz || 8; const out = [];
    const casser = (m) => { const p = []; let mo = '';
      for(const c of m){ if(mo && largeur(mo + c, f, sz) > maxW){ p.push(mo); mo = c; } else mo += c; }
      p.push(mo); return p; };
    nettoyer(t).split('\n').forEach(par => {
      let cur = '';
      par.split(/ +/).forEach(m => {
        const essai = cur ? cur + ' ' + m : m;
        if(largeur(essai, f, sz) <= maxW){ cur = essai; return; }
        if(cur) out.push(cur);
        if(largeur(m, f, sz) > maxW){ const p = casser(m); p.slice(0, -1).forEach(x => out.push(x)); cur = p[p.length-1]; }
        else cur = m;
      });
      out.push(cur);
    });
    return out;
  };

  /* ── A6. Papier d'une page ── */
  /* titre, sous-titre et date de l'en-tête : ceux du document, ou ceux de l'exemplaire en cours (o.jobs, voir B7) */
  let titreBrut = nettoyer(o.titre != null && o.titre !== '' ? o.titre : (rep && rep.reportTitle) || 'Document');
  let titreDoc = maj(titreBrut);
  let sousTitre = o.sousTitre ? maj(o.sousTitre) : '';
  let ligneDate = maj(o.lieu || PAP.lieu) + ' - ' + dateFR(o.date);
  /* titre de l'en-tête, sur une ligne : plus large que la page (même marge des deux côtés), il est tronqué (« ... » : la police
     Bold n'a pas « … ») et signalé ; le titre complet reste dans les métadonnées du PDF. Aucun des 163 documents types n'est
     concerné (67 caractères au plus) — correction de robustesse de l'agent 3 */
  let titreTronque = false;
  let sansEntete = false;   /* page de garde du cahier de soumission (bloc 44) : sans en-tête */
  const titreEntete = (w, E) => {
    const max = w - 2 * E.titre.x;
    if(largeur(titreDoc, F.bold, PAP.taille) <= max) return titreDoc;
    const L = Array.from(titreDoc);
    while(L.length > 1 && largeur(L.join('').trimEnd() + '...', F.bold, PAP.taille) > max) L.pop();
    if(!titreTronque){ titreTronque = true; alerte('Titre de l’en-tête plus large que la page : tronqué'); }
    return L.join('').trimEnd() + '...';
  };
  const entete = (pg, ori) => {
    const E = PAP.entete[ori], h = pg.getHeight();
    if(sansEntete) return;
    if(o.enteteLibre){                  /* en-tête à quatre champs du descriptif de soumission (bloc 40) : mesures du PDF de Paulo */
      const L = o.enteteLibre, T = 7.9, xD = 518.9;
      texte(pg, L.g1 || '', 28.3, h - 36.9, { police:F.bold, taille:T, couleur:C.N });
      texte(pg, L.d1 || '', xD, h - 36.9, { police:F.light, taille:T, couleur:C.N, align:'d' });
      texte(pg, L.g2 || '', 28.3, h - 46.8, { police:F.light, taille:T, couleur:C.N });
      texte(pg, L.d2 || '', xD, h - 46.8, { police:F.light, taille:T, couleur:C.N, align:'d' });
      ligne(pg, 26.9, h - 50.4, xD, h - 50.4);
      return;
    }
    texte(pg, titreEntete(pg.getWidth(), E), E.titre.x, h - E.titre.dh, { police:F.bold, taille:PAP.taille, couleur:C.N });
    ligne(pg, E.trait1.x0, h - E.trait1.dh, E.trait1.x1, h - E.trait1.dh);
    if(sousTitre){
      texte(pg, sousTitre, E.l2.x, h - E.l2.dh, { police:F.light, taille:PAP.taille, couleur:C.G });
      ligne(pg, E.trait2.x0, h - E.trait2.dh, E.trait2.x1, h - E.trait2.dh);
      texte(pg, ligneDate, E.l3.x, h - E.l3.dh, { police:F.light, taille:PAP.taille, couleur:C.G });
    } else {
      texte(pg, ligneDate, E.l2.x, h - E.l2.dh, { police:F.light, taille:PAP.taille, couleur:C.G });
    }
  };
  const pied = (pg, ori) => {
    const B = PAP.pied.bande, T = PAP.pied[ori].traits;
    pg.drawPage(piedBande[ori], { x:B.left, y:B.bottom });
    if(T) T.x.forEach(s => ligne(pg, s[0], T.y, s[1], T.y));
  };
  const logo = (pg, ori, premiere) => {
    const L = PAP.logo, w = pg.getWidth();
    const pos = ori === 'paysage' ? { x:w - L.paysage.dx, y:L.paysage.y } : { x:L.portrait.x, y:L.portrait.y };
    pg.drawPage(premiere ? logoNoir : logoGris, pos);
  };
  const numeroter = (pg, n, tot) => {
    const N = PAP.numero, w = pg.getWidth();
    texte(pg, String(n), w - N.dxN, N.y, { police:F.light, taille:PAP.taille, couleur:C.N, align:'d' });
    texte(pg, String(tot), w - N.dxT, N.y, { police:F.light, taille:PAP.taille, couleur:C.N });
    ligne(pg, w - N.trait.dx, N.trait.y0, w - N.trait.dx, N.trait.y1);
  };
  const zoneDe = (ori) => { const z = PAP.zone[ori]; return { x0:z.x0, x1:z.x1, haut:z.haut, bas:z.bas, basMin:z.basMin, l:z.x1 - z.x0, h:z.haut - z.bas }; };
  const tracerZone = (pg, ori) => {
    const Z = zoneDe(ori), g = rgb(0.6,0.6,0.6);
    rect(pg, Z.x0, Z.bas, Z.l, Z.h, { bord:g, tirets:[2,2] });
    /* NB : la flèche « → » n'existe pas dans Akkurat LL TT (rendue vide) : tiret demi-cadratin */
    const s = 'Zone utile ' + ori + ' : x ' + Z.x0.toFixed(2) + ' – ' + Z.x1.toFixed(2) + ' · y ' + Z.bas.toFixed(2) + ' – ' + Z.haut.toFixed(2);
    texte(pg, s, Z.x0 + 4, Z.haut - 10, { police:F.light, taille:7.5, couleur:g });
  };

  /* ── A7. Objet ctx — API laissée au graphiste ──
     ctx.PDFLib, ctx.doc (PDFDocument), ctx.R, ctx.rep, ctx.o
     ctx.F = { light, regular, bold, lightItalic } (PDFFont) ; ctx.C = couleurs rgb() { N, G, B, R, repere } ; ctx.PAP = constantes
     ctx.pages = [{ page, orientation, Z }] ; ctx.page / ctx.orientation / ctx.Z = page courante et sa zone utile
       Z = { x0, x1, haut, bas, basMin, l (largeur), h (hauteur) }
     ctx.y = ligne courante (pt, origine en bas), remise à Z.haut par nouvellePage
     ctx.nouvellePage(orientation) → PDFPage : 'portrait' (défaut) | 'paysage' ; pose en-tête, pied, logo (noir si 1re page)
     ctx.assurer(h) → true si une page a été ajoutée : s'il reste moins de h pt entre ctx.y et Z.bas, nouvelle page de même orientation
     ctx.texte(t, x, y, { police, taille (8), couleur, align:'g'|'d'|'c' }) → largeur dessinée (page courante ; ctx.texteSur(pg,…))
     ctx.ligne(x0, y0, x1, y1, { ep ≤ 0.25, couleur, tirets }) ; ctx.rect(x, y, w, h, { fond, bord, ep, tirets })
     ctx.largeur(t, police, taille) ; ctx.couper(t, police, taille, largeurMax) → [lignes] ; ctx.maj(s) ; ctx.nettoyer(s)
       (texte, largeur et couper appliquent le repli de glyphes, voir A5 ; ctx.aGlyphe(police, codePoint) → booléen)
     ctx.orientationSection(section) → 'portrait' | 'paysage' (d'après rep.pageTemplates[].page.w/h)
     ctx.dateFR(d) → « 25 OCTOBRE 2026 » ; ctx.alerte(message) → o.journal
     La numérotation « n | total » est posée par sgDsPdf APRÈS contenu(ctx) : ne pas la dessiner. */
  const ctx = {
    PDFLib, doc, R, rep, o, F, C, PAP, titre:titreBrut,
    pages: [], page: null, orientation: null, Z: null, y: 0,
    largeur, couper, maj, nettoyer, dateFR, alerte, aGlyphe,
    texte: (t, x, y, op) => texte(ctx.page, t, x, y, op),
    texteSur: texte,
    ligne: (x0, y0, x1, y1, op) => ligne(ctx.page, x0, y0, x1, y1, op),
    rect: (x, y, w, h, op) => rect(ctx.page, x, y, w, h, op),
    nouvellePage: (ori) => {
      ori = ori === 'paysage' ? 'paysage' : 'portrait';
      const fm = PAP.format[ori];
      const pg = doc.addPage([fm.w, fm.h]);
      /* logo noir : première page du document, ou de chaque exemplaire (o.jobs : une lettre par entreprise…) */
      const premiere = !o.logoGris && ctx.pages.length === (ctx.debutJob || 0);   /* o.logoGris : suite d'un document (cahier de soumission par articles) */
      entete(pg, ori); pied(pg, ori); logo(pg, ori, premiere);
      const Z = zoneDe(ori);
      if(o.zones || o.epreuve) tracerZone(pg, ori);
      ctx.pages.push({ page:pg, orientation:ori, Z, job:ctx.job || 0 });
      ctx.page = pg; ctx.orientation = ori; ctx.Z = Z; ctx.y = Z.haut;
      return pg;
    },
    assurer: (h) => { if(!ctx.page || ctx.y - h < ctx.Z.bas){ ctx.nouvellePage(ctx.orientation || 'portrait'); return true; } return false; },
    orientationSection: (s) => {
      const pts = (rep && rep.pageTemplates) || [];
      const t = pts.find(p => s && p.id === s.pageTemplateId) || null;
      const pg = t && t.page;
      return pg && +pg.w > +pg.h ? 'paysage' : 'portrait';
    }
  };

  /* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
     B. CONTENU — système graphique « Documents Substances » (agent 2, 25.10.2026 ; détail : SYSTEME_GRAPHIQUE.md de l'atelier)
        Chaque bande du document type est lue (structure et texte d'origine), puis remise au graphisme des contrats et factures :
        Akkurat Light 8 / interligne 10 pour le texte, Regular pour l'emphase, Bold 8 capitales pour les titres de chapitre
        (« n° | TITRE » des contrats, trait vertical et filet 0,25), module de 5 mm (14,17 pt) pour les lignes de grilles et de
        tableaux (récapitulatif et annexes du contrat), tableaux paysage en 7 pt sur 4 mm (annexe 2 du contrat), bloc destinataire
        de la facture (x 368,6), filets 0,25 pt seulement. Les champs sans valeur sont des repères « ‹ libellé › » en Light Italic
        gris (dictionnaire SG_DS_CHAMPS) ; titre du document, dates du jour, titre de section et numéros de page sont remplis.
        Déroulement : bandes → blocs (hauteur, espace avant, « garder avec le suivant », dessin) → pagination (en-têtes de tableau
        répétés, aucun titre orphelin, rien sous la zone utile) → dessin page par page (le total des pages est alors connu).
        Texte identique (relecture de l'agent 3, 25.10.2026) : chaque document montre les textes fixes que l'impression du moteur
        (svDpBands / svDpTable de DeltaSub.html) montrerait, dans le même ordre — titre de colonne personnalisé vide → nom de la
        colonne ; cellules en surnombre d'une grille imprimées seulement là où le moteur leur laisse de la place ; colonne sans
        largeur non imprimée ; sections masquées omises. Vérifié sur les 163 documents par le banc de contrôle de l'atelier
        (docsub/sorties/3_relecture/outils : banc3.js, analyser.py).
     ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

  /* ── B1. Libellés français des champs (TextField) : 217 noms, 350 couples (nom, format) relevés dans les 163 documents ──
     Résolution (libelleChamp) : couples['nom|format'] → rôle d'adresse + format d'adresse → utilisateur + format d'utilisateur →
     format propre (affaire, offre, séance…) → noms[nom] → nom technique (signalé dans o.journal). */
  const SG_DS_CHAMPS = {
    couples: {
      'projectFeeCalculationTimeAmount|projectFeeCalculationAmountAmount1': 'Honoraires HT',
      'projectFeeCalculationTimeAmount|projectFeeCalculationAmountSubTotal3': 'Honoraires HT',
      'projectFeeCalculationTimeAmount|projectFeeCalculationAmountVatAmount': 'TVA sur les honoraires',
      'projectFeeCalculationTimeAmount|projectFeeCalculationAmountAmount2': 'Honoraires TTC',
      'projectFeeCalculationCostAmount|projectFeeCalculationAmountSubTotal3': 'Frais HT',
      'projectFeeCalculationCostAmount|projectFeeCalculationAmountVatAmount': 'TVA sur les frais',
      'projectFeeCalculationCostAmount|projectFeeCalculationAmountAmount2': 'Frais TTC',
      'homeContact|contactOwnerAndAddress': 'Adresse privée', 'homeContact|contactPhone': 'Téléphone privé',
      'homeContact|contactPhoneMobile': 'Mobile privé', 'homeContact|contactEmail': 'Courriel privé',
      'contactOwner|standard': 'Titulaire',
      'staff|staffInitials': 'Initiales du collaborateur', 'staff|staffJoiningDate': 'Date d’entrée',
      'staff|staffQuittingDate': 'Date de sortie', 'staff|staffSocialSecurityNumber': 'N° AVS', 'staff|staffBirthday': 'Date de naissance',
      '|standard': 'Champ'
    },
    /* rôles des champs d'adresse : [rôle, complément « de … »] (contact = destinataire du document : libellé seul) */
    roles: {
      contact: ['', ''],
      contactContact: ['entreprise', 'de l’entreprise'],
      builderContact: ['maître d’ouvrage', 'du maître d’ouvrage'],
      constructionLocation: ['lieu de dépôt des offres', 'du lieu de dépôt des offres'],
      constructionPlanner: ['mandataire', 'du mandataire'],
      leader: ['animateur de la séance', 'de l’animateur de la séance'],
      person: ['collaborateur', 'du collaborateur'],
      staff: ['collaborateur', 'du collaborateur'],
      projectAddress2: ['adresse de facturation', 'de facturation'],
      projectContact1: ['adresse de l’affaire', 'de l’affaire'],
      projectContact4: ['adresse retour des offres', 'retour des offres'],
      projectContractor: ['entreprise', 'de l’entreprise'],
      projectContractorContact: ['entreprise', 'de l’entreprise'],
      projectContractorResponsible: ['responsable de l’entreprise', 'du responsable de l’entreprise'],
      projectmanagementBuilderBySuproject: ['maître d’ouvrage de la subdivision', 'du maître d’ouvrage de la subdivision'],
      projectMemberArchitect: ['architecte', 'de l’architecte'],
      projectMemberArchitectContact: ['architecte', 'de l’architecte'],
      projectMemberArchitectResponsible: ['responsable de l’architecte', 'du responsable de l’architecte'],
      projectMemberBuilder: ['maître d’ouvrage', 'du maître d’ouvrage'],
      projectMemberBuilderContact: ['maître d’ouvrage', 'du maître d’ouvrage'],
      projectMemberBuilderResponsible: ['responsable du maître d’ouvrage', 'du responsable du maître d’ouvrage'],
      projectMemberBuilderConsultantStandbyContact: ['représentant du maître d’ouvrage', 'du représentant du maître d’ouvrage'],
      projectMemberBuilderConsultantStandbyResponsible: ['responsable du représentant du MO', 'du responsable du représentant du MO'],
      projectMemberConstructionManager: ['direction des travaux', 'de la direction des travaux'],
      projectMemberConstructionManagerContact: ['direction des travaux', 'de la direction des travaux'],
      projectMemberConstructionManagerResponsible: ['responsable de la direction des travaux', 'du responsable de la direction des travaux'],
      projectMemberCostPlannerContact: ['planificateur des coûts', 'du planificateur des coûts'],
      projectMemberCostPlannerResponsible: ['responsable de la planification des coûts', 'du responsable de la planification des coûts'],
      projectMemberProjectManager: ['direction de projet', 'de la direction de projet'],
      projectMemberProjectManagerContact: ['direction de projet', 'de la direction de projet'],
      projectMemberProjectManagerResponsible: ['responsable de la direction de projet', 'du responsable de la direction de projet'],
      recipient: ['destinataire', 'du destinataire'],
      recordingSecretary: ['rédacteur du procès-verbal', 'du rédacteur du procès-verbal'],
      responsibleContact: ['responsable', 'du responsable'],
      supplierContact: ['mandataire', 'du mandataire']
    },
    /* formats d'adresse (doc.reports.fields.FieldStyles) */
    adresse: {
      contactAddress: 'Adresse', contactOwnerAndAddress: 'Nom et adresse', contactAddressSingleLine: 'Adresse sur une ligne',
      contactAddressDoubleLine: 'Adresse sur deux lignes', contactShortForm: 'Nom abrégé', contactFirstnameAndName: 'Prénom et nom',
      contactFirstname: 'Prénom', contactName: 'Nom', contactSalutation: 'Formule d’appel', contactFormOfAddress: 'Civilité',
      contactPhone: 'Téléphone', contactPhoneMobile: 'Mobile', contactFax: 'Fax', contactEmail: 'Courriel',
      contactInternet: 'Site internet', contactLocation: 'Localité', contactPostalcodeAndLocation: 'NPA et localité',
      contactRemark: 'Remarque', contactOwnerName: 'Nom complet', contactOwnerName1: 'Nom', contactOwnerName2: 'Prénom',
      contactOwnerUid: 'N° IDE', contactOwnerRemark: 'Remarque'
    },
    /* formats d'utilisateur et compléments selon le champ */
    utilisateur: { userName: 'Nom', userEmail: 'Courriel', userPhoneNumber: 'Téléphone', userJobFunction: 'Fonction', userJobTitle: 'Titre' },
    utilisateurs: { appUser: 'de l’utilisateur', user: 'du rédacteur', staff: 'du collaborateur' },
    /* formats propres (affaire, contrat, offre d'honoraires, séance, subdivision) */
    formats: {
      projectNumberAndTitle: 'N° et désignation de l’affaire', projectNumber: 'N° d’affaire', projectTitle: 'Désignation de l’affaire',
      projectCurrency: 'Monnaie', projectStartOfConstruction: 'Début des travaux', projectEndOfConstruction: 'Fin des travaux',
      projectMoveInDeadline: 'Date d’emménagement', projectStartDate: 'Début du projet', projectEndDate: 'Fin du projet',
      projectStartOfPlanning: 'Début de la planification', projectEndOfPlanning: 'Fin de la planification',
      projectBaseIndex: 'Indice de base', projectDescription: 'Description de l’affaire',
      projectContractNumber: 'N° du contrat d’honoraires', projectContractName: 'Contrat d’honoraires',
      projectFeeName: 'Offre d’honoraires', projectFeeNumber: 'N° de l’offre d’honoraires', projectFeeChangedDate: 'Date de l’offre d’honoraires',
      projectFeeSupplierDesc: 'Type de prestations', projectFeeCalculationTitle: 'Titre du calcul d’honoraires',
      projectFeeCalculationChangedDate: 'Date du calcul d’honoraires', projectFeeCalculationNumber: 'N° du calcul d’honoraires',
      subProjectCode: 'Code de la subdivision', meetingSequenceNumber: 'N° de la série de séances',
      meetingSequenceSubject: 'Objet de la série de séances'
    },
    /* noms (format « standard » ou de date) */
    noms: {
      accountingPeriod: 'Période facturée', addendumDate: 'Date de l’avenant', amount: 'Montant', amountTotal: 'Montant total',
      appUserSignature: 'Signature de l’utilisateur', userSignature: 'Signature de l’utilisateur',
      balance: 'Solde', bkp: 'CFC', bkpNumber: 'N° CFC', bkpText: 'Libellé CFC',
      calculationFactorsAmountB: 'Coût de l’ouvrage déterminant (B)', calculationFactorsAmountTm: 'Temps moyen (Tm)',
      calculationFactorsAverageTimeRate: 'Taux horaire moyen', calculationFactorsFactorN: 'Degré de difficulté (n)',
      calculationFactorsFactorP: 'Facteur de base pour le temps (p)', calculationFactorsFactorQ: 'Part de prestations (q)',
      calculationFactorsFactorR: 'Facteur d’ajustement (r)', calculationFactorsFactorU: 'Facteur de transformation (U)',
      calculationFactorsValueZ1: 'Coefficient Z1', calculationFactorsValueZ2: 'Coefficient Z2',
      changedDate: 'Date de modification', chargeableFilter: 'Filtre : facturable', chargedFilter: 'Filtre : facturé',
      constructionAbgebotDate: 'Date de l’offre négociée', constructionAddendumNumber: 'N° de l’avenant',
      constructionAwardPaymentDifference: 'Solde à payer avant le paiement',
      constructionBankAccountBuildingOwner: 'Compte bancaire du maître d’ouvrage', constructionBankAccountEntrepreneur: 'Compte bancaire de l’entreprise',
      constructionBankAddrBuildingOwner: 'Adresse de la banque du maître d’ouvrage', constructionBankAddrEntrepreneur: 'Adresse de la banque de l’entreprise',
      constructionBankContactBuildingOwner: 'Contact bancaire du maître d’ouvrage', constructionBankNameEntrepreneur: 'Banque de l’entreprise',
      constructionBestOfferAmount: 'Montant de la meilleure offre', constructionBidOpeningDate: 'Date d’ouverture des offres',
      constructionContractNumber: 'N° du contrat', constructionCostcontrolDescriptor: 'Description',
      constructionCostEstimateAccuracy: 'Précision de l’estimation', constructionCostEstimateProjectState: 'Stade du projet',
      constructionDateOfRemittance: 'Date de l’ordre de paiement', constructionEstimateSummary: 'Montant du devis',
      constructionGuarantyBeginDate: 'Début de la garantie', constructionGuarantyEndDate: 'Fin de la garantie',
      constructionGuarantyKind: 'Genre de garantie', constructionGuarantyValue: 'Montant de la garantie',
      constructionIbanBuildingOwner: 'IBAN du maître d’ouvrage', constructionIbanEntrepreneur: 'IBAN de l’entreprise',
      constructionIndex: 'Indice', constructionInputDate: 'Date de dépôt des offres', constructionInputTime: 'Heure de dépôt des offres',
      constructionInternalVersionNr: 'N° de version', constructionNumberOfOrders: 'Nombre d’ordres',
      constructionNumberOfRemittance: 'N° de l’ordre de paiement', constructionOfferDate: 'Date de l’offre',
      constructionOfferKind: 'Genre d’offre', constructionOfferNumber: 'N° de l’offre', constructionOrderSummary: 'Total contrat et avenants',
      constructionPlanningStatus: 'État de la planification', constructionPriceIndex: 'Indice des prix',
      constructionRemittanceSummary: 'Total de l’ordre de paiement', constructionRevBidDate: 'Date de l’offre révisée',
      constructionStartWorkPreparation: 'Début de la préparation', constructionTotalAfterRemittance: 'Total des paiements après le paiement',
      constructionTotalBeforeRemittance: 'Total des paiements avant le paiement', constructionTotalOpenAfterRemittance: 'Solde à payer après le paiement',
      constructionValutaDate: 'Date de valeur', constructionWorkBegin: 'Début des travaux', constructionWorkEnd: 'Fin des travaux',
      constructionYourOfferRang: 'Rang de votre offre', content: 'Contenu', contractAmount: 'Montant du contrat TTC',
      contractAmountExcludedVat: 'Montant du contrat HT', contractAmountVat: 'TVA du contrat', contractAndAddendumSum: 'Total contrat et avenants',
      contractDate: 'Date du contrat', contractSum: 'Montant du contrat', contractType: 'Type de contrat',
      costPlanReferenzSysem: 'Système de référence', cumulativeBalanceTargetTimeIncluded: 'Solde cumulé (heures dues comprises)',
      currency: 'Monnaie', currentHeader: 'En-tête courant', date: 'Date', deadline: 'Échéance', deductionDate: 'Date de la retenue',
      deductionNumber: 'N° de la retenue', description: 'Description', devisBkpNumber: 'N° CFC', devisBkpText: 'Libellé CFC',
      docDate: 'Date du document', docTitle: 'Titre du document', doneDate: 'Date de réalisation', dueDate: 'Date d’échéance',
      entrepreneurInformation: 'Informations sur l’entreprise', estimateDate: 'Date de l’estimation', filterDesc: 'Filtre',
      goal: 'Objectif', invoiceDate: 'Date de facture', isDoneFilter: 'Filtre : statut réglé', itemCategoryFilter: 'Filtre : catégorie',
      itemIdFilter: 'Filtre : catégorie libre', location: 'Lieu', meetingDate: 'Date de la séance', meetingFilter: 'Filtre : genre',
      meetingNumber: 'N° de la séance', minutesDate: 'Date du procès-verbal', month: 'Mois', mutationsDate: 'Date de la mutation',
      mutationsDescription: 'Description de la mutation', mutationsKind: 'Genre de mutation', mutationsNumber: 'N° de la mutation',
      mutationsState: 'État de la mutation', mutationsTotal: 'Total de la mutation', name: 'Désignation', note: 'Remarque',
      number: 'Numéro', owner: 'Auteur', period: 'Période', previousAddendumSum: 'Total des avenants précédents',
      priceComparisonCriterias: 'Critères d’évaluation', projectContractAddendumSummary: 'Total des avenants',
      projectContractNumber: 'N° du contrat', projectContractSummary: 'Montant du contrat', projectInvoiceDate: 'Date de facture',
      projectInvoiceNumber: 'N° de facture', projectPaymentDate: 'Date du paiement', projectPaymentNumber: 'N° du paiement',
      projectPreviousPayementSummary: 'Total des paiements précédents', projectStateFilter: 'Filtre : état des affaires',
      recipientFilter: 'Filtre : destinataire', referenceMonth: 'Mois de référence', reportDate: 'Date', reportFilter: 'Filtre',
      reportingDate: 'Date de référence', reportTitle: 'Titre du document', reportYear: 'Année', sectionTitle: 'Titre de la section',
      staffHolidayBalance: 'Solde de vacances', staffHolidayBalanceDate: 'Date du solde de vacances', staffHolidayPerYear: 'Vacances par année',
      staffHolidaySpentInReportMonth: 'Vacances prises dans le mois', staffHolidaySpentInReportYear: 'Vacances prises dans l’année',
      staffNewHolidayBalance: 'Nouveau solde de vacances', staffTargetTimeReduction: 'Réduction des heures dues', startDate: 'Date de début',
      subject: 'Objet', subPhaseFilterDesc: 'Filtre : phases partielles', subproject: 'Subdivision', subProjectFilterDesc: 'Filtre : subdivisions',
      subprojectText: 'Libellé de la subdivision', supplierDesc: 'Type de prestations', targetTime: 'Heures dues', taskPriority: 'Priorité',
      taskState: 'État', termsOfPayment: 'Conditions de paiement', timeFilter: 'Filtre : période', timeFrom: 'Heure de début',
      timeHour: 'Nombre d’heures', timePeriod: 'Période', timeTo: 'Heure de fin', toBkp: 'CFC de destination', total: 'Total',
      totalAmount: 'Montant total', totalRefundable: 'Total remboursable', totalStaffAmount: 'Total des collaborateurs',
      totalTimePeriod: 'Total de la période', totalToPay: 'Total à payer', userName: 'Utilisateur', userNameFilter: 'Filtre : participant',
      weekOfYear: 'Semaine', year: 'Année', pageNumber: 'N° de page', nofPages: 'Nombre de pages',
      contactOwner: 'Titulaire'
    },
    /* libellés abrégés, employés seulement quand le libellé d'un repère d'un seul mot ne tient pas dans sa colonne ; toujours un
       LIBELLÉ, jamais une valeur (« CHF » ressemblerait à une donnée) */
    courts: { 'project|projectCurrency': 'Mon.', 'currency|standard': 'Mon.' },
    /* titres de colonnes variables (flexColumn) montrés comme repères */
    colonnes: { FlexColumn: 'Colonnes variables', 'Beträge': 'Montants' }
  };
  const champsNonTrouves = new Set();
  const majuscule1 = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const libelleChamp = (n, s) => {
    const D = SG_DS_CHAMPS; s = s || 'standard';
    const cp = D.couples[n + '|' + s]; if(cp) return cp;
    const ro = Object.prototype.hasOwnProperty.call(D.roles, n) ? D.roles[n] : null;
    if(ro && D.adresse[s]){
      if(s === 'contactShortForm' && ro[0]) return majuscule1(ro[0]);
      return ro[1] ? D.adresse[s] + ' ' + ro[1] : D.adresse[s];
    }
    if(D.utilisateur[s] && D.utilisateurs[n]) return D.utilisateur[s] + ' ' + D.utilisateurs[n];
    if(D.formats[s]) return D.formats[s];
    if(D.noms[n]) return D.noms[n];
    if(ro && ro[0]) return majuscule1(ro[0]);
    if(!champsNonTrouves.has(n + '|' + s)){ champsNonTrouves.add(n + '|' + s); alerte('Champ sans libellé français : ' + n + ' (' + s + ')'); }
    return n || 'Champ';
  };

  /* ── B2. Système graphique (points ; MM = 1 mm) ── */
  const SYS = {
    module: 14.17,                      /* 5 mm : pas des lignes de grilles et tableaux portrait (récapitulatif, annexes 1 et 3, tarifs du contrat) */
    base: 4.3,                          /* ligne de base au-dessus du bas d'une ligne de module (contrat : 4.27 – 4.32) */
    chap: { trait: 36.85, texte: 45.35, base: 4.42 },   /* chapitre « n° | TITRE » : trait vertical à x0 + 36.85, titre à x0 + 45.35 */
    retrait: 45.35,                     /* retrait des bandes décalées (ml 20 à 80 mm) = colonne du texte des contrats (130.39 − 85.04) */
    tab: {
      portrait: { taille: 8, tete: 7.5, pas: 14.17, base: 4.3 },      /* facture p. 2, contrat : récapitulatif, annexe 3 */
      paysage:  { taille: 7, tete: 7, pas: 11.34, base: 3.5 }         /* annexe 2 du contrat (page 10) : 7 pt, 4 mm */
    },
    pad: 4,                             /* retrait du texte aux bords d'un tableau (facture p. 2 : 128.9 / filet 124.89) */
    gout: 2.5,                          /* demi-gouttière entre deux colonnes */
    dest: { dx: 141.64, haut: 692.3, base1: 684.8, pas: 14, taille: 7.5, largeur: 196, trait: 8, traitDy: 4.4, lignesMin: 4 },
    lignesVides: 3,                     /* lignes vides (filets) d'un tableau sans données */
    ecartMax: 10,                       /* écart maximal entre deux paragraphes = une ligne blanche des contrats */
    signature: 28.35                    /* place réservée à une image de signature (10 mm) */
  };
  /* hiérarchie : textFont des documents types → police / corps / interligne Substances */
  const ST = {
    title:        { f: F.bold,    sz: 8,   lh: 10,   maj: true, niv: 'chapitre' },
    subTitle:     { f: F.regular, sz: 8,   lh: 10,   niv: 'sous' },
    text:         { f: F.light,   sz: 8,   lh: 10 },
    textBold:     { f: F.regular, sz: 8,   lh: 10 },
    small:        { f: F.light,   sz: 7.5, lh: 9.4 },
    smallBold:    { f: F.regular, sz: 7.5, lh: 9.4 },
    large:        { f: F.light,   sz: 8,   lh: 10 },
    largeBold:    { f: F.bold,    sz: 8,   lh: 10,   niv: 'grand' },
    pageSide:     { f: F.light,   sz: 7.5, lh: 9.4 },
    pageSideBold: { f: F.regular, sz: 7.5, lh: 9.4 }
  };
  const styleDe = (k) => ST[k] || ST.text;
  const so = (a, b) => (+a.sortOrder || 0) - (+b.sortOrder || 0);
  /* liste d'un modèle : un tableau, sinon vide (modèle incomplet ou mal formé : jamais d'erreur) */
  const tab = (x) => Array.isArray(x) ? x : [];
  const mmPt = (v) => Math.max(0, +v || 0) * MM;
  /* retrait d'une bande : < 20 mm tel quel, 20 à 80 mm → colonne du texte des contrats */
  const retraitDe = (ml) => { ml = +ml || 0; return ml <= 0 ? 0 : (ml < 20 ? ml * MM : SYS.retrait); };
  /* bordure d'origine visible seulement si des côtés ET une couleur sont donnés (RectangleStyle.isBorderVisible) */
  const bordure = (rs) => { const b = rs && rs.b && rs.bc != null ? String(rs.b) : ''; return { t: b.indexOf('t') >= 0, b: b.indexOf('b') >= 0, l: b.indexOf('l') >= 0, r: b.indexOf('r') >= 0 }; };
  /* d = distance du haut d'une ligne de pas « pas » à sa première ligne de base (module 14.17, interligne 10 → 9.87) */
  const dBase = (pas, lh) => (pas - lh) / 2 + 0.7785 * lh;

  /* ── B3. Texte des bandes : chaînes et champs → morceaux { t, rep (repère), page ('n' | 't') } ── */
  const JOURS = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
  const MOIS_L = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  const MOIS_C = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
  const dateTexte = (s) => {
    /* FieldStyles.getDateString (fr_CH) : standard / dateMedium « 25 oct. 2026 », dateShort « 25.10.26 », dateLong, dateFull */
    const d = laDate(o.date), j = d.getDate(), m = d.getMonth(), a = d.getFullYear();
    if(s === 'dateFull') return JOURS[d.getDay()] + ', ' + j + ' ' + MOIS_L[m] + ' ' + a;
    if(s === 'dateLong') return j + ' ' + MOIS_L[m] + ' ' + a;
    if(s === 'dateShort') return String(j).padStart(2, '0') + '.' + String(m + 1).padStart(2, '0') + '.' + String(a).slice(2);
    return j + ' ' + MOIS_C[m] + ' ' + a;
  };
  /* espaces insécables (U+00A0, U+202F) → espace ordinaire (décision du 25.10.2026) ; caractères de mise en forme invisibles à
     l'impression (trait d'union conditionnel U+00AD, espace sans chasse U+200B, U+2060, U+FEFF) retirés — dessinés, ils
     deviendraient visibles ; puis nettoyer() du papier. Un caractère qu'aucune des quatre polices ne contient (il serait
     invisible) est signalé dans o.journal, une fois par caractère */
  const sansGlyphe = new Set(), POLICES = [F.light, F.regular, F.bold, F.lightItalic];
  const prep = (s) => {
    const t = nettoyer(String(s == null ? '' : s).normalize('NFC').replace(/[\u00A0\u202F]/g, ' ').replace(/[\u00AD\u200B\u2060\uFEFF]/g, ''));   /* accents décomposés (e + accent) recomposés : les polices n'ont que les lettres accentuées */
    for(const c of t){
      const cp = c.codePointAt(0);
      if(cp > 32 && !sansGlyphe.has(cp) && !POLICES.some(f => aGlyphe(f, cp))){
        sansGlyphe.add(cp); alerte('Glyphe « ' + c + ' » (U+' + cp.toString(16).toUpperCase().padStart(4, '0') + ') absent des quatre polices : invisible');
      }
    }
    return t;
  };
  const morceauxTexte = (t, env) => {
    const out = [];
    tab(t && t.ts).forEach(x => {
      if(!x) return;
      if(x.class === 'TextString'){ const s = prep(x.text); if(s) out.push({ t: s }); return; }
      if(x.class !== 'TextField') return;
      const f = String(x.f || ''), n = f.slice(f.lastIndexOf('|') + 1), s = x.s || 'standard';
      const J = env && env.job;
      if(n === 'reportTitle'){ out.push({ t: J && J.titreChamp != null ? prep(J.titreChamp) : titreBrut }); return; }
      if(n === 'date' || n === 'reportDate'){ const v = J && J.V ? J.V[f + '\u0001' + s] : null; out.push({ t: v != null && v !== '' ? prep(v) : dateTexte(s) }); return; }
      if(n === 'sectionTitle' && env && env.section && env.section.title){ out.push({ t: prep(env.section.title) }); return; }
      if(n === 'pageNumber'){ out.push({ t: '', page: 'n' }); return; }
      if(n === 'nofPages'){ out.push({ t: '', page: 't' }); return; }
      /* exemplaire avec données (B7) : valeur du champ mise en forme par le moteur (svFmtVal), rien si elle est vide */
      if(J){ const v = J.V ? J.V[f + '\u0001' + s] : null; if(v != null && v !== '') out.push({ t: prep(v), val: true }); return; }
      out.push({ t: '‹ ' + libelleChamp(n, s) + ' ›', rep: true, court: SG_DS_CHAMPS.courts[n + '|' + s] || null });
    });
    /* fin du texte : espaces et sauts de ligne de fin retirés (invisibles) */
    while(out.length && !out[out.length - 1].rep && !out[out.length - 1].page){
      const l = out[out.length - 1]; l.t = l.t.replace(/\s+$/, ''); if(l.t) break; out.pop();
    }
    return out;
  };
  const estVide = (ms) => !ms.some(m => m.rep || m.page || /\S/.test(m.t));
  /* montant (B7) : nombre à deux décimales tel que le moteur l'écrit (num : « 1'234.50 », « -12.00 », « (0.05) »), non nul */
  const montant = (p) => /^\(?[-−]?\d+(?:['’]\d{3})*(?:\.\d{2}|\.[-–])\)?$/.test(p) && /[1-9]/.test(p);   /* « 6'500.- » des contrats de travail aussi */
  /* découpe en paragraphes aux sauts de ligne (pour l'écart des WrappingTextBand) */
  const paragraphes = (ms) => {
    const P = [[]];
    ms.forEach(m => {
      if(m.rep || m.page){ P[P.length - 1].push(m); return; }
      m.t.split('\n').forEach((p, i) => { if(i) P.push([]); if(p) P[P.length - 1].push({ t: p }); });
    });
    return P;
  };

  /* ── B4. Composition : retour au mot sur plusieurs polices (texte, repères), sauts de ligne d'origine conservés ── */
  const jetons = (ms, st) => {
    const out = [];
    ms.forEach(m => {
      if(m.page){ out.push({ t: '00', f: st.f, sz: st.sz, c: C.N, page: m.page, w: largeur('00', st.f, st.sz) }); return; }
      if(m.rep){
        /* repère : un jeton par mot, chevrons collés au premier et au dernier mot (retour à la ligne entre les mots seulement) */
        const f = F.lightItalic, mots = m.t.replace(/^‹ /, '').replace(/ ›$/, '').split(' '), z = mots.length - 1;
        mots.forEach((x, i) => {
          if(i) out.push({ t: ' ', f, sz: st.sz, c: C.repere, w: largeur(' ', f, st.sz), esp: true, rep: true });
          const t = (i === 0 ? '‹ ' : '') + x + (i === z ? ' ›' : '');
          out.push({ t, f, sz: st.sz, c: C.repere, w: largeur(t, f, st.sz), rep: true, court: z === 0 ? m.court : null });
        });
        return;
      }
      const t = st.maj ? m.t.toUpperCase() : m.t;
      const P = t.split(/(\n| +)/);
      P.forEach((p, i) => {
        if(!p) return;
        if(p === '\n'){ out.push({ nl: true }); return; }
        /* montant d'un champ rempli (B7) : rouge des contrats, Akkurat Regular (prestations exécutées du récapitulatif) ; un nombre
           suivi de « h » (heures) n'est pas un montant */
        if(m.val && montant(p) && !/^(h|heures?)$/i.test(P.slice(i + 1).find(x => x && !/^ +$/.test(x)) || '')){ out.push({ t: p, f: F.regular, sz: st.sz, c: C.R, w: largeur(p, F.regular, st.sz) }); return; }
        out.push({ t: p, f: st.f, sz: st.sz, c: st.c || C.N, w: largeur(p, st.f, st.sz), esp: /^ +$/.test(p) });
      });
    });
    return out;
  };
  /* mot plus large que sa colonne : coupures permises après un trait d'union intérieur (« prévus-|Honoraires »), comme le
     navigateur du moteur ; aucune autre coupure, aucun caractère ajouté. Réservé aux mots qui ne tiennent pas seuls sur une
     ligne : les retours à la ligne des mots qui tiennent ne changent pas */
  const partiesTrait = (k) => {
    if(k.rep || k.esp || k.page || k.nl || !/\S-\S/.test(k.t)) return null;
    const P = k.t.replace(/(\S-)(?=\S)/g, '$1\u0000').split('\u0000');
    return P.length > 1 ? P.map(t => Object.assign({}, k, { t, w: largeur(t, k.f, k.sz) })) : null;
  };
  const composer = (ms, st, maxW, opt) => {
    maxW = Math.max(4, maxW); const coupe = !(opt && opt.coupe === false);
    const L = [[]]; let w = 0, debut = true;
    const ferme = () => { const l = L[L.length - 1]; while(l.length && l[l.length - 1].esp){ w -= l.pop().w; } };
    const nouvelle = () => { ferme(); L.push([]); w = 0; };
    const J = [];
    jetons(ms, st).forEach(k => { const p = k.w > maxW + 0.01 ? partiesTrait(k) : null; if(p) p.forEach(x => J.push(x)); else J.push(k); });
    J.forEach(k0 => {
      let k = k0;
      if(k.nl){ nouvelle(); debut = true; return; }
      const l = L[L.length - 1];
      if(k.esp){ if(!l.length && !debut) return; l.push(k); w += k.w; return; }
      if(w + k.w <= maxW + 0.01){ l.push(k); w += k.w; debut = false; return; }
      if(l.some(x => !x.esp)) nouvelle(); else { l.length = 0; w = 0; }
      if(k.rep && k.w > maxW){
        /* mot d'un repère plus long que la colonne : libellé abrégé du dictionnaire s'il y en a un (« ‹ Mon. › »), puis corps
           réduit (6,5 pt au moins, comme les autres textes), puis, en dernier recours, mot tronqué proprement (« ‹ Désign… › »,
           signalé) — jamais coupé sur deux lignes, jamais remplacé par un texte qui ressemblerait à une donnée */
        if(k.court){ const t = '‹ ' + k.court + ' ›'; k = Object.assign({}, k, { t, w: largeur(t, k.f, k.sz) }); }
        let r = k;
        if(r.w > maxW){ const sz = Math.max(6.5, Math.floor(k.sz * maxW / k.w * 20) / 20); r = Object.assign({}, k, { sz, w: largeur(k.t, k.f, sz) }); }
        if(r.w > maxW + 0.01){
          const g = r.t.startsWith('‹ ') ? '‹ ' : '', d = r.t.endsWith(' ›') ? ' ›' : '';
          const lettres = Array.from(r.t.slice(g.length, r.t.length - d.length));
          while(lettres.length > 1 && largeur(g + lettres.join('') + '…' + d, r.f, r.sz) > maxW) lettres.pop();
          const t = g + lettres.join('') + '…' + d;
          /* essai silencieux (titre de colonne) : l'alerte n'est donnée que si cette composition est gardée (bandeTableau) */
          if(!(opt && opt.silence)) alerte('Mise en page : repère « ' + k.t + ' » tronqué en « ' + t + ' »');
          r = Object.assign({}, r, { t, w: largeur(t, r.f, r.sz), tronque: k.t });
          if(r.w > maxW + 0.5 && !(opt && opt.silence)) alerte('Mise en page : repère « ' + t + ' » plus large que sa colonne');
        }
        L[L.length - 1].push(r); w = r.w;
      } else if(k.w > maxW && !coupe){
        /* en-tête de tableau : un mot n'est jamais coupé (il dépasse plutôt de sa colonne) */
        L[L.length - 1].push(k); w = k.w;
        if(!(opt && opt.silence)) alerte('Mise en page : mot « ' + k.t + ' » plus large que sa colonne');
      } else if(k.w > maxW){
        /* mot plus long que la colonne : coupé à la lettre (dernier recours) */
        alerte('Mot coupé à la lettre : « ' + k.t + ' »');
        let mo = '';
        for(const ch of k.t){
          if(mo && largeur(mo + ch, k.f, k.sz) > maxW){ L[L.length - 1].push(Object.assign({}, k, { t: mo, w: largeur(mo, k.f, k.sz) })); nouvelle(); mo = ch; }
          else mo += ch;
        }
        const r = Object.assign({}, k, { t: mo, w: largeur(mo, k.f, k.sz) }); L[L.length - 1].push(r); w = r.w;
      } else { L[L.length - 1].push(k); w = k.w; }
      debut = false;
    });
    ferme();
    return L.map(l => ({ j: l, w: l.reduce((a, x) => a + x.w, 0) }));
  };
  /* composition d'une cellule étroite : si un mot du texte ne tient pas dans la colonne, corps réduit jusqu'à « min » pt
     (en-têtes de tableau, cellules de grille) plutôt que de couper le mot */
  const composerAjuste = (ms, st, maxW, min, opt) => {
    const large = jetons(ms, st).filter(k => !k.nl && !k.esp && !k.rep).reduce((a, k) => {
      const p = k.w > maxW + 0.01 ? partiesTrait(k) : null;
      return Math.max(a, p ? p.reduce((m, x) => Math.max(m, x.w), 0) : k.w); }, 0);
    if(large > maxW + 0.01 && st.sz > min){
      const sz = Math.max(min, Math.floor(st.sz * maxW / large * 20) / 20);
      st = Object.assign({}, st, { sz, lh: st.lh * sz / st.sz });
    }
    return { lignes: composer(ms, st, maxW, opt), st };
  };
  /* dessine une ligne composée entre x0 et x1 (alignement left | right | center) ; numéros de page remplis au dessin */
  const poser = (pg, ln, x0, x1, y, ha, info) => {
    const J = ln.j.map(k => k.page ? Object.assign({}, k, { t: String(k.page === 'n' ? info.n : info.tot), w: largeur(String(k.page === 'n' ? info.n : info.tot), k.f, k.sz) }) : k);
    const w = J.reduce((a, x) => a + x.w, 0);
    let x = ha === 'right' ? x1 - w : (ha === 'center' ? (x0 + x1 - w) / 2 : x0);
    let i = 0;
    while(i < J.length){
      const k = J[i]; let t = k.t, ww = k.w, j = i + 1;
      while(j < J.length && J[j].f === k.f && J[j].c === k.c && J[j].sz === k.sz){ t += J[j].t; ww += J[j].w; j++; }
      if(/\S/.test(t)) texte(pg, t, x, y, { police: k.f, taille: k.sz, couleur: k.c });
      x += ww; i = j;
    }
  };
  const filet = (pg, x0, y, x1) => ligne(pg, x0, y, x1, y);

  /* ── B5. Bandes → blocs { h, avant, garder (avec le suivant), dessiner(page, yHaut, info), tete, saut, yFixe } ── */
  const largeurs = (cols, W) => {
    /* svWidths du moteur : pw fixes (mm), colonnes isAE élargies au prorata ; trop large → réduction proportionnelle */
    const pw = c => Math.max(0, +c.pw || 0) * MM;
    const fix = cols.filter(c => !c.isAE).reduce((a, c) => a + pw(c), 0);
    const ae = cols.filter(c => c.isAE), aeS = ae.reduce((a, c) => a + pw(c), 0), rest = W - fix;
    if(ae.length && rest > 0) return cols.map(c => c.isAE ? (aeS ? rest * pw(c) / aeS : rest / ae.length) : pw(c));
    const tot = fix + aeS;
    if(tot > W && tot > 0) return cols.map(c => pw(c) * W / tot);
    return cols.map(pw);
  };
  const cumul = (x0, ws) => { const xs = []; let a = x0; ws.forEach(w => { xs.push(a); a += w; }); return xs; };
  const NUMERO = /^(\d+(?:\.\d+)*\.?)[ \t]+(?=\S)/;

  /* GridBand : grille libellé / valeur, titres, signatures */
  const bandeGrille = (b, G) => {
    let cols = tab(b.cols).filter(Boolean); if(!cols.length) return;
    const rows = tab(b.rows).filter(Boolean).slice().sort(so);
    /* cellules en surnombre (données au-delà des colonnes : reliquats de colonnes supprimées, « Text », « - »…) : le moteur
       (svDpBands) les imprime dans des colonnes sans largeur propre, qui se partagent la place laissée par les colonnes déclarées
       (tableau à mise en page fixe). Elles ne sont donc visibles que si aucune colonne n'est extensible (isAE) et que les colonnes
       laissent de la place dans la largeur de la page du modèle : imprimées alors comme des colonnes de cette largeur (texte
       identique), sinon ignorées (largeur nulle dans le moteur) */
    const nSur = rows.reduce((m, r) => Math.max(m, tab(r.data).length), 0) - cols.length;
    if(nSur > 0 && !cols.some(c => c.isAE)){
      const reste = G.Wmod - (+b.ml || 0) - cols.reduce((a, c) => a + (+c.pw || 0), 0);
      if(reste > 0.01) cols = cols.concat(Array.from({ length: nSur }, () => ({ pw: reste / nSur })));
    }
    const ml = retraitDe(b.ml), x0 = G.Z.x0 + ml, W = G.Z.x1 - x0;
    const ws = largeurs(cols, W), xs = cumul(x0, ws), Wt = ws.reduce((a, x) => a + x, 0);
    const sts = cols.map(c => styleDe(c.textFont));
    const niv = sts[0].niv || '';
    const titre = niv === 'chapitre' || niv === 'sous';
    const bd = bordure(b.rs);
    const pd = b.p || {}, pT = mmPt(pd.t), pB = mmPt(pd.b), pL = mmPt(pd.l), pR = mmPt(pd.r);
    const rsp = mmPt(b.rowSpace);
    const liste = cols.length >= 2 && (+cols[0].pw || 0) <= 5 && !cols[0].isAE;
    const n = cols.length, HZ = G.Z.haut - G.Z.bas;
    rows.forEach((r, ri) => {
      let numero = null;
      const cells = cols.map((c, j) => {
        const st = sts[j], d = tab(r.data)[j];
        let ms = morceauxTexte(d, G.env);
        /* colonne sans largeur (pw nul, non extensible) : cellule rognée, donc invisible, dans le moteur — pas imprimée */
        if(ws[j] < 0.5 && !estVide(ms)){ alerte('Grille « ' + (b.name || '') + ' » : texte d’une colonne sans largeur non imprimé'); ms = []; }
        if(j === 0 && titre && ms.length && !ms[0].rep && !ms[0].page && ws[0] > 120){
          const m = NUMERO.exec(ms[0].t);
          if(m){ numero = m[1]; ms = ms.slice(); ms[0] = { t: ms[0].t.slice(m[0].length) }; }
        }
        const gL = j > 0 ? SYS.gout : 0, gR = j < n - 1 ? SYS.gout : 0;
        let cx0 = xs[j] + gL + pL, cx1 = xs[j] + ws[j] - gR - pR;
        if(j === 0 && numero != null) cx0 = xs[0] + SYS.chap.texte;
        const vide = estVide(ms);
        const cp = vide ? { lignes: [], st } : composerAjuste(ms, st, cx1 - cx0, 6.5);
        /* liste à puces (1re colonne ≤ 5 mm) : la puce s'aligne sur la première ligne */
        const va = liste && j === 0 ? 'top' : (c.va || 'top');
        return { st: cp.st, c, cx0, cx1, lignes: cp.lignes, vide, bd: bordure(d && d.rS), ha: c.ha || 'left', va };
      });
      const lh = Math.max.apply(null, cells.map(c => c.st.lh));
      const pas = titre ? SYS.module : (liste ? lh + rsp : Math.max(SYS.module, lh + rsp));
      const ext = Math.max.apply(null, cells.map(c => c.vide ? 0 : (c.lignes.length - 1) * c.st.lh));
      const vide = cells.every(c => c.vide) && !cells.some(c => c.bd.t || c.bd.b);
      const h = vide ? pas / 2 : pas + ext + pT + pB;
      const premier = ri === 0, dernier = ri === rows.length - 1;
      /* filets du haut (première tranche) et du bas (dernière tranche) de la ligne */
      const filetsHaut = (pg, y) => {
        cells.forEach((c, j) => { if(c.bd.t) filet(pg, xs[j], y, xs[j] + ws[j]); });
        if(bd.t && premier) filet(pg, x0, y, x0 + Wt);
      };
      const filetsBas = (pg, bas) => {
        cells.forEach((c, j) => { if(c.bd.b) filet(pg, xs[j], bas, xs[j] + ws[j]); });
        if((bd.b && dernier) || numero != null) filet(pg, x0, bas, x0 + Wt);
      };
      if(h <= HZ){
        /* espaceur : ligne vide qui ne dessine rien (ni texte ni filet) */
        const espace = vide && numero == null && !(bd.b && dernier) && !(bd.t && premier);
        G.out.push({ h, avant: premier ? mmPt(b.mt) : 0, garder: titre, titre, espace,
          dessiner: (pg, y, info) => {
            const bas = y - h;
            /* numéro de chapitre d'abord (ordre de lecture du texte extrait : « 1.1 Description du projet ») */
            if(numero != null){
              const c0 = cells[0], d0 = SYS.module - SYS.chap.base;
              let b0 = y - pT - d0;
              if(c0.va === 'bottom') b0 = bas + pB + SYS.chap.base + (c0.lignes.length - 1) * c0.st.lh;
              poser(pg, composer([{ t: numero }], c0.st, SYS.chap.trait)[0], xs[0], xs[0] + SYS.chap.trait, b0, 'left', info);
              ligne(pg, xs[0] + SYS.chap.trait, bas + 0.25, xs[0] + SYS.chap.trait, y);
            }
            cells.forEach(c => {
              if(!c.vide){
                /* première ligne de base commune à toutes les cellules de la rangée (interligne le plus grand : une cellule en
                   7,5 pt à côté d'une cellule en 8 pt reste sur la même ligne de base) */
                const d0 = titre ? SYS.module - SYS.chap.base : dBase(pas, lh);
                const nl = c.lignes.length, hc = (nl - 1) * c.st.lh;
                let b0 = y - pT - d0;                                         /* haut */
                if(c.va === 'bottom') b0 = bas + pB + (pas - d0) + hc;
                else if(c.va === 'middle') b0 = (y - pT - d0 + bas + pB + (pas - d0) + hc) / 2;
                c.lignes.forEach((ln, i) => poser(pg, ln, c.cx0, c.cx1, b0 - i * c.st.lh, c.ha, info));
              }
            });
            filetsBas(pg, bas); filetsHaut(pg, y);
          } });
        return;
      }
      /* ligne plus haute qu'une page (texte très long dans une cellule) : découpée en tranches d'une ligne, cellules alignées en
         haut, pour continuer sur la page suivante — rien n'est jamais dessiné sous la zone utile */
      const nl = Math.max.apply(null, cells.map(c => c.lignes.length)), marge = (pas - lh) / 2;
      for(let i = 0; i < nl; i++){
        const hi = lh + (i === 0 ? pT + marge : 0) + (i === nl - 1 ? marge + pB : 0);
        G.out.push({ h: hi, avant: i === 0 && premier ? mmPt(b.mt) : 0, garder: i === 0 || i === nl - 2, titre: titre && i === 0,
          dessiner: (pg, y, info) => {
            const b0 = y - (i === 0 ? pT + marge : 0) - 0.7785 * lh, bas = y - hi;
            if(numero != null){
              if(i === 0) poser(pg, composer([{ t: numero }], cells[0].st, SYS.chap.trait)[0], xs[0], xs[0] + SYS.chap.trait, b0, 'left', info);
              ligne(pg, xs[0] + SYS.chap.trait, bas + (i === nl - 1 ? 0.25 : 0), xs[0] + SYS.chap.trait, y);
            }
            cells.forEach(c => { const ln = c.lignes[i]; if(ln) poser(pg, ln, c.cx0, c.cx1, b0, c.ha, info); });
            if(i === nl - 1) filetsBas(pg, bas);
            if(i === 0) filetsHaut(pg, y);
          } });
      }
    });
  };

  /* TableBand : colonnes visibles triées, titres (customH si isHC et non vide, sinon le nom de la colonne, comme svDpTable du
     moteur : « Monnaie », « Type », « % »), lignes vides à filets, lignes de total des propriétés */
  const bandeTableau = (b, G) => {
    /* exemplaire avec données (B7) : colonnes et lignes préparées par l'app (svDpCols du moteur : colonnes variables comprises) */
    const J = G.env.job, D = J && J.T ? J.T[b._sgk] : null;
    const set = tab(b.tableSettings)[0]; if(!set) return;
    const cols = D ? tab(D.cols) : tab(set.columns).filter(c => c && !c.isH).slice().sort(so); if(!cols.length) return;
    const T = SYS.tab[G.ori];
    const ml = retraitDe(b.ml), x0 = G.Z.x0 + ml, W = G.Z.x1 - x0;
    let ws = largeurs(cols, W);
    /* exemplaire avec données (B7) : chaque colonne reçoit au moins la largeur de son plus long mot (titre compris), prise sur les colonnes
       qui ont de la place — aucune donnée ne déborde sur sa voisine ; sans manque, les largeurs du modèle restent telles quelles */
    if(D){
      const nC = cols.length, bords = j => (j > 0 ? SYS.gout : SYS.pad) + (j < nC - 1 ? SYS.gout : SYS.pad);
      const mot = (t, f, sz) => String(t == null ? '' : t).split(/\s+/).reduce((m, x) => x ? Math.max(m, largeur(prep(x), f, sz)) : m, 0);
      const min = cols.map((c, j) => Math.max(mot(c.titre, F.light, T.tete),
        tab(D.rows).reduce((m, r) => r && !r.fuse ? Math.max(m, mot(tab(r.c)[j], F.regular, T.taille)) : m, 0)) + bords(j));
      const manque = ws.reduce((a, w, j) => a + Math.max(0, min[j] - w), 0);
      const marge = ws.reduce((a, w, j) => a + Math.max(0, w - min[j]), 0);
      if(manque > 0.01 && marge > 0.01){ const k = Math.min(1, manque / marge), q = Math.min(1, marge / manque);
        ws = ws.map((w, j) => w < min[j] ? w + (min[j] - w) * q : w - (w - min[j]) * k); }
    }
    const xs = cumul(x0, ws), Wt = ws.reduce((a, x) => a + x, 0), n = cols.length;
    const stT = { f: F.light, sz: T.tete, lh: T.tete * 1.25 };
    const bornes = (j) => [xs[j] + (j > 0 ? SYS.gout : SYS.pad), xs[j] + ws[j] - (j < n - 1 ? SYS.gout : SYS.pad)];
    let tete = null;
    if(D ? D.tete : set.isHV !== false){
      const cells = cols.map((c, j) => {
        let ms;
        if(D) ms = morceauxTexte({ ts: [{ class: 'TextString', text: c.titre }] });
        else if(c.type === 'flexColumn'){ const nm = String(c.name || ''); ms = [{ t: '‹ ' + (SG_DS_CHAMPS.colonnes[nm] || nm || 'Colonnes variables') + ' ›', rep: true }]; }
        else ms = morceauxTexte({ ts: [{ class: 'TextString', text: c.isHC && c.customH != null && c.customH !== '' ? c.customH : c.name }] });
        const [a, z] = bornes(j), ha = c.ha || 'left';
        if(estVide(ms)) return { lignes: [], a, z, ha };
        /* 3 pt de marge en plus : un titre qui remplirait toute sa colonne passe à la ligne (« 1er trimestre ») ; mot trop long :
           corps réduit jusqu'à 6,5 pt, sinon titre sur une ligne, au corps normal, placé « en escalier » (ci-dessous) */
        const dispo = z - a - 3;
        let cp = composerAjuste(ms, stT, dispo, 6.5, { coupe: false, silence: true });
        let deb = cp.lignes.some(l => l.w > dispo + 0.5);
        if(deb) cp = { lignes: composer(ms, stT, 1e6), st: stT };
        /* titre plus large que tout le tableau (mot démesuré) : l'escalier ne suffit plus — mot coupé à la lettre dans sa colonne
           (dernier recours, signalé) */
        if(deb && cp.lignes[0].w > Wt - 2 * SYS.pad){ cp = composerAjuste(ms, stT, dispo, 6.5); deb = false; }
        /* composition silencieuse gardée telle quelle : ses repères tronqués sont signalés ici (agent 4) */
        else if(!deb) cp.lignes.forEach(l => l.j.forEach(k => { if(k.tronque) alerte('Mise en page : repère « ' + k.tronque + ' » tronqué en « ' + k.t + ' »'); }));
        return { lignes: cp.lignes, a, z, ha, deb };
      });
      /* niveaux des lignes (0 = ligne du bas) : titres normaux alignés en bas ; titre plus large que sa colonne posé sur le
         premier niveau où il ne touche aucun autre titre (3 pt d'écart) — rien ne se superpose, aucun mot n'est coupé */
      const occ = [], etendue = (c, ln) => c.ha === 'right' ? [c.z - ln.w, c.z] : (c.ha === 'center' ? [(c.a + c.z - ln.w) / 2, (c.a + c.z + ln.w) / 2] : [c.a, c.a + ln.w]);
      const libre = (n, e) => !(occ[n] || []).some(q => e[0] < q[1] + 3 && e[1] > q[0] - 3);
      const prendre = (n, e) => { (occ[n] = occ[n] || []).push(e); };
      cells.forEach(c => { if(c.deb) return; const k = c.lignes.length; c.niv = c.lignes.map((ln, i) => { prendre(k - 1 - i, etendue(c, ln)); return k - 1 - i; }); });
      /* un titre en escalier reste dans la largeur du tableau : aligné à droite dans une colonne étroite du bord gauche (« Numéro »
         dans 5 mm), il est décalé vers la droite au lieu de déborder à gauche du tableau (et inversement au bord droit) */
      const tg = x0 + SYS.pad, tdr = x0 + Wt - SYS.pad;
      cells.forEach(c => { if(!c.deb) return;
        const e0 = etendue(c, c.lignes[0]), dx = e0[0] < tg ? tg - e0[0] : (e0[1] > tdr ? tdr - e0[1] : 0);
        c.a += dx; c.z += dx;
        const e = etendue(c, c.lignes[0]); let n = 0; while(!libre(n, e)) n++; prendre(n, e); c.niv = [n]; });
      const nmax = cells.reduce((m, c) => Math.max(m, (c.niv || []).reduce((a, x) => Math.max(a, x), 0)), 0);
      const h = T.pas + nmax * stT.lh;
      tete = { h, avant: mmPt(b.mt), garder: true, entete: true,
        dessiner: (pg, y, info) => {
          const bas = y - h;
          cells.forEach(c => c.lignes.forEach((ln, i) => poser(pg, ln, c.a, c.z, bas + T.base + c.niv[i] * stT.lh, c.ha, info)));
          filet(pg, x0, bas, x0 + Wt);
        } };
      G.out.push(tete);
    }
    /* exemplaire avec données (B7) : une ligne par rangée du moteur, au pas du tableau (5 mm portrait, 4 mm paysage), filet 0,25 sous
       chaque ligne ; emphase (Regular) selon le style de rangée du modèle (rowstyleset) ; total (« tt ») dans un cadre 0,25 comme les
       totaux des contrats ; montants non nuls des colonnes de nombres en rouge Regular ; « space » = demi-ligne vide ; « fuse » = une
       cellule sur toute la largeur. Ni lignes vides ni rangées « Total… » des propriétés : le moteur donne ses propres totaux */
    if(J){
      const L = D ? tab(D.rows).filter(Boolean) : [];
      const stL = { f: F.light, sz: T.taille, lh: T.taille * 1.25 }, stR = Object.assign({}, stL, { f: F.regular });
      L.forEach((r, ri) => {
        const avant = (!tete && ri === 0) ? mmPt(b.mt) : 0;
        if(r.st === 'space'){ G.out.push({ h: T.pas / 2, avant, tete, espace: true, dessiner: () => {} }); return; }
        const st = r.gras ? stR : stL, total = r.st === 'tt', V = tab(r.c);
        /* un mot n'est jamais coupé à la lettre (« 38 », « FF10'584.24 » dans une colonne étroite) : corps réduit jusqu'à 6,5 pt dans sa
           colonne, puis les gouttières de la colonne, et en dernier recours il dépasse de sa colonne du côté de son alignement */
        const cellule = (t, a, z, A, Z, num) => {
          const ms = [{ t, val: num }], tient = (L, w) => L.every(l => l.w <= w + 0.01), op = { coupe: false, silence: true };
          let lg = composer(ms, st, z - a, op);
          if(tient(lg, z - a)) return { lignes: lg, a, z };
          lg = composerAjuste(ms, st, z - a, 6.5, op).lignes;
          if(tient(lg, z - a)) return { lignes: lg, a, z };
          lg = composer(ms, st, Z - A, op);
          if(tient(lg, Z - A)) return { lignes: lg, a: A, z: Z };
          return { lignes: composerAjuste(ms, st, Z - A, 6.5, op).lignes, a: A, z: Z };
        };
        const cs = (r.fuse ? [{ t: V[0], a: x0 + SYS.pad, z: x0 + Wt - SYS.pad, A: x0 + SYS.pad, Z: x0 + Wt - SYS.pad, ha: 'left', num: false }]
          : cols.map((c, j) => { const [a, z] = bornes(j); return { t: V[j], a, z, A: xs[j] + (j > 0 ? 0.75 : SYS.pad), Z: xs[j] + ws[j] - (j < n - 1 ? 0.75 : SYS.pad), ha: c.ha || 'left', num: !!c.num }; }))
          .map(c => { const t = prep(c.t == null ? '' : c.t); if(/\S/.test(t)) Object.assign(c, cellule(t, c.a, c.z, c.A, c.Z, c.num)); else c.lignes = []; return c; });
        const nl = cs.reduce((m, c) => Math.max(m, c.lignes.length), 1), h = T.pas + (nl - 1) * st.lh;
        const suiv = L[ri + 1], garder = /^(th|ch|l[1-4])$/.test(r.st || '') || !!(suiv && suiv.st === 'tt');
        G.out.push({ h, avant, tete, garder,
          dessiner: (pg, y, info) => {
            const bas = y - h, b0 = y - (T.pas - T.base);
            cs.forEach(c => c.lignes.forEach((ln, i) => poser(pg, ln, c.a, c.z, b0 - i * st.lh, c.ha, info)));
            if(total) rect(pg, x0, bas, Wt, h, { bord: C.N }); else filet(pg, x0, bas, x0 + Wt);
          } });
      });
      return;
    }
    for(let i = 0; i < SYS.lignesVides; i++){
      G.out.push({ h: T.pas, avant: (!tete && i === 0) ? mmPt(b.mt) : 0, tete,
        dessiner: (pg, y) => filet(pg, x0, y - T.pas, x0 + Wt) });
    }
    /* lignes de total : libellés « Total… » des propriétés du tableau (tableProperties), cadre 0,25 comme les totaux des contrats */
    const tot = tab(b.tableProperties).filter(Boolean).slice().sort((p, q) => (+p.k || 0) - (+q.k || 0))
      .map(p => prep(p.v)).filter(v => /^tota(l|ux)\b/i.test(v));
    const stTot = { f: F.regular, sz: T.taille, lh: T.taille * 1.25 };
    tot.forEach((lib, i) => {
      const ln = composer([{ t: lib }], stTot, Wt - 2 * SYS.pad)[0];
      G.out.push({ h: T.pas, avant: i === 0 ? T.pas / 2 : 0, tete,
        dessiner: (pg, y, info) => {
          rect(pg, x0, y - T.pas, Wt, T.pas, { bord: C.N });
          poser(pg, ln, x0 + SYS.pad, x0 + Wt - SYS.pad, y - T.pas + T.base, 'left', info);
        } });
    });
  };

  /* WrappingTextBand / TextBand : paragraphes (sauts de ligne conservés), filet de la bordure d'origine, titres de section */
  const bandeTexte = (b, G, t, ecart) => {
    const col = b.col || {}, st = styleDe(col.textFont), ha = col.ha || 'left';
    const ml = retraitDe(b.ml), x0 = G.Z.x0 + ml, x1 = G.Z.x1, W = x1 - x0;
    const bd = bordure(b.rs);
    const pd = b.p || {}, pL = mmPt(pd.l), pR = mmPt(pd.r), pT = mmPt(pd.t), pB = mmPt(pd.b);
    const ms = morceauxTexte(t, G.env);
    const avant0 = mmPt(b.mt);
    if(estVide(ms)){
      if(bd.b || bd.t) G.out.push({ h: 1, avant: avant0, filet: true, dessiner: (pg, y) => filet(pg, x0, y - 1, x1) });
      else if(avant0 > 0) G.out.push({ h: 0, avant: avant0, espace: true, dessiner: () => {} });
      return;
    }
    const P = paragraphes(ms).map(p => estVide(p) ? [] : composer(p, st, W - pL - pR));
    const titre = (bd.b || bd.t) && (st.niv === 'sous' || st.niv === 'chapitre' || st.niv === 'grand') && P.length === 1 && P[0].length <= 2;
    if(titre){
      /* titre de section (sous-titre, grand) : ligne de module, filet au bas (et en haut si demandé), gardé avec la suite ;
         « grand » (largeBold) = titre de chapitre : Bold 8 capitales */
      const L = st.niv === 'grand' ? composer(paragraphes(ms)[0], Object.assign({}, st, { maj: true }), W - pL - pR) : P[0], h = SYS.module + (L.length - 1) * st.lh + pT + pB;
      G.out.push({ h, avant: avant0, garder: true, titre: true,
        dessiner: (pg, y, info) => {
          const b0 = y - pT - (SYS.module - SYS.base);
          L.forEach((ln, i) => poser(pg, ln, x0 + pL, x1 - pR, b0 - i * st.lh, ha, info));
          if(bd.b) filet(pg, x0, y - h, x1);
          if(bd.t) filet(pg, x0, y, x1);
        } });
      return;
    }
    const d0 = 0.7785 * st.lh;
    const blocs = [];
    P.forEach((L, i) => {
      const lignes = L.length ? L : [null];
      lignes.forEach((ln, k) => {
        blocs.push({ h: st.lh, avant: (i === 0 && k === 0) ? avant0 + pT : (k === 0 ? ecart : 0),
          garder: lignes.length > 1 && (k === 0 || k === lignes.length - 2),
          dessiner: (pg, y, info) => { if(ln) poser(pg, ln, x0 + pL, x1 - pR, y - d0, ha, info); } });
      });
    });
    if(bd.t){ const b0 = blocs[0], d = b0.dessiner; b0.dessiner = (pg, y, info) => { filet(pg, x0, y + 2.6, x1); d(pg, y, info); }; }
    if(bd.b || pB){
      const bl = blocs[blocs.length - 1], d = bl.dessiner, hx = d0 + SYS.base + pB;
      bl.h = Math.max(bl.h, hx);
      bl.dessiner = (pg, y, info) => { d(pg, y, info); if(bd.b) filet(pg, x0, y - hx, x1); };
    }
    blocs.forEach(x => G.out.push(x));
  };

  /* bloc destinataire (adresse décalée, ou adresse de 30 mm de haut) : comme la facture, x 368.6, 7.5 pt, pas 14, petits traits */
  const bandeDestinataire = (b, G, t) => {
    const D = SYS.dest, x = G.Z.x1 - D.dx;
    const ms = morceauxTexte(t, G.env);
    if(estVide(ms)) return;
    const P = paragraphes(ms);
    const lignes = [];
    /* largeur : celle de la facture, mais jamais jusque dans la colonne du logo (agent 4 : un bloc long ou placé bas sur la page
       recouvrait le logo) ; sans effet sur les documents types, dont les lignes d'adresse font moins de 120 pt */
    const logoX = G.ori === 'paysage' ? PAP.format.paysage.w - PAP.logo.paysage.dx : PAP.logo.portrait.x;
    const larg = Math.min(D.largeur, logoX - 2 - x);
    P.forEach((p, i) => {
      const st = { f: i === 0 && !p.some(m => m.rep) ? F.bold : F.light, sz: D.taille, lh: D.pas, maj: true };
      (estVide(p) ? [null] : composer(p, st, larg)).forEach(ln => lignes.push(ln));
    });
    const nl = Math.max(lignes.length, D.lignesMin);
    const h = (D.haut - D.base1) + (nl - 1) * D.pas + D.traitDy;
    /* adresse plus haute que la zone utile (texte anormalement long) : composée comme un texte courant, qui passe d'une page à l'autre */
    if(h > G.Z.haut - G.Z.bas){ bandeTexte(b, G, t, 0); return; }
    G.out.push({ h, avant: mmPt(b.mt), yFixe: G.ori === 'portrait' ? D.haut : null,
      dessiner: (pg, y, info) => {
        const b0 = y - (D.haut - D.base1);
        lignes.forEach((ln, i) => {
          if(ln) poser(pg, ln, x, x + D.largeur, b0 - i * D.pas, 'left', info);
          if(i < lignes.length - 1 && ln && lignes[i + 1]) ligne(pg, x, b0 - i * D.pas - D.traitDy, x + D.trait, b0 - i * D.pas - D.traitDy);
        });
      } });
  };

  /* image (signature de l'utilisateur) : place réservée et repère, jamais l'image d'un autre bureau */
  const bandeImage = (b, G) => {
    const c = b.c || {}, f = String(c.f || ''), n = f.slice(f.lastIndexOf('|') + 1) || 'appUserSignature';
    const col = b.col || {}, st = styleDe(col.textFont);
    const ml = retraitDe(b.ml), x0 = G.Z.x0 + ml, x1 = G.Z.x1;
    /* exemplaire avec données (B7) : signature enregistrée dessinée dans sa place de 10 mm, sinon place laissée libre (signature à
       la main) ; images fixes des anciens modèles (logos, fonds : c.n) jamais imprimées */
    if(G.env.job){
      const im = !c.n && G.env.job.img ? G.env.job.img[n] : null;
      /* image d'un document de l'app (bloc 31 : cartes, plans) : hauteur donnée par la bande (b.h, mm) ; signature : 10 mm */
      const hB = +b.h > 0 ? Math.min(mmPt(b.h), G.Z.haut - G.Z.bas) : SYS.signature;
      G.out.push({ h: hB, avant: mmPt(b.mt),
        dessiner: (pg, y) => { if(!im) return;
          const k = Math.min(hB / im.height, (x1 - x0) / im.width), w = im.width * k, hh = im.height * k;
          const x = col.ha === 'right' ? x1 - w : (col.ha === 'center' ? (x0 + x1 - w) / 2 : x0);
          pg.drawImage(im, { x, y: y - hh, width: w, height: hh }); } });
      return;
    }
    const ln = composer([{ t: '‹ ' + libelleChamp(n, 'standard') + ' ›', rep: true }], st, x1 - x0)[0];
    G.out.push({ h: SYS.signature, avant: mmPt(b.mt),
      dessiner: (pg, y, info) => poser(pg, ln, x0, x1, y - SYS.signature / 2 - st.sz * 0.35, col.ha || 'left', info) });
  };

  const estAdresse = (b) => {
    if(b.class !== 'TextBand' || !b.c || b.c.class === 'Image') return false;
    if((+b.ml || 0) >= 80) return true;
    const ts = tab(b.c.ts).filter(x => x && !(x.class === 'TextString' && !/\S/.test(x.text || '')));
    return (+b.h || 0) >= 30 && ts.length === 1 && ts[0].class === 'TextField' && /^contact(Owner)?AndAddress$|^contactAddress$|^contactOwnerAndAddress$/.test(ts[0].s || '');
  };

  /* largeur utile (mm) de la page du modèle pour une section, comme le moteur (svDpPage) : gabarit de la section, sinon
     « A4 Portrait » du document, sinon A4 portrait à marges de 25 et 15 mm (170 mm) — sert à la règle des cellules en surnombre */
  const largeurModele = (s) => {
    const pts = tab(rep && rep.pageTemplates).filter(Boolean);
    const t = (s && s.pageTemplateId != null ? pts.find(p => p.id === s.pageTemplateId) : null) || pts.find(p => p.id === 'A4 Portrait');
    const pg = (t && t.page) || { w: 210, l: 25, r: 15 };
    return (+pg.w || 210) - (+pg.l || 0) - (+pg.r || 0);
  };
  const blocsSection = (s, ori, J) => {
    const G = { Z: zoneDe(ori), ori, env: J ? { section: s, job: J } : { section: s }, out: [], Wmod: largeurModele(s) };
    tab(s.bands).filter(b => b && !b.isH).slice().sort(so).forEach(b => {
      try{
        if(b.class === 'GridBand') bandeGrille(b, G);
        else if(b.class === 'TableBand') bandeTableau(b, G);
        else if(b.class === 'WrappingTextBand') bandeTexte(b, G, b.text || b.c, Math.min(mmPt(b.rowSpace), SYS.ecartMax));
        else if(b.class === 'TextBand'){
          if(b.c && b.c.class === 'Image') bandeImage(b, G);
          else if(estAdresse(b)) bandeDestinataire(b, G, b.c);
          else bandeTexte(b, G, b.c, 0);
        }
        else if(b.class === 'LineBand'){
          const x0 = G.Z.x0 + retraitDe(b.ml), x1 = G.Z.x1;
          G.out.push({ h: 1, avant: mmPt(b.mt), filet: true, dessiner: (pg, y) => filet(pg, x0, y - 0.5, x1) });
        }
        else if(b.class === 'PageBreakBand') G.out.push({ saut: true });
        else alerte('Bande inconnue : ' + b.class + ' (' + (b.name || '') + ')');
      }catch(e){ alerte('Bande « ' + (b.name || b.class) + ' » : ' + (e && e.message || e)); }
    });
    return G.out;
  };

  /* ── B6. Pagination : sections (chacune sur une nouvelle page, dans son format), sauts de page, en-têtes répétés ── */
  /* orientation d'une section : son gabarit de page (largeur > hauteur → paysage) ; gabarit introuvable : d'après son nom
     (« A4 Landscape 2 », « A4 Paysage … »), sinon portrait */
  const orienter = (s) => {
    const pts = tab(rep && rep.pageTemplates).filter(Boolean);
    const t = pts.find(p => s && p.id === s.pageTemplateId);
    if(t && t.page) return +t.page.w > +t.page.h ? 'paysage' : 'portrait';
    const nom = String((s && s.pageTemplateId) || '') + ' ' + String((s && s.pageTemplateName) || '');
    if(/landscape|paysage|quer/i.test(nom)) return 'paysage';
    /* gabarit absent : page par défaut de Deltaproject (PageTemplate.getDefaultPageTemplate = A4 Portrait, comme svDpPage) */
    return 'portrait';
  };
  const paginer = (sections) => {
    const pages = []; let P = null, Z = null, y = 0;
    let sec = 0, saut = false;
    const ouvrir = (ori) => { Z = zoneDe(ori); P = { ori, items: [], tetes: new Set(), sec }; pages.push(P); y = Z.haut; saut = false; };
    /* une page « pleine » a au moins un bloc qui dessine (les espaceurs — marge d'une bande vide — ne comptent pas) */
    const plein = () => P.items.some(it => !it.b.espace);
    sections.forEach((S, si) => {
      sec = si; ouvrir(S.ori);
      const B = S.blocs, HZ = Z.haut - Z.bas;
      for(let i = 0; i < B.length; i++){
        const b = B[i];
        /* saut de page (PageBreakBand) : la page suivante n'est ouverte qu'avec le bloc suivant — jamais de page vide après un
           saut placé en fin de section, ni pour deux sauts consécutifs */
        if(b.saut){ if(plein()) saut = true; continue; }
        if(saut) ouvrir(S.ori);
        const vide = !plein();
        /* espaceur en haut de page : supprimé, comme l'espace avant d'une bande */
        if(b.espace && vide) continue;
        let avant = vide ? 0 : b.avant;
        /* chaîne « garder avec le suivant » (titres, en-têtes de tableau, premières et avant-dernières lignes) ; un espaceur
           (ligne vide) entre un titre et la suite ne rompt pas la chaîne */
        let besoin = avant + b.h;
        for(let j = i; B[j] && (B[j].garder || (j > i && B[j].espace)) && B[j + 1] && !B[j + 1].saut && besoin <= HZ; j++) besoin += B[j + 1].avant + B[j + 1].h;
        /* en-tête de tableau à répéter en haut de page (le nom « rep » désigne le modèle dans toute la fonction) */
        const tete = b.tete && !P.tetes.has(b.tete) ? b.tete : null;
        if(tete) besoin += tete.h;
        if(b.filet && !vide && y - besoin < Z.bas - 0.01){
          /* filet seul (LineBand, bordure d'un texte vide) : jamais seul en haut d'une page — l'espace avant est réduit, et il
             peut descendre jusqu'à la limite basse absolue (basMin, au-dessus du pied) */
          const bm = PAP.zone[S.ori].basMin;
          if(y - b.h >= bm){ avant = Math.max(0, Math.min(avant, y - b.h - Z.bas)); besoin = 0; }
        }
        if(!vide && besoin > 0 && y - Math.min(besoin, HZ) < Z.bas - 0.01){ ouvrir(S.ori); avant = 0; }
        if(b.yFixe && !plein()) y = Math.min(y, b.yFixe);
        if(b.tete && !P.tetes.has(b.tete)){ P.items.push({ b: b.tete, y }); P.tetes.add(b.tete); y -= b.tete.h; avant = 0; }
        if(b.entete) P.tetes.add(b);
        y -= avant;
        if(y - b.h < (b.filet ? PAP.zone[S.ori].basMin : Z.bas) - 0.5) alerte('Bloc plus haut que la zone utile (' + Math.round(b.h) + ' pt), page ' + pages.length);
        P.items.push({ b, y }); y -= b.h;
      }
    });
    /* pages sans contenu (section vide, sans bande visible, ou seulement des marges) : retirées — pas de page blanche inutile —,
       sauf si le document n'a rien d'autre (il garde alors une page, comme le moteur) */
    const pleines = pages.filter(p => p.items.some(it => !it.b.espace)), res = pleines.length ? pleines : pages.slice(0, 1);
    /* contrôle : aucun titre ni en-tête de tableau en bas d'une page si la section continue sur la suivante */
    res.forEach((p, i) => { const q = res[i + 1], it = p.items.filter(x => !x.b.espace).pop();
      if(q && q.sec === p.sec && q.items.length && it && (it.b.titre || it.b.entete)) alerte('Titre en bas de la page ' + (i + 1)); });
    return res;
  };

  /* descriptif de soumission (bloc 40) : o.descriptif = { lettre, titre, blocs:[{ t, x, b }] } ; mesures relevées sur 23JOG_descriptif_250 sanitaire.pdf
     (corps 9,12 Light, tirets à x 67,2, texte à x 85 ; petites listes 7,54 ; bande noire 18 pt ; emphase en Regular ; titres gardés avec la ligne suivante) */
  const contenuDescriptif = (cx) => {
    const D = o.descriptif, BL = Array.from(D.blocs || []).filter(b => String(b.x || '').trim() !== ''), XP = 67.2, XT = 85, XD = 524, HT = { sec:7.56, pjt:7.54, pj:7.54 }, CORPS = 9.12, TITRES = ['sec','sou','gr','pjt'];
    const avant = (t, p) => { if(!p) return 0; if(t === 'kv' && p === 'kv') return 12.4; if(t === 'pj') return 11.5; if(t === 'pjt') return 25; if(t === 'sec') return 34.6; if(t === 'sou') return p === 'sec' ? 24.2 : 25; if(t === 'gr') return 25; return TITRES.includes(p) ? 14 : 12.4; };
    cx.nouvellePage('portrait');
    const h = cx.page.getHeight(), blanc = PDFLib.rgb(1, 1, 1), HAUT = h - 76.2;
    if(D.titre || D.lettre){
      cx.rect(29, h - 135, 499, 18, { fond:C.N });
      if(D.lettre) cx.texte(D.lettre, 32.4, h - 129.6, { police:F.bold, taille:11.52, couleur:blanc });
      const xB = Math.max(49.1, 32.4 + (D.lettre ? cx.largeur(D.lettre, F.bold, 11.52) + 8 : 0) - (D.lettre ? 0 : 16.7));
      let tB = 11.52; while(tB > 6 && cx.largeur(D.titre || '', F.bold, tB) > 524 - xB) tB -= 0.25;   /* titre long : corps réduit, il reste dans la bande */
      cx.texte(D.titre || '', xB, h - 129.6, { police:F.bold, taille:tB, couleur:blanc });
    }
    let y = h - 185.6, prev = null;
    const lead = 11.2, hUtile = HAUT - cx.Z.bas;
    /* titres gardés avec ce qui suit : les titres suivants et deux lignes du premier texte */
    const suiteTitre = (i) => { let hS = 0, j = i + 1, p = BL[i].t;
      while(j < BL.length && TITRES.includes(BL[j].t)){ hS += avant(BL[j].t, p); p = BL[j].t; j++; }
      if(j < BL.length){ const n = BL[j], szN = HT[n.t] || CORPS; hS += avant(n.t, p) + (Math.min(2, cx.couper(n.t === 'kv' ? (n.v || '') : n.x, F.light, szN, XD - XT).length) - 1) * lead; }
      return hS; };
    BL.forEach((b, i) => {
      const t = b.t, sz = HT[t] || CORPS, f = t === 'sec' ? F.bold : (b.b ? F.regular : F.light), xT = t === 'pj' ? 89.7 : (t === 'kv' ? XT + 190 : XT), L = cx.couper(t === 'kv' ? (b.v || '') : b.x, f, sz, XD - xT), G = t === 'kv' ? cx.couper(b.x, F.light, sz, 182) : [], n = Math.max(L.length, G.length);
      let dy = avant(t, prev), besoin = dy + (n - 1) * lead;
      if(TITRES.includes(t)) besoin += suiteTitre(i);
      if(besoin > hUtile) besoin = dy + lead;   /* plus haut qu'une page : il commence ici et continue page après page */
      if(y - besoin < cx.Z.bas){ cx.nouvellePage('portrait'); y = HAUT; dy = 0; }
      y -= dy;
      if(t === 'pu') cx.texte('-', XP, y, { police:F.light, taille:sz });
      if(t === 'pj') cx.texte('-', XT, y, { police:F.light, taille:sz });
      for(let j = 0; j < n; j++){
        if(j){ y -= lead; if(y < cx.Z.bas){ cx.nouvellePage('portrait'); y = HAUT; } }
        if(G[j]) cx.texte(G[j], XT, y, { police:F.light, taille:sz });
        if(L[j]){ cx.texte(L[j], xT, y, { police:f, taille:sz });
          if(t === 'sec' || t === 'sou' || t === 'pjt') cx.ligne(xT, y - 1.2, xT + cx.largeur(L[j], f, sz), y - 1.2); }
      }
      prev = t;
    });
    /* signatures côte à côte (contrat d'entreprise) : o.descriptif.signatures = [{ t, n }] */
    const SIG = Array.from(D.signatures || []);
    if(SIG.length){
      if(y - 112 < cx.Z.bas){ cx.nouvellePage('portrait'); y = HAUT; } else y -= 38;
      SIG.forEach((s, i) => { const x = XT + i * 226;
        cx.texte(s.t || '', x, y, { police:F.regular, taille:CORPS });
        cx.couper(s.n || '', F.light, CORPS, 200).slice(0, 2).forEach((l, j) => cx.texte(l, x, y - 12.4 * (j + 1), { police:F.light, taille:CORPS }));
        cx.texte('Lieu et date :', x, y - 52, { police:F.light, taille:7.54 });
        cx.ligne(x, y - 82, x + 200, y - 82);
        cx.texte('Signature', x, y - 91, { police:F.light, taille:7.54 }); });
      y -= 91;
    }
    cx.y = y;
  };
  /* tableau comparatif de la soumission (bloc 42) : paysage, 7 pt sur 4 mm comme l'annexe 2 du contrat ; 5 entreprises par bande, en-tête répété, prix le plus bas sur fond jaune pâle,
     montants en rouge, lignes grisées en gris ; textes passés par prep() (glyphes absents signalés dans o.journal) */
  const contenuComparatif = (cx) => {
    const D = o.comparatif, ENTS = Array.from(D.ents || []), LG = Array.from(D.lignes || []), PAS = 11.34, T = 7, PAR = 5, JAUNE = PDFLib.rgb(0.996, 0.965, 0.69);
    cx.nouvellePage('paysage');
    const Z = cx.Z, X0 = Z.x0, X1 = Z.x1, HAUT = Z.haut - 6; let y = HAUT;
    const page = () => { cx.nouvellePage('paysage'); y = HAUT; };
    const P = (t) => prep(t == null ? '' : t);
    /* au plus n lignes ; ce qui ne tient pas finit par « ... » (la police Bold n'a pas « … ») */
    const lignesDe = (t, f, w, n) => { const L = cx.couper(P(t), f, T, w); if(L.length <= n) return L; const R = L.slice(0, n); let d = R[n - 1]; while(d && cx.largeur(d + '...', f, T) > w) d = d.slice(0, -1); R[n - 1] = d.trimEnd() + '...'; return R; };
    const titre = (t, s) => { if(y - 40 < Z.bas) page(); cx.texte(P(t), X0, y, { police:F.bold, taille:9.12 }); if(s) cx.texte(P(s), X1, y, { police:F.light, taille:T, couleur:C.G, align:'d' }); y -= 7; cx.ligne(X0, y, X1, y); y -= 3; };
    const cols = (L) => { let x = X0; return L.map(c => { const r = { ...c, x }; x += c.w; return r; }); };
    /* cellule v = { t (texte ou lignes), f, coul, fond } ; une ligne de tableau = filet dessous ; en-tête répété après un saut de page */
    const hauteur = (cells) => Math.max(1, ...cells.map(v => (v && Array.isArray(v.t) ? v.t.length : 1))) * PAS;
    const ligneT = (C2, cells, tete) => { const h = hauteur(cells); if(y - h < Z.bas){ page(); if(tete) tete(); }
      C2.forEach((c, i) => { const v = cells[i]; if(!v) return; if(v.fond) cx.rect(c.x, y - h, c.w, h, { fond:v.fond }); if(v.t === '' || v.t == null) return;
        const f = v.f || F.light, x = c.a === 'd' ? c.x + c.w - 2 : c.x + 2; (Array.isArray(v.t) ? v.t : [v.t]).forEach((l, k) => cx.texte(P(l), x, y - 8.2 - k * PAS, { police:f, taille:T, couleur:v.coul || C.N, align:c.a === 'd' ? 'd' : 'g' })); });
      y -= h; cx.ligne(X0, y, X1, y); };
    const rouge = (t, f) => ({ t, f:f || F.regular, coul:C.R });
    const nomE = (e, w) => lignesDe((e.rang ? e.rang + '. ' : '') + (e.prop ? '(+) ' : '') + e.nom, F.regular, w - 4, 2);
    if(D.nature) cx.texte(P(D.nature), X0, y, { police:F.regular, taille:T, couleur:C.G }); y -= 12;
    if(D.sous) cx.texte(P(D.sous), X0, y, { police:F.light, taille:T, couleur:C.G }); y -= 18;
    /* synthèse */
    titre('Synthèse');
    const cS = cols([{ w:28 }, { w:X1 - X0 - 28 - 76 * 3 - 52 - 66 - 52 }, { w:76, a:'d' }, { w:76, a:'d' }, { w:76, a:'d' }, { w:52, a:'d' }, { w:66, a:'d' }, { w:52, a:'d' }]);
    const teteS = () => ligneT(cS, ['Rang', 'Entreprise', 'Brut', 'Net de l’offre', 'Net négocié', 'Écart', 'Prix les plus bas', 'Sans prix'].map(t => ({ t, f:F.regular })));
    teteS();
    ENTS.forEach(e => ligneT(cS, [{ t:String(e.rang || '') }, { t:lignesDe((e.prop ? '(+) ' : '') + e.nom, F.light, cS[1].w - 4, 2) }, rouge(e.brut), rouge(e.net), rouge(e.neg), { t:e.ecart }, { t:String(e.bas || 0) }, { t:String(e.vide || 0) }], teteS));
    y -= 16;
    const bandes = []; for(let i = 0; i < ENTS.length; i += PAR) bandes.push(i);
    bandes.forEach((i0, ib) => {
      const E2 = ENTS.slice(i0, i0 + PAR), nb = E2.length, suite = bandes.length > 1 ? ' · entreprises ' + (i0 + 1) + ' à ' + (i0 + nb) : '';
      /* récapitulatif par chapitre */
      const wM = Math.min(120, Math.floor((X1 - X0 - 36 - 220) / nb)), cR = cols([{ w:36 }, { w:X1 - X0 - 36 - nb * wM }, ...E2.map(() => ({ w:wM, a:'d' }))]);
      const teteR = () => ligneT(cR, [{ t:'Chapitre', f:F.regular }, { t:'', f:F.regular }, ...E2.map(e => ({ t:nomE(e, wM), f:F.regular }))]);
      titre('Récapitulatif par chapitre' + suite); teteR();
      Array.from(D.chap || []).forEach(c => ligneT(cR, [{ t:c.n, coul:c.g ? C.G : C.N }, { t:lignesDe(c.x, F.light, cR[1].w - 4, 2), coul:c.g ? C.G : C.N }, ...E2.map((e, j) => c.g ? { t:c.c[i0 + j], coul:C.G } : rouge(c.c[i0 + j]))], teteR));
      /* détail : à la suite, sauf s'il ne reste presque plus de place */
      y -= 18; if(y - 8 * PAS < Z.bas) page();
      const wN = 36, wQ = 40, wU = 20, wP = 46, wA = 58, wD = X1 - X0 - wN - wQ - wU - nb * (wP + wA), cD = cols([{ w:wN }, { w:wD }, { w:wQ, a:'d' }, { w:wU }, ...E2.flatMap(() => [{ w:wP, a:'d' }, { w:wA, a:'d' }])]), cL = cols([{ w:wN }, { w:X1 - X0 - wN }]);
      const teteD = () => { let x = X0 + wN + wD + wQ + wU; E2.forEach(e => { nomE(e, wP + wA).forEach((l, k) => cx.texte(P(l), x + 2, y - 8.2 - k * PAS, { police:F.regular, taille:T })); x += wP + wA; }); y -= 2 * PAS;
        ligneT(cD, [{ t:'N°', f:F.regular }, { t:'Article', f:F.regular }, { t:'Quantité', f:F.regular }, { t:'Un.', f:F.regular }, ...E2.flatMap(() => [{ t:'Prix unit.', f:F.regular }, { t:'Montant', f:F.regular }])]); };
      const celTitre = (l) => [{ t:l.n, f:l.k === 'ch' ? F.bold : F.regular, coul:l.g ? C.G : C.N }, { t:lignesDe(l.x || '', l.k === 'ch' ? F.bold : F.regular, cL[1].w - 4, 2), f:l.k === 'ch' ? F.bold : F.regular, coul:l.g ? C.G : C.N }];
      const celArt = (l) => { const gr = !!l.g, ton = gr ? C.G : C.N; return [{ t:l.n, coul:ton }, { t:lignesDe(l.x || '', F.light, wD - 4, 2), coul:ton }, { t:l.q, coul:ton }, { t:l.u, coul:ton },
        ...E2.flatMap((e, j) => { const v = l.c[i0 + j] || {}, fd = v.b ? JAUNE : null; return [{ t:v.p, coul:ton, fond:fd }, { t:v.m, f:gr || v.i ? F.light : F.regular, coul:gr ? C.G : v.i ? C.N : C.R, fond:fd }]; })]; };
      titre('Détail des articles' + suite); teteD();
      LG.forEach((l, n) => {
        if(l.k === 'ch' || l.k === 'ti'){
          /* titres gardés avec la première ligne d'article qui suit */
          let h = 0, k = n; while(k < LG.length && (LG[k].k === 'ch' || LG[k].k === 'ti')){ h += hauteur(celTitre(LG[k])); k++; } if(k < LG.length && LG[k].k === 'ar') h += hauteur(celArt(LG[k]));
          if(l === LG[n] && (n === 0 || (LG[n - 1].k !== 'ch' && LG[n - 1].k !== 'ti')) && y - h < Z.bas && h < Z.haut - Z.bas - 4 * PAS){ page(); teteD(); }
          ligneT(cL, celTitre(l), teteD); return; }
        if(l.k === 'to'){ ligneT(cD, [{}, { t:l.x, f:F.bold, coul:l.g ? C.G : C.N }, {}, {}, ...E2.flatMap((e, j) => [{}, l.g ? { t:l.c[i0 + j].m, f:F.bold, coul:C.G } : rouge(l.c[i0 + j].m, F.bold)])], teteD); y -= 5; return; }
        ligneT(cD, celArt(l), teteD);
      });
      const PD = Array.from(D.pied || []);
      y -= 8; if(y - (PD.length + 1) * PAS < Z.bas){ page(); teteD(); }
      PD.forEach(p => ligneT(cD, [{}, { t:lignesDe(p.x, p.f ? F.bold : F.regular, wD - 4, 2), f:p.f ? F.bold : F.regular }, {}, {}, ...E2.flatMap((e, j) => { const v = p.c[i0 + j] || {}; return [{ t:v.p || '' }, rouge(v.m || '', p.f ? F.bold : F.regular)]; })], teteD));
      if(ib < bandes.length - 1) page();
    });
    y -= 12; const LEG = cx.couper(P(D.legende || ''), F.light, T, X1 - X0); if(y - LEG.length * PAS < Z.bas) page();
    LEG.forEach((l, k) => cx.texte(l, X0, y - k * PAS, { police:F.light, taille:T, couleur:C.G }));
    cx.y = y - LEG.length * PAS;
  };
  /* cahier de soumission (bloc 44, 07.11.2026, Paulo : « voici à quoi ressemble le cahier complet avec les conditions au départ et en dernier le cahier des charges ») :
     conditions de l'appel d'offres au papier des contrats — page de garde (sans en-tête), résumé de l'offre, généralités, organisation, site, régie, conditions techniques,
     annexes — mesures relevées sur le cahier 23JOG 250 Sanitaire du 06.11.2026 : corps 8.4, interligne 10.1, colonne 127.7, retrait 142, droite 517.4, bandes de
     section 29 → 518 sous l'en-tête, page de garde aux positions du modèle. o.cahier = { blocs:[{ t, x, b, r }], auto:{ garde, resume, orga }, annexes:{ sha:{ type } } }
     (textes déjà résolus par l'app) ; ctx.annexes = plans joints déjà intégrés (sgDsPdf, avant contenu). Puis le descriptif (o.descriptif) s'il y en a un. */
  const contenuCahier = (cx) => {
    const K = o.cahier, A = K.auto || {}, AN = cx.annexes || {}, T = 8.4, LD = 10.1, XL = 28.3, X = 127.7, XR = 142, XD = 517.4, BLANC = PDFLib.rgb(1, 1, 1);
    /* petits tirets et petits titres (import d'un PDF) : imprimés comme un tiret et comme une rubrique soulignée en Light */
    const BL = Array.from(K.blocs || []).map(b => b.t === 'pj' ? Object.assign({}, b, { t:'pu' }) : b.t === 'pjt' ? Object.assign({}, b, { t:'sou', pt:1 }) : b);
    const h = PAP.format.portrait.h, HAUT = h - 75.8, BAS = () => cx.Z.bas + 2, TITRES = ['sec','sou','gr'], TXT = new Set(['sec','sou','gr','txt','pu','kv','fl','cad']);
    let y = HAUT, prev = null, ouverte = false, aOuvrir = false;
    const P = (t) => prep(t == null ? '' : t);
    const page = (garde) => { sansEntete = !!garde; cx.nouvellePage('portrait'); sansEntete = false; y = HAUT; prev = null; ouverte = true; aOuvrir = false; };
    /* saut de page demandé : la page s'ouvre au prochain élément imprimé ; une section, une page de garde ou la fin du cahier n'ouvrent donc jamais de page blanche */
    const libre = () => !ouverte || aOuvrir;
    const L0 = (x0, yy, x1) => cx.ligne(x0, yy, x1, yy);
    const ecr = (t, x, yy, f, op) => cx.texte(P(t), x, yy, Object.assign({ police:f || F.light, taille:T }, op || {}));
    const couper = (t, f, w) => cx.couper(P(t), f || F.light, T, w);
    const num = (t) => /^(\d+[.)])\s+(.*)$/.exec(String(t || ''));
    /* espace avant un bloc (de la ligne de base précédente à la première ligne de base du bloc) */
    const avant = (b, p) => { const t = b.t;
      if(!p) return 0;
      if(p === 'ban') return t === 'sec' ? 25 : 40;
      if(p === 'garde') return 24.7;
      if(t === 'sec') return 30; if(t === 'sou') return p === 'sec' ? 40.6 : 26;
      if(t === 'gr') return p === 'sec' ? 32 : 23;
      if(t === 'kv') return p === 'kv' ? 18.8 : (p === 'gr' || p === 'txt') ? 16 : 24;
      if(t === 'fl') return p === 'fl' ? 20.7 : 20.4;
      if(t === 'pu') return p === 'pu' ? 12.4 : 14;
      if(t === 'cad') return 20; if(t === 'sig') return 62;
      if(t === 'txt'){ if(p === 'sou') return 30.7; if(p === 'gr') return 12.4; if(p === 'num' && b.r) return LD; if(p === 'num' && num(b.x)) return 20.4; return 23.1; }
      return 20; };
    const reste = (hh) => { if(libre()){ page(false); return; } if(y - hh < BAS()) page(false); };
    /* mise en ligne d'un bloc de texte : position, police, lignes coupées ; ligne numérotée : numéro à base − 5,7, texte à base + 14,3 (avec ou sans retrait) */
    const geo = (b) => { const t = b.t, base = b.r ? XR : X, nm = t === 'txt' ? num(b.x) : null, g = { base, x0:base, w:XD - base, fs:b.b ? F.regular : F.light, souligne:false, xNum:null, nm, texte:String(b.x || '') };
      if(t === 'sec'){ g.x0 = XL; g.fs = F.bold; g.souligne = true; g.w = XD - XL; }
      else if(t === 'sou'){ g.souligne = true; if(!b.pt){ g.x0 = base - 7.7; g.fs = F.bold; } }
      else if(t === 'pu'){ g.x0 = base + 10; g.w = XD - g.x0; }
      else if(t === 'fl'){ g.w = 447 - base - 8; }
      else if(t === 'cad'){ g.x0 = XR + 5; g.w = XD - XR - 10; }
      else if(nm){ g.xNum = base - 5.7; g.x0 = base + 14.3; g.w = XD - g.x0; g.texte = nm[2]; }
      if(t === 'kv'){ const i = g.texte.indexOf(' : '), lib = i < 0 ? g.texte : g.texte.slice(0, i), val = i < 0 ? '' : g.texte.slice(i + 3); g.LL = couper(lib, g.fs, 305 - base - 8); g.VV = couper(val, g.fs, XD - 305); }
      else { g.LL = couper(g.texte, g.fs, g.w); g.VV = []; }
      g.n = Math.max(g.LL.length, g.VV.length, 1); g.hh = (g.n - 1) * LD + (t === 'cad' ? 23 : 0); return g; };
    const G = BL.map(b => TXT.has(b.t) ? geo(b) : null);
    const apres = (i, p) => { const b = BL[i], g = G[i]; return g && g.nm ? 'num' : (b.t === 'txt' && b.r && p === 'num') ? 'num' : b.t; };
    /* place réservée par le résumé de l'offre : espace avant compris (après une rubrique 76,8, après un autre bloc 40) */
    const resumeH = (R, p) => { let hh = (p === 'sec' ? 76.8 : p ? 40 : 0) + 50.4 + 23.5; Array.from(R.lignes || []).forEach((c, i) => { hh += c.tva ? 18.9 : (i ? 20.4 : 18.5); if(!c.tva) hh += 23.5; }); return hh + 27.6 + 3; };
    /* plans joints : à la largeur de la colonne (482 pt), sans dépasser la page ni 160 % ; moins de 70 % de cette taille faute de place : page suivante */
    const hAnn = () => HAUT - 13 - BAS() - 4, hPlein = (a) => a.h * Math.min(482 / a.w, hAnn() / a.h, 1.6);
    /* place demandée par le début du bloc i (après p), pour garder un titre avec ce qui le suit */
    const debut = (i, p) => { const b = BL[i], t = b.t;
      if(t === 'auto') return b.x === 'entreprise' ? (p ? 24.2 : 0) + 7 * 25.9 + 4 : b.x === 'resume' ? resumeH(A.resume || {}, p) : b.x === 'orga' ? (p === 'ban' ? 40 : p ? 22 : 0) + 2 * 12.4 + 4 : 0;
      if(t === 'sig') return 62 + 12; if(t === 'annexe') return AN[b.sha] ? 13 + 0.7 * hPlein(AN[b.sha]) : 0;
      const g = G[i]; if(!g) return 0; return avant(b, p) + (t === 'cad' ? g.hh : (Math.min(2, g.n) - 1) * LD); };
    const suite = (i, p0) => { let hS = 0, j = i + 1, p = apres(i, p0); while(j < BL.length && TITRES.includes(BL[j].t)){ hS += avant(BL[j], p); p = apres(j, p); j++; } if(j < BL.length) hS += debut(j, p); return hS; };
    /* ── pièces remplies d'office ── */
    const garde = (g) => {
      page(true);
      let yy = h - 77.7;
      Array.from(g.rub || []).forEach(r => { ecr(r[0], X, yy, F.regular); L0(X, yy - 4.1, XD); couper(r[1], F.light, XD - X).slice(0, 2).forEach((l, k) => ecr(l, X, yy - 14.4 - k * LD)); yy -= 42.6; });
      const yb = yy + 10.3; L0(XL, yb, XD);
      let tz = 13.92; while(tz > 8 && cx.largeur(P(g.titre || ''), F.bold, tz) > XD - X) tz -= 0.25;
      cx.texte(P(g.cfc || ''), 74.5, yb - 19.7, { police:F.bold, taille:13.92 }); cx.texte(P(g.titre || ''), X, yb - 19.7, { police:F.bold, taille:tz });
      L0(XL, yb - 28.8, XD);
      let yv = yb - 52.3;
      ecr('Montant total brut', X, yv, F.regular); ecr('Fr.', 352.8, yv, F.regular); L0(X, yv - 3.4, XD);
      yv -= 26; ecr('Montant total net', X, yv, F.regular); ecr('TVA incl.', 287, yv); ecr('Fr.', 352.8, yv, F.regular); L0(X, yv - 3.4, XD);
      Array.from(g.infos || []).forEach(r => { yv -= 26; const wl = ecr(r[0], X, yv); if(r[1]){ const dispo = XD - X - wl - 14; let tv = T; while(tv > 6 && cx.largeur(P(r[1]), F.regular, tv) > dispo) tv -= 0.2; cx.texte(P(r[1]), XD, yv, { police:F.regular, taille:tv, align:'d' }); } L0(X, yv - 3.4, XD); });
      y = yv; prev = 'garde'; };
    const entreprise = () => {
      const L = ['Nom de l’entreprise', 'Rue', 'NPA, lieu', 'Téléphone', 'Fax', 'Responsable', 'Lieu, date', 'Timbre & Signature'];
      reste(24.2 + (L.length - 1) * 25.9 + 4); let yy = y - (prev ? 24.2 : 0);
      L.forEach((l, k) => { if(k) yy -= 25.9; ecr(l, X, yy, F.regular); L0(X, yy - 3.4, XD); }); y = yy; prev = 'champs'; };
    const resume = (R) => {
      const lignesR = Array.from(R.lignes || []);
      reste(resumeH(R, prev)); let yy = y - (prev === 'sec' ? 76.8 : prev ? 40 : 0);
      ecr('CFC/ Travaux', XL, yy, F.bold); let tz = 13.92; const tt = (R.cfc ? R.cfc + '  ' : '') + (R.titre || ''); while(tz > 8 && cx.largeur(P(tt), F.bold, tz) > XD - 104.8) tz -= 0.25; cx.texte(P(tt), 104.8, yy, { police:F.bold, taille:tz });
      yy -= 50.4; ecr('déposée', 316.4, yy); ecr('contrôlée', 449.1, yy);
      const PTS = '...............................', fr = (v) => { ecr('Fr.', 267.6, v); ecr(PTS, 300.6, v); ecr('Fr.', 396.6, v); ecr(PTS, 429.8, v); };
      yy -= 23.5; ecr('Offre brute', 31.9, yy); fr(yy);
      lignesR.forEach((c, i) => {
        yy -= c.tva ? 18.9 : (i ? 20.4 : 18.5); ecr(c.lib, 31.9, yy);
        if(c.taux) cx.texte(P(c.taux), 214, yy, { police:F.light, taille:T, align:'d' }); else ecr('........... %', 177.1, yy);
        const plus = c.tva || c.signe === '+'; ecr(plus ? '+' : './.', plus ? 250 : 247.2, yy); fr(yy);
        if(!c.tva){ L0(286.6, yy - 6.9, 385.9); L0(417.4, yy - 6.9, 516.7); yy -= 23.5; fr(yy); } });
      yy -= 27.6; ecr(lignesR.some(c => c.tva) ? 'Offre nette (TVA incluse)' : 'Offre nette', 31.9, yy); fr(yy);
      y = yy; prev = 'resume'; };
    /* organisation du projet : libellé (≤ 81 pt), adresse (≤ 171 pt) et téléphone / courriel (jusqu'à la marge) coupés dans leur colonne */
    const orga = (O) => {
      const LIGNES = Array.from(O.lignes || []);
      LIGNES.forEach((r, k) => {
        const LB = r.lib ? couper(r.lib, F.light, 216 - 131 - 4) : [], V = Array.from(r.val || []).flatMap(l => couper(l, F.light, 393 - 216 - 6)), V2 = Array.from(r.val2 || []).flatMap(l => couper(l, F.light, XD - 393));
        const n = Math.max(1, LB.length, V.length, V2.length), hh = (n - 1) * 12.4, dy = prev ? (prev === 'ban' ? 40 : r.titre ? 26 : 22) : 0;
        reste(dy + hh + 4 + (!V.length && !V2.length && LIGNES[k + 1] ? 22 + 2 * 12.4 : 0)); if(prev) y -= (prev === 'ban' ? 40 : r.titre ? 26 : 22);   /* titre sans valeur (« Les mandataires : ») gardé avec la ligne suivante */
        LB.forEach((l, j) => { const w = ecr(l, 131, y - j * 12.4); if(r.sou) L0(131, y - j * 12.4 - 1.2, 131 + w); });
        V.forEach((l, j) => ecr(l, 216, y - j * 12.4)); V2.forEach((l, j) => ecr(l, 393, y - j * 12.4));
        y -= hh; prev = 'orga'; }); };
    const annexe = (b) => {
      const a = AN[b.sha]; if(!a) return;
      if(libre() || y - 13 - BAS() - 4 < 0.7 * hPlein(a)) page(false);
      const top = y - 13, hmax = top - BAS() - 4, s = Math.min(482 / a.w, hmax / a.h, 1.6); if(!(s > 0)) return;
      const w = a.w * s, hh = a.h * s, x0 = 33, r = a.page ? (a.rot || 0) : 0;
      if(a.page && r){   /* page tournée (/Rotate) : dessinée tournée, à sa place */
        const q = r === 90 || r === 270, pos = r === 90 ? [x0, top] : r === 180 ? [x0 + w, top] : [x0 + w, top - hh];
        cx.page.drawPage(a.obj, { x:pos[0], y:pos[1], width:q ? hh : w, height:q ? w : hh, rotate:PDFLib.degrees(-r) }); }
      else if(a.page) cx.page.drawPage(a.obj, { x:x0, y:top - hh, width:w, height:hh });
      else cx.page.drawImage(a.obj, { x:x0, y:top - hh, width:w, height:hh });
      y = top - hh; prev = 'annexe'; };
    /* ── blocs ── */
    BL.forEach((b, i) => {
      const t = b.t, pAv = prev;
      if(t === 'auto'){ if(b.x === 'garde') garde(A.garde || {}); else if(b.x === 'entreprise') entreprise(); else if(b.x === 'resume') resume(A.resume || {}); else if(b.x === 'orga') orga(A.orga || {}); return; }
      if(t === 'saut'){ if(ouverte) aOuvrir = true; return; }
      if(t === 'ban'){
        page(false); const m = /^([A-Z])\s*(\d*)\s+(.*)$/.exec(String(b.x || '').trim()), le = m ? m[1] : '', ch = m ? m[2] : '', ti = m ? m[3] : String(b.x || '');
        const LT = cx.couper(P(ti), F.bold, 11.52, 518 - 53 - 6), top = h - 67.7, hb = 17.7 + (LT.length - 1) * 13.7;
        cx.rect(29, top - hb, 489, hb, { fond:C.N });
        if(le) cx.texte(le, 32.4, top - 13.2, { police:F.bold, taille:11.52, couleur:BLANC }); if(ch) cx.texte(ch, 40.5, top - 13.2, { police:F.bold, taille:11.52, couleur:BLANC });
        LT.forEach((l, k) => cx.texte(l, 53.4, top - 13.2 - k * 13.7, { police:F.bold, taille:11.52, couleur:BLANC }));
        y = top - hb; prev = 'ban'; return; }
      if(t === 'annexe'){ annexe(b); return; }
      if(t === 'sig'){
        reste(62 + 12); y -= prev ? 62 : 0; ecr('.......................................................', XR, y); ecr('..............................................................................', 347, y);
        ecr('Date', XR, y - 10.3); ecr(b.x || 'Le soumissionnaire (timbre et signature)', 347, y - 10.3); y -= 10.3; prev = 'sig'; return; }
      const g = G[i]; if(!g) return;
      const cad = t === 'cad', hU = HAUT - BAS();
      let d = avant(b, prev), besoin = d + g.hh;
      if(TITRES.includes(t)) besoin += suite(i, prev);   /* titre gardé avec les titres suivants et le début du bloc qui suit */
      if(cad && BL[i + 1] && BL[i + 1].t === 'sig') besoin += 62 + 12;   /* encadré (déclaration) gardé avec sa signature */
      if(besoin > hU) besoin = d + (cad ? 23 : 0) + LD;   /* plus haut qu'une page : il commence ici et continue page après page */
      if(libre() || y - besoin < BAS()){ page(false); d = 0; }
      if(cad){   /* encadré : fermé en bas de page et rouvert sur la suivante s'il est plus long qu'une page */
        let top = y - d + 4, yl = top - 15;
        for(let j = 0; j < g.n; j++){
          if(j){ if(yl - LD - 7.7 < BAS()){ cx.rect(XR, yl - 7.7, XD - XR, top - (yl - 7.7), { bord:C.N }); page(false); top = y + 4; yl = top - 15; } else yl -= LD; }
          ecr(g.LL[j] || '', g.x0, yl, g.fs); }
        const bot = yl - 7.7; cx.rect(XR, bot, XD - XR, top - bot, { bord:C.N }); y = bot; prev = 'cad'; return; }
      y -= d;
      if(g.xNum != null) ecr(g.nm[1], g.xNum, y, g.fs);
      if(t === 'pu') ecr('–', g.base, y, g.fs);
      const xL = t === 'kv' ? g.base : g.x0;
      for(let j = 0; j < g.n; j++){ if(j){ y -= LD; if(y < BAS()) page(false); }
        if(g.LL[j]){ const wd = ecr(g.LL[j], xL, y, g.fs); if(g.souligne) L0(xL, y - 1.2, xL + wd); } if(g.VV[j]) ecr(g.VV[j], 305, y, g.fs); }
      if(t === 'fl') L0(447, y - 3, XD);
      prev = apres(i, pAv); });
    if(!ouverte) page(false);
    cx.y = y;
  };
  /* devis général (bloc 46, 07.11.2026, Paulo : « voici à quoi devrait ressembler le DG pdf », 23JOG-DG_TRAVAIL_20260417.pdf de l'ancien logiciel) : A4 paysage au papier des
     contrats ; pages du livret calculées par le moteur (ch02bBook : page de garde, information, récapitulatif à 2 chiffres, document principal, total), dessinées ici aux mesures
     relevées sur la référence : en-tête du tableau 8 pt entre deux filets, rangées de 15 pt, 1 et 2 chiffres en gras 10 pt, positions 9 pt, détails 8 pt, une rangée sur deux
     sur fond gris (232), filet noir au-dessus des CFC à 1 chiffre et du total ; textes trop longs coupés par « … ». o.livretDG = { couverture:{ titre, marge, rub:[[libellé, valeur]],
     sig:[titre] }, pages:[{ type 0 garde | 3, 4 information | 1, 2 tableau, titre, cols:[{ t, w, r }], rows:[{ c:[…], s }] }], st:{ s:{ z, b } }, zebra } */
  const contenuLivret = (cx) => {
    const D = o.livretDG, ORI = D.orientation === 'portrait' ? 'portrait' : 'paysage', H = PAP.format[ORI].h, T = (v) => H - v,   /* paysage (défaut) ou portrait (08.11.2026) : même papier, même logo, même pied */ GRIS = PDFLib.rgb(0.91, 0.91, 0.91), FIL = PDFLib.rgb(0.8, 0.8, 0.8);
    const NUIT = PDFLib.rgb(0, 0.2, 0.2745), FILN = PDFLib.rgb(0.847, 0.847, 0.831), GRT = PDFLib.rgb(0.439, 0.435, 0.435), BLANC = PDFLib.rgb(1, 1, 1);   /* bleu nuit #003346, filet #d8d8d4, gris #706F6F de la charte */
    const P = (t) => prep(t == null ? '' : t);
    const police = (s) => { const x = (D.st || {})[s] || {}; return { f: x.b ? F.bold : F.light, z: +x.z || 9 }; };
    const ell = (f) => aGlyphe(f, 0x2026) ? '…' : '...';
    /* texte coupé à la largeur de la cellule, fin « … » (comme l'original) */
    const ajuste = (t, f, z, w) => { let s = P(t); if(cx.largeur(s, f, z) <= w) return s; const e = ell(f); while(s && cx.largeur(s.trimEnd() + e, f, z) > w) s = s.slice(0, -1); return s ? s.trimEnd() + e : ''; };
    const page = (titre, sansNum) => {
      titreBrut = nettoyer(titre || titreDocument); titreDoc = maj(titreBrut);
      cx.nouvellePage(ORI); if(sansNum) cx.pages[cx.pages.length - 1].nonum = true;
    };
    /* page de garde : titre et marge d'approximation, rubriques soulignées, signatures (positions de la référence, mesurées depuis le haut) */
    const garde = (G) => {
      const XG = 124.4, XD2 = 485.5;
      const mg = G.marge ? ajuste(G.marge, F.bold, 12, 150) : '', lm = mg ? cx.largeur(mg, F.bold, 12) + 16 : 0;   /* marge limitée à 150 pt ; titre réduit jusqu'à 8 pt puis coupé : jamais l'un sur l'autre */
      let tz = 12; while(tz > 8 && cx.largeur(P(G.titre || ''), F.bold, tz) + lm > XD2 - XG) tz -= 0.25;
      cx.texte(ajuste(G.titre || '', F.bold, tz, XD2 - XG - lm), XG, T(152), { police:F.bold, taille:tz });
      if(mg) cx.texte(mg, XD2, T(152), { police:F.bold, taille:12, align:'d' });
      if(G.filtre) cx.texte(ajuste(G.filtre, F.regular, 8, XD2 - XG), XG, T(170), { police:F.regular, taille:8 });   /* montants partiels (filtre des ouvrages) */
      cx.ligne(XG, T(156.5), XD2, T(156.5));
      Array.from(G.rub || []).forEach((r, i) => { const y = 230 + i * 42;
        cx.texte(P(r[0]), XG, T(y), { police:F.regular, taille:8 }); cx.ligne(XG, T(y + 3.5), XD2, T(y + 3.5));
        cx.couper(P(r[1] || ''), F.light, 8, XD2 - XG).slice(0, 2).forEach((l, k) => cx.texte(l, XG, T(y + 15 + k * 10), { police:F.light, taille:8 })); });
      Array.from(G.sig || []).forEach((s, i) => { const y = 426 + i * 58;
        cx.texte(P(s), XG, T(y), { police:F.regular, taille:8 });
        cx.texte('Lieu, date', XG, T(y + 22), { police:F.light, taille:8 }); cx.ligne(XG + 50, T(y + 23), 296, T(y + 23));
        cx.texte('Tampon,', 312, T(y + 12), { police:F.light, taille:8 }); cx.texte('signature', 312, T(y + 22), { police:F.light, taille:8 }); cx.ligne(352, T(y + 23), XD2, T(y + 23)); });
    };
    /* tableau d'une page : x des colonnes depuis la marge gauche ; rangées de rh pt dès 125 pt du haut */
    const tableau = (pg) => {
      const X0 = !(pg.type === 3 || pg.type === 4) && D.x0Tab != null ? +D.x0Tab : D.x0 != null ? +D.x0 : cx.Z.x0, cols = Array.from(pg.cols || []),   /* tableaux : D.x0Tab (devis général : x 125.72) ; Information : D.x0 */   /* portrait : tableau à la marge de l'en-tête et du pied (x 28.35), comme le paysage */ rh = +D.rh || 15, info = pg.type === 3 || pg.type === 4, W = cols.reduce((s, c) => s + (+c.w || 0), 0);
      const nuit = D.style === 'nuit' && !info, jPct = cols.findIndex(c => c.pct || /%/.test(String(c.t || '')));
      /* D.aligne : textes des colonnes à gauche sans retrait, à l'aplomb des colonnes du pied (CFC x 28.35 ; en portrait, Texte x 125.72) ; bandes et filets 2 pt plus à gauche */
      const al = D.aligne === true && !info, ins = al ? 0 : 2, XB = al ? X0 - 2 : X0, WB = al ? W + 2 : W;   /* variante « Bleu nuit » (choisie par Paulo le 08.11.2026) ; colonne [%] */
      const dI = info ? (+D.infoDx || 0) : 0;   /* page Information : contenu décalé (libellés et texte sur les 2e et 3e colonnes du pied) ; titre et filet à la marge */
      let x = X0 + dI; const pos = cols.map(c => { const r = { x, w:+c.w || 0, r:!!c.r }; x += r.w; return r; });
      if(info){ if(D.infoGarde){ cx.texte(P(String(D.infoTitre || 'Information').toUpperCase()), X0 + dI, T(101), { police:F.regular, taille:8 }); cx.ligne(X0 + dI, T(104.5), X0 + W + dI, T(104.5)); }   /* aligné sur les libellés (x 125.72) */   /* titre au dessin des rubriques de la page de garde : Regular 8 capitales, filet noir (Paulo, 08.11.2026) */
        else { cx.texte(P(D.infoTitre || 'Information'), X0, T(101), { police:F.regular, taille:+D.corpsTitres || 9 }); cx.ligne(X0, T(108.5), X0 + W + dI, T(108.5), { couleur:FIL }); } }   /* titre souligné d'un filet gris (modèle 24PRC) */
      else if(nuit){   /* variante « Bleu nuit » : titres des colonnes en blanc sur une bande bleu nuit */
        cx.rect(XB, T(116.5), WB, 16, { fond:NUIT });
        cols.forEach((c, j) => { const p = pos[j]; if(!p.w) return; const zc = +D.corpsTitres || 7.5, t = ajuste(c.t, F.regular, zc, p.w - 4); cx.texte(t, p.r ? p.x + p.w - 2 : p.x + ins, T(111.2), { police:F.regular, taille:zc, couleur:BLANC, align:p.r ? 'd' : 'g' }); });   /* titres des colonnes : D.corpsTitres (devis général : 8 pt) */
      }
      else {
        cx.ligne(X0, T(100.5), X0 + W, T(100.5));
        cols.forEach((c, j) => { const p = pos[j]; if(!p.w) return; const t = ajuste(c.t, F.light, 8, p.w - 4); cx.texte(t, p.r ? p.x + p.w - 2 : p.x + 2, T(110), { police:F.light, taille:8, align:p.r ? 'd' : 'g' }); });
        cx.ligne(X0, T(116.5), X0 + W, T(116.5));
      }
      let y = info ? 121 : 122;
      const RG = Array.from(pg.rows || []), plein = r => !!r && Array.from(r.c || []).some(v => String(v == null ? '' : v).trim()), det = r => { const x = String((r || {}).s || 'S'); return x === 'D' || x === 'X'; };
      /* Bleu nuit — bloc = une rangée de tête et ce qui la continue : ses lignes de calcul et son descriptif (D, X), la suite d'un texte passé à la ligne (k), ses ouvrages
         (rangée S à CFC vide) ; les rangées D / X vides (paragraphe vide d'un descriptif) n'interrompent pas le bloc, une rangée vide (E) le ferme. Un seul filet, sous la
         dernière rangée du bloc, bleu nuit si sa tête est un CFC à 1 chiffre (O, F), gris sinon (relecture du 08.11.2026). */
      const suiteDe = r => plein(r) && (det(r) || !!r.k || (String(r.s || 'S') === 'S' && !String((r.c || [])[0] == null ? '' : r.c[0]).trim()));
      const prochaine = i => { let j = i + 1; while(j < RG.length && !plein(RG[j]) && det(RG[j])) j++; return RG[j]; };
      let tete = 'S', enBloc = false, calDeb = null, calFin = null, dernierPlein = -1; RG.forEach((r, i) => { if(plein(r)) dernierPlein = i; });   /* dernière rangée écrite de la page : pas de filet gris dessous (Paulo, 08.11.2026 : « supprimer la ligne lorsqu'il n'y a plus de texte en dessous ») */
      const calT = r => !!(r && r.cal) && String(((r.c || [])[1]) == null ? '' : r.c[1]).trim() !== '';   /* rangée de calcul écrite dans la colonne Texte (relecture du 08.11.2026) */
      const CR = +D.calRetrait || 0;   /* hiérarchie « Filet de calcul » (devis général, variante E du 08.11.2026) : lignes de calcul (r.cal) en retrait derrière un filet vertical bleu nuit ; descriptif (X) et quantités (r.q) en italique, montants du calcul en italique */
      RG.forEach((r, i) => {
        const s = String(r.s || 'S'), pol = police(s), c = Array.from(r.c || []), pl = plein(r);
        if(pl && !(enBloc && suiteDe(r))) tete = s; enBloc = pl || (enBloc && det(r));
        if(D.zebra && !info && !nuit && i % 2 === 0) cx.rect(X0, T(y + rh), W, rh, { fond:GRIS });   /* une rangée sur deux (modèle 24PRC) ; plus sur la page Information (demande de Paulo, 08.11.2026) */
        if(!info && !nuit && !r.k && (s === 'O' || s === 'F' || s === 'T') && pl) cx.rect(X0, T(y) - 0.375, W, 0.75, { fond:C.N });
        if(nuit && s === 'T' && pl) cx.rect(XB, T(y + rh), WB, rh, { fond:NUIT });   /* total : bande bleu nuit, texte blanc */
        /* Bleu nuit : un filet fin sous chaque position, après ses lignes de calcul et son descriptif (rien entre une position et ses détails) ; filet bleu nuit sous les CFC à 1 chiffre */
        if(nuit && pl && s !== 'T' && tete !== 'T' && !suiteDe(prochaine(i))){ if(tete === 'O' || tete === 'F') cx.rect(XB, T(y + rh) - 0.375, WB, 0.75, { fond:NUIT }); else if(i < dernierPlein) cx.rect(XB, T(y + rh) - 0.25, WB, 0.5, { fond:FILN }); }   /* filets épaissis (Paulo, 08.11.2026 : « épaissir légèrement les lignes ») : gris 0,5 pt, bleu nuit 0,75 pt — en aplat, ligne() plafonne à 0,25 pt */
        const coul = !nuit ? undefined : s === 'T' ? BLANC : det(r) ? GRT : (s === 'O' || s === 'F') ? NUIT : undefined;   /* CFC à 2 chiffres (W) en noir (Paulo, 08.11.2026) */
        const base = y + rh - 4;
        cols.forEach((col, j) => { const p = pos[j], v = c[j]; if(!p.w || v == null || String(v) === '') return;
          let ext = 0; if(D.deborde === true && !p.r) for(let k = j + 1; k < pos.length && pos[k].w && !pos[k].r && !String(c[k] == null ? '' : c[k]).trim(); k++) ext += pos[k].w;   /* débordement sur les colonnes de texte vides à droite (D.deborde) ; le devis général passe ensuite à la ligne (dgOctets, etaler) : rien n'est coupé */
          const pf = info && r.lib ? F.light : info && j === 0 && cols.length > 1 ? F.bold : (r.cf && r.cf[j]) ? ({ r:F.regular, b:F.bold, l:F.light })[r.cf[j]] || pol.f : (CR && !info && (s === 'X' || (r.q && j === 1) || (r.cal && p.r))) ? F.lightItalic : pol.f;
          const rt = CR && r.cal && j === 1 && !info ? CR : 0;   /* Information : libellés en gras ; r.cf : graisse propre à une cellule (portrait : niveau d'un montant) */
          const cl = nuit && j === jPct && s !== 'T' && s !== 'W' && !det(r) ? NUIT : coul;   /* Bleu nuit : pourcentages en bleu nuit */
          const dispo = p.w - 2 - ins - rt + (cx.largeur(P(v), pf, pol.z) > p.w - 2 - ins - rt ? ext : 0), lw = cx.largeur(P(v), pf, pol.z);
          const zz = D.deborde === true && lw > dispo && lw <= dispo * 1.08 ? pol.z * dispo / lw : pol.z;   /* écart de mesure de quelques points : corps à peine réduit plutôt que texte coupé */
          const t = ajuste(v, pf, zz, dispo); if(t) cx.texte(t, p.r ? p.x + p.w - 2 : p.x + (info ? 0 : ins) + rt, T(base), Object.assign({ police:pf, taille:zz, align:p.r ? 'd' : 'g' }, cl ? { couleur:cl } : {})); });   /* Information : sans retrait, colonnes du pied */
        if(CR && !info && pos[1]){ if(calT(r)){ if(calDeb == null) calDeb = y; calFin = y; }
          if(!(r.cal && RG[i + 1] && RG[i + 1].cal)){ if(calDeb != null){ const h0 = (calFin + rh - 3) - (calDeb + 3); if(h0 > 0) cx.rect(pos[1].x + ins, T(calFin + rh - 3), 0.75, h0, { fond:NUIT }); } calDeb = calFin = null; } }   /* filet vertical bleu nuit 0,75 pt devant le calcul, à l'aplomb du texte, 3 pt en retrait en haut et en bas ; coupé en fin de page */
        if(info && !D.zebra && !D.style) cx.ligne(X0, T(y + rh + 0.5), X0 + W, T(y + rh + 0.5), { couleur:FIL });
        if(info && r.lib && pos[0]) cx.ligne(pos[0].x, T(y + rh - 0.5), pos[0].x + pos[0].w, T(y + rh - 0.5));   /* libellé souligné d'un filet, comme les rubriques de la page de garde (08.11.2026) */   /* page Information du Bleu nuit : ni grisé ni filets (demande du 08.11.2026) */
        y += rh; });
    };
    Array.from(D.pages || []).forEach(pg => {
      page(pg.titre, pg.type === 0);
      if(pg.type === 0) garde(D.couverture || {}); else tableau(pg);
    });
    if(!cx.pages.length) page(titreDocument, false);
    cx.y = cx.Z.bas;
  };
  /* ── Devis descriptif au dessin du descriptif du bureau (modèle 17QUE_DESCRIPTIF_230619 ; Paulo, 08.11.2026 : « voici à quoi doit ressembler le descriptif,
     reproduis celui-ci ici ») — o.descDG = { couverture:{ statut, rub:[[libellé, valeur]], date, titre:[lignes], sig:[libellés] }, blocs:[{ t:'h', n, txt, niv 1|2|3, mt }
     | { t:'txt'|'sub'|'lib'|'ouv'|'vide', txt, mt }], montants } ; positions relevées sur le modèle (pt depuis le haut, portrait) ── */
  const contenuDescDG = (cx) => {
    const D = o.descDG || {}, H = PAP.format.portrait.h, T = (v) => H - v, P = (t) => prep(t == null ? '' : t);
    const ROUGE = PDFLib.rgb(1, 0.18, 0.09), XL = 205.5, XV = 210.5, XN = 122.4, XT = 128.8, XF0 = 85.0, XF1 = 510.2, XM = 510.2, MT = !!D.montants;
    const WT = (MT ? 440 : 500) - XT, WTX = 500 - XT, HAUT_T = 96, HAUT_H = 114, BAS = 765;
    const filet = (y, ep) => cx.rect(XF0, T(y) - ep / 2, XF1 - XF0, ep, { fond:C.N });
    /* page de garde */
    const G = D.couverture || {}; cx.nouvellePage('portrait');
    if(G.statut) cx.texte(P(G.statut), XV, T(201), { police:F.bold, taille:31, couleur:ROUGE });
    Array.from(G.rub || []).forEach((r, i) => { const y = 251 + i * 22; cx.texte(P(r[0]), XL, T(y), { police:F.light, taille:8, align:'d' });
      cx.couper(P(r[1] || ''), F.regular, 8, XF1 - XV).slice(0, 2).forEach((l, k) => cx.texte(l, XV, T(y + k * 10), { police:F.regular, taille:8 })); });
    if(G.date) cx.texte(P(G.date), XL, T(431), { police:F.bold, taille:11, align:'d' });
    let yt = 431; Array.from(G.titre || []).forEach(l => { cx.couper(P(l), F.bold, 11, XF1 - XV).forEach(m => { if(yt < 560){ cx.texte(m, XV, T(yt), { police:F.bold, taille:11 }); yt += 17; } }); });
    Array.from(G.sig || []).forEach((sg, i) => { const y = 617 + i * 92; cx.texte(P(sg), 213.5, T(y), { police:F.light, taille:8 });
      cx.texte('Lieu, date', 213.5, T(y + 33), { police:F.light, taille:8 }); cx.texte('Signature', 379.7, T(y + 33), { police:F.light, taille:8 }); });
    /* corps : rangées à poser, avec leur hauteur et l'écart avant elles */
    const L = []; let prec = null;
    Array.from(D.blocs || []).forEach(b => {
      if(b.t === 'h'){ while(L.length && L[L.length - 1].k === 'vide') L.pop();   /* pas de ligne vide avant un titre : l'écart du titre suffit (modèle) */
        const bold = b.niv <= 2, f = bold ? F.bold : F.regular, ls = cx.couper(P(String(b.txt || '').toLocaleUpperCase('fr')), f, 8, WT);
        const gap = prec === 'h' ? 17 : b.niv === 1 ? 39 : b.niv === 2 ? 37 : 22;
        L.push({ k:'h', b, f, ls, gap, h:(ls.length - 1) * 10 }); prec = 'h'; return; }
      if(b.t === 'vide'){ if(prec === 'txt' && L.length && L[L.length - 1].k !== 'vide') L.push({ k:'vide', gap:9, h:0 }); return; }
      const sub = b.t === 'sub', lib = b.t === 'lib' || b.t === 'ouv', f = sub || lib ? F.regular : F.light, z = sub ? 8 : 7.5;
      cx.couper(P(b.txt || ''), f, z, b.t === 'ouv' && MT ? WT : WTX).forEach((l, i) => {
        const gap = i ? 9 : (prec === 'h' ? 12 : prec === 'vide' ? 9 : 9);
        L.push({ k:'txt', l, f, z, sub, gap, h:0, mt:i === 0 ? b.mt : '' }); prec = 'txt'; });
    });
    /* mise en pages : un titre n'est jamais seul en bas de page (gardé avec ses deux lignes suivantes) */
    let y = null; const nouvelle = () => { cx.nouvellePage('portrait'); y = null; };
    nouvelle();
    L.forEach((it, i) => {
      if(it.k === 'vide'){ if(y != null) y += it.gap; return; }
      const debut = (k) => k === 'h' ? HAUT_H : HAUT_T;
      let yy = y == null ? debut(it.k) : y + it.gap;
      if(it.k === 'h'){ let besoin = yy + it.h; for(let j = i + 1, n = 0; j < L.length && n < 2; j++){ if(L[j].k === 'vide') continue; besoin += L[j].gap + L[j].h; n++; if(L[j].k === 'h') break; }
        if(y != null && besoin > BAS){ nouvelle(); yy = HAUT_H; } }
      else if(yy + it.h > BAS){ nouvelle(); yy = HAUT_T; }
      if(it.k === 'h'){ const b = it.b, f = it.f;
        if(b.niv === 1) filet(yy - 12.7, 0.75);
        cx.texte(P(b.n || ''), XN, T(yy), { police:f, taille:8, align:'d' });
        it.ls.forEach((l, k) => cx.texte(l, XT, T(yy + k * 10), { police:f, taille:8 }));
        if(MT && b.mt) cx.texte(P(b.mt), XM, T(yy), { police:f, taille:8, align:'d' });
        if(b.niv === 1) filet(yy + it.h + 4.3, 0.75);
        y = yy + it.h; }
      else { cx.texte(it.l, XT, T(yy), { police:it.f, taille:it.z });
        if(it.sub) cx.rect(XT, T(yy + 0.4) - 0.2, cx.largeur(it.l, it.f, it.z), 0.4, { fond:C.N });
        if(MT && it.mt) cx.texte(P(it.mt), XM, T(yy), { police:F.light, taille:7.5, align:'d' });
        y = yy; }
    });
  };
  const contenu = (cx) => {
    if(o.descDG){ contenuDescDG(cx); return; }
    if(o.livretDG){ contenuLivret(cx); return; }
    if(o.cahier){ contenuCahier(cx); if(o.descriptif) contenuDescriptif(cx); return; }
    if(o.comparatif){ contenuComparatif(cx); return; }
    if(o.descriptif){ contenuDescriptif(cx); return; }
    if(Array.isArray(o.epreuve)){
      /* épreuve du papier : pages vides aux orientations demandées (zone utile tracée) */
      o.epreuve.forEach((ori, i) => {
        cx.nouvellePage(ori);
        cx.texte(titreDoc, cx.Z.x0, cx.Z.haut - 30, { police:F.bold, taille:8 });
        cx.texte('Page d’épreuve ' + (i + 1) + ' — ' + ori, cx.Z.x0, cx.Z.haut - 44, { police:F.light, taille:8 });
        /* repli de glyphes : caractères absents de Light et Bold */
        cx.texte('Repli Light : | @ _ " ² º · (U+00A0 :\u00A0:)', cx.Z.x0, cx.Z.haut - 58, { police:F.light, taille:8 });
        cx.texte('Repli Bold : | @ _ " ² º ·', cx.Z.x0, cx.Z.haut - 72, { police:F.bold, taille:8 });
      });
      return;
    }
    /* sections visibles, triées (svDpHTML) ; aucune visible : document vide d'une page */
    const secs = tab(rep && rep.sections).filter(s => s && s.isVisible !== false).slice().sort(so);
    /* B7. exemplaires avec données (o.jobs, préparés par l'app : sg3_impressions.js) : chacun sur ses pages, avec son titre, son
       sous-titre (affaire) et sa date dans l'en-tête, logo noir sur sa première page, numérotation propre « n | total » */
    tab(jobs).forEach((J, ji) => {
      if(J){
        titreBrut = nettoyer(J.titre != null && J.titre !== '' ? J.titre : titreDocument);
        titreDoc = maj(titreBrut); sousTitre = J.sousTitre ? maj(J.sousTitre) : (o.sousTitre ? maj(o.sousTitre) : '');
        ligneDate = maj(o.lieu || PAP.lieu) + ' - ' + dateFR(J.date || o.date);
        cx.job = ji; cx.debutJob = cx.pages.length;
      }
      const sections = secs.map(s => { const ori = orienter(s); return { ori, blocs: blocsSection(s, ori, J) }; });
      if(!sections.length) sections.push({ ori: 'portrait', blocs: [] });
      const pages = paginer(sections);
      pages.forEach((p, i) => {
        cx.nouvellePage(p.ori);
        const info = { n: i + 1, tot: pages.length };
        p.items.forEach(it => { try{ it.b.dessiner(cx.page, it.y, info); }catch(e){ alerte('Dessin : ' + (e && e.message || e)); } });
      });
    });
  };

  /* exemplaires : o.jobs = [{ titre, titreChamp, sousTitre, date, V:{ « f\u0001s » : texte }, T:{ clé _sgk du tableau : { tete, cols, rows } },
     I:{ nom : image « data:image/png|jpeg;base64,… » } }] ; sans o.jobs : un seul passage, champs en repères (Documents Substances) */
  const titreDocument = titreBrut;
  const jobs = Array.isArray(o.jobs) && o.jobs.length ? o.jobs : [null];
  for(const J of jobs){
    if(!J || !J.I) continue;
    J.img = {};
    for(const k of Object.keys(J.I)){
      const s = String(J.I[k] || '');
      try{ J.img[k] = /^data:image\/png/i.test(s) ? await doc.embedPng(octets(s)) : (/^data:image\/jpe?g/i.test(s) ? await doc.embedJpg(octets(s)) : null); }
      catch(e){ alerte('Image « ' + k + ' » illisible : ' + (e && e.message || e)); }
    }
  }
  /* plans joints du cahier de soumission (bloc 44) : intégrés avant le dessin — première page d'un PDF, ou image PNG / JPEG */
  if(o.cahier && o.cahierFichiers){ ctx.annexes = {};
    for(const k of Object.keys(o.cahierFichiers)){ const by = o.cahierFichiers[k], ty = String(((o.cahier.annexes || {})[k] || {}).type || '');
      try{ if(/pdf/i.test(ty)){   /* première page, à sa zone visible (CropBox) et dans son sens d'affichage (/Rotate) */
          const src = await PDFLib.PDFDocument.load(by), p0 = src.getPage(0), cb = p0.getCropBox(), rot = (((p0.getRotation().angle || 0) % 360) + 360) % 360, q = rot === 90 || rot === 270;
          const pg = await doc.embedPage(p0, { left:cb.x, bottom:cb.y, right:cb.x + cb.width, top:cb.y + cb.height });
          ctx.annexes[k] = { obj:pg, w:q ? pg.height : pg.width, h:q ? pg.width : pg.height, page:true, rot:[90, 180, 270].includes(rot) ? rot : 0 }; }
        else { const im = /png/i.test(ty) ? await doc.embedPng(by) : await doc.embedJpg(by); ctx.annexes[k] = { obj:im, w:im.width, h:im.height, page:false }; } }
      catch(e){ alerte('Plan joint illisible : ' + (e && e.message || e)); } } }
  contenu(ctx);
  if(!ctx.pages.length) ctx.nouvellePage('portrait');

  /* ── Fin : numérotation « n | total » (le total n'est connu qu'ici), métadonnées, octets ── */
  /* par exemplaire (B7) : chaque lettre a sa propre numérotation ; sans o.jobs, un seul exemplaire (job 0) */
  const tot = {}, rang = {};
  ctx.pages.forEach(p => { tot[p.job] = (tot[p.job] || 0) + 1; });   /* page sans numéro (garde du devis général, bloc 46) : comptée, mais son numéro n'est pas écrit — la page 2 porte « 2 | n » (Paulo, 08.11.2026 : « commencer la numérotation par le 2 à la page 2 ») */
  /* o.numDebut / o.numTotal / o.numTotalPlus : pages d'un document assemblé (cahier de soumission : conditions puis cahier des charges, numérotation continue) */
  ctx.pages.forEach(p => { rang[p.job] = (rang[p.job] || 0) + 1; if(p.nonum) return; numeroter(p.page, rang[p.job] + (+o.numDebut || 0), +o.numTotal || (tot[p.job] + (+o.numTotalPlus || 0))); });
  doc.setTitle(titreDocument);
  doc.setAuthor('Substances Architectes');
  doc.setCreator(o.jobs ? 'SUBGestion' : 'SUBGestion — Documents Substances');
  doc.setProducer('SUBGestion');
  doc.setSubject(nettoyer(o.description || ''));
  return await doc.save();
}

/* ═══ 30 (suite). Documents Substances — l'écran de l'app : Bibliothèque ▸ Documents Substances (agent 5, 25.10.2026) ═══
   Décisions de Paulo : un seul endroit, dans le chapitre Bibliothèque, nommé « Documents Substances » ; papier et mise en page des documents
   validés (le rendu est celui de sgDsPdf ci-dessus, inchangé) ; texte identique ; les rangées « Total… » restent.
   - Exécuté SEULEMENT dans SUBGestion 3 (SG_DOM et VIEWS présents) : hors de l'app (banc d'essai), le fichier se charge sans effet et
     n'ajoute que sgDsPdf. Tout ce qui suit est dans un bloc (const) : rien d'autre ne devient global, sauf window.SGDS (état de l'écran).
   - Écran `nx-docsub`, première entrée (tuile principale) du chapitre Bibliothèque, dans la palette ⌘K ; droits = ceux de Bibliothèque ▸
     Documents types (`nxCan('tpl-documents')` : profil d'accès sgVueOk et droit « design » de l'ancien logiciel).
   - À gauche : les documents types (DS.T.modeledocument, langue « fr » ou vide — même filtre que tpl-documents), rangés par famille (règles
     par début du type, SGDS_REGLES : même classement que l'inventaire de l'atelier), recherche, filtre par jeu (0 Général, 1 Affaires,
     2 SUBSTANCES), nombre de documents ; clavier ↑ ↓ (document précédent / suivant), Entrée (Ouvrir), « / » (recherche).
   - À droite : bandeau jaune (nom, famille, titre, jeu, d'où le document est imprimé), chiffres (pages, format, champs à remplir, tableaux,
     taille), Ouvrir (visionneuse sgVisionneuse), Télécharger (.pdf, nom lisible), Imprimer ; aperçu des pages par pdf.js du cadre
     Facturation sur des canevas (pdf.destroy() après le rendu ; en Studio nocturne, les canevas sont soustraits à l'inversion par la règle
     commune des visuels).
   - PDF produit à la demande, gardé en mémoire (SGDS.cache, par document et par jour) : ressources du cadre Facturation (fxEnsure : pdf-lib,
     fontkit, polices Akkurat AKKU_*, gabarits OFFRE_TMPL et FA_TMPL), fonction recréée DANS le domaine du cadre (sinon pdf-lib refuse les
     tableaux d'un autre domaine) ; mêmes options que le banc d'essai (titre = reportTitle, date du jour, jeu, type, description).
   - Aucune écriture de données : seuls les réglages d'affichage sg3_docsub_sel (document choisi) et sg3_docsub_jeu (filtre) sont gardés
     dans localStorage (nxLS, try/catch). Styles : <style id="sg-docsub-css">, classes sgds-* (et bandeau / chiffres communs sgfh-*, nx-kpi). */
if(typeof SG_DOM!=='undefined'&&typeof VIEWS==='object'&&VIEWS){
  /* jeux de documents types (champ jeu) : libellé, abréviation de la pastille */
  const SGDS_JEUX={'0':['Général','GÉN'],'1':['Affaires','AFF'],'2':['SUBSTANCES','SUB']};
  const sgdsJeu=j=>{ const k=String(j==null?'':j); return SGDS_JEUX[k]||[k||'—',(k||'—').slice(0,3).toUpperCase()]; };
  /* familles, dans l'ordre de la liste ; règles par début du type (la première qui convient l'emporte) : [expression, famille, imprimé depuis] */
  const SGDS_FAMILLES=['Adresses','Affaires et maîtres d’ouvrage','Honoraires et factures','Contrats, encaissements et factures','Heures et notes de frais',
    'Heures et frais du projet','Équipe et temps de travail','Planification et marge','Séances et procès-verbaux','Projet : tâches et intervenants','Plans',
    'Lettres et courriers','Appels d’offres','Estimations et devis','Contrôle des coûts','Autres documents'];
  const SGDS_REGLES=[
    [/^(bankList|contact)/,'Adresses','Contacts'],
    [/^(managementBuilder|managementProject|projectList)/,'Affaires et maîtres d’ouvrage','Affaires ▸ listes, Administration'],
    [/^(projectContract|projectFeeCalculation|projectInvoice)/,'Honoraires et factures','Honoraires / Facturation (ancien)'],
    [/^management(Contracts|Invoice)/,'Contrats, encaissements et factures','Administration ▸ Facturation, Finances'],
    [/^(time|expensesReport)/,'Heures et notes de frais','Heures, Notes de frais'],
    [/^project(ProjectCost|TimeLog)/,'Heures et frais du projet','Administration ▸ Contrôle des heures / des frais'],
    [/^(managementStaff|managementTime|staff)/,'Équipe et temps de travail','Administration ▸ Équipe, RH'],
    [/^(managementPlanning|projectPlanningAnalyze)/,'Planification et marge','Administration ▸ Planification'],
    [/^projectMeeting/,'Séances et procès-verbaux','Projet ▸ séances'],
    [/^(projectMemberList|projectTask|projectTendererList)/,'Projet : tâches et intervenants','Projet ▸ tâches, intervenants'],
    [/^projectPlan(?!ning)/,'Plans','Projet ▸ plans'],
    [/^devis\w*Letter/,'Lettres et courriers','Appels d’offres ▸ soumissions'],
    [/^(projectDocument|projectNote)/,'Lettres et courriers','Projet ▸ notes et documents d’affaire'],
    [/^devis/,'Appels d’offres','Chantier ▸ Descriptifs & devis, Appels d’offres'],
    [/^(costEstimate|costPlanning)/,'Estimations et devis','Chantier ▸ Estimations, Calcul des coûts'],
    [/^costControl/,'Contrôle des coûts','Chantier ▸ Contrôle des coûts']];
  const sgdsFamille=d=>{ const r=SGDS_REGLES.find(x=>x[0].test(String(d.type||''))); return r?{t:r[1],imp:r[2]}:{t:'Autres documents',imp:''}; };
  const sgdsNorm=s=>String(s==null?'':s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const sgdsNom=d=>String(d.description||(d.report&&d.report.reportTitle)||d.type||d.id||'Document');
  const sgdsFichier=d=>(sgdsNom(d)+' ('+sgdsJeu(d.jeu)[0]+')').normalize('NFC').replace(/[\\\/:*?"<>|\x00-\x1f]+/g,'-').replace(/\s+/g,' ').trim().slice(0,120)+'.pdf';
  const sgdsN=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'’');
  const sgdsLs=(k,v)=>{ try{ if(v===undefined) return nxLS.get('sg3_docsub_'+k,null); nxLS.set('sg3_docsub_'+k,v); }catch(_){} return null; };
  const sgdsPermis=()=>{ try{ return typeof nxCan!=='function'||nxCan('tpl-documents'); }catch(_){ return false; } };
  const SGDS={ sel:sgdsLs('sel'), jeu:String(sgdsLs('jeu')||''), q:'', tok:0, att:null, docs:[], par:new Map(), cache:new Map(), res:null, w:null };
  window.SGDS=SGDS;

  /* ── documents types : même filtre que Bibliothèque ▸ Documents types ; tri par famille, nom, jeu ── */
  const sgdsCharger=()=>{ const L=Object.entries((DS.T&&DS.T.modeledocument)||{}).map(([id,v])=>Object.assign({},v,{id})).filter(v=>v.langue==='fr'||!v.langue);
    L.forEach(d=>{ d.fam=sgdsFamille(d); d.fi=SGDS_FAMILLES.indexOf(d.fam.t); });
    L.sort((a,b)=>a.fi-b.fi||sgdsNom(a).localeCompare(sgdsNom(b),'fr')||String(a.jeu).localeCompare(String(b.jeu))||String(a.id).localeCompare(String(b.id)));
    SGDS.docs=L; SGDS.par=new Map(L.map(d=>[String(d.id),d])); };
  const sgdsCherche=d=>{ if(!SGDS.q.trim()) return true; const t=sgdsNorm([sgdsNom(d),d.report&&d.report.reportTitle,d.fam.t,d.type].join(' '));
    return sgdsNorm(SGDS.q).split(/\s+/).filter(Boolean).every(x=>t.includes(x)); };
  const sgdsTableaux=d=>{ let n=0; const S=d.report&&Array.isArray(d.report.sections)?d.report.sections:[];
    S.forEach(s=>{ if(s&&s.isVisible!==false&&Array.isArray(s.bands)) s.bands.forEach(b=>{ if(b&&b.class==='TableBand') n++; }); }); return n; };

  /* ── PDF : ressources du cadre Facturation, fonction recréée dans son domaine, cache en mémoire ── */
  const sgdsRessources=()=>SGDS.res||(SGDS.res=(async()=>{ const w=await fxEnsure();
    if(!w||!w.PDFLib||!w.fontkit) throw new Error('pdf-lib ou fontkit absent du cadre Facturation.');
    const lire=n=>{ const v=w.eval('typeof '+n+'!=="undefined"?'+n+':null'); if(!v) throw new Error('ressource '+n+' absente du cadre Facturation.'); return v; };
    const copie=o=>w.JSON.parse(JSON.stringify(o||{}));
    const R={ PDFLib:w.PDFLib, fontkit:w.fontkit,
      polices:{ light:lire('AKKU_LIGHT'), regular:lire('AKKU_REGULAR'), bold:lire('AKKU_BOLD'), lightItalic:lire('AKKU_LIGHTITALIC') },
      gabarits:{ offre:lire('OFFRE_TMPL'), facture:lire('FA_TMPL') },
      styles:{ textstyleset:copie(DS.T&&DS.T.textstyleset), rowstyleset:copie(DS.T&&DS.T.rowstyleset) } };
    const fn=w.Function('return ('+sgDsPdf.toString()+')')();
    SGDS.w=w; return { w, R, fn }; })().catch(e=>{ SGDS.res=null; throw e; }));
  SGDS.ressources=sgdsRessources;   /* aussi pour les impressions avec données (bloc 31, sg3_impressions.js) */
  const sgdsCle=d=>String(d.id)+'|'+diso(new Date());
  const sgdsProduire=async d=>{ const k=sgdsCle(d); if(SGDS.cache.has(k)) return SGDS.cache.get(k);
    const { w, R, fn }=await sgdsRessources(), auj=new Date(), journal=new w.Array(), t0=performance.now();
    const o={ titre:d.report&&d.report.reportTitle, date:new w.Date(auj.getFullYear(),auj.getMonth(),auj.getDate()), jeu:d.jeu, type:d.type, description:d.description, journal };
    const b=new Uint8Array(await fn(R,d.report||null,o));
    const x={ b, ms:Math.round(performance.now()-t0), alertes:Array.from(journal), info:null };
    if(SGDS.cache.size>=80) SGDS.cache.delete(SGDS.cache.keys().next().value);
    SGDS.cache.set(k,x); return x; };

  /* ── écran ── */
  const sgdsMsg=(t,txt,err)=>'<div class="sgds-msg'+(err?' err':'')+'"><b>'+nxE(t)+'</b>'+(txt?'<span>'+nxE(txt)+'</span>':'')+'</div>';
  const sgdsListe=w=>{ const L=SGDS.docs, Q=L.filter(sgdsCherche), F=Q.filter(d=>!SGDS.jeu||String(d.jeu)===SGDS.jeu);
    const ct=w.querySelector('.sgds-ct span'); ct.textContent=F.length===L.length?sgdsN(L.length)+' documents':sgdsN(F.length)+' sur '+sgdsN(L.length);
    const nb=j=>Q.filter(d=>!j||String(d.jeu)===j).length;
    w.querySelector('.sgds-jeux').innerHTML=[['','Tous'],...Object.keys(SGDS_JEUX).map(j=>[j,SGDS_JEUX[j][0]])]
      .map(([j,t])=>'<button type="button" data-jeu="'+j+'" class="'+(SGDS.jeu===j?'on':'')+'" title="'+nxE(j?'Jeu '+j+' — '+t:'Tous les jeux')+'">'+nxE(t)+'<small>'+nb(j)+'</small></button>').join('');
    let html='', fam=null;
    F.forEach(d=>{ if(d.fam.t!==fam){ fam=d.fam.t; html+='<div class="sgds-gt"><span>'+nxE(fam)+'</span><small>'+F.filter(x=>x.fam.t===fam).length+'</small></div>'; }
      const ti=d.report&&d.report.reportTitle, [jl,ja]=sgdsJeu(d.jeu);
      html+='<button type="button" class="sgds-it'+(String(d.id)===String(SGDS.sel)?' on':'')+'" data-id="'+nxE(d.id)+'" role="option" title="'+nxE(sgdsNom(d)+' — jeu '+jl+(ti&&ti!==sgdsNom(d)?' — titre : '+ti:''))+'">'
        +'<span class="sgt-ini">'+nxE(ja)+'</span><span class="sgt-nm"><b>'+nxE(sgdsNom(d))+'</b><small>'+nxE(ti&&ti!==sgdsNom(d)?ti:'Jeu '+jl)+'</small></span></button>'; });
    w.querySelector('.sgds-l').innerHTML=html||'<div class="sgds-vide">Aucun document ne correspond'+(SGDS.q.trim()?' à « '+nxE(SGDS.q.trim())+' »':'')+'.</div>'; };
  const sgdsTete=w=>{ const haut=w.querySelector('.sgds-haut'), d=SGDS.par.get(String(SGDS.sel));
    if(!d){ haut.innerHTML=''; return; }
    const x=SGDS.cache.get(sgdsCle(d)), inf=x&&x.info, ti=d.report&&d.report.reportTitle, [jl]=sgdsJeu(d.jeu);
    const meta=[ti&&ti!==sgdsNom(d)?'Titre : '+ti:'','Jeu '+jl,d.fam.imp?'Imprimé depuis : '+d.fam.imp:''].filter(Boolean).join(' · ');
    const btn=(fn,ico,t,cls,tt)=>'<button type="button" class="nx-btn sm'+(cls?' '+cls:'')+'" data-fn="'+fn+'" title="'+nxE(tt)+'">'+nxSvg(ico)+'<span>'+nxE(t)+'</span></button>';
    const no=inf?inf.ori:[], np=no.filter(o=>o==='portrait').length, nl=no.length-np;
    const fmt=!inf?'—':!nl?'Portrait':!np?'Paysage':'Mixte', fmtT=!inf?'':np+' page'+(np>1?'s':'')+' en portrait, '+nl+' en paysage';
    const kpi=(l,v,t,cls,u)=>'<div class="nx-kpi" title="'+nxE(t)+'"><div class="l">'+nxE(l)+'</div><div class="v'+(cls?' '+cls:'')+'">'+nxE(v)+(u?'<small>'+nxE(u)+'</small>':'')+'</div></div>';
    haut.innerHTML='<div class="sgfh-tete"><div class="sgfh-id"><span class="sgfh-ini">'+nxE(typeof nxIni==='function'?nxIni(sgdsNom(d)):sgdsNom(d).slice(0,2).toUpperCase())+'</span>'
      +'<div class="sgfh-nm"><div class="lb">'+nxE('Documents Substances · '+d.fam.t)+'</div><h2>'+nxE(sgdsNom(d))+'</h2><div class="sgfh-meta">'+nxE(meta)+'</div></div></div>'
      +'<div class="sgfh-per sgds-btns">'+btn('ouvrir','pdf','Ouvrir','pri','Ouvrir le PDF dans la visionneuse (Entrée)')+btn('telecharger','import','Télécharger','','Enregistrer le PDF : '+sgdsFichier(d))
      +btn('imprimer','print','Imprimer','','Imprimer le PDF')+'</div></div>'
      +'<div class="nx-kpis sgfh-kp">'+kpi('Pages',inf?inf.pages:'—','Nombre de pages du PDF')+kpi('Format A4',fmt,fmtT||'Format des pages','txt')
      +kpi('Champs à remplir',inf?inf.champs:'—','Repères ‹ … › : les valeurs (projet, adresse, montants…) que le document reçoit à l’impression')
      +kpi('Tableaux',sgdsTableaux(d),'Tableaux du document type')+kpi('Taille du PDF',x?Math.max(1,Math.round(x.b.length/1024)):'—','Poids du fichier PDF','',x?'Ko':'')+'</div>'; };
  /* aperçu : pages rendues par pdf.js du cadre Facturation sur des canevas, l'une sous l'autre */
  const sgdsApercu=async(w,d,tok)=>{ const ap=w.querySelector('.sgds-ap'); let pdf=null;
    try{
      if(!SGDS.cache.has(sgdsCle(d))) ap.innerHTML=sgdsMsg(SGDS.w?'Mise en page du document…':'Préparation du papier Substances…',SGDS.w?'':'Polices Akkurat, gabarits des contrats et factures, logo.');
      const x=await sgdsProduire(d); if(tok!==SGDS.tok) return;
      const W=SGDS.w; if(typeof W.offreLoadPdfJs!=='function') throw new Error('pdf.js indisponible dans le cadre Facturation.');
      await W.offreLoadPdfJs(); if(tok!==SGDS.tok) return;
      pdf=await W.pdfjsLib.getDocument({ data:new W.Uint8Array(x.b), ownerDocument:document }).promise;   /* polices chargées dans CETTE page (celle des canevas), retirées par pdf.destroy() */
      const pages=[]; for(let n=1;n<=pdf.numPages;n++) pages.push(await pdf.getPage(n));
      if(tok!==SGDS.tok) return;
      const larg=Math.max(...pages.map(p=>p.getViewport({ scale:1 }).width)), dispo=Math.max(240,ap.clientWidth-48);
      const s=Math.max(.35,Math.min(1.3,dispo/larg)), dpr=Math.min(2,window.devicePixelRatio||1), ori=[]; let champs=0;
      ap.innerHTML='';
      for(let i=0;i<pages.length;i++){ const p=pages[i], v1=p.getViewport({ scale:1 }), pays=v1.width>v1.height, vp=p.getViewport({ scale:s*dpr });
        ori.push(pays?'paysage':'portrait');
        const cv=h('canvas',{ 'aria-label':'Page '+(i+1)+' sur '+pages.length }); cv.width=Math.round(vp.width); cv.height=Math.round(vp.height);
        cv.style.width=Math.round(v1.width*s)+'px';
        ap.append(h('figure',{ class:'sgds-pg' },cv,h('figcaption',{},'Page '+(i+1)+' sur '+pages.length+' · '+(pays?'paysage':'portrait'))));
        await p.render({ canvasContext:cv.getContext('2d'), viewport:vp, intent:'print' }).promise;   /* « print » : sans requestAnimationFrame du cadre Facturation (masqué : Chrome n'y lance presque plus ces rappels) ; mêmes pixels */
        try{ const tc=await p.getTextContent(); tc.items.forEach(t=>{ champs+=(String(t.str||'').match(/‹/g)||[]).length; }); }catch(_){}
        if(tok!==SGDS.tok) return; }
      x.info={ pages:pages.length, ori, champs };
      if(String(SGDS.sel)===String(d.id)) sgdsTete(w);
    }catch(e){ console.error(e); if(tok===SGDS.tok) ap.innerHTML=sgdsMsg('Le document n’a pas pu être affiché.',String(e&&e.message||e),true); }
    finally{ if(pdf){ try{ await pdf.destroy(); }catch(_){} } } };
  const sgdsChoisir=(w,id,o)=>{ o=o||{}; const d=SGDS.par.get(String(id)); if(!d) return;
    SGDS.sel=String(d.id); sgdsLs('sel',SGDS.sel);
    w.querySelectorAll('.sgds-it').forEach(x=>x.classList.toggle('on',x.dataset.id===SGDS.sel));
    if(o.voir){ const it=[...w.querySelectorAll('.sgds-it')].find(x=>x.dataset.id===SGDS.sel); if(it) it.scrollIntoView({ block:'nearest' }); }
    sgdsTete(w); clearTimeout(SGDS.att); const tok=++SGDS.tok;
    if(!SGDS.cache.has(sgdsCle(d))) w.querySelector('.sgds-ap').innerHTML=sgdsMsg(SGDS.w?'Mise en page du document…':'Préparation du papier Substances…');
    SGDS.att=setTimeout(()=>sgdsApercu(w,d,tok),o.vite?0:130); };
  const sgdsVoisin=(w,pas)=>{ const L=[...w.querySelectorAll('.sgds-it')]; if(!L.length) return;
    const i=L.findIndex(x=>x.dataset.id===String(SGDS.sel)), j=i<0?(pas>0?0:L.length-1):Math.max(0,Math.min(L.length-1,i+pas));
    if(j!==i) sgdsChoisir(w,L[j].dataset.id,{ voir:true }); };
  /* actions : Ouvrir (visionneuse), Télécharger, Imprimer (visionneuse puis impression) */
  const sgdsAction=async(quoi,d)=>{ d=d||SGDS.par.get(String(SGDS.sel)); if(!d) return;
    try{ const x=await sgdsProduire(d), b=new Blob([x.b],{ type:'application/pdf' }), nom=sgdsFichier(d);
      if(quoi==='telecharger'){ const u=URL.createObjectURL(b), a=h('a',{ href:u, download:nom }); document.body.append(a); a.click();
        setTimeout(()=>{ URL.revokeObjectURL(u); a.remove(); },3000); toast('« '+nom+' » téléchargé.'); return; }
      const fen=sgVisionneuse(b,nom);
      if(quoi==='imprimer'&&fen&&fen.imprimer) fen.imprimer();   /* fenêtre des fichiers à lecteur de l'app (bloc 48, 08.11.2026) */
    }catch(e){ console.error(e); toast('Le document n’a pas pu être produit : '+(e&&e.message||e),true); } };
  SGDS.imprimer=fr=>{ try{ fr.contentWindow.focus(); fr.contentWindow.print(); }catch(_){ toast('Impression : utilisez « Télécharger », puis imprimez le PDF.',true); } };
  SGDS.produire=sgdsProduire; SGDS.action=sgdsAction; SGDS.fichier=sgdsFichier; SGDS.famille=sgdsFamille;
  const sgdsRendre=(m,arg)=>{ const w=h('div',{ class:'sgds' }); m.append(w);
    if(!sgdsPermis()){ w.innerHTML=sgdsMsg('Cet écran n’est pas accessible avec votre profil.','Documents Substances suit les droits de Bibliothèque ▸ Documents types.'); return; }
    if(!(DS.loaded&&DS.loaded.has('modeledocument'))){ w.innerHTML=sgdsMsg('Chargement des documents types…');
      DS.need(['modeledocument']).then(()=>{ if(VIEW&&VIEW.id==='nx-docsub'&&w.isConnected){ m.innerHTML=''; sgdsRendre(m,arg); } })
        .catch(e=>{ if(w.isConnected) w.innerHTML=sgdsMsg('Les documents types n’ont pas pu être chargés.',String(e&&e.message||e),true); }); return; }
    sgdsCharger();
    if(arg!=null&&SGDS.par.has(String(arg))) SGDS.sel=String(arg);
    if(!SGDS.par.has(String(SGDS.sel))) SGDS.sel=SGDS.docs.length?String(SGDS.docs[0].id):null;
    w.innerHTML='<aside class="sgds-col"><div class="sgds-ct"><b>Documents types</b><span></span></div>'
      +'<div class="sgds-flt"><input class="inp sgds-q" type="search" placeholder="Rechercher un document  ( / )" spellcheck="false" aria-label="Rechercher un document"><div class="sgds-jeux"></div></div>'
      +'<div class="sgds-l" role="listbox" aria-label="Documents types"></div></aside>'
      +'<section class="sgds-m"><div class="sgds-haut"></div><div class="sgds-ap" aria-live="polite"></div></section>';
    const q=w.querySelector('.sgds-q'); q.value=SGDS.q;
    sgdsListe(w);
    if(!SGDS.docs.length){ w.querySelector('.sgds-ap').innerHTML=sgdsMsg('Aucun document type dans cette base.','Bibliothèque ▸ Documents types est vide.'); return; }
    sgdsChoisir(w,SGDS.sel,{ voir:true, vite:true });
    q.addEventListener('input',()=>{ SGDS.q=q.value; sgdsListe(w); });
    w.addEventListener('click',e=>{ const j=e.target.closest('.sgds-jeux button'); if(j){ SGDS.jeu=j.dataset.jeu||''; sgdsLs('jeu',SGDS.jeu); sgdsListe(w); return; }
      const it=e.target.closest('.sgds-it'); if(it){ sgdsChoisir(w,it.dataset.id); return; }
      const b=e.target.closest('.sgds-haut [data-fn]'); if(b) sgdsAction(b.dataset.fn); });
    w.addEventListener('dblclick',e=>{ const it=e.target.closest('.sgds-it'); if(it) sgdsAction('ouvrir',SGDS.par.get(it.dataset.id)); });
    w.querySelector('.sgds-l').addEventListener('contextmenu',e=>{ const it=e.target.closest('.sgds-it'); if(!it||e.altKey||typeof sgMenuAt!=='function') return;
      e.preventDefault(); sgdsChoisir(w,it.dataset.id); const d=SGDS.par.get(it.dataset.id);
      sgMenuAt(e.clientX,e.clientY,[{ t:'Ouvrir', fn:()=>sgdsAction('ouvrir',d) },{ t:'Télécharger', fn:()=>sgdsAction('telecharger',d) },{ t:'Imprimer', fn:()=>sgdsAction('imprimer',d) }]); }); };
  const sgdsRedessiner=()=>{ if(!(VIEW&&VIEW.id==='nx-docsub')) return; const m=document.getElementById('main'); if(!m) return;
    const l=m.querySelector('.sgds-l'), y=l?l.scrollTop:0; m.innerHTML=''; sgdsRendre(m); const l2=m.querySelector('.sgds-l'); if(l2) l2.scrollTop=y; };
  VIEWS['nx-docsub']={
    render(m,arg){ SGDS.tok++; sgdsRendre(m,arg); },
    refresh(ts){ if(hit(ts,'modeledocument')){ SGDS.cache.clear(); sgdsRedessiner(); } },
    leave(){ SGDS.tok++; clearTimeout(SGDS.att); } };

  /* menu : première entrée (tuile principale) de Bibliothèque — la tuile principale de Documents types redevient une tuile simple (une seule par
     chapitre, charte) ; droits : ceux de Documents types ; mots-clés de la palette ⌘K */
  { const B=SG_D.biblio; if(B&&!B.items.some(x=>x.v==='nx-docsub')){
      const it={ v:'nx-docsub', t:'Documents Substances', ico:'pdf', hero:1, d:'Tous les documents types au graphisme des contrats et factures du bureau : en-tête, pied de page et logo Substances, en PDF.' };
      B.items.forEach(x=>{ if(x.hero) x.hero=0; }); B.items.unshift(it); NX_VIEW['nx-docsub']={ d:B, t:it.t, it }; }
    if(typeof SG_VUE_DROIT==='object'&&SG_VUE_DROIT) SG_VUE_DROIT['nx-docsub']=sgdsPermis;
    if(typeof NX_KW==='object'&&NX_KW) NX_KW['nx-docsub']='documents types modèles pdf imprimer télécharger papier en-tête pied de page logo substances'; }

  /* clavier (sur window, avant les raccourcis de la coquille) : / recherche, ↑ ↓ document précédent / suivant, Entrée ouvre, Échap vide la recherche */
  window.addEventListener('keydown',e=>{ if(typeof VIEW==='undefined'||!VIEW||VIEW.id!=='nx-docsub'||document.querySelector('.ov,.sg-visu,.menu')||(typeof PAL!=='undefined'&&PAL.on)) return;
    const w=document.querySelector('#main .sgds'); if(!w) return; const q=w.querySelector('.sgds-q'); if(!q) return;
    const t=e.target||{}, dansQ=t===q, champ=!dansQ&&(/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName||'')||t.isContentEditable);
    const bouton=!dansQ&&t.tagName==='BUTTON'&&!(t.classList&&t.classList.contains('sgds-it'));   /* Entrée sur un bouton du bandeau : son action */
    if(champ||e.metaKey||e.ctrlKey||e.altKey) return;
    const stop=()=>{ e.preventDefault(); e.stopImmediatePropagation(); };
    if(e.key==='/'&&!dansQ){ stop(); q.focus(); q.select(); return; }
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){ stop(); sgdsVoisin(w,e.key==='ArrowDown'?1:-1); return; }
    if(e.key==='Enter'&&SGDS.sel&&!bouton){ stop(); sgdsAction('ouvrir'); return; }
    if(e.key==='Escape'&&dansQ&&q.value){ stop(); q.value=''; SGDS.q=''; sgdsListe(w); } },true);

  /* styles de l'écran (charte : filets noirs, angles droits, jaune pâle pour la sélection) ; les visuels de l'app reprennent les variables --s-* */
  if(!document.getElementById('sg-docsub-css')){ const st=document.createElement('style'); st.id='sg-docsub-css'; st.textContent=[
    'html:has(#main .sgds) #nx-sub{display:none!important}',
    '.sgds{display:flex;gap:24px;height:100%;min-height:0;padding:16px 24px 14px;box-sizing:border-box;overflow:hidden;container-type:inline-size}',
    '.sgds-col{flex:0 0 300px;width:300px;display:flex;flex-direction:column;min-height:0;border-top:2px solid var(--s-noir)}',
    '.sgds-ct{display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:11px 12px 9px;border-bottom:2px solid var(--s-noir)}',
    '.sgds-ct b{font-size:13px;font-weight:700}.sgds-ct span{font-size:11px;color:var(--s-gris)}',
    '.sgds-flt{display:flex;flex-direction:column;gap:9px;padding:10px 12px 9px;border-bottom:1px solid var(--s-filet)}',
    '.sgds-q{height:32px}',
    '.sgds-jeux{display:flex;flex-wrap:wrap;justify-content:space-between;gap:2px 5px}',
    '.sgds-jeux button{border:0;background:none;padding:3px 0 4px;font:inherit;font-size:11px;white-space:nowrap;color:var(--s-gris);cursor:pointer;border-bottom:2px solid transparent;border-radius:0}',
    '.sgds-jeux button:hover{color:var(--s-noir)}',
    '.sgds-jeux button.on{color:var(--s-noir);font-weight:700;border-bottom-color:var(--s-nuit)}',
    '.sgds-jeux small{font-size:10.5px;font-weight:400;color:var(--s-gris);margin-left:3px}',
    '.sgds-l{flex:1;min-height:0;overflow-y:auto}',
    '.sgds-gt{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font-size:11px;font-weight:700;color:var(--s-gris);padding:16px 12px 6px;border-bottom:1px solid var(--s-filet)}',
    '.sgds-gt small{font-size:11px;font-weight:400}',
    '.sgds-it{display:flex;align-items:center;gap:12px;width:100%;min-width:0;height:48px;padding:0 12px;border:0;border-bottom:1px solid var(--s-filet);background:transparent;font:inherit;text-align:left;cursor:pointer;color:inherit;border-radius:0}',
    '.sgds-it:hover{background:var(--s-jaune3)}',
    '.sgds-it.on{background:var(--s-jaune2);box-shadow:inset 3px 0 0 var(--s-nuit)}',
    '.sgds-it:focus-visible{outline:2px solid var(--s-nuit);outline-offset:-2px}',
    '.sgds-it .sgt-ini{min-width:36px}',
    '.sgds-vide{padding:18px 12px;color:var(--s-gris);font-size:12.5px;font-weight:300}',
    '.sgds-m{flex:1;min-width:0;display:flex;flex-direction:column;min-height:0}',
    '.sgds-haut{flex:none}',
    '.sgds-haut .sgfh-meta{max-width:760px;line-height:1.45}',
    '.sgds-btns{gap:6px}',
    '.sgds-ap{flex:1;min-height:0;overflow:auto;background:var(--s-fond);border-top:2px solid var(--s-noir);padding:22px 24px 28px;display:flex;flex-direction:column;align-items:safe center;gap:20px}',
    '.sgds-pg{margin:0;display:flex;flex-direction:column;align-items:center;gap:7px;flex:none}',
    '.sgds-pg canvas{display:block;background:#fff;border:1px solid var(--s-gris3);max-width:100%;height:auto}',
    '.sgds-pg figcaption{font-size:11px;color:var(--s-gris)}',
    '.sgds-msg{margin:auto;max-width:520px;padding:28px 12px;text-align:center;color:var(--s-gris);font-size:13px;font-weight:300;line-height:1.45}',
    '.sgds-msg b{display:block;color:var(--s-noir);font-size:14px;font-weight:700;margin-bottom:6px}',
    '.sgds-msg.err b{color:var(--s-rouge)}',
    '@container (max-width:1050px){.sgds-col{flex-basis:240px;width:240px}}'].join('\n'); document.head.append(st); }
}

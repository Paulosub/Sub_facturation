/* Référence « contrat » du banc d'essai : COPIE, pour comparaison seulement, des instructions d'offrePDFBytes (Facturation.html)
   qui posent le logo, l'en-tête courant et la numérotation — l.~5245-5247 (LOGO_BB, embedPage), 5331-5352 (wipe, dL, dR, setL,
   stampLogo, runHdr), 5383-5389 (couverture) et 6713-6728 (numérotation « n | total », petits traits du pied, trait vertical).
   Appliquées aux pages 1, 3 et 10 du gabarit de l'offre (+ une copie de la page 3 pour l'en-tête à trois lignes), avec les textes
   des épreuves du banc à la place de ceux d'une offre. Le PDF obtenu a 4 pages :
     1 = couverture du contrat (logo noir, « 1 | 3 »)        2 = page courante, en-tête à 2 lignes (titre, date ; « 3 | 3 »)
     3 = page courante, en-tête à 3 lignes (« 1 | 1 »)         4 = page paysage (annexe ; en-tête et logo du gabarit ; « 2 | 2 »)
   Ne fait pas partie de l'app. */
async function sgBancReference(R, T){
  const { PDFDocument, rgb } = R.PDFLib;
  const doc = await PDFDocument.load(R.gabarits.offre);
  doc.registerFontkit(R.fontkit);
  const fR = await doc.embedFont(R.polices.light);
  const fB = await doc.embedFont(R.polices.bold);
  const _faLogoDoc = await PDFDocument.load(R.gabarits.facture);
  const LOGO_BB = { left: 541, bottom: 83.5, right: 568.5, top: 236 };
  const logoCouv = await doc.embedPage(_faLogoDoc.getPage(0), LOGO_BB);
  const logoRun  = await doc.embedPage(_faLogoDoc.getPage(1), LOGO_BB);
  const [cp3] = await doc.copyPages(doc, [2]);
  doc.insertPage(3, cp3);                                   /* index 3 = copie de la page 3 (en-tête à 3 lignes) */
  const P = doc.getPages();                                 /* la page paysage (10e du gabarit) est maintenant à l'index 10 */
  const cN=rgb(0.08,0.07,0.07), cW=rgb(1,1,1), cG=rgb(0.4,0.4,0.4);
  /* — copie d'offrePDFBytes — */
  const wipe=(pg,x0,y0,x1,y1,pad)=>{ pad=pad==null?1:pad; pg.drawRectangle({x:x0-pad,y:y0-pad,width:(x1-x0)+2*pad,height:(y1-y0)+2*pad,color:cW}); };
  const dL=(pg,f,sz,c,t,x,y)=>{ if(t==null||t==='')return; pg.drawText(String(t),{x,y,font:f,size:sz,color:c}); };
  const dR=(pg,f,sz,c,t,xR,y)=>{ if(t==null||t==='')return; const s=String(t); pg.drawText(s,{x:xR-f.widthOfTextAtSize(s,sz),y,font:f,size:sz,color:c}); };
  const setL=(pg,bb,t,f,sz,c)=>{ wipe(pg,bb[0],bb[1],bb[2],bb[3],1.2); dL(pg,f||fR,sz||8,c||cN,t,bb[0],bb[1]+1.5); };
  const stampLogo=(pg,emb)=>{ wipe(pg,LOGO_BB.left,LOGO_BB.bottom,LOGO_BB.right,LOGO_BB.top,0);
    pg.drawPage(emb,{x:LOGO_BB.left,y:LOGO_BB.bottom}); };
  const runHdr=(pg,offreTitre,l2,l3)=>{
    if(pg.getWidth()<600) stampLogo(pg, logoRun);
    setL(pg,[28.4,804.1,213.5,812.1],offreTitre,fB,7.5,cN);
    setL(pg,[28.3,790.1,300,798.1],l2,fR,7.5,cG);
    setL(pg,[28.4,777.0,300,785.0],l3,fR,7.5,cG);
    wipe(pg,27.9,802.3,37,803.6,0);
    wipe(pg,27.9,788.5,37,789.6,0);
    pg.drawLine({start:{x:28.35,y:802.1},end:{x:36.5,y:802.1},thickness:0.25,color:cN});
    pg.drawLine({start:{x:28.35,y:787.9},end:{x:36.5,y:787.9},thickness:0.25,color:cN});
  };
  for(let i=1;i<P.length;i++){ if(P[i]) runHdr(P[i], T.titre, i===3 ? T.sousTitre : T.date, i===3 ? T.date : ''); }
  const p1=P[0];
  stampLogo(p1, logoCouv);
  setL(p1,[28.4,791.0,180,799.0],T.date,fR,8,cN);
  wipe(p1,27.9,802.3,37,803.6,0);
  p1.drawLine({start:{x:28.35,y:802.9},end:{x:36.5,y:802.9},thickness:0.25,color:cN});
  const NUM = { 0:[1,3], 2:[3,3], 3:[1,1], 10:[2,2] };
  Object.keys(NUM).forEach(k=>{ const pg=P[+k]; const nCur=NUM[k][0], nTot=NUM[k][1];
    const pw=pg.getWidth();
    const curRX=pw-87.6, totLX=pw-82.2;
    wipe(pg,pw-97.3,23,pw-86.7,38,0);
    wipe(pg,pw-82.9,23,pw-75.7,38,0);
    dR(pg,fR,7.5,cN,String(nCur),curRX,28.0);
    dL(pg,fR,7.5,cN,String(nTot),totLX,28.0);
    if(pw<600){
      [[28.35,36.5],[125.85,134.3],[222.95,231.4]].forEach(sg=>{
        wipe(pg,sg[0]-0.5,37.6,sg[1]+0.5,38.7,0);
        pg.drawLine({start:{x:sg[0],y:37.8},end:{x:sg[1],y:37.8},thickness:0.25,color:cN});
      });
    }
    wipe(pg,pw-85.4,27.4,pw-83.8,37,0);
    pg.drawLine({start:{x:pw-84.6,y:26.55},end:{x:pw-84.6,y:35.05},thickness:0.25,color:cN});
  });
  /* — fin de la copie — */
  const out = await PDFDocument.create();
  const pages = await out.copyPages(doc, [0, 2, 3, 10]);
  pages.forEach(p => out.addPage(p));
  return await out.save();
}

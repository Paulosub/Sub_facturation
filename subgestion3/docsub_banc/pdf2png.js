ObjC.import('PDFKit'); ObjC.import('AppKit');
function run(argv){
  const url=$.NSURL.fileURLWithPath(argv[0]); const out=argv[1]; const sc=+(argv[2]||1.5); const only=argv[3]?argv[3].split(',').map(Number):null;
  const doc=$.PDFDocument.alloc.initWithURL(url); const n=doc.pageCount; let res=[];
  for(let i=0;i<n;i++){ if(only&&only.indexOf(i+1)<0) continue;
    const p=doc.pageAtIndex(i); const r=p.boundsForBox($.kPDFDisplayBoxMediaBox);
    const w=Math.round(r.size.width*sc), h=Math.round(r.size.height*sc);
    const img=p.thumbnailOfSizeForBox($.NSMakeSize(w,h),$.kPDFDisplayBoxMediaBox);
    const tiff=img.TIFFRepresentation; const rep=$.NSBitmapImageRep.imageRepWithData(tiff);
    const png=rep.representationUsingTypeProperties($.NSBitmapImageFileTypePNG,$({}));
    png.writeToFileAtomically(out+'-'+(i+1)+'.png',true); res.push(i+1); }
  return 'pages '+n+' rendues '+res.join(',');
}

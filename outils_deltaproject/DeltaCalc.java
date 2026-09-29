// DeltaCalc.java — RÉFÉRENCE DE VÉRIFICATION (lecture seule) pour convertir_couts.py.
// Fait calculer par le moteur de Deltaproject lui-même (Booking.convert → Booking.compact → CalcCost.calc,
// séquence de OverviewFrame.fillTable) les colonnes du « Contrôle du coût » de chaque fichier coco/costcontrol,
// et écrit deltacalc_<ID>.json (par CFC, par entreprise, par ouvrage) à côté des JSON bruts.
// Usage (Java embarqué de DELTAproject, via jrun) :
//   ./jrun -Dsubprojects=<extraction>/tables/APP.SUBPROJECT.csv --add-opens java.base/java.util=ALL-UNNAMED \
//     --enable-preview -cp "/Applications/DELTAproject.app/Contents/app/DELTAproject.jar:/Applications/DELTAproject.app/Contents/app/lib/*" \
//     DeltaCalc.java <…/Costcontrol/P/ID/coco/costcontrol> <raw>/deltacalc_ID.json [...]
// Limite connue : hors de l'application (projet reconstitué sans base), les montants par OUVRAGE ne sont pas
// fiables (un ouvrage est parfois ignoré) → pour les contrôles avec ouvrages, n'utiliser que comme indication.
import java.io.*; import java.lang.reflect.*; import java.util.*;
import deltaproject.costcontrol.data.*;
public class DeltaCalc {
  static String[] F={"KvTot","Kv","MutationTot1","MutationTransferTot1","MutationIncreaseTot1","MutationInflationTot1","Kv1Tot","Kv1","Kv2Tot","ContractTot","AddendumToContractTot","ContractAndAddendumTot","ContractAndAddendum","PaymentTot","Payment","AccordPaymentTot","GeneralPaymentTot","InflationPaymentTot","FinalPaymentTot","GarantyRed","ForcastCalculatedTot","ForcastCalculated","ForcastBookedTot","AdditionalCostsTot","BalanceOfCostsTot","ContractMinusAccordPayment","ZeroForcast"};
  static void res(StringBuilder b,Object r){ if(r==null){b.append("null");return;} b.append('{'); boolean f=true;
    for(String n:F){ try{ Method m=r.getClass().getMethod("get"+n); Object v=m.invoke(r); if(!f)b.append(','); f=false; b.append('"').append(n).append("\":").append(v instanceof Double && (((Double)v).isNaN()||((Double)v).isInfinite())?"null":String.valueOf(v)); }catch(Throwable t){} }
    b.append('}'); }
  static Object call(Object o,String n){ try{ Method m=o.getClass().getMethod(n); return m.invoke(o);}catch(Throwable t){ return null; } }
  static String q(Object s){ return s==null?"null":"\""+String.valueOf(s).replace("\\","\\\\").replace("\"","\\\"")+"\""; }
  public static void main(String[] a) throws Exception {
    for(int i=0;i+1<a.length;i+=2){
      try(ObjectInputStream in=new ObjectInputStream(new BufferedInputStream(new FileInputStream(a[i])))){
        Costcontrol cc=(Costcontrol)in.readObject();
        db.Project p=new db.Project();
        String proj=a[i].replaceAll(".*/Costcontrol/(\\d+)/.*","$1");
        try{ p.setId(Integer.valueOf(proj)); }catch(Throwable t){}
        java.util.List<db.SubProject> subs=new java.util.ArrayList<>();
        String csv=System.getProperty("subprojects");
        if(csv!=null){ try(BufferedReader br=new BufferedReader(new InputStreamReader(new FileInputStream(csv),"UTF-8"))){
          String h=br.readLine(); String[] cols=h.split(";",-1); String line;
          while((line=br.readLine())!=null){ String[] v=line.split(";",-1); Map<String,String> m=new HashMap<>(); for(int k=0;k<cols.length&&k<v.length;k++) m.put(cols[k],v[k]);
            if(!proj.equals(m.get("PROJECT_ID"))) continue;
            db.SubProject s=new db.SubProject(); s.setId(Integer.valueOf(m.get("ID"))); s.setCode(m.get("CODE")); s.setLocationCode(m.get("LOCATIONCODE")); s.setLocationDescription(m.get("LOCATIONDESCRIPTION")); s.setDescription(m.get("DESCRIPTION"));
            try{ s.setSortOrder(Integer.parseInt(m.get("SORTORDER"))); }catch(Exception e){} s.setProject(p); subs.add(s); } } }
        p.setSubProjects(subs);
        LinkedList l=Booking.convert(cc,p,false); l=Booking.compact(l,p);
        l=CalcCost.calc(l,cc,p,false,true,false);
        StringBuilder b=new StringBuilder("{\"positions\":[");
        boolean f=true;
        for(Object o:l){ BkpItem k=(BkpItem)o; if(!f)b.append(','); f=false;
          b.append("{\"cfc\":").append(q(k.getNumber())).append(",\"res\":"); res(b,call(k,"getResult"));
          b.append(",\"ent\":["); boolean g=true;
          for(Object e:(List)call(k,"getEntrepreneurList")){ if(!g)b.append(','); g=false; b.append("{\"c\":").append(call(e,"getCompanyNumber")).append(",\"res\":"); res(b,call(e,"getResult"));
            b.append(",\"sub\":["); boolean h=true; for(Object s:(List)call(e,"getSubprojectList")){ if(!h)b.append(','); h=false; b.append("{\"to\":").append(q(call(s,"getTo"))).append(",\"res\":"); res(b,call(s,"getResult")); b.append('}'); } b.append("]}"); }
          b.append("]}"); }
        b.append("],\"total\":"); Object tot=null; try{ tot=CalcCost.calcTot(l,1,1,1,cc);}catch(Throwable t){ } res(b,tot); b.append('}');
        try(Writer w=new OutputStreamWriter(new FileOutputStream(a[i+1]),"UTF-8")){ w.write(b.toString()); }
        System.out.println("OK "+a[i+1]);
      }catch(Throwable t){ System.out.println("ERR "+a[i]+" : "+t); t.printStackTrace(System.out); }
    }
  }
}

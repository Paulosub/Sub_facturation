import java.io.*; import java.lang.reflect.*; import java.util.*; import java.math.*;
public class Ser2Json {
  static IdentityHashMap<Object,Integer> seen=new IdentityHashMap<>(); static int ids=0; static int maxDepth=60;
  static void s(StringBuilder b,String x){ b.append('"'); for(char c: x.toCharArray()){ if(c=='"'||c=='\\') b.append('\\').append(c); else if(c<32) b.append(String.format("\\u%04x",(int)c)); else b.append(c);} b.append('"'); }
  static void w(StringBuilder b,Object o,int d) throws Exception {
    if(o==null){ b.append("null"); return; }
    if(o instanceof String) { s(b,(String)o); return; }
    if(o instanceof Boolean||o instanceof Integer||o instanceof Long||o instanceof Short||o instanceof Byte){ b.append(o); return; }
    if(o instanceof Double||o instanceof Float){ double v=((Number)o).doubleValue(); if(Double.isNaN(v)||Double.isInfinite(v)) b.append("null"); else b.append(o); return; }
    if(o instanceof BigDecimal||o instanceof BigInteger){ b.append(o.toString()); return; }
    if(o instanceof Character||o instanceof Enum||o instanceof java.util.Date||o instanceof java.time.temporal.Temporal||o instanceof Class){ s(b,String.valueOf(o)); return; }
    if(d>maxDepth){ b.append("\"<prof>\""); return; }
    Integer id=seen.get(o); if(id!=null){ b.append("{\"$ref\":").append(id).append('}'); return; }
    Class<?> c=o.getClass();
    if(c.isArray()){ int n=Array.getLength(o); if(c.getComponentType()==byte.class){ b.append("\"<bytes ").append(n).append(">\""); return; }
      b.append('['); for(int i=0;i<n;i++){ if(i>0)b.append(','); w(b,Array.get(o,i),d+1);} b.append(']'); return; }
    seen.put(o,++ids); int myId=ids;
    if(o instanceof Collection){ b.append('['); boolean f=true; for(Object e:(Collection<?>)o){ if(!f)b.append(','); f=false; w(b,e,d+1);} b.append(']'); return; }
    if(o instanceof Map){ b.append('{'); boolean f=true; for(Map.Entry<?,?> e:((Map<?,?>)o).entrySet()){ if(!f)b.append(','); f=false; s(b,String.valueOf(e.getKey())); b.append(':'); w(b,e.getValue(),d+1);} b.append('}'); return; }
    b.append("{\"$c\":"); s(b,c.getName()); b.append(",\"$id\":").append(myId);
    for(Class<?> k=c;k!=null&&k!=Object.class;k=k.getSuperclass()){
      if(k.getName().startsWith("java.")||k.getName().startsWith("javax.")) break;
      for(Field f:k.getDeclaredFields()){ if(Modifier.isStatic(f.getModifiers())) continue;
        try{ f.setAccessible(true); Object v=f.get(o); if(v==null) continue; b.append(','); s(b,f.getName()); b.append(':'); w(b,v,d+1);}catch(Throwable t){ } }
    }
    b.append('}');
  }
  public static void main(String[] a) throws Exception {
    for(int i=0;i+1<a.length;i+=2){
      seen.clear(); ids=0;
      try(ObjectInputStream in=new ObjectInputStream(new BufferedInputStream(new FileInputStream(a[i])))){
        Object o=in.readObject(); StringBuilder b=new StringBuilder(); w(b,o,0);
        try(Writer wr=new OutputStreamWriter(new FileOutputStream(a[i+1]),"UTF-8")){ wr.write(b.toString()); }
        System.out.println("OK "+a[i]+" -> "+b.length()+" car.");
      }catch(Throwable t){ System.out.println("ERR "+a[i]+" : "+t); }
    }
  }
}

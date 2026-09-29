import java.sql.*; import java.io.*; import java.nio.file.*; import java.util.*;
public class Dump {
  static String esc(String s){ if(s==null) return ""; if(s.contains(";")||s.contains("\"")||s.contains("\n")||s.contains("\r")) return "\""+s.replace("\"","\"\"")+"\""; return s; }
  public static void main(String[] a) throws Exception {
    Connection c = DriverManager.getConnection("jdbc:derby:"+a[0]);
    Path out = Paths.get(a[1]); Files.createDirectories(out.resolve("tables"));
    DatabaseMetaData md = c.getMetaData();
    PrintWriter sch = new PrintWriter(Files.newBufferedWriter(out.resolve("schema.txt")));
    List<String[]> tabs = new ArrayList<>();
    try(ResultSet r = md.getTables(null,null,"%",new String[]{"TABLE"})){ while(r.next()) tabs.add(new String[]{r.getString("TABLE_SCHEM"),r.getString("TABLE_NAME")}); }
    for(String[] t: tabs){
      String q = "\""+t[0]+"\".\""+t[1]+"\"";
      long n=0; try(Statement s=c.createStatement(); ResultSet r=s.executeQuery("SELECT COUNT(*) FROM "+q)){ r.next(); n=r.getLong(1);}
      sch.println("== "+t[0]+"."+t[1]+"  ("+n+" lignes)");
      try(ResultSet r=md.getColumns(null,t[0],t[1],"%")){ while(r.next()) sch.println("   "+r.getString("COLUMN_NAME")+" "+r.getString("TYPE_NAME")+"("+r.getInt("COLUMN_SIZE")+")"+("NO".equals(r.getString("IS_NULLABLE"))?" NOT NULL":"")); }
      try(ResultSet r=md.getPrimaryKeys(null,t[0],t[1])){ StringBuilder b=new StringBuilder(); while(r.next()) b.append(r.getString("COLUMN_NAME")).append(' '); if(b.length()>0) sch.println("   PK: "+b); }
      try(ResultSet r=md.getImportedKeys(null,t[0],t[1])){ while(r.next()) sch.println("   FK: "+r.getString("FKCOLUMN_NAME")+" -> "+r.getString("PKTABLE_NAME")+"."+r.getString("PKCOLUMN_NAME")); }
      if(n==0) continue;
      try(Statement s=c.createStatement(); ResultSet r=s.executeQuery("SELECT * FROM "+q);
          PrintWriter w=new PrintWriter(Files.newBufferedWriter(out.resolve("tables/"+t[0]+"."+t[1]+".csv")))){
        ResultSetMetaData m=r.getMetaData(); int k=m.getColumnCount();
        StringBuilder h=new StringBuilder(); for(int i=1;i<=k;i++){ if(i>1)h.append(';'); h.append(m.getColumnName(i)); } w.println(h);
        while(r.next()){ StringBuilder b=new StringBuilder(); for(int i=1;i<=k;i++){ if(i>1)b.append(';'); int ty=m.getColumnType(i); String v;
            if(ty==Types.BLOB||ty==Types.VARBINARY||ty==Types.LONGVARBINARY||ty==Types.BINARY){ byte[] bb=r.getBytes(i); v=bb==null?"":"<blob "+bb.length+"o>"; }
            else { v=r.getString(i); if(v!=null&&v.length()>4000) v=v.substring(0,4000)+"…<tronqué "+v.length()+">"; }
            b.append(esc(v)); } w.println(b); }
      }
    }
    sch.close(); System.out.println(tabs.size()+" tables");
  }
}

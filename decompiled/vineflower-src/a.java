import java.util.Vector;
import javax.microedition.lcdui.Font;
import javax.microedition.lcdui.Graphics;

final class a {
   public static String a = "ok\n";
   private static int b = 0;

   public static void a(Graphics var0, int var1, int var2, int var3, int var4, int var5, int var6) {
      if (var3 < var6) {
         var0.drawRect(var1, var2, var4, var3 - 1);
         int var7 = var3 * var3 / var6;
         int var8 = var5 * var3 / var6;
         var0.fillRect(var1, var8 + var2, var4, var7);
      }
   }

   public static void a(String var0, int var1) {
      if (var1 >= b) {
         b = var1;
         if (var0 == null) {
            var0 = "";
         }

         a = var0;
      }
   }

   public static void a(String var0) {
      if (var0 == null) {
         var0 = "";
      }

      a = a + var0;
   }

   private static Vector b(String var0) {
      var0 = var0.trim();
      Vector var1 = new Vector();
      int var3 = 0;

      for (int var2 = 0; var2 < var0.length(); var2++) {
         if (var0.charAt(var2) == ' ' || var0.charAt(var2) == '\n' || var0.charAt(var2) == '@') {
            var1.addElement(var0.substring(var3, var2 + 1));
            var3 = var2 + 1;
         }
      }

      var1.addElement(var0.substring(var3, var0.length()));
      return var1;
   }

   private static Vector b(int var0, String var1, Font var2) {
      Vector var4 = new Vector();
      int var5 = 0;

      for (int var3 = 0; var3 < var1.length(); var3++) {
         String var6 = var1.substring(var5, var3);
         if (var2.stringWidth(var6) > var0) {
            var4.addElement(var1.substring(var5, var3 - 1));
            var5 = var3 - 1;
         }
      }

      var4.addElement(var1.substring(var5, var1.length()));
      return var4;
   }

   public static String[] a(int var0, String var1, Font var2) {
      Vector var3 = b(var1);
      Vector var5 = new Vector();
      boolean var7 = false;
      String var9 = "";
      Object var10 = null;
      int var11 = 0;

      for (int var15 = 0; var15 < var3.size(); var15++) {
         var10 = (String)var3.elementAt(var15);
         if (var2.stringWidth(var9 + var10) <= var0) {
            var9 = var9 + var10;
            var11++;
            if (var10.charAt(var10.length() - 1) == '\n') {
               var5.addElement(var9.substring(0, var9.length() - 1).trim());
               var9 = "";
               var11 = 0;
            }
         } else if (var11 != 0) {
            var9.trim();
            var5.addElement(var9.trim());
            var9 = "";
            var11 = 0;
            var15--;
         } else {
            Vector var4 = b(var0, var9 + var10, var2);

            for (int var6 = 0; var6 < var4.size() - 1; var6++) {
               var5.addElement(((String)var4.elementAt(var6)).trim());
            }

            var9 = (String)var4.elementAt(var4.size() - 1);
            var11 = 1;
         }
      }

      var5.addElement(var9.trim());
      String[] var13 = new String[var5.size()];

      for (int var14 = 0; var14 < var5.size(); var14++) {
         var13[var14] = (String)var5.elementAt(var14);
      }

      return var13;
   }

   private a() {
   }
}

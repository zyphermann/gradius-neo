import javax.microedition.lcdui.Display;
import javax.microedition.midlet.MIDlet;

public class GradiusNeo extends MIDlet {
   public static Display a;
   public static b b;
   public static Thread c;
   private boolean d = false;

   public GradiusNeo() {
      this.d = false;
   }

   public final void startApp() {
      if (!this.d) {
         this.d = true;
         a = Display.getDisplay(this);
         b = new b(this);
         c = new Thread(b);
         a.setCurrent(b);
         b.a[1] = true;
         c.start();
         b.a[0] = true;
      } else if (b != null) {
         b.c();
      }
   }

   public final void pauseApp() {
      if (b != null) {
         b.b();
      }
   }

   public final void destroyApp(boolean var1) {
      if (b != null) {
         b.a();
      }

      b = null;
      c = null;
   }
}

/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.microedition.lcdui.Display
 *  javax.microedition.lcdui.Displayable
 *  javax.microedition.midlet.MIDlet
 */
import javax.microedition.lcdui.Display;
import javax.microedition.lcdui.Displayable;
import javax.microedition.midlet.MIDlet;

public class GradiusNeo
extends MIDlet {
    public static Display a;
    public static b b;
    public static Thread c;
    private boolean d = false;

    public final void startApp() {
        if (!this.d) {
            this.d = true;
            a = Display.getDisplay((MIDlet)this);
            b = new b(this);
            c = new Thread(b);
            a.setCurrent((Displayable)b);
            b.a[1] = true;
            c.start();
            b.a[0] = true;
            return;
        }
        if (b == null) {
            return;
        }
        b.c();
    }

    public final void pauseApp() {
        if (b == null) {
            return;
        }
        b.b();
    }

    public final void destroyApp(boolean bl) {
        if (b != null) {
            b.a();
        }
        b = null;
        c = null;
    }
}


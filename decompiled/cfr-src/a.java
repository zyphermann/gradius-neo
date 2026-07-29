/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.microedition.lcdui.Font
 *  javax.microedition.lcdui.Graphics
 */
import java.util.Vector;
import javax.microedition.lcdui.Font;
import javax.microedition.lcdui.Graphics;

final class a {
    public static String a = "ok\n";
    private static int b = 0;

    public static void a(Graphics graphics, int n, int n2, int n3, int n4, int n5, int n6) {
        if (n3 < n6) {
            graphics.drawRect(n, n2, n4, n3 - 1);
            int n7 = n3 * n3 / n6;
            int n8 = n5 * n3 / n6;
            graphics.fillRect(n, n8 + n2, n4, n7);
        }
    }

    public static void a(String string, int n) {
        if (n < b) {
            return;
        }
        b = n;
        if (string == null) {
            string = "";
        }
        a = string;
    }

    public static void a(String string) {
        if (string == null) {
            string = "";
        }
        a = a + string;
    }

    private static Vector b(String string) {
        string = string.trim();
        Vector<String> vector = new Vector<String>();
        int n = 0;
        for (int i = 0; i < string.length(); ++i) {
            if (string.charAt(i) != ' ' && string.charAt(i) != '\n' && string.charAt(i) != '@') continue;
            vector.addElement(string.substring(n, i + 1));
            n = i + 1;
        }
        vector.addElement(string.substring(n, string.length()));
        return vector;
    }

    private static Vector b(int n, String string, Font font) {
        Vector<String> vector = new Vector<String>();
        int n2 = 0;
        for (int i = 0; i < string.length(); ++i) {
            String string2 = string.substring(n2, i);
            int n3 = font.stringWidth(string2);
            if (n3 <= n) continue;
            vector.addElement(string.substring(n2, i - 1));
            n2 = i - 1;
        }
        vector.addElement(string.substring(n2, string.length()));
        return vector;
    }

    public static String[] a(int n, String string, Font font) {
        int n2;
        Vector vector = a.b(string);
        Vector<String> vector2 = new Vector<String>();
        int n3 = 0;
        String string2 = "";
        String string3 = null;
        int n4 = 0;
        for (n3 = 0; n3 < vector.size(); ++n3) {
            string3 = (String)vector.elementAt(n3);
            int n5 = font.stringWidth(string2 + string3);
            if (n5 > n) {
                if (n4 == 0) {
                    Vector vector3 = a.b(n, string2 + string3, font);
                    for (n2 = 0; n2 < vector3.size() - 1; ++n2) {
                        vector2.addElement(((String)vector3.elementAt(n2)).trim());
                    }
                    string2 = (String)vector3.elementAt(vector3.size() - 1);
                    n4 = 1;
                    continue;
                }
                string2.trim();
                vector2.addElement(string2.trim());
                string2 = "";
                n4 = 0;
                --n3;
                continue;
            }
            string2 = string2 + string3;
            ++n4;
            if (string3.charAt(string3.length() - 1) != '\n') continue;
            vector2.addElement(string2.substring(0, string2.length() - 1).trim());
            string2 = "";
            n4 = 0;
        }
        vector2.addElement(string2.trim());
        String[] stringArray = new String[vector2.size()];
        for (n2 = 0; n2 < vector2.size(); ++n2) {
            stringArray[n2] = (String)vector2.elementAt(n2);
        }
        return stringArray;
    }

    private a() {
    }
}


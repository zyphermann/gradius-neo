/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.microedition.lcdui.Command
 *  javax.microedition.lcdui.Font
 *  javax.microedition.lcdui.Graphics
 *  javax.microedition.lcdui.Image
 *  javax.microedition.lcdui.game.GameCanvas
 *  javax.microedition.media.Manager
 *  javax.microedition.media.Player
 *  javax.microedition.media.PlayerListener
 *  javax.microedition.rms.RecordStore
 */
import java.io.InputStream;
import java.util.Hashtable;
import javax.microedition.lcdui.Command;
import javax.microedition.lcdui.Font;
import javax.microedition.lcdui.Graphics;
import javax.microedition.lcdui.Image;
import javax.microedition.lcdui.game.GameCanvas;
import javax.microedition.media.Manager;
import javax.microedition.media.Player;
import javax.microedition.media.PlayerListener;
import javax.microedition.rms.RecordStore;

final class b
extends GameCanvas
implements Runnable,
PlayerListener {
    private static int[] s = new int[9790];
    public static boolean[] a = new boolean[10];
    private static short[] t = new short[3836];
    private static long[] u = new long[5];
    public static int b;
    public static int c;
    private static InputStream v;
    private GradiusNeo w;
    private static RecordStore x;
    private static byte[] y;
    String[][] d = new String[][]{{"    Shooting Again "}, {" A Stone Graveyard "}, {" The Tension Is    ", "       Building Up "}, {"Speed of The ", "         Photon"}, {" Another Bass ", "         S-MIX"}, {" Gradius Boss      ", "           NEO-MIX "}, {" Salamander Boss   ", "           NEO-MIX "}, {"     Crystal Force "}, {"        NEO Ending "}};
    public boolean e = false;
    private static int z;
    private static int A;
    Image[] f = new Image[6];
    private static int[] B;
    private static int C;
    private static int D;
    long g = 0L;
    long h = 0L;
    private static Command[] E;
    private String F = " ";
    private String G = " ";
    private static byte[] H;
    int i = 0;
    int j = 0;
    private static int I;
    private static int J;
    private String K = "GAME SYSTEM\nChoosing Game Start, will begin a new game, or start from previously completed stages. By Choosing Continue, the game will start where the previous saved game ended.  The degree of Difficulty, Auto-fire option, or Screen Set-up can be changed in GAME SETTING. \nPressing # key or back/CLR key during game play will display the PAUSE MENU.  Pressing RESUME from PAUSE MENU will continue the game.\n\nCONTROLS\nShip movement is controlled by the D-pad.  If Auto-fire is set to OFF press the 0 key to fire. \n\nPOWER UP\nDestroying red enemies or enemy formations will result in the appearance of red capsules.  Obtaining these red capsules will highlight one of the power-ups on the lower left gauge.  At this time, pressing the left soft key will activate the highlighted power-up from the lower left gauge.\nObtaining a green capsule will highlight one of the formations in the lower right gauge.  At this time, pressing the right soft key will activate the highlighted formation from the lower right gauge.\n\nFORMATION\nKeys 1 to 6 will enable the different formations. Keys 7 to 9 reset the formation to normal.  When 4 option power-ups and the Laser power up are activated, special striking performance will be enabled.\n\nEXTRA MODE\nEXTRA MODE is a score attack mode.  Each stage has a minimum score.  Clearing the minimum score and the stage will unlock new weapons in OPTIONS - SELECT WEAPON section.\n\nPower-ups:\nS: Speed\nM: Missle\nD: Double shot\nL: Lasers\nO: Option\n?: Shield\n\nFormations:\nR: Rotate\nC: Center\nF: Forward\nW: Wing\nI: In-line\nA: Advance";
    private String[] L = null;
    private String[] M = null;
    int k = 0;
    int l = 0;
    private String[] N = null;
    public boolean m = true;
    String[][] n = new String[][]{{"- GRADIUS NEO -", "Final Stage Cleared!", "Try next round!!"}, {"", "", "", "", "", ""}, {"STAFF"}, {"PROGRAMMER", "Nobuhiro Kimura"}, {"DESIGNER", "Joe"}, {"SOUND COMPOSER", "Off Course", "Takeuchi"}, {"SITE PROGRAMMER", "James Tatsuno", "Kazuhiko Ono", "Tomohiko Asato"}, {"TECHNICAL", "ADVISER", "NWK SNAIL"}, {"SALES PROMOTER", "Hideyuki Oya", "Yusuke Zaitsu", "Hirosuke Nagai", "Sanae Hara", "Mayuko Suzuki", "Yoko Uchida"}, {"DIRECTOR", "Nobuhiro Kimura", "Bunmei Tsuchiya"}, {"PRODUCER", "Masaya Aihara"}, {"SUPERVISOR", "Shigeru Fukutake"}, {"EXECUTIVE", "PRODUCER", "Mariko Hayashi"}, {"", "Dedicated in", "loving memory", "to friend and", "co-worker,", "Daniel", "Westmoreland.", "1980-2006"}, {"See You Again in", "GRADIUS NEO", "- IMPERIAL -", "", "Press OK", "to continue"}};
    private static Font O;
    private Image P;
    private long Q;
    public static int o;
    long p = 0L;
    boolean q = false;
    private String R = null;
    private int S = 0;
    private int T = 3;
    private Player U = null;
    private Hashtable V = new Hashtable();
    static boolean r;

    private void d() {
        for (int i = 2; i < 6; ++i) {
            this.f[i] = null;
        }
        System.gc();
    }

    private void a(int n, String string) {
        this.f[n] = null;
        System.gc();
        try {
            this.f[n] = Image.createImage((String)("/img_" + string));
        }
        catch (Throwable throwable) {
            return;
        }
        this.a("csv_" + string);
        for (int i = 0; i < (y[2] << 8 | y[3] & 0xFF); ++i) {
            b.B[(b.y[0] << 8 | b.y[1] & 0xFF) + i] = y[4 + i * 4] << 24 | (y[5 + i * 4] & 0xFF) << 16 | (y[6 + i * 4] & 0xFF) << 8 | y[7 + i * 4] & 0xFF;
        }
    }

    private void a(Graphics graphics) {
        for (int i = 4; i < 18; ++i) {
            int n = s[2028 + i];
            while (n != -1) {
                int n2 = s[2558 + n];
                switch (s[3070 + n]) {
                    case 0: {
                        if (s[7166 + n] <= 147) {
                            graphics.drawRegion(this.f[0], (B[s[7166 + n]] >> 24 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 16 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 8 & 0xFF) * 3 / 4, (B[s[7166 + n]] & 0xFF) * 3 / 4, 0, s[3582 + n] * 3 / 4, (s[4094 + n] - s[54]) * 3 / 4, 20);
                            break;
                        }
                        if (s[7166 + n] <= 282) {
                            graphics.drawRegion(this.f[1], (B[s[7166 + n]] >> 24 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 16 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 8 & 0xFF) * 3 / 4, (B[s[7166 + n]] & 0xFF) * 3 / 4, 0, s[3582 + n] * 3 / 4, (s[4094 + n] - s[54]) * 3 / 4, 20);
                            break;
                        }
                        if (s[7166 + n] <= 292) {
                            graphics.drawRegion(this.f[3], (B[s[7166 + n]] >> 24 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 16 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 8 & 0xFF) * 3 / 4, (B[s[7166 + n]] & 0xFF) * 3 / 4, 0, s[3582 + n] * 3 / 4, (s[4094 + n] - s[54]) * 3 / 4, 20);
                            break;
                        }
                        if (s[7166 + n] <= 348) {
                            graphics.drawRegion(this.f[4], (B[s[7166 + n]] >> 24 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 16 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 8 & 0xFF) * 3 / 4, (B[s[7166 + n]] & 0xFF) * 3 / 4, 0, s[3582 + n] * 3 / 4, (s[4094 + n] - s[54]) * 3 / 4, 20);
                            break;
                        }
                        if (s[7166 + n] > 408) break;
                        graphics.drawRegion(this.f[2], (B[s[7166 + n]] >> 24 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 16 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 8 & 0xFF) * 3 / 4, (B[s[7166 + n]] & 0xFF) * 3 / 4, 0, s[3582 + n] * 3 / 4, (s[4094 + n] - s[54]) * 3 / 4, 20);
                        break;
                    }
                    case 1: {
                        if (s[7166 + n] <= 147) {
                            graphics.drawRegion(this.f[0], (B[s[7166 + n]] >> 24 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 16 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 8 & 0xFF) * 3 / 4, (B[s[7166 + n]] & 0xFF) * 3 / 4, 0, s[3582 + n] * 3 / 4, (s[4094 + n] - s[54]) * 3 / 4, 20);
                            break;
                        }
                        if (s[7166 + n] <= 282) {
                            graphics.drawRegion(this.f[1], (B[s[7166 + n]] >> 24 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 16 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 8 & 0xFF) * 3 / 4, (B[s[7166 + n]] & 0xFF) * 3 / 4, 0, s[3582 + n] * 3 / 4, (s[4094 + n] - s[54]) * 3 / 4, 20);
                            break;
                        }
                        if (s[7166 + n] <= 292) {
                            graphics.drawRegion(this.f[3], (B[s[7166 + n]] >> 24 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 16 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 8 & 0xFF) * 3 / 4, (B[s[7166 + n]] & 0xFF) * 3 / 4, 0, s[3582 + n] * 3 / 4, (s[4094 + n] - s[54]) * 3 / 4, 20);
                            break;
                        }
                        if (s[7166 + n] <= 348) {
                            graphics.drawRegion(this.f[4], (B[s[7166 + n]] >> 24 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 16 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 8 & 0xFF) * 3 / 4, (B[s[7166 + n]] & 0xFF) * 3 / 4, 0, s[3582 + n] * 3 / 4, (s[4094 + n] - s[54]) * 3 / 4, 20);
                            break;
                        }
                        if (s[7166 + n] > 408) break;
                        graphics.drawRegion(this.f[2], (B[s[7166 + n]] >> 24 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 16 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 8 & 0xFF) * 3 / 4, (B[s[7166 + n]] & 0xFF) * 3 / 4, 0, s[3582 + n] * 3 / 4, (s[4094 + n] - s[54]) * 3 / 4, 20);
                        break;
                    }
                    case 2: {
                        if (s[7166 + n] <= 147) {
                            graphics.drawRegion(this.f[0], (B[s[7166 + n]] >> 24 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 16 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 8 & 0xFF) * 3 / 4, (B[s[7166 + n]] & 0xFF) * 3 / 4, 0, s[3582 + n] * 3 / 4, (s[4094 + n] - s[54]) * 3 / 4, 20);
                            break;
                        }
                        if (s[7166 + n] <= 282) {
                            graphics.drawRegion(this.f[1], (B[s[7166 + n]] >> 24 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 16 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 8 & 0xFF) * 3 / 4, (B[s[7166 + n]] & 0xFF) * 3 / 4, 0, s[3582 + n] * 3 / 4, (s[4094 + n] - s[54]) * 3 / 4, 20);
                            break;
                        }
                        if (s[7166 + n] <= 292) {
                            graphics.drawRegion(this.f[3], (B[s[7166 + n]] >> 24 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 16 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 8 & 0xFF) * 3 / 4, (B[s[7166 + n]] & 0xFF) * 3 / 4, 0, s[3582 + n] * 3 / 4, (s[4094 + n] - s[54]) * 3 / 4, 20);
                            break;
                        }
                        if (s[7166 + n] <= 348) {
                            graphics.drawRegion(this.f[4], (B[s[7166 + n]] >> 24 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 16 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 8 & 0xFF) * 3 / 4, (B[s[7166 + n]] & 0xFF) * 3 / 4, 0, s[3582 + n] * 3 / 4, (s[4094 + n] - s[54]) * 3 / 4, 20);
                            break;
                        }
                        if (s[7166 + n] > 408) break;
                        graphics.drawRegion(this.f[2], (B[s[7166 + n]] >> 24 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 16 & 0xFF) * 3 / 4, (B[s[7166 + n]] >> 8 & 0xFF) * 3 / 4, (B[s[7166 + n]] & 0xFF) * 3 / 4, 0, s[3582 + n] * 3 / 4, (s[4094 + n] - s[54]) * 3 / 4, 20);
                        break;
                    }
                    case 3: {
                        int n3;
                        int n4;
                        if (0 < s[62]) {
                            n4 = 140 + (s[9] & 1) * 4;
                            n3 = (s[62] + 3 - 1) / 3 & 1;
                            graphics.drawRegion(this.f[0], (B[n4] >> 24 & 0xFF) * 3 / 4, (B[n4] >> 16 & 0xFF) * 3 / 4, (B[n4] >> 8 & 0xFF) * 3 / 4, (B[n4] & 0xFF) * 3 / 4, 0, (s[3582 + n] + 6 + n3 * 1 - 16) * 3 / 4, (s[4094 + n] + -8 + n3 * 1 - 1 - s[54]) * 3 / 4, 20);
                            graphics.drawRegion(this.f[0], (B[n4 + 1] >> 24 & 0xFF) * 3 / 4, (B[n4 + 1] >> 16 & 0xFF) * 3 / 4, (B[n4 + 1] >> 8 & 0xFF) * 3 / 4, (B[n4 + 1] & 0xFF) * 3 / 4, 0, (s[3582 + n] + 6 - n3 * 1 + 8) * 3 / 4, (s[4094 + n] + -8 + n3 * 1 - 1 - s[54]) * 3 / 4, 20);
                            graphics.drawRegion(this.f[0], (B[n4 + 2] >> 24 & 0xFF) * 3 / 4, (B[n4 + 2] >> 16 & 0xFF) * 3 / 4, (B[n4 + 2] >> 8 & 0xFF) * 3 / 4, (B[n4 + 2] & 0xFF) * 3 / 4, 0, (s[3582 + n] + 6 + n3 * 1 - 16) * 3 / 4, (s[4094 + n] + -8 - n3 * 1 + 16 - 1 - s[54]) * 3 / 4, 20);
                            graphics.drawRegion(this.f[0], (B[n4 + 1 + 2] >> 24 & 0xFF) * 3 / 4, (B[n4 + 1 + 2] >> 16 & 0xFF) * 3 / 4, (B[n4 + 1 + 2] >> 8 & 0xFF) * 3 / 4, (B[n4 + 1 + 2] & 0xFF) * 3 / 4, 0, (s[3582 + n] + 6 - n3 * 1 + 8) * 3 / 4, (s[4094 + n] + -8 - n3 * 1 + 16 - 1 - s[54]) * 3 / 4, 20);
                        }
                        n4 = 80;
                        if (s[63] < 0) {
                            s[63] = s[63] + 1;
                            if (s[63] < -7) {
                                b.s[63] = -7;
                            }
                            --n4;
                            if (s[63] < -2) {
                                --n4;
                            }
                        } else if (s[63] > 0) {
                            s[63] = s[63] - 1;
                            if (s[63] > 7) {
                                b.s[63] = 7;
                            }
                            ++n4;
                            if (s[63] > 2) {
                                ++n4;
                            }
                        }
                        graphics.drawRegion(this.f[0], (B[n4] >> 24 & 0xFF) * 3 / 4, (B[n4] >> 16 & 0xFF) * 3 / 4, (B[n4] >> 8 & 0xFF) * 3 / 4, (B[n4] & 0xFF) * 3 / 4, 0, s[3582 + n] * 3 / 4, (s[4094 + n] - 2 - s[54]) * 3 / 4, 20);
                        n4 = 44;
                        if (s[59] > 5) {
                            n4 = 44 + (s[9] & 1);
                        }
                        graphics.drawRegion(this.f[0], (B[n4] >> 24 & 0xFF) * 3 / 4, (B[n4] >> 16 & 0xFF) * 3 / 4, (B[n4] >> 8 & 0xFF) * 3 / 4, (B[n4] & 0xFF) * 3 / 4, 0, (s[3582 + n] - 8) * 3 / 4, (s[4094 + n] - 2 - s[54]) * 3 / 4, 20);
                        break;
                    }
                    case 4: {
                        int n3;
                        if (s[4094 + n] < 0) break;
                        if (s[4094 + n] <= 2) {
                            for (n3 = 0; n3 < 9; ++n3) {
                                graphics.drawRegion(this.f[1], (B[254 + n3] >> 24 & 0xFF) * 3 / 4, (B[254 + n3] >> 16 & 0xFF) * 3 / 4, (B[254 + n3] >> 8 & 0xFF) * 3 / 4, (B[254 + n3] & 0xFF) * 3 / 4, 0, (s[1126] + 8 * (5 + n3 % 3 * 2) + (1 - n3 % 3) * 4 * (2 - s[4094 + n])) * 3 / 4, (s[1143] + 16 * (n3 / 3 - 1) + (1 - n3 / 3) * 4 * (2 - s[4094 + n]) - s[54]) * 3 / 4, 20);
                            }
                        } else {
                            for (n3 = 0; n3 < 9; ++n3) {
                                graphics.drawRegion(this.f[1], (B[254 + n3] >> 24 & 0xFF) * 3 / 4, (B[254 + n3] >> 16 & 0xFF) * 3 / 4, (B[254 + n3] >> 8 & 0xFF) * 3 / 4, (B[254 + n3] & 0xFF) * 3 / 4, 0, (s[1126] + 8 * (5 + n3 % 3 * 2) + (1 - n3 % 3) * 4 * 0) * 3 / 4, (s[1143] + 16 * (n3 / 3 - 1) + (1 - n3 / 3) * 4 * 0 - s[54]) * 3 / 4, 20);
                            }
                            for (n3 = s[1126] + 64; n3 < s[1185]; n3 += 16) {
                                graphics.drawRegion(this.f[1], (B[264] >> 24 & 0xFF) * 3 / 4, (B[264] >> 16 & 0xFF) * 3 / 4, (B[264] >> 8 & 0xFF) * 3 / 4, (B[264] & 0xFF) * 3 / 4, 0, n3 * 3 / 4, (s[1143] + 0 - s[54]) * 3 / 4, 20);
                                graphics.drawRegion(this.f[1], (B[263] >> 24 & 0xFF) * 3 / 4, (B[263] >> 16 & 0xFF) * 3 / 4, (B[263] >> 8 & 0xFF) * 3 / 4, (B[263] & 0xFF) * 3 / 4, 0, n3 * 3 / 4, (s[1143] + -16 + 4 * (5 - s[4094 + n]) - s[54]) * 3 / 4, 20);
                                graphics.drawRegion(this.f[1], (B[265] >> 24 & 0xFF) * 3 / 4, (B[265] >> 16 & 0xFF) * 3 / 4, (B[265] >> 8 & 0xFF) * 3 / 4, (B[265] & 0xFF) * 3 / 4, 0, n3 * 3 / 4, (s[1143] + 16 - 4 * (5 - s[4094 + n]) - s[54]) * 3 / 4, 20);
                            }
                        }
                        break;
                    }
                }
                b.s[2558 + n] = s[55];
                b.s[55] = n;
                n = n2;
            }
            b.s[2028 + i] = -1;
        }
    }

    private void b(Graphics graphics) {
        for (int i = 0; i < 3; ++i) {
            int n = s[2028 + i];
            while (n != -1) {
                int n2 = s[2558 + n];
                switch (s[3070 + n]) {
                    case 0: {
                        graphics.setColor(191, 223, 255);
                        graphics.drawLine(s[1205 + s[3582 + n]] * 3 / 4, (s[4094 + n] + 6 - s[54]) * 3 / 4, s[1185 + s[3582 + n]] * 3 / 4, (s[4094 + n] + 6 - s[54]) * 3 / 4);
                        break;
                    }
                    case 1: {
                        int n3;
                        int n4;
                        for (n4 = 0; n4 < 4 - s[7166 + n]; ++n4) {
                            for (n3 = 0; n3 < 6; ++n3) {
                                graphics.drawRegion(this.f[4], (B[328 - n4] >> 24 & 0xFF) * 3 / 4, (B[328 - n4] >> 16 & 0xFF) * 3 / 4, (B[328 - n4] >> 8 & 0xFF) * 3 / 4, (B[328 - n4] & 0xFF) * 3 / 4, 0, (s[3582 + n] + 48 - n4 * 16) * 3 / 4, (s[4094 + n] + n3 * 48) * 3 / 4, 20);
                                graphics.drawRegion(this.f[4], (B[329 + n4] >> 24 & 0xFF) * 3 / 4, (B[329 + n4] >> 16 & 0xFF) * 3 / 4, (B[329 + n4] >> 8 & 0xFF) * 3 / 4, (B[329 + n4] & 0xFF) * 3 / 4, 0, (s[3582 + n] + 176 + n4 * 16) * 3 / 4, (s[4094 + n] + n3 * 48) * 3 / 4, 20);
                            }
                        }
                        break;
                    }
                    case 2: {
                        int n3;
                        for (n3 = 0; n3 < 6; ++n3) {
                            graphics.drawRegion(this.f[4], (B[299] >> 24 & 0xFF) * 3 / 4, (B[299] >> 16 & 0xFF) * 3 / 4, (B[299] >> 8 & 0xFF) * 3 / 4, (B[299] & 0xFF) * 3 / 4, 0, s[3582 + n] * 3 / 4, (-s[4094 + n] + n3 * 48) * 3 / 4, 20);
                            graphics.drawRegion(this.f[4], (B[300] >> 24 & 0xFF) * 3 / 4, (B[300] >> 16 & 0xFF) * 3 / 4, (B[300] >> 8 & 0xFF) * 3 / 4, (B[300] & 0xFF) * 3 / 4, 0, (s[3582 + n] + 176) * 3 / 4, (-s[4094 + n] + n3 * 48) * 3 / 4, 20);
                        }
                        break;
                    }
                    case 3: {
                        int n3;
                        int n4;
                        for (n4 = 0; n4 < 4 - s[7166 + n]; ++n4) {
                            for (n3 = 0; n3 < 6; ++n3) {
                                graphics.drawRegion(this.f[4], (B[308 - n4] >> 24 & 0xFF) * 3 / 4, (B[308 - n4] >> 16 & 0xFF) * 3 / 4, (B[308 - n4] >> 8 & 0xFF) * 3 / 4, (B[308 - n4] & 0xFF) * 3 / 4, 0, (s[3582 + n] + n3 * 48) * 3 / 4, (s[4094 + n] + 48 - n4 * 16) * 3 / 4, 20);
                                graphics.drawRegion(this.f[4], (B[313 + n4] >> 24 & 0xFF) * 3 / 4, (B[313 + n4] >> 16 & 0xFF) * 3 / 4, (B[313 + n4] >> 8 & 0xFF) * 3 / 4, (B[313 + n4] & 0xFF) * 3 / 4, 0, (s[3582 + n] + n3 * 48) * 3 / 4, (s[4094 + n] + 160 + n4 * 16) * 3 / 4, 20);
                            }
                        }
                        break;
                    }
                    case 4: {
                        int n3;
                        for (n3 = 0; n3 < 6; ++n3) {
                            graphics.drawRegion(this.f[4], (B[295] >> 24 & 0xFF) * 3 / 4, (B[295] >> 16 & 0xFF) * 3 / 4, (B[295] >> 8 & 0xFF) * 3 / 4, (B[295] & 0xFF) * 3 / 4, 0, (-s[3582 + n] + n3 * 48) * 3 / 4, 0, 20);
                            graphics.drawRegion(this.f[4], (B[296] >> 24 & 0xFF) * 3 / 4, (B[296] >> 16 & 0xFF) * 3 / 4, (B[296] >> 8 & 0xFF) * 3 / 4, (B[296] & 0xFF) * 3 / 4, 0, (-s[3582 + n] + n3 * 48) * 3 / 4, 120, 20);
                        }
                        break;
                    }
                    case 5: {
                        graphics.setColor(0xFFFFFF);
                        graphics.fillRect((120 - s[3582 + n]) * 3 / 4, 0, s[3582 + n] * 2 * 3 / 4, 168);
                    }
                }
                b.s[2558 + n] = s[55];
                b.s[55] = n;
                n = n2;
            }
            b.s[2028 + i] = -1;
        }
    }

    b(GradiusNeo gradiusNeo) {
        super(false);
        try {
            this.w = gradiusNeo;
            this.setFullScreenMode(true);
            z = this.getWidth();
            A = this.getHeight();
            if (A < z) {
                A = z;
            }
            b.s[7] = (z - 180) / 2;
            b.s[8] = (A - 180) / 2;
            b.s[9729] = 20;
            b.s[9727] = 18;
            b.s[9726] = 16;
            b.s[9728] = 14;
            b.s[9730] = 12;
            b.s[2017] = 2;
            b.s[2018] = 2;
            b.s[2019] = 64;
            b.s[2020] = 64;
            b.s[2021] = 4;
            b.s[2022] = 32;
            b.s[2023] = 4;
            b.s[2024] = 32;
            b.s[2025] = 32768;
            b.s[2026] = 131072;
            b.s[2027] = 8192;
            b.s[9771] = 40000;
            b.s[9772] = 55000;
            b.s[9773] = 70000;
            b.s[9774] = 35000;
            b.s[9775] = 200000;
            b.s[9781] = 15;
            b.s[9782] = 18;
            b.s[9783] = 21;
            b.s[9784] = 24;
            b.s[9785] = 27;
            b.s[9786] = 12;
            b.s[9787] = 30;
            b.s[9788] = 33;
            b.s[9789] = 36;
            b = 206;
            return;
        }
        catch (Throwable throwable) {
            return;
        }
    }

    public final void run() {
        try {
            while (this.m) {
                ++this.g;
                b.u[0] = System.currentTimeMillis();
                this.repaint();
                this.serviceRepaints();
                this.k();
                this.j();
                this.l();
                if (b == 18 || b == 19 || b == 15) continue;
                this.h = System.currentTimeMillis() - u[0];
                if (this.h >= 100L || this.h <= 0L) continue;
                try {
                    Thread.sleep(100L - this.h);
                }
                catch (Throwable throwable) {}
            }
            this.w.destroyApp(false);
            this.w.notifyDestroyed();
            return;
        }
        catch (Throwable throwable) {
            a.a("main loop error " + throwable, 1);
            return;
        }
    }

    private void c(Graphics graphics) {
        int n = 240 + s[8] + 14 - 5;
        graphics.translate(-graphics.getTranslateX(), -graphics.getTranslateY());
        graphics.setClip(0, 0, this.getWidth(), this.getHeight());
        graphics.setColor(0);
        graphics.fillRect(0, n, z, A);
        this.a(graphics, this.F, s[7], n);
        this.a(graphics, this.G, 240 - this.G.length() * 14 + s[7] + -3, n);
    }

    private void a(int n, int n2) {
        this.F = " ";
        this.G = " ";
        this.F = E[n].getLabel();
        this.G = E[n2].getLabel();
    }

    private static int b(int n, int n2) {
        n = s[1126] - n;
        n2 = s[1143] - n2;
        while ((n2 + 8 | 8 - n2) < 0) {
            n /= 2;
            n2 /= 2;
        }
        if (0 <= n) {
            while (8 <= n) {
                n /= 2;
                n2 /= 2;
            }
            if (0 <= n2) {
                return s[327 + n + n2 * 8];
            }
            return 32 - s[327 + n - n2 * 8];
        }
        while (-8 >= n) {
            n /= 2;
            n2 /= 2;
        }
        if (0 <= n2) {
            return 64 - s[327 - n + n2 * 8];
        }
        return 32 + s[327 - n - n2 * 8];
    }

    private static int a(int n, int n2, int n3) {
        int n4 = b.b(n >> 4, n2 >> 4) - n3;
        if (n4 > 32) {
            n4 -= 64;
        }
        if (n4 < -32) {
            n4 += 64;
        }
        if (n4 == 0) {
            return n3;
        }
        if (n4 > 0) {
            return ++n3 % 64;
        }
        return (n3 + 64 - 1) % 64;
    }

    private static int b(int n, int n2, int n3) {
        int n4 = 5630 + n;
        int n5 = s[n4] + s[455 + n2] * n3;
        s[n4] = n5;
        return n5 >> 4;
    }

    private static int c(int n, int n2, int n3) {
        int n4 = 6142 + n;
        int n5 = s[n4] + s[471 + n2] * n3;
        s[n4] = n5;
        return n5 >> 4;
    }

    private static void e() {
        if (2 <= s[23]) {
            b.s[25] = s[24];
            s[25] = s[25] + (s[59] - 5) / 2;
            if (s[61] != 0) {
                s[25] = s[25] + 2;
            }
            if (s[60] >= 8) {
                s[25] = s[25] + 4;
            } else if (s[60] >= 1) {
                s[25] = s[25] + 1;
            }
            s[25] = s[25] + s[65];
            if (s[62] > 0) {
                s[25] = s[25] + 4;
            }
        }
        if (32 < s[25]) {
            b.s[25] = 32;
        }
    }

    private void a(Graphics graphics, int n, int n2, int n3, int n4) {
        int n5 = 0;
        while (n5 < n2) {
            if (s[599 + (n + n5)] >= 0) {
                graphics.drawRegion(this.f[0], (B[s[599 + (n + n5)]] >> 24 & 0xFF) * 3 / 4, (B[s[599 + (n + n5)]] >> 16 & 0xFF) * 3 / 4, (B[s[599 + (n + n5)]] >> 8 & 0xFF) * 3 / 4, (B[s[599 + (n + n5)]] & 0xFF) * 3 / 4, 0, (n3 - 2) * 3 / 4, (n4 - 2) * 3 / 4, 20);
            }
            ++n5;
            n3 += 14;
        }
    }

    private void a(Graphics graphics, String string, int n, int n2) {
        int n3 = 0;
        int n4 = 0;
        while (n4 < string.length()) {
            n3 = 0;
            char c = string.charAt(n4);
            if (c >= 'A' && c <= 'Z') {
                n3 = c - 65 + 14;
            }
            if (c >= '0' && c <= '9') {
                n3 = c - 48 + 4;
            }
            if (c == '*') {
                n3 = 40;
            }
            if (c == '#') {
                n3 = 41;
            }
            if (c == '-') {
                n3 = 42;
            }
            if (n3 != 0) {
                graphics.drawRegion(this.f[0], (B[n3] >> 24 & 0xFF) * 3 / 4, (B[n3] >> 16 & 0xFF) * 3 / 4, (B[n3] >> 8 & 0xFF) * 3 / 4, (B[n3] & 0xFF) * 3 / 4, 0, (n - 2) * 3 / 4, (n2 - 2) * 3 / 4, 20);
            }
            ++n4;
            n += 14;
        }
    }

    private void a(Graphics graphics, int n, int n2, int n3, int n4, int n5) {
        n2 = n3 + (n2 - 1) * 14;
        do {
            graphics.drawRegion(this.f[0], (B[n % 10 + n5] >> 24 & 0xFF) * 3 / 4, (B[n % 10 + n5] >> 16 & 0xFF) * 3 / 4, (B[n % 10 + n5] >> 8 & 0xFF) * 3 / 4, (B[n % 10 + n5] & 0xFF) * 3 / 4, 0, (n2 - 2) * 3 / 4, (n4 - 2) * 3 / 4, 20);
        } while ((-(n /= 10) & n3 - (n2 -= 14) - 14) < 0);
    }

    private void a(Graphics graphics, int n, int n2) {
        graphics.drawRegion(this.f[0], (B[42] >> 24 & 0xFF) * 3 / 4, (B[42] >> 16 & 0xFF) * 3 / 4, (B[42] >> 8 & 0xFF) * 3 / 4, (B[42] & 0xFF) * 3 / 4, 0, 40, (n2 - 2) * 3 / 4, 20);
        graphics.drawRegion(this.f[0], (B[42] >> 24 & 0xFF) * 3 / 4, (B[42] >> 16 & 0xFF) * 3 / 4, (B[42] >> 8 & 0xFF) * 3 / 4, (B[42] & 0xFF) * 3 / 4, 0, 124, (n2 - 2) * 3 / 4, 20);
        if (n == 0) {
            this.a(graphics, 135 + n * 7, 7, 70, n2);
            return;
        }
        if (n == 1) {
            this.a(graphics, 135 + n * 7, 7, 49, n2);
            return;
        }
        if (n == 2) {
            this.a(graphics, 135 + n * 7, 7, 63, n2);
            return;
        }
        if (n == 3) {
            this.a(graphics, 135 + n * 7, 7, 49, n2);
        }
    }

    private static void f() {
        if (s[65] >= 4 && s[60] >= 8) {
            switch (s[81]) {
                case 0: {
                    b.s[60] = 8;
                    break;
                }
                case 1: {
                    b.s[60] = 16;
                    break;
                }
                case 2: {
                    b.s[60] = 17;
                    b.a[6] = false;
                    b.s[64] = 48;
                    break;
                }
                case 3: {
                    b.s[60] = 10;
                    break;
                }
                case 4: {
                    b.s[60] = 18;
                    break;
                }
                case 5: {
                    b.s[60] = 11;
                    break;
                }
                case 6: {
                    b.s[60] = 19;
                }
            }
            return;
        }
        if (s[60] >= 8) {
            b.s[60] = 8;
        }
    }

    private void a(String string) {
        try {
            v = this.getClass().getResourceAsStream("/" + string);
            v.read(y);
            v.close();
        }
        catch (Throwable throwable) {}
        System.gc();
    }

    public final void a() {
        b.a[2] = false;
        b.a[3] = false;
        this.m();
    }

    private static void a(int n) {
        c = n;
        b.a[2] = true;
        b.s[29] = 0;
    }

    private static void b(int n) {
        if (!a[3] || s[28] < n) {
            b.s[28] = n;
        }
        b.a[3] = true;
        b.s[30] = 0;
    }

    private static int a(int n, int n2, int n3, int n4) {
        int n5 = s[55];
        if (n5 < 0) {
            return -1;
        }
        b.s[55] = s[2558 + n5];
        b.s[2046 + n5] = -1;
        b.s[2558 + n5] = s[56];
        if (s[56] != -1) {
            b.s[2046 + b.s[56]] = n5;
        }
        b.s[56] = n5;
        b.s[3582 + n5] = n2;
        b.s[4094 + n5] = n3;
        b.s[5630 + n5] = n2 << 4;
        b.s[6142 + n5] = n3 << 4;
        b.s[3070 + n5] = n;
        b.s[7166 + n5] = n4 & 0xFF;
        b.s[7678 + n5] = n4 >> 8 & 0xFF;
        b.s[8190 + n5] = n4 >> 16 & 0xFF;
        b.s[8702 + n5] = n4 >> 24;
        b.s[6654 + n5] = 0;
        b.s[9214 + n5] = 1;
        return n5;
    }

    private static int b(int n, int n2, int n3, int n4) {
        int n5 = s[55];
        if (n5 < 0) {
            return -1;
        }
        b.s[55] = s[2558 + n5];
        b.s[2046 + n5] = -1;
        b.s[2558 + n5] = s[57];
        if (s[57] != -1) {
            b.s[2046 + b.s[57]] = n5;
        }
        b.s[57] = n5;
        b.s[3582 + n5] = n2;
        b.s[4094 + n5] = n3;
        b.s[5630 + n5] = n2 << 4;
        b.s[6142 + n5] = n3 << 4;
        b.s[3070 + n5] = n;
        b.s[7166 + n5] = n4 & 0xFF;
        b.s[7678 + n5] = n4 >> 8 & 0xFF;
        b.s[8190 + n5] = n4 >> 16 & 0xFF;
        b.s[8702 + n5] = n4 >> 24;
        b.s[6654 + n5] = 0;
        b.s[9214 + n5] = 1;
        return n5;
    }

    private static void c(int n) {
        int n2 = s[2046 + n];
        int n3 = s[2558 + n];
        if (n2 != -1) {
            b.s[2558 + n2] = n3;
        } else {
            b.s[56] = n3;
        }
        if (n3 != -1) {
            b.s[2046 + n3] = n2;
        }
        b.s[2558 + n] = s[55];
        b.s[55] = n;
        ++J;
    }

    private static void d(int n) {
        int n2 = s[2046 + n];
        int n3 = s[2558 + n];
        if (n2 != -1) {
            b.s[2558 + n2] = n3;
        } else {
            b.s[57] = n3;
        }
        if (n3 != -1) {
            b.s[2046 + n3] = n2;
        }
        b.s[2558 + n] = s[55];
        b.s[55] = n;
        ++J;
    }

    private static int a(int n, int n2, int n3, int n4, int n5, int n6) {
        int n7 = s[55];
        if (n7 < 0) {
            return -1;
        }
        b.s[55] = s[2558 + n7];
        b.s[2558 + n7] = s[2028 + n4];
        b.s[2028 + n4] = n7;
        b.s[3070 + n7] = n;
        b.s[3582 + n7] = n2;
        b.s[4094 + n7] = n3;
        b.s[7166 + n7] = n5;
        if (n == 0) {
            b.s[7678 + n7] = (n6 & 0xFF0000) >> 16;
            b.s[8190 + n7] = (n6 & 0xFF00) >> 8;
            b.s[8702 + n7] = n6 & 0xFF;
        }
        return n7;
    }

    private static int c(int n, int n2) {
        n += 8;
        n2 += 8;
        if (s[36] != 224 ? (240 - n | n) < 0 : (240 - n | 224 - n2 | n | n2) < 0) {
            return 0;
        }
        if (s[1265 + ((s[54] + n2) / 16 * 16 + (s[52] + n) / 16 % 16)] != 0) {
            return -1;
        }
        return 0;
    }

    private static boolean b(int n, int n2, int n3, int n4, int n5, int n6) {
        b.s[58] = b.a(n, n2, n3, n4, n5);
        if (s[58] == 0) {
            return false;
        }
        int n7 = 9214 + n;
        s[n7] = s[n7] - s[58];
        if (s[n7] <= 0) {
            if (n6 == 20) {
                b.a(19, n2 + (n4 - 16) / 2, n3 + (n5 - 16) / 2, 0);
                b.a(20, n2 + (n4 - 16) / 2, n3 + (n5 - 16) / 2, (n4 - 16) / 2 << 16 | (n5 - 16) / 2 << 8 | 5);
                s[16] = s[16] + 1000;
                b.b(3);
            } else if (n6 == 19) {
                b.a(n6, n2 + (n4 - 16) / 2, n3 + (n5 - 16) / 2, 0);
                s[16] = s[16] + 1000;
                b.b(3);
            } else if (n6 >= 18) {
                b.a(n6, n2 + (n4 - 16) / 2, n3 + (n5 - 16) / 2, 0);
                s[16] = s[16] + 500;
                b.b(3);
            } else if (n6 != 10) {
                if (s[32] >= 2 || s[32] == 1 && (s[9] & 1) != 0) {
                    b.a(21, n2 + (n4 - 16) / 2, n3 + (n5 - 16) / 2, 0);
                }
                b.a(n6, n2 + (n4 - 16) / 2, n3 + (n5 - 16) / 2, 0);
                s[16] = s[16] + 100;
                if (s[3070 + n] <= 58) {
                    b.b(0);
                } else {
                    b.b(2);
                }
            }
            if (n6 > 10) {
                b.c(n);
                return true;
            }
            return true;
        }
        return false;
    }

    private static int a(int n, int n2, int n3, int n4, int n5) {
        int n6;
        int n7 = 0;
        if (s[62] > 0 && s[1126] + 12 - 6 < n2 + n4 && n2 < s[1126] + 12 + 16 + 8 && s[1143] + 6 - 6 < n3 + n5 && n3 < s[1143] + 8 + 8) {
            s[62] = s[62] - 1;
            return 1;
        }
        if (s[76] >= 0 && s[1126] + 12 < n2 + n4 && n2 < s[1126] + 12 + 16 && s[1143] + 6 < n3 + n5 && n3 < s[1143] + 8) {
            b.s[76] = -52;
            ++n7;
        }
        if (s[84] >= 2) {
            for (n6 = 1; n6 <= s[65]; ++n6) {
                if (s[1160 + n6] + 8 >= n2 + n4 || n2 >= s[1160 + n6] + 8 + 16 || s[1165 + n6] >= n3 + n5 || n3 >= s[1165 + n6] + 16) continue;
                ++n7;
            }
            if (s[3070 + n] < 37) {
                return n7;
            }
        }
        if (s[3070 + n] < 37) {
            return 0;
        }
        for (n6 = 0; n6 < 20; ++n6) {
            if (s[1245 + n6] < 0) continue;
            if (s[1245 + n6] == 8 || s[1245 + n6] == 9) {
                if (s[1205 + n6] >= n2 + n4 || n2 >= s[1185 + n6] + 1 || s[1165 + n6 / 4] >= n3 + n5 || n3 >= s[1165 + n6 / 4] + 16) continue;
                if (s[3070 + n] >= 82) {
                    b.s[1185 + n6] = n2 < s[1205 + n6] ? s[1160 + n6 / 4] + 24 : n2;
                    b.a(13, s[1185 + n6] - 8, s[1165 + n6 / 4], 0);
                    int n8 = 1245 + n6;
                    s[n8] = s[n8] + 1;
                    if (s[n8] > 9) {
                        b.s[1245 + n6] = -1;
                    }
                }
                ++n7;
                continue;
            }
            if (s[1245 + n6] == 10) {
                if (s[78] == n) continue;
                if (s[1205 + n6] >= 2) {
                    if (s[1126] + 40 >= n2 + n4 || n2 >= 240 || s[1143] - 16 >= n3 + n5 || n3 >= s[1143] + 16 + 16) continue;
                    if (s[3070 + n] >= 82) {
                        if (n2 < s[1126] + 64) {
                            b.s[77] = s[1126] + 64;
                        } else if (n2 < s[77]) {
                            b.s[77] = n2;
                        }
                    }
                    if (n2 < s[1185 + n6] + 16) {
                        n7 += 4;
                        b.s[78] = n;
                    }
                    if (s[1185 + n6] >= 240) continue;
                    b.a(11, s[1185 + n6] - 8, s[1143], 0);
                    continue;
                }
                if (s[1205 + n6] < 0 || s[1126] + 40 >= n2 + n4 || n2 >= s[1126] + 72 + 16 || s[1143] - 16 >= n3 + n5 || n3 >= s[1143] + 16 + 16) continue;
                n7 += 4;
                b.s[78] = n;
                continue;
            }
            if (12 <= s[1245 + n6] && s[1245 + n6] <= 15) {
                if (s[1185 + n6] >= n2 + n4 || n2 >= s[1185 + n6] + (s[1245 + n6] - 11) * 16 || s[1205 + n6] - 8 >= n3 + n5 || n3 >= s[1205 + n6] + 8 + 16) continue;
                int n9 = 1245 + n6;
                s[n9] = s[n9] - 1;
                ++n7;
                continue;
            }
            if (s[1245 + n6] == 19) {
                if (s[1185 + n6] >= n2 + n4 || n2 >= s[1185 + n6] + 16 || s[1205 + n6] - 16 * s[1225 + n6] >= n3 + n5 || n3 >= s[1205 + n6] + 16 + 16 * s[1225 + n6]) continue;
                ++n7;
                continue;
            }
            if (s[1245 + n6] == 7) {
                if (s[1225 + n6] <= 0 || s[1185 + n6] >= n2 + n4 || n2 >= s[1185 + n6] + 32 || s[1205 + n6] + 18 - 6 * s[1225 + n6] >= n3 + n5 || n3 >= s[1205 + n6] + 12 + 12 * s[1225 + n6]) continue;
                ++n7;
                b.s[1245 + n6] = -1;
                continue;
            }
            if (s[1185 + n6] - 8 >= n2 + n4 || n2 >= s[1185 + n6] + 24 || s[1205 + n6] >= n3 + n5 || n3 >= s[1205 + n6] + 16) continue;
            n7 = s[1245 + n6] >= 20 ? (n7 += 2) : ++n7;
            b.s[1245 + n6] = -1;
        }
        return n7;
    }

    private static void e(int n) {
        try {
            switch (n) {
                case 0: {
                    b.H[0] = (byte)s[23];
                    H[0] = (byte)(H[0] | (byte)(o << 4));
                    b.H[1] = (byte)s[21];
                    b.H[2] = (byte)s[22];
                    b.H[3] = (byte)s[35];
                    b.H[4] = (byte)s[33];
                    b.H[5] = (byte)s[100];
                    b.H[6] = (byte)(s[97] >> 24);
                    b.H[7] = (byte)(s[97] >> 16);
                    b.H[8] = (byte)(s[97] >> 8);
                    b.H[9] = (byte)s[97];
                    b.H[10] = (byte)s[101];
                    b.H[11] = (byte)(s[98] >> 24);
                    b.H[12] = (byte)(s[98] >> 16);
                    b.H[13] = (byte)(s[98] >> 8);
                    b.H[14] = (byte)s[98];
                    b.H[15] = (byte)s[102];
                    b.H[16] = (byte)(s[99] >> 24);
                    b.H[17] = (byte)(s[99] >> 16);
                    b.H[18] = (byte)(s[99] >> 8);
                    b.H[19] = (byte)s[99];
                    break;
                }
                case 20: {
                    b.H[20] = (byte)s[31];
                    b.H[21] = (byte)s[32];
                    b.H[22] = (byte)s[9];
                    b.H[23] = (byte)s[72];
                    b.H[24] = (byte)(s[16] >> 24);
                    b.H[25] = (byte)(s[16] >> 16);
                    b.H[26] = (byte)(s[16] >> 8);
                    b.H[27] = (byte)s[16];
                    b.H[28] = (byte)(s[18] >> 24);
                    b.H[29] = (byte)(s[18] >> 16);
                    b.H[30] = (byte)(s[18] >> 8);
                    b.H[31] = (byte)s[18];
                    b.H[32] = (byte)s[17];
                    b.H[33] = (byte)s[19];
                    b.H[34] = (byte)s[79];
                    b.H[35] = (byte)s[80];
                    b.H[36] = (byte)s[27];
                    b.H[37] = (byte)s[59];
                    b.H[38] = (byte)s[60];
                    b.H[39] = (byte)s[61];
                    b.H[40] = (byte)s[65];
                    b.H[41] = (byte)s[62];
                    b.H[42] = (byte)s[81];
                    b.H[43] = (byte)s[1120];
                    b.H[44] = (byte)s[1121];
                    b.H[45] = (byte)s[1122];
                    b.H[46] = (byte)s[1123];
                    b.H[47] = (byte)s[1124];
                    b.H[48] = (byte)s[1125];
                    b.H[49] = (byte)s[73];
                    b.H[50] = (byte)s[74];
                    b.H[51] = (byte)s[75];
                    break;
                }
                case 52: {
                    b.H[52] = (byte)s[66];
                    b.H[53] = (byte)s[67];
                    b.H[54] = (byte)s[68];
                    b.H[55] = (byte)s[69];
                    b.H[56] = (byte)s[70];
                    b.H[57] = (byte)s[71];
                    b.H[58] = (byte)(s[9776] >> 24);
                    b.H[59] = (byte)(s[9776] >> 16);
                    b.H[60] = (byte)(s[9776] >> 8);
                    b.H[61] = (byte)s[9776];
                    b.H[62] = (byte)(s[9777] >> 24);
                    b.H[63] = (byte)(s[9777] >> 16);
                    b.H[64] = (byte)(s[9777] >> 8);
                    b.H[65] = (byte)s[9777];
                    b.H[66] = (byte)(s[9778] >> 24);
                    b.H[67] = (byte)(s[9778] >> 16);
                    b.H[68] = (byte)(s[9778] >> 8);
                    b.H[69] = (byte)s[9778];
                    b.H[70] = (byte)(s[9779] >> 24);
                    b.H[71] = (byte)(s[9779] >> 16);
                    b.H[72] = (byte)(s[9779] >> 8);
                    b.H[73] = (byte)s[9779];
                    b.H[74] = (byte)(s[9780] >> 24);
                    b.H[75] = (byte)(s[9780] >> 16);
                    b.H[76] = (byte)(s[9780] >> 8);
                    b.H[77] = (byte)s[9780];
                }
            }
            x = RecordStore.openRecordStore((String)"R", (boolean)true);
            x.setRecord(1, H, 0, 78);
            x.closeRecordStore();
            return;
        }
        catch (Throwable throwable) {
            return;
        }
    }

    private static void f(int n) {
        switch (n) {
            case 0: {
                b.s[23] = H[0] & 0xF;
                o = (H[0] & 0xF0) >> 4;
                b.s[21] = H[1];
                b.s[22] = H[2];
                b.s[35] = H[3];
                b.s[33] = H[4];
                b.s[100] = H[5];
                b.s[97] = H[6] << 24 | (H[7] & 0xFF) << 16 | (H[8] & 0xFF) << 8 | H[9] & 0xFF;
                b.s[101] = H[10];
                b.s[98] = H[11] << 24 | (H[12] & 0xFF) << 16 | (H[13] & 0xFF) << 8 | H[14] & 0xFF;
                b.s[102] = H[15];
                b.s[99] = H[16] << 24 | (H[17] & 0xFF) << 16 | (H[18] & 0xFF) << 8 | H[19] & 0xFF;
                return;
            }
            case 20: {
                b.s[31] = H[20];
                b.s[32] = H[21];
                b.s[9] = H[22] & 0xFF;
                b.s[72] = H[23];
                b.s[16] = H[24] << 24 | (H[25] & 0xFF) << 16 | (H[26] & 0xFF) << 8 | H[27] & 0xFF;
                b.s[18] = H[28] << 24 | (H[29] & 0xFF) << 16 | (H[30] & 0xFF) << 8 | H[31] & 0xFF;
                b.s[17] = H[32];
                b.s[19] = H[33];
                b.s[79] = H[34];
                b.s[80] = H[35];
                b.s[27] = H[36];
                b.s[59] = H[37];
                b.s[60] = H[38];
                b.s[61] = H[39];
                b.s[65] = H[40];
                b.s[62] = H[41];
                b.s[81] = H[42];
                b.s[1120] = H[43];
                b.s[1121] = H[44];
                b.s[1122] = H[45];
                b.s[1123] = H[46];
                b.s[1124] = H[47];
                b.s[1125] = H[48];
                b.s[73] = H[49];
                b.s[74] = H[50];
                b.s[75] = H[51];
                return;
            }
            case 52: {
                b.s[66] = H[52];
                b.s[67] = H[53];
                b.s[68] = H[54];
                b.s[69] = H[55];
                b.s[70] = H[56];
                b.s[71] = H[57];
                b.s[9776] = H[58] << 24 | (H[59] & 0xFF) << 16 | (H[60] & 0xFF) << 8 | H[61] & 0xFF;
                b.s[9777] = H[62] << 24 | (H[63] & 0xFF) << 16 | (H[64] & 0xFF) << 8 | H[65] & 0xFF;
                b.s[9778] = H[66] << 24 | (H[67] & 0xFF) << 16 | (H[68] & 0xFF) << 8 | H[69] & 0xFF;
                b.s[9779] = H[70] << 24 | (H[71] & 0xFF) << 16 | (H[72] & 0xFF) << 8 | H[73] & 0xFF;
                b.s[9780] = H[74] << 24 | (H[75] & 0xFF) << 16 | (H[76] & 0xFF) << 8 | H[77] & 0xFF;
            }
        }
    }

    private int g(int n) {
        int n2 = 0;
        if (n == -10) {
            return 0;
        }
        switch (n) {
            case 48: {
                n2 = 1024;
                break;
            }
            case 49: {
                n2 = 2048;
                break;
            }
            case 50: {
                n2 = 4096;
                break;
            }
            case 51: {
                n2 = 8192;
                break;
            }
            case 52: {
                n2 = 16384;
                break;
            }
            case 53: {
                n2 = 0 | 0x8000;
                break;
            }
            case 54: {
                n2 = 0 | 0x10000;
                break;
            }
            case 55: {
                n2 = 0 | 0x20000;
                break;
            }
            case 56: {
                n2 = 0 | 0x40000;
                break;
            }
            case 57: {
                n2 = 0 | 0x80000;
                break;
            }
            case 42: {
                n2 = 0 | 0x100000;
                break;
            }
            case 35: {
                n2 = 0 | 0x200000;
                break;
            }
            case -8: {
                n2 = 0 | 0x2000000;
                break;
            }
            case -6: {
                n2 = 0 | 0x400000;
                break;
            }
            case -7: {
                n2 = 0 | 0x800000;
                break;
            }
            default: {
                try {
                    switch (this.getGameAction(n)) {
                        case 1: {
                            n2 = 2;
                            break;
                        }
                        case 2: {
                            n2 = 4;
                            break;
                        }
                        case 5: {
                            n2 = 32;
                            break;
                        }
                        case 6: {
                            n2 = 64;
                            break;
                        }
                        case 8: {
                            n2 = 256;
                        }
                    }
                    break;
                }
                catch (IllegalArgumentException illegalArgumentException) {}
            }
        }
        return n2;
    }

    protected final void keyPressed(int n) {
        if (n == -10) {
            return;
        }
        s[13] = s[13] | this.g(n);
        this.i |= s[13];
    }

    protected final void keyReleased(int n) {
        if (n == -10) {
            return;
        }
        this.j |= this.g(n);
    }

    public final void hideNotify() {
        this.b();
    }

    public final void showNotify() {
        this.c();
    }

    private void d(Graphics graphics) {
        if (this.L == null) {
            this.L = a.a(172, this.K, graphics.getFont());
        }
        graphics.setColor(65535);
        graphics.setFont(Font.getFont((int)64, (int)0, (int)8));
        graphics.drawString("Instructions", 90, 2, 17);
        graphics.setColor(0xFFFFFF);
        for (int i = 0; i < 8; ++i) {
            graphics.drawString(this.L[this.l + i], 93, (3 + 26 * (i + 1)) * 3 / 4, 17);
        }
        a.a(graphics, 0, 21, 156, 7, this.l * 19, this.L.length * 19);
        if ((s[11] & 6) != 0) {
            --this.l;
        } else if ((s[11] & 0x60) != 0) {
            ++this.l;
        }
        if (this.l < 0) {
            this.l = 0;
        }
        if (this.l > this.L.length - 8) {
            this.l = this.L.length - 8;
        }
        if ((s[12] & 0x800000) != 0) {
            b = this.k;
        }
    }

    private void e(Graphics graphics) {
        if (this.N == null) {
            String string = this.w.getAppProperty("MIDlet-Version");
            this.N = a.a(172, "Gradius Neo\n\n\u00a9 2004 2006 KONAMI\nAll Rights Reserved.\n\nPublished by Konami Digital Entertainment\n\nv" + string + "\n\nCheck out more games at,\nwww.konami.com/mo\n\nSupport: mobilesupport@konami.com", graphics.getFont());
        }
        graphics.setColor(65535);
        graphics.drawString("About", 90, 2, 17);
        graphics.setColor(0xFFFFFF);
        for (int i = 0; i < 8; ++i) {
            graphics.drawString(this.N[this.l + i], 93, (3 + 26 * (i + 1)) * 3 / 4, 17);
        }
        a.a(graphics, 0, 21, 156, 7, this.l * 19, this.N.length * 19);
        if ((s[11] & 6) != 0) {
            --this.l;
        } else if ((s[11] & 0x60) != 0) {
            ++this.l;
        }
        if (this.l < 0) {
            this.l = 0;
        }
        if (this.l > this.N.length - 8) {
            this.l = this.N.length - 8;
        }
        if ((s[12] & 0x800000) != 0) {
            b = 4;
        }
    }

    private void f(Graphics graphics) {
        this.a(graphics, "EXIT", 92, 96);
        this.a(graphics, "YES", 92, 112);
        this.a(graphics, "NO", 92, 128);
        if ((s[12] & 2) != 0) {
            s[0] = s[0] + 1;
        } else if ((s[12] & 0x40) != 0) {
            s[0] = s[0] + 1;
        }
        s[0] = s[0] % 2;
        graphics.drawRegion(this.f[0], (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4, 0, 57, (96 + (s[0] + 1) * 16 - 2) * 3 / 4, 20);
    }

    private void g(Graphics graphics) {
        this.f(graphics);
        if ((s[12] & 0x800000) != 0) {
            b = 4;
        }
        if ((s[12] & 0x100) != 0) {
            switch (s[0]) {
                case 0: {
                    this.a(6, 6);
                    b = 999;
                    return;
                }
                case 1: {
                    b = 5;
                }
            }
        }
    }

    private void h(Graphics graphics) {
        this.f(graphics);
        if ((s[12] & 0x800000) != 0) {
            b = 205;
        }
        if ((s[12] & 0x100) != 0) {
            switch (s[0]) {
                case 0: {
                    if (2 <= s[23]) {
                        if (s[99] < s[16]) {
                            b.s[99] = s[16];
                            b.s[102] = s[32] * 5 + s[31];
                        }
                        if (s[98] < s[16]) {
                            b.s[99] = s[98];
                            b.s[98] = s[16];
                            b.s[102] = s[101];
                            b.s[101] = s[32] * 5 + s[31];
                        }
                        if (s[97] < s[16]) {
                            b.s[98] = s[97];
                            b.s[97] = s[16];
                            b.s[101] = s[100];
                            b.s[100] = s[32] * 5 + s[31];
                        }
                        b.e(0);
                    }
                    b = 4;
                    return;
                }
                case 1: {
                    b = 205;
                }
            }
        }
    }

    private void i(Graphics graphics) {
        this.a(graphics, 219, 5, 85, 80);
        this.a(graphics, "RESUME", 43, 96);
        String[] stringArray = new String[]{"NONE", "BGM", "SFX"};
        this.a(graphics, "SOUND - " + stringArray[o], 43, 112);
        this.a(graphics, "HELP", 43, 128);
        this.a(graphics, "EXIT", 43, 144);
        if ((s[12] & 2) != 0) {
            s[0] = s[0] + 3;
        } else if ((s[12] & 0x40) != 0) {
            s[0] = s[0] + 1;
        }
        s[0] = s[0] % 4;
        graphics.drawRegion(this.f[0], (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4, 0, 20, (96 + s[0] * 16 - 2) * 3 / 4, 20);
        if ((s[12] & 0x800000) != 0) {
            b.a[4] = false;
            this.a(4, 5);
            graphics.setColor(0);
            graphics.fillRect(0, 0, 180, 180);
        }
        if ((s[12] & 0x100) != 0) {
            b.s[12] = 0;
            if (s[0] == 0) {
                b.a[4] = false;
                this.a(4, 5);
                graphics.setColor(0);
                graphics.fillRect(0, 0, 180, 180);
                return;
            }
            if (s[0] == 1) {
                this.i();
                return;
            }
            if (s[0] == 2) {
                this.k = 205;
                this.a(6, 3);
                b = 8;
                this.l = 0;
                return;
            }
            if (s[0] == 3) {
                b = 204;
            }
        }
    }

    /*
     * Exception decompiling
     */
    private void g() {
        /*
         * This method has failed to decompile.  When submitting a bug report, please provide this stack trace, and (if you hold appropriate legal rights) the relevant class file.
         * 
         * java.lang.NullPointerException: Cannot invoke "org.benf.cfr.reader.bytecode.analysis.parse.utils.SSAIdent.hashCode()" because "this.ssaIdent" is null
         *     at org.benf.cfr.reader.bytecode.analysis.parse.utils.LValueAssignmentAndAliasCondenser$VersionedLValue.hashCode(LValueAssignmentAndAliasCondenser.java:718)
         *     at java.base/java.util.HashMap.hash(HashMap.java:338)
         *     at java.base/java.util.HashMap.put(HashMap.java:618)
         *     at org.benf.cfr.reader.bytecode.analysis.parse.utils.LValueAssignmentAndAliasCondenser.collectMutatedLValue(LValueAssignmentAndAliasCondenser.java:93)
         *     at org.benf.cfr.reader.bytecode.analysis.parse.statement.AssignmentPreMutation.collectLValueAssignments(AssignmentPreMutation.java:80)
         *     at org.benf.cfr.reader.bytecode.analysis.opgraph.Op03SimpleStatement.collect(Op03SimpleStatement.java:471)
         *     at org.benf.cfr.reader.bytecode.analysis.opgraph.op3rewriters.LValueProp.condenseLValues(LValueProp.java:29)
         *     at org.benf.cfr.reader.bytecode.CodeAnalyser.getAnalysisInner(CodeAnalyser.java:577)
         *     at org.benf.cfr.reader.bytecode.CodeAnalyser.getAnalysisOrWrapFail(CodeAnalyser.java:278)
         *     at org.benf.cfr.reader.bytecode.CodeAnalyser.getAnalysis(CodeAnalyser.java:201)
         *     at org.benf.cfr.reader.entities.attributes.AttributeCode.analyse(AttributeCode.java:94)
         *     at org.benf.cfr.reader.entities.Method.analyse(Method.java:531)
         *     at org.benf.cfr.reader.entities.ClassFile.analyseMid(ClassFile.java:1055)
         *     at org.benf.cfr.reader.entities.ClassFile.analyseTop(ClassFile.java:942)
         *     at org.benf.cfr.reader.Driver.doJarVersionTypes(Driver.java:257)
         *     at org.benf.cfr.reader.Driver.doJar(Driver.java:139)
         *     at org.benf.cfr.reader.CfrDriverImpl.analyse(CfrDriverImpl.java:76)
         *     at org.benf.cfr.reader.Main.main(Main.java:54)
         */
        throw new IllegalStateException("Decompilation failed");
    }

    private void j(Graphics graphics) {
        int n = s[57];
        while (n != -1) {
            int n2 = s[2558 + n];
            int n3 = s[3582 + n];
            int n4 = s[4094 + n];
            int n5 = s[6654 + n];
            I = -1;
            int n6 = (I + 1) / 2;
            J = 0;
            switch (s[3070 + n]) {
                case 33: 
                case 34: 
                case 35: 
                case 36: {
                    if (n5 == 0) {
                        if (s[7166 + n] < 1) {
                            b.s[7166 + n] = 1;
                        }
                        b.s[5630 + n] = s[3582 + n];
                        b.s[6142 + n] = s[4094 + n];
                        b.s[4606 + n] = 0;
                        b.s[5118 + n] = (s[3070 + n] - 33) / 2;
                    }
                    if (s[85] > 0) {
                        b.s[85] = 0;
                        b.d(n);
                        break;
                    }
                    if (s[8702 + n] == 1) {
                        n3 = s[3582 + s[8190 + n]] + s[5630 + n];
                        n4 = s[4094 + s[8190 + n]] + s[6142 + n];
                    }
                    if (s[4606 + n] <= 0) {
                        if (s[7678 + n] == 0) {
                            b.a(2, n3 - 16 + n6 * 16, n4 - 8, 14, 244 + (n5 & 1) * 1, 0);
                            if (n5 < 3) break;
                            int n7 = 4606 + n;
                            s[n7] = s[n7] + 1;
                            break;
                        }
                        if (s[7678 + n] == 1) {
                            b.a(2, n3 - 16 + n6 * 16, n4 - 8, 14, 244 + (n5 & 1) * 1, 0);
                            if (n5 < 7) break;
                            int n8 = 4606 + n;
                            s[n8] = s[n8] + 1;
                            break;
                        }
                        if (s[7678 + n] != 2) break;
                        b.a(0, n3, n4, 13, 401 + n5, 66052);
                        if (n5 < 3) break;
                        int n9 = 4606 + n;
                        s[n9] = s[n9] + 1;
                        break;
                    }
                    if (s[4606 + n] == 1) {
                        b.b(8);
                    }
                    b.a(1, n3, n4 - (1 - s[5118 + n]) * 16 / 2, 14, 247 + s[5118 + n] * 2, 0);
                    int n10 = n3 + I * 16;
                    while (I * n10 <= 120 + I * 240 / 2) {
                        b.a(1, n10, n4 - (1 - s[5118 + n]) * 16 / 2, 14, 246 + s[5118 + n] * 2, 0);
                        n10 += I * 16;
                    }
                    b.a(n, n6 * n3, n4, I * (n6 * 240 - n3) + 16, 16 + s[5118 + n] * 16);
                    int n11 = 4606 + n;
                    int n12 = s[n11];
                    s[n11] = n12 + 1;
                    if (n12 < s[7166 + n]) break;
                    b.d(n);
                    break;
                }
                case 87: {
                    if (n5 == 0) {
                        n5 = 64 + 64 / s[8702 + n] * s[8190 + n];
                        b.s[8190 + n] = 0;
                        b.s[4606 + n] = 1;
                        b.s[9214 + n] = 4 + s[25];
                    }
                    b.s[0] = n5 % 64;
                    n3 = (s[5630 + s[7166 + n]] >> 4) + 16 + (s[455 + s[0]] * 16 * 3 / 2 >> 4);
                    n4 = (s[6142 + s[7166 + n]] >> 4) + 16 + (s[471 + s[0]] * 16 * 3 >> 4);
                    b.s[1] = 13;
                    if (32 < s[0]) {
                        b.s[1] = 10;
                    }
                    if (s[4606 + n] > 0) {
                        b.a(1, n3, n4, s[1], 291, 0);
                    }
                    if (s[4606 + n] <= 0) {
                        int n13 = 4606 + n;
                        s[n13] = s[n13] + 1;
                        if (0 < s[4606 + n]) {
                            b.s[9214 + n] = 8;
                        } else if (-1 <= s[4606 + n]) {
                            b.a(1, n3, n4, s[1], 123 - s[4606 + n], 0);
                        }
                    } else if (s[8190 + n] == 0) {
                        if (n5 % (48 - s[25]) == 0) {
                            b.a(21, n3, n4, 0);
                        }
                    } else if (s[8190 + n] == 1) {
                        if (n5 % (48 - s[25]) == 0) {
                            b.a(26, n3, n4, 8);
                        }
                    } else if (s[8190 + n] == 2 && n5 % (48 - s[25]) == 0) {
                        b.a(23, n3, n4, 262960);
                    }
                    if (s[9738] <= 0) {
                        if (s[4606 + n] <= 0) break;
                        int n14 = 9214 + n;
                        s[n14] = s[n14] - b.a(n, n3, n4, 16, 16);
                        if (s[n14] > 0) break;
                    }
                    b.s[4606 + n] = -24;
                    int n15 = 8190 + n;
                    int n16 = s[n15] + 1;
                    s[n15] = n16;
                    b.s[8190 + n] = n16 % 3;
                    s[16] = s[16] + 500;
                    b.a(16, n3, n4, 0);
                    if (s[9738] <= 0) break;
                    b.d(n);
                    break;
                }
                case 95: {
                    if (n5 == 0) {
                        n5 = 64 + 8 * s[7678 + n];
                        b.s[9214 + n] = 255;
                    }
                    b.s[0] = 64 - n5 % 64;
                    n3 = s[3582 + s[7166 + n]] + 48 + (s[455 + s[0]] * 16 * 1 / 2 >> 4);
                    n4 = s[4094 + s[7166 + n]] + 24 + (s[471 + s[0]] * 16 * 4 >> 4);
                    int n17 = 350;
                    b.s[1] = 13;
                    if (4 <= s[0] && s[0] <= 28) {
                        n17 = 351;
                        b.s[1] = 14;
                    } else if (36 <= s[0] && s[0] <= 60) {
                        n17 = 352;
                        b.s[1] = 10;
                    }
                    b.a(2, n3, n4, s[1], n17, 0);
                    if (s[7166 + s[7166 + n]] > 0) {
                        b.s[2] = s[6654 + s[7166 + n]];
                        if (s[2] % (16 - s[25] / 3) == 0 && s[2] % 10 == s[7678 + n]) {
                            b.a(24, n3, n4, s[1] << 8 | 8);
                        }
                    }
                    if (s[9738] > 0) {
                        b.d(n);
                        b.a(16, n3 + 8, n4, 0);
                    }
                    b.a(n, n3 + 8, n4, 24, 16);
                    break;
                }
                case 98: {
                    int n10;
                    int n18 = s[7678 + n] * 2 - 1;
                    if (n5 == 0) {
                        b.s[9214 + n] = 256 + s[25] * 8;
                        b.s[5630 + n] = -4;
                        b.s[6142 + n] = 10;
                        if (s[7678 + n] == 1) {
                            b.s[5630 + n] = -14;
                            b.s[6142 + n] = 32;
                        }
                        b.s[4606 + n] = s[5630 + n];
                        b.s[5118 + n] = s[6142 + n];
                        break;
                    }
                    int n17 = 353;
                    if (s[7678 + n] == 1) {
                        n17 = 354;
                    }
                    if (s[7166 + s[7166 + n]] == -1) {
                        n10 = 32 - s[25] / 2;
                        if (n5 % n10 == 0) {
                            b.a(65, n3 + 64 + 2 - (1 - s[7678 + n]) * 16 * 5 / 8, n4 + s[7678 + n] * 16 + n18 * 16 / 4, 0x600 | 16 - 1 * n18 * 16);
                        } else if (n5 % n10 == n10 / 2) {
                            b.a(65, n3 + 48 + 2 - (1 - s[7678 + n]) * 16 * 5 / 8, n4 + s[7678 + n] * 16 + n18 * 16 / 4, 0x600 | 16 - 1 * n18 * 16);
                        }
                    } else if (s[7166 + s[7166 + n]] >= 0) {
                        b.s[0] = s[7166 + s[7166 + n]];
                        if (s[0] > 12) {
                            b.s[0] = 12;
                        }
                        b.s[5630 + n] = s[4606 + n] + s[0] * 16 / 4;
                        b.s[6142 + n] = s[5118 + n] + n18 * s[0] * 16 / 4;
                    }
                    n3 = s[3582 + s[7166 + n]] + s[5630 + n];
                    n4 = s[4094 + s[7166 + n]] + s[6142 + n];
                    b.a(0, n3, n4, 14, n17, 393734);
                    if (s[7678 + n] == 0) {
                        n10 = b.a(n, n3 + 4, n4 + 4, 80, 24);
                        if (n10 > 0) {
                            int n19 = 9214 + n;
                            s[n19] = s[n19] - n10;
                        }
                    } else if (s[7678 + n] == 1) {
                        n10 = b.a(n, n3 + 8, n4 + 8, 80, 16);
                        if (n10 > 0) {
                            int n20 = 9214 + n;
                            s[n20] = s[n20] - n10;
                        } else {
                            n10 = b.a(n, n3 + 40, n4 + 24, 48, 4);
                            if (n10 > 0) {
                                int n21 = 9214 + n;
                                s[n21] = s[n21] - n10;
                            }
                        }
                    }
                    if (s[9214 + n] > 0 && s[9738] == 0) break;
                    if (s[9738] == 0) {
                        s[16] = s[16] + 5000;
                    }
                    int n22 = 8702 + s[7166 + n];
                    s[n22] = s[n22] + 1;
                    b.a(20, n3 + 40, n4 + 8, 0x280808);
                    b.b(3);
                    b.d(n);
                    break;
                }
                case 110: {
                    int n23;
                    if (n5 == 0) {
                        n5 = 16 + s[7678 + n] * 64 / 4;
                        break;
                    }
                    b.s[0] = (n5 * 2 + s[7678 + n] * 64 * 1 / 4) % 64;
                    n3 = s[5630 + s[7166 + n]] + (s[455 + s[0]] * s[4606 + s[7166 + n]] >> 4);
                    n4 = s[6142 + s[7166 + n]] + (s[471 + s[0]] * s[5118 + s[7166 + n]] >> 4);
                    if (s[8702 + s[7166 + n]] != 0) {
                        if (s[7166 + s[7166 + n]] == 2) {
                            if (n5 % (24 - s[25] / 2 - s[7678 + n]) == 0) {
                                n23 = n5 + s[1126] + s[1143];
                                b.a(30, n3 - 16, n4 + 8 + s[1055 + (n23 & 0x3F)] % 2 * 16 / 2, 8 + s[25] / 7);
                            }
                        } else if (s[7166 + s[7166 + n]] == 3 && n5 % (32 - s[25] / 2 - s[7678 + n] * 2) == 0) {
                            b.a(21, n3, n4 + 8, 0);
                        }
                    }
                    b.a(0, n3, n4, 13, 396, 66049);
                    b.a(n, n3, n4 + 8, 16, 16);
                    if (s[7166 + s[7166 + n]] > -2) break;
                    b.b(3);
                    b.a(18, n3 - 32, n4, 0);
                    b.d(n);
                    break;
                }
                case 111: {
                    int n10;
                    if (n5 == 0) {
                        if (s[7166 + n] == 0) {
                            b.s[9743] = 24;
                            b.s[9741] = 24;
                            b.s[42] = 0;
                        } else if (s[7166 + n] == 1) {
                            b.s[43] = 4;
                            b.a(3, 240, 0, 17420);
                        }
                    }
                    if (s[7166 + n] == 0) {
                        if (n5 == 100) {
                            b.a(3, 240, 0, 30);
                        }
                        if (s[7678 + n] == 0) {
                            if (n3 <= I * 16 * 3) {
                                b.s[43] = 0;
                                b.s[53] = 0;
                                int n24 = 7678 + n;
                                s[n24] = s[n24] + 1;
                            }
                        } else if (s[7678 + n] == 1) {
                            b.s[9741] = s[9741] - 4;
                            b.s[9743] = s[9743] - 4;
                            if (s[9741] <= 0) {
                                b.s[9746] = 0;
                                b.s[9745] = 0;
                                b.s[9744] = 0;
                                b.s[9743] = 0;
                                b.s[9742] = 0;
                                b.s[9741] = 0;
                                b.s[9740] = 0;
                                b.s[9739] = 0;
                                b.d(n);
                                b.s[41] = 7;
                                b.s[86] = 3;
                                for (n10 = 0; n10 < 20; ++n10) {
                                    b.s[9751 + n10] = 0;
                                }
                                for (n10 = 1; n10 < 13; ++n10) {
                                    b.s[1265 + (n10 * 16 + b.s[52] / 16 % 16)] = 1;
                                    b.s[1265 + (n10 * 16 + (b.s[52] / 16 + 14) % 16)] = 1;
                                }
                            }
                        }
                    } else if (s[7166 + n] == 1) {
                        if (n3 <= -304) {
                            int n25 = 7166 + n;
                            s[n25] = s[n25] + 1;
                            b.s[5118 + n] = 4;
                            b.s[43] = 0;
                            b.s[52] = 0;
                            b.s[53] = 0;
                        }
                    } else if (s[7166 + n] == 2) {
                        int n26 = 5118 + n;
                        s[n26] = s[n26] - 1;
                        if (s[n26] <= 0) {
                            b.s[41] = 8;
                            b.s[42] = 1;
                            b.d(n);
                        }
                        if (s[22] == 0) {
                            b.a(1, 0, 0, 0, s[5118 + n], 0);
                        }
                    }
                    if (s[7166 + n] == 2) break;
                    b.a(0, n3 + 32, 16, 6, 336, 66305);
                    b.a(1, n3 + 32, 64, 6, 339, 0);
                    b.a(1, n3 + 32, 144, 6, 340, 0);
                    b.a(0, n3 + 32, 160, 6, 336, 66305);
                    b.a(0, n3 + 48, 16, 6, 335, 66305);
                    b.a(1, n3 + 48, 64, 6, 337, 0);
                    b.a(1, n3 + 48, 144, 6, 338, 0);
                    b.a(0, n3 + 48, 160, 6, 335, 66305);
                    b.a(0, n3 + 272, 16, 6, 336, 66305);
                    b.a(1, n3 + 272, 64, 6, 339, 0);
                    b.a(1, n3 + 272, 144, 6, 340, 0);
                    b.a(0, n3 + 272, 160, 6, 336, 66305);
                    b.a(1, n3 + 32, n4, 7, 342, 0);
                    b.a(1, n3 + 32, n4 + 208, 7, 344, 0);
                    b.a(1, n3 + 48, n4, 7, 341, 0);
                    b.a(1, n3 + 48, n4 + 208, 7, 343, 0);
                    b.a(1, n3 + 272, n4, 7, 342, 0);
                    b.a(1, n3 + 272, n4 + 208, 7, 344, 0);
                    b.a(0, n3 + 136, n4 + 0 - s[9744], 7, 345, 131329);
                    b.a(0, n3 + 168, n4 + 0 + s[9744], 7, 346, 131329);
                    b.a(0, n3 + 136, n4 + 208 - s[9746], 7, 345, 131329);
                    b.a(0, n3 + 168, n4 + 208 + s[9746], 7, 346, 131329);
                    b.a(0, n3 + 32, n4 + 80 - s[9741], 7, 347, 66049);
                    b.a(0, n3 + 32, n4 + 112 + s[9741], 7, 348, 66049);
                    b.a(0, n3 + 48, n4 + 80 - s[9743], 7, 347, 66049);
                    b.a(0, n3 + 48, n4 + 112 + s[9743], 7, 348, 66049);
                    b.a(0, n3 + 272, n4 + 80 - s[9745], 7, 347, 66049);
                    b.a(0, n3 + 272, n4 + 112 + s[9745], 7, 348, 66049);
                    b.a(n, n3 + 32, n4 + 16, 32, 72);
                    b.a(n, n3 + 32, n4 + 136, 32, 72);
                    if (s[7166 + n] == 0) {
                        b.a(n, n3 + 272, n4 + 16, 16, 192);
                        break;
                    }
                    if (s[7166 + n] != 1) break;
                    b.a(0, n3 + 288, n4 + 80 - 24, 7, 347, 66049);
                    b.a(0, n3 + 288, n4 + 112 + 24, 7, 348, 66049);
                    b.a(1, n3 + 288, 0, 6, 338, 0);
                    b.a(0, n3 + 288, 16, 6, 335, 66305);
                    b.a(1, n3 + 288, 64, 6, 337, 0);
                    b.a(1, n3 + 288, 144, 6, 338, 0);
                    b.a(0, n3 + 288, 160, 6, 335, 66305);
                    b.a(1, n3 + 288, 208, 6, 337, 0);
                    for (n10 = 0; n10 < 5; ++n10) {
                        b.a(0, n3 + 48 + n10 * 16 * 3, 0, 6, 333, 196867);
                        b.a(0, n3 + 48 + n10 * 16 * 3, 208, 6, 334, 196867);
                    }
                    b.a(n, n3 + 272, n4 + 16, 32, 64);
                    b.a(n, n3 + 272, n4 + 144, 32, 64);
                    b.a(n, n3 + 48, n4 + 0, 240, 16);
                    b.a(n, n3 + 48, n4 + 208, 240, 16);
                    break;
                }
                case 112: {
                    int n23;
                    int n10;
                    if (n5 == 0) {
                        b.s[94] = 0;
                        b.s[95] = 0;
                    }
                    if (s[8702 + n] == 0) {
                        switch (s[7166 + n]) {
                            case 1: {
                                b.a(103, 0, 0, 0);
                                s[94] = s[94] + 1;
                                int n27 = 8702 + n;
                                s[n27] = s[n27] + 1;
                                break;
                            }
                            case 2: {
                                b.a(101, 0, 0, 0);
                                s[94] = s[94] + 1;
                                int n28 = 8702 + n;
                                s[n28] = s[n28] + 1;
                                break;
                            }
                            case 3: {
                                b.a(61, 240, 32, 0x1000001);
                                s[94] = s[94] + 1;
                                b.a(61, 240, 64, 0x1000001);
                                s[94] = s[94] + 1;
                                b.a(59, 240, 160, 0x1000001);
                                s[94] = s[94] + 1;
                                b.a(59, 240, 192, 0x1000001);
                                s[94] = s[94] + 1;
                                b.a(62, -32, 32, 0x1000001);
                                s[94] = s[94] + 1;
                                b.a(62, -32, 64, 0x1000001);
                                s[94] = s[94] + 1;
                                b.a(60, -32, 160, 0x1000001);
                                s[94] = s[94] + 1;
                                b.a(60, -32, 192, 0x1000001);
                                s[94] = s[94] + 1;
                                b.s[7678 + n] = 140;
                                int n29 = 8702 + n;
                                s[n29] = s[n29] + 1;
                                break;
                            }
                            case 4: {
                                if (n5 % 16 == 0) {
                                    n23 = s[16] / 100 + s[1126] + s[1143] + s[8190 + n];
                                    b.s[0] = (s[1055 + (n23 & 0x3F)] & 0xF) % 12;
                                    b.a(43, 240, 16 * (s[0] + 1), (s[8190 + n] & 1) + 1 << 24 | s[8190 + n] << 16 | 0 | 4 + s[25] / 7);
                                    s[94] = s[94] + 1;
                                    int n30 = 8190 + n;
                                    s[n30] = s[n30] + 1;
                                    b.s[8190 + n] = s[8190 + n] & 7;
                                }
                                if (n5 < 240) break;
                                int n31 = 8702 + n;
                                s[n31] = s[n31] + 1;
                                b.s[7678 + n] = 280;
                                break;
                            }
                            case 5: {
                                if (n5 == 0) {
                                    b.s[94] = 8;
                                }
                                if (n5 % 90 == 0) {
                                    b.a(59, 240, 176, 257);
                                    b.a(62, -32, 32, 257);
                                } else if (n5 % 45 == 0) {
                                    b.a(61, 240, 32, 257);
                                    b.a(60, -32, 176, 257);
                                }
                                if (n5 < 135) break;
                                int n32 = 8702 + n;
                                s[n32] = s[n32] + 1;
                                b.s[7678 + n] = 225;
                                break;
                            }
                            case 6: {
                                b.a(100, 0, 0, 0);
                                s[94] = s[94] + 1;
                                int n33 = 8702 + n;
                                s[n33] = s[n33] + 1;
                                break;
                            }
                            case 7: {
                                b.a(103, 0, 0, 1);
                                s[94] = s[94] + 1;
                                int n34 = 8702 + n;
                                s[n34] = s[n34] + 1;
                                break;
                            }
                            case 8: {
                                if (n5 == 0) {
                                    b.s[94] = 2;
                                    b.a(79, 240, 48, 0);
                                }
                                if (n5 != 48) break;
                                b.a(79, 240, 160, 0);
                                int n35 = 8702 + n;
                                s[n35] = s[n35] + 1;
                                break;
                            }
                            case 9: {
                                b.a(86, 240, 144, 0);
                                s[94] = s[94] + 1;
                                int n36 = 8702 + n;
                                s[n36] = s[n36] + 1;
                                break;
                            }
                            case 10: {
                                b.a(102, 0, 0, 0);
                                s[94] = s[94] + 1;
                                int n37 = 8702 + n;
                                s[n37] = s[n37] + 1;
                                break;
                            }
                            case 11: {
                                b.a(80, 112, 112, 4);
                                s[94] = s[94] + 1;
                                int n38 = 8702 + n;
                                s[n38] = s[n38] + 1;
                                break;
                            }
                            case 12: {
                                for (n10 = 0; n10 < 14; ++n10) {
                                    b.a(74 + n10 / 7, 240 - n10 / 7 * 272, 16 + n10 % 7 * 16 * 2, 0);
                                    s[94] = s[94] + 1;
                                }
                                b.s[7678 + n] = 180;
                                int n39 = 8702 + n;
                                s[n39] = s[n39] + 1;
                                break;
                            }
                            case 13: {
                                b.a(105, 0, 0, 1);
                                s[94] = s[94] + 1;
                                int n40 = 8702 + n;
                                s[n40] = s[n40] + 1;
                                break;
                            }
                            case 14: {
                                b.a(78, 240, 48, 0);
                                s[94] = s[94] + 1;
                                b.a(78, 240, 144, 0);
                                s[94] = s[94] + 1;
                                int n41 = 8702 + n;
                                s[n41] = s[n41] + 1;
                                break;
                            }
                            case 15: {
                                b.a(105, 0, 0, 0);
                                s[94] = s[94] + 1;
                                int n42 = 8702 + n;
                                s[n42] = s[n42] + 1;
                                break;
                            }
                            case 16: {
                                b.a(101, 0, 0, 1);
                                s[94] = s[94] + 1;
                                int n43 = 8702 + n;
                                s[n43] = s[n43] + 1;
                                break;
                            }
                            case 17: {
                                b.a(80, 112, 112, 1);
                                s[94] = s[94] + 1;
                                int n44 = 8702 + n;
                                s[n44] = s[n44] + 1;
                                break;
                            }
                            case 18: {
                                b.a(78, 240, 144, 0);
                                s[94] = s[94] + 1;
                                b.a(78, -32, 48, 0);
                                s[94] = s[94] + 1;
                                int n45 = 8702 + n;
                                s[n45] = s[n45] + 1;
                                break;
                            }
                            case 19: {
                                if (n5 == 0) {
                                    b.s[94] = 3;
                                    b.a(79, 240, 104, 0);
                                }
                                if (n5 == 32) {
                                    b.a(79, 240, 48, 0);
                                }
                                if (n5 != 64) break;
                                b.a(79, 240, 160, 0);
                                int n46 = 8702 + n;
                                s[n46] = s[n46] + 1;
                            }
                        }
                    }
                    if (s[94] > s[95] && (s[7678 + n] == 0 || n5 < s[7678 + n])) break;
                    b.d(n);
                    b.s[86] = 3;
                    break;
                }
                case 113: {
                    int n10;
                    if (s[7166 + n] == 0) {
                        if (s[53] % 48 != 0) break;
                        s[53] = s[53] - 2;
                        b.s[41] = 0;
                        int n47 = 7166 + n;
                        s[n47] = s[n47] + 1;
                        break;
                    }
                    if (s[7166 + n] == 1) {
                        s[53] = s[53] + 2;
                        if (s[22] == 0) {
                            for (n10 = 0; n10 < 5; ++n10) {
                                graphics.drawRegion(this.f[4], (B[299] >> 24 & 0xFF) * 3 / 4, (B[299] >> 16 & 0xFF) * 3 / 4, (B[299] >> 8 & 0xFF) * 3 / 4, (B[299] & 0xFF) * 3 / 4, 0, 0, ((n4 - 240) / 48 * 48 - s[53] % 48 + n10 * 48) * 3 / 4, 20);
                                graphics.drawRegion(this.f[4], (B[300] >> 24 & 0xFF) * 3 / 4, (B[300] >> 16 & 0xFF) * 3 / 4, (B[300] >> 8 & 0xFF) * 3 / 4, (B[300] & 0xFF) * 3 / 4, 0, 132, ((n4 - 240) / 48 * 48 - s[53] % 48 + n10 * 48) * 3 / 4, 20);
                            }
                        }
                        b.a(0, 0, n4, 6, 334, 196865);
                        b.a(0, 48, n4, 6, 334, 196865);
                        b.a(0, 144, n4, 6, 334, 196865);
                        b.a(0, 192, n4, 6, 334, 196865);
                        b.a(0, 0, n4 + 16, 6, 333, 196865);
                        b.a(0, 48, n4 + 16, 6, 333, 196865);
                        b.a(0, 144, n4 + 16, 6, 333, 196865);
                        b.a(0, 192, n4 + 16, 6, 333, 196865);
                        b.a(0, 64, n4, 7, 345, 131329);
                        b.a(0, 144, n4, 7, 346, 131329);
                        b.a(0, 64, n4 + 16, 7, 345, 131329);
                        b.a(0, 144, n4 + 16, 7, 346, 131329);
                        b.a(n, 0, n4, 96, 32);
                        b.a(n, 144, n4, 96, 32);
                        if (n4 <= -48) {
                            int n48 = 7166 + n;
                            s[n48] = s[n48] + 1;
                            b.s[52] = 0;
                            b.s[53] = 0;
                            b.s[4606 + n] = 4;
                            break;
                        }
                        n4 -= 2;
                        break;
                    }
                    if (s[7166 + n] != 2) break;
                    int n49 = 4606 + n;
                    s[n49] = s[n49] - 1;
                    if (s[n49] <= 0) {
                        b.s[41] = 9;
                        b.s[43] = 2;
                        b.s[42] = 1;
                        b.d(n);
                    }
                    if (s[22] != 0) break;
                    b.a(3, 0, 0, 0, s[4606 + n], 0);
                }
            }
            if (J == 0) {
                b.s[3582 + n] = n3 + s[43] * I;
                b.s[4094 + n] = n4;
                b.s[6654 + n] = ++n5;
            }
            n = n2;
        }
    }

    private void h() {
        if (s[76] < -40) {
            int n;
            if (s[76] == -52) {
                b.b(10);
                for (n = 0; n < 20; ++n) {
                    b.s[1245 + n] = -1;
                }
            }
            if (s[76] < -48) {
                b.a(0, s[1126], s[1143] - 2 - 8, 15, 113 + (s[76] - -52), 131592);
            }
            s[76] = s[76] + 1;
            if (s[76] == -40) {
                b.s[1126] = 32;
                b.s[1143] = 104;
                b.s[63] = 0;
                b.s[64] = 48;
                b.s[59] = 5;
                b.s[60] = 0;
                b.s[61] = 0;
                b.s[65] = 2;
                b.s[84] = 0;
                b.s[62] = 0;
                for (n = 1; n < 17; ++n) {
                    b.s[1126 + n] = s[1126];
                    b.s[1143 + n] = s[1143];
                }
                for (n = 1; n < 5; ++n) {
                    b.s[1160 + n] = s[1126 + n * 4];
                    b.s[1165 + n] = s[1143 + n * 4];
                }
                b.s[82] = 0;
                b.s[81] = 0;
                b.s[83] = 0;
                b.s[1119] = 1;
                b.s[79] = 1;
                s[1143] = s[1143] + s[54];
                b.s[1126] = -32;
                for (n = 1; n < 17; ++n) {
                    b.s[1126 + n] = -32;
                    b.s[1143 + n] = 112;
                }
                b.e();
                s[17] = s[17] - 1;
                if (s[17] < 0) {
                    b = 21;
                    b.s[17] = 0;
                    return;
                }
            }
        } else {
            if (s[76] < -32) {
                int n;
                for (n = 16; n >= 1; --n) {
                    b.s[1126 + n] = s[1126 + (n - 1)];
                    b.s[1143 + n] = s[1143 + (n - 1)];
                }
                s[1126] = s[1126] + 8;
                b.s[1160] = s[1126];
                b.s[1165] = s[1143];
                for (n = 1; n <= s[65]; ++n) {
                    b.s[1160 + n] = s[1126 + n * 4];
                    b.s[1165 + n] = s[1143 + n * 4];
                }
                for (n = 1; n <= s[65]; ++n) {
                    int n2 = (s[9] & 3) == 0 ? 104 + s[84] * 3 : 104 + (s[9] & 3) - 1 + s[84] * 3;
                    b.a(1, s[1160 + n] + 8, s[1165 + n], 15, n2, 0);
                }
                b.a(3, s[1126], s[1143], 15, 0, 0);
                s[76] = s[76] + 1;
                return;
            }
            if (s[76] <= 0) {
                int n;
                int n3;
                if ((s[12] & 0x400000) != 0 && s[79] >= 1) {
                    switch (s[79]) {
                        case 1: {
                            if (s[59] >= 13) break;
                            s[59] = s[59] + 2;
                            b.s[79] = 0;
                            b.b(7);
                            break;
                        }
                        case 2: {
                            if (s[61] > 0) break;
                            b.s[61] = 20;
                            if (s[69] == 1) {
                                b.s[61] = 21;
                            }
                            b.s[79] = 0;
                            b.b(7);
                            break;
                        }
                        case 3: {
                            if (s[60] != 0 && s[60] < 8) break;
                            b.s[60] = 1;
                            if (s[70] == 1) {
                                b.s[60] = 3;
                            } else if (s[70] == 2) {
                                b.s[60] = 5;
                            } else if (s[70] == 3) {
                                b.s[60] = 7;
                            }
                            b.s[79] = 0;
                            b.b(7);
                            break;
                        }
                        case 4: {
                            if (s[60] >= 8) break;
                            b.s[60] = 8;
                            b.s[79] = 0;
                            b.b(7);
                            break;
                        }
                        case 5: {
                            if (s[65] < 4) {
                                s[65] = s[65] + 1;
                                if (s[81] == 6) {
                                    b.s[1160 + b.s[65]] = s[1126] - 16;
                                    b.s[1165 + b.s[65]] = s[1143];
                                }
                                b.s[79] = 0;
                                b.b(7);
                                break;
                            }
                            if (s[71] != 1 || s[84] >= 2) break;
                            s[84] = s[84] + 1;
                            b.s[79] = 0;
                            b.b(7);
                            break;
                        }
                        case 6: {
                            if (s[62] > 0) break;
                            b.s[62] = 6;
                            b.s[79] = 0;
                            b.b(7);
                        }
                    }
                    b.f();
                    b.e();
                }
                if ((s[12] & 0x800000) != 0 && s[80] >= 1 && s[1119 + s[80]] == 0) {
                    b.s[1119 + b.s[80]] = 1;
                    b.s[80] = 0;
                    b.b(7);
                }
                if (s[86] < 6) {
                    if ((s[11] & 0x66) != 0) {
                        for (n3 = 16; n3 >= 1; --n3) {
                            b.s[1126 + n3] = s[1126 + (n3 - 1)];
                            b.s[1143 + n3] = s[1143 + (n3 - 1)];
                        }
                    }
                    n = 0;
                    n3 = 0;
                    if ((s[11] & 0x40) != 0) {
                        if (s[41] != 3) {
                            s[1143] = s[1143] + s[59];
                        } else {
                            b.s[1143] = s[1143] + s[59];
                            if (s[41] == 3 && s[1143] - s[54] >= 144) {
                                s[44] = s[44] + s[59];
                            }
                        }
                        s[63] = s[63] + 2;
                        ++n3;
                        if ((s[11] & 0x10020) == 0) {
                            n += 64;
                        }
                    }
                    if ((s[11] & 2) != 0) {
                        if (s[41] != 3) {
                            s[1143] = s[1143] - s[59];
                        } else {
                            b.s[1143] = s[1143] - s[59];
                            if (s[41] == 3 && s[1143] - s[54] < 80) {
                                s[44] = s[44] - s[59];
                            }
                        }
                        s[63] = s[63] - 2;
                        ++n3;
                        n += 32;
                    }
                    if ((s[11] & 0x20) != 0) {
                        s[1126] = s[1126] + s[59];
                        ++n3;
                        n += 16;
                    }
                    if ((s[11] & 4) != 0) {
                        s[1126] = s[1126] - s[59];
                        ++n3;
                        n += 48;
                    }
                    if (s[60] == 17) {
                        if ((s[12] & 0x1000) != 0) {
                            boolean bl = b.a[6] = !a[6];
                        }
                        if (!a[6] && 0 < n3 && n3 <= 2) {
                            n /= n3;
                            if ((n %= 64) != s[64]) {
                                n3 = n - s[64];
                                n3 = n3 <= -32 || 32 <= n3 ? -1 : 1;
                                b.s[64] = n > s[64] ? s[64] + n3 * 4 : s[64] - n3 * 4;
                                b.s[64] = (s[64] + 64) % 64;
                            }
                        }
                    }
                }
                int n4 = 3;
                if (s[76] != 0) {
                    s[76] = s[76] + 1;
                    if ((s[76] & 3) >= 2) {
                        n4 = 0;
                    }
                } else {
                    if (0 < s[62] && (b.c(s[1126] + 4, s[1143] + 2 - s[54]) | b.c(s[1126] + 20, s[1143] + 2 - s[54])) < 0) {
                        s[62] = s[62] - 1;
                    }
                    if (b.c(s[1126] + 10, s[1143] - s[54]) < 0) {
                        b.s[76] = -52;
                    }
                }
                if (s[1126] < -4) {
                    b.s[1126] = -4;
                }
                if (208 < s[1126]) {
                    b.s[1126] = 208;
                }
                if (s[41] == 2) {
                    if (s[1143] < s[54] + 12) {
                        b.s[1143] = s[54] + 12;
                    }
                    if (s[54] + 224 - 12 < s[1143]) {
                        b.s[1143] = s[54] + 224 - 12;
                    }
                } else {
                    if (s[1143] < 12) {
                        b.s[1143] = 12;
                    }
                    if (s[36] - 12 < s[1143]) {
                        b.s[1143] = s[36] - 12;
                    }
                }
                b.a(n4, s[1126], s[1143], 15, 0, 0);
                if ((s[12] & 0xFF900) != 0) {
                    n = 0;
                    for (n3 = 1; n3 < 7; ++n3) {
                        if (s[1119 + n3] != 1) continue;
                        ++n;
                    }
                    if ((s[12] & 0x1F800) != 0) {
                        n = 0;
                        for (int i = 1; i <= 6; ++i) {
                            if ((s[12] >> i & 0x400) == 0 || s[1119 + i] != 1 || s[81] == i) continue;
                            n = i;
                        }
                    } else if ((s[12] & 0xE0000) != 0) {
                        n = 0;
                        if (s[81] != 0) {
                            n = 7;
                        }
                    }
                    if (n > 0 && s[82] == 0) {
                        if (s[81] == 3 && s[1245] != -1 && s[1225] < 21) {
                            b.s[1225] = 21;
                        } else if (s[81] == 6) {
                            for (n3 = 1; n3 <= s[65]; ++n3) {
                                b.s[1245 + n3 * 4] = -1;
                            }
                        }
                        if ((s[12] & 0x100) != 0) {
                            do {
                                s[81] = s[81] + 1;
                                s[81] = s[81] % 7;
                            } while (s[1119 + s[81]] == 0);
                        } else {
                            b.s[81] = n % 7;
                        }
                        for (n3 = 1; n3 < 5; ++n3) {
                            b.s[1170 + n3] = s[1160 + n3] << 4;
                            b.s[1175 + n3] = s[1165 + n3] << 4;
                        }
                        b.s[82] = 1;
                        b.b(6);
                    }
                }
                b.s[1160] = s[1126];
                b.s[1165] = s[1143];
                if (s[82] == 0) {
                    switch (s[81]) {
                        case 0: {
                            for (n3 = 1; n3 <= s[65]; ++n3) {
                                b.s[1160 + n3] = s[1126 + n3 * 4];
                                b.s[1165 + n3] = s[1143 + n3 * 4];
                            }
                            break;
                        }
                        case 1: {
                            for (n3 = 1; n3 < 5; ++n3) {
                                b.s[1160 + n3] = s[1126] + (s[471 + (s[9] * 2 + 32 * n3 + 16 * (n3 / 3)) % 64] * 48 >> 4);
                                b.s[1165 + n3] = s[1143] + (s[455 + (s[9] * 2 + 32 * n3 + 16 * (n3 / 3)) % 64] * 42 >> 4);
                            }
                            break;
                        }
                        case 2: {
                            b.s[1161] = s[1126] + 48;
                            b.s[1166] = s[1143] + 0;
                            b.s[1162] = s[1126] + 0;
                            b.s[1167] = s[1143] + -48;
                            b.s[1163] = s[1126] + 0;
                            b.s[1168] = s[1143] + 48;
                            b.s[1164] = s[1126] + -48;
                            b.s[1169] = s[1143] + 0;
                            break;
                        }
                        case 3: {
                            b.s[1161] = s[1126] + 32;
                            b.s[1166] = s[1143] + -8;
                            b.s[1162] = s[1126] + 32;
                            b.s[1167] = s[1143] + 8;
                            b.s[1163] = s[1126] + 48;
                            b.s[1168] = s[1143] + -16;
                            b.s[1164] = s[1126] + 48;
                            b.s[1169] = s[1143] + 16;
                            break;
                        }
                        case 4: {
                            b.s[1161] = s[1126] + -32;
                            b.s[1166] = s[1143] + -16;
                            b.s[1162] = s[1126] + -32;
                            b.s[1167] = s[1143] + 16;
                            b.s[1163] = s[1126] + 0;
                            b.s[1168] = s[1143] + -40;
                            b.s[1164] = s[1126] + 0;
                            b.s[1169] = s[1143] + 40;
                            break;
                        }
                        case 5: {
                            b.s[1161] = s[1126] + 0;
                            b.s[1166] = s[1143] + -40;
                            b.s[1162] = s[1126] + 0;
                            b.s[1167] = s[1143] + 40;
                            b.s[1163] = s[1126] + 0;
                            b.s[1168] = s[1143] + -80;
                            b.s[1164] = s[1126] + 0;
                            b.s[1169] = s[1143] + 80;
                            break;
                        }
                        case 6: {
                            for (n3 = 1; n3 <= s[65]; ++n3) {
                                if (s[1180 + n3] == 0) {
                                    int n5 = 1160 + n3;
                                    s[n5] = s[n5] + 16;
                                    if (240 > s[1160 + n3]) continue;
                                    b.s[1160 + n3] = 224;
                                    int n6 = 1180 + n3;
                                    s[n6] = s[n6] + 1;
                                    continue;
                                }
                                if (s[1180 + n3] == 1) {
                                    int n7 = 1160 + n3;
                                    s[n7] = s[n7] - 4;
                                    if ((s[1126] - 16 - s[1160 + n3] & s[1160 + n3] - (s[1126] + 16) & s[1143] - 16 - s[1165 + n3] & s[1165 + n3] - (s[1143] + 16)) < 0) {
                                        b.s[1180 + n3] = 0;
                                        b.s[1165 + n3] = s[1143];
                                        continue;
                                    }
                                    if (s[1160 + n3] > -8) continue;
                                    b.s[1180 + n3] = 2;
                                    b.s[1170 + n3] = s[1160 + n3] << 4;
                                    b.s[1175 + n3] = s[1165 + n3] << 4;
                                    continue;
                                }
                                if (s[1180 + n3] == 2) {
                                    int n8 = 1170 + n3;
                                    s[n8] = s[n8] + s[455 + b.b(s[1170 + n3] >> 4, s[1175 + n3] >> 4)] * 8;
                                    int n9 = 1175 + n3;
                                    s[n9] = s[n9] + s[471 + b.b(s[1170 + n3] >> 4, s[1175 + n3] >> 4)] * 8;
                                    b.s[1160 + n3] = s[1170 + n3] >> 4;
                                    b.s[1165 + n3] = s[1175 + n3] >> 4;
                                    if ((s[1126] - 8 - s[1160 + n3] & s[1160 + n3] - (s[1126] + 8) & s[1143] - 8 - s[1165 + n3] & s[1165 + n3] - (s[1143] + 8)) >= 0) continue;
                                    b.s[1180 + n3] = 0;
                                    b.s[1165 + n3] = s[1143];
                                    continue;
                                }
                                int n10 = 1180 + n3;
                                s[n10] = s[n10] + 1;
                                b.s[1160 + n3] = s[1126];
                                b.s[1165 + n3] = s[1143];
                            }
                            break;
                        }
                    }
                }
                switch (s[82]) {
                    case 1: {
                        for (n3 = 1; n3 < 5; ++n3) {
                            int n11 = 1170 + n3;
                            s[n11] = s[n11] + s[455 + b.b(s[1170 + n3] >> 4, s[1175 + n3] >> 4)] * 8;
                            int n12 = 1175 + n3;
                            s[n12] = s[n12] + s[471 + b.b(s[1170 + n3] >> 4, s[1175 + n3] >> 4)] * 8;
                            b.s[1160 + n3] = s[1170 + n3] >> 4;
                            b.s[1165 + n3] = s[1175 + n3] >> 4;
                        }
                        n = 0;
                        for (n3 = 1; n3 <= s[65]; ++n3) {
                            if ((s[1126] - 16 - s[1160 + n3] & s[1160 + n3] - (s[1126] + 16) & s[1143] - 16 - s[1165 + n3] & s[1165 + n3] - (s[1143] + 16)) >= 0) continue;
                            ++n;
                        }
                        if (n < s[65]) break;
                        b.s[82] = 2;
                        b.s[83] = 0;
                        break;
                    }
                    case 2: {
                        switch (s[81]) {
                            case 0: {
                                for (n3 = 1; n3 < 17; ++n3) {
                                    b.s[1126 + n3] = s[1126];
                                    b.s[1143 + n3] = s[1143];
                                }
                                b.s[82] = 0;
                                break;
                            }
                            case 1: {
                                for (n3 = 1; n3 < 5; ++n3) {
                                    b.s[1160 + n3] = s[1126] + (s[471 + (s[9] * 2 + 32 * n3 + 16 * (n3 / 3)) % 64] * (16 * s[83]) >> 4);
                                    b.s[1165 + n3] = s[1143] + (s[455 + (s[9] * 2 + 32 * n3 + 16 * (n3 / 3)) % 64] * (14 * s[83]) >> 4);
                                }
                                int n13 = s[83];
                                s[83] = n13 + 1;
                                if (n13 < 3) break;
                                b.s[82] = 0;
                                break;
                            }
                            case 2: {
                                b.s[1161] = s[1126] + 16 * s[83];
                                b.s[1166] = s[1143] + 0;
                                b.s[1162] = s[1126] + 0;
                                b.s[1167] = s[1143] + 16 * -s[83];
                                b.s[1163] = s[1126] + 0;
                                b.s[1168] = s[1143] + 16 * s[83];
                                b.s[1164] = s[1126] + 16 * -s[83];
                                b.s[1169] = s[1143] + 0;
                                int n14 = s[83];
                                s[83] = n14 + 1;
                                if (n14 < 3) break;
                                b.s[82] = 0;
                                break;
                            }
                            case 3: {
                                b.s[1161] = s[1126] + 10 * s[83];
                                b.s[1166] = s[1143] + -2 * s[83];
                                b.s[1162] = s[1126] + 10 * s[83];
                                b.s[1167] = s[1143] + 2 * s[83];
                                b.s[1163] = s[1126] + 16 * s[83];
                                b.s[1168] = s[1143] + -5 * s[83];
                                b.s[1164] = s[1126] + 16 * s[83];
                                b.s[1169] = s[1143] + 5 * s[83];
                                int n15 = s[83];
                                s[83] = n15 + 1;
                                if (n15 < 3) break;
                                b.s[82] = 0;
                                break;
                            }
                            case 4: {
                                b.s[1161] = s[1126] + -10 * s[83];
                                b.s[1166] = s[1143] + -5 * s[83];
                                b.s[1162] = s[1126] + -10 * s[83];
                                b.s[1167] = s[1143] + 5 * s[83];
                                b.s[1163] = s[1126] + 0 * s[83];
                                b.s[1168] = s[1143] + -13 * s[83];
                                b.s[1164] = s[1126] + 0 * s[83];
                                b.s[1169] = s[1143] + 13 * s[83];
                                int n16 = s[83];
                                s[83] = n16 + 1;
                                if (n16 < 3) break;
                                b.s[82] = 0;
                                break;
                            }
                            case 5: {
                                b.s[1161] = s[1126] + 0;
                                b.s[1166] = s[1143] + -s[83] * 16 * 5 / 6;
                                b.s[1162] = s[1126] + 0;
                                b.s[1167] = s[1143] + s[83] * 16 * 5 / 6;
                                b.s[1163] = s[1126] + 0;
                                b.s[1168] = s[1143] + -s[83] * 16 * 5 / 3;
                                b.s[1164] = s[1126] + 0;
                                b.s[1169] = s[1143] + s[83] * 16 * 5 / 3;
                                int n17 = s[83];
                                s[83] = n17 + 1;
                                if (n17 < 3) break;
                                b.s[82] = 0;
                                break;
                            }
                            case 6: {
                                for (n3 = 1; n3 <= s[65]; ++n3) {
                                    b.s[1180 + n3] = -n3 * 6;
                                }
                                b.s[82] = 0;
                            }
                        }
                        if (s[82] != 0) break;
                        b.f();
                    }
                }
                for (n3 = 1; n3 <= s[65]; ++n3) {
                    n4 = (s[9] & 3) == 0 ? 104 + s[84] * 3 : 104 + (s[9] & 3) - 1 + s[84] * 3;
                    b.a(1, s[1160 + n3] + 8, s[1165 + n3], 15, n4, 0);
                }
                n3 = s[11] | -s[21];
                if ((s[11] & 0x400) * s[21] != 0) {
                    n3 = 0;
                }
                if (s[86] < 4 && (n3 & 0x400) != 0 && s[82] == 0) {
                    for (n3 = 0; n3 <= s[65]; ++n3) {
                        n = n3 * 4;
                        if (s[60] == 10) {
                            if (n3 == 0 && s[1245 + n] < 0) {
                                b.s[1225 + n] = 0;
                                b.s[1245 + n] = s[60];
                                b.s[1249] = -1;
                                b.s[1253] = -1;
                                b.s[1257] = -1;
                                b.s[1261] = -1;
                            }
                        } else if (s[60] == 11) {
                            if (s[1245 + n] < 0) {
                                b.s[1245 + n] = n3 == 0 ? 8 : s[60];
                                b.s[1185 + n] = s[1160 + n3] + 8 + 16 - 4;
                                b.s[1205 + n] = s[1165 + n3] - 8;
                                b.s[1225 + n] = -1;
                            }
                        } else if (s[60] == 19) {
                            if (s[1245 + n] < 0) {
                                if (n3 == 0) {
                                    b.s[1245 + n] = 8;
                                    b.s[1185 + n] = s[1160 + n3] - 16;
                                    b.s[1205 + n] = s[1165 + n3];
                                } else if (s[1180 + n3] == 1) {
                                    b.s[1245 + n] = s[60];
                                    b.s[1185 + n] = s[1160 + n3] + 8;
                                    b.s[1205 + n] = s[1165 + n3];
                                    b.s[1225 + n] = 0;
                                }
                            }
                        } else if (s[60] == 7) {
                            if (s[1245 + n] < 0) {
                                b.s[1185 + n] = s[1160 + n3] - 32;
                                b.s[1205 + n] = s[1165 + n3] - 16;
                                b.s[1245 + n] = s[60];
                                b.s[1225 + n] = -1;
                            } else if (s[1245 + ++n] < 0) {
                                b.s[1185 + n] = s[1160 + n3] - 32;
                                b.s[1205 + n] = s[1165 + n3] - 16;
                                b.s[1245 + n] = s[60];
                                b.s[1225 + n] = -1;
                            }
                        } else {
                            if (s[1245 + n] < 0) {
                                b.s[1185 + n] = s[1160 + n3] - 16;
                                b.s[1205 + n] = s[1165 + n3];
                                b.s[1245 + n] = s[60];
                                if (s[1245 + n] == 17) {
                                    b.s[1225 + n] = (s[64] + 32) % 64;
                                    b.s[1185 + n] = s[1160 + n3] + 8;
                                }
                                if (s[1245 + n] == 18) {
                                    b.s[1185 + n] = s[1160 + n3] + 8;
                                }
                                if (n3 == 0 && s[60] == 8) {
                                    b.b(4);
                                }
                            } else if (s[60] == 0 || s[60] >= 16) {
                                if (s[1245 + ++n] < 0) {
                                    b.s[1185 + n] = s[1160 + n3] - 16;
                                    b.s[1205 + n] = s[1165 + n3];
                                    b.s[1245 + n] = s[60];
                                    if (s[1245 + n] == 17) {
                                        b.s[1225 + n] = (s[64] + 32) % 64;
                                        b.s[1185 + n] = s[1160 + n3] + 8;
                                    }
                                    if (s[1245 + n] == 18) {
                                        b.s[1185 + n] = s[1160 + n3] + 8;
                                    }
                                }
                                if (n3 == 0 && s[60] == 8) {
                                    b.b(4);
                                }
                            }
                            if (s[60] == 1) {
                                if (s[1245 + ++n] < 0) {
                                    b.s[1185 + n] = s[1160 + n3];
                                    b.s[1205 + n] = s[1165 + n3] + 8;
                                    b.s[1245 + n] = 2;
                                }
                            } else if (s[60] == 3) {
                                if (s[1245 + ++n] < 0) {
                                    b.s[1185 + n] = s[1160 + n3] + 32;
                                    b.s[1205 + n] = s[1165 + n3];
                                    b.s[1245 + n] = 4;
                                }
                            } else if (s[60] == 5 && s[1245 + ++n] < 0) {
                                b.s[1185 + n] = s[1160 + n3] + 8;
                                b.s[1205 + n] = s[1165 + n3] + 24;
                                b.s[1245 + n] = 6;
                            }
                        }
                        n = n3 * 4 + 2;
                        if (s[61] == 20 && s[1245 + n] < 0) {
                            b.s[1185 + n] = s[1160 + n3] + 12;
                            b.s[1205 + n] = s[1165 + n3];
                            b.s[1245 + n] = s[61];
                        }
                        if (s[61] < 21) continue;
                        if (s[1245 + n] < 0) {
                            b.s[1185 + n] = s[1160 + n3] + 16;
                            b.s[1205 + n] = s[1165 + n3];
                            b.s[1225 + n] = 0;
                            b.s[1245 + n] = 21;
                        }
                        if (s[1245 + ++n] >= 0) continue;
                        b.s[1185 + n] = s[1160 + n3] + 16;
                        b.s[1205 + n] = s[1165 + n3];
                        b.s[1225 + n] = 0;
                        b.s[1245 + n] = 22;
                    }
                }
            }
        }
    }

    /*
     * Opcode count of 15774 triggered aggressive code reduction.  Override with --aggressivesizethreshold.
     */
    public final void paint(Graphics graphics) {
        if (b == 202) {
            return;
        }
        try {
            System.gc();
            s[9] = s[9] + 1;
            b.s[11] = this.i;
            this.i &= ~this.j;
            this.j = 0;
            b.s[12] = s[13];
            b.s[13] = 0;
            graphics.setColor(0);
            if (a[1]) {
                graphics.fillRect(0, 0, z * 3 / 4, (A + 5) * 3 / 4);
            }
            graphics.setFont(O);
            if (b == 6) {
                graphics.translate(s[7], (A - 192) / 2);
            } else {
                graphics.translate(s[7], s[8]);
            }
            graphics.fillRect(0, 0, 180, 183);
            switch (b) {
                case 206: {
                    this.Q = System.currentTimeMillis() + 2000L;
                    this.P = Image.createImage((String)"/konami.png");
                    this.a(0, "c1");
                    graphics.drawImage(this.P, 90, 90, 3);
                    this.a(graphics, "LOADING", 71, 162);
                    b = 1;
                    break;
                }
                case 1: {
                    try {
                        x = RecordStore.openRecordStore((String)"R", (boolean)true);
                        if (x.getNumRecords() == 0) {
                            b.H[0] = 2;
                            H[0] = (byte)(H[0] | 0x20);
                            b.H[1] = 1;
                            b.H[2] = (byte)s[22];
                            b.H[3] = (byte)s[35];
                            b.H[4] = (byte)s[33];
                            b.H[8] = -33;
                            b.H[9] = -44;
                            b.H[13] = 117;
                            b.H[14] = 48;
                            b.H[18] = 39;
                            b.H[19] = 16;
                            b.H[23] = 2;
                            b.H[28] = 0;
                            b.H[29] = 1;
                            b.H[30] = 17;
                            b.H[31] = 112;
                            b.H[32] = 2;
                            b.H[33] = 3;
                            b.H[37] = 5;
                            b.H[40] = 2;
                            b.H[52] = 1;
                            b.H[53] = 1;
                            b.H[54] = 1;
                            x.addRecord(H, 0, 78);
                        } else {
                            x.getRecord(1, H, 0);
                        }
                        x.closeRecordStore();
                    }
                    catch (Throwable throwable) {}
                    b.f(0);
                    b.f(20);
                    b.f(52);
                    b.s[66] = H[52];
                    b.s[67] = H[53];
                    b.s[68] = H[54];
                    b.s[69] = H[55];
                    b.s[70] = H[56];
                    b.s[71] = H[57];
                    graphics.drawImage(this.P, 90, 90, 3);
                    this.a(graphics, "LOADING", 71, 162);
                    ++b;
                    break;
                }
                case 2: {
                    int n;
                    try {
                        this.f[5] = Image.createImage((String)"/img_sub");
                    }
                    catch (Throwable throwable) {}
                    this.a(1, "c2");
                    this.a("c");
                    int n2 = y[4] << 8 | y[5] & 0xFF;
                    for (n = 0; n < 20; ++n) {
                        b.s[307 + n] = (y[n2] & 0xFF) << 16 | (y[n2 + 1] & 0xFF) << 8 | y[n2 + 2] & 0xFF;
                        n2 += 3;
                    }
                    for (n = 0; n < 792; ++n) {
                        b.s[327 + n] = y[n2++];
                    }
                    b.s[0] = 0;
                    b.s[3] = 0;
                    this.a(2, "title");
                    graphics.drawImage(this.P, 90, 90, 3);
                    this.a(graphics, "LOADING", 71, 162);
                    b = 207;
                    break;
                }
                case 207: {
                    graphics.drawImage(this.P, 90, 90, 3);
                    if (System.currentTimeMillis() <= this.Q && s[12] == 0) break;
                    this.Q = System.currentTimeMillis() + 2000L;
                    b = 208;
                    this.P = null;
                    break;
                }
                case 208: {
                    long l = System.currentTimeMillis();
                    if (l > this.Q || s[12] != 0) {
                        b = 5;
                        graphics.drawRegion(this.f[2], (B[349] >> 24 & 0xFF) * 3 / 4, (B[349] >> 16 & 0xFF) * 3 / 4, (B[349] >> 8 & 0xFF) * 3 / 4, (B[349] & 0xFF) * 3 / 4, 0, 0, 24, 20);
                        break;
                    }
                    if (l > this.Q - 500L) {
                        int n = (int)(500L - this.Q + l);
                        graphics.drawRegion(this.f[2], (B[349] >> 24 & 0xFF) * 3 / 4, (B[349] >> 16 & 0xFF) * 3 / 4, (B[349] >> 8 & 0xFF) * 3 / 4, (B[349] & 0xFF) * 3 / 4, 0, 0, (80 - 48 * n / 500) * 3 / 4, 20);
                        break;
                    }
                    graphics.drawRegion(this.f[2], (B[349] >> 24 & 0xFF) * 3 / 4, (B[349] >> 16 & 0xFF) * 3 / 4, (B[349] >> 8 & 0xFF) * 3 / 4, (B[349] & 0xFF) * 3 / 4, 0, 0, 60, 20);
                    break;
                }
                case 4: {
                    this.a();
                    System.gc();
                    this.a(2, "title");
                }
                case 5: {
                    if (b == 5) {
                        graphics.drawRegion(this.f[2], (B[349] >> 24 & 0xFF) * 3 / 4, (B[349] >> 16 & 0xFF) * 3 / 4, (B[349] >> 8 & 0xFF) * 3 / 4, (B[349] & 0xFF) * 3 / 4, 0, 0, 24, 20);
                    }
                    b.a[9] = false;
                    b.a[4] = false;
                    b.a[5] = false;
                    b.s[9] = 0;
                    b = 6;
                    b.s[3] = 0;
                    b.s[2] = 0;
                    b.s[1] = 0;
                    b.s[0] = 0;
                    this.a(6, 2);
                    b.a(27);
                    break;
                }
                case 6: {
                    graphics.setColor(0);
                    graphics.fillRect(-graphics.getTranslateX(), -graphics.getTranslateY(), z * 2, A * 2);
                    boolean bl = false;
                    graphics.drawRegion(this.f[2], (B[349] >> 24 & 0xFF) * 3 / 4, (B[349] >> 16 & 0xFF) * 3 / 4, (B[349] >> 8 & 0xFF) * 3 / 4, (B[349] & 0xFF) * 3 / 4, 0, 0, 24, 20);
                    this.a(graphics, 212, 7, 8, 9);
                    this.a(graphics, s[97], 7, 134, 9, 4);
                    boolean bl2 = false;
                    boolean bl3 = false;
                    boolean bl4 = false;
                    this.a(graphics, 7, 10, 43, 120);
                    boolean bl5 = false;
                    this.a(graphics, 17, 8, 43, 136);
                    this.a(graphics, 37, 10, 43, 152);
                    this.a(graphics, 47, 12, 43, 168);
                    boolean bl6 = false;
                    this.a(graphics, 59, 11, 43, 184);
                    boolean bl7 = false;
                    boolean bl8 = false;
                    this.a(graphics, "ABOUT", 43, 200);
                    this.a(graphics, "EXIT", 43, 216);
                    if ((s[12] & 2) != 0) {
                        s[0] = s[0] + 6;
                    } else if ((s[12] & 0x40) != 0) {
                        s[0] = s[0] + 1;
                    }
                    s[0] = s[0] % 7;
                    graphics.drawRegion(this.f[0], (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4, 0, 20, (120 + s[0] * 16 - 2) * 3 / 4, 20);
                    if ((s[12] & 0x800000) != 0) {
                        this.a(6, 3);
                        b = 201;
                    }
                    if ((s[12] & 0x100) == 0) break;
                    this.a(6, 6);
                    if (s[0] == 0) {
                        this.a(6, 3);
                        b = 13;
                    } else if (s[0] == 1) {
                        b = 16;
                    } else if (s[0] == 2) {
                        this.a(6, 3);
                        b = 14;
                    } else if (s[0] == 3) {
                        this.a(6, 3);
                        this.k = 5;
                        b = 8;
                        this.l = 0;
                    } else if (s[0] == 4) {
                        b = 7;
                    } else if (s[0] == 5) {
                        this.a(6, 3);
                        b = 200;
                        this.l = 0;
                    } else if (s[0] == 6) {
                        this.a(6, 3);
                        b = 201;
                    }
                    b.s[0] = 0;
                    b.s[1] = -1;
                    break;
                }
                case 7: {
                    if (s[1] == -1) {
                        graphics.drawRegion(this.f[2], (B[349] >> 24 & 0xFF) * 3 / 4, (B[349] >> 16 & 0xFF) * 3 / 4, (B[349] >> 8 & 0xFF) * 3 / 4, (B[349] & 0xFF) * 3 / 4, 0, 0, (32 - 4 * s[0]) * 3 / 4, 20);
                    } else {
                        graphics.drawRegion(this.f[2], (B[349] >> 24 & 0xFF) * 3 / 4, (B[349] >> 16 & 0xFF) * 3 / 4, (B[349] >> 8 & 0xFF) * 3 / 4, (B[349] & 0xFF) * 3 / 4, 0, 0, (16 + 4 * s[0]) * 3 / 4, 20);
                    }
                    s[0] = s[0] + 1;
                    if (s[0] < 4) break;
                    b = 5;
                    if (s[1] != -1) break;
                    this.a(6, 3);
                    b = 9;
                    b.s[1] = 0;
                    b.s[0] = 0;
                    break;
                }
                case 8: {
                    this.d(graphics);
                    break;
                }
                case 200: {
                    this.e(graphics);
                    break;
                }
                case 201: {
                    this.g(graphics);
                    break;
                }
                case 9: {
                    int n;
                    int n3;
                    graphics.drawRegion(this.f[2], (B[349] >> 24 & 0xFF) * 3 / 4, (B[349] >> 16 & 0xFF) * 3 / 4, (B[349] >> 8 & 0xFF) * 3 / 4, (B[349] & 0xFF) * 3 / 4, 0, 0, 12, 20);
                    int n4 = 0;
                    this.a(graphics, 59, 11, 43, 112);
                    boolean bl = false;
                    this.a(graphics, 70, 12, 42, 144);
                    boolean bl9 = false;
                    this.a(graphics, 82, 13, 42, 160);
                    this.a(graphics, 95, 10, 42, 176);
                    String[] stringArray = new String[]{"NONE", "BGM", "SFX"};
                    this.a(graphics, "SOUND - " + stringArray[o], 42, 192);
                    if (s[33] > 0) {
                        n3 = 4;
                        this.a(graphics, 105, 10, 42, 208);
                        n = 5;
                        this.a(graphics, 294, 7, 42, 224);
                    } else {
                        n3 = -1;
                        n = 4;
                        this.a(graphics, 294, 7, 42, 208);
                    }
                    n4 = n;
                    if ((s[12] & 2) != 0) {
                        s[0] = s[0] + (n4 - 1 + 1);
                    } else if ((s[12] & 0x40) != 0) {
                        s[0] = s[0] + 1;
                    }
                    s[0] = s[0] % (n4 + 1);
                    graphics.drawRegion(this.f[0], (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4, 0, 19, (144 + 16 * s[0] - 2) * 3 / 4, 20);
                    if ((s[12] & 0x800000) != 0) {
                        b = 7;
                        b.s[1] = 0;
                        b.s[0] = 0;
                    }
                    if ((s[12] & 0x100) == 0) break;
                    if (s[0] == 0) {
                        b = 10;
                        b.s[0] = 0;
                        b.s[1] = s[23];
                        b.s[2] = s[21];
                        b.s[3] = s[22];
                        b.s[10] = 0;
                        break;
                    }
                    if (s[0] == 1) {
                        b = 12;
                        b.s[0] = 0;
                        b.s[1] = s[69];
                        b.s[2] = s[70];
                        b.s[3] = s[71];
                        b.s[10] = 0;
                        break;
                    }
                    if (s[0] == 2) {
                        b = 11;
                        break;
                    }
                    if (s[0] == n3 && s[33] > 0) {
                        b.s[2] = 0;
                        b.s[1] = 0;
                        b.s[0] = 0;
                        b = 26;
                        break;
                    }
                    if (s[0] == n) {
                        b = 7;
                        b.s[1] = 0;
                        b.s[0] = 0;
                        break;
                    }
                    if (s[0] != 3) break;
                    this.i();
                    break;
                }
                case 10: {
                    this.a(graphics, 70, 12, 36, 16);
                    this.a(graphics, 125, 10, 28, 48);
                    this.a(graphics, 135 + s[1] * 7, 7, 126, 64);
                    this.a(graphics, 163, 8, 28, 96);
                    this.a(graphics, 171 + s[2] * 3, 3, 182, 112);
                    this.a(graphics, 177, 13, 28, 144);
                    this.a(graphics, 190 + s[3] * 4, 4, 168, 160);
                    this.a(graphics, 198, 4, 28, 192);
                    this.a(graphics, 294, 7, 28, 208);
                    if ((s[12] & 2) != 0) {
                        s[0] = s[0] + 4;
                    } else if ((s[12] & 0x40) != 0) {
                        s[0] = s[0] + 1;
                    }
                    s[0] = s[0] % 5;
                    if (s[0] == 4) {
                        graphics.drawRegion(this.f[0], (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4, 0, 9, 154, 20);
                    } else {
                        graphics.drawRegion(this.f[0], (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4, 0, 9, (16 * (3 + s[0] * 3) - 2) * 3 / 4, 20);
                    }
                    if ((s[12] & 0x800000) != 0) {
                        b = 9;
                        b.s[0] = 0;
                    }
                    if (s[10] >= 0) {
                        if ((s[12] & 0x24) != 0) {
                            if (s[0] == 0) {
                                s[1] = (s[12] & 4) != 0 ? s[1] + 3 : s[1] + 1;
                                s[1] = s[1] % 4;
                            } else if (s[0] == 1) {
                                s[2] = s[2] ^ 1;
                            } else if (s[0] == 2) {
                                s[3] = s[3] ^ 1;
                            }
                        }
                        if ((s[12] & 0x100) == 0) break;
                        if (s[0] == 3) {
                            b.s[23] = s[1];
                            b.s[21] = s[2];
                            b.s[22] = s[3];
                            b.s[10] = -10;
                            b.e(0);
                            break;
                        }
                        if (s[0] != 4) break;
                        b = 9;
                        b.s[0] = 0;
                        break;
                    }
                    this.a(graphics, 202, 5, 120, 192);
                    s[10] = s[10] + 1;
                    break;
                }
                case 12: {
                    this.a(graphics, 82, 13, 29, 16);
                    this.a(graphics, 377, 7, 28, 48);
                    if (s[1] == 0) {
                        this.a(graphics, 369, 8, 112, 64);
                    } else {
                        this.a(graphics, 384 + (s[1] - 1) * 8, 8, 112, 64);
                    }
                    this.a(graphics, 392, 6, 28, 96);
                    if (s[2] == 0) {
                        this.a(graphics, 369, 8, 112, 112);
                    } else {
                        this.a(graphics, 398 + (s[2] - 1) * 8, 8, 112, 112);
                    }
                    this.a(graphics, 422, 6, 28, 144);
                    if (s[3] == 0) {
                        this.a(graphics, 369, 8, 112, 160);
                    } else {
                        this.a(graphics, 428 + (s[3] - 1) * 8, 8, 112, 160);
                    }
                    this.a(graphics, 198, 4, 28, 192);
                    this.a(graphics, 294, 7, 28, 208);
                    if ((s[12] & 2) != 0) {
                        s[0] = s[0] + 4;
                    } else if ((s[12] & 0x40) != 0) {
                        s[0] = s[0] + 1;
                    }
                    s[0] = s[0] % 5;
                    if (s[0] == 4) {
                        graphics.drawRegion(this.f[0], (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4, 0, 9, 154, 20);
                    } else {
                        graphics.drawRegion(this.f[0], (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4, 0, 9, (16 * (3 + s[0] * 3) - 2) * 3 / 4, 20);
                    }
                    if (s[10] >= 0) {
                        if ((s[12] & 0x24) != 0) {
                            if (s[0] == 0) {
                                s[1] = (s[12] & 4) != 0 ? s[1] + (s[66] - 1) : s[1] + 1;
                                s[1] = s[1] % s[66];
                            } else if (s[0] == 1) {
                                s[2] = (s[12] & 4) != 0 ? s[2] + (s[67] - 1) : s[2] + 1;
                                s[2] = s[2] % s[67];
                            } else if (s[0] == 2) {
                                s[3] = (s[12] & 4) != 0 ? s[3] + (s[68] - 1) : s[3] + 1;
                                s[3] = s[3] % s[68];
                            }
                        }
                        if ((s[12] & 0x800000) != 0) {
                            b = 9;
                            b.s[0] = 0;
                        }
                        if ((s[12] & 0x100) == 0) break;
                        if (s[0] == 3) {
                            b.s[69] = s[1];
                            b.s[70] = s[2];
                            b.s[71] = s[3];
                            b.s[10] = -10;
                            b.e(52);
                            break;
                        }
                        if (s[0] != 4) break;
                        b = 9;
                        b.s[0] = 0;
                        break;
                    }
                    this.a(graphics, 202, 5, 120, 200);
                    s[10] = s[10] + 1;
                    break;
                }
                case 11: {
                    this.a(graphics, 95, 10, 50, 16);
                    this.a(graphics, 115, 3, 14, 48);
                    this.a(graphics, 118, 3, 14, 96);
                    this.a(graphics, 121, 3, 14, 144);
                    this.a(graphics, 294, 7, 42, 192);
                    graphics.drawRegion(this.f[0], (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4, 0, 19, 142, 20);
                    this.a(graphics, s[97], 9, 84, 64, 4);
                    this.a(graphics, s[100] / 5 + 1, 1, 28, 64, 4);
                    this.a(graphics, 124, 1, 42, 64);
                    this.a(graphics, s[100] % 5 + 1, 1, 56, 64, 4);
                    this.a(graphics, s[98], 9, 84, 112, 4);
                    this.a(graphics, s[101] / 5 + 1, 1, 28, 112, 4);
                    this.a(graphics, 124, 1, 42, 112);
                    this.a(graphics, s[101] % 5 + 1, 1, 56, 112, 4);
                    this.a(graphics, s[99], 9, 84, 160, 4);
                    this.a(graphics, s[102] / 5 + 1, 1, 28, 160, 4);
                    this.a(graphics, 124, 1, 42, 160);
                    this.a(graphics, s[102] % 5 + 1, 1, 56, 160, 4);
                    if ((s[12] & 0x800100) == 0) break;
                    b = 9;
                    b.s[0] = 0;
                    break;
                }
                case 13: {
                    int n;
                    this.a(graphics, 25, 12, 36, 48);
                    for (n = 0; n <= s[35]; ++n) {
                        this.a(graphics, 259 + n * 7, 7, 71, 96 + n * 16);
                    }
                    this.a(graphics, 294, 7, 71, 96 + n * 16);
                    if ((s[12] & 2) != 0) {
                        s[0] = s[0] + (s[35] + 1);
                    } else if ((s[12] & 0x40) != 0) {
                        s[0] = s[0] + 1;
                    }
                    s[0] = s[0] % (s[35] + 2);
                    graphics.drawRegion(this.f[0], (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4, 0, 41, (48 + 16 * (3 + s[0]) - 2) * 3 / 4, 20);
                    if ((s[12] & 0x800000) != 0) {
                        b = 4;
                    }
                    if ((s[12] & 0x100) == 0) break;
                    if (s[0] == s[35] + 1) {
                        b = 4;
                        break;
                    }
                    b.s[31] = s[0];
                    b = 15;
                    b.b(11);
                    break;
                }
                case 14: {
                    if (s[0] == 0) {
                        if (s[23] <= 1) {
                            graphics.setColor(0xFFFFFF);
                            graphics.drawString("CHANGE DIFFICULTY", 90, 60, 17);
                            graphics.drawString("TO HARD OR NORMAL", 90, 80, 17);
                            graphics.drawString("TO CONTINUE", 90, 99, 17);
                            if ((s[12] & 0x800000) != 0) {
                                b = 4;
                            }
                            if ((s[12] & 0x100) != 0) {
                                b = 4;
                            }
                        } else {
                            s[0] = s[0] + 1;
                            b.s[1] = 0;
                        }
                    } else if (s[0] == 1) {
                        int n;
                        for (n = 0; n <= s[35]; ++n) {
                            graphics.setColor(0x505050);
                            if (s[9771 + n] <= s[9776 + n]) {
                                graphics.setColor(32896);
                            }
                            graphics.fillRect(90, (32 + n * 16 * 9 / 4 - 2) * 3 / 4, 84, 13);
                        }
                        for (n = 0; n <= s[35]; ++n) {
                            this.a(graphics, 259 + n * 7, 7, 16, 32 + n * 16 * 9 / 4);
                            this.a(graphics, s[9771 + n], 7, 128, 32 + n * 16 * 9 / 4, 4);
                            this.a(graphics, s[9776 + n], 7, 128, 48 + n * 16 * 9 / 4, 4);
                        }
                        this.a(graphics, 301, 7, 16, 32 + n * 16 * 9 / 4);
                        if ((s[12] & 2) != 0) {
                            s[1] = s[1] + (s[35] + 1);
                        } else if ((s[12] & 0x40) != 0) {
                            s[1] = s[1] + 1;
                        }
                        s[1] = s[1] % (s[35] + 2);
                        graphics.drawRegion(this.f[0], (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4, 0, 0, (32 + s[1] * 16 * 9 / 4 - 2) * 3 / 4, 20);
                        if ((s[12] & 0x800000) != 0) {
                            b = 4;
                        }
                        if ((s[12] & 0x100) != 0) {
                            if (s[1] == s[35] + 1) {
                                b = 4;
                            } else {
                                this.a(6, 6);
                                b.s[31] = s[1];
                                b = 15;
                                b.a[9] = true;
                                b.b(11);
                            }
                        }
                    } else if (s[0] == 2) {
                        if (s[2] == 1) {
                            this.a(graphics, 343, 9, 57, 48);
                        } else {
                            this.a(graphics, 352, 9, 57, 48);
                        }
                        this.a(graphics, 207, 5, 22, 96);
                        this.a(graphics, s[16], 7, 120, 96, 4);
                        if (s[3] > 0) {
                            this.a(graphics, 361, 8, 120, 120);
                            if (s[3] == 1) {
                                this.a(graphics, 377, 7, 8, 120);
                            } else if (s[3] == 2) {
                                this.a(graphics, 392, 6, 8, 120);
                            } else if (s[3] == 3) {
                                this.a(graphics, 422, 6, 8, 120);
                            }
                        }
                        this.a(graphics, 301, 7, 88, 176);
                        graphics.drawRegion(this.f[0], (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4, 0, 54, 130, 20);
                        if ((s[12] & 0x100) != 0) {
                            this.a();
                            b = 14;
                            b.s[0] = 0;
                            b.s[1] = 0;
                        }
                    }
                    this.a(graphics, 37, 10, 50, 0);
                    if ((s[12] & 0x800000) == 0) break;
                    b = 4;
                    break;
                }
                case 15: {
                    int n;
                    b.u[2] = u[0];
                    b.s[3] = 0;
                    b.s[2] = 0;
                    b.s[1] = 0;
                    b.s[0] = 0;
                    b.s[32] = 0;
                    b.s[24] = 0;
                    b.s[25] = 0;
                    b.s[16] = 0;
                    b.s[18] = 70000;
                    b.s[17] = 2;
                    b.s[19] = 3;
                    if (s[23] <= 1) {
                        b.s[19] = 9;
                    }
                    b.s[79] = 0;
                    b.s[80] = 0;
                    b.s[27] = 0;
                    if (a[9]) {
                        b.s[19] = 0;
                    }
                    b.s[1126] = 32;
                    b.s[1143] = 104;
                    b.s[63] = 0;
                    b.s[64] = 48;
                    b.s[59] = 5;
                    b.s[60] = 0;
                    b.s[61] = 0;
                    b.s[65] = 2;
                    b.s[84] = 0;
                    b.s[62] = 0;
                    for (n = 1; n < 17; ++n) {
                        b.s[1126 + n] = s[1126];
                        b.s[1143 + n] = s[1143];
                    }
                    for (n = 1; n < 5; ++n) {
                        b.s[1160 + n] = s[1126 + n * 4];
                        b.s[1165 + n] = s[1143 + n * 4];
                    }
                    b.s[82] = 0;
                    b.s[81] = 0;
                    b.s[83] = 0;
                    b.s[1119] = 1;
                    b.s[76] = 0;
                    b.s[72] = s[23];
                    b.s[73] = s[69];
                    b.s[74] = s[70];
                    b.s[75] = s[71];
                    if (!a[9]) {
                        b.e(20);
                    }
                    b.s[1120] = 0;
                    b.s[1121] = 0;
                    b.s[1122] = 0;
                    b.s[1123] = 0;
                    b.s[1124] = 0;
                    b.s[1125] = 0;
                    this.a(6, 6);
                    b = 18;
                    break;
                }
                case 16: {
                    try {
                        x = RecordStore.openRecordStore((String)"R", (boolean)true);
                        x.getRecord(1, H, 0);
                        x.closeRecordStore();
                    }
                    catch (Throwable throwable) {}
                    b.s[0] = 0;
                    b.s[1] = H[20];
                    b.s[2] = H[21];
                    b.s[3] = H[23];
                    ++b;
                    break;
                }
                case 17: {
                    this.a(graphics, 17, 8, 64, 32);
                    this.a(graphics, 254, 5, 56, 96);
                    this.a(graphics, s[2] + 1, 1, 140, 96, 4);
                    this.a(graphics, 124, 1, 154, 96);
                    this.a(graphics, s[1] + 1, 1, 168, 96, 4);
                    this.a(graphics, 7, 10, 50, 176);
                    this.a(graphics, 294, 7, 50, 192);
                    this.a(graphics, s[3], 124);
                    graphics.drawRegion(this.f[0], (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4, 0, 25, (32 + 16 * (9 + s[0]) - 2) * 3 / 4, 20);
                    if ((s[12] & 2) != 0) {
                        s[0] = s[0] + 1;
                    } else if ((s[12] & 0x40) != 0) {
                        s[0] = s[0] + 1;
                    }
                    s[0] = s[0] % 2;
                    if ((s[12] & 0x100) == 0) break;
                    if (s[0] == 0) {
                        int n;
                        b.s[32] = 0;
                        b.s[24] = 0;
                        b.s[25] = 0;
                        b.s[16] = 0;
                        b.s[18] = 70000;
                        b.s[17] = 2;
                        b.s[19] = 3;
                        if (s[23] <= 1) {
                            b.s[19] = 9;
                        }
                        b.s[79] = 0;
                        b.s[80] = 0;
                        b.s[27] = 0;
                        if (a[9]) {
                            b.s[19] = 0;
                        }
                        b.s[1126] = 32;
                        b.s[1143] = 104;
                        b.s[63] = 0;
                        b.s[64] = 48;
                        b.s[59] = 5;
                        b.s[60] = 0;
                        b.s[61] = 0;
                        b.s[65] = 2;
                        b.s[84] = 0;
                        b.s[62] = 0;
                        for (n = 1; n < 17; ++n) {
                            b.s[1126 + n] = s[1126];
                            b.s[1143 + n] = s[1143];
                        }
                        for (n = 1; n < 5; ++n) {
                            b.s[1160 + n] = s[1126 + n * 4];
                            b.s[1165 + n] = s[1143 + n * 4];
                        }
                        b.s[82] = 0;
                        b.s[81] = 0;
                        b.s[83] = 0;
                        b.s[1119] = 1;
                        b.s[76] = 0;
                        b.f(20);
                        b.s[23] = s[72];
                        b.s[69] = s[73];
                        b.s[70] = s[74];
                        b.s[71] = s[75];
                        b.a[5] = true;
                        b = 18;
                        break;
                    }
                    b = 4;
                    break;
                }
                case 18: {
                    if (a[5]) {
                        this.a(graphics, 0, 7, 71, 113);
                    } else {
                        this.a(graphics, 7, 10, 50, 113);
                        this.a(graphics, s[23], 141);
                    }
                    ++b;
                    break;
                }
                case 19: {
                    int n;
                    int n5;
                    this.d();
                    b.s[55] = 0;
                    b.s[56] = -1;
                    b.s[57] = -1;
                    for (n5 = 0; n5 < 511; ++n5) {
                        b.s[2558 + n5] = n5 + 1;
                    }
                    b.s[2558 + n5] = -1;
                    for (n5 = 0; n5 < 18; ++n5) {
                        b.s[2028 + n5] = -1;
                    }
                    for (n5 = 0; n5 < 20; ++n5) {
                        b.s[1245 + n5] = -1;
                    }
                    b.f();
                    for (n5 = 0; n5 < 752; ++n5) {
                        b.s[1265 + n5] = 0;
                    }
                    this.a(2, "st" + (s[31] + 1));
                    if (s[31] == 0 || s[31] == 2 || s[31] == 4) {
                        this.a(3, "midium");
                    }
                    if (3 <= s[31]) {
                        this.a(4, "base");
                    }
                    b.s[86] = 0;
                    if (s[31] >= 3) {
                        b.a[7] = false;
                        b.a[8] = false;
                        if (s[31] == 4) {
                            for (n5 = 0; n5 < 16; ++n5) {
                                b.s[1265 + (0 + n5)] = 1;
                                b.s[1265 + (208 + n5)] = 1;
                            }
                            b.s[87] = 0;
                            b.s[88] = 4;
                            b.s[93] = 0;
                            b.s[92] = 0;
                            b.s[91] = 0;
                            b.s[90] = 0;
                            b.s[9746] = 0;
                            b.s[9745] = 0;
                            b.s[9744] = 0;
                            b.s[9743] = 0;
                            b.s[9742] = 0;
                            b.s[9741] = 0;
                            b.s[9740] = 0;
                            b.s[9739] = 0;
                        }
                    }
                    this.a("" + s[31]);
                    int n6 = y[0] << 8 | y[1] & 0xFF;
                    b.s[37] = (y[n6++] & 0xFF) << 8;
                    s[37] = s[37] | y[n6++] & 0xFF;
                    b.s[38] = (y[n6++] & 0xFF) << 8;
                    s[38] = s[38] | y[n6++] & 0xFF;
                    b.s[39] = y[n6++] & 0xFF;
                    b.s[40] = y[n6++] & 0xFF;
                    b.s[41] = y[n6++] & 0xFF;
                    b.s[43] = y[n6++] & 0xFF;
                    b.s[36] = s[37];
                    b.s[45] = 1;
                    b.s[44] = 0;
                    b.s[52] = 0;
                    b.s[53] = 0;
                    b.s[54] = 0;
                    b.s[50] = 0;
                    b.s[42] = 1;
                    if (s[41] == 2) {
                        b.s[54] = (s[37] - 224) / 2;
                        s[1143] = s[1143] + s[54];
                        for (n5 = 1; n5 < 17; ++n5) {
                            int n7 = 1143 + n5;
                            s[n7] = s[n7] + s[54];
                            int n8 = 1175 + n5;
                            s[n8] = s[n8] + (s[54] << 4);
                        }
                    }
                    n5 = 0;
                    while (y[n6] != -1) {
                        b.t[3656 + n5++] = (short)((y[n6] << 8) + (y[n6 + 1] & 0xFF));
                        n6 += 2;
                    }
                    ++n6;
                    b.s[51] = n5;
                    while ((n = y[n6] << 8 | y[n6 + 1] & 0xFF) != 32512) {
                        b.t[3656 + n5++] = (short)n;
                        n6 += 2;
                    }
                    if (s[31] == 1) {
                        try {
                            this.f[4] = Image.createImage((String)"/img_st2c");
                        }
                        catch (Throwable throwable) {}
                        int n9 = 0;
                        n9 = y[6] << 8 | y[7] & 0xFF;
                        b.s[48] = n9 + (y[n9 + 1] & 0xFF) * 64 + 6;
                    }
                    b.s[24] = 0;
                    if (2 <= s[23]) {
                        b.s[24] = (s[23] - 2) * 8 + s[31] + s[32] * 8;
                    }
                    b.e();
                    b.s[34] = 0;
                    b = 191;
                    b.a[5] = true;
                    break;
                }
                case 191: {
                    this.a(graphics, 7, 10, 50, 113);
                    this.a(graphics, s[23], 141);
                    if (3000L >= System.currentTimeMillis() - u[2]) break;
                    b = 20;
                    b.a(15 + s[31] * 3);
                    this.a(4, 5);
                    break;
                }
                case 204: {
                    b.s[0] = 0;
                    this.a(6, 3);
                    b = 203;
                    b.s[12] = 0;
                }
                case 203: {
                    this.h(graphics);
                    break;
                }
                case 205: {
                    b.s[0] = 0;
                    this.a(6, 3);
                    b = 20;
                    b.s[12] = 0;
                }
                case 20: {
                    int n;
                    int n10;
                    int n11;
                    int n12;
                    int n13;
                    if (a[4]) {
                        this.i(graphics);
                        if (s[27] == 0 && s[12] != 0) {
                            if ((s[12] & s[2017 + s[26]]) != 0) {
                                s[26] = s[26] + 1;
                                if (s[26] == 11) {
                                    b.s[59] = 7;
                                    b.s[61] = 20;
                                    if (s[69] == 1) {
                                        b.s[61] = 21;
                                    }
                                    b.s[60] = 8;
                                    b.s[65] = 4;
                                    b.s[62] = 6;
                                    b.s[1120] = 1;
                                    b.s[1121] = 1;
                                    b.s[1122] = 1;
                                    b.s[1123] = 1;
                                    b.s[1124] = 1;
                                    b.s[1125] = 1;
                                    b.f();
                                    b.e();
                                    b.b(7);
                                    if (s[23] >= 2) {
                                        s[27] = s[27] + 1;
                                    }
                                    b.s[26] = 0;
                                }
                            } else {
                                b.s[26] = 0;
                            }
                        }
                    } else if ((s[12] & 0x2200000) != 0 || !this.isShown()) {
                        b.a[4] = true;
                        b = 205;
                    }
                    if (a[4]) break;
                    if (s[50] <= 0) {
                        s[50] = s[50] + 8;
                        do {
                            n13 = t[3656 + s[51]];
                            n12 = n13 >> 8 & 0x7F;
                            switch (n12) {
                                case 0: {
                                    s[50] = s[50] + (n13 - 1) * 8;
                                    break;
                                }
                                case 2: {
                                    b.s[43] = 0;
                                    b.s[42] = 0;
                                    break;
                                }
                                case 3: {
                                    b.a(n12, 240, 0, n13 & 0xFF);
                                    break;
                                }
                                case 4: {
                                    b.s[41] = n13 & 0xFF;
                                    if (s[41] == 1) {
                                        b.s[1143] = s[1143] - s[54];
                                        for (n12 = 1; n12 < 17; ++n12) {
                                            b.s[1143 + n12] = s[1143 + n12] - s[54];
                                        }
                                        n11 = s[56];
                                        while (n11 != -1) {
                                            int n14 = s[2558 + n11];
                                            b.s[4094 + n11] = s[4094 + n11] - s[54];
                                            b.s[6142 + n11] = s[6142 + n11] - (s[54] << 4);
                                            n11 = n14;
                                        }
                                        b.s[44] = 0;
                                        b.s[54] = 0;
                                        b.s[36] = 224;
                                        for (n12 = 0; n12 < 752; ++n12) {
                                            b.s[1265 + n12] = 0;
                                        }
                                    }
                                    if (s[41] == 3) {
                                        b.s[53] = 0;
                                    }
                                    if (s[41] != 5) break;
                                    b.s[53] = 0;
                                    for (n12 = 0; n12 < 16; ++n12) {
                                        b.s[1265 + (240 + n12)] = 1;
                                    }
                                    break;
                                }
                                case 43: 
                                case 44: 
                                case 45: 
                                case 46: {
                                    if (n12 >= 45) {
                                        b.a(n12 - 2, 240, (n13 & 0x3F) * 16, (n13 & 0xC0) << 18 | (t[3656 + (s[51] + 1)] & 0xF000) << 4 | t[3656 + (s[51] + 1)] & 0xF00 | (t[3656 + (s[51] + 1)] & 0xF0) >> 4);
                                    } else {
                                        b.a(n12, 240, (n13 & 0x3F) * 4, (n13 & 0xC0) << 18 | (t[3656 + (s[51] + 1)] & 0xF000) << 4 | t[3656 + (s[51] + 1)] & 0xF00 | (t[3656 + (s[51] + 1)] & 0xF0) >> 4);
                                    }
                                    s[50] = s[50] + 8 * (t[3656 + (s[51] + 1)] & 0xF);
                                    s[51] = s[51] + 1;
                                    break;
                                }
                                case 76: 
                                case 88: 
                                case 90: {
                                    b.a(n12, 240, (n13 & 0xFF) * 4, (t[3656 + (s[51] + 1)] & 0xF000) << 4 | t[3656 + (s[51] + 1)] & 0xF00 | (t[3656 + (s[51] + 1)] & 0xF0) >> 4);
                                    s[50] = s[50] + 8 * (t[3656 + (s[51] + 1)] & 0xF);
                                    s[51] = s[51] + 1;
                                    break;
                                }
                                case 9: {
                                    b.a((t[3656 + (s[51] + 1)] & 0xFF00) >> 8, 240, (n13 & 0xFF) * 4, (t[3656 + (s[51] + 1)] & 0x3F) << 16 | (t[3656 + (s[51] + 1)] & 0x40) << 2 | (t[3656 + (s[51] + 1)] & 0x80) >> 7);
                                    s[51] = s[51] + 1;
                                    break;
                                }
                                case 6: {
                                    b.s[43] = n13 & 0xFF;
                                    break;
                                }
                                case 7: {
                                    if (s[22] != 0) break;
                                    if ((n13 & 0x80) != 0) {
                                        b.a[8] = true;
                                        b.a(n12, 240, 0, 0);
                                        break;
                                    }
                                    b.a[8] = false;
                                    break;
                                }
                                case 8: {
                                    if (s[22] != 0) break;
                                    if ((n13 & 0x80) != 0) {
                                        b.a[7] = true;
                                        b.a(n12, 240, 0, 0);
                                        break;
                                    }
                                    b.a[7] = false;
                                    break;
                                }
                                case 111: {
                                    b.b(n12, 240, (n13 & 0x3F) * 4, (n13 & 0x40) << 2 | (n13 & 0x80) >> 7);
                                    break;
                                }
                                case 126: {
                                    s[51] = s[51] - 1;
                                    break;
                                }
                                default: {
                                    b.a(n12, 240, (n13 & 0x3F) * 4, (n13 & 0x40) << 2 | (n13 & 0x80) >> 7);
                                }
                            }
                            s[51] = s[51] + 1;
                        } while ((n13 & 0x8000) != 0);
                    }
                    this.h();
                    block140: for (n12 = 0; n12 < 20; ++n12) {
                        switch (s[1245 + n12]) {
                            case 0: 
                            case 1: 
                            case 3: 
                            case 5: 
                            case 16: {
                                int n15 = 117;
                                if (s[1245 + n12] == 16) {
                                    n15 = 273;
                                }
                                int n16 = 1185 + n12;
                                s[n16] = s[n16] + 32;
                                if ((b.c(s[1185 + n12], s[1205 + n12] - s[54]) | b.c(s[1185 + n12] - 8, s[1205 + n12] - s[54]) | 240 - s[1185 + n12]) < 0) {
                                    b.s[1245 + n12] = -1;
                                }
                                b.a(1, s[1185 + n12], s[1205 + n12], 15, n15, 0);
                                continue block140;
                            }
                            case 17: {
                                int n17 = 1185 + n12;
                                s[n17] = s[n17] + (s[455 + s[1225 + n12]] * 24 >> 4);
                                int n18 = 1205 + n12;
                                s[n18] = s[n18] + (s[471 + s[1225 + n12]] * 24 >> 4);
                                if ((b.c(s[1185 + n12], s[1205 + n12] - s[54]) | b.c(s[1185 + n12] - (s[455 + s[1225 + n12]] * 12 >> 4), s[1205 + n12] - (s[471 + s[1225 + n12]] * 12 >> 4) - s[54]) | s[1185 + n12] | 240 - s[1185 + n12] | s[1205 + n12] - s[54] | 240 - s[1205 + n12] + s[54]) < 0) {
                                    b.s[1245 + n12] = -1;
                                }
                                if (s[1245 + n12] < 0) continue block140;
                                b.a(1, s[1185 + n12], s[1205 + n12], 15, 91, 0);
                                continue block140;
                            }
                            case 18: {
                                int n19 = 1185 + n12;
                                s[n19] = s[n19] + (s[455 + s[9726 + n12 / 4]] * 24 >> 4);
                                int n20 = 1205 + n12;
                                s[n20] = s[n20] + (s[471 + s[9726 + n12 / 4]] * 24 >> 4);
                                if ((b.c(s[1185 + n12], s[1205 + n12] - s[54]) | 240 - s[1185 + n12] | s[1205 + n12] - s[54] | 240 - s[1205 + n12] + s[54]) < 0) {
                                    b.s[1245 + n12] = -1;
                                }
                                if (s[1245 + n12] < 0) continue block140;
                                b.a(1, s[1185 + n12], s[1205 + n12], 15, 91, 0);
                                continue block140;
                            }
                            case 11: 
                            case 12: 
                            case 13: 
                            case 14: 
                            case 15: {
                                if (240 - s[1185 + n12] < 0) {
                                    b.s[1245 + n12] = -1;
                                }
                                if (b.c(s[1185 + n12] + (s[1245 + n12] - 11) * 16, s[1205 + n12] - s[54]) < 0) {
                                    if (s[1245 + n12] == 11) {
                                        b.s[1245 + n12] = -1;
                                    } else {
                                        int n21 = 1245 + n12;
                                        s[n21] = s[n21] - 1;
                                    }
                                }
                                int n22 = 1225 + n12;
                                s[n22] = s[n22] + 1;
                                n11 = 0;
                                if (s[1225 + n12] < 4) {
                                    int n23 = 1245 + n12;
                                    s[n23] = s[n23] + 1;
                                } else {
                                    int n24 = 1185 + n12;
                                    s[n24] = s[n24] + 16;
                                    n11 = s[1225 + n12] - 4 + 1;
                                }
                                if (s[1245 + n12] < 0) continue block140;
                                for (n13 = 0; n13 <= s[1245 + n12] - 12; ++n13) {
                                    b.a(1, s[1185 + n12] + n13 * 16, s[1205 + n12], 15, 250 + (n13 + n11) % 4, 0);
                                }
                                continue block140;
                            }
                            case 19: {
                                b.s[1185 + n12] = s[1160 + n12 / 4] + 8;
                                b.s[1205 + n12] = s[1165 + n12 / 4];
                                if (s[1180 + n12 / 4] != 1) {
                                    b.s[1245 + n12] = -1;
                                }
                                if (s[1225 + n12] < 5) {
                                    int n25 = 1225 + n12;
                                    s[n25] = s[n25] + 1;
                                }
                                for (n11 = 1; n11 < s[1225 + n12]; ++n11) {
                                    b.a(1, s[1185 + n12], s[1205 + n12] - 16 * n11, 15, 93, 0);
                                    b.a(1, s[1185 + n12], s[1205 + n12] + 16 * n11, 15, 93, 0);
                                }
                                b.a(1, s[1185 + n12], s[1205 + n12] - 16 * n11, 15, 92, 0);
                                b.a(1, s[1185 + n12], s[1205 + n12], 15, 93, 0);
                                b.a(1, s[1185 + n12], s[1205 + n12] + 16 * n11, 15, 94, 0);
                                continue block140;
                            }
                            case 2: {
                                int n26 = 1185 + n12;
                                s[n26] = s[n26] + 20;
                                int n27 = 1205 + n12;
                                s[n27] = s[n27] - 20;
                                if ((b.c(s[1185 + n12], s[1205 + n12] - s[54]) | b.c(s[1185 + n12] - 10, s[1205 + n12] + 10 - s[54]) | 240 - s[1185 + n12] | 16 + s[1205 + n12] - s[54]) < 0) {
                                    b.s[1245 + n12] = -1;
                                }
                                if (s[1245 + n12] < 0) continue block140;
                                b.a(1, s[1185 + n12], s[1205 + n12], 15, 118, 0);
                                continue block140;
                            }
                            case 8: {
                                b.s[1205 + n12] = s[1160 + n12 / 4] + 16;
                                int n28 = 1185 + n12;
                                s[n28] = s[n28] + 48;
                                for (n13 = s[1205 + n12]; n13 < s[1185 + n12]; n13 += 16) {
                                    if (b.c(n13, s[1165 + n12 / 4] - s[54]) >= 0) continue;
                                    b.s[1185 + n12] = n13;
                                    b.a(13, s[1185 + n12] - 8, s[1165 + n12 / 4], 0);
                                    int n29 = 1245 + n12;
                                    s[n29] = s[n29] + 1;
                                    break;
                                }
                                if (s[1245 + n12] == 8 && 240 - s[1185 + n12] < 0) {
                                    b.s[1185 + n12] = 240;
                                    int n30 = 1245 + n12;
                                    s[n30] = s[n30] + 1;
                                }
                                b.a(0, n12, s[1165 + n12 / 4], 1, 0, 0);
                                continue block140;
                            }
                            case 9: {
                                int n31 = 1205 + n12;
                                s[n31] = s[n31] + 48;
                                if (s[1185 + n12] + 16 < s[1205 + n12]) {
                                    b.s[1245 + n12] = -1;
                                    continue block140;
                                }
                                if (s[1185 + n12] + 16 <= s[1205 + n12]) {
                                    b.s[1205 + n12] = s[1185 + n12] + 16;
                                }
                                b.a(0, n12, s[1165 + n12 / 4], 1, 0, 0);
                                continue block140;
                            }
                            case 10: {
                                b.s[1185 + n12] = s[77];
                                b.s[77] = 240;
                                switch (s[1225 + n12]) {
                                    default: {
                                        int n32 = 1225 + n12;
                                        s[n32] = s[n32] + 1;
                                        break;
                                    }
                                    case 0: {
                                        b.s[1205 + n12] = 0;
                                        b.s[1185 + n12] = 0;
                                        int n33 = 1225 + n12;
                                        s[n33] = s[n33] + 1;
                                        break;
                                    }
                                    case 1: {
                                        int n34 = 1205 + n12;
                                        s[n34] = s[n34] + 1;
                                        if (s[1205 + n12] == 2) {
                                            b.b(8);
                                            b.s[1185 + n12] = 240;
                                        }
                                        if (s[1205 + n12] < 5) break;
                                        int n35 = 1225 + n12;
                                        s[n35] = s[n35] + 1;
                                        break;
                                    }
                                    case 21: {
                                        int n36 = 1205 + n12;
                                        s[n36] = s[n36] - 1;
                                        if (s[n36] >= 0) break;
                                        int n37 = 1225 + n12;
                                        s[n37] = s[n37] + 1;
                                        break;
                                    }
                                    case 22: 
                                    case 23: 
                                    case 24: 
                                    case 25: 
                                    case 26: 
                                    case 27: {
                                        int n38 = 1225 + n12;
                                        s[n38] = s[n38] + 1;
                                        if (s[n38] < 28) break;
                                        b.s[1245 + n12] = -1;
                                    }
                                }
                                if (s[1205 + n12] >= 3) {
                                    for (n13 = s[1126] + 40; n13 < s[1185 + n12]; n13 += 16) {
                                        if ((b.c(n13, s[1143] - 16 - s[54]) | b.c(n13, s[1143] + 0 - s[54]) | b.c(n13, s[1143] + 16 - s[54])) >= 0) continue;
                                        b.s[1185 + n12] = n13;
                                        b.a(11, s[1185 + n12] - 8, s[1143], 0);
                                    }
                                }
                                b.a(4, s[1185 + n12], s[1205 + n12], 4, 0, 0);
                                continue block140;
                            }
                            case 20: {
                                int n39 = 1185 + n12;
                                s[n39] = s[n39] + 2;
                                int n40 = 1205 + n12;
                                s[n40] = s[n40] + 8;
                                int n15 = 96;
                                if (b.c(s[1185 + n12], s[1205 + n12] - s[54]) < 0) {
                                    int n41 = 1185 + n12;
                                    s[n41] = s[n41] + 8;
                                    int n42 = 1205 + n12;
                                    s[n42] = s[n42] - 8;
                                    n15 = 99;
                                    if (b.c(s[1185 + n12], s[1205 + n12] - s[54]) < 0) {
                                        b.s[1245 + n12] = -1;
                                    }
                                }
                                if ((240 - s[1185 + n12] | 240 - s[1205 + n12] + s[54]) < 0) {
                                    b.s[1245 + n12] = -1;
                                }
                                if (s[1245 + n12] < 0) continue block140;
                                b.a(1, s[1185 + n12], s[1205 + n12], 15, n15, 0);
                                continue block140;
                            }
                            case 4: {
                                int n43 = 1185 + n12;
                                s[n43] = s[n43] - 32;
                                if ((b.c(s[1185 + n12], s[1205 + n12] - s[54]) | b.c(s[1185 + n12] + 16, s[1205 + n12] - s[54]) | 16 + s[1185 + n12]) < 0) {
                                    b.s[1245 + n12] = -1;
                                }
                                if (s[1245 + n12] < 0) continue block140;
                                b.a(1, s[1185 + n12], s[1205 + n12], 15, 119, 0);
                                continue block140;
                            }
                            case 6: {
                                int n44 = 1205 + n12;
                                s[n44] = s[n44] - 32;
                                if ((b.c(s[1185 + n12], s[1205 + n12] - s[54]) | b.c(s[1185 + n12], s[1205 + n12] - 16 - s[54]) | 240 - s[1185 + n12] | 16 + s[1205 + n12] - s[54]) < 0) {
                                    b.s[1245 + n12] = -1;
                                }
                                if (s[1245 + n12] < 0) continue block140;
                                b.a(1, s[1185 + n12], s[1205 + n12], 15, 120, 0);
                                continue block140;
                            }
                            case 7: {
                                int n45 = 1225 + n12;
                                s[n45] = s[n45] + 1;
                                if (s[1225 + n12] >= 3) {
                                    b.s[1225 + n12] = 3;
                                }
                                int n15 = 266 + (s[1225 + n12] - 1) * 1;
                                int n46 = 1185 + n12;
                                s[n46] = s[n46] + 32;
                                if (s[1225 + n12] > 0 && (b.c(s[1185 + n12], s[1205 + n12] + 8 - s[54]) | b.c(s[1185 + n12], s[1205 + n12] + 24 - s[54]) | b.c(s[1185 + n12] - 16, s[1205 + n12] + 8 - s[54]) | b.c(s[1185 + n12] - 16, s[1205 + n12] + 24 - s[54]) | 240 - s[1185 + n12]) < 0) {
                                    b.s[1245 + n12] = -1;
                                }
                                if (s[1245 + n12] < 0 || 1 > s[1225 + n12]) continue block140;
                                b.a(0, s[1185 + n12], s[1205 + n12], 15, n15, 66305);
                                continue block140;
                            }
                            case 21: 
                            case 22: {
                                int n47 = 1185 + n12;
                                int n48 = 1225 + n12;
                                int n49 = s[n48] + 1;
                                s[n48] = n49;
                                s[n47] = s[n47] + (6 - n49 / 4);
                                int n15 = s[1225 + n12] / 4 * 1;
                                if (n15 > 3) {
                                    n15 = 3;
                                }
                                if (s[1245 + n12] == 21) {
                                    int n50 = 1205 + n12;
                                    s[n50] = s[n50] + (8 + s[1225 + n12]);
                                    n15 = 98 - n15;
                                    if ((b.c(s[1185 + n12], s[1205 + n12] - s[54]) | 240 - s[1185 + n12] | 240 - s[1205 + n12] + s[54]) < 0) {
                                        b.s[1245 + n12] = -1;
                                    }
                                } else {
                                    int n51 = 1205 + n12;
                                    s[n51] = s[n51] - (8 + s[1225 + n12]);
                                    n15 = 103 - n15;
                                    if ((b.c(s[1185 + n12], s[1205 + n12] - s[54]) | 240 - s[1185 + n12] | 16 + s[1205 + n12] - s[54]) < 0) {
                                        b.s[1245 + n12] = -1;
                                    }
                                }
                                if (s[1245 + n12] < 0) continue block140;
                                b.a(1, s[1185 + n12], s[1205 + n12], 15, n15, 0);
                            }
                        }
                    }
                    b.s[78] = -1;
                    switch (s[41]) {
                        case 1: {
                            if (s[22] == 0) {
                                if (s[31] == 0) {
                                    graphics.drawRegion(this.f[3], (B[283] >> 24 & 0xFF) * 3 / 4, (B[283] >> 16 & 0xFF) * 3 / 4, (B[283] >> 8 & 0xFF) * 3 / 4, (B[283] & 0xFF) * 3 / 4, 0, (128 - s[52] / 8 / 2 - 16) * 3 / 4, 24, 20);
                                } else if (s[31] == 2) {
                                    graphics.drawRegion(this.f[3], (B[292] >> 24 & 0xFF) * 3 / 4, (B[292] >> 16 & 0xFF) * 3 / 4, (B[292] >> 8 & 0xFF) * 3 / 4, (B[292] & 0xFF) * 3 / 4, 0, (128 - s[52] / 24 / 2 - 16) * 3 / 4, 36, 20);
                                }
                            }
                            for (n12 = 0; n12 < 20; ++n12) {
                                n10 = s[1055 + n12] - s[9] * (n12 / 2 + 1) * s[45] & 0xFF;
                                n = s[1055 + (20 + n12)] & 0xFF;
                                graphics.setColor(s[307 + n12]);
                                graphics.drawLine(n10 * 3 / 4, n * 3 / 4, n10 * 3 / 4, n * 3 / 4);
                            }
                            for (n12 = 0; n12 < 20; ++n12) {
                                n10 = s[1055 + n12] - s[9] * (n12 / 2 + 1) * s[45] + 160 & 0xFF;
                                n = s[1055 + (20 + n12)] + 80 & 0xFF;
                                graphics.setColor(s[307 + n12]);
                                graphics.drawLine(n10 * 3 / 4, n * 3 / 4, n10 * 3 / 4, n * 3 / 4);
                            }
                            break;
                        }
                        case 2: 
                        case 3: {
                            for (n12 = 0; n12 < 20; ++n12) {
                                n10 = s[1055 + n12] - s[9] * (n12 / 2 + 1) & 0xFF;
                                n = s[1055 + (20 + n12)] - s[54] & 0xFF;
                                graphics.setColor(s[307 + n12]);
                                graphics.drawLine(n10 * 3 / 4, n * 3 / 4, n10 * 3 / 4, n * 3 / 4);
                            }
                            break;
                        }
                        case 4: {
                            for (n12 = 0; n12 < 20; ++n12) {
                                n = s[1055 + (20 + n12)] & 0xFF;
                                b.s[0] = (s[307 + n12] >> 16 & 0xFF) * (92 - 8 * s[46]) / 100 << 16 | (s[307 + n12] >> 8 & 0xFF) * (92 - 8 * s[46]) / 100 << 8 | (s[307 + n12] & 0xFF) * (92 - 8 * s[46]) / 100;
                                graphics.setColor(s[0]);
                                if (s[46] < 8) {
                                    n10 = s[1055 + n12] - s[9] * (n12 / 2 + 1) * s[45] & 0xFF;
                                    graphics.drawLine((n10 - (s[1055 + n12] & (1 << s[46]) - 1)) * 3 / 4, n * 3 / 4, n10 * 3 / 4, n * 3 / 4);
                                    continue;
                                }
                                n10 = s[1055 + n12] - s[9] * (n12 / 2 * s[45] + (s[46] - 1) * 4 + 1) & 0xFF;
                                graphics.drawLine((n10 - (s[1055 + n12] & (1 << s[46] - 1) - 1)) * 3 / 4, n * 3 / 4, n10 * 3 / 4, n * 3 / 4);
                            }
                            for (n12 = 0; n12 < 20; ++n12) {
                                n = s[1055 + (20 + n12)] + 80 & 0xFF;
                                b.s[0] = (s[307 + n12] >> 16 & 0xFF) * (92 - 8 * s[46]) / 100 << 16 | (s[307 + n12] >> 8 & 0xFF) * (92 - 8 * s[46]) / 100 << 8 | (s[307 + n12] & 0xFF) * (92 - 8 * s[46]) / 100;
                                graphics.setColor(s[0]);
                                if (s[46] < 8) {
                                    n10 = s[1055 + n12] - s[9] * (n12 / 2 + 1) * s[45] + 160 & 0xFF;
                                    graphics.drawLine((n10 - (s[1055 + n12] & (1 << s[46]) - 1)) * 3 / 4, n * 3 / 4, n10 * 3 / 4, n * 3 / 4);
                                    continue;
                                }
                                n10 = s[1055 + n12] - s[9] * (n12 / 2 * s[45] + (s[46] - 1) * 4 + 1) + 160 & 0xFF;
                                graphics.drawLine((n10 - (s[1055 + n12] & (1 << s[46] - 1) - 1)) * 3 / 4, n * 3 / 4, n10 * 3 / 4, n * 3 / 4);
                            }
                            break;
                        }
                        case 5: {
                            b.s[1] = 0;
                            b.s[0] = 0;
                            if (s[53] <= 128) {
                                b.s[0] = 128 - s[53];
                                b.s[1] = 4 * s[43];
                                if (s[53] == 96 || s[53] >= 128) {
                                    for (n12 = 0; n12 < 16; ++n12) {
                                        b.s[1265 + (0 + n12)] = 1;
                                        b.s[1265 + (208 + n12)] = 1;
                                    }
                                }
                            } else if (s[53] < 192) {
                                b.s[1] = 4 * s[43] - s[53] + 128;
                            }
                            for (n12 = 0; n12 < 20; ++n12) {
                                n10 = s[1055 + n12] - s[9] * (n12 / 2 + 1) * s[45] & 0xFF;
                                n = s[1055 + (20 + n12)] & 0xFF;
                                graphics.setColor(s[307 + n12]);
                                graphics.drawLine(n10 * 3 / 4, n * 3 / 4, n10 * 3 / 4, n * 3 / 4);
                            }
                            for (n12 = 0; n12 < 20; ++n12) {
                                n10 = s[1055 + n12] - s[9] * (n12 / 2 + 1) * s[45] + 160 & 0xFF;
                                n = s[1055 + (20 + n12)] + 80 & 0xFF;
                                graphics.setColor(s[307 + n12]);
                                graphics.drawLine(n10 * 3 / 4, n * 3 / 4, n10 * 3 / 4, n * 3 / 4);
                            }
                            for (n12 = 0; n12 < 6; ++n12) {
                                b.a(0, 0 - s[53] % 48 + n12 * 16 * 3, 0 - s[0] / 8, 6, 333, 196867);
                                b.a(0, 0 - s[53] % 48 + n12 * 16 * 3, 208 + s[0] / 8, 6, 334, 196867);
                            }
                            if (s[22] == 0 && 128 <= s[53]) {
                                for (n12 = 0; n12 < 6; ++n12) {
                                    graphics.drawRegion(this.f[4], (B[293] >> 24 & 0xFF) * 3 / 4, (B[293] >> 16 & 0xFF) * 3 / 4, (B[293] >> 8 & 0xFF) * 3 / 4, (B[293] & 0xFF) * 3 / 4, 0, (0 - s[53] % 48 + n12 * 16 * 3) * 3 / 4, (16 - s[1] / 2 * 16) * 3 / 4, 20);
                                    graphics.drawRegion(this.f[4], (B[294] >> 24 & 0xFF) * 3 / 4, (B[294] >> 16 & 0xFF) * 3 / 4, (B[294] >> 8 & 0xFF) * 3 / 4, (B[294] & 0xFF) * 3 / 4, 0, (0 - s[53] % 48 + n12 * 16 * 3) * 3 / 4, (144 + s[1] / 2 * 16) * 3 / 4, 20);
                                }
                            }
                            if (s[53] < 128 + 4 * s[43]) break;
                            b.s[41] = 6;
                            break;
                        }
                        case 6: {
                            for (n12 = 0; n12 < 6; ++n12) {
                                b.a(0, 0 - s[53] % 48 + n12 * 16 * 3, 0, 6, 333, 196867);
                                b.a(0, 0 - s[53] % 48 + n12 * 16 * 3, 208, 6, 334, 196867);
                            }
                            if (s[22] != 0) break;
                            for (n12 = 0; n12 < 6; ++n12) {
                                graphics.drawRegion(this.f[4], (B[293] >> 24 & 0xFF) * 3 / 4, (B[293] >> 16 & 0xFF) * 3 / 4, (B[293] >> 8 & 0xFF) * 3 / 4, (B[293] & 0xFF) * 3 / 4, 0, (0 - s[53] % 48 + n12 * 16 * 3) * 3 / 4, 12, 20);
                                graphics.drawRegion(this.f[4], (B[294] >> 24 & 0xFF) * 3 / 4, (B[294] >> 16 & 0xFF) * 3 / 4, (B[294] >> 8 & 0xFF) * 3 / 4, (B[294] & 0xFF) * 3 / 4, 0, (0 - s[53] % 48 + n12 * 16 * 3) * 3 / 4, 108, 20);
                            }
                            break;
                        }
                        case 7: {
                            if (s[22] == 0) {
                                for (n12 = 0; n12 < 6 * s[88]; ++n12) {
                                    graphics.drawRegion(this.f[4], (B[301 + n12 / 6] >> 24 & 0xFF) * 3 / 4, (B[301 + n12 / 6] >> 16 & 0xFF) * 3 / 4, (B[301 + n12 / 6] >> 8 & 0xFF) * 3 / 4, (B[301 + n12 / 6] & 0xFF) * 3 / 4, 0, n12 % 6 * 16 * 3 * 3 / 4, (16 + n12 / 6 * 16) * 3 / 4, 20);
                                    graphics.drawRegion(this.f[4], (B[309 + (23 - n12) / 6] >> 24 & 0xFF) * 3 / 4, (B[309 + (23 - n12) / 6] >> 16 & 0xFF) * 3 / 4, (B[309 + (23 - n12) / 6] >> 8 & 0xFF) * 3 / 4, (B[309 + (23 - n12) / 6] & 0xFF) * 3 / 4, 0, n12 % 6 * 16 * 3 * 3 / 4, (192 - n12 / 6 * 16) * 3 / 4, 20);
                                }
                            }
                            b.a(0, s[92] + 0, s[91] * s[93] + 0, 6, 333, 196865);
                            b.a(0, s[92] + 48, s[91] * s[93] + 0, 6, 333, 196865);
                            b.a(0, s[92] + 144, s[91] * s[93] + 0, 6, 333, 196865);
                            b.a(0, s[92] + 192, s[91] * s[93] + 0, 6, 333, 196865);
                            b.a(0, s[92] + 0, s[91] * s[93] + 208, 6, 334, 196865);
                            b.a(0, s[92] + 48, s[91] * s[93] + 208, 6, 334, 196865);
                            b.a(0, s[92] + 144, s[91] * s[93] + 208, 6, 334, 196865);
                            b.a(0, s[92] + 192, s[91] * s[93] + 208, 6, 334, 196865);
                            b.a(0, s[92] + 0, s[91] * s[93] + 16, 6, 335, 66305);
                            b.a(1, s[92] + 0, s[91] * s[93] + 64, 6, 337, 0);
                            b.a(1, s[92] + 0, s[91] * s[93] + 144, 6, 338, 0);
                            b.a(0, s[92] + 0, s[91] * s[93] + 160, 6, 335, 66305);
                            b.a(0, s[92] + 224, s[91] * s[93] + 16, 6, 336, 66305);
                            b.a(1, s[92] + 224, s[91] * s[93] + 64, 6, 339, 0);
                            b.a(1, s[92] + 224, s[91] * s[93] + 144, 6, 340, 0);
                            b.a(0, s[92] + 224, s[91] * s[93] + 160, 6, 336, 66305);
                            b.a(1, s[92] + 0, s[91] * s[93] + 0, 7, 341, 0);
                            b.a(1, s[92] + 224, s[91] * s[93] + 0, 7, 342, 0);
                            b.a(1, s[92] + 0, s[91] * s[93] + 208, 7, 343, 0);
                            b.a(1, s[92] + 224, s[91] * s[93] + 208, 7, 344, 0);
                            b.a(0, s[92] + 88 - s[9740], s[91] * s[93] + 0, 7, 345, 131329);
                            b.a(0, s[92] + 120 + s[9740], s[91] * s[93] + 0, 7, 346, 131329);
                            b.a(0, s[92] + 88 - s[9742], s[91] * s[93] + 208, 7, 345, 131329);
                            b.a(0, s[92] + 120 + s[9742], s[91] * s[93] + 208, 7, 346, 131329);
                            b.a(0, s[92] + 0, s[91] * s[93] + 80 - s[9739], 7, 347, 66049);
                            b.a(0, s[92] + 0, s[91] * s[93] + 112 + s[9739], 7, 348, 66049);
                            b.a(0, s[92] + 224, s[91] * s[93] + 80 - s[9741], 7, 347, 66049);
                            b.a(0, s[92] + 224, s[91] * s[93] + 112 + s[9741], 7, 348, 66049);
                            if (6 > s[86]) break;
                            b.a(0, s[92] + 0 + s[90] * 240, s[91] * s[93] + 0 + s[91] * 224, 6, 333, 196865);
                            b.a(0, s[92] + 48 + s[90] * 240, s[91] * s[93] + 0 + s[91] * 224, 6, 333, 196865);
                            b.a(0, s[92] + 144 + s[90] * 240, s[91] * s[93] + 0 + s[91] * 224, 6, 333, 196865);
                            b.a(0, s[92] + 192 + s[90] * 240, s[91] * s[93] + 0 + s[91] * 224, 6, 333, 196865);
                            b.a(0, s[92] + 0 + s[90] * 240, s[91] * s[93] + 208 + s[91] * 224, 6, 334, 196865);
                            b.a(0, s[92] + 48 + s[90] * 240, s[91] * s[93] + 208 + s[91] * 224, 6, 334, 196865);
                            b.a(0, s[92] + 144 + s[90] * 240, s[91] * s[93] + 208 + s[91] * 224, 6, 334, 196865);
                            b.a(0, s[92] + 192 + s[90] * 240, s[91] * s[93] + 208 + s[91] * 224, 6, 334, 196865);
                            b.a(0, s[92] + 0 + s[90] * 240, s[91] * s[93] + 16 + s[91] * 224, 6, 335, 66305);
                            b.a(1, s[92] + 0 + s[90] * 240, s[91] * s[93] + 64 + s[91] * 224, 6, 337, 0);
                            b.a(1, s[92] + 0 + s[90] * 240, s[91] * s[93] + 144 + s[91] * 224, 6, 338, 0);
                            b.a(0, s[92] + 0 + s[90] * 240, s[91] * s[93] + 160 + s[91] * 224, 6, 335, 66305);
                            b.a(0, s[92] + 224 + s[90] * 240, s[91] * s[93] + 16 + s[91] * 224, 6, 336, 66305);
                            b.a(1, s[92] + 224 + s[90] * 240, s[91] * s[93] + 64 + s[91] * 224, 6, 339, 0);
                            b.a(1, s[92] + 224 + s[90] * 240, s[91] * s[93] + 144 + s[91] * 224, 6, 339, 0);
                            b.a(0, s[92] + 224 + s[90] * 240, s[91] * s[93] + 160 + s[91] * 224, 6, 336, 66305);
                            b.a(1, s[92] + 0 + s[90] * 240, s[91] * s[93] + 0 + s[91] * 224, 7, 341, 0);
                            b.a(1, s[92] + 224 + s[90] * 240, s[91] * s[93] + 0 + s[91] * 224, 7, 342, 0);
                            b.a(1, s[92] + 0 + s[90] * 240, s[91] * s[93] + 208 + s[91] * 224, 7, 343, 0);
                            b.a(1, s[92] + 224 + s[90] * 240, s[91] * s[93] + 208 + s[91] * 224, 7, 344, 0);
                            b.a(0, s[92] + 88 - s[9744] + s[90] * 240, s[91] * s[93] + 0 + s[91] * 224, 7, 345, 131329);
                            b.a(0, s[92] + 120 + s[9744] + s[90] * 240, s[91] * s[93] + 0 + s[91] * 224, 7, 346, 131329);
                            b.a(0, s[92] + 88 - s[9746] + s[90] * 240, s[91] * s[93] + 208 + s[91] * 224, 7, 345, 131329);
                            b.a(0, s[92] + 120 + s[9746] + s[90] * 240, s[91] * s[93] + 208 + s[91] * 224, 7, 346, 131329);
                            b.a(0, s[92] + 0 + s[90] * 240, s[91] * s[93] + 80 - s[9743] + s[91] * 224, 7, 347, 66049);
                            b.a(0, s[92] + 0 + s[90] * 240, s[91] * s[93] + 112 + s[9743] + s[91] * 224, 7, 348, 66049);
                            b.a(0, s[92] + 224 + s[90] * 240, s[91] * s[93] + 80 - s[9745] + s[91] * 224, 7, 347, 66049);
                            b.a(0, s[92] + 224 + s[90] * 240, s[91] * s[93] + 112 + s[9745] + s[91] * 224, 7, 348, 66049);
                            break;
                        }
                        case 8: {
                            s[53] = s[53] + 2;
                            if (s[22] != 0) break;
                            b.a(2, 0, s[53] % 48, 0, 0, 0);
                            break;
                        }
                        case 9: {
                            if (s[22] != 0) break;
                            b.a(4, s[53] % 48, 0, 0, 0, 0);
                        }
                    }
                    switch (s[86]) {
                        case 1: {
                            s[96] = s[96] + 1;
                            if (s[96] <= 4) {
                                s[88] = s[88] + 1;
                                break;
                            }
                            b.s[88] = 4;
                            s[86] = s[86] + 1;
                            b.b(112, 224, 0, s[87]);
                            break;
                        }
                        case 2: {
                            break;
                        }
                        case 3: {
                            s[89] = s[89] + 1;
                            if (s[89] < 8) break;
                            s[86] = s[86] + 1;
                            b.s[96] = 0;
                            b.s[89] = 0;
                            b.s[9751 + b.s[87]] = 1;
                            b.s[9750] = 0;
                            b.s[9748] = 0;
                            b.s[9747] = 0;
                            b.s[9749] = 1;
                            if (s[87] >= 5) {
                                b.s[9748] = 1;
                            }
                            if (s[87] < 15) {
                                b.s[9750] = 1;
                            }
                            if (s[9751 + (s[87] - 5)] != 0) {
                                b.s[9748] = 0;
                            }
                            if (s[9751 + (s[87] + 5)] != 0) {
                                b.s[9750] = 0;
                            }
                            if (s[9748] == 1) {
                                b.s[1265 + (0 + (b.s[52] / 16 + 6) % 16)] = 0;
                                b.s[1265 + (0 + (b.s[52] / 16 + 7) % 16)] = 0;
                                b.s[1265 + (0 + (b.s[52] / 16 + 8) % 16)] = 0;
                            }
                            if (s[9749] == 1) {
                                b.s[1265 + (80 + (b.s[52] / 16 + 14) % 16)] = 0;
                                b.s[1265 + (96 + (b.s[52] / 16 + 14) % 16)] = 0;
                                b.s[1265 + (112 + (b.s[52] / 16 + 14) % 16)] = 0;
                                b.s[1265 + (128 + (b.s[52] / 16 + 14) % 16)] = 0;
                            }
                            if (s[9750] != 1) break;
                            b.s[1265 + (208 + (b.s[52] / 16 + 6) % 16)] = 0;
                            b.s[1265 + (208 + (b.s[52] / 16 + 7) % 16)] = 0;
                            b.s[1265 + (208 + (b.s[52] / 16 + 8) % 16)] = 0;
                            break;
                        }
                        case 4: {
                            int n52 = s[96];
                            s[96] = n52 + 1;
                            if (n52 >= 10) {
                                s[86] = s[86] + 1;
                                break;
                            }
                            if (s[96] <= 4) {
                                b.s[88] = 4 - s[96];
                                break;
                            }
                            for (n12 = 1; n12 < 4; ++n12) {
                                if (s[9747 + n12] != 1) continue;
                                int n53 = 9739 + n12;
                                s[n53] = s[n53] + 4;
                            }
                            break;
                        }
                        case 5: {
                            if (s[9748] == 1 && 88 <= s[1126] && s[1126] <= 112 && s[1143] <= 40) {
                                s[87] = s[87] - 5;
                                s[86] = s[86] + 1;
                                b.s[91] = -1;
                                b.s[9746] = 24;
                            } else if (s[9749] == 1 && 80 <= s[1143] && s[1143] <= 128 && 168 <= s[1126]) {
                                s[87] = s[87] + 1;
                                s[86] = s[86] + 1;
                                b.s[90] = 1;
                                b.s[9743] = 24;
                            } else if (s[9750] == 1 && 88 <= s[1126] && s[1126] <= 112 && 168 <= s[1143]) {
                                s[87] = s[87] + 5;
                                s[86] = s[86] + 1;
                                b.s[91] = 1;
                                b.s[9744] = 24;
                            }
                            b.s[96] = 0;
                            break;
                        }
                        case 6: {
                            int n54 = s[96];
                            s[96] = n54 + 1;
                            if (n54 >= 6) {
                                s[86] = s[86] + 1;
                                if (s[87] % 5 != 0 || s[90] != 1) break;
                                b.s[86] = 0;
                                b.s[41] = 0;
                                b.s[9745] = 24;
                                b.s[9743] = 0;
                                for (n12 = 0; n12 < 752; ++n12) {
                                    b.s[1265 + n12] = 0;
                                }
                                b.b(111, -48, 0, 1);
                                break;
                            }
                            if (s[91] != -1 && s[9748] != 0) {
                                s[9740] = s[9740] - 4;
                            }
                            if (s[90] != 1 && s[9749] != 0) {
                                s[9741] = s[9741] - 4;
                            }
                            if (s[91] == 1 || s[9750] == 0) break;
                            s[9742] = s[9742] - 4;
                            break;
                        }
                        case 7: {
                            s[86] = s[86] + 1;
                        }
                        case 8: {
                            if (s[90] == 1) {
                                s[92] = s[92] - 16;
                                s[1126] = s[1126] - 10;
                                for (n12 = 16; n12 >= 1; --n12) {
                                    int n55 = 1126 + n12;
                                    s[n55] = s[n55] - 10;
                                }
                                if (s[92] > -240) break;
                                s[86] = s[86] + 1;
                                b.s[96] = 0;
                                break;
                            }
                            s[93] = s[93] - 16;
                            s[1143] = s[1143] - s[91] * 16 * 5 / 8;
                            for (n12 = 16; n12 >= 1; --n12) {
                                int n56 = 1143 + n12;
                                s[n56] = s[n56] - s[91] * 16 * 5 / 8;
                            }
                            if (s[93] > -224) break;
                            s[86] = s[86] + 1;
                            b.s[96] = 0;
                            break;
                        }
                        case 9: {
                            int n57 = s[96];
                            s[96] = n57 + 1;
                            if (n57 >= 6) {
                                b.s[86] = 1;
                                b.s[91] = 0;
                                b.s[90] = 0;
                                b.s[93] = 0;
                                b.s[92] = 0;
                                b.s[9746] = 0;
                                b.s[9745] = 0;
                                b.s[9744] = 0;
                                b.s[9743] = 0;
                                b.s[9742] = 0;
                                b.s[9741] = 0;
                                b.s[9740] = 0;
                                b.s[9739] = 0;
                                b.s[96] = 0;
                                for (n12 = 0; n12 < 15; ++n12) {
                                    b.s[1265 + (0 + (b.s[52] / 16 + n12) % 16)] = 1;
                                    b.s[1265 + (208 + (b.s[52] / 16 + n12) % 16)] = 1;
                                }
                                for (n12 = 1; n12 < 13; ++n12) {
                                    b.s[1265 + (n12 * 16 + b.s[52] / 16 % 16)] = 1;
                                    b.s[1265 + (n12 * 16 + (b.s[52] / 16 + 14) % 16)] = 1;
                                }
                                break;
                            }
                            if (s[96] > 6) break;
                            if (s[9746] > 0) {
                                s[9746] = s[9746] - 4;
                            }
                            if (s[9744] > 0) {
                                s[9744] = s[9744] - 4;
                            }
                            if (s[9743] <= 0) break;
                            s[9743] = s[9743] - 4;
                        }
                    }
                    this.g();
                    this.j(graphics);
                    this.b(graphics);
                    if (s[41] == 3) {
                        int n58;
                        for (n = 0; n < 15; ++n) {
                            n12 = 66 * (s[54] / 16 + n);
                            for (n10 = 0; n10 < 16; ++n10) {
                                n13 = s[53] - 240;
                                n58 = n13 / 16 + n10;
                                if (n13 < 0 && n13 % 16 != 0) {
                                    --n58;
                                }
                                if (n58 < 0 || (y[s[48] + (n12 + n58) * 2] & 0xFF) <= 0) continue;
                                try {
                                    C = ((y[s[48] + (n12 + n58) * 2] & 0xFF) - 189) % 16 * 16;
                                    D = (((y[s[48] + (n12 + n58) * 2] & 0xFF) - 189) / 16 + (y[s[48] + (n12 + n58) * 2 + 1] & 3) * 3) * 16;
                                    if (C < 0 || D < 0) continue;
                                    graphics.drawRegion(this.f[4], C * 3 / 4, D * 3 / 4, 12, 12, 0, (n10 * 16 - s[53] % 16) * 3 / 4, (n * 16 - s[54] % 16) * 3 / 4, 20);
                                    continue;
                                }
                                catch (Throwable throwable) {}
                            }
                        }
                        if (s[53] % 16 == 0) {
                            n11 = s[48] + s[53] / 16 * 2;
                            for (n12 = 0; n12 < s[37] / 16; ++n12) {
                                n58 = 0;
                                if ((y[n11] & 0xFF) >= s[39] + s[40] - 1) {
                                    n58 = 1;
                                }
                                b.s[1265 + (n12 * 16 + (b.s[52] / 16 - 1) % 16)] = n58;
                                n11 += s[38] / 16 * 2;
                            }
                        }
                    }
                    this.a(graphics);
                    s[52] = s[52] + s[43];
                    s[53] = s[53] + s[43];
                    s[50] = s[50] - s[42];
                    if (s[36] > 224) {
                        s[54] = s[54] + s[44];
                        if (s[54] < 0) {
                            b.s[54] = 0;
                        }
                        if (s[36] - 224 < s[54]) {
                            b.s[54] = s[36] - 224;
                        }
                        b.s[44] = 0;
                    }
                    if (s[16] >= s[18]) {
                        s[17] = s[17] + 1;
                        s[18] = s[18] + 70000;
                        b.b(7);
                    }
                    n12 = 50;
                    if (s[59] >= 13) {
                        n12 = 56;
                    }
                    if (s[79] == 1) {
                        n12 += 7;
                    }
                    graphics.drawRegion(this.f[0], (B[n12] >> 24 & 0xFF) * 3 / 4, (B[n12] >> 16 & 0xFF) * 3 / 4, (B[n12] >> 8 & 0xFF) * 3 / 4, (B[n12] & 0xFF) * 3 / 4, 0, 12, 168, 20);
                    n12 = 51;
                    if (s[61] >= 20) {
                        n12 = 56;
                    }
                    if (s[79] == 2) {
                        n12 += 7;
                    }
                    graphics.drawRegion(this.f[0], (B[n12] >> 24 & 0xFF) * 3 / 4, (B[n12] >> 16 & 0xFF) * 3 / 4, (B[n12] >> 8 & 0xFF) * 3 / 4, (B[n12] & 0xFF) * 3 / 4, 0, 24, 168, 20);
                    n12 = 52;
                    if (s[60] != 0 && s[60] < 8) {
                        n12 = 56;
                    }
                    if (s[79] == 3) {
                        n12 += 7;
                    }
                    graphics.drawRegion(this.f[0], (B[n12] >> 24 & 0xFF) * 3 / 4, (B[n12] >> 16 & 0xFF) * 3 / 4, (B[n12] >> 8 & 0xFF) * 3 / 4, (B[n12] & 0xFF) * 3 / 4, 0, 36, 168, 20);
                    n12 = 53;
                    if (8 <= s[60]) {
                        n12 = 56;
                    }
                    if (s[79] == 4) {
                        n12 += 7;
                    }
                    graphics.drawRegion(this.f[0], (B[n12] >> 24 & 0xFF) * 3 / 4, (B[n12] >> 16 & 0xFF) * 3 / 4, (B[n12] >> 8 & 0xFF) * 3 / 4, (B[n12] & 0xFF) * 3 / 4, 0, 48, 168, 20);
                    n12 = 54;
                    if (s[84] == 2 || s[71] == 0 && s[65] >= 4) {
                        n12 = 56;
                    }
                    if (s[79] == 5) {
                        n12 += 7;
                    }
                    graphics.drawRegion(this.f[0], (B[n12] >> 24 & 0xFF) * 3 / 4, (B[n12] >> 16 & 0xFF) * 3 / 4, (B[n12] >> 8 & 0xFF) * 3 / 4, (B[n12] & 0xFF) * 3 / 4, 0, 60, 168, 20);
                    n12 = 55;
                    if (s[62] >= 1) {
                        n12 = 56;
                    }
                    if (s[79] == 6) {
                        n12 += 7;
                    }
                    graphics.drawRegion(this.f[0], (B[n12] >> 24 & 0xFF) * 3 / 4, (B[n12] >> 16 & 0xFF) * 3 / 4, (B[n12] >> 8 & 0xFF) * 3 / 4, (B[n12] & 0xFF) * 3 / 4, 0, 72, 168, 20);
                    n12 = 64;
                    if (s[1120] == 1) {
                        n12 = 70;
                    }
                    if (s[80] == 1) {
                        n12 += 7;
                    }
                    graphics.drawRegion(this.f[0], (B[n12] >> 24 & 0xFF) * 3 / 4, (B[n12] >> 16 & 0xFF) * 3 / 4, (B[n12] >> 8 & 0xFF) * 3 / 4, (B[n12] & 0xFF) * 3 / 4, 0, 96, 168, 20);
                    n12 = 65;
                    if (s[1121] == 1) {
                        n12 = 70;
                    }
                    if (s[80] == 2) {
                        n12 += 7;
                    }
                    graphics.drawRegion(this.f[0], (B[n12] >> 24 & 0xFF) * 3 / 4, (B[n12] >> 16 & 0xFF) * 3 / 4, (B[n12] >> 8 & 0xFF) * 3 / 4, (B[n12] & 0xFF) * 3 / 4, 0, 108, 168, 20);
                    n12 = 66;
                    if (s[1122] == 1) {
                        n12 = 70;
                    }
                    if (s[80] == 3) {
                        n12 += 7;
                    }
                    graphics.drawRegion(this.f[0], (B[n12] >> 24 & 0xFF) * 3 / 4, (B[n12] >> 16 & 0xFF) * 3 / 4, (B[n12] >> 8 & 0xFF) * 3 / 4, (B[n12] & 0xFF) * 3 / 4, 0, 120, 168, 20);
                    n12 = 67;
                    if (s[1123] == 1) {
                        n12 = 70;
                    }
                    if (s[80] == 4) {
                        n12 += 7;
                    }
                    graphics.drawRegion(this.f[0], (B[n12] >> 24 & 0xFF) * 3 / 4, (B[n12] >> 16 & 0xFF) * 3 / 4, (B[n12] >> 8 & 0xFF) * 3 / 4, (B[n12] & 0xFF) * 3 / 4, 0, 132, 168, 20);
                    n12 = 68;
                    if (s[1124] == 1) {
                        n12 = 70;
                    }
                    if (s[80] == 5) {
                        n12 += 7;
                    }
                    graphics.drawRegion(this.f[0], (B[n12] >> 24 & 0xFF) * 3 / 4, (B[n12] >> 16 & 0xFF) * 3 / 4, (B[n12] >> 8 & 0xFF) * 3 / 4, (B[n12] & 0xFF) * 3 / 4, 0, 144, 168, 20);
                    n12 = 69;
                    if (s[1125] == 1) {
                        n12 = 70;
                    }
                    if (s[80] == 6) {
                        n12 += 7;
                    }
                    graphics.drawRegion(this.f[0], (B[n12] >> 24 & 0xFF) * 3 / 4, (B[n12] >> 16 & 0xFF) * 3 / 4, (B[n12] >> 8 & 0xFF) * 3 / 4, (B[n12] & 0xFF) * 3 / 4, 0, 156, 168, 20);
                    graphics.drawRegion(this.f[0], (B[1] >> 24 & 0xFF) * 3 / 4, (B[1] >> 16 & 0xFF) * 3 / 4, (B[1] >> 8 & 0xFF) * 3 / 4, (B[1] & 0xFF) * 3 / 4, 0, 0, 168, 20);
                    graphics.drawRegion(this.f[0], (B[1] >> 24 & 0xFF) * 3 / 4, (B[1] >> 16 & 0xFF) * 3 / 4, (B[1] >> 8 & 0xFF) * 3 / 4, (B[1] & 0xFF) * 3 / 4, 0, 84, 168, 20);
                    graphics.drawRegion(this.f[0], (B[1] >> 24 & 0xFF) * 3 / 4, (B[1] >> 16 & 0xFF) * 3 / 4, (B[1] >> 8 & 0xFF) * 3 / 4, (B[1] & 0xFF) * 3 / 4, 0, 168, 168, 20);
                    this.a(graphics, s[16], 7, 140, 2, 4);
                    graphics.drawRegion(this.f[0], (B[43] >> 24 & 0xFF) * 3 / 4, (B[43] >> 16 & 0xFF) * 3 / 4, (B[43] >> 8 & 0xFF) * 3 / 4, (B[43] & 0xFF) * 3 / 4, 0, 0, 0, 20);
                    this.a(graphics, s[17], 2, 14, 2, 4);
                    if (s[34] == 0) break;
                    int n59 = s[34];
                    s[34] = n59 + 1;
                    if (20 >= n59) break;
                    if (a[9]) {
                        b.a[9] = false;
                        b = 14;
                        b.s[0] = 2;
                        b.s[1] = 0;
                        b.s[2] = 1;
                        b.s[3] = 0;
                        this.a(6, 6);
                        if (s[9776 + s[31]] < s[9771 + s[31]] && s[16] >= s[9771 + s[31]]) {
                            switch (s[31]) {
                                case 0: {
                                    s[67] = s[67] + 1;
                                    if (s[67] >= 4) {
                                        b.s[67] = 4;
                                    }
                                    b.s[3] = 2;
                                    break;
                                }
                                case 1: {
                                    s[67] = s[67] + 1;
                                    if (s[67] >= 4) {
                                        b.s[67] = 4;
                                    }
                                    b.s[3] = 2;
                                    break;
                                }
                                case 2: {
                                    b.s[66] = 2;
                                    b.s[3] = 1;
                                    break;
                                }
                                case 3: {
                                    s[67] = s[67] + 1;
                                    if (s[67] >= 4) {
                                        b.s[67] = 4;
                                    }
                                    b.s[3] = 2;
                                    break;
                                }
                                case 4: {
                                    b.s[68] = 2;
                                    b.s[3] = 3;
                                }
                            }
                        }
                        if (s[9776 + s[31]] < s[16]) {
                            b.s[9776 + b.s[31]] = s[16];
                        }
                        b.e(52);
                        break;
                    }
                    b = 18;
                    if (s[31] == 4) {
                        b = 23;
                        this.a(6, 6);
                        b.s[9] = 0;
                        if (s[23] <= 1) {
                            b = 21;
                            b.s[19] = 0;
                            break;
                        }
                        if (2 <= s[32]) {
                            if (s[99] < s[16]) {
                                b.s[99] = s[16];
                                b.s[102] = s[32] * 5 + s[31];
                            }
                            if (s[98] < s[16]) {
                                b.s[99] = s[98];
                                b.s[98] = s[16];
                                b.s[102] = s[101];
                                b.s[101] = s[32] * 5 + s[31];
                            }
                            if (s[97] < s[16]) {
                                b.s[98] = s[97];
                                b.s[97] = s[16];
                                b.s[101] = s[100];
                                b.s[100] = s[32] * 5 + s[31];
                            }
                        }
                        s[32] = s[32] + 1;
                        if (s[33] < s[32]) {
                            b.s[33] = s[32];
                        }
                    }
                    b.s[31] = (s[31] + 1) % 5;
                    if (s[35] < s[31]) {
                        b.s[35] = s[31];
                    }
                    b.e(0);
                    if (s[32] >= 3) break;
                    b.e(20);
                    break;
                }
                case 21: {
                    if (a[9]) {
                        b.a[9] = false;
                        b = 14;
                        b.s[0] = 2;
                        b.s[1] = 0;
                        b.s[2] = 0;
                        b.s[3] = 0;
                        this.a(6, 6);
                        break;
                    }
                    if (2 <= s[23]) {
                        if (s[99] < s[16]) {
                            b.s[99] = s[16];
                            b.s[102] = s[32] * 5 + s[31];
                        }
                        if (s[98] < s[16]) {
                            b.s[99] = s[98];
                            b.s[98] = s[16];
                            b.s[102] = s[101];
                            b.s[101] = s[32] * 5 + s[31];
                        }
                        if (s[97] < s[16]) {
                            b.s[98] = s[97];
                            b.s[97] = s[16];
                            b.s[101] = s[100];
                            b.s[100] = s[32] * 5 + s[31];
                        }
                        b.e(0);
                    }
                    b.s[0] = 0;
                    ++b;
                    this.a(6, 6);
                }
                case 22: {
                    this.a(graphics, 308, 16, 8, 60);
                    if (s[19] > 0) {
                        this.a(graphics, 324, 13, 29, 120);
                        this.a(graphics, s[19], 2, 183, 120, 4);
                        if (s[19] < 10) {
                            this.a(graphics, 0, 1, 183, 120, 4);
                        }
                        this.a(graphics, 337, 3, 99, 152);
                        this.a(graphics, 340, 3, 99, 168);
                        if ((s[12] & 0x42) != 0) {
                            s[0] = s[0] ^ 1;
                        }
                        graphics.drawRegion(this.f[0], (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4, 0, 62, (152 + s[0] * 16 - 2) * 3 / 4, 20);
                    }
                    this.a(graphics, "PRESS OK", 64, 208);
                    if ((s[12] & 0x100) == 0) break;
                    b = 4;
                    if (s[19] <= 0 || s[0] != 0) break;
                    s[19] = s[19] - 1;
                    b.s[16] = 0;
                    b.s[18] = 70000;
                    b.s[17] = 2;
                    b.s[1120] = 0;
                    b.s[1121] = 0;
                    b.s[1122] = 0;
                    b.s[1123] = 0;
                    b.s[1124] = 0;
                    b.s[1125] = 0;
                    b.s[79] = 1;
                    b = 20;
                    this.a(4, 5);
                    break;
                }
                case 999: {
                    int n = 19;
                    boolean bl = false;
                    this.a(graphics, "YES", 99, 19);
                    this.a(graphics, "NO", 99, 35);
                    graphics.setColor(0);
                    graphics.fillRect(0, 0, this.getWidth(), this.getHeight());
                    String string = "";
                    if (this.M == null) {
                        this.M = a.a(172, "Would you like to view more games from Konami?" + string, graphics.getFont());
                    }
                    graphics.setColor(0xFFFFFF);
                    for (int i = 0; i < this.M.length; ++i) {
                        graphics.drawString(this.M[i], 93, (3 + (graphics.getFont().getHeight() + 10) * (i + 1)) * 3 / 4, 17);
                        n += graphics.getFont().getHeight() + 10;
                    }
                    this.a(graphics, "YES", 99, n + 32);
                    this.a(graphics, "NO", 99, n + 48);
                    if ((s[12] & 2) != 0) {
                        s[0] = s[0] + 1;
                    } else if ((s[12] & 0x40) != 0) {
                        s[0] = s[0] + 1;
                    }
                    s[0] = s[0] % 2;
                    graphics.drawRegion(this.f[0], (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4, 0, 62, (n + 16 + (s[0] + 1) * 16 - 2) * 3 / 4, 20);
                    if ((s[12] & 0x100) == 0) break;
                    switch (s[0]) {
                        case 0: {
                            try {
                                String string2 = "2206";
                                this.m = false;
                                this.w.platformRequest("http://wap.cingularextras.com/fuel/enduser/endUserWMLDesc?categoryID=" + string2);
                            }
                            catch (Throwable throwable) {
                                Throwable throwable2 = throwable;
                                a.a(throwable.toString());
                            }
                            break;
                        }
                        case 1: {
                            this.m = false;
                        }
                    }
                    break;
                }
                case 23: {
                    int n;
                    graphics.setColor(0xFFFFFF);
                    graphics.fillRect(0, 0, 180, 180);
                    if (s[9] < 20) break;
                    b.s[1126] = 32;
                    b.s[1143] = 104;
                    for (n = 1; n < 17; ++n) {
                        b.s[1126 + n] = s[1126];
                        b.s[1143 + n] = s[1143];
                    }
                    for (n = 0; n < 20; ++n) {
                        b.s[1245 + n] = -1;
                    }
                    ++b;
                    b.s[9] = 0;
                    b.s[45] = 1;
                    b.a(36);
                    this.d();
                    this.a(3, "midium");
                    this.a(2, "e");
                    b.s[0] = 272;
                    b.s[1] = 0;
                    b.s[2] = 0;
                    b.s[3] = 0;
                    break;
                }
                case 24: {
                    if (s[2] <= 1) {
                        int n;
                        graphics.drawRegion(this.f[3], (B[283] >> 24 & 0xFF) * 3 / 4, (B[283] >> 16 & 0xFF) * 3 / 4, (B[283] >> 8 & 0xFF) * 3 / 4, (B[283] & 0xFF) * 3 / 4, 0, (41 + s[1] / 16 - 16) * 3 / 4, 0, 20);
                        for (n = 0; n < 20; ++n) {
                            int n60 = s[1055 + n] - s[1] / 2 * (n / 2 + 1) * s[45] & 0xFF;
                            int n61 = s[1055 + (20 + n)] & 0xFF;
                            graphics.setColor(s[307 + n]);
                            graphics.drawLine(n60 * 3 / 4, n61 * 3 / 4, n60 * 3 / 4, n61 * 3 / 4);
                        }
                        graphics.drawRegion(this.f[2], (B[351] >> 24 & 0xFF) * 3 / 4, (B[351] >> 16 & 0xFF) * 3 / 4, (B[351] >> 8 & 0xFF) * 3 / 4, (B[351] & 0xFF) * 3 / 4, 0, (240 - s[1] / 6 + 16) * 3 / 4, 108, 20);
                        if ((s[9] & 7) == 0 || (s[9] & 7) == 3) {
                            graphics.drawRegion(this.f[2], (B[349] >> 24 & 0xFF) * 3 / 4, (B[349] >> 16 & 0xFF) * 3 / 4, (B[349] >> 8 & 0xFF) * 3 / 4, (B[349] & 0xFF) * 3 / 4, 0, (240 - s[1] / 6 + 16) * 3 / 4, 120, 20);
                        } else if ((s[9] & 7) == 2 || (s[9] & 7) == 4) {
                            graphics.drawRegion(this.f[2], (B[350] >> 24 & 0xFF) * 3 / 4, (B[350] >> 16 & 0xFF) * 3 / 4, (B[350] >> 8 & 0xFF) * 3 / 4, (B[350] & 0xFF) * 3 / 4, 0, (240 - s[1] / 6 + 16) * 3 / 4, 120, 20);
                        }
                        if (s[2] == 0) {
                            int n62 = 0;
                            graphics.setFont(Font.getFont((int)64, (int)0, (int)8));
                            for (n = 0; n < this.n.length - 1; ++n) {
                                for (int i = 0; i < this.n[n].length; ++i) {
                                    if (-26 < s[0] + n62 && s[0] + n62 < 266) {
                                        if (i == 0 && n < this.n.length - 1) {
                                            graphics.setColor(0x808080);
                                            graphics.drawString(this.n[n][i], 90, (s[0] + n62 + 0) * 3 / 4, 17);
                                            graphics.drawString(this.n[n][i], 90, (s[0] + n62 - 1) * 3 / 4, 17);
                                            graphics.drawString(this.n[n][i], 89, (s[0] + n62 + 0) * 3 / 4, 17);
                                            graphics.drawString(this.n[n][i], 90, (s[0] + n62 + 1) * 3 / 4, 17);
                                        }
                                        graphics.setColor(0xFFFFFF);
                                        graphics.drawString(this.n[n][i], 90, (s[0] + n62) * 3 / 4, 17);
                                    }
                                    if (n != this.n.length - 2 || s[0] + (n62 += 26) >= -52) continue;
                                    b.s[2] = 1;
                                    b.s[3] = 0;
                                }
                                n62 += 52;
                                if (8 > n) continue;
                                n62 += 182;
                            }
                        }
                        s[0] = s[0] - 4;
                        s[1] = s[1] + 2;
                        s[3] = s[3] + 8;
                        if ((s[11] & 0x100) != 0) {
                            s[0] = s[0] - 28;
                            s[1] = s[1] + 14;
                            s[3] = s[3] + 24;
                        }
                        if (s[2] < 1) break;
                        graphics.setColor(0);
                        graphics.fillRect(0, 0, 180, s[3] * 3 / 4);
                        graphics.fillRect(0, (240 - s[3]) * 3 / 4, 180, 180);
                        if (128 >= s[3]) break;
                        b.s[2] = 3;
                        b.s[3] = 0;
                        break;
                    }
                    if (s[2] != 3) break;
                    graphics.setColor(0xFFFFFF);
                    graphics.setFont(Font.getFont((int)64, (int)0, (int)8));
                    for (int i = 0; i < this.n[this.n.length - 1].length; ++i) {
                        graphics.drawString(this.n[this.n.length - 1][i], 90, (81 + i * 26) * 3 / 4, 17);
                    }
                    if (3 <= s[32]) {
                        graphics.setColor(0x40FF00);
                        graphics.drawString("Congratulations!", 90, 21, 17);
                    }
                    graphics.setColor(0);
                    graphics.fillRect(0, 0, 180, (120 - s[3]) * 3 / 4);
                    graphics.fillRect(0, (120 + s[3]) * 3 / 4, 180, 180);
                    s[3] = s[3] + 2;
                    if ((s[11] & 0x100) != 0) {
                        s[3] = s[3] + 14;
                    }
                    if (52 > s[3]) break;
                    if (s[3] > 120) {
                        b.s[3] = 120;
                    }
                    if ((s[12] & 0x100) == 0) break;
                    this.a();
                    b = 18;
                    if (3 > s[32]) break;
                    this.a(2, "title");
                    b = 11;
                    break;
                }
                case 26: {
                    this.e = true;
                    graphics.setColor(0xFFFFFF);
                    graphics.setFont(Font.getFont((int)32, (int)0, (int)8));
                    graphics.setClip(0, 0, this.getWidth(), this.getHeight());
                    for (int i = 0; i < this.d[s[1]].length; ++i) {
                        graphics.drawString(this.d[s[1]][i], 90, (64 + 26 * i) * 3 / 4, 17);
                    }
                    if (s[2] + 1 >= 10) {
                        graphics.drawString("" + (s[2] + 1), 148, 108, 20);
                    } else {
                        graphics.drawString("0" + (s[2] + 1), 148, 108, 20);
                    }
                    this.a(graphics, 105, 10, 50, 16);
                    this.a(graphics, 436, 3, 16, 48);
                    this.a(graphics, 439, 3, 16, 128);
                    this.a(graphics, 442, 4, 16, 208);
                    this.a(graphics, 294, 7, 16, 224);
                    if ((s[12] & 2) != 0) {
                        s[0] = s[0] + 3;
                    } else if ((s[12] & 0x40) != 0) {
                        s[0] = s[0] + 1;
                    }
                    s[0] = s[0] % 4;
                    if (s[0] == 3) {
                        graphics.drawRegion(this.f[0], (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4, 0, -1, 166, 20);
                    } else {
                        graphics.drawRegion(this.f[0], (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4, (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4, 0, -1, (16 * (3 + s[0] * 5) - 2) * 3 / 4, 20);
                    }
                    if ((s[12] & 4) != 0) {
                        if (s[0] == 0) {
                            s[1] = s[1] + 8;
                        } else if (s[0] == 1) {
                            s[2] = s[2] + 11;
                        }
                    } else if ((s[12] & 0x20) != 0) {
                        if (s[0] == 0) {
                            s[1] = s[1] + 1;
                        } else if (s[0] == 1) {
                            s[2] = s[2] + 1;
                        }
                    }
                    s[1] = s[1] % 9;
                    s[2] = s[2] % 12;
                    if ((s[12] & 0x800000) != 0) {
                        b = 9;
                        b.s[0] = 0;
                        this.a();
                        this.e = false;
                    }
                    if ((s[12] & 0x100) == 0) break;
                    if (s[0] == 0) {
                        b.a(s[9781 + s[1]]);
                        break;
                    }
                    if (s[0] == 1) {
                        b.b(s[2]);
                        break;
                    }
                    if (s[0] == 2) {
                        this.a();
                        break;
                    }
                    b = 9;
                    b.s[0] = 0;
                    this.a();
                    this.e = false;
                }
            }
            graphics.setColor(0);
            graphics.translate(-s[7], -s[8]);
            graphics.setClip(0, 0, this.getWidth(), this.getHeight());
            if (0 < s[7]) {
                graphics.fillRect(0, 0, s[7], 240);
                graphics.fillRect(s[7] + 180, 0, s[7] + 1, 240);
            }
            if (0 < s[8]) {
                graphics.fillRect(0, 0, 240, s[8]);
                if (b != 6) {
                    graphics.fillRect(0, s[8] + 180, 240, s[8] + 5);
                }
            }
            this.c(graphics);
            return;
        }
        catch (Throwable throwable) {
            return;
        }
    }

    private void i() {
        ++o;
        switch (o %= 3) {
            case 0: {
                this.a();
                break;
            }
            case 1: {
                b.a(c);
                break;
            }
            case 2: {
                b.b(7);
            }
        }
        b.e(0);
    }

    private void j() {
        if (a[3]) {
            b.a[3] = false;
            if (o != 2 && !this.e) {
                return;
            }
            String[] stringArray = new String[]{"0_skyenemydie", "1_corehit", "2_enemydie1", "3_enemydie2", "4_longlaser", "5_powerget", "6_optionselect", "7_powerup", "8_biglaser", "9_bossdie", "10_viperdie", "11_coin"};
            this.a("/" + stringArray[s[28]] + ".mid", 1);
        }
    }

    private void k() {
        long l = System.currentTimeMillis();
        if (l < this.p && this.q) {
            b.a(c);
            Thread.yield();
            return;
        }
        this.p = 0L;
        if (a[2]) {
            b.a[2] = false;
            if (o != 1 && !this.e) {
                return;
            }
            int n = c / 3 - 4;
            String[] stringArray = new String[]{"boss1", "st1", "st2", "st3", "st4", "st5", "boss2", "lastboss", "ending1"};
            this.a("/" + stringArray[n] + ".mid", -1);
            if (this.q) {
                this.q = false;
                this.T = 1;
                this.l();
            }
        }
    }

    private void l() {
        switch (this.T) {
            case 0: {
                this.m();
                ++this.T;
                return;
            }
            case 1: {
                try {
                    Player player = (Player)this.V.get(this.R);
                    if (player != null) {
                        ++this.T;
                        player.realize();
                        player.setLoopCount(this.S);
                        player.start();
                        this.U = player;
                    } else {
                        String string = "audio/midi";
                        Player player2 = Manager.createPlayer((InputStream)this.getClass().getResourceAsStream(this.R), (String)string);
                        player2.addPlayerListener((PlayerListener)this);
                        this.V.put(this.R, player2);
                    }
                    return;
                }
                catch (Throwable throwable) {
                    this.T = 0;
                    a.a(" pse:" + throwable);
                    if (throwable.getMessage().equals("device error")) {
                        this.T = 2;
                    }
                    return;
                }
            }
            case 2: {
                this.R = null;
                ++this.T;
            }
        }
    }

    private void a(String string, int n) {
        this.R = string;
        this.S = n;
        this.T = 0;
    }

    private void m() {
        if (this.U != null) {
            try {
                this.U.stop();
                this.U.deallocate();
            }
            catch (Throwable throwable) {}
            this.U = null;
        }
    }

    public final void playerUpdate(Player player, String string, Object object) {
    }

    public final void b() {
        if (r) {
            return;
        }
        r = true;
        this.i = 0;
        this.a();
    }

    public final void c() {
        if (!r) {
            return;
        }
        this.p = System.currentTimeMillis() + 1000L;
        this.q = true;
        r = false;
        if (b == 20) {
            if (!a[4]) {
                b.a[4] = true;
                b = 205;
            }
            b.a(c);
            this.l();
            b.a(c);
        }
        if (b >= 4 && b <= 14 || b == 22 || b == 203 || b == 23 || b == 24) {
            b.a(c);
            this.l();
            b.a(c);
        }
        this.l();
    }

    static {
        y = new byte[25112];
        B = new int[409];
        E = new Command[]{new Command("M on", 1, 1), new Command("Moff", 1, 1), new Command("EXIT", 1, 1), new Command("BACK", 1, 1), new Command("POW1", 1, 1), new Command("POW2", 1, 1), new Command(" ", 1, 1)};
        H = new byte[78];
        O = Font.getFont((int)32, (int)0, (int)0);
        o = 0;
        r = false;
    }
}


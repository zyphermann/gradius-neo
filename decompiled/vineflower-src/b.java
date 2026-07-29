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

final class b extends GameCanvas implements Runnable, PlayerListener {
   private static int[] s = new int[9790];
   public static boolean[] a = new boolean[10];
   private static short[] t = new short[3836];
   private static long[] u = new long[5];
   public static int b;
   public static int c;
   private static InputStream v;
   private GradiusNeo w;
   private static RecordStore x;
   private static byte[] y = new byte[25112];
   String[][] d = new String[][]{
      {"    Shooting Again "},
      {" A Stone Graveyard "},
      {" The Tension Is    ", "       Building Up "},
      {"Speed of The ", "         Photon"},
      {" Another Bass ", "         S-MIX"},
      {" Gradius Boss      ", "           NEO-MIX "},
      {" Salamander Boss   ", "           NEO-MIX "},
      {"     Crystal Force "},
      {"        NEO Ending "}
   };
   public boolean e = false;
   private static int z;
   private static int A;
   Image[] f = new Image[6];
   private static int[] B = new int[409];
   private static int C;
   private static int D;
   long g = 0L;
   long h = 0L;
   private static Command[] E = new Command[]{
      new Command("M on", 1, 1),
      new Command("Moff", 1, 1),
      new Command("EXIT", 1, 1),
      new Command("BACK", 1, 1),
      new Command("POW1", 1, 1),
      new Command("POW2", 1, 1),
      new Command(" ", 1, 1)
   };
   private String F = " ";
   private String G = " ";
   private static byte[] H = new byte[78];
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
   String[][] n = new String[][]{
      {"- GRADIUS NEO -", "Final Stage Cleared!", "Try next round!!"},
      {"", "", "", "", "", ""},
      {"STAFF"},
      {"PROGRAMMER", "Nobuhiro Kimura"},
      {"DESIGNER", "Joe"},
      {"SOUND COMPOSER", "Off Course", "Takeuchi"},
      {"SITE PROGRAMMER", "James Tatsuno", "Kazuhiko Ono", "Tomohiko Asato"},
      {"TECHNICAL", "ADVISER", "NWK SNAIL"},
      {"SALES PROMOTER", "Hideyuki Oya", "Yusuke Zaitsu", "Hirosuke Nagai", "Sanae Hara", "Mayuko Suzuki", "Yoko Uchida"},
      {"DIRECTOR", "Nobuhiro Kimura", "Bunmei Tsuchiya"},
      {"PRODUCER", "Masaya Aihara"},
      {"SUPERVISOR", "Shigeru Fukutake"},
      {"EXECUTIVE", "PRODUCER", "Mariko Hayashi"},
      {"", "Dedicated in", "loving memory", "to friend and", "co-worker,", "Daniel", "Westmoreland.", "1980-2006"},
      {"See You Again in", "GRADIUS NEO", "- IMPERIAL -", "", "Press OK", "to continue"}
   };
   private static Font O = Font.getFont(32, 0, 0);
   private Image P;
   private long Q;
   public static int o = 0;
   long p = 0L;
   boolean q = false;
   private String R = null;
   private int S = 0;
   private int T = 3;
   private Player U = null;
   private Hashtable V = new Hashtable();
   static boolean r = false;

   private void d() {
      for (int var1 = 2; var1 < 6; var1++) {
         this.f[var1] = null;
      }

      System.gc();
   }

   private void a(int var1, String var2) {
      this.f[var1] = null;
      System.gc();

      try {
         this.f[var1] = Image.createImage("/img_" + var2);
      } catch (Throwable var4) {
         return;
      }

      this.a("csv_" + var2);

      for (int var3 = 0; var3 < (y[2] << 8 | y[3] & 255); var3++) {
         B[(y[0] << 8 | y[1] & 255) + var3] = y[4 + var3 * 4] << 24 | (y[5 + var3 * 4] & 255) << 16 | (y[6 + var3 * 4] & 255) << 8 | y[7 + var3 * 4] & 255;
      }
   }

   private void a(Graphics var1) {
      for (int var6 = 4; var6 < 18; var6++) {
         int var4 = s[2028 + var6];

         while (var4 != -1) {
            int var5 = s[2558 + var4];
            switch (s[3070 + var4]) {
               case 0:
                  if (s[7166 + var4] <= 147) {
                     var1.drawRegion(
                        this.f[0],
                        (B[s[7166 + var4]] >> 24 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 16 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 8 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] & 0xFF) * 3 / 4,
                        0,
                        s[3582 + var4] * 3 / 4,
                        (s[4094 + var4] - s[54]) * 3 / 4,
                        20
                     );
                  } else if (s[7166 + var4] <= 282) {
                     var1.drawRegion(
                        this.f[1],
                        (B[s[7166 + var4]] >> 24 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 16 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 8 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] & 0xFF) * 3 / 4,
                        0,
                        s[3582 + var4] * 3 / 4,
                        (s[4094 + var4] - s[54]) * 3 / 4,
                        20
                     );
                  } else if (s[7166 + var4] <= 292) {
                     var1.drawRegion(
                        this.f[3],
                        (B[s[7166 + var4]] >> 24 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 16 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 8 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] & 0xFF) * 3 / 4,
                        0,
                        s[3582 + var4] * 3 / 4,
                        (s[4094 + var4] - s[54]) * 3 / 4,
                        20
                     );
                  } else if (s[7166 + var4] <= 348) {
                     var1.drawRegion(
                        this.f[4],
                        (B[s[7166 + var4]] >> 24 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 16 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 8 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] & 0xFF) * 3 / 4,
                        0,
                        s[3582 + var4] * 3 / 4,
                        (s[4094 + var4] - s[54]) * 3 / 4,
                        20
                     );
                  } else if (s[7166 + var4] <= 408) {
                     var1.drawRegion(
                        this.f[2],
                        (B[s[7166 + var4]] >> 24 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 16 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 8 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] & 0xFF) * 3 / 4,
                        0,
                        s[3582 + var4] * 3 / 4,
                        (s[4094 + var4] - s[54]) * 3 / 4,
                        20
                     );
                  }
                  break;
               case 1:
                  if (s[7166 + var4] <= 147) {
                     var1.drawRegion(
                        this.f[0],
                        (B[s[7166 + var4]] >> 24 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 16 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 8 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] & 0xFF) * 3 / 4,
                        0,
                        s[3582 + var4] * 3 / 4,
                        (s[4094 + var4] - s[54]) * 3 / 4,
                        20
                     );
                  } else if (s[7166 + var4] <= 282) {
                     var1.drawRegion(
                        this.f[1],
                        (B[s[7166 + var4]] >> 24 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 16 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 8 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] & 0xFF) * 3 / 4,
                        0,
                        s[3582 + var4] * 3 / 4,
                        (s[4094 + var4] - s[54]) * 3 / 4,
                        20
                     );
                  } else if (s[7166 + var4] <= 292) {
                     var1.drawRegion(
                        this.f[3],
                        (B[s[7166 + var4]] >> 24 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 16 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 8 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] & 0xFF) * 3 / 4,
                        0,
                        s[3582 + var4] * 3 / 4,
                        (s[4094 + var4] - s[54]) * 3 / 4,
                        20
                     );
                  } else if (s[7166 + var4] <= 348) {
                     var1.drawRegion(
                        this.f[4],
                        (B[s[7166 + var4]] >> 24 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 16 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 8 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] & 0xFF) * 3 / 4,
                        0,
                        s[3582 + var4] * 3 / 4,
                        (s[4094 + var4] - s[54]) * 3 / 4,
                        20
                     );
                  } else if (s[7166 + var4] <= 408) {
                     var1.drawRegion(
                        this.f[2],
                        (B[s[7166 + var4]] >> 24 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 16 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 8 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] & 0xFF) * 3 / 4,
                        0,
                        s[3582 + var4] * 3 / 4,
                        (s[4094 + var4] - s[54]) * 3 / 4,
                        20
                     );
                  }
                  break;
               case 2:
                  if (s[7166 + var4] <= 147) {
                     var1.drawRegion(
                        this.f[0],
                        (B[s[7166 + var4]] >> 24 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 16 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 8 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] & 0xFF) * 3 / 4,
                        0,
                        s[3582 + var4] * 3 / 4,
                        (s[4094 + var4] - s[54]) * 3 / 4,
                        20
                     );
                  } else if (s[7166 + var4] <= 282) {
                     var1.drawRegion(
                        this.f[1],
                        (B[s[7166 + var4]] >> 24 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 16 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 8 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] & 0xFF) * 3 / 4,
                        0,
                        s[3582 + var4] * 3 / 4,
                        (s[4094 + var4] - s[54]) * 3 / 4,
                        20
                     );
                  } else if (s[7166 + var4] <= 292) {
                     var1.drawRegion(
                        this.f[3],
                        (B[s[7166 + var4]] >> 24 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 16 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 8 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] & 0xFF) * 3 / 4,
                        0,
                        s[3582 + var4] * 3 / 4,
                        (s[4094 + var4] - s[54]) * 3 / 4,
                        20
                     );
                  } else if (s[7166 + var4] <= 348) {
                     var1.drawRegion(
                        this.f[4],
                        (B[s[7166 + var4]] >> 24 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 16 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 8 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] & 0xFF) * 3 / 4,
                        0,
                        s[3582 + var4] * 3 / 4,
                        (s[4094 + var4] - s[54]) * 3 / 4,
                        20
                     );
                  } else if (s[7166 + var4] <= 408) {
                     var1.drawRegion(
                        this.f[2],
                        (B[s[7166 + var4]] >> 24 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 16 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] >> 8 & 0xFF) * 3 / 4,
                        (B[s[7166 + var4]] & 0xFF) * 3 / 4,
                        0,
                        s[3582 + var4] * 3 / 4,
                        (s[4094 + var4] - s[54]) * 3 / 4,
                        20
                     );
                  }
                  break;
               case 3:
                  if (0 < s[62]) {
                     int var2 = 140 + (s[9] & 1) * 4;
                     int var11 = (s[62] + 3 - 1) / 3 & 1;
                     var1.drawRegion(
                        this.f[0],
                        (B[var2] >> 24 & 0xFF) * 3 / 4,
                        (B[var2] >> 16 & 0xFF) * 3 / 4,
                        (B[var2] >> 8 & 0xFF) * 3 / 4,
                        (B[var2] & 0xFF) * 3 / 4,
                        0,
                        (s[3582 + var4] + 6 + var11 * 1 - 16) * 3 / 4,
                        (s[4094 + var4] + -8 + var11 * 1 - 1 - s[54]) * 3 / 4,
                        20
                     );
                     var1.drawRegion(
                        this.f[0],
                        (B[var2 + 1] >> 24 & 0xFF) * 3 / 4,
                        (B[var2 + 1] >> 16 & 0xFF) * 3 / 4,
                        (B[var2 + 1] >> 8 & 0xFF) * 3 / 4,
                        (B[var2 + 1] & 0xFF) * 3 / 4,
                        0,
                        (s[3582 + var4] + 6 - var11 * 1 + 8) * 3 / 4,
                        (s[4094 + var4] + -8 + var11 * 1 - 1 - s[54]) * 3 / 4,
                        20
                     );
                     var1.drawRegion(
                        this.f[0],
                        (B[var2 + 2] >> 24 & 0xFF) * 3 / 4,
                        (B[var2 + 2] >> 16 & 0xFF) * 3 / 4,
                        (B[var2 + 2] >> 8 & 0xFF) * 3 / 4,
                        (B[var2 + 2] & 0xFF) * 3 / 4,
                        0,
                        (s[3582 + var4] + 6 + var11 * 1 - 16) * 3 / 4,
                        (s[4094 + var4] + -8 - var11 * 1 + 16 - 1 - s[54]) * 3 / 4,
                        20
                     );
                     var1.drawRegion(
                        this.f[0],
                        (B[var2 + 1 + 2] >> 24 & 0xFF) * 3 / 4,
                        (B[var2 + 1 + 2] >> 16 & 0xFF) * 3 / 4,
                        (B[var2 + 1 + 2] >> 8 & 0xFF) * 3 / 4,
                        (B[var2 + 1 + 2] & 0xFF) * 3 / 4,
                        0,
                        (s[3582 + var4] + 6 - var11 * 1 + 8) * 3 / 4,
                        (s[4094 + var4] + -8 - var11 * 1 + 16 - 1 - s[54]) * 3 / 4,
                        20
                     );
                  }

                  int var7 = 80;
                  if (s[63] < 0) {
                     s[63]++;
                     if (s[63] < -7) {
                        s[63] = -7;
                     }

                     var7--;
                     if (s[63] < -2) {
                        var7--;
                     }
                  } else if (s[63] > 0) {
                     s[63]--;
                     if (s[63] > 7) {
                        s[63] = 7;
                     }

                     var7++;
                     if (s[63] > 2) {
                        var7++;
                     }
                  }

                  var1.drawRegion(
                     this.f[0],
                     (B[var7] >> 24 & 0xFF) * 3 / 4,
                     (B[var7] >> 16 & 0xFF) * 3 / 4,
                     (B[var7] >> 8 & 0xFF) * 3 / 4,
                     (B[var7] & 0xFF) * 3 / 4,
                     0,
                     s[3582 + var4] * 3 / 4,
                     (s[4094 + var4] - 2 - s[54]) * 3 / 4,
                     20
                  );
                  var7 = 44;
                  if (s[59] > 5) {
                     var7 = 44 + (s[9] & 1);
                  }

                  var1.drawRegion(
                     this.f[0],
                     (B[var7] >> 24 & 0xFF) * 3 / 4,
                     (B[var7] >> 16 & 0xFF) * 3 / 4,
                     (B[var7] >> 8 & 0xFF) * 3 / 4,
                     (B[var7] & 0xFF) * 3 / 4,
                     0,
                     (s[3582 + var4] - 8) * 3 / 4,
                     (s[4094 + var4] - 2 - s[54]) * 3 / 4,
                     20
                  );
                  break;
               case 4:
                  if (s[4094 + var4] >= 0) {
                     if (s[4094 + var4] <= 2) {
                        for (int var10 = 0; var10 < 9; var10++) {
                           var1.drawRegion(
                              this.f[1],
                              (B[254 + var10] >> 24 & 0xFF) * 3 / 4,
                              (B[254 + var10] >> 16 & 0xFF) * 3 / 4,
                              (B[254 + var10] >> 8 & 0xFF) * 3 / 4,
                              (B[254 + var10] & 0xFF) * 3 / 4,
                              0,
                              (s[1126] + 8 * (5 + var10 % 3 * 2) + (1 - var10 % 3) * 4 * (2 - s[4094 + var4])) * 3 / 4,
                              (s[1143] + 16 * (var10 / 3 - 1) + (1 - var10 / 3) * 4 * (2 - s[4094 + var4]) - s[54]) * 3 / 4,
                              20
                           );
                        }
                     } else {
                        for (int var3 = 0; var3 < 9; var3++) {
                           var1.drawRegion(
                              this.f[1],
                              (B[254 + var3] >> 24 & 0xFF) * 3 / 4,
                              (B[254 + var3] >> 16 & 0xFF) * 3 / 4,
                              (B[254 + var3] >> 8 & 0xFF) * 3 / 4,
                              (B[254 + var3] & 0xFF) * 3 / 4,
                              0,
                              (s[1126] + 8 * (5 + var3 % 3 * 2) + (1 - var3 % 3) * 4 * 0) * 3 / 4,
                              (s[1143] + 16 * (var3 / 3 - 1) + (1 - var3 / 3) * 4 * 0 - s[54]) * 3 / 4,
                              20
                           );
                        }

                        for (int var9 = s[1126] + 64; var9 < s[1185]; var9 += 16) {
                           var1.drawRegion(
                              this.f[1],
                              (B[264] >> 24 & 0xFF) * 3 / 4,
                              (B[264] >> 16 & 0xFF) * 3 / 4,
                              (B[264] >> 8 & 0xFF) * 3 / 4,
                              (B[264] & 0xFF) * 3 / 4,
                              0,
                              var9 * 3 / 4,
                              (s[1143] + 0 - s[54]) * 3 / 4,
                              20
                           );
                           var1.drawRegion(
                              this.f[1],
                              (B[263] >> 24 & 0xFF) * 3 / 4,
                              (B[263] >> 16 & 0xFF) * 3 / 4,
                              (B[263] >> 8 & 0xFF) * 3 / 4,
                              (B[263] & 0xFF) * 3 / 4,
                              0,
                              var9 * 3 / 4,
                              (s[1143] + -16 + 4 * (5 - s[4094 + var4]) - s[54]) * 3 / 4,
                              20
                           );
                           var1.drawRegion(
                              this.f[1],
                              (B[265] >> 24 & 0xFF) * 3 / 4,
                              (B[265] >> 16 & 0xFF) * 3 / 4,
                              (B[265] >> 8 & 0xFF) * 3 / 4,
                              (B[265] & 0xFF) * 3 / 4,
                              0,
                              var9 * 3 / 4,
                              (s[1143] + 16 - 4 * (5 - s[4094 + var4]) - s[54]) * 3 / 4,
                              20
                           );
                        }
                     }
                  }
            }

            s[2558 + var4] = s[55];
            s[55] = var4;
            var4 = var5;
         }

         s[2028 + var6] = -1;
      }
   }

   private void b(Graphics var1) {
      for (int var6 = 0; var6 < 3; var6++) {
         int var4 = s[2028 + var6];

         while (var4 != -1) {
            int var5 = s[2558 + var4];
            switch (s[3070 + var4]) {
               case 0:
                  var1.setColor(191, 223, 255);
                  var1.drawLine(
                     s[1205 + s[3582 + var4]] * 3 / 4,
                     (s[4094 + var4] + 6 - s[54]) * 3 / 4,
                     s[1185 + s[3582 + var4]] * 3 / 4,
                     (s[4094 + var4] + 6 - s[54]) * 3 / 4
                  );
                  break;
               case 1:
                  for (int var10 = 0; var10 < 4 - s[7166 + var4]; var10++) {
                     for (int var9 = 0; var9 < 6; var9++) {
                        var1.drawRegion(
                           this.f[4],
                           (B[328 - var10] >> 24 & 0xFF) * 3 / 4,
                           (B[328 - var10] >> 16 & 0xFF) * 3 / 4,
                           (B[328 - var10] >> 8 & 0xFF) * 3 / 4,
                           (B[328 - var10] & 0xFF) * 3 / 4,
                           0,
                           (s[3582 + var4] + 48 - var10 * 16) * 3 / 4,
                           (s[4094 + var4] + var9 * 48) * 3 / 4,
                           20
                        );
                        var1.drawRegion(
                           this.f[4],
                           (B[329 + var10] >> 24 & 0xFF) * 3 / 4,
                           (B[329 + var10] >> 16 & 0xFF) * 3 / 4,
                           (B[329 + var10] >> 8 & 0xFF) * 3 / 4,
                           (B[329 + var10] & 0xFF) * 3 / 4,
                           0,
                           (s[3582 + var4] + 176 + var10 * 16) * 3 / 4,
                           (s[4094 + var4] + var9 * 48) * 3 / 4,
                           20
                        );
                     }
                  }
                  break;
               case 2:
                  for (int var8 = 0; var8 < 6; var8++) {
                     var1.drawRegion(
                        this.f[4],
                        (B[299] >> 24 & 0xFF) * 3 / 4,
                        (B[299] >> 16 & 0xFF) * 3 / 4,
                        (B[299] >> 8 & 0xFF) * 3 / 4,
                        (B[299] & 0xFF) * 3 / 4,
                        0,
                        s[3582 + var4] * 3 / 4,
                        (-s[4094 + var4] + var8 * 48) * 3 / 4,
                        20
                     );
                     var1.drawRegion(
                        this.f[4],
                        (B[300] >> 24 & 0xFF) * 3 / 4,
                        (B[300] >> 16 & 0xFF) * 3 / 4,
                        (B[300] >> 8 & 0xFF) * 3 / 4,
                        (B[300] & 0xFF) * 3 / 4,
                        0,
                        (s[3582 + var4] + 176) * 3 / 4,
                        (-s[4094 + var4] + var8 * 48) * 3 / 4,
                        20
                     );
                  }
                  break;
               case 3:
                  for (int var3 = 0; var3 < 4 - s[7166 + var4]; var3++) {
                     for (int var7 = 0; var7 < 6; var7++) {
                        var1.drawRegion(
                           this.f[4],
                           (B[308 - var3] >> 24 & 0xFF) * 3 / 4,
                           (B[308 - var3] >> 16 & 0xFF) * 3 / 4,
                           (B[308 - var3] >> 8 & 0xFF) * 3 / 4,
                           (B[308 - var3] & 0xFF) * 3 / 4,
                           0,
                           (s[3582 + var4] + var7 * 48) * 3 / 4,
                           (s[4094 + var4] + 48 - var3 * 16) * 3 / 4,
                           20
                        );
                        var1.drawRegion(
                           this.f[4],
                           (B[313 + var3] >> 24 & 0xFF) * 3 / 4,
                           (B[313 + var3] >> 16 & 0xFF) * 3 / 4,
                           (B[313 + var3] >> 8 & 0xFF) * 3 / 4,
                           (B[313 + var3] & 0xFF) * 3 / 4,
                           0,
                           (s[3582 + var4] + var7 * 48) * 3 / 4,
                           (s[4094 + var4] + 160 + var3 * 16) * 3 / 4,
                           20
                        );
                     }
                  }
                  break;
               case 4:
                  for (int var2 = 0; var2 < 6; var2++) {
                     var1.drawRegion(
                        this.f[4],
                        (B[295] >> 24 & 0xFF) * 3 / 4,
                        (B[295] >> 16 & 0xFF) * 3 / 4,
                        (B[295] >> 8 & 0xFF) * 3 / 4,
                        (B[295] & 0xFF) * 3 / 4,
                        0,
                        (-s[3582 + var4] + var2 * 48) * 3 / 4,
                        0,
                        20
                     );
                     var1.drawRegion(
                        this.f[4],
                        (B[296] >> 24 & 0xFF) * 3 / 4,
                        (B[296] >> 16 & 0xFF) * 3 / 4,
                        (B[296] >> 8 & 0xFF) * 3 / 4,
                        (B[296] & 0xFF) * 3 / 4,
                        0,
                        (-s[3582 + var4] + var2 * 48) * 3 / 4,
                        120,
                        20
                     );
                  }
                  break;
               case 5:
                  var1.setColor(16777215);
                  var1.fillRect((120 - s[3582 + var4]) * 3 / 4, 0, s[3582 + var4] * 2 * 3 / 4, 168);
            }

            s[2558 + var4] = s[55];
            s[55] = var4;
            var4 = var5;
         }

         s[2028 + var6] = -1;
      }
   }

   b(GradiusNeo var1) {
      super(false);

      try {
         this.w = var1;
         this.setFullScreenMode(true);
         z = this.getWidth();
         A = this.getHeight();
         if (A < z) {
            A = z;
         }

         s[7] = (z - 180) / 2;
         s[8] = (A - 180) / 2;
         s[9729] = 20;
         s[9727] = 18;
         s[9726] = 16;
         s[9728] = 14;
         s[9730] = 12;
         s[2017] = 2;
         s[2018] = 2;
         s[2019] = 64;
         s[2020] = 64;
         s[2021] = 4;
         s[2022] = 32;
         s[2023] = 4;
         s[2024] = 32;
         s[2025] = 32768;
         s[2026] = 131072;
         s[2027] = 8192;
         s[9771] = 40000;
         s[9772] = 55000;
         s[9773] = 70000;
         s[9774] = 35000;
         s[9775] = 200000;
         s[9781] = 15;
         s[9782] = 18;
         s[9783] = 21;
         s[9784] = 24;
         s[9785] = 27;
         s[9786] = 12;
         s[9787] = 30;
         s[9788] = 33;
         s[9789] = 36;
         b = 206;
      } catch (Throwable var3) {
      }
   }

   public final void run() {
      try {
         while (this.m) {
            this.g++;
            u[0] = System.currentTimeMillis();
            this.repaint();
            this.serviceRepaints();
            this.k();
            this.j();
            this.l();
            if (b != 18 && b != 19 && b != 15) {
               this.h = System.currentTimeMillis() - u[0];
               if (this.h < 100L && this.h > 0L) {
                  try {
                     Thread.sleep(100L - this.h);
                  } catch (Throwable var2) {
                  }
               }
            }
         }

         this.w.destroyApp(false);
         this.w.notifyDestroyed();
      } catch (Throwable var3) {
         a.a("main loop error " + var3, 1);
      }
   }

   private void c(Graphics var1) {
      int var2 = 240 + s[8] + 14 - 5;
      var1.translate(-var1.getTranslateX(), -var1.getTranslateY());
      var1.setClip(0, 0, this.getWidth(), this.getHeight());
      var1.setColor(0);
      var1.fillRect(0, var2, z, A);
      this.a(var1, this.F, s[7], var2);
      this.a(var1, this.G, 240 - this.G.length() * 14 + s[7] + -3, var2);
   }

   private void a(int var1, int var2) {
      this.F = " ";
      this.G = " ";
      this.F = E[var1].getLabel();
      this.G = E[var2].getLabel();
   }

   private static int b(int var0, int var1) {
      var0 = s[1126] - var0;

      for (var1 = s[1143] - var1; (var1 + 8 | 8 - var1) < 0; var1 /= 2) {
         var0 /= 2;
      }

      if (0 <= var0) {
         while (8 <= var0) {
            var0 /= 2;
            var1 /= 2;
         }

         return 0 <= var1 ? s[327 + var0 + var1 * 8] : 32 - s[327 + var0 - var1 * 8];
      } else {
         while (-8 >= var0) {
            var0 /= 2;
            var1 /= 2;
         }

         return 0 <= var1 ? 64 - s[327 - var0 + var1 * 8] : 32 + s[327 - var0 - var1 * 8];
      }
   }

   private static int a(int var0, int var1, int var2) {
      int var3;
      if ((var3 = b(var0 >> 4, var1 >> 4) - var2) > 32) {
         var3 -= 64;
      }

      if (var3 < -32) {
         var3 += 64;
      }

      if (var3 == 0) {
         return var2;
      } else {
         return var3 > 0 ? ++var2 % 64 : (var2 + 64 - 1) % 64;
      }
   }

   private static int b(int var0, int var1, int var2) {
      return (s[5630 + var0] = s[5630 + var0] + s[455 + var1] * var2) >> 4;
   }

   private static int c(int var0, int var1, int var2) {
      return (s[6142 + var0] = s[6142 + var0] + s[471 + var1] * var2) >> 4;
   }

   private static void e() {
      if (2 <= s[23]) {
         s[25] = s[24];
         s[25] = s[25] + (s[59] - 5) / 2;
         if (s[61] != 0) {
            s[25] = s[25] + 2;
         }

         if (s[60] >= 8) {
            s[25] = s[25] + 4;
         } else if (s[60] >= 1) {
            s[25]++;
         }

         s[25] = s[25] + s[65];
         if (s[62] > 0) {
            s[25] = s[25] + 4;
         }
      }

      if (32 < s[25]) {
         s[25] = 32;
      }
   }

   private void a(Graphics var1, int var2, int var3, int var4, int var5) {
      int var6 = 0;

      while (var6 < var3) {
         if (s[599 + var2 + var6] >= 0) {
            var1.drawRegion(
               this.f[0],
               (B[s[599 + var2 + var6]] >> 24 & 0xFF) * 3 / 4,
               (B[s[599 + var2 + var6]] >> 16 & 0xFF) * 3 / 4,
               (B[s[599 + var2 + var6]] >> 8 & 0xFF) * 3 / 4,
               (B[s[599 + var2 + var6]] & 0xFF) * 3 / 4,
               0,
               (var4 - 2) * 3 / 4,
               (var5 - 2) * 3 / 4,
               20
            );
         }

         var6++;
         var4 += 14;
      }
   }

   private void a(Graphics var1, String var2, int var3, int var4) {
      int var5 = 0;
      int var7 = 0;

      while (var7 < var2.length()) {
         var5 = 0;
         char var6;
         if ((var6 = var2.charAt(var7)) >= 'A' && var6 <= 'Z') {
            var5 = var6 - 'A' + 14;
         }

         if (var6 >= '0' && var6 <= '9') {
            var5 = var6 - '0' + 4;
         }

         if (var6 == '*') {
            var5 = 40;
         }

         if (var6 == '#') {
            var5 = 41;
         }

         if (var6 == '-') {
            var5 = 42;
         }

         if (var5 != 0) {
            var1.drawRegion(
               this.f[0],
               (B[var5] >> 24 & 0xFF) * 3 / 4,
               (B[var5] >> 16 & 0xFF) * 3 / 4,
               (B[var5] >> 8 & 0xFF) * 3 / 4,
               (B[var5] & 0xFF) * 3 / 4,
               0,
               (var3 - 2) * 3 / 4,
               (var4 - 2) * 3 / 4,
               20
            );
         }

         var7++;
         var3 += 14;
      }
   }

   private void a(Graphics var1, int var2, int var3, int var4, int var5, int var6) {
      var3 = var4 + (var3 - 1) * 14;

      do {
         var1.drawRegion(
            this.f[0],
            (B[var2 % 10 + var6] >> 24 & 0xFF) * 3 / 4,
            (B[var2 % 10 + var6] >> 16 & 0xFF) * 3 / 4,
            (B[var2 % 10 + var6] >> 8 & 0xFF) * 3 / 4,
            (B[var2 % 10 + var6] & 0xFF) * 3 / 4,
            0,
            (var3 - 2) * 3 / 4,
            (var5 - 2) * 3 / 4,
            20
         );
         var2 /= 10;
         var3 -= 14;
      } while ((-var2 & var4 - var3 - 14) < 0);
   }

   private void a(Graphics var1, int var2, int var3) {
      var1.drawRegion(
         this.f[0],
         (B[42] >> 24 & 0xFF) * 3 / 4,
         (B[42] >> 16 & 0xFF) * 3 / 4,
         (B[42] >> 8 & 0xFF) * 3 / 4,
         (B[42] & 0xFF) * 3 / 4,
         0,
         40,
         (var3 - 2) * 3 / 4,
         20
      );
      var1.drawRegion(
         this.f[0],
         (B[42] >> 24 & 0xFF) * 3 / 4,
         (B[42] >> 16 & 0xFF) * 3 / 4,
         (B[42] >> 8 & 0xFF) * 3 / 4,
         (B[42] & 0xFF) * 3 / 4,
         0,
         124,
         (var3 - 2) * 3 / 4,
         20
      );
      if (var2 == 0) {
         this.a(var1, 135 + var2 * 7, 7, 70, var3);
      } else if (var2 == 1) {
         this.a(var1, 135 + var2 * 7, 7, 49, var3);
      } else if (var2 == 2) {
         this.a(var1, 135 + var2 * 7, 7, 63, var3);
      } else {
         if (var2 == 3) {
            this.a(var1, 135 + var2 * 7, 7, 49, var3);
         }
      }
   }

   private static void f() {
      if (s[65] >= 4 && s[60] >= 8) {
         switch (s[81]) {
            case 0:
               s[60] = 8;
               break;
            case 1:
               s[60] = 16;
               break;
            case 2:
               s[60] = 17;
               a[6] = false;
               s[64] = 48;
               break;
            case 3:
               s[60] = 10;
               break;
            case 4:
               s[60] = 18;
               break;
            case 5:
               s[60] = 11;
               break;
            case 6:
               s[60] = 19;
         }
      } else {
         if (s[60] >= 8) {
            s[60] = 8;
         }
      }
   }

   private void a(String var1) {
      try {
         v = this.getClass().getResourceAsStream("/" + var1);
         v.read(y);
         v.close();
      } catch (Throwable var3) {
      }

      System.gc();
   }

   public final void a() {
      a[2] = false;
      a[3] = false;
      this.m();
   }

   private static void a(int var0) {
      c = var0;
      a[2] = true;
      s[29] = 0;
   }

   private static void b(int var0) {
      if (!a[3] || s[28] < var0) {
         s[28] = var0;
      }

      a[3] = true;
      s[30] = 0;
   }

   private static int a(int var0, int var1, int var2, int var3) {
      int var4;
      if ((var4 = s[55]) < 0) {
         return -1;
      } else {
         s[55] = s[2558 + var4];
         s[2046 + var4] = -1;
         s[2558 + var4] = s[56];
         if (s[56] != -1) {
            s[2046 + s[56]] = var4;
         }

         s[56] = var4;
         s[3582 + var4] = var1;
         s[4094 + var4] = var2;
         s[5630 + var4] = var1 << 4;
         s[6142 + var4] = var2 << 4;
         s[3070 + var4] = var0;
         s[7166 + var4] = var3 & 0xFF;
         s[7678 + var4] = var3 >> 8 & 0xFF;
         s[8190 + var4] = var3 >> 16 & 0xFF;
         s[8702 + var4] = var3 >> 24;
         s[6654 + var4] = 0;
         s[9214 + var4] = 1;
         return var4;
      }
   }

   private static int b(int var0, int var1, int var2, int var3) {
      int var4;
      if ((var4 = s[55]) < 0) {
         return -1;
      } else {
         s[55] = s[2558 + var4];
         s[2046 + var4] = -1;
         s[2558 + var4] = s[57];
         if (s[57] != -1) {
            s[2046 + s[57]] = var4;
         }

         s[57] = var4;
         s[3582 + var4] = var1;
         s[4094 + var4] = var2;
         s[5630 + var4] = var1 << 4;
         s[6142 + var4] = var2 << 4;
         s[3070 + var4] = var0;
         s[7166 + var4] = var3 & 0xFF;
         s[7678 + var4] = var3 >> 8 & 0xFF;
         s[8190 + var4] = var3 >> 16 & 0xFF;
         s[8702 + var4] = var3 >> 24;
         s[6654 + var4] = 0;
         s[9214 + var4] = 1;
         return var4;
      }
   }

   private static void c(int var0) {
      int var1 = s[2046 + var0];
      int var2 = s[2558 + var0];
      if (var1 != -1) {
         s[2558 + var1] = var2;
      } else {
         s[56] = var2;
      }

      if (var2 != -1) {
         s[2046 + var2] = var1;
      }

      s[2558 + var0] = s[55];
      s[55] = var0;
      J++;
   }

   private static void d(int var0) {
      int var1 = s[2046 + var0];
      int var2 = s[2558 + var0];
      if (var1 != -1) {
         s[2558 + var1] = var2;
      } else {
         s[57] = var2;
      }

      if (var2 != -1) {
         s[2046 + var2] = var1;
      }

      s[2558 + var0] = s[55];
      s[55] = var0;
      J++;
   }

   private static int a(int var0, int var1, int var2, int var3, int var4, int var5) {
      int var6;
      if ((var6 = s[55]) < 0) {
         return -1;
      } else {
         s[55] = s[2558 + var6];
         s[2558 + var6] = s[2028 + var3];
         s[2028 + var3] = var6;
         s[3070 + var6] = var0;
         s[3582 + var6] = var1;
         s[4094 + var6] = var2;
         s[7166 + var6] = var4;
         if (var0 == 0) {
            s[7678 + var6] = (var5 & 0xFF0000) >> 16;
            s[8190 + var6] = (var5 & 0xFF00) >> 8;
            s[8702 + var6] = var5 & 0xFF;
         }

         return var6;
      }
   }

   private static int c(int var0, int var1) {
      var0 += 8;
      var1 += 8;
      if (s[36] != 224) {
         if ((240 - var0 | var0) < 0) {
            return 0;
         }
      } else if ((240 - var0 | 224 - var1 | var0 | var1) < 0) {
         return 0;
      }

      return s[1265 + (s[54] + var1) / 16 * 16 + (s[52] + var0) / 16 % 16] != 0 ? -1 : 0;
   }

   private static boolean b(int var0, int var1, int var2, int var3, int var4, int var5) {
      s[58] = a(var0, var1, var2, var3, var4);
      if (s[58] == 0) {
         return false;
      } else if ((s[9214 + var0] = s[9214 + var0] - s[58]) > 0) {
         return false;
      } else {
         if (var5 == 20) {
            a(19, var1 + (var3 - 16) / 2, var2 + (var4 - 16) / 2, 0);
            a(20, var1 + (var3 - 16) / 2, var2 + (var4 - 16) / 2, (var3 - 16) / 2 << 16 | (var4 - 16) / 2 << 8 | 5);
            s[16] = s[16] + 1000;
            b(3);
         } else if (var5 == 19) {
            a(var5, var1 + (var3 - 16) / 2, var2 + (var4 - 16) / 2, 0);
            s[16] = s[16] + 1000;
            b(3);
         } else if (var5 >= 18) {
            a(var5, var1 + (var3 - 16) / 2, var2 + (var4 - 16) / 2, 0);
            s[16] = s[16] + 500;
            b(3);
         } else if (var5 != 10) {
            if (s[32] >= 2 || s[32] == 1 && (s[9] & 1) != 0) {
               a(21, var1 + (var3 - 16) / 2, var2 + (var4 - 16) / 2, 0);
            }

            a(var5, var1 + (var3 - 16) / 2, var2 + (var4 - 16) / 2, 0);
            s[16] = s[16] + 100;
            if (s[3070 + var0] <= 58) {
               b(0);
            } else {
               b(2);
            }
         }

         if (var5 > 10) {
            c(var0);
            return true;
         } else {
            return true;
         }
      }
   }

   private static int a(int var0, int var1, int var2, int var3, int var4) {
      int var6 = 0;
      if (s[62] > 0 && s[1126] + 12 - 6 < var1 + var3 && var1 < s[1126] + 12 + 16 + 8 && s[1143] + 6 - 6 < var2 + var4 && var2 < s[1143] + 8 + 8) {
         s[62]--;
         return 1;
      } else {
         if (s[76] >= 0 && s[1126] + 12 < var1 + var3 && var1 < s[1126] + 12 + 16 && s[1143] + 6 < var2 + var4 && var2 < s[1143] + 8) {
            s[76] = -52;
            var6++;
         }

         if (s[84] >= 2) {
            for (int var5 = 1; var5 <= s[65]; var5++) {
               if (s[1160 + var5] + 8 < var1 + var3 && var1 < s[1160 + var5] + 8 + 16 && s[1165 + var5] < var2 + var4 && var2 < s[1165 + var5] + 16) {
                  var6++;
               }
            }

            if (s[3070 + var0] < 37) {
               return var6;
            }
         }

         if (s[3070 + var0] < 37) {
            return 0;
         } else {
            for (int var8 = 0; var8 < 20; var8++) {
               if (s[1245 + var8] >= 0) {
                  if (s[1245 + var8] != 8 && s[1245 + var8] != 9) {
                     if (s[1245 + var8] == 10) {
                        if (s[78] != var0) {
                           if (s[1205 + var8] >= 2) {
                              if (s[1126] + 40 < var1 + var3 && var1 < 240 && s[1143] - 16 < var2 + var4 && var2 < s[1143] + 16 + 16) {
                                 if (s[3070 + var0] >= 82) {
                                    if (var1 < s[1126] + 64) {
                                       s[77] = s[1126] + 64;
                                    } else if (var1 < s[77]) {
                                       s[77] = var1;
                                    }
                                 }

                                 if (var1 < s[1185 + var8] + 16) {
                                    var6 += 4;
                                    s[78] = var0;
                                 }

                                 if (s[1185 + var8] < 240) {
                                    a(11, s[1185 + var8] - 8, s[1143], 0);
                                 }
                              }
                           } else if (s[1205 + var8] >= 0
                              && s[1126] + 40 < var1 + var3
                              && var1 < s[1126] + 72 + 16
                              && s[1143] - 16 < var2 + var4
                              && var2 < s[1143] + 16 + 16) {
                              var6 += 4;
                              s[78] = var0;
                           }
                        }
                     } else if (12 <= s[1245 + var8] && s[1245 + var8] <= 15) {
                        if (s[1185 + var8] < var1 + var3
                           && var1 < s[1185 + var8] + (s[1245 + var8] - 11) * 16
                           && s[1205 + var8] - 8 < var2 + var4
                           && var2 < s[1205 + var8] + 8 + 16) {
                           s[1245 + var8]--;
                           var6++;
                        }
                     } else if (s[1245 + var8] == 19) {
                        if (s[1185 + var8] < var1 + var3
                           && var1 < s[1185 + var8] + 16
                           && s[1205 + var8] - 16 * s[1225 + var8] < var2 + var4
                           && var2 < s[1205 + var8] + 16 + 16 * s[1225 + var8]) {
                           var6++;
                        }
                     } else if (s[1245 + var8] == 7) {
                        if (s[1225 + var8] > 0
                           && s[1185 + var8] < var1 + var3
                           && var1 < s[1185 + var8] + 32
                           && s[1205 + var8] + 18 - 6 * s[1225 + var8] < var2 + var4
                           && var2 < s[1205 + var8] + 12 + 12 * s[1225 + var8]) {
                           var6++;
                           s[1245 + var8] = -1;
                        }
                     } else if (s[1185 + var8] - 8 < var1 + var3 && var1 < s[1185 + var8] + 24 && s[1205 + var8] < var2 + var4 && var2 < s[1205 + var8] + 16) {
                        if (s[1245 + var8] >= 20) {
                           var6 += 2;
                        } else {
                           var6++;
                        }

                        s[1245 + var8] = -1;
                     }
                  } else if (s[1205 + var8] < var1 + var3 && var1 < s[1185 + var8] + 1 && s[1165 + var8 / 4] < var2 + var4 && var2 < s[1165 + var8 / 4] + 16) {
                     if (s[3070 + var0] >= 82) {
                        if (var1 < s[1205 + var8]) {
                           s[1185 + var8] = s[1160 + var8 / 4] + 24;
                        } else {
                           s[1185 + var8] = var1;
                        }

                        a(13, s[1185 + var8] - 8, s[1165 + var8 / 4], 0);
                        if (++s[1245 + var8] > 9) {
                           s[1245 + var8] = -1;
                        }
                     }

                     var6++;
                  }
               }
            }

            return var6;
         }
      }
   }

   private static void e(int var0) {
      try {
         switch (var0) {
            case 0:
               H[0] = (byte)s[23];
               H[0] = (byte)(H[0] | (byte)(o << 4));
               H[1] = (byte)s[21];
               H[2] = (byte)s[22];
               H[3] = (byte)s[35];
               H[4] = (byte)s[33];
               H[5] = (byte)s[100];
               H[6] = (byte)(s[97] >> 24);
               H[7] = (byte)(s[97] >> 16);
               H[8] = (byte)(s[97] >> 8);
               H[9] = (byte)s[97];
               H[10] = (byte)s[101];
               H[11] = (byte)(s[98] >> 24);
               H[12] = (byte)(s[98] >> 16);
               H[13] = (byte)(s[98] >> 8);
               H[14] = (byte)s[98];
               H[15] = (byte)s[102];
               H[16] = (byte)(s[99] >> 24);
               H[17] = (byte)(s[99] >> 16);
               H[18] = (byte)(s[99] >> 8);
               H[19] = (byte)s[99];
               break;
            case 20:
               H[20] = (byte)s[31];
               H[21] = (byte)s[32];
               H[22] = (byte)s[9];
               H[23] = (byte)s[72];
               H[24] = (byte)(s[16] >> 24);
               H[25] = (byte)(s[16] >> 16);
               H[26] = (byte)(s[16] >> 8);
               H[27] = (byte)s[16];
               H[28] = (byte)(s[18] >> 24);
               H[29] = (byte)(s[18] >> 16);
               H[30] = (byte)(s[18] >> 8);
               H[31] = (byte)s[18];
               H[32] = (byte)s[17];
               H[33] = (byte)s[19];
               H[34] = (byte)s[79];
               H[35] = (byte)s[80];
               H[36] = (byte)s[27];
               H[37] = (byte)s[59];
               H[38] = (byte)s[60];
               H[39] = (byte)s[61];
               H[40] = (byte)s[65];
               H[41] = (byte)s[62];
               H[42] = (byte)s[81];
               H[43] = (byte)s[1120];
               H[44] = (byte)s[1121];
               H[45] = (byte)s[1122];
               H[46] = (byte)s[1123];
               H[47] = (byte)s[1124];
               H[48] = (byte)s[1125];
               H[49] = (byte)s[73];
               H[50] = (byte)s[74];
               H[51] = (byte)s[75];
               break;
            case 52:
               H[52] = (byte)s[66];
               H[53] = (byte)s[67];
               H[54] = (byte)s[68];
               H[55] = (byte)s[69];
               H[56] = (byte)s[70];
               H[57] = (byte)s[71];
               H[58] = (byte)(s[9776] >> 24);
               H[59] = (byte)(s[9776] >> 16);
               H[60] = (byte)(s[9776] >> 8);
               H[61] = (byte)s[9776];
               H[62] = (byte)(s[9777] >> 24);
               H[63] = (byte)(s[9777] >> 16);
               H[64] = (byte)(s[9777] >> 8);
               H[65] = (byte)s[9777];
               H[66] = (byte)(s[9778] >> 24);
               H[67] = (byte)(s[9778] >> 16);
               H[68] = (byte)(s[9778] >> 8);
               H[69] = (byte)s[9778];
               H[70] = (byte)(s[9779] >> 24);
               H[71] = (byte)(s[9779] >> 16);
               H[72] = (byte)(s[9779] >> 8);
               H[73] = (byte)s[9779];
               H[74] = (byte)(s[9780] >> 24);
               H[75] = (byte)(s[9780] >> 16);
               H[76] = (byte)(s[9780] >> 8);
               H[77] = (byte)s[9780];
         }

         x = RecordStore.openRecordStore("R", true);
         x.setRecord(1, H, 0, 78);
         x.closeRecordStore();
      } catch (Throwable var2) {
      }
   }

   private static void f(int var0) {
      switch (var0) {
         case 0:
            s[23] = H[0] & 15;
            o = (H[0] & 240) >> 4;
            s[21] = H[1];
            s[22] = H[2];
            s[35] = H[3];
            s[33] = H[4];
            s[100] = H[5];
            s[97] = H[6] << 24 | (H[7] & 255) << 16 | (H[8] & 255) << 8 | H[9] & 255;
            s[101] = H[10];
            s[98] = H[11] << 24 | (H[12] & 255) << 16 | (H[13] & 255) << 8 | H[14] & 255;
            s[102] = H[15];
            s[99] = H[16] << 24 | (H[17] & 255) << 16 | (H[18] & 255) << 8 | H[19] & 255;
            return;
         case 20:
            s[31] = H[20];
            s[32] = H[21];
            s[9] = H[22] & 255;
            s[72] = H[23];
            s[16] = H[24] << 24 | (H[25] & 255) << 16 | (H[26] & 255) << 8 | H[27] & 255;
            s[18] = H[28] << 24 | (H[29] & 255) << 16 | (H[30] & 255) << 8 | H[31] & 255;
            s[17] = H[32];
            s[19] = H[33];
            s[79] = H[34];
            s[80] = H[35];
            s[27] = H[36];
            s[59] = H[37];
            s[60] = H[38];
            s[61] = H[39];
            s[65] = H[40];
            s[62] = H[41];
            s[81] = H[42];
            s[1120] = H[43];
            s[1121] = H[44];
            s[1122] = H[45];
            s[1123] = H[46];
            s[1124] = H[47];
            s[1125] = H[48];
            s[73] = H[49];
            s[74] = H[50];
            s[75] = H[51];
            return;
         case 52:
            s[66] = H[52];
            s[67] = H[53];
            s[68] = H[54];
            s[69] = H[55];
            s[70] = H[56];
            s[71] = H[57];
            s[9776] = H[58] << 24 | (H[59] & 255) << 16 | (H[60] & 255) << 8 | H[61] & 255;
            s[9777] = H[62] << 24 | (H[63] & 255) << 16 | (H[64] & 255) << 8 | H[65] & 255;
            s[9778] = H[66] << 24 | (H[67] & 255) << 16 | (H[68] & 255) << 8 | H[69] & 255;
            s[9779] = H[70] << 24 | (H[71] & 255) << 16 | (H[72] & 255) << 8 | H[73] & 255;
            s[9780] = H[74] << 24 | (H[75] & 255) << 16 | (H[76] & 255) << 8 | H[77] & 255;
      }
   }

   private int g(int var1) {
      int var2 = 0;
      if (var1 == -10) {
         return 0;
      } else {
         switch (var1) {
            case -8:
               var2 = 0 | 33554432;
               break;
            case -7:
               var2 = 0 | 8388608;
               break;
            case -6:
               var2 = 0 | 4194304;
               break;
            case 35:
               var2 = 0 | 2097152;
               break;
            case 42:
               var2 = 0 | 1048576;
               break;
            case 48:
               var2 = 1024;
               break;
            case 49:
               var2 = 2048;
               break;
            case 50:
               var2 = 4096;
               break;
            case 51:
               var2 = 8192;
               break;
            case 52:
               var2 = 16384;
               break;
            case 53:
               var2 = 0 | '耀';
               break;
            case 54:
               var2 = 0 | 65536;
               break;
            case 55:
               var2 = 0 | 131072;
               break;
            case 56:
               var2 = 0 | 262144;
               break;
            case 57:
               var2 = 0 | 524288;
               break;
            default:
               try {
                  switch (this.getGameAction(var1)) {
                     case 1:
                        var2 = 2;
                        break;
                     case 2:
                        var2 = 4;
                     case 3:
                     case 4:
                     case 7:
                     default:
                        break;
                     case 5:
                        var2 = 32;
                        break;
                     case 6:
                        var2 = 64;
                        break;
                     case 8:
                        var2 = 256;
                  }
               } catch (IllegalArgumentException var4) {
               }
         }

         return var2;
      }
   }

   protected final void keyPressed(int var1) {
      if (var1 != -10) {
         s[13] = s[13] | this.g(var1);
         this.i = this.i | s[13];
      }
   }

   protected final void keyReleased(int var1) {
      if (var1 != -10) {
         this.j = this.j | this.g(var1);
      }
   }

   public final void hideNotify() {
      this.b();
   }

   public final void showNotify() {
      this.c();
   }

   private void d(Graphics var1) {
      if (this.L == null) {
         this.L = a.a(172, this.K, var1.getFont());
      }

      var1.setColor(65535);
      var1.setFont(Font.getFont(64, 0, 8));
      var1.drawString("Instructions", 90, 2, 17);
      var1.setColor(16777215);

      for (int var2 = 0; var2 < 8; var2++) {
         var1.drawString(this.L[this.l + var2], 93, (3 + 26 * (var2 + 1)) * 3 / 4, 17);
      }

      a.a(var1, 0, 21, 156, 7, this.l * 19, this.L.length * 19);
      if ((s[11] & 6) != 0) {
         this.l--;
      } else if ((s[11] & 96) != 0) {
         this.l++;
      }

      if (this.l < 0) {
         this.l = 0;
      }

      if (this.l > this.L.length - 8) {
         this.l = this.L.length - 8;
      }

      if ((s[12] & 8388608) != 0) {
         b = this.k;
      }
   }

   private void e(Graphics var1) {
      if (this.N == null) {
         String var2 = this.w.getAppProperty("MIDlet-Version");
         this.N = a.a(
            172,
            "Gradius Neo\n\n© 2004 2006 KONAMI\nAll Rights Reserved.\n\nPublished by Konami Digital Entertainment\n\nv"
               + var2
               + "\n\nCheck out more games at,\nwww.konami.com/mo\n\nSupport: mobilesupport@konami.com",
            var1.getFont()
         );
      }

      var1.setColor(65535);
      var1.drawString("About", 90, 2, 17);
      var1.setColor(16777215);

      for (int var3 = 0; var3 < 8; var3++) {
         var1.drawString(this.N[this.l + var3], 93, (3 + 26 * (var3 + 1)) * 3 / 4, 17);
      }

      a.a(var1, 0, 21, 156, 7, this.l * 19, this.N.length * 19);
      if ((s[11] & 6) != 0) {
         this.l--;
      } else if ((s[11] & 96) != 0) {
         this.l++;
      }

      if (this.l < 0) {
         this.l = 0;
      }

      if (this.l > this.N.length - 8) {
         this.l = this.N.length - 8;
      }

      if ((s[12] & 8388608) != 0) {
         b = 4;
      }
   }

   private void f(Graphics var1) {
      this.a(var1, "EXIT", 92, 96);
      this.a(var1, "YES", 92, 112);
      this.a(var1, "NO", 92, 128);
      if ((s[12] & 2) != 0) {
         s[0]++;
      } else if ((s[12] & 64) != 0) {
         s[0]++;
      }

      s[0] = s[0] % 2;
      var1.drawRegion(
         this.f[0],
         (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4,
         (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4,
         (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4,
         (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4,
         0,
         57,
         (96 + (s[0] + 1) * 16 - 2) * 3 / 4,
         20
      );
   }

   private void g(Graphics var1) {
      this.f(var1);
      if ((s[12] & 8388608) != 0) {
         b = 4;
      }

      if ((s[12] & 256) != 0) {
         switch (s[0]) {
            case 0:
               this.a(6, 6);
               b = 999;
               return;
            case 1:
               b = 5;
         }
      }
   }

   private void h(Graphics var1) {
      this.f(var1);
      if ((s[12] & 8388608) != 0) {
         b = 205;
      }

      if ((s[12] & 256) != 0) {
         switch (s[0]) {
            case 0:
               if (2 <= s[23]) {
                  if (s[99] < s[16]) {
                     s[99] = s[16];
                     s[102] = s[32] * 5 + s[31];
                  }

                  if (s[98] < s[16]) {
                     s[99] = s[98];
                     s[98] = s[16];
                     s[102] = s[101];
                     s[101] = s[32] * 5 + s[31];
                  }

                  if (s[97] < s[16]) {
                     s[98] = s[97];
                     s[97] = s[16];
                     s[101] = s[100];
                     s[100] = s[32] * 5 + s[31];
                  }

                  e(0);
               }

               b = 4;
               return;
            case 1:
               b = 205;
         }
      }
   }

   private void i(Graphics var1) {
      this.a(var1, 219, 5, 85, 80);
      this.a(var1, "RESUME", 43, 96);
      String[] var10 = new String[]{"NONE", "BGM", "SFX"};
      this.a(var1, "SOUND - " + var10[o], 43, 112);
      this.a(var1, "HELP", 43, 128);
      this.a(var1, "EXIT", 43, 144);
      if ((s[12] & 2) != 0) {
         s[0] = s[0] + 3;
      } else if ((s[12] & 64) != 0) {
         s[0]++;
      }

      s[0] = s[0] % 4;
      var1.drawRegion(
         this.f[0],
         (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4,
         (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4,
         (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4,
         (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4,
         0,
         20,
         (96 + s[0] * 16 - 2) * 3 / 4,
         20
      );
      if ((s[12] & 8388608) != 0) {
         a[4] = false;
         this.a(4, 5);
         var1.setColor(0);
         var1.fillRect(0, 0, 180, 180);
      }

      if ((s[12] & 256) != 0) {
         s[12] = 0;
         if (s[0] == 0) {
            a[4] = false;
            this.a(4, 5);
            var1.setColor(0);
            var1.fillRect(0, 0, 180, 180);
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

   private void g() {
      int var5 = s[56];

      while (var5 != -1) {
         int var6 = s[2558 + var5];
         int var7 = s[3582 + var5];
         int var8 = s[4094 + var5];
         int var9 = s[6654 + var5];
         I = -1;
         int var10 = (I + 1) / 2;
         J = 0;
         if (s[36] > 240) {
            if ((var7 + 48 | 272 - var7) < 0) {
               c(var5);
               var5 = var6;
               continue;
            }
         } else if ((var7 + 48 | 272 - var7 | var8 + 48 | 264 - var8) < 0 && s[3070 + var5] < 92) {
            c(var5);
            var5 = var6;
            continue;
         }

         switch (s[3070 + var5]) {
            case 3:
               if (var9 == 0) {
                  if (s[7678 + var5] != 0) {
                     s[8702 + var5] = s[7678 + var5];
                  } else {
                     s[8702 + var5] = 50;
                  }
               }

               if (var9 <= 50 && c >= 0) {
                  if (s[0] > 100) {
                     s[0] = 100;
                  }

                  if (var9 >= 50) {
                     this.a();
                  }
               }

               if (var9 >= s[8702 + var5]) {
                  this.a();
                  a(s[7166 + var5]);
                  c(var5);
                  var9 = 0;
               }
            case 4:
            case 6:
            case 9:
            case 10:
            case 12:
            case 15:
            case 32:
            case 33:
            case 34:
            case 35:
            case 36:
            case 37:
            case 41:
            case 42:
            case 45:
            case 46:
            case 82:
            case 87:
            case 95:
            case 98:
            case 108:
            case 110:
            case 111:
            case 112:
            case 113:
            default:
               break;
            case 5:
               if (var9 == 0) {
                  if (s[7166 + var5] == 1) {
                     s[41] = 4;
                     s[46] = 0;
                  }
               } else {
                  s[46] = s[46] + (s[7166 + var5] * 2 - 1);
                  if (8 <= s[46]) {
                     c(var5);
                  }

                  if (s[46] < 0) {
                     c(var5);
                     s[41] = 1;
                  }
               }
               break;
            case 7:
               if (var9 == 0) {
                  s[4606 + var5] = 288;
                  s[5118 + var5] = 336;
               } else {
                  if (a[8]) {
                     if (s[7166 + var5] == 0) {
                        s[4606 + var5] = s[4606 + var5] + I * 16 * 9 / 2;
                        if (var9 == 4) {
                           s[7166 + var5]++;
                        } else {
                           s[5118 + var5] = s[5118 + var5] + I * 16 * 7 / 1;
                        }
                     } else if (s[7166 + var5] == 1) {
                        s[4606 + var5] = s[4606 + var5] + I * 16 * 1 / 2;
                        s[5118 + var5] = s[5118 + var5] + I * 16 * 1;
                        if (s[4606 + var5] <= -72) {
                           s[4606 + var5] = 0;
                        }

                        if (s[5118 + var5] <= -48) {
                           s[5118 + var5] = 64;
                        }
                     }
                  } else {
                     s[4606 + var5] = s[4606 + var5] + I * 16 * 1 / 2;
                     s[5118 + var5] = s[5118 + var5] + I * 16 * 1;
                     if (s[4606 + var5] + 48 + 288 <= 0) {
                        c(var5);
                     }
                  }

                  for (int var63 = 0; var63 < 4; var63++) {
                     a(2, s[4606 + var5] + 16 + var63 * 16 * 9 / 2, 160, 15, 351, 0);
                  }

                  for (int var64 = 0; var64 < 3; var64++) {
                     a(0, s[5118 + var5] + 0 + var64 * 16 * 7, 176, 6, 352, 196867);
                  }

                  var7 -= s[43] * I;
               }
               break;
            case 8:
               a(0, 240 - var9 % 9 * 40 + 0, -8, 17, 349, 68357);
               a(0, 240 - var9 % 9 * 40 + 48, -8, 4, 350, 68357);
               if (!a[7] && var9 % 9 == 8) {
                  c(var5);
               }

               var7 -= s[43] * I;
               break;
            case 11:
               int var62;
               if ((var62 = (s[9] - 1) % 6) < 2) {
                  int var32 = 132 + var62 * 2;
                  a(0, var7 - 24, var8 - 24, 9, var32, 263176);
               }

               int var31 = 131 + s[9] % 2 * 2;
               a(0, var7 - 24, var8 - 24, 9, var31, 263176);
               I = 0;
               c(var5);
               break;
            case 13:
               I = 0;
            case 14:
               int var30 = 121 + (s[3070 + var5] - 13) * 2;
               a(1, var7, var8, 16, var30 + var9, 0);
               if (1 <= var9) {
                  c(var5);
               }
               break;
            case 16:
            case 17:
               int var29 = 125 + (s[3070 + var5] - 16) * 3;
               a(1, var7, var8, 16, var29 + var9 / 2, 0);
               if (5 <= var9) {
                  c(var5);
               }
               break;
            case 18:
               a(0, var7 - 8, var8 - 8, 16, 135 + var9 / 2 * 1, 131590);
               if (5 <= var9) {
                  c(var5);
               }
               break;
            case 19:
               a(0, var7 - 16, var8 - 16, 16, 138 + var9 / 2 * 1, 197382);
               if (3 <= var9) {
                  c(var5);
               }
               break;
            case 20:
               int var103 = (int)u[0] / 1000 + s[9] + var5 + var7 + var8;

               for (int var61 = 0; var61 < (var9 + 1) % 4; var61++) {
                  int var28;
                  if ((var28 = 14 + (s[1055 + (var103 + var61 & 63)] & 7) % 5) == 17) {
                     var28++;
                  }

                  a(var28, var7 + s[1055 + (var103 + var61 & 63)] % s[8190 + var5], var8 + s[1055 + (var103 + var61 & 63)] % s[7678 + var5], 0);
               }

               if (var9 >= s[7166 + var5] - 1) {
                  c(var5);
               }
               break;
            case 21:
               if (var9 == 0) {
                  s[7166 + var5] = b(var7, var8);
               }
            case 22:
               if (s[23] == 0) {
                  c(var5);
               } else {
                  a(1, var7, var8, 16, 46 + var9 % 4, 0);
                  if (c(var7, var8 - s[54]) < 0 || a(var5, var7 + 4, var8 + 4, 8, 8) != 0) {
                     c(var5);
                  }

                  var7 = b(var5, s[7166 + var5], 6);
                  var8 = c(var5, s[7166 + var5], 6);
               }
               break;
            case 23:
               int var60 = 0;
               int var4 = s[7166 + var5] - s[7678 + var5] / 2 * s[8190 + var5];

               while (var60 < s[7678 + var5]) {
                  var4 = (var4 + 64) % 64;
                  if (s[8702 + var5] == 1) {
                     a(39, var7, var8, var4);
                  } else {
                     a(22, var7, var8, var4);
                  }

                  var60++;
                  var4 += s[8190 + var5];
               }

               c(var5);
               break;
            case 24:
            case 25:
            case 26:
            case 27:
            case 28:
            case 29:
            case 30:
            case 31:
               I = (s[3070 + var5] - 24) % 2 * 2 - 1;
               s[0] = 16;
               if (s[3070 + var5] <= 25) {
                  s[0] = s[7678 + var5];
               }

               if (30 <= s[3070 + var5]) {
                  a(1, var7, var8, s[0], 271 + (var9 & 1), 0);
                  if (a(var5, var7, var8 + 2, 16, 10) != 0) {
                     c(var5);
                  }
               } else {
                  if (28 <= s[3070 + var5]) {
                     a(1, var7, var8, s[0], 391, 0);
                  } else {
                     a(1, var7, var8, s[0], 269 + (var9 & 1), 0);
                  }

                  if (a(var5, var7, var8 + 6, 16, 4) != 0) {
                     c(var5);
                  }
               }

               int var66;
               var7 = (var66 = var7 + I * s[7166 + var5]) - s[43] * I;
               break;
            case 38:
               if (var9 == 0) {
                  s[7166 + var5] = b(var7, var8);
               }
            case 39:
               if (s[23] == 0) {
                  c(var5);
               } else if (var8 + 16 >= s[54] && s[54] + 224 >= var8) {
                  a(1, var7, var8, 16, 349 + s[7166 + var5] / 4, 0);
                  s[5630 + var5] = s[5630 + var5] + (s[43] * I << 4);
                  if (c(var7, var8 - s[54]) < 0) {
                     c(var5);
                  } else {
                     b(var5, var7 + 4, var8 + 4, 8, 8, 13);
                  }

                  var7 = b(var5, s[7166 + var5], 6);
                  var8 = c(var5, s[7166 + var5], 6);
               } else {
                  c(var5);
               }
               break;
            case 40:
               if (var9 == 0) {
                  s[9214 + var5] = 2 + s[25] / 8;
               }

               a(1, var7, var8, 16, 373 + (var9 & 1), 0);
               b(var5, var7, var8, 16, 16, 16);
               var7 = b(var5, s[7166 + var5], 6);
               var8 = c(var5, s[7166 + var5], 6);
               break;
            case 43:
            case 44:
               I = (var10 = s[3070 + var5] - 43) * 2 - 1;
               if (var9 == 0) {
                  if (I == 1) {
                     var7 = -32;
                  }

                  s[9731 + s[8190 + var5]] = 0;
               }

               if (var9 % (6 - s[25] / 12) == 0) {
                  a(47 + var10, var7, var8, s[8702 + var5] << 24 | s[8190 + var5] << 16 | s[7678 + var5] << 8 | s[7166 + var5]);
               }

               if (var9 >= (6 - s[25] / 12) * (s[7166 + var5] - 1)) {
                  c(var5);
               }

               var7 -= s[43] * I;
               break;
            case 47:
            case 48:
               I = (var10 = s[3070 + var5] - 47) * 2 - 1;
               int var27 = 229 + var10 * 2;
               if (s[8702 + var5] == 1) {
                  var27 = 232 + var10 * 4;
               } else if (s[8702 + var5] == 2) {
                  var27 = 152 + var10 * 8;
               } else if (s[8702 + var5] == 3) {
                  var27 = 180;
               }

               switch (s[7678 + var5]) {
                  case 0:
                     var7 += I * (5 + s[25] / 6);
                     break;
                  case 1:
                     s[0] = s[7678 + var5] - 2;
                     if (var9 == 0) {
                        s[4606 + var5] = 0;
                     }

                     if (s[4606 + var5] == 0) {
                        var7 += I * (5 + s[25] / 6);
                        if ((var10 * 240 - I * 180 - var7 - 16) * I < 0) {
                           s[4606 + var5]++;
                        }
                     } else {
                        if (s[4606 + var5] == 2) {
                           s[5118 + var5] = b(var7, var8);
                           s[5630 + var5] = var7 << 4;
                           s[6142 + var5] = var8 << 4;
                        }

                        if (s[4606 + var5] >= 3) {
                           s[5630 + var5] = s[5630 + var5] + s[455 + s[5118 + var5]] * (5 + s[25] / 6);
                           s[6142 + var5] = s[6142 + var5] + s[471 + s[5118 + var5]] * (5 + s[25] / 6);
                           var7 = s[5630 + var5] >> 4;
                           var8 = s[6142 + var5] >> 4;
                        }

                        s[4606 + var5]++;
                     }
                     break;
                  case 2:
                  case 3:
                     s[0] = s[7678 + var5] - 2;
                     int var84 = s[0] * 2 - 1;
                     if (var9 == 0) {
                        s[4606 + var5] = 0;
                     }

                     if (s[4606 + var5] == 0) {
                        var7 += I * (5 + s[25] / 6);
                        if ((var10 * 240 - I * 60 - var7 - 16) * I < 0) {
                           s[4606 + var5]++;
                        }
                     } else {
                        if ((s[1143] - var8) * var84 < 0) {
                           s[4606 + var5]++;
                        }

                        if (s[4606 + var5] == 1) {
                           var8 += var84 * (5 + s[25] / 6);
                        }

                        var7 -= I * (5 + s[25] / 6);
                     }
                     break;
                  case 4:
                  case 5:
                     s[0] = s[7678 + var5] - 4;
                     int var83 = s[0] * 2 - 1;
                     if (var9 == 0) {
                        s[4606 + var5] = 288;
                     }

                     s[4606 + var5] = s[4606 + var5] - 16;
                     s[5630 + var5] = s[5630 + var5] + I * s[4606 + var5];
                     s[6142 + var5] = s[6142 + var5] + var83 * 32;
                     var7 = s[5630 + var5] >> 4;
                     var8 = s[6142 + var5] >> 4;
                     break;
                  case 6:
                  case 7:
                     s[0] = s[7678 + var5] - 6;
                     int var82 = s[0] * 2 - 1;
                     if (var9 / 16 % 2 != 0) {
                        var82 *= -1;
                     }

                     var8 += var82 * (5 + s[25] / 6 - 1);
                     var7 += I * (5 + s[25] / 6 - 1);
                     break;
                  case 8:
                  case 9:
                     s[0] = s[7678 + var5] - 8;
                     int var81 = s[0] * 2 - 1;
                     int var12;
                     if (var9 / 16 % 2 == 0) {
                        var12 = s[0] * 64 / 2 - var9 % 16 * 2 * I * var81 + 64;
                     } else {
                        var12 = s[0] * 64 / 2 - (16 - var9 % 16) * 2 * I * var81 + 64;
                     }

                     s[5630 + var5] = s[5630 + var5] + s[455 + var12] * (5 + s[25] / 6);
                     s[6142 + var5] = s[6142 + var5] + s[471 + var12] * (5 + s[25] / 6);
                     var7 = s[5630 + var5] >> 4;
                     var8 = s[6142 + var5] >> 4;
               }

               if ((var9 + 1) % (150 - s[25] * 4) == 0) {
                  a(21, var7 + 8, var8, 0);
               }

               a(2, var7, var8, 13, var27 + var9 % 4, 0);
               if (b(var5, var7 + 4, var8, 26, 16, 16) && ++s[9731 + s[8190 + var5]] >= s[7166 + var5]) {
                  a(114, var7 + 8, var8, 0);
               }

               var7 -= s[43] * I;
               break;
            case 49:
            case 50:
            case 51:
            case 52:
            case 53:
            case 54:
               I = (var10 = (s[3070 + var5] - 49) % 2) * 2 - 1;
               int var79 = (s[3070 + var5] - 49) / 2 * 2 - 1;
               int var26 = 152 + var10 * 8;
               if (s[7166 + var5] != 0) {
                  var26 -= 4;
               }

               if (53 <= s[3070 + var5]) {
                  s[5630 + var5] = s[5630 + var5] + s[455 + s[7678 + var5]] * (4 + s[25] / 6);
                  s[6142 + var5] = s[6142 + var5] + s[471 + s[7678 + var5]] * (4 + s[25] / 6);
                  var7 = s[5630 + var5] >> 4;
                  var8 = s[6142 + var5] >> 4;
                  if (s[8190 + var5] <= var9) {
                     s[3070 + var5] = 49;
                     if (var7 < s[1126]) {
                        s[3070 + var5]++;
                     }

                     s[7678 + var5] = 1;
                  }
               } else {
                  if (var9 == 0) {
                     if (I == 1) {
                        var7 = -32;
                     }
                     break;
                  }

                  var7 += I * (4 + s[25] / 6);
                  if (s[7678 + var5] == 1) {
                     var79 = -1;
                     if (var8 < s[1143]) {
                        var79 = 1;
                     }
                  } else {
                     s[0] = -1;
                     if (var9 / 8 % 2 == 0) {
                        s[0] = 1;
                     }

                     var79 *= s[0];
                  }

                  var8 += var79 * (4 + s[25] / 10);
               }

               if ((var9 + 1) % (150 - s[25] * 4) == 0) {
                  a(21, var7 + 8, var8, 0);
               }

               a(2, var7, var8, 13, var26 + var9 % 4, 0);
               if (b(var5, var7 + 4, var8, 26, 16, 16)) {
                  if (s[86] == 2) {
                     s[95]++;
                  }

                  if (s[7166 + var5] != 0) {
                     a(114, var7 + 8, var8, 0);
                  }
               }
               break;
            case 55:
            case 56:
            case 57:
            case 58:
               I = (s[3070 + var5] - 55) % 2 * 2 - 1;
               short var25 = 180;
               if (s[7166 + var5] != 0) {
                  var25 -= 16;
               }

               if (var9 == 0 && s[3070 + var5] <= 56) {
                  s[7678 + var5] = 48;
                  if (I == 1) {
                     var7 = -16;
                     s[5630 + var5] = -256;
                     s[7678 + var5] = 16;
                  }
               } else {
                  if ((var9 + 1) % (150 - s[25] * 4) == 0) {
                     a(21, var7, var8, 0);
                  }

                  s[7678 + var5] = a(s[5630 + var5], s[6142 + var5], s[7678 + var5]);
                  var7 = b(var5, s[7678 + var5], 4 + s[25] / 8);
                  var8 = c(var5, s[7678 + var5], 4 + s[25] / 8);
                  a(1, var7, var8, 13, var25 + (s[7678 + var5] + 2 & 63) / 4, 0);
                  if (b(var5, var7, var8, 16, 16, 16) && s[7166 + var5] != 0) {
                     a(114, var7, var8, 0);
                  }

                  if (s[86] >= 3 && J == 0) {
                     b(0);
                     a(16, var7, var8, 0);
                     c(var5);
                  }
               }
               break;
            case 59:
            case 60:
            case 61:
            case 62:
            case 63:
            case 64:
               I = (s[3070 + var5] - 59) % 2 * 2 - 1;
               int var78 = (s[3070 + var5] - 59) / 2 * 2 - 1;
               if (s[3070 + var5] >= 63) {
                  var78 = (s[3070 + var5] - 63) * 2 - 1;
               }

               byte var72 = 0;
               if ((s[5630 + var5] >> 4) + 16 < s[1126]) {
                  var72 = 1;
               }

               int var24 = 229 + var72 * 2;
               if (s[7166 + var5] != 0) {
                  var24--;
               }

               if (var9 == 0) {
                  s[4606 + var5] = 0;
                  s[9214 + var5] = 8 + s[25] / 2;
                  if (I == 1) {
                     var7 = -32;
                     s[5630 + var5] = -512;
                  }
               } else {
                  if (s[8190 + var5] == 0) {
                     if (s[7678 + var5] == 0) {
                        s[5630 + var5] = s[5630 + var5] + I * 96;
                        s[6142 + var5] = s[6142 + var5] + var78 * (var9 << 4 >> 2);
                        if ((var9 - 1) % (40 - s[25]) == 0) {
                           a(26 + var72, var7 + I * 16 / 2, var8 - 8, 4 + s[25] / 4);
                        }

                        if (s[3070 + var5] >= 63) {
                           if ((s[1126] - (s[5630 + var5] >> 4)) * I < 112 && 0 <= var7 && var7 <= 144) {
                              s[8190 + var5]++;
                              var9 = 3;
                           }
                        } else if ((s[1126] - (s[5630 + var5] >> 4)) * I < 112 && s[8702 + var5] * 16 <= var7 && var7 <= 240 - (2 + s[8702 + var5]) * 16) {
                           s[8190 + var5]++;
                           var9 = 3;
                        }
                     } else {
                        s[5630 + var5] = s[5630 + var5] + I * (6 + s[25] / 12 << 4);
                        if (var9 % (13 - s[25] / 4) == 0) {
                           a(21, (s[5630 + var5] >> 4) + 8, s[6142 + var5] >> 4, 0);
                        }

                        if ((120 - (s[5630 + var5] >> 4) - 16) * I <= 0) {
                           s[8190 + var5]++;
                           s[4606 + var5] = I * 16;
                           var9 = 0;
                        }
                     }
                  } else if (s[8190 + var5] == 1) {
                     if (s[7678 + var5] == 0) {
                        if (var9 % 4 == 0) {
                           int var102 = (int)u[0] / 1000 + s[9] + var5 + var7 + var8;
                           s[4606 + var5] = s[455 + s[1055 + (var102 & 63)]] * 4;
                           s[5118 + var5] = s[471 + s[1055 + (var102 + var9 & 63)]] * 4;
                        }

                        s[5630 + var5] = s[5630 + var5] + s[4606 + var5];
                        s[6142 + var5] = s[6142 + var5] + s[5118 + var5];
                        if (s[3070 + var5] >= 63) {
                           if (s[5630 + var5] < 0) {
                              s[5630 + var5] = 0;
                           }

                           if (2304 < s[5630 + var5]) {
                              s[5630 + var5] = 2304;
                           }

                           if (s[6142 + var5] < 256) {
                              s[6142 + var5] = 256;
                           }

                           if (3072 < s[6142 + var5]) {
                              s[6142 + var5] = 3072;
                           }
                        } else {
                           if (s[5630 + var5] < s[8702 + var5] * 16 << 4) {
                              s[5630 + var5] = s[8702 + var5] * 16 << 4;
                           }

                           if (240 - (2 + s[8702 + var5]) * 16 << 4 < s[5630 + var5]) {
                              s[5630 + var5] = 240 - (2 + s[8702 + var5]) * 16 << 4;
                           }

                           if (s[6142 + var5] < s[8702 + var5] * 16 << 4) {
                              s[6142 + var5] = s[8702 + var5] * 16 << 4;
                           }

                           if (224 - (1 + s[8702 + var5]) * 16 << 4 < s[6142 + var5]) {
                              s[6142 + var5] = 224 - (1 + s[8702 + var5]) * 16 << 4;
                           }
                        }

                        if (var9 > 80) {
                           s[8190 + var5]++;
                           var9 = 1;
                           a(21, s[5630 + var5] >> 4, s[6142 + var5] >> 4, 0);
                        }
                     } else {
                        s[4606 + var5] = s[4606 + var5] + -I * var78;
                        s[5630 + var5] = s[5630 + var5] + s[455 + s[4606 + var5]] * (6 + s[25] / 12);
                        s[6142 + var5] = s[6142 + var5] + s[471 + s[4606 + var5]] * (6 + s[25] / 12);
                        if (var9 >= 48) {
                           s[8190 + var5]++;
                           var9 = 1;
                        }
                     }

                     if ((var9 - 1) % (40 - s[25]) == 0) {
                        a(26 + var72, var7 + I * 16 / 2, var8 - 8, 4 + s[25] / 4);
                     }
                  } else {
                     if (s[7678 + var5] == 0) {
                        s[5630 + var5] = s[5630 + var5] + -I * 96;
                        s[6142 + var5] = s[6142 + var5] + -var78 * (var9 << 4 >> 2);
                     } else {
                        s[4606 + var5] = s[4606 + var5] + I * var78;
                        s[5630 + var5] = s[5630 + var5] + s[455 + s[4606 + var5]] * (6 + s[25] / 12);
                        s[6142 + var5] = s[6142 + var5] + s[471 + s[4606 + var5]] * (6 + s[25] / 12);
                     }

                     if ((var9 - 1) % (40 - s[25]) == 0) {
                        a(21, s[5630 + var5] >> 4, s[6142 + var5] >> 4, 0);
                     }
                  }

                  var7 = s[5630 + var5] >> 4;
                  var8 = s[6142 + var5] >> 4;
                  a(2, var7, var8, 13, var24, 0);
                  if (b(var5, var7 + 4, var8, 26, 16, 16) && s[7166 + var5] != 0) {
                     a(114, var7 + 8, var8, 0);
                     if (s[86] > 0) {
                        s[95]++;
                     }
                  }
               }
               break;
            case 65:
               if (var9 == 0 && s[8702 + var5] > 0) {
                  s[9214 + var5] = s[8702 + var5];
               }

               s[0] = 4 + s[25] / 8;
               if (s[7678 + var5] != 0) {
                  s[0] = s[7678 + var5];
               }

               s[7166 + var5] = a(s[5630 + var5], s[6142 + var5], s[7166 + var5]);
               var7 = b(var5, s[7166 + var5], s[0]);
               var8 = c(var5, s[7166 + var5], s[0]);
               a(1, var7, var8, 14, 196 + (s[7166 + var5] + 2 & 63) / 4, 0);
               if (c(var7, var8) < 0) {
                  c(var5);
                  a(16, var7, var8, 0);
               } else {
                  b(var5, var7 + 2, var8 + 2, 12, 12, 16);
               }

               if (s[86] >= 3 && J == 0) {
                  b(2);
                  a(16, var7, var8, 0);
                  c(var5);
               }
               break;
            case 66:
            case 67:
            case 68:
            case 69:
            case 70:
            case 71:
            case 72:
            case 73:
               I = (var10 = (s[3070 + var5] - 66) % 2) * 2 - 1;
               s[0] = (s[3070 + var5] - 66) / 4;
               int var23 = 212 + s[7166 + var5] * 2 + var10 * 4 + s[0] * 1;
               int var2 = 220 + s[7166 + var5] * 1 + var10 * 4 + s[0] * 2;
               if (var9 == 0) {
                  if (s[7166 + var5] == 1) {
                     s[9214 + var5] = 8;
                  }

                  s[5118 + var5] = 0;
               } else {
                  if (s[8190 + var5] > 0) {
                     if (var9 <= s[8190 + var5]) {
                        s[5630 + var5] = s[5630 + var5] + s[455 + s[8702 + var5]] * 4;
                        s[6142 + var5] = s[6142 + var5] + s[471 + s[8702 + var5]] * 4;
                        var7 = s[5630 + var5] >> 4;
                        var8 = s[6142 + var5] >> 4;
                        if (var9 >= s[8190 + var5]) {
                           s[8190 + var5] = 0;
                           var9 = 0;
                        }
                     }
                  } else {
                     s[1] = 8 + 2 * (s[25] / 4);
                     if (var9 < 6) {
                        s[1] = 2;
                        if (var9 == 5 && s[7678 + var5] == 1 && (s[1126] - var7) * I > 32) {
                           s[2] = b(var7, var8);
                           if (18 <= s[2] && s[2] <= 46) {
                              s[5118 + var5] = -1;
                           } else if (50 <= s[2] || s[2] <= 14) {
                              s[5118 + var5] = 1;
                           }
                        }
                     }

                     var7 += I * s[1] - s[5118 + var5] * 2;
                     var8 += s[5118 + var5] * 4;
                  }

                  a(2, var7, var8, 16, var23, 0);
                  if (s[8190 + var5] <= 0 && var9 >= 6) {
                     a(1, var7 + 32 - var10 * 16 * 3 + I * (1 - s[7166 + var5]) * 6, var8, 16, var2, 0);
                  }

                  b(var5, var7 + 4, var8 + 6, 24, 4, 16);
               }
               break;
            case 74:
            case 75:
               if (var9 == 0) {
                  s[8190 + var5] = 48;
                  I = (s[3070 + var5] - 74) * 2 - 1;
                  if (I == 1) {
                     var7 = -32;
                     s[5630 + var5] = -512;
                     s[8190 + var5] = 16;
                  }
               } else {
                  s[0] = b(var7 + 8, var8 + 8);
                  if ((s[0] - 32) * (s[8190 + var5] - 32) < 0) {
                     s[8190 + var5] = s[0];
                  }

                  byte var70 = 0;
                  if (s[8190 + var5] < 32) {
                     var70 = 1;
                  }

                  int var22 = 240 + var70 * 2 + s[7166 + var5] * 1;
                  s[8190 + var5] = a(s[5630 + var5], s[6142 + var5], s[8190 + var5]);
                  var7 = b(var5, s[8190 + var5], 4);
                  var8 = c(var5, s[8190 + var5], 4);
                  a(0, var7, var8, 13, var22, 131586);
                  if (b(var5, var7, var8 + 6, 32, 20, 16)) {
                     if (s[7166 + var5] == 1) {
                        a(115, var7 + 8, var8 + 8, 0);
                     }

                     s[1] = s[25] / 12;
                     if (s[1] == 0) {
                        s[1] = 4;
                     } else {
                        s[1] = s[1] * 8;
                     }

                     a(23, var7 + 8, var8 + 8, 64 / s[1] << 16 | s[1] << 8 | 0);
                     if (s[86] > 0) {
                        s[95]++;
                     }
                  }

                  if (s[86] >= 3 && J == 0) {
                     b(2);
                     a(16, var7 + 8, var8 + 8, 0);
                     c(var5);
                  }
               }
               break;
            case 76:
               if (var9 == 0) {
                  s[9214 + var5] = 1;
                  s[8702 + var5] = -1;
               } else {
                  int var77 = s[7166 + var5] * 2 - 1;
                  s[0] = s[9] % 4;
                  if (c(var7 + s[8702 + var5] * 16 / 2, var8 - var77 * 16 - s[54]) == 0) {
                     s[8702 + var5] = s[8702 + var5] * -1;
                  }

                  if (s[8190 + var5] == 0) {
                     var7 += s[8702 + var5] * 16 / 8;
                     if (var9 % 24 == 0) {
                        s[8190 + var5]++;
                     }
                  } else {
                     if (s[8190 + var5] == 1 && var8 + 16 >= s[54] && s[54] + 224 >= var8) {
                        a(23, var7, var8, 16777216 | 10 - s[25] / 10 * 2 << 16 | 3 + s[25] / 10 * 2 << 8 | (1 - s[7166 + var5]) * 64 / 2);
                     }

                     if (s[8190 + var5]++ >= 3) {
                        s[8190 + var5] = 0;
                     }

                     s[0] = 4;
                  }

                  if (var8 + 16 >= s[54] && s[54] + 224 >= var8) {
                     int var21 = 381 + (s[8702 + var5] + 1) / 2 * 5 + s[7166 + var5] * 10 + s[0];
                     a(1, var7, var8, 13, var21, 0);
                     if (b(var5, var7, var8, 16, 16, 17)) {
                        a(23, var7, var8, 16777216 | 10 - s[25] / 10 * 2 << 16 | 3 + s[25] / 10 * 2 << 8 | 16 - I * 64 / 2);
                     }
                  }
               }
               break;
            case 77:
            case 78:
               if (var9 == 0) {
                  s[9214 + var5] = 32 + s[25] * 4;
                  s[7166 + var5] = -1;
                  s[8190 + var5] = -1;
                  s[8702 + var5] = -1;
                  if (s[3070 + var5] == 78 && var8 < s[1143]) {
                     s[8702 + var5] = 1;
                  }
               } else {
                  byte var69 = 0;
                  if (var7 < 120) {
                     var69 = 1;
                  }

                  I = var69 * 2 - 1;
                  int var20 = 288 + var69 * 1;
                  if (s[7166 + var5] == -1) {
                     var7 += I * 4;
                     if (s[3070 + var5] == 78) {
                        if (var7 * I >= 176 * I || 16 * I <= var7 * I) {
                           s[7166 + var5] = 1 + var69 * 2;
                           s[8190 + var5] = 1 + (1 - var69) * 2;
                        }
                     } else if (var7 <= 192) {
                        s[7166 + var5] = 1;
                        s[8190 + var5] = 3;
                     }
                  } else if (s[7166 + var5] != 0 && s[7166 + var5] != 2) {
                     if (s[7166 + var5] == 1 || s[7166 + var5] == 3) {
                        var8 += s[8702 + var5] * 4;
                        if (var9 % (12 - s[25] / 4) == 0) {
                           a(66 + s[7166 + var5] / 2 * 1, var7 + var69 * 16, var8 + 8, 0);
                        }

                        if (var9 % (32 - s[25] / 2) == 0) {
                           s[8190 + var5] = 4 - s[7166 + var5];
                        }

                        if (s[3070 + var5] == 78 && (var8 <= 16 || 184 <= var8)) {
                           s[8702 + var5] = s[8702 + var5] * -1;
                        }

                        if (s[7166 + var5] == 1 && var8 <= -32) {
                           s[7166 + var5]++;
                        }

                        if (s[7166 + var5] == 3 && 240 <= var8) {
                           s[7166 + var5] = 0;
                        }
                     }
                  } else {
                     var7 -= (s[7166 + var5] - 1) * 6;
                     if (var9 % (32 - s[25] / 2) == 0) {
                        s[8190 + var5] = 2 - s[7166 + var5];
                     }

                     if (s[7166 + var5] == 0 && 192 <= var7) {
                        s[7166 + var5]++;
                        s[8702 + var5] = -1;
                        var7 = 192;
                     }

                     if (s[7166 + var5] == 2 && var7 <= 0) {
                        s[7166 + var5]++;
                        s[8702 + var5] = 1;
                        var7 = 0;
                     }
                  }

                  if (s[8190 + var5] >= 0) {
                     a(23, var7 + 16, var8 + 8, 262144 | 1 + (s[25] / 12 + 1) * 2 << 8 | s[8190 + var5] * 64 / 4);
                     s[8190 + var5] = -1;
                  }

                  a(0, var7, var8, 13, var20, 197123);
                  if (b(var5, var7, var8, 48, 32, 10) || var9 >= 800) {
                     if (var9 < 800) {
                        s[16] = s[16] + 1000;
                     }

                     c(var5);
                     a(18, var7 + 16, var8 + 4, 0);
                     a(115, var7 + 16, var8 + 4, 0);
                     b(3);
                     if (s[86] > 0) {
                        s[95]++;
                     } else {
                        s[43] = 1;
                        s[42] = 1;
                     }
                  }
               }
               break;
            case 79:
               if (var9 == 0) {
                  s[9214 + var5] = 64 + s[25] * 4;
                  s[8702 + var5] = 3;
               } else {
                  I = -1;
                  int var19 = 284 + s[8702 + var5] * 1;
                  if (s[7166 + var5] == 0) {
                     var7 -= 4;
                     s[8702 + var5] = (var7 - 176) / 16;
                     if (var7 <= 176) {
                        s[7678 + var5] = 1;
                        if (s[1143] < var8) {
                           s[7678 + var5] = -1;
                        }

                        s[7166 + var5]++;
                     }
                  } else if (s[7166 + var5] == 1) {
                     if (s[1143] + 24 < var8) {
                        s[7678 + var5] = -1;
                     }

                     if (s[1143] - 24 > var8) {
                        s[7678 + var5] = 1;
                     }

                     var8 += s[7678 + var5] * (4 + s[25] / 4);
                     if ((var9 - 1) % (12 - s[25] / 4) == 0) {
                        a(30, var7, var8, 8);
                     }

                     if (var9 % 100 >= 70 && s[1143] - 8 <= var8 && var8 <= s[1143] + 8) {
                        s[7166 + var5]++;
                        s[8190 + var5] = 1;
                        a(30, var7, var8, 8);
                     }
                  } else if (s[7166 + var5] == 2) {
                     var7 -= 12;
                     if (var7 <= 0) {
                        s[7166 + var5] = 0;
                        s[8190 + var5] = 0;
                        s[8702 + var5] = 3;
                        var7 = 240;
                        var9 = (var9 / 100 + 1) * 100;
                     } else if (var7 <= 60) {
                        s[8702 + var5] = (60 - var7) / 12;
                     } else if (var9 % (4 - s[25] / 16) == 0) {
                        a(70, var7 + 16, var8 - 8, 256);
                        a(70, var7 + 16, var8 + 8, 256);
                     }
                  }

                  a(0, var7, var8, 13, var19, 197132);
                  if (s[8702 + var5] <= 2) {
                     a(1, var7 + 48 - 2, var8, 13, 220 + s[8190 + var5] * 1 + (s[9] & 1) * 2, 0);
                     if (b(var5, var7, var8, 48, 16, 10) || var9 >= 600) {
                        if (var9 < 600) {
                           s[16] = s[16] + 1000;
                        }

                        c(var5);
                        a(18, var7 + 16, var8, 0);
                        a(115, var7 + 16, var8, 0);
                        b(3);
                        if (s[86] > 0) {
                           s[95]++;
                        } else {
                           s[43] = 1;
                           s[42] = 1;
                        }
                     }
                  }
               }
               break;
            case 80:
               if (var9 >= 128) {
                  if (var9 >= 140) {
                     c(var5);
                     s[95]++;
                  }
               } else if (s[7166 + var5] <= 2) {
                  if (var9 % (5 - s[25] / 9) == 0) {
                     int var100 = (int)u[0] / 1000 + s[9] + s[7678 + var5];
                     s[0] = 0;
                     if (s[7166 + var5] % 2 == 0 && ++s[7678 + var5] % 8 == 0) {
                        s[0]++;
                     }

                     a(81, var7 + s[1055 + (var100 & 63)] % 6 * 16, var8 + s[1055 + (var100 + 1 & 63)] % 6 * 16, s[0]);
                  }
               } else if (s[7166 + var5] <= 4 && var9 % (6 - s[25] / 9) == 0) {
                  int var101 = (int)u[0] / 1000 + s[9] + s[7678 + var5];
                  s[0] = 1;
                  if (s[7166 + var5] % 2 == 0 && ++s[7678 + var5] % 8 == 0) {
                     s[0]++;
                  }

                  a(81, var7 + s[1055 + (var101 & 63)] % 6 * 16, var8 + s[1055 + (var101 + 1 & 63)] % 6 * 16, s[0]);
               }
               break;
            case 81:
               int var18 = 359;
               if (s[7166 + var5] == 1) {
                  var18 = 349;
               }

               if (s[7166 + var5] == 2) {
                  var18 = 354;
               }

               if (var9 == 0) {
                  s[7678 + var5] = b(var7, var8);
               }

               if (var9 <= 4) {
                  var18 += 4 - var9;
               } else {
                  var7 = b(var5, s[7678 + var5], 4);
                  var8 = c(var5, s[7678 + var5], 4);
                  if (b(var5, var7, var8, 16, 16, 16) && s[7166 + var5] > 0) {
                     a(114 + (s[7166 + var5] - 1), var7, var8, 0);
                  }
               }

               a(1, var7, var8, 13, var18, 0);
               if (s[86] >= 3 && J == 0) {
                  b(0);
                  a(16, var7, var8, 0);
                  c(var5);
               }
               break;
            case 83:
               if (var9 == 0) {
                  s[9214 + var5] = 4;
               } else {
                  if (var8 <= 112) {
                     var10 = 1;
                  }

                  if (var9 % (48 - s[25]) == 0) {
                     a(21, var7, var8, 0);
                  }

                  a(1, var7, var8, 13, 364 + var10 * 2 + (var9 & 1), 0);
                  b(var5, var7, var8, 16, 16, 16);
               }
               break;
            case 84:
               if (var9 == 0) {
                  s[9214 + var5] = 8;
               } else {
                  if (var8 <= 112) {
                     var10 = 1;
                  }

                  s[0] = 380;
                  if (s[7166 + var5] >= 2) {
                     s[0] = 382;
                     if (var9 >= s[7678 + var5] + 8) {
                        s[0] = 380;
                     } else if (var9 >= s[7678 + var5]) {
                        s[0] = 381;
                     } else if (var9 % 4 == 0) {
                        a(53, var7, var8 + 8, 524288 | 32 - var10 * 64 / 2 << 8);
                     }
                  } else {
                     if (var9 == 24) {
                        s[0] = 382;
                        s[7166 + var5]++;
                        s[7678 + var5] = var9 + 16 + s[25] / 4 * 4;
                     } else if (var9 == 16) {
                        s[7166 + var5]++;
                     }

                     if (s[7166 + var5] == 1) {
                        s[0] = 381;
                     }
                  }

                  a(0, var7, var8, 13, s[0] + var10 * 3, 131590);
                  s[1] = 0;
                  s[1] = a(var5, var7, var8, 32, 32);
                  if (s[1] > 0) {
                     b(1);
                  }

                  s[9214 + var5] = s[9214 + var5] - s[1];
                  if (s[9214 + var5] <= 0) {
                     a(18, var7 + 8, var8 + 8, 0);
                     s[16] = s[16] + 1000;
                     b(3);
                     c(var5);
                  }
               }
               break;
            case 85:
            case 86:
               if (var9 == 0) {
                  s[5118 + var5] = 0;
                  s[8702 + var5] = 4;
                  s[9214 + var5] = 64 + s[25] * 6;
                  if (s[3070 + var5] == 86) {
                     s[8702 + var5] = 8;
                     s[9214 + var5] = 128 + s[25] * 8;
                  }

                  s[9738] = 0;

                  for (int var59 = 0; var59 < s[8702 + var5]; var59++) {
                     b(87, var7 + 16, var8 + 16, s[8702 + var5] << 24 | var59 << 16 | 1792 | var5);
                  }
               } else if (s[5118 + var5] != 0) {
                  c(var5);
               } else {
                  if (s[7166 + var5] == 0) {
                     s[5630 + var5] = s[5630 + var5] - 96;
                     if (s[5630 + var5] >> 4 <= 160) {
                        s[7166 + var5]++;
                        var9 = 47;
                     }
                  } else if (s[7166 + var5] == 1) {
                     s[0] = var9 % 64;
                     s[5630 + var5] = s[5630 + var5] + s[455 + s[0]] * 4;
                     s[6142 + var5] = s[6142 + var5] - s[471 + s[0]] * 6;
                  }

                  var7 = s[5630 + var5] >> 4;
                  var8 = s[6142 + var5] >> 4;
                  a(0, var7, var8, 12, 290, 197379);
                  if (b(var5, var7, var8 + 16, 16, 16, 10) || var9 >= 800) {
                     if (var9 < 800) {
                        s[16] = s[16] + 1000;
                     }

                     s[5118 + var5]++;
                     a(19, var7 + 16, var8 + 16, 0);
                     s[9738]++;
                     a(115, var7 + 16, var8 + 16, 0);
                     b(3);
                     if (s[86] > 0) {
                        s[95]++;
                     } else {
                        s[43] = 1;
                        s[42] = 1;
                     }
                  }

                  a(var5, var7, var8, 48, 48);
               }
               break;
            case 88:
               I = 0;
               if (var9 >= 120) {
                  c(var5);
               } else if (var8 + 104 >= s[54] && s[54] + 224 >= var8 - 88 && var9 % (13 - s[25] / 4) == 0) {
                  int var99 = (int)u[0] / 1000 + s[9] + var5 + var7 + var8;
                  s[0] = (s[1055 + (var99 & 63)] & 63) * 3;
                  s[1] = -1;
                  if (s[0] <= 96) {
                     s[1] = 0;
                  }

                  s[1] = s[1] + (s[1055 + (var99 + 1 & 63)] & 1);
                  a(89, var7, var8 - 88 + s[0], s[1] + 1 << 8 | 48 + s[1] * 64 * 6 / 64);
               }
               break;
            case 89:
               if (var9 == 0) {
                  s[9214 + var5] = 4;
               }

               if (var8 + 16 >= s[54] && s[54] + 224 >= var8) {
                  var7 = b(var5, s[7166 + var5], 8);
                  var8 = c(var5, s[7166 + var5], 8);
                  int var17 = 365 + s[7678 + var5] * 2;
                  a(2, var7, var8, 13, var17 + (var9 & 1) * 1, 0);
                  if (c(var7, var8 - s[54]) < 0) {
                     c(var5);
                     a(18, var7 + 8, var8 - 8, 0);
                     b(3);
                  } else {
                     b(var5, var7, var8, 32, 16, 18);
                  }
               } else {
                  c(var5);
               }
               break;
            case 90:
               if (var9 == 0) {
                  s[9214 + var5] = 16 + s[25];
               } else if (var8 + 48 >= s[54] && s[54] + 224 >= var8) {
                  s[0] = b(var7 + 8, var8 + 8);
                  s[8702 + var5] = -1;
                  if (s[0] <= 32) {
                     s[8702 + var5] = 1;
                  }

                  int var76 = (s[0] & 1) * 2 - 1;
                  var8 += var76;
                  s[1] = 0;
                  if ((var9 + 4) % 32 <= 4) {
                     s[1] = ((var9 & 1) * 2 - 1) * 2;
                     if ((var9 & 1) == 1) {
                        int var98 = (int)u[0] / 1000 + s[9] + var5 + var7 + var8;

                        for (int var58 = 0; var58 <= s[25] / 10; var58++) {
                           s[2] = (s[1055 + (var98 + var58 & 63)] & 0xFF) % 25 + 4 + (s[8702 + var5] + 1) / 2 * 32;
                           s[3] = (s[1055 + (var98 + var58 + 32 & 63)] & 3) + 2;
                           a(91, var7 + 16, var8 + 16, s[2] << 16 | s[3] << 8);
                        }
                     }
                  }

                  int var16 = 379 + (s[8702 + var5] + 1) / 2 * 1;
                  a(0, var7 + s[1], var8, 12, var16, 197379);
                  if (b(var5, var7 + 8, var8 + 8, 32, 32, 10)) {
                     c(var5);
                     a(115, var7 + 16, var8 + 16, 0);
                     a(19, var7 + 16, var8 + 16, 0);
                     s[16] = s[16] + 1000;
                     b(3);
                  }
               }
               break;
            case 91:
               s[5630 + var5] = var7 << 4;
               s[6142 + var5] = var8 << 4;
               if (var9 == 0) {
                  s[9214 + var5] = 2;
               } else if (var8 + 32 >= s[54] && s[54] + 224 >= var8 + 16) {
                  s[0] = b(var7, var8);
                  if (s[7678 + var5] > 0) {
                     var7 = b(var5, s[8190 + var5], 6);
                     var8 = c(var5, s[8190 + var5], 6);
                     s[7678 + var5]--;
                  } else if (var9 <= 80) {
                     s[8190 + var5] = a(s[5630 + var5], s[6142 + var5], s[8190 + var5]);
                     var7 = b(var5, s[8190 + var5], 4);
                     var8 = c(var5, s[8190 + var5], 4);
                  } else {
                     var7 += s[43] * I;
                     var8 += ((s[9] & 1) * 2 - 1) * 2;
                  }

                  s[8702 + var5] = -1;
                  if (s[0] <= 32) {
                     s[8702 + var5] = 1;
                  }

                  int var15 = 371 + (s[8702 + var5] + 1) / 2 * 1;
                  a(1, var7, var8, 13, var15, 0);
                  b(var5, var7, var8, 16, 16, 16);
               } else {
                  c(var5);
               }
               break;
            case 92:
            case 93:
               var10 = (I + 1) / 2;
               short var14 = 349;
               if (s[3070 + var5] == 93) {
                  var14 = 350;
               }

               if (var9 % 32 == 0) {
                  int var97 = (int)u[0] / 1000 + s[9] + var5 + var7 + var8;
                  s[8190 + var5] = (s[1055 + (var97 & 63)] & 7) % 5;
                  if (s[7678 + var5] == 1) {
                     s[7166 + var5] = s[1055 + (var97 & 63)] & 3;
                  }
               }

               if (var9 == 0) {
                  s[9214 + var5] = 192;
                  s[4606 + var5] = 128;
                  if (s[3070 + var5] == 93) {
                     s[9214 + var5] = 320 + s[25] * 4;
                     s[4606 + var5] = 192;
                  }

                  if (I == 1) {
                     var7 = -s[4606 + var5];
                  }
               } else {
                  byte var11 = 0;
                  if (s[1143] + 16 <= var8) {
                     var11 = -1;
                  }

                  if (var8 <= s[1143] - 32) {
                     var11 = 1;
                  }

                  if (s[7166 + var5] >= 2) {
                     var8 += var11 * ((s[7166 + var5] - 2) * 2 - 1) * 1;
                  }

                  if (s[7166 + var5] == 0) {
                     var7 += s[43] * I * -1 / 2;
                  }

                  if (s[8190 + var5] == 0 && var9 % 16 == 0) {
                     if (s[3070 + var5] == 93) {
                        a(23, var7 + 88, var8 + 24, 262144 | 1 + s[25] / 10 * 2 << 8 | b(var7 + 88, var8 + 24));
                     } else {
                        a(23, var7 + 56 - I * 16 * 2, var8 + 24, 262144 | 1 + s[25] / 10 * 2 << 8 | b(var7 + 56 - I * 16 * 2, var8 + 24));
                     }
                  } else if (s[8190 + var5] == 1 && var9 % (16 - s[25] / 4) == 0) {
                     if (s[3070 + var5] == 93) {
                        a(53 + var10, var7 + 80 + I * 16, var8 + 16, 1048576 | 32 - I * 8 << 8);
                     } else {
                        a(53 + var10, var7 + 48, var8 + 40, 1048576 | 32 + I * 24 << 8);
                     }
                  } else if (s[8190 + var5] == 2 && var9 % (16 - s[25] / 4) == 0) {
                     if (s[3070 + var5] == 93) {
                        a(57, var7 + 88 + I * 16 * 3 / 2, var8 + 16, 32 - I * 8 << 8);
                     } else {
                        a(57, var7 + 56, var8 + 48, 0);
                     }
                  } else if (s[8190 + var5] <= 4 && var9 % 32 < s[25] + 1) {
                     s[0] = s[8190 + var5] & 1;
                     s[1] = 68;
                     if (s[1126] > var7 + s[4606 + var5] - 16 - var10 * s[4606 + var5]) {
                        s[1]++;
                     }

                     s[2] = 0;
                     if (s[1143] < var8 + 32) {
                        s[2] = 32;
                     }

                     if (var9 % 4 == 0) {
                        a(s[1] + s[0] * 4, var7 + s[4606 + var5] - 16 - var10 * s[4606 + var5], var8 + 32, s[2] << 24 | s[25] - var9 % 32 << 16 | s[0] << 8 | 0);
                     }
                  }

                  if (s[3070 + var5] >= 93) {
                     a(0, var7, var8, 12, var14, 787212);
                     if (b(var5, var7, var8 + 32, 192, 4, 10)
                        || b(var5, var7, var8 + 32, 192, 4, 10)
                        || b(var5, var7 + 88 - var10 * 80, var8 + 16, 96, 16, 10)
                        || b(var5, var7 + 144 - var10 * 144, var8 + 8, 48, 8, 10)) {
                        c(var5);
                        s[16] = s[16] + 2000;
                        a(19, var7 + 96, var8 + 16, 0);
                        a(20, var7 + 96, var8 + 16, 5246984);
                        b(9);
                        a(115, var7 + 88 - I * 16 * 3, var8 + 16, 0);
                     }
                  } else {
                     a(0, var7, var8, 12, var14, 525064);
                     if (b(var5, var7 + var10 * 8, var8 + 32, 120, 16, 10) || b(var5, var7 + 88 - var10 * 56, var8 + 16, 8, 16, 10)) {
                        c(var5);
                        s[16] = s[16] + 1000;
                        a(19, var7 + 64, var8 + 28, 0);
                        a(20, var7 + 72, var8 + 28, 3672072);
                        b(3);
                        a(114, var7 + 56 - I * 16 * 2, var8 + 24, 0);
                     }
                  }

                  if (var7 < -1 * (1 - var10) * s[4606 + var5] || 240 < var7) {
                     c(var5);
                  }
               }
               break;
            case 94:
               if (var9 == 0) {
                  s[9214 + var5] = 256 + s[25] * 8;
                  s[9738] = 0;

                  for (int var57 = 0; var57 < 8; var57++) {
                     b(95, var7 + 16, var8 + 16, var57 << 8 | var5);
                  }

                  s[85] = 0;
               } else {
                  if (s[7166 + var5] == 0) {
                     var7 -= 6;
                     if (var7 <= 144) {
                        s[7166 + var5]++;
                     }
                  } else if (s[7166 + var5] == 1) {
                     var8 += s[7678 + var5] * (s[25] / 12 + 2);
                     if (var9 % (64 - s[25]) == 0) {
                        b(33, -16, 24, 16777216 | var5 << 16 | 256 | 12);
                        s[7166 + var5]++;
                        s[8190 + var5] = 0;
                     }
                  } else if (s[7166 + var5] == 2 && ++s[8190 + var5] >= 20) {
                     s[7166 + var5] = 1;
                     s[7678 + var5] = -1;
                     if (var8 + 24 < s[1143]) {
                        s[7678 + var5] = 1;
                     }
                  }

                  if ((var9 + 1) % (64 - s[25]) == 0) {
                     a(23, var7 + 48, var8 + 24, 262144 | 1 + (s[25] / 12 + 1) * 2 << 8 | 48);
                  }

                  if (var9 % 16 == 0) {
                     s[7678 + var5] = -1;
                     if (var8 + 24 < s[1143]) {
                        s[7678 + var5] = 1;
                     }
                  }

                  a(0, var7, var8, 12, 349, 394246);
                  if ((s[7166 + var5] == 0 || !b(var5, var7 + 4, var8 + 8, 32, 48, 10)) && var9 < 1200) {
                     if (s[7166 + var5] == 0) {
                        a(var5, var7 - 8, var8 + 8, 32, 48);
                     }
                  } else {
                     if (var9 < 1200) {
                        s[16] = s[16] + 10000;
                     }

                     a(19, var7 + 40, var8 + 24, 0);
                     a(20, var7 + 40, var8 + 24, 2627594);
                     s[9738]++;
                     s[85]++;
                     this.a();
                     b(9);
                     s[34]++;
                     c(var5);
                  }

                  a(var5, var7 + 16, var8, 80, 64);
               }
               break;
            case 96:
               if (var9 == 0) {
                  s[9214 + var5] = 96 + s[25] * 2;
                  s[4606 + var5] = 1;
                  s[5118 + var5] = 0;
                  s[7166 + var5] = -2;
                  s[8702 + var5] = 0;
                  s[5630 + var5] = s[8702 + var5] * 2 - 1;
                  s[6142 + var5] = -1;
                  if (var8 + 8 < s[1143]) {
                     s[6142 + var5] = 1;
                  }

                  s[85] = 0;
               } else {
                  if (s[7166 + var5] == -2) {
                     var7 -= 4;
                     if (var7 <= 176) {
                        s[7166 + var5]++;
                        s[8190 + var5] = 4;
                     }
                  } else if (s[7166 + var5] >= -1) {
                     var8 += s[6142 + var5] * (2 + s[25] / 8);
                     if (var9 % 8 == 0) {
                        s[6142 + var5] = -1;
                        if (var8 + 8 < s[1143]) {
                           s[6142 + var5] = 1;
                        }
                     }

                     s[8190 + var5]++;
                     if (s[7166 + var5] >= 0) {
                        if (s[4606 + var5] == 0) {
                           var8 -= s[6142 + var5] * (2 + s[25] / 8);
                           a(40, var7 + 8 + s[5630 + var5] * 16 * 3 / 2, var8 + 8, 8 + (1 - s[8702 + var5]) * 64 / 2 + s[8190 + var5] % 17);
                           if (s[8190 + var5] % 64 >= 56) {
                              s[7166 + var5] = -1;
                           }
                        } else if (s[4606 + var5] == 1) {
                           if (s[7166 + var5]++ == 0) {
                              b(35, 8 + s[5630 + var5] * 16 * 3 / 2, 0, 16777216 | var5 << 16 | 512 | 20);
                              s[7166 + var5]++;
                           }
                        } else if (s[4606 + var5] == 2) {
                           var8 -= s[6142 + var5] * (2 + s[25] / 8);
                           s[0] = s[8190 + var5] % 32;
                           if (10 <= s[0] && s[0] < 28) {
                              var7 += s[5630 + var5] * 16 / 2;
                              var8 += (s[0] - 18) * 2;
                              if (s[0] == 18) {
                                 s[8702 + var5] = s[8702 + var5] ^ 1;
                              }

                              if (s[0] == 27) {
                                 s[5630 + var5] = s[5630 + var5] * -1;
                              }
                           }
                        } else if (s[4606 + var5] == 3 && s[8190 + var5] % (22 - s[25] / 2) == 0) {
                           a(23, var7 + 8 + s[5630 + var5] * 16 * 3 / 2, var8 + 8, 263936 | 32 - s[5630 + var5] * 16);
                        }
                     }

                     if (s[8190 + var5] % 64 <= 4) {
                        s[5118 + var5] = (4 - s[8190 + var5] % 64) * 16 / 4;
                        if (s[8190 + var5] % 64 == 0) {
                           s[7166 + var5] = -1;
                        }
                     } else if (s[8190 + var5] % 32 <= 4) {
                        s[5118 + var5] = s[8190 + var5] % 32 * 16 / 4;
                        if (s[8190 + var5] % 32 == 4) {
                           s[7166 + var5] = 0;
                        }

                        if (s[8190 + var5] % 32 == 0) {
                           int var96 = (int)u[0] / 1000 + s[9] + var5 + var7 + var8;
                           s[4606 + var5] = s[1055 + (var96 & 63)] & 3;
                           if (s[4606 + var5] == 1) {
                              s[7678 + var5] = 1;
                              if (s[5630 + var5] == 1) {
                                 s[4606 + var5] = 2;
                              }
                           }
                        }
                     }
                  }

                  a(0, var7, var8, 12, 405 + s[4606 + var5] * 1, 131586);
                  a(0, var7 - 16, var8 - 56 - s[5118 + var5], 13, 375 + s[8702 + var5] * 1, 263428);
                  a(0, var7 - 16, var8 + 12 + s[5118 + var5], 13, 377 + s[8702 + var5] * 1, 262916);
                  if (s[7166 + var5] >= 0 && b(var5, var7, var8, 32, 32, 10) || var9 >= 1200) {
                     if (var9 < 1200) {
                        s[16] = s[16] + 10000;
                     }

                     a(19, var7 + 8, var8 + 8, 0);
                     a(20, var7 + 8, var8 - 16, 2109450);
                     s[85]++;
                     this.a();
                     b(9);
                     s[34]++;
                     c(var5);
                  }

                  a(var5, var7 + 8 + s[5630 + var5] * 16 * 3 / 2, var8 - 12 - s[5118 + var5], 16, 16);
                  a(var5, var7 - 8 - s[5630 + var5] * 16 / 2, var8 - 56 - s[5118 + var5], 48, 72);
                  a(var5, var7 - 16, var8 + 16 + s[5118 + var5], 64, 32);
               }
               break;
            case 97:
               if (var9 == 0) {
                  s[5118 + var5] = 0;
                  s[9214 + var5] = 256 + s[25] * 8;
                  s[9738] = 0;
                  b(98, var7, var8, 0 | var5);
                  b(98, var7, var8, 256 | var5);
                  var8 = ((int)u[0] / 1000 & 1) * 16 * 10;
                  s[7166 + var5] = -4;
               } else if (s[5118 + var5] != 0) {
                  c(var5);
               } else {
                  if (s[7166 + var5] == -4) {
                     var7 -= 8;
                     if (var7 + 256 < 0) {
                        s[7166 + var5]++;
                        var8 = 88;
                     }
                  } else if (s[7166 + var5] == -3) {
                     var7 += 4;
                     if (var7 >= 144) {
                        s[7166 + var5] = -1;
                     }
                  } else if (s[7166 + var5] >= -2) {
                     if (s[7166 + var5] == -2) {
                        if (var9 % 64 - 32 == 0) {
                           s[7166 + var5] = -1;
                        } else if (var9 % 32 < s[25] + 1 && var9 % 4 == 0) {
                           a(68, var7 + 80, var8 + 16, 536870912 | s[25] - var9 % 32 << 16 | 1 | 1);
                           a(68, var7 + 80, var8 + 48, 0 | s[25] - var9 % 32 << 16 | 1 | 1);
                        }
                     } else if (s[7166 + var5] == -1) {
                        var8 += s[7678 + var5] * 2;
                        if (var9 % 64 == 0) {
                           s[7166 + var5] = -2;
                        }
                     } else if (s[7166 + var5] >= 0) {
                        s[7166 + var5] = s[7166 + var5] + s[8190 + var5];
                        a(0, var7, var8 + 24, 13, 355 + (s[7166 + var5] & 1) * 1, 262660);
                        if (s[7166 + var5] >= 12) {
                           if (s[7166 + var5] <= 14) {
                              a(0, var7 + 32, var8 + 24, 8, 274 + (s[7166 + var5] - 12) * 1, 131590);
                           } else {
                              for (int var55 = 0; var55 < 4; var55++) {
                                 a(1, 160 + var55 % 2 * 16, var8 + 40 + -48 + 32 + var55 / 2 * 16, 8, 3, 0);
                              }

                              for (int var56 = 0; var56 < 10; var56++) {
                                 a(1, 16 * var56, var8 + 40 + -48, 8, 277, 0);
                                 a(1, 16 * var56, var8 + 40 + -48 + 16, 8, 3, 0);
                                 a(1, 16 * var56, var8 + 40 + -48 + 32, 8, 3, 0);
                                 a(1, 16 * var56, var8 + 40 + -48 + 48, 8, 3, 0);
                                 a(1, 16 * var56, var8 + 40 + -48 + 64, 8, 3, 0);
                                 a(1, 16 * var56, var8 + 40 + -48 + 80, 8, 278, 0);
                              }

                              a(0, var7 + 16, var8 + 40 + -48, 8, 279, 197379);
                              a(0, var7 + 16, var8 + 40, 8, 280, 197379);
                              a(32, 0, var8 + 40 + -48, 176, 96);
                              a(32, 192, var8 + 40 + -32, 32, 64);
                           }
                        }

                        if (s[7166 + var5] >= 24) {
                           s[8190 + var5] = -1;
                        }
                     }

                     if (var9 % 128 == 0) {
                        s[7166 + var5] = 0;
                        s[8190 + var5] = 1;
                     }

                     if (s[8702 + var5] >= 2 && var9 % (32 - s[25] / 2) == 0) {
                        a(23, var7 + 96, var8 + 32, 262144 | 1 + s[25] / 8 * 2 << 8 | b(var7, var8));
                     }

                     if (var9 % 16 == 0) {
                        s[7678 + var5] = -1;
                        if (var8 + 24 < s[1143]) {
                           s[7678 + var5] = 1;
                        }
                     }
                  }

                  if (s[7166 + var5] >= -2) {
                     a(0, var7, var8, 12, 352, 394254);
                  } else {
                     a(0, var7, var8, 12, 351, 918542);
                  }

                  if ((s[8702 + var5] >= 2 || s[7166 + var5] >= 0 || var9 >= 2000) && (b(var5, var7 + 40, var8 + 32, 40, 16, 10) || var9 >= 2000)) {
                     if (var9 < 2000) {
                        s[16] = s[16] + 10000;
                     }

                     a(19, var7 + 80, var8 + 32, 0);
                     a(20, var7 + 40, var8 + 32, 2625546);
                     s[9738]++;
                     this.a();
                     b(9);
                     s[34]++;
                     s[5118 + var5]++;
                  }

                  a(var5, var7 + 80, var8 + 16, 128, 44);
               }
               break;
            case 99:
               if (var9 == 0) {
                  var7 += -I * 240 / 2;
                  s[4606 + var5] = 0;
                  s[7166 + var5] = -4;
                  s[9214 + var5] = 128 + s[25] * 4;
                  s[7678 + var5] = 0;
                  s[5] = (int)u[0] / 1000 % 5;
                  s[6] = 1;
                  if (s[5] >= 3) {
                     s[6] = -1;
                  }

                  s[4] = 0;
                  s[85] = 0;
               } else {
                  if (s[7166 + var5] == -2) {
                     if (var9 % (24 - s[25] / 2) == 0) {
                        b(33, s[103 + s[5]] + I * 16, s[127 + s[5]], 4);
                        s[5] = (s[5] + s[6] + 5) % 5;
                     }

                     if (s[7678 + var5] == 0) {
                        if (var9 % (48 - s[25]) == 0) {
                           int var93 = s[1126] + s[1143] + s[4]++;
                           s[0] = 16 * (7 + s[1055 + (var93 & 63)] % 6);
                           s[1] = 63;
                           if (s[0] <= 96) {
                              s[1] = 64;
                           }

                           s[2] = s[1055 + (var93 + 1 & 63)] & 1;
                           a(s[1], 240, s[0], 0 | s[2]);
                        }
                     } else if (s[7678 + var5] == 1) {
                        if (var9 % (16 - s[25] / 4) == 0) {
                           int var94 = s[1126] + s[1143] + s[4]++;
                           s[0] = (s[1055 + (var94 & 63)] & 15) % 5;
                           a(21, s[103 + s[0]], s[127 + s[0]], 0);
                        }
                     } else if (s[7678 + var5] == 2 && var9 % (24 - s[25] / 16) == 0) {
                        int var95 = s[1126] + s[1143] + s[4]++;
                        s[0] = (s[1055 + (var95 & 63)] & 15) % 5;
                        a(23, s[103 + s[0]], s[127 + s[0]], 262912 | b(s[103 + s[0]], s[127 + s[0]]));
                     }

                     if (var9 % 128 == 0) {
                        s[7166 + var5]++;
                        s[5118 + var5] = I;
                     }
                  } else if (s[7166 + var5] == -1) {
                     s[4606 + var5] = s[4606 + var5] + s[5118 + var5] * 2;
                     if (0 >= I * s[4606 + var5]) {
                        s[7166 + var5]--;
                        int var92 = s[1126] + s[1143] + s[4]++;
                        s[7678 + var5] = (s[1055 + (var92 & 63)] & 15) % 3;
                        s[5] = (s[1055 + (var92 + 1 & 63)] & 15) % 5;
                        s[6] = (s[1055 + (var92 + 2 & 63)] & 1) * 2 - 1;
                     } else if (16 <= I * s[4606 + var5]) {
                        s[7166 + var5]++;
                        s[8190 + var5] = 1;
                     }
                  } else if (s[7166 + var5] < 0) {
                     if (s[7166 + var5] == -4) {
                        if (s[53] % 48 == 0) {
                           s[7166 + var5]++;
                           var7 = 272;
                        }
                     } else if (s[7166 + var5] == -3 && var7 <= 176) {
                        s[7166 + var5]++;
                        s[43] = 0;
                        s[103] = s[104] = s[105] = s[106] = s[107] = var7 + 32 - var10 * 16;
                        s[127] = 20;
                        s[128] = 52;
                        s[129] = 104;
                        s[130] = 156;
                        s[131] = 188;
                     }
                  } else {
                     if (s[7166 + var5] >= 8) {
                        if (s[7166 + var5] <= 10 && s[8190 + var5] >= 1) {
                           a(0, var7 + I * 16 * 5 / 2, 96, 8, 274 + (s[7166 + var5] - 8) * 1, 131590);
                        } else {
                           for (int var53 = 0; var53 < 8; var53++) {
                              a(1, 128 + var53 % 2 * 16, 80 + var53 / 2 * 16, 8, 3, 0);
                           }

                           for (int var54 = 0; var54 < 8; var54++) {
                              a(1, var54 * 16, 48, 8, 277, 0);
                              a(1, var54 * 16, 64, 8, 3, 0);
                              a(1, var54 * 16, 80, 8, 3, 0);
                              a(1, var54 * 16, 96, 8, 3, 0);
                              a(1, var54 * 16, 112, 8, 3, 0);
                              a(1, var54 * 16, 128, 8, 3, 0);
                              a(1, var54 * 16, 144, 8, 3, 0);
                              a(1, var54 * 16, 160, 8, 278, 0);
                           }

                           a(0, 128, 48, 8, 281, 197635);
                           a(0, 128, 112, 8, 282, 197635);
                           a(32, 0, 48, 144, 128);
                           a(32, var7 + I * 16, 64, 16, 96);
                           a(32, var7, 80, 16, 64);
                        }
                     }

                     s[7166 + var5] = s[7166 + var5] + s[8190 + var5];
                     if (s[7166 + var5] >= 18) {
                        s[8190 + var5] = -1;
                     }

                     if (s[7166 + var5] <= 0) {
                        s[8190 + var5] = -1;
                        s[7166 + var5]--;
                        s[5118 + var5] = -I;
                     }

                     b(var5, var7 + 8 + var10 * 16 / 2, 48, 40, 128, 10);
                  }

                  if (s[8702 + var5] > 0) {
                     if (s[8702 + var5] <= 8 && s[8702 + var5] % 2 == 0) {
                        a(20, var7 + 16, var8 + 16 * ((4 + 7 * s[8702 + var5]) % 15), 4210694);
                        b(9);
                     }

                     if (s[8702 + var5]++ >= 8) {
                        c(var5);
                     }
                  } else if (s[9214 + var5] <= 0 || var9 >= 1500) {
                     if (var9 < 1500) {
                        s[16] = s[16] + 10000;
                     }

                     a(19, var7 + 16, var8 + 104, 0);
                     a(20, var7 + 32, 48, 3170314);
                     a(20, var7 + 24, 104, 4218890);
                     a(20, var7 + 32, 160, 3170314);
                     s[85]++;
                     this.a();
                     b(9);
                     s[7166 + var5] = -5;
                     s[8702 + var5]++;
                     s[34]++;
                  }

                  if (s[8702 + var5] < 6) {
                     a(0, var7 - I * 16 + s[4606 + var5], var8 + 16, 10, 355, 67585);
                     a(0, var7 - s[4606 + var5], var8 + 16, 11, 353, 67588);
                     a(0, var7 + 16, var8 + 16, 12, 354, 199684);
                     a(var5, var7 + 8, 48, 8, 128);
                     a(var5, var7 + 16, 32, 16, 160);
                     a(var5, var7 + 32, 16, 32, 192);
                  }
               }
               break;
            case 100:
               if (var9 == 0) {
                  for (int var49 = 0; var49 < 16; var49++) {
                     if (var49 < 4) {
                        s[103 + var49] = 40 + var49 % 4 * 16 * 3;
                        s[127 + var49] = 208;
                     } else if (var49 < 8) {
                        s[103 + var49] = 224;
                        s[127 + var49] = 176 - var49 % 4 * 16 * 3;
                     } else if (var49 < 12) {
                        s[103 + var49] = 192 - var49 % 4 * 16 * 3;
                        s[127 + var49] = 0;
                     } else if (var49 < 16) {
                        s[103 + var49] = 0;
                        s[127 + var49] = 32 + var49 % 4 * 16 * 3;
                     }
                  }
               } else {
                  s[0] = 14;
                  if (s[8190 + var5] <= 0) {
                     if (var9 <= 8) {
                        s[0] = 5;

                        for (int var51 = 0; var51 < 16; var51++) {
                           if (var51 < 4) {
                              s[127 + var51] = s[127 + var51] - 2;
                           } else if (var51 < 8) {
                              s[103 + var51] = s[103 + var51] - 2;
                           } else if (var51 < 12) {
                              s[127 + var51] = s[127 + var51] + 2;
                           } else if (var51 < 16) {
                              s[103 + var51] = s[103 + var51] + 2;
                           }
                        }
                     } else if (var9 >= 200) {
                        s[8190 + var5]++;
                     } else {
                        int var91 = s[1126] + s[1143] + s[7678 + var5];
                        s[1] = s[1055 + (var91 & 63)] & 15;
                        s[2] = (s[1] / 4 * 16 + 32) % 64;
                        if (var9 % (6 - s[25] / 7) == 0) {
                           a(65, s[103 + s[1]], s[127 + s[1]], s[2]);
                           s[7678 + var5]++;
                        }
                     }
                  } else {
                     s[0] = 5;

                     for (int var50 = 0; var50 < 16; var50++) {
                        if (var50 < 4) {
                           s[127 + var50] = s[127 + var50] - -2;
                        } else if (var50 < 8) {
                           s[103 + var50] = s[103 + var50] - -2;
                        } else if (var50 < 12) {
                           s[127 + var50] = s[127 + var50] + -2;
                        } else if (var50 < 16) {
                           s[103 + var50] = s[103 + var50] + -2;
                        }
                     }

                     if (s[8190 + var5]++ >= 8) {
                        c(var5);
                        s[95]++;
                     }
                  }

                  for (int var52 = 0; var52 < 16; var52++) {
                     a(1, s[103 + var52], s[127 + var52], s[0], 368 + var52 / 4, 0);
                     a(var5, s[103 + var52], s[127 + var52], 16, 16);
                  }
               }
               break;
            case 101:
               if (var9 == 0) {
                  for (int var45 = 0; var45 < 24; var45++) {
                     s[103 + var45] = 224 - var45 / 12 * 16 * 14;
                     s[127 + var45] = 0;
                     if (var45 < 12) {
                        s[127 + var45] = 32 + s[25] / 2;
                     } else if (s[7166 + var5] != 0) {
                        s[127 + var45] = 16;
                     }
                  }
               } else {
                  s[0] = 14;
                  if (s[8190 + var5] <= 0) {
                     if (var9 <= 8) {
                        s[0] = 5;

                        for (int var47 = 0; var47 < 24; var47++) {
                           s[103 + var47] = s[103 + var47] + (var47 / 12 * 2 - 1) * 16 / 8;
                        }
                     } else if (var9 >= 300) {
                        s[8190 + var5]++;
                     } else {
                        int var90 = s[1126] + s[1143] + s[7678 + var5];
                        if (s[7166 + var5] != 0) {
                           s[1] = (s[1055 + (var90 & 63)] & 0xFF) % 24;
                        } else {
                           s[1] = (s[1055 + (var90 & 63)] & 0xFF) % 12;
                        }

                        if (var9 % (4 - s[25] / 10) == 0 && s[127 + s[1]] > 0) {
                           a(24 + s[1] / 12, s[103 + s[1]], 16 + s[1] % 12 * 16, 1288);
                           s[7678 + var5]++;
                        }
                     }
                  } else {
                     s[0] = 5;

                     for (int var46 = 0; var46 < 24; var46++) {
                        s[103 + var46] = s[103 + var46] - (var46 / 12 * 2 - 1) * 16 / 8;
                     }

                     if (s[8190 + var5]++ >= 8) {
                        c(var5);
                        s[95]++;
                     }
                  }

                  for (int var48 = 0; var48 < 24; var48++) {
                     if ((var48 < 12 || s[7166 + var5] != 0) && s[127 + var48] > 0) {
                        a(1, s[103 + var48], 16 + var48 % 12 * 16, s[0], 372 + var48 / 12, 0);
                        s[127 + var48] = s[127 + var48] - a(var5, s[103 + var48], 16 + var48 % 12 * 16, 16, 16);
                        if (s[127 + var48] <= 0) {
                           s[8702 + var5]++;
                           s[16] = s[16] + 500;
                           a(16, s[103 + var48], 16 + var48 % 12 * 16, 0);
                           b(3);
                        }
                     }
                  }

                  if (s[8702 + var5] >= 12 * (s[7166 + var5] + 1) && J == 0) {
                     c(var5);
                     s[95]++;
                  }
               }
               break;
            case 102:
               if (var9 == 0) {
                  for (int var41 = 0; var41 < 6; var41++) {
                     int var87 = (int)u[0] / 1000 + s[9] + s[7678 + var5];
                     s[103 + var41] = 224 - (var41 & 1) * 16 * 15;
                     s[127 + var41] = 4 + s[25] / 12 * 16 / 8 + (s[1055 + (var87 & 63)] & 3) * 16 / 8;
                     s[127 + var41] = s[127 + var41] * ((var41 & 1) * 2 - 1);
                     s[7678 + var5]++;
                  }

                  s[8190 + var5] = -1;
               } else {
                  if (s[8190 + var5] >= 0) {
                     a(18, s[103 + s[8190 + var5]] + 8, 16 + s[8190 + var5] * 16 * 2 + 8, 0);
                     s[16] = s[16] + 2000;
                     b(3);
                     if (++s[8190 + var5] >= 6) {
                        c(var5);
                        s[95]++;
                     }
                  } else if (var9 <= 16) {
                     for (int var43 = 0; var43 < 6; var43++) {
                        s[103 + var43] = s[103 + var43] + ((var43 & 1) * 2 - 1) * 16 / 8;
                     }
                  } else if (var9 >= 200) {
                     s[8190 + var5]++;
                  } else {
                     for (int var42 = 0; var42 < 6; var42++) {
                        s[103 + var42] = s[103 + var42] + s[127 + var42];
                        if (s[127 + var42] < 0 && s[103 + var42] <= 16) {
                           int var89 = s[1126] + s[1143] + s[7678 + var5]++;
                           s[127 + var42] = 4 + s[25] / 12 * 16 / 8 + (s[1055 + (var89 & 63)] & 3) * 16 / 8;
                        } else if (s[127 + var42] > 0 && s[103 + var42] >= 192) {
                           int var88 = s[1126] + s[1143] + s[7678 + var5]++;
                           s[127 + var42] = 4 + s[25] / 12 * 16 / 8 + (s[1055 + (var88 & 63)] & 3) * 16 / 8;
                           s[127 + var42] = s[127 + var42] * -1;
                        }
                     }
                  }

                  for (int var44 = 0; var44 < 6; var44++) {
                     if (s[8190 + var5] <= var44) {
                        a(0, s[103 + var44], 16 + var44 * 16 * 2, 5, 386, 131586);
                        a(var5, s[103 + var44], 16 + var44 * 16 * 2, 32, 32);
                     }
                  }
               }
               break;
            case 103:
               if (var9 == 0) {
                  for (int var37 = 0; var37 < 6; var37++) {
                     s[103 + var37] = 24 + var37 * 16 * 2;
                     s[127 + var37] = 208;
                     if (s[7166 + var5] == 1) {
                        s[103 + var37] = 16 + var37 % 3 * 16 * 11 / 2;
                        s[127 + var37] = -16 + var37 / 3 * 16 * 14;
                     }
                  }
               } else {
                  s[0] = 14;
                  if (s[8190 + var5] > 0) {
                     s[0] = 5;

                     for (int var38 = 0; var38 < 6; var38++) {
                        if (s[7166 + var5] == 0) {
                           s[127 + var38] = s[127 + var38] + 2;
                        } else {
                           s[127 + var38] = s[127 + var38] + (var38 / 3 * 2 - 1) * 16 / 8;
                        }
                     }

                     if (s[8190 + var5]++ >= 8) {
                        c(var5);
                        s[95]++;
                        break;
                     }
                  } else if (var9 <= 16) {
                     s[0] = 5;

                     for (int var39 = 0; var39 < 6; var39++) {
                        if (s[7166 + var5] == 0) {
                           s[127 + var39] = s[127 + var39] - 2;
                        } else {
                           s[127 + var39] = s[127 + var39] - (var39 / 3 * 2 - 1) * 16 / 8;
                        }
                     }
                  } else if (var9 <= 18) {
                     s[8702 + var5]++;
                  } else if (var9 >= 200) {
                     s[8190 + var5]++;
                  } else {
                     int var86 = s[9] + s[1126] + s[1143] + s[7678 + var5];
                     s[1] = (s[1055 + (var86 & 63)] & 7) % 6;
                     if (s[7166 + var5] == 0) {
                        if (var9 % (4 - s[25] / 12) == 0) {
                           s[2] = 0;
                           if (s[7678 + var5] % 16 == 0) {
                              s[2] = 1;
                           }

                           a(57, s[103 + s[1]] + 8, s[127 + s[1]] + 16, 8192 | s[2]);
                           s[7678 + var5]++;
                        }
                     } else if (var9 % (6 - s[25] / 9) == 0) {
                        s[2] = 0;
                        if (s[7678 + var5] % 16 == 0) {
                           s[2] = 1;
                        }

                        a(57, s[103 + s[1]] + 8, s[127 + s[1]] + 16 * (s[1] / 3), s[1] / 3 * 64 / 2 << 8 | s[2]);
                        s[7678 + var5]++;
                     }
                  }

                  for (int var40 = 0; var40 < 6; var40++) {
                     if (s[7166 + var5] == 0) {
                        a(0, s[103 + var40], s[127 + var40], s[0], 380 + s[8702 + var5] * 1, 131590);
                        a(var5, s[103 + var40], s[127 + var40] + 16, 32, 16);
                     } else {
                        a(0, s[103 + var40], s[127 + var40], s[0], 383 + s[8702 + var5] * 1 - var40 / 3 * 3, 131590);
                        a(var5, s[103 + var40], s[127 + var40] + var40 / 3 * 16, 32, 16);
                     }
                  }
               }
               break;
            case 104:
               if (var9 == 0) {
                  s[9214 + var5] = 4;
                  s[4606 + var5] = 16;
               }

               var7 -= s[4606 + var5];
               if (s[4606 + var5] == 0) {
                  if (16 < var7 && s[151 + ((var8 / 16 - 1) * 13 + var7 / 16 - 2)] == 0) {
                     s[151 + ((var8 / 16 - 1) * 13 + var7 / 16 - 1)] = 0;
                     s[4606 + var5] = 16;
                  }
               } else if (s[4606 + var5] != 0 && var7 % 16 == 0) {
                  if (s[151 + ((var8 / 16 - 1) * 13 + var7 / 16 - 2)] == 1) {
                     s[151 + ((var8 / 16 - 1) * 13 + var7 / 16 - 1)] = 1;
                     s[4606 + var5] = 0;
                  } else if (var7 <= 16) {
                     s[151 + ((var8 / 16 - 1) * 13 + var7 / 16 - 1)] = 1;
                     s[4606 + var5] = 0;
                  }
               }

               if (4 <= s[7166 + var5]) {
                  s[7166 + var5]++;
                  s[7166 + var5] = 4 + (s[7166 + var5] & 1);
                  s[0] = s[7166 + var5];
                  if (s[4606 + var5] == 0) {
                     s[0] = 4;
                  }
               } else {
                  s[7166 + var5]++;
                  s[7166 + var5] = s[7166 + var5] & 3;
                  s[0] = s[7166 + var5];
                  if (s[4606 + var5] == 0) {
                     s[0] = 0;
                  }
               }

               a(1, var7, var8, 13, 374 + s[0], 0);
               if (s[7166 + var5] <= 3) {
                  s[9214 + var5] = s[9214 + var5] - a(var5, var7, var8, 16, 16);
               } else {
                  a(var5, var7, var8, 16, 16);
               }

               if (s[9214 + var5] <= 0) {
                  s[151 + ((var8 / 16 - 1) * 13 + var7 / 16 - 1)] = 0;
                  s[16] = s[16] + 100;
                  a(17, var7, var8, 0);
                  b(0);
                  c(var5);
               }

               if (s[86] >= 3 && J == 0) {
                  b(0);
                  a(17, var7, var8, 0);
                  c(var5);
               }
               break;
            case 105:
               if (var9 == 0) {
                  for (int var35 = 0; var35 < 156; var35++) {
                     s[151 + var35] = 0;
                  }
               }

               if (var9 % (3 + s[7166 + var5]) == 0) {
                  s[2] = 0;
                  int var85 = s[16] / 100 + s[1126] + s[1143] + s[7678 + var5];
                  s[1] = (s[1055 + (var85 & 63)] & 0xFF) % 12;
                  if (s[151 + s[1] * 13 + 12] != 0) {
                     s[2]++;

                     for (int var36 = 1; var36 < 12; var36++) {
                        if (s[151 + (s[1] + var36) % 12 * 13 + 12] == 0) {
                           s[1] = (s[1] + var36) % 12;
                           s[2] = 0;
                           break;
                        }
                     }
                  }

                  if (s[2] == 0) {
                     s[7678 + var5]++;
                     s[0] = s[7678 + var5] & 3;
                     if (s[7166 + var5] == 1 && s[7678 + var5] % (8 - s[25] / 7) == 0) {
                        s[0] = 4;
                     }

                     a(104, 240, 16 * (s[1] + 1), s[0]);
                  }
               }

               if (s[7678 + var5] >= 128) {
                  c(var5);
                  s[95]++;
               }
               break;
            case 106:
               if (var9 == 0) {
                  s[7678 + var5] = 1;
                  s[9738] = 0;
                  a(107, 144, 224, 1792);
                  s[42] = 0;
               }

               if (s[8190 + var5] > 0) {
                  if (s[8190 + var5]++ >= 16) {
                     a(3, 240, 0, 38433);
                     b(113, 16, 240, 0);
                     c(var5);
                  }
               } else if (s[7166 + var5] <= 0) {
                  if (s[7678 + var5] <= s[9738]) {
                     s[7166 + var5]++;
                     s[7678 + var5] = 2;
                     s[9738] = 0;
                     a(107, 128, 224, 16);
                     a(107, 144, 256, 65568);
                  }
               } else if (s[7166 + var5] <= 1 && s[7678 + var5] <= s[9738]) {
                  s[8190 + var5]++;
               }
               break;
            case 107:
               if (var9 == 0) {
                  s[5118 + var5] = -1;
                  s[8702 + var5] = 6;
                  s[9214 + var5] = 8;
                  if (s[60] == 10) {
                     s[9214 + var5] = 32;
                  }
               } else if (s[7166 + var5] > 0) {
                  if (--s[7166 + var5] < 1) {
                     var9 = 0;
                  }
               } else {
                  if (var9 % 12 == 0) {
                     s[5118 + var5] = 0;
                     a(28, var7 + 8, var8 + 0, 8 + s[25] / 7);
                     a(28, var7 + -8, var8 + 16, 8 + s[25] / 7);
                     a(28, var7 + -8, var8 + 32, 8 + s[25] / 7);
                     a(28, var7 + 8, var8 + 48, 8 + s[25] / 7);
                  } else if ((var9 - 1) % 12 == 0) {
                     s[5118 + var5] = -1;
                     if (var8 + 24 < s[1143]) {
                        s[5118 + var5] = 1;
                     }
                  }

                  var8 += s[5118 + var5] * (4 + s[25] / 8);
                  if (3 <= s[8702 + var5]) {
                     for (int var34 = 3; var34 <= s[8702 + var5]; var34++) {
                        a(1, var7 + 16 + I * 4 * (var34 - 3), var8 + 24, 10 + s[8190 + var5], 388, 0);
                     }
                  }

                  if (2 <= s[8702 + var5]) {
                     a(1, var7 + 25, var8 + 24, 10 + s[8190 + var5], 389, 0);
                  }

                  if (1 <= s[8702 + var5]) {
                     a(1, var7 + 40, var8 + 24, 10 + s[8190 + var5], 390, 0);
                  }

                  a(0, var7, var8, 10 + s[8190 + var5], 387, 394246);
                  s[0] = 0;
                  if (s[60] != 10) {
                     s[0] = s[0] + a(var5, var7 + 24, var8 + 0, 64, 16);
                     s[0] = s[0] + a(var5, var7 + 24, var8 + 48, 64, 16);
                  }

                  s[9214 + var5] = s[9214 + var5] - a(var5, var7 + 16, var8 + 24, 48, 16);
                  s[0] = s[0] + a(var5, var7 + 8, var8 + 16, 80, 16);
                  s[0] = s[0] + a(var5, var7 + 8, var8 + 32, 80, 16);
                  if (s[0] > 0) {
                     b(1);
                  }

                  if (s[9214 + var5] <= 0) {
                     s[9214 + var5] = 8;
                     if (s[60] == 10) {
                        s[9214 + var5] = 32;
                     }

                     b(3);
                     if (3 <= s[8702 + var5]) {
                        a(16, var7 + 16 + I * 4 * (s[8702 + var5] - 3), var8 + 24, 0);
                        a(23, var7 + 8, var8 + 24, 262144 | 1 + 2 * (s[25] / 7) << 8 | b(var7 + 16, var8 + 24));
                     } else if (2 <= s[8702 + var5]) {
                        a(16, var7 + 25, var8 + 24, 0);
                        a(23, var7 + 8, var8 + 24, 262144 | 1 + 2 * (s[25] / 7) << 8 | b(var7 + 16, var8 + 24));
                     } else if (1 <= s[8702 + var5]) {
                        a(16, var7 + 42, var8 + 24, 0);
                        s[16] = s[16] + 10000;
                     }

                     s[8702 + var5]--;
                  }

                  if (s[8702 + var5] <= 0) {
                     if (s[8702 + var5]-- <= -16) {
                        a(19, var7 + 24, var8 + 8, 0);
                        a(20, var7 + 40, var8 + 24, 3153926);
                        b(9);
                        s[9738]++;
                        c(var5);
                     }
                  } else if (var9 >= 400) {
                     b(3);
                     a(16, var7 + 42, var8 + 24, 0);
                     s[8702 + var5] = 0;
                  }
               }
               break;
            case 109:
               if (var9 == 0) {
                  s[103] = 54;
                  s[127] = 14;
                  s[104] = 54;
                  s[128] = 50;
                  s[105] = 54;
                  s[129] = 84;
                  s[151] = s[152] = s[153] = 32;
                  s[4] = 0;
                  s[5630 + var5] = var7 - 8;
                  s[6142 + var5] = var8 + 40;
                  s[4606 + var5] = 40;
                  s[5118 + var5] = 40;

                  for (int var3 = 0; var3 < 4; var3++) {
                     b(110, s[5630 + var5] + 0, s[6142 + var5] + 0, var3 << 8 | var5);
                  }

                  s[7166 + var5] = -1;
                  s[9738] = 0;
               } else {
                  if (s[7166 + var5] == -1) {
                     s[5630 + var5] = var7;
                     if (var7 <= 144) {
                        s[43] = 0;
                        s[7166 + var5]++;
                        s[7678 + var5] = 0;
                        s[8190 + var5] = 1;
                     }
                  } else if (s[7166 + var5] == 0) {
                     if (s[7678 + var5] == 0) {
                        s[5630 + var5] = var7 - 8;
                        s[6142 + var5] = var8 + 40;
                        s[4606 + var5] = 40;
                        s[5118 + var5] = 40;
                        s[8702 + var5] = 0;
                     }

                     if (s[7678 + var5] % 64 == 0) {
                        int var13 = s[1126] + s[1143] + s[4]++;
                        s[7166 + var5] = s[1055 + (var13 & 63)] & 3;
                        s[7678 + var5] = 0;
                        s[8190 + var5] = 1;
                     }
                  } else if (s[7166 + var5] == 1) {
                     s[5630 + var5] = s[5630 + var5] - s[8190 + var5] * 16 / 8;
                     s[4606 + var5] = s[4606 + var5] + s[8190 + var5] * 16 / 8;
                     s[5118 + var5] = s[5118 + var5] + s[8190 + var5] * 16 / 8;
                     s[7678 + var5] = s[7678 + var5] + s[8190 + var5];
                     if (32 <= s[7678 + var5]) {
                        s[8190 + var5] = -1;
                     } else if (s[7678 + var5] <= 0) {
                        s[7166 + var5] = 0;
                        s[7678 + var5] = 0;
                        s[8190 + var5] = 1;
                     }
                  } else if (2 <= s[7166 + var5]) {
                     if (s[8702 + var5] == 0) {
                        if (s[7166 + var5] == 2) {
                           s[5630 + var5] = s[5630 + var5] + s[8190 + var5] * 16 / 8;
                           s[6142 + var5] = s[6142 + var5] - s[8190 + var5] * 16 / 8;
                           s[4606 + var5] = s[4606 + var5] - s[8190 + var5] * 16 / 8;
                           s[5118 + var5] = s[5118 + var5] + s[8190 + var5] * 16 / 4;
                        } else if (s[7166 + var5] == 3) {
                           s[5630 + var5] = s[5630 + var5] - s[8190 + var5] * 16 / 8;
                           s[6142 + var5] = s[6142 + var5] - s[8190 + var5] * 16 / 2;
                           s[4606 + var5] = s[4606 + var5] + s[8190 + var5] * 16 / 4;
                           s[5118 + var5] = s[5118 + var5] - s[8190 + var5] * 16 / 8;
                        }

                        s[7678 + var5] = s[7678 + var5] + s[8190 + var5];
                        if (12 <= s[7678 + var5]) {
                           s[8702 + var5]++;
                        } else if (s[7678 + var5] <= 0) {
                           s[7166 + var5] = 0;
                           s[7678 + var5] = 0;
                           s[8190 + var5] = 1;
                        }
                     } else {
                        s[7678 + var5] = s[7678 + var5] + s[8190 + var5];
                        if (48 <= s[7678 + var5]) {
                           s[8190 + var5] = -1;
                        } else if (s[7678 + var5] <= 12) {
                           s[8702 + var5]--;
                        }
                     }
                  }

                  a(0, var7, var8 + 96, 11, 393, 393990);
                  a(0, var7 + 48, var8, 11, 392, 198147);

                  for (int var33 = 0; var33 < 3; var33++) {
                     s[0] = 395;
                     if (s[151 + var33] > 0) {
                        s[0] = 394;
                        s[151 + var33] = s[151 + var33] - a(var5, var7 + s[103 + var33] + 4, var8 + s[127 + var33], 32, 16);
                        if (s[151 + var33] <= 0) {
                           s[16] = s[16] + 10000;
                           b(3);
                           a(16, var7 + s[103 + var33], var8 + s[127 + var33], 0);
                           s[9738]++;
                        }
                     }

                     a(1, var7 + s[103 + var33], var8 + s[127 + var33], 12, s[0], 0);
                  }

                  if (-2 < s[7166 + var5]) {
                     a(var5, var7 + 64, var8 + 0, 32, 144);
                     a(var5, var7 + 56, var8 + 0, 40, 16);
                     a(var5, var7 + 52, var8 + 32, 44, 16);
                     a(var5, var7 + 48, var8 + 66, 64, 16);
                     a(var5, var7 + 24, var8 + 104, 72, 24);
                     a(var5, var7 + 8, var8 + 128, 88, 16);
                     if (s[9738] >= 3 || var9 >= 800) {
                        s[7166 + var5] = -2;
                        this.a();
                        b(9);
                        a(19, var7 + 64, var8 + 64, 0);
                        a(20, var7 + 64, var8 + 64, 4210698);
                     }
                  } else {
                     s[7166 + var5]--;
                     if (-30 <= s[7166 + var5]) {
                        if ((s[7166 + var5] & 1) == 0) {
                           b(9);
                        }
                     } else {
                        s[34]++;
                     }

                     a(5, (-2 - s[7166 + var5]) * 16 / 4, 0, 2, 0, 0);
                  }
               }
               break;
            case 114:
            case 115:
               if (var7 + 16 < 0) {
                  c(var5);
               } else {
                  int var1 = 83 + (s[3070 + var5] - 114) * 4;
                  s[0] = 1;
                  if (var9 >= 228) {
                     if (var9 % 2 == 0) {
                        s[0] = 0;
                     }
                  } else if (var9 >= 204) {
                     if (var9 % 3 == 0) {
                        s[0] = 0;
                     }
                  } else if (var9 >= 180 && var9 % 4 == 0) {
                     s[0] = 0;
                  }

                  if (s[0] == 1) {
                     a(1, var7, var8, 15, var1 + (var9 & 3), 0);
                  }

                  if (var9 >= 252) {
                     c(var5);
                  } else if (s[1126] + 8 < var7 + 16 && var7 < s[1126] + 28 && s[1143] + 2 < var8 + 16 && var8 < s[1143] + 12) {
                     if (s[3070 + var5] == 115) {
                        s[16] = s[16] + 1000;
                        s[80] = ++s[80] % 7;
                        if (s[80] == 0) {
                           s[80]++;
                        }
                     } else {
                        s[16] = s[16] + 100;
                        s[79] = ++s[79] % 7;
                        if (s[79] == 0) {
                           s[79]++;
                        }
                     }

                     b(5);
                     c(var5);
                  }

                  if (s[86] == 8) {
                     var7 -= s[90] * 16;
                     var8 -= s[91] * 16;
                  }
               }
         }

         if (J == 0) {
            s[3582 + var5] = var7 + s[43] * I;
            s[4094 + var5] = var8;
            s[6654 + var5] = ++var9;
         }

         var5 = var6;
      }
   }

   private void j(Graphics var1) {
      int var4 = s[57];

      while (var4 != -1) {
         int var5 = s[2558 + var4];
         int var6 = s[3582 + var4];
         int var7 = s[4094 + var4];
         int var8 = s[6654 + var4];
         I = -1;
         int var9 = (I + 1) / 2;
         J = 0;
         switch (s[3070 + var4]) {
            case 33:
            case 34:
            case 35:
            case 36:
               if (var8 == 0) {
                  if (s[7166 + var4] < 1) {
                     s[7166 + var4] = 1;
                  }

                  s[5630 + var4] = s[3582 + var4];
                  s[6142 + var4] = s[4094 + var4];
                  s[4606 + var4] = 0;
                  s[5118 + var4] = (s[3070 + var4] - 33) / 2;
               }

               if (s[85] > 0) {
                  s[85] = 0;
                  d(var4);
               } else {
                  if (s[8702 + var4] == 1) {
                     var6 = s[3582 + s[8190 + var4]] + s[5630 + var4];
                     var7 = s[4094 + s[8190 + var4]] + s[6142 + var4];
                  }

                  if (s[4606 + var4] <= 0) {
                     if (s[7678 + var4] == 0) {
                        a(2, var6 - 16 + var9 * 16, var7 - 8, 14, 244 + (var8 & 1) * 1, 0);
                        if (var8 >= 3) {
                           s[4606 + var4]++;
                        }
                     } else if (s[7678 + var4] == 1) {
                        a(2, var6 - 16 + var9 * 16, var7 - 8, 14, 244 + (var8 & 1) * 1, 0);
                        if (var8 >= 7) {
                           s[4606 + var4]++;
                        }
                     } else if (s[7678 + var4] == 2) {
                        a(0, var6, var7, 13, 401 + var8, 66052);
                        if (var8 >= 3) {
                           s[4606 + var4]++;
                        }
                     }
                  } else {
                     if (s[4606 + var4] == 1) {
                        b(8);
                     }

                     a(1, var6, var7 - (1 - s[5118 + var4]) * 16 / 2, 14, 247 + s[5118 + var4] * 2, 0);

                     for (int var21 = var6 + I * 16; I * var21 <= 120 + I * 240 / 2; var21 += I * 16) {
                        a(1, var21, var7 - (1 - s[5118 + var4]) * 16 / 2, 14, 246 + s[5118 + var4] * 2, 0);
                     }

                     a(var4, var9 * var6, var7, I * (var9 * 240 - var6) + 16, 16 + s[5118 + var4] * 16);
                     if (s[4606 + var4]++ >= s[7166 + var4]) {
                        d(var4);
                     }
                  }
               }
               break;
            case 87:
               if (var8 == 0) {
                  var8 = 64 + 64 / s[8702 + var4] * s[8190 + var4];
                  s[8190 + var4] = 0;
                  s[4606 + var4] = 1;
                  s[9214 + var4] = 4 + s[25];
               }

               s[0] = var8 % 64;
               var6 = (s[5630 + s[7166 + var4]] >> 4) + 16 + (s[455 + s[0]] * 16 * 3 / 2 >> 4);
               var7 = (s[6142 + s[7166 + var4]] >> 4) + 16 + (s[471 + s[0]] * 16 * 3 >> 4);
               s[1] = 13;
               if (32 < s[0]) {
                  s[1] = 10;
               }

               if (s[4606 + var4] > 0) {
                  a(1, var6, var7, s[1], 291, 0);
               }

               if (s[4606 + var4] <= 0) {
                  s[4606 + var4]++;
                  if (0 < s[4606 + var4]) {
                     s[9214 + var4] = 8;
                  } else if (-1 <= s[4606 + var4]) {
                     a(1, var6, var7, s[1], 123 - s[4606 + var4], 0);
                  }
               } else if (s[8190 + var4] == 0) {
                  if (var8 % (48 - s[25]) == 0) {
                     a(21, var6, var7, 0);
                  }
               } else if (s[8190 + var4] == 1) {
                  if (var8 % (48 - s[25]) == 0) {
                     a(26, var6, var7, 8);
                  }
               } else if (s[8190 + var4] == 2 && var8 % (48 - s[25]) == 0) {
                  a(23, var6, var7, 262960);
               }

               if (s[9738] <= 0 && (s[4606 + var4] <= 0 || (s[9214 + var4] = s[9214 + var4] - a(var4, var6, var7, 16, 16)) > 0)) {
                  break;
               }

               s[4606 + var4] = -24;
               s[8190 + var4] = ++s[8190 + var4] % 3;
               s[16] = s[16] + 500;
               a(16, var6, var7, 0);
               if (s[9738] > 0) {
                  d(var4);
               }
               break;
            case 95:
               if (var8 == 0) {
                  var8 = 64 + 8 * s[7678 + var4];
                  s[9214 + var4] = 255;
               }

               s[0] = 64 - var8 % 64;
               var6 = s[3582 + s[7166 + var4]] + 48 + (s[455 + s[0]] * 16 * 1 / 2 >> 4);
               var7 = s[4094 + s[7166 + var4]] + 24 + (s[471 + s[0]] * 16 * 4 >> 4);
               short var12 = 350;
               s[1] = 13;
               if (4 <= s[0] && s[0] <= 28) {
                  var12 = 351;
                  s[1] = 14;
               } else if (36 <= s[0] && s[0] <= 60) {
                  var12 = 352;
                  s[1] = 10;
               }

               a(2, var6, var7, s[1], var12, 0);
               if (s[7166 + s[7166 + var4]] > 0) {
                  s[2] = s[6654 + s[7166 + var4]];
                  if (s[2] % (16 - s[25] / 3) == 0 && s[2] % 10 == s[7678 + var4]) {
                     a(24, var6, var7, s[1] << 8 | 8);
                  }
               }

               if (s[9738] > 0) {
                  d(var4);
                  a(16, var6 + 8, var7, 0);
               }

               a(var4, var6 + 8, var7, 24, 16);
               break;
            case 98:
               int var10 = s[7678 + var4] * 2 - 1;
               if (var8 == 0) {
                  s[9214 + var4] = 256 + s[25] * 8;
                  s[5630 + var4] = -4;
                  s[6142 + var4] = 10;
                  if (s[7678 + var4] == 1) {
                     s[5630 + var4] = -14;
                     s[6142 + var4] = 32;
                  }

                  s[4606 + var4] = s[5630 + var4];
                  s[5118 + var4] = s[6142 + var4];
               } else {
                  short var2 = 353;
                  if (s[7678 + var4] == 1) {
                     var2 = 354;
                  }

                  if (s[7166 + s[7166 + var4]] == -1) {
                     int var17 = 32 - s[25] / 2;
                     if (var8 % var17 == 0) {
                        a(65, var6 + 64 + 2 - (1 - s[7678 + var4]) * 16 * 5 / 8, var7 + s[7678 + var4] * 16 + var10 * 16 / 4, 1536 | 16 - 1 * var10 * 16);
                     } else if (var8 % var17 == var17 / 2) {
                        a(65, var6 + 48 + 2 - (1 - s[7678 + var4]) * 16 * 5 / 8, var7 + s[7678 + var4] * 16 + var10 * 16 / 4, 1536 | 16 - 1 * var10 * 16);
                     }
                  } else if (s[7166 + s[7166 + var4]] >= 0) {
                     s[0] = s[7166 + s[7166 + var4]];
                     if (s[0] > 12) {
                        s[0] = 12;
                     }

                     s[5630 + var4] = s[4606 + var4] + s[0] * 16 / 4;
                     s[6142 + var4] = s[5118 + var4] + var10 * s[0] * 16 / 4;
                  }

                  var6 = s[3582 + s[7166 + var4]] + s[5630 + var4];
                  var7 = s[4094 + s[7166 + var4]] + s[6142 + var4];
                  a(0, var6, var7, 14, var2, 393734);
                  if (s[7678 + var4] == 0) {
                     int var18;
                     if ((var18 = a(var4, var6 + 4, var7 + 4, 80, 24)) > 0) {
                        s[9214 + var4] = s[9214 + var4] - var18;
                     }
                  } else if (s[7678 + var4] == 1) {
                     int var19;
                     if ((var19 = a(var4, var6 + 8, var7 + 8, 80, 16)) > 0) {
                        s[9214 + var4] = s[9214 + var4] - var19;
                     } else if ((var19 = a(var4, var6 + 40, var7 + 24, 48, 4)) > 0) {
                        s[9214 + var4] = s[9214 + var4] - var19;
                     }
                  }

                  if (s[9214 + var4] > 0 && s[9738] == 0) {
                     break;
                  }

                  if (s[9738] == 0) {
                     s[16] = s[16] + 5000;
                  }

                  s[8702 + s[7166 + var4]]++;
                  a(20, var6 + 40, var7 + 8, 2623496);
                  b(3);
                  d(var4);
               }
               break;
            case 110:
               if (var8 == 0) {
                  var8 = 16 + s[7678 + var4] * 64 / 4;
               } else {
                  s[0] = (var8 * 2 + s[7678 + var4] * 64 * 1 / 4) % 64;
                  var6 = s[5630 + s[7166 + var4]] + (s[455 + s[0]] * s[4606 + s[7166 + var4]] >> 4);
                  var7 = s[6142 + s[7166 + var4]] + (s[471 + s[0]] * s[5118 + s[7166 + var4]] >> 4);
                  if (s[8702 + s[7166 + var4]] != 0) {
                     if (s[7166 + s[7166 + var4]] == 2) {
                        if (var8 % (24 - s[25] / 2 - s[7678 + var4]) == 0) {
                           int var23 = var8 + s[1126] + s[1143];
                           a(30, var6 - 16, var7 + 8 + s[1055 + (var23 & 63)] % 2 * 16 / 2, 8 + s[25] / 7);
                        }
                     } else if (s[7166 + s[7166 + var4]] == 3 && var8 % (32 - s[25] / 2 - s[7678 + var4] * 2) == 0) {
                        a(21, var6, var7 + 8, 0);
                     }
                  }

                  a(0, var6, var7, 13, 396, 66049);
                  a(var4, var6, var7 + 8, 16, 16);
                  if (s[7166 + s[7166 + var4]] <= -2) {
                     b(3);
                     a(18, var6 - 32, var7, 0);
                     d(var4);
                  }
               }
               break;
            case 111:
               if (var8 == 0) {
                  if (s[7166 + var4] == 0) {
                     s[9741] = s[9743] = 24;
                     s[42] = 0;
                  } else if (s[7166 + var4] == 1) {
                     s[43] = 4;
                     a(3, 240, 0, 17420);
                  }
               }

               if (s[7166 + var4] == 0) {
                  if (var8 == 100) {
                     a(3, 240, 0, 30);
                  }

                  if (s[7678 + var4] == 0) {
                     if (var6 <= I * 16 * 3) {
                        s[43] = 0;
                        s[53] = 0;
                        s[7678 + var4]++;
                     }
                  } else if (s[7678 + var4] == 1) {
                     s[9741] = s[9741] - 4;
                     s[9743] = s[9743] - 4;
                     if (s[9741] <= 0) {
                        s[9739] = s[9740] = s[9741] = s[9742] = s[9743] = s[9744] = s[9745] = s[9746] = 0;
                        d(var4);
                        s[41] = 7;
                        s[86] = 3;

                        for (int var14 = 0; var14 < 20; var14++) {
                           s[9751 + var14] = 0;
                        }

                        for (int var15 = 1; var15 < 13; var15++) {
                           s[1265 + var15 * 16 + s[52] / 16 % 16] = 1;
                           s[1265 + var15 * 16 + (s[52] / 16 + 14) % 16] = 1;
                        }
                     }
                  }
               } else if (s[7166 + var4] == 1) {
                  if (var6 <= -304) {
                     s[7166 + var4]++;
                     s[5118 + var4] = 4;
                     s[43] = 0;
                     s[52] = 0;
                     s[53] = 0;
                  }
               } else if (s[7166 + var4] == 2) {
                  if (--s[5118 + var4] <= 0) {
                     s[41] = 8;
                     s[42] = 1;
                     d(var4);
                  }

                  if (s[22] == 0) {
                     a(1, 0, 0, 0, s[5118 + var4], 0);
                  }
               }

               if (s[7166 + var4] == 2) {
                  break;
               }

               a(0, var6 + 32, 16, 6, 336, 66305);
               a(1, var6 + 32, 64, 6, 339, 0);
               a(1, var6 + 32, 144, 6, 340, 0);
               a(0, var6 + 32, 160, 6, 336, 66305);
               a(0, var6 + 48, 16, 6, 335, 66305);
               a(1, var6 + 48, 64, 6, 337, 0);
               a(1, var6 + 48, 144, 6, 338, 0);
               a(0, var6 + 48, 160, 6, 335, 66305);
               a(0, var6 + 272, 16, 6, 336, 66305);
               a(1, var6 + 272, 64, 6, 339, 0);
               a(1, var6 + 272, 144, 6, 340, 0);
               a(0, var6 + 272, 160, 6, 336, 66305);
               a(1, var6 + 32, var7, 7, 342, 0);
               a(1, var6 + 32, var7 + 208, 7, 344, 0);
               a(1, var6 + 48, var7, 7, 341, 0);
               a(1, var6 + 48, var7 + 208, 7, 343, 0);
               a(1, var6 + 272, var7, 7, 342, 0);
               a(1, var6 + 272, var7 + 208, 7, 344, 0);
               a(0, var6 + 136, var7 + 0 - s[9744], 7, 345, 131329);
               a(0, var6 + 168, var7 + 0 + s[9744], 7, 346, 131329);
               a(0, var6 + 136, var7 + 208 - s[9746], 7, 345, 131329);
               a(0, var6 + 168, var7 + 208 + s[9746], 7, 346, 131329);
               a(0, var6 + 32, var7 + 80 - s[9741], 7, 347, 66049);
               a(0, var6 + 32, var7 + 112 + s[9741], 7, 348, 66049);
               a(0, var6 + 48, var7 + 80 - s[9743], 7, 347, 66049);
               a(0, var6 + 48, var7 + 112 + s[9743], 7, 348, 66049);
               a(0, var6 + 272, var7 + 80 - s[9745], 7, 347, 66049);
               a(0, var6 + 272, var7 + 112 + s[9745], 7, 348, 66049);
               a(var4, var6 + 32, var7 + 16, 32, 72);
               a(var4, var6 + 32, var7 + 136, 32, 72);
               if (s[7166 + var4] == 0) {
                  a(var4, var6 + 272, var7 + 16, 16, 192);
               } else {
                  if (s[7166 + var4] != 1) {
                     break;
                  }

                  a(0, var6 + 288, var7 + 80 - 24, 7, 347, 66049);
                  a(0, var6 + 288, var7 + 112 + 24, 7, 348, 66049);
                  a(1, var6 + 288, 0, 6, 338, 0);
                  a(0, var6 + 288, 16, 6, 335, 66305);
                  a(1, var6 + 288, 64, 6, 337, 0);
                  a(1, var6 + 288, 144, 6, 338, 0);
                  a(0, var6 + 288, 160, 6, 335, 66305);
                  a(1, var6 + 288, 208, 6, 337, 0);

                  for (int var16 = 0; var16 < 5; var16++) {
                     a(0, var6 + 48 + var16 * 16 * 3, 0, 6, 333, 196867);
                     a(0, var6 + 48 + var16 * 16 * 3, 208, 6, 334, 196867);
                  }

                  a(var4, var6 + 272, var7 + 16, 32, 64);
                  a(var4, var6 + 272, var7 + 144, 32, 64);
                  a(var4, var6 + 48, var7 + 0, 240, 16);
                  a(var4, var6 + 48, var7 + 208, 240, 16);
               }
               break;
            case 112:
               if (var8 == 0) {
                  s[94] = 0;
                  s[95] = 0;
               }

               if (s[8702 + var4] == 0) {
                  switch (s[7166 + var4]) {
                     case 1:
                        a(103, 0, 0, 0);
                        s[94]++;
                        s[8702 + var4]++;
                        break;
                     case 2:
                        a(101, 0, 0, 0);
                        s[94]++;
                        s[8702 + var4]++;
                        break;
                     case 3:
                        a(61, 240, 32, 16777217);
                        s[94]++;
                        a(61, 240, 64, 16777217);
                        s[94]++;
                        a(59, 240, 160, 16777217);
                        s[94]++;
                        a(59, 240, 192, 16777217);
                        s[94]++;
                        a(62, -32, 32, 16777217);
                        s[94]++;
                        a(62, -32, 64, 16777217);
                        s[94]++;
                        a(60, -32, 160, 16777217);
                        s[94]++;
                        a(60, -32, 192, 16777217);
                        s[94]++;
                        s[7678 + var4] = 140;
                        s[8702 + var4]++;
                        break;
                     case 4:
                        if (var8 % 16 == 0) {
                           int var11 = s[16] / 100 + s[1126] + s[1143] + s[8190 + var4];
                           s[0] = (s[1055 + (var11 & 63)] & 15) % 12;
                           a(43, 240, 16 * (s[0] + 1), (s[8190 + var4] & 1) + 1 << 24 | s[8190 + var4] << 16 | 0 | 4 + s[25] / 7);
                           s[94]++;
                           s[8190 + var4]++;
                           s[8190 + var4] = s[8190 + var4] & 7;
                        }

                        if (var8 >= 240) {
                           s[8702 + var4]++;
                           s[7678 + var4] = 280;
                        }
                        break;
                     case 5:
                        if (var8 == 0) {
                           s[94] = 8;
                        }

                        if (var8 % 90 == 0) {
                           a(59, 240, 176, 257);
                           a(62, -32, 32, 257);
                        } else if (var8 % 45 == 0) {
                           a(61, 240, 32, 257);
                           a(60, -32, 176, 257);
                        }

                        if (var8 >= 135) {
                           s[8702 + var4]++;
                           s[7678 + var4] = 225;
                        }
                        break;
                     case 6:
                        a(100, 0, 0, 0);
                        s[94]++;
                        s[8702 + var4]++;
                        break;
                     case 7:
                        a(103, 0, 0, 1);
                        s[94]++;
                        s[8702 + var4]++;
                        break;
                     case 8:
                        if (var8 == 0) {
                           s[94] = 2;
                           a(79, 240, 48, 0);
                        }

                        if (var8 == 48) {
                           a(79, 240, 160, 0);
                           s[8702 + var4]++;
                        }
                        break;
                     case 9:
                        a(86, 240, 144, 0);
                        s[94]++;
                        s[8702 + var4]++;
                        break;
                     case 10:
                        a(102, 0, 0, 0);
                        s[94]++;
                        s[8702 + var4]++;
                        break;
                     case 11:
                        a(80, 112, 112, 4);
                        s[94]++;
                        s[8702 + var4]++;
                        break;
                     case 12:
                        for (int var13 = 0; var13 < 14; var13++) {
                           a(74 + var13 / 7, 240 - var13 / 7 * 272, 16 + var13 % 7 * 16 * 2, 0);
                           s[94]++;
                        }

                        s[7678 + var4] = 180;
                        s[8702 + var4]++;
                        break;
                     case 13:
                        a(105, 0, 0, 1);
                        s[94]++;
                        s[8702 + var4]++;
                        break;
                     case 14:
                        a(78, 240, 48, 0);
                        s[94]++;
                        a(78, 240, 144, 0);
                        s[94]++;
                        s[8702 + var4]++;
                        break;
                     case 15:
                        a(105, 0, 0, 0);
                        s[94]++;
                        s[8702 + var4]++;
                        break;
                     case 16:
                        a(101, 0, 0, 1);
                        s[94]++;
                        s[8702 + var4]++;
                        break;
                     case 17:
                        a(80, 112, 112, 1);
                        s[94]++;
                        s[8702 + var4]++;
                        break;
                     case 18:
                        a(78, 240, 144, 0);
                        s[94]++;
                        a(78, -32, 48, 0);
                        s[94]++;
                        s[8702 + var4]++;
                        break;
                     case 19:
                        if (var8 == 0) {
                           s[94] = 3;
                           a(79, 240, 104, 0);
                        }

                        if (var8 == 32) {
                           a(79, 240, 48, 0);
                        }

                        if (var8 == 64) {
                           a(79, 240, 160, 0);
                           s[8702 + var4]++;
                        }
                  }
               }

               if (s[94] <= s[95] || s[7678 + var4] != 0 && var8 >= s[7678 + var4]) {
                  d(var4);
                  s[86] = 3;
               }
               break;
            case 113:
               if (s[7166 + var4] == 0) {
                  if (s[53] % 48 == 0) {
                     s[53] = s[53] - 2;
                     s[41] = 0;
                     s[7166 + var4]++;
                  }
               } else if (s[7166 + var4] != 1) {
                  if (s[7166 + var4] == 2) {
                     if (--s[4606 + var4] <= 0) {
                        s[41] = 9;
                        s[43] = 2;
                        s[42] = 1;
                        d(var4);
                     }

                     if (s[22] == 0) {
                        a(3, 0, 0, 0, s[4606 + var4], 0);
                     }
                  }
               } else {
                  s[53] = s[53] + 2;
                  if (s[22] == 0) {
                     for (int var3 = 0; var3 < 5; var3++) {
                        var1.drawRegion(
                           this.f[4],
                           (B[299] >> 24 & 0xFF) * 3 / 4,
                           (B[299] >> 16 & 0xFF) * 3 / 4,
                           (B[299] >> 8 & 0xFF) * 3 / 4,
                           (B[299] & 0xFF) * 3 / 4,
                           0,
                           0,
                           ((var7 - 240) / 48 * 48 - s[53] % 48 + var3 * 48) * 3 / 4,
                           20
                        );
                        var1.drawRegion(
                           this.f[4],
                           (B[300] >> 24 & 0xFF) * 3 / 4,
                           (B[300] >> 16 & 0xFF) * 3 / 4,
                           (B[300] >> 8 & 0xFF) * 3 / 4,
                           (B[300] & 0xFF) * 3 / 4,
                           0,
                           132,
                           ((var7 - 240) / 48 * 48 - s[53] % 48 + var3 * 48) * 3 / 4,
                           20
                        );
                     }
                  }

                  a(0, 0, var7, 6, 334, 196865);
                  a(0, 48, var7, 6, 334, 196865);
                  a(0, 144, var7, 6, 334, 196865);
                  a(0, 192, var7, 6, 334, 196865);
                  a(0, 0, var7 + 16, 6, 333, 196865);
                  a(0, 48, var7 + 16, 6, 333, 196865);
                  a(0, 144, var7 + 16, 6, 333, 196865);
                  a(0, 192, var7 + 16, 6, 333, 196865);
                  a(0, 64, var7, 7, 345, 131329);
                  a(0, 144, var7, 7, 346, 131329);
                  a(0, 64, var7 + 16, 7, 345, 131329);
                  a(0, 144, var7 + 16, 7, 346, 131329);
                  a(var4, 0, var7, 96, 32);
                  a(var4, 144, var7, 96, 32);
                  if (var7 <= -48) {
                     s[7166 + var4]++;
                     s[52] = 0;
                     s[53] = 0;
                     s[4606 + var4] = 4;
                  } else {
                     var7 -= 2;
                  }
               }
         }

         if (J == 0) {
            s[3582 + var4] = var6 + s[43] * I;
            s[4094 + var4] = var7;
            s[6654 + var4] = ++var8;
         }

         var4 = var5;
      }
   }

   private void h() {
      if (s[76] < -40) {
         if (s[76] == -52) {
            b(10);

            for (int var2 = 0; var2 < 20; var2++) {
               s[1245 + var2] = -1;
            }
         }

         if (s[76] < -48) {
            a(0, s[1126], s[1143] - 2 - 8, 15, 113 + (s[76] - -52), 131592);
         }

         s[76]++;
         if (s[76] == -40) {
            s[1126] = 32;
            s[1143] = 104;
            s[63] = 0;
            s[64] = 48;
            s[59] = 5;
            s[60] = 0;
            s[61] = 0;
            s[65] = 2;
            s[84] = 0;
            s[62] = 0;

            for (int var7 = 1; var7 < 17; var7++) {
               s[1126 + var7] = s[1126];
               s[1143 + var7] = s[1143];
            }

            for (int var8 = 1; var8 < 5; var8++) {
               s[1160 + var8] = s[1126 + var8 * 4];
               s[1165 + var8] = s[1143 + var8 * 4];
            }

            s[82] = 0;
            s[81] = 0;
            s[83] = 0;
            s[1119] = 1;
            s[79] = 1;
            s[1143] = s[1143] + s[54];
            s[1126] = -32;

            for (int var9 = 1; var9 < 17; var9++) {
               s[1126 + var9] = -32;
               s[1143 + var9] = 112;
            }

            e();
            if (--s[17] < 0) {
               b = 21;
               s[17] = 0;
               return;
            }
         }
      } else {
         if (s[76] < -32) {
            for (int var28 = 16; var28 >= 1; var28--) {
               s[1126 + var28] = s[1126 + (var28 - 1)];
               s[1143 + var28] = s[1143 + (var28 - 1)];
            }

            s[1126] = s[1126] + 8;
            s[1160] = s[1126];
            s[1165] = s[1143];

            for (int var29 = 1; var29 <= s[65]; var29++) {
               s[1160 + var29] = s[1126 + var29 * 4];
               s[1165 + var29] = s[1143 + var29 * 4];
            }

            for (int var30 = 1; var30 <= s[65]; var30++) {
               int var6;
               if ((s[9] & 3) == 0) {
                  var6 = 104 + s[84] * 3;
               } else {
                  var6 = 104 + (s[9] & 3) - 1 + s[84] * 3;
               }

               a(1, s[1160 + var30] + 8, s[1165 + var30], 15, var6, 0);
            }

            a(3, s[1126], s[1143], 15, 0, 0);
            s[76]++;
            return;
         }

         if (s[76] <= 0) {
            if ((s[12] & 4194304) != 0 && s[79] >= 1) {
               switch (s[79]) {
                  case 1:
                     if (s[59] < 13) {
                        s[59] = s[59] + 2;
                        s[79] = 0;
                        b(7);
                     }
                     break;
                  case 2:
                     if (s[61] <= 0) {
                        s[61] = 20;
                        if (s[69] == 1) {
                           s[61] = 21;
                        }

                        s[79] = 0;
                        b(7);
                     }
                     break;
                  case 3:
                     if (s[60] == 0 || s[60] >= 8) {
                        s[60] = 1;
                        if (s[70] == 1) {
                           s[60] = 3;
                        } else if (s[70] == 2) {
                           s[60] = 5;
                        } else if (s[70] == 3) {
                           s[60] = 7;
                        }

                        s[79] = 0;
                        b(7);
                     }
                     break;
                  case 4:
                     if (s[60] < 8) {
                        s[60] = 8;
                        s[79] = 0;
                        b(7);
                     }
                     break;
                  case 5:
                     if (s[65] < 4) {
                        s[65]++;
                        if (s[81] == 6) {
                           s[1160 + s[65]] = s[1126] - 16;
                           s[1165 + s[65]] = s[1143];
                        }

                        s[79] = 0;
                        b(7);
                     } else if (s[71] == 1 && s[84] < 2) {
                        s[84]++;
                        s[79] = 0;
                        b(7);
                     }
                     break;
                  case 6:
                     if (s[62] <= 0) {
                        s[62] = 6;
                        s[79] = 0;
                        b(7);
                     }
               }

               f();
               e();
            }

            if ((s[12] & 8388608) != 0 && s[80] >= 1 && s[1119 + s[80]] == 0) {
               s[1119 + s[80]] = 1;
               s[80] = 0;
               b(7);
            }

            if (s[86] < 6) {
               if ((s[11] & 102) != 0) {
                  for (int var10 = 16; var10 >= 1; var10--) {
                     s[1126 + var10] = s[1126 + (var10 - 1)];
                     s[1143 + var10] = s[1143 + (var10 - 1)];
                  }
               }

               int var3 = 0;
               int var11 = 0;
               if ((s[11] & 64) != 0) {
                  if (s[41] != 3) {
                     s[1143] = s[1143] + s[59];
                  } else {
                     s[1143] = s[1143] + s[59];
                     if (s[41] == 3 && s[1143] - s[54] >= 144) {
                        s[44] = s[44] + s[59];
                     }
                  }

                  s[63] = s[63] + 2;
                  var11++;
                  if ((s[11] & 65568) == 0) {
                     var3 += 64;
                  }
               }

               if ((s[11] & 2) != 0) {
                  if (s[41] != 3) {
                     s[1143] = s[1143] - s[59];
                  } else {
                     s[1143] = s[1143] - s[59];
                     if (s[41] == 3 && s[1143] - s[54] < 80) {
                        s[44] = s[44] - s[59];
                     }
                  }

                  s[63] = s[63] - 2;
                  var11++;
                  var3 += 32;
               }

               if ((s[11] & 32) != 0) {
                  s[1126] = s[1126] + s[59];
                  var11++;
                  var3 += 16;
               }

               if ((s[11] & 4) != 0) {
                  s[1126] = s[1126] - s[59];
                  var11++;
                  var3 += 48;
               }

               if (s[60] == 17) {
                  if ((s[12] & 4096) != 0) {
                     a[6] = !a[6];
                  }

                  if (!a[6] && 0 < var11 && var11 <= 2 && (var3 = (var3 = var3 / var11) % 64) != s[64]) {
                     byte var13;
                     if ((var11 = var3 - s[64]) > -32 && 32 > var11) {
                        var13 = 1;
                     } else {
                        var13 = -1;
                     }

                     if (var3 > s[64]) {
                        s[64] = s[64] + var13 * 4;
                     } else {
                        s[64] = s[64] - var13 * 4;
                     }

                     s[64] = (s[64] + 64) % 64;
                  }
               }
            }

            int var1 = 3;
            if (s[76] != 0) {
               s[76]++;
               if ((s[76] & 3) >= 2) {
                  var1 = 0;
               }
            } else {
               if (0 < s[62] && (c(s[1126] + 4, s[1143] + 2 - s[54]) | c(s[1126] + 20, s[1143] + 2 - s[54])) < 0) {
                  s[62]--;
               }

               if (c(s[1126] + 10, s[1143] - s[54]) < 0) {
                  s[76] = -52;
               }
            }

            if (s[1126] < -4) {
               s[1126] = -4;
            }

            if (208 < s[1126]) {
               s[1126] = 208;
            }

            if (s[41] == 2) {
               if (s[1143] < s[54] + 12) {
                  s[1143] = s[54] + 12;
               }

               if (s[54] + 224 - 12 < s[1143]) {
                  s[1143] = s[54] + 224 - 12;
               }
            } else {
               if (s[1143] < 12) {
                  s[1143] = 12;
               }

               if (s[36] - 12 < s[1143]) {
                  s[1143] = s[36] - 12;
               }
            }

            a(var1, s[1126], s[1143], 15, 0, 0);
            if ((s[12] & 1046784) != 0) {
               int var14 = 1;

               int var33;
               for (var33 = 0; var14 < 7; var14++) {
                  if (s[1119 + var14] == 1) {
                     var33++;
                  }
               }

               if ((s[12] & 129024) != 0) {
                  var33 = 0;

                  for (int var4 = 1; var4 <= 6; var4++) {
                     if ((s[12] >> var4 & 1024) != 0 && s[1119 + var4] == 1 && s[81] != var4) {
                        var33 = var4;
                     }
                  }
               } else if ((s[12] & 917504) != 0) {
                  var33 = 0;
                  if (s[81] != 0) {
                     var33 = 7;
                  }
               }

               if (var33 > 0 && s[82] == 0) {
                  if (s[81] == 3 && s[1245] != -1 && s[1225] < 21) {
                     s[1225] = 21;
                  } else if (s[81] == 6) {
                     for (int var15 = 1; var15 <= s[65]; var15++) {
                        s[1245 + var15 * 4] = -1;
                     }
                  }

                  if ((s[12] & 256) != 0) {
                     do {
                        s[81]++;
                        s[81] = s[81] % 7;
                     } while (s[1119 + s[81]] == 0);
                  } else {
                     s[81] = var33 % 7;
                  }

                  for (int var16 = 1; var16 < 5; var16++) {
                     s[1170 + var16] = s[1160 + var16] << 4;
                     s[1175 + var16] = s[1165 + var16] << 4;
                  }

                  s[82] = 1;
                  b(6);
               }
            }

            s[1160] = s[1126];
            s[1165] = s[1143];
            if (s[82] == 0) {
               switch (s[81]) {
                  case 0:
                     for (int var19 = 1; var19 <= s[65]; var19++) {
                        s[1160 + var19] = s[1126 + var19 * 4];
                        s[1165 + var19] = s[1143 + var19 * 4];
                     }
                     break;
                  case 1:
                     for (int var18 = 1; var18 < 5; var18++) {
                        s[1160 + var18] = s[1126] + (s[471 + (s[9] * 2 + 32 * var18 + 16 * (var18 / 3)) % 64] * 48 >> 4);
                        s[1165 + var18] = s[1143] + (s[455 + (s[9] * 2 + 32 * var18 + 16 * (var18 / 3)) % 64] * 42 >> 4);
                     }
                     break;
                  case 2:
                     s[1161] = s[1126] + 48;
                     s[1166] = s[1143] + 0;
                     s[1162] = s[1126] + 0;
                     s[1167] = s[1143] + -48;
                     s[1163] = s[1126] + 0;
                     s[1168] = s[1143] + 48;
                     s[1164] = s[1126] + -48;
                     s[1169] = s[1143] + 0;
                     break;
                  case 3:
                     s[1161] = s[1126] + 32;
                     s[1166] = s[1143] + -8;
                     s[1162] = s[1126] + 32;
                     s[1167] = s[1143] + 8;
                     s[1163] = s[1126] + 48;
                     s[1168] = s[1143] + -16;
                     s[1164] = s[1126] + 48;
                     s[1169] = s[1143] + 16;
                     break;
                  case 4:
                     s[1161] = s[1126] + -32;
                     s[1166] = s[1143] + -16;
                     s[1162] = s[1126] + -32;
                     s[1167] = s[1143] + 16;
                     s[1163] = s[1126] + 0;
                     s[1168] = s[1143] + -40;
                     s[1164] = s[1126] + 0;
                     s[1169] = s[1143] + 40;
                     break;
                  case 5:
                     s[1161] = s[1126] + 0;
                     s[1166] = s[1143] + -40;
                     s[1162] = s[1126] + 0;
                     s[1167] = s[1143] + 40;
                     s[1163] = s[1126] + 0;
                     s[1168] = s[1143] + -80;
                     s[1164] = s[1126] + 0;
                     s[1169] = s[1143] + 80;
                     break;
                  case 6:
                     for (int var17 = 1; var17 <= s[65]; var17++) {
                        if (s[1180 + var17] == 0) {
                           s[1160 + var17] = s[1160 + var17] + 16;
                           if (240 <= s[1160 + var17]) {
                              s[1160 + var17] = 224;
                              s[1180 + var17]++;
                           }
                        } else if (s[1180 + var17] == 1) {
                           s[1160 + var17] = s[1160 + var17] - 4;
                           if ((
                                 s[1126] - 16 - s[1160 + var17]
                                    & s[1160 + var17] - (s[1126] + 16)
                                    & s[1143] - 16 - s[1165 + var17]
                                    & s[1165 + var17] - (s[1143] + 16)
                              )
                              < 0) {
                              s[1180 + var17] = 0;
                              s[1165 + var17] = s[1143];
                           } else if (s[1160 + var17] <= -8) {
                              s[1180 + var17] = 2;
                              s[1170 + var17] = s[1160 + var17] << 4;
                              s[1175 + var17] = s[1165 + var17] << 4;
                           }
                        } else if (s[1180 + var17] == 2) {
                           s[1170 + var17] = s[1170 + var17] + s[455 + b(s[1170 + var17] >> 4, s[1175 + var17] >> 4)] * 8;
                           s[1175 + var17] = s[1175 + var17] + s[471 + b(s[1170 + var17] >> 4, s[1175 + var17] >> 4)] * 8;
                           s[1160 + var17] = s[1170 + var17] >> 4;
                           s[1165 + var17] = s[1175 + var17] >> 4;
                           if ((
                                 s[1126] - 8 - s[1160 + var17]
                                    & s[1160 + var17] - (s[1126] + 8)
                                    & s[1143] - 8 - s[1165 + var17]
                                    & s[1165 + var17] - (s[1143] + 8)
                              )
                              < 0) {
                              s[1180 + var17] = 0;
                              s[1165 + var17] = s[1143];
                           }
                        } else {
                           s[1180 + var17]++;
                           s[1160 + var17] = s[1126];
                           s[1165 + var17] = s[1143];
                        }
                     }
               }
            }

            switch (s[82]) {
               case 1:
                  for (int var23 = 1; var23 < 5; var23++) {
                     s[1170 + var23] = s[1170 + var23] + s[455 + b(s[1170 + var23] >> 4, s[1175 + var23] >> 4)] * 8;
                     s[1175 + var23] = s[1175 + var23] + s[471 + b(s[1170 + var23] >> 4, s[1175 + var23] >> 4)] * 8;
                     s[1160 + var23] = s[1170 + var23] >> 4;
                     s[1165 + var23] = s[1175 + var23] >> 4;
                  }

                  int var24 = 1;

                  int var34;
                  for (var34 = 0; var24 <= s[65]; var24++) {
                     if ((s[1126] - 16 - s[1160 + var24] & s[1160 + var24] - (s[1126] + 16) & s[1143] - 16 - s[1165 + var24] & s[1165 + var24] - (s[1143] + 16))
                        < 0) {
                        var34++;
                     }
                  }

                  if (var34 >= s[65]) {
                     s[82] = 2;
                     s[83] = 0;
                  }
                  break;
               case 2:
                  switch (s[81]) {
                     case 0:
                        for (int var22 = 1; var22 < 17; var22++) {
                           s[1126 + var22] = s[1126];
                           s[1143 + var22] = s[1143];
                        }

                        s[82] = 0;
                        break;
                     case 1:
                        for (int var21 = 1; var21 < 5; var21++) {
                           s[1160 + var21] = s[1126] + (s[471 + (s[9] * 2 + 32 * var21 + 16 * (var21 / 3)) % 64] * 16 * s[83] >> 4);
                           s[1165 + var21] = s[1143] + (s[455 + (s[9] * 2 + 32 * var21 + 16 * (var21 / 3)) % 64] * 14 * s[83] >> 4);
                        }

                        if (s[83]++ >= 3) {
                           s[82] = 0;
                        }
                        break;
                     case 2:
                        s[1161] = s[1126] + 16 * s[83];
                        s[1166] = s[1143] + 0;
                        s[1162] = s[1126] + 0;
                        s[1167] = s[1143] + 16 * -s[83];
                        s[1163] = s[1126] + 0;
                        s[1168] = s[1143] + 16 * s[83];
                        s[1164] = s[1126] + 16 * -s[83];
                        s[1169] = s[1143] + 0;
                        if (s[83]++ >= 3) {
                           s[82] = 0;
                        }
                        break;
                     case 3:
                        s[1161] = s[1126] + 10 * s[83];
                        s[1166] = s[1143] + -2 * s[83];
                        s[1162] = s[1126] + 10 * s[83];
                        s[1167] = s[1143] + 2 * s[83];
                        s[1163] = s[1126] + 16 * s[83];
                        s[1168] = s[1143] + -5 * s[83];
                        s[1164] = s[1126] + 16 * s[83];
                        s[1169] = s[1143] + 5 * s[83];
                        if (s[83]++ >= 3) {
                           s[82] = 0;
                        }
                        break;
                     case 4:
                        s[1161] = s[1126] + -10 * s[83];
                        s[1166] = s[1143] + -5 * s[83];
                        s[1162] = s[1126] + -10 * s[83];
                        s[1167] = s[1143] + 5 * s[83];
                        s[1163] = s[1126] + 0 * s[83];
                        s[1168] = s[1143] + -13 * s[83];
                        s[1164] = s[1126] + 0 * s[83];
                        s[1169] = s[1143] + 13 * s[83];
                        if (s[83]++ >= 3) {
                           s[82] = 0;
                        }
                        break;
                     case 5:
                        s[1161] = s[1126] + 0;
                        s[1166] = s[1143] + -s[83] * 16 * 5 / 6;
                        s[1162] = s[1126] + 0;
                        s[1167] = s[1143] + s[83] * 16 * 5 / 6;
                        s[1163] = s[1126] + 0;
                        s[1168] = s[1143] + -s[83] * 16 * 5 / 3;
                        s[1164] = s[1126] + 0;
                        s[1169] = s[1143] + s[83] * 16 * 5 / 3;
                        if (s[83]++ >= 3) {
                           s[82] = 0;
                        }
                        break;
                     case 6:
                        for (int var20 = 1; var20 <= s[65]; var20++) {
                           s[1180 + var20] = -var20 * 6;
                        }

                        s[82] = 0;
                  }

                  if (s[82] == 0) {
                     f();
                  }
            }

            for (int var25 = 1; var25 <= s[65]; var25++) {
               if ((s[9] & 3) == 0) {
                  var1 = 104 + s[84] * 3;
               } else {
                  var1 = 104 + (s[9] & 3) - 1 + s[84] * 3;
               }

               a(1, s[1160 + var25] + 8, s[1165 + var25], 15, var1, 0);
            }

            int var26 = s[11] | -s[21];
            if ((s[11] & 1024) * s[21] != 0) {
               var26 = 0;
            }

            if (s[86] < 4 && (var26 & 1024) != 0 && s[82] == 0) {
               for (int var27 = 0; var27 <= s[65]; var27++) {
                  int var35 = var27 * 4;
                  if (s[60] == 10) {
                     if (var27 == 0 && s[1245 + var35] < 0) {
                        s[1225 + var35] = 0;
                        s[1245 + var35] = s[60];
                        s[1249] = -1;
                        s[1253] = -1;
                        s[1257] = -1;
                        s[1261] = -1;
                     }
                  } else if (s[60] == 11) {
                     if (s[1245 + var35] < 0) {
                        if (var27 == 0) {
                           s[1245 + var35] = 8;
                        } else {
                           s[1245 + var35] = s[60];
                        }

                        s[1185 + var35] = s[1160 + var27] + 8 + 16 - 4;
                        s[1205 + var35] = s[1165 + var27] - 8;
                        s[1225 + var35] = -1;
                     }
                  } else if (s[60] == 19) {
                     if (s[1245 + var35] < 0) {
                        if (var27 == 0) {
                           s[1245 + var35] = 8;
                           s[1185 + var35] = s[1160 + var27] - 16;
                           s[1205 + var35] = s[1165 + var27];
                        } else if (s[1180 + var27] == 1) {
                           s[1245 + var35] = s[60];
                           s[1185 + var35] = s[1160 + var27] + 8;
                           s[1205 + var35] = s[1165 + var27];
                           s[1225 + var35] = 0;
                        }
                     }
                  } else if (s[60] == 7) {
                     if (s[1245 + var35] < 0) {
                        s[1185 + var35] = s[1160 + var27] - 32;
                        s[1205 + var35] = s[1165 + var27] - 16;
                        s[1245 + var35] = s[60];
                        s[1225 + var35] = -1;
                     } else if (s[1245 + ++var35] < 0) {
                        s[1185 + var35] = s[1160 + var27] - 32;
                        s[1205 + var35] = s[1165 + var27] - 16;
                        s[1245 + var35] = s[60];
                        s[1225 + var35] = -1;
                     }
                  } else {
                     if (s[1245 + var35] < 0) {
                        s[1185 + var35] = s[1160 + var27] - 16;
                        s[1205 + var35] = s[1165 + var27];
                        s[1245 + var35] = s[60];
                        if (s[1245 + var35] == 17) {
                           s[1225 + var35] = (s[64] + 32) % 64;
                           s[1185 + var35] = s[1160 + var27] + 8;
                        }

                        if (s[1245 + var35] == 18) {
                           s[1185 + var35] = s[1160 + var27] + 8;
                        }

                        if (var27 == 0 && s[60] == 8) {
                           b(4);
                        }
                     } else if (s[60] == 0 || s[60] >= 16) {
                        if (s[1245 + ++var35] < 0) {
                           s[1185 + var35] = s[1160 + var27] - 16;
                           s[1205 + var35] = s[1165 + var27];
                           s[1245 + var35] = s[60];
                           if (s[1245 + var35] == 17) {
                              s[1225 + var35] = (s[64] + 32) % 64;
                              s[1185 + var35] = s[1160 + var27] + 8;
                           }

                           if (s[1245 + var35] == 18) {
                              s[1185 + var35] = s[1160 + var27] + 8;
                           }
                        }

                        if (var27 == 0 && s[60] == 8) {
                           b(4);
                        }
                     }

                     if (s[60] == 1) {
                        if (s[1245 + ++var35] < 0) {
                           s[1185 + var35] = s[1160 + var27];
                           s[1205 + var35] = s[1165 + var27] + 8;
                           s[1245 + var35] = 2;
                        }
                     } else if (s[60] == 3) {
                        if (s[1245 + ++var35] < 0) {
                           s[1185 + var35] = s[1160 + var27] + 32;
                           s[1205 + var35] = s[1165 + var27];
                           s[1245 + var35] = 4;
                        }
                     } else if (s[60] == 5) {
                        if (s[1245 + ++var35] < 0) {
                           s[1185 + var35] = s[1160 + var27] + 8;
                           s[1205 + var35] = s[1165 + var27] + 24;
                           s[1245 + var35] = 6;
                        }
                     }
                  }

                  var35 = var27 * 4 + 2;
                  if (s[61] == 20 && s[1245 + var35] < 0) {
                     s[1185 + var35] = s[1160 + var27] + 12;
                     s[1205 + var35] = s[1165 + var27];
                     s[1245 + var35] = s[61];
                  }

                  if (s[61] >= 21) {
                     if (s[1245 + var35] < 0) {
                        s[1185 + var35] = s[1160 + var27] + 16;
                        s[1205 + var35] = s[1165 + var27];
                        s[1225 + var35] = 0;
                        s[1245 + var35] = 21;
                     }

                     if (s[1245 + ++var35] < 0) {
                        s[1185 + var35] = s[1160 + var27] + 16;
                        s[1205 + var35] = s[1165 + var27];
                        s[1225 + var35] = 0;
                        s[1245 + var35] = 22;
                     }
                  }
               }
            }
         }
      }
   }

   public final void paint(Graphics var1) {
      if (b != 202) {
         try {
            System.gc();
            s[9]++;
            s[11] = this.i;
            this.i = this.i & ~this.j;
            this.j = 0;
            s[12] = s[13];
            s[13] = 0;
            var1.setColor(0);
            if (a[1]) {
               var1.fillRect(0, 0, z * 3 / 4, (A + 5) * 3 / 4);
            }

            var1.setFont(O);
            if (b == 6) {
               var1.translate(s[7], (A - 192) / 2);
            } else {
               var1.translate(s[7], s[8]);
            }

            var1.fillRect(0, 0, 180, 183);
            switch (b) {
               case 1:
                  try {
                     x = RecordStore.openRecordStore("R", true);
                     if (x.getNumRecords() == 0) {
                        H[0] = 2;
                        H[0] = (byte)(H[0] | 32);
                        H[1] = 1;
                        H[2] = (byte)s[22];
                        H[3] = (byte)s[35];
                        H[4] = (byte)s[33];
                        H[8] = -33;
                        H[9] = -44;
                        H[13] = 117;
                        H[14] = 48;
                        H[18] = 39;
                        H[19] = 16;
                        H[23] = 2;
                        H[28] = 0;
                        H[29] = 1;
                        H[30] = 17;
                        H[31] = 112;
                        H[32] = 2;
                        H[33] = 3;
                        H[37] = 5;
                        H[40] = 2;
                        H[52] = 1;
                        H[53] = 1;
                        H[54] = 1;
                        x.addRecord(H, 0, 78);
                     } else {
                        x.getRecord(1, H, 0);
                     }

                     x.closeRecordStore();
                  } catch (Throwable var28) {
                  }

                  f(0);
                  f(20);
                  f(52);
                  s[66] = H[52];
                  s[67] = H[53];
                  s[68] = H[54];
                  s[69] = H[55];
                  s[70] = H[56];
                  s[71] = H[57];
                  var1.drawImage(this.P, 90, 90, 3);
                  this.a(var1, "LOADING", 71, 162);
                  b++;
                  break;
               case 2:
                  try {
                     this.f[5] = Image.createImage("/img_sub");
                  } catch (Throwable var27) {
                  }

                  this.a(1, "c2");
                  this.a("c");
                  int var109 = y[4] << 8 | y[5] & 255;

                  for (int var92 = 0; var92 < 20; var92++) {
                     s[307 + var92] = (y[var109] & 255) << 16 | (y[var109 + 1] & 255) << 8 | y[var109 + 2] & 255;
                     var109 += 3;
                  }

                  for (int var93 = 0; var93 < 792; var93++) {
                     s[327 + var93] = y[var109++];
                  }

                  s[0] = 0;
                  s[3] = 0;
                  this.a(2, "title");
                  var1.drawImage(this.P, 90, 90, 3);
                  this.a(var1, "LOADING", 71, 162);
                  b = 207;
                  break;
               case 4:
                  this.a();
                  System.gc();
                  this.a(2, "title");
               case 5:
                  if (b == 5) {
                     var1.drawRegion(
                        this.f[2],
                        (B[349] >> 24 & 0xFF) * 3 / 4,
                        (B[349] >> 16 & 0xFF) * 3 / 4,
                        (B[349] >> 8 & 0xFF) * 3 / 4,
                        (B[349] & 0xFF) * 3 / 4,
                        0,
                        0,
                        24,
                        20
                     );
                  }

                  a[9] = false;
                  a[4] = false;
                  a[5] = false;
                  s[9] = 0;
                  b = 6;
                  s[0] = s[1] = s[2] = s[3] = 0;
                  this.a(6, 2);
                  a(27);
                  break;
               case 6:
                  var1.setColor(0);
                  var1.fillRect(-var1.getTranslateX(), -var1.getTranslateY(), z * 2, A * 2);
                  boolean var135 = false;
                  var1.drawRegion(
                     this.f[2],
                     (B[349] >> 24 & 0xFF) * 3 / 4,
                     (B[349] >> 16 & 0xFF) * 3 / 4,
                     (B[349] >> 8 & 0xFF) * 3 / 4,
                     (B[349] & 0xFF) * 3 / 4,
                     0,
                     0,
                     24,
                     20
                  );
                  this.a(var1, 212, 7, 8, 9);
                  this.a(var1, s[97], 7, 134, 9, 4);
                  boolean var145 = false;
                  boolean var146 = false;
                  boolean var147 = false;
                  this.a(var1, 7, 10, 43, 120);
                  boolean var137 = false;
                  this.a(var1, 17, 8, 43, 136);
                  this.a(var1, 37, 10, 43, 152);
                  this.a(var1, 47, 12, 43, 168);
                  boolean var138 = false;
                  this.a(var1, 59, 11, 43, 184);
                  boolean var143 = false;
                  boolean var139 = false;
                  this.a(var1, "ABOUT", 43, 200);
                  this.a(var1, "EXIT", 43, 216);
                  if ((s[12] & 2) != 0) {
                     s[0] = s[0] + 6;
                  } else if ((s[12] & 64) != 0) {
                     s[0]++;
                  }

                  s[0] = s[0] % 7;
                  var1.drawRegion(
                     this.f[0],
                     (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4,
                     (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4,
                     (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4,
                     (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4,
                     0,
                     20,
                     (120 + s[0] * 16 - 2) * 3 / 4,
                     20
                  );
                  if ((s[12] & 8388608) != 0) {
                     this.a(6, 3);
                     b = 201;
                  }

                  if ((s[12] & 256) != 0) {
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

                     s[0] = 0;
                     s[1] = -1;
                  }
                  break;
               case 7:
                  if (s[1] == -1) {
                     var1.drawRegion(
                        this.f[2],
                        (B[349] >> 24 & 0xFF) * 3 / 4,
                        (B[349] >> 16 & 0xFF) * 3 / 4,
                        (B[349] >> 8 & 0xFF) * 3 / 4,
                        (B[349] & 0xFF) * 3 / 4,
                        0,
                        0,
                        (32 - 4 * s[0]) * 3 / 4,
                        20
                     );
                  } else {
                     var1.drawRegion(
                        this.f[2],
                        (B[349] >> 24 & 0xFF) * 3 / 4,
                        (B[349] >> 16 & 0xFF) * 3 / 4,
                        (B[349] >> 8 & 0xFF) * 3 / 4,
                        (B[349] & 0xFF) * 3 / 4,
                        0,
                        0,
                        (16 + 4 * s[0]) * 3 / 4,
                        20
                     );
                  }

                  if (++s[0] >= 4) {
                     b = 5;
                     if (s[1] == -1) {
                        this.a(6, 3);
                        b = 9;
                        s[0] = s[1] = 0;
                     }
                  }
                  break;
               case 8:
                  this.d(var1);
                  break;
               case 9:
                  var1.drawRegion(
                     this.f[2],
                     (B[349] >> 24 & 0xFF) * 3 / 4,
                     (B[349] >> 16 & 0xFF) * 3 / 4,
                     (B[349] >> 8 & 0xFF) * 3 / 4,
                     (B[349] & 0xFF) * 3 / 4,
                     0,
                     0,
                     12,
                     20
                  );
                  boolean var134 = false;
                  this.a(var1, 59, 11, 43, 112);
                  boolean var142 = false;
                  this.a(var1, 70, 12, 42, 144);
                  boolean var136 = false;
                  this.a(var1, 82, 13, 42, 160);
                  this.a(var1, 95, 10, 42, 176);
                  String[] var144 = new String[]{"NONE", "BGM", "SFX"};
                  this.a(var1, "SOUND - " + var144[o], 42, 192);
                  byte var15;
                  byte var16;
                  if (s[33] > 0) {
                     var15 = 4;
                     this.a(var1, 105, 10, 42, 208);
                     var16 = 5;
                     this.a(var1, 294, 7, 42, 224);
                  } else {
                     var15 = -1;
                     var16 = 4;
                     this.a(var1, 294, 7, 42, 208);
                  }

                  if ((s[12] & 2) != 0) {
                     s[0] = s[0] + var16 - 1 + 1;
                  } else if ((s[12] & 64) != 0) {
                     s[0]++;
                  }

                  s[0] = s[0] % (var16 + 1);
                  var1.drawRegion(
                     this.f[0],
                     (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4,
                     (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4,
                     (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4,
                     (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4,
                     0,
                     19,
                     (144 + 16 * s[0] - 2) * 3 / 4,
                     20
                  );
                  if ((s[12] & 8388608) != 0) {
                     b = 7;
                     s[0] = s[1] = 0;
                  }

                  if ((s[12] & 256) != 0) {
                     if (s[0] == 0) {
                        b = 10;
                        s[0] = 0;
                        s[1] = s[23];
                        s[2] = s[21];
                        s[3] = s[22];
                        s[10] = 0;
                     } else if (s[0] == 1) {
                        b = 12;
                        s[0] = 0;
                        s[1] = s[69];
                        s[2] = s[70];
                        s[3] = s[71];
                        s[10] = 0;
                     } else if (s[0] == 2) {
                        b = 11;
                     } else if (s[0] == var15 && s[33] > 0) {
                        s[0] = s[1] = s[2] = 0;
                        b = 26;
                     } else if (s[0] == var16) {
                        b = 7;
                        s[0] = s[1] = 0;
                     } else if (s[0] == 3) {
                        this.i();
                     }
                  }
                  break;
               case 10:
                  this.a(var1, 70, 12, 36, 16);
                  this.a(var1, 125, 10, 28, 48);
                  this.a(var1, 135 + s[1] * 7, 7, 126, 64);
                  this.a(var1, 163, 8, 28, 96);
                  this.a(var1, 171 + s[2] * 3, 3, 182, 112);
                  this.a(var1, 177, 13, 28, 144);
                  this.a(var1, 190 + s[3] * 4, 4, 168, 160);
                  this.a(var1, 198, 4, 28, 192);
                  this.a(var1, 294, 7, 28, 208);
                  if ((s[12] & 2) != 0) {
                     s[0] = s[0] + 4;
                  } else if ((s[12] & 64) != 0) {
                     s[0]++;
                  }

                  s[0] = s[0] % 5;
                  if (s[0] == 4) {
                     var1.drawRegion(
                        this.f[0],
                        (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4,
                        (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4,
                        (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4,
                        (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4,
                        0,
                        9,
                        154,
                        20
                     );
                  } else {
                     var1.drawRegion(
                        this.f[0],
                        (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4,
                        (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4,
                        (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4,
                        (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4,
                        0,
                        9,
                        (16 * (3 + s[0] * 3) - 2) * 3 / 4,
                        20
                     );
                  }

                  if ((s[12] & 8388608) != 0) {
                     b = 9;
                     s[0] = 0;
                  }

                  if (s[10] >= 0) {
                     if ((s[12] & 36) != 0) {
                        if (s[0] == 0) {
                           if ((s[12] & 4) != 0) {
                              s[1] = s[1] + 3;
                           } else {
                              s[1]++;
                           }

                           s[1] = s[1] % 4;
                        } else if (s[0] == 1) {
                           s[2] = s[2] ^ 1;
                        } else if (s[0] == 2) {
                           s[3] = s[3] ^ 1;
                        }
                     }

                     if ((s[12] & 256) != 0) {
                        if (s[0] == 3) {
                           s[23] = s[1];
                           s[21] = s[2];
                           s[22] = s[3];
                           s[10] = -10;
                           e(0);
                        } else if (s[0] == 4) {
                           b = 9;
                           s[0] = 0;
                        }
                     }
                  } else {
                     this.a(var1, 202, 5, 120, 192);
                     s[10]++;
                  }
                  break;
               case 11:
                  this.a(var1, 95, 10, 50, 16);
                  this.a(var1, 115, 3, 14, 48);
                  this.a(var1, 118, 3, 14, 96);
                  this.a(var1, 121, 3, 14, 144);
                  this.a(var1, 294, 7, 42, 192);
                  var1.drawRegion(
                     this.f[0],
                     (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4,
                     (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4,
                     (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4,
                     (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4,
                     0,
                     19,
                     142,
                     20
                  );
                  this.a(var1, s[97], 9, 84, 64, 4);
                  this.a(var1, s[100] / 5 + 1, 1, 28, 64, 4);
                  this.a(var1, 124, 1, 42, 64);
                  this.a(var1, s[100] % 5 + 1, 1, 56, 64, 4);
                  this.a(var1, s[98], 9, 84, 112, 4);
                  this.a(var1, s[101] / 5 + 1, 1, 28, 112, 4);
                  this.a(var1, 124, 1, 42, 112);
                  this.a(var1, s[101] % 5 + 1, 1, 56, 112, 4);
                  this.a(var1, s[99], 9, 84, 160, 4);
                  this.a(var1, s[102] / 5 + 1, 1, 28, 160, 4);
                  this.a(var1, 124, 1, 42, 160);
                  this.a(var1, s[102] % 5 + 1, 1, 56, 160, 4);
                  if ((s[12] & 8388864) != 0) {
                     b = 9;
                     s[0] = 0;
                  }
                  break;
               case 12:
                  this.a(var1, 82, 13, 29, 16);
                  this.a(var1, 377, 7, 28, 48);
                  if (s[1] == 0) {
                     this.a(var1, 369, 8, 112, 64);
                  } else {
                     this.a(var1, 384 + (s[1] - 1) * 8, 8, 112, 64);
                  }

                  this.a(var1, 392, 6, 28, 96);
                  if (s[2] == 0) {
                     this.a(var1, 369, 8, 112, 112);
                  } else {
                     this.a(var1, 398 + (s[2] - 1) * 8, 8, 112, 112);
                  }

                  this.a(var1, 422, 6, 28, 144);
                  if (s[3] == 0) {
                     this.a(var1, 369, 8, 112, 160);
                  } else {
                     this.a(var1, 428 + (s[3] - 1) * 8, 8, 112, 160);
                  }

                  this.a(var1, 198, 4, 28, 192);
                  this.a(var1, 294, 7, 28, 208);
                  if ((s[12] & 2) != 0) {
                     s[0] = s[0] + 4;
                  } else if ((s[12] & 64) != 0) {
                     s[0]++;
                  }

                  s[0] = s[0] % 5;
                  if (s[0] == 4) {
                     var1.drawRegion(
                        this.f[0],
                        (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4,
                        (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4,
                        (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4,
                        (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4,
                        0,
                        9,
                        154,
                        20
                     );
                  } else {
                     var1.drawRegion(
                        this.f[0],
                        (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4,
                        (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4,
                        (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4,
                        (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4,
                        0,
                        9,
                        (16 * (3 + s[0] * 3) - 2) * 3 / 4,
                        20
                     );
                  }

                  if (s[10] >= 0) {
                     if ((s[12] & 36) != 0) {
                        if (s[0] == 0) {
                           if ((s[12] & 4) != 0) {
                              s[1] = s[1] + (s[66] - 1);
                           } else {
                              s[1]++;
                           }

                           s[1] = s[1] % s[66];
                        } else if (s[0] == 1) {
                           if ((s[12] & 4) != 0) {
                              s[2] = s[2] + (s[67] - 1);
                           } else {
                              s[2]++;
                           }

                           s[2] = s[2] % s[67];
                        } else if (s[0] == 2) {
                           if ((s[12] & 4) != 0) {
                              s[3] = s[3] + (s[68] - 1);
                           } else {
                              s[3]++;
                           }

                           s[3] = s[3] % s[68];
                        }
                     }

                     if ((s[12] & 8388608) != 0) {
                        b = 9;
                        s[0] = 0;
                     }

                     if ((s[12] & 256) != 0) {
                        if (s[0] == 3) {
                           s[69] = s[1];
                           s[70] = s[2];
                           s[71] = s[3];
                           s[10] = -10;
                           e(52);
                        } else if (s[0] == 4) {
                           b = 9;
                           s[0] = 0;
                        }
                     }
                  } else {
                     this.a(var1, 202, 5, 120, 200);
                     s[10]++;
                  }
                  break;
               case 13:
                  this.a(var1, 25, 12, 36, 48);

                  int var91;
                  for (var91 = 0; var91 <= s[35]; var91++) {
                     this.a(var1, 259 + var91 * 7, 7, 71, 96 + var91 * 16);
                  }

                  this.a(var1, 294, 7, 71, 96 + var91 * 16);
                  if ((s[12] & 2) != 0) {
                     s[0] = s[0] + s[35] + 1;
                  } else if ((s[12] & 64) != 0) {
                     s[0]++;
                  }

                  s[0] = s[0] % (s[35] + 2);
                  var1.drawRegion(
                     this.f[0],
                     (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4,
                     (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4,
                     (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4,
                     (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4,
                     0,
                     41,
                     (48 + 16 * (3 + s[0]) - 2) * 3 / 4,
                     20
                  );
                  if ((s[12] & 8388608) != 0) {
                     b = 4;
                  }

                  if ((s[12] & 256) != 0) {
                     if (s[0] == s[35] + 1) {
                        b = 4;
                     } else {
                        s[31] = s[0];
                        b = 15;
                        b(11);
                     }
                  }
                  break;
               case 14:
                  if (s[0] == 0) {
                     if (s[23] <= 1) {
                        var1.setColor(16777215);
                        var1.drawString("CHANGE DIFFICULTY", 90, 60, 17);
                        var1.drawString("TO HARD OR NORMAL", 90, 80, 17);
                        var1.drawString("TO CONTINUE", 90, 99, 17);
                        if ((s[12] & 8388608) != 0) {
                           b = 4;
                        }

                        if ((s[12] & 256) != 0) {
                           b = 4;
                        }
                     } else {
                        s[0]++;
                        s[1] = 0;
                     }
                  } else if (s[0] != 1) {
                     if (s[0] == 2) {
                        if (s[2] == 1) {
                           this.a(var1, 343, 9, 57, 48);
                        } else {
                           this.a(var1, 352, 9, 57, 48);
                        }

                        this.a(var1, 207, 5, 22, 96);
                        this.a(var1, s[16], 7, 120, 96, 4);
                        if (s[3] > 0) {
                           this.a(var1, 361, 8, 120, 120);
                           if (s[3] == 1) {
                              this.a(var1, 377, 7, 8, 120);
                           } else if (s[3] == 2) {
                              this.a(var1, 392, 6, 8, 120);
                           } else if (s[3] == 3) {
                              this.a(var1, 422, 6, 8, 120);
                           }
                        }

                        this.a(var1, 301, 7, 88, 176);
                        var1.drawRegion(
                           this.f[0],
                           (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4,
                           (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4,
                           (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4,
                           (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4,
                           0,
                           54,
                           130,
                           20
                        );
                        if ((s[12] & 256) != 0) {
                           this.a();
                           b = 14;
                           s[0] = 0;
                           s[1] = 0;
                        }
                     }
                  } else {
                     for (int var89 = 0; var89 <= s[35]; var89++) {
                        var1.setColor(5263440);
                        if (s[9771 + var89] <= s[9776 + var89]) {
                           var1.setColor(32896);
                        }

                        var1.fillRect(90, (32 + var89 * 16 * 9 / 4 - 2) * 3 / 4, 84, 13);
                     }

                     int var90;
                     for (var90 = 0; var90 <= s[35]; var90++) {
                        this.a(var1, 259 + var90 * 7, 7, 16, 32 + var90 * 16 * 9 / 4);
                        this.a(var1, s[9771 + var90], 7, 128, 32 + var90 * 16 * 9 / 4, 4);
                        this.a(var1, s[9776 + var90], 7, 128, 48 + var90 * 16 * 9 / 4, 4);
                     }

                     this.a(var1, 301, 7, 16, 32 + var90 * 16 * 9 / 4);
                     if ((s[12] & 2) != 0) {
                        s[1] = s[1] + s[35] + 1;
                     } else if ((s[12] & 64) != 0) {
                        s[1]++;
                     }

                     s[1] = s[1] % (s[35] + 2);
                     var1.drawRegion(
                        this.f[0],
                        (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4,
                        (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4,
                        (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4,
                        (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4,
                        0,
                        0,
                        (32 + s[1] * 16 * 9 / 4 - 2) * 3 / 4,
                        20
                     );
                     if ((s[12] & 8388608) != 0) {
                        b = 4;
                     }

                     if ((s[12] & 256) != 0) {
                        if (s[1] == s[35] + 1) {
                           b = 4;
                        } else {
                           this.a(6, 6);
                           s[31] = s[1];
                           b = 15;
                           a[9] = true;
                           b(11);
                        }
                     }
                  }

                  this.a(var1, 37, 10, 50, 0);
                  if ((s[12] & 8388608) != 0) {
                     b = 4;
                  }
                  break;
               case 15:
                  u[2] = u[0];
                  s[0] = s[1] = s[2] = s[3] = 0;
                  s[32] = 0;
                  s[24] = 0;
                  s[25] = 0;
                  s[16] = 0;
                  s[18] = 70000;
                  s[17] = 2;
                  s[19] = 3;
                  if (s[23] <= 1) {
                     s[19] = 9;
                  }

                  s[79] = 0;
                  s[80] = 0;
                  s[27] = 0;
                  if (a[9]) {
                     s[19] = 0;
                  }

                  s[1126] = 32;
                  s[1143] = 104;
                  s[63] = 0;
                  s[64] = 48;
                  s[59] = 5;
                  s[60] = 0;
                  s[61] = 0;
                  s[65] = 2;
                  s[84] = 0;
                  s[62] = 0;

                  for (int var87 = 1; var87 < 17; var87++) {
                     s[1126 + var87] = s[1126];
                     s[1143 + var87] = s[1143];
                  }

                  for (int var88 = 1; var88 < 5; var88++) {
                     s[1160 + var88] = s[1126 + var88 * 4];
                     s[1165 + var88] = s[1143 + var88 * 4];
                  }

                  s[82] = 0;
                  s[81] = 0;
                  s[83] = 0;
                  s[1119] = 1;
                  s[76] = 0;
                  s[72] = s[23];
                  s[73] = s[69];
                  s[74] = s[70];
                  s[75] = s[71];
                  if (!a[9]) {
                     e(20);
                  }

                  s[1120] = 0;
                  s[1121] = 0;
                  s[1122] = 0;
                  s[1123] = 0;
                  s[1124] = 0;
                  s[1125] = 0;
                  this.a(6, 6);
                  b = 18;
                  break;
               case 16:
                  try {
                     x = RecordStore.openRecordStore("R", true);
                     x.getRecord(1, H, 0);
                     x.closeRecordStore();
                  } catch (Throwable var26) {
                  }

                  s[0] = 0;
                  s[1] = H[20];
                  s[2] = H[21];
                  s[3] = H[23];
                  b++;
                  break;
               case 17:
                  this.a(var1, 17, 8, 64, 32);
                  this.a(var1, 254, 5, 56, 96);
                  this.a(var1, s[2] + 1, 1, 140, 96, 4);
                  this.a(var1, 124, 1, 154, 96);
                  this.a(var1, s[1] + 1, 1, 168, 96, 4);
                  this.a(var1, 7, 10, 50, 176);
                  this.a(var1, 294, 7, 50, 192);
                  this.a(var1, s[3], 124);
                  var1.drawRegion(
                     this.f[0],
                     (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4,
                     (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4,
                     (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4,
                     (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4,
                     0,
                     25,
                     (32 + 16 * (9 + s[0]) - 2) * 3 / 4,
                     20
                  );
                  if ((s[12] & 2) != 0) {
                     s[0]++;
                  } else if ((s[12] & 64) != 0) {
                     s[0]++;
                  }

                  s[0] = s[0] % 2;
                  if ((s[12] & 256) != 0) {
                     if (s[0] == 0) {
                        s[32] = 0;
                        s[24] = 0;
                        s[25] = 0;
                        s[16] = 0;
                        s[18] = 70000;
                        s[17] = 2;
                        s[19] = 3;
                        if (s[23] <= 1) {
                           s[19] = 9;
                        }

                        s[79] = 0;
                        s[80] = 0;
                        s[27] = 0;
                        if (a[9]) {
                           s[19] = 0;
                        }

                        s[1126] = 32;
                        s[1143] = 104;
                        s[63] = 0;
                        s[64] = 48;
                        s[59] = 5;
                        s[60] = 0;
                        s[61] = 0;
                        s[65] = 2;
                        s[84] = 0;
                        s[62] = 0;

                        for (int var85 = 1; var85 < 17; var85++) {
                           s[1126 + var85] = s[1126];
                           s[1143 + var85] = s[1143];
                        }

                        for (int var86 = 1; var86 < 5; var86++) {
                           s[1160 + var86] = s[1126 + var86 * 4];
                           s[1165 + var86] = s[1143 + var86 * 4];
                        }

                        s[82] = 0;
                        s[81] = 0;
                        s[83] = 0;
                        s[1119] = 1;
                        s[76] = 0;
                        f(20);
                        s[23] = s[72];
                        s[69] = s[73];
                        s[70] = s[74];
                        s[71] = s[75];
                        a[5] = true;
                        b = 18;
                     } else {
                        b = 4;
                     }
                  }
                  break;
               case 18:
                  if (a[5]) {
                     this.a(var1, 0, 7, 71, 113);
                  } else {
                     this.a(var1, 7, 10, 50, 113);
                     this.a(var1, s[23], 141);
                  }

                  b++;
                  break;
               case 19:
                  this.d();
                  s[55] = 0;
                  s[56] = -1;
                  s[57] = -1;

                  int var78;
                  for (var78 = 0; var78 < 511; var78++) {
                     s[2558 + var78] = var78 + 1;
                  }

                  s[2558 + var78] = -1;

                  for (int var79 = 0; var79 < 18; var79++) {
                     s[2028 + var79] = -1;
                  }

                  for (int var80 = 0; var80 < 20; var80++) {
                     s[1245 + var80] = -1;
                  }

                  f();

                  for (int var81 = 0; var81 < 752; var81++) {
                     s[1265 + var81] = 0;
                  }

                  this.a(2, "st" + (s[31] + 1));
                  if (s[31] == 0 || s[31] == 2 || s[31] == 4) {
                     this.a(3, "midium");
                  }

                  if (3 <= s[31]) {
                     this.a(4, "base");
                  }

                  s[86] = 0;
                  if (s[31] >= 3) {
                     a[7] = false;
                     a[8] = false;
                     if (s[31] == 4) {
                        for (int var82 = 0; var82 < 16; var82++) {
                           s[1265 + 0 + var82] = 1;
                           s[1265 + 208 + var82] = 1;
                        }

                        s[87] = 0;
                        s[88] = 4;
                        s[90] = s[91] = s[92] = s[93] = 0;
                        s[9739] = s[9740] = s[9741] = s[9742] = s[9743] = s[9744] = s[9745] = s[9746] = 0;
                     }
                  }

                  this.a("" + s[31]);
                  int var99 = y[0] << 8 | y[1] & 255;
                  s[37] = (y[var99++] & 255) << 8;
                  s[37] = s[37] | y[var99++] & 255;
                  s[38] = (y[var99++] & 255) << 8;
                  s[38] = s[38] | y[var99++] & 255;
                  s[39] = y[var99++] & 255;
                  s[40] = y[var99++] & 255;
                  s[41] = y[var99++] & 255;
                  s[43] = y[var99++] & 255;
                  s[36] = s[37];
                  s[45] = 1;
                  s[44] = 0;
                  s[52] = 0;
                  s[53] = 0;
                  s[54] = 0;
                  s[50] = 0;
                  s[42] = 1;
                  if (s[41] == 2) {
                     s[54] = (s[37] - 224) / 2;
                     s[1143] = s[1143] + s[54];

                     for (int var83 = 1; var83 < 17; var83++) {
                        s[1143 + var83] = s[1143 + var83] + s[54];
                        s[1175 + var83] = s[1175 + var83] + (s[54] << 4);
                     }
                  }

                  for (var78 = 0; y[var99] != -1; var99 += 2) {
                     t[3656 + var78++] = (short)((y[var99] << 8) + (y[var99 + 1] & 255));
                  }

                  var99++;

                  int var114;
                  for (s[51] = var78; (var114 = y[var99] << 8 | y[var99 + 1] & 255) != 32512; var99 += 2) {
                     t[3656 + var78++] = (short)var114;
                  }

                  if (s[31] == 1) {
                     try {
                        this.f[4] = Image.createImage("/img_st2c");
                     } catch (Throwable var25) {
                     }

                     int var140 = 0;
                     var140 = y[6] << 8 | y[7] & 255;
                     s[48] = var140 + (y[var140 + 1] & 255) * 64 + 6;
                  }

                  s[24] = 0;
                  if (2 <= s[23]) {
                     s[24] = (s[23] - 2) * 8 + s[31] + s[32] * 8;
                  }

                  e();
                  s[34] = 0;
                  b = 191;
                  a[5] = true;
                  break;
               case 21:
                  if (a[9]) {
                     a[9] = false;
                     b = 14;
                     s[0] = 2;
                     s[1] = 0;
                     s[2] = 0;
                     s[3] = 0;
                     this.a(6, 6);
                     break;
                  } else {
                     if (2 <= s[23]) {
                        if (s[99] < s[16]) {
                           s[99] = s[16];
                           s[102] = s[32] * 5 + s[31];
                        }

                        if (s[98] < s[16]) {
                           s[99] = s[98];
                           s[98] = s[16];
                           s[102] = s[101];
                           s[101] = s[32] * 5 + s[31];
                        }

                        if (s[97] < s[16]) {
                           s[98] = s[97];
                           s[97] = s[16];
                           s[101] = s[100];
                           s[100] = s[32] * 5 + s[31];
                        }

                        e(0);
                     }

                     s[0] = 0;
                     b++;
                     this.a(6, 6);
                  }
               case 22:
                  this.a(var1, 308, 16, 8, 60);
                  if (s[19] > 0) {
                     this.a(var1, 324, 13, 29, 120);
                     this.a(var1, s[19], 2, 183, 120, 4);
                     if (s[19] < 10) {
                        this.a(var1, 0, 1, 183, 120, 4);
                     }

                     this.a(var1, 337, 3, 99, 152);
                     this.a(var1, 340, 3, 99, 168);
                     if ((s[12] & 66) != 0) {
                        s[0] = s[0] ^ 1;
                     }

                     var1.drawRegion(
                        this.f[0],
                        (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4,
                        (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4,
                        (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4,
                        (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4,
                        0,
                        62,
                        (152 + s[0] * 16 - 2) * 3 / 4,
                        20
                     );
                  }

                  this.a(var1, "PRESS OK", 64, 208);
                  if ((s[12] & 256) != 0) {
                     b = 4;
                     if (s[19] > 0 && s[0] == 0) {
                        s[19]--;
                        s[16] = 0;
                        s[18] = 70000;
                        s[17] = 2;
                        s[1120] = 0;
                        s[1121] = 0;
                        s[1122] = 0;
                        s[1123] = 0;
                        s[1124] = 0;
                        s[1125] = 0;
                        s[79] = 1;
                        b = 20;
                        this.a(4, 5);
                     }
                  }
                  break;
               case 23:
                  var1.setColor(16777215);
                  var1.fillRect(0, 0, 180, 180);
                  if (s[9] >= 20) {
                     s[1126] = 32;
                     s[1143] = 104;

                     for (int var76 = 1; var76 < 17; var76++) {
                        s[1126 + var76] = s[1126];
                        s[1143 + var76] = s[1143];
                     }

                     for (int var77 = 0; var77 < 20; var77++) {
                        s[1245 + var77] = -1;
                     }

                     b++;
                     s[9] = 0;
                     s[45] = 1;
                     a(36);
                     this.d();
                     this.a(3, "midium");
                     this.a(2, "e");
                     s[0] = 272;
                     s[1] = 0;
                     s[2] = 0;
                     s[3] = 0;
                  }
                  break;
               case 24:
                  if (s[2] <= 1) {
                     var1.drawRegion(
                        this.f[3],
                        (B[283] >> 24 & 0xFF) * 3 / 4,
                        (B[283] >> 16 & 0xFF) * 3 / 4,
                        (B[283] >> 8 & 0xFF) * 3 / 4,
                        (B[283] & 0xFF) * 3 / 4,
                        0,
                        (41 + s[1] / 16 - 16) * 3 / 4,
                        0,
                        20
                     );

                     for (int var73 = 0; var73 < 20; var73++) {
                        int var125 = s[1055 + var73] - s[1] / 2 * (var73 / 2 + 1) * s[45] & 0xFF;
                        int var133 = s[1055 + 20 + var73] & 0xFF;
                        var1.setColor(s[307 + var73]);
                        var1.drawLine(var125 * 3 / 4, var133 * 3 / 4, var125 * 3 / 4, var133 * 3 / 4);
                     }

                     var1.drawRegion(
                        this.f[2],
                        (B[351] >> 24 & 0xFF) * 3 / 4,
                        (B[351] >> 16 & 0xFF) * 3 / 4,
                        (B[351] >> 8 & 0xFF) * 3 / 4,
                        (B[351] & 0xFF) * 3 / 4,
                        0,
                        (240 - s[1] / 6 + 16) * 3 / 4,
                        108,
                        20
                     );
                     if ((s[9] & 7) == 0 || (s[9] & 7) == 3) {
                        var1.drawRegion(
                           this.f[2],
                           (B[349] >> 24 & 0xFF) * 3 / 4,
                           (B[349] >> 16 & 0xFF) * 3 / 4,
                           (B[349] >> 8 & 0xFF) * 3 / 4,
                           (B[349] & 0xFF) * 3 / 4,
                           0,
                           (240 - s[1] / 6 + 16) * 3 / 4,
                           120,
                           20
                        );
                     } else if ((s[9] & 7) == 2 || (s[9] & 7) == 4) {
                        var1.drawRegion(
                           this.f[2],
                           (B[350] >> 24 & 0xFF) * 3 / 4,
                           (B[350] >> 16 & 0xFF) * 3 / 4,
                           (B[350] >> 8 & 0xFF) * 3 / 4,
                           (B[350] & 0xFF) * 3 / 4,
                           0,
                           (240 - s[1] / 6 + 16) * 3 / 4,
                           120,
                           20
                        );
                     }

                     if (s[2] == 0) {
                        short var113 = 0;
                        var1.setFont(Font.getFont(64, 0, 8));

                        for (int var74 = 0; var74 < this.n.length - 1; var74++) {
                           for (int var98 = 0; var98 < this.n[var74].length; var98++) {
                              if (-26 < s[0] + var113 && s[0] + var113 < 266) {
                                 if (var98 == 0 && var74 < this.n.length - 1) {
                                    var1.setColor(8421504);
                                    var1.drawString(this.n[var74][var98], 90, (s[0] + var113 + 0) * 3 / 4, 17);
                                    var1.drawString(this.n[var74][var98], 90, (s[0] + var113 - 1) * 3 / 4, 17);
                                    var1.drawString(this.n[var74][var98], 89, (s[0] + var113 + 0) * 3 / 4, 17);
                                    var1.drawString(this.n[var74][var98], 90, (s[0] + var113 + 1) * 3 / 4, 17);
                                 }

                                 var1.setColor(16777215);
                                 var1.drawString(this.n[var74][var98], 90, (s[0] + var113) * 3 / 4, 17);
                              }

                              var113 += 26;
                              if (var74 == this.n.length - 2 && s[0] + var113 < -52) {
                                 s[2] = 1;
                                 s[3] = 0;
                              }
                           }

                           var113 += 52;
                           if (8 <= var74) {
                              var113 += 182;
                           }
                        }
                     }

                     s[0] = s[0] - 4;
                     s[1] = s[1] + 2;
                     s[3] = s[3] + 8;
                     if ((s[11] & 256) != 0) {
                        s[0] = s[0] - 28;
                        s[1] = s[1] + 14;
                        s[3] = s[3] + 24;
                     }

                     if (s[2] >= 1) {
                        var1.setColor(0);
                        var1.fillRect(0, 0, 180, s[3] * 3 / 4);
                        var1.fillRect(0, (240 - s[3]) * 3 / 4, 180, 180);
                        if (128 < s[3]) {
                           s[2] = 3;
                           s[3] = 0;
                        }
                     }
                  } else if (s[2] == 3) {
                     var1.setColor(16777215);
                     var1.setFont(Font.getFont(64, 0, 8));

                     for (int var75 = 0; var75 < this.n[this.n.length - 1].length; var75++) {
                        var1.drawString(this.n[this.n.length - 1][var75], 90, (81 + var75 * 26) * 3 / 4, 17);
                     }

                     if (3 <= s[32]) {
                        var1.setColor(4259584);
                        var1.drawString("Congratulations!", 90, 21, 17);
                     }

                     var1.setColor(0);
                     var1.fillRect(0, 0, 180, (120 - s[3]) * 3 / 4);
                     var1.fillRect(0, (120 + s[3]) * 3 / 4, 180, 180);
                     s[3] = s[3] + 2;
                     if ((s[11] & 256) != 0) {
                        s[3] = s[3] + 14;
                     }

                     if (52 <= s[3]) {
                        if (s[3] > 120) {
                           s[3] = 120;
                        }

                        if ((s[12] & 256) != 0) {
                           this.a();
                           b = 18;
                           if (3 <= s[32]) {
                              this.a(2, "title");
                              b = 11;
                           }
                        }
                     }
                  }
                  break;
               case 26:
                  this.e = true;
                  var1.setColor(16777215);
                  var1.setFont(Font.getFont(32, 0, 8));
                  var1.setClip(0, 0, this.getWidth(), this.getHeight());

                  for (int var72 = 0; var72 < this.d[s[1]].length; var72++) {
                     var1.drawString(this.d[s[1]][var72], 90, (64 + 26 * var72) * 3 / 4, 17);
                  }

                  if (s[2] + 1 >= 10) {
                     var1.drawString("" + (s[2] + 1), 148, 108, 20);
                  } else {
                     var1.drawString("0" + (s[2] + 1), 148, 108, 20);
                  }

                  this.a(var1, 105, 10, 50, 16);
                  this.a(var1, 436, 3, 16, 48);
                  this.a(var1, 439, 3, 16, 128);
                  this.a(var1, 442, 4, 16, 208);
                  this.a(var1, 294, 7, 16, 224);
                  if ((s[12] & 2) != 0) {
                     s[0] = s[0] + 3;
                  } else if ((s[12] & 64) != 0) {
                     s[0]++;
                  }

                  s[0] = s[0] % 4;
                  if (s[0] == 3) {
                     var1.drawRegion(
                        this.f[0],
                        (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4,
                        (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4,
                        (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4,
                        (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4,
                        0,
                        -1,
                        166,
                        20
                     );
                  } else {
                     var1.drawRegion(
                        this.f[0],
                        (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4,
                        (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4,
                        (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4,
                        (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4,
                        0,
                        -1,
                        (16 * (3 + s[0] * 5) - 2) * 3 / 4,
                        20
                     );
                  }

                  if ((s[12] & 4) != 0) {
                     if (s[0] == 0) {
                        s[1] = s[1] + 8;
                     } else if (s[0] == 1) {
                        s[2] = s[2] + 11;
                     }
                  } else if ((s[12] & 32) != 0) {
                     if (s[0] == 0) {
                        s[1]++;
                     } else if (s[0] == 1) {
                        s[2]++;
                     }
                  }

                  s[1] = s[1] % 9;
                  s[2] = s[2] % 12;
                  if ((s[12] & 8388608) != 0) {
                     b = 9;
                     s[0] = 0;
                     this.a();
                     this.e = false;
                  }

                  if ((s[12] & 256) != 0) {
                     if (s[0] == 0) {
                        a(s[9781 + s[1]]);
                     } else if (s[0] == 1) {
                        b(s[2]);
                     } else if (s[0] == 2) {
                        this.a();
                     } else {
                        b = 9;
                        s[0] = 0;
                        this.a();
                        this.e = false;
                     }
                  }
                  break;
               case 191:
                  this.a(var1, 7, 10, 50, 113);
                  this.a(var1, s[23], 141);
                  if (3000L < System.currentTimeMillis() - u[2]) {
                     b = 20;
                     a(15 + s[31] * 3);
                     this.a(4, 5);
                  }
                  break;
               case 200:
                  this.e(var1);
                  break;
               case 201:
                  this.g(var1);
                  break;
               case 204:
                  s[0] = 0;
                  this.a(6, 3);
                  b = 203;
                  s[12] = 0;
               case 203:
                  this.h(var1);
                  break;
               case 205:
                  s[0] = 0;
                  this.a(6, 3);
                  b = 20;
                  s[12] = 0;
               case 20:
                  if (a[4]) {
                     this.i(var1);
                     if (s[27] == 0 && s[12] != 0) {
                        if ((s[12] & s[2017 + s[26]]) != 0) {
                           s[26]++;
                           if (s[26] == 11) {
                              s[59] = 7;
                              s[61] = 20;
                              if (s[69] == 1) {
                                 s[61] = 21;
                              }

                              s[60] = 8;
                              s[65] = 4;
                              s[62] = 6;
                              s[1120] = 1;
                              s[1121] = 1;
                              s[1122] = 1;
                              s[1123] = 1;
                              s[1124] = 1;
                              s[1125] = 1;
                              f();
                              e();
                              b(7);
                              if (s[23] >= 2) {
                                 s[27]++;
                              }

                              s[26] = 0;
                           }
                        } else {
                           s[26] = 0;
                        }
                     }
                  } else if ((s[12] & 35651584) != 0 || !this.isShown()) {
                     a[4] = true;
                     b = 205;
                  }

                  if (!a[4]) {
                     if (s[50] <= 0) {
                        s[50] = s[50] + 8;

                        short var4;
                        do {
                           int var34;
                           switch (var34 = (var4 = t[3656 + s[51]]) >> 8 & 127) {
                              case 0:
                                 s[50] = s[50] + (var4 - 1) * 8;
                                 break;
                              case 2:
                                 s[43] = 0;
                                 s[42] = 0;
                                 break;
                              case 3:
                                 a(var34, 240, 0, var4 & 255);
                                 break;
                              case 4:
                                 s[41] = var4 & 255;
                                 if (s[41] == 1) {
                                    s[1143] = s[1143] - s[54];

                                    for (int var35 = 1; var35 < 17; var35++) {
                                       s[1143 + var35] = s[1143 + var35] - s[54];
                                    }

                                    int var5 = s[56];

                                    while (var5 != -1) {
                                       int var6 = s[2558 + var5];
                                       s[4094 + var5] = s[4094 + var5] - s[54];
                                       s[6142 + var5] = s[6142 + var5] - (s[54] << 4);
                                       var5 = var6;
                                    }

                                    s[54] = s[44] = 0;
                                    s[36] = 224;

                                    for (int var36 = 0; var36 < 752; var36++) {
                                       s[1265 + var36] = 0;
                                    }
                                 }

                                 if (s[41] == 3) {
                                    s[53] = 0;
                                 }

                                 if (s[41] == 5) {
                                    s[53] = 0;

                                    for (int var37 = 0; var37 < 16; var37++) {
                                       s[1265 + 240 + var37] = 1;
                                    }
                                 }
                                 break;
                              case 6:
                                 s[43] = var4 & 255;
                                 break;
                              case 7:
                                 if (s[22] == 0) {
                                    if ((var4 & 128) != 0) {
                                       a[8] = true;
                                       a(var34, 240, 0, 0);
                                    } else {
                                       a[8] = false;
                                    }
                                 }
                                 break;
                              case 8:
                                 if (s[22] == 0) {
                                    if ((var4 & 128) != 0) {
                                       a[7] = true;
                                       a(var34, 240, 0, 0);
                                    } else {
                                       a[7] = false;
                                    }
                                 }
                                 break;
                              case 9:
                                 a(
                                    (t[3656 + s[51] + 1] & '\uff00') >> 8,
                                    240,
                                    (var4 & 255) * 4,
                                    (t[3656 + s[51] + 1] & 63) << 16 | (t[3656 + s[51] + 1] & 64) << 2 | (t[3656 + s[51] + 1] & 128) >> 7
                                 );
                                 s[51]++;
                                 break;
                              case 43:
                              case 44:
                              case 45:
                              case 46:
                                 if (var34 >= 45) {
                                    a(
                                       var34 - 2,
                                       240,
                                       (var4 & 63) * 16,
                                       (var4 & 192) << 18
                                          | (t[3656 + s[51] + 1] & '\uf000') << 4
                                          | t[3656 + s[51] + 1] & 3840
                                          | (t[3656 + s[51] + 1] & 240) >> 4
                                    );
                                 } else {
                                    a(
                                       var34,
                                       240,
                                       (var4 & 63) * 4,
                                       (var4 & 192) << 18
                                          | (t[3656 + s[51] + 1] & '\uf000') << 4
                                          | t[3656 + s[51] + 1] & 3840
                                          | (t[3656 + s[51] + 1] & 240) >> 4
                                    );
                                 }

                                 s[50] = s[50] + 8 * (t[3656 + s[51] + 1] & 15);
                                 s[51]++;
                                 break;
                              case 76:
                              case 88:
                              case 90:
                                 a(
                                    var34,
                                    240,
                                    (var4 & 255) * 4,
                                    (t[3656 + s[51] + 1] & '\uf000') << 4 | t[3656 + s[51] + 1] & 3840 | (t[3656 + s[51] + 1] & 240) >> 4
                                 );
                                 s[50] = s[50] + 8 * (t[3656 + s[51] + 1] & 15);
                                 s[51]++;
                                 break;
                              case 111:
                                 b(var34, 240, (var4 & 63) * 4, (var4 & 64) << 2 | (var4 & 128) >> 7);
                                 break;
                              case 126:
                                 s[51]--;
                                 break;
                              default:
                                 a(var34, 240, (var4 & 63) * 4, (var4 & 64) << 2 | (var4 & 128) >> 7);
                           }

                           s[51]++;
                        } while ((var4 & '耀') != 0);
                     }

                     this.h();

                     for (int var38 = 0; var38 < 20; var38++) {
                        switch (s[1245 + var38]) {
                           case 0:
                           case 1:
                           case 3:
                           case 5:
                           case 16:
                              short var33 = 117;
                              if (s[1245 + var38] == 16) {
                                 var33 = 273;
                              }

                              s[1185 + var38] = s[1185 + var38] + 32;
                              if ((c(s[1185 + var38], s[1205 + var38] - s[54]) | c(s[1185 + var38] - 8, s[1205 + var38] - s[54]) | 240 - s[1185 + var38]) < 0) {
                                 s[1245 + var38] = -1;
                              }

                              a(1, s[1185 + var38], s[1205 + var38], 15, var33, 0);
                              break;
                           case 2:
                              s[1185 + var38] = s[1185 + var38] + 20;
                              s[1205 + var38] = s[1205 + var38] - 20;
                              if ((
                                    c(s[1185 + var38], s[1205 + var38] - s[54])
                                       | c(s[1185 + var38] - 10, s[1205 + var38] + 10 - s[54])
                                       | 240 - s[1185 + var38]
                                       | 16 + s[1205 + var38] - s[54]
                                 )
                                 < 0) {
                                 s[1245 + var38] = -1;
                              }

                              if (s[1245 + var38] >= 0) {
                                 a(1, s[1185 + var38], s[1205 + var38], 15, 118, 0);
                              }
                              break;
                           case 4:
                              s[1185 + var38] = s[1185 + var38] - 32;
                              if ((c(s[1185 + var38], s[1205 + var38] - s[54]) | c(s[1185 + var38] + 16, s[1205 + var38] - s[54]) | 16 + s[1185 + var38]) < 0) {
                                 s[1245 + var38] = -1;
                              }

                              if (s[1245 + var38] >= 0) {
                                 a(1, s[1185 + var38], s[1205 + var38], 15, 119, 0);
                              }
                              break;
                           case 6:
                              s[1205 + var38] = s[1205 + var38] - 32;
                              if ((
                                    c(s[1185 + var38], s[1205 + var38] - s[54])
                                       | c(s[1185 + var38], s[1205 + var38] - 16 - s[54])
                                       | 240 - s[1185 + var38]
                                       | 16 + s[1205 + var38] - s[54]
                                 )
                                 < 0) {
                                 s[1245 + var38] = -1;
                              }

                              if (s[1245 + var38] >= 0) {
                                 a(1, s[1185 + var38], s[1205 + var38], 15, 120, 0);
                              }
                              break;
                           case 7:
                              s[1225 + var38]++;
                              if (s[1225 + var38] >= 3) {
                                 s[1225 + var38] = 3;
                              }

                              int var32 = 266 + (s[1225 + var38] - 1) * 1;
                              s[1185 + var38] = s[1185 + var38] + 32;
                              if (s[1225 + var38] > 0
                                 && (
                                       c(s[1185 + var38], s[1205 + var38] + 8 - s[54])
                                          | c(s[1185 + var38], s[1205 + var38] + 24 - s[54])
                                          | c(s[1185 + var38] - 16, s[1205 + var38] + 8 - s[54])
                                          | c(s[1185 + var38] - 16, s[1205 + var38] + 24 - s[54])
                                          | 240 - s[1185 + var38]
                                    )
                                    < 0) {
                                 s[1245 + var38] = -1;
                              }

                              if (s[1245 + var38] >= 0 && 1 <= s[1225 + var38]) {
                                 a(0, s[1185 + var38], s[1205 + var38], 15, var32, 66305);
                              }
                              break;
                           case 8:
                              s[1205 + var38] = s[1160 + var38 / 4] + 16;
                              s[1185 + var38] = s[1185 + var38] + 48;

                              for (int var96 = s[1205 + var38]; var96 < s[1185 + var38]; var96 += 16) {
                                 if (c(var96, s[1165 + var38 / 4] - s[54]) < 0) {
                                    s[1185 + var38] = var96;
                                    a(13, s[1185 + var38] - 8, s[1165 + var38 / 4], 0);
                                    s[1245 + var38]++;
                                    break;
                                 }
                              }

                              if (s[1245 + var38] == 8 && 240 - s[1185 + var38] < 0) {
                                 s[1185 + var38] = 240;
                                 s[1245 + var38]++;
                              }

                              a(0, var38, s[1165 + var38 / 4], 1, 0, 0);
                              break;
                           case 9:
                              s[1205 + var38] = s[1205 + var38] + 48;
                              if (s[1185 + var38] + 16 < s[1205 + var38]) {
                                 s[1245 + var38] = -1;
                              } else {
                                 if (s[1185 + var38] + 16 <= s[1205 + var38]) {
                                    s[1205 + var38] = s[1185 + var38] + 16;
                                 }

                                 a(0, var38, s[1165 + var38 / 4], 1, 0, 0);
                              }
                              break;
                           case 10:
                              s[1185 + var38] = s[77];
                              s[77] = 240;
                              switch (s[1225 + var38]) {
                                 case 0:
                                    s[1205 + var38] = 0;
                                    s[1185 + var38] = 0;
                                    s[1225 + var38]++;
                                    break;
                                 case 1:
                                    s[1205 + var38]++;
                                    if (s[1205 + var38] == 2) {
                                       b(8);
                                       s[1185 + var38] = 240;
                                    }

                                    if (s[1205 + var38] >= 5) {
                                       s[1225 + var38]++;
                                    }
                                    break;
                                 case 2:
                                 case 3:
                                 case 4:
                                 case 5:
                                 case 6:
                                 case 7:
                                 case 8:
                                 case 9:
                                 case 10:
                                 case 11:
                                 case 12:
                                 case 13:
                                 case 14:
                                 case 15:
                                 case 16:
                                 case 17:
                                 case 18:
                                 case 19:
                                 case 20:
                                 default:
                                    s[1225 + var38]++;
                                    break;
                                 case 21:
                                    if (--s[1205 + var38] < 0) {
                                       s[1225 + var38]++;
                                    }
                                    break;
                                 case 22:
                                 case 23:
                                 case 24:
                                 case 25:
                                 case 26:
                                 case 27:
                                    if (++s[1225 + var38] >= 28) {
                                       s[1245 + var38] = -1;
                                    }
                              }

                              if (s[1205 + var38] >= 3) {
                                 for (int var95 = s[1126] + 40; var95 < s[1185 + var38]; var95 += 16) {
                                    if ((c(var95, s[1143] - 16 - s[54]) | c(var95, s[1143] + 0 - s[54]) | c(var95, s[1143] + 16 - s[54])) < 0) {
                                       s[1185 + var38] = var95;
                                       a(11, s[1185 + var38] - 8, s[1143], 0);
                                    }
                                 }
                              }

                              a(4, s[1185 + var38], s[1205 + var38], 4, 0, 0);
                              break;
                           case 11:
                           case 12:
                           case 13:
                           case 14:
                           case 15:
                              if (240 - s[1185 + var38] < 0) {
                                 s[1245 + var38] = -1;
                              }

                              if (c(s[1185 + var38] + (s[1245 + var38] - 11) * 16, s[1205 + var38] - s[54]) < 0) {
                                 if (s[1245 + var38] == 11) {
                                    s[1245 + var38] = -1;
                                 } else {
                                    s[1245 + var38]--;
                                 }
                              }

                              s[1225 + var38]++;
                              int var111 = 0;
                              if (s[1225 + var38] < 4) {
                                 s[1245 + var38]++;
                              } else {
                                 s[1185 + var38] = s[1185 + var38] + 16;
                                 var111 = s[1225 + var38] - 4 + 1;
                              }

                              if (s[1245 + var38] >= 0) {
                                 for (int var94 = 0; var94 <= s[1245 + var38] - 12; var94++) {
                                    a(1, s[1185 + var38] + var94 * 16, s[1205 + var38], 15, 250 + (var94 + var111) % 4, 0);
                                 }
                              }
                              break;
                           case 17:
                              s[1185 + var38] = s[1185 + var38] + (s[455 + s[1225 + var38]] * 24 >> 4);
                              s[1205 + var38] = s[1205 + var38] + (s[471 + s[1225 + var38]] * 24 >> 4);
                              if ((
                                    c(s[1185 + var38], s[1205 + var38] - s[54])
                                       | c(
                                          s[1185 + var38] - (s[455 + s[1225 + var38]] * 12 >> 4),
                                          s[1205 + var38] - (s[471 + s[1225 + var38]] * 12 >> 4) - s[54]
                                       )
                                       | s[1185 + var38]
                                       | 240 - s[1185 + var38]
                                       | s[1205 + var38] - s[54]
                                       | 240 - s[1205 + var38] + s[54]
                                 )
                                 < 0) {
                                 s[1245 + var38] = -1;
                              }

                              if (s[1245 + var38] >= 0) {
                                 a(1, s[1185 + var38], s[1205 + var38], 15, 91, 0);
                              }
                              break;
                           case 18:
                              s[1185 + var38] = s[1185 + var38] + (s[455 + s[9726 + var38 / 4]] * 24 >> 4);
                              s[1205 + var38] = s[1205 + var38] + (s[471 + s[9726 + var38 / 4]] * 24 >> 4);
                              if ((
                                    c(s[1185 + var38], s[1205 + var38] - s[54])
                                       | 240 - s[1185 + var38]
                                       | s[1205 + var38] - s[54]
                                       | 240 - s[1205 + var38] + s[54]
                                 )
                                 < 0) {
                                 s[1245 + var38] = -1;
                              }

                              if (s[1245 + var38] >= 0) {
                                 a(1, s[1185 + var38], s[1205 + var38], 15, 91, 0);
                              }
                              break;
                           case 19:
                              s[1185 + var38] = s[1160 + var38 / 4] + 8;
                              s[1205 + var38] = s[1165 + var38 / 4];
                              if (s[1180 + var38 / 4] != 1) {
                                 s[1245 + var38] = -1;
                              }

                              if (s[1225 + var38] < 5) {
                                 s[1225 + var38]++;
                              }

                              int var110;
                              for (var110 = 1; var110 < s[1225 + var38]; var110++) {
                                 a(1, s[1185 + var38], s[1205 + var38] - 16 * var110, 15, 93, 0);
                                 a(1, s[1185 + var38], s[1205 + var38] + 16 * var110, 15, 93, 0);
                              }

                              a(1, s[1185 + var38], s[1205 + var38] - 16 * var110, 15, 92, 0);
                              a(1, s[1185 + var38], s[1205 + var38], 15, 93, 0);
                              a(1, s[1185 + var38], s[1205 + var38] + 16 * var110, 15, 94, 0);
                              break;
                           case 20:
                              s[1185 + var38] = s[1185 + var38] + 2;
                              s[1205 + var38] = s[1205 + var38] + 8;
                              byte var31 = 96;
                              if (c(s[1185 + var38], s[1205 + var38] - s[54]) < 0) {
                                 s[1185 + var38] = s[1185 + var38] + 8;
                                 s[1205 + var38] = s[1205 + var38] - 8;
                                 var31 = 99;
                                 if (c(s[1185 + var38], s[1205 + var38] - s[54]) < 0) {
                                    s[1245 + var38] = -1;
                                 }
                              }

                              if ((240 - s[1185 + var38] | 240 - s[1205 + var38] + s[54]) < 0) {
                                 s[1245 + var38] = -1;
                              }

                              if (s[1245 + var38] >= 0) {
                                 a(1, s[1185 + var38], s[1205 + var38], 15, var31, 0);
                              }
                              break;
                           case 21:
                           case 22:
                              s[1185 + var38] = s[1185 + var38] + (6 - ++s[1225 + var38] / 4);
                              int var2;
                              if ((var2 = s[1225 + var38] / 4 * 1) > 3) {
                                 var2 = 3;
                              }

                              if (s[1245 + var38] == 21) {
                                 s[1205 + var38] = s[1205 + var38] + 8 + s[1225 + var38];
                                 var2 = 98 - var2;
                                 if ((c(s[1185 + var38], s[1205 + var38] - s[54]) | 240 - s[1185 + var38] | 240 - s[1205 + var38] + s[54]) < 0) {
                                    s[1245 + var38] = -1;
                                 }
                              } else {
                                 s[1205 + var38] = s[1205 + var38] - (8 + s[1225 + var38]);
                                 var2 = 103 - var2;
                                 if ((c(s[1185 + var38], s[1205 + var38] - s[54]) | 240 - s[1185 + var38] | 16 + s[1205 + var38] - s[54]) < 0) {
                                    s[1245 + var38] = -1;
                                 }
                              }

                              if (s[1245 + var38] >= 0) {
                                 a(1, s[1185 + var38], s[1205 + var38], 15, var2, 0);
                              }
                        }
                     }

                     s[78] = -1;
                     switch (s[41]) {
                        case 1:
                           if (s[22] == 0) {
                              if (s[31] == 0) {
                                 var1.drawRegion(
                                    this.f[3],
                                    (B[283] >> 24 & 0xFF) * 3 / 4,
                                    (B[283] >> 16 & 0xFF) * 3 / 4,
                                    (B[283] >> 8 & 0xFF) * 3 / 4,
                                    (B[283] & 0xFF) * 3 / 4,
                                    0,
                                    (128 - s[52] / 8 / 2 - 16) * 3 / 4,
                                    24,
                                    20
                                 );
                              } else if (s[31] == 2) {
                                 var1.drawRegion(
                                    this.f[3],
                                    (B[292] >> 24 & 0xFF) * 3 / 4,
                                    (B[292] >> 16 & 0xFF) * 3 / 4,
                                    (B[292] >> 8 & 0xFF) * 3 / 4,
                                    (B[292] & 0xFF) * 3 / 4,
                                    0,
                                    (128 - s[52] / 24 / 2 - 16) * 3 / 4,
                                    36,
                                    20
                                 );
                              }
                           }

                           for (int var50 = 0; var50 < 20; var50++) {
                              int var122 = s[1055 + var50] - s[9] * (var50 / 2 + 1) * s[45] & 0xFF;
                              int var130 = s[1055 + 20 + var50] & 0xFF;
                              var1.setColor(s[307 + var50]);
                              var1.drawLine(var122 * 3 / 4, var130 * 3 / 4, var122 * 3 / 4, var130 * 3 / 4);
                           }

                           for (int var51 = 0; var51 < 20; var51++) {
                              int var123 = s[1055 + var51] - s[9] * (var51 / 2 + 1) * s[45] + 160 & 0xFF;
                              int var131 = s[1055 + 20 + var51] + 80 & 0xFF;
                              var1.setColor(s[307 + var51]);
                              var1.drawLine(var123 * 3 / 4, var131 * 3 / 4, var123 * 3 / 4, var131 * 3 / 4);
                           }
                           break;
                        case 2:
                        case 3:
                           for (int var49 = 0; var49 < 20; var49++) {
                              int var121 = s[1055 + var49] - s[9] * (var49 / 2 + 1) & 0xFF;
                              int var129 = s[1055 + 20 + var49] - s[54] & 0xFF;
                              var1.setColor(s[307 + var49]);
                              var1.drawLine(var121 * 3 / 4, var129 * 3 / 4, var121 * 3 / 4, var129 * 3 / 4);
                           }
                           break;
                        case 4:
                           for (int var47 = 0; var47 < 20; var47++) {
                              int var127 = s[1055 + 20 + var47] & 0xFF;
                              s[0] = (s[307 + var47] >> 16 & 0xFF) * (92 - 8 * s[46]) / 100 << 16
                                 | (s[307 + var47] >> 8 & 0xFF) * (92 - 8 * s[46]) / 100 << 8
                                 | (s[307 + var47] & 0xFF) * (92 - 8 * s[46]) / 100;
                              var1.setColor(s[0]);
                              if (s[46] < 8) {
                                 int var117 = s[1055 + var47] - s[9] * (var47 / 2 + 1) * s[45] & 0xFF;
                                 var1.drawLine((var117 - (s[1055 + var47] & (1 << s[46]) - 1)) * 3 / 4, var127 * 3 / 4, var117 * 3 / 4, var127 * 3 / 4);
                              } else {
                                 int var118 = s[1055 + var47] - s[9] * (var47 / 2 * s[45] + (s[46] - 1) * 4 + 1) & 0xFF;
                                 var1.drawLine((var118 - (s[1055 + var47] & (1 << s[46] - 1) - 1)) * 3 / 4, var127 * 3 / 4, var118 * 3 / 4, var127 * 3 / 4);
                              }
                           }

                           for (int var48 = 0; var48 < 20; var48++) {
                              int var128 = s[1055 + 20 + var48] + 80 & 0xFF;
                              s[0] = (s[307 + var48] >> 16 & 0xFF) * (92 - 8 * s[46]) / 100 << 16
                                 | (s[307 + var48] >> 8 & 0xFF) * (92 - 8 * s[46]) / 100 << 8
                                 | (s[307 + var48] & 0xFF) * (92 - 8 * s[46]) / 100;
                              var1.setColor(s[0]);
                              if (s[46] < 8) {
                                 int var119 = s[1055 + var48] - s[9] * (var48 / 2 + 1) * s[45] + 160 & 0xFF;
                                 var1.drawLine((var119 - (s[1055 + var48] & (1 << s[46]) - 1)) * 3 / 4, var128 * 3 / 4, var119 * 3 / 4, var128 * 3 / 4);
                              } else {
                                 int var120 = s[1055 + var48] - s[9] * (var48 / 2 * s[45] + (s[46] - 1) * 4 + 1) + 160 & 0xFF;
                                 var1.drawLine((var120 - (s[1055 + var48] & (1 << s[46] - 1) - 1)) * 3 / 4, var128 * 3 / 4, var120 * 3 / 4, var128 * 3 / 4);
                              }
                           }
                           break;
                        case 5:
                           s[0] = s[1] = 0;
                           if (s[53] <= 128) {
                              s[0] = 128 - s[53];
                              s[1] = 4 * s[43];
                              if (s[53] == 96 || s[53] >= 128) {
                                 for (int var42 = 0; var42 < 16; var42++) {
                                    s[1265 + 0 + var42] = 1;
                                    s[1265 + 208 + var42] = 1;
                                 }
                              }
                           } else if (s[53] < 192) {
                              s[1] = 4 * s[43] - s[53] + 128;
                           }

                           for (int var43 = 0; var43 < 20; var43++) {
                              int var8 = s[1055 + var43] - s[9] * (var43 / 2 + 1) * s[45] & 0xFF;
                              int var9 = s[1055 + 20 + var43] & 0xFF;
                              var1.setColor(s[307 + var43]);
                              var1.drawLine(var8 * 3 / 4, var9 * 3 / 4, var8 * 3 / 4, var9 * 3 / 4);
                           }

                           for (int var44 = 0; var44 < 20; var44++) {
                              int var116 = s[1055 + var44] - s[9] * (var44 / 2 + 1) * s[45] + 160 & 0xFF;
                              int var126 = s[1055 + 20 + var44] + 80 & 0xFF;
                              var1.setColor(s[307 + var44]);
                              var1.drawLine(var116 * 3 / 4, var126 * 3 / 4, var116 * 3 / 4, var126 * 3 / 4);
                           }

                           for (int var45 = 0; var45 < 6; var45++) {
                              a(0, 0 - s[53] % 48 + var45 * 16 * 3, 0 - s[0] / 8, 6, 333, 196867);
                              a(0, 0 - s[53] % 48 + var45 * 16 * 3, 208 + s[0] / 8, 6, 334, 196867);
                           }

                           if (s[22] == 0 && 128 <= s[53]) {
                              for (int var46 = 0; var46 < 6; var46++) {
                                 var1.drawRegion(
                                    this.f[4],
                                    (B[293] >> 24 & 0xFF) * 3 / 4,
                                    (B[293] >> 16 & 0xFF) * 3 / 4,
                                    (B[293] >> 8 & 0xFF) * 3 / 4,
                                    (B[293] & 0xFF) * 3 / 4,
                                    0,
                                    (0 - s[53] % 48 + var46 * 16 * 3) * 3 / 4,
                                    (16 - s[1] / 2 * 16) * 3 / 4,
                                    20
                                 );
                                 var1.drawRegion(
                                    this.f[4],
                                    (B[294] >> 24 & 0xFF) * 3 / 4,
                                    (B[294] >> 16 & 0xFF) * 3 / 4,
                                    (B[294] >> 8 & 0xFF) * 3 / 4,
                                    (B[294] & 0xFF) * 3 / 4,
                                    0,
                                    (0 - s[53] % 48 + var46 * 16 * 3) * 3 / 4,
                                    (144 + s[1] / 2 * 16) * 3 / 4,
                                    20
                                 );
                              }
                           }

                           if (s[53] >= 128 + 4 * s[43]) {
                              s[41] = 6;
                           }
                           break;
                        case 6:
                           for (int var40 = 0; var40 < 6; var40++) {
                              a(0, 0 - s[53] % 48 + var40 * 16 * 3, 0, 6, 333, 196867);
                              a(0, 0 - s[53] % 48 + var40 * 16 * 3, 208, 6, 334, 196867);
                           }

                           if (s[22] == 0) {
                              for (int var41 = 0; var41 < 6; var41++) {
                                 var1.drawRegion(
                                    this.f[4],
                                    (B[293] >> 24 & 0xFF) * 3 / 4,
                                    (B[293] >> 16 & 0xFF) * 3 / 4,
                                    (B[293] >> 8 & 0xFF) * 3 / 4,
                                    (B[293] & 0xFF) * 3 / 4,
                                    0,
                                    (0 - s[53] % 48 + var41 * 16 * 3) * 3 / 4,
                                    12,
                                    20
                                 );
                                 var1.drawRegion(
                                    this.f[4],
                                    (B[294] >> 24 & 0xFF) * 3 / 4,
                                    (B[294] >> 16 & 0xFF) * 3 / 4,
                                    (B[294] >> 8 & 0xFF) * 3 / 4,
                                    (B[294] & 0xFF) * 3 / 4,
                                    0,
                                    (0 - s[53] % 48 + var41 * 16 * 3) * 3 / 4,
                                    108,
                                    20
                                 );
                              }
                           }
                           break;
                        case 7:
                           if (s[22] == 0) {
                              for (int var39 = 0; var39 < 6 * s[88]; var39++) {
                                 var1.drawRegion(
                                    this.f[4],
                                    (B[301 + var39 / 6] >> 24 & 0xFF) * 3 / 4,
                                    (B[301 + var39 / 6] >> 16 & 0xFF) * 3 / 4,
                                    (B[301 + var39 / 6] >> 8 & 0xFF) * 3 / 4,
                                    (B[301 + var39 / 6] & 0xFF) * 3 / 4,
                                    0,
                                    var39 % 6 * 16 * 3 * 3 / 4,
                                    (16 + var39 / 6 * 16) * 3 / 4,
                                    20
                                 );
                                 var1.drawRegion(
                                    this.f[4],
                                    (B[309 + (23 - var39) / 6] >> 24 & 0xFF) * 3 / 4,
                                    (B[309 + (23 - var39) / 6] >> 16 & 0xFF) * 3 / 4,
                                    (B[309 + (23 - var39) / 6] >> 8 & 0xFF) * 3 / 4,
                                    (B[309 + (23 - var39) / 6] & 0xFF) * 3 / 4,
                                    0,
                                    var39 % 6 * 16 * 3 * 3 / 4,
                                    (192 - var39 / 6 * 16) * 3 / 4,
                                    20
                                 );
                              }
                           }

                           a(0, s[92] + 0, s[91] * s[93] + 0, 6, 333, 196865);
                           a(0, s[92] + 48, s[91] * s[93] + 0, 6, 333, 196865);
                           a(0, s[92] + 144, s[91] * s[93] + 0, 6, 333, 196865);
                           a(0, s[92] + 192, s[91] * s[93] + 0, 6, 333, 196865);
                           a(0, s[92] + 0, s[91] * s[93] + 208, 6, 334, 196865);
                           a(0, s[92] + 48, s[91] * s[93] + 208, 6, 334, 196865);
                           a(0, s[92] + 144, s[91] * s[93] + 208, 6, 334, 196865);
                           a(0, s[92] + 192, s[91] * s[93] + 208, 6, 334, 196865);
                           a(0, s[92] + 0, s[91] * s[93] + 16, 6, 335, 66305);
                           a(1, s[92] + 0, s[91] * s[93] + 64, 6, 337, 0);
                           a(1, s[92] + 0, s[91] * s[93] + 144, 6, 338, 0);
                           a(0, s[92] + 0, s[91] * s[93] + 160, 6, 335, 66305);
                           a(0, s[92] + 224, s[91] * s[93] + 16, 6, 336, 66305);
                           a(1, s[92] + 224, s[91] * s[93] + 64, 6, 339, 0);
                           a(1, s[92] + 224, s[91] * s[93] + 144, 6, 340, 0);
                           a(0, s[92] + 224, s[91] * s[93] + 160, 6, 336, 66305);
                           a(1, s[92] + 0, s[91] * s[93] + 0, 7, 341, 0);
                           a(1, s[92] + 224, s[91] * s[93] + 0, 7, 342, 0);
                           a(1, s[92] + 0, s[91] * s[93] + 208, 7, 343, 0);
                           a(1, s[92] + 224, s[91] * s[93] + 208, 7, 344, 0);
                           a(0, s[92] + 88 - s[9740], s[91] * s[93] + 0, 7, 345, 131329);
                           a(0, s[92] + 120 + s[9740], s[91] * s[93] + 0, 7, 346, 131329);
                           a(0, s[92] + 88 - s[9742], s[91] * s[93] + 208, 7, 345, 131329);
                           a(0, s[92] + 120 + s[9742], s[91] * s[93] + 208, 7, 346, 131329);
                           a(0, s[92] + 0, s[91] * s[93] + 80 - s[9739], 7, 347, 66049);
                           a(0, s[92] + 0, s[91] * s[93] + 112 + s[9739], 7, 348, 66049);
                           a(0, s[92] + 224, s[91] * s[93] + 80 - s[9741], 7, 347, 66049);
                           a(0, s[92] + 224, s[91] * s[93] + 112 + s[9741], 7, 348, 66049);
                           if (6 <= s[86]) {
                              a(0, s[92] + 0 + s[90] * 240, s[91] * s[93] + 0 + s[91] * 224, 6, 333, 196865);
                              a(0, s[92] + 48 + s[90] * 240, s[91] * s[93] + 0 + s[91] * 224, 6, 333, 196865);
                              a(0, s[92] + 144 + s[90] * 240, s[91] * s[93] + 0 + s[91] * 224, 6, 333, 196865);
                              a(0, s[92] + 192 + s[90] * 240, s[91] * s[93] + 0 + s[91] * 224, 6, 333, 196865);
                              a(0, s[92] + 0 + s[90] * 240, s[91] * s[93] + 208 + s[91] * 224, 6, 334, 196865);
                              a(0, s[92] + 48 + s[90] * 240, s[91] * s[93] + 208 + s[91] * 224, 6, 334, 196865);
                              a(0, s[92] + 144 + s[90] * 240, s[91] * s[93] + 208 + s[91] * 224, 6, 334, 196865);
                              a(0, s[92] + 192 + s[90] * 240, s[91] * s[93] + 208 + s[91] * 224, 6, 334, 196865);
                              a(0, s[92] + 0 + s[90] * 240, s[91] * s[93] + 16 + s[91] * 224, 6, 335, 66305);
                              a(1, s[92] + 0 + s[90] * 240, s[91] * s[93] + 64 + s[91] * 224, 6, 337, 0);
                              a(1, s[92] + 0 + s[90] * 240, s[91] * s[93] + 144 + s[91] * 224, 6, 338, 0);
                              a(0, s[92] + 0 + s[90] * 240, s[91] * s[93] + 160 + s[91] * 224, 6, 335, 66305);
                              a(0, s[92] + 224 + s[90] * 240, s[91] * s[93] + 16 + s[91] * 224, 6, 336, 66305);
                              a(1, s[92] + 224 + s[90] * 240, s[91] * s[93] + 64 + s[91] * 224, 6, 339, 0);
                              a(1, s[92] + 224 + s[90] * 240, s[91] * s[93] + 144 + s[91] * 224, 6, 339, 0);
                              a(0, s[92] + 224 + s[90] * 240, s[91] * s[93] + 160 + s[91] * 224, 6, 336, 66305);
                              a(1, s[92] + 0 + s[90] * 240, s[91] * s[93] + 0 + s[91] * 224, 7, 341, 0);
                              a(1, s[92] + 224 + s[90] * 240, s[91] * s[93] + 0 + s[91] * 224, 7, 342, 0);
                              a(1, s[92] + 0 + s[90] * 240, s[91] * s[93] + 208 + s[91] * 224, 7, 343, 0);
                              a(1, s[92] + 224 + s[90] * 240, s[91] * s[93] + 208 + s[91] * 224, 7, 344, 0);
                              a(0, s[92] + 88 - s[9744] + s[90] * 240, s[91] * s[93] + 0 + s[91] * 224, 7, 345, 131329);
                              a(0, s[92] + 120 + s[9744] + s[90] * 240, s[91] * s[93] + 0 + s[91] * 224, 7, 346, 131329);
                              a(0, s[92] + 88 - s[9746] + s[90] * 240, s[91] * s[93] + 208 + s[91] * 224, 7, 345, 131329);
                              a(0, s[92] + 120 + s[9746] + s[90] * 240, s[91] * s[93] + 208 + s[91] * 224, 7, 346, 131329);
                              a(0, s[92] + 0 + s[90] * 240, s[91] * s[93] + 80 - s[9743] + s[91] * 224, 7, 347, 66049);
                              a(0, s[92] + 0 + s[90] * 240, s[91] * s[93] + 112 + s[9743] + s[91] * 224, 7, 348, 66049);
                              a(0, s[92] + 224 + s[90] * 240, s[91] * s[93] + 80 - s[9745] + s[91] * 224, 7, 347, 66049);
                              a(0, s[92] + 224 + s[90] * 240, s[91] * s[93] + 112 + s[9745] + s[91] * 224, 7, 348, 66049);
                           }
                           break;
                        case 8:
                           s[53] = s[53] + 2;
                           if (s[22] == 0) {
                              a(2, 0, s[53] % 48, 0, 0, 0);
                           }
                           break;
                        case 9:
                           if (s[22] == 0) {
                              a(4, s[53] % 48, 0, 0, 0, 0);
                           }
                     }

                     switch (s[86]) {
                        case 1:
                           if (++s[96] <= 4) {
                              s[88]++;
                           } else {
                              s[88] = 4;
                              s[86]++;
                              b(112, 224, 0, s[87]);
                           }
                        case 2:
                        default:
                           break;
                        case 3:
                           if (++s[89] >= 8) {
                              s[86]++;
                              s[89] = s[96] = 0;
                              s[9751 + s[87]] = 1;
                              s[9747] = s[9748] = s[9750] = 0;
                              s[9749] = 1;
                              if (s[87] >= 5) {
                                 s[9748] = 1;
                              }

                              if (s[87] < 15) {
                                 s[9750] = 1;
                              }

                              if (s[9751 + (s[87] - 5)] != 0) {
                                 s[9748] = 0;
                              }

                              if (s[9751 + s[87] + 5] != 0) {
                                 s[9750] = 0;
                              }

                              if (s[9748] == 1) {
                                 s[1265 + 0 + (s[52] / 16 + 6) % 16] = 0;
                                 s[1265 + 0 + (s[52] / 16 + 7) % 16] = 0;
                                 s[1265 + 0 + (s[52] / 16 + 8) % 16] = 0;
                              }

                              if (s[9749] == 1) {
                                 s[1265 + 80 + (s[52] / 16 + 14) % 16] = 0;
                                 s[1265 + 96 + (s[52] / 16 + 14) % 16] = 0;
                                 s[1265 + 112 + (s[52] / 16 + 14) % 16] = 0;
                                 s[1265 + 128 + (s[52] / 16 + 14) % 16] = 0;
                              }

                              if (s[9750] == 1) {
                                 s[1265 + 208 + (s[52] / 16 + 6) % 16] = 0;
                                 s[1265 + 208 + (s[52] / 16 + 7) % 16] = 0;
                                 s[1265 + 208 + (s[52] / 16 + 8) % 16] = 0;
                              }
                           }
                           break;
                        case 4:
                           if (s[96]++ >= 10) {
                              s[86]++;
                           } else {
                              if (s[96] <= 4) {
                                 s[88] = 4 - s[96];
                                 break;
                              }

                              for (int var57 = 1; var57 < 4; var57++) {
                                 if (s[9747 + var57] == 1) {
                                    s[9739 + var57] = s[9739 + var57] + 4;
                                 }
                              }
                           }
                           break;
                        case 5:
                           if (s[9748] == 1 && 88 <= s[1126] && s[1126] <= 112 && s[1143] <= 40) {
                              s[87] = s[87] - 5;
                              s[86]++;
                              s[91] = -1;
                              s[9746] = 24;
                           } else if (s[9749] == 1 && 80 <= s[1143] && s[1143] <= 128 && 168 <= s[1126]) {
                              s[87]++;
                              s[86]++;
                              s[90] = 1;
                              s[9743] = 24;
                           } else if (s[9750] == 1 && 88 <= s[1126] && s[1126] <= 112 && 168 <= s[1143]) {
                              s[87] = s[87] + 5;
                              s[86]++;
                              s[91] = 1;
                              s[9744] = 24;
                           }

                           s[96] = 0;
                           break;
                        case 6:
                           if (s[96]++ < 6) {
                              if (s[91] != -1 && s[9748] != 0) {
                                 s[9740] = s[9740] - 4;
                              }

                              if (s[90] != 1 && s[9749] != 0) {
                                 s[9741] = s[9741] - 4;
                              }

                              if (s[91] != 1 && s[9750] != 0) {
                                 s[9742] = s[9742] - 4;
                              }
                           } else {
                              s[86]++;
                              if (s[87] % 5 != 0 || s[90] != 1) {
                                 break;
                              }

                              s[86] = 0;
                              s[41] = 0;
                              s[9745] = 24;
                              s[9743] = 0;

                              for (int var56 = 0; var56 < 752; var56++) {
                                 s[1265 + var56] = 0;
                              }

                              b(111, -48, 0, 1);
                           }
                           break;
                        case 7:
                           s[86]++;
                        case 8:
                           if (s[90] == 1) {
                              s[92] = s[92] - 16;
                              s[1126] = s[1126] - 10;

                              for (int var55 = 16; var55 >= 1; var55--) {
                                 s[1126 + var55] = s[1126 + var55] - 10;
                              }

                              if (s[92] <= -240) {
                                 s[86]++;
                                 s[96] = 0;
                              }
                           } else {
                              s[93] = s[93] - 16;
                              s[1143] = s[1143] - s[91] * 16 * 5 / 8;

                              for (int var54 = 16; var54 >= 1; var54--) {
                                 s[1143 + var54] = s[1143 + var54] - s[91] * 16 * 5 / 8;
                              }

                              if (s[93] <= -224) {
                                 s[86]++;
                                 s[96] = 0;
                              }
                           }
                           break;
                        case 9:
                           if (s[96]++ >= 6) {
                              s[86] = 1;
                              s[92] = s[93] = s[90] = s[91] = 0;
                              s[9739] = s[9740] = s[9741] = s[9742] = s[9743] = s[9744] = s[9745] = s[9746] = 0;
                              s[96] = 0;

                              for (int var52 = 0; var52 < 15; var52++) {
                                 s[1265 + 0 + (s[52] / 16 + var52) % 16] = 1;
                                 s[1265 + 208 + (s[52] / 16 + var52) % 16] = 1;
                              }

                              for (int var53 = 1; var53 < 13; var53++) {
                                 s[1265 + var53 * 16 + s[52] / 16 % 16] = 1;
                                 s[1265 + var53 * 16 + (s[52] / 16 + 14) % 16] = 1;
                              }
                           } else if (s[96] <= 6) {
                              if (s[9746] > 0) {
                                 s[9746] = s[9746] - 4;
                              }

                              if (s[9744] > 0) {
                                 s[9744] = s[9744] - 4;
                              }

                              if (s[9743] > 0) {
                                 s[9743] = s[9743] - 4;
                              }
                           }
                     }

                     this.g();
                     this.j(var1);
                     this.b(var1);
                     if (s[41] == 3) {
                        for (int var132 = 0; var132 < 15; var132++) {
                           int var58 = 66 * (s[54] / 16 + var132);

                           for (int var124 = 0; var124 < 16; var124++) {
                              int var97;
                              int var7 = (var97 = s[53] - 240) / 16 + var124;
                              if (var97 < 0 && var97 % 16 != 0) {
                                 var7--;
                              }

                              if (var7 >= 0 && (y[s[48] + (var58 + var7) * 2] & 255) > 0) {
                                 try {
                                    C = ((y[s[48] + (var58 + var7) * 2] & 255) - 189) % 16 * 16;
                                    D = (((y[s[48] + (var58 + var7) * 2] & 255) - 189) / 16 + (y[s[48] + (var58 + var7) * 2 + 1] & 3) * 3) * 16;
                                    if (C >= 0 && D >= 0) {
                                       var1.drawRegion(
                                          this.f[4],
                                          C * 3 / 4,
                                          D * 3 / 4,
                                          12,
                                          12,
                                          0,
                                          (var124 * 16 - s[53] % 16) * 3 / 4,
                                          (var132 * 16 - s[54] % 16) * 3 / 4,
                                          20
                                       );
                                    }
                                 } catch (Throwable var24) {
                                 }
                              }
                           }
                        }

                        if (s[53] % 16 == 0) {
                           int var112 = s[48] + s[53] / 16 * 2;

                           for (int var59 = 0; var59 < s[37] / 16; var59++) {
                              byte var115 = 0;
                              if ((y[var112] & 255) >= s[39] + s[40] - 1) {
                                 var115 = 1;
                              }

                              s[1265 + var59 * 16 + (s[52] / 16 - 1) % 16] = var115;
                              var112 += s[38] / 16 * 2;
                           }
                        }
                     }

                     this.a(var1);
                     s[52] = s[52] + s[43];
                     s[53] = s[53] + s[43];
                     s[50] = s[50] - s[42];
                     if (s[36] > 224) {
                        s[54] = s[54] + s[44];
                        if (s[54] < 0) {
                           s[54] = 0;
                        }

                        if (s[36] - 224 < s[54]) {
                           s[54] = s[36] - 224;
                        }

                        s[44] = 0;
                     }

                     if (s[16] >= s[18]) {
                        s[17]++;
                        s[18] = s[18] + 70000;
                        b(7);
                     }

                     byte var60 = 50;
                     if (s[59] >= 13) {
                        var60 = 56;
                     }

                     if (s[79] == 1) {
                        var60 += 7;
                     }

                     var1.drawRegion(
                        this.f[0],
                        (B[var60] >> 24 & 0xFF) * 3 / 4,
                        (B[var60] >> 16 & 0xFF) * 3 / 4,
                        (B[var60] >> 8 & 0xFF) * 3 / 4,
                        (B[var60] & 0xFF) * 3 / 4,
                        0,
                        12,
                        168,
                        20
                     );
                     var60 = 51;
                     if (s[61] >= 20) {
                        var60 = 56;
                     }

                     if (s[79] == 2) {
                        var60 += 7;
                     }

                     var1.drawRegion(
                        this.f[0],
                        (B[var60] >> 24 & 0xFF) * 3 / 4,
                        (B[var60] >> 16 & 0xFF) * 3 / 4,
                        (B[var60] >> 8 & 0xFF) * 3 / 4,
                        (B[var60] & 0xFF) * 3 / 4,
                        0,
                        24,
                        168,
                        20
                     );
                     var60 = 52;
                     if (s[60] != 0 && s[60] < 8) {
                        var60 = 56;
                     }

                     if (s[79] == 3) {
                        var60 += 7;
                     }

                     var1.drawRegion(
                        this.f[0],
                        (B[var60] >> 24 & 0xFF) * 3 / 4,
                        (B[var60] >> 16 & 0xFF) * 3 / 4,
                        (B[var60] >> 8 & 0xFF) * 3 / 4,
                        (B[var60] & 0xFF) * 3 / 4,
                        0,
                        36,
                        168,
                        20
                     );
                     var60 = 53;
                     if (8 <= s[60]) {
                        var60 = 56;
                     }

                     if (s[79] == 4) {
                        var60 += 7;
                     }

                     var1.drawRegion(
                        this.f[0],
                        (B[var60] >> 24 & 0xFF) * 3 / 4,
                        (B[var60] >> 16 & 0xFF) * 3 / 4,
                        (B[var60] >> 8 & 0xFF) * 3 / 4,
                        (B[var60] & 0xFF) * 3 / 4,
                        0,
                        48,
                        168,
                        20
                     );
                     var60 = 54;
                     if (s[84] == 2 || s[71] == 0 && s[65] >= 4) {
                        var60 = 56;
                     }

                     if (s[79] == 5) {
                        var60 += 7;
                     }

                     var1.drawRegion(
                        this.f[0],
                        (B[var60] >> 24 & 0xFF) * 3 / 4,
                        (B[var60] >> 16 & 0xFF) * 3 / 4,
                        (B[var60] >> 8 & 0xFF) * 3 / 4,
                        (B[var60] & 0xFF) * 3 / 4,
                        0,
                        60,
                        168,
                        20
                     );
                     var60 = 55;
                     if (s[62] >= 1) {
                        var60 = 56;
                     }

                     if (s[79] == 6) {
                        var60 += 7;
                     }

                     var1.drawRegion(
                        this.f[0],
                        (B[var60] >> 24 & 0xFF) * 3 / 4,
                        (B[var60] >> 16 & 0xFF) * 3 / 4,
                        (B[var60] >> 8 & 0xFF) * 3 / 4,
                        (B[var60] & 0xFF) * 3 / 4,
                        0,
                        72,
                        168,
                        20
                     );
                     var60 = 64;
                     if (s[1120] == 1) {
                        var60 = 70;
                     }

                     if (s[80] == 1) {
                        var60 += 7;
                     }

                     var1.drawRegion(
                        this.f[0],
                        (B[var60] >> 24 & 0xFF) * 3 / 4,
                        (B[var60] >> 16 & 0xFF) * 3 / 4,
                        (B[var60] >> 8 & 0xFF) * 3 / 4,
                        (B[var60] & 0xFF) * 3 / 4,
                        0,
                        96,
                        168,
                        20
                     );
                     var60 = 65;
                     if (s[1121] == 1) {
                        var60 = 70;
                     }

                     if (s[80] == 2) {
                        var60 += 7;
                     }

                     var1.drawRegion(
                        this.f[0],
                        (B[var60] >> 24 & 0xFF) * 3 / 4,
                        (B[var60] >> 16 & 0xFF) * 3 / 4,
                        (B[var60] >> 8 & 0xFF) * 3 / 4,
                        (B[var60] & 0xFF) * 3 / 4,
                        0,
                        108,
                        168,
                        20
                     );
                     var60 = 66;
                     if (s[1122] == 1) {
                        var60 = 70;
                     }

                     if (s[80] == 3) {
                        var60 += 7;
                     }

                     var1.drawRegion(
                        this.f[0],
                        (B[var60] >> 24 & 0xFF) * 3 / 4,
                        (B[var60] >> 16 & 0xFF) * 3 / 4,
                        (B[var60] >> 8 & 0xFF) * 3 / 4,
                        (B[var60] & 0xFF) * 3 / 4,
                        0,
                        120,
                        168,
                        20
                     );
                     var60 = 67;
                     if (s[1123] == 1) {
                        var60 = 70;
                     }

                     if (s[80] == 4) {
                        var60 += 7;
                     }

                     var1.drawRegion(
                        this.f[0],
                        (B[var60] >> 24 & 0xFF) * 3 / 4,
                        (B[var60] >> 16 & 0xFF) * 3 / 4,
                        (B[var60] >> 8 & 0xFF) * 3 / 4,
                        (B[var60] & 0xFF) * 3 / 4,
                        0,
                        132,
                        168,
                        20
                     );
                     var60 = 68;
                     if (s[1124] == 1) {
                        var60 = 70;
                     }

                     if (s[80] == 5) {
                        var60 += 7;
                     }

                     var1.drawRegion(
                        this.f[0],
                        (B[var60] >> 24 & 0xFF) * 3 / 4,
                        (B[var60] >> 16 & 0xFF) * 3 / 4,
                        (B[var60] >> 8 & 0xFF) * 3 / 4,
                        (B[var60] & 0xFF) * 3 / 4,
                        0,
                        144,
                        168,
                        20
                     );
                     var60 = 69;
                     if (s[1125] == 1) {
                        var60 = 70;
                     }

                     if (s[80] == 6) {
                        var60 += 7;
                     }

                     var1.drawRegion(
                        this.f[0],
                        (B[var60] >> 24 & 0xFF) * 3 / 4,
                        (B[var60] >> 16 & 0xFF) * 3 / 4,
                        (B[var60] >> 8 & 0xFF) * 3 / 4,
                        (B[var60] & 0xFF) * 3 / 4,
                        0,
                        156,
                        168,
                        20
                     );
                     var1.drawRegion(
                        this.f[0], (B[1] >> 24 & 0xFF) * 3 / 4, (B[1] >> 16 & 0xFF) * 3 / 4, (B[1] >> 8 & 0xFF) * 3 / 4, (B[1] & 0xFF) * 3 / 4, 0, 0, 168, 20
                     );
                     var1.drawRegion(
                        this.f[0], (B[1] >> 24 & 0xFF) * 3 / 4, (B[1] >> 16 & 0xFF) * 3 / 4, (B[1] >> 8 & 0xFF) * 3 / 4, (B[1] & 0xFF) * 3 / 4, 0, 84, 168, 20
                     );
                     var1.drawRegion(
                        this.f[0], (B[1] >> 24 & 0xFF) * 3 / 4, (B[1] >> 16 & 0xFF) * 3 / 4, (B[1] >> 8 & 0xFF) * 3 / 4, (B[1] & 0xFF) * 3 / 4, 0, 168, 168, 20
                     );
                     this.a(var1, s[16], 7, 140, 2, 4);
                     var1.drawRegion(
                        this.f[0], (B[43] >> 24 & 0xFF) * 3 / 4, (B[43] >> 16 & 0xFF) * 3 / 4, (B[43] >> 8 & 0xFF) * 3 / 4, (B[43] & 0xFF) * 3 / 4, 0, 0, 0, 20
                     );
                     this.a(var1, s[17], 2, 14, 2, 4);
                     if (s[34] != 0 && 20 < s[34]++) {
                        if (a[9]) {
                           a[9] = false;
                           b = 14;
                           s[0] = 2;
                           s[1] = 0;
                           s[2] = 1;
                           s[3] = 0;
                           this.a(6, 6);
                           if (s[9776 + s[31]] < s[9771 + s[31]] && s[16] >= s[9771 + s[31]]) {
                              switch (s[31]) {
                                 case 0:
                                    if (++s[67] >= 4) {
                                       s[67] = 4;
                                    }

                                    s[3] = 2;
                                    break;
                                 case 1:
                                    if (++s[67] >= 4) {
                                       s[67] = 4;
                                    }

                                    s[3] = 2;
                                    break;
                                 case 2:
                                    s[66] = 2;
                                    s[3] = 1;
                                    break;
                                 case 3:
                                    if (++s[67] >= 4) {
                                       s[67] = 4;
                                    }

                                    s[3] = 2;
                                    break;
                                 case 4:
                                    s[68] = 2;
                                    s[3] = 3;
                              }
                           }

                           if (s[9776 + s[31]] < s[16]) {
                              s[9776 + s[31]] = s[16];
                           }

                           e(52);
                        } else {
                           b = 18;
                           if (s[31] == 4) {
                              b = 23;
                              this.a(6, 6);
                              s[9] = 0;
                              if (s[23] <= 1) {
                                 b = 21;
                                 s[19] = 0;
                                 break;
                              }

                              if (2 <= s[32]) {
                                 if (s[99] < s[16]) {
                                    s[99] = s[16];
                                    s[102] = s[32] * 5 + s[31];
                                 }

                                 if (s[98] < s[16]) {
                                    s[99] = s[98];
                                    s[98] = s[16];
                                    s[102] = s[101];
                                    s[101] = s[32] * 5 + s[31];
                                 }

                                 if (s[97] < s[16]) {
                                    s[98] = s[97];
                                    s[97] = s[16];
                                    s[101] = s[100];
                                    s[100] = s[32] * 5 + s[31];
                                 }
                              }

                              s[32]++;
                              if (s[33] < s[32]) {
                                 s[33] = s[32];
                              }
                           }

                           s[31] = (s[31] + 1) % 5;
                           if (s[35] < s[31]) {
                              s[35] = s[31];
                           }

                           e(0);
                           if (s[32] < 3) {
                              e(20);
                           }
                        }
                     }
                  }
                  break;
               case 206:
                  this.Q = System.currentTimeMillis() + 2000L;
                  this.P = Image.createImage("/konami.png");
                  this.a(0, "c1");
                  var1.drawImage(this.P, 90, 90, 3);
                  this.a(var1, "LOADING", 71, 162);
                  b = 1;
                  break;
               case 207:
                  var1.drawImage(this.P, 90, 90, 3);
                  if (System.currentTimeMillis() > this.Q || s[12] != 0) {
                     this.Q = System.currentTimeMillis() + 2000L;
                     b = 208;
                     this.P = null;
                  }
                  break;
               case 208:
                  long var10;
                  if ((var10 = System.currentTimeMillis()) > this.Q || s[12] != 0) {
                     b = 5;
                     var1.drawRegion(
                        this.f[2],
                        (B[349] >> 24 & 0xFF) * 3 / 4,
                        (B[349] >> 16 & 0xFF) * 3 / 4,
                        (B[349] >> 8 & 0xFF) * 3 / 4,
                        (B[349] & 0xFF) * 3 / 4,
                        0,
                        0,
                        24,
                        20
                     );
                  } else if (var10 > this.Q - 500L) {
                     int var12 = (int)(500L - this.Q + var10);
                     var1.drawRegion(
                        this.f[2],
                        (B[349] >> 24 & 0xFF) * 3 / 4,
                        (B[349] >> 16 & 0xFF) * 3 / 4,
                        (B[349] >> 8 & 0xFF) * 3 / 4,
                        (B[349] & 0xFF) * 3 / 4,
                        0,
                        0,
                        (80 - 48 * var12 / 500) * 3 / 4,
                        20
                     );
                  } else {
                     var1.drawRegion(
                        this.f[2],
                        (B[349] >> 24 & 0xFF) * 3 / 4,
                        (B[349] >> 16 & 0xFF) * 3 / 4,
                        (B[349] >> 8 & 0xFF) * 3 / 4,
                        (B[349] & 0xFF) * 3 / 4,
                        0,
                        0,
                        60,
                        20
                     );
                  }
                  break;
               case 999:
                  int var18 = 19;
                  boolean var20 = false;
                  this.a(var1, "YES", 99, 19);
                  this.a(var1, "NO", 99, 35);
                  var1.setColor(0);
                  var1.fillRect(0, 0, this.getWidth(), this.getHeight());
                  String var21 = "";
                  if (this.M == null) {
                     this.M = a.a(172, "Would you like to view more games from Konami?" + var21, var1.getFont());
                  }

                  var1.setColor(16777215);

                  for (int var3 = 0; var3 < this.M.length; var3++) {
                     var1.drawString(this.M[var3], 93, (3 + (var1.getFont().getHeight() + 10) * (var3 + 1)) * 3 / 4, 17);
                     var18 += var1.getFont().getHeight() + 10;
                  }

                  this.a(var1, "YES", 99, var18 + 32);
                  this.a(var1, "NO", 99, var18 + 48);
                  if ((s[12] & 2) != 0) {
                     s[0]++;
                  } else if ((s[12] & 64) != 0) {
                     s[0]++;
                  }

                  s[0] = s[0] % 2;
                  var1.drawRegion(
                     this.f[0],
                     (B[46 + (s[9] & 3)] >> 24 & 0xFF) * 3 / 4,
                     (B[46 + (s[9] & 3)] >> 16 & 0xFF) * 3 / 4,
                     (B[46 + (s[9] & 3)] >> 8 & 0xFF) * 3 / 4,
                     (B[46 + (s[9] & 3)] & 0xFF) * 3 / 4,
                     0,
                     62,
                     (var18 + 16 + (s[0] + 1) * 16 - 2) * 3 / 4,
                     20
                  );
                  if ((s[12] & 256) != 0) {
                     switch (s[0]) {
                        case 0:
                           try {
                              String var22 = "2206";
                              this.m = false;
                              this.w.platformRequest("http://wap.cingularextras.com/fuel/enduser/endUserWMLDesc?categoryID=" + var22);
                           } catch (Throwable var23) {
                              a.a(var23.toString());
                           }
                           break;
                        case 1:
                           this.m = false;
                     }
                  }
            }

            var1.setColor(0);
            var1.translate(-s[7], -s[8]);
            var1.setClip(0, 0, this.getWidth(), this.getHeight());
            if (0 < s[7]) {
               var1.fillRect(0, 0, s[7], 240);
               var1.fillRect(s[7] + 180, 0, s[7] + 1, 240);
            }

            if (0 < s[8]) {
               var1.fillRect(0, 0, 240, s[8]);
               if (b != 6) {
                  var1.fillRect(0, s[8] + 180, 240, s[8] + 5);
               }
            }

            this.c(var1);
         } catch (Throwable var29) {
         }
      }
   }

   private void i() {
      o++;
      o %= 3;
      switch (o) {
         case 0:
            this.a();
            break;
         case 1:
            a(c);
            break;
         case 2:
            b(7);
      }

      e(0);
   }

   private void j() {
      if (a[3]) {
         a[3] = false;
         if (o != 2 && !this.e) {
            return;
         }

         String[] var1 = new String[]{
            "0_skyenemydie",
            "1_corehit",
            "2_enemydie1",
            "3_enemydie2",
            "4_longlaser",
            "5_powerget",
            "6_optionselect",
            "7_powerup",
            "8_biglaser",
            "9_bossdie",
            "10_viperdie",
            "11_coin"
         };
         this.a("/" + var1[s[28]] + ".mid", 1);
      }
   }

   private void k() {
      if (System.currentTimeMillis() < this.p && this.q) {
         a(c);
         Thread.yield();
      } else {
         this.p = 0L;
         if (a[2]) {
            a[2] = false;
            if (o != 1 && !this.e) {
               return;
            }

            int var3 = c / 3 - 4;
            String[] var4 = new String[]{"boss1", "st1", "st2", "st3", "st4", "st5", "boss2", "lastboss", "ending1"};
            this.a("/" + var4[var3] + ".mid", -1);
            if (this.q) {
               this.q = false;
               this.T = 1;
               this.l();
            }
         }
      }
   }

   private void l() {
      switch (this.T) {
         case 0:
            this.m();
            this.T++;
            return;
         case 1:
            try {
               Player var1;
               if ((var1 = (Player)this.V.get(this.R)) != null) {
                  this.T++;
                  var1.realize();
                  var1.setLoopCount(this.S);
                  var1.start();
                  this.U = var1;
               } else {
                  String var2 = "audio/midi";
                  Player var3;
                  (var3 = Manager.createPlayer(this.getClass().getResourceAsStream(this.R), var2)).addPlayerListener(this);
                  this.V.put(this.R, var3);
               }

               return;
            } catch (Throwable var4) {
               this.T = 0;
               a.a(" pse:" + var4);
               if (var4.getMessage().equals("device error")) {
                  this.T = 2;
               }

               return;
            }
         case 2:
            this.R = null;
            this.T++;
      }
   }

   private void a(String var1, int var2) {
      this.R = var1;
      this.S = var2;
      this.T = 0;
   }

   private void m() {
      if (this.U != null) {
         try {
            this.U.stop();
            this.U.deallocate();
         } catch (Throwable var2) {
         }

         this.U = null;
      }
   }

   public final void playerUpdate(Player var1, String var2, Object var3) {
   }

   public final void b() {
      if (!r) {
         r = true;
         this.i = 0;
         this.a();
      }
   }

   public final void c() {
      if (r) {
         this.p = System.currentTimeMillis() + 1000L;
         this.q = true;
         r = false;
         if (b == 20) {
            if (!a[4]) {
               a[4] = true;
               b = 205;
            }

            a(c);
            this.l();
            a(c);
         }

         if (b >= 4 && b <= 14 || b == 22 || b == 203 || b == 23 || b == 24) {
            a(c);
            this.l();
            a(c);
         }

         this.l();
      }
   }
}

import { Graphics } from '../../j2me/lcdui/Graphics';
import { Image } from '../../j2me/lcdui/Image';
import { GameCanvas } from '../../j2me/lcdui/game/GameCanvas';
import type { ResourceManager } from '../../runtime/resources';

/**
 * Direkte Portierung von decompiled/src/b.java.
 *
 * Regeln für diese Datei:
 * - Originale Zustandsarrays und Indizes bleiben unverändert.
 * - Ganzzahlige Java-Werte verwenden typisierte Arrays.
 * - Überladene Methoden erhalten den Suffix ihrer Parametertypen.
 * - Keine neue Gameplay-Logik wird erfunden.
 */
export class BDirect extends GameCanvas {
  private static readonly s = new Int32Array(9790);
  static readonly a = new Array<boolean>(10).fill(false);
  static readonly t = new Int16Array(3836);
  private static readonly u = new Float64Array(5);
  static b = 0;
  static c = 0;
  private static readonly y = new Int8Array(25112);
  private static z = 0;
  private static A = 0;
  static readonly B = new Int32Array(409);
  static C = 0;
  static D = 0;
  static readonly H = new Int8Array(78);
  static I = 0;
  static J = 0;

  readonly f: Array<Image | null> = new Array<Image | null>(6).fill(null);
  e = false;
  g = 0;
  h = 0;
  i = 0;
  j = 0;
  k = 0;
  l = 0;
  m = true;

  private loopFrameHandle: number | null = null;
  private lastTick = 0;

  constructor(
    canvas: HTMLCanvasElement,
    graphics: Graphics,
    private readonly resources: ResourceManager,
  ) {
    // b.java: super(false)
    super(false, canvas, graphics);
    this.setFullScreenMode(true);
    BDirect.z = this.getWidth();
    BDirect.A = this.getHeight();
    if (BDirect.A < BDirect.z) BDirect.A = BDirect.z;

    const s = BDirect.s;
    s[7] = Math.trunc((BDirect.z - 180) / 2);
    s[8] = Math.trunc((BDirect.A - 180) / 2);
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
    BDirect.b = 206;
  }

  /** Direkte Browserfassung der Schleife aus b.run(). */
  run(): void {
    if (this.loopFrameHandle !== null) return;
    this.lastTick = performance.now();
    const frame = (now: number) => {
      if (!this.m) {
        this.loopFrameHandle = null;
        return;
      }
      if (now - this.lastTick >= 100 || BDirect.b === 18 || BDirect.b === 19 || BDirect.b === 15) {
        BDirect.u[0] = now;
        this.g++;
        this.repaint();
        this.serviceRepaints();
        // Direkte Ports von k(), j() und l() werden hier in derselben Reihenfolge aufgerufen.
        this.lastTick = now;
      }
      this.loopFrameHandle = requestAnimationFrame(frame);
    };
    this.loopFrameHandle = requestAnimationFrame(frame);
  }

  paint(graphics: Graphics): void {
    // Bis der originale paint-Switch vollständig übertragen ist, wird diese
    // Klasse nicht von main.ts instanziiert.
    graphics.setColor(0);
    graphics.fillRect(0, 0, this.getWidth(), this.getHeight());
  }

  protected override keyPressed(keyCode: number): void {
    if (keyCode === -10) return;
    BDirect.s[13] = BDirect.s[13]! | this.g_int(keyCode);
    this.i |= BDirect.s[13]!;
  }

  protected override keyReleased(keyCode: number): void {
    if (keyCode !== -10) this.j |= this.g_int(keyCode);
  }

  /** Wörtlicher Port von b.g(int). */
  private g_int(keyCode: number): number {
    switch (keyCode) {
      case -8: return 33554432;
      case -7: return 8388608;
      case -6: return 4194304;
      case 35: return 2097152;
      case 42: return 1048576;
      case 48: return 1024;
      case 49: return 2048;
      case 50: return 4096;
      case 51: return 8192;
      case 52: return 16384;
      case 53: return 32768;
      case 54: return 65536;
      case 55: return 131072;
      case 56: return 262144;
      case 57: return 524288;
      default:
        switch (this.getGameAction(keyCode)) {
          case GameCanvas.UP: return 2;
          case GameCanvas.LEFT: return 4;
          case GameCanvas.RIGHT: return 32;
          case GameCanvas.DOWN: return 64;
          case GameCanvas.FIRE: return 256;
          default: return 0;
        }
    }
  }

  /** Entspricht b.a(String): kopiert eine Ressource in den gemeinsamen Bytepuffer y. */
  a_String(name: string): void {
    const bytes = this.resources.getBytes(name);
    BDirect.y.fill(0);
    BDirect.y.set(bytes.subarray(0, BDirect.y.length));
  }

  /** Wörtlicher Port von static a(int,int,int,int), Entityliste s[56]. */
  static a_int4(type: number, x: number, y: number, packed: number): number {
    const s = this.s;
    const entity = s[55]!;
    if (entity < 0) return -1;
    s[55] = s[2558 + entity]!;
    s[2046 + entity] = -1;
    s[2558 + entity] = s[56]!;
    if (s[56]! !== -1) s[2046 + s[56]!] = entity;
    s[56] = entity;
    this.initializeEntity(entity, type, x, y, packed);
    return entity;
  }

  /** Wörtlicher Port von static b(int,int,int,int), Entityliste s[57]. */
  static b_int4(type: number, x: number, y: number, packed: number): number {
    const s = this.s;
    const entity = s[55]!;
    if (entity < 0) return -1;
    s[55] = s[2558 + entity]!;
    s[2046 + entity] = -1;
    s[2558 + entity] = s[57]!;
    if (s[57]! !== -1) s[2046 + s[57]!] = entity;
    s[57] = entity;
    this.initializeEntity(entity, type, x, y, packed);
    return entity;
  }

  /** Wörtlicher Port von static c(int). */
  static c_int(entity: number): void {
    this.releaseEntity(entity, 56);
    this.J++;
  }

  /** Wörtlicher Port von static d(int). */
  static d_int(entity: number): void {
    this.releaseEntity(entity, 57);
    this.J++;
  }

  private static initializeEntity(entity: number, type: number, x: number, y: number, packed: number): void {
    const s = this.s;
    s[3582 + entity] = x;
    s[4094 + entity] = y;
    s[5630 + entity] = x << 4;
    s[6142 + entity] = y << 4;
    s[3070 + entity] = type;
    s[7166 + entity] = packed & 0xff;
    s[7678 + entity] = packed >> 8 & 0xff;
    s[8190 + entity] = packed >> 16 & 0xff;
    s[8702 + entity] = packed >> 24;
    s[6654 + entity] = 0;
    s[9214 + entity] = 1;
  }

  private static releaseEntity(entity: number, listHeadIndex: 56 | 57): void {
    const s = this.s;
    const previous = s[2046 + entity]!;
    const next = s[2558 + entity]!;
    if (previous !== -1) s[2558 + previous] = next;
    else s[listHeadIndex] = next;
    if (next !== -1) s[2046 + next] = previous;
    s[2558 + entity] = s[55]!;
    s[55] = entity;
  }
}

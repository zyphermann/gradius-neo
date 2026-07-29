import { Graphics } from './Graphics';

export abstract class Canvas {
  static readonly UP = 1;
  static readonly LEFT = 2;
  static readonly RIGHT = 5;
  static readonly DOWN = 6;
  static readonly FIRE = 8;

  private repaintPending = false;
  private frameHandle: number | null = null;
  private fullScreen = false;

  protected constructor(
    protected readonly element: HTMLCanvasElement,
    private readonly graphics: Graphics,
  ) {}

  abstract paint(graphics: Graphics): void;

  getWidth(): number {
    return this.element.width;
  }

  getHeight(): number {
    return this.element.height;
  }

  setFullScreenMode(fullScreen: boolean): void {
    this.fullScreen = fullScreen;
  }

  isFullScreenMode(): boolean {
    return this.fullScreen;
  }

  isShown(): boolean {
    if (!this.element.isConnected) return false;
    return typeof document === 'undefined' || document.visibilityState !== 'hidden';
  }

  repaint(): void {
    this.repaintPending = true;
    if (this.frameHandle !== null) return;
    this.frameHandle = requestAnimationFrame(() => {
      this.frameHandle = null;
      this.flushRepaint();
    });
  }

  serviceRepaints(): void {
    if (this.frameHandle !== null) {
      cancelAnimationFrame(this.frameHandle);
      this.frameHandle = null;
    }
    this.flushRepaint();
  }

  getGameAction(keyCode: number): number {
    switch (keyCode) {
      case -1: return Canvas.UP;
      case -2: return Canvas.DOWN;
      case -3: return Canvas.LEFT;
      case -4: return Canvas.RIGHT;
      case -5: return Canvas.FIRE;
      default: throw new RangeError(`No game action for key code ${keyCode}`);
    }
  }

  protected keyPressed(_keyCode: number): void {}
  protected keyReleased(_keyCode: number): void {}
  protected showNotify(): void {}
  protected hideNotify(): void {}

  private flushRepaint(): void {
    if (!this.repaintPending) return;
    this.repaintPending = false;
    this.graphics.resetFrame(this.getWidth(), this.getHeight());
    this.paint(this.graphics);
  }
}

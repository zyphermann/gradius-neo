import type { ResourceManager } from '../runtime/resources';
import type { Graphics } from './Graphics';

export interface ResourceStream {
  read(target: Int8Array | Uint8Array): number;
  close(): void;
}

class BrowserResourceStream implements ResourceStream {
  private offset = 0;

  constructor(private readonly bytes: Uint8Array) {}

  read(target: Int8Array | Uint8Array): number {
    const length = Math.min(target.length, this.bytes.length - this.offset);
    for (let index = 0; index < length; index++) target[index] = this.bytes[this.offset + index]!;
    this.offset += length;
    return length;
  }

  close(): void {}
}

const browserKeyCodes = new Map<string, number>([
  ['ArrowUp', -1],
  ['ArrowDown', -2],
  ['ArrowLeft', -3],
  ['ArrowRight', -4],
  ['Enter', -5],
  ['Space', 48],
  ['Numpad0', 48],
  ['Digit0', 48],
  ['Digit1', 49],
  ['Digit2', 50],
  ['Digit3', 51],
  ['Digit4', 52],
  ['Digit5', 53],
  ['Digit6', 54],
  ['Digit7', 55],
  ['Digit8', 56],
  ['Digit9', 57],
  ['Numpad1', 49],
  ['Numpad2', 50],
  ['Numpad3', 51],
  ['Numpad4', 52],
  ['Numpad5', 53],
  ['Numpad6', 54],
  ['Numpad7', 55],
  ['Numpad8', 56],
  ['Numpad9', 57],
  ['NumpadMultiply', 42],
  ['NumpadAdd', 35],
  ['Backspace', -8],
  ['F1', -6],
  ['F2', -7],
  ['KeyQ', -6],
  ['KeyW', -7],
]);

export abstract class GameSurface {
  static readonly UP = 1;
  static readonly LEFT = 2;
  static readonly RIGHT = 5;
  static readonly DOWN = 6;
  static readonly FIRE = 8;

  private static runtime: {
    element: HTMLCanvasElement;
    graphics: Graphics;
    resources: ResourceManager;
  } | null = null;
  private readonly down = new Set<number>();
  private repaintPending = false;
  private frameHandle: number | null = null;
  private fullScreen = false;
  protected readonly element: HTMLCanvasElement;
  private readonly graphics: Graphics;

  protected constructor(suppressKeyEvents: boolean, element?: HTMLCanvasElement, graphics?: Graphics) {
    const runtime = GameSurface.runtime;
    const resolvedElement = element ?? runtime?.element;
    const resolvedGraphics = graphics ?? runtime?.graphics;
    if (!resolvedElement || !resolvedGraphics) throw new Error('Game surface runtime is not configured');
    this.element = resolvedElement;
    this.graphics = resolvedGraphics;
    resolvedElement.addEventListener('keydown', (event) => this.onKey(event, true, suppressKeyEvents));
    resolvedElement.addEventListener('keyup', (event) => this.onKey(event, false, suppressKeyEvents));
    resolvedElement.addEventListener('blur', () => this.releaseAll(suppressKeyEvents));
  }

  static configureRuntime(element: HTMLCanvasElement, graphics: Graphics, resources: ResourceManager): void {
    this.runtime = { element, graphics, resources };
  }

  protected getClass(): { getResourceAsStream: (path: string) => ResourceStream } {
    return {
      getResourceAsStream: (path: string) => {
        const resources = GameSurface.runtime?.resources;
        if (!resources) throw new Error('Game surface resources are not configured');
        return new BrowserResourceStream(resources.getBytes(path));
      },
    };
  }

  getKeyStates(): ReadonlySet<number> {
    return this.down;
  }

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
      case -1:
        return GameSurface.UP;
      case -2:
        return GameSurface.DOWN;
      case -3:
        return GameSurface.LEFT;
      case -4:
        return GameSurface.RIGHT;
      case -5:
        return GameSurface.FIRE;
      default:
        throw new RangeError(`No game action for key code ${keyCode}`);
    }
  }

  protected keyPressed(_keyCode: number): void {}
  protected keyReleased(_keyCode: number): void {}
  protected showNotify(): void {}
  protected hideNotify(): void {}

  private onKey(event: KeyboardEvent, pressed: boolean, suppress: boolean): void {
    const keyCode = browserKeyCodes.get(event.code);
    if (keyCode === undefined) return;
    event.preventDefault();
    if (pressed) {
      if (this.down.has(keyCode)) return;
      this.down.add(keyCode);
      if (!suppress) this.keyPressed(keyCode);
    } else {
      this.down.delete(keyCode);
      if (!suppress) this.keyReleased(keyCode);
    }
  }

  private releaseAll(suppress: boolean): void {
    if (!suppress) for (const keyCode of this.down) this.keyReleased(keyCode);
    this.down.clear();
  }

  private flushRepaint(): void {
    if (!this.repaintPending) return;
    this.repaintPending = false;
    this.graphics.resetFrame(this.getWidth(), this.getHeight());
    this.paint(this.graphics);
  }
}

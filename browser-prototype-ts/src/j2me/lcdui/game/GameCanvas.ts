import { Canvas } from '../Canvas';
import type { Graphics } from '../Graphics';
import type { ResourceManager } from '../../../runtime/resources';

class ResourceInputStream {
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
  ['ArrowUp', -1], ['ArrowDown', -2], ['ArrowLeft', -3], ['ArrowRight', -4],
  ['Enter', -5], ['Space', 48], ['Numpad0', 48],
  ['Digit0', 48], ['Digit1', 49], ['Digit2', 50], ['Digit3', 51],
  ['Digit4', 52], ['Digit5', 53], ['Digit6', 54], ['Digit7', 55],
  ['Digit8', 56], ['Digit9', 57], ['Numpad1', 49], ['Numpad2', 50],
  ['Numpad3', 51], ['Numpad4', 52], ['Numpad5', 53], ['Numpad6', 54],
  ['Numpad7', 55], ['Numpad8', 56], ['Numpad9', 57],
  ['NumpadMultiply', 42], ['NumpadAdd', 35], ['Backspace', -8],
  ['F1', -6], ['F2', -7], ['KeyQ', -6], ['KeyW', -7],
]);

export abstract class GameCanvas extends Canvas {
  private static legacyRuntime: {
    element: HTMLCanvasElement;
    graphics: Graphics;
    resources: ResourceManager;
  } | null = null;
  private readonly down = new Set<number>();

  protected constructor(
    suppressKeyEvents: boolean,
    element?: HTMLCanvasElement,
    graphics?: Graphics,
  ) {
    const runtime = GameCanvas.legacyRuntime;
    const resolvedElement = element ?? runtime?.element;
    const resolvedGraphics = graphics ?? runtime?.graphics;
    if (!resolvedElement || !resolvedGraphics) throw new Error('GameCanvas browser runtime is not configured');
    super(resolvedElement, resolvedGraphics);
    resolvedElement.addEventListener('keydown', (event) => this.onKey(event, true, suppressKeyEvents));
    resolvedElement.addEventListener('keyup', (event) => this.onKey(event, false, suppressKeyEvents));
    resolvedElement.addEventListener('blur', () => this.releaseAll(suppressKeyEvents));
  }

  static configureLegacyRuntime(element: HTMLCanvasElement, graphics: Graphics, resources: ResourceManager): void {
    this.legacyRuntime = { element, graphics, resources };
  }

  protected getClass(): { getResourceAsStream: (path: string) => ResourceInputStream } {
    return {
      getResourceAsStream: (path: string) => {
        const resources = GameCanvas.legacyRuntime?.resources;
        if (!resources) throw new Error('GameCanvas resources are not configured');
        return new ResourceInputStream(resources.getBytes(path));
      },
    };
  }

  getKeyStates(): ReadonlySet<number> {
    return this.down;
  }

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
}

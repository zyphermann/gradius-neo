import type { Graphics } from '../../j2me/lcdui/Graphics';
import { GameCanvas } from '../../j2me/lcdui/game/GameCanvas';
import type { ResourceManager } from '../../runtime/resources';
import { BrowserMidletHost } from './BrowserMidletHost';
import { b as DirectGame } from './generated/b';

interface DirectLoopAccess {
  running: boolean;
  repaint(): void;
  serviceRepaints(): void;
  k__void(): void;
  j__void(): void;
  l__void(): void;
}

const JAVA_FRAME_MS = 100;

export class DirectGameRunner {
  private readonly game: DirectGame;
  private frameHandle: number | null = null;
  private previousTime = 0;
  private accumulatedTime = 0;

  constructor(
    canvas: HTMLCanvasElement,
    graphics: Graphics,
    resources: ResourceManager,
    private readonly onError: (error: unknown) => void,
  ) {
    GameCanvas.configureLegacyRuntime(canvas, graphics, resources);
    this.game = new DirectGame(new BrowserMidletHost());
  }

  start(): void {
    if (this.frameHandle !== null) return;
    this.previousTime = performance.now();
    this.frameHandle = requestAnimationFrame(this.onAnimationFrame);
  }

  stop(): void {
    if (this.frameHandle === null) return;
    cancelAnimationFrame(this.frameHandle);
    this.frameHandle = null;
  }

  private readonly onAnimationFrame = (now: number): void => {
    try {
      const loop = this.game as unknown as DirectLoopAccess;
      const elapsed = Math.min(now - this.previousTime, JAVA_FRAME_MS * 3);
      this.previousTime = now;
      this.accumulatedTime += elapsed;

      while (this.accumulatedTime >= JAVA_FRAME_MS && loop.running) {
        loop.repaint();
        loop.serviceRepaints();
        loop.k__void();
        loop.j__void();
        loop.l__void();
        this.accumulatedTime -= JAVA_FRAME_MS;
      }

      if (loop.running) this.frameHandle = requestAnimationFrame(this.onAnimationFrame);
      else this.frameHandle = null;
    } catch (error: unknown) {
      this.frameHandle = null;
      this.onError(error);
      console.error(error);
    }
  };
}

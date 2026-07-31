import { Graphics } from './Graphics';
import type { ResourceManager } from '../runtime/resources';

export type BrowserImageSource = HTMLCanvasElement | HTMLImageElement | ImageBitmap;

function normalizePath(path: string): string {
  return path.replace(/^\/+/, '');
}

export class Image {
  private static readonly resourceImages = new Map<string, Image>();
  private static readonly downloadedPngs = new Set<string>();

  private constructor(
    readonly source: BrowserImageSource,
    private readonly mutable: boolean,
  ) {}

  static async preloadResources(resources: ResourceManager): Promise<void> {
    await Promise.all(
      resources.list('png').map(async (entry) => {
        const source = await Image.decodePng(resources.getBytes(entry.path));
        Image.resourceImages.set(normalizePath(entry.path), new Image(source, false));
      }),
    );
  }

  static createImage(resourceName: string): Image;
  static createImage(width: number, height: number): Image;
  static createImage(first: string | number, second?: number): Image {
    if (typeof first === 'string') {
      const normalized = normalizePath(first);
      const image = Image.resourceImages.get(normalized);
      if (!image) throw new Error(`J2ME image is not preloaded: ${first}`);
      return image;
    }

    const width = first;
    const height = second;
    if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || (height ?? 0) <= 0) {
      throw new RangeError(`Invalid mutable image size: ${width}x${String(height)}`);
    }
    if (typeof document === 'undefined') throw new Error('Mutable images require a browser document');
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height as number;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas 2D is unavailable');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height as number);
    return new Image(canvas, true);
  }

  getWidth(): number {
    return this.source.width;
  }

  getHeight(): number {
    return this.source.height;
  }

  isMutable(): boolean {
    return this.mutable;
  }

  getGraphics(): Graphics {
    if (!this.mutable || !(this.source instanceof HTMLCanvasElement)) {
      throw new Error('Cannot obtain Graphics for an immutable Image');
    }
    const context = this.source.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas 2D is unavailable');
    return new Graphics(context, this.source.width, this.source.height);
  }

  /** Debug helper: exports the decoded J2ME image through the browser download folder. */
  downloadAsPng(filename: string): void {
    if (typeof document === 'undefined' || Image.downloadedPngs.has(filename)) return;
    Image.downloadedPngs.add(filename);

    const canvas = document.createElement('canvas');
    canvas.width = this.getWidth();
    canvas.height = this.getHeight();
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D is unavailable');
    context.drawImage(this.source, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const download = document.createElement('a');
      download.href = url;
      download.download = filename;
      download.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  private static async decodePng(bytes: Uint8Array): Promise<BrowserImageSource> {
    const blob = new Blob([bytes], { type: 'image/png' });
    if (typeof createImageBitmap === 'function') {
      return createImageBitmap(blob);
    }

    if (typeof document === 'undefined') throw new Error('PNG decoding requires browser image APIs');
    const url = URL.createObjectURL(blob);
    try {
      const image = document.createElement('img');
      image.decoding = 'sync';
      image.src = url;
      await image.decode();
      return image;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

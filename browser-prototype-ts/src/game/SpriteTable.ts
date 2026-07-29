import { Graphics } from '../j2me/lcdui/Graphics';
import type { Image } from '../j2me/lcdui/Image';

export interface SpriteRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Parser für das binäre csv_* Format aus b.a(int, String). */
export class SpriteTable {
  private readonly regions = new Map<number, SpriteRegion>();

  constructor(bytes: Uint8Array) {
    if (bytes.length < 4) throw new Error('Sprite table header is truncated');
    const firstIndex = bytes[0]! << 8 | bytes[1]!;
    const count = bytes[2]! << 8 | bytes[3]!;
    if (bytes.length < 4 + count * 4) throw new Error('Sprite table entries are truncated');

    for (let offset = 0; offset < count; offset++) {
      const cursor = 4 + offset * 4;
      this.regions.set(firstIndex + offset, {
        x: Math.trunc(bytes[cursor]! * 3 / 4),
        y: Math.trunc(bytes[cursor + 1]! * 3 / 4),
        width: Math.trunc(bytes[cursor + 2]! * 3 / 4),
        height: Math.trunc(bytes[cursor + 3]! * 3 / 4),
      });
    }
  }

  get(index: number): SpriteRegion {
    const region = this.regions.get(index);
    if (!region) throw new RangeError(`Sprite index ${index} is not present`);
    return region;
  }

  draw(graphics: Graphics, image: Image, index: number, x: number, y: number, anchor: number): void {
    const region = this.get(index);
    graphics.drawRegion(image, region.x, region.y, region.width, region.height, 0, x, y, anchor);
  }
}

import { Graphics } from '../j2me/lcdui/Graphics';
import type { Image } from '../j2me/lcdui/Image';
import type { SpriteTable } from './SpriteTable';

/** Portierung von b.a(Graphics, String, int, int). */
export class BitmapFont {
  constructor(
    private readonly image: Image,
    private readonly sprites: SpriteTable,
  ) {}

  draw(graphics: Graphics, text: string, originalX: number, originalY: number): void {
    let x = originalX;
    for (const character of text) {
      const sprite = BitmapFont.spriteIndex(character);
      if (sprite !== null) {
        this.sprites.draw(
          graphics,
          this.image,
          sprite,
          Math.trunc((x - 2) * 3 / 4),
          Math.trunc((originalY - 2) * 3 / 4),
          Graphics.LEFT | Graphics.TOP,
        );
      }
      x += 14;
    }
  }

  static spriteIndex(character: string): number | null {
    if (character >= 'A' && character <= 'Z') return character.charCodeAt(0) - 65 + 14;
    if (character >= '0' && character <= '9') return character.charCodeAt(0) - 48 + 4;
    if (character === '*') return 40;
    if (character === '#') return 41;
    if (character === '-') return 42;
    return null;
  }
}

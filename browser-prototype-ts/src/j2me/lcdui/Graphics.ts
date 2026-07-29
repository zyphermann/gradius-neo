import { Font } from './Font';
import type { Image } from './Image';

export interface AnchorOffset {
  x: number;
  y: number;
}

export class Graphics {
  static readonly HCENTER = 1;
  static readonly VCENTER = 2;
  static readonly LEFT = 4;
  static readonly RIGHT = 8;
  static readonly TOP = 16;
  static readonly BOTTOM = 32;
  static readonly BASELINE = 64;

  private color = 0;
  private font = Font.getDefaultFont();
  private translateX = 0;
  private translateY = 0;
  private clipX: number;
  private clipY: number;
  private clipWidth: number;
  private clipHeight: number;

  constructor(
    private readonly context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) {
    this.clipX = 0;
    this.clipY = 0;
    this.clipWidth = width;
    this.clipHeight = height;
    this.context.imageSmoothingEnabled = false;
  }

  setColor(rgb: number): void;
  setColor(red: number, green: number, blue: number): void;
  setColor(first: number, green?: number, blue?: number): void {
    if (green === undefined || blue === undefined) {
      this.color = first & 0xffffff;
    } else {
      this.color = ((first & 0xff) << 16) | ((green & 0xff) << 8) | (blue & 0xff);
    }
  }

  getColor(): number {
    return this.color;
  }

  setFont(font: Font | null): void {
    this.font = font ?? Font.getDefaultFont();
  }

  getFont(): Font {
    return this.font;
  }

  translate(x: number, y: number): void {
    this.translateX += x | 0;
    this.translateY += y | 0;
  }

  getTranslateX(): number {
    return this.translateX;
  }

  getTranslateY(): number {
    return this.translateY;
  }

  resetFrame(width: number, height: number): void {
    this.translateX = 0;
    this.translateY = 0;
    this.clipX = 0;
    this.clipY = 0;
    this.clipWidth = width;
    this.clipHeight = height;
  }

  setClip(x: number, y: number, width: number, height: number): void {
    this.clipX = (x + this.translateX) | 0;
    this.clipY = (y + this.translateY) | 0;
    this.clipWidth = Math.max(0, width | 0);
    this.clipHeight = Math.max(0, height | 0);
  }

  getClipX(): number {
    return this.clipX - this.translateX;
  }

  getClipY(): number {
    return this.clipY - this.translateY;
  }

  getClipWidth(): number {
    return this.clipWidth;
  }

  getClipHeight(): number {
    return this.clipHeight;
  }

  fillRect(x: number, y: number, width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.withClip(() => {
      this.context.fillStyle = this.colorCss();
      this.context.fillRect(x + this.translateX, y + this.translateY, width, height);
    });
  }

  drawRect(x: number, y: number, width: number, height: number): void {
    if (width < 0 || height < 0) return;
    this.fillRect(x, y, width + 1, 1);
    this.fillRect(x, y + height, width + 1, 1);
    if (height > 1) {
      this.fillRect(x, y + 1, 1, height - 1);
      this.fillRect(x + width, y + 1, 1, height - 1);
    }
  }

  drawLine(x1: number, y1: number, x2: number, y2: number): void {
    let currentX = x1 | 0;
    let currentY = y1 | 0;
    const targetX = x2 | 0;
    const targetY = y2 | 0;
    const dx = Math.abs(targetX - currentX);
    const stepX = currentX < targetX ? 1 : -1;
    const dy = -Math.abs(targetY - currentY);
    const stepY = currentY < targetY ? 1 : -1;
    let error = dx + dy;

    this.withClip(() => {
      this.context.fillStyle = this.colorCss();
      while (true) {
        this.context.fillRect(currentX + this.translateX, currentY + this.translateY, 1, 1);
        if (currentX === targetX && currentY === targetY) break;
        const twiceError = error * 2;
        if (twiceError >= dy) {
          error += dy;
          currentX += stepX;
        }
        if (twiceError <= dx) {
          error += dx;
          currentY += stepY;
        }
      }
    });
  }

  drawString(text: string, x: number, y: number, anchor: number): void {
    if (text === null || text === undefined) throw new TypeError('drawString text is null');
    const width = this.font.stringWidth(text);
    const height = this.font.getHeight();
    const offset = Graphics.resolveAnchor(anchor, width, height, true, this.font.getBaselinePosition());
    const drawX = x + offset.x + this.translateX;
    const drawY = y + offset.y + this.translateY;

    this.withClip(() => {
      this.context.fillStyle = this.colorCss();
      this.context.font = this.font.cssFont;
      this.context.textAlign = 'left';
      this.context.textBaseline = 'top';
      this.context.fillText(text, drawX, drawY);
      if (this.font.isUnderlined()) this.context.fillRect(drawX, drawY + height - 1, width, 1);
    });
  }

  drawImage(image: Image, x: number, y: number, anchor: number): void {
    const offset = Graphics.resolveAnchor(anchor, image.getWidth(), image.getHeight());
    this.withClip(() => {
      this.context.drawImage(image.source, x + offset.x + this.translateX, y + offset.y + this.translateY);
    });
  }

  drawRegion(
    image: Image,
    sourceX: number,
    sourceY: number,
    width: number,
    height: number,
    transform: number,
    destinationX: number,
    destinationY: number,
    anchor: number,
  ): void {
    // The decompiled sprite tables use 0x0 entries as empty glyphs/tiles.
    // CanvasRenderingContext2D throws for them, while visually they are a no-op.
    if (width === 0 || height === 0) return;
    if (width < 0 || height < 0) throw new RangeError(`Invalid region: ${width}x${height}`);
    if (transform !== 0) throw new Error(`Unsupported Sprite transform: ${transform}`);
    const offset = Graphics.resolveAnchor(anchor, width, height);
    this.withClip(() => {
      this.context.drawImage(
        image.source,
        sourceX,
        sourceY,
        width,
        height,
        destinationX + offset.x + this.translateX,
        destinationY + offset.y + this.translateY,
        width,
        height,
      );
    });
  }

  static resolveAnchor(anchor: number, width: number, height: number, text = false, baseline = 0): AnchorOffset {
    const horizontal = anchor & (Graphics.LEFT | Graphics.HCENTER | Graphics.RIGHT);
    const vertical = anchor & (Graphics.TOP | Graphics.VCENTER | Graphics.BOTTOM | Graphics.BASELINE);

    let x = 0;
    if (horizontal === Graphics.HCENTER) x = -Math.floor(width / 2);
    else if (horizontal === Graphics.RIGHT) x = -width;
    else if (horizontal !== Graphics.LEFT) throw new RangeError(`Invalid horizontal anchor: ${anchor}`);

    let y = 0;
    if (vertical === Graphics.VCENTER) y = -Math.floor(height / 2);
    else if (vertical === Graphics.BOTTOM) y = -height;
    else if (vertical === Graphics.BASELINE && text) y = -baseline;
    else if (vertical !== Graphics.TOP) throw new RangeError(`Invalid vertical anchor: ${anchor}`);

    return { x, y };
  }

  private colorCss(): string {
    return `#${this.color.toString(16).padStart(6, '0')}`;
  }

  private withClip(draw: () => void): void {
    if (this.clipWidth <= 0 || this.clipHeight <= 0) return;
    this.context.save();
    this.context.beginPath();
    this.context.rect(this.clipX, this.clipY, this.clipWidth, this.clipHeight);
    this.context.clip();
    draw();
    this.context.restore();
  }
}

export class Font {
  static readonly FACE_SYSTEM = 0;
  static readonly FACE_MONOSPACE = 32;
  static readonly FACE_PROPORTIONAL = 64;

  static readonly STYLE_PLAIN = 0;
  static readonly STYLE_BOLD = 1;
  static readonly STYLE_ITALIC = 2;
  static readonly STYLE_UNDERLINED = 4;

  static readonly SIZE_MEDIUM = 0;
  static readonly SIZE_SMALL = 8;
  static readonly SIZE_LARGE = 16;

  private static readonly cache = new Map<string, Font>();
  private static measurementContext: CanvasRenderingContext2D | null = null;

  readonly cssFont: string;
  readonly pointSize: number;

  private constructor(
    readonly face: number,
    readonly style: number,
    readonly size: number,
  ) {
    this.pointSize = Font.toPointSize(size);
    const family = face === Font.FACE_MONOSPACE ? 'monospace' : 'sans-serif';
    const weight = (style & Font.STYLE_BOLD) !== 0 ? 'bold ' : '';
    const italic = (style & Font.STYLE_ITALIC) !== 0 ? 'italic ' : '';
    this.cssFont = `${italic}${weight}${this.pointSize}px ${family}`;
  }

  static getDefaultFont(): Font {
    return Font.getFont(Font.FACE_SYSTEM, Font.STYLE_PLAIN, Font.SIZE_MEDIUM);
  }

  static getFont(face: number, style: number, size: number): Font {
    Font.validate(face, style, size);
    const key = `${face}:${style}:${size}`;
    let font = Font.cache.get(key);
    if (!font) {
      font = new Font(face, style, size);
      Font.cache.set(key, font);
    }
    return font;
  }

  getHeight(): number {
    const metrics = this.measure('0');
    const ascent = metrics.fontBoundingBoxAscent ?? metrics.actualBoundingBoxAscent;
    const descent = metrics.fontBoundingBoxDescent ?? metrics.actualBoundingBoxDescent;
    const measured = Math.round(Math.abs(ascent) + Math.abs(descent));
    return measured > 0 ? measured : this.pointSize;
  }

  getBaselinePosition(): number {
    const metrics = this.measure('0');
    const ascent = metrics.fontBoundingBoxAscent ?? metrics.actualBoundingBoxAscent;
    return Math.round(Math.abs(ascent)) || Math.round(this.pointSize * 0.8);
  }

  stringWidth(text: string): number {
    return Math.round(this.measure(text).width);
  }

  charWidth(character: string): number {
    return this.stringWidth(character.charAt(0));
  }

  substringWidth(text: string, offset: number, length: number): number {
    return this.stringWidth(text.substring(offset, offset + length));
  }

  isUnderlined(): boolean {
    return (this.style & Font.STYLE_UNDERLINED) !== 0;
  }

  private measure(text: string): TextMetrics {
    const context = Font.getMeasurementContext();
    if (context) {
      context.font = this.cssFont;
      return context.measureText(text);
    }

    return {
      width: text.length * Math.round(this.pointSize * (this.face === Font.FACE_MONOSPACE ? 0.6 : 0.55)),
      actualBoundingBoxAscent: Math.round(this.pointSize * 0.8),
      actualBoundingBoxDescent: Math.round(this.pointSize * 0.2),
    } as TextMetrics;
  }

  private static getMeasurementContext(): CanvasRenderingContext2D | null {
    if (Font.measurementContext) return Font.measurementContext;
    if (typeof document === 'undefined') return null;
    Font.measurementContext = document.createElement('canvas').getContext('2d');
    return Font.measurementContext;
  }

  private static toPointSize(size: number): number {
    // FreeJ2ME's dynamic font table for a 176-pixel-wide display.
    if (size === Font.SIZE_SMALL) return 12;
    if (size === Font.SIZE_LARGE) return 16;
    return 14;
  }

  private static validate(face: number, style: number, size: number): void {
    if (![Font.FACE_SYSTEM, Font.FACE_MONOSPACE, Font.FACE_PROPORTIONAL].includes(face)) {
      throw new RangeError(`Invalid J2ME font face: ${face}`);
    }
    if ((style & ~(Font.STYLE_BOLD | Font.STYLE_ITALIC | Font.STYLE_UNDERLINED)) !== 0) {
      throw new RangeError(`Invalid J2ME font style: ${style}`);
    }
    if (![Font.SIZE_MEDIUM, Font.SIZE_SMALL, Font.SIZE_LARGE].includes(size)) {
      throw new RangeError(`Invalid J2ME font size: ${size}`);
    }
  }
}

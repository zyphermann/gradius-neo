import type { Font } from '../j2me/lcdui/Font';
import type { Graphics } from '../j2me/lcdui/Graphics';

/** Verhaltensgetreue TypeScript-Portierung der dekompilierten Klasse a.java. */
export class GameSupport {
  static message = 'ok\n';
  private static messagePriority = 0;

  static a(...args: unknown[]): string[] | void {
    if (typeof args[0] === 'number') return this.wrapText(args[0], args[1] as string, args[2] as Font);
    if (typeof args[0] === 'string' || args[0] === null) {
      if (args.length === 1) return this.appendMessage(args[0] as string | null);
      return this.setMessage(args[0] as string | null, args[1] as number);
    }
    this.drawProgress(...args as [Graphics, number, number, number, number, number, number]);
  }

  static drawProgress(
    graphics: Graphics,
    x: number,
    y: number,
    progress: number,
    width: number,
    fillOffset: number,
    total: number,
  ): void {
    if (progress >= total) return;
    graphics.drawRect(x, y, width, progress - 1);
    const fillHeight = Math.trunc(progress * progress / total);
    const fillY = Math.trunc(fillOffset * progress / total);
    graphics.fillRect(x, y + fillY, width, fillHeight);
  }

  static setMessage(message: string | null, priority: number): void {
    if (priority < this.messagePriority) return;
    this.messagePriority = priority;
    this.message = message ?? '';
  }

  static appendMessage(message: string | null): void {
    this.message += message ?? '';
  }

  static wrapText(width: number, text: string, font: Font): string[] {
    const tokens = this.tokenize(text);
    const lines: string[] = [];
    let line = '';
    let tokenCount = 0;

    for (let index = 0; index < tokens.length; index++) {
      const token = tokens[index]!;
      if (font.stringWidth(line + token) <= width) {
        line += token;
        tokenCount++;
        if (token.endsWith('\n')) {
          lines.push(line.slice(0, -1).trim());
          line = '';
          tokenCount = 0;
        }
      } else if (tokenCount !== 0) {
        lines.push(line.trim());
        line = '';
        tokenCount = 0;
        index--;
      } else {
        const fragments = this.splitLongToken(width, line + token, font);
        for (let fragment = 0; fragment < fragments.length - 1; fragment++) {
          lines.push(fragments[fragment]!.trim());
        }
        line = fragments[fragments.length - 1]!;
        tokenCount = 1;
      }
    }

    lines.push(line.trim());
    return lines;
  }

  private static tokenize(text: string): string[] {
    const value = text.trim();
    const tokens: string[] = [];
    let start = 0;
    for (let index = 0; index < value.length; index++) {
      const character = value[index];
      if (character === ' ' || character === '\n' || character === '@') {
        tokens.push(value.substring(start, index + 1));
        start = index + 1;
      }
    }
    tokens.push(value.substring(start));
    return tokens;
  }

  private static splitLongToken(width: number, text: string, font: Font): string[] {
    const fragments: string[] = [];
    let start = 0;
    for (let index = 0; index < text.length; index++) {
      if (font.stringWidth(text.substring(start, index)) > width) {
        fragments.push(text.substring(start, index - 1));
        start = index - 1;
      }
    }
    fragments.push(text.substring(start));
    return fragments;
  }
}

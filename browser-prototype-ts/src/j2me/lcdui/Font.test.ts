import { describe, expect, it } from 'vitest';
import { Font } from './Font';

describe('J2ME Font', () => {
  it('maps the font sizes used by Gradius Neo', () => {
    expect(Font.getFont(Font.FACE_MONOSPACE, Font.STYLE_PLAIN, Font.SIZE_MEDIUM).pointSize).toBe(14);
    expect(Font.getFont(Font.FACE_PROPORTIONAL, Font.STYLE_PLAIN, Font.SIZE_SMALL).pointSize).toBe(12);
  });

  it('caches identical font requests and measures text', () => {
    const first = Font.getDefaultFont();
    const second = Font.getFont(Font.FACE_SYSTEM, Font.STYLE_PLAIN, Font.SIZE_MEDIUM);
    expect(first).toBe(second);
    expect(first.stringWidth('GRADIUS')).toBeGreaterThan(0);
    expect(first.getHeight()).toBeGreaterThan(0);
  });

  it('rejects invalid constants', () => {
    expect(() => Font.getFont(999, 0, 0)).toThrow('Invalid J2ME font face');
  });
});

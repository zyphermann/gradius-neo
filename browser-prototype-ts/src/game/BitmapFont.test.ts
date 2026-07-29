import { describe, expect, it } from 'vitest';
import { BitmapFont } from './BitmapFont';

describe('Gradius Neo bitmap font', () => {
  it('uses the exact sprite mapping from b.java', () => {
    expect(BitmapFont.spriteIndex('0')).toBe(4);
    expect(BitmapFont.spriteIndex('9')).toBe(13);
    expect(BitmapFont.spriteIndex('A')).toBe(14);
    expect(BitmapFont.spriteIndex('Z')).toBe(39);
    expect(BitmapFont.spriteIndex('*')).toBe(40);
    expect(BitmapFont.spriteIndex('#')).toBe(41);
    expect(BitmapFont.spriteIndex('-')).toBe(42);
    expect(BitmapFont.spriteIndex(' ')).toBeNull();
  });
});

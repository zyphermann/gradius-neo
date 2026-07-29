import { describe, expect, it } from 'vitest';
import { SpriteTable } from './SpriteTable';

describe('Gradius Neo sprite tables', () => {
  it('parses the same packed coordinates as b.java', () => {
    const table = new SpriteTable(new Uint8Array([0x01, 0x5d, 0x00, 0x01, 0x00, 0x00, 0xf0, 0x50]));
    expect(table.get(349)).toEqual({ x: 0, y: 0, width: 180, height: 60 });
  });

  it('rejects truncated data', () => {
    expect(() => new SpriteTable(new Uint8Array([0, 0, 0, 1]))).toThrow('truncated');
  });
});

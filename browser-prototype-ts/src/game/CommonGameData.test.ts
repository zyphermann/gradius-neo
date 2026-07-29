import { describe, expect, it } from 'vitest';
import { CommonGameData } from './CommonGameData';

describe('common Gradius game data', () => {
  it('decodes RGB colors and star positions at the original array offsets', () => {
    const bytes = new Uint8Array(6 + 60 + 792);
    bytes[5] = 6;
    bytes.set([0x12, 0x34, 0x56], 6);
    bytes[6 + 60 + 728] = 77;
    bytes[6 + 60 + 748] = 99;
    const data = new CommonGameData(bytes);
    expect(data.colors[0]).toBe(0x123456);
    expect(data.starX[0]).toBe(77);
    expect(data.starY[0]).toBe(99);
  });
});

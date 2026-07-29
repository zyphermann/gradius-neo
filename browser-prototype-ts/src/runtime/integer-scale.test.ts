import { describe, expect, it } from 'vitest';
import { calculateIntegerScale } from './integer-scale';

describe('integer canvas scaling', () => {
  it('never returns a fractional or zero scale', () => {
    expect(calculateIntegerScale(200, 300)).toBe(1);
    expect(calculateIntegerScale(600, 800)).toBe(2);
    expect(Number.isInteger(calculateIntegerScale(999, 999))).toBe(true);
  });

  it('honors the configured maximum', () => {
    expect(calculateIntegerScale(4000, 4000, { maxScale: 4 })).toBe(4);
  });
});

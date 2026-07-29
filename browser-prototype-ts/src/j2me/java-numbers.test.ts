import { describe, expect, it } from 'vitest';
import { idiv, imul, int8, int16, int32, irem, ishl, ishr, iushr, uint8, uint16, uint32 } from './java-numbers';

describe('Java integer semantics', () => {
  it('wraps signed and unsigned primitive widths', () => {
    expect(int8(255)).toBe(-1);
    expect(uint8(-1)).toBe(255);
    expect(int16(65535)).toBe(-1);
    expect(uint16(-1)).toBe(65535);
    expect(int32(0xffffffff)).toBe(-1);
    expect(uint32(-1)).toBe(0xffffffff);
  });

  it('performs overflowing 32-bit multiplication', () => {
    expect(imul(0x7fffffff, 2)).toBe(-2);
  });

  it('truncates integer division toward zero', () => {
    expect(idiv(7, 3)).toBe(2);
    expect(idiv(-7, 3)).toBe(-2);
    expect(irem(-7, 3)).toBe(-1);
    expect(() => idiv(1, 0)).toThrow('/ by zero');
  });

  it('masks shift distances like the JVM', () => {
    expect(ishl(1, 33)).toBe(2);
    expect(ishr(-8, 1)).toBe(-4);
    expect(iushr(-1, 1)).toBe(0x7fffffff);
  });
});

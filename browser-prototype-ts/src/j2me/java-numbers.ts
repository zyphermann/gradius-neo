export function int32(value: number): number {
  return value | 0;
}

export function uint32(value: number): number {
  return value >>> 0;
}

export function int16(value: number): number {
  return (value << 16) >> 16;
}

export function uint16(value: number): number {
  return value & 0xffff;
}

export function int8(value: number): number {
  return (value << 24) >> 24;
}

export function uint8(value: number): number {
  return value & 0xff;
}

export function imul(left: number, right: number): number {
  return Math.imul(left, right);
}

export function idiv(dividend: number, divisor: number): number {
  if (divisor === 0) throw new RangeError('/ by zero');
  return Math.trunc(dividend / divisor) | 0;
}

export function irem(dividend: number, divisor: number): number {
  if (divisor === 0) throw new RangeError('/ by zero');
  return (dividend - idiv(dividend, divisor) * divisor) | 0;
}

export function iushr(value: number, distance: number): number {
  return value >>> (distance & 0x1f);
}

export function ishl(value: number, distance: number): number {
  return value << (distance & 0x1f);
}

export function ishr(value: number, distance: number): number {
  return value >> (distance & 0x1f);
}

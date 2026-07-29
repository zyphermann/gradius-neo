import { describe, expect, it } from 'vitest';
import { Graphics } from './Graphics';

describe('J2ME Graphics anchors', () => {
  it('resolves the anchor combinations used by b.java', () => {
    expect(Graphics.resolveAnchor(Graphics.HCENTER | Graphics.VCENTER, 100, 20)).toEqual({ x: -50, y: -10 });
    expect(Graphics.resolveAnchor(Graphics.HCENTER | Graphics.TOP, 99, 22)).toEqual({ x: -49, y: 0 });
    expect(Graphics.resolveAnchor(Graphics.LEFT | Graphics.TOP, 16, 16)).toEqual({ x: 0, y: 0 });
  });

  it('rejects missing or conflicting anchors', () => {
    expect(() => Graphics.resolveAnchor(0, 10, 10)).toThrow('Invalid horizontal anchor');
    expect(() => Graphics.resolveAnchor(Graphics.LEFT | Graphics.RIGHT | Graphics.TOP, 10, 10)).toThrow();
  });
});

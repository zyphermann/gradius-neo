import { describe, expect, it } from 'vitest';
import { Font } from '../j2me/lcdui/Font';
import { GameSupport } from './a';

describe('ported a.java helpers', () => {
  it('wraps normal and explicitly separated text', () => {
    const font = Font.getDefaultFont();
    const width = font.stringWidth('hello world');
    // a.java keeps the separating blank in each token; this is its exact output.
    expect(GameSupport.wrapText(width, 'hello world again', font)).toEqual(['hello', 'world again']);
    expect(GameSupport.wrapText(1000, 'first\nsecond', font)).toEqual(['first', 'second']);
  });

  it('honours message priority', () => {
    GameSupport.setMessage('important', 10);
    GameSupport.setMessage('ignored', 9);
    expect(GameSupport.message).toBe('important');
    GameSupport.appendMessage(null);
    GameSupport.appendMessage('!');
    expect(GameSupport.message).toBe('important!');
  });
});

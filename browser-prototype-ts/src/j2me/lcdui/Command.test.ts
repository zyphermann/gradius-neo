import { describe, expect, it } from 'vitest';
import { Command } from './Command';

describe('J2ME Command', () => {
  it('retains its MIDP properties', () => {
    const command = new Command('EXIT', Command.EXIT, 1);
    expect(command.getLabel()).toBe('EXIT');
    expect(command.getCommandType()).toBe(Command.EXIT);
    expect(command.getPriority()).toBe(1);
  });
});

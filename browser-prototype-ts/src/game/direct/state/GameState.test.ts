import { describe, expect, it } from 'vitest';
import { EntityField, GameState, StateSlot } from './GameState';

describe('GameState views', () => {
  it('reads and writes named state and entity fields without copying', () => {
    const raw = new Int32Array(9790);
    const state = new GameState(raw);
    state.score = 1234;
    const entity = state.entity(7);
    entity.x = 42;
    entity.setParameter(2, 99);

    expect(raw[StateSlot.Score]).toBe(1234);
    expect(raw[EntityField.X + 7]).toBe(42);
    expect(raw[EntityField.Parameter2 + 7]).toBe(99);
  });
});

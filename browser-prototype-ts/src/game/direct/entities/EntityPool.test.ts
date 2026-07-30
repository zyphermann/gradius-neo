import { describe, expect, it } from 'vitest';
import { EntityField, GameState, StateSlot } from '../state/GameState';
import { EntityPool } from './EntityPool';

describe('EntityPool', () => {
  it('moves entities between the free and primary lists', () => {
    const raw = new Int32Array(9790);
    raw[StateSlot.FreeEntityHead] = 3;
    raw[EntityField.Next + 3] = 4;
    raw[EntityField.Next + 4] = -1;
    raw[StateSlot.PrimaryEntityHead] = -1;
    const state = new GameState(raw);
    const pool = new EntityPool(state);

    const id = pool.spawn('primary', 17, 20, 30, 0x04030201);
    expect(id).toBe(3);
    expect(state.get(StateSlot.FreeEntityHead)).toBe(4);
    expect(state.get(StateSlot.PrimaryEntityHead)).toBe(3);
    expect(state.entity(3).parameter(2)).toBe(3);
    expect(pool.generation(3)).toBe(1);

    pool.release('primary', 3);
    expect(state.get(StateSlot.PrimaryEntityHead)).toBe(-1);
    expect(state.get(StateSlot.FreeEntityHead)).toBe(3);

    pool.spawn('primary', 18, 40, 50, 0);
    expect(pool.generation(3)).toBe(2);
  });
});

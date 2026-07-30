import { describe, expect, it } from 'vitest';
import { EntityField, GameState, StateSlot } from '../state/GameState';
import { EntityPool } from '../entities/EntityPool';
import { RenderQueue } from './RenderQueue';

describe('RenderQueue', () => {
  it('retains commands independently in legacy newest-first order', () => {
    const raw = new Int32Array(9790);
    raw[StateSlot.FreeEntityHead] = 0;
    raw[EntityField.Next] = 1;
    raw[EntityField.Next + 1] = -1;
    raw[EntityField.RenderLayerHead + 4] = -1;
    const state = new GameState(raw);
    const queue = new RenderQueue(new EntityPool(state));

    queue.beginEntity(7);
    queue.enqueue(0, 10, 20, 4, 100, 0x123456);
    queue.endEntity();
    queue.enqueue(1, 30, 40, 4, 101, 0);

    expect([...queue.commands(4)].map((command) => command.x)).toEqual([30, 10]);
    expect([...queue.commands(4)][1]?.color).toBe(0x123456);
    expect([...queue.commands(4)][1]?.sourceEntityId).toBe(7);

    queue.beginFrame();
    expect([...queue.commands(4)]).toEqual([]);
  });
});

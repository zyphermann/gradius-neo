import { describe, expect, it } from 'vitest';
import { EntityField, GameState, StateSlot } from '../state/GameState';
import { EntityMotionSnapshots } from './EntityMotionSnapshots';
import { EntityPool } from './EntityPool';

describe('EntityMotionSnapshots', () => {
  it('does not loop forever on the zero-filled pre-stage state', () => {
    const state = new GameState(new Int32Array(9790));
    const snapshots = new EntityMotionSnapshots(state, new EntityPool(state));

    expect(() => {
      snapshots.captureBeforeTick();
      snapshots.captureAfterTick();
    }).not.toThrow();
  });

  it('returns a partial motion offset only for the same entity generation', () => {
    const state = new GameState(new Int32Array(9790));
    const pool = new EntityPool(state);
    const snapshots = new EntityMotionSnapshots(state, pool);
    state.raw[StateSlot.PrimaryEntityHead] = 3;
    state.raw[EntityField.Next + 3] = -1;
    state.raw[EntityField.X + 3] = 10;
    state.raw[EntityField.Y + 3] = 20;
    snapshots.captureBeforeTick();
    state.raw[EntityField.X + 3] = 18;
    state.raw[EntityField.Y + 3] = 16;
    snapshots.captureAfterTick();

    expect(snapshots.offset(3, pool.generation(3), 0.25)).toEqual({ x: 2, y: -1 });
    expect(snapshots.offset(3, pool.generation(3) + 1, 0.25)).toBeUndefined();
  });

  it('does not interpolate a projectile from coordinates left by an inactive slot', () => {
    const raw = new Int32Array(9790);
    raw[StateSlot.PrimaryEntityHead] = -1;
    raw[StateSlot.AuxiliaryEntityHead] = -1;
    raw[1245] = -1;
    raw[1185] = 180;
    raw[1205] = 70;
    const state = new GameState(raw);
    const snapshots = new EntityMotionSnapshots(state, new EntityPool(state));

    snapshots.captureBeforeTick();
    raw[1245] = 0;
    raw[1185] = 30;
    raw[1205] = 100;
    snapshots.captureAfterTick();

    expect(snapshots.offset(-100, 0, 0.5)).toBeUndefined();
  });

  it('interpolates movement but not a reused pool slot', () => {
    const raw = new Int32Array(9790);
    raw[StateSlot.FreeEntityHead] = 3;
    raw[EntityField.Next + 3] = -1;
    raw[StateSlot.PrimaryEntityHead] = -1;
    raw[StateSlot.AuxiliaryEntityHead] = -1;
    const state = new GameState(raw);
    const pool = new EntityPool(state);
    const snapshots = new EntityMotionSnapshots(state, pool);

    pool.spawn('primary', 1, 10, 20, 0);
    snapshots.captureBeforeTick();
    state.entity(3).x = 20;
    snapshots.captureAfterTick();
    expect(snapshots.interpolate(3, 0.5)).toEqual({ x: 15, y: 20 });

    pool.release('primary', 3);
    pool.spawn('primary', 2, 100, 120, 0);
    snapshots.captureAfterTick();
    expect(snapshots.interpolate(3, 0.5)).toEqual({ x: 100, y: 120 });
  });
});

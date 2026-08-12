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

  it('applies Java int conversion to calculated sprite indices', () => {
    const state = new GameState(new Int32Array(9790));
    const queue = new RenderQueue(new EntityPool(state));

    queue.enqueue(1, 10.75, 20.5, 13, 180 + 15 / 4, 0);

    expect([...queue.commands(13)][0]).toMatchObject({ x: 10, y: 20, spriteRegion: 183 });
  });

  it('does not interpolate wrapped objects backwards across the screen', () => {
    const state = new GameState(new Int32Array(9790));
    const queue = new RenderQueue(new EntityPool(state));

    queue.beginMotionSource(-20);
    queue.enqueue(0, -80, 20, 4, 100, 0);
    queue.beginFrame();
    queue.beginMotionSource(-20);
    queue.enqueue(0, 240, 20, 4, 100, 0);

    const command = [...queue.commands(4)][0]!;
    expect(queue.interpolationOffset(command, 0.5)).toBeUndefined();
  });

  it('pairs a repeated sprite with its nearest segment after indices rotate', () => {
    const state = new GameState(new Int32Array(9790));
    const queue = new RenderQueue(new EntityPool(state));

    queue.beginMotionSource(-20);
    queue.enqueue(0, -80, 20, 4, 345, 0);
    queue.enqueue(0, 76, 20, 4, 345, 0);
    queue.beginFrame();
    queue.beginMotionSource(-20);
    queue.enqueue(0, 72, 20, 4, 345, 0);
    queue.enqueue(0, 228, 20, 4, 345, 0);

    const firstSegment = [...queue.commands(4)].find((command) => command.x === 72)!;
    expect(queue.interpolationOffset(firstSegment, 0.5)).toEqual({ x: 2, y: 0 });
  });

  it('keeps moving left when an index rotates by less than the teleport threshold', () => {
    const state = new GameState(new Int32Array(9790));
    const queue = new RenderQueue(new EntityPool(state));

    queue.beginMotionSource(-20);
    queue.enqueue(0, -20, 20, 4, 345, 0);
    queue.enqueue(0, 80, 20, 4, 345, 0);
    queue.beginFrame();
    queue.beginMotionSource(-20);
    queue.enqueue(0, 70, 20, 4, 345, 0);
    queue.enqueue(0, 170, 20, 4, 345, 0);

    const recycledSegment = [...queue.commands(4)].find((command) => command.x === 70)!;
    expect(queue.interpolationOffset(recycledSegment, 0.5)).toEqual({ x: 5, y: 0 });
  });

  it('spatially pairs repeated segments belonging to the tunnel entity', () => {
    const state = new GameState(new Int32Array(9790));
    const queue = new RenderQueue(new EntityPool(state));

    queue.beginMotionSource(-21);
    queue.enqueue(0, -20, 20, 7, 345, 0);
    queue.enqueue(0, 80, 20, 7, 345, 0);
    queue.beginFrame();
    queue.beginMotionSource(-21);
    queue.enqueue(0, 70, 20, 7, 345, 0);
    queue.enqueue(0, 170, 20, 7, 345, 0);

    const segment = [...queue.commands(7)].find((command) => command.x === 70)!;
    expect(queue.interpolationOffset(segment, 0.5)).toEqual({ x: 5, y: 0 });
  });

  it('unwraps a recycled tunnel segment instead of reversing its direction', () => {
    const state = new GameState(new Int32Array(9790));
    const queue = new RenderQueue(new EntityPool(state));

    queue.beginMotionSource(-20);
    queue.enqueue(0, 0, 20, 7, 345, 0);
    queue.enqueue(0, 100, 20, 7, 345, 0);
    queue.beginFrame();
    queue.beginMotionSource(-20);
    queue.enqueue(0, 90, 20, 7, 345, 0);
    queue.enqueue(0, 190, 20, 7, 345, 0);

    const recycledSegment = [...queue.commands(7)].find((command) => command.x === 190)!;
    expect(queue.interpolationOffset(recycledSegment, 0.5)).toEqual({ x: 5, y: 0 });
  });

  it('unwraps the stage 4 dark and light trapezoid bands at their own periods', () => {
    const state = new GameState(new Int32Array(9790));
    const queue = new RenderQueue(new EntityPool(state));

    queue.beginMotionSource(-22);
    for (const x of [-48, 24, 96, 168]) queue.enqueue(2, x, 160, 15, 351, 0);
    for (const x of [-32, 80, 192]) queue.enqueue(0, x, 176, 6, 352, 0);
    queue.beginFrame();
    queue.beginMotionSource(-22);
    for (const x of [16, 88, 160, 232]) queue.enqueue(2, x, 160, 15, 351, 0);
    for (const x of [64, 176, 288]) queue.enqueue(0, x, 176, 6, 352, 0);

    const darkBand = [...queue.commands(15)].find((command) => command.x === 232)!;
    const lightBand = [...queue.commands(6)].find((command) => command.x === 288)!;
    expect(queue.interpolationOffset(darkBand, 0.5)).toEqual({ x: 4, y: 0 });
    expect(queue.interpolationOffset(lightBand, 0.5)).toEqual({ x: 8, y: 0 });
  });

  it('interpolates an animated entity when its sprite frame changes', () => {
    const state = new GameState(new Int32Array(9790));
    const queue = new RenderQueue(new EntityPool(state));

    queue.beginEntity(7);
    queue.enqueue(1, 100, 20, 15, 83, 0);
    queue.beginFrame();
    queue.beginEntity(7);
    queue.enqueue(1, 90, 20, 15, 84, 0);

    const command = [...queue.commands(15)][0]!;
    expect(queue.interpolationOffset(command, 0.5)).toEqual({ x: 5, y: 0 });
  });

  it('interpolates an animated entity when its render type also changes', () => {
    const state = new GameState(new Int32Array(9790));
    const queue = new RenderQueue(new EntityPool(state));

    queue.beginEntity(7);
    queue.enqueue(0, 100, 20, 13, 200, 0);
    queue.beginFrame();
    queue.beginEntity(7);
    queue.enqueue(2, 90, 20, 13, 201, 0);

    const command = [...queue.commands(13)][0]!;
    expect(queue.interpolationOffset(command, 0.5)).toEqual({ x: 5, y: 0 });
  });
});

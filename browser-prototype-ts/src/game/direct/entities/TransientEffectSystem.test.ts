import { describe, expect, it, vi } from 'vitest';
import { RenderQueue } from '../render/RenderQueue';
import { EntityType } from './EntityType';
import { TransientEffectSystem } from './TransientEffectSystem';

describe('TransientEffectSystem', () => {
  it('removes an expired effect through the owner callback', () => {
    const renderQueue = { enqueue: vi.fn() } as unknown as RenderQueue;
    const removeEntity = vi.fn();
    const effects = new TransientEffectSystem(renderQueue, removeEntity);

    effects.update(42, EntityType.ThreeFrameEffectA, 20, 30, 5);

    expect(removeEntity).toHaveBeenCalledWith(42);
  });
});

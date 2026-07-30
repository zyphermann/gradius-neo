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

  it('uses Java-style integer division for explosion animation frames', () => {
    const enqueue = vi.fn();
    const effects = new TransientEffectSystem({ enqueue } as unknown as RenderQueue, vi.fn());

    effects.update(7, EntityType.ThreeFrameSmallExplosion, 20, 30, 1);

    expect(enqueue).toHaveBeenCalledWith(0, 12, 22, 16, 135, 131590);
  });
});

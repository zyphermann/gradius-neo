import { EntityType } from './EntityType';
import { RenderQueue } from '../render/RenderQueue';

export class TransientEffectSystem {
  constructor(
    private readonly renderQueue: RenderQueue,
    private readonly removeEntity: (entityId: number) => void,
  ) {}

  update(entityId: number, entityType: EntityType, x: number, y: number, age: number): void {
    switch (entityType) {
      case EntityType.ThreeFrameEffectA:
      case EntityType.ThreeFrameEffectB: {
        const firstSpriteId = 125 + (entityType - EntityType.ThreeFrameEffectA) * 3;
        this.renderQueue.enqueue(1, x, y, 16, firstSpriteId + Math.trunc(age / 2), 0);
        if (age >= 5) this.removeEntity(entityId);
        return;
      }

      case EntityType.ThreeFrameSmallExplosion:
        this.renderQueue.enqueue(0, x - 8, y - 8, 16, 135 + Math.trunc(age / 2), 131590);
        if (age >= 5) this.removeEntity(entityId);
        return;

      case EntityType.TwoFrameLargeExplosion:
        this.renderQueue.enqueue(0, x - 16, y - 16, 16, 138 + Math.trunc(age / 2), 197382);
        if (age >= 3) this.removeEntity(entityId);
    }
  }
}

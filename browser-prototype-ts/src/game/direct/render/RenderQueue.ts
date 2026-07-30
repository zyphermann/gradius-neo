import { EntityPool } from '../entities/EntityPool';

export interface RenderCommand {
  id: number;
  type: number;
  x: number;
  y: number;
  layer: number;
  spriteRegion: number;
  color: number;
  sourceEntityId: number | null;
  sourceGeneration: number;
  sourcePosition: 'previous' | 'current';
}

export class RenderQueue {
  private readonly layers: RenderCommand[][] = Array.from({ length: 18 }, () => []);
  private nextCommandId = 0;
  private sourceEntityId: number | null = null;
  private sourceGeneration = 0;
  private sourcePosition: 'previous' | 'current' = 'previous';

  constructor(private readonly pool: EntityPool) {}

  enqueue(type: number, x: number, y: number, layer: number, spriteRegion: number, packedColor: number): number {
    const commandId = this.nextCommandId++;

    // Keep an independent display list in the same newest-first order as the
    // original linked-list heads. This survives the legacy renderer returning
    // its temporary pool slots and will become the 60 Hz render source.
    this.layers[layer]?.unshift({
      id: commandId,
      type,
      x,
      y,
      layer,
      spriteRegion,
      color: packedColor,
      sourceEntityId: this.sourceEntityId,
      sourceGeneration: this.sourceGeneration,
      sourcePosition: this.sourcePosition,
    });
    return commandId;
  }

  *commands(layer: number): Iterable<RenderCommand> {
    yield* this.layers[layer] ?? [];
  }

  beginFrame(): void {
    for (const layer of this.layers) layer.length = 0;
    this.nextCommandId = 0;
    this.endEntity();
  }

  beginEntity(entityId: number): void {
    this.beginMotionSource(entityId, this.pool.generation(entityId));
  }

  beginMotionSource(sourceId: number, generation = 0, sourcePosition: 'previous' | 'current' = 'previous'): void {
    this.sourceEntityId = sourceId;
    this.sourceGeneration = generation;
    this.sourcePosition = sourcePosition;
  }

  endEntity(): void {
    this.sourceEntityId = null;
    this.sourceGeneration = 0;
    this.sourcePosition = 'previous';
  }
}

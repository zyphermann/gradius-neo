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
  sourceCommandIndex: number;
}

export class RenderQueue {
  private readonly layers: RenderCommand[][] = Array.from({ length: 18 }, () => []);
  private readonly previousLayers: RenderCommand[][] = Array.from({ length: 18 }, () => []);
  private nextCommandId = 0;
  private sourceEntityId: number | null = null;
  private sourceGeneration = 0;
  private sourcePosition: 'previous' | 'current' = 'previous';
  private sourceCommandIndex = 0;

  constructor(private readonly pool: EntityPool) {}

  enqueue(type: number, x: number, y: number, layer: number, spriteRegion: number, packedColor: number): number {
    // Every argument of the original Java method is an int. TypeScript's `/`
    // keeps fractions, so truncate at this compatibility boundary just as the
    // JVM did before using coordinates, layers, or sprite-table indices.
    type = Math.trunc(type);
    x = Math.trunc(x);
    y = Math.trunc(y);
    layer = Math.trunc(layer);
    spriteRegion = Math.trunc(spriteRegion);
    packedColor = Math.trunc(packedColor);
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
      sourceCommandIndex: this.sourceCommandIndex++,
    });
    return commandId;
  }

  *commands(layer: number): Iterable<RenderCommand> {
    yield* this.layers[layer] ?? [];
  }

  beginFrame(): void {
    for (let layerIndex = 0; layerIndex < this.layers.length; layerIndex++) {
      this.previousLayers[layerIndex] = this.layers[layerIndex]!.slice();
      this.layers[layerIndex]!.length = 0;
    }
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
    this.sourceCommandIndex = 0;
  }

  endEntity(): void {
    this.sourceEntityId = null;
    this.sourceGeneration = 0;
    this.sourcePosition = 'previous';
    this.sourceCommandIndex = 0;
  }

  interpolationOffset(command: RenderCommand, alpha: number): { x: number; y: number } | undefined {
    if (command.sourceEntityId === null) return undefined;
    const previous = this.previousLayers[command.layer]?.find(
      (candidate) =>
        candidate.sourceEntityId === command.sourceEntityId &&
        candidate.sourceGeneration === command.sourceGeneration &&
        candidate.sourceCommandIndex === command.sourceCommandIndex &&
        candidate.type === command.type,
    );
    if (!previous) return undefined;

    return {
      x: (previous.x - command.x) * (1 - alpha),
      y: (previous.y - command.y) * (1 - alpha),
    };
  }
}

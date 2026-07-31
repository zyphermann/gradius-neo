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

const MAX_INTERPOLATED_DISPLACEMENT = 96;

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
    const candidates = this.previousLayers[command.layer]?.filter(
      (candidate) =>
        candidate.sourceEntityId === command.sourceEntityId &&
        candidate.sourceGeneration === command.sourceGeneration &&
        candidate.type === command.type &&
        candidate.spriteRegion === command.spriteRegion,
    );
    // Repeating tunnel pieces rotate their command indices whenever the
    // leftmost piece is recycled at the right edge. The index is therefore
    // not an identity. Always pair equal sprites spatially instead.
    const previous = candidates?.reduce<RenderCommand | undefined>((nearest, candidate) => {
      if (!nearest) return candidate;
      const distance = Math.abs(candidate.x - command.x) + Math.abs(candidate.y - command.y);
      const nearestDistance = Math.abs(nearest.x - command.x) + Math.abs(nearest.y - command.y);
      return distance < nearestDistance ? candidate : nearest;
    }, undefined);
    if (!previous) return undefined;

    const deltaX = previous.x - command.x;
    const deltaY = previous.y - command.y;
    // Stage objects such as the final tunnel ring reuse the same render source
    // after wrapping from the left edge back to the right. Interpolating that
    // reset would visibly drag the object backwards across the whole screen.
    if (Math.abs(deltaX) > MAX_INTERPOLATED_DISPLACEMENT || Math.abs(deltaY) > MAX_INTERPOLATED_DISPLACEMENT) {
      const nearest = candidates?.reduce<RenderCommand | undefined>((best, candidate) => {
        const candidateDeltaX = candidate.x - command.x;
        const candidateDeltaY = candidate.y - command.y;
        if (
          Math.abs(candidateDeltaX) > MAX_INTERPOLATED_DISPLACEMENT ||
          Math.abs(candidateDeltaY) > MAX_INTERPOLATED_DISPLACEMENT
        ) {
          return best;
        }
        if (!best) return candidate;
        const distance = Math.abs(candidateDeltaX) + Math.abs(candidateDeltaY);
        const bestDistance = Math.abs(best.x - command.x) + Math.abs(best.y - command.y);
        return distance < bestDistance ? candidate : best;
      }, undefined);
      if (!nearest) return undefined;
      return {
        x: (nearest.x - command.x) * (1 - alpha),
        y: (nearest.y - command.y) * (1 - alpha),
      };
    }

    return {
      x: deltaX * (1 - alpha),
      y: deltaY * (1 - alpha),
    };
  }
}

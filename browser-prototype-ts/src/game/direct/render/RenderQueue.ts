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
const TUNNEL_BACKDROP_SOURCE_ID = -20;
const TUNNEL_ENTITY_SOURCE_ID = -21;
const STAGE_FOUR_BANDS_SOURCE_ID = -22;

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
    const sourceCandidates = this.previousLayers[command.layer]?.filter(
      (candidate) =>
        candidate.sourceEntityId === command.sourceEntityId &&
        candidate.sourceGeneration === command.sourceGeneration,
    );
    const isSpatiallyRepeatedSource =
      command.sourceEntityId === TUNNEL_BACKDROP_SOURCE_ID ||
      command.sourceEntityId === TUNNEL_ENTITY_SOURCE_ID ||
      command.sourceEntityId === STAGE_FOUR_BANDS_SOURCE_ID;
    const candidates =
      isSpatiallyRepeatedSource
        ? sourceCandidates?.filter(
            (candidate) => candidate.type === command.type && candidate.spriteRegion === command.spriteRegion,
          )
        : sourceCandidates;
    if (isSpatiallyRepeatedSource) {
      if (!candidates?.length) return undefined;
      const nearestRowDistance = Math.min(...candidates.map((candidate) => Math.abs(candidate.y - command.y)));
      const rowCandidates = candidates.filter(
        (candidate) => Math.abs(candidate.y - command.y) === nearestRowDistance,
      );
      const uniqueX = [...new Set(rowCandidates.map((candidate) => candidate.x))].sort((left, right) => left - right);
      let repeatPeriod = 0;
      for (let index = 1; index < uniqueX.length; index++) {
        const distance = uniqueX[index]! - uniqueX[index - 1]!;
        if (distance > 0 && (repeatPeriod === 0 || distance < repeatPeriod)) repeatPeriod = distance;
      }

      const virtualCandidates = rowCandidates.flatMap((candidate) => {
        if (repeatPeriod === 0) return [{ candidate, x: candidate.x }];
        return [-2, -1, 0, 1, 2].map((periodOffset) => ({
          candidate,
          x: candidate.x + periodOffset * repeatPeriod,
        }));
      });
      // Tunnel bands always travel left. A predecessor left of the current
      // position would imply a sudden reversal; use its periodic copy to the
      // right instead.
      const continuousCandidates = virtualCandidates.filter(({ candidate, x }) => {
        const deltaX = x - command.x;
        return (
          deltaX >= 0 &&
          deltaX <= MAX_INTERPOLATED_DISPLACEMENT &&
          Math.abs(candidate.y - command.y) <= MAX_INTERPOLATED_DISPLACEMENT
        );
      });
      const previous = continuousCandidates.reduce<(typeof continuousCandidates)[number] | undefined>(
        (nearest, candidate) => {
          if (!nearest) return candidate;
          const distance = candidate.x - command.x + Math.abs(candidate.candidate.y - command.y);
          const nearestDistance = nearest.x - command.x + Math.abs(nearest.candidate.y - command.y);
          return distance < nearestDistance ? candidate : nearest;
        },
        undefined,
      );
      if (!previous) return undefined;
      return {
        x: (previous.x - command.x) * (1 - alpha),
        y: (previous.candidate.y - command.y) * (1 - alpha),
      };
    }

    // Only the repeating tunnel pieces rotate their command indices. Regular
    // entities retain the index while their animation sprite may change.
    const previous = candidates?.find((candidate) => candidate.sourceCommandIndex === command.sourceCommandIndex);
    if (!previous) return undefined;

    const deltaX = previous.x - command.x;
    const deltaY = previous.y - command.y;
    // Stage objects such as the final tunnel ring reuse the same render source
    // after wrapping from the left edge back to the right. Interpolating that
    // reset would visibly drag the object backwards across the whole screen.
    if (Math.abs(deltaX) > MAX_INTERPOLATED_DISPLACEMENT || Math.abs(deltaY) > MAX_INTERPOLATED_DISPLACEMENT) {
      return undefined;
    }

    return {
      x: deltaX * (1 - alpha),
      y: deltaY * (1 - alpha),
    };
  }
}

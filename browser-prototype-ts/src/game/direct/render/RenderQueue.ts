import { EntityPool } from '../entities/EntityPool';
import { EntityField, GameState } from '../state/GameState';

export interface RenderCommand {
  id: number;
  type: number;
  x: number;
  y: number;
  layer: number;
  spriteRegion: number;
  color: number;
}

export class RenderQueue {
  constructor(
    private readonly state: GameState,
    private readonly pool: EntityPool,
  ) {}

  enqueue(type: number, x: number, y: number, layer: number, spriteRegion: number, packedColor: number): number {
    const commandId = this.pool.takeFreeSlot();
    if (commandId < 0) return -1;

    const raw = this.state.raw;
    raw[EntityField.Next + commandId] = raw[EntityField.RenderLayerHead + layer]!;
    raw[EntityField.RenderLayerHead + layer] = commandId;
    raw[EntityField.Type + commandId] = type;
    raw[EntityField.X + commandId] = x;
    raw[EntityField.Y + commandId] = y;
    raw[EntityField.Parameter0 + commandId] = spriteRegion;
    if (type === 0) {
      raw[EntityField.Parameter1 + commandId] = (packedColor & 0xff0000) >> 16;
      raw[EntityField.Parameter2 + commandId] = (packedColor & 0xff00) >> 8;
      raw[EntityField.Parameter3 + commandId] = packedColor & 0xff;
    }
    return commandId;
  }

  *commands(layer: number): Iterable<RenderCommand> {
    const raw = this.state.raw;
    for (let id = raw[EntityField.RenderLayerHead + layer]!; id !== -1; id = raw[EntityField.Next + id]!) {
      yield {
        id,
        type: raw[EntityField.Type + id]!,
        x: raw[EntityField.X + id]!,
        y: raw[EntityField.Y + id]!,
        layer,
        spriteRegion: raw[EntityField.Parameter0 + id]!,
        color:
          (raw[EntityField.Parameter1 + id]! << 16) |
          (raw[EntityField.Parameter2 + id]! << 8) |
          raw[EntityField.Parameter3 + id]!,
      };
    }
  }
}

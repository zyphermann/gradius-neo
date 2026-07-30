import { EntityField, GameState, StateSlot } from '../state/GameState';
import { EntityPool } from './EntityPool';

export interface InterpolatedEntityPosition {
  x: number;
  y: number;
}

export interface EntityMotionOffset {
  x: number;
  y: number;
}

interface EntityPosition {
  generation: number;
  x: number;
  y: number;
}

export class EntityMotionSnapshots {
  private previous = new Map<number, EntityPosition>();
  private current = new Map<number, EntityPosition>();

  constructor(
    private readonly state: GameState,
    private readonly entities: EntityPool,
  ) {}

  captureBeforeTick(): void {
    this.previous = this.captureActiveEntities();
  }

  captureAfterTick(): void {
    this.current = this.captureActiveEntities();
  }

  interpolate(entityId: number, alpha: number): InterpolatedEntityPosition | undefined {
    const current = this.current.get(entityId);
    if (!current) return undefined;

    const previous = this.previous.get(entityId);
    if (!previous || previous.generation !== current.generation) {
      return { x: current.x, y: current.y };
    }

    return {
      x: previous.x + (current.x - previous.x) * alpha,
      y: previous.y + (current.y - previous.y) * alpha,
    };
  }

  offset(entityId: number, generation: number, alpha: number): EntityMotionOffset | undefined {
    const previous = this.previous.get(entityId);
    const current = this.current.get(entityId);
    if (!previous || !current || previous.generation !== generation || current.generation !== generation) {
      return undefined;
    }

    return {
      x: (current.x - previous.x) * alpha,
      y: (current.y - previous.y) * alpha,
    };
  }

  private captureActiveEntities(): Map<number, EntityPosition> {
    const positions = new Map<number, EntityPosition>();
    this.captureList(StateSlot.PrimaryEntityHead, positions);
    this.captureList(StateSlot.AuxiliaryEntityHead, positions);
    positions.set(-1, {
      generation: 0,
      x: this.state.raw[StateSlot.PlayerX]!,
      y: this.state.raw[StateSlot.PlayerY]!,
    });
    for (let optionIndex = 1; optionIndex <= 4; optionIndex++) {
      positions.set(-1 - optionIndex, {
        generation: 0,
        x: this.state.raw[1160 + optionIndex]!,
        y: this.state.raw[1165 + optionIndex]!,
      });
    }
    for (let projectileIndex = 0; projectileIndex < 20; projectileIndex++) {
      if (this.state.raw[1245 + projectileIndex]! < 0) continue;
      positions.set(-100 - projectileIndex, {
        generation: 0,
        x: this.state.raw[1185 + projectileIndex]!,
        y: this.state.raw[1205 + projectileIndex]!,
      });
    }
    return positions;
  }

  private captureList(headSlot: StateSlot, positions: Map<number, EntityPosition>): void {
    const raw = this.state.raw;
    const visited = new Uint8Array(512);
    for (let entityId = raw[headSlot]!; entityId !== -1; entityId = raw[EntityField.Next + entityId]!) {
      // Before LoadStage initializes the pool, its zero-filled list head points
      // back to slot 0. Guarding the list also protects snapshots from corrupt
      // links without hanging the browser's animation frame.
      if (entityId < 0 || entityId >= visited.length || visited[entityId]) break;
      visited[entityId] = 1;
      positions.set(entityId, {
        generation: this.entities.generation(entityId),
        x: raw[EntityField.X + entityId]!,
        y: raw[EntityField.Y + entityId]!,
      });
    }
  }
}

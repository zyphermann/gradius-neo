import { EntityField, type EntityList, GameState, StateSlot } from '../state/GameState';

export class EntityPool {
  private readonly generations = new Uint32Array(512);

  constructor(private readonly state: GameState) {}

  spawn(list: EntityList, type: number, x: number, y: number, packedParameters: number): number {
    const entityId = this.takeFreeSlot();
    if (entityId < 0) return -1;
    this.generations[entityId] = (this.generations[entityId] ?? 0) + 1;

    const entity = this.state.entity(entityId);
    const headSlot = list === 'primary' ? StateSlot.PrimaryEntityHead : StateSlot.AuxiliaryEntityHead;
    const oldHeadId = this.state.get(headSlot);

    entity.previousId = -1;
    entity.nextId = oldHeadId;
    if (oldHeadId !== -1) this.state.entity(oldHeadId).previousId = entityId;
    this.state.set(headSlot, entityId);

    entity.type = type;
    entity.x = x;
    entity.y = y;
    entity.xFixed = x << 4;
    entity.yFixed = y << 4;
    entity.age = 0;
    entity.health = 1;
    entity.setParameter(0, packedParameters & 0xff);
    entity.setParameter(1, (packedParameters >> 8) & 0xff);
    entity.setParameter(2, (packedParameters >> 16) & 0xff);
    entity.setParameter(3, packedParameters >> 24);
    return entityId;
  }

  release(list: EntityList, entityId: number): void {
    const entity = this.state.entity(entityId);
    const previousEntityId = entity.previousId;
    const nextEntityId = entity.nextId;
    const headSlot = list === 'primary' ? StateSlot.PrimaryEntityHead : StateSlot.AuxiliaryEntityHead;

    if (previousEntityId !== -1) this.state.entity(previousEntityId).nextId = nextEntityId;
    else this.state.set(headSlot, nextEntityId);

    if (nextEntityId !== -1) this.state.entity(nextEntityId).previousId = previousEntityId;
    this.returnSlot(entityId);
  }

  takeFreeSlot(): number {
    const entityId = this.state.get(StateSlot.FreeEntityHead);
    if (entityId < 0) return -1;
    this.state.set(StateSlot.FreeEntityHead, this.state.raw[EntityField.Next + entityId]!);
    return entityId;
  }

  returnSlot(entityId: number): void {
    this.state.raw[EntityField.Next + entityId] = this.state.get(StateSlot.FreeEntityHead);
    this.state.set(StateSlot.FreeEntityHead, entityId);
  }

  generation(entityId: number): number {
    return this.generations[entityId]!;
  }
}

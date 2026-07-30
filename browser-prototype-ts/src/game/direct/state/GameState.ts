export const enum StateSlot {
  ViewportOffsetX = 7,
  ViewportOffsetY = 8,
  LogicFrame = 9,
  HeldInputBits = 11,
  PressedInputBits = 12,
  PressedInputAccumulator = 13,
  Score = 16,
  Lives = 17,
  NextExtraLifeScore = 18,
  Continues = 19,
  AutoFireSetting = 21,
  Difficulty = 23,
  CheatCodeProgress = 26,
  CheatUseCount = 27,
  CurrentStage = 31,
  CurrentRound = 32,
  HighestUnlockedStage = 35,
  StageWorldHeight = 36,
  StageScriptAdvancePerTick = 42,
  StageScrollSpeed = 43,
  PendingCameraDeltaY = 44,
  StageEventCountdown = 50,
  StageScriptPosition = 51,
  CollisionMapScrollX = 52,
  VisualStageScrollX = 53,
  CameraOffsetY = 54,
  FreeEntityHead = 55,
  PrimaryEntityHead = 56,
  AuxiliaryEntityHead = 57,
  PlayerMoveSpeed = 59,
  MainWeaponState = 60,
  MissileState = 61,
  ShieldEnergy = 62,
  OptionCount = 65,
  MissileVariant = 69,
  PlayerDamagePhase = 76,
  SelectedPowerUp = 79,
  SelectedFormation = 80,
  FormationUnlock0 = 1120,
  FormationUnlock1 = 1121,
  FormationUnlock2 = 1122,
  FormationUnlock3 = 1123,
  FormationUnlock4 = 1124,
  FormationUnlock5 = 1125,
  PlayerX = 1126,
  PlayerY = 1143,
}

export const enum EntityField {
  RenderLayerHead = 2028,
  Previous = 2046,
  Next = 2558,
  Type = 3070,
  X = 3582,
  Y = 4094,
  XFixed = 5630,
  YFixed = 6142,
  Age = 6654,
  Parameter0 = 7166,
  Parameter1 = 7678,
  Parameter2 = 8190,
  Parameter3 = 8702,
  Health = 9214,
}

export type EntityList = 'primary' | 'auxiliary';

export class EntityView {
  constructor(
    private readonly raw: Int32Array,
    readonly id: number,
  ) {}

  private read(field: EntityField): number {
    return this.raw[field + this.id]!;
  }

  private write(field: EntityField, value: number): void {
    this.raw[field + this.id] = value;
  }

  get type(): number {
    return this.read(EntityField.Type);
  }
  set type(value: number) {
    this.write(EntityField.Type, value);
  }

  get previousId(): number {
    return this.read(EntityField.Previous);
  }
  set previousId(value: number) {
    this.write(EntityField.Previous, value);
  }

  get nextId(): number {
    return this.read(EntityField.Next);
  }
  set nextId(value: number) {
    this.write(EntityField.Next, value);
  }

  get x(): number {
    return this.read(EntityField.X);
  }
  set x(value: number) {
    this.write(EntityField.X, value);
  }

  get y(): number {
    return this.read(EntityField.Y);
  }
  set y(value: number) {
    this.write(EntityField.Y, value);
  }

  get xFixed(): number {
    return this.read(EntityField.XFixed);
  }
  set xFixed(value: number) {
    this.write(EntityField.XFixed, value);
  }

  get yFixed(): number {
    return this.read(EntityField.YFixed);
  }
  set yFixed(value: number) {
    this.write(EntityField.YFixed, value);
  }

  get age(): number {
    return this.read(EntityField.Age);
  }
  set age(value: number) {
    this.write(EntityField.Age, value);
  }

  get health(): number {
    return this.read(EntityField.Health);
  }
  set health(value: number) {
    this.write(EntityField.Health, value);
  }

  parameter(index: 0 | 1 | 2 | 3): number {
    return this.raw[EntityField.Parameter0 + index * 512 + this.id]!;
  }

  setParameter(index: 0 | 1 | 2 | 3, value: number): void {
    this.raw[EntityField.Parameter0 + index * 512 + this.id] = value;
  }
}

export class GameState {
  constructor(readonly raw: Int32Array) {}

  get(slot: StateSlot): number {
    return this.raw[slot]!;
  }

  set(slot: StateSlot, value: number): void {
    this.raw[slot] = value;
  }

  entity(id: number): EntityView {
    return new EntityView(this.raw, id);
  }

  get score(): number {
    return this.get(StateSlot.Score);
  }
  set score(value: number) {
    this.set(StateSlot.Score, value);
  }

  get lives(): number {
    return this.get(StateSlot.Lives);
  }
  set lives(value: number) {
    this.set(StateSlot.Lives, value);
  }

  get playerX(): number {
    return this.get(StateSlot.PlayerX);
  }
  set playerX(value: number) {
    this.set(StateSlot.PlayerX, value);
  }

  get playerY(): number {
    return this.get(StateSlot.PlayerY);
  }
  set playerY(value: number) {
    this.set(StateSlot.PlayerY, value);
  }
}

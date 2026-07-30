export const SAVE_DATA_LENGTH = 78;

export const enum SaveOffset {
  Settings = 0,
  AutoFire = 1,
  ScreenSetup = 2,
  HighestUnlockedStage = 3,
  HighestRound = 4,
  FirstHighScoreStage = 5,
  FirstHighScore = 6,
  SecondHighScoreStage = 10,
  SecondHighScore = 11,
  ThirdHighScoreStage = 15,
  ThirdHighScore = 16,

  SavedDifficulty = 23,
  Score = 24,
  NextExtraLifeScore = 28,
  Lives = 32,
  Continues = 33,
  PlayerMoveSpeed = 37,
  OptionCount = 40,

  MissileVariantCount = 52,
  MainWeaponVariantCount = 53,
  FormationVariantCount = 54,
  FirstExtraModeBestScore = 58,
}

export interface DefaultSaveSettings {
  screenSetup: number;
  highestUnlockedStage: number;
  highestRound: number;
}

export function writeInt32(buffer: Int8Array, offset: number, value: number): void {
  buffer[offset] = value >> 24;
  buffer[offset + 1] = value >> 16;
  buffer[offset + 2] = value >> 8;
  buffer[offset + 3] = value;
}

export function readInt32(buffer: Int8Array, offset: number): number {
  return (
    (buffer[offset]! << 24) |
    ((buffer[offset + 1]! & 0xff) << 16) |
    ((buffer[offset + 2]! & 0xff) << 8) |
    (buffer[offset + 3]! & 0xff)
  );
}

export function initializeDefaultSaveData(buffer: Int8Array, settings: DefaultSaveSettings): void {
  buffer.fill(0);

  const defaultDifficulty = 2;
  const defaultSoundMode = 2;
  buffer[SaveOffset.Settings] = defaultDifficulty | (defaultSoundMode << 4);
  buffer[SaveOffset.AutoFire] = 1;
  buffer[SaveOffset.ScreenSetup] = settings.screenSetup;
  buffer[SaveOffset.HighestUnlockedStage] = settings.highestUnlockedStage;
  buffer[SaveOffset.HighestRound] = settings.highestRound;

  writeInt32(buffer, SaveOffset.FirstHighScore, 57_300);
  writeInt32(buffer, SaveOffset.SecondHighScore, 30_000);
  writeInt32(buffer, SaveOffset.ThirdHighScore, 10_000);

  buffer[SaveOffset.SavedDifficulty] = defaultDifficulty;
  writeInt32(buffer, SaveOffset.NextExtraLifeScore, 70_000);
  buffer[SaveOffset.Lives] = 2;
  buffer[SaveOffset.Continues] = 3;
  buffer[SaveOffset.PlayerMoveSpeed] = 5;
  buffer[SaveOffset.OptionCount] = 2;

  buffer[SaveOffset.MissileVariantCount] = 1;
  buffer[SaveOffset.MainWeaponVariantCount] = 1;
  buffer[SaveOffset.FormationVariantCount] = 1;
}

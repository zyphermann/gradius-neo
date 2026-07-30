import { describe, expect, it } from 'vitest';
import { initializeDefaultSaveData, readInt32, SAVE_DATA_LENGTH, SaveOffset, writeInt32 } from './SaveData';

describe('SaveData', () => {
  it('round-trips signed 32-bit values in the original big-endian format', () => {
    const data = new Int8Array(SAVE_DATA_LENGTH);
    writeInt32(data, 10, 0x1234abcd);
    expect(readInt32(data, 10)).toBe(0x1234abcd);
  });

  it('creates readable original defaults', () => {
    const data = new Int8Array(SAVE_DATA_LENGTH);
    initializeDefaultSaveData(data, { screenSetup: 0, highestUnlockedStage: 0, highestRound: 0 });
    expect(data[SaveOffset.Settings]).toBe(34);
    expect(readInt32(data, SaveOffset.FirstHighScore)).toBe(57_300);
    expect(readInt32(data, SaveOffset.NextExtraLifeScore)).toBe(70_000);
    expect(data[SaveOffset.Lives]).toBe(2);
  });
});

import { describe, expect, it } from 'vitest';
import { StageResource } from './StageResource';

describe('Gradius Neo stage resources', () => {
  it('decodes the header and both terminated event lists', () => {
    const stage = new StageResource(new Uint8Array([
      0, 8, 0, 20, 0, 22, 0, 24,
      0, 224, 1, 64, 3, 4, 1, 2,
      0, 5, 0xff, 0, 9, 0x7f, 0,
    ]));
    expect(stage.sectionOffsets).toEqual([8, 20, 22, 24]);
    expect([stage.width, stage.height, stage.firstTile, stage.tileCount, stage.scrollMode, stage.scrollSpeed])
      .toEqual([224, 320, 3, 4, 1, 2]);
    expect(stage.initialEvents).toEqual([5]);
    expect(stage.timelineEvents).toEqual([9]);
  });
});

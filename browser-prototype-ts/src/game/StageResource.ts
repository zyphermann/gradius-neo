function unsignedShort(bytes: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 1 >= bytes.length) throw new Error('Stage data is truncated');
  return bytes[offset]! << 8 | bytes[offset + 1]!;
}

function signedShort(bytes: Uint8Array, offset: number): number {
  const value = unsignedShort(bytes, offset);
  return value & 0x8000 ? value - 0x10000 : value;
}

/** Der beim Laden von Zustand 20 ausgewertete Kopf einer Stage-Datei. */
export class StageResource {
  readonly sectionOffsets: readonly number[];
  readonly width: number;
  readonly height: number;
  readonly firstTile: number;
  readonly tileCount: number;
  readonly scrollMode: number;
  readonly scrollSpeed: number;
  readonly initialEvents: readonly number[];
  readonly timelineEvents: readonly number[];

  constructor(readonly bytes: Uint8Array) {
    this.sectionOffsets = [0, 2, 4, 6].map((offset) => unsignedShort(bytes, offset));
    let cursor = this.sectionOffsets[0]!;
    this.width = unsignedShort(bytes, cursor); cursor += 2;
    this.height = unsignedShort(bytes, cursor); cursor += 2;
    this.firstTile = bytes[cursor++]!;
    this.tileCount = bytes[cursor++]!;
    this.scrollMode = bytes[cursor++]!;
    this.scrollSpeed = bytes[cursor++]!;

    const initial: number[] = [];
    while (bytes[cursor] !== 0xff) {
      initial.push(signedShort(bytes, cursor));
      cursor += 2;
    }
    cursor++;

    const timeline: number[] = [];
    while (unsignedShort(bytes, cursor) !== 0x7f00) {
      timeline.push(signedShort(bytes, cursor));
      cursor += 2;
    }
    this.initialEvents = initial;
    this.timelineEvents = timeline;
  }
}

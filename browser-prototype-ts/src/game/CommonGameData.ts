/** Dekodiert den in b.java Zustand 2 geladenen gemeinsamen Datenblock `c`. */
export class CommonGameData {
  readonly colors: readonly number[];
  readonly randomTable: Uint8Array;
  readonly starX: Uint8Array;
  readonly starY: Uint8Array;

  constructor(bytes: Uint8Array) {
    if (bytes.length < 6) throw new Error('Common game data header is truncated');
    const dataOffset = bytes[4]! << 8 | bytes[5]!;
    const randomOffset = dataOffset + 20 * 3;
    if (randomOffset + 792 > bytes.length) throw new Error('Common game data is truncated');

    this.colors = Array.from({ length: 20 }, (_, index) => {
      const cursor = dataOffset + index * 3;
      return bytes[cursor]! << 16 | bytes[cursor + 1]! << 8 | bytes[cursor + 2]!;
    });
    // b.java advances var109 by 60 bytes while reading the palette; only then
    // are the 792 signed/random values copied to s[327..1118].
    this.randomTable = bytes.slice(randomOffset, randomOffset + 792);
    // s[1055] - s[327] = 728; b.java uses 20 X followed by 20 Y bytes.
    this.starX = this.randomTable.slice(728, 748);
    this.starY = this.randomTable.slice(748, 768);
  }
}

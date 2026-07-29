import { Player } from './Player';

interface InputStreamLike {
  read(target: Int8Array | Uint8Array): number;
}

export class Manager {
  static createPlayer(stream: InputStreamLike, contentType: string): Player {
    if (contentType !== 'audio/midi') throw new Error(`Unsupported media type: ${contentType}`);

    const parts: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const target = new Uint8Array(16 * 1024);
      const count = stream.read(target);
      if (count <= 0) break;
      parts.push(target.slice(0, count));
      total += count;
    }

    const sequence = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) {
      sequence.set(part, offset);
      offset += part.length;
    }
    return new Player(sequence);
  }
}

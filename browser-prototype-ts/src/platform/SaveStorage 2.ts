export interface SaveStorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const memory = new Map<string, string>();
const memoryBackend: SaveStorageBackend = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => {
    memory.set(key, value);
  },
  removeItem: (key) => {
    memory.delete(key);
  },
};

function defaultBackend(): SaveStorageBackend {
  return typeof localStorage === 'undefined' ? memoryBackend : localStorage;
}

function encode(bytes: Uint8Array): string {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

function decode(value: string): Uint8Array {
  if (value.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(value)) throw new Error('Corrupt save data');
  return Uint8Array.from({ length: value.length / 2 }, (_, index) =>
    Number.parseInt(value.slice(index * 2, index * 2 + 2), 16),
  );
}

/** Minimale MIDP-RMS-Implementierung mit 1-basierten Record-IDs. */
export class SaveStorage {
  private static backend: SaveStorageBackend = defaultBackend();
  private readonly key: string;
  private records: string[];
  private closed = false;

  private constructor(name: string, records: string[]) {
    this.key = `gradius-neo:rms:${name}`;
    this.records = records;
  }

  static open(name: string, createIfNecessary: boolean): SaveStorage {
    const key = `gradius-neo:rms:${name}`;
    const stored = this.backend.getItem(key);
    if (stored === null) {
      if (!createIfNecessary) throw new Error(`Save storage does not exist: ${name}`);
      this.backend.setItem(key, '[]');
      return new SaveStorage(name, []);
    }
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed) || !parsed.every((record) => typeof record === 'string')) {
      throw new Error(`Corrupt save storage: ${name}`);
    }
    return new SaveStorage(name, parsed);
  }

  static openRecordStore(name: string, createIfNecessary: boolean): SaveStorage {
    return this.open(name, createIfNecessary);
  }

  static useBackend(backend: SaveStorageBackend): void {
    this.backend = backend;
  }

  getNumRecords(): number {
    this.ensureOpen();
    return this.records.length;
  }

  addRecord(data: Uint8Array, offset: number, length: number): number {
    this.ensureOpen();
    const bytes = this.slice(data, offset, length);
    this.records.push(encode(bytes));
    this.persist();
    return this.records.length;
  }

  getRecord(recordId: number): Uint8Array;
  getRecord(recordId: number, target: Uint8Array, offset: number): number;
  getRecord(recordId: number, target?: Uint8Array, offset = 0): Uint8Array | number {
    this.ensureOpen();
    const bytes = this.read(recordId);
    if (!target) return bytes;
    if (offset < 0 || offset + bytes.length > target.length) throw new RangeError('Record target is too small');
    target.set(bytes, offset);
    return bytes.length;
  }

  setRecord(recordId: number, data: Uint8Array, offset: number, length: number): void {
    this.ensureOpen();
    this.validateId(recordId);
    this.records[recordId - 1] = encode(this.slice(data, offset, length));
    this.persist();
  }

  close(): void {
    this.ensureOpen();
    this.closed = true;
  }

  closeRecordStore(): void {
    this.close();
  }

  private read(recordId: number): Uint8Array {
    this.validateId(recordId);
    return decode(this.records[recordId - 1]!);
  }

  private validateId(recordId: number): void {
    if (!Number.isInteger(recordId) || recordId < 1 || recordId > this.records.length) {
      throw new RangeError(`Invalid record ID: ${recordId}`);
    }
  }

  private slice(data: Uint8Array, offset: number, length: number): Uint8Array {
    if (offset < 0 || length < 0 || offset + length > data.length) throw new RangeError('Invalid record byte range');
    return data.slice(offset, offset + length);
  }

  private persist(): void {
    SaveStorage.backend.setItem(this.key, JSON.stringify(this.records));
  }

  private ensureOpen(): void {
    if (this.closed) throw new Error('Save storage is closed');
  }
}

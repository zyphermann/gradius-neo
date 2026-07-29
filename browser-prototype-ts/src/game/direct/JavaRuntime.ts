export type int = number;
export type long = bigint;
export type char = number;
export type byte = number;
export type short = number;

class JavaHashtable<K, V> {
  private readonly values = new Map<K, V>();

  get(key: K): V | null {
    return this.values.get(key) ?? null;
  }

  put(key: K, value: V): V | null {
    const previous = this.get(key);
    this.values.set(key, value);
    return previous;
  }
}

interface JavaError extends Error {
  getMessage(): string;
}

if (!('getMessage' in Error.prototype)) {
  Object.defineProperty(Error.prototype, 'getMessage', {
    configurable: true,
    value(this: Error): string { return this.message; },
  });
}

export const java = {
  lang: {
    System: {
      currentTimeMillis: (): bigint => BigInt(Date.now()),
      gc: (): void => {},
    },
    Thread: {
      sleep: (_milliseconds: bigint): void => {},
      yield: (): void => {},
    },
    Throwable: Error,
    IllegalArgumentException: RangeError,
  },
  util: {
    Hashtable: JavaHashtable,
  },
} as const;

export type { JavaError };

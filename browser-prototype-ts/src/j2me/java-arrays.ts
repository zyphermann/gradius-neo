export function newIntArray(length: number): Int32Array {
  return new Int32Array(length);
}

export function newShortArray(length: number): Int16Array {
  return new Int16Array(length);
}

export function newByteArray(length: number): Int8Array {
  return new Int8Array(length);
}

export function newBooleanArray(length: number): boolean[] {
  return Array.from({ length }, () => false);
}

export function newObjectArray<T>(length: number): Array<T | null> {
  return Array.from({ length }, () => null);
}

import { beforeEach, describe, expect, it } from 'vitest';
import { RecordStore, type RecordStoreBackend } from './RecordStore';

describe('J2ME RecordStore', () => {
  beforeEach(() => {
    const data = new Map<string, string>();
    const backend: RecordStoreBackend = {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => { data.set(key, value); },
      removeItem: (key) => { data.delete(key); },
    };
    RecordStore.useBackend(backend);
  });

  it('persists records with MIDP one-based IDs', () => {
    let store = RecordStore.openRecordStore('R', true);
    expect(store.addRecord(new Uint8Array([9, 1, 2, 3]), 1, 3)).toBe(1);
    store.closeRecordStore();

    store = RecordStore.openRecordStore('R', false);
    const target = new Uint8Array(5);
    expect(store.getRecord(1, target, 1)).toBe(3);
    expect([...target]).toEqual([0, 1, 2, 3, 0]);
    store.setRecord(1, new Uint8Array([7, 8]), 0, 2);
    expect([...store.getRecord(1)]).toEqual([7, 8]);
  });

  it('rejects invalid IDs and access after close', () => {
    const store = RecordStore.openRecordStore('R', true);
    expect(() => store.getRecord(1)).toThrow('Invalid record ID');
    store.closeRecordStore();
    expect(() => store.getNumRecords()).toThrow('closed');
  });
});

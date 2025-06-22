import { DBSchema, openDB } from 'idb';
import { Kora } from './kora';

type Entry = {
  data: any;
  timestamp: number;
};

interface CacheDB extends DBSchema {
  keyval: {
    key: string;
    value: Entry;
  };
}

export type Keys = [Kora.Type, ...string[]] | ['/', Page, ...string[]];

class Cache {
  public DEDUPE_WINDOW = 2 * 60 * 1000; // 2 minutes
  public inflightFetches: Record<string, { promise: Promise<any>; timestamp: number }> = {};
  private dbPromise = openDB<CacheDB>('kora-cache', 1, {
    upgrade(db) {
      db.createObjectStore('keyval');
    }
  });
  private memoryStore: Record<string, Entry> = {};

  async init() {
    const db = await this.dbPromise;
    this.memoryStore = {};
    let cursor = await db.transaction('keyval').store.openCursor();
    while (cursor) {
      this.memoryStore[cursor.key as string] = cursor.value;
      cursor = await cursor.continue();
    }
    console.log('Cache initialized with', Object.keys(this.memoryStore).length, 'items');
  }

  set = (keys: Keys, value: any) => {
    const key = keys.join(':');
    this.memoryStore[key] = value;
    this.dbPromise.then((db) =>
      db.put(
        'keyval',
        {
          data: value,
          timestamp: Date.now()
        },
        key
      )
    );
  };

  get = (keys: Keys): any => {
    const key = keys.join(':');
    return this.memoryStore[key]?.data;
  };

  clear = async (): Promise<void> => {
    this.memoryStore = {};
    const db = await this.dbPromise;
    await db.clear('keyval');
  };

  dedupe<T>(
    keys: [Kora.Type, ...string[]],
    fetch: (...keys: string[]) => Promise<T>,
    dedupeWindow: number = this.DEDUPE_WINDOW
  ): Promise<T | null> {
    const key = keys.join(':');
    const now = Date.now();

    // Check memoryStore for a valid cached value within the dedupe window
    const entry = this.memoryStore[key];
    if (entry && now - entry.timestamp < dedupeWindow) {
      return Promise.resolve(entry.data as T);
    }

    // Check for inflight fetch within dedupe window
    if (this.inflightFetches[key] && now - this.inflightFetches[key].timestamp < dedupeWindow) {
      return this.inflightFetches[key].promise;
    }

    // Otherwise, fetch and store
    const fetchPromise = fetch(...keys).then((result) => {
      this.memoryStore[key] = { data: result, timestamp: Date.now() };
      this.dbPromise.then((db) => db.put('keyval', { data: result, timestamp: Date.now() }, key));
      return result;
    });
    this.inflightFetches[key] = { promise: fetchPromise, timestamp: now };

    // Clean up after dedupe window
    setTimeout(() => {
      if (this.inflightFetches[key] && this.inflightFetches[key].promise === fetchPromise) {
        delete this.inflightFetches[key];
      }
    }, dedupeWindow);

    return fetchPromise;
  }
}

export const cache = new Cache();

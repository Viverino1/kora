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
  public DEBOUNCE_WINDOW = 3 * 1000; // 3 seconds
  public inflightFetches: Record<string, { promise: Promise<any>; timestamp: number }> = {};
  public debounceTimers: Record<string, NodeJS.Timeout> = {};
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
  }

  set = async <T = any>(keys: Keys, value: T) => {
    const key = keys.join(':');
    const entry = {
      data: value,
      timestamp: Date.now()
    };
    this.memoryStore[key] = entry;
    await this.dbPromise.then((db) => db.put('keyval', entry, key));
  };

  get = <T = any>(keys: Keys): T | null => {
    const key = keys.join(':');
    return this.memoryStore[key]?.data ?? (null as T | null);
  };

  getAll = <T = any>(arg: Kora.Type | Keys): T[] => {
    const match = Array.isArray(arg) ? arg.join(':') : arg;
    return Object.entries(this.memoryStore)
      .filter(([key]) => key.includes(match))
      .map(([, entry]) => entry.data as T);
  };

  clear = async (): Promise<void> => {
    this.memoryStore = {};
    const db = await this.dbPromise;
    await db.clear('keyval');
    window.location.replace('/');
  };

  delete = async (keys: Keys): Promise<void> => {
    const prefix = keys.join(':');
    // Find all keys in memoryStore that start with the prefix
    const keysToDelete = Object.keys(this.memoryStore).filter((key) => key.includes(prefix));
    console.log('Deleting keys:', keysToDelete);
    for (const key of keysToDelete) {
      delete this.memoryStore[key];
      const db = await this.dbPromise;
      await db.delete('keyval', key);
    }
  };

  getStore = () => this.memoryStore;

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

  debounce = (keys: Keys, setFn: () => any) => {
    const key = keys.join(':');
    if (!this.debounceTimers[key]) {
      this.debounceTimers[key] = setTimeout(() => {
        setFn();
        clearTimeout(this.debounceTimers[key]);
      }, this.DEBOUNCE_WINDOW);
    }
  };

  async prefetch<T>(keys: Keys, fetch: () => Promise<T | null>) {
    const cachedData = this.get(keys);
    if (cachedData) return cachedData;

    const fetchedData = await fetch();
    if (fetchedData) {
      await this.set(keys, fetchedData);
      return fetchedData;
    }

    return null;
  }
}

export const cache = new Cache();

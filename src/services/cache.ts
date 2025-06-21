import { Kora } from './kora';

export type Entry<T extends Kora.Any> = {
  value: T;
  lastFetched?: number;
  lastUpdated?: number;
  lastMutated?: number;
};

class Cache {
  public DEDUPE_WINDOW = 2 * 60 * 1000; // 2 minutes
  public inflightFetches: Record<string, { promise: Promise<any>; timestamp: number }> = {};

  dedupe<T>(
    [type, ...keys]: [Kora.Type, ...string[]],
    fetch: (...keys: string[]) => Promise<T>,
    dedupeWindow: number = this.DEDUPE_WINDOW
  ): Promise<T | null> {
    const key = [type, ...keys].join(':');
    try {
      const now = Date.now();
      if (this.inflightFetches[key] && now - this.inflightFetches[key].timestamp < dedupeWindow) {
        return this.inflightFetches[key].promise;
      }
      const fetchPromise = fetch(...keys);
      this.inflightFetches[key] = { promise: fetchPromise, timestamp: now };
      // Clean up after dedupe window
      setTimeout(() => {
        if (this.inflightFetches[key] && this.inflightFetches[key].promise === fetchPromise) {
          delete this.inflightFetches[key];
        }
      }, dedupeWindow);
      return fetchPromise;
    } catch {
      return Promise.resolve(null);
    }
  }
}

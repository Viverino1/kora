import { useEffect, useMemo, useState } from 'react';
import { cache, Keys } from '../services/cache';

export default function useLoader<T>(keys: Keys, fetch: () => Promise<T | null>, fromCache?: () => T | null) {
  const cachedData = useMemo(() => (fromCache ? fromCache() : cache.get(keys)), [JSON.stringify(keys)]);
  const [data, setData] = useState<T | null>(cachedData);
  const [state, setState] = useState<State>(cachedData ? 'success' : 'loading');

  useEffect(() => {
    let cancelled = false;
    if (!cachedData) setState('loading');
    fetch()
      .then((res) => {
        if (cancelled) return;
        if (JSON.stringify(res) !== JSON.stringify(cachedData)) {
          setData(res);
          cache.set(keys, res);
        }
        setState('success');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line
  }, [JSON.stringify(keys)]);

  return {
    data,
    state
  };
}

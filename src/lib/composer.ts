import { cache } from '../services/cache';
import { Kora } from '../services/kora';

export async function getHome() {
  const home = await Kora.getHome();
  if (!home) return null;

  const allHistory = cache.getAll<Kora.History>('history');
  allHistory.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  const continueWatching = Array.from(new Set(allHistory.map((h) => h.animeId)));

  const unique = Array.from(new Set([...continueWatching, ...home]));
  const filtered: string[] = [];
  for (const id of unique) {
    const cachedAnime = cache.get(['anime', id]);
    if (cachedAnime) {
      filtered.push(id);
    } else {
      const anime = await Kora.getAnime(id);
      if (anime) filtered.push(id);
    }
    if (filtered.length >= 7) break;
  }

  return filtered.slice(0, 7);
}

export function getHomeFromCache() {
  const home = cache.get<Kora.Home>(['home']) ?? [];

  const allHistory = cache.getAll<Kora.History>('history');
  allHistory.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  const continueWatching = Array.from(new Set(allHistory.map((h) => h.animeId)));
  const unique = Array.from(new Set([...continueWatching, ...home]));
  const filtered: string[] = [];
  for (const id of unique) {
    if (cache.get(['anime', id])) {
      filtered.push(id);
    } else {
      break;
    }
    if (filtered.length >= 7) break;
  }

  if (filtered.length >= 7) {
    return filtered.slice(0, 7);
  } else {
    return cache.get<Kora.Home>(['/', 'home']);
  }
}

export function findLastWatchedEpisode(anime: Kora.Anime): { history: Kora.History | null; episode: Kora.Episode } {
  return {
    history: null,
    episode: anime.episodes[0]
  };
}

export async function mergeWatchHistory() {
  const remote: Kora.History[] | null = await Kora.getHistory();
  const local: Kora.History[] = cache.getAll<Kora.History>('history');
  if (!remote) return;

  // Step 1: Build a map of histories by unique key (e.g., animeId + episodeId)
  const mergedMap = new Map<string, Kora.History>();

  function getKey(h: Kora.History) {
    return ['history', h.animeId, h.epid].join(':');
  }

  // Add all remote histories
  for (const h of remote) {
    mergedMap.set(getKey(h), h);
  }

  // Merge with local, preferring the most recent lastUpdated
  for (const h of local) {
    const key = getKey(h);
    const existing = mergedMap.get(key);
    if (!existing || new Date(h.lastUpdated).getTime() > new Date(existing.lastUpdated).getTime()) {
      mergedMap.set(key, h);
    }
  }

  // Step 2: Build merged array
  const merged = Array.from(mergedMap.values());

  // Step 3: Find which entries have changed (differ from remote)
  const remoteMap = new Map(remote.map((h) => [getKey(h), h]));
  const changed: Kora.History[] = [];
  for (const h of merged) {
    const r = remoteMap.get(getKey(h));
    if (!r || new Date(h.lastUpdated).getTime() > new Date(r.lastUpdated).getTime()) {
      changed.push(h);
    }
  }

  for (const h of merged) {
    cache.set(['history', h.animeId, h.epid], h);
  }

  // Update remote server with changed entries, one at a time
  for (const h of changed) {
    await Kora.setEpisodeHistory(h.animeId, h.epid, h.lastTimeStamp, h.duration);
  }
}

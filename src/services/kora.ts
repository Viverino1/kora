import axios from 'axios';
import { auth } from '../providors/AuthProvidor';
import { cache } from './cache';
const url = import.meta.env.VITE_KORA_API_BASE_URL;
export class Kora {
  private static async _getHome() {
    try {
      const res = await axios.get(`${url}/home`);
      const home = res.data as Kora.Home | null;
      return home;
    } catch {
      return null;
    }
  }
  public static async getHome() {
    if (!navigator.onLine) return cache.get(['home']) as Kora.Home | null;
    const res = await cache.dedupe(['home'], () => this._getHome());
    if (res) {
      cache.set(['home'], res);
    }
    return res;
  }

  public static async _getAnime(id: string): Promise<Kora.Anime | null> {
    try {
      const res = await axios.get(`${url}/anime/${id}`);
      return res.data as Kora.Anime | null;
    } catch {
      return null;
    }
  }
  public static async getAnime(id: string) {
    if (!navigator.onLine) return cache.get(['anime', id]) as Kora.Anime | null;
    const res = await cache.dedupe(['anime', id], () => this._getAnime(id));
    if (res) {
      cache.set(['anime', id], res);
    }
    return res;
  }

  public static async _getSource(id: string, epid: string) {
    try {
      const res = await axios.get(`${url}/anime/${id}/${epid}`);
      const source = res.data as Kora.Source | null;
      return source;
    } catch {
      return null;
    }
  }
  public static async getSource(id: string, epid: string) {
    if (!navigator.onLine) return cache.get(['source', id, epid]) as Kora.Source | null;
    const res = await cache.dedupe(['source', id, epid], () => this._getSource(id, epid));
    if (res) {
      cache.set(['source', id, epid], res);
    }
    return res;
  }

  public static async setEpisodeHistory(
    animeId: string,
    epid: string,
    timestamp: number,
    duration: number
  ): Promise<number> {
    if (!navigator.onLine) return 404;

    try {
      if (!animeId || !epid || timestamp == null || duration == null) {
        return 400;
      }
      const res = await axios.post(
        `${url}/history`,
        {
          animeId,
          epid,
          timestamp,
          duration
        },
        {
          headers: { Authorization: await auth.getHeader() }
        }
      );
      return res.status;
    } catch {
      return 500; // Internal Server Error
    }
  }

  private static async _getHistory() {
    try {
      const res = await axios.get(`${url}/history`, {
        headers: { Authorization: await auth.getHeader() }
      });
      const history = res.data as Kora.History[] | null;
      return history;
    } catch {
      return null;
    }
  }

  public static async getHistory() {
    if (!navigator.onLine) return null;
    const res = await this._getHistory();
    return res;
  }

  private static async _getAllAnimeList() {
    try {
      const res = await axios.get(`${url}/anime`);
      const list = res.data as { id: string; title: string }[] | null;
      if (list) {
        list.sort((a, b) => {
          const normalize = (str: string) => {
            // Replace special characters with '~', but keep numbers and letters
            // We'll use three groups: letters, numbers, then special chars (as '~~')
            return str
              .split('')
              .map((char) => {
                if (/[a-zA-Z]/.test(char)) return 'a' + char.toLowerCase();
                if (/[0-9]/.test(char)) return 'n' + char;
                return 'z~'; // special chars go last
              })
              .join('');
          };
          const aNorm = normalize(a.title);
          const bNorm = normalize(b.title);
          if (aNorm < bNorm) return -1;
          if (aNorm > bNorm) return 1;
          return 0;
        });
      }
      return list;
    } catch {
      return null;
    }
  }

  public static async getAllAnimeList() {
    if (!navigator.onLine) return cache.get(['allAnimeList']) as { id: string; title: string }[] | null;
    const res = await this._getAllAnimeList();
    if (res) {
      cache.set(['allAnimeList'], res);
    }
    return res;
  }
}

export namespace Kora {
  export interface History {
    lastUpdated: string;
    epid: string;
    animeId: string;
    lastTimeStamp: number;
    duration: number;
  }

  export interface Episode {
    id: string;
    epStr: string;
    num: number;
    index: number;
    session: string;
    hiAnimeEpisodeId: string | null;
    title: string | null;
    thumbnail: string | null;
    duration: number | null;
    isFiller: boolean | null;
  }

  export interface Source extends Episode {
    streamUrl: string;
    proxiedStreamUrl: string;
    referer: string | null;
    source: string;
    resolution: number | null;
    intro: {
      start: number | null;
      end: number | null;
    };
    outro: {
      start: number | null;
      end: number | null;
    };
    backup: {
      url: string;
      referer: string;
      subs: string;
    } | null;
  }
  export interface Anime {
    id: string;
    session: string;
    hiAnimeId: string | null;
    malId: number | null;
    anilistId: number | null;
    title: string;
    description: string | null;
    poster: string | null;
    trailer: {
      ytid: string | null;
      thumbnail: string | null;
      url: string | null;
    };
    episodes: Episode[];
    info: {
      titles: {
        english: string;
        romanji: string | null;
        japanese: string | null;
      };
      mediaType: string | null; //TODO: type this.
      source: string | null; //TODO: type this.
      episodes: number;
      studios: string[];
      producers: string[];
      licensors: string[];
      status: string | null; //TODO: type this.
      airing: boolean | null;
      aired: {
        from: string | null;
        to: string | null;
      };
      duration: number | null;
      stats: {
        score: number | null;
        scoredBy: number | null;
        rank: number | null;
        popularity: number | null;
        members: number | null;
        favorites: number | null;
      };
      season: string | null; //TODO: type this.
      year: number | null;
      broadcast: {
        day: string | null;
        time: string | null;
        timezone: string | null;
      };
      genres: string[];
    };
  }

  export type Home = string[];

  export type Immutable = Anime | Source | Home;
  export type Mutable = History;
  export type Any = Immutable | Mutable;
  export type Type = 'anime' | 'source' | 'home' | 'history' | 'allAnimeList';
}

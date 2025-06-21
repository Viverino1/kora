import axios from 'axios';
import { auth } from '../providors/AuthProvidor';
const url = import.meta.env.VITE_KORA_API_BASE_URL;
export class Kora {
  public static async getHome() {
    if (!navigator.onLine) return null;
    try {
      const res = await axios.get(`${url}/home`);
      const home = res.data as Kora.Home | null;
      return home;
    } catch {
      return null;
    }
  }

  public static async getAnime(id: string): Promise<Kora.Anime | null> {
    if (!navigator.onLine) return null;

    const res = await axios.get(`${url}/anime/${id}`);
    return res.data as Kora.Anime | null;
  }

  public static async getSource(id: string, num: string | number) {
    if (!navigator.onLine) return null;
    try {
      const res = await axios.get(`${url}/anime/${id}/${num}`);
      const source = res.data as Kora.Source | null;
      return source;
    } catch {
      return null;
    }
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

  public static async getHistory() {
    if (!navigator.onLine) return null;
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

  export interface Home {
    recent: string[];
  }

  export type Immutable = Anime | Source | Home;
  export type Mutable = History;
  export type Any = Immutable | Mutable;
  export type Type = 'anime' | 'source' | 'home' | 'history';
}

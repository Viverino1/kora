import { useNavigate } from 'react-router-dom';
import { Kora } from '../services/kora';
import React from 'react';
import Button from './Button';
import { LuBookmark } from 'react-icons/lu';
import { PiPlayFill } from 'react-icons/pi';
import { useOnlineStatus } from '../providors/OnlineStatusProvidor';
import { cache } from '../services/cache';
import { getMostRecentlyWatchedEpisode } from '../lib/utils';
function TrailerOrPosterBackground({
  ytid,
  poster,
  disableTrailer = false
}: {
  ytid: string | null;
  poster: string | null;
  disableTrailer?: boolean | null;
}) {
  const blacklist = ['eEApDotghec'];
  const isOnline = useOnlineStatus();
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none">
      <div
        className="fixed top-0 right-0 flex items-center justify-center overflow-clip"
        style={{
          width: 'calc(85vw - 60px)',
          height: 'calc((85vw - 60px)*9/21.2)'
        }}
      >
        {isOnline && !disableTrailer && ytid && !blacklist.includes(ytid) ? (
          <iframe
            src={`https://www.youtube.com/embed/${ytid}?autoplay=1&mute=1&controls=0&showinfo=0&modestbranding=1&rel=0&loop=1&playlist=${ytid}&enablejsapi=1&wmode=opaque`}
            allow="autoplay; fullscreen"
            allowFullScreen
            style={{
              width: '100%',
              aspectRatio: '1'
            }}
          />
        ) : (
          <img
            src={poster ?? undefined}
            alt={'poster'}
            className="w-full h-full object-cover object-[50%_25%] blur-xl"
          />
        )}
        <div className=" absolute top-0 left-0 right-0 bottom-0 w-full h-full bg-gradient-to-r from-background  via-50% via-background/70 to-transparent"></div>
        <div className=" absolute top-0 left-0 right-0 bottom-0 w-full h-full bg-gradient-to-t from-background via-background/50 to-transparent"></div>
      </div>
    </div>
  );
}

export default function AnimeBanner({ anime, children }: { anime: Kora.Anime; children?: React.ReactNode }) {
  const episode = getMostRecentlyWatchedEpisode(anime);

  const navigate = useNavigate();

  React.useEffect(() => {
    if (!episode) return;
    const handleEnter = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'Enter') {
        navigate(`/anime/${anime.id}`);
      } else if (e.key === 'Enter') {
        navigate(`/watch/${anime.id}/${episode.id}`);
      }
    };
    window.addEventListener('keydown', handleEnter);
    return () => window.removeEventListener('keydown', handleEnter);
  }, [episode?.id, navigate]);

  return (
    <div className={`h-full flex flex-col justify-end pb-14 relative w-3/5 transition-all duration-300`}>
      <TrailerOrPosterBackground ytid={anime.trailer.ytid} poster={anime.poster} disableTrailer />
      <div className="z-20">
        <div className="space-x-2 mb-2 flex">
          {anime.info.mediaType && <Button variant="chip">{anime.info.mediaType}</Button>}
          {anime.info.stats.score && <Button variant="chip">MAL: {anime.info.stats.score}</Button>}
          {anime.info.year && (
            <Button variant="chip">
              {anime.info.season && anime.info.season.charAt(0).toUpperCase() + anime.info.season.slice(1) + ' '}
              {anime.info.year}
            </Button>
          )}
          <Button variant="chip">{anime.info.episodes} Episodes</Button>
          {anime.info.status && <Button variant="chip">{anime.info.status}</Button>}
        </div>
        <h1 className="w-full pb-2">{anime.title}</h1>
        <p className="mb-4 line-clamp-3">{anime.description}</p>
        <div className="space-x-2 flex">
          <Button
            variant="primary"
            className={`pl-3 space-x-2`}
            onClick={() => navigate(`/watch/${anime.id}/${episode?.id}`)}
          >
            <PiPlayFill /> <div>{episode ? parsePlayEp(episode) : 'ERROR'}</div>
          </Button>
          {children}
          <Button variant="icon">
            <LuBookmark size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function parsePlayEp(ep: Kora.Episode): string {
  const isBasic = ep.title?.toLocaleLowerCase().includes(`episode ${ep.epStr}`);

  return isBasic ? `Play ${ep.title}` : `Play EP${ep.epStr}: ${ep.title}`;
}

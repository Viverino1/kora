import React from 'react';
import useLoader from '../hooks/useLoader';
import AnimeBanner from '../components/AnimeBanner';
import AnimeCard from '../components/AnimeCard';
import { useNavigate } from 'react-router-dom';
import { PiCardsThree } from 'react-icons/pi';
import Button from '../components/Button';
import { cache } from '../services/cache';
import { getHome, getHomeFromCache } from '../lib/composer';
import { Kora } from '../services/kora';
import { doesHaveHistory } from '../lib/utils';
export default function Home() {
  const [counter, setCounter] = React.useState<number>(0);
  return <HomeContent key={counter} refresh={() => setCounter((prev) => prev + 1)} />;
}

function HomeContent({ refresh }: { refresh: () => void }) {
  const { data: anime, state } = useLoader(['/', 'home'], getHome, getHomeFromCache);
  const [active, setActive] = React.useState<number>(0);

  const navigate = useNavigate();

  const handleClearHistory = async (animeId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    Kora.clearHistory(animeId);
    await cache.delete(['history', animeId]);
    refresh();
  };

  if (state === 'loading') {
    return <div>Loading...</div>;
  }

  if (state === 'error' || !anime) {
    return <div>Error loading data</div>;
  }

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setActive((prev) => (prev + 1) % anime.length);
      } else if (e.key === 'ArrowLeft') {
        setActive((prev) => (prev - 1 + anime.length) % anime.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [anime.length]);

  return (
    <div className="w-full h-full overflow-clip flex flex-col px-14 py-4">
      <AnimeBanner anime={cache.get(['anime', anime[active]])!}>
        <Button onClick={() => navigate(`/anime/${anime[active]}`)} variant="secondary" className="pl-3 space-x-2">
          <PiCardsThree size={18} /> <div>Episodes</div>
        </Button>
      </AnimeBanner>
      <div className="relative">
        <div className="h-fit flex gap-4">
          {anime.map((a, i) => (
            <AnimeCard
              key={a}
              id={a}
              isActive={i == active}
              onClick={() => {
                setActive(i);
              }}
            >
              {doesHaveHistory(a) && <Button onClick={(e) => handleClearHistory(a, e)}>Clear History</Button>}
            </AnimeCard>
          ))}
        </div>
      </div>
    </div>
  );
}

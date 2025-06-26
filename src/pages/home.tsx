import React from 'react';
import useLoader from '../hooks/useLoader';
import AnimeBanner from '../components/AnimeBanner';
import AnimeCard from '../components/AnimeCard';
import { useNavigate } from 'react-router-dom';
import { PiCardsThree } from 'react-icons/pi';
import Button from '../components/Button';
import { cache } from '../services/cache';
import { getHome, getHomeFromCache } from '../lib/composer';
export default function Home() {
  const { data: anime, state } = useLoader(['/', 'home'], getHome, getHomeFromCache);
  const [active, setActive] = React.useState<number>(0);

  const navigate = useNavigate();

  if (state === 'loading') {
    return <div>Loading...</div>;
  }

  if (state === 'error' || !anime) {
    return <div>Error loading data</div>;
  }

  return (
    <div className="w-full h-full overflow-clip flex flex-col px-14 py-4">
      <AnimeBanner anime={cache.get(['anime', anime[active]])!}>
        <Button onClick={() => navigate(`/anime/${anime[active]}`)} variant="secondary" className="pl-3 space-x-2">
          <PiCardsThree size={18} /> <div>Episodes</div>
        </Button>
      </AnimeBanner>
      <div className="relative">
        <div className="w-full flex justify-between items-end pb-2 opacity-0">
          <h3>Continue Watching</h3>
        </div>
        <div className="h-fit flex gap-4">
          {anime.map((a, i) => (
            <AnimeCard
              key={a}
              id={a}
              isActive={i == active}
              onClick={() => {
                setActive(i);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

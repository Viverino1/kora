import React from 'react';
import { cache } from '../services/cache';
import Button from '../components/Button';
import useLoader from '../hooks/useLoader';
import { Kora } from '../services/kora';

export default function Home() {
  const load = async () => {
    const home = await Kora.getHome();
    const promises = home?.map((id) => Kora.getAnime(id)) ?? [];
    const recent = await Promise.all(promises);

    return {
      recent: recent.filter((id) => id !== null),
      continueWatching: []
    };
  };

  const { state, data } = useLoader(['/', 'home'], load);
  return (
    <div className="p-4 gap-4 flex">
      <div>
        {data?.recent.map((anime) => (
          <div key={anime.id}>{anime.title}</div>
        ))}
      </div>
      <Button onClick={cache.clear}>CLEAR</Button>
    </div>
  );
}

import React from 'react';
import { Kora } from '../services/kora';
import useLoader from '../hooks/useLoader';

export default function AnimeCard({
  id,
  isActive,
  onClick
}: {
  id: string;
  isActive: boolean;
  onClick: () => void;
}): React.JSX.Element {
  const { data: anime } = useLoader(['anime', id], () => Kora.getAnime(id));
  return (
    <button
      className={`w-full aspect-[2/3] border transition-all duration-300 rounded-lg overflow-auto group ${
        isActive && '!ring-2'
      } ${anime ? 'opacity-100' : 'opacity-0'}`}
      onClick={() => onClick()}
    >
      {anime && (
        <div className="h-full w-full relative">
          <img src={anime.poster ?? undefined} className="w-full h-full object-cover" alt="" />
          {/* <div
            className="absolute right-0 left-0 bottom-0 h-2 bg-red-500"
            style={{ width: "20%" }}
          ></div> */}
        </div>
      )}
    </button>
  );
}

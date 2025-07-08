import React from 'react';
import { Kora } from '../services/kora';
import useLoader from '../hooks/useLoader';
import Button from './Button';

export default function AnimeCard({
  id,
  isActive,
  onClick,
  children
}: {
  id: string;
  isActive: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}): React.JSX.Element {
  const { data: anime } = useLoader(['anime', id], () => Kora.getAnime(id));
  return (
    <div className=" w-full aspect-[2/3] group">
      <div
        className={`relative w-full h-full border transition-all duration-300 rounded-lg overflow-clip group cursor-pointer ${
          isActive && '!ring-2'
        } ${anime ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => onClick()}
      >
        {anime && (
          <div className="h-full w-full relative">
            <img src={anime.poster ?? undefined} className="w-full h-full object-cover" alt="" />
            {/* <div className="absolute right-0 left-0 bottom-0 h-2 bg-red-500" style={{ width: '20%' }}></div> */}
          </div>
        )}
        <div className="absolute flex flex-col justify-between text-left px-4 py-3 inset-0 z-30 w-full h-full transition-all duration-300 group-hover:opacity-100 opacity-0 bg-background/50 backdrop-blur-md">
          <h3>{anime?.title}</h3>
          <div className="w-full flex flex-col gap-2 pb-1" onClick={(e) => e.stopPropagation()}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

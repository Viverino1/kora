import { Navigate, useNavigate, useParams } from 'react-router-dom';
import useLoader from '../hooks/useLoader';
import { useState } from 'react';
import React from 'react';
import { Kora } from '../services/kora';

import { LuChevronLeft, LuChevronRight, LuChevronsLeft, LuChevronsRight, LuX } from 'react-icons/lu';
import AnimeBanner from '../components/AnimeBanner';
import { paginate } from '../lib/utils';
import Button from '../components/Button';
import { useEffect } from 'react';

const PAGE_SIZE = 8;

export default function Anime() {
  const { id } = useParams<{ id: string; episode: string }>();
  if (!id) return <Navigate to="/" />;
  const { data: anime, state } = useLoader(['anime', id], () => Kora.getAnime(id));
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();

  if (state === 'loading') {
    return <div>Loading...</div>;
  }

  if (state === 'error' || !anime) {
    return <div>Error loading anime</div>;
  }

  const pages = paginate(anime.episodes, PAGE_SIZE);

  return (
    <div className="w-full h-full overflow-clip flex flex-col px-14 py-4 pb-0">
      <button className="absolute top-14 right-14 z-30 rounded-full text-text-light" onClick={() => navigate('/')}>
        <LuX size={30} />
      </button>
      <AnimeBanner anime={anime} />
      <div className="h-fit z-10 grid grid-cols-4 grid-rows-2 gap-4">
        {pages[currentPage - 1].map((e) => (
          <button
            key={e.id}
            className="rounded-lg overflow-clip relative border"
            onClick={() => navigate(`/watch/${anime.id}/${e.id}`)}
          >
            <img className="aspect-[16/9] object-cover" alt={e.title ?? undefined} src={e.thumbnail ?? undefined}></img>
            <div className="absolute inset-0">
              <div className="h-full w-full bg-gradient-to-b from-transparent from-50% to-background/75"></div>
            </div>
            <div className="absolute inset-0 h-full w-full flex flex-col justify-end text-start px-4 py-2">
              <p className="text-sm h-4 flex items-center text-text-light">{e.duration}m</p>
              <h3 className="!text-sm line-clamp-1">
                EP{e.epStr}: {e.title}
              </h3>
            </div>
          </button>
        ))}
      </div>
      <div className="flex-shrink-0 py-4 flex items-center justify-center gap-2">
        <Button disabled={currentPage === 1} variant="square" onClick={() => setCurrentPage(1)}>
          <LuChevronsLeft size={20} />
        </Button>
        <Button
          disabled={currentPage === 1}
          variant="square"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        >
          <LuChevronLeft size={20} />
        </Button>
        <Button disabled variant="square" className="disabled:!opacity-100 w-16 text-sm px-2">
          {currentPage} / {pages.length}
        </Button>
        <Button
          disabled={currentPage === pages.length}
          variant="square"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pages.length))}
        >
          <LuChevronRight size={20} />
        </Button>
        <Button disabled={currentPage === pages.length} variant="square" onClick={() => setCurrentPage(pages.length)}>
          <LuChevronsRight size={20} />
        </Button>
      </div>
    </div>
  );
}

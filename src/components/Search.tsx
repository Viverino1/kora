import React, { useEffect } from 'react';
import { LuSearch } from 'react-icons/lu';
import useLoader from '../hooks/useLoader';
import { Kora } from '../services/kora';
import { useNavigate } from 'react-router-dom';
import { cache } from '../services/cache';
import { stop } from '../lib/utils';
import { useSearch } from '../providors/SearchProvidor';

const RESULTS_LIMIT = 12;
const SHOW_LIMIT = 6;

export default function Search() {
  const [query, setQuery] = React.useState('');
  const data = React.useMemo(() => cache.get(['allAnimeList']) as { id: string; title: string }[] | null, []);
  const [results, setResults] = React.useState<{ id: string; title: string }[]>(
    data ? data.slice(0, RESULTS_LIMIT) : []
  );
  const navigate = useNavigate();

  const { isSearchVisible: show, setSearchVisible: setShow, toggleSearch } = useSearch();

  const handleSelect = (id: string) => {
    navigate(`/anime/${id}`);
    setShow(false);
  };

  const [active, setActive] = React.useState<number>(0);
  const resultsRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data) {
      if (query.length > 0) {
        const filtered = data.filter((a) => a.title.toLowerCase().includes(query.toLowerCase()));
        setResults(filtered.splice(0, RESULTS_LIMIT));
      } else {
        setResults(data.slice(0, RESULTS_LIMIT));
      }
    }
  }, [query, data]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'tab') {
        stop(e);
        toggleSearch();
        return;
      }

      // Only handle other keys when search modal is visible
      if (!show) return;

      if (e.key === 'Enter' && results.length > 0) {
        stop(e);
        const selectedResult = results[active];
        if (selectedResult) {
          handleSelect(selectedResult.id);
        }
        return;
      }

      if (results.length <= 0) return;
      if (e.key === 'ArrowDown') {
        stop(e);
        setActive((prev) => (prev + 1) % results.length);
      }
      if (e.key === 'ArrowUp') {
        stop(e);
        setActive((prev) => (prev - 1 + results.length) % results.length);
      }
      if (e.key === 'Escape') {
        stop(e);
        setShow(false);
      }
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [show, results, active, navigate, toggleSearch, setShow]);

  // Focus input and insert key if not focused
  useEffect(() => {
    const focusHandler = (e: KeyboardEvent) => {
      const input = inputRef.current;
      if (!input) return;
      const isInputFocused = document.activeElement === input;
      // Only focus for printable characters or Backspace
      if (!isInputFocused && ((e.key.length === 1 && !e.ctrlKey && !e.metaKey) || e.key === 'Backspace')) {
        input.focus();
        // Insert the key if it's a character
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          // Insert at cursor position
          const start = input.selectionStart || 0;
          const end = input.selectionEnd || 0;
          const newValue = input.value.slice(0, start) + e.key + input.value.slice(end);
          input.value = newValue;
          setQuery(newValue);
          // Move cursor after inserted character
          setTimeout(() => {
            input.setSelectionRange(start + 1, start + 1);
          }, 0);
          stop(e);
        }
        if (e.key === 'Backspace') {
          const start = input.selectionStart || 0;
          const end = input.selectionEnd || 0;
          let newValue;
          let newPos;
          if (start === end && start > 0) {
            newValue = input.value.slice(0, start - 1) + input.value.slice(end);
            newPos = start - 1;
          } else {
            newValue = input.value.slice(0, start) + input.value.slice(end);
            newPos = start;
          }
          input.value = newValue;
          setQuery(newValue);
          setTimeout(() => {
            input.setSelectionRange(newPos, newPos);
          }, 0);
          stop(e);
        }
      }
    };
    window.addEventListener('keydown', focusHandler, true);
    return () => window.removeEventListener('keydown', focusHandler, true);
  }, []);

  // Scroll active result into view with offset
  useEffect(() => {
    const activeEl = resultsRefs.current[active];
    if (activeEl) {
      const parent = activeEl.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        const elRect = activeEl.getBoundingClientRect();
        const offset = 8; // px space above and below
        if (elRect.top < parentRect.top + offset) {
          parent.scrollTop -= parentRect.top + offset - elRect.top;
        } else if (elRect.bottom > parentRect.bottom - offset) {
          parent.scrollTop += elRect.bottom - (parentRect.bottom - offset);
        }
      }
    }
  }, [active, results]);

  return (
    <div
      onClick={() => setShow(false)}
      className={`absolute -translate-y-3 inset-0 w-screen h-screen flex flex-col items-center justify-center ${
        show ? 'opacity-100' : 'opacity-0 pointer-events-none'
      } transition-all duration-300 z-50 bg-background/50 backdrop-blur-md`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`border w-[600px] rounded-xl bg-card/50 backdrop-blur-xl overflow-clip ${
          show ? 'scale-100' : 'scale-95'
        } transition-all duration-300`}
      >
        <div className="flex items-center border-b">
          <LuSearch
            size={20}
            className={`m-3 mr-2.5 transition-all duration-300 ${query ? 'text-text' : 'text-text/65'}`}
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search for anime by title..."
            className=" w-full h-full focus:ring-0 bg-transparent placeholder:text-text/65"
          ></input>
        </div>
        <div
          className="p-2 flex flex-col gap-2 overflow-y-auto"
          style={{ maxHeight: `calc(2.5rem * ${SHOW_LIMIT} + 0.5rem * 4)` }} // 2.5rem per item + 0.5rem gap between 5 items
        >
          {results.length === 0 ? (
            <div className={`px-2 py-1 rounded-md text-left`}>
              <p className="line-clamp-1">No results found.</p>
            </div>
          ) : (
            results.map((item, i) => (
              <SearchResult
                key={item.id}
                id={item.id}
                title={item.title}
                isActive={i == active}
                onSelect={handleSelect}
                ref={(el) => (resultsRefs.current[i] = el)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Update SearchResult to forward ref and handle clicks
const SearchResult = React.forwardRef<
  HTMLButtonElement,
  { id: string; title: string; isActive: boolean; onSelect: (id: string) => void }
>(({ id, title, isActive, onSelect }, ref) => {
  return (
    <button
      ref={ref}
      className={`px-2 py-1 rounded-md text-left focus:ring-0 ${isActive ? 'bg-card/75' : ''}`}
      onClick={() => onSelect(id)}
    >
      <p className="line-clamp-1">{title}</p>
    </button>
  );
});

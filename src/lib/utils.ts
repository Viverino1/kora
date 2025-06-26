import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function paginate<T>(items: T[], pageSize: number) {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += pageSize) {
    pages.push(items.slice(i, i + pageSize));
  }
  return pages;
}

export function mergeStates(...states: State[]): State {
  if (states.includes('loading')) return 'loading';
  if (states.includes('error')) return 'error';
  if (states.every((s) => s === 'success')) return 'success';
  return 'loading';
}

export function stop(e?: React.SyntheticEvent | KeyboardEvent) {
  e?.stopPropagation();
  e?.preventDefault();
}

export const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

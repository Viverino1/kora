import { useEffect, useState } from 'react';
import { cache } from '../services/cache';
import React from 'react';
import { Kora } from '../services/kora';

type EpisodeThumbnailProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  url: string | undefined;
};

export default function EpisodeThumbnail({ url, ...imgProps }: EpisodeThumbnailProps) {
  const params = url && (Object.fromEntries(new URL(url).searchParams.entries()) as any);
  const id = params?.id;
  const epid = params?.epid;

  const [src, setSrc] = useState<string | null>(cache.get(['image', id, epid]) ?? null);

  useEffect(() => {
    if (!src && url) {
      Kora.getImage(url, id, epid).then((image) => {
        setSrc(image);
      });
    }
  }, [url]);

  return (
    <div className="relative z-0">
      <img src={src ?? undefined} alt="image" {...imgProps} />
      {!src && <div className="absolute z-10 inset-0 bg-background"></div>}
      <div className={`transition-all duration-300 ${src || !url ? 'opacity-0' : 'opacity-100'}`}>
        <div className="absolute z-20 inset-0 bg-card/50 animate-pulse"></div>
      </div>
    </div>
  );
}

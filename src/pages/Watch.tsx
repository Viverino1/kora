import { Navigate, useNavigate, useParams } from 'react-router-dom';
import useLoader from '../hooks/useLoader';
import { Kora } from '../services/kora';
import React, { useEffect, useRef, useState } from 'react';
import { TbRewindBackward10, TbRewindForward10 } from 'react-icons/tb';
import { IoArrowBack, IoPlay } from 'react-icons/io5';
import { PiPauseFill } from 'react-icons/pi';
import { LuLoader, LuPictureInPicture, LuVolume, LuVolume1, LuVolume2, LuVolumeOff } from 'react-icons/lu';

// @ts-ignore shaka player is not typed, so we need to ignore it
import shaka from 'shaka-player/dist/shaka-player.ui';
import { formatTime, stop } from '../lib/utils';
import { cache } from '../services/cache';
import Button from '../components/Button';
import EpisodeThumbnail from '../components/EpisodeThumbnail';

const SEEK_LENGTH = 10; // seconds
const CONTROLS_TIMEOUT = 5000; // milliseconds

const shakaConfig = {
  streaming: {
    bufferingGoal: 60 * 60, // Buffer 60 minutes ahead (default is 10)
    bufferBehind: 60 * 60, // Keep 60 minutes of content behind current position (default is 30)
  },
  // Optional: Increase retry attempts for failed segments
  manifest: {
    retryParameters: {
      maxAttempts: 5, // Retry failed segments up to 5 times
      baseDelay: 1000, // Start with 1 second delay
      backoffFactor: 2, // Double delay each retry
      fuzzFactor: 0.5, // Add randomness to prevent thundering herd
      timeout: 30000 // 30 second timeout per attempt
    }
  }
}

function Gradient({ shouldShowControls }: { shouldShowControls: boolean }) {
  return (
    <div
      className={`z-10 pointer-events-none select-none absolute inset-0 h-full w-full flex flex-col justify-between transition-all duration-300 ${shouldShowControls ? 'opacity-100' : 'opacity-0'
        }`}
    >
      <div className=" bg-gradient-to-t from-background/30 to-background/90 h-64 w-full flex flex-col justify-end"></div>
      <div className="h-full w-full bg-background/30"></div>
      <div className=" bg-gradient-to-b from-background/30 to-background/90 h-64 w-full flex flex-col justify-end"></div>
    </div>
  );
}

export default function Watch() {
  const { id, epid } = useParams<{ id: string; epid: string }>();
  if (!id || !epid) return <Navigate to="/" />;

  const wasFullscreenRef = useRef(false);

  useEffect(() => {
    const handleEnterFullscreen = async () => {
      const isFullscreen = await window.api.isFullscreen();
      wasFullscreenRef.current = isFullscreen;
      if (!isFullscreen) {
        window.api.setFullscreen(true);
      }
    };
    handleEnterFullscreen();

    return () => {
      if (wasFullscreenRef.current == false) {
        window.api.setFullscreen(false);
      }
    };
  }, []);

  return <WatchContent key={id + epid} id={id} epid={epid} />;
}

function WatchContent({ id, epid }: { id: string; epid: string }) {
  const navigate = useNavigate();

  const { data: anime } = useLoader(['anime', id], () => Kora.getAnime(id));
  const { data: episode } = useLoader(['source', id, epid], () => Kora.getSource(id, epid));
  const [playerState, setPlayerState] = useState<State>('loading');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<shaka.Player | null>(null);

  const nextVideoRef = useRef<HTMLVideoElement | null>(null);
  const nextPlayerRef = useRef<shaka.Player | null>(null);

  const startingHistory = useRef(cache.get<Kora.History>(['history', id, epid]));

  const updateHistory = () => {
    const cached = cache.get<Kora.History>(['history', id, epid]);
    cached && Kora.setEpisodeHistory(id, epid, cached.lastTimeStamp, cached.duration);
  };

  useEffect(() => {
    (async () => {
      if (anime && episode && playerState === "success" && videoRef.current) {
        const nextEp = anime && anime.episodes.length > episode.index + 1 ? anime.episodes[episode.index + 1] : null;
        if (nextEp) {
          const nextEpisode = cache.get<Kora.Source>(['source', id, nextEp.id]) || await Kora.getSource(id, nextEp.id);
          if (nextEpisode && nextEpisode.proxiedStreamUrl) {
            nextPlayerRef.current = new shaka.Player();
            nextPlayerRef.current.attach(nextVideoRef.current);
            nextPlayerRef.current.configure(shakaConfig);

            await nextPlayerRef.current
              .load(nextEpisode?.proxiedStreamUrl)
          }
        }
      }
    })();
  }, [anime, episode, playerState]);

  useEffect(() => {
    if (videoRef.current && episode?.proxiedStreamUrl) {
      playerRef.current = new shaka.Player();
      playerRef.current.attach(videoRef.current);
      playerRef.current.configure(shakaConfig);

      playerRef.current
        .load(episode?.proxiedStreamUrl)
        .then(() => {
          const cached = startingHistory.current;
          if (cached && cached.lastTimeStamp < videoRef.current!.duration) {
            videoRef.current!.currentTime = cached.lastTimeStamp;
          }
          videoRef.current
            ?.play()
            .then(() => {
              setPlayerState('success');
              setIsPlaying(true);
              hideControls();
            })
            .catch((err) => {
              setPlayerState('error');
              setIsPlaying(false);
              showControls();
              console.error('Failed to play video:', err);
            });
        })
        .catch((err: any) => {
          if (err.code !== 7002) {
            console.error('reloading player due to error:', err);
          }
        });
    }
  }, [episode?.proxiedStreamUrl]);

  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      updateHistory();
    };
  }, []);

  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const [shouldShowControls, setShouldShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const showControls = () => {
    setShouldShowControls(true);
    document.body.style.cursor = 'default';
  };

  const hideControls = () => {
    if (!videoRef.current?.paused) {
      setShouldShowControls(false);
      document.body.style.cursor = 'none';
    }
  };

  async function handlePlayPause(e?: React.SyntheticEvent) {
    stop(e);
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      await videoRef.current.play();
      setIsPlaying(true);
      hideControls();
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      showControls();
    }
    updateHistory();
  }

  function handleSeekBackward(e?: React.SyntheticEvent) {
    stop(e);
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(videoRef.current.currentTime - SEEK_LENGTH, 0);
  }

  function handleSeekForward(e?: React.SyntheticEvent) {
    stop(e);
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(videoRef.current.currentTime + SEEK_LENGTH, videoRef.current.duration);
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    stop(e);
    if (e.code === 'Space') {
      handlePlayPause();
    } else if (e.code === 'Escape') {
      navigate(`/anime/${id}`);
    } else if (e.code === 'ArrowLeft') {
      handleSeekBackward();
    } else if (e.code === 'ArrowRight') {
      handleSeekForward();
    }
  };

  const resetTimeout = () => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    timeoutId.current = null;
  };
  const handleMouseMove = () => {
    console.log('Mouse moved');
    showControls();
    if (!videoRef.current) return;
    if (!timeoutId.current && !videoRef.current.paused) {
      timeoutId.current = setTimeout(() => {
        hideControls();
        resetTimeout();
      }, CONTROLS_TIMEOUT);
    }
  };

  useEffect(() => {
    timeoutId.current = setTimeout(() => {
      hideControls();
      resetTimeout();
    }, CONTROLS_TIMEOUT);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);

      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
        timeoutId.current = null;
      }
      document.body.style.cursor = 'default';
    };
  }, []);

  return (
    <div onClick={handlePlayPause} className="h-screen w-screen select-none">
      <video autoPlay ref={videoRef} className="w-screen h-screen z-0"></video>
      <video muted ref={nextVideoRef} className="w-[50vw] h-[50vh] absolute top-0 left-0 z-50 pointer-events-none opacity-0"></video>

      <Gradient shouldShowControls={shouldShowControls} />

      <div className={`absolute inset-0 z-20 w-full h-full overflow-clip flex items-center justify-center`}>
        <div className="flex gap-12 items-center justify-center">
          <button
            disabled={playerState !== 'success'}
            onClick={handleSeekBackward}
            className={`disabled:opacity-50 text-primary/80 border border-primary/50 rounded-full p-3 bg-primary/10 backdrop-blur-lg focus:!ring-0 transition-all duration-300 ${shouldShowControls ? 'opacity-100' : 'opacity-0'
              }`}
          >
            <TbRewindBackward10 className="w-8 h-8" />
          </button>
          <button
            disabled={playerState !== 'success'}
            onClick={handlePlayPause}
            className={`disabled:opacity-50 text-primary/80 border border-primary/50 rounded-full p-5 bg-primary/10 backdrop-blur-lg focus:!ring-0 transition-all duration-300 ${shouldShowControls ? 'opacity-100' : 'opacity-0'
              }`}
          >
            {playerState !== 'success' ? (
              <LuLoader className="w-16 h-16 animate-spin" style={{ animationDuration: '2s' }} />
            ) : isPlaying ? (
              <PiPauseFill className="w-16 h-16" />
            ) : (
              <IoPlay className="w-16 h-16 translate-x-[3px]" />
            )}
          </button>
          <button
            disabled={playerState !== 'success'}
            onClick={handleSeekForward}
            className={`disabled:opacity-50 text-primary/80 border border-primary/50 rounded-full p-3 bg-primary/10 backdrop-blur-lg focus:!ring-0 transition-all duration-300 ${shouldShowControls ? 'opacity-100' : 'opacity-0'
              }`}
          >
            <TbRewindForward10 className="w-8 h-8" />
          </button>
        </div>
      </div>

      <div
        className={`absolute inset-0 z-20 w-full h-full overflow-clip flex items-center justify-center select-none pointer-events-none`}
      >
        {anime && <Episodes shouldShowControls={shouldShowControls} anime={anime} epid={epid} />}
        <div className="absolute bottom-14 right-14 left-14 z-20">
          <div className={`transition-all duration-300 ${shouldShowControls ? 'opacity-100' : 'opacity-0'}`}>
            <h1 className="pb-1 !text-4xl">{episode?.title}</h1>
            <p className="pb-8">{anime?.title}</p>
          </div>
          <div className="items-center h-0 justify-center flex z-50">
            <Seekbar
              startingHistory={startingHistory.current}
              video={videoRef.current}
              anime={anime}
              episode={episode}
              shouldShowControls={shouldShowControls}
            />
            <div className={`flex transition-all duration-300 ${shouldShowControls ? 'opacity-100' : 'opacity-0'}`}>
              {videoRef.current && <Volume video={videoRef.current} />}
              {videoRef.current && <PictureInPicture video={videoRef.current} />}

              {videoRef.current && <Speed video={videoRef.current} />}
            </div>
          </div>
        </div>
        <button
          className={`absolute top-14 left-14 z-30 rounded-full focus:!ring-0 transition-all duration-300 pointer-events-auto ${shouldShowControls ? 'opacity-100' : 'opacity-0'
            }`}
          onClick={(e) => {
            stop(e);
            navigate(`/anime/${id}`);
          }}
        >
          <IoArrowBack size={30} />
        </button>
      </div>
    </div>
  );
}

function Episodes({
  anime,
  epid,
  shouldShowControls
}: {
  anime: Kora.Anime;
  epid: string;
  shouldShowControls: boolean;
}) {
  const navigate = useNavigate();
  const episode = anime.episodes.find((ep) => ep.id === epid)!;

  const eps = Array.from({ length: 5 }, (_, i) => {
    const index = episode.index + i - 2;
    return anime.episodes[index] ?? (null as Kora.Episode | null);
  });
  return (
    <div
      className={`absolute right-14 top-14 bottom-14 w-96 flex flex-col items-end justify-center translate-x-1/2 pointer-events-none transition-all duration-300 ${shouldShowControls ? 'opacity-100' : 'opacity-0'
        }`}
    >
      {eps.map((ep, i, arr) => {
        const dist = Math.abs(2 - i);
        const middle = parseInt((arr.length / 2).toString());
        return (
          <button
            key={i}
            className={`focus:!ring-0 pointer-events-auto flex flex-col flex-shrink-0 relative h-[20vh] aspect-video rounded-2xl shadow-2xl backdrop-blur-lg overflow-clip border-primary/50 border ${ep == null && 'opacity-0 !cursor-default'
              } ${i == middle && '!border-primary border-2'}`}
            onClick={(e) => {
              if (ep == null) return;
              e?.stopPropagation();
              e?.preventDefault();
              const url = `/watch/${anime.id}/${ep.id}`;
              navigate(url);
            }}
            style={{
              transform: `translateY(${Math.pow(dist, 1.5) * 40 * (middle > i ? 1 : -1)}%) translateX(${-50}%)`,
              zIndex: 2 - dist,
              scale: `${1 - dist * 0.15}`
            }}
          >
            <EpisodeThumbnail url={ep?.thumbnail ?? undefined} alt="" />
            <div className="w-full h-full absolute inset-0 bg-gradient-to-b from-transparent to-background/80 flex flex-col justify-end items-start p-4">
              <div className="flex items-center justify-start gap-[0.5vh] text-primary">
                <span className="!text-[1.25vh]">{ep?.duration}m</span>
                <span className="!text-[1.25vh]">-</span>
                <span className="!text-[1.25vh]">{ep?.isFiller ? 'Filler' : 'Not Filler'}</span>
              </div>
              <h1 className="!text-[2vh]">Episode {ep?.epStr}</h1>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function PictureInPicture({ video }: { video: HTMLVideoElement }) {
  const triggerPIP = (e?: React.SyntheticEvent) => {
    stop(e);
    try {
      if (!document.pictureInPictureEnabled) {
        console.error('Picture-in-Picture is not available in this browser');
        return;
      }

      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
      } else {
        video.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PiP failed:', error);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key.toLowerCase() === 'p') {
      triggerPIP();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <button
      onClick={triggerPIP}
      className="w-8 aspect-square flex items-center justify-center rounded-full focus:!ring-0 translate-y-[1px] opacity-90 cursor-pointer pointer-events-auto"
    >
      <LuPictureInPicture size={20} />
    </button>
  );
}

function Speed({ video }: { video: HTMLVideoElement }) {
  const [showSlider, setShowSlider] = useState(false);
  const [speed, setSpeed] = useState(video.playbackRate || 1);

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    stop(e);
    updateSpeed(parseFloat(e.target.value));
  };

  const updateSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
    video.playbackRate = newSpeed;
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key.toLowerCase() === 's') {
      e.preventDefault();
      setShowSlider((prev) => !prev);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <button
      onClick={(e) => {
        stop(e);
        setShowSlider((prev) => !prev);
      }}
      className="relative w-10 aspect-square flex items-center justify-center rounded-full focus:!ring-0 pointer-events-auto"
    >
      <div className="h-full flex items-center justify-center font-bold">{speed.toFixed(1)}x</div>
      {showSlider && (
        <div className="absolute aspect-square flex items-center justify-center -translate-y-1/2 p-4">
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={speed}
            onClick={(e) => {
              e?.stopPropagation();
              e?.preventDefault();
            }}
            onChange={handleSpeedChange}
            className="-rotate-90 w-16 focus:!ring-0 -translate-x-[1px]"
          />
        </div>
      )}
    </button>
  );
}

function Volume({ video }: { video: HTMLVideoElement }) {
  const [showSlider, setShowSlider] = useState(false);
  const [volume, setVolume] = useState(video.volume || 1);
  const volumeRef = useRef(volume);

  // Keep the ref in sync with state
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    stop(e);
    updateVolume(parseFloat(e.target.value));
  };

  const updateVolume = (newVolume: number) => {
    setVolume(newVolume);
    video.volume = newVolume;
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    let newVolume = volumeRef.current;
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      newVolume = Math.min(newVolume + 0.1, 1);
      updateVolume(newVolume);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      newVolume = Math.max(newVolume - 0.1, 0);
      updateVolume(newVolume);
    } else if (e.key.toLowerCase() === 'm') {
      e.preventDefault();
      updateVolume(newVolume === 0 ? 1 : 0);
    } else if (e.key.toLowerCase() === 'v') {
      e.preventDefault();
      setShowSlider((prev) => !prev);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <button
      onClick={(e) => {
        stop(e);
        setShowSlider((prev) => !prev);
      }}
      className="relative w-8 aspect-square flex items-center justify-center rounded-full focus:!ring-0 pointer-events-auto"
    >
      <div>
        {volume <= 0 ? (
          <LuVolumeOff size={20} />
        ) : volume <= 0.3 ? (
          <LuVolume size={20} />
        ) : volume <= 0.7 ? (
          <LuVolume1 size={20} />
        ) : (
          <LuVolume2 size={20} />
        )}
      </div>
      {showSlider && (
        <div className="absolute aspect-square flex items-center justify-center -translate-y-1/2 p-4">
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={volume}
            onClick={(e) => {
              e?.stopPropagation();
              e?.preventDefault();
            }}
            onChange={handleVolumeChange}
            className="-rotate-90 w-16 focus:!ring-0 -translate-x-[1px]"
          />
        </div>
      )}
    </button>
  );
}

const AUTO_SKIP_INTRO = true;
const AUTO_SKIP_OUTRO = true;
const COUNTDOWN_LENGTH = 5;

function Seekbar({
  video,
  episode,
  anime,
  startingHistory,
  shouldShowControls
}: {
  video: HTMLVideoElement | null;
  episode: Kora.Source | null;
  anime: Kora.Anime | null;
  startingHistory: Kora.History | null;
  shouldShowControls: boolean;
}) {
  const navigate = useNavigate();
  const seekBarRef = useRef<HTMLDivElement | null>(null);

  const wasPlaying = useRef(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [bufferedTime, setBufferedTime] = useState(0);

  const getTimeFromPosition = (clientX: number) => {
    if (!video) return 0;
    if (!seekBarRef.current) return 0;
    const rect = seekBarRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const percent = x / rect.width;
    return percent * video.duration;
  };

  function handleSeekBarClick(e: React.MouseEvent<HTMLDivElement>) {
    stop(e);
    if (!video) return;
    const newTime = getTimeFromPosition(e.clientX);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  }

  function handleDragStart(e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) {
    if (!video) return;
    stop(e);
    let clientX;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      window.addEventListener('touchmove', handleDragMove as any);
      window.addEventListener('touchend', handleDragEnd as any);
    } else {
      clientX = e.clientX;
      window.addEventListener('mousemove', handleDragMove as any);
      window.addEventListener('mouseup', handleDragEnd as any);
    }
    const newTime = getTimeFromPosition(clientX);
    setCurrentTime(newTime);
    wasPlaying.current = !video.paused;
    video.pause();
    video.currentTime = newTime;
    document.body.style.userSelect = 'none';
  }

  function handleDragMove(e: MouseEvent | TouchEvent) {
    if (!video) return;
    let clientX;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
    } else if ('clientX' in e) {
      clientX = e.clientX;
    } else {
      return;
    }
    const newTime = getTimeFromPosition(clientX);
    setCurrentTime(newTime);
    video.currentTime = newTime;
  }

  function handleDragEnd(e: MouseEvent | TouchEvent) {
    if (!video) return;
    document.body.style.userSelect = '';
    if ('touches' in e) {
      window.removeEventListener('touchmove', handleDragMove as any);
      window.removeEventListener('touchend', handleDragEnd as any);
    } else {
      window.removeEventListener('mousemove', handleDragMove as any);
      window.removeEventListener('mouseup', handleDragEnd as any);
    }
    // Resume playback if it was playing before drag
    if (wasPlaying.current) {
      video.play();
    }
  }

  useEffect(() => {
    if (!video) return;
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleProgressUpdate = () => {
      const bufferedRanges = video.buffered;
      if (bufferedRanges.length > 0) {
        setBufferedTime(bufferedRanges.end(bufferedRanges.length - 1));
      } else {
        setBufferedTime(0);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('progress', handleProgressUpdate);

    // Initial setup
    setCurrentTime(video.currentTime);
    handleProgressUpdate();

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('progress', handleProgressUpdate);
      window.removeEventListener('mousemove', handleDragMove as any);
      window.removeEventListener('mouseup', handleDragEnd as any);
      window.removeEventListener('touchmove', handleDragMove as any);
      window.removeEventListener('touchend', handleDragEnd as any);
    };
  }, [video]);

  const [introCountdown, setIntroCountdown] = useState<number | null>(null);
  const [outroCountdown, setOutroCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (anime && episode && video) {
      cache.set<Kora.History>(['history', anime.id, episode.id], {
        animeId: anime.id,
        epid: episode.id,
        lastTimeStamp: currentTime,
        duration: video.duration,
        lastUpdated: new Date().toISOString()
      });
    }

    const getCountdown = (type: 'intro' | 'outro') => {
      if (!video || !episode || !episode[type].start || !episode[type].end) return null;
      if (currentTime < episode[type].start - COUNTDOWN_LENGTH || currentTime > episode[type].end) return null;
      const targetTime = episode[type].start;
      const remainingTime = (targetTime - currentTime).toFixed(0);
      return parseInt(remainingTime);
    };

    const introCountdownValue = getCountdown('intro');
    setIntroCountdown(introCountdownValue !== null ? introCountdownValue + 5 : null);
    const outroCountdownValue = getCountdown('outro');
    setOutroCountdown(outroCountdownValue !== null ? outroCountdownValue + 5 : null);
  }, [currentTime]);

  return (
    <>
      <div className={`absolute right-0 bottom-6`}>
        <SkipButton
          autoSkip={AUTO_SKIP_INTRO}
          countdown={introCountdown}
          onSkip={() => {
            if (video && episode && episode.intro && episode.intro.end) {
              video.currentTime = episode.intro.end;
            }
          }}
          hasSkippedProp={
            startingHistory &&
              episode &&
              episode.intro &&
              episode.intro.start &&
              startingHistory.lastTimeStamp >= episode.intro.start
              ? true
              : false
          }
        >
          Skip Intro
        </SkipButton>
      </div>
      <div className="absolute right-0 bottom-6">
        <SkipButton
          autoSkip={AUTO_SKIP_OUTRO}
          countdown={outroCountdown}
          onSkip={() => {
            if (anime && episode) {
              const nextEp = anime.episodes[episode.index + 1];
              nextEp && navigate(`/watch/${anime.id}/${nextEp.id}`);
            }
          }}
          hasSkippedProp={
            startingHistory &&
              episode &&
              episode.outro &&
              episode.outro.start &&
              startingHistory.lastTimeStamp >= episode.outro.start
              ? true
              : false
          }
        >
          Next Episode
        </SkipButton>
      </div>
      <div
        ref={seekBarRef}
        onClick={handleSeekBarClick}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        className={`w-full h-8 flex items-center justify-center pointer-events-auto cursor-pointer transition-all duration-300 ${shouldShowControls ? 'opacity-100' : 'opacity-0'
          }`}
      >
        <div className="h-2 w-full backdrop-blur-lg bg-primary/10 rounded-full border border-primary/20">
          <div
            style={{ width: !video ? 0 : `${(bufferedTime / video.duration) * 100}%` }}
            className="absolute w-1/2 h-full bg-primary/20 rounded-full"
          ></div>
          <div
            style={{ width: !video ? 0 : `${(currentTime / video.duration) * 100}%` }}
            className="absolute h-full bg-primary/80 rounded-full"
          ></div>
        </div>
      </div>
      <div
        className={`flex translate-x-1.5 transition-all duration-300 ${shouldShowControls ? 'opacity-100' : 'opacity-0'
          }`}
      >
        <div className="flex items-center justify-center w-14 pr-1 text-sm !font-mono">
          {video && video.duration && currentTime ? formatTime(video.duration - currentTime) : 'XX:XX'}
        </div>
      </div>
    </>
  );
}

function SkipButton({
  countdown,
  autoSkip,
  onSkip,
  hasSkippedProp = false,
  children
}: {
  countdown: number | null;
  autoSkip: boolean;
  onSkip?: () => void;
  hasSkippedProp?: boolean;
  children: React.ReactNode;
}) {
  const hasSkipped = useRef<boolean>(hasSkippedProp);
  useEffect(() => {
    hasSkipped.current = hasSkippedProp;
  }, [hasSkippedProp]);

  if (autoSkip && countdown && countdown < 0 && !hasSkipped.current) {
    onSkip?.();
    hasSkipped.current = true;
  }
  return (
    <Button
      onClick={(e) => {
        stop(e);
        onSkip?.();
        hasSkipped.current = true;
      }}
      className={`${countdown && countdown <= COUNTDOWN_LENGTH ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        } transition-all duration-300`}
    >
      {children} {autoSkip && countdown && countdown >= 0 ? `(${countdown}s)` : ''}
    </Button>
  );
}

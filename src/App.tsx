import React, { useEffect } from 'react';
import { Navigate, Route, HashRouter as Router, Routes } from 'react-router-dom';
import { useAuth } from './providors/AuthProvidor';
import Auth from './pages/Auth';
import { cache } from './services/cache';
import SideBar from './components/SideBar';
import Anime from './pages/Anime';
import Settings from './pages/Settings';
import { getHome, mergeWatchHistory } from './lib/composer';
import Watch from './pages/Watch';
import { Kora } from './services/kora';
import Home from './pages/home';
function App() {
  const { user, state: authState } = useAuth();
  const [state, setState] = React.useState<State>('loading');

  const [loadingMessage, setLoadingMessage] = React.useState<string>('Loading...');
  const [loadingProgress, setLoadingProgress] = React.useState<number>(0);

  useEffect(() => {
    setState('loading');
    setLoadingMessage('Loading auth...');
    setLoadingProgress(0);

    const loadApp = async () => {
      await Kora.getAllAnimeList();
      setLoadingMessage('Loading anime...');
      setLoadingProgress(20);

      await cache.init();
      setLoadingMessage('Loading cache...');
      setLoadingProgress(40);

      await mergeWatchHistory();
      setLoadingMessage('Loading watch history...');
      setLoadingProgress(60);

      await cache.prefetch(['/', 'home'], getHome);
      setLoadingMessage('Loading home...');
      setLoadingProgress(80);

      setLoadingMessage('Finalizing...');
      setLoadingProgress(100);
    };

    if (authState == 'success') {
      loadApp()
        .then(() => {
          setState('success');
        })
        .catch(() => {
          setState('error');
        });
    }
  }, [authState]);

  return (
    <div className="bg-background text-text w-screen h-screen">
      <Loading state={state} msg={loadingMessage} progress={loadingProgress} />
      {state === 'success' && (
        <Router>
          <div className="h-screen w-screen flex flex-col">
            <AppContent user={user} />
          </div>
        </Router>
      )}
    </div>
  );
}

function Loading({ state, msg, progress }: { state: State; msg: string; progress: number }) {
  return (
    <div
      className={`absolute inset-0 select-none transition-all duration-300 ${
        state === 'loading' ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="h-[14.8vh] flex items-center justify-center overflow-clip select-none">
          <h1 className="text-text-light font-extrabold !text-[20vh] -translate-y-[.8vh]">Kora</h1>
        </div>
        <div className="flex space-x-4 mt-4">
          <div className="h-10 mt-[1vh] w-[35vh] relative">
            <div
              className="z-20 bg-primary h-1 translate-x-0.5 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            ></div>
            <div className="z-10 absolute inset-0 bg-primary/35 h-1 translate-x-0.5 rounded-full w-full"></div>
            <p className="text-xs w-full text-center mt-2">{msg}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppContent({ user }: { user: User | null }) {
  if (user) {
    return (
      <div className="flex h-full w-full">
        <SideBar />
        <div className="w-full h-full">
          <Routes>
            <Route path="*" element={<Navigate to="/" replace />} />
            <Route path="/" element={<Home />} />
            <Route path="/anime/:id" element={<Anime />} />
            <Route path="/watch/:id/:epid" element={<Watch />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    );
  } else {
    return (
      <Routes>
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    );
  }
}

export default App;

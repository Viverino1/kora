import React, { useEffect } from 'react';
import { Navigate, Route, HashRouter as Router, Routes } from 'react-router-dom';
import { useAuth } from './providors/AuthProvidor';
import Home from './pages/Home';
import Auth from './pages/Auth';
import { cache } from './services/cache';
function App() {
  const { user, state: authState } = useAuth();
  const [state, setState] = React.useState<State>('loading');
  useEffect(() => {
    setState('loading');

    const loadApp = async () => {
      await cache.init();
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
      <Loading state={state} />
      {state === 'success' && (
        <Router>
          <AppContent user={user} />
        </Router>
      )}
    </div>
  );
}

function Loading({ state }: { state: State }) {
  return (
    <div
      className={`absolute inset-0 select-none transition-all duration-300 ${
        state === 'loading' ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div>
        <div className="absolute z-60 inset-0 backdrop-blur-3xl transition-all duration-300 bg-background flex flex-col items-center justify-center">
          <div className="h-[12vh] flex items-center justify-center overflow-clip select-none">
            <h1 className="text-text-light font-extrabold !text-[16vh] -translate-y-[.55vh]">Kora</h1>
          </div>
          <p className="text-[1.75vh] select-none pt-[1vh]">The best anime experience.</p>
        </div>
      </div>
    </div>
  );
}

function AppContent({ user }: { user: User | null }) {
  if (user) {
    return (
      <Routes>
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/" element={<Home />} />
      </Routes>
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

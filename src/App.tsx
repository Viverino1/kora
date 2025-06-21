import React, { useEffect } from 'react';
import {
  Navigate,
  Route,
  HashRouter as Router,
  Routes,
  useLocation,
} from "react-router-dom";
import { auth, useAuth } from './providors/AuthProvidor';
import { Kora } from './services/kora';
function App() {
  const { user, state: authState } = useAuth();
  const [state, setState] = React.useState<State>('loading');

  useEffect(() => {
    setState('loading');

    const loadApp = async () => {
      try {
        // TODO: Add prefetching here.
        setState('success');
      } catch {
        setState('error');
      }
    };

    if (state == 'success') {
      loadApp();
    }
  }, [authState]);

  return (
    <div className="bg-background text-text">
      <div
        className={`absolute inset-0 select-none transition-all duration-300 ${
          state === 'loading' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <Loading />
      </div>
      {state === 'success' && }
    </div>
  );
}

function Loading() {
  return (
    <div>
      <div className="absolute z-60 inset-0 backdrop-blur-3xl transition-all duration-300 bg-background flex flex-col items-center justify-center">
        <div className="h-[15vh] flex items-center justify-center overflow-clip select-none">
          <h1 className="text-text-light font-black !text-[20vh] -translate-y-[1.35vh]">Kora</h1>
        </div>
        <p className="text-[1.75vh] select-none">The best anime experience.</p>
      </div>
    </div>
  );
}

export default App;

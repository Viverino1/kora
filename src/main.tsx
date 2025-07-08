import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import App from './App';
import { OnlineStatusProvider } from './providors/OnlineStatusProvidor';
import { AuthProvider } from './providors/AuthProvidor';
import { SearchProvider } from './providors/SearchProvidor';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <OnlineStatusProvider>
      <AuthProvider>
        <SearchProvider>
          <App />
        </SearchProvider>
      </AuthProvider>
    </OnlineStatusProvider>
  </React.StrictMode>
);

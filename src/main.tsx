import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import App from './App';
import { OnlineStatusProvider } from './providors/OnlineStatusProvidor';
import { AuthProvider } from './providors/AuthProvidor';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <OnlineStatusProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </OnlineStatusProvider>
  </React.StrictMode>
);

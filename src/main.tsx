import React from 'react';
import ReactDOM from 'react-dom';
import './styles/global.css';
import App from './App';
import { OnlineStatusProvider } from './providors/OnlineStatusProvidor';
import { AuthProvider } from './providors/AuthProvidor';

ReactDOM.render(
  <React.StrictMode>
    <OnlineStatusProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </OnlineStatusProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

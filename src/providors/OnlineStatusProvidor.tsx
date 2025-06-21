import React, { createContext, useContext, useEffect, useState } from 'react';

const OnlineStatusContext = createContext<boolean>(true);

export function OnlineStatusProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return <OnlineStatusContext.Provider value={isOnline}>{children}</OnlineStatusContext.Provider>;
}

export function useOnlineStatus() {
  return useContext(OnlineStatusContext);
}

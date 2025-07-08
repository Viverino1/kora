import React, { createContext, useContext, useEffect, useState } from 'react';
import { fbauth, listenForGoogleAuthToken, signInWithGoogleBrowser, isElectron, FBU } from '../services/firebase';

class Auth {
  public user: User | null = null;

  async init(setUser: (user: User | null) => void) {
    await fbauth.authStateReady();
    this.setUser(fbauth.currentUser);

    const set = () => {
      this.setUser(fbauth.currentUser);
      setUser(this.user);
    };

    const removeListener = listenForGoogleAuthToken(set);
    const unsubscribe = fbauth.onAuthStateChanged(set);

    return () => {
      removeListener();
      unsubscribe();
    };
  }

  private setUser(currentUser: FBU | null) {
    if (currentUser) {
      this.user = {
        uid: currentUser.uid,
        email: currentUser.email,
        name: currentUser.displayName,
        pfp: currentUser.photoURL
      };
    } else {
      this.user = null;
    }
  }

  async continueWithGoogle() {
    if (isElectron && window.electronAPI) {
      // Use Electron's auth flow
      try {
        window.electronAPI.invoke('start-google-auth');
      } catch (error) {
        console.error('Electron Google auth failed:', error);
        throw error;
      }
    } else if (!isElectron) {
      // Use browser's popup auth flow only in actual browser environment
      try {
        const user = await signInWithGoogleBrowser();
        this.setUser(user);
      } catch (error) {
        console.error('Google sign-in failed:', error);
        throw error;
      }
    } else {
      // We're in Electron but electronAPI is not available
      console.error('Running in Electron but electronAPI is not available');
      throw new Error('Authentication not available in this environment');
    }
  }

  async signOut() {
    await fbauth.signOut();
    this.setUser(null);
    window.location.reload();
  }

  async getHeader() {
    const token = await fbauth.currentUser?.getIdToken();
    return `Bearer ${token}`;
  }
}

export const auth = new Auth();

type AuthContextType = {
  state: State;
  user: User | null;
};

const authContextDefaults: AuthContextType = {
  state: 'loading',
  user: null
};

const AuthContext = createContext<AuthContextType>(authContextDefaults);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(authContextDefaults.state);
  const [user, setUser] = useState<User | null>(authContextDefaults.user);

  useEffect(() => {
    let cleanup: () => void;
    auth.init(setUser).then((c) => {
      setState('success');
      setUser(auth.user);
      cleanup = c;
    });
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  return <AuthContext.Provider value={{ state, user }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

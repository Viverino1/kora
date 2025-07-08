import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCredential, GoogleAuthProvider, signInWithPopup, User as FBU } from 'firebase/auth';

const firebaseConfig = {
  apiKey: String(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: String(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: String(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: String(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: String(import.meta.env.VITE_FIREBASE_APP_ID),
  measurementId: String(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID)
};

const app = initializeApp(firebaseConfig);
export const fbauth = getAuth(app);

export type { FBU };

// Check if we're in an Electron environment
export const isElectron =
  typeof window !== 'undefined' &&
  (window.electronAPI !== undefined ||
    (typeof process !== 'undefined' && process.versions && process.versions.electron) ||
    (typeof navigator !== 'undefined' &&
      navigator.userAgent &&
      navigator.userAgent.toLowerCase().indexOf('electron') > -1));

export function listenForGoogleAuthToken(onUser: (user: FBU) => void, onError?: (err: any) => void) {
  // Only set up Electron listeners if we're in Electron environment and electronAPI is available
  if (!isElectron || !window.electronAPI) {
    // Return a no-op cleanup function for browser environment
    return () => {};
  }

  const handler = async (_event: any, idToken: string) => {
    const credential = GoogleAuthProvider.credential(idToken);
    try {
      const result = await signInWithCredential(fbauth, credential);
      onUser(result.user);
    } catch (err) {
      if (onError) onError(err);
    }
  };

  try {
    window.electronAPI.on('google-auth-token', handler);
    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('google-auth-token');
      }
    };
  } catch (error) {
    console.error('Failed to set up Electron auth listener:', error);
    return () => {};
  }
}

// Browser-compatible Google sign-in
export async function signInWithGoogleBrowser(): Promise<FBU> {
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');

  // Configure custom parameters for better popup handling
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  const result = await signInWithPopup(fbauth, provider);
  return result.user;
}

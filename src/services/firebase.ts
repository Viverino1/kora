import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCredential, GoogleAuthProvider, User as FBU } from 'firebase/auth';

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

export function listenForGoogleAuthToken(onUser: (user: FBU) => void, onError?: (err: any) => void) {
  const handler = async (_event: any, idToken: string) => {
    const credential = GoogleAuthProvider.credential(idToken);
    try {
      const result = await signInWithCredential(fbauth, credential);
      onUser(result.user);
    } catch (err) {
      if (onError) onError(err);
    }
  };
  window.electronAPI.on('google-auth-token', handler);
  return () => window.electronAPI.removeAllListeners('google-auth-token');
}

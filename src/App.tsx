import React, { useEffect } from 'react';
import { auth, useAuth } from './providors/AuthProvidor';
import { Kora } from './services/kora';
function App() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      Kora.getAnime('0008f5accfc1c462a995f8a7b938ee4556fa51c2831d4ae8479107e8b2566f7d')
        .then((anime) => {
          if (anime) {
            console.log('Anime data:', anime);
          } else {
            console.error('Failed to fetch anime data.');
          }
        })
        .catch((err) => {
          console.error('Error fetching anime data:', err);
        });
    }
  }, [user]);
  return (
    <div className="text-text p-4 flex flex-col gap-4 w-fit">
      <p>Hello, {user?.name}</p>
      <button className="text-left" onClick={auth.continueWithGoogle}>
        Continue with Google
      </button>
      <button className="text-left" onClick={auth.signOut}>
        Sign Out
      </button>
    </div>
  );
}

export default App;

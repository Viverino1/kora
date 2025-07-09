import React from 'react';
import Button from '../components/Button';
import { cache } from '../services/cache';
import { auth } from '../providors/AuthProvidor';
// @ts-ignore
import shaka from 'shaka-player/dist/shaka-player.ui';

export default function Settings() {
  const clearAllCache = async () => {
    try {
      // Clear all browser caches (this includes video segment caches)
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(async cacheName => {
            return caches.delete(cacheName);
          })
        );
      }

      // Clear all IndexedDB databases
      if ('indexedDB' in window) {
        try {
          const databases = await indexedDB.databases();

          await Promise.all(
            databases.map(db => {
              if (db.name) {
                return new Promise((resolve) => {
                  const deleteReq = indexedDB.deleteDatabase(db.name!);

                  // Add timeout to prevent hanging
                  const timeout = setTimeout(() => {
                    resolve(undefined);
                  }, 5000); // 5 second timeout

                  deleteReq.onsuccess = () => {
                    clearTimeout(timeout);
                    resolve(undefined);
                  };
                  deleteReq.onerror = () => {
                    clearTimeout(timeout);
                    resolve(undefined);
                  };
                  deleteReq.onblocked = () => {
                    clearTimeout(timeout);
                    resolve(undefined);
                  };
                });
              }
            }).filter(Boolean)
          );
        } catch (error) {
          // Fallback: try to delete common database names
          const commonDBs = ['shaka_offline_db', 'ShakaPlayerAssetDB', 'ShakaPlayerOfflineDB', 'ShakaPlayerManifestDB', 'kora-cache', 'firebase-heartbeat-database', 'firebaseLocalStorageDb'];
          await Promise.all(
            commonDBs.map(dbName => {
              return new Promise((resolve) => {
                const deleteReq = indexedDB.deleteDatabase(dbName);
                deleteReq.onsuccess = () => {
                  resolve(undefined);
                };
                deleteReq.onerror = () => {
                  resolve(undefined);
                };
              });
            })
          );
        }
      }

      // Clear local storage and session storage
      localStorage.clear();
      sessionStorage.clear();

      // Clear your app's cache
      await cache.clear();

      // Force reload to close all database connections and complete the clearing
      window.location.reload();
    } catch (error) {
      // Still call the original cache clear as fallback
      cache.clear();
    }
  };

  return (
    <div className="p-4 flex flex-col gap-4 w-fit">
      <Button onClick={clearAllCache}>Clear Cache</Button>
      <Button onClick={auth.signOut}>Sign Out</Button>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { userFetch } from './api.js';

const defaultBaskets = [
  { id: 'favourites', name: 'Favourites', emoji: '❤️', items: [], reminderDays: 0, lastOrderedAt: null }
];

export function useBaskets() {
  const [baskets, setBaskets] = useState([]);

  // Get current user helper
  const getCurrentUser = () => {
    try {
      const u = localStorage.getItem("packitout_user");
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  };

  const getStorageKey = () => {
    const user = getCurrentUser();
    return `packitout_saved_baskets_${user ? user._id : 'guest'}`;
  };

  useEffect(() => {
    const loadBaskets = () => {
      try {
        const user = getCurrentUser();
        const key = getStorageKey();
        let stored = localStorage.getItem(key);
        
        // If the backend has sent us savedBaskets on the user object, prefer it if we don't have local, or merge it.
        // Easiest is just to use the backend's savedBaskets if it's longer/newer, but for simplicity, 
        // we'll just check if it exists and write it to local storage.
        if (user && Array.isArray(user.savedBaskets) && user.savedBaskets.length > 0) {
          // If we want the backend to be the source of truth, we overwrite local storage on load
          stored = JSON.stringify(user.savedBaskets);
          localStorage.setItem(key, stored);
        }

        // One-time migration from the old global key
        if (!stored) {
          const globalStored = localStorage.getItem("packitout_saved_baskets");
          if (globalStored) {
            localStorage.setItem(key, globalStored);
            localStorage.removeItem("packitout_saved_baskets");
          }
        }

        const freshStored = localStorage.getItem(key);

        if (freshStored) {
          const parsed = JSON.parse(freshStored);
          if (parsed.length === 0) {
            setBaskets(defaultBaskets);
            localStorage.setItem(key, JSON.stringify(defaultBaskets));
          } else {
            // Ensure Favourites exists
            if (!parsed.some(b => b.id === 'favourites')) {
              parsed.unshift({ ...defaultBaskets[0] });
              localStorage.setItem(key, JSON.stringify(parsed));
            }
            setBaskets(parsed);
          }
        } else {
          setBaskets(defaultBaskets);
          localStorage.setItem(key, JSON.stringify(defaultBaskets));
        }
      } catch (err) {
        setBaskets(defaultBaskets);
      }
    };

    loadBaskets();

    const handleUpdate = () => loadBaskets();
    window.addEventListener('BASKETS_UPDATED', handleUpdate);
    // When user logs in/out, App.jsx triggers hashchange to "". We could also just listen to storage, but a custom event is better.
    // For now, checking on mount is sufficient since page refreshes often on auth.
    return () => window.removeEventListener('BASKETS_UPDATED', handleUpdate);
  }, []);

  const saveBaskets = (newBaskets) => {
    setBaskets(newBaskets);
    const key = getStorageKey();
    localStorage.setItem(key, JSON.stringify(newBaskets));
    window.dispatchEvent(new Event('BASKETS_UPDATED'));

    // Try syncing to backend
    const user = getCurrentUser();
    if (user && user._id) {
      userFetch(user, `/users/${user._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ savedBaskets: newBaskets })
      }).catch(() => {}); // silent fail if backend schema doesn't support it
    }
  };

  const isFavourite = (productId) => {
    const fav = baskets.find(b => b.id === 'favourites');
    return fav ? fav.items.some(i => i._id === productId) : false;
  };

  const toggleFavourite = (product) => {
    const newBaskets = baskets.map(b => {
      if (b.id === 'favourites') {
        const exists = b.items.some(i => i._id === product._id);
        if (exists) {
          return { ...b, items: b.items.filter(i => i._id !== product._id) };
        } else {
          return { ...b, items: [...b.items, { ...product, qty: 1 }] };
        }
      }
      return b;
    });
    saveBaskets(newBaskets);
    return !isFavourite(product._id); // returns true if it was added
  };

  return { baskets, saveBaskets, isFavourite, toggleFavourite };
}

import { useState, useEffect } from 'react';
import { userFetch } from './api.js';

const defaultBaskets = [
  { id: 'favourites', name: 'Favourites', emoji: '❤️', items: [], reminderDays: 0, lastOrderedAt: null }
];

export function useBaskets() {
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

  const parseBaskets = (stored, user) => {
    let result = null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          result = parsed;
        }
      } catch {}
    }
    // Fall back to user.savedBaskets if localStorage is empty
    if (!result && user && Array.isArray(user.savedBaskets) && user.savedBaskets.length > 0) {
      result = user.savedBaskets;
    }
    if (!result || result.length === 0) {
      result = defaultBaskets;
    }
    if (!result.some(b => b.id === 'favourites')) {
      result = [{ ...defaultBaskets[0] }, ...result];
    }
    return result;
  };

  // Immediate synchronous initial state (0ms First Paint, no empty flicker)
  const [baskets, setBaskets] = useState(() => {
    try {
      const user = getCurrentUser();
      const key = getStorageKey();
      const stored = localStorage.getItem(key);
      const initial = parseBaskets(stored, user);
      // Ensure localStorage has it cached
      if (!stored) {
        localStorage.setItem(key, JSON.stringify(initial));
      }
      return initial;
    } catch {
      return defaultBaskets;
    }
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const user = getCurrentUser();
        const key = getStorageKey();
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setBaskets(parsed);
          }
        }
      } catch {}
    };

    window.addEventListener('BASKETS_UPDATED', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('BASKETS_UPDATED', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const saveBaskets = (newBaskets) => {
    const key = getStorageKey();
    setBaskets(newBaskets);

    try {
      localStorage.setItem(key, JSON.stringify(newBaskets));
    } catch {}

    // ⚡ CRITICAL FIX: Keep packitout_user in sync so old cached user state never reverts your baskets!
    try {
      const u = localStorage.getItem("packitout_user");
      if (u) {
        const userObj = JSON.parse(u);
        userObj.savedBaskets = newBaskets;
        localStorage.setItem("packitout_user", JSON.stringify(userObj));
      }
    } catch {}

    window.dispatchEvent(new Event('BASKETS_UPDATED'));

    // Try syncing to backend asynchronously (non-blocking)
    const user = getCurrentUser();
    if (user && user._id) {
      userFetch(user, `/users/${user._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ savedBaskets: newBaskets })
      }).catch(() => {});
    }
  };

  const isFavourite = (productId) => {
    const targetId = String(productId?._id || productId?.id || productId || '');
    const fav = baskets.find(b => b.id === 'favourites');
    return fav ? fav.items.some(i => String(i._id || i.id || '') === targetId) : false;
  };

  const toggleFavourite = (product) => {
    const targetId = String(product?._id || product?.id || '');
    const newBaskets = baskets.map(b => {
      if (b.id === 'favourites') {
        const exists = b.items.some(i => String(i._id || i.id || '') === targetId);
        if (exists) {
          return { ...b, items: b.items.filter(i => String(i._id || i.id || '') !== targetId) };
        } else {
          return { ...b, items: [...b.items, { ...product, qty: 1 }] };
        }
      }
      return b;
    });
    saveBaskets(newBaskets);
    return !isFavourite(product);
  };

  return { baskets, saveBaskets, isFavourite, toggleFavourite };
}

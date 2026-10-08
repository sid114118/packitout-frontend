import { useState, useEffect } from 'react';

const STORAGE_KEY = "packitout_saved_baskets";

const defaultBaskets = [
  { id: 'favourites', name: 'Favourites', emoji: '❤️', items: [], reminderDays: 0, lastOrderedAt: null }
];

export function useBaskets() {
  const [baskets, setBaskets] = useState([]);

  useEffect(() => {
    const loadBaskets = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.length === 0) {
            setBaskets(defaultBaskets);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultBaskets));
          } else {
            // Ensure Favourites exists
            if (!parsed.some(b => b.id === 'favourites')) {
              parsed.unshift({ ...defaultBaskets[0] });
              localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            }
            setBaskets(parsed);
          }
        } else {
          setBaskets(defaultBaskets);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultBaskets));
        }
      } catch (err) {
        setBaskets(defaultBaskets);
      }
    };

    loadBaskets();

    const handleUpdate = () => loadBaskets();
    window.addEventListener('BASKETS_UPDATED', handleUpdate);
    return () => window.removeEventListener('BASKETS_UPDATED', handleUpdate);
  }, []);

  const saveBaskets = (newBaskets) => {
    setBaskets(newBaskets);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newBaskets));
    window.dispatchEvent(new Event('BASKETS_UPDATED'));
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

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import DialogProvider from './ui/DialogProvider.jsx'
import { RankingProvider } from './ui/RankingProvider.jsx'
import './styles.css'

window.addEventListener('vite:preloadError', () => {
  if (!sessionStorage.getItem('pio_chunk_reloaded')) {
    sessionStorage.setItem('pio_chunk_reloaded', '1');
    window.location.reload();
  }
});

// ⚡ PERFORMANCE: Purge legacy oversized storage keys from previous app versions
// so normal browser profiles don't suffer synchronous storage thread locks.
try {
  const staleKeys = [
    'packitout_guest_master_v1',
    'packitout_master_products_v1',
    'packitout_all_master_products'
  ];
  staleKeys.forEach(k => {
    try { localStorage.removeItem(k); } catch {}
  });

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k && (k.startsWith('packitout_feed_cache_') || k.startsWith('shop_inventory_'))) {
      const v = localStorage.getItem(k);
      if (v && v.length > 300000) {
        localStorage.removeItem(k);
      }
    }
  }
} catch {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DialogProvider>
      <RankingProvider>
        <App />
      </RankingProvider>
    </DialogProvider>
  </React.StrictMode>,
)
 

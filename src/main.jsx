import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import DialogProvider from './ui/DialogProvider.jsx'
import { RankingProvider } from './ui/RankingProvider.jsx'
import './styles.css'

window.addEventListener('vite:preloadError', () => {
  try {
    const lastReloadStr = sessionStorage.getItem('pio_chunk_reloaded_at');
    const now = Date.now();
    // Allow auto-reload across multiple deploys while guarding against infinite reload loops (max 1 reload per 15s)
    if (!lastReloadStr || (now - parseInt(lastReloadStr, 10)) > 15000) {
      sessionStorage.setItem('pio_chunk_reloaded_at', String(now));
      window.location.reload();
    }
  } catch {
    window.location.reload();
  }
});

// ⚡ PERFORMANCE: Purge legacy oversized storage keys from previous app versions
// so normal browser profiles don't suffer synchronous storage thread locks.
try {
  const staleKeys = [
    'packitout_guest_master_v1',
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
 

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

// Default config = disabled; behaves exactly like the pre-feature app
// until the admin enables ranking + saves a brand order.
const DEFAULT_CONFIG = { enabled: false, brandOrder: [] };

const RankingContext = createContext({ config: DEFAULT_CONFIG, refresh: () => {} });

const STORAGE_KEY = 'packitout_ranking_config';

// Pre-seed from localStorage so the first paint already applies the right
// order — otherwise users would briefly see DB-order results before our
// network fetch lands.
function loadCached() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.enabled === 'boolean' && Array.isArray(parsed.brandOrder)) {
      return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

export function RankingProvider({ children }) {
  const [config, setConfig] = useState(() => loadCached() || DEFAULT_CONFIG);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${BASE_URL}/ranking-config`);
      if (!res.ok) return;
      const doc = await res.json();
      const normalized = {
        enabled: !!doc.enabled,
        brandOrder: Array.isArray(doc.brandOrder) ? doc.brandOrder : [],
      };
      setConfig(normalized);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized)); } catch { /* ignore */ }
    } catch { /* offline → keep cached */ }
  };

  useEffect(() => { fetchConfig(); }, []);

  const value = useMemo(() => ({ config, refresh: fetchConfig }), [config]);
  return <RankingContext.Provider value={value}>{children}</RankingContext.Provider>;
}

export function useRankingConfig() {
  return useContext(RankingContext);
}

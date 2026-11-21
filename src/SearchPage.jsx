import React, { useState, useEffect, useMemo, useRef } from 'react';
import Fuse from 'fuse.js';
import { createPortal } from 'react-dom';
import { ModernProductCard } from './ProductFeed/FeedComponents.jsx';
import { useRankingConfig } from './ui/RankingProvider.jsx';
import { applyBrandPriority } from './utils/rankingSort.js';
import { trackEvent } from './utils/analyticsEngine.js';
import VoiceSearchModal from './components/VoiceSearchModal.jsx';
import { translateDevanagari } from './utils/voiceSearchCleaner.js';

const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

// Curated category prompts shown before the user types anything.
// Each entry maps a friendly label to the search term we plug in.
const POPULAR_CATEGORIES = [
  { label: 'Milk',      query: 'milk',      emoji: '🥛' },
  { label: 'Bread',     query: 'bread',     emoji: '🍞' },
  { label: 'Eggs',      query: 'egg',       emoji: '🥚' },
  { label: 'Chips',     query: 'chips',     emoji: '🍟' },
  { label: 'Maggi',     query: 'maggi',     emoji: '🍜' },
  { label: 'Cold drink',query: 'drink',     emoji: '🥤' },
  { label: 'Chocolate', query: 'chocolate', emoji: '🍫' },
  { label: 'Ice cream', query: 'ice cream', emoji: '🍦' },
];

export default function SearchPage({
  items = [],
  shopId: propShopId,
  onClose,
  onOpenDetails,
  onQuickAdd,
  cart = [],
  onRemoveFromCart,
  onViewCart,
  autoStartVoice = false,
}) {
  const { config: rankingConfig } = useRankingConfig();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(autoStartVoice);

  const handleVoiceSearchResult = (cleanTerm) => {
    if (cleanTerm && cleanTerm.trim()) {
      const term = cleanTerm.trim();
      setQuery(term);
      setDebouncedQuery(term);
      trackEvent('VOICE_SEARCH_SUCCESS', { query: term });
      inputRef.current?.focus();
    }
  };

  // 🎛️ Smart Filter & Sort States
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance'); // 'relevance' | 'price_asc' | 'price_desc' | 'discount_desc'

  // Modal bottom sheets for Sort & Price
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);

  // Suggestions accordion toggle
  const [isSuggestionsCollapsed, setIsSuggestionsCollapsed] = useState(false);

  // Reset filters when search query changes
  useEffect(() => {
    setSelectedSubCategory(null);
    setSelectedBrand(null);
    setSelectedPriceRange(null);
    setIsSuggestionsCollapsed(false);
  }, [debouncedQuery]);

  // Lazy load results for long lists
  const [visibleCount, setVisibleCount] = useState(16);

  // Avoid double-logging the same missed term in one session
  const loggedMissedTermsRef = useRef(new Set());

  const inputRef = useRef(null);
  const BOTTOM_NAV_HEIGHT = '75px';

  useEffect(() => {
    try {
      const savedSearches = localStorage.getItem('packitout_recent_searches');
      if (!savedSearches) return;
      const parsed = JSON.parse(savedSearches);
      if (Array.isArray(parsed)) setRecentSearches(parsed);
    } catch {
      try { localStorage.removeItem('packitout_recent_searches'); } catch {}
    }
  }, []);

  // Debounce input → search
  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedQuery(query); }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => { setVisibleCount(16); }, [debouncedQuery]);

  // Persist long-enough queries as recent
  useEffect(() => {
    if (debouncedQuery.trim().length > 2) {
      setRecentSearches(prev => {
        const term = debouncedQuery.trim();
        const updated = [term, ...prev.filter(q => q.toLowerCase() !== term.toLowerCase())].slice(0, 5);
        try { localStorage.setItem('packitout_recent_searches', JSON.stringify(updated)); } catch {}
        return updated;
      });
    }
  }, [debouncedQuery]);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // 🛡️ MOBILE BACK BUTTON FIX
  useEffect(() => {
    if (window.history.state?.name !== 'searchPage') {
      window.history.pushState({ name: 'searchPage' }, '');
    }

    const handlePopState = (e) => {
      if (e.state?.name === 'searchPage') return;
      if (onCloseRef.current) onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (window.history.state?.name === 'searchPage') {
        window.history.back();
      }
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const focusTimer = setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 100);
    return () => {
      document.body.style.overflow = '';
      clearTimeout(focusTimer);
    };
  }, []);

  // Normalizes Devanagari Hindi typing (e.g. 'दूध' -> 'milk', 'मैगी' -> 'maggi')
  const normalizedQuery = useMemo(() => {
    return translateDevanagari(debouncedQuery).trim();
  }, [debouncedQuery]);

  // Flatten variants once — grouped with stable _familyId to prevent duplicate cards
  const flatItems = useMemo(() => (
    (Array.isArray(items) ? items : []).filter(Boolean).flatMap(item => {
      const familyId = String(item.itemGroupId || item._id || '');
      if (item.variants && item.variants.length > 0) {
        return item.variants.map(variant => ({
          ...item,
          ...variant,
          _familyId: familyId,
          variants: item.variants
        }));
      }
      return [{
        ...item,
        _familyId: familyId
      }];
    })
  ), [items]);

  const [serverResults, setServerResults] = useState([]);
  const [isServerSearching, setIsServerSearching] = useState(false);

  // Robust active shop ID resolution (props -> active_shop -> guest_shop -> user.primaryShop)
  const effectiveShopId = propShopId || (() => {
    try {
      const activeShop = JSON.parse(localStorage.getItem('packitout_active_shop') || '{}');
      if (activeShop?._id) return activeShop._id;
      const guestId = localStorage.getItem('packitout_guest_shop_id');
      if (guestId) return guestId;
      const userStr = localStorage.getItem('packitout_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.primaryShop) {
          return typeof u.primaryShop === 'object' ? u.primaryShop._id : u.primaryShop;
        }
      }
    } catch {}
    return null;
  })();

  // Server-side search sync (for 10,000+ item catalogs where local cache is partial or paginated)
  useEffect(() => {
    const q = normalizedQuery;
    if (q.length < 2 || !effectiveShopId) {
      setServerResults([]);
      setIsServerSearching(false);
      return;
    }
    let cancelled = false;
    setIsServerSearching(true);
    fetch(`${BASE_URL}/shops/${effectiveShopId}/search?q=${encodeURIComponent(q)}&limit=40`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (cancelled) return;
        setIsServerSearching(false);
        if (!data || !Array.isArray(data.items)) return;
        setServerResults(data.items);
      })
      .catch(() => {
        if (!cancelled) setIsServerSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [normalizedQuery, effectiveShopId]);

  const fuse = useMemo(() => {
    // Cap Fuse index to 2,500 items so 10,000+ catalogs never freeze the main thread
    const fusePool = flatItems.length > 2500 ? flatItems.slice(0, 2500) : flatItems;
    return new Fuse(fusePool, {
      keys: [
        { name: 'name', weight: 0.5 },
        { name: 'brand', weight: 0.2 },
        { name: 'category', weight: 0.15 },
        { name: 'subCategory', weight: 0.1 },
        { name: 'searchTags', weight: 0.15 },
        { name: 'barcode', weight: 0.2 },
      ],
      threshold: 0.38,
      ignoreLocation: true,
    });
  }, [flatItems]);

  const displayItems = useMemo(() => {
    const q = normalizedQuery.trim();
    if (q.length === 0) return [];

    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    const seenFamilyIds = new Set();
    const exactMatches = [];
    const tokenMatches = [];

    // 1. Precise Scan across all flatItems (exact prefix & token intersection)
    for (const it of flatItems) {
      if (!it) continue;
      const famId = it._familyId || String(it._id);
      if (seenFamilyIds.has(famId)) continue;

      const nameLower = (it.name || '').toLowerCase();
      const brandLower = (it.brand || '').toLowerCase();
      const catLower = (it.category || '').toLowerCase();
      const subLower = (it.subCategory || '').toLowerCase();
      const tagsStr = Array.isArray(it.searchTags) ? it.searchTags.join(' ').toLowerCase() : String(it.searchTags || '').toLowerCase();
      const barcodeStr = String(it.barcode || '').toLowerCase();

      // Top tier: exact match or startsWith on name/brand
      if (nameLower.startsWith(q.toLowerCase()) || brandLower.startsWith(q.toLowerCase())) {
        seenFamilyIds.add(famId);
        exactMatches.push(it);
        continue;
      }

      // Strong tier: all tokens present across name, brand, category, subCategory, tags, barcode
      const hay = `${nameLower} ${brandLower} ${catLower} ${subLower} ${barcodeStr} ${tagsStr}`;
      if (tokens.every(t => hay.includes(t))) {
        seenFamilyIds.add(famId);
        tokenMatches.push(it);
      }
    }

    // 2. Fuzzy matches via Fuse.js for typo tolerance (e.g. "powdr", "majji")
    const fuzzyMatches = [];
    const fuseResults = fuse.search(q);
    for (const r of fuseResults) {
      const it = r.item;
      const famId = it._familyId || String(it._id);
      if (!seenFamilyIds.has(famId)) {
        seenFamilyIds.add(famId);
        fuzzyMatches.push(it);
      }
    }

    // 3. Merge server-side search results cleanly
    const serverMatched = [];
    for (const sItem of serverResults) {
      if (sItem && sItem._id) {
        const famId = sItem.itemGroupId || String(sItem._id);
        if (!seenFamilyIds.has(famId)) {
          seenFamilyIds.add(famId);
          serverMatched.push(sItem);
        }
      }
    }

    const consolidated = [...exactMatches, ...tokenMatches, ...fuzzyMatches, ...serverMatched];
    return applyBrandPriority(consolidated, rankingConfig);
  }, [normalizedQuery, fuse, flatItems, serverResults, rankingConfig]);

  // 🏷️ SMART INTENT / CATEGORY DISAMBIGUATION SUGGESTIONS (like Blinkit / Zepto)
  const categorySuggestions = useMemo(() => {
    const q = normalizedQuery.trim().toLowerCase();
    if (q.length < 2 || displayItems.length === 0) return [];

    const groupMap = new Map();

    for (const item of displayItems) {
      const sub = (item.subCategory || '').trim();
      const cat = (item.category || '').trim();
      const key = sub || cat;
      if (!key) continue;

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          key,
          label: key,
          count: 0,
          topItem: item,
        });
      }
      const entry = groupMap.get(key);
      entry.count += 1;
      // Prefer items with images for the thumbnail
      if (!entry.topItem?.image && item.image) {
        entry.topItem = item;
      }
    }

    const sortedGroups = Array.from(groupMap.values())
      .filter(g => g.count > 0)
      .sort((a, b) => b.count - a.count);

    if (sortedGroups.length <= 1 && sortedGroups[0]?.count === displayItems.length) {
      return [];
    }

    // 1st entry is "All [Query]" (e.g. "Powder")
    const allLabel = q.charAt(0).toUpperCase() + q.slice(1);
    const allEntry = {
      key: '__ALL__',
      label: allLabel,
      isAll: true,
      count: displayItems.length,
      topItem: displayItems[0],
    };

    return [allEntry, ...sortedGroups.slice(0, 5)];
  }, [normalizedQuery, displayItems]);

  // 🏢 Extract Brands from current search results (scoped to selectedSubCategory if active)
  const availableBrands = useMemo(() => {
    let source = displayItems;
    if (selectedSubCategory) {
      source = source.filter(i => (i.subCategory || i.category || '').trim() === selectedSubCategory);
    }
    const brandMap = new Map();
    for (const item of source) {
      const b = (item.brand || '').trim();
      if (!b || b.toLowerCase() === 'generic' || b.toLowerCase() === 'loose') continue;
      brandMap.set(b, (brandMap.get(b) || 0) + 1);
    }
    return Array.from(brandMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [displayItems, selectedSubCategory]);

  // ⚡ Filtered & Sorted Products for Live Grid
  const finalProducts = useMemo(() => {
    let list = displayItems;

    // Filter by SubCategory
    if (selectedSubCategory) {
      list = list.filter(i => (i.subCategory || i.category || '').trim() === selectedSubCategory);
    }

    // Filter by Brand
    if (selectedBrand) {
      list = list.filter(i => (i.brand || '').trim().toLowerCase() === selectedBrand.toLowerCase());
    }

    // Filter by In-Stock
    if (inStockOnly) {
      list = list.filter(i => i.inStock !== false);
    }

    // Filter by Price Range
    if (selectedPriceRange) {
      list = list.filter(i => {
        const p = Number(i.sellingPrice !== undefined && i.sellingPrice !== null ? i.sellingPrice : (i.mrp || 0));
        if (selectedPriceRange === 'under_100') return p < 100;
        if (selectedPriceRange === '100_300') return p >= 100 && p <= 300;
        if (selectedPriceRange === '300_500') return p > 300 && p <= 500;
        if (selectedPriceRange === 'above_500') return p > 500;
        return true;
      });
    }

    // Sort
    if (sortBy === 'price_asc') {
      list = [...list].sort((a, b) => {
        const pa = Number(a.sellingPrice !== undefined ? a.sellingPrice : (a.mrp || 0));
        const pb = Number(b.sellingPrice !== undefined ? b.sellingPrice : (b.mrp || 0));
        return pa - pb;
      });
    } else if (sortBy === 'price_desc') {
      list = [...list].sort((a, b) => {
        const pa = Number(a.sellingPrice !== undefined ? a.sellingPrice : (a.mrp || 0));
        const pb = Number(b.sellingPrice !== undefined ? b.sellingPrice : (b.mrp || 0));
        return pb - pa;
      });
    } else if (sortBy === 'discount_desc') {
      list = [...list].sort((a, b) => {
        const da = a.discountPercent || 0;
        const db = b.discountPercent || 0;
        return db - da;
      });
    }

    return list;
  }, [displayItems, selectedSubCategory, selectedBrand, inStockOnly, selectedPriceRange, sortBy]);

  const handleClearAllFilters = () => {
    setSelectedSubCategory(null);
    setSelectedBrand(null);
    setSelectedPriceRange(null);
    setInStockOnly(false);
    setSortBy('relevance');
    setIsSuggestionsCollapsed(false);
  };

  const hasActiveFilters = Boolean(
    selectedSubCategory || selectedBrand || selectedPriceRange || inStockOnly || sortBy !== 'relevance'
  );

  // Helper: renders suggestion label with dark bold for qualifying word matching the screenshot
  const renderSuggestionLabel = (label, isAll) => {
    if (isAll) return <span style={{ fontWeight: 700, color: '#1e293b' }}>{label}</span>;
    const q = normalizedQuery.trim();
    if (!q) return <span style={{ fontWeight: 600, color: '#334155' }}>{label}</span>;

    const idx = label.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) {
      return (
        <span>
          <strong style={{ fontWeight: 800, color: '#0f172a' }}>{label}</strong>{' '}
          <span style={{ fontWeight: 500, color: '#64748b' }}>{q}</span>
        </span>
      );
    }

    const before = label.slice(0, idx);
    const match = label.slice(idx, idx + q.length);
    const after = label.slice(idx + q.length);

    return (
      <span>
        {before && <strong style={{ fontWeight: 800, color: '#0f172a' }}>{before}</strong>}
        <span style={{ fontWeight: 500, color: '#64748b' }}>{match}</span>
        {after && <strong style={{ fontWeight: 800, color: '#0f172a' }}>{after}</strong>}
      </span>
    );
  };

  // Type-ahead chips while typing. Pulls unique product names/brands that
  // start with or contain the live (un-debounced) query so it feels instant.
  // Capped at 6 to keep the UI tight.
  const liveSuggestions = useMemo(() => {
    const raw = translateDevanagari(query).trim().toLowerCase();
    if (raw.length === 0) return [];
    const seen = new Set();
    const out = [];
    // Prioritize "starts with" over "contains"
    const startsWith = [];
    const contains = [];
    for (const item of flatItems) {
      const candidates = [item.name, item.brand, item.category].filter(Boolean);
      for (const cand of candidates) {
        const key = String(cand).trim();
        const lc = key.toLowerCase();
        if (seen.has(lc) || lc === raw) continue;
        if (lc.startsWith(raw)) {
          seen.add(lc);
          startsWith.push(key);
        } else if (lc.includes(raw)) {
          seen.add(lc);
          contains.push(key);
        }
      }
      if (startsWith.length >= 6) break;
    }
    out.push(...startsWith.slice(0, 6));
    if (out.length < 6) out.push(...contains.slice(0, 6 - out.length));
    return out.slice(0, 6);
  }, [query, flatItems]);

  // Log missed searches once per term per session (only after server search finishes)
  useEffect(() => {
    const term = (normalizedQuery || debouncedQuery).trim().toLowerCase();
    if (term.length < 3) return;

    // Do NOT log zero-result prematurely while server search is still pending
    if (isServerSearching) return;

    if (displayItems.length > 0) {
      if (!loggedMissedTermsRef.current.has(term + '_hit')) {
        loggedMissedTermsRef.current.add(term + '_hit');
        trackEvent('SEARCH_QUERY', { query: term, resultsCount: displayItems.length });
      }
      return;
    }

    // We only log if the user actually settled on this term (debounced and server settled).
    if (loggedMissedTermsRef.current.has(term)) return;
    loggedMissedTermsRef.current.add(term);

    trackEvent('ZERO_RESULT_SEARCH', { query: term });

    let cancelled = false;
    const savedUser = (() => {
      try { return JSON.parse(localStorage.getItem('packitout_user') || '{}'); }
      catch { return {}; }
    })();

    fetch(`${BASE_URL}/missed-searches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        term,
        userId: savedUser._id || '',
        pincode: savedUser.pincode || '',
      }),
    }).catch(() => { /* swallow — analytics shouldn't break the UX */ });

    return () => { cancelled = true; };
  }, [normalizedQuery, debouncedQuery, displayItems.length, isServerSearching]);

  const safeCart = Array.isArray(cart) ? cart.filter(c => c !== null) : [];
  const cartTotalItems = safeCart.reduce((total, item) => total + (Number(item.qty) || 1), 0);
  const cartTotalPrice = safeCart.reduce((total, item) => {
    const price = Number(item.sellingPrice !== undefined ? item.sellingPrice : (item.mrp || 0));
    return total + (price * (Number(item.qty) || 1));
  }, 0);

  const isTyping = query.trim().length > 0 && query !== debouncedQuery;

  const handleClearRecent = () => {
    setRecentSearches([]);
    try { localStorage.removeItem('packitout_recent_searches'); } catch {}
  };

  const applySuggestion = (term) => {
    setQuery(term);
    setDebouncedQuery(term);
    inputRef.current?.focus();
  };

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      setVisibleCount(prev => prev + 16);
    }
  };

  // Helper: highlight matching substring in a suggestion label
  const renderHighlighted = (label) => {
    const q = query.trim();
    if (!q) return label;
    const idx = label.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return label;
    return (
      <>
        {label.slice(0, idx)}
        <span style={{ fontWeight: 800, color: '#0f172a' }}>{label.slice(idx, idx + q.length)}</span>
        {label.slice(idx + q.length)}
      </>
    );
  };

  return createPortal(
    <div
      onScroll={handleScroll}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: BOTTOM_NAV_HEIGHT,
        backgroundColor: '#fff', zIndex: 999999, overflowY: 'auto',
        animation: 'fadeIn 0.2s ease',
        paddingBottom: cartTotalItems > 0 ? '120px' : '40px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes skeletonPulse {
          0% { background-color: #f1f5f9; }
          50% { background-color: #e2e8f0; }
          100% { background-color: #f1f5f9; }
        }
      `}</style>

      {/* SEARCH HEADER */}
      <div style={{
        padding: '15px', position: 'sticky', top: 0,
        backgroundColor: '#fff', zIndex: 2000,
        borderBottom: '1px solid #f1f5f9',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          backgroundColor: '#f1f5f9', borderRadius: '12px',
          padding: '8px 12px',
        }}>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '1.4rem',
            cursor: 'pointer', padding: '0 10px 0 0', color: '#475569',
            display: 'flex', alignItems: 'center',
          }}>←</button>
          <input
            ref={inputRef}
            type="text"
            placeholder='Search "Maggi", "Milk"…'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClick={() => inputRef.current?.focus()}
            style={{
              border: 'none', outline: 'none', width: '100%',
              fontSize: '1.05rem', fontWeight: 500,
              backgroundColor: 'transparent', color: '#111827',
              userSelect: 'auto', WebkitUserSelect: 'auto',
              touchAction: 'manipulation',
            }}
          />
          {query ? (
            <button
              onClick={() => { setQuery(""); setDebouncedQuery(""); inputRef.current?.focus(); }}
              aria-label="Clear search"
              style={{
                background: 'none', border: 'none', fontSize: '1.2rem',
                color: '#94a3b8', cursor: 'pointer', padding: '0 4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >✖</button>
          ) : null}

          <button
            onClick={() => setIsVoiceModalOpen(true)}
            aria-label="Search with Voice"
            title="Search with Voice"
            className="pio-press"
            style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '1px solid #bbf7d0',
              borderRadius: '9px',
              padding: '6px 8px',
              color: '#16a34a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '4px',
              flexShrink: 0,
              boxShadow: '0 2px 5px rgba(22, 163, 74, 0.12)',
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </button>
        </div>

        {/* Live type-ahead row — appears the instant the user starts typing */}
        {query.trim().length > 0 && liveSuggestions.length > 0 && (
          <div className="hide-scroll" style={{
            display: 'flex', gap: '8px', overflowX: 'auto',
            marginTop: '10px', paddingBottom: '2px',
          }}>
            {liveSuggestions.map((s, i) => (
              <button
                key={`${s}-${i}`}
                onClick={() => applySuggestion(s)}
                style={{
                  flexShrink: 0,
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                {renderHighlighted(s)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* BODY */}
      <div style={{ padding: '15px' }}>
        {query.trim().length === 0 ? (
          <>
            {/* Recent */}
            {recentSearches.length > 0 && (
              <div style={{ padding: '5px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#111827', fontWeight: 800 }}>Recent searches</h3>
                  <button onClick={handleClearRecent} style={{
                    background: 'none', border: 'none', color: '#ef4444',
                    fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                  }}>Clear</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {recentSearches.map((term, i) => (
                    <button key={i} onClick={() => applySuggestion(term)} style={{
                      padding: '8px 14px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '999px',
                      fontSize: '0.9rem', color: '#334155',
                      cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      fontWeight: 600,
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <polyline points="12 7 12 12 15 14" />
                      </svg>
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Search Quick Banner */}
            <div
              onClick={() => setIsVoiceModalOpen(true)}
              className="pio-press"
              style={{
                backgroundColor: '#ffffff',
                border: '1.5px dashed #86efac',
                borderRadius: '16px',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.06)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '12px',
                  backgroundColor: '#16a34a', color: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                    बोल के सर्च करें (Voice Search)
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600 }}>
                    Speak naturally in Hindi or English
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Try now ›
              </span>
            </div>

            {/* Popular categories */}
            <div style={{ padding: '5px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '1.05rem', color: '#111827', fontWeight: 800 }}>
                Popular searches
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '10px',
              }}>
                {POPULAR_CATEGORIES.map((c) => (
                  <button
                    key={c.query}
                    onClick={() => applySuggestion(c.query)}
                    style={{
                      appearance: 'none',
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '14px',
                      padding: '12px 6px 10px',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                      transition: 'transform 0.1s, box-shadow 0.15s',
                    }}
                    onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
                    onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <span style={{
                      fontSize: '1.55rem', lineHeight: 1,
                      width: '46px', height: '46px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{c.emoji}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : isTyping ? (
          /* Skeleton loader while debounce settles */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} style={{
                border: '1px solid #f1f5f9', borderRadius: '16px',
                padding: '10px', backgroundColor: '#fff',
                display: 'flex', flexDirection: 'column', height: '230px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
              }}>
                <div style={{ height: '110px', width: '100%', borderRadius: '12px', marginBottom: '12px', animation: 'skeletonPulse 1.5s infinite ease-in-out' }} />
                <div style={{ height: '10px', width: '30%', borderRadius: '4px', marginBottom: '8px', animation: 'skeletonPulse 1.5s infinite ease-in-out' }} />
                <div style={{ height: '14px', width: '85%', borderRadius: '4px', marginBottom: '6px', animation: 'skeletonPulse 1.5s infinite ease-in-out' }} />
                <div style={{ height: '14px', width: '60%', borderRadius: '4px', marginBottom: 'auto', animation: 'skeletonPulse 1.5s infinite ease-in-out' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <div style={{ height: '18px', width: '50px', borderRadius: '4px', animation: 'skeletonPulse 1.5s infinite ease-in-out' }} />
                  <div style={{ height: '28px', width: '60px', borderRadius: '8px', animation: 'skeletonPulse 1.5s infinite ease-in-out' }} />
                </div>
              </div>
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '72px', height: '72px', borderRadius: '50%',
              background: '#f0fdf4', marginBottom: '14px',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <p style={{ fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              No products for "{debouncedQuery}"
            </p>
            <p style={{ fontSize: '0.88rem', margin: 0, color: '#64748b', fontWeight: 500, maxWidth: '280px', marginLeft: 'auto', marginRight: 'auto' }}>
              Thanks for letting us know — we'll look into stocking this soon.
            </p>
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: '10px' }}>
                Try one of these
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px' }}>
                {POPULAR_CATEGORIES.slice(0, 5).map(c => (
                  <button key={c.query} onClick={() => applySuggestion(c.query)} style={{
                    padding: '6px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0',
                    borderRadius: '999px', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a',
                    cursor: 'pointer',
                  }}>{c.emoji} {c.label}</button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 🎯 1. SMART CATEGORY / INTENT DISAMBIGUATION (Screenshot UX) */}
            {categorySuggestions.length > 0 && (
              isSuggestionsCollapsed ? (
                /* Compact Active Category Pill with "Change Type ▾" */
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', background: '#f8fafc', borderRadius: '12px',
                  border: '1px solid #e2e8f0', marginBottom: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, flexShrink: 0 }}>Category:</span>
                    {selectedSubCategory ? (
                      <span style={{
                        background: '#dcfce7', color: '#15803d', padding: '3px 10px',
                        borderRadius: '999px', fontSize: '0.82rem', fontWeight: 700,
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {selectedSubCategory}
                        <span
                          onClick={(e) => { e.stopPropagation(); setSelectedSubCategory(null); setIsSuggestionsCollapsed(false); }}
                          style={{ cursor: 'pointer', fontSize: '0.9rem', color: '#166534', fontWeight: 900 }}
                          title="Clear category filter"
                        >✕</span>
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 700 }}>
                        All Types ({displayItems.length})
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setIsSuggestionsCollapsed(false)}
                    style={{
                      background: 'none', border: 'none', color: '#0284c7',
                      fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                      whiteSpace: 'nowrap', flexShrink: 0, paddingLeft: '8px',
                    }}
                  >
                    Change Type ▾
                  </button>
                </div>
              ) : (
                /* Full Disambiguation List matching user's screenshot with thumbnails */
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                  padding: '6px 8px',
                  marginBottom: '16px',
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px 6px',
                    borderBottom: '1px solid #f8fafc',
                  }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Select Category / Type
                    </span>
                    {selectedSubCategory && (
                      <button
                        onClick={() => { setSelectedSubCategory(null); setIsSuggestionsCollapsed(true); }}
                        style={{ background: 'none', border: 'none', color: '#16a34a', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        View All ({displayItems.length})
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {categorySuggestions.map((s, idx) => {
                      const isSelected = (s.isAll && !selectedSubCategory) || (selectedSubCategory === s.key);
                      return (
                        <div
                          key={`${s.key}-${idx}`}
                          onClick={() => {
                            if (s.isAll) {
                              setSelectedSubCategory(null);
                            } else {
                              setSelectedSubCategory(s.key);
                            }
                            setIsSuggestionsCollapsed(true);
                            trackEvent('SEARCH_CATEGORY_DISAMBIGUATION', { query: normalizedQuery, category: s.key });
                          }}
                          className="pio-press"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '9px 12px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                            transition: 'background-color 0.12s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {/* Thumbnail Box */}
                            <div style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              backgroundColor: '#fff',
                              border: isSelected ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              flexShrink: 0,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                            }}>
                              {s.topItem?.image ? (
                                <img
                                  src={s.topItem.image}
                                  alt=""
                                  style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                                  }}
                                />
                              ) : null}
                              <span style={{
                                fontSize: '1.25rem',
                                display: s.topItem?.image ? 'none' : 'block',
                              }}>
                                {s.topItem?.emoji || '🧴'}
                              </span>
                            </div>

                            {/* Label styled like screenshot */}
                            <div style={{ fontSize: '0.98rem', letterSpacing: '-0.2px' }}>
                              {renderSuggestionLabel(s.label, s.isAll)}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              fontSize: '0.78rem',
                              color: isSelected ? '#15803d' : '#94a3b8',
                              fontWeight: 600,
                            }}>
                              {s.count} item{s.count > 1 ? 's' : ''}
                            </span>
                            <span style={{ color: isSelected ? '#16a34a' : '#cbd5e1', fontSize: '0.85rem' }}>
                              ›
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )}

            {/* 🎛️ 2. STICKY FILTER & SORT CHIP BAR (Horizontal scrollable) */}
            <div style={{
              position: 'sticky', top: '70px', zIndex: 1200,
              backgroundColor: '#fff', margin: '0 -15px 12px -15px',
              padding: '8px 15px', borderBottom: '1px solid #f1f5f9',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            }}>
              <div className="hide-scroll" style={{
                display: 'flex', gap: '8px', overflowX: 'auto',
                alignItems: 'center', WebkitOverflowScrolling: 'touch',
                paddingBottom: '2px',
              }}>
                {/* Sort Button */}
                <button
                  onClick={() => setIsSortModalOpen(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '7px 14px', borderRadius: '999px',
                    fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                    whiteSpace: 'nowrap', flexShrink: 0,
                    backgroundColor: sortBy !== 'relevance' ? '#f0fdf4' : '#fff',
                    border: sortBy !== 'relevance' ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                    color: sortBy !== 'relevance' ? '#15803d' : '#334155',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m3 16 4 4 4-4" /><path d="M7 20V4" /><path d="m21 8-4-4-4 4" /><path d="M17 4v16" />
                  </svg>
                  {sortBy === 'price_asc' ? 'Price: Low to High' :
                   sortBy === 'price_desc' ? 'Price: High to Low' :
                   sortBy === 'discount_desc' ? '% Discount' : 'Sort ▾'}
                </button>

                {/* In-Stock Toggle */}
                <button
                  onClick={() => setInStockOnly(prev => !prev)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '7px 14px', borderRadius: '999px',
                    fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                    whiteSpace: 'nowrap', flexShrink: 0,
                    backgroundColor: inStockOnly ? '#f0fdf4' : '#fff',
                    border: inStockOnly ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                    color: inStockOnly ? '#15803d' : '#334155',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  {inStockOnly ? '✓ In-Stock Only' : '⚡ In-Stock Only'}
                </button>

                {/* Price Range Button */}
                <button
                  onClick={() => setIsPriceModalOpen(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '7px 14px', borderRadius: '999px',
                    fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                    whiteSpace: 'nowrap', flexShrink: 0,
                    backgroundColor: selectedPriceRange ? '#f0fdf4' : '#fff',
                    border: selectedPriceRange ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                    color: selectedPriceRange ? '#15803d' : '#334155',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  {selectedPriceRange === 'under_100' ? 'Under ₹100' :
                   selectedPriceRange === '100_300' ? '₹100 - ₹300' :
                   selectedPriceRange === '300_500' ? '₹300 - ₹500' :
                   selectedPriceRange === 'above_500' ? 'Above ₹500' : 'Price ▾'}
                  {selectedPriceRange && (
                    <span
                      onClick={(e) => { e.stopPropagation(); setSelectedPriceRange(null); }}
                      style={{ marginLeft: '4px', fontWeight: 900 }}
                    >✕</span>
                  )}
                </button>

                {/* Brand Chips */}
                {availableBrands.map(b => {
                  const isBrandActive = selectedBrand === b.name;
                  return (
                    <button
                      key={b.name}
                      onClick={() => setSelectedBrand(isBrandActive ? null : b.name)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '7px 14px', borderRadius: '999px',
                        fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                        whiteSpace: 'nowrap', flexShrink: 0,
                        backgroundColor: isBrandActive ? '#f0fdf4' : '#fff',
                        border: isBrandActive ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                        color: isBrandActive ? '#15803d' : '#334155',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      }}
                    >
                      {isBrandActive && <span>✓ </span>}
                      {b.name} ({b.count})
                    </button>
                  );
                })}

                {/* Clear All Button */}
                {hasActiveFilters && (
                  <button
                    onClick={handleClearAllFilters}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '7px 12px', borderRadius: '999px',
                      fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                      whiteSpace: 'nowrap', flexShrink: 0,
                      backgroundColor: '#fee2e2', border: '1px solid #fecaca',
                      color: '#b91c1c',
                    }}
                  >
                    ✕ Clear All
                  </button>
                )}
              </div>
            </div>

            {/* 3. PRODUCT RESULTS */}
            {finalProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                <p style={{ fontWeight: 800, color: '#0f172a', margin: '0 0 6px', fontSize: '1.05rem' }}>
                  No products match your selected filters
                </p>
                <p style={{ fontSize: '0.88rem', margin: '0 0 16px', color: '#64748b' }}>
                  Try removing some filters to see all "{debouncedQuery}" items.
                </p>
                <button
                  onClick={handleClearAllFilters}
                  style={{
                    padding: '9px 22px', background: '#16a34a', color: '#fff',
                    border: 'none', borderRadius: '12px', fontWeight: 700,
                    fontSize: '0.88rem', cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                  }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: '10px', padding: '0 2px',
                }}>
                  <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                    Showing {finalProducts.length} product{finalProducts.length > 1 ? 's' : ''}
                  </span>
                  {hasActiveFilters && (
                    <span
                      onClick={handleClearAllFilters}
                      style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Reset filters
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                  {finalProducts.slice(0, visibleCount).map((item, index) => (
                    <ModernProductCard
                      key={`${item._id}-${index}`}
                      item={item}
                      isCarousel={false}
                      shopClosed={false}
                      onOpenDetails={onOpenDetails}
                      onQuickAdd={onQuickAdd}
                      cart={safeCart}
                      onRemoveFromCart={onRemoveFromCart}
                    />
                  ))}
                </div>

                {finalProducts.length > visibleCount && (
                  <button
                    onClick={() => setVisibleCount(c => c + 24)}
                    style={{
                      display: 'block', margin: '20px auto 0', padding: '12px 24px',
                      background: '#fff', color: '#16a34a', border: '1px solid #bbf7d0',
                      borderRadius: 12, fontWeight: 800, fontSize: '0.92rem', cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(22,163,74,0.08)',
                    }}
                  >
                    Load more ({finalProducts.length - visibleCount} left)
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ⇅ SORT BOTTOM SHEET MODAL */}
      {isSortModalOpen && (
        <div
          onClick={() => setIsSortModalOpen(false)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000000, display: 'flex', alignItems: 'flex-end',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff', width: '100%',
              borderTopLeftRadius: '22px', borderTopRightRadius: '22px',
              padding: '20px 20px 30px', maxHeight: '80vh', overflowY: 'auto',
              boxShadow: '0 -4px 25px rgba(0,0,0,0.15)',
              animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Sort By</h3>
              <button
                onClick={() => setIsSortModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem', color: '#64748b' }}
              >✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { id: 'relevance', label: 'Recommended / Relevance', icon: '🌟' },
                { id: 'price_asc', label: 'Price: Low to High', icon: '💰' },
                { id: 'price_desc', label: 'Price: High to Low', icon: '💎' },
                { id: 'discount_desc', label: 'Biggest Discount (% Off)', icon: '🏷️' },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => { setSortBy(opt.id); setIsSortModalOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', borderRadius: '14px', cursor: 'pointer',
                    backgroundColor: sortBy === opt.id ? '#f0fdf4' : '#f8fafc',
                    border: sortBy === opt.id ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                    fontWeight: sortBy === opt.id ? 700 : 600,
                    color: sortBy === opt.id ? '#15803d' : '#1e293b',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>{opt.icon}</span> {opt.label}
                  </span>
                  <input
                    type="radio"
                    name="search_sort"
                    checked={sortBy === opt.id}
                    onChange={() => { setSortBy(opt.id); setIsSortModalOpen(false); }}
                    style={{ accentColor: '#16a34a', width: '18px', height: '18px' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 💰 PRICE RANGE BOTTOM SHEET MODAL */}
      {isPriceModalOpen && (
        <div
          onClick={() => setIsPriceModalOpen(false)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000000, display: 'flex', alignItems: 'flex-end',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff', width: '100%',
              borderTopLeftRadius: '22px', borderTopRightRadius: '22px',
              padding: '20px 20px 30px', maxHeight: '80vh', overflowY: 'auto',
              boxShadow: '0 -4px 25px rgba(0,0,0,0.15)',
              animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Filter by Price</h3>
              <button
                onClick={() => setIsPriceModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem', color: '#64748b' }}
              >✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { id: null, label: 'All Prices' },
                { id: 'under_100', label: 'Under ₹100' },
                { id: '100_300', label: '₹100 - ₹300' },
                { id: '300_500', label: '₹300 - ₹500' },
                { id: 'above_500', label: 'Above ₹500' },
              ].map((opt) => (
                <div
                  key={String(opt.id)}
                  onClick={() => { setSelectedPriceRange(opt.id); setIsPriceModalOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', borderRadius: '14px', cursor: 'pointer',
                    backgroundColor: selectedPriceRange === opt.id ? '#f0fdf4' : '#f8fafc',
                    border: selectedPriceRange === opt.id ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                    fontWeight: selectedPriceRange === opt.id ? 700 : 600,
                    color: selectedPriceRange === opt.id ? '#15803d' : '#1e293b',
                  }}
                >
                  <span>{opt.label}</span>
                  <input
                    type="radio"
                    name="search_price"
                    checked={selectedPriceRange === opt.id}
                    onChange={() => { setSelectedPriceRange(opt.id); setIsPriceModalOpen(false); }}
                    style={{ accentColor: '#16a34a', width: '18px', height: '18px' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING CART */}
      {cartTotalItems > 0 && (
        <div onClick={() => { onClose(); if (onViewCart) onViewCart(); }} style={{
          position: 'fixed', bottom: `calc(${BOTTOM_NAV_HEIGHT} + 15px)`,
          left: '12px', right: '12px', zIndex: 101,
          backgroundColor: '#0c831f', color: '#fff',
          padding: '10px 14px', borderRadius: '10px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.2)', width: '38px', height: '38px',
              borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center',
              fontSize: '1.2rem',
            }}>🛒</div>
            <div style={{ textAlign: 'left', lineHeight: 1.3 }}>
              <div style={{ fontWeight: 600, fontSize: '0.75rem', opacity: 0.95 }}>{cartTotalItems} item{cartTotalItems > 1 ? 's' : ''}</div>
              <div style={{ fontWeight: 800, fontSize: '1rem' }}>₹{cartTotalPrice.toFixed(2)}</div>
            </div>
          </div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '4px' }}>View Cart ▶</div>
        </div>
      )}

      {/* 🎙️ SMART VOICE SEARCH MODAL */}
      <VoiceSearchModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSearch={handleVoiceSearchResult}
      />
    </div>,
    document.body
  );
}

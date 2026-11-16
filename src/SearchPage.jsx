import React, { useState, useEffect, useMemo, useRef } from 'react';
import Fuse from 'fuse.js';
import { createPortal } from 'react-dom';
import EnhancedProductCard from './components/search/EnhancedProductCard.jsx';
import SearchAutocompleteOverlay from './components/search/SearchAutocompleteOverlay.jsx';
import SearchFilterBar from './components/search/SearchFilterBar.jsx';
import { getVisualSuggestions } from './utils/categoryThumbnailMap.js';
import { extractDynamicFilters, applyFiltersAndSort } from './utils/dynamicFilterExtractor.js';
import { useRankingConfig } from './ui/RankingProvider.jsx';
import { applyBrandPriority } from './utils/rankingSort.js';
import { trackEvent } from './utils/analyticsEngine.js';
import VoiceSearchModal from './components/VoiceSearchModal.jsx';
import { translateDevanagari } from './utils/voiceSearchCleaner.js';

const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

// Curated category prompts shown before the user types anything.
// Each entry maps a friendly label to the search term we plug in.
const POPULAR_CATEGORIES = [
  { label: 'Milk',       query: 'milk',       emoji: '🥛' },
  { label: 'Bread',      query: 'bread',      emoji: '🍞' },
  { label: 'Eggs',       query: 'egg',        emoji: '🥚' },
  { label: 'Chips',      query: 'chips',      emoji: '🍟' },
  { label: 'Maggi',      query: 'maggi',      emoji: '🍜' },
  { label: 'Cold drink', query: 'drink',      emoji: '🥤' },
  { label: 'Chocolate',  query: 'chocolate',  emoji: '🍫' },
  { label: 'Ice cream',  query: 'ice cream',  emoji: '🍦' },
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

  // Autocomplete overlay state
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);

  // Dynamic filter and sorting states
  const [activeCategory, setActiveCategory] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [activeSort, setActiveSort] = useState("relevance");
  const [serverFilterData, setServerFilterData] = useState(null);

  // Lazy load results for long lists
  const [visibleCount, setVisibleCount] = useState(16);

  // Avoid double-logging the same missed term in one session
  const loggedMissedTermsRef = useRef(new Set());

  const inputRef = useRef(null);
  const BOTTOM_NAV_HEIGHT = '75px';

  // Load recent searches from localStorage
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

  // 1. Smart Autocomplete suggestions fetch (immediate reactive fallback + async endpoint)
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setAutocompleteSuggestions([]);
      setIsAutocompleteOpen(false);
      return;
    }

    // Immediate reactive local suggestions with category thumbnails
    const localSuggestions = getVisualSuggestions(q, flatItems, 8);
    setAutocompleteSuggestions(localSuggestions);

    let cancelled = false;
    const shopParam = effectiveShopId ? `&shopId=${encodeURIComponent(effectiveShopId)}` : '';
    fetch(`${BASE_URL}/catalog/autocomplete?q=${encodeURIComponent(q)}${shopParam}&limit=8`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (cancelled || !data) return;
        if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          setAutocompleteSuggestions(data.suggestions);
        }
      })
      .catch(() => {
        // Keep local fallback suggestions
      });

    return () => {
      cancelled = true;
    };
  }, [query, flatItems, effectiveShopId]);

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

    const params = new URLSearchParams();
    params.set('q', q);
    params.set('limit', '40');
    if (activeCategory) params.set('category', activeCategory);
    if (activeFilters.category) params.set('category', activeFilters.category);
    if (activeFilters.gender) params.set('gender', activeFilters.gender);
    if (activeFilters.grainType) params.set('grainType', activeFilters.grainType);
    if (activeFilters.brand) {
      const b = Array.isArray(activeFilters.brand) ? activeFilters.brand.join(',') : activeFilters.brand;
      params.set('brand', b);
    }
    if (activeFilters.minPrice !== undefined) params.set('minPrice', activeFilters.minPrice);
    if (activeFilters.maxPrice !== undefined) params.set('maxPrice', activeFilters.maxPrice);
    if (activeSort && activeSort !== 'relevance') params.set('sort', activeSort);

    fetch(`${BASE_URL}/shops/${effectiveShopId}/search?${params.toString()}`)
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
  }, [normalizedQuery, effectiveShopId, activeCategory, activeFilters, activeSort]);

  // Context-aware dynamic filters fetch from backend API
  useEffect(() => {
    const q = (normalizedQuery || debouncedQuery).trim();
    if (q.length < 2) {
      setServerFilterData(null);
      return;
    }
    let cancelled = false;
    const params = new URLSearchParams();
    params.set('q', q);
    if (activeCategory) params.set('category', activeCategory);
    if (effectiveShopId) params.set('shopId', effectiveShopId);

    fetch(`${BASE_URL}/catalog/filters?${params.toString()}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (cancelled || !data) return;
        if (Array.isArray(data.filterPills) && data.filterPills.length > 0) {
          setServerFilterData(data);
        }
      })
      .catch(() => {
        // Keep dynamic local filter extraction
      });

    return () => {
      cancelled = true;
    };
  }, [normalizedQuery, debouncedQuery, activeCategory, effectiveShopId]);

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

  // Raw matched products for the query before active filters are applied
  const rawSearchResults = useMemo(() => {
    const q = normalizedQuery;
    if (q.length === 0) return [];
    const results = fuse.search(q);

    // Deduplicate by familyId so multi-variant families only produce 1 consolidated card
    const seenFamilyIds = new Set();
    const matches = [];

    for (const r of results) {
      const it = r.item;
      const famId = it._familyId || String(it._id);
      if (!seenFamilyIds.has(famId)) {
        seenFamilyIds.add(famId);
        matches.push(it);
      }
    }

    // Fast token scan across any remaining items beyond 2,500
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (flatItems.length > 2500 && tokens.length > 0) {
      for (let i = 2500; i < flatItems.length; i++) {
        const it = flatItems[i];
        if (!it) continue;
        const famId = it._familyId || String(it._id);
        if (seenFamilyIds.has(famId)) continue;

        const tagsStr = Array.isArray(it.searchTags) ? it.searchTags.join(' ') : (it.searchTags || '');
        const hay = `${it.name || ''} ${it.brand || ''} ${it.category || ''} ${it.subCategory || ''} ${it.barcode || ''} ${tagsStr}`.toLowerCase();
        if (tokens.every(t => hay.includes(t))) {
          seenFamilyIds.add(famId);
          matches.push(it);
          if (matches.length >= 80) break;
        }
      }
    }

    // Merge server-side search results cleanly
    for (const sItem of serverResults) {
      if (sItem && sItem._id) {
        const famId = sItem.itemGroupId || String(sItem._id);
        if (!seenFamilyIds.has(famId)) {
          seenFamilyIds.add(famId);
          matches.push(sItem);
        }
      }
    }

    return applyBrandPriority(matches, rankingConfig);
  }, [normalizedQuery, fuse, flatItems, serverResults, rankingConfig]);

  // Dynamically compute available filter pills and price range based on query and matches
  const localDynamicFilters = useMemo(() => {
    if (rawSearchResults.length === 0 && !query) {
      return { filterPills: [], priceRange: { min: 0, max: 1000 } };
    }
    return extractDynamicFilters(rawSearchResults, normalizedQuery || query, activeCategory);
  }, [rawSearchResults, normalizedQuery, query, activeCategory]);

  const filterPills = (serverFilterData && Array.isArray(serverFilterData.filterPills) && serverFilterData.filterPills.length > 0)
    ? serverFilterData.filterPills
    : (localDynamicFilters.filterPills || []);

  const priceRange = serverFilterData?.priceRange || localDynamicFilters.priceRange || { min: 0, max: 1000 };

  // Final displayed items with active facet filtering and sorting applied
  const displayItems = useMemo(() => {
    if (rawSearchResults.length === 0) return [];
    return applyFiltersAndSort(rawSearchResults, activeFilters, activeSort);
  }, [rawSearchResults, activeFilters, activeSort]);

  // Type-ahead chips while typing. Capped at 6 to keep UI tight.
  const liveSuggestions = useMemo(() => {
    const raw = translateDevanagari(query).trim().toLowerCase();
    if (raw.length === 0) return [];
    const seen = new Set();
    const out = [];
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

    // If query returned raw products but active filter narrowed it to 0, do not treat as missed term
    if (rawSearchResults.length > 0) return;

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
    }).catch(() => { /* swallow */ });

    return () => { cancelled = true; };
  }, [normalizedQuery, debouncedQuery, displayItems.length, rawSearchResults.length, isServerSearching]);

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

  const handleClearSearch = () => {
    setQuery("");
    setDebouncedQuery("");
    setIsAutocompleteOpen(false);
    setActiveCategory("");
    setActiveFilters({});
    setActiveSort("relevance");
    inputRef.current?.focus();
  };

  // When clicking an autocomplete suggestion (e.g. "Powder", "Face powder", "Talcum powder")
  const handleSelectSuggestion = (suggestion) => {
    const selectedText = suggestion.text || suggestion.category || '';
    setQuery(selectedText);
    setDebouncedQuery(selectedText);
    setIsAutocompleteOpen(false);

    // Apply associated category or subCategory filter
    if (suggestion.category) {
      setActiveCategory(suggestion.category);
      setActiveFilters({
        category: suggestion.category,
        ...(suggestion.subCategory && suggestion.type === 'subCategory' ? { subCategory: suggestion.subCategory } : {}),
      });
    } else {
      setActiveCategory('');
      setActiveFilters({});
    }

    if (selectedText.trim().length > 1) {
      setRecentSearches(prev => {
        const updated = [selectedText.trim(), ...prev.filter(q => q.toLowerCase() !== selectedText.toLowerCase())].slice(0, 5);
        try { localStorage.setItem('packitout_recent_searches', JSON.stringify(updated)); } catch {}
        return updated;
      });
    }

    trackEvent('AUTOCOMPLETE_SUGGESTION_CLICK', {
      id: suggestion.id,
      text: suggestion.text,
      category: suggestion.category,
      type: suggestion.type,
    });

    inputRef.current?.blur();
  };

  const applySuggestion = (term, category = '') => {
    setQuery(term);
    setDebouncedQuery(term);
    setIsAutocompleteOpen(false);
    if (category) {
      setActiveCategory(category);
      setActiveFilters({ category });
    } else {
      setActiveCategory('');
      setActiveFilters({});
    }
    inputRef.current?.focus();
  };

  const handleVoiceSearchResult = (cleanTerm) => {
    if (cleanTerm && cleanTerm.trim()) {
      const term = cleanTerm.trim();
      setQuery(term);
      setDebouncedQuery(term);
      setIsAutocompleteOpen(false);
      setActiveCategory('');
      setActiveFilters({});
      trackEvent('VOICE_SEARCH_SUCCESS', { query: term });
      inputRef.current?.focus();
    }
  };

  const handleFilterChange = (newFilters) => {
    setActiveFilters(newFilters);
    setVisibleCount(16);
  };

  const handleSortChange = (newSortId) => {
    setActiveSort(newSortId);
    setVisibleCount(16);
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setActiveSort("relevance");
    setActiveCategory("");
    setVisibleCount(16);
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
        @keyframes skeletonPulse {
          0% { background-color: #f1f5f9; }
          50% { background-color: #e2e8f0; }
          100% { background-color: #f1f5f9; }
        }
      `}</style>

      {/* SEARCH HEADER CONTAINER */}
      <div style={{
        position: 'sticky', top: 0,
        backgroundColor: '#fff', zIndex: 2000,
        borderBottom: '1px solid #f1f5f9',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
      }}>
        <div style={{ position: 'relative', padding: '12px 15px 10px' }}>
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
              onChange={(e) => {
                const val = e.target.value;
                setQuery(val);
                if (val.trim().length > 0) {
                  setIsAutocompleteOpen(true);
                } else {
                  setIsAutocompleteOpen(false);
                }
                setActiveCategory('');
                setActiveFilters({});
                setActiveSort('relevance');
              }}
              onFocus={() => {
                if (query.trim().length > 0) {
                  setIsAutocompleteOpen(true);
                }
              }}
              onClick={() => {
                inputRef.current?.focus();
                if (query.trim().length > 0) {
                  setIsAutocompleteOpen(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsAutocompleteOpen(false);
                  inputRef.current?.blur();
                }
              }}
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
                onClick={handleClearSearch}
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

          {/* Floating visual autocomplete suggestions with category thumbnails */}
          <SearchAutocompleteOverlay
            isOpen={isAutocompleteOpen && autocompleteSuggestions.length > 0}
            query={query}
            suggestions={autocompleteSuggestions}
            onSelectSuggestion={handleSelectSuggestion}
            onClose={() => setIsAutocompleteOpen(false)}
          />
        </div>

        {/* Live type-ahead chips (shown when autocomplete overlay is closed but query is typed) */}
        {!isAutocompleteOpen && query.trim().length > 0 && liveSuggestions.length > 0 && (
          <div className="hide-scroll" style={{
            display: 'flex', gap: '8px', overflowX: 'auto',
            padding: '0 15px 10px',
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

        {/* Context-Aware Dynamic Filter Bar (Mounted directly below search header when on results view) */}
        {query.trim().length > 0 && (
          <SearchFilterBar
            filterPills={filterPills}
            activeFilters={activeFilters}
            activeSort={activeSort}
            priceRange={priceRange}
            onFilterChange={handleFilterChange}
            onSortChange={handleSortChange}
            onClearFilters={handleClearFilters}
          />
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
              {rawSearchResults.length > 0 ? 'No products match your selected filters' : `No products for "${debouncedQuery}"`}
            </p>
            {rawSearchResults.length > 0 ? (
              <div style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  style={{
                    padding: '8px 18px',
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '999px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
              {displayItems.slice(0, visibleCount).map((item, index) => (
                <EnhancedProductCard
                  key={`${item._id || item._familyId}-${index}`}
                  item={item}
                  cart={safeCart}
                  onQuickAdd={onQuickAdd}
                  onRemoveFromCart={onRemoveFromCart}
                  onOpenDetails={onOpenDetails}
                />
              ))}
            </div>
            {/* Load more button */}
            {displayItems.length > visibleCount && (
              <button
                onClick={() => setVisibleCount(c => c + 24)}
                style={{
                  display: 'block', margin: '20px auto 0', padding: '12px 24px',
                  background: '#fff', color: '#16a34a', border: '1px solid #bbf7d0',
                  borderRadius: 12, fontWeight: 800, fontSize: '0.92rem', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(22,163,74,0.08)',
                }}
              >
                Load more ({displayItems.length - visibleCount} left)
              </button>
            )}
          </>
        )}
      </div>

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

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ModernProductCard } from './ProductFeed/FeedComponents.jsx';
import { useRankingConfig } from './ui/RankingProvider.jsx';
import { applyBrandPriority } from './utils/rankingSort.js';

const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

// Curated category prompts shown before the user types anything.
// Each entry maps a friendly label to the search term we plug in.
const POPULAR_CATEGORIES = [
  { label: 'Milk',      query: 'milk',      emoji: '🥛' },
  { label: 'Bread',     query: 'bread',     emoji: '🍞' },
  { label: 'Eggs',      query: 'egg',       emoji: '🥚' },
  { label: 'Chips',     query: 'chips',     emoji: '🍟' },
  { label: 'Maggi',     query: 'maggi',     emoji: '🍜' },
  { label: 'Cold drink',query: 'cola',      emoji: '🥤' },
  { label: 'Chocolate', query: 'chocolate', emoji: '🍫' },
  { label: 'Ice cream', query: 'ice cream', emoji: '🍦' },
];

export default function SearchPage({
  items = [],
  onClose,
  onOpenDetails,
  onQuickAdd,
  cart = [],
  onRemoveFromCart,
  onViewCart
}) {
  const { config: rankingConfig } = useRankingConfig();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);

  // Lazy load results for long lists
  const [visibleCount, setVisibleCount] = useState(16);

  // Avoid double-logging the same missed term in one session
  const loggedMissedTermsRef = useRef(new Set());

  const inputRef = useRef(null);
  const BOTTOM_NAV_HEIGHT = '56px';

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

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const focusTimer = setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 100);
    return () => {
      document.body.style.overflow = '';
      clearTimeout(focusTimer);
    };
  }, []);

  // Flatten variants once — used by both type-ahead and results
  const flatItems = useMemo(() => (
    items.flatMap(item => {
      if (item.variants && item.variants.length > 0) {
        return item.variants.map(variant => ({
          ...item,
          ...variant,
          variants: item.variants
        }));
      }
      return item;
    })
  ), [items]);

  const matchesQuery = (item, q) => {
    if (!item) return false;
    const nameMatch = (item.name || "").toLowerCase().includes(q);
    const brandMatch = (item.brand || "").toLowerCase().includes(q);
    const tagMatch = item.searchTags && Array.isArray(item.searchTags) &&
      item.searchTags.some(tag => tag.toLowerCase().includes(q));
    return nameMatch || brandMatch || tagMatch;
  };

  const displayItems = useMemo(() => {
    if (debouncedQuery.trim().length === 0) return [];
    const q = debouncedQuery.toLowerCase();
    const matches = flatItems.filter(item => matchesQuery(item, q));
    return applyBrandPriority(matches, rankingConfig);
  }, [debouncedQuery, flatItems, rankingConfig]);

  // Type-ahead chips while typing. Pulls unique product names/brands that
  // start with or contain the live (un-debounced) query so it feels instant.
  // Capped at 6 to keep the UI tight.
  const liveSuggestions = useMemo(() => {
    const raw = query.trim().toLowerCase();
    if (raw.length === 0) return [];
    const seen = new Set();
    const out = [];
    // Prioritize "starts with" over "contains"
    const startsWith = [];
    const contains = [];
    for (const item of flatItems) {
      const candidates = [item.name, item.brand].filter(Boolean);
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

  // Log missed searches once per term per session
  useEffect(() => {
    const term = debouncedQuery.trim().toLowerCase();
    if (term.length < 3) return;
    if (displayItems.length > 0) return;
    // We only log if the user actually settled on this term (debounced).
    if (loggedMissedTermsRef.current.has(term)) return;
    loggedMissedTermsRef.current.add(term);

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
  }, [debouncedQuery, displayItems.length]);

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
          {query && (
            <button onClick={() => { setQuery(""); setDebouncedQuery(""); inputRef.current?.focus(); }} style={{
              background: 'none', border: 'none', fontSize: '1.2rem',
              color: '#94a3b8', cursor: 'pointer', padding: 0,
            }}>✖</button>
          )}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
              {displayItems.slice(0, visibleCount).map((item, index) => (
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
            {/* Load more — without this, results beyond visibleCount (16) were
                permanently hidden and customers couldn't find products that
                only matched on a later page. */}
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
    </div>,
    document.body
  );
}

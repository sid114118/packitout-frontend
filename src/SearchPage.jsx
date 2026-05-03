import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';

// 🟢 MAKE SURE THIS PATH IS CORRECT FOR YOUR APP!
import { ModernProductCard } from './FeedComponents.jsx';

export default function SearchPage({ 
  items = [], 
  onClose, 
  onOpenDetails, 
  onQuickAdd, 
  cart = [], 
  onRemoveFromCart, 
  onViewCart 
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(""); 
  const [recentSearches, setRecentSearches] = useState([]);
  
  // 🚀 LAZY LOADING STATE
  const [visibleCount, setVisibleCount] = useState(16);
  
  const inputRef = useRef(null); 
  const BOTTOM_NAV_HEIGHT = '56px';

  useEffect(() => {
    const savedSearches = localStorage.getItem('packitout_recent_searches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  // 🚀 DEBOUNCE ENGINE (waits 300ms after you stop typing to search)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setVisibleCount(16);
  }, [debouncedQuery]);

  useEffect(() => {
    if (debouncedQuery.trim().length > 2) { 
      setRecentSearches(prev => {
        const term = debouncedQuery.trim();
        const updated = [term, ...prev.filter(q => q.toLowerCase() !== term.toLowerCase())].slice(0, 5);
        localStorage.setItem('packitout_recent_searches', JSON.stringify(updated));
        return updated;
      });
    }
  }, [debouncedQuery]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const focusTimer = setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
    return () => { 
      document.body.style.overflow = ''; 
      clearTimeout(focusTimer);
    };
  }, []);

  const displayItems = useMemo(() => {
    if (debouncedQuery.trim().length === 0) return [];
    
    const flattenedItems = items.flatMap(item => {
      if (item.variants && item.variants.length > 0) {
        return item.variants.map(variant => ({
          ...item,      
          ...variant,   
          variants: item.variants
        }));
      }
      return item;
    });

    return flattenedItems.filter(item => {
      if (!item) return false; 
      const q = debouncedQuery.toLowerCase();
      const nameMatch = (item.name || "").toLowerCase().includes(q);
      const brandMatch = (item.brand || "").toLowerCase().includes(q);
      const tagMatch = item.searchTags && Array.isArray(item.searchTags) && item.searchTags.some(tag => tag.toLowerCase().includes(q));
      return nameMatch || brandMatch || tagMatch;
    });
  }, [debouncedQuery, items]);

  const safeCart = Array.isArray(cart) ? cart.filter(c => c !== null) : [];
  const cartTotalItems = safeCart.reduce((total, item) => total + (Number(item.qty) || 1), 0);
  const cartTotalPrice = safeCart.reduce((total, item) => {
    const price = Number(item.sellingPrice !== undefined ? item.sellingPrice : (item.mrp || 0));
    return total + (price * (Number(item.qty) || 1));
  }, 0);

  // If query is different from debouncedQuery, the user is actively typing!
  const isTyping = query.trim().length > 0 && query !== debouncedQuery;

  const handleClearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('packitout_recent_searches');
  };

  const handleRecentClick = (term) => {
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

  return createPortal(
    <div 
      onScroll={handleScroll}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: BOTTOM_NAV_HEIGHT, backgroundColor: '#fff', zIndex: 999999, overflowY: 'auto', animation: 'fadeIn 0.2s ease', paddingBottom: cartTotalItems > 0 ? '120px' : '40px', fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* 🌟 ANIMATIONS FOR SHIMMER CARDS AND FADE IN */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes skeletonPulse {
          0% { backgroundColor: #f1f5f9; }
          50% { backgroundColor: #e2e8f0; }
          100% { backgroundColor: #f1f5f9; }
        }
      `}</style>
      
      {/* 🌟 SEARCH HEADER */}
      <div style={{ padding: '15px', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 2000, borderBottom: '1px solid #f1f5f9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: '12px', padding: '8px 12px' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', padding: '0 10px 0 0', color: '#475569', display: 'flex', alignItems: 'center' }}>←</button>
          <input
            ref={inputRef}
            type="text"
            placeholder='Search "Maggi", "Milk"...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClick={() => inputRef.current?.focus()} 
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '1.05rem', fontWeight: '500', backgroundColor: 'transparent', color: '#111827', userSelect: 'auto', WebkitUserSelect: 'auto', touchAction: 'manipulation' }}
          />
          {query && (
            <button onClick={() => { setQuery(""); setDebouncedQuery(""); inputRef.current?.focus(); }} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer', padding: 0 }}>✖</button>
          )}
        </div>
      </div>

      {/* 🌟 SEARCH RESULTS */}
      <div style={{ padding: '15px' }}>
        {query.trim().length === 0 ? (
          recentSearches.length > 0 ? (
            <div style={{ padding: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#111827', fontWeight: '800' }}>Recent Searches</h3>
                <button onClick={handleClearRecent} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}>Clear</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {recentSearches.map((term, i) => (
                  <div key={i} onClick={() => handleRecentClick(term)} style={{ padding: '8px 16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px', fontSize: '0.95rem', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                    <span style={{color: '#94a3b8', fontSize: '0.85rem'}}>🕒</span> {term}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⌨️</div>
              <p style={{ fontWeight: '600', fontSize: '1.1rem' }}>Type to start searching...</p>
            </div>
          )
        ) : isTyping ? (

          /* 🌟 BLINKIT STYLE SKELETON LOADER (SHIMMER CARDS) 🌟 */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} style={{ border: '1px solid #f1f5f9', borderRadius: '16px', padding: '10px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', height: '230px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                {/* Image Placeholder */}
                <div style={{ height: '110px', width: '100%', borderRadius: '12px', marginBottom: '12px', animation: 'skeletonPulse 1.5s infinite ease-in-out' }} />
                {/* Qty Placeholder */}
                <div style={{ height: '10px', width: '30%', borderRadius: '4px', marginBottom: '8px', animation: 'skeletonPulse 1.5s infinite ease-in-out' }} />
                {/* Title Placeholder */}
                <div style={{ height: '14px', width: '85%', borderRadius: '4px', marginBottom: '6px', animation: 'skeletonPulse 1.5s infinite ease-in-out' }} />
                <div style={{ height: '14px', width: '60%', borderRadius: '4px', marginBottom: 'auto', animation: 'skeletonPulse 1.5s infinite ease-in-out' }} />
                {/* Bottom Row Placeholder (Price + Button) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <div style={{ height: '18px', width: '50px', borderRadius: '4px', animation: 'skeletonPulse 1.5s infinite ease-in-out' }} />
                  <div style={{ height: '28px', width: '60px', borderRadius: '8px', animation: 'skeletonPulse 1.5s infinite ease-in-out' }} />
                </div>
              </div>
            ))}
          </div>

        ) : displayItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔍</div>
            <p style={{ fontWeight: 'bold' }}>No products found for "{query}"</p>
          </div>
        ) : (
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
        )}
      </div>

      {/* 🌟 FLOATING CART */}
      {cartTotalItems > 0 && (
        <div onClick={() => { onClose(); if (onViewCart) onViewCart(); }} style={{ position: 'fixed', bottom: `calc(${BOTTOM_NAV_HEIGHT} + 15px)`, left: '12px', right: '12px', zIndex: 101, backgroundColor: '#0c831f', color: '#fff', padding: '10px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem' }}>🛒</div>
            <div style={{ textAlign: 'left', lineHeight: '1.3' }}>
              <div style={{ fontWeight: '600', fontSize: '0.75rem', opacity: 0.95 }}>{cartTotalItems} item{cartTotalItems > 1 ? 's' : ''}</div>
              <div style={{ fontWeight: '800', fontSize: '1rem' }}>₹{cartTotalPrice.toFixed(2)}</div>
            </div>
          </div>
          <div style={{ fontWeight: '800', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '4px' }}>View Cart ▶</div>
        </div>
      )}
    </div>,
    document.body
  );
                }

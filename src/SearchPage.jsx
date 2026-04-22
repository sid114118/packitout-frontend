import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';

// 🟢 MAKE SURE THIS PATH IS CORRECT FOR YOUR APP!
import { ModernProductCard } from './ProductFeed/FeedComponents.jsx';

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
  
  // 🌟 NEW: Recent Searches State
  const [recentSearches, setRecentSearches] = useState([]);
  
  const inputRef = useRef(null); 
  const BOTTOM_NAV_HEIGHT = '56px';

  // 🌟 NEW: Load Recent Searches on mount
  useEffect(() => {
    const savedSearches = localStorage.getItem('packitout_recent_searches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  // 🚀 DEBOUNCE ENGINE
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // 🌟 NEW: Save successful searches to Recent Searches
  useEffect(() => {
    if (debouncedQuery.trim().length > 2) { // Only save if they typed at least 3 letters
      setRecentSearches(prev => {
        const term = debouncedQuery.trim();
        // Remove duplicates and keep only top 5
        const updated = [term, ...prev.filter(q => q.toLowerCase() !== term.toLowerCase())].slice(0, 5);
        localStorage.setItem('packitout_recent_searches', JSON.stringify(updated));
        return updated;
      });
    }
  }, [debouncedQuery]);

  // Lock background scroll & safely trigger keyboard on load
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

  // 🛡️ SAFE FILTERING LOGIC
  const displayItems = useMemo(() => {
    if (debouncedQuery.trim().length === 0) return [];
    
    return items.filter(item => {
      if (!item) return false; 
      const q = debouncedQuery.toLowerCase();
      const nameMatch = (item.name || "").toLowerCase().includes(q);
      const brandMatch = (item.brand || "").toLowerCase().includes(q);
      const tagMatch = item.searchTags && Array.isArray(item.searchTags) && item.searchTags.some(tag => tag.toLowerCase().includes(q));
      return nameMatch || brandMatch || tagMatch;
    });
  }, [debouncedQuery, items]);

  // 🛡️ SAFE CART MATH
  const safeCart = Array.isArray(cart) ? cart.filter(c => c !== null) : [];
  const cartTotalItems = safeCart.reduce((total, item) => total + (Number(item.qty) || 1), 0);
  const cartTotalPrice = safeCart.reduce((total, item) => {
    const price = Number(item.sellingPrice !== undefined ? item.sellingPrice : (item.mrp || 0));
    return total + (price * (Number(item.qty) || 1));
  }, 0);

  const isTyping = query.trim().length > 0 && query !== debouncedQuery;

  // Helper functions for recent searches
  const handleClearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('packitout_recent_searches');
  };

  const handleRecentClick = (term) => {
    setQuery(term);
    setDebouncedQuery(term);
    inputRef.current?.focus();
  };

  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: BOTTOM_NAV_HEIGHT, backgroundColor: '#fff', zIndex: 999999, overflowY: 'auto', animation: 'fadeIn 0.2s ease', paddingBottom: cartTotalItems > 0 ? '120px' : '40px' }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      
      {/* 🌟 UPDATED SEARCH HEADER 🌟 */}
      <div style={{ padding: '15px', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 2000, borderBottom: '1px solid #f1f5f9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        
        {/* Everything inside the grey background now! */}
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: '12px', padding: '8px 12px' }}>
          
          {/* Back button moved INSIDE the bar, icon removed */}
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', padding: '0 10px 0 0', color: '#475569', display: 'flex', alignItems: 'center' }}>
            ←
          </button>
          
          {/* 🟢 THE FIXED INPUT BAR */}
          <input
            ref={inputRef}
            type="text"
            placeholder='Search "Maggi", "Milk"...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClick={() => inputRef.current?.focus()} 
            style={{ 
              border: 'none', 
              outline: 'none', 
              width: '100%', 
              fontSize: '1.05rem', 
              fontWeight: '500', 
              backgroundColor: 'transparent', 
              color: '#111827',
              userSelect: 'auto',
              WebkitUserSelect: 'auto',
              touchAction: 'manipulation'
            }}
          />
          
          {query && (
            <button 
              onClick={() => { 
                setQuery(""); 
                setDebouncedQuery(""); 
                inputRef.current?.focus(); 
              }} 
              style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
            >
              ✖
            </button>
          )}
        </div>
      </div>

      {/* 🌟 SEARCH RESULTS & RECENT 🌟 */}
      <div style={{ padding: '15px' }}>
        {query.trim().length === 0 ? (
          
          // 🌟 NEW: SHOW RECENT SEARCHES OR EMPTY STATE
          recentSearches.length > 0 ? (
            <div style={{ padding: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#111827', fontWeight: '800' }}>Recent Searches</h3>
                <button onClick={handleClearRecent} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}>Clear</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {recentSearches.map((term, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleRecentClick(term)} 
                    style={{ padding: '8px 16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px', fontSize: '0.95rem', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}
                  >
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
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <p style={{ fontWeight: 'bold', fontSize: '1.1rem', animation: 'pulse 1.5s infinite' }}>Searching 3,000+ items...</p>
            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
          </div>
        ) : displayItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔍</div>
            <p style={{ fontWeight: 'bold' }}>No products found for "{query}"</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
            {displayItems.map((item, index) => (
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

      {/* 🌟 FLOATING CART 🌟 */}
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

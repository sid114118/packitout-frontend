import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// 🟢 FIX: Pointing inside the ProductFeed folder!
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
  const inputRef = useRef(null);
  const BOTTOM_NAV_HEIGHT = '56px';

  // Lock background scroll and Auto-Focus the input
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    if (inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 50); // Pops keyboard instantly
    }
    return () => { document.body.style.overflow = ''; };
  }, []);

  // 🛡️ SAFE FILTERING LOGIC
  const displayItems = query.trim().length === 0 ? [] : items.filter(item => {
    if (!item) return false; // Skips corrupted data
    const q = query.toLowerCase();
    const nameMatch = (item.name || "").toLowerCase().includes(q);
    const brandMatch = (item.brand || "").toLowerCase().includes(q);
    const tagMatch = item.searchTags && Array.isArray(item.searchTags) && item.searchTags.some(tag => tag.toLowerCase().includes(q));
    return nameMatch || brandMatch || tagMatch;
  });

  // 🛡️ SAFE CART MATH
  const safeCart = Array.isArray(cart) ? cart.filter(c => c !== null) : [];
  const cartTotalItems = safeCart.reduce((total, item) => total + (Number(item.qty) || 1), 0);
  const cartTotalPrice = safeCart.reduce((total, item) => {
    const price = Number(item.sellingPrice !== undefined ? item.sellingPrice : (item.mrp || 0));
    return total + (price * (Number(item.qty) || 1));
  }, 0);

  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: BOTTOM_NAV_HEIGHT, backgroundColor: '#fff', zIndex: 99999, overflowY: 'auto', animation: 'fadeIn 0.2s ease', paddingBottom: cartTotalItems > 0 ? '120px' : '40px' }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      
      {/* 🌟 SEARCH HEADER 🌟 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 10, borderBottom: '1px solid #f1f5f9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: '0 5px', color: '#334155', display: 'flex', alignItems: 'center' }}>
          ←
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: '12px', padding: '8px 12px' }}>
          <span style={{ marginRight: '8px', fontSize: '1.1rem' }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder='Search "Maggi", "Milk"...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '1rem', backgroundColor: 'transparent', color: '#0f172a' }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer', padding: 0 }}>✖</button>
          )}
        </div>
      </div>

      {/* 🌟 SEARCH RESULTS 🌟 */}
      <div style={{ padding: '15px' }}>
        {query.trim().length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⌨️</div>
            <p style={{ fontWeight: '600', fontSize: '1.1rem' }}>Type to start searching...</p>
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

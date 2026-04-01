import React, { useEffect } from 'react';
import { ModernProductCard } from './FeedComponents.jsx';

export default function ProductListView({ 
  title, 
  items, 
  onBack, 
  shopClosed, 
  onOpenDetails, 
  onQuickAdd, 
  cart, 
  onRemoveFromCart 
}) {
  const BOTTOM_NAV_HEIGHT = '56px';

  // Freeze background scrolling when this list opens
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: BOTTOM_NAV_HEIGHT, backgroundColor: '#fff', zIndex: 90, overflowY: 'auto', padding: '15px', animation: 'fadeIn 0.2s ease', paddingBottom: '120px' }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      
      {/* Sticky Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px', position: 'sticky', top: '-15px', backgroundColor: '#fff', padding: '15px 0', zIndex: 91, borderBottom: '1px solid #f1f5f9' }}>
        <button 
          onClick={onBack} 
          style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#334155' }}
        >
          ⬅ Back
        </button>
        <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem' }}>{title}</h2>
      </div>
      
      {/* Product Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
        {items.map(item => (
          <ModernProductCard 
            key={item._id} 
            item={item} 
            isCarousel={false} 
            shopClosed={shopClosed} 
            onOpenDetails={onOpenDetails} 
            onQuickAdd={onQuickAdd} 
            cart={cart} 
            onRemoveFromCart={onRemoveFromCart} 
          />
        ))}
      </div>
    </div>
  );
}

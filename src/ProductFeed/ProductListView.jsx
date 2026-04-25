import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ModernProductCard } from './FeedComponents.jsx';

export default function ProductListView({ 
  title, 
  items, 
  onBack, 
  shopClosed, 
  onOpenDetails, 
  onQuickAdd, 
  cart = [], 
  onRemoveFromCart,
  onViewCart,     
  onSearchClick   
}) {
  const BOTTOM_NAV_HEIGHT = '56px';

  // Cart Calculations for the floating bar
  const safeCart = Array.isArray(cart) ? cart : [];
  const cartTotalItems = safeCart.reduce((total, item) => total + (item.qty || 1), 0);
  const cartTotalPrice = safeCart.reduce((total, item) => total + ((item.sellingPrice || item.mrp || 0) * (item.qty || 1)), 0);

  // 🛡️ MOBILE BACK BUTTON FIX
  useEffect(() => {
    window.history.pushState({ listViewOpen: true }, '');
    const handlePopState = () => onBack();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onBack]);

  // Freeze background scrolling when this list opens
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // 🚀 FLATTEN THE VARIANTS FOR THE LIST VIEW
  const flattenedItems = items.flatMap(item => {
    if (item.variants && item.variants.length > 0) {
      return item.variants.map(variant => ({
        ...item, 
        ...variant, 
        variants: item.variants // Keep the array attached so Modal still works
      }));
    }
    return item;
  });

  return createPortal(
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: BOTTOM_NAV_HEIGHT, 
        backgroundColor: '#fff', 
        zIndex: 2000, 
        overflowY: 'auto', 
        padding: '15px', 
        animation: 'fadeIn 0.2s ease', 
        paddingBottom: cartTotalItems > 0 ? '120px' : '40px' 
      }}
    >
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      
      {/* 🌟 STICKY HEADER 🌟 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', position: 'sticky', top: '-15px', backgroundColor: '#fff', padding: '15px 0', zIndex: 91, borderBottom: '1px solid #f1f5f9' }}>
        
        {/* Left Side: Back Button & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
            onClick={() => window.history.back()} 
            style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#334155' }}
          >
            ⬅ Back
          </button>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem' }}>{title}</h2>
        </div>

        {/* Right Side: Search Icon (Triggers onSearchClick) */}
        <button 
          onClick={onSearchClick} 
          style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', padding: '8px', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          🔍
        </button>

      </div>
      
      {/* Product Grid - NOW MAPPING OVER FLATTENED ITEMS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
        {flattenedItems.map((item, index) => (
          <ModernProductCard 
            key={`${item._id}-${index}`} 
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

      {/* 🌟 FLOATING VIEW CART BAR 🌟 */}
      {cartTotalItems > 0 && (
        <div
          onClick={() => { window.history.back(); setTimeout(() => { if (onViewCart) onViewCart(); }, 100); }} 
          style={{ position: 'fixed', bottom: `calc(${BOTTOM_NAV_HEIGHT} + 15px)`, left: '12px', right: '12px', zIndex: 101, backgroundColor: '#0c831f', color: '#fff', padding: '10px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', animation: 'fadeIn 0.2s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem' }}>
              🛒
            </div>
            <div style={{ textAlign: 'left', lineHeight: '1.3' }}>
              <div style={{ fontWeight: '600', fontSize: '0.75rem', opacity: 0.95 }}>
                {cartTotalItems} item{cartTotalItems > 1 ? 's' : ''}
              </div>
              <div style={{ fontWeight: '800', fontSize: '1rem' }}>₹ {cartTotalPrice}</div>
            </div>
          </div>
          <div style={{ fontWeight: '800', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View Cart <span style={{ fontSize: '1.2rem' }}>▶</span>
          </div>
        </div>
      )}

    </div>,
    document.body
  );
}

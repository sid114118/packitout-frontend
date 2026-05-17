import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import { cdnImage } from '../utils/cloudinaryUrl.js';

// 📋 1. FIXED VARIANT SELECTION SHEET (Premium Native Redesign)
export function VariantBottomSheet({ product, onClose, onAddToCart }) {
  if (!product) return null;

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999998, backdropFilter: 'blur(4px)' }} />
      
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999999, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif', animation: 'sheetSlideUp 0.3s cubic-bezier(0.25, 1, 0.5, 1)' }}>
        
        <style>{`
          @keyframes sheetSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        `}</style>

        {/* 🌟 NATIVE BOTTOM SHEET CONTAINER */}
        <div style={{ backgroundColor: '#fff', width: '100%', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '0 0 25px 0', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' }}>
          
          {/* 🌟 IOS/ANDROID DRAG HANDLE */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '8px' }}>
            <div style={{ width: '40px', height: '5px', backgroundColor: '#e2e8f0', borderRadius: '10px' }} />
          </div>

          {/* 🌟 CLEAN HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px 15px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: '800', lineHeight: '1.3', paddingRight: '15px' }}>{product.name}</h3>
            <button onClick={onClose} style={{ backgroundColor: '#f8fafc', color: '#64748b', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
          </div>

          {/* 🌟 VARIANT LIST */}
          <div className="premium-hide-scroll" style={{ overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {product.variants.map((variant, idx) => {
              const vPrice = variant.sellingPrice || variant.mrp;
              const vDiscounted = vPrice < variant.mrp;
              const vDiscountPercent = vDiscounted ? Math.round(((variant.mrp - vPrice) / variant.mrp) * 100) : 0;
              
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: '12px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {/* Image Stage */}
                    <div style={{ position: 'relative', width: '56px', height: '56px', backgroundColor: '#f8fafc', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {vDiscounted && <span style={{ position: 'absolute', top: '-6px', left: '-6px', backgroundColor: '#ef4444', color: '#fff', fontSize: '0.6rem', fontWeight: '800', padding: '3px 6px', borderRadius: '6px' }}>{vDiscountPercent}% OFF</span>}
                      {variant.image ? <img src={cdnImage(variant.image, 150)} alt="" loading="lazy" decoding="async" style={{ maxWidth: '44px', maxHeight: '44px', objectFit: 'contain', mixBlendMode: 'multiply' }} /> : <span style={{ fontSize: '24px' }}>{variant.emoji}</span>}
                    </div>
                    
                    {/* Size & Price */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '700', marginBottom: '2px' }}>{variant.qnty}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: '800', fontSize: '1.05rem', color: '#0f172a' }}>₹{vPrice}</span>
                        {vDiscounted && <span style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '600' }}>₹{variant.mrp}</span>}
                      </div>
                    </div>
                  </div>

                  {/* 🌟 RED THEME ADD BUTTON */}
                  <button 
                    onClick={() => { onAddToCart(variant); onClose(); }} 
                    style={{ backgroundColor: '#fff', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', padding: '6px 16px', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', textTransform: 'uppercase' }}
                  >
                    ADD
                  </button>
                  
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// 💎 2. HIGH-PERFORMANCE MODERN PRODUCT CARD
const ModernProductCardBase = ({ item, isCarousel, shopClosed, onOpenDetails, onQuickAdd, cart = [], onRemoveFromCart, hideBrandPrefix = false }) => {
  const isOutOfStock = !item.inStock;
  const isMultiVariant = item.variants && item.variants.length > 1;
  const safeCart = Array.isArray(cart) ? cart.filter(c => c !== null) : [];
  const cartCount = safeCart.filter(c => c._id === item._id).reduce((sum, c) => sum + (c.qty || 1), 0);

  const safeBrand = (item.brand && item.brand !== "nan") ? item.brand : "";
  const safeName = item.name || "";
  const displayTitle = (!hideBrandPrefix && safeBrand && !safeName.toLowerCase().includes(safeBrand.toLowerCase()))
    ? `${safeBrand} ${safeName}`
    : safeName;

  return (
    <div 
      onClick={() => onOpenDetails(item)} 
      style={{ 
        minWidth: isCarousel ? '145px' : 'auto', 
        maxWidth: isCarousel ? '155px' : 'auto', 
        flexShrink: 0, 
        border: '1px solid #f1f5f9',
        borderRadius: '16px', 
        padding: '10px', 
        backgroundColor: '#fff', 
        position: 'relative', 
        opacity: isOutOfStock ? 0.6 : 1, 
        filter: isOutOfStock ? 'grayscale(80%)' : 'none', 
        cursor: 'pointer', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)', 
        scrollSnapAlign: 'start',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ position: 'relative', height: '110px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '12px' }}>
        {item.isDiscounted && !isOutOfStock && (
          <span style={{ position: 'absolute', top: '0', left: '0', backgroundColor: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: '800', padding: '4px 8px', borderRadius: '12px 0 8px 0', zIndex: 1, textTransform: 'uppercase' }}>
            {item.discountPercent}% OFF
          </span>
        )}
        {item.image ? <img src={cdnImage(item.image, 300)} alt={safeName} loading="lazy" decoding="async" style={{ maxHeight: '85%', maxWidth: '85%', objectFit: 'contain', mixBlendMode: 'multiply' }} /> : <span style={{fontSize: '40px'}}>{item.emoji}</span>}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 4px 0', fontWeight: '600' }}>
            {item.qnty || "1 pc"}
          </p>
          <h4 style={{ fontSize: '0.85rem', margin: '0 0 12px 0', color: '#0f172a', fontWeight: '700', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', height: '2.5em', lineHeight: '1.25em' }}>
            {displayTitle}
          </h4>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {item.isDiscounted && (
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '500', marginBottom: '-2px' }}>
                ₹{item.mrp}
              </span>
            )}
            <span style={{ fontWeight: '800', fontSize: '1.05rem', color: '#0f172a' }}>
              ₹{item.sellingPrice || item.mrp}
            </span>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            {!isOutOfStock && !shopClosed && (
              cartCount > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#ef4444', borderRadius: '8px', height: '32px', width: '70px', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.25)' }}>
                  <button onClick={() => onRemoveFromCart(item)} style={{ flex: 1, height: '100%', border: 'none', background: 'transparent', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>−</button>
                  <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '800', minWidth: '16px', textAlign: 'center' }}>{cartCount}</span>
                  <button onClick={() => onQuickAdd(item)} style={{ flex: 1, height: '100%', border: 'none', background: 'transparent', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
                </div>
              ) : (
                <button 
                  onClick={() => onQuickAdd(item)} 
                  style={{ backgroundColor: '#fff', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', padding: '6px 12px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', textTransform: 'uppercase' }}
                >
                  {isMultiVariant ? "SELECT" : "ADD"}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 🛡️ THE REACT MEMO SHIELD
const areCardsEqual = (prevProps, nextProps) => {
  if (prevProps.item._id !== nextProps.item._id) return false;
  if (prevProps.shopClosed !== nextProps.shopClosed) return false;

  const safePrevCart = Array.isArray(prevProps.cart) ? prevProps.cart : [];
  const safeNextCart = Array.isArray(nextProps.cart) ? nextProps.cart : [];

  const prevCount = safePrevCart.filter(c => c && c._id === prevProps.item._id).reduce((sum, c) => sum + (c.qty || 1), 0);
  const nextCount = safeNextCart.filter(c => c && c._id === nextProps.item._id).reduce((sum, c) => sum + (c.qty || 1), 0);

  return prevCount === nextCount; 
};

export const ModernProductCard = memo(ModernProductCardBase, areCardsEqual);

// 🛤️ 3. THE SMART PRODUCT ROW
export function ProductRow({ title, subtitle, items, onViewAll, shopClosed, onOpenDetails, onQuickAdd, cart = [], onRemoveFromCart, hideBrandPrefix = false }) {
  if (!items || items.length === 0) return null;

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

  return (
    <div style={{ marginBottom: '16px', paddingTop: '15px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      <style>{`
        .premium-hide-scroll::-webkit-scrollbar { display: none !important; }
        .premium-hide-scroll { -ms-overflow-style: none !important; scrollbar-width: none !important; padding-bottom: 20px !important; margin-bottom: -20px !important; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 16px' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', margin: 0, color: '#0f172a', fontWeight: '800', letterSpacing: '-0.3px' }}>{title}</h2>
          {subtitle && <p style={{ fontSize: '0.8rem', margin: '4px 0 0 0', color: '#64748b', fontWeight: '500' }}>{subtitle}</p>}
        </div>
        {onViewAll && (
          <button onClick={() => onViewAll({ title, items: flattenedItems })} style={{ background: 'none', color: '#ef4444', border: 'none', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', padding: 0 }}>See All ›</button>
        )}
      </div>
      
      <div className="premium-hide-scroll" style={{ display: 'flex', overflowX: 'auto', gap: '16px', padding: '0 16px 10px 16px', scrollSnapType: 'x mandatory' }}>
        {flattenedItems.map((item, index) => (
          <ModernProductCard
            key={`${item._id}-${index}`}
            item={item}
            isCarousel={true}
            shopClosed={shopClosed}
            onOpenDetails={onOpenDetails}
            onQuickAdd={onQuickAdd}
            cart={cart}
            onRemoveFromCart={onRemoveFromCart}
            hideBrandPrefix={hideBrandPrefix}
          />
        ))}
      </div>
    </div>
  );
  }
                  

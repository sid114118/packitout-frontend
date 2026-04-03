import React, { memo } from 'react';

// 📋 1. FIXED VARIANT SELECTION SHEET
export function VariantBottomSheet({ product, onClose, onAddToCart }) {
  if (!product) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1001, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button onClick={onClose} style={{ marginBottom: '15px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>✕</button>
        <div style={{ backgroundColor: '#f3f4f6', width: '100%', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '20px', paddingBottom: '30px', maxHeight: '75vh', overflowY: 'auto' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#111827', fontWeight: 'bold' }}>{product.name}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {product.variants.map((variant, idx) => {
              const vPrice = variant.sellingPrice || variant.mrp;
              const vDiscounted = vPrice < variant.mrp;
              const vDiscountPercent = vDiscounted ? Math.round(((variant.mrp - vPrice) / variant.mrp) * 100) : 0;
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: '12px', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ position: 'relative', width: '50px', height: '50px', backgroundColor: '#f9fafb', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {vDiscounted && <span style={{ position: 'absolute', top: '-5px', left: '-5px', backgroundColor: '#2563eb', color: '#fff', fontSize: '0.6rem', fontWeight: 'bold', padding: '2px 4px', borderRadius: '4px' }}>{vDiscountPercent}% OFF</span>}
                      {/* ⚡ LAZY LOADING ADDED HERE */}
                      {variant.image ? <img src={variant.image} alt="" loading="lazy" style={{ maxWidth: '40px', maxHeight: '40px', objectFit: 'contain' }} /> : <span style={{ fontSize: '24px' }}>{variant.emoji}</span>}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: '500' }}>{variant.qnty}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#111827' }}>₹{vPrice}</span>
                        {vDiscounted && <span style={{ fontSize: '0.75rem', color: '#9ca3af', textDecoration: 'line-through' }}>₹{variant.mrp}</span>}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { onAddToCart(variant); onClose(); }} style={{ backgroundColor: '#fff', color: '#0f9d58', border: '1px solid #0f9d58', borderRadius: '6px', padding: '6px 16px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}>ADD</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// 💎 2. HIGH-PERFORMANCE MODERN PRODUCT CARD (Base Component)
const ModernProductCardBase = ({ item, isCarousel, shopClosed, onOpenDetails, onQuickAdd, cart = [], onRemoveFromCart }) => {
  const isOutOfStock = !item.inStock;
  const isMultiVariant = item.variants && item.variants.length > 1;
  const variantIds = isMultiVariant ? item.variants.map(v => v._id) : [item._id];
  const cartCount = cart.filter(c => variantIds.includes(c._id)).reduce((sum, c) => sum + (c.qty || 1), 0);

  return (
    <div 
      onClick={() => onOpenDetails(item)} 
      style={{ minWidth: isCarousel ? '140px' : 'auto', maxWidth: isCarousel ? '150px' : 'auto', flexShrink: 0, border: '1px solid #f3f4f6', borderRadius: '8px', padding: '8px', backgroundColor: '#fff', position: 'relative', opacity: isOutOfStock ? 0.6 : 1, filter: isOutOfStock ? 'grayscale(80%)' : 'none', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', scrollSnapAlign: 'start' }}
    >
      <div style={{ position: 'relative', height: '110px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: '6px', marginBottom: '16px' }}>
        {item.isDiscounted && !isOutOfStock && <span style={{ position: 'absolute', top: 0, left: '-8px', backgroundColor: '#0f9d58', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '0 8px 8px 0', zIndex: 1 }}>↓{item.discountPercent}%</span>}
        {/* ⚡ LAZY LOADING ADDED HERE */}
        {item.image ? <img src={item.image} alt={item.name} loading="lazy" style={{ maxHeight: '90%', maxWidth: '90%', objectFit: 'contain' }} /> : <span style={{fontSize: '40px'}}>{item.emoji}</span>}
        
        {!isOutOfStock && !shopClosed && (
          <div style={{ position: 'absolute', bottom: '-14px', right: '4px' }} onClick={(e) => e.stopPropagation()}>
            {cartCount > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0c831f', borderRadius: '6px', height: '28px', width: '70px', boxShadow: '0 2px 6px rgba(12, 131, 31, 0.3)' }}>
                <button 
                  onClick={() => isMultiVariant ? onQuickAdd(item) : onRemoveFromCart(item)} 
                  style={{ flex: 1, height: '100%', border: 'none', background: 'transparent', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}
                >−</button>
                <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold', minWidth: '16px', textAlign: 'center' }}>{cartCount}</span>
                <button 
                  onClick={() => onQuickAdd(item)} 
                  style={{ flex: 1, height: '100%', border: 'none', background: 'transparent', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}
                >+</button>
              </div>
            ) : (
              <button 
                onClick={() => onQuickAdd(item)} 
                style={{ backgroundColor: '#fff', color: '#0c831f', border: '1px solid #0c831f', borderRadius: '6px', padding: '4px 16px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
              >
                ADD
              </button>
            )}
          </div>
        )}
      </div>
      <div>
        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 4px 0', minHeight: '14px' }}>{item.qnty || "1 pc"} {isMultiVariant && <span style={{color: '#d97706', fontWeight: 'bold'}}> ({item.variants.length} sizes)</span>}</p>
        <h4 style={{ fontSize: '0.85rem', margin: '0 0 8px 0', color: '#111827', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', height: '2.4em', lineHeight: '1.2em' }}>{item.brand ? `${item.brand} ` : ''}{item.name}</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ backgroundColor: '#fef08a', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem', color: '#000' }}>₹{item.sellingPrice}</span>
          {item.isDiscounted && <span style={{ fontSize: '0.75rem', color: '#9ca3af', textDecoration: 'line-through' }}>₹{item.mrp}</span>}
        </div>
      </div>
    </div>
  );
};

// 🛡️ THE REACT MEMO SHIELD
// This stops all cards from re-rendering when you add just 1 item to the cart!
const areCardsEqual = (prevProps, nextProps) => {
  if (prevProps.item._id !== nextProps.item._id) return false;
  if (prevProps.shopClosed !== nextProps.shopClosed) return false;

  const variantIds = prevProps.item.variants && prevProps.item.variants.length > 1
    ? prevProps.item.variants.map(v => v._id)
    : [prevProps.item._id];

  const prevCount = prevProps.cart.filter(c => variantIds.includes(c._id)).reduce((sum, c) => sum + (c.qty || 1), 0);
  const nextCount = nextProps.cart.filter(c => variantIds.includes(c._id)).reduce((sum, c) => sum + (c.qty || 1), 0);

  return prevCount === nextCount; 
};

// Export the protected component
export const ModernProductCard = memo(ModernProductCardBase, areCardsEqual);

// 🛤️ 3. THE MISSING PRODUCT ROW
export function ProductRow({ title, subtitle, items, onViewAll, shopClosed, onOpenDetails, onQuickAdd, cart = [], onRemoveFromCart }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginBottom: '24px', backgroundColor: '#fff', padding: '15px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '0 15px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', margin: 0, color: '#111827', fontWeight: 'bold' }}>{title}</h2>
          {subtitle && <p style={{ fontSize: '0.75rem', margin: '2px 0 0 0', color: '#6b7280' }}>{subtitle}</p>}
        </div>
        {onViewAll && (
          <button onClick={() => onViewAll({ title, items })} style={{ backgroundColor: '#111827', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1rem', cursor: 'pointer' }}>➔</button>
        )}
      </div>
      <div className="hide-scroll" style={{ display: 'flex', overflowX: 'auto', gap: '12px', padding: '0 15px 10px 15px', scrollSnapType: 'x mandatory' }}>
        {items.map((item, index) => (
          <ModernProductCard 
            key={`${item._id}-${index}`} 
            item={item} 
            isCarousel={true} 
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

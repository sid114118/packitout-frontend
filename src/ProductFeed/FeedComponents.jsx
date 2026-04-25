import React, { memo } from 'react';

// 📋 1. FIXED VARIANT SELECTION SHEET (Kept functional, updated fonts)
export function VariantBottomSheet({ product, onClose, onAddToCart }) {
  if (!product) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1001, display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <button onClick={onClose} style={{ marginBottom: '15px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>✕</button>
        <div style={{ backgroundColor: '#fff', width: '100%', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '20px', paddingBottom: '30px', maxHeight: '75vh', overflowY: 'auto' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#111827', fontWeight: '800' }}>{product.name}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {product.variants.map((variant, idx) => {
              const vPrice = variant.sellingPrice || variant.mrp;
              const vDiscounted = vPrice < variant.mrp;
              const vDiscountPercent = vDiscounted ? Math.round(((variant.mrp - vPrice) / variant.mrp) * 100) : 0;
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ position: 'relative', width: '50px', height: '50px', backgroundColor: '#fff', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      {vDiscounted && <span style={{ position: 'absolute', top: '-5px', left: '-5px', backgroundColor: '#ef4444', color: '#fff', fontSize: '0.6rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '6px' }}>{vDiscountPercent}% OFF</span>}
                      {variant.image ? <img src={variant.image} alt="" loading="lazy" style={{ maxWidth: '40px', maxHeight: '40px', objectFit: 'contain' }} /> : <span style={{ fontSize: '24px' }}>{variant.emoji}</span>}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>{variant.qnty}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span style={{ fontWeight: '800', fontSize: '1rem', color: '#0f172a' }}>₹{vPrice}</span>
                        {vDiscounted && <span style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '500' }}>₹{variant.mrp}</span>}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { onAddToCart(variant); onClose(); }} style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer' }}>ADD</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// 💎 2. HIGH-PERFORMANCE MODERN PRODUCT CARD (Fully Redesigned)
const ModernProductCardBase = ({ item, isCarousel, shopClosed, onOpenDetails, onQuickAdd, cart = [], onRemoveFromCart }) => {
  const isOutOfStock = !item.inStock;
  
  const safeCart = Array.isArray(cart) ? cart.filter(c => c !== null) : [];
  const cartCount = safeCart.filter(c => c._id === item._id).reduce((sum, c) => sum + (c.qty || 1), 0);

  const safeBrand = (item.brand && item.brand !== "nan") ? item.brand : "";
  const safeName = item.name || "";
  const displayTitle = (safeBrand && !safeName.toLowerCase().includes(safeBrand.toLowerCase())) 
    ? `${safeBrand} ${safeName}` 
    : safeName;

  return (
    <div 
      onClick={() => onOpenDetails(item)} 
      style={{ 
        minWidth: isCarousel ? '135px' : 'auto', 
        maxWidth: isCarousel ? '145px' : 'auto', 
        flexShrink: 0, 
        // 🌟 FIX 2: Removed harsh border, added soft premium shadow and rounded corners
        border: 'none', 
        borderRadius: '16px', 
        padding: '10px', 
        backgroundColor: '#fff', 
        position: 'relative', 
        opacity: isOutOfStock ? 0.6 : 1, 
        filter: isOutOfStock ? 'grayscale(80%)' : 'none', 
        cursor: 'pointer', 
        boxShadow: '0 4px 15px rgba(0,0,0,0.04)', 
        scrollSnapAlign: 'start',
        // 🌟 FIX 1: Enforced clean sans-serif font
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ position: 'relative', height: '110px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '12px' }}>
        {item.isDiscounted && !isOutOfStock && <span style={{ position: 'absolute', top: '0', left: '0', backgroundColor: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: '800', padding: '3px 6px', borderRadius: '12px 0 8px 0', zIndex: 1, textTransform: 'uppercase' }}>{item.discountPercent}% OFF</span>}
        
        {item.image ? <img src={item.image} alt={safeName} loading="lazy" style={{ maxHeight: '85%', maxWidth: '85%', objectFit: 'contain', mixBlendMode: 'multiply' }} /> : <span style={{fontSize: '40px'}}>{item.emoji}</span>}
        
        {!isOutOfStock && !shopClosed && (
          <div style={{ position: 'absolute', bottom: '-14px', right: '50%', transform: 'translateX(50%)' }} onClick={(e) => e.stopPropagation()}>
            {cartCount > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#ef4444', borderRadius: '8px', height: '32px', width: '76px', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)' }}>
                <button onClick={() => onRemoveFromCart(item)} style={{ flex: 1, height: '100%', border: 'none', background: 'transparent', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>−</button>
                <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '800', minWidth: '16px', textAlign: 'center' }}>{cartCount}</span>
                <button onClick={() => onQuickAdd(item)} style={{ flex: 1, height: '100%', border: 'none', background: 'transparent', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
              </div>
            ) : (
              // 🌟 FIX 4: Updated ADD button to be solid, pill-shaped, and aligned with your red theme
              <button 
                onClick={() => onQuickAdd(item)} 
                style={{ backgroundColor: '#fff', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', padding: '6px 20px', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                ADD
              </button>
            )}
          </div>
        )}
      </div>
      
      <div style={{ paddingTop: '8px' }}>
        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 4px 0', fontWeight: '600' }}>
          {item.qnty || "1 pc"}
        </p>
        <h4 style={{ fontSize: '0.85rem', margin: '0 0 8px 0', color: '#0f172a', fontWeight: '700', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', height: '2.4em', lineHeight: '1.3em' }}>
          {displayTitle}
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a' }}>₹{item.sellingPrice || item.mrp}</span>
          {item.isDiscounted && <span style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '500' }}>₹{item.mrp}</span>}
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
export function ProductRow({ title, subtitle, items, onViewAll, shopClosed, onOpenDetails, onQuickAdd, cart = [], onRemoveFromCart }) {
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
    // 🌟 FIX: Removed white background from row container to match global feed background, adding padding to edge
    <div style={{ marginBottom: '16px', paddingTop: '15px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* 🌟 CSS FIX: Injecting a style tag to completely kill webkit scrollbars for the carousels */}
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
          />
        ))}
      </div>
    </div>
  );
}

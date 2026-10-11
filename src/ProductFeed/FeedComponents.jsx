import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import { useBaskets } from '../utils/useBaskets.js';
import { cdnImage } from '../utils/cloudinaryUrl.js';
import ImpressionTracker from '../components/ui/ImpressionTracker.jsx';
import { trackEvent } from '../utils/analyticsEngine.js';

// 📋 1. FIXED VARIANT SELECTION SHEET (Premium Native Redesign)
export function VariantBottomSheet({ product, onClose, onAddToCart, onRemoveFromCart, cart = [] }) {
  if (!product) return null;
  const safeCart = Array.isArray(cart) ? cart.filter(Boolean) : [];

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999998, backdropFilter: 'blur(4px)' }} />
      
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999999, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif', animation: 'sheetSlideUp 0.3s cubic-bezier(0.25, 1, 0.5, 1)' }}>
        
        <style>{`
          @keyframes sheetSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        `}</style>

        {/* 🌟 NATIVE BOTTOM SHEET CONTAINER */}
        <div style={{ backgroundColor: '#fff', width: '100%', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '0 0 20px 0', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' }}>
          
          {/* 🌟 IOS/ANDROID DRAG HANDLE */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '8px' }}>
            <div style={{ width: '40px', height: '5px', backgroundColor: '#e2e8f0', borderRadius: '10px' }} />
          </div>

          {/* 🌟 CLEAN HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px 15px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: '800', lineHeight: '1.3' }}>{product.name}</h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{product.variants?.length || 0} size options available</span>
            </div>
            <button onClick={onClose} style={{ backgroundColor: '#f8fafc', color: '#64748b', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
          </div>

          {/* 🌟 VARIANT LIST */}
          <div className="premium-hide-scroll" style={{ overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {product.variants?.map((variant, idx) => {
              const vPrice = variant.sellingPrice || variant.mrp;
              const vDiscounted = vPrice < variant.mrp;
              const vDiscountPercent = vDiscounted ? Math.round(((variant.mrp - vPrice) / variant.mrp) * 100) : 0;
              const vCart = safeCart.find(c => String(c._id) === String(variant._id));
              const vQty = vCart ? (vCart.qty || 1) : 0;
              
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
                      <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '700', marginBottom: '2px' }}>{variant.qnty || 'Standard'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: '800', fontSize: '1.05rem', color: '#0f172a' }}>₹{vPrice}</span>
                        {vDiscounted && <span style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '600' }}>₹{variant.mrp}</span>}
                      </div>
                    </div>
                  </div>

                  {/* 🌟 ACTION BUTTON: STEPPER IF IN CART, ADD OTHERWISE */}
                  {vQty > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#ef4444', borderRadius: '8px', height: '32px', width: '76px', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.25)' }}>
                      <button onClick={() => onRemoveFromCart && onRemoveFromCart(variant)} style={{ flex: 1, height: '100%', border: 'none', background: 'transparent', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>−</button>
                      <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '800', minWidth: '16px', textAlign: 'center' }}>{vQty}</span>
                      <button onClick={() => onAddToCart && onAddToCart(variant)} style={{ flex: 1, height: '100%', border: 'none', background: 'transparent', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => onAddToCart && onAddToCart(variant)} 
                      style={{ backgroundColor: '#fff', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', padding: '6px 16px', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', textTransform: 'uppercase' }}
                    >
                      ADD
                    </button>
                  )}
                  
                </div>
              );
            })}
          </div>

          {/* BOTTOM DONE BUTTON */}
          <div style={{ padding: '10px 20px 0', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={onClose} 
              style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '0.95rem' }}
            >
              Done
            </button>
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

  const allVariantIds = isMultiVariant 
    ? new Set(item.variants.map(v => String(v._id))) 
    : new Set([String(item._id)]);

  const totalFamilyCartQty = safeCart
    .filter(c => c && allVariantIds.has(String(c._id)))
    .reduce((sum, c) => sum + (c.qty || 1), 0);

  const minPrice = isMultiVariant 
    ? Math.min(...item.variants.map(v => Number(v.sellingPrice || v.mrp || 0)))
    : Number(item.sellingPrice || item.mrp || 0);
  const maxPrice = isMultiVariant 
    ? Math.max(...item.variants.map(v => Number(v.sellingPrice || v.mrp || 0)))
    : Number(item.sellingPrice || item.mrp || 0);

  const priceLabel = (isMultiVariant && minPrice !== maxPrice) 
    ? `₹${minPrice} - ₹${maxPrice}` 
    : `₹${minPrice}`;

  const safeBrand = (item.brand && item.brand !== "nan") ? item.brand : "";
  const safeName = item.name || "";
  const displayTitle = (!hideBrandPrefix && safeBrand && !safeName.toLowerCase().includes(safeBrand.toLowerCase()))
    ? `${safeBrand} ${safeName}`
    : safeName;

  const getEventPayload = () => ({
    productId: item._id,
    productName: item.name,
    brand: item.brand,
    category: item.category,
    price: item.sellingPrice || item.mrp,
    isOutOfStock: isOutOfStock
  });

  return (
    <div 
      onClick={() => {
        trackEvent('PRODUCT_CLICKED', getEventPayload());
        onOpenDetails(item);
      }} 
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
        <HeartButton item={item} />
        {item.image ? <img src={cdnImage(item.image, 300)} alt={safeName} loading="lazy" decoding="async" style={{ maxHeight: '85%', maxWidth: '85%', objectFit: 'contain', mixBlendMode: 'multiply' }} /> : <span style={{fontSize: '40px'}}>{item.emoji}</span>}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '0.75rem', color: isMultiVariant ? '#0284c7' : '#64748b', margin: '0 0 4px 0', fontWeight: '700' }}>
            {isMultiVariant ? `${item.variants.length} sizes available` : (item.qnty || "1 pc")}
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
            <span style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a' }}>
              {priceLabel}
            </span>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            {!isOutOfStock && (
              isMultiVariant ? (
                <button 
                  onClick={() => { trackEvent('ADD_TO_CART', getEventPayload()); onQuickAdd(item); }} 
                  className="pio-product-add-btn"
                  style={{ 
                    backgroundColor: totalFamilyCartQty > 0 ? '#fef2f2' : '#fff', 
                    color: '#ef4444', 
                    border: totalFamilyCartQty > 0 ? '1.5px solid #ef4444' : '1px solid #fca5a5', 
                    borderRadius: '8px', 
                    padding: '6px 8px', 
                    fontSize: '0.75rem', 
                    fontWeight: '800', 
                    cursor: 'pointer', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {totalFamilyCartQty > 0 ? `${totalFamilyCartQty} in cart ▾` : 'SELECT ▾'}
                </button>
              ) : (
                totalFamilyCartQty > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#ef4444', borderRadius: '8px', height: '32px', width: '70px', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.25)' }}>
                    <button onClick={() => { trackEvent('REMOVE_FROM_CART', getEventPayload()); onRemoveFromCart(item); }} style={{ flex: 1, height: '100%', border: 'none', background: 'transparent', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>−</button>
                    <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '800', minWidth: '16px', textAlign: 'center' }}>{totalFamilyCartQty}</span>
                    <button onClick={() => { trackEvent('ADD_TO_CART', getEventPayload()); onQuickAdd(item); }} style={{ flex: 1, height: '100%', border: 'none', background: 'transparent', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
                  </div>
                ) : (
                  <button 
                    onClick={() => { trackEvent('ADD_TO_CART', getEventPayload()); onQuickAdd(item); }} 
                    className="pio-product-add-btn"
                    style={{ backgroundColor: '#fff', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', padding: '6px 12px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', textTransform: 'uppercase' }}
                  >
                    ADD
                  </button>
                )
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

  const prevIds = prevProps.item.variants?.length > 1 
    ? new Set(prevProps.item.variants.map(v => String(v._id)))
    : new Set([String(prevProps.item._id)]);
  const nextIds = nextProps.item.variants?.length > 1 
    ? new Set(nextProps.item.variants.map(v => String(v._id)))
    : new Set([String(nextProps.item._id)]);

  const safePrevCart = Array.isArray(prevProps.cart) ? prevProps.cart : [];
  const safeNextCart = Array.isArray(nextProps.cart) ? nextProps.cart : [];

  const prevCount = safePrevCart.filter(c => c && prevIds.has(String(c._id))).reduce((sum, c) => sum + (c.qty || 1), 0);
  const nextCount = safeNextCart.filter(c => c && nextIds.has(String(c._id))).reduce((sum, c) => sum + (c.qty || 1), 0);

  return prevCount === nextCount; 
};

export const ModernProductCard = memo(ModernProductCardBase, areCardsEqual);

// 🛤️ 3. THE SMART PRODUCT ROW
export function ProductRow({ title, subtitle, items, onViewAll, shopClosed, onOpenDetails, onQuickAdd, cart = [], onRemoveFromCart, hideBrandPrefix = false }) {
  if (!items || items.length === 0) return null;

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
          <button onClick={() => onViewAll({ title, items })} style={{ background: 'none', color: '#ef4444', border: 'none', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', padding: 0 }}>See All ›</button>
        )}
      </div>
      
      <div className="premium-hide-scroll" style={{ display: 'flex', overflowX: 'auto', gap: '16px', padding: '0 16px 10px 16px', scrollSnapType: 'x mandatory' }}>
        {items.map((item, index) => (
          <ImpressionTracker key={`${item._id}-${index}`} product={item} listPosition={index} category={title}>
            <ModernProductCard
              item={item}
              isCarousel={true}
              shopClosed={shopClosed}
              onOpenDetails={onOpenDetails}
              onQuickAdd={onQuickAdd}
              cart={cart}
              onRemoveFromCart={onRemoveFromCart}
              hideBrandPrefix={hideBrandPrefix}
            />
          </ImpressionTracker>
        ))}
      </div>
    </div>
  );
}

export function HeartButton({ item }) {
  const { isFavourite } = useBaskets();
  const fav = isFavourite(item._id);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('OPEN_BASKET_DRAWER', { detail: item }));
      }}
      style={{ position: 'absolute', top: '4px', right: '4px', background: '#fff', border: fav ? '1px solid #fecaca' : '1px solid #e2e8f0', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2, boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}
      aria-label="Save to basket"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill={fav ? "#ef4444" : "none"} stroke={fav ? "#ef4444" : "#64748b"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
    </button>
  );
}

// 🎁 4. COMBO DETAIL MODAL (Opens when clicking any Special Combo Pack)
export function ComboDetailModal({ combo, items = [], onClose, onAddToCart }) {
  if (!combo) return null;

  const rawPids = Array.isArray(combo.productIds) ? combo.productIds : [];
  const comboItems = rawPids.map(p => {
    const pidStr = (typeof p === 'object' && p?._id) ? String(p._id) : String(p);
    const matched = items.find(i => String(i._id) === pidStr || i.variants?.some(v => String(v._id) === pidStr));
    if (matched) return matched;
    if (typeof p === 'object' && p?._id) return p;
    return null;
  }).filter(Boolean);

  const regularTotal = comboItems.reduce((sum, item) => sum + Number(item.sellingPrice || item.mrp || 0), 0);
  const effectivePrice = combo.comboPrice > 0 ? combo.comboPrice : regularTotal;
  const savings = (combo.comboPrice > 0 && regularTotal > combo.comboPrice) ? (regularTotal - combo.comboPrice) : 0;
  const discountPercent = regularTotal > 0 && savings > 0 ? Math.round((savings / regularTotal) * 100) : 0;

  return createPortal(
    <>
      <div 
        onClick={onClose} 
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999998, backdropFilter: 'blur(4px)' }} 
      />

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999999, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif', animation: 'sheetSlideUp 0.3s cubic-bezier(0.25, 1, 0.5, 1)' }}>
        
        <style>{`
          @keyframes sheetSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        `}</style>

        <div style={{ backgroundColor: '#fff', width: '100%', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '0 0 24px 0', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -4px 25px rgba(0,0,0,0.15)' }}>
          
          {/* DRAG HANDLE */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '6px' }}>
            <div style={{ width: '40px', height: '5px', backgroundColor: '#e2e8f0', borderRadius: '10px' }} />
          </div>

          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 20px 14px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '2.2rem', lineHeight: 1 }}>{combo.emoji || '🎁'}</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: '800', lineHeight: 1.2 }}>
                    {combo.name}
                  </h3>
                  {savings > 0 && (
                    <span style={{ backgroundColor: '#10b981', color: '#fff', fontSize: '0.7rem', fontWeight: '800', padding: '2px 8px', borderRadius: '6px' }}>
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
                  Special Combo Bundle • {comboItems.length} Products Included
                </span>
              </div>
            </div>
            <button 
              onClick={onClose} 
              style={{ backgroundColor: '#f8fafc', color: '#64748b', border: 'none', borderRadius: '50%', width: '34px', height: '34px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              ✕
            </button>
          </div>

          {/* INCLUDED PRODUCTS LIST */}
          <div className="premium-hide-scroll" style={{ overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#475569', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Included in this combo:
            </div>

            {comboItems.map((item, idx) => {
              const price = item.sellingPrice || item.mrp || 0;
              return (
                <div 
                  key={idx} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '10px 14px', 
                    borderRadius: '14px', 
                    backgroundColor: '#f8fafc', 
                    border: '1px solid #f1f5f9' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {item.image ? (
                        <img src={cdnImage(item.image, 120)} alt="" style={{ maxWidth: '38px', maxHeight: '38px', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: '22px' }}>{item.emoji || '📦'}</span>
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {item.qnty || '1 unit'} {item.brand ? `• ${item.brand}` : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '10px' }}>
                    <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.95rem' }}>
                      ₹{price}
                    </div>
                    {item.mrp && item.mrp > price && (
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                        ₹{item.mrp}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* VALUE / SAVINGS BREAKDOWN */}
            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px', padding: '14px 16px', marginTop: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.85rem', color: '#78350f', fontWeight: '600' }}>Total items MRP/Value:</span>
                <span style={{ fontSize: '0.9rem', color: '#78350f', fontWeight: '700', textDecoration: savings > 0 ? 'line-through' : 'none' }}>₹{regularTotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: savings > 0 ? '4px' : '0' }}>
                <span style={{ fontSize: '0.95rem', color: '#92400e', fontWeight: '800' }}>Special Combo Offer:</span>
                <span style={{ fontSize: '1.25rem', color: '#16a34a', fontWeight: '900' }}>₹{effectivePrice}</span>
              </div>
              {savings > 0 && (
                <div style={{ fontSize: '0.82rem', color: '#047857', fontWeight: '800', borderTop: '1px dashed #fcd34d', paddingTop: '6px', marginTop: '4px' }}>
                  🎉 You save ₹{savings} with this combo deal!
                </div>
              )}
            </div>
          </div>

          {/* FOOTER ACTION BUTTON */}
          <div style={{ padding: '12px 20px 0', borderTop: '1px solid #f1f5f9' }}>
            <button 
              onClick={() => {
                comboItems.forEach(item => {
                  const toAdd = (item.variants && item.variants.length > 0) ? item.variants[0] : item;
                  onAddToCart(toAdd);
                });
                onClose();
              }}
              style={{ 
                width: '100%', 
                padding: '14px', 
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '14px', 
                fontWeight: '800', 
                fontSize: '1rem', 
                cursor: 'pointer', 
                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.35)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>Add Complete Box To Cart (₹{effectivePrice})</span>
              <span>🛒</span>
            </button>
          </div>

        </div>
      </div>
    </>,
    document.body
  );
}
                  

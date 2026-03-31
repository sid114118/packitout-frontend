import React, { useState, useEffect, useMemo } from 'react';
import CrossSellSlider from './CrossSell.jsx';

// ── Subcomponents Moved Outside ──
const DietaryIcon = ({ type }) => {
  const isVeg = type !== 'Non-Veg';
  return (
    <div style={{ width: '16px', height: '16px', border: `1.5px solid ${isVeg ? '#166534' : '#7f1d1d'}`, display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '4px', backgroundColor: '#fff' }}>
      <div style={{ width: '8px', height: '8px', backgroundColor: isVeg ? '#166534' : '#7f1d1d', borderRadius: '50%' }} />
    </div>
  );
};

const Accordion = ({ title, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid #f1f5f9' }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800', fontSize: '0.95rem', color: '#111827' }}>
          {title}
        </div>
        <span style={{ color: '#94a3b8', fontSize: '1.2rem', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>⌄</span>
      </div>
      {open && (
        <div style={{ paddingBottom: '16px', animation: 'fadeIn 0.15s ease', textAlign: 'left' }}>
          {children}
        </div>
      )}
    </div>
  );
};

export default function ProductPage({ product, onBack, onAddToCart, onRemoveFromCart, onViewCart, allItems = [], cart = [] }) {
  const [currentProduct, setCurrentProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showFullDesc, setShowFullDesc] = useState(false);

  useEffect(() => {
    if (product) {
      setCurrentProduct(product);
      setSelectedVariant(product);
      setShowFullDesc(false);
    }
  }, [product]);

  if (!product || !currentProduct || !selectedVariant) return null;

  const displayPrice = selectedVariant?.sellingPrice || selectedVariant?.mrp || 0;
  const originalMRP = selectedVariant?.mrp || displayPrice;
  const isDiscounted = displayPrice < originalMRP;
  const discountPercent = isDiscounted ? Math.round(((originalMRP - displayPrice) / originalMRP) * 100) : 0;

  const safeCart = Array.isArray(cart) ? cart : [];
  const cartItem = safeCart.find(item => item?._id === selectedVariant?._id);
  const cartCount = cartItem?.qty || 0;
  const cartTotalItems = safeCart.reduce((total, item) => total + (item?.qty || 1), 0);
  const cartTotalPrice = safeCart.reduce((total, item) => total + ((item?.sellingPrice || item?.mrp || 0) * (item?.qty || 1)), 0);

  const relatedItems = useMemo(() => {
    if (!selectedVariant?.relatedProducts || !Array.isArray(selectedVariant.relatedProducts) || !allItems?.length) return [];
    return allItems.filter(item => selectedVariant.relatedProducts.includes(item?._id) && item?.inStock);
  }, [selectedVariant?.relatedProducts, allItems]);

  const handleRelatedProductClick = (item) => {
    setCurrentProduct(item);
    setSelectedVariant(item);
    setShowFullDesc(false);
    const scrollContainer = document.getElementById('pm-scroll-container');
    if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      style={{ 
        position: 'fixed', // 👈 This forces it to cover the ENTIRE screen (Search bar, Bottom Nav, everything)
        top: 0, left: 0, right: 0, bottom: 0, 
        zIndex: 99999, // 👈 Extremely high z-index to stay on top
        backgroundColor: '#fff', 
        display: 'flex', 
        flexDirection: 'column',
        animation: 'slideUpPage 0.25s cubic-bezier(0.32,0.72,0,1)'
      }}
    >
      <style>{`
        @keyframes slideUpPage { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .pm-hide-scroll::-webkit-scrollbar { display: none; }
        .pm-hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .pm-line-clamp { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

      {/* ── Top Header (Flex Shrink 0 keeps it perfectly at the top) ── */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: '12px 16px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', zIndex: 10 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: '0 16px 0 0', color: '#111827', display: 'flex', alignItems: 'center' }}>
          ←
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', overflow: 'hidden' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selectedVariant?.brand || 'Product Details'}
          </h2>
        </div>
      </div>

      {/* ── Scrollable Body (Flex 1 allows it to take up the middle and scroll independently) ── */}
      <div id="pm-scroll-container" className="pm-hide-scroll" style={{ flex: 1, overflowY: 'auto', backgroundColor: '#fff', position: 'relative' }}>
        
        <div style={{ width: '100%', height: '320px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', backgroundColor: '#f8fafc' }}>
          {selectedVariant?.image ? <img src={selectedVariant.image} alt={selectedVariant?.name || 'Product'} style={{ maxHeight: '90%', maxWidth: '90%', objectFit: 'contain', mixBlendMode: 'multiply' }} /> : <span style={{ fontSize: '90px' }}>{selectedVariant?.emoji || '📦'}</span>}
        </div>

        <div style={{ padding: '20px', textAlign: 'left', paddingBottom: cartTotalItems > 0 ? '100px' : '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: '800', marginBottom: '8px' }}>
             <div style={{ display: 'flex', alignItems: 'center', color: '#f59e0b', fontSize: '0.85rem' }}>★★★★★ <span style={{ color: '#9ca3af', fontWeight: '500', marginLeft: '4px', fontSize: '0.75rem' }}>(4.03 lac)</span></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
            <h1 style={{ margin: '0', fontSize: '1.35rem', fontWeight: '800', color: '#111827', lineHeight: '1.3' }}>{selectedVariant?.name || 'Unnamed Product'}</h1>
            <div style={{ marginTop: '4px', marginLeft: '10px' }}><DietaryIcon type={selectedVariant?.dietaryPreference} /></div>
          </div>

          <div style={{ color: '#ea580c', fontWeight: '700', fontSize: '0.8rem', marginTop: '8px', marginBottom: '20px' }}>
            {selectedVariant?.brand ? `Explore ${selectedVariant.brand} ›` : 'Limited Stock!'}
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', marginBottom: '20px' }} />

          {currentProduct?.variants?.length > 1 && (
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: '800', color: '#111827', marginBottom: '12px' }}>Select Unit</p>
              <div className="pm-hide-scroll" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px', paddingTop: '10px', marginTop: '-10px' }}>
                {currentProduct.variants.map((v, i) => {
                  if (!v) return null;
                  const isSel = selectedVariant?._id === v._id;
                  const vPrice = v.sellingPrice || v.mrp || 0;
                  const vDisc = vPrice < v.mrp ? Math.round(((v.mrp - vPrice) / v.mrp) * 100) : 0;
                  const variantCartCount = safeCart.find(c => c?._id === v._id)?.qty || 0;

                  return (
                    <div key={v._id || i} onClick={() => setSelectedVariant(v)} style={{ minWidth: '100px', padding: '12px 14px', border: isSel ? '2px solid #0c831f' : '1.5px solid #e5e7eb', borderRadius: '12px', backgroundColor: isSel ? '#f4fbf6' : '#fff', textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}>
                      {variantCartCount > 0 && <div style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#0c831f', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.75rem', fontWeight: '800', border: '2px solid #fff', zIndex: 2 }}>{variantCartCount}</div>}
                      {vDisc > 0 && <span style={{ position: 'absolute', top: '-10px', left: '12px', background: 'linear-gradient(to right, #60a5fa, #3b82f6)', color: '#fff', fontSize: '0.55rem', padding: '3px 6px', borderRadius: '4px', whiteSpace: 'nowrap', fontWeight: '800' }}>{vDisc}% OFF</span>}
                      <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#111827', marginTop: vDisc > 0 ? '6px' : 0 }}>{v.qnty || '1 Unit'}</div>
                      <div style={{ fontSize: '0.85rem', color: '#111827', fontWeight: '800', marginTop: '4px' }}>₹{vPrice}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedVariant?.description && (
            <div style={{ marginBottom: '8px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#111827', margin: '0 0 10px' }}>Product Details</h3>
              <div style={{ position: 'relative' }}>
                <p className={showFullDesc ? '' : 'pm-line-clamp'} style={{ fontSize: '0.9rem', color: '#4b5563', lineHeight: '1.65', margin: 0 }}>{selectedVariant.description}</p>
                {!showFullDesc && selectedVariant.description.length > 120 && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30px', background: 'linear-gradient(transparent, #fff)' }} />}
              </div>
              {selectedVariant.description.length > 120 && (
                <button onClick={() => setShowFullDesc(!showFullDesc)} style={{ background: 'none', border: 'none', color: '#0c831f', fontWeight: '700', fontSize: '0.9rem', padding: '8px 0 0', cursor: 'pointer' }}>{showFullDesc ? 'Read Less ⌃' : 'Read More ⌄'}</button>
              )}
            </div>
          )}

          <CrossSellSlider title="Frequently Bought Together" items={relatedItems} onProductClick={handleRelatedProductClick} onAddToCart={onAddToCart} />
        </div>
      </div>

      {/* ── Floating Cart Bar (Absolute inside the fixed container) ── */}
      {cartTotalItems > 0 && (
        <div onClick={() => { onBack(); if (onViewCart) onViewCart(); }} style={{ position: 'absolute', bottom: '85px', left: '12px', right: '12px', zIndex: 101, backgroundColor: '#0c831f', color: '#fff', padding: '10px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', animation: 'fadeIn 0.2s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem' }}>🛒</div>
            <div style={{ textAlign: 'left', lineHeight: '1.3' }}>
              <div style={{ fontWeight: '600', fontSize: '0.75rem', opacity: 0.95 }}>{cartTotalItems} item{cartTotalItems > 1 ? 's' : ''}</div>
              <div style={{ fontWeight: '800', fontSize: '1rem' }}>₹ {cartTotalPrice}</div>
            </div>
          </div>
          <div style={{ fontWeight: '800', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '4px' }}>View Cart ▶</div>
        </div>
      )}

      {/* ── Sticky Bottom Bar (Flex Shrink 0 keeps it perfectly at the bottom) ── */}
      <div style={{ flexShrink: 0, backgroundColor: '#fff', borderTop: '1px solid #f1f5f9', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '75px', paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '0.8rem', color: '#4b5563', fontWeight: '500', marginBottom: '2px' }}>{selectedVariant?.qnty || '1 Unit'}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827', lineHeight: 1 }}>₹{displayPrice}</span>
            {isDiscounted && <span style={{ fontSize: '0.8rem', color: '#9ca3af', textDecoration: 'line-through' }}>MRP ₹{originalMRP}</span>}
            {isDiscounted && <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', fontSize: '0.6rem', fontWeight: '800', padding: '2px 5px', borderRadius: '4px' }}>{discountPercent}% OFF</span>}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '2px' }}>Inclusive of all taxes</div>
        </div>

        {cartCount > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0c831f', borderRadius: '8px', overflow: 'hidden', height: '40px', minWidth: '100px' }}>
            <button onClick={() => onRemoveFromCart && onRemoveFromCart(selectedVariant)} style={{ flex: 1, height: '100%', border: 'none', backgroundColor: 'transparent', color: '#fff', fontSize: '1.4rem', fontWeight: '300', cursor: 'pointer' }}>−</button>
            <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: '800', fontSize: '0.95rem', color: '#fff' }}>{cartCount}</span>
            <button onClick={() => onAddToCart && onAddToCart(selectedVariant)} style={{ flex: 1, height: '100%', border: 'none', backgroundColor: 'transparent', color: '#fff', fontSize: '1.25rem', fontWeight: '500', cursor: 'pointer' }}>+</button>
          </div>
        ) : (
          <button onClick={() => onAddToCart && onAddToCart(selectedVariant)} style={{ height: '40px', minWidth: '100px', backgroundColor: '#0c831f', color: '#fff', border: '1px solid #0c831f', borderRadius: '8px', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer' }}>Add to cart</button>
        )}
      </div>

    </div>
  );
                       }
            

import React, { useState, useEffect } from 'react';
import CrossSellSlider from './CrossSell.jsx';

export default function ProductModal({ product, isOpen, onClose, onAddToCart, onRemoveFromCart, onViewCart, allItems = [], cart = [] }) {
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

  if (!isOpen || !currentProduct || !selectedVariant) return null;

  const displayPrice = selectedVariant.sellingPrice || selectedVariant.mrp;
  const isDiscounted = displayPrice < selectedVariant.mrp;
  const discountPercent = isDiscounted
    ? Math.round(((selectedVariant.mrp - displayPrice) / selectedVariant.mrp) * 100)
    : 0;

  const cartCount = cart.filter(item => item._id === selectedVariant._id).length;
  const cartTotalItems = cart.length;
  const cartTotalPrice = cart.reduce((total, item) => total + (item.sellingPrice || item.mrp), 0);

  // ── Subcomponents ──────────────────────────────────────────────

  const DietaryIcon = ({ type }) => {
    const isVeg = type !== 'Non-Veg';
    return (
      <div style={{ width: '18px', height: '18px', border: `2px solid ${isVeg ? '#166534' : '#7f1d1d'}`, display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '3px', backgroundColor: '#fff' }}>
        <div style={{ width: '9px', height: '9px', backgroundColor: isVeg ? '#166534' : '#7f1d1d', borderRadius: '50%' }} />
      </div>
    );
  };

  const Accordion = ({ title, icon, children }) => {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ borderBottom: '1px solid #f1f5f9' }}>
        <div onClick={() => setOpen(!open)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', fontSize: '0.95rem', color: '#111827' }}>
            <span style={{ fontSize: '1.1rem' }}>{icon}</span>
            {title}
          </div>
          <span style={{ color: '#94a3b8', fontSize: '1rem', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>⌄</span>
        </div>
        {open && (
          <div style={{ paddingBottom: '14px', animation: 'fadeIn 0.15s ease', textAlign: 'left' }}>
            {children}
          </div>
        )}
      </div>
    );
  };

  const relatedItems = selectedVariant.relatedProducts
    ? allItems.filter(item => selectedVariant.relatedProducts.includes(item._id) && item.inStock)
    : [];

  const handleRelatedProductClick = (item) => {
    setCurrentProduct(item);
    setSelectedVariant(item);
    setShowFullDesc(false);
    const el = document.getElementById('product-page-scroll');
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div
      style={{ 
        position: 'fixed', 
        inset: 0, 
        backgroundColor: '#fff', 
        zIndex: 10000, 
        display: 'flex', 
        flexDirection: 'column', 
        animation: 'slideUpPage 0.3s cubic-bezier(0.32,0.72,0,1)' 
      }}
    >
      <style>{`
        @keyframes slideUpPage { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .pm-hide-scroll::-webkit-scrollbar { display: none; }
        .pm-hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .pm-line-clamp { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

      {/* ── Top Navigation Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', backgroundColor: '#fff', borderBottom: '1px solid #f1f5f9', zIndex: 10 }}>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: '0 16px 0 0', color: '#111827', display: 'flex', alignItems: 'center' }}
        >
          ←
        </button>
        <h2 style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selectedVariant.brand ? `${selectedVariant.brand} Product` : 'Product Details'}
        </h2>
      </div>

      {/* ── Scrollable Content ── */}
      <div
        id="product-page-scroll"
        className="pm-hide-scroll"
        style={{ flex: 1, overflowY: 'auto', paddingBottom: cartTotalItems > 0 ? '160px' : '80px', backgroundColor: '#fff' }}
      >
        {/* Product Image */}
        <div style={{ width: '100%', height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', backgroundColor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 5 }}>
            <DietaryIcon type={selectedVariant.dietaryPreference} />
            {isDiscounted && (
              <span style={{ backgroundColor: '#2563eb', color: '#fff', fontSize: '0.7rem', fontWeight: '800', padding: '4px 8px', borderRadius: '5px', letterSpacing: '0.3px' }}>
                {discountPercent}% OFF
              </span>
            )}
          </div>
          {selectedVariant.image
            ? <img src={selectedVariant.image} alt={selectedVariant.name} style={{ maxHeight: '90%', maxWidth: '90%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
            : <span style={{ fontSize: '90px' }}>{selectedVariant.emoji}</span>
          }
        </div>

        {/* Product Info */}
        <div style={{ padding: '20px', textAlign: 'left' }}>

          {/* Brand */}
          {selectedVariant.brand && (
            <div style={{ color: '#0f9d58', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              {selectedVariant.brand} ›
            </div>
          )}

          {/* Title */}
          <h1 style={{ margin: '0 0 6px', fontSize: '1.3rem', fontWeight: '800', color: '#111827', lineHeight: '1.35' }}>
            {selectedVariant.name}
          </h1>

          {/* Weight */}
          <p style={{ margin: '0 0 20px', fontSize: '0.95rem', color: '#6b7280', fontWeight: '500' }}>
            {selectedVariant.qnty}
          </p>

          <div style={{ borderTop: '1px solid #f1f5f9', marginBottom: '20px' }} />

          {/* ── Variant Selector ── */}
          {currentProduct.variants && currentProduct.variants.length > 1 && (
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Select Size</p>
              <div className="pm-hide-scroll" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                {currentProduct.variants.map((v, i) => {
                  const isSel = selectedVariant._id === v._id;
                  const vDisc = v.sellingPrice && v.sellingPrice < v.mrp
                    ? Math.round(((v.mrp - v.sellingPrice) / v.mrp) * 100) : 0;
                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedVariant(v)}
                      style={{ 
                        minWidth: '100px', 
                        padding: '12px 14px', 
                        border: isSel ? '2px solid #1a7a3c' : '1.5px solid #e5e7eb', 
                        borderRadius: '12px', 
                        backgroundColor: isSel ? '#f0fdf4' : '#fff', 
                        textAlign: 'left', // 👈 Strictly Left Aligned
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        position: 'relative', 
                        cursor: 'pointer', 
                        flexShrink: 0, 
                        transition: 'all 0.15s' 
                      }}
                    >
                      {cart.filter(c => c._id === v._id).length > 0 && (
                        <div style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#1a7a3c', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.75rem', fontWeight: '800', border: '2px solid #fff', zIndex: 2 }}>
                          {cart.filter(c => c._id === v._id).length}
                        </div>
                      )}
                      {vDisc > 0 && (
                        <span style={{ position: 'absolute', top: '-10px', left: '12px', backgroundColor: '#2563eb', color: '#fff', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap', fontWeight: '700' }}>
                          {vDisc}% OFF
                        </span>
                      )}
                      <div style={{ fontWeight: '700', fontSize: '0.9rem', color: isSel ? '#065f46' : '#111827', marginTop: vDisc > 0 ? '6px' : 0 }}>{v.qnty}</div>
                      <div style={{ fontSize: '0.85rem', color: isSel ? '#0f9d58' : '#6b7280', fontWeight: '600', marginTop: '4px' }}>₹{v.sellingPrice || v.mrp}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Description ── */}
          {selectedVariant.description && (
            <div style={{ marginBottom: '8px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#111827', margin: '0 0 10px' }}>Product Details</h3>
              <div style={{ position: 'relative' }}>
                <p
                  className={showFullDesc ? '' : 'pm-line-clamp'}
                  style={{ fontSize: '0.9rem', color: '#4b5563', lineHeight: '1.65', margin: 0 }}
                >
                  {selectedVariant.description}
                </p>
                {!showFullDesc && selectedVariant.description.length > 120 && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30px', background: 'linear-gradient(transparent, #fff)' }} />
                )}
              </div>
              {selectedVariant.description.length > 120 && (
                <button
                  onClick={() => setShowFullDesc(!showFullDesc)}
                  style={{ background: 'none', border: 'none', color: '#0f9d58', fontWeight: '700', fontSize: '0.9rem', padding: '8px 0 0', cursor: 'pointer' }}
                >
                  {showFullDesc ? 'Read Less ⌃' : 'Read More ⌄'}
                </button>
              )}
            </div>
          )}

          {/* ── Nutrition Accordion ── */}
          {(selectedVariant.energy || selectedVariant.protein || selectedVariant.carbs || selectedVariant.fat) && (
            <Accordion title="Nutritional Value" icon="⚡">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[['Energy', selectedVariant.energy], ['Protein', selectedVariant.protein], ['Carbs', selectedVariant.carbs], ['Total Fat', selectedVariant.fat]].filter(([, v]) => v).map(([label, val]) => (
                  <div key={label} style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{label}</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#111827' }}>{val}</span>
                  </div>
                ))}
              </div>
            </Accordion>
          )}

          {/* ── Manufacturer Accordion ── */}
          {selectedVariant.manufacturer && (
            <Accordion title="Manufacturer Details" icon="🏢">
              <p style={{ fontSize: '0.9rem', color: '#4b5563', lineHeight: '1.6', margin: 0 }}>
                {selectedVariant.manufacturer}
              </p>
            </Accordion>
          )}

          {/* ── Cross-sell ── */}
          <CrossSellSlider
            title="Frequently Bought Together"
            items={relatedItems}
            onProductClick={handleRelatedProductClick}
            onAddToCart={onAddToCart}
          />

          {/* Disclaimer */}
          <div style={{ marginTop: '24px', padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.5' }}>
              <strong style={{ color: '#64748b' }}>Important Note:</strong> Every effort is made to maintain accuracy of all information. However, actual product packaging and materials may contain more and/or different information.
            </p>
          </div>
        </div>
      </div>

      {/* ── View Cart Bar ── */}
      {cartTotalItems > 0 && (
        <div
          onClick={() => { onClose(); if (onViewCart) onViewCart(); }}
          style={{ position: 'fixed', bottom: '72px', left: 0, right: 0, zIndex: 101, backgroundColor: '#237a3c', color: '#fff', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', animation: 'fadeIn 0.2s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: '7px 9px', borderRadius: '8px', fontSize: '1.05rem', lineHeight: 1 }}>🛒</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '600', fontSize: '0.85rem', opacity: 0.95 }}>
                {cartTotalItems} item{cartTotalItems > 1 ? 's' : ''}
              </div>
              <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>₹ {cartTotalPrice}</div>
            </div>
          </div>
          <div style={{ fontWeight: '800', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.2px' }}>
            View Cart <span style={{ fontSize: '1.1rem' }}>›</span>
          </div>
        </div>
      )}

      {/* ── Fixed Bottom Action Bar ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTop: '1px solid #e2e8f0', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 102, minHeight: '72px', paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>

        {/* Price left */}
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: '500', marginBottom: '2px' }}>
            {selectedVariant.qnty}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: '900', color: '#111827', lineHeight: 1 }}>₹{displayPrice}</span>
            {isDiscounted && <span style={{ fontSize: '0.85rem', color: '#9ca3af', textDecoration: 'line-through' }}>₹{selectedVariant.mrp}</span>}
          </div>
        </div>

        {/* Right: Green stepper OR green Add button */}
        {cartCount > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1a7a3c', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(26,122,60,0.35)' }}>
            <button
              onClick={() => onRemoveFromCart && onRemoveFromCart(selectedVariant)}
              style={{ width: '46px', height: '46px', border: 'none', backgroundColor: 'transparent', color: '#fff', fontSize: '1.4rem', fontWeight: '300', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', lineHeight: 1 }}
            >−</button>
            <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '800', fontSize: '1.05rem', color: '#fff' }}>{cartCount}</span>
            <button
              onClick={() => onAddToCart({ ...selectedVariant, mrp: displayPrice })}
              style={{ width: '46px', height: '46px', border: 'none', backgroundColor: 'transparent', color: '#fff', fontSize: '1.25rem', fontWeight: '300', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', lineHeight: 1 }}
            >+</button>
          </div>
        ) : (
          <button
            onClick={() => onAddToCart({ ...selectedVariant, mrp: displayPrice })}
            style={{ height: '46px', padding: '0 36px', backgroundColor: '#1a7a3c', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 2px 10px rgba(26,122,60,0.35)', letterSpacing: '0.3px' }}
          >
            Add
          </button>
        )}
      </div>

    </div>
  );
}

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
          <div style={{ paddingBottom: '14px', animation: 'fadeIn 0.15s ease' }}>
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
    const el = document.getElementById('modal-scroll-container');
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Render ─────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, backdropFilter: 'blur(2px)' }}
      />

      {/* Sheet */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 10000, height: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', animation: 'slideUpModal 0.28s cubic-bezier(0.32,0.72,0,1)' }}
      >
        <style>{`
          @keyframes slideUpModal { from { transform: translateY(100%); } to { transform: translateY(0); } }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
          .pm-hide-scroll::-webkit-scrollbar { display: none; }
          .pm-hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
          .pm-line-clamp { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        `}</style>

        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px', paddingBottom: '4px', flexShrink: 0 }}>
          <div style={{ width: '38px', height: '4px', backgroundColor: '#dde1e7', borderRadius: '99px' }} />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '14px', right: '14px', width: '32px', height: '32px', borderRadius: '50%', border: 'none', backgroundColor: '#f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1rem', color: '#64748b', zIndex: 20 }}
        >✕</button>

        {/* Scrollable content */}
        <div
          id="modal-scroll-container"
          className="pm-hide-scroll"
          style={{ flex: 1, overflowY: 'auto', paddingBottom: cartTotalItems > 0 ? '160px' : '80px' }}
        >
          {/* ── Product Image ── */}
          <div style={{ width: '100%', height: '260px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', backgroundColor: '#fff' }}>
            {/* Veg/Non-veg + discount badges */}
            <div style={{ position: 'absolute', top: '12px', left: '16px', display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 5 }}>
              <DietaryIcon type={selectedVariant.dietaryPreference} />
              {isDiscounted && (
                <span style={{ backgroundColor: '#2563eb', color: '#fff', fontSize: '0.65rem', fontWeight: '800', padding: '3px 7px', borderRadius: '5px', letterSpacing: '0.3px' }}>
                  {discountPercent}% OFF
                </span>
              )}
            </div>
            {selectedVariant.image
              ? <img src={selectedVariant.image} alt={selectedVariant.name} style={{ maxHeight: '88%', maxWidth: '88%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
              : <span style={{ fontSize: '80px' }}>{selectedVariant.emoji}</span>
            }
          </div>

          {/* ── Product Info ── */}
          <div style={{ padding: '18px 20px 0' }}>

            {/* Brand */}
            {selectedVariant.brand && (
              <div style={{ color: '#0f9d58', fontWeight: '700', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                {selectedVariant.brand} ›
              </div>
            )}

            {/* Title */}
            <h1 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: '800', color: '#111827', lineHeight: '1.35' }}>
              {selectedVariant.name}
            </h1>

            {/* Weight */}
            <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: '#6b7280', fontWeight: '500' }}>
              {selectedVariant.qnty}
            </p>

            <div style={{ borderTop: '1px solid #f1f5f9', marginBottom: '16px' }} />

            {/* ── Variant Selector ── */}
            {currentProduct.variants && currentProduct.variants.length > 1 && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Select Size</p>
                <div className="pm-hide-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {currentProduct.variants.map((v, i) => {
                    const isSel = selectedVariant._id === v._id;
                    const vDisc = v.sellingPrice && v.sellingPrice < v.mrp
                      ? Math.round(((v.mrp - v.sellingPrice) / v.mrp) * 100) : 0;
                    return (
                      <div
                        key={i}
                        onClick={() => setSelectedVariant(v)}
                        style={{ minWidth: '90px', padding: '10px 12px', border: isSel ? '2px solid #0f9d58' : '1.5px solid #e5e7eb', borderRadius: '12px', backgroundColor: isSel ? '#f0fdf4' : '#fff', textAlign: 'center', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
                      >
                        {vDisc > 0 && (
                          <span style={{ position: 'absolute', top: '-9px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#2563eb', color: '#fff', fontSize: '0.58rem', padding: '2px 5px', borderRadius: '4px', whiteSpace: 'nowrap', fontWeight: '700' }}>
                            {vDisc}% OFF
                          </span>
                        )}
                        <div style={{ fontWeight: '700', fontSize: '0.85rem', color: isSel ? '#065f46' : '#111827', marginTop: vDisc > 0 ? '4px' : 0 }}>{v.qnty}</div>
                        <div style={{ fontSize: '0.8rem', color: isSel ? '#0f9d58' : '#6b7280', fontWeight: '600' }}>₹{v.sellingPrice || v.mrp}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Description ── */}
            {selectedVariant.description && (
              <div style={{ marginBottom: '4px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827', margin: '0 0 8px' }}>Product Details</h3>
                <div style={{ position: 'relative' }}>
                  <p
                    className={showFullDesc ? '' : 'pm-line-clamp'}
                    style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: '1.65', margin: 0 }}
                  >
                    {selectedVariant.description}
                  </p>
                  {!showFullDesc && selectedVariant.description.length > 120 && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '28px', background: 'linear-gradient(transparent, #fff)' }} />
                  )}
                </div>
                {selectedVariant.description.length > 120 && (
                  <button
                    onClick={() => setShowFullDesc(!showFullDesc)}
                    style={{ background: 'none', border: 'none', color: '#0f9d58', fontWeight: '700', fontSize: '0.875rem', padding: '8px 0 0', cursor: 'pointer' }}
                  >
                    {showFullDesc ? 'Read Less ⌃' : 'Read More ⌄'}
                  </button>
                )}
              </div>
            )}

            {/* ── Nutrition Accordion ── */}
            {(selectedVariant.energy || selectedVariant.protein || selectedVariant.carbs || selectedVariant.fat) && (
              <Accordion title="Nutritional Value" icon="⚡">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[['Energy', selectedVariant.energy], ['Protein', selectedVariant.protein], ['Carbs', selectedVariant.carbs], ['Total Fat', selectedVariant.fat]].filter(([, v]) => v).map(([label, val]) => (
                    <div key={label} style={{ backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{label}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#111827' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </Accordion>
            )}

            {/* ── Manufacturer Accordion ── */}
            {selectedVariant.manufacturer && (
              <Accordion title="Manufacturer Details" icon="🏢">
                <p style={{ fontSize: '0.85rem', color: '#4b5563', lineHeight: '1.6', margin: 0 }}>
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
            <div style={{ marginTop: '20px', padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', lineHeight: '1.5' }}>
                <strong style={{ color: '#64748b' }}>Important Note:</strong> Every effort is made to maintain accuracy of all information. However, actual product packaging and materials may contain more and/or different information.
              </p>
            </div>
          </div>
        </div>

        {/* ── Floating View Cart ── */}
        {cartTotalItems > 0 && (
          <div style={{ position: 'absolute', bottom: '88px', left: '16px', right: '16px', zIndex: 101, animation: 'fadeIn 0.2s ease' }}>
            <div
              onClick={() => { onClose(); if (onViewCart) onViewCart(); }}
              style={{ backgroundColor: '#0c8c4e', color: '#fff', padding: '12px 18px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 8px 24px rgba(12,140,78,0.38)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.18)', padding: '6px 8px', borderRadius: '8px', fontSize: '1rem' }}>🛒</div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{cartTotalItems} item{cartTotalItems > 1 ? 's' : ''}</div>
                  <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>₹{cartTotalPrice}</div>
                </div>
              </div>
              <div style={{ fontWeight: '800', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View Cart <span>›</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Fixed Bottom Action Bar ── */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTop: '1px solid #f1f5f9', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 102, paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          
          {/* Price */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#111827', lineHeight: 1 }}>₹{displayPrice}</span>
              {isDiscounted && <span style={{ fontSize: '0.85rem', color: '#9ca3af', textDecoration: 'line-through' }}>₹{selectedVariant.mrp}</span>}
            </div>
            {isDiscounted && <div style={{ fontSize: '0.72rem', color: '#0f9d58', fontWeight: '600', marginTop: '2px' }}>You save ₹{selectedVariant.mrp - displayPrice}</div>}
          </div>

          {/* Quantity stepper OR Add button */}
          {cartCount > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
              {/* Stepper */}
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', marginRight: '10px' }}>
                <button
                  onClick={() => onRemoveFromCart && onRemoveFromCart(selectedVariant)}
                  style={{ width: '38px', height: '42px', border: 'none', backgroundColor: '#fff', color: '#374151', fontSize: '1.3rem', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                >−</button>
                <span style={{ minWidth: '28px', textAlign: 'center', fontWeight: '800', fontSize: '1rem', color: '#111827' }}>{cartCount}</span>
                <button
                  onClick={() => onAddToCart({ ...selectedVariant, mrp: displayPrice })}
                  style={{ width: '38px', height: '42px', border: 'none', backgroundColor: '#fff', color: '#374151', fontSize: '1.2rem', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                >+</button>
              </div>

              {/* Add more */}
              <button
                onClick={() => onAddToCart({ ...selectedVariant, mrp: displayPrice })}
                style={{ height: '42px', padding: '0 22px', backgroundColor: '#0f9d58', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(15,157,88,0.3)' }}
              >
                Add
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAddToCart({ ...selectedVariant, mrp: displayPrice })}
              style={{ height: '46px', padding: '0 32px', backgroundColor: '#0f9d58', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(15,157,88,0.3)' }}
            >
              Add
            </button>
          )}
        </div>

      </div>
    </>
  );
          }
                    

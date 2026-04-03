import React, { useState, useEffect, useMemo } from 'react';
import CrossSellSlider from './CrossSell.jsx';
import ReviewSection from './ReviewSection.jsx'; 

const DietaryIcon = ({ isVeg }) => {
  return (
    <div style={{ width: '16px', height: '16px', border: `1.5px solid ${isVeg ? '#166534' : '#7f1d1d'}`, display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '4px', backgroundColor: '#fff' }}>
      <div style={{ width: '8px', height: '8px', backgroundColor: isVeg ? '#166534' : '#7f1d1d', borderRadius: '50%' }} />
    </div>
  );
};

const Accordion = ({ title, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: '2px solid #f1f5f9', marginTop: '15px' }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', cursor: 'pointer' }}>
        <div style={{ fontWeight: '800', fontSize: '1.05rem', color: '#111827' }}>
          {title}
        </div>
        <span style={{ color: '#94a3b8', fontSize: '1.2rem', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}>▼</span>
      </div>
      {open && (
        <div style={{ paddingBottom: '16px', animation: 'fadeIn 0.2s ease', textAlign: 'left' }}>
          {children}
        </div>
      )}
    </div>
  );
};

export default function ProductModal({ product, isOpen, onClose, onAddToCart, onRemoveFromCart, onViewCart, allItems = [], cart = [] }) {
  const [currentProduct, setCurrentProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const BOTTOM_NAV_HEIGHT = '56px'; 

  // 🛡️ MOBILE BACK BUTTON FIX
  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modalOpen: true }, '');
      const handlePopState = () => onClose();
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (product) {
      setCurrentProduct(product);
      setSelectedVariant(product);
    }
  }, [product]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; 
    } else {
      document.body.style.overflow = ''; 
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const relatedItems = useMemo(() => {
    if (!selectedVariant || !selectedVariant.relatedProducts || !allItems.length) return [];
    return allItems.filter(item => selectedVariant.relatedProducts.includes(item._id) && item.inStock);
  }, [selectedVariant, allItems]);

  if (!isOpen || !currentProduct || !selectedVariant) return null;

  const displayPrice = selectedVariant.sellingPrice || selectedVariant.mrp;
  const isDiscounted = displayPrice < selectedVariant.mrp;
  const discountPercent = isDiscounted ? Math.round(((selectedVariant.mrp - displayPrice) / selectedVariant.mrp) * 100) : 0;

  const safeCart = Array.isArray(cart) ? cart : [];
  const cartItem = safeCart.find(item => item._id === selectedVariant._id);
  const cartCount = cartItem ? cartItem.qty : 0;
  const cartTotalItems = safeCart.reduce((total, item) => total + (item.qty || 1), 0);
  const cartTotalPrice = safeCart.reduce((total, item) => total + ((item.sellingPrice || item.mrp) * (item.qty || 1)), 0);

  const handleRelatedProductClick = (item) => {
    setCurrentProduct(item);
    setSelectedVariant(item);
    const el = document.getElementById('product-page-scroll');
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: BOTTOM_NAV_HEIGHT, backgroundColor: '#fff', zIndex: 10000, display: 'flex', flexDirection: 'column', animation: 'slideUpPage 0.25s cubic-bezier(0.32,0.72,0,1)' }}>
      <style>{`
        @keyframes slideUpPage { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .pm-hide-scroll::-webkit-scrollbar { display: none; }
        .pm-hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: '12px 16px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', zIndex: 10 }}>
        <button onClick={() => window.history.back()} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: '0 16px 0 0', color: '#111827' }}>←</button>
        <h2 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: '#111827' }}>{selectedVariant.Brand || 'Product Details'}</h2>
      </div>

      <div id="product-page-scroll" className="pm-hide-scroll" style={{ flex: 1, overflowY: 'auto', paddingBottom: '120px' }}>
        <div style={{ width: '100%', height: '320px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
          {selectedVariant.image ? <img src={selectedVariant.image} style={{ maxHeight: '90%', maxWidth: '90%', objectFit: 'contain' }} /> : <span style={{ fontSize: '90px' }}>{selectedVariant.emoji}</span>}
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '800' }}>{selectedVariant.name}</h1>
            <DietaryIcon isVeg={selectedVariant.isVeg} />
          </div>

          {/* Variants */}
          {currentProduct.variants?.length > 1 && (
            <div style={{ marginTop: '24px' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: '800', marginBottom: '12px' }}>Select Unit</p>
              <div className="pm-hide-scroll" style={{ display: 'flex', gap: '12px', overflowX: 'auto' }}>
                {currentProduct.variants.map((v, i) => (
                  <div key={i} onClick={() => setSelectedVariant(v)} style={{ minWidth: '100px', padding: '12px', border: selectedVariant._id === v._id ? '2px solid #0c831f' : '1.5px solid #e5e7eb', borderRadius: '12px', backgroundColor: selectedVariant._id === v._id ? '#f4fbf6' : '#fff' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{v.qnty}</div>
                    <div style={{ fontWeight: '800', fontSize: '0.85rem' }}>₹{v.sellingPrice || v.mrp}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 📋 UNIFIED PRODUCT DETAILS ACCORDION */}
          <Accordion title="Product Details">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {selectedVariant.description && selectedVariant.description !== "nan" && (
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Description</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#4b5563', lineHeight: '1.5' }}>{selectedVariant.description}</p>
                </div>
              )}
              {selectedVariant.ingredients && selectedVariant.ingredients !== "nan" && (
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Ingredients</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#4b5563', lineHeight: '1.5' }}>{selectedVariant.ingredients}</p>
                </div>
              )}
              {(selectedVariant.energy || selectedVariant.protein || selectedVariant.carbs) && (
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Nutrition (per 100g)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[['Energy', selectedVariant.energy], ['Protein', selectedVariant.protein], ['Carbs', selectedVariant.carbs]].map(([l, v]) => v && v !== "nan" && (
                      <div key={l} style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{l}</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Accordion>

          <CrossSellSlider title="Frequently Bought Together" items={relatedItems} onProductClick={handleRelatedProductClick} onAddToCart={onAddToCart} />
          
          <ReviewSection targetId={selectedVariant._id} reviews={selectedVariant.reviews || []} type="Product" />
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div style={{ flexShrink: 0, backgroundColor: '#fff', borderTop: '1px solid #f1f5f9', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>₹{displayPrice}</div>
          {isDiscounted && <span style={{ fontSize: '0.8rem', color: '#9ca3af', textDecoration: 'line-through' }}>MRP ₹{selectedVariant.mrp}</span>}
        </div>
        {cartCount > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0c831f', borderRadius: '8px', height: '40px', width: '100px' }}>
            <button onClick={() => onRemoveFromCart(selectedVariant)} style={{ flex: 1, color: '#fff', border: 'none', background: 'none', fontSize: '1.5rem' }}>-</button>
            <span style={{ color: '#fff', fontWeight: '800' }}>{cartCount}</span>
            <button onClick={() => onAddToCart(selectedVariant)} style={{ flex: 1, color: '#fff', border: 'none', background: 'none', fontSize: '1.5rem' }}>+</button>
          </div>
        ) : (
          <button onClick={() => onAddToCart(selectedVariant)} style={{ height: '40px', padding: '0 24px', backgroundColor: '#0c831f', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '800' }}>Add to cart</button>
        )}
      </div>

      {/* Floating Cart Bar */}
      {cartTotalItems > 0 && (
        <div onClick={() => { window.history.back(); setTimeout(onViewCart, 100); }} style={{ position: 'absolute', bottom: '85px', left: '12px', right: '12px', backgroundColor: '#0c831f', color: '#fff', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
          <div style={{ fontWeight: '800' }}>{cartTotalItems} items | ₹{cartTotalPrice}</div>
          <div style={{ fontWeight: '800' }}>View Cart ▶</div>
        </div>
      )}
    </div>
  );
}

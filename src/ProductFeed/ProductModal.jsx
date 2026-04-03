import React, { useState, useEffect, useMemo } from 'react';
import CrossSellSlider from './CrossSell.jsx';
import ReviewSection from './ReviewSection.jsx';

// ── Zepto-Style Highlights Row Component ──
const HighlightRow = ({ label, value }) => {
  if (!value || value === "nan" || value === "") return null;
  return (
    <div style={{ display: 'flex', padding: '12px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
      <div style={{ flex: '0 0 40%', color: '#64748b', fontSize: '0.85rem', fontWeight: '500' }}>
        {label}
      </div>
      <div style={{ flex: 1, color: '#1e293b', fontSize: '0.85rem', fontWeight: '600', paddingLeft: '10px' }}>
        {value}
      </div>
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
        .pm-hide-scroll::-webkit-scrollbar { display: none; }
        .pm-hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ── Original Header Style ── */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: '12px 16px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', zIndex: 10 }}>
        <button onClick={() => window.history.back()} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: '0 16px 0 0', color: '#111827' }}>
          ←
        </button>
        <h2 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: '#111827' }}>
          {selectedVariant.brand || 'Product Details'}
        </h2>
      </div>

      <div id="product-page-scroll" className="pm-hide-scroll" style={{ flex: 1, overflowY: 'auto', paddingBottom: '120px' }}>
        
        {/* Product Image */}
        <div style={{ width: '100%', height: '320px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
          {selectedVariant.image ? <img src={selectedVariant.image} alt={selectedVariant.name} style={{ maxHeight: '90%', maxWidth: '90%', objectFit: 'contain', mixBlendMode: 'multiply' }} /> : <span style={{ fontSize: '90px' }}>{selectedVariant.emoji}</span>}
        </div>

        <div style={{ padding: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '800', color: '#111827' }}>{selectedVariant.name}</h1>
          <p style={{ fontSize: '0.9rem', color: '#4b5563', margin: '5px 0 20px 0', fontWeight: '500' }}>{selectedVariant.qnty}</p>

          {/* Variants Selector */}
          {currentProduct.variants?.length > 1 && (
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: '800', color: '#111827', marginBottom: '12px' }}>Select Unit</p>
              <div className="pm-hide-scroll" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '5px' }}>
                {currentProduct.variants.map((v, i) => (
                  <div key={i} onClick={() => setSelectedVariant(v)} style={{ minWidth: '100px', padding: '12px', border: selectedVariant._id === v._id ? '2px solid #0c831f' : '1.5px solid #e5e7eb', borderRadius: '12px', backgroundColor: selectedVariant._id === v._id ? '#f4fbf6' : '#fff' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{v.qnty}</div>
                    <div style={{ fontWeight: '800', fontSize: '0.85rem' }}>₹{v.sellingPrice || v.mrp}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 📋 ZEPTO-STYLE HIGHLIGHTS TABLE */}
          <div style={{ marginTop: '10px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#111827', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                Highlights <div style={{ flex: 1, height: '1px', backgroundColor: '#f1f5f9' }} />
            </h3>
            
            <HighlightRow label="Brand" value={selectedVariant.brand} />
            <HighlightRow label="Unit" value={selectedVariant.qnty} />
            <HighlightRow label="Description" value={selectedVariant.description} />
            <HighlightRow label="Ingredients" value={selectedVariant.ingredients} />
            <HighlightRow label="Dietary Preference" value={selectedVariant.isVeg ? 'Veg' : 'Non-Veg'} />
            <HighlightRow label="Manufacturer" value={selectedVariant.manufacturer} />
            <HighlightRow label="Address" value={selectedVariant.manufactureraddress} />
          </div>

          {/* 📊 NUTRITIONAL INFORMATION GRID */}
          {(selectedVariant.energy || selectedVariant.protein || selectedVariant.carbs) && (
            <div style={{ marginTop: '30px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#111827', marginBottom: '15px' }}>Nutritional Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                      ['Energy', selectedVariant.energy], 
                      ['Protein', selectedVariant.protein], 
                      ['Carbs', selectedVariant.carbs], 
                      ['Fat', selectedVariant.fat],
                      ['Sugar', selectedVariant.sugar]
                    ].filter(([, v]) => v && v !== "nan").map(([label, val]) => (
                        <div key={label} style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>{label}</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#111827' }}>{val}</div>
                        </div>
                    ))}
                </div>
            </div>
          )}

          <CrossSellSlider title="Frequently Bought Together" items={relatedItems} onProductClick={handleRelatedProductClick} onAddToCart={onAddToCart} />
          
          <ReviewSection reviews={selectedVariant.reviews || []} readOnly={true} />
        </div>
      </div>

      {/* 💵 Original Green Bottom Bar */}
      <div style={{ flexShrink: 0, backgroundColor: '#fff', borderTop: '1px solid #f1f5f9', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 102, minHeight: '75px' }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827' }}>₹{displayPrice}</div>
          {isDiscounted && <span style={{ fontSize: '0.8rem', color: '#9ca3af', textDecoration: 'line-through' }}>MRP ₹{selectedVariant.mrp}</span>}
        </div>
        
        {cartCount > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0c831f', borderRadius: '8px', overflow: 'hidden', height: '40px', minWidth: '100px' }}>
            <button onClick={() => onRemoveFromCart(selectedVariant)} style={{ flex: 1, height: '100%', border: 'none', backgroundColor: 'transparent', color: '#fff', fontSize: '1.4rem' }}>−</button>
            <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: '800', color: '#fff' }}>{cartCount}</span>
            <button onClick={() => onAddToCart(selectedVariant)} style={{ flex: 1, height: '100%', border: 'none', backgroundColor: 'transparent', color: '#fff', fontSize: '1.25rem' }}>+</button>
          </div>
        ) : (
          <button onClick={() => onAddToCart(selectedVariant)} style={{ height: '40px', minWidth: '100px', backgroundColor: '#0c831f', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '0.9rem' }}>Add to cart</button>
        )}
      </div>

      {/* Original Floating View Cart Bar */}
      {cartTotalItems > 0 && (
        <div onClick={() => { window.history.back(); setTimeout(onViewCart, 100); }} style={{ position: 'absolute', bottom: '85px', left: '12px', right: '12px', zIndex: 101, backgroundColor: '#0c831f', color: '#fff', padding: '10px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <div style={{ fontWeight: '800', fontSize: '1rem' }}>{cartTotalItems} items | ₹{cartTotalPrice}</div>
          <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>View Cart ▶</div>
        </div>
      )}
    </div>
  );
}

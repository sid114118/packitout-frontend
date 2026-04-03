import React, { useState, useEffect } from 'react';
import ReviewSection from './ReviewSection.jsx';

// ── Highlight Row Component ──
const HighlightRow = ({ label, value }) => {
  if (!value || value === "nan" || value === "") return null;
  return (
    <div style={{ display: 'flex', padding: '12px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
      <div style={{ flex: '0 0 35%', color: '#111827', fontSize: '0.9rem', fontWeight: '800' }}>
        {label}
      </div>
      <div style={{ flex: 1, color: '#4b5563', fontSize: '0.9rem', fontWeight: '500', paddingLeft: '15px', lineHeight: '1.5' }}>
        {value}
      </div>
    </div>
  );
};

// ── Dropdown Accordion Component ──
const Accordion = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderTop: '4px solid #f8fafc', marginTop: '10px' }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', cursor: 'pointer' }}>
        <div style={{ fontWeight: '900', fontSize: '1.1rem', color: '#111827' }}>
          {title}
        </div>
        <span style={{ color: '#94a3b8', fontSize: '1.2rem', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}>▼</span>
      </div>
      {open && (
        <div style={{ paddingBottom: '20px', animation: 'fadeIn 0.2s ease', textAlign: 'left' }}>
          {children}
        </div>
      )}
    </div>
  );
};

export default function ProductModal({ product, isOpen, onClose, onAddToCart, onRemoveFromCart, onViewCart, cart = [] }) {
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

  // 🛡️ SAFE CART CALCULATIONS
  const safeCart = Array.isArray(cart) ? cart.filter(item => item !== null) : [];
  
  if (!isOpen || !currentProduct || !selectedVariant) return null;

  const displayPrice = selectedVariant.sellingPrice || selectedVariant.mrp || 0;
  const isDiscounted = displayPrice < (selectedVariant.mrp || 0);
  
  const cartItem = safeCart.find(item => item._id === selectedVariant._id);
  const cartCount = cartItem ? cartItem.qty : 0;
  
  const cartTotalItems = safeCart.reduce((total, item) => total + (Number(item.qty) || 0), 0);
  const cartTotalPrice = safeCart.reduce((total, item) => {
    const price = Number(item.sellingPrice || item.mrp || 0);
    return total + (price * (Number(item.qty) || 0));
  }, 0);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: BOTTOM_NAV_HEIGHT, backgroundColor: '#fff', zIndex: 10000, display: 'flex', flexDirection: 'column', animation: 'slideUpPage 0.25s cubic-bezier(0.32,0.72,0,1)' }}>
      <style>{`
        @keyframes slideUpPage { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .pm-hide-scroll::-webkit-scrollbar { display: none; }
        .pm-hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: '12px 16px', backgroundColor: '#fff', borderBottom: '1px solid #f1f5f9', zIndex: 10 }}>
        <button onClick={() => window.history.back()} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', paddingRight: '15px' }}>←</button>
        <h2 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: '#111827' }}>Product Details</h2>
      </div>

      <div id="product-page-scroll" className="pm-hide-scroll" style={{ flex: 1, overflowY: 'auto', paddingBottom: '120px' }}>
        
        {/* Product Image */}
        <div style={{ width: '100%', height: '320px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
          {selectedVariant.image ? <img src={selectedVariant.image} alt={selectedVariant.name} style={{ maxHeight: '90%', maxWidth: '90%', objectFit: 'contain' }} /> : <span style={{ fontSize: '90px' }}>{selectedVariant.emoji}</span>}
        </div>

        <div style={{ padding: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: '#111827' }}>{selectedVariant.name}</h1>
          <p style={{ fontSize: '0.95rem', color: '#64748b', margin: '5px 0 20px 0', fontWeight: '600' }}>{selectedVariant.qnty}</p>

          {/* 💵 ADD TO CART SECTION */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderTop: '1px solid #f1f5f9' }}>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#111827' }}>₹{displayPrice}</div>
              {isDiscounted && <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>MRP <span style={{ textDecoration: 'line-through' }}>₹{selectedVariant.mrp}</span></div>}
            </div>
            
            {cartCount > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0c831f', borderRadius: '10px', height: '44px', width: '110px', boxShadow: '0 4px 10px rgba(12, 131, 31, 0.2)' }}>
                <button onClick={() => onRemoveFromCart(selectedVariant)} style={{ flex: 1, color: '#fff', border: 'none', background: 'none', fontSize: '1.4rem', fontWeight: 'bold' }}>-</button>
                <span style={{ color: '#fff', fontWeight: '900' }}>{cartCount}</span>
                <button onClick={() => onAddToCart(selectedVariant)} style={{ flex: 1, color: '#fff', border: 'none', background: 'none', fontSize: '1.4rem', fontWeight: 'bold' }}>+</button>
              </div>
            ) : (
              <button onClick={() => onAddToCart(selectedVariant)} style={{ height: '44px', padding: '0 30px', backgroundColor: '#0c831f', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '1rem', boxShadow: '0 4px 10px rgba(12, 131, 31, 0.2)' }}>
                Add to cart
              </button>
            )}
          </div>

          {/* Variants Selector */}
          {currentProduct.variants?.length > 1 && (
            <div style={{ margin: '15px 0 24px 0' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: '800', color: '#111827', marginBottom: '12px' }}>Select Unit</p>
              <div className="pm-hide-scroll" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '5px' }}>
                {currentProduct.variants.map((v, i) => (
                  <div key={i} onClick={() => setSelectedVariant(v)} style={{ minWidth: '100px', padding: '12px', border: selectedVariant._id === v._id ? '2px solid #0c831f' : '1.5px solid #e5e7eb', borderRadius: '12px', backgroundColor: selectedVariant._id === v._id ? '#f4fbf6' : '#fff' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>{v.qnty}</div>
                    <div style={{ fontWeight: '900', fontSize: '0.85rem' }}>₹{v.sellingPrice || v.mrp}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 📋 PRODUCT INFORMATION DROPDOWN */}
          <Accordion title="Product Information" defaultOpen={true}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <HighlightRow label="Brand" value={selectedVariant.brand} />
              <HighlightRow label="Unit" value={selectedVariant.qnty} />
              <HighlightRow label="Description" value={selectedVariant.description} />
              <HighlightRow label="Ingredients" value={selectedVariant.ingredients} />
              <HighlightRow label="Dietary" value={selectedVariant.isVeg ? 'Veg' : 'Non-Veg'} />
              <HighlightRow label="Manufacturer" value={selectedVariant.manufacturer} />
              <HighlightRow label="Address" value={selectedVariant.manufactureraddress} />
            </div>

            {(selectedVariant.energy || selectedVariant.protein) && (
              <div style={{ marginTop: '25px' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: '800', color: '#111827', marginBottom: '12px' }}>Nutritional Information</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                      ['Energy', selectedVariant.energy], 
                      ['Protein', selectedVariant.protein], 
                      ['Carbs', selectedVariant.carbs], 
                      ['Fat', selectedVariant.fat]
                    ].filter(([, v]) => v && v !== "nan").map(([label, val]) => (
                        <div key={label} style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>{label}</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1e293b' }}>{val}</div>
                        </div>
                    ))}
                </div>
              </div>
            )}
          </Accordion>
          
          <ReviewSection reviews={selectedVariant.reviews || []} readOnly={true} />
        </div>
      </div>

      {/* 🛒 FLOATING VIEW CART BAR */}
      {cartTotalItems > 0 && (
        <div onClick={() => { window.history.back(); setTimeout(onViewCart, 100); }} style={{ position: 'absolute', bottom: '15px', left: '12px', right: '12px', backgroundColor: '#0c831f', color: '#fff', padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '800', boxShadow: '0 8px 20px rgba(12, 131, 31, 0.3)', zIndex: 1000 }}>
          <span>{cartTotalItems} items | ₹{cartTotalPrice}</span>
          <span>View Cart ▶</span>
        </div>
      )}
    </div>
  );
      }
          

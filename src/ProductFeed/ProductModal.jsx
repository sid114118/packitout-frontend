import React, { useState, useEffect } from 'react';
import ReviewSection from './ReviewSection.jsx';
import CrossSellSlider from './CrossSell.jsx'; 

// ── Highlight Row Component ──
const HighlightRow = ({ label, value }) => {
  if (!value || value === "nan" || value === "") return null;
  return (
    <div style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid #f3f4f6', alignItems: 'flex-start' }}>
      <div style={{ flex: '0 0 35%', color: '#111827', fontSize: '0.85rem', fontWeight: '700' }}>
        {label}
      </div>
      <div style={{ flex: 1, color: '#4b5563', fontSize: '0.85rem', fontWeight: '400', paddingLeft: '15px', lineHeight: '1.4' }}>
        {value}
      </div>
    </div>
  );
};

// ── Dropdown Accordion Component ──
const Accordion = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderTop: '4px solid #f9fafb', marginTop: '10px' }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', cursor: 'pointer' }}>
        <div style={{ fontWeight: '700', fontSize: '1rem', color: '#111827' }}>
          {title}
        </div>
        <span style={{ color: '#94a3b8', fontSize: '1rem', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}>▼</span>
      </div>
      {open && (
        <div style={{ paddingBottom: '15px', animation: 'fadeIn 0.2s ease', textAlign: 'left' }}>
          {children}
        </div>
      )}
    </div>
  );
};

export default function ProductModal({ product, isOpen, onClose, onAddToCart, onRemoveFromCart, onViewCart, allItems = [], cart = [], onViewBrand }) {
  const [currentProduct, setCurrentProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [productReviews, setProductReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";
  const BOTTOM_NAV_HEIGHT = '56px';

  // 🛡️ MOBILE BACK BUTTON & POPSTATE
  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modalOpen: true }, '');
      const handlePopState = () => onClose();
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isOpen, onClose]);

  // SET INITIAL PRODUCT
  useEffect(() => {
    if (product) {
      setCurrentProduct(product);
      setSelectedVariant(product);
    }
  }, [product]);

  // 📝 FETCH DYNAMIC REVIEWS FOR THIS PRODUCT
  useEffect(() => {
    if (isOpen && selectedVariant?._id) {
      setLoadingReviews(true);
      fetch(`${BASE_URL}/reviews/product/${selectedVariant._id}`)
        .then(res => res.json())
        .then(data => {
          setProductReviews(Array.isArray(data) ? data : []);
          setLoadingReviews(false);
        })
        .catch(() => setLoadingReviews(false));
    }
  }, [isOpen, selectedVariant?._id]);

  const safeCart = Array.isArray(cart) ? cart.filter(item => item !== null) : [];
  
  if (!isOpen || !currentProduct || !selectedVariant) return null;

  const mrp = Number(selectedVariant.mrp || 0);
  const displayPrice = Number(selectedVariant.sellingPrice || mrp || 0);
  const isDiscounted = displayPrice < mrp;
  const savings = isDiscounted ? (mrp - displayPrice) : 0;
  const discountPercent = isDiscounted ? Math.round((savings / mrp) * 100) : 0;
  
  const cartItem = safeCart.find(item => item._id === selectedVariant._id);
  const cartCount = cartItem ? cartItem.qty : 0;
  
  const cartTotalItems = safeCart.reduce((total, item) => total + (Number(item.qty) || 0), 0);
  const cartTotalPrice = safeCart.reduce((total, item) => {
    const price = Number(item.sellingPrice || item.mrp || 0);
    return total + (price * (Number(item.qty) || 0));
  }, 0);

  const handleVariantChange = (v) => {
    setSelectedVariant(v);
    const el = document.getElementById('product-page-scroll');
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: BOTTOM_NAV_HEIGHT, backgroundColor: '#fff', zIndex: 3000, display: 'flex', flexDirection: 'column', animation: 'slideUpPage 0.25s cubic-bezier(0.32,0.72,0,1)' }}>
      <style>{`
        @keyframes slideUpPage { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .pm-hide-scroll::-webkit-scrollbar { display: none; }
        .pm-hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: '10px 16px', backgroundColor: '#fff', borderBottom: '1px solid #f1f5f9', zIndex: 10 }}>
        <button onClick={() => window.history.back()} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', paddingRight: '15px' }}>←</button>
        <h2 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, color: '#111827' }}>Product Details</h2>
      </div>

      <div id="product-page-scroll" className="pm-hide-scroll" style={{ flex: 1, overflowY: 'auto', paddingBottom: '120px' }}>
        
        {/* Product Image */}
        <div style={{ width: '100%', height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
          {selectedVariant.image ? <img src={selectedVariant.image} alt={selectedVariant.name} style={{ maxHeight: '85%', maxWidth: '85%', objectFit: 'contain' }} /> : <span style={{ fontSize: '80px' }}>{selectedVariant.emoji}</span>}
        </div>

        <div style={{ padding: '0 20px 20px 20px' }}>
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#111827', lineHeight: '1.4' }}>{selectedVariant.name}</h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
             <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, fontWeight: '500' }}>{selectedVariant.qnty}</p>
             {/* Dynamic Rating Badge */}
             {productReviews.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: '#f0fdf4', padding: '2px 6px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', color: '#166534', border: '1px solid #dcfce7' }}>
                   ⭐ {(productReviews.reduce((a, b) => a + b.rating, 0) / productReviews.length).toFixed(1)}
                </div>
             )}
          </div>

          {/* 💵 ACTION SECTION */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderTop: '1px solid #f3f4f6', marginTop: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827' }}>₹{displayPrice}</span>
                {isDiscounted && (
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through' }}>₹{mrp}</span>
                )}
                {isDiscounted && (
                  <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', fontSize: '0.65rem', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
              {isDiscounted && (
                <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '700' }}>
                  You save ₹{savings}
                </div>
              )}
            </div>
            
            {cartCount > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0c831f', borderRadius: '8px', height: '38px', width: '100px' }}>
                <button onClick={() => onRemoveFromCart(selectedVariant)} style={{ flex: 1, color: '#fff', border: 'none', background: 'none', fontSize: '1.2rem', fontWeight: 'bold' }}>-</button>
                <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem' }}>{cartCount}</span>
                <button onClick={() => onAddToCart(selectedVariant)} style={{ flex: 1, color: '#fff', border: 'none', background: 'none', fontSize: '1.2rem', fontWeight: 'bold' }}>+</button>
              </div>
            ) : (
              <button onClick={() => onAddToCart(selectedVariant)} style={{ height: '38px', padding: '0 20px', backgroundColor: '#0c831f', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.9rem' }}>
                Add to cart
              </button>
            )}
          </div>

          {/* Variants Selector */}
          {currentProduct.variants?.length > 1 && (
            <div style={{ margin: '10px 0 10px 0' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#111827', marginBottom: '10px' }}>Select Unit</p>
              <div className="pm-hide-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                {currentProduct.variants.map((v, i) => (
                  <div key={i} onClick={() => handleVariantChange(v)} style={{ minWidth: '90px', padding: '10px', border: selectedVariant._id === v._id ? '2px solid #0c831f' : '1px solid #e5e7eb', borderRadius: '10px', backgroundColor: selectedVariant._id === v._id ? '#f4fbf6' : '#fff', cursor: 'pointer' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{v.qnty}</div>
                    <div style={{ fontWeight: '700', fontSize: '0.8rem' }}>₹{v.sellingPrice || v.mrp}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🏷️ BRAND VIEW CARD */}
          {selectedVariant.brand && selectedVariant.brand !== "nan" && (
            <div 
              onClick={() => {
                if(onViewBrand) {
                  onClose(); 
                  setTimeout(() => onViewBrand(selectedVariant.brand), 100); 
                }
              }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', margin: '15px 0', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '900', color: '#0c831f', fontSize: '1.2rem', border: '1px solid #e2e8f0' }}>
                  {selectedVariant.brand.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '1rem', color: '#111827' }}>{selectedVariant.brand}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>View all products</div>
                </div>
              </div>
              <div style={{ color: '#94a3b8', fontSize: '1.4rem' }}>›</div>
            </div>
          )}

          <Accordion title="Product Information" defaultOpen={true}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <HighlightRow label="Brand" value={selectedVariant.brand} />
              <HighlightRow label="Unit" value={selectedVariant.qnty} />
              <HighlightRow label="Description" value={selectedVariant.description} />
              <HighlightRow label="Ingredients" value={selectedVariant.ingredients} />
              <HighlightRow label="Dietary" value={selectedVariant.isVeg ? 'Veg' : 'Non-Veg'} />
              <HighlightRow label="Manufacturer" value={selectedVariant.manufacturer} />
              <HighlightRow label="Address" value={selectedVariant.manufactureraddress} />
              {/* 🥗 MODERN NUTRITIONAL GRID UI */}
              {(() => {
                const nutrients = [
                  { label: 'Energy', value: selectedVariant.energy },
                  { label: 'Protein', value: selectedVariant.protein },
                  { label: 'Carbs', value: selectedVariant.carbs },
                  { label: 'Sugar', value: selectedVariant.sugar },
                  { label: 'Fat', value: selectedVariant.fat }
                ].filter(n => n.value && String(n.value).trim() !== "nan" && String(n.value).trim() !== "");

                if (nutrients.length === 0) return null;
                
                return (
                  <div style={{ padding: '15px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ color: '#111827', fontSize: '0.85rem', fontWeight: '700', marginBottom: '12px' }}>
                      Nutritional Values
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {nutrients.map((n, idx) => (
                        <div key={idx} style={{ 
                          flex: '1 1 calc(33.333% - 8px)', 
                          minWidth: '80px', 
                          backgroundColor: '#f8fafc', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '8px', 
                          padding: '10px 8px', 
                          textAlign: 'center' 
                        }}>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>
                            {n.label}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: '800', marginTop: '4px' }}>
                            {n.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              
            </div>
          </Accordion>

          <CrossSellSlider 
            allItems={allItems} 
            currentProduct={selectedVariant} 
            onAddToCart={onAddToCart} 
            onRemoveFromCart={onRemoveFromCart}
            cart={safeCart}
          />
          
          {/* 💬 REVIEWS SECTION */}
          <div style={{ marginTop: '20px' }}>
             <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#111827', marginBottom: '15px' }}>Ratings & Reviews</h3>
             {loadingReviews ? (
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Loading reviews...</div>
             ) : productReviews.length > 0 ? (
                <ReviewSection reviews={productReviews} readOnly={true} />
             ) : (
                <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                   {/* 🛡️ UPDATED: Removed "Be the first to rate it" text */}
                   <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>No reviews yet for this product.</p>
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Floating View Cart Bar */}
      {cartTotalItems > 0 && (
        <div onClick={() => { window.history.back(); setTimeout(onViewCart, 100); }} style={{ position: 'absolute', bottom: '15px', left: '12px', right: '12px', backgroundColor: '#0c831f', color: '#fff', padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '700', fontSize: '0.9rem', boxShadow: '0 8px 20px rgba(12, 131, 31, 0.3)', zIndex: 1000 }}>
          <span>{cartTotalItems} items | ₹{cartTotalPrice}</span>
          <span>View Cart ▶</span>
        </div>
      )}
    </div>
  );
}

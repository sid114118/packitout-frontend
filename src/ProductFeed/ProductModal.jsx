import React, { useState, useEffect, useRef } from 'react';
import ReviewSection from './ReviewSection.jsx';
import CrossSellSlider from './CrossSell.jsx'; 

// ── Highlight Row Component ──
const HighlightRow = ({ label, value }) => {
  if (!value || value === "nan" || value === "") return null;
  return (
    <div style={{ display: 'flex', padding: '12px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
      <div style={{ flex: '0 0 35%', color: '#475569', fontSize: '0.85rem', fontWeight: '600' }}>
        {label}
      </div>
      <div style={{ flex: 1, color: '#0f172a', fontSize: '0.85rem', fontWeight: '500', paddingLeft: '15px', lineHeight: '1.4' }}>
        {value}
      </div>
    </div>
  );
};

// ── Dropdown Accordion Component ──
const Accordion = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderTop: '8px solid #f8fafc', marginTop: '15px', padding: '0 20px' }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', cursor: 'pointer' }}>
        <div style={{ fontWeight: '800', fontSize: '1.05rem', color: '#0f172a' }}>
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

export default function ProductModal({ product, isOpen, onClose, onAddToCart, onRemoveFromCart, onViewCart, allItems = [], cart = [], onViewBrand, onOpenDetails }) {
  const [currentProduct, setCurrentProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [productReviews, setProductReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";
  const BOTTOM_NAV_HEIGHT = '56px';

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      if (window.history.state?.name !== 'productModal') {
        window.history.pushState({ name: 'productModal' }, '');
      }
      const handlePopState = () => {
        onCloseRef.current();
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isOpen]);

  useEffect(() => {
    if (product) {
      setCurrentProduct(product);
      setSelectedVariant(product);
      const el = document.getElementById('product-page-scroll');
      if (el) el.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [product]);

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

  const handleRelatedProductClick = (clickedProduct) => {
    setCurrentProduct(clickedProduct);
    setSelectedVariant(clickedProduct);
    const el = document.getElementById('product-page-scroll');
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
    if (onOpenDetails) onOpenDetails(clickedProduct);
  };

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
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: BOTTOM_NAV_HEIGHT, backgroundColor: '#fff', zIndex: 9999999, display: 'flex', flexDirection: 'column', animation: 'slideUpPage 0.25s cubic-bezier(0.32,0.72,0,1)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        @keyframes slideUpPage { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .pm-hide-scroll::-webkit-scrollbar { display: none; }
        .pm-hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* 🌟 PREMIUM HEADER */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: '12px 16px', backgroundColor: '#fff', zIndex: 10 }}>
        <button onClick={() => window.history.back()} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', paddingRight: '15px', color: '#0f172a' }}>←</button>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>Product Details</h2>
      </div>

      <div id="product-page-scroll" className="pm-hide-scroll" style={{ flex: 1, overflowY: 'auto', paddingBottom: '140px' }}>
        
        {/* 🌟 PREMIUM IMAGE STAGE */}
        <div style={{ width: '100%', height: '320px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px', marginBottom: '20px', position: 'relative' }}>
          {isDiscounted && (
            <div style={{ position: 'absolute', top: '15px', left: '15px', backgroundColor: '#ef4444', color: '#fff', padding: '6px 12px', borderRadius: '12px', fontWeight: '800', fontSize: '0.8rem', letterSpacing: '0.5px' }}>
              {discountPercent}% OFF
            </div>
          )}
          {selectedVariant.image ? <img src={selectedVariant.image} alt={selectedVariant.name} style={{ maxHeight: '85%', maxWidth: '85%', objectFit: 'contain', mixBlendMode: 'multiply' }} /> : <span style={{ fontSize: '80px' }}>{selectedVariant.emoji}</span>}
        </div>

        <div style={{ padding: '0 20px' }}>
          {/* TITLE & QTY */}
          <h1 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', lineHeight: '1.3' }}>{selectedVariant.name}</h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0, fontWeight: '600' }}>{selectedVariant.qnty}</p>
             {productReviews.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f0fdf4', padding: '4px 8px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '800', color: '#16a34a' }}>
                   ★ {(productReviews.reduce((a, b) => a + b.rating, 0) / productReviews.length).toFixed(1)}
                </div>
             )}
          </div>

          {/* 🌟 THE NEW FLOATING ACTION CARD */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: '0 8px 24px rgba(0,0,0,0.04)', marginTop: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {isDiscounted && (
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '600' }}>MRP ₹{mrp}</span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>₹{displayPrice}</span>
              </div>
              {isDiscounted && (
                <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '700', marginTop: '2px' }}>
                  You save ₹{savings}
                </div>
              )}
            </div>
            
            {cartCount > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#ef4444', borderRadius: '12px', height: '44px', width: '110px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)' }}>
                <button onClick={() => onRemoveFromCart(selectedVariant)} style={{ flex: 1, color: '#fff', border: 'none', background: 'none', fontSize: '1.4rem', fontWeight: 'bold' }}>-</button>
                <span style={{ color: '#fff', fontWeight: '800', fontSize: '1rem' }}>{cartCount}</span>
                <button onClick={() => onAddToCart(selectedVariant)} style={{ flex: 1, color: '#fff', border: 'none', background: 'none', fontSize: '1.4rem', fontWeight: 'bold' }}>+</button>
              </div>
            ) : (
              // MATCHING THE HOME PAGE "ADD" BUTTON STYLE
              <button onClick={() => onAddToCart(selectedVariant)} style={{ height: '44px', padding: '0 28px', backgroundColor: '#fff', color: '#ef4444', border: '2px solid #fca5a5', borderRadius: '12px', fontWeight: '800', fontSize: '0.95rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ADD
              </button>
            )}
          </div>

          {/* 🌟 PREMIUM VARIANTS SELECTOR */}
          {currentProduct.variants?.length > 1 && (
            <div style={{ margin: '25px 0' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>Select Unit</p>
              <div className="pm-hide-scroll" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '5px' }}>
                {currentProduct.variants.map((v, i) => {
                  const isActive = selectedVariant._id === v._id;
                  return (
                    <div key={i} onClick={() => handleVariantChange(v)} style={{ minWidth: '90px', padding: '12px', border: isActive ? '2px solid #ef4444' : '1px solid #e2e8f0', borderRadius: '16px', backgroundColor: isActive ? '#fef2f2' : '#fff', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: isActive ? '0 4px 10px rgba(239,68,68,0.1)' : 'none' }}>
                      <div style={{ fontWeight: '700', fontSize: '0.85rem', color: isActive ? '#ef4444' : '#475569' }}>{v.qnty}</div>
                      <div style={{ fontWeight: '800', fontSize: '0.95rem', color: isActive ? '#7f1d1d' : '#0f172a', marginTop: '4px' }}>₹{v.sellingPrice || v.mrp}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 🏷️ BRAND VIEW CARD (Softened) */}
          {selectedVariant.brand && selectedVariant.brand !== "nan" && (
            <div 
              onClick={() => {
                if(onViewBrand) {
                  window.history.back(); 
                  setTimeout(() => onViewBrand(selectedVariant.brand), 100); 
                }
              }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: '#f8fafc', border: 'none', borderRadius: '20px', margin: '25px 0', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '48px', height: '48px', backgroundColor: '#fff', borderRadius: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '900', color: '#ef4444', fontSize: '1.4rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  {selectedVariant.brand.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '1.05rem', color: '#0f172a' }}>{selectedVariant.brand}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>Explore all products</div>
                </div>
              </div>
              <div style={{ color: '#94a3b8', fontSize: '1.6rem', fontWeight: 'bold' }}>›</div>
            </div>
          )}
        </div>

        <Accordion title="Product Information" defaultOpen={true}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <HighlightRow label="Brand" value={selectedVariant.brand} />
            <HighlightRow label="Unit" value={selectedVariant.qnty} />
            <HighlightRow label="Description" value={selectedVariant.description} />
            <HighlightRow label="Ingredients" value={selectedVariant.ingredients} />
            <HighlightRow label="Dietary" value={selectedVariant.isVeg ? 'Veg' : 'Non-Veg'} />
            <HighlightRow label="Manufacturer" value={selectedVariant.manufacturer} />
            <HighlightRow label="Address" value={selectedVariant.manufactureraddress} />
            
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
                <div style={{ padding: '20px 0 0 0' }}>
                  <div style={{ color: '#0f172a', fontSize: '0.9rem', fontWeight: '800', marginBottom: '15px' }}>
                    Nutritional Values
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {nutrients.map((n, idx) => (
                      <div key={idx} style={{ flex: '1 1 calc(33.333% - 10px)', minWidth: '85px', backgroundColor: '#f8fafc', borderRadius: '12px', padding: '12px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>
                          {n.label}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '800', marginTop: '6px' }}>
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

        {/* Gray Divider to break up the page flow */}
        <div style={{ height: '8px', backgroundColor: '#f8fafc', margin: '20px 0' }} />

        <div style={{ padding: '0 20px' }}>
          <CrossSellSlider 
            allItems={allItems} 
            currentProduct={selectedVariant} 
            onAddToCart={onAddToCart} 
            onRemoveFromCart={onRemoveFromCart}
            cart={safeCart}
            onProductClick={handleRelatedProductClick} 
          />
        </div>
        
        <div style={{ marginTop: '30px', padding: '0 20px' }}>
           <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '15px' }}>Ratings & Reviews</h3>
           {loadingReviews ? (
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Loading reviews...</div>
           ) : productReviews.length > 0 ? (
              <ReviewSection reviews={productReviews} readOnly={true} />
           ) : (
              <div style={{ padding: '25px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '16px' }}>
                 <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>No reviews yet for this product.</p>
              </div>
           )}
        </div>
      </div>

      {/* 🌟 FLOATING VIEW CART BAR (Kept Green because Green = Go/Checkout) */}
      {cartTotalItems > 0 && (
        <div onClick={() => { window.history.back(); setTimeout(onViewCart, 100); }} style={{ position: 'absolute', bottom: '15px', left: '16px', right: '16px', backgroundColor: '#16a34a', color: '#fff', padding: '14px 20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '800', fontSize: '0.95rem', boxShadow: '0 8px 24px rgba(22, 163, 74, 0.3)', zIndex: 1000, cursor: 'pointer' }}>
          <span>{cartTotalItems} items | ₹{cartTotalPrice}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>View Cart <span style={{ fontSize: '1.2rem' }}>›</span></span>
        </div>
      )}
    </div>
  );
          }
                             

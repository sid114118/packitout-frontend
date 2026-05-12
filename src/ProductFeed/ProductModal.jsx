import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReviewSection from './ReviewSection.jsx';
import CrossSellSlider from './CrossSell.jsx';
import { ModernProductCard } from './FeedComponents.jsx';
import { cdnImage } from '../utils/cloudinaryUrl.js';

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
  const [showStickyAdd, setShowStickyAdd] = useState(false);
  const [exploreCount, setExploreCount] = useState(12);

  const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");
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

  // The shop feed ships a slim product payload — pull the full doc on open so
  // description / ingredients / nutrition rows have data to render.
  useEffect(() => {
    if (!isOpen || !selectedVariant?._id) return;
    if (selectedVariant.description !== undefined) return;
    let cancelled = false;
    fetch(`${BASE_URL}/master-products/${selectedVariant._id}`)
      .then(res => res.ok ? res.json() : null)
      .then(full => {
        if (cancelled || !full) return;
        setSelectedVariant(prev => prev && prev._id === full._id ? { ...prev, ...full } : prev);
      })
      .catch(err => console.warn('Product detail fetch failed', err));
    return () => { cancelled = true; };
  }, [isOpen, selectedVariant?._id]);

  const handleRelatedProductClick = (clickedProduct) => {
    setCurrentProduct(clickedProduct);
    setSelectedVariant(clickedProduct);
    const el = document.getElementById('product-page-scroll');
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
    if (onOpenDetails) onOpenDetails(clickedProduct);
  };

  // 🚀 SAME-BRAND CAROUSEL — pulls up to 12 products from the same brand,
  // excluding the current item. Drops the row entirely if there's nothing.
  // ⚠️ Hooks must run on every render — declare before any early return.
  const moreFromBrand = useMemo(() => {
    const brand = selectedVariant?.brand;
    if (!brand || brand === "nan" || !Array.isArray(allItems)) return [];
    return allItems
      .filter(i => i && i.brand === brand && i._id !== selectedVariant._id && i.inStock !== false)
      .slice(0, 12);
  }, [allItems, selectedVariant?.brand, selectedVariant?._id]);

  // 🌐 EXPLORE MORE — same category first, then everything else.
  const exploreItems = useMemo(() => {
    if (!Array.isArray(allItems) || !selectedVariant) return [];
    const cat = selectedVariant.category;
    const sameCat = allItems.filter(i => i && i._id !== selectedVariant._id && i.inStock !== false && i.category === cat);
    const others  = allItems.filter(i => i && i._id !== selectedVariant._id && i.inStock !== false && i.category !== cat);
    return [...sameCat, ...others];
  }, [allItems, selectedVariant?._id, selectedVariant?.category]);

  // Reset explore count + sticky bar visibility whenever the product changes.
  useEffect(() => { setExploreCount(12); setShowStickyAdd(false); }, [selectedVariant?._id]);

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

  const handleExploreScroll = (e) => {
    const el = e.target;
    setShowStickyAdd(el.scrollTop > 360);
    if (el.scrollHeight - el.scrollTop <= el.clientHeight * 1.6) {
      setExploreCount(prev => Math.min(prev + 12, exploreItems.length));
    }
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

      <div id="product-page-scroll" className="pm-hide-scroll" onScroll={handleExploreScroll} style={{ flex: 1, overflowY: 'auto', paddingBottom: '140px' }}>
        
        {/* 🌟 PREMIUM IMAGE STAGE (FIXED HEIGHT) */}
        <div style={{ width: '100%', height: '240px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', marginBottom: '20px', position: 'relative' }}>
          {isDiscounted && (
            <div style={{ position: 'absolute', top: '15px', left: '15px', backgroundColor: '#ef4444', color: '#fff', padding: '6px 12px', borderRadius: '12px', fontWeight: '800', fontSize: '0.8rem', letterSpacing: '0.5px' }}>
              {discountPercent}% OFF
            </div>
          )}
          {selectedVariant.image ? <img src={cdnImage(selectedVariant.image, 600)} alt={selectedVariant.name} decoding="async" style={{ maxHeight: '85%', maxWidth: '85%', objectFit: 'contain', mixBlendMode: 'multiply' }} /> : <span style={{ fontSize: '80px' }}>{selectedVariant.emoji}</span>}
        </div>

        <div style={{ padding: '0 20px' }}>
          {/* TITLE & QTY */}
          <h1 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', lineHeight: '1.3' }}>{selectedVariant.name}</h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
             <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0, fontWeight: '600' }}>{selectedVariant.qnty}</p>
             {productReviews.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f0fdf4', padding: '3px 8px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '800', color: '#16a34a' }}>
                   ★ {(productReviews.reduce((a, b) => a + b.rating, 0) / productReviews.length).toFixed(1)}
                </div>
             )}
          </div>

          {/* 🌟 BALANCED ACTION CARD */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 6px 18px rgba(0,0,0,0.04)', marginTop: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>₹{displayPrice}</span>
                {isDiscounted && (
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '600' }}>₹{mrp}</span>
                )}
                {isDiscounted && (
                  <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: '800', backgroundColor: '#f0fdf4', padding: '2px 6px', borderRadius: '6px' }}>
                    {discountPercent}% off
                  </span>
                )}
              </div>
              {isDiscounted && (
                <div style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: '700' }}>
                  You save ₹{savings}
                </div>
              )}
            </div>

            {cartCount > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#ef4444', borderRadius: '10px', height: '36px', width: '96px', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.22)', flexShrink: 0 }}>
                <button onClick={() => onRemoveFromCart(selectedVariant)} style={{ flex: 1, color: '#fff', border: 'none', background: 'none', fontSize: '1.15rem', fontWeight: 'bold', cursor: 'pointer' }}>−</button>
                <span style={{ color: '#fff', fontWeight: '800', fontSize: '0.9rem' }}>{cartCount}</span>
                <button onClick={() => onAddToCart(selectedVariant)} style={{ flex: 1, color: '#fff', border: 'none', background: 'none', fontSize: '1.15rem', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
              </div>
            ) : (
              <button onClick={() => onAddToCart(selectedVariant)} style={{ height: '36px', padding: '0 22px', backgroundColor: '#fff', color: '#ef4444', border: '1.5px solid #fca5a5', borderRadius: '10px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>
                ADD
              </button>
            )}
          </div>

          {/* 🛡️ TRUST STRIP */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', overflowX: 'auto' }} className="pm-hide-scroll">
            {[
              { icon: '🔒', label: 'Secure payment' },
              { icon: '↩️', label: 'Easy returns' },
              { icon: '✅', label: 'Genuine product' },
            ].map((t, i) => (
              <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '999px', fontSize: '0.7rem', fontWeight: '700', color: '#475569', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <span>{t.icon}</span>{t.label}
              </div>
            ))}
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
        
        {/* 🏷️ MORE FROM SAME BRAND */}
        {moreFromBrand.length > 0 && (
          <>
            <div style={{ height: '8px', backgroundColor: '#f8fafc', margin: '20px 0' }} />
            <div style={{ padding: '0 20px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0' }}>
                More from {selectedVariant.brand}
              </h3>
              <div className="pm-hide-scroll" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '6px', scrollSnapType: 'x mandatory' }}>
                {moreFromBrand.map(item => (
                  <ModernProductCard
                    key={item._id}
                    item={item}
                    isCarousel={true}
                    shopClosed={false}
                    onOpenDetails={handleRelatedProductClick}
                    onQuickAdd={(it) => onAddToCart({ ...it, mrp: it.sellingPrice || it.mrp })}
                    cart={safeCart}
                    onRemoveFromCart={onRemoveFromCart}
                  />
                ))}
              </div>
            </div>
          </>
        )}

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

        {/* 🌐 EXPLORE MORE — full grid, lazy-loaded */}
        {exploreItems.length > 0 && (
          <>
            <div style={{ height: '8px', backgroundColor: '#f8fafc', marginTop: '30px' }} />
            <div style={{ padding: '20px 20px 0' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Explore more</h3>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700' }}>{Math.min(exploreCount, exploreItems.length)} of {exploreItems.length}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {exploreItems.slice(0, exploreCount).map(item => (
                  <ModernProductCard
                    key={item._id}
                    item={item}
                    isCarousel={false}
                    shopClosed={false}
                    onOpenDetails={handleRelatedProductClick}
                    onQuickAdd={(it) => onAddToCart({ ...it, mrp: it.sellingPrice || it.mrp })}
                    cart={safeCart}
                    onRemoveFromCart={onRemoveFromCart}
                  />
                ))}
              </div>
              {exploreCount >= exploreItems.length && (
                <div style={{ textAlign: 'center', padding: '24px 0 12px', color: '#94a3b8', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.5px' }}>
                  You're all caught up ✨
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ⚓ STICKY ADD BAR — appears once user scrolls past the action card.
            Hidden if item is already in cart (view-cart bar takes over). */}
      {showStickyAdd && cartCount === 0 && (
        <div style={{ position: 'absolute', bottom: cartTotalItems > 0 ? '75px' : '15px', left: '16px', right: '16px', backgroundColor: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 -4px 18px rgba(15,23,42,0.08)', borderRadius: '16px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', zIndex: 999, animation: 'fadeIn 0.2s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            {selectedVariant.image ? (
              <img src={cdnImage(selectedVariant.image, 120)} alt="" style={{ width: '36px', height: '36px', objectFit: 'contain', backgroundColor: '#f8fafc', borderRadius: '8px', flexShrink: 0 }} />
            ) : (
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{selectedVariant.emoji || '🛒'}</div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedVariant.name}</div>
              <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '700' }}>
                ₹{displayPrice}
                {isDiscounted && <span style={{ marginLeft: '6px', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '600' }}>₹{mrp}</span>}
              </div>
            </div>
          </div>
          <button onClick={() => onAddToCart(selectedVariant)} style={{ height: '36px', padding: '0 18px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 4px 10px rgba(239,68,68,0.28)', flexShrink: 0 }}>
            ADD
          </button>
        </div>
      )}

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

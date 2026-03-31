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

  const safeCart = Array.isArray(cart) ? cart : [];
  const cartItem = safeCart.find(item => item._id === selectedVariant._id);
  const cartCount = cartItem ? cartItem.qty : 0;
  const cartTotalItems = safeCart.reduce((total, item) => total + (item.qty || 1), 0);
  const cartTotalPrice = safeCart.reduce((total, item) => total + ((item.sellingPrice || item.mrp) * (item.qty || 1)), 0);

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
        {open && <div style={{ paddingBottom: '16px', animation: 'fadeIn 0.15s ease', textAlign: 'left' }}>{children}</div>}
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

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: '#fff', zIndex: 10000, display: 'flex', flexDirection: 'column', animation: 'slideUpPage 0.25s cubic-bezier(0.32,0.72,0,1)' }}>
      <style>{`
        @keyframes slideUpPage { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .pm-hide-scroll::-webkit-scrollbar { display: none; }
        .pm-hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .pm-line-clamp { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', zIndex: 10 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: '0 16px 0 0', color: '#111827', display: 'flex', alignItems: 'center' }}>←</button>
        <h2 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: '#111827' }}>{selectedVariant.brand || 'Product Details'}</h2>
      </div>

      <div id="product-page-scroll" className="pm-hide-scroll" style={{ flex: 1, overflowY: 'auto', paddingBottom: cartTotalItems > 0 ? '160px' : '90px', backgroundColor: '#fff' }}>
        <div style={{ width: '100%', height: '320px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
          {selectedVariant.image ? <img src={selectedVariant.image} alt={selectedVariant.name} style={{ maxHeight: '90%', maxWidth: '90%', objectFit: 'contain' }} /> : <span style={{ fontSize: '90px' }}>{selectedVariant.emoji}</span>}
        </div>

        <div style={{ padding: '20px', textAlign: 'left' }}>
          <h1 style={{ margin: '0', fontSize: '1.35rem', fontWeight: '800' }}>{selectedVariant.name}</h1>
          <DietaryIcon type={selectedVariant.dietaryPreference} />
          
          {currentProduct.variants && currentProduct.variants.length > 1 && (
            <div style={{ marginTop: '20px' }}>
              <div className="pm-hide-scroll" style={{ display: 'flex', gap: '12px', overflowX: 'auto' }}>
                {currentProduct.variants.map((v, i) => (
                  <div key={i} onClick={() => setSelectedVariant(v)} style={{ minWidth: '100px', padding: '12px', border: selectedVariant._id === v._id ? '2px solid #0c831f' : '1.5px solid #e5e7eb', borderRadius: '12px' }}>
                    <div style={{ fontWeight: '700' }}>{v.qnty}</div>
                    <div>₹{v.sellingPrice || v.mrp}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Accordion title="Product Details">
            <p>{selectedVariant.description}</p>
          </Accordion>

          <CrossSellSlider title="Frequently Bought Together" items={relatedItems} onProductClick={handleRelatedProductClick} onAddToCart={onAddToCart} />
        </div>
      </div>

      {cartTotalItems > 0 && (
        <div onClick={() => { onClose(); if (onViewCart) onViewCart(); }} style={{ position: 'fixed', bottom: '85px', left: '12px', right: '12px', zIndex: 101, backgroundColor: '#0c831f', color: '#fff', padding: '10px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
          <span>{cartTotalItems} items | ₹{cartTotalPrice}</span>
          <span>View Cart ▶</span>
        </div>
      )}

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 102, borderTop: '1px solid #f1f5f9' }}>
        <div>
          <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>₹{displayPrice}</span>
        </div>
        {cartCount > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0c831f', borderRadius: '8px', color: '#fff', padding: '5px 15px' }}>
            <button onClick={() => onRemoveFromCart(selectedVariant)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem' }}>−</button>
            <span style={{ margin: '0 15px' }}>{cartCount}</span>
            <button onClick={() => onAddToCart(selectedVariant)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem' }}>+</button>
          </div>
        ) : (
          <button onClick={() => onAddToCart(selectedVariant)} style={{ backgroundColor: '#0c831f', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: '800' }}>Add to cart</button>
        )}
      </div>
    </div>
  );
                                 }

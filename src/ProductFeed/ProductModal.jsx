import React, { useState, useEffect } from 'react';
import CrossSellSlider from './CrossSell.jsx'; 

export default function ProductModal({ product, isOpen, onClose, onAddToCart, onViewCart, allItems = [], cart = [] }) {
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
  const discountPercent = isDiscounted ? Math.round(((selectedVariant.mrp - displayPrice) / selectedVariant.mrp) * 100) : 0;
  
  // 🟢 SMART CART TRACKERS
  const cartCount = cart.filter(item => item._id === selectedVariant._id).length;
  const cartTotalItems = cart.length;
  const cartTotalPrice = cart.reduce((total, item) => total + (item.sellingPrice || item.mrp), 0);

  const DietaryIcon = ({ type }) => {
    const isVeg = type === "Veg" || !type;
    return (
      <div style={{ width: '16px', height: '16px', border: `1px solid ${isVeg ? '#166534' : '#7f1d1d'}`, display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '3px', backgroundColor: '#fff' }}>
        <div style={{ width: '8px', height: '8px', backgroundColor: isVeg ? '#166534' : '#7f1d1d', borderRadius: '50%' }}></div>
      </div>
    );
  };

  const Accordion = ({ title, icon, children }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
      <div style={{ borderBottom: '1px solid #e2e8f0', padding: '12px 0' }}>
        <div onClick={() => setIsExpanded(!isExpanded)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#0f172a', fontWeight: 'bold' }}>
            <span style={{ fontSize: '1.1rem' }}>{icon}</span> {title}
          </div>
          <span style={{ fontSize: '1.2rem', color: '#64748b', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }}>⌄</span>
        </div>
        {isExpanded && <div style={{ paddingTop: '10px', animation: 'fadeIn 0.2s ease-in' }}>{children}</div>}
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
    const scrollContainer = document.getElementById('modal-scroll-container');
    if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 9999, backdropFilter: 'blur(3px)' }} />

      <div onClick={(e) => e.stopPropagation()} style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 10000, height: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -4px 30px rgba(0,0,0,0.2)', animation: 'slideUpModal 0.3s cubic-bezier(0, 0, 0.2, 1)' }}>
        <style>{`
          @keyframes slideUpModal { from { transform: translateY(100%); } to { transform: translateY(0); } }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          .line-clamp { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        `}</style>

        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '12px 0' }}><div style={{ width: '40px', height: '5px', backgroundColor: '#e2e8f0', borderRadius: '10px' }}></div></div>
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', zIndex: 20 }}>✕</button>

        <div id="modal-scroll-container" style={{ flex: 1, overflowY: 'auto', paddingBottom: cartTotalItems > 0 ? '100px' : '30px' }}>
          
          {/* IMAGE SECTION */}
          <div style={{ width: '100%', height: '280px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', backgroundColor: '#fff' }}>
             <div style={{ position: 'absolute', top: '10px', left: '20px', zIndex: 5 }}>
                <DietaryIcon type={selectedVariant.dietaryPreference} />
             </div>
             {selectedVariant.image ? <img src={selectedVariant.image} alt="" style={{ maxHeight: '90%', maxWidth: '90%', objectFit: 'contain' }} /> : <span style={{fontSize: '80px'}}>{selectedVariant.emoji}</span>}
          </div>

          <div style={{ padding: '20px' }}>
            {selectedVariant.brand && <div style={{ color: '#0f9d58', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>{selectedVariant.brand} ›</div>}
            <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827', margin: '0 0 12px 0', lineHeight: '1.3' }}>{selectedVariant.name}</h1>

            {/* 🌟 BLINKIT-STYLE PRICE & ADD ROW 🌟 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid #f1f5f9' }}>
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>{selectedVariant.qnty}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#000' }}>₹{displayPrice}</span>
                    {isDiscounted && <span style={{ fontSize: '0.9rem', color: '#94a3b8', textDecoration: 'line-through' }}>₹{selectedVariant.mrp}</span>}
                    {isDiscounted && <span style={{ backgroundColor: '#2563eb', color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' }}>{discountPercent}% OFF</span>}
                  </div>
               </div>

               <button 
                  onClick={() => onAddToCart({ ...selectedVariant, mrp: displayPrice })}
                  style={{ 
                    backgroundColor: '#0f9d58', 
                    color: '#fff', 
                    border: 'none', 
                    padding: '10px 24px', 
                    borderRadius: '8px', 
                    fontWeight: '900', 
                    fontSize: '0.9rem',
                    boxShadow: '0 4px 12px rgba(15, 157, 88, 0.3)',
                    cursor: 'pointer',
                    minWidth: '100px'
                  }}
                >
                  {cartCount > 0 ? `${cartCount} in Cart +` : "Add to cart"}
                </button>
            </div>

            {/* UNIT SELECTOR */}
            {currentProduct.variants && currentProduct.variants.length > 1 && (
              <div style={{ marginBottom: '25px' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px' }}>Select Unit</p>
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }} className="hide-scroll">
                  {currentProduct.variants.map((v, i) => {
                    const isSelected = selectedVariant._id === v._id;
                    const vDiscount = v.sellingPrice < v.mrp ? Math.round(((v.mrp - v.sellingPrice) / v.mrp) * 100) : 0;
                    return (
                      <div key={i} onClick={() => setSelectedVariant(v)} style={{ minWidth: '100px', padding: '10px', border: isSelected ? '2px solid #0f9d58' : '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: isSelected ? '#f0fdf4' : '#fff', textAlign: 'center', position: 'relative' }}>
                        {vDiscount > 0 && <span style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#2563eb', color: '#fff', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>{vDiscount}% OFF</span>}
                        <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginTop: '4px' }}>{v.qnty}</div>
                        <div style={{ fontSize: '0.8rem', color: '#4b5563' }}>₹{v.sellingPrice || v.mrp}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Accordion title="Product Details" icon="📄">
              <p style={{ fontSize: '0.9rem', color: '#4b5563', lineHeight: '1.6', margin: 0 }}>{selectedVariant.description}</p>
            </Accordion>

            <Accordion title="Manufacturer Details" icon="🏢">
              <div style={{ fontSize: '0.85rem', color: '#4b5563', padding: '5px 0' }}>{selectedVariant.manufacturer || "Details provided on the pack."}</div>
            </Accordion>

            <CrossSellSlider title="Frequently Bought Together" items={relatedItems} onProductClick={handleRelatedProductClick} onAddToCart={onAddToCart} />
          </div>
        </div>

        {/* 🟢 FLOATING VIEW CART STRIP */}
        {cartTotalItems > 0 && (
          <div style={{ position: 'absolute', bottom: '20px', left: '15px', right: '15px', zIndex: 100 }}>
            <div 
              onClick={() => { onClose(); if (onViewCart) onViewCart(); }} 
              style={{ backgroundColor: '#0c8346', color: '#fff', padding: '14px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 10px 25px rgba(12, 131, 70, 0.4)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '8px' }}>🛒</div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{cartTotalItems} item{cartTotalItems > 1 ? 's' : ''}</div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>₹{cartTotalPrice}</div>
                </div>
              </div>
              <div style={{ fontWeight: '900', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View Cart <span style={{ fontSize: '1.2rem' }}>▶</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
                }

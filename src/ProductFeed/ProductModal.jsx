import React, { useState, useEffect } from 'react';
import CrossSellSlider from './CrossSell.jsx'; 
import { DietaryIcon, Accordion, FloatingCartStrip, PriceActionRow } from './ProductModalElements.jsx';

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
  
  const cartCount = cart.filter(item => item._id === selectedVariant._id).length;
  const cartTotalItems = cart.length;
  const cartTotalPrice = cart.reduce((total, item) => total + (item.sellingPrice || item.mrp), 0);
  
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

      <div onClick={(e) => e.stopPropagation()} style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 10000, height: '85vh', display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
        <style>{`
          @keyframes slideUpModal { from { transform: translateY(100%); } to { transform: translateY(0); } }
          .line-clamp { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
          .hide-scroll::-webkit-scrollbar { display: none; }
          .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '12px 0' }}><div style={{ width: '36px', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '10px' }}></div></div>
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', zIndex: 10 }}>✕</button>

        <div id="modal-scroll-container" style={{ flex: 1, overflowY: 'auto', paddingBottom: cartTotalItems > 0 ? '100px' : '30px', scrollBehavior: 'smooth', textAlign: 'left' }}>
          
          <div style={{ width: '100%', height: '240px', backgroundColor: '#f8fafc', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ position: 'absolute', top: '12px', left: '15px' }}>
              <DietaryIcon type={selectedVariant.dietaryPreference} />
            </div>
            {selectedVariant.image ? <img src={selectedVariant.image} alt="" style={{ maxHeight: '85%', maxWidth: '85%', objectFit: 'contain' }} /> : <span style={{ fontSize: '70px' }}>{selectedVariant.emoji}</span>}
          </div>

          <div style={{ padding: '15px', textAlign: 'left' }}>
            {selectedVariant.brand && <div style={{ color: '#0f9d58', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '4px', textAlign: 'left' }}>{selectedVariant.brand} ›</div>}
            <h1 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#0f172a', fontWeight: 'bold', textAlign: 'left' }}>{selectedVariant.name}</h1>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500', marginBottom: '12px', textAlign: 'left' }}>{selectedVariant.qnty}</div>

            <PriceActionRow 
              price={displayPrice} mrp={selectedVariant.mrp} 
              isDiscounted={isDiscounted} cartCount={cartCount}
              onAdd={() => onAddToCart({ ...selectedVariant, mrp: displayPrice })}
            />

            {currentProduct.variants?.length > 1 && (
              <div style={{ marginBottom: '25px', textAlign: 'left' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '12px', color: '#475569', textAlign: 'left' }}>Select Unit</p>
                <div className="hide-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
                  {currentProduct.variants.map((v, i) => (
                    <button key={i} onClick={() => setSelectedVariant(v)} style={{ padding: '10px 15px', borderRadius: '12px', flexShrink: 0, border: selectedVariant._id === v._id ? '2px solid #0f9d58' : '1px solid #e2e8f0', backgroundColor: selectedVariant._id === v._id ? '#f0fdf4' : '#fff', minWidth: '100px', textAlign: 'left' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'block', marginBottom: '2px', textAlign: 'left' }}>{v.qnty}</span>
                      <span style={{ fontSize: '0.85rem', color: '#0f9d58', fontWeight: 'bold', textAlign: 'left' }}>₹{v.sellingPrice || v.mrp}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Accordion title="Product Details" icon="📄">
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.6', textAlign: 'left' }}>{selectedVariant.description}</p>
            </Accordion>

            <CrossSellSlider title="Frequently Bought Together" items={relatedItems} onProductClick={handleRelatedProductClick} onAddToCart={onAddToCart} />
          </div>
        </div>

        <FloatingCartStrip 
          cartTotalItems={cartTotalItems} 
          cartTotalPrice={cartTotalPrice} 
          onClose={onClose} 
          onViewCart={onViewCart} 
        />
      </div>
    </>
  );
}

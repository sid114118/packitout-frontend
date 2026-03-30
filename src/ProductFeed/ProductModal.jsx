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
  const discountPercent = isDiscounted ? Math.round(((selectedVariant.mrp - displayPrice) / selectedVariant.mrp) * 100) : 0;
  
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

      <div onClick={(e) => e.stopPropagation()} style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', zIndex: 10000, height: '85vh', display: 'flex', flexDirection: 'column', animation: 'slideUpModal 0.25s ease-out' }}>
        <style>{`
          @keyframes slideUpModal { from { transform: translateY(100%); } to { transform: translateY(0); } }
          .line-clamp { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
          .hide-scroll { scrollbar-width: none; -ms-overflow-style: none; }
          .hide-scroll::-webkit-scrollbar { display: none; }
        `}</style>

        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '10px 0' }}><div style={{ width: '36px', height: '4px', backgroundColor: '#cbd5e1', borderRadius: '10px' }}></div></div>
        <button onClick={onClose} style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '1.1rem', cursor: 'pointer', zIndex: 10, boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>✕</button>

        <div id="modal-scroll-container" style={{ flex: 1, overflowY: 'auto', paddingBottom: cartTotalItems > 0 ? '90px' : '20px', scrollBehavior: 'smooth' }}>
          
          {/* IMAGE HEADER */}
          <div style={{ width: '100%', height: '220px', backgroundColor: '#f8fafc', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
              <DietaryIcon type={selectedVariant.dietaryPreference} />
              {isDiscounted && <div style={{ backgroundColor: '#2563eb', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '3px 6px', borderRadius: '4px', marginTop: '6px' }}>{discountPercent}% OFF</div>}
            </div>
            {selectedVariant.image ? <img src={selectedVariant.image} alt="" style={{ maxHeight: '85%', maxWidth: '85%', objectFit: 'contain' }} /> : <span style={{ fontSize: '70px' }}>{selectedVariant.emoji}</span>}
          </div>

          <div style={{ padding: '15px' }}>
            {selectedVariant.brand && <div style={{ color: '#0f9d58', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '4px' }}>{selectedVariant.brand} ›</div>}
            <h1 style={{ margin: '0 0 10px 0', fontSize: '1.15rem', color: '#0f172a', fontWeight: 'bold' }}>{selectedVariant.name}</h1>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500', marginBottom: '8px' }}>{selectedVariant.qnty}</div>

            {/* ACTION ROW (Imported) */}
            <PriceActionRow 
              price={displayPrice} mrp={selectedVariant.mrp} 
              isDiscounted={isDiscounted} cartCount={cartCount}
              onAdd={() => onAddToCart({ ...selectedVariant, mrp: displayPrice })}
            />

            {/* VARIANT SELECTOR */}
            {currentProduct.variants?.length > 1 && (
              <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '10px', color: '#475569' }}>Available Sizes</p>
                <div className="hide-scroll" style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                  {currentProduct.variants.map((v, i) => (
                    <button key={i} onClick={() => setSelectedVariant(v)} style={{ padding: '8px 12px', borderRadius: '10px', flexShrink: 0, border: selectedVariant._id === v._id ? '2px solid #0f9d58' : '1px solid #cbd5e1', backgroundColor: selectedVariant._id === v._id ? '#ecfdf5' : '#fff', minWidth: '85px', textAlign: 'left' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.85rem', display: 'block' }}>{v.qnty}</span>
                      <span style={{ fontSize: '0.8rem', color: '#0f9d58' }}>₹{v.sellingPrice || v.mrp}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Accordion title="Product Details" icon="📄">
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.6' }}>{selectedVariant.description}</p>
            </Accordion>

            {(selectedVariant.energy || selectedVariant.protein) && (
              <Accordion title="Nutritional Value" icon="⚡">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {selectedVariant.energy && <div style={{ backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '8px' }}><span style={{fontSize: '0.8rem'}}>Energy: {selectedVariant.energy}</span></div>}
                  {selectedVariant.protein && <div style={{ backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '8px' }}><span style={{fontSize: '0.8rem'}}>Protein: {selectedVariant.protein}</span></div>}
                </div>
              </Accordion>
            )}

            <CrossSellSlider title="Frequently Bought Together" items={relatedItems} onProductClick={handleRelatedProductClick} onAddToCart={onAddToCart} />
          </div>
        </div>

        {/* FLOATING CART (Imported) */}
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

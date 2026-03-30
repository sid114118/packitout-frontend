import React, { useState, useEffect } from 'react';
import CrossSellSlider from './CrossSell.jsx'; // 👈 NEW: Imported your reusable component!

// 👇 Notice we added `allItems = []` here!
export default function ProductModal({ product, isOpen, onClose, onAddToCart, allItems = [] }) {
  // 🟢 We now track 'currentProduct' so the modal can navigate within itself!
  const [currentProduct, setCurrentProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showFullDesc, setShowFullDesc] = useState(false); 
  const [quantity, setQuantity] = useState(1); 

  useEffect(() => {
    if (product) {
      setCurrentProduct(product);
      setSelectedVariant(product);
      setShowFullDesc(false); 
      setQuantity(1); 
    }
  }, [product]);

  if (!isOpen || !currentProduct || !selectedVariant) return null;

  const displayPrice = selectedVariant.sellingPrice || selectedVariant.mrp;
  const isDiscounted = displayPrice < selectedVariant.mrp;
  const discountPercent = isDiscounted ? Math.round(((selectedVariant.mrp - displayPrice) / selectedVariant.mrp) * 100) : 0;
  
  const DietaryIcon = ({ type }) => {
    if (type === "Non-Veg") {
      return (
        <div style={{ width: '16px', height: '16px', border: '1px solid #7f1d1d', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '3px', backgroundColor: '#fff' }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: '#7f1d1d', borderRadius: '50%' }}></div>
        </div>
      );
    }
    return (
      <div style={{ width: '16px', height: '16px', border: '1px solid #166534', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '3px', backgroundColor: '#fff' }}>
        <div style={{ width: '8px', height: '8px', backgroundColor: '#166534', borderRadius: '50%' }}></div>
      </div>
    );
  };

  const Accordion = ({ title, icon, children }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
      <div style={{ borderBottom: '1px solid #e2e8f0', padding: '12px 0' }}>
        <div 
          onClick={() => setIsExpanded(!isExpanded)} 
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#0f172a', fontWeight: 'bold' }}>
            <span style={{ fontSize: '1.1rem' }}>{icon}</span> {title}
          </div>
          <span style={{ fontSize: '1.2rem', color: '#64748b', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }}>
            ⌄
          </span>
        </div>
        {isExpanded && (
          <div style={{ paddingTop: '10px', animation: 'fadeIn 0.2s ease-in' }}>
            {children}
          </div>
        )}
      </div>
    );
  };

  // Filter the allItems array to find the related products
  const relatedItems = selectedVariant.relatedProducts 
    ? allItems.filter(item => selectedVariant.relatedProducts.includes(item._id) && item.inStock)
    : [];

  // 🟢 NEW: Handles clicking a related product! Updates the modal and scrolls to top.
  const handleRelatedProductClick = (item) => {
    setCurrentProduct(item);
    setSelectedVariant(item);
    setShowFullDesc(false);
    setQuantity(1);
    
    // Smoothly scroll back to the top of the modal!
    const scrollContainer = document.getElementById('modal-scroll-container');
    if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 9999, backdropFilter: 'blur(3px)', transition: 'all 0.3s' }} />

      <div onClick={(e) => e.stopPropagation()} style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', zIndex: 10000, height: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -4px 25px rgba(0,0,0,0.15)', animation: 'slideUpModal 0.25s ease-out' }}>
        <style>
          {`
            @keyframes slideUpModal { from { transform: translateY(100%); } to { transform: translateY(0); } }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
            .line-clamp { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
            .hide-scroll::-webkit-scrollbar { display: none; }
            .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
          `}
        </style>

        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', paddingTop: '10px', paddingBottom: '6px', backgroundColor: '#f8fafc', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}>
          <div style={{ width: '36px', height: '4px', backgroundColor: '#cbd5e1', borderRadius: '10px' }}></div>
        </div>

        <button onClick={onClose} style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', zIndex: 10, boxShadow: '0 2px 6px rgba(0,0,0,0.08)', color: '#475569' }}>✕</button>

        {/* 🟢 NEW: Added id="modal-scroll-container" so we can scroll it programmatically! */}
        <div id="modal-scroll-container" style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px', scrollBehavior: 'smooth' }}>
          
          <div style={{ width: '100%', height: '220px', backgroundColor: '#f8fafc', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <DietaryIcon type={selectedVariant.dietaryPreference || "Veg"} />
              {isDiscounted && <span style={{ backgroundColor: '#2563eb', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '3px 6px', borderRadius: '4px', letterSpacing: '0.5px', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }}>{discountPercent}% OFF</span>}
            </div>
            {selectedVariant.image ? <img src={selectedVariant.image} alt={selectedVariant.name} style={{ maxHeight: '85%', maxWidth: '85%', objectFit: 'contain', mixBlendMode: 'multiply' }} /> : <span style={{ fontSize: '70px' }}>{selectedVariant.emoji}</span>}
          </div>

          <div style={{ padding: '15px', textAlign: 'left' }}>
            
            {selectedVariant.brand && (
              <div onClick={() => { alert(`Later, this will filter the store to show only ${selectedVariant.brand} products!`); onClose(); }} style={{ color: '#0f9d58', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {selectedVariant.brand} <span style={{fontSize: '1rem', lineHeight: '1'}}>›</span>
              </div>
            )}

            <h1 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: '#0f172a', lineHeight: '1.3', fontWeight: 'bold' }}>{selectedVariant.name}</h1>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500', marginBottom: '16px' }}>{selectedVariant.qnty}</div>

            {/* 🟢 Updated `product.variants` to `currentProduct.variants` */}
            {currentProduct.variants && currentProduct.variants.length > 1 && (
              <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 'bold', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available Sizes</p>
                <div className="hide-scroll" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {currentProduct.variants.map((variant, index) => {
                    const isSelected = selectedVariant._id === variant._id;
                    return (
                      <button 
                        key={index} onClick={() => setSelectedVariant(variant)}
                        style={{ padding: '8px 12px', borderRadius: '10px', flexShrink: 0, border: isSelected ? '2px solid #0f9d58' : '1px solid #cbd5e1', backgroundColor: isSelected ? '#ecfdf5' : '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: '85px', transition: 'all 0.2s ease', position: 'relative' }}
                      >
                        {isSelected && <div style={{position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#0f9d58', color: 'white', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '9px', fontWeight: 'bold'}}>✓</div>}
                        <span style={{ fontWeight: 'bold', color: isSelected ? '#065f46' : '#334155', fontSize: '0.85rem' }}>{variant.qnty}</span>
                        <span style={{ fontSize: '0.8rem', color: isSelected ? '#0f9d58' : '#64748b', fontWeight: '600', marginTop: '2px' }}>₹{variant.sellingPrice || variant.mrp}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedVariant.description && (
              <div style={{ marginBottom: '10px', padding: '15px 0', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '0.95rem', color: '#0f172a', margin: '0 0 8px 0', fontWeight: 'bold' }}>Product Details</h3>
                <div style={{ position: 'relative' }}>
                  <p className={showFullDesc ? "" : "line-clamp"} style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.6', margin: 0 }}>{selectedVariant.description}</p>
                  {!showFullDesc && selectedVariant.description.length > 120 && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '24px', background: 'linear-gradient(transparent, #fff)' }} />}
                </div>
                {selectedVariant.description.length > 120 && (
                  <button onClick={() => setShowFullDesc(!showFullDesc)} style={{ background: 'none', border: 'none', color: '#0f9d58', fontWeight: 'bold', fontSize: '0.85rem', padding: '8px 0 0 0', cursor: 'pointer' }}>
                    {showFullDesc ? "Read Less ⌃" : "Read More ⌄"}
                  </button>
                )}
              </div>
            )}

            {(selectedVariant.energy || selectedVariant.protein || selectedVariant.carbs || selectedVariant.fat) && (
              <Accordion title="Nutritional Value" icon="⚡">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {selectedVariant.energy && <div style={{ backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}><span style={{color: '#64748b', fontSize: '0.8rem'}}>Energy</span> <span style={{color: '#0f172a', fontWeight: 'bold', fontSize: '0.8rem'}}>{selectedVariant.energy}</span></div>}
                  {selectedVariant.protein && <div style={{ backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}><span style={{color: '#64748b', fontSize: '0.8rem'}}>Protein</span> <span style={{color: '#0f172a', fontWeight: 'bold', fontSize: '0.8rem'}}>{selectedVariant.protein}</span></div>}
                  {selectedVariant.carbs && <div style={{ backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}><span style={{color: '#64748b', fontSize: '0.8rem'}}>Carbs</span> <span style={{color: '#0f172a', fontWeight: 'bold', fontSize: '0.8rem'}}>{selectedVariant.carbs}</span></div>}
                  {selectedVariant.fat && <div style={{ backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}><span style={{color: '#64748b', fontSize: '0.8rem'}}>Total Fat</span> <span style={{color: '#0f172a', fontWeight: 'bold', fontSize: '0.8rem'}}>{selectedVariant.fat}</span></div>}
                </div>
              </Accordion>
            )}

            {selectedVariant.manufacturer && (
              <Accordion title="Manufacturer Details" icon="🏢">
                <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: '1.5', margin: 0 }}>{selectedVariant.manufacturer}</p>
                </div>
              </Accordion>
            )}

            {/* 👇 YOUR NEW BULLETPROOF CROSS-SELL SLIDER 👇 */}
            <CrossSellSlider 
              title="Frequently Bought Together" 
              items={relatedItems} 
              onProductClick={handleRelatedProductClick} 
              onAddToCart={onAddToCart} 
            />

            <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', lineHeight: '1.4' }}>
                <strong>Important Note:</strong> Every effort is made to maintain accuracy of all information. However, actual product packaging and materials may contain more and/or different information. It is recommended not to solely rely on the information presented.
              </p>
            </div>

          </div>
        </div>

        {/* 🛒 STICKY BOTTOM ACTION BAR */}
        <div style={{ backgroundColor: '#fff', padding: '12px 15px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 -4px 10px rgba(0,0,0,0.03)' }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a' }}>₹{displayPrice * quantity}</div>
            {isDiscounted && <div style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through', marginTop: '0px' }}>MRP ₹{selectedVariant.mrp * quantity}</div>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ padding: '8px 12px', border: 'none', background: 'transparent', fontSize: '1.2rem', color: quantity > 1 ? '#0f172a' : '#cbd5e1', cursor: quantity > 1 ? 'pointer' : 'not-allowed' }}>−</button>
              <div style={{ width: '20px', textAlign: 'center', fontWeight: 'bold', fontSize: '1rem', color: '#0f172a' }}>{quantity}</div>
              <button onClick={() => setQuantity(q => q + 1)} style={{ padding: '8px 12px', border: 'none', background: 'transparent', fontSize: '1.2rem', color: '#0f9d58', cursor: 'pointer' }}>+</button>
            </div>

            <button 
              onClick={() => {
                for(let i = 0; i < quantity; i++) {
                  onAddToCart({ ...selectedVariant, mrp: displayPrice });
                }
                onClose(); 
              }}
              style={{ backgroundColor: '#0f9d58', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(15, 157, 88, 0.25)' }}
            >
              Add
            </button>
          </div>
        </div>

      </div>
    </>
  );
}

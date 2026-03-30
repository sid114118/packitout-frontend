import React, { useState, useEffect } from 'react';

export default function ProductModal({ product, isOpen, onClose, onAddToCart }) {
  // Keeps track of which size the user is currently looking at inside the modal
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Reset the selected variant every time the modal opens with a new product
  useEffect(() => {
    if (product) {
      setSelectedVariant(product);
    }
  }, [product]);

  // If the modal is closed or data isn't ready, render nothing
  if (!isOpen || !product || !selectedVariant) return null;

  // Calculate pricing for the currently selected variant
  const displayPrice = selectedVariant.sellingPrice || selectedVariant.mrp;
  const isDiscounted = displayPrice < selectedVariant.mrp;
  const discountPercent = isDiscounted ? Math.round(((selectedVariant.mrp - displayPrice) / selectedVariant.mrp) * 100) : 0;
  
  // Official Indian Dietary Icon Generator
  const DietaryIcon = ({ type }) => {
    if (type === "Non-Veg") {
      return (
        <div style={{ width: '18px', height: '18px', border: '1px solid #7f1d1d', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '4px', backgroundColor: '#fff' }}>
          <div style={{ width: '10px', height: '10px', backgroundColor: '#7f1d1d', borderRadius: '50%' }}></div>
        </div>
      );
    }
    return (
      <div style={{ width: '18px', height: '18px', border: '1px solid #166534', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '4px', backgroundColor: '#fff' }}>
        <div style={{ width: '10px', height: '10px', backgroundColor: '#166534', borderRadius: '50%' }}></div>
      </div>
    );
  };

  return (
    <>
      {/* 🌑 DARK BLURRED BACKDROP */}
      <div 
        onClick={onClose} 
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 9999, backdropFilter: 'blur(3px)', transition: 'all 0.3s' }} 
      />

      {/* 📱 THE BOTTOM SHEET */}
      <div 
        onClick={(e) => e.stopPropagation()} // Prevents clicking inside the modal from closing it
        style={{ 
          position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', 
          borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 10000, 
          height: '88vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 -4px 25px rgba(0,0,0,0.15)', animation: 'slideUpModal 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <style>{`@keyframes slideUpModal { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

        {/* ➖ NATIVE DRAG HANDLE */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '8px', backgroundColor: '#f8fafc', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
          <div style={{ width: '40px', height: '5px', backgroundColor: '#cbd5e1', borderRadius: '10px' }}></div>
        </div>

        {/* ✕ CLOSE BUTTON */}
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', fontSize: '1.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', color: '#475569' }}
        >
          ✕
        </button>

        {/* 📜 SCROLLABLE CONTENT AREA */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
          
          {/* 📸 IMAGE SHOWCASE AREA */}
          <div style={{ width: '100%', height: '300px', backgroundColor: '#f8fafc', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ position: 'absolute', top: '15px', left: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <DietaryIcon type={selectedVariant.dietaryPreference || "Veg"} />
              {isDiscounted && (
                <span style={{ backgroundColor: '#2563eb', color: '#fff', fontSize: '0.75rem', fontWeight: '900', padding: '4px 8px', borderRadius: '6px', letterSpacing: '0.5px', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.3)' }}>
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {selectedVariant.image ? (
              <img src={selectedVariant.image} alt={selectedVariant.name} style={{ maxHeight: '85%', maxWidth: '85%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
            ) : (
              <span style={{ fontSize: '100px' }}>{selectedVariant.emoji}</span>
            )}
          </div>

          {/* 📝 PRODUCT DETAILS AREA */}
          <div style={{ padding: '20px' }}>
            
            {/* Clickable Brand Name */}
            {selectedVariant.brand && (
              <div 
                style={{ color: '#0f9d58', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                onClick={() => {
                  alert(`Later, this will filter the store to show only ${selectedVariant.brand} products!`);
                  onClose();
                }}
              >
                {selectedVariant.brand} <span>›</span>
              </div>
            )}

            <h1 style={{ margin: '0 0 10px 0', fontSize: '1.4rem', color: '#0f172a', lineHeight: '1.3', fontWeight: '800' }}>
              {selectedVariant.name}
            </h1>
            
            <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500', marginBottom: '20px' }}>
              {selectedVariant.qnty}
            </div>

            {/* 🌟 VARIANT SELECTOR (Only shows if there are multiple sizes) 🌟 */}
            {product.variants && product.variants.length > 1 && (
              <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 'bold', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available Sizes</p>
                <div className="hide-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {product.variants.map((variant, index) => {
                    const isSelected = selectedVariant._id === variant._id;
                    return (
                      <button 
                        key={index}
                        onClick={() => setSelectedVariant(variant)}
                        style={{
                          padding: '10px 16px', borderRadius: '12px', flexShrink: 0,
                          border: isSelected ? '2px solid #0f9d58' : '1px solid #cbd5e1',
                          backgroundColor: isSelected ? '#ecfdf5' : '#fff',
                          cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                          minWidth: '100px', transition: 'all 0.2s ease', position: 'relative'
                        }}
                      >
                        {isSelected && <div style={{position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#0f9d58', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px', fontWeight: 'bold'}}>✓</div>}
                        <span style={{ fontWeight: '800', color: isSelected ? '#065f46' : '#334155', fontSize: '0.95rem' }}>{variant.qnty}</span>
                        <span style={{ fontSize: '0.85rem', color: isSelected ? '#0f9d58' : '#64748b', fontWeight: '600', marginTop: '4px' }}>
                          ₹{variant.sellingPrice || variant.mrp}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Product Description */}
            {selectedVariant.description && (
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#0f172a', margin: '0 0 10px 0', fontWeight: 'bold' }}>Product Details</h3>
                <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                  {selectedVariant.description}
                </p>
              </div>
            )}

            {/* Nutritional Info Grid */}
            {(selectedVariant.energy || selectedVariant.protein || selectedVariant.carbs || selectedVariant.fat) && (
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#0f172a', margin: '0 0 12px 0', fontWeight: 'bold' }}>Nutritional Value <span style={{fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'normal'}}>(Per 100g)</span></h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {selectedVariant.energy && <div style={{ backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}><span style={{color: '#64748b', fontSize: '0.85rem'}}>Energy</span> <span style={{color: '#0f172a', fontWeight: 'bold', fontSize: '0.85rem'}}>{selectedVariant.energy}</span></div>}
                  {selectedVariant.protein && <div style={{ backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}><span style={{color: '#64748b', fontSize: '0.85rem'}}>Protein</span> <span style={{color: '#0f172a', fontWeight: 'bold', fontSize: '0.85rem'}}>{selectedVariant.protein}</span></div>}
                  {selectedVariant.carbs && <div style={{ backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}><span style={{color: '#64748b', fontSize: '0.85rem'}}>Carbs</span> <span style={{color: '#0f172a', fontWeight: 'bold', fontSize: '0.85rem'}}>{selectedVariant.carbs}</span></div>}
                  {selectedVariant.fat && <div style={{ backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}><span style={{color: '#64748b', fontSize: '0.85rem'}}>Total Fat</span> <span style={{color: '#0f172a', fontWeight: 'bold', fontSize: '0.85rem'}}>{selectedVariant.fat}</span></div>}
                </div>
              </div>
            )}

            {/* Manufacturer Info */}
            {selectedVariant.manufacturer && (
              <div style={{ marginBottom: '20px', padding: '15px', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Manufacturer Details</h3>
                <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: '1.5', margin: 0 }}>
                  {selectedVariant.manufacturer}
                </p>
              </div>
            )}

          </div>
        </div>

        {/* 🛒 STICKY BOTTOM ACTION BAR */}
        <div style={{ 
          backgroundColor: '#fff', padding: '15px 20px', borderTop: '1px solid #e2e8f0', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          boxShadow: '0 -4px 10px rgba(0,0,0,0.03)'
        }}>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0f172a' }}>₹{displayPrice}</div>
            {isDiscounted && <div style={{ fontSize: '0.85rem', color: '#94a3b8', textDecoration: 'line-through', marginTop: '2px' }}>MRP ₹{selectedVariant.mrp}</div>}
          </div>

          <button 
            onClick={() => {
              onAddToCart({ ...selectedVariant, mrp: displayPrice });
              onClose(); // Automatically close modal after adding
            }}
            style={{ 
              backgroundColor: '#0f9d58', color: '#fff', border: 'none', padding: '14px 32px', 
              borderRadius: '14px', fontWeight: '800', fontSize: '1.1rem', cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(15, 157, 88, 0.3)', transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Add to Cart
          </button>
        </div>

      </div>
    </>
  );
                           }

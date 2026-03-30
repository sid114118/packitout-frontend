import React, { useState, useEffect } from 'react';

export default function ProductModal({ product, isOpen, onClose, onAddToCart }) {
  // State to handle which size the user is currently looking at
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Whenever the modal opens with a new product, set the default variant to that product
  useEffect(() => {
    if (product) {
      setSelectedVariant(product);
    }
  }, [product]);

  if (!isOpen || !product || !selectedVariant) return null;

  // We use the selectedVariant for everything (Price, Qnty, Image) so it updates when they click a size!
  const displayPrice = selectedVariant.sellingPrice || selectedVariant.mrp;
  const isDiscounted = displayPrice < selectedVariant.mrp;
  const discountPercent = isDiscounted ? Math.round(((selectedVariant.mrp - displayPrice) / selectedVariant.mrp) * 100) : 0;
  
  // Veg/Non-Veg Icon Helper
  const DietaryIcon = ({ type }) => {
    if (type === "Non-Veg") {
      return (
        <div style={{ width: '16px', height: '16px', border: '1px solid #7f1d1d', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '2px' }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: '#7f1d1d', borderRadius: '50%' }}></div>
        </div>
      );
    }
    // Default to Veg
    return (
      <div style={{ width: '16px', height: '16px', border: '1px solid #166534', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '2px' }}>
        <div style={{ width: '8px', height: '8px', backgroundColor: '#166534', borderRadius: '50%' }}></div>
      </div>
    );
  };

  return (
    <>
      {/* 🌑 DARK BACKDROP */}
      <div 
        onClick={onClose} 
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 999, backdropFilter: 'blur(2px)' }} 
      />

      {/* 📱 BOTTOM SHEET MODAL */}
      <div style={{ 
        position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', 
        borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 1000, 
        maxHeight: '85vh', overflowY: 'auto', display: 'flex', flexDirection: 'column',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.1)', animation: 'slideUp 0.3s ease-out'
      }}>
        <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        
        {/* CLOSE BUTTON */}
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '1.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', zIndex: 10 }}
        >
          ✕
        </button>

        {/* 📸 IMAGE SECTION */}
        <div style={{ width: '100%', height: '250px', backgroundColor: '#f8fafc', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
          
          {/* Top Left: Dietary & Discount Badges */}
          <div style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <DietaryIcon type={selectedVariant.dietaryPreference || "Veg"} />
            {isDiscounted && (
              <span style={{ backgroundColor: '#0f9d58', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px' }}>
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {selectedVariant.image ? (
            <img src={selectedVariant.image} alt={selectedVariant.name} style={{ maxHeight: '80%', maxWidth: '80%', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: '80px' }}>{selectedVariant.emoji}</span>
          )}
        </div>

        {/* 📝 DETAILS SECTION */}
        <div style={{ padding: '20px', paddingBottom: '90px' /* padding to avoid the fixed bottom bar */ }}>
          
          {/* Brand Name (Clickable look) */}
          {selectedVariant.brand && (
            <div 
              style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '8px', cursor: 'pointer', display: 'inline-block' }}
              onClick={() => {
                alert(`Later, this will search all ${selectedVariant.brand} products!`);
                onClose();
              }}
            >
              {selectedVariant.brand} ➔
            </div>
          )}

          <h2 style={{ margin: '0 0 15px 0', fontSize: '1.3rem', color: '#0f172a', lineHeight: '1.3' }}>
            {selectedVariant.name}
          </h2>

          {/* 🌟 VARIANTS (SIZE SELECTOR) 🌟 */}
          {product.variants && product.variants.length > 1 && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold', marginBottom: '10px' }}>Select Size:</p>
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                {product.variants.map((variant, index) => {
                  const isSelected = selectedVariant._id === variant._id;
                  return (
                    <button 
                      key={index}
                      onClick={() => setSelectedVariant(variant)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid #0f9d58' : '1px solid #cbd5e1',
                        backgroundColor: isSelected ? '#ecfdf5' : '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        minWidth: '80px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ fontWeight: 'bold', color: isSelected ? '#065f46' : '#334155', fontSize: '0.9rem' }}>{variant.qnty}</span>
                      <span style={{ fontSize: '0.8rem', color: isSelected ? '#0f9d58' : '#64748b' }}>
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
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '8px' }}>Product Details</h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
                {selectedVariant.description}
              </p>
            </div>
          )}

          {/* Nutritional Info Grid */}
          {(selectedVariant.energy || selectedVariant.protein) && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '10px' }}>Nutritional Information (per 100g)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {selectedVariant.energy && <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', color: '#475569' }}><strong>Energy:</strong> {selectedVariant.energy}</div>}
                {selectedVariant.protein && <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', color: '#475569' }}><strong>Protein:</strong> {selectedVariant.protein}</div>}
                {selectedVariant.carbs && <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', color: '#475569' }}><strong>Carbs:</strong> {selectedVariant.carbs}</div>}
                {selectedVariant.sugar && <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', color: '#475569' }}><strong>Sugar:</strong> {selectedVariant.sugar}</div>}
              </div>
            </div>
          )}
        </div>

        {/* 🛒 FIXED BOTTOM ACTION BAR */}
        <div style={{ 
          position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', 
          padding: '15px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', 
          justifyContent: 'space-between', alignItems: 'center', zIndex: 10 
        }}>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0f172a' }}>₹{displayPrice}</div>
            {isDiscounted && <div style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through' }}>MRP ₹{selectedVariant.mrp}</div>}
          </div>

          <button 
            onClick={() => {
              onAddToCart({ ...selectedVariant, mrp: displayPrice });
              onClose();
            }}
            style={{ 
              backgroundColor: '#0f9d58', color: '#fff', border: 'none', padding: '12px 30px', 
              borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(15, 157, 88, 0.3)'
            }}
          >
            Add to Cart
          </button>
        </div>

      </div>
    </>
  );
}

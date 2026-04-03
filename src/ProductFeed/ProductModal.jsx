import React, { useState, useEffect } from 'react';

export default function ProductModal({ 
  product, isOpen, onClose, onAddToCart, onRemoveFromCart, onViewCart, cart = [], allItems = [] 
}) {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  
  // 🌟 NEW: Active Product State allows switching between variants seamlessly!
  const [activeProduct, setActiveProduct] = useState(null);

  useEffect(() => {
    setIsDetailsExpanded(false);
    if (product) {
      setActiveProduct(product);
    }
  }, [product]);

  if (!isOpen || !activeProduct) return null;

  // 🧮 Cart Logic for the CURRENTLY SELECTED Variant
  const cartItem = cart.find(item => item._id === activeProduct._id);
  const cartCount = cartItem ? cartItem.qty : 0;
  
  const safePrice = activeProduct.sellingPrice !== undefined ? activeProduct.sellingPrice : (activeProduct.mrp || 0);
  const originalPrice = (activeProduct.mrp && activeProduct.mrp > 0) ? activeProduct.mrp : safePrice;
  const isDiscounted = originalPrice > safePrice;

  // 🛒 View Cart Bottom Bar Math
  const cartTotalItems = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const cartTotalPrice = cart.reduce((sum, item) => {
    const price = Number(item.sellingPrice || item.mrp || 0);
    return sum + (price * (Number(item.qty) || 0));
  }, 0);

  // 🤝 Cross-Selling Logic
  const relatedItems = allItems.filter(i => 
    i._id !== activeProduct._id && 
    i.category && activeProduct.category && 
    i.category.toLowerCase() === activeProduct.category.toLowerCase() &&
    i.inStock
  ).slice(0, 8);

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      zIndex: 999, 
      backgroundColor: '#f3f4f6', 
      overflowY: 'auto', 
      animation: 'slideInRight 0.3s ease-out',
      paddingBottom: '140px' 
    }}>
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
      
      {/* 🟢 FULL PAGE HEADER WITH BACK BUTTON */}
      <div style={{ position: 'sticky', top: 0, backgroundColor: 'white', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #e5e7eb', zIndex: 100 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#111827', display: 'flex', alignItems: 'center' }}>←</button>
        <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#111827', fontWeight: '800' }}>Product Details</h2>
      </div>

      <div style={{ backgroundColor: '#fff', paddingBottom: '10px', marginBottom: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        
        {/* 🖼️ Product Image Section (Updates based on variant) */}
        <div style={{ backgroundColor: '#f8fafc', padding: '30px 20px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
          {activeProduct.isVeg !== undefined && (
            <div style={{ position: 'absolute', top: '20px', right: '20px', width: '16px', height: '16px', border: `1.5px solid ${activeProduct.isVeg ? '#16a34a' : '#dc2626'}`, display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '4px', backgroundColor: 'white' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: activeProduct.isVeg ? '#16a34a' : '#dc2626', borderRadius: '50%' }} />
            </div>
          )}
          {activeProduct.image ? (
            <img src={activeProduct.image} alt={activeProduct.name} style={{ width: '220px', height: '220px', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: '100px' }}>{activeProduct.emoji}</span>
          )}
        </div>

        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0 0 6px 0', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {activeProduct.brand || "PackItOut"}
          </p>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', color: '#111827', fontWeight: '800', lineHeight: '1.3' }}>
            {activeProduct.name}
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#4b5563', margin: '0 0 15px 0', fontWeight: '500' }}>
            {activeProduct.qnty}
          </p>

          {/* 🌟 NEW: VARIANT SELECTOR ROW 🌟 */}
          {product.variants && product.variants.length > 1 && (
            <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #f1f5f9' }}>
              <h4 style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Select Size</h4>
              <div className="hide-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                {product.variants.map((variant) => {
                  const vPrice = variant.sellingPrice !== undefined ? variant.sellingPrice : (variant.mrp || 0);
                  const isSelected = activeProduct._id === variant._id;
                  
                  return (
                    <div 
                      key={variant._id} 
                      onClick={() => setActiveProduct(variant)}
                      style={{
                        minWidth: 'max-content',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid #0c831f' : '1px solid #e2e8f0',
                        backgroundColor: isSelected ? '#f0fdf4' : '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: isSelected ? '800' : '600', color: isSelected ? '#0c831f' : '#4b5563', marginBottom: '4px' }}>
                        {variant.qnty}
                      </span>
                      <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#111827' }}>
                        ₹{vPrice}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 💵 Price & Cart Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontWeight: '900', fontSize: '1.4rem', color: '#111827' }}>₹{safePrice}</span>
                {isDiscounted && <span style={{ fontSize: '0.9rem', color: '#9ca3af', textDecoration: 'line-through', fontWeight: '500' }}>₹{originalPrice}</span>}
              </div>
              {isDiscounted && <div style={{ fontSize: '0.75rem', color: '#0c831f', fontWeight: '800', marginTop: '4px', backgroundColor: '#f0fdf4', display: 'inline-block', padding: '2px 8px', borderRadius: '4px' }}>Save ₹{originalPrice - safePrice}</div>}
            </div>

            <div style={{ width: '100px' }}>
              {cartCount > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0c831f', borderRadius: '8px', height: '36px', width: '100%', boxShadow: '0 4px 10px rgba(12, 131, 31, 0.2)' }}>
                  <button onClick={() => onRemoveFromCart(activeProduct)} style={{ flex: 1, height: '100%', border: 'none', background: 'transparent', color: '#fff', fontSize: '1.3rem', fontWeight: 'bold', cursor: 'pointer' }}>−</button>
                  <span style={{ color: '#fff', fontSize: '1rem', fontWeight: '800', minWidth: '24px', textAlign: 'center' }}>{cartCount}</span>
                  <button onClick={() => onAddToCart(activeProduct)} style={{ flex: 1, height: '100%', border: 'none', background: 'transparent', color: '#fff', fontSize: '1.3rem', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
                </div>
              ) : (
                <button onClick={() => onAddToCart(activeProduct)} style={{ width: '100%', height: '36px', backgroundColor: '#fff', color: '#0c831f', border: '1px solid #0c831f', borderRadius: '8px', fontSize: '0.95rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                  ADD
                </button>
              )}
            </div>
          </div>

          {/* 📋 UNIFIED PRODUCT DETAILS DROPDOWN */}
          <div style={{ marginTop: '24px', borderTop: '2px solid #f1f5f9', paddingTop: '15px' }}>
            <button 
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', padding: '5px 0', fontSize: '1.05rem', fontWeight: '800', color: '#111827', cursor: 'pointer' }}
            >
              <span>Product Details</span>
              <span style={{ transform: isDetailsExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', fontSize: '1.2rem', color: '#6b7280' }}>▼</span>
            </button>

            {isDetailsExpanded && (
              <div style={{ padding: '15px 0', animation: 'fadeIn 0.3s ease-in-out' }}>
                <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                
                {activeProduct.description && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase' }}>Description</h4>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155', lineHeight: '1.5' }}>{activeProduct.description}</p>
                  </div>
                )}
                
                {activeProduct.ingredients && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase' }}>Ingredients</h4>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155', lineHeight: '1.5' }}>{activeProduct.ingredients}</p>
                  </div>
                )}

                {(activeProduct.energy || activeProduct.protein || activeProduct.carbs || activeProduct.sugar || activeProduct.fat) && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase' }}>Nutritional Info</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      {activeProduct.energy && <div style={{ fontSize: '0.9rem' }}><span style={{ color: '#64748b' }}>Energy:</span> <b style={{ color: '#0f172a' }}>{activeProduct.energy}</b></div>}
                      {activeProduct.protein && <div style={{ fontSize: '0.9rem' }}><span style={{ color: '#64748b' }}>Protein:</span> <b style={{ color: '#0f172a' }}>{activeProduct.protein}</b></div>}
                      {activeProduct.carbs && <div style={{ fontSize: '0.9rem' }}><span style={{ color: '#64748b' }}>Carbs:</span> <b style={{ color: '#0f172a' }}>{activeProduct.carbs}</b></div>}
                      {activeProduct.sugar && <div style={{ fontSize: '0.9rem' }}><span style={{ color: '#64748b' }}>Sugar:</span> <b style={{ color: '#0f172a' }}>{activeProduct.sugar}</b></div>}
                      {activeProduct.fat && <div style={{ fontSize: '0.9rem' }}><span style={{ color: '#64748b' }}>Fat:</span> <b style={{ color: '#0f172a' }}>{activeProduct.fat}</b></div>}
                    </div>
                  </div>
                )}

                {(activeProduct.manufacturer || activeProduct.manufactureraddress) && (
                  <div style={{ marginBottom: '10px' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase' }}>Manufacturer</h4>
                    {activeProduct.manufacturer && (
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#0f172a', fontWeight: '700' }}>{activeProduct.manufacturer}</p>
                    )}
                    {activeProduct.manufactureraddress && (
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: '1.4' }}>{activeProduct.manufactureraddress}</p>
                    )}
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🤝 CROSS SELLING */}
      {relatedItems.length > 0 && (
        <div style={{ padding: '20px 0 20px 20px' }}>
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 15px 0', color: '#111827', fontWeight: '800' }}>Similar Products</h3>
          <div className="hide-scroll" style={{ display: 'flex', overflowX: 'auto', gap: '12px', paddingRight: '20px' }}>
            {relatedItems.map((rItem) => {
              const rPrice = rItem.sellingPrice !== undefined ? rItem.sellingPrice : (rItem.mrp || 0);
              const rCartItem = cart.find(c => c._id === rItem._id);
              const rCount = rCartItem ? rCartItem.qty : 0;

              return (
                <div key={rItem._id} style={{ minWidth: '130px', maxWidth: '130px', backgroundColor: '#fff', borderRadius: '10px', padding: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: '90px', backgroundColor: '#f8fafc', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px' }}>
                    {rItem.image ? <img src={rItem.image} style={{ maxHeight: '70px', maxWidth: '70px', objectFit: 'contain' }} alt="" /> : <span style={{fontSize:'30px'}}>{rItem.emoji}</span>}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 4px 0' }}>{rItem.qnty}</p>
                  <h4 style={{ fontSize: '0.85rem', margin: '0 0 6px 0', color: '#111827', height: '2.4em', overflow: 'hidden' }}>{rItem.name}</h4>
                  <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#111827', marginBottom: '10px' }}>₹{rPrice}</div>
                  
                  <div style={{ marginTop: 'auto' }}>
                    {rCount > 0 ? (
                       <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0c831f', borderRadius: '6px', height: '28px', width: '100%' }}>
                         <button onClick={() => onRemoveFromCart(rItem)} style={{ flex: 1, border: 'none', background: 'transparent', color: '#fff', fontWeight: 'bold' }}>-</button>
                         <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold' }}>{rCount}</span>
                         <button onClick={() => onAddToCart(rItem)} style={{ flex: 1, border: 'none', background: 'transparent', color: '#fff', fontWeight: 'bold' }}>+</button>
                       </div>
                    ) : (
                       <button onClick={() => onAddToCart(rItem)} style={{ width: '100%', padding: '6px 0', backgroundColor: '#fff', color: '#0c831f', border: '1px solid #0c831f', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer' }}>ADD</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 🛒 VIEW CART FLOATING BAR */}
      {cart.length > 0 && (
        <div style={{ position: 'fixed', bottom: '80px', left: '12px', right: '12px', zIndex: 1005 }}>
          <div 
            onClick={() => { onClose(); onViewCart(); }} 
            style={{ backgroundColor: '#0c831f', color: '#fff', padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 8px 24px rgba(12, 131, 31, 0.4)' }}
          >
            <div>
              <div style={{ fontWeight: '600', fontSize: '0.75rem' }}>{cartTotalItems} items</div>
              <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>₹{cartTotalPrice.toFixed(2)}</div>
            </div>
            <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px' }}>
              View Cart <span style={{ fontSize: '1.2rem' }}>▶</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
                }

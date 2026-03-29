import React, { useState } from 'react';

export default function ProductModal({ product, isOpen, onClose, onAddToCart, cart }) {
  const [activeTab, setActiveTab] = useState('Description'); // Description or Info

  // --- Animation Logic & Safety Checks ---
  if (!isOpen || !product) return null;

  const itemInCart = cart.find(item => item._id === product._id);
  const sellingPrice = product.sellingPrice || product.mrp;
  const isOutOfStock = product.inStock === false;

  // Tabs structure based on agreed blueprint
  const tabs = [
    { name: 'Description', icon: '📝' },
    { name: 'Nutritional Info', icon: '📊' },
    { name: 'Manufacturer & Returns', icon: '🏭' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Nutritional Info':
        return (
          <div style={contentStyle}>
            <p style={subHeaderStyle}>Per 100g (Approx.)</p>
            <div style={nutriRowStyle}><span>Energy</span><strong>{product.energy || '350 kcal'}</strong></div>
            <div style={nutriRowStyle}><span>Protein</span><strong>{product.protein || '8.5 g'}</strong></div>
            <div style={nutriRowStyle}><span>Carbohydrates</span><strong>{product.carbs || '55 g'}</strong></div>
            <div style={nutriRowStyle}><span>(Total Sugars)</span><strong>{product.sugar || '22 g'}</strong></div>
            <div style={nutriRowStyle}><span>Fat</span><strong>{product.fat || '11 g'}</strong></div>
          </div>
        );
      case 'Manufacturer & Returns':
        return (
          <div style={contentStyle}>
            <p style={subHeaderStyle}>Manufacturer Details</p>
            <p style={textStyle}>{product.manufacturer || 'Manufactured by the Brand. Address not provided.'}</p>
            <p style={subHeaderStyle}>Disclaimer & Returns</p>
            <p style={textStyle}>Every effort is made to maintain the accuracy of all information. However, actual product packaging and materials may contain more and/or different information. It is recommended not to solely rely on the information presented. Products are non-returnable.</p>
          </div>
        );
      default:
        return (
          <div style={contentStyle}>
            <p style={subHeaderStyle}>Key Features</p>
            <p style={textStyle}>{product.description || `Fresh and high-quality ${product.name} sourced responsibly.`}</p>
            <p style={subHeaderStyle}>Unit Size</p>
            <p style={textStyle}>{product.qnty}</p>
          </div>
        );
    }
  };

  return (
    <>
      {/* 🌑 DARK OVERLAY (Click to Close) */}
      <div onClick={onClose} style={overlayStyle}></div>

      {/* 📱 SLIDING BOTTOM SHEET */}
      <div style={sheetStyle}>
        
        {/* CLOSE BUTTON */}
        <button onClick={onClose} style={closeBtnStyle}>✕</button>

        {/* --- SCROLLABLE CONTENT --- */}
        <div style={scrollableAreaStyle}>
          
          {/* 📸 IMAGE SECTION */}
          <div style={imageContainerStyle}>
            {product.isDiscounted && !isOutOfStock && <div style={discountBadgeStyle}>{product.discountPercent}% OFF</div>}
            {product.image ? (
              <img src={product.image} style={imageStyle} alt={product.name} />
            ) : (
              <span style={{ fontSize: '100px' }}>{product.emoji}</span>
            )}
          </div>

          {/* 🏷️ HEADER SECTION */}
          <div style={{ padding: '20px' }}>
            <div style={brandStyle}>{product.brand}</div>
            <h1 style={nameStyle}>{product.name}</h1>
            <div style={qntyStyle}>{product.qnty}</div>

            {/* Price Row */}
            <div style={priceRowStyle}>
              <span style={finalPriceStyle}>₹{sellingPrice}</span>
              {product.isDiscounted && <span style={mrpStyle}>MRP ₹{product.mrp}</span>}
              {product.isDiscounted && <span style={saveBadgeStyle}>SAVE ₹{(product.mrp - sellingPrice).toFixed(0)}</span>}
            </div>

            {/* Delivery Promise */}
            <div style={deliveryPromiseStyle}>⚡ Delivery in 10-15 mins</div>
          </div>

          <div style={dividerStyle}></div>

          {/* 📜 TABS SECTION */}
          <div style={tabsContainerStyle}>
            {tabs.map(tab => (
              <button 
                key={tab.name} 
                onClick={() => setActiveTab(tab.name)}
                style={{...tabStyle, borderBottom: activeTab === tab.name ? '3px solid #10b981' : '3px solid transparent', color: activeTab === tab.name ? '#10b981' : '#64748b'}}
              >
                <span>{tab.icon}</span> {tab.name}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ padding: '0 20px 20px 20px' }}>
            {renderTabContent()}
          </div>

        </div>

        {/* --- 💰 STICKY FOOTER ACTION BUTTON --- */}
        <div style={footerStyle}>
          {isOutOfStock ? (
            <button disabled style={{...bigButtonStyle, backgroundColor: '#f1f5f9', color: '#94a3b8', border: '1px solid #cbd5e1', cursor: 'not-allowed'}}>Out of Stock</button>
          ) : itemInCart ? (
            // If already in cart, show quantity controls like Blinkit
            <div style={bigButtonStyle}>
              <div style={qtyControlsStyle}>
                <span>Item in Cart</span>
                <span style={{fontWeight: '900', fontSize: '1.2rem'}}>{itemInCart.qty} added</span>
              </div>
            </div>
          ) : (
            <button onClick={() => onAddToCart(product)} style={bigButtonStyle}>
              <span>ADD TO CART</span>
              <span>₹{sellingPrice}</span>
            </button>
          )}
        </div>

      </div>
    </>
  );
}

// --- PREMIUM CSS STYLES (Inline React) ---

const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, animation: 'fadeIn 0.3s' };

const sheetStyle = { position: 'fixed', bottom: 0, left: 0, right: 0, height: '90vh', backgroundColor: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 10000, boxShadow: '0 -10px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'slideUp 0.3s ease-out', maxWidth: '600px', margin: '0 auto' };

const closeBtnStyle = { position: 'absolute', top: '15px', right: '15px', width: '35px', height: '35px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.05)', border: 'none', fontSize: '1.2rem', color: '#333', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' };

const scrollableAreaStyle = { flex: 1, overflowY: 'auto', paddingBottom: '100px' };

const imageContainerStyle = { height: '300px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' };
const imageStyle = { maxHeight: '250px', maxWidth: '80%', objectFit: 'contain' };
const discountBadgeStyle = { position: 'absolute', top: '20px', left: '20px', backgroundColor: '#ef4444', color: 'white', fontWeight: 'bold', fontSize: '0.8rem', padding: '6px 12px', borderRadius: '8px' };

const brandStyle = { fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '5px', textAlign: 'left' };
const nameStyle = { fontSize: '1.5rem', color: '#0f172a', fontWeight: '800', margin: '0 0 5px 0', lineHeight: '1.2', textAlign: 'left' };
const qntyStyle = { fontSize: '1rem', color: '#64748b', marginBottom: '20px', textAlign: 'left' };

const priceRowStyle = { display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '15px' };
const finalPriceStyle = { fontSize: '2rem', fontWeight: '900', color: '#0f172a' };
const mrpStyle = { fontSize: '1.1rem', color: '#94a3b8', textDecoration: 'line-through' };
const saveBadgeStyle = { fontSize: '0.8rem', fontWeight: 'bold', color: '#10b981', backgroundColor: '#d1fae5', padding: '4px 8px', borderRadius: '6px' };

const deliveryPromiseStyle = { color: '#0f172a', fontSize: '0.9rem', fontWeight: 'bold', backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px' };

const dividerStyle = { height: '8px', backgroundColor: '#f1f5f9' };

const tabsContainerStyle = { display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 10px', marginBottom: '20px', overflowX: 'auto' };
const tabStyle = { background: 'none', border: 'none', padding: '15px', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px' };

const contentStyle = { textAlign: 'left', lineHeight: '1.6' };
const subHeaderStyle = { fontWeight: 'bold', color: '#0f172a', marginTop: '0', marginBottom: '8px', fontSize: '1rem' };
const textStyle = { color: '#64748b', fontSize: '0.9rem', marginTop: '0', marginBottom: '20px' };
const nutriRowStyle = { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem', color: '#334155' };

const footerStyle = { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: '15px 20px', boxShadow: '0 -10px 30px rgba(0,0,0,0.05)', borderTop: '1px solid #e2e8f0', zIndex: 10 };

const bigButtonStyle = { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 25px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' };
const qtyControlsStyle = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', width: '100%', fontSize: '0.9rem' };

// --- Injecting Keyframes into the page ---
const styleTag = document.createElement("style");
styleTag.innerHTML = `
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
`;
document.head.appendChild(styleTag);
            

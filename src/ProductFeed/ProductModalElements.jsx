import React from 'react';

// 1. DIETARY ICON
export const DietaryIcon = ({ type }) => {
  const isVeg = type === "Veg" || !type;
  return (
    <div style={{ width: '16px', height: '16px', border: `1px solid ${isVeg ? '#166534' : '#7f1d1d'}`, display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '3px', backgroundColor: '#fff' }}>
      <div style={{ width: '8px', height: '8px', backgroundColor: isVeg ? '#166534' : '#7f1d1d', borderRadius: '50%' }}></div>
    </div>
  );
};

// 2. ACCORDION (Content now strictly left-aligned)
export const Accordion = ({ title, icon, children }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  return (
    <div style={{ borderBottom: '1px solid #e2e8f0', padding: '12px 0', textAlign: 'left' }}>
      <div onClick={() => setIsExpanded(!isExpanded)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#0f172a', fontWeight: 'bold' }}>
          <span style={{ fontSize: '1.1rem' }}>{icon}</span> {title}
        </div>
        <span style={{ fontSize: '1.2rem', color: '#64748b', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }}>⌄</span>
      </div>
      {isExpanded && <div style={{ paddingTop: '10px', animation: 'fadeIn 0.2s ease-in', textAlign: 'left' }}>{children}</div>}
    </div>
  );
};

// 3. FLOATING CART STRIP
export const FloatingCartStrip = ({ cartTotalItems, cartTotalPrice, onClose, onViewCart }) => {
  if (cartTotalItems === 0) return null;
  return (
    <div style={{ position: 'absolute', bottom: '15px', left: '15px', right: '15px', zIndex: 10001, animation: 'slideUpModal 0.2s ease-out' }}>
      <div 
        onClick={() => { onClose(); if (onViewCart) onViewCart(); }} 
        style={{ backgroundColor: '#0f9d58', color: '#fff', padding: '12px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(15, 157, 88, 0.4)' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
          <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{cartTotalItems} Item{cartTotalItems > 1 ? 's' : ''} | ₹{cartTotalPrice}</div>
          <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>Extra charges may apply</div>
        </div>
        <div style={{ fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '4px' }}>View Cart <span style={{ fontSize: '1.2rem' }}>›</span></div>
      </div>
    </div>
  );
};

// 4. PRICE & ADD BUTTON ROW (Strict Left Alignment)
export const PriceActionRow = ({ price, mrp, isDiscounted, cartCount, onAdd }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', textAlign: 'left' }}>
    <div style={{ textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', textAlign: 'left' }}>
        <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0f172a', lineHeight: '1' }}>₹{price}</div>
        {isDiscounted && <div style={{ fontSize: '0.85rem', color: '#94a3b8', textDecoration: 'line-through' }}>₹{mrp}</div>}
      </div>
    </div>
    <button 
      onClick={onAdd}
      style={{ 
        backgroundColor: cartCount > 0 ? '#ecfdf5' : '#0f9d58', 
        color: cartCount > 0 ? '#0f9d58' : '#fff', 
        border: '1px solid #0f9d58', padding: '0 20px', height: '40px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer',
        boxShadow: cartCount > 0 ? 'none' : '0 4px 10px rgba(15, 157, 88, 0.25)', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease'
      }}
    >
      {cartCount > 0 ? <><span style={{backgroundColor: '#0f9d58', color: '#fff', borderRadius: '4px', padding: '2px 6px', fontSize: '0.75rem'}}>{cartCount}</span>Add More +</> : "ADD"}
    </button>
  </div>
);

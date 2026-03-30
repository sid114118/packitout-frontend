import React from 'react';

export default function CrossSellSlider({ title, items, onProductClick, onAddToCart }) {
  if (!items || items.length === 0) return null;

  return (
    <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
      <h3 style={{ fontSize: '0.95rem', color: '#0f172a', margin: '0 0 12px 0', fontWeight: 'bold' }}>
        {title}
      </h3>
      
      <div className="hide-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
        {items.map(item => {
          const rPrice = item.sellingPrice || item.mrp;
          return (
            <div 
              key={item._id} 
              onClick={() => onProductClick(item)} 
              style={{ minWidth: '110px', maxWidth: '110px', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
            >
              <div style={{ height: '70px', backgroundColor: '#f8fafc', borderRadius: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px' }}>
                {item.image ? (
                  <img src={item.image} alt="" style={{ maxHeight: '80%', maxWidth: '80%', objectFit: 'contain' }} />
                ) : (
                  <span style={{fontSize: '30px'}}>{item.emoji}</span>
                )}
              </div>
              
              <div style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.qnty}
              </div>
              
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#0f172a', height: '2.4em', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: '6px' }}>
                {item.name}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>₹{rPrice}</span>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onAddToCart({ ...item, mrp: rPrice }); 
                  }} 
                  style={{ backgroundColor: '#ecfdf5', color: '#0f9d58', border: '1px solid #0f9d58', borderRadius: '4px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  ADD
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

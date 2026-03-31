import React from 'react';

export default function ShopCarousel({ shops, onSwitchShop }) {
  if (!shops || shops.length === 0) return null;

  return (
    <div style={{ padding: '20px 15px', backgroundColor: '#fff', marginTop: '10px', marginBottom: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ fontSize: '1.05rem', color: '#111827', margin: 0, fontWeight: '800' }}>🏪 Explore Nearby Stores</h3>
      </div>
      
      <div className="hide-scroll" style={{ display: 'flex', overflowX: 'auto', gap: '12px', paddingBottom: '10px', scrollSnapType: 'x mandatory' }}>
        {shops.map(shop => (
          <div 
            key={shop._id} 
            onClick={() => onSwitchShop(shop)}
            style={{ 
              minWidth: '140px', 
              padding: '12px', 
              border: '1px solid #f1f5f9', 
              borderRadius: '12px', 
              backgroundColor: '#f8fafc', 
              scrollSnapAlign: 'start',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <div style={{ fontSize: '24px' }}>🏪</div>
               <div style={{ fontSize: '0.65rem', color: shop.isOpen ? '#059669' : '#dc2626', fontWeight: '800', backgroundColor: shop.isOpen ? '#d1fae5' : '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>
                 {shop.isOpen ? 'OPEN' : 'CLOSED'}
               </div>
            </div>
            <div style={{ fontWeight: '800', color: '#111827', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '4px' }}>
              {shop.name}
            </div>
            <div style={{ color: '#0c831f', fontSize: '0.75rem', fontWeight: '700', marginTop: '2px' }}>
              Switch Store ›
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

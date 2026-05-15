import React from 'react';
import StorefrontIcon from '../ui/StorefrontIcon.jsx';

export default function ShopCarousel({ shops, onSwitchShop }) {
  if (!shops || shops.length === 0) return null;

  return (
    <div style={{ padding: '20px 15px', backgroundColor: '#fff', marginTop: '10px', marginBottom: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ fontSize: '1.05rem', color: '#111827', margin: 0, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <StorefrontIcon size={20} color="#16a34a" />
          Explore Nearby Stores
        </h3>
      </div>

      <div className="hide-scroll" style={{ display: 'flex', overflowX: 'auto', gap: '12px', paddingBottom: '10px', scrollSnapType: 'x mandatory' }}>
        {shops.map(shop => {
          const initial = (shop.name || '?').trim().charAt(0).toUpperCase();
          return (
            <div
              key={shop._id}
              onClick={() => onSwitchShop(shop)}
              style={{
                minWidth: '150px',
                padding: '12px',
                border: '1px solid #f1f5f9',
                borderRadius: '14px',
                backgroundColor: '#f8fafc',
                scrollSnapAlign: 'start',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #dcfce7 0%, #86efac 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#15803d', fontWeight: 900, fontSize: '1.05rem',
                  boxShadow: '0 2px 6px rgba(22,163,74,0.18)',
                }}>
                  {initial}
                </div>
                <div style={{ fontSize: '0.62rem', color: shop.isOpen ? '#059669' : '#dc2626', fontWeight: 800, backgroundColor: shop.isOpen ? '#d1fae5' : '#fee2e2', padding: '3px 7px', borderRadius: '999px', letterSpacing: '0.3px' }}>
                  {shop.isOpen ? 'OPEN' : 'CLOSED'}
                </div>
              </div>
              <div style={{ fontWeight: 800, color: '#111827', fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '4px' }}>
                {shop.name}
              </div>
              <div style={{ color: '#0c831f', fontSize: '0.75rem', fontWeight: 700, marginTop: '2px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Switch Store ›
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

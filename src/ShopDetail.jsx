import React from 'react';

export default function ShopDetail({ shop, onBack, onSetPrimary }) {
  if (!shop) return null;

  return (
    <div style={{ backgroundColor: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Header Image */}
      <div style={{ height: '220px', position: 'relative', backgroundColor: '#0c831f' }}>
        <button onClick={onBack} style={{ position: 'absolute', top: '20px', left: '20px', backgroundColor: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', zIndex: 10 }}>←</button>
        {shop.shopImage && <img src={shop.shopImage} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} alt={shop.name} />}
      </div>

      {/* Detail Content */}
      <div style={{ marginTop: '-30px', backgroundColor: 'white', borderRadius: '30px 30px 0 0', padding: '24px', position: 'relative' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0f172a', margin: '0 0 10px 0' }}>{shop.name}</h1>
        
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <span style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '800' }}>⭐ {shop.rating?.toFixed(1) || "5.0"} Rating</span>
            <span style={{ backgroundColor: '#f3f4f6', color: '#4b5563', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '800' }}>📍 {shop.pincode}</span>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', marginBottom: '20px' }} />

        {/* Info Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', textTransform: 'uppercase' }}>Full Address</div>
            <div style={{ color: '#111827', fontWeight: '600' }}>{shop.fullAddress || "Not provided"}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', textTransform: 'uppercase' }}>Operating Hours</div>
            <div style={{ color: '#111827', fontWeight: '600' }}>{shop.operatingHours || "09:00 AM - 10:00 PM"}</div>
          </div>
          {shop.fssai && (
            <div>
              <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', textTransform: 'uppercase' }}>FSSAI License</div>
              <div style={{ color: '#111827', fontWeight: '600' }}>{shop.fssai}</div>
            </div>
          )}
        </div>

        {/* Primary Action */}
        <button 
          onClick={() => onSetPrimary(shop._id)}
          style={{ width: '100%', marginTop: '40px', padding: '18px', backgroundColor: '#0c831f', color: 'white', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 8px 20px rgba(12, 131, 31, 0.2)' }}
        >
          Set as Primary Shop 🏪
        </button>
      </div>
    </div>
  );
}

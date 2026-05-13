import React, { useState, useEffect } from 'react';
import { cdnImage } from './utils/cloudinaryUrl.js';

const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

export default function Nearby({ user, onSelectShop }) {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.pincode) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`${BASE_URL}/shops/all/${user.pincode}`)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        setShops(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Searching for local shops...</div>;
  if (!user?.pincode) return <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>Add your pincode in Profile to see nearby shops.</div>;

  return (
    <div style={{ padding: '15px', backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0f172a', marginBottom: '15px' }}>Shops in {user?.pincode}</h2>
      
      {/* 🚀 THE GRID */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '12px' 
      }}>
        {shops.map(shop => (
          <div 
            key={shop._id} 
            onClick={() => onSelectShop(shop)}
            style={{ 
              backgroundColor: 'white', 
              borderRadius: '16px', 
              overflow: 'hidden', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0',
              cursor: 'pointer'
            }}
          >
            {/* Shop Image */}
            <div style={{ height: '100px', backgroundColor: '#e2e8f0', position: 'relative' }}>
               {shop.shopImage ? (
                 <img src={cdnImage(shop.shopImage, 500)} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={shop.name} />
               ) : (
                 <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🏪</div>
               )}
               {/* Open/Closed Badge */}
               <div style={{ 
                 position: 'absolute', top: '8px', right: '8px', 
                 backgroundColor: shop.isOpen ? '#22c55e' : '#ef4444', 
                 color: 'white', fontSize: '0.6rem', fontWeight: '900', padding: '3px 8px', borderRadius: '20px' 
               }}>
                 {shop.isOpen ? "OPEN" : "CLOSED"}
               </div>
            </div>

            {/* Shop Info */}
            <div style={{ padding: '10px' }}>
              <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#111827', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {shop.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                ⭐ {shop.rating?.toFixed(1) || "5.0"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {shops.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          No shops found in your area yet.
        </div>
      )}
    </div>
  );
}

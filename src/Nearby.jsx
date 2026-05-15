import React, { useState, useEffect } from 'react';
import { cdnImage } from './utils/cloudinaryUrl.js';
import StorefrontIcon from './ui/StorefrontIcon.jsx';

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
    <div style={{ padding: '16px 14px 28px', background: 'linear-gradient(180deg, #f8fafc 0%, #f3f4f6 220px)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#16a34a', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '2px' }}>
          Near you · {user?.pincode}
        </div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.4px' }}>
          Shops around the corner
        </h2>
        <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>
          {shops.length > 0 ? `${shops.length} ${shops.length === 1 ? 'shop' : 'shops'} ready to deliver` : 'Looking for stores near you'}
        </div>
      </div>

      {/* THE GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '14px'
      }}>
        {shops.map(shop => {
          const initial = (shop.name || '?').trim().charAt(0).toUpperCase();
          const rating = Number(shop.rating) || 5.0;
          return (
            <button
              key={shop._id}
              onClick={() => onSelectShop(shop)}
              style={{
                appearance: 'none',
                textAlign: 'left',
                padding: 0,
                backgroundColor: '#fff',
                borderRadius: '18px',
                overflow: 'hidden',
                boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)',
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'transform 0.12s ease, box-shadow 0.12s ease',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
              onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {/* Image / fallback */}
              <div style={{ height: '128px', position: 'relative', overflow: 'hidden' }}>
                {shop.shopImage ? (
                  <img
                    src={cdnImage(shop.shopImage, 500)}
                    loading="lazy"
                    decoding="async"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    alt={shop.name}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 60%, #86efac 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.5), transparent 55%)',
                    }} />
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '64px', height: '64px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.85)',
                      boxShadow: '0 4px 14px rgba(22, 163, 74, 0.18)',
                      position: 'relative',
                    }}>
                      <span style={{ fontSize: '1.7rem', fontWeight: 900, color: '#15803d', lineHeight: 1 }}>{initial}</span>
                      <span style={{
                        position: 'absolute', bottom: '-4px', right: '-4px',
                        background: '#16a34a', borderRadius: '50%', padding: '4px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(22,163,74,0.35)',
                      }}>
                        <StorefrontIcon size={14} color="#fff" accent="#bbf7d0" />
                      </span>
                    </div>
                  </div>
                )}

                {/* Open/Closed pill */}
                <div style={{
                  position: 'absolute', top: '8px', left: '8px',
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  backgroundColor: shop.isOpen ? 'rgba(22,163,74,0.95)' : 'rgba(220,38,38,0.95)',
                  color: 'white', fontSize: '0.62rem', fontWeight: 900,
                  padding: '4px 8px', borderRadius: '999px',
                  letterSpacing: '0.4px',
                  backdropFilter: 'blur(4px)',
                }}>
                  <span style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: '#fff',
                    boxShadow: shop.isOpen ? '0 0 0 2px rgba(255,255,255,0.35)' : 'none',
                  }} />
                  {shop.isOpen ? 'OPEN NOW' : 'CLOSED'}
                </div>

                {/* ETA pill */}
                <div style={{
                  position: 'absolute', bottom: '8px', right: '8px',
                  backgroundColor: 'rgba(15,23,42,0.78)',
                  color: '#fff',
                  fontSize: '0.62rem', fontWeight: 800,
                  padding: '4px 8px', borderRadius: '999px',
                  letterSpacing: '0.3px',
                  backdropFilter: 'blur(4px)',
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="12 7 12 12 15 14" />
                  </svg>
                  {shop.deliveryEta || '15-20 min'}
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: '11px 12px 12px' }}>
                <div style={{
                  fontWeight: 800, fontSize: '0.95rem', color: '#0f172a',
                  marginBottom: '4px',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  letterSpacing: '-0.2px',
                }}>
                  {shop.name}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  fontSize: '0.72rem', color: '#64748b', fontWeight: 700,
                }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '3px',
                    background: '#f0fdf4', color: '#15803d',
                    padding: '2px 7px', borderRadius: '999px',
                    border: '1px solid #bbf7d0',
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#15803d" aria-hidden="true">
                      <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7L2 9.2l7.1-.6L12 2z" />
                    </svg>
                    {rating.toFixed(1)}
                  </span>
                  {shop.distance ? (
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {shop.distance}
                    </span>
                  ) : (
                    <span style={{ color: '#16a34a' }}>Local store</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {shops.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '50px 20px',
          color: '#64748b',
          background: '#fff',
          border: '1px dashed #e2e8f0',
          borderRadius: '16px',
          marginTop: '20px',
        }}>
          <div style={{ display: 'inline-flex', padding: '14px', borderRadius: '50%', background: '#f0fdf4', marginBottom: '12px' }}>
            <StorefrontIcon size={32} color="#16a34a" />
          </div>
          <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>No shops yet in your area</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>We're onboarding stores near {user?.pincode}. Check back soon!</div>
        </div>
      )}
    </div>
  );
}

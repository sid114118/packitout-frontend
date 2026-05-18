import React, { useState, useEffect } from 'react';
import { cdnImage } from './utils/cloudinaryUrl.js';
import StorefrontIcon from './ui/StorefrontIcon.jsx';

export default function ShopDetail({ shop, onBack, onSetPrimary }) {
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

  // 📝 Fetch shop-specific reviews when the component opens
  useEffect(() => {
    if (shop?._id) {
      setLoadingReviews(true);
      fetch(`${BASE_URL}/reviews/shop/${shop._id}`)
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          // Server can return an error object on a 500 — `.slice()` on that
          // would crash the page. Default to [] so the section just stays empty.
          setReviews(Array.isArray(data) ? data : []);
          setLoadingReviews(false);
        })
        .catch(() => setLoadingReviews(false));
    }
  }, [shop?._id]);

  if (!shop) return null;

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Header Image */}
      <div style={{ height: '220px', position: 'relative', backgroundColor: '#0c831f' }}>
        <button onClick={onBack} style={{ position: 'absolute', top: '20px', left: '20px', backgroundColor: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', zIndex: 10 }}>←</button>
        {shop.shopImage && <img src={cdnImage(shop.shopImage, 800)} decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} alt={shop.name} />}
      </div>

      {/* Detail Content */}
      <div style={{ marginTop: '-30px', backgroundColor: 'white', borderRadius: '30px 30px 0 0', padding: '24px', position: 'relative', boxShadow: '0 -10px 30px rgba(0,0,0,0.05)' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0f172a', margin: '0 0 10px 0' }}>{shop.name}</h1>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <span style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '800' }}>⭐ {shop.rating?.toFixed(1) || "5.0"} Rating</span>
            <span style={{ backgroundColor: '#eff6ff', color: '#1e40af', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '800' }}>📦 {shop.totalOrdersFulfilled || '0'}+ Orders</span>
            <span style={{ backgroundColor: '#f3f4f6', color: '#4b5563', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '800' }}>📍 {shop.pincode}</span>
        </div>

        {/* 🏪 RATING SUMMARY CARD */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '16px', marginBottom: '25px', border: '1px solid #f1f5f9' }}>
          <div style={{ textAlign: 'center', paddingRight: '15px', borderRight: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#111827' }}>{shop.rating?.toFixed(1) || "5.0"}</div>
            <div style={{ color: '#facc15', fontSize: '0.8rem' }}>★★★★★</div>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: '800', marginTop: '4px', textTransform: 'uppercase' }}>{shop.totalReviews || 0} Reviews</div>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', fontWeight: '600', lineHeight: '1.4' }}>
              {reviews.length > 0 
                ? `"${reviews[0].comment || 'Great service and fresh products!'}"`
                : "No recent feedback available for this store."}
            </p>
            {reviews.length > 0 && <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700' }}>— {reviews[0].userName}</span>}
          </div>
        </div>

        {/* Info Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Store Address</div>
            <div style={{ color: '#1e293b', fontWeight: '600', lineHeight: '1.5' }}>{shop.fullAddress || "Address details not provided by owner."}</div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase' }}>Hours</div>
              <div style={{ color: '#1e293b', fontWeight: '600' }}>{shop.operatingHours || "09:00 AM - 10:00 PM"}</div>
            </div>
            {shop.fssai && (
              <div>
                <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase' }}>FSSAI</div>
                <div style={{ color: '#1e293b', fontWeight: '600' }}>{shop.fssai}</div>
              </div>
            )}
          </div>
        </div>

        {/* 💬 RECENT REVIEWS LIST */}
        <div style={{ marginTop: '35px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', marginBottom: '15px' }}>What customers are saying</h3>
          
          {loadingReviews ? (
            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Loading reviews...</div>
          ) : reviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reviews.slice(0, 3).map((rev, i) => (
                <div key={i} style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#1e293b' }}>{rev.userName}</span>
                    <span style={{ color: '#facc15', fontSize: '0.75rem' }}>{'★'.repeat(rev.rating)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>{rev.comment || "Rated 5 stars"}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', color: '#94a3b8', fontSize: '0.85rem' }}>
              No reviews yet. Be the first to order!
            </div>
          )}
        </div>

        {/* Primary Action */}
        <button
          onClick={() => onSetPrimary(shop._id)}
          style={{ width: '100%', marginTop: '40px', padding: '18px', backgroundColor: '#0c831f', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 8px 20px rgba(12, 131, 31, 0.2)', transition: 'transform 0.1s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Set as Primary Shop
          <StorefrontIcon size={20} color="#fff" accent="#bbf7d0" />
        </button>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';

export default function ShopReviews({ shopId, shopRating, totalReviews }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";

  useEffect(() => {
    if (shopId) {
      setLoading(true);
      fetch(`${BASE_URL}/reviews/shop/${shopId}`)
        .then(res => res.json())
        .then(data => {
          setReviews(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch shop reviews:", err);
          setLoading(false);
        });
    }
  }, [shopId]);

  const renderStars = (rating) => {
    return '⭐'.repeat(Math.round(rating || 5));
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginTop: '20px' }}>
      
      {/* --- HEADER & SUMMARY --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px', marginBottom: '15px' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>Customer Feedback</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>See what your customers are saying.</p>
        </div>
        
        <div style={{ textAlign: 'right', backgroundColor: '#f8fafc', padding: '10px 15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0c831f', lineHeight: '1' }}>
            {shopRating?.toFixed(1) || "5.0"}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', marginTop: '4px', textTransform: 'uppercase' }}>
            {totalReviews || reviews.length} Reviews
          </div>
        </div>
      </div>

      {/* --- REVIEWS LIST --- */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '0.9rem' }}>Loading feedback...</div>
      ) : reviews.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {reviews.map((rev, i) => (
            <div key={i} style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {rev.userName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>{rev.userName}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600' }}>
                      {new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
                
                <div style={{ fontSize: '0.8rem' }}>
                  {renderStars(rev.rating)}
                </div>
              </div>

              {rev.comment ? (
                <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#475569', lineHeight: '1.5', paddingLeft: '42px' }}>
                  "{rev.comment}"
                </p>
              ) : (
                <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', paddingLeft: '42px' }}>
                  Rated {rev.rating} stars
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💬</div>
          <div style={{ fontWeight: '700', color: '#475569', fontSize: '0.95rem' }}>No reviews yet</div>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px' }}>When customers rate your shop, their feedback will appear here.</div>
        </div>
      )}
      
    </div>
  );
}

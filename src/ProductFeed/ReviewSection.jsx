import React, { useState } from 'react';

export default function ReviewSection({ targetId, reviews = [], type = "Product" }) {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🧮 Math for the Summary
  const safeReviews = Array.isArray(reviews) ? reviews : [];
  const totalReviews = safeReviews.length;
  const averageRating = totalReviews > 0 
    ? (safeReviews.reduce((sum, rev) => sum + (Number(rev.rating) || 0), 0) / totalReviews).toFixed(1)
    : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // 🚧 Here is where you will eventually call your backend API
    console.log(`Submitting ${rating} star review for ${targetId}:`, comment);
    
    setTimeout(() => {
      setIsSubmitting(false);
      setShowForm(false);
      setComment("");
      alert("Review submitted successfully! (Frontend Only)");
    }, 1000);
  };

  return (
    <div style={{ marginTop: '30px', borderTop: '4px solid #f8fafc', paddingTop: '20px', marginInline: '-20px', paddingInline: '20px' }}>
      
      {/* 🌟 HEADER & SUMMARY */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 4px 0', color: '#111827', fontWeight: '800' }}>{type} Reviews</h3>
          {totalReviews > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ backgroundColor: '#16a34a', color: 'white', fontSize: '0.8rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                {averageRating} ★
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>({totalReviews} reviews)</span>
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>No reviews yet. Be the first!</div>
          )}
        </div>
        
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{ backgroundColor: '#f1f5f9', color: '#0c831f', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer' }}
        >
          {showForm ? 'Cancel' : 'Write a Review'}
        </button>
      </div>

      {/* ✍️ WRITE A REVIEW FORM */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px', animation: 'fadeIn 0.2s ease' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Tap to Rate</label>
            <div style={{ display: 'flex', gap: '8px', fontSize: '1.8rem', cursor: 'pointer' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <span 
                  key={star} 
                  onClick={() => setRating(star)}
                  style={{ color: star <= rating ? '#f59e0b' : '#cbd5e1', transition: 'color 0.2s' }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <textarea 
            placeholder="What did you think about this?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
            style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: '0.9rem', marginBottom: '12px' }}
          />
          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ width: '100%', backgroundColor: '#0c831f', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '800', fontSize: '0.95rem', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? 'Posting...' : 'Post Review'}
          </button>
        </form>
      )}

      {/* 💬 REVIEW LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {safeReviews.slice(0, 5).map((rev, idx) => (
          <div key={idx} style={{ borderBottom: idx === safeReviews.length - 1 ? 'none' : '1px solid #f1f5f9', paddingBottom: idx === safeReviews.length - 1 ? '0' : '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ backgroundColor: '#e2e8f0', color: '#475569', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b' }}>{rev.userName || 'User'}</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {rev.date ? new Date(rev.date).toLocaleDateString() : 'Recently'}
              </span>
            </div>
            
            <div style={{ display: 'flex', color: '#f59e0b', fontSize: '0.9rem', marginBottom: '6px' }}>
              {'★'.repeat(Number(rev.rating) || 5)}{'☆'.repeat(5 - (Number(rev.rating) || 5))}
            </div>
            
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: '1.5' }}>
              {rev.comment}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
            }

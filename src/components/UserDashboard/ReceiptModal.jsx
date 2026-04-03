import React, { useState } from 'react';
import { createPortal } from 'react-dom';

// --- 🌟 THE REVIEW BOTTOM SHEET COMPONENT ---
function ReviewSheet({ isOpen, onClose, item, onSubmitReview }) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !item) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Please select a star rating first! ⭐");
      return;
    }
    setIsSubmitting(true);
    
    // If you passed an actual backend function, run it. Otherwise, simulate it.
    if (onSubmitReview) {
      await onSubmitReview(item.product || item._id, rating, reviewText);
    } else {
      console.log("Review ready for backend:", { productId: item.product || item._id, rating, reviewText });
      setTimeout(() => alert("Thank you for your review! 🌟"), 300);
    }
    
    setIsSubmitting(false);
    setRating(0);
    setReviewText('');
    onClose();
  };

  return createPortal(
    <>
      {/* Dark Overlay */}
      <div 
        onClick={onClose} 
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, backdropFilter: 'blur(2px)', animation: 'fadeIn 0.2s ease' }} 
      />
      
      {/* Bottom Sheet */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10001, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'slideUpPage 0.25s cubic-bezier(0.32,0.72,0,1)' }}>
        <style>{`
          @keyframes slideUpPage { from { transform: translateY(100%); } to { transform: translateY(0); } }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        `}</style>
        
        <button onClick={onClose} style={{ marginBottom: '15px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
          ✕
        </button>
        
        <div style={{ backgroundColor: '#fff', width: '100%', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', paddingBottom: '40px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ width: '50px', height: '50px', backgroundColor: '#f8fafc', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {item.image ? <img src={item.image} alt={item.name} style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} /> : <span style={{ fontSize: '24px' }}>{item.emoji || '📦'}</span>}
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#111827', fontWeight: '800' }}>{item.name}</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Rate your experience</p>
            </div>
          </div>

          {/* Star Rating */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button 
                key={star} 
                onClick={() => setRating(star)}
                style={{ background: 'none', border: 'none', fontSize: '2.8rem', color: star <= rating ? '#facc15' : '#e2e8f0', cursor: 'pointer', transition: 'color 0.2s', padding: 0 }}
              >
                ★
              </button>
            ))}
          </div>

          {/* Text Area */}
          <textarea 
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="What did you like about it? (optional)"
            style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.9rem', color: '#1e293b', resize: 'none', marginBottom: '20px', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />

          {/* Submit Button */}
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            style={{ width: '100%', padding: '14px', backgroundColor: '#0c831f', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '800', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1, boxShadow: '0 4px 10px rgba(12, 131, 31, 0.2)' }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

// --- 🧾 MAIN RECEIPT MODAL ---
export default function ReceiptModal({ selectedOrder, setSelectedOrder, onSubmitReview }) {
  const [itemToReview, setItemToReview] = useState(null);

  if (!selectedOrder) return null;

  // Check if order is complete/delivered to allow reviews
  const isDelivered = selectedOrder.status && (selectedOrder.status.includes('✅') || selectedOrder.status.includes('🎉'));

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
      
      <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '600px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '25px', paddingBottom: '40px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}>
        
        {/* --- HEADER --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px dashed #e2e8f0', paddingBottom: '15px', marginBottom: '15px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold', letterSpacing: '1px' }}>DIGITAL RECEIPT</span>
            <h3 style={{ margin: '5px 0 0 0', color: '#0f172a', fontSize: '1.4rem' }}>{selectedOrder.shopId?.name || "Local Shop"}</h3>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '5px' }}>{new Date(selectedOrder.createdAt).toLocaleString()}</div>
          </div>
          <button onClick={() => setSelectedOrder(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '35px', height: '35px', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#64748b' }}>✖</button>
        </div>

        {/* --- 📸 ATTACHED PARCHI IMAGE --- */}
        {(selectedOrder.imageUrl || selectedOrder.parchiImage || selectedOrder.image) && (
          <div style={{ marginBottom: '20px', textAlign: 'center', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '0.5px' }}>ORIGINAL LIST</span>
            <img 
              src={selectedOrder.imageUrl || selectedOrder.parchiImage || selectedOrder.image} 
              alt="Uploaded Parchi" 
              style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} 
            />
          </div>
        )}

        {/* --- ITEMIZED BILL --- */}
        <div style={{ marginBottom: '20px' }}>
          {selectedOrder.items && selectedOrder.items.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
              <tbody>
                {selectedOrder.items.map((item, i) => {
                  const price = item.price || item.sellingPrice || item.mrp || item.product?.sellingPrice || item.product?.mrp || 0;
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '12px 0', color: '#334155', fontWeight: '500', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: '700' }}>{item.name}</div>
                        {/* 🌟 NEW: RATE ITEM BUTTON */}
                        {isDelivered && (
                          <button 
                            onClick={() => setItemToReview(item)}
                            style={{ marginTop: '6px', padding: '4px 10px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            ★ Rate Item
                          </button>
                        )}
                      </td>
                      <td style={{ padding: '12px 0', textAlign: 'center', color: '#64748b', verticalAlign: 'top' }}>x{item.qty}</td>
                      <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 'bold', color: '#0f172a', verticalAlign: 'top' }}>₹{price * item.qty}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontStyle: 'italic' }}>
              Items are being added by the shopkeeper...
            </div>
          )}
        </div>

        {/* --- TOTAL BANNER --- */}
        <div style={{ background: 'linear-gradient(90deg, #f8fafc, #f1f5f9)', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '1.1rem', color: '#475569', fontWeight: 'bold' }}>Total Amount</span>
          <span style={{ fontSize: '1.4rem', color: '#10b981', fontWeight: '900' }}>
            {typeof selectedOrder.totalAmount === 'number' ? `₹${selectedOrder.totalAmount}` : selectedOrder.totalAmount}
          </span>
        </div>
        
        {/* --- STATUS BADGE --- */}
        <div style={{ marginTop: '25px', textAlign: 'center' }}>
           <span style={{ 
             padding: '10px 20px', 
             borderRadius: '25px', 
             fontSize: '0.9rem', 
             fontWeight: 'bold', 
             backgroundColor: isDelivered ? '#d1fae5' : '#e0f2fe', 
             color: isDelivered ? '#059669' : '#0369a1',
             boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
           }}>
             Status: {selectedOrder.status}
           </span>
        </div>

      </div>

      {/* 🌟 REVIEW BOTTOM SHEET */}
      <ReviewSheet 
        isOpen={itemToReview !== null}
        item={itemToReview}
        onClose={() => setItemToReview(null)}
        onSubmitReview={onSubmitReview}
      />
    </div>
  );
}

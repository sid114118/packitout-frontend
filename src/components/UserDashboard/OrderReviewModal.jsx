import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../../ui/DialogProvider.jsx';

// 🛡️ THE FIX: This safely extracts the pure string ID no matter how the data is shaped!
const getProductId = (item) => {
  let id = item._id;
  if (item.product && typeof item.product === 'object' && item.product._id) id = item.product._id;
  else if (item.product && typeof item.product === 'string') id = item.product;
  else if (item.productId) id = item.productId;
  return id?.toString();
};

export default function OrderReviewModal({ isOpen, onClose, order, onSubmitReviews }) {
  const toast = useToast();
  const [shopRating, setShopRating] = useState(0);
  const [shopReviewText, setShopReviewText] = useState('');
  const [itemRatings, setItemRatings] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const handleItemRating = (itemId, rating) => {
    setItemRatings(prev => ({ ...prev, [itemId]: rating }));
  };

  const handleSubmit = async () => {
    const hasProductRating = Object.values(itemRatings).some(rating => rating > 0);
    
    if (shopRating === 0 && !hasProductRating) {
      toast("Please rate the shop or at least one item first! ⭐", 'warn');
      return;
    }
    
    setIsSubmitting(true);

    const reviewPayload = {
      orderId: order._id,
      shop: shopRating > 0 ? {
        // Safely extract shop ID
        shopId: typeof order.shopId === 'object' ? order.shopId?._id : order.shopId,
        rating: shopRating,
        reviewText: shopReviewText
      } : null,
      
      // Only send items that actually have a valid 24-char MongoDB ID
      items: Object.keys(itemRatings)
        .filter(id => itemRatings[id] > 0 && id && id.length === 24) 
        .map(itemId => ({
          productId: itemId,
          rating: itemRatings[itemId]
        }))
    };

    if (onSubmitReviews) {
      await onSubmitReviews(reviewPayload);
    } else {
      setTimeout(() => toast("Thanks for your feedback! 🎉"), 400);
    }

    setIsSubmitting(false);
    // Note: UserDashboard handles closing it via state, but we can call onClose to be safe
    if(onClose) onClose(); 
  };

  const shopName = order.shopId?.name || "Local Shop";

  return createPortal(
    <>
      {/* Dark Overlay */}
      <div 
        onClick={onClose} 
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, backdropFilter: 'blur(3px)', animation: 'fadeIn 0.2s ease' }} 
      />
      
      {/* Bottom Sheet */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10001, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'slideUpPage 0.3s cubic-bezier(0.32,0.72,0,1)' }}>
        <style>{`
          @keyframes slideUpPage { from { transform: translateY(100%); } to { transform: translateY(0); } }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          .hide-scroll::-webkit-scrollbar { display: none; }
          .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
        
        <button onClick={onClose} style={{ marginBottom: '15px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
          ✕
        </button>
        
        <div style={{ backgroundColor: '#f8fafc', width: '100%', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px 20px', paddingBottom: '40px', maxHeight: '85vh', overflowY: 'auto' }} className="hide-scroll">
          
          <h2 style={{ margin: '0 0 5px 0', fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', textAlign: 'center' }}>How was your order?</h2>
          <p style={{ margin: '0 0 25px 0', fontSize: '0.9rem', color: '#64748b', textAlign: 'center' }}>Your feedback helps us improve.</p>

          {/* 🏪 RATE THE SHOP SECTION */}
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', marginBottom: '20px', border: '1px solid #f1f5f9' }}>
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '5px' }}>🚚</div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b' }}>Rate {shopName} & Delivery</h3>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '15px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star} 
                  onClick={() => setShopRating(star)}
                  style={{ background: 'none', border: 'none', fontSize: '2.5rem', color: star <= shopRating ? '#facc15' : '#e2e8f0', cursor: 'pointer', transition: 'transform 0.1s, color 0.2s', padding: 0, transform: star <= shopRating ? 'scale(1.1)' : 'scale(1)' }}
                >
                  ★
                </button>
              ))}
            </div>

            {shopRating > 0 && shopRating < 4 && (
              <textarea 
                value={shopReviewText}
                onChange={(e) => setShopReviewText(e.target.value)}
                placeholder="What went wrong? (Optional)"
                style={{ width: '100%', height: '80px', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.9rem', color: '#1e293b', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', animation: 'fadeIn 0.2s ease' }}
              />
            )}
          </div>

          {/* 📦 RATE THE ITEMS SECTION */}
          {order.items && order.items.length > 0 && (
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', marginBottom: '20px', border: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>Rate the items (Optional)</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {order.items.map((item, idx) => {
                  
                  // 🛡️ THE FIX: Generate a safe string ID for the item!
                  const itemId = getProductId(item);
                  
                  // If we can't find a valid database ID for this item (e.g., custom manual entry), skip rendering it.
                  if (!itemId || itemId.length !== 24) return null;

                  const currentRating = itemRatings[itemId] || 0;
                  
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, paddingRight: '10px' }}>
                        <div style={{ width: '35px', height: '35px', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                           {item.image ? <img src={item.image} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <span>📦</span>}
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.name}
                        </div>
                      </div>
                      
                      {/* Mini Star Rater */}
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star} 
                            onClick={() => handleItemRating(itemId, star)}
                            style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: star <= currentRating ? '#facc15' : '#e2e8f0', cursor: 'pointer', padding: '0 2px' }}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 🚀 SUBMIT BUTTON */}
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            style={{ width: '100%', padding: '16px', backgroundColor: '#0c831f', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '1.05rem', fontWeight: '800', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1, boxShadow: '0 4px 15px rgba(12, 131, 31, 0.25)', transition: 'transform 0.1s' }}
          >
            {isSubmitting ? 'Submitting Feedback...' : 'Submit Feedback'}
          </button>

        </div>
      </div>
    </>,
    document.body
  );
}

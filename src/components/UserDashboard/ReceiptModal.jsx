import React, { useState } from 'react';
import { createPortal } from 'react-dom';

// --- 🌟 UNIFIED ORDER REVIEW MODAL ---
function OrderReviewModal({ isOpen, onClose, order, onSubmitReviews }) {
  const [shopRating, setShopRating] = useState(0);
  const [shopReviewText, setShopReviewText] = useState('');
  // Stores item ratings as a dictionary: { "64abcd1234": 5 }
  const [itemRatings, setItemRatings] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  // 🛡️ THE FIX: Safely extract a pure string ID so products don't overlap!
  const getProductId = (item) => {
    let id = item._id;
    if (item.product && typeof item.product === 'object' && item.product._id) id = item.product._id;
    else if (item.product && typeof item.product === 'string') id = item.product;
    else if (item.productId) id = item.productId;
    return id?.toString();
  };

  const handleItemRating = (itemId, rating) => {
    setItemRatings(prev => ({ ...prev, [itemId]: rating }));
  };

  const handleSubmit = async () => {
    // 🛡️ THE FIX: Allow submitting if EITHER the shop OR an item has a rating.
    const hasProductRating = Object.values(itemRatings).some(rating => rating > 0);
    
    if (shopRating === 0 && !hasProductRating) {
      alert("Please rate the shop or at least one item first! ⭐");
      return;
    }
    
    setIsSubmitting(true);

    const reviewPayload = {
      orderId: order._id,
      shop: shopRating > 0 ? {
        shopId: typeof order.shopId === 'object' ? order.shopId._id : order.shopId,
        rating: shopRating,
        reviewText: shopReviewText
      } : null,
      items: Object.keys(itemRatings)
        .filter(id => itemRatings[id] > 0) // Only send items that were actually rated
        .map(itemId => ({
          productId: itemId,
          rating: itemRatings[itemId]
        }))
    };

    if (onSubmitReviews) {
      await onSubmitReviews(reviewPayload);
    } else {
      console.log("Submitting unified review:", reviewPayload);
      setTimeout(() => alert("Thank you for your valuable feedback! 🎉"), 400);
    }

    setIsSubmitting(false);
    onClose();
  };

  const shopName = order.shopId?.name || "Local Shop";

  return createPortal(
    <>
      <div 
        onClick={onClose} 
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, backdropFilter: 'blur(3px)', animation: 'fadeIn 0.2s ease' }} 
      />
      
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
                  const itemId = getProductId(item);
                  const currentRating = itemRatings[itemId] || 0;
                  
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, paddingRight: '10px' }}>
                        <div style={{ width: '35px', height: '35px', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                           {item.image ? <img src={item.image} alt="" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} /> : <span>📦</span>}
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.name}
                        </div>
                      </div>
                      
                      {/* Mini Star Rater */}
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={`item-${idx}-${star}`} 
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

// --- 🧾 MAIN RECEIPT MODAL ---
export default function ReceiptModal({ selectedOrder, setSelectedOrder, onSubmitReviews }) {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  if (!selectedOrder) return null;

  const isDelivered = selectedOrder.status && (selectedOrder.status.includes('✅') || selectedOrder.status.includes('🎉'));
  const isAlreadyReviewed = selectedOrder.isReviewed === true;

  return (
    <>
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
          
          {/* --- STATUS BADGE & MAIN REVIEW BUTTON --- */}
          <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
             <span style={{ padding: '10px 20px', borderRadius: '25px', fontSize: '0.9rem', fontWeight: 'bold', backgroundColor: isDelivered ? '#d1fae5' : '#e0f2fe', color: isDelivered ? '#059669' : '#0369a1' }}>
               Status: {selectedOrder.status}
             </span>

             {isDelivered && !isAlreadyReviewed && (
               <button 
                 onClick={() => setIsReviewModalOpen(true)}
                 style={{ width: '100%', padding: '14px', backgroundColor: '#fff', color: '#111827', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}
               >
                 <span style={{ color: '#facc15', fontSize: '1.3rem' }}>★</span> Rate your Order
               </button>
             )}
             
             {isDelivered && isAlreadyReviewed && (
               <div style={{ width: '100%', padding: '12px', backgroundColor: '#fefce8', color: '#ca8a04', border: '1px dashed #fef08a', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '700', textAlign: 'center' }}>
                 ⭐ You rated this order!
               </div>
             )}
          </div>

        </div>
      </div>

      <OrderReviewModal 
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        order={selectedOrder}
        onSubmitReviews={onSubmitReviews}
      />
    </>
  );
                                                                                                                                    }

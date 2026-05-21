import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cdnImage } from '../../utils/cloudinaryUrl.js';
import { userFetch } from '../../utils/api.js';
import { useToast, useConfirm } from '../../ui/DialogProvider.jsx';

const getProductId = (item) => {
  let id = item._id;
  if (item.product && typeof item.product === 'object' && item.product._id) id = item.product._id;
  else if (item.product && typeof item.product === 'string') id = item.product;
  else if (item.productId) id = item.productId;
  return id?.toString();
};

export default function ViewReviewModal({ isOpen, onClose, order, user, onReviewsDeleted }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();
  const askConfirm = useConfirm();

  // Refetch reviews when the modal opens for a given order. Depend on
  // `order?._id` rather than the order object — previously every parent
  // re-render passed a fresh object identity and re-ran the fetch.
  useEffect(() => {
    if (!isOpen) return;
    const orderId = order?._id;
    if (!orderId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    // Route through userFetch so the bearer token is attached. GET /reviews
    // /order/:id is currently public, but the path centralises auth so a
    // future tightening of that route doesn't silently break this modal.
    userFetch(user, `/reviews/order/${orderId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (cancelled) return;
        setReviews(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setReviews([]);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [isOpen, order?._id, user]);

  if (!isOpen || !order) return null;

  const shopName = order.shopId?.name || "Local Shop";
  const shopReview = reviews.find(r => r.targetType === 'shop');
  const itemReviews = reviews.filter(r => r.targetType === 'product');

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, backdropFilter: 'blur(3px)', animation: 'fadeIn 0.2s ease' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10001, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'slideUpPage 0.3s cubic-bezier(0.32,0.72,0,1)' }}>
        
        <button onClick={onClose} style={{ marginBottom: '15px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>✕</button>
        
        <div style={{ backgroundColor: '#f8fafc', width: '100%', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px 20px', paddingBottom: '40px', maxHeight: '85vh', overflowY: 'auto' }} className="hide-scroll">
          <h2 style={{ margin: '0 0 5px 0', fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', textAlign: 'center' }}>Your Feedback</h2>
          <p style={{ margin: '0 0 25px 0', fontSize: '0.9rem', color: '#16a34a', textAlign: 'center', fontWeight: '600' }}>Thanks for rating this order!</p>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading your ratings...</div>
          ) : (
            <>
              {shopReview && (
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', marginBottom: '20px', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ fontSize: '1.5rem' }}>🚚</div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b' }}>{shopName}</h3>
                    </div>
                    <div style={{ color: '#facc15', fontSize: '1.2rem', letterSpacing: '2px' }}>
                      {'★'.repeat(shopReview.rating)}{'☆'.repeat(5 - shopReview.rating)}
                    </div>
                  </div>
                  {shopReview.comment && (
                    <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', fontSize: '0.85rem', color: '#475569', fontStyle: 'italic', border: '1px solid #e2e8f0' }}>
                      "{shopReview.comment}"
                    </div>
                  )}
                </div>
              )}

              {user && reviews.length > 0 && (
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <button
                    disabled={deleting}
                    onClick={async () => {
                      const ok = await askConfirm({
                        title: 'Delete this review?',
                        message: 'Your rating will be removed and you can re-rate this order.',
                        confirmText: 'Delete',
                        danger: true,
                      });
                      if (!ok) return;
                      setDeleting(true);
                      try {
                        // Sequential DELETE so the server can recompute the shop
                        // rating cleanly after each removal.
                        for (const r of reviews) {
                          await userFetch(user, `/reviews/${r._id}`, { method: 'DELETE' });
                        }
                        toast('Review deleted. You can rate the order again.');
                        if (onReviewsDeleted) onReviewsDeleted(order._id);
                        onClose();
                      } catch { toast('Could not delete review', 'error'); }
                      finally { setDeleting(false); }
                    }}
                    style={{ background: 'transparent', color: '#dc2626', border: '1px solid #fecaca', padding: '8px 14px', borderRadius: 10, fontWeight: 800, fontSize: '0.85rem', cursor: deleting ? 'wait' : 'pointer' }}
                  >
                    {deleting ? 'Deleting…' : '🗑️ Delete review & re-rate'}
                  </button>
                </div>
              )}

              {itemReviews.length > 0 && (
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', marginBottom: '20px', border: '1px solid #f1f5f9' }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>Items you rated</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {order.items.map((item, idx) => {
                      const itemId = getProductId(item);
                      const reviewForItem = itemReviews.find(r => String(r.targetId) === String(itemId));
                      
                      if (!reviewForItem) return null;

                      return (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, paddingRight: '10px' }}>
                            <div style={{ width: '35px', height: '35px', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                               {item.image ? <img src={cdnImage(item.image, 150)} alt="" loading="lazy" decoding="async" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} /> : <span>📦</span>}
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.name}</div>
                          </div>
                          <div style={{ color: '#facc15', fontSize: '1.1rem', letterSpacing: '1px' }}>
                            {'★'.repeat(reviewForItem.rating)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  );
                               }

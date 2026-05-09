import React, { useState } from 'react';
import ViewReviewModal from './ViewReviewModal';
import { cdnImage } from '../../utils/cloudinaryUrl.js';

export default function ReceiptModal({ selectedOrder, setSelectedOrder }) {
  const [isViewReviewModalOpen, setIsViewReviewModalOpen] = useState(false);

  if (!selectedOrder) return null;

  const isDelivered = selectedOrder.status && (selectedOrder.status.includes('✅') || selectedOrder.status.includes('🎉'));
  const isAlreadyReviewed = selectedOrder.isReviewed === true;

  return (
    <>
      {/* 🌟 CSS FOR REALISTIC TORN PAPER EFFECT */}
      <style>{`
        .receipt-paper {
          position: relative;
          background: #ffffff;
          border-radius: 12px 12px 0 0;
          width: 100%;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        /* The zig-zag bottom */
        .receipt-paper::after {
          content: "";
          position: absolute;
          bottom: -10px;
          left: 0;
          right: 0;
          height: 10px;
          background-image: 
            linear-gradient(135deg, #ffffff 50%, transparent 50%), 
            linear-gradient(225deg, #ffffff 50%, transparent 50%);
          background-position: top left, top left;
          background-size: 14px 14px;
          background-repeat: repeat-x;
        }
        .dashed-line {
          border-bottom: 2px dashed #cbd5e1;
          margin: 15px 0;
        }
      `}</style>

      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
        
        <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {/* 🧾 THE PHYSICAL RECEIPT */}
          <div className="receipt-paper">
            
            {/* INNER SCROLLABLE CONTENT (So it doesn't cut off the zig-zag!) */}
            <div style={{ padding: '30px 25px', overflowY: 'auto', maxHeight: '65vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              
              {/* PRINTER HEADER */}
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>CASH RECEIPT</span>
                <h3 style={{ margin: '8px 0 4px 0', color: '#0f172a', fontSize: '1.6rem', fontWeight: '900', textTransform: 'uppercase' }}>
                  {selectedOrder.shopId?.name || "LOCAL SHOP"}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>
                  {new Date(selectedOrder.createdAt).toLocaleDateString()} • {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>
                  Order #{selectedOrder._id?.slice(-6).toUpperCase()}
                </div>
              </div>

              <div className="dashed-line"></div>

              {/* UPLOADED PARCHI (If exists) */}
              {(selectedOrder.imageUrl || selectedOrder.parchiImage || selectedOrder.image) && (
                <div style={{ marginBottom: '15px', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: '800', marginBottom: '8px', letterSpacing: '1px' }}>ATTACHED LIST</span>
                  <img src={cdnImage(selectedOrder.imageUrl || selectedOrder.parchiImage || selectedOrder.image, 400)} alt="Uploaded Parchi" loading="lazy" decoding="async" style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '8px', objectFit: 'contain', border: '1px solid #e2e8f0', padding: '4px' }} />
                </div>
              )}

              {/* ITEMS TABLE */}
              <div style={{ marginBottom: '10px' }}>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', fontVariantNumeric: 'tabular-nums' }}>
                    <thead>
                      <tr style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '800' }}>
                        <td style={{ paddingBottom: '8px', textAlign: 'left' }}>ITEM</td>
                        <td style={{ paddingBottom: '8px', textAlign: 'center' }}>QTY</td>
                        <td style={{ paddingBottom: '8px', textAlign: 'right' }}>PRICE</td>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, i) => {
                        const price = item.price || item.sellingPrice || item.mrp || item.product?.sellingPrice || item.product?.mrp || 0;
                        return (
                          <tr key={i}>
                            <td style={{ padding: '6px 0', color: '#0f172a', fontWeight: '700', verticalAlign: 'top', width: '60%' }}>
                              {item.name}
                            </td>
                            <td style={{ padding: '6px 0', textAlign: 'center', color: '#475569', verticalAlign: 'top', fontWeight: '600' }}>
                              x{item.qty}
                            </td>
                            <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '800', color: '#0f172a', verticalAlign: 'top' }}>
                              ₹{price * item.qty}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ textAlign: 'center', padding: '10px', color: '#64748b', fontStyle: 'italic', fontSize: '0.85rem' }}>Items are being processed...</div>
                )}
              </div>

              <div className="dashed-line"></div>

              {/* TOTALS */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '15px 0' }}>
                <span style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: '900', textTransform: 'uppercase' }}>Total</span>
                <span style={{ fontSize: '1.3rem', color: '#0f172a', fontWeight: '900' }}>
                  {typeof selectedOrder.totalAmount === 'number' ? `₹${selectedOrder.totalAmount}` : selectedOrder.totalAmount}
                </span>
              </div>

              {/* PRINTER FOOTER */}
              <div style={{ textAlign: 'center', marginTop: '25px' }}>
                <span style={{ display: 'inline-block', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', backgroundColor: isDelivered ? '#ecfdf5' : '#f8fafc', color: isDelivered ? '#10b981' : '#64748b', border: '1px solid', borderColor: isDelivered ? '#d1fae5' : '#e2e8f0' }}>
                  STATUS: {selectedOrder.status}
                </span>
                <div style={{ marginTop: '15px', fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>
                  Thank you for shopping with us!
                </div>
              </div>

            </div>
          </div>

          {/* 🌟 FLOATING ACTIONS BELOW THE RECEIPT */}
          <div style={{ marginTop: '35px', width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
             
             {isDelivered && isAlreadyReviewed && (
               <button onClick={() => setIsViewReviewModalOpen(true)} style={{ width: '100%', padding: '14px', backgroundColor: '#fff', color: '#ef4444', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                 <span style={{ fontSize: '1.2rem' }}>⭐</span> View Your Rating
               </button>
             )}

             {/* Centered Close Button */}
             <button onClick={() => setSelectedOrder(null)} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '30px', padding: '10px 24px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', backdropFilter: 'blur(5px)' }}>
               ✖ Close Receipt
             </button>

          </div>

        </div>
      </div>

      <ViewReviewModal 
        isOpen={isViewReviewModalOpen} 
        onClose={() => setIsViewReviewModalOpen(false)} 
        order={selectedOrder} 
      />
    </>
  );
        }

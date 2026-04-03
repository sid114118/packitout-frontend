import React, { useState } from 'react';
// Assuming OrderReviewModal is in the same file or imported:
// import OrderReviewModal from './OrderReviewModal.jsx';

export default function ReceiptModal({ selectedOrder, setSelectedOrder, onSubmitReviews }) {
  // We just need a simple boolean to open the new master review modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  if (!selectedOrder) return null;

  // Check if order is complete to allow reviews
  const isDelivered = selectedOrder.status && (selectedOrder.status.includes('✅') || selectedOrder.status.includes('🎉'));

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

             {/* 🌟 ONE UNIFIED REVIEW BUTTON */}
             {isDelivered && (
               <button 
                 onClick={() => setIsReviewModalOpen(true)}
                 style={{ width: '100%', padding: '14px', backgroundColor: '#fff', color: '#111827', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}
               >
                 <span style={{ color: '#facc15', fontSize: '1.3rem' }}>★</span> Rate your Order
               </button>
             )}
          </div>

        </div>
      </div>

      {/* 🌟 THE UNIFIED ORDER REVIEW MODAL */}
      <OrderReviewModal 
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        order={selectedOrder}
        onSubmitReviews={onSubmitReviews}
      />
    </>
  );
}

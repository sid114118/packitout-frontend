import React from 'react';

export default function ReceiptModal({ selectedOrder, setSelectedOrder }) {
  
  // 🚨 THE DETECTIVE LOG: This will print the order data to your browser!
  console.log("🔍 THE SELECTED ORDER DATA IS:", selectedOrder);

  // If there is no order selected, don't show the modal at all
  if (!selectedOrder) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
      
      <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '600px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '25px', paddingBottom: '40px', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px dashed #e2e8f0', paddingBottom: '15px', marginBottom: '15px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold', letterSpacing: '1px' }}>DIGITAL RECEIPT</span>
            <h3 style={{ margin: '5px 0 0 0', color: '#0f172a', fontSize: '1.4rem' }}>{selectedOrder.shopId?.name || "Local Shop"}</h3>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '5px' }}>{new Date(selectedOrder.createdAt).toLocaleString()}</div>
          </div>
          <button onClick={() => setSelectedOrder(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '35px', height: '35px', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#64748b' }}>✖</button>
        </div>

        {/* 📸 NEW: YOUR ORIGINAL PARCHI IMAGE */}
        {(selectedOrder.imageUrl || selectedOrder.parchiImage || selectedOrder.image) && (
          <div style={{ marginBottom: '15px', textAlign: 'center', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '0.5px' }}>YOUR UPLOADED LIST</span>
            <img 
              src={selectedOrder.imageUrl || selectedOrder.parchiImage || selectedOrder.image} 
              alt="Uploaded Parchi" 
              style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '8px', objectFit: 'contain', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }} 
            />
          </div>
        )}

        {/* Modal Items List */}
        <div style={{ maxHeight: '30vh', overflowY: 'auto', marginBottom: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
            <tbody>
              {selectedOrder.items?.map((item, i) => {
                // The super-charged price checker!
                const price = item.price || item.sellingPrice || item.mrp || item.product?.sellingPrice || item.product?.mrp || 0;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '12px 0', color: '#334155', fontWeight: '500' }}>{item.name}</td>
                    <td style={{ padding: '12px 0', textAlign: 'center', color: '#64748b' }}>x{item.qty}</td>
                    <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>₹{price * item.qty}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Total Banner */}
        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.1rem', color: '#475569', fontWeight: 'bold' }}>Total Bill</span>
          <span style={{ fontSize: '1.4rem', color: '#10b981', fontWeight: '900' }}>₹{selectedOrder.totalAmount}</span>
        </div>
        
        {/* Status Badge */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
           <span style={{ padding: '8px 15px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold', backgroundColor: selectedOrder.status === 'Delivered ✅' || selectedOrder.status === 'Done 🎉' ? '#d1fae5' : '#e0f2fe', color: selectedOrder.status === 'Delivered ✅' || selectedOrder.status === 'Done 🎉' ? '#059669' : '#0369a1' }}>
             Order Status: {selectedOrder.status}
           </span>
        </div>

      </div>
    </div>
  );
}

import React from 'react';

export default function OrdersTab({ orders, updateOrderStatus }) {
  return (
    <div> 
      <h3 style={{ marginTop: 0, color: '#0f172a' }}>Live Orders</h3> 
      {orders.length === 0 ? ( 
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', backgroundColor: 'white', borderRadius: '12px' }}>
          No active orders right now.
        </div> 
      ) : orders.map(order => {
        
        // 🛠️ THE FIX: Check the exact method so old test orders don't glitch!
        const isCOD = order.paymentMethod === "COD";

        return (
          <div key={order._id} style={cardStyle}> 
            
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '10px' }}> 
              <strong style={{ color: '#334155' }}>Order #{order._id.substring(order._id.length - 6).toUpperCase()}</strong> 
              <span style={{ 
                color: order.status === "Delivered ✅" ? '#10b981' : (order.status === "Packed 🛍️" ? '#3b82f6' : '#f59e0b'), 
                fontWeight: 'bold', 
                fontSize: '0.9rem',
                backgroundColor: order.status === "Delivered ✅" ? '#d1fae5' : '#fef3c7',
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                {order.status}
              </span> 
            </div> 

            {/* Customer Details Section */}
            <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 'bold', marginBottom: '4px' }}>
                👤 {order.userId?.name || 'Unknown Customer'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>
                📞 <a href={`tel:${order.userId?.phone}`} style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold' }}>{order.userId?.phone || 'No Phone'}</a>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>
                📍 {order.userId?.address || 'No Delivery Address Provided'}
              </div>
            </div>
            
            {/* Items Area */}
            <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '15px' }}>
              <div style={{ fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Items to Pack:</div>
              {order.items?.map((item, i) => (
                <div key={i} style={{ paddingLeft: '5px', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span><span style={{ fontWeight: 'bold', color: '#0f172a' }}>{item.qty}x</span> {item.name}</span>
                  <span style={{ fontSize: '0.8rem' }}>₹{item.price}</span>
                </div>
              ))}
            </div>

            {/* 💳 NEW: BULLETPROOF PAYMENT TRACKING BLOCK 💳 */}
            <div style={{ 
              marginTop: '10px', 
              marginBottom: '15px', 
              padding: '12px', 
              borderRadius: '8px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              backgroundColor: !isCOD ? '#f0fdf4' : '#fff7ed', 
              border: `1px solid ${!isCOD ? '#bbf7d0' : '#fed7aa'}` 
            }}>
              <div>
                <div style={{ fontWeight: '900', color: '#0f172a', fontSize: '1.1rem' }}>
                  Total: ₹{order.totalAmount}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', fontWeight: '600' }}>
                  Method: {order.paymentMethod || 'UPI'}
                </div>
              </div>
              
              <div style={{ 
                fontWeight: '900', 
                fontSize: '0.85rem', 
                padding: '6px 12px', 
                borderRadius: '6px', 
                backgroundColor: !isCOD ? '#22c55e' : '#ea580c', 
                color: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {!isCOD ? "🟢 PAID ONLINE" : `🟠 COLLECT CASH`}
              </div>
            </div>
            
            {/* Action Buttons */}
            {order.status !== "Delivered ✅" && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => updateOrderStatus(order._id, "Packing 📦")} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', backgroundColor: order.status === "Packing 📦" ? '#f59e0b' : '#fef3c7', color: order.status === "Packing 📦" ? 'white' : '#d97706', transition: '0.2s' }}>
                  Packing
                </button>
                <button onClick={() => updateOrderStatus(order._id, "Packed 🛍️")} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', backgroundColor: order.status === "Packed 🛍️" ? '#3b82f6' : '#e0f2fe', color: order.status === "Packed 🛍️" ? 'white' : '#0369a1', transition: '0.2s' }}>
                  Packed
                </button>
                <button onClick={() => updateOrderStatus(order._id, "Delivered ✅")} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', backgroundColor: '#d1fae5', color: '#059669', transition: '0.2s' }}>
                  Delivered
                </button>
              </div>
            )}
          </div> 
        );
      })}
    </div>
  );
}

const cardStyle = { backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', marginBottom: '15px' };

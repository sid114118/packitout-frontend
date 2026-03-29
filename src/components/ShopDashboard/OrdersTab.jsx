import React from 'react';

export default function OrdersTab({ orders, updateOrderStatus }) {
  return (
    <div> 
      <h3 style={{ marginTop: 0, color: '#0f172a' }}>Live Orders</h3> 
      {orders.length === 0 ? ( 
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', backgroundColor: 'white', borderRadius: '12px' }}>
          No active orders right now.
        </div> 
      ) : orders.map(order => ( 
        <div key={order._id} style={cardStyle}> 
          
          {/* Header Area */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '10px' }}> 
            <strong style={{ color: '#334155' }}>Order #{order._id.substring(order._id.length - 6).toUpperCase()}</strong> 
            <span style={{ 
              color: order.status === "Delivered ✅" ? '#10b981' : (order.status === "Packed 🛍️" ? '#3b82f6' : '#f59e0b'), 
              fontWeight: 'bold', 
              fontSize: '0.9rem' 
            }}>
              {order.status}
            </span> 
          </div> 

          {/* 👇 NEW: CUSTOMER DETAILS SECTION 👇 */}
          <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 'bold', marginBottom: '4px' }}>
              👤 {order.userId?.name || 'Unknown Customer'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>
              📞 <a href={`tel:${order.userId?.phone}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>{order.userId?.phone || 'No Phone'}</a>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>
              📍 {order.userId?.address || 'No Delivery Address Provided'}
            </div>
          </div>
          
          {/* Items Area */}
          <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '15px' }}>
            <div style={{ fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Items to Pack:</div>
            {order.items?.map((item, i) => (
              <div key={i} style={{ paddingLeft: '5px' }}>{item.qty}x {item.name}</div>
            ))}
            <div style={{ fontWeight: '900', marginTop: '10px', color: '#0f172a', fontSize: '1rem', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
              Total: ₹{order.totalAmount}
            </div>
          </div>
          
          {/* Action Buttons */}
          {order.status !== "Delivered ✅" && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => updateOrderStatus(order._id, "Packing 📦")} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', backgroundColor: order.status === "Packing 📦" ? '#f59e0b' : '#fef3c7', color: order.status === "Packing 📦" ? 'white' : '#d97706' }}>
                Packing
              </button>
              <button onClick={() => updateOrderStatus(order._id, "Packed 🛍️")} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', backgroundColor: order.status === "Packed 🛍️" ? '#3b82f6' : '#e0f2fe', color: order.status === "Packed 🛍️" ? 'white' : '#0369a1' }}>
                Packed
              </button>
              <button onClick={() => updateOrderStatus(order._id, "Delivered ✅")} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', backgroundColor: '#d1fae5', color: '#059669' }}>
                Done
              </button>
            </div>
          )}
        </div> 
      ))}
    </div>
  );
}

const cardStyle = { backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', marginBottom: '15px' };

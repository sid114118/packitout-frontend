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
          
          {/* Items Area */}
          <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '15px' }}>
            {order.items?.map((item, i) => (
              <div key={i}>{item.qty}x {item.name}</div>
            ))}
            <div style={{ fontWeight: 'bold', marginTop: '10px', color: '#0f172a' }}>Total: ₹{order.totalAmount}</div>
          </div>
          
          {/* 🚀 UPGRADED ACTION BUTTONS */}
          {order.status !== "Delivered ✅" && (
            <div style={{ display: 'flex', gap: '8px' }}>
              
              {/* Packing Button */}
              <button 
                onClick={() => updateOrderStatus(order._id, "Packing 📦")} 
                style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem',
                  backgroundColor: order.status === "Packing 📦" ? '#f59e0b' : '#fef3c7', 
                  color: order.status === "Packing 📦" ? 'white' : '#d97706' 
                }}
              >
                Packing
              </button>

              {/* NEW: Packed Button */}
              <button 
                onClick={() => updateOrderStatus(order._id, "Packed 🛍️")} 
                style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem',
                  backgroundColor: order.status === "Packed 🛍️" ? '#3b82f6' : '#e0f2fe', 
                  color: order.status === "Packed 🛍️" ? 'white' : '#0369a1' 
                }}
              >
                Packed
              </button>

              {/* Delivered Button */}
              <button 
                onClick={() => updateOrderStatus(order._id, "Delivered ✅")} 
                style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem',
                  backgroundColor: '#d1fae5', 
                  color: '#059669' 
                }}
              >
                Done
              </button>
              
            </div>
          )}
        </div> 
      ))}
    </div>
  );
}

// Keeping the styling self-contained!
const cardStyle = { backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', marginBottom: '15px' };

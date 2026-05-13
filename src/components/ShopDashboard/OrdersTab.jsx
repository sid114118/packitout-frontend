import React, { useState } from 'react';

export default function OrdersTab({ orders, updateOrderStatus }) {
  const [showPastOrders, setShowPastOrders] = useState(false);

  // Split orders into Active and Past based on their status
  const activeOrders = orders.filter(o => !o.status?.includes('✅') && !o.status?.includes('❌'));
  const pastOrders = orders.filter(o => o.status?.includes('✅') || o.status?.includes('❌'));

  const OrderCard = ({ order, isActive }) => {
    // Safely extract customer info
    const customerName = order.userId?.name || "Customer";
    const customerPhone = order.userId?.phone || "No phone";
    const customerAddress = order.userId?.address || "No address provided";

    // Safely determine payment status
    const isPaid = order.paymentStatus === 'Paid' || order.paymentStatus === 'Success';

    return (
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: isActive ? '2px solid #10b981' : '1px solid #e2e8f0', marginBottom: '15px' }}>
        
        {/* Header: Order ID & Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>
              ORDER #{order._id.slice(-5).toUpperCase()}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
              {new Date(order.createdAt).toLocaleString()}
            </div>
          </div>
          <div style={{ backgroundColor: isActive ? '#ecfdf5' : '#f1f5f9', color: isActive ? '#059669' : '#475569', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem' }}>
            {order.status}
          </div>
        </div>

        {/* Customer Details */}
        <div style={{ marginBottom: '15px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px' }}>
          <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>👤 {customerName}</div>
          <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '4px' }}>📞 <a href={`tel:${customerPhone}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>{customerPhone}</a></div>
          <div style={{ fontSize: '0.85rem', color: '#475569' }}>📍 {customerAddress}</div>
        </div>

        {/* Items List */}
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#334155' }}>Items:</h4>
          {order.items && order.items.length > 0 ? (
            order.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569', marginBottom: '4px' }}>
                <span>{item.qty}x {item.name}</span>
                <span style={{ fontWeight: '600' }}>₹{(item.price || item.sellingPrice || item.mrp || 0) * item.qty}</span>
              </div>
            ))
          ) : (
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>Custom Parchi Order</div>
          )}
          
          {/* Parchi Image Link */}
          {order.imageUrl && (
            <a href={order.imageUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '8px', fontSize: '0.85rem', color: '#3b82f6', fontWeight: '600', textDecoration: 'none' }}>
              🖼️ View Original Parchi Image
            </a>
          )}
        </div>

        {/* Total & Payment Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '15px', paddingBottom: isActive ? '15px' : '0' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#0f172a' }}>
            ₹{order.totalAmount}
          </div>
          
          {/* 💳 PAYMENT BADGE */}
          <div style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '800', backgroundColor: isPaid ? '#d1fae5' : '#ffedd5', color: isPaid ? '#059669' : '#c2410c', border: `1px solid ${isPaid ? '#a7f3d0' : '#fed7aa'}` }}>
            {isPaid ? '💳 Paid Online' : '✋ To Collect'}
          </div>
        </div>

        {/* 🚀 EXPLICIT ACTION BUTTONS (Only for Active Orders) */}
        {isActive && (() => {
          const isPending = order.status === 'Pending';
          return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderTop: '1px dashed #e2e8f0', paddingTop: '15px' }}>

              {/* Pending orders only show Accept + Cancel until the shop confirms.
                  Once accepted, the rest of the workflow appears. */}
              {isPending ? (
                <>
                  <button
                    onClick={() => updateOrderStatus(order._id, 'Accepted 👨‍🍳')}
                    style={{ flex: '1 1 100%', padding: '14px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', fontSize: '1.05rem', boxShadow: '0 6px 16px rgba(22, 163, 74, 0.32)' }}
                  >
                    👨‍🍳 Accept Order
                  </button>

                  <button
                    onClick={() => updateOrderStatus(order._id, 'Cancelled ❌')}
                    style={{ flex: '1 1 100%', padding: '10px', backgroundColor: 'transparent', color: '#ef4444', border: '1px dashed #fca5a5', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', marginTop: '4px' }}
                  >
                    ❌ Cancel Order
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => updateOrderStatus(order._id, 'Packing 📦')}
                    style={{ flex: '1 1 45%', padding: '10px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
                  >
                    📦 Packing
                  </button>

                  <button
                    onClick={() => updateOrderStatus(order._id, 'Ready to Collect 🛍️')}
                    style={{ flex: '1 1 45%', padding: '10px', backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
                  >
                    🛍️ Ready
                  </button>

                  <button
                    onClick={() => updateOrderStatus(order._id, 'Delivered ✅')}
                    style={{ flex: '1 1 100%', padding: '12px', backgroundColor: '#0c831f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 10px rgba(12, 131, 31, 0.2)', marginTop: '4px' }}
                  >
                    ✅ Mark as Delivered
                  </button>

                  <button
                    onClick={() => updateOrderStatus(order._id, 'Cancelled ❌')}
                    style={{ flex: '1 1 100%', padding: '10px', backgroundColor: 'transparent', color: '#ef4444', border: '1px dashed #fca5a5', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', marginTop: '4px' }}
                  >
                    ❌ Cancel Order
                  </button>
                </>
              )}
            </div>
          );
        })()}

      </div>
    );
  };

  return (
    <div>
      {/* 🚀 ACTIVE ORDERS */}
      <h3 style={{ color: '#0f172a', fontSize: '1.2rem', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
        Live Orders <span>{activeOrders.length}</span>
      </h3>
      
      {activeOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1', color: '#94a3b8', marginBottom: '30px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>☕</div>
          <div style={{ fontWeight: 'bold', color: '#475569' }}>No active orders</div>
          <div style={{ fontSize: '0.85rem' }}>Waiting for customers to place an order...</div>
        </div>
      ) : (
        <div style={{ marginBottom: '30px' }}>
          {activeOrders.map(order => <OrderCard key={order._id} order={order} isActive={true} />)}
        </div>
      )}

      {/* 📜 PAST ORDERS (COLLAPSIBLE) */}
      <div 
        onClick={() => setShowPastOrders(!showPastOrders)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: 'white', padding: '15px 20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0', marginBottom: '15px' }}
      >
        <h3 style={{ color: '#334155', fontSize: '1.1rem', margin: 0 }}>📜 Past Orders ({pastOrders.length})</h3>
        <span style={{ fontSize: '1.2rem', transform: showPastOrders ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
          🔽
        </span>
      </div>

      {showPastOrders && (
        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          {pastOrders.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No completed orders yet.</div>
          ) : (
            pastOrders.map(order => <OrderCard key={order._id} order={order} isActive={false} />)
          )}
        </div>
      )}
    </div>
  );
          }

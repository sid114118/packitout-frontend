import React, { useState } from 'react';

export default function OrdersTab({ orders, updateOrderStatus }) {
  const [showPastOrders, setShowPastOrders] = useState(false);

  // Split orders into Active and Past based on their status
  const activeOrders = orders.filter(o => !o.status?.includes('✅') && !o.status?.includes('❌'));
  const pastOrders = orders.filter(o => o.status?.includes('✅') || o.status?.includes('❌'));

  // 🛡️ THE ULTIMATE FIX: Force lowercase to prevent exact-match bugs
  const handleNextStep = (orderId, currentStatus) => {
    // Convert to lowercase so "Delivery", "delivery", and "DELIVERY " all match perfectly
    const statusText = (currentStatus || "").toLowerCase();
    let nextStatus = 'Pending'; 

    // Super forgiving checks
    if (statusText.includes('pending')) {
      nextStatus = 'Preparing 🍳';
    } else if (statusText.includes('preparing')) {
      nextStatus = 'Out for Delivery 🛵';
    } else if (statusText.includes('delivery') || statusText.includes('out')) {
      nextStatus = 'Delivered ✅';
    } else {
      nextStatus = 'Delivered ✅'; // Failsafe
    }

    // Log to console so we can debug if anything ever goes wrong
    console.log(`Transitioning Order: [${currentStatus}] ➡️ [${nextStatus}]`);
    
    updateOrderStatus(orderId, nextStatus);
  };

  const OrderCard = ({ order, isActive }) => {
    // Safely extract customer info
    const customerName = order.userId?.name || "Customer";
    const customerPhone = order.userId?.phone || "No phone";
    const customerAddress = order.userId?.address || "No address provided";

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

        {/* Total & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0f172a' }}>
            ₹{order.totalAmount}
          </div>
          
          {isActive && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => updateOrderStatus(order._id, 'Cancelled ❌')}
                style={{ padding: '8px 12px', backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleNextStep(order._id, order.status)}
                style={{ padding: '8px 16px', backgroundColor: '#0c831f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(12, 131, 31, 0.2)' }}
              >
                Update Status ➡️
              </button>
            </div>
          )}
        </div>

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

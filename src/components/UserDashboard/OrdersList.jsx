import React from 'react';

export default function OrdersList({ activeOrders, pastOrders, loading, setSelectedOrder }) {
  return (
    <div>
      {/* 🚀 LIVE ORDER TRACKER */}
      {activeOrders.length > 0 && (
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#334155', fontSize: '1.1rem', marginBottom: '10px' }}>Live Parchi & Orders ⏳</h3>
          {activeOrders.map((order, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedOrder(order)} 
              style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '2px solid #10b981', position: 'relative', overflow: 'hidden', cursor: 'pointer', marginBottom: '15px' }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #10b981, #34d399)' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>ORDER #{order._id.slice(-5).toUpperCase()}</span>
                  <h4 style={{ margin: '5px 0 0 0', color: '#0f172a', fontSize: '1.2rem' }}>{order.shopId?.name || "Local Shop"}</h4>
                </div>
                <div style={{ background: '#ecfdf5', color: '#059669', padding: '8px 12px', borderRadius: '8px', fontWeight: '900', fontSize: '0.9rem' }}>{order.status}</div>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0, display: 'flex', justifyContent: 'space-between' }}>
                <span><strong>{order.items?.length || 0} items</strong> • Total: ₹{order.totalAmount || 0}</span>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>View Bill ➡️</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 📜 PAST ORDERS */}
      <h3 style={{ color: '#334155', fontSize: '1.1rem', marginBottom: '10px' }}>Past Orders</h3>
      {loading ? ( <p style={{ color: '#64748b' }}>Loading history...</p> ) : pastOrders.length === 0 ? (
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center', color: '#94a3b8', border: '1px dashed #cbd5e1' }}>No past orders found.</div>
      ) : (
        pastOrders.map((order, i) => (
          <div 
            key={i} 
            onClick={() => setSelectedOrder(order)} 
            style={{ background: 'white', padding: '15px', borderRadius: '12px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: '1px solid transparent', transition: '0.2s' }}
          >
            <div>
              <strong style={{ color: '#0f172a' }}>{order.shopId?.name || "Local Shop"}</strong>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '3px' }}>{new Date(order.createdAt).toLocaleDateString()} • ₹{order.totalAmount || 0}</div>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '1.2rem' }}>📄</div>
          </div>
        ))
      )}
    </div>
  );
}

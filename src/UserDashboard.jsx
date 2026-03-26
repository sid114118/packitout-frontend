import React, { useState, useEffect } from 'react';

export default function UserDashboard({ user, onExit, onLogout }) {
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🛰️ FETCH REAL ORDERS FOR THIS USER
  useEffect(() => {
    fetch("https://darkslategrey-snail-415133.hostingersite.com/orders")
      .then(res => res.json())
      .then(data => {
        // Filter only orders that belong to THIS user
        const filtered = data.filter(order => order.userId?._id === user._id);
        setMyOrders(filtered);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, [user._id]);

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '30px' }}>
      
      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #ff6b6b, #ff4757)', padding: '20px', color: 'white', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0 }}>👤 {user.name}</h2>
          <p style={{ margin: 0, opacity: 0.9 }}>{user.phone} • {user.pincode}</p>
        </div>
        <button onClick={onExit} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold' }}>Shop</button>
      </div>

      <div style={{ padding: '20px' }}>
        <button onClick={onLogout} style={{ width: '100%', padding: '12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '12px', fontWeight: 'bold', marginBottom: '20px' }}>Log Out</button>

        <h3 style={{ color: '#2f3640' }}>📦 My Parchis (Orders)</h3>

        {loading ? (
          <p>Loading your orders...</p>
        ) : myOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7f8fa6', background: 'white', borderRadius: '15px' }}>
            <p>No orders yet. Start shopping!</p>
          </div>
        ) : (
          myOrders.map((order, index) => (
            <div key={index} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '15px', marginBottom: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', borderLeft: '5px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold' }}>Order #{order._id.slice(-5).toUpperCase()}</span>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>{order.status}</span>
              </div>
              
              {/* SHOW WHICH SHOP IT WENT TO */}
              <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#7f8fa6' }}>
                🏪 Shop: <strong>{order.shopId?.name || "Local Mart"}</strong>
              </p>

              <div style={{ borderTop: '1px dashed #eee', paddingTop: '10px' }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{ fontSize: '0.85rem', color: '#2f3640' }}>
                    {item.emoji} {item.name} x {item.qty}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '10px', fontWeight: 'bold', textAlign: 'right' }}>
                Total: ₹{order.totalAmount}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

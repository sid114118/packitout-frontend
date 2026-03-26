import React, { useState, useEffect } from 'react';

export default function ShopDashboard({ user, onExit }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 📡 FETCH LIVE ORDERS FOR THIS SPECIFIC SHOP
  const fetchOrders = () => {
    fetch("https://darkslategrey-snail-415133.hostingersite.com/orders")
      .then(res => res.json())
      .then(data => {
        // Only show orders meant for THIS shop ID
        const shopOrders = data.filter(order => order.shopId?._id === user._id);
        setOrders(shopOrders);
        setLoading(false);
      })
      .catch(err => console.log("Error fetching orders"));
  };

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 30 seconds to check for new Parchis!
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [user._id]);

  return (
    <div style={{ backgroundColor: '#1e272e', minHeight: '100vh', fontFamily: 'sans-serif', color: 'white' }}>
      
      {/* 🟢 SHOP HEADER */}
      <div style={{ backgroundColor: '#2f3640', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #05c46b' }}>
        <div>
          <h2 style={{ margin: 0, color: '#05c46b' }}>🏪 {user.name}</h2>
          <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>Pincode: {user.pincode} | Online ✅</p>
        </div>
        <button onClick={onExit} style={{ backgroundColor: '#ff3f34', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
      </div>

      <div style={{ padding: '20px' }}>
        <h3 style={{ marginBottom: '20px' }}>📥 Incoming Parchis (Orders)</h3>

        {loading ? (
          <p>Checking for new orders...</p>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#2f3640', borderRadius: '15px' }}>
            <p style={{ fontSize: '1.2rem' }}>No orders yet. Sit tight! ☕</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {orders.map((order, index) => (
              <div key={index} style={{ backgroundColor: 'white', color: '#2f3640', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                
                {/* CUSTOMER INFO */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>👤 {order.userId?.name || "Guest"}</span>
                    <br />
                    <span style={{ fontSize: '0.85rem', color: '#7f8fa6' }}>📞 {order.userId?.phone}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ backgroundColor: '#f1f2f6', padding: '5px 10px', borderRadius: '5px', fontWeight: 'bold', fontSize: '0.8rem' }}>{new Date(order.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* ITEMS LIST */}
                <div style={{ marginBottom: '15px' }}>
                  {order.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                      <span>{item.emoji} {item.name} <strong>x {item.qty}</strong></span>
                      <span>₹{item.mrp * item.qty}</span>
                    </div>
                  ))}
                </div>

                {/* TOTAL & ACTION */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #f1f2f6', paddingTop: '15px' }}>
                  <div>
                    <span style={{ fontSize: '0.9rem', color: '#7f8fa6' }}>Total Amount</span>
                    <br />
                    <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1e272e' }}>₹{order.totalAmount}</span>
                  </div>
                  <button style={{ backgroundColor: '#05c46b', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
                    Accept & Pack 📦
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

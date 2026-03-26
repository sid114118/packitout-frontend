import React, { useState, useEffect } from 'react';

export default function ShopDashboard({ user, onExit }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  if (!user) {
    return <div style={{ padding: '50px', textAlign: 'center', color: 'white', background: '#1e272e', minHeight: '100vh' }}>⏳ Loading Shop Profile...</div>;
  }

  const fetchOrders = () => {
    fetch("https://darkslategrey-snail-415133.hostingersite.com/orders")
      .then(res => res.json())
      .then(data => {
        const shopOrders = data.filter(order => order.shopId?._id === user._id || order.shopId === user._id);
        setOrders(shopOrders);
        setLoading(false);
      })
      .catch(err => {
        console.error("Order Fetch Error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Auto-refresh every 10 seconds
    return () => clearInterval(interval);
  }, [user._id]);

  // 🚀 THE MAGIC FUNCTION: Changes order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`https://darkslategrey-snail-415133.hostingersite.com/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        // Instantly update the screen without needing to refresh the page!
        setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (err) {
      alert("❌ Error updating order status.");
    }
  };

  return (
    <div style={{ backgroundColor: '#1e272e', minHeight: '100vh', fontFamily: 'sans-serif', color: 'white' }}>
      
      {/* HEADER */}
      <div style={{ backgroundColor: '#2f3640', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #05c46b' }}>
        <div>
          <h2 style={{ margin: 0, color: '#05c46b' }}>🏪 {user.name}</h2>
          <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>Pincode: {user.pincode} | Status: Live ✅</p>
        </div>
        <button onClick={onExit} style={{ backgroundColor: '#ff3f34', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
      </div>

      <div style={{ padding: '20px' }}>
        <h3 style={{ marginBottom: '20px' }}>📥 Active Parchis</h3>

        {loading ? (
          <p>📡 Connecting to server...</p>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#2f3640', borderRadius: '15px', border: '1px dashed #7f8fa6' }}>
            <p style={{ fontSize: '1.1rem', color: '#7f8fa6' }}>No active orders yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {orders.map((order, index) => (
              <div key={index} style={{ backgroundColor: 'white', color: '#2f3640', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', borderLeft: order.status === "Pending" ? '5px solid #ff9f43' : order.status === "Packing 📦" ? '5px solid #0abde3' : '5px solid #10b981' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>👤 {order.userId?.name || "Customer"}</span>
                    <br />
                    <span style={{ fontSize: '0.85rem', color: '#7f8fa6' }}>📞 {order.userId?.phone || "N/A"}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ backgroundColor: '#f1f2f6', padding: '5px 10px', borderRadius: '5px', fontWeight: 'bold', fontSize: '0.8rem', color: order.status === "Pending" ? '#ff9f43' : '#2f3640' }}>
                      {order.status}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  {order.items?.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '0.95rem' }}>
                      <span>{item.emoji} {item.name} x{item.qty}</span>
                      <span style={{ fontWeight: 'bold' }}>₹{item.mrp * item.qty}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #f1f2f6', paddingTop: '15px' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#7f8fa6' }}>Collect Amount</span>
                    <br />
                    <span style={{ fontSize: '1.3rem', fontWeight: '900', color: '#1e272e' }}>₹{order.totalAmount}</span>
                  </div>
                  
                  {/* 👇 THE DYNAMIC ACTION BUTTONS */}
                  {order.status === "Pending" ? (
                    <button onClick={() => updateOrderStatus(order._id, "Packing 📦")} style={{ backgroundColor: '#ff9f43', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                      Accept & Pack 📦
                    </button>
                  ) : order.status === "Packing 📦" ? (
                    <button onClick={() => updateOrderStatus(order._id, "Delivered ✅")} style={{ backgroundColor: '#05c46b', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                      Mark Delivered ✅
                    </button>
                  ) : (
                    <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem' }}>Done 🎉</span>
                  )}

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

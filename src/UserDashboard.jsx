import React, { useState, useEffect } from 'react';

export default function UserDashboard({ user, onExit, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 🪙 PackIt Coins State
  const [coinBalance, setCoinBalance] = useState(user?.coins || 0);

  // 🏠 Address Book State
  const [addresses, setAddresses] = useState([
    { id: 1, label: "🏠 Home", detail: `Block A, Near Main Gate, ${user?.pincode}` }
  ]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState("");

  useEffect(() => {
    // 1. Fetch User's Orders
    fetch("https://darkslategrey-snail-415133.hostingersite.com/orders")
      .then(res => res.json())
      .then(data => {
        const myOrders = data.filter(order => order.userId?._id === user._id);
        setOrders(myOrders);
        setLoading(false);
      })
      .catch(err => setLoading(false));

    // 2. Fetch Fresh Coin Balance & Referral Code
    fetch(`https://darkslategrey-snail-415133.hostingersite.com/users/${user._id}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.coins !== undefined) setCoinBalance(data.coins);
          
          // Update local storage so the rest of the app knows the new balance and referral code
          const updatedUser = { ...user, coins: data.coins, referralCode: data.referralCode };
          localStorage.setItem("packitout_user", JSON.stringify(updatedUser));
        }
      })
      .catch(err => console.log("Failed to fetch fresh profile data"));
  }, [user._id, user]);

  const activeOrders = orders.filter(o => o.status !== "Delivered ✅" && o.status !== "Done 🎉");
  const pastOrders = orders.filter(o => o.status === "Delivered ✅" || o.status === "Done 🎉");

  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (newAddress.trim() !== "") {
      setAddresses([...addresses, { id: Date.now(), label: "📍 Saved", detail: newAddress }]);
      setNewAddress("");
      setShowAddressForm(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#f0f4f8', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '40px' }}>
      
      {/* 🟢 PREMIUM HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '30px 20px 50px 20px', color: 'white', borderBottomLeftRadius: '25px', borderBottomRightRadius: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '1.8rem' }}>{user?.name || "Customer"}</h2>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>📞 {user?.phone} | 📍 {user?.pincode}</p>
        </div>
        <button onClick={onExit} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', backdropFilter: 'blur(5px)' }}>
          Back to Shop
        </button>
      </div>

      <div style={{ padding: '0 20px 20px 20px', maxWidth: '600px', margin: '0 auto', marginTop: '-30px' }}>

        {/* 🪙 THE LOYALTY COIN BANNER */}
        <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', padding: '20px', borderRadius: '16px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 20px rgba(245, 158, 11, 0.3)', marginBottom: '15px' }}>
          <div>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>PackIt Coins</span>
            <h3 style={{ margin: '5px 0 0 0', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🪙 {coinBalance}
            </h3>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.8rem', opacity: 0.9 }}>
            Earn 1 coin for<br/>every ₹10 spent!
          </div>
        </div>

        {/* 📢 REFER & EARN BANNER (NEW) */}
        <div style={{ background: 'white', padding: '15px 20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', marginBottom: '25px', border: '1px solid #e2e8f0' }}>
          <div>
            <strong style={{ display: 'block', color: '#0f172a', fontSize: '1rem' }}>Refer & Earn 50 🪙</strong>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Give 50 coins, get 50!</span>
          </div>
          <div style={{ background: '#f1f5f9', padding: '8px 15px', borderRadius: '8px', border: '1px dashed #94a3b8', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: '900', color: '#334155', letterSpacing: '1px' }}>{user?.referralCode || "GET CODE"}</span>
            <button 
              onClick={() => {
                if(user?.referralCode) {
                  navigator.clipboard.writeText(user.referralCode);
                  alert("Referral Code Copied! Share it with friends.");
                } else {
                  alert("Code not ready. Try logging out and back in!");
                }
              }} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
              title="Copy Code"
            >
              📋
            </button>
          </div>
        </div>

        {/* 🚀 LIVE ORDER TRACKER */}
        {activeOrders.length > 0 && (
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ color: '#334155', fontSize: '1.1rem', marginBottom: '10px' }}>Live Parchi ⏳</h3>
            {activeOrders.map((order, i) => (
              <div key={i} style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '2px solid #10b981', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #10b981, #34d399)' }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>ORDER #{order._id.slice(-5).toUpperCase()}</span>
                    <h4 style={{ margin: '5px 0 0 0', color: '#0f172a', fontSize: '1.2rem' }}>{order.shopId?.name || "Local Shop"}</h4>
                  </div>
                  <div style={{ background: '#ecfdf5', color: '#059669', padding: '8px 12px', borderRadius: '8px', fontWeight: '900', fontSize: '0.9rem' }}>
                    {order.status}
                  </div>
                </div>
                
                <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0 }}>
                  <strong>{order.items.length} items</strong> • Total: ₹{order.totalAmount}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* 🏠 SAVED ADDRESSES */}
        <div style={{ marginBottom: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ color: '#334155', fontSize: '1.1rem', margin: 0 }}>My Addresses</h3>
            <button onClick={() => setShowAddressForm(!showAddressForm)} style={{ color: '#10b981', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>+ Add New</button>
          </div>

          {showAddressForm && (
            <form onSubmit={handleSaveAddress} style={{ background: 'white', padding: '15px', borderRadius: '12px', marginBottom: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
              <input 
                type="text" 
                placeholder="Flat, House no., Building, Landmark" 
                value={newAddress} 
                onChange={e => setNewAddress(e.target.value)} 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px', boxSizing: 'border-box' }}
                required 
              />
              <button type="submit" style={{ width: '100%', padding: '10px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Save Address</button>
            </form>
          )}

          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
            {addresses.map((addr) => (
              <div key={addr.id} style={{ minWidth: '200px', background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: '5px' }}>{addr.label}</strong>
                <span style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: '1.4' }}>{addr.detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 📜 PAST ORDERS */}
        <h3 style={{ color: '#334155', fontSize: '1.1rem', marginBottom: '10px' }}>Past Orders</h3>
        {loading ? (
          <p style={{ color: '#64748b' }}>Loading history...</p>
        ) : pastOrders.length === 0 ? (
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center', color: '#94a3b8', border: '1px dashed #cbd5e1' }}>
            No past orders found.
          </div>
        ) : (
          pastOrders.map((order, i) => (
            <div key={i} style={{ background: 'white', padding: '15px', borderRadius: '12px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: '#0f172a' }}>{order.shopId?.name || "Local Shop"}</strong>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '3px' }}>{new Date(order.createdAt).toLocaleDateString()} • ₹{order.totalAmount}</div>
              </div>
              <div style={{ color: '#10b981', fontSize: '1.2rem' }}>✅</div>
            </div>
          ))
        )}

        {/* LOGOUT BUTTON */}
        <button onClick={onLogout} style={{ width: '100%', padding: '15px', marginTop: '30px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
          Log Out
        </button>

      </div>
    </div>
  );
}

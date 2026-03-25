import React from 'react';

export default function UserDashboard({ user, onExit, onLogout }) {
  
  // Safety fallbacks just in case data loads slowly
  const userName = user?.name || "Demo User";
  const userPhone = user?.phone || "No Phone";
  const userPincode = user?.pincode || "No Pincode";

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '30px' }}>
      
      {/* 🔴 HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #ff6b6b, #ff4757)', padding: '20px 20px 30px 20px', color: 'white', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', boxShadow: '0 4px 10px rgba(255, 71, 87, 0.2)' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '1.4rem' }}>👤 My Profile</h2>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>Manage your orders and parchi</p>
        </div>
        <button onClick={onExit} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>
          Back to Shop
        </button>
      </div>

      {/* 💳 REAL USER INFO CARD */}
      <div style={{ backgroundColor: 'white', padding: '20px', margin: '-20px 15px 15px 15px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', position: 'relative' }}>
        
        {/* 👇 DYNAMIC DATA INJECTED HERE! */}
        <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: '#2f3640', textTransform: 'capitalize' }}>{userName}</h3>
        <p style={{ margin: '0 0 15px 0', color: '#7f8fa6', fontSize: '0.9rem' }}>{userPhone} • Pincode: {userPincode}</p>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ flex: 1, padding: '10px', background: '#f5f6fa', color: '#2f3640', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>✏️ Edit Profile</button>
          
          {/* 👇 LOGOUT BUTTON WIRED UP HERE! */}
          <button onClick={onLogout} style={{ flex: 1, padding: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Log Out</button>
        </div>
      </div>

      {/* 📦 ACTIVE ORDERS */}
      <div style={{ margin: '0 15px 20px 15px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', color: '#2f3640' }}>📦 Active Orders</h3>
        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', borderLeft: '5px solid #e1b12c', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
            <span style={{ fontWeight: '800', color: '#2f3640' }}>Order #1043</span>
            <span style={{ color: '#e1b12c', backgroundColor: '#fcf2ce', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.75rem' }}>⏳ Packing...</span>
          </div>
          <p style={{ margin: '0 0 10px 0', color: '#7f8fa6', fontSize: '0.9rem' }}>Sharma Groceries • 3 Items (₹320)</p>
          <div style={{ width: '100%', height: '6px', backgroundColor: '#f5f6fa', borderRadius: '10px', marginBottom: '15px' }}><div style={{ width: '50%', height: '100%', backgroundColor: '#e1b12c', borderRadius: '10px' }}></div></div>
          <button style={{ width: '100%', padding: '12px', background: '#fff9e6', color: '#e1b12c', border: '1px solid #fcf2ce', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Track Live Status</button>
        </div>
      </div>

      {/* 🕒 ORDER HISTORY */}
      <div style={{ margin: '0 15px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', color: '#2f3640' }}>🕒 Past Purchases</h3>
        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', color: '#2f3640' }}>Order #1021</span>
            <span style={{ color: '#44bd32', fontWeight: 'bold', fontSize: '0.8rem' }}>✅ Delivered</span>
          </div>
          <p style={{ margin: '0 0 10px 0', color: '#7f8fa6', fontSize: '0.9rem' }}>Rahul Electronics • 1 Item • ₹1,200</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#a4b0be' }}>12 Oct 2023</span>
            <button style={{ padding: '8px 16px', background: '#f5f6fa', color: '#ff4757', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>🔄 Reorder</button>
          </div>
        </div>
      </div>

    </div>
  );
}

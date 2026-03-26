import React from 'react';

export default function Header({ user }) {
  // 🧭 Determine what to show based on what the user has saved
  const locationText = user?.primaryShop 
    ? `🏪 ${user.primaryShop.name || "Your Primary Shop"}` 
    : user?.pincode 
    ? `📍 Delivering to: ${user.pincode}` 
    : "📍 Set your delivery location";

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
      
      {/* 🟢 TOP ROW: Brand & Navigation */}
      <div style={{ backgroundColor: '#2f3640', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Logo */}
        <h1 
          onClick={() => window.location.hash = ""} 
          style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#10b981' }}
        >
          📦 PackItOut
        </h1>

        {/* Clickable Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            onClick={() => window.location.hash = "#account"} 
            style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.4rem', cursor: 'pointer', transition: 'transform 0.2s' }}
            title="My Profile"
          >
            👤
          </button>
          <button 
            onClick={() => window.location.hash = "#cart"} 
            style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.4rem', cursor: 'pointer', transition: 'transform 0.2s' }}
            title="View Cart"
          >
            🛒
          </button>
        </div>
      </div>

      {/* 📍 BOTTOM ROW: The Slim Location Pill */}
      <div 
        onClick={() => window.location.hash = "#account"}
        style={{ backgroundColor: '#1e272e', padding: '8px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderTop: '1px solid #3d566e' }}
      >
        <span style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 'bold' }}>
          {locationText}
        </span>
        <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 'bold' }}>
          Change 🔽
        </span>
      </div>

    </header>
  );
}

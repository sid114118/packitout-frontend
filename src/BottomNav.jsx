import React from 'react';

export default function BottomNav({ currentView }) {
  // Helper to determine if the icon should be green or gray
  const isActive = (views) => views.includes(currentView);

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#ffffff',
      borderTop: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '10px 0',
      paddingBottom: 'max(10px, env(safe-area-inset-bottom))', // iOS support
      zIndex: 998, // Sits just below the Z-index of the Cart popup!
      boxShadow: '0 -4px 10px rgba(0,0,0,0.03)'
    }}>
      
      {/* 🏠 HOME */}
      <div 
        onClick={() => window.location.hash = ""} 
        style={navItemStyle(isActive(["customer", ""]))}
      >
        <div style={{ fontSize: '1.4rem', marginBottom: '2px', filter: isActive(["customer", ""]) ? 'grayscale(0%)' : 'grayscale(100%) opacity(50%)' }}>🏠</div>
        <span style={{ fontSize: '0.65rem', fontWeight: '800' }}>Home</span>
      </div>

      {/* 🏪 NEARBY */}
      <div 
        onClick={() => window.location.hash = "#nearby"} 
        style={navItemStyle(isActive(["nearby"]))}
      >
        <div style={{ fontSize: '1.4rem', marginBottom: '2px', filter: isActive(["nearby"]) ? 'grayscale(0%)' : 'grayscale(100%) opacity(50%)' }}>🏪</div>
        <span style={{ fontSize: '0.65rem', fontWeight: '800' }}>Nearby</span>
      </div>

      {/* 🧾 ORDERS */}
      <div 
        onClick={() => window.location.hash = "#account"} 
        style={navItemStyle(false)} // We will route this specifically to the Orders tab of the account later
      >
        <div style={{ fontSize: '1.4rem', marginBottom: '2px', filter: 'grayscale(100%) opacity(50%)' }}>🧾</div>
        <span style={{ fontSize: '0.65rem', fontWeight: '800' }}>Orders</span>
      </div>

      {/* 👤 PROFILE */}
      <div 
        onClick={() => window.location.hash = "#account"} 
        style={navItemStyle(isActive(["account"]))}
      >
        <div style={{ fontSize: '1.4rem', marginBottom: '2px', filter: isActive(["account"]) ? 'grayscale(0%)' : 'grayscale(100%) opacity(50%)' }}>👤</div>
        <span style={{ fontSize: '0.65rem', fontWeight: '800' }}>Profile</span>
      </div>

    </div>
  );
}

// Reusable style for the icons
const navItemStyle = (active) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  color: active ? '#0c831f' : '#64748b',
  cursor: 'pointer',
  flex: 1,
  transition: 'color 0.2s ease',
  WebkitTapHighlightColor: 'transparent' // Removes the ugly blue tap box on mobile
});

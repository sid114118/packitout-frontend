import React from 'react';

export default function BottomNav({ currentView }) {
  const isActive = (views) => views.includes(currentView);

  // Smart Navigation Logic
  const handleNav = (hash) => {
    // If they are already on this tab, scroll to the top!
    if (window.location.hash === hash || (hash === "" && !window.location.hash)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Otherwise, change the page
      window.location.hash = hash;
    }
  };

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
      paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
      zIndex: 998,
      boxShadow: '0 -4px 10px rgba(0,0,0,0.03)'
    }}>
      
      {/* 🏠 HOME */}
      <div 
        onClick={() => handleNav("")} 
        style={navItemStyle(isActive(["customer", ""]))}
      >
        <div style={{ fontSize: '1.4rem', marginBottom: '2px', filter: isActive(["customer", ""]) ? 'grayscale(0%)' : 'grayscale(100%) opacity(50%)' }}>🏠</div>
        <span style={{ fontSize: '0.65rem', fontWeight: '800' }}>Home</span>
      </div>

      {/* 🏪 NEARBY */}
      <div 
        onClick={() => handleNav("#nearby")} 
        style={navItemStyle(isActive(["nearby"]))}
      >
        <div style={{ fontSize: '1.4rem', marginBottom: '2px', filter: isActive(["nearby"]) ? 'grayscale(0%)' : 'grayscale(100%) opacity(50%)' }}>🏪</div>
        <span style={{ fontSize: '0.65rem', fontWeight: '800' }}>Nearby</span>
      </div>

      {/* 🧾 ORDERS */}
      <div 
        onClick={() => handleNav("#account")} 
        style={navItemStyle(false)} 
      >
        <div style={{ fontSize: '1.4rem', marginBottom: '2px', filter: 'grayscale(100%) opacity(50%)' }}>🧾</div>
        <span style={{ fontSize: '0.65rem', fontWeight: '800' }}>Orders</span>
      </div>

      {/* 👤 PROFILE */}
      <div 
        onClick={() => handleNav("#account")} 
        style={navItemStyle(isActive(["account"]))}
      >
        <div style={{ fontSize: '1.4rem', marginBottom: '2px', filter: isActive(["account"]) ? 'grayscale(0%)' : 'grayscale(100%) opacity(50%)' }}>👤</div>
        <span style={{ fontSize: '0.65rem', fontWeight: '800' }}>Profile</span>
      </div>

    </div>
  );
}

// 🌟 THE FIX: Added Anti-Select and Anti-Highlight CSS
const navItemStyle = (active) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  color: active ? '#0c831f' : '#64748b',
  cursor: 'pointer',
  flex: 1,
  transition: 'color 0.2s ease',
  
  // These 3 lines stop Android/iOS from showing text selection & search popups!
  WebkitTapHighlightColor: 'transparent', 
  WebkitUserSelect: 'none', 
  userSelect: 'none',
  WebkitTouchCallout: 'none' // Stops long-press popups on iOS
});

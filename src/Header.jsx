export default function Header() {
  return (
    <header style={{ backgroundColor: '#2c3e50', color: '#ffffff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
      
      {/* --- TOP ROW: Menu, Logo, and Icons --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px' }}>
        
        {/* Left Side: Hamburger & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg viewBox="0 0 24 24" width="26" height="26" stroke="currentColor" strokeWidth="2" fill="none">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📦 PackItOut
          </h1>
        </div>

        {/* Right Side: Bell, Profile, Cart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#ff4757', color: 'white', borderRadius: '50%', width: '14px', height: '14px', fontSize: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>1</span>
          </div>
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        </div>
      </div>

      {/* --- BOTTOM ROW: Pincode & Shop Selection --- */}
      <div style={{ backgroundColor: '#1a252f', padding: '12px 15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* Pincode Tap Target */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2c3e50', padding: '10px 12px', borderRadius: '6px', border: '1px solid #3d566e' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Map Pin Icon (Red) */}
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="#ff4757" strokeWidth="2" fill="none">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span style={{ fontSize: '0.9rem', color: '#e0e0e0' }}>Deliver to: <strong style={{ color: 'white' }}>Enter Pincode</strong></span>
          </div>
          {/* Dropdown Arrow */}
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="#888" strokeWidth="2" fill="none">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>

        {/* Shop Tap Target */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2c3e50', padding: '10px 12px', borderRadius: '6px', border: '1px solid #3d566e' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Storefront Icon (Green) */}
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="#2ed573" strokeWidth="2" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span style={{ fontSize: '0.9rem', color: '#e0e0e0' }}>Shop: <strong style={{ color: 'white' }}>Select Shop</strong></span>
          </div>
          {/* Dropdown Arrow */}
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="#888" strokeWidth="2" fill="none">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>

      </div>

    </header>
  );
}

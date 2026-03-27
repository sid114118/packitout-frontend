import React from 'react';

export default function Categories({ onCategorySelect }) {
  const menuData = [
    {
      sectionTitle: "Daily Fresh & Staples",
      items: [
        { name: "Dairy, Bread & Eggs", icon: "🥛" }, 
        { name: "Fruits & Veg", icon: "🍎" },
        { name: "Atta, Rice & Dal", icon: "🌾" },
        { name: "Chicken, Meat & Fish", icon: "🍗" },
        { name: "Oil, Ghee & Masala", icon: "🍶" },
        { name: "Dry Fruits & Cereals", icon: "🥣" },
        { name: "Bakery & Biscuits", icon: "🥐" },
        { name: "Kitchen Appliances", icon: "🍳" } // Moved here to keep 8 items!
      ]
    },
    {
      sectionTitle: "Munchies & Refreshments",
      items: [
        { name: "Chips & Namkeen", icon: "🥨" },
        { name: "Drinks & Juices", icon: "🥤" },     
        { name: "Sweets & Chocolates", icon: "🍫" },
        { name: "Ice Creams", icon: "🍦" },          
        { name: "Tea & Coffee", icon: "☕" },
        { name: "Instant Food", icon: "🍜" },       // Moved here to make exactly 8 items!
        { name: "Sauces & Spreads", icon: "🍯" },
        { name: "Paan Corner", icon: "🍃" }
      ]
    },
    {
      sectionTitle: "Home, Health & Utilities",
      items: [
        { name: "Bath & Body", icon: "🧼" },
        { name: "Cleaners & Repellents", icon: "🧽" }, 
        { name: "Hair Care", icon: "🧴" },
        { name: "Health & Pharma", icon: "💊" }     // Exactly 4 items now!
      ]
    }
  ];

  return (
    <div style={{ padding: '15px', backgroundColor: '#ffffff' }}>
      
      {/* --- THE UPLOAD PARCHI HERO BANNER --- */}
      <div style={{ 
        background: 'linear-gradient(135deg, #ff6b6b, #ff4757)', 
        borderRadius: '16px', 
        padding: '18px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '25px',
        boxShadow: '0 4px 12px rgba(255, 71, 87, 0.25)',
        color: 'white'
      }}>
        <div style={{ flex: 1, paddingRight: '10px' }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', fontWeight: '800' }}>
            Have a list? Upload Parchi
          </h3>
          <p style={{ margin: '0 0 14px 0', fontSize: '0.8rem', opacity: '0.95', lineHeight: '1.4' }}>
            Save time! Send a photo of your handwritten list and we'll pack it instantly.
          </p>
          <button style={{ backgroundColor: '#ffffff', color: '#ff4757', border: 'none', borderRadius: '8px', padding: '10px 16px', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            Upload Now
          </button>
        </div>
        <div style={{ fontSize: '4rem', lineHeight: '1', transform: 'rotate(8deg)' }}>🧾</div>
      </div>

      {/* --- THE CATEGORIES GRID --- */}
      {menuData.map((section, sectionIndex) => (
        <div key={sectionIndex} style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1a1a1a', marginBottom: '15px', textAlign: 'left' }}>
            {section.sectionTitle}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px 10px' }}>
            {section.items.map((item, itemIndex) => (
              <div key={itemIndex} onClick={() => onCategorySelect && onCategorySelect(item.name)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', width: '70px', height: '70px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2.2rem', boxShadow: '0 4px 10px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', marginBottom: '8px' }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: '0.7rem', color: '#4a4a4a', fontWeight: '600', textAlign: 'center', lineHeight: '1.2', maxWidth: '70px' }}>
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

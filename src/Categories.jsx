import React from 'react';

export default function Categories() {
  const menuData = [
    {
      sectionTitle: "Grocery & Kitchen",
      items: [
        { name: "Fruits & Veg", icon: "🍎" },
        { name: "Atta, Rice & Dal", icon: "🌾" },
        { name: "Oil, Ghee & Masala", icon: "🍶" },
        { name: "Dairy, Bread & Eggs", icon: "🥛" },
        { name: "Bakery & Biscuits", icon: "🥐" },
        { name: "Dry Fruits & Cereals", icon: "🥣" },
        { name: "Chicken, Meat & Fish", icon: "🍗" },
        { name: "Kitchen Appliances", icon: "🍳" }
      ]
    },
    {
      sectionTitle: "Snacks & Drinks",
      items: [
        { name: "Chips & Namkeen", icon: "🥨" },
        { name: "Sweets & Chocolates", icon: "🍫" },
        { name: "Drinks & Juices", icon: "🥤" },
        { name: "Tea & Coffee", icon: "☕" },
        { name: "Instant Food", icon: "🍜" },
        { name: "Sauces & Spreads", icon: "🍯" },
        { name: "Ice Creams", icon: "🍦" },
        { name: "Paan Corner", icon: "🍃" }
      ]
    },
    {
      sectionTitle: "Household & Personal Care",
      items: [
        { name: "Bath & Body", icon: "🧼" },
        { name: "Hair Care", icon: "🧴" },
        { name: "Cleaners & Repellents", icon: "🧽" },
        { name: "Health & Pharma", icon: "💊" }
      ]
    }
  ];

  return (
    <div style={{ padding: '15px', backgroundColor: '#ffffff' }}>
      
      {/* --- NEW: THE UPLOAD PARCHI HERO BANNER --- */}
      <div style={{ 
        background: 'linear-gradient(135deg, #ff6b6b, #ff4757)', // Vibrant premium gradient
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
          <button style={{ 
            backgroundColor: '#ffffff', 
            color: '#ff4757', 
            border: 'none', 
            borderRadius: '8px', 
            padding: '10px 16px', 
            fontWeight: 'bold', 
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}>
            {/* Little Camera Icon */}
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            Upload Now
          </button>
        </div>
        
        {/* Big Receipt/List Emoji */}
        <div style={{ fontSize: '4rem', lineHeight: '1', transform: 'rotate(8deg)' }}>
          🧾
        </div>
      </div>
      {/* --- END BANNER --- */}


      {/* --- THE CATEGORIES GRID --- */}
      {menuData.map((section, sectionIndex) => (
        <div key={sectionIndex} style={{ marginBottom: '30px' }}>
          
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1a1a1a', marginBottom: '15px', textAlign: 'left' }}>
            {section.sectionTitle}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px 10px' }}>
            {section.items.map((item, itemIndex) => (
              <div key={itemIndex} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
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

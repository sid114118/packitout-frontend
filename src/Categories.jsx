import React from 'react';

export default function Categories() {
  // We organize the data into sections, just like Blinkit!
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
      
      {/* Loop through each section (Grocery, Snacks, etc.) */}
      {menuData.map((section, sectionIndex) => (
        <div key={sectionIndex} style={{ marginBottom: '30px' }}>
          
          {/* Section Header */}
          <h3 style={{ 
            fontSize: '1.2rem', 
            fontWeight: '800', 
            color: '#1a1a1a', 
            marginBottom: '15px',
            textAlign: 'left'
          }}>
            {section.sectionTitle}
          </h3>

          {/* The 4-Column Grid for this section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px 10px' }}>
            
            {section.items.map((item, itemIndex) => (
              <div key={itemIndex} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                
                {/* The "Squirkle" Icon Container (Different from Blinkit's tall rectangles) */}
                <div style={{ 
                  backgroundColor: '#ffffff', // Clean white
                  borderRadius: '18px', // Premium soft curve
                  width: '70px', 
                  height: '70px', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  fontSize: '2.2rem', // Big crisp icons
                  boxShadow: '0 4px 10px rgba(0,0,0,0.06)', // Soft premium shadow
                  border: '1px solid #f0f0f0',
                  marginBottom: '8px'
                }}>
                  {item.icon}
                </div>
                
                {/* The Category Text */}
                <span style={{ 
                  fontSize: '0.7rem', 
                  color: '#4a4a4a', 
                  fontWeight: '600', 
                  textAlign: 'center',
                  lineHeight: '1.2',
                  maxWidth: '70px'
                }}>
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

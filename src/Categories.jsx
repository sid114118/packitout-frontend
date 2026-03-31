import React from 'react';
import UploadParchi from './UploadParchi.jsx'; 

export default function Categories({ onCategorySelect }) {
  // 📸 Add your real image URLs in the 'image' property below!
  // If 'image' is empty, it will automatically fall back to the emoji.
  const menuData = [
    {
      sectionTitle: "Daily Fresh & Staples",
      items: [
        { name: "Dairy, Bread & Eggs", icon: "🥛", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1774944897/images_3_xsxbe0.jpg" }, 
        { name: "Fruits & Veg", icon: "🍎", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1774945247/images_5_faefgf.jpg" },
        { name: "Atta, Rice & Dal", icon: "🌾", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1774945074/images_4_mbo5ob.jpg" },
        { name: "Chicken, Meat & Fish", icon: "🍗", image: "" },
        { name: "Oil, Ghee & Masala", icon: "🍶", image: "" },
        { name: "Dry Fruits & Cereals", icon: "🥣", image: "" },
        { name: "Bakery & Biscuits", icon: "🥐", image: "" },
        { name: "Kitchen Appliances", icon: "🍳", image: "" } 
      ]
    },
    {
      sectionTitle: "Munchies & Refreshments",
      items: [
        { name: "Chips & Namkeen", icon: "🥨", image: "" },
        { name: "Drinks & Juices", icon: "🥤", image: "" },     
        { name: "Sweets & Chocolates", icon: "🍫", image: "" },
        { name: "Ice Creams", icon: "🍦", image: "" },          
        { name: "Tea & Coffee", icon: "☕", image: "" },
        { name: "Instant Food", icon: "🍜", image: "" },       
        { name: "Sauces & Spreads", icon: "🍯", image: "" },
        { name: "Paan Corner", icon: "🍃", image: "" }
      ]
    },
    {
      sectionTitle: "Home, Health & Utilities",
      items: [
        { name: "Bath & Body", icon: "🧼", image: "" },
        { name: "Cleaners & Repellents", icon: "🧽", image: "" }, 
        { name: "Hair Care", icon: "🧴", image: "" },
        { name: "Health & Pharma", icon: "💊", image: "" }     
      ]
    }
  ];

  return (
    <div style={{ padding: '15px', backgroundColor: '#ffffff' }}>
      
      {/* 🌟 THE CLEAN UPLOAD COMPONENT 🌟 */}
      <UploadParchi />

      {menuData.map((section, sectionIndex) => (
        <div key={sectionIndex} style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1a1a1a', marginBottom: '15px', textAlign: 'left' }}>{section.sectionTitle}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px 10px' }}>
            {section.items.map((item, itemIndex) => (
              <div 
                key={itemIndex} 
                onClick={() => onCategorySelect && onCategorySelect(item.name)} 
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
              >
                {/* 🖼️ IMAGE OR EMOJI CONTAINER */}
                <div style={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '18px', 
                  width: '70px', 
                  height: '70px', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  fontSize: '2.2rem', 
                  boxShadow: '0 4px 10px rgba(0,0,0,0.06)', 
                  border: '1px solid #f0f0f0', 
                  marginBottom: '8px',
                  overflow: 'hidden' // 👈 Keeps images perfectly inside the rounded corners
                }}>
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    item.icon
                  )}
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

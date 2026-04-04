import React, { useState } from 'react';
import UploadParchi from './UploadParchi.jsx'; 

export default function Categories({ onCategorySelect }) {
  const [searchQuery, setSearchQuery] = useState("");

  // 📸 Your real data, now with beautiful pastel fallback backgrounds!
  const menuData = [
    {
      sectionTitle: "Daily Fresh & Staples",
      items: [
        { name: "Dairy, Bread & Eggs", icon: "🥛", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1774944897/images_3_xsxbe0.jpg", bgColor: "#fefce8" }, 
        { name: "Fruits & Veg", icon: "🍎", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1774945247/images_5_faefgf.jpg", bgColor: "#f0fdf4" },
        { name: "Atta, Rice & Dal", icon: "🌾", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1774945074/images_4_mbo5ob.jpg", bgColor: "#fff7ed" },
        { name: "Chicken, Meat & Fish", icon: "🍗", image: "", bgColor: "#fef2f2" },
        { name: "Oil, Ghee & Masala", icon: "🍶", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1774945925/images_6_u1l8js.jpg", bgColor: "#fffbeb" },
        { name: "Dry Fruits & Cereals", icon: "🥣", image: "", bgColor: "#f0f9ff" },
        { name: "Bakery & Biscuits", icon: "🥐", image: "", bgColor: "#fdf2f8" },
        { name: "Kitchen Appliances", icon: "🍳", image: "", bgColor: "#f1f5f9" } 
      ]
    },
    {
      sectionTitle: "Munchies & Refreshments",
      items: [
        { name: "Chips & Namkeen", icon: "🥨", image: "", bgColor: "#fff7ed" },
        { name: "Drinks & Juices", icon: "🥤", image: "", bgColor: "#eff6ff" },     
        { name: "Sweets & Chocolates", icon: "🍫", image: "", bgColor: "#fdf2f8" },
        { name: "Ice Creams", icon: "🍦", image: "", bgColor: "#f0f9ff" },          
        { name: "Tea & Coffee", icon: "☕", image: "", bgColor: "#fefce8" },
        { name: "Instant Food", icon: "🍜", image: "", bgColor: "#fef2f2" },       
        { name: "Sauces & Spreads", icon: "🍯", image: "", bgColor: "#fffbeb" },
        { name: "Paan Corner", icon: "🍃", image: "", bgColor: "#f0fdf4" }
      ]
    },
    {
      sectionTitle: "Home, Health & Utilities",
      items: [
        { name: "Bath & Body", icon: "🧼", image: "", bgColor: "#f0f9ff" },
        { name: "Cleaners & Repellents", icon: "🧽", image: "", bgColor: "#fefce8" }, 
        { name: "Hair Care", icon: "🧴", image: "", bgColor: "#fdf2f8" },
        { name: "Health & Pharma", icon: "💊", image: "", bgColor: "#f0fdf4" }     
      ]
    }
  ];

  // Filter categories based on search
  const filteredMenuData = menuData.map(section => ({
    ...section,
    items: section.items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  })).filter(section => section.items.length > 0);

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'sans-serif' }}>
      
      {/* 🔍 STICKY SEARCH BAR */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'white', padding: '15px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
          <input 
            type="text" 
            placeholder="Search items..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '12px 15px 12px 40px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '1rem', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>
      </div>

      <div style={{ padding: '15px' }}>
        
        {/* 🌟 THE CLEAN UPLOAD COMPONENT */}
        <div style={{ marginBottom: '20px' }}>
          <UploadParchi />
        </div>

        {filteredMenuData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🛒</div>
            No categories found for "{searchQuery}"
          </div>
        ) : (
          filteredMenuData.map((section, sectionIndex) => (
            <div key={sectionIndex} style={{ backgroundColor: 'white', padding: '20px 15px', marginBottom: '15px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              
              <h3 style={{ margin: '0 0 15px 5px', fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', fontFamily: 'serif' }}>
                {section.sectionTitle}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px 10px' }}>
                {section.items.map((item, itemIndex) => (
                  <div 
                    key={itemIndex} 
                    onClick={() => onCategorySelect && onCategorySelect(item.name)} 
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                  >
                    
                    {/* 🎨 IMAGE OR PASTEL EMOJI BOX */}
                    <div style={{
                      width: '100%',
                      aspectRatio: '1 / 1', // Keeps it perfectly square and responsive
                      backgroundColor: item.image ? 'transparent' : item.bgColor,
                      borderRadius: '16px', // Premium soft corners
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      boxShadow: item.image ? '0 4px 10px rgba(0,0,0,0.08)' : 'inset 0 0 10px rgba(0,0,0,0.02)',
                      overflow: 'hidden', // Forces images to stay inside the rounded corners
                      marginBottom: '8px'
                    }}>
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <span style={{ fontSize: '2.5rem' }}>{item.icon}</span>
                      )}
                    </div>

                    {/* 📝 TEXT LABEL */}
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: '#334155',
                      textAlign: 'center',
                      lineHeight: '1.2',
                      display: '-webkit-box',
                      WebkitLineClamp: 2, // Wraps to max 2 lines
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      width: '95%'
                    }}>
                      {item.name}
                    </span>

                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

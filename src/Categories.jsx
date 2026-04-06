import React from 'react';
import UploadParchi from './UploadParchi.jsx'; 

// 🌟 Now accepts 'searchQuery' as a prop from your main Header!
export default function Categories({ onCategorySelect, searchQuery = "" }) {

  // 📸 Your real data with pastel fallback backgrounds
  const menuData = [
  {
    sectionTitle: "Daily Fresh & Staples",
    items: [
      { name: "Breakfast Cereals", icon: "🍅", image: "", bgColor: "#fefce8" },
      { name: "Dairy, Bread & Eggs", icon: "🥛", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1775282049/dairyandbread_tvt2pt.webp", bgColor: "#f0f9ff" }, 
      { name: "Atta & Rice", icon: "🌾", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1775282049/aata_rice_klxfpi.webp", bgColor: "#fefce8" },
      { name: "Dals & Pulses", icon: "🥣", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1775285310/1000253417-removebg-preview_1_yurvuu.jpg", bgColor: "#fef2f2" }, 
      { name: "Oil, Ghee & Salt", icon: "🍶", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1775282049/Oil_ghee_twp67j.webp", bgColor:"#f0fdf4" },
      { name: "Dry Fruits & Cereals", icon: "🥜", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1775282050/dryfruits_izvf5g.webp", bgColor: "#f0f9ff" },
      { name: "Spices & Condiments", icon: "🌶️", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1775282049/masala_tydple.webp", bgColor: "#fdf2f8" }, 
      { name: "Sauces & Spreads", icon: "🍯", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1775285893/1000253431-removebg-preview_b2zxmt.jpg", bgColor: "#f0fdf4" } 
    ]
  },
  {
    sectionTitle: "Munchies & Refreshments",
    items: [
      { name: "Chips & Namkeen", icon: "🥨", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1775291160/namkeen_wqryy1.jpg", bgColor: "#fff7ed" },
      { name: "Drinks & Juices", icon: "🥤", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1775291160/colddrinks_mawune.jpg", bgColor: "#eff6ff" },     
      { name: "Sweets & Chocolates", icon: "🍫", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1775291159/chocolate_m3hdas.jpg", bgColor: "#fdf2f8" },
      { name: "Ice Creams", icon: "🍦", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1775291161/icecream_nqu7fv.jpg", bgColor: "#f0f9ff" },          
      { name: "Tea & Coffee", icon: "☕", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1775291160/tea_coffee_jdqypd.jpg", bgColor: "#fefce8" },
      { name: "Instant Food", icon: "🍜", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1775291159/noodles_ploez3.jpg", bgColor: "#fef2f2" },       
      { name: "Bakery & Biscuits", icon: "🍪", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1775291510/1000253503-removebg-preview_pqscbp.jpg", bgColor: "#fffbeb" }, 
      { name: "Healthy & Diet Snacks", icon: "🥑", image: "", bgColor: "#f0fdf4" } 
    ]
  },
  {
    sectionTitle: "Home, Health & Utilities",
    items: [
      { name: "Bath & Body", icon: "🧼", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1775292737/bodywash_iacvvh.jpg", bgColor: "#f0f9ff" },
      { name: "Beauty & Grooming", icon: "🧴", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1775292739/bodycare_iie0ql.jpg", bgColor: "#fdf2f8" }, 
      { name: "Health & Pharma", icon: "💊", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1775292739/health_asi8e6.jpg", bgColor: "#f0fdf4" },
      { name: "Cleaners & Repellents", icon: "🧽", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1775292738/housecleaners_dvrjvm.jpg", bgColor: "#fefce8" }, 
      { name: "Baby Care", icon: "🍼", image: "", bgColor: "#fdf2f8" }, 
      { name: "Pet Care", icon: "🐾", image: "", bgColor: "#fff7ed" }, 
      { name: "Pooja Needs", icon: "🪔", image: "", bgColor: "#fffbeb" }, 
      { name: "Home & Office", icon: "🔋", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1775286372/1000253439-removebg-preview_r20l8d.jpg", bgColor: "#f1f5f9" } 
    ]
  }
];
  

  // Instantly filter categories based on whatever is typed in your Header
  const filteredMenuData = menuData.map(section => ({
    ...section,
    items: section.items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  })).filter(section => section.items.length > 0);

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'sans-serif' }}>
      
      <div style={{ padding: '10px 15px' }}>
        
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
            <div key={sectionIndex} style={{ backgroundColor: 'white', padding: '15px', marginBottom: '15px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              
              <h3 style={{ margin: '0 0 15px 5px', fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', fontFamily: 'serif' }}>
                {section.sectionTitle}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px 8px' }}>
                {section.items.map((item, itemIndex) => (
                  <div 
                    key={itemIndex} 
                    onClick={() => onCategorySelect && onCategorySelect(item.name)} 
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                  >
                    
                    {/* 🎨 IMAGE OR PASTEL EMOJI BOX (Now capped at a premium size!) */}
                    <div style={{
                      width: '100%',
                      maxWidth: '75px', // 👈 THE MAGIC FIX: Stops it from getting too huge!
                      aspectRatio: '1 / 1', 
                      backgroundColor: item.image ? 'transparent' : item.bgColor,
                      borderRadius: '16px', 
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      boxShadow: item.image ? '0 4px 10px rgba(0,0,0,0.06)' : 'inset 0 0 10px rgba(0,0,0,0.02)',
                      overflow: 'hidden', 
                      marginBottom: '8px'
                    }}>
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <span style={{ fontSize: '2.2rem' }}>{item.icon}</span>
                      )}
                    </div>

                    {/* 📝 TEXT LABEL */}
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      color: '#475569',
                      textAlign: 'center',
                      lineHeight: '1.2',
                      display: '-webkit-box',
                      WebkitLineClamp: 2, 
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      width: '100%',
                      maxWidth: '80px' // Keeps the text neatly tucked under the image
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

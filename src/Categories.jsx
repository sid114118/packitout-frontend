import React from 'react';
import UploadParchi from './UploadParchi.jsx';

const TOP_PICKS = [
  { icon: '🥛', label: 'Dairy & Eggs',    name: 'Dairy, Bread & Eggs' },
  { icon: '🌾', label: 'Atta & Rice',     name: 'Atta & Rice' },
  { icon: '🥨', label: 'Chips & Namkeen', name: 'Chips & Namkeen' },
  { icon: '🥤', label: 'Drinks',          name: 'Drinks & Juices' },
  { icon: '🧼', label: 'Bath & Body',     name: 'Bath & Body' },
  { icon: '💊', label: 'Health & Pharma', name: 'Health & Pharma' },
];

export default function Categories({ onCategorySelect, searchQuery = "", onAddToCart }) {

  const menuData = [
    {
      sectionTitle: "Daily Fresh & Staples",
      items: [
        { name: "Breakfast Cereals", icon: "🍅", image: "", bgColor: "#fefce8" },
        { name: "Dairy, Bread & Eggs", icon: "🥛", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1777423759/1000262144-removebg-preview_fel2fg.jpg", bgColor: "#f0f9ff" }, 
        { name: "Atta & Rice", icon: "🌾", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1777538936/1000262762-removebg-preview_rwxmll.webp", bgColor: "#fefce8" },
        { name: "Dals & Pulses", icon: "🥣", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1777538935/1000262801-removebg-preview_1_jksucv.jpg", bgColor: "#fef2f2" }, 
        { name: "Oil, Ghee & Salt", icon: "🍶", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1777538941/1000262800-removebg-preview_x9dpiy.jpg", bgColor:"#f0fdf4" },
        { name: "Dry Fruits & Cereals", icon: "🥜", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1777539613/1000262799-removebg-preview_kvf45w.jpg", bgColor: "#f0f9ff" },
        { name: "Spices & Condiments", icon: "🌶️", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1777538939/1000262801-removebg-preview_julon8.jpg", bgColor: "#fdf2f8" }, 
        { name: "Sauces & Spreads", icon: "🍯", image: "https://res.cloudinary.com/dj48tkcsw/image/upload/v1777538934/1000262796-removebg-preview_f77xzz.jpg", bgColor: "#f0fdf4" } 
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

  const filteredMenuData = menuData.map(section => ({
    ...section,
    items: section.items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  })).filter(section => section.items.length > 0);

  return (
    // 🚀 FIX 1: Removed the 20px bottom padding here so it pulls the Feed closer
    <div style={{ backgroundColor: '#f4f6f8', paddingBottom: '0px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      <div style={{ padding: '10px 15px' }}>
        
        <div style={{ marginBottom: '25px' }}>
          <UploadParchi onAddToCart={onAddToCart} />
        </div>

        {/* 🔥 QUICK ACCESS — TOP CATEGORY PILLS */}
        {!searchQuery && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              margin: '0 0 12px 4px',
              fontSize: '1rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.2px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span aria-hidden="true">🔥</span> Top Picks
            </h3>
            <div
              className="hide-scroll"
              style={{
                display: 'flex',
                gap: '10px',
                overflowX: 'auto',
                paddingBottom: '4px',
                marginInline: '-15px',
                paddingInline: '15px',
                scrollbarWidth: 'none'
              }}
            >
              {TOP_PICKS.map(pick => (
                <button
                  key={pick.name}
                  onClick={() => onCategorySelect && onCategorySelect(pick.name)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: '999px',
                    border: '1px solid #e2e8f0',
                    background: 'white',
                    color: '#0f172a',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    fontFamily: 'inherit',
                    transition: 'transform 0.1s ease, background 0.15s ease'
                  }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <span aria-hidden="true" style={{ fontSize: '1.05rem' }}>{pick.icon}</span>
                  <span>{pick.label}</span>
                </button>
              ))}
            </div>
            <style>{`.hide-scroll::-webkit-scrollbar { display: none; }`}</style>
          </div>
        )}

        {filteredMenuData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔍</div>
            No categories found
          </div>
        ) : (
          filteredMenuData.map((section, sectionIndex) => (
            // 🚀 FIX 2: Only adds a large bottom margin if it is NOT the last category block
            <div key={sectionIndex} style={{ marginBottom: sectionIndex === filteredMenuData.length - 1 ? '5px' : '30px' }}>
              
              <h3 style={{ 
                margin: '0 0 16px 4px', 
                fontSize: '1.1rem', 
                fontWeight: '800', 
                color: '#0f172a', 
                letterSpacing: '-0.3px' 
              }}>
                {section.sectionTitle}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 10px' }}>
                {section.items.map((item, itemIndex) => (
                  <div 
                    key={itemIndex} 
                    onClick={() => onCategorySelect && onCategorySelect(item.name)} 
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                  >
                    
                    <div style={{
                      width: '100%',
                      maxWidth: '72px', 
                      aspectRatio: '1 / 1', 
                      backgroundColor: item.bgColor,
                      borderRadius: '20px', 
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                      overflow: 'hidden', 
                      // 🚀 FIX 3: Restored the proper gap between the image and the text label
                      marginBottom: '8px',
                      border: '1px solid rgba(0,0,0,0.02)'
                    }}>
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover', 
                          }} 
                        />
                      ) : (
                        <span style={{ fontSize: '1.8rem' }}>{item.icon}</span>
                      )}
                    </div>

                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      color: '#334155',
                      textAlign: 'center',
                      lineHeight: '1.2',
                      display: '-webkit-box',
                      WebkitLineClamp: 2, 
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      width: '100%'
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

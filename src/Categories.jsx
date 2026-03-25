import React from 'react';

export default function Categories() {
  // Our master list of grocery categories
  const categoryList = [
    { name: "Fruits & Veg", icon: "🍎" },
    { name: "Atta & Dal", icon: "🌾" },
    { name: "Dairy & Bread", icon: "🥛" },
    { name: "Snacks", icon: "🍿" },
    { name: "Masala & Spices", icon: "🌶️" },
    { name: "Cold Drinks", icon: "🥤" },
    { name: "Sweet Cravings", icon: "🍫" },
    { name: "Personal Care", icon: "🧼" }
  ];

  return (
    <section style={{ padding: '20px 15px', backgroundColor: '#ffffff', marginTop: '5px' }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#2c3e50', fontWeight: 'bold' }}>
        Shop by Category
      </h3>
      
      {/* The 4-column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px 10px' }}>
        {categoryList.map((category, index) => (
          <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
            
            {/* The Icon Box */}
            <div style={{ 
              backgroundColor: '#f4f7f6', 
              borderRadius: '16px', 
              width: '65px', 
              height: '65px', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              fontSize: '2rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              {category.icon}
            </div>
            
            {/* The Category Name */}
            <span style={{ 
              fontSize: '0.75rem', 
              marginTop: '8px', 
              color: '#555', 
              fontWeight: '600', 
              textAlign: 'center',
              lineHeight: '1.2'
            }}>
              {category.name}
            </span>
            
          </div>
        ))}
      </div>
    </section>
  );
}

import React, { useState, useEffect } from 'react';

export default function ProductFeed({ onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://darkslategrey-snail-415133.hostingersite.com/master-products")
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.log("Error fetching products:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontWeight: 'bold' }}>
        <span style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}>⏳</span>
        Loading fresh items...
      </div>
    );
  }

  return (
    <div style={{ padding: '15px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Section Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '0 5px' }}>
        <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', fontWeight: '900' }}>Fresh Arrivals ✨</h2>
      </div>
      
      {/* 📱 The Premium Grid Layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
        gap: '12px' 
      }}>
        {products.map((product) => (
          <div key={product._id} style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '12px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
            border: '1px solid #f1f5f9',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            
            {/* 🍎 Emoji / Image Display Box */}
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              height: '110px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '4rem',
              marginBottom: '12px'
            }}>
              {product.emoji || "📦"}
            </div>

            {/* 📝 Product Details */}
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>
                {product.brand || "Local"}
              </div>
              
              {/* Smart text truncation (keeps it exactly 2 lines maximum) */}
              <h3 style={{ 
                margin: '0 0 4px 0', 
                fontSize: '0.95rem', 
                color: '#1e293b',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: '1.3',
                height: '2.6em' // Forces uniform height even if title is short
              }}>
                {product.name}
              </h3>
              
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '12px' }}>
                {product.qnty || "1 unit"}
              </div>
            </div>

            {/* 💵 Price & Add Button Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#0f172a' }}>
                ₹{product.mrp}
              </div>
              
              {/* The "Zepto-style" Add Button */}
              <button 
                onClick={() => onAddToCart(product)}
                style={{
                  backgroundColor: '#ecfdf5', // Very light transparent green
                  color: '#10b981', // Bold green text
                  border: '1px solid #10b981',
                  borderRadius: '8px',
                  padding: '6px 18px',
                  fontWeight: '900',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(16, 185, 129, 0.1)'
                }}
              >
                ADD
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}

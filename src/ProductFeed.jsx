import React, { useState, useEffect } from 'react';

export default function ProductFeed() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 📡 FETCH PRODUCTS FROM YOUR DATABASE
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
    return <div style={{ textAlign: 'center', padding: '40px', color: '#7f8fa6', fontWeight: 'bold' }}>⏳ Unpacking fresh groceries...</div>;
  }

  if (products.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#7f8fa6' }}>No products available yet!</div>;
  }

  return (
    <div style={{ padding: '0 15px' }}>
      <h3 style={{ textAlign: 'left', color: '#2f3640', marginBottom: '15px', fontSize: '1.2rem' }}>🛒 Fresh in Stock</h3>
      
      {/* THE GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
        
        {products.map((product, index) => (
          <div key={index} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            
            {/* PRODUCT IMAGE / EMOJI */}
            <div style={{ fontSize: '3.5rem', textAlign: 'center', marginBottom: '10px', backgroundColor: '#f4f7f6', borderRadius: '10px', padding: '15px 0' }}>
              {product.emoji || "📦"}
            </div>
            
            {/* PRODUCT DETAILS */}
            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#2f3640', lineHeight: '1.2' }}>{product.name}</h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#7f8fa6' }}>{product.qnty}</p>
            
            {/* PRICE & ADD BUTTON */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
              <span style={{ fontWeight: '900', fontSize: '1.1rem', color: '#2f3640' }}>₹{product.mrp}</span>
              <button style={{ backgroundColor: '#ff4757', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(255, 71, 87, 0.3)' }}>
                ADD
              </button>
            </div>

          </div>
        ))}

      </div>
    </div>
  );
}

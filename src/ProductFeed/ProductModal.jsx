import React from 'react';

export default function ProductPage({ onBack, product }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ef4444', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <h1 style={{ color: '#fff', fontSize: '2rem' }}>PAGE IS WORKING!</h1>
      <p style={{ color: '#fff' }}>Product: {product?.name || "No name found"}</p>
      <button 
        onClick={onBack} 
        style={{ marginTop: '20px', padding: '10px 20px', fontSize: '1.2rem', cursor: 'pointer' }}
      >
        Go Back
      </button>
    </div>
  );
}

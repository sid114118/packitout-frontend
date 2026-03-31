import React, { useEffect } from 'react';

export default function OrderSuccess() {
  
  // Auto-redirect to home after 10 seconds if the user doesn't click anything
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.hash = "";
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0c831f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', color: 'white', fontFamily: 'sans-serif', textAlign: 'center' }}>
        
        {/* 🌟 CSS Animation for the pop-in effect */}
        <style>
            {`@keyframes popIn { 
                0% { transform: scale(0.5); opacity: 0; } 
                70% { transform: scale(1.1); }
                100% { transform: scale(1); opacity: 1; } 
            }`}
        </style>

        <div style={{ fontSize: '5rem', marginBottom: '10px', animation: 'popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>🎉</div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '10px', letterSpacing: '-0.5px' }}>Order Placed!</h1>
        <p style={{ fontSize: '1.05rem', opacity: 0.9, marginBottom: '40px', maxWidth: '300px', lineHeight: '1.4' }}>
          Your neighborhood shop has received your order and is packing it now.
        </p>
        
        {/* 📦 Floating Action Card */}
        <div style={{ backgroundColor: 'white', color: '#111827', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '340px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '10px' }}>🛵</div>
            <h3 style={{ margin: '0 0 8px 0', fontWeight: '900', fontSize: '1.3rem' }}>Ready in 10-15 mins</h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>You can track your order status in your profile dashboard.</p>
            
            <button 
              onClick={() => window.location.hash = "#account"} 
              style={{ width: '100%', padding: '16px', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '1.05rem', cursor: 'pointer', marginBottom: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
            >
                Track My Order
            </button>
            <button 
              onClick={() => window.location.hash = ""} 
              style={{ width: '100%', padding: '16px', backgroundColor: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '1.05rem', cursor: 'pointer' }}
            >
                Back to Home
            </button>
        </div>
    </div>
  );
}

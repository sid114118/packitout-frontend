import React, { useEffect, useState } from 'react';
import useScrollToTop from './useScrollToTop';
import { buildCustomerToShopWhatsApp, openWhatsAppChat } from './utils/whatsappShare.js';

export default function OrderSuccess() {
  useScrollToTop();

  const [lastOrder] = useState(() => {
    try {
      const raw = sessionStorage.getItem('packitout_last_order');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Auto-redirect to home after 14 seconds if the user doesn't click anything
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.hash = "";
    }, 14000);
    return () => clearTimeout(timer);
  }, []);

  const shortId = lastOrder?._id ? String(lastOrder._id).slice(-5).toUpperCase() : null;

  return (
    <div style={{ 
        height: '100dvh',
        boxSizing: 'border-box',
        overflow: 'hidden',
        backgroundColor: '#0c831f', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '20px', 
        color: 'white', 
        fontFamily: 'sans-serif', 
        textAlign: 'center' 
    }}>
        <style>
            {`@keyframes popIn { 
                0% { transform: scale(0.5); opacity: 0; } 
                70% { transform: scale(1.1); }
                100% { transform: scale(1); opacity: 1; } 
            }`}
        </style>

        <div style={{ fontSize: '4.5rem', marginBottom: '8px', animation: 'popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>🎉</div>
        <h1 style={{ fontSize: '2.1rem', fontWeight: '900', marginBottom: '8px', letterSpacing: '-0.5px' }}>Order Placed!</h1>
        <p style={{ fontSize: '1rem', opacity: 0.92, marginBottom: '26px', maxWidth: '310px', lineHeight: '1.4' }}>
          Your neighborhood shop has received your order{shortId ? ` (#${shortId})` : ''} and is packing it now.
        </p>
        
        {/* 📦 Floating Action Card */}
        <div style={{ backgroundColor: 'white', color: '#111827', borderRadius: '20px', padding: '22px', width: '100%', maxWidth: '340px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '3.2rem', marginBottom: '6px' }}>🛵</div>
            <h3 style={{ margin: '0 0 6px 0', fontWeight: '900', fontSize: '1.25rem' }}>
              {shortId ? `Pickup Token #${shortId}` : 'Order received'}
            </h3>
            <p style={{ margin: '0 0 18px 0', fontSize: '0.86rem', color: '#64748b', fontWeight: '600' }}>
              Track live packing status or share your digital bill directly on WhatsApp.
            </p>

            {lastOrder && (
              <button
                onClick={() => {
                  const msg = buildCustomerToShopWhatsApp(lastOrder, lastOrder.userId);
                  openWhatsAppChat(lastOrder.shopId?.phone || '', msg);
                }}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#25d366',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '0.98rem',
                  cursor: 'pointer',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(37, 211, 102, 0.35)'
                }}
              >
                <span>📲</span>
                <span>Send Order Bill on WhatsApp</span>
              </button>
            )}
            
            <button 
              onClick={() => window.location.hash = "#orders"} 
              style={{ width: '100%', padding: '14px', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '0.98rem', cursor: 'pointer', marginBottom: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
            >
                Track My Order
            </button>
            <button 
              onClick={() => window.location.hash = ""} 
              style={{ width: '100%', padding: '14px', backgroundColor: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '0.98rem', cursor: 'pointer' }}
            >
                Back to Home
            </button>
        </div>
    </div>
  );
}

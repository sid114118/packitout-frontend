import React, { useState } from 'react';
import { useToast } from '../../ui/DialogProvider.jsx';

export default function GlobalOrdersTab({ orders }) {
  const toast = useToast();
  const [pingingOrderId, setPingingOrderId] = useState(null);
  const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

  // --- 🔔 THE PING FUNCTION ---
  const handlePingShop = async (shopId, orderId) => {
    // Failsafe: Handle populated shop objects vs raw string IDs
    const targetShopId = typeof shopId === 'object' ? shopId?._id : shopId;
    if (!targetShopId) {
      toast("Shop ID is missing from this order.", 'error');
      return;
    }

    setPingingOrderId(orderId); // Show loading state on button

    try {
      const res = await fetch(`${BASE_URL}/admin/ping-shop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: targetShopId, orderId })
      });

      if (res.ok) {
        toast("🔔 Urgent ping sent! Shop's phone is buzzing now.");
      } else {
        toast("Failed to send ping. Check server connection.", 'error');
      }
    } catch (err) {
      console.error(err);
      toast("Network error.", 'error');
    }
    setPingingOrderId(null); // Reset loading state
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>Global Order Pulse ({orders?.length || 0})</h3>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr style={tableHeaderStyle}>
              <th style={{ padding: '12px' }}>Order ID</th>
              <th style={{ padding: '12px' }}>Customer</th>
              <th style={{ padding: '12px' }}>Shop</th>
              <th style={{ padding: '12px' }}>Amount</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Admin Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map(o => {
              // Check if the order is still active (not delivered, not cancelled)
              const isActive = !o.status?.includes('✅') && !o.status?.includes('❌');

              return (
                <tr key={o._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '12px', fontSize: '0.9rem', color: '#64748b' }}>...{o._id.slice(-6).toUpperCase()}</td>
                  <td style={{ padding: '12px' }}><strong>{o.userId?.name || "Unknown"}</strong></td>
                  <td style={{ padding: '12px', color: '#475569' }}>{o.shopId?.name || "Unknown"}</td>
                  <td style={{ padding: '12px', fontWeight: '900', color: '#0f172a' }}>₹{o.totalAmount}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '6px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', 
                      backgroundColor: isActive ? '#eff6ff' : (o.status?.includes('✅') ? '#d1fae5' : '#fee2e2'), 
                      color: isActive ? '#2563eb' : (o.status?.includes('✅') ? '#059669' : '#ef4444') 
                    }}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {/* 🔥 ONLY SHOW PING BUTTON FOR ACTIVE ORDERS */}
                    {isActive ? (
                      <button 
                        onClick={() => handlePingShop(o.shopId, o._id)}
                        disabled={pingingOrderId === o._id}
                        style={{ 
                          padding: '6px 12px', 
                          backgroundColor: pingingOrderId === o._id ? '#fef3c7' : '#fffbeb', 
                          color: '#d97706', 
                          border: '1px solid #fcd34d', 
                          borderRadius: '6px', 
                          fontWeight: 'bold', 
                          cursor: pingingOrderId === o._id ? 'wait' : 'pointer',
                          fontSize: '0.85rem',
                          transition: '0.2s',
                          width: '110px'
                        }}
                      >
                        {pingingOrderId === o._id ? 'Pinging...' : '🔔 Ping Shop'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontStyle: 'italic' }}>Closed</span>
                    )}
                  </td>
                </tr>
              );
            })}
            
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  No orders found on the platform yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Styling Helpers
const cardStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap' };
const tableHeaderStyle = { backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' };

import React, { useState, useEffect } from 'react';
import { useToast } from '../../ui/DialogProvider.jsx';
import { useOrderAlarm } from '../../utils/orderAlarm.js';
import { adminFetch } from '../../utils/api.js';

// Admin alarm only fires once an order has been Pending this long — short enough
// to escalate before the customer gives up, long enough that the shop gets a fair
// window to accept on their own without admin noise.
const STALLED_THRESHOLD_MS = 2 * 60 * 1000;

export default function GlobalOrdersTab({ orders }) {
  const toast = useToast();
  const [pingingOrderId, setPingingOrderId] = useState(null);

  // Re-evaluate "is this order stalled now?" every 15s. The `orders` prop only
  // refreshes on tab mount, but the threshold check is purely time-based — this
  // tick re-runs the filter without needing a refetch.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  const stalledOrders = (orders || []).filter(o =>
    o.status === 'Pending' && (now - new Date(o.createdAt).getTime()) > STALLED_THRESHOLD_MS
  );
  const stalledCount = stalledOrders.length;
  const { muted, setMuted, needsUnlock, unlock } = useOrderAlarm(stalledCount > 0, { intervalMs: 3500 });

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
      const res = await adminFetch(`/admin/ping-shop`, {
        method: "POST",
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
      {/* 🚨 STALLED ORDER ALARM — fires when shops aren't responding */}
      {stalledCount > 0 && (
        <div style={{
          marginBottom: '15px',
          background: 'linear-gradient(90deg, #ef4444, #dc2626)', color: '#fff',
          padding: '14px 16px', borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(239, 68, 68, 0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          animation: 'adminAlarmPulse 1.2s ease-in-out infinite',
        }}>
          <style>{`@keyframes adminAlarmPulse { 0%, 100% { box-shadow: 0 10px 25px rgba(239, 68, 68, 0.35); } 50% { box-shadow: 0 10px 35px rgba(239, 68, 68, 0.7); } }`}</style>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <span style={{ fontSize: '1.4rem' }}>🚨</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>
                {stalledCount} order{stalledCount > 1 ? 's' : ''} stalled &gt; 2 min — shop not responding
              </div>
              <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>Use 🔔 Ping Shop in the table to escalate</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {needsUnlock && !muted && (
              <button
                onClick={unlock}
                style={{ background: '#fff', color: '#dc2626', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
              >
                🔔 Enable sound
              </button>
            )}
            <button
              onClick={() => setMuted(!muted)}
              style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', padding: '8px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
            >
              {muted ? '🔈 Unmute' : '🔇 Mute'}
            </button>
          </div>
        </div>
      )}

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

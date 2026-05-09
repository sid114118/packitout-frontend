import React, { useState } from 'react';
import { cdnImage } from '../../utils/cloudinaryUrl.js';

export default function OrdersList({
  activeOrders, 
  pastOrders, 
  pendingParchis, 
  loading, 
  setSelectedOrder, 
  onOpenReview,
  onCancelOrder // 🆕 New prop for cancellation logic
}) {
  const [showPastOrders, setShowPastOrders] = useState(false);

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* 📸 WAITING ROOM FOR RAW PARCHIS */}
      {pendingParchis && pendingParchis.length > 0 && (
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#0f172a', fontSize: '1.15rem', fontWeight: '800', marginBottom: '12px' }}>Pending Uploads 📸</h3>
          {pendingParchis.map((parchi, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedOrder({ ...parchi, status: "Waiting for Shopkeeper ⏳", totalAmount: "Calculating..." })} 
              style={{ background: 'white', padding: '12px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', cursor: 'pointer', marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}
            >
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f8fafc', flexShrink: 0 }}>
                <img src={cdnImage(parchi.imageUrl || parchi.parchiImage, 200)} alt="Uploaded" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1rem', fontWeight: '700' }}>Uploaded List</h4>
                  <span style={{ fontSize: '0.7rem', color: '#b45309', backgroundColor: '#fef3c7', padding: '4px 8px', borderRadius: '12px', fontWeight: '800' }}>Reviewing...</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0', fontWeight: '500' }}>Shopkeeper is generating bill.</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🚀 LIVE ORDER TRACKER (With Cancel Logic) */}
      {activeOrders?.length > 0 && (
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#0f172a', fontSize: '1.15rem', fontWeight: '800', marginBottom: '12px' }}>Live Orders ⏳</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeOrders.map((order, i) => {
              const isPending = order.status && order.status.toLowerCase().includes('pending');
              
              return (
                <div 
                  key={i} 
                  onClick={() => setSelectedOrder(order)} 
                  style={{ background: 'white', padding: '16px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', position: 'relative', cursor: 'pointer' }}
                >
                  {/* 🔴 RED THEME ACCENT LINE */}
                  <div style={{ position: 'absolute', top: 0, left: '20px', width: '40px', height: '3px', background: '#ef4444', borderBottomLeftRadius: '4px', borderBottomRightRadius: '4px' }}></div>
                  
                  {/* LINE 1: Title & Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', marginTop: '4px' }}>
                    <div style={{ flex: 1, paddingRight: '10px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '800', letterSpacing: '0.5px' }}>ORDER #{order._id.slice(-5).toUpperCase()}</div>
                      <h4 style={{ margin: '2px 0 0 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {order.shopId?.name || "Local Shop"}
                      </h4>
                    </div>
                    
                    <div style={{ background: order.status.includes('Ready') ? '#ecfdf5' : '#fef2f2', color: order.status.includes('Ready') ? '#10b981' : '#ef4444', padding: '4px 10px', borderRadius: '12px', fontWeight: '800', fontSize: '0.75rem', whiteSpace: 'nowrap', flexShrink: 0, border: order.status.includes('Ready') ? '1px solid #d1fae5' : '1px solid #fee2e2' }}>
                      {order.status}
                    </div>
                  </div>

                  {/* LINE 2: Stats & Action Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px dashed #f1f5f9' }}>
                    <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>
                      <span style={{ color: '#0f172a', fontWeight: '800' }}>{order.items?.length || 0} items</span> • ₹{order.totalAmount || 0}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* ❌ CANCEL BUTTON (Only for Pending orders) */}
                      {isPending && onCancelOrder && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancelOrder(order._id);
                          }}
                          style={{ backgroundColor: '#fff', color: '#64748b', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      )}

                      {order.shopId && (
                        <a href={`tel:${order.shopId.phone}`} onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#f8fafc', color: '#0f172a', padding: '6px 10px', borderRadius: '10px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '800', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          📞 Call
                        </a>
                      )}
                      <button style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)' }}>
                        Bill ›
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 📜 COLLAPSIBLE PAST ORDERS */}
      <div 
        onClick={() => setShowPastOrders(!showPastOrders)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: 'white', padding: '16px 20px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0', marginBottom: '15px' }}
      >
        <h3 style={{ color: '#0f172a', fontSize: '1rem', fontWeight: '800', margin: 0 }}>📜 Past Orders History</h3>
        <span style={{ fontSize: '1rem', transform: showPastOrders ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s', color: '#64748b' }}>▼</span>
      </div>

      {showPastOrders && (
        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
          {loading ? ( <p style={{ color: '#64748b', textAlign: 'center', padding: '20px', fontWeight: '600' }}>Loading history...</p> ) : pastOrders.length === 0 ? (
            <div style={{ background: 'white', padding: '20px', borderRadius: '16px', textAlign: 'center', color: '#94a3b8', border: '1px dashed #cbd5e1' }}>No past orders found.</div>
          ) : (
            pastOrders.map((order, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedOrder(order)} 
                style={{ background: 'white', padding: '14px', borderRadius: '16px', marginBottom: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: '1px solid #f1f5f9' }}
              >
                <div>
                  <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{order.shopId?.name || "Local Shop"}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '3px', fontWeight: '500' }}>
                    {new Date(order.createdAt).toLocaleDateString()} • <span style={{ fontWeight: '700', color: '#0f172a' }}>₹{order.totalAmount || 0}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {order.status?.includes('✅') && !order.isReviewed && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); 
                        if(onOpenReview) onOpenReview(order);
                      }}
                      style={{ padding: '6px 12px', backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '10px', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      ⭐ Rate
                    </button>
                  )}
                  <div style={{ color: '#94a3b8', fontSize: '1.2rem' }}>›</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
                      }

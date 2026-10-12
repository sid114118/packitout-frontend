import React, { useState } from 'react';
import { useOrderAlarm } from '../../utils/orderAlarm.js';
import { cdnImage } from '../../utils/cloudinaryUrl.js';
import OrderChatDrawer from '../Chat/OrderChatDrawer.jsx';
import SubstitutePickerModal from './SubstitutePickerModal.jsx';

const formatArrivedAgo = (isoDate) => {
  if (!isoDate) return '';
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 min ago';
  return `${diffMins}m ago`;
};

export default function OrdersTab({ orders, updateOrderStatus, markOrderPaid, shopData, refreshOrders }) {
  const [showPastOrders, setShowPastOrders] = useState(false);
  const [activeChatOrder, setActiveChatOrder] = useState(null);
  const [substituteTarget, setSubstituteTarget] = useState(null); // { order, itemIndex }


  // Split orders into Active and Past based on their status. Active orders are
  // sorted so customers physically waiting at the counter float to the very top,
  // followed by urgent pickups, and finally chronological order.
  const activeOrders = orders
    .filter(o => !o.status?.includes('✅') && !o.status?.includes('❌'))
    .sort((a, b) => {
      // 📍 1. Customer physically arrived at counter takes absolute top priority
      const aArr = a.customerArrivedAt ? 0 : 1;
      const bArr = b.customerArrivedAt ? 0 : 1;
      if (aArr !== bArr) return aArr - bArr;

      // ⚡ 2. Urgent orders next
      const au = a.isUrgent ? 0 : 1;
      const bu = b.isUrgent ? 0 : 1;
      if (au !== bu) return au - bu;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  const pastOrders = orders.filter(o => o.status?.includes('✅') || o.status?.includes('❌'));

  // 🚨 ALARM: ring while any order is still Pending (shop hasn't accepted/rejected).
  // Stops the instant every pending order gets Accept or Cancel.
  const pendingOrders = activeOrders.filter(o => o.status === 'Pending');
  const pendingCount = pendingOrders.length;
  const { muted, setMuted, needsUnlock, unlock } = useOrderAlarm(pendingCount > 0);

  const OrderCard = ({ order, isActive }) => {
    // Safely extract customer info
    const customerName = order.userId?.name || "Customer";
    const customerPhone = order.userId?.phone || "No phone";
    const customerAddress = order.userId?.address || "No address provided";

    // Payment state matrix:
    //   POP + Unpaid              → "✋ Collect at Pickup"
    //   POP + Paid (after pickup) → "💵 Paid in Person"
    //   UPI + PendingVerification → "⏳ Awaiting UPI Confirmation" (shop confirms)
    //   UPI + Paid                → "💳 UPI Received"
    const isPaid = order.paymentStatus === 'Paid' || order.paymentStatus === 'Success';
    const isUpiPending = order.paymentMethod === 'UPI' && order.paymentStatus === 'PendingVerification';
    let payBadge = { label: '✋ Collect at Pickup', bg: '#ffedd5', fg: '#c2410c', border: '#fed7aa' };
    if (isPaid && order.paymentMethod === 'UPI') payBadge = { label: '💳 UPI Received', bg: '#d1fae5', fg: '#059669', border: '#a7f3d0' };
    else if (isPaid) payBadge = { label: '💵 Paid in Person', bg: '#d1fae5', fg: '#059669', border: '#a7f3d0' };
    else if (isUpiPending) payBadge = { label: '⏳ Awaiting UPI', bg: '#fef9c3', fg: '#854d0e', border: '#fde68a' };

    // 🕒 Pickup time (set by customer at checkout)
    const isUrgent = Boolean(order.isUrgent);
    const isArrived = Boolean(order.customerArrivedAt) && isActive;
    const shortId = (order._id || '').slice(-5).toUpperCase();
    const pickupAt = order.pickupTime ? new Date(order.pickupTime) : null;
    const pickupValid = pickupAt && !Number.isNaN(pickupAt.getTime());
    const pickupClock = pickupValid ? pickupAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : null;

    return (
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '16px',
        boxShadow: isArrived ? '0 8px 24px rgba(245, 158, 11, 0.22)' : '0 4px 15px rgba(0,0,0,0.05)',
        border: isArrived ? '2.5px solid #f59e0b' : (isUrgent && isActive ? '2px solid #ef4444' : isActive ? '2px solid #10b981' : '1px solid #e2e8f0'),
        marginBottom: '15px',
        position: 'relative'
      }}>

        {/* 📍 CUSTOMER AT COUNTER BANNER */}
        {isArrived && (
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#fff',
            padding: '11px 14px',
            borderRadius: '12px',
            fontWeight: 900,
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            boxShadow: '0 6px 16px rgba(217, 119, 6, 0.32)',
            border: '1px solid #fbbf24',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.3rem' }}>📍</span>
              <div>
                <div style={{ fontSize: '0.92rem', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                  Customer Waiting at Counter
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.95, marginTop: '2px' }}>
                  Pickup Token: <span style={{ background: '#fff', color: '#b45309', padding: '2px 8px', borderRadius: '6px', fontWeight: 900, fontSize: '0.95rem' }}>#{shortId}</span>
                </div>
              </div>
            </div>
            <span style={{ background: 'rgba(0,0,0,0.22)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 800 }}>
              {formatArrivedAgo(order.customerArrivedAt)}
            </span>
          </div>
        )}

        {/* 🚨 URGENT banner — only for active urgent orders (when not arrived) */}
        {!isArrived && isUrgent && isActive && (
          <div style={{ background: 'linear-gradient(90deg, #ef4444, #dc2626)', color: '#fff', padding: '10px 12px', borderRadius: '10px', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', boxShadow: '0 6px 16px rgba(239, 68, 68, 0.25)' }}>
            <span>⚡ URGENT — Customer wants this ASAP</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>~15 min</span>
          </div>
        )}

        {/* Header: Order ID & Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>
              ORDER #{order._id.slice(-5).toUpperCase()}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
              {new Date(order.createdAt).toLocaleString()}
            </div>
          </div>
          <div style={{ backgroundColor: isActive ? '#ecfdf5' : '#f1f5f9', color: isActive ? '#059669' : '#475569', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem' }}>
            {order.status}
          </div>
        </div>

        {/* 🕒 Scheduled pickup row — shown when customer picked a specific time */}
        {!isUrgent && pickupClock && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 12px', borderRadius: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '1.2rem' }}>🕒</span>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Customer Pickup</div>
              <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.95rem', marginTop: '2px' }}>at {pickupClock}</div>
            </div>
          </div>
        )}

        {/* Customer Details & Chat Button */}
        <div style={{ marginBottom: '15px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
          <div>
            <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>👤 {customerName}</div>
            <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '4px' }}>📞 <a href={`tel:${customerPhone}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>{customerPhone}</a></div>
            <div style={{ fontSize: '0.85rem', color: '#475569' }}>📍 {customerAddress}</div>
          </div>
          <button
            onClick={() => setActiveChatOrder(order)}
            style={{
              backgroundColor: '#25d366',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 12px',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)',
              flexShrink: 0
            }}
          >
            <span>💬 Chat</span>
            {Number(order.unreadCountShop) > 0 && (
              <span style={{
                backgroundColor: '#ef4444',
                color: '#fff',
                borderRadius: '999px',
                padding: '1px 6px',
                fontSize: '0.7rem',
                fontWeight: 900
              }}>
                {order.unreadCountShop}
              </span>
            )}
          </button>
        </div>

        {/* Items List */}
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#334155' }}>Items:</h4>
          {order.items && order.items.length > 0 ? (
            order.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#475569', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {(item.image || item.product?.image) ? (
                    <img src={cdnImage(item.image || item.product?.image, 100)} alt={item.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', backgroundColor: '#f8fafc' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📦</div>
                  )}
                  <div>
                    <span style={{ fontWeight: '500', color: '#1e293b' }}>{item.qty}x {item.name}</span>
                    {item.substitutedFrom && (
                      <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 800 }}>
                        ✓ Substituted for {item.substitutedFrom}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '700', color: '#0f172a' }}>₹{(item.price || item.sellingPrice || item.mrp || 0) * item.qty}</span>
                  {isActive && (
                    <button
                      onClick={() => setSubstituteTarget({ order, itemIndex: idx })}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        boxShadow: '0 1px 3px rgba(37, 99, 235, 0.1)'
                      }}
                      title="Suggest substitute item if out of stock"
                    >
                      ⇄ Swap
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>Custom Parchi Order</div>
          )}

          {/* Parchi Image Link */}
          {order.imageUrl && (
            <a href={order.imageUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '8px', fontSize: '0.85rem', color: '#3b82f6', fontWeight: '600', textDecoration: 'none' }}>
              🖼️ View Original Parchi Image
            </a>
          )}
        </div>

        {/* Total & Payment Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '15px', paddingBottom: isActive ? '15px' : '0' }}>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#0f172a' }}>
              ₹{order.totalAmount}
            </div>
            {order.adjustedDelta ? (
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: order.adjustedDelta > 0 ? '#ea580c' : '#16a34a' }}>
                {order.adjustedDelta > 0 ? `(+₹${order.adjustedDelta} adjusted in chat)` : `(-₹${Math.abs(order.adjustedDelta)} adjusted in chat)`}
              </div>
            ) : null}
          </div>

          {/* 💳 PAYMENT BADGE */}
          <div style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '800', backgroundColor: payBadge.bg, color: payBadge.fg, border: `1px solid ${payBadge.border}` }}>
            {payBadge.label}
          </div>
        </div>

        {/* UPI confirmation strip — shop sees this for UPI orders the customer
            tapped "I've paid" on but the shop hasn't verified in their UPI app
            yet. One tap confirms receipt and notifies the customer. */}
        {isUpiPending && isActive && (
          <div style={{ marginTop: '12px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px' }}>
            <div style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: 800, marginBottom: '6px' }}>
              💸 Customer says they paid ₹{order.totalAmount} via UPI
            </div>
            <div style={{ fontSize: '0.75rem', color: '#92400e', marginBottom: '10px' }}>
              Open your UPI app to confirm the money landed, then tap below.
            </div>
            <button
              onClick={() => markOrderPaid && markOrderPaid(order._id)}
              style={{ width: '100%', padding: '10px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}
            >
              ✅ Yes, I received the UPI payment
            </button>
          </div>
        )}

        {/* 🚀 EXPLICIT ACTION BUTTONS (Only for Active Orders) */}
        {isActive && (() => {
          const isPending = order.status === 'Pending';
          return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderTop: '1px dashed #e2e8f0', paddingTop: '15px' }}>

              {/* Pending orders only show Accept + Cancel until the shop confirms.
                  Once accepted, the rest of the workflow appears. */}
              {isPending ? (
                <>
                  <button
                    onClick={() => updateOrderStatus(order._id, 'Accepted 👨‍🍳')}
                    style={{ flex: '1 1 100%', padding: '14px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', fontSize: '1.05rem', boxShadow: '0 6px 16px rgba(22, 163, 74, 0.32)' }}
                  >
                    👨‍🍳 Accept Order
                  </button>

                  <button
                    onClick={() => updateOrderStatus(order._id, 'Cancelled ❌')}
                    style={{ flex: '1 1 100%', padding: '10px', backgroundColor: 'transparent', color: '#ef4444', border: '1px dashed #fca5a5', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', marginTop: '4px' }}
                  >
                    ❌ Cancel Order
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => updateOrderStatus(order._id, 'Packing 📦')}
                    style={{ flex: '1 1 45%', padding: '10px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
                  >
                    📦 Packing
                  </button>

                  <button
                    onClick={() => updateOrderStatus(order._id, 'Ready to Collect 🛍️')}
                    style={{ flex: '1 1 45%', padding: '10px', backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
                  >
                    🛍️ Ready
                  </button>

                  <button
                    onClick={() => updateOrderStatus(order._id, 'Picked Up ✅')}
                    style={{
                      flex: '1 1 100%',
                      padding: isArrived ? '14px' : '12px',
                      backgroundColor: isArrived ? (!isPaid && order.paymentMethod === 'POP' ? '#ea580c' : '#16a34a') : '#0c831f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      fontSize: isArrived ? '1.02rem' : '1rem',
                      boxShadow: isArrived ? '0 6px 16px rgba(234, 88, 12, 0.3)' : '0 4px 10px rgba(12, 131, 31, 0.2)',
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {isArrived
                      ? (!isPaid && order.paymentMethod === 'POP'
                          ? `💵 Collect ₹${order.totalAmount} & Hand Over (Token #${shortId}) ✅`
                          : `📦 Hand Over Order (Token #${shortId}) ✅`)
                      : '✅ Mark as Picked Up'}
                  </button>

                  <button
                    onClick={() => updateOrderStatus(order._id, 'Cancelled ❌')}
                    style={{ flex: '1 1 100%', padding: '10px', backgroundColor: 'transparent', color: '#ef4444', border: '1px dashed #fca5a5', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', marginTop: '4px' }}
                  >
                    ❌ Cancel Order
                  </button>
                </>
              )}
            </div>
          );
        })()}

      </div>
    );
  };

  return (
    <div>
      {/* 🚨 ALARM BANNER — sticks at top while there are unaccepted orders */}
      {pendingCount > 0 && (
        <div style={{
          position: 'sticky', top: 0, zIndex: 50, marginBottom: '15px',
          background: 'linear-gradient(90deg, #ef4444, #dc2626)', color: '#fff',
          padding: '14px 16px', borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(239, 68, 68, 0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          animation: 'alarmPulse 1.2s ease-in-out infinite',
        }}>
          <style>{`@keyframes alarmPulse { 0%, 100% { box-shadow: 0 10px 25px rgba(239, 68, 68, 0.35); } 50% { box-shadow: 0 10px 35px rgba(239, 68, 68, 0.7); } }`}</style>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <span style={{ fontSize: '1.4rem' }}>🚨</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>
                {pendingCount} new order{pendingCount > 1 ? 's' : ''} waiting
              </div>
              <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>Tap Accept or Cancel to silence</div>
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

      {/* 🔓 AUDIO UNLOCK & TEST BANNER (Shown when no orders) */}
      {pendingCount === 0 && !muted && (
        <div style={{
          backgroundColor: needsUnlock ? '#fef9c3' : '#f0fdf4', border: needsUnlock ? '1px solid #fde68a' : '1px solid #bbf7d0', color: needsUnlock ? '#854d0e' : '#166534',
          padding: '12px 16px', borderRadius: '12px', marginBottom: '15px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>{needsUnlock ? '🔇' : '🔊'}</span>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                {needsUnlock ? 'Alarms are muted by your browser' : 'Audio Alarm is active'}
              </div>
              <div style={{ fontSize: '0.8rem' }}>
                {needsUnlock ? 'Tap to unlock so you hear new orders.' : 'You will hear a chime when an order arrives.'}
              </div>
            </div>
          </div>
          <button
            onClick={unlock}
            style={{ background: needsUnlock ? '#ca8a04' : '#16a34a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {needsUnlock ? '🔊 Enable Alarms' : '🎵 Test Alarm'}
          </button>
        </div>
      )}

      {/* 🚀 ACTIVE ORDERS */}
      <h3 style={{ color: '#0f172a', fontSize: '1.2rem', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
        Live Orders <span>{activeOrders.length}</span>
      </h3>

      {activeOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1', color: '#94a3b8', marginBottom: '30px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>☕</div>
          <div style={{ fontWeight: 'bold', color: '#475569' }}>No active orders</div>
          <div style={{ fontSize: '0.85rem' }}>Waiting for customers to place an order...</div>
        </div>
      ) : (
        <div style={{ marginBottom: '30px' }}>
          {activeOrders.map(order => <OrderCard key={order._id} order={order} isActive={true} />)}
        </div>
      )}

      {/* 📜 PAST ORDERS (COLLAPSIBLE) */}
      <div
        onClick={() => setShowPastOrders(!showPastOrders)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: 'white', padding: '15px 20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0', marginBottom: '15px' }}
      >
        <h3 style={{ color: '#334155', fontSize: '1.1rem', margin: 0 }}>📜 Past Orders ({pastOrders.length})</h3>
        <span style={{ fontSize: '1.2rem', transform: showPastOrders ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
          🔽
        </span>
      </div>

      {showPastOrders && (
        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          {pastOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No completed orders yet.</div>
          ) : (
            pastOrders.map(order => <OrderCard key={order._id} order={order} isActive={false} />)
          )}
        </div>
      )}

      {/* 🔄 SUBSTITUTE PICKER MODAL */}
      {substituteTarget && (
        <SubstitutePickerModal
          open={Boolean(substituteTarget)}
          order={substituteTarget.order}
          itemIndex={substituteTarget.itemIndex}
          shopData={shopData}
          onClose={() => setSubstituteTarget(null)}
          onProposalSent={(msg) => {
            if (refreshOrders) refreshOrders();
            // Automatically open chat drawer so shopkeeper sees proposal
            setActiveChatOrder(substituteTarget.order);
          }}
        />
      )}

      {/* 💬 IN-APP WHATSAPP-STYLE CHAT DRAWER */}
      {activeChatOrder && (
        <OrderChatDrawer
          orderId={activeChatOrder._id}
          role="shop"
          sessionShop={shopData}
          orderData={activeChatOrder}
          onClose={() => setActiveChatOrder(null)}
          onOrderUpdated={(updated) => {
            if (refreshOrders) refreshOrders();
            setActiveChatOrder(updated);
          }}
        />
      )}
    </div>
  );
}

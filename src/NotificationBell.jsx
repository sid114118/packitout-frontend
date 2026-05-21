import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { userFetch, shopFetch } from './utils/api.js';

// Convert a date-ish value into "just now" / "5 min ago" / "2 hr ago" / "3 d ago" / fallback date.
function relativeTime(ts) {
  if (!ts) return '';
  const date = new Date(ts);
  if (isNaN(date.getTime())) return '';
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} d ago`;
  return date.toLocaleDateString();
}

// Pick an icon based on notification.type or a keyword in title.
function iconFor(n) {
  const type = String(n?.type || '').toLowerCase();
  const title = String(n?.title || '').toLowerCase();
  const msg = String(n?.message || '').toLowerCase();
  const blob = `${type} ${title} ${msg}`;
  if (/promo|offer|discount|coin|reward/.test(blob)) return '🎉';
  if (/cancel|reject|fail|error|out of stock/.test(blob)) return '🚫';
  if (/pick(?:ed)?[\s-]*up|deliver/.test(blob)) return '🛍️';
  if (/payment|paid|refund/.test(blob)) return '💳';
  if (/review|rating/.test(blob)) return '⭐';
  return '📦';
}

// Best-effort: try common keys that backend might use to link a notification to an order.
function relatedOrderId(n) {
  return n?.orderId || n?.orderID || n?.relatedOrderId || n?.order?._id || null;
}

// `owner` is the user or shop object — needed for the bearer token. `ownerType`
// drives which fetch helper / endpoint is hit. Legacy `ownerId` prop is still
// honoured for compatibility, but auth headers won't be sent without `owner`.
export default function NotificationBell({ ownerType, owner, ownerId }) {
  const effectiveOwner = owner || (ownerId ? { _id: ownerId } : null);
  const effectiveId = effectiveOwner?._id;

  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Tear down any previous interval before we start a new one. Without this,
    // switching ownerId (rare but possible — e.g. logout then re-login as a
    // different user without unmounting the bell) stacked up parallel polls.
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!effectiveId) return;

    const doFetch = ownerType === 'shop' ? shopFetch : userFetch;
    const fetchNotifications = async () => {
      try {
        const res = await doFetch(effectiveOwner, `/notifications/${ownerType}/${effectiveId}`);
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setNotifications(list);
        setUnreadCount(list.filter(n => !n.isRead).length);
      } catch (err) {
        console.log("Failed to fetch notifications:", err);
      }
    };

    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 5000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [effectiveId, ownerType, effectiveOwner]);

  const openPanel = async () => {
    setShowPanel(true);
    if (unreadCount <= 0) return;
    // Optimistic: clear badge immediately so user gets instant feedback.
    const prevList = notifications;
    const prevUnread = unreadCount;
    setUnreadCount(0);
    setNotifications(list => list.map(n => ({ ...n, isRead: true })));
    try {
      const doFetch = ownerType === 'shop' ? shopFetch : userFetch;
      const res = await doFetch(effectiveOwner, `/notifications/read-all`, {
        method: "PATCH",
        body: JSON.stringify({ [ownerType === 'user' ? 'userId' : 'shopId']: effectiveId })
      });
      if (!res.ok) throw new Error('mark-all-read failed');
    } catch (err) {
      // Roll back the optimistic update so the badge truthfully reflects state.
      setNotifications(prevList);
      setUnreadCount(prevUnread);
      console.log(err);
    }
  };

  const closePanel = () => {
    if (window.history.state?.name === 'notifPanel') {
      window.history.back();
    } else {
      setShowPanel(false);
    }
  };

  // Lock body scroll + integrate with device back button while the panel is open.
  useEffect(() => {
    if (!showPanel) return;
    document.body.style.overflow = 'hidden';
    if (window.history.state?.name !== 'notifPanel') {
      window.history.pushState({ name: 'notifPanel' }, '');
    }
    const handlePop = () => setShowPanel(false);
    window.addEventListener('popstate', handlePop);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('popstate', handlePop);
    };
  }, [showPanel]);

  const handleNotificationTap = (n) => {
    const orderId = relatedOrderId(n);
    // Customers land on the Orders page; shops land on their dashboard's orders tab
    // (existing convention — ShopDashboard reads the hash but here we just close).
    if (orderId || /order/i.test(n?.title || '') || /order/i.test(n?.message || '')) {
      if (ownerType === 'user') {
        closePanel();
        setTimeout(() => { window.location.hash = '#orders'; }, 100);
      } else {
        closePanel();
      }
    } else if (n?.link && typeof n.link === 'string') {
      closePanel();
      setTimeout(() => { window.location.hash = n.link; }, 100);
    }
  };

  const cartBadge = unreadCount > 99 ? '99+' : unreadCount;

  return (
    <>
      <button
        onClick={openPanel}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', position: 'relative', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '0', right: '0', background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', fontWeight: '800', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {cartBadge}
          </span>
        )}
      </button>

      {showPanel && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Notifications"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#f4f6f8',
            zIndex: 9999999,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            animation: 'nbSlideUp 0.22s cubic-bezier(0.32,0.72,0,1)',
          }}
        >
          <style>{`
            @keyframes nbSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
            @keyframes nbFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
          `}</style>

          {/* Header */}
          <header style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '14px 16px',
            paddingTop: 'max(14px, env(safe-area-inset-top))',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
          }}>
            <button
              onClick={closePanel}
              aria-label="Back"
              style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#0f172a', padding: '4px', display: 'flex', alignItems: 'center' }}
            >
              ←
            </button>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.2px' }}>
              Notifications
            </h2>
            {notifications.length > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>
                {notifications.length}
              </span>
            )}
          </header>

          {/* List */}
          <main style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '12px',
            paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          }}>
            {notifications.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#94a3b8', textAlign: 'center' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>📭</div>
                <p style={{ fontSize: '1.05rem', fontWeight: 700, color: '#475569', margin: '0 0 6px 0' }}>No notifications yet</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 500, margin: 0, maxWidth: '260px', lineHeight: 1.5 }}>
                  We'll let you know here when something happens with your orders.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {notifications.map((n, idx) => {
                  const ts = n.createdAt || n.timestamp || n.time || n.date;
                  const time = relativeTime(ts);
                  const icon = iconFor(n);
                  const isUnread = !n.isRead;
                  const canTap = !!relatedOrderId(n) || /order/i.test(n.title || '') || /order/i.test(n.message || '') || !!n.link;

                  return (
                    <div
                      key={n._id || idx}
                      onClick={() => canTap && handleNotificationTap(n)}
                      role={canTap ? 'button' : undefined}
                      tabIndex={canTap ? 0 : undefined}
                      onKeyDown={(e) => { if (canTap && (e.key === 'Enter' || e.key === ' ')) handleNotificationTap(n); }}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '14px',
                        backgroundColor: '#ffffff',
                        borderRadius: '14px',
                        boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
                        border: isUnread ? '1px solid #bbf7d0' : '1px solid #f1f5f9',
                        cursor: canTap ? 'pointer' : 'default',
                        animation: 'nbFadeIn 0.18s ease',
                        position: 'relative',
                      }}
                    >
                      <div
                        aria-hidden="true"
                        style={{
                          flexShrink: 0,
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          backgroundColor: isUnread ? '#f0fdf4' : '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.3rem',
                        }}
                      >
                        {icon}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          {isUnread && (
                            <span
                              aria-label="Unread"
                              style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a', flexShrink: 0, boxShadow: '0 0 0 3px rgba(22,163,74,0.15)' }}
                            />
                          )}
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {n.title || 'Notification'}
                          </div>
                          {canTap && (
                            <span aria-hidden="true" style={{ color: '#94a3b8', fontSize: '1.1rem', fontWeight: 700, flexShrink: 0 }}>›</span>
                          )}
                        </div>
                        {n.message && (
                          <div style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, fontWeight: 500, marginBottom: time ? '8px' : 0, wordBreak: 'break-word' }}>
                            {n.message}
                          </div>
                        )}
                        {time && (
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.2px' }}>
                            {time}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>,
        document.body
      )}
    </>
  );
}

import React, { useState, useEffect } from 'react';

// ownerType should be either "user" or "shop"
// ownerId is the _id of the user or shop
export default function NotificationBell({ ownerType, ownerId }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";

  useEffect(() => {
    if (ownerId) fetchNotifications();
    // Optional: Auto-refresh notifications every 30 seconds
    const interval = setInterval(() => { if (ownerId) fetchNotifications(); }, 30000);
    return () => clearInterval(interval);
  }, [ownerId]);

  const fetchNotifications = async () => {
    try {
      const endpoint = ownerType === "user" ? `/notifications/user/${ownerId}` : `/notifications/shop/${ownerId}`;
      const res = await fetch(`${BASE_URL}${endpoint}`);
      if (res.ok) setNotifications(await res.json());
    } catch (err) { console.log("Failed to fetch notifications"); }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${BASE_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ownerType === "user" ? { userId: ownerId } : { shopId: ownerId })
      });
      // Update local state to remove red dots
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) { console.log("Failed to mark as read"); }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{ position: 'relative' }}>
      
      {/* 🔔 The Bell Icon */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', fontSize: '1.2rem', position: 'relative', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '-2px', right: '-2px', backgroundColor: '#ef4444', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px solid white' }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* 📋 The Dropdown Panel */}
      {isOpen && (
        <div style={{ position: 'absolute', top: '55px', right: '0', width: '300px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', zIndex: 100, overflow: 'hidden' }}>
          
          <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, color: '#0f172a' }}>Notifications</h4>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>Mark all read</button>
            )}
          </div>

          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>No new notifications</div>
            ) : (
              notifications.map(n => (
                <div key={n._id} style={{ padding: '15px', borderBottom: '1px solid #f1f5f9', backgroundColor: n.isRead ? 'white' : '#f0f9ff', transition: '0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>{n.title}</strong>
                    {!n.isRead && <span style={{ width: '8px', height: '8px', backgroundColor: '#3b82f6', borderRadius: '50%' }}></span>}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{n.message}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '6px' }}>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
                  }

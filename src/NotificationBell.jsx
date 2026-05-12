import React, { useState, useEffect } from 'react';

export default function NotificationBell({ ownerType, ownerId }) {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

  useEffect(() => {
    if (!ownerId) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${BASE_URL}/notifications/${ownerType}/${ownerId}`);
        const data = await res.json();
        
        setNotifications(data);
        
        // Quietly update the red badge number (no audio!)
        const unread = data.filter(n => !n.isRead).length;
        setUnreadCount(unread);
        
      } catch (err) { 
        console.log("Failed to fetch notifications:", err); 
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Silent sync every 5 seconds
    return () => clearInterval(interval);
  }, [ownerId, ownerType]);

  const markAsRead = async () => {
    setShowDropdown(!showDropdown);
    if (unreadCount > 0) {
      try {
        await fetch(`${BASE_URL}/notifications/read-all`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [ownerType === 'user' ? 'userId' : 'shopId']: ownerId })
        });
        
        setUnreadCount(0);
        // Instantly turn all messages white in the dropdown
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        
      } catch (err) { 
        console.log(err); 
      }
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <button onClick={markAsRead} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', position: 'relative', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        🔔
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '0', right: '0', background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', fontWeight: '800', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div style={{ position: 'absolute', right: 0, top: '45px', width: '280px', background: 'white', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 1000, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
          <div style={{ padding: '14px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontWeight: '800', color: '#0f172a', fontSize: '0.95rem' }}>
            Notifications History
          </div>
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <div key={n._id} style={{ padding: '14px', borderBottom: '1px solid #f1f5f9', backgroundColor: n.isRead ? 'transparent' : '#f0fdf4', transition: 'background 0.2s' }}>
                  <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0f172a', marginBottom: '4px' }}>{n.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4', fontWeight: '500' }}>{n.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

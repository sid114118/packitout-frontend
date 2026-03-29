import React, { useState, useEffect, useRef } from 'react';

export default function NotificationBell({ ownerType, ownerId }) {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevCountRef = useRef(0);
  
  // 🔊 Audio Setup (Using a public short ding sound)
  const ding = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");

  const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";

  useEffect(() => {
    if (!ownerId) return;

    // Request browser notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${BASE_URL}/notifications/${ownerType}/${ownerId}`);
        const data = await res.json();
        setNotifications(data);
        
        const unread = data.filter(n => !n.isRead).length;
        
        // 🔔 Trigger "Ding" and Browser Notification if new items arrive
        if (unread > prevCountRef.current) {
          ding.play().catch(e => console.log("Audio play blocked"));
          
          if (Notification.permission === "granted") {
            new Notification(data[0].title, { body: data[0].message });
          }
        }
        
        setUnreadCount(unread);
        prevCountRef.current = unread;
      } catch (err) { console.log(err); }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Check every 5 seconds
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
        prevCountRef.current = 0;
      } catch (err) { console.log(err); }
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={markAsRead} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', position: 'relative', padding: '5px' }}>
        🔔
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '0', right: '0', background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', fontWeight: 'bold', border: '2px solid white' }}>
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div style={{ position: 'absolute', right: 0, top: '45px', width: '280px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 1000, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', color: '#1e293b' }}>Notifications</div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>No notifications yet</div>
            ) : (
              notifications.map(n => (
                <div key={n._id} style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', backgroundColor: n.isRead ? 'transparent' : '#f0fdf4' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#0f172a' }}>{n.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{n.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

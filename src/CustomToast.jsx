import React, { useEffect } from 'react';

export default function CustomToast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000); // Auto-close after 3 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? '#16a34a' : '#ef4444'; // Green for success, Red for error

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: bgColor,
      color: 'white',
      padding: '12px 24px',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      zIndex: 999999,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontWeight: '700',
      fontSize: '0.95rem',
      animation: 'slideDown 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)'
    }}>
      <style>{`
        @keyframes slideDown {
          from { transform: translate(-50%, -100px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
      <span>{type === 'success' ? '✅' : '❌'}</span>
      {message}
    </div>
  );
}

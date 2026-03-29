import React from 'react';

export default function Footer() {
  return (
    <footer style={footerStyle}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* --- BRANDING SECTION --- */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.8rem', margin: '0 0 10px 0', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <span>📦</span> PackItOut
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0, lineHeight: '1.5', padding: '0 20px' }}>
            Your daily essentials, delivered at lightning speed. Fresh, fast, and strictly reliable.
          </p>
        </div>

        {/* --- TRUST BADGES SECTION --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '30px' }}>
          
          <div style={badgeCardStyle}>
            <div style={badgeIconStyle}>⚡</div>
            <div style={badgeTitleStyle}>Superfast</div>
            <div style={badgeSubTextStyle}>Delivery</div>
          </div>

          <div style={badgeCardStyle}>
            <div style={badgeIconStyle}>🛡️</div>
            <div style={badgeTitleStyle}>100% Secure</div>
            <div style={badgeSubTextStyle}>Payments</div>
          </div>

          <div style={badgeCardStyle}>
            <div style={badgeIconStyle}>🍎</div>
            <div style={badgeTitleStyle}>Premium</div>
            <div style={badgeSubTextStyle}>Quality</div>
          </div>

        </div>

        {/* --- DIVIDER --- */}
        <div style={{ height: '1px', backgroundColor: '#334155', marginBottom: '20px' }}></div>

        {/* --- COPYRIGHT & LINKS --- */}
        <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <span style={{ cursor: 'pointer' }}>Terms of Service</span>
            <span>•</span>
            <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
            <span>•</span>
            <span style={{ cursor: 'pointer' }}>Help Center</span>
          </div>
          <div style={{ marginTop: '10px' }}>
            © 2026 PackItOut. All rights reserved.
          </div>
          <div style={{ fontWeight: 'bold', color: '#cbd5e1', marginTop: '5px' }}>
            Made with ❤️ in India
          </div>
        </div>

      </div>
    </footer>
  );
}

// --- CSS STYLES ---

const footerStyle = {
  backgroundColor: '#0f172a', // Deep premium slate/dark blue
  color: '#f8fafc',
  padding: '40px 15px 110px 15px', // 🚨 110px bottom padding ensures the floating cart doesn't cover the text!
  borderTopLeftRadius: '25px',
  borderTopRightRadius: '25px',
  marginTop: '40px',
  boxShadow: '0 -4px 20px rgba(0,0,0,0.05)'
};

const badgeCardStyle = {
  backgroundColor: '#1e293b',
  padding: '15px 5px',
  borderRadius: '12px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  border: '1px solid #334155'
};

const badgeIconStyle = {
  fontSize: '1.5rem',
  marginBottom: '8px'
};

const badgeTitleStyle = {
  fontSize: '0.75rem',
  fontWeight: 'bold',
  color: '#f1f5f9',
  textTransform: 'uppercase'
};

const badgeSubTextStyle = {
  fontSize: '0.65rem',
  color: '#94a3b8'
};

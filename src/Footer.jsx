import React from 'react';

export default function Footer() {
  return (
    <footer style={{ 
        backgroundColor: '#111827', // Premium dark slate background
        color: '#f8fafc', 
        padding: '40px 20px 90px 20px', // 👈 90px bottom padding clears your sticky nav!
        marginTop: '20px',
        fontFamily: 'sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* 🌟 BRAND SECTION */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#fff', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>
            PackIt<span style={{ color: '#22c55e' }}>Out</span>
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.5', margin: 0, maxWidth: '300px' }}>
            Your neighborhood quick-commerce partner. Pack online, collect in minutes, skip the line.
          </p>
        </div>

        {/* 🔗 QUICK LINKS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          
          {/* Column 1 */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#fff', marginBottom: '12px' }}>Company</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><a href="#about" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>About Us</a></li>
              <li><a href="#partner" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>Partner with us</a></li>
              <li><a href="#careers" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>Careers</a></li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#fff', marginBottom: '12px' }}>Legal & Help</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><a href="#support" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>Help & Support</a></li>
              <li><a href="#terms" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>Terms & Conditions</a></li>
              <li><a href="#privacy" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>Privacy Policy</a></li>
            </ul>
          </div>

        </div>

        {/* 📞 CONTACT STRIP */}
        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
          <div style={{ fontSize: '1.5rem' }}>💬</div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Need Help?</div>
            <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: '700', marginTop: '2px' }}>support@packitout.com</div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '0 0 20px 0' }} />

        {/* ⚖️ COPYRIGHT */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>
          <span>© {new Date().getFullYear()} PackItOut. All rights reserved.</span>
          <span style={{ display: 'flex', gap: '15px', fontSize: '1.2rem' }}>
            {/* Fake social icons */}
            <span style={{ cursor: 'pointer' }}>📸</span>
            <span style={{ cursor: 'pointer' }}>🐦</span>
            <span style={{ cursor: 'pointer' }}>💼</span>
          </span>
        </div>

      </div>
    </footer>
  );
}

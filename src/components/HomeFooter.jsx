import React, { useState } from 'react';
import StorefrontIcon from '../ui/StorefrontIcon.jsx';

const BRAND = '#16a34a';
const BRAND_DARK = '#15803d';

const TRUST_HIGHLIGHTS = [
  {
    key: 'fast',
    title: '10-Min Quick Pickup',
    subtitle: 'Packed & ready without counter wait',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
      </svg>
    ),
  },
  {
    key: 'local',
    title: '100% Local Dukaan',
    subtitle: 'Direct from verified neighbourhood shops',
    icon: <StorefrontIcon size={22} color={BRAND} />,
  },
  {
    key: 'coins',
    title: 'Loyalty Coins',
    subtitle: 'Earn real coins & discounts every order',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v12M15 9.5a3.5 3.5 0 0 0-5 0c0 2 5 2 5 4a3.5 3.5 0 0 1-5 0" />
      </svg>
    ),
  },
  {
    key: 'parchi',
    title: 'Order via Parchi',
    subtitle: 'Upload handwritten list in 1 tap',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
];

export default function HomeFooter({ endMessage = "You're all caught up", signInNudge = null }) {
  const [activeModal, setActiveModal] = useState(null); // 'privacy' | 'terms' | 'refund' | 'faq' | 'support'

  const scrollTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNav = (hash) => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === hash || (hash === '' && !window.location.hash)) {
        scrollTop();
      } else {
        window.location.hash = hash;
      }
    }
  };

  const handleOpenWhatsAppSupport = () => {
    const text = encodeURIComponent('Namaste PackItOut team! I have a question about my orders / shopping on PackItOut.');
    window.open(`https://wa.me/919999999999?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <footer style={{ background: '#f3f4f6', padding: '10px 14px 125px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* 1. END OF FEED DIVIDER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '16px 0 22px',
        color: '#94a3b8',
        fontSize: '0.74rem',
        fontWeight: 800,
        letterSpacing: '0.6px',
        textTransform: 'uppercase',
      }}>
        <span style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #cbd5e1)' }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={BRAND} aria-hidden="true">
            <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7L2 9.2l7.1-.6L12 2z" />
          </svg>
          {endMessage}
        </span>
        <span style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, #cbd5e1)' }} />
      </div>

      {/* 2. MAIN FOOTER CARD */}
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        padding: '28px 20px 22px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
        boxSizing: 'border-box',
      }}>

        {/* TOP STRIP: APP LOGO + BRAND IDENTITY + BACK TO TOP */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '20px',
          marginBottom: '20px',
        }}>
          {/* Logo & Tagline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 8px 18px rgba(22,163,74,0.28)',
              border: '2px solid #bbf7d0',
              background: '#fff',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img
                src="/icon-192.png"
                alt="PackItOut Logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  // Fallback to Storefront icon if image fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '1.45rem',
                  fontWeight: 900,
                  letterSpacing: '-0.5px',
                  color: '#0f172a',
                }}>
                  Pack<span style={{ color: BRAND }}>It</span>Out
                </span>
                <span style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                }}>
                  Official
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                Aapka Digital Kirana & Local Shopping Partner
              </div>
            </div>
          </div>

          {/* Back to top button */}
          <button
            type="button"
            onClick={scrollTop}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: '#f8fafc',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '999px',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
            Back to Top
          </button>
        </div>

        {/* 3. TRUST HIGHLIGHT PILLS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '10px',
          marginBottom: '24px',
        }}>
          {TRUST_HIGHLIGHTS.map(b => (
            <div
              key={b.key}
              style={{
                padding: '12px 10px',
                background: '#f0fdf4',
                border: '1px solid #dcfce7',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                textAlign: 'center',
              }}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(22,163,74,0.12)',
              }}>
                {b.icon}
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#0f172a', letterSpacing: '-0.1px' }}>
                {b.title}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, lineHeight: 1.3 }}>
                {b.subtitle}
              </div>
            </div>
          ))}
        </div>

        {/* Sign In Nudge for Guests */}
        {signInNudge && (
          <div style={{
            padding: '14px 16px',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1.5px solid #86efac',
            borderRadius: '16px',
            color: '#065f46',
            fontSize: '0.84rem',
            fontWeight: 800,
            marginBottom: '22px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}>
            <span>✨ {signInNudge}</span>
            <button
              type="button"
              onClick={() => handleNav('#account')}
              style={{
                padding: '6px 14px',
                background: BRAND,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 900,
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              Sign In Now ›
            </button>
          </div>
        )}

        {/* 4. MULTI-COLUMN NAVIGATION LINKS (Like Top E-Commerce Apps) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '20px 16px',
          marginBottom: '26px',
        }}>
          {/* COLUMN 1: SHOP & EXPLORE */}
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>🛍️</span> Shop & Explore
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('#nearby')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                >
                  🏪 Nearby Stores
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('#cart')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                >
                  🛒 Shopping Cart
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('#baskets')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                >
                  🧺 Shared Baskets
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={scrollTop}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                >
                  📝 Upload Parchi / List
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={scrollTop}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                >
                  🏷️ Deals & Combos
                </button>
              </li>
            </ul>
          </div>

          {/* COLUMN 2: CUSTOMER ACCOUNT */}
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>👤</span> My Account
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('#account')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                >
                  👤 Profile & Addresses
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('#orders')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                >
                  📦 Order History & Status
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('#account')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                >
                  🪙 Loyalty Coins Wallet
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('#account')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                >
                  🎁 Refer & Earn Rewards
                </button>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: FOR SHOPKEEPERS & PARTNERS */}
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>🏪</span> For Dukaan
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('#shop')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                >
                  🏪 Shop Owner Login
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('#shop')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                >
                  ⚡ Counter POS Billing
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('#shop')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                >
                  📈 Sell Online with Us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('#admin')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                >
                  👨‍💼 Admin Portal
                </button>
              </li>
            </ul>
          </div>

          {/* COLUMN 4: HELP & LEGAL POLICIES */}
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>🛡️</span> Help & Legal
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <button
                  type="button"
                  onClick={handleOpenWhatsAppSupport}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#16a34a', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}
                >
                  💬 WhatsApp Support
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveModal('faq')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                >
                  ❓ FAQs & How It Works
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveModal('privacy')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                >
                  🔒 Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveModal('terms')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                >
                  📜 Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveModal('refund')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                >
                  🔄 Refund & Cancellation
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* 5. APP INSTALL & HIGHLIGHT BANNER */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '16px',
          padding: '16px 18px',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.8rem' }}>📲</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: '0.92rem', color: '#34d399' }}>
                PackItOut Fast Web App
              </div>
              <div style={{ fontSize: '0.74rem', color: '#cbd5e1', marginTop: '2px' }}>
                Add to your home screen for 1-tap reordering & real-time order alerts.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('beforeinstallprompt'));
                scrollTop();
              }
            }}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.35)',
            }}
          >
            Install App ⚡
          </button>
        </div>

        {/* 6. COPYRIGHT & BHARAT BADGE */}
        <div style={{
          borderTop: '1px solid #f1f5f9',
          paddingTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '0.72rem',
          color: '#94a3b8',
          fontWeight: 600,
        }}>
          <div>
            © {new Date().getFullYear()} <strong>PackItOut</strong> Technologies Pvt. Ltd. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontWeight: 700 }}>
            <span>Made with ❤️ for Indian Local Dukaan & Smart Shoppers 🇮🇳</span>
          </div>
        </div>

      </div>

      {/* ================= 📄 INTERACTIVE LEGAL / FAQ MODALS ================= */}
      {activeModal && (
        <div
          onClick={() => setActiveModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '24px 20px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              boxSizing: 'border-box',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
                {activeModal === 'privacy' && '🔒 Privacy Policy'}
                {activeModal === 'terms' && '📜 Terms & Conditions'}
                {activeModal === 'refund' && '🔄 Refund & Cancellation'}
                {activeModal === 'faq' && '❓ Frequently Asked Questions'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ border: 'none', background: 'transparent', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.6 }}>
              {activeModal === 'privacy' && (
                <>
                  <p><strong>PackItOut Privacy Commitment:</strong> We respect your privacy and protect your personal information.</p>
                  <p><strong>1. Information We Collect:</strong> When placing an order, we collect your phone number, delivery/pickup address, and store preference to process and fulfill your orders.</p>
                  <p><strong>2. Direct Store Communication:</strong> Your contact details are shared only with the verified local shopkeeper fulfilling your order.</p>
                  <p><strong>3. Security:</strong> We never sell your personal data to third parties. All payments are handled directly via secure UPI or cash on pickup.</p>
                </>
              )}

              {activeModal === 'terms' && (
                <>
                  <p><strong>Welcome to PackItOut:</strong> By using our platform, you agree to these Terms of Service.</p>
                  <p><strong>1. Local Marketplace:</strong> PackItOut connects local customers with verified neighbourhood retail shops. Product quality, pricing, and availability are managed directly by each shop.</p>
                  <p><strong>2. Order Pickup & Delivery:</strong> Customers may choose counter pickup or doorstep delivery as offered by the respective shop.</p>
                  <p><strong>3. Direct Payments:</strong> Direct UPI payments are transferred straight to the shopkeeper's registered UPI ID with ₹0 gateway commissions.</p>
                </>
              )}

              {activeModal === 'refund' && (
                <>
                  <p><strong>Customer Friendly Returns:</strong> Local shopping should always be hassle-free.</p>
                  <p><strong>1. At Counter Inspection:</strong> When picking up your order, inspect items before leaving the shop. Any defective or missing item is refunded immediately by the shopkeeper.</p>
                  <p><strong>2. Return Window:</strong> Packaged FMCG items in unopened condition can be returned within 24 hours at the shop counter with your digital receipt.</p>
                  <p><strong>3. Perishables:</strong> For milk, bread, fruits, and vegetables, please report any quality issue within 2 hours of receipt.</p>
                </>
              )}

              {activeModal === 'faq' && (
                <>
                  <p><strong>Q: How does PackItOut work?</strong><br />A: Select your nearby local store, add items to cart, or upload a handwritten Parchi. The shopkeeper packs your order so you can collect it in minutes or get it delivered!</p>
                  <p><strong>Q: What are Loyalty Coins?</strong><br />A: Every order earns you PackItOut Loyalty Coins that you can redeem for instant cash discounts on future orders.</p>
                  <p><strong>Q: Can I order on WhatsApp?</strong><br />A: Yes! You can share your cart or order directly with your local store via WhatsApp.</p>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{
                  padding: '9px 18px',
                  background: '#0f172a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </footer>
  );
}

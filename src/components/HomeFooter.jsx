import React from 'react';
import StorefrontIcon from '../ui/StorefrontIcon.jsx';

const BRAND = '#16a34a';
const BRAND_DARK = '#15803d';

const TRUST_BADGES = [
  {
    key: 'fast',
    title: 'Quick pickup',
    subtitle: 'Ready in minutes',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
      </svg>
    ),
  },
  {
    key: 'local',
    title: 'Local shops',
    subtitle: 'Your neighbourhood',
    icon: <StorefrontIcon size={22} color={BRAND} />,
  },
  {
    key: 'returns',
    title: 'Easy returns',
    subtitle: 'Hassle-free refunds',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <polyline points="3 3 3 9 9 9" />
      </svg>
    ),
  },
];

export default function HomeFooter({ endMessage = "You're all caught up", signInNudge = null }) {
  const scrollTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ background: '#f3f4f6', padding: '8px 16px 110px' }}>
      {/* End-of-feed divider */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
        padding: '18px 0 22px',
        color: '#94a3b8', fontSize: '0.74rem', fontWeight: 700,
        letterSpacing: '0.6px', textTransform: 'uppercase',
      }}>
        <span style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #e2e8f0)' }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={BRAND} aria-hidden="true">
            <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7L2 9.2l7.1-.6L12 2z" />
          </svg>
          {endMessage}
        </span>
        <span style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, #e2e8f0)' }} />
      </div>

      {/* Brand block */}
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '22px 18px 18px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 8px 24px rgba(15,23,42,0.05)',
        textAlign: 'center',
      }}>
        {/* Logo + wordmark */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '44px', height: '44px', borderRadius: '14px',
            background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`,
            boxShadow: '0 6px 16px rgba(22,163,74,0.30)',
          }}>
            <StorefrontIcon size={24} color="#fff" accent="#bbf7d0" />
          </span>
          <span style={{
            fontSize: '1.45rem', fontWeight: 900, letterSpacing: '-0.6px',
            color: '#0f172a',
          }}>
            Pack<span style={{ color: BRAND }}>It</span>Out
          </span>
        </div>

        {/* Tagline */}
        <div style={{
          color: '#475569',
          fontSize: '0.92rem',
          fontWeight: 600,
          lineHeight: 1.45,
          maxWidth: '340px',
          margin: '0 auto 18px',
        }}>
          Your neighbourhood store, ready to pick up.
        </div>

        {/* Trust badges */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          marginBottom: '16px',
        }}>
          {TRUST_BADGES.map(b => (
            <div
              key={b.key}
              style={{
                padding: '12px 6px',
                background: '#f0fdf4',
                border: '1px solid #dcfce7',
                borderRadius: '14px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
              }}
            >
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(22,163,74,0.12)',
              }}>
                {b.icon}
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#0f172a', textAlign: 'center', letterSpacing: '-0.1px' }}>
                {b.title}
              </div>
              <div style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 600, textAlign: 'center', lineHeight: 1.3 }}>
                {b.subtitle}
              </div>
            </div>
          ))}
        </div>

        {signInNudge && (
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: '12px',
            color: '#0f172a',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '14px',
          }}>
            {signInNudge}
          </div>
        )}

        {/* Back to top */}
        <button
          type="button"
          onClick={scrollTop}
          style={{
            appearance: 'none',
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            margin: '4px auto 0',
            padding: '10px 18px',
            background: '#0f172a',
            color: '#fff',
            border: 'none',
            borderRadius: '999px',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer',
            boxShadow: '0 6px 14px rgba(15,23,42,0.18)',
            letterSpacing: '0.2px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
          Back to top
        </button>

        <div style={{
          marginTop: '16px',
          paddingTop: '14px',
          borderTop: '1px solid #f1f5f9',
          fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600,
        }}>
          Made with care for local shopkeepers · © PackItOut
        </div>
      </div>
    </div>
  );
}

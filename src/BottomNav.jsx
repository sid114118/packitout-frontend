import React from 'react';

const ACTIVE = '#0c831f';
const INACTIVE = '#94a3b8';

const HomeIcon = ({ active }) => active ? (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={ACTIVE} aria-hidden="true">
    <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.06l-8.69-8.69a2.25 2.25 0 0 0-3.18 0l-8.69 8.69a.75.75 0 1 0 1.06 1.06l8.69-8.69z"/>
    <path d="M12 5.43l8.16 8.16c.03.03.06.06.09.09v6.2A1.88 1.88 0 0 1 18.38 21.75H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 1-.75.75H5.63A1.88 1.88 0 0 1 3.75 19.88v-6.2c.03-.03.06-.06.09-.09L12 5.43z"/>
  </svg>
) : (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={INACTIVE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.25 12 12 2.25 21.75 12M4.5 9.75v10.13c0 .62.5 1.12 1.13 1.12H9.75v-4.88c0-.62.5-1.12 1.13-1.12h2.25c.62 0 1.12.5 1.12 1.12V21h4.13c.62 0 1.12-.5 1.12-1.13V9.75"/>
  </svg>
);

const PinIcon = ({ active }) => active ? (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={ACTIVE} aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M11.54 22.35l.07.04.03.02a.76.76 0 0 0 .72 0l.03-.02.07-.04a16.97 16.97 0 0 0 1.14-.74 19.58 19.58 0 0 0 2.69-2.28c1.94-1.99 3.96-4.98 3.96-8.83a8.25 8.25 0 0 0-16.5 0c0 3.85 2.02 6.84 3.96 8.83a19.58 19.58 0 0 0 2.69 2.28 16.97 16.97 0 0 0 1.14.74zM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
  </svg>
) : (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={INACTIVE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
    <path d="M19.5 10.5c0 7.14-7.5 11.25-7.5 11.25S4.5 17.64 4.5 10.5a7.5 7.5 0 1 1 15 0z"/>
  </svg>
);

const BagIcon = ({ active }) => active ? (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={ACTIVE} aria-hidden="true">
    <path d="M5.5 8h13l-1 12.2a1.5 1.5 0 0 1-1.5 1.3H8a1.5 1.5 0 0 1-1.5-1.3L5.5 8z"/>
    <path d="M8.5 8V6a3.5 3.5 0 0 1 7 0v2" fill="none" stroke={ACTIVE} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
) : (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={INACTIVE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5.5 8h13l-1 12.2a1.5 1.5 0 0 1-1.5 1.3H8a1.5 1.5 0 0 1-1.5-1.3L5.5 8z"/>
    <path d="M8.5 8V6a3.5 3.5 0 0 1 7 0v2"/>
  </svg>
);

const UserIcon = ({ active }) => active ? (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={ACTIVE} aria-hidden="true">
    <path d="M7.5 6.5a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0z"/>
    <path d="M3.75 20.6a8.25 8.25 0 0 1 16.5 0 .75.75 0 0 1-.44.7A18.68 18.68 0 0 1 12 23c-2.79 0-5.43-.61-7.81-1.7a.75.75 0 0 1-.44-.7z"/>
  </svg>
) : (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={INACTIVE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="7.5" r="3.75"/>
    <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>
  </svg>
);

const TAB_CSS = `
.pn-tab { background: none; border: 0; padding: 4px 0 0; flex: 1; display: flex; flex-direction: column; align-items: center; cursor: pointer; -webkit-tap-highlight-color: transparent; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; transition: transform 0.12s ease; outline: none; }
.pn-tab:active { transform: scale(0.92); }
.pn-tab-pill { width: 56px; height: 30px; border-radius: 999px; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s ease; }
.pn-tab-pill.active { background-color: rgba(12, 131, 31, 0.12); }
.pn-tab-label { font-size: 0.7rem; font-weight: 600; margin-top: 3px; letter-spacing: 0.01em; transition: color 0.2s ease, font-weight 0.2s ease; }
.pn-tab-label.active { color: ${ACTIVE}; font-weight: 700; }
.pn-tab-label.inactive { color: ${INACTIVE}; }
`;

export default function BottomNav({ currentView }) {
  const handleNav = (hash) => {
    if (window.location.hash === hash || (hash === "" && !window.location.hash)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.location.hash = hash;
    }
  };

  const isHome = currentView === 'customer' || currentView === 'Customer' || currentView === '';
  const isNearby = currentView === 'nearby';
  const isOrders = currentView === 'orders';
  const isProfile = currentView === 'account';

  const tabs = [
    { key: 'home', label: 'Home', hash: '', active: isHome, Icon: HomeIcon },
    { key: 'nearby', label: 'Nearby', hash: '#nearby', active: isNearby, Icon: PinIcon },
    { key: 'orders', label: 'Orders', hash: '#orders', active: isOrders, Icon: BagIcon },
    { key: 'profile', label: 'Profile', hash: '#account', active: isProfile, Icon: UserIcon },
  ];

  return (
    <>
      <style>{TAB_CSS}</style>
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'saturate(180%) blur(14px)',
        WebkitBackdropFilter: 'saturate(180%) blur(14px)',
        borderTop: '1px solid #eef2f7',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '6px 4px',
        paddingBottom: 'max(6px, env(safe-area-inset-bottom))',
        zIndex: 998,
        boxShadow: '0 -6px 20px rgba(15, 23, 42, 0.05)',
      }}>
        {tabs.map(({ key, label, hash, active, Icon }) => (
          <button
            key={key}
            type="button"
            className="pn-tab"
            onClick={() => handleNav(hash)}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
          >
            <div className={`pn-tab-pill ${active ? 'active' : ''}`}>
              <Icon active={active} />
            </div>
            <span className={`pn-tab-label ${active ? 'active' : 'inactive'}`}>{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

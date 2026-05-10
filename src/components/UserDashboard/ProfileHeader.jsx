import React from 'react';
import NotificationBell from '../../NotificationBell';
import { useToast } from '../../ui/DialogProvider.jsx';

export default function ProfileHeader({
  user,
  onExit,
  coinBalance,
  myReferralCode,
  isEditingProfile,
  setIsEditingProfile,
  editForm,
  setEditForm,
  handleSaveProfile,
  nearbyShops,
  primaryShop,
}) {
  const toast = useToast();
  const initial = (editForm.name || user?.name || "U").trim().charAt(0).toUpperCase();

  return (
    <>
      {/* ── PREMIUM DARK HEADER ─────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(165deg, #0b1220 0%, #0f172a 50%, #1e293b 100%)',
          padding: '14px 18px 64px',
          color: '#fff',
          borderBottomLeftRadius: '28px',
          borderBottomRightRadius: '28px',
          boxShadow: '0 14px 32px rgba(15, 23, 42, 0.35)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Soft green glow accent */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', top: '-80px', right: '-60px',
            width: '220px', height: '220px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,197,94,0.32), rgba(34,197,94,0) 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', bottom: '20px', left: '-50px',
            width: '180px', height: '180px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(22,163,74,0.18), rgba(22,163,74,0) 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Top row: back · bell */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <button
            onClick={onExit}
            aria-label="Back to shop"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.08)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.12)',
              padding: '8px 14px 8px 10px', borderRadius: '999px',
              fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Shop
          </button>
          <NotificationBell ownerType="user" ownerId={user._id} />
        </div>

        {/* Identity row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '20px', position: 'relative', zIndex: 1 }}>
          <div
            style={{
              width: '66px', height: '66px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.7rem', fontWeight: 800, color: '#fff', flexShrink: 0,
              boxShadow: '0 0 0 3px rgba(34,197,94,0.25), 0 8px 20px rgba(22,163,74,0.35)',
              border: '2px solid rgba(255,255,255,0.15)',
            }}
          >
            {initial}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {editForm.name || "Customer"}
            </h2>
            <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px 10px', fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                {user?.phone || '—'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {editForm.pincode || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pulled-up content */}
      <div style={{ padding: '0 16px', maxWidth: '600px', margin: '0 auto', marginTop: '-44px', position: 'relative', zIndex: 2 }}>

        {/* ── COINS + REFERRAL CARD ───────────────────────────── */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            boxShadow: '0 12px 28px rgba(15,23,42,0.10)',
            padding: '14px',
            display: 'grid',
            gridTemplateColumns: '1fr 1px 1fr',
            gap: '10px',
            alignItems: 'center',
            marginBottom: '14px',
          }}
        >
          {/* Coins */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
            }}>🪙</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                PackIt Coins
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '2px', letterSpacing: '-0.3px' }}>
                {coinBalance}
              </div>
            </div>
          </div>

          <div style={{ width: '1px', height: '36px', background: '#e2e8f0' }} />

          {/* Referral */}
          <button
            onClick={() => {
              if (myReferralCode) {
                navigator.clipboard.writeText(myReferralCode);
                toast("Referral code copied!");
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0,
              background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
            }}
            aria-label="Copy referral code"
          >
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
              background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 11h-6" />
                <path d="M19 8v6" />
              </svg>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Your code
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {myReferralCode || "—"}
                </span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        {/* ── REFER & EARN BANNER ─────────────────────────────── */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '18px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div aria-hidden="true" style={{
            position: 'absolute', top: '-30px', right: '-20px', width: '120px', height: '120px',
            background: 'radial-gradient(circle, rgba(34,197,94,0.18), rgba(34,197,94,0) 70%)',
            borderRadius: '50%', pointerEvents: 'none',
          }} />
          <div style={{ fontSize: '1.6rem', position: 'relative' }}>🎁</div>
          <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
              Refer & earn 50 🪙
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500, marginTop: '2px' }}>
              Share your code — they get 50, you get 50.
            </div>
          </div>
        </div>

        {/* ── PROFILE & PREFERENCES ───────────────────────────── */}
        <div
          style={{
            marginBottom: '18px',
            background: '#fff',
            padding: '18px',
            borderRadius: '20px',
            boxShadow: '0 4px 14px rgba(15,23,42,0.04)',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.1px' }}>
              Profile & Preferences
            </h3>
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              style={{
                color: isEditingProfile ? '#64748b' : '#0f172a',
                background: isEditingProfile ? '#f1f5f9' : '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '6px 12px', borderRadius: '999px',
                fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem',
              }}
            >
              {isEditingProfile ? "Cancel" : "✎ Edit"}
            </button>
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Field label="Full name">
                <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Enter your name" required style={inputStyle} />
              </Field>
              <Field label="Pincode">
                <input type="text" value={editForm.pincode} onChange={e => setEditForm({ ...editForm, pincode: e.target.value })} placeholder="6-digit pincode" required style={inputStyle} />
              </Field>
              <Field label="Primary shop">
                <select value={editForm.primaryShop} onChange={e => setEditForm({ ...editForm, primaryShop: e.target.value })} style={inputStyle}>
                  <option value="">Select primary shop</option>
                  {nearbyShops.map(shop => (
                    <option key={shop._id} value={shop._id}>{shop.name} ({shop.pincode})</option>
                  ))}
                </select>
              </Field>

              <button
                type="submit"
                style={{
                  padding: '14px',
                  background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                  color: '#fff', border: 'none', borderRadius: '12px',
                  fontWeight: 800, cursor: 'pointer', marginTop: '4px', fontSize: '0.95rem',
                  boxShadow: '0 8px 22px rgba(15,23,42,0.28)',
                }}
              >
                Save changes
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <InfoRow label="Name" value={editForm.name || '—'} />
              <InfoRow label="Pincode" value={editForm.pincode || '—'} />
              <InfoRow
                label="Primary shop"
                value={
                  <span style={{
                    color: primaryShop ? '#15803d' : '#b45309',
                    background: primaryShop ? '#f0fdf4' : '#fef3c7',
                    border: `1px solid ${primaryShop ? '#bbf7d0' : '#fde68a'}`,
                    padding: '4px 10px', borderRadius: '999px',
                    fontSize: '0.78rem', fontWeight: 700,
                  }}>
                    {primaryShop ? `🏪 ${primaryShop.name}` : "Not selected"}
                  </span>
                }
                last
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      {children}
    </label>
  );
}

function InfoRow({ label, value, last }) {
  return (
    <div
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 0', borderBottom: last ? 'none' : '1px solid #f1f5f9',
        fontSize: '0.92rem',
      }}
    >
      <span style={{ color: '#64748b', fontWeight: 600 }}>{label}</span>
      {typeof value === 'string'
        ? <strong style={{ color: '#0f172a', fontWeight: 700 }}>{value}</strong>
        : value}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  boxSizing: 'border-box',
  outline: 'none',
  fontSize: '0.95rem',
  backgroundColor: '#f8fafc',
  color: '#0f172a',
  fontWeight: 600,
};

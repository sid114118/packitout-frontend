import React, { useState } from 'react';
import { userFetch } from './utils/api.js';

// Plain-input phone modal — no OTP. Backend /users/:id/phone validates the
// Indian mobile format and rejects collisions with another account.
export default function PhoneCollectModal({ user, onSaved, onClose }) {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    const digits = phone.replace(/\D/g, '').replace(/^91/, '');
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setBusy(true);
    try {
      const res = await userFetch(user, `/users/${user._id}/phone`, {
        method: "POST",
        body: JSON.stringify({ phone: digits }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not save phone.");
      // Backend response strips sessionToken — preserve the in-memory one so
      // subsequent authed requests don't fail with the same error.
      onSaved({ ...data, sessionToken: user.sessionToken });
    } catch (e) {
      setError(e.message || "Could not save phone.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 18, padding: 24, width: '100%', maxWidth: 360, boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>📞 Add your phone</h3>
          <button onClick={onClose} aria-label="Close" style={{ background: 'transparent', border: 'none', fontSize: 22, color: '#64748b', cursor: 'pointer', padding: 4, lineHeight: 1 }}>×</button>
        </div>
        <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: '#475569' }}>
          The shop needs a number to reach you when your order is ready.
        </p>

        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>Phone number</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: '#f1f5f9', borderRadius: 10, fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>+91</span>
          <input
            type="tel"
            inputMode="numeric"
            autoFocus
            placeholder="10-digit mobile"
            value={phone}
            maxLength={10}
            onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(""); }}
            style={{ flex: 1, padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: 10, fontSize: '1rem', outline: 'none' }}
          />
        </div>

        {error && (
          <div style={{ marginTop: 10, color: '#b91c1c', fontSize: '0.85rem', fontWeight: 600 }}>{error}</div>
        )}

        <button
          onClick={handleSave}
          disabled={busy || phone.length !== 10}
          style={{ marginTop: 18, width: '100%', padding: '14px 16px', background: (busy || phone.length !== 10) ? '#cbd5e1' : '#16a34a', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: '1rem', cursor: (busy || phone.length !== 10) ? 'not-allowed' : 'pointer' }}
        >
          {busy ? "Saving…" : "Save & Continue"}
        </button>
      </div>
    </div>
  );
}

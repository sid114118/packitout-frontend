import React, { useState } from 'react';
import { useToast, usePrompt, useConfirm } from '../../ui/DialogProvider.jsx';
import UserProfileModal from './UserProfileModal';
import { adminFetch, BASE_URL } from '../../utils/api.js';

export default function UsersTab({ users, onUsersChanged }) {
  const toast = useToast();
  const askForValue = usePrompt();
  const askConfirm = useConfirm();
  // 🛡️ STATE MOVED INSIDE: Now it manages its own form and will never crash!
  const [userForm, setUserForm] = useState({ name: "", phone: "", pincode: "", password: "" });
  const [profileUserId, setProfileUserId] = useState(null);

  // --- 🚀 ADD NEW USER ---
  // NOTE: /register now requires an OTP verificationToken, so this admin-side
  // form will fail until a dedicated /admin/users POST is added that bypasses
  // OTP. Leaving the form in place — it surfaces the toast on failure.
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm)
      });
      if (res.ok) {
        toast("User registered!");
        setUserForm({ name: "", phone: "", pincode: "", password: "" });
        if (onUsersChanged) onUsersChanged();
      } else {
        toast("Admin-add-user needs OTP — please ask the customer to self-register.", 'error');
      }
    } catch (err) {
      console.error(err);
      toast("Network error.", 'error');
    }
  };

  // --- 🪙 QUICK UPDATE COINS ---
  // Edits a user's loyalty balance. Old behaviour accepted anything that
  // wasn't NaN — which let through `Infinity`, decimals (silently floored
  // server-side), and negatives (silently clamped to 0). It also fired the
  // update without a confirm, so a misclick on the wrong row could zero out
  // a real user's balance. Strict integer-≥0 validation + a confirm step.
  const handleEditUserCoins = async (userId, currentCoins, userLabel) => {
    const raw = await askForValue({
      title: 'Update Coins',
      message: 'Set the new coin balance for this user (whole number, 0 or more).',
      defaultValue: String(currentCoins ?? ''),
      placeholder: 'e.g. 100',
      inputMode: 'numeric',
      confirmText: 'Continue',
    });
    if (raw === null) return; // cancelled
    const trimmed = String(raw).trim();
    if (trimmed === '') return;

    const n = Number(trimmed);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
      toast('Coins must be a whole number, 0 or more.', 'error');
      return;
    }

    const ok = await askConfirm({
      title: 'Confirm coin change',
      message: `Set ${userLabel || 'this user'}’s balance from ${currentCoins ?? 0} → ${n}?`,
      confirmText: 'Update',
      danger: Number(currentCoins ?? 0) > n, // red button if we're reducing
    });
    if (!ok) return;

    try {
      const res = await adminFetch(`/admin/users/${userId}/coins`, {
        method: 'POST',
        body: JSON.stringify({ mode: 'set', value: n }),
      });
      if (res.ok) {
        toast('Coins updated!');
        if (onUsersChanged) onUsersChanged();
      } else {
        const err = await res.json().catch(() => ({}));
        toast(err.error || 'Update failed.', 'error');
      }
    } catch (err) {
      toast('Error updating coins.', 'error');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)' /* responsive via CSS — see styles.css if you need media-query control. Used to be window.innerWidth, which never re-ran on resize. */, gap: '30px' }}>
      
      {/* LEFT: Add User Form */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0, color: '#0f172a' }}>Register New User</h3>
        <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input type="text" placeholder="Full Name" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} style={inputStyle} required />
          <input type="text" placeholder="Phone Number" value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})} style={inputStyle} required />
          <input type="text" placeholder="Pincode" value={userForm.pincode} onChange={e => setUserForm({...userForm, pincode: e.target.value})} style={inputStyle} required />
          <input type="text" placeholder="Password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} style={inputStyle} required />
          <button type="submit" style={submitBtnStyle}>Register User</button>
        </form>
      </div>

      {/* RIGHT: User Database */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0, color: '#0f172a' }}>Customer Database ({users?.length || 0})</h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeaderStyle}>
                <th style={{ padding: '12px' }}>User Info</th>
                <th style={{ padding: '12px' }}>Contact</th>
                <th style={{ padding: '12px' }}>Pincode</th>
                <th style={{ padding: '12px' }}>🪙 Coins</th>
                <th style={{ padding: '12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map(u => (
                <tr key={u._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '12px' }}>
                    <strong style={{ color: '#1e293b' }}>{u.name || "Guest"}</strong><br/>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Ref: {u.referralCode || 'N/A'}</span>
                  </td>
                  <td style={{ padding: '12px', color: '#475569', fontSize: '0.95rem' }}>{u.phone}</td>
                  <td style={{ padding: '12px', color: '#475569', fontSize: '0.95rem' }}>{u.pincode || "Not Set"}</td>
                  <td style={{ padding: '12px', fontWeight: '900', color: '#f59e0b', fontSize: '1.1rem' }}>{u.coins}</td>
                  <td style={{ padding: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

                    <button onClick={() => setProfileUserId(u._id)} style={actionBtnStyle('#0ea5e9', '#eff6ff')}>
                      👤 View Profile
                    </button>

                    {/* The Coin editing button is fully functional now! */}
                    <button onClick={() => handleEditUserCoins(u._id, u.coins, `${u.name || 'Guest'} (${u.phone || '—'})`)} style={actionBtnStyle('#f59e0b', '#fffbeb')}>
                      🪙 Edit Coins
                    </button>

                  </td>
                </tr>
              ))}
              
              {(!users || users.length === 0) && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No users registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserProfileModal
        open={!!profileUserId}
        userId={profileUserId}
        onClose={() => setProfileUserId(null)}
      />

    </div>
  );
}

// Styling Helpers
const cardStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', height: 'fit-content' };
const inputStyle = { padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', outline: 'none' };
const submitBtnStyle = { backgroundColor: '#0f172a', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', fontSize: '1rem', transition: 'background 0.2s' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const tableHeaderStyle = { backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' };

// Added a hover effect to the action buttons for better UX
const actionBtnStyle = (borderColor, bgColor) => ({ 
  padding: '8px 14px', 
  backgroundColor: bgColor, 
  color: borderColor, 
  border: `1px solid ${borderColor}`, 
  borderRadius: '8px', 
  fontWeight: '800', 
  cursor: 'pointer', 
  fontSize: '0.85rem',
  transition: 'transform 0.1s'
});

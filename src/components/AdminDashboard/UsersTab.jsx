import React, { useState } from 'react';

export default function UsersTab({ users }) {
  // 🛡️ STATE MOVED INSIDE: Now it manages its own form and will never crash!
  const [userForm, setUserForm] = useState({ name: "", phone: "", pincode: "", password: "" });
  const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";

  // --- 🚀 ADD NEW USER ---
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm)
      });
      if (res.ok) {
        alert("✅ User Registered Successfully!");
        setUserForm({ name: "", phone: "", pincode: "", password: "" });
        window.location.reload(); // Quick refresh to show the new user in the table
      } else {
        alert("❌ Failed to register. This phone number might already exist.");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Network Error.");
    }
  };

  // --- 🪙 QUICK UPDATE COINS ---
  const handleEditUserCoins = async (userId, currentCoins) => {
    const newCoins = prompt(`Update coins for this user:`, currentCoins);
    
    // Only proceed if they typed a valid number and didn't hit cancel
    if (newCoins !== null && newCoins.trim() !== "" && !isNaN(newCoins)) {
      try {
        const res = await fetch(`${BASE_URL}/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coins: Number(newCoins) })
        });
        if (res.ok) {
          window.location.reload(); // Refresh the table to show the new balance
        }
      } catch (err) {
        alert("❌ Error updating coins.");
      }
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '350px 1fr', gap: '30px' }}>
      
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
                  <td style={{ padding: '12px', display: 'flex', gap: '10px' }}>
                    
                    {/* The Coin editing button is fully functional now! */}
                    <button onClick={() => handleEditUserCoins(u._id, u.coins)} style={actionBtnStyle('#f59e0b', '#fffbeb')}>
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

import React from 'react';

export default function UsersTab({ 
  users, 
  userForm, 
  setUserForm, 
  handleAddUser, 
  handleEditUser, 
  handleEditUserCoins 
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '30px' }}>
      
      {/* LEFT: Add User Form */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Register New User</h3>
        <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="text" placeholder="Full Name" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} style={inputStyle} required />
          <input type="text" placeholder="Phone Number" value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})} style={inputStyle} required />
          <input type="text" placeholder="Pincode" value={userForm.pincode} onChange={e => setUserForm({...userForm, pincode: e.target.value})} style={inputStyle} required />
          <input type="text" placeholder="Password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} style={inputStyle} required />
          <button type="submit" style={submitBtnStyle}>Register User</button>
        </form>
      </div>

      {/* RIGHT: User Database */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Customer Database ({users.length})</h3>
        <table style={tableStyle}>
          <thead>
            <tr style={tableHeaderStyle}>
              <th>User Info</th><th>Contact</th><th>Pincode</th><th>🪙 Coins</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ padding: '10px' }}><strong>{u.name || "Guest"}</strong><br/><span style={{ fontSize: '0.8rem', color: '#64748b' }}>Ref: {u.referralCode || 'N/A'}</span></td>
                <td style={{ padding: '10px' }}>{u.phone}</td>
                <td style={{ padding: '10px' }}>{u.pincode || "Not Set"}</td>
                <td style={{ padding: '10px', fontWeight: 'bold', color: '#f59e0b' }}>{u.coins}</td>
                <td style={{ padding: '10px', display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleEditUserCoins(u._id, u.coins)} style={actionBtnStyle('#10b981')}>🪙 Coins</button>
                  <button onClick={() => handleEditUser(u)} style={actionBtnStyle('#3b82f6')}>✏️ Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}

// Styling Helpers
const cardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', height: 'fit-content' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' };
const submitBtnStyle = { backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const tableHeaderStyle = { backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' };
const actionBtnStyle = (color) => ({ padding: '6px 12px', backgroundColor: 'white', color: color, border: `1px solid ${color}`, borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' });

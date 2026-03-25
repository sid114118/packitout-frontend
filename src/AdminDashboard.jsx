import React, { useState } from 'react';

export default function AdminLogin({ onLogin }) {
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    
    // 🔒 THE VAULT: Your Secret Credentials
    if (adminId === "admin" && password === "packit123") {
      onLogin(); // Unlocks the dashboard
    } else {
      setError("❌ Access Denied: Invalid ID or Password");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0f172a', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#1e293b', padding: '40px 30px', borderRadius: '16px', width: '320px', color: 'white', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
        
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔐</div>
        <h2 style={{ margin: '0 0 5px 0', color: '#38bdf8', fontSize: '1.5rem' }}>Restricted Area</h2>
        <p style={{ margin: '0 0 25px 0', color: '#94a3b8', fontSize: '0.8rem' }}>Authorized Personnel Only</p>
        
        {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px', border: '1px solid #ef4444' }}>{error}</div>}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="text" 
            placeholder="Admin ID" 
            value={adminId} 
            onChange={e => setAdminId(e.target.value)} 
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', outline: 'none' }} 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', outline: 'none' }} 
          />
          <button 
            type="submit" 
            style={{ padding: '14px', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginTop: '10px' }}
          >
            Authenticate
          </button>
        </form>

      </div>
    </div>
  );
}

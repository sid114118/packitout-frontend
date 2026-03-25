import React, { useState } from 'react';

export default function ShopLogin({ onLogin }) {
  const [shopId, setShopId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    // 🔒 Shopkeeper Credentials
    if (shopId === "sharma" && password === "1234") {
      onLogin(); 
    } else {
      setError("❌ Invalid Shop ID or Password");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '40px 30px', borderRadius: '16px', width: '320px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🏪</div>
        <h2 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '1.5rem' }}>Partner Portal</h2>
        <p style={{ margin: '0 0 25px 0', color: '#64748b', fontSize: '0.85rem' }}>Log in to manage your shop</p>
        
        {error && <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px' }}>{error}</div>}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="text" placeholder="Shop ID (e.g. sharma)" value={shopId} onChange={e => setShopId(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
          <button type="submit" style={{ padding: '14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginTop: '10px' }}>Enter Dashboard</button>
        </form>

      </div>
    </div>
  );
}

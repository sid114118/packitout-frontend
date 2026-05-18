import React, { useState } from 'react';
import { BASE_URL, setAdminToken } from './utils/api.js';

export default function AdminLogin({ onLogin }) {
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      // Exchange password for the server-side admin token. Old client-side
      // "admin/packit123" check is gone — anyone could read it from the bundle.
      const res = await fetch(`${BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const { token } = await res.json();
        setAdminToken(token);
        onLogin();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (res.status === 503) setError(data.error || "Server: ADMIN_PASSWORD/ADMIN_TOKEN not configured");
      else setError(data.error || "❌ Access Denied");
    } catch (err) {
      setError("Network error — check the server.");
    } finally {
      setSubmitting(false);
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
            disabled={submitting}
            style={{ padding: '14px', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: submitting ? 'not-allowed' : 'pointer', marginTop: '10px', opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? 'Authenticating…' : 'Authenticate'}
          </button>
        </form>

      </div>
    </div>
  );
}

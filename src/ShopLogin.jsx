import React, { useState } from 'react';

const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

export default function ShopLogin({ onLogin }) {
  const [form, setForm] = useState({ phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`${BASE_URL}/shop-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) onLogin(data);
    else setError("Invalid Phone or Password");
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center', background: '#1e272e', minHeight: '100vh', color: 'white' }}>
      <h2>🏪 Shop Partner Login</h2>
      <form onSubmit={handleLogin} style={{ maxWidth: '300px', margin: 'auto' }}>
        <input type="tel" placeholder="Phone" onChange={e => setForm({...form, phone: e.target.value})} style={s} required />
        <input type="password" placeholder="Password" onChange={e => setForm({...form, password: e.target.value})} style={s} required />
        {error && <p style={{color: 'red'}}>{error}</p>}
        <button type="submit" disabled={loading} style={{padding: '10px 20px', cursor: loading ? 'not-allowed' : 'pointer', background: loading ? '#64748b' : '#16a34a', color: '#fff', border: 'none', borderRadius: '5px'}}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
const s = { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px' };

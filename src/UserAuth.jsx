import React, { useState } from 'react';

export default function UserAuth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true); // Toggles between Login and Signup
  const [status, setStatus] = useState("");

  // Form Fields
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [pincode, setPincode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("⏳ Processing...");

    const endpoint = isLogin ? "login" : "register";
    const payload = isLogin 
      ? { phone, password } 
      : { name, phone, password, pincode };

    try {
      const response = await fetch(`https://darkslategrey-snail-415133.hostingersite.com/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("✅ Success!");
        // Pass the actual user data to the main app so it knows WHO logged in
        setTimeout(() => onLoginSuccess(data), 1000); 
      } else {
        setStatus(`❌ ${data.error}`);
      }
    } catch (err) {
      setStatus("❌ Server connection failed.");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '40px 30px', borderRadius: '20px', width: '320px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}>
        
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🛒</div>
        <h2 style={{ margin: '0 0 5px 0', color: '#2c3e50', fontSize: '1.5rem' }}>
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>
        <p style={{ margin: '0 0 25px 0', color: '#7f8fa6', fontSize: '0.85rem' }}>
          {isLogin ? "Log in to track your orders" : "Join PackItOut today"}
        </p>
        
        {status && <div style={{ backgroundColor: status.includes("✅") ? '#dcfce7' : '#fee2e2', color: status.includes("✅") ? '#166534' : '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px', fontWeight: 'bold' }}>{status}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* Only show Name and Pincode if they are Registering */}
          {!isLogin && (
            <>
              <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required style={{ padding: '14px', borderRadius: '8px', border: '1px solid #dcdde1', outline: 'none', backgroundColor: '#f5f6fa' }} />
              <input type="text" placeholder="Delivery Pincode (e.g. 110001)" value={pincode} onChange={e => setPincode(e.target.value)} required style={{ padding: '14px', borderRadius: '8px', border: '1px solid #dcdde1', outline: 'none', backgroundColor: '#f5f6fa' }} />
            </>
          )}

          <input type="text" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} required style={{ padding: '14px', borderRadius: '8px', border: '1px solid #dcdde1', outline: 'none', backgroundColor: '#f5f6fa' }} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '14px', borderRadius: '8px', border: '1px solid #dcdde1', outline: 'none', backgroundColor: '#f5f6fa' }} />
          
          <button type="submit" style={{ padding: '15px', backgroundColor: '#ff4757', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 6px rgba(255, 71, 87, 0.2)' }}>
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '0.85rem', color: '#7f8fa6' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            onClick={() => { setIsLogin(!isLogin); setStatus(""); }} 
            style={{ color: '#ff4757', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {isLogin ? "Sign Up" : "Log In"}
          </span>
        </p>

      </div>
    </div>
  );
}

import React, { useState } from 'react';

const API_BASE = "https://darkslategrey-snail-415133.hostingersite.com";

const isValidPhone = (p) => /^[6-9]\d{9}$/.test(String(p || "").trim());
const isValidPincode = (p) => /^\d{6}$/.test(String(p || "").trim());

export default function UserAuth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState("phone"); // phone | otp | details (signup only)
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  // Form fields
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [pincode, setPincode] = useState("");
  const [referredBy, setReferredBy] = useState("");

  // OTP state
  const [otp, setOtp] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [devOtp, setDevOtp] = useState(""); // shown when backend returns it (dev mode)

  const resetAll = () => {
    setStep("phone"); setStatus(""); setBusy(false);
    setOtp(""); setVerificationToken(""); setDevOtp("");
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    resetAll();
    setPassword(""); setName(""); setPincode(""); setReferredBy("");
  };

  // Login flow (single step)
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isValidPhone(phone)) return setStatus("❌ Enter a valid 10-digit mobile number.");
    if (!password) return setStatus("❌ Enter your password.");
    setStatus("⏳ Logging in...");
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed.");
      setStatus("✅ Success!");
      setTimeout(() => onLoginSuccess(data), 800);
    } catch (err) {
      setStatus(`❌ ${err.message}`);
      setBusy(false);
    }
  };

  // Signup step 1: send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!isValidPhone(phone)) return setStatus("❌ Enter a valid 10-digit mobile number.");
    setStatus("⏳ Sending OTP...");
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), purpose: "register" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send OTP.");
      if (data.devOtp) setDevOtp(data.devOtp);
      setStep("otp");
      setStatus("✅ OTP sent.");
      setBusy(false);
    } catch (err) {
      setStatus(`❌ ${err.message}`);
      setBusy(false);
    }
  };

  // Signup step 2: verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) return setStatus("❌ Enter the 6-digit OTP.");
    setStatus("⏳ Verifying...");
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), otp: otp.trim(), purpose: "register" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP.");
      setVerificationToken(data.verificationToken);
      setStep("details");
      setStatus("✅ Phone verified.");
      setBusy(false);
    } catch (err) {
      setStatus(`❌ ${err.message}`);
      setBusy(false);
    }
  };

  // Signup step 3: complete registration
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setStatus("❌ Please enter your name.");
    if (!isValidPincode(pincode)) return setStatus("❌ Pincode must be exactly 6 digits.");
    if (!password || password.length < 6) return setStatus("❌ Password must be at least 6 characters.");
    setStatus("⏳ Creating account...");
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          password,
          pincode: pincode.trim(),
          referredBy: referredBy.trim() || undefined,
          verificationToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");
      setStatus("✅ Account created!");
      setTimeout(() => onLoginSuccess(data), 800);
    } catch (err) {
      setStatus(`❌ ${err.message}`);
      setBusy(false);
    }
  };

  const titleFor = () => {
    if (isLogin) return { title: "Welcome Back", sub: "Log in to track your orders" };
    if (step === "phone") return { title: "Create Account", sub: "We'll send an OTP to verify your number" };
    if (step === "otp") return { title: "Verify Phone", sub: `Enter the OTP sent to ${phone}` };
    return { title: "Almost there", sub: "Just a few more details" };
  };
  const { title, sub } = titleFor();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif', padding: '20px' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '40px 30px', borderRadius: '20px', width: '100%', maxWidth: '320px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}>

        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🛒</div>
        <h2 style={{ margin: '0 0 5px 0', color: '#2c3e50', fontSize: '1.5rem' }}>{title}</h2>
        <p style={{ margin: '0 0 25px 0', color: '#7f8fa6', fontSize: '0.85rem' }}>{sub}</p>

        {status && (
          <div style={{ backgroundColor: status.includes("✅") ? '#dcfce7' : status.includes("⏳") ? '#fef3c7' : '#fee2e2', color: status.includes("✅") ? '#166534' : status.includes("⏳") ? '#92400e' : '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '15px', fontWeight: 'bold' }}>
            {status}
          </div>
        )}

        {devOtp && step === "otp" && (
          <div style={{ backgroundColor: '#fffbeb', color: '#92400e', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '15px', fontWeight: '700', border: '1px dashed #fbbf24' }}>
            🛠️ DEV MODE — your OTP is <span style={{ fontFamily: 'monospace', fontSize: '1rem' }}>{devOtp}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {isLogin && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="tel" inputMode="numeric" maxLength={10} placeholder="Phone Number (10 digits)" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} required style={inputStyle} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
            <button type="submit" disabled={busy} style={primaryBtn(busy)}>Login</button>
          </form>
        )}

        {/* SIGNUP STEP 1: PHONE */}
        {!isLogin && step === "phone" && (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="tel" inputMode="numeric" maxLength={10} placeholder="Phone Number (10 digits)" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} required style={inputStyle} />
            <button type="submit" disabled={busy} style={primaryBtn(busy)}>Send OTP</button>
          </form>
        )}

        {/* SIGNUP STEP 2: OTP */}
        {!isLogin && step === "otp" && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="tel" inputMode="numeric" maxLength={6} placeholder="6-digit OTP" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} required style={{ ...inputStyle, letterSpacing: '0.4em', textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' }} />
            <button type="submit" disabled={busy} style={primaryBtn(busy)}>Verify OTP</button>
            <button type="button" onClick={() => { setStep("phone"); setStatus(""); setOtp(""); setDevOtp(""); }} style={ghostBtn}>← Change number</button>
          </form>
        )}

        {/* SIGNUP STEP 3: DETAILS */}
        {!isLogin && step === "details" && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
            <input type="tel" inputMode="numeric" maxLength={6} placeholder="Delivery Pincode (6 digits)" value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, ''))} required style={inputStyle} />
            <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
            <input type="text" placeholder="Referral Code (Optional)" value={referredBy} onChange={e => setReferredBy(e.target.value.toUpperCase())} style={inputStyle} />
            <button type="submit" disabled={busy} style={primaryBtn(busy)}>Create Account</button>
          </form>
        )}

        <p style={{ marginTop: '20px', fontSize: '0.85rem', color: '#7f8fa6' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={switchMode} style={{ color: '#ff4757', fontWeight: 'bold', cursor: 'pointer' }}>
            {isLogin ? "Sign Up" : "Log In"}
          </span>
        </p>

      </div>
    </div>
  );
}

const inputStyle = { padding: '14px', borderRadius: '8px', border: '1px solid #dcdde1', outline: 'none', backgroundColor: '#f5f6fa', fontSize: '1rem' };
const primaryBtn = (busy) => ({ padding: '15px', backgroundColor: '#ff4757', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: busy ? 'not-allowed' : 'pointer', marginTop: '10px', boxShadow: '0 4px 6px rgba(255, 71, 87, 0.2)', opacity: busy ? 0.6 : 1 });
const ghostBtn = { padding: '10px', backgroundColor: 'transparent', color: '#7f8fa6', border: 'none', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' };

import React, { useState, useRef } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
  signOut,
  updateProfile,
  EmailAuthProvider,
  linkWithCredential,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
} from 'firebase/auth';
import { auth, googleProvider, isStandalonePWA, isIOS } from './utils/firebase';

const API_BASE = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || "").trim());
const isValidPhone = (p) => /^[6-9]\d{9}$/.test(String(p || "").trim());

// Friendly text for the Firebase error codes the user can actually trigger.
const friendlyError = (err) => {
  const code = err?.code || "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Wrong email or password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try logging in instead.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/invalid-email":
      return "That doesn't look like a valid email.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in cancelled.";
    case "auth/popup-blocked":
      return "Popup blocked. Allow popups for this site and try again.";
    case "auth/network-request-failed":
      return "Network problem. Check your connection.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes and try again.";
    case "auth/account-exists-with-different-credential":
      return "This email is already registered with a different sign-in method.";
    default:
      return err?.message || "Something went wrong.";
  }
};

// POST a Firebase ID token to our backend in exchange for a session token +
// user record. Handles both new signups (backend creates the user row) and
// returning logins (backend finds existing user by uid / email).
const exchangeIdTokenForSession = async (idToken) => {
  const res = await fetch(`${API_BASE}/auth/oauth-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed.");
  return data;
};

export default function UserAuth({ onLoginSuccess }) {
  // mode: "login" | "signup" | "forgot" | "verify-sent" | "migrate-phone" | "migrate-email"
  const [mode, setMode] = useState("login");
  const [step, setStep] = useState("phone"); // for migrate-phone: phone | otp
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  // Email/password fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Phone migration fields (one-time for legacy users)
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const recaptchaVerifierRef = useRef(null);

  // Hide Google button inside iOS PWA — popups are broken there.
  const showGoogleButton = !(isStandalonePWA() && isIOS());

  const reset = (nextMode = mode) => {
    setMode(nextMode);
    setStep("phone");
    setStatus("");
    setBusy(false);
    setOtp("");
    setConfirmationResult(null);
    if (recaptchaVerifierRef.current) {
      try { recaptchaVerifierRef.current.clear(); } catch (_e) { /* noop */ }
      recaptchaVerifierRef.current = null;
    }
  };

  // ============ EMAIL + PASSWORD LOGIN ============
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) return setStatus("❌ Enter a valid email.");
    if (!password) return setStatus("❌ Enter your password.");
    setStatus("⏳ Signing in...");
    setBusy(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
      // emailVerified can be stale right after sign-in — reload to be sure.
      await user.reload();
      if (!user.emailVerified) {
        setStatus("❌ Please verify your email first. Check your inbox for the link.");
        setBusy(false);
        return;
      }
      const idToken = await user.getIdToken(true); // force fresh token with email_verified=true
      const data = await exchangeIdTokenForSession(idToken);
      setStatus("✅ Welcome back!");
      setTimeout(() => onLoginSuccess(data), 600);
    } catch (err) {
      setStatus(`❌ ${friendlyError(err)}`);
      setBusy(false);
    }
  };

  const handleResendVerification = async () => {
    setStatus("⏳ Sending verification email...");
    setBusy(true);
    try {
      // To resend, we need a currentUser — sign in silently first if needed.
      if (!auth.currentUser) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      await sendEmailVerification(auth.currentUser, {
        url: `${window.location.origin}/#/verify-done`,
      });
      setStatus("✅ Verification email sent. Check your inbox.");
      setBusy(false);
    } catch (err) {
      setStatus(`❌ ${friendlyError(err)}`);
      setBusy(false);
    }
  };

  // ============ EMAIL + PASSWORD SIGNUP ============
  const handleEmailSignup = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setStatus("❌ Please enter your name.");
    if (!isValidEmail(email)) return setStatus("❌ Enter a valid email.");
    if (!password || password.length < 6) return setStatus("❌ Password must be at least 6 characters.");
    setStatus("⏳ Creating account...");
    setBusy(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(user, { displayName: name.trim() });
      await sendEmailVerification(user, {
        url: `${window.location.origin}/#/verify-done`,
      });
      // Sign out so the user can't bypass the verify step by just refreshing.
      await signOut(auth);
      setMode("verify-sent");
      setStatus("");
      setBusy(false);
    } catch (err) {
      setStatus(`❌ ${friendlyError(err)}`);
      setBusy(false);
    }
  };

  // ============ GOOGLE SIGN-IN ============
  const handleGoogleSignIn = async () => {
    setStatus("⏳ Opening Google...");
    setBusy(true);
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      const idToken = await user.getIdToken();
      const data = await exchangeIdTokenForSession(idToken);
      setStatus("✅ Welcome!");
      setTimeout(() => onLoginSuccess(data), 600);
    } catch (err) {
      if (err?.code === "auth/account-exists-with-different-credential") {
        setStatus("❌ This email is already registered with email/password. Sign in below first, then we'll link Google to your account.");
        setBusy(false);
        return;
      }
      setStatus(`❌ ${friendlyError(err)}`);
      setBusy(false);
    }
  };

  // ============ FORGOT PASSWORD (Firebase-hosted reset) ============
  const handleForgot = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) return setStatus("❌ Enter the email on your account.");
    setStatus("⏳ Sending reset link...");
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email.trim(), {
        url: `${window.location.origin}/#/`,
      });
      setStatus("✅ Reset link sent. Check your inbox.");
      setBusy(false);
    } catch (err) {
      setStatus(`❌ ${friendlyError(err)}`);
      setBusy(false);
    }
  };

  // ============ MIGRATION: existing phone+password user, one-time ============
  const ensureRecaptcha = () => {
    if (recaptchaVerifierRef.current) {
      try { recaptchaVerifierRef.current.clear(); } catch (_e) { /* noop */ }
      recaptchaVerifierRef.current = null;
    }
    const container = document.getElementById("recaptcha-container");
    if (container) container.innerHTML = "";
    recaptchaVerifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
    return recaptchaVerifierRef.current;
  };

  const handleMigrateSendOtp = async (e) => {
    e.preventDefault();
    if (!isValidPhone(phone)) return setStatus("❌ Enter a valid 10-digit mobile number.");
    setStatus("⏳ Sending OTP...");
    setBusy(true);
    try {
      const verifier = ensureRecaptcha();
      const result = await signInWithPhoneNumber(auth, `+91${phone.trim()}`, verifier);
      setConfirmationResult(result);
      setStep("otp");
      setStatus("✅ OTP sent to your phone.");
      setBusy(false);
    } catch (err) {
      setStatus(`❌ ${friendlyError(err)}`);
      setBusy(false);
    }
  };

  const handleMigrateVerifyOtp = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) return setStatus("❌ Enter the 6-digit OTP.");
    if (!confirmationResult) return setStatus("❌ Please request a new OTP.");
    setStatus("⏳ Verifying...");
    setBusy(true);
    try {
      // Phone OTP signs the user in as a Firebase phone user. Next step asks
      // them for an email + password to ADD to this Firebase identity (so
      // future logins can use email).
      await confirmationResult.confirm(otp.trim());
      setMode("migrate-email");
      setStatus("");
      setBusy(false);
    } catch (err) {
      setStatus(`❌ ${friendlyError(err)}`);
      setBusy(false);
    }
  };

  const handleMigrateAddEmail = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) return setStatus("❌ Enter a valid email.");
    if (!password || password.length < 6) return setStatus("❌ Password must be at least 6 characters.");
    if (!auth.currentUser) return setStatus("❌ Session expired. Please start over.");
    setStatus("⏳ Linking email to your account...");
    setBusy(true);
    try {
      const credential = EmailAuthProvider.credential(email.trim(), password);
      await linkWithCredential(auth.currentUser, credential);
      await sendEmailVerification(auth.currentUser, {
        url: `${window.location.origin}/#/verify-done`,
      });
      // Tell the backend: this Firebase uid (phone) now also owns this email.
      const idToken = await auth.currentUser.getIdToken(true);
      const res = await fetch(`${API_BASE}/auth/add-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not link email.");
      await signOut(auth); // force email-verified gate on next login
      setMode("verify-sent");
      setStatus("");
      setBusy(false);
    } catch (err) {
      setStatus(`❌ ${friendlyError(err)}`);
      setBusy(false);
    }
  };

  // ============ RENDER HELPERS ============
  const titleFor = () => {
    if (mode === "login") return { title: "Welcome Back", sub: "Log in to track your orders" };
    if (mode === "signup") return { title: "Create Account", sub: "We'll send a verification email" };
    if (mode === "forgot") return { title: "Forgot Password", sub: "We'll email you a reset link" };
    if (mode === "verify-sent") return { title: "Check Your Email", sub: `We sent a verification link to ${email || "your inbox"}` };
    if (mode === "migrate-phone") {
      if (step === "phone") return { title: "Existing User?", sub: "Verify your phone once — then add an email to keep your account" };
      return { title: "Verify OTP", sub: `Enter the OTP sent to ${phone}` };
    }
    return { title: "Add Email to Account", sub: "From next time, log in with email instead of phone" };
  };
  const { title, sub } = titleFor();

  return (
    <div style={pageWrap}>
      <div style={cardStyle}>
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🛒</div>
        <h2 style={titleStyle}>{title}</h2>
        <p style={subStyle}>{sub}</p>

        {status && (
          <div style={statusBox(status)}>{status}</div>
        )}

        {/* Invisible reCAPTCHA mount point — Firebase attaches its widget here when migrating phone users. */}
        <div id="recaptcha-container"></div>

        {/* LOGIN */}
        {mode === "login" && (
          <>
            <form onSubmit={handleEmailLogin} style={formStyle}>
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} autoComplete="email" />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} autoComplete="current-password" />
              <button type="submit" disabled={busy} style={primaryBtn(busy)}>{busy ? "Signing in…" : "Log In"}</button>
            </form>

            {status.includes("verify your email") && (
              <button type="button" onClick={handleResendVerification} disabled={busy} style={secondaryBtn}>Resend verification email</button>
            )}

            <div style={{ marginTop: '12px', textAlign: 'right' }}>
              <span onClick={() => reset("forgot")} style={linkStyle}>Forgot Password?</span>
            </div>

            {showGoogleButton && (
              <>
                <div style={dividerStyle}><span style={dividerText}>or</span></div>
                <button type="button" onClick={handleGoogleSignIn} disabled={busy} style={googleBtn(busy)}>
                  <GoogleIcon /> Continue with Google
                </button>
              </>
            )}

            <p style={footerStyle}>
              Don't have an account? <span onClick={() => reset("signup")} style={linkStyle}>Sign Up</span>
            </p>
            <p style={{ ...footerStyle, marginTop: '6px', fontSize: '0.75rem' }}>
              Existing user with phone+password? <span onClick={() => reset("migrate-phone")} style={linkStyle}>Migrate to email</span>
            </p>
          </>
        )}

        {/* SIGNUP */}
        {mode === "signup" && (
          <>
            <form onSubmit={handleEmailSignup} style={formStyle}>
              <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} autoComplete="name" />
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} autoComplete="email" />
              <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} autoComplete="new-password" />
              <button type="submit" disabled={busy} style={primaryBtn(busy)}>{busy ? "Creating…" : "Create Account"}</button>
            </form>

            {showGoogleButton && (
              <>
                <div style={dividerStyle}><span style={dividerText}>or</span></div>
                <button type="button" onClick={handleGoogleSignIn} disabled={busy} style={googleBtn(busy)}>
                  <GoogleIcon /> Sign up with Google
                </button>
              </>
            )}

            <p style={footerStyle}>
              Already have an account? <span onClick={() => reset("login")} style={linkStyle}>Log In</span>
            </p>
          </>
        )}

        {/* FORGOT */}
        {mode === "forgot" && (
          <>
            <form onSubmit={handleForgot} style={formStyle}>
              <input type="email" placeholder="Your account email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
              <button type="submit" disabled={busy} style={primaryBtn(busy)}>{busy ? "Sending…" : "Send Reset Link"}</button>
              <button type="button" onClick={() => reset("login")} style={ghostBtn}>← Back to Login</button>
            </form>
          </>
        )}

        {/* VERIFY-SENT (after signup or after migration) */}
        {mode === "verify-sent" && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📧</div>
            <p style={{ ...subStyle, fontSize: '0.9rem' }}>
              Click the link in the email to verify, then come back and log in.
            </p>
            <button type="button" onClick={() => reset("login")} style={primaryBtn(false)}>Back to Login</button>
          </>
        )}

        {/* MIGRATE STEP 1: phone */}
        {mode === "migrate-phone" && step === "phone" && (
          <>
            <form onSubmit={handleMigrateSendOtp} style={formStyle}>
              <input type="tel" inputMode="numeric" maxLength={10} placeholder="Registered Phone Number" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} required style={inputStyle} />
              <button type="submit" disabled={busy} style={primaryBtn(busy)}>{busy ? "Sending…" : "Send OTP"}</button>
              <button type="button" onClick={() => reset("login")} style={ghostBtn}>← Cancel</button>
            </form>
          </>
        )}

        {/* MIGRATE STEP 2: otp */}
        {mode === "migrate-phone" && step === "otp" && (
          <form onSubmit={handleMigrateVerifyOtp} style={formStyle}>
            <input type="tel" inputMode="numeric" maxLength={6} placeholder="6-digit OTP" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} required style={otpInputStyle} />
            <button type="submit" disabled={busy} style={primaryBtn(busy)}>{busy ? "Verifying…" : "Verify"}</button>
            <button type="button" onClick={() => reset("migrate-phone")} style={ghostBtn}>← Change number</button>
          </form>
        )}

        {/* MIGRATE STEP 3: add email */}
        {mode === "migrate-email" && (
          <form onSubmit={handleMigrateAddEmail} style={formStyle}>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
            <input type="password" placeholder="New password for email login" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
            <button type="submit" disabled={busy} style={primaryBtn(busy)}>{busy ? "Linking…" : "Add Email & Continue"}</button>
          </form>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: 8, verticalAlign: 'middle' }} aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.12-.84 2.07-1.79 2.71v2.25h2.9c1.69-1.56 2.69-3.86 2.69-6.6z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.9-2.25c-.81.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.73H.96v2.34A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.95 10.7c-.18-.54-.28-1.12-.28-1.7s.1-1.16.28-1.7V4.96H.96A8.997 8.997 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.99-2.34z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.99 2.34C4.66 5.16 6.65 3.58 9 3.58z"/>
    </svg>
  );
}

// ===== styles =====
const pageWrap = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif', padding: '20px' };
const cardStyle = { backgroundColor: '#ffffff', padding: '40px 30px', borderRadius: '20px', width: '100%', maxWidth: '340px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' };
const titleStyle = { margin: '0 0 5px 0', color: '#2c3e50', fontSize: '1.5rem' };
const subStyle = { margin: '0 0 25px 0', color: '#7f8fa6', fontSize: '0.85rem' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };
const inputStyle = { padding: '14px', borderRadius: '8px', border: '1px solid #dcdde1', outline: 'none', backgroundColor: '#f5f6fa', fontSize: '1rem' };
const otpInputStyle = { ...inputStyle, letterSpacing: '0.4em', textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' };
const primaryBtn = (busy) => ({ padding: '15px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: busy ? 'not-allowed' : 'pointer', marginTop: '10px', boxShadow: '0 4px 6px rgba(22, 163, 74, 0.2)', opacity: busy ? 0.6 : 1 });
const secondaryBtn = { padding: '10px', backgroundColor: '#fff', color: '#16a34a', border: '1px solid #16a34a', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', marginTop: '8px', width: '100%' };
const googleBtn = (busy) => ({ padding: '13px', backgroundColor: '#fff', color: '#2c3e50', border: '1px solid #dcdde1', borderRadius: '8px', fontWeight: 600, fontSize: '0.95rem', cursor: busy ? 'not-allowed' : 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.6 : 1 });
const ghostBtn = { padding: '10px', backgroundColor: 'transparent', color: '#7f8fa6', border: 'none', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' };
const linkStyle = { color: '#16a34a', fontWeight: 'bold', cursor: 'pointer' };
const footerStyle = { marginTop: '20px', fontSize: '0.85rem', color: '#7f8fa6' };
const dividerStyle = { display: 'flex', alignItems: 'center', textAlign: 'center', margin: '20px 0 14px', color: '#cbd5e1' };
const dividerText = { flex: 'none', padding: '0 12px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' };
const statusBox = (status) => ({ backgroundColor: status.includes("✅") ? '#dcfce7' : status.includes("⏳") ? '#fef3c7' : '#fee2e2', color: status.includes("✅") ? '#166534' : status.includes("⏳") ? '#92400e' : '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '15px', fontWeight: 'bold' });

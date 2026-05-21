import React, { useState, useEffect, useCallback } from 'react';

// 7-day cooldown after dismissal — banner reappears later for users who weren't
// ready to install on first sight. Stored as an expiry timestamp so checking is
// a single comparison.
const DISMISS_KEY = 'packitout_install_dismissed_until';
const DISMISS_DAYS = 7;

function isStandalone() {
  if (typeof window === 'undefined') return false;
  // matchMedia covers Android/desktop installed PWAs; navigator.standalone
  // is the iOS-Safari-specific way to know we're launched from home screen.
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function isDismissed() {
  try {
    const until = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
    return Number.isFinite(until) && Date.now() < until;
  } catch { return false; }
}

export default function InstallAppBanner({ show = true }) {
  // The deferred beforeinstallprompt event — only Chromium browsers fire this.
  // We stash it on capture and replay later when the user taps Install.
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  // canShow gates rendering. Three reasons to never show: already installed,
  // recently dismissed, or neither a Chromium install prompt nor iOS Safari.
  const [canShow, setCanShow] = useState(false);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    const onBeforeInstallPrompt = (e) => {
      // Stop the browser's default mini-infobar — we surface our own banner.
      e.preventDefault();
      setDeferredPrompt(e);
      setCanShow(true);
    };

    const onAppInstalled = () => {
      setCanShow(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    // iOS Safari never fires beforeinstallprompt — show the banner for iOS
    // users so we can hand them instructions.
    if (isIOS()) setCanShow(true);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice?.outcome === 'accepted') setCanShow(false);
        setDeferredPrompt(null);
      } catch (err) { console.log('Install prompt error:', err); }
      return;
    }
    if (isIOS()) setShowIOSInstructions(true);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    try {
      const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(DISMISS_KEY, String(until));
    } catch { /* localStorage blocked in some incognito modes — ignore */ }
    setCanShow(false);
  }, []);

  if (!canShow || !show) return null;

  if (showIOSInstructions) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="How to install PackItOut on iOS"
        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ background: '#fff', borderRadius: '20px', maxWidth: '360px', width: '100%', padding: '24px', boxShadow: '0 20px 50px rgba(15,23,42,0.25)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>📲</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Install PackItOut</div>
          </div>
          <ol style={{ paddingLeft: '20px', color: '#475569', fontSize: '0.92rem', lineHeight: 1.7, margin: '0 0 18px' }}>
            <li>Tap the <strong>Share</strong> button at the bottom of Safari</li>
            <li>Scroll and tap <strong>Add to Home Screen</strong></li>
            <li>Tap <strong>Add</strong> in the top-right corner</li>
          </ol>
          <button
            onClick={() => setShowIOSInstructions(false)}
            style={{ width: '100%', padding: '12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Install PackItOut as an app"
      style={{
        position: 'fixed',
        bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
        left: '12px',
        right: '12px',
        background: 'linear-gradient(135deg, #16a34a, #15803d)',
        color: '#fff',
        borderRadius: '16px',
        padding: '12px 14px',
        boxShadow: '0 12px 28px rgba(22,163,74,0.32)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 1000,
        animation: 'pkInstallSlide 0.32s cubic-bezier(0.32,0.72,0,1)',
      }}
    >
      <style>{`
        @keyframes pkInstallSlide {
          from { transform: translateY(140%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div aria-hidden="true" style={{ flexShrink: 0, width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
        🛍️
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2 }}>Install PackItOut</div>
        <div style={{ fontSize: '0.78rem', opacity: 0.92, lineHeight: 1.3, marginTop: '2px' }}>
          Faster access + push alerts on your home screen.
        </div>
      </div>
      <button
        onClick={handleInstall}
        className="pio-press"
        style={{ background: '#fff', color: '#16a34a', border: 'none', borderRadius: '999px', padding: '9px 16px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}
      >
        Install
      </button>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss install prompt"
        style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: '999px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', cursor: 'pointer', flexShrink: 0, fontWeight: 700, lineHeight: 1 }}
      >
        ×
      </button>
    </div>
  );
}

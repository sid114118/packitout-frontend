import React, { useEffect } from 'react';

const SECTIONS = [
  {
    title: '1. Use of the App',
    body: 'PackItOut connects customers with nearby grocery and daily-essential shops. By using the app you confirm that the information you provide (name, phone, pincode, address) is accurate and that you are authorized to place orders from the registered account.',
  },
  {
    title: '2. Orders, Pricing & Pickup',
    body: 'Item prices, availability and offers are set by the shop you order from and may change without notice. The pickup time you select is a request — the shop will try its best, but actual fulfilment depends on store load. "Urgent" orders are best-effort and typically ready within 15 minutes.',
  },
  {
    title: '3. Payments & PackIt Coins',
    body: 'Payments are either sent directly to the shop via UPI at checkout, or paid in person when you pick up your order. PackItOut does not hold or settle your money — UPI transfers go straight to the shop. PackIt Coins are a loyalty reward, hold no monetary value outside the app, can be capped at 10% of an order, and may be revoked if obtained fraudulently.',
  },
  {
    title: '4. Cancellations & Refunds',
    body: 'You can cancel an order before the shop accepts it. Once accepted, cancellations are at the shop’s discretion. Because UPI payments go directly to the shop, any money refund is issued by the shop themselves; PackIt Coins are auto-returned to your balance.',
  },
  {
    title: '5. Customer Conduct',
    body: 'Abusive behaviour towards shop staff, repeated no-shows for pickup, or fraudulent payment attempts can result in account suspension. We may share order and account information with the shop or with law enforcement if required.',
  },
  {
    title: '6. Privacy',
    body: 'We collect only what is needed to operate the service — name, phone, address, order history, device push tokens. We do not sell personal data. Notifications can be turned off from your device settings.',
  },
  {
    title: '7. Liability',
    body: 'PackItOut is a marketplace platform. We are not responsible for the quality, packaging or expiry of products provided by partner shops, but we will help mediate disputes through the in-app complaint system.',
  },
  {
    title: '8. Changes to these Terms',
    body: 'We may update these terms occasionally. Continued use of the app after an update means you accept the revised version. Material changes will be highlighted in-app.',
  },
];

export default function TermsModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex: 1000, animation: 'tcFade 0.18s ease-out',
      }}
    >
      <style>{`
        @keyframes tcFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tcSlide { from { transform: translateY(20px); opacity: 0.6; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '640px', maxHeight: '85vh',
          background: '#fff', borderTopLeftRadius: '22px', borderTopRightRadius: '22px',
          display: 'flex', flexDirection: 'column',
          animation: 'tcSlide 0.22s ease-out',
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Legal</div>
            <h2 style={{ margin: '2px 0 0', color: '#0f172a', fontSize: '1.2rem', fontWeight: 900 }}>Terms &amp; Conditions</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: '#f1f5f9', border: 'none', width: '34px', height: '34px', borderRadius: '999px', cursor: 'pointer', fontSize: '1rem', fontWeight: 800, color: '#475569' }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '14px 20px 18px' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginBottom: '14px', background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            Last updated: May 2026. Please read these terms before placing an order.
          </div>
          {SECTIONS.map((s) => (
            <section key={s.title} style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '0.95rem', fontWeight: 800 }}>{s.title}</h3>
              <p style={{ margin: 0, color: '#475569', fontSize: '0.88rem', lineHeight: 1.55 }}>{s.body}</p>
            </section>
          ))}
          <div style={{ marginTop: '18px', padding: '12px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', color: '#166534', fontSize: '0.82rem', fontWeight: 700 }}>
            Questions or disputes? Open a complaint from your profile — we read every one.
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9' }}>
          <button
            onClick={onClose}
            style={{ width: '100%', padding: '14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 8px 22px rgba(22,163,74,0.28)' }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

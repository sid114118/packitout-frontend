import React, { useEffect, useState } from 'react';
import ComplaintReplyThread from '../ShopDashboard/ComplaintReplyThread';

const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

const CATEGORY_META = {
  shop: { icon: '🏪', label: 'Shop',  bg: '#fff1f2', fg: '#b91c1c', border: '#fecaca' },
  item: { icon: '🛒', label: 'Item',  bg: '#fef9c3', fg: '#854d0e', border: '#fde68a' },
  app:  { icon: '📱', label: 'App',   bg: '#eff6ff', fg: '#1d4ed8', border: '#bfdbfe' },
};

const STATUS_META = {
  open:     { label: 'Open',     bg: '#fef2f2', fg: '#b91c1c' },
  reviewed: { label: 'Reviewed', bg: '#fef9c3', fg: '#854d0e' },
  resolved: { label: 'Resolved', bg: '#ecfdf5', fg: '#15803d' },
};

export default function MyComplaintsModal({ open, onClose, user }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open || !user?._id) return;
    let cancelled = false;
    setLoading(true);
    fetch(`${BASE_URL}/complaints/user/${user._id}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (cancelled) return;
        setComplaints(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, user?._id]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex: 1000, animation: 'mcFade 0.18s ease-out',
      }}
    >
      <style>{`
        @keyframes mcFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes mcSlide { from { transform: translateY(20px); opacity: 0.6; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '640px', maxHeight: '92vh',
          background: '#f8fafc', borderTopLeftRadius: '22px', borderTopRightRadius: '22px',
          display: 'flex', flexDirection: 'column',
          animation: 'mcSlide 0.22s ease-out',
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #e2e8f0', background: '#fff', borderTopLeftRadius: '22px', borderTopRightRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Support</div>
            <h2 style={{ margin: '2px 0 0', color: '#0f172a', fontSize: '1.2rem', fontWeight: 900 }}>My Complaints</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: '#f1f5f9', border: 'none', width: '34px', height: '34px', borderRadius: '999px', cursor: 'pointer', fontSize: '1rem', fontWeight: 800, color: '#475569' }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable list */}
        <div style={{ overflowY: 'auto', padding: '14px 16px 18px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Loading…</div>
          ) : complaints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: '10px' }}>📭</div>
              <div style={{ fontWeight: 800, color: '#0f172a' }}>You haven't filed any complaints.</div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>Whenever something goes wrong, you can file one from your profile.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {complaints.map(c => {
                const cat = CATEGORY_META[c.targetType] || CATEGORY_META.app;
                const stMeta = STATUS_META[c.status || 'open'] || STATUS_META.open;
                const created = c.createdAt ? new Date(c.createdAt) : null;
                const shopName = c.shopId && typeof c.shopId === 'object' ? c.shopId.name : null;
                return (
                  <div key={c._id} style={{ background: '#fff', borderRadius: '14px', padding: '14px 16px', border: '1px solid #e2e8f0' }}>
                    {/* Top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ background: cat.bg, color: cat.fg, border: `1px solid ${cat.border}`, padding: '4px 10px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 800 }}>
                          {cat.icon} {cat.label}
                        </span>
                        <span style={{ background: stMeta.bg, color: stMeta.fg, padding: '4px 10px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 800 }}>
                          {stMeta.label}
                        </span>
                      </div>
                      {created && (
                        <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 700 }}>
                          {created.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      )}
                    </div>

                    {/* Target */}
                    {(shopName || c.itemName) && (
                      <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600, marginBottom: '6px' }}>
                        {shopName && <>About <span style={{ color: '#0f172a', fontWeight: 800 }}>{shopName}</span></>}
                        {c.itemName && <> · Item: <span style={{ color: '#0f172a', fontWeight: 800 }}>{c.itemName}</span></>}
                      </div>
                    )}

                    {/* Message */}
                    <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '10px 12px', color: '#0f172a', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {c.message}
                    </div>

                    <ComplaintReplyThread replies={c.replies} readOnly />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
